from uuid import UUID

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from auth.dependencies import CurrentUser, get_current_user
from db.base import get_db
from db.models.knowledge import KnowledgeDocumentTag
from app.services.document_service import get_document

router = APIRouter()


class TagIn(BaseModel):
    tag_name: str
    tag_type: str


class TagResponse(BaseModel):
    knowledge_document_tag_id: UUID
    knowledge_document_id: UUID
    tag_name: str
    tag_type: str
    status: str

    model_config = {"from_attributes": True}


@router.put("/{document_id}/tags", response_model=list[TagResponse], status_code=status.HTTP_200_OK)
async def replace_tags(
    document_id: UUID,
    body: list[TagIn],
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    # Verify document exists and belongs to org
    await get_document(db, document_id, current_user.user_id)

    # Delete all existing tags for this document
    await db.execute(
        delete(KnowledgeDocumentTag).where(
            KnowledgeDocumentTag.knowledge_document_id == document_id
        )
    )

    # Insert new tags
    new_tags = [
        KnowledgeDocumentTag(
            knowledge_document_id=document_id,
            tag_name=tag.tag_name,
            tag_type=tag.tag_type,
            status="active",
        )
        for tag in body
    ]
    db.add_all(new_tags)
    await db.flush()

    result = await db.execute(
        select(KnowledgeDocumentTag).where(
            KnowledgeDocumentTag.knowledge_document_id == document_id
        )
    )
    return list(result.scalars().all())
