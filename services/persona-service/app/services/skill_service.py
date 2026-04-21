from __future__ import annotations

import uuid

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from db.models.skill import Skill, SkillPersonaMapping


class SkillService:

    async def list_for_persona(
        self, db: AsyncSession, persona_id: uuid.UUID
    ) -> list[SkillPersonaMapping]:
        stmt = (
            select(SkillPersonaMapping)
            .where(SkillPersonaMapping.persona_id == persona_id)
            .options(selectinload(SkillPersonaMapping.skill))
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def get_mapping(
        self, db: AsyncSession, persona_id: uuid.UUID, skill_id: uuid.UUID, *, with_skill: bool = False
    ) -> SkillPersonaMapping | None:
        stmt = select(SkillPersonaMapping).where(
            SkillPersonaMapping.persona_id == persona_id,
            SkillPersonaMapping.skill_id == skill_id,
        )
        if with_skill:
            stmt = stmt.options(selectinload(SkillPersonaMapping.skill))
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def map(
        self,
        db: AsyncSession,
        persona_id: uuid.UUID,
        skill_id: uuid.UUID,
        priority_order: int = 1,
        is_auto_trigger: bool = False,
        trigger_condition: dict | None = None,
    ) -> SkillPersonaMapping:
        skill = await db.execute(select(Skill).where(Skill.skill_id == skill_id))
        if skill.scalar_one_or_none() is None:
            raise HTTPException(
                status_code=404,
                detail={"detail": "Skill not found", "error_code": "SKILL_NOT_FOUND", "skill_id": str(skill_id)},
            )

        existing = await self.get_mapping(db, persona_id, skill_id, with_skill=True)
        if existing:
            existing.priority_order = priority_order
            existing.is_auto_trigger = is_auto_trigger
            existing.trigger_condition = trigger_condition
            await db.flush()
            return existing

        mapping = SkillPersonaMapping(
            skill_persona_mapping_id=uuid.uuid4(),
            persona_id=persona_id,
            skill_id=skill_id,
            priority_order=priority_order,
            is_auto_trigger=is_auto_trigger,
            trigger_condition=trigger_condition,
        )
        db.add(mapping)
        await db.flush()
        return await self.get_mapping(db, persona_id, skill_id, with_skill=True)

    async def unmap(
        self, db: AsyncSession, persona_id: uuid.UUID, skill_id: uuid.UUID
    ) -> bool:
        mapping = await self.get_mapping(db, persona_id, skill_id)
        if not mapping:
            return False
        await db.delete(mapping)
        await db.flush()
        return True
