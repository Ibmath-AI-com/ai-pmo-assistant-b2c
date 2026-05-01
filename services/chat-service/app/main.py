import sys
import uuid
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "shared"))

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from config.settings import get_settings

settings = get_settings()

app = FastAPI(
    title="Chat Service",
    version="1.0.0",
    docs_url="/docs" if settings.app_env != "production" else None,
)

if settings.app_env in ("development", "local"):
    from auth.dependencies import CurrentUser, get_current_user
    from auth.jwt import decode_token

    _DEV_USER = CurrentUser(user_id=uuid.UUID("00000000-0000-0000-0000-000000000001"))
    _optional_bearer = HTTPBearer(auto_error=False)

    def _dev_get_current_user(
        credentials: HTTPAuthorizationCredentials | None = Depends(_optional_bearer),
    ) -> CurrentUser:
        if credentials:
            try:
                payload = decode_token(credentials.credentials)
                if payload.get("type") == "access":
                    return CurrentUser(user_id=uuid.UUID(payload["sub"]))
            except Exception:
                pass
        return _DEV_USER

    app.dependency_overrides[get_current_user] = _dev_get_current_user

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "chat-service"}


from app.api.sessions import router as sessions_router
from app.api.messages import router as messages_router
from app.api.attachments import router as attachments_router
from app.api.internal import router as internal_router
from app.websocket.chat_handler import router as ws_router

app.include_router(sessions_router, prefix="/api/v1/chat/sessions", tags=["sessions"])
app.include_router(messages_router, prefix="/api/v1/chat/sessions", tags=["messages"])
app.include_router(attachments_router, prefix="/api/v1/chat", tags=["attachments"])
app.include_router(internal_router, prefix="/internal", tags=["internal"])
app.include_router(ws_router, prefix="/api/v1/ws", tags=["websocket"])
