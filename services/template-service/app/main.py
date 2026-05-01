import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "shared"))

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config.settings import get_settings

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    import db.models.template  # noqa: F401  registers Template ORM models
    yield


app = FastAPI(
    title="Template Service",
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
    return {"status": "ok", "service": "template-service"}


from app.api.templates import router as templates_router
from app.api.custom import router as custom_router
from app.api.generation import router as generation_router
from app.api.exports import router as exports_router

app.include_router(templates_router, prefix="/api/v1/templates", tags=["templates"])
app.include_router(custom_router, prefix="/api/v1/templates", tags=["custom-templates"])
app.include_router(generation_router, prefix="/api/v1", tags=["generation"])
app.include_router(exports_router, prefix="/api/v1/generated", tags=["exports"])
