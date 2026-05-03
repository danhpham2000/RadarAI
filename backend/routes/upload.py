from __future__ import annotations

from datetime import UTC, datetime
from typing import Annotated
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile, status

from core.auth import CurrentUser, optional_user, require_user
from core.config import settings
from core.rate_limit import upload_rate_limit
from schemas import UploadResponse, UploadedFileRecord
from services.file_extraction import AUDIO_TYPES, IMAGE_TYPES, PDF_TYPES, file_extraction_service
from services.repositories import repository
from services.storage import storage_service

router = APIRouter(prefix="/api", tags=["upload"])

ALLOWED_UPLOAD_TYPES = IMAGE_TYPES | PDF_TYPES | AUDIO_TYPES


@router.post("/upload", response_model=UploadResponse)
async def upload_screenshot(
    request: Request,
    file: UploadFile = File(...),
    user: Annotated[CurrentUser | None, Depends(optional_user)] = None,
    _rl: Annotated[None, Depends(upload_rate_limit)] = None,
) -> UploadResponse:
    if file.content_type not in ALLOWED_UPLOAD_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file type. Upload image, PDF, or audio files only.",
        )

    content = await file.read()
    if not content:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="The uploaded file is empty.")
    if len(content) > settings.max_upload_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="The uploaded file is too large for analysis.",
        )

    file_url = storage_service.store(file.filename or "upload.bin", content, file.content_type)
    try:
        extracted_text = file_extraction_service.extract_text(content, file.content_type)
    except RuntimeError as exc:
        status_code = (
            status.HTTP_503_SERVICE_UNAVAILABLE
            if "not configured" in str(exc).lower()
            else status.HTTP_502_BAD_GATEWAY
        )
        raise HTTPException(status_code=status_code, detail=str(exc)) from exc

    file_record = UploadedFileRecord(
        id=str(uuid4()),
        user_id=user.id if user else None,
        file_url=file_url,
        file_type=file.content_type,
        file_size=len(content),
        ocr_text=extracted_text,
        created_at=datetime.now(UTC),
    )
    repository.save_uploaded_file(file_record)

    return UploadResponse(
        fileId=file_record.id,
        fileUrl=file_url,
        ocrText=extracted_text,
        extractedText=extracted_text,
    )


@router.get("/storage", response_model=list[UploadedFileRecord])
def list_storage(
    user: Annotated[CurrentUser, Depends(require_user)],
) -> list[UploadedFileRecord]:
    return repository.list_uploaded_files(user.id)
