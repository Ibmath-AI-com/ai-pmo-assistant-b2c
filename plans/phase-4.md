# Phase 4: AI Orchestrator & Chat Service (MVP)

## Task 1: Create database models for chat & AI domain

Create SQLAlchemy models in `services/shared/db/models/`:
- `chat.py` — chat_session, chat_message, chat_attachment tables
- `ai.py` — ai_run, ai_run_retrieval_source, generated_output, output_feedback tables
- `prompt.py` — prompt_library, prompt_persona_mapping tables
- `skill.py` — skill, skill_persona_mapping, skill_execution_log, skill_version tables

**Verify:** All models import cleanly

---

## Task 2: Generate Alembic migration

Run: `alembic revision --autogenerate -m "004_chat_ai_skill_tables"`
Run: `alembic upgrade head`

**Verify:** All chat, AI, prompt, and skill tables exist in database

---

## Task 3: Create chat-service FastAPI skeleton

Create `services/chat-service/app/main.py`:
- FastAPI app with WebSocket support
- Health check endpoint
- Register HTTP and WebSocket routers

Create Dockerfile + requirements.txt

**Verify:** Service starts on port 8003

---

## Task 4: Implement chat session endpoints

Create `services/chat-service/app/api/sessions.py`:
- `POST /api/v1/chat/sessions` — create session (with persona_id, optional workspace_id)
- `GET /api/v1/chat/sessions` — list user sessions (recent first)
- `GET /api/v1/chat/sessions/{id}` — get session with message history
- `PUT /api/v1/chat/sessions/{id}` — update title, status
- `DELETE /api/v1/chat/sessions/{id}` — archive session

**Verify:** Create session → get with messages → list → archive

---

## Task 5: Implement chat message endpoints (HTTP fallback)

Create `services/chat-service/app/api/messages.py`:
- `POST /api/v1/chat/sessions/{id}/messages` — send message (non-streaming)
- `GET /api/v1/chat/sessions/{id}/messages` — paginated message history

Create `services/chat-service/app/api/attachments.py`:
- `POST /api/v1/chat/attachments` — upload chat attachment
- `GET /api/v1/chat/sessions/{id}/attachments` — list attachments

**Verify:** Send message → get history → upload attachment

---

## Task 6: Implement WebSocket chat handler

Create `services/chat-service/app/websocket/connection_manager.py`:
- `ConnectionManager` class managing active WebSocket connections
- Per-session connection tracking
- Redis PubSub for cross-instance message delivery

Create `services/chat-service/app/websocket/chat_handler.py`:
- `WS /api/v1/ws/chat/{session_id}` — WebSocket endpoint
- Authenticate via token query param
- Receive user messages → publish to RabbitMQ (`chat.message.created`)
- Listen for AI responses (`ai.run.completed`) → stream to client
- Handle connection lifecycle (open, close, error)

**Verify:** Connect via WebSocket → send message → receive echo back

---

## Task 7: Create ai-orchestrator FastAPI skeleton

Create `services/ai-orchestrator/app/main.py`
Create Dockerfile + requirements.txt (include `langchain`, `openai`, `anthropic`)

**Verify:** Service starts on port 8004

---

## Task 8: Implement LLM provider adapters

Create `services/ai-orchestrator/app/providers/base.py`:
- `BaseLLMProvider` abstract class
- `generate(messages, model, temperature, max_tokens, stream)` → response or async generator
- `count_tokens(text, model)` → int

Create `services/ai-orchestrator/app/providers/openai_provider.py`:
- Wraps OpenAI API (gpt-4o, gpt-4o-mini)
- Supports streaming via async generator

Create `services/ai-orchestrator/app/providers/anthropic_provider.py`:
- Wraps Anthropic API (claude-sonnet-4, claude-opus-4)
- Supports streaming

Create `services/ai-orchestrator/app/providers/internal_provider.py`:
- Wraps vLLM/Ollama (OpenAI-compatible API)
- Points to INTERNAL_LLM_URL

**Verify:** Call each provider with a simple prompt → get response

---

## Task 9: Implement LLM Router

Create `services/ai-orchestrator/app/core/llm_router.py`:
- `LLMRouter` class
- `route(persona_model_policy, query_classification, data_classification)` → provider + model
- Implements all 7 routing modes from persona_model_policy.chat_mode
- Fallback logic: internal → external on failure
- Token budget enforcement from subscription limits
- Cost tracking per request

