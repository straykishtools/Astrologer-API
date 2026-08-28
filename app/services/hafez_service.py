"""
سرویس فال حافظ (Hafez Divination)
دریافت غزل تصادفی حافظ از دیتاست محلی گنجور
"""

import json
import random
import logging
import os
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)


class HafezService:
    """سرویس فال حافظ با استفاده از دیتاست محلی گنجور"""

    def __init__(self, data_dir: Optional[str] = None):
        """
        Args:
            data_dir: مسیر پوشه‌ی حاوی فایل‌های JSON غزل‌ها
                      اگر None باشد، مسیر پیش‌فرض استفاده می‌شود.
        """
        if data_dir is None:
            # مسیر پیش‌فرض: app/data/hafez_ghazals/
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            data_dir = os.path.join(base_dir, "data", "hafez_ghazals")

        self.data_dir = data_dir
        self.cat_path = os.path.join(data_dir, "_cat.json")
        self.ghazals = []  # لیست تمام غزل‌ها (از cat.json)
        self._load_catalog()

    def _load_catalog(self) -> None:
        """بارگذاری فایل cat.json برای دریافت لیست غزل‌ها"""
        try:
            with open(self.cat_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                self.ghazals = data.get("Poems", [])
                logger.info(f"✅ {len(self.ghazals)} غزل از cat.json بارگذاری شد.")
        except FileNotFoundError:
            logger.error(f"❌ فایل cat.json در مسیر {self.cat_path} پیدا نشد.")
            self.ghazals = []
        except json.JSONDecodeError:
            logger.error(f"❌ خطا در parsing فایل cat.json")
            self.ghazals = []

    def _load_ghazal_file(self, sh_number: int) -> Optional[Dict[str, Any]]:
        """
        بارگذاری یک فایل غزل با شماره مشخص

        Args:
            sh_number: شماره غزل (مثلاً 1 برای sh1.json)

        Returns:
            دیکشنری داده‌های غزل یا None در صورت خطا
        """
        filename = f"sh{sh_number}.json"
        filepath = os.path.join(self.data_dir, filename)

        try:
            with open(filepath, "r", encoding="utf-8") as f:
                return json.load(f)
        except FileNotFoundError:
            logger.warning(f"⚠️ فایل {filename} پیدا نشد.")
            return None
        except json.JSONDecodeError:
            logger.warning(f"⚠️ خطا در parsing فایل {filename}")
            return None

    def _extract_poem_text(self, ghazal_data: Dict[str, Any]) -> str:
        """
        استخراج متن کامل شعر از داده‌های غزل

        اولویت: PlainText > ترکیب Verses
        """
        # ۱. بررسی PlainText
        sections = ghazal_data.get("Sections", [])
        for section in sections:
            if section.get("PlainText"):
                return section.get("PlainText", "")

        # ۲. ساخت از Verses
        verses = ghazal_data.get("Verses", [])
        if verses:
            poem_lines = []
            for i in range(0, len(verses), 2):
                right = verses[i].get("Text", "") if i < len(verses) else ""
                left = verses[i + 1].get("Text", "") if i + 1 < len(verses) else ""
                if right:
                    poem_lines.append(right)
                if left:
                    poem_lines.append(left)
            return "\n".join(poem_lines)

        return ""

    def _extract_interpretation(self, ghazal_data: Dict[str, Any]) -> str:
        """استخراج تفسیر/خلاصه از PoemSummary"""
        poem_summary = ghazal_data.get("PoemSummary", "")
        if poem_summary:
            return poem_summary

        # اگر تفسیر نبود، از متن شعر یک جمله‌ی پیش‌فرض بساز
        return "🍃 فال حافظ دریافت شد. برای تفسیر کامل، به تفأل‌های دیگر مراجعه کنید."

    async def get_poem(self, question: Optional[str] = None) -> Dict[str, Any]:
        """
        دریافت یک غزل تصادفی از حافظ

        Args:
            question: سوال اختیاری کاربر برای فال

        Returns:
            dict: شامل شعر، تفسیر، شماره غزل، تاریخ و (اختیاری) سوال کاربر
        """
        # ============================================
        # ۱. بررسی وجود دیتاست
        # ============================================
        if not self.ghazals:
            return {
                "error": "دیتاست فال حافظ در دسترس نیست. لطفاً پوشه‌ی hafez_ghazals را بررسی کنید.",
                "detail": "فایل cat.json پیدا نشد یا خالی است."
            }

        # ============================================
        # ۲. انتخاب غزل تصادفی
        # ============================================
        # (تعداد غزل‌ها را از cat.json می‌گیریم)
        total_ghazals = len(self.ghazals)
        if total_ghazals == 0:
            return {"error": "هیچ غزلی در دیتاست یافت نشد."}

        random_index = random.randint(0, total_ghazals - 1)
        selected_poem_meta = self.ghazals[random_index]

        # استخراج شماره غزل از FullUrl
        full_url = selected_poem_meta.get("FullUrl", "")
        try:
            sh_number = int(full_url.split("/")[-1].replace("sh", ""))
        except (ValueError, IndexError):
            # اگر شماره قابل استخراج نبود، از Id استفاده کن
            sh_number = selected_poem_meta.get("Id", 0)
            if not sh_number:
                return {"error": "شماره غزل قابل تشخیص نیست."}

        # ============================================
        # ۳. بارگذاری فایل غزل
        # ============================================
        ghazal_data = self._load_ghazal_file(sh_number)
        if ghazal_data is None:
            # اگر فایل خراب بود، یک غزل دیگر امتحان کن (حداکثر ۵ بار)
            for _ in range(5):
                random_index = random.randint(0, total_ghazals - 1)
                selected_poem_meta = self.ghazals[random_index]
                full_url = selected_poem_meta.get("FullUrl", "")
                try:
                    sh_number = int(full_url.split("/")[-1].replace("sh", ""))
                except (ValueError, IndexError):
                    sh_number = selected_poem_meta.get("Id", 0)
                ghazal_data = self._load_ghazal_file(sh_number)
                if ghazal_data is not None:
                    break

            if ghazal_data is None:
                return {
                    "error": "خطا در بارگذاری غزل تصادفی. لطفاً دوباره امتحان کنید.",
                    "detail": f"فایل sh{sh_number}.json پیدا نشد یا خراب است."
                }

        # ============================================
        # ۴. استخراج اطلاعات
        # ============================================
        poem_text = self._extract_poem_text(ghazal_data)
        interpretation = self._extract_interpretation(ghazal_data)

        # شماره غزل
        ghazal_number = ghazal_data.get("Id", sh_number)

        # تاریخ (از cat.json یا خود فایل)
        date = selected_poem_meta.get("Date", "")

        # ============================================
        # ۵. ساختن نتیجه نهایی
        # ============================================
        result = {
            "poem": poem_text,
            "interpretation": interpretation,
            "date": date,
            "ghazal_number": ghazal_number,
            "ghazal_number_fa": self._to_persian_number(ghazal_number),
            "title": selected_poem_meta.get("Title", f"غزل شمارهٔ {ghazal_number}"),
            "source": "گنجور (Ganjoor)",
            "raw": ghazal_data  # اطلاعات خام برای دیباگ (اختیاری)
        }

        if question:
            result["question"] = question

        # اگر شعر خالی بود، یک پیام جایگزین بگذاریم
        if not result["poem"]:
            result["poem"] = "🍃 فال حافظ دریافت شد، اما متن شعر در دسترس نیست."

        return result

    def _to_persian_number(self, number: int) -> str:
        """تبدیل اعداد انگلیسی به فارسی"""
        persian_digits = {
            "0": "۰", "1": "۱", "2": "۲", "3": "۳", "4": "۴",
            "5": "۵", "6": "۶", "7": "۷", "8": "۸", "9": "۹"
        }
        return "".join(persian_digits.get(c, c) for c in str(number))