# 🔍 گزارش Review پروژه Astrologer-API

**تاریخ:** ۲۰۲۶-۰۹-۰۶ | **نسخه:** 5.0.0 | **استک:** FastAPI + SQLAlchemy (async) + SQLite + Kerykeion

---

## 🎯 جمع‌بندی کلی

پروژه‌ای با زیرساخت فنی خوب (تست‌های فراوان، Alembic، معماری لایه‌ای، مستندسازی قوی) اما با **مشکلات جدی امنیتی** و **آشفتگی قابل‌توجه در ریشه‌ی ریپو**. وضعیت کلی: **قابل‌استفاده ولی نیازمند پاک‌سازی فوری**.

| حوزه | وضعیت |
|---|---|
| امنیت | 🔴 نیازمند اقدام فوری |
| معماری | 🟡 خوب ولی با تکرار |
| کیفیت کد | 🟡 متوسط |
| تست‌ها | 🟢 عالی (۳۴ فایل، ~۹هزار خط) |
| تمیزی ریپو | 🔴 شلوغ و آلوده |

---

## 🔴 مسائل بحرانی امنیتی (فوری)

### 1. کلیدهای API لو رفته در ریپو

فایل `.env` با **کلیدهای واقعی و فعال** داخل ریپو موجود است (در `.gitignore` هست ولی در محیط کاری فعلی با مقادیر واقعی وجود دارد و در تاریخ گیت هم احتمال لو رفتن هست):

- `OPENROUTER_API_KEY=sk-or-v1-c1a7cd00...`
- `NASA_API_KEY=10KokEkIFoA...`
- `JWT_SECRET_KEY=cosmic-oracle-c9e2a554...`

**بدتر:** یک کلید DeepSeek به‌صورت **هاردکد شده** داخل سورس کد:

```python
# app/routers/context.py:340
api_key = os.getenv("DEEPSEEK_API_KEY", "sk-76422dc5ee03d9c3-j1m8he-be3fb0c5")
```

**اقدام لازم:**
- [ ] ابطال (revoke) فوری هر سه کلید و صدای کلیدهای جدید
- [ ] حذف fallback هاردکد شده از `context.py` — اگر کلید تنظیم نشده بود باید 503 برگرداند نه اینکه با کلید لو رفته ادامه دهد
- [ ] بررسی تاریخ گیت: اگر `.env` یا کلیدها قبلاً push شده‌اند، کلیدها در گیت‌هاب هم لو رفته‌اند و فقط حذف فایل کافی نیست

### 2. JWT چیست و چرا مهم است؟

**JWT (JSON Web Token)** شناسه‌ی دیجیتال امضاشده‌ای است که سرور بعد از login به کاربر می‌دهد. کاربر آن را در هر درخواست می‌فرستد و سرور با «کلید امضا» (secret) صحتش را تأیید می‌کند. اگر این کلید لو برود یا قابل حدس باشد، **هر کسی می‌تواند توکن جعلی بسازد و به‌جای هر کاربری (مثلاً ادمین) وارد شود** — بدون اینکه رمزی را بداند.

**وضعیت پروژه:**

```python
# app/services/auth_service.py:35
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "cosmic-oracle-secret-key-change-in-production")
```

- در `.env` فعلی `JWT_SECRET_KEY` ست شده ✅ پس الان امن است.
- **اما:** اگر روزی سرور بدون این متغیر بالا بیاید (دیپلوی جدید، Heroku بدون config و...)، برنامه **کرش نمی‌کند** بلکه بی‌سروصدا با کلید پیش‌فرض معلوم کار می‌کند — یعنی هر کسی که سورس را دیده می‌تواند توکن معتبر برای هر اکانتی بسازد. این حالت «fail-open» خطرناک‌ترین نوع خطای امنیتی است چون هیچ علامتی ندارد.
- نکته‌ی دیگر: `app/config/security.py` نسخه‌ی درست را دارد (اگر env نبود، یک کلید تصادفی per-process می‌سازد) ولی **هیچ فایلی آن را import نمی‌کند** — `auth_service` نسخه‌ی خودش با fallback خطرناک را دارد.

