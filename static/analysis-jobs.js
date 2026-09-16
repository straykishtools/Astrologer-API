/* ================================================================
   ANALYSIS-JOBS — تفسیر چارت به‌صورت job ماندگار سمت سرور
   • هر «تاریخ تولد» = یک job (کلید). ورود دوباره به تب چارت →
     موتورهای محاسباتی (سریع) دوباره اجرا می‌شوند، ولی تفسیر AI
     از روی کشِ کلید بازنمی‌شود: اگر قبلاً نوشته شده، همان نشان
     داده می‌شود؛ اگر در حال نوشتن است، همان job ادامه می‌یابد.
   • poll در پس‌زمینه — حتی بعد از رفرش/رفتن به تب دیگر
   • آماده که شد: نوتیف + زنگ 🔔 + چشمک عنوان
   • چارتِ تاریخِ‌دیگر که زده شود: اگر تفسیر قبلی آمادهٔ ثبت‌نشده
     باشد، اول می‌پرسد (⭐ثبت در پروفایل / 💾ذخیره فایل)
   وابستگی‌ها (window global از script.js / auth-panel.js):
   showToast, getGuestFingerprint, _profileToken, buildVedicSummary
   ================================================================ */
(function () {
'use strict';

var LS_STATE = 'cosmic_job_state';   // job جاری/نمایش‌شده
var LS_MAP   = 'cosmic_job_map';     // {key: {id,status,html,saved,notified,title,startedAt}}
var POLL_MS = 5000, MAP_MAX = 5;
var timer = null;

function token() {
    try { return (window._profileToken && window._profileToken()) || localStorage.getItem('cosmic_token') || ''; } catch (_) { return ''; }
}
function authHeaders() {
    var h = { 'Content-Type': 'application/json' };
    var t = token();
    if (t) h['Authorization'] = 'Bearer ' + t;
    else if (window.getGuestFingerprint) h['X-Guest-Fingerprint'] = window.getGuestFingerprint();
    return h;
}
function jload(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (_) { return null; } }
function jsave(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} }
function load() { return jload(LS_STATE) || {}; }
function save(s) { jsave(LS_STATE, s); }
function loadMap() { return jload(LS_MAP) || {}; }
function mapSet(key, ent) {
    var m = loadMap();
    m[key] = ent;
    var keys = Object.keys(m);
    while (keys.length > MAP_MAX) { delete m[keys.shift()]; }
    jsave(LS_MAP, m);
}
function mapGet(key) { return loadMap()[key] || null; }

/* کلید پایدارِ «تاریخ تولد» — فقط بر پایهٔ فیلدهایی که چارت را عوض می‌کنند
   (لحظه + مكان + منطقهٔ زمانی). عمداً نام و شهر حذف شده‌اند: آن‌ها برچسب‌اند
   و لوکال/ساعت یکی باشد، تفسیر یکی است — پیش‌تر نامِ متفاوت باعث job تازه
   و صدازدنِ بی‌مورد AI می‌شد. */
function keyFor(subject) {
    if (!subject) return '';
    var r = function (n) { return Math.round((parseFloat(n) || 0) * 1000); };
    var s = [subject.year, subject.month, subject.day, subject.hour, subject.minute,
             r(subject.latitude), r(subject.longitude), subject.timezone || ''].join('#');
    var h = 0;
    for (var i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h |= 0; }
    return 'k' + (h >>> 0).toString(36);
}
function isLoggedInUser() { return !!token(); }

/* ── ثبت یا ادامهٔ job برای یک کلید تولد ──
   subject (object خامِ buildSubject) برای subject_json فرستاده می‌شود تا
   dropdown «چارت‌های من» در دستگاه دیگر هم بتواند فرم را پر کند. */
function submit(context, vedicData, title, key, subject) {
    key = key || 'k0';
    var ent = mapGet(key);
    if (ent && (ent.status === 'done' || ent.status === 'pending' || ent.status === 'running')) {
        var st = { key: key, id: ent.id, status: ent.status, title: ent.title || title || '',
                   startedAt: ent.startedAt, saved: !!ent.saved, notified: !!ent.notified };
        save(st);
        if (ent.status === 'done') { renderIfOpen(); checkNotify(st, ent); }
        else startPolling();
        return Promise.resolve(st);
    }
    /* مسیر خطای قبلی یا بی‌سابقه → job تازه */
    var stNew = { key: key, id: null, status: 'submitting', title: title || '', startedAt: Date.now(), saved: false, notified: false };
    save(stNew);
    var vedic = '';
    try { vedic = (window.buildVedicSummary ? buildVedicSummary(vedicData) : '') || ''; } catch (_) {}
    var subjStr = '';
    try { subjStr = subject ? JSON.stringify(subject) : ''; } catch (_) {}
    return fetch('/api/v5/analysis-jobs', {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ context: context, vedic_summary: vedic, title: title || '', birth_key: key, subject_json: subjStr })
    })
    .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
    .then(function (res) {
        if (!res.ok || !res.d.job_id) throw new Error((res.d && res.d.detail) || 'ثبت درخواست ناموفق بود');
        stNew.id = res.d.job_id;
        stNew.status = res.d.state || 'pending';
        save(stNew);
        /* reuse سمت سرور: تحلیلِ همین تاریخ قبلاً انجام شده → بدون
           صدازدن AI فوراً نمایش داده می‌شود (حتی اگر localStorage پاک بوده) */
        if (res.d.reused && res.d.state === 'done' && res.d.result_html) {
            mapSet(key, { id: stNew.id, status: 'done', html: res.d.result_html, startedAt: stNew.startedAt, title: title || '', saved: false, notified: false });
            renderIfOpen();
            return stNew;
        }
        mapSet(key, { id: stNew.id, status: stNew.status, startedAt: stNew.startedAt, title: title || '', saved: false, notified: false });
        startPolling();
        return stNew;
    })
    .catch(function (e) {
        stNew.status = 'error'; stNew.error = e.message; save(stNew);
        throw e;
    });
}

