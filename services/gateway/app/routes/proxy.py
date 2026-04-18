import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[4] / "shared"))

import httpx
from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse

from config.settings import get_settings

settings = get_settings()

router = APIRouter()

# Service registry — maps path prefix to backend URL
SERVICE_MAP = {
    "/api/v1/auth":          f"http://localhost:8001",
    "/api/v1/users":         f"http://localhost:8001",
    "/api/v1/organizations": f"http://localhost:8001",
    "/api/v1/departments":   f"http://localhost:8001",
    "/api/v1/roles":         f"http://localhost:8001",
    "/api/v1/personas":      f"http://localhost:8002",
    "/api/v1/workspaces":    f"http://localhost:8002",
    "/api/v1/skills":        f"http://localhost:8002",
    "/api/v1/chat":          f"http://localhost:8003",
    "/api/v1/ai":            f"http://localhost:8004",
    "/api/v1/prompts":       f"http://localhost:8004",
    "/api/v1/knowledge":     f"http://localhost:8005",
    "/api/v1/templates":     f"http://localhost:8006",
    "/api/v1/reports":       f"http://localhost:8006",
    "/api/v1/admin":         f"http://localhost:8007",
    "/api/v1/packages":      f"http://localhost:8007",
}


def _resolve_service(path: str) -> str | None:
    for prefix, url in SERVICE_MAP.items():
        if path.startswith(prefix):
            return url
    return None


async def _proxy(request: Request, target_url: str):
    async with httpx.AsyncClient(timeout=30.0) as client:
        # Forward the request
        headers = dict(request.headers)
        headers.pop("host", None)

        # Attach user context from middleware state
        headers["x-user-id"] = getattr(request.state, "user_id", "")
        headers["x-org-id"] = getattr(request.state, "org_id", "")
        headers["x-tenant-type"] = getattr(request.state, "tenant_type", "B2C")

        body = await request.body()
        resp = await client.request(
            method=request.method,
            url=target_url + str(request.url.path) + (f"?{request.url.query}" if request.url.query else ""),
            headers=headers,
            content=body,
        )

        return StreamingResponse(
            content=resp.aiter_bytes(),
            status_code=resp.status_code,
            headers=dict(resp.headers),
        )


@router.api_route("/api/v1/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
async def proxy_handler(request: Request, path: str):
    full_path = f"/api/v1/{path}"
    target = _resolve_service(full_path)

    if not target:
        from fastapi.responses import JSONResponse
        return JSONResponse(status_code=404, content={"detail": f"No service found for {full_path}"})

    return await _proxy(request, target)
