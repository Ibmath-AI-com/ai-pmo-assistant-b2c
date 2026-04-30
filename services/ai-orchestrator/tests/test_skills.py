"""Tests for the Skills system — built-in skill handlers, executor, and engine."""
import sys
import uuid
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "shared"))


# --- Built-in skill handler unit tests (no DB needed) ---

@pytest.mark.asyncio
async def test_pmo_analysis_injects_rag_filters():
    from app.skills.builtin.pmo_analysis import pmo_analysis
    ctx = {"query": "project health check"}
    result = await pmo_analysis({}, ctx)
    assert "rag_filters" in result
    assert "PMO" in result["rag_filters"]["domain_tags"]
    assert "skill_instructions" in result


@pytest.mark.asyncio
async def test_risk_assessment_injects_risk_filters():
    from app.skills.builtin.risk_assessment import risk_assessment
    ctx = {"query": "identify risks"}
    result = await risk_assessment({}, ctx)
    assert "rag_filters" in result
    assert any("Risk" in tag for tag in result["rag_filters"]["domain_tags"])
    assert "skill_instructions" in result


@pytest.mark.asyncio
async def test_report_generator_injects_instructions():
    from app.skills.builtin.report_generator import report_generator
    ctx = {"query": "generate status report"}
    result = await report_generator({}, ctx)
    assert "skill_instructions" in result


@pytest.mark.asyncio
async def test_strategy_evaluator_injects_instructions():
    from app.skills.builtin.strategy_evaluator import strategy_evaluator
    ctx = {"query": "evaluate strategy"}
    result = await strategy_evaluator({}, ctx)
    assert "skill_instructions" in result


@pytest.mark.asyncio
async def test_template_filler_injects_instructions():
    from app.skills.builtin.template_filler import template_filler
    ctx = {"query": "fill template"}
    result = await template_filler({}, ctx)
    assert "skill_instructions" in result


@pytest.mark.asyncio
async def test_data_extractor_injects_instructions():
    from app.skills.builtin.data_extractor import data_extractor
    ctx = {"query": "extract data"}
    result = await data_extractor({}, ctx)
    assert "skill_instructions" in result


def test_builtin_registry_has_all_six_skills():
    from app.skills.builtin import get_skill_handler
    skill_codes = [
        "pmo_analysis", "risk_assessment", "report_generator",
        "strategy_evaluator", "template_filler", "data_extractor",
    ]
    for code in skill_codes:
        assert get_skill_handler(code) is not None, f"Missing handler for {code}"


def test_registry_returns_none_for_unknown_skill():
    from app.skills.builtin import get_skill_handler
    assert get_skill_handler("nonexistent_skill") is None


# --- Executor tests ---

@pytest.mark.asyncio
async def test_execute_skill_calls_handler_and_logs(db):
    from db.models.skill import Skill, SkillExecutionLog
    from app.skills.executor import execute_skill
    from sqlalchemy import select

    skill = Skill(
        skill_id=uuid.uuid4(),
        skill_code="pmo_analysis",
        skill_name="PMO Analysis",
        skill_type="domain_expert",
        status="active",
    )
    db.add(skill)
    await db.flush()

    context = {"query": "health check"}
    result = await execute_skill(db, skill, context)

    assert "skill_instructions" in result

    logs = (await db.execute(select(SkillExecutionLog).where(SkillExecutionLog.skill_id == skill.skill_id))).scalars().all()
    assert len(logs) == 1
    assert logs[0].status == "success"


@pytest.mark.asyncio
async def test_execute_skill_unknown_code_returns_context(db):
    """Unknown skill code should return context unchanged (no handler found)."""
    from db.models.skill import Skill
    from app.skills.executor import execute_skill

    skill = Skill(
        skill_id=uuid.uuid4(),
        skill_code="unknown_skill_xyz",
        skill_name="Unknown",
        skill_type="domain_expert",
        status="active",
    )
    db.add(skill)
    await db.flush()

    context = {"query": "test", "custom_key": "preserved"}
    result = await execute_skill(db, skill, context)
    assert result["custom_key"] == "preserved"
