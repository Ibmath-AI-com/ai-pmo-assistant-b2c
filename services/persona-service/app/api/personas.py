import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from auth.dependencies import CurrentUser, get_current_user
from db.base import get_db
from app.services.persona_service import PersonaService
from app.services.workspace_service import WorkspaceService
from app.events.publishers import publish_event
from app.schemas.personas import PersonaCreate, PersonaUpdate, StatusUpdate, WorkspaceMappingCreate
from app.schemas.errors import (
    RESPONSES_CREATE, RESPONSES_READ, RESPONSES_LIST, RESPONSES_UPDATE, 
    RESPONSES_DELETE, RESPONSES_PATCH, ERROR_RESPONSES
)

router = APIRouter()
_svc = PersonaService()
_ws = WorkspaceService()


# ---------- Response helpers ----------

def _behavior_out(b) -> dict | None:
    if not b:
        return None
    return {
        "persona_behavior_setting_id": str(b.persona_behavior_setting_id),
        "system_instruction": b.system_instruction,
        "tone_of_voice": b.tone_of_voice,
        "response_format_preference": b.response_format_preference,
        "default_language": b.default_language,
        "max_response_length": b.max_response_length,
        "temperature": float(b.temperature) if b.temperature is not None else None,
    }


def _policy_out(p) -> dict | None:
    if not p:
        return None
    return {
        "persona_model_policy_id": str(p.persona_model_policy_id),
        "default_model_id": str(p.default_model_id) if p.default_model_id else None,
        "chat_mode": p.chat_mode,
        "use_rag": p.use_rag,
        "use_internal_llm": p.use_internal_llm,
        "use_external_llm": p.use_external_llm,
        "classification_limit": p.classification_limit,
        "allow_file_upload": p.allow_file_upload,
        "allow_external_sources": p.allow_external_sources,
        "updated_at": p.updated_at.isoformat() if p.updated_at else None,
    }


def _persona_out(p, detail: bool = False) -> dict:
    out: dict[str, Any] = {
        "persona_id": str(p.persona_id),
        "persona_code": p.persona_code,
        "persona_name": p.persona_name,
        "persona_category": p.persona_category,
        "short_description": p.short_description,
        "organization_id": str(p.organization_id) if p.organization_id else None,
        "user_id": str(p.user_id) if p.user_id else None,
        "avatar_file_id": str(p.avatar_file_id) if p.avatar_file_id else None,
        "is_system_persona": p.is_system_persona,
        "status": p.status,
        "created_at": p.created_at.isoformat() if p.created_at else None,
        "updated_at": p.updated_at.isoformat() if p.updated_at else None,
    }
    if detail:
        out["behavior_setting"] = _behavior_out(p.behavior_setting)
        out["model_policy"] = _policy_out(p.model_policy)
        out["domain_tags"] = [
            {"persona_domain_tag_id": str(t.persona_domain_tag_id), "tag_name": t.tag_name, "tag_type": t.tag_type}
            for t in (p.domain_tags or [])
        ]
        out["access_roles"] = [
            {"persona_access_role_id": str(r.persona_access_role_id), "user_id": str(r.user_id) if r.user_id else None}
            for r in (p.access_roles or [])
        ]
        out["workspace_mappings"] = [
            {
                "persona_workspace_mapping_id": str(m.persona_workspace_mapping_id),
                "workspace_id": str(m.workspace_id),
                "is_default": m.is_default,
                "status": m.status,
                "created_at": m.created_at.isoformat() if m.created_at else None,
            }
            for m in (p.workspace_mappings or [])
        ]
    return out


# ---------- Routes ----------

