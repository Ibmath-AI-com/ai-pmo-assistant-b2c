import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from auth.dependencies import CurrentUser, get_current_user
from db.base import get_db
from app.services.persona_service import PersonaService
from app.events.publishers import publish_event
from app.schemas.access import AccessUpdate, DomainTagItem, DomainTagsUpdate
from app.schemas.errors import RESPONSES_UPDATE, ERROR_RESPONSES

router = APIRouter()
_svc = PersonaService()


@router.put("/{persona_id}/access", responses=RESPONSES_UPDATE)
async def update_access(
    persona_id: uuid.UUID,
    body: AccessUpdate,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    persona = await _svc.get(db, persona_id)
    if not persona:
        raise HTTPException(status_code=404, detail="Persona not found")
    roles = await _svc.set_access(db, persona_id, body.user_ids)
    await publish_event("persona.access.changed", {"persona_id": str(persona_id), "user_count": len(roles)})
    return [
        {"persona_access_role_id": str(r.persona_access_role_id), "user_id": str(r.user_id) if r.user_id else None}
        for r in roles
    ]


@router.put("/{persona_id}/domain-tags", responses=RESPONSES_UPDATE)
async def update_domain_tags(
    persona_id: uuid.UUID,
    body: DomainTagsUpdate,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    persona = await _svc.get(db, persona_id)
    if not persona:
        raise HTTPException(status_code=404, detail="Persona not found")
    tags = await _svc.set_domain_tags(db, persona_id, [t.model_dump() for t in body.tags])
    return [
        {"persona_domain_tag_id": str(t.persona_domain_tag_id), "tag_name": t.tag_name, "tag_type": t.tag_type}
        for t in tags
    ]
