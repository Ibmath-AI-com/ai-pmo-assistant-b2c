"""006 Drop organization table and all organization_id columns

Revision ID: 006droporg0000
Revises: 005b2c000000
Create Date: 2026-05-01

Removes the organization table entirely and drops lingering
organization_id columns from all data tables. All data is
scoped by user_id directly in B2C.
"""

from alembic import op

revision = "006droporg0000"
down_revision = "005b2c000000"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Drop organization_id from project (was NOT NULL — drop constraint first)
    op.execute("""
        DO $$ BEGIN
            IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name='project' AND column_name='organization_id'
            ) THEN
                ALTER TABLE project ALTER COLUMN organization_id DROP NOT NULL;
                ALTER TABLE project DROP COLUMN organization_id;
            END IF;
        END $$
    """)

    # Drop organization_id from knowledge_collection
    op.execute("""
        DO $$ BEGIN
            IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name='knowledge_collection' AND column_name='organization_id'
            ) THEN
                ALTER TABLE knowledge_collection DROP COLUMN organization_id;
            END IF;
        END $$
    """)

    # Drop organization_id from skill
    op.execute("""
        DO $$ BEGIN
            IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name='skill' AND column_name='organization_id'
            ) THEN
                ALTER TABLE skill DROP COLUMN organization_id;
            END IF;
        END $$
    """)

    # Drop organization_id from api_integration
    op.execute("""
        DO $$ BEGIN
            IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name='api_integration' AND column_name='organization_id'
            ) THEN
                ALTER TABLE api_integration DROP COLUMN organization_id;
            END IF;
        END $$
    """)

    # Drop organization_id from api_integration_usage_log
    op.execute("""
        DO $$ BEGIN
            IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name='api_integration_usage_log' AND column_name='organization_id'
            ) THEN
                ALTER TABLE api_integration_usage_log DROP COLUMN organization_id;
            END IF;
        END $$
    """)

    # Drop organization_id from connector_source
    op.execute("""
        DO $$ BEGIN
            IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name='connector_source' AND column_name='organization_id'
            ) THEN
                ALTER TABLE connector_source DROP COLUMN organization_id;
            END IF;
        END $$
    """)

    # Drop department column from knowledge_document_governance
    op.execute("""
        DO $$ BEGIN
            IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name='knowledge_document_governance' AND column_name='department'
            ) THEN
                ALTER TABLE knowledge_document_governance DROP COLUMN department;
            END IF;
        END $$
    """)

    # Drop organization table last (CASCADE handles any remaining FKs)
    op.execute("DROP TABLE IF EXISTS organization CASCADE")

    # Drop stale indexes
    op.execute("DROP INDEX IF EXISTS idx_organization_status")
    op.execute("DROP INDEX IF EXISTS idx_project_org")
    op.execute("DROP INDEX IF EXISTS idx_kc_org")


def downgrade() -> None:
    raise NotImplementedError("Downgrade not supported — organization removal is one-way.")
