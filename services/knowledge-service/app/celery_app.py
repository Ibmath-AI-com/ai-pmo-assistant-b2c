import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "shared"))

from celery import Celery
from config.settings import get_settings

settings = get_settings()

celery = Celery(
    "knowledge_worker",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=["app.services.ingestion_service"],
)

celery.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
)
