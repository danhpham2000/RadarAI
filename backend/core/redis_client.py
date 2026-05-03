from __future__ import annotations

from upstash_redis import Redis

from core.config import settings


def _make_client() -> Redis | None:
    if settings.upstash_redis_rest_url and settings.upstash_redis_rest_token:
        return Redis(
            url=settings.upstash_redis_rest_url,
            token=settings.upstash_redis_rest_token,
        )
    return None


redis_client: Redis | None = _make_client()
