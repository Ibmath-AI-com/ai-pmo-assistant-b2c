import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[3] / "shared"))

from uuid import UUID

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from auth.dependencies import CurrentUser, get_current_user
from db.base import get_db

from app.services.rbac_service import (
    assign_role_to_user,
    create_role,
    get_permissions,
    get_roles,
    revoke_role_from_user,
    set_role_permissions,
    update_role,
)

router = APIRouter()


# ── Schemas ────────────────────────────────────────────────────────────────────

class RoleCreateRequest(BaseModel):
    organization_id: UUID
    role_code: str
    role_name: str
    description: str | None = None


class RoleUpdateRequest(BaseModel):
    role_name: str | None = None
    description: str | None = None
    status: str | None = None


class SetPermissionsRequest(BaseModel):
    permission_ids: list[UUID]


class AssignRoleRequest(BaseModel):
    user_id: UUID
    role_id: UUID


class PermissionResponse(BaseModel):
    permission_id: UUID
    permission_key: str
    permission_name: str
    module_name: str | None
    status: str

    model_config = {"from_attributes": True}


class RoleResponse(BaseModel):
    role_id: UUID
    organization_id: UUID
    role_code: str
    role_name: str
    description: str | None
    is_system_role: bool
    status: str
    permissions: list[PermissionResponse] = []

    model_config = {"from_attributes": True}


def _serialize_role(role) -> dict:
    return {
        "role_id": role.role_id,
        "organization_id": role.organization_id,
        "role_code": role.role_code,
        "role_name": role.role_name,
        "description": role.description,
        "is_system_role": role.is_system_role,
        "status": role.status,
        "permissions": [
            {
                "permission_id": rp.permission.permission_id,
                "permission_key": rp.permission.permission_key,
                "permission_name": rp.permission.permission_name,
                "module_name": rp.permission.module_name,
                "status": rp.permission.status,
            }
            for rp in role.permissions
            if rp.permission
        ],
    }


# ── Routes ─────────────────────────────────────────────────────────────────────

@router.get("", response_model=list[RoleResponse])
async def list_roles(
    org_id: UUID = Query(...),
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    roles = await get_roles(db, org_id)
    return [_serialize_role(r) for r in roles]


@router.post("", response_model=RoleResponse, status_code=201)
async def create_role_endpoint(
    body: RoleCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    role = await create_role(db, body.model_dump())
    return {
        "role_id": role.role_id,
        "organization_id": role.organization_id,
        "role_code": role.role_code,
        "role_name": role.role_name,
        "description": role.description,
        "is_system_role": role.is_system_role,
        "status": role.status,
        "permissions": [],
    }


@router.put("/{role_id}", response_model=RoleResponse)
async def update_role_endpoint(
    role_id: UUID,
    body: RoleUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    role = await update_role(db, role_id, body.model_dump(exclude_none=True))
    return _serialize_role(role)


@router.put("/{role_id}/permissions", response_model=RoleResponse)
async def set_permissions(
    role_id: UUID,
    body: SetPermissionsRequest,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    role = await set_role_permissions(db, role_id, body.permission_ids)
    return _serialize_role(role)


@router.get("/permissions", response_model=list[PermissionResponse])
async def list_permissions(
    module_name: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    return await get_permissions(db, module_name)


@router.post("/assign", status_code=204)
async def assign_role(
    body: AssignRoleRequest,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    await assign_role_to_user(db, body.user_id, body.role_id, current_user.user_id)


@router.delete("/assign", status_code=204)
async def revoke_role(
    body: AssignRoleRequest,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    await revoke_role_from_user(db, body.user_id, body.role_id)
