from __future__ import annotations

from fastapi import APIRouter

from schemas import PatternCreateRequest, PatternRecord
from services.repositories import repository

router = APIRouter(prefix="/api", tags=["patterns"])


@router.post("/patterns", response_model=PatternRecord)
def create_pattern(payload: PatternCreateRequest) -> PatternRecord:
    return repository.create_pattern(payload)


@router.get("/patterns", response_model=list[PatternRecord])
def list_patterns() -> list[PatternRecord]:
    return repository.list_patterns()
