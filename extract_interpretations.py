import pdfplumber
import json
import re
import os

# ============================================================
# ۱. استخراج متن از PDF
# ============================================================
def extract_text_from_pdf(pdf_path):
    print(f"⏳ در حال استخراج متن از {pdf_path}...")
    full_text = ""
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for i, page in enumerate(pdf.pages):
                text = page.extract_text()
                if text:
                    full_text += text + "\n"
                if (i + 1) % 10 == 0:
                    print(f"   📄 صفحه {i+1} از {len(pdf.pages)} پردازش شد.")
        print(f"✅ استخراج کامل شد. {len(full_text):,} کاراکتر.")
        return full_text
    except Exception as e:
        print(f"❌ خطا در خواندن PDF: {e}")
        return None

# ============================================================
# ۲. پیدا کردن تفسیرهای کلیدی
# ============================================================
def extract_interpretations(text):
    interpretations = {}
    
    # الگوهای جستجو برای سیارات و برج‌ها
    patterns = [
        # خورشید در برج‌ها
        (r"خورشید در برج (\w+)", "Sun"),
        # ماه در برج‌ها
        (r"ماه در برج (\w+)", "Moon"),
        # عطارد در برج‌ها
        (r"عطارد در برج (\w+)", "Mercury"),
        # ناهید در برج‌ها
        (r"ناهید در برج (\w+)", "Venus"),
        # مریخ در برج‌ها
        (r"مریخ در برج (\w+)", "Mars"),
        # مشتری در برج‌ها
        (r"مشتری در برج (\w+)", "Jupiter"),
        # کیوان در برج‌ها
        (r"کیوان در برج (\w+)", "Saturn"),
        # اورانوس در برج‌ها
        (r"اورانوس در برج (\w+)", "Uranus"),
        # نپتون در برج‌ها
        (r"نپتون در برج (\w+)", "Neptune"),
        # پلوتون در برج‌ها
        (r"پلوتون در برج (\w+)", "Pluto"),
    ]

    for pattern, planet in patterns:
        matches = re.findall(pattern + r"[\s\S]{1,300}?(?=\n\n|\Z)", text)
        for match in matches:
            # استخراج نام برج
            sign_match = re.search(r"برج (\w+)", match)
            if sign_match:
                sign = sign_match.group(1)
                key = f"{planet}_{sign}"
                
                # حذف کلمات اضافی و تمیز کردن متن
                clean_text = re.sub(r"^\s*", "", match)
                clean_text = re.sub(r"\s+", " ", clean_text).strip()
                
                if key not in interpretations:
                    interpretations[key] = clean_text
                    print(f"   ✅ {key} پیدا شد.")

    return interpretations

# ============================================================
# ۳. ذخیره در فایل JSON
# ============================================================
def save_interpretations(interpretations, output_path="book_interpretations.json"):
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(interpretations, f, ensure_ascii=False, indent=2)
    print(f"✅ {len(interpretations)} تفسیر در فایل {output_path} ذخیره شد.")

# ============================================================
# ۴. اجرا
# ============================================================
if __name__ == "__main__":
    # مسیر فایل PDF کتاب خود را وارد کنید
    PDF_PATH = input("📁 مسیر کامل فایل PDF را وارد کنید: ").strip()
    
    if not os.path.exists(PDF_PATH):
        print(f"❌ فایل {PDF_PATH} پیدا نشد!")
        exit()
    
    # مرحله ۱: استخراج متن
    book_text = extract_text_from_pdf(PDF_PATH)
    if not book_text:
        print("❌ استخراج متن انجام نشد.")
        exit()
    
    # مرحله ۲: استخراج تفسیرها
    print("\n⏳ در حال جستجوی تفسیرهای کلیدی...")
    interpretations = extract_interpretations(book_text)
    
    # مرحله ۳: ذخیره
    save_interpretations(interpretations)
    
    print("\n✅ همه‌چیز کامل شد!")
    print(f"📊 تعداد تفسیرهای استخراج‌شده: {len(interpretations)}")