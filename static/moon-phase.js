// ================================================================
//   MOON PHASE & LUNAR MANSIONS — فاز ماه و منازل قمر
//   API: /api/v5/moon-phase
//   Source: Lunar mansions (28 منازل قمری)
// ================================================================

function _moonEsc(s) { var d = document.createElement('div'); d.appendChild(document.createTextNode(s || '')); return d.innerHTML; }

// ================================================================
//   RELIABLE PHASE DERIVATION
//   The API response sometimes buckets the phase name incorrectly
//   (e.g. "Last Quarter" while the Moon is waning gibbous), reports
//   no ecliptic longitude, and its age_days is anchored to the wrong
//   event. We therefore derive the phase name/emoji from the (correct)
//   illumination % + waxing/waning stage, and compute the Moon's
//   ecliptic longitude ourselves (Meeus truncated series).
// ================================================================
var _SYNODIC_MONTH = 29.53058770576;
var _PHASE_BANDS = [
    { max: 1.84566,  name: 'New Moon',        emoji: '🌑' },
    { max: 7.38265,  name: 'Waxing Crescent', emoji: '🌒' },
    { max: 9.22831,  name: 'First Quarter',   emoji: '🌓' },
    { max: 14.76530, name: 'Waxing Gibbous',  emoji: '🌔' },
    { max: 16.61096, name: 'Full Moon',       emoji: '🌕' },
    { max: 22.14795, name: 'Waning Gibbous',  emoji: '🌖' },
    { max: 23.99361, name: 'Last Quarter',    emoji: '🌗' },
    { max: 29.53059, name: 'Waning Crescent', emoji: '🌘' }
];
var _MOON_SIGN_FA = {
    'Ari': 'حمل ♈', 'Tau': 'ثور ♉', 'Gem': 'جوزا ♊', 'Can': 'سرطان ♋',
    'Leo': 'اسد ♌', 'Vir': 'سنبله ♍', 'Lib': 'میزان ♎', 'Sco': 'عقرب ♏',
    'Sgr': 'قوس ♐', 'Cap': 'جدی ♑', 'Aqr': 'دلو ♒', 'Psc': 'حوت ♓'
};

function _toFiniteNum(v) {
    var n = parseFloat(String(v));
    return isFinite(n) ? n : NaN;
}

// m.phase = 0..1 fraction of the synodic cycle (0 = new, 0.5 = full).
// m.illumination = e.g. '61%' (reliable). m.stage = 'waxing'/'waning'.
function _moonPhaseFromApi(m) {
    var f = NaN;
    var illum = _toFiniteNum(m.illumination) / 100;
    var ph = _toFiniteNum(m.phase);
    if (isFinite(ph) && ph > 0 && ph < 1) {
        f = ph;
    } else if (isFinite(illum)) {
        var a = Math.acos(Math.max(-1, Math.min(1, 1 - 2 * illum))) / (2 * Math.PI); // 0..0.5
        var stage = String(m.stage || '').toLowerCase();
        if (stage === 'waning') f = 1 - a;
        else if (stage === 'waxing') f = a;
        else f = illum > 0.99 ? 0.5 : (illum <= 0.5 ? a : 1 - a);
    } else {
        f = 0.5;
    }
    if (!(illum >= 0 && illum <= 1)) illum = (1 - Math.cos(2 * Math.PI * f)) / 2;
    var ageDays = f * _SYNODIC_MONTH;
    var band = _PHASE_BANDS[_PHASE_BANDS.length - 1];
    for (var i = 0; i < _PHASE_BANDS.length; i++) {
        if (ageDays < _PHASE_BANDS[i].max) { band = _PHASE_BANDS[i]; break; }
    }
    return { f: f, illumination: illum, ageDays: ageDays, name: band.name, emoji: band.emoji };
}

