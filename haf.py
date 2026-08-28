import json
import requests
import os

# خواندن cat.json
with open("_cat.json", "r", encoding="utf-8") as f:
    data = json.load(f)

# ایجاد پوشه برای ذخیره فایل‌ها
os.makedirs("hafez_ghazals", exist_ok=True)

base_url = "https://raw.githubusercontent.com/ganjoor/ganjoor-data/main/poets/hafez/ghazal"

for poem in data["Poems"]:
    filename = poem["FullUrl"].split("/")[-1] + ".json"
    url = f"{base_url}/{filename}"
    response = requests.get(url)
    
    if response.status_code == 200:
        with open(f"hafez_ghazals/{filename}", "w", encoding="utf-8") as f:
            f.write(response.text)
        print(f"✅ دانلود شد: {filename}")
    else:
        print(f"❌ خطا در دانلود: {filename}")