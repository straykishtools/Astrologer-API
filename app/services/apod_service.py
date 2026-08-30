"""
APOD — Astronomy Picture of the Day service.
Returns NASA's daily astronomical image with Persian translations.
"""

from typing import Optional
from app.services.nasa_client import nasa_client
from app.services.cache import apod_cache
from app.services.translation_service import translate_text


class APODService:
    """Fetches and enriches NASA APOD data."""

    async def get_todays_image(self, date: Optional[str] = None) -> dict:
        """Get today's (or specified date's) APOD with Persian translation.

        Args:
            date: Optional date string YYYY-MM-DD. If None, returns today's.

        Returns:
            Enriched dict with title, explanation, URL, and _fa fields.
        """
        cache_key = f"apod_{date or 'today'}"

        # Check cache
        cached = apod_cache.get(cache_key)
        if cached is not None:
            return cached

        # Fetch from NASA
        data = await nasa_client.get_apod(date=date)

        if "error" in data:
            return data

        # Build enriched result
        title = data.get("title", "")
        explanation = data.get("explanation", "")

        translated = {
            "title": title,
            "title_fa": translate_text(title),
            "explanation": explanation,
            "explanation_fa": translate_text(explanation),
            "url": data.get("url", ""),
            "hdurl": data.get("hdurl", ""),
            "date": data.get("date", ""),
            "media_type": data.get("media_type", "image"),
            "copyright": data.get("copyright", ""),
            "service_version": data.get("service_version", ""),
        }

        # Add thumbnail for videos
        if data.get("thumbnail_url"):
            translated["thumbnail_url"] = data["thumbnail_url"]

        # Cache for 24 hours
        apod_cache.set(cache_key, translated)
        return translated
