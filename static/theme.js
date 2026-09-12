/* ================================================================
   COSMIC ORACLE — theme.js
   موتور ماهِ پوسته‌ی بصری (بدون وابستگی به API):
   • محاسبه‌ی فاز از الگوریتم مدولی سیندی (Meeus, ch.47)
   • ترسیم دایره‌ی ماهِ واقعی (خط تقسیم روشن/تاریک دقیق)
   • وِیجت «ماهِ امروز» + نوار هفت‌روز + شمارش معکوس فاز بعدی
   API: window.CoMoon — برای استفاده در theme-preview و index.html
   ================================================================ */
(function (global) {
    'use strict';

    var SYNODIC = 29.53058770576;                 // روزهای یک ماه هلالی
    var REF_NEW_MOON_MS = Date.UTC(2000, 0, 6, 18, 14, 0); // ماهِ نو مرجع
    var FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';

    var PHASES = [
        { max: 1.84566, name: 'New Moon',        fa: 'ماه نو',           en: 'New Moon',        emoji: '🌑' },
        { max: 7.38265, name: 'Waxing Crescent', fa: 'هلالِ رو به رشد', en: 'Waxing Crescent', emoji: '🌒' },
        { max: 9.22831, name: 'First Quarter',   fa: 'تربیع اول',        en: 'First Quarter',   emoji: '🌓' },
        { max: 14.76530, name: 'Waxing Gibbous', fa: 'محدبِ رو به رشد', en: 'Waxing Gibbous',  emoji: '🌔' },
        { max: 16.61096, name: 'Full Moon',      fa: 'ماه کامل',        en: 'Full Moon',       emoji: '🌕' },
        { max: 22.14795, name: 'Waning Gibbous', fa: 'محدبِ رو به زوال', en: 'Waning Gibbous',  emoji: '🌖' },
        { max: 23.99361, name: 'Last Quarter',   fa: 'تربیع آخر',       en: 'Last Quarter',    emoji: '🌗' },
        { max: 29.53059, name: 'Waning Crescent', fa: 'هلالِ رو به زوال', en: 'Waning Crescent', emoji: '🌘' }
    ];

    var SIGNS_FA = ['حمل ♈', 'ثور ♉', 'جوزا ♊', 'سرطان ♋', 'اسد ♌', 'سنبله ♍',
                    'میزان ♎', 'عقرب ♏', 'قوس ♐', 'جدی ♑', 'دلو ♒', 'حوت ♓'];

    /* ── ابزارهای کمکی ─────────────────────────────────── */
    function fa(n) {
        return String(n).replace(/\d/g, function (d) { return FA_DIGITS[+d]; });
    }
    function clamp01(x) { return Math.max(0, Math.min(1, x)); }
    function norm(f) { f = f % 1; return f < 0 ? f + 1 : f; }
    var _uid = 0;
    function uid() { return 'coM' + (++_uid); }

    /* ── طول جغرافیایی قمری (Meeus truncated, ~0.1°) ─── */
    function moonEclipticLongitude(utcMs) {
        var jd = utcMs / 86400000 + 2440587.5;
        var T = (jd - 2451545.0) / 36525;
        function sdeg(x) { return Math.sin(x * Math.PI / 180); }
        var Lp = 218.3164477 + 481267.88123421 * T;
        var D = 297.8501921 + 445267.1114034 * T;
        var M = 357.5291092 + 35999.0502909 * T;
        var Mp = 134.9633964 + 477198.8675055 * T;
        var F = 93.2720950 + 483202.0175233 * T;
        var lam = Lp
            + 6.288774 * sdeg(Mp)
            + 1.274027 * sdeg(2 * D - Mp)
            + 0.658314 * sdeg(2 * D)
            + 0.213618 * sdeg(2 * Mp)
            - 0.185116 * sdeg(M)
            - 0.114332 * sdeg(2 * F)
            + 0.058793 * sdeg(2 * (D - Mp))
            + 0.057066 * sdeg(2 * D - 2 * Mp + M)
            + 0.053322 * sdeg(2 * D + Mp)
            + 0.045758 * sdeg(2 * D - M)
            - 0.040923 * sdeg(Mp + M)
            - 0.034720 * sdeg(D)
            - 0.030383 * sdeg(Mp + M);
        return ((lam % 360) + 360) % 360;
    }

    function phaseBand(ageDays) {
        for (var i = 0; i < PHASES.length; i++) {
            if (ageDays < PHASES[i].max) return PHASES[i];
        }
        return PHASES[PHASES.length - 1];
    }

    /* f در بازه‌ی [0,1): 0=ماه نو، 0.5=ماه کامل، 1=ماه نو بعدی */
    function phaseInfo(f) {
        f = norm(f);
        var illumination = (1 - Math.cos(2 * Math.PI * f)) / 2;
        var ageDays = f * SYNODIC;
        var band = phaseBand(ageDays);
        return {
            f: f,
            illumination: illumination,
            illuminationPct: Math.round(illumination * 100),
            ageDays: ageDays,
            name: band.name,
            fa: band.fa,
            en: band.en,
            emoji: band.emoji,
            waxing: f < 0.5,
            stageFa: f < 0.5 ? 'رو به رشد' : 'رو به زوال'
        };
    }

    function phaseFromNow(utcMs) {
        var days = (utcMs - REF_NEW_MOON_MS) / 86400000;
        return norm(days / SYNODIC);
    }

    function nextPhase(f) {
        f = norm(f);
        var targets = [
            { at: 0.0, fa: 'ماه نو', emoji: '🌑' },
            { at: 0.25, fa: 'تربیع اول', emoji: '🌓' },
            { at: 0.5, fa: 'ماه کامل', emoji: '🌕' },
            { at: 0.75, fa: 'تربیع آخر', emoji: '🌗' }
        ];
        var best = null;
        for (var i = 0; i < targets.length; i++) {
            var d = (targets[i].at - f + 1) % 1;
            if (d < 0.0005) d += 1; // دقیقاً روی فاز هستیم → بعدی‌اش
            var days = d * SYNODIC;
            if (!best || days < best.days) best = { fa: targets[i].fa, emoji: targets[i].emoji, days: days };
        }
        return best;
    }

    /* ================================================================
       ترسیم دایره‌ی ماه
       هندسه: قوسِ لبه‌ی روشن (نیم‌دایره) + قوسِ قطع‌الربع (بیضی)
       rx = r·|cos(2πf)| — دقیقاً همان خطی که ماه را در آسمان
       تقسیم می‌کند. جهت برآمدگی از علامت cos و رو به رشد/زوال برداشته
       می‌شود (نمای نیمکره‌ی شمالی: رشد = سمت راست).
       ================================================================ */
    function discSVG(f, opts) {
        opts = opts || {};
        var size = opts.size || 96;
        var info = phaseInfo(f);
        var L = info.illumination;
        var c = size / 2;
        var r = c - Math.max(2, size * 0.035);
        var u = uid();
        var top = c + ' ' + (c - r);
        var bot = c + ' ' + (c + r);

        var svg = '<svg class="co-moon-disc' + (opts.glow ? ' co-moon-disc--glow' : '') + '" viewBox="0 0 ' + size + ' ' + size + '" width="' + size + '" height="' + size + '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' + info.fa + ' (' + info.illuminationPct + '%)">';

        // defs: گرادیان‌ها + کلیپ
        svg += '<defs>';
        svg += '<radialGradient id="' + u + 'dk" cx=".5" cy=".42" r=".8">'
             + '<stop offset="0" stop-color="#111a38"/>'
             + '<stop offset="1" stop-color="#080d20"/>'
             + '</radialGradient>';
        svg += '<linearGradient id="' + u + 'lt" x1="0" y1="0" x2="0.25" y2="1">'
             + '<stop offset="0" stop-color="#f9efd0"/>'
             + '<stop offset=".55" stop-color="#ecd9a0"/>'
             + '<stop offset="1" stop-color="#cfa94e"/>'
             + '</linearGradient>';
        svg += '</defs>';

        // هاله‌ی دور
        if (opts.glow) {
            svg += '<circle cx="' + c + '" cy="' + c + '" r="' + (r + size * 0.05) + '" fill="none" stroke="rgba(159,212,224,0.16)" stroke-width="1"/>';
        }

        // دایره‌ی پایه (سمت تاریک)
        svg += '<circle cx="' + c + '" cy="' + c + '" r="' + r + '" fill="url(#' + u + 'dk)" stroke="rgba(159,212,224,0.3)" stroke-width="' + Math.max(0.8, size * 0.008) + '"/>';

        // کوهواره‌های سمت تاریک
        var darkCraters = [[-0.32, -0.28, 0.13], [0.24, -0.42, 0.09], [-0.45, 0.22, 0.10], [0.18, 0.48, 0.14], [0.5, 0.05, 0.07], [-0.05, -0.62, 0.07]];
        darkCraters.forEach(function (p) {
            svg += '<circle cx="' + (c + p[0] * r) + '" cy="' + (c + p[1] * r) + '" r="' + (p[2] * r) + '" fill="rgba(159,212,224,0.05)" stroke="rgba(159,212,224,0.07)" stroke-width="0.6"/>';
        });

        // ناحیه‌ی روشن
        if (L > 0.004 && L < 0.996) {
            var k = Math.cos(2 * Math.PI * info.f);
            var rx = r * Math.abs(k);
            var waxing = info.waxing;
            var limbSweep = waxing ? 1 : 0;                 // نیمه‌ی روشن
            var bulgeRight = waxing ? (k > 0) : (k < 0);     // برآمدگیِ تقسیم‌کننده
            var termSweep = bulgeRight ? 0 : 1;              // قوس B→T
            var d = 'M ' + top
                + ' A ' + r + ' ' + r + ' 0 0 ' + limbSweep + ' ' + bot
                + ' A ' + rx + ' ' + r + ' 0 0 ' + termSweep + ' ' + top + ' Z';
            svg += '<clipPath id="' + u + 'clip"><path d="' + d + '"/></clipPath>';
            svg += '<path d="' + d + '" fill="url(#' + u + 'lt)" stroke="rgba(249,239,208,0.55)" stroke-width="' + Math.max(0.7, size * 0.006) + '"/>';
            // کوهواره‌های سمت روشن (داخل کلیپ)
            svg += '<g clip-path="url(#' + u + 'clip)">';
            darkCraters.forEach(function (p) {
                svg += '<circle cx="' + (c + p[0] * r) + '" cy="' + (c + p[1] * r) + '" r="' + (p[2] * r) + '" fill="rgba(122,98,36,0.16)"/>';
            });
            svg += '</g>';
        } else if (L >= 0.996) {
            svg += '<circle cx="' + c + '" cy="' + c + '" r="' + r + '" fill="url(#' + u + 'lt)" stroke="rgba(249,239,208,0.6)" stroke-width="' + Math.max(0.7, size * 0.006) + '"/>';
            svg += '<g>';
            darkCraters.forEach(function (p) {
                svg += '<circle cx="' + (c + p[0] * r) + '" cy="' + (c + p[1] * r) + '" r="' + (p[2] * r) + '" fill="rgba(122,98,36,0.16)"/>';
            });
            svg += '</g>';
        }

        // حلقه‌ی پیشرفت (اختیاری — درصد روشنایی به‌صورت حلقه)
        if (opts.ring) {
            var rr = r + size * 0.075;
            if (rr < c - 1) rr = c - 1;
            var sw = Math.max(2, size * 0.03);
            var circ = 2 * Math.PI * rr;
            svg += '<circle cx="' + c + '" cy="' + c + '" r="' + rr + '" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="' + sw + '"/>';
            if (L > 0.001) {
                svg += '<circle cx="' + c + '" cy="' + c + '" r="' + rr + '" fill="none" stroke="#f0e6b0" stroke-width="' + sw + '" stroke-linecap="round" stroke-dasharray="' + (circ * L) + ' ' + circ + '" transform="rotate(-90 ' + c + ' ' + c + ')"/>';
            }
        }

        svg += '</svg>';
        return svg;
    }

    /* ── نوار هفت‌روز ─────────────────────────────────── */
    function weekStrip(fToday, opts) {
        opts = opts || {};
        var days = opts.days || 7;
        var now = Date.now();
        var html = '<div class="co-moon-week" aria-label="هفت روز آینده">';
        for (var i = 0; i < days; i++) {
            var t = now + i * 86400000;
            var fi = norm(fToday + i / SYNODIC);
            var info = phaseInfo(fi);
            var label = '';
            try {
                label = new Intl.DateTimeFormat('fa-IR', { weekday: 'long' }).format(new Date(t));
            } catch (e) { label = ''; }
            html += '<div class="co-moon-week-cell' + (i === 0 ? ' co-moon-week-cell--today' : '') + '" title="' + info.fa + ' · ' + fa(info.illuminationPct) + '٪">'
                  + discSVG(fi, { size: 24 })
                  + '<span class="co-moon-week-day">' + (i === 0 ? 'امروز' : label) + '</span>'
                  + '<span class="co-moon-week-name">' + fa(info.illuminationPct) + '٪</span>'
                  + '</div>';
        }
        html += '</div>';
        return html;
    }

    /* ── وِیجت کامل «ماهِ امروز» ───────────────────────── */
    function todayWidget(opts) {
        opts = opts || {};
        var now = opts.time || Date.now();
        var f = phaseFromNow(now);
        var info = phaseInfo(f);
        var nxt = nextPhase(f);
        var lon = moonEclipticLongitude(now);
        var sign = SIGNS_FA[Math.floor(lon / 30) % 12];

        var dateLabel = '';
        try {
            dateLabel = new Intl.DateTimeFormat('fa-IR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(now));
        } catch (e) { dateLabel = ''; }

        var daysTxt = nxt.days < 0.9
            ? 'کمتر از یک روز'
            : fa(nxt.days.toFixed(1)).replace('.', '٫') + ' روز دیگر';

        return ''
            + '<div class="co-moon-today" role="group" aria-label="وضعیت ماه امروز">'
            +   '<div class="co-moon-today-disc">' + discSVG(f, { size: 96, glow: true }) + '</div>'
            +   '<div class="co-moon-today-body">'
            +     '<div class="co-moon-today-kicker">🌙 ماهِ امروز' + (dateLabel ? ' · ' + dateLabel : '') + '</div>'
            +     '<div class="co-moon-today-name">' + info.fa + ' ' + info.emoji + '</div>'
            +     '<div class="co-moon-today-meta">'
            +       '<span>روشنایی <b>' + fa(info.illuminationPct) + '٪</b></span>'
            +       '<span>سن ماه <b>' + fa(Math.round(info.ageDays)) + ' روز</b></span>'
            +       '<span>برج ماه <b>' + sign + '</b></span>'
            +       '<span>' + info.stageFa + ' (از ' + fa(30) + ' روز)</span>'
            +     '</div>'
            +   '</div>'
            +   '<div class="co-moon-today-next">'
            +     '<div class="co-moon-today-next-label">رویداد بعدی</div>'
            +     '<div class="co-moon-today-next-val">' + nxt.emoji + ' ' + nxt.fa + '</div>'
            +     '<div class="co-moon-today-next-dur">' + daysTxt + '</div>'
            +   '</div>'
            + '</div>'
            + weekStrip(f);
    }

    /* ── شبکه‌ی ۸ فاز (برای پیش‌نمایش قالب) ────────────── */
    function phaseGrid() {
        var canonical = [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875];
        var html = '<div class="co-moon-grid">';
        canonical.forEach(function (f, i) {
            var info = phaseInfo(i === 0 ? 0.0005 : f); // ماه نوِ خالص = فقط حاشیه
            if (i === 0) info = { illuminationPct: 0, fa: 'ماه نو', en: 'New Moon', emoji: '🌑' };
            html += '<div class="co-moon-cell">'
                  + discSVG(f, { size: 56, glow: true })
                  + '<span class="co-moon-cell-name">' + info.fa + ' ' + (PHASES[i].emoji) + '</span>'
                  + '<span class="co-moon-cell-en">' + PHASES[i].en + '</span>'
                  + '<span class="co-moon-cell-illum">' + fa(info.illuminationPct) + '٪ روشنایی</span>'
                  + '</div>';
        });
        html += '</div>';
        return html;
    }

    /* ── نصب خودکار روی index.html ─────────────────────── */
    function init() {
        var mount = document.getElementById('coMoonToday');
        if (mount && !mount.dataset.coFilled) {
            mount.dataset.coFilled = '1';
            mount.innerHTML = todayWidget();
            mount.hidden = false;
        }
    }

    var CoMoon = {
        SYNODIC: SYNODIC,
        PHASES: PHASES,
        phaseInfo: phaseInfo,
        phaseFromNow: phaseFromNow,
        moonEclipticLongitude: moonEclipticLongitude,
        nextPhase: nextPhase,
        discSVG: discSVG,
        weekStrip: weekStrip,
        todayWidget: todayWidget,
        phaseGrid: phaseGrid,
        fa: fa,
        init: init
    };

    global.CoMoon = CoMoon;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})(window);
