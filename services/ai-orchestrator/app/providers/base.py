from __future__ import annotations

from abc import ABC, abstractmethod
from typing import AsyncGenerator


class BaseLLMProvider(ABC):
    """Abstract base for all LLM provider adapters."""

    @abstractmethod
    async def generate(
        self,
        messages: list[dict],
        model: str,
        temperature: float = 0.7,
        max_tokens: int = 2048,
        stream: bool = False,
    ) -> str | AsyncGenerator[str, None]:
        """Generate a response. Returns full string or async generator for streaming."""

    @abstractmethod
    async def count_tokens(self, text: str, model: str) -> int:
        """Estimate token count for text."""
