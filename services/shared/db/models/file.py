import uuid
from datetime import datetime

from sqlalchemy import BIGINT, INTEGER, TEXT, ForeignKey, String, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class File(Base):
    __tablename__ = "file"

    file_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    uploaded_by_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    original_file_name: Mapped[str] = mapped_column(String(500), nullable=False)
    mime_type: Mapped[str | None] = mapped_column(String(100))
    storage_path: Mapped[str | None] = mapped_column(TEXT)
    file_size_bytes: Mapped[int | None] = mapped_column(BIGINT)
    checksum: Mapped[str | None] = mapped_column(String(64))
    upload_status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="uploading", server_default="uploading"
    )
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="active", server_default="active"
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    versions: Mapped[list["FileVersion"]] = relationship("FileVersion", back_populates="file")


class FileVersion(Base):
    __tablename__ = "file_version"

    file_version_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    file_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("file.file_id"),
        nullable=False,
    )
    uploaded_by_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    version_no: Mapped[int] = mapped_column(INTEGER, nullable=False)
    file_size_bytes: Mapped[int | None] = mapped_column(BIGINT)
    change_notes: Mapped[str | None] = mapped_column(TEXT)
    storage_path: Mapped[str | None] = mapped_column(TEXT)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    file: Mapped["File"] = relationship("File", back_populates="versions")


class WorkspaceFile(Base):
    """Associates a file with a workspace (cross-service reference, no FK to workspace table)."""
    __tablename__ = "workspace_file"

    workspace_file_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    workspace_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    file_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("file.file_id"),
        nullable=False,
    )
    uploaded_by_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="active", server_default="active"
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    file: Mapped["File"] = relationship("File")
