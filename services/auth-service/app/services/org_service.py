import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[3] / "shared"))

from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from db.models.organization import Department, Organization


# ── Organizations ──────────────────────────────────────────────────────────────

async def create_organization(db: AsyncSession, data: dict) -> Organization:
    org = Organization(**data)
    db.add(org)
    await db.commit()
    await db.refresh(org)
    return org


async def get_organization(db: AsyncSession, org_id: UUID) -> Organization:
    result = await db.execute(select(Organization).where(Organization.organization_id == org_id))
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")
    return org


async def update_organization(db: AsyncSession, org_id: UUID, data: dict) -> Organization:
    org = await get_organization(db, org_id)
    for key, value in data.items():
        if value is not None:
            setattr(org, key, value)
    await db.commit()
    await db.refresh(org)
    return org


# ── Departments ────────────────────────────────────────────────────────────────

async def create_department(db: AsyncSession, data: dict) -> Department:
    # Verify org exists
    await get_organization(db, data["organization_id"])
    dept = Department(**data)
    db.add(dept)
    await db.commit()
    await db.refresh(dept)
    return dept


async def get_departments(db: AsyncSession, org_id: UUID) -> list[Department]:
    result = await db.execute(
        select(Department).where(Department.organization_id == org_id)
    )
    return list(result.scalars().all())


async def get_department(db: AsyncSession, dept_id: UUID) -> Department:
    result = await db.execute(select(Department).where(Department.department_id == dept_id))
    dept = result.scalar_one_or_none()
    if not dept:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Department not found")
    return dept


async def update_department(db: AsyncSession, dept_id: UUID, data: dict) -> Department:
    dept = await get_department(db, dept_id)
    for key, value in data.items():
        if value is not None:
            setattr(dept, key, value)
    await db.commit()
    await db.refresh(dept)
    return dept
