from __future__ import annotations

import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from auth.dependencies import CurrentUser, get_current_user
from db.base import get_db
from app.services.template_service import TemplateService
from app.events.publishers import publish_event

router = APIRouter()
_svc = TemplateService()


class CustomizeTemplateCreate(BaseModel):
    template_version_id: uuid.UUID
    custom_name: str | None = None
    custom_body: str | None = None
    workspace_id: uuid.UUID | None = None


class CustomizeTemplateUpdate(BaseModel):
    custom_name: str | None = None
    custom_body: str | None = None
    workspace_id: uuid.UUID | None = None


def _custom_out(c) -> dict[str, Any]:
    return {
        "customize_template_id": str(c.customize_template_id),
        "template_version_id": str(c.template_version_id),
        "user_id": str(c.user_id) if c.user_id else None,
        "workspace_id": str(c.workspace_id) if c.workspace_id else None,
        "custom_name": c.custom_name,
        "custom_body": c.custom_body,
        "status": c.status,
        "created_at": c.created_at.isoformat() if c.created_at else None,
        "updated_at": c.updated_at.isoformat() if c.updated_at else None,
    }


@router.post("/{template_id}/custom", status_code=201)
async def create_custom(
    template_id: uuid.UUID,
    body: CustomizeTemplateCreate,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    custom = await _svc.create_custom(db, template_id, body.model_dump(), user.user_id)
    await db.commit()
    await publish_event("template.custom.created", {"template_id": str(template_id), "customize_template_id": str(custom.customize_template_id)})
    return _custom_out(custom)


@router.get("/{template_id}/custom")
async def get_custom(
    template_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    custom = await _svc.get_custom(db, template_id, user.user_id)
    if not custom:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customize template not found")
    return _custom_out(custom)


@router.put("/{template_id}/custom")
async def update_custom(
    template_id: uuid.UUID,
    body: CustomizeTemplateUpdate,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    custom = await _svc.update_custom(db, template_id, body.model_dump(exclude_none=True), user.user_id)
    await db.commit()
    return _custom_out(custom)
