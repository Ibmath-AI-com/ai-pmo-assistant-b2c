"""
Event consumers for knowledge-service.

Handlers receive a parsed payload dict and an open AsyncSession.
Callers are responsible for committing after success.
"""
import logging
from uuid import UUID

from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession

from db.models.knowledge import KnowledgeDocument

log = logging.getLogger(__name__)


async def handle_user_deleted(payload: dict, db: AsyncSession) -> None:
    """Soft-delete all documents owned by the deleted user."""
    user_id_str = payload.get("user_id")
    if not user_id_str:
        log.warning("user.deleted event missing user_id field")
        return
    try:
        user_id = UUID(user_id_str)
    except ValueError:
        log.warning("user.deleted event has invalid user_id: %s", user_id_str)
        return

    result = await db.execute(
        update(KnowledgeDocument)
        .where(KnowledgeDocument.owner_user_id == user_id)
        .where(KnowledgeDocument.status != "deleted")
        .values(status="deleted")
    )
    await db.commit()
    log.info(
        "Soft-deleted %d document(s) for deleted user %s",
        result.rowcount,
        user_id,
    )


async def handle_persona_updated(payload: dict) -> None:
    """No-op — placeholder for future persona→document re-indexing logic."""
    persona_id = payload.get("persona_id")
    log.debug("Received persona.updated for persona_id=%s — no action taken", persona_id)
