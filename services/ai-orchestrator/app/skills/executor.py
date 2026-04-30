from __future__ import annotations

import time
import uuid
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from db.models.skill import Skill, SkillExecutionLog


async def execute_skill(
    db: AsyncSession,
    skill: Skill,
    context: dict,
    ai_run_id: uuid.UUID | None = None,
    persona_id: uuid.UUID | None = None,
    user_id: uuid.UUID | None = None,
) -> dict:
    start = time.monotonic()
    try:
        from app.skills.builtin import get_skill_handler
        handler = get_skill_handler(skill.skill_code)
        if handler:
            output = await handler(skill.skill_config_json, context)
        else:
            output = context

        elapsed_ms = int((time.monotonic() - start) * 1000)
        log = SkillExecutionLog(
            execution_log_id=uuid.uuid4(),
            skill_id=skill.skill_id,
            ai_run_id=ai_run_id,
            persona_id=persona_id,
            user_id=user_id,
            execution_time_ms=elapsed_ms,
            input_data={"context_keys": list(context.keys())},
            output_data={"output_keys": list(output.keys()) if isinstance(output, dict) else []},
            quality_score=1.0,
            status="success",
        )
        db.add(log)
        await db.flush()
        return output
    except Exception as e:
        elapsed_ms = int((time.monotonic() - start) * 1000)
        log = SkillExecutionLog(
            execution_log_id=uuid.uuid4(),
            skill_id=skill.skill_id,
            ai_run_id=ai_run_id,
            persona_id=persona_id,
            user_id=user_id,
            execution_time_ms=elapsed_ms,
            status="failed",
            error_message=str(e),
        )
        db.add(log)
        await db.flush()
        return context
