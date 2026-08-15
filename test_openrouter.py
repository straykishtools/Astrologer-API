from openai import OpenAI

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key="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",
)

# لیست مدل‌های معتبر در OpenRouter
models_to_test = [
    "google/gemini-1.5-flash",
    "google/gemini-1.5-pro",
    "google/gemini-pro",
    "deepseek/deepseek-chat",      # رایگان
    "openai/gpt-4o-mini",          # رایگان
    "mistralai/mistral-7b",        # رایگان
]

print("🔍 در حال تست مدل‌های مختلف روی OpenRouter...\n")

for model_name in models_to_test:
    print(f"⏳ تست مدل: {model_name}")
    try:
        response = client.chat.completions.create(
            model=model_name,
            messages=[{"role": "user", "content": "سلام! یک پیام آزمایشی کوتاه به فارسی بنویس."}],
            max_tokens=100,
        )
        print(f"✅ {model_name} کار می‌کند!")
        print(f"📝 پاسخ: {response.choices[0].message.content[:60]}...\n")
        break  # اگر یکی کار کرد، بقیه را تست نکن
    except Exception as e:
        error_msg = str(e)
        if "404" in error_msg:
            print(f"❌ {model_name} پیدا نشد (404)\n")
        elif "401" in error_msg:
            print(f"❌ {model_name} خطای احراز هویت (401) - کلید را بررسی کنید\n")
        else:
            print(f"❌ {model_name} خطا: {error_msg[:60]}...\n")