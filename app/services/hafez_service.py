"""
سرویس فال حافظ (Hafez Divination)
دریافت غزل تصادفی حافظ از دیتاست محلی گنجور
"""

import json
import random
import logging
import os
import re
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
        """بارگذاری یک فایل غزل با شماره مشخص"""
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
        """استخراج متن کامل شعر از داده‌های غزل"""
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
        return "🍃 فال حافظ دریافت شد. برای تفسیر کامل، به تفأل‌های دیگر مراجعه کنید."

    def _extract_ghazal_number_from_meta(self, poem_meta: dict) -> int:
        """
        استخراج شماره‌ی واقعی غزل از meta data (FullUrl یا Title)
        اولویت: FullUrl > Title > Id (fallback)
        """
        # ۱. از FullUrl: /hafez/ghazal/sh123 → 123
        full_url = poem_meta.get("FullUrl", "")
        if full_url and "sh" in full_url:
            try:
                sh_part = full_url.split("/")[-1]  # sh123
                if sh_part.startswith("sh"):
                    return int(sh_part.replace("sh", ""))
            except (ValueError, IndexError):
                pass

        # ۲. از Title: "غزل شمارهٔ ۱۲۳" → 123
        title = poem_meta.get("Title", "")
        if "شمارهٔ" in title:
            try:
                match = re.search(r"شمارهٔ\s*(\d+)", title)
                if match:
                    return int(match.group(1))
            except:
                pass

        # ۳. در نهایت از Id استفاده کن
        return poem_meta.get("Id", 0)

    async def get_poem(self, question: Optional[str] = None) -> Dict[str, Any]:
        """
        دریافت یک غزل تصادفی از حافظ با خروجی دوستونه

        Returns:
            dict: {
                "poem": متن شعر,
                "interpretation": تفسیر,
                "metadata": { شماره غزل، عنوان، منبع، تاریخ },
                "question": سوال کاربر (اختیاری)
            }
        """
        # ============================================
        # ۱. بررسی وجود دیتاست
        # ============================================
        if not self.ghazals:
            return {
                "error": "دیتاست فال حافظ در دسترس نیست.",
                "detail": "فایل cat.json پیدا نشد یا خالی است."
            }

        total_ghazals = len(self.ghazals)
        if total_ghazals == 0:
            return {"error": "هیچ غزلی در دیتاست یافت نشد."}

        # ============================================
        # ۲. انتخاب غزل تصادفی
        # ============================================
        random_index = random.randint(0, total_ghazals - 1)
        selected_poem_meta = self.ghazals[random_index]

        # استخراج شماره غزل از meta
        ghazal_number = self._extract_ghazal_number_from_meta(selected_poem_meta)

        # اگر شماره پیدا نشد، از FullUrl دوباره امتحان کن (fallback)
        if not ghazal_number:
            full_url = selected_poem_meta.get("FullUrl", "")
            try:
                ghazal_number = int(full_url.split("/")[-1].replace("sh", ""))
            except (ValueError, IndexError):
                ghazal_number = selected_poem_meta.get("Id", 0)

        if not ghazal_number:
            return {"error": "شماره غزل قابل تشخیص نیست."}

        # ============================================
        # ۳. بارگذاری فایل غزل
        # ============================================
        ghazal_data = self._load_ghazal_file(ghazal_number)
        if ghazal_data is None:
            # اگر فایل خراب بود، یک غزل دیگر امتحان کن (حداکثر ۵ بار)
            for _ in range(5):
                random_index = random.randint(0, total_ghazals - 1)
                selected_poem_meta = self.ghazals[random_index]
                ghazal_number = self._extract_ghazal_number_from_meta(selected_poem_meta)
                if not ghazal_number:
                    full_url = selected_poem_meta.get("FullUrl", "")
                    try:
                        ghazal_number = int(full_url.split("/")[-1].replace("sh", ""))
                    except (ValueError, IndexError):
                        ghazal_number = selected_poem_meta.get("Id", 0)
                ghazal_data = self._load_ghazal_file(ghazal_number)
                if ghazal_data is not None:
                    break

            if ghazal_data is None:
                return {
                    "error": "خطا در بارگذاری غزل تصادفی.",
                    "detail": f"فایل sh{ghazal_number}.json پیدا نشد یا خراب است."
                }

        # ============================================
        # ۴. استخراج اطلاعات
        # ============================================
        poem_text = self._extract_poem_text(ghazal_data)
        interpretation = self._extract_interpretation(ghazal_data)
        date = selected_poem_meta.get("Date", "")

        # ============================================
        # ۵. خروجی دوستونه (شعر | تفسیر + متادیتا)
        # ============================================
        # تعبیر تفأل بر اساس مضمونِ غزل
        from app.services.hafez_interpreter import HafezInterpreter
        _interp = HafezInterpreter().interpret(ghazal_number, question)

        result = {
            # ----- بخش شعر (سمت راست / بالا) -----
            "poem": poem_text if poem_text else "🍃 فال حافظ دریافت شد، اما متن شعر در دسترس نیست.",

            # ----- بخش تفسیر (سمت چپ / پایین) -----
            "interpretation": interpretation,

            # ----- تعبیر تفأل (مضمون + پیام + مشورت) -----
            "faal": _interp,
            
            # ----- متادیتا (اطلاعات غزل) -----
            "metadata": {
                "ghazal_number": ghazal_number,
                "ghazal_number_fa": self._to_persian_number(ghazal_number),
                "title": selected_poem_meta.get("FullTitle", selected_poem_meta.get("Title", f"غزل شمارهٔ {ghazal_number}")),
                "source": "گنجور (Ganjoor)",
                "date": date,
            },
            
            # ----- سوال کاربر (اگر وجود داشته باشد) -----
            "question": question if question else None,
        }

        return result

    def _to_persian_number(self, number: int) -> str:
        """تبدیل اعداد انگلیسی به فارسی"""
        persian_digits = {
            "0": "۰", "1": "۱", "2": "۲", "3": "۳", "4": "۴",
            "5": "۵", "6": "۶", "7": "۷", "8": "۸", "9": "۹"
        }
        return "".join(persian_digits.get(c, c) for c in str(number))