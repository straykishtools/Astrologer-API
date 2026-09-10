# app/engines/tarot.py
import json
import os
import random
from datetime import datetime
from typing import List, Dict, Optional

# Resolve path relative to this file's directory (app/engines/)
_APP_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_CARDS_PATH = os.path.join(_APP_DIR, "cards.json")

# Card ID → English image slug mapping
_CARD_SLUGS = {
    # Major Arcana
    0: "the-fool", 1: "the-magician", 2: "the-high-priestess", 3: "the-empress",
    4: "the-emperor", 5: "the-hierophant", 6: "the-lovers", 7: "the-chariot",
    8: "strength", 9: "the-hermit", 10: "wheel-of-fortune", 11: "justice",
    12: "the-hanged-man", 13: "death", 14: "temperance", 15: "the-devil",
    16: "the-tower", 17: "the-star", 18: "the-moon", 19: "the-sun",
    20: "judgement", 21: "the-world",
    # Wands (22-35)
    22: "ace-of-wands", 23: "two-of-wands", 24: "three-of-wands", 25: "four-of-wands",
    26: "five-of-wands", 27: "six-of-wands", 28: "seven-of-wands", 29: "eight-of-wands",
    30: "nine-of-wands", 31: "ten-of-wands", 32: "page-of-wands", 33: "knight-of-wands",
    34: "queen-of-wands", 35: "king-of-wands",
    # Cups (36-49)
    36: "ace-of-cups", 37: "two-of-cups", 38: "three-of-cups", 39: "four-of-cups",
    40: "five-of-cups", 41: "six-of-cups", 42: "seven-of-cups", 43: "eight-of-cups",
    44: "nine-of-cups", 45: "ten-of-cups", 46: "page-of-cups", 47: "knight-of-cups",
    48: "queen-of-cups", 49: "king-of-cups",
    # Swords (50-63)
    50: "ace-of-swords", 51: "two-of-swords", 52: "three-of-swords", 53: "four-of-swords",
    54: "five-of-swords", 55: "six-of-swords", 56: "seven-of-swords", 57: "eight-of-swords",
    58: "nine-of-swords", 59: "ten-of-swords", 60: "page-of-swords", 61: "knight-of-swords",
    62: "queen-of-swords", 63: "king-of-swords",
    # Pentacles (64-77)
    64: "ace-of-pentacles", 65: "two-of-pentacles", 66: "three-of-pentacles", 67: "four-of-pentacles",
    68: "five-of-pentacles", 69: "six-of-pentacles", 70: "seven-of-pentacles", 71: "eight-of-pentacles",
    72: "nine-of-pentacles", 73: "ten-of-pentacles", 74: "page-of-pentacles", 75: "knight-of-pentacles",
    76: "queen-of-pentacles", 77: "king-of-pentacles",
}

