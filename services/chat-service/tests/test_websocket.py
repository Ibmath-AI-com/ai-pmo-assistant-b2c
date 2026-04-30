"""WebSocket tests using starlette TestClient with service-level mocks."""
import sys
import uuid
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "shared"))


FAKE_SESSION_OBJ = MagicMock()
FAKE_SESSION_OBJ.persona_id = None


async def _fake_db_gen():
    """Async generator that yields a mock DB session."""
    db = AsyncMock()
    db.commit = AsyncMock()
    yield db


def _make_fake_message(*args, **kwargs):
    msg = MagicMock()
    msg.message_id = uuid.uuid4()
    return msg


def _make_app():
    """Build the chat-service app with all external deps mocked out."""
    from app.main import app
    return app


@pytest.fixture
def ws_client():
    """TestClient with DB and service calls mocked so WebSocket never touches PG."""
    from starlette.testclient import TestClient

    app = _make_app()
    patches = [
        patch("app.websocket.chat_handler.get_db", _fake_db_gen),
        patch("app.services.chat_service.get_session", new=AsyncMock(return_value=FAKE_SESSION_OBJ)),
        patch("app.services.chat_service.add_message", new=AsyncMock(side_effect=_make_fake_message)),
        patch("app.services.chat_service._bump_session_updated", new=AsyncMock()),
        patch("app.events.publishers.publish_event", new=AsyncMock()),
    ]
    for p in patches:
        p.start()
    with TestClient(app, raise_server_exceptions=False) as c:
        yield c
    for p in patches:
        p.stop()


@pytest.fixture
def session_id():
    return str(uuid.uuid4())


def test_websocket_connect_receives_connected(ws_client, session_id):
    with ws_client.websocket_connect(f"/api/v1/ws/chat/{session_id}") as ws:
        msg = ws.receive_json()
        assert msg["type"] == "connected"
        assert msg["session_id"] == session_id


def test_websocket_ping_pong(ws_client, session_id):
    with ws_client.websocket_connect(f"/api/v1/ws/chat/{session_id}") as ws:
        ws.receive_json()  # connected
        ws.send_json({"type": "ping"})
        pong = ws.receive_json()
        assert pong["type"] == "pong"


def test_websocket_invalid_json_returns_error(ws_client, session_id):
    with ws_client.websocket_connect(f"/api/v1/ws/chat/{session_id}") as ws:
        ws.receive_json()  # connected
        ws.send_text("not valid json {{{{")
        err = ws.receive_json()
        assert err["type"] == "error"


def test_websocket_send_message_returns_message_saved(ws_client, session_id):
    with ws_client.websocket_connect(f"/api/v1/ws/chat/{session_id}") as ws:
        ws.receive_json()  # connected
        ws.send_json({"type": "message", "content": "Hello, PMO assistant!"})
        saved = ws.receive_json()
        assert saved["type"] == "message_saved"
        assert saved["role"] == "user"
        assert saved["content"] == "Hello, PMO assistant!"
        assert "message_id" in saved


def test_websocket_empty_message_not_echoed(ws_client, session_id):
    """Empty content messages are silently dropped (no message_saved reply)."""
    with ws_client.websocket_connect(f"/api/v1/ws/chat/{session_id}") as ws:
        ws.receive_json()  # connected
        ws.send_json({"type": "message", "content": "   "})
        # confirm channel is still alive
        ws.send_json({"type": "ping"})
        pong = ws.receive_json()
        assert pong["type"] == "pong"
