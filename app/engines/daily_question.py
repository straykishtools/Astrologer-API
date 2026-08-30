"""
موتور پرسش روزانه (Daily Question) - نسخه پیشرفته
ترکیب ۳ موتور: بیوریتم + سال حیوانی چینی + تاروت
با خروجی ساختاریافته و هوشمندتر
"""

from datetime import datetime
from typing import Dict, Any, List
from app.engines.biorhythm import BiorhythmEngine
from app.engines.chinese_zodiac import ChineseZodiacEngine
from app.engines.tarot import TarotEngine


class DailyQuestionEngine:
    """پاسخ به سوال با ترکیب ۳ موتور به صورت ساختاریافته"""

    def __init__(self):
        self.bio = BiorhythmEngine()
        self.zodiac = ChineseZodiacEngine()
        self.tarot = TarotEngine()
        
        # کلمات کلیدی برای تشخیص حوزه‌های مختلف سوال
        self.topics = {
            "سفر": ["سفر", "مسافرت", "رفتن", "جاده", "مهاجرت"],
            "کار": ["کار", "شغل", "پروژه", "کسب", "درآمد", "تجارت"],
            "عشق": ["عشق", "رابطه", "ازدواج", "دوست", "همسر", "دل"],
            "سلامت": ["سلامت", "بیماری", "بدن", "ورزش", "رژیم"],
            "مالی": ["مال", "پول", "سرمایه", "خرید", "فروش", "قرض"],
            "تحصیل": ["تحصیل", "دانشگاه", "مدرسه", "کلاس", "آموزش", "یادگیری"],
            "خانواده": ["خانواده", "فرزند", "پدر", "مادر", "خواهر", "برادر"],
        }

    def answer(self, question: str, birth_date: str, birth_year: int) -> Dict[str, Any]:
        """
        پاسخ به سوال با ترکیب ۳ موتور به صورت ساختاریافته

        Args:
            question: سوال کاربر
            birth_date: تاریخ تولد (YYYY-MM-DD)
            birth_year: سال تولد (میلادی)

        Returns:
            dict: شامل بخش‌های مجزا برای نمایش در فرانت‌اند
        """
        # ۱. بیوریتم امروز
        bio_result = self.bio.calculate(birth_date)

        # ۲. سال حیوانی چینی
        zodiac_result = self.zodiac.calculate(birth_year)

        # ۳. تاروت (۱ کارت)
        tarot_result = self.tarot.draw_cards(1)[0]

        # ۴. محاسبه انرژی کلی
        avg_energy = self._calculate_avg_energy(bio_result)
        topic = self._detect_topic(question)
        is_reversed = tarot_result.get("is_reversed", False)

        # ۵. ساخت بخش‌های پاسخ
        sections = [
            self._build_biorhythm_section(bio_result, avg_energy),
            self._build_zodiac_section(zodiac_result),
            self._build_tarot_section(tarot_result),
            self._build_summary_section(question, topic, avg_energy, zodiac_result, is_reversed),
        ]

        return {
            "question": question,
            "date": datetime.now().strftime("%Y-%m-%d"),
            "sections": sections,
            "raw": {  # برای دیباگ
                "biorhythm": bio_result,
                "zodiac": zodiac_result,
                "tarot": tarot_result,
            },
        }

    def _calculate_avg_energy(self, bio: dict) -> float:
        """محاسبه میانگین انرژی از سه چرخه بیوریتم"""
        phys = bio["physical"]
        emot = bio["emotional"]
        intl = bio["intellectual"]
        return (phys + emot + intl) / 3

    def _detect_topic(self, question: str) -> str:
        """تشخیص حوزه‌ی سوال بر اساس کلمات کلیدی"""
        q_lower = question.lower()
        for topic, keywords in self.topics.items():
            for keyword in keywords:
                if keyword in q_lower:
                    return topic
        return "عمومی"

    def _get_energy_level(self, avg: float) -> dict:
        """تبدیل انرژی عددی به سطح و رنگ"""
        if avg > 60:
            return {"label": "بسیار عالی 🔥", "color": "#00b894", "level": "high"}
        elif avg > 25:
            return {"label": "خوب ✅", "color": "#fdcb6e", "level": "good"}
        elif avg > -10:
            return {"label": "معمولی ⚖️", "color": "#e17055", "level": "moderate"}
        elif avg > -50:
            return {"label": "ضعیف ⚠️", "color": "#d63031", "level": "low"}
        else:
            return {"label": "بسیار ضعیف 🛑", "color": "#6c5ce7", "level": "very_low"}

    def _build_biorhythm_section(self, bio: dict, avg_energy: float) -> dict:
        """ساخت بخش بیوریتم"""
        energy_level = self._get_energy_level(avg_energy)
        return {
            "type": "biorhythm",
            "icon": "🔬",
            "title": "بیوریتم امروز",
            "data": {
                "physical": f"{bio['physical_status']} ({bio['physical']:.1f}%)",
                "emotional": f"{bio['emotional_status']} ({bio['emotional']:.1f}%)",
                "intellectual": f"{bio['intellectual_status']} ({bio['intellectual']:.1f}%)",
                "overall": energy_level["label"],
                "color": energy_level["color"],
            }
        }

    def _build_zodiac_section(self, zodiac: dict) -> dict:
        """ساخت بخش سال حیوانی"""
        return {
            "type": "zodiac",
            "icon": "🐉",
            "title": "سال حیوانی شما",
            "data": {
                "animal": zodiac["animal"],
                "element": zodiac["element"],
                "emoji": zodiac["animal_emoji"],
                "personality": zodiac.get("personality", "پر انرژی، اجتماعی و خوش‌بین"),
                "compatibility": self._format_compatibility(zodiac.get("compatibility", {})),
                "description": zodiac["description"],
            }
        }

    def _format_compatibility(self, compatibility: dict) -> str:
        """فرمت کردن دیکشنری سازگاری به رشته خوانا"""
        if not compatibility or not isinstance(compatibility, dict):
            return ""
        parts = []
        best = compatibility.get("best_matches", [])
        good = compatibility.get("good_matches", [])
        avoid = compatibility.get("avoid", [])
        if best:
            parts.append("بهترین: " + "، ".join(best[:3]))
        if good:
            parts.append("خوب: " + "، ".join(good[:3]))
        if avoid:
            parts.append("اجتناب: " + "، ".join(avoid[:3]))
        return " | ".join(parts)

    def _build_tarot_section(self, tarot: dict) -> dict:
        """ساخت بخش تاروت"""
        card = tarot.get("card", {})
        is_rev = tarot.get("is_reversed", False)
        direction = "وارونه 🔄" if is_rev else "راست ⬆️"
        return {
            "type": "tarot",
            "icon": "🃏",
            "title": "کارت راهنمای امروز",
            "data": {
                "name": card.get("name", "ناشناس"),
                "direction": direction,
                "meaning": tarot.get("meaning", ""),
                "keywords": tarot.get("keywords", ""),
                "is_reversed": is_rev,
                "image": card.get("image", ""),
            }
        }

    def _build_summary_section(self, question: str, topic: str, avg_energy: float, zodiac: dict, is_reversed: bool) -> dict:
        """ساخت بخش جمع‌بندی هوشمند"""
        energy_level = self._get_energy_level(avg_energy)
        animal = zodiac.get("animal", "")
        element = zodiac.get("element", "")
        
        # پاسخ پایه بر اساس حوزه
        topic_advice = self._get_topic_advice(topic, avg_energy, is_reversed)
        
        # توصیه بر اساس حیوان
        animal_advice = self._get_animal_advice(animal)
        
        # ترکیب نهایی
        summary = f"{topic_advice}\n\n✨ {animal_advice}"
        
        # افزودن توصیه‌ی ویژه بر اساس انرژی
        if avg_energy > 40:
            summary += "\n\n🔥 امروز روز خوبی برای اقدامات بزرگ است."
        elif avg_energy < -30:
            summary += "\n\n🌙 امروز بیشتر به فکر استراحت و بازنگری باشید."

        return {
            "type": "summary",
            "icon": "✨",
            "title": "جمع‌بندی و توصیه",
            "data": {
                "text": summary,
                "energy_level": energy_level["label"],
                "topic": topic,
            }
        }

    def _get_topic_advice(self, topic: str, avg_energy: float, is_reversed: bool) -> str:
        """تولید توصیه بر اساس حوزه‌ی سوال"""
        energy_word = "بالایی" if avg_energy > 25 else "متوسطی" if avg_energy > -10 else "پایینی"
        energy_advice = "از این انرژی استفاده کنید" if avg_energy > 25 else "با برنامه‌ریزی پیش بروید" if avg_energy > -10 else "صبور باشید و عجولانه عمل نکنید"
        
        base = f"برای سوال شما انرژی {energy_word} دارید. {energy_advice}."
        
        topic_map = {
            "سفر": f"\n\n🧳 درباره سفر: {'مسیر باز و مناسبی پیش روی شماست' if avg_energy > 20 and not is_reversed else 'با احتیاط بیشتری برنامه‌ریزی کنید'}.",
            "کار": f"\n\n💼 درباره کار: {'زمان خوبی برای شروع پروژه‌های جدید است' if avg_energy > 30 else 'بهتر است روی کارهای جاری تمرکز کنید'}.",
            "عشق": f"\n\n❤️ درباره رابطه: {'ارتباط خوبی با دیگران برقرار خواهید کرد' if not is_reversed else 'ممکن است سوءتفاهم‌هایی پیش بیاید — صبور باشید'}.",
            "سلامت": "\n\n🩺 مراقبت از سلامت خود را در اولویت قرار دهید.",
            "مالی": f"\n\n💰 درباره پول: {'زمان مناسبی برای سرمایه‌گذاری‌های حساب‌شده است' if avg_energy > 20 else 'بهتر است در خرج کردن محتاط باشید'}.",
            "تحصیل": "\n\n📚 ذهن شما برای یادگیری آماده است — مطالعه و تمرکز را جدی بگیرید.",
            "خانواده": "\n\n👨‍👩‍👧‍👦 امروز را به خانواده اختصاص دهید — ارتباط عاطفی تقویت می‌شود.",
        }
        
        advice = topic_map.get(topic, "\n\n💡 به حس درونی خود اعتماد کنید و با آرامش تصمیم بگیرید.")
        return base + advice

    def _get_animal_advice(self, animal: str) -> str:
        """توصیه بر اساس حیوان سال تولد"""
        animal_advice = {
            "اژدها": "شما ذاتاً رهبر هستید — به شهود خود اعتماد کنید و جلو بروید.",
            "ببر": "شجاع و پرانرژی هستید — امروز زمان ایده‌های بزرگ است.",
            "موش": "هوشمند و چابک هستید — از فرصت‌های کوچک غافل نشوید.",
            "خرگوش": "صلح‌طلب و محتاط هستید — هماهنگی با دیگران کلید موفقیت شماست.",
            "بز": "خلاق و هنرمند هستید — امروز به دنبال الهام باشید.",
            "گراز": "صادق و پایدار هستید — پشتکار شما نتیجه خواهد داد.",
            "اسب": "پرانرژی و اجتماعی هستید — از این انرژی در مسیر درست استفاده کنید.",
            "مار": "عاقل و باهوش هستید — امروز زمان تصمیم‌گیری‌های کلیدی است.",
            "خروس": "سخت‌کوش و دقیق هستید — برنامه‌ریزی کنید و عمل کنید.",
            "گاو": "قابل‌اعتماد و صبور هستید — پشتکار شما موفقیت می‌آورد.",
            "سگ": "وفادار و صادق هستید — روابط خود را تقویت کنید.",
            "میمون": "باهوش و شوخ هستید — امروز زمان خلاقیت و نوآوری است.",
        }
        return animal_advice.get(animal, "به حس درونی خود اعتماد کنید.")