**Verify:** Test each of the 7 modes with mock policies → correct provider selected

---

## Task 10: Implement RAG pipeline

Create `services/ai-orchestrator/app/core/rag_pipeline.py`:
- `RAGPipeline` class
- `retrieve(query, persona_id, filters)` → ranked chunks
- Calls knowledge-service search endpoint
- Applies metadata filters from persona config (SDLC, domain, classification)
- Re-ranks by persona relevance weight
- Deduplicates overlapping chunks
- Tracks sources in ai_run_retrieval_source

**Verify:** Query with persona filters → get relevant chunks from knowledge-service

---

## Task 11: Implement Prompt Manager

Create `services/ai-orchestrator/app/core/prompt_manager.py`:
- `PromptManager` class
- `compose(persona, user_message, rag_context, skill_context, chat_history)` → final prompt
- Loads system instruction from persona_behavior_setting
- Injects RAG context with source citations
- Applies tone and format preferences
- Manages conversation history within token limits
- Supports ready prompts from prompt_library

**Verify:** Compose prompt with persona + RAG context → validate structure

---

## Task 12: Implement Skills Engine

Create `services/ai-orchestrator/app/skills/engine.py`:
- `SkillEngine` class orchestrating skill execution
- `execute_pre_processing(persona_id, context)` — run rag_filter and domain_expert skills
- `execute_post_processing(persona_id, response)` — run output_validator and formatter skills

Create `services/ai-orchestrator/app/skills/registry.py`:
- Load skills mapped to persona from skill_persona_mapping
- Separate into pre-processing and post-processing by skill_type

Create `services/ai-orchestrator/app/skills/executor.py`:
- Execute individual skill, log to skill_execution_log
- Track quality_score and execution_time_ms

**Verify:** Map a skill to persona → execute → verify logged

---

## Task 13: Implement built-in skills

Create `services/ai-orchestrator/app/skills/builtin/`:
- `pmo_analysis.py` — project health scoring, milestone tracking
- `risk_assessment.py` — risk identification, RAID log generation
- `report_generator.py` — template-driven status report generation
- `strategy_evaluator.py` — balanced scorecard, KPI assessment
- `template_filler.py` — intelligent template population with gap detection
- `data_extractor.py` — extract structured data from unstructured text

Seed skill records in database with skill_config_json.

**Verify:** Each skill executes with sample input → produces expected output

---

## Task 14: Implement Guardrails

Create `services/ai-orchestrator/app/core/guardrails.py`:
- `Guardrails` class
- `check_input(message, classification_limit)` — PII detection, classification enforcement
- `check_output(response, rag_sources, hallucination_guard)` — hallucination detection by comparing output against sources
- `validate_structure(response, expected_schema)` — output schema validation

**Verify:** Pass hallucinated content → guardrails flag it

---

## Task 15: Implement Context Manager

Create `services/ai-orchestrator/app/core/context_manager.py`:
- `ContextManager` class
- `build_context(session_id, max_tokens)` — load chat history within token limits
- `summarize_history(messages)` — compress old messages to save tokens
- `get_relevant_context(session_id, current_message)` — smart context selection

**Verify:** Long conversation → context fits within limits → old messages summarized

---

## Task 16: Wire the full AI generation pipeline

Create `services/ai-orchestrator/app/core/generation_pipeline.py`:
- `GenerationPipeline` class orchestrating everything:
  1. Load persona config (behavior, model policy, skills)
  2. Build context from chat history
  3. Run pre-processing skills (rag_filter, domain_expert)
  4. Execute RAG pipeline with filtered retrieval
  5. Compose prompt (system + RAG + history + user message)
  6. Run guardrails input check
  7. Route to LLM via LLM Router
  8. Run guardrails output check
  9. Run post-processing skills (validator, formatter)
  10. Save ai_run record with token counts and sources
  11. Return response (or stream)

**Verify:** Send message through full pipeline → get AI response with sources

---

## Task 17: Implement event-driven message flow

Wire chat-service ↔ ai-orchestrator via RabbitMQ:
- chat-service publishes `chat.message.created` when user sends message
- ai-orchestrator consumes `chat.message.created` → runs generation pipeline
- ai-orchestrator publishes `ai.run.completed` with response chunks
- chat-service consumes `ai.run.completed` → streams to user via WebSocket

**Verify:** Send message via WebSocket → AI response streams back

---

## Task 18: Implement prompt library endpoints