function checkNotify(st, ent) {
    if (st.status === 'done' && !st.notified) {
        st.notified = true; save(st);
        mapSet(st.key, Object.assign({}, ent || mapGet(st.key) || {}, { notified: true }));
        notifyReady(st);
    }
}

/* ── polling (برای jobِ جاریِ state) ── */
function startPolling() {
    if (timer) return;
    var tick = function () {
        timer = null;
        var st = load();
        if (!st || !st.id || st.status === 'done' || st.status === 'error') return;
        fetch('/api/v5/analysis-jobs/' + st.id, { headers: authHeaders() })
        .then(function (r) { return r.json(); })
        .then(function (d) {
            st.status = d.status;
            var ent = mapGet(st.key) || { id: st.id, startedAt: st.startedAt, title: st.title, saved: !!st.saved };
            ent.status = d.status;
            if (d.status === 'done') {
                ent.html = d.result_html || '';
                mapSet(st.key, ent);
                renderIfOpen();
                checkNotify(st, ent);
                if (!st.notified) { st.notified = true; save(st); }
            } else if (d.status === 'error' || d.status === 'not_found') {
                st.error = d.error || 'در دسترس نبود';
                ent.status = 'error'; mapSet(st.key, ent);
                renderIfOpen();
                if (!st.notified) {
                    st.notified = true;
                    if (window.showToast) showToast('⚠️ تفسیر چارت ناموفق بود — دوباره امتحان کنید', 'warning');
                }
            }
            save(st);
            if (st.status === 'pending' || st.status === 'running') timer = setTimeout(tick, POLL_MS);
        })
        .catch(function () { if (load().status === 'pending' || load().status === 'running') timer = setTimeout(tick, POLL_MS); });
    };
    timer = setTimeout(tick, 1500);
}

