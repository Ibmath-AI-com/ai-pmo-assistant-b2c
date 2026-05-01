import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy import JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class AIRun(Base):
    __tablename__ = "ai_run"

    ai_run_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("chat_session.chat_session_id"), nullable=True, index=True)
    message_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    persona_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("persona.persona_id"), nullable=True)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("user.user_id"), nullable=False, index=True)
    model_used: Mapped[str | None] = mapped_column(String(100))
    provider: Mapped[str | None] = mapped_column(String(50))  # openai | anthropic | internal
    prompt_tokens: Mapped[int | None] = mapped_column(Integer)
    completion_tokens: Mapped[int | None] = mapped_column(Integer)
    total_tokens: Mapped[int | None] = mapped_column(Integer)
    latency_ms: Mapped[int | None] = mapped_column(Integer)
    rag_used: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    skills_used: Mapped[list | None] = mapped_column(JSON)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending", server_default="pending")
    error_message: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)

    retrieval_sources: Mapped[list["AIRunRetrievalSource"]] = relationship(
        "AIRunRetrievalSource", back_populates="ai_run", cascade="all, delete-orphan"
    )
    outputs: Mapped[list["GeneratedOutput"]] = relationship(
        "GeneratedOutput", back_populates="ai_run", cascade="all, delete-orphan"
    )


class AIRunRetrievalSource(Base):
    __tablename__ = "ai_run_retrieval_source"

    retrieval_source_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ai_run_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("ai_run.ai_run_id"), nullable=False, index=True)
    document_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("knowledge_document.knowledge_document_id"), nullable=True)
    chunk_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    relevance_score: Mapped[float | None] = mapped_column(Float)
    used_in_prompt: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default="true")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    ai_run: Mapped["AIRun"] = relationship("AIRun", back_populates="retrieval_sources")


class GeneratedOutput(Base):
    __tablename__ = "generated_output"

    output_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ai_run_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("ai_run.ai_run_id"), nullable=False, index=True)
    output_type: Mapped[str] = mapped_column(String(50), nullable=False, default="text")  # text | report | structured_data | recommendation
    content: Mapped[str] = mapped_column(Text, nullable=False)
    format: Mapped[str] = mapped_column(String(20), nullable=False, default="markdown")  # markdown | json | html | plain
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="active", server_default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    ai_run: Mapped["AIRun"] = relationship("AIRun", back_populates="outputs")
    feedback: Mapped[list["OutputFeedback"]] = relationship("OutputFeedback", back_populates="output", cascade="all, delete-orphan")


class OutputFeedback(Base):
    __tablename__ = "output_feedback"

    feedback_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    output_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("generated_output.output_id"), nullable=False, index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("user.user_id"), nullable=False)
    rating: Mapped[int | None] = mapped_column(Integer)  # 1-5
    feedback_text: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    output: Mapped["GeneratedOutput"] = relationship("GeneratedOutput", back_populates="feedback")
