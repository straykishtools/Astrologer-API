"""
موتور سال حیوانی چینی (Chinese Zodiac)
محاسبه حیوان و عنصر سال تولد + سازگاری
"""


class ChineseZodiacEngine:
    """محاسبه‌گر سال حیوانی چینی"""

    ANIMALS = [
        ("موش", "🐭"), ("گاو", "🐮"), ("ببر", "🐯"), ("خرگوش", "🐰"),
        ("اژدها", "🐲"), ("مار", "🐍"), ("اسب", "🐴"), ("بز", "🐐"),
        ("میمون", "🐵"), ("خروس", "🐔"), ("سگ", "🐶"), ("گراز", "🐷"),
    ]

    ELEMENTS = ["چوب 🌳", "آتش 🔥", "خاک 🏔️", "فلز ⚔️", "آب 🌊"]

    ELEMENT_SHIFT = {0: "چوب", 1: "آتش", 2: "خاک", 3: "فلز", 4: "آب"}

    COMPATIBILITY = {
        "موش": {"best": ["اژدها", "میمون", "گاو"], "good": ["اسب", "خروس", "گراز"], "avoid": ["مار", "خرگوش"]},
        "گاو": {"best": ["مار", "خروس", "موش"], "good": ["ببر", "گراز", "بز"], "avoid": ["اسب", "گاو"]},
        "ببر": {"best": ["اسب", "سگ", "گراز"], "good": ["خروس", "اژدها", "موش"], "avoid": ["مار", "میمون"]},
        "خرگوش": {"best": ["بز", "سگ", "گراز"], "good": ["موش", "خروس", "مار"], "avoid": ["ببر", "اژدها"]},
        "اژدها": {"best": ["موش", "میمون", "خروس"], "good": ["ببر", "مار", "گاو"], "avoid": ["خرگوش", "سگ"]},
        "مار": {"best": ["گاو", "خروس", "بز"], "good": ["ببر", "موش", "گراز"], "avoid": ["اژدها", "اسب"]},
        "اسب": {"best": ["ببر", "سگ", "خرگوش"], "good": ["گاو", "بز", "گراز"], "avoid": ["مار", "بز"]},
        "بز": {"best": ["خرگوش", "گراز", "مار"], "good": ["اسب", "گاو", "ببر"], "avoid": ["سگ", "خروس"]},
        "میمون": {"best": ["موش", "اژدها", "مار"], "good": ["ببر", "خروس", "گراز"], "avoid": ["بز", "سگ"]},
        "خروس": {"best": ["گاو", "مار", "اژدها"], "good": ["ببر", "موش", "سگ"], "avoid": ["بز", "خرگوش"]},
        "سگ": {"best": ["ببر", "خرگوش", "اسب"], "good": ["اژدها", "میمون", "خروس"], "avoid": ["گراز", " موش"]},
        "گراز": {"best": ["خرگوش", "بز", "ببر"], "good": ["موش", "سگ", "مار"], "avoid": ["خروس", "گاو"]},
    }

    PERSONALITIES = {
        "موش": "باهوش، هوشیار، خسیس، جذاب و دوست‌داشتنی",
        "گاو": "صبور، قابل اعتماد، سخت‌کوش، جدی و کمی لجوج",
        "ببر": "شجاع، رقابت‌طلب، قدرتمند، کاریزماتیک و بی‌قریب",
        "خرگوش": "آرام، مودب، محتاط، خوش‌سلیقه و خوش‌شانس",
        "اژدها": "پرانرژی، بلندپرواز، رهبر متولد، قدرتمند و خودشیفته",
        "مار": "عمیق، فیلسوف، بذله‌گو، رازدار و اسرارآمیز",
        "اسب": "پرانرژی، محبوب، پیگیر، خوش‌بین و بی‌صبر",
        "بز": "خلاق، صلح‌طلب، مهربان، هنرمند و حساس",
        "میمون": "باهوش، سرگرم‌کننده، پرانرژی، باهوش و نمایشی",
        "خروس": "pared، مشاهده‌گر، صبور، کمال‌گرا و وظیفه‌شناس",
        "سگ": "وفادار، صادق، قابل اعتماد، عاطفی و بی‌رحم",
        "گراز": "بزرگ‌منش، صبور، خوش‌برخورد، سخاوتمند و بی‌غرض",
    }

    def calculate(self, year: int) -> dict:
        """محاسبه حیوان و عنصر سال تولد"""
        animal_idx = (year - 4) % 12
        element_idx = ((year - 4) % 10) // 2

        animal_name, animal_emoji = self.ANIMALS[animal_idx]
        element_full = self.ELEMENTS[element_idx]
        element_short = self.ELEMENT_SHIFT[element_idx]

        compat = self.COMPATIBILITY.get(animal_name, {})
        personality = self.PERSONALITIES.get(animal_name, "")

        # محاسبه سال بعدی این حیوان
        next_cycle = year + 12
        # محاسبه نزدیک‌ترین سال حیوانی در آینده
        current_year = 2026  # یا datetime.now().year
        next_occurrence = year
        while next_occurrence <= current_year:
            next_occurrence += 12

        return {
            "year": year,
            "animal": animal_name,
            "animal_emoji": animal_emoji,
            "element": element_full,
            "element_short": element_short,
            "description": f"سال {element_full} {animal_name} {animal_emoji}",
            "personality": personality,
            "compatibility": {
                "best_matches": compat.get("best", []),
                "good_matches": compat.get("good", []),
                "avoid": compat.get("avoid", []),
            },
            "next_occurrence": next_occurrence,
            "stem_branch": f"{['چوب','آتش','خاک','فلز','آب'][element_idx]}-{animal_name}",
        }

    def get_compatibility(self, animal1: str, animal2: str) -> dict:
        """بررسی سازگاری بین دو حیوان"""
        compat1 = self.COMPATIBILITY.get(animal1, {})
        compat2 = self.COMPATIBILITY.get(animal2, {})

        # بررسی سطح سازگاری
        if animal2 in compat1.get("best", []) and animal1 in compat2.get("best", []):
            level = "عالی ⭐⭐⭐"
            description = "بهترین ترکیب ممکن! هماهنگی عمیق و طبیعی"
        elif animal2 in compat1.get("best", []) or animal1 in compat2.get("best", []):
            level = "خوب ⭐⭐"
            description = "ترکیب خوب با تفاوت‌های مکمل"
        elif animal2 in compat1.get("good", []) or animal1 in compat2.get("good", []):
            level = "قابل قبول ⭐"
            description = "نیاز به تلاش و درک متقابل"
        elif animal2 in compat1.get("avoid", []) or animal1 in compat2.get("avoid", []):
            level = "چالش‌برانگیز ⚠️"
            description = "تفاوت‌های زیاد — نیاز به صبر و تلاش"
        else:
            level = "خنثی ⚖️"
            description = "رابطه معمولی، بستگی به تلاش طرفین دارد"

        return {
            "animal1": animal1,
            "animal2": animal2,
            "compatibility_level": level,
            "description": description,
            "animal1_sees_animal2": animal2 in compat1.get("best", []),
            "animal2_sees_animal1": animal1 in compat2.get("best", []),
        }
