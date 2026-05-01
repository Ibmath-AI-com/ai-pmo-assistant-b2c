"""
Document processing pipeline — runs as a Celery background task.

Pipeline:
  1. Create ingestion job (status: queued)
  2. Update status → processing
  3. Download file from MinIO to temp path
  4. Parse with Docling → markdown
  5. Chunk markdown → list of ChunkResult
  6. Delete existing chunks (reindex case)
  7. Save new chunks to document_chunk table
  8. Update job: processed_chunks, status → completed
  9. Publish event: knowledge.document.processed
 10. Clean up temp files
On error: update job status → failed, save error_message
"""

import os
import sys
import tempfile
from pathlib import Path
from uuid import UUID, uuid4

sys.path.insert(0, str(Path(__file__).resolve().parents[3] / "shared"))

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from db.models.knowledge import DocumentChunk, DocumentIngestionJob, KnowledgeDocument
from app.services import storage_service, docling_parser
from app.services.chunking_service import chunk_text


# ── Async helpers (called from FastAPI routes) ────────────────────────────────

async def create_ingestion_job(
    db: AsyncSession,
    document_id: UUID,
    job_type: str = "initial",
) -> DocumentIngestionJob:
    job = DocumentIngestionJob(
        knowledge_document_id=document_id,
        job_type=job_type,
        job_status="queued",
    )
    db.add(job)
    await db.flush()
    await db.refresh(job)
    return job


async def get_job(db: AsyncSession, job_id: UUID) -> DocumentIngestionJob | None:
    return await db.get(DocumentIngestionJob, job_id)


async def list_jobs(
    db: AsyncSession,
    document_id: UUID | None = None,
    job_status: str | None = None,
) -> list[DocumentIngestionJob]:
    stmt = select(DocumentIngestionJob)
    if document_id:
        stmt = stmt.where(DocumentIngestionJob.knowledge_document_id == document_id)
    if job_status:
        stmt = stmt.where(DocumentIngestionJob.job_status == job_status)
    stmt = stmt.order_by(DocumentIngestionJob.document_ingestion_job_id)
    result = await db.execute(stmt)
    return list(result.scalars().all())


# ── Celery task (sync, uses its own DB session) ───────────────────────────────

def _run_pipeline_sync(job_id: str, document_id: str, storage_path: str, filename: str) -> None:
    """
    Synchronous pipeline executed inside Celery worker.
    Opens its own SQLAlchemy sync session.
    """
    import asyncio
    asyncio.run(_run_pipeline_async(
        UUID(job_id), UUID(document_id), storage_path, filename
    ))


async def _run_pipeline_async(
    job_id: UUID,
    document_id: UUID,
    storage_path: str,
    filename: str,
) -> None:
    from datetime import datetime, timezone
    from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
    from config.settings import get_settings

    settings = get_settings()
    engine = create_async_engine(settings.database_url, echo=False)
    factory = async_sessionmaker(engine, expire_on_commit=False)

    async with factory() as db:
        try:
            # 2. Update status → processing
            job = await db.get(DocumentIngestionJob, job_id)
            if not job:
                return
            job.job_status = "processing"
            job.started_at = datetime.now(timezone.utc)
            await db.flush()

            # 3. Download file from MinIO to temp path
            tmp_path = None
            try:
                suffix = Path(filename).suffix or ".bin"
                file_bytes = _download_file(storage_path)

                with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
                    tmp.write(file_bytes)
                    tmp_path = tmp.name

                # 4. Parse with Docling → markdown
                markdown = docling_parser.parse(tmp_path)

                # 5. Chunk markdown
                chunks = chunk_text(markdown)

                # 6. Delete existing chunks (reindex)
                await db.execute(
                    delete(DocumentChunk).where(
                        DocumentChunk.knowledge_document_id == document_id
                    )
                )

                # 7. Save new chunks
                saved_chunks: list[DocumentChunk] = []
                job.total_chunks = len(chunks)
                for chunk in chunks:
                    doc_chunk = DocumentChunk(
                        knowledge_document_id=document_id,
                        chunk_no=chunk.chunk_no,
                        chunk_title=chunk.chunk_title,
                        chunk_text=chunk.chunk_text,
                        token_count=chunk.token_count,
                        processing_status="completed",
                        parent_chunk_id=chunk.parent_chunk_id,
                    )
                    db.add(doc_chunk)
                    saved_chunks.append(doc_chunk)
                    job.processed_chunks = (job.processed_chunks or 0) + 1
                    await db.flush()

                # 7.5. Generate and store embeddings (best-effort — won't fail the pipeline)
                from app.services.embedding_service import embed_chunks
                chunk_ids = [c.document_chunk_id for c in saved_chunks]
                await embed_chunks(db, document_id, chunk_ids)

                # 8. Mark job completed
                job.job_status = "completed"
                job.completed_at = datetime.now(timezone.utc)
                await db.commit()

                # 9. Publish event
                await _publish_processed_event(document_id)

            finally:
                # 10. Clean up temp file
                if tmp_path and os.path.exists(tmp_path):
                    os.unlink(tmp_path)

        except Exception as exc:
            job = await db.get(DocumentIngestionJob, job_id)
            if job:
                job.job_status = "failed"
                job.error_message = str(exc)
                from datetime import datetime, timezone
                job.completed_at = datetime.now(timezone.utc)
            await db.commit()
            raise


def _download_file(storage_path: str) -> bytes:
    import boto3
    from botocore.client import Config
    from config.settings import get_settings

    settings = get_settings()
    client = boto3.client(
        "s3",
        endpoint_url=settings.s3_endpoint,
        aws_access_key_id=settings.s3_access_key,
        aws_secret_access_key=settings.s3_secret_key,
        config=Config(signature_version="s3v4"),
        region_name="us-east-1",
    )
    response = client.get_object(Bucket=settings.s3_bucket, Key=storage_path)
    return response["Body"].read()


async def _publish_processed_event(document_id: UUID) -> None:
    try:
        from events.publisher import EventPublisher
        async with EventPublisher("knowledge-service") as pub:
            await pub.publish(
                "knowledge.document.processed",
                {"knowledge_document_id": str(document_id)},
            )
    except Exception:
        pass  # Don't fail the pipeline if event publishing fails


# ── Celery task registration ──────────────────────────────────────────────────

def get_celery():
    from app.celery_app import celery
    return celery


def dispatch_ingestion(job_id: UUID, document_id: UUID, storage_path: str, filename: str) -> None:
    """Dispatch ingestion pipeline as a Celery background task."""
    celery = get_celery()

    @celery.task(name="ingestion.process_document")
    def process_document(job_id: str, document_id: str, storage_path: str, filename: str):
        _run_pipeline_sync(job_id, document_id, storage_path, filename)

    process_document.delay(str(job_id), str(document_id), storage_path, filename)
