"""007 Create chat, AI run, prompt, and skill execution tables

Revision ID: a676ace2c1ea
Revises: 006droporg0000
Create Date: 2026-05-01
"""

from alembic import op
import sqlalchemy as sa

revision = "a676ace2c1ea"
down_revision = "006droporg0000"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── skill ─────────────────────────────────────────────────────────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS skill (
            skill_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            skill_code VARCHAR(50) NOT NULL,
            skill_name VARCHAR(255) NOT NULL,
            skill_type VARCHAR(50) NOT NULL,
            description TEXT,
            skill_config_json JSON NOT NULL DEFAULT '{}',
            version_no INTEGER NOT NULL DEFAULT 1,
            is_system BOOLEAN NOT NULL DEFAULT false,
            status VARCHAR(20) NOT NULL DEFAULT 'active',
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            created_by UUID,
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            CONSTRAINT ck_skill_type CHECK (skill_type IN ('prompt_chain','rag_filter','output_validator','formatter','domain_expert','tool_use')),
            CONSTRAINT ck_skill_status CHECK (status IN ('active','inactive'))
        )
    """)

    # ── skill_persona_mapping ─────────────────────────────────────────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS skill_persona_mapping (
            skill_persona_mapping_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            skill_id UUID NOT NULL REFERENCES skill(skill_id),
            persona_id UUID NOT NULL REFERENCES persona(persona_id),
            priority_order INTEGER NOT NULL DEFAULT 1,
            is_auto_trigger BOOLEAN NOT NULL DEFAULT false,
            trigger_condition JSON,
            CONSTRAINT uq_skill_persona_mapping UNIQUE (skill_id, persona_id)
        )
    """)

    # ── project ───────────────────────────────────────────────────────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS project (
            project_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            created_by UUID NOT NULL,
            project_name VARCHAR(256) NOT NULL,
            objective TEXT,
            instructions TEXT,
            status VARCHAR(20) NOT NULL DEFAULT 'active',
            deleted_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
        )
    """)

    # ── project_file ──────────────────────────────────────────────────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS project_file (
            project_file_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            project_id UUID NOT NULL REFERENCES project(project_id) ON DELETE CASCADE,
            file_id UUID NOT NULL REFERENCES file(file_id) ON DELETE CASCADE,
            source VARCHAR(32) NOT NULL DEFAULT 'upload',
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
        )
    """)

    # ── chat_session ──────────────────────────────────────────────────────────
    op.create_table(
        "chat_session",
        sa.Column("chat_session_id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("persona_id", sa.UUID(), nullable=True),
        sa.Column("workspace_id", sa.UUID(), nullable=True),
        sa.Column("title", sa.String(length=500), nullable=True),
        sa.Column("status", sa.String(length=20), server_default="active", nullable=False),
        sa.Column("context_summary", sa.Text(), nullable=True),
        sa.Column("metadata_json", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["user.user_id"]),
        sa.ForeignKeyConstraint(["persona_id"], ["persona.persona_id"]),
        sa.PrimaryKeyConstraint("chat_session_id"),
    )
    op.create_index("ix_chat_session_user_id", "chat_session", ["user_id"])
    op.create_index("ix_chat_session_created_at", "chat_session", ["created_at"])

    # ── chat_message ──────────────────────────────────────────────────────────
    op.create_table(
        "chat_message",
        sa.Column("message_id", sa.UUID(), nullable=False),
        sa.Column("session_id", sa.UUID(), nullable=False),
        sa.Column("role", sa.String(length=20), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("token_count", sa.Integer(), nullable=True),
        sa.Column("ai_run_id", sa.UUID(), nullable=True),
        sa.Column("status", sa.String(length=20), server_default="sent", nullable=False),
        sa.Column("metadata_json", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["session_id"], ["chat_session.chat_session_id"]),
        sa.PrimaryKeyConstraint("message_id"),
    )
    op.create_index("ix_chat_message_session_id", "chat_message", ["session_id"])
    op.create_index("ix_chat_message_created_at", "chat_message", ["created_at"])

    # ── chat_attachment ───────────────────────────────────────────────────────
    op.create_table(
        "chat_attachment",
        sa.Column("attachment_id", sa.UUID(), nullable=False),
        sa.Column("session_id", sa.UUID(), nullable=False),
        sa.Column("message_id", sa.UUID(), nullable=True),
        sa.Column("file_id", sa.UUID(), nullable=True),
        sa.Column("attachment_type", sa.String(length=50), nullable=False, server_default="document"),
        sa.Column("original_file_name", sa.String(length=500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["session_id"], ["chat_session.chat_session_id"]),
        sa.ForeignKeyConstraint(["message_id"], ["chat_message.message_id"]),
        sa.ForeignKeyConstraint(["file_id"], ["file.file_id"]),
        sa.PrimaryKeyConstraint("attachment_id"),
    )
    op.create_index("ix_chat_attachment_session_id", "chat_attachment", ["session_id"])

    # ── ai_run ────────────────────────────────────────────────────────────────
    op.create_table(
        "ai_run",
        sa.Column("ai_run_id", sa.UUID(), nullable=False),
        sa.Column("session_id", sa.UUID(), nullable=True),
        sa.Column("message_id", sa.UUID(), nullable=True),
        sa.Column("persona_id", sa.UUID(), nullable=True),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("model_used", sa.String(length=100), nullable=True),
        sa.Column("provider", sa.String(length=50), nullable=True),
        sa.Column("prompt_tokens", sa.Integer(), nullable=True),
        sa.Column("completion_tokens", sa.Integer(), nullable=True),
        sa.Column("total_tokens", sa.Integer(), nullable=True),
        sa.Column("latency_ms", sa.Integer(), nullable=True),
        sa.Column("rag_used", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("skills_used", sa.JSON(), nullable=True),
        sa.Column("status", sa.String(length=20), server_default="pending", nullable=False),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["session_id"], ["chat_session.chat_session_id"]),
        sa.ForeignKeyConstraint(["user_id"], ["user.user_id"]),
        sa.ForeignKeyConstraint(["persona_id"], ["persona.persona_id"]),
        sa.PrimaryKeyConstraint("ai_run_id"),
    )
    op.create_index("ix_ai_run_session_id", "ai_run", ["session_id"])
    op.create_index("ix_ai_run_user_id", "ai_run", ["user_id"])
    op.create_index("ix_ai_run_created_at", "ai_run", ["created_at"])

    # ── ai_run_retrieval_source ───────────────────────────────────────────────
    op.create_table(
        "ai_run_retrieval_source",
        sa.Column("retrieval_source_id", sa.UUID(), nullable=False),
        sa.Column("ai_run_id", sa.UUID(), nullable=False),
        sa.Column("document_id", sa.UUID(), nullable=True),
        sa.Column("chunk_id", sa.UUID(), nullable=True),
        sa.Column("relevance_score", sa.Float(), nullable=True),
        sa.Column("used_in_prompt", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["ai_run_id"], ["ai_run.ai_run_id"]),
        sa.ForeignKeyConstraint(["document_id"], ["knowledge_document.knowledge_document_id"]),
        sa.PrimaryKeyConstraint("retrieval_source_id"),
    )
    op.create_index("ix_ai_run_retrieval_source_ai_run_id", "ai_run_retrieval_source", ["ai_run_id"])

    # ── generated_output ──────────────────────────────────────────────────────
    op.create_table(
        "generated_output",
        sa.Column("output_id", sa.UUID(), nullable=False),
        sa.Column("ai_run_id", sa.UUID(), nullable=False),
        sa.Column("output_type", sa.String(length=50), nullable=False, server_default="text"),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("format", sa.String(length=20), nullable=False, server_default="markdown"),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="active"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["ai_run_id"], ["ai_run.ai_run_id"]),
        sa.PrimaryKeyConstraint("output_id"),
    )
    op.create_index("ix_generated_output_ai_run_id", "generated_output", ["ai_run_id"])

    # ── output_feedback ───────────────────────────────────────────────────────
    op.create_table(
        "output_feedback",
        sa.Column("feedback_id", sa.UUID(), nullable=False),
        sa.Column("output_id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("rating", sa.Integer(), nullable=True),
        sa.Column("feedback_text", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["output_id"], ["generated_output.output_id"]),
        sa.ForeignKeyConstraint(["user_id"], ["user.user_id"]),
        sa.PrimaryKeyConstraint("feedback_id"),
    )
    op.create_index("ix_output_feedback_output_id", "output_feedback", ["output_id"])

    # ── prompt_library ────────────────────────────────────────────────────────
    op.create_table(
        "prompt_library",
        sa.Column("prompt_id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=True),
        sa.Column("prompt_name", sa.String(length=255), nullable=False),
        sa.Column("prompt_text", sa.Text(), nullable=False),
        sa.Column("prompt_category", sa.String(length=100), nullable=True),
        sa.Column("is_ready_prompt", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("is_system", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("status", sa.String(length=20), server_default="active", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["user.user_id"]),
        sa.PrimaryKeyConstraint("prompt_id"),
    )
    op.create_index("ix_prompt_library_user_id", "prompt_library", ["user_id"])

    # ── prompt_persona_mapping ────────────────────────────────────────────────
    op.create_table(
        "prompt_persona_mapping",
        sa.Column("mapping_id", sa.UUID(), nullable=False),
        sa.Column("prompt_id", sa.UUID(), nullable=False),
        sa.Column("persona_id", sa.UUID(), nullable=False),
        sa.Column("is_featured", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("display_order", sa.Integer(), server_default="0", nullable=False),
        sa.ForeignKeyConstraint(["prompt_id"], ["prompt_library.prompt_id"]),
        sa.ForeignKeyConstraint(["persona_id"], ["persona.persona_id"]),
        sa.PrimaryKeyConstraint("mapping_id"),
    )

    # ── skill_execution_log ───────────────────────────────────────────────────
    op.create_table(
        "skill_execution_log",
        sa.Column("execution_log_id", sa.UUID(), nullable=False),
        sa.Column("skill_id", sa.UUID(), nullable=False),
        sa.Column("ai_run_id", sa.UUID(), nullable=True),
        sa.Column("persona_id", sa.UUID(), nullable=True),
        sa.Column("user_id", sa.UUID(), nullable=True),
        sa.Column("execution_time_ms", sa.Integer(), nullable=True),
        sa.Column("input_data", sa.JSON(), nullable=True),
        sa.Column("output_data", sa.JSON(), nullable=True),
        sa.Column("quality_score", sa.Float(), nullable=True),
        sa.Column("status", sa.String(length=20), server_default="success", nullable=False),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["skill_id"], ["skill.skill_id"]),
        sa.PrimaryKeyConstraint("execution_log_id"),
    )
    op.create_index("ix_skill_execution_log_skill_id", "skill_execution_log", ["skill_id"])
    op.create_index("ix_skill_execution_log_created_at", "skill_execution_log", ["created_at"])


def downgrade() -> None:
    op.drop_table("skill_execution_log")
    op.drop_table("prompt_persona_mapping")
    op.drop_table("prompt_library")
    op.drop_table("output_feedback")
    op.drop_table("generated_output")
    op.drop_table("ai_run_retrieval_source")
    op.drop_table("ai_run")
    op.drop_table("chat_attachment")
    op.drop_table("chat_message")
    op.drop_table("chat_session")
