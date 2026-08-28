"""
سرویس فال حافظ (Hafez Divination)
دریافت غزل تصادفی حافظ با تفسیر
"""

import httpx
import logging

logger = logging.getLogger(__name__)


class HafezService:
    """سرویس فال حافظ با استفاده از API خارجی"""

    def __init__(self, api_key: str = "cd5679a0-07fb-407e-8764-6ff465f28070"):
        self.api_key = api_key
        self.base_url = "https://apidevelopers.ir/api/v1/hafez-poem"

    async def get_poem(self, question: str = None) -> dict:
        """
        دریافت یک غزل تصادفی از حافظ

        Args:
            question: سوال اختیاری کاربر برای فال
        """
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    self.base_url,
                    data={"apiKey": self.api_key},
                    timeout=10.0,
                )
                if response.status_code != 200:
                    logger.warning(f"Hafez API returned status {response.status_code}")
                    return {"error": "خطا در دریافت فال حافظ"}

                data = response.json()

                result = {
                    "poem": data.get("poem", ""),
                    "interpretation": data.get("interpretation", data.get("meaning", "")),
                    "date": data.get("date", ""),
                }
                if question:
                    result["question"] = question

                return result

            except httpx.TimeoutException:
                logger.error("Hafez API timeout")
                return {"error": "زمان انتظار دریافت فال تمام شد"}
            except httpx.RequestError as e:
                logger.error(f"Hafez API request error: {e}")
                return {"error": "خطا در ارتباط با سرویس فال حافظ"}
            except Exception as e:
                logger.error(f"Hafez unexpected error: {e}")
                return {"error": "خطای غیرمنتظره در دریافت فال"}
