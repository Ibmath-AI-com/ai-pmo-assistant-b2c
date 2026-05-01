from __future__ import annotations

import uuid
from sqlalchemy.ext.asyncio import AsyncSession

from app.skills.registry import get_skills_for_persona
from app.skills.executor import execute_skill


class SkillEngine:
    async def execute_pre_processing(
        self,
        db: AsyncSession,
        persona_id: uuid.UUID,
        context: dict,
        ai_run_id: uuid.UUID | None = None,
        user_id: uuid.UUID | None = None,
    ) -> dict:
        skills = await get_skills_for_persona(db, persona_id)
        for skill in skills["pre_processing"]:
            context = await execute_skill(db, skill, context, ai_run_id, persona_id, user_id)
        return context

    async def execute_post_processing(
        self,
        db: AsyncSession,
        persona_id: uuid.UUID,
        response: dict,
        ai_run_id: uuid.UUID | None = None,
        user_id: uuid.UUID | None = None,
    ) -> dict:
        skills = await get_skills_for_persona(db, persona_id)
        for skill in skills["post_processing"]:
            response = await execute_skill(db, skill, response, ai_run_id, persona_id, user_id)
        return response
