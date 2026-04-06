import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[3] / "shared"))

from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from db.models.role import Permission, Role, RolePermission, UserRole


# ── Roles ──────────────────────────────────────────────────────────────────────

async def get_roles(db: AsyncSession, org_id: UUID) -> list[Role]:
    result = await db.execute(
        select(Role)
        .where(Role.organization_id == org_id)
        .options(selectinload(Role.permissions).selectinload(RolePermission.permission))
    )
    return list(result.scalars().all())


async def get_role(db: AsyncSession, role_id: UUID) -> Role:
    result = await db.execute(
        select(Role)
        .where(Role.role_id == role_id)
        .options(selectinload(Role.permissions).selectinload(RolePermission.permission))
    )
    role = result.scalar_one_or_none()
    if not role:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found")
    return role


async def create_role(db: AsyncSession, data: dict) -> Role:
    role = Role(**data)
    db.add(role)
    await db.commit()
    await db.refresh(role)
    return role


async def update_role(db: AsyncSession, role_id: UUID, data: dict) -> Role:
    role = await get_role(db, role_id)
    for key, value in data.items():
        if value is not None:
            setattr(role, key, value)
    await db.commit()
    return await get_role(db, role_id)


async def set_role_permissions(db: AsyncSession, role_id: UUID, permission_ids: list[UUID]) -> Role:
    # Verify role exists
    await get_role(db, role_id)

    # Replace all permissions
    await db.execute(delete(RolePermission).where(RolePermission.role_id == role_id))

    for perm_id in permission_ids:
        db.add(RolePermission(role_id=role_id, permission_id=perm_id))

    await db.commit()
    return await get_role(db, role_id)


# ── Permissions ────────────────────────────────────────────────────────────────

async def get_permissions(db: AsyncSession, module_name: str | None = None) -> list[Permission]:
    query = select(Permission).where(Permission.status == "active")
    if module_name:
        query = query.where(Permission.module_name == module_name)
    result = await db.execute(query)
    return list(result.scalars().all())


# ── User-Role assignment ───────────────────────────────────────────────────────

async def assign_role_to_user(db: AsyncSession, user_id: UUID, role_id: UUID, assigned_by: UUID) -> UserRole:
    # Check if already assigned
    existing = await db.execute(
        select(UserRole).where(UserRole.user_id == user_id, UserRole.role_id == role_id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Role already assigned")

    user_role = UserRole(user_id=user_id, role_id=role_id, assigned_by=assigned_by)
    db.add(user_role)
    await db.commit()
    await db.refresh(user_role)
    return user_role


async def revoke_role_from_user(db: AsyncSession, user_id: UUID, role_id: UUID) -> None:
    await db.execute(
        delete(UserRole).where(UserRole.user_id == user_id, UserRole.role_id == role_id)
    )
    await db.commit()
