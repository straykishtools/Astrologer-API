"""
fix_legacy_prompt.py — یک‌بار اجرا، متن legacy باقی‌مانده در
app/routers/context.py (از خط ۲۷۷ تا قبل از def _analysis_models) را حذف می‌کند.
و تابع dummy _OLD_analysis_prompt_legacy_removed_REMOVED_NOW نیز حذف می‌شود.

این فایل بعد از اجرا می‌تواند حذف شود.
"""
import re
from pathlib import Path

P = Path(__file__).resolve().parents[1] / "app" / "routers" / "context.py"
src = P.read_text(encoding="utf-8")
orig = src

# ۱) حذف تابع dummy
src = re.sub(
    r"def _OLD_analysis_prompt_legacy_removed_REMOVED_NOW\(\):\s*# marker removed\n    pass\n\n+",
    "",
    src,
)
src = re.sub(
    r"def _OLD_analysis_prompt_legacy_removed\(\):\s*# marker[^\n]*\n",
    "",
    src,
)

# ۲) پیدا کردن شروع متن legacy (نشانه: "داده‌ی زیر از یک چارت واقعی")
# و پایان آن (نشانه: "گره شمالی.\"\"\"" یا هر """ بسته شدن docstring)
m = re.search(r"داده‌ی زیر از یک چارت واقعی", src)
if m:
    # پیدا کردن """ بسته شدن بعد از آن
    end = src.find('"""', m.start())
    if end != -1:
        end_close = end + 3
        src = src[:m.start()] + src[end_close:]
        # حذف توضیحات اضافی
        src = re.sub(
            r"# متن legacy داخل این فایل[^\n]*\n",
            "",
            src,
        )
        src = re.sub(
            r"# \(تابع _analysis_prompt[^\n]*\n",
            "",
            src,
        )
        src = re.sub(
            r"# خطوط \d+-\d+ متن قدیمی[^\n]*\n",
            "",
            src,
        )

# ۳) فشرده‌سازی خطوط خالی متوالی
src = re.sub(r"\n{3,}", "\n\n", src)

if src != orig:
    P.write_text(src, encoding="utf-8")
    print(f"cleaned: {P}")
    print(f"  {len(orig)} -> {len(src)} chars ({len(orig) - len(src)} removed)")
else:
    print("no changes needed")
