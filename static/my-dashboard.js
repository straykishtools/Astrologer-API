// ================================================================
//   MY DASHBOARD — داشبورد کاربر + آیین روزانه
//   روند بیوریتم ۷ روزه · جلسات یوگا · چارت‌های ذخیره‌شده
//   آیین روزانه: بیوریتم + حرکت یوگا + ترانزیت/آسمان زنده
// ================================================================

var MyDashboard = (function () {
'use strict';

var _ritualCache = { at: 0, data: null };
var _currentTab = 'bio';
var _apodUrl = null;

/* ─── helpers ─── */
function fa(n) {
    return String(n == null ? 0 : n).replace(/[0-9]/g, function (d) { return '۰۱۲۳۴۵۶۷۸۹'[+d]; });
}
function esc(s) {
    var div = document.createElement('div');
    div.textContent = s == null ? '' : String(s);
    return div.innerHTML;
}
function getToken() { try { return localStorage.getItem('cosmic_token'); } catch (e) { return null; } }
function isLoggedIn() { return !!getToken(); }

function getBirthISO() {
    var bd = (window.sharedInputs && window.sharedInputs.birthDate) || null;
    var iso = null;
    if (bd && bd.year && bd.month && bd.day) {
        iso = bd.year + '-' + String(bd.month).padStart(2, '0') + '-' + String(bd.day).padStart(2, '0');
    } else {
        try {
            var state = localStorage.getItem('yoga_state');
            if (state) {
                var d = JSON.parse(state);
                if (d.birthYear) iso = d.birthYear + '-' + String(d.birthMonth || 1).padStart(2, '0') + '-' + String(d.birthDay || 1).padStart(2, '0');
            }
        } catch (e) {}
    }
    // تبدیل شمسی → میلادی (کامل) در یک نقطه
    if (iso && window.isoShamsiToGregorianISO) return window.isoShamsiToGregorianISO(iso);
    return iso;
}

function isoDate(offsetDays) {
    var d = new Date(Date.now() + (offsetDays || 0) * 86400000);
    return d.toISOString().split('T')[0];
}
function faShortDate(iso) {
    var p = String(iso).split('-');
    if (p.length !== 3) return iso;
    return fa(+p[2]) + '/' + fa(+p[1]);
}

/* ═══════════════════════════════════════════
   LAYER 3 — آیین روزانه (Daily Ritual)
   ═══════════════════════════════════════════ */

// ۷ روز گذشته + امروز از بک‌اند بیوریتم (getBirthISO خودش میلادی برمی‌گرداند)
async function fetchBioTrend() {
    var birth = getBirthISO();
    if (!birth) return null;
    var days = [];
    for (var i = -6; i <= 0; i++) {
        var target = isoDate(i);
        try {
            var resp = await fetch('/api/v5/biorhythm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ birth_date: birth, target_date: target })
            });
            if (!resp.ok) continue;
            var data = await resp.json();
            if (data.status === 'success' && data.data) {
                days.push({ date: target, physical: data.data.physical, emotional: data.data.emotional, intellectual: data.data.intellectual });
            }
        } catch (e) { /* skip day */ }
    }
    return days.length ? days : null;
}

async function fetchApodCached() {
    if (_apodUrl && (Date.now() - _ritualCache.at) < 30 * 60 * 1000) return _apodUrl;
    try {
        var resp = await fetch('/api/v5/nasa/apod');
        if (!resp.ok) return null;
        var data = await resp.json();
        if (data.status === 'success' && data.data && data.data.url) {
            _apodUrl = data.data.url;
            return _apodUrl;
        }
    } catch (e) {}
    return null;
}

function renderRitual() {
    var host = document.getElementById('ritualSteps');
    if (!host) return;

    // فاز ۱: رندر اولیه با داده‌های محلی (بیوریتم واقعی: روزهای واقعی از تولد)
    var birthISO = getBirthISO(); // اکنون میلادی است (تبدیل داخل تابع انجام شد)
    function sin100(days, cycle) { return Math.round(Math.sin(2 * Math.PI * days / cycle) * 100); }
    var bioLocal = null;
    if (birthISO) {
        var birthDate = new Date(birthISO + 'T00:00:00');
        var daysSince = Math.floor((Date.now() - birthDate.getTime()) / 86400000);
        if (!isNaN(daysSince) && daysSince >= 0) {
            bioLocal = { physical: sin100(daysSince, 23), emotional: sin100(daysSince, 28), intellectual: sin100(daysSince, 33) };
        }
    }

    var zodiacAnimal = null;
    var zEl = document.getElementById('zodiacText');
    if (zEl && zEl.textContent && zEl.textContent !== 'ثبت نشده') zodiacAnimal = zEl.textContent.split(' ')[0];

    var yogaPose = 'سگ رو به پایین';
    var yogaHint = 'کشش کامل بدن و آرام‌سازی ستون فقرات';
    try {
        var yogaState = localStorage.getItem('yoga_state');
        if (yogaState) {
            var ys = JSON.parse(yogaState);
            if (ys.lastPose) { yogaPose = ys.lastPose; }
        }
    } catch (e) {}
    // از پنل زودیاک اگر موجود است
    try {
        var yogaNameEl = document.querySelector('.zp-yoga-name');
        if (yogaNameEl && yogaNameEl.textContent) { yogaPose = yogaNameEl.textContent; }
    } catch (e) {}

    var skyText = 'خورشید و ماه در حرکت روزانه';
    var hour = new Date().getHours();
    if (hour < 6) skyText = '🌍 شب — زمان استراحت و تأمل';
    else if (hour < 12) skyText = '🌅 صبح — انرژی صعودی';
    else if (hour < 17) skyText = '☀️ نیمه‌روز — اوج فعالیت';
    else if (hour < 20) skyText = '🌇 غروب — کاهش تدریجی';
    else skyText = '🌙 شب — ریتم آرام';

    host.innerHTML =
        '<div class="ritual-step">' +
            '<div class="ritual-step-icon">🧬</div>' +
            '<div class="ritual-step-label">بیوریتم امروز</div>' +
            '<div class="ritual-step-value" id="ritualBio">—</div>' +
            '<div class="ritual-step-hint" id="ritualBioHint">' + (birthISO ? 'بر اساس چارت تولد شما' : 'تاریخ تولد را در چارت وارد کنید') + '</div>' +
        '</div>' +
        '<div class="ritual-step">' +
            '<div class="ritual-step-icon">🧘</div>' +
            '<div class="ritual-step-label">حرکت یوگا</div>' +
            '<div class="ritual-step-value">' + esc(yogaPose) + '</div>' +
            '<div class="ritual-step-hint">' + esc(yogaHint) + '</div>' +
        '</div>' +
        '<div class="ritual-step">' +
            '<div class="ritual-step-icon">🌌</div>' +
            '<div class="ritual-step-label">آسمان امروز</div>' +
            '<div class="ritual-step-value">' + skyText + '</div>' +
            '<div class="ritual-step-hint" id="ritualSkyHint">در حال دریافت داده ناسا…</div>' +
        '</div>';

    // فاز ۲: غنی‌سازی با API (birthISO اکنون میلادی است)
    if (birthISO) {
        fetch('/api/v5/biorhythm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ birth_date: birthISO })
        }).then(function (r) { return r.ok ? r.json() : null; })
          .then(function (data) {
              if (!data || data.status !== 'success') return;
              var d = data.data;
              var el = document.getElementById('ritualBio');
              if (el) {
                  el.innerHTML = '💪 ' + (d.physical >= 0 ? '+' : '') + Math.round(d.physical) + '% · ' +
                                 '💕 ' + (d.emotional >= 0 ? '+' : '') + Math.round(d.emotional) + '% · ' +
                                 '🧠 ' + (d.intellectual >= 0 ? '+' : '') + Math.round(d.intellectual) + '%';
              }
              var hint = document.getElementById('ritualBioHint');
              if (hint) hint.textContent = d.physical_phase;
          }).catch(function () {});
    } else if (bioLocal) {
        var el = document.getElementById('ritualBio');
        if (el) el.textContent = '💪 ' + bioLocal.physical + '% · 💕 ' + bioLocal.emotional + '% · 🧠 ' + bioLocal.intellectual + '%';
    }

    fetchApodCached().then(function (url) {
        var hint = document.getElementById('ritualSkyHint');
        if (hint && url) hint.innerHTML = '🛸 تصویر نجومی امروز از ناسا آماده است';
    });

    // ─── تزریق Open-Meteo: گامِ «آسمان» و «یوگا» با هوای واقعی هوشمند می‌شود ───
    fetchMeteo2().then(function (m) {
        if (!m || !m.weather) return;
        var w = m.weather;

        // گامِ آسمان: با هوای واقعی
        var skyHint = document.getElementById('ritualSkyHint');
        if (skyHint && w.condition_fa) {
            var skyLine = w.condition_fa + ' · ' + Math.round(w.temp) + '°C';
            if (w.wind_speed != null) skyLine += ' · 🌬️ ' + Math.round(w.wind_speed) + 'km/h';
            skyHint.innerHTML = skyLine;
        }

        // گامِ یوگا: توصیه‌ی هواشناسیانه — بیرون یا درون؟
        var yogaHintEl = document.querySelector('.ritual-step:nth-child(2) .ritual-step-hint');
        if (yogaHintEl) {
            var outOk = true;
            var outMsg = '';
            if (w.precip_prob_max != null && w.precip_prob_max >= 60) { outOk = false; outMsg = '🌧️ احتمال بارش ' + w.precip_prob_max + '٪ — تمرینِ درون پیشنهاد می‌شود'; }
            else if (w.wind_gusts != null && w.wind_gusts >= 40) { outOk = false; outMsg = '🌬️ تندبازِ ' + Math.round(w.wind_gusts) + 'km/h — بیرون سخت است'; }
            else if (w.temp != null && (w.temp >= 38 || w.temp <= 2)) { outOk = false; outMsg = '🌡️ دمایِ ' + Math.round(w.temp) + '° — تمرین در فضای بسته'; }
            else if (w.uv_index_max != null && w.uv_index_max >= 9) { outOk = false; outMsg = '☀️ UVِ ' + Math.round(w.uv_index_max) + ' — سایه یا درون'; }
            if (!outOk && outMsg) yogaHintEl.innerHTML = outMsg;
            else if (w.temp != null && w.temp >= 18 && w.temp <= 30 && (w.precip_prob_max == null || w.precip_prob_max < 30)) {
                yogaHintEl.innerHTML = '🌤️ هوایِ عالی برایِ تمرینِ بیرون — ' + Math.round(w.temp) + '°C';
            }
        }
    });
}

