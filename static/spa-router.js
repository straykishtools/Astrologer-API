// ================================================================
//  SPA ROUTER + LANDING PAGE + DASHBOARD
//  مسیریابی هش‌دار + صفحه لندینگ + داشبورد کاربری
// ================================================================

(function() {
'use strict';

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
    window.location.hash = '#/' + route;
}

function showLanding() {
    var container = document.querySelector('.container');
    if (!container) return;

    // Hide form card and result
    var formCard = container.querySelector('.form-card');
    var result = container.querySelector('#result');
    var footer = container.querySelector('.footer-premium');
    if (formCard) formCard.style.display = 'none';
    if (result) result.style.display = 'none';
    if (footer) footer.style.display = 'none';

    // Remove existing landing
    var existing = document.getElementById('landingPage');
    if (existing) { existing.style.display = 'block'; return; }

    // Build landing
    var landing = document.createElement('div');
    landing.id = 'landingPage';
    landing.innerHTML = `
        <div style="text-align:center;padding:60px 20px 40px;">
            <div style="font-size:4rem;margin-bottom:20px;">🌌</div>
            <h1 style="font-size:2.5rem;font-weight:900;background:linear-gradient(135deg,#f39c12,#a29bfe);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:10px;">کیهان‌نگر</h1>
            <p style="font-size:1.2rem;color:#b0c4e0;margin-bottom:30px;">رصدخانه‌ی کیهانی · چارت تولد حرفه‌ای</p>
            <button onclick="navigate('app')" style="background:linear-gradient(135deg,#f39c12,#e67e22);color:#0b0e1a;border:none;padding:14px 40px;border-radius:50px;font-size:1.1rem;font-weight:700;cursor:pointer;font-family:inherit;box-shadow:0 4px 20px rgba(243,156,18,0.4);transition:transform 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                🚀 شروع رایگان
            </button>
        </div>

        <div style="max-width:800px;margin:0 auto;padding:0 20px;">
            <h2 style="text-align:center;font-size:1.4rem;color:#fff;margin-bottom:30px;">⭐ محبوب‌ترین ابزارها</h2>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:15px;margin-bottom:50px;">
                <div class="landing-tool-card" onclick="navigate('app')" style="background:rgba(255,255,255,0.05);border-radius:16px;padding:20px;text-align:center;cursor:pointer;border:1px solid transparent;transition:border-color 0.2s;" onmouseover="this.style.borderColor='#f39c12'" onmouseout="this.style.borderColor='transparent'">
                    <div style="font-size:2rem;margin-bottom:10px;">🔮</div>
                    <div style="font-weight:700;color:#fff;">چارت تولد</div>
                    <div style="font-size:0.8rem;color:#888;margin-top:5px;">چارت کامل و تحلیل</div>
                </div>
                <div class="landing-tool-card" onclick="navigate('app')" style="background:rgba(255,255,255,0.05);border-radius:16px;padding:20px;text-align:center;cursor:pointer;border:1px solid transparent;transition:border-color 0.2s;" onmouseover="this.style.borderColor='#e84393'" onmouseout="this.style.borderColor='transparent'">
                    <div style="font-size:2rem;margin-bottom:10px;">💕</div>
                    <div style="font-weight:700;color:#fff;">سیناستری</div>
                    <div style="font-size:0.8rem;color:#888;margin-top:5px;">سازگاری زوجین</div>
                </div>
                <div class="landing-tool-card" onclick="navigate('app')" style="background:rgba(255,255,255,0.05);border-radius:16px;padding:20px;text-align:center;cursor:pointer;border:1px solid transparent;transition:border-color 0.2s;" onmouseover="this.style.borderColor='#a29bfe'" onmouseout="this.style.borderColor='transparent'">
                    <div style="font-size:2rem;margin-bottom:10px;">🃏</div>
                    <div style="font-weight:700;color:#fff;">تاروت</div>
                    <div style="font-size:0.8rem;color:#888;margin-top:5px;">کشف آینده</div>
                </div>
                <div class="landing-tool-card" onclick="navigate('app')" style="background:rgba(255,255,255,0.05);border-radius:16px;padding:20px;text-align:center;cursor:pointer;border:1px solid transparent;transition:border-color 0.2s;" onmouseover="this.style.borderColor='#27ae60'" onmouseout="this.style.borderColor='transparent'">
                    <div style="font-size:2rem;margin-bottom:10px;">🍃</div>
                    <div style="font-weight:700;color:#fff;">فال حافظ</div>
                    <div style="font-size:0.8rem;color:#888;margin-top:5px;">غزل و تفأل</div>
                </div>
                <div class="landing-tool-card" onclick="navigate('app')" style="background:rgba(255,255,255,0.05);border-radius:16px;padding:20px;text-align:center;cursor:pointer;border:1px solid transparent;transition:border-color 0.2s;" onmouseover="this.style.borderColor='#0984e3'" onmouseout="this.style.borderColor='transparent'">
                    <div style="font-size:2rem;margin-bottom:10px;">🌌</div>
                    <div style="font-weight:700;color:#fff;">ناسا</div>
                    <div style="font-size:0.8rem;color:#888;margin-top:5px;">عکس روز و فضا</div>
                </div>
                <div class="landing-tool-card" onclick="navigate('app')" style="background:rgba(255,255,255,0.05);border-radius:16px;padding:20px;text-align:center;cursor:pointer;border:1px solid transparent;transition:border-color 0.2s;" onmouseover="this.style.borderColor='#e17055'" onmouseout="this.style.borderColor='transparent'">
                    <div style="font-size:2rem;margin-bottom:10px;">🔬</div>
                    <div style="font-weight:700;color:#fff;">بیوریتم</div>
                    <div style="font-size:0.8rem;color:#888;margin-top:5px;">نمودار زیستی</div>
                </div>
            </div>

            <h2 style="text-align:center;font-size:1.4rem;color:#fff;margin-bottom:30px;">✨ چرا کیهان‌نگر؟</h2>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:15px;margin-bottom:50px;">
                <div style="background:rgba(255,255,255,0.05);border-radius:16px;padding:20px;">
                    <div style="font-size:1.5rem;margin-bottom:10px;">🪐</div>
                    <div style="font-weight:700;color:#f39c12;margin-bottom:8px;">موتور ودیک حرفه‌ای</div>
                    <div style="font-size:0.85rem;color:#aaa;line-height:1.8;">محاسبات دقیق طبقات بر اساس موتور Kerykeion با پشتیبانی از تقویم ودیک</div>
                </div>
                <div style="background:rgba(255,255,255,0.05);border-radius:16px;padding:20px;">
                    <div style="font-size:1.5rem;margin-bottom:10px;">📊</div>
                    <div style="font-weight:700;color:#a29bfe;margin-bottom:8px;">۱۵+ ابزار تخصصی</div>
                    <div style="font-size:0.85rem;color:#aaa;line-height:1.8;">از چارت تولد تا سیناستری، کامپوزیت، ترانزیت، تاروت، فال حافظ و...</div>
                </div>
                <div style="background:rgba(255,255,255,0.05);border-radius:16px;padding:20px;">
                    <div style="font-size:1.5rem;margin-bottom:10px;">🆓</div>
                    <div style="font-weight:700;color:#27ae60;margin-bottom:8px;">رایگان شروع کنید</div>
                    <div style="font-size:0.85rem;color:#aaa;line-height:1.8;">چارت تولد کامل، تاروت و فال حافظ کاملاً رایگان — ارتقا برای ویژگی‌های پیشرفته</div>
                </div>
                <div style="background:rgba(255,255,255,0.05);border-radius:16px;padding:20px;">
                    <div style="font-size:1.5rem;margin-bottom:10px;">📈</div>
                    <div style="font-weight:700;color:#e84393;margin-bottom:8px;">تفسیر هوشمند</div>
                    <div style="font-size:0.85rem;color:#aaa;line-height:1.8;">تفسیر فارسی کامل برای هر چارت با امتیاز و سطوح سازگاری</div>
                </div>
            </div>

            <h2 style="text-align:center;font-size:1.4rem;color:#fff;margin-bottom:30px;">💬 نظرات کاربران</h2>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(350px,1fr));gap:15px;margin-bottom:50px;">
                <div style="background:rgba(255,255,255,0.05);border-radius:16px;padding:20px;">
                    <div style="color:#f39c12;margin-bottom:10px;">⭐⭐⭐⭐⭐</div>
                    <p style="color:#ddd;line-height:1.8;font-size:0.9rem;">"بهترین اپ طالع‌بینی فارسی که استفاده کردم. چارت تولد فوق‌العاده دقیقه!"</p>
                    <div style="color:#888;font-size:0.8rem;margin-top:10px;">— سارا م.</div>
                </div>
                <div style="background:rgba(255,255,255,0.05);border-radius:16px;padding:20px;">
                    <div style="color:#f39c12;margin-bottom:10px;">⭐⭐⭐⭐⭐</div>
                    <p style="color:#ddd;line-height:1.8;font-size:0.9rem;">"سیناستری عالی بود! تفسیر سازگاری ما دقیق و واقعی بود."</p>
                    <div style="color:#888;font-size:0.8rem;margin-top:10px;">— رضا ک.</div>
                </div>
                <div style="background:rgba(255,255,255,0.05);border-radius:16px;padding:20px;">
                    <div style="color:#f39c12;margin-bottom:10px;">⭐⭐⭐⭐⭐</div>
                    <p style="color:#ddd;line-height:1.8;font-size:0.9rem;">"فال حافظش عالیه، غزل‌ها دقیق انتخاب میشن. ممنون از تیم خوبتون."</p>
                    <div style="color:#888;font-size:0.8rem;margin-top:10px;">— نگار ا.</div>
                </div>
            </div>

            <div style="text-align:center;padding:40px 20px;">
                <button onclick="navigate('app')" style="background:linear-gradient(135deg,#f39c12,#e67e22);color:#0b0e1a;border:none;padding:14px 40px;border-radius:50px;font-size:1.1rem;font-weight:700;cursor:pointer;font-family:inherit;box-shadow:0 4px 20px rgba(243,156,18,0.4);transition:transform 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                    🚀 شروع رایگان
                </button>
                <p style="color:#888;font-size:0.8rem;margin-top:15px;">بدون نیاز به ثبت‌نام شروع کنید</p>
            </div>
        </div>
    `;
    container.insertBefore(landing, container.firstChild);
}

function showApp() {
    var landing = document.getElementById('landingPage');
    if (landing) landing.style.display = 'none';

    var formCard = document.querySelector('.form-card');
    var result = document.querySelector('#result');
    var footer = document.querySelector('.footer-premium');
    if (formCard) formCard.style.display = 'block';
    if (result) result.style.display = 'none';
    if (footer) footer.style.display = 'block';

    // Hide dashboard if visible
    var dash = document.getElementById('dashboardPage');
    if (dash) dash.style.display = 'none';
}

function showDashboard() {
    var container = document.querySelector('.container');
    if (!container) return;

    // Hide other views
    var landing = document.getElementById('landingPage');
    var formCard = container.querySelector('.form-card');
    var result = container.querySelector('#result');
    var footer = container.querySelector('.footer-premium');
    if (landing) landing.style.display = 'none';
    if (formCard) formCard.style.display = 'none';
    if (result) result.style.display = 'none';
    if (footer) footer.style.display = 'none';

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
                html += '<div style="font-weight:700;color:#fff;font-size:1rem;">' + chartTypeLabel + '</div>';
                html += '<div style="color:#888;font-size:0.8rem;margin-top:4px;">' + titleDisplay + '</div>';
                html += '<div style="color:#666;font-size:0.75rem;margin-top:4px;">📅 ' + dateDisplay + '</div>';
                html += '</div>';
                html += '<div style="display:flex;gap:8px;">';
                html += '<button onclick="viewSavedChart(' + c.id + ')" style="background:#2a3560;color:#b0c4e0;border:none;padding:8px 16px;border-radius:8px;cursor:pointer;font-size:0.8rem;font-family:inherit;">👁️ مشاهده</button>';
                html += '<button onclick="deleteSavedChart(' + c.id + ')" style="background:#e74c3c;color:#fff;border:none;padding:8px 16px;border-radius:8px;cursor:pointer;font-size:0.8rem;font-family:inherit;">🗑️ حذف</button>';
                html += '</div>';
                html += '</div>';
            });
            html += '</div>';
            content.innerHTML = html;
        } else {
            content.innerHTML = '<div style="text-align:center;padding:40px;"><div style="font-size:3rem;margin-bottom:15px;">📭</div><p style="color:#888;">هنوز چارتی ذخیره نشده.</p><p style="color:#666;font-size:0.8rem;margin-top:5px;">با اشتراک طلایی می‌تونید چارت‌ها رو ذخیره کنید.</p><button onclick="navigate(\'app\')" style="background:#f39c12;color:#0b0e1a;border:none;padding:10px 30px;border-radius:50px;cursor:pointer;font-family:inherit;font-weight:700;margin-top:15px;">شروع محاسبه</button></div>';
        }
    } catch(e) {
        content.innerHTML = '<div style="text-align:center;color:#e74c3c;padding:40px;">⚠️ خطا: ' + e.message + '</div>';
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
                        resultDiv.innerHTML = '<pre style="color:#ddd;white-space:pre-wrap;">' + chart.result_data + '</pre>';
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

// ─── Router ───
function handleRoute() {
    var r = getHashRoute();
    var route = r.route;

    if (route === '' || route === '/') {
        showLanding();
    } else if (route === 'app') {
        showApp();
        // If sub-route, switch to that tab
        if (r.sub) {
            var btn = document.querySelector('.tab-btn[data-tab="' + r.sub + '"]');
            if (btn) btn.click();
        }
    } else if (route === 'dashboard') {
        showDashboard();
    } else if (route === 'pricing') {
        showApp();
        if (window.openPricingModal) window.openPricingModal();
    } else if (route === 'admin') {
        showApp();
        if (window.openAdminPanel) window.openAdminPanel();
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
