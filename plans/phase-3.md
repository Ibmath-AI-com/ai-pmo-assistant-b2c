# Phase 3: Knowledge Base Service

## Task 1: Create database models for knowledge domain

Create SQLAlchemy models in `services/shared/db/models/`:
- `knowledge.py` — knowledge_collection, knowledge_document, knowledge_document_governance, knowledge_document_tag, knowledge_document_access, knowledge_document_persona, knowledge_document_rag_setting, document_chunk, document_embedding, document_ingestion_job tables
- `file.py` — file, file_version, workspace_file tables
- `connector.py` — connector_source, connector_document tables

**Verify:** `python -c "from db.models.knowledge import *; print('OK')"`

---

## Task 2: Create database models for LLM & integration domain

Create SQLAlchemy models in `services/shared/db/models/`:
- `llm.py` — llm_model, api_integration, api_integration_usage_log tables

**Verify:** All models import cleanly

---

## Task 3: Generate Alembic migration

Run: `alembic revision --autogenerate -m "003_knowledge_file_llm_tables"`
Run: `alembic upgrade head`

Seed default LLM models (GPT-4o, GPT-4o-mini, Claude Sonnet 4, Claude Opus 4, Llama 3.1 70B, Mistral Large).

**Verify:** All tables exist, seed data present in llm_model table

---

## Task 4: Create knowledge-service FastAPI skeleton

Create `services/knowledge-service/app/main.py`
Create `services/knowledge-service/Dockerfile`
Create `services/knowledge-service/requirements.txt` (include `docling`, `boto3`)

**Verify:** Service starts on port 8005

---

## Task 5: Implement file upload endpoints

Create `services/knowledge-service/app/api/files.py`:
- `POST /api/v1/files/upload` — upload file to MinIO/S3, create file record in DB
- `GET /api/v1/files/{id}` — get file metadata
- `GET /api/v1/files/{id}/download` — generate presigned download URL

Create `services/knowledge-service/app/services/storage_service.py`:
- MinIO/S3 operations via boto3
- `upload_file(file, bucket)` → storage_path
- `get_download_url(storage_path)` → presigned URL
- `delete_file(storage_path)`

**Verify:** Upload a PDF → verify stored in MinIO (check localhost:9001 MinIO console)

---

## Task 6: Implement knowledge collection endpoints

Create `services/knowledge-service/app/api/collections.py`:
- `POST /api/v1/knowledge/collections` — create collection
- `GET /api/v1/knowledge/collections` — list collections (filtered by org)
- `GET /api/v1/knowledge/collections/{id}` — get collection details with doc count
- `PUT /api/v1/knowledge/collections/{id}` — update collection

**Verify:** Create collection → list → update → verify

---

## Task 7: Implement knowledge document endpoints (Step 1: Basic Info)

Create `services/knowledge-service/app/api/documents.py`:
- `POST /api/v1/knowledge/documents` — create document with basic info + file upload
- `GET /api/v1/knowledge/documents` — list with filters (title, type, collection, classification, SDLC, domain, persona, status)
- `GET /api/v1/knowledge/documents/{id}` — get full document details
- `PUT /api/v1/knowledge/documents/{id}` — update basic info
- `PATCH /api/v1/knowledge/documents/{id}/status` — activate/deactivate

**Verify:** Upload document with file → list with filters → update

---

## Task 8: Implement document governance endpoint (Step 2)

Add to documents.py:
- `PUT /api/v1/knowledge/documents/{id}/governance` — update classification_level, department, document_owner, version_number, effective_date, review_date

**Verify:** Set governance fields → verify persisted

---

## Task 9: Implement document RAG settings endpoint (Step 3)

Add to documents.py:
- `PUT /api/v1/knowledge/documents/{id}/rag` — update sdlc_applicability, domain tags, project_type, keywords, persona_relevance mappings, priority_weight

**Verify:** Set RAG settings → verify tags and mappings created

---

## Task 10: Implement document extra settings endpoint (Step 4)

Add to documents.py:
- `PUT /api/v1/knowledge/documents/{id}/settings` — update allow_external_llm_usage, specific access (knowledge_document_access), expiry_date

**Verify:** Set access restrictions → verify enforced

---

## Task 11: Implement Docling document parser

Create `services/knowledge-service/app/services/docling_parser.py`:
- `DoclingParser` class wrapping `docling.document_converter.DocumentConverter`
- `parse(file_path: str) -> ParseResult` — returns markdown + structured JSON
- Handle PDF, DOCX, PPTX, XLSX, HTML, images
- Error handling for unsupported or corrupted files

**Verify:** Parse a sample PDF → get markdown output → verify tables preserved

---

## Task 12: Implement chunking service

