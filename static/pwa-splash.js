/* pwa-splash.js — splash کوتاه فقط در حالت standalone.
   خودش یک overlay به body اضافه می‌کند و ۷۰۰ms بعد fade می‌کند.
   بدون نیاز به فایل HTML جدا.
*/
(function () {
'use strict';
if (window.__akhtarSplashDone) return;
window.__akhtarSplashDone = true;

var STANDALONE = false;
try {
    STANDALONE = window.matchMedia('(display-mode: standalone)').matches
              || window.navigator.standalone === true;
} catch (e) {}
if (!STANDALONE) return;

var REDUCE = false;
try { REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

var style = document.createElement('style');
style.textContent =
    '.akhtar-splash{position:fixed;inset:0;z-index:99999;'
    + 'background:radial-gradient(120% 80% at 50% 25%, #1c1638 0%, #070c1f 65%, #050818 100%);'
    + 'display:flex;flex-direction:column;align-items:center;justify-content:center;'
    + 'color:#f3e5b8;font-family:"Vazirmatn",system-ui,sans-serif;'
    + 'opacity:1;transition:opacity .35s ease;pointer-events:none}'
    + '.akhtar-splash.hide{opacity:0}'
    + '.akhtar-splash img{width:30vmin;max-width:220px;height:auto;filter:drop-shadow(0 8px 24px rgba(219,181,92,.4))}'
    + '.akhtar-splash h1{margin:14px 0 0;font-weight:700;font-size:1.4rem;letter-spacing:.04em}'
    + '.akhtar-splash p{margin:6px 0 0;opacity:.7;font-size:.9rem}'
    + (REDUCE ? '.akhtar-splash img{animation:none !important}' : '');
document.head.appendChild(style);

var splash = document.createElement('div');
splash.className = 'akhtar-splash';
splash.setAttribute('aria-hidden', 'true');
splash.innerHTML =
    '<img src="/static/icons/akhtar-wordmark.svg" alt="">'
    + '<h1>اختر</h1>'
    + '<p>رصدخانه‌ی کیهانی</p>';
document.body.appendChild(splash);

function hide() {
    splash.classList.add('hide');
    setTimeout(function () { if (splash.parentNode) splash.remove(); }, 420);
}
// ۷۰۰ms فقط برای REDUCE=off؛ برای REDUCE فوری
setTimeout(hide, REDUCE ? 60 : 700);
})();
