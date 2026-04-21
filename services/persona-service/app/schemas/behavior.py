from pydantic import BaseModel, Field


class BehaviorUpdate(BaseModel):
    system_instruction: str | None = None
    tone_of_voice: str | None = Field(None, pattern="^(Executive|Analytical|Advisory|Formal)$")
    response_format_preference: str | None = Field(None, pattern="^(Structured Report|Bullet Points|Narrative)$")
    default_language: str = Field("en", max_length=10)
    temperature: float = Field(0.7, ge=0.0, le=2.0)
    max_response_length: int = Field(2048, ge=1)