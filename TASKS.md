# Phase 3: Knowledge Base — Task Plan

> Database tables already exist. Do NOT create migrations.
> Create SQLAlchemy models that map to existing tables.
> All FK references to user/organization are nullable — do not enforce.

## Task 1: Create SQLAlchemy models for knowledge tables

Create `services/shared/db/models/knowledge.py`:
- knowledge_collection, knowledge_document, knowledge_document_governance, knowledge_document_tag, knowledge_document_access, document_chunk, document_ingestion_job
- `user_id`, `owner_user_id`, `organization_id`, `created_by`, `updated_by` are nullable UUID columns with NO ForeignKey
- Internal FKs between knowledge tables are enforced (e.g. knowledge_document → knowledge_collection)

**Verify:** `python -c "from shared.db.models.knowledge import *; print('OK')"`

---

## Task 2: Create SQLAlchemy models for file tables

Create `services/shared/db/models/file.py`:
- file, file_version
- `organization_id`, `uploaded_by_id` are nullable UUID columns with NO ForeignKey
- Internal FK: file_version.file_id → file

**Verify:** `python -c "from shared.db.models.file import *; print('OK')"`

---

## Task 3: Create FastAPI app skeleton

Create `services/knowledge-service/app/main.py`:
- FastAPI app with title "Knowledge Service"
- Health check: GET /health
- Include CORS middleware
- Register all routers

Create Dockerfile and requirements.txt (include docling, boto3, celery, aio-pika).

**Verify:** `uvicorn app.main:app --port 8005` starts

---

## Task 4: Implement file upload/download

Create `app/services/storage_service.py`:
- `upload_file(file_bytes, filename, bucket)` → storage_path
- `get_download_url(storage_path)` → presigned URL (expires in 1 hour)
- `delete_file(storage_path)`

Create `app/api/files.py`:
- POST /api/v1/files/upload — accept multipart file, store in MinIO, create file record
- GET /api/v1/files/{id} — file metadata
- GET /api/v1/files/{id}/download — return presigned URL

Store organization_id and uploaded_by_id from auth header (as plain UUID, no FK).

**Verify:** Upload PDF → verify in MinIO console (localhost:9001) → download via presigned URL works

---

## Task 5: Implement collection CRUD

Create `app/api/collections.py` and `app/services/document_service.py`:
- POST /api/v1/knowledge/collections — create collection
- GET /api/v1/knowledge/collections — list (filter by organization_id from auth header)
- GET /api/v1/knowledge/collections/{id} — details with document count
- PUT /api/v1/knowledge/collections/{id} — update

**Verify:** Create 3 collections → list → update 1 → verify org filtering

---

## Task 6: Implement document CRUD — Step 1 (Basic Info)

Create `app/api/documents.py`:
- POST /api/v1/knowledge/documents — create document (link to collection and file)
- GET /api/v1/knowledge/documents — list with filters (title, type, collection_id, status)
- GET /api/v1/knowledge/documents/{id} — full details with governance, tags, access, chunks count
- PUT /api/v1/knowledge/documents/{id} — update basic info
- PATCH /api/v1/knowledge/documents/{id}/status — change status (draft/active/archived)

**Verify:** Create document with file → list with filters → get details → update → archive

---

## Task 7: Implement document governance — Step 2

Create `app/api/governance.py`:
- PUT /api/v1/knowledge/documents/{id}/governance

Fields: classification_level, department, document_owner, effective_date, review_date, expiry_date, review_status.

Creates or updates knowledge_document_governance record (one-to-one with document).

**Verify:** Set governance → GET document → governance nested in response

---

## Task 8: Implement document tagging — Step 3

Create `app/api/tags.py`:
- PUT /api/v1/knowledge/documents/{id}/tags — replace all tags (accepts list of {tag_name, tag_type})

Supported tag_types: domain, sdlc, project_type, keyword.

**Verify:** Set 5 tags → GET document → tags returned → replace with 3 → verify old removed

---

## Task 9: Implement document access control — Step 4

