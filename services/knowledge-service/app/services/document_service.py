from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from db.models.knowledge import (
    DocumentChunk,
    KnowledgeCollection,
    KnowledgeDocument,
    KnowledgeDocumentAccess,
    KnowledgeDocumentGovernance,
    KnowledgeDocumentTag,
)


# ── Collections ──────────────────────────────────────────────────────────────

async def create_collection(db: AsyncSession, data: dict) -> KnowledgeCollection:
    collection = KnowledgeCollection(**data)
    db.add(collection)
    await db.flush()
    await db.refresh(collection)
    return collection


async def list_collections(db: AsyncSession, user_id: UUID) -> list[KnowledgeCollection]:
    result = await db.execute(
        select(KnowledgeCollection).where(
            KnowledgeCollection.user_id == user_id,
            KnowledgeCollection.status != "deleted",
        )
    )
    return list(result.scalars().all())


async def get_collection(db: AsyncSession, collection_id: UUID, user_id: UUID) -> KnowledgeCollection:
    result = await db.execute(
        select(KnowledgeCollection).where(
            KnowledgeCollection.knowledge_collection_id == collection_id,
            KnowledgeCollection.user_id == user_id,
        )
    )
    collection = result.scalar_one_or_none()
    if not collection:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Collection not found")
    return collection


async def get_collection_document_count(db: AsyncSession, collection_id: UUID) -> int:
    result = await db.execute(
        select(func.count()).where(
            KnowledgeDocument.knowledge_collection_id == collection_id,
            KnowledgeDocument.status != "deleted",
        )
    )
    return result.scalar_one()


async def update_collection(
    db: AsyncSession, collection_id: UUID, user_id: UUID, data: dict
) -> KnowledgeCollection:
    collection = await get_collection(db, collection_id, user_id)
    for key, value in data.items():
        setattr(collection, key, value)
    await db.flush()
    await db.refresh(collection)
    return collection


# ── Documents ────────────────────────────────────────────────────────────────

async def create_document(db: AsyncSession, data: dict) -> KnowledgeDocument:
    document = KnowledgeDocument(**data)
    db.add(document)
    await db.flush()
    await db.refresh(document)
    return document


async def list_documents(
    db: AsyncSession,
    user_id: UUID,
    collection_id: UUID | None = None,
    search: str | None = None,
    document_type: str | None = None,
    doc_status: str | None = None,
    classification_level: str | None = None,
    sdlc: str | None = None,
    domain: str | None = None,
    persona: str | None = None,
) -> list[KnowledgeDocument]:
    from sqlalchemy import select as sa_select
    from sqlalchemy.orm import selectinload

    # Join to collection to filter by org; eager-load governance + tags for list display
    stmt = (
        sa_select(KnowledgeDocument)
        .join(KnowledgeCollection)
        .where(
            KnowledgeCollection.user_id == user_id,
            KnowledgeDocument.status != "deleted",
        )
        .options(
            selectinload(KnowledgeDocument.governance),
            selectinload(KnowledgeDocument.tags),
        )
    )
    if collection_id:
        stmt = stmt.where(KnowledgeDocument.knowledge_collection_id == collection_id)
    if search:
        stmt = stmt.where(KnowledgeDocument.title.ilike(f"%{search}%"))
    if document_type:
        stmt = stmt.where(KnowledgeDocument.document_type == document_type)
    if doc_status:
        stmt = stmt.where(KnowledgeDocument.status == doc_status)
    if classification_level:
        gov_subq = (
            sa_select(KnowledgeDocumentGovernance.knowledge_document_id)
            .where(KnowledgeDocumentGovernance.classification_level == classification_level)
            .scalar_subquery()
        )
        stmt = stmt.where(KnowledgeDocument.knowledge_document_id.in_(gov_subq))
    if sdlc:
        sdlc_subq = (
            sa_select(KnowledgeDocumentTag.knowledge_document_id)
            .where(
                KnowledgeDocumentTag.tag_type == "sdlc",
                KnowledgeDocumentTag.tag_name == sdlc,
                KnowledgeDocumentTag.status == "active",
            )
            .scalar_subquery()
        )
        stmt = stmt.where(KnowledgeDocument.knowledge_document_id.in_(sdlc_subq))
    if domain:
        domain_subq = (
            sa_select(KnowledgeDocumentTag.knowledge_document_id)
            .where(
                KnowledgeDocumentTag.tag_type == "domain",
                KnowledgeDocumentTag.tag_name == domain,
                KnowledgeDocumentTag.status == "active",
            )
            .scalar_subquery()
        )
        stmt = stmt.where(KnowledgeDocument.knowledge_document_id.in_(domain_subq))
    if persona:
        persona_subq = (
            sa_select(KnowledgeDocumentTag.knowledge_document_id)
            .where(
                KnowledgeDocumentTag.tag_name == f"persona:{persona}",
                KnowledgeDocumentTag.status == "active",
            )
            .scalar_subquery()
        )
        stmt = stmt.where(KnowledgeDocument.knowledge_document_id.in_(persona_subq))

    result = await db.execute(stmt)
    return list(result.scalars().all())


async def get_document(
    db: AsyncSession, document_id: UUID, user_id: UUID
) -> KnowledgeDocument:
    stmt = (
        select(KnowledgeDocument)
        .join(KnowledgeCollection)
        .where(
            KnowledgeDocument.knowledge_document_id == document_id,
            KnowledgeCollection.user_id == user_id,
        )
        .options(
            selectinload(KnowledgeDocument.governance),
            selectinload(KnowledgeDocument.tags),
            selectinload(KnowledgeDocument.access_entries),
        )
    )
    result = await db.execute(stmt)
    document = result.scalar_one_or_none()
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    return document


async def get_document_chunk_count(db: AsyncSession, document_id: UUID) -> int:
    result = await db.execute(
        select(func.count()).where(DocumentChunk.knowledge_document_id == document_id)
    )
    return result.scalar_one()


async def update_document(
    db: AsyncSession, document_id: UUID, user_id: UUID, data: dict
) -> KnowledgeDocument:
    document = await get_document(db, document_id, user_id)
    for key, value in data.items():
        setattr(document, key, value)
    await db.flush()
    await db.refresh(document)
    return document


async def change_document_status(
    db: AsyncSession, document_id: UUID, user_id: UUID, new_status: str
) -> KnowledgeDocument:
    document = await get_document(db, document_id, user_id)
    document.status = new_status
    await db.flush()
    await db.refresh(document)
    return document
