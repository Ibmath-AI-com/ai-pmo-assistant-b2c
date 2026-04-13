from datetime import date, datetime
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from pydantic import BaseModel
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from auth.dependencies import CurrentUser, get_current_user
from db.base import get_db
from db.models.knowledge import KnowledgeDocumentAccess
from app.services.document_service import (
    change_document_status,
    create_document,
    get_document,
    get_document_chunk_count,
    list_documents,
    update_document,
)
from app.services.ingestion_service import create_ingestion_job, dispatch_ingestion
from app.events.publishers import (
    publish_document_deleted,
    publish_document_updated,
    publish_document_uploaded,
)

router = APIRouter()


# ── Schemas ───────────────────────────────────────────────────────────────────

class DocumentCreate(BaseModel):
    knowledge_collection_id: UUID
    title: str
    document_type: str | None = None
    summary_description: str | None = None
    version_number: str | None = None
    source_code: str | None = None
    file_id: UUID | None = None


class DocumentUpdate(BaseModel):
    title: str | None = None
    document_type: str | None = None
    summary_description: str | None = None
    version_number: str | None = None
    source_code: str | None = None
    knowledge_collection_id: UUID | None = None


class StatusUpdate(BaseModel):
    status: str


class AccessIn(BaseModel):
    user_id: UUID
    access_type: str


class GovernanceOut(BaseModel):
    knowledge_document_governance_id: UUID
    classification_level: str | None
    department: str | None
    document_owner: str | None
    effective_date: date | None
    review_date: date | None
    expiry_date: date | None
    review_status: str | None

    model_config = {"from_attributes": True}


class TagOut(BaseModel):
    knowledge_document_tag_id: UUID
    tag_name: str
    tag_type: str
    status: str

    model_config = {"from_attributes": True}


class AccessOut(BaseModel):
    knowledge_document_access_id: UUID
    user_id: UUID | None
    access_type: str

    model_config = {"from_attributes": True}


class DocumentResponse(BaseModel):
    knowledge_document_id: UUID
    knowledge_collection_id: UUID
    owner_user_id: UUID | None
    title: str
    document_type: str | None
    summary_description: str | None
    version_number: str | None
    source_code: str | None
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DocumentListResponse(DocumentResponse):
    """Slim list response — governance + tags only (no access_entries or chunk_count)."""
    governance: GovernanceOut | None = None
    tags: list[TagOut] = []


class DocumentDetailResponse(DocumentResponse):
    governance: GovernanceOut | None = None
    tags: list[TagOut] = []
    access_entries: list[AccessOut] = []
    chunk_count: int = 0


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def create(
    body: DocumentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    data = body.model_dump(exclude={"file_id"})
    data["created_by"] = current_user.user_id
    data["updated_by"] = current_user.user_id
    document = await create_document(db, data)
    await publish_document_uploaded(
        document.knowledge_document_id, document.knowledge_collection_id
    )
    return document


@router.get("", response_model=list[DocumentListResponse])
async def list_all(
    knowledge_collection_id: UUID | None = Query(None),
    search: str | None = Query(None),
    document_type: str | None = Query(None),
    doc_status: str | None = Query(None, alias="status"),
    classification_level: str | None = Query(None),
    sdlc: str | None = Query(None),
    domain: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    return await list_documents(
        db,
        organization_id=current_user.organization_id,
        collection_id=knowledge_collection_id,
        search=search,
        document_type=document_type,
        doc_status=doc_status,
        classification_level=classification_level,
        sdlc=sdlc,
        domain=domain,
    )


@router.get("/{document_id}", response_model=DocumentDetailResponse)
async def get_one(
    document_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    document = await get_document(db, document_id, current_user.organization_id)
    chunk_count = await get_document_chunk_count(db, document_id)
    response = DocumentDetailResponse.model_validate(document)
    response.chunk_count = chunk_count
    return response


@router.put("/{document_id}", response_model=DocumentResponse)
async def update(
    document_id: UUID,
    body: DocumentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    data = body.model_dump(exclude_none=True)
    data["updated_by"] = current_user.user_id
    document = await update_document(db, document_id, current_user.organization_id, data)
    await publish_document_updated(document_id)
    return document


@router.patch("/{document_id}/status", response_model=DocumentResponse)
async def update_status(
    document_id: UUID,
    body: StatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    document = await change_document_status(
        db, document_id, current_user.organization_id, body.status
    )
    if body.status == "deleted":
        await publish_document_deleted(document_id)
    else:
        await publish_document_updated(document_id)
    return document


@router.put("/{document_id}/access", response_model=list[AccessOut])
async def replace_access(
    document_id: UUID,
    body: list[AccessIn],
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    # Verify document exists and belongs to org
    await get_document(db, document_id, current_user.organization_id)

    # Replace all access entries
    await db.execute(
        delete(KnowledgeDocumentAccess).where(
            KnowledgeDocumentAccess.knowledge_document_id == document_id
        )
    )

    new_entries = [
        KnowledgeDocumentAccess(
            knowledge_document_id=document_id,
            user_id=entry.user_id,
            access_type=entry.access_type,
        )
        for entry in body
    ]
    db.add_all(new_entries)
    await db.flush()

    result = await db.execute(
        select(KnowledgeDocumentAccess).where(
            KnowledgeDocumentAccess.knowledge_document_id == document_id
        )
    )
    return list(result.scalars().all())


class JobResponse(BaseModel):
    document_ingestion_job_id: UUID
    knowledge_document_id: UUID
    job_type: str
    job_status: str
    total_chunks: int | None
    processed_chunks: int | None
    error_message: str | None
    started_at: datetime | None
    completed_at: datetime | None

    model_config = {"from_attributes": True}


@router.post("/{document_id}/reindex", response_model=JobResponse, status_code=status.HTTP_202_ACCEPTED)
async def reindex(
    document_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    document = await get_document(db, document_id, current_user.organization_id)

    job = await create_ingestion_job(db, document_id, job_type="reindex")
    await db.commit()

    # Fire background task — needs storage_path from file (stored on document via source_code or file lookup)
    # Pass storage_path as empty string if not available; pipeline will handle gracefully
    storage_path = document.source_code or ""
    filename = document.title or "document"
    dispatch_ingestion(job.document_ingestion_job_id, document_id, storage_path, filename)

    return job
