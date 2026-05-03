from __future__ import annotations

from dataclasses import dataclass
from typing import Annotated

from fastapi import Depends, Header, HTTPException, status

from services.repositories import repository
from services.security import decode_access_token


@dataclass(slots=True)
class CurrentUser:
    id: str
    email: str | None = None
    role: str = "user"
    organization_id: str | None = None


async def optional_user(
    authorization: Annotated[str | None, Header()] = None,
) -> CurrentUser | None:
    if not authorization or not authorization.lower().startswith("bearer "):
        return None

    token = authorization.split(" ", 1)[1].strip()
    payload = decode_access_token(token)
    user_context = repository.get_user_context(payload["sub"])
    if user_context is None:
        return None

    auth_user, role, organization_id = user_context
    return CurrentUser(
        id=auth_user.id,
        email=auth_user.email,
        role=role or "user",
        organization_id=organization_id,
    )


async def require_user(
    user: Annotated[CurrentUser | None, Depends(optional_user)],
) -> CurrentUser:
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication is required for this action.",
        )
    return user


async def require_admin(
    user: Annotated[CurrentUser, Depends(require_user)],
) -> CurrentUser:
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access is required for this route.",
        )
    return user
