"""
موتور پرسش روزانه (Daily Question)
ترکیب ۳ موتور: بیوریتم + سال حیوانی چینی + تاروت
"""

from datetime import datetime
from app.engines.biorhythm import BiorhythmEngine
from app.engines.chinese_zodiac import ChineseZodiacEngine
from app.engines.tarot import TarotEngine


class DailyQuestionEngine:
    """پاسخ به سوال با ترکیب ۳ موتور"""

    def __init__(self):
        self.bio = BiorhythmEngine()
        self.zodiac = ChineseZodiacEngine()
        self.tarot = TarotEngine()

    def answer(self, question: str, birth_date: str, birth_year: int) -> dict:
        """
        پاسخ به سوال با ترکیب ۳ موتور

        Args:
            question: سوال کاربر
            birth_date: تاریخ تولد (YYYY-MM-DD)
            birth_year: سال تولد (میلادی)
        """
        # ۱. بیوریتم امروز
        bio_result = self.bio.calculate(birth_date)

        # ۲. سال حیوانی چینی
        zodiac_result = self.zodiac.calculate(birth_year)

        # ۳. تاروت (۱ کارت)
        tarot_result = self.tarot.draw_cards(1)[0]

        # ۴. ترکیب نتایج
        response = self._combine_results(question, bio_result, zodiac_result, tarot_result)

        return {
            "question": question,
            "date": datetime.now().strftime("%Y-%m-%d"),
            "response": response,
            "details": {
                "biorhythm": bio_result,
                "zodiac": zodiac_result,
                "tarot": tarot_result,
            },
        }

    def _combine_results(self, question: str, bio: dict, zodiac: dict, tarot: dict) -> str:
        """ترکیب نتایج به صورت یک پاسخ فارسی"""

        parts = []

        # ── بخش بیوریتم ──
        phys = bio["physical"]
        emot = bio["emotional"]
        intl = bio["intellectual"]

        # ترکیب سه چرخه
        avg = (phys + emot + intl) / 3
        if avg > 60:
            bio_summary = "انرژی کلی شما امروز بسیار عالی است 🔥"
        elif avg > 20:
            bio_summary = "انرژی کلی شما امروز خوب است ✅"
        elif avg > -20:
            bio_summary = "انرژی شما امروز معمولی است — بهتر است محتاط باشید ⚖️"
        elif avg > -60:
            bio_summary = "انرژی شما امروز پایین‌تر از حد معمول است ⚠️"
        else:
            bio_summary = "انرژی شما امروز بسیار پایین است — استراحت کنید 🛑"

        parts.append(
            f"🔬 <strong>بیوریتم امروز:</strong>\n"
            f"فیزیکی: {bio['physical_status']} · "
            f"عاطفی: {bio['emotional_status']} · "
            f"ذهنی: {bio['intellectual_status']}\n"
            f"📊 {bio_summary}"
        )

        # ── بخش سال حیوانی ──
        parts.append(
            f"🐉 <strong>انرژی سال حیوانی شما:</strong>\n"
            f"{zodiac['description']} ({zodiac['year']})\n"
            f"شخصیت: {zodiac['personality']}"
        )

        # ── بخش تاروت ──
        card = tarot["card"]
        is_rev = tarot.get("is_reversed", False)
        direction = "وارونه 🔄" if is_rev else "راست ⬆️"
        parts.append(
            f"🃏 <strong>کارت راهنمای امروز:</strong>\n"
            f"{card.get('name', 'ناشناس')} — {direction}\n"
            f"💬 {tarot.get('meaning', '')}\n"
            f"🔑 {tarot.get('keywords', '')}"
        )

        # ── جمع‌بندی کلی ──
        summary = self._build_summary(question, avg, zodiac, is_rev)
        parts.append(f"✨ <strong>جمع‌بندی:</strong>\n{summary}")

        return "\n\n".join(parts)

    def _build_summary(self, question: str, energy_avg: float, zodiac: dict, is_reversed: bool) -> str:
        """ساخت جمع‌بندی بر اساس سوال و وضعیت کلی"""

        q = question.lower()

        # تعیین سطح انرژی
        if energy_avg > 40:
            energy_word = "انرژی بالایی"
            energy_advice = "از این انرژی استفاده کنید"
        elif energy_avg > 0:
            energy_word = "انرژی متوسطی"
            energy_advice = "با برنامه‌ریزی پیش بروید"
        else:
            energy_word = "انرژی پایینی"
            energy_advice = "صبور باشید و عجولانه عمل نکنید"

        # پاسخ بر اساس نوع سوال
        if "سفر" in q:
            base = f"برای سفر شما {energy_word} دارید."
            if is_reversed:
                base += " کارت وارونه نشان‌دهنده‌ی نیاز به احتیاط بیشتر است."
            else:
                base += " کارت صاف نشان‌دهنده‌ی مسیر باز است."
            base += f" {energy_advice}."
        elif "کار" in q or "شغل" in q or "پروژه" in q:
            base = f"برای کار و شغل شما {energy_word} دارید."
            if energy_avg > 30:
                base += " زمان خوبی برای شروع کارهای جدید و اجرای ایده‌هاست."
            else:
                base += " بهتر است روی کارهای جاری تمرکز کنید."
        elif "عشق" in q or "رابطه" in q or "ازدواج" in q or "دوست" in q:
            base = f"در حوزه‌ی رابطه شما {energy_word} دارید."
            if is_reversed:
                base += " ممکن است سوءتفاهم‌هایی پیش بیاید — صبور باشید."
            else:
                base += " ارتباط خوبی با دیگران برقرار خواهید کرد."
        elif "سلامت" in q or "بیماری" in q or "بدن" in q:
            base = f"وضعیت جسمانی شما {energy_word} است."
            base += " مراقبت از سلامت خود را در اولویت قرار دهید."
        elif "مال" in q or "پول" in q or "خرید" in q or "سرمایه" in q:
            base = f"در حوزه‌ی مالی شما {energy_word} دارید."
            if energy_avg > 20:
                base += " زمان مناسبی برای سرمایه‌گذاری‌های حساب‌شده است."
            else:
                base += " بهتر است در خرج کردن محتاط باشید."
        else:
            base = f"برای سوال شما {energy_word} دارید."
            base += f" {energy_advice}."

        # افزودن توصیه نهایی
        animal = zodiac.get("animal", "")
        base += f"\n\n🐾 بر اساس حیوان سال {animal}: "
        if animal in ("اژدها", "ببر", "موش"):
            base += "شما ذاتاً رهبر هستید — به شهود خود اعتماد کنید."
        elif animal in ("خرگوش", "بز", "گراز"):
            base += "شما فردی صلح‌طلب هستید — هماهنگی با دیگران کلید موفقیت شماست."
        elif animal in ("اسب", "مار", "خروس"):
            base += "شما فردی پرانرژی هستید — از این انرژی در مسیر درست استفاده کنید."
        elif animal in ("گاو", "سگ", "میمون"):
            base += "شما فردی قابل‌اعتماد هستید — پشتکار شما نتیجه خواهد داد."
        else:
            base += "به حس درونی خود اعتماد کنید."

        return base


def bio_phys_val(avg: float) -> str:
    """تبدیل میانگین انرژی به وضعیت فارسی"""
    if avg > 60:
        return "عالی"
    elif avg > 20:
        return "خوب"
    elif avg > -20:
        return "معمولی"
    elif avg > -60:
        return "ضعیف"
    return "بسیار ضعیف"