// Approximate Moon ecliptic longitude, Meeus ch. 47 truncated series (~0.1 deg).
function _moonEclipticLongitude(utcMs) {
    var jd = utcMs / 86400000 + 2440587.5;
    var T = (jd - 2451545.0) / 36525;
    var Lp = 218.3164477 + 481267.88123421 * T;
    var D = 297.8501921 + 445267.1114034 * T;
    var M = 357.5291092 + 35999.0502909 * T;
    var Mp = 134.9633964 + 477198.8675055 * T;
    var F = 93.2720950 + 483202.0175233 * T;
    function sdeg(x) { return Math.sin(x * Math.PI / 180); }
    var lam = Lp
        + 6.288774 * sdeg(Mp)
        + 1.274027 * sdeg(2 * D - Mp)
        + 0.658314 * sdeg(2 * D)
        + 0.213618 * sdeg(2 * Mp)
        - 0.185116 * sdeg(M)
        - 0.114332 * sdeg(2 * F)
        + 0.058793 * sdeg(2 * (D - Mp))
        + 0.057066 * sdeg(2 * D - 2 * Mp + M)
        + 0.053322 * sdeg(2 * D + Mp)
        + 0.045758 * sdeg(2 * D - M)
        - 0.040923 * sdeg(Mp - M)
        - 0.034720 * sdeg(D)
        - 0.030383 * sdeg(Mp + M);
    return ((lam % 360) + 360) % 360;
}

function _signFromLongitude(lam) {
    var abbrs = ['Ari', 'Tau', 'Gem', 'Can', 'Leo', 'Vir', 'Lib', 'Sco', 'Sgr', 'Cap', 'Aqr', 'Psc'];
    var abbr = abbrs[Math.floor(lam / 30) % 12];
    return { abbr: abbr, fa: _MOON_SIGN_FA[abbr] };
}

function getMoonPhaseForm() {
    // تاریخِ شمسیِ امروز — با تقویمِ دقیقِ جلالی (PresetCalendar)
    var todayShamsi = { year: 1404, month: 6, day: 17 };
    try {
        if (window.PresetCalendar && PresetCalendar.toJalali) {
            var n = new Date();
            var j = PresetCalendar.toJalali(n.getFullYear(), n.getMonth() + 1, n.getDate());
            if (j && j.jy > 1200) todayShamsi = { year: j.jy, month: j.jm, day: j.jd };
        } else if (window.DateWheelPicker && DateWheelPicker.miladiToShamsi) {
            var now = new Date();
            var j2 = DateWheelPicker.miladiToShamsi(now.getFullYear(), now.getMonth() + 1, now.getDate());
            if (j2 && j2.year > 1200) todayShamsi = { year: j2.year, month: j2.month, day: j2.day };
        } else {
            var fmt = new Intl.DateTimeFormat('en-u-ca-persian', { year: 'numeric', month: 'numeric', day: 'numeric' });
            var parts = {};
            fmt.formatToParts(new Date()).forEach(function (p) { parts[p.type] = p.value; });
            todayShamsi = { year: parseInt(parts.year), month: parseInt(parts.month), day: parseInt(parts.day) };
        }
    } catch (e) {}
    var html = '<div style="max-width:900px;margin:0 auto;">';
    html += '<h3 style="color:var(--co-gold-300,#ecd9a0);text-align:center;font-family:var(--co-font-display,\'Reem Kufi\',sans-serif);">🌙 فاز ماه و منازل قمر</h3>';
    html += '<p style="color:var(--co-ink-dim,#aab2cd);text-align:center;font-size:13px;margin-bottom:16px;">فاز ماه و منزل قمری را بر اساس تاریخ انتخابی مشاهده کنید</p>';
    html += '<div style="background:rgba(255,255,255,0.03);border-radius:16px;padding:20px;border:1px solid rgba(255,255,255,0.05);">';
    html += '<div class="form-group" style="margin-bottom:12px;">';
    html += '<label style="color:var(--co-ink-dim,#aab2cd);font-size:13px;display:block;margin-bottom:6px;">📅 تاریخ (شمسی)</label>';
    html += '<div id="moonPhasePC"></div>';
    html += '<input type="hidden" id="moonPhaseDP_hidden" value="' + todayShamsi.year + '-' + String(todayShamsi.month).padStart(2,'0') + '-' + String(todayShamsi.day).padStart(2,'0') + '">';
    html += '</div>';
    html += '<div class="form-group" style="margin-bottom:12px;">';
    html += '<label style="color:var(--co-ink-dim,#aab2cd);font-size:13px;display:block;margin-bottom:6px;">📍 مکان (اختیاری)</label>';
    html += '<div style="display:flex;gap:8px;">';
    html += '<input type="text" id="moonPhaseLat" placeholder="عرض جغرافیایی" value="35.6892" style="flex:1;padding:8px 12px;border-radius:10px;border:1px solid rgba(221,192,112,0.3);background:rgba(7,12,31,0.5);color:#ece6d6;font-family:Vazirmatn,sans-serif;font-size:13px;box-sizing:border-box;">';
    html += '<input type="text" id="moonPhaseLng" placeholder="طول جغرافیایی" value="51.3890" style="flex:1;padding:8px 12px;border-radius:10px;border:1px solid rgba(221,192,112,0.3);background:rgba(7,12,31,0.5);color:#ece6d6;font-family:Vazirmatn,sans-serif;font-size:13px;box-sizing:border-box;">';
    html += '</div></div>';
    html += '<button class="btn-action primary" onclick="submitMoonPhase()" style="width:100%;margin-top:8px;">🌙 دریافت فاز ماه</button>';
    html += '</div>';
    html += '<div id="moonPhaseResult"></div>';
    html += '</div>';
    /* mount تقویمِ preset‌دار بعد از رندرِ DOM */
    setTimeout(function () {
        if (window.PresetCalendar) {
            PresetCalendar.mount({ mountId: 'moonPhasePC', mode: 'single', hiddenId: 'moonPhaseDP_hidden', defaultDuration: '0d' });
        }
    }, 0);
    return html;
}

