# PROGRESS — AI PMO & Strategy Assistant

## Current Phase: Phase 2 — Workspace & Persona
**Status:** Phase 1 complete ✅ — starting Phase 2
**Target:** Weeks 3-4

---

## Phase 0: Project Bootstrap ✅
- [x] Initialize monorepo structure (Task 1)
- [x] Create docker-compose.yml — postgres/pgvector, Redis, RabbitMQ, MinIO (Task 2)
- [x] Create .env.example + .env with DB_HOST/PORT/USER/PASSWORD/NAME/MAX vars (Task 3)
- [x] Set up services/shared/config — Pydantic Settings, get_settings() (Task 4)
- [x] Set up SQLAlchemy base models — Base, UUIDMixin, TimestampMixin, get_db (Task 5)
- [x] Set up Alembic migrations — async env.py wired to Base.metadata (Task 6)
- [x] Set up shared JWT auth utilities — create/decode access+refresh tokens (Task 7)
- [x] Set up RabbitMQ event base classes — EventPublisher, EventConsumer (Task 8)
- [x] Initialize frontend — Vite + React 19 + TypeScript + Shadcn/ui + Tailwind (Task 9)
- [x] Create base frontend layout — AppLayout, Sidebar, Navbar, all routes (Task 10)
- [x] Set up pre-commit and linting — pyproject.toml, ruff clean (Task 11)

## Phase 1: Auth & Foundation ✅
- [x] DB models: Organization, Department, User, UserProfile, Role, Permission, RolePermission, UserRole, UserAccessOverride, UserSession (Task 1)
- [x] Alembic migration skipped — tables already in remote DB (Task 2)
- [x] auth-service FastAPI skeleton — main.py, Dockerfile, requirements (Task 3)
- [x] Register endpoint — bcrypt hash, B2C personal org auto-create, JWT (Task 4)
- [x] Login / refresh / logout endpoints (Task 5)
- [x] User CRUD — list, get, get/me, update, patch status (Task 6)
- [x] Organization & Department endpoints — full CRUD (Task 7)
- [x] Roles & Permissions endpoints — CRUD, set permissions, assign/revoke (Task 8)
- [x] Gateway service — JWT middleware, rate limiting, tenant headers, proxy to all 8 services (Task 9)
- [x] Frontend login + layout shell — done in Phase 0 (Tasks 10–11)
- [x] Auth tests — 24/24 passing: register, login, RBAC, user CRUD (Task 12)

## Phase 2: Workspace & Persona ⬜
- [ ] Database migration 002 (workspace, persona tables)
- [ ] persona-service API endpoints
- [ ] Frontend: Persona management, 4-step wizard
- [ ] Tests: persona CRUD, workspace management

## Phase 3: Knowledge Base ⬜
- [ ] Database migration 003 (knowledge, file, connector tables)
- [ ] knowledge-service API endpoints
- [ ] Docling integration for document parsing
- [ ] Ingestion pipeline (parse → chunk → embed → store)
- [ ] Frontend: KB management, 4-step document wizard
- [ ] Tests: document upload, ingestion pipeline

## Phase 4: AI & Chat (MVP) ⬜
- [ ] Database migration 004 (chat, ai_run, skill tables)
- [ ] chat-service with WebSocket streaming
- [ ] ai-orchestrator: LLM Router, RAG Pipeline, Skills Engine, Guardrails
- [ ] LLM providers: OpenAI, Anthropic, internal (vLLM)
- [ ] Frontend: Full chat UI with streaming, persona switching
- [ ] Tests: chat flow, LLM routing, RAG retrieval

## Phase 5: Templates & Reports ⬜
- [ ] Database migration 005 (template tables)
- [ ] template-service API endpoints
- [ ] Report generation pipeline (template + AI + export)
- [ ] Frontend: Template management, report download
- [ ] Tests: report generation, export formats

## Phase 6: Admin & Billing ⬜
- [ ] Database migration 006 (admin, subscription tables)
- [ ] admin-service API endpoints
- [ ] Frontend: Admin panel (users, roles, settings, lookups, packages)
- [ ] Tests: admin operations, subscription management

## Phase 7: Integration & Testing ⬜
- [ ] Cloud drive connectors (OneDrive, Google Drive, Dropbox)
- [ ] End-to-end test suite
- [ ] Performance testing
- [ ] Security audit
- [ ] Monitoring setup (Prometheus + Grafana)
- [ ] Documentation

## Phase 8: Deploy & Launch ⬜
- [ ] Helm charts for all services
- [ ] Cloud deployment (AWS)
- [ ] On-premise package (Docker Compose + k3s)
- [ ] Beta launch

---

## Decisions Log

| Date | Decision | Reason |
|------|----------|--------|
| 2026-04-04 | Unified B2B/B2C codebase with tenant_type flag | Reduces maintenance, single schema |
| 2026-04-04 | Vite + React instead of Next.js | No SSR needed, simpler deployment for on-prem |
| 2026-04-04 | PostgreSQL everywhere (not Supabase-specific) | Cloud/on-prem portability |
| 2026-04-04 | MinIO for storage | S3-compatible API works for cloud and on-prem |
| 2026-04-04 | Docling for document parsing | Local execution, MIT license, 97.9% table accuracy |
| 2026-04-04 | REST + RabbitMQ for service communication | Simple, proven, async event processing |
| 2026-04-04 | OpenAI + Anthropic Claude at launch | Two providers for redundancy and quality |
| 2026-04-04 | pgvector for MVP, Qdrant at scale | Start simple, migrate when needed |

## Blockers

_None currently_

## Notes

_Phase 0 complete (2026-04-05). Ready to begin Phase 1: Auth & Foundation._
