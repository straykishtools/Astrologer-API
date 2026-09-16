// ================================================================
//  AUTH & USER MANAGEMENT (Cosmic Oracle)
//  پنل مدیریت ادمین + صفحه قیمت‌گذاری داینامیک
// ================================================================

(function() {
'use strict';

// ─── توابع کمکی احراز هویت ───

function getToken() {
    return localStorage.getItem('cosmic_token') || '';
}

function setToken(token) {
    localStorage.setItem('cosmic_token', token);
}

function clearToken() {
    localStorage.removeItem('cosmic_token');
    localStorage.removeItem('cosmic_user');
}

function getUser() {
    try { return JSON.parse(localStorage.getItem('cosmic_user') || '{}'); }
    catch(e) { return {}; }
}

function setUser(user) {
    localStorage.setItem('cosmic_user', JSON.stringify(user));
}

function isLoggedIn() {
    return !!getToken();
}

function isAdmin() {
    var u = getUser();
    return u && u.is_admin;
}

function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

function authHeaders() {
    var t = getToken();
    return t ? { 'Authorization': 'Bearer ' + t, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

// ─── Guest Session: server-side identity + quota ───

var GUEST_LIMIT = 5; // default, overridden by server response

function getGuestFingerprint() {
    var fp = localStorage.getItem('cosmic_guest_fp');
    if (!fp) {
        // Generate a persistent random fingerprint unique to this browser
        fp = 'guest_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
        localStorage.setItem('cosmic_guest_fp', fp);
    }
    return fp;
}

function getGuestUsage() {
    try { return JSON.parse(localStorage.getItem('cosmic_guest_usage') || '{}'); }
    catch(e) { return {}; }
}

function setGuestUsage(data) {
    localStorage.setItem('cosmic_guest_usage', JSON.stringify(data));
}

async function initGuestSession() {
    if (isLoggedIn()) return; // Don't init guest for logged-in users
    try {
        var fp = getGuestFingerprint();
        var resp = await fetch('/api/v5/auth/guest-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fingerprint: fp })
        });
        var data = await resp.json();
        if (resp.ok) {
            GUEST_LIMIT = data.daily_chart_limit || 5;
            setGuestUsage({
                used: data.daily_charts_used || 0,
                limit: data.daily_chart_limit || 5,
                remaining: data.remaining || 0,
            });
            updateGuestUI();
        }
    } catch(e) {
        // Offline — use local-only estimation
        var local = getGuestUsage();
        if (!local.used && local.used !== 0) {
            setGuestUsage({ used: 0, limit: GUEST_LIMIT, remaining: GUEST_LIMIT });
        }
    }
}

function updateGuestUI() {
    if (isLoggedIn()) return;
    var usage = getGuestUsage();
    var profilePlanBadge = document.getElementById('profilePlanBadge');
    var popupRole = document.getElementById('popupRole');
    if (profilePlanBadge) {
        profilePlanBadge.textContent = '🆓';
        profilePlanBadge.classList.add('visible');
    }
    if (popupRole) {
        popupRole.textContent = 'مهمان · ' + (usage.remaining || 0) + '/' + (usage.limit || GUEST_LIMIT) + ' باقی‌مانده';
    }
}

async function claimGuestSession() {
    if (!isLoggedIn()) return;
    try {
        var fp = localStorage.getItem('cosmic_guest_fp');
        if (!fp) return;
        await apiCall('POST', '/guest/claim', { fingerprint: fp });
    } catch(e) {
        // Non-critical — ignore
    }
}

// Refresh guest quota display from server (after chart generation)
async function refreshGuestUsage() {
    if (isLoggedIn()) return;
    try {
        var fp = getGuestFingerprint();
        var resp = await fetch('/api/v5/auth/guest/check-limit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fingerprint: fp })
        });
        var data = await resp.json();
        if (resp.ok) {
            setGuestUsage({
                used: data.used || 0,
                limit: data.limit || GUEST_LIMIT,
                remaining: data.remaining || 0,
            });
            updateGuestUI();
        }
    } catch(e) {
        // ignore — offline
    }
}

// Expose for script.js (chart requests send the header + refresh after)
window.getGuestFingerprint = getGuestFingerprint;
window.refreshGuestUsage = refreshGuestUsage;
window.isGuestLoggedOut = function() { return !isLoggedIn(); };

// Guest quota label for the sidebar poller (so it doesn't clobber the display)
window.getGuestUsageLabel = function() {
    if (isLoggedIn()) return '';
    var usage = getGuestUsage();
    if (!usage || typeof usage.remaining !== 'number') return '';
    return 'مهمان · ' + usage.remaining + '/' + (usage.limit || GUEST_LIMIT) + ' باقی‌مانده';
};

// ─── به‌روزرسانی نمایش هدر ───

// ================================================================
//  UNVERIFIED-EMAIL BANNER — حلقه‌ی تأیید ایمیل را برای کاربر مرئی می‌کند
//  نشان فقط وقتی نمایش داده می‌شود که کاربر وارد شده و email_verified او
//  false باشد. منبع داده: کاربر ذخیره‌شده (که توسط /auth/me تازه می‌شود —
//  هم در verifyEmailToken و هم بعد از هر ورود). دکمه‌ی آن لینک تأیید را
//  دوباره می‌فرستد (resend-verification).
// ================================================================

function ensureVerifyBanner() {
    var host = document.getElementById('pageHome') || document.body;
    if (!host) return null;
    var bar = document.getElementById('verifyEmailBanner');
    if (!bar) {
        bar = document.createElement('div');
        bar.id = 'verifyEmailBanner';
        bar.style.cssText = 'display:none;align-items:center;justify-content:center;gap:12px;'
            + 'padding:10px 16px;border-radius:12px;margin:10px auto;max-width:900px;font-size:0.9rem;'
            + 'background:rgba(243,156,18,0.12);border:1px solid rgba(243,156,18,0.35);color:#f5c66b;';
        host.insertBefore(bar, host.firstChild);
    }
    return bar;
}

// Hook for other scripts (email-verification.js) to re-render the banner
// after the user object changes outside the auth panel's own flows.
window.updateVerifyBannerNow = updateVerifyBanner;

function updateVerifyBanner() {
    var u = getUser();
    var show = isLoggedIn() && u.email && u.email_verified === false;
    var bar = ensureVerifyBanner();
    if (bar) {
        if (show) {
            bar.innerHTML = '⚠️ ایمیل شما هنوز تأیید نشده است'
                + ' <a href="javascript:void(0)" onclick="resendVerificationFromBanner()"'
                + ' style="color:#f39c12;font-weight:700;text-decoration:none;">ارسال دوباره‌ی لینک تأیید</a>';
            bar.style.display = 'flex';
        } else {
            bar.style.display = 'none';
        }
    }
    updateVerifyDashCard(show, u);
    // پلن‌های منوی پروفایل از پلن‌های ادمین (تب اشتراک‌ها) ساخته می‌شوند و
    // پس از هر تغییر وضعیت ورود/پلن، هم‌گام می‌مانند.
    if (window.AdminPanel && window.AdminPanel.renderTppPlans) window.AdminPanel.renderTppPlans();
}

// ─── کارت پایدار تأیید ایمیل داخل داشبورد ───
// نوار زرد فقط بالای صفحه است و در اسکرول/جابه‌جایی صفحه گم می‌شود؛ این کارت
// همیشه بالای داشبورد کاربر می‌ماند تا حلقه‌ی تأیید از دست نرود. همان منبع
// داده (updateVerifyBanner) هر دو سطح را مدیریت می‌کند.

function _escapeHtml(s) {
    return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function ensureVerifyDashCard() {
    var host = document.getElementById('pageDashboard');
    if (!host) return null;
    var wrap = host.querySelector('.dashboard-page') || host;
    var card = document.getElementById('verifyEmailDashCard');
    if (!card) {
        card = document.createElement('div');
        card.id = 'verifyEmailDashCard';
        card.style.cssText = 'display:none;padding:16px 20px;border-radius:14px;margin:14px auto;max-width:900px;'
            + 'background:rgba(243,156,18,0.10);border:1px solid rgba(243,156,18,0.35);'
            + 'box-shadow:0 4px 18px rgba(0,0,0,0.15);';
        wrap.insertBefore(card, wrap.firstChild);
    }
    return card;
}

function updateVerifyDashCard(show, u) {
    var card = ensureVerifyDashCard();
    if (!card) return;
    if (show) {
        card.innerHTML = '<div style="display:flex;align-items:flex-start;gap:12px;">'
            + '<div style="font-size:1.6rem;line-height:1;">📧</div>'
            + '<div style="flex:1;">'
            + '<div style="font-weight:700;color:#f5c66b;margin-bottom:6px;">ایمیل شما تأیید نشده است</div>'
            + '<div style="font-size:0.88rem;color:#ccc;line-height:1.7;">'
            + 'ایمیل <b dir="ltr">' + _escapeHtml(u.email) + '</b> هنوز تأیید نشده. با تأیید ایمیل، '
            + 'بازیابی رمز عبور و اطلاع‌رسانی‌های حساب شما فعال می‌ماند.'
            + '</div>'
            + '<button onclick="resendVerificationFromBanner()" '
            + 'style="margin-top:10px;padding:9px 18px;border-radius:9px;border:none;cursor:pointer;'
            + 'font-family:inherit;font-size:0.88rem;font-weight:700;color:#1a1a1a;'
            + 'background:linear-gradient(135deg,#f5c66b,#f39c12);">'
            + 'ارسال دوباره‌ی لینک تأیید</button>'
            + '</div></div>';
        card.style.display = 'block';
    } else {
        card.style.display = 'none';
    }
}

window.resendVerificationFromBanner = async function () {
    var u = getUser();
    if (!u.email) return;
    try {
        await apiCall('POST', '/resend-verification', { email: u.email });
        if (window.showToast) showToast('📧 لینک تأیید ارسال شد — صندوق ایمیل را بررسی کنید', 'success');
    } catch (e) {
        if (window.showToast) showToast('⚠️ ' + (e.message || 'خطا در ارسال'), '');
    }
};

function updateAuthUI() {
    var payBtn = document.getElementById('payBtn');
    if (!payBtn) return;

    // Panel elements
    var profileAvatar = document.getElementById('profileAvatar');
    var profileLabel = document.getElementById('profileLabel');
    var profilePlanBadge = document.getElementById('profilePlanBadge');
    var tppAvatar = document.getElementById('tppAvatar');
    var tppName = document.getElementById('tppName');
    var tppEmail = document.getElementById('tppEmail');
    var tppPlanBadge = document.getElementById('tppPlanBadge');
    var tppMainAction = document.getElementById('tppMainAction');
    var tppLogoutBtn = document.getElementById('tppLogoutBtn');

    if (isLoggedIn()) {
        var u = getUser();
        var planKey = u.plan || 'free';
        var planMap = {
            free:    { label: '🆓 رایگان',   color: '#888',   bg: 'rgba(136,136,136,0.15)', icon: '🆓', emoji: '👤' },
            gold:    { label: '⭐ طلایی',    color: '#f39c12', bg: 'rgba(243,156,18,0.15)',  icon: '⭐', emoji: '⭐' },
            diamond: { label: '💎 الماسی',  color: '#9b59b6', bg: 'rgba(155,89,182,0.15)',  icon: '💎', emoji: '💎' }
        };
        var plan = planMap[planKey] || { label: '✨ ' + planKey, color: '#74b9ff', bg: 'rgba(116,185,255,0.15)', icon: '✨', emoji: '✨' };
        var displayName = u.display_name || u.email || 'حساب';
        var initials = displayName.charAt(0).toUpperCase();

        // Trigger button
        if (profileAvatar) profileAvatar.textContent = plan.emoji;
        if (profileLabel) profileLabel.textContent = displayName;
        if (profilePlanBadge) {
            profilePlanBadge.textContent = plan.icon;
            profilePlanBadge.classList.add('visible');
        }

        // Panel header
        if (tppAvatar) tppAvatar.textContent = initials;
        if (tppName) tppName.textContent = displayName;
        if (tppEmail) tppEmail.textContent = u.email || '';
        if (tppPlanBadge) {
            tppPlanBadge.textContent = plan.label;
            tppPlanBadge.style.background = plan.bg;
            tppPlanBadge.style.color = plan.color;
        }
        // Mark current plan card
        document.querySelectorAll('.tpp-plan-card').forEach(function(card) {
            card.classList.remove('tpp-plan-current');
            var planName = card.getAttribute('data-plan');
            if (planName === planKey) card.classList.add('tpp-plan-current');
        });

        // Show/hide the unverified-email banner (needs the user object)
        updateVerifyBanner();
        // Main action button
        if (tppMainAction) {
            if (planKey === 'free') {
                tppMainAction.textContent = '⬆️ ارتقا به طلایی';
                tppMainAction.onclick = function() { openPricingModal(); };
            } else {
                tppMainAction.textContent = '📊 مدیریت اشتراک';
                tppMainAction.onclick = function() { openPricingModal(); };
            }
        }
        // Logout button
        if (tppLogoutBtn) {
            tppLogoutBtn.style.display = 'block';
            tppLogoutBtn.onclick = function() {
                var panel = document.getElementById('profilePanel');
                if (panel) panel.classList.remove('open');
                doLogout();
            };
        }

        // Admin button
        if (isAdmin()) {
            var adminBtn = document.getElementById('adminBtn');
            if (!adminBtn) {
                adminBtn = document.createElement('button');
                adminBtn.id = 'adminBtn';
                adminBtn.className = 'btn-action';
                adminBtn.style.cssText = 'background:#e74c3c;color:#fff;font-weight:700;';
                adminBtn.innerHTML = '🔧 مدیریت';
                adminBtn.onclick = openAdminPanel;
                payBtn.parentNode.insertBefore(adminBtn, payBtn.nextSibling);
            }
        }
    } else {
        // Guest state
        if (profileAvatar) profileAvatar.textContent = '🔑';
        if (profileLabel) { profileLabel.textContent = ''; profileLabel.style.display = 'none'; }
        if (profilePlanBadge) {
            profilePlanBadge.textContent = '🆓';
            profilePlanBadge.classList.add('visible');
        }
        if (tppAvatar) tppAvatar.textContent = '👤';
        if (tppName) tppName.textContent = 'مهمان';
        if (tppEmail) tppEmail.textContent = 'برای دسترسی کامل وارد شوید';
        if (tppPlanBadge) { tppPlanBadge.textContent = '🆓 رایگان'; tppPlanBadge.style.background = 'rgba(136,136,136,0.15)'; tppPlanBadge.style.color = '#888'; }
        if (tppMainAction) {
            tppMainAction.textContent = '🔑 ورود / ثبت‌نام';
            tppMainAction.onclick = function() { openLoginModal(); };
        }
        if (tppLogoutBtn) tppLogoutBtn.style.display = 'none';
        var ab = document.getElementById('adminBtn');
        if (ab) ab.remove();
        // Show guest quota
        updateGuestUI();
    }

    // The banner is driven by the logged-in branch; hide it for guests.
    var banner = document.getElementById('verifyEmailBanner');
    if (banner && !isLoggedIn()) banner.style.display = 'none';
}

// ================================================================
//  API CALLS
// ================================================================

async function apiCall(method, path, body) {
    var opts = { method: method, headers: authHeaders() };
    if (body) opts.body = JSON.stringify(body);
    var resp = await fetch('/api/v5/auth' + path, opts);
    var data = await resp.json();
    if (!resp.ok) throw new Error(data.detail || data.message || 'خطا');
    return data;
}

// ================================================================
//  AUTH MODAL — single-state manager
//  State: 'login' | 'signup' | 'forgot' | 'account' | null
// ================================================================

var _authState = null;

function closeAllModals() {
    ['authModal', 'accountModal', 'pricingModal'].forEach(function(id) {
        var m = document.getElementById(id);
        if (m) m.remove();
    });
}

function openAuthModal(view) {
    closeAllModals();
    _authState = view || 'login';

    // Account modal is a separate flow
    if (_authState === 'account') {
        _openAccountModal();
        return;
    }

    var modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'authModal';
    modal.style.display = 'flex';
    modal.innerHTML = '<div class="modal-box" style="max-width:420px;">'
        + '<div class="modal-header">'
        + '<h3 id="authModalTitle">🔑 ورود</h3>'
        + '<button class="modal-close" onclick="closeAuthModal()">✕</button>'
        + '</div>'
        + '<div style="padding:20px;">'
        + '<div id="authFormArea"></div>'
        + '</div>'
        + '</div>';
    document.body.appendChild(modal);

    // Close on overlay click
    modal.addEventListener('click', function(e) {
        if (e.target === modal) closeAuthModal();
    });

    _renderAuthForm(_authState);
}

function closeAuthModal() {
    _authState = null;
    ['authModal', 'accountModal'].forEach(function(id) {
        var m = document.getElementById(id);
        if (m) m.remove();
    });
}

function _renderAuthForm(view) {
    var area = document.getElementById('authFormArea');
    var title = document.getElementById('authModalTitle');
    if (!area) return;

    if (view === 'login') {
        if (title) title.textContent = '🔑 ورود';
        area.innerHTML = `
            <div style="margin-bottom:12px;">
                <label style="display:block;margin-bottom:5px;font-size:0.85rem;color:#b0c4e0;">ایمیل</label>
                <input type="email" id="loginEmail" placeholder="example@email.com" style="width:100%;padding:10px;border-radius:8px;border:1px solid #2a3560;background:#0b0e1a;color:#fff;font-family:inherit;box-sizing:border-box;">
            </div>
            <div style="margin-bottom:20px;">
                <label style="display:block;margin-bottom:5px;font-size:0.85rem;color:#b0c4e0;">رمز عبور</label>
                <input type="password" id="loginPassword" placeholder="••••••" style="width:100%;padding:10px;border-radius:8px;border:1px solid #2a3560;background:#0b0e1a;color:#fff;font-family:inherit;box-sizing:border-box;">
            </div>
            <button onclick="doLogin()" style="width:100%;padding:12px;border-radius:8px;border:none;background:linear-gradient(135deg,#6c8cff,#9c79ff);color:#fff;font-size:1rem;font-weight:700;cursor:pointer;font-family:inherit;">ورود</button>
            <div id="authError" style="color:#e74c3c;margin-top:10px;text-align:center;font-size:0.85rem;"></div>
            <div style="margin-top:16px;text-align:center;font-size:0.85rem;color:#b0c4e0;">
                <a href="javascript:void(0)" onclick="openAuthModal('forgot')" style="color:#f39c12;text-decoration:none;">رمز عبور را فراموش کرده‌اید؟</a>
            </div>
            <div style="margin-top:12px;text-align:center;font-size:0.85rem;color:#888;">
                حساب ندارید؟ <a href="javascript:void(0)" onclick="openAuthModal('signup')" style="color:#f39c12;text-decoration:none;">ثبت‌نام کنید</a>
            </div>`;
        // Focus email
        setTimeout(function() { var el = document.getElementById('loginEmail'); if (el) el.focus(); }, 100);

    } else if (view === 'signup') {
        if (title) title.textContent = '📝 ثبت‌نام';
        area.innerHTML = `
            <div style="margin-bottom:12px;">
                <label style="display:block;margin-bottom:5px;font-size:0.85rem;color:#b0c4e0;">نام نمایشی</label>
                <input type="text" id="regName" placeholder="نام شما" style="width:100%;padding:10px;border-radius:8px;border:1px solid #2a3560;background:#0b0e1a;color:#fff;font-family:inherit;box-sizing:border-box;">
            </div>
            <div style="margin-bottom:12px;">
                <label style="display:block;margin-bottom:5px;font-size:0.85rem;color:#b0c4e0;">ایمیل</label>
                <input type="email" id="regEmail" placeholder="example@email.com" style="width:100%;padding:10px;border-radius:8px;border:1px solid #2a3560;background:#0b0e1a;color:#fff;font-family:inherit;box-sizing:border-box;">
            </div>
            <div style="margin-bottom:20px;">
                <label style="display:block;margin-bottom:5px;font-size:0.85rem;color:#b0c4e0;">رمز عبور (حداقل ۶ کاراکتر)</label>
                <input type="password" id="regPassword" placeholder="••••••" style="width:100%;padding:10px;border-radius:8px;border:1px solid #2a3560;background:#0b0e1a;color:#fff;font-family:inherit;box-sizing:border-box;">
            </div>
            <button onclick="doRegister()" style="width:100%;padding:12px;border-radius:8px;border:none;background:linear-gradient(135deg,#6c8cff,#9c79ff);color:#fff;font-size:1rem;font-weight:700;cursor:pointer;font-family:inherit;">ثبت‌نام</button>
            <div id="authError" style="color:#e74c3c;margin-top:10px;text-align:center;font-size:0.85rem;"></div>
            <div style="margin-top:12px;text-align:center;font-size:0.85rem;color:#888;">
                قبلاً ثبت‌نام کرده‌اید؟ <a href="javascript:void(0)" onclick="openAuthModal('login')" style="color:#f39c12;text-decoration:none;">ورود کنید</a>
            </div>`;
        setTimeout(function() { var el = document.getElementById('regName'); if (el) el.focus(); }, 100);

    } else if (view === 'forgot') {
        if (title) title.textContent = '🔑 بازیابی رمز عبور';
        area.innerHTML = `
            <p style="color:#b0c4e0;font-size:0.85rem;margin-bottom:16px;text-align:center;">ایمیل خود را وارد کنید تا لینک بازیابی رمز عبور برایتان ارسال شود.</p>
            <div style="margin-bottom:20px;">
                <label style="display:block;margin-bottom:5px;font-size:0.85rem;color:#b0c4e0;">ایمیل</label>
                <input type="email" id="forgotEmail" placeholder="example@email.com" style="width:100%;padding:10px;border-radius:8px;border:1px solid #2a3560;background:#0b0e1a;color:#fff;font-family:inherit;box-sizing:border-box;">
            </div>
            <button onclick="doForgotPassword()" style="width:100%;padding:12px;border-radius:8px;border:none;background:linear-gradient(135deg,#6c8cff,#9c79ff);color:#fff;font-size:1rem;font-weight:700;cursor:pointer;font-family:inherit;">ارسال لینک بازیابی</button>
            <div id="authError" style="color:#e74c3c;margin-top:10px;text-align:center;font-size:0.85rem;"></div>
            <div id="authSuccess" style="color:#2ecc71;margin-top:10px;text-align:center;font-size:0.85rem;"></div>
            <div style="margin-top:12px;text-align:center;font-size:0.85rem;color:#888;">
                <a href="javascript:void(0)" onclick="openAuthModal('login')" style="color:#f39c12;text-decoration:none;">← بازگشت به ورود</a>
            </div>`;
        setTimeout(function() { var el = document.getElementById('forgotEmail'); if (el) el.focus(); }, 100);
    }
}

window.closeAuthModal = closeAuthModal;
window.openAuthModal = openAuthModal;

// ─── Login ───
window.doLogin = async function() {
    var email = document.getElementById('loginEmail').value.trim();
    var password = document.getElementById('loginPassword').value;
    var errEl = document.getElementById('authError');
    if (!email || !password) { errEl.textContent = 'ایمیل و رمز را وارد کنید'; return; }
    try {
        var data = await apiCall('POST', '/login', { email: email, password: password });
        setToken(data.access_token);
        setUser(data.user);
        updateAuthUI();
        closeAuthModal();
        // Claim any guest session usage
        claimGuestSession();
        if (window.showToast) showToast('✅ ورود موفقیت‌آمیز بود', 'success');
        // بازگشت به همان‌جایی که کاربر بود — هوک‌های ثبت‌شده قبل از لاگین
        runAfterLoginHooks();
        // تلنگر ملایم برای کاربر تأییدنشده — نوار زرد تأیید اکنون بالای صفحه است؛
        // با تأخیر کوتاه نشان داده می‌شود تا پیام موفقیت ورود قاب خوانا بماند.
        if (data.user && data.user.email_verified === false) {
            setTimeout(function() {
                if (window.showToast) showToast('⚠️ ایمیل شما تأیید نشده — برای ارسال دوباره‌ی لینک، نوار زرد بالای صفحه را ببینید', 'info');
            }, 800);
        }
    } catch(e) {
        errEl.textContent = e.message;
    }
};

// ─── Post-login hooks: return the user to what they were doing ───
// Usage: window.onAfterLogin(function(){ ... }) — registered while logged out,
// fired (and cleared) once after a successful login.
var _afterLoginHooks = [];
window.onAfterLogin = function (fn) {
    if (typeof fn === 'function') _afterLoginHooks.push(fn);
};
function runAfterLoginHooks() {
    var hooks = _afterLoginHooks.splice(0, _afterLoginHooks.length);
    hooks.forEach(function (fn) {
        try { fn(); } catch (e) { try { console.warn('afterLogin hook failed', e); } catch (_) {} }
    });
    // رویداد عمومی «ورود انجام شد» — script.js prefillِ پروفایل و محاسبهٔ
    // خودکار چارت تولد را با همین دوباره تلاش می‌کند
    try { window.dispatchEvent(new Event('cosmic:auth')); } catch (_) {}
}

// ─── Register ───
window.doRegister = async function() {
    var name = document.getElementById('regName').value.trim();
    var email = document.getElementById('regEmail').value.trim();
    var password = document.getElementById('regPassword').value;
    var errEl = document.getElementById('authError');
    if (!email || !password) { errEl.textContent = 'ایمیل و رمز را وارد کنید'; return; }
    if (password.length < 6) { errEl.textContent = 'رمز باید حداقل ۶ کاراکتر باشد'; return; }
    try {
        var data = await apiCall('POST', '/register', { email: email, password: password, display_name: name });
        setToken(data.access_token);
        setUser(data.user);
        updateAuthUI();
        closeAuthModal();
        runAfterLoginHooks();
        // Claim any guest session usage
        claimGuestSession();
        if (window.showToast) showToast('✅ ثبت‌نام موفقیت‌آمیز بود', 'success');
        // تلنگر تأیید ایمیل بلافاصله پس از ثبت‌نام (کاربر تازه‌ساخت همیشه تأییدنشده است)
        setTimeout(function() {
            if (window.showToast) showToast('📧 لینک تأیید به ایمیل شما ارسال شد — نوار زرد بالای صفحه را ببینید', 'info');
        }, 800);
    } catch(e) {
        errEl.textContent = e.message;
    }
};

// ─── Forgot Password ───
window.doForgotPassword = async function() {
    var email = document.getElementById('forgotEmail').value.trim();
    var errEl = document.getElementById('authError');
    var okEl = document.getElementById('authSuccess');
    if (!email) { errEl.textContent = 'ایمیل خود را وارد کنید'; return; }
    try {
        await apiCall('POST', '/forgot-password', { email: email });
        errEl.textContent = '';
        okEl.textContent = '✅ لینک بازیابی رمز عبور به ایمیل شما ارسال شد.';
    } catch(e) {
        // Show success even if endpoint doesn't exist yet (to avoid info leak)
        errEl.textContent = '';
        okEl.textContent = '✅ اگر ایمیل معتبری وارد کرده باشید، لینک بازیابی ارسال شد.';
    }
};

// ─── Legacy aliases for sidebar/other code ───
window.openLoginModal = function() { openAuthModal('login'); };
window.openSignupModal = function() { openAuthModal('signup'); };
window.openForgotModal = function() { openAuthModal('forgot'); };

// ================================================================
//  ACCOUNT MODAL (profile + logout)
// ================================================================

function _openAccountModal() {
    var u = getUser();
    var planKey = u.plan || 'free';
    var planMap = { free: '🆓 رایگان', gold: '⭐ طلایی', diamond: '💎 الماسی' };
    var planLabel = planMap[planKey] || '✨ ' + planKey;
    var planColor = planKey === 'free' ? '#aaa' : planKey === 'gold' ? '#f39c12' : '#9b59b6';
    var planBg = planKey === 'free' ? '#3a3a3a' : planKey === 'gold' ? 'rgba(243,156,18,0.2)' : 'rgba(155,89,182,0.2)';

    var modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'accountModal';
    modal.style.display = 'flex';
    modal.innerHTML = '<div class="modal-box" style="max-width:400px;">'
        + '<div class="modal-header">'
        + '<h3>👤 حساب کاربری</h3>'
        + '<button class="modal-close" onclick="closeAuthModal()">✕</button>'
        + '</div>'
        + '<div style="padding:20px;text-align:center;">'
        + '<div style="font-size:2rem;margin-bottom:10px;">👤</div>'
        + '<div style="font-size:1.2rem;font-weight:700;margin-bottom:5px;">' + (u.display_name || u.email || '') + '</div>'
        + '<div style="color:#888;font-size:0.85rem;margin-bottom:15px;">' + (u.email || '') + '</div>'
        + '<div style="display:inline-block;padding:5px 15px;border-radius:20px;font-size:0.85rem;font-weight:700;margin-bottom:20px;background:' + planBg + ';color:' + planColor + ';">' + planLabel + '</div>'
        + '<div style="display:flex;gap:10px;">'
        + '<button onclick="closeAuthModal();openPricingModal();" style="flex:1;padding:10px;border-radius:8px;border:none;background:linear-gradient(135deg,#6c8cff,#9c79ff);color:#fff;font-weight:700;cursor:pointer;font-family:inherit;font-size:0.9rem;">⬆️ ارتقا اشتراک</button>'
        + '<button onclick="doLogout()" style="flex:1;padding:10px;border-radius:8px;border:1px solid #e74c3c;background:transparent;color:#e74c3c;font-weight:700;cursor:pointer;font-family:inherit;font-size:0.9rem;">🚪 خروج</button>'
        + '</div>'
        + '</div>'
        + '</div>';
    document.body.appendChild(modal);
    modal.addEventListener('click', function(e) { if (e.target === modal) closeAuthModal(); });
}

window.openAccountModal = function() { openAuthModal('account'); };
window._openAccountModal = _openAccountModal;

window.doLogout = function() {
    clearToken();
    setUser({});
    updateAuthUI();
    closeAllModals();
    var panel = document.getElementById('profilePanel');
    if (panel) panel.classList.remove('open');
    // Re-init guest session after logout
    initGuestSession();
    if (window.showToast) showToast('👋 خارج شدید', 'info');
};

window.openPricingModal = openPricingModal;
window.openPricingPage = function() {
    var m = document.getElementById('accountModal');
    if (m) m.remove();
    openPricingModal();
};

// ================================================================
//  PRICING PAGE / MODAL — داینامیک از API
// ================================================================

function openPricingModal() {
    var modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'pricingModal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-box" style="max-width:900px;">
            <div class="modal-header">
                <h3>💎 اشتراک‌ها و پلن‌ها</h3>
                <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
            </div>
            <div style="padding:20px;">
                <div id="pricingContent" style="text-align:center;color:#888;padding:40px;">
                    <div style="font-size:2rem;">⏳</div>
                    <div>در حال بارگذاری پلن‌ها...</div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    loadPricingPlans();
}

async function loadPricingPlans() {
    var content = document.getElementById('pricingContent');
    if (!content) return;
    try {
        var data = await apiCall('GET', '/plans');
        var plans = data.plans || [];
        if (plans.length === 0) {
            content.innerHTML = '<div style="color:#888;">هیچ پلنی یافت نشد.</div>';
            return;
        }

        var u = getUser();
        var currentPlan = u.plan || 'free';
        var html = '<div style="display:flex;flex-wrap:wrap;gap:15px;justify-content:center;">';

        plans.forEach(function(p) {
            var isCurrent = p.name === currentPlan;
            var isFree = p.price_monthly === 0;
            var color = isFree ? '#3a3a3a' : (p.name === 'gold' ? '#f39c12' : (p.name === 'diamond' ? '#9b59b6' : '#2a9d8f'));
            var featuresList = (p.features || '').split('،').filter(function(f) { return f.trim(); }).map(function(f) {
                return '<li style="margin-bottom:6px;text-align:right;">✅ ' + f.trim() + '</li>';
            }).join('');

            html += `
                <div style="flex:1;min-width:250px;max-width:280px;background:rgba(255,255,255,0.05);border-radius:16px;padding:24px;border:2px solid ${isCurrent ? color : 'transparent'};position:relative;${isCurrent ? 'box-shadow:0 0 20px ' + color + '40;' : ''}">
                    ${isCurrent ? '<div style="position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:' + color + ';color:#000;padding:3px 14px;border-radius:12px;font-size:0.75rem;font-weight:700;">پلن فعلی</div>' : ''}
                    <div style="text-align:center;margin-bottom:15px;">
                        <div style="font-size:2rem;margin-bottom:8px;">${isFree ? '🆓' : (p.name === 'gold' ? '⭐' : (p.name === 'diamond' ? '💎' : '✨'))}</div>
                        <div style="font-size:1.3rem;font-weight:700;color:${color};">${p.display_name}</div>
                    </div>
                    <div style="text-align:center;margin-bottom:15px;">
                        ${isFree ? '<span style="font-size:2rem;font-weight:900;color:#fff;">رایگان</span>' : '<span style="font-size:2rem;font-weight:900;color:#fff;">' + p.price_monthly.toLocaleString('fa-IR') + '</span><span style="color:#888;font-size:0.8rem;"> تومان / ماه</span>'}
                        ${p.price_yearly > 0 ? '<div style="color:#888;font-size:0.8rem;margin-top:4px;">یا ' + p.price_yearly.toLocaleString('fa-IR') + ' تومان / سال</div>' : ''}
                    </div>
                    <ul style="list-style:none;padding:0;margin:0 0 20px 0;font-size:0.85rem;color:#ddd;line-height:1.8;">
                        ${featuresList}
                        <li style="margin-bottom:6px;text-align:right;">📊 ${p.daily_chart_limit >= 9999 ? 'نامحدود' : p.daily_chart_limit.toLocaleString('fa-IR')} چارت در روز</li>
                        <li style="margin-bottom:6px;text-align:right;">${p.can_save_charts ? '✅' : '❌'} ذخیره چارت</li>
                        <li style="margin-bottom:6px;text-align:right;">${p.can_access_premium ? '✅' : '❌'} دسترسی ویژه</li>
                    </ul>
                    <button onclick="${isCurrent ? "''" : "selectPlan('" + escapeHtml(p.name) + "')"}"
                        ${isCurrent ? 'disabled' : ''}
                        style="width:100%;padding:10px;border-radius:8px;border:none;cursor:${isCurrent ? 'default' : 'pointer'};font-family:inherit;font-weight:700;font-size:0.9rem;
                        background:${isCurrent ? '#2a3560' : color};color:${isCurrent ? '#888' : '#000'};">
                        ${isCurrent ? '✅ پلن فعلی شما' : (isFree ? 'شروع رایگان' : '⬆️ ارتقا')}
                    </button>
                </div>
            `;
        });
        html += '</div>';
        content.innerHTML = html;
    } catch(e) {
        // Fallback to admin-edited plans from localStorage
        try {
            var localPlans = JSON.parse(localStorage.getItem('cosmic_admin_plans') || '[]');
            if (localPlans.length > 0) {
                var u2 = getUser();
                var cur2 = u2.plan || 'free';
                var h = '<div style="display:flex;flex-wrap:wrap;gap:15px;justify-content:center;">';
                localPlans.forEach(function(lp) {
                    var isCur2 = lp.name === cur2;
                    h += '<div style="flex:1;min-width:220px;max-width:260px;background:rgba(255,255,255,0.05);border-radius:16px;padding:20px;border:2px solid ' + (isCur2 ? (lp.color || '#74b9ff') : 'transparent') + ';position:relative;">';
                    h += '<div style="text-align:center;margin-bottom:12px;"><div style="display:inline-block;padding:4px 12px;border-radius:8px;font-size:12px;font-weight:700;background:' + (lp.color || '#74b9ff') + '22;color:' + (lp.color || '#74b9ff') + '">' + (lp.label || lp.name) + '</div></div>';
                    h += '<div style="text-align:center;margin-bottom:12px;font-size:1.6rem;font-weight:900;color:#fff;">' + (lp.price || '۰') + '</div>';
                    if (lp.limit) h += '<div style="text-align:center;color:#888;font-size:0.8rem;margin-bottom:10px;">' + lp.limit + '</div>';
                    h += '<ul style="list-style:none;padding:0;margin:0 0 16px 0;font-size:0.85rem;color:#ddd;line-height:1.8;">';
                    (lp.features || []).forEach(function(f) { h += '<li>✅ ' + f + '</li>'; });
                    h += '</ul>';
                    h += '<button onclick="selectPlan(\'' + lp.name + '\')" ' + (isCur2 ? 'disabled' : '') + ' style="width:100%;padding:10px;border-radius:8px;border:none;cursor:' + (isCur2 ? 'default' : 'pointer') + ';font-family:inherit;font-weight:700;font-size:0.9rem;background:' + (isCur2 ? '#2a3560' : (lp.color || '#74b9ff')) + ';color:' + (isCur2 ? '#888' : '#000') + ';">' + (isCur2 ? '✅ پلن فعلی' : '⬆️ انتخاب') + '</button>';
                    h += '</div>';
                });
                h += '</div>';
                content.innerHTML = h;
                return;
            }
        } catch (_) {}
        content.innerHTML = '<div style="color:#e74c3c;text-align:center;">⚠️ خطا در بارگذاری پلن‌ها: ' + e.message + '</div>';
    }
}

window.selectPlan = function(planName) {
    if (!isLoggedIn()) {
        if (window.showToast) showToast('لطفاً ابتدا وارد شوید', 'warning');
        openLoginModal();
        return;
    }
    if (window.showToast) showToast('درگاه پرداخت به‌زودی فعال می‌شود — پلن انتخابی: ' + planName, 'info');
    else alert('درگاه پرداخت به‌زودی فعال می‌شود — پلن انتخابی: ' + planName);
};

// ================================================================
//  ADMIN PANEL — مدیریت پلن‌ها و کاربران
// ================================================================

function openAdminPanel() {
    if (!isAdmin()) {
        if (window.showToast) showToast('دسترسی مخصوص ادمین', 'error');
        return;
    }
    var modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'adminPanelModal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-box" style="max-width:1100px;width:95%;">
            <div class="modal-header">
                <h3>🔧 پنل مدیریت</h3>
                <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
            </div>
            <div style="padding:20px;">
                <div style="display:flex;gap:8px;margin-bottom:20px;">
                    <button class="admin-tab active" onclick="switchAdminTab('plans')" id="adminTabPlans" style="flex:1;padding:10px;border-radius:8px;border:none;cursor:pointer;font-family:inherit;background:#f39c12;color:#0b0e1a;font-weight:700;">📋 پلن‌ها</button>
                    <button class="admin-tab" onclick="switchAdminTab('users')" id="adminTabUsers" style="flex:1;padding:10px;border-radius:8px;border:none;cursor:pointer;font-family:inherit;background:#1e2740;color:#b0c4e0;">👥 کاربران</button>
                </div>
                <div id="adminContent"></div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    loadAdminPlans();
}

window.switchAdminTab = function(tab) {
    var plansTab = document.getElementById('adminTabPlans');
    var usersTab = document.getElementById('adminTabUsers');
    if (tab === 'plans') {
        plansTab.style.background = '#f39c12'; plansTab.style.color = '#0b0e1a'; plansTab.style.fontWeight = '700';
        usersTab.style.background = '#1e2740'; usersTab.style.color = '#b0c4e0'; usersTab.style.fontWeight = '400';
        loadAdminPlans();
    } else {
        usersTab.style.background = '#f39c12'; usersTab.style.color = '#0b0e1a'; usersTab.style.fontWeight = '700';
        plansTab.style.background = '#1e2740'; plansTab.style.color = '#b0c4e0'; plansTab.style.fontWeight = '400';
        loadAdminUsers();
    }
};

// ─── ADMIN: PLANS MANAGEMENT ───

async function loadAdminPlans() {
    var content = document.getElementById('adminContent');
    if (!content) return;
    content.innerHTML = '<div style="text-align:center;color:#888;padding:40px;">⏳ در حال بارگذاری...</div>';
    try {
        var data = await apiCall('GET', '/admin/plans');
        var plans = data.plans || [];
        var html = `
            <button onclick="openPlanForm()" class="btn-action primary" style="margin-bottom:15px;padding:8px 20px;font-size:0.85rem;">➕ ساخت پلن جدید</button>
            <div style="overflow-x:auto;">
                <table style="width:100%;border-collapse:collapse;font-size:0.85rem;color:#ddd;">
                    <thead>
                        <tr style="border-bottom:2px solid #2a3560;">
                            <th style="padding:10px;text-align:right;">نام</th>
                            <th style="padding:10px;text-align:right;">نام نمایشی</th>
                            <th style="padding:10px;text-align:right;">قیمت/ماه</th>
                            <th style="padding:10px;text-align:right;">قیمت/سال</th>
                            <th style="padding:10px;text-align:right;">محدودیت روزانه</th>
                            <th style="padding:10px;text-align:right;">ذخیره چارت</th>
                            <th style="padding:10px;text-align:right;">پرمیوم</th>
                            <th style="padding:10px;text-align:right;">فعال</th>
                            <th style="padding:10px;text-align:center;">عملیات</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        plans.forEach(function(p) {
            html += `
                <tr style="border-bottom:1px solid #1e2740;" data-plan-id="${p.id}">
                    <td style="padding:10px;font-weight:700;">${p.name}</td>
                    <td style="padding:10px;">${p.display_name}</td>
                    <td style="padding:10px;">${(p.price_monthly || 0).toLocaleString('fa-IR')}</td>
                    <td style="padding:10px;">${(p.price_yearly || 0).toLocaleString('fa-IR')}</td>
                    <td style="padding:10px;">${p.daily_chart_limit >= 9999 ? 'نامحدود' : p.daily_chart_limit}</td>
                    <td style="padding:10px;text-align:center;">${p.can_save_charts ? '✅' : '❌'}</td>
                    <td style="padding:10px;text-align:center;">${p.can_access_premium ? '✅' : '❌'}</td>
                    <td style="padding:10px;text-align:center;">${p.is_active ? '✅' : '❌'}</td>
                    <td style="padding:10px;text-align:center;">
                        <button onclick="openPlanForm(${p.id})" style="background:#2a3560;border:none;color:#b0c4e0;padding:5px 10px;border-radius:5px;cursor:pointer;font-size:0.75rem;margin:2px;">✏️ ویرایش</button>
                        <button onclick="deletePlan(${p.id}, '${escapeHtml(p.name)}')" style="background:#e74c3c;border:none;color:#fff;padding:5px 10px;border-radius:5px;cursor:pointer;font-size:0.75rem;margin:2px;">🗑️ حذف</button>
                    </td>
                </tr>
            `;
        });
        html += '</tbody></table></div>';
        content.innerHTML = html;
    } catch(e) {
        content.innerHTML = '<div style="color:#e74c3c;">⚠️ ' + e.message + '</div>';
    }
}

window.openPlanForm = function(planId) {
    var isEdit = !!planId;
    var existing = null;
    if (isEdit) {
        var row = document.querySelector('tr[data-plan-id="' + planId + '"]');
        if (row) {
            var cells = row.querySelectorAll('td');
            existing = {
                name: cells[0].textContent.trim(),
                display_name: cells[1].textContent.trim(),
                price_monthly: cells[2].textContent.replace(/[^0-9]/g, ''),
                price_yearly: cells[3].textContent.replace(/[^0-9]/g, ''),
                daily_chart_limit: cells[4].textContent.trim() === 'نامحدود' ? '9999' : cells[4].textContent.trim(),
            };
        }
    }

    var modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'planFormModal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-box" style="max-width:500px;">
            <div class="modal-header">
                <h3>${isEdit ? '✏️ ویرایش پلن' : '➕ پلن جدید'}</h3>
                <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
            </div>
            <div style="padding:20px;">
                <div style="margin-bottom:12px;">
                    <label style="display:block;margin-bottom:5px;font-size:0.85rem;color:#b0c4e0;">نام انگلیسی (یکتا)</label>
                    <input type="text" id="planName" value="${existing ? escapeHtml(existing.name) : ''}" ${isEdit ? 'readonly' : ''} placeholder="free, gold, vip..." style="width:100%;padding:10px;border-radius:8px;border:1px solid #2a3560;background:#0b0e1a;color:#fff;font-family:inherit;box-sizing:border-box;${isEdit ? 'opacity:0.6;' : ''}">
                </div>
                <div style="margin-bottom:12px;">
                    <label style="display:block;margin-bottom:5px;font-size:0.85rem;color:#b0c4e0;">نام نمایشی (فارسی)</label>
                    <input type="text" id="planDisplayName" value="${existing ? existing.display_name : ''}" placeholder="رایگان، طلایی..." style="width:100%;padding:10px;border-radius:8px;border:1px solid #2a3560;background:#0b0e1a;color:#fff;font-family:inherit;box-sizing:border-box;">
                </div>
                <div style="display:flex;gap:10px;margin-bottom:12px;">
                    <div style="flex:1;">
                        <label style="display:block;margin-bottom:5px;font-size:0.85rem;color:#b0c4e0;">قیمت ماهانه (تومان)</label>
                        <input type="number" id="planPriceMonthly" value="${existing ? existing.price_monthly : '0'}" min="0" style="width:100%;padding:10px;border-radius:8px;border:1px solid #2a3560;background:#0b0e1a;color:#fff;font-family:inherit;box-sizing:border-box;">
                    </div>
                    <div style="flex:1;">
                        <label style="display:block;margin-bottom:5px;font-size:0.85rem;color:#b0c4e0;">قیمت سالانه (تومان)</label>
                        <input type="number" id="planPriceYearly" value="${existing ? existing.price_yearly : '0'}" min="0" style="width:100%;padding:10px;border-radius:8px;border:1px solid #2a3560;background:#0b0e1a;color:#fff;font-family:inherit;box-sizing:border-box;">
                    </div>
                </div>
                <div style="display:flex;gap:10px;margin-bottom:12px;">
                    <div style="flex:1;">
                        <label style="display:block;margin-bottom:5px;font-size:0.85rem;color:#b0c4e0;">محدودیت روزانه چارت</label>
                        <input type="number" id="planDailyLimit" value="${existing ? existing.daily_chart_limit : '10'}" min="1" style="width:100%;padding:10px;border-radius:8px;border:1px solid #2a3560;background:#0b0e1a;color:#fff;font-family:inherit;box-sizing:border-box;">
                    </div>
                    <div style="flex:1;">
                        <label style="display:block;margin-bottom:5px;font-size:0.85rem;color:#b0c4e0;">ترتیب نمایش</label>
                        <input type="number" id="planSortOrder" value="0" min="0" style="width:100%;padding:10px;border-radius:8px;border:1px solid #2a3560;background:#0b0e1a;color:#fff;font-family:inherit;box-sizing:border-box;">
                    </div>
                </div>
                <div style="margin-bottom:12px;">
                    <label style="display:block;margin-bottom:5px;font-size:0.85rem;color:#b0c4e0;">مسیرهای ویژه (با کاما جدا کنید)</label>
                    <input type="text" id="planPremiumPaths" placeholder="composite,solar-return,lunar-return" style="width:100%;padding:10px;border-radius:8px;border:1px solid #2a3560;background:#0b0e1a;color:#fff;font-family:inherit;box-sizing:border-box;">
                </div>
                <div style="margin-bottom:12px;">
                    <label style="display:block;margin-bottom:5px;font-size:0.85rem;color:#b0c4e0;">ویژگی‌ها (با کاما جدا کنید)</label>
                    <textarea id="planFeatures" rows="3" placeholder="چارت تولد، سیناستری، تاروت..." style="width:100%;padding:10px;border-radius:8px;border:1px solid #2a3560;background:#0b0e1a;color:#fff;font-family:inherit;box-sizing:border-box;resize:vertical;"></textarea>
                </div>
                <div style="display:flex;gap:15px;margin-bottom:20px;">
                    <label style="display:flex;align-items:center;gap:5px;font-size:0.85rem;color:#b0c4e0;cursor:pointer;"><input type="checkbox" id="planCanSave" ${isEdit ? '' : ''}> ذخیره چارت</label>
                    <label style="display:flex;align-items:center;gap:5px;font-size:0.85rem;color:#b0c4e0;cursor:pointer;"><input type="checkbox" id="planCanPremium" ${isEdit ? '' : ''}> دسترسی پرمیوم</label>
                    <label style="display:flex;align-items:center;gap:5px;font-size:0.85rem;color:#b0c4e0;cursor:pointer;"><input type="checkbox" id="planIsActive" checked> فعال</label>
                </div>
                <button onclick="savePlan(${planId || 'null'})" class="btn-primary" style="width:100%;padding:12px;">💾 ذخیره</button>
                <div id="planFormError" style="color:#e74c3c;margin-top:10px;text-align:center;font-size:0.85rem;"></div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // اگر ویرایش، مقادیر فعلی رو از API بگیر
    if (isEdit) {
        apiCall('GET', '/admin/plans').then(function(data) {
            var plan = (data.plans || []).find(function(p) { return p.id === planId; });
            if (plan) {
                document.getElementById('planDisplayName').value = plan.display_name || '';
                document.getElementById('planPriceMonthly').value = plan.price_monthly || 0;
                document.getElementById('planPriceYearly').value = plan.price_yearly || 0;
                document.getElementById('planDailyLimit').value = plan.daily_chart_limit || 10;
                document.getElementById('planSortOrder').value = plan.sort_order || 0;
                document.getElementById('planPremiumPaths').value = plan.premium_paths || '';
                document.getElementById('planFeatures').value = plan.features || '';
                document.getElementById('planCanSave').checked = !!plan.can_save_charts;
                document.getElementById('planCanPremium').checked = !!plan.can_access_premium;
                document.getElementById('planIsActive').checked = !!plan.is_active;
            }
        });
    }
};

window.savePlan = async function(planId) {
    var data = {
        display_name: document.getElementById('planDisplayName').value.trim(),
        price_monthly: parseInt(document.getElementById('planPriceMonthly').value) || 0,
        price_yearly: parseInt(document.getElementById('planPriceYearly').value) || 0,
        daily_chart_limit: parseInt(document.getElementById('planDailyLimit').value) || 10,
        sort_order: parseInt(document.getElementById('planSortOrder').value) || 0,
        premium_paths: document.getElementById('planPremiumPaths').value.trim(),
        features: document.getElementById('planFeatures').value.trim(),
        can_save_charts: document.getElementById('planCanSave').checked,
        can_access_premium: document.getElementById('planCanPremium').checked,
        is_active: document.getElementById('planIsActive').checked,
    };
    var errEl = document.getElementById('planFormError');
    try {
        if (planId) {
            await apiCall('PUT', '/admin/plans/' + planId, data);
            if (window.showToast) showToast('✅ پلن ویرایش شد', 'success');
        } else {
            data.name = document.getElementById('planName').value.trim();
            if (!data.name) { errEl.textContent = 'نام پلن لازم است'; return; }
            await apiCall('POST', '/admin/plans', data);
            if (window.showToast) showToast('✅ پلن ساخته شد', 'success');
        }
        document.getElementById('planFormModal').remove();
        loadAdminPlans();
    } catch(e) {
        errEl.textContent = e.message;
    }
};

window.deletePlan = async function(planId, planName) {
    if (!confirm('حذف پلن "' + planName + '"؟ این عمل قابل بازگشت نیست.')) return;
    try {
        await apiCall('DELETE', '/admin/plans/' + planId);
        if (window.showToast) showToast('🗑️ پلن حذف شد', 'success');
        loadAdminPlans();
    } catch(e) {
        if (window.showToast) showToast(e.message, 'error');
        else alert(e.message);
    }
};

// ─── ADMIN: USERS MANAGEMENT ───

async function loadAdminUsers() {
    var content = document.getElementById('adminContent');
    if (!content) return;
    content.innerHTML = '<div style="text-align:center;color:#888;padding:40px;">⏳ در حال بارگذاری...</div>';
    try {
        var data = await apiCall('GET', '/admin/users?limit=200');
        var users = data.users || [];
        var plansData = await apiCall('GET', '/admin/plans');
        var allPlans = (plansData.plans || []).map(function(p) { return p.name; });

        // Fetch aggregated usage stats
        var stats = {};
        try { stats = await apiCall('GET', '/admin/usage-stats'); } catch (_) {}
        var statsPlans = stats.plans || [];
        var totalUsers = stats.total_users || users.length;
        var totalUsed = stats.total_used || 0;
        var activeToday = stats.active_today || 0;

        var html = '';

        // ─── Summary cards ───
        html += '<div class="admin-usage-cards">';
        html += '<div class="admin-usage-card"><div class="admin-usage-card-icon">👥</div><div class="admin-usage-card-value">' + totalUsers + '</div><div class="admin-usage-card-label">کل کاربران</div></div>';
        html += '<div class="admin-usage-card"><div class="admin-usage-card-icon">📊</div><div class="admin-usage-card-value">' + totalUsed + '</div><div class="admin-usage-card-label">مصرف کل امروز</div></div>';
        html += '<div class="admin-usage-card"><div class="admin-usage-card-icon">⚡</div><div class="admin-usage-card-value">' + activeToday + '</div><div class="admin-usage-card-label">فعال امروز</div></div>';
        html += '</div>';

        // ─── Bar chart: usage per plan ───
        if (statsPlans.length > 0) {
            var maxUsed = Math.max.apply(null, statsPlans.map(function(p) { return p.total_used || 0; }));
            var planColors = { free: '#e74c3c', gold: '#f39c12', diamond: '#9b59b6', pro: '#2a9d8f' };
            html += '<div class="admin-chart-wrap">';
            html += '<div class="admin-chart-title">📊 مصرف بر اساس پلن</div>';
            html += '<div class="admin-chart-bars">';
            statsPlans.forEach(function(p) {
                var c = planColors[p.plan_key] || '#74b9ff';
                var pctBar = maxUsed > 0 ? Math.round((p.total_used / maxUsed) * 100) : 0;
                html += '<div class="admin-chart-row">';
                html += '<div class="admin-chart-label"><span style="color:' + c + ';font-weight:700;">' + p.plan_label + '</span> <span style="color:#666;">(' + p.user_count + ')</span></div>';
                html += '<div class="admin-chart-track"><div class="admin-chart-fill" style="width:' + pctBar + '%;background:' + c + ';"></div></div>';
                html += '<div class="admin-chart-val" style="color:' + c + ';">' + (p.total_used || 0) + '</div>';
                html += '</div>';
            });
            html += '</div></div>';
        }

        html += `
            <button onclick="openCreateUserForm()" class="btn-action primary" style="margin-bottom:15px;padding:8px 20px;font-size:0.85rem;">➕ ساخت کاربر جدید</button>
            <div style="overflow-x:auto;">
                <table style="width:100%;border-collapse:collapse;font-size:0.85rem;color:#ddd;">
                    <thead>
                        <tr style="border-bottom:2px solid #2a3560;">
                            <th style="padding:10px;text-align:right;">ID</th>
                            <th style="padding:10px;text-align:right;">نام</th>
                            <th style="padding:10px;text-align:right;">ایمیل</th>
                            <th style="padding:10px;text-align:right;">پلن</th>
                            <th style="padding:10px;text-align:right;">ادمین</th>
                            <th style="padding:10px;text-align:right;">مصرف / محدودیت</th>
                            <th style="padding:10px;text-align:right;">تاریخ ثبت</th>
                            <th style="padding:10px;text-align:center;">عملیات</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        users.forEach(function(u) {
            var options = allPlans.map(function(pn) {
                return '<option value="' + pn + '"' + (pn === u.plan ? ' selected' : '') + '>' + pn + '</option>';
            }).join('');
            var used = u.daily_charts_used || 0;
            var limit = u.daily_chart_limit || 10;
            var pct = limit >= 9999 ? 0 : Math.min(100, Math.round((used / limit) * 100));
            var barColor = pct >= 90 ? 'red' : pct >= 70 ? 'orange' : 'green';
            var limitLabel = limit >= 9999 ? '∞' : limit;
            html += `
                <tr style="border-bottom:1px solid #1e2740;">
                    <td style="padding:10px;">${u.id}</td>
                    <td style="padding:10px;">${u.display_name || '—'}</td>
                    <td style="padding:10px;">${u.email}</td>
                    <td style="padding:10px;font-weight:700;color:${u.plan === 'free' ? '#e74c3c' : u.plan === 'gold' ? '#f39c12' : '#9b59b6'};">${u.plan}</td>
                    <td style="padding:10px;text-align:center;"><button onclick="toggleUserAdmin(${u.id}, ${u.is_admin ? 1 : 0})" style="background:${u.is_admin ? '#f39c12' : '#2a3560'};border:none;color:${u.is_admin ? '#0b0e1a' : '#b0c4e0'};padding:4px 10px;border-radius:5px;cursor:pointer;font-size:0.75rem;font-family:inherit;font-weight:${u.is_admin ? '700' : '400'};">${u.is_admin ? '⭐ ادمین' : '—'}</button></td>
                    <td style="padding:10px;min-width:140px;">
                        <div class="usage-text-row">
                            <span class="usage-val usage-val-${barColor}">${used}</span>
                            <span class="usage-sep">/</span>
                            <span class="usage-limit">${limitLabel}</span>
                            ${limit < 9999 ? '<span class="usage-pct">(' + pct + '%)</span>' : ''}
                        </div>
                        ${limit < 9999 ? '<div class="usage-bar"><div class="usage-bar-fill usage-bar-${barColor}" style="width:' + pct + '%;"></div></div>' : ''}
                    </td>
                    <td style="padding:10px;font-size:0.75rem;">${u.created_at || ''}</td>
                    <td style="padding:10px;text-align:center;white-space:nowrap;">
                        <select onchange="changeUserPlan(${u.id}, this.value)" style="background:#0b0e1a;color:#fff;border:1px solid #2a3560;padding:4px;border-radius:5px;font-family:inherit;font-size:0.75rem;margin-bottom:4px;display:block;width:100%;">
                            ${options}
                        </select>
                        <button onclick="resetUserUsage(${u.id})" class="usage-reset-btn" title="ریست مصرف روزانه">🔄 ریست</button>
                    </td>
                </tr>
            `;
        });
        html += '</tbody></table></div>';
        content.innerHTML = html;
    } catch(e) {
        content.innerHTML = '<div style="color:#e74c3c;">⚠️ ' + e.message + '</div>';
    }
}

window.changeUserPlan = async function(userId, planName) {
    try {
        await apiCall('PUT', '/admin/users/' + userId + '/plan', { plan: planName });
        if (window.showToast) showToast('✅ پلن کاربر تغییر کرد', 'success');
    } catch(e) {
        if (window.showToast) showToast(e.message, 'error');
        loadAdminUsers();
    }
}
window.toggleUserAdmin = async function(userId, currentStatus) {
    var newStatus = currentStatus ? 'غیرادمین' : 'ادمین';
    if (!confirm('تغییر وضعیت ادمین کاربر به ' + newStatus + '?')) return;
    try {
        await apiCall('PUT', '/admin/users/' + userId + '/admin');
        if (window.showToast) showToast('✅ وضعیت ادمین تغییر کرد', 'success');
        loadAdminUsers();
    } catch(e) {
        if (window.showToast) showToast(e.message, 'error');
    }
};

window.resetUserUsage = async function(userId) {
    if (!confirm('ریست مصرف روزانه این کاربر؟')) return;
    try {
        await apiCall('PUT', '/admin/users/' + userId + '/reset-usage');
        if (window.showToast) showToast('✅ مصرف روزانه ریست شد', 'success');
        loadAdminUsers();
    } catch(e) {
        if (window.showToast) showToast(e.message, 'error');
    }
};

// ─── ADMIN: CREATE USER ───

window.openCreateUserForm = function() {
    // Get available plans for the dropdown
    apiCall('GET', '/admin/plans').then(function(data) {
        var plans = (data.plans || []).filter(function(p) { return p.is_active; });
        var planOptions = plans.map(function(p) {
            return '<option value="' + p.name + '">' + escapeHtml(p.display_name) + ' (' + p.name + ')</option>';
        }).join('');

        var modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'createUserModal';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-box" style="max-width:480px;">
                <div class="modal-header">
                    <h3>➕ ساخت کاربر جدید</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
                </div>
                <div style="padding:20px;">
                    <div style="margin-bottom:12px;">
                        <label style="display:block;margin-bottom:5px;font-size:0.85rem;color:#b0c4e0;">ایمیل *</label>
                        <input type="email" id="newUserEmail" placeholder="user@example.com" required style="width:100%;padding:10px;border-radius:8px;border:1px solid #2a3560;background:#0b0e1a;color:#fff;font-family:inherit;box-sizing:border-box;">
                    </div>
                    <div style="margin-bottom:12px;">
                        <label style="display:block;margin-bottom:5px;font-size:0.85rem;color:#b0c4e0;">رمز عبور * (حداقل ۶ کاراکتر)</label>
                        <input type="password" id="newUserPassword" placeholder="••••••" required style="width:100%;padding:10px;border-radius:8px;border:1px solid #2a3560;background:#0b0e1a;color:#fff;font-family:inherit;box-sizing:border-box;">
                    </div>
                    <div style="margin-bottom:12px;">
                        <label style="display:block;margin-bottom:5px;font-size:0.85rem;color:#b0c4e0;">نام نمایشی</label>
                        <input type="text" id="newUserDisplayName" placeholder="نام کاربر" style="width:100%;padding:10px;border-radius:8px;border:1px solid #2a3560;background:#0b0e1a;color:#fff;font-family:inherit;box-sizing:border-box;">
                    </div>
                    <div style="margin-bottom:12px;">
                        <label style="display:block;margin-bottom:5px;font-size:0.85rem;color:#b0c4e0;">پلن</label>
                        <select id="newUserPlan" style="width:100%;padding:10px;border-radius:8px;border:1px solid #2a3560;background:#0b0e1a;color:#fff;font-family:inherit;box-sizing:border-box;">
                            ${planOptions}
                        </select>
                    </div>
                    <div style="margin-bottom:20px;">
                        <label style="display:flex;align-items:center;gap:8px;font-size:0.85rem;color:#b0c4e0;cursor:pointer;">
                            <input type="checkbox" id="newUserIsAdmin"> ادمین
                        </label>
                    </div>
                    <button onclick="createUser()" class="btn-primary" style="width:100%;padding:12px;">✅ ساخت کاربر</button>
                    <div id="createUserError" style="color:#e74c3c;margin-top:10px;text-align:center;font-size:0.85rem;"></div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }).catch(function(e) {
        if (window.showToast) showToast('خطا در بارگذاری پلن‌ها: ' + e.message, 'error');
    });
};

window.createUser = async function() {
    var errEl = document.getElementById('createUserError');
    var email = document.getElementById('newUserEmail').value.trim();
    var password = document.getElementById('newUserPassword').value;
    var display_name = document.getElementById('newUserDisplayName').value.trim();
    var plan = document.getElementById('newUserPlan').value;
    var is_admin = document.getElementById('newUserIsAdmin').checked;

    if (!email || !password) {
        errEl.textContent = 'ایمیل و رمز عبور الزامی است';
        return;
    }
    if (password.length < 6) {
        errEl.textContent = 'رمز عبور باید حداقل ۶ کاراکتر باشد';
        return;
    }

    try {
        await apiCall('POST', '/admin/create-user', {
            email: email,
            password: password,
            display_name: display_name || undefined,
            plan: plan,
            is_admin: is_admin,
        });
        if (window.showToast) showToast('✅ کاربر ساخته شد', 'success');
        document.getElementById('createUserModal').remove();
        loadAdminUsers();
    } catch(e) {
        errEl.textContent = e.message;
    }
};

// ================================================================
//  INIT — اجرای هنگام لود صفحه
// ================================================================

// این اسکریپت با تأخیر (loadScript بعد از window.load) بارگذاری می‌شود؛
// در آن لحظه DOMContentLoaded قبلاً رخ داده، پس listener هیچ‌وقت فایر نمی‌شود.
// اگر document هنوز در حال لود است صبر کن، وگرنه بلافاصله اجرا کن.
function _initAuthPanel() {
    updateAuthUI();
    updateVerifyBanner();
    initGuestSession();

    // payBtn توسط TOPBAR DROPDOWN COORDINATOR (index.html) مدیریت می‌شود —
    // بازنویسی onclick اینجا حذف شد چون toggle پنل پروفایل را خراب می‌کرد.
    // ورود/ثبت‌نام از دکمه tppMainAction داخل پنل پروفایل در دسترس است.
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _initAuthPanel);
} else {
    _initAuthPanel();
}

// Expose functions for sidebar wiring (already done above via window.xxx = function)

})();
