"""
سرویس جغرافیایی (Geo Service)
دریافت مختصات شهر از API — جایگزین یا پشتیبان GeoNames
"""

import httpx
import logging
from typing import Optional, Dict

logger = logging.getLogger(__name__)


class GeoService:
    """سرویس دریافت مختصات جغرافیایی شهرها"""

    def __init__(self, api_key: str = "cd5679a0-07fb-407e-8764-6ff465f28070"):
        self.api_key = api_key
        self.base_url = "https://apidevelopers.ir/api/v1/geo"

    async def get_coordinates(self, city: str, country: Optional[str] = None) -> Dict:
        """
        دریافت مختصات شهر از API

        Args:
            city: نام شهر
            country: نام کشور (اختیاری)
        """
        async with httpx.AsyncClient() as client:
            payload = {
                "apiKey": self.api_key,
                "city": city,
                "fields": "lat,lng,country,province,timezone",
            }
            if country:
                payload["country"] = country

            try:
                response = await client.post(
                    self.base_url,
                    data=payload,
                    timeout=10.0,
                )

                if response.status_code != 200:
                    logger.warning(f"Geo API returned status {response.status_code}")
                    return {"error": "خطا در دریافت اطلاعات جغرافیایی"}

                data = response.json()

                return {
                    "city": data.get("city", city),
                    "country": data.get("country", ""),
                    "province": data.get("province", ""),
                    "lat": data.get("lat", 0.0),
                    "lng": data.get("lng", 0.0),
                    "timezone": data.get("timezone", "Asia/Tehran"),
                }

            except httpx.TimeoutException:
                logger.error("Geo API timeout")
                return {"error": "زمان انتظار دریافت اطلاعات تمام شد"}
            except httpx.RequestError as e:
                logger.error(f"Geo API request error: {e}")
                return {"error": "خطا در ارتباط با سرویس جغرافیایی"}
            except Exception as e:
                logger.error(f"Geo unexpected error: {e}")
                return {"error": "خطای غیرمنتظره در دریافت اطلاعات جغرافیایی"}