Create `services/knowledge-service/app/services/chunking_service.py`:
- `ChunkingService` class
- `chunk_markdown(text, max_tokens=512, overlap=50)` → list of chunks
- Respect heading boundaries (don't split mid-section)
- Track chunk_no, chunk_title (from nearest heading)
- Calculate token_count per chunk

**Verify:** Chunk a long markdown document → verify chunks respect headings

---

## Task 13: Implement embedding service

Create `services/knowledge-service/app/services/embedding_service.py`:
- `EmbeddingService` class
- `embed_chunks(chunks: list[str]) -> list[list[float]]`
- Support OpenAI ada-002 (cloud) and sentence-transformers (on-prem)
- Batch processing for efficiency
- Store vector_reference in document_embedding table

**Verify:** Embed 10 sample chunks → verify vectors stored

---

## Task 14: Implement vector store service

Create `services/knowledge-service/app/services/vector_store_service.py`:
- `VectorStoreService` class
- Support pgvector (MVP) with option for Qdrant (scale)
- `upsert_vectors(doc_id, chunks, vectors, metadata)`
- `search(query_vector, filters, top_k)` → ranked results with scores
- Metadata filters: persona_id, sdlc, domain_tags, classification_level, priority_weight

**Verify:** Upsert vectors → search with filters → verify ranked results

---

## Task 15: Implement full ingestion pipeline

Create `services/knowledge-service/app/services/ingestion_service.py`:
- `IngestionService` class orchestrating the full pipeline
- `process_document(job_id)`:
  1. Get job from DB, update status to 'processing'
  2. Download file from MinIO
  3. Parse with Docling → markdown + JSON
  4. Chunk markdown → list of chunks
  5. Save chunks to document_chunk table
  6. Generate embeddings for all chunks
  7. Store vectors with metadata in vector store
  8. Update job status to 'completed'
  9. Publish `knowledge.document.ingested` event

Create Celery task wrapping the pipeline.

**Verify:** Upload document → trigger ingestion → verify chunks + embeddings created

---

## Task 16: Implement search endpoint (for ai-orchestrator)

Add to documents.py:
- `POST /api/v1/knowledge/search` — vector search with metadata filters
  - Input: query text, persona_id, filters (sdlc, domain_tags, classification_level)
  - Output: ranked chunks with source document info and relevance scores

**Verify:** Upload + ingest a document → search by query → get relevant chunks

---

## Task 17: Add gateway routes for knowledge-service

Update gateway:
- Route `/api/v1/knowledge/*` → knowledge-service:8005
- Route `/api/v1/files/*` → knowledge-service:8005

**Verify:** Requests through gateway reach knowledge-service

---

## Task 18: Build frontend — Knowledge Hub management page

Create `src/routes/knowledge-hub/KnowledgeListPage.tsx`:
- Match PDF mockup page 3
- Search/filter bar (8 filter fields)
- "Add New Document" button
- Data table with columns: ID, Document Title, KB Collection, Classification Level, SDLC, Domain, Persona(s), Status
- Action menu per row: View Doc, Deactivate Doc, Update Settings
- Pagination

Create `src/lib/api/knowledge.ts` — API client functions

**Verify:** `npm run build` passes, page renders

---

## Task 19: Build frontend — Add KB Document wizard (4 steps)

Create `src/routes/knowledge-hub/KnowledgeWizardPage.tsx`:
- Step indicator (1. Basic Information → 2. Governance → 3. KB Optimization → 4. Extra Settings)

Create step components:
- `src/components/knowledge/BasicInfoStep.tsx` — (PDF page 4) title, type dropdown, collection dropdown, summary, file upload with Browse button
- `src/components/knowledge/GovernanceStep.tsx` — (PDF page 5) classification level, department, owner, version, effective date, review date
- `src/components/knowledge/RAGOptimizationStep.tsx` — (PDF page 6) SDLC, domain tags, project type, keywords, persona relevance, priority weight
- `src/components/knowledge/ExtraSettingsStep.tsx` — (PDF page 7) allow external LLM toggle + LLM selector, specific access toggle + user selector, expiry date toggle + date picker

**Verify:** `npm run build` passes, wizard navigation works

---

## Task 20: Link frontend UI with knowledge-service API calls

Connect all Knowledge Hub pages to real API endpoints:
- `src/lib/api/knowledge.ts` — collections, documents, upload API calls
- `src/lib/hooks/useKnowledge.ts` — TanStack Query hooks
- Wire `KnowledgeListPage.tsx` to `GET /api/v1/knowledge/collections` — real data, loading/error states
- Wire `KnowledgeWizardPage.tsx` to `POST /api/v1/knowledge/documents` + step endpoints
- Wire file upload to `POST /api/v1/knowledge/files/upload`
- Wire right sidebar Knowledge Hub section to show user's collections
- Handle auth errors (401 → redirect to login)

**Verify:** Login → upload document via wizard → see it in KB list → persists on refresh

---

## Task 22: Write knowledge-service tests

Create `services/knowledge-service/tests/`:
- `test_collections.py` — collection CRUD
- `test_documents.py` — document CRUD with 4-step wizard
- `test_ingestion.py` — full pipeline: upload → parse → chunk → embed
- `test_search.py` — vector search with filters
- `test_storage.py` — MinIO upload/download

**Verify:** `pytest services/knowledge-service/tests/ -v` — all pass

---

## Phase 3 Complete

1. Knowledge base CRUD with 4-step wizard working
2. Docling parsing PDF, DOCX, PPTX, XLSX successfully
3. Full ingestion pipeline: upload → parse → chunk → embed → store
4. Vector search with metadata filtering working
5. Frontend KB management + wizard
6. Update PROGRESS.md
7. Git commit: `git add -A && git commit -m "Phase 3: Knowledge base service complete"`
