import uuid
from datetime import datetime

from sqlalchemy import TEXT, String, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class Project(Base):
    __tablename__ = "project"

    project_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    project_name: Mapped[str] = mapped_column(String(256), nullable=False)
    objective: Mapped[str | None] = mapped_column(TEXT)
    instructions: Mapped[str | None] = mapped_column(TEXT)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="active", server_default="active")
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    project_files: Mapped[list["ProjectFile"]] = relationship(
        "ProjectFile", back_populates="project", cascade="all, delete-orphan"
    )


class ProjectFile(Base):
    __tablename__ = "project_file"

    project_file_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("project.project_id", ondelete="CASCADE"), nullable=False
    )
    file_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("file.file_id", ondelete="CASCADE"), nullable=False
    )
    source: Mapped[str] = mapped_column(
        String(32), nullable=False, default="upload", server_default="upload"
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    project: Mapped["Project"] = relationship("Project", back_populates="project_files")
    file: Mapped["File"] = relationship("File")  # type: ignore[name-defined]
