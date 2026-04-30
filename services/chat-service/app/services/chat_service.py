from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from db.models.chat import ChatSession, ChatMessage, ChatAttachment


async def create_session(db: AsyncSession, user_id: uuid.UUID, data: dict) -> ChatSession:
    session = ChatSession(
        chat_session_id=uuid.uuid4(),
        user_id=user_id,
        persona_id=data.get("persona_id"),
        workspace_id=data.get("workspace_id"),
        title=data.get("title", "New Chat"),
        status="active",
    )
    db.add(session)
    await db.flush()
    return session


async def list_sessions(
    db: AsyncSession, user_id: uuid.UUID, limit: int = 20, skip: int = 0
) -> list[ChatSession]:
    stmt = (
        select(ChatSession)
        .where(ChatSession.user_id == user_id, ChatSession.status != "deleted")
        .order_by(desc(ChatSession.updated_at))
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def get_session(db: AsyncSession, session_id: uuid.UUID, user_id: uuid.UUID) -> ChatSession:
    stmt = (
        select(ChatSession)
        .where(ChatSession.chat_session_id == session_id)
        .options(selectinload(ChatSession.messages))
    )
    result = await db.execute(stmt)
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    if session.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return session


async def update_session(db: AsyncSession, session: ChatSession, data: dict) -> ChatSession:
    for field in ("title", "status", "persona_id"):
        if field in data and data[field] is not None:
            setattr(session, field, data[field])
    session.updated_at = datetime.now(timezone.utc)
    await db.flush()
    return session


async def add_message(
    db: AsyncSession, session_id: uuid.UUID, role: str, content: str, metadata: dict | None = None
) -> ChatMessage:
    msg = ChatMessage(
        message_id=uuid.uuid4(),
        session_id=session_id,
        role=role,
        content=content,
        status="sent",
        metadata_json=metadata,
    )
    db.add(msg)
    await db.flush()
    await _bump_session_updated(db, session_id)
    return msg


async def list_messages(
    db: AsyncSession, session_id: uuid.UUID, limit: int = 50, skip: int = 0
) -> list[ChatMessage]:
    stmt = (
        select(ChatMessage)
        .where(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at)
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def _bump_session_updated(db: AsyncSession, session_id: uuid.UUID) -> None:
    stmt = select(ChatSession).where(ChatSession.chat_session_id == session_id)
    result = await db.execute(stmt)
    session = result.scalar_one_or_none()
    if session:
        session.updated_at = datetime.now(timezone.utc)
        await db.flush()


async def add_attachment(
    db: AsyncSession, session_id: uuid.UUID, message_id: uuid.UUID | None, file_id: uuid.UUID | None,
    attachment_type: str, original_file_name: str | None
) -> ChatAttachment:
    att = ChatAttachment(
        attachment_id=uuid.uuid4(),
        session_id=session_id,
        message_id=message_id,
        file_id=file_id,
        attachment_type=attachment_type,
        original_file_name=original_file_name,
    )
    db.add(att)
    await db.flush()
    return att


async def list_attachments(db: AsyncSession, session_id: uuid.UUID) -> list[ChatAttachment]:
    stmt = select(ChatAttachment).where(ChatAttachment.session_id == session_id)
    result = await db.execute(stmt)
    return list(result.scalars().all())
