"""Internal-only endpoints used by other services (no auth required)."""
from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel

from app.websocket.connection_manager import manager

router = APIRouter()


class NotifyPayload(BaseModel):
    type: str
    content: str | None = None
    session_id: str | None = None
    chunk: str | None = None


@router.post("/notify/{session_id}", status_code=204)
async def notify_session(session_id: str, payload: NotifyPayload) -> None:
    await manager.send_to_session(session_id, payload.model_dump(exclude_none=True))