// ─── 28 Lunar Mansions (منازل قمری) ───
var LUNAR_MANSIONS = [
    { name: 'شَرطان', nameEn: 'Al-Sharatain', start: 0, emoji: '🌟', desc: 'منزلِ آغازها — دو داسِ نخستینِ برجِ حمل؛ به کشف و آگاهی نیرو می‌دهد. برای کاشتنِ بذرِ هر کارِ جدید خوب است؛ برای سفرِ طولانی نامیمون.', suitable: ['شروع کارهای جدید', 'تصمیم‌گیری'], unsuitable: ['سفر طولانی'] },
    { name: 'بُطَین', nameEn: 'Al-Butain', start: 12.857, emoji: '🔥', desc: 'منزلِ شکم — تعادل و انصاف؛ برای حلِ اختلاف و معامله‌ی عادلانه نیکوست. در عجله، خطا می‌دهد.', suitable: ['حل اختلاف', 'معامله'], unsuitable: ['عجله در کار'] },
    { name: 'ثُرَیّا', nameEn: 'Ath-Thurayya', start: 25.714, emoji: '✨', desc: 'منزلِ پروین — خوشه‌ی ستاره‌ی خوش‌یمن؛ برای ازدواج و جشن و هر آغازِ پرنور مبارک است. برای تطعیل (شروعِ دشمنی) نه.', suitable: ['ازدواج', 'جشن'], unsuitable: ['تطعیل'] },
    { name: 'دَبَران', nameEn: 'Ad-Dabaran', start: 38.571, emoji: '❤️', desc: 'منزلِ قلبِ عقرب — قوی و پرشور؛ برای پروژه‌های بزرگ و تصمیم‌های سرنوشت‌ساز عالی، اما سفر و مذاکره‌ی حساس را به بعد بسپار.', suitable: ['شروع پروژه بزرگ', 'تصمیمات مهم'], unsuitable: ['سفر', 'مذاکرات حساس'] },
    { name: 'شَوله', nameEn: 'Ash-Shawla', start: 51.429, emoji: '🦂', desc: 'منزلِ نیشِ عقرب — انرژیِ جنگیِ تیز؛ برای دفاع، رقابت و ورزشِ پُرتلاش. برای ازدواج و معامله نامیمون.', suitable: ['جنگ و دفاع', 'ورزش'], unsuitable: ['ازدواج', 'معامله'] },
    { name: 'نَعائم', nameEn: 'An-Naaim', start: 64.286, emoji: '🌟', desc: 'منزلِ نعمت‌ها — آسایش و لذت؛ برای استراحت و بهره‌مندی از زندگی نیکوست. برای کارِ سنگین نه.', suitable: ['استراحت', 'لذت'], unsuitable: ['کار سنگین'] },
    { name: 'بَطح', nameEn: 'Al-Batayn', start: 77.143, emoji: '♉', desc: 'منزلِ باروری — برکت و فراوانیِ زمین؛ برای کشاورزی و خریدِ ملک نیکوست. سفرِ دریایی در آن خطر دارد.', suitable: ['کشاورزی', 'خرید ملک'], unsuitable: ['سفر دریایی'] },
    { name: 'دَبَرانِ پیرو', nameEn: 'Ad-Dabaran II', start: 90, emoji: '⭐', desc: 'منزلِ پیروی — ادامه‌ی راه؛ برای پیگیریِ کارهایِ در جریان و ثمررساندنِ بذرهایِ کاشته‌شده خوب است، نه شروعِ تازه.', suitable: ['ادامه کار', 'پیگیری'], unsuitable: ['شروع جدید'] },
    { name: 'هَقعه', nameEn: 'Al-Haqaa', start: 102.857, emoji: '🌀', desc: 'منزلِ حقیقت — یقین و دانایی؛ برای قضاوتِ عادلانه و دانشِ راستین نیکوست. برای تفریحِ بی‌دغدغه نه.', suitable: ['قضاوت', 'دانش'], unsuitable: ['تفریح'] },
    { name: 'نَثره', nameEn: 'An-Nathra', start: 115.714, emoji: '💧', desc: 'منزلِ قطره‌ی باران — آب و سفرِ دریایی؛ برای آبیاری و کارهایِ آبی نیکوست. آتش‌بازی و جرقه در آن خطر دارد.', suitable: ['سفر دریایی', 'آبیاری'], unsuitable: ['آتش‌بازی'] },
    { name: 'طَرف', nameEn: 'At-Tarf', start: 128.571, emoji: '👁️', desc: 'منزلِ نگاه — چشمِ بینا؛ برای مشاهده، سیاحت و دیدنِ زیبایی‌ها خوب است. برای پنهان‌کاری نامناسب.', suitable: ['نگاه کردن', 'مشاهده'], unsuitable: ['پنهان‌کاری'] },
    { name: 'جَبهه', nameEn: 'Al-Jabhah', start: 141.429, emoji: '🎭', desc: 'منزلِ پیشانی — زیبایی و آراستگی؛ برای پرستاری از خود، آرایش و هنرِ زیبا ساختن نیکوست. برای جنگ نه.', suitable: ['زیبایی', 'آرایش'], unsuitable: ['جنگ'] },
    { name: 'فَرّ', nameEn: 'Al-Farr', start: 154.286, emoji: '👑', desc: 'منزلِ عزت — شکوه و بزرگ‌منشی؛ برای احترام‌گذاری، تکریم و مراسمِ رسمی نیکوست. توهین در آن گران تمام می‌شود.', suitable: ['احترام', 'تکریم'], unsuitable: ['توهین'] },
    { name: 'عَذراء', nameEn: 'Al-Adhraa', start: 167.143, emoji: '🛡️', desc: 'منزلِ پاکی — طهارت و فضیلت؛ برای پاک‌سازیِ روح و کارهایِ نیک عالی است. گناه در آن سنگینی می‌کند.', suitable: ['پاکی', 'طهارت'], unsuitable: ['گناه'] },
    { name: 'غَفر', nameEn: 'Al-Ghafr', start: 180, emoji: '🙏', desc: 'منزلِ مغفرت — آمرزش و گذشت؛ برای آشتی، توبه و رهاکردنِ کینه‌ها نیکوست. انتقام در آن لعنت است.', suitable: ['بخشش', 'توبه'], unsuitable: ['انتقام'] },
    { name: 'زُبانا', nameEn: 'Az-Zubana', start: 192.857, emoji: '🗣️', desc: 'منزلِ زبان — بلاغت و سخنوری؛ برای سخنرانی، مناظره و مذاکره عالی است. دروغ در آن فوراً لو می‌رود.', suitable: ['سخنرانی', 'مذاکره'], unsuitable: ['دروغ'] },
    { name: 'اِکلیلِ عقرب', nameEn: 'Al-Iklil al-Aqrab', start: 205.714, emoji: '🦂', desc: 'منزلِ چنگالِ عقرب — انرژیِ نبردِ دوم؛ برای دفاعِ از خود و جنگِ حق عالی است. برای ازدواج نامیمون.', suitable: ['جنگ', 'دفاع'], unsuitable: ['ازدواج'] },
    { name: 'دَبَرانِ ستاره', nameEn: 'Ad-Dabaran al-Najm', start: 218.571, emoji: '⭐', desc: 'منزلِ ستاره‌ی بازگشتی — استقامت؛ برای ادامه‌ی پروژه‌ها و پیگیری تا نتیجه نیکوست، نه شروعِ تازه.', suitable: ['پیگیری', 'ادامه'], unsuitable: ['شروع جدید'] },
    { name: 'راکعه', nameEn: 'Ar-Rakiah', start: 231.429, emoji: '🌙', desc: 'منزلِ سجده — خشوع و عبادت؛ برای نماز، دعا و تمرینِ معنوی نیکوست. گناه در آن آشکار می‌شود.', suitable: ['نماز', 'عبادت'], unsuitable: ['گناه'] },
    { name: 'ثُرَیّایِ کبیر', nameEn: 'Ath-Thurayya al-Kabir', start: 244.286, emoji: '✨', desc: 'منزلِ داناییِ آسمانی — ستاره‌شناسی و طالع‌بینی؛ برای جست‌وجویِ حکمتِ کیهانی نیکوست. ظلم در آن بازگشتِ فوری دارد.', suitable: ['ستاره‌شناسی', 'طالع‌بینی'], unsuitable: ['ظلم'] },
    { name: 'دَبره', nameEn: 'Ad-Dabrah', start: 257.143, emoji: '🌀', desc: 'منزلِ پشت و پناه — حمایت و یاری؛ برای کمک‌کردن و پشتِ دیگران ایستادن نیکوست. خیانت در آن بی‌بازگشت است.', suitable: ['پشتیبانی', 'کمک'], unsuitable: ['خیانت'] },
    { name: 'نَعام', nameEn: 'An-Naam', start: 270, emoji: '🐪', desc: 'منزلِ شترمرغ — سیاحت و سفر؛ برای مسافرت، تجارت و کشفِ جاهایِ تازه عالی است. تنهایی در آن سنگینی می‌کند.', suitable: ['سفر', 'تجارت'], unsuitable: ['تنهایی'] },
    { name: 'بَطَن', nameEn: 'Al-Batan', start: 282.857, emoji: '🤰', desc: 'منزلِ پروردن — تغذیه و سلامت؛ برای اصلاحِ رژیم و زندگیِ سالم نیکوست. گرسنگی در آن به بدن آسیب می‌زند.', suitable: ['تغذیه', 'سالم‌زیستی'], unsuitable: ['گرسنگی'] },
    { name: 'صَفر', nameEn: 'As-Safar', start: 295.714, emoji: '🌍', desc: 'منزلِ سفرِ آغازین — حرکت و کوچ؛ برای بستنِ کوله و راه‌افتادن عالی است. خانه‌نشینی در آن رکود می‌آورد.', suitable: ['سفر', 'حرکت'], unsuitable: ['ماندن در خانه'] },
    { name: 'اَخبَره', nameEn: 'Al-Akhbarah', start: 308.571, emoji: '📰', desc: 'منزلِ خبرها — رساندنِ پیام و دانش؛ برای اطلاع‌رسانی، آموزش و گفت‌وگو نیکوست. پنهان‌کاری در آن نشت می‌کند.', suitable: ['اخبار', 'اطلاع‌رسانی'], unsuitable: ['پنهان‌کاری'] },
    { name: 'مُقدَّم', nameEn: 'Al-Muqaddam', start: 321.429, emoji: '🚀', desc: 'منزلِ پیشگام — رهبری و ابتکار؛ برای هدایتِ دیگران و به‌دست‌گرفتنِ فرمان عالی است. پیرویِ کورکورانه در آن خطاست.', suitable: ['رهبری', 'هدایت'], unsuitable: ['پیروی کورکورانه'] },
    { name: 'مُؤَخَّر', nameEn: 'Al-Muakhkhar', start: 334.286, emoji: '⏳', desc: 'منزلِ صبر — تعویقِ آگاهانه؛ برای انتظار، استراحت و کارهایِ به‌تعویق‌افتاده نیکوست. عجله در آن خطا می‌دهد.', suitable: ['صبر', 'تأخر'], unsuitable: ['عجله'] },
    { name: 'رِشاء', nameEn: 'Ar-Risha', start: 347.143, emoji: '🐏', desc: 'منزلِ سرِ گله — سرآغاز و رهبریِ دوباره؛ برای شروعِ ماجراهایِ تازه و پیشاهنگی عالی است. پایان‌دادن در آن سخت است.', suitable: ['سرآغاز', 'شروع'], unsuitable: ['پایان'] }
];

