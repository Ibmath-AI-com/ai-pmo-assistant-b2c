"""
Thin wrappers around EventPublisher for knowledge-service events.
All functions are fire-and-forget: exceptions are swallowed so a
RabbitMQ outage never breaks an API response.
"""
from uuid import UUID


async def _publish(event_type: str, payload: dict) -> None:
    try:
        from events.publisher import EventPublisher
        async with EventPublisher("knowledge-service") as pub:
            await pub.publish(event_type, payload)
    except Exception:
        pass


async def publish_collection_created(collection_id: UUID, organization_id: UUID | None) -> None:
    await _publish(
        "knowledge.collection.created",
        {
            "knowledge_collection_id": str(collection_id),
            "organization_id": str(organization_id) if organization_id else None,
        },
    )


async def publish_document_uploaded(document_id: UUID, collection_id: UUID) -> None:
    await _publish(
        "knowledge.document.uploaded",
        {
            "knowledge_document_id": str(document_id),
            "knowledge_collection_id": str(collection_id),
        },
    )


async def publish_document_updated(document_id: UUID) -> None:
    await _publish(
        "knowledge.document.updated",
        {"knowledge_document_id": str(document_id)},
    )


async def publish_document_deleted(document_id: UUID) -> None:
    await _publish(
        "knowledge.document.deleted",
        {"knowledge_document_id": str(document_id)},
    )
