import sys
from pathlib import Path

# Add shared to path before anything else
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "shared"))

# Polyfill JSONB → JSON for SQLite test engine (must happen before model imports)
from sqlalchemy.dialects.sqlite.base import SQLiteTypeCompiler
if not hasattr(SQLiteTypeCompiler, "visit_JSONB"):
    SQLiteTypeCompiler.visit_JSONB = SQLiteTypeCompiler.visit_JSON

import asyncio
import uuid
from unittest.mock import AsyncMock, patch

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport

# Pre-import the app so all submodules (including publishers) are registered
import app.main  # noqa: F401
import app.events.publishers  # noqa: F401


# ---------------------------------------------------------------------------
# Patch auth before importing the app so get_current_user is always mocked
# ---------------------------------------------------------------------------
FAKE_USER_ID = uuid.uuid4()
FAKE_ORG_ID = uuid.uuid4()


def _fake_current_user():
    from auth.dependencies import CurrentUser
    return CurrentUser(user_id=FAKE_USER_ID)


# ---------------------------------------------------------------------------
# In-memory DB session using SQLite for tests
# ---------------------------------------------------------------------------
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from db.models.base import Base

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def _create_tables():
    # Import all models so they're registered on Base (including User, Department, etc.)
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
async def db():
    async with TestSessionLocal() as session:
        try:
            yield session
            await session.rollback()  # rollback after each test to keep isolation
        except Exception:
            await session.rollback()
            raise


@pytest_asyncio.fixture
async def client():
    """HTTP client with mocked auth and DB."""
    with patch("app.events.publishers.publish_event", new=AsyncMock()):
        from app.main import app
        from auth.dependencies import get_current_user
        from db.base import get_db

        app.dependency_overrides[get_current_user] = _fake_current_user
        app.dependency_overrides[get_db] = _get_test_db

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            yield ac

        app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def make_user():
    """Insert a real User row into the test DB and return their user_id."""
    from db.models.user import User

    async def _create(username: str | None = None, email: str | None = None) -> uuid.UUID:
        uid = uuid.uuid4()
        uname = username or f"user_{uid.hex[:8]}"
        uemail = email or f"{uname}@test.com"
        async with TestSessionLocal() as session:
            user = User(
                user_id=uid,
                username=uname,
                email=uemail,
                password_hash="test-hash",
            )
            session.add(user)
            await session.commit()
        return uid

    return _create
