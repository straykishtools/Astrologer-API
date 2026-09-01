// ================================================================
//   MOON PHASE & LUNAR MANSIONS — فاز ماه و منازل قمر
//   API: /api/v5/moon-phase
//   Source: Lunar mansions (28 منازل قمری)
// ================================================================

function _moonEsc(s) { var d = document.createElement('div'); d.appendChild(document.createTextNode(s || '')); return d.innerHTML; }

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
    { name: '陟昧', nameEn: 'Iklil', start: 25.714, emoji: '👑', desc: 'The Crown — celestial crest marking a peak of honor, favored for weddings and celebrations.', suitable: ['ازدواج', 'جشن'], unsuitable: ['تطعیل'] },
    { name: 'قلب', nameEn: 'Qalb', start: 38.571, emoji: '❤️', desc: 'The Heart of the Scorpion — a powerful, intense mansion; ideal for major undertakings but risky for travel.', suitable: ['شروع پروژه بزرگ', 'تصمیمات مهم'], unsuitable: ['سفر', 'مذاکرات حساس'] },
    { name: '重磅', nameEn: 'Shawla', start: 51.429, emoji: '🦂', desc: 'The Scorpion's Tail — fierce and combative energy; suited for defense, competition, and vigorous sports.', suitable: ['جنگ و دفاع', 'ورزش'], unsuitable: ['ازدواج', 'معامله'] },
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
    var tz = 3.5; // Tehran

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
    var sun = overview.sun || {};
    var phaseName = moon.phase_name || 'نامشخص';
    var emoji = moon.emoji || '🌙';
    var illumination = moon.illumination || '۰٪';
    var age = moon.age_days || 0;
    var stage = moon.stage || '';
    var moonSign = moon.zodiac ? (moon.zodiac.sign || '') : '';
    var moonSignFa = translateMoonSign(moonSign);

    // Calculate lunar mansion from moon's zodiac position
    var moonAbsPos = moon.zodiac ? (moon.zodiac.abs_pos || moon.zodiac.position || 0) : 0;
    var mansion = getLunarMansion(moonAbsPos);

    var phaseFa = MOON_PHASE_FA[phaseName] || _moonEsc(phaseName);

    // Persian date approximation
    var pv = window.PersianDate;
    var persianDate = '';
    if (pv) {
        try {
            var pd = new pv([year, month, day]);
            persianDate = pd.format('YYYY/MM/DD');
        } catch(e) { persianDate = dateVal; }
    } else {
        persianDate = dateVal;
    }

    var html = '<div class="moon-result">';

    // Main phase card
    html += '<div class="moon-phase-main">';
    html += '<div class="moon-emoji-large">' + _moonEsc(emoji) + '</div>';
    html += '<div class="moon-phase-name">' + _moonEsc(phaseFa) + '</div>';
    html += '<div class="moon-illumination">💡 درصد روشنایی: ' + _moonEsc(String(illumination)) + '</div>';
    html += '<div class="moon-date">📅 تاریخ: ' + _moonEsc(dateVal) + '</div>';
    html += '<div class="moon-age">🌙 سن ماه: ' + _moonEsc(String(age)) + ' روز</div>';
    if (stage) html += '<div class="moon-stage">📈 مرحله: ' + _moonEsc(translateStage(stage)) + '</div>';
    if (moonSignFa) html += '<div class="moon-sign">♈ برج ماه: ' + _moonEsc(moonSignFa) + '</div>';
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
    html += renderMoonPhaseSVG(moon.phase || 0, moonAbsPos);
    html += '</div>';

    html += '</div>';

    document.getElementById('moonPhaseResult').innerHTML = html;
}

function renderMoonPhaseSVG(phase, position) {
    var cx = 80, cy = 80, r = 60;
    // phase: 0=New, 0.5=Full, 1=New
    var illumination = phase || 0;
    var svg = '<svg viewBox="0 0 160 160" width="160" height="160" style="display:block;margin:10px auto;">';
    // Background circle (dark)
    svg += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="#0a0f1e" stroke="rgba(221,192,112,0.3)" stroke-width="1"/>';
    // Illumination
    if (illumination <= 0.5) {
        // Waxing: light on right
        var litWidth = r * 2 * (illumination * 2);
        svg += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="#f0e6b0"/>';
        svg += '<ellipse cx="' + (cx + r - litWidth) + '" cy="' + cy + '" rx="' + (r - litWidth) + '" ry="' + r + '" fill="#0a0f1e"/>';
    } else {
        // Waning: light on left
        var litWidth2 = r * 2 * ((1 - illumination) * 2);
        svg += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="#f0e6b0"/>';
        svg += '<ellipse cx="' + (cx - r + litWidth2) + '" cy="' + cy + '" rx="' + (r - litWidth2) + '" ry="' + r + '" fill="#0a0f1e"/>';
    }
    // Glow effect
    svg += '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r + 4) + '" fill="none" stroke="rgba(240,230,176,0.2)" stroke-width="3"/>';
    // Position indicator
    var posRad = (position - 90) * Math.PI / 180;
    var dotX = cx + (r + 12) * Math.cos(posRad);
    var dotY = cy + (r + 12) * Math.sin(posRad);
    svg += '<circle cx="' + dotX + '" cy="' + dotY + '" r="3" fill="#ddc070"/>';
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