function bindRitualStart() {
    var btn = document.getElementById('ritualStartBtn');
    if (!btn || btn._bound) return;
    btn._bound = true;
    btn.addEventListener('click', function () {
        // اولویت: موتور یوگا → تمرین تنفس → چارت تولد
        if (window.YogaLibrary) {
            if (window.showPage) window.showPage('yoga');
            setTimeout(function () { try { window.YogaLibrary.init(); } catch (e) {} }, 300);
            return;
        }
        if (window.showPage) window.showPage('breath');
    });
}

/* ═══════════════════════════════════════════
   LAYER 2 — داشبورد کاربر (tabs)
   ═══════════════════════════════════════════ */

function sparklineSVG(days, cycle, color) {
    var w = 100, h = 26, pad = 2;
    var coords = days.map(function (v, i) {
        var x = pad + (i / (days.length - 1)) * (w - pad * 2);
        var y = pad + ((100 - v) / 200) * (h - pad * 2);
        return x.toFixed(1) + ',' + y.toFixed(1);
    });
    var zeroY = (pad + (100 / 200) * (h - pad * 2)).toFixed(1);
    return '<svg width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none" style="width:100%;height:auto;">' +
        '<line x1="' + pad + '" y1="' + zeroY + '" x2="' + (w - pad) + '" y2="' + zeroY + '" stroke="rgba(255,255,255,0.12)" stroke-width="0.6" stroke-dasharray="3,2"/>' +
        '<polyline points="' + coords.join(' ') + '" fill="none" stroke="' + color + '" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<circle cx="' + coords[coords.length - 1].split(',')[0] + '" cy="' + coords[coords.length - 1].split(',')[1] + '" r="2.4" fill="' + color + '"/>' +
        '</svg>';
}

