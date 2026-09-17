/* pwa-install.js — دکمه‌ی شناور «نصب اپ» + یادآور بازدید دوم + راهنمای iOS.
   هیچ منطق دیگری را دست نمی‌زند. مستقل از script.js کار می‌کند.
   • اولین بازدید: مخفی
   • بازدید دوم به بعد: badge روی دکمه
   • کلیک: prompt Chrome/Edge یا راهنمای iOS
   • بعد از نصب موفق: مخفی + toast
   • ثبت service worker در اولین فرصت
*/
(function () {
'use strict';

if (window.__akhtarPwaBound) return;
window.__akhtarPwaBound = true;

var REDUCE = false;
try { REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
var STANDALONE = false;
try { STANDALONE = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true; } catch (e) {}
var IS_IOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
var IS_SAFARI = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

var VISITS_KEY = 'akhtar_visits';
var DISMISSED_KEY = 'akhtar_install_dismissed';

/* ── بازدید را شمارش کن؛ اگر قبلاً dismiss شده، احترام بگذار ── */
function bumpVisits() {
    var n = 0;
    try { n = parseInt(localStorage.getItem(VISITS_KEY) || '0', 10) || 0; } catch (e) {}
    n += 1;
    try { localStorage.setItem(VISITS_KEY, String(n)); } catch (e) {}
    return n;
}
function wasDismissed() {
    try { return localStorage.getItem(DISMISSED_KEY) === '1'; } catch (e) { return false; }
}
function dismiss() {
    try { localStorage.setItem(DISMISSED_KEY, '1'); } catch (e) {}
}

/* ── Service Worker ── */
function registerSW() {
    if (!('serviceWorker' in navigator)) return;
    if (location.protocol !== 'http:' && location.protocol !== 'https:') return;
    // فقط در آدرس‌های «واقعی» ثبت کن، نه file://
    navigator.serviceWorker.register('/static/sw.js').catch(function () { /* ignore */ });
    navigator.serviceWorker.addEventListener('controllerchange', function () {
        // اگر نسخه‌ی جدید SW فعال شد، یک بار صفحه را soft-reload کن
        // (به‌صورت خاموش، فقط اگر قبلاً کاربر با سایت آشنا باشد)
        try {
            if (window.__akhtarReloadOnce) return;
            window.__akhtarReloadOnce = true;
            // soft: فقط اگر صفحه قبلاً کامل لود شده
            setTimeout(function () { try { location.reload(); } catch (e) {} }, 1500);
        } catch (e) {}
    });
}

/* ── دکمه ── */
var btn, badge, tip;
function build() {
    btn = document.createElement('button');
    btn.className = 'akhtar-pwa-btn';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'نصب اپ اختر');
    btn.title = 'نصب اپ';
    btn.innerHTML =
        '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">'
        + '<path d="M12 3 V14 M7 10 L12 15 L17 10 M5 19 H19" fill="none" stroke="currentColor" '
        + 'stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
        + '</svg>';
    badge = document.createElement('span');
    badge.className = 'akhtar-pwa-badge';
    badge.setAttribute('aria-hidden', 'true');
    btn.appendChild(badge);
    document.body.appendChild(btn);
    btn.addEventListener('click', onClick);
}

/* ── Toast ── */
function toast(msg) {
    var t = document.createElement('div');
    t.className = 'akhtar-pwa-toast';
    t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(function () { t.classList.add('show'); });
    setTimeout(function () {
        t.classList.remove('show');
        setTimeout(function () { if (t.parentNode) t.remove(); }, 400);
    }, 2400);
}

/* ── iOS Guide ── */
function showIosGuide() {
    var overlay = document.createElement('div');
    overlay.className = 'akhtar-pwa-ios';
    overlay.innerHTML =
        '<div class="akhtar-pwa-ios-card">'
        + '<h3>نصب در آیفون</h3>'
        + '<p>۱. دکمه‌ی <b>اشتراک‌گذاری</b> پایین صفحه را بزنید.</p>'
        + '<p>۲. گزینه‌ی <b>«افزودن به صفحه‌ی اصلی»</b> را انتخاب کنید.</p>'
        + '<p>۳. نام «اختر» را تأیید کنید و <b>افزودن</b> را بزنید.</p>'
        + '<button class="akhtar-pwa-ios-close" type="button">متوجه شدم</button>'
        + '</div>';
    document.body.appendChild(overlay);
    requestAnimationFrame(function () { overlay.classList.add('show'); });
    overlay.addEventListener('click', function (e) {
        if (e.target === overlay || e.target.classList.contains('akhtar-pwa-ios-close')) {
            overlay.classList.remove('show');
            setTimeout(function () { if (overlay.parentNode) overlay.remove(); }, 300);
            dismiss();
        }
    });
}

/* ── کلیک ── */
var deferredPrompt = null;
window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;
    // دکمه آماده‌ی prompt است
    if (btn) btn.classList.add('akhtar-pwa-ready');
});
window.addEventListener('appinstalled', function () {
    if (btn) btn.style.display = 'none';
    toast('اختر نصب شد. خوش آمدید.');
});

function onClick() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(function (res) {
            if (res && res.outcome === 'accepted') {
                dismiss();
            }
            deferredPrompt = null;
        });
        return;
    }
    if (IS_IOS) {
        showIosGuide();
        return;
    }
    // دسکتاپ/اندروید فاقد prompt: توضیح ساده
    toast('از منوی مرورگر گزینه‌ی «افزودن به صفحه‌ی اصلی» یا «نصب اپ» را بزنید.');
    dismiss();
}

/* ── boot ── */
function boot() {
    // اگر قبلاً standalone است، چیزی نشان نده
    if (STANDALONE) { registerSW(); return; }
    if (wasDismissed()) { registerSW(); return; }

    build();
    var visits = bumpVisits();
    if (visits >= 2) btn.classList.add('akhtar-pwa-hint'); // badge
    if (IS_IOS) btn.classList.add('akhtar-pwa-ios-mark');
    if (deferredPrompt) btn.classList.add('akhtar-pwa-ready');

    registerSW();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
})();