/* ── نمایش در باکس بازِ نتیجه ── */
function renderIfOpen() {
    var box = document.getElementById('deepseek-box');
    if (!box) return;
    var st = load();
    var ent = mapGet(st.key);
    if (!ent) return;
    if (st.status === 'done' && ent.html) {
        box.innerHTML = ent.html + footerBar(st);
        wireFooter(box);
        var t = document.querySelector('#section-deepseek .section-title');
        if (t) t.innerHTML = '<span class="emoji-big">🧠</span> تفسیر چارت';
    } else if (st.status === 'error') {
        box.innerHTML = '<div style="color:#e87474">⚠️ ' + (st.error || 'خطا') + '</div>' +
            '<button type="button" class="analysis-box aj-retry" style="margin-top:10px;padding:8px 18px;border-radius:12px;border:1px solid rgba(221,192,112,.45);background:rgba(16,26,61,.6);color:#f3e5b8;font-family:inherit;font-size:13px;cursor:pointer">🔄 تلاش مجدد</button>';
        var b = box.querySelector('.aj-retry');
        if (b) b.addEventListener('click', function () {
            var ctx = (window.currentContext || '');
            if (ctx) submit(ctx, (window.currentData && window.currentData.vedic_interpretations) || {}, st.title || '', st.key);
        });
    }
}
function footerBar(st) {
    var ent = mapGet(st.key) || {};
    if (ent.saved) return '<div style="margin-top:12px;font-size:12px;color:#7c86a6">✓ این تفسیر ثبت شده است</div>';
    return '<div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">' +
        (isLoggedInUser() ? '<button class="aj-btn analysis-box" data-aj="save" style="padding:8px 16px;border-radius:12px;border:1px solid rgba(221,192,112,.4);background:rgba(63,138,181,.25);color:#f3e5b8;font-family:inherit;font-size:13px;cursor:pointer">⭐ ثبت در پروفایل</button>' : '') +
        '<button class="aj-btn analysis-box" data-aj="file" style="padding:8px 16px;border-radius:12px;border:1px solid rgba(221,192,112,.4);background:none;color:#aab2cd;font-family:inherit;font-size:13px;cursor:pointer">💾 دریافت فایل</button></div>';
}
function wireFooter(box) {
    box.querySelectorAll('[data-aj]').forEach(function (b) {
        b.addEventListener('click', function () {
            var a = b.getAttribute('data-aj');
            if (a === 'save') saveToProfile(function (ok) { if (ok) renderIfOpen(); });
            else if (a === 'file') downloadResult();
        });
    });
}

/* ── نوتیف آماده‌شدن ── */
function notifyReady(st) {
    var title = st && st.title ? ' «' + st.title + '»' : '';
    if (window.showToast) showToast('🔔 تفسیر چارت' + title + ' آماده شد', 'success');
    renderIfOpen();
    if (!document.getElementById('deepseek-box')) showBell();
    try { document.title = '🔔 تفسیر چارت آماده شد — کاسمیک اوراکل'; startBlink(); } catch (_) {}
}
function showBell() {
    injectCss();
    if (document.getElementById('ajBell')) return;
    var b = document.createElement('button');
    b.id = 'ajBell'; b.type = 'button'; b.textContent = '🔔';
    b.title = 'تفسیر چارت آماده است';
    b.style.cssText = 'position:fixed;bottom:18px;left:18px;z-index:3650;width:46px;height:46px;border-radius:50%;border:1px solid rgba(221,192,112,.5);background:rgba(16,26,61,.92);color:#f3e5b8;font-size:20px;cursor:pointer;box-shadow:0 8px 24px -8px rgba(0,0,0,.7);animation:aj-bell 1.6s ease-in-out infinite';
    b.addEventListener('click', function () { openResultModal(); });
    document.body.appendChild(b);
}
var _blinkN = 0, _blinkTimer = null, _origTitle = 'کاسمیک اوراکل';
function startBlink() {
    stopBlink();
    _blinkTimer = setInterval(function () {
        _blinkN++;
        document.title = (_blinkN % 2 ? '🔔 ' : '') + _origTitle;
        if (_blinkN > 20) { document.title = _origTitle; stopBlink(); }
    }, 900);
}
function stopBlink() { if (_blinkTimer) { clearInterval(_blinkTimer); _blinkTimer = null; } }

