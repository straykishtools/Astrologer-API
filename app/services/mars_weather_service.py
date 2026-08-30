"""
Mars Weather service — provides Mars InSight weather data.
"""

from app.services.nasa_client import nasa_client


class MarsWeatherService:
    """Fetches Mars weather from NASA InSight lander data."""

    async def get_weather(self) -> dict:
        """Get latest Mars weather report.

        Returns:
            Dict with temperature, wind, and pressure data
        """
        data = await nasa_client.get_mars_weather()

        if "error" in data:
            return data

        sol_keys = data.get("sol_keys", [])

        if not sol_keys:
            return {
                "error": "No InSight weather data available",
                "note": "InSight mission ended in December 2022. Data is historical.",
            }

        sols = []
        for sol in sol_keys[-7:]:  # Last 7 sols
            sol_data = data.get(sol, {})
            at = sol_data.get("AT", {})
            hws = sol_data.get("HWS", {})
            pre = sol_data.get("PRE", {})

            sols.append({
                "sol": sol,
                "temperature": {
                    "min_c": at.get("mn"),
                    "max_c": at.get("mx"),
                    "avg_c": at.get("av"),
                    "min_fa": "حداقل دما",
                    "max_fa": "حداکثر دما",
                    "avg_fa": "میانگین دما",
                },
                "wind": {
                    "speed_ms": hws.get("av"),
                    "speed_fa": "سرعت باد",
                },
                "pressure": {
                    "min_pa": pre.get("mn"),
                    "max_pa": pre.get("mx"),
                    "avg_pa": pre.get("av"),
                },
                "first_utc": sol_data.get("First_UTC", ""),
                "last_utc": sol_data.get("Last_UTC", ""),
                "season": sol_data.get("Season", ""),
                "season_fa": _translate_season(sol_data.get("Season", "")),
            })

        return {
            "source": "NASA InSight",
            "source_fa": "مریخ‌نورد این‌سایت ناسا",
            "note": "InSight mission ended Dec 2022. This is historical data.",
            "note_fa": "ماموریت این‌سایت در دسامبر ۲۰۲۲ پایان یافت. این داده‌های تاریخی است.",
            "latest_sol_count": len(sols),
            "sols": sols,
        }


def _translate_season(season: str) -> str:
    """Translate Mars season to Persian."""
    seasons = {
        "spring": "بهار",
        "summer": "تابستان",
        "fall": "پاییز",
        "winter": "زمستان",
    }
    return seasons.get(season.lower(), season)
