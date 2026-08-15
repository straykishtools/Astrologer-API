import requests
from openai import OpenAI

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
    response = requests.post(url, json=payload)
    if response.status_code == 200:
        data = response.json()
        return data.get("context", "متن موجود نیست")
    return None

def analyze_with_openrouter(context_text):
    client = OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key="YOUR_OPENROUTER_API_KEY",  # کلید OpenRouter
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

    response = client.chat.completions.create(
        model="google/gemini-2.0-flash-001",
        messages=[{"role": "user", "content": prompt}]
    )
    return response.choices[0].message.content

print("⏳ در حال دریافت چارت از سرور...")
context = get_chart()

if context:
    print("✅ چارت دریافت شد.")
    print("⏳ در حال ارسال به OpenRouter برای تحلیل...")
    analysis = analyze_with_openrouter(context)
    print("\n" + "=" * 60)
    print("📜 تحلیل چارت توسط Gemini (از طریق OpenRouter)")
    print("=" * 60)
    print(analysis)
else:
    print("❌ خطا در دریافت چارت. مطمئن شوید سرور محلی روشن است.")