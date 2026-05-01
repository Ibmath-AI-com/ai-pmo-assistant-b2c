import logging
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[4] / "shared"))

import httpx
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse, StreamingResponse

from config.settings import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)

router = APIRouter()

# Service registry — maps path prefix to backend URL
SERVICE_MAP = {
    "/api/v1/auth":          "http://localhost:8001",
    "/api/v1/users":         "http://localhost:8001",
    "/api/v1/personas":      "http://localhost:8002",
    "/api/v1/workspaces":    "http://localhost:8002",
    "/api/v1/skills":        "http://localhost:8002",
    "/api/v1/chat":          "http://localhost:8003",
    "/api/v1/ai":            "http://localhost:8004",
    "/api/v1/prompts":       "http://localhost:8004",
    "/api/v1/knowledge":     "http://localhost:8005",
    "/api/v1/files":         "http://localhost:8005",
    "/api/v1/templates":     "http://localhost:8006",
    "/api/v1/reports":       "http://localhost:8006",
    "/api/v1/projects":      "http://localhost:8008",
    "/api/v1/packages":      "http://localhost:8009",
    "/api/v1/billing":       "http://localhost:8009",
    "/api/v1/notifications": "http://localhost:8009",
}


def _resolve_service(path: str) -> str | None:
    for prefix, url in SERVICE_MAP.items():
        if path.startswith(prefix):
            return url
    return None


async def _proxy(request: Request, target_url: str):
    headers = dict(request.headers)
    headers.pop("host", None)

    # Attach user context from middleware state
    headers["x-user-id"] = getattr(request.state, "user_id", "")
    headers["x-tenant-type"] = "B2C"

    body = await request.body()
    full_url = target_url + str(request.url.path) + (f"?{request.url.query}" if request.url.query else "")

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.request(
                method=request.method,
                url=full_url,
                headers=headers,
                content=body,
            )
        return StreamingResponse(
            content=resp.aiter_bytes(),
            status_code=resp.status_code,
            headers=dict(resp.headers),
        )
    except httpx.ConnectError:
        logger.error("Service unavailable: %s", target_url)
        return JSONResponse(
            status_code=503,
            content={"detail": f"Service unavailable: {target_url}"},
        )
    except httpx.TimeoutException:
        logger.error("Service timeout: %s", target_url)
        return JSONResponse(
            status_code=504,
            content={"detail": f"Service timeout: {target_url}"},
        )


@router.api_route("/api/v1/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
async def proxy_handler(request: Request, path: str):
    full_path = f"/api/v1/{path}"
    target = _resolve_service(full_path)

    if not target:
        return JSONResponse(
            status_code=404,
            content={"detail": f"No service mapped for path: {full_path}"},
        )

    return await _proxy(request, target)
