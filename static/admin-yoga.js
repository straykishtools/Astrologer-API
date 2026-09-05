/* ═══════════════════════════════════════════════════════════
   Admin Yoga — مدیریت تمرین‌ها و مربی‌های یوگا (ادمین)
   برای static/admin.html — از API واقعی /api/v5/yoga/*
   ═══════════════════════════════════════════════════════════ */
(function () {
    'use strict';

    var TOKEN_KEY = 'cosmic_token';
    var USER_KEY = 'cosmic_user';

    function token() { try { return localStorage.getItem(TOKEN_KEY) || ''; } catch (e) { return ''; } }
    function me() { try { return JSON.parse(localStorage.getItem(USER_KEY) || '{}'); } catch (e) { return {}; } }

    var TIER_FA = { free: 'رایگان', gold: 'طلایی', diamond: 'الماسی' };
    var LEVEL_FA = { beginner: 'مبتدی', intermediate: 'متوسط', expert: 'پیشرفته', advanced: 'پیشرفته' };
    var SOURCE_FA = { seed: 'پیش‌فرض', manual: 'دستی', xml: 'آپلود XML' };

    function fmtDateFa(iso) {
        if (!iso) return '—';
        try { return new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(iso)); }
        catch (e) { return String(iso).slice(0, 10); }
    }
    /* نشان منشأ تمرین + نام فایل + تاریخ ایجاد (تاریخچه واردات) */
    function sourceCellHtml(p) {
        var src = p.source || 'seed';
        var chipCls = 'rgba(110,207,151,.12);color:#6fcf97';       // xml = سبز
        if (src === 'manual') chipCls = 'rgba(159,212,224,.12);color:#9fd4e0';
        if (src === 'seed') chipCls = 'rgba(170,178,205,.12);color:var(--ink-dim)';
        var html = '<span class="admin-plan-badge" style="background:' + chipCls + '">' +
            (src === 'xml' ? '📄 ' : src === 'manual' ? '🖐️ ' : '🌱 ') + esc(SOURCE_FA[src] || src) + '</span>';
        if (p.source_file) {
            html += '<div title="فایل مبدأ" dir="ltr" style="font-size:11px;color:var(--ink-dim);text-align:right;overflow:hidden;text-overflow:ellipsis;max-width:150px;white-space:nowrap">' + esc(p.source_file) + '</div>';
        }
        html += '<div style="font-size:11px;color:var(--ink-dim);margin-top:1px;white-space:nowrap">' + fmtDateFa(p.created_at) + '</div>';
        return html;
    }

    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }
    function faNum(n) {
        var d = '۰۱۲۳۴۵۶۷۸۹';
        return String(n == null ? '' : n).replace(/\d/g, function (x) { return d[+x]; });
    }
    function showToast(msg, isErr) {
        var t = document.createElement('div');
        t.className = 'admin-toast' + (isErr ? ' admin-toast-error' : '');
        t.textContent = msg;
        document.body.appendChild(t);
        setTimeout(function () { t.classList.add('visible'); }, 10);
        setTimeout(function () { t.classList.remove('visible'); setTimeout(function () { t.remove(); }, 300); }, 2600);
    }
    function errMsg(e) { return (e && e.message) ? e.message : String(e); }

    // ─── نمایش خطاهای خط‌به‌خط XML/JSON (پاسخ parse-xml / validate-steps) ───
    // با withJump=true هر خطا قابل کلیک است و به همان خط در نمایشگر فایل XML می‌پرد
    function xmlErrorsHtml(errors, withJump, kindLabel) {
        kindLabel = kindLabel || 'فایل XML';
        var total = errors.length;
        var shown = errors.slice(0, 8);
        var rows = shown.map(function (er) {
            var lineFa = faNum(er.line || 0);
            var src = er.source ? esc(er.source) : '';
            var caret = '';
            if (er.column > 0 && src) {
                // expat ستون را «پس از» کاراکتر قبلی گزارش می‌دهد؛ برچسب از ستون column+1 شروع می‌شود
                var pad = Array(Math.max(0, er.column) + 1).join('&nbsp;');
                caret = '<div style="padding:0 8px 5px;font-family:monospace;direction:ltr;text-align:left;font-size:11px;line-height:1.2;white-space:pre">' + pad + '^</div>';
            }
            var jumpAttr = '';
            var jumpLink = '';
            if (withJump && er.line > 0) {
                jumpAttr = ' data-xml-line="' + er.line + '"';
                jumpLink = '<span style="color:#8ab4ff;font-size:11px;margin-right:8px">⤷ برو به خط</span>';
            }
            return '<div style="padding:6px 10px;border-top:1px solid rgba(255,118,117,.15)' + (withJump ? ';cursor:pointer' : '') + '"' + jumpAttr + ' title="' + (withJump ? 'کلیک برای پرش به خط' : '') + '">' +
                '<div style="color:#ff7675;font-size:12px;line-height:1.7">⚠️ خط ' + lineFa +
                    (er.column ? '، ستون ' + faNum(er.column) : '') + ': ' + esc(er.message) + jumpLink + '</div>' +
                (src ? '<div style="margin:3px 0 0;padding:4px 8px;background:rgba(0,0,0,.35);border-radius:6px;font-family:monospace;direction:ltr;text-align:left;font-size:11px;color:#e6d9b8;line-height:1.5;white-space:pre;overflow-x:auto">' + src + '</div>' + caret : '') +
                '</div>';
        }).join('');
        var more = total - shown.length;
        return '<div style="margin-top:8px;border:1px solid rgba(255,118,117,.4);border-radius:10px;background:rgba(255,118,117,.07);overflow:hidden;text-align:right">' +
            '<div style="padding:7px 10px;color:#ff7675;font-weight:700;font-size:12px">❌ ' +
                (total === 1 ? 'یک خطا در ' + kindLabel + ' پیدا شد' : faNum(total) + ' خطا در ' + kindLabel + ' پیدا شد') + '</div>' +
            rows +
            (more > 0 ? '<div style="padding:5px 10px;color:#b9957d;font-size:11px">و ' + faNum(more) + ' خطای دیگر…</div>' : '') +
            '</div>';
    }

    function api(method, path, body) {
        var opts = { method: method, headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token() } };
        if (body !== undefined) opts.body = JSON.stringify(body);
        return fetch('/api/v5/yoga' + path, opts).then(function (r) {
            return r.json().catch(function () { return {}; }).then(function (data) {
                if (!r.ok) {
                    var d = data.detail;
                    var err = new Error(typeof d === 'string' ? d : ((d && d.message) || ('خطا ' + r.status)));
                    if (d && d.errors) err.errors = d.errors;
                    throw err;
                }
                return data;
            });
        });
    }

    var panel = null;
    var instructors = [];
    var practices = [];
    var backgrounds = [];

    function isAdmin() { return !!(me().is_admin); }

    function loadAll() {
        return Promise.all([
            api('GET', '/instructors').catch(function () { return { items: [] }; }),
            api('GET', '/practices').catch(function () { return { items: [] }; }),
        ]).then(function (res) {
            instructors = res[0].items || [];
            practices = res[1].items || [];
        }).then(function () {
            // فهرست پس‌زمینه‌ها برای انتخاب محیط تمرین
            return fetch('/static/yoga-data/backgrounds.json').then(function (r) { return r.ok ? r.json() : []; })
                .catch(function () { return []; }).then(function (list) { backgrounds = list || []; });
        });
    }

    function bgOpts(selected) {
        var opts = '<option value="Home">Home (پیش‌فرض)</option>';
        (backgrounds || []).forEach(function (b) {
            if (b.name === 'Home') return;
            opts += '<option value="' + esc(b.name) + '"' + (selected === b.name ? ' selected' : '') + '>' +
                esc(b.name) + (b.locked ? ' 🔒' : '') + '</option>';
        });
        return opts;
    }

    function render() {
        var box = document.getElementById('yogaAdminPanel');
        if (!box) return;
        panel = box;
        if (!token()) { box.innerHTML = '<p class="admin-page-sub">⚠ برای مدیریت یوگا ابتدا وارد شوید.</p>'; return; }
        if (!isAdmin()) { box.innerHTML = '<p class="admin-page-sub">⚠ این بخش فقط برای مدیران است. (پروفایل شما ادمین نیست)</p>'; return; }

        box.innerHTML =
            '<div class="admin-tabs">' +
                '<button class="admin-tab active" data-ytab="practices">🧘 تمرین‌ها</button>' +
                '<button class="admin-tab" data-ytab="instructors">👨‍🏫 مربی‌ها</button>' +
            '</div>' +
            '<div id="yogaAdminPractices"></div>' +
            '<div id="yogaAdminInstructors" style="display:none"></div>';

        bindTabs(box);
        renderPractices();
        renderInstructors();
    }

    function bindTabs(box) {
        box.querySelectorAll('.admin-tab[data-ytab]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                box.querySelectorAll('.admin-tab').forEach(function (b) { b.classList.remove('active'); });
                btn.classList.add('active');
                box.querySelector('#yogaAdminPractices').style.display = btn.getAttribute('data-ytab') === 'practices' ? '' : 'none';
                box.querySelector('#yogaAdminInstructors').style.display = btn.getAttribute('data-ytab') === 'instructors' ? '' : 'none';
            });
        });
    }

    // ─── تمرین‌ها ───
    function renderPractices() {
        var wrap = document.getElementById('yogaAdminPractices');
        if (!wrap) return;
        var rows = practices.map(function (p) {
            var tierOpts = Object.keys(TIER_FA).map(function (k) {
                return '<option value="' + k + '"' + (p.tier === k ? ' selected' : '') + '>' + TIER_FA[k] + '</option>';
            }).join('');
            var instrOpts = '<option value="">— بدون مربی —</option>' + instructors.map(function (i) {
                return '<option value="' + esc(i.id) + '"' + (p.instructor_id === i.id ? ' selected' : '') + '>' + esc(i.name) + '</option>';
            }).join('');
            return '<tr>' +
                '<td><strong>' + esc(p.displayName || p.name) + '</strong><br><span style="color:var(--ink-dim);font-size:11px;direction:ltr">' + esc(p.name) + '</span></td>' +
                '<td>' + (p.locked ? '<span class="admin-plan-badge" style="background:rgba(201,162,39,.15);color:var(--gold-200)">🔒 ' + esc(TIER_FA[p.tier] || p.tier) + '</span>' : '<span class="admin-plan-badge" style="background:rgba(110,207,151,.12);color:#6fcf97">رایگان</span>') + '</td>' +
                '<td><select class="admin-input" data-yp-tier="' + esc(p.name) + '" style="width:110px">' + tierOpts + '</select></td>' +
                '<td><select class="admin-input" data-yp-instr="' + esc(p.name) + '" style="width:130px">' + instrOpts + '</select></td>' +
                '<td>' + faNum((p.durations || []).join('، ')) + ' دقیقه</td>' +
                '<td style="white-space:nowrap">' + sourceCellHtml(p) + '</td>' +
                '<td style="white-space:nowrap">' +
                    '<button class="admin-icon-btn" data-yp-edit="' + esc(p.name) + '" title="ویرایش">✏️</button>' +
                    '<button class="admin-icon-btn admin-icon-btn-danger" data-yp-del="' + esc(p.name) + '" title="حذف">🗑️</button>' +
                '</td>' +
            '</tr>';
        }).join('');
        wrap.innerHTML =
            '<div class="admin-toolbar">' +
                '<span class="admin-page-sub" style="margin:0">' + faNum(practices.length) + ' تمرین</span>' +
                '<button class="admin-btn admin-btn-primary" id="yogaAddPractice">➕ تمرین جدید</button>' +
            '</div>' +
            '<div class="admin-table-wrap"><table class="admin-table"><thead><tr>' +
                '<th>نام</th><th>وضعیت</th><th>سطح اشتراک</th><th>مربی</th><th>مدت‌ها</th><th>منبع و تاریخچه</th><th>عملیات</th>' +
            '</tr></thead><tbody>' + rows + '</tbody></table></div>';

        wrap.querySelector('#yogaAddPractice').addEventListener('click', function () { showPracticeModal(null); });
        wrap.querySelectorAll('[data-yp-tier]').forEach(function (sel) {
            sel.addEventListener('change', function () {
                var name = sel.getAttribute('data-yp-tier');
                api('PUT', '/practices/' + encodeURIComponent(name), { subscription_tier: sel.value })
                    .then(function () { showToast('✅ سطح اشتراک تمرین تغییر کرد'); return loadAll(); })
                    .then(render).catch(function (e) { showToast('❌ ' + errMsg(e), true); });
            });
        });
        wrap.querySelectorAll('[data-yp-instr]').forEach(function (sel) {
            sel.addEventListener('change', function () {
                var name = sel.getAttribute('data-yp-instr');
                api('PUT', '/practices/' + encodeURIComponent(name), { instructor_id: sel.value || null })
                    .then(function () { showToast('✅ مربی تمرین تغییر کرد'); return loadAll(); })
                    .then(render).catch(function (e) { showToast('❌ ' + errMsg(e), true); });
            });
        });
        wrap.querySelectorAll('[data-yp-edit]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var name = btn.getAttribute('data-yp-edit');
                var p = practices.filter(function (x) { return x.name === name; })[0];
                showPracticeModal(p);
            });
        });
        wrap.querySelectorAll('[data-yp-del]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var name = btn.getAttribute('data-yp-del');
                if (!confirm('تمرین «' + name + '» از فهرست خارج شود؟')) return;
                api('DELETE', '/practices/' + encodeURIComponent(name))
                    .then(function () { showToast('🗑️ تمرین غیرفعال شد'); return loadAll(); })
                    .then(render).catch(function (e) { showToast('❌ ' + errMsg(e), true); });
            });
        });
    }

    function showPracticeModal(existing) {
        var p = existing || { name: '', displayName: '', description: '', style: 'hatha', durations: [30], tier: 'free', instructor_id: '' };
        var tierOpts = Object.keys(TIER_FA).map(function (k) {
            return '<option value="' + k + '"' + (p.tier === k ? ' selected' : '') + '>' + TIER_FA[k] + '</option>';
        }).join('');
        var instrOpts = '<option value="">— بدون مربی —</option>' + instructors.map(function (i) {
            return '<option value="' + esc(i.id) + '"' + (p.instructor_id === i.id ? ' selected' : '') + '>' + esc(i.name) + '</option>';
        }).join('');
        var overlay = document.createElement('div');
        overlay.className = 'admin-modal-overlay';
        overlay.innerHTML = '<div class="admin-modal" style="width:560px">' +
            '<div class="admin-modal-header"><h3>' + (existing ? '✏️ ویرایش تمرین: ' + esc(p.name) : '➕ تمرین جدید') + '</h3><button class="admin-modal-close" data-close>✕</button></div>' +
            '<div class="admin-modal-body">' +
                '<div class="admin-form-row"><label>شناسه (انگلیسی، یکتا)</label><input class="admin-input" id="ayName" value="' + esc(p.name) + '" ' + (existing ? 'readonly' : '') + ' dir="ltr"></div>' +
                '<div class="admin-form-row"><label>نام فارسی</label><input class="admin-input" id="ayNameFa" value="' + esc(existing ? (p.displayName === p.name ? '' : p.displayName) : '') + '"></div>' +
                '<div class="admin-form-row"><label>توضیح فارسی</label><textarea class="admin-input" id="ayDesc" rows="2" style="width:100%">' + esc(p.description || '') + '</textarea></div>' +
                '<div class="admin-form-row"><label>سبک</label><select class="admin-input" id="ayStyle" style="width:100%">' +
                    Object.keys({ hatha: 'هاتا', yin: 'یین', vinyasa: 'وینیاسا', flow: 'جریان', power: 'پاور', ashtanga: 'آشتانگا', restorative: 'ترمیمی' }).map(function (k) {
                        return '<option value="' + k + '"' + (p.style === k ? ' selected' : '') + '>' + ({ hatha: 'هاتا', yin: 'یین', vinyasa: 'وینیاسا', flow: 'جریان', power: 'پاور', ashtanga: 'آشتانگا', restorative: 'ترمیمی' })[k] + '</option>';
                    }).join('') +
                '</select></div>' +
                '<div class="admin-form-row"><label>مدت‌ها (دقیقه، با کاما)</label><input class="admin-input" id="ayDurations" value="' + esc((p.durations || [30]).join(', ')) + '" dir="ltr"></div>' +
                '<div class="admin-form-row"><label>سطح اشتراک</label><select class="admin-input" id="ayTier" style="width:100%">' + tierOpts + '</select></div>' +
                '<div class="admin-form-row"><label>مربی</label><select class="admin-input" id="ayInstructor" style="width:100%">' + instrOpts + '</select></div>' +
                '<div class="admin-form-row"><label>🌄 پس‌زمینه‌ی محیط تمرین</label><select class="admin-input" id="ayBackground" style="width:100%">' + bgOpts(p.preferred_background || 'Home') + '</select></div>' +
                '<div class="admin-form-row"><label>📄 آپلود اسکریپت XML (فرمت .session / .txt)</label>' +
                    '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">' +
                        '<input class="admin-input" type="file" id="ayXmlFile" accept=".xml,.session,.txt" style="flex:1;min-width:200px" dir="ltr">' +
                        '<button class="admin-btn" id="ayParseXml" type="button">⚡ پارس و پرشدن فرم</button>' +
                        '<button class="admin-btn" id="ayPreviewXml" type="button" disabled>▶ پیش‌نمایش زنده</button>' +
                        '<button class="admin-btn admin-btn-primary" id="ayCreateFromXml" type="button">🚀 ساخت مستقیم از XML</button>' +
                    '</div>' +
                    '<div style="margin-top:8px;display:flex;gap:8px;align-items:center;flex-wrap:wrap">' +
                        '<button class="admin-btn" id="ayXmlViewerToggle" type="button">📄 نمایش محتوای فایل</button>' +
                        '<span class="admin-page-sub" id="ayXmlViewerInfo"></span>' +
                    '</div>' +
                    '<div id="ayXmlViewerWrap" style="display:none;margin-top:8px;max-height:240px;overflow:auto;background:rgba(0,0,0,.4);border:1px solid var(--line);border-radius:10px;direction:ltr;text-align:left;font-family:monospace;font-size:11px;line-height:1.6"></div>' +
                    '<span class="admin-page-sub" id="ayXmlNote" style="display:block;min-height:16px"></span>' +
                '</div>' +
                '<div class="admin-form-row"><label>دنباله (JSON) — به‌صورت خودکار از XML پر می‌شود، یا دستی</label>' +
                    '<textarea class="admin-input" id="aySteps" rows="6" style="width:100%;font-family:monospace;direction:ltr;text-align:left">' +
                    (existing ? '' : '[{"type":"tempo","duration":4},{"type":"pose","name":"Child Traditional","side":"left"},{"type":"hold","count":5,"phrase":"none","audibleCount":false},{"type":"pose","name":"Corpse","side":"left"},{"type":"hold","count":8,"phrase":"relax","audibleCount":false}]') +
                    '</textarea>' +
                    '<span class="admin-page-sub" id="ayStepsNote" style="display:block;min-height:16px"></span>' +
                '</div>' +
                '<span class="admin-page-sub" id="ayErr" style="color:#ff7675;display:block;min-height:16px"></span>' +
            '</div>' +
            '<div class="admin-modal-footer">' +
                '<button class="admin-btn" data-close>انصراف</button>' +
                '<button class="admin-btn admin-btn-primary" id="aySave">💾 ذخیره</button>' +
            '</div>' +
        '</div>';
        document.body.appendChild(overlay);
        setTimeout(function () { overlay.classList.add('visible'); }, 10);
        var close = function () { overlay.classList.remove('visible'); setTimeout(function () { overlay.remove(); }, 300); };
        overlay.querySelectorAll('[data-close]').forEach(function (b) { b.addEventListener('click', close); });
        overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });

        overlay.querySelector('#aySave').addEventListener('click', function () {
            var err = document.getElementById('ayErr');
            err.textContent = '';
            var name = document.getElementById('ayName').value.trim().toLowerCase();
            var durations = document.getElementById('ayDurations').value.split(',').map(function (s) { return parseInt(s.trim(), 10); }).filter(function (n) { return !isNaN(n) && n > 0; });
            var payload = {
                name_fa: document.getElementById('ayNameFa').value.trim(),
                description_fa: document.getElementById('ayDesc').value.trim(),
                description: document.getElementById('ayDesc').value.trim(),
                style: document.getElementById('ayStyle').value,
                durations: durations.length ? durations : [30],
                subscription_tier: document.getElementById('ayTier').value,
                instructor_id: document.getElementById('ayInstructor').value || null,
                preferred_background: document.getElementById('ayBackground').value || 'Home',
            };
            var steps = null;
            var ready;
            if (existing) {
                ready = Promise.resolve();
            } else {
                var stepsText = document.getElementById('aySteps').value.trim();
                if (!name) { err.textContent = '❌ شناسه الزامی است'; return; }
                if (!stepsText) { err.textContent = '❌ دنباله JSON خالی است — گام‌های تمرین را بنویسید یا XML آپلود کنید'; return; }
                // اعتبارسنجی خط‌به‌خط JSON (همان قالب خطای XML)
                var sn = document.getElementById('ayStepsNote');
                if (sn) sn.innerHTML = '<span class="admin-page-sub">⏳ در حال اعتبارسنجی JSON…</span>';
                ready = api('POST', '/practices/validate-steps', { text: stepsText }).catch(function (e) {
                    if (sn && e && e.errors && e.errors.length) sn.innerHTML = xmlErrorsHtml(e.errors, false, 'JSON گام‌ها');
                    else if (sn) sn.innerHTML = '';
                    if (err) err.textContent = '❌ ' + errMsg(e);
                    throw e;
                }).then(function (v) {
                    if (sn) sn.innerHTML = v && v.count ? '✅ ' + faNum(v.count) + ' گام معتبر است' : '';
                    steps = JSON.parse(stepsText);
                });
            }
            ready.then(function () {
                if (existing) return api('PUT', '/practices/' + encodeURIComponent(name), payload);
                return api('POST', '/practices', Object.assign({ name: name, steps: steps }, payload));
            }).then(function () {
                showToast('✅ تمرین ذخیره شد');
                close();
                return loadAll();
            }).then(render).catch(function (e) {
                // اگر خطا قبلاً نمایش داده شده (اعتبارسنجی)، دوباره ننویس
                if (err && !(e && e.errors && e.errors.length)) err.textContent = '❌ ' + errMsg(e);
            });
        });

        // ─── آپلود XML: پارس و پر کردن فرم ───
        var xmlFile = overlay.querySelector('#ayXmlFile');
        var parseBtn = overlay.querySelector('#ayParseXml');
        var createXmlBtn = overlay.querySelector('#ayCreateFromXml');
        var previewBtn = overlay.querySelector('#ayPreviewXml');
        var xmlNote = overlay.querySelector('#ayXmlNote');
        var parsedInfo = null;   // آخرین نتیجه پارس — برای پیش‌نمایش زنده
        var lastXml = '';        // آخرین محتوای فایل انتخابی — برای نمایشگر فایل
        function fileName() { return (xmlFile && xmlFile.files && xmlFile.files[0]) ? xmlFile.files[0].name : null; }

        function readXmlFile(cb) {
            if (!xmlFile || !xmlFile.files || !xmlFile.files[0]) {
                if (xmlNote) xmlNote.textContent = '⚠ ابتدا فایل XML تمرین را انتخاب کنید';
                return;
            }
            var rd = new FileReader();
            rd.onload = function () { lastXml = rd.result || ''; cb(rd.result); };
            rd.onerror = function () { if (xmlNote) xmlNote.textContent = '❌ خواندن فایل ناموفق بود'; };
            rd.readAsText(xmlFile.files[0]);
        }

        // ─── نمایشگر خام فایل XML: باز/بسته + پرش به خط از روی خطاها ───
        function renderXmlViewer() {
            var wrap = document.getElementById('ayXmlViewerWrap');
            var info = document.getElementById('ayXmlViewerInfo');
            if (!wrap) return;
            if (!lastXml) {
                wrap.innerHTML = '<div style="padding:10px;color:#8b95ad;direction:rtl">⚠ ابتدا فایل XML را انتخاب و پارس کنید</div>';
                if (info) info.textContent = '';
                return;
            }
            var lines = lastXml.split('\n');
            var frag = [];
            for (var li = 0; li < lines.length; li++) {
                frag.push('<div class="ay-xml-line" data-line="' + (li + 1) + '"><span class="ay-xml-num">' + faNum(li + 1) + '</span> ' + esc(lines[li]) + '</div>');
            }
            wrap.innerHTML = frag.join('\n');
            if (info) info.textContent = '— ' + faNum(lines.length) + ' خط —';
        }
        function toggleXmlViewer() {
            var wrap = document.getElementById('ayXmlViewerWrap');
            var btn = document.getElementById('ayXmlViewerToggle');
            if (!wrap) return;
            if (wrap.style.display === 'none') {
                renderXmlViewer();
                wrap.style.display = 'block';
                if (btn) btn.textContent = '🗕 بستن نمایش فایل';
            } else {
                wrap.style.display = 'none';
                if (btn) btn.textContent = '📄 نمایش محتوای فایل';
            }
        }
        function jumpXmlLine(line) {
            var wrap = document.getElementById('ayXmlViewerWrap');
            var btn = document.getElementById('ayXmlViewerToggle');
            if (!wrap || !lastXml) return;
            if (wrap.style.display === 'none') {
                renderXmlViewer();
                wrap.style.display = 'block';
                if (btn) btn.textContent = '🗕 بستن نمایش فایل';
            }
            var hit = wrap.querySelector('.ay-xml-line[data-line="' + line + '"]');
            if (hit) {
                hit.scrollIntoView({ block: 'center', behavior: 'smooth' });
                hit.classList.add('ay-xml-hit');
                setTimeout(function () { hit.classList.remove('ay-xml-hit'); }, 1800);
            }
        }
        var viewerToggle = overlay.querySelector('#ayXmlViewerToggle');
        if (viewerToggle) viewerToggle.addEventListener('click', toggleXmlViewer);
        // کلیک روی ردیف خطای XML -> پرش به همان خط در نمایشگر فایل
        overlay.addEventListener('click', function (e) {
            var lj = e.target.closest('[data-xml-line]');
            if (lj) { jumpXmlLine(parseInt(lj.getAttribute('data-xml-line'), 10)); }
        });

        if (parseBtn) {
            parseBtn.addEventListener('click', function () {
                readXmlFile(function (xml) {
                    if (xmlNote) xmlNote.textContent = '⏳ در حال پارس…';
                    api('POST', '/practices/parse-xml', { xml: xml, source_file: fileName() || undefined }).then(function (d) {
                        if (!d || !d.steps) throw new Error('پاسخ نامعتبر سرور');
                        parsedInfo = d;
                        if (previewBtn) previewBtn.disabled = false;
                        var setId = document.getElementById('ayName');
                        var setNameFa = document.getElementById('ayNameFa');
                        var setStyle = document.getElementById('ayStyle');
                        var setDurs = document.getElementById('ayDurations');
                        var setSteps = document.getElementById('aySteps');
                        if (setId && d.name && (!existing || !setId.value)) setId.value = d.name;
                        if (setNameFa && d.name_en && !/^[\x00-\x7F]+$/.test(d.name_en) && !setNameFa.value) setNameFa.value = d.name_en;
                        if (setStyle) setStyle.value = d.style || 'hatha';
                        if (setDurs) setDurs.value = (d.durations || []).join(', ');
                        if (setSteps) setSteps.value = JSON.stringify(d.steps, null, 1);
                        if (xmlNote) {
                            var warnHtml = (d.warnings && d.warnings.length)
                                ? '<div style="color:#e6c66b;background:rgba(230,198,107,.08);border:1px solid rgba(230,198,107,.3);border-radius:8px;padding:6px 10px;margin:0 0 6px;font-size:12px;line-height:1.8">' +
                                    d.warnings.map(function (w) { return '⚠️ ' + esc(w); }).join('<br>') + '</div>'
                                : '';
                            xmlNote.innerHTML = warnHtml + '✅ ' + faNum(d.pose_count || d.steps.length) + ' گام پارس شد — فرم پر شد';
                        }
                    }).catch(function (e) {
                        if (xmlNote && e && e.errors && e.errors.length) xmlNote.innerHTML = xmlErrorsHtml(e.errors, true);
                        else if (xmlNote) xmlNote.textContent = '❌ ' + errMsg(e);
                    });
                });
            });
        }

        // ─── آپلود XML: پیش‌نمایش زنده قبل از ذخیره ───
        if (previewBtn) {
            previewBtn.addEventListener('click', function () {
                if (!parsedInfo) { showToast('⚠ ابتدا XML را پارس کنید', true); return; }
                var nameFaEl = document.getElementById('ayNameFa');
                var nameFa = nameFaEl ? nameFaEl.value.trim() : '';
                var instSel = document.getElementById('ayInstructor');
                var instName = '';
                if (instSel && instSel.value) {
                    var inst = instructors.filter(function (x) { return x.id === instSel.value; })[0];
                    if (inst) instName = inst.name;
                }
                openPracticePreview(parsedInfo, { nameFa: nameFa, instructorName: instName });
            });
        }

        // ─── آپلود XML: ساخت مستقیم بدون ویرایش دستی گام‌ها ───
        if (createXmlBtn) {
            createXmlBtn.addEventListener('click', function () {
                readXmlFile(function (xml) {
                    if (xmlNote) xmlNote.textContent = '⏳ در حال ساخت تمرین…';
                    var payload = { xml: xml, source_file: fileName() || undefined };
                    var setId = document.getElementById('ayName');
                    var setNameFa = document.getElementById('ayNameFa');
                    var setDesc = document.getElementById('ayDesc');
                    var setTier = document.getElementById('ayTier');
                    var setInstr = document.getElementById('ayInstructor');
                    if (setId && setId.value.trim()) payload.name = setId.value.trim().toLowerCase();
                    if (setNameFa && setNameFa.value.trim()) payload.name_fa = setNameFa.value.trim();
                    if (setDesc && setDesc.value.trim()) payload.description_fa = setDesc.value.trim();
                    if (setTier) payload.subscription_tier = setTier.value;
                    if (setInstr && setInstr.value) payload.instructor_id = setInstr.value;
                    var setBg = document.getElementById('ayBackground');
                    if (setBg && setBg.value) payload.preferred_background = setBg.value;
                    api('POST', '/practices/from-xml', payload).then(function (resp) {
                        showToast('✅ تمرین از XML ساخته شد');
                        if (resp && resp.warnings && resp.warnings.length) {
                            resp.warnings.forEach(function (w) {
                                try { showToast('⚠️ ' + w, true); } catch (e2) {}
                            });
                        }
                        close();
                        return loadAll();
                    }).then(render).catch(function (e) {
                        if (xmlNote && e && e.errors && e.errors.length) xmlNote.innerHTML = xmlErrorsHtml(e.errors, true);
                        else if (xmlNote) xmlNote.textContent = '❌ ' + errMsg(e);
                    });
                });
            });
        }
    }

    // ─── مربی‌ها ───
    function renderInstructors() {
        var wrap = document.getElementById('yogaAdminInstructors');
        if (!wrap) return;
        var rows = instructors.map(function (i) {
            return '<tr>' +
                '<td><strong>' + esc(i.name) + '</strong></td>' +
                '<td>' + esc(i.specialty || '—') + '</td>' +
                '<td>' + esc(LEVEL_FA[i.level] || i.level) + '</td>' +
                '<td style="white-space:nowrap">' +
                    '<button class="admin-icon-btn" data-ay-instr-edit="' + esc(i.id) + '" title="ویرایش">✏️</button>' +
                    '<button class="admin-icon-btn admin-icon-btn-danger" data-ay-instr-del="' + esc(i.id) + '" title="حذف">🗑️</button>' +
                '</td>' +
            '</tr>';
        }).join('');
        wrap.innerHTML =
            '<div class="admin-toolbar">' +
                '<span class="admin-page-sub" style="margin:0">' + faNum(instructors.length) + ' مربی</span>' +
                '<button class="admin-btn admin-btn-primary" id="yogaAddInstructor">➕ مربی جدید</button>' +
            '</div>' +
            '<div class="admin-table-wrap"><table class="admin-table"><thead><tr>' +
                '<th>نام</th><th>تخصص</th><th>سطح</th><th>عملیات</th>' +
            '</tr></thead><tbody>' + rows + '</tbody></table></div>';

        wrap.querySelector('#yogaAddInstructor').addEventListener('click', function () { showInstructorModal(null); });
        wrap.querySelectorAll('[data-ay-instr-edit]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var id = btn.getAttribute('data-ay-instr-edit');
                var i = instructors.filter(function (x) { return x.id === id; })[0];
                showInstructorModal(i);
            });
        });
        wrap.querySelectorAll('[data-ay-instr-del]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var id = btn.getAttribute('data-ay-instr-del');
                if (!confirm('مربی حذف شود؟')) return;
                api('DELETE', '/instructors/' + id)
                    .then(function () { showToast('🗑️ مربی غیرفعال شد'); return loadAll(); })
                    .then(render).catch(function (e) { showToast('❌ ' + errMsg(e), true); });
            });
        });
    }

    function showInstructorModal(existing) {
        var i = existing || { name: '', specialty: '', level: 'intermediate', bio: '' };
        var overlay = document.createElement('div');
        overlay.className = 'admin-modal-overlay';
        overlay.innerHTML = '<div class="admin-modal">' +
            '<div class="admin-modal-header"><h3>' + (existing ? '✏️ ویرایش مربی' : '➕ مربی جدید') + '</h3><button class="admin-modal-close" data-close>✕</button></div>' +
            '<div class="admin-modal-body">' +
                '<div class="admin-form-row"><label>نام</label><input class="admin-input" id="aiName" value="' + esc(i.name) + '"></div>' +
                '<div class="admin-form-row"><label>تخصص</label><input class="admin-input" id="aiSpec" value="' + esc(i.specialty || '') + '"></div>' +
                '<div class="admin-form-row"><label>سطح</label><select class="admin-input" id="aiLevel" style="width:100%">' +
                    ['beginner', 'intermediate', 'expert', 'advanced'].map(function (k) {
                        return '<option value="' + k + '"' + (i.level === k ? ' selected' : '') + '>' + (LEVEL_FA[k] || k) + '</option>';
                    }).join('') +
                '</select></div>' +
                '<div class="admin-form-row"><label>بیو</label><textarea class="admin-input" id="aiBio" rows="3" style="width:100%">' + esc(i.bio || '') + '</textarea></div>' +
                '<span class="admin-page-sub" id="aiErr" style="color:#ff7675;display:block;min-height:16px"></span>' +
            '</div>' +
            '<div class="admin-modal-footer">' +
                '<button class="admin-btn" data-close>انصراف</button>' +
                '<button class="admin-btn admin-btn-primary" id="aiSave">💾 ذخیره</button>' +
            '</div>' +
        '</div>';
        document.body.appendChild(overlay);
        setTimeout(function () { overlay.classList.add('visible'); }, 10);
        var close = function () { overlay.classList.remove('visible'); setTimeout(function () { overlay.remove(); }, 300); };
        overlay.querySelectorAll('[data-close]').forEach(function (b) { b.addEventListener('click', close); });
        overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });

        overlay.querySelector('#aiSave').addEventListener('click', function () {
            var err = document.getElementById('aiErr');
            err.textContent = '';
            var payload = {
                name: document.getElementById('aiName').value.trim(),
                specialty: document.getElementById('aiSpec').value.trim(),
                level: document.getElementById('aiLevel').value,
                bio: document.getElementById('aiBio').value.trim(),
            };
            if (!payload.name) { err.textContent = '❌ نام الزامی است'; return; }
            var req = existing
                ? api('PUT', '/instructors/' + existing.id, payload)
                : api('POST', '/instructors', payload);
            req.then(function () {
                showToast('✅ مربی ذخیره شد');
                close();
                return loadAll();
            }).then(render).catch(function (e) { err.textContent = '❌ ' + errMsg(e); });
        });
    }

    // ═══════════════ پیش‌نمایش زنده تمرین پارس‌شده (XML) ═══════════════
    /* کپی فشرده گام‌ها برای پیش‌نمایش: هر حلقه فقط یک دور، نفس‌ها کوتاه‌تر، تندتر.
       ساختار همان XML اصلی می‌ماند تا پلیر واقعی بتواند آن را اجرا کند. */
    function previewCopy(steps) {
        return (steps || []).map(function (s) {
            var o = {};
            for (var k in s) { if (Object.prototype.hasOwnProperty.call(s, k)) o[k] = s[k]; }
            if (o.type === 'tempo') o.duration = Math.max(1, Math.round((+o.duration || 4) / 4));
            if (o.type === 'hold') o.count = Math.min(+o.count || 1, 2);
            if (o.type === 'loop') {
                if (Array.isArray(o.count)) o.count = [1]; else o.count = 1;
                if (o.steps) o.steps = previewCopy(o.steps);
            }
            if (o.type === 'difficulty' && o.levels) {
                var lv = {};
                Object.keys(o.levels).forEach(function (kk) { lv[kk] = previewCopy(o.levels[kk]); });
                o.levels = lv;
            }
            return o;
        });
    }

    /* اجرای تمرین پارس‌شده در پلیر واقعی یوگا — بدون ذخیره در سوابق */
    function openPracticePreview(parsed, extra) {
        if (!window.YogaSessionPlayer) { showToast('⚠ پلیر یوگا بارگذاری نشده است', true); return; }
        extra = extra || {};
        var head = parsed.head || {};
        var steps = previewCopy(parsed.steps || []);
        if (!steps.length) { showToast('⚠ گام‌های تمرین خالی است', true); return; }
        var name = parsed.name || 'preview';
        var title = extra.nameFa || parsed.name_en || head.name || name;
        var practice = {
            name: name,
            file: name + '.preview',
            head: {
                name: parsed.name_en || head.name || name,
                description: parsed.description || '',
                style: parsed.style || 'hatha',
                durations: (parsed.durations && parsed.durations.length) ? parsed.durations : [30],
                difficulties: parsed.difficulties || [0],
                pose: head.pose || { name: 'Child Traditional', side: 'left' },
            },
            body: { preferredBackgroundName: parsed.preferred_background || 'Home', steps: steps },
        };

        var overlay = document.createElement('div');
        overlay.className = 'admin-modal-overlay';
        overlay.innerHTML =
            '<div class="ay-preview-shell">' +
                '<div class="ay-preview-head">' +
                    '<h3>🧘 پیش‌نمایش: ' + esc(title) + '</h3>' +
                    '<span class="ay-preview-note">فشرده‌شده — با ✖ پایان یا ⏭ بگذرید</span>' +
                    '<button class="admin-modal-close" data-ay-preview-x>✕</button>' +
                '</div>' +
                '<div class="ay-preview-host" id="ayPreviewHost"></div>' +
            '</div>';
        document.body.appendChild(overlay);
        setTimeout(function () { overlay.classList.add('visible'); }, 10);

        var host = overlay.querySelector('#ayPreviewHost');
        var player = null;
        host.innerHTML = '<p class="yp-note">در حال بارگذاری پیش‌نمایش…</p>';

        function closePreview() {
            if (player) { try { player.stop(false); } catch (e) {} player = null; }
            overlay.classList.remove('visible');
            setTimeout(function () { overlay.remove(); }, 300);
        }
        function showDone(completed, elapsed, done, total) {
            host.innerHTML = '<div class="yp-done-modal"><div class="yp-done-card">' +
                '<div class="yp-done-icon">' + (completed ? '🎉' : '⏹') + '</div>' +
                '<h3>' + (completed ? 'پایان پیش‌نمایش' : 'پیش‌نمایش متوقف شد') + '</h3>' +
                '<div class="yp-done-stats">' +
                    '<div class="yp-stat"><b>' + faNum(Math.floor(elapsed / 60)) + '</b><span>دقیقه</span></div>' +
                    '<div class="yp-stat"><b>' + faNum(done) + ' از ' + faNum(total) + '</b><span>حرکت</span></div>' +
                '</div>' +
                '<div class="yp-done-actions"><button class="yp-btn primary" data-ay-preview-x>بستن پیش‌نمایش</button></div>' +
            '</div></div>';
            player = null;
        }

        function startPreview() {
            player = new window.YogaSessionPlayer(practice, {
                level: 'beginner',
                duration: 1,          // پیش‌نمایش: کل مسیر در چند دقیقه مرور می‌شود
                background: practice.body.preferredBackgroundName,
                instructorName: extra.instructorName || '',
                title: title + ' (پیش‌نمایش)',
                container: host,
                onComplete: showDone,
            });
            player._record = function () { return; };  // پیش‌نمایش نباید در سوابق کاربر ثبت شود
            try { if (window.YogaCore && window.YogaCore.load) window.YogaCore.load().catch(function () {}); } catch (e) {}
            player.start();
        }

        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) { closePreview(); return; }
            if (e.target.closest('[data-ay-preview-x]')) { closePreview(); return; }
            var jump = e.target.closest('[data-ay-preview-jump]');
            if (jump && player) {
                try { player._idx = Math.min(player.steps.length, player._idx + 9); player._advance(); } catch (err) {}
                return;
            }
            var ctrl = e.target.closest('[data-yp]');
            if (ctrl && player) {
                var cmd = ctrl.getAttribute('data-yp');
                if (cmd === 'pause') player.pause();
                else if (cmd === 'resume') player.resume();
                else if (cmd === 'skip') player.next();
                else if (cmd === 'prev') player.prev();
                else if (cmd === 'end') { player.stop(false); }
                return;
            }
        });

        if (window.YOGA_DATA && window.YOGA_DATA.whenReady) window.YOGA_DATA.whenReady(startPreview);
        else startPreview();
    }

    window.YogaAdmin = {
        init: function () {
            loadAll().then(render).catch(function (e) {
                var box = document.getElementById('yogaAdminPanel');
                if (box) box.innerHTML = '<p class="admin-page-sub">⚠ ' + esc(errMsg(e)) + '</p>';
            });
        }
    };
})();