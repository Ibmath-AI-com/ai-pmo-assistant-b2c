# Application Folder Structure
# AI PMO & Strategy Assistant
# This is the FULL structure created across Phase 0-8

ai-pmo-assistant/
│
│── ─── PROJECT DOCS (created now) ──────────────────────────
│
├── CLAUDE.md                              # Claude Code project context
├── PRD.md                                 # Product requirements
├── SCP.md                                 # Source code plan
├── PROGRESS.md                            # Build progress tracker
├── README.md                              # Project readme
├── schema.sql                             # Full database schema
│
├── .claude/                               # Claude Code config
│   ├── commands/
│   │   ├── onboard.md
│   │   ├── build.md
│   │   └── task.md
│   └── settings.json
│
├── plans/                                 # Phase plan files
│   ├── phase-0.md ... phase-8.md
│
│── ─── INFRASTRUCTURE (Phase 0) ────────────────────────────
│
├── docker-compose.yml                     # Dev: PostgreSQL, Redis, RabbitMQ, MinIO
├── docker-compose.prod.yml                # Prod: all services + infra
├── .env.example                           # Environment template
├── .env                                   # Local env (gitignored)
├── .gitignore
├── .pre-commit-config.yaml
├── pyproject.toml                         # Ruff + mypy config
│
├── infrastructure/
│   ├── docker/                            # One Dockerfile per service
│   │   ├── gateway.Dockerfile
│   │   ├── auth-service.Dockerfile
│   │   ├── persona-service.Dockerfile
│   │   ├── chat-service.Dockerfile
│   │   ├── ai-orchestrator.Dockerfile
│   │   ├── knowledge-service.Dockerfile
│   │   ├── template-service.Dockerfile
│   │   ├── admin-service.Dockerfile
│   │   └── frontend.Dockerfile
│   │
│   ├── helm/                              # Kubernetes charts
│   │   ├── charts/
│   │   │   ├── auth-service/
│   │   │   │   ├── Chart.yaml
│   │   │   │   ├── values.yaml
│   │   │   │   └── templates/
│   │   │   │       ├── deployment.yaml
│   │   │   │       ├── service.yaml
│   │   │   │       ├── configmap.yaml
│   │   │   │       └── hpa.yaml
│   │   │   ├── chat-service/
│   │   │   ├── persona-service/
│   │   │   ├── ai-orchestrator/
│   │   │   ├── knowledge-service/
│   │   │   ├── template-service/
│   │   │   ├── admin-service/
│   │   │   └── gateway/
│   │   └── values/
│   │       ├── cloud.yaml
│   │       └── onprem.yaml
│   │
│   ├── terraform/                         # AWS infrastructure
│   │   └── aws/
│   │       ├── main.tf
│   │       ├── eks.tf
│   │       ├── rds.tf
│   │       ├── elasticache.tf
│   │       └── s3.tf
│   │
│   ├── monitoring/
│   │   ├── prometheus.yml
│   │   └── grafana/
│   │       └── dashboards/
│   │
│   └── scripts/
│       ├── install.sh                     # On-prem installer
│       ├── upgrade.sh
│       ├── health-check.sh
│       ├── backup-db.sh
│       └── restore-db.sh
│
│── ─── SHARED LIBRARY (Phase 0) ────────────────────────────
│
├── services/
│   ├── shared/                            # Shared code used by ALL services
│   │   ├── requirements.txt               # Shared Python dependencies
│   │   ├── __init__.py
│   │   │
│   │   ├── config/
│   │   │   ├── __init__.py
│   │   │   └── settings.py                # Pydantic BaseSettings (env vars)
│   │   │
│   │   ├── db/
│   │   │   ├── __init__.py
│   │   │   ├── base.py                    # Async engine, session factory, get_db
│   │   │   ├── models/
│   │   │   │   ├── __init__.py            # Imports all models
│   │   │   │   ├── base.py                # Base class, UUIDMixin, TimestampMixin
│   │   │   │   ├── organization.py        # organization, department
│   │   │   │   ├── user.py                # user, user_profile
│   │   │   │   ├── role.py                # role, permission, role_permission, user_role, user_access_override
│   │   │   │   ├── session.py             # user_session
│   │   │   │   ├── workspace.py           # workspace, workspace_setting, workspace_tag, workspace_content_entity, workspace_member
│   │   │   │   ├── persona.py             # persona, persona_domain_tag, persona_behavior_setting, persona_model_policy, persona_allowed_model, persona_workspace_mapping, persona_knowledge_collection, persona_access_role
│   │   │   │   ├── chat.py                # chat_session, chat_message, chat_attachment
│   │   │   │   ├── ai.py                  # ai_run, ai_run_retrieval_source, generated_output, output_feedback
│   │   │   │   ├── prompt.py              # prompt_library, prompt_persona_mapping
│   │   │   │   ├── knowledge.py           # knowledge_collection, knowledge_document, knowledge_document_governance, knowledge_document_tag, knowledge_document_access, knowledge_document_persona, knowledge_document_rag_setting, document_chunk, document_embedding, document_ingestion_job
│   │   │   │   ├── file.py                # file, file_version, workspace_file
│   │   │   │   ├── connector.py           # connector_source, connector_document
│   │   │   │   ├── llm.py                 # llm_model, api_integration, api_integration_usage_log
│   │   │   │   ├── template.py            # template, template_version, template_file_mapping, custom_template, generated_document
│   │   │   │   ├── skill.py               # skill, skill_persona_mapping, skill_execution_log, skill_version
│   │   │   │   ├── admin.py               # system_parameter, system_lookup, audit_log, notification
│   │   │   │   └── subscription.py        # package, package_feature, organization_subscription, user_subscription, subscription_usage
│   │   │   │
│   │   │   └── migrations/                # Alembic
│   │   │       ├── env.py
│   │   │       ├── script.py.mako
│   │   │       └── versions/
│   │   │           ├── 001_auth_tables.py
│   │   │           ├── 002_workspace_persona_tables.py
│   │   │           ├── 003_knowledge_file_llm_tables.py
│   │   │           ├── 004_chat_ai_skill_tables.py
│   │   │           ├── 005_template_tables.py
│   │   │           └── 006_admin_subscription_tables.py
│   │   │
│   │   ├── auth/
│   │   │   ├── __init__.py
│   │   │   ├── jwt.py                     # create_access_token, create_refresh_token, decode_token
│   │   │   └── dependencies.py            # get_current_user FastAPI dependency
│   │   │
│   │   ├── events/
│   │   │   ├── __init__.py
│   │   │   ├── publisher.py               # EventPublisher (RabbitMQ via aio-pika)
│   │   │   └── consumer.py                # EventConsumer base class
│   │   │
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py                    # LoginRequest, TokenResponse, etc.
│   │   │   ├── user.py                    # UserCreate, UserResponse, etc.
│   │   │   ├── persona.py                 # PersonaCreate, PersonaResponse, etc.
│   │   │   └── common.py                  # PaginatedResponse, StatusUpdate, etc.
│   │   │
│   │   └── utils/
│   │       ├── __init__.py
│   │       ├── pagination.py              # Pagination helper
│   │       ├── audit.py                   # Audit log helper
│   │       └── tenant.py                  # Tenant context (B2B/B2C)
│   │
│── ─── BACKEND MICROSERVICES ───────────────────────────────
│   │
│   │   # Every service follows the SAME internal structure:
│   │   # app/
│   │   #   main.py          — FastAPI app factory + router registration
│   │   #   api/             — Route handlers (thin, call services)
│   │   #   services/        — Business logic
│   │   #   events/          — RabbitMQ publishers + consumers
│   │   # tests/
│   │   #   unit/
│   │   #   integration/
│   │   #   conftest.py
│   │   # Dockerfile
│   │   # requirements.txt
│   │
│   ├── gateway/                           # Port 8000 — API Gateway
│   │   ├── app/
│   │   │   ├── __init__.py
│   │   │   ├── main.py                    # FastAPI app, mounts all routes
│   │   │   ├── middleware/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── auth.py                # JWT validation on every request
│   │   │   │   ├── rate_limit.py          # Redis-based rate limiting
│   │   │   │   ├── tenant.py              # Extract org_id, tenant_type from token
│   │   │   │   └── cors.py                # CORS configuration
│   │   │   └── routes/
│   │   │       ├── __init__.py
│   │   │       └── proxy.py               # Reverse proxy to downstream services
│   │   ├── tests/
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   │
│   ├── auth-service/                      # Port 8001 — Auth, Users, Orgs, Roles
│   │   ├── app/
│   │   │   ├── __init__.py
│   │   │   ├── main.py
│   │   │   ├── api/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── auth.py                # register, login, refresh, logout, forgot/reset password
│   │   │   │   ├── users.py               # user CRUD
│   │   │   │   ├── organizations.py       # org CRUD (B2B)
│   │   │   │   ├── departments.py         # department CRUD (B2B)
│   │   │   │   └── roles.py               # roles, permissions, assignment
│   │   │   ├── services/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── auth_service.py        # Login/register logic, password hashing
│   │   │   │   ├── user_service.py        # User CRUD logic
│   │   │   │   └── rbac_service.py        # Role-based access control logic
│   │   │   └── events/
│   │   │       ├── __init__.py
│   │   │       ├── publishers.py          # user.created, user.updated
│   │   │       └── consumers.py
│   │   ├── tests/
│   │   │   ├── test_auth.py
│   │   │   ├── test_users.py
│   │   │   ├── test_rbac.py
│   │   │   └── conftest.py
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   │
│   ├── persona-service/                   # Port 8002 — Personas, Workspaces, Skills mapping
│   │   ├── app/
│   │   │   ├── __init__.py
│   │   │   ├── main.py
│   │   │   ├── api/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── personas.py            # CRUD + 4-step wizard endpoints
│   │   │   │   ├── behavior.py            # AI behavior settings
│   │   │   │   ├── model_policy.py        # LLM routing config
│   │   │   │   ├── workspaces.py          # Workspace CRUD + members
│   │   │   │   └── skills.py              # Skill-persona mapping
│   │   │   ├── services/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── persona_service.py
│   │   │   │   ├── workspace_service.py
│   │   │   │   └── skill_service.py
│   │   │   └── events/
│   │   │       ├── publishers.py          # persona.created, workspace.created
│   │   │       └── consumers.py
│   │   ├── tests/
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   │
│   ├── chat-service/                      # Port 8003 — Chat, WebSocket, Messages
│   │   ├── app/
│   │   │   ├── __init__.py
│   │   │   ├── main.py
│   │   │   ├── api/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── sessions.py            # Chat session CRUD
│   │   │   │   ├── messages.py            # Message CRUD (HTTP fallback)
│   │   │   │   └── attachments.py         # File attachments
│   │   │   ├── websocket/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── chat_handler.py        # WS /api/v1/ws/chat/{session_id}
│   │   │   │   └── connection_manager.py  # Active connection tracking
│   │   │   ├── services/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── chat_service.py
│   │   │   │   └── session_service.py
│   │   │   └── events/
│   │   │       ├── publishers.py          # chat.message.created
│   │   │       └── consumers.py           # ai.run.completed → stream to user
│   │   ├── tests/
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   │
│   ├── ai-orchestrator/                   # Port 8004 — AI Engine (LLM, RAG, Skills)
│   │   ├── app/
│   │   │   ├── __init__.py
│   │   │   ├── main.py
│   │   │   ├── api/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── generate.py            # Direct generation endpoint
│   │   │   │   ├── prompts.py             # Prompt library CRUD
│   │   │   │   └── feedback.py            # Output feedback
│   │   │   ├── core/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── generation_pipeline.py # Full orchestration: skills → RAG → LLM → guardrails
│   │   │   │   ├── llm_router.py          # 7-mode routing engine
│   │   │   │   ├── rag_pipeline.py        # Retrieval with metadata filters
│   │   │   │   ├── prompt_manager.py      # Prompt composition + versioning
│   │   │   │   ├── context_manager.py     # Chat history + summarization
│   │   │   │   ├── guardrails.py          # Hallucination detection, PII check
│   │   │   │   └── output_parser.py       # Structured output extraction
│   │   │   ├── skills/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── engine.py              # Skill orchestration (pre/post processing)
│   │   │   │   ├── registry.py            # Skill discovery + loading
│   │   │   │   ├── executor.py            # Execute + log individual skills
│   │   │   │   └── builtin/
│   │   │   │       ├── __init__.py
│   │   │   │       ├── pmo_analysis.py    # Project health scoring
│   │   │   │       ├── risk_assessment.py # Risk identification + RAID
│   │   │   │       ├── report_generator.py# Template-driven report gen
│   │   │   │       ├── strategy_evaluator.py # Balanced scorecard
│   │   │   │       ├── template_filler.py # Smart template population
│   │   │   │       └── data_extractor.py  # Structured data extraction
│   │   │   ├── providers/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── base.py                # Abstract LLM provider
│   │   │   │   ├── openai_provider.py     # GPT-4o, GPT-4o-mini
│   │   │   │   ├── anthropic_provider.py  # Claude Sonnet 4, Opus 4
│   │   │   │   └── internal_provider.py   # vLLM / Ollama
│   │   │   └── events/
│   │   │       ├── publishers.py          # ai.run.completed
│   │   │       └── consumers.py           # chat.message.created → trigger AI
│   │   ├── tests/
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   │
│   ├── knowledge-service/                 # Port 8005 — KB, Documents, RAG data
│   │   ├── app/
│   │   │   ├── __init__.py
│   │   │   ├── main.py
│   │   │   ├── api/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── collections.py         # KB collection CRUD
│   │   │   │   ├── documents.py           # Document CRUD + 4-step wizard
│   │   │   │   ├── governance.py          # Classification, access control
│   │   │   │   ├── rag_settings.py        # RAG optimization settings
│   │   │   │   ├── files.py               # File upload/download
│   │   │   │   ├── connectors.py          # Cloud drive connectors
│   │   │   │   └── search.py              # Vector search endpoint (for ai-orchestrator)
│   │   │   ├── services/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── document_service.py    # Document CRUD logic
│   │   │   │   ├── storage_service.py     # MinIO/S3 operations
│   │   │   │   ├── ingestion_service.py   # Full pipeline orchestration
│   │   │   │   ├── docling_parser.py      # Docling wrapper (PDF/DOCX/PPTX → markdown)
│   │   │   │   ├── chunking_service.py    # Text → chunks (respect headings)
│   │   │   │   ├── embedding_service.py   # Chunks → vectors
│   │   │   │   ├── vector_store_service.py# pgvector / Qdrant operations
│   │   │   │   └── connectors/
│   │   │   │       ├── __init__.py
│   │   │   │       ├── onedrive.py        # OneDrive OAuth + file sync
│   │   │   │       ├── google_drive.py    # Google Drive OAuth + file sync
│   │   │   │       └── dropbox.py         # Dropbox OAuth + file sync
│   │   │   └── events/
│   │   │       ├── publishers.py          # knowledge.document.ingested
│   │   │       └── consumers.py           # triggers ingestion on upload
│   │   ├── tests/
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   │
│   ├── template-service/                  # Port 8006 — Templates, Reports, Export
│   │   ├── app/
│   │   │   ├── __init__.py
│   │   │   ├── main.py
│   │   │   ├── api/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── templates.py           # Template CRUD + versioning
│   │   │   │   ├── generation.py          # Report generation from template + AI
│   │   │   │   └── exports.py             # Download as PDF/DOCX/PPTX
│   │   │   ├── services/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── template_service.py    # Template CRUD logic
│   │   │   │   ├── render_service.py      # Jinja2 template rendering
│   │   │   │   └── export_service.py      # WeasyPrint, python-docx, python-pptx
│   │   │   └── events/
│   │   ├── tests/
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   │
│   └── admin-service/                     # Port 8007 — Admin, Billing, Config
│       ├── app/
│       │   ├── __init__.py
│       │   ├── main.py
│       │   ├── api/
│       │   │   ├── __init__.py
│       │   │   ├── system_params.py       # System parameter CRUD
│       │   │   ├── lookups.py             # System lookups (bilingual)
│       │   │   ├── audit.py               # Audit log queries
│       │   │   ├── notifications.py       # User notifications
│       │   │   ├── packages.py            # Package/plan management
│       │   │   └── subscriptions.py       # Subscription lifecycle
│       │   ├── services/
│       │   │   ├── __init__.py
│       │   │   ├── audit_service.py
│       │   │   ├── notification_service.py
│       │   │   └── billing_service.py
│       │   └── events/
│       ├── tests/
│       ├── Dockerfile
│       └── requirements.txt
│
│── ─── FRONTEND (React SPA) ───────────────────────────────
│
├── frontend/
│   ├── index.html                         # Vite entry HTML
│   ├── vite.config.ts                     # Vite config + proxy + Tailwind
│   ├── tailwind.config.ts
│   ├── tsconfig.json                      # Path aliases (@/ → src/)
│   ├── package.json
│   │
│   └── src/
│       ├── main.tsx                       # App entry point
│       ├── App.tsx                        # RouterProvider
│       ├── index.css                      # Tailwind imports
│       │
│       ├── routes/
│       │   ├── index.tsx                  # Route definitions (react-router-dom)
│       │   ├── auth/
│       │   │   ├── LoginPage.tsx          # PDF mockup page 1
│       │   │   └── RegisterPage.tsx
│       │   ├── home/
│       │   │   └── HomePage.tsx           # Chat page — PDF mockup page 2
│       │   ├── knowledge-hub/
│       │   │   ├── KnowledgeListPage.tsx  # PDF mockup page 3
│       │   │   └── KnowledgeWizardPage.tsx# PDF mockup pages 4-7
│       │   ├── personas/
│       │   │   ├── PersonaListPage.tsx    # PDF mockup page 8
│       │   │   └── PersonaWizardPage.tsx  # PDF mockup pages 9-12
│       │   └── admin/
│       │       ├── AdminDashboard.tsx     # PDF mockup page 14
│       │       ├── UsersPage.tsx          # PDF mockup page 15
│       │       ├── RolesPage.tsx          # PDF mockup page 16
│       │       ├── SettingsPage.tsx       # PDF mockup page 17
│       │       ├── LookupsPage.tsx        # PDF mockup page 18
│       │       └── PackagesPage.tsx       # PDF mockup page 19
│       │
│       ├── components/
│       │   ├── layout/
│       │   │   ├── AppLayout.tsx          # 3-column layout shell
│       │   │   ├── Sidebar.tsx            # Left sidebar
│       │   │   └── Navbar.tsx             # Top nav + user dropdown (PDF page 13)
│       │   ├── chat/
│       │   │   ├── ChatWindow.tsx         # Message list + scroll
│       │   │   ├── MessageBubble.tsx      # User/AI message display
│       │   │   ├── ChatInput.tsx          # Text input + file button + send
│       │   │   ├── StreamingMessage.tsx   # Token-by-token AI response
│       │   │   ├── ReportCard.tsx         # Rich report (donut, risks, milestones)
│       │   │   └── FileUploadMenu.tsx     # Local + cloud drive upload
│       │   ├── persona/
│       │   │   ├── BasicInfoStep.tsx      # Wizard step 1
│       │   │   ├── AIBehaviorStep.tsx     # Wizard step 2
│       │   │   ├── KnowledgeBaseStep.tsx  # Wizard step 3
│       │   │   └── ExtraSettingsStep.tsx  # Wizard step 4
│       │   ├── knowledge/
│       │   │   ├── BasicInfoStep.tsx      # Wizard step 1
│       │   │   ├── GovernanceStep.tsx     # Wizard step 2
│       │   │   ├── RAGOptimizationStep.tsx# Wizard step 3
│       │   │   └── ExtraSettingsStep.tsx  # Wizard step 4
│       │   ├── admin/
│       │   │   └── ... (admin-specific components)
│       │   └── ui/                        # Shadcn/ui components
│       │       ├── button.tsx
│       │       ├── input.tsx
│       │       ├── select.tsx
│       │       ├── dialog.tsx
│       │       ├── table.tsx
│       │       └── ... (auto-generated by shadcn CLI)
│       │
│       ├── lib/
│       │   ├── api/
│       │   │   ├── client.ts              # Axios instance + auth interceptor
│       │   │   ├── auth.ts                # Auth API calls
│       │   │   ├── personas.ts            # Persona API calls
│       │   │   ├── chat.ts                # Chat API calls
│       │   │   ├── knowledge.ts           # KB API calls
│       │   │   └── admin.ts               # Admin API calls
│       │   ├── hooks/
│       │   │   ├── useAuth.ts             # Auth state + login/logout
│       │   │   ├── useChat.ts             # WebSocket chat hook
│       │   │   ├── usePersonas.ts         # TanStack Query wrapper
│       │   │   └── useKnowledge.ts        # TanStack Query wrapper
│       │   ├── stores/
│       │   │   ├── authStore.ts           # Zustand: JWT tokens, user info
│       │   │   ├── chatStore.ts           # Zustand: active session, messages
│       │   │   └── uiStore.ts             # Zustand: sidebar state, theme
│       │   └── utils/
│       │       ├── formatters.ts          # Date, number formatting
│       │       └── validators.ts          # Form validation helpers
│       │
│       └── types/
│           ├── user.ts                    # User, Organization, Role types
│           ├── persona.ts                 # Persona, BehaviorSetting types
│           ├── chat.ts                    # ChatSession, Message types
│           ├── knowledge.ts               # Document, Collection types
│           └── admin.ts                   # Package, Subscription types
│
│── ─── TESTS ──────────────────────────────────────────────
│
├── tests/
│   ├── e2e/
│   │   ├── test_b2b_journey.py            # Full B2B user journey
│   │   └── test_b2c_journey.py            # Full B2C user journey
│   └── performance/
│       ├── test_chat_load.py              # WebSocket load testing
│       └── test_rag_load.py               # RAG retrieval benchmarks
│
│── ─── DOCS ───────────────────────────────────────────────
│
└── docs/
    ├── api/                               # Auto-exported OpenAPI specs
    ├── architecture/
    │   └── decisions.md                   # Architecture decision records
    ├── deployment/
    │   ├── cloud.md                       # AWS deployment guide
    │   └── onprem.md                      # On-premise installation guide
    └── skills/
        └── development-guide.md           # How to create custom skills
