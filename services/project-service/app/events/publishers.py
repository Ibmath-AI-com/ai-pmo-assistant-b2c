import logging

log = logging.getLogger(__name__)


async def publish_event(event_type: str, payload: dict) -> None:
    try:
        from events.publisher import EventPublisher
        async with EventPublisher("project-service") as pub:
            await pub.publish(event_type, payload)
    except Exception as exc:
        log.debug("Event publish skipped: %s", exc)
