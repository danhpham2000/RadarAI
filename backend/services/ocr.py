from __future__ import annotations

import base64
from io import BytesIO

from PIL import Image, UnidentifiedImageError

from core.config import settings

try:
    import pytesseract
except Exception:  # pragma: no cover - optional dependency in local environments
    pytesseract = None

try:
    from openai import OpenAI
except Exception:  # pragma: no cover - optional dependency until installed
    OpenAI = None


VISION_SUPPORTED_TYPES = {"image/png", "image/jpeg", "image/webp", "image/gif"}


class OCRService:
    def __init__(self) -> None:
        self.client = OpenAI(api_key=settings.openai_api_key) if OpenAI and settings.openai_api_key else None

    def extract_text(self, content: bytes, content_type: str | None = None) -> str:
        if not content:
            return ""

        # OpenAI vision is the primary extractor because screenshots often contain
        # usernames, URLs, and UI text that basic OCR misses or corrupts.
        vision_text = self._extract_text_with_openai(content, content_type)
        if vision_text:
            return vision_text

        return self._extract_text_with_tesseract(content)

    def _extract_text_with_openai(self, content: bytes, content_type: str | None) -> str:
        if self.client is None or content_type not in VISION_SUPPORTED_TYPES:
            return ""

        try:
            image_b64 = base64.b64encode(content).decode("utf-8")
            response = self.client.responses.create(
                model=settings.openai_vision_model,
                input=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "input_text",
                                "text": (
                                    "Extract all visible text from this screenshot. "
                                    "Preserve URLs, usernames, handles, money amounts, phone numbers, and warning language. "
                                    "Return plain text only, with line breaks when useful. "
                                    "Do not summarize or explain."
                                ),
                            },
                            {
                                "type": "input_image",
                                "image_url": f"data:{content_type};base64,{image_b64}",
                                "detail": "high",
                            },
                        ],
                    }
                ],
            )
            return (response.output_text or "").strip()
        except Exception:
            return ""

    @staticmethod
    def _extract_text_with_tesseract(content: bytes) -> str:
        if pytesseract is None:
            return ""

        try:
            with Image.open(BytesIO(content)) as image:
                text = pytesseract.image_to_string(image)
                return text.strip()
        except (UnidentifiedImageError, OSError):
            return ""


ocr_service = OCRService()
