from __future__ import annotations

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from db.models.skill import Skill, SkillPersonaMapping


async def get_skills_for_persona(db: AsyncSession, persona_id: UUID) -> dict[str, list[Skill]]:
    stmt = (
        select(SkillPersonaMapping)
        .where(SkillPersonaMapping.persona_id == persona_id)
        .options(selectinload(SkillPersonaMapping.skill))
        .order_by(SkillPersonaMapping.priority_order)
    )
    result = await db.execute(stmt)
    mappings = result.scalars().all()

    pre = []
    post = []
    for mapping in mappings:
        skill = mapping.skill
        if skill.status != "active":
            continue
        if skill.skill_type in ("rag_filter", "domain_expert", "prompt_chain"):
            pre.append(skill)
        else:
            post.append(skill)

    return {"pre_processing": pre, "post_processing": post}