**اقدام پیشنهادی:** در `auth_service.py` به‌جای fallback ثابت، این را بگذارید:

```python
from app.config.security import JWT_SECRET_KEY as SECRET_KEY
```

اینطوری بدون env، سرور کلید تصادفی می‌سازد (sessionها بعد از restart باطل می‌شوند که چیز بدی نیست) و هرگز با کلید معلوم کار نمی‌کند.

### 3. `dev/emails` — صندوق ایمیل بدون احراز هویت

```python
@router.get("/dev/emails")   # app/routers/auth_router.py:319
```

این endpoint توکن‌های تأیید ایمیل و ریست پسورد را برمی‌گرداند و فقط روی `ENV_TYPE=production` بسته می‌شود. اگر محیطی با ENV_TYPE اشتباه (یا بدون این متغیر) بالا بیاید، **هر کسی می‌تواند اکانت هر کاربری را takeover کند**. چون `ENV_TYPE` به‌صورت پیش‌فرض production است ریسک کم است، ولی این endpoint باید به‌جای چک string، در محیط تست به‌صورت کامل حذف یا با یک flag صریح فعال شود.

### 4. دور زدن rate-limit مهمان از طریق X-Forwarded-For

```python
# app/middleware/rate_limit_middleware.py:308-312
forwarded = headers.get(b"x-forwarded-for", b"").decode()
if forwarded:
    return forwarded.split(",")[0].strip()
```

این هدر به‌راحتی توسط کلاینت جعل می‌شود — هر درخواست با یک `X-Forwarded-For` جدید = یک هویت جدید. اگر API پشت proxy معتبر است، فقط باید اولین IPِ زنجیره‌ی اضافه‌شده توسط **آن proxy خاص** اعتماد شود (یا از `ProxyHeadersMiddleware` با trusted hosts استفاده شود).

### 5. سیاست پسورد و ایمیل ضعیف

- حداقل پسورد فقط ۶ کاراکتر، بدون چک رایج‌بودن
- اعتبارسنجی ایمیل فقط چک `@` و `.` — تقریباً هیچ

### 6. نکات متوسط

- **CORS در debug:** `allow_origins=["*"]` همراه `allow_credentials=True` — این ترکیب توسط استاندارد CORS غیرمجاز و خطرناک است.
- **توکن JWT هفت‌روزه بدون refresh token و بدون blacklist** — در صورت لو رفتن، تا ۷ روز اعتبار دارد.
- **bcrypt نسخه‌ی نصب‌شده روی سیستم 3.2.0 است** در حالی که `pyproject` می‌خواهد `>=5.0.0` — نسخه‌های قدیمی bcrypt مشکل known vulnerability دارند. محیط اجرا با `requirements.txt` نصب شده که وابستگی‌هاش pin نشده‌اند.
- `register` قول `TokenResponse` می‌دهد ولی اگر `create_user` None برگرداند، `user.id` قبل از چک استفاده شده... (بررسی شد: چک 409 درست است، فقط ترتیب کد کمی گیج‌کننده است).

---

## 🟡 معماری — خوب با یک مشکل بزرگ

**نکات مثبت:**
- جداسازی تمیز: `routers / services / models / schemas / engines / middleware / types / utils`
- سرویس auth یکپارچه و async با مهاجرت شفاف از legacy SHA256 به bcrypt (ارتقای خودکار هش هنگام login — ایده‌ی خیلی خوبی است ✅)
- Alembic به‌عنوان source of truth + `init_db` برای راحتی dev
- Rate-limiting پلن‌محور با جدول `plans` قابل‌تنظیم
- مستندسازی OpenAPI درخشان (rate limits و auth داخل description)

**مشکل بزرگ: شش جفت روتر تکراری**

| فایل A | فایل B | وضعیت |
|---|---|---|
| `data.py` (۱۰۶۶ خط) | `data_router.py` (۱۰۶۶ خط) | محتوای یکسان، فقط CRLF/LF |
| `context.py` (۴۲۸) | `context_router.py` (۴۳۰) | تقریباً یکسان |
| `charts.py` (۳۳۱) | `charts_router.py` (۳۳۱) | یکسان |
| `misc.py` / `mizaj.py` / `moon_phase.py` | نسخه‌های `_router` | یکسان |

