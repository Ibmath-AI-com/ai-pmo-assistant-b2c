"""Internal endpoint called by chat-service — no auth required."""
from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from db.base import get_db
from app.core.generation_pipeline import GenerationPipeline

router = APIRouter()
_pipeline: GenerationPipeline | None = None


def _get_pipeline() -> GenerationPipeline:
    global _pipeline
    if _pipeline is None:
        _pipeline = GenerationPipeline()
    return _pipeline


class InternalGenerateRequest(BaseModel):
    session_id: str | None = None
    user_id: str
    persona_id: str | None = None
    message: str


@router.post("/generate")
async def internal_generate(
    body: InternalGenerateRequest,
    db: AsyncSession = Depends(get_db),
):
    response = await _get_pipeline().run(
        db=db,
        user_id=uuid.UUID(body.user_id),
        session_id=uuid.UUID(body.session_id) if body.session_id else None,
        user_message=body.message,
        persona_id=uuid.UUID(body.persona_id) if body.persona_id else None,
        stream=False,
    )
    await db.commit()
    return {"response": response}
