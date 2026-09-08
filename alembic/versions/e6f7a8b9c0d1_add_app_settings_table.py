"""add app_settings table (server-side admin configuration)

Revision ID: e6f7a8b9c0d1
Revises: d5e6f7a8b9c0
Create Date: 2026-09-08

Namespaced JSON store for admin-managed lists (plans, audio tracks,
background images incl. per-plan assignment). Replaces the localStorage-only
state so admin configuration applies to every user.
"""
import sqlalchemy as sa

from alembic import op

revision = "e6f7a8b9c0d1"
down_revision = "d5e6f7a8b9c0"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "app_settings",
        sa.Column("ns", sa.Text(), nullable=False),
        sa.Column("value_json", sa.Text(), nullable=False, server_default="[]"),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("ns"),
    )


def downgrade() -> None:
    op.drop_table("app_settings")
