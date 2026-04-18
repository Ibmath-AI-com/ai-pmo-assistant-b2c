import uuid

from pydantic import BaseModel, Field


class SkillMappingCreate(BaseModel):
    skill_id: uuid.UUID
    priority_order: int = 1
    is_auto_trigger: bool = False
    trigger_condition: dict | None = None
