from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends

from core.auth import CurrentUser, require_user
from core.redis_client import redis_client
from schemas import DashboardResponse
from services.repositories import repository

router = APIRouter(prefix="/api", tags=["dashboard"])

_CACHE_TTL = 120  # 2 minutes


@router.get("/dashboard", response_model=DashboardResponse)
def get_dashboard(user: Annotated[CurrentUser, Depends(require_user)]) -> DashboardResponse:
    cache_key = f"cache:dashboard:{user.id}"

    if redis_client:
        cached = redis_client.get(cache_key)
        if cached:
            return DashboardResponse.model_validate_json(cached)

    data = repository.build_dashboard(user_id=user.id)

    if redis_client:
        redis_client.set(cache_key, data.model_dump_json(), ex=_CACHE_TTL)

    return data
