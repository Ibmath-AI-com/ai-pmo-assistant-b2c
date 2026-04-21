from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from db.models.workspace import Workspace, WorkspaceMember, WorkspaceSetting, WorkspaceTag, WorkspaceContentEntity
from db.models.user import User


class WorkspaceService:

    async def create(self, db: AsyncSession, data: dict, creator_user_id: uuid.UUID) -> Workspace:
        workspace = Workspace(
            workspace_id=uuid.uuid4(),
            creator_user_id=creator_user_id,
            workspace_code=data.get("workspace_code"),
            workspace_name=data["workspace_name"],
            entity_title=data.get("entity_title"),
            description=data.get("description"),
            is_template=data.get("is_template", False),
            metadata_json=data.get("metadata_json"),
            status="active",
            created_by=creator_user_id,
            updated_by=creator_user_id,
        )
        db.add(workspace)
        await db.flush()

        # Auto-add creator as owner
        member = WorkspaceMember(
            workspace_member_id=uuid.uuid4(),
            workspace_id=workspace.workspace_id,
            user_id=creator_user_id,
            member_role="owner",
            status="active",
        )
        db.add(member)
        await db.flush()
        return workspace

    async def list(self, db: AsyncSession, creator_user_id: uuid.UUID | None = None) -> list[Workspace]:
        stmt = select(Workspace).options(
            selectinload(Workspace.members),
            selectinload(Workspace.settings),
            selectinload(Workspace.tags),
        )
        if creator_user_id:
            stmt = stmt.where(Workspace.creator_user_id == creator_user_id)
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def get(self, db: AsyncSession, workspace_id: uuid.UUID) -> Workspace | None:
        stmt = (
            select(Workspace)
            .where(Workspace.workspace_id == workspace_id)
            .options(
                selectinload(Workspace.members),
                selectinload(Workspace.settings),
                selectinload(Workspace.tags),
                selectinload(Workspace.content_entities),
                selectinload(Workspace.persona_mappings),
            )
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def update(self, db: AsyncSession, workspace: Workspace, data: dict, updated_by: uuid.UUID) -> Workspace:
        for field in ("workspace_name", "workspace_code", "entity_title", "description", "is_template", "metadata_json"):
            if field in data:
                setattr(workspace, field, data[field])
        workspace.updated_by = updated_by
        workspace.updated_at = datetime.now(timezone.utc)
        await db.flush()
        return workspace

    async def set_status(self, db: AsyncSession, workspace: Workspace, status: str, updated_by: uuid.UUID) -> Workspace:
        workspace.status = status
        workspace.updated_by = updated_by
        workspace.updated_at = datetime.now(timezone.utc)
        await db.flush()
        return workspace

    async def add_member(self, db: AsyncSession, workspace_id: uuid.UUID, user_id: uuid.UUID, member_role: str) -> WorkspaceMember:
        # Verify user exists
        user_result = await db.execute(select(User).where(User.user_id == user_id))
        if user_result.scalar_one_or_none() is None:
            raise HTTPException(
                status_code=404,
                detail={"detail": f"User {user_id} not found", "error_code": "USER_NOT_FOUND", "user_id": str(user_id)},
            )

        # Remove existing membership for this user if any
        existing = await db.execute(
            select(WorkspaceMember).where(
                WorkspaceMember.workspace_id == workspace_id,
                WorkspaceMember.user_id == user_id,
            )
        )
        existing_member = existing.scalar_one_or_none()
        if existing_member:
            existing_member.member_role = member_role
            await db.flush()
            return existing_member

        member = WorkspaceMember(
            workspace_member_id=uuid.uuid4(),
            workspace_id=workspace_id,
            user_id=user_id,
            member_role=member_role,
            status="active",
        )
        db.add(member)
        await db.flush()
        return member

    async def remove_member(self, db: AsyncSession, workspace_id: uuid.UUID, user_id: uuid.UUID) -> bool:
        result = await db.execute(
            select(WorkspaceMember).where(
                WorkspaceMember.workspace_id == workspace_id,
                WorkspaceMember.user_id == user_id,
            )
        )
        member = result.scalar_one_or_none()
        if not member:
            return False
        await db.delete(member)
        await db.flush()
        return True

    async def upsert_settings(self, db: AsyncSession, workspace_id: uuid.UUID, settings: list[dict], updated_by: uuid.UUID) -> list[WorkspaceSetting]:
        result_rows = []
        for item in settings:
            existing = await db.execute(
                select(WorkspaceSetting).where(
                    WorkspaceSetting.workspace_id == workspace_id,
                    WorkspaceSetting.setting_key == item["setting_key"],
                )
            )
            row = existing.scalar_one_or_none()
            if row:
                row.setting_value = item.get("setting_value")
                row.value_type = item.get("value_type", row.value_type)
                row.updated_by = updated_by
            else:
                row = WorkspaceSetting(
                    workspace_setting_id=uuid.uuid4(),
                    workspace_id=workspace_id,
                    setting_key=item["setting_key"],
                    setting_value=item.get("setting_value"),
                    value_type=item.get("value_type"),
                    updated_by=updated_by,
                )
                db.add(row)
            result_rows.append(row)
        await db.flush()
        return result_rows

    async def set_default_persona(self, db: AsyncSession, workspace: Workspace, persona_id: uuid.UUID | None, updated_by: uuid.UUID) -> Workspace:
        workspace.default_persona_id = persona_id
        workspace.updated_by = updated_by
        workspace.updated_at = datetime.now(timezone.utc)
        await db.flush()
        return workspace
