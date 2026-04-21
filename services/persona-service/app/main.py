import sys
from pathlib import Path

# Add shared library to path
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "shared"))

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config.settings import get_settings

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Import all models so SQLAlchemy registers them
    import db.models.workspace  # noqa: F401
    import db.models.persona  # noqa: F401
    import db.models.skill  # noqa: F401
    yield


app = FastAPI(
    title="Workspace & Persona Service",
    version="1.0.0",
    docs_url="/docs" if settings.app_env != "production" else None,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "persona-service"}


from app.api.workspaces import router as workspaces_router
from app.api.personas import router as personas_router
from app.api.behavior import router as behavior_router
from app.api.model_policy import router as model_policy_router
from app.api.access import router as access_router
from app.api.skills import router as skills_router

app.include_router(workspaces_router, prefix="/api/v1/workspaces", tags=["workspaces"])
app.include_router(personas_router, prefix="/api/v1/personas", tags=["personas"])
app.include_router(behavior_router, prefix="/api/v1/personas", tags=["behavior"])
app.include_router(model_policy_router, prefix="/api/v1/personas", tags=["model-policy"])
app.include_router(access_router, prefix="/api/v1/personas", tags=["access"])
app.include_router(skills_router, prefix="/api/v1/personas", tags=["skills"])
