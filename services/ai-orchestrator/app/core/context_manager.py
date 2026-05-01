from __future__ import annotations

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from db.models.chat import ChatMessage


class ContextManager:
    DEFAULT_MAX_TOKENS = 6000
    CHARS_PER_TOKEN = 4

    async def build_context(
        self,
        db: AsyncSession,
        session_id: UUID,
        max_tokens: int = DEFAULT_MAX_TOKENS,
    ) -> list[dict]:
        stmt = (
            select(ChatMessage)
            .where(ChatMessage.session_id == session_id)
            .order_by(desc(ChatMessage.created_at))
            .limit(50)
        )
        result = await db.execute(stmt)
        messages = list(reversed(result.scalars().all()))

        budget = max_tokens * self.CHARS_PER_TOKEN
        selected = []
        for msg in reversed(messages):
            cost = len(msg.content)
            if budget - cost < 0:
                break
            budget -= cost
            selected.insert(0, {"role": msg.role, "content": msg.content})

        return selected

    async def summarize_history(self, messages: list[dict]) -> str:
        if not messages:
            return ""
        texts = [f"{m['role'].upper()}: {m['content']}" for m in messages]
        return f"[Earlier conversation summary: {len(messages)} messages exchanged covering: {texts[0][:100]}...]"