Add to `app/api/documents.py` or create `app/api/access.py`:
- PUT /api/v1/knowledge/documents/{id}/access — set list of {user_id, access_type}

user_id stored as plain UUID (no FK validation).

**Verify:** Set access for 3 users → GET document → access list returned → remove 1 → verify

---

## Task 10: Implement Docling document parser

Create `app/services/docling_parser.py`:
- Wrap `docling.document_converter.DocumentConverter`
- `parse(file_path: str)` → returns markdown content string
- Handle: PDF, DOCX, PPTX, XLSX, HTML, images (with OCR)
- Error handling for unsupported or corrupted files (return error, don't crash)
- Clean up temp files after parsing

**Verify:** Parse sample PDF → get markdown → tables preserved → parse DOCX → verify

---

## Task 11: Implement chunking service

Create `app/services/chunking_service.py`:
- `chunk_text(markdown: str, max_tokens: int = 512, overlap: int = 50)` → list of ChunkResult
- Each ChunkResult: chunk_no, chunk_title (from nearest heading), chunk_text, token_count
- Respect heading boundaries (don't split mid-section if possible)
- Support parent_chunk_id for hierarchical chunks (heading → sub-chunks)

**Verify:** Chunk a 10-page document → verify chunks respect headings → verify token counts

---

## Task 12: Wire document processing pipeline

Create `app/services/ingestion_service.py`:
- Orchestrate: download file from MinIO → parse with Docling → chunk → save to DB
- Track progress in document_ingestion_job table
- Celery task wrapper for background execution:

```
1. Create ingestion job record (status: 'queued')
2. Update status to 'processing'
3. Download file from MinIO to temp path
4. Parse with Docling → markdown
5. Chunk markdown → list of chunks
6. Delete existing chunks for this document (if reindex)
7. Save new chunks to document_chunk table
8. Update job: processed_chunks count, status to 'completed'
9. Publish event: knowledge.document.processed
10. Clean up temp files
```

- On error: update job status to 'failed', save error_message

**Verify:** Upload document → pipeline runs → chunks created → job shows 'completed'

---

## Task 13: Implement reindex and job status

Add to `app/api/documents.py`:
- POST /api/v1/knowledge/documents/{id}/reindex — delete old chunks, re-run pipeline

Create `app/api/jobs.py`:
- GET /api/v1/knowledge/jobs — list ingestion jobs (filter by status, document_id)
- GET /api/v1/knowledge/jobs/{id} — job details with progress (processed_chunks / total_chunks)

**Verify:** Reindex → old chunks deleted → new job created → completes → new chunks exist

---

## Task 14: Publish events

Add RabbitMQ event publishing:
- `knowledge.collection.created`
- `knowledge.document.uploaded`
- `knowledge.document.processed`
- `knowledge.document.updated`
- `knowledge.document.deleted`

**Verify:** Perform operations → check RabbitMQ management UI (localhost:15672)

---

## Task 15: Write tests

Create test files in `tests/`:
- `test_collections.py` — CRUD, org filtering
- `test_documents.py` — CRUD, 4-step wizard, status changes
- `test_files.py` — upload, download, presigned URLs
- `test_governance.py` — governance create/update
- `test_tags.py` — tag operations
- `test_ingestion.py` — full pipeline: upload → parse → chunk
- `test_jobs.py` — job status, reindex

**Verify:** `pytest tests/ -v` — all pass

---

## Done Criteria

- [ ] Collection CRUD working with org isolation
- [ ] Document CRUD with 4-step wizard (basic → governance → tags → access)
- [ ] GET document returns all nested data (governance, tags, access, chunk count)
- [ ] File upload/download via MinIO working
- [ ] Docling parsing PDF, DOCX, PPTX, XLSX successfully
- [ ] Chunking respects heading boundaries, correct token counts
- [ ] Full pipeline: upload → parse → chunk → store
- [ ] Reindex deletes old chunks and re-processes
- [ ] Job status tracking with progress
- [ ] Events publishing to RabbitMQ
- [ ] All tests passing
