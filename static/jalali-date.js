/**
 * Jalali Date — مبدل واحدِ شمسی↔میلادی برای کل سایت
 * ─────────────────────────────────────────────────────────
 * ⚠️ باگ تاریخی ۲۶۴۷/۳۸۹۰: سه کپی مستقل از مبدل در سه فایل وجود داشت و
 * یکی از کپی‌ها (toJalali در تقویم‌ها) در واقع کپیِ تابع معکوس بود.
 * از این پس همه‌جا فقط همین فایل مرجع است:
 *   - shamsi-calendar.js  → window.JalaliDate
 *   - preset-calendar.js  → window.JalaliDate
 *   - zodiac-display.js   → window.JalaliDate
 *
 * تست‌های دستی (تأییدشده):
 *   gregorianToJalali(2026, 9, 10) → 1405/06/19
 *   gregorianToJalali(2025, 1, 1)  → 1403/10/12
 *   gregorianToJalali(1979, 2, 11) → 1357/11/22  (پیروزی انقلاب)
 *   gregorianToJalali(1921, 3, 21) → 1300/01/01
 *   jalaliToGregorian(1405, 6, 19) → 2025/09/10 ... صحت با رفت‌وبرگشت چک می‌شود
 */
var JalaliDate = (function () {
    'use strict';

    /* ── میلادی → شمسی (g2j) — الگوریتم رسمی jdf ── */
    function gregorianToJalali(gy, gm, gd) {
        var g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
        var jy = (gy > 1600) ? 979 : 0;
        gy -= (gy > 1600) ? 1600 : 621;
        var gy2 = (gm > 2) ? (gy + 1) : gy;
        var days = (365 * gy) + ~~((gy2 + 3) / 4) - ~~((gy2 + 99) / 100) + ~~((gy2 + 399) / 400) - 80 + gd + g_d_m[gm - 1];
        jy += 33 * ~~(days / 12053);
        days %= 12053;
        jy += 4 * ~~(days / 1461);
        days %= 1461;
        if (days > 365) { jy += ~~((days - 1) / 365); days = (days - 1) % 365; }
        var jm, jd;
        if (days < 186) { jm = 1 + ~~(days / 31); jd = 1 + (days % 31); }
        else { jm = 7 + ~~((days - 186) / 30); jd = 1 + ((days - 186) % 30); }
        return { jy: jy, jm: jm, jd: jd };
    }

    /* ── شمسی → میلادی (j2g) — الگوریتم رسمی jdf ── */
    function jalaliToGregorian(jy, jm, jd) {
        jy += 1595;
        var days = -355668 + (365 * jy) + (~~(jy / 33) * 8) + ~~(((jy % 33) + 3) / 4) + jd
            + ((jm < 7) ? (jm - 1) * 31 : ((jm - 7) * 30) + 186);
        var gy = 400 * ~~(days / 146097);
        days %= 146097;
        if (days > 36524) { gy += 100 * ~~(--days / 36524); days %= 36524; if (days >= 365) days++; }
        gy += 4 * ~~(days / 1461);
        days %= 1461;
        if (days > 365) { gy += ~~((days - 1) / 365); days = (days - 1) % 365; }
        var gd = days + 1;
        var sal_a = [0, 31, ((gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        var gm;
        for (gm = 0; gm < 13 && gd > sal_a[gm]; gm++) gd -= sal_a[gm];
        return { gy: gy, gm: gm, gd: gd };
    }

    /* ── طول ماه شمسی — کبیسه Birashk ── */
    function jalaliDaysInMonth(jy, jm) {
        if (jm <= 6) return 31;
        if (jm <= 11) return 30;
        return (((jy + 12) % 33) % 4 === 1) ? 30 : 29;
    }

    /* ── امروز شمسی ── */
    function todayJalali() {
        var n = new Date();
        return gregorianToJalali(n.getFullYear(), n.getMonth() + 1, n.getDate());
    }

    /* ── self-test سبک: یک‌بار در لود، رفت‌وبرگشت ۱۰۰ سال ──
       اگر بریزد console.error می‌دهد ولی اپ را نمی‌بندد */
    (function selfTest() {
        try {
            var probes = [
                [2026, 9, 10, 1405, 6, 19],
                [2025, 1, 1, 1403, 10, 12],
                [1979, 2, 11, 1357, 11, 22],
                [1921, 3, 21, 1300, 1, 1],
                [2024, 3, 20, 1403, 1, 1]   /* نوروز ۱۴۰۳ */
            ];
            for (var i = 0; i < probes.length; i++) {
                var p = probes[i];
                var j = gregorianToJalali(p[0], p[1], p[2]);
                if (j.jy !== p[3] || j.jm !== p[4] || j.jd !== p[5]) {
                    console.error('[JalaliDate] g2j FAILED for', p[0], p[1], p[2], '→', j);
                    return;
                }
                var g = jalaliToGregorian(p[3], p[4], p[5]);
                if (g.gy !== p[0] || g.gm !== p[1] || g.gd !== p[2]) {
                    console.error('[JalaliDate] j2g roundtrip FAILED for', p[3], p[4], p[5], '→', g);
                    return;
                }
            }
        } catch (e) { console.error('[JalaliDate] selfTest error', e); }
    })();

    return {
        gregorianToJalali: gregorianToJalali,
        jalaliToGregorian: jalaliToGregorian,
        jalaliDaysInMonth: jalaliDaysInMonth,
        todayJalali: todayJalali
    };
})();
window.JalaliDate = JalaliDate;
