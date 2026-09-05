"""rebuild tables with integer PKs and import legacy cosmic_oracle.db data

Revision ID: 9a1b2c3d4e5f
Revises: 8f2b1d4e9a3c
Create Date: 2026-09-05

The auth layer migrated from the legacy synchronous store (cosmic_oracle.db,
SHA256 passwords, integer ids) onto the async ORM database (cosmic.db). The
original ORM schema used UUID primary keys; this revision:

1. Drops the UUID-keyed tables (dev data in cosmic.db is disposable; the
   legacy store is the source of truth for accounts).
2. Recreates every table from the current model definitions (integer PKs,
   plus the new ``saved_charts`` table and the quota columns on users).
3. Copies users, plans, saved_charts and guest_sessions from cosmic_oracle.db
   — preserving integer ids so previously issued JWTs keep resolving.

If cosmic_oracle.db is absent (fresh checkout), the migration only rebuilds
the schema; the app seeds default plans + the default admin on startup.
"""
import os
import shutil
import sqlite3
from datetime import datetime
from pathlib import Path

import sqlalchemy as sa

from alembic import op

revision = "9a1b2c3d4e5f"
down_revision = "8f2b1d4e9a3c"
branch_labels = None
depends_on = None


# Tables created by the previous (UUID-schema) migrations.
_OLD_TABLES = [
    "yoga_favorites",
    "yoga_practice",
    "daily_streak",
    "tarot_history",
    "chart_history",
    "user_profiles",
    "user_settings",
    "yoga_practices",
    "yoga_instructors",
    "plans",
    "users",
]

# Project-root legacy database (may not exist on a fresh checkout).
_LEGACY_DB = Path(__file__).resolve().parents[2] / "cosmic_oracle.db"


def _backup_legacy_db() -> str | None:
    """Snapshot ``cosmic_oracle.db`` to a dated backup before consuming it.

    This revision drops and rebuilds the ORM tables and then imports the
    legacy rows from ``cosmic_oracle.db``. To guarantee the legacy data can
    never be lost, the file is copied to ``backups/cosmic_oracle.backup-<stamp>.db``
    (next to the original) before anything is read from it. Idempotent: a
    repeated run within the same second reuses the existing backup file.
    """
    if not _LEGACY_DB.exists():
        return None
    backup_dir = _LEGACY_DB.parent / "backups"
    backup_dir.mkdir(exist_ok=True)
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    dest = backup_dir / f"cosmic_oracle.backup-{stamp}.db"
    if dest.exists():
        return str(dest)
    shutil.copy2(str(_LEGACY_DB), str(dest))
    return str(dest)


def _legacy_conn():
    if not _LEGACY_DB.exists():
        return None
    conn = sqlite3.connect(str(_LEGACY_DB))
    conn.row_factory = sqlite3.Row
    return conn


def _import_rows(bind, table: str, columns: list[str], rows: list[tuple]) -> None:
    """Bulk-insert legacy rows into the new schema (guards against re-runs)."""
    if not rows:
        return
    # Named placeholders so SQLAlchemy executemany binds the dicts correctly.
    placeholders = ", ".join(f":{c}" for c in columns)
    stmt = sa.text(
        f"INSERT OR IGNORE INTO {table} ({', '.join(columns)}) VALUES ({placeholders})"
    )
    bind.execute(stmt, [dict(zip(columns, r)) for r in rows])


def upgrade() -> None:
    # Guard: snapshot the legacy store first so the import below can never be
    # the last surviving copy of the account/chart data.
    backup_path = _backup_legacy_db()
    if backup_path:
        print(f"  ✔ cosmic_oracle.db backed up to {backup_path}")

    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing = set(inspector.get_table_names())

    # 1. Drop the old UUID-keyed tables (children first for FK safety).
    for name in _OLD_TABLES:
        if name in existing:
            op.drop_table(name)

    # 2. Recreate everything from the current models (integer PKs etc.).
    from app.models import Base  # noqa: F401  (registers every table)

    Base.metadata.create_all(bind)

    # 3. Import legacy data when the old store exists.
    legacy = _legacy_conn()
    if legacy is None:
        return
    try:
        # users — preserve ids so existing JWTs still resolve.
        rows = [
            (
                r["id"], r["email"], r["password_hash"], r["display_name"],
                r["plan"], bool(r["is_admin"]), 1, 0,
                r["daily_charts_used"] or 0,
                r["daily_charts_reset_at"] or "", r["created_at"] or "",
            )
            for r in legacy.execute("SELECT * FROM users ORDER BY id")
        ]
        _import_rows(
            bind,
            "users",
            [
                "id", "email", "password_hash", "display_name", "plan",
                "is_admin", "is_active", "email_verified",
                "daily_charts_used", "daily_charts_reset_at", "created_at",
            ],
            rows,
        )

        # plans — 1:1 with the new schema.
        rows = [
            (
                r["id"], r["name"], r["display_name"], r["price_monthly"] or 0,
                r["price_yearly"] or 0, r["daily_chart_limit"] or 10,
                bool(r["can_save_charts"]), bool(r["can_access_premium"]),
                r["premium_paths"] or "", r["features"] or "",
                bool(r["is_active"]), r["sort_order"] or 0, r["created_at"] or "",
            )
            for r in legacy.execute("SELECT * FROM plans ORDER BY id")
        ]
        _import_rows(
            bind,
            "plans",
            [
                "id", "name", "display_name", "price_monthly", "price_yearly",
                "daily_chart_limit", "can_save_charts", "can_access_premium",
                "premium_paths", "features", "is_active", "sort_order", "created_at",
            ],
            rows,
        )

        # saved_charts — 1:1.
        rows = [
            (
                r["id"], r["user_id"], r["chart_type"], r["title"] or "",
                r["input_data"] or "", r["result_data"] or "", r["created_at"] or "",
            )
            for r in legacy.execute("SELECT * FROM saved_charts ORDER BY id")
        ]
        _import_rows(
            bind,
            "saved_charts",
            ["id", "user_id", "chart_type", "title", "input_data", "result_data", "created_at"],
            rows,
        )

        # guest_sessions — 1:1 (linked_user_id now references the int users.id).
        rows = [
            (
                r["id"], r["fingerprint_hash"], r["daily_charts_used"] or 0,
                r["daily_charts_reset_at"] or "", r["linked_user_id"],
                r["created_at"] or "", r["last_seen_at"] or "",
            )
            for r in legacy.execute("SELECT * FROM guest_sessions ORDER BY id")
        ]
        _import_rows(
            bind,
            "guest_sessions",
            [
                "id", "fingerprint_hash", "daily_charts_used",
                "daily_charts_reset_at", "linked_user_id", "created_at", "last_seen_at",
            ],
            rows,
        )
    finally:
        legacy.close()


def downgrade() -> None:
    # Rebuilding the old UUID schema from scratch is not supported; the legacy
    # store (cosmic_oracle.db) remains the backup for accounts/charts.
    pass