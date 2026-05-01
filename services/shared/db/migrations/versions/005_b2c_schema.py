"""005 B2C schema migration

Revision ID: 005b2c000000
Revises:
Create Date: 2026-04-30

Drops all B2B-only tables and columns.
Rebuilds user_subscription with correct B2C structure.
"""

from alembic import op

revision = "005b2c000000"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ------------------------------------------------------------------
    # Step 1: Drop FK constraints before dropping columns / tables
    # ------------------------------------------------------------------
    op.execute("ALTER TABLE IF EXISTS \"user\" DROP CONSTRAINT IF EXISTS fk_user_department")
    op.execute("ALTER TABLE IF EXISTS \"user\" DROP CONSTRAINT IF EXISTS user_department_id_fkey")

    # ------------------------------------------------------------------
    # Step 2: Drop B2B-only columns from kept tables
    # ------------------------------------------------------------------
    op.execute("""
        DO $$ BEGIN
            IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name='user' AND column_name='department_id'
            ) THEN
                ALTER TABLE "user" DROP COLUMN department_id;
            END IF;
        END $$
    """)

    op.execute("""
        DO $$ BEGIN
            IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name='organization' AND column_name='industry'
            ) THEN
                ALTER TABLE organization DROP COLUMN industry;
            END IF;
        END $$
    """)

    op.execute("""
        DO $$ BEGIN
            IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name='organization' AND column_name='country_code'
            ) THEN
                ALTER TABLE organization DROP COLUMN country_code;
            END IF;
        END $$
    """)

    op.execute("""
        DO $$ BEGIN
            IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name='persona' AND column_name='organization_id'
            ) THEN
                ALTER TABLE persona DROP COLUMN organization_id;
            END IF;
        END $$
    """)

    op.execute("""
        DO $$ BEGIN
            IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name='prompt_library' AND column_name='organization_id'
            ) THEN
                ALTER TABLE prompt_library DROP COLUMN organization_id;
            END IF;
        END $$
    """)

    op.execute("""
        DO $$ BEGIN
            IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name='file' AND column_name='organization_id'
            ) THEN
                ALTER TABLE file DROP COLUMN organization_id;
            END IF;
        END $$
    """)

    op.execute("""
        DO $$ BEGIN
            IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name='file_version' AND column_name='organization_id'
            ) THEN
                ALTER TABLE file_version DROP COLUMN organization_id;
            END IF;
        END $$
    """)

    op.execute("""
        DO $$ BEGIN
            IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name='knowledge_document_access' AND column_name='role_id'
            ) THEN
                ALTER TABLE knowledge_document_access DROP COLUMN role_id;
            END IF;
        END $$
    """)

    # ------------------------------------------------------------------
    # Step 3: Drop B2B-only tables in dependency order
    # ------------------------------------------------------------------
    op.execute("DROP TABLE IF EXISTS user_access_override CASCADE")
    op.execute("DROP TABLE IF EXISTS persona_access_role CASCADE")
    op.execute("DROP TABLE IF EXISTS role_permission CASCADE")
    op.execute("DROP TABLE IF EXISTS user_role CASCADE")
    op.execute("DROP TABLE IF EXISTS permission CASCADE")
    op.execute("DROP TABLE IF EXISTS role CASCADE")
    op.execute("DROP TABLE IF EXISTS department CASCADE")
    op.execute("DROP TABLE IF EXISTS workspace_member CASCADE")
    op.execute("DROP TABLE IF EXISTS subscription_usage CASCADE")
    op.execute("DROP TABLE IF EXISTS organization_subscription CASCADE")
    op.execute("DROP TABLE IF EXISTS system_parameter CASCADE")

    # ------------------------------------------------------------------
    # Step 4: Drop and recreate user_subscription with correct B2C shape
    #         (old schema had TIMESTAMP for dates and no billing_cycle)
    # ------------------------------------------------------------------
    op.execute("DROP TABLE IF EXISTS user_subscription CASCADE")

    op.execute("""
        CREATE TABLE user_subscription (
            user_subscription_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
            package_id UUID NOT NULL REFERENCES package(package_id),
            start_date DATE NOT NULL,
            end_date DATE,
            billing_cycle VARCHAR(20) NOT NULL DEFAULT 'monthly'
                CHECK (billing_cycle IN ('monthly', 'annual', 'trial')),
            billing_status VARCHAR(20) NOT NULL DEFAULT 'active'
                CHECK (billing_status IN ('active', 'cancelled', 'expired', 'trial')),
            auto_renew_flag BOOLEAN NOT NULL DEFAULT TRUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id, package_id)
        )
    """)

    op.execute("CREATE INDEX IF NOT EXISTS idx_user_subscription_user ON user_subscription(user_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_user_subscription_status ON user_subscription(billing_status)")

    # ------------------------------------------------------------------
    # Step 5: Update organization.tenant_type constraint to B2C only
    # ------------------------------------------------------------------
    op.execute("ALTER TABLE organization DROP CONSTRAINT IF EXISTS ck_organization_tenant_type")
    op.execute("UPDATE organization SET tenant_type = 'B2C' WHERE tenant_type != 'B2C'")
    op.execute("""
        ALTER TABLE organization
        ADD CONSTRAINT ck_organization_tenant_type
        CHECK (tenant_type IN ('B2C'))
    """)

    # Drop stale indexes
    op.execute("DROP INDEX IF EXISTS idx_user_department")
    op.execute("DROP INDEX IF EXISTS idx_persona_org")
    op.execute("DROP INDEX IF EXISTS idx_prompt_library_org")
    op.execute("DROP INDEX IF EXISTS idx_file_org")
    op.execute("DROP INDEX IF EXISTS idx_organization_tenant_type")
    op.execute("DROP INDEX IF EXISTS idx_kc_org")


def downgrade() -> None:
    # Downgrade not supported — B2C migration is one-way.
    raise NotImplementedError("Downgrade from B2C schema is not supported.")
