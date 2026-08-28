# app/engines/numerology.py
"""
موتور عددشناسی (Numerology)
محاسبه: عدد مسیر زندگی، سال شخصی، عدد بیان، عدد درونی، سازگاری
"""

from datetime import datetime
from typing import Dict, Optional


class NumerologyEngine:

    @staticmethod
    def _reduce_to_single(number: int) -> int:
        """کاهش عدد به یک رقم (۱ تا ۹) یا عدد اصلی (۱۱، ۲۲، ۳۳)"""
        if number in [11, 22, 33]:
            return number
        while number > 9:
            number = sum(int(d) for d in str(number))
        return number

    @staticmethod
    def _digit_sum(number: int) -> int:
        """جمع ارقام یک عدد"""
        return sum(int(d) for d in str(abs(number)))

    # ========== ۱. عدد مسیر زندگی (Life Path) ==========
    def life_path_number(self, year: int, month: int, day: int) -> Dict:
        """محاسبه‌ی عدد مسیر زندگی از تاریخ تولد"""
        year_sum = self._digit_sum(year)
        month_sum = self._digit_sum(month)
        day_sum = self._digit_sum(day)
        total = year_sum + month_sum + day_sum
        life_path = self._reduce_to_single(total)

        meanings = {
            1: "رهبر، مستقل، مبتکر",
            2: "همکاری، صلح‌طلب، حساس",
            3: "خلاق، خوش‌بیان، اجتماعی",
            4: "سخت‌کوش، منظم، قابل اعتماد",
            5: "آزادی‌خواه، ماجراجو، کنجکاو",
            6: "مسئول، مراقب، خانواده‌دوست",
            7: "تحلیل‌گر، عرفانی، جستجوگر",
            8: "قدرتمند، موفق، مادی",
            9: "بشردوست، خیالی، فداکار",
            11: "روشن‌بین، الهام‌بخش، معنوی",
            22: "معمار بزرگ، سازنده، قدرتمند",
            33: "معلم عالی، فداکار، شفابخش",
        }

        return {
            "year_sum": year_sum,
            "month_sum": month_sum,
            "day_sum": day_sum,
            "total": total,
            "life_path": life_path,
            "meaning": meanings.get(life_path, "تفسیر موجود نیست"),
        }

    # ========== ۲. سال شخصی (Personal Year) ==========
    def personal_year(
        self,
        birth_year: int,
        birth_month: int,
        birth_day: int,
        target_year: Optional[int] = None,
    ) -> Dict:
        """محاسبه‌ی سال شخصی برای سال هدف (پیش‌فرض: سال جاری)"""
        if target_year is None:
            target_year = datetime.now().year

        target_sum = self._digit_sum(target_year)
        month_sum = self._digit_sum(birth_month)
        day_sum = self._digit_sum(birth_day)
        total = target_sum + month_sum + day_sum
        personal_year = self._reduce_to_single(total)

        meanings = {
            1: "شروع جدید، اقدام، فرصت‌ها",
            2: "صبوری، همکاری، رشد تدریجی",
            3: "خلاقیت، ارتباطات، شادی",
            4: "کار سخت، نظم، بنیادسازی",
            5: "تغییر، آزادی، ماجراجویی",
            6: "خانواده، مسئولیت، مراقبت",
            7: "درون‌نگری، یادگیری، رشد معنوی",
            8: "قدرت، موفقیت، ثروت",
            9: "پایان‌ها، تکمیل، رهاسازی",
            11: "روشن‌بینی، الهام، رشد سریع",
            22: "تحقق بزرگ، قدرت سازندگی",
            33: "خدمت بزرگ، شفا، آموزش",
        }

        return {
            "target_year": target_year,
            "target_sum": target_sum,
            "month_sum": month_sum,
            "day_sum": day_sum,
            "total": total,
            "personal_year": personal_year,
            "meaning": meanings.get(personal_year, "تفسیر موجود نیست"),
        }

    # ========== ۳. عدد بیان (Expression) ==========
    def expression_number(self, name: str) -> Dict:
        """محاسبه‌ی عدد بیان (بر اساس ارزش عددی حروف)"""
        letter_map = {
            "ا": 1, "ب": 2, "ج": 3, "د": 4, "ه": 5, "و": 6, "ز": 7, "ح": 8, "ط": 9,
            "ی": 1, "ک": 2, "ل": 3, "م": 4, "ن": 5, "س": 6, "ع": 7, "ف": 8, "ص": 9,
            "ق": 1, "ر": 2, "ش": 3, "ت": 4, "ث": 5, "خ": 6, "ذ": 7, "ض": 8, "ظ": 9,
            "غ": 1, "آ": 1, "أ": 1, "إ": 1, "ۀ": 5, "ة": 5, "ى": 1,
        }

        total = 0
        details = []
        for char in name:
            value = letter_map.get(char, 0)
            if value > 0:
                total += value
                details.append({"char": char, "value": value})

        expression = self._reduce_to_single(total)

        meanings = {
            1: "خلاق، مستقل، رهبر",
            2: "همکار، صلح‌جو، حساس",
            3: "هنرمند، خوش‌بیان، شاد",
            4: "سازنده، منظم، صبور",
            5: "آزاد، ماجراجو، کنجکاو",
            6: "مراقب، مسئول، عاشق",
            7: "عمیق، تحلیل‌گر، عارف",
            8: "موفق، قدرتمند، جاه‌طلب",
            9: "بشردوست، فداکار، خیال‌پرداز",
            11: "روشن‌بین، الهام‌بخش، معنوی",
            22: "معمار بزرگ، سازنده، قدرتمند",
            33: "معلم عالی، فداکار، شفابخش",
        }

        return {
            "name": name,
            "total": total,
            "expression": expression,
            "meaning": meanings.get(expression, "تفسیر موجود نیست"),
            "details": details,
        }

    # ========== ۴. عدد درونی (Soul Urge) ==========
    def soul_urge_number(self, name: str) -> Dict:
        """محاسبه‌ی عدد درونی (بر اساس حروف صدادار)"""
        vowels = ["ا", "ی", "و", "آ", "أ", "إ", "ۀ", "ة", "ى"]
        vowel_map = {
            "ا": 1, "ی": 1, "و": 6, "آ": 1, "أ": 1, "إ": 1, "ۀ": 5, "ة": 5, "ى": 1,
        }

        total = 0
        details = []
        for char in name:
            if char in vowels:
                value = vowel_map.get(char, 0)
                total += value
                details.append({"char": char, "value": value})

        soul_urge = self._reduce_to_single(total)

        meanings = {
            1: "استقلال، خودشناسی، رهبری",
            2: "هماهنگی، همکاری، عشق",
            3: "خودبیانی، خلاقیت، شادی",
            4: "امنیت، نظم، پایبندی",
            5: "آزادی، ماجراجویی، تنوع",
            6: "خدمت، مسئولیت، خانه",
            7: "آگاهی، عرفان، تنهایی",
            8: "قدرت، موفقیت، ثروت",
            9: "بشردوستی، فداکاری، جهانی",
        }

        return {
            "name": name,
            "total": total,
            "soul_urge": soul_urge,
            "meaning": meanings.get(soul_urge, "تفسیر موجود نیست"),
            "details": details,
        }

    # ========== ۵. سازگاری عددی ==========
    def compatibility(self, num1: int, num2: int) -> Dict:
        """بررسی سازگاری بین دو عدد"""
        diff = abs(num1 - num2)

        if diff == 0:
            level = "بسیار عالی"
            description = "هماهنگی کامل — اهداف و ارزش‌های مشترک"
        elif diff <= 2:
            level = "عالی"
            description = "مکمل یکدیگر — انرژی‌های همسو"
        elif diff <= 4:
            level = "خوب"
            description = "سازگاری خوب — نیاز به تلاش کم"
        elif diff <= 6:
            level = "متوسط"
            description = "تفاوت‌های قابل مدیریت — نیاز به درک متقابل"
        else:
            level = "چالش‌برانگیز"
            description = "تفاوت‌های اساسی — نیاز به کار و صبر زیاد"

        return {
            "number1": num1,
            "number2": num2,
            "difference": diff,
            "compatibility_level": level,
            "description": description,
        }
