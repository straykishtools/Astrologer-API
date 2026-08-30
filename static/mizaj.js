// ============================================
// MIZAJ (مزاج‌شناسی) TAB
// همان API واقعی پروژه حفظ شده: /api/v5/mizaj
// فقط ظاهر، خوانایی کد و نمایش نتیجه (گیج‌های مزاج) اصلاح شده است.
// ============================================

var MIZAJ_MMQ_QS = [
    "وقتی اطرافیان دست شما را لمس می‌کنند، در مورد گرمی و سردی آن چه می‌گویند؟",
    "اندازه کف دست شما در چه حد می‌باشد؟",
    "سرعت تأثیرپذیری شما از سرما و گرما چگونه است؟",
    "هنگام صحبت کردن چند جمله متوالی را چگونه ادا می‌کنید؟",
    "سرعت خشم و عصبانیت شما چگونه است؟",
    "سرعت تأثیرپذیری شما از غذاهای با طبع گرم یا سرد چگونه است؟",
    "قوت صدای شما نسبت به اطرافیان چگونه است؟",
    "سرعت حرکات جسمی شما نسبت به اطرافیان چگونه است؟",
    "وضعیت چاقی و لاغری شما نسبت به سایرین چگونه است؟",
    "وضعیت نرمی و خشکی پوست شما چگونه است؟"
];

var MIZAJ_SMQ_QS = [
    "راه رفتن شما چگونه است؟",
    "میزان نشاط خود را چگونه می‌دانید؟",
    "وقتی اطرافیان دست شما را لمس می‌کنند در مورد گرمی و سردی آن چه می‌گویند؟",
    "در مجموع روابط اجتماعی خود را سرد می‌دانید یا گرم؟",
    "در جمع دوستان و آشنایان، پرحرفید یا کم‌حرف؟",
    "بلندی صدای شما چگونه است؟",
    "در انجام کارهای روزمره دیر تصمیم می‌گیرید یا زود؟",
    "انرژی شما در انجام کارهای روزمره چگونه است؟",
    "سرما را بهتر تحمل می‌کنید یا گرما را؟",
    "هنگام صحبت کردن، جملات متوالی را چگونه بیان می‌کنید؟",
    "چه غذاهایی معمولاً شما را اذیت می‌کند؟",
    "اندازه‌ی قفسه‌ی سینه‌ی شما نسبت به دیگران چگونه است؟",
    "بین اطرافیان، به‌عنوان فردی ترسو معروفید یا نترس؟",
    "سرعت عمل شما در انجام کارهای روزمره چگونه است؟",
    "پهنای کف دست شما چگونه است؟",
    "معمولاً پرخواب هستید یا کم‌خواب؟",
    "خود را از نظر چاقی و لاغری چگونه می‌دانید؟",
    "رنگ پوست شما در محدوده‌ی کدام‌یک از گزینه‌هاست؟",
    "استعداد چاقی شما چگونه است؟",
    "موی سر شما از نظر کم‌پشتی و پرپشتی چگونه است؟"
];

function getMizajForm() {
    return `
    <div class="mizaj-container">
        <h3 class="mizaj-title">🧬 تعیین مزاج با پرسشنامه‌های معتبر</h3>

        <div class="mizaj-switch">
            <label class="mizaj-switch-opt active" id="lbl_mmq">
                <input type="radio" name="mizaj_type" value="mmq" checked onchange="toggleMizajForms()">
                ۱۰ سوالی (مجاهد)
            </label>
            <label class="mizaj-switch-opt" id="lbl_smq">
                <input type="radio" name="mizaj_type" value="smq" onchange="toggleMizajForms()">
                ۲۰ سوالی (سلمان‌نژاد)
            </label>
        </div>

        <div id="mmq-questions">${getMmqQuestions()}</div>
        <div id="smq-questions" style="display:none;">${getSmqQuestions()}</div>

        <button class="btn-primary" onclick="submitMizaj()">🧬 حساب کن مزاج من را</button>
        <div id="mizaj-result" class="mizaj-result-slot"></div>
    </div>`;
}

function toggleMizajForms() {
    const type = document.querySelector('input[name="mizaj_type"]:checked').value;
    document.getElementById('mmq-questions').style.display = (type === 'mmq') ? 'block' : 'none';
    document.getElementById('smq-questions').style.display = (type === 'smq') ? 'block' : 'none';
    document.getElementById('lbl_mmq').classList.toggle('active', type === 'mmq');
    document.getElementById('lbl_smq').classList.toggle('active', type === 'smq');
}

function getMmqQuestions() {
    const opts = `
        <option value="1">۱ (سرد / کم)</option>
        <option value="2" selected>۲ (معتدل / متوسط)</option>
        <option value="3">۳ (گرم / زیاد)</option>`;
    return `<div class="mizaj-q-block">${MIZAJ_MMQ_QS.map((q, i) => `
        <div class="form-group mizaj-q">
            <label>${i + 1}. ${q}</label>
            <select id="mmq_q${i + 1}" class="abjad-input">${opts}</select>
        </div>`).join('')}</div>`;
}

