// ================================================================
//   EARTH STATUS — وضعیت زمین در نوار بالا
//   آب‌وهوا (OWM) · کیفیت هوا (AQICN) · طلوع/غروب دقیق · سیارک‌ها
//   هماهنگ با TOPBAR DROPDOWN COORDINATOR (کلاس open)
// ================================================================

var EarthStatus = (function () {
'use strict';

var dom = {};
var isOpen = false;
var _meteo = null, _meteoAt = 0;
var _asteroids = null, _asteroidsAt = 0;

function fetchMeteo() {
    if (_meteo && (Date.now() - _meteoAt) < 30 * 60 * 1000) return Promise.resolve(_meteo);
    var lat = (window.sharedInputs && window.sharedInputs.latitude) || 35.6892;
    var lng = (window.sharedInputs && window.sharedInputs.longitude) || 51.3890;
    return fetch('/api/v5/weather?lat=' + lat + '&lng=' + lng)
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (data) {
            // status === 'partial' هم قبول است (یکی از دو سرویس کار کرده)
            if (data && (data.status === 'success' || data.status === 'partial') && data.data) {
                _meteo = data.data;
                _meteoAt = Date.now();
                return _meteo;
            }
            if (data && data.detail) console.warn('[EarthStatus] weather errors:', data.detail);
            return null;
        })
        .catch(function () { return null; });
}

function fetchAsteroids() {
    if (_asteroids && (Date.now() - _asteroidsAt) < 30 * 60 * 1000) return Promise.resolve(_asteroids);
    return fetch('/api/v5/nasa/asteroids/today')
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (data) {
            if (data && data.status === 'success' && data.data) {
                _asteroids = data.data;
                _asteroidsAt = Date.now();
                return _asteroids;
            }
            return null;
        })
        .catch(function () { return null; });
}

// ─── محاسبه تقریبی طلوع/غروب برای نمایش اولیه ───
function approxSunTimes() {
    var now = new Date();
    var dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
    var radLat = ((window.sharedInputs && window.sharedInputs.latitude) || 35.6892) * Math.PI / 180;
    var decl = -23.44 * Math.cos(2 * Math.PI * (dayOfYear + 10) / 365) * Math.PI / 180;
    var cosHA = Math.max(-1, Math.min(1, -Math.tan(radLat) * Math.tan(decl)));
    var HA = Math.acos(cosHA) * 180 / Math.PI;
    function fmt(h) {
        var hours = Math.floor(h); var mins = Math.round((h - hours) * 60);
        if (mins >= 60) { hours++; mins -= 60; }
        return String(hours).padStart(2, '0') + ':' + String(mins).padStart(2, '0');
    }
    return { sunrise: fmt(12 - HA / 15), sunset: fmt(12 + HA / 15) };
}

