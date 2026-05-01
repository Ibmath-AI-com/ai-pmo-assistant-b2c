import uuid
from datetime import datetime

from sqlalchemy import BOOLEAN, INTEGER, TEXT, String, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class LLMModel(Base):
    __tablename__ = "llm_model"

    llm_model_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    model_code: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    model_name: Mapped[str] = mapped_column(String(255), nullable=False)
    provider_name: Mapped[str] = mapped_column(String(100), nullable=False)
    model_type: Mapped[str] = mapped_column(String(50), nullable=False, default="chat", server_default="chat")
    context_window: Mapped[int | None] = mapped_column(INTEGER)
    max_output_tokens: Mapped[int | None] = mapped_column(INTEGER)
    supports_vision: Mapped[bool] = mapped_column(BOOLEAN, nullable=False, default=False, server_default="false")
    supports_functions: Mapped[bool] = mapped_column(BOOLEAN, nullable=False, default=False, server_default="false")
    is_active: Mapped[bool] = mapped_column(BOOLEAN, nullable=False, default=True, server_default="true")
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="active", server_default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class APIIntegration(Base):
    __tablename__ = "api_integration"

    api_integration_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    integration_name: Mapped[str] = mapped_column(String(255), nullable=False)
    integration_type: Mapped[str] = mapped_column(String(50), nullable=False)
    api_endpoint: Mapped[str | None] = mapped_column(TEXT)
    is_active: Mapped[bool] = mapped_column(BOOLEAN, nullable=False, default=True, server_default="true")
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="active", server_default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class APIIntegrationUsageLog(Base):
    __tablename__ = "api_integration_usage_log"

    log_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    api_integration_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    request_tokens: Mapped[int | None] = mapped_column(INTEGER)
    response_tokens: Mapped[int | None] = mapped_column(INTEGER)
    total_tokens: Mapped[int | None] = mapped_column(INTEGER)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="success", server_default="success")
    error_message: Mapped[str | None] = mapped_column(TEXT)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