function getLunarMansion(degree) {
    for (var i = LUNAR_MANSIONS.length - 1; i >= 0; i--) {
        if (degree >= LUNAR_MANSIONS[i].start) return LUNAR_MANSIONS[i];
    }
    return LUNAR_MANSIONS[0];
}

var MOON_PHASE_FA = {
    'New Moon': 'ماه نو 🌑',
    'Waxing Crescent': 'هلال رو به رشد 🌒',
    'First Quarter': 'تربیع اول 🌓',
    'Waxing Gibbous': 'محدب رو به رشد 🌔',
    'Full Moon': 'ماه کامل 🌕',
    'Waning Gibbous': 'محدب رو به زوال 🌖',
    'Last Quarter': 'تربیع آخر 🌗',
    'Waning Crescent': 'هلال رو به زوال 🌘'
};

function submitMoonPhase() {
    /* hidden همیشه شمسی است — فقط اگر بازه‌ی شمسی (۱۳۰۰–۱۵۰۰) بود تبدیل کن؛
       میلادیِ نشت‌کرده یا هر مقدار خراب → خودترمیمی به امروز و بازنویسی hidden */
    var dEl = document.getElementById('moonPhaseDP_hidden');
    var rawVal = (dEl && dEl.value) || '';
    var mSh = /^(\d{4})-(\d{2})-(\d{2})$/.exec(rawVal);
    var shamsiOK = mSh && parseInt(mSh[1]) >= 1300 && parseInt(mSh[1]) <= 1500;
    var dateVal;
    if (shamsiOK) {
        dateVal = window.isoShamsiToGregorianISO ? window.isoShamsiToGregorianISO(rawVal) : rawVal;
    } else {
        /* خودترمیمی: مقدار خراب/میلادی/خالی → امروز (شمسی) و رندر مجدد فرم */
        var t = null;
        try {
            var now = new Date();
            t = window.PresetCalendar && PresetCalendar.toJalali
                ? PresetCalendar.toJalali(now.getFullYear(), now.getMonth() + 1, now.getDate())
                : null;
        } catch (e) {}
        if (t) {
            var iso = t.jy + '-' + String(t.jm).padStart(2, '0') + '-' + String(t.jd).padStart(2, '0');
            if (dEl) dEl.value = iso;
            var root = document.getElementById('moonPhasePC');
            if (root && window.PresetCalendar) {
                PresetCalendar.mount({ mountId: 'moonPhasePC', mode: 'single', hiddenId: 'moonPhaseDP_hidden', defaultDuration: '0d' });
            }
            dateVal = window.isoShamsiToGregorianISO ? window.isoShamsiToGregorianISO(iso) : iso;
        } else {
            dateVal = rawVal; /* آخرین fallback */
        }
    }
    var lat = parseFloat(document.getElementById('moonPhaseLat').value) || 35.6892;
    var lng = parseFloat(document.getElementById('moonPhaseLng').value) || 51.3890;
    var tz = 'Asia/Tehran'; // API rejects numeric offsets; must be a valid IANA timezone

    var parts = dateVal.split('-');
    var year = parseInt(parts[0]);
    var month = parseInt(parts[1]);
    var day = parseInt(parts[2]);
    if (!year || !month || !day) { alert('تاریخ را انتخاب کنید'); return; }

    var resultDiv = document.getElementById('moonPhaseResult');
    resultDiv.innerHTML = '<div style="text-align:center;padding:30px;color:var(--co-ink-dim,#aab2cd);">⏳ در حال محاسبه فاز ماه...</div>';

    fetch('/api/v5/moon-phase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            year: year,
            month: month,
            day: day,
            hour: 12,
            minute: 0,
            latitude: lat,
            longitude: lng,
            timezone: tz
        })
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
        if (data.status === 'OK' && data.moon_phase_overview) {
            displayMoonPhase(data.moon_phase_overview, dateVal, lat, lng);
        } else {
            resultDiv.innerHTML = '<div style="text-align:center;padding:20px;color:var(--co-danger,#ff7675);">⚠️ خطا در دریافت اطلاعات</div>';
        }
    })
    .catch(function(err) {
        resultDiv.innerHTML = '<div style="text-align:center;padding:20px;color:var(--co-danger,#ff7675);">⚠️ خطا: ' + _moonEsc(err.message) + '</div>';
    });
}

