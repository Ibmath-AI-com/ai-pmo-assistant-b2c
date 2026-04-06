# Phase 6: Admin Service & Billing

## Task 1: Create database models for admin domain

Create SQLAlchemy models in `services/shared/db/models/`:
- `admin.py` — system_parameter, system_lookup, audit_log, notification tables
- `subscription.py` — package, package_feature, organization_subscription, user_subscription, subscription_usage tables

**Verify:** All models import cleanly

---

## Task 2: Generate Alembic migration

Run: `alembic revision --autogenerate -m "006_admin_subscription_tables"`
Run: `alembic upgrade head`

Seed default packages (Intro, Base, Pro, Enterprise) with features.

**Verify:** All tables exist, package seed data present

---

## Task 3: Create admin-service FastAPI skeleton

Create `services/admin-service/app/main.py`
Create Dockerfile + requirements.txt

**Verify:** Service starts on port 8007

---

## Task 4: Implement system parameters endpoints

Create `services/admin-service/app/api/system_params.py`:
- `GET /api/v1/admin/parameters` — list parameters (filtered by org)
- `PUT /api/v1/admin/parameters/{id}` — update parameter value

**Verify:** List → update → verify changed

---

## Task 5: Implement system lookups endpoints

Create `services/admin-service/app/api/lookups.py`:
- `GET /api/v1/admin/lookups` — list lookup categories
- `GET /api/v1/admin/lookups/{category}` — get items in category
- `POST /api/v1/admin/lookups/{category}` — add item (English + Arabic values)
- `PUT /api/v1/admin/lookups/{category}/{id}` — update item

Seed default lookups: countries, persona_categories, document_types, classification_levels, sdlc_types

**Verify:** List categories → get items → add → update

---

## Task 6: Implement audit log endpoints

Create `services/admin-service/app/api/audit.py`:
- `GET /api/v1/admin/audit-logs` — list with filters (user, module, entity, date range, activity_type)
- Pagination support

Create audit logging middleware/utility that other services can call.

**Verify:** Perform actions in other services → verify audit entries appear

---

## Task 7: Implement notification endpoints

Create `services/admin-service/app/api/notifications.py`:
- `GET /api/v1/notifications` — list user notifications (unread first)
- `PATCH /api/v1/notifications/{id}/read` — mark as read
- `POST /api/v1/notifications/read-all` — mark all read
- `GET /api/v1/notifications/unread-count` — badge count

Create notification service that publishes notifications via RabbitMQ.

**Verify:** Create notification → list → mark read → count updates

---

## Task 8: Implement package & subscription endpoints

Create `services/admin-service/app/api/packages.py`:
- `GET /api/v1/packages` — list packages with features
- `GET /api/v1/packages/{id}` — package details

Create `services/admin-service/app/api/subscriptions.py`:
- `POST /api/v1/subscriptions` — create subscription (org or user)
- `GET /api/v1/subscriptions/current` — current active subscription
- `PUT /api/v1/subscriptions/{id}/upgrade` — upgrade plan
- `GET /api/v1/subscriptions/{id}/usage` — usage stats (LLM calls, tokens, storage)

**Verify:** Subscribe to plan → check usage → upgrade → verify

---

## Task 9: Add gateway routes

Update gateway:
- Route `/api/v1/admin/*` → admin-service:8007
- Route `/api/v1/packages/*` → admin-service:8007
- Route `/api/v1/subscriptions/*` → admin-service:8007
- Route `/api/v1/notifications/*` → admin-service:8007

**Verify:** All admin endpoints accessible via gateway

---

## Task 10: Build frontend — Admin Panel dashboard

Create `src/routes/admin/AdminDashboard.tsx`:
- Match PDF mockup page 14
- Cards: Users Management, Roles & Permissions, System Parameters, System Lookups, Packages Management

**Verify:** Dashboard renders with navigation cards

---

## Task 11: Build frontend — Users Management page

Create `src/routes/admin/UsersPage.tsx`:
- Match PDF mockup page 15
- Search/filter (username, permission group, full name, gender, DOB, mobile, status)
- "Add User" button
- Data table with avatar, full name, username, email, mobile, gender, DOB, status
- Action menu: Edit, Reset Password, Deactivate
- Pagination

**Verify:** `npm run build` passes, page renders

---

## Task 12: Build frontend — Roles & Permissions page

Create `src/routes/admin/RolesPage.tsx`:
- Match PDF mockup page 16
- Search by permission group, status, date range
- "Create Permission Group" button
- Table: Permission Group Name, No. of Permissions, No. of Users, Status
- Action menu: Edit, Reset Password, Deactivate

**Verify:** Page renders, CRUD works

---

## Task 13: Build frontend — System Parameters & Lookups

Create `src/routes/admin/SettingsPage.tsx`:
- Match PDF mockup page 17 — parameter name + value + edit icon

Create `src/routes/admin/LookupsPage.tsx`:
- Match PDF mockup page 18 — left: lookup categories list, right: items table (English + Arabic values)

**Verify:** Both pages render and function

---

## Task 14: Build frontend — Packages/Pricing page

Create `src/routes/admin/PackagesPage.tsx`:
- Match PDF mockup page 19
- Bill Monthly / Bill Annually toggle
- 4 plan cards: Intro, Base, Pro, Enterprise
- Feature list with checkmarks
- Price display
- Pro plan highlighted with "Save $40" badge
- Choose / "Try 1 month" buttons

**Verify:** Page renders matching mockup design

---

## Task 15: Build frontend — User profile dropdown

Update `src/components/layout/Navbar.tsx`:
- Match PDF mockup page 13
- Click avatar → dropdown: user name + "Basic" badge, Admin Panel, Upgrade Plan, Settings, Logout

**Verify:** Dropdown works, navigation links function

---

## Task 16: Build frontend — Notification center

Add notification bell to navbar:
- Red badge with unread count
- Click → notification dropdown/panel
- Mark as read functionality

**Verify:** Notifications appear, count updates on read

---

## Task 17: Link frontend UI with admin-service API calls

Connect all admin pages to real API endpoints:
- `src/lib/api/admin.ts` — users, roles, parameters, lookups, audit, packages API calls
- `src/lib/hooks/useAdmin.ts` — TanStack Query hooks
- Wire `UsersPage.tsx` to `GET /api/v1/users` — real user list with pagination
- Wire `RolesPage.tsx` to `GET /api/v1/roles` + permissions CRUD
- Wire `SettingsPage.tsx` to `GET/PUT /api/v1/admin/parameters`
- Wire `PackagesPage.tsx` to `GET /api/v1/packages`
- Wire user profile dropdown (logout → `POST /api/v1/auth/logout` → clear token)
- Wire notification bell to `GET /api/v1/admin/notifications`
- Handle auth errors (401 → redirect to login)

**Verify:** Login as admin → manage users/roles → change settings → logout works

---

## Task 19: Write admin-service tests

Create `services/admin-service/tests/`:
- `test_parameters.py`
- `test_lookups.py`
- `test_audit.py`
- `test_notifications.py`
- `test_packages.py`
- `test_subscriptions.py`

**Verify:** All tests pass

---

## Phase 6 Complete

1. Full admin panel with all management pages
2. System parameters and lookups (bilingual)
3. Audit logging across services
4. Notification system
5. Package/subscription management
6. Frontend matches all admin mockup pages
7. Update PROGRESS.md
8. Git commit: `git add -A && git commit -m "Phase 6: Admin service & billing complete"`
