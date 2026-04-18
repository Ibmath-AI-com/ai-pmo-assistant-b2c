import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from auth.dependencies import CurrentUser, get_current_user
from db.base import get_db
from app.services.persona_service import PersonaService
from app.services.skill_service import SkillService
from app.events.publishers import publish_event
from app.schemas.skills import SkillMappingCreate
from app.schemas.errors import (
    RESPONSES_CREATE, RESPONSES_READ, ERROR_RESPONSES,
)

router = APIRouter()
_persona = PersonaService()
_skills = SkillService()


def _mapping_out(m) -> dict:
    out = {
        "skill_persona_mapping_id": str(m.skill_persona_mapping_id),
        "persona_id": str(m.persona_id),
        "skill_id": str(m.skill_id),
        "priority_order": m.priority_order,
        "is_auto_trigger": m.is_auto_trigger,
        "trigger_condition": m.trigger_condition,
    }
    if getattr(m, "skill", None) is not None:
        out["skill"] = {
            "skill_id": str(m.skill.skill_id),
            "skill_code": m.skill.skill_code,
            "skill_name": m.skill.skill_name,
            "skill_type": m.skill.skill_type,
            "status": m.skill.status,
        }
    return out


@router.get("/{persona_id}/skills", responses=RESPONSES_READ)
async def list_persona_skills(
    persona_id: uuid.UUID,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    persona = await _persona.get(db, persona_id)
    if not persona:
        raise HTTPException(status_code=404, detail="Persona not found")
    mappings = await _skills.list_for_persona(db, persona_id)
    return [_mapping_out(m) for m in mappings]


@router.post("/{persona_id}/skills", status_code=status.HTTP_201_CREATED, responses=RESPONSES_CREATE)
async def map_skill(
    persona_id: uuid.UUID,
    body: SkillMappingCreate,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    persona = await _persona.get(db, persona_id)
    if not persona:
        raise HTTPException(status_code=404, detail="Persona not found")
    mapping = await _skills.map(
        db,
        persona_id,
        body.skill_id,
        priority_order=body.priority_order,
        is_auto_trigger=body.is_auto_trigger,
        trigger_condition=body.trigger_condition,
    )
    await publish_event(
        "skill.persona.mapped",
        {"persona_id": str(persona_id), "skill_id": str(body.skill_id)},
    )
    return _mapping_out(mapping)


@router.delete(
    "/{persona_id}/skills/{skill_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={204: {"description": "Mapping successfully removed"}, 401: ERROR_RESPONSES[401], 404: ERROR_RESPONSES[404]},
)
async def unmap_skill(
    persona_id: uuid.UUID,
    skill_id: uuid.UUID,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    removed = await _skills.unmap(db, persona_id, skill_id)
    if not removed:
        raise HTTPException(status_code=404, detail="Mapping not found")
    await publish_event(
        "skill.persona.unmapped",
        {"persona_id": str(persona_id), "skill_id": str(skill_id)},
    )
