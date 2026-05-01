import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[3] / "shared"))

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas import AuthResponse, LoginRequest, RefreshRequest, RegisterRequest
from app.services.auth_service import login, register
from auth.dependencies import CurrentUser, get_current_user
from auth.jwt import decode_token
from db.base import get_db
from db.models.session import UserSession

router = APIRouter()


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register_user(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    return await register(
        db,
        username=body.username,
        email=body.email,
        password=body.password,
        first_name=body.first_name,
        last_name=body.last_name,
        mobile_number=body.mobile_number,
        date_of_birth=body.date_of_birth,
        gender=body.gender,
        country=body.country,
    )


@router.post("/login", response_model=AuthResponse)
async def login_user(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    return await login(db, email=body.email, password=body.password)


@router.post("/refresh")
async def refresh_token(body: RefreshRequest):
    try:
        payload = decode_token(body.refresh_token)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    if payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not a refresh token")

    from uuid import UUID

    from auth.jwt import create_access_token
    user_id = UUID(payload["sub"])
    new_access = create_access_token(user_id)
    return {"access_token": new_access, "token_type": "bearer"}


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    # Invalidate active sessions for user
    from sqlalchemy import update
    await db.execute(
        update(UserSession)
        .where(UserSession.user_id == current_user.user_id, UserSession.status == "active")
        .values(status="inactive")
    )
    await db.commit()