یعنی **حدود ۳۲۰۰ خط کد دوبله**. خطر: یک باگ در یکی فیکس می‌شود و دیگری باقی می‌ماند. `main.py` از نسخه‌ی بدون پسوند (`charts`, `data`, ...) import می‌کند و تست‌ها هم همین‌طور — پس نسخه‌های `_router.py` کاندید حذف‌اند (ولی در گیت modified هستند؛ احتمالاً در حال مهاجرت هستید — تصمیم بگیرید و یکی را نگه دارید).

**سایر نکات معماری:**
- `@app.on_event("startup")` deprecated است → به `lifespan` مهاجرت کنید.
- Rate-limit middleware با **sqlite3 سینکرون** کار می‌کند (خارج از event loop) — برای volume بالا bottleneck می‌شود؛ برای SQLite فعلی قابل قبول است ولی برای رشد باید فکر شود.
- `_guest_usage = {}` به‌عنوان دیکشنری در-memory یعنی limit مهمان‌ها بین چند instance/ری‌استارت اشتراک نمی‌شود (در گیت‌هاب کوچک مشکلی نیست، فقط مستندش کنید).

---

## 🟡 کیفیت کد

- **۱۶۵ بلوک `except Exception`** و **۸ بلوک bare `except:`** — بعضی جاها حتی `except: pass` (مثلاً ۴ مورد در auth). حداقل لاگ کنید.
- **۳۲ فراخوانی `print`** داخل `app/` به‌جای logger.
- `line-length = 200` برای black — عملاً هیچ محدودیتی نیست؛ پیشنهاد: ۱۲۰.
- Type hints در اکثر فایل‌های روتر خوب است، ولی `mypy` هیچ اجرای ذخیره‌شده‌ای ندارد (`quality` task تعریف شده ولی به‌نظر اجرا نمی‌شود).
- **بدون CI/CD** — پوشه‌ی `.github/workflows` وجود ندارد. با این حجم تست خوب، راه‌اندازی یک workflow ساده (pytest + mypy) بیشترین بازده را دارد.

---

## 🔴 تمیزی ریپو (بدترین بخش)

ریشه‌ی پروژه به‌جای ۱۵-۲۰ فایل، ~۶۰ فایل دارد:

**اسکریپت‌های یک‌بارمصرف و آزمایشی که باید به `scripts/` یا `tools/` یا حذف بروند:**
`chart_analysis.py`, `dump_schema.py`, `extract_book.py`, `extract_interpretations.py`, `gemini_test.py`, `generate_icons.py`, `generate_yoga_images.py`, `haf.py`, `inspect_text.py`, `openrouter_chart.py`, `yoga_importer.py`

**فایل‌های HTML در روت (۱۰ فایل!) شامل:**
- `index - Copy.html` و `index - Copy (2).html` — کپی‌های دستی! (۲۴۴KB)
- `i1ndex.html` — فایل با نام تایپی
- `n.html` و `n.py` — ⚠️ **`n.py` در واقع فایل HTML است با پسوند py** (۴۰KB کد HTML داخلش است)
- `sample.html`, `space-theme.html`, `dashboard-gate-preview.html`

این‌ها باید به `static/` یا یک پوشه‌ی `prototypes/` بروند.

**داده‌های حجیم در روت/گیت:**
- `llms.txt` (۳.۶MB)، `yoga.json` (۱.۸MB)، `yoga.txt` (۱.۸MB)، `tools/yoga.txt.raw.bak` (۱.۸MB)، `Yoga.txt` (نسخه‌ی سوم!)، `yoga_asset_audit.json` (۱.۲MB)، `_cat.json` (۵۵KB)
- **دیتابیس `cosmic_oracle.db` داخل گیت tracked است** در حالی که `.gitignore` می‌گوید `*.db` — یعنی قبل از اضافه‌شدن rule اضافه شده و باید `git rm --cached` شود.
- `server.log`, `server_run.log`, `server_test.log` — لاگ‌ها در روت.
- `.vs/Astrologer-API.slnx/FileContentIndex/*.vsidx` — فایل‌های Visual Studio داخل گیت tracked هستند (۱.۹MB) و در `.gitignore` نیستند.
- `content.txt` (۵۰KB) — نام نامفهوم.

