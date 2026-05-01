import sys
import uuid
from pathlib import Path

# Add shared library to path
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "shared"))

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from config.settings import get_settings

settings = get_settings()

app = FastAPI(
    title="Knowledge Service",
    version="1.0.0",
    docs_url="/docs" if settings.app_env != "production" else None,
)

# ── Dev-mode auth bypass ──────────────────────────────────────────────────────
# When app_env == 'development', replace get_current_user with a version that
# falls back to a hardcoded dev user when no valid token is provided.
# This lets the frontend work without logging in during local development.
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
    return {"status": "ok", "service": "knowledge-service"}


# Routers registered as they are built
from app.api.files import router as files_router
from app.api.collections import router as collections_router
from app.api.documents import router as documents_router
from app.api.governance import router as governance_router
from app.api.tags import router as tags_router
from app.api.jobs import router as jobs_router
from app.api.references import router as references_router

app.include_router(files_router, prefix="/api/v1/files", tags=["files"])
app.include_router(collections_router, prefix="/api/v1/knowledge/collections", tags=["collections"])
app.include_router(documents_router, prefix="/api/v1/knowledge/documents", tags=["documents"])
app.include_router(governance_router, prefix="/api/v1/knowledge/documents", tags=["governance"])
app.include_router(tags_router, prefix="/api/v1/knowledge/documents", tags=["tags"])
app.include_router(jobs_router, prefix="/api/v1/knowledge/jobs", tags=["jobs"])
app.include_router(references_router, prefix="/api/v1/knowledge", tags=["references"])
