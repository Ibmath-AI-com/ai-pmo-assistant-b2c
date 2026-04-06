# Phase 2: Workspace & Persona Service

## Task 1: Create database models for workspace domain

Create SQLAlchemy models in `services/shared/db/models/`:
- `workspace.py` — workspace, workspace_setting, workspace_tag, workspace_content_entity, workspace_member tables

Follow the schema from `schema.sql` exactly.

**Verify:** `python -c "from db.models.workspace import *; print('OK')"`

---

## Task 2: Create database models for persona domain

Create SQLAlchemy models in `services/shared/db/models/`:
- `persona.py` — persona, persona_domain_tag, persona_behavior_setting, persona_model_policy, persona_allowed_model, persona_workspace_mapping, persona_knowledge_collection, persona_access_role tables

**Verify:** `python -c "from db.models.persona import *; print('OK')"`

---

## Task 3: Generate Alembic migration for workspace & persona

Run: `cd services/shared && alembic revision --autogenerate -m "002_workspace_persona_tables"`

Review the migration file.

Run: `alembic upgrade head`

**Verify:** Connect to postgres and confirm all workspace + persona tables exist

---

## Task 4: Create persona-service FastAPI skeleton

Create `services/persona-service/app/main.py`:
- FastAPI app with title "AI PMO - Persona Service"
- Health check endpoint
- Include CORS middleware
- Register all routers

Create `services/persona-service/Dockerfile`
Create `services/persona-service/requirements.txt`

**Verify:** `uvicorn app.main:app --port 8002` starts cleanly

---

## Task 5: Implement workspace CRUD endpoints

Create `services/persona-service/app/api/workspaces.py`:
- `POST /api/v1/workspaces` — create workspace
- `GET /api/v1/workspaces` — list user workspaces
- `GET /api/v1/workspaces/{id}` — get workspace details
- `PUT /api/v1/workspaces/{id}` — update workspace
- `POST /api/v1/workspaces/{id}/members` — add member
- `DELETE /api/v1/workspaces/{id}/members/{user_id}` — remove member
- `PUT /api/v1/workspaces/{id}/settings` — update settings

Create `services/persona-service/app/services/workspace_service.py` — business logic

**Verify:** Create workspace → add member → update settings → list workspaces

---

## Task 6: Implement persona CRUD endpoints (Step 1: Basic Info)

Create `services/persona-service/app/api/personas.py`:
- `GET /api/v1/personas` — list personas (filtered by org, category, status)
- `POST /api/v1/personas` — create persona with basic info
- `GET /api/v1/personas/{id}` — get full persona details
- `PUT /api/v1/personas/{id}` — update persona basic info
- `PATCH /api/v1/personas/{id}/status` — activate/deactivate/delete

Create `services/persona-service/app/services/persona_service.py` — business logic

**Verify:** Create persona → get → update → list with filters

---

## Task 7: Implement persona AI behavior endpoint (Step 2)

Add to `services/persona-service/app/api/personas.py`:
- `PUT /api/v1/personas/{id}/behavior` — update AI behavior settings (system_instruction, tone_of_voice, response_format_preference, hallucination_guard_mode, temperature, max_response_length)

Add to `services/persona-service/app/api/model_policy.py`:
- `PUT /api/v1/personas/{id}/model-policy` — update LLM routing config (chat_mode, use_rag, use_internal_llm, use_external_llm, classification_limit)
- `PUT /api/v1/personas/{id}/allowed-models` — set which LLM models this persona can use with priority order

**Verify:** Create persona → set behavior → set model policy → verify all saved

---

## Task 8: Implement persona knowledge base endpoint (Step 3)

Add to `services/persona-service/app/api/personas.py`:
- `PUT /api/v1/personas/{id}/knowledge` — update KB collection mappings (persona_knowledge_collection)
- `PUT /api/v1/personas/{id}/domain-tags` — update domain tags, SDLC applicability

**Verify:** Map persona to knowledge collections → verify retrieval

---

## Task 9: Implement persona extra settings endpoint (Step 4)

Add to `services/persona-service/app/api/personas.py`:
- `PUT /api/v1/personas/{id}/access` — update access settings (data_classification_limit, persona_access_role mappings, hallucination_guard_mode)

