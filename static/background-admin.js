/* ═══════════════════════════════════════════════════════════════
   BACKGROUND ADMIN — مدیریت تصاویر پس‌زمینه (پنل ادمین)
   ───────────────────────────────────────────────────────────────
   جای‌نوشته‌ی بخش پس‌زمینه‌هایی که در تب صدای قدیمی گم شد.
   ذخره‌ی همان داده‌ی قبلی است (کلید localStorage و namespace سرور
   تغییر نکرده) — پس تصویرهای از قبل ست‌شده دست‌نخورده می‌مانند:
     localStorage: cosmic_admin_bg_images
     سرور: GET/PUT /api/v5/settings/backgrounds
   اعمال فوری روی صفحه از طریق AudioManager.applyAdminBackgrounds.
   ═══════════════════════════════════════════════════════════════ */
(function () {
    'use strict';

    var BG_KEY = 'cosmic_admin_bg_images';
    var API = '/api/v5/settings/backgrounds';
    var PLANS_KEY = 'cosmic_admin_plans';
    var MAX_DATA_URL = 500 * 1024;        // سقف data-URL در localStorage

    function esc(s) {
        var d = document.createElement('div');
        d.appendChild(document.createTextNode(s == null ? '' : String(s)));
        return d.innerHTML;
    }
    function token() { try { return localStorage.getItem('cosmic_token') || ''; } catch (_) { return ''; } }
    function toast(m, t) { if (window.showToast) { try { window.showToast(m, t); } catch (_) {} } }
    function getDb() { try { return JSON.parse(localStorage.getItem(BG_KEY) || '[]'); } catch (_) { return []; } }
    function saveDb(arr) {
        try { localStorage.setItem(BG_KEY, JSON.stringify(arr)); } catch (_) {}
        var tk = token();
        if (tk) {
            fetch(API, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + tk },
                body: JSON.stringify({ items: arr })
            }).catch(function () {});
        }
        try { if (window.AudioManager && AudioManager.applyAdminBackgrounds) AudioManager.applyAdminBackgrounds(arr.slice()); } catch (_) {}
    }
    function hydrate(cb) {
        fetch(API).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
            var items = (d && d.items) || [];
            if (items.length) { try { localStorage.setItem(BG_KEY, JSON.stringify(items)); } catch (_) {} }
            if (cb) cb();
        }).catch(function () { if (cb) cb(); });
    }

    /* فایل تصویر → data-URL با کوچک‌سازی (JPEG q0.82، حداکثر ۱۲۸۰px) */
    function processImageFile(file, cb) {
        if (file.size > MAX_DATA_URL * 8) { toast('فایل خیلی بزرگ است ❌', 'error'); return; }
        var reader = new FileReader();
        reader.onload = function () {
            var img = new Image();
            img.onload = function () {
                var MAX = 1280;
                var scale = Math.min(1, MAX / Math.max(img.width, img.height));
                if (scale === 1 && file.type === 'image/png' && file.size <= MAX_DATA_URL) { cb(reader.result); return; }
                var c = document.createElement('canvas');
                c.width = Math.round(img.width * scale);
                c.height = Math.round(img.height * scale);
                c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
                cb(c.toDataURL('image/jpeg', 0.82));
            };
            img.onerror = function () { toast('فایل تصویر معتبر نیست ❌', 'error'); };
            img.src = reader.result;
        };
        reader.readAsDataURL(file);
    }

    /* ─── رندر تب ─── */
    function render(container) {
        var db = getDb();
        var html = '';
        html += '<p style="color:var(--ink-dim);font-size:12px;margin-bottom:12px;">🖼️ این تصاویر، پس‌زمینه‌ی واقعی سایت‌اند؛ می‌توانی هر تصویر را به پلن‌های اشتراک مشخص تخصیص دهی (خالی = همه/مهمان).</p>';
        html += '<div style="margin-bottom:14px;"><button class="admin-btn admin-btn-primary" id="bgAddBtn">➕ افزودن تصویر جدید</button></div>';
        html += '<div id="bgGrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;">';
        if (!db.length) {
            html += '<div style="grid-column:1/-1;text-align:center;color:var(--ink-dim);padding:24px;">هنوز تصویری تعریف نشده.</div>';
        }
        db.forEach(function (bg) {
            html += '<div style="background:rgba(18,22,46,0.85);border:1px solid var(--line-strong);border-radius:12px;padding:12px;text-align:center;position:relative;">';
            html += '<button class="admin-icon-btn" data-bg-edit="' + bg.id + '" title="ویرایش / جایگزینی تصویر" style="position:absolute;top:6px;left:6px;">✏️</button>';
            html += '<button class="admin-icon-btn admin-icon-btn-danger" data-bg-del="' + bg.id + '" title="حذف" style="position:absolute;top:6px;right:6px;">🗑️</button>';
            html += '<button class="admin-icon-btn" data-bg-toggle="' + bg.id + '" title="فعال/غیرفعال" style="position:absolute;bottom:6px;right:6px;">' + (bg.active !== false ? '🔓' : '🔒') + '</button>';
            if (bg.imageUrl) {
                html += '<img src="' + esc(bg.imageUrl) + '" alt="' + esc(bg.name) + '" style="width:100%;height:80px;object-fit:cover;border-radius:8px;margin-bottom:8px;">';
            } else {
                html += '<div style="width:100%;height:80px;border-radius:8px;background:' + esc(bg.gradient || '#121636') + ';margin-bottom:8px;display:flex;align-items:center;justify-content:center;font-size:32px;">' + esc(bg.icon || '🖼️') + '</div>';
            }
            html += '<div style="color:var(--gold-200);font-size:13px;font-weight:600;">' + esc(bg.name) + '</div>';
            html += '<div style="color:var(--ink-dim);font-size:11px;">' + (bg.active !== false ? '✅' : '❌') + ' ' + esc(bg.category || '') +
                     ((bg.assignedPlans && bg.assignedPlans.length) ? ' · ' + esc(bg.assignedPlans.join('، ')) : '') + '</div>';
            html += '</div>';
        });
        html += '</div>';
        container.innerHTML = html;

        var addBtn = document.getElementById('bgAddBtn');
        if (addBtn) addBtn.addEventListener('click', function () { openModal(null, container); });
        container.querySelectorAll('[data-bg-edit]').forEach(function (b) {
            b.addEventListener('click', function () { openModal(parseInt(b.dataset.bgEdit, 10), container); });
        });
        container.querySelectorAll('[data-bg-del]').forEach(function (b) {
            b.addEventListener('click', function () {
                var id = parseInt(b.dataset.bgDel, 10);
                if (!confirm('حذف این تصویر؟')) return;
                saveDb(getDb().filter(function (x) { return x.id !== id; }));
                toast('تصویر حذف شد', 'success');
                render(container);
            });
        });
        container.querySelectorAll('[data-bg-toggle]').forEach(function (b) {
            b.addEventListener('click', function () {
                var id = parseInt(b.dataset.bgToggle, 10);
                var db2 = getDb();
                var it = db2.find(function (x) { return x.id === id; });
                if (it) { it.active = (it.active === false); saveDb(db2); render(container); }
            });
        });
    }

    /* ─── مودال افزودن/ویرایش ─── */
    function openModal(id, container) {
        var db = getDb();
        var item = (id == null) ? null : db.find(function (b) { return b.id === id; });
        var isNew = !item;
        var p = item || { name: '', icon: '🖼️', category: 'custom', gradient: 'linear-gradient(135deg,#121636,#2a1a50)', imageUrl: '', assignedPlans: [], active: true };

        var overlay = document.createElement('div');
        overlay.className = 'admin-modal-overlay';
        overlay.innerHTML =
            '<div class="admin-modal" style="max-width:520px;">' +
            '<div class="admin-modal-header"><h3>' + (isNew ? '➕ تصویر پس‌زمینه جدید' : '✏️ ویرایش: ' + esc(p.name)) + '</h3><button class="admin-modal-close" id="bgmClose">✕</button></div>' +
            '<div class="admin-modal-body">' +
            '<div class="admin-form-row"><label>نام</label><input class="admin-input" id="bgmName" value="' + esc(p.name) + '"></div>' +
            '<div class="admin-form-row"><label>دسته‌بندی</label><input class="admin-input" id="bgmCategory" value="' + esc(p.category) + '"></div>' +
            '<div class="admin-form-row"><label>آیکون (اموجی)</label><input class="admin-input" id="bgmIcon" maxlength="4" value="' + esc(p.icon) + '" style="width:80px;"></div>' +
            '<div class="admin-form-row"><label>تصویر (URL یا فایل)</label><input class="admin-input" id="bgmUrl" dir="ltr" placeholder="https://... یا خالی = گرادیان" value="' + esc(p.imageUrl || '') + '"><input type="file" id="bgmFile" accept="image/*" style="margin-top:8px;color:var(--ink-dim);font-size:12px;"></div>' +
            '<div class="admin-form-row"><label>گرادیان (وقتی تصویری نیست)</label><input class="admin-input" id="bgmGrad" dir="ltr" value="' + esc(p.gradient) + '"></div>' +
            '<div class="admin-form-row"><label>تخصیص به پلن‌ها (خالی = همه)</label><select id="bgmPlans" multiple size="4" class="admin-input" style="width:100%;"></select></div>' +
            '<div style="text-align:center;margin-top:8px;"><div id="bgmPreview" style="width:100%;height:90px;border-radius:8px;border:1px dashed var(--line-strong);background:' + (p.imageUrl ? 'url(' + esc(p.imageUrl) + ') center/cover' : esc(p.gradient)) + ';display:flex;align-items:center;justify-content:center;font-size:32px;cursor:pointer;">' + (p.imageUrl ? '' : esc(p.icon)) + '</div><div style="font-size:10px;color:var(--ink-dim);margin-top:4px;">فایل را روی پیش‌نمایش بکشید و رها کنید، یا از دکمه‌ی انتخاب فایل استفاده کنید</div></div>' +
            '</div>' +
            '<div class="admin-modal-footer"><button class="admin-btn" id="bgmCancel">انصراف</button><button class="admin-btn admin-btn-primary" id="bgmSave">💾 ذخیره</button></div>' +
            '</div>';
        document.body.appendChild(overlay);
        setTimeout(function () { overlay.classList.add('visible'); }, 10);
        function close() { overlay.classList.remove('visible'); setTimeout(function () { overlay.remove(); }, 260); }

        /* فهرست پلن‌ها */
        (function fillPlans() {
            var sel = document.getElementById('bgmPlans');
            var assigned = p.assignedPlans || [];
            var draw = function (plans) {
                if (!sel || !document.getElementById('bgmPlans')) return;
                sel.innerHTML = (plans || []).map(function (pl) {
                    return '<option value="' + esc(pl.name) + '"' + (assigned.indexOf(pl.name) >= 0 ? ' selected' : '') + '>' + esc(pl.label || pl.name) + '</option>';
                }).join('');
            };
            var local = null;
            try { local = JSON.parse(localStorage.getItem(PLANS_KEY) || 'null'); } catch (_) {}
            if (local && local.length) { draw(local); return; }
            fetch('/api/v5/settings/plans').then(function (r) { return r.ok ? r.json() : null; })
                .then(function (d) { if (d && d.items) draw(d.items); }).catch(function () {});
        })();

        var urlInput = document.getElementById('bgmUrl');
        var fileInput = document.getElementById('bgmFile');
        function refreshPreview(url, grad, icon) {
            var prev = document.getElementById('bgmPreview');
            if (!prev) return;
            prev.style.background = url ? ('url(' + url + ') center/cover') : grad;
            prev.textContent = url ? '' : icon;
        }
        urlInput.addEventListener('input', function () {
            if (this.value.trim()) fileInput.value = '';
            refreshPreview(this.value.trim(), document.getElementById('bgmGrad').value, document.getElementById('bgmIcon').value);
        });
        fileInput.addEventListener('change', function () {
            var f = this.files && this.files[0];
            if (!f) return;
            processImageFile(f, function (dUrl) { urlInput.value = ''; urlInput.dataset.dataUrl = dUrl; refreshPreview(dUrl, '', ''); });
        });
        document.getElementById('bgmGrad').addEventListener('input', function () {
            if (!urlInput.value.trim() && !urlInput.dataset.dataUrl) refreshPreview('', this.value, document.getElementById('bgmIcon').value);
        });
        var preview = document.getElementById('bgmPreview');
        ['dragenter', 'dragover'].forEach(function (ev) { preview.addEventListener(ev, function (e) { e.preventDefault(); preview.style.borderColor = '#f39c12'; }); });
        ['dragleave', 'drop'].forEach(function (ev) { preview.addEventListener(ev, function (e) { e.preventDefault(); preview.style.borderColor = 'var(--line-strong)'; }); });
        preview.addEventListener('drop', function (e) {
            var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
            if (!f || f.type.indexOf('image/') !== 0) return;
            fileInput.value = '';
            processImageFile(f, function (dUrl) { urlInput.value = ''; urlInput.dataset.dataUrl = dUrl; refreshPreview(dUrl, '', ''); });
        });

        document.getElementById('bgmClose').addEventListener('click', close);
        document.getElementById('bgmCancel').addEventListener('click', close);
        overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });

        document.getElementById('bgmSave').addEventListener('click', function () {
            var name = document.getElementById('bgmName').value.trim();
            if (!name) { toast('نام الزامی است ❌', 'error'); return; }
            var assignedPlans = [].slice.call(document.getElementById('bgmPlans').selectedOptions).map(function (o) { return o.value; });
            var finalUrl = urlInput.dataset.dataUrl || urlInput.value.trim();
            var updated = {
                name: name,
                category: document.getElementById('bgmCategory').value.trim() || 'custom',
                icon: document.getElementById('bgmIcon').value.trim() || '🖼️',
                gradient: document.getElementById('bgmGrad').value.trim() || p.gradient,
                imageUrl: finalUrl,
                assignedPlans: assignedPlans,
                active: item ? (item.active !== false) : true
            };
            var db2 = getDb();
            if (isNew) {
                updated.id = db2.length ? Math.max.apply(null, db2.map(function (b) { return b.id; })) + 1 : 1;
                db2.push(updated);
            } else {
                updated.id = item.id;
                db2[db2.indexOf(item)] = updated;
            }
            saveDb(db2);
            toast(isNew ? 'تصویر اضافه شد ✅' : 'تصویر ذخیره شد ✅', 'success');
            close();
            render(container);
        });
    }

    window.BackgroundAdmin = {
        render: function (container) {
            hydrate(function () { render(container); });
        }
    };
})();
