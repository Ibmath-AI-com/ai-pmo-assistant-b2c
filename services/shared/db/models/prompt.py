import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class PromptLibrary(Base):
    __tablename__ = "prompt_library"

    prompt_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("user.user_id"), nullable=True, index=True)
    prompt_name: Mapped[str] = mapped_column(String(255), nullable=False)
    prompt_text: Mapped[str] = mapped_column(Text, nullable=False)
    prompt_category: Mapped[str | None] = mapped_column(String(100))  # PMO | Risk | Strategy | General
    is_ready_prompt: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    is_system: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="active", server_default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    persona_mappings: Mapped[list["PromptPersonaMapping"]] = relationship(
        "PromptPersonaMapping", back_populates="prompt", cascade="all, delete-orphan"
    )


class PromptPersonaMapping(Base):
    __tablename__ = "prompt_persona_mapping"

    mapping_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    prompt_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("prompt_library.prompt_id"), nullable=False)
    persona_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("persona.persona_id"), nullable=False)
    is_featured: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    display_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")

    prompt: Mapped["PromptLibrary"] = relationship("PromptLibrary", back_populates="persona_mappings")
