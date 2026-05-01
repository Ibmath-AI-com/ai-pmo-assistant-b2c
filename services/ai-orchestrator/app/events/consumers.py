"""
RabbitMQ consumer for ai-orchestrator.
Optional — chat works via direct HTTP even when RabbitMQ is unavailable.
"""
from __future__ import annotations

import asyncio
import json
import uuid
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[3] / "shared"))


async def start_consumer():
    try:
        import aio_pika
        from config.settings import get_settings
        from db.base import async_session_factory
        from app.core.generation_pipeline import GenerationPipeline
        from app.events.publishers import publish_event
        from app.websocket.notifier import notify_session

        settings = get_settings()
        pipeline = GenerationPipeline()

        # Try to connect once — fail fast if RabbitMQ is unavailable
        # Silence aio_pika's internal logger so it doesn't print the connection error
        import logging
        for _log in ("aio_pika", "aiormq", "aiormq.connection"):
            logging.getLogger(_log).setLevel(logging.CRITICAL)
        try:
            connection = await asyncio.wait_for(
                aio_pika.connect(settings.rabbitmq_url),
                timeout=5.0,
            )
        except (OSError, asyncio.TimeoutError, Exception):
            print("[ai-orchestrator] RabbitMQ unavailable — event consumer disabled. Chat works via direct HTTP.")
            return

        channel = await connection.channel()
        exchange = await channel.declare_exchange("ai_pmo_events", aio_pika.ExchangeType.TOPIC, durable=True)
        queue = await channel.declare_queue("ai_orchestrator_queue", durable=True)
        await queue.bind(exchange, routing_key="chat.message.created")

        print("[ai-orchestrator] RabbitMQ consumer started.")

        async with queue.iterator() as q:
            async for message in q:
                async with message.process():
                    try:
                        event = json.loads(message.body)
                        payload = event.get("payload", {})
                        session_id = payload.get("session_id")
                        user_id_str = payload.get("user_id")
                        persona_id_str = payload.get("persona_id")
                        content = payload.get("content", "")

                        if not content or not user_id_str:
                            continue

                        async with async_session_factory() as db:
                            response = await pipeline.run(
                                db=db,
                                user_id=uuid.UUID(user_id_str),
                                session_id=uuid.UUID(session_id) if session_id else None,
                                user_message=content,
                                persona_id=uuid.UUID(persona_id_str) if persona_id_str else None,
                                stream=False,
                            )
                            await db.commit()

                        if session_id:
                            await notify_session(session_id, {
                                "type": "ai_response",
                                "content": response,
                                "session_id": session_id,
                            })

                        await publish_event("ai.run.completed", {
                            "session_id": session_id,
                            "response": response,
                        })
                    except Exception as e:
                        print(f"[ai-orchestrator] Consumer error: {e}")
    except asyncio.CancelledError:
        pass
    except Exception as e:
        print(f"[ai-orchestrator] Consumer startup error: {e}")