/* ── CSS + مودال نتیجه ── */
var MODAL_CSS = '.aj-modal{position:fixed;inset:0;z-index:3700;display:none;align-items:center;justify-content:center;background:rgba(5,10,26,.62);backdrop-filter:blur(6px)}.aj-modal.open{display:flex}.aj-card{width:min(680px,92vw);max-height:82vh;display:flex;flex-direction:column;gap:12px;background:var(--co-panel,rgba(16,26,61,.97));border:1px solid var(--co-line-strong,rgba(221,192,112,.4));border-radius:18px;padding:18px;box-shadow:0 24px 70px -22px rgba(0,0,0,.75);animation:aj-in .35s cubic-bezier(.16,1,.3,1)}@keyframes aj-in{from{opacity:0;transform:translateY(14px) scale(.97)}to{opacity:1;transform:none}}@keyframes aj-bell{0%,100%{transform:scale(1)}50%{transform:scale(1.12)}}.aj-head{display:flex;align-items:center;gap:10px}.aj-head b{flex:1;font-size:14px;color:var(--co-gold-200,#f3e5b8)}.aj-x{width:26px;height:26px;border-radius:50%;border:1px solid rgba(221,192,112,.2);background:none;color:#aab2cd;cursor:pointer}.aj-body{overflow-y:auto;padding-inline-start:4px}.aj-foot{display:flex;gap:8px;flex-wrap:wrap}.aj-btn2{padding:8px 16px;border-radius:12px;border:1px solid rgba(221,192,112,.4);background:rgba(63,138,181,.25);color:#f3e5b8;font-family:inherit;font-size:13px;cursor:pointer;transition:.2s}.aj-btn2:hover{filter:brightness(1.15)}.aj-btn2--ghost{background:none}';
function injectCss() { if (document.getElementById('aj-css')) return; var s = document.createElement('style'); s.id = 'aj-css'; s.textContent = MODAL_CSS; document.head.appendChild(s); }

function getHtml(key) { var ent = mapGet(key || load().key); return (ent && ent.html) || ''; }

