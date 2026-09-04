"""
Base class + shared helpers for the Cosmic Oracle SQLAlchemy models.

The declarative base lives in ``app.config.database`` so that both the
application and Alembic can import it from a single place.
"""
from app.config.database import Base  # noqa: F401

__all__ = ["Base"]