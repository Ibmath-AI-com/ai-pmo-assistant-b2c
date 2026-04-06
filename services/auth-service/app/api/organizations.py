import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[3] / "shared"))

from uuid import UUID

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from auth.dependencies import CurrentUser, get_current_user
from db.base import get_db

from app.services.org_service import create_organization, get_organization, update_organization

router = APIRouter()


class OrgCreateRequest(BaseModel):
    organization_code: str
    organization_name: str
    industry: str | None = None
    country_code: str | None = None
    tenant_type: str = "B2B"


class OrgUpdateRequest(BaseModel):
    organization_name: str | None = None
    industry: str | None = None
    country_code: str | None = None
    status: str | None = None


class OrgResponse(BaseModel):
    organization_id: UUID
    organization_code: str
    organization_name: str
    industry: str | None
    country_code: str | None
    tenant_type: str
    status: str

    model_config = {"from_attributes": True}


@router.post("", response_model=OrgResponse, status_code=201)
async def create_org(
    body: OrgCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    return await create_organization(db, body.model_dump())


@router.get("/{org_id}", response_model=OrgResponse)
async def get_org(
    org_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    return await get_organization(db, org_id)


@router.put("/{org_id}", response_model=OrgResponse)
async def update_org(
    org_id: UUID,
    body: OrgUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    return await update_organization(db, org_id, body.model_dump(exclude_none=True))