function renderBioTab(days) {
    var body = document.getElementById('myDashBody');
    if (!body) return;
    if (!days) {
        body.innerHTML = '<div class="mdb-empty">🧬 برای نمایش روند بیوریتم، ابتدا تاریخ تولد را در بخش چارت تولد وارد کنید.</div>';
        return;
    }
    var labels = days.map(function (d) { return faShortDate(d.date); });
    var last = days[days.length - 1];
    body.innerHTML =
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(90px,1fr));gap:8px;margin-bottom:12px;">' +
            '<div style="text-align:center;background:rgba(255,255,255,0.03);border-radius:12px;padding:10px;"><div style="font-size:18px;">💪</div><div style="font-size:15px;font-weight:800;color:' + (last.physical >= 0 ? '#2ecc71' : '#e74c3c') + '">' + (last.physical >= 0 ? '+' : '') + Math.round(last.physical) + '%</div><div style="font-size:10px;color:var(--ink-dim);">فیزیکی امروز</div></div>' +
            '<div style="text-align:center;background:rgba(255,255,255,0.03);border-radius:12px;padding:10px;"><div style="font-size:18px;">💕</div><div style="font-size:15px;font-weight:800;color:' + (last.emotional >= 0 ? '#2ecc71' : '#e74c3c') + '">' + (last.emotional >= 0 ? '+' : '') + Math.round(last.emotional) + '%</div><div style="font-size:10px;color:var(--ink-dim);">عاطفی امروز</div></div>' +
            '<div style="text-align:center;background:rgba(255,255,255,0.03);border-radius:12px;padding:10px;"><div style="font-size:18px;">🧠</div><div style="font-size:15px;font-weight:800;color:' + (last.intellectual >= 0 ? '#2ecc71' : '#e74c3c') + '">' + (last.intellectual >= 0 ? '+' : '') + Math.round(last.intellectual) + '%</div><div style="font-size:10px;color:var(--ink-dim);">ذهنی امروز</div></div>' +
        '</div>' +
        '<div class="mdb-row"><span style="width:52px;color:var(--ink-dim);">💪 فیزیکی</span><div style="flex:1;">' + sparklineSVG(days.map(function (d) { return d.physical; }), 23, '#e74c3c') + '</div></div>' +
        '<div class="mdb-row"><span style="width:52px;color:var(--ink-dim);">💕 عاطفی</span><div style="flex:1;">' + sparklineSVG(days.map(function (d) { return d.emotional; }), 28, '#e84393') + '</div></div>' +
        '<div class="mdb-row"><span style="width:52px;color:var(--ink-dim);">🧠 ذهنی</span><div style="flex:1;">' + sparklineSVG(days.map(function (d) { return d.intellectual; }), 33, '#5b8dee') + '</div></div>' +
        '<div style="display:flex;justify-content:space-between;font-size:9.5px;color:var(--ink-dim);margin-top:4px;padding-right:60px;">' +
            labels.map(function (l) { return '<span>' + l + '</span>'; }).join('') +
        '</div>';
}

/* راهنمای ورود مشترک تب‌های تاریخچه — مودال لاگین را همان‌جا باز می‌کند
   و پس از لاگین، تب جاری دوباره رندر می‌شود */
function dashLoginNudge(message, guestCta) {
    var body = document.getElementById('myDashBody');
    if (!body) return;
    window.__dashAuthReturn = function () {
        if (window.onAfterLogin) window.onAfterLogin(function () { try { MyDashboard.switchTab(_currentTab); } catch (e) {} });
        if (window.openLoginModal) window.openLoginModal();
    };
    body.innerHTML = '<div class="mdb-empty">🔑 ' + message +
        '<br><button class="mdb-cta" onclick="window.__dashAuthReturn && window.__dashAuthReturn()">ورود / ثبت‌نام</button>' +
        (guestCta || '') + '</div>';
}

