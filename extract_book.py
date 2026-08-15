import pdfplumber
import json
import re

def extract_text_from_pdf(pdf_path):
    full_text = ""
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                full_text += text + "\n"
    return full_text

# مسیر فایل PDF را وارد کنید
pdf_path = "C:\\Users\\Lucid\\Documents\\GitHub\\Astrologer-AP\\book.pdf"  # مسیر کتاب را بدهید
book_text = extract_text_from_pdf(pdf_path)

# ذخیره در فایل برای استفاده‌ی بعدی
with open("book_text.txt", "w", encoding="utf-8") as f:
    f.write(book_text)

print(f"✅ {len(book_text)} کاراکتر استخراج شد.")