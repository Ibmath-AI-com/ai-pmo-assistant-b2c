from __future__ import annotations

import uuid
from datetime import datetime

from fastapi import HTTPException
from fastapi import status as http_status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from db.models.template import CustomizeTemplate, Template, TemplateFamily, TemplateFileMapping, TemplateVersion


class TemplateService:

    def _eager(self):
        return [
            selectinload(Template.family),
            selectinload(Template.versions),
            selectinload(Template.file_mappings),
        ]

    async def list_families(self, db: AsyncSession) -> list[TemplateFamily]:
        result = await db.execute(select(TemplateFamily).order_by(TemplateFamily.name))
        return list(result.scalars().all())

    async def create(self, db: AsyncSession, data: dict, created_by: uuid.UUID) -> Template:
        template = Template(
            template_id=uuid.uuid4(),
            user_id=created_by,
            template_code=data["template_code"],
            template_name=data["template_name"],
            description=data.get("description"),
            template_body=data.get("template_body"),
            output_format=data.get("output_format"),
            template_family_id=data.get("template_family_id"),
            persona_id=data.get("persona_id"),
            is_system=data.get("is_system", False),
            status=data.get("status", "active"),
            created_by=created_by,
        )
        db.add(template)
        await db.flush()
        return await self.get_by_id(db, template.template_id)

    async def list(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
        status: str | None = None,
        family_id: uuid.UUID | None = None,
    ) -> list[Template]:
        stmt = select(Template).options(*self._eager())
        if status:
            stmt = stmt.where(Template.status == status)
        if family_id:
            stmt = stmt.where(Template.template_family_id == family_id)
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def get(self, db: AsyncSession, template_id: uuid.UUID) -> Template:
        stmt = (
            select(Template)
            .options(*self._eager())
            .where(Template.template_id == template_id)
        )
        result = await db.execute(stmt)
        template = result.scalar_one_or_none()
        if not template:
            raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail="Template not found")
        return template

    async def get_by_id(self, db: AsyncSession, template_id: uuid.UUID) -> Template:
        stmt = select(Template).options(*self._eager()).where(Template.template_id == template_id)
        result = await db.execute(stmt)
        template = result.scalar_one_or_none()
        if not template:
            raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail="Template not found")
        return template

    async def update(self, db: AsyncSession, template_id: uuid.UUID, data: dict, updated_by: uuid.UUID) -> Template:
        template = await self.get(db, template_id)
        await self._snapshot_version(db, template, updated_by)
        for field in ("template_name", "description", "template_body", "output_format", "template_family_id", "persona_id"):
            if field in data:
                setattr(template, field, data[field])
        await db.flush()
        return await self.get_by_id(db, template_id)

    async def update_status(self, db: AsyncSession, template_id: uuid.UUID, new_status: str, updated_by: uuid.UUID) -> Template:
        template = await self.get(db, template_id)
        template.status = new_status
        await db.flush()
        return await self.get_by_id(db, template_id)

    async def _snapshot_version(self, db: AsyncSession, template: Template, created_by: uuid.UUID) -> TemplateVersion:
        stmt = select(TemplateVersion).where(TemplateVersion.template_id == template.template_id)
        result = await db.execute(stmt)
        existing = result.scalars().all()
        next_no = max((v.version_no for v in existing), default=0) + 1
        version = TemplateVersion(
            template_version_id=uuid.uuid4(),
            template_id=template.template_id,
            uploaded_by_id=created_by,
            version_no=next_no,
            template_body=template.template_body,
            status="active",
            created_by=created_by,
        )
        db.add(version)
        await db.flush()
        return version

    # --- Versioning ---

    async def list_versions(self, db: AsyncSession, template_id: uuid.UUID) -> list[TemplateVersion]:
        await self.get(db, template_id)
        stmt = (
            select(TemplateVersion)
            .where(TemplateVersion.template_id == template_id)
            .order_by(TemplateVersion.version_no.desc())
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def get_version(self, db: AsyncSession, template_id: uuid.UUID, version_id: uuid.UUID) -> TemplateVersion:
        await self.get(db, template_id)
        stmt = select(TemplateVersion).where(
            TemplateVersion.template_version_id == version_id,
            TemplateVersion.template_id == template_id,
        )
        result = await db.execute(stmt)
        version = result.scalar_one_or_none()
        if not version:
            raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail="Version not found")
        return version

    async def save_version(self, db: AsyncSession, template_id: uuid.UUID, data: dict, created_by: uuid.UUID) -> TemplateVersion:
        template = await self.get(db, template_id)
        version = await self._snapshot_version(db, template, created_by)
        if data.get("effective_from"):
            version.effective_from = datetime.fromisoformat(data["effective_from"])
        return version

    async def restore_version(self, db: AsyncSession, template_id: uuid.UUID, version_id: uuid.UUID, updated_by: uuid.UUID) -> Template:
        template = await self.get(db, template_id)
        version = await self.get_version(db, template_id, version_id)
        await self._snapshot_version(db, template, updated_by)
        template.template_body = version.template_body
        await db.flush()
        return await self.get_by_id(db, template_id)

    # --- File mappings ---

    async def set_file_mappings(self, db: AsyncSession, template_id: uuid.UUID, mappings: list[dict]) -> list[TemplateFileMapping]:
        template = await self.get(db, template_id)
        stmt = select(TemplateFileMapping).where(TemplateFileMapping.template_id == template_id)
        result = await db.execute(stmt)
        for old in result.scalars().all():
            await db.delete(old)
        await db.flush()
        new_mappings = []
        for m in mappings:
            fm = TemplateFileMapping(
                template_file_mapping_id=uuid.uuid4(),
                template_id=template.template_id,
                file_id=m["file_id"],
                chat_session_id=m.get("chat_session_id"),
            )
            db.add(fm)
            new_mappings.append(fm)
        await db.flush()
        return new_mappings

    # --- Customize templates ---

    async def get_custom(self, db: AsyncSession, template_id: uuid.UUID, user_id: uuid.UUID) -> CustomizeTemplate | None:
        stmt = (
            select(CustomizeTemplate)
            .join(TemplateVersion, CustomizeTemplate.template_version_id == TemplateVersion.template_version_id)
            .where(
                TemplateVersion.template_id == template_id,
                CustomizeTemplate.user_id == user_id,
                CustomizeTemplate.status == "active",
            )
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def create_custom(self, db: AsyncSession, template_id: uuid.UUID, data: dict, created_by: uuid.UUID) -> CustomizeTemplate:
        await self.get(db, template_id)
        existing = await self.get_custom(db, template_id, created_by)
        if existing:
            raise HTTPException(status_code=http_status.HTTP_409_CONFLICT, detail="Customize template already exists for this user")
        custom = CustomizeTemplate(
            customize_template_id=uuid.uuid4(),
            template_version_id=data["template_version_id"],
            user_id=created_by,
            workspace_id=data.get("workspace_id"),
            custom_name=data.get("custom_name"),
            custom_body=data.get("custom_body"),
            status="active",
        )
        db.add(custom)
        await db.flush()
        return custom

    async def update_custom(self, db: AsyncSession, template_id: uuid.UUID, data: dict, user_id: uuid.UUID) -> CustomizeTemplate:
        custom = await self.get_custom(db, template_id, user_id)
        if not custom:
            raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail="Customize template not found")
        for field in ("custom_name", "custom_body", "workspace_id"):
            if field in data:
                setattr(custom, field, data[field])
        await db.flush()
        await db.refresh(custom)
        return custom