function renderYogaTab() {
    var body = document.getElementById('myDashBody');
    if (!body) return;
    var token = getToken();
    if (!token) {
        dashLoginNudge('برای دیدن سابقه جلسات یوگا، وارد حساب کاربری شوید.',
            '<br><button class="mdb-cta" onclick="if(window.showPage)showPage(\'yoga\')">🧘 شروع تمرین بدون ثبت‌نام</button>');
        return;
    }
    body.innerHTML = '<div class="mdb-empty">⏳ در حال دریافت جلسات…</div>';
    fetch('/api/v5/user/dashboard', { headers: { 'Authorization': 'Bearer ' + token } })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (dash) {
            if (!dash || !dash.yoga) { body.innerHTML = '<div class="mdb-empty">📭 داده‌ای موجود نیست.</div>'; return; }
            var y = dash.yoga;
            var recent = y.recent || [];
            var catFa = { asanas: 'آسانا', breathing: 'تنفس', meditation: 'مدیتیشن' };
            var stats = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(100px,1fr));gap:8px;margin-bottom:12px;">' +
                '<div style="text-align:center;background:rgba(255,255,255,0.03);border-radius:12px;padding:10px;"><div style="font-size:15px;font-weight:800;color:var(--gold-300);">' + fa(y.streak || 0) + '</div><div style="font-size:10px;color:var(--ink-dim);">روز متوالی 🔥</div></div>' +
                '<div style="text-align:center;background:rgba(255,255,255,0.03);border-radius:12px;padding:10px;"><div style="font-size:15px;font-weight:800;color:var(--gold-300);">' + fa(y.total_sessions || 0) + '</div><div style="font-size:10px;color:var(--ink-dim);">جلسه</div></div>' +
                '<div style="text-align:center;background:rgba(255,255,255,0.03);border-radius:12px;padding:10px;"><div style="font-size:15px;font-weight:800;color:var(--gold-300);">' + fa(y.total_minutes || 0) + '</div><div style="font-size:10px;color:var(--ink-dim);">دقیقه تمرین</div></div>' +
                '<div style="text-align:center;background:rgba(255,255,255,0.03);border-radius:12px;padding:10px;"><div style="font-size:15px;font-weight:800;color:var(--gold-300);">' + fa(y.longest_streak || 0) + '</div><div style="font-size:10px;color:var(--ink-dim);">رکورد</div></div>' +
            '</div>';
            var rows = recent.slice(0, 8).map(function (s) {
                var label = s.pose_name || s.notes || catFa[s.category] || 'تمرین یوگا';
                var mins = fa(Math.max(1, Math.round((s.duration_seconds || 0) / 60)));
                var dt = s.practice_date ? faShortDate(String(s.practice_date).split('T')[0]) : '—';
                return '<div class="mdb-row">' +
                    '<span>' + (s.completed ? '✅' : '⏹') + '</span>' +
                    '<div class="mdb-row-main"><div class="mdb-row-name">' + esc(label) + '</div><div class="mdb-row-meta">' + esc(catFa[s.category] || s.category) + ' · ' + dt + '</div></div>' +
                    '<span style="color:var(--gold-300);white-space:nowrap;">' + mins + ' دقیقه</span>' +
                '</div>';
            }).join('');
            body.innerHTML = stats +
                (rows ? rows : '<div class="mdb-empty">هنوز جلسه‌ای ثبت نشده.<br><button class="mdb-cta" onclick="if(window.showPage)showPage(\'yoga\')">🧘 اولین جلسه را شروع کنید</button></div>');
        })
        .catch(function () { body.innerHTML = '<div class="mdb-empty">⚠️ خطا در دریافت داده‌ها.</div>'; });
}

function renderChartsTab() {
    var body = document.getElementById('myDashBody');
    if (!body) return;
    var token = getToken();
    if (!token) {
        dashLoginNudge('برای دیدن چارت‌های ذخیره‌شده، وارد حساب کاربری شوید.');
        return;
    }
    body.innerHTML = '<div class="mdb-empty">⏳ در حال دریافت چارت‌ها…</div>';
    fetch('/api/v5/auth/charts', { headers: { 'Authorization': 'Bearer ' + token } })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (data) {
            var charts = (data && data.charts) || [];
            if (!charts.length) {
                body.innerHTML = '<div class="mdb-empty">📭 هنوز چارتی ذخیره نشده.<br><button class="mdb-cta" onclick="if(window.showPage)showPage(\'tools\')">🔮 محاسبه اولین چارت</button></div>';
                return;
            }
            var typeFa = { birth: '🔮 چارت تولد', synastry: '💕 سیناستری', composite: '🔗 کامپوزیت', transit: '🌍 ترانزیت', 'solar-return': '☀️ بازگشت خورشیدی', 'lunar-return': '🌙 بازگشت ماهانه' };
            var rows = charts.slice(0, 10).map(function (c) {
                var title = c.title || typeFa[c.chart_type] || c.chart_type || 'بدون عنوان';
                var dt = c.created_at ? String(c.created_at).split('T')[0] : '';
                return '<div class="mdb-row">' +
                    '<div class="mdb-row-main"><div class="mdb-row-name">' + esc(title) + '</div><div class="mdb-row-meta">' + esc(typeFa[c.chart_type] || c.chart_type || '') + (dt ? ' · ' + faShortDate(dt) : '') + '</div></div>' +
                    '<button class="mdb-cta" style="margin:0;padding:6px 14px;" onclick="viewSavedChart(' + c.id + ')">👁️ مشاهده</button>' +
                '</div>';
            }).join('');
            body.innerHTML = rows;
        })
        .catch(function () { body.innerHTML = '<div class="mdb-empty">⚠️ خطا در دریافت چارت‌ها.</div>'; });
}