class TarotEngine:
    def __init__(self, data_path: str = DEFAULT_CARDS_PATH):
        with open(data_path, 'r', encoding='utf-8') as f:
            self.cards = json.load(f)
    
    @staticmethod
    def _get_image_url(card: Dict) -> str:
        slug = _CARD_SLUGS.get(card.get('id'), '')
        if slug:
            return f"/static/tarot/images/{slug}.webp"
        return "/static/tarot/images/card-back.svg"  # placeholder خنثی (نه تصویر احمق!)

    def _enrich_card(self, card: Dict) -> Dict:
        card = dict(card)  # shallow copy
        card['image'] = self._get_image_url(card)
        return card
    
    def get_all_cards(self) -> List[Dict]:
        """بازگرداندن تمام ۷۸ کارت (گلاسری) — با مسیر تصویر"""
        return [self._enrich_card(c) for c in self.cards]
    
    def get_card_by_name(self, name: str) -> Optional[Dict]:
        """دریافت یک کارت بر اساس نام"""
        for card in self.cards:
            if card.get('name', '').lower() == name.lower():
                return card
        return None
    
    def draw_cards(self, count: int = 1, with_reversed: bool = True) -> List[Dict]:
        """کشیدن کارت‌های تصادفی"""
        selected = random.sample(self.cards, min(count, len(self.cards)))
        result = []
        for card in selected:
            is_reversed = with_reversed and random.random() > 0.5
            result.append({
                "card": self._enrich_card(card),
                "is_reversed": is_reversed,
                "meaning": card.get('meaning_reversed' if is_reversed else 'meaning_upright', ''),
                "deep_interp": card.get('deep_interp_reversed' if is_reversed else 'deep_interp_upright', ''),
                "keywords": card.get('keywords_reversed' if is_reversed else 'keywords_upright', ''),
                "love": card.get('love_reversed' if is_reversed else 'love_upright', ''),
                "career": card.get('career_reversed' if is_reversed else 'career_upright', ''),
                "mood": card.get('mood_reversed' if is_reversed else 'mood_upright', ''),
                "spiritual": card.get('spiritual_reversed' if is_reversed else 'spiritual_upright', ''),
                "yes_no": card.get('yes_no_reversed' if is_reversed else 'yes_no', '')
            })
        return result

    def get_daily_card(self) -> Dict:
        """کارت روزانه (بر اساس تاریخ)"""
        seed = datetime.now().strftime("%Y-%m-%d")
        random.seed(seed)
        card = random.choice(self.cards)
        random.seed()
        is_reversed = random.random() > 0.5
        return {
            "card": self._enrich_card(card),
            "is_reversed": is_reversed,
            "date": seed,
            "meaning": card.get('meaning_reversed' if is_reversed else 'meaning_upright', ''),
            "deep_interp": card.get('deep_interp_reversed' if is_reversed else 'deep_interp_upright', ''),
            "keywords": card.get('keywords_reversed' if is_reversed else 'keywords_upright', []),
            "love": card.get('love_reversed' if is_reversed else 'love_upright', ''),
            "career": card.get('career_reversed' if is_reversed else 'career_upright', ''),
            "mood": card.get('mood_reversed' if is_reversed else 'mood_upright', ''),
            "spiritual": card.get('spiritual_reversed' if is_reversed else 'spiritual_upright', ''),
            "yes_no": card.get('yes_no_reversed' if is_reversed else 'yes_no', '')
        }
    
    def three_card_spread(self) -> Dict:
        """اسپرید ۳ کارتی (گذشته، حال، آینده) — با تعبیرِ متناسبِ هر جایگاه"""
        cards = self.draw_cards(3)
        guides = {
            "گذشته": "این کارت نشان می‌دهد چه گذشته‌ای هنوز بر وضعیتِ فعلی‌ات اثر گذاشته — درسی که باید از آن برداری یا چیزی که باید رهایش کنی.",
            "حال": "این کارت آینه‌ی اکنونِ توست: احساس، موقعیت و انرژی‌ای که همین حالا در آن هستی.",
            "آینده": "این کارت مسیرِ پیشِ رو را نشان می‌دهد — نه سرنوشتی قطعی، بلکه نتیجه‌ی طبیعیِ ادامه‌ی همین مسیر.",
        }
        return {
            "spread": "Three Card",
            "positions": [
                {"position": pos, "card": cards[i], "position_guide": guides[pos]}
                for i, pos in enumerate(("گذشته", "حال", "آینده"))
            ]
        }

    def celtic_cross_spread(self) -> Dict:
        """اسپرید سلتیک کراس (۱۰ کارتی) — با تعبیرِ متناسبِ هر جایگاه"""
        cards = self.draw_cards(10)
        positions = [
            ("وضعیت فعلی", "قلبِ ماجرا: انرژی‌ای که همین حالا حولِ سؤالت می‌چرخد."),
            ("چالش اصلی", "مانعی که باید رد شود — گاهی بیرونی، گاهی درونِ خودت."),
            ("زیربنا (گذشته‌ی دور)", "ریشه‌های عمیقِ وضعیت: چیزهایی که از گذشته دور تا امروز رسیده‌اند."),
            ("گذشته‌ی نزدیک", "رویدادِ تازه‌ای که هنوز لرزشش در موقعیتِ فعلی حس می‌شود."),
            ("هدف و آرزو", "آنچه در افقِ ذهنِ توست — آگاهانه یا نیمه‌آگاهانه دنبالش می‌روی."),
            ("ناخودآگاه", "انگیزه‌های پنهانی که خودت هم شاید به‌روشنی نمی‌بینی؛ حرفِ نزده‌ی درون."),
            ("تأثیرات بیرونی", "آدم‌ها و شرایطی که از بیرون بر اوضاع اثر می‌گذارند — دوست یا ناخواسته."),
            ("امیدها و ترس‌ها", "آنچه آرزو می‌کنی و آنچه ازش می‌ترسی — گاهی یکی‌اند!"),
            ("نتیجه‌ی نهایی", "اگر همین مسیر ادامه پیدا کند، این تصویرِ مقصد است. مسیر هنوز در دستِ توست."),
        ]
        return {
            "spread": "Celtic Cross",
            "positions": [
                {"position": pos, "card": cards[i], "position_guide": guide}
                for i, (pos, guide) in enumerate(positions[:len(cards)])
            ]
        }
