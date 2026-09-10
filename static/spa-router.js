// ================================================================
//  SPA ROUTER + LANDING PAGE + DASHBOARD
//  مسیریابی هش‌دار + صفحه لندینگ + داشبورد کاربری
// ================================================================

(function() {
'use strict';

function escapeHtml(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(String(str)));
    return div.innerHTML;
}

// ─── مسیریابی هش‌دار ───
// #/ → landing
// #/app → main app (tabs)
// #/dashboard → user dashboard
// #/pricing → pricing page
// #/admin → admin panel

function getHashRoute() {
    var hash = window.location.hash || '#/';
    // Normalize: #/app/birth → route='app', sub='birth'
    var clean = hash.replace(/^#\/?/, '');
    var parts = clean.split('/');
    return { route: parts[0] || '', sub: parts[1] || '' };
}

function navigate(route) {
    var target = '#/' + route;
    if (window.location.hash === target) {
        // Same route clicked again — re-render in place.
        handleRoute();
    } else {
        window.location.hash = target;
    }
}

// Map a sidebar data-nav target to a hash route and navigate there.
window.navigateToNav = function (target) {
    var direct = ['home', 'landing', 'dashboard', 'yoga', 'breath', 'qol', 'admin'];
    var route = (direct.indexOf(target) !== -1) ? target : ('app/' + target);
    navigate(route);
};

function showLanding() {
    // The current index.html owns page visibility through its native shell.
    if (window.showPage) { showPage('home'); return; }
    var container = document.querySelector('.container');
    if (!container) return;
    var toolsPage = document.getElementById('pageTools');
    if (toolsPage) toolsPage.hidden = true;
    var existing = document.getElementById('landingPage');
    if (existing) { existing.style.display = 'block'; triggerLandingAnimations(); return; }

    var landing = document.createElement('div');
    landing.id = 'landingPage';
    landing.className = 'landing-page';
    landing.innerHTML = `
        <div class="landing-hero">
            <div class="landing-hero-bg"></div>
            <div class="landing-orb-container"><canvas id="landingOrbCanvas" width="120" height="120"></canvas></div>
            <h1 class="landing-title">Cosmic Oracle</h1>
            <p class="landing-subtitle">رصدخانه‌ی کیهانی · چارت تولد حرفه‌ای</p>
            <p class="landing-desc">شانزده ابزار نجومی، حکمت ایرانی و پیش‌بینی در یک جایگاه واحد</p>
            <button class="landing-cta" onclick="navigate('app')">🚀 شروع رایگان</button>
            <div class="landing-stats">
                <div class="landing-stat"><div class="landing-stat-num">۱۶+</div><div class="landing-stat-label">ابزار تخصصی</div></div>
                <div class="landing-stat"><div class="landing-stat-num">۲۷</div><div class="landing-stat-label">ناکشاترا</div></div>
                <div class="landing-stat"><div class="landing-stat-num">۱۲</div><div class="landing-stat-label">برج فلکی</div></div>
                <div class="landing-stat"><div class="landing-stat-num">۱۰۰+</div><div class="landing-stat-label">حرکت یوگا</div></div>
            </div>
        </div>

        <div class="landing-section">
            <h2 class="dd-section-title">📋 پنل روزانه شما</h2>
            <div id="dailyDashboard"></div>
        </div>

        <div class="landing-section">
            <h2 class="landing-section-title">⭐ محبوب‌ترین ابزارها</h2>
            <div class="landing-tools-grid">
                <div class="landing-tool-card lc-1" onclick="navigate('app')" style="--accent:#f39c12"><img class="ltc-emoji" src="static/images/ui/birth.svg" alt=""><div class="ltc-name">چارت تولد</div><div class="ltc-desc">چارت کامل و تحلیل ودیک</div></div>
                <div class="landing-tool-card lc-2" onclick="navigate('app')" style="--accent:#e84393"><img class="ltc-emoji" src="static/images/ui/synastry.svg" alt=""><div class="ltc-name">سیناستری</div><div class="ltc-desc">سازگاری زوجین</div></div>
                <div class="landing-tool-card lc-3" onclick="navigate('app')" style="--accent:#a29bfe"><img class="ltc-emoji" src="static/images/ui/tarot.svg" alt=""><div class="ltc-name">تاروت</div><div class="ltc-desc">کشف آینده</div></div>
                <div class="landing-tool-card lc-4" onclick="navigate('app')" style="--accent:#27ae60"><img class="ltc-emoji" src="static/images/ui/hafez.svg" alt=""><div class="ltc-name">فال حافظ</div><div class="ltc-desc">غزل و تفأل</div></div>
                <div class="landing-tool-card lc-5" onclick="navigate('app')" style="--accent:#0984e3"><img class="ltc-emoji" src="static/images/ui/nasa.svg" alt=""><div class="ltc-name">ناسا</div><div class="ltc-desc">عکس روز و فضا</div></div>
                <div class="landing-tool-card lc-6" onclick="navigate('app')" style="--accent:#e17055"><img class="ltc-emoji" src="static/images/ui/biorhythm.svg" alt=""><div class="ltc-name">بیوریتم</div><div class="ltc-desc">نمودار زیستی</div></div>
                <div class="landing-tool-card lc-7" onclick="navigate('app')" style="--accent:#00cec9"><img class="ltc-emoji" src="static/images/ui/yoga.svg" alt=""><div class="ltc-name">حرکات یوگا</div><div class="ltc-desc">کتابخانه ۱۰۰+ حرکت</div></div>
                <div class="landing-tool-card lc-8" onclick="navigate('app')" style="--accent:#fdcb6e"><img class="ltc-emoji" src="static/images/ui/mizaj.svg" alt=""><div class="ltc-name">مزاج‌شناسی</div><div class="ltc-desc">طبع‌شناسی ایرانی</div></div>
            </div>
        </div>

        <div class="landing-section">
            <h2 class="landing-section-title">✨ چرا کیهان‌نگر؟</h2>
            <div class="landing-features-grid">
                <div class="landing-feature-card lc-1"><img class="lfc-icon" src="static/images/ui/saturn.svg" alt=""><div class="lfc-title">موتور ودیک حرفه‌ای</div><div class="lfc-desc">محاسبات دقیق بر اساس موتور Kerykeion با پشتیبانی از تقویم ودیک</div></div>
                <div class="landing-feature-card lc-2"><img class="lfc-icon" src="static/images/ui/dashboard.svg" alt=""><div class="lfc-title">۱۶+ ابزار تخصصی</div><div class="lfc-desc">از چارت تولد تا سیناستری، کامپوزیت، ترانزیت، تاروت و فال حافظ</div></div>
                <div class="landing-feature-card lc-3"><div class="lfc-icon">🆓</div><div class="lfc-title">رایگان شروع کنید</div><div class="lfc-desc">چارت تولد کامل، تاروت و فال حافظ کاملاً رایگان</div></div>
                <div class="landing-feature-card lc-4"><div class="lfc-icon">📈</div><div class="lfc-title">تفسیر هوشمند</div><div class="lfc-desc">تفسیر فارسی کامل با امتیاز و سطوح سازگاری</div></div>
            </div>
        </div>

        <div class="landing-section">
            <h2 class="landing-section-title">💬 نظرات کاربران</h2>
            <div class="landing-reviews-grid">
                <div class="landing-review-card lc-1"><div class="lrc-stars">⭐⭐⭐⭐⭐</div><p class="lrc-text">"بهترین اپ طالع‌بینی فارسی که استفاده کردم. چارت تولد فوق‌العاده دقیقه!"</p><div class="lrc-author">— سارا م.</div></div>
                <div class="landing-review-card lc-2"><div class="lrc-stars">⭐⭐⭐⭐⭐</div><p class="lrc-text">"سیناستری عالی بود! تفسیر سازگاری ما دقیق و واقعی بود."</p><div class="lrc-author">— رضا ک.</div></div>
                <div class="landing-review-card lc-3"><div class="lrc-stars">⭐⭐⭐⭐⭐</div><p class="lrc-text">"فال حافظش عالیه، غزل‌ها دقیق انتخاب میشن. ممنون از تیم خوبتون."</p><div class="lrc-author">— نگار ا.</div></div>
            </div>
        </div>

        <div class="landing-cta-section">
            <button class="landing-cta landing-cta-lg" onclick="navigate('app')">🚀 شروع رایگان</button>
            <p class="landing-cta-note">بدون نیاز به ثبت‌نام شروع کنید</p>
        </div>
    `;
    container.insertBefore(landing, container.firstChild);
    triggerLandingAnimations();
    initLandingOrb();
    if (window.DailyDashboard) window.DailyDashboard.renderDashboard('dailyDashboard');
}

function triggerLandingAnimations() {
    var cards = document.querySelectorAll('.landing-tool-card, .landing-feature-card, .landing-review-card, .dd-card');
    cards.forEach(function (card, i) {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px) scale(0.95)';
        setTimeout(function () {
            card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0) scale(1)';
        }, 100 + i * 80);
    });
}

