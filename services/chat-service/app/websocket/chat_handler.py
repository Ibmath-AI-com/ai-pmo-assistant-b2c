from __future__ import annotations

import json
import uuid

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.ext.asyncio import AsyncSession

from auth.jwt import decode_token
from db.base import get_db
from app.websocket.connection_manager import manager
from app.services import chat_service as svc
from app.events.publishers import publish_event

router = APIRouter()


async def _get_user_id(token: str | None) -> uuid.UUID | None:
    if not token:
        return None
    try:
        payload = decode_token(token)
        if payload.get("type") == "access":
            return uuid.UUID(payload["sub"])
    except Exception:
        pass
    return None


@router.websocket("/chat/{session_id}")
async def websocket_chat(
    session_id: uuid.UUID,
    websocket: WebSocket,
    token: str | None = Query(default=None),
):
    user_id = await _get_user_id(token)
    if user_id is None:
        user_id = uuid.UUID("00000000-0000-0000-0000-000000000001")

    session_key = str(session_id)
    await manager.connect(session_key, websocket)

    try:
        async for db in get_db():
            try:
                session = await svc.get_session(db, session_id, user_id)
            except Exception:
                await websocket.send_json({"type": "error", "message": "Session not found or access denied"})
                await websocket.close(code=4004)
                return

            await websocket.send_json({"type": "connected", "session_id": session_key})

            while True:
                try:
                    raw = await websocket.receive_text()
                    data = json.loads(raw)
                except WebSocketDisconnect:
                    break
                except json.JSONDecodeError:
                    await websocket.send_json({"type": "error", "message": "Invalid JSON"})
                    continue

                msg_type = data.get("type", "message")

                if msg_type == "message":
                    content = data.get("content", "").strip()
                    if not content:
                        continue

                    msg = await svc.add_message(db, session_id, "user", content)
                    await db.commit()

                    await websocket.send_json({
                        "type": "message_saved",
                        "message_id": str(msg.message_id),
                        "role": "user",
                        "content": content,
                    })

                    await publish_event("chat.message.created", {
                        "session_id": session_key,
                        "message_id": str(msg.message_id),
                        "user_id": str(user_id),
                        "persona_id": str(session.persona_id) if session.persona_id else None,
                        "content": content,
                    })

                elif msg_type == "ping":
                    await websocket.send_json({"type": "pong"})

    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect(session_key, websocket)
