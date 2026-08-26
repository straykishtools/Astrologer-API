# app/engines/abjad.py
"""
موتور محاسبه‌ی ابجد
پشتیبانی از: ابجد کبیر، جمع حروف، تطبیق دو نام
"""

ABJAD_KABIR = {
    # 1 تا 10
    'ا': 1, 'ب': 2, 'ج': 3, 'د': 4, 'ه': 5, 'و': 6, 'ز': 7, 'ح': 8, 'ط': 9, 'ی': 10,
    # 20 تا 100
    'ک': 20, 'ل': 30, 'م': 40, 'ن': 50, 'س': 60, 'ع': 70, 'ف': 80, 'ص': 90, 'ق': 100,
    # 200 تا 1000
    'ر': 200, 'ش': 300, 'ت': 400, 'ث': 500, 'خ': 600, 'ذ': 700, 'ض': 800, 'ظ': 900, 'غ': 1000,
    # حروف با دو شکل (برای تطبیق)
    'آ': 1, 'أ': 1, 'إ': 1, 'ۀ': 5, 'ة': 5, 'ى': 10, 'ئ': 10,
}

ABJAD_SAGHIR = {char: value % 12 if value % 12 != 0 else 12 for char, value in ABJAD_KABIR.items()}

def calculate_abjad(text: str, method: str = "kabir") -> dict:
    """
    محاسبه‌ی ابجد یک متن
    method: "kabir" یا "saghir"
    """
    if not text:
        return {"error": "متن وارد نشده است"}

    abjad_map = ABJAD_KABIR if method == "kabir" else ABJAD_SAGHIR

    total = 0
    details = []
    for char in text:
        value = abjad_map.get(char, 0)
        if value > 0:
            total += value
            details.append({"char": char, "value": value})

    return {
        "text": text,
        "method": method,
        "total": total,
        "details": details,
        "digit_sum": sum(int(d) for d in str(total)) if total > 0 else 0
    }

def compare_names(name1: str, name2: str, method: str = "kabir") -> dict:
    """
    تطبیق دو نام بر اساس ابجد
    """
    result1 = calculate_abjad(name1, method)
    result2 = calculate_abjad(name2, method)

    diff = abs(result1["total"] - result2["total"])

    # تشخیص سطح سازگاری
    if diff <= 10:
        compatibility = "عالی"
    elif diff <= 30:
        compatibility = "خوب"
    elif diff <= 60:
        compatibility = "متوسط"
    else:
        compatibility = "ضعیف"

    return {
        "name1": name1,
        "value1": result1["total"],
        "name2": name2,
        "value2": result2["total"],
        "difference": diff,
        "compatibility": compatibility,
        "method": method
    }
