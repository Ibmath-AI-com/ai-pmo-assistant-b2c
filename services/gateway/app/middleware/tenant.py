from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware


class TenantMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        # Attach tenant context from JWT state (set by JWTAuthMiddleware)
        tenant_type = getattr(request.state, "tenant_type", "B2C")
        org_id = getattr(request.state, "org_id", "")
        user_id = getattr(request.state, "user_id", "")

        # Forward as headers to downstream services
        request.headers.__dict__["_list"].extend([
            (b"x-user-id", user_id.encode()),
            (b"x-org-id", org_id.encode()),
            (b"x-tenant-type", tenant_type.encode()),
        ])

        return await call_next(request)