/* ─── tab switching ─── */
function switchTab(tab) {
    _currentTab = tab;
    document.querySelectorAll('.mydash-tab').forEach(function (t) {
        t.classList.toggle('active', t.getAttribute('data-mtab') === tab);
    });
    if (tab === 'bio') {
        var body = document.getElementById('myDashBody');
        if (body) body.innerHTML = '<div class="mdb-empty">⏳ در حال محاسبه روند ۷ روزه…</div>';
        fetchBioTrend().then(renderBioTab);
    } else if (tab === 'yoga') {
        renderYogaTab();
    } else if (tab === 'charts') {
        renderChartsTab();
    }
}

function bindTabs() {
    document.querySelectorAll('.mydash-tab').forEach(function (t) {
        if (t._bound) return;
        t._bound = true;
        t.addEventListener('click', function (e) {
            e.stopPropagation();
            switchTab(t.getAttribute('data-mtab'));
        });
    });
}

/* ═══════════════════════════════════════════
   TAB آسمان — داده‌های نجومی پنل 🌌
   ═══════════════════════════════════════════ */
var _moonCache = { at: 0, data: null };
var _planetsCache2 = { at: 0, data: null };
var _spaceWCache = { at: 0, data: null };
var _mansionCache2 = { at: 0, data: null };

function fetchMansion2() {
    if (_mansionCache2.data && (Date.now() - _mansionCache2.at) < 30 * 60 * 1000) return Promise.resolve(_mansionCache2.data);
    return fetch('/api/v5/moon-mansion')
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (d) {
            if (d && d.status === 'success' && d.data) { _mansionCache2 = { at: Date.now(), data: d.data }; return _mansionCache2.data; }
            return null;
        }).catch(function () { return null; });
}

function fetchMoonPhase() {
    if (_moonCache.data && (Date.now() - _moonCache.at) < 10 * 60 * 1000) return Promise.resolve(_moonCache.data);
    return fetch('/api/v5/moon-phase/now-utc', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (d) {
            if (d && d.moon_phase_overview) { _moonCache = { at: Date.now(), data: d.moon_phase_overview }; return _moonCache.data; }
            return null;
        }).catch(function () { return null; });
}
function fetchPlanets2() {
    if (_planetsCache2.data && (Date.now() - _planetsCache2.at) < 30 * 60 * 1000) return Promise.resolve(_planetsCache2.data);
    var today = new Date().toISOString().split('T')[0];
    return fetch('/api/v5/nasa/planets?date=' + today)
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (d) {
            if (d && d.status === 'success' && d.data) { _planetsCache2 = { at: Date.now(), data: d.data }; return _planetsCache2.data; }
            return null;
        }).catch(function () { return null; });
}
function fetchSpaceW2() {
    if (_spaceWCache.data && (Date.now() - _spaceWCache.at) < 30 * 60 * 1000) return Promise.resolve(_spaceWCache.data);
    return fetch('/api/v5/nasa/space-weather/today')
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (d) {
            if (d && d.status === 'success' && d.data) { _spaceWCache = { at: Date.now(), data: d.data }; return _spaceWCache.data; }
            return null;
        }).catch(function () { return null; });
}

