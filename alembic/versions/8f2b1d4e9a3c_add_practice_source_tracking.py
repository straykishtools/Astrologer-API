"""add practice source tracking (source, source_file)

Revision ID: 8f2b1d4e9a3c
Revises: 6353c7c81d3f
Create Date: 2026-09-04

Tracks where each yoga practice came from so admins can audit imports:
- source      : 'seed' (built-in default) | 'manual' (created by hand) | 'xml' (uploaded session file)
- source_file : original uploaded filename (for xml imports)
Idempotent guards in case of a partially-applied previous run.
"""
import sqlalchemy as sa

from alembic import op

revision = "8f2b1d4e9a3c"
down_revision = "6353c7c81d3f"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    cols = [c[1] for c in conn.execute(sa.text("PRAGMA table_info('yoga_practices')")).fetchall()]

    if "source" not in cols:
        op.add_column(
            "yoga_practices",
            sa.Column("source", sa.String(length=20), nullable=False, server_default="manual"),
        )
    if "source_file" not in cols:
        op.add_column(
            "yoga_practices",
            sa.Column("source_file", sa.String(length=255), nullable=True),
        )

    # تمرین‌های ازپیش‌بارگذاری‌شده (seed) را علامت بزن
    conn.execute(
        sa.text("UPDATE yoga_practices SET source = 'seed' WHERE source = 'manual' "
                "AND name IN ('ocean','desert','mountain','sun_salutation_a','sun_salutation_b')")
    )


def downgrade() -> None:
    conn = op.get_bind()
    cols = [c[1] for c in conn.execute(sa.text("PRAGMA table_info('yoga_practices')")).fetchall()]
    if "source_file" in cols:
        op.drop_column("yoga_practices", "source_file")
    if "source" in cols:
        op.drop_column("yoga_practices", "source")
