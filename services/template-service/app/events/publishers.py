import logging

from events.publisher import EventPublisher

logger = logging.getLogger(__name__)

_SOURCE = "template-service"


async def publish_event(event_type: str, payload: dict) -> None:
    try:
        async with EventPublisher(_SOURCE) as pub:
            await pub.publish(event_type, payload)
    except Exception as exc:
        logger.warning("Failed to publish event %s: %s", event_type, exc)
