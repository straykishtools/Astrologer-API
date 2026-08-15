import json
import os
from typing import Dict, List, Optional, Any

# ================================================================
# نقشه‌ی ترجمه از نام سه‌حرفی به کامل برج‌ها
# ================================================================
SIGN_MAP = {
    "Ari": "Aries",
    "Tau": "Taurus",
    "Gem": "Gemini",
    "Can": "Cancer",
    "Leo": "Leo",
    "Vir": "Virgo",
    "Lib": "Libra",
    "Sco": "Scorpio",
    "Sag": "Sagittarius",
    "Cap": "Capricorn",
    "Aqu": "Aquarius",
    "Pis": "Pisces"
}

# ================================================================
# نقشه‌ی درجه‌ی شروع هر برج (برای محاسبه‌ی درجه‌ی مطلق)
# ================================================================
SIGN_DEGREES = {
    "Ari": 0, "Tau": 30, "Gem": 60, "Can": 90,
    "Leo": 120, "Vir": 150, "Lib": 180, "Sco": 210,
    "Sag": 240, "Cap": 270, "Aqu": 300, "Pis": 330
}

class VedicDB:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
        self._initialized = True
        self.data_dir = os.path.join(os.path.dirname(__file__), '..', 'data')
        print(f"📁 مسیر دیتابیس: {self.data_dir}")
        self._load_all_data()
    
    def _load_all_data(self):
        """بارگذاری همه‌ی فایل‌های JSON از پوشه‌ی data"""
        self.graha_in_rashi = {}
        self.graha_in_bhava = {}
        self.lagna = {}
        self.aspects = {}
        self.elements = {}
        self.modalities = {}
        self.lordship = {}
        self.nakshatras = []
        self.planetary_dignity = {}
        
        # ۱. Graha in Rashi
        self._load_json('vedic_native_graha_in_rashi_sun_sample.json', 'graha_in_rashi')
        
        # ۲. Graha in Bhava
        bhava_files = [
            'grahas_in_bhavas_sun.json',
            'grahas_in_bhavas_moon.json',
            'grahas_in_bhavas_mercury.json',
            'grahas_in_bhavas_venus.json',
            'grahas_in_bhavas_mars.json',
            'grahas_in_bhavas_jupiter.json',
            'grahas_in_bhavas_saturn.json',
            'grahas_in_bhavas_rahu.json',
            'grahas_in_bhavas_ketu.json'
        ]
        for file in bhava_files:
            data = self._load_json(file)
            if data:
                self.graha_in_bhava.update(data)
        
        # ۳. Lagna
        self._load_json('lagna_ascendant_12_rashis.json', 'lagna')
        
        # ۴. Aspects
        self._load_json('aspects_major.json', 'aspects')
        
        # ۵. Elements & Modalities
        data = self._load_json('elements_modalities.json')
        if data:
            self.elements = data.get('elements', {})
            self.modalities = data.get('modalities', {})
        
        # ۶. Lordship
        lordship_data = self._load_json('house_lordship.json')
        if lordship_data:
            if "Lagna" in lordship_data:
                self.lordship = lordship_data["Lagna"]
                print(f"✅ Lordship بارگذاری شد (از کلید Lagna): {len(self.lordship)} برج")
            else:
                self.lordship = lordship_data
                print(f"✅ Lordship بارگذاری شد: {len(self.lordship)} برج")
            for sign in list(self.lordship.keys())[:3]:
                print(f"   📍 {sign}: {len(self.lordship[sign])} سیاره")
        else:
            print("❌ Lordship بارگذاری نشد!")
        
        # ۷. Nakshatra
        self._load_nakshatras()
        
        # ۸. Planetary Dignity
        dignity_data = self._load_json('planetary_dignity.json')
        if dignity_data:
            self.planetary_dignity = dignity_data
            print("✅ Planetary Dignity بارگذاری شد.")
        else:
            self.planetary_dignity = {}
            print("⚠️ Planetary Dignity بارگذاری نشد!")
    
    def _load_nakshatras(self):
        data = self._load_json('nakshatras.json')
        if data:
            self.nakshatras = data.get('nakshatras', [])
            print(f"✅ ناکشاتراها بارگذاری شد: {len(self.nakshatras)} عدد")
        else:
            self.nakshatras = []
            print("⚠️ ناکشاتراها بارگذاری نشد!")
    
    def _load_json(self, filename: str, target_attr: Optional[str] = None) -> Optional[Dict]:
        filepath = os.path.join(self.data_dir, filename)
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
                if target_attr:
                    setattr(self, target_attr, data)
                return data
        except FileNotFoundError:
            print(f"⚠️ فایل {filename} یافت نشد.")
            return None
        except json.JSONDecodeError as e:
            print(f"⚠️ خطا در خواندن {filename}: {e}")
            return None
    
    # ============================================================
    #   توابع دریافت تفسیر
    # ============================================================
    
    def get_graha_in_rashi(self, planet: str, sign: str) -> Optional[str]:
        try:
            return self.graha_in_rashi.get(planet, {}).get(sign)
        except:
            return None
    
    def get_graha_in_bhava(self, planet: str, house: str) -> Optional[str]:
        try:
            return self.graha_in_bhava.get(planet, {}).get(house)
        except:
            return None
    
    def get_lagna(self, sign: str) -> Optional[Dict]:
        try:
            return self.lagna.get(sign)
        except:
            return None
    
    def get_aspect(self, aspect_name: str) -> Optional[str]:
        try:
            return self.aspects.get(aspect_name)
        except:
            return None
    
    def get_element(self, element: str) -> Optional[str]:
        try:
            return self.elements.get(element)
        except:
            return None
    
    def get_modality(self, modality: str) -> Optional[str]:
        try:
            return self.modalities.get(modality)
        except:
            return None
    
    # ============================================================
    #   Lordship
    # ============================================================
    def get_lordship(self, lagna_sign: str, planet: str) -> List[int]:
        try:
            full_sign = SIGN_MAP.get(lagna_sign, lagna_sign)
            if not self.lordship:
                return []
            lagna_data = self.lordship.get(full_sign)
            if not lagna_data:
                lagna_data = self.lordship.get(lagna_sign)
            if not lagna_data:
                return []
            return lagna_data.get(planet, [])
        except:
            return []
    
    # ============================================================
    #   Functional Nature
    # ============================================================
    def get_functional_nature(self, lagna_sign: str, planet: str) -> Dict:
        houses = self.get_lordship(lagna_sign, planet)
        
        if not houses:
            return {
                'nature': 'Neutral',
                'type': 'Neutral (No Lordship)',
                'description': f'سیاره {planet} صاحب هیچ خانه‌ای نیست.',
                'houses': [],
                'is_yogakaraka': False,
                'is_maraka': False,
                'is_dusthana': False,
                'is_kendra': False,
                'is_trikona': False
            }
        
        kendra = [1, 4, 7, 10]
        trikona = [1, 5, 9]
        dusthana = [6, 8, 12]
        maraka = [2, 7]
        
        has_kendra = any(h in kendra for h in houses)
        has_trikona = any(h in trikona for h in houses)
        has_dusthana = any(h in dusthana for h in houses)
        is_maraka = any(h in maraka for h in houses)
        is_yogakaraka = has_kendra and has_trikona
        
        if is_yogakaraka:
            nature = 'Benefic (Yoga Karaka)'
            type_ = 'Yoga Karaka'
        elif is_maraka:
            nature = 'Malefic'
            type_ = 'Maraka'
        elif has_dusthana:
            nature = 'Malefic'
            type_ = 'Dusthana Lord'
        elif has_kendra:
            nature = 'Benefic'
            type_ = 'Kendra Lord'
        elif has_trikona:
            nature = 'Benefic'
            type_ = 'Trikona Lord'
        else:
            nature = 'Mixed / Neutral'
            type_ = 'Mixed'
        
        description = f"صاحب خانه‌های {', '.join(map(str, houses))} · {type_} · {nature}"
        
        return {
            'nature': nature,
            'type': type_,
            'description': description,
            'houses': houses,
            'is_yogakaraka': is_yogakaraka,
            'is_maraka': is_maraka,
            'is_dusthana': has_dusthana,
            'is_kendra': has_kendra,
            'is_trikona': has_trikona
        }
    
    # ============================================================
    #   Drishti Engine
    # ============================================================
    def get_drishti(self, planet: str, house: int) -> List[int]:
        drishti_rules = {
            'Saturn': [3, 7, 10],
            'Jupiter': [4, 6, 8],
            'Mars': [4, 7, 11],
            'Sun': [1, 5, 9],
            'Moon': [4, 8, 12],
            'Mercury': [1, 5, 9],
            'Venus': [1, 5, 9],
            'Rahu': [1, 5, 9],
            'Ketu': [1, 5, 9]
        }
        try:
            house_num = int(house)
            base_drishti = drishti_rules.get(planet, [])
            actual_houses = []
            for offset in base_drishti:
                actual_house = (house_num + offset - 1) % 12 + 1
                actual_houses.append(actual_house)
            return sorted(set(actual_houses))
        except Exception as e:
            print(f"⚠️ خطا در محاسبه‌ی Drishti برای {planet}: {e}")
            return []
    
    # ============================================================
    #   Nakshatra Engine
    # ============================================================
    def get_nakshatra(self, absolute_degree: float) -> Optional[Dict]:
        if not self.nakshatras:
            return None
        degree = absolute_degree % 360
        for n in self.nakshatras:
            if n['start'] <= degree < n['end']:
                return n
            if n['end'] == 360.0 and degree >= n['start']:
                return n
        return self.nakshatras[0] if self.nakshatras else None
    
    def get_nakshatra_by_planet(self, sign: str, sign_degree: float) -> Optional[Dict]:
        if sign_degree is None:
            return None
        base_degree = SIGN_DEGREES.get(sign, 0)
        abs_degree = base_degree + sign_degree
        return self.get_nakshatra(abs_degree)
    
    # ============================================================
    #   🆕 Planetary Strength Engine (اصلاح‌شده)
    # ============================================================
    def get_planetary_strength(self, planet: str, sign: str, sign_degree: float) -> Dict:
        """
        محاسبه‌ی قوت سیاره بر اساس:
        - Uchcha (شرف)
        - Neecha (هبوط)
        - Moolatrikona
        - Own Sign (برج خود)
        - Friend/Enemy/Neutral (روابط طبیعی)
        
        Returns:
            {
                'status': 'Uchcha' | 'Moolatrikona' | 'Own Sign' | 'Friend' | 'Neutral' | 'Enemy' | 'Neecha' | 'Unknown',
                'description': 'توضیح کامل',
                'score': 0-10 (امتیاز تقریبی)
            }
        """
        # 🔥 اصلاح: تبدیل نام سه‌حرفی به کامل
        full_sign = SIGN_MAP.get(sign, sign)
        
        dignity = self.planetary_dignity
        if not dignity:
            return {
                'status': 'Unknown',
                'description': 'دیتابیس Planetary Strength بارگذاری نشده است.',
                'score': 0
            }
        
        # ۱. بررسی Uchcha (شرف)
        uchcha_data = dignity.get('uchcha', {}).get(planet)
        if uchcha_data and uchcha_data.get('sign') == full_sign:
            uchcha_degree = uchcha_data.get('degree')
            if uchcha_degree is not None:
                diff = abs(sign_degree - uchcha_degree)
                if diff <= 1:
                    return {
                        'status': 'Uchcha',
                        'description': f'شرف کامل ({full_sign} {uchcha_degree}°)',
                        'score': 10
                    }
                elif diff <= 5:
                    return {
                        'status': 'Uchcha',
                        'description': f'نزدیک به شرف کامل ({full_sign} {uchcha_degree}°)',
                        'score': 9
                    }
                else:
                    return {
                        'status': 'Uchcha',
                        'description': f'در برج شرف ({full_sign})',
                        'score': 8
                    }
        
        # ۲. بررسی Moolatrikona
        moola_data = dignity.get('moolatrikona', {}).get(planet)
        if moola_data and moola_data.get('sign') == full_sign:
            start = moola_data.get('start')
            end = moola_data.get('end')
            if start is not None and end is not None:
                if start <= sign_degree < end:
                    return {
                        'status': 'Moolatrikona',
                        'description': f'مولاتریکونا ({full_sign} {start}°–{end}°)',
                        'score': 9
                    }
        
        # ۳. بررسی Neecha (هبوط)
        neecha_data = dignity.get('neecha', {}).get(planet)
        if neecha_data and neecha_data.get('sign') == full_sign:
            neecha_degree = neecha_data.get('degree')
            if neecha_degree is not None:
                diff = abs(sign_degree - neecha_degree)
                if diff <= 1:
                    return {
                        'status': 'Neecha',
                        'description': f'هبوط کامل ({full_sign} {neecha_degree}°)',
                        'score': 1
                    }
                elif diff <= 5:
                    return {
                        'status': 'Neecha',
                        'description': f'نزدیک به هبوط کامل ({full_sign} {neecha_degree}°)',
                        'score': 2
                    }
                else:
                    return {
                        'status': 'Neecha',
                        'description': f'در برج هبوط ({full_sign})',
                        'score': 3
                    }
        
        # ۴. بررسی Own Sign (برج خود)
        own_signs = dignity.get('own_signs', {}).get(planet, [])
        if full_sign in own_signs:
            return {
                'status': 'Own Sign',
                'description': f'برج خود ({full_sign})',
                'score': 7
            }
        
        # ۵. بررسی روابط طبیعی (Friend/Enemy/Neutral)
        relationships = dignity.get('natural_relationships', {}).get(planet, {})
        friends = relationships.get('friends', [])
        enemies = relationships.get('enemies', [])
        neutral = relationships.get('neutral', [])
        
        # پیدا کردن صاحب برج
        sign_owner = None
        for p, signs in dignity.get('own_signs', {}).items():
            if full_sign in signs:
                sign_owner = p
                break
        
        if sign_owner:
            if sign_owner in friends:
                return {
                    'status': 'Friend',
                    'description': f'برج دوست ({full_sign}، صاحب: {sign_owner})',
                    'score': 6
                }
            elif sign_owner in enemies:
                return {
                    'status': 'Enemy',
                    'description': f'برج دشمن ({full_sign}، صاحب: {sign_owner})',
                    'score': 4
                }
            elif sign_owner in neutral:
                return {
                    'status': 'Neutral',
                    'description': f'برج بی‌طرف ({full_sign}، صاحب: {sign_owner})',
                    'score': 5
                }
        
        # اگر هیچکدام نبود
        return {
            'status': 'Unknown',
            'description': f'وضعیت نامشخص برای {planet} در {full_sign}',
            'score': 0
        }
    
    # ============================================================
    #   تفسیر کامل ترکیبی (با Planetary Strength)
    # ============================================================
    def get_full_interpretation(self, planet: str, sign: str, house: str, lagna_sign: str, sign_degree: float = None) -> Dict:
        house_num = int(house) if house and house.isdigit() else 1
        result = {
            'planet': planet,
            'sign': sign,
            'house': house,
            'rashi_interpretation': self.get_graha_in_rashi(planet, sign),
            'bhava_interpretation': self.get_graha_in_bhava(planet, house),
            'lordship': self.get_lordship(lagna_sign, planet),
            'functional_nature': self.get_functional_nature(lagna_sign, planet),
            'drishti': self.get_drishti(planet, house_num),
            'nakshatra': self.get_nakshatra_by_planet(sign, sign_degree) if sign_degree is not None else None,
            'planetary_strength': self.get_planetary_strength(planet, sign, sign_degree) if sign_degree is not None else None
        }
        return result


# ================================================================
#   نمونه‌ی استفاده
# ================================================================
if __name__ == "__main__":
    db = VedicDB()
    print("\n🔍 تست Planetary Strength:")
    test_cases = [
        ('Sun', 'Leo', 15),
        ('Sun', 'Aries', 10),
        ('Sun', 'Libra', 10),
        ('Mars', 'Aries', 8),
        ('Moon', 'Taurus', 5),
        ('Jupiter', 'Sagittarius', 5),
        ('Saturn', 'Libra', 20),
    ]
    for planet, sign, degree in test_cases:
        # برای تست از نام کامل استفاده می‌کنیم، اما تابع خودش تبدیل می‌کند
        result = db.get_planetary_strength(planet, sign, degree)
        print(f"  {planet} در {sign} {degree}° → {result['status']} (امتیاز: {result['score']})")