function renderSkyTab() {
    var moonCard = document.getElementById('skyMoonCard');
    var planetsCard = document.getElementById('skyPlanetsCard');
    var sunCard = document.getElementById('skySunCard');
    if (!moonCard && !planetsCard && !sunCard) return;

    // هر کارت مستقل رندر می‌شود — انتظار برای بقیه نمی‌کشد
    fetchMoonPhase().then(function (moon) {
        if (!moonCard) return;
        if (!moon) { moonCard.innerHTML = '<div class="mdu-card-title">🌙 ماه</div><div class="mdb-empty">داده در دسترس نیست.</div>'; return; }
        var m = moon.moon || {};
        var html = '<div class="mdu-card-title">🌙 ماه</div>';
        html += '<div class="mdu-grid">';
        html += '<div class="mdu-item"><div class="mdu-item-label">فاز فعلی</div><div class="mdu-item-value">' + (m.phase_name || '—') + '</div></div>';
        html += '<div class="mdu-item"><div class="mdu-item-label">روشنایی</div><div class="mdu-item-value">' + (m.illumination != null ? Math.round(m.illumination) + '٪' : '—') + (m.stage === 'waxing' ? ' 📈' : ' 📉') + '</div></div>';
        if (m.zodiac && m.zodiac.moon_sign) {
            var sn = { Ari:'حَمل ♈',Tau:'ثور ♉',Gem:'جوزا ♊',Can:'سرطان ♋',Leo:'اسد ♌',Vir:'سنبله ♍',Lib:'میزان ♎',Sco:'عقرب ♏',Sgr:'قوس ♐',Cap:'جدی ♑',Aqr:'دلو ♒',Psc:'حوت ♓' };
            html += '<div class="mdu-item"><div class="mdu-item-label">برج ماه</div><div class="mdu-item-value">' + (sn[m.zodiac.moon_sign] || m.zodiac.moon_sign) + '</div></div>';
        }
        html += '</div>';
        var s = moon.sun || {};
        if (m.next_lunar_eclipse && m.next_lunar_eclipse.datestamp) html += '<div class="mdu-line">🌑 گرفت ماه: ' + m.next_lunar_eclipse.type + ' — ' + faShortDate(new Date(m.next_lunar_eclipse.timestamp * 1000).toISOString().split('T')[0]) + '</div>';
        if (s.next_solar_eclipse && s.next_solar_eclipse.datestamp) html += '<div class="mdu-line">☀️ گرفت خورشید: ' + s.next_solar_eclipse.type + ' — ' + faShortDate(new Date(s.next_solar_eclipse.timestamp * 1000).toISOString().split('T')[0]) + '</div>';
        moonCard.innerHTML = html;
    });

    fetchPlanets2().then(function (planets) {
        if (!planetsCard) return;
        if (!planets || !planets.planets) { planetsCard.innerHTML = '<div class="mdu-card-title">🪐 موقعیت سیارات</div><div class="mdb-empty">داده در دسترس نیست.</div>'; return; }
        var signFa = { Aries:'حَمل ♈',Taurus:'ثور ♉',Gemini:'جوزا ♊',Cancer:'سرطان ♋',Leo:'اسد ♌',Virgo:'سنبله ♍',Libra:'میزان ♎',Scorpio:'عقرب ♏',Sagittarius:'قوس ♐',Capricorn:'جدی ♑',Aquarius:'دلو ♒',Pisces:'حوت ♓' };
        var pEmoji = { Sun:'☀️',Moon:'🌙',Mercury:'☿',Venus:'♀️',Mars:'♂️',Jupiter:'♃',Saturn:'♄',Uranus:'♅',Neptune:'♆',Pluto:'♇' };
        var interps = {};
        (planets.interpretations || []).forEach(function (it) { interps[it.planet] = it; });
        var html = '<div class="mdu-card-title">🪐 موقعیت و تفسیر سیارات</div>';
        html += '<div class="mdu-grid mdu-grid-2">';
        Object.keys(planets.planets).forEach(function (name) {
            var p = planets.planets[name];
            html += '<div class="mdu-item"><div class="mdu-item-label">' + (pEmoji[name] || '🪐') + ' ' + name + '</div><div class="mdu-item-value">' + (signFa[p.sign] || p.sign) + ' ' + p.degree_in_sign + '°</div></div>';
        });
        html += '</div>';
        // تفسیرها
        if (Object.keys(interps).length) {
            html += '<div style="margin-top:12px;">';
            Object.keys(interps).forEach(function (name) {
                var it = interps[name];
                if (!it) return;
                html += '<div style="margin-bottom:10px;padding:10px 14px;background:rgba(253,203,110,0.05);border-right:2.5px solid rgba(253,203,110,0.4);border-radius:10px;">';
                html += '<b style="color:var(--gold-300);font-size:0.85rem;">' + it.planet_fa + ' در ' + it.sign_fa + '</b>';
                html += '<div style="color:#ccc;font-size:0.82rem;line-height:1.95;margin-top:4px;">' + it.interpretation + '</div>';
                html += '</div>';
            });
            html += '</div>';
        }
        planetsCard.innerHTML = html;
    });

    fetchSpaceW2().then(function (sw) {
        if (!sunCard) return;
        if (!sw) { sunCard.innerHTML = '<div class="mdu-card-title">🌞 فعالیت خورشیدی</div><div class="mdb-empty">داده در دسترس نیست.</div>'; return; }
        var en = sw.today_energy || {};
        var fl = sw.solar_flares || {};
        var gs = sw.geomagnetic_storms || {};
        var html = '<div class="mdu-card-title">🌞 فعالیت خورشیدی</div>';
        html += '<div style="font-size:14px;font-weight:800;color:var(--gold-200);margin-bottom:4px;">' + (en.emoji || '🟢') + ' ' + (en.level || 'آرام') + '</div>';
        if (fl.fa) html += '<div class="mdu-line">☀️ ' + fl.fa + '</div>';
        if (gs.fa) html += '<div class="mdu-line">🧲 ' + gs.fa + '</div>';
        if (!fl.fa && !gs.fa) html += '<div class="mdu-line">✅ آسمان آرام است — فوران یا طوفان مغناطیسی فعال ثبت نشده.</div>';
        sunCard.innerHTML = html;
    });

    // منزل قمر
    var mansionCard = document.getElementById('skyMansionCard');
    if (mansionCard) {
        fetchMansion2().then(function (mm) {
            if (!mm) { mansionCard.innerHTML = '<div class="mdu-card-title">🏛️ منزل قمر</div><div class="mdb-empty">داده در دسترس نیست.</div>'; return; }
            var ms = mm.mansion || {};
            var nx = mm.next || {};
            var html = '<div class="mdu-card-title">🏛️ منزل قمر</div>';
            html += '<div style="font-size:14px;font-weight:800;color:var(--gold-200);">منزل ' + ms.num + ': ' + (ms.name_fa || '') + '</div>';
            html += '<div style="font-size:10.5px;color:var(--ink-dim);margin-top:2px;">' + (ms.meaning || '') + ' · مزاج: ' + (ms.mood || '—') + '</div>';
            html += '<div style="height:4px;background:rgba(255,255,255,0.06);border-radius:2px;margin-top:10px;overflow:hidden;">';
            html += '<div style="height:100%;width:' + (mm.percent_of_mansion || 0) + '%;background:linear-gradient(90deg,#5b4fc4,#a29bfe,#f3e5b8);border-radius:2px;"></div></div>';
            html += '<div style="font-size:9.5px;color:var(--ink-dim);margin-top:4px;">' + (mm.percent_of_mansion || 0) + '٪ از منزل طی شده</div>';
            if (ms.interp) html += '<div class="mdu-line">📜 ' + ms.interp + '</div>';
            if (nx.name_fa) html += '<div class="mdu-line">⏭️ منزل بعد: ' + nx.name_fa + ' — حدود ' + Math.round(nx.in_hours) + ' ساعت دیگر</div>';
            mansionCard.innerHTML = html;
        });
    }
}

