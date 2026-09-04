"""
Async SQLAlchemy database configuration (SQLite via aiosqlite).

The Cosmic Oracle user database lives in its own file (`cosmic.db`) and is
managed through SQLAlchemy 2.x async sessions + Alembic migrations. It is
deliberately separate from the legacy synchronous SQLite layer
(`app/models.py` -> `cosmic_oracle.db`) that powers the original auth/plans
routes, so the existing API surface keeps working unchanged.
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


async def init_db():
    """Idempotent startup initializer (alias of create_all + PRAGMA setup)."""
    await create_all()