function displayMoonPhase(overview, dateVal, lat, lng) {
    var moon = overview.moon || {};
    var info = _moonPhaseFromApi(moon);

    // Ecliptic longitude of the Moon for the requested noon (Iran time, UTC+3:30)
    var parts = String(dateVal || '').split('-');
    var gY = parseInt(parts[0]);
    var gM = parseInt(parts[1]);
    var gD = parseInt(parts[2]);
    var utcMs = isFinite(gY) ? Date.UTC(gY, (gM || 1) - 1, gD || 1, 8, 30, 0) : Date.now();
    var moonLon = _moonEclipticLongitude(utcMs);
    var lonSign = _signFromLongitude(moonLon);
    var mansion = getLunarMansion(moonLon);

    // Sign: prefer the API's real moon sign, fall back to the computed longitude
    var apiSign = (moon.zodiac && moon.zodiac.moon_sign) ? moon.zodiac.moon_sign : '';
    var moonSignFa = _MOON_SIGN_FA[apiSign] || lonSign.fa || apiSign;

    var phaseFa = MOON_PHASE_FA[info.name] || info.name;
    var illumPct = Math.round(info.illumination * 100);
    var ageDays = Math.round(info.ageDays);
    var stageFa = info.f < 0.5 ? 'رو به رشد (نیمه اول ماه)' : 'رو به زوال (نیمه دوم ماه)';

    // Persian digits for the date label
    var dateLabel = String(dateVal || '');
    try { dateLabel = dateLabel.replace(/\d/g, function(ch) { return '۰۱۲۳۴۵۶۷۸۹'[ch]; }); } catch(_) {}

    var html = '<div class="moon-result">';

    // Main phase card
    html += '<div class="moon-phase-main">';
    html += '<div class="moon-emoji-large">' + _moonEsc(info.emoji) + '</div>';
    html += '<div class="moon-phase-name">' + _moonEsc(phaseFa) + '</div>';
    html += '<div class="moon-illumination">💡 درصد روشنایی: ' + illumPct + '٪</div>';
    html += '<div class="moon-date">📅 تاریخ: ' + _moonEsc(dateLabel) + '</div>';
    html += '<div class="moon-age">🌙 سن ماه: ' + ageDays + ' روز (از ' + Math.round(_SYNODIC_MONTH) + ' روز)</div>';
    html += '<div class="moon-stage">📈 مرحله: ' + _moonEsc(stageFa) + '</div>';
    if (moonSignFa) html += '<div class="moon-sign">✨ برج ماه: ' + _moonEsc(moonSignFa) + '</div>';
    html += '</div>';

    // Lunar mansion card
    html += '<div class="moon-mansion">';
    html += '<div class="moon-mansion-header">';
    html += '<span class="moon-mansion-emoji">' + _moonEsc(mansion.emoji) + '</span>';
    html += '<div>';
    html += '<div class="moon-mansion-name">🏠 منزل قمر: ' + _moonEsc(mansion.name) + ' (' + _moonEsc(mansion.nameEn) + ')</div>';
    html += '<div class="moon-mansion-desc">' + _moonEsc(mansion.desc) + '</div>';
    html += '</div></div>';

    html += '<div class="moon-activities">';
    html += '<div class="moon-activity suitable"><span class="moon-act-label">✅ مناسب برای:</span>';
    mansion.suitable.forEach(function(a) { html += '<span class="moon-act-tag good">' + _moonEsc(a) + '</span>'; });
    html += '</div>';
    html += '<div class="moon-activity unsuitable"><span class="moon-act-label">❌ نامناسب برای:</span>';
    mansion.unsuitable.forEach(function(a) { html += '<span class="moon-act-tag bad">' + _moonEsc(a) + '</span>'; });
    html += '</div>';
    html += '</div>';
    html += '</div>';

    // Moonrise/moonset
    if (moon.moonrise || moon.moonset) {
        html += '<div class="moon-times">';
        if (moon.moonrise) html += '<div class="moon-time-item">🌅 طلوع ماه: ' + _moonEsc(String(moon.moonrise)) + '</div>';
        if (moon.moonset) html += '<div class="moon-time-item">🌇 غروب ماه: ' + _moonEsc(String(moon.moonset)) + '</div>';
        html += '</div>';
    }

    // Phase visualization
    html += '<div class="moon-phase-visual">';
    html += '<h4>📊 نمودار فاز ماه</h4>';
    html += renderMoonPhaseSVG(info.f, moonLon);
    html += '</div>';

    html += '</div>';

    document.getElementById('moonPhaseResult').innerHTML = html;
}

