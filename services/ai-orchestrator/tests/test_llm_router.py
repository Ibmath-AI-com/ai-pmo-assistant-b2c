"""Unit tests for LLMRouter — all 7 routing modes, lazy init, auto-routing."""
import sys
import os
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "shared"))

# Set dummy API keys so provider constructors don't raise at import time
os.environ.setdefault("OPENAI_API_KEY", "sk-test-dummy")
os.environ.setdefault("ANTHROPIC_API_KEY", "sk-ant-test-dummy")


@pytest.fixture
def router():
    from app.core.llm_router import LLMRouter
    return LLMRouter()


def test_internal_only_routes_to_internal(router):
    decision = router.route(chat_mode="internal_only")
    assert decision.provider == "internal"


def test_external_openai_routes_to_openai(router):
    decision = router.route(chat_mode="external_openai")
    assert decision.provider == "openai"
    assert "gpt" in decision.model


def test_external_anthropic_routes_to_anthropic(router):
    decision = router.route(chat_mode="external_anthropic")
    assert decision.provider == "anthropic"
    assert "claude" in decision.model


def test_rag_internal_llm_routes_to_internal(router):
    decision = router.route(chat_mode="rag_internal_llm")
    assert decision.provider == "internal"


def test_rag_external_openai_routes_to_openai(router):
    decision = router.route(chat_mode="rag_external_openai")
    assert decision.provider == "openai"


def test_rag_external_anthropic_routes_to_anthropic(router):
    decision = router.route(chat_mode="rag_external_anthropic")
    assert decision.provider == "anthropic"


def test_auto_confidential_routes_to_internal(router):
    decision = router.route(chat_mode="auto", data_classification="Confidential")
    assert decision.provider == "internal"


def test_auto_restricted_routes_to_internal(router):
    decision = router.route(chat_mode="auto", data_classification="Restricted")
    assert decision.provider == "internal"


def test_auto_public_routes_to_anthropic(router):
    decision = router.route(chat_mode="auto", data_classification="Public")
    assert decision.provider == "anthropic"


def test_none_mode_defaults_to_anthropic(router):
    decision = router.route(chat_mode=None)
    assert decision.provider == "anthropic"


def test_preferred_model_overrides_default(router):
    decision = router.route(chat_mode="external_openai", preferred_model="gpt-4o")
    assert decision.model == "gpt-4o"


def test_providers_lazily_initialized(router):
    """Providers should not be created at construction time."""
    assert router._openai is None
    assert router._anthropic is None
    assert router._internal is None


def test_provider_created_on_first_use(router):
    router.route(chat_mode="internal_only")
    assert router._internal is not None
    # Other providers still not created
    assert router._openai is None
    assert router._anthropic is None


def test_provider_instance_reused(router):
    """Same provider instance returned on repeated calls."""
    d1 = router.route(chat_mode="internal_only")
    d2 = router.route(chat_mode="rag_internal_llm")
    assert d1.provider_instance is d2.provider_instance
