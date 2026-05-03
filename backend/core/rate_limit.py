from __future__ import annotations

import time

from fastapi import HTTPException, Request, status

from core.redis_client import redis_client

_WINDOW = 60  # seconds


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _enforce(request: Request, max_requests: int) -> None:
    if not redis_client:
        return  # Gracefully allow when Redis is unavailable

    ip = _client_ip(request)
    window = int(time.time()) // _WINDOW
    key = f"rl:{ip}:{window}"

    count = redis_client.incr(key)
    if count == 1:
        redis_client.expire(key, _WINDOW * 2)  # 2x window so the key outlives the bucket

    if count > max_requests:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many requests — please slow down.",
            headers={"Retry-After": str(_WINDOW)},
        )


def analyze_rate_limit(request: Request) -> None:
    _enforce(request, max_requests=12)


def upload_rate_limit(request: Request) -> None:
    _enforce(request, max_requests=20)
