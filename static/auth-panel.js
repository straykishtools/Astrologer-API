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

// ─── به‌روزرسانی نمایش هدر ───

function updateAuthUI() {
    var payBtn = document.getElementById('payBtn');
    if (!payBtn) return;
    if (isLoggedIn()) {
        var u = getUser();
        var planLabel = '';
        if (u.plan === 'free') planLabel = '🆓 رایگان';
        else if (u.plan === 'gold') planLabel = '⭐ طلایی';
        else if (u.plan === 'diamond') planLabel = '💎 الماسی';
        else planLabel = '✨ ' + u.plan;

        payBtn.innerHTML = '👤 ' + (u.display_name || u.email || 'حساب') + ' (' + planLabel + ')';
        payBtn.onclick = openAccountModal;

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
        payBtn.innerHTML = '🔑 ورود / ثبت‌نام';
        payBtn.onclick = openLoginModal;
        var ab = document.getElementById('adminBtn');
        if (ab) ab.remove();
    }
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
//  LOGIN / REGISTER MODAL
// ================================================================

function openLoginModal() {
    var modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'authModal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-box" style="max-width:420px;">
            <div class="modal-header">
                <h3>🔑 ورود / ثبت‌نام</h3>
                <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
            </div>
            <div style="padding:20px;">
                <div id="authTabs" style="display:flex;gap:8px;margin-bottom:20px;">
                    <button class="auth-tab active" data-tab="login" onclick="switchAuthTab('login')" style="flex:1;padding:10px;border-radius:8px;border:none;cursor:pointer;font-family:inherit;background:#f39c12;color:#0b0e1a;font-weight:700;">ورود</button>
                    <button class="auth-tab" data-tab="register" onclick="switchAuthTab('register')" style="flex:1;padding:10px;border-radius:8px;border:none;cursor:pointer;font-family:inherit;background:#1e2740;color:#b0c4e0;">ثبت‌نام</button>
                </div>
                <div id="authFormArea"></div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    renderLoginForm();
}

window.switchAuthTab = function(tab) {
    var tabs = document.querySelectorAll('.auth-tab');
    tabs.forEach(function(t) {
        if (t.dataset.tab === tab) {
            t.classList.add('active');
            t.style.background = '#f39c12';
            t.style.color = '#0b0e1a';
            t.style.fontWeight = '700';
        } else {
            t.classList.remove('active');
            t.style.background = '#1e2740';
            t.style.color = '#b0c4e0';
            t.style.fontWeight = '400';
        }
    });
    if (tab === 'login') renderLoginForm();
    else renderRegisterForm();
};

function renderLoginForm() {
    var area = document.getElementById('authFormArea');
    if (!area) return;
    area.innerHTML = `
        <div class="input-group" style="margin-bottom:12px;">
            <label style="display:block;margin-bottom:5px;font-size:0.85rem;color:#b0c4e0;">ایمیل</label>
            <input type="email" id="loginEmail" placeholder="example@email.com" style="width:100%;padding:10px;border-radius:8px;border:1px solid #2a3560;background:#0b0e1a;color:#fff;font-family:inherit;box-sizing:border-box;">
        </div>
        <div class="input-group" style="margin-bottom:20px;">
            <label style="display:block;margin-bottom:5px;font-size:0.85rem;color:#b0c4e0;">رمز عبور</label>
            <input type="password" id="loginPassword" placeholder="••••••" style="width:100%;padding:10px;border-radius:8px;border:1px solid #2a3560;background:#0b0e1a;color:#fff;font-family:inherit;box-sizing:border-box;">
        </div>
        <button onclick="doLogin()" class="btn-primary" style="width:100%;padding:12px;font-size:1rem;">ورود</button>
        <div id="loginError" style="color:#e74c3c;margin-top:10px;text-align:center;font-size:0.85rem;"></div>
    `;
}

function renderRegisterForm() {
    var area = document.getElementById('authFormArea');
    if (!area) return;
    area.innerHTML = `
        <div class="input-group" style="margin-bottom:12px;">
            <label style="display:block;margin-bottom:5px;font-size:0.85rem;color:#b0c4e0;">نام نمایشی</label>
            <input type="text" id="regName" placeholder="نام شما" style="width:100%;padding:10px;border-radius:8px;border:1px solid #2a3560;background:#0b0e1a;color:#fff;font-family:inherit;box-sizing:border-box;">
        </div>
        <div class="input-group" style="margin-bottom:12px;">
            <label style="display:block;margin-bottom:5px;font-size:0.85rem;color:#b0c4e0;">ایمیل</label>
            <input type="email" id="regEmail" placeholder="example@email.com" style="width:100%;padding:10px;border-radius:8px;border:1px solid #2a3560;background:#0b0e1a;color:#fff;font-family:inherit;box-sizing:border-box;">
        </div>
        <div class="input-group" style="margin-bottom:20px;">
            <label style="display:block;margin-bottom:5px;font-size:0.85rem;color:#b0c4e0;">رمز عبور (حداقل ۶ کاراکتر)</label>
            <input type="password" id="regPassword" placeholder="••••••" style="width:100%;padding:10px;border-radius:8px;border:1px solid #2a3560;background:#0b0e1a;color:#fff;font-family:inherit;box-sizing:border-box;">
        </div>
        <button onclick="doRegister()" class="btn-primary" style="width:100%;padding:12px;font-size:1rem;">ثبت‌نام</button>
        <div id="regError" style="color:#e74c3c;margin-top:10px;text-align:center;font-size:0.85rem;"></div>
    `;
}

window.doLogin = async function() {
    var email = document.getElementById('loginEmail').value.trim();
    var password = document.getElementById('loginPassword').value;
    var errEl = document.getElementById('loginError');
    if (!email || !password) { errEl.textContent = 'ایمیل و رمز را وارد کنید'; return; }
    try {
        var data = await apiCall('POST', '/login', { email: email, password: password });
        setToken(data.access_token);
        setUser(data.user);
        updateAuthUI();
        document.getElementById('authModal').remove();
        if (window.showToast) showToast('✅ ورود موفقیت‌آمیز بود', 'success');
        else alert('✅ ورود موفقیت‌آمیز بود');
    } catch(e) {
        errEl.textContent = e.message;
    }
};

window.doRegister = async function() {
    var name = document.getElementById('regName').value.trim();
    var email = document.getElementById('regEmail').value.trim();
    var password = document.getElementById('regPassword').value;
    var errEl = document.getElementById('regError');
    if (!email || !password) { errEl.textContent = 'ایمیل و رمز را وارد کنید'; return; }
    if (password.length < 6) { errEl.textContent = 'رمز باید حداقل ۶ کاراکتر باشد'; return; }
    try {
        var data = await apiCall('POST', '/register', { email: email, password: password, display_name: name });
        setToken(data.access_token);
        setUser(data.user);
        updateAuthUI();
        document.getElementById('authModal').remove();
        if (window.showToast) showToast('✅ ثبت‌نام موفقیت‌آمیز بود', 'success');
        else alert('✅ ثبت‌نام موفقیت‌آمیز بود');
    } catch(e) {
        errEl.textContent = e.message;
    }
};

// ================================================================
//  ACCOUNT MODAL (profile + logout)
// ================================================================

function openAccountModal() {
    var u = getUser();
    var modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'accountModal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-box" style="max-width:400px;">
            <div class="modal-header">
                <h3>👤 حساب کاربری</h3>
                <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
            </div>
            <div style="padding:20px;text-align:center;">
                <div style="font-size:2rem;margin-bottom:10px;">👤</div>
                <div style="font-size:1.2rem;font-weight:700;margin-bottom:5px;">${u.display_name || u.email || ''}</div>
                <div style="color:#888;font-size:0.85rem;margin-bottom:15px;">${u.email || ''}</div>
                <div style="display:inline-block;padding:5px 15px;border-radius:20px;font-size:0.85rem;font-weight:700;margin-bottom:20px;
                    background:${u.plan === 'free' ? '#3a3a3a' : u.plan === 'gold' ? '#f39c12' : '#9b59b6'};
                    color:${u.plan === 'free' ? '#aaa' : '#000'};">
                    ${u.plan === 'free' ? '🆓 رایگان' : u.plan === 'gold' ? '⭐ طلایی' : u.plan === 'diamond' ? '💎 الماسی' : '✨ ' + u.plan}
                </div>
                <div style="display:flex;gap:10px;">
                    <button onclick="openPricingPage()" class="btn-action primary" style="flex:1;padding:10px;font-size:0.9rem;">⬆️ ارتقا اشتراک</button>
                    <button onclick="doLogout()" class="btn-action" style="flex:1;padding:10px;font-size:0.9rem;background:#e74c3c;color:#fff;">🚪 خروج</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

window.doLogout = function() {
    clearToken();
    updateAuthUI();
    var m = document.getElementById('accountModal');
    if (m) m.remove();
    if (window.showToast) showToast('👋 خارج شدید', 'info');
};

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

        var html = `
            <button onclick="openCreateUserForm()" class="btn-action primary" style="margin-bottom:15px;padding:8px 20px;font-size:0.85rem;">➕ ساخت کاربر جدید</button>
            <div style="overflow-x:auto;">
                <table style="width:100%;border-collapse:collapse;font-size:0.85rem;color:#ddd;">
                    <thead>
                        <tr style="border-bottom:2px solid #2a3560;">
                            <th style="padding:10px;text-align:right;">ID</th>
                            <th style="padding:10px;text-align:right;">نام</th>
                            <th style="padding:10px;text-align:right;">ایمیل</th>
                            <th style="padding:10px;text-align:right;">پلن فعلی</th>
                            <th style="padding:10px;text-align:right;">ادمین</th>
                            <th style="padding:10px;text-align:right;">استفاده امروز</th>
                            <th style="padding:10px;text-align:right;">تاریخ ثبت</th>
                            <th style="padding:10px;text-align:center;">تغییر پلن</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        users.forEach(function(u) {
            var options = allPlans.map(function(pn) {
                return '<option value="' + pn + '"' + (pn === u.plan ? ' selected' : '') + '>' + pn + '</option>';
            }).join('');
            html += `
                <tr style="border-bottom:1px solid #1e2740;">
                    <td style="padding:10px;">${u.id}</td>
                    <td style="padding:10px;">${u.display_name || '—'}</td>
                    <td style="padding:10px;">${u.email}</td>
                    <td style="padding:10px;font-weight:700;color:${u.plan === 'free' ? '#e74c3c' : u.plan === 'gold' ? '#f39c12' : '#9b59b6'};">${u.plan}</td>
                    <td style="padding:10px;text-align:center;"><button onclick="toggleUserAdmin(${u.id}, ${u.is_admin ? 1 : 0})" style="background:${u.is_admin ? '#f39c12' : '#2a3560'};border:none;color:${u.is_admin ? '#0b0e1a' : '#b0c4e0'};padding:4px 10px;border-radius:5px;cursor:pointer;font-size:0.75rem;font-family:inherit;font-weight:${u.is_admin ? '700' : '400'};">${u.is_admin ? '⭐ ادمین' : '—'}</button></td>
                    <td style="padding:10px;">${u.daily_charts_used || 0}</td>
                    <td style="padding:10px;font-size:0.75rem;">${u.created_at || ''}</td>
                    <td style="padding:10px;text-align:center;">
                        <select onchange="changeUserPlan(${u.id}, this.value)" style="background:#0b0e1a;color:#fff;border:1px solid #2a3560;padding:5px;border-radius:5px;font-family:inherit;font-size:0.8rem;">
                            ${options}
                        </select>
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
};;

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

document.addEventListener('DOMContentLoaded', function() {
    updateAuthUI();

    // اتصال دکمه‌های هدر
    var payBtn = document.getElementById('payBtn');
    if (payBtn && !isLoggedIn()) {
        payBtn.innerHTML = '🔑 ورود / ثبت‌نام';
        payBtn.onclick = openLoginModal;
    }

    // پنل قیمت‌گذاری با دکمه خرید (اگر لاگ‌ین کرده، حساب کاربری)
    // اگر لاگین نکرده، مودال ورود
    // اگر لاگین کرده، مودال حساب
});

// اتصال دکمه payBtn (overwrite رفتار قبلی)
var _origPayBtn = document.getElementById('payBtn');
if (_origPayBtn) {
    _origPayBtn.onclick = function() {
        if (isLoggedIn()) {
            openAccountModal();
        } else {
            openLoginModal();
        }
    };
}

})();
