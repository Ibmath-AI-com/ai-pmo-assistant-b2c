from __future__ import annotations

import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from auth.dependencies import CurrentUser, get_current_user
from db.base import get_db
from app.services.template_service import TemplateService
from app.events.publishers import publish_event

router = APIRouter()
_svc = TemplateService()


# --- Schemas ---

class TemplateCreate(BaseModel):
    template_code: str = Field(..., max_length=50)
    template_name: str = Field(..., max_length=255)
    template_body: str | None = None
    output_format: str | None = Field(None, pattern="^(pdf|docx|pptx|markdown)$")
    template_family_id: uuid.UUID | None = None
    description: str | None = None
    is_system: bool = False
    status: str = Field("active", pattern="^(active|inactive|draft)$")
    persona_id: uuid.UUID | None = None


class TemplateUpdate(BaseModel):
    template_name: str | None = Field(None, max_length=255)
    template_body: str | None = None
    output_format: str | None = Field(None, pattern="^(pdf|docx|pptx|markdown)$")
    template_family_id: uuid.UUID | None = None
    description: str | None = None
    persona_id: uuid.UUID | None = None


class StatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(active|inactive|draft)$")


class FileMappingItem(BaseModel):
    file_id: uuid.UUID
    chat_session_id: uuid.UUID | None = None


class FileMappingsUpdate(BaseModel):
    mappings: list[FileMappingItem]


class VersionCreate(BaseModel):
    effective_from: str | None = None


# --- Serializers ---

def _family_out(f) -> dict[str, Any] | None:
    if f is None:
        return None
    return {"id": str(f.id), "name": f.name, "system_name": f.system_name}


def _template_out(t, detail: bool = False) -> dict[str, Any]:
    out: dict[str, Any] = {
        "template_id": str(t.template_id),
        "template_code": t.template_code,
        "template_name": t.template_name,
        "description": t.description,
        "output_format": t.output_format,
        "template_family_id": str(t.template_family_id) if t.template_family_id else None,
        "family": _family_out(t.family) if hasattr(t, "family") else None,
        "persona_id": str(t.persona_id) if t.persona_id else None,
        "is_system": t.is_system,
        "status": t.status,
        "created_at": t.created_at.isoformat() if t.created_at else None,
        "updated_at": t.updated_at.isoformat() if t.updated_at else None,
    }
    if detail:
        out["template_body"] = t.template_body
        out["file_mappings"] = [
            {"template_file_mapping_id": str(fm.template_file_mapping_id), "file_id": str(fm.file_id), "chat_session_id": str(fm.chat_session_id) if fm.chat_session_id else None}
            for fm in (t.file_mappings or [])
        ]
    return out


def _version_out(v) -> dict[str, Any]:
    return {
        "template_version_id": str(v.template_version_id),
        "template_id": str(v.template_id),
        "version_no": v.version_no,
        "template_body": v.template_body,
        "uploaded_by_id": str(v.uploaded_by_id) if v.uploaded_by_id else None,
        "effective_from": v.effective_from.isoformat() if v.effective_from else None,
        "status": v.status,
        "created_at": v.created_at.isoformat() if v.created_at else None,
        "created_by": str(v.created_by) if v.created_by else None,
    }


# --- Template Families ---

@router.get("/families")
async def list_families(
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    families = await _svc.list_families(db)
    return [_family_out(f) for f in families]


# --- Template CRUD ---

@router.post("", status_code=201)
async def create_template(
    body: TemplateCreate,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    template = await _svc.create(db, body.model_dump(), user.user_id)
    await db.commit()
    await publish_event("template.created", {"template_id": str(template.template_id)})
    return _template_out(template, detail=True)


@router.get("")
async def list_templates(
    status: str | None = Query(None),
    family_id: uuid.UUID | None = Query(None),
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    templates = await _svc.list(db, user.user_id, status, family_id)
    return [_template_out(t) for t in templates]


@router.get("/{template_id}")
async def get_template(
    template_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    template = await _svc.get(db, template_id)
    return _template_out(template, detail=True)


@router.put("/{template_id}")
async def update_template(
    template_id: uuid.UUID,
    body: TemplateUpdate,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    template = await _svc.update(db, template_id, body.model_dump(exclude_none=True), user.user_id)
    await db.commit()
    await publish_event("template.updated", {"template_id": str(template.template_id)})
    return _template_out(template, detail=True)


@router.patch("/{template_id}/status")
async def update_status(
    template_id: uuid.UUID,
    body: StatusUpdate,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    template = await _svc.update_status(db, template_id, body.status, user.user_id)
    await db.commit()
    return _template_out(template)


# --- Versioning ---

@router.get("/{template_id}/versions")
async def list_versions(
    template_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    versions = await _svc.list_versions(db, template_id)
    return [_version_out(v) for v in versions]


@router.get("/{template_id}/versions/latest")
async def get_latest_version(
    template_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    versions = await _svc.list_versions(db, template_id)
    if not versions:
        raise HTTPException(status_code=404, detail="No versions found for this template")
    return _version_out(versions[0])


@router.get("/{template_id}/versions/{version_id}")
async def get_version(
    template_id: uuid.UUID,
    version_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    version = await _svc.get_version(db, template_id, version_id)
    return _version_out(version)


@router.post("/{template_id}/versions", status_code=201)
async def save_version(
    template_id: uuid.UUID,
    body: VersionCreate,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    version = await _svc.save_version(db, template_id, body.model_dump(exclude_none=True), user.user_id)
    await db.commit()
    await publish_event("template.version.created", {"template_id": str(template_id), "version_id": str(version.template_version_id)})
    return _version_out(version)


@router.put("/{template_id}/versions/{version_id}/restore")
async def restore_version(
    template_id: uuid.UUID,
    version_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    template = await _svc.restore_version(db, template_id, version_id, user.user_id)
    await db.commit()
    return _template_out(template, detail=True)


# --- File Mappings ---

@router.put("/{template_id}/files")
async def set_file_mappings(
    template_id: uuid.UUID,
    body: FileMappingsUpdate,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    mappings = await _svc.set_file_mappings(
        db, template_id, [m.model_dump() for m in body.mappings]
    )
    await db.commit()
    return [
        {"template_file_mapping_id": str(fm.template_file_mapping_id), "file_id": str(fm.file_id), "chat_session_id": str(fm.chat_session_id) if fm.chat_session_id else None}
        for fm in mappings
    ]
