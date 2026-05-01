from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware


class TenantMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        user_id = getattr(request.state, "user_id", "")
        request.headers.__dict__["_list"].extend([
            (b"x-user-id", user_id.encode()),
        ])
        return await call_next(request)
