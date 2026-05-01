import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[3] / "shared"))

from fastapi import HTTPException, status
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from auth.jwt import create_access_token, create_refresh_token
from db.models.user import User, UserProfile

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


async def register(
    db: AsyncSession,
    username: str,
    email: str,
    password: str,
    first_name: str | None,
    last_name: str | None,
    mobile_number: str | None = None,
    date_of_birth=None,
    gender: str | None = None,
    country: str | None = None,
) -> dict:
    existing = await db.execute(
        select(User).where((User.email == email) | (User.username == username))
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email or username already registered")

    user = User(
        username=username,
        email=email,
        password_hash=hash_password(password),
        mobile_number=mobile_number,
        status="active",
    )
    db.add(user)
    await db.flush()

    profile = UserProfile(
        user_id=user.user_id,
        first_name=first_name,
        last_name=last_name,
        date_of_birth=date_of_birth,
        gender=gender,
        country=country,
    )
    db.add(profile)
    await db.commit()
    await db.refresh(user)

    access_token = create_access_token(user.user_id)
    refresh_token = create_refresh_token(user.user_id)

    return {
        "user_id": user.user_id,
        "username": user.username,
        "email": user.email,
        "access_token": access_token,
        "refresh_token": refresh_token,
    }


async def login(db: AsyncSession, email: str, password: str) -> dict:
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if user.status != "active":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is not active")

    access_token = create_access_token(user.user_id)
    refresh_token = create_refresh_token(user.user_id)

    return {
        "user_id": user.user_id,
        "username": user.username,
        "email": user.email,
        "access_token": access_token,
        "refresh_token": refresh_token,
    }
