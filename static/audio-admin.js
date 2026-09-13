/* ═══════════════════════════════════════════════════════════════
   AUDIO ADMIN — مدیریت صداهای پس‌زمینه (پنل ادمین)
   ───────────────────────────────────────────────────────────────
   فایل مستقل؛ فقط به VinylPlayer و API استناد می‌کند و هیچ‌چیز دیگر را
   لازم ندارد. اگر این فایل بارگذاری نشود، بقیه‌ی پنل ادمین سالم می‌ماند.

   API:
     GET  /api/v5/settings/tracks        → { items: [ {id,name,icon,fileUrl,active,assignedTo} ] }
     PUT  /api/v5/settings/tracks        → { items: [...] }           (ذخیره)
     POST /api/v5/audio/upload           → { url }                    (آپلود base64)
     DELETE /api/v5/audio/file/{id}      → حذف فایل
   ═══════════════════════════════════════════════════════════════ */
(function () {
    'use strict';

    var TRACKS_URL = '/api/v5/settings/tracks';

    var SECTIONS = [
        { key: 'site', label: 'سایت (پیش‌فرض همه‌جا)' },
        { key: 'birth', label: 'چارت تولد' },
        { key: 'synastry', label: 'سیناستری' },
        { key: 'composite', label: 'کامپوزیت' },
        { key: 'transit', label: 'ترانزیت' },
        { key: 'solar-return', label: 'بازگشت خورشیدی' },
        { key: 'lunar-return', label: 'بازگشت ماهانه' },
        { key: 'mizaj', label: 'مزاج‌شناسی' },
        { key: 'abjad', label: 'ابجد' },
        { key: 'tarot', label: 'تاروت' },
        { key: 'numerology', label: 'عددشناسی' },
        { key: 'biorhythm', label: 'بیوریتم' },
        { key: 'zodiac', label: 'سال حیوانی' },
        { key: 'daily-question', label: 'پرسش روزانه' },
        { key: 'hafez', label: 'فال حافظ' },
        { key: 'nasa', label: 'ناسا' },
        { key: 'moon-phase', label: 'فاز ماه' },
        { key: 'qol', label: 'کیفیت زندگی' },
        { key: 'yoga', label: 'یوگا' },
        { key: 'breath', label: 'تنفس' },
        { key: 'meditation', label: 'مدیتیشن' }
    ];
    var SEC_LABEL = {};
    SECTIONS.forEach(function (s) { SEC_LABEL[s.key] = s.label; });

    function esc(s) {
        var d = document.createElement('div');
        d.appendChild(document.createTextNode(s == null ? '' : String(s)));
        return d.innerHTML;
    }
    function token() { try { return localStorage.getItem('cosmic_token') || ''; } catch (_) { return ''; } }
    function authHeaders(extra) {
        var h = extra || {};
        h['Authorization'] = 'Bearer ' + token();
        return h;
    }
    function slug(name) {
        return (String(name || '').trim().toLowerCase()
            .replace(/[ؐ-ًّٰ]/g, '')
            .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')) || ('track-' + Date.now());
    }
    function toast(msg, type) { if (window.showToast) { try { window.showToast(msg, type); } catch (_) {} } }

    /* ─── وضعیت حافظه ─── */
    var cache = null;
    function fetchTracks(cb) {
        fetch(TRACKS_URL).then(function (r) { return r.ok ? r.json() : null; })
            .then(function (d) { cache = (d && d.items) || []; cb(cache); })
            .catch(function () { cache = cache || []; cb(cache); });
    }
    function saveTracks(cb) {
        fetch(TRACKS_URL, {
            method: 'PUT',
            headers: authHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ items: cache })
        }).then(function (r) { return r.json().then(function (d) { return r.ok; }, function () { return false; }); })
            .then(function (ok) {
                if (!ok) { toast('ذخیره در سرور ناموفق بود ❌', 'error'); }
                try { if (window.VinylPlayer) VinylPlayer.reload(); } catch (_) {}
                if (cb) cb(ok);
            }).catch(function () { toast('خطای شبکه در ذخیره ❌', 'error'); cb && cb(false); });
    }

    /* ─── رندر تب ─── */
    function render(container) {
        try {
            fetchTracks(function (items) {
                draw(container, items);
            });
        } catch (e) {
            container.innerHTML = '<p style="color:#ff7675">خطا در بارگذاری سیستم صدا: ' + esc(e.message) + '</p>';
        }
    }

    function draw(container, items) {
        var html = '';
        html += '<div class="admin-stats" style="margin-bottom:18px;">';
        html += '<div class="admin-stat-card"><div class="admin-stat-icon">🎵</div><div class="admin-stat-value">' + items.length + '</div><div class="admin-stat-label">صدای تعریف‌شده</div></div>';
        html += '<div class="admin-stat-card"><div class="admin-stat-icon">🎧</div><div class="admin-stat-value">' + items.filter(function (t) { return t.fileUrl; }).length + '</div><div class="admin-stat-label">دارای فایل</div></div>';
        html += '<div class="admin-stat-card"><div class="admin-stat-icon">✅</div><div class="admin-stat-value">' + items.filter(function (t) { return t.active !== false; }).length + '</div><div class="admin-stat-label">فعال</div></div>';
        html += '</div>';

        html += '<p style="color:var(--ink-dim);font-size:12px;margin-bottom:12px;">💡 برای هر صدا یک فایل (mp3/ogg/wav/m4a) آپلود کن و مشخص کن در کدام بخش‌ها پخش شود. پلیر وینیلی توی نوار بالا همین‌ها را می‌نوازد.</p>';

        // جدول
        html += '<div class="admin-table-wrap"><table class="admin-table"><thead><tr>';
        html += '<th>آیکون</th><th>نام</th><th>فایل</th><th>تخصیص</th><th>وضعیت</th><th>عملیات</th></tr></thead><tbody>';
        if (!items.length) {
            html += '<tr><td colspan="6" style="text-align:center;color:var(--ink-dim);padding:18px;">هنوز صدایی اضافه نشده — از فرم پایین شروع کن.</td></tr>';
        }
        items.forEach(function (t, i) {
            var alloc = (t.assignedTo && t.assignedTo.length) ? t.assignedTo.map(function (k) { return SEC_LABEL[k] || k; }).join('، ') : '—';
            html += '<tr>';
            html += '<td style="font-size:20px">' + esc(t.icon || '🎵') + '</td>';
            html += '<td>' + esc(t.name) + '</td>';
            html += '<td>' + (t.fileUrl ? '<a href="' + esc(t.fileUrl) + '" target="_blank" style="color:#55efc4;font-size:11px;">🎧 فایل ✓</a>' : '<span style="color:#ff7675;font-size:11px;">بدون فایل</span>') + '</td>';
            html += '<td style="max-width:260px;font-size:11px;color:var(--ink-dim);">' + esc(alloc) + '</td>';
            html += '<td>' + (t.active !== false ? '<span style="color:#55efc4">فعال</span>' : '<span style="color:#ff7675">غیرفعال</span>') + '</td>';
            html += '<td style="white-space:nowrap;">';
            html += '<button class="admin-icon-btn" data-act="toggle" data-i="' + i + '" title="فعال/غیرفعال">' + (t.active !== false ? '🔓' : '🔒') + '</button>';
            html += '<button class="admin-icon-btn" data-act="replace" data-i="' + i + '" title="جایگزینی فایل">🎧</button>';
            html += '<button class="admin-icon-btn" data-act="edit" data-i="' + i + '" title="ویرایش/تخصیص">✏️</button>';
            html += '<button class="admin-icon-btn" data-act="preview" data-i="' + i + '" title="پیش‌نمایش">▶️</button>';
            html += '<button class="admin-icon-btn admin-icon-btn-danger" data-act="delete" data-i="' + i + '" title="حذف">🗑️</button>';
            html += '</td></tr>';
        });
        html += '</tbody></table></div>';

        // افزودن
        html += '<div style="margin-top:16px;padding:16px;background:rgba(18,22,46,0.85);border:1px solid var(--line-strong);border-radius:12px;">';
        html += '<h4 style="color:var(--gold-200);margin-bottom:12px;">➕ افزودن صدای تازه</h4>';
        html += '<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:end;">';
        html += '<div><label style="color:var(--ink-dim);font-size:11px;">نام</label><input type="text" class="admin-input" id="aaName" placeholder="مثلاً باران ملایم" style="width:170px;"></div>';
        html += '<div><label style="color:var(--ink-dim);font-size:11px;">آیکون</label><input type="text" class="admin-input" id="aaIcon" placeholder="🌧️" maxlength="4" style="width:70px;"></div>';
        html += '<div><label style="color:var(--ink-dim);font-size:11px;">فایل صدا</label><input type="file" id="aaFile" accept="audio/*,.mp3,.ogg,.wav,.m4a" class="admin-input" style="width:220px;padding:6px;"></div>';
        html += '<button class="admin-btn admin-btn-primary" id="aaAdd">➕ افزودن و آپلود</button>';
        html += '</div>';
        html += '<div id="aaStatus" style="margin-top:8px;color:var(--gold-200);font-size:12px;min-height:18px;"></div>';
        html += '</div>';

        container.innerHTML = html;

        // اتصال رویدادها
        container.querySelectorAll('[data-act]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var idx = parseInt(btn.dataset.i, 10);
                act(btn.dataset.act, idx, container);
            });
        });
        var addBtn = document.getElementById('aaAdd');
        if (addBtn) addBtn.addEventListener('click', function () { doAdd(container); });
    }

    /* ─── عملیات ─── */
    function act(kind, i, container) {
        var t = cache[i];
        if (!t) return;
        if (kind === 'toggle') {
            t.active = (t.active === false);
            saveTracks(function () { render(container); });
        } else if (kind === 'preview') {
            if (!t.fileUrl) { toast('فایلی برای پیش‌نمایش نیست', 'error'); return; }
            try { var a = new window.Audio(t.fileUrl); a.volume = 0.6; a.play().catch(function(){}); } catch (_) {}
        } else if (kind === 'delete') {
            if (!confirm('حذف این صدا؟' + (t.fileUrl ? '\n(فایل روی سرور هم پاک می‌شود)' : ''))) return;
            if (t.fileUrl && t.id) { apiDeleteFile(t.id); }
            cache.splice(i, 1);
            saveTracks(function () { render(container); });
        } else if (kind === 'replace') {
            pickFile(function (file) {
                uploadThen(t.id, file, function (ok, url) {
                    if (ok) { t.fileUrl = url; saveTracks(function () { render(container); toast('فایل جایگزین شد ✅', 'success'); }); }
                    else toast('آپلود ناموفق ❌', 'error');
                });
            });
        } else if (kind === 'edit') {
            openEditModal(t, function () { render(container); });
        }
    }

    function doAdd(container) {
        var name = document.getElementById('aaName').value.trim();
        var icon = (document.getElementById('aaIcon').value || '').trim() || '🎵';
        var fileIn = document.getElementById('aaFile');
        var status = document.getElementById('aaStatus');
        if (!name) { toast('نام صدا لازم است', 'error'); return; }
        var f = fileIn.files && fileIn.files[0];
        if (!f) { toast('یک فایل صوتی انتخاب کن', 'error'); return; }
        var id = uniqueId(slug(name));
        status.textContent = '⏳ در حال آپلود «' + name + '»...';
        uploadThen(id, f, function (ok, url) {
            if (!ok) { status.textContent = '❌ آپلود ناموفق'; return; }
            cache.push({ id: id, name: name, icon: icon, fileUrl: url, active: true, assignedTo: ['site'] });
            status.textContent = '✅ آپلود شد، در حال ذخیره...';
            saveTracks(function (saved) {
                if (saved) { toast('صدا اضافه شد ✅', 'success'); render(container); }
                else status.textContent = '⚠️ فایل آپلود شد ولی ذخیره‌ی تنظیمات ناموفق بود';
            });
        });
    }

    function uniqueId(base) {
        var id = base, n = 2;
        while (cache.some(function (t) { return t.id === id; })) { id = base + '-' + n; n++; }
        return id;
    }

    /* ─── آپلود/حذف فایل ─── */
    function pickFile(cb) {
        var inp = document.createElement('input');
        inp.type = 'file';
        inp.accept = 'audio/*,.mp3,.ogg,.wav,.m4a';
        inp.onchange = function () { if (inp.files && inp.files[0]) cb(inp.files[0]); };
        inp.click();
    }
    function uploadThen(id, file, done) {
        if (file.size > 20 * 1024 * 1024) { toast('حجم فایل بیش از ۲۰ مگابایت ❌', 'error'); done(false); return; }
        var reader = new FileReader();
        reader.onload = function () {
            var s = String(reader.result || '');
            var comma = s.indexOf(',');
            var b64 = comma >= 0 ? s.slice(comma + 1) : s;
            var ext = (file.name.split('.').pop() || 'mp3').toLowerCase();
            if (!/^(mp3|ogg|wav|m4a)$/.test(ext)) ext = 'mp3';
            fetch('/api/v5/audio/upload', {
                method: 'POST',
                headers: authHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({ track_id: id, ext: ext, data: b64 })
            }).then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }, function () { return { ok: false, d: {} }; }); })
                .then(function (res) { done(res.ok && res.d.url ? true : false, res.d.url); })
                .catch(function () { done(false); });
        };
        reader.onerror = function () { done(false); };
        reader.readAsDataURL(file);
    }
    function apiDeleteFile(id) {
        fetch('/api/v5/audio/file/' + encodeURIComponent(id), { method: 'DELETE', headers: authHeaders() }).catch(function () {});
    }

    /* ─── مودال ویرایش/تخصیص ─── */
    function openEditModal(t, onDone) {
        var sel = (t.assignedTo || ['site']).slice();
        var overlay = document.createElement('div');
        overlay.className = 'admin-modal-overlay';
        var chips = SECTIONS.map(function (s) {
            var on = sel.indexOf(s.key) >= 0;
            return '<label class="aa-chip' + (on ? ' on' : '') + '" data-key="' + esc(s.key) + '"><input type="checkbox"' + (on ? ' checked' : '') + '>' + esc(s.label) + '</label>';
        }).join('');
        overlay.innerHTML =
            '<div class="admin-modal" style="max-width:520px;">' +
            '<style>.aa-chip{display:inline-flex;align-items:center;gap:5px;padding:5px 9px;margin:3px;border:1px solid var(--line-strong);border-radius:8px;font-size:12px;cursor:pointer;color:var(--ink-dim)}.aa-chip.on{background:rgba(221,192,112,.14);color:var(--gold-200);border-color:var(--gold-400,#ddc070)}.aa-chip input{width:auto}</style>' +
            '<div class="admin-modal-header"><h3>✏️ ویرایش صدا</h3><button class="admin-modal-close" id="aaClose">✕</button></div>' +
            '<div class="admin-modal-body">' +
            '<div class="admin-form-row"><label>نام</label><input class="admin-input" id="aaEName" value="' + esc(t.name) + '"></div>' +
            '<div class="admin-form-row"><label>آیکون</label><input class="admin-input" id="aaEIcon" maxlength="4" value="' + esc(t.icon || '🎵') + '" style="width:70px;"></div>' +
            '<div class="admin-form-row"><label>بخش‌های پخش</label><div id="aaChips" style="line-height:2.2;">' + chips + '</div></div>' +
            '</div>' +
            '<div class="admin-modal-footer"><button class="admin-btn" id="aaCancel">انصراف</button><button class="admin-btn admin-btn-primary" id="aaSave">💾 ذخیره</button></div>' +
            '</div>';
        document.body.appendChild(overlay);
        setTimeout(function () { overlay.classList.add('visible'); }, 10);
        function close() { overlay.classList.remove('visible'); setTimeout(function () { overlay.remove(); }, 260); }
        overlay.querySelectorAll('.aa-chip').forEach(function (c) {
            c.addEventListener('click', function (e) {
                if (e.target.tagName !== 'INPUT') { var cb = c.querySelector('input'); cb.checked = !cb.checked; }
                c.classList.toggle('on', c.querySelector('input').checked);
            });
        });
        document.getElementById('aaClose').onclick = close;
        document.getElementById('aaCancel').onclick = close;
        document.getElementById('aaSave').onclick = function () {
            var nm = document.getElementById('aaEName').value.trim();
            if (!nm) { toast('نام لازم است', 'error'); return; }
            t.name = nm;
            t.icon = document.getElementById('aaEIcon').value.trim() || '🎵';
            var chosen = [];
            overlay.querySelectorAll('.aa-chip input:checked').forEach(function (cb) {
                chosen.push(cb.closest('.aa-chip').dataset.key);
            });
            t.assignedTo = chosen.length ? chosen : ['site'];
            saveTracks(function () { close(); onDone && onDone(); });
        };
    }

    window.AudioAdmin = { render: render, refresh: function (c) { render(c); } };
})();
