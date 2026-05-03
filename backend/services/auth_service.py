from __future__ import annotations

from fastapi import HTTPException, status

from core.auth import CurrentUser
from schemas import AuthRequest, AuthResponse, AuthUser
from services.repositories import repository
from services.security import hash_password, issue_access_token, verify_password


class AuthService:
    def register(self, payload: AuthRequest) -> AuthResponse:
        normalized_email = payload.email.strip().lower()
        try:
            user = repository.create_user(
                email=normalized_email,
                password_hash=hash_password(payload.password),
            )
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc

        token = issue_access_token(
            user_id=user.id,
            email=user.email,
            role="user",
            organization_id=None,
        )
        return AuthResponse(user=user, accessToken=token, refreshToken=None, requiresEmailConfirmation=False)

    def login(self, payload: AuthRequest) -> AuthResponse:
        normalized_email = payload.email.strip().lower()
        credentials = repository.get_user_credentials(normalized_email)
        if credentials is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="The email or password is incorrect.",
            )

        user, password_hash, role, organization_id = credentials
        if not verify_password(payload.password, password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="The email or password is incorrect.",
            )

        token = issue_access_token(
            user_id=user.id,
            email=user.email,
            role=role,
            organization_id=organization_id,
        )
        return AuthResponse(user=user, accessToken=token, refreshToken=None, requiresEmailConfirmation=False)

    @staticmethod
    def to_auth_user(user: CurrentUser) -> AuthUser:
        return AuthUser(id=user.id, email=user.email or "")


auth_service = AuthService()
