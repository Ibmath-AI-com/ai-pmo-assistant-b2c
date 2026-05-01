from __future__ import annotations

import json
import os
import uuid

import httpx
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.ext.asyncio import AsyncSession

from auth.jwt import decode_token
from db.base import get_db
from app.websocket.connection_manager import manager
from app.services import chat_service as svc
from app.events.publishers import publish_event

router = APIRouter()

_AI_SERVICE_URL = os.getenv("AI_SERVICE_URL", "http://localhost:8004")


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


async def _call_ai(
    session_id: str,
    user_id: str,
    persona_id: str | None,
    content: str,
) -> str | None:
    """Call AI orchestrator internal endpoint directly and return the response text."""
    url = f"{_AI_SERVICE_URL}/internal/generate"
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(url, json={
                "session_id": session_id,
                "user_id": user_id,
                "persona_id": persona_id,
                "message": content,
            })
            if resp.status_code == 200:
                return resp.json().get("response")
    except Exception as e:
        print(f"[chat-handler] AI call failed: {e}")
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

                    # Save user message
                    msg = await svc.add_message(db, session_id, "user", content)
                    await db.commit()

                    await websocket.send_json({
                        "type": "message_saved",
                        "message_id": str(msg.message_id),
                        "role": "user",
                        "content": content,
                    })

                    # Publish async event for analytics/audit (fire-and-forget)
                    await publish_event("chat.message.created", {
                        "session_id": session_key,
                        "message_id": str(msg.message_id),
                        "user_id": str(user_id),
                        "persona_id": str(session.persona_id) if session.persona_id else None,
                        "content": content,
                    })

                    # Call AI orchestrator directly and stream the response back
                    response_text = await _call_ai(
                        session_id=session_key,
                        user_id=str(user_id),
                        persona_id=str(session.persona_id) if session.persona_id else None,
                        content=content,
                    )

                    if response_text:
                        # Save AI message
                        ai_msg = await svc.add_message(db, session_id, "assistant", response_text)
                        await db.commit()

                        await websocket.send_json({
                            "type": "ai_response",
                            "content": response_text,
                            "session_id": session_key,
                            "message_id": str(ai_msg.message_id),
                        })
                    else:
                        await websocket.send_json({
                            "type": "error",
                            "message": "AI service unavailable. Please try again.",
                        })

                elif msg_type == "ping":
                    await websocket.send_json({"type": "pong"})

    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect(session_key, websocket)
