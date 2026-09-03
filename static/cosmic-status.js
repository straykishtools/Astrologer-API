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

// ─── Current Season ───
function getSeason() {
    var m = new Date().getMonth() + 1;
    if (m >= 3 && m <= 5) return { name: 'بهار', emoji: '🌸', color: '#2ecc71' };
    if (m >= 6 && m <= 8) return { name: 'تابستان', emoji: '☀️', color: '#f39c12' };
    if (m >= 9 && m <= 11) return { name: 'پاییز', emoji: '🍂', color: '#e67e22' };
    return { name: 'زمستان', emoji: '❄️', color: '#3498db' };
}

// ─── Next Solar Event ───
function getNextSolarEvent() {
    var now = new Date();
    var h = now.getHours() + now.getMinutes() / 60;
    if (h < 6) return { emoji: '🌅', text: 'طلوع خورشید نزدیک است' };
    if (h < 12) return { emoji: '☀️', text: 'نیمه روز — بهترین زمان فعالیت' };
    if (h < 17) return { emoji: '🌤️', text: 'بعدازظهر — انرژی خوبی داری' };
    if (h < 20) return { emoji: '🌇', text: 'غروب خورشید نزدیک است' };
    return { emoji: '🌙', text: 'شب — زمان استراحت و تأمل' };
}

// ─── Fetch real moon data from API (cached 10 min) ───
var _apiMoon = null;
var _apiMoonCachedAt = 0;
var _apiMoonCacheTTL = 10 * 60 * 1000; // 10 minutes
var _eclipseIntervalId = null;

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

// ─── Render ───
function render() {
    if (!dom.panel) return;

    var moon = getMoonPhaseInfo();
    var sun = getApproxSunTimes(35.6892);
    var dayLen = getDayLength(sun);
    var season = getSeason();
    var event = getNextSolarEvent();
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
