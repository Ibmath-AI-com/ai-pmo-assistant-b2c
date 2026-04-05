import json
import logging
from collections.abc import Callable, Coroutine
from typing import Any

import aio_pika
from aio_pika.abc import AbstractIncomingMessage

from config.settings import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)

Handler = Callable[[dict], Coroutine[Any, Any, None]]


class EventConsumer:
    def __init__(self, service_name: str):
        self.service_name = service_name
        self._connection: aio_pika.abc.AbstractConnection | None = None
        self._channel: aio_pika.abc.AbstractChannel | None = None
        self._handlers: dict[str, Handler] = {}

    async def connect(self) -> None:
        self._connection = await aio_pika.connect_robust(settings.rabbitmq_url)
        self._channel = await self._connection.channel()
        await self._channel.set_qos(prefetch_count=10)

    async def close(self) -> None:
        if self._connection:
            await self._connection.close()

    def subscribe(self, event_type: str, handler: Handler) -> None:
        self._handlers[event_type] = handler

    async def start(self) -> None:
        if self._channel is None:
            raise RuntimeError("Consumer not connected. Call connect() first.")

        for event_type in self._handlers:
            exchange_name = event_type.split(".")[0]
            exchange = await self._channel.declare_exchange(
                exchange_name,
                aio_pika.ExchangeType.TOPIC,
                durable=True,
            )

            queue_name = f"{self.service_name}.{event_type}"
            queue = await self._channel.declare_queue(queue_name, durable=True)
            await queue.bind(exchange, routing_key=event_type)
            await queue.consume(self._make_handler(event_type))

    def _make_handler(self, event_type: str) -> Callable[[AbstractIncomingMessage], Coroutine[Any, Any, None]]:
        handler = self._handlers[event_type]

        async def on_message(message: AbstractIncomingMessage) -> None:
            async with message.process(requeue=True):
                try:
                    event = json.loads(message.body.decode())
                    await handler(event)
                except Exception:
                    logger.exception("Error handling event %s — nacking", event_type)
                    await message.nack(requeue=False)

        return on_message

    async def __aenter__(self) -> "EventConsumer":
        await self.connect()
        return self

    async def __aexit__(self, *_: object) -> None:
        await self.close()
