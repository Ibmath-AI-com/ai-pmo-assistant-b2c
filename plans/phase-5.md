# Phase 5: Template & Report Service

## Task 1: Create database models for template domain

Create SQLAlchemy models in `services/shared/db/models/`:
- `template.py` — template, template_version, template_file_mapping, custom_template, generated_document tables

**Verify:** All models import cleanly

---

## Task 2: Generate Alembic migration

Run: `alembic revision --autogenerate -m "005_template_tables"`
Run: `alembic upgrade head`

**Verify:** All template tables exist

---

## Task 3: Create template-service FastAPI skeleton

Create `services/template-service/app/main.py`
Create Dockerfile + requirements.txt (include `jinja2`, `weasyprint`, `python-docx`, `python-pptx`)

**Verify:** Service starts on port 8006

---

## Task 4: Implement template CRUD endpoints

Create `services/template-service/app/api/templates.py`:
- `GET /api/v1/templates` — list templates (system + user)
- `POST /api/v1/templates` — create template
- `GET /api/v1/templates/{id}` — get template with version history
- `PUT /api/v1/templates/{id}` — update template
- `POST /api/v1/templates/{id}/versions` — create new version

Seed system templates: Project Status Report, Project Charter, RAID Log, Risk Register

**Verify:** CRUD works, versioning creates new records

---

## Task 5: Implement report generation endpoint

Create `services/template-service/app/api/generation.py`:
- `POST /api/v1/reports/generate` — generate report from template + AI data
  - Input: template_id, chat_session_id (for context), additional_data (JSON)
  - Process: load template → call ai-orchestrator to extract/fill data → render
  - Output: generated_document record with rendered content

Create `services/template-service/app/services/render_service.py`:
- `RenderService` class
- `render_template(template_body, data)` — Jinja2 rendering
- `detect_missing_fields(template_body, data)` — identify unfilled fields

**Verify:** Generate report from template → get rendered output with data

---

## Task 6: Implement export service

Create `services/template-service/app/services/export_service.py`:
- `export_to_pdf(html_content)` — via WeasyPrint
- `export_to_docx(content, template)` — via python-docx
- `export_to_pptx(content, template)` — via python-pptx

Create `services/template-service/app/api/exports.py`:
- `GET /api/v1/reports/{id}/download?format=pdf` — download generated report
- Supported formats: pdf, docx, pptx

**Verify:** Generate report → download as PDF → verify content correct

---

## Task 7: Add gateway routes

Update gateway:
- Route `/api/v1/templates/*` → template-service:8006
- Route `/api/v1/reports/*` → template-service:8006

**Verify:** Template and report endpoints accessible via gateway

---

## Task 8: Build frontend — Report display in chat

Update `src/components/chat/ReportCard.tsx`:
- Rich report card matching PDF mockup page 2 (donut chart, key risks, milestones, summary)
- "Download the full Report" link → calls export endpoint

Add report generation trigger to chat input (via ready prompts).

**Verify:** Generate report in chat → card renders → download works

---

## Task 9: Link frontend UI with template-service API calls

Connect report/template pages to real API endpoints:
- `src/lib/api/templates.ts` — templates, generation, export API calls
- `src/lib/hooks/useTemplates.ts` — TanStack Query hooks
- Wire report card download button to `GET /api/v1/reports/{id}/export?format=pdf`
- Wire report generation trigger in chat to `POST /api/v1/reports/generate`
- Handle loading states during generation (can take 10–30s)
- Handle auth errors (401 → redirect to login)

**Verify:** Trigger report generation in chat → card renders → download as PDF works

---

## Task 11: Write template-service tests

Create `services/template-service/tests/`:
- `test_templates.py` — CRUD, versioning
- `test_generation.py` — report generation pipeline
- `test_export.py` — PDF, DOCX, PPTX export

**Verify:** All tests pass

---

## Phase 5 Complete

1. Template CRUD with versioning working
2. AI-powered report generation from templates
3. Export to PDF, DOCX, PPTX
4. Report card display in chat
5. Update PROGRESS.md
6. Git commit: `git add -A && git commit -m "Phase 5: Template & report service complete"`
