"""add login_throttle table (persistent per-IP brute-force lockouts)

Revision ID: d5e6f7a8b9c0
Revises: c4d5e6f7a8b9
Create Date: 2026-09-08

Replaces the data/login_throttle.json store: the rate-limit middleware now
persists failed-attempt counters and lockout deadlines in cosmic.db, so
lockouts survive server restarts (and are visible to the admin lockouts
endpoint). Existing JSON state is best-effort migrated on first write — no
data carry-over needed here since lockouts expire within minutes.
"""
import sqlalchemy as sa

from alembic import op

revision = "d5e6f7a8b9c0"
down_revision = "c4d5e6f7a8b9"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "login_throttle",
        sa.Column("ip", sa.String(length=64), nullable=False),
        sa.Column("failure_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("locked_until", sa.Float(), nullable=False, server_default="0"),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("ip"),
    )
    op.create_index(
        "ix_login_throttle_locked_until", "login_throttle", ["locked_until"], unique=False
    )


def downgrade() -> None:
    op.drop_index("ix_login_throttle_locked_until", table_name="login_throttle")
    op.drop_table("login_throttle")
