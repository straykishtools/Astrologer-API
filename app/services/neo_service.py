"""
NeoWs — Near-Earth Object Web Service.
Provides data about asteroids approaching Earth on a given date.
"""

from typing import Optional
from app.services.nasa_client import nasa_client
from app.services.translation_service import translate_text


class NeoService:
    """Fetches near-Earth asteroid data from NASA NeoWs."""

    async def get_asteroids(
        self, start_date: str, end_date: Optional[str] = None
    ) -> dict:
        """Get near-Earth asteroids for a date range.

        Args:
            start_date: Start date (YYYY-MM-DD)
            end_date: End date (YYYY-MM-DD)

        Returns:
            Dict with asteroid data grouped by date
        """
        data = await nasa_client.get_asteroids(start_date, end_date)

        if "error" in data:
            return data

        def _fa_size(d_min: float, d_max: float) -> str:
            avg = (d_min + d_max) / 2
            if avg < 10:
                return "تخته‌سنگی کوچک"
            if avg < 100:
                return "به بزرگی یک ساختمان"
            if avg < 500:
                return "به بزرگی یک ورزشگاه"
            return "غول‌پیکر (به بزرگی یک شهر)"

        element_count = data.get("element_count", 0)
        near_earth_objects = data.get("near_earth_objects", {})

        summary = {}
        total_hazardous = 0
        today_list = []
        for date_key, asteroids in near_earth_objects.items():
            day_list = []
            for neo in asteroids:
                estimated_diameter = neo.get("estimated_diameter", {})
                meters = estimated_diameter.get("meters", {})
                close_approach = neo.get("close_approach_data", [{}])[0] \
                    if neo.get("close_approach_data") else {}
                velocity = close_approach.get("relative_velocity", {})

                is_hazardous = neo.get("is_potentially_hazardous_asteroid", False)
                if is_hazardous:
                    total_hazardous += 1

                d_min = round(meters.get("estimated_diameter_min", 0), 2)
                d_max = round(meters.get("estimated_diameter_max", 0), 2)
                miss_km = close_approach.get("miss_distance", {}).get("kilometers", "")

                item = {
                    "id": neo.get("id", ""),
                    "name": neo.get("name", ""),
                    "name_fa": translate_text(neo.get("name", "")),
                    "nasa_jpl_url": neo.get("nasa_jpl_url", ""),
                    "is_hazardous": is_hazardous,
                    "diameter_min_m": d_min,
                    "diameter_max_m": d_max,
                    "velocity_km_s": velocity.get("kilometers_per_second", ""),
                    "miss_distance_km": miss_km,
                    "close_approach_date": close_approach.get("close_approach_date", ""),
                    # ─── توضیحات فارسی ───
                    "fa": {
                        "size": _fa_size(d_min, d_max),
                        "hazardous": "⚠️ بالقوه خطرناک — به سیارک‌های دارای مدار نزدیک به زمین گفته می‌شود؛ خطای فوری وجود ندارد."
                                     if is_hazardous
                                     else "بی‌خطر — مسیر آن با زمین تداخل ندارد.",
                        "passage": f"از فاصله {float(miss_km):,.0f} کیلومتری زمین گذشت"
                                   if miss_km else "از کنار زمین گذشت",
                    },
                }

                day_list.append(item)
                if date_key == (end_date or start_date):
                    today_list.append(item)

            summary[date_key] = day_list

        # خلاصه فارسی برای فرانت‌اند
        today_count = len(today_list)
        closest = None
        if today_list:
            def _miss(it):
                try:
                    return float(it.get("miss_distance_km") or 0)
                except (TypeError, ValueError):
                    return float("inf")
            closest = min(today_list, key=_miss)

        fa_summary = {
            "headline": f"امروز {today_count} سیارک از کنار زمین گذشتند"
                        if today_count else "امروز سیارکی به زمین نزدیک نشد",
            "hazardous_note": f"⚠️ {total_hazardous} مورد بالقوه خطرناک در این بازه"
                              if total_hazardous else "هیچ مورد خطرناکی در این بازه نبود",
            "closest": {
                "name_fa": closest.get("name_fa") or closest.get("name") if closest else None,
                "size": closest["fa"]["size"] if closest else None,
                "passage": closest["fa"]["passage"] if closest else None,
                "velocity_km_s": closest.get("velocity_km_s") if closest else None,
            } if closest else None,
        }

        return {
            "element_count": element_count,
            "hazardous_count": total_hazardous,
            "date_range": {
                "start": start_date,
                "end": end_date or start_date,
            },
            "asteroids_by_date": summary,
            "fa_summary": fa_summary,
        }
