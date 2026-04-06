import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "shared"))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config.settings import get_settings
from app.middleware.auth import JWTAuthMiddleware
from app.middleware.rate_limit import RateLimitMiddleware
from app.middleware.tenant import TenantMiddleware
from app.routes.proxy import router as proxy_router

settings = get_settings()

app = FastAPI(
    title="AI PMO - Gateway",
    version="1.0.0",
    docs_url="/docs" if settings.app_env != "production" else None,
)

# Middleware — order matters: CORS → RateLimit → JWT → Tenant
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(RateLimitMiddleware)
app.add_middleware(JWTAuthMiddleware)
app.add_middleware(TenantMiddleware)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "gateway"}


app.include_router(proxy_router)
