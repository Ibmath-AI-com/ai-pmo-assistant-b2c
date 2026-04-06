import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[3] / "shared"))

from uuid import UUID

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from auth.dependencies import CurrentUser, get_current_user
from db.base import get_db

from app.services.user_service import get_user_by_id, get_users, update_user, update_user_status

router = APIRouter()


class UserDetailResponse(BaseModel):
    user_id: UUID
    username: str
    email: str
    mobile_number: str | None
    status: str
    email_verified_flag: bool
    first_name: str | None = None
    last_name: str | None = None
    job_title: str | None = None
    language_preference: str | None = None
    timezone: str | None = None

    model_config = {"from_attributes": True}


class UpdateUserRequest(BaseModel):
    username: str | None = None
    mobile_number: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    job_title: str | None = None
    language_preference: str | None = None
    timezone: str | None = None


class UpdateStatusRequest(BaseModel):
    status: str


def _serialize_user(user) -> dict:
    profile = user.profile
    return {
        "user_id": user.user_id,
        "username": user.username,
        "email": user.email,
        "mobile_number": user.mobile_number,
        "status": user.status,
        "email_verified_flag": user.email_verified_flag,
        "first_name": profile.first_name if profile else None,
        "last_name": profile.last_name if profile else None,
        "job_title": profile.job_title if profile else None,
        "language_preference": profile.language_preference if profile else None,
        "timezone": profile.timezone if profile else None,
    }


@router.get("", response_model=list[UserDetailResponse])
async def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    users = await get_users(db, skip=skip, limit=limit)
    return [_serialize_user(u) for u in users]


@router.get("/me", response_model=UserDetailResponse)
async def get_me(
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    user = await get_user_by_id(db, current_user.user_id)
    return _serialize_user(user)


@router.get("/{user_id}", response_model=UserDetailResponse)
async def get_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    user = await get_user_by_id(db, user_id)
    return _serialize_user(user)


@router.put("/{user_id}", response_model=UserDetailResponse)
async def update_user_endpoint(
    user_id: UUID,
    body: UpdateUserRequest,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    user = await update_user(db, user_id, body.model_dump(exclude_none=True))
    return _serialize_user(user)


@router.patch("/{user_id}/status", response_model=UserDetailResponse)
async def patch_user_status(
    user_id: UUID,
    body: UpdateStatusRequest,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    user = await update_user_status(db, user_id, body.status)
    return _serialize_user(user)
