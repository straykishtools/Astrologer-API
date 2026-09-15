/* ================================================================
   KINETICS-UI (installer micro) — لایهٔ نمایشیِ افزوده روی عناصر موجود.
   هیچ منطقی از script.js را تغییر نمی‌دهد؛ فقط با delegation / observer
   کلاس‌ها و عناصر تزریق می‌کند. مستقل از موتور kinetics.js کار می‌کند.
   افکت‌ها: ripple · shine · border-beam · tab-pill · underline-draw ·
   odometer · success-check · wave-dots · progress-ring · aurora.
   همه try/catch + prefers-reduced-motion. بدون حلقهٔ observer.
   ================================================================ */
(function () {
'use strict';

var REDUCE = false;
try { REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
function fa(n) { return String(n == null ? '' : n).replace(/[0-9]/g, function (d) { return '۰۱۲۳۴۵۶۷۸۹'[+d]; }); }

/* ── ۱) Ripple — موج نور از نقطهٔ کلیک (delegation؛ بدون bind انبوه) ── */
var RIPPLE_SEL = '.btn-primary, .btn-action, .qol-btn-primary, .yoga-breath-card-btn, .co-chat-btn, .st-btn';
function initRipple() {
    document.addEventListener('pointerdown', function (e) {
        if (REDUCE || !e.target || !e.target.closest) return;
        var el = e.target.closest(RIPPLE_SEL);
        if (!el) return;
        try {
            var r = el.getBoundingClientRect();
            var size = Math.max(r.width, r.height) || 40;
            var rip = document.createElement('span');
            rip.className = 'kx-rip';
            rip.style.width = rip.style.height = size + 'px';
            var px = (e.clientX != null ? e.clientX : r.left + r.width / 2) - r.left - size / 2;
            var py = (e.clientY != null ? e.clientY : r.top + r.height / 2) - r.top - size / 2;
            rip.style.left = px + 'px'; rip.style.top = py + 'px';
            el.classList.add('kx-ripple');
            el.appendChild(rip);
            setTimeout(function () { if (rip.parentNode) rip.remove(); }, 650);
        } catch (err) {}
    }, { passive: true });
}

/* ── ۲) Shine Sweep — فقط دکمه‌های اصلی ── */
function markShine() {
    document.querySelectorAll('.btn-primary, #payBtn, .co-chat-btn').forEach(function (b) {
        if (!b.classList.contains('kx-shine')) b.classList.add('kx-shine');
    });
}

/* ── ۳) Tab Pill Glide — قرص لغزان بین تب‌ها (.tab-nav > .tab-btn) ── */
function initPill() {
    document.querySelectorAll('.tab-nav').forEach(function (nav) {
        if (nav._kxPill) return;
        nav._kxPill = true;
        var pill = document.createElement('span');
        pill.className = 'kx-pill';
        nav.insertBefore(pill, nav.firstChild);
        function place(animate) {
            var act = nav.querySelector('.tab-btn.active');
            if (!act) { nav.classList.remove('kx-pill-on'); return; }
            if (!animate) pill.style.transition = 'none';
            pill.style.left = act.offsetLeft + 'px';
            pill.style.top = act.offsetTop + 'px';
            pill.style.width = act.offsetWidth + 'px';
            pill.style.height = act.offsetHeight + 'px';
            if (!nav.classList.contains('kx-pill-on')) nav.classList.add('kx-pill-on');
            if (!animate) { void pill.offsetWidth; pill.style.transition = ''; }
        }
        nav._kxPlace = function () { place(false); };
        place(false);
        /* فقط تغییر class تب‌ها را می‌پاییم؛ خودِ pill و nav استایل inline
           عوض می‌کنند (نه class) → حلقه نمی‌افتد. */
        new MutationObserver(function () { place(true); })
            .observe(nav, { subtree: true, attributes: true, attributeFilter: ['class'] });
        window.addEventListener('resize', function () { try { place(false); } catch (e) {} });
    });
}

/* ── ۴) Underline Draw — لینک‌های فوتر ── */
function initUnderline() {
    document.querySelectorAll('.site-footer a, .footer-premium a, .sf-legal a').forEach(function (a) {
        if (!a.classList.contains('kx-underline')) a.classList.add('kx-underline');
    });
}

/* ── ۵) Aurora Drift — لایهٔ نورِ محو پشت هدر (بدون دست‌زدن به لوگو) ── */
function initAurora() {
    var head = document.querySelector('.main-header');
    if (head && !head.querySelector('.kx-aurora')) {
        var a = document.createElement('div');
        a.className = 'kx-aurora';
        head.insertBefore(a, head.firstChild);
    }
}

/* ── ۶) Wave Dots — جایگزین ⏳ِ خالیِ کارت‌های داشبورد ──
     فقط المان‌هایی که محتوایشان دقیقاً ⏳ است؛ وقتی داده واقعی برسد
     رندرکنندهٔ اصلی innerHTML را عوض می‌کند و نقطه‌ها خودشان می‌روند. ── */
function initWaveDots() {
    if (REDUCE) return;
    document.querySelectorAll('.mdb-empty').forEach(function (el) {
        if (el.querySelector('.kx-dots') || (el.textContent || '').trim() !== '⏳') return;
        // نقطه‌ها در یک span داخلی — خودِ میزبان دست‌نخورده می‌ماند تا
        // وقتی داده واقعی رسید و innerHTML عوض شد، چیدمان نشکند.
        el.textContent = '';
        var d = document.createElement('span');
        d.className = 'kx-dots';
        d.innerHTML = '<i></i><i></i><i></i>';
        el.appendChild(d);
    });
}

/* ── ۷) Odometer — شمارش اعدادِ عددشناسی داخل #result ──
     فقط عدد صحیحِ تنها (بدون اعشار/٪/:) — کوتاه و بی‌خطر. ── */
function toAscii(t) { return t.replace(/[۰-۹]/g, function (d) { return String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)); }); }
function animateNumber(el, to, dur) {
    if (REDUCE) { el.textContent = fa(to); return; }
    var t0 = null;
    el.classList.add('kx-odometer');
    function step(ts) {
        if (t0 == null) t0 = ts;
        var k = Math.min(1, (ts - t0) / (dur || 760));
        el.textContent = fa(Math.round(to * (1 - Math.pow(1 - k, 3))));
        if (k < 1) requestAnimationFrame(step); else el.textContent = fa(to);
    }
    requestAnimationFrame(step);
}
function scanOdometer(scope) {
    scope.querySelectorAll('b, strong').forEach(function (el) {
        if (el._kxOdo || el.children.length) return;
        var t = (el.textContent || '').trim();
        if (!/^[۰-۹0-9]+$/.test(t)) return;
        var n = parseInt(toAscii(t), 10);
        if (n >= 0 && n <= 999) { el._kxOdo = true; animateNumber(el, n); }
    });
}

/* ── ۸) Progress Ring — فقط با علامتِ صریح data-kx-pct (بدون حدس) ── */
function buildRing(host, pct) {
    pct = Math.max(0, Math.min(100, parseInt(pct, 10) || 0));
    var box = document.createElement('div');
    box.className = 'kx-pring';
    box.innerHTML = '<svg viewBox="0 0 100 100"><circle class="kx-pbg" cx="50" cy="50" r="46"></circle>'
        + '<circle class="kx-pfg" cx="50" cy="50" r="46"></circle></svg>'
        + '<div class="kx-plabel"><b>' + fa(pct) + '٪</b><span>سازگاری</span></div>';
    host.appendChild(box);
    requestAnimationFrame(function () {
        box.querySelector('.kx-pfg').style.strokeDashoffset = (289 * (1 - pct / 100)).toFixed(1);
    });
}
function scanRings(scope) {
    scope.querySelectorAll('[data-kx-pct]').forEach(function (el) {
        if (el._kxRing) return;
        el._kxRing = true;
        buildRing(el, el.getAttribute('data-kx-pct'));
    });
}

/* ── ۹) Success Check — دکمهٔ ذخیره/چاپ: تیکِ رسم‌شونده ── */
function initSuccessCheck() {
    ['saveBtn', 'printBtn'].forEach(function (id) {
        var btn = document.getElementById(id);
        if (!btn || btn._kxChk) return;
        btn._kxChk = true;
        btn.addEventListener('click', function () {
            if (btn.querySelector('.kx-check')) return;
            try {
                var span = document.createElement('span');
                span.className = 'kx-check';
                span.setAttribute('aria-hidden', 'true');
                span.innerHTML = '<svg viewBox="0 0 52 52"><circle class="kx-ring" cx="26" cy="26" r="24"/>'
                    + '<path class="kx-tick" d="M15 27l7 7 15-15"/></svg>';
                btn.insertBefore(span, btn.firstChild);
                requestAnimationFrame(function () { span.classList.add('done'); });
                setTimeout(function () { if (span.parentNode) span.remove(); }, 1700);
            } catch (e) {}
        });
    });
}

/* ── Watcher نتیجه — بعد از رسیدن هر نتیجه، odometer/ring را اعمال کن ── */
function initResultWatcher() {
    var res = document.getElementById('result');
    if (!res) return;
    function sweep() { try { scanOdometer(res); scanRings(document); } catch (e) {} }
    new MutationObserver(function (muts) {
        for (var i = 0; i < muts.length; i++) { if (muts[i].addedNodes.length) { sweep(); return; } }
    }).observe(res, { childList: true, subtree: true });
    setTimeout(sweep, 400);
}

/* ── Expose — برای اتصالِ ارادی از جاهای دیگر (بدون اجبار) ── */
window.KineticsUI = {
    ring: buildRing, odometer: animateNumber, wave: function (el) { el.classList.add('kx-dots'); if (!el.querySelector('i')) el.innerHTML = '<i></i><i></i><i></i>'; },
    burst: function (el) { if (window.Kinetics && Kinetics.burst) Kinetics.burst(el); },
    beam: function (el) { el.classList.add('kx-beam'); },   /* نور دور-لبه، اختیاری */
    float: function (el) { el.classList.add('kx-float'); }, /* معلق، اختیاری */
    orb: function (el) { el.classList.add('kx-orb'); }      /* هاله نفس‌کش، اختیاری */
};

function applyAll() { try { markShine(); initPill(); initUnderline(); initAurora(); initWaveDots(); } catch (e) {} }
function boot() {
    try { initRipple(); } catch (e) {}
    applyAll();
    try { initResultWatcher(); initSuccessCheck(); } catch (e) {}
    window.addEventListener('hashchange', function () { setTimeout(applyAll, 240); });
    window.addEventListener('load', function () { setTimeout(applyAll, 300); });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
})();
