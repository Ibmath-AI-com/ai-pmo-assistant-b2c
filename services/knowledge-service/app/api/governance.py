from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from auth.dependencies import CurrentUser, get_current_user
from db.base import get_db
from db.models.knowledge import KnowledgeDocumentGovernance
from app.services.document_service import get_document

router = APIRouter()


class GovernanceUpsert(BaseModel):
    classification_level: str
    document_owner: str | None = None
    effective_date: date | None = None
    review_date: date | None = None
    expiry_date: date | None = None
    review_status: str | None = None
    allow_external_llm_usage: bool = False
    llm_model_id: UUID | None = None


class GovernanceResponse(BaseModel):
    knowledge_document_governance_id: UUID
    knowledge_document_id: UUID
    classification_level: str | None
    document_owner: str | None
    effective_date: date | None
    review_date: date | None
    expiry_date: date | None
    review_status: str | None
    allow_external_llm_usage: bool
    llm_model_id: UUID | None

    model_config = {"from_attributes": True}


@router.put("/{document_id}/governance", response_model=GovernanceResponse, status_code=status.HTTP_200_OK)
async def upsert_governance(
    document_id: UUID,
    body: GovernanceUpsert,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    # Verify document exists and belongs to org
    await get_document(db, document_id, current_user.user_id)

    result = await db.execute(
        select(KnowledgeDocumentGovernance).where(
            KnowledgeDocumentGovernance.knowledge_document_id == document_id
        )
    )
    governance = result.scalar_one_or_none()

    if governance:
        for key, value in body.model_dump(exclude_none=True).items():
            setattr(governance, key, value)
    else:
        governance = KnowledgeDocumentGovernance(
            knowledge_document_id=document_id,
            **body.model_dump(),
        )
        db.add(governance)

    await db.flush()
    await db.refresh(governance)
    return governance
