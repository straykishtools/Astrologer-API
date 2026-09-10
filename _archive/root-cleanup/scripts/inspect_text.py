# inspect_text.py
import json

# خواندن متن استخراج‌شده
with open("book_text.txt", "r", encoding="utf-8") as f:
    text = f.read()

# نمایش ۲۰۰۰ کاراکتر اول
print("📖 ۲۰۰۰ کاراکتر اول متن:\n")
print(text[:2000])

print("\n" + "=" * 60)
print("🔍 جستجوی کلمات کلیدی:\n")

# جستجوی عبارات حاوی "خورشید"
import re
sun_matches = re.findall(r".{0,50}خورشید.{0,50}", text)
print(f"تعداد عبارت‌های حاوی 'خورشید': {len(sun_matches)}")
if sun_matches:
    print("نمونه‌ها:")
    for m in sun_matches[:5]:
        print(f"  -> {m.strip()}")