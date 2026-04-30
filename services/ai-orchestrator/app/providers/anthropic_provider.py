from __future__ import annotations

import os
from typing import AsyncGenerator

import anthropic

from .base import BaseLLMProvider


class AnthropicProvider(BaseLLMProvider):
    DEFAULT_MODEL = "claude-sonnet-4-6"

    def __init__(self, api_key: str | None = None):
        self._client = anthropic.AsyncAnthropic(api_key=api_key or os.getenv("ANTHROPIC_API_KEY"))

    def _split_messages(self, messages: list[dict]) -> tuple[str | None, list[dict]]:
        system = None
        chat = []
        for m in messages:
            if m["role"] == "system":
                system = m["content"]
            else:
                chat.append(m)
        return system, chat

    async def generate(
        self,
        messages: list[dict],
        model: str = DEFAULT_MODEL,
        temperature: float = 0.7,
        max_tokens: int = 2048,
        stream: bool = False,
    ) -> str | AsyncGenerator[str, None]:
        system, chat = self._split_messages(messages)
        kwargs = dict(model=model, max_tokens=max_tokens, messages=chat)
        if system:
            kwargs["system"] = system

        if stream:
            return self._stream(kwargs, temperature)

        response = await self._client.messages.create(**kwargs)
        return response.content[0].text if response.content else ""

    async def _stream(self, kwargs: dict, temperature: float) -> AsyncGenerator[str, None]:
        async with self._client.messages.stream(**kwargs) as stream:
            async for text in stream.text_stream:
                yield text

    async def count_tokens(self, text: str, model: str = DEFAULT_MODEL) -> int:
        return len(text) // 4
