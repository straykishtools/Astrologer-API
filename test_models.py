from openai import OpenAI

# ============================================================
# تنظیمات کلاینت
# ============================================================
client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key="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",
)

# ============================================================
# لیست مدل‌هایی که می‌خواهیم تست کنیم
# ============================================================
models_to_test = [
    # مدل‌های Gemini (اگر در دسترس باشند)
    "google/gemini-1.5-flash",
    "google/gemini-1.5-pro",
    "google/gemini-pro",
    
    # مدل‌های رایگان و مطمئن
    "deepseek/deepseek-chat",
    "openai/gpt-4o-mini",
    "mistralai/mistral-7b",
]

print("=" * 60)
print("🔍 در حال تست مدل‌های مختلف روی OpenRouter...")
print("=" * 60)

successful_model = None

for model_name in models_to_test:
    print(f"\n⏳ تست مدل: {model_name}")
    try:
        response = client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "user", "content": "سلام! یک پیام آزمایشی کوتاه به فارسی بنویس (حداکثر ۱۰ کلمه)."}
            ],
            max_tokens=50,
        )
        print(f"✅ {model_name} کار می‌کند!")
        print(f"📝 پاسخ: {response.choices[0].message.content}")
        successful_model = model_name
        print("-" * 40)
        break  # اگر یکی کار کرد، بقیه را تست نکن
    except Exception as e:
        error_msg = str(e)
        if "404" in error_msg:
            print(f"❌ مدل پیدا نشد (404)")
        elif "401" in error_msg:
            print(f"❌ خطای احراز هویت - کلید API را بررسی کنید")
        else:
            print(f"❌ خطا: {error_msg[:80]}...")

# ============================================================
# نتیجه نهایی
# ============================================================
print("\n" + "=" * 60)
if successful_model:
    print(f"✅ مدل کاری: {successful_model}")
    print("💡 حالا می‌توانید از این مدل برای تحلیل چارت استفاده کنید.")
else:
    print("❌ هیچ مدلی کار نکرد.")
    print("💡 لطفاً کلید API خود را در openrouter.ai/keys بررسی کنید.")
print("=" * 60)