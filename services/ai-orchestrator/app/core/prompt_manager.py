from __future__ import annotations

from dataclasses import dataclass


@dataclass
class PersonaConfig:
    persona_name: str
    persona_category: str
    system_instruction: str | None
    tone: str | None
    response_format: str | None
    max_response_length: int = 2048


class PromptManager:
    SYSTEM_FALLBACK = (
        "You are a helpful AI assistant specializing in project management and strategy. "
        "Provide clear, actionable, and accurate responses."
    )

    def compose(
        self,
        persona: PersonaConfig | None,
        user_message: str,
        rag_context: str | None = None,
        chat_history: list[dict] | None = None,
        max_history_messages: int = 10,
    ) -> list[dict]:
        messages: list[dict] = []

        # System message
        system_parts = []
        if persona and persona.system_instruction:
            system_parts.append(persona.system_instruction)
        else:
            system_parts.append(self.SYSTEM_FALLBACK)

        if persona:
            system_parts.append(f"\nPersona: {persona.persona_name} ({persona.persona_category})")
            if persona.tone:
                system_parts.append(f"Tone: {persona.tone}")
            if persona.response_format:
                system_parts.append(f"Format your response as: {persona.response_format}")

        if rag_context:
            system_parts.append(f"\n{rag_context}\n\nUse the above context to inform your response where relevant.")

        messages.append({"role": "system", "content": "\n".join(system_parts)})

        # Chat history (limited)
        if chat_history:
            for msg in chat_history[-max_history_messages:]:
                if msg.get("role") in ("user", "assistant"):
                    messages.append({"role": msg["role"], "content": msg["content"]})

        # Current user message
        messages.append({"role": "user", "content": user_message})
        return messages