@router.post("", status_code=status.HTTP_201_CREATED, responses=RESPONSES_CREATE)
async def create_persona(
    body: PersonaCreate,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    data = body.model_dump()
    if not data.get("organization_id"):
        data["organization_id"] = current_user.organization_id
    persona = await _svc.create(db, data, current_user.user_id)
    await publish_event("persona.created", {"persona_id": str(persona.persona_id), "organization_id": str(persona.organization_id) if persona.organization_id else None})
    return _persona_out(persona)


@router.get("", responses=RESPONSES_LIST)
async def list_personas(
    organization_id: uuid.UUID | None = None,
    category: str | None = None,
    status: str | None = None,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    org_id = organization_id or current_user.organization_id
    personas = await _svc.list(db, organization_id=org_id, category=category, status=status)
    return [_persona_out(p) for p in personas]


@router.get("/{persona_id}", responses=RESPONSES_READ)
async def get_persona(
    persona_id: uuid.UUID,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    persona = await _svc.get(db, persona_id)
    if not persona:
        raise HTTPException(status_code=404, detail="Persona not found")
    return _persona_out(persona, detail=True)


@router.put("/{persona_id}", responses=RESPONSES_UPDATE)
async def update_persona(
    persona_id: uuid.UUID,
    body: PersonaUpdate,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    persona = await _svc.get(db, persona_id)
    if not persona:
        raise HTTPException(status_code=404, detail="Persona not found")
    persona = await _svc.update(db, persona, body.model_dump(exclude_none=True), current_user.user_id)
    await publish_event("persona.updated", {"persona_id": str(persona.persona_id)})
    return _persona_out(persona)


@router.patch("/{persona_id}/status", responses=RESPONSES_PATCH)
async def set_persona_status(
    persona_id: uuid.UUID,
    body: StatusUpdate,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    persona = await _svc.get(db, persona_id)
    if not persona:
        raise HTTPException(status_code=404, detail="Persona not found")
    persona = await _svc.set_status(db, persona, body.status, current_user.user_id)
    return {"persona_id": str(persona.persona_id), "status": persona.status}


@router.get("/{persona_id}/workspaces", responses=RESPONSES_READ)
async def list_persona_workspaces(
    persona_id: uuid.UUID,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    persona = await _svc.get(db, persona_id)
    if not persona:
        raise HTTPException(status_code=404, detail="Persona not found")
    return [
        {
            "persona_workspace_mapping_id": str(m.persona_workspace_mapping_id),
            "workspace_id": str(m.workspace_id),
            "is_default": m.is_default,
            "status": m.status,
            "created_at": m.created_at.isoformat() if m.created_at else None,
        }
        for m in (persona.workspace_mappings or [])
    ]


@router.post("/{persona_id}/workspaces", status_code=status.HTTP_201_CREATED, responses=RESPONSES_CREATE)
async def map_persona_to_workspace(
    persona_id: uuid.UUID,
    body: WorkspaceMappingCreate,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    persona = await _svc.get(db, persona_id)
    if not persona:
        raise HTTPException(status_code=404, detail="Persona not found")

    workspace = await _ws.get(db, body.workspace_id)
    if not workspace:
        raise HTTPException(
            status_code=404,
            detail={
                "detail": "Workspace not found",
                "error_code": "WORKSPACE_NOT_FOUND",
                "workspace_id": str(body.workspace_id),
            },
        )

    mapping = await _svc.map_to_workspace(db, persona_id, body.workspace_id, body.is_default)
    return {
        "persona_workspace_mapping_id": str(mapping.persona_workspace_mapping_id),
        "persona_id": str(mapping.persona_id),
        "workspace_id": str(mapping.workspace_id),
        "is_default": mapping.is_default,
        "status": mapping.status,
    }


@router.delete("/{persona_id}/workspaces/{workspace_id}", status_code=status.HTTP_204_NO_CONTENT, responses={204: {"description": "Mapping successfully removed"}, 401: ERROR_RESPONSES[401], 404: ERROR_RESPONSES[404]})
async def unmap_persona_from_workspace(
    persona_id: uuid.UUID,
    workspace_id: uuid.UUID,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    removed = await _svc.unmap_from_workspace(db, persona_id, workspace_id)
    if not removed:
        raise HTTPException(status_code=404, detail="Mapping not found")
