"""
Event publishing helpers for persona-service.

Usage:
    from app.events.publishers import publish_event
    await publish_event("workspace.created", {"workspace_id": str(ws.workspace_id)})

The publisher connects lazily per-call so it works without a persistent connection.
Errors are caught and logged — event failures must not break the HTTP response.
"""

import logging

from events.publisher import EventPublisher

logger = logging.getLogger(__name__)

_SOURCE = "persona-service"


async def publish_event(event_type: str, payload: dict) -> None:
    try:
        async with EventPublisher(_SOURCE) as pub:
            await pub.publish(event_type, payload)
    except Exception as exc:
        logger.warning("Failed to publish event %s: %s", event_type, exc)
