import uuid
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from auth.dependencies import CurrentUser, get_current_user
from db.base import get_db
from app.services.persona_service import PersonaService
from app.schemas.model_policy import ModelPolicyUpdate, AllowedModelsUpdate
from app.schemas.errors import RESPONSES_UPDATE, ERROR_RESPONSES

router = APIRouter()
_svc = PersonaService()


@router.put("/{persona_id}/model-policy", responses=RESPONSES_UPDATE)
async def update_model_policy(
    persona_id: uuid.UUID,
    body: ModelPolicyUpdate,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    persona = await _svc.get(db, persona_id)
    if not persona:
        raise HTTPException(status_code=404, detail="Persona not found")
    policy = await _svc.upsert_model_policy(db, persona_id, body.model_dump())
    return {
        "persona_model_policy_id": str(policy.persona_model_policy_id),
        "persona_id": str(policy.persona_id),
        "default_model_id": str(policy.default_model_id) if policy.default_model_id else None,
        "chat_mode": policy.chat_mode,
        "use_rag": policy.use_rag,
        "use_internal_llm": policy.use_internal_llm,
        "use_external_llm": policy.use_external_llm,
        "classification_limit": policy.classification_limit,
        "allow_file_upload": policy.allow_file_upload,
        "allow_external_sources": policy.allow_external_sources,
        "updated_at": policy.updated_at.isoformat() if policy.updated_at else None,
    }


@router.put("/{persona_id}/allowed-models", responses=RESPONSES_UPDATE)
async def update_allowed_models(
    persona_id: uuid.UUID,
    body: AllowedModelsUpdate,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    persona = await _svc.get(db, persona_id)
    if not persona:
        raise HTTPException(status_code=404, detail="Persona not found")
    rows = await _svc.set_allowed_models(
        db, persona_id, [m.model_dump() for m in body.models]
    )
    return [
        {
            "persona_allowed_model_id": str(r.persona_allowed_model_id),
            "model_id": str(r.model_id),
            "priority_order": r.priority_order,
            "is_default": r.is_default,
        }
        for r in rows
    ]
