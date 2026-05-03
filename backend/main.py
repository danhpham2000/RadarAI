from __future__ import annotations

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import ValidationError

from core.config import settings
from core.database import init_database
from routes.analyze import router as analyze_router
from routes.auth import router as auth_router
from routes.dashboard import router as dashboard_router
from routes.health import router as health_router
from routes.patterns import router as patterns_router
from routes.reports import router as reports_router
from routes.upload import router as upload_router


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Creating the schema at startup keeps the local/backend-owned Neon workflow simple.
    # For a larger deployment this should move into explicit migrations, but it is a
    # pragmatic bridge while the project is still stabilizing its data model.
    init_database()
    yield

app = FastAPI(
    title=settings.app_name,
    description="AI-assisted scam analysis for suspicious social content, listings, and links.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

uploads_path = Path(settings.uploads_dir)
uploads_path.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_path), name="uploads")

app.include_router(health_router)
app.include_router(auth_router)
app.include_router(upload_router)
app.include_router(analyze_router)
app.include_router(reports_router)
app.include_router(dashboard_router)
app.include_router(patterns_router)


@app.exception_handler(ValidationError)
async def validation_exception_handler(_, exc: ValidationError) -> JSONResponse:
    return JSONResponse(status_code=422, content={"detail": exc.errors()})