/* ═══════════════════════════════════════════
   TAB زمین — آب‌وهوا + کیفیت هوا + سیارک‌ها
   ═══════════════════════════════════════════ */
var _meteoCache2 = { at: 0, data: null };
var _astCache2 = { at: 0, data: null };
window.addEventListener('geoloc:change', function () { _meteoCache2 = { at: 0, data: null }; });

function fetchMeteo2() {
    if (_meteoCache2.data && (Date.now() - _meteoCache2.at) < 30 * 60 * 1000) return Promise.resolve(_meteoCache2.data);
    var loc = (window.GeoLoc && GeoLoc.resolve()) || { lat: 35.6892, lng: 51.3890 };
    return fetch('/api/v5/weather?lat=' + loc.lat + '&lng=' + loc.lng)
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (d) {
            if (d && (d.status === 'success' || d.status === 'partial') && d.data) { _meteoCache2 = { at: Date.now(), data: d.data }; return _meteoCache2.data; }
            if (d && d.detail) console.warn('[MyDash] weather errors:', d.detail);
            return null;
        }).catch(function () { return null; });
}
function fetchAst2() {
    if (_astCache2.data && (Date.now() - _astCache2.at) < 30 * 60 * 1000) return Promise.resolve(_astCache2.data);
    return fetch('/api/v5/nasa/asteroids/today')
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (d) {
            if (d && d.status === 'success' && d.data) { _astCache2 = { at: Date.now(), data: d.data }; return _astCache2.data; }
            return null;
        }).catch(function () { return null; });
}

function renderEarthTab() {
    var weatherCard = document.getElementById('earthWeatherCard');
    var airCard = document.getElementById('earthAirCard');
    var astCard = document.getElementById('earthAstCard');
    if (!weatherCard && !airCard && !astCard) return;

    fetchMeteo2().then(function (m) {
        // آب‌وهوا (Open-Meteo)
        if (weatherCard) {
            if (m && m.weather) {
                var w = m.weather;
                var html = '<div class="mdu-card-title">🌤️ آب‌وهوا</div>';
                html += '<div class="mdu-grid">';
                html += '<div class="mdu-item"><div class="mdu-item-label">وضعیت</div><div class="mdu-item-value">' + (w.condition_fa || '—') + '</div></div>';
                if (w.temp != null) html += '<div class="mdu-item"><div class="mdu-item-label">دما</div><div class="mdu-item-value">' + Math.round(w.temp) + '°C</div></div>';
                if (w.feels_like != null) html += '<div class="mdu-item"><div class="mdu-item-label">احساسِ واقعی</div><div class="mdu-item-value">' + Math.round(w.feels_like) + '°C</div></div>';
                if (w.temp_min != null) html += '<div class="mdu-item"><div class="mdu-item-label">کمینه / بیشینه</div><div class="mdu-item-value">' + Math.round(w.temp_min) + '° / ' + Math.round(w.temp_max) + '°</div></div>';
                if (w.humidity != null) html += '<div class="mdu-item"><div class="mdu-item-label">رطوبت</div><div class="mdu-item-value">' + Math.round(w.humidity) + '٪</div></div>';
                if (w.wind_speed != null) html += '<div class="mdu-item"><div class="mdu-item-label">باد</div><div class="mdu-item-value">' + Math.round(w.wind_speed) + ' km/h' + (w.wind_dir_fa ? '<div style="font-size:0.65rem;color:#888;">' + w.wind_dir_fa + '</div>' : '') + '</div></div>';
                if (w.uv_index_max != null) html += '<div class="mdu-item"><div class="mdu-item-label">UV بیشینه</div><div class="mdu-item-value">' + (Math.round(w.uv_index_max * 10) / 10) + '</div></div>';
                if (w.precip_prob_max != null) html += '<div class="mdu-item"><div class="mdu-item-label">احتمال بارش</div><div class="mdu-item-value">' + w.precip_prob_max + '٪</div></div>';
                if (m.sunrise) html += '<div class="mdu-item"><div class="mdu-item-label">طلوع / غروب</div><div class="mdu-item-value">' + m.sunrise + ' — ' + m.sunset + '</div></div>';
                if (m.moon && m.moon.phase_fa) html += '<div class="mdu-item"><div class="mdu-item-label">فاز ماه</div><div class="mdu-item-value">' + m.moon.emoji + ' ' + m.moon.phase_fa + '</div></div>';
                html += '</div>';
                weatherCard.innerHTML = html;
            } else {
                var wErr = (m && m._errors && m._errors.weather) || 'نامشخص';
                weatherCard.innerHTML = '<div class="mdu-card-title">🌤️ آب‌وهوا</div><div class="mdb-empty">سرویس پاسخ نداد (' + wErr + ').</div>';
            }
        }
        // کیفیت هوا (Open-Meteo Air)
        if (airCard) {
            if (m && m.air && m.air.aqi_label) {
                var a = m.air;
                var ah = '<div class="mdu-card-title">🍃 کیفیت هوا</div>';
                ah += '<div class="mdu-grid">';
                ah += '<div class="mdu-item"><div class="mdu-item-label">AQI اروپا</div><div class="mdu-item-value">' + (a.aqi != null ? Math.round(a.aqi) : '—') + '</div></div>';
                ah += '<div class="mdu-item"><div class="mdu-item-label">وضعیت</div><div class="mdu-item-value">' + a.aqi_label + '</div></div>';
                if (a.pm25 != null) ah += '<div class="mdu-item"><div class="mdu-item-label">PM2.5</div><div class="mdu-item-value">' + Math.round(a.pm25) + '</div></div>';
                if (a.pm10 != null) ah += '<div class="mdu-item"><div class="mdu-item-label">PM10</div><div class="mdu-item-value">' + Math.round(a.pm10) + '</div></div>';
                ah += '</div>';
                if (a.advice_fa) ah += '<div class="mdu-line">💡 ' + a.advice_fa + '</div>';
                if (a.station) ah += '<div class="mdu-line" style="font-size:10px;opacity:0.7;">منبع: ' + a.station + '</div>';
                airCard.innerHTML = ah;
            } else {
                var aErr = (m && m._errors && m._errors.air) || 'نامشخص';
                airCard.innerHTML = '<div class="mdu-card-title">🍃 کیفیت هوا</div><div class="mdb-empty">سرویس پاسخ نداد (' + aErr + ').</div>';
            }
        }
    });

    fetchAst2().then(function (ast) {
        if (!astCard) return;
        if (ast) {
            var s = ast.fa_summary || {};
            var html = '<div class="mdu-card-title">☄️ سیارک‌های نزدیک زمین</div>';
            if (s.headline) html += '<div style="font-size:13px;font-weight:700;color:var(--gold-200);">' + s.headline + '</div>';
            if (s.closest && s.closest.name_fa) {
                html += '<div class="mdu-line">نزدیک‌ترین: <b style="color:var(--gold-300);">' + (s.closest.name_fa || '') + '</b>' + (s.closest.size ? ' — ' + s.closest.size : '') + '</div>';
                if (s.closest.passage) html += '<div class="mdu-line">🛰️ ' + s.closest.passage + (s.closest.velocity_km_s ? ' با سرعت ' + s.closest.velocity_km_s + ' km/s' : '') + '</div>';
            }
            if (s.hazardous_note) html += '<div class="mdu-line">' + s.hazardous_note + '</div>';
            if (!s.headline && !s.closest) html += '<div class="mdb-empty">امروز سیارکی نزدیک نشده.</div>';
            astCard.innerHTML = html;
        } else {
            astCard.innerHTML = '<div class="mdu-card-title">☄️ سیارک‌های نزدیک زمین</div><div class="mdb-empty">داده در دسترس نیست.</div>';
        }
    });
}

