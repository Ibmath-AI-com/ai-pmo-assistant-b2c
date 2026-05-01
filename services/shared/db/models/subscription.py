import uuid
from datetime import date, datetime

from sqlalchemy import Boolean, CheckConstraint, DateTime, Date, String, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class UserSubscription(Base):
    __tablename__ = "user_subscription"

    user_subscription_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    package_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date | None] = mapped_column(Date)
    billing_cycle: Mapped[str] = mapped_column(String(20), nullable=False, default="monthly", server_default="monthly")
    billing_status: Mapped[str] = mapped_column(String(20), nullable=False, default="active", server_default="active")
    auto_renew_flag: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default="true")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        CheckConstraint("billing_cycle IN ('monthly', 'annual', 'trial')", name="ck_user_subscription_billing_cycle"),
        CheckConstraint("billing_status IN ('active', 'cancelled', 'expired', 'trial')", name="ck_user_subscription_billing_status"),
        UniqueConstraint("user_id", "package_id", name="uq_user_subscription"),
    )
