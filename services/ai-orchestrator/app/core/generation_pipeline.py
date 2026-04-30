from __future__ import annotations

import time
import uuid
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from db.models.ai import AIRun, GeneratedOutput
from db.models.chat import ChatMessage
from db.models.persona import Persona, PersonaBehaviorSetting, PersonaModelPolicy

from app.core.llm_router import LLMRouter
from app.core.rag_pipeline import RAGPipeline
from app.core.prompt_manager import PromptManager, PersonaConfig
from app.core.context_manager import ContextManager
from app.core.guardrails import Guardrails
from app.skills.engine import SkillEngine


class GenerationPipeline:
    def __init__(self):
        self._router = LLMRouter()
        self._rag = RAGPipeline()
        self._prompt_manager = PromptManager()
        self._context_manager = ContextManager()
        self._guardrails = Guardrails()
        self._skill_engine = SkillEngine()

    async def run(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
        session_id: uuid.UUID | None,
        user_message: str,
        persona_id: uuid.UUID | None = None,
        stream: bool = False,
    ) -> str | AsyncGenerator[str, None]:
        start = time.monotonic()

        # 1. Load persona config
        persona_config = None
        chat_mode = None
        if persona_id:
            persona_config, chat_mode = await self._load_persona(db, persona_id)

        # 2. Build chat history
        history = []
        if session_id:
            history = await self._context_manager.build_context(db, session_id)

        # 3. Pre-processing skills
        context = {"query": user_message, "persona_id": str(persona_id) if persona_id else None}
        ai_run_id = uuid.uuid4()
        if persona_id:
            context = await self._skill_engine.execute_pre_processing(
                db, persona_id, context, ai_run_id, user_id
            )

        # 4. RAG retrieval
        rag_chunks = []
        rag_context = None
        if chat_mode in (None, "rag_internal_llm", "rag_external_openai", "rag_external_anthropic") or \
           chat_mode and "rag" in chat_mode:
            rag_chunks = await self._rag.retrieve(
                query=user_message,
                persona_id=str(persona_id) if persona_id else None,
                filters=context.get("rag_filters"),
                top_k=5,
            )
            if rag_chunks:
                rag_context = self._rag.format_context(rag_chunks)

        # 5. Compose prompt
        skill_instruction = context.get("skill_instructions")
        if skill_instruction and persona_config:
            existing = persona_config.system_instruction or ""
            persona_config.system_instruction = existing + f"\n\n{skill_instruction}"

        messages = self._prompt_manager.compose(
            persona=persona_config,
            user_message=user_message,
            rag_context=rag_context,
            chat_history=history,
        )

        # 6. Guardrails input check
        guard_result = self._guardrails.check_input(user_message)
        if not guard_result.passed:
            response_text = "I'm unable to process this request due to content policy restrictions."
            await self._save_ai_run(
                db, ai_run_id, user_id, session_id, persona_id,
                "blocked", "blocked", 0, 0, 0, int((time.monotonic() - start) * 1000),
                rag_used=False, status="blocked"
            )
            await db.commit()
            return response_text

        # 7. Route to LLM
        decision = self._router.route(chat_mode=chat_mode)

        # 8. Generate
        if stream:
            return self._stream_and_save(
                db, ai_run_id, user_id, session_id, persona_id,
                decision, messages, rag_chunks, start
            )

        response_text = await decision.provider_instance.generate(
            messages=messages,
            model=decision.model,
            temperature=0.7,
            max_tokens=2048,
            stream=False,
        )

        # 9. Guardrails output check
        out_guard = self._guardrails.check_output(response_text)

        # 10. Post-processing skills
        response_context = {"response": response_text}
        if persona_id:
            response_context = await self._skill_engine.execute_post_processing(
                db, persona_id, response_context, ai_run_id, user_id
            )
        response_text = response_context.get("response", response_text)

        # 11. Save AI run
        elapsed = int((time.monotonic() - start) * 1000)
        await self._save_ai_run(
            db, ai_run_id, user_id, session_id, persona_id,
            decision.model, decision.provider,
            0, 0, 0, elapsed,
            rag_used=len(rag_chunks) > 0,
        )

        # 12. Save generated output
        output = GeneratedOutput(
            output_id=uuid.uuid4(),
            ai_run_id=ai_run_id,
            output_type="text",
            content=response_text,
            format="markdown",
        )
        db.add(output)
        await db.flush()

        return response_text

    async def _stream_and_save(
        self, db, ai_run_id, user_id, session_id, persona_id,
        decision, messages, rag_chunks, start
    ) -> AsyncGenerator[str, None]:
        async def _gen():
            chunks = []
            gen = await decision.provider_instance.generate(
                messages=messages, model=decision.model, stream=True
            )
            async for chunk in gen:
                chunks.append(chunk)
                yield chunk

            full_text = "".join(chunks)
            elapsed = int((time.monotonic() - start) * 1000)
            await self._save_ai_run(
                db, ai_run_id, user_id, session_id, persona_id,
                decision.model, decision.provider, 0, 0, 0, elapsed,
                rag_used=len(rag_chunks) > 0,
            )
            output = GeneratedOutput(
                output_id=uuid.uuid4(), ai_run_id=ai_run_id,
                output_type="text", content=full_text, format="markdown",
            )
            db.add(output)
            await db.commit()
        return _gen()

    async def _save_ai_run(
        self, db, ai_run_id, user_id, session_id, persona_id,
        model, provider, prompt_tokens, completion_tokens, total_tokens, latency_ms,
        rag_used=False, status="completed"
    ):
        run = AIRun(
            ai_run_id=ai_run_id,
            session_id=session_id,
            user_id=user_id,
            persona_id=persona_id,
            model_used=model,
            provider=provider,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            total_tokens=total_tokens,
            latency_ms=latency_ms,
            rag_used=rag_used,
            status=status,
        )
        db.add(run)
        await db.flush()

    async def _load_persona(
        self, db: AsyncSession, persona_id: uuid.UUID
    ) -> tuple[PersonaConfig | None, str | None]:
        stmt = (
            select(Persona)
            .where(Persona.persona_id == persona_id)
            .options(
                selectinload(Persona.behavior_setting),
                selectinload(Persona.model_policy),
            )
        )
        result = await db.execute(stmt)
        persona = result.scalar_one_or_none()
        if not persona:
            return None, None

        behavior = persona.behavior_setting
        policy = persona.model_policy

        config = PersonaConfig(
            persona_name=persona.persona_name,
            persona_category=persona.persona_category,
            system_instruction=behavior.system_instruction if behavior else None,
            tone=behavior.tone_of_voice if behavior else None,
            response_format=behavior.response_format_preference if behavior else None,
            max_response_length=(behavior.max_response_length if behavior else 2048) or 2048,
        )
        chat_mode = policy.chat_mode if policy else "rag_external_anthropic"
        return config, chat_mode
