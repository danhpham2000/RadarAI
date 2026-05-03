from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Response, status

from core.auth import CurrentUser, require_user
from schemas import AuthRequest, AuthResponse, AuthUser
from services.auth_service import auth_service

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=AuthResponse)
def register(payload: AuthRequest) -> AuthResponse:
    return auth_service.register(payload)


@router.post("/login", response_model=AuthResponse)
def login(payload: AuthRequest) -> AuthResponse:
    return auth_service.login(payload)


@router.get("/me", response_model=AuthUser)
def me(user: Annotated[CurrentUser, Depends(require_user)]) -> AuthUser:
    return auth_service.to_auth_user(user)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout() -> Response:
    return Response(status_code=status.HTTP_204_NO_CONTENT)
