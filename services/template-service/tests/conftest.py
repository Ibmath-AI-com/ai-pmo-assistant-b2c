import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "shared"))

import asyncio
import uuid
from unittest.mock import AsyncMock, patch

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport

import app.main  # noqa: F401
import app.events.publishers  # noqa: F401

FAKE_USER_ID = uuid.uuid4()
FAKE_ORG_ID = uuid.uuid4()
OTHER_ORG_ID = uuid.uuid4()


def _fake_current_user():
    from auth.dependencies import CurrentUser
    return CurrentUser(user_id=FAKE_USER_ID, organization_id=FAKE_ORG_ID, tenant_type="b2c")


from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from db.models.base import Base

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def _create_tables():
    import db.models  # noqa: F401
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def _drop_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


async def _get_test_db():
    async with TestSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_db():
    await _create_tables()
    yield
    await _drop_tables()


@pytest_asyncio.fixture
async def client():
    with patch("app.events.publishers.publish_event", new=AsyncMock()):
        from app.main import app
        from auth.dependencies import get_current_user
        from db.base import get_db

        app.dependency_overrides[get_current_user] = _fake_current_user
        app.dependency_overrides[get_db] = _get_test_db

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            yield ac

        app.dependency_overrides.clear()
