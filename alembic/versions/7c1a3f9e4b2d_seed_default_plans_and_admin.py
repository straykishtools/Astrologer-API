"""seed default plans and admin user

Revision ID: 7c1a3f9e4b2d
Revises: 6bed3763fcf1
Create Date: 2026-09-04

Seeds the free/gold/diamond plan tiers (mirroring the legacy cosmic_oracle.db
defaults) and the default admin account (admin@cosmic.ir / admin123) so a
fresh checkout is usable after ``alembic upgrade head``. Idempotent.
"""
import bcrypt
import sqlalchemy as sa

from alembic import op

# SQLAlchemy's Uuid type stores 32-char hex (no dashes) on SQLite — raw-SQL
# inserts MUST use the same representation or ORM updates by id won't match.
def _hex_uuid() -> str:
    import uuid

    return uuid.uuid4().hex

revision = "7c1a3f9e4b2d"
down_revision = "6bed3763fcf1"
branch_labels = None
depends_on = None


PLANS = [
    {
        "name": "free",
        "display_name": "رایگان",
        "price_monthly": 0,
        "price_yearly": 0,
        "daily_chart_limit": 10,
        "can_save_charts": 0,
        "can_access_premium": 0,
        "premium_paths": "composite,solar-return,lunar-return",
        "features": "چارت تولد، سیناستری پایه، تاروت، فال حافظ، ناسا",
        "is_active": 1,
        "sort_order": 0,
    },
    {
        "name": "gold",
        "display_name": "طلایی",
        "price_monthly": 99000,
        "price_yearly": 990000,
        "daily_chart_limit": 200,
        "can_save_charts": 1,
        "can_access_premium": 1,
        "premium_paths": "",
        "features": "همه ابزار رایگان + کامپوزیت، ترانزیت کامل، بازگشت خورشیدی/ماهانه، ابجد، مزاج، ذخیره چارت",
        "is_active": 1,
        "sort_order": 1,
    },
    {
        "name": "diamond",
        "display_name": "الماسی",
        "price_monthly": 299000,
        "price_yearly": 2990000,
        "daily_chart_limit": 9999,
        "can_save_charts": 1,
        "can_access_premium": 1,
        "premium_paths": "",
        "features": "همه طلایی + خروجی PDF، اعلان ترانزیت، مقایسه گروهی، دسترسی API",
        "is_active": 1,
        "sort_order": 2,
    },
]


def upgrade() -> None:
    conn = op.get_bind()

    # ── Plans (idempotent by unique name) ──
    for p in PLANS:
        row = conn.execute(
            sa.text("SELECT 1 FROM plans WHERE name = :name"), {"name": p["name"]}
        ).first()
        if row:
            continue
        conn.execute(
            sa.text(
                """
                INSERT INTO plans (id, name, display_name, price_monthly, price_yearly,
                                   daily_chart_limit, can_save_charts, can_access_premium,
                                   premium_paths, features, is_active, sort_order, created_at)
                VALUES (:id, :name, :display_name, :price_monthly, :price_yearly,
                        :daily_chart_limit, :can_save_charts, :can_access_premium,
                        :premium_paths, :features, :is_active, :sort_order,
                        datetime('now'))
                """
            ),
            {"id": _hex_uuid(), **p},
        )

    # ── Admin user (idempotent by unique email) ──
    existing = conn.execute(
        sa.text("SELECT 1 FROM users WHERE email = 'admin@cosmic.ir'")
    ).first()
    if not existing:
        hashed = bcrypt.hashpw(b"admin123", bcrypt.gensalt()).decode("utf-8")
        conn.execute(
            sa.text(
                """
                INSERT INTO users (id, email, password_hash, display_name, plan,
                                   is_admin, is_active, email_verified, created_at)
                VALUES (:id, 'admin@cosmic.ir', :hash, 'مدیر سیستم', 'pro', 1, 1, 1,
                        datetime('now'))
                """
            ),
            {"id": _hex_uuid(), "hash": hashed},
        )


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(
        sa.text("DELETE FROM plans WHERE name IN ('free', 'gold', 'diamond')")
    )
    conn.execute(sa.text("DELETE FROM users WHERE email = 'admin@cosmic.ir'"))