from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from core.auth import CurrentUser, require_user
from schemas import DeleteResponse, ReportRecord
from services.repositories import repository

router = APIRouter(prefix="/api", tags=["reports"])


@router.get("/reports", response_model=list[ReportRecord])
def list_reports(user: Annotated[CurrentUser, Depends(require_user)]) -> list[ReportRecord]:
    return repository.list_reports(user_id=user.id)


@router.get("/reports/{report_id}", response_model=ReportRecord)
def get_report(report_id: str, user: Annotated[CurrentUser, Depends(require_user)]) -> ReportRecord:
    report = repository.get_report(report_id, user_id=user.id)
    if report is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found.")
    return report


@router.delete("/reports/{report_id}", response_model=DeleteResponse)
def delete_report(report_id: str, user: Annotated[CurrentUser, Depends(require_user)]) -> DeleteResponse:
    deleted = repository.delete_report(report_id, user_id=user.id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found.")
    return DeleteResponse(deleted=True, id=report_id)