function openResultModal() {
    injectCss();
    var st = load();
    var html = getHtml();
    if (!html) return;
    stopBlink(); document.title = _origTitle;
    var bell = document.getElementById('ajBell'); if (bell) bell.remove();
    var m = document.getElementById('ajModal');
    if (!m) { m = document.createElement('div'); m.className = 'aj-modal'; m.id = 'ajModal'; document.body.appendChild(m); }
    var btns = '';
    var ent = mapGet(st.key) || {};
    if (isLoggedInUser() && !ent.saved) btns += '<button class="aj-btn2" data-a="save">⭐ ثبت در پروفایل</button>';
    btns += '<button class="aj-btn2" data-a="file">💾 دریافت فایل</button><button class="aj-btn2 aj-btn2--ghost" data-a="close">بستن</button>';
    m.innerHTML = '<div class="aj-card"><div class="aj-head"><b>🧠 تفسیر چارت' + (st.title ? ' — ' + st.title : '') + '</b><button class="aj-x" id="ajX">✕</button></div><div class="aj-body analysis-box">' + html + '</div><div class="aj-foot">' + btns + '</div></div>';
    m.classList.add('open');
    m.onclick = function (e) { if (e.target === m) m.classList.remove('open'); };
    m.querySelectorAll('[data-a]').forEach(function (b) {
        b.addEventListener('click', function () {
            var a = b.getAttribute('data-a');
            if (a === 'close') m.classList.remove('open');
            else if (a === 'file') downloadResult();
            else if (a === 'save') saveToProfile(function (ok) { if (ok) b.replaceWith(document.createTextNode('✓ ثبت شد')); });
        });
    });
    var x = m.querySelector('#ajX'); if (x) x.addEventListener('click', function () { m.classList.remove('open'); });
}
function downloadResult() {
    var st = load();
    var blob = new Blob(['<html dir="rtl"><head><meta charset="utf-8"><title>تفسیر چارت</title></head><body style="font-family:Vazirmatn,Tahoma;background:#0c1430;color:#dfe4f5;max-width:720px;margin:24px auto;padding:0 16px;line-height:1.9">' + getHtml() + '</body></html>'], { type: 'text/html;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'cosmic-analysis-' + (st.title || 'chart') + '.html';
    document.body.appendChild(a); a.click(); a.remove();
}
function saveToProfile(cb) {
    var st = load(); if (!st || !st.id) return cb(false);
    fetch('/api/v5/analysis-jobs/' + st.id + '/save', { method: 'POST', headers: authHeaders() })
        .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
        .then(function (res) {
            if (res.ok) {
                st.saved = true; save(st);
                var ent = mapGet(st.key) || {}; ent.saved = true; mapSet(st.key, ent);
                if (window.showToast) showToast('⭐ تفسیر در پروفایل شما ثبت شد', 'success');
                cb(true);
            }
            else { if (window.showToast) showToast('⚠️ ' + (res.d.detail || 'ثبت ناموفق'), 'warning'); cb(false); }
        })
        .catch(function () { cb(false); });
}

/* ── گارد «چارت جدید»: تفسیر آمادهٔ ثبت‌نشدهٔ کلیدِ قبلی دور نریزد ── */
function guardNewChart(newKey) {
    return new Promise(function (resolve) {
        var st = load();
        var ent = st.key ? mapGet(st.key) : null;
        var pendingUnsaved = st.status === 'done' && ent && ent.html && !ent.saved && (!newKey || st.key !== newKey);
        if (!pendingUnsaved) { resolve(); return; }
        injectCss();
        var m = document.createElement('div');
        m.className = 'aj-modal open';
        var btns = (isLoggedInUser() ? '<button class="aj-btn2" data-a="save">⭐ ثبت در پروفایل</button>' : '') +
            '<button class="aj-btn2" data-a="file">💾 ذخیره (دریافت فایل)</button>' +
            '<button class="aj-btn2 aj-btn2--ghost" data-a="drop">لازم نیست، چارت جدید</button>';
        m.innerHTML = '<div class="aj-card"><div class="aj-head"><b>🔔 تفسیر چارت قبلی هنوز ثبت نشده</b></div>' +
            '<div class="aj-body" style="font-size:13px;line-height:2;color:#aab2cd">نتیجهٔ تحلیل «' + (st.title || 'بدون نام') + '» آماده است و با چارت جدید از این صفحه می‌رود (در حافظه همین مرورگر می‌ماند). می‌خواهید ثبتش کنید؟</div>' +
            '<div class="aj-foot">' + btns + '</div></div>';
        document.body.appendChild(m);
        function done() { m.remove(); resolve(); }
        m.querySelectorAll('[data-a]').forEach(function (b) {
            b.addEventListener('click', function () {
                var a = b.getAttribute('data-a');
                if (a === 'file') downloadResult();
                else if (a === 'save') { saveToProfile(function () { done(); }); return; }
                else { ent.saved = true; mapSet(st.key, ent); }
                done();
            });
        });
    });
}

/* ── حالت «در حال» برای باکس نتیجه ── */
function busyHtml(key) {
    var ent = key ? mapGet(key) : null;
    if (!ent) {
        var st = load();
        ent = (st.key === key || !key) ? { status: st.status, startedAt: st.startedAt } : null;
    }
    if (ent && ent.status === 'done' && ent.html) return '';   // renderIfOpen جاش رو پر می‌کنه
    var elapsed = '';
    if (ent && ent.startedAt) { var s = Math.round((Date.now() - ent.startedAt) / 1000); elapsed = ' (' + s + ' ثانیه)'; }
    return '<span style="color:#5a526e">⏳ در حال محاسبه و دریافت چارت، و نوشتن تفسیر کامل — معمولاً ۲ تا ۴ دقیقه. ' +
        'می‌توانید از سایت خارج شوید یا چارت دیگری بزنید؛ هنگام آماده شدن خبرتان می‌کنم' + elapsed + '…</span>';
}
function wireBusyShow() {}  /* دکمهٔ نمایش حذف شد — نتیجه خودش جای box می‌آید */

/* ── راه‌اندازی: ادامهٔ jobهای بازمانده بعد از رفرش ── */
function boot() {
    var m = loadMap();
    var anyPending = false;
    Object.keys(m).forEach(function (k) {
        var e = m[k];
        if (e.status === 'pending' || e.status === 'running') anyPending = true;
        if (e.status === 'done' && !e.notified) {
            e.notified = true; mapSet(k, e);
            notifyReady({ key: k, title: e.title });
        }
    });
    var st = load();
    if (st && st.id && (st.status === 'pending' || st.status === 'running') || anyPending) startPolling();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();

window.AnalysisJobs = {
    submit: submit, guardNewChart: guardNewChart, busyHtml: busyHtml,
    renderIfOpen: renderIfOpen, wireBusyShow: wireBusyShow,
    keyFor: keyFor, getHtml: getHtml, openResultModal: openResultModal,
    state: load, mapGet: mapGet
};
})();
