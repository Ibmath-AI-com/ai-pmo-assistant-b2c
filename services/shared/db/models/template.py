import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy import JSON
from sqlalchemy.dialects.postgresql import UUID
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
    user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("user.user_id"), nullable=True, index=True)
    persona_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    template_family_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("template_family.id"), nullable=True)
    template_code: Mapped[str] = mapped_column(String(100), nullable=False)
    template_name: Mapped[str] = mapped_column(String(500), nullable=False)
    template_category: Mapped[str | None] = mapped_column(String(100))
    description: Mapped[str | None] = mapped_column(Text)
    template_body: Mapped[str | None] = mapped_column(Text)
    output_format: Mapped[str | None] = mapped_column(String(50), default="markdown")
    is_system: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="active", server_default="active")
    metadata_json: Mapped[dict | None] = mapped_column(JSON)
    created_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    family: Mapped["TemplateFamily | None"] = relationship("TemplateFamily", back_populates="templates")
    versions: Mapped[list["TemplateVersion"]] = relationship(
        "TemplateVersion", back_populates="template", cascade="all, delete-orphan"
    )
    file_mappings: Mapped[list["TemplateFileMapping"]] = relationship(
        "TemplateFileMapping", back_populates="template", cascade="all, delete-orphan"
    )
    generated_documents: Mapped[list["GeneratedDocument"]] = relationship(
        "GeneratedDocument", back_populates="template"
    )


class TemplateVersion(Base):
    __tablename__ = "template_version"

    template_version_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    template_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("template.template_id"), nullable=False)
    uploaded_by_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("user.user_id"), nullable=True)
    version_no: Mapped[int] = mapped_column(Integer, nullable=False)
    template_body: Mapped[str | None] = mapped_column(Text)
    effective_from: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str | None] = mapped_column(String(20), default="active")
    created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), server_default=func.now())
    created_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)

    template: Mapped["Template"] = relationship("Template", back_populates="versions")
    customize_templates: Mapped[list["CustomizeTemplate"]] = relationship(
        "CustomizeTemplate", back_populates="template_version", cascade="all, delete-orphan"
    )


class TemplateFileMapping(Base):
    __tablename__ = "template_file_mapping"

    template_file_mapping_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    template_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("template.template_id"), nullable=False)
    file_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    chat_session_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)

    template: Mapped["Template"] = relationship("Template", back_populates="file_mappings")


class CustomizeTemplate(Base):
    __tablename__ = "customize_template"

    customize_template_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    template_version_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("template_version.template_version_id"), nullable=False
    )
    workspace_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("user.user_id"), nullable=True)
    custom_name: Mapped[str | None] = mapped_column(String(255))
    custom_body: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str | None] = mapped_column(String(20), default="active")
    created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    template_version: Mapped["TemplateVersion"] = relationship("TemplateVersion", back_populates="customize_templates")


class GeneratedDocument(Base):
    __tablename__ = "generated_document"

    generated_document_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("user.user_id"), nullable=False, index=True)
    template_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("template.template_id"), nullable=True, index=True)
    chat_session_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("chat_session.chat_session_id"), nullable=True
    )
    ai_run_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    rendered_content: Mapped[str | None] = mapped_column(Text)
    report_data: Mapped[dict | None] = mapped_column(JSON)
    format: Mapped[str] = mapped_column(String(20), nullable=False, default="html", server_default="html")
    file_path: Mapped[str | None] = mapped_column(String(1000))
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="draft", server_default="draft")
    error_message: Mapped[str | None] = mapped_column(Text)
    metadata_json: Mapped[dict | None] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    template: Mapped["Template | None"] = relationship("Template", back_populates="generated_documents")
