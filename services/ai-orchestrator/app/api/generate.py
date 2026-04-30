from uuid import UUID

from fastapi import APIRouter, Depends, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from auth.dependencies import CurrentUser, get_current_user
from db.base import get_db
from app.core.generation_pipeline import GenerationPipeline

router = APIRouter()
_pipeline = GenerationPipeline()


class GenerateRequest(BaseModel):
    session_id: UUID | None = None
    persona_id: UUID | None = None
    message: str
    stream: bool = False


@router.post("/generate")
async def generate(
    body: GenerateRequest,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if body.stream:
        gen = await _pipeline.run(
            db=db,
            user_id=current_user.user_id,
            session_id=body.session_id,
            user_message=body.message,
            persona_id=body.persona_id,
            stream=True,
        )
        return StreamingResponse(gen, media_type="text/event-stream")

    response = await _pipeline.run(
        db=db,
        user_id=current_user.user_id,
        session_id=body.session_id,
        user_message=body.message,
        persona_id=body.persona_id,
        stream=False,
    )
    await db.commit()
    return {"response": response}
