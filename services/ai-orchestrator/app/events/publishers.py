import json
import uuid
from datetime import datetime, timezone


async def publish_event(event_type: str, payload: dict) -> None:
    try:
        import logging
        from config.settings import get_settings
        import aio_pika

        for _log in ("aio_pika", "aiormq", "aiormq.connection"):
            logging.getLogger(_log).setLevel(logging.CRITICAL)
        settings = get_settings()
        connection = await aio_pika.connect(settings.rabbitmq_url, timeout=3)
        async with connection:
            channel = await connection.channel()
            exchange = await channel.declare_exchange("ai_pmo_events", aio_pika.ExchangeType.TOPIC, durable=True)
            message_body = json.dumps({
                "event_type": event_type,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "source_service": "ai-orchestrator",
                "payload": payload,
                "metadata": {"correlation_id": str(uuid.uuid4())},
            })
            await exchange.publish(
                aio_pika.Message(body=message_body.encode()),
                routing_key=event_type,
            )
    except Exception:
        pass  # RabbitMQ unavailable — fire-and-forget, not critical
