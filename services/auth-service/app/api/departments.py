import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[3] / "shared"))

from uuid import UUID

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from auth.dependencies import CurrentUser, get_current_user
from db.base import get_db

from app.services.org_service import create_department, get_departments, update_department

router = APIRouter()


class DeptCreateRequest(BaseModel):
    organization_id: UUID
    department_code: str
    department_name: str
    parent_department_id: UUID | None = None


class DeptUpdateRequest(BaseModel):
    department_name: str | None = None
    parent_department_id: UUID | None = None
    status: str | None = None


class DeptResponse(BaseModel):
    department_id: UUID
    organization_id: UUID
    department_code: str
    department_name: str
    parent_department_id: UUID | None
    status: str

    model_config = {"from_attributes": True}


@router.post("", response_model=DeptResponse, status_code=201)
async def create_dept(
    body: DeptCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    return await create_department(db, body.model_dump())


@router.get("", response_model=list[DeptResponse])
async def list_departments(
    org_id: UUID = Query(...),
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    return await get_departments(db, org_id)


@router.put("/{dept_id}", response_model=DeptResponse)
async def update_dept(
    dept_id: UUID,
    body: DeptUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    return await update_department(db, dept_id, body.model_dump(exclude_none=True))
