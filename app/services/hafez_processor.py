"""
پردازشگر فال حافظ
تکمیل اطلاعات دریافتی از API با داده‌های جانبی
"""

import json
import os
from datetime import datetime
from typing import Optional

logger = __import__("logging").getLogger(__name__)


class HafezProcessor:
    """تکمیل اطلاعات فال حافظ با داده‌های جانبی"""

    def __init__(self):
        self.ghazals_data = self._load_ghazals()

    def _load_ghazals(self) -> dict:
        """بارگذاری فایل JSON شماره‌گذاری غزل‌ها"""
        file_path = os.path.join(
            os.path.dirname(__file__), "..", "data", "hafez_ghazals.json"
        )
        try:
            if os.path.exists(file_path):
                with open(file_path, "r", encoding="utf-8") as f:
                    return json.load(f)
        except Exception as e:
            logger.warning("Failed to load hafez_ghazals.json: %s", e)
        return {}

    def enrich(self, raw_data: dict) -> dict:
        """
        تکمیل اطلاعات دریافتی از API

        Args:
            raw_data: داده‌های خام از HafezService

        Returns:
            dict: داده‌های تکمیل‌شده
        """
        if raw_data.get("error"):
            return raw_data

        result = raw_data.copy()

        # ============================================
        # ۱. اضافه کردن شماره غزل (اگر موجود باشد)
        # ============================================
        poem_text = raw_data.get("poem", "")
        ghazal_number = self._find_ghazal_number(poem_text)
        if ghazal_number:
            result["ghazal_number"] = ghazal_number
            result["ghazal_number_fa"] = self._to_persian_number(str(ghazal_number))

        # ============================================
        # ۲. تبدیل تاریخ میلادی به شمسی
        # ============================================
        date_str = raw_data.get("date", "")
        if date_str:
            try:
                result["date_shamsi"] = self._miladi_to_shamsi(date_str)
                if result["date_shamsi"]:
                    result["date_shamsi_fa"] = self._to_persian_number(
                        result["date_shamsi"]
                    )
            except Exception:
                pass

        # ============================================
        # ۳. اضافه کردن متن برای اشتراک‌گذاری
        # ============================================
        result["share_text"] = self._generate_share_text(result)

        # ============================================
        # ۴. اضافه کردن برچسب منبع
        # ============================================
        result["source"] = "دیوان حافظ"

        return result

    def _find_ghazal_number(self, poem_text: str) -> Optional[int]:
        """پیدا کردن شماره غزل بر اساس متن (با تطابق ساده)"""
        if not poem_text or not self.ghazals_data:
            return None

        clean_poem = " ".join(poem_text.split())
        for number, text in self.ghazals_data.items():
            clean_text = " ".join(text.split())
            if clean_text in clean_poem or clean_poem in clean_text:
                return int(number)
        return None

    def _miladi_to_shamsi(self, date_str: str) -> Optional[str]:
        """تبدیل تاریخ میلادی به شمسی"""
        try:
            import jdatetime

            miladi = datetime.strptime(date_str, "%Y-%m-%d")
            shamsi = jdatetime.datetime.fromgregorian(datetime=miladi)
            return shamsi.strftime("%Y/%m/%d")
        except ImportError:
            logger.debug("jdatetime not installed, skipping Shamsi conversion")
            return None
        except Exception:
            return None

    @staticmethod
    def _to_persian_number(text: str) -> str:
        """تبدیل اعداد انگلیسی به فارسی"""
        persian_digits = {
            "0": "۰", "1": "۱", "2": "۲", "3": "۳", "4": "۴",
            "5": "۵", "6": "۶", "7": "۷", "8": "۸", "9": "۹",
            "/": "/",
        }
        return "".join(persian_digits.get(c, c) for c in str(text))

    def _generate_share_text(self, data: dict) -> str:
        """تولید متن برای اشتراک‌گذاری"""
        poem = data.get("poem", "").strip()
        interpretation = data.get("interpretation", "").strip()

        text = "🍃 فال حافظ\n\n"
        if data.get("question"):
            text += f"سوال: {data['question']}\n\n"
        text += f"{poem}\n\n"
        if interpretation:
            text += f"📖 تفسیر: {interpretation}\n\n"
        if data.get("ghazal_number_fa"):
            text += f"📜 غزل شماره: {data['ghazal_number_fa']}\n"
        if data.get("date_shamsi_fa"):
            text += f"📅 تاریخ: {data['date_shamsi_fa']}\n"
        text += f"📚 {data.get('source', 'دیوان حافظ')}"

        return text
