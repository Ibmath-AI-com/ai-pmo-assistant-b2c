from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from auth.dependencies import CurrentUser, get_current_user
from db.base import get_db
from app.services import chat_service as svc
from app.events.publishers import publish_event

router = APIRouter()


class MessageCreate(BaseModel):
    content: str
    metadata: dict | None = None


def _message_out(m) -> dict:
    return {
        "message_id": str(m.message_id),
        "session_id": str(m.session_id),
        "role": m.role,
        "content": m.content,
        "token_count": m.token_count,
        "status": m.status,
        "created_at": m.created_at.isoformat() if m.created_at else None,
    }


@router.post("/{session_id}/messages", status_code=status.HTTP_201_CREATED)
async def send_message(
    session_id: UUID,
    body: MessageCreate,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await svc.get_session(db, session_id, current_user.user_id)
    msg = await svc.add_message(db, session_id, "user", body.content, body.metadata)
    await db.commit()
    await publish_event("chat.message.created", {
        "session_id": str(session_id),
        "message_id": str(msg.message_id),
        "user_id": str(current_user.user_id),
    })
    return _message_out(msg)


@router.get("/{session_id}/messages")
async def get_messages(
    session_id: UUID,
    limit: int = Query(default=50, ge=1, le=200),
    skip: int = Query(default=0, ge=0),
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await svc.get_session(db, session_id, current_user.user_id)
    messages = await svc.list_messages(db, session_id, limit=limit, skip=skip)
    return [_message_out(m) for m in messages]
