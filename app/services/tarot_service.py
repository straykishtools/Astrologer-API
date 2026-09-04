"""
Tarot service: save and list a user's tarot draws.
"""
from datetime import date, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import DailyStreak, TarotHistory, User
from app.schemas.tarot import TarotHistoryCreate


async def save_history(db: AsyncSession, user: User, data: TarotHistoryCreate) -> TarotHistory:
    """Persist a tarot draw and bump the tarot streak."""
    draw = TarotHistory(
        user_id=user.id,
        spread_type=data.spread_type,
        card_ids=data.card_ids,
        reversed=data.reversed,
        question=data.question,
    )
    db.add(draw)
    await db.flush()

    row_result = await db.execute(
        select(DailyStreak).where(DailyStreak.user_id == user.id, DailyStreak.streak_type == "tarot")
    )
    row = row_result.scalar_one_or_none()
    today = date.today()
    if row is None:
        row = DailyStreak(user_id=user.id, streak_type="tarot", current_streak=1, longest_streak=1, last_activity_date=today)
        db.add(row)
    else:
        if row.last_activity_date != today:
            if row.last_activity_date == today - timedelta(days=1):
                row.current_streak += 1
            else:
                row.current_streak = 1
            row.longest_streak = max(row.longest_streak, row.current_streak)
            row.last_activity_date = today
    await db.flush()
    return draw


async def list_history(db: AsyncSession, user: User, limit: int = 100, offset: int = 0) -> list[TarotHistory]:
    result = await db.execute(
        select(TarotHistory)
        .where(TarotHistory.user_id == user.id)
        .order_by(TarotHistory.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    return list(result.scalars())