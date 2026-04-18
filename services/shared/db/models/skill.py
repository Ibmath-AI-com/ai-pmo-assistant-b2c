import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy import JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class Skill(Base):
    __tablename__ = "skill"

    skill_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)  # external — no FK
    skill_code: Mapped[str] = mapped_column(String(50), nullable=False)
    skill_name: Mapped[str] = mapped_column(String(255), nullable=False)
    skill_type: Mapped[str] = mapped_column(String(50), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    skill_config_json: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    version_no: Mapped[int] = mapped_column(Integer, nullable=False, default=1, server_default="1")
    is_system: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="active", server_default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    created_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        CheckConstraint(
            "skill_type IN ('prompt_chain', 'rag_filter', 'output_validator', 'formatter', 'domain_expert', 'tool_use')",
            name="ck_skill_type",
        ),
        CheckConstraint("status IN ('active', 'inactive')", name="ck_skill_status"),
    )

    persona_mappings: Mapped[list["SkillPersonaMapping"]] = relationship(
        "SkillPersonaMapping", back_populates="skill", cascade="all, delete-orphan"
    )


class SkillPersonaMapping(Base):
    __tablename__ = "skill_persona_mapping"

    skill_persona_mapping_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    skill_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("skill.skill_id"), nullable=False)
    persona_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("persona.persona_id"), nullable=False)
    priority_order: Mapped[int] = mapped_column(Integer, nullable=False, default=1, server_default="1")
    is_auto_trigger: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    trigger_condition: Mapped[dict | None] = mapped_column(JSON)

    __table_args__ = (
        UniqueConstraint("skill_id", "persona_id", name="uq_skill_persona_mapping"),
    )

    skill: Mapped["Skill"] = relationship("Skill", back_populates="persona_mappings")
    persona: Mapped["Persona"] = relationship("Persona", back_populates="skill_mappings")
