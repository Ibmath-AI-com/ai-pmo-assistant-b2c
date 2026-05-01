from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from auth.dependencies import CurrentUser, get_current_user
from db.base import get_db
from db.models.prompt import PromptLibrary, PromptPersonaMapping

router = APIRouter()


class PromptCreate(BaseModel):
    prompt_name: str = Field(..., max_length=255)
    prompt_text: str
    prompt_category: str | None = None
    is_ready_prompt: bool = False


class PromptUpdate(BaseModel):
    prompt_name: str | None = Field(None, max_length=255)
    prompt_text: str | None = None
    prompt_category: str | None = None
    is_ready_prompt: bool | None = None


def _prompt_out(p) -> dict:
    return {
        "prompt_id": str(p.prompt_id),
        "prompt_name": p.prompt_name,
        "prompt_text": p.prompt_text,
        "prompt_category": p.prompt_category,
        "is_ready_prompt": p.is_ready_prompt,
        "is_system": p.is_system,
        "status": p.status,
        "created_at": p.created_at.isoformat() if p.created_at else None,
    }


@router.get("")
async def list_prompts(
    persona_id: UUID | None = Query(default=None),
    ready_only: bool = Query(default=False),
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(PromptLibrary).where(
        PromptLibrary.status == "active",
        (PromptLibrary.user_id == current_user.user_id) | (PromptLibrary.is_system == True),
    )
    if ready_only:
        stmt = stmt.where(PromptLibrary.is_ready_prompt == True)
    stmt = stmt.order_by(desc(PromptLibrary.created_at))
    result = await db.execute(stmt)
    return [_prompt_out(p) for p in result.scalars().all()]


@router.get("/ready")
async def list_ready_prompts(
    persona_id: UUID | None = Query(default=None),
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(PromptLibrary).where(
        PromptLibrary.status == "active",
        PromptLibrary.is_ready_prompt == True,
        (PromptLibrary.user_id == current_user.user_id) | (PromptLibrary.is_system == True),
    )
    result = await db.execute(stmt)
    return [_prompt_out(p) for p in result.scalars().all()]


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_prompt(
    body: PromptCreate,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    import uuid as _uuid
    prompt = PromptLibrary(
        prompt_id=_uuid.uuid4(),
        user_id=current_user.user_id,
        **body.model_dump(),
    )
    db.add(prompt)
    await db.commit()
    return _prompt_out(prompt)


@router.put("/{prompt_id}")
async def update_prompt(
    prompt_id: UUID,
    body: PromptUpdate,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from fastapi import HTTPException
    stmt = select(PromptLibrary).where(
        PromptLibrary.prompt_id == prompt_id,
        PromptLibrary.user_id == current_user.user_id,
    )
    result = await db.execute(stmt)
    prompt = result.scalar_one_or_none()
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(prompt, k, v)
    await db.commit()
    return _prompt_out(prompt)
