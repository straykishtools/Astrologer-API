// ================================================================
//  ACCOUNT SETTINGS — Cosmic Oracle (صفحه‌ی تنظیمات حساب)
//  پروفایل، اشتراک و مصرف، تغییر رمز
// ================================================================
(function () {
    'use strict';

    var TOKEN_KEY = 'cosmic_token';
    var USER_KEY = 'cosmic_user';

    function getToken() { return localStorage.getItem(TOKEN_KEY) || ''; }
    function getUser() { try { return JSON.parse(localStorage.getItem(USER_KEY) || '{}'); } catch (e) { return {}; } }
    function saveSession(token, user) {
        if (token) localStorage.setItem(TOKEN_KEY, token);
        if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
    function clearSession() { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); }

    function authHeaders() {
        var t = getToken();
        return t ? { 'Authorization': 'Bearer ' + t, 'Content-Type': 'application/json' }
                 : { 'Content-Type': 'application/json' };
    }

    async function api(method, path, body) {
        var opts = { method: method, headers: authHeaders() };
        if (body !== undefined) opts.body = JSON.stringify(body);
        var resp = await fetch('/api/v5/auth' + path, opts);
        var data = null;
        try { data = await resp.json(); } catch (e) { data = {}; }
        if (resp.status === 401) { showGuard('نشست شما منقضی شده — دوباره وارد شوید'); throw new Error('unauthorized'); }
        if (!resp.ok) throw new Error(data.detail || data.message || ('خطا ' + resp.status));
        return data;
    }

    var toastTimer = null;
    function showToast(msg, type) {
        var t = document.getElementById('toast');
        t.textContent = msg;
        t.className = 'toast show ' + (type || '');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () { t.className = 'toast'; }, 2600);
    }

    function esc(s) {
        var d = document.createElement('div');
        d.appendChild(document.createTextNode(String(s == null ? '' : s)));
        return d.innerHTML;
    }
    // ─── گارد ───
    function showGuard(message) {
        clearSession();
        document.getElementById('pageScreen').classList.add('hidden');
        document.getElementById('guardScreen').style.display = 'flex';
        if (message) document.getElementById('guardError').textContent = message;
    }

    // ─── تأیید ایمیل ───
    function renderVerifyBanner() {
        var box = document.getElementById('verifyBanner');
        var u = getUser();
        if (u.email_verified) {
            box.className = 'verify-banner ok';
            box.textContent = '✓ ایمیل شما تأیید شده است';
        } else {
            box.className = 'verify-banner warn';
            box.innerHTML = '⚠️ ایمیل شما هنوز تأیید نشده است' +
                ' <button type="button" class="btn-link" onclick="resendVerification()">ارسال لینک تأیید</button>';
        }
    }

    window.resendVerification = async function () {
        var u = getUser();
        if (!u.email) { showToast('ایمیل در دسترس نیست', ''); return; }
        try {
            await api('POST', '/resend-verification', { email: u.email });
            showToast('📧 لینک تأیید ارسال شد — صندوق ایمیل را بررسی کنید', 'success');
        } catch (e) {
            if (e.message !== 'unauthorized') showToast('⚠️ ' + e.message, '');
        }
    };

    // توکن تأیید/بازیابی از لینک ایمیل (#/verify-email?token=... یا ?token=...)
    function urlToken() {
        var m = /[?&#]token=([^&#]+)/.exec(location.href);
        return m ? decodeURIComponent(m[1]) : '';
    }

    function showPage() {
        var u = getUser();
        document.getElementById('guardScreen').style.display = 'none';
        document.getElementById('pageScreen').classList.remove('hidden');
        document.getElementById('profName').value = u.display_name || '';
        document.getElementById('profEmail').value = u.email || '';
        renderVerifyBanner();
        loadPlan();
    }

    window.guardLogin = async function () {
        var errEl = document.getElementById('guardError');
        errEl.textContent = '';
        var email = document.getElementById('guardEmail').value.trim();
        var password = document.getElementById('guardPassword').value;
        if (!email || !password) { errEl.textContent = 'ایمیل و رمز عبور را وارد کنید'; return; }
        try {
            var data = await api('POST', '/login', { email: email, password: password });
            saveSession(data.access_token, data.user);
            showPage();
        } catch (e) {
            errEl.textContent = e.message === 'unauthorized' ? '' : (e.message || 'ورود ناموفق بود');
        }
    };

    window.doLogout = function () { clearSession(); location.href = '/'; };

    // ─── پروفایل ───
    window.saveProfile = async function () {
        var errEl = document.getElementById('profError');
        errEl.textContent = '';
        var display_name = document.getElementById('profName').value.trim();
        var email = document.getElementById('profEmail').value.trim();
        if (!email) { errEl.textContent = 'ایمیل الزامی است'; return; }
        try {
            var updated = await api('PUT', '/profile', { display_name: display_name, email: email });
            saveSession(null, updated);
            showToast('✅ پروفایل ذخیره شد', 'success');
            renderVerifyBanner();  // ایمیل جدید → وضعیت تأیید به‌روز می‌شود
        } catch (e) {
            if (e.message !== 'unauthorized') errEl.textContent = e.message;
        }
    };
    // ─── اشتراک و مصرف ───
    async function loadPlan() {
        var box = document.getElementById('planInfo');
        try {
            var data = await api('GET', '/plans/my-plan');
            if (!data.plan) { box.innerHTML = '<p class="muted">پلنی یافت نشد</p>'; return; }
            var p = data.plan, usage = data.daily_usage || {};
            var used = usage.used || 0, limit = usage.limit || p.daily_chart_limit || 1;
            var pct = Math.min(100, Math.round(used * 100 / limit));
            box.innerHTML =
                '<div style="margin-bottom:14px;"><span class="badge plan-' + esc(p.name) + '">' + esc(p.display_name) + '</span></div>' +
                '<div class="usage-bar"><div class="usage-fill" style="width:' + pct + '%"></div></div>' +
                '<div class="muted" style="margin-bottom:12px;">' + used + ' از ' + limit + ' چارت امروز</div>' +
                '<div class="kv"><span class="k">قیمت ماهانه</span><span>' + (p.price_monthly || 0).toLocaleString('fa-IR') + ' تومان</span></div>' +
                '<div class="kv"><span class="k">قیمت سالانه</span><span>' + (p.price_yearly || 0).toLocaleString('fa-IR') + ' تومان</span></div>' +
                '<div class="kv"><span class="k">ذخیره چارت</span><span>' + (p.can_save_charts ? '✓ دارد' : '✕ ندارد') + '</span></div>' +
                '<div class="kv"><span class="k">دسترسی پرمیوم</span><span>' + (p.can_access_premium ? '✓ دارد' : '✕ ندارد') + '</span></div>' +
                '<div class="kv"><span class="k">عضویت از</span><span class="mono">' + esc((getUser().created_at || '').slice(0, 10) || '—') + '</span></div>';
        } catch (e) {
            if (e.message !== 'unauthorized') box.innerHTML = '<p class="muted">⚠️ ' + esc(e.message) + '</p>';
        }
    }

    // ─── تغییر رمز ───
    window.changePassword = async function () {
        var errEl = document.getElementById('pwError');
        var okEl = document.getElementById('pwOk');
        errEl.textContent = ''; okEl.textContent = '';
        var cur = document.getElementById('pwCurrent').value;
        var next = document.getElementById('pwNew').value;
        var confirmPw = document.getElementById('pwConfirm').value;
        if (!cur || !next) { errEl.textContent = 'رمز فعلی و رمز جدید را وارد کنید'; return; }
        if (next.length < 6) { errEl.textContent = 'رمز جدید باید حداقل ۶ کاراکتر باشد'; return; }
        if (next !== confirmPw) { errEl.textContent = 'رمز جدید و تکرار آن یکسان نیست'; return; }
        try {
            await api('PUT', '/change-password', { current_password: cur, new_password: next });
            okEl.textContent = '✅ رمز عبور با موفقیت تغییر کرد';
            showToast('رمز عبور تغییر کرد 🔒', 'success');
            document.getElementById('pwCurrent').value = '';
            document.getElementById('pwNew').value = '';
            document.getElementById('pwConfirm').value = '';
        } catch (e) {
            if (e.message !== 'unauthorized') errEl.textContent = e.message;
        }
    };

    // ─── راه‌اندازی ───
    (function boot() {
        var token = urlToken();
        if (token) {
            // رسیدن از لینک تأیید ایمیل — اول توکن را اعتبارسنجی کن
            // (همان منطق مشترک spa-router: verify + همگام‌سازی کاربر از /me)
            window.verifyEmailToken(token).then(function () {
                showToast('✅ ایمیل شما تأیید شد', 'success');
                setTimeout(function () {
                    location.href = '/#/dashboard';
                }, 1200);
            }).catch(function (e) {
                if (e.message !== 'unauthorized') {
                    showToast('⚠️ ' + (e.message || 'لینک تأیید نامعتبر یا منقضی شده است'), '');
                }
                // ادامه به حالت عادی
                if (getToken()) {
                    api('GET', '/me').then(function (me) { saveSession(null, me); showPage(); })
                                      .catch(function () { });
                } else {
                    showGuard('');
                }
            });
            return;
        }
        if (getToken()) {
            // اطلاعات ممکن است قدیمی باشد — با /me تازه کن
            api('GET', '/me').then(function (me) { saveSession(null, me); showPage(); })
                              .catch(function () { /* showGuard داخل api صدا زده شد */ });
        } else {
            showGuard('');
        }
        document.getElementById('guardPassword').addEventListener('keydown', function (e) {
            if (e.key === 'Enter') guardLogin();
        });
    })();
})();