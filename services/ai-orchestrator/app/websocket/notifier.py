"""Sends messages to WebSocket clients via the chat-service internal endpoint."""
from __future__ import annotations

import os

import httpx

_CHAT_SERVICE_URL = os.getenv("CHAT_SERVICE_URL", "http://localhost:8003")


async def notify_session(session_id: str, data: dict) -> None:
    url = f"{_CHAT_SERVICE_URL}/internal/notify/{session_id}"
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            await client.post(url, json=data)
    except Exception:
        pass
