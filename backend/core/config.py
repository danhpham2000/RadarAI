from __future__ import annotations

import os
from dataclasses import dataclass, field
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parents[1]
load_dotenv(BACKEND_DIR / ".env")


def _split_csv(value: str | None) -> list[str]:
    if not value:
        return []
    return [item.strip() for item in value.split(",") if item.strip()]


def _normalize_database_url(value: str | None) -> str | None:
    if not value:
        return None
    if value.startswith("postgresql+psycopg://"):
        return value
    if value.startswith("postgresql://"):
        return value.replace("postgresql://", "postgresql+psycopg://", 1)
    if value.startswith("postgres://"):
        return value.replace("postgres://", "postgresql+psycopg://", 1)
    return value


@dataclass(slots=True)
class Settings:
    app_name: str = "RadarAI"
    app_env: str = field(default_factory=lambda: os.getenv("APP_ENV", "development"))
    app_host: str = field(default_factory=lambda: os.getenv("APP_HOST", "127.0.0.1"))
    app_port: int = field(default_factory=lambda: int(os.getenv("APP_PORT", "8000")))
    cors_origins: list[str] = field(
        default_factory=lambda: _split_csv(
            os.getenv("CORS_ORIGINS", "http://127.0.0.1:3000,http://localhost:3000")
        )
    )
    max_upload_size_bytes: int = field(
        default_factory=lambda: int(os.getenv("MAX_UPLOAD_SIZE_BYTES", str(25 * 1024 * 1024)))
    )
    uploads_dir: str = field(default_factory=lambda: os.getenv("UPLOADS_DIR", "uploads"))
    database_url: str | None = field(default_factory=lambda: _normalize_database_url(os.getenv("DATABASE_URL")))
    jwt_secret_key: str = field(
        default_factory=lambda: os.getenv("JWT_SECRET_KEY", "radarai-local-dev-secret")
    )
    jwt_algorithm: str = field(default_factory=lambda: os.getenv("JWT_ALGORITHM", "HS256"))
    access_token_ttl_minutes: int = field(
        default_factory=lambda: int(os.getenv("ACCESS_TOKEN_TTL_MINUTES", "4320"))
    )

    openai_api_key: str | None = field(default_factory=lambda: os.getenv("OPENAI_API_KEY"))
    openai_vision_model: str = field(
        default_factory=lambda: os.getenv("OPENAI_VISION_MODEL", "gpt-4.1-mini")
    )
    deepgram_api_key: str | None = field(default_factory=lambda: os.getenv("DEEPGRAM_API_KEY"))
    deepgram_model: str = field(default_factory=lambda: os.getenv("DEEPGRAM_MODEL", "nova-3"))

    upstash_redis_rest_url: str | None = field(
        default_factory=lambda: os.getenv("UPSTASH_REDIS_REST_URL")
    )
    upstash_redis_rest_token: str | None = field(
        default_factory=lambda: os.getenv("UPSTASH_REDIS_REST_TOKEN")
    )

    @property
    def database_enabled(self) -> bool:
        return bool(self.database_url)


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
