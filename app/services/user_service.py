"""
User profile & settings service: get/update birth data, preferences and the
personal dashboard aggregates.
"""
from collections import Counter
from datetime import date, timedelta

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import ChartHistory, DailyStreak, TarotHistory, User, UserProfile, UserSettings, YogaPractice
from app.schemas.user import SettingsUpdate


# ─── Profile ───

async def get_default_profile(db: AsyncSession, user: User) -> UserProfile | None:
    result = await db.execute(
        select(UserProfile)
        .where(UserProfile.user_id == user.id)
        .order_by(UserProfile.is_default.desc(), UserProfile.created_at.asc())
    )
    return result.scalars().first()


async def get_settings(db: AsyncSession, user: User) -> UserSettings | None:
    result = await db.execute(select(UserSettings).where(UserSettings.user_id == user.id))
    return result.scalar_one_or_none()


async def get_or_create_settings(db: AsyncSession, user: User) -> UserSettings:
    settings = await get_settings(db, user)
    if settings is None:
        settings = UserSettings(user_id=user.id)
        db.add(settings)
        await db.flush()
    return settings


async def update_profile(db: AsyncSession, user: User, data: dict) -> UserProfile:
    """Upsert the user's default profile with the provided fields."""
    profile = await get_default_profile(db, user)
    if profile is None:
        profile = UserProfile(user_id=user.id, is_default=True)
        db.add(profile)

    for key, value in data.items():
        if value is not None and hasattr(profile, key):
            setattr(profile, key, value)
    await db.flush()
    return profile


async def update_settings(db: AsyncSession, user: User, data: SettingsUpdate) -> UserSettings:
    settings = await get_or_create_settings(db, user)
    for key, value in data.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(settings, key, value)
    await db.flush()
    return settings


# ─── Dashboard ───

async def get_streaks(db: AsyncSession, user: User) -> list[DailyStreak]:
    result = await db.execute(
        select(DailyStreak).where(DailyStreak.user_id == user.id).order_by(DailyStreak.streak_type)
    )
    return list(result.scalars())


async def get_yoga_summary(db: AsyncSession, user: User) -> dict:
    """Aggregate yoga stats: sessions, minutes, streak and top poses."""
    result = await db.execute(
        select(YogaPractice).where(YogaPractice.user_id == user.id).order_by(YogaPractice.practice_date.desc())
    )
    sessions = list(result.scalars())

    total_seconds = sum(s.duration_seconds or 0 for s in sessions)
    total_sessions = len(sessions)

    by_category: Counter = Counter()
    pose_counter: Counter = Counter()
    days: set[date] = set()
    for s in sessions:
        by_category[s.category] += 1
        if s.pose_name:
            pose_counter[s.pose_name] += 1
        if s.completed:
            days.add(s.practice_date)

    streak = compute_streak(days)
    streak_row = None
    result = await db.execute(
        select(DailyStreak).where(DailyStreak.user_id == user.id, DailyStreak.streak_type == "yoga")
    )
    streak_row = result.scalar_one_or_none()

    most_practiced = [
        {"pose_name": name, "count": count}
        for name, count in pose_counter.most_common(5)
    ]
    last = sessions[0] if sessions else None
    return {
        "total_sessions": total_sessions,
        "total_minutes": round(total_seconds / 60),
        "total_seconds": total_seconds,
        "streak": streak_row.current_streak if streak_row else streak,
        "longest_streak": streak_row.longest_streak if streak_row else streak,
        "last_practice_date": last.practice_date if last else None,
        "practiced_today": bool(last and last.practice_date == date.today()),
        "most_practiced": most_practiced,
        "by_category": dict(by_category),
        "recent": [
            {
                "pose_name": s.pose_name,
                "category": s.category,
                "duration_seconds": s.duration_seconds or 0,
                "practice_date": s.practice_date.isoformat(),
                "completed": bool(s.completed),
                "notes": s.notes,
            }
            for s in sessions[:6]
        ],
    }


def compute_streak(days: set[date]) -> int:
    """Current consecutive-day streak, allowing today to be missing."""
    if not days:
        return 0
    today = date.today()
    cursor = today
    if cursor not in days:
        cursor -= timedelta(days=1)
    streak = 0
    while cursor in days:
        streak += 1
        cursor -= timedelta(days=1)
    return streak


async def get_chart_summary(db: AsyncSession, user: User) -> dict:
    result = await db.execute(
        select(ChartHistory).where(ChartHistory.user_id == user.id).order_by(ChartHistory.created_at.desc()).limit(5)
    )
    recent = list(result.scalars())
    result = await db.execute(
        select(ChartHistory.chart_type, func.count()).where(ChartHistory.user_id == user.id).group_by(ChartHistory.chart_type)
    )
    by_type = {row[0]: row[1] for row in result.all()}
    return {
        "total": sum(by_type.values()),
        "by_type": by_type,
        "recent": [
            {
                "id": str(c.id),
                "chart_type": c.chart_type,
                "title": c.title,
                "score": c.score,
                "subject_name": c.subject_name,
                "created_at": c.created_at.isoformat() if c.created_at else None,
            }
            for c in recent
        ],
    }


async def get_tarot_summary(db: AsyncSession, user: User) -> dict:
    result = await db.execute(
        select(func.count()).select_from(TarotHistory).where(TarotHistory.user_id == user.id)
    )
    total = result.scalar_one()
    result = await db.execute(
        select(TarotHistory).where(TarotHistory.user_id == user.id).order_by(TarotHistory.created_at.desc()).limit(5)
    )
    recent = [
        {
            "id": str(t.id),
            "spread_type": t.spread_type,
            "card_ids": t.card_ids,
            "question": t.question,
            "created_at": t.created_at.isoformat() if t.created_at else None,
        }
        for t in result.scalars()
    ]
    return {"total_draws": total, "recent": recent}


async def get_legacy_saved_charts(user: User) -> list[dict]:
    """Charts saved through the legacy /api/v5/auth/charts/save endpoint.

    Runs in a worker thread so the blocking sqlite3 call never stalls the
    async event loop. Returns [] when the legacy store has no matching row.
    """
    import asyncio

    from app.models import get_user_charts  # legacy sync layer

    legacy_id = getattr(user, "_legacy_user_id", None)
    if not legacy_id:
        return []
    try:
        return await asyncio.to_thread(get_user_charts, int(legacy_id))
    except Exception:
        return []