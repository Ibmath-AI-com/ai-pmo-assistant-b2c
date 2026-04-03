# Phase 1: Auth & Foundation Service

## Task 1: Create database models for auth domain

Create SQLAlchemy models in `services/shared/db/models/`:
- `organization.py` — organization table
- `user.py` — user, user_profile tables
- `role.py` — role, permission, role_permission, user_role, user_access_override tables
- `session.py` — user_session table

Follow the schema from `schema.sql` exactly.
Import all models in `services/shared/db/models/__init__.py`.

**Verify:** `python -c "from db.models import *; print('All models loaded')"`

---

## Task 2: Generate first Alembic migration

Run: `cd services/shared && alembic revision --autogenerate -m "001_auth_tables"`

Review the generated migration file to ensure all tables match schema.sql.

Run: `alembic upgrade head`

**Verify:** Connect to postgres and run `\dt` — should show all auth tables

---

## Task 3: Create auth-service FastAPI app skeleton

Create `services/auth-service/app/main.py`:
- FastAPI app with title "AI PMO - Auth Service"
- Include CORS middleware
- Health check endpoint: `GET /health`
- Import routers (created in next tasks)

Create `services/auth-service/Dockerfile`:
- Python 3.12-slim base
- Install requirements
- Run with uvicorn on port 8001

**Verify:** `cd services/auth-service && uvicorn app.main:app --port 8001` starts

---

## Task 4: Implement registration endpoint

Create `services/auth-service/app/api/auth.py`:
- `POST /api/v1/auth/register` — create user (B2C: auto-create personal org)
- Hash password with passlib bcrypt
- Return user_id + access_token

Create `services/auth-service/app/services/auth_service.py`:
- `register(data)` — business logic
- `create_personal_org(user)` — for B2C users

**Verify:** `curl -X POST localhost:8001/api/v1/auth/register -d '{"username":"test","email":"test@test.com","password":"test123"}'`

---

## Task 5: Implement login endpoint

Add to `services/auth-service/app/api/auth.py`:
- `POST /api/v1/auth/login` — validate credentials, return JWT pair
- `POST /api/v1/auth/refresh` — refresh access token
- `POST /api/v1/auth/logout` — invalidate session

**Verify:** Register → Login → Use access token → Refresh → Logout flow works

---

## Task 6: Implement user CRUD endpoints

Create `services/auth-service/app/api/users.py`:
- `GET /api/v1/users` — list users (filtered by org for B2B)
- `GET /api/v1/users/{id}` — get user details
- `PUT /api/v1/users/{id}` — update user
- `PATCH /api/v1/users/{id}/status` — activate/deactivate

**Verify:** CRUD operations work with proper auth

---

## Task 7: Implement organization & department endpoints (B2B)

Create `services/auth-service/app/api/organizations.py`:
- `POST /api/v1/organizations`
- `GET /api/v1/organizations/{id}`
- `PUT /api/v1/organizations/{id}`

Create `services/auth-service/app/api/departments.py`:
- `POST /api/v1/departments`
- `GET /api/v1/departments`
- `PUT /api/v1/departments/{id}`

**Verify:** Create org → create department → verify hierarchy

---

## Task 8: Implement roles & permissions endpoints

Create `services/auth-service/app/api/roles.py`:
- `GET /api/v1/roles`
- `POST /api/v1/roles`
- `PUT /api/v1/roles/{id}`
- `PUT /api/v1/roles/{id}/permissions`
- `GET /api/v1/permissions`

**Verify:** Create role → assign permissions → assign to user → check access

---

## Task 9: Create gateway service

Create `services/gateway/app/main.py`:
- Reverse proxy routing to all backend services
- JWT validation middleware (calls shared auth)
- Rate limiting middleware (Redis-based)
- Tenant resolution middleware
- CORS configuration
- Health check

**Verify:** Requests to `localhost:8000/api/v1/auth/login` proxy correctly to auth-service

---

## Task 10: Build frontend login page

Create `src/routes/auth/LoginPage.tsx`:
- Match the design from PDF mockup page 1
- Dark theme, logo on left, form on right
- Username + Password fields
- "Remember me" checkbox
- "Forgot Password?" link
- "Sign In" button
- "Don't have an account? Sign up" link

Connect to auth API via `src/lib/api/auth.ts`.
Store JWT in Zustand store (`src/lib/stores/authStore.ts`).

**Verify:** `npm run build` passes, login flow works end-to-end

---

## Task 11: Build main layout shell

Create `src/components/layout/Navbar.tsx`:
- Match PDF page 2: logo + nav (Home, Knowledge Hub, Personas, Admin Panel) + notifications + user avatar dropdown

Create `src/components/layout/Sidebar.tsx`:
- Personas list, Ready Prompts, Recent Chats sections

Add protected route wrapper that redirects to login if not authenticated.

**Verify:** Login → see main layout → nav works

---

## Task 12: Write auth tests

Create `services/auth-service/tests/`:
- `test_register.py` — registration flow (B2B and B2C)
- `test_login.py` — login, token validation, refresh, logout
- `test_rbac.py` — role creation, permission assignment, access check
- `test_users.py` — user CRUD

**Verify:** `pytest services/auth-service/tests/ -v` — all pass

---

## Phase 1 Complete

1. Full auth flow working: register → login → access protected routes → refresh → logout
2. RBAC working: roles, permissions, user assignment
3. Gateway proxying correctly
4. Frontend login page + main layout shell
5. Update PROGRESS.md
6. Git commit: `git add -A && git commit -m "Phase 1: Auth & foundation complete"`
