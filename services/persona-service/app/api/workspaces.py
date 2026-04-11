import uuid
from datetime import datetime
from decimal import Decimal
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from auth.dependencies import CurrentUser, get_current_user
from db.base import get_db
from db.models.persona import PersonaWorkspaceMapping
from app.services.workspace_service import WorkspaceService
from app.events.publishers import publish_event
from app.schemas.workspaces import (
    WorkspaceCreate,
    WorkspaceUpdate,
    StatusUpdate,
    MemberAdd,
    SettingItem,
    SettingsUpdate,
    DefaultPersonaUpdate,
)
from app.schemas.errors import (
    RESPONSES_CREATE, RESPONSES_READ, RESPONSES_LIST, RESPONSES_UPDATE,
    RESPONSES_DELETE, RESPONSES_PATCH, RESPONSES_ADD_MEMBER, ERROR_RESPONSES
)

router = APIRouter()
_svc = WorkspaceService()


# ---------- Response helpers ----------

def _member_out(m) -> dict:
    return {
        "workspace_member_id": str(m.workspace_member_id),
        "user_id": str(m.user_id) if m.user_id else None,
        "member_role": m.member_role,
        "joined_at": m.joined_at.isoformat() if m.joined_at else None,
        "status": m.status,
    }


def _setting_out(s) -> dict:
    return {
        "workspace_setting_id": str(s.workspace_setting_id),
        "setting_key": s.setting_key,
        "setting_value": s.setting_value,
        "value_type": s.value_type,
    }


def _tag_out(t) -> dict:
    return {
        "workspace_tag_id": str(t.workspace_tag_id),
        "tag_name": t.tag_name,
    }


def _workspace_out(w, detail: bool = False) -> dict:
    out: dict[str, Any] = {
        "workspace_id": str(w.workspace_id),
        "workspace_name": w.workspace_name,
        "workspace_code": w.workspace_code,
        "entity_title": w.entity_title,
        "description": w.description,
        "status": w.status,
        "is_template": w.is_template,
        "creator_user_id": str(w.creator_user_id) if w.creator_user_id else None,
        "default_persona_id": str(w.default_persona_id) if w.default_persona_id else None,
        "metadata_json": w.metadata_json,
        "created_at": w.created_at.isoformat() if w.created_at else None,
        "updated_at": w.updated_at.isoformat() if w.updated_at else None,
    }
    if detail:
        out["members"] = [_member_out(m) for m in (w.members or [])]
        out["settings"] = [_setting_out(s) for s in (w.settings or [])]
        out["tags"] = [_tag_out(t) for t in (w.tags or [])]
        out["content_entities"] = [
            {
                "workspace_content_entity_id": str(e.workspace_content_entity_id),
                "entity_type": e.entity_type,
                "entity_title": e.entity_title,
                "priority_order": e.priority_order,
                "entry_status": e.entry_status,
            }
            for e in (w.content_entities or [])
        ]
    return out


# ---------- Routes ----------

@router.post("", status_code=status.HTTP_201_CREATED, responses=RESPONSES_CREATE)
async def create_workspace(
    body: WorkspaceCreate,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    workspace = await _svc.create(db, body.model_dump(), current_user.user_id)
    await publish_event("workspace.created", {"workspace_id": str(workspace.workspace_id), "creator_user_id": str(current_user.user_id)})
    return _workspace_out(workspace)


@router.get("", responses=RESPONSES_LIST)
async def list_workspaces(
    creator_user_id: uuid.UUID | None = None,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    workspaces = await _svc.list(db, creator_user_id=creator_user_id)
    return [_workspace_out(w) for w in workspaces]


@router.get("/{workspace_id}", responses=RESPONSES_READ)
async def get_workspace(
    workspace_id: uuid.UUID,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    workspace = await _svc.get(db, workspace_id)
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return _workspace_out(workspace, detail=True)


@router.put("/{workspace_id}", responses=RESPONSES_UPDATE)
async def update_workspace(
    workspace_id: uuid.UUID,
    body: WorkspaceUpdate,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    workspace = await _svc.get(db, workspace_id)
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    data = {k: v for k, v in body.model_dump().items() if v is not None}
    workspace = await _svc.update(db, workspace, data, current_user.user_id)
    await publish_event("workspace.updated", {"workspace_id": str(workspace.workspace_id)})
    return _workspace_out(workspace)


@router.patch("/{workspace_id}/status", responses=RESPONSES_PATCH)
async def set_workspace_status(
    workspace_id: uuid.UUID,
    body: StatusUpdate,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    workspace = await _svc.get(db, workspace_id)
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    workspace = await _svc.set_status(db, workspace, body.status, current_user.user_id)
    return {"workspace_id": str(workspace.workspace_id), "status": workspace.status}


@router.post("/{workspace_id}/members", status_code=status.HTTP_201_CREATED, responses=RESPONSES_ADD_MEMBER)
async def add_member(
    workspace_id: uuid.UUID,
    body: MemberAdd,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    workspace = await _svc.get(db, workspace_id)
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    member = await _svc.add_member(db, workspace_id, body.user_id, body.member_role)
    await publish_event("workspace.member.added", {"workspace_id": str(workspace_id), "user_id": str(body.user_id), "role": body.member_role})
    return _member_out(member)


@router.delete("/{workspace_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT, responses={204: {"description": "Member successfully removed"}, 401: ERROR_RESPONSES[401], 404: ERROR_RESPONSES[404]})
async def remove_member(
    workspace_id: uuid.UUID,
    user_id: uuid.UUID,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    removed = await _svc.remove_member(db, workspace_id, user_id)
    if not removed:
        raise HTTPException(status_code=404, detail="Member not found")
    await publish_event("workspace.member.removed", {"workspace_id": str(workspace_id), "user_id": str(user_id)})


@router.put("/{workspace_id}/settings", responses=RESPONSES_UPDATE)
async def update_settings(
    workspace_id: uuid.UUID,
    body: SettingsUpdate,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    workspace = await _svc.get(db, workspace_id)
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    rows = await _svc.upsert_settings(db, workspace_id, [s.model_dump() for s in body.settings], current_user.user_id)
    return [_setting_out(r) for r in rows]


@router.put("/{workspace_id}/default-persona", responses=RESPONSES_UPDATE)
async def set_default_persona(
    workspace_id: uuid.UUID,
    body: DefaultPersonaUpdate,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    workspace = await _svc.get(db, workspace_id)
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    workspace = await _svc.set_default_persona(db, workspace, body.persona_id, current_user.user_id)
    return {"workspace_id": str(workspace.workspace_id), "default_persona_id": str(workspace.default_persona_id) if workspace.default_persona_id else None}


@router.get("/{workspace_id}/personas", responses=RESPONSES_READ)
async def list_workspace_personas(
    workspace_id: uuid.UUID,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from sqlalchemy import select
    from sqlalchemy.orm import selectinload
    from db.models.workspace import Workspace
    workspace = await _svc.get(db, workspace_id)
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return [
        {
            "persona_workspace_mapping_id": str(m.persona_workspace_mapping_id),
            "persona_id": str(m.persona_id),
            "is_default": m.is_default,
            "status": m.status,
            "created_at": m.created_at.isoformat() if m.created_at else None,
        }
        for m in (workspace.persona_mappings or [])
    ]