function getSmqQuestions() {
    return `<div class="mizaj-q-block">${MIZAJ_SMQ_QS.map((q, i) => {
        let opts = '';
        for (let v = 1; v <= 5; v++) opts += `<option value="${v}"${v === 3 ? ' selected' : ''}>${v}</option>`;
        return `
        <div class="form-group mizaj-q">
            <label>${i + 1}. ${q}</label>
            <select id="smq_q${i + 1}" class="abjad-input">${opts}</select>
        </div>`;
    }).join('')}</div>`;
}

function submitMizaj() {
    const type = document.querySelector('input[name="mizaj_type"]:checked').value;
    const prefix = (type === 'mmq') ? 'mmq_q' : 'smq_q';
    const total = (type === 'mmq') ? 10 : 20;
    const answers = {};
    for (let i = 1; i <= total; i++) {
        const el = document.getElementById(prefix + i);
        if (el) answers['q' + i] = parseInt(el.value, 10);
    }

    const resultBox = document.getElementById('mizaj-result');
    resultBox.innerHTML = '<p style="text-align:center;color:#aaa;">⏳ در حال محاسبه...</p>';

    fetch('/api/v5/mizaj', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionnaire_type: type, answers })
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === 'success') displayMizajResult(data.data);
        else resultBox.innerHTML = `<p style="color:#ff6b6b;">❌ خطا: ${data.detail || 'سرور'}</p>`;
    })
    .catch(() => {
        resultBox.innerHTML = '<p style="color:#ff6b6b;">❌ خطا در ارتباط با سرور</p>';
    });
}

// ---------- Gauge helpers ----------
// چهار مزاج سنتی از ترکیب دو محور «گرمی/سردی» و «تری/خشکی» ساخته می‌شوند.
// چون بک‌اند فقط نام مزاج را برمی‌گرداند، درصد هر محور از روی همین نام
// به‌صورت نمایشی (نه یک اندازه‌گیری دقیق) استخراج می‌شود.
function mizajAxesFromTemperament(name) {
    const n = (name || '').trim();
    const hotWords = ['دموی', 'صفراوی', 'گرم'];
    const coldWords = ['بلغمی', 'سوداوی', 'سرد'];
    const wetWords = ['دموی', 'بلغمی', 'تر'];
    const dryWords = ['صفراوی', 'سوداوی', 'خشک'];

    const isHot = hotWords.some(w => n.includes(w));
    const isCold = coldWords.some(w => n.includes(w));
    const isWet = wetWords.some(w => n.includes(w));
    const isDry = dryWords.some(w => n.includes(w));

    const hot = isHot && !isCold ? 75 : (!isHot && isCold ? 25 : 50);
    const wet = isWet && !isDry ? 75 : (!isWet && isDry ? 25 : 50);
    return { hot, cold: 100 - hot, wet, dry: 100 - wet };
}

function renderMizajGauge(id, percent, colorFrom, colorTo, label, valueText) {
    const r = 42, c = 2 * Math.PI * r;
    return `
    <div class="mizaj-gauge-wrap">
        <div class="mizaj-gauge">
            <svg viewBox="0 0 100 100" width="100" height="100">
                <circle class="mizaj-gauge-track" cx="50" cy="50" r="${r}"></circle>
                <circle class="mizaj-gauge-value" cx="50" cy="50" r="${r}"
                    style="stroke:${colorTo};stroke-dasharray:${c};stroke-dashoffset:${c};"
                    data-target-offset="${c - (percent / 100) * c}"
                    data-gradient-from="${colorFrom}"></circle>
            </svg>
            <div class="mizaj-gauge-center">${valueText}</div>
        </div>
        <div class="mizaj-gauge-label">${label}</div>
    </div>`;
}

function displayMizajResult(data) {
    const recs = (data.recommendations || [])
        .map(r => `<li class="mizaj-rec">✅ ${r}</li>`).join('');

    const axes = mizajAxesFromTemperament(data.temperament);

    document.getElementById('mizaj-result').innerHTML = `
        <div class="mizaj-result-card">
            <div class="mizaj-result-head">
                <h4 class="mizaj-result-title">🧬 مزاج: ${data.temperament}</h4>
                <span class="mizaj-questionnaire-tag">${data.questionnaire}</span>
            </div>

            <div class="mizaj-gauges">
                ${renderMizajGauge('hot', axes.hot, '#ffcf5c', '#ff6b4a', 'گرمی', axes.hot + '٪')}
                ${renderMizajGauge('cold', axes.cold, '#5cc9ff', '#3fa7ff', 'سردی', axes.cold + '٪')}
                ${renderMizajGauge('wet', axes.wet, '#00d2a0', '#3fa7ff', 'تَری', axes.wet + '٪')}
                ${renderMizajGauge('dry', axes.dry, '#ffb454', '#ff5f6d', 'خشکی', axes.dry + '٪')}
            </div>

            <p class="mizaj-desc">${data.description}</p>

            <div class="mizaj-recs-box">
                <h5 class="mizaj-recs-title">💡 توصیه‌ها:</h5>
                <ul class="mizaj-recs-list">${recs}</ul>
            </div>
        </div>`;

    // انیمیشن پر شدن گیج‌ها بعد از قرارگیری در DOM
    requestAnimationFrame(() => {
        document.querySelectorAll('.mizaj-gauge-value').forEach((circle) => {
            const offset = circle.getAttribute('data-target-offset');
            requestAnimationFrame(() => { circle.style.strokeDashoffset = offset; });
        });
    });
}
