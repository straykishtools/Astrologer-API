/* ═══════════════════════════════════════════════════════════
   Admin Panel — User Management, Subscriptions & Settings
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ─── Local "database" via localStorage ─── */
  var USERS_KEY = 'cosmic_admin_users';
  var SETTINGS_KEY = 'cosmic_admin_settings';
  var PLANS_KEY = 'cosmic_admin_plans';

  var DEFAULT_PLANS = [
    { name: 'free', label: 'رایگان', color: '#74b9ff', price: '۰ تومان', features: ['چارت تولد پایه', ' فال حافظ', 'ابجد', 'مزاج‌شناسی'], limit: '۵ محاسبات/روز' },
    { name: 'basic', label: 'پایه', color: '#fdcb6e', price: '۴۹,۰۰۰ تومان/ماه', features: ['همه ابزارهای پایه', 'ترانزیت', 'بیوریتم', 'سال حیوانی'], limit: '۲۰ محاسبات/روز' },
    { name: 'pro', label: 'حرفه‌ای', color: '#a29bfe', price: '۹۹,۰۰۰ تومان/ماه', features: ['همه ابزارها', 'سیناستری', 'کامپوزیت', 'بازگشت خورشیدی', 'بازگشت ماهانه', 'ذخیره نامحدود'], limit: 'نامحدود' },
    { name: 'enterprise', label: 'سازمانی', color: '#55efc4', price: '۲۹۹,۰۰۰ تومان/ماه', features: ['همه امکانات Pro', 'API دسترسی', 'چند کاربره', 'پشتیبانی اختصاصی'], limit: 'نامحدود + API' }
  ];

  function getPlans() {
    try {
      var p = JSON.parse(localStorage.getItem(PLANS_KEY));
      if (p && p.length) return p;
    } catch (_) {}
    return DEFAULT_PLANS.slice();
  }
  function savePlans(arr) { localStorage.setItem(PLANS_KEY, JSON.stringify(arr)); }

  /* ─── آیکون پلن برای منوی پروفایل (tpp-plans) ───
     نام شناسه → ایموجی؛ پلن‌های ناشناس از روی ترتیب رنگ می‌گیرند تا همیشه
     با آنچه ادمین در تب اشتراک‌ها ساخته هم‌خوان باشد. */
  function tppPlanIcon(planName) {
    var map = { free: '🆓', basic: '🥉', gold: '⭐', pro: '✨', diamond: '💎', enterprise: '🏢' };
    if (map[planName]) return map[planName];
    var plans = getPlans();
    var idx = plans.findIndex(function (p) { return p.name === planName; });
    return idx >= 0 ? ['🅰️', '🅱️', '🅲', '🅳', '🅴', '🅵', '🅶', '🅷'][idx % 8] : '✨';
  }

  /* ─── بازسازی tpp-plans از پلن‌های ادمین ───
     منوی پروفایل (پلن‌ها) باید دقیقاً همان پلن‌های تب «اشتراک‌ها» را نشان دهد —
     نام، رنگ، قیمت و محدودیت؛ با نشانه‌گذاری پلن جاری کاربر. */
  function renderTppPlans() {
    var host = document.getElementById('tppPlans');
    if (!host) return;
    var plans = getPlans();
    var user = {};
    try { user = JSON.parse(localStorage.getItem('cosmic_user') || '{}'); } catch (_) {}
    var currentPlan = user.plan || 'free';
    var html = '';
    plans.forEach(function (p) {
      var isCurrent = p.name === currentPlan;
      var featured = (p.name === 'gold' || p.name === 'pro') ? ' tpp-plan-featured' : '';
      html += '<div class="tpp-plan-card' + featured + '" data-plan="' + _esc(p.name) + '" onclick="openPricingModal()"'
        + (isCurrent ? ' style="outline:2px solid ' + _esc(p.color) + ';"' : '') + '>';
      if (isCurrent) html += '<div class="tpp-plan-popular">پلن شما</div>';
      html += '<div class="tpp-plan-icon">' + tppPlanIcon(p.name) + '</div>';
      html += '<div class="tpp-plan-name">' + _esc(p.label) + '</div>';
      html += '<div class="tpp-plan-price">' + _esc(p.price) + '</div>';
      if (p.limit) html += '<div class="tpp-plan-limit">' + _esc(p.limit) + '</div>';
      html += '<div class="tpp-plan-check"></div>';
      html += '</div>';
    });
    host.innerHTML = html;
  }

  function _esc(s) {
    var d = document.createElement('div');
    d.appendChild(document.createTextNode(s));
    return d.innerHTML;
  }

  function getUsers() {
    try { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); }
    catch (_) { return []; }
  }
  function saveUsers(arr) { localStorage.setItem(USERS_KEY, JSON.stringify(arr)); }

  function getSettings() {
    try { return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}'); }
    catch (_) { return {}; }
  }
  function saveSettings(o) { localStorage.setItem(SETTINGS_KEY, JSON.stringify(o)); }

  /* ─── Seed default admin if no users exist ─── */
  function seedDefaults() {
    var users = getUsers();
    if (users.length === 0) {
      users = [
        { id: 1, name: 'مدیر سیستم', email: 'admin@cosmic.ir', password: 'admin123', role: 'admin', plan: 'pro', status: 'active', created: '۱۴۰۴/۰۶/۰۱', lastLogin: '—' },
        { id: 2, name: 'سارا احمدی', email: 'sara@example.com', password: '1234', role: 'user', plan: 'free', status: 'active', created: '۱۴۰۴/۰۶/۱۰', lastLogin: '۱۴۰۴/۰۶/۱۵' },
        { id: 3, name: 'محمد رضایی', email: 'mohammad@example.com', password: '5678', role: 'user', plan: 'pro', status: 'active', created: '۱۴۰۴/۰۵/۲۰', lastLogin: '۱۴۰۴/۰۶/۱۴' },
        { id: 4, name: 'زهرا کریمی', email: 'zahra@example.com', password: 'abcd', role: 'moderator', plan: 'basic', status: 'suspended', created: '۱۴۰۴/۰۴/۰۱', lastLogin: '۱۴۰۴/۰۶/۰۵' }
      ];
      saveUsers(users);
    }
  }

  var PLAN_COLORS = { free: '#74b9ff', basic: '#fdcb6e', pro: '#a29bfe', enterprise: '#55efc4' };
  var PLAN_LABELS = { free: 'رایگان', basic: 'پایه', pro: 'حرفه‌ای', enterprise: 'سازمانی' };
  var ROLE_LABELS = { admin: 'مدیر', moderator: 'ناظر', user: 'کاربر' };
  var STATUS_LABELS = { active: 'فعال', suspended: 'مسدود', pending: 'در انتظار' };

  function planBadge(p) {
    var c = PLAN_COLORS[p] || '#74b9ff';
    return '<span style="background:' + c + '22;color:' + c + ';padding:2px 10px;border-radius:8px;font-size:11px;font-weight:700">' + _esc(PLAN_LABELS[p] || p) + '</span>';
  }
  function statusBadge(s) {
    var colors = { active: '#55efc4', suspended: '#ff7675', pending: '#fdcb6e' };
    var c = colors[s] || '#74b9ff';
    return '<span style="background:' + c + '22;color:' + c + ';padding:2px 10px;border-radius:8px;font-size:11px;font-weight:700">' + _esc(STATUS_LABELS[s] || s) + '</span>';
  }

  /* ─── Render ─── */
  function render() {
    var container = document.getElementById('adminPanel');
    if (!container) return;
    seedDefaults();
    var users = getUsers();
    var settings = getSettings();

    var activeCount = users.filter(function (u) { return u.status === 'active'; }).length;
    var proCount = users.filter(function (u) { return u.plan === 'pro' || u.plan === 'enterprise'; }).length;

    var html = '';

    /* Stats row */
    html += '<div class="admin-stats">';
    html += statCard('👥', 'کل کاربران', users.length);
    html += statCard('✅', 'فعال', activeCount);
    html += statCard('⭐', 'مشترکین Pro', proCount);
    html += statCard('🚫', 'مسدود', users.length - activeCount);
    html += '</div>';

    /* Tabs */
    html += '<div class="admin-tabs">';
    html += '<button class="admin-tab active" data-tab="users">👥 مدیریت کاربران</button>';
    html += '<button class="admin-tab" data-tab="subscriptions">💎 اشتراک‌ها</button>';
    html += '<button class="admin-tab" data-tab="settings">⚙️ تنظیمات</button>';
    html += '<button class="admin-tab" data-tab="audio">🎵 صداها</button>';
    html += '</div>';

    /* Users tab */
    html += '<div class="admin-tab-content" id="adminTabUsers">';
    html += '<div class="admin-toolbar">';
    html += '<input type="text" class="admin-search" id="adminUserSearch" placeholder="🔍 جستجوی نام یا ایمیل..." autocomplete="off">';
    html += '<button class="admin-btn admin-btn-primary" id="adminAddUserBtn">➕ کاربر جدید</button>';
    html += '</div>';
    html += '<div class="admin-table-wrap"><table class="admin-table"><thead><tr>';
    html += '<th>شناسه</th><th>نام</th><th>ایمیل</th><th>نقش</th><th>اشتراک</th><th>وضعیت</th><th>آخرین ورود</th><th>عملیات</th>';
    html += '</tr></thead><tbody id="adminUsersBody">';

    users.forEach(function (u) {
      html += '<tr>';
      html += '<td style="color:var(--ink-dim)">#' + u.id + '</td>';
      html += '<td><strong>' + _esc(u.name) + '</strong></td>';
      html += '<td style="direction:ltr;text-align:left">' + _esc(u.email) + '</td>';
      html += '<td>' + _esc(ROLE_LABELS[u.role] || u.role) + '</td>';
      html += '<td>' + planBadge(u.plan) + '</td>';
      html += '<td>' + statusBadge(u.status) + '</td>';
      html += '<td style="color:var(--ink-dim)">' + _esc(u.lastLogin) + '</td>';
      html += '<td>';
      html += '<button class="admin-icon-btn" onclick="AdminPanel.editUser(' + u.id + ')" title="ویرایش">✏️</button>';
      html += '<button class="admin-icon-btn" onclick="AdminPanel.toggleStatus(' + u.id + ')" title="تغییر وضعیت">' + (u.status === 'active' ? '🔒' : '🔓') + '</button>';
      html += '<button class="admin-icon-btn admin-icon-btn-danger" onclick="AdminPanel.deleteUser(' + u.id + ')" title="حذف">🗑️</button>';
      html += '</td>';
      html += '</tr>';
    });

    html += '</tbody></table></div>';
    html += '<div class="admin-pagination" id="adminPagination"></div>';
    html += '</div>';

    /* Subscriptions tab */
    html += '<div class="admin-tab-content" id="adminTabSubscriptions" style="display:none">';
    html += renderSubscriptions();
    html += '</div>';

    /* Settings tab */
    html += '<div class="admin-tab-content" id="adminTabSettings" style="display:none">';
    html += renderSettings(settings);
    html += '</div>';

    /* Audio tab */
    html += '<div class="admin-tab-content" id="adminTabAudio" style="display:none">';
    html += '<div id="adminTabAudioContent">';
    if (window.AudioManager) { html += AudioManager.renderAdminAudio(); }
    else { html += '<p style="color:var(--ink-dim)">بارگذاری سیستم صدا...</p>'; }
    html += '</div></div>';

    container.innerHTML = html;
    bindEvents();
    filterUsers('');
    renderTppPlans(); // پلن‌های منوی پروفایل = پلن‌های تب اشتراک‌ها
  }

  function statCard(icon, label, value) {
    return '<div class="admin-stat-card">' +
      '<div class="admin-stat-icon">' + icon + '</div>' +
      '<div class="admin-stat-value">' + value + '</div>' +
      '<div class="admin-stat-label">' + _esc(label) + '</div>' +
      '</div>';
  }

  function renderSubscriptions() {
    var plans = getPlans();
    var html = '<div class="admin-plans" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px;">';
    plans.forEach(function (p, idx) {
      html += '<div class="admin-plan-card" style="border-top:3px solid ' + _esc(p.color) + ';position:relative;">';
      html += '<button class="admin-icon-btn" onclick="AdminPanel.editPlan(' + idx + ')" title="ویرایش پلن" style="position:absolute;top:10px;left:10px;">✏️</button>';
      html += '<div class="admin-plan-badge" style="background:' + _esc(p.color) + '22;color:' + _esc(p.color) + '">' + _esc(p.label) + '</div>';
      html += '<div class="admin-plan-price">' + _esc(p.price) + '</div>';
      html += '<div class="admin-plan-limit">' + _esc(p.limit) + '</div>';
      html += '<ul class="admin-plan-features">';
      p.features.forEach(function (f) { html += '<li>✓ ' + _esc(f) + '</li>'; });
      html += '</ul>';
      html += '</div>';
    });
    html += '</div>';
    html += '<div style="margin-top:16px;text-align:center;">';
    html += '<button class="admin-btn admin-btn-primary" onclick="AdminPanel.addPlan()">➕ افزودن پلن جدید</button>';
    html += '<button class="admin-btn" onclick="AdminPanel.resetPlans()" style="margin-right:8px;">🔄 بازنشانی پیش‌فرض</button>';
    html += '</div>';
    return html;
  }

  function showPlanModal(existingPlan, planIndex) {
    var isEdit = existingPlan !== null;
    var p = existingPlan || { name: 'custom', label: 'پلن جدید', color: '#74b9ff', price: '۰ تومان', features: [], limit: '' };

    var overlay = document.createElement('div');
    overlay.className = 'admin-modal-overlay';
    overlay.innerHTML = '<div class="admin-modal">' +
      '<div class="admin-modal-header"><h3>' + (isEdit ? '✏️ ویرایش پلن: ' + _esc(p.label) : '➕ پلن جدید') + '</h3><button class="admin-modal-close" id="planModalClose">✕</button></div>' +
      '<div class="admin-modal-body">' +
      '<div class="admin-form-row"><label>نام نمایشی</label><input type="text" class="admin-input" id="planLabel" value="' + _esc(p.label) + '"></div>' +
      '<div class="admin-form-row"><label>شناسه (انگلیسی)</label><input type="text" class="admin-input" id="planName" value="' + _esc(p.name) + '" ' + (isEdit ? 'readonly' : '') + '></div>' +
      '<div class="admin-form-row"><label>رنگ (هگز)</label><div style="display:flex;gap:8px;align-items:center;"><input type="color" id="planColorPicker" value="' + _esc(p.color) + '" style="width:40px;height:36px;border:none;cursor:pointer;"><input type="text" class="admin-input" id="planColor" value="' + _esc(p.color) + '" style="flex:1;"></div></div>' +
      '<div class="admin-form-row"><label>قیمت</label><input type="text" class="admin-input" id="planPrice" value="' + _esc(p.price) + '"></div>' +
      '<div class="admin-form-row"><label>محدودیت</label><input type="text" class="admin-input" id="planLimit" value="' + _esc(p.limit) + '"></div>' +
      '<div class="admin-form-row"><label>امکانات (هر خط یک مورد)</label><textarea class="admin-input" id="planFeatures" rows="5" style="resize:vertical">' + _esc(p.features.join('\n')) + '</textarea></div>' +
      '</div>' +
      '<div class="admin-modal-footer">' +
      (isEdit ? '<button class="admin-btn admin-icon-btn-danger" id="planModalDelete" style="margin-right:auto;">🗑️ حذف پلن</button>' : '') +
      '<button class="admin-btn" id="planModalCancel">انصراف</button>' +
      '<button class="admin-btn admin-btn-primary" id="planModalSave">💾 ذخیره</button>' +
      '</div>' +
      '</div>';

    document.body.appendChild(overlay);
    setTimeout(function () { overlay.classList.add('visible'); }, 10);

    // Sync color picker and text input
    var picker = document.getElementById('planColorPicker');
    var colorText = document.getElementById('planColor');
    picker.addEventListener('input', function() { colorText.value = this.value; });
    colorText.addEventListener('input', function() { if (/^#[0-9a-f]{6}$/i.test(this.value)) picker.value = this.value; });

    function closeModal() { overlay.classList.remove('visible'); setTimeout(function () { overlay.remove(); }, 300); }
    document.getElementById('planModalClose').addEventListener('click', closeModal);
    document.getElementById('planModalCancel').addEventListener('click', closeModal);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeModal(); });

    var deleteBtn = document.getElementById('planModalDelete');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', function() {
        if (!confirm('آیا از حذف این پلن مطمئن هستید؟')) return;
        var plans = getPlans();
        plans.splice(planIndex, 1);
      savePlans(plans);
      showToast('پلن حذف شد 🗑️');
      closeModal();
      render();
    });
  }

    document.getElementById('planModalSave').addEventListener('click', function () {
      var label = document.getElementById('planLabel').value.trim();
      var name = document.getElementById('planName').value.trim();
      var color = document.getElementById('planColor').value.trim();
      var price = document.getElementById('planPrice').value.trim();
      var limit = document.getElementById('planLimit').value.trim();
      var featuresRaw = document.getElementById('planFeatures').value;
      var features = featuresRaw.split('\n').map(function(f) { return f.trim(); }).filter(function(f) { return f.length > 0; });

      if (!label || !name) { showToast('نام و شناسه الزامی است ❌', 'error'); return; }

      var plans = getPlans();
      var updated = { name: name, label: label, color: color || '#74b9ff', price: price || '۰ تومان', features: features, limit: limit || '' };
      if (isEdit && planIndex >= 0 && planIndex < plans.length) {
        plans[planIndex] = updated;
        showToast('پلن ویرایش شد ✅');
      } else {
        plans.push(updated);
        showToast('پلن جدید اضافه شد ✅');
      }
      savePlans(plans);
      closeModal();
      render();
    });
  }

  function renderSettings(s) {
    return '<div class="admin-settings-form">' +
      '<div class="admin-setting-row"><label>🔒 حداقل طول رمز عبور</label><input type="number" class="admin-input" id="adminMinPass" value="' + (s.minPassword || 4) + '" min="4" max="32"></div>' +
      '<div class="admin-setting-row"><label>⏰ مهلت نشست (دقیقه)</label><input type="number" class="admin-input" id="adminSession" value="' + (s.sessionTimeout || 60) + '" min="5" max="1440"></div>' +
      '<div class="admin-setting-row"><label>📧 ایمیل اعلان‌ها</label><input type="email" class="admin-input" id="adminEmail" value="' + _esc(s.notifyEmail || 'admin@cosmic.ir') + '"></div>' +
      '<div class="admin-setting-row"><label>🌍 زبان پیش‌فرض</label><select class="admin-input" id="adminLang"><option value="fa"' + (s.lang === 'fa' ? ' selected' : '') + '>فارسی</option><option value="en"' + (s.lang === 'en' ? ' selected' : '') + '>English</option></select></div>' +
      '<div class="admin-setting-row"><label>🌙 حالت تاریک</label><label class="admin-toggle"><input type="checkbox" id="adminDarkMode" ' + (s.darkMode !== false ? 'checked' : '') + '><span class="admin-toggle-slider"></span></label></div>' +
      '<button class="admin-btn admin-btn-primary" id="adminSaveSettings" style="margin-top:16px">💾 ذخیره تنظیمات</button>' +
      '</div>';
  }

  /* ─── Event binding ─── */
  function bindEvents() {
    /* Tab switching */
    document.querySelectorAll('.admin-tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        document.querySelectorAll('.admin-tab').forEach(function (t) { t.classList.remove('active'); });
        document.querySelectorAll('.admin-tab-content').forEach(function (c) { c.style.display = 'none'; });
        tab.classList.add('active');
        var target = tab.getAttribute('data-tab');
        if (target === 'users') document.getElementById('adminTabUsers').style.display = '';
        else if (target === 'subscriptions') document.getElementById('adminTabSubscriptions').style.display = '';
        else if (target === 'settings') document.getElementById('adminTabSettings').style.display = '';
        else if (target === 'audio') document.getElementById('adminTabAudio').style.display = '';
      });
    });

    /* Search users */
    var search = document.getElementById('adminUserSearch');
    if (search) {
      search.addEventListener('input', function () { filterUsers(this.value); });
    }

    /* Add user */
    var addBtn = document.getElementById('adminAddUserBtn');
    if (addBtn) {
      addBtn.addEventListener('click', function () { showUserModal(null); });
    }

    /* Save settings */
    var saveBtn = document.getElementById('adminSaveSettings');
    if (saveBtn) {
      saveBtn.addEventListener('click', function () {
        var s = {
          minPassword: parseInt(document.getElementById('adminMinPass').value) || 4,
          sessionTimeout: parseInt(document.getElementById('adminSession').value) || 60,
          notifyEmail: document.getElementById('adminEmail').value,
          lang: document.getElementById('adminLang').value,
          darkMode: document.getElementById('adminDarkMode').checked
        };
        saveSettings(s);
        showToast('تنظیمات ذخیره شد ✅');
      });
    }
  }

  function filterUsers(query) {
    var q = query.toLowerCase().trim();
    var rows = document.querySelectorAll('#adminUsersBody tr');
    rows.forEach(function (row) {
      var text = row.textContent.toLowerCase();
      row.style.display = (q.length > 0 && text.indexOf(q) < 0) ? 'none' : '';
    });
  }

  /* ─── User CRUD ─── */
  function showUserModal(existingUser) {
    var isEdit = existingUser !== null;
    var u = existingUser || { id: Date.now(), name: '', email: '', password: '', role: 'user', plan: 'free', status: 'active', created: '—', lastLogin: '—' };

    var overlay = document.createElement('div');
    overlay.className = 'admin-modal-overlay';
    overlay.innerHTML = '<div class="admin-modal">' +
      '<div class="admin-modal-header"><h3>' + (isEdit ? '✏️ ویرایش کاربر' : '➕ کاربر جدید') + '</h3><button class="admin-modal-close" id="adminModalClose">✕</button></div>' +
      '<div class="admin-modal-body">' +
      '<div class="admin-form-row"><label>نام</label><input type="text" class="admin-input" id="modalName" value="' + _esc(u.name) + '"></div>' +
      '<div class="admin-form-row"><label>ایمیل</label><input type="email" class="admin-input" id="modalEmail" value="' + _esc(u.email) + '"></div>' +
      '<div class="admin-form-row"><label>رمز عبور</label><input type="text" class="admin-input" id="modalPass" value="' + _esc(u.password) + '" placeholder="' + (isEdit ? 'بدون تغییر خالی بگذارید' : 'رمز را وارد کنید') + '"></div>' +
      '<div class="admin-form-row"><label>نقش</label><select class="admin-input" id="modalRole"><option value="user"' + (u.role === 'user' ? ' selected' : '') + '>کاربر</option><option value="moderator"' + (u.role === 'moderator' ? ' selected' : '') + '>ناظر</option><option value="admin"' + (u.role === 'admin' ? ' selected' : '') + '>مدیر</option></select></div>' +
      '<div class="admin-form-row"><label>اشتراک</label><select class="admin-input" id="modalPlan"><option value="free"' + (u.plan === 'free' ? ' selected' : '') + '>رایگان</option><option value="basic"' + (u.plan === 'basic' ? ' selected' : '') + '>پایه</option><option value="pro"' + (u.plan === 'pro' ? ' selected' : '') + '>حرفه‌ای</option><option value="enterprise"' + (u.plan === 'enterprise' ? ' selected' : '') + '>سازمانی</option></select></div>' +
      '</div>' +
      '<div class="admin-modal-footer"><button class="admin-btn" id="adminModalCancel">انصراف</button><button class="admin-btn admin-btn-primary" id="adminModalSave">ذخیره</button></div>' +
      '</div>';

    document.body.appendChild(overlay);
    setTimeout(function () { overlay.classList.add('visible'); }, 10);

    document.getElementById('adminModalClose').addEventListener('click', closeModal);
    document.getElementById('adminModalCancel').addEventListener('click', closeModal);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeModal(); });

    document.getElementById('adminModalSave').addEventListener('click', function () {
      var name = document.getElementById('modalName').value.trim();
      var email = document.getElementById('modalEmail').value.trim();
      var pass = document.getElementById('modalPass').value.trim();
      var role = document.getElementById('modalRole').value;
      var plan = document.getElementById('modalPlan').value;

      if (!name || !email) { showToast('نام و ایمیل الزامی است ❌', 'error'); return; }
      if (!isEdit && !pass) { showToast('رمز عبور الزامی است ❌', 'error'); return; }

      var users = getUsers();
      if (isEdit) {
        var idx = users.findIndex(function (x) { return x.id === u.id; });
        if (idx >= 0) {
          users[idx].name = name;
          users[idx].email = email;
          if (pass) users[idx].password = pass;
          users[idx].role = role;
          users[idx].plan = plan;
        }
        showToast('کاربر ویرایش شد ✅');
      } else {
        users.push({ id: u.id, name: name, email: email, password: pass, role: role, plan: plan, status: 'active', created: '—', lastLogin: '—' });
        showToast('کاربر اضافه شد ✅');
      }
      saveUsers(users);
      closeModal();
      render();
    });

    function closeModal() {
      overlay.classList.remove('visible');
      setTimeout(function () { overlay.remove(); }, 300);
    }
  }

  function showToast(msg, type) {
    var t = document.createElement('div');
    t.className = 'admin-toast' + (type === 'error' ? ' admin-toast-error' : '');
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.classList.add('visible'); }, 10);
    setTimeout(function () { t.classList.remove('visible'); setTimeout(function () { t.remove(); }, 300); }, 2500);
  }

  /* ─── Public API ─── */
  window.AdminPanel = {
    init: function () { render(); },
    editUser: function (id) {
      var users = getUsers();
      var u = users.find(function (x) { return x.id === id; });
      if (u) showUserModal(u);
    },
    toggleStatus: function (id) {
      var users = getUsers();
      var u = users.find(function (x) { return x.id === id; });
      if (u) {
        u.status = u.status === 'active' ? 'suspended' : 'active';
        saveUsers(users);
        showToast(u.status === 'active' ? 'کاربر فعال شد 🔓' : 'کاربر مسدود شد 🔒');
        render();
      }
    },
    deleteUser: function (id) {
      if (!confirm('آیا از حذف این کاربر مطمئن هستید؟')) return;
      var users = getUsers().filter(function (x) { return x.id !== id; });
      saveUsers(users);
      showToast('کاربر حذف شد 🗑️');
      render();
    },
    editPlan: function (idx) {
      var plans = getPlans();
      if (plans[idx]) showPlanModal(plans[idx], idx);
    },
    addPlan: function () {
      showPlanModal(null, -1);
    },
    resetPlans: function () {
      if (!confirm('آیا از بازنشانی پلن‌ها به مقادیر پیش‌فرض مطمئن هستید؟')) return;
      savePlans(DEFAULT_PLANS.slice());
      showToast('پلن‌ها بازنشانی شدند 🔄');
      render();
    },
    getPlans: getPlans,
    renderTppPlans: renderTppPlans
  };
})();
