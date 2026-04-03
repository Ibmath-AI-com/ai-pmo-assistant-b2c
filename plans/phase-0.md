# Phase 0: Project Bootstrap

## Task 1: Initialize monorepo structure

Create the folder structure:
```
ai-pmo-assistant/
├── services/
│   ├── shared/
│   │   ├── db/
│   │   │   ├── models/
│   │   │   └── migrations/
│   │   ├── auth/
│   │   ├── events/
│   │   ├── config/
│   │   ├── schemas/
│   │   └── utils/
│   ├── gateway/
│   │   └── app/
│   ├── auth-service/
│   │   └── app/
│   ├── persona-service/
│   │   └── app/
│   ├── chat-service/
│   │   └── app/
│   ├── ai-orchestrator/
│   │   └── app/
│   ├── knowledge-service/
│   │   └── app/
│   ├── template-service/
│   │   └── app/
│   └── admin-service/
│       └── app/
├── frontend/
├── infrastructure/
│   ├── helm/
│   ├── docker/
│   └── scripts/
└── docs/
```
Add `__init__.py` in all Python packages.
Add empty `requirements.txt` in each service.

**Verify:** `find services/ -name "__init__.py" | wc -l` should be > 20

---

## Task 2: Create docker-compose.yml

Create `docker-compose.yml` with these services:
- **postgres**: `pgvector/pgvector:pg16`, port 5432, volume `pg_data`, env: POSTGRES_DB=ai_pmo, POSTGRES_USER=admin, POSTGRES_PASSWORD=admin123
- **redis**: `redis:7-alpine`, port 6379, volume `redis_data`
- **rabbitmq**: `rabbitmq:3.13-management`, ports 5672 + 15672 (management UI), env: RABBITMQ_DEFAULT_USER=guest, RABBITMQ_DEFAULT_PASS=guest
- **minio**: `minio/minio:latest`, ports 9000 + 9001, command `server /data --console-address ":9001"`, volume `minio_data`, env: MINIO_ROOT_USER=minioadmin, MINIO_ROOT_PASSWORD=minioadmin

All on a shared network `ai_pmo_network`.
Define named volumes at the bottom.

**Verify:** `docker-compose config` passes without errors

---

## Task 3: Create .env.example

Create `.env.example` with all environment variables:
```
# Database
DATABASE_URL=postgresql+asyncpg://admin:admin123@localhost:5432/ai_pmo

# Redis
REDIS_URL=redis://localhost:6379/0

# RabbitMQ
RABBITMQ_URL=amqp://guest:guest@localhost:5672/

# Object Storage (MinIO)
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=ai-pmo-files

# Vector Store
QDRANT_URL=http://localhost:6333
QDRANT_COLLECTION=ai_pmo_embeddings

# LLM Providers
OPENAI_API_KEY=sk-your-key-here
ANTHROPIC_API_KEY=sk-ant-your-key-here
INTERNAL_LLM_URL=http://localhost:8080/v1

# Auth
JWT_SECRET_KEY=change-this-to-a-secure-random-string
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7

# App
APP_ENV=development
TENANT_MODE=both
LOG_LEVEL=INFO
```

Also create `.env` by copying `.env.example`.
Add `.env` to `.gitignore`.

**Verify:** `.env.example` exists and `.env` is in `.gitignore`

---

## Task 4: Set up shared config package

Create `services/shared/config/settings.py` with Pydantic Settings:
- Load from environment variables
- Database URL, Redis URL, RabbitMQ URL, S3 config, JWT config, LLM keys
- Use `pydantic-settings` BaseSettings with env_file=".env"

Create `services/shared/config/__init__.py` exporting a `get_settings()` function.

Create `services/shared/requirements.txt`:
```
fastapi>=0.110.0
uvicorn[standard]>=0.29.0
sqlalchemy[asyncio]>=2.0.0
asyncpg>=0.29.0
alembic>=1.13.0
pydantic>=2.6.0
pydantic-settings>=2.2.0
python-jose[cryptography]>=3.3.0
passlib[bcrypt]>=1.7.4
aio-pika>=9.4.0
celery[redis]>=5.3.0
redis>=5.0.0
boto3>=1.34.0
httpx>=0.27.0
python-multipart>=0.0.9
```

