import json

mmq_qs = ["وقتی اطرافیان دست شما را لمس می‌کنند، در مورد گرمی و سردی آن چه می‌گویند؟", "اندازه کف دست شما در چه حد می‌باشد؟", "سرعت تأثیرپذیری شما از سرما و گرما چگونه است؟", "هنگام صحبت کردن چند جمله متوالی را چگونه ادا می‌کنید؟", "سرعت خصم و عصبانیت شما چگونه است؟", "سرعت تأثیرپذیری شما از غذاهای با طبع گرم یا سرد چگونه است؟", "قوت صدای شما نسبت به اطرافیان چگونه است؟", "سرعت حرکات جسمی شما نسبت به اطرافیان چگونه است؟", "موضعیت چاقی و لاغری شما نسبت به سایرین چگونه است؟", "موضعیت نرمی و خشکی پوست شما چگونه است؟"]
smq_qs = ["راه رفتن شما چگونه است؟", "میزان نشاط خود را چگونه می‌دانید؟", "وقتی اطرافیان دست شما را لمس می‌کنند در مورد گرمی و سردی آن چه می‌گویند؟", "در مجموع روابط اجتماعی خود را سرد می‌دانید یا گرم؟", "در جمع دوستان و آشنایان، پرحرفید یا کم‌حرف؟", "بلندی صدای شما چگونه است؟", "در انجام کارهای روزمره در تصمیم می‌گیرید یا زود؟", "انرجی شما در انجام کارهای روزمره، چگونه می‌باشد؟", "سرما را بهتر تحمل می‌کنید یا گرما را؟", "هنگام صحبت کردن، جملات متوالی را چگونه بیان می‌کنید؟", "چه غذاهایی معمولا شما را اذیت می‌کند؟", "اندازه قفصه سینه شما نسبت به دیگران چگونه است؟", "بین اطرافیان، بعنوانی ترسو معروفید یا نترس؟", "سرعت عمل شما در انجام کارهای روزمره، چگونه میباشد؟", "پهنایی کف دست شما چگونه است؟", "معمولایی پرخواب هستید یا کم‌خواب؟", "خود را از نظر چاقی و لاغری چگونه می‌دانید؟", "استعداد چاقی شما چگونه است؟", "رنگ پوست شما از نظر کم‌پستی و پریشتی چگونه است؟"]

with open("static/script.js", "r", encoding="utf-8") as fp:
    content = fp.read()

marker = "// ================================================================
//   INIT"
if marker not in content:
    marker = "// ================================================================
//   INIT"

if marker in content:
    js = """
// ================================================================
//   MIZAJ SECTION - MMQ (10Q) & SMQ (20Q)
// ================================================================

function getMizajForm() {
    var h = '<div class="mizaj-container" style="max-width:800px;margin:0 auto;">';
    h += '<h3 style="color:#a29bfe;text-align:center;">🧬 تعیین مزاج با پرسشنامه‌های معتبر</h3>';
    h += '<div style="display:flex;justify-content:center;gap:20px;margin:20px 0;background:rgba(255,255,255,0.03);padding:15px;border-radius:12px;border:1px solid rgba(255,255,255,0.05);">';
    h += '<label style="display:flex;align-items:center;gap:8px;cursor:pointer;padding:8px 16px;border-radius:30px;background:rgba(108,92,231,0.2);border:1px solid #6c5ce7;" id="lbl_mmq">';
    h += '<input type="radio" name="mizaj_type" value="mmq" checked onchange="toggleMizajForms()"> ۱۰ سوالی (مجاهد)</label>';
    h += '<label style="display:flex;align-items:center;gap:8px;cursor:pointer;padding:8px 16px;border-radius:30px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);" id="lbl_smq">';
    h += '<input type="radio" name="mizaj_type" value="smq" onchange="toggleMizajForms()"> ۲۰ سوالی (سلمان‌نژاد)</label>';
    h += '</div>';
    h += '<div id="mmq-questions"></div>';
    h += '<div id="smq-questions" style="display:none;"></div>';
    h += '<div id="mizaj-result" style="margin-top:25px;"></div>';
    h += '</div>';
    return h;
}"""
    content = content.replace(marker, js + "
" + marker)
    with open("static/script.js", "w", encoding="utf-8") as fp:
        fp.write(content)
    print("SUCCESS")
else:
    print("ERROR: marker not found")
