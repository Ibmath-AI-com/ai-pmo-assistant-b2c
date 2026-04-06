import time

from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

# In-memory store — swap for Redis in production
_request_counts: dict[str, tuple[int, float]] = {}

RATE_LIMIT = 100   # requests
WINDOW = 60        # seconds


class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        client_ip = request.client.host if request.client else "unknown"
        now = time.time()

        count, window_start = _request_counts.get(client_ip, (0, now))

        if now - window_start > WINDOW:
            count, window_start = 0, now

        count += 1
        _request_counts[client_ip] = (count, window_start)

        if count > RATE_LIMIT:
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many requests"},
                headers={"Retry-After": str(int(WINDOW - (now - window_start)))},
            )

        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(RATE_LIMIT)
        response.headers["X-RateLimit-Remaining"] = str(max(0, RATE_LIMIT - count))
        return response
