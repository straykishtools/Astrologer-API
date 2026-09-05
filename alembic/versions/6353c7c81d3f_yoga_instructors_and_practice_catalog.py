"""yoga instructors and practice catalog

Revision ID: 6353c7c81d3f
Revises: 7c1a3f9e4b2d
Create Date: 2026-09-04 17:17:10.166116

Adds the ``yoga_instructors`` and ``yoga_practices`` tables and seeds them
with the demo instructor roster and the 5 ready-made practices (parsed from
``static/yoga-data/*.json``) so a fresh checkout is fully usable.
"""
from typing import Sequence, Union
import json
import uuid
from pathlib import Path

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6353c7c81d3f'
down_revision: Union[str, Sequence[str], None] = '7c1a3f9e4b2d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_DATA_DIR = Path(__file__).resolve().parents[2] / "static" / "yoga-data"

INSTRUCTORS = [
    # (name, specialty, level, bio)
    ("لیسا لیبک", "وینیاسا، یین", "expert", "مربی بین‌المللی وینیاسا با بیش از ۱۵ سال تجربه — تمرین‌های روان و عمیق"),
    ("سارا احمدی", "هاتا، مدیتیشن", "intermediate", "تمرکز بر تنفس و آرامش — مناسب شروع‌کننده‌ها"),
    ("علی رضایی", "آشتانگا، پاور", "advanced", "تمرین‌های قدرتی و منظم برای بدن و ذهن"),
    ("مریم کریمی", "یوگای ترمیمی، تنفس", "beginner", "بازگرداندن تعادل بدن با حرکات ملایم و تنفس عمیق"),
]

# name -> (name_fa, description_fa, instructor)
PRACTICE_FA = {
    "ocean": ("اقیانوس", "تمرینی پویا و پرانرژی با موج‌های جریان وینیاسا، نگه‌داشتن‌های قدرتی و حرکات بازکننده — هماهنگ با تنفس.", "لیسا لیبک"),
    "desert": ("کویر", "تمرینی آرام با تمرکز بر باز کردن قلب، افزایش انعطاف‌پذیری و رها کردن تنش‌های بدن و ذهن.", "لیسا لیبک"),
    "mountain": ("کوه", "تمرینی قدرتی برای تقویت بدن و ذهن با نظم و انضباط — مناسب کسانی که به چالش علاقه دارند.", "علی رضایی"),
    "sun_salutation_a": ("سلام خورشید A", "توالی کلاسیک سلام خورشید برای گرم کردن بدن و هماهنگی تنفس با حرکت.", "سارا احمدی"),
    "sun_salutation_b": ("سلام خورشید B", "نسخه‌ی پویاتر سلام خورشید با حرکات جنگجو برای قدرت و استقامت.", "علی رضایی"),
}

TIER_BY_PRACTICE = {  # همه رایگان — ادمین می‌تواند بعداً ارتقا دهد
    "ocean": "free", "desert": "free", "mountain": "free",
    "sun_salutation_a": "free", "sun_salutation_b": "free",
}


def _pid(name: str) -> str:
    return uuid.uuid5(uuid.NAMESPACE_DNS, name).hex  # 32-char hex, SQLAlchemy Uuid format


def _flatten_count(steps, level=0, ctx=None):
    """تعداد گام‌های (move/hold/pose) بعد از پهن‌کردن حلقه‌ها و شاخه‌های سطح."""
    if ctx is None:
        ctx = {"tempo": 4.0, "side": "L"}
    total = 0
    for s in steps or []:
        t = s.get("type")
        if t == "tempo":
            ctx["tempo"] = float(s.get("duration") or 4.0)
        elif t in ("move", "hold", "pose"):
            total += 1
        elif t == "loop":
            arr = s.get("count") if isinstance(s.get("count"), list) else [1]
            times = arr[min(level, len(arr) - 1)] if arr else 1
            times = times or 1
            for i in range(times):
                total += _flatten_count(s.get("steps"), level, ctx)
        elif t == "difficulty":
            lvls = s.get("levels") or {}
            pick = lvls.get({0: "beginner", 1: "intermediate", 2: "expert"}[level]) or next(iter(lvls.values()), [])
            total += _flatten_count(pick, level, ctx)
    return total