Create `services/ai-orchestrator/app/api/prompts.py`:
- `GET /api/v1/prompts` — list prompt library
- `POST /api/v1/prompts` — create prompt
- `PUT /api/v1/prompts/{id}` — update prompt
- `GET /api/v1/prompts/ready` — get ready prompts for current persona

Create `services/ai-orchestrator/app/api/feedback.py`:
- `POST /api/v1/ai/feedback` — submit output feedback (rating + text)
- `GET /api/v1/ai/feedback/stats` — feedback analytics per persona/skill

Seed ready prompts: "Create Project Charter", "Update RAID Log", "Generate Project Status Report"

**Verify:** List ready prompts → execute one → submit feedback

---

## Task 19: Add gateway routes

Update gateway:
- Route `/api/v1/chat/*` → chat-service:8003
- Route `/api/v1/ws/chat/*` → chat-service:8003 (WebSocket upgrade)
- Route `/api/v1/ai/*` → ai-orchestrator:8004
- Route `/api/v1/prompts/*` → ai-orchestrator:8004

**Verify:** Full flow works through gateway

---

## Task 20: Build frontend — Chat home page

Create `src/routes/home/HomePage.tsx`:
- Match PDF mockup page 2 layout (3-column)
- Left sidebar: Personas list (+), Ready Prompts, Recent Chats
- Center: Chat window with message history
- Right sidebar: Knowledge Hub (Top Used Sources), Chat Mode

Create chat components:
- `src/components/chat/ChatWindow.tsx` — message list + input
- `src/components/chat/MessageBubble.tsx` — user and AI message bubbles
- `src/components/chat/ChatInput.tsx` — text input + file upload button + send
- `src/components/chat/StreamingMessage.tsx` — token-by-token streaming display
- `src/components/chat/ReportCard.tsx` — rich report display (donut chart, risks, milestones)
- `src/components/chat/FileUploadMenu.tsx` — "Add files" + "Select from Drive" dropdown

Create `src/lib/hooks/useChat.ts` — WebSocket hook for streaming

**Verify:** `npm run build` passes, chat UI renders, WebSocket connects

---

## Task 21: Build frontend — Persona switching & ready prompts

Add to HomePage:
- Switch Persona dropdown at top of chat area
- Ready prompts section in sidebar — click to auto-send prompt
- Recent chats list — click to load session
- Chat title editing

**Verify:** Switch persona → new session → use ready prompt → response streams

---

## Task 22: Link frontend UI with chat & AI API calls

Connect all chat pages to real API endpoints:
- `src/lib/api/chat.ts` — sessions, messages API calls
- `src/lib/hooks/useChat.ts` — WebSocket hook connecting to `ws://localhost:8003/api/v1/ws/chat/{id}?token=...`
- Wire `HomePage.tsx` chat window to real WebSocket — send messages, stream AI responses
- Wire left sidebar "Recent Chats" to `GET /api/v1/chat/sessions`
- Wire persona selector in SubHeader to load from persona-service
- Wire ready prompts in left sidebar to `GET /api/v1/prompts`
- Handle connection errors, reconnection logic
- Handle auth errors (401 → redirect to login)

**Verify:** Login → select persona → send message → see streaming AI response → session saved in sidebar

---

## Task 24: Write chat & AI tests

Create tests:
- `services/chat-service/tests/test_sessions.py` — session CRUD
- `services/chat-service/tests/test_websocket.py` — WebSocket connect/send/receive
- `services/ai-orchestrator/tests/test_llm_router.py` — all 7 routing modes
- `services/ai-orchestrator/tests/test_rag_pipeline.py` — retrieval with filters
- `services/ai-orchestrator/tests/test_skills.py` — skill execution
- `services/ai-orchestrator/tests/test_guardrails.py` — hallucination detection
- `services/ai-orchestrator/tests/test_generation.py` — full pipeline

**Verify:** `pytest services/chat-service/tests/ services/ai-orchestrator/tests/ -v` — all pass

---

## Phase 4 Complete — THIS IS MVP

1. Full chat with AI personas working end-to-end
2. WebSocket streaming responses
3. 7-mode LLM routing operational
4. RAG retrieval with metadata filtering
5. Skills engine executing built-in skills
6. Guardrails detecting hallucinations
7. Ready prompts functional
8. Output feedback collection
9. Update PROGRESS.md — mark MVP achieved
10. Git commit: `git add -A && git commit -m "Phase 4: AI engine & chat — MVP complete"`
