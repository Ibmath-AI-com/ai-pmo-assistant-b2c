import uuid
from datetime import datetime

from sqlalchemy import BigInteger, Boolean, CheckConstraint, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class TemplateFamily(Base):
    __tablename__ = "template_family"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    system_name: Mapped[str] = mapped_column(String(100), nullable=False)

    templates: Mapped[list["Template"]] = relationship("Template", back_populates="family")


class Template(Base):
    __tablename__ = "template"

    template_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)  # no FK
    persona_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)  # no FK
    template_family_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("template_family.id"), nullable=True)
    template_code: Mapped[str] = mapped_column(String(50), nullable=False)
    template_name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    template_body: Mapped[str | None] = mapped_column(Text)
    output_format: Mapped[str | None] = mapped_column(String(50), default="markdown")
    is_system: Mapped[bool | None] = mapped_column(Boolean, default=False)
    status: Mapped[str | None] = mapped_column(String(20), default="active")
    created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), server_default=func.now())
    created_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)  # no FK
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    family: Mapped["TemplateFamily | None"] = relationship("TemplateFamily", back_populates="templates")
    versions: Mapped[list["TemplateVersion"]] = relationship("TemplateVersion", back_populates="template", cascade="all, delete-orphan")
    file_mappings: Mapped[list["TemplateFileMapping"]] = relationship("TemplateFileMapping", back_populates="template", cascade="all, delete-orphan")


class TemplateVersion(Base):
    __tablename__ = "template_version"

    template_version_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    template_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("template.template_id"), nullable=False)
    uploaded_by_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)  # no FK enforced here
    version_no: Mapped[int] = mapped_column(Integer, nullable=False)
    template_body: Mapped[str | None] = mapped_column(Text)
    effective_from: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str | None] = mapped_column(String(20), default="active")
    created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), server_default=func.now())
    created_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)  # no FK

    template: Mapped["Template"] = relationship("Template", back_populates="versions")
    customize_templates: Mapped[list["CustomizeTemplate"]] = relationship("CustomizeTemplate", back_populates="template_version", cascade="all, delete-orphan")


class TemplateFileMapping(Base):
    __tablename__ = "template_file_mapping"

    template_file_mapping_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    template_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("template.template_id"), nullable=False)
    file_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)  # FK enforced by DB
    chat_session_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)  # no FK

    template: Mapped["Template"] = relationship("Template", back_populates="file_mappings")


class CustomizeTemplate(Base):
    __tablename__ = "customize_template"

    customize_template_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    template_version_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("template_version.template_version_id"), nullable=False)
    workspace_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)  # no FK
    organization_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)  # no FK
    custom_name: Mapped[str | None] = mapped_column(String(255))
    custom_body: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str | None] = mapped_column(String(20), default="active")
    created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    template_version: Mapped["TemplateVersion"] = relationship("TemplateVersion", back_populates="customize_templates")


class GeneratedDocument(Base):
    __tablename__ = "generated_document"

    generated_document_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    file_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)  # no FK
    generated_output_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)  # no FK
    document_format: Mapped[str | None] = mapped_column(String(20))
    generated_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)  # no FK
    created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), server_default=func.now())
