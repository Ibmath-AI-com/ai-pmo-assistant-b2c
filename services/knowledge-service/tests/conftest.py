import sys
import uuid
from pathlib import Path
from unittest.mock import AsyncMock, patch

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "shared"))

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from auth.dependencies import CurrentUser, get_current_user
from config.settings import get_settings
from db.base import get_db
from app.main import app

settings = get_settings()
TEST_DB_URL = settings.database_url

USER_ID = uuid.uuid4()
USER2_ID = uuid.uuid4()


def make_current_user(user_id=None) -> CurrentUser:
    return CurrentUser(
        user_id=user_id or USER_ID,
        tenant_type="B2C",
    )


@pytest_asyncio.fixture(scope="session")
async def engine():
    eng = create_async_engine(TEST_DB_URL, echo=False)
    yield eng
    await eng.dispose()


@pytest_asyncio.fixture(scope="session")
async def seed_data(engine):
    factory = async_sessionmaker(engine, expire_on_commit=False)

    async with factory() as session:
        await session.execute(text("""
            INSERT INTO "user"
                (user_id, username, email, password_hash, status)
            VALUES
                (:uid1, :uname1, :email1, :pwdhash, 'active'),
                (:uid2, :uname2, :email2, :pwdhash, 'active')
            ON CONFLICT DO NOTHING
        """), {
            "uid1":   str(USER_ID),
            "uname1": f"testuser_{USER_ID.hex[:6]}",
            "email1": f"test_{USER_ID.hex[:6]}@test.local",
            "uid2":   str(USER2_ID),
            "uname2": f"testuser_{USER2_ID.hex[:6]}",
            "email2": f"test_{USER2_ID.hex[:6]}@test.local",
            "pwdhash": "$2b$12$dummyhashfortest000000000000000000000000000000000000000",
        })
        await session.commit()

    yield

    async with factory() as session:
        for uid in (str(USER_ID), str(USER2_ID)):
            await session.execute(text("""
                DELETE FROM document_ingestion_job
                WHERE knowledge_document_id IN (
                    SELECT knowledge_document_id FROM knowledge_document
                    WHERE knowledge_collection_id IN (
                        SELECT knowledge_collection_id FROM knowledge_collection WHERE user_id = :uid
                    )
                )
            """), {"uid": uid})
            await session.execute(text("""
                DELETE FROM document_chunk
                WHERE knowledge_document_id IN (
                    SELECT knowledge_document_id FROM knowledge_document
                    WHERE knowledge_collection_id IN (
                        SELECT knowledge_collection_id FROM knowledge_collection WHERE user_id = :uid
                    )
                )
            """), {"uid": uid})
            await session.execute(text("""
                DELETE FROM knowledge_document_governance
                WHERE knowledge_document_id IN (
                    SELECT knowledge_document_id FROM knowledge_document
                    WHERE knowledge_collection_id IN (
                        SELECT knowledge_collection_id FROM knowledge_collection WHERE user_id = :uid
                    )
                )
            """), {"uid": uid})
            await session.execute(text("""
                DELETE FROM knowledge_document_tag
                WHERE knowledge_document_id IN (
                    SELECT knowledge_document_id FROM knowledge_document
                    WHERE knowledge_collection_id IN (
                        SELECT knowledge_collection_id FROM knowledge_collection WHERE user_id = :uid
                    )
                )
            """), {"uid": uid})
            await session.execute(text("""
                DELETE FROM knowledge_document_access
                WHERE knowledge_document_id IN (
                    SELECT knowledge_document_id FROM knowledge_document
                    WHERE knowledge_collection_id IN (
                        SELECT knowledge_collection_id FROM knowledge_collection WHERE user_id = :uid
                    )
                )
            """), {"uid": uid})
            await session.execute(text("""
                DELETE FROM knowledge_document
                WHERE knowledge_collection_id IN (
                    SELECT knowledge_collection_id FROM knowledge_collection WHERE user_id = :uid
                )
            """), {"uid": uid})
            await session.execute(text(
                "DELETE FROM knowledge_collection WHERE user_id = :uid"
            ), {"uid": uid})
            await session.execute(text(
                "DELETE FROM file WHERE uploaded_by_id = :uid"
            ), {"uid": uid})
            await session.execute(text(
                'DELETE FROM "user" WHERE user_id = :uid'
            ), {"uid": uid})
        await session.commit()


@pytest_asyncio.fixture
async def db_session(engine, seed_data):
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        yield session
        await session.rollback()


@pytest_asyncio.fixture
async def client(db_session):
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = lambda: make_current_user()

    with patch("app.events.publishers._publish", new=AsyncMock()):
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as ac:
            yield ac

    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def client_user2(db_session):
    """Client authenticated as user2 — used for isolation tests."""
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = lambda: make_current_user(user_id=USER2_ID)

    with patch("app.events.publishers._publish", new=AsyncMock()):
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as ac:
            yield ac

    app.dependency_overrides.clear()
