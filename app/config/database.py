"""
Async SQLAlchemy database configuration (SQLite via aiosqlite).

The Cosmic Oracle database lives in its own file (`cosmic.db`) and is
managed through SQLAlchemy 2.x async sessions + Alembic migrations. This is the
single store: the legacy synchronous layer (cosmic_oracle.db) was fully
migrated onto it (rows imported by the Alembic migration with ids preserved;
SHA256 passwords still verify and upgrade to bcrypt on login).
"""
import os
from pathlib import Path

from sqlalchemy import event
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

# Connection string: sqlite+aiosqlite:///./cosmic.db (override with COSMIC_DB_URL)
_PROJECT_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_DB_PATH = _PROJECT_ROOT / "cosmic.db"

DATABASE_URL = os.getenv(
    "COSMIC_DB_URL",
    f"sqlite+aiosqlite:///{DEFAULT_DB_PATH.as_posix()}",
)

engine = create_async_engine(DATABASE_URL, echo=False, future=True)


class Base(DeclarativeBase):
    """Declarative base for all ORM models in the Cosmic Oracle database."""


# Enable SQLite foreign-key enforcement (off by default in SQLite).
@event.listens_for(engine.sync_engine, "connect")
def _enable_sqlite_fks(dbapi_connection, connection_record):
    try:
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()
    except Exception:
        pass


SessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db():
    """FastAPI dependency that yields an async database session."""
    async with SessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise


async def create_all():
    """Create tables that do not exist yet (development convenience).

    Alembic migrations remain the canonical schema source; this helper makes
    the app bootable on a fresh checkout without running alembic first.
    """
    from app.models import Base  # noqa: F401  (imports register all tables)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


# Default plan catalog — same values the Alembic seed migration (and the
# legacy cosmic_oracle.db) inserts, so a fresh DB created via ``create_all``
# (no migrations) still has rows the premium gating reads.
DEFAULT_PLANS = [
    {
        "name": "free",
        "display_name": "رایگان",
        "price_monthly": 0,
        "price_yearly": 0,
        "daily_chart_limit": 10,
        "can_save_charts": False,
        "can_access_premium": False,
        "premium_paths": "composite,solar-return,lunar-return",
        "features": "چارت تولد، سیناستری پایه، تاروت، فال حافظ، ناسا",
        "is_active": True,
        "sort_order": 0,
    },
    {
        "name": "gold",
        "display_name": "طلایی",
        "price_monthly": 99000,
        "price_yearly": 990000,
        "daily_chart_limit": 200,
        "can_save_charts": True,
        "can_access_premium": True,
        "premium_paths": "",
        "features": "همه ابزار رایگان + کامپوزیت، ترانزیت کامل، ذخیره چارت",
        "is_active": True,
        "sort_order": 1,
    },
    {
        "name": "diamond",
        "display_name": "الماسی",
        "price_monthly": 299000,
        "price_yearly": 2990000,
        "daily_chart_limit": 9999,
        "can_save_charts": True,
        "can_access_premium": True,
        "premium_paths": "",
        "features": "همه طلایی + خروجی PDF و دسترسی API",
        "is_active": True,
        "sort_order": 2,
    },
]


async def seed_default_plans():
    """Insert the free/gold/diamond rows when the plans table is empty."""
    from sqlalchemy import select

    from app.models import Plan

    async with SessionLocal() as db:
        existing = (await db.execute(select(Plan.id).limit(1))).scalar_one_or_none()
        if existing is not None:
            return
        db.add_all(Plan(**row) for row in DEFAULT_PLANS)
        await db.commit()


async def seed_default_admin():
    """Create the default admin account when no admin exists yet.

    Same account the legacy layer seeded on cosmic_oracle.db (admin@cosmic.ir /
    admin123, plan ``pro``, is_admin True) so existing tooling keeps working.
    """
    from sqlalchemy import select

    from app.models import User
    from app.services.auth_service import hash_password

    async with SessionLocal() as db:
        existing = (
            await db.execute(select(User.id).where(User.email == "admin@cosmic.ir").limit(1))
        ).scalar_one_or_none()
        if existing is not None:
            # Legacy row migrated? Ensure the admin flag is set (defense in depth).
            user = (await db.execute(select(User).where(User.email == "admin@cosmic.ir"))).scalar_one()
            if not user.is_admin:
                user.is_admin = True
                await db.commit()
            return
        db.add(
            User(
                email="admin@cosmic.ir",
                password_hash=hash_password("admin123"),
                display_name="مدیر سیستم",
                plan="pro",
                is_admin=True,
            )
        )
        await db.commit()


async def init_db():
    """Idempotent startup initializer (create tables + seed plans + seed admin)."""
    await create_all()
    try:
        await seed_default_plans()
        await seed_default_admin()
    except Exception:
        # Never block boot on seeding (e.g. locked DB during concurrent start).
        pass