import uuid
from decimal import Decimal
from typing import Any

from pydantic import BaseModel, Field

class WorkspaceCreate(BaseModel):
    workspace_name: str = Field(..., max_length=255)
    workspace_code: str | None = Field(None, max_length=50)
    entity_title: str | None = Field(None, max_length=255)
    description: str | None = None
    is_template: bool = False
    metadata_json: dict | None = None
 

class WorkspaceUpdate(BaseModel):
    workspace_name: str | None = Field(None, max_length=255)
    workspace_code: str | None = Field(None, max_length=50)
    entity_title: str | None = Field(None, max_length=255)
    description: str | None = None
    is_template: bool | None = None
    metadata_json: dict | None = None


class StatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(active|inactive)$")


class SettingItem(BaseModel):
    setting_key: str = Field(..., max_length=100)
    setting_value: str | None = None
    value_type: str | None = Field(None, max_length=50)


class SettingsUpdate(BaseModel):
    settings: list[SettingItem]


class DefaultPersonaUpdate(BaseModel):
    persona_id: uuid.UUID | None = None