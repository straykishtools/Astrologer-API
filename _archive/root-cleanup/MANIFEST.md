# 📦 _archive/root-cleanup — فایل‌های منتقل‌شده از ریشه

**تاریخ:** ۲۰۲۶-۰۹-۰۶ | کلید API ها و `.env` دست‌نخورده ماندند.

هر فایل قبل از انتقال از نظر ارجاع در کل پروژه (app, scripts, tools, tests, docs, static, alembic, Dockerfile, pyproject) ممیزی شد.

---

## scripts/ — اسکریپت‌های یک‌بارمصرف بدون هیچ ارجاعی

| فایل | توضیح |
|---|---|
| `dump_schema.py` | دامپ اسکیمای دیتابیس — بدون ارجاع |
| `extract_book.py` | استخراج متن کتاب — بدون ارجاع |
| `extract_interpretations.py` | استخراج تعبیرها — بدون ارجاع |
| `gemini_test.py` | اسکریپت تست Gemini (نیاز به نصب دستی openai) — بدون ارجاع |
| `generate_icons.py` | تولید آیکون — بدون ارجاع |
| `generate_yoga_images.py` | تولید تصویر یوگا — بدون ارجاع |
| `inspect_text.py` | ابزار بازرسی متن — بدون ارجاع |
| `openrouter_chart.py` | تست OpenRouter — بدون ارجاع |
| `haf.py` | دانلود غزل‌های حافظ از ganjoor — بدون ارجاع (سرویس حافظ از `app/data/` می‌خواند) |

## html/ — صفحات آزمایشی و کپی‌های دستی

| فایل | توضیح |
|---|---|
| `index - Copy.html` و `index - Copy (2).html` | کپی‌های دستی index |
| `i1ndex.html` | نام تایپی index |
| `n.html` | صفحه آزمایشی «کاوش ناسا» |
| `n.py` | ⚠️ در واقع HTML بود با پسوند py اشتباه — به `n.py.html` تغییر نام داد |
| `sample.html` | نمونه آزمایشی |
| `space-theme.html` | پیش‌نمایش تم |
| `dashboard-gate-preview.html` | پیش‌نمایش داشبورد |

> `index.html`، `account.html` و `admin.html` اصلی در روت ماندند (app/main.py سرو می‌کند).

## data/ — داده‌های تکراری یا بدون ارجاع

| فایل | توضیح |
|---|---|
| `yoga.json` / `yoga.txt` / `yoga_asset_audit.json` | نسخه‌های روت؛ نسخه‌ی فعال: `static/yoga.txt` |
| `_cat.json` | کپی قدیمی؛ نسخه‌ی فعال: `app/data/hafez_ghazals/_cat.json` (هر دو ۴۹۵ غزل) |
| `body.json`, `book_interpretations.json`, `content.txt`, `llms.txt` | بدون هیچ ارجاعی در کد |
| `root-duplicates/` | ۴ JSON ودیک + `cards.json` روت — کپی‌های قدیمی؛ نسخه‌های فعال در `app/data/` و `app/cards.json` (۱۴۲KB در برابر ۱۱۲KB قدیمی) هستند |

## databases/ — دیتابیس legacy

| فایل | توضیح |
|---|---|
| `cosmic_oracle.db` | دیتابیس legacy که دیگر هیچ کدی آن را نمی‌خواند (فقط در کامنت‌ها به آن اشاره شده). دیتابیس فعال: `cosmic.db` |

## logs/ — لاگ‌های محلی

`server.log`, `server_run.log`, `server_test.log`

---

## آنچه عمداً در ریشه ماند

| فایل | دلیل |
|---|---|
| `.env` | کلیدها دست نخوردند (طبق درخواست) |
| `index.html`, `account.html`, `admin.html` | توسط `app/main.py` سرو می‌شوند |
| `chart_analysis.py` | ⚠️ ممیزی: هیچ import مستقیمی ندارد ولی نامش در تست و داکیومنت به‌عنوان نام تگ XML (`<chart_analysis>`) دیده می‌شود — بررسی دستی لازم؛ خطرناک نیست |
| `yoga_importer.py` | در کامنت `yoga_session_parser.py` به آن ارجاع است (هماهنگی فرمت XML) |
| `wsgi.py` | نقطه ورود PythonAnywhere |
| `cosmic.db` | دیتابیس فعال |
| `openapi.json` | خروجی اسکیمای تولیدشده |
| بقیه | فایل‌های پیکربندی/داکیومنت استاندارد |

## نحوه بازگردانی

هر فایلی لازم شد، از همین پوشه دستی به ریشه برگردانید — یا کل پوشه `_archive` را هر طور که خواستید جابه‌جا/حذف کنید.