/* ─── profile card — shows the user their birth data is actually stored ─── */
function renderProfileCard() {
    var box = document.getElementById('myDashProfile');
    if (!box) return;
    var token = getToken();
    if (!token) { box.hidden = true; box.innerHTML = ''; return; }
    fetch('/api/v5/user/profile', { headers: { 'Authorization': 'Bearer ' + token } })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (p) {
            if (!p || (!p.birth_year && !p.name)) { box.hidden = true; return; }
            var display = p.name || (function () { try { return (JSON.parse(localStorage.getItem('cosmic_user') || '{}').display_name) || ''; } catch (e) { return ''; } })();
            var initial = (display || '?').trim().charAt(0).toUpperCase();
            var meta = [];
            if (p.birth_year) {
                var dt = p.birth_year + '/' + String(p.birth_month || 1).padStart(2, '0') + '/' + String(p.birth_day || 1).padStart(2, '0');
                meta.push('📅 ' + fa(dt.replace(/[0-9]/g, function (d) { return '۰۱۲۳۴۵۶۷۸۹'[+d]; })));
                if (p.birth_hour || p.birth_minute) meta.push('🕒 ' + fa(String(p.birth_hour || 0).padStart(2, '0') + ':' + String(p.birth_minute || 0).padStart(2, '0')).replace(/[0-9]/g, function (d) { return '۰۱۲۳۴۵۶۷۸۹'[+d]; }));
            }
            if (p.city) meta.push('📍 ' + esc(p.city));
            box.innerHTML =
                '<div class="mdp-avatar">' + esc(initial) + '</div>' +
                '<div><div class="mdp-name">' + esc(display || 'کاربر کیهانی') + '</div>' +
                '<div class="mdp-meta">' + (meta.join(' · ') || 'تاریخ تولد ذخیره نشده — در چارت تولد وارد کنید') + '</div></div>' +
                '<div style="margin-inline-start:auto;font-size:11px;color:var(--ink-dim);">✅ ذخیره شده در حساب شما</div>';
            box.hidden = false;
        })
        .catch(function () { box.hidden = true; });
}

/* ─── init (called when dashboard page opens) ─── */
function init() {
    renderProfileCard();
    renderRitual();
    bindRitualStart();
    bindTabs();
    // default tab content only if not yet rendered
    var body = document.getElementById('myDashBody');
    if (body && !body.innerHTML.trim()) switchTab('bio');
    // آسمان و زمین — مستقیم در صفحه (بدون تب)
    renderSkyTab();
    renderEarthTab();
}

return { init: init, switchTab: switchTab, refresh: init };
})();