**پیشنهاد ساختار:**
```
scripts/          ← همه‌ی اسکریپت‌های یک‌بارمصرف
prototypes/       ← HTML های آزمایشی (یا حذف کامل — در گیت تاریخچه هست)
data/raw/         ← JSON/TXT های منبع حجیم (یا Git LFS)
```

---

## 🟢 تست‌ها — قوی‌ترین بخش پروژه

- **۳۴ فایل تست، ~۹,۰۰۰ خط** — پوشش endpointهای v5، auth، rate-limit، guest limits، خطاها، SVG well-formedness
- سیستم **baseline snapshot** برای خروجی چارت‌ها (`--update-baselines`) — روش عالی برای رگرسیون خروجی طالع‌بینی
- conftest تمیز: دیتابیس in-memory، زمان منجمد برای `/now/*`، جدا کردن DB تست از dev
- `fail_under = 95` روی coverage — هدف جسورانه (خوشحال می‌شوم تأیید کنید واقعاً به آن می‌رسید)

**تنها ضعف:** تست‌ها در این محیط قابل اجرا نبودند (دسترسی به PyPI بسته بود و وابستگی‌ها نصب نبودند) — روی سیستم خودتان `poe test` را اجرا کنید. اجرای خودکارشان در CI ضروری است.

---

## 📋 لیست اقدام پیشنهادی (به ترتیب اولویت)

1. **امروز:** حذف fallback هاردکد کلید DeepSeek از `context.py` خط ۳۴۰ — کلیدها در `.env` بمانند (طبق تصمیم، ابطال نشدند) ولی هرگز در سورس نباشند
2. **امروز:** یکسان‌سازی secret resolution: در `auth_service.py` از `app.config.security` استفاده شود
3. **این هفته:** تصمیم درباره‌ی روترهای دوبله — حذف نسخه‌ی `_router.py` یا نگه‌داشتن فقط آن‌ها
4. ~~پاک‌سازی ریشه~~ ✅ **انجام شد** — ۳۴ فایل بلااستفاده به `_archive/root-cleanup/` منتقل شد (مستندات: `_archive/root-cleanup/MANIFEST.md`)
5. **این هفته:** راه‌اندازی GitHub Actions (pytest + mypy + black --check)
6. **بعدی:** اعتبارسنجی ایمیل با pydantic `EmailStr`، سیاست پسورد قوی‌تر، مهاجرت به `lifespan`
7. **بعدی:** بررسی `X-Forwarded-For` با trusted proxy list، مهاجرت rate-limit مهمان به دیتابیس

---

## ✅ پاک‌سازی انجام‌شده (۲۰۲۶-۰۹-۰۶)

۳۴ فایل از ریشه به `_archive/root-cleanup/` منتقل شد — شامل ۹ اسکریپت یک‌بارمصرف، ۸ فایل HTML آزمایشی (از جمله `n.py` که در واقع HTML با پسوند اشتباه بود)، ۱۳ داده‌ی تکراری/بلااستفاده (~۹MB)، دیتابیس legacy و لاگ‌ها. **هیچ فایل استفاده‌شده‌ای جابه‌جا نشد** — همه‌ی مسیرهای runtime (cards.json، vedic JSONها، hafez، yoga، cosmic.db، index.html) قبل و بعد از انتقال تأیید شدند و فایل‌های اصلی کامپایل شدند. جزئیات هر فایل و دلیل انتقال: [`_archive/root-cleanup/MANIFEST.md`](_archive/root-cleanup/MANIFEST.md)

فایل‌های مرزی که عمداً در ریشه ماندند: `chart_analysis.py` (نامش در تست‌ها به‌عنوان تگ XML استفاده شده — بررسی دستی لازم)، `yoga_importer.py` (در کامنت parser به آن ارجاع است)، `wsgi.py` (ورودی PythonAnywhere).

---

*این گزارش توسط Claude تهیه شده — اجرای تست‌ها به‌دلیل محدودیت شبکه‌ی محیط امکان‌پذیر نبود.*
