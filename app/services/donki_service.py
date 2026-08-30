from typing import Optional
from app.services.nasa_client import nasa_client

class DONKIService:
    async def get_solar_flares(self, start_date: str, end_date: Optional[str] = None) -> dict:
        return await nasa_client.get_space_weather(start_date, end_date)

    async def get_cmes(self, start_date: str, end_date: Optional[str] = None) -> dict:
        return await nasa_client.get_cmes(start_date, end_date)

    async def get_full_summary(self, start_date: str, end_date: Optional[str] = None) -> dict:
        return await nasa_client.get_space_weather_full(start_date, end_date)
