from __future__ import annotations

import hashlib
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status

from core.auth import CurrentUser, optional_user
from core.rate_limit import analyze_rate_limit
from core.redis_client import redis_client
from schemas import AnalyzeRequest, AnalyzeResponse
from services.analyzer import analysis_service
from services.repositories import repository

router = APIRouter(prefix="/api", tags=["analysis"])

_CACHE_TTL = 3600  # 1 hour


def _cache_key(payload: AnalyzeRequest) -> str:
    raw = f"{payload.inputType}|{payload.platform}|{payload.text}|{payload.url}"
    digest = hashlib.sha256(raw.encode()).hexdigest()
    return f"cache:analyze:{digest}"


@router.post("/analyze", response_model=AnalyzeResponse)
def analyze_submission(
    request: Request,
    payload: AnalyzeRequest,
    user: Annotated[CurrentUser | None, Depends(optional_user)],
    _rl: Annotated[None, Depends(analyze_rate_limit)] = None,
) -> AnalyzeResponse:
    uploaded_file = None
    uploaded_file_id = payload.fileId or payload.screenshotId
    if uploaded_file_id:
        uploaded_file = repository.get_uploaded_file(uploaded_file_id)
        if uploaded_file is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="The uploaded file could not be found.",
            )

    # Return cached result for text/URL submissions (file uploads are unique per request)
    cache_key = _cache_key(payload) if not uploaded_file_id else None
    if cache_key and redis_client and not user:
        cached = redis_client.get(cache_key)
        if cached:
            return AnalyzeResponse.model_validate_json(cached)

    result = analysis_service.analyze(payload, uploaded_file=uploaded_file)
    report_id: str | None = None

    if user:
        report = analysis_service.build_report_record(
            payload,
            result,
            uploaded_file=uploaded_file,
            user_id=user.id,
            organization_id=user.organization_id,
        )
        repository.save_report(report)
        if uploaded_file_id:
            repository.attach_uploaded_file_to_report(
                file_id=uploaded_file_id,
                report_id=report.id,
                user_id=user.id,
            )
        report_id = report.id

    response = AnalyzeResponse(reportId=report_id, **result.model_dump())

    # Cache anonymous text/URL results
    if cache_key and redis_client and not user:
        redis_client.set(cache_key, response.model_dump_json(), ex=_CACHE_TTL)

    return response
