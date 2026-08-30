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

        element_count = data.get("element_count", 0)
        near_earth_objects = data.get("near_earth_objects", {})

        summary = {}
        total_hazardous = 0
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

                day_list.append({
                    "id": neo.get("id", ""),
                    "name": neo.get("name", ""),
                    "name_fa": translate_text(neo.get("name", "")),
                    "nasa_jpl_url": neo.get("nasa_jpl_url", ""),
                    "is_hazardous": is_hazardous,
                    "diameter_min_m": round(meters.get("estimated_diameter_min", 0), 2),
                    "diameter_max_m": round(meters.get("estimated_diameter_max", 0), 2),
                    "velocity_km_s": velocity.get("kilometers_per_second", ""),
                    "miss_distance_km": close_approach.get("miss_distance", {}).get(
                        "kilometers", ""
                    ),
                    "close_approach_date": close_approach.get("close_approach_date", ""),
                })

            summary[date_key] = day_list

        return {
            "element_count": element_count,
            "hazardous_count": total_hazardous,
            "date_range": {
                "start": start_date,
                "end": end_date or start_date,
            },
            "asteroids_by_date": summary,
        }
