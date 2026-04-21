from uuid import UUID
from pydantic import BaseModel, Field


class ModelPolicyUpdate(BaseModel):
    default_model_id: UUID | None = None
    chat_mode: str | None = Field(None, max_length=50)
    use_rag: bool = False
    use_internal_llm: bool = True
    use_external_llm: bool = False
    classification_limit: str | None = Field(None, pattern="^(Public|Internal|Confidential|Restricted)$")
    allow_file_upload: bool = True
    allow_external_sources: bool = False


class AllowedModelItem(BaseModel):
    model_id: UUID
    priority_order: int = 1
    is_default: bool = False


class AllowedModelsUpdate(BaseModel):
    models: list[AllowedModelItem] = Field(default_factory=list)