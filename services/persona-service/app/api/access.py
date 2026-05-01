import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from auth.dependencies import CurrentUser, get_current_user
from db.base import get_db
from app.services.persona_service import PersonaService
from app.events.publishers import publish_event
from app.schemas.access import DomainTagItem, DomainTagsUpdate, KnowledgeCollectionsUpdate
from app.schemas.errors import RESPONSES_UPDATE

router = APIRouter()
_svc = PersonaService()


@router.put("/{persona_id}/domain-tags", responses=RESPONSES_UPDATE)
async def update_domain_tags(
    persona_id: uuid.UUID,
    body: DomainTagsUpdate,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    persona = await _svc.get(db, persona_id)
    if not persona:
        raise HTTPException(status_code=404, detail="Persona not found")
    tags = await _svc.set_domain_tags(db, persona_id, [t.model_dump() for t in body.tags])
    return [
        {"persona_domain_tag_id": str(t.persona_domain_tag_id), "tag_name": t.tag_name, "tag_type": t.tag_type}
        for t in tags
    ]


@router.put("/{persona_id}/knowledge", responses=RESPONSES_UPDATE)
async def update_knowledge_collections(
    persona_id: uuid.UUID,
    body: KnowledgeCollectionsUpdate,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    persona = await _svc.get(db, persona_id)
    if not persona:
        raise HTTPException(status_code=404, detail="Persona not found")
    rows = await _svc.set_knowledge_collections(db, persona_id, body.collection_ids)
    return [
        {
            "persona_knowledge_collection_id": str(r.persona_knowledge_collection_id),
            "knowledge_collection_id": str(r.knowledge_collection_id),
        }
        for r in rows
    ]