**Verify:** Set access roles → verify only authorized users can access persona

---

## Task 10: Implement skill-persona mapping endpoints

Create `services/persona-service/app/api/skills.py`:
- `GET /api/v1/personas/{id}/skills` — list skills mapped to persona
- `POST /api/v1/personas/{id}/skills` — map skill to persona
- `DELETE /api/v1/personas/{id}/skills/{skill_id}` — unmap skill

**Verify:** Map skills to persona → list → unmap → verify

---

## Task 11: Publish persona events via RabbitMQ

Add event publishing to persona_service.py:
- `persona.created` — when new persona created
- `persona.updated` — when persona settings changed
- `workspace.created` — when new workspace created
- `workspace.member.added` — when member added to workspace

**Verify:** Check RabbitMQ management UI (localhost:15672) for published messages

---

## Task 12: Add gateway routes for persona-service

Update `services/gateway/app/main.py`:
- Route `/api/v1/workspaces/*` → persona-service:8002
- Route `/api/v1/personas/*` → persona-service:8002

**Verify:** Requests through gateway reach persona-service correctly

---

## Task 13: Build frontend — Personas management page

Create `src/routes/personas/PersonaListPage.tsx`:
- Match PDF mockup page 8
- Search/filter bar (Document Title, Type, Collection, Classification, SDLC, Domain, Persona Relevance, Status)
- "Add New Persona" button
- Persona cards with name, role title, category, RAG/ILLM/XLLM badges
- Action menu: View, Edit, Deactivate, Delete

Create `src/lib/api/personas.ts` — API client functions
Create `src/lib/hooks/usePersonas.ts` — TanStack Query hooks

**Verify:** `npm run build` passes, page renders with mock data

---

## Task 14: Build frontend — Create Persona wizard (4 steps)

Create `src/routes/personas/PersonaWizardPage.tsx`:
- Step indicator at top (1. Basic Information → 2. AI Behavior → 3. Knowledge Base → 4. Extra Settings)
- Back/Next buttons

Create step components:
- `src/components/persona/BasicInfoStep.tsx` — (PDF page 9) name, role title, category dropdown, description, avatar upload
- `src/components/persona/AIBehaviorStep.tsx` — (PDF page 10) system instruction textarea, tone dropdown, response format dropdown, RAG/LLM usage dropdown with 7 modes
- `src/components/persona/KnowledgeBaseStep.tsx` — (PDF page 11) allowed KB collections, allowed LLMs, SDLC applicability, domain tags, retrieval depth level
- `src/components/persona/ExtraSettingsStep.tsx` — (PDF page 12) data classification limit, access level, hallucination guard toggle

**Verify:** `npm run build` passes, wizard navigation works, form validation works

---

## Task 15: Link frontend UI with persona-service API calls

Connect all persona & workspace frontend pages to real API endpoints:
- `src/lib/api/workspaces.ts` — workspace CRUD API calls
- `src/lib/hooks/useWorkspaces.ts` — TanStack Query hooks for workspaces
- Wire `PersonaListPage.tsx` to `GET /api/v1/personas` — load real data, show loading/error states
- Wire `PersonaWizardPage.tsx` to `POST /api/v1/personas` + step endpoints — submit to real API
- Wire workspace selector in SubHeader to `GET /api/v1/workspaces`
- Handle auth errors (401 → redirect to login)

**Verify:** Login → see real personas list → create persona via wizard → data persists on refresh

---

## Task 17: Write persona-service tests

Create `services/persona-service/tests/`:
- `test_workspaces.py` — workspace CRUD, member management
- `test_personas.py` — persona CRUD, 4-step wizard flow
- `test_behavior.py` — AI behavior settings, model policy
- `test_skills.py` — skill-persona mapping

**Verify:** `pytest services/persona-service/tests/ -v` — all pass

---

## Phase 2 Complete

1. Workspace CRUD with members and settings working
2. Full persona 4-step wizard working (API + frontend)
3. Skill-persona mapping working
4. Events publishing to RabbitMQ
5. Gateway routing updated
6. Update PROGRESS.md
7. Git commit: `git add -A && git commit -m "Phase 2: Workspace & persona service complete"`