**Verify:** `cd services/shared && python -c "from config.settings import get_settings; print('OK')"`

---

## Task 5: Set up SQLAlchemy base models

Create `services/shared/db/base.py`:
- Async engine creation from DATABASE_URL
- AsyncSession factory with `async_sessionmaker`
- `get_db` async generator dependency for FastAPI

Create `services/shared/db/models/base.py`:
- Base declarative class
- `TimestampMixin` with `created_at`, `updated_at`
- `UUIDMixin` with UUID primary key using `uuid_generate_v4`

**Verify:** `python -c "from db.base import Base; print('OK')"`

---

## Task 6: Set up Alembic migrations

Run `cd services/shared && alembic init db/migrations`

Edit `alembic.ini`:
- Set `sqlalchemy.url` to use env variable

Edit `db/migrations/env.py`:
- Import Base from db.base
- Set `target_metadata = Base.metadata`
- Configure async engine

**Verify:** `cd services/shared && alembic check` runs without error

---

## Task 7: Set up shared JWT auth utilities

Create `services/shared/auth/jwt.py`:
- `create_access_token(user_id, org_id, tenant_type)` → JWT string
- `create_refresh_token(user_id)` → JWT string
- `decode_token(token)` → dict payload
- Use `python-jose` with HS256

Create `services/shared/auth/dependencies.py`:
- `get_current_user` FastAPI dependency that extracts and validates JWT from Authorization header
- Returns a `CurrentUser` Pydantic model with user_id, organization_id, tenant_type

**Verify:** Write a quick test that creates and decodes a token

---

## Task 8: Set up RabbitMQ event base classes

Create `services/shared/events/publisher.py`:
- `EventPublisher` class wrapping aio-pika
- `publish(event_type: str, payload: dict)` method
- Auto-includes timestamp, source_service, correlation_id

Create `services/shared/events/consumer.py`:
- `EventConsumer` base class
- `subscribe(event_type: str, handler: Callable)` method
- Auto-acknowledge on success, nack on failure

**Verify:** `python -c "from events.publisher import EventPublisher; print('OK')"`

---

## Task 9: Initialize frontend

```bash
cd frontend
npm create vite@latest . -- --template react-ts
npm install react-router-dom@7 axios zustand @tanstack/react-query recharts
npm install -D tailwindcss @tailwindcss/vite
```

Configure:
- `vite.config.ts`: add Tailwind plugin, proxy `/api` → `http://localhost:8000`
- `tsconfig.json`: add `@/` path alias pointing to `src/`
- `tailwind.config.ts`: set content paths
- Add `@import "tailwindcss"` to `src/index.css`

Initialize Shadcn/ui: `npx shadcn@latest init`

**Verify:** `cd frontend && npm run dev` starts without errors

---

## Task 10: Create base frontend layout

Create `src/components/layout/AppLayout.tsx`:
- Sidebar (left) + Main content (center) + Right panel
- Matches the layout from the PDF mockup page 2
- Use Outlet from react-router-dom for nested routes

Create `src/routes/index.tsx`:
- Root route with AppLayout
- Placeholder pages: Home, KnowledgeHub, Personas, Admin
- Auth routes: Login, Register (outside AppLayout)

Create `src/App.tsx`:
- RouterProvider with the router

**Verify:** `npm run build` passes without errors

---

## Task 11: Set up pre-commit and linting

Create `pyproject.toml` at repo root:
```toml
[tool.ruff]
target-version = "py312"
line-length = 120

[tool.ruff.lint]
select = ["E", "F", "I", "W"]

[tool.mypy]
python_version = "3.12"
warn_return_any = true
warn_unused_configs = true
ignore_missing_imports = true
```

Create `.pre-commit-config.yaml`:
```yaml
repos:
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.4.0
    hooks:
      - id: ruff
        args: [--fix]
      - id: ruff-format
```

**Verify:** `ruff check services/` runs clean

---

## Phase 0 Complete

After all tasks:
1. Run `docker-compose up -d` and verify all 4 infrastructure services start
2. Run `cd frontend && npm run dev` and verify React app loads
3. Update PROGRESS.md marking Phase 0 as complete
4. Git commit: `git add -A && git commit -m "Phase 0: Project bootstrap complete"`