function _phaseEmojiForF(f) {
    var age = f * _SYNODIC_MONTH;
    for (var i = 0; i < _PHASE_BANDS.length; i++) {
        if (age < _PHASE_BANDS[i].max) return _PHASE_BANDS[i].emoji;
    }
    return '🌘';
}

function renderMoonPhaseSVG(phaseFrac, position) {
    // f: 0 = new moon, 0.5 = full moon, 1 = next new moon
    var f = isFinite(phaseFrac) ? phaseFrac : 0;
    f = Math.max(0, Math.min(1, f));
    var L = (1 - Math.cos(2 * Math.PI * f)) / 2; // illuminated fraction 0..1
    // قالبِ جدید (theme.js): دایره‌ی ماهِ واقعی با خطِ تقسیم دقیق + حلقه‌ی روشنایی
    if (window.CoMoon && CoMoon.discSVG) {
        return '<div style="display:flex;flex-direction:column;align-items:center;gap:6px;">'
            + CoMoon.discSVG(f, { size: 150, ring: true })
            + '<div style="font-size:11px;color:var(--co-ink-dim,#aab2cd);">حلقه: ' + Math.round(L * 100) + '٪ روشنایی</div>'
            + '</div>';
    }
    var emoji = _phaseEmojiForF(f);
    var cx = 70, cy = 70, r = 54, stroke = 9;
    var circ = 2 * Math.PI * r;
    var svg = '<svg viewBox="0 0 140 140" width="150" height="150" style="display:block;margin:10px auto;">';
    // Background disc
    svg += '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r + stroke / 2) + '" fill="#0a0f1e" stroke="rgba(221,192,112,0.25)" stroke-width="1"/>';
    // Track ring
    svg += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="' + stroke + '"/>';
    // Illumination arc (starts at 12 o'clock, clockwise)
    if (L > 0.001) {
        var len = circ * L;
        svg += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="#f0e6b0" stroke-width="' + stroke + '" stroke-linecap="round" stroke-dasharray="' + len + ' ' + circ + '" transform="rotate(-90 ' + cx + ' ' + cy + ')"/>';
    }
    // Phase emoji in the center
    svg += '<text x="' + cx + '" y="' + (cy + 21) + '" text-anchor="middle" font-size="52">' + emoji + '</text>';
    svg += '</svg>';
    return svg;
}

function translateMoonSign(sign) {
    var signs = {
        'Aries': 'حمل ♈', 'Taurus': 'ثور ♉', 'Gemini': 'جوزا ♊',
        'Cancer': 'سرطان ♋', 'Leo': 'اسد ♌', 'Virgo': 'سنبله ♍',
        'Libra': 'میزان ♎', 'Scorpio': 'عقرب ♏', 'Sagittarius': 'قوس ♐',
        'Capricorn': 'جدی ♑', 'Aquarius': 'دلو ♒', 'Pisces': 'حوت ♓'
    };
    return signs[sign] || sign;
}

function translateStage(stage) {
    var stages = {
        'waxing': 'رو به رشد (اول ماه)',
        'waning': 'رو به زوال (آخر ماه)'
    };
    return stages[stage] || stage;
}
