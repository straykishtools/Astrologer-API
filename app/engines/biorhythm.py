"""
موتور بیوریتم (Biorhythm)
نظریه: زندگی انسان تحت چرخه‌های زیستیِ منظم است که از لحظه تولد آغاز و
به شکل موج سینوسی تا پایان عمر تکرار می‌شود (فلیس & سوبودا، اواخر قرن ۱۹).

چرخه‌های اصلی: جسمانی ۲۳ · احساسی ۲۸ · فکری ۳۳
چرخه‌های فرعی: شهود ۳۸ · تسلط ۴۸ · معنوی ۵۳
فازها: مثبت (شارژ) · منفی (بازسازی) · بحرانی (قطعِ صفر)
"""

import math
from datetime import datetime
from typing import Dict, Optional


class BiorhythmEngine:
    """محاسبه‌گر بیوریتم — چرخه‌های اصلی و فرعی"""

    PHYSICAL_CYCLE = 23
    EMOTIONAL_CYCLE = 28
    INTELLECTUAL_CYCLE = 33
    # چرخه‌های فرعی (ترکیبی)
    INTUITION_CYCLE = 38      # احساسی-جسمانی: شهود
    MASTERY_CYCLE = 48        # فکری-جسمانی: تسلط بر مهارت
    SPIRITUAL_CYCLE = 53      # معنوی: خودآگاهی و آرامش

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

    @staticmethod
    def _get_phase_type(value: float, next_value: float) -> Dict:
        """فاز سه‌گانه: مثبت/منفی/بحرانی + جهت حرکت
        بحرانی = قطعِ خط صفر (عبور از مثبت به منفی یا برعکس)
        """
        crosses_zero = (value > 0 >= next_value) or (value < 0 <= next_value)
        direction = "صعودی 📈" if next_value > value else "نزولی 📉"
        if crosses_zero:
            phase_type = "بحرانی ⚡"
            phase_desc = "روز بحرانی — سیستم زیستی در حال تغییر فاز است. بیشترین ریسکِ خطا و حواس‌پرتی."
        elif value >= 0:
            phase_type = "مثبت (شارژ) ☀️"
            phase_desc = "فاز اوجِ توانایی — انرژی بالا، بهترین زمانِ کارهای مهم."
        else:
            phase_type = "منفی (بازسازی) 🌙"
            phase_desc = "فاز تجدیدِ قوا — نه ضعفِ مطلق؛ بدن و ذهن در حال بازسازی‌اند. کارهای روتین بهتر از ریسک."
        return {"type": phase_type, "desc": phase_desc, "direction": direction, "critical": crosses_zero}

    @staticmethod
    def _day_in_cycle(days: int, cycle: int) -> float:
        """روزِ جاری داخل چرخه: T mod cycle"""
        return days % cycle

    def _combined_interpretation(self, physical: float, emotional: float, intellectual: float,
                                  physical_next: float, emotional_next: float, intellectual_next: float) -> Dict:
        """تفسیر ترکیبی وضعیت سه چرخه + پیشنهاد عملی روز"""
        phys_p = self._get_phase_type(physical, physical_next)
        emo_p = self._get_phase_type(emotional, emotional_next)
        int_p = self._get_phase_type(intellectual, intellectual_next)

        critical_count = sum(1 for p in (phys_p, emo_p, int_p) if p["critical"])
        pos_count = sum(1 for p in (phys_p, emo_p, int_p) if p["type"].startswith("مثبت"))
        neg_count = sum(1 for p in (phys_p, emo_p, int_p) if p["type"].startswith("منفی"))

        # تفسیر کلِ روز
        if critical_count >= 2:
            headline = "روزِ دوقطبی ⚡⚡"
            summary = f"{critical_count} چرخه هم‌زمان در حال تغییر فازند — پرریسک‌ترین روزِ چرخه. مراقبتِ مضاعف، رانندگیِ دقیق، و تصمیمِ نگیر."
        elif critical_count == 1:
            headline = "روزِ مرزی ⚡"
            summary = "یکی از چرخه‌ها در حال تغییر فاز است — در آن حوزه محتاط باش؛ بقیه چرخه‌ها کمک می‌کنند."
        elif pos_count == 3:
            headline = "روزِ طلایی ✨"
            summary = "هر سه چرخه در فاز مثبت — بهترین روزِ چرخه برایِ شروعِ کار بزرگ، تصمیم مهم و تلاشِ سنگین."
        elif pos_count == 2:
            headline = "روزِ پُر 🌤️"
            summary = "دو چرخه مثبت‌اند؛ سواری خوب است — کارِ اصلی را امروز لنگر بینداز."
        elif neg_count == 3:
            headline = "روزِ استراحت 🌙"
            summary = "هر سه چرخه در بازسازی‌اند — نه شکست؛ امروزِ تعمیر است. استراحتِ هدفمند، مرور و برنامه‌ریزی."
        elif neg_count == 2:
            headline = "روزِ سبک 🌥️"
            summary = "دو چرخه در بازسازی — امروز را سبک بگیر؛ فقط یک حوزه انرژی دارد، همان را پرکار کن."
        else:
            headline = "روزِ متعادل ⚖️"
            summary = "ترکیبی از فازها — کارهای متعادلی انتخاب کن و به سیگنالِ بدن گوش بده."

        # پیشنهادهای عملی بر اساس ترکیب
        suggestions = []
        if physical > 30:
            suggestions.append("💪 بدن در فرم است: ورزشِ سنگین، کارِ فیزیکی، یا ماجراجوییِ جسمانی برای امروز عالی است.")
        elif physical < -30:
            suggestions.append("🛌 بدن در بازسازی است: تمرینِ سبک، کشش و خوابِ کافی را اولویت بده — رکورد نزن.")
        if abs(physical) < 10:
            suggestions.append("⚡ روزِ بحرانیِ جسمی: مراقبِ آسیبِ ورزشی و حواس‌پرتیِ فیزیکی باش؛ رانندگیِ محتاطانه.")

        if emotional > 30:
            suggestions.append("💕 دل در فازِ باز است: گفت‌وگوهای مهم، آشتی، ابرازِ عشق، و هنرِ احساسی — امروز دلبر می‌شوی.")
        elif emotional < -30:
            suggestions.append("🧘 احساسات در بازسازی: تنهاییِ آرام، مدیتیشن و پرهیز از دعوا و تصمیمِ عاطفیِ بزرگ.")
        if abs(emotional) < 10:
            suggestions.append("⚡ روزِ بحرانیِ احساسی: واکنش‌های ناگهانی ممکن است — قبل از پاسخ، نفس بکش و بشمار.")

        if intellectual > 30:
            suggestions.append("🧠 ذهن در اوج: یادگیریِ مطلبِ دشوار، امتحان، مذاکره و تصمیمِ استراتژیک — امروز ذهنِ تو برنده است.")
        elif intellectual < -30:
            suggestions.append("📝 ذهن در بازسازی: کارهای روتینِ آشنا بهتر از حلِ مسئله‌ی جدید است؛ یادداشتِ جزئیات را جدی بگیر.")
        if abs(intellectual) < 10:
            suggestions.append("⚡ روزِ بحرانیِ فکری: امضای قرارداد و تصمیمِ مالی را اگر می‌توانی به فردا ببر.")

        # ترکیب‌های خاص
        if physical > 30 and intellectual > 30:
            suggestions.append("🏆 ذهن و بدن هم‌زمان در اوج: روزِ ایده‌آل برایِ ورزشِ حرفه‌ای، اجرا و هر مهارتِ پیچیده‌ی جسمی-ذهنی.")
        if emotional > 30 and intellectual > 30:
            suggestions.append("🎨 قلب و مغز هم‌راستا: روزِ نویسندگی، سخنوری، و هر هنری که هم احساس می‌خواهد هم منطق.")
        if physical < -30 and emotional < -30:
            suggestions.append("🌙 دو چرخه در بازسازی: امروزِ خودمهربانی است — به خودت مثلِ دوستت رفتار کن.")

        return {
            "headline": headline,
            "summary": summary,
            "phases": {
                "physical": phys_p,
                "emotional": emo_p,
                "intellectual": int_p,
            },
            "suggestions": suggestions[:6],
            "critical_count": critical_count,
        }

    def calculate(self, birth_date: str, target_date: Optional[str] = None) -> Dict:
        """
        محاسبه‌ی بیوریتم در تاریخ هدف — با چرخه‌های فرعی و تفسیر ترکیبی
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

        # چرخه‌های فرعی
        intuition = math.sin(2 * math.pi * days / self.INTUITION_CYCLE) * 100
        mastery = math.sin(2 * math.pi * days / self.MASTERY_CYCLE) * 100
        spiritual = math.sin(2 * math.pi * days / self.SPIRITUAL_CYCLE) * 100

        # روز بعد برای جهت فاز
        next_day_phys = math.sin(2 * math.pi * (days + 1) / self.PHYSICAL_CYCLE) * 100
        next_day_emot = math.sin(2 * math.pi * (days + 1) / self.EMOTIONAL_CYCLE) * 100
        next_day_intl = math.sin(2 * math.pi * (days + 1) / self.INTELLECTUAL_CYCLE) * 100

        # روزِ داخل چرخه + روزهای اوج/بحرانی/کفِ پیش‌رو
        def cycle_info(days: int, cycle: int, current: float, nxt: float) -> Dict:
            pos_in = self._day_in_cycle(days, cycle)
            half = cycle / 2
            # روزِ فاز بعدی: تا کجا مانده
            if current >= 0:
                to_zero = (half - pos_in) if pos_in < half else (cycle - pos_in + half)
            else:
                to_zero = (cycle - pos_in) if pos_in >= half else (half - pos_in)
            return {
                "position_in_cycle": round(pos_in, 1),
                "cycle_length": cycle,
                "days_to_critical": round(to_zero, 1),
                "peak_day": round(cycle / 4, 2),
                "critical_day": "0 و " + str(round(half, 2)),
                "trough_day": round(cycle * 3 / 4, 2),
            }

        combined = self._combined_interpretation(
            physical, emotional, intellectual,
            next_day_phys, next_day_emot, next_day_intl
        )

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
            "physical_phase_type": combined["phases"]["physical"],
            "emotional_phase_type": combined["phases"]["emotional"],
            "intellectual_phase_type": combined["phases"]["intellectual"],
            "secondary_cycles": {
                "intuition": {
                    "value": round(intuition, 1),
                    "cycle": self.INTUITION_CYCLE,
                    "label": "شهود 🌟",
                    "desc": "درکِ شهودی و احساساتِ درونی — این چرخه در حالِ بالا باشد، «حسم می‌گه» اغلب درست از آب درمی‌آید.",
                },
                "mastery": {
                    "value": round(mastery, 1),
                    "cycle": self.MASTERY_CYCLE,
                    "label": "تسلط 🎯",
                    "desc": "هماهنگیِ ذهن و بدن در مهارت‌های پیچیده — ورزشِ حرفه‌ای، جراحی، نوازندگی.",
                },
                "spiritual": {
                    "value": round(spiritual, 1),
                    "cycle": self.SPIRITUAL_CYCLE,
                    "label": "معنویت 🕊️",
                    "desc": "خودآگاهی و آرامشِ درونی — اوجش برایِ مدیتیشن و تأملِ عمیق است.",
                },
            },
            "combined": {
                "headline": combined["headline"],
                "summary": combined["summary"],
                "suggestions": combined["suggestions"],
                "critical_count": combined["critical_count"],
            },
            "cycle_details": {
                "physical": cycle_info(days, self.PHYSICAL_CYCLE, physical, next_day_phys),
                "emotional": cycle_info(days, self.EMOTIONAL_CYCLE, emotional, next_day_emot),
                "intellectual": cycle_info(days, self.INTELLECTUAL_CYCLE, intellectual, next_day_intl),
            },
            "next_day": {
                "physical": round(next_day_phys, 1),
                "emotional": round(next_day_emot, 1),
                "intellectual": round(next_day_intl, 1),
            },
            "birth_day_of_week": ["دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه", "شنبه", "یکشنبه"][birth.weekday()],
        }

    def get_monthly_overview(self, birth_date: str, year: int, month: int) -> Dict:
        """
        نمای کلی بیوریتم برای یک ماه — شامل روزهای بحرانی
        """
        import calendar
        days_in_month = calendar.monthrange(year, month)[1]
        daily_data = []
        critical_days = []

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
                # روزهای بحرانی: عبور از صفر
                if daily_data and len(daily_data) > 1:
                    prev = daily_data[-2]
                    curr = daily_data[-1]
                    for k in ("physical", "emotional", "intellectual"):
                        if (prev[k] > 0 >= curr[k]) or (prev[k] < 0 <= curr[k]):
                            names = {"physical": "جسمی 💪", "emotional": "احساسی 💕", "intellectual": "ذهنی 🧠"}
                            critical_days.append({"day": day, "cycle": names[k]})
            except ValueError:
                continue

        return {
            "birth_date": birth_date,
            "year": year,
            "month": month,
            "days": daily_data,
            "critical_days": critical_days,
        }
