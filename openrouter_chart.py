import requests
from openai import OpenAI

# ============================================================
# ۱. دریافت چارت از API محلی
# ============================================================
def get_chart():
    url = "http://127.0.0.1:8000/api/v5/context/birth-chart"
    payload = {
        "subject": {
            "year": 2000,
            "month": 1,
            "day": 1,
            "hour": 12,
            "minute": 0,
            "longitude": 51.3890,
            "latitude": 35.6892,
            "timezone": "Asia/Tehran",
            "city": "Tehran",
            "name": "تست"
        }
    }
    try:
        response = requests.post(url, json=payload)
        if response.status_code == 200:
            data = response.json()
            return data.get("context", "متن موجود نیست")
        else:
            print(f"❌ خطا در دریافت چارت: {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ خطا در اتصال به سرور: {e}")
        return None

# ============================================================
# ۲. تحلیل چارت با OpenRouter
# ============================================================
def analyze_with_openrouter(context_text):
    client = OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key="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",
    )

    prompt = f"""
شما یک اخترشناس حرفه‌ای هستید. بر اساس اطلاعات چارت تولد زیر، یک تحلیل کامل و دقیق به زبان فارسی بنویسید.

لطفاً به این موارد بپردازید:
1. شخصیت کلی و ویژگی‌های روانشناختی (نقاط قوت و ضعف)
2. حوزه‌های شغلی و تحصیلی مناسب
3. روابط عاطفی و اجتماعی
4. توصیه‌های کاربردی برای رشد شخصی

اطلاعات چارت (به‌صورت XML):
{context_text}
"""

    try:
        response = client.chat.completions.create(
            model="google/gemini-1.5-flash",  # ✅ مدل صحیح برای OpenRouter
            messages=[
                {"role": "system", "content": "شما یک اخترشناس حرفه‌ای هستید که به زبان فارسی تحلیل می‌کنید."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=2000,
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"❌ خطا در ارتباط با OpenRouter: {e}"

# ============================================================
# ۳. اجرا
# ============================================================
print("=" * 60)
print("🌌 تحلیل چارت تولد با استفاده از Gemini (از طریق OpenRouter)")
print("=" * 60)

print("\n⏳ در حال دریافت چارت از سرور محلی...")
context = get_chart()

if context:
    print("✅ چارت دریافت شد.")
    print("⏳ در حال ارسال به OpenRouter برای تحلیل...\n")
    
    analysis = analyze_with_openrouter(context)
    
    print("\n" + "=" * 60)
    print("📜 تحلیل چارت توسط Gemini")
    print("=" * 60)
    print(analysis)
else:
    print("❌ خطا در دریافت چارت. مطمئن شوید سرور محلی روی http://127.0.0.1:8000 روشن است.")