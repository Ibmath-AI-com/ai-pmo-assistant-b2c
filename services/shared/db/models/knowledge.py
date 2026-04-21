import uuid
from datetime import date, datetime

from sqlalchemy import DATE, INTEGER, TEXT, ForeignKey, String, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class KnowledgeCollection(Base):
    __tablename__ = "knowledge_collection"

    knowledge_collection_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    organization_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    collection_code: Mapped[str] = mapped_column(String(50), nullable=False)
    collection_name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(TEXT)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="active", server_default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    created_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    updated_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)

    documents: Mapped[list["KnowledgeDocument"]] = relationship("KnowledgeDocument", back_populates="collection")


class KnowledgeDocument(Base):
    __tablename__ = "knowledge_document"

    knowledge_document_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    knowledge_collection_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("knowledge_collection.knowledge_collection_id"),
        nullable=False,
    )
    owner_user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    document_type: Mapped[str | None] = mapped_column(String(50))
    summary_description: Mapped[str | None] = mapped_column(TEXT)
    version_number: Mapped[str | None] = mapped_column(String(20))
    source_code: Mapped[str | None] = mapped_column(String(100))
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="draft", server_default="draft")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    created_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    updated_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)

    collection: Mapped["KnowledgeCollection"] = relationship("KnowledgeCollection", back_populates="documents")
    governance: Mapped["KnowledgeDocumentGovernance | None"] = relationship(
        "KnowledgeDocumentGovernance", back_populates="document", uselist=False
    )
    tags: Mapped[list["KnowledgeDocumentTag"]] = relationship("KnowledgeDocumentTag", back_populates="document")
    access_entries: Mapped[list["KnowledgeDocumentAccess"]] = relationship(
        "KnowledgeDocumentAccess", back_populates="document"
    )
    chunks: Mapped[list["DocumentChunk"]] = relationship("DocumentChunk", back_populates="document")
    ingestion_jobs: Mapped[list["DocumentIngestionJob"]] = relationship(
        "DocumentIngestionJob", back_populates="document"
    )


class KnowledgeDocumentGovernance(Base):
    __tablename__ = "knowledge_document_governance"

    knowledge_document_governance_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    knowledge_document_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("knowledge_document.knowledge_document_id"),
        unique=True,
        nullable=False,
    )
    classification_level: Mapped[str] = mapped_column(String(50), nullable=False)
    department: Mapped[str | None] = mapped_column(String(255))
    document_owner: Mapped[str | None] = mapped_column(String(255))
    effective_date: Mapped[date | None] = mapped_column(DATE)
    review_date: Mapped[date | None] = mapped_column(DATE)
    expiry_date: Mapped[date | None] = mapped_column(DATE)
    review_status: Mapped[str | None] = mapped_column(TEXT)

    document: Mapped["KnowledgeDocument"] = relationship("KnowledgeDocument", back_populates="governance")


class KnowledgeDocumentTag(Base):
    __tablename__ = "knowledge_document_tag"

    knowledge_document_tag_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    knowledge_document_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("knowledge_document.knowledge_document_id"),
        nullable=False,
    )
    tag_name: Mapped[str] = mapped_column(String(100), nullable=False)
    tag_type: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="active", server_default="active")

    document: Mapped["KnowledgeDocument"] = relationship("KnowledgeDocument", back_populates="tags")


class KnowledgeDocumentAccess(Base):
    __tablename__ = "knowledge_document_access"

    knowledge_document_access_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    knowledge_document_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("knowledge_document.knowledge_document_id"),
        nullable=False,
    )
    role_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)  # NO ForeignKey
    user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)  # NO ForeignKey
    access_type: Mapped[str] = mapped_column(String(20), nullable=True, default="read", server_default="read")
    created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), server_default=func.now())
    created_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)

    document: Mapped["KnowledgeDocument"] = relationship("KnowledgeDocument", back_populates="access_entries")


class DocumentChunk(Base):
    __tablename__ = "document_chunk"

    document_chunk_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    knowledge_document_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("knowledge_document.knowledge_document_id"),
        nullable=False,
    )
    chunk_no: Mapped[int] = mapped_column(INTEGER, nullable=False)
    chunk_title: Mapped[str | None] = mapped_column(String(500))
    chunk_text: Mapped[str | None] = mapped_column(TEXT)
    token_count: Mapped[int | None] = mapped_column(INTEGER)
    processing_status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="pending", server_default="pending"
    )
    parent_chunk_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    document: Mapped["KnowledgeDocument"] = relationship("KnowledgeDocument", back_populates="chunks")


class DocumentIngestionJob(Base):
    __tablename__ = "document_ingestion_job"

    document_ingestion_job_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    knowledge_document_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("knowledge_document.knowledge_document_id"),
        nullable=False,
    )
    job_type: Mapped[str] = mapped_column(String(20), nullable=False, default="initial")
    job_status: Mapped[str] = mapped_column(String(20), nullable=False, default="queued", server_default="queued")
    total_chunks: Mapped[int | None] = mapped_column(INTEGER)
    processed_chunks: Mapped[int | None] = mapped_column(INTEGER)
    error_message: Mapped[str | None] = mapped_column(TEXT)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    document: Mapped["KnowledgeDocument"] = relationship("KnowledgeDocument", back_populates="ingestion_jobs")
