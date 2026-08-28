"""
موتور بیوریتم (Biorhythm)
محاسبه چرخه‌های فیزیکی، عاطفی و ذهنی بر اساس تاریخ تولد
"""

import math
from datetime import datetime
from typing import Dict, Optional


class BiorhythmEngine:
    """محاسبه‌گر بیوریتم — چرخه‌های ۲۳، ۲۸ و ۳۳ روزه"""

    PHYSICAL_CYCLE = 23
    EMOTIONAL_CYCLE = 28
    INTELLECTUAL_CYCLE = 33

    @staticmethod
    def _get_status(value: float) -> str:
        """تبدیل مقدار بیوریتم به وضعیت فارسی"""
        if value > 70:
            return "عالی 🔥"
        elif value > 30:
            return "خوب ✅"
        elif value > -30:
            return "معمولی ⚖️"
        elif value > -70:
            return "ضعیف ⚠️"
        else:
            return "بسیار ضعیف 🛑"

    @staticmethod
    def _get_phase_description(value: float) -> str:
        """توصیف فاز فعلی چرخه"""
        if value > 90:
            return "اوج قدرت"
        elif value > 50:
            return "رو به رشد"
        elif value > 10:
            return "نزدیک اوج"
        elif value > -10:
            return "نقطه عطف (تغییر فاز)"
        elif value > -50:
            return "رو به کاهش"
        elif value > -90:
            return "نزدیک کف"
        else:
            return "کف چرخه (نیاز به استراحت)"

    def calculate(self, birth_date: str, target_date: Optional[str] = None) -> Dict:
        """
        محاسبه‌ی بیوریتم در تاریخ هدف
        birth_date: YYYY-MM-DD
        target_date: YYYY-MM-DD (پیش‌فرض: امروز)
        """
        birth = datetime.strptime(birth_date, "%Y-%m-%d")

        if target_date:
            target = datetime.strptime(target_date, "%Y-%m-%d")
        else:
            target = datetime.now()

        days = (target - birth).days

        if days < 0:
            raise ValueError("تاریخ هدف قبل از تاریخ تولد است")

        physical = math.sin(2 * math.pi * days / self.PHYSICAL_CYCLE) * 100
        emotional = math.sin(2 * math.pi * days / self.EMOTIONAL_CYCLE) * 100
        intellectual = math.sin(2 * math.pi * days / self.INTELLECTUAL_CYCLE) * 100

        # محاسبه روز بعدی برای نمودار
        next_day_phys = math.sin(2 * math.pi * (days + 1) / self.PHYSICAL_CYCLE) * 100
        next_day_emot = math.sin(2 * math.pi * (days + 1) / self.EMOTIONAL_CYCLE) * 100
        next_day_intl = math.sin(2 * math.pi * (days + 1) / self.INTELLECTUAL_CYCLE) * 100

        return {
            "birth_date": birth_date,
            "target_date": target.strftime("%Y-%m-%d"),
            "days": days,
            "physical": round(physical, 1),
            "emotional": round(emotional, 1),
            "intellectual": round(intellectual, 1),
            "physical_status": self._get_status(physical),
            "emotional_status": self._get_status(emotional),
            "intellectual_status": self._get_status(intellectual),
            "physical_phase": self._get_phase_description(physical),
            "emotional_phase": self._get_phase_description(emotional),
            "intellectual_phase": self._get_phase_description(intellectual),
            "next_day": {
                "physical": round(next_day_phys, 1),
                "emotional": round(next_day_emot, 1),
                "intellectual": round(next_day_intl, 1),
            },
            "birth_day_of_week": ["دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه", "شنبه", "یکشنبه"][birth.weekday()],
        }

    def get_monthly_overview(self, birth_date: str, year: int, month: int) -> Dict:
        """
        نمای کلی بیوریتم برای یک ماه
        """
        import calendar
        days_in_month = calendar.monthrange(year, month)[1]
        daily_data = []

        for day in range(1, days_in_month + 1):
            target = f"{year}-{month:02d}-{day:02d}"
            try:
                result = self.calculate(birth_date, target)
                daily_data.append({
                    "day": day,
                    "physical": result["physical"],
                    "emotional": result["emotional"],
                    "intellectual": result["intellectual"],
                })
            except ValueError:
                continue

        return {
            "birth_date": birth_date,
            "year": year,
            "month": month,
            "days": daily_data,
        }
