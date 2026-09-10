/**
 * Date Wheel Picker — Vanilla JS
 * Jalali (Shamsi) + Miladi (Gregorian) scroll-wheel date picker.
 * Pre-built HTML modal, arrow buttons, keyboard support.
 */
(function () {
    'use strict';

    // ================================================================
    //  SHAMSI ↔ MILADI CONVERSION
    // ================================================================
    var ShamsiConv = (function () {
        var g_days = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        var j_days = [0, 31, 31, 31, 31, 31, 31, 31, 31, 31, 31, 31, 30];
        function gLeap(y) { return (y % 4 === 0 && y % 100 !== 0) || (y % 400 === 0); }
        function jLeap(y) { return (((y - 474) % 2820) * 682 - 110) % 2820 < 682; }
        function gDaysInMonth(y, m) { return m === 2 && gLeap(y) ? 29 : g_days[m]; }
        function jDaysInMonth(y, m) { return m === 12 && jLeap(y) ? 30 : j_days[m]; }
        function g2j(gy, gm, gd) {
            var gy2 = gy - 1600, gm2 = gm - 1, gd2 = gd - 1;
            var g_day_no = 365 * gy2 + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400);
            for (var i = 0; i < gm2; i++) g_day_no += g_days[i + 1];
            g_day_no += gd2;
            var j_day_no = g_day_no - 79;
            var j_np = Math.floor(j_day_no / 12053);
            j_day_no %= 12053;
            var jy = 979 + 33 * j_np + 4 * Math.floor(j_day_no / 1461);
            j_day_no %= 1461;
            if (j_day_no >= 366) { jy += Math.floor((j_day_no - 365) / 365); j_day_no = (j_day_no - 365) % 365; }
            var jm, jd;
            if (j_day_no < 186) { jm = 1 + Math.floor(j_day_no / 31); jd = 1 + (j_day_no % 31); }
            else { jm = 7 + Math.floor((j_day_no - 186) / 30); jd = 1 + ((j_day_no - 186) % 30); }
            return { year: jy, month: jm, day: jd };
        }
        function j2g(jy, jm, jd) {
            var jy2 = jy - 979, jm2 = jm - 1, jd2 = jd - 1;
            var j_day_no = 365 * jy2 + Math.floor(jy2 / 33) * 8 + Math.floor(((jy2 % 33) + 3) / 4);
            for (var i = 0; i < jm2; i++) j_day_no += j_days[i + 1];
            j_day_no += jd2;
            var g_day_no = j_day_no + 79;
            var gy = 1600 + 400 * Math.floor(g_day_no / 146097);
            g_day_no %= 146097;
            if (g_day_no >= 36525) { g_day_no--; gy += 100 * Math.floor(g_day_no / 36524); g_day_no %= 36524; if (g_day_no >= 365) g_day_no++; else gy--; }
            g_day_no++;
            var gd = 1 + (g_day_no % 31);
            var gm = 1 + Math.floor(g_day_no / 31);
            if (gm > 12) { gm = 1; gy++; }
            return { year: gy, month: gm, day: gd };
        }
        return { g2j: g2j, j2g: j2g, gDaysInMonth: gDaysInMonth, jDaysInMonth: jDaysInMonth };
    })();

    // ================================================================
    //  HELPERS
    // ================================================================
    var FA = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'];
    function toFa(s) { return String(s).replace(/[0-9]/g, function(d) { return FA[parseInt(d)]; }); }

    var MONTHS_SH = ['','فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
    var MONTHS_ML = ['','January','February','March','April','May','June','July','August','September','October','November','December'];
    function monthName(cal, m) { return (cal === 'shamsi' ? MONTHS_SH : MONTHS_ML)[m] || ''; }
    function daysInMonth(cal, y, m) { return cal === 'shamsi' ? ShamsiConv.jDaysInMonth(y, m) : ShamsiConv.gDaysInMonth(y, m); }
    function weekdayName(cal, y, m, d) {
        var g = cal === 'shamsi' ? ShamsiConv.j2g(y, m, d) : { year: y, month: m, day: d };
        return ['یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنجشنبه','جمعه','شنبه'][new Date(g.year, g.month - 1, g.day).getDay()];
    }

    // ================================================================
    //  STATE
    // ================================================================
    var _opts = {}, _isOpen = false, _cal = 'shamsi';
    var _sel = { year: 1380, month: 1, day: 1 };
    var _onSave = null;
    var _el = {}; // cached DOM references
    var _rendering = false; // guard against recursive renderAll
    var _scrolling = false; // guard against detectCenter during programmatic scroll

    // ================================================================
    //  BUILD MODAL (once, lazily)
    // ================================================================
    var _built = false;
    function buildModal() {
        if (_built) return;
        _built = true;

        // Overlay
        var ov = document.createElement('div');
        ov.className = 'dp-overlay';
        ov.id = 'dpOverlay';
        document.body.appendChild(ov);
        _el.overlay = ov;

        // Wrapper
        var wrap = document.createElement('div');
        wrap.className = 'dp-wrapper dp-desktop';
        wrap.id = 'dpWrapper';
        document.body.appendChild(wrap);
        _el.wrapper = wrap;

        // Container
        var ct = document.createElement('div');
        ct.className = 'dp-container';
        ct.id = 'dpContainer';
        wrap.appendChild(ct);
        _el.container = ct;

        // Build inner HTML
        ct.innerHTML =
            '<div class="dp-drag-handle"></div>' +
            '<div class="dp-header">' +
                '<span class="dp-header-title">📅 انتخاب تاریخ</span>' +
                '<button class="dp-header-close" id="dpClose" aria-label="بستن">✕</button>' +
            '</div>' +
            '<div class="dp-toggle">' +
                '<button class="dp-toggle-btn active" data-cal="shamsi" id="dpTogSh">شمسی</button>' +
            '</div>' +
            '<div class="dp-wheels">' +
                '<div class="dp-col" tabindex="0" data-wheel="year">' +
                    '<button class="dp-arrow" id="dpYearUp" aria-label="سال قبل">▲</button>' +
                    '<div class="dp-wheel-wrapper" data-type="year"><div class="dp-wheel-label">سال</div><div class="dp-wheel-list" id="dpYearList"></div></div>' +
                    '<button class="dp-arrow" id="dpYearDown" aria-label="سال بعد">▼</button>' +
                '</div>' +
                '<div class="dp-col" tabindex="0" data-wheel="month">' +
                    '<button class="dp-arrow" id="dpMonthUp" aria-label="ماه قبل">▲</button>' +
                    '<div class="dp-wheel-wrapper" data-type="month"><div class="dp-wheel-label">ماه</div><div class="dp-wheel-list" id="dpMonthList"></div></div>' +
                    '<button class="dp-arrow" id="dpMonthDown" aria-label="ماه بعد">▼</button>' +
                '</div>' +
                '<div class="dp-col" tabindex="0" data-wheel="day">' +
                    '<button class="dp-arrow" id="dpDayUp" aria-label="روز قبل">▲</button>' +
                    '<div class="dp-wheel-wrapper" data-type="day"><div class="dp-wheel-label">روز</div><div class="dp-wheel-list" id="dpDayList"></div></div>' +
                    '<button class="dp-arrow" id="dpDayDown" aria-label="روز بعد">▼</button>' +
                '</div>' +
            '</div>' +
            '<div class="dp-display">' +
                '<div class="dp-display-text" id="dpDispText"></div>' +
                '<div class="dp-display-sub" id="dpDispSub"></div>' +
            '</div>' +
            '<div class="dp-actions">' +
                '<button class="dp-btn dp-btn-cancel" id="dpCancel">لغو</button>' +
                '<button class="dp-btn dp-btn-save" id="dpSave">ذخیره</button>' +
            '</div>';

        // Cache elements
        _el.yearList = document.getElementById('dpYearList');
        _el.monthList = document.getElementById('dpMonthList');
        _el.dayList = document.getElementById('dpDayList');
        _el.dispText = document.getElementById('dpDispText');
        _el.dispSub = document.getElementById('dpDispSub');

        // ---- Event listeners (bound ONCE) ----

        // Close handlers
        ov.addEventListener('click', closePicker);
        document.getElementById('dpClose').addEventListener('click', closePicker);
        document.getElementById('dpCancel').addEventListener('click', closePicker);

        // Save
        document.getElementById('dpSave').addEventListener('click', function () {
            if (_onSave) _onSave({ year: _sel.year, month: _sel.month, day: _sel.day, calendarType: _cal });
            closePicker();
        });

        // Calendar toggle (میلادی حذف شد — فقط شمسی)
        document.getElementById('dpTogSh').addEventListener('click', function () { switchCalendar('shamsi'); });

        // Arrow buttons
        document.getElementById('dpYearUp').addEventListener('click', function () { wheelStep('year', -1); });
        document.getElementById('dpYearDown').addEventListener('click', function () { wheelStep('year', 1); });
        document.getElementById('dpMonthUp').addEventListener('click', function () { wheelStep('month', -1); });
        document.getElementById('dpMonthDown').addEventListener('click', function () { wheelStep('month', 1); });
        document.getElementById('dpDayUp').addEventListener('click', function () { wheelStep('day', -1); });
        document.getElementById('dpDayDown').addEventListener('click', function () { wheelStep('day', 1); });

        // Keyboard (Escape + arrow keys)
        document.addEventListener('keydown', function (e) {
            if (!_isOpen) return;
            if (e.key === 'Escape') { closePicker(); return; }
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                e.preventDefault();
                var dir = e.key === 'ArrowUp' ? -1 : 1;
                var focused = document.activeElement;
                var colType = null;
                if (focused && focused.dataset && focused.dataset.wheel) {
                    colType = focused.dataset.wheel;
                } else if (focused && focused.closest) {
                    var col = focused.closest('.dp-col');
                    if (col && col.dataset.wheel) colType = col.dataset.wheel;
                }
                wheelStep(colType || 'year', dir);
            }
        });

        // Responsive
        window.addEventListener('resize', function () {
            var mob = window.innerWidth < 768;
            _el.wrapper.className = 'dp-wrapper ' + (mob ? 'dp-mobile' : 'dp-desktop');
        });
    }

    // ================================================================
    //  WHEEL STEPS (arrow buttons)
    // ================================================================
    function wheelStep(type, dir) {
        /* محدودیت سال برداشته شد — فلش‌ها آزادند؛ بازه‌ی رندر خودش دنبال می‌کند */
        var st = _opts.yearStep || 1;

        if (type === 'year') {
            _sel.year += dir * st;
        } else if (type === 'month') {
            var newM = _sel.month + dir;
            if (newM > 12) { _sel.month = 1; _sel.year += st; }
            else if (newM < 1) { _sel.month = 12; _sel.year -= st; }
            else { _sel.month = newM; }
        } else if (type === 'day') {
            var maxD = daysInMonth(_cal, _sel.year, _sel.month);
            var newD = _sel.day + dir;
            if (newD > maxD) _sel.day = 1;
            else if (newD < 1) _sel.day = maxD;
            else _sel.day = newD;
        }
        renderAll();
        updateDisplay();
    }

    // ================================================================
    //  CALENDAR SWITCH
    // ================================================================
    function switchCalendar(cal) {
        /* میلادی کلاً حذف شد — همیشه شمسی */
        return;
    }

    // ================================================================
    //  RENDER
    // ================================================================
    function renderWheel(list, items, val) {
        list.innerHTML = '';
        items.forEach(function (it) {
            var d = document.createElement('div');
            d.className = 'dp-wheel-item' + (it.value === val ? ' selected' : '');
            d.dataset.value = it.value;
            d.textContent = it.label;
            d.setAttribute('role', 'option');
            list.appendChild(d);
        });
    }

    function scrollToList(list, val) {
        _scrolling = true;
        var items = list.querySelectorAll('.dp-wheel-item');
        for (var i = 0; i < items.length; i++) {
            if (String(items[i].dataset.value) === String(val)) {
                list.scrollTop = items[i].offsetTop - list.offsetHeight / 2 + items[i].offsetHeight / 2;
                break;
            }
        }
        _scrolling = false;
    }

    function renderAll() {
        if (_rendering) return;
        _rendering = true;
        var d = _opts.digits || 'fa';
        /* محدودیت سال برداشته شد تا سیستم جدید — بازه‌ی آزاد حول سال انتخابی */
        /* سبکی: بازه‌ی سال محدود به ±۱۰۰ سالِ انتخابی (نه چند صد سال) —
           رندر سبک می‌ماند و چرخ روان است. min/max صریحِ فراخوان همچنان
           برنده است. */
        var mn = _opts.minYear || (_sel.year - 100);
        var mx = _opts.maxYear || (_sel.year + 100);
        if (_sel.year < mn) { mn = _sel.year - 40; mx = _sel.year + 60; }
        if (_sel.year > mx) { mx = _sel.year + 40; mn = _sel.year - 60; }
        _curMn = mn; _curMx = mx;
        var st = _opts.yearStep || 1;

        // Years
        var yrs = [];
        for (var y = mn; y <= mx; y += st) yrs.push({ value: y, label: d === 'fa' ? toFa(y) : String(y) });
        renderWheel(_el.yearList, yrs, _sel.year);

        // Months
        var mos = [];
        for (var m = 1; m <= 12; m++) {
            var ml = monthName(_cal, m);
            if (d === 'fa') ml += ' (' + toFa(m) + ')';
            mos.push({ value: m, label: ml });
        }
        renderWheel(_el.monthList, mos, _sel.month);

        // Days
        var maxD = daysInMonth(_cal, _sel.year, _sel.month);
        if (_sel.day > maxD) _sel.day = maxD;
        var dys = [];
        for (var dd = 1; dd <= maxD; dd++) dys.push({ value: dd, label: d === 'fa' ? toFa(dd) : String(dd) });
        renderWheel(_el.dayList, dys, _sel.day);

        scrollToList(_el.yearList, _sel.year);
        scrollToList(_el.monthList, _sel.month);
        scrollToList(_el.dayList, _sel.day);
        updateDisplay();
        _rendering = false;
    }

    function updateDisplay() {
        var d = _opts.digits || 'fa';
        var sep = ' / ';
        var yS = d === 'fa' ? toFa(_sel.year) : String(_sel.year);
        var mS = d === 'fa' ? toFa(String(_sel.month).padStart(2, '0')) : String(_sel.month).padStart(2, '0');
        var dS = d === 'fa' ? toFa(String(_sel.day).padStart(2, '0')) : String(_sel.day).padStart(2, '0');
        var dt = document.getElementById('dpDispText');
        var ds = document.getElementById('dpDispSub');
        if (dt) dt.textContent = yS + sep + mS + sep + dS;
        if (ds) ds.textContent = weekdayName(_cal, _sel.year, _sel.month, _sel.day) + '، ' + dS + ' ' + monthName(_cal, _sel.month);
    }

    // ================================================================
    //  SCROLL DETECTION (once per open)
    // ================================================================
    var _scrollHandlers = [];
    var _curMn = 0, _curMx = 0;   /* currently rendered year range */
    function detachScroll() {
        _scrollHandlers.forEach(function (h) { h.list.removeEventListener('scroll', h.fn); });
        _scrollHandlers = [];
    }
    function attachScroll() {
        detachScroll();
        [{ list: _el.yearList, key: 'year' }, { list: _el.monthList, key: 'month' }, { list: _el.dayList, key: 'day' }].forEach(function (cfg) {
            var ticking = false;
            function onScroll() {
                if (!ticking) {
                    ticking = true;
                    requestAnimationFrame(function () {
                        ticking = false;
                        detectCenter(cfg.list, cfg.key);
                    });
                }
            }
            /* CLICK-to-select: tapping/clicking any item selects it —
               previously only scrolling changed the value ("click does
               not change, it locks") */
            cfg.list.addEventListener('click', function (ev) {
                var it = ev.target.closest('.dp-wheel-item');
                if (!it) return;
                _sel[cfg.key] = parseInt(it.dataset.value);
                renderAll();
                scrollToList(cfg.list, _sel[cfg.key]);
                updateDisplay();
            });
            cfg.list.addEventListener('scroll', onScroll, { passive: true });
            _scrollHandlers.push({ list: cfg.list, fn: onScroll });
        });
    }
    function detectCenter(list, key) {
        if (_scrolling || _rendering) return;
        var items = list.querySelectorAll('.dp-wheel-item');
        var rect = list.getBoundingClientRect();
        var center = rect.top + rect.height / 2;
        var best = null, bestDist = Infinity;
        items.forEach(function (it) {
            var r = it.getBoundingClientRect();
            var d = Math.abs(r.top + r.height / 2 - center);
            it.classList.remove('selected');
            it.style.transform = 'scale(0.88)';
            it.style.opacity = '0.5';
            if (d < bestDist) { bestDist = d; best = it; }
        });
        if (best) {
            best.classList.add('selected');
            best.style.transform = 'scale(1)';
            best.style.opacity = '1';
            var prev = _sel[key];
            var val = parseInt(best.dataset.value);
            if (prev === val) { updateDisplay(); return; }   /* no change → no re-render */
            _sel[key] = val;
            /* رندر مجدد فقط وقتی لازم است — سبکی:
               ماه → طول روزها؛ سال → فقط اگر به لبه‌ی بازه رسیده باشد */
            if (key === 'month') renderAll();
            else if (key === 'year') {
                if (val <= _curMn + 10 || val >= _curMx - 10) renderAll();
                else updateDisplay();
            }
            else updateDisplay();
        }
    }

    // ================================================================
    //  OPEN / CLOSE
    // ================================================================
    function openPicker(opts) {
        buildModal();
        _opts = opts || {};
        _onSave = opts.onSave || null;
        /* همیشه در شمسی باز می‌شود — میلادی حذف شد */
        _cal = 'shamsi';

        if (opts.defaultValue && !isNaN(parseInt(opts.defaultValue.year)) &&
            parseInt(opts.defaultValue.year) > 0 &&
            !isNaN(parseInt(opts.defaultValue.month)) &&
            !isNaN(parseInt(opts.defaultValue.day))) {
            _sel = { year: parseInt(opts.defaultValue.year), month: parseInt(opts.defaultValue.month), day: parseInt(opts.defaultValue.day) };
        } else {
            /* invalid/missing default → sensible fallback per calendar
               (NaN/undefined year previously rendered nothing and the
               wheel visually "stuck" at the first rendered year 1300) */
            var now = new Date();
            _sel = _cal === 'shamsi'
                ? ShamsiConv.g2j(now.getFullYear(), now.getMonth() + 1, now.getDate())
                : { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
        }
        /* محدودیت برداشته شد — سال انتخابی آزاد است؛ بازه رندر حول آن می‌چرخد */

        document.getElementById('dpTogSh').classList.add('active');

        renderAll();
        attachScroll();

        // Show
        _el.overlay.classList.add('active');
        _el.container.classList.add('active');
        _isOpen = true;
        document.body.style.overflow = 'hidden';
    }

    function closePicker() {
        if (!_isOpen) return;
        _el.overlay.classList.remove('active');
        _el.container.classList.remove('active');
        _isOpen = false;
        document.body.style.overflow = '';
        detachScroll();
    }

    // ================================================================
    //  PUBLIC API
    // ================================================================
    window.DateWheelPicker = {
        open: openPicker,
        close: closePicker,
        shamsiToMiladi: function (y, m, d) { return ShamsiConv.j2g(y, m, d); },
        miladiToShamsi: function (y, m, d) { return ShamsiConv.g2j(y, m, d); },
        toFaDigits: toFa
    };

})();
