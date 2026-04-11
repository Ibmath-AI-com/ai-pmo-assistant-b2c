import uuid
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from auth.dependencies import CurrentUser, get_current_user
from db.base import get_db
from app.services.persona_service import PersonaService
from app.schemas.behavior import BehaviorUpdate
from app.schemas.errors import RESPONSES_UPDATE, ERROR_RESPONSES

router = APIRouter()
_svc = PersonaService()


@router.put("/{persona_id}/behavior", responses=RESPONSES_UPDATE)
async def update_behavior(
    persona_id: uuid.UUID,
    body: BehaviorUpdate,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    persona = await _svc.get(db, persona_id)
    if not persona:
        raise HTTPException(status_code=404, detail="Persona not found")
    setting = await _svc.upsert_behavior(db, persona_id, body.model_dump())
    return {
        "persona_behavior_setting_id": str(setting.persona_behavior_setting_id),
        "persona_id": str(setting.persona_id),
        "system_instruction": setting.system_instruction,
        "tone_of_voice": setting.tone_of_voice,
        "response_format_preference": setting.response_format_preference,
        "default_language": setting.default_language,
        "max_response_length": setting.max_response_length,
        "temperature": float(setting.temperature) if setting.temperature is not None else None,
    }
