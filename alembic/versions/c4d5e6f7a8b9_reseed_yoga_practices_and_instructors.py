"""reseed yoga practices and instructors after rebuild

The ``9a1b2c3d4e5f`` rebuild dropped and recreated the ORM tables (including
``yoga_practices`` / ``yoga_instructors``) to migrate to integer PKs, but never
re-ran the catalog seed from ``6353c7c81d3f``. Result: the practice catalog in
the DB is empty and the API silently falls back to static files — losing
instructors, subscription tiers and admin editing.

This revision re-inserts the 5 ready-made practices + 4 demo instructors from
``static/yoga-data/*.json``. It is idempotent (INSERT OR IGNORE) and only fills
rows that are missing — rows created by admins are never touched.

Revision ID: c4d5e6f7a8b9
Revises: b2c3d4e5f6a7
Create Date: 2026-09-06
"""
from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from pathlib import Path

import sqlalchemy as sa
from alembic import op

revision: str = "c4d5e6f7a8b9"
down_revision = "b2c3d4e5f6a7"
branch_labels = None
depends_on = None

_DATA_DIR = Path(__file__).resolve().parents[2] / "static" / "yoga-data"

INSTRUCTORS = [
    # (name, specialty, level, bio) — همان ردیف‌های 6353c7c81d3f
    ("لیسا لیبک", "وینیاسا، یین", "expert", "مربی بین‌المللی وینیاسا با بیش از ۱۵ سال تجربه — تمرین‌های روان و عمیق"),
    ("سارا احمدی", "هاتا، مدیتیشن", "intermediate", "تمرکز بر تنفس و آرامش — مناسب شروع‌کننده‌ها"),
    ("علی رضایی", "آشتانگا، پاور", "advanced", "تمرین‌های قدرتی و منظم برای بدن و ذهن"),
    ("مریم کریمی", "یوگای ترمیمی، تنفس", "beginner", "بازگرداندن تعادل بدن با حرکات ملایم و تنفس عمیق"),
]

PRACTICE_FA = {
    "ocean": ("اقیانوس", "تمرینی پویا و پرانرژی با موج‌های جریان وینیاسا، نگه‌داشتن‌های قدرتی و حرکات بازکننده — هماهنگ با تنفس.", "لیسا لیبک"),
    "desert": ("کویر", "تمرینی آرام با تمرکز بر باز کردن قلب، افزایش انعطاف‌پذیری و رها کردن تنش‌های بدن و ذهن.", "لیسا لیبک"),
    "mountain": ("کوه", "تمرینی قدرتی برای تقویت بدن و ذهن با نظم و انضباط — مناسب کسانی که به چالش علاقه دارند.", "علی رضایی"),
    "sun_salutation_a": ("سلام خورشید A", "توالی کلاسیک سلام خورشید برای گرم کردن بدن و هماهنگی تنفس با حرکت.", "سارا احمدی"),
    "sun_salutation_b": ("سلام خورشید B", "نسخه‌ی پویاتر سلام خورشید با حرکات جنگجو برای قدرت و استقامت.", "علی رضایی"),
}

def _slug(name: str) -> str:
    """ASCII slug for deterministic UUID5 (same scheme as 6353c7c81d3f)."""
    table = str.maketrans("ابپتثجچحخدذرزژسشصضطظعغفقکگلمنوهی", "abptthjchkhddzrszhsssdtttghghfkkglmnvh")
    return "".join(ch for ch in name.translate(table).lower() if ch.isascii() and (ch.isalnum() or ch == "-")) or "instr"

def _pid(name: str) -> str:
    return uuid.uuid5(uuid.NAMESPACE_DNS, name).hex

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
            for _ in range(times):
                total += _flatten_count(s.get("steps"), level, ctx)
        elif t == "difficulty":
            lvls = s.get("levels") or {}
            pick = lvls.get({0: "beginner", 1: "intermediate", 2: "expert"}[level]) or next(iter(lvls.values()), [])
            total += _flatten_count(pick, level, ctx)
    return total

def upgrade() -> None:
    """Re-seed instructors + practices (idempotent)."""
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = set(inspector.get_table_names())

    if "yoga_instructors" not in tables or "yoga_practices" not in tables:
        # Fresh DB: create_all on startup handles it; nothing to reseed into yet.
        return

    # نام مربی‌ها به PK قدیمی UUID وابسته نیست — با نام یکتا JOIN می‌کنیم
    for name, specialty, level, bio in INSTRUCTORS:
        conn.execute(
            sa.text(
                "INSERT OR IGNORE INTO yoga_instructors (id, name, specialty, level, bio, is_active, created_at) "
                "VALUES (:id, :name, :specialty, :level, :bio, 1, :ts)"
            ),
            {
                "id": _pid("instructor:" + name),
                "name": name,
                "specialty": specialty,
                "level": level,
                "bio": bio,
                "ts": datetime.now(timezone.utc).isoformat(),
            },
        )

    # نقشه‌ی name → id مربی (بعد از insert)
    instructor_ids = {
        row[0]: row[1]
        for row in conn.execute(sa.text("SELECT name, id FROM yoga_instructors")).fetchall()
    }

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
                " pose_count, instructor_id, head, sequence, subscription_tier, is_active, source, created_at) "
                "VALUES (:id, :name, :name_fa, :description, :description_fa, :style, :difficulty, :durations, "
                " :difficulties, :pose_count, :instructor_id, :head, :sequence, :tier, 1, 'seed', :ts)"
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
                "instructor_id": instructor_ids.get(instructor),
                "head": json.dumps(head, ensure_ascii=False),
                "sequence": json.dumps(body, ensure_ascii=False),
                "tier": "free",
                "ts": datetime.now(timezone.utc).isoformat(),
            },
        )

def downgrade() -> None:
    """حذف فقط ردیف‌های seed (ردیف‌های ادمین دست‌نخورده می‌مانند)."""
    conn = op.get_bind()
    seed_ids = [_pid("practice:" + f) for f in PRACTICE_FA]
    binds = {f"p{i}": pid for i, pid in enumerate(seed_ids)}
    placeholders = ", ".join(f":p{i}" for i in range(len(seed_ids)))
    conn.execute(
        sa.text(f"DELETE FROM yoga_practices WHERE id IN ({placeholders}) AND source = 'seed'").bindparams(**binds)
    )
