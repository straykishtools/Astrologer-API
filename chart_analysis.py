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
            "name": "کاربر"
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
# ۲. تحلیل چارت با DeepSeek (از طریق OpenRouter)
# ============================================================
def analyze_chart(context_text):
    client = OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key="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",
    )

    prompt = f"""
شما یک اخترشناس حرفه‌ای و با تجربه هستید. بر اساس اطلاعات چارت تولد زیر، یک تحلیل کامل و دقیق به زبان فارسی بنویسید.

لطفاً به این موارد بپردازید:

1. **شخصیت کلی و ویژگی‌های روانشناختی**:
   - نقاط قوت اصلی شخصیت
   - نقاط ضعف و چالش‌های درونی
   - انگیزه‌ها و اهداف زندگی

2. **حوزه‌های شغلی و تحصیلی**:
   - استعدادها و توانایی‌های طبیعی
   - زمینه‌های شغلی مناسب
   - رویکرد به یادگیری و تحصیل

3. **روابط عاطفی و اجتماعی**:
   - سبک ارتباطی با دیگران
   - نیازهای عاطفی
   - الگوهای رفتاری در روابط

4. **توصیه‌های کاربردی**:
   - راه‌های رشد شخصی
   - مدیریت چالش‌ها
   - نکات کلیدی برای موفقیت

اطلاعات چارت (به‌صورت XML):
{context_text}

تحلیل خود را به‌صورت روان و خوانا بنویسید و از اصطلاحات تخصصی بیش از حد استفاده نکنید.
"""

    try:
        response = client.chat.completions.create(
            model="deepseek/deepseek-chat",  # مدلی که تست کردیم
            messages=[
                {"role": "system", "content": "شما یک اخترشناس حرفه‌ای هستید که به زبان فارسی تحلیل‌های دقیق و روان ارائه می‌دهید."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=3000,
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"❌ خطا در ارتباط با OpenRouter: {e}"

# ============================================================
# ۳. اجرا
# ============================================================
print("=" * 70)
print("🌌 تحلیل چارت تولد با استفاده از DeepSeek (از طریق OpenRouter)")
print("=" * 70)

print("\n⏳ مرحله ۱: دریافت چارت از سرور محلی...")
context = get_chart()

if context:
    print("✅ چارت دریافت شد.")
    print("\n⏳ مرحله ۲: ارسال به DeepSeek برای تحلیل...")
    print("⏳ این کار ممکن است ۱۰-۲۰ ثانیه طول بکشد...\n")
    
    analysis = analyze_chart(context)
    
    print("\n" + "=" * 70)
    print("📜 تحلیل چارت توسط DeepSeek")
    print("=" * 70)
    print(analysis)
    print("\n" + "=" * 70)
else:
    print("❌ خطا در دریافت چارت.")
    print("💡 مطمئن شوید سرور محلی روی http://127.0.0.1:8000 روشن است.")