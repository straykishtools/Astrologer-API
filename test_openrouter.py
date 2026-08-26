import httpx

API_KEY = "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"

with httpx.Client(verify=False, timeout=30) as client:  # proxies رو حذف کن
    response = client.post(
        "https://openrouter.ai/api/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json",
        },
        json={
            "model": "deepseek/deepseek-chat",
            "messages": [{"role": "user", "content": "سلام"}],
            "max_tokens": 10,
        },
    )
    print(f"✅ وضعیت: {response.status_code}")
    print(response.text[:300])