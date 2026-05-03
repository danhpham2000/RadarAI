from __future__ import annotations

from io import BytesIO

import httpx

from core.config import settings
from services.ocr import ocr_service

try:
    from pypdf import PdfReader
except Exception:  # pragma: no cover - optional until dependency installation
    PdfReader = None


IMAGE_TYPES = {"image/png", "image/jpeg", "image/webp", "image/heic", "image/gif"}
PDF_TYPES = {"application/pdf"}
AUDIO_TYPES = {
    "audio/mpeg",
    "audio/mp3",
    "audio/wav",
    "audio/x-wav",
    "audio/webm",
    "audio/ogg",
    "audio/flac",
    "audio/mp4",
    "audio/aac",
    "video/mp4",
    "video/webm",
}


class FileExtractionService:
    def extract_text(self, content: bytes, content_type: str | None = None) -> str:
        if not content:
            return ""

        if content_type in IMAGE_TYPES:
            return ocr_service.extract_text(content, content_type)

        if content_type in PDF_TYPES:
            return self._extract_text_from_pdf(content)

        if content_type in AUDIO_TYPES:
            return self._extract_text_from_audio(content, content_type)

        return ""

    @staticmethod
    def _extract_text_from_pdf(content: bytes) -> str:
        if PdfReader is None:
            return ""

        try:
            reader = PdfReader(BytesIO(content))
        except Exception:
            return ""

        extracted_chunks: list[str] = []
        running_length = 0
        for page in reader.pages:
            try:
                page_text = (page.extract_text() or "").strip()
            except Exception:
                page_text = ""

            if not page_text:
                continue

            extracted_chunks.append(page_text)
            running_length += len(page_text)
            # PDFs can be large; trimming at a reasonable upper bound keeps downstream
            # analysis fast while still preserving enough text for scam detection.
            if running_length >= 12000:
                break

        return "\n\n".join(extracted_chunks).strip()

    @staticmethod
    def _extract_text_from_audio(content: bytes, content_type: str | None) -> str:
        if not settings.deepgram_api_key:
            raise RuntimeError("Deepgram transcription is not configured.")

        headers = {
            "Authorization": f"Token {settings.deepgram_api_key}",
            "Content-Type": content_type or "application/octet-stream",
        }
        params = {
            "model": settings.deepgram_model,
            "smart_format": "true",
            "punctuate": "true",
            "detect_language": "true",
        }

        try:
            with httpx.Client(timeout=120.0) as client:
                response = client.post(
                    "https://api.deepgram.com/v1/listen",
                    headers=headers,
                    params=params,
                    content=content,
                )
                response.raise_for_status()
        except Exception as exc:
            raise RuntimeError("Audio transcription could not be completed.") from exc

        payload = response.json()
        try:
            return (
                payload["results"]["channels"][0]["alternatives"][0]["transcript"].strip()
            )
        except (KeyError, IndexError, AttributeError, TypeError):
            return ""


file_extraction_service = FileExtractionService()
