import uuid

from pydantic import BaseModel, Field


class AccessUpdate(BaseModel):
    user_ids: list[uuid.UUID]


class DomainTagItem(BaseModel):
    tag_name: str = Field(..., max_length=100)
    tag_type: str = Field("domain", pattern="^(domain|sdlc|project_type)$")


class DomainTagsUpdate(BaseModel):
    tags: list[DomainTagItem]


class KnowledgeCollectionsUpdate(BaseModel):
    collection_ids: list[uuid.UUID] = Field(default_factory=list)