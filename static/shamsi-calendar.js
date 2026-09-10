/**
 * Shamsi Calendar Popover — تقویم شمسی گرافیکی (جایگزین چرخ)
 * ساخته‌شده بر اساس الگوی React DatePickerDob:
 *   - تقویم ماهانه با هدر dropdown (ماه/سال)
 *   - ناوبری ماه قبل/بعد
 *   - default ۱۳۷۰ · earliest ۱۳۰۰ · end = امروز
 *   - روزهای ماه با weekday درست، امروز هایلایت، انتخاب با کلیک
 * Uses jalaliToGregorian / gregorianToJalali (zodiac-display.js algorithm).
 */
var ShamsiCalendar = (function () {
    'use strict';

    var MONTHS = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
    var WEEKDAYS = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];  // شنبه‌محور (شروع هفته ایران)
    var FA = '۰۱۲۳۴۵۶۷۸۹';
    function toFa(s) { return String(s).replace(/[0-9]/g, function (d) { return FA[+d]; }); }

    /* ── تبدیل میلادی↔جلالی (jdf استاندارد، همان zodiac-display) ── */
    function toJalali(gy, gm, gd) {
        gy += 1595;
        var days = -355668 + (365 * gy) + (~~(gy / 33) * 8) + ~~(((gy % 33) + 3) / 4) + gd
            + ((gm < 7) ? (gm - 1) * 31 : ((gm - 7) * 30) + 186);
        var jy = 400 * ~~(days / 146097);
        days %= 146097;
        if (days > 36524) { jy += 100 * ~~(--days / 36524); days %= 36524; if (days >= 365) days++; }
        jy += 4 * ~~(days / 1461);
        days %= 1461;
        if (days > 365) { jy += ~~((days - 1) / 365); days = (days - 1) % 365; }
        var jd = days + 1;
        var sal_a = [0, 31, ((gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        var jm;
        for (jm = 0; jm < 13 && jd > sal_a[jm]; jm++) jd -= sal_a[jm];
        return { jy: jy, jm: jm, jd: jd };
    }
    function toGregorian(jy, jm, jd) {
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
    function jDaysInMonth(jy, jm) {
        if (jm <= 6) return 31;
        if (jm <= 11) return 30;
        /* اسفند — کبیسه: الگوریتم Birashk */
        return (((jy + 12) % 33) % 4 === 1) ? 30 : 29;
    }
    /* weekday index (0=شنبه) of a jalali date */
    function jWeekday(jy, jm, jd) {
        var g = toGregorian(jy, jm, jd);
        return new Date(g.gy, g.gm - 1, g.gd).getDay(); // 0=Sun … 6=Sat
    }
    function todayJalali() {
        var n = new Date();
        return toJalali(n.getFullYear(), n.getMonth() + 1, n.getDate());
    }

    var _openPopover = null;
    var _state = null;   /* { jy, jm, selected:{jy,jm,jd}|null, minJy, minJm, maxJy, maxJm, onSave, anchorBtn } */

    /* ── rendering ── */
    function grid(state) {
        var firstWd = jWeekday(state.jy, state.jm, 1);
        var dm = jDaysInMonth(state.jy, state.jm);
        var today = todayJalali();
        var cells = '';
        /* هفته شنبه‌شروع → خالی‌های قبل از روز اول: (firstWd+1)%7 */
        var lead = (firstWd + 1) % 7;
        for (var i = 0; i < lead; i++) cells += '<span class="sc-day empty"></span>';
        for (var d = 1; d <= dm; d++) {
            var isToday = (today.jy === state.jy && today.jm === state.jm && today.jd === d);
            var isSel = state.selected && state.selected.jy === state.jy && state.selected.jm === state.jm && state.selected.jd === d;
            var dis = isBeyond(state, d);
            cells += '<button type="button" class="sc-day' + (isToday ? ' today' : '') + (isSel ? ' selected' : '') + (dis ? ' disabled' : '') + '"' +
                (dis ? ' disabled' : ' data-day="' + d + '"') + '>' + toFa(d) + '</button>';
        }
        return cells;
    }
    function isBeyond(state, d) {
        /* بعد از امروز مجاز نیست (endMonth=today در مرجع) — مگر allowFuture */
        if (state.allowFuture) return false;
        var today = todayJalali();
        if (state.jy > today.jy) return true;
        if (state.jy === today.jy && state.jm > today.jm) return true;
        if (state.jy === today.jy && state.jm === today.jm && d > today.jd) return true;
        return false;
    }
    function render(state) {
        var pop = _openPopover;
        if (!pop) return;
        pop.querySelector('.sc-year-select').value = state.jy;
        pop.querySelector('.sc-month-select').value = state.jm;
        pop.querySelector('.sc-grid-days').innerHTML = grid(state);
    }

    function buildPopover(state) {
        var pop = document.createElement('div');
        pop.className = 'sc-popover';
        var years = [], y;
        for (y = state.minJy; y <= state.maxJy; y++) years.push(y);
        var yOpts = years.map(function (yy) { return '<option value="' + yy + '"' + (yy === state.jy ? ' selected' : '') + '>' + toFa(yy) + '</option>'; }).join('');
        var mOpts = MONTHS.map(function (m, i) { return '<option value="' + (i + 1) + '"' + (i + 1 === state.jm ? ' selected' : '') + '>' + m + '</option>'; }).join('');
        pop.innerHTML =
            '<div class="sc-head">' +
                '<button type="button" class="sc-nav" data-nav="-1" aria-label="ماه قبل">‹</button>' +
                '<div class="sc-title">' +
                    '<select class="sc-month-select" aria-label="ماه">' + mOpts + '</select>' +
                    '<select class="sc-year-select" aria-label="سال">' + yOpts + '</select>' +
                '</div>' +
                '<button type="button" class="sc-nav" data-nav="1" aria-label="ماه بعد">›</button>' +
                '<button type="button" class="sc-close" aria-label="بستن">✕</button>' +
            '</div>' +
            '<div class="sc-weekdays">' + WEEKDAYS.map(function (w) { return '<span>' + w + '</span>'; }).join('') + '</div>' +
            '<div class="sc-grid-days"></div>';
        return pop;
    }

    function shiftMonth(delta) {
        var s = _state;
        var jm = s.jm + delta, jy = s.jy;
        if (jm > 12) { jm = 1; jy++; }
        if (jm < 1) { jm = 12; jy--; }
        if (jy < s.minJy || (jy === s.minJy && jm < s.minJm)) return;
        if (jy > s.maxJy || (jy === s.maxJy && jm > s.maxJm)) return;
        s.jy = jy; s.jm = jm;
        render(s);
    }

    function close() {
        if (_openPopover) { _openPopover.remove(); _openPopover = null; }
        document.removeEventListener('mousedown', outside, true);
        document.removeEventListener('keydown', onKey, true);
        window.removeEventListener('resize', reposition, true);
        _state = null;
    }
    function outside(e) {
        if (!_openPopover || !_state) return;
        var a = _state.anchorBtn;
        if (!_openPopover.contains(e.target) && e.target !== a && !(a && a.contains(e.target))) close();
    }
    function onKey(e) {
        if (e.key === 'Escape') { e.stopPropagation(); close(); }
    }
    /* مختصات document (نه viewport) — با position:absolute با اسکرول هم حرکت می‌کند */
    function reposition() {
        if (!_openPopover || !_state || !_state.anchorBtn) return;
        place(_openPopover, _state.anchorBtn);
    }
    function place(pop, anchor) {
        var a = anchor || document.body;
        var r = a.getBoundingClientRect();
        var pw = pop.offsetWidth || 300, ph = pop.offsetHeight || 340;
        var docW = (document.documentElement && document.documentElement.clientWidth) || window.innerWidth;
        var sx = window.scrollX || 0, sy = window.scrollY || 0;
        var left = Math.min(Math.max(8, r.left + sx + r.width / 2 - pw / 2), docW - pw - 8);
        var topDoc = r.top + sy + r.height + 8;                   /* زیر دکمه */
        if (r.bottom + 8 + ph > window.innerHeight - 8 && r.top - ph - 8 >= 0) {
            topDoc = r.top + sy - ph - 8;                         /* بالای دکمه جا شود */
        }
        pop.style.left = Math.round(left) + 'px';
        pop.style.top = Math.round(Math.max(8, topDoc)) + 'px';
    }

    /**
     * open({ trigger, anchor, defaultJalali:{jy,jm,jd}, minJy, maxJy, allowFuture, onSave(iso) })
     * onSave یک ISO شمسی «YYYY-MM-DD» برمی‌گرداند.
     * allowFuture: انتخاب تاریخ‌های آینده را مجاز می‌کند (ترانزیت/ناسا/…)
     */
    function open(opts) {
        close();
        var today = todayJalali();
        var minJy = opts.minJy || 1300;
        var def = opts.defaultJalali || { jy: 1370, jm: 1, jd: 1 };
        var allowFuture = !!opts.allowFuture;
        var state = {
            jy: def.jy, jm: def.jm,
            selected: null,
            minJy: minJy, minJm: 1,
            maxJy: allowFuture ? (opts.maxJy || today.jy + 120) : today.jy,
            maxJm: allowFuture ? 12 : today.jm,
            allowFuture: allowFuture,
            onSave: opts.onSave || null,
            anchorBtn: opts.anchor || null,
        };
        /* clamp default into allowed range */
        if (state.jy > state.maxJy) { state.jy = state.maxJy; state.jm = state.maxJm; }
        if (state.jy < minJy) { state.jy = minJy; state.jm = 1; }
        _state = state;

        var pop = buildPopover(state);
        document.body.appendChild(pop);
        _openPopover = pop;
        render(state);           /* اول پر کردن گرید تا offsetHeight واقعی برای جای‌گذاری */
        place(pop, opts.anchor);

        /* events */
        pop.addEventListener('click', function (e) {
            if (e.target.closest('.sc-close')) { close(); return; }
            var nav = e.target.closest('[data-nav]');
            if (nav) { shiftMonth(parseInt(nav.dataset.nav)); return; }
            var day = e.target.closest('.sc-day[data-day]');
            if (day) {
                var d = parseInt(day.dataset.day);
                state.selected = { jy: state.jy, jm: state.jm, jd: d };
                var iso = state.jy + '-' + String(state.jm).padStart(2, '0') + '-' + String(d).padStart(2, '0');
                if (state.onSave) state.onSave(iso);
                close();
                return;
            }
        });
        pop.querySelector('.sc-year-select').addEventListener('change', function (e) {
            state.jy = parseInt(e.target.value);
            var maxD2 = jDaysInMonth(state.jy, state.jm);
            if (state.selected && state.selected.jd > maxD2) state.selected.jd = maxD2;
            render(state);
        });
        pop.querySelector('.sc-month-select').addEventListener('change', function (e) {
            state.jm = parseInt(e.target.value);
            render(state);
        });
        document.addEventListener('mousedown', outside, true);
        document.addEventListener('keydown', onKey, true);
        window.addEventListener('resize', reposition, true);
    }

    /* trigger helper — یک خط: پیاده‌سازی روی هر دکمه */
    function attach(triggerId, opts) {
        var btn = document.getElementById(triggerId);
        if (!btn) return;
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            var def = null;
            var hidden = document.getElementById(triggerId + '_hidden');
            if (hidden && hidden.value) {
                var p = hidden.value.split('-');
                if (p.length === 3) def = { jy: parseInt(p[0]), jm: parseInt(p[1]), jd: parseInt(p[2]) };
            }
            if (!def && window.sharedInputs && window.sharedInputs.birthDate) {
                var b = window.sharedInputs.birthDate;
                if (b.year && b.month && b.day) def = { jy: b.year, jm: b.month, jd: b.day };
            }
            open({
                anchor: btn,
                defaultJalali: def,
                minJy: opts && opts.minJy ? opts.minJy : 1300,
                onSave: function (iso) {
                    var hidden2 = document.getElementById(triggerId + '_hidden');
                    if (hidden2) hidden2.value = iso;
                    var disp = document.getElementById(triggerId + '_display');
                    if (disp) {
                        var p = iso.split('-');
                        disp.textContent = toFa(p[0]) + ' / ' + toFa(p[1]) + ' / ' + toFa(p[2]);
                    }
                    if (opts && opts.onSave) opts.onSave(iso);
                }
            });
        });
    }

    return { open: open, attach: attach, close: close, toJalali: toJalali, toGregorian: toGregorian, jDaysInMonth: jDaysInMonth };
})();
window.ShamsiCalendar = ShamsiCalendar;
