from uuid import UUID
from datetime import datetime

from fastapi import APIRouter, Depends, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from auth.dependencies import CurrentUser, get_current_user
from db.base import get_db
from app.services import chat_service as svc
from app.events.publishers import publish_event

router = APIRouter()


class SessionCreate(BaseModel):
    persona_id: UUID | None = None
    workspace_id: UUID | None = None
    title: str | None = Field(None, max_length=500)


class SessionUpdate(BaseModel):
    title: str | None = Field(None, max_length=500)
    status: str | None = None
    persona_id: UUID | None = None


def _session_out(s, include_messages: bool = False) -> dict:
    out = {
        "chat_session_id": str(s.chat_session_id),
        "user_id": str(s.user_id),
        "persona_id": str(s.persona_id) if s.persona_id else None,
        "workspace_id": str(s.workspace_id) if s.workspace_id else None,
        "title": s.title,
        "status": s.status,
        "created_at": s.created_at.isoformat() if s.created_at else None,
        "updated_at": s.updated_at.isoformat() if s.updated_at else None,
    }
    if include_messages and hasattr(s, "messages"):
        out["messages"] = [_message_out(m) for m in (s.messages or [])]
    return out


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


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_session(
    body: SessionCreate,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    session = await svc.create_session(db, current_user.user_id, body.model_dump())
    await db.commit()
    await publish_event("chat.session.created", {"session_id": str(session.chat_session_id)})
    return _session_out(session)


@router.get("")
async def list_sessions(
    limit: int = Query(default=20, ge=1, le=100),
    skip: int = Query(default=0, ge=0),
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    sessions = await svc.list_sessions(db, current_user.user_id, limit=limit, skip=skip)
    return [_session_out(s) for s in sessions]


@router.get("/{session_id}")
async def get_session(
    session_id: UUID,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    session = await svc.get_session(db, session_id, current_user.user_id)
    return _session_out(session, include_messages=True)


@router.put("/{session_id}")
async def update_session(
    session_id: UUID,
    body: SessionUpdate,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    session = await svc.get_session(db, session_id, current_user.user_id)
    updated = await svc.update_session(db, session, body.model_dump(exclude_none=True))
    await db.commit()
    return _session_out(updated)


@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def archive_session(
    session_id: UUID,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    session = await svc.get_session(db, session_id, current_user.user_id)
    await svc.update_session(db, session, {"status": "archived"})
    await db.commit()