function initLandingOrb() {
    var canvas = document.getElementById('landingOrbCanvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var w = 120, h = 120, cx = w/2, cy = h/2, r = 40;
    var t = 0;
    function draw() {
        t += 0.02;
        ctx.clearRect(0,0,w,h);
        // Outer glow
        var g1 = ctx.createRadialGradient(cx,cy,r*0.5,cx,cy,r*1.5);
        g1.addColorStop(0, 'rgba(201,162,39,0.15)');
        g1.addColorStop(1, 'rgba(201,162,39,0)');
        ctx.fillStyle = g1;
        ctx.fillRect(0,0,w,h);
        // Orb body
        var g2 = ctx.createRadialGradient(cx-r*0.3,cy-r*0.3,r*0.1,cx,cy,r);
        g2.addColorStop(0, 'rgba(236,217,160,0.9)');
        g2.addColorStop(0.5, 'rgba(201,162,39,0.7)');
        g2.addColorStop(1, 'rgba(168,129,42,0.4)');
        ctx.beginPath();
        ctx.arc(cx,cy,r,0,Math.PI*2);
        ctx.fillStyle = g2;
        ctx.fill();
        // Flowing bands
        for (var i=0;i<3;i++) {
            ctx.beginPath();
            var offset = i * Math.PI * 0.7 + t;
            ctx.ellipse(cx,cy,r*0.7,r*0.2,offset,0,Math.PI*2);
            ctx.strokeStyle = 'rgba(255,255,255,' + (0.15 - i*0.03) + ')';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        // Highlight
        var hg = ctx.createRadialGradient(cx-r*0.25,cy-r*0.25,0,cx-r*0.25,cy-r*0.25,r*0.35);
        hg.addColorStop(0, 'rgba(255,255,255,0.35)');
        hg.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = hg;
        ctx.beginPath();
        ctx.arc(cx-r*0.25,cy-r*0.25,r*0.35,0,Math.PI*2);
        ctx.fill();
        // Stop animation if canvas removed or hidden
        var landing = document.getElementById('landingPage');
        if (!landing || landing.style.display === 'none') return;
        requestAnimationFrame(draw);
    }
    draw();
}

function showApp() {
    // Delegate to the native shell's tools page.
    if (window.showPage) { showPage('tools'); return; }
    var landing = document.getElementById('landingPage');
    if (landing) landing.style.display = 'none';
    var toolsPage = document.getElementById('pageTools');
    if (toolsPage) toolsPage.hidden = false;
    var dash = document.getElementById('dashboardPage');
    if (dash) dash.style.display = 'none';
}

function showDashboard() {
    // Delegate to the native shell's dashboard page.
    if (window.showPage) { showPage('dashboard'); return; }
    var container = document.querySelector('.container');
    if (!container) return;
    var landing = document.getElementById('landingPage');
    var toolsPage = document.getElementById('pageTools');
    if (landing) landing.style.display = 'none';
    if (toolsPage) toolsPage.hidden = true;

    var existing = document.getElementById('dashboardPage');
    if (existing) { existing.style.display = 'block'; loadDashboardCharts(); return; }

    var dash = document.createElement('div');
    dash.id = 'dashboardPage';
    dash.style.cssText = 'padding:20px;';
    dash.innerHTML = `
        <div style="text-align:center;margin-bottom:30px;">
            <h2 style="font-size:1.8rem;color:#fff;">📊 داشبورد کاربری</h2>
            <p style="color:#888;margin-top:5px;">چارت‌های ذخیره‌شده و تاریخچه</p>
        </div>
        <div id="dashboardContent" style="max-width:900px;margin:0 auto;">
            <div style="text-align:center;color:#888;padding:40px;">⏳ در حال بارگذاری...</div>
        </div>
        <div style="text-align:center;margin-top:30px;">
            <button onclick="navigate('app')" style="background:#1e2740;color:#b0c4e0;border:none;padding:10px 30px;border-radius:50px;cursor:pointer;font-family:inherit;font-size:0.9rem;">← بازگشت به ابزارها</button>
        </div>
    `;
    container.insertBefore(dash, formCard);
    loadDashboardCharts();
}

async function loadDashboardCharts() {
    var content = document.getElementById('dashboardContent');
    if (!content) return;

    // Check auth
    var token = localStorage.getItem('cosmic_token');
    if (!token) {
        content.innerHTML = '<div style="text-align:center;padding:40px;"><div style="font-size:3rem;margin-bottom:15px;">🔑</div><p style="color:#888;">برای دسترسی به داشبورد، وارد شوید.</p><button onclick="navigate(\'app\')" style="background:#f39c12;color:#0b0e1a;border:none;padding:10px 30px;border-radius:50px;cursor:pointer;font-family:inherit;font-weight:700;margin-top:15px;">ورود / ثبت‌نام</button></div>';
        return;
    }

    // Live stats from the Cosmic Oracle database (Phase 1)
    var statsHtml = '';
    try {
        var dashResp = await fetch('/api/v5/user/dashboard', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        if (dashResp.ok) {
            var dash = await dashResp.json();
            var y = dash.yoga || {};
            var t = dash.tarot || {};
            var c = dash.charts || {};
            var streakMap = {};
            (dash.streaks || []).forEach(function (s) { streakMap[s.streak_type] = s.current_streak || 0; });
            var fa = function (n) { return String(n == null ? 0 : n).replace(/[0-9]/g, function (d) { return '۰۱۲۳۴۵۶۷۸۹'[+d]; }); };
            /* classic-studio session log feeds yoga stats too */
            var pyHist = [], pyKarma = 0;
            try {
                pyHist = JSON.parse(localStorage.getItem('py_history') || '[]') || [];
                pyKarma = JSON.parse(localStorage.getItem('py_karma') || '0') || 0;
            } catch (e) {}
            var pyMin = 0;
            pyHist.forEach(function (h) { pyMin += Math.round((h.seconds || 0) / 60); });

            /* refresh classic strip counters each time dashboard renders */
            try {
                var pyHist2 = pyHist, pyKarma2 = pyKarma;
                var setT = function (id, v) { var el = document.getElementById(id); if (el) el.textContent = fa(v); };
                setT('pycKarma', pyKarma2);
                setT('pycSessions', pyHist2.length);
                var pm2 = 0; pyHist2.forEach(function (h) { pm2 += Math.round((h.seconds || 0) / 60); });
                setT('pycTime', pm2);
            } catch (e) {}
            var cards = [
                { icon: '🔥', label: 'استریک یوگا', value: fa(streakMap.yoga || y.streak) + ' روز' },
                { icon: '🧘', label: 'جلسات یوگا', value: fa((y.total_sessions || 0) + pyHist.length) + ' جلسه' },
                { icon: '⏱️', label: 'زمان تمرین', value: fa((y.total_minutes || 0) + pyMin) + ' دقیقه' },
                { icon: '🪷', label: 'کارما کلاسیک', value: fa(pyKarma) },
                { icon: '🔮', label: 'دست‌های تاروت', value: fa(t.total_draws || 0) },
                { icon: '📊', label: 'چارت‌های ذخیره‌شده', value: fa((c.total || 0) + (dash.legacy_charts || []).length) },
                { icon: '⚡', label: 'استریک تاروت', value: fa(streakMap.tarot || 0) + ' روز' }
            ];
            statsHtml = '<div class="cosmic-stat-grid">' +
                cards.map(function (cd) {
                    return '<div class="cosmic-stat-card">' +
                        '<div class="cs-icon">' + cd.icon + '</div>' +
                        '<div class="cs-value">' + cd.value + '</div>' +
                        '<div class="cs-label">' + cd.label + '</div>' +
                        '<div class="cs-spark"></div></div>';
                }).join('') + '</div>';

            // 🧘 جلسات یوگای اخیر — از سوابق واقعی دیتابیس
            var recent = y.recent || [];
            var catFa = { asanas: 'آسانا', breathing: 'تنفس', meditation: 'مدیتیشن' };
            var d = new Date();
            var todayISO = d.toISOString().split('T')[0];
            function faDate(iso) {
                if (!iso) return '—';
                if (iso === todayISO) return 'امروز';
                var prev = new Date(Date.now() - 86400000).toISOString().split('T')[0];
                if (iso === prev) return 'دیروز';
                var parts = String(iso).split('T')[0].split('-');
                if (parts.length === 3) return fa(parts[2]) + '/' + fa(parts[1]) + '/' + fa(parts[0]);
                return String(iso);
            }
            if (recent.length > 0) {
                var recentRows = recent.map(function (s) {
                    var label = s.pose_name || s.notes || catFa[s.category] || 'تمرین یوگا';
                    var mins = fa(Math.max(1, Math.round((s.duration_seconds || 0) / 60)));
                    var icon = s.completed ? '✅' : '⏹';
                    return '<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-bottom:1px solid rgba(255,255,255,0.05);">' +
                        '<span>' + icon + '</span>' +
                        '<div style="flex:1;min-width:0;">' +
                            '<div style="color:#e8edf5;font-size:0.9rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + escapeHtml(label) + '</div>' +
                            '<div style="color:#777;font-size:0.75rem;margin-top:2px;">' + escapeHtml(catFa[s.category] || s.category) + ' · ' + faDate(s.practice_date) + '</div>' +
                        '</div>' +
                        '<span style="color:#c9a227;font-size:0.85rem;white-space:nowrap;">' + mins + ' دقیقه</span>' +
                    '</div>';
                }).join('');
                statsHtml += '<div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:14px 16px;margin-bottom:24px;">' +
                    '<div style="font-weight:700;color:#fff;margin-bottom:6px;">🧘 جلسات یوگای اخیر</div>' +
                    recentRows +
                '</div>';
            }
        }
    } catch (e) { /* stats are best-effort */ }

    if (statsHtml) content.innerHTML = statsHtml;

    try {
        var resp = await fetch('/api/v5/auth/charts', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        var data = await resp.json();

        if (data.charts && data.charts.length > 0) {
            var html = '<div style="display:grid;gap:15px;">';
            data.charts.forEach(function(c) {
                var titleDisplay = c.title || c.chart_type || 'بدون عنوان';
                var dateDisplay = c.created_at || '';
                var inputParsed = {};
                try { inputParsed = JSON.parse(c.input_data); } catch(e) {}
                var chartTypeLabel = {
                    'birth': '🔮 چارت تولد',
                    'synastry': '💕 سیناستری',
                    'composite': '🔗 کامپوزیت',
                    'transit': '🌍 ترانزیت',
                    'solar-return': '☀️ بازگشت خورشیدی',
                    'lunar-return': '🌙 بازگشت ماهانه'
                }[c.chart_type] || c.chart_type;

                html += '<div style="background:rgba(255,255,255,0.05);border-radius:16px;padding:20px;display:flex;align-items:center;gap:15px;flex-wrap:wrap;">';
                html += '<div style="flex:1;min-width:200px;">';
                html += '<div style="font-weight:700;color:#fff;font-size:1rem;">' + escapeHtml(chartTypeLabel) + '</div>';
                html += '<div style="color:#888;font-size:0.8rem;margin-top:4px;">' + escapeHtml(titleDisplay) + '</div>';
                html += '<div style="color:#666;font-size:0.75rem;margin-top:4px;">📅 ' + escapeHtml(dateDisplay) + '</div>';
                html += '</div>';
                html += '<div style="display:flex;gap:8px;">';
                html += '<button onclick="viewSavedChart(' + c.id + ')" style="background:#2a3560;color:#b0c4e0;border:none;padding:8px 16px;border-radius:8px;cursor:pointer;font-size:0.8rem;font-family:inherit;">👁️ مشاهده</button>';
                html += '<button onclick="deleteSavedChart(' + c.id + ')" style="background:#e74c3c;color:#fff;border:none;padding:8px 16px;border-radius:8px;cursor:pointer;font-size:0.8rem;font-family:inherit;">🗑️ حذف</button>';
                html += '</div>';
                html += '</div>';
            });
            html += '</div>';
            content.innerHTML = (content.innerHTML || '') + html;
        } else {
            content.innerHTML = (content.innerHTML || '') + '<div style="text-align:center;padding:40px;"><div style="font-size:3rem;margin-bottom:15px;">📭</div><p style="color:#888;">هنوز چارتی ذخیره نشده.</p><p style="color:#666;font-size:0.8rem;margin-top:5px;">با اشتراک طلایی می‌تونید چارت‌ها رو ذخیره کنید.</p><button onclick="navigate(\'app\')" style="background:#f39c12;color:#0b0e1a;border:none;padding:10px 30px;border-radius:50px;cursor:pointer;font-family:inherit;font-weight:700;margin-top:15px;">شروع محاسبه</button></div>';
        }
    } catch(e) {
        content.innerHTML = (content.innerHTML || '') + '<div style="text-align:center;color:#e74c3c;padding:40px;">⚠️ خطا: ' + escapeHtml(e.message) + '</div>';
    }
}

window.viewSavedChart = async function(chartId) {
    var token = localStorage.getItem('cosmic_token');
    if (!token) return;
    try {
        var resp = await fetch('/api/v5/auth/charts', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        var data = await resp.json();
        var chart = (data.charts || []).find(function(c) { return c.id === chartId; });
        if (chart) {
            navigate('app');
            setTimeout(function() {
                var resultDiv = document.getElementById('result');
                if (resultDiv) {
                    resultDiv.style.display = 'block';
                    try {
                        var result = JSON.parse(chart.result_data);
                        resultDiv.innerHTML = result.html || '<pre style="color:#ddd;white-space:pre-wrap;">' + JSON.stringify(result, null, 2) + '</pre>';
                    } catch(e) {
                        resultDiv.innerHTML = '<pre style="color:#ddd;white-space:pre-wrap;">' + escapeHtml(chart.result_data) + '</pre>';
                    }
                }
            }, 500);
        }
    } catch(e) { alert('خطا: ' + e.message); }
};

window.deleteSavedChart = async function(chartId) {
    if (!confirm('حذف این چارت؟')) return;
    var token = localStorage.getItem('cosmic_token');
    if (!token) return;
    try {
        await fetch('/api/v5/auth/charts/' + chartId, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        loadDashboardCharts();
        if (window.showToast) showToast('🗑️ چارت حذف شد', 'success');
    } catch(e) { alert('خطا: ' + e.message); }
};

// ─── Email verification / password reset pages ───
var authActionState = null; // { kind, token } — guards against double-fire of the route

function openAuthActionPage(kind, token) {
    // Remove any previously opened action modal so the route never stacks two overlays.
    var existing = document.getElementById('authActionModal');
    if (existing) existing.remove();
    authActionState = { kind: kind, token: token };

    var modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'authActionModal';
    modal.style.display = 'flex';

    if (kind === 'verify-email') {
        modal.innerHTML = `
            <div class="modal-box" style="max-width:400px;">
                <div class="modal-header"><h3>📧 تأیید ایمیل</h3></div>
                <div style="padding:24px;text-align:center;" id="authActionBody">
                    <div style="font-size:2rem;margin-bottom:10px;">⏳</div>
                    <p style="color:#b0c4e0;">در حال تأیید ایمیل شما...</p>
                </div>
            </div>`;
        document.body.appendChild(modal);
        window.verifyEmailToken(token).then(function () {
            var body = document.getElementById('authActionBody');
            if (!body) return;
            body.innerHTML = '<div style="font-size:2.5rem;margin-bottom:10px;">✅</div><p style="color:#2ecc71;font-weight:700;">ایمیل شما تأیید شد!</p>';
            if (window.showToast) showToast('✅ ایمیل شما تأیید شد', 'success');
            // Land the user on their dashboard.
            setTimeout(function () {
                var m = document.getElementById('authActionModal');
                if (m) m.remove();
                navigate('dashboard');
            }, 900);
        }).catch(function (e) {
            var body = document.getElementById('authActionBody');
            if (!body) return;
            body.innerHTML = '<div style="font-size:2.5rem;margin-bottom:10px;">❌</div><p style="color:#e74c3c;">' + (e.message || 'توکن نامعتبر یا منقضی شده') + '</p>' +
                '<button onclick="document.getElementById(\'authActionModal\').remove()" style="margin-top:15px;background:#f39c12;color:#0b0e1a;border:none;padding:10px 30px;border-radius:50px;cursor:pointer;font-family:inherit;font-weight:700;">بستن</button>';
        });
    } else if (kind === 'reset-password') {
        // Signed-in users land on the dashboard after a reset; signed-out users
        // are asked to log in again with their new password.
        var submitFn = localStorage.getItem('cosmic_token')
            ? 'window.submitPasswordResetAndGo(\'' + token + '\')'
            : 'window.submitPasswordReset(\'' + token + '\')';
        modal.innerHTML = `
            <div class="modal-box" style="max-width:400px;">
                <div class="modal-header"><h3>🔑 تعیین رمز عبور جدید</h3></div>
                <div style="padding:24px;">
                    <label style="display:block;margin-bottom:5px;font-size:0.85rem;color:#b0c4e0;">رمز عبور جدید (حداقل ۶ کاراکتر)</label>
                    <input type="password" id="resetNewPassword" style="width:100%;padding:10px;border-radius:8px;border:1px solid #2a3560;background:#0b0e1a;color:#fff;font-family:inherit;box-sizing:border-box;" placeholder="••••••">
                    <div id="authActionError" style="color:#e74c3c;margin-top:10px;text-align:center;font-size:0.85rem;"></div>
                    <button onclick="${submitFn}" style="width:100%;margin-top:15px;padding:12px;border-radius:8px;border:none;background:linear-gradient(135deg,#6c8cff,#9c79ff);color:#fff;font-size:1rem;font-weight:700;cursor:pointer;font-family:inherit;">ذخیره رمز جدید</button>
                </div>
            </div>`;
        document.body.appendChild(modal);
    }
}

window.submitPasswordReset = async function (token) {
    var password = document.getElementById('resetNewPassword').value;
    var errEl = document.getElementById('authActionError');
    if (!password || password.length < 6) { errEl.textContent = 'رمز باید حداقل ۶ کاراکتر باشد'; return; }
    try {
        var resp = await fetch('/api/v5/auth/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: token, new_password: password })
        });
        var data = await resp.json();
        if (resp.ok) {
            var modal = document.getElementById('authActionModal');
            if (modal) modal.remove();
            if (window.showToast) showToast('✅ رمز عبور تغییر کرد — اکنون وارد شوید', 'success');
            if (window.openLoginModal) openLoginModal();
        } else {
            errEl.textContent = data.detail || data.message || 'خطا';
        }
    } catch (e) { errEl.textContent = 'خطا در ارتباط با سرور'; }
};

// Handle a password-reset link clicked while already signed in: after the reset,
// land the user on their dashboard instead of forcing a re-login flow.
window.submitPasswordResetAndGo = async function (token) {
    var password = document.getElementById('resetNewPassword').value;
    var errEl = document.getElementById('authActionError');
    if (!password || password.length < 6) { errEl.textContent = 'رمز باید حداقل ۶ کاراکتر باشد'; return; }
    try {
        var resp = await fetch('/api/v5/auth/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: token, new_password: password })
        });
        var data = await resp.json();
        if (resp.ok) {
            var modal = document.getElementById('authActionModal');
            if (modal) modal.remove();
            if (window.showToast) showToast('✅ رمز عبور با موفقیت تغییر کرد', 'success');
            navigate('dashboard');
        } else {
            errEl.textContent = data.detail || data.message || 'خطا';
        }
    } catch (e) { errEl.textContent = 'خطا در ارتباط با سرور'; }
};

function handleAuthActionRoute(raw) {
    // raw like "verify-email?token=abc123"
    var m = raw.match(/^(verify-email|reset-password)\?token=([^&]+)/);
    if (!m) return false;
    var kind = m[1], token = decodeURIComponent(m[2]);
    // handleRoute can fire twice for the same hash (DOMContentLoaded + hashchange);
    // don't re-open the modal or re-send the token for an identical action.
    if (authActionState && authActionState.kind === kind && authActionState.token === token &&
        document.getElementById('authActionModal')) {
        showApp();
        return true;
    }
    openAuthActionPage(kind, token);
    showApp();
    return true;
}

// auth-panel.js is lazy-loaded after page load; retry until it's available
// so a cold-loaded #/pricing link still opens the pricing modal.
function openPricingWhenReady() {
    if (window.openPricingModal) { window.openPricingModal(); return; }
    var tries = 0;
    var timer = setInterval(function () {
        tries++;
        if (window.openPricingModal) {
            clearInterval(timer);
            window.openPricingModal();
        } else if (tries > 30) {
            clearInterval(timer);
        }
    }, 500);
}

// ─── Router ───
function handleRoute() {
    var r = getHashRoute();
    var route = r.route;

    if (handleAuthActionRoute(route)) return;

    if (route === '' || route === '/' || route === 'home') {
        showLanding();
    } else if (route === 'landing') {
        if (window.showPage) { showPage('landing'); } else { showLanding(); }
    } else if (route === 'app') {
        if (r.sub && window.openService) {
            // #/app/<tool> → open the tool through the native lazy-loader.
            openService(r.sub);
        } else {
            showApp();
        }
    } else if (route === 'dashboard') {
        showDashboard();
    } else if (route === 'pricing') {
        showApp();
        openPricingWhenReady();
    } else if (route === 'admin') {
        if (window.showPage) { showPage('admin'); }
        else { showApp(); if (window.openAdminPanel) window.openAdminPanel(); }
    } else if (route === 'yoga' || route === 'breath') {
        if (window.openService) { openService(route); } else { showApp(); }
    } else if (route === 'qol') {
        if (window.showPage) { showPage('qol'); } else { showApp(); }
    } else {
        showLanding();
    }
}

// Expose navigate globally
window.navigate = navigate;

// Listen for hash changes
window.addEventListener('hashchange', handleRoute);

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', function() {
    // If no hash, default to landing
    if (!window.location.hash || window.location.hash === '#/') {
        showLanding();
    } else {
        handleRoute();
    }
});

})();
