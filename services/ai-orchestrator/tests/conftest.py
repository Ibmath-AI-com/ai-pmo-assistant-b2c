import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "shared"))

# Polyfill JSONB → JSON for SQLite test engine (must happen before model imports)
from sqlalchemy.dialects.sqlite.base import SQLiteTypeCompiler
if not hasattr(SQLiteTypeCompiler, "visit_JSONB"):
    SQLiteTypeCompiler.visit_JSONB = SQLiteTypeCompiler.visit_JSON

# Fix PostgreSQL UUID result processing for SQLite: values may come back as
# integers (128-bit) or bytes from aiosqlite; handle all variants gracefully.
import uuid as _uuid_mod
from sqlalchemy.dialects.postgresql import UUID as _PGUUID

_orig_uuid_rp = _PGUUID.result_processor

def _patched_uuid_rp(self, dialect, coltype):
    if dialect.name != "sqlite":
        return _orig_uuid_rp(self, dialect, coltype)

    def process(value):
        if value is None:
            return None
        if isinstance(value, _uuid_mod.UUID):
            return value
        if isinstance(value, int):
            return _uuid_mod.UUID(int=value)
        if isinstance(value, (bytes, bytearray)):
            raw = bytes(value)
            if len(raw) == 16:
                return _uuid_mod.UUID(bytes=raw)
            return _uuid_mod.UUID(raw.decode())
        return _uuid_mod.UUID(str(value))

    return process

_PGUUID.result_processor = _patched_uuid_rp

import asyncio
import uuid
from unittest.mock import AsyncMock, patch

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from db.models.base import Base

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

FAKE_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")


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


def _fake_current_user():
    from auth.dependencies import CurrentUser
    return CurrentUser(user_id=FAKE_USER_ID)


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
async def db():
    async with TestSessionLocal() as session:
        try:
            yield session
            await session.rollback()
        except Exception:
            await session.rollback()
            raise


@pytest_asyncio.fixture
async def client():
    with (
        patch("app.events.publishers.publish_event", new=AsyncMock()),
        patch("app.websocket.notifier.notify_session", new=AsyncMock()),
    ):
        from app.main import app
        from auth.dependencies import get_current_user
        from db.base import get_db

        app.dependency_overrides[get_current_user] = _fake_current_user
        app.dependency_overrides[get_db] = _get_test_db

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            yield ac

        app.dependency_overrides.clear()
