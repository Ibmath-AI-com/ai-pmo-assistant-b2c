from __future__ import annotations

import os
from dataclasses import dataclass

from app.providers.openai_provider import OpenAIProvider
from app.providers.anthropic_provider import AnthropicProvider
from app.providers.internal_provider import InternalProvider
from app.providers.base import BaseLLMProvider


@dataclass
class RouteDecision:
    provider: str
    model: str
    provider_instance: BaseLLMProvider


class LLMRouter:
    """
    7 chat modes from persona_model_policy.chat_mode:
      1. internal_only       — vLLM only
      2. external_openai     — GPT-4o
      3. external_anthropic  — Claude
      4. rag_internal_llm    — RAG + internal LLM (default)
      5. rag_external_openai — RAG + GPT-4o
      6. rag_external_anthropic — RAG + Claude
      7. auto                — auto-select based on data classification
    """

    MODES = {
        "internal_only", "external_openai", "external_anthropic",
        "rag_internal_llm", "rag_external_openai", "rag_external_anthropic", "auto",
    }

    def __init__(self):
        self._openai: OpenAIProvider | None = None
        self._anthropic: AnthropicProvider | None = None
        self._internal: InternalProvider | None = None

    def _get_openai(self) -> OpenAIProvider:
        if self._openai is None:
            self._openai = OpenAIProvider()
        return self._openai

    def _get_anthropic(self) -> AnthropicProvider:
        if self._anthropic is None:
            self._anthropic = AnthropicProvider()
        return self._anthropic

    def _get_internal(self) -> InternalProvider:
        if self._internal is None:
            self._internal = InternalProvider()
        return self._internal

    def route(
        self,
        chat_mode: str | None = None,
        data_classification: str | None = None,
        preferred_model: str | None = None,
    ) -> RouteDecision:
        mode = chat_mode or "rag_external_anthropic"

        if mode == "auto":
            if data_classification in ("Confidential", "Restricted"):
                mode = "internal_only"
            else:
                mode = "rag_external_anthropic"

        if mode in ("internal_only", "rag_internal_llm"):
            model = preferred_model or InternalProvider.DEFAULT_MODEL
            return RouteDecision("internal", model, self._get_internal())

        if mode in ("external_openai", "rag_external_openai"):
            model = preferred_model or "gpt-4o-mini"
            return RouteDecision("openai", model, self._get_openai())

        if mode in ("external_anthropic", "rag_external_anthropic"):
            model = preferred_model or AnthropicProvider.DEFAULT_MODEL
            return RouteDecision("anthropic", model, self._get_anthropic())

        # fallback
        return RouteDecision("anthropic", AnthropicProvider.DEFAULT_MODEL, self._get_anthropic())
