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
    var today = new Date();
    var todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
    var html = '<div style="max-width:900px;margin:0 auto;">';
    html += '<h3 style="color:#a29bfe;text-align:center;">🌙 فاز ماه و منازل قمر</h3>';
    html += '<p style="color:#8a82a0;text-align:center;font-size:13px;margin-bottom:16px;">فاز ماه و منزل قمری را بر اساس تاریخ انتخابی مشاهده کنید</p>';
    html += '<div style="background:rgba(255,255,255,0.03);border-radius:16px;padding:20px;border:1px solid rgba(255,255,255,0.05);">';
    html += '<div class="form-group" style="margin-bottom:12px;">';
    html += '<label style="color:#b0c4e0;font-size:13px;display:block;margin-bottom:6px;">📅 تاریخ</label>';
    html += '<input type="date" id="moonPhaseDate" value="' + todayStr + '" style="width:100%;padding:10px 14px;border-radius:12px;border:1px solid rgba(221,192,112,0.4);background:rgba(7,12,31,0.6);color:#ece6d6;font-family:Vazirmatn,sans-serif;font-size:14px;box-sizing:border-box;">';
    html += '</div>';
    html += '<div class="form-group" style="margin-bottom:12px;">';
    html += '<label style="color:#b0c4e0;font-size:13px;display:block;margin-bottom:6px;">📍 مکان (اختیاری)</label>';
    html += '<div style="display:flex;gap:8px;">';
    html += '<input type="text" id="moonPhaseLat" placeholder="عرض جغرافیایی" value="35.6892" style="flex:1;padding:8px 12px;border-radius:10px;border:1px solid rgba(221,192,112,0.3);background:rgba(7,12,31,0.5);color:#ece6d6;font-family:Vazirmatn,sans-serif;font-size:13px;box-sizing:border-box;">';
    html += '<input type="text" id="moonPhaseLng" placeholder="طول جغرافیایی" value="51.3890" style="flex:1;padding:8px 12px;border-radius:10px;border:1px solid rgba(221,192,112,0.3);background:rgba(7,12,31,0.5);color:#ece6d6;font-family:Vazirmatn,sans-serif;font-size:13px;box-sizing:border-box;">';
    html += '</div></div>';
    html += '<button class="btn-action primary" onclick="submitMoonPhase()" style="width:100%;margin-top:8px;">🌙 دریافت فاز ماه</button>';
    html += '</div>';
    html += '<div id="moonPhaseResult"></div>';
    html += '</div>';
    return html;
}