def upgrade() -> None:
    """Upgrade schema + seed demo instructors and the 5 ready-made practices."""
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = set(inspector.get_table_names())

    if "yoga_instructors" not in tables:
        op.create_table('yoga_instructors',
            sa.Column('id', sa.Uuid(), nullable=False),
            sa.Column('name', sa.String(length=120), nullable=False),
            sa.Column('specialty', sa.String(length=200), nullable=True),
            sa.Column('level', sa.String(length=30), nullable=False),
            sa.Column('bio', sa.Text(), nullable=True),
            sa.Column('is_active', sa.Boolean(), nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
            sa.PrimaryKeyConstraint('id'),
        )
    if "yoga_practices" not in tables:
        op.create_table('yoga_practices',
            sa.Column('id', sa.Uuid(), nullable=False),
            sa.Column('name', sa.String(length=80), nullable=False),
            sa.Column('name_fa', sa.String(length=120), nullable=True),
            sa.Column('description', sa.Text(), nullable=True),
            sa.Column('description_fa', sa.Text(), nullable=True),
            sa.Column('style', sa.String(length=30), nullable=True),
            sa.Column('difficulty', sa.String(length=20), nullable=True),
            sa.Column('durations', sa.JSON(), nullable=False),
            sa.Column('difficulties', sa.JSON(), nullable=False),
            sa.Column('pose_count', sa.Integer(), nullable=True),
            sa.Column('instructor_id', sa.Uuid(), nullable=True),
            sa.Column('head', sa.JSON(), nullable=False),
            sa.Column('sequence', sa.JSON(), nullable=False),
            sa.Column('subscription_tier', sa.String(length=20), nullable=False),
            sa.Column('is_active', sa.Boolean(), nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
            sa.ForeignKeyConstraint(['instructor_id'], ['yoga_instructors.id'], ondelete='SET NULL'),
            sa.PrimaryKeyConstraint('id'),
        )
        op.create_index(op.f('ix_yoga_practices_name'), 'yoga_practices', ['name'], unique=True)

    # ─── Seed: instructors ───
    for name, specialty, level, bio in INSTRUCTORS:
        conn.execute(
            sa.text(
                "INSERT OR IGNORE INTO yoga_instructors (id, name, specialty, level, bio, is_active) "
                "VALUES (:id, :name, :specialty, :level, :bio, 1)"
            ),
            {"id": _pid("instructor:" + name), "name": name, "specialty": specialty, "level": level, "bio": bio},
        )

    # ─── Seed: practices (از JSONهای تبدیل‌شده) ───
    for fname, (name_fa, desc_fa, instructor) in PRACTICE_FA.items():
        path = _DATA_DIR / f"{fname}.json"
        if not path.exists():
            continue
        data = json.loads(path.read_text(encoding="utf-8"))
        head = data.get("head") or {}
        body = data.get("body") or {}
        difficulties = head.get("difficulties") or [0]
        diff_key = {0: "beginner", 1: "intermediate", 2: "expert"}
        difficulty = diff_key.get(max(difficulties), "beginner")
        pose_count = _flatten_count(body.get("steps") or [])
        conn.execute(
            sa.text(
                "INSERT OR IGNORE INTO yoga_practices "
                "(id, name, name_fa, description, description_fa, style, difficulty, durations, difficulties, "
                " pose_count, instructor_id, head, sequence, subscription_tier, is_active) "
                "VALUES (:id, :name, :name_fa, :description, :description_fa, :style, :difficulty, :durations, "
                " :difficulties, :pose_count, :instructor_id, :head, :sequence, :tier, 1)"
            ),
            {
                "id": _pid("practice:" + fname),
                "name": fname,
                "name_fa": name_fa,
                "description": head.get("description") or "",
                "description_fa": desc_fa,
                "style": head.get("style") or "hatha",
                "difficulty": difficulty,
                "durations": json.dumps(head.get("durations") or [30], ensure_ascii=False),
                "difficulties": json.dumps(difficulties, ensure_ascii=False),
                "pose_count": pose_count,
                "instructor_id": _pid("instructor:" + instructor),
                "head": json.dumps(head, ensure_ascii=False),
                "sequence": json.dumps(body, ensure_ascii=False),
                "tier": TIER_BY_PRACTICE.get(fname, "free"),
            },
        )


def downgrade() -> None:
    """Downgrade schema."""
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = set(inspector.get_table_names())
    if "yoga_practices" in tables:
        op.drop_index(op.f('ix_yoga_practices_name'), table_name='yoga_practices')
        op.drop_table('yoga_practices')
    if "yoga_instructors" in tables:
        op.drop_table('yoga_instructors')