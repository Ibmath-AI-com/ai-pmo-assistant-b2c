import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[3] / "shared"))

from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from db.models.user import User, UserProfile


async def get_users(db: AsyncSession, org_id: UUID | None = None, skip: int = 0, limit: int = 50) -> list[User]:
    query = select(User).options(selectinload(User.profile)).offset(skip).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())


async def get_user_by_id(db: AsyncSession, user_id: UUID) -> User:
    result = await db.execute(
        select(User).options(selectinload(User.profile)).where(User.user_id == user_id)
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


async def update_user(db: AsyncSession, user_id: UUID, data: dict) -> User:
    user = await get_user_by_id(db, user_id)

    # Update profile fields
    profile_fields = {"first_name", "last_name", "job_title", "avatar", "language_preference", "timezone"}
    user_fields = {"username", "mobile_number"}

    for key, value in data.items():
        if value is None:
            continue
        if key in user_fields:
            setattr(user, key, value)
        elif key in profile_fields:
            if user.profile:
                setattr(user.profile, key, value)

    await db.commit()
    await db.refresh(user)
    return user


async def update_user_status(db: AsyncSession, user_id: UUID, new_status: str) -> User:
    allowed = {"active", "inactive", "suspended"}
    if new_status not in allowed:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Status must be one of {allowed}")

    user = await get_user_by_id(db, user_id)
    user.status = new_status
    await db.commit()
    await db.refresh(user)
    return user
