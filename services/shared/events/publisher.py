import json
import uuid
from datetime import datetime, timezone

import aio_pika
from aio_pika import DeliveryMode, Message

from config.settings import get_settings

settings = get_settings()


class EventPublisher:
    def __init__(self, source_service: str):
        self.source_service = source_service
        self._connection: aio_pika.abc.AbstractConnection | None = None
        self._channel: aio_pika.abc.AbstractChannel | None = None

    async def connect(self) -> None:
        self._connection = await aio_pika.connect_robust(settings.rabbitmq_url)
        self._channel = await self._connection.channel()

    async def close(self) -> None:
        if self._connection:
            await self._connection.close()

    async def publish(
        self,
        event_type: str,
        payload: dict,
        metadata: dict | None = None,
        correlation_id: str | None = None,
    ) -> None:
        if self._channel is None:
            raise RuntimeError("Publisher not connected. Call connect() first.")

        event = {
            "event_type": event_type,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "source_service": self.source_service,
            "payload": payload,
            "metadata": {
                **(metadata or {}),
                "correlation_id": correlation_id or str(uuid.uuid4()),
            },
        }

        # Exchange name derived from domain (e.g. "chat.message.created" → exchange "chat")
        exchange_name = event_type.split(".")[0]
        exchange = await self._channel.declare_exchange(
            exchange_name,
            aio_pika.ExchangeType.TOPIC,
            durable=True,
        )

        message = Message(
            body=json.dumps(event).encode(),
            delivery_mode=DeliveryMode.PERSISTENT,
            content_type="application/json",
            message_id=str(uuid.uuid4()),
        )

        await exchange.publish(message, routing_key=event_type)

    async def __aenter__(self) -> "EventPublisher":
        await self.connect()
        return self

    async def __aexit__(self, *_: object) -> None:
        await self.close()
