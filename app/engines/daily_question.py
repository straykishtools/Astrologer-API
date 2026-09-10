"""
موتور پرسش روزانه (Daily Question) - نسخه پیشرفته
ترکیب ۳ موتور: بیوریتم + سال حیوانی چینی + تاروت
با خروجی ساختاریافته و پاسخ‌های متنوع (بر اساس سال + روزِ ماه + کارت کشیده‌شده)
"""

import random
from datetime import datetime
from typing import Dict, Any, List
from app.engines.biorhythm import BiorhythmEngine
from app.engines.chinese_zodiac import ChineseZodiacEngine
from app.engines.tarot import TarotEngine


class DailyQuestionEngine:
    """پاسخ به سوال با ترکیب ۳ موتور به صورت ساختاریافته — با تنوع پاسخ"""

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
        پاسخ به سوال با ترکیب ۳ موتور — با seedِ روزانه برای تنوعِ پایدار در یک روز
        (یک روز = یک پاسخ؛ فردا پاسخِ متفاوت)
        """
        # seed روزانه برای تنوعِ پایدار در طولِ روز
        today_seed = datetime.now().strftime("%Y%m%d") + str(birth_year)
        rng = random.Random(today_seed)

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
            self._build_summary_section(question, topic, avg_energy, zodiac_result, is_reversed, rng),
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

    def _build_summary_section(self, question: str, topic: str, avg_energy: float, zodiac: dict, is_reversed: bool, rng) -> dict:
        """ساخت بخش جمع‌بندی هوشمند — با تنوعِ پاسخ"""
        energy_level = self._get_energy_level(avg_energy)
        animal = zodiac.get("animal", "")

        # پاسخ پایه بر اساس حوزه (با تنوع)
        topic_advice = self._get_topic_advice(topic, avg_energy, is_reversed, rng)

        # توصیه بر اساس حیوان (با تنوع)
        animal_advice = self._get_animal_advice(animal, rng)

        # پیامِ کارت تاروت (جدید: اتصالِ کارت به توصیه)
        tarot_line = self._get_tarot_line(topic, is_reversed, rng)

        # ترکیب نهایی
        summary = f"{topic_advice}\n\n🃏 {tarot_line}\n\n✨ {animal_advice}"

        # افزودن توصیه‌ی ویژه بر اساس انرژی — با تنوع
        energy_closers_high = [
            "\n\n🔥 امروز روزِ اقداماتِ بزرگ است — آن پروژه‌ی معوقه را شروع کن.",
            "\n\n🔥 انرژیِ امروز، سوختِ جهش است؛ از آن برایِ قدمِ بلند استفاده کن.",
            "\n\n🔥 روزِ پرتوانیست — لیستِ کارهایِ ترسناکت را امروز خط بزن.",
        ]
        energy_closers_low = [
            "\n\n🌙 امروزِ بازنگری و استراحت است — به خودت فشار نیاور.",
            "\n\n🌙 بدنت سیگنالِ تعطیل داده؛ گوش بده و سبک پیش برو.",
            "\n\n🌙 امروز برایِ جمع‌کردنِ انرژی است، نه خرج‌کردنش.",
        ]
        if avg_energy > 40:
            summary += rng.choice(energy_closers_high)
        elif avg_energy < -30:
            summary += rng.choice(energy_closers_low)

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

    def _get_tarot_line(self, topic: str, is_reversed: bool, rng) -> str:
        """جمله‌ی اتصالِ کارتِ تاروت به سؤال — با تنوع"""
        if is_reversed:
            lines = [
                "کارتِ امروز وارونه است: انرژیِ آن مسدود یا معکوس شده — حوزه‌ی سؤالت را با نگاهِ تازه بررسی کن.",
                "کارتِ وارونه هشدار می‌دهد: عجله نکن؛ زیرِ سطحِ ماجرا چیزی است که باید ببینی.",
                "وارونگیِ کارت یعنی درسِ ناتمام — این‌بار با آگاهیِ بیشتر به آن نزدیک شو.",
            ]
        else:
            lines = [
                "کارتِ امروز راست است: انرژی‌اش در حمایتِ مسیرِ توست — جلو برو.",
                "کارتِ راست، چراغِ سبزِ آسمان است: شرایط برایِ قدمِ بعدی آماده‌اند.",
                "این کارت تأیید می‌کند که در مسیرِ درست هستی؛ ادامه بده.",
            ]
        return rng.choice(lines)

    def _get_topic_advice(self, topic: str, avg_energy: float, is_reversed: bool, rng) -> str:
        """تولید توصیه بر اساس حوزه‌ی سوال — با ۳+ واریانت برای هر حوزه"""
        high = avg_energy > 25
        mid = -10 < avg_energy <= 25

        # توصیه‌های متنوع برای هر حوزه × سه وضعیتِ انرژی
        topic_variants = {
            "سفر": {
                "high": ["🧳 سفر: جاده‌ها بازند — برنامه‌ریزیِ سفرِ نزدیک مبارک است، حتی سفرهایِ کوتاهِ ناگهانی.",
                         "🧳 سفر: بادِ مساعد می‌وزد؛ آن مقصدی که مدت‌ها در سر داشتی، الان وقتشه.",
                         "🧳 سفر: انرژیِ حرکت بالا است — بلیط بگیر پیش از اینکه قیمت‌ها بالا برود."],
                "mid": ["🧳 سفر: مسیر باز است اما عجله نکن — مقدمات را آرام بچین.",
                        "🧳 سفر: برنامه بده اما تاریخِ قطعی را فعلاً رزرو نکن؛ زمانِ بهتر در راه است."],
                "low": ["🧳 سفر: این روزها سفرِ سنگین توصیه نمی‌شود؛ سفرِ کوتاهِ نزدیک جایگزینِ خوبی است.",
                        "🧳 سفر: تعویقِ یک‌هفته‌ای، هم هزینه‌ات را کم می‌کند هم لذتِ سفرت را بیشتر."],
            },
            "کار": {
                "high": ["💼 کار: بهترین روزِ چرخه برایِ پیشنهاد، مذاکره یا شروعِ پروژه — بزن بریم!",
                         "💼 کار: دیدِ مدیریتی‌ات امروز تیز است؛ جلسه‌ی مهم را برایِ همین روز بگذار.",
                         "💼 کار: ایده‌ای که مدت‌ها در ذهنت بود، امروز بالاخره تایید می‌گیرد — ارائه بده."],
                "mid": ["💼 کار: رویِ کامل‌کردنِ کارهایِ نیمه‌تمام تمرکز کن؛ شروعِ جدید فعلاً نگاه دار.",
                        "💼 کار: روزِ ثبات است — به‌جای جهش، بهینه‌سازی کن."],
                "low": ["💼 کار: امروزِ پاسخ‌دادن و نظم است، نه ابداع؛ تویِ باکس کار کن و فردا بجنگ.",
                        "💼 کار: جلساتِ حساس را اگر می‌توانی جابه‌جا کن؛ ذهنت امروزِ فرم نیست."],
            },
            "عشق": {
                "high": ["❤️ عشق: قلبت امروز گشوده است — قدمِ اول را بگذار یا قرارِ دل‌به‌دل بگذار.",
                         "❤️ عشق: کلماتِ مهرآمیز امروز جادو دارند؛ حرفِ دلت را بزن.",
                         "❤️ عشق: جذابیت‌ات اوج دارد — هر جمعی که بروی، دیده می‌شوی."],
                "mid": ["❤️ عشق: آرامشِ عاطفیِ خوبی داری — وقتِ خوبی برایِ عمیق‌کردنِ رابطه‌ی فعلی است.",
                        "❤️ عشق: هیچ عجله‌ای لازم نیست؛ حضورِ پیوسته بیشتر از حرکاتِ بزرگ اثر دارد."],
                "low": ["❤️ عشق: حساسیت‌ها بالاست — قضاوتِ زودهنگام نکن و حرف‌ها را نگیر به دل.",
                        "❤️ عشق: امروزِ شنیدن است نه گفتن؛ شریکت شاید حرفی دارد که نشنیده‌ای."],
            },
            "سلامت": {
                "high": ["🩺 سلامت: بدنت آماده‌ی رکورد است — تمرینِ سنگین و ورزشِ جدید، عالی‌اند.",
                         "🩺 سلامت: انرژیِ ترمیم بالا است؛ حتی بهبودِ عادت‌های قدیمی هم امروز راحت است."],
                "mid": ["🩺 سلامت: ادامه‌ی روتینِ سلامت — ثبات، بیشتر از شدت اثر می‌کند.",
                        "🩺 سلامت: بدن می‌گوید همین‌طور خوبی؛ فقط آب و خواب را جدی بگیر."],
                "low": ["🩺 سلامت: بدن در حالِ بازسازی است — خواب و غذایِ گرم را اولویت بده.",
                        "🩺 سلامت: امروزِ استراحتِ فعال است: پیاده‌رویِ سبک، کشش، نفسِ عمیق."],
            },
            "مالی": {
                "high": ["💰 مالی: فرصتِ مالیِ خوبی سرِ راه است — پیشنهادها را جدی بگیر.",
                         "💰 مالی: مذاکره‌ی حقوق یا قیمت، امروز به نفعِ تو تمام می‌شود."],
                "mid": ["💰 مالی: وضعیتِ پایدار است — بودجه‌بندی و پس‌اندازِ منظم، امروز بیشتر از سرمایه‌گذاریِ جدید جواب می‌دهد."],
                "low": ["💰 مالی: امروزِ خریدِ هیجانی نیست؛ هر خریدِ بالایِ ضرورت را ۲۴ ساعت به تعویق بینداز.",
                        "💰 مالی: از وام و بدهیِ جدید پرهیز کن — شرایط فعلاً به نفعِ تو نیست."],
            },
            "تحصیل": {
                "high": ["📚 تحصیل: ذهنت امروزِ طلایی است — سخت‌ترین مطلب را برایِ همین ساعت نگه داشته باش.",
                         "📚 تحصیل: یادگیریِ سریع امروز رخ می‌دهد — امتحان و مرورِ فشرده عالی‌اند."],
                "mid": ["📚 تحصیل: مطالعه‌ی منظمِ امروز پایدار است — تایم‌بلاک بگذار و برو."],
                "low": ["📚 تحصیل: حفظیات امروز سخت جا می‌شود؛ فهمِ مفهومی و خلاصه‌نویسی بهتر جواب می‌دهد."],
            },
            "خانواده": {
                "high": ["👨‍👩‍👧‍👦 خانواده: انرژیِ خوبی برایِ حلِ اختلافِ قدیمی یا مهمانیِ خانوادگی داری.",
                         "👨‍👩‍👧‍👦 خانواده: حرفِ دل با پدر/مادر بزن — امروز شنیده می‌شوی."],
                "mid": ["👨‍👩‍👧‍👦 خانواده: یک تماسِ ساده با عزیزان، امروز هم برایِ تو هم برایشان روز را می‌سازد."],
                "low": ["👨‍👩‍👧‍👦 خانواده: بحث‌های حساسِ خانوادگی را فعلاً به بعد موکول کن؛ امروزِ مهرِ ساده است."],
            },
        }
        generic_variants = {
            "high": ["💡 به حسِ درونی‌ات اعتماد کن و بزن — آسمان امروز همراهِ جسارت‌هاست.",
                     "💡 مسیرِ روشن است؛ تنها چیزی که لازم است قدمِ اولِ توست."],
            "mid": ["💡 با آرامش تصمیم بگیر؛ عجله نه لازم است نه مفید.",
                    "💡 امروزِ گام‌هایِ کوچکِ محکم است — همان‌ها که کوه را جابه‌جا می‌کنند."],
            "low": ["💡 امروزِ گوش‌دادن به بدن و دل است؛ پاسخ‌ها فردا روشن‌تر می‌آیند.",
                    "💡 خودت را مجبور به قطعیت نکن — تعلیقِ آگاهانه هم نوعی پاسخ است."],
        }
        variants = topic_variants.get(topic, {}).get(
            "high" if high else ("mid" if mid else "low"), []
        ) or generic_variants["high" if high else ("mid" if mid else "low")]

        energy_word = "بالایی" if high else "متوسطی" if mid else "پایینی"
        energy_advice = "از این انرژی استفاده کنید" if high else "با برنامه‌ریزی پیش بروید" if mid else "صبور باشید و عجولانه عمل نکنید"

        base = f"برای سوال شما انرژی {energy_word} دارید. {energy_advice}."
        advice = rng.choice(variants) if variants else ""
        return base + ("\n\n" + advice if advice else "")

    def _get_animal_advice(self, animal: str, rng) -> str:
        """توصیه بر اساس حیوان سال تولد — ۲-۳ واریانت برای هر حیوان"""
        animal_advice = {
            "اژدها": ["شما ذاتاً رهبر هستید — به شهود خود اعتماد کنید و جلو بروید.",
                      "بختِ اژدهایی‌ات امروز بیدار است — بلندپروازی‌ات را کوچک نکن.",
                      "شکوهِ اژدها با توست؛ فقط یادت باشد بزرگ‌مردی هم بخشی از بزرگی است."],
            "ببر": ["شجاع و پرانرژی هستید — امروز زمان ایده‌های بزرگ است.",
                    "پنجه‌ی ببر را امروز نیاز دارید؛ ترس‌هایِ کوچک را بترکان.",
                    "کاریزمای ببرگونه‌ات درها را باز می‌کند — وارد شو."],
            "موش": ["هوشمند و چابک هستید — از فرصت‌های کوچک غافل نشوید.",
                    "چشمِ تیزِ موش امروز فرصتی می‌بیند که دیگران نمی‌بینند — دقت کن.",
                    "ذکاوتِ موش‌وارت را به کار بگیر؛ راهِ هوشمندانه کوتاه‌تر است."],
            "خرگوش": ["صلح‌طلب و محتاط هستید — هماهنگی با دیگران کلید موفقیت شماست.",
                      "شانسِ آرامِ خرگوش امروز همراهت است — با نرمی بگیرش.",
                      "لطافتِ تو امروز سلاح است؛ سختی را با مهربانی باز کن."],
            "بز": ["خلاق و هنرمند هستید — امروز به دنبال الهام باشید.",
                   "ذوقِ بزی‌ات امروز رنگِ تازه‌ای دارد — بساز و بنویس.",
                   "دلت نرم است و دنیا را نرم می‌بیند؛ از همین شروع کن."],
            "گراز": ["صادق و پایدار هستید — پشتکار شما نتیجه خواهد داد.",
                     "سخاوتِ گرازگونه‌ات امروز به خودت هم برسد؛ خودت هم مستحقِ مراقبتی.",
                     "بی‌ادعایی‌ات گنج است — ادامه بده، دیر یا زود دیده می‌شود."],
            "اسب": ["پرانرژی و اجتماعی هستید — از این انرژی در مسیر درست استفاده کنید.",
                    "یال‌هایت را تکان بده؛ حرکتِ امروز، درمانِ دیروز است.",
                    "آزادی‌ات را با تعهد جمع کن — اسبِ بالغ می‌داند کی بماند."],
            "مار": ["عاقل و باهوش هستید — امروز زمان تصمیم‌گیری‌های کلیدی است.",
                    "شهودِ مارگونه‌ات امروز بی‌خطاست — به اولین حس اعتماد کن.",
                    "سکوتِ هوشمندانه‌ات امروز قدرت است — کم بگو، دقیق ببین."],
            "خروس": ["سخت‌کوش و دقیق هستید — برنامه‌ریزی کنید و عمل کنید.",
                     "خروس‌خوانِ امروزِ توست: زود بیدار شو، شروع کن، فرصت مالِ سحرخیزهاست.",
                     "دقتِ خروس‌وارت امتیازِ برنده است — جزئیات را فدای سرعت نکن."],
            "گاو": ["قابل‌اعتماد و صبور هستید — پشتکار شما موفقیت می‌آورد.",
                    "قدرتِ خاموشِ گاوت امروز زمین را شخم می‌زند — ادامه بده.",
                    "صداقتت امروز پاداشِ غیرمنتظره دارد — همان‌طور بمان."],
            "سگ": ["وفادار و صادق هستید — روابط خود را تقویت کنید.",
                   "وفاداری‌ات امروز از زبانِ یکی می‌شنوی — گرمت می‌شود.",
                   "حسِ محافظتی‌ات امروز لازم است؛ کسی به سایه‌ی تو نیاز دارد."],
            "میمون": ["باهوش و شوخ هستید — امروز زمان خلاقیت و نوآوری است.",
                      "زیرکیِ میمونی‌ات امروز راهِ میان‌بر پیدا می‌کند — استفاده کن.",
                      "طنزت امروز آشتی‌دهنده و نجات‌بخش است — بخند و بخندان."],
        }
        variants = animal_advice.get(animal, ["به حس درونی خود اعتماد کنید."])
        return rng.choice(variants)