// ─── 28 Lunar Mansions (منازل قمری) ───
var LUNAR_MANSIONS = [
    { name: 'شرط', nameEn: 'Sharat', start: 0, emoji: '🌟', desc: 'Auspice of discernment — governed by the heart of the Scorpion, strengthens judgment and awareness.', suitable: ['شروع کارهای جدید', 'تصمیم‌گیری'], unsuitable: ['سفر طولانی'] },
    { name: 'زبانه', nameEn: 'Zubana', start: 12.857, emoji: '🔥', desc: 'Auspice of balance and equilibrium — favors resolving disputes and making fair deals.', suitable: ['حل اختلاف', 'معامله'], unsuitable: ['عجله در کار'] },
    { name: 'اکلیل', nameEn: 'Iklil', start: 25.714, emoji: '👑', desc: 'The Crown — celestial crest marking a peak of honor, favored for weddings and celebrations.', suitable: ['ازدواج', 'جشن'], unsuitable: ['تطعیل'] },
    { name: 'قلب', nameEn: 'Qalb', start: 38.571, emoji: '❤️', desc: 'The Heart of the Scorpion — a powerful, intense mansion; ideal for major undertakings but risky for travel.', suitable: ['شروع پروژه بزرگ', 'تصمیمات مهم'], unsuitable: ['سفر', 'مذاکرات حساس'] },
    { name: 'شوله', nameEn: 'Shawla', start: 51.429, emoji: '🦂', desc: 'The Scorpion\'s Tail — fierce and combative energy; suited for defense, competition, and vigorous sports.', suitable: ['جنگ و دفاع', 'ورزش'], unsuitable: ['ازدواج', 'معامله'] },
    { name: 'نعائم', nameEn: 'Naaim', start: 64.286, emoji: '🌟', desc: 'The Pleiades — mansion of comfort, rest, and enjoyment; auspicious for leisure and pleasure.', suitable: ['استراحت', 'لذت'], unsuitable: ['کار سنگین'] },
    { name: 'بقره', nameEn: 'Baqara', start: 77.143, emoji: '♉', desc: 'The Cow — Taurus mansion symbolizing fertility and abundance; favors agriculture and acquiring land.', suitable: ['کشاورزی', 'خرید ملک'], unsuitable: ['سفر دریایی'] },
    { name: 'دبران', nameEn: 'Dabaran', start: 90, emoji: '⭐', desc: 'The Follower — Aldebaran mansion; favors continuing existing work and pursuing follow-through.', suitable: ['ادامه کار', 'پیگیری'], unsuitable: ['شروع جدید'] },
    { name: 'هقعده', nameEn: 'Haqqa', start: 102.857, emoji: '🌀', desc: 'The Nature — mansion of certainty and truth; favors judgment, scholarship, and righteous knowledge.', suitable: ['قضاوت', 'دانش'], unsuitable: ['تفریح'] },
    { name: 'نثرة', nameEn: 'Nathrah', start: 115.714, emoji: '💧', desc: 'The Drop — mansion of rain and water; favors sea travel, irrigation, and activities involving water.', suitable: ['سفر دریایی', 'آبیاری'], unsuitable: ['آتش‌بازی'] },
    { name: 'طرف', nameEn: 'Tarf', start: 128.571, emoji: '👁️', desc: 'The Glance — mansion of vision and observation; favors watching, sightseeing, and observation.', suitable: ['نگاه کردن', 'مشاهده'], unsuitable: ['پنهان‌کاری'] },
    { name: 'جَبه', nameEn: 'Jabhah', start: 141.429, emoji: '🎭', desc: 'The Forehead — mansion of beauty and adornment; favors grooming, cosmetic arts, and self-care.', suitable: ['زیبایی', 'آرایش'], unsuitable: ['جنگ'] },
    { name: 'فرّ', nameEn: 'Farr', start: 154.286, emoji: '👑', desc: 'Dignity — mansion of honor and nobility; favors showing respect, bestowing honors, and formal ceremonies.', suitable: ['احترام', 'تکریم'], unsuitable: ['توهین'] },
    { name: 'عَذَر', nameEn: 'Adhra', start: 167.143, emoji: '🛡️', desc: 'Purity — mansion of cleanliness and virtue; favors spiritual purification and righteous deeds.', suitable: ['پاکی', 'طهارت'], unsuitable: ['گناه'] },
    { name: 'غُفر', nameEn: 'Ghufr', start: 180, emoji: '🙏', desc: 'Forgiveness — mansion of mercy and pardon; favors reconciliation, repentance, and letting go.', suitable: ['بخشش', 'توبه'], unsuitable: ['انتقام'] },
    { name: 'زَبَانَه', nameEn: 'Zabanah', start: 192.857, emoji: '🗣️', desc: 'The Tongue — mansion of eloquence and speech; favors oratory, debate, and negotiation.', suitable: ['سخنرانی', 'مذاکره'], unsuitable: ['دروغ'] },
    { name: 'اَکۡرَب', nameEn: 'Akrab', start: 205.714, emoji: '🦂', desc: 'The Claw — second scorpion mansion; fierce martial energy suited for warfare and self-defense.', suitable: ['جنگ', 'دفاع'], unsuitable: ['ازدواج'] },
    { name: 'اَلدَّبَرَان', nameEn: 'Ad-Dabaran', start: 218.571, emoji: '⭐', desc: 'The Reoccurring Star — mansion of persistence; favors continuing ongoing projects and follow-through.', suitable: ['پیگیری', 'ادامه'], unsuitable: ['شروع جدید'] },
    { name: 'الرَّاکِعَه', nameEn: 'Ar-Raki\'ah', start: 231.429, emoji: '🌙', desc: 'The Bowing — mansion of reverence and worship; favors prayer, devotion, and spiritual practice.', suitable: ['نماز', 'عبادت'], unsuitable: ['گناه'] },
    { name: 'الثُّرَیَّا', nameEn: 'Ath-Thurayya', start: 244.286, emoji: '✨', desc: 'The Stars — Pleiades mansion of celestial knowledge; favors astronomy, astrology, and seeking cosmic insight.', suitable: ['ستاره‌شناسی', 'طالع‌بینی'], unsuitable: ['ظلم'] },
    { name: 'الدَّبَرَة', nameEn: 'Ad-Dabarah', start: 257.143, emoji: '🌀', desc: 'The Back — mansion of support and backing; favors offering help and standing behind others.', suitable: ['پشتیبانی', 'کمک'], unsuitable: ['خیانت'] },
    { name: 'النَّعَام', nameEn: 'An-Na\'am', start: 270, emoji: '🐪', desc: 'The Ostrich — mansion of wandering and travel; favors journeys, trade, and exploration.', suitable: ['سفر', 'تجارت'], unsuitable: ['تنهایی'] },
    { name: 'البَطَن', nameEn: 'Al-Batan', start: 282.857, emoji: '🤰', desc: 'The Belly — mansion of nourishment and sustenance; favors diet, health, and wholesome living.', suitable: ['تغذیه', 'سالم‌زیستی'], unsuitable: ['گرسنگی'] },
    { name: 'اَلصَّفِر', nameEn: 'As-Safar', start: 295.714, emoji: '🌍', desc: 'The Journey — mansion of departure and travel; favors setting out on trips and beginning voyages.', suitable: ['سفر', 'حرکت'], unsuitable: ['ماندن در خانه'] },
    { name: 'اَلْاَخْبَرَة', nameEn: 'Al-Akhbarah', start: 308.571, emoji: '📰', desc: 'The Tidings — mansion of news and information; favors spreading knowledge and communication.', suitable: ['اخبار', 'اطلاع‌رسانی'], unsuitable: ['پنهان‌کاری'] },
    { name: 'اَلْمُقَدَّم', nameEn: 'Al-Muqaddam', start: 321.429, emoji: '🚀', desc: 'The Vanguard — mansion of leadership and initiative; favors leading, guiding, and taking charge.', suitable: ['رهبری', 'هدایت'], unsuitable: ['پیروی کورکورانه'] },
    { name: 'اَلْمُؤَخَّر', nameEn: 'Al-Mu\'akhkhar', start: 334.286, emoji: '⏳', desc: 'The Rear — mansion of patience and delay; favors waiting, resting, and deferred action.', suitable: ['صبر', 'تأخر'], unsuitable: ['عجله'] },
    { name: 'الرَّس', nameEn: 'Ar-Ram', start: 347.143, emoji: '🐏', desc: 'The Head — mansion of beginnings and leadership; favors starting new ventures and taking initiative.', suitable: ['سرآغاز', 'شروع'], unsuitable: ['پایان'] }
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
    var dateVal = document.getElementById('moonPhaseDate').value;
    var lat = parseFloat(document.getElementById('moonPhaseLat').value) || 35.6892;
    var lng = parseFloat(document.getElementById('moonPhaseLng').value) || 51.3890;
    var tz = 'Asia/Tehran'; // API rejects numeric offsets; must be a valid IANA timezone

    var parts = dateVal.split('-');
    var year = parseInt(parts[0]);
    var month = parseInt(parts[1]);
    var day = parseInt(parts[2]);

    var resultDiv = document.getElementById('moonPhaseResult');
    resultDiv.innerHTML = '<div style="text-align:center;padding:30px;color:#b0c4e0;">⏳ در حال محاسبه فاز ماه...</div>';

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
            resultDiv.innerHTML = '<div style="text-align:center;padding:20px;color:#e87474;">⚠️ خطا در دریافت اطلاعات</div>';
        }
    })
    .catch(function(err) {
        resultDiv.innerHTML = '<div style="text-align:center;padding:20px;color:#e87474;">⚠️ خطا: ' + _moonEsc(err.message) + '</div>';
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
