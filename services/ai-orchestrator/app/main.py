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
    title="AI Orchestrator",
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
    return {"status": "ok", "service": "ai-orchestrator"}


from app.api.generate import router as generate_router
from app.api.prompts import router as prompts_router
from app.api.feedback import router as feedback_router

app.include_router(generate_router, prefix="/api/v1/ai", tags=["generate"])
app.include_router(prompts_router, prefix="/api/v1/prompts", tags=["prompts"])
app.include_router(feedback_router, prefix="/api/v1/ai/feedback", tags=["feedback"])
