"""Tests for GenerationPipeline — full pipeline with mocked LLM provider."""
import sys
import uuid
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "shared"))


FAKE_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000002")
FAKE_SESSION_ID = uuid.uuid4()


@pytest.fixture
def mock_llm_response():
    """Patch LLMRouter.route to return an internal provider that returns a canned response."""
    from app.providers.base import BaseLLMProvider
    from app.core.llm_router import RouteDecision

    fake_provider = MagicMock(spec=BaseLLMProvider)
    fake_provider.generate = AsyncMock(return_value="Here is your risk assessment summary.")

    decision = RouteDecision(
        provider="anthropic",
        model="claude-sonnet-4-5",
        provider_instance=fake_provider,
    )
    return decision, fake_provider


@pytest.mark.asyncio
async def test_pipeline_returns_string_response(db, mock_llm_response):
    decision, fake_provider = mock_llm_response

    with patch("app.core.generation_pipeline.LLMRouter.route", return_value=decision):
        from app.core.generation_pipeline import GenerationPipeline
        pipeline = GenerationPipeline()
        result = await pipeline.run(
            db=db,
            user_id=FAKE_USER_ID,
            session_id=None,
            user_message="Summarize the project risks.",
            persona_id=None,
            stream=False,
        )

    assert isinstance(result, str)
    assert "risk" in result.lower()
    fake_provider.generate.assert_called_once()


@pytest.mark.asyncio
async def test_pipeline_blocks_pii_input(db):
    """Messages with PII should be blocked and return a policy message."""
    from app.core.generation_pipeline import GenerationPipeline
    pipeline = GenerationPipeline()

    result = await pipeline.run(
        db=db,
        user_id=FAKE_USER_ID,
        session_id=None,
        user_message="My SSN is 123-45-6789, help me with my project.",
        persona_id=None,
        stream=False,
    )

    assert isinstance(result, str)
    assert "unable to process" in result.lower() or "policy" in result.lower()


@pytest.mark.asyncio
async def test_pipeline_saves_ai_run(db, mock_llm_response):
    """Verify that an AIRun record is persisted after generation."""
    from sqlalchemy import select
    from db.models.ai import AIRun
    decision, _ = mock_llm_response

    with patch("app.core.generation_pipeline.LLMRouter.route", return_value=decision):
        from app.core.generation_pipeline import GenerationPipeline
        pipeline = GenerationPipeline()
        await pipeline.run(
            db=db,
            user_id=FAKE_USER_ID,
            session_id=None,
            user_message="What is a RAID log?",
            persona_id=None,
            stream=False,
        )
        await db.flush()

    # Query all AIRun records (avoid UUID WHERE clause on SQLite)
    result = await db.execute(select(AIRun))
    runs = result.scalars().all()
    assert len(runs) >= 1
    assert any(r.model_used == "claude-sonnet-4-5" for r in runs)


@pytest.mark.asyncio
async def test_pipeline_saves_generated_output(db, mock_llm_response):
    """Verify that a GeneratedOutput record is persisted after generation."""
    from sqlalchemy import select
    from db.models.ai import GeneratedOutput, AIRun
    decision, _ = mock_llm_response

    with patch("app.core.generation_pipeline.LLMRouter.route", return_value=decision):
        from app.core.generation_pipeline import GenerationPipeline
        pipeline = GenerationPipeline()
        await pipeline.run(
            db=db,
            user_id=FAKE_USER_ID,
            session_id=None,
            user_message="Generate a project charter.",
            persona_id=None,
            stream=False,
        )
        await db.flush()

    result = await db.execute(select(GeneratedOutput))
    outputs = result.scalars().all()
    assert any(o.content == "Here is your risk assessment summary." for o in outputs)


@pytest.mark.asyncio
async def test_pipeline_rag_retrieval_called(db, mock_llm_response):
    """RAG retrieve is called when no persona/chat_mode is set (defaults to RAG mode)."""
    decision, _ = mock_llm_response

    with (
        patch("app.core.generation_pipeline.LLMRouter.route", return_value=decision),
        patch("app.core.rag_pipeline.RAGPipeline.retrieve", new=AsyncMock(return_value=[])) as mock_retrieve,
    ):
        from app.core.generation_pipeline import GenerationPipeline
        pipeline = GenerationPipeline()
        await pipeline.run(
            db=db,
            user_id=FAKE_USER_ID,
            session_id=None,
            user_message="What does the knowledge base say about risk?",
            persona_id=None,
            stream=False,
        )

    mock_retrieve.assert_called_once()


@pytest.mark.asyncio
async def test_pipeline_prompt_contains_user_message(db, mock_llm_response):
    """The messages passed to LLM must include the user's message content."""
    decision, fake_provider = mock_llm_response
    captured_messages = []

    async def _capture_generate(messages, model, **kwargs):
        captured_messages.extend(messages)
        return "Response text."

    fake_provider.generate = _capture_generate

    with patch("app.core.generation_pipeline.LLMRouter.route", return_value=decision):
        from app.core.generation_pipeline import GenerationPipeline
        pipeline = GenerationPipeline()
        await pipeline.run(
            db=db,
            user_id=FAKE_USER_ID,
            session_id=None,
            user_message="Explain the agile methodology.",
            persona_id=None,
            stream=False,
        )

    user_messages = [m for m in captured_messages if m.get("role") == "user"]
    assert any("agile methodology" in m.get("content", "") for m in user_messages)
