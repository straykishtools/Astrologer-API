"""
Yoga service: record sessions, track streaks, manage favorites, history and stats.
"""
from datetime import date, timedelta

from fastapi import HTTPException
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import DailyStreak, User, YogaFavorite, YogaPractice
from app.schemas.yoga import FavoriteCreate, YogaSessionCreate


# ─── Sessions ───

async def save_session(db: AsyncSession, user: User, data: YogaSessionCreate) -> YogaPractice:
    """Persist a yoga/breathing/meditation session and update the streak."""
    session = YogaPractice(
        user_id=user.id,
        pose_id=data.pose_id,
        pose_name=data.pose_name,
        category=data.category,
        duration_seconds=data.duration_seconds,
        completed=data.completed,
        notes=data.notes,
        practice_date=data.practice_date or date.today(),
    )
    db.add(session)
    await db.flush()

    if data.completed:
        await bump_streak(db, user, "yoga", data.practice_date or date.today())
    return session


async def list_sessions(db: AsyncSession, user: User, limit: int = 100, offset: int = 0) -> list[YogaPractice]:
    result = await db.execute(
        select(YogaPractice)
        .where(YogaPractice.user_id == user.id)
        .order_by(YogaPractice.practice_date.desc(), YogaPractice.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    return list(result.scalars())


# ─── Streaks ───

async def get_streak_row(db: AsyncSession, user: User, streak_type: str = "yoga") -> DailyStreak:
    result = await db.execute(
        select(DailyStreak).where(DailyStreak.user_id == user.id, DailyStreak.streak_type == streak_type)
    )
    row = result.scalar_one_or_none()
    if row is None:
        row = DailyStreak(user_id=user.id, streak_type=streak_type)
        db.add(row)
        await db.flush()
    return row


async def bump_streak(db: AsyncSession, user: User, streak_type: str, activity_date: date) -> DailyStreak:
    """Extend the consecutive-day streak for ``streak_type`` on ``activity_date``."""
    row = await get_streak_row(db, user, streak_type)

    if row.last_activity_date == activity_date:
        return row  # already counted today

    yesterday = activity_date - timedelta(days=1)
    if row.last_activity_date == yesterday or row.last_activity_date is None:
        row.current_streak += 1
    else:
        row.current_streak = 1  # gap -> restart

    row.longest_streak = max(row.longest_streak, row.current_streak)
    row.last_activity_date = activity_date
    await db.flush()
    return row


# ─── Stats ───

async def get_stats(db: AsyncSession, user: User) -> dict:
    result = await db.execute(
        select(YogaPractice)
        .where(YogaPractice.user_id == user.id)
        .order_by(YogaPractice.practice_date.desc(), YogaPractice.created_at.desc())
    )
    sessions = list(result.scalars())

    total_seconds = sum(s.duration_seconds or 0 for s in sessions)
    completed = [s for s in sessions if s.completed]
    days: set[date] = {s.practice_date for s in completed}

    from collections import Counter

    pose_counter: Counter = Counter()
    category_counter: Counter = Counter()
    for s in sessions:
        category_counter[s.category] += 1
        if s.pose_name:
            pose_counter[s.pose_name] += 1

    today = date.today()
    cursor = today if today in days else today - timedelta(days=1)
    streak = 0
    while cursor in days:
        streak += 1
        cursor -= timedelta(days=1)

    streak_row = await get_streak_row(db, user, "yoga")
    # sessions[0] is the most recent thanks to the ordering above.
    last = sessions[0] if sessions else None
    return {
        "total_sessions": len(sessions),
        "total_minutes": round(total_seconds / 60),
        "total_seconds": total_seconds,
        "streak": streak_row.current_streak or streak,
        "longest_streak": max(streak_row.longest_streak, streak),
        "last_practice_date": last.practice_date if last else None,
        "practiced_today": bool(last and last.practice_date == today),
        "most_practiced": [
            {"pose_name": name, "count": count} for name, count in pose_counter.most_common(5)
        ],
        "by_category": dict(category_counter),
    }


# ─── Favorites ───

async def add_favorite(db: AsyncSession, user: User, data: FavoriteCreate) -> YogaFavorite:
    result = await db.execute(
        select(YogaFavorite).where(
            YogaFavorite.user_id == user.id,
            YogaFavorite.pose_id == data.pose_id,
            YogaFavorite.pose_name == data.pose_name,
        )
    )
    existing = result.scalar_one_or_none()
    if existing:
        return existing

    fav = YogaFavorite(user_id=user.id, pose_id=data.pose_id, pose_name=data.pose_name)
    db.add(fav)
    try:
        await db.flush()
    except Exception:
        # duplicate (e.g. different name spelling) — treat as already favorited
        await db.rollback()
        raise HTTPException(status_code=409, detail="این حرکت قبلاً به علاقهمندیها اضافه شده")
    return fav


async def remove_favorite(db: AsyncSession, user: User, pose_id: int) -> bool:
    result = await db.execute(
        delete(YogaFavorite).where(YogaFavorite.user_id == user.id, YogaFavorite.pose_id == pose_id)
    )
    await db.flush()
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="علاقهمندی یافت نشد")
    return True


async def list_favorites(db: AsyncSession, user: User) -> list[YogaFavorite]:
    result = await db.execute(
        select(YogaFavorite).where(YogaFavorite.user_id == user.id).order_by(YogaFavorite.created_at.desc())
    )
    return list(result.scalars())