"""008 Add user_payment_method table

Revision ID: 008paymeth0000
Revises: a676ace2c1ea
Create Date: 2026-05-01
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = "008paymeth0000"
down_revision = "a676ace2c1ea"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS user_payment_method (
            payment_method_id   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id             UUID NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
            card_brand          VARCHAR(20),
            last_four           VARCHAR(4) NOT NULL,
            expiry_month        INTEGER NOT NULL,
            expiry_year         INTEGER NOT NULL,
            is_default          BOOLEAN NOT NULL DEFAULT FALSE,
            status              VARCHAR(20) NOT NULL DEFAULT 'active',
            created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_payment_method_user ON user_payment_method(user_id)")
    op.execute("ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS country VARCHAR(100)")
    op.execute("ALTER TABLE user_profile ALTER COLUMN gender TYPE VARCHAR(30)")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS user_payment_method")
    op.execute("ALTER TABLE user_profile DROP COLUMN IF EXISTS country")
