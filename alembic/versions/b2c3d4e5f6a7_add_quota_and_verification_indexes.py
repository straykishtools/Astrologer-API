"""add indexes for quota plan lookups and email verification tokens

Revision ID: b2c3d4e5f6a7
Revises: 9a1b2c3d4e5f
Create Date: 2026-09-05

Adds the two indexes on ``users`` that the schema audit flagged as missing
(EXPLAIN QUERY PLAN showed full table scans):

- ``ix_users_plan`` — admin plan ops (delete_plan / users-on-plan checks) and
  the per-plan admin stats GROUP BY users.plan.
- ``ix_users_verification_token`` — the verify-email / reset-password flows
  look up users by the random 24-hour token.

All quota and streak queries (user by id, plans by name, guest by fingerprint,
daily_streak by user+type, yoga/tarot/chart history by user) already use
existing indexes; those were verified against the ORM models and need no change.
"""
import sqlalchemy as sa

from alembic import op

revision = "b2c3d4e5f6a7"
down_revision = "9a1b2c3d4e5f"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_index("ix_users_plan", "users", ["plan"], unique=False)
    op.create_index(
        "ix_users_verification_token", "users", ["verification_token"], unique=False
    )


def downgrade() -> None:
    op.drop_index("ix_users_verification_token", table_name="users")
    op.drop_index("ix_users_plan", table_name="users")