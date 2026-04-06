import uuid
from datetime import datetime

from sqlalchemy import Boolean, CheckConstraint, DateTime, ForeignKey, Index, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class Organization(Base):
    __tablename__ = "organization"

    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    organization_code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    organization_name: Mapped[str] = mapped_column(String(255), nullable=False)
    industry: Mapped[str | None] = mapped_column(String(100))
    country_code: Mapped[str | None] = mapped_column(String(10))
    tenant_type: Mapped[str] = mapped_column(
        String(10), nullable=False, default="B2B",
        server_default="B2B"
    )
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="active", server_default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    created_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    updated_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))

    __table_args__ = (
        CheckConstraint("tenant_type IN ('B2B', 'B2C')", name="ck_organization_tenant_type"),
        CheckConstraint("status IN ('active', 'inactive', 'suspended')", name="ck_organization_status"),
        Index("idx_organization_tenant_type", "tenant_type"),
        Index("idx_organization_status", "status"),
    )

    departments: Mapped[list["Department"]] = relationship("Department", back_populates="organization")


class Department(Base):
    __tablename__ = "department"

    department_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("organization.organization_id"), nullable=False)
    department_code: Mapped[str] = mapped_column(String(50), nullable=False)
    department_name: Mapped[str] = mapped_column(String(255), nullable=False)
    parent_department_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("department.department_id"))
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="active", server_default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    created_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    updated_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))

    __table_args__ = (
        Index("idx_department_org", "organization_id"),
    )

    organization: Mapped["Organization"] = relationship("Organization", back_populates="departments")
