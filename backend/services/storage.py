from __future__ import annotations

from pathlib import Path
from uuid import uuid4

from core.config import settings


class StorageService:
    def __init__(self) -> None:
        self.local_upload_dir = Path(settings.uploads_dir)
        self.local_upload_dir.mkdir(parents=True, exist_ok=True)

    def store(self, filename: str, content: bytes, content_type: str) -> str:
        safe_name = f"{uuid4()}-{filename.replace(' ', '-').lower()}"

        local_path = self.local_upload_dir / safe_name
        local_path.write_bytes(content)
        return f"/uploads/{safe_name}"


storage_service = StorageService()
