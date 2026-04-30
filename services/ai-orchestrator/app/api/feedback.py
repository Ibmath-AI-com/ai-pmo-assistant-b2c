from uuid import UUID

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel, Field
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from auth.dependencies import CurrentUser, get_current_user
from db.base import get_db
from db.models.ai import OutputFeedback

router = APIRouter()


class FeedbackCreate(BaseModel):
    output_id: UUID
    rating: int = Field(..., ge=1, le=5)
    feedback_text: str | None = None


@router.post("", status_code=status.HTTP_201_CREATED)
async def submit_feedback(
    body: FeedbackCreate,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    import uuid as _uuid
    feedback = OutputFeedback(
        feedback_id=_uuid.uuid4(),
        output_id=body.output_id,
        user_id=current_user.user_id,
        rating=body.rating,
        feedback_text=body.feedback_text,
    )
    db.add(feedback)
    await db.commit()
    return {
        "feedback_id": str(feedback.feedback_id),
        "output_id": str(feedback.output_id),
        "rating": feedback.rating,
    }


@router.get("/stats")
async def feedback_stats(
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(
        func.count(OutputFeedback.feedback_id).label("total"),
        func.avg(OutputFeedback.rating).label("avg_rating"),
    ).where(OutputFeedback.user_id == current_user.user_id)
    result = await db.execute(stmt)
    row = result.one()
    return {
        "total_feedback": row.total,
        "average_rating": round(float(row.avg_rating), 2) if row.avg_rating else None,
    }