function render() {
    if (!dom.panel) return;
    var now = new Date();
    var persianDate = now.toLocaleDateString('fa-IR', { weekday: 'long', month: 'long', day: 'numeric' });
    var persianTime = now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
    var sun = approxSunTimes();

    var html = '';
    html += '<div class="es-header">';
    html += '<div class="es-header-title">🌍 وضعیت زمین</div>';
    html += '<div class="es-header-date">' + persianDate + ' · ' + persianTime + '</div>';
    html += '</div>';

    // طلوع / غروب
    html += '<div class="es-section">';
    html += '<div class="es-row"><span class="es-row-emoji">🌅</span><div class="es-row-info">';
    html += '<div class="es-row-label">طلوع / غروب</div>';
    html += '<div class="es-row-value" id="esSunTimes">' + sun.sunrise + ' — ' + sun.sunset + '</div>';
    html += '</div></div>';
    html += '<div class="es-row-sub" id="esDayLen"></div>';
    html += '<div id="esWeatherExtra"></div>';
    html += '</div>';

    // کیفیت هوا
    html += '<div class="es-section" id="esAirSection">';
    html += '<div class="es-section-title">🍃 کیفیت هوا</div>';
    html += '<div id="esAirContent">بارگیری...</div>';
    html += '</div>';

    // سیارک‌ها
    html += '<div class="es-section" id="esAstSection">';
    html += '<div class="es-section-title">☄️ سیارک‌های نزدیک زمین</div>';
    html += '<div id="esAstContent">بارگیری...</div>';
    html += '</div>';

    dom.panel.innerHTML = html;

    // ─── آب‌وهوا (OWM) + کیفیت هوا (AQICN) ───
    fetchMeteo().then(function (m) {
        var wErr = document.getElementById('esWeatherExtra');
        var airEl = document.getElementById('esAirContent');
        if (!m) {
            if (wErr) wErr.innerHTML = '<div style="font-size:10.5px;color:var(--ink-dim);">سرویس آب‌وهوا در دسترس نیست.</div>';
            if (airEl) airEl.innerHTML = '<div style="font-size:10.5px;color:var(--ink-dim);">سرویس کیفیت هوا در دسترس نیست.</div>';
            return;
        }
        var el = document.getElementById('esSunTimes');
        if (el && m.sunrise && m.sunset) el.textContent = m.sunrise + ' — ' + m.sunset;
        var dl = document.getElementById('esDayLen');
        if (dl && m.day_length) dl.textContent = 'مدت روز: ' + m.day_length;

        var wData = m.weather || {};
        var extra = document.getElementById('esWeatherExtra');
        if (extra && !wData.condition_fa && !wData.condition) {
            var errs = (m._errors && m._errors.weather) || 'نامشخص';
            extra.innerHTML = '<div style="font-size:10.5px;color:var(--ink-dim);">آب‌وهوا: سرویس پاسخ نداد (' + errs + ')</div>';
        }
        if (extra && (wData.condition_fa || wData.condition)) {
            var wh = '<div style="display:flex;align-items:center;gap:8px;margin-top:8px;padding:8px 10px;background:rgba(255,255,255,0.04);border-radius:10px;">';
            wh += '<div style="flex:1;font-size:11.5px;">';
            wh += '<span style="color:var(--gold-200);font-weight:700;">هوای امروز: </span>' + (wData.condition_fa || wData.condition);
            if (wData.temp != null) wh += ' <span style="color:var(--ink-dim);">· ' + Math.round(wData.temp) + '°C</span>';
            if (wData.temp_min != null && wData.temp_max != null) wh += ' <span style="color:var(--ink-dim);">(' + Math.round(wData.temp_min) + '° تا ' + Math.round(wData.temp_max) + '°)</span>';
            if (wData.feels_like != null) wh += '<br><span style="font-size:10px;color:var(--ink-dim);">🌡️ احساسِ واقعی ' + Math.round(wData.feels_like) + '°C';
            if (wData.humidity != null) wh += ' · 💧 رطوبت ' + Math.round(wData.humidity) + '٪</span>';
            if (wData.wind_speed != null) wh += '<br><span style="font-size:10px;color:var(--ink-dim);">🌬️ باد ' + Math.round(wData.wind_speed) + ' km/h' + (wData.wind_dir_fa ? ' ' + wData.wind_dir_fa : '') + (wData.wind_gusts != null ? ' (تندباز ' + Math.round(wData.wind_gusts) + ')' : '') + '</span>';
            if (wData.uv_index_max != null) wh += '<br><span style="font-size:10px;color:var(--ink-dim);">☀️ UV امروز: ' + (Math.round(wData.uv_index_max * 10) / 10) + (wData.precip_prob_max != null ? ' · 🌧️ احتمالِ بارش ' + wData.precip_prob_max + '٪' : '') + '</span>';
            // ماه از Open-Meteo
            if (m.moon && m.moon.phase_fa) wh += '<br><span style="font-size:10px;color:var(--ink-dim);">' + m.moon.emoji + ' ' + m.moon.phase_fa + '</span>';
            wh += '</div></div>';
            extra.innerHTML = wh;
        }

        // کیفیت هوا (Open-Meteo Air Quality)
        if (airEl) {
            var a = m.air || {};
            if (a.aqi_label) {
                var ah = '<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:rgba(255,255,255,0.04);border-radius:10px;">';
                ah += '<div style="flex:1;font-size:11.5px;">';
                ah += '<span style="color:var(--gold-200);font-weight:700;">' + a.aqi_label + '</span> <span style="color:var(--ink-dim);font-size:10px;">(AQI اروپا: ' + (a.aqi != null ? Math.round(a.aqi) : '—') + ')</span>';
                if (a.pm25 != null) ah += ' <span style="color:var(--ink-dim);font-size:10px;">· PM2.5: ' + Math.round(a.pm25) + '</span>';
                if (a.pm10 != null) ah += ' <span style="color:var(--ink-dim);font-size:10px;">· PM10: ' + Math.round(a.pm10) + '</span>';
                if (a.advice_fa) ah += '<br><span style="font-size:10px;color:var(--ink-dim);">💡 ' + a.advice_fa + '</span>';
                if (a.station) ah += '<br><span style="font-size:9px;color:var(--ink-dim);opacity:0.7;">منبع: ' + a.station + '</span>';
                ah += '</div></div>';
                airEl.innerHTML = ah;
            } else {
                var airErr = a.error || (m._errors && m._errors.air) || 'نامشخص';
                airEl.innerHTML = '<div style="font-size:10.5px;color:var(--ink-dim);">کیفیت هوا: سرویس پاسخ نداد (' + airErr + ')</div>';
            }
        }
    });

    // ─── سیارک‌ها (NASA NeoWs) ───
    fetchAsteroids().then(function (ast) {
        var el = document.getElementById('esAstContent');
        if (!el) return;
        if (!ast) { el.innerHTML = '<div style="font-size:10.5px;color:var(--ink-dim);">داده سیارک‌ها در دسترس نیست.</div>'; return; }
        var s = ast.fa_summary || {};
        var html = '';
        if (s.headline) html += '<div style="font-size:12.5px;font-weight:700;color:var(--gold-200);">☄️ ' + s.headline + '</div>';
        if (s.closest && s.closest.name_fa) {
            html += '<div style="font-size:10.5px;color:var(--ink-dim);margin-top:6px;line-height:1.9;">';
            html += 'نزدیک‌ترین: <span style="color:var(--gold-300);">' + (s.closest.name_fa || '') + '</span>';
            if (s.closest.size) html += ' — ' + s.closest.size;
            if (s.closest.passage) html += '<br>🛰️ ' + s.closest.passage;
            if (s.closest.velocity_km_s) html += ' با سرعت ' + s.closest.velocity_km_s + ' کیلومتر بر ثانیه';
            html += '</div>';
        }
        if (s.hazardous_note) html += '<div style="font-size:10.5px;color:var(--ink-dim);margin-top:4px;">' + s.hazardous_note + '</div>';
        el.innerHTML = html;
    });
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
    dom.btn = document.getElementById('earthStatusBtn');
    dom.panel = document.getElementById('earthStatusPanel');
    if (dom.btn && !dom.btn._earthWired) {
        dom.btn._earthWired = true;
        dom.btn.addEventListener('click', function (e) {
            e.stopPropagation();
            toggle();
        });
    }
    // خارج از پنل = بستن (منطبق با coordinator)
    document.addEventListener('click', function (e) {
        if (isOpen && dom.panel && !dom.panel.contains(e.target) && dom.btn && !dom.btn.contains(e.target)) close();
    });
}

return { init: init, toggle: toggle, close: close };
})();

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', EarthStatus.init);
} else {
    EarthStatus.init();
}
