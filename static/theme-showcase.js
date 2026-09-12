/* ================================================================
   COSMIC ORACLE — theme-showcase.js
   رندر محتوای زندهٔ صفحهٔ «قالب بصری» (pageTheme) در index.html:
   • گرید ۸ فاز ماه، ویجت زنده، حلقهٔ پیشرفت (از window.CoMoon)
   • ردیف آیکون‌های فاز ماه + آیکون‌های ابزارها
   • رندر یک‌بار در اولین باز شدن صفحه (showPage('theme'))
   ================================================================ */
var CoThemeShowcase = (function () {
'use strict';

var _done = false;

function render() {
    if (!window.CoMoon) return;
    var now = Date.now();

    /* گرید ۸ فاز */
    var grid = document.getElementById('tpMoonGrid');
    if (grid && !grid.dataset.filled) { grid.dataset.filled = '1'; grid.innerHTML = CoMoon.phaseGrid(); }

    /* ویجت زنده */
    var live = document.getElementById('tpMoonLive');
    if (live && !live.dataset.filled) { live.dataset.filled = '1'; live.innerHTML = CoMoon.todayWidget(); }

    /* دایرهٔ کوچک کارت قمری */
    var demo = document.getElementById('tpDemoMoonDisc');
    if (demo && !demo.dataset.filled) {
        demo.dataset.filled = '1';
        demo.innerHTML = CoMoon.discSVG(CoMoon.phaseFromNow(now), { size: 72, glow: true });
    }

    /* حلقهٔ پیشرفت */
    var ring = document.getElementById('tpMoonRingDemo');
    if (ring && !ring.dataset.filled) {
        ring.dataset.filled = '1';
        ring.innerHTML = CoMoon.discSVG(CoMoon.phaseFromNow(now), { size: 120, ring: true });
    }

    /* آیکون‌های فاز ماه */
    var moonRow = document.getElementById('tpMoonIconRow');
    if (moonRow && !moonRow.dataset.filled) {
        moonRow.dataset.filled = '1';
        var moonIcons = [
            ['new', 'ماه نو 🌑'], ['waxing-crescent', 'هلالِ رشد 🌒'], ['first-quarter', 'تربیع اول 🌓'],
            ['waxing-gibbous', 'محدبِ رشد 🌔'], ['full', 'ماه کامل 🌕'], ['waning-gibbous', 'محدبِ زوال 🌖'],
            ['last-quarter', 'تربیع آخر 🌗'], ['waning-crescent', 'هلالِ زوال 🌘']
        ];
        moonRow.innerHTML = moonIcons.map(function (m) {
            return '<div class="icon-cell"><img src="static/images/ui/moon-' + m[0] + '.svg" alt=""><span>' + m[1] + '</span></div>';
        }).join('');
    }

    /* آیکون‌های ابزارها */
    var iconGrid = document.getElementById('tpUiIconGrid');
    if (iconGrid && !iconGrid.dataset.filled) {
        iconGrid.dataset.filled = '1';
        var icons = [
            ['home', 'خانه'], ['dashboard', 'داشبورد'], ['star', 'ابزارها'], ['wisdom', 'حکمت ایرانی'],
            ['prediction', 'پیش‌بینی'], ['universe', 'جهان'], ['body', 'بدن و ذهن'], ['admin', 'مدیریت'],
            ['birth', 'چارت تولد'], ['synastry', 'سیناستری'], ['composite', 'کامپوزیت'], ['transit', 'ترانزیت'],
            ['solar-return', 'بازگشت خورشیدی'], ['lunar-return', 'بازگشت ماهانه'], ['mizaj', 'مزاج‌شناسی'],
            ['abjad', 'ابجد'], ['hafez', 'فال حافظ'], ['tarot', 'تاروت'], ['numerology', 'عددشناسی'],
            ['biorhythm', 'بیوریتم'], ['zodiac', 'سال حیوانی'], ['daily-question', 'پرسش روزانه'],
            ['qol', 'کیفیت زندگی'], ['nasa', 'ناسا'], ['moon-phase', 'فاز ماه'], ['yoga', 'یوگا'], ['breath', 'تنفس']
        ];
        iconGrid.innerHTML = icons.map(function (ic) {
            return '<div class="icon-cell"><img src="static/images/ui/' + ic[0] + '.svg" alt=""><span>' + ic[1] + '</span></div>';
        }).join('');
    }
    _done = true;
}

return { render: render };
})();
window.CoThemeShowcase = CoThemeShowcase;
