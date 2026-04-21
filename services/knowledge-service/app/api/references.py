"""
Reference data endpoints — LLM models and users (for wizard dropdowns).
"""
from uuid import UUID

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from auth.dependencies import CurrentUser, get_current_user
from db.base import get_db

router = APIRouter()


# ─── LLM Models ──────────────────────────────────────────────────────────────

class LLMModelOut(BaseModel):
    llm_model_id: UUID
    provider_name: str
    model_name: str
    model_code: str
    is_external: bool

    model_config = {"from_attributes": True}


@router.get("/llm-models", response_model=list[LLMModelOut])
async def list_llm_models(
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    result = await db.execute(
        text("SELECT llm_model_id, provider_name, model_name, model_code, is_external FROM llm_model WHERE status = 'active' ORDER BY provider_name, model_name")
    )
    rows = result.mappings().all()
    return [LLMModelOut(**dict(row)) for row in rows]


# ─── Users ───────────────────────────────────────────────────────────────────

class UserOut(BaseModel):
    user_id: UUID
    username: str
    email: str


@router.get("/users", response_model=list[UserOut])
async def list_users(
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    result = await db.execute(
        text('SELECT user_id, username, email FROM "user" WHERE status = \'active\' ORDER BY username LIMIT 200')
    )
    rows = result.mappings().all()
    return [UserOut(**dict(row)) for row in rows]
