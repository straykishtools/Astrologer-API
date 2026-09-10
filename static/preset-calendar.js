/**
 * Preset Calendar — تقویم شمسیِ درون‌فرمی با «انتخاب سریع» (preset)
 * پورتِ vanilla از کامپوننت React CalendarPresetsExample:
 *   - ستونِ انتخاب سریع با مدت‌های "1d / 1w / 1m / 1y" (ترکیبی مثل "1y 1m 1w")
 *   - حالت single (یک تاریخ) — فاز ماه، موقعیت سیارات
 *   - حالت range (از تاریخ / تا تاریخ) — آب‌وهوای فضا، سیارک‌ها
 *   - موبایل: انتخاب سریع جمع‌شونده بالای تقویم (معادل Drawer)
 * قرارداد خروجی همان makeDatePickerTrigger قدیمی:
 *   <input type="hidden" id="..."> با ISO شمسی "YYYY-MM-DD"
 * وابستگی: هیچ — تبدیل جلالی داخلی است.
 */
var PresetCalendar = (function () {
    'use strict';

    /* ── تبدیل میلادی↔جلالی (jdf استاندارد — همان shamsi-calendar.js) ── */
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
    function jDayNum(j) {
        var g = toGregorian(j.jy, j.jm, j.jd);
        return Math.floor(Date.UTC(g.gy, g.gm - 1, g.gd) / 86400000);
    }
    function todayJ() {
        var n = new Date();
        return toJalali(n.getFullYear(), n.getMonth() + 1, n.getDate());
    }

    var MONTHS = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
    var WEEKDAYS = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];           // شنبه‌محور (سرِ هفته‌ی ایران)
    var WEEKDAYS_FULL = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه']; // بر اساس getDay()؛ 0=یکشنبه
    var FA = '۰۱۲۳۴۵۶۷۸۹';
    function toFa(s) { return String(s).replace(/[0-9]/g, function (d) { return FA[+d]; }); }
    function pad2(n) { return String(n).padStart(2, '0'); }
    function weekdayFull(j) {
        var g = toGregorian(j.jy, j.jm, j.jd);
        return WEEKDAYS_FULL[new Date(g.gy, g.gm - 1, g.gd).getDay()];
    }
    function fmtFull(j) { return toFa(j.jd) + ' ' + MONTHS[j.jm - 1] + ' ' + toFa(j.jy); }
    function fmtISO(j) { return j.jy + '-' + pad2(j.jm) + '-' + pad2(j.jd); }

    /* ── موتورِ مدت — پورتِ applyDuration از نمونه‌ی React ──
       "1d" / "-1d" / "1w" / "1m" / "1y" یا ترکیبی مثل "1y 1m 1w" */
    function addDays(j, n) {
        var g = toGregorian(j.jy, j.jm, j.jd);
        var d = new Date(g.gy, g.gm - 1, g.gd + n);
        return toJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
    }
    function addWeeks(j, n) { return addDays(j, 7 * n); }
    function addMonths(j, n) {
        var t = (j.jm - 1) + n;
        var jy = j.jy + Math.floor(t / 12);
        var jm = ((t % 12) + 12) % 12 + 1;
        return { jy: jy, jm: jm, jd: Math.min(j.jd, jDaysInMonth(jy, jm)) };
    }
    function addYears(j, n) {
        var jy = j.jy + n;
        return { jy: jy, jm: j.jm, jd: Math.min(j.jd, jDaysInMonth(jy, j.jm)) };
    }
    function applyDuration(base, duration) {
        var result = base;
        var tokens = String(duration || '').trim().split(/\s+/);
        for (var i = 0; i < tokens.length; i++) {
            var m = /^(-?\d+)([dwmy])$/.exec(tokens[i]);
            if (!m) continue;
            var amount = Number(m[1]);
            var unit = m[2];
            if (unit === 'd') result = addDays(result, amount);
            else if (unit === 'w') result = addWeeks(result, amount);
            else if (unit === 'm') result = addMonths(result, amount);
            else if (unit === 'y') result = addYears(result, amount);
        }
        return result;
    }

    /* ── presetها ── */
    var RANGE_PRESETS = [
        { label: 'امروز',          from: '0d',    to: '0d' },
        { label: 'دیروز',          from: '-1d',   to: '-1d' },
        { label: '۷ روز گذشته',    from: '-7d',   to: '0d' },
        { label: '۱۴ روز گذشته',   from: '-14d',  to: '0d' },
        { label: 'یک ماه گذشته',   from: '-1m',   to: '0d' },
        { label: 'سه ماه گذشته',   from: '-3m',   to: '0d' },
        { label: 'شش ماه گذشته',   from: '-6m',   to: '0d' },
        { label: 'یک سال گذشته',   from: '-1y',   to: '0d' },
        { label: '۲۰۰ روز گذشته',  from: '-200d', to: '0d' }
    ];
    var SINGLE_PRESETS = [
        { label: 'امروز',                    d: '0d' },
        { label: 'فردا',                     d: '1d' },
        { label: 'دیروز',                    d: '-1d' },
        { label: 'یک هفته دیگر',             d: '1w' },
        { label: 'یک ماه دیگر',              d: '1m' },
        { label: 'یک سال دیگر',              d: '1y' },
        { label: '۱ سال و ۱ ماه و ۱ هفته دیگر', d: '1y 1m 1w' },
        { label: '۲۰۰ روز دیگر',             d: '200d' },
        { label: '۲۰۰ روز پیش',              d: '-200d' }
    ];

    var MIN_JY = 1300, MAX_JY = 1500;
    var _mounted = {};

    /* ── ساخت یک نمونه ── */
    function mount(opts) {
        var root = document.getElementById(opts.mountId);
        if (!root) return null;
        if (_mounted[opts.mountId]) return _mounted[opts.mountId]; // idempotent

        var mode = opts.mode === 'range' ? 'range' : 'single';
        var today = todayJ();
        var state = {
            mode: mode, opts: opts, today: today,
            view: { jy: today.jy, jm: today.jm },
            start: null, end: null, single: null,
            picking: false,          // در حالت range: منتظرِ کلیکِ «تا تاریخ»
            activePreset: -1
        };

        /* پیش‌فرض‌ها */
        if (mode === 'range') {
            state.start = applyDuration(today, opts.defaultFrom || '-7d');
            state.end = applyDuration(today, opts.defaultTo || '0d');
        } else {
            state.single = applyDuration(today, opts.defaultDuration || '0d');
        }
        var anchor = (mode === 'range') ? state.start : state.single;
        state.view = { jy: anchor.jy, jm: anchor.jm };

        /* hidden input ها — همان قرارداد makeDatePickerTrigger */
        if (mode === 'range') {
            ensureHidden(root, opts.startHiddenId, state.start);
            ensureHidden(root, opts.endHiddenId, state.end);
        } else {
            ensureHidden(root, opts.hiddenId, state.single);
        }

        buildDOM(root, state);
        syncHidden(state);
        renderAll(state);

        var api = { state: state };
        _mounted[opts.mountId] = api;
        return api;
    }

    function ensureHidden(root, id, j) {
        if (!id) return;
        var el = document.getElementById(id);
        if (!el) {
            el = document.createElement('input');
            el.type = 'hidden';
            el.id = id;
            root.appendChild(el);
        }
        el.value = fmtISO(j);
    }

    /* ── DOM ── */
    function buildDOM(root, state) {
        root.classList.add('pc-root');
        var presetList = (state.mode === 'range') ? RANGE_PRESETS : SINGLE_PRESETS;
        var buttons = '';
        presetList.forEach(function (p, i) {
            var tip = presetTooltip(state, p);
            buttons += '<button type="button" class="pc-preset" data-preset="' + i + '"' +
                (tip ? ' title="' + tip + '"' : '') + '>' + p.label + '</button>';
        });

        var yearOpts = '';
        for (var y = MIN_JY; y <= MAX_JY; y++) {
            yearOpts += '<option value="' + y + '"' + (y === state.view.jy ? ' selected' : '') + '>' + toFa(y) + '</option>';
        }
        var monthOpts = MONTHS.map(function (m, i) {
            return '<option value="' + (i + 1) + '"' + (i + 1 === state.view.jm ? ' selected' : '') + '>' + m + '</option>';
        }).join('');

        root.innerHTML =
            '<div class="pc-wrap">' +
                '<div class="pc-side">' +
                    '<button type="button" class="pc-quick-toggle">⚡ انتخاب سریع</button>' +
                    '<div class="pc-presets">' +
                        '<p class="pc-side-title">انتخاب سریع</p>' +
                        '<div class="pc-preset-list">' + buttons + '</div>' +
                    '</div>' +
                '</div>' +
                '<div class="pc-cal">' +
                    '<div class="pc-head">' +
                        '<button type="button" class="pc-nav" data-nav="-1" aria-label="ماه قبل">‹</button>' +
                        '<div class="pc-title">' +
                            '<select class="pc-month-select" aria-label="ماه">' + monthOpts + '</select>' +
                            '<select class="pc-year-select" aria-label="سال">' + yearOpts + '</select>' +
                        '</div>' +
                        '<button type="button" class="pc-nav" data-nav="1" aria-label="ماه بعد">›</button>' +
                    '</div>' +
                    '<div class="pc-weekdays">' + WEEKDAYS.map(function (w) { return '<span>' + w + '</span>'; }).join('') + '</div>' +
                    '<div class="pc-grid"></div>' +
                    '<div class="pc-summary"></div>' +
                '</div>' +
            '</div>';

        /* رویدادها */
        var quick = root.querySelector('.pc-quick-toggle');
        quick.addEventListener('click', function () {
            root.querySelector('.pc-presets').classList.toggle('open');
        });

        root.querySelectorAll('.pc-preset').forEach(function (btn) {
            btn.addEventListener('click', function () {
                applyPreset(state, parseInt(btn.dataset.preset));
            });
        });

        root.querySelectorAll('.pc-nav').forEach(function (btn) {
            btn.addEventListener('click', function () { shiftMonth(state, parseInt(btn.dataset.nav)); });
        });
        root.querySelector('.pc-month-select').addEventListener('change', function (e) {
            state.view.jm = parseInt(e.target.value);
            renderAll(state);
        });
        root.querySelector('.pc-year-select').addEventListener('change', function (e) {
            state.view.jy = parseInt(e.target.value);
            renderAll(state);
        });
        root.querySelector('.pc-grid').addEventListener('click', function (e) {
            var day = e.target.closest('.pc-day[data-day]');
            if (!day) return;
            pickDay(state, parseInt(day.dataset.day));
        });
    }

    function presetTooltip(state, p) {
        try {
            if (state.mode === 'range') {
                var a = applyDuration(state.today, p.from);
                var b = applyDuration(state.today, p.to);
                return 'از ' + fmtFull(a) + ' (' + weekdayFull(a) + ') تا ' + fmtFull(b) + ' (' + weekdayFull(b) + ')';
            }
            var t = applyDuration(state.today, p.d);
            return fmtFull(t) + ' · ' + weekdayFull(t);
        } catch (e) { return ''; }
    }

    function applyPreset(state, idx) {
        var presetList = (state.mode === 'range') ? RANGE_PRESETS : SINGLE_PRESETS;
        var p = presetList[idx];
        if (!p) return;
        state.activePreset = idx;
        if (state.mode === 'range') {
            state.start = applyDuration(state.today, p.from);
            state.end = applyDuration(state.today, p.to);
            state.picking = false;
            state.view = { jy: state.start.jy, jm: state.start.jm };
        } else {
            state.single = applyDuration(state.today, p.d);
            state.view = { jy: state.single.jy, jm: state.single.jm };
        }
        syncHidden(state);
        renderAll(state);
    }

    function pickDay(state, day) {
        var d = { jy: state.view.jy, jm: state.view.jm, jd: day };
        if (state.mode === 'range') {
            if (!state.start || state.picking === false && state.start && state.end) {
                /* کلیکِ تازه — شروعِ بازه‌ی جدید */
                state.start = d; state.end = d; state.picking = true;
            } else if (state.picking) {
                /* دومین کلیک — تعیینِ «تا تاریخ» (جابه‌جایی اگر قبل از شروع باشد) */
                if (jDayNum(d) < jDayNum(state.start)) { state.start = d; }
                else { state.end = d; }
                state.picking = false;
            }
            state.activePreset = -1;
        } else {
            state.single = d;
            state.activePreset = -1;
        }
        syncHidden(state);
        renderAll(state);
    }

    function shiftMonth(state, delta) {
        var jm = state.view.jm + delta, jy = state.view.jy;
        if (jm > 12) { jm = 1; jy++; }
        if (jm < 1) { jm = 12; jy--; }
        if (jy < MIN_JY || jy > MAX_JY) return;
        state.view = { jy: jy, jm: jm };
        renderAll(state);
    }

    function syncHidden(state) {
        var o = state.opts;
        if (state.mode === 'range') {
            var s = document.getElementById(o.startHiddenId);
            var e = document.getElementById(o.endHiddenId);
            if (s) s.value = state.start ? fmtISO(state.start) : '';
            if (e) e.value = state.end ? fmtISO(state.end) : '';
        } else {
            var h = document.getElementById(o.hiddenId);
            if (h) h.value = state.single ? fmtISO(state.single) : '';
        }
        if (typeof o.onChange === 'function') o.onChange(state);
    }

    /* ── رندر ── */
    function renderAll(state) {
        var root = document.getElementById(state.opts.mountId);
        if (!root) return;

        /* sync dropdownها */
        var ySel = root.querySelector('.pc-year-select'), mSel = root.querySelector('.pc-month-select');
        if (ySel) ySel.value = state.view.jy;
        if (mSel) mSel.value = state.view.jm;

        /* preset فعال */
        root.querySelectorAll('.pc-preset').forEach(function (b) {
            b.classList.toggle('active', parseInt(b.dataset.preset) === state.activePreset);
        });

        renderGrid(root, state);
        renderSummary(root, state);
    }

    function renderGrid(root, state) {
        var grid = root.querySelector('.pc-grid');
        var jy = state.view.jy, jm = state.view.jm;
        var firstWd = new Date(toGregorian(jy, jm, 1).gy, toGregorian(jy, jm, 1).gm - 1, toGregorian(jy, jm, 1).gd).getDay();
        var lead = (firstWd + 1) % 7;   // هفته شنبه‌شروع
        var dm = jDaysInMonth(jy, jm);
        var sN = state.start ? jDayNum(state.start) : -1;
        var eN = state.end ? jDayNum(state.end) : -1;
        var selN = state.single ? jDayNum(state.single) : -1;

        var cells = '';
        for (var i = 0; i < lead; i++) cells += '<span class="pc-day empty"></span>';
        for (var d = 1; d <= dm; d++) {
            var dj = { jy: jy, jm: jm, jd: d };
            var dn = jDayNum(dj);
            var isToday = (state.today.jy === jy && state.today.jm === jm && state.today.jd === d);
            var lo = Math.min(sN, eN), hi = Math.max(sN, eN);
            var isEdge = (state.mode === 'range' && sN > -1 && eN > -1 && (dn === sN || dn === eN));
            var isInRange = (state.mode === 'range' && sN > -1 && eN > -1 && dn > lo && dn < hi);
            var isSel = (state.mode === 'single' && dn === selN);
            var cls = 'pc-day' +
                (isToday ? ' today' : '') +
                (isEdge ? ' edge' : '') +
                (isInRange ? ' in-range' : '') +
                (isSel ? ' selected' : '');
            cells += '<button type="button" class="' + cls + '" data-day="' + d + '">' + toFa(d) + '</button>';
        }
        grid.innerHTML = cells;
    }

    function renderSummary(root, state) {
        var sum = root.querySelector('.pc-summary');
        if (!sum) return;
        if (state.mode === 'range') {
            if (state.start && state.end) {
                sum.innerHTML = '📅 از <b>' + fmtFull(state.start) + '</b> (' + weekdayFull(state.start) + ')' +
                    ' تا <b>' + fmtFull(state.end) + '</b> (' + weekdayFull(state.end) + ')';
            } else {
                sum.innerHTML = '📅 بازه‌ی تاریخ را انتخاب کنید';
            }
        } else {
            sum.innerHTML = state.single
                ? '📅 <b>' + fmtFull(state.single) + '</b> · ' + weekdayFull(state.single)
                : '📅 تاریخ را انتخاب کنید';
        }
    }

    return {
        mount: mount,
        applyDuration: applyDuration,
        toJalali: toJalali,
        toGregorian: toGregorian,
        jDaysInMonth: jDaysInMonth
    };
})();
window.PresetCalendar = PresetCalendar;
