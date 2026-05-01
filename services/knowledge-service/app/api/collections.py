from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from auth.dependencies import CurrentUser, get_current_user
from db.base import get_db
from app.services.document_service import (
    create_collection,
    get_collection,
    get_collection_document_count,
    list_collections,
    update_collection,
)
from app.events.publishers import publish_collection_created

router = APIRouter()


class CollectionCreate(BaseModel):
    collection_code: str
    collection_name: str
    description: str | None = None
    status: str = "active"


class CollectionUpdate(BaseModel):
    collection_name: str | None = None
    description: str | None = None
    status: str | None = None


class CollectionResponse(BaseModel):
    knowledge_collection_id: UUID
    user_id: UUID | None
    collection_code: str
    collection_name: str
    description: str | None
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CollectionDetailResponse(CollectionResponse):
    document_count: int = 0


@router.post("", response_model=CollectionResponse, status_code=status.HTTP_201_CREATED)
async def create(
    body: CollectionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    data = body.model_dump()
    data["user_id"] = current_user.user_id
    data["created_by"] = current_user.user_id
    data["updated_by"] = current_user.user_id
    collection = await create_collection(db, data)
    await publish_collection_created(collection.knowledge_collection_id, collection.user_id)
    return collection


@router.get("", response_model=list[CollectionResponse])
async def list_all(
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    return await list_collections(db, current_user.user_id)


@router.get("/{collection_id}", response_model=CollectionDetailResponse)
async def get_one(
    collection_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    collection = await get_collection(db, collection_id, current_user.user_id)
    doc_count = await get_collection_document_count(db, collection_id)
    response = CollectionDetailResponse.model_validate(collection)
    response.document_count = doc_count
    return response


@router.put("/{collection_id}", response_model=CollectionResponse)
async def update(
    collection_id: UUID,
    body: CollectionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    data = body.model_dump(exclude_none=True)
    data["updated_by"] = current_user.user_id
    return await update_collection(db, collection_id, current_user.user_id, data)
