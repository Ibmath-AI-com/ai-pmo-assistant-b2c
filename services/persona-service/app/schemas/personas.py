import uuid
from typing import Any

from pydantic import BaseModel, Field


class PersonaCreate(BaseModel):
    persona_code: str = Field(..., max_length=50)
    persona_name: str = Field(..., max_length=255)
    persona_category: str = Field(..., pattern="^(PMO|Strategy|Risk|Portfolio|Custom)$")
    short_description: str | None = None
    avatar_file_id: uuid.UUID | None = None
    is_system_persona: bool = False


class PersonaUpdate(BaseModel):
    persona_name: str | None = Field(None, max_length=255)
    persona_code: str | None = Field(None, max_length=50)
    persona_category: str | None = Field(None, pattern="^(PMO|Strategy|Risk|Portfolio|Custom)$")
    short_description: str | None = None
    avatar_file_id: uuid.UUID | None = None
    is_system_persona: bool | None = None


class StatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(active|inactive)$")


class WorkspaceMappingCreate(BaseModel):
    workspace_id: uuid.UUID
    is_default: bool = False