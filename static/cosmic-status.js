// ================================================================
//   COSMIC STATUS — خلاصه وضعیت نجومی در نوار بالا
//   Moon phase, sun info, Persian date, solar events
// ================================================================

var CosmicStatus = (function () {
'use strict';

var dom = {};
var isOpen = false;

// ─── Moon Phase Calculation (client-side) ───
function getMoonAge() {
    var now = new Date();
    var ref = new Date(Date.UTC(2000, 0, 6, 18, 14)); // Known new moon: 2000-01-06 18:14 UTC
    var diff = now.getTime() - ref.getTime();
    var days = diff / (1000 * 60 * 60 * 24);
    var synodicMonth = 29.53058770576;
    var age = ((days % synodicMonth) + synodicMonth) % synodicMonth;
    return age;
}

function getMoonPhaseInfo() {
    var age = getMoonAge();
    var illumination = (1 - Math.cos(2 * Math.PI * age / 29.53058770576)) / 2;
    var illumPct = Math.round(illumination * 100);

    var phase, emoji, emojiIllum;
    if (age < 1.84566) {
        phase = 'ماه نو'; emoji = '🌑'; emojiIllum = 0;
    } else if (age < 7.38265) {
        phase = 'هلال رو به رشد'; emoji = '🌒'; emojiIllum = 25;
    } else if (age < 9.22831) {
        phase = 'تربیع اول'; emoji = '🌓'; emojiIllum = 50;
    } else if (age < 14.76530) {
        phase = 'محدب رو به رشد'; emoji = '🌔'; emojiIllum = 75;
    } else if (age < 16.61096) {
        phase = 'ماه کامل'; emoji = '🌕'; emojiIllum = 100;
    } else if (age < 22.14795) {
        phase = 'محدب رو به زوال'; emoji = '🌖'; emojiIllum = 75;
    } else if (age < 23.99361) {
        phase = 'تربیع آخر'; emoji = '🌗'; emojiIllum = 50;
    } else if (age < 29.53059) {
        phase = 'هلال رو به زوال'; emoji = '🌘'; emojiIllum = 25;
    } else {
        phase = 'ماه نو'; emoji = '🌑'; emojiIllum = 0;
    }

    return { age: age, phase: phase, emoji: emoji, illumination: illumPct };
}

// ─── Approximate Sunrise / Sunset ───
function getApproxSunTimes(lat) {
    var now = new Date();
    var dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
    var radLat = (lat || 35.6892) * Math.PI / 180;

    // Solar declination approximation
    var decl = -23.44 * Math.cos(2 * Math.PI * (dayOfYear + 10) / 365);
    var declRad = decl * Math.PI / 180;

    var cosHA = -Math.tan(radLat) * Math.tan(declRad);
    cosHA = Math.max(-1, Math.min(1, cosHA));
    var HA = Math.acos(cosHA) * 180 / Math.PI;

    var solarNoon = 12; // approximation
    var sunriseH = solarNoon - HA / 15;
    var sunsetH = solarNoon + HA / 15;

    function fmt(h) {
        var hours = Math.floor(h);
        var mins = Math.round((h - hours) * 60);
        if (mins >= 60) { hours++; mins -= 60; }
        return String(hours).padStart(2, '0') + ':' + String(mins).padStart(2, '0');
    }

    return { sunrise: fmt(sunriseH), sunset: fmt(sunsetH) };
}

// ─── Day Length ───
function getDayLength(sunTimes) {
    var parts = sunTimes.sunrise.split(':');
    var parts2 = sunTimes.sunset.split(':');
    var sMin = parseInt(parts[0]) * 60 + parseInt(parts[1]);
    var eMin = parseInt(parts2[0]) * 60 + parseInt(parts2[1]);
    var diff = eMin - sMin;
    var h = Math.floor(diff / 60);
    var m = diff % 60;
    return h + 'h ' + m + 'm';
}

// ─── Moon Zodiac Sign (constellation the moon is in) ───
function getMoonZodiacSign() {
    var now = new Date();
    // Approximate moon ecliptic longitude using mean lunar elements
    // Reference: J2000.0 epoch
    var T = (now.getTime() - Date.UTC(2000, 0, 1, 12)) / 86400000 / 36525; // centuries since J2000
    // Mean longitude
    var L = (218.3165 + 481267.8813 * T) % 360;
    // Mean anomaly of moon
    var M = (134.9634 + 477198.8676 * T) % 360;
    var Mrad = M * Math.PI / 180;
    // Ecliptic longitude correction
    var lambda = L + 6.289 * Math.sin(Mrad);
    lambda = ((lambda % 360) + 360) % 360;

    var signs = [
        { name: 'حَمل', emoji: '♈', start: 0 },
        { name: 'ثور', emoji: '♉', start: 30 },
        { name: 'جوزا', emoji: '♊', start: 60 },
        { name: 'سرطان', emoji: '♋', start: 90 },
        { name: 'اسد', emoji: '♌', start: 120 },
        { name: 'سنبله', emoji: '♍', start: 150 },
        { name: 'میزان', emoji: '♎', start: 180 },
        { name: 'عقرب', emoji: '♏', start: 210 },
        { name: 'قوس', emoji: '♐', start: 240 },
        { name: 'جدی', emoji: '♑', start: 270 },
        { name: 'دلو', emoji: '♒', start: 300 },
        { name: 'حوت', emoji: '♓', start: 330 }
    ];
    var sign = signs[0];
    for (var i = signs.length - 1; i >= 0; i--) {
        if (lambda >= signs[i].start) { sign = signs[i]; break; }
    }
    return { name: sign.name, emoji: sign.emoji, longitude: Math.round(lambda) };
}

// ─── 7-Day Moon Phase Calendar ───
function getMoonWeek() {
    var age = getMoonAge();
    var result = [];
    var now = new Date();
    for (var i = 0; i < 7; i++) {
        var dayAge = (age + i) % 29.53058770576;
        var d = new Date(now.getTime() + i * 86400000);
        var dayLabel = i === 0 ? 'امروز' : d.toLocaleDateString('fa-IR', { weekday: 'short' });
        var emoji;
        if (dayAge < 1.84566) emoji = '🌑';
        else if (dayAge < 7.38265) emoji = '🌒';
        else if (dayAge < 9.22831) emoji = '🌓';
        else if (dayAge < 14.76530) emoji = '🌔';
        else if (dayAge < 16.61096) emoji = '🌕';
        else if (dayAge < 22.14795) emoji = '🌖';
        else if (dayAge < 23.99361) emoji = '🌗';
        else emoji = '🌘';
        result.push({ label: dayLabel, emoji: emoji, today: i === 0 });
    }
    return result;
}

// ─── Current Season (گاه‌شماری هجری شمسی — هماهنگ با اقلیم ایران) ───
function getSeason() {
    var now = new Date();
    // تبدیل میلادی → شمسی (تقویم رسمی ایران)
    var gY = now.getFullYear(), gM = now.getMonth() + 1, gD = now.getDate();
    var gy = gY - 1600, gm = gM - 1, gd = gD - 1;
    var gDayNo = 365 * gy + Math.floor((gy + 3) / 4) - Math.floor((gy + 99) / 100) + Math.floor((gy + 399) / 400);
    for (var i = 0; i < gm; i++) gDayNo += [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][i];
    gDayNo += gd;
    var jDayNo = gDayNo - 79;
    var jNp = Math.floor(jDayNo / 12053);
    jDayNo %= 12053;
    var jY = 979 + 33 * jNp + 4 * Math.floor(jDayNo / 1461);
    jDayNo %= 1461;
    if (jDayNo >= 366) { jY += Math.floor((jDayNo - 1) / 365); jDayNo = (jDayNo - 1) % 365; }
    var jM, jD;
    if (jDayNo < 186) { jM = 1 + Math.floor(jDayNo / 31); jD = 1 + jDayNo % 31; }
    else { jDayNo -= 186; jM = 7 + Math.floor(jDayNo / 30); jD = 1 + jDayNo % 30; }

    // بهار: فروردین–خرداد · تابستان: تیر–شهریور · پاییز: مهر–آذر · زمستان: دی–اسفند
    if (jM <= 3) return { name: 'بهار', emoji: '🌸', color: '#2ecc71' };
    if (jM <= 6) return { name: 'تابستان', emoji: '☀️', color: '#f39c12' };
    if (jM <= 9) return { name: 'پاییز', emoji: '🍂', color: '#e67e22' };
    return { name: 'زمستان', emoji: '❄️', color: '#3498db' };
}

// ─── Next Solar Event (بر اساس طلوع/غروب واقعی محاسبه‌شده، نه ساعت ثابت) ───
function getNextSolarEvent(sun) {
    var now = new Date();
    var h = now.getHours() + now.getMinutes() / 60;
    function toHours(t) {
        if (!t) return NaN;
        var p = t.split(':');
        return parseFloat(p[0]) + parseFloat(p[1]) / 60;
    }
    var sr = toHours(sun && sun.sunrise); if (isNaN(sr)) sr = 6;
    var ss = toHours(sun && sun.sunset);  if (isNaN(ss)) ss = 18;
    var noon = (sr + ss) / 2;

    if (h < sr - 1)    return { emoji: '🌠', text: 'پیش از طلوع — سکوت سپیده‌دم' };
    if (h < sr + 1)    return { emoji: '🌅', text: 'طلوع خورشید نزدیک است' };
    if (h < noon - 1)  return { emoji: '🌤️', text: 'صبح — بهترین زمان شروع' };
    if (h < noon + 1)  return { emoji: '☀️', text: 'نیمه روز — اوج انرژی خورشید' };
    if (h < ss - 1.5)  return { emoji: '🌻', text: 'بعدازظهر — ادامه فعالیت' };
    if (h < ss + 0.5)  return { emoji: '🌇', text: 'غروب خورشید نزدیک است' };
    return { emoji: '🌙', text: 'شب — زمان استراحت و تأمل' };
}

// ─── Fetch real moon data from API (cached 10 min) ───
var _apiMoon = null;
var _apiMoonCachedAt = 0;
var _apiMoonCacheTTL = 10 * 60 * 1000; // 10 minutes
var _eclipseIntervalId = null;
var _mansion = null;
var _mansionAt = 0;
var _apod = null;
var _apodCachedAt = 0;
var _apodCacheTTL = 10 * 60 * 1000;
var _planets = null;
var _planetsCachedAt = 0;
var _planetsCacheTTL = 10 * 60 * 1000;
var _spaceWeather = null;
var _spaceWeatherAt = 0;
var _biorhythm = null;
var _biorhythmCachedAt = 0;
var _biorhythmCacheTTL = 5 * 60 * 1000;

async function fetchApiMoon() {
    if (_apiMoon && (Date.now() - _apiMoonCachedAt) < _apiMoonCacheTTL) return _apiMoon;
    try {
        var resp = await fetch('/api/v5/moon-phase/now-utc', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });
        if (!resp.ok) return null;
        var data = await resp.json();
        _apiMoon = data.moon_phase_overview || null;
        _apiMoonCachedAt = Date.now();
        return _apiMoon;
    } catch (e) { return null; }
}

async function fetchApod() {
    if (_apod && (Date.now() - _apodCachedAt) < _apodCacheTTL) return _apod;
    try {
        var resp = await fetch('/api/v5/nasa/apod');
        if (!resp.ok) return null;
        var data = await resp.json();
        if (data.status === 'success' && data.data) {
            _apod = data.data;
            _apodCachedAt = Date.now();
            return _apod;
        }
        return null;
    } catch (e) { return null; }
}

// منزل قمر — ۲۸ منزل سنتی ماه (کش ۳۰ دقیقه)
async function fetchMansion() {
    if (_mansion && (Date.now() - _mansionAt) < 30 * 60 * 1000) return _mansion;
    try {
        var resp = await fetch('/api/v5/moon-mansion');
        if (!resp.ok) return null;
        var data = await resp.json();
        if (data.status === 'success' && data.data) {
            _mansion = data.data;
            _mansionAt = Date.now();
            return _mansion;
        }
        return null;
    } catch (e) { return null; }
}

async function fetchPlanets() {
    if (_planets && (Date.now() - _planetsCachedAt) < _planetsCacheTTL) return _planets;
    try {
        var today = new Date().toISOString().split('T')[0];
        var resp = await fetch('/api/v5/nasa/planets?date=' + today);
        if (!resp.ok) return null;
        var data = await resp.json();
        if (data.status === 'success' && data.data) {
            _planets = data.data;
            _planetsCachedAt = Date.now();
            return _planets;
        }
        return null;
    } catch (e) { return null; }
}

// آب‌وهوای فضایی — فوران خورشیدی و طوفان مغناطیسی (کش ۳۰ دقیقه)
async function fetchSpaceWeather() {
    if (_spaceWeather && (Date.now() - _spaceWeatherAt) < 30 * 60 * 1000) return _spaceWeather;
    try {
        var resp = await fetch('/api/v5/nasa/space-weather/today');
        if (!resp.ok) return null;
        var data = await resp.json();
        if (data.status === 'success' && data.data) {
            _spaceWeather = data.data;
            _spaceWeatherAt = Date.now();
            return _spaceWeather;
        }
        return null;
    } catch (e) { return null; }
}

async function fetchBiorhythm() {
    if (_biorhythm && (Date.now() - _biorhythmCachedAt) < _biorhythmCacheTTL) return _biorhythm;
    try {
        var bd = (window.sharedInputs && window.sharedInputs.birthDate) || null;
        var birthDate = null;
        if (bd && bd.year && bd.month && bd.day) {
            birthDate = bd.year + '-' + String(bd.month).padStart(2, '0') + '-' + String(bd.day).padStart(2, '0');
            // شمسی → میلادی کامل (سال+ماه+روز)
            if (window.isoShamsiToGregorianISO) {
                birthDate = window.isoShamsiToGregorianISO(birthDate);
            }
        }
        if (!birthDate) return null;
        var resp = await fetch('/api/v5/biorhythm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ birth_date: birthDate })
        });
        if (!resp.ok) return null;
        var data = await resp.json();
        if (data.status === 'success' && data.data) {
            _biorhythm = data.data;
            _biorhythmCachedAt = Date.now();
            return _biorhythm;
        }
        return null;
    } catch (e) { return null; }
}

function fmtDate(ts) {
    if (!ts) return '—';
    try { return new Date(ts * 1000).toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' }); }
    catch (e) { return '—'; }
}

function fmtCountdown(timestamp) {
    if (!timestamp) return '';
    var diff = (timestamp * 1000) - Date.now();
    if (diff <= 0) return '<span style="color:#e74c3c;">امروز!</span>';
    var days = Math.floor(diff / 86400000);
    var hours = Math.floor((diff % 86400000) / 3600000);
    return days + ' روز و ' + hours + ' ساعت';
}

function startEclipseCountdown(nextTs) {
    if (_eclipseIntervalId) clearInterval(_eclipseIntervalId);
    if (!nextTs) return;
    _eclipseIntervalId = setInterval(function() {
        var el = document.getElementById('csEclipseCountdown');
        if (el) el.innerHTML = fmtCountdown(nextTs);
    }, 60000); // update every minute
}

// ─── Open-Meteo cache (اشتراکی — یک fetch برای همه‌ی بخش‌ها) ───
var _omCache = null;
var _omAt = 0;
function fetchOpenMeteo() {
    if (_omCache && (Date.now() - _omAt) < 30 * 60 * 1000) return Promise.resolve(_omCache);
    var lat = (window.sharedInputs && window.sharedInputs.latitude) || 35.6892;
    var lng = (window.sharedInputs && window.sharedInputs.longitude) || 51.3890;
    return fetch('/api/v5/weather?lat=' + lat + '&lng=' + lng)
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (d) {
            if (d && (d.status === 'success' || d.status === 'partial') && d.data) {
                _omCache = d.data; _omAt = Date.now();
                return _omCache;
            }
            return null;
        }).catch(function () { return null; });
}

// ─── Render ───
function render() {
    if (!dom.panel) return;

    var moon = getMoonPhaseInfo();
    var sun = getApproxSunTimes((window.sharedInputs && window.sharedInputs.latitude) || 35.6892);
    var dayLen = getDayLength(sun);
    var season = getSeason();
    var event = getNextSolarEvent(sun);
    var now = new Date();

    var persianTime = now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
    var persianDate = now.toLocaleDateString('fa-IR', { weekday: 'long', month: 'long', day: 'numeric' });

    var html = '';

    // Header
    html += '<div class="cs-header">';
    html += '<div class="cs-header-title">✨ وضعیت نجومی امروز</div>';
    html += '<div class="cs-header-date">' + persianDate + ' · ' + persianTime + '</div>';
    html += '</div>';

    // Moon Section
    html += '<div class="cs-section">';
    html += '<div class="cs-row">';
    html += '<span class="cs-row-emoji">' + moon.emoji + '</span>';
    html += '<div class="cs-row-info">';
    html += '<div class="cs-row-label">فاز ماه</div>';
    html += '<div class="cs-row-value">' + moon.phase + '</div>';
    html += '</div>';
    html += '<div class="cs-row-badge">' + moon.illumination + '%</div>';
    html += '</div>';
    // Moon illumination bar
    html += '<div class="cs-moon-bar"><div class="cs-moon-bar-fill" style="width:' + moon.illumination + '%"></div></div>';
    html += '<div class="cs-row-sub">سن ماه: ' + Math.round(moon.age) + ' روز از ۲۹.۵</div>';
    // Placeholder for API enrichment
    html += '<div id="csApiMoon"></div>';
    html += '</div>';

    // Moon Zodiac Sign
    var moonSign = getMoonZodiacSign();
    html += '<div class="cs-section">';
    html += '<div class="cs-row">';
    html += '<span class="cs-row-emoji">' + moonSign.emoji + '</span>';
    html += '<div class="cs-row-info">';
    html += '<div class="cs-row-label">برج ماه</div>';
    html += '<div class="cs-row-value">ماه در ' + moonSign.name + '</div>';
    html += '</div>';
    html += '<div class="cs-row-badge">' + moonSign.longitude + '°</div>';
    html += '</div>';
    html += '</div>';

    // Divider
    html += '<div class="cs-divider"></div>';

    // 7-Day Moon Calendar
    var moonWeek = getMoonWeek();
    html += '<div class="cs-section">';
    html += '<div class="cs-section-title">🌙 ۷ روز آینده ماه</div>';
    html += '<div class="cs-moon-week">';
    moonWeek.forEach(function(day) {
        html += '<div class="cs-moon-day' + (day.today ? ' cs-moon-today' : '') + '">';
        html += '<div class="cs-moon-day-emoji">' + day.emoji + '</div>';
        html += '<div class="cs-moon-day-label">' + day.label + '</div>';
        html += '</div>';
    });
    html += '</div>';
    html += '</div>';

    // Divider
    html += '<div class="cs-divider"></div>';

    // Sun Section
    html += '<div class="cs-section">';
    html += '<div class="cs-row">';
    html += '<span class="cs-row-emoji">🌅</span>';
    html += '<div class="cs-row-info">';
    html += '<div class="cs-row-label">طلوع / غروب</div>';
    html += '<div class="cs-row-value">' + sun.sunrise + ' — ' + sun.sunset + '</div>';
    html += '</div>';
    html += '</div>';
    html += '<div class="cs-row-sub">مدت روز: ' + dayLen + '</div>';
    html += '</div>';

    // Divider
    html += '<div class="cs-divider"></div>';

    // Season + Current Time Phase
    html += '<div class="cs-section cs-row-double">';
    html += '<div class="cs-half">';
    html += '<span class="cs-half-emoji">' + season.emoji + '</span>';
    html += '<div class="cs-half-text">';
    html += '<div class="cs-half-label">فصل</div>';
    html += '<div class="cs-half-value" style="color:' + season.color + '">' + season.name + '</div>';
    html += '</div>';
    html += '</div>';
    html += '<div class="cs-half">';
    html += '<span class="cs-half-emoji">' + event.emoji + '</span>';
    html += '<div class="cs-half-text">';
    html += '<div class="cs-half-label">وضعیت فعلی</div>';
    html += '<div class="cs-half-value">' + event.text + '</div>';
    html += '</div>';
    html += '</div>';
    html += '</div>';

    // Add APOD placeholder
    html += '<div class="cs-section" id="csApodSection">';
    html += '<div class="cs-section-title">🛸 تصویر نجومی روز</div>';
    html += '<div id="csApodContent">بارگیری...</div>';
    html += '</div>';

    // Planets placeholder
    html += '<div class="cs-section" id="csPlanetsSection">';
    html += '<div class="cs-section-title">🪐 موقعیت سیارات</div>';
    html += '<div id="csPlanetsContent">بارگیری...</div>';
    html += '</div>';

    // Biorhythm placeholder
    html += '<div class="cs-section" id="csBiorhythmSection">';
    html += '<div class="cs-section-title">🧬 بیوریتم روز</div>';
    html += '<div id="csBiorhythmContent">بارگیری...</div>';
    html += '</div>';

    // Space weather placeholder
    html += '<div class="cs-section" id="csSpaceWeatherSection">';
    html += '<div class="cs-section-title">🌞 فعالیت خورشیدی</div>';
    html += '<div id="csSpaceWeatherContent">بارگیری...</div>';
    html += '</div>';

    // منزل قمر placeholder
    html += '<div class="cs-section" id="csMansionSection">';
    html += '<div class="cs-section-title">🏛️ منزل قمر</div>';
    html += '<div id="csMansionContent">بارگیری...</div>';
    html += '</div>';

    dom.panel.innerHTML = html;

    // Enrich with API data when online
    if (navigator.onLine) {
        fetchApiMoon().then(function(api) {
            if (!api) return;
            _apiMoon = api;
            var m = api.moon || {};
            var s = api.sun || {};
            var det = (m.detailed || {});
            var up = det.upcoming_phases || {};

            var extra = '';

            // Exact illumination + stage from API
            if (m.illumination) {
                var stageLabel = m.stage === 'waxing' ? ' رو به رشد 📈' : ' رو به زوال 📉';
                extra += '<div class="cs-row-sub" style="color:var(--gold-200);">دقیق: ' + m.illumination + stageLabel + '</div>';
            }

            // API moon sign
            if (m.zodiac && m.zodiac.moon_sign) {
                var signNames = { Ari:' حمل', Tau:' ثور', Gem:' جوزا', Can:' سرطان', Leo:' اسد', Vir:' سنبله', Lib:' میزان', Sco:' عقرب', Sgr:' قوس', Cap:' جدی', Aqr:' دلو', Psc:' حوت' };
                var signEmoji = { Ari:'♈', Tau:'♉', Gem:'♊', Can:'♋', Leo:'♌', Vir:'♍', Lib:'♎', Sco:'♏', Sgr:'♐', Cap:'♑', Aqr:'♒', Psc:'♓' };
                var ms = m.zodiac.moon_sign;
                extra += '<div class="cs-row-sub">' + (signEmoji[ms]||'🌙') + ' ماه در ' + (signNames[ms]||ms) + '</div>';
            }

            // Next lunar eclipse with countdown
            var nextEclipseTs = null;
            if (m.next_lunar_eclipse && m.next_lunar_eclipse.datestamp) {
                extra += '<div class="cs-eclipse"><span class="cs-eclipse-icon">🌑</span> <span class="cs-eclipse-type">' + m.next_lunar_eclipse.type + '</span> — ' + fmtDate(m.next_lunar_eclipse.timestamp) + '</div>';
                nextEclipseTs = m.next_lunar_eclipse.timestamp;
            }

            // Next solar eclipse with countdown
            if (s.next_solar_eclipse && s.next_solar_eclipse.datestamp) {
                var solTs = s.next_solar_eclipse.timestamp;
                if (!nextEclipseTs || solTs < nextEclipseTs) nextEclipseTs = solTs;
                extra += '<div class="cs-eclipse"><span class="cs-eclipse-icon">☀️</span> <span class="cs-eclipse-type">' + s.next_solar_eclipse.type + '</span> — ' + fmtDate(s.next_solar_eclipse.timestamp) + '</div>';
            }

            // Live countdown to nearest eclipse
            if (nextEclipseTs) {
                extra += '<div class="cs-eclipse-countdown"><span class="cs-cd-icon">⏳</span> <span id="csEclipseCountdown">' + fmtCountdown(nextEclipseTs) + '</span></div>';
                startEclipseCountdown(nextEclipseTs);
            }

            // Upcoming phases
            if (up.new_moon || up.full_moon || up.first_quarter || up.last_quarter) {
                extra += '<div class="cs-divider" style="margin:8px 0;"></div>';
                extra += '<div class="cs-section-title">📅 فازهای آینده ماه</div>';
                var phases = [
                    { name: 'ماه نو 🌑', next: up.new_moon && up.new_moon.next },
                    { name: 'تربیع اول 🌓', next: up.first_quarter && up.first_quarter.next },
                    { name: 'ماه کامل 🌕', next: up.full_moon && up.full_moon.next },
                    { name: 'تربیع آخر 🌗', next: up.last_quarter && up.last_quarter.next }
                ];
                phases.forEach(function(p) {
                    if (p.next && p.next.datestamp) {
                        extra += '<div class="cs-phase-row">';
                        extra += '<span class="cs-phase-name">' + p.name + '</span>';
                        extra += '<span class="cs-phase-date">' + fmtDate(p.next.timestamp) + '</span>';
                        extra += '</div>';
                    }
                });
            }

            if (extra) {
                var el = document.getElementById('csApiMoon');
                if (el) el.innerHTML = extra;
            }
        });

        // ─── Open-Meteo: طلوع/غروب دقیق + طلوع/غروبِ ماه + فاز دقیق ───
        fetchOpenMeteo().then(function (m) {
            if (!m || !m.weather) return;
            var w = m.weather;

            // جایگزینی طلوع/غروب تقریبی خورشید با دقیق
            var sunEl = document.querySelector('.cs-section .cs-row-value');
            if (sunEl && w.sunrise && w.sunset) sunEl.textContent = w.sunrise + ' — ' + w.sunset;

            // طول روز دقیق
            var dayLenEl = null;
            document.querySelectorAll('.cs-row-sub').forEach(function (el) {
                if (el.textContent.indexOf('مدت روز') === 0 && w.day_length) el.textContent = 'مدت روز: ' + w.day_length;
            });

            // فاز ماه دقیق + طلوع/غروبِ ماه — در بخش فاز ماه
            if (m.moon && m.moon.phase_fa) {
                var moonSection = document.querySelector('.cs-section .cs-row-value');
                var moonVal = document.querySelectorAll('.cs-section .cs-row-value')[0];
                if (moonVal) {
                    moonVal.innerHTML = m.moon.emoji + ' ' + m.moon.phase_fa;
                }
                // moonrise/moonset به‌صورت زیرِ بخشِ ماه
                var firstSection = document.querySelector('.cs-section');
                if (firstSection && (w.moonrise || w.moonset)) {
                    var mr = '';
                    if (w.moonrise) mr += '🌙 طلوعِ ماه: ' + w.moonrise;
                    if (w.moonset) mr += (mr ? ' · ' : '') + '🌙 غروبِ ماه: ' + w.moonset;
                    if (mr) {
                        var mrEl = document.createElement('div');
                        mrEl.className = 'cs-row-sub';
                        mrEl.textContent = mr;
                        firstSection.appendChild(mrEl);
                    }
                }
            }

            // وضعیتِ هوایِ کوتاه در هدرِ پنل (اختیاری — فقط اگر آب‌وهوا روشن است)
            if (w.condition_fa) {
                var headerDate = document.querySelector('.cs-header-date');
                if (headerDate) headerDate.innerHTML += ' · ' + w.condition_fa + ' ' + (w.temp != null ? Math.round(w.temp) + '°' : '');
            }
        });

        // Fetch APOD
        fetchApod().then(function(apod) {
            if (!apod) return;
            var el = document.getElementById('csApodContent');
            if (!el) return;
            var titleFa = apod.title_fa || '';
            var title = titleFa || apod.title || 'تصویر نجومی';
            var summaryFa = apod.summary_fa || '';
            var explanation = apod.explanation || '';
            var url = apod.hdurl || apod.url;
            if (url) {
                el.innerHTML = '<div style="text-align:center;margin-top:8px;">' +
                    '<img src="' + url + '" alt="' + title + '" style="max-width:100%;border-radius:12px;max-height:300px;object-fit:cover;">' +
                    '<div style="font-size:0.9em;margin-top:6px;font-weight:bold;color:var(--gold-200);">' + title + '</div>' +
                    (summaryFa ? '<div style="font-size:0.78em;color:#ccc;line-height:1.9;margin-top:6px;text-align:right;white-space:pre-line;">' + summaryFa + '</div>' : '') +
                    (explanation ? '<details style="margin-top:6px;"><summary style="color:#a29bfe;cursor:pointer;font-size:0.72rem;">📄 متن کامل (انگلیسی)</summary><div style="font-size:0.75em;opacity:0.8;margin-top:4px;line-height:1.8;text-align:left;direction:ltr;">' + explanation + '</div></details>' : '') +
                    '</div>';
            } else {
                el.textContent = 'تصویری یافت نشد';
            }
        });

        // Fetch Planets
        fetchPlanets().then(function(planets) {
            if (!planets) return;
            var el = document.getElementById('csPlanetsContent');
            if (!el) return;
            var list = planets.planets || {};
            var names = Object.keys(list);
            if (names.length === 0) {
                el.textContent = 'داده‌ای موجود نیست';
                return;
            }
            var signFa = { Aries:'حَمل ♈', Taurus:'ثور ♉', Gemini:'جوزا ♊', Cancer:'سرطان ♋', Leo:'اسد ♌', Virgo:'سنبله ♍', Libra:'میزان ♎', Scorpio:'عقرب ♏', Sagittarius:'قوس ♐', Capricorn:'جدی ♑', Aquarius:'دلو ♒', Pisces:'حوت ♓' };
            var planetEmoji = { Sun:'☀️', Moon:'🌙', Mercury:'☿', Venus:'♀️', Mars:'♂️', Jupiter:'♃', Saturn:'♄', Uranus:'♅', Neptune:'♆', Pluto:'♇' };
            var html = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-top:6px;">';
            names.forEach(function(name) {
                var p = list[name];
                var signName = signFa[p.sign] || p.sign;
                html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 8px;background:rgba(255,255,255,0.04);border-radius:8px;font-size:11px;">';
                html += '<span>' + (planetEmoji[name] || '🪐') + ' ' + name + '</span>';
                html += '<span style="color:var(--gold-300);">' + signName + ' ' + p.degree_in_sign + '°</span>';
                html += '</div>';
            });
            html += '</div>';
            // تفسیرهای سیاره-برج (تاشو)
            var interps = {};
            (planets.interpretations || []).forEach(function (it) { interps[it.planet] = it; });
            if (Object.keys(interps).length) {
                html += '<details style="margin-top:10px;"><summary style="color:#a29bfe;cursor:pointer;font-size:0.8rem;">🔮 تفسیر سیاره‌ها در برج‌ها</summary><div style="margin-top:8px;">';
                names.forEach(function (name) {
                    var it = interps[name];
                    if (!it) return;
                    html += '<div style="margin-bottom:8px;padding:9px 12px;background:rgba(253,203,110,0.05);border-right:2px solid rgba(253,203,110,0.35);border-radius:8px;">';
                    html += '<b style="color:var(--gold-300);font-size:0.8rem;">' + it.planet_fa + ' در ' + it.sign_fa + '</b>';
                    html += '<div style="color:#ccc;font-size:0.78rem;line-height:1.9;margin-top:3px;">' + it.interpretation + '</div>';
                    html += '</div>';
                });
                html += '</div></details>';
            }
            el.innerHTML = html;
        });
        fetchBiorhythm().then(function(bio) {
            if (!bio) {
                var elNone = document.getElementById('csBiorhythmContent');
                if (elNone) elNone.innerHTML = '<div style="font-size:11px;color:var(--ink-dim);margin-top:4px;">برای نمایش بیوریتم، تاریخ تولد را در چارت وارد کنید.</div>';
                return;
            }
            var el = document.getElementById('csBiorhythmContent');
            if (!el) return;
            function bioRow(label, emoji, val, status, color) {
                var pct = (val >= 0 ? '+' : '') + Math.round(val) + '%';
                var barW = Math.abs(val) / 2;
                var marginR = val < 0 ? '0%' : '50%';
                return '<div style="display:flex;align-items:center;gap:6px;margin-top:5px;font-size:11px;">' +
                    '<span style="width:16px;">' + emoji + '</span>' +
                    '<span style="width:44px;color:var(--ink-dim);">' + label + '</span>' +
                    '<span style="flex:1;height:5px;background:rgba(255,255,255,0.06);border-radius:3px;position:relative;overflow:hidden;">' +
                    '<span style="position:absolute;top:0;bottom:0;right:' + marginR + ';width:' + barW + '%;background:' + color + ';border-radius:3px;"></span>' +
                    '</span>' +
                    '<span style="width:52px;text-align:left;color:' + color + ';font-weight:700;">' + pct + '</span>' +
                    '</div>';
            }
            function bioColor(v) {
                if (v > 30) return '#2ecc71';
                if (v >= -30) return '#f1c40f';
                return '#e74c3c';
            }
            var html = '<div style="margin-top:6px;">';
            html += bioRow('جسمی', '💪', bio.physical, bio.physical_status, bioColor(bio.physical));
            html += bioRow('عاطفی', '🧠', bio.emotional, bio.emotional_status, bioColor(bio.emotional));
            html += bioRow('ذهنی', '🔮', bio.intellectual, bio.intellectual_status, bioColor(bio.intellectual));
            html += '</div>';
            el.innerHTML = html;
        });

        // Space Weather
        fetchSpaceWeather().then(function (sw) {
            var el = document.getElementById('csSpaceWeatherContent');
            if (!el) return;
            if (!sw) { el.innerHTML = '<div style="font-size:11px;color:var(--ink-dim);">داده آب‌وهوای فضایی در دسترس نیست.</div>'; return; }
            var en = sw.today_energy || {};
            var fl = sw.solar_flares || {};
            var gs = sw.geomagnetic_storms || {};
            var html = '<div style="display:flex;align-items:center;gap:8px;margin-top:6px;padding:8px 10px;background:rgba(255,255,255,0.04);border-radius:10px;">';
            html += '<span style="font-size:20px;">' + (en.emoji || '🟢') + '</span>';
            html += '<div style="flex:1;">';
            html += '<div style="font-size:12.5px;font-weight:700;color:var(--gold-200);">انرژی خورشیدی: ' + (en.level || 'آرام') + '</div>';
            html += '</div></div>';
            if (fl.fa) html += '<div style="font-size:10.5px;color:var(--ink-dim);margin-top:6px;line-height:1.9;">☀️ ' + fl.fa + (fl.count_24h ? ' <span style="color:var(--gold-300);">(' + fl.count_24h + ' فوران در ۲۴ ساعت اخیر)</span>' : '') + '</div>';
            if (gs.fa) html += '<div style="font-size:10.5px;color:var(--ink-dim);margin-top:4px;line-height:1.9;">🧲 ' + gs.fa + '</div>';
            if (!fl.fa && !gs.fa) html += '<div style="font-size:10.5px;color:var(--ink-dim);margin-top:6px;">✅ آسمان آرام — فوران یا طوفان مغناطیسی فعال ثبت نشده است.</div>';
            el.innerHTML = html;
        });

        // منزل قمر
        fetchMansion().then(function (mm) {
            var el = document.getElementById('csMansionContent');
            if (!el) return;
            if (!mm) { el.innerHTML = '<div style="font-size:11px;color:var(--ink-dim);">داده منزل قمر در دسترس نیست.</div>'; return; }
            var ms = mm.mansion || {};
            var nx = mm.next || {};
            var html = '<div style="display:flex;align-items:center;gap:8px;margin-top:6px;padding:8px 10px;background:rgba(255,255,255,0.04);border-radius:10px;">';
            html += '<span style="font-size:20px;">🏛️</span>';
            html += '<div style="flex:1;">';
            html += '<div style="font-size:12.5px;font-weight:700;color:var(--gold-200);">منزل ' + ms.num + ': ' + (ms.name_fa || '') + '</div>';
            html += '<div style="font-size:10px;color:var(--ink-dim);margin-top:2px;">' + (ms.meaning || '') + ' · ' + (mm.percent_of_mansion || 0) + '٪ طی شده</div>';
            html += '</div></div>';
            // نوار پیشرفت منزل
            html += '<div style="height:4px;background:rgba(255,255,255,0.06);border-radius:2px;margin-top:8px;overflow:hidden;">';
            html += '<div style="height:100%;width:' + (mm.percent_of_mansion || 0) + '%;background:linear-gradient(90deg,#5b4fc4,#a29bfe,#f3e5b8);border-radius:2px;"></div></div>';
            // تفسیر کوتاه
            if (ms.interp) html += '<div style="font-size:10.5px;color:var(--ink-dim);margin-top:8px;line-height:1.9;">📜 ' + ms.interp + '</div>';
            // بعدی
            if (nx.name_fa) {
                html += '<div style="font-size:10px;color:var(--ink-dim);margin-top:6px;">⏭️ بعدی: ' + nx.name_fa + ' — حدود ' + Math.round(nx.in_hours) + ' ساعت دیگر</div>';
            }
            el.innerHTML = html;
        });
    }
}

function toggle() {
    if (!dom.panel) return;
    isOpen = !isOpen;
    dom.panel.classList.toggle('open', isOpen);
    if (isOpen) render();
}

function close() {
    if (isOpen) { isOpen = false; dom.panel.classList.remove('open'); }
}

function init() {
    dom.btn = document.getElementById('cosmicStatusBtn');
    dom.panel = document.getElementById('cosmicStatusPanel');

    if (dom.btn) {
        dom.btn.addEventListener('click', function (e) {
            e.stopPropagation();
            toggle();
        });
    }

    // Close on outside click
    document.addEventListener('click', function (e) {
        if (isOpen && dom.panel && !dom.panel.contains(e.target) && dom.btn && !dom.btn.contains(e.target)) {
            close();
        }
    });

    // Render once on load so data is ready
    if (dom.panel) render();
}

return { init: init, toggle: toggle, close: close, refresh: render };
})();
