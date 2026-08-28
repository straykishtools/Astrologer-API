"""
سرویس فال حافظ (Hafez Divination)
دریافت غزل تصادفی حافظ با تفسیر
"""

import httpx
import json
import logging
import requests

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

        Returns:
            dict: شامل شعر، تفسیر، تاریخ و (اختیاری) سوال کاربر
        """
        async with httpx.AsyncClient(timeout=15.0) as client:
            try:
                # ============================================
                # ۱. ارسال درخواست به API (با فرمت JSON)
                # ============================================
                response = await client.post(
                    self.base_url,
                    json={"apiKey": self.api_key},  # <-- اصلاح: ارسال JSON
                )

                # ============================================
                # ۲. بررسی وضعیت پاسخ
                # ============================================
                if response.status_code != 200:
                    logger.warning(f"Hafez API returned status {response.status_code}")
                    return {
                        "error": f"خطا در دریافت فال حافظ (کد {response.status_code})",
                        "detail": response.text[:200]
                    }

                # ============================================
                # ۳. پردازش JSON پاسخ
                # ============================================
                try:
                    data = response.json()
                except json.JSONDecodeError:
                    logger.error("Hafez API returned invalid JSON")
                    return {
                        "error": "پاسخ API به‌درستی فرمت JSON ندارد",
                        "detail": response.text[:200]
                    }

                # ============================================
                # ۴. بررسی موفقیت‌آمیز بودن پاسخ
                # ============================================
                # ساختار پاسخ موفق: {"ok": true, "poem": "...", "interpretation": "...", ...}
                if not data.get("ok", False):
                    error_msg = data.get("message", "خطای ناشناخته از سمت API")
                    return {
                        "error": f"API خطا برگرداند: {error_msg}",
                        "detail": data.get("result", {})
                    }

                # ============================================
                # ۵. استخراج داده‌های اصلی
                # ============================================
                result = {
                    "poem": data.get("poem", ""),
                    "interpretation": data.get("interpretation", data.get("meaning", "")),
                    "date": data.get("date", ""),
                    "raw": data.get("result", {})  # اطلاعات اضافی (اختیاری)
                }

                # اضافه کردن سوال کاربر (اگر وجود داشته باشد)
                if question:
                    result["question"] = question

                return result

            # ============================================
            # ۶. مدیریت خطاها
            # ============================================
            except httpx.TimeoutException:
                logger.error("Hafez API timeout")
                return {"error": "زمان انتظار دریافت فال تمام شد"}

            except httpx.RequestError as e:
                logger.error(f"Hafez API request error: {e}")
                return {"error": f"خطا در ارتباط با سرویس فال حافظ: {str(e)}"}

            except Exception as e:
                logger.error(f"Hafez unexpected error: {e}")
                return {"error": f"خطای غیرمنتظره: {str(e)}"}