from __future__ import annotations

import os
from typing import AsyncGenerator

from openai import AsyncOpenAI

from .base import BaseLLMProvider


class OpenAIProvider(BaseLLMProvider):
    DEFAULT_MODEL = "gpt-4o-mini"

    def __init__(self, api_key: str | None = None):
        self._client = AsyncOpenAI(api_key=api_key or os.getenv("OPENAI_API_KEY"))

    async def generate(
        self,
        messages: list[dict],
        model: str = DEFAULT_MODEL,
        temperature: float = 0.7,
        max_tokens: int = 2048,
        stream: bool = False,
    ) -> str | AsyncGenerator[str, None]:
        if stream:
            return self._stream(messages, model, temperature, max_tokens)
        response = await self._client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        return response.choices[0].message.content or ""

    async def _stream(
        self, messages: list[dict], model: str, temperature: float, max_tokens: int
    ) -> AsyncGenerator[str, None]:
        async with await self._client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
            stream=True,
        ) as stream:
            async for chunk in stream:
                delta = chunk.choices[0].delta.content
                if delta:
                    yield delta

    async def count_tokens(self, text: str, model: str = DEFAULT_MODEL) -> int:
        try:
            import tiktoken
            enc = tiktoken.encoding_for_model(model)
            return len(enc.encode(text))
        except Exception:
            return len(text) // 4
