from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from db.models.persona import (
    Persona,
    PersonaAllowedModel,
    PersonaBehaviorSetting,
    PersonaDomainTag,
    PersonaKnowledgeCollection,
    PersonaModelPolicy,
    PersonaWorkspaceMapping,
)


class PersonaService:

    def _eager(self):
        """Full eager load — used for detail/edit views."""
        return [
            selectinload(Persona.domain_tags),
            selectinload(Persona.behavior_setting),
            selectinload(Persona.model_policy),
            selectinload(Persona.workspace_mappings),
            selectinload(Persona.allowed_models),
            selectinload(Persona.knowledge_collections),
        ]

    async def create(self, db: AsyncSession, data: dict, created_by: uuid.UUID) -> Persona:
        persona = Persona(
            persona_id=uuid.uuid4(),
            user_id=data.get("user_id"),
            persona_code=data["persona_code"],
            persona_name=data["persona_name"],
            persona_category=data["persona_category"],
            short_description=data.get("short_description"),
            avatar_file_id=data.get("avatar_file_id"),
            is_system_persona=data.get("is_system_persona", False),
            status="active",
            created_by=created_by,
            updated_by=created_by,
        )
        db.add(persona)
        await db.flush()
        return persona

    async def list(
        self,
        db: AsyncSession,
        user_id: uuid.UUID | None = None,
        category: str | None = None,
        status: str | None = None,
    ) -> list[Persona]:
        stmt = select(Persona)
        conditions = []
        if user_id:
            conditions.append(
                or_(Persona.user_id == user_id, Persona.is_system_persona.is_(True))
            )
        if category:
            conditions.append(Persona.persona_category == category)
        if status:
            conditions.append(Persona.status == status)
        for cond in conditions:
            stmt = stmt.where(cond)
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def get(self, db: AsyncSession, persona_id: uuid.UUID) -> Persona | None:
        stmt = (
            select(Persona)
            .where(Persona.persona_id == persona_id)
            .options(*self._eager())
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def update(self, db: AsyncSession, persona: Persona, data: dict, updated_by: uuid.UUID) -> Persona:
        for field in ("persona_name", "persona_code", "persona_category", "short_description", "avatar_file_id", "is_system_persona"):
            if field in data and data[field] is not None:
                setattr(persona, field, data[field])
        persona.updated_by = updated_by
        persona.updated_at = datetime.now(timezone.utc)
        await db.flush()
        return persona

    async def set_status(self, db: AsyncSession, persona: Persona, new_status: str, updated_by: uuid.UUID) -> Persona:
        persona.status = new_status
        persona.updated_by = updated_by
        persona.updated_at = datetime.now(timezone.utc)
        await db.flush()
        return persona

    async def upsert_behavior(self, db: AsyncSession, persona_id: uuid.UUID, data: dict) -> PersonaBehaviorSetting:
        result = await db.execute(
            select(PersonaBehaviorSetting).where(PersonaBehaviorSetting.persona_id == persona_id)
        )
        setting = result.scalar_one_or_none()
        if setting:
            for field in ("system_instruction", "tone_of_voice", "response_format_preference", "default_language", "temperature", "max_response_length"):
                if field in data:
                    setattr(setting, field, data[field])
        else:
            setting = PersonaBehaviorSetting(
                persona_behavior_setting_id=uuid.uuid4(),
                persona_id=persona_id,
                **{k: v for k, v in data.items() if k in (
                    "system_instruction", "tone_of_voice", "response_format_preference",
                    "default_language", "temperature", "max_response_length"
                )},
            )
            db.add(setting)
        await db.flush()
        return setting

    async def upsert_model_policy(self, db: AsyncSession, persona_id: uuid.UUID, data: dict) -> PersonaModelPolicy:
        result = await db.execute(
            select(PersonaModelPolicy).where(PersonaModelPolicy.persona_id == persona_id)
        )
        policy = result.scalar_one_or_none()
        if policy:
            for field in (
                "default_model_id",
                "chat_mode",
                "use_rag",
                "use_internal_llm",
                "use_external_llm",
                "classification_limit",
                "allow_file_upload",
                "allow_external_sources",
            ):
                if field in data:
                    setattr(policy, field, data[field])
        else:
            policy = PersonaModelPolicy(
                persona_model_policy_id=uuid.uuid4(),
                persona_id=persona_id,
                **{k: v for k, v in data.items() if k in (
                    "default_model_id",
                    "chat_mode",
                    "use_rag",
                    "use_internal_llm",
                    "use_external_llm",
                    "classification_limit",
                    "allow_file_upload",
                    "allow_external_sources",
                )},
            )
            db.add(policy)
        await db.flush()
        await db.refresh(policy)
        return policy

    async def set_domain_tags(self, db: AsyncSession, persona_id: uuid.UUID, tags: list[dict]) -> list[PersonaDomainTag]:
        # Replace existing tags
        existing = await db.execute(
            select(PersonaDomainTag).where(PersonaDomainTag.persona_id == persona_id)
        )
        for row in existing.scalars().all():
            await db.delete(row)
        await db.flush()

        result = []
        for tag in tags:
            row = PersonaDomainTag(
                persona_domain_tag_id=uuid.uuid4(),
                persona_id=persona_id,
                tag_name=tag["tag_name"],
                tag_type=tag.get("tag_type", "domain"),
            )
            db.add(row)
            result.append(row)
        await db.flush()
        return result

    async def map_to_workspace(self, db: AsyncSession, persona_id: uuid.UUID, workspace_id: uuid.UUID, is_default: bool = False) -> PersonaWorkspaceMapping:
        existing = await db.execute(
            select(PersonaWorkspaceMapping).where(
                PersonaWorkspaceMapping.persona_id == persona_id,
                PersonaWorkspaceMapping.workspace_id == workspace_id,
            )
        )
        mapping = existing.scalar_one_or_none()
        if mapping:
            mapping.is_default = is_default
        else:
            mapping = PersonaWorkspaceMapping(
                persona_workspace_mapping_id=uuid.uuid4(),
                persona_id=persona_id,
                workspace_id=workspace_id,
                is_default=is_default,
                status="active",
            )
            db.add(mapping)
        await db.flush()
        return mapping

    async def unmap_from_workspace(self, db: AsyncSession, persona_id: uuid.UUID, workspace_id: uuid.UUID) -> bool:
        result = await db.execute(
            select(PersonaWorkspaceMapping).where(
                PersonaWorkspaceMapping.persona_id == persona_id,
                PersonaWorkspaceMapping.workspace_id == workspace_id,
            )
        )
        mapping = result.scalar_one_or_none()
        if not mapping:
            return False
        await db.delete(mapping)
        await db.flush()
        return True

    async def set_allowed_models(
        self, db: AsyncSession, persona_id: uuid.UUID, models: list[dict]
    ) -> list[PersonaAllowedModel]:
        existing = await db.execute(
            select(PersonaAllowedModel).where(PersonaAllowedModel.persona_id == persona_id)
        )
        for row in existing.scalars().all():
            await db.delete(row)
        await db.flush()

        rows: list[PersonaAllowedModel] = []
        for item in models:
            row = PersonaAllowedModel(
                persona_allowed_model_id=uuid.uuid4(),
                persona_id=persona_id,
                model_id=item["model_id"],
                priority_order=item.get("priority_order", 1),
                is_default=item.get("is_default", False),
            )
            db.add(row)
            rows.append(row)
        await db.flush()
        return rows

    async def set_knowledge_collections(
        self, db: AsyncSession, persona_id: uuid.UUID, collection_ids: list[uuid.UUID]
    ) -> list[PersonaKnowledgeCollection]:
        existing = await db.execute(
            select(PersonaKnowledgeCollection).where(PersonaKnowledgeCollection.persona_id == persona_id)
        )
        for row in existing.scalars().all():
            await db.delete(row)
        await db.flush()

        rows: list[PersonaKnowledgeCollection] = []
        for cid in collection_ids:
            row = PersonaKnowledgeCollection(
                persona_knowledge_collection_id=uuid.uuid4(),
                persona_id=persona_id,
                knowledge_collection_id=cid,
            )
            db.add(row)
            rows.append(row)
        await db.flush()
        return rows
