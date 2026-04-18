import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class Persona(Base):
    __tablename__ = "persona"

    persona_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)  # external — no FK
    user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)  # external — no FK
    persona_code: Mapped[str] = mapped_column(String(50), nullable=False)
    persona_name: Mapped[str] = mapped_column(String(255), nullable=False)
    persona_category: Mapped[str] = mapped_column(String(50), nullable=False)
    short_description: Mapped[str | None] = mapped_column(Text)
    avatar_file_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    is_system_persona: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="active", server_default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    created_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    updated_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)

    __table_args__ = (
        CheckConstraint(
            "persona_category IN ('PMO', 'Strategy', 'Risk', 'Portfolio', 'Custom')",
            name="ck_persona_category",
        ),
        CheckConstraint("status IN ('active', 'inactive')", name="ck_persona_status"),
    )

    domain_tags: Mapped[list["PersonaDomainTag"]] = relationship("PersonaDomainTag", back_populates="persona", cascade="all, delete-orphan")
    behavior_setting: Mapped["PersonaBehaviorSetting | None"] = relationship("PersonaBehaviorSetting", back_populates="persona", uselist=False, cascade="all, delete-orphan")
    model_policy: Mapped["PersonaModelPolicy | None"] = relationship("PersonaModelPolicy", back_populates="persona", uselist=False, cascade="all, delete-orphan")
    workspace_mappings: Mapped[list["PersonaWorkspaceMapping"]] = relationship("PersonaWorkspaceMapping", back_populates="persona", cascade="all, delete-orphan")
    access_roles: Mapped[list["PersonaAccessRole"]] = relationship("PersonaAccessRole", back_populates="persona", cascade="all, delete-orphan")
    allowed_models: Mapped[list["PersonaAllowedModel"]] = relationship("PersonaAllowedModel", back_populates="persona", cascade="all, delete-orphan")
    knowledge_collections: Mapped[list["PersonaKnowledgeCollection"]] = relationship("PersonaKnowledgeCollection", back_populates="persona", cascade="all, delete-orphan")
    skill_mappings: Mapped[list["SkillPersonaMapping"]] = relationship("SkillPersonaMapping", back_populates="persona", cascade="all, delete-orphan")


class PersonaDomainTag(Base):
    __tablename__ = "persona_domain_tag"

    persona_domain_tag_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    persona_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("persona.persona_id"), nullable=False)
    tag_name: Mapped[str] = mapped_column(String(100), nullable=False)
    tag_type: Mapped[str] = mapped_column(String(50), nullable=False, default="domain")

    __table_args__ = (
        CheckConstraint(
            "tag_type IN ('domain', 'sdlc', 'project_type')",
            name="ck_persona_domain_tag_type",
        ),
    )

    persona: Mapped["Persona"] = relationship("Persona", back_populates="domain_tags")


class PersonaBehaviorSetting(Base):
    __tablename__ = "persona_behavior_setting"

    persona_behavior_setting_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    persona_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("persona.persona_id"), nullable=False, unique=True)
    system_instruction: Mapped[str | None] = mapped_column(Text)
    tone_of_voice: Mapped[str | None] = mapped_column(String(50))
    response_format_preference: Mapped[str | None] = mapped_column(String(50))
    default_language: Mapped[str] = mapped_column(String(10), nullable=False, default="en", server_default="en")
    max_response_length: Mapped[int] = mapped_column(Integer, nullable=False, default=2048, server_default="2048")
    temperature: Mapped[Decimal] = mapped_column(Numeric(3, 2), nullable=False, default=Decimal("0.7"), server_default="0.70")

    __table_args__ = (
        CheckConstraint(
            "tone_of_voice IN ('Executive', 'Analytical', 'Advisory', 'Formal') OR tone_of_voice IS NULL",
            name="ck_persona_tone_of_voice",
        ),
        CheckConstraint(
            "response_format_preference IN ('Structured Report', 'Bullet Points', 'Narrative') OR response_format_preference IS NULL",
            name="ck_persona_response_format",
        ),
    )

    persona: Mapped["Persona"] = relationship("Persona", back_populates="behavior_setting")


class PersonaModelPolicy(Base):
    __tablename__ = "persona_model_policy"

    persona_model_policy_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    persona_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("persona.persona_id"), nullable=False, unique=True)
    default_model_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    chat_mode: Mapped[str | None] = mapped_column(String(50))
    use_rag: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    use_internal_llm: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default="true")
    use_external_llm: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    classification_limit: Mapped[str | None] = mapped_column(String(50))
    allow_file_upload: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default="true")
    allow_external_sources: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        CheckConstraint(
            "classification_limit IN ('Public', 'Internal', 'Confidential', 'Restricted') OR classification_limit IS NULL",
            name="ck_persona_classification_limit",
        ),
    )

    persona: Mapped["Persona"] = relationship("Persona", back_populates="model_policy")


class PersonaWorkspaceMapping(Base):
    __tablename__ = "persona_workspace_mapping"

    persona_workspace_mapping_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    persona_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("persona.persona_id"), nullable=False)
    workspace_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("workspace.workspace_id"), nullable=False)
    is_default: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="active", server_default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    persona: Mapped["Persona"] = relationship("Persona", back_populates="workspace_mappings")
    workspace: Mapped["Workspace"] = relationship("Workspace", back_populates="persona_mappings")


class PersonaAccessRole(Base):
    __tablename__ = "persona_access_role"

    persona_access_role_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    persona_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("persona.persona_id"), nullable=False)
    user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)  # external — no FK

    persona: Mapped["Persona"] = relationship("Persona", back_populates="access_roles")


class PersonaAllowedModel(Base):
    __tablename__ = "persona_allowed_model"

    persona_allowed_model_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    persona_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("persona.persona_id"), nullable=False)
    model_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)  # external FK to llm_model
    priority_order: Mapped[int] = mapped_column(Integer, nullable=False, default=1, server_default="1")
    is_default: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")

    __table_args__ = (
        UniqueConstraint("persona_id", "model_id", name="uq_persona_allowed_model"),
    )

    persona: Mapped["Persona"] = relationship("Persona", back_populates="allowed_models")


class PersonaKnowledgeCollection(Base):
    __tablename__ = "persona_knowledge_collection"

    persona_knowledge_collection_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    persona_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("persona.persona_id"), nullable=False)
    knowledge_collection_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)  # external FK to knowledge_collection

    __table_args__ = (
        UniqueConstraint("persona_id", "knowledge_collection_id", name="uq_persona_knowledge_collection"),
    )

    persona: Mapped["Persona"] = relationship("Persona", back_populates="knowledge_collections")

