// ================================================================
//  YOGA PLAYER — پخش‌کننده تمرین‌های یوگا
//  شامل:
//    - YogaSessionPlayer : موتور اجرای دنباله‌ی تمرین (تنفس، تایمر، تصویر، آمار)
//    - YogaPracticeUI    : تب «🧘 جلسه تمرین» — کارت‌های تمرین‌های آماده (فارسی + قفل پلنی)
//    - YogaCoachUI       : تب «👨‍🏫 مربی یوگا» — مربی‌ها + نمای فنی تمرین‌ها
//  داده: static/yoga-data/ + API /api/v5/yoga/practices, /instructors
// ================================================================
(function () {
'use strict';

var D = window.YOGA_DATA;

var LEVEL_FA = { beginner: 'مبتدی', intermediate: 'متوسط', expert: 'پیشرفته', advanced: 'پیشرفته' };
var LEVEL_KEYS = ['beginner', 'intermediate', 'expert'];
var STYLE_FA = { yin: 'یین', hatha: 'هاتا', vinyasa: 'وینیاسا', flow: 'جریان', power: 'پاور', restorative: 'ترمیمی', ashtanga: 'آشتانگا', classic: 'کلاسیک' };
var TIER_FA = { free: 'رایگان', gold: 'طلایی', diamond: 'الماسی' };
var PHRASE_FA = { none: '', soften: 'نرم‌شو', relax: 'آرامش', breathe: 'نفس' };
var SIDE_FA = { L: 'سمت چپ', R: 'سمت راست' };
var FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
/* ترجمه فارسی معتبر تمرین‌ها — جلوی «سالوم خروشید» و نام‌های خام انگلیسی را می‌گیرد.
   اگر name_fa دیتابیس معتبر نبود (نام فینگلیش/ماشینی)، این عنوان استفاده می‌شود. */
var PRACTICE_NAME_FA = {
    ocean: 'اقیانوس',
    desert: 'کویر',
    mountain: 'کوه',
    sun_salutation_a: 'سلام خورشید A',
    sun_salutation_b: 'سلام خورشید B',
};
/* هر displayName حاوی این تکه‌ها، ترجمه ماشینی ناقص از Sun Salutation است */
var BAD_NAME_RX = /خروش|سالوم|Surya|Namaskar|Sun Salutation|Salute/i;
function practiceTitle(p) {
    if (!p) return '';
    /* برای تمرین‌های اصلی، نام فارسی استاندارد همیشه ملاک است —
       name_fa دیتابیس ممکن است غلط تایپی («اقائوس») یا ماشینی («سالوم خروشید») باشد */
    if (PRACTICE_NAME_FA[p.name]) return PRACTICE_NAME_FA[p.name];
    if (!p.displayName || BAD_NAME_RX.test(p.displayName)) return p.name;
    return p.displayName;
}
/* محیط‌های کلاسیک به فارسی — نمایش در کارت‌ها و صفحات تمرین */
var BG_FA = {
    Home: 'خانه', Studio: 'استودیو', Office: 'دفتر', Ocean: 'اقیانوس', Desert: 'کویر',
    Mountain: 'کوه', Dojo: 'دوجو', Temple: 'معبد', Palace: 'کاخ',
    Shiva: 'شیوا', Vishnu: 'ویشنو', Buddha: 'بودا', 'Samādhi': 'سماادی',
};
function bgFa(name) { return BG_FA[name] || name || ''; }

/* ── تصاویر تمرین‌ها ──
   پس‌زمینه‌ی محیط هر تمرین از drawable-large-xhdpi (همان تصاویر استودیو کلاسیک)؛
   سلام خورشید A/B تصویر «سما» (ایستاده، pose_mountain) را می‌گیرند. */
var CLASSIC_RES = 'static/yoga-data/resources/res/';
function practiceBgImage(p) {
    var bg = bgForPractice(p);
    var map = {
        Home: 'bg_l1_home.jpg', Studio: 'bg_l1_studio.jpg', Office: 'bg_l1_office.jpg',
        Ocean: 'bg_l2_ocean.jpg', Desert: 'bg_l2_desert.jpg', Mountain: 'bg_l2_mountain.jpg',
        Dojo: 'bg_l3_dojo.jpg', Temple: 'bg_l3_temple.jpg', Palace: 'bg_l3_palace.jpg',
        Shiva: 'bg_l4_shiva.jpg', Vishnu: 'bg_l4_vishnu.jpg', Buddha: 'bg_l4_buddha.jpg',
        'Samādhi': 'bg_l5_samadhi.jpg',
    };
    var file = map[bg];
    return file ? (CLASSIC_RES + 'drawable-large-xhdpi/' + file) : '';
}
/* تصویر نماینده‌ی تمرین: اول محیط، برای سلام خورشیدها «سما» (ایستاده) */
function practiceImage(p, size) {
    var dir = size === 'full' ? 'drawable-large-xhdpi/' : 'drawable-mdpi/';
    if (p && (p.name === 'sun_salutation_a' || p.name === 'sun_salutation_b')) {
        return CLASSIC_RES + dir + 'pose_mountain.png';
    }
    return practiceBgImage(p);
}
/* توضیحات فارسی کامل و وفادار تمرین‌های اصلی — معادل کامل متن انگلیسی XML
   (منبع: static/yoga-classic/data.js PRACTICE_FA که ترجمه کامل این توضیحات است) */
var PRACTICE_DESC_FA = {
    ocean: 'تمرین اقیانوس تمرینی با شدت بالا و تناوبی (HIIT) است که بین موج‌های جریان وینیاسا، وضعیت‌های نگه‌داشتن قدرتی و حالت‌های بازکننده در رفت‌وبرگشت است.\n\n«موجی را پیدا کن، موج خودت، موج پرانیک شخصی خودت را — و سوارش شو تا به رهایی ذهن، بدن و روح برسی…»',
    desert: 'تمرین کویر تمرکز ویژه‌ای بر آرام کردن ذهن، باز کردن پیچ‌وتاب‌های بدن و مهم‌تر از همه گشودن قلب دارد. مسیر رهایی در تمرین کویر از انعطاف‌پذیری و پاک‌سازی می‌گذرد. وقتی بدن گشوده می‌شود و انعطاف‌پذیری بهبود می‌یابد، انرژی پرانیک مسدودشده پاک‌سازی و فرآیندهای شفا را شعله‌ور می‌کند.\n\n«در کویر فضای آن را داری که آرام شوی، گشوده شوی، روی زمین پهن کویر گسترده شوی و شفا بگیری.»',
    mountain: 'کوه تمرینی قدرت‌محور است که با القای حس خودانضباطی، استقامت و تمرکز یک‌نقطه‌ای، بدن و ذهن را تقویت می‌کند. در تمرین کوه آهسته‌تر حرکت می‌کنیم، با جریان وینیاسای کمتر میان وضعیت‌ها. افزون بر این، وضعیت‌ها را به‌طور چشمگیری طولانی‌تر نگه می‌داریم؛ تعادل‌های دستی بیشتری انجام می‌دهیم و وضعیت‌های قدرتی دیگری تمرین می‌کنیم.\n\n«تمرین تو آنجا آغاز می‌شود که می‌خواهی از وضعیت بیایی بیرون.»',
    sun_salutation_a: 'سلام خورشید A — گونه‌ی جریان گایا از سوریا ناماسکارا کا — توالی‌ای از وضعیت‌هاست که در جریانی موزون و رفت‌وبرگشتی از حرکت و تنفس اجرا می‌شود؛ قدرت را می‌سازد، انعطاف‌پذیری را افزایش می‌دهد و حسی از تندرستی ایجاد می‌کند. این توالیِ کند و آرام، تمرینی درونی و مراقبه‌گونه از شفا و گسترش در سطوحی چندگانه را تشویق می‌کند.',
    sun_salutation_b: 'سلام خورشید B — گونه‌ی جریان گایا از سوریا ناماسکارا کها — توالی‌ای از وضعیت‌هاست که در جریانی سخت‌گیرانه‌ی وینیاسا با تمرکز تنفس آتشین اجرا می‌شود؛ سوخت‌وساز را برمی‌انگیزد و انرژی راکد را به حرکت درمی‌آورد. این توالیِ تند، آمادگی قلبی‌عروقی، پاک‌سازی و رهاسازی استرس را تقویت می‌کند.',
};
function practiceDesc(p) {
    if (!p) return '';
    /* برای تمرین‌های اصلی، ترجمه کامل استاندارد همیشه ملاک است */
    if (PRACTICE_DESC_FA[p.name]) return PRACTICE_DESC_FA[p.name];
    /* اگر توضیح فارسی دیتابیس معتبر بود (فارسیِ واقعی، نه ترجمه ماشینی) از آن استفاده کن */
    if (p.description && !BAD_NAME_RX.test(p.description) && /[؀-ۿ]/.test(p.description)) return p.description;
    return p.description || '';
}

function esc(s) {
    return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function faNum(n) {
    n = (n == null ? '' : String(n));
    return n.replace(/\d/g, function (d) { return FA_DIGITS[+d]; });
}
function fmtSec(sec) {
    sec = Math.max(0, Math.round(sec));
    var m = Math.floor(sec / 60), s = sec % 60;
    return (m < 10 ? '0' + m : '' + m) + ':' + (s < 10 ? '0' + s : '' + s);
}
function faMin(mins) { return faNum(mins) + ' دقیقه'; }
function authToken() { try { return localStorage.getItem('cosmic_token') || ''; } catch (e) { return ''; } }
function authHeaders() {
    var t = authToken();
    return t ? { 'Authorization': 'Bearer ' + t } : {};
}

/** تصویر حرکت — از منیفست تصاویر (YogaCore) با fallback به SVG */
function poseImage(name, side) {
    var url = '';
    try {
        if (window.YogaCore && window.YogaCore.getImage) {
            url = window.YogaCore.getImage(name, { size: 'full', side: side === 'R' || side === 'L' ? side : 'N' });
        }
    } catch (e) { url = ''; }
    return url || '';
}
/** نام فارسی حرکت — از YogaCore یا posedata یوگا */
function poseNameFa(name) {
    if (!name) return '';
    try {
        if (window.YogaCore && window.YogaCore.get && window.YogaCore.nameFa) {
            var p = window.YogaCore.get(name);
            if (p) { var fa = window.YogaCore.nameFa(p); if (fa) return fa; }
        }
    } catch (e) {}
    return name;
}
function poseSanskrit(name) {
    var p = D && D.pose(name);
    return p && p.sanskritName ? p.sanskritName : '';
}
function userIsPremium() {
    try {
        var u = JSON.parse(localStorage.getItem('cosmic_user') || '{}');
        return ['gold', 'diamond', 'pro', 'enterprise'].indexOf(u.plan || 'free') >= 0;
    } catch (e) { return false; }
}

/** پس‌زمینه‌ی تمرین — تمرین‌های اصلی تم خودشان را دارند؛ بقیه از API یا پیش‌فرض */
function bgForPractice(p) {
    var bg = (p && (p.preferred_background || p.preferredBackgroundName)) || '';
    var map = { ocean: 'Ocean', desert: 'Desert', mountain: 'Mountain', sun_salutation_a: 'Studio', sun_salutation_b: 'Studio' };
    if ((!bg || bg === 'Home') && p && map[p.name]) bg = map[p.name];
    return bg || 'Home';
}
function bgColor(name) {
    var b = (D.backgrounds || []).filter(function (x) { return x.name === name; })[0];
    return b ? b.color : '';
}
function hexA(hex, a) {
    hex = String(hex || '').replace('#', '');
    if (hex.length !== 6) return '';
    var n = parseInt(hex, 16);
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
}

// ════════════════════════════════════════════════════════════════
//  YogaSessionPlayer — موتور اجرای جلسه (متناسب با فرمت حرفه‌ای)
// ════════════════════════════════════════════════════════════════
function YogaSessionPlayer(practice, opts) {
    opts = opts || {};
    this.practice = practice;
    this.level = LEVEL_KEYS.indexOf(opts.level || 'beginner');
    if (this.level < 0) this.level = 0;
    this.levelKey = LEVEL_KEYS[this.level];
    this.targetMinutes = opts.duration || (practice.head.durations && practice.head.durations[0]) || 30;
    this.background = opts.background || (practice.body && practice.body.preferredBackgroundName) || 'Home';
    this.instructorName = opts.instructorName || practice.instructor_name || '';
    this.title = opts.title || '';
    this.onComplete = opts.onComplete || null;
    this.container = opts.container || null;   // عنصر DOM یا انتخابگر
    this.steps = [];
    this._running = false;
    this._paused = false;
    this._cancelled = false;
    this._ticker = null;
    this._idx = 0;
    this._current = null;
    this._stepRemainingMs = 0;
    this._elapsedMs = 0;
    this._side = 'L';
    this._lastPose = null;
    this._breathPhase = 'inhale';
    this._breathIdx = 0;
    this._doneCount = 0;
}

YogaSessionPlayer.prototype = {
    constructor: YogaSessionPlayer,

    resolve: function () {
        var ctx = { tempo: 4.0, side: 'L', lastPose: null };
        var out = [];
        var body = this.practice.body || {};
        var steps = body.steps || [];
        this._flatten(steps, this.level, ctx, out);
        this.steps = out;

        var est = 0;
        out.forEach(function (s) { est += s.duration || 0; });
        var scale = 1;
        if (est > 0) {
            var target = Math.max(60, this.targetMinutes * 60);
            scale = Math.max(0.5, Math.min(2.5, target / est));
            if (Math.abs(scale - 1) > 0.01) {
                out.forEach(function (s) {
                    if (s.duration) s.duration = +(s.duration * scale).toFixed(2);
                });
            }
        }
        this._totalSeconds = est * scale || 1;
        return this.steps;
    },

    _flatten: function (steps, level, ctx, out) {
        var self = this;
        (steps || []).forEach(function (s) {
            switch (s.type) {
                case 'tempo':
                    ctx.tempo = +s.duration || 4.0;
                    break;
                case 'music':
                    break;
                case 'move': {
                    var to = (D && D.moveTarget(s.name)) || ctx.lastPose || null;
                    out.push({ type: 'move', name: s.name, toPose: to, duration: ctx.tempo, side: ctx.side });
                    if (to) { ctx.lastPose = to; self._lastPose = to; }
                    break;
                }
                case 'pose': {
                    out.push({ type: 'pose', name: s.name, side: s.side || ctx.side, duration: ctx.tempo });
                    ctx.lastPose = s.name;
                    self._lastPose = s.name;
                    break;
                }
                case 'hold': {
                    var count = +s.count || 5;
                    out.push({ type: 'hold', count: count, phrase: s.phrase || 'none', duration: count * ctx.tempo, side: ctx.side, pose: ctx.lastPose || null });
                    break;
                }
                case 'switchside':
                    ctx.side = ctx.side === 'L' ? 'R' : 'L';
                    out.push({ type: 'switchside', side: ctx.side, duration: 0 });
                    break;
                case 'loop': {
                    var arr = (s.count && s.count.length) ? s.count : [1];
                    var times = arr[Math.min(level, arr.length - 1)] || 1;
                    for (var i = 0; i < times; i++) {
                        self._flatten(s.steps, level, ctx, out);
                        if (s.switchside && i < times - 1) {
                            ctx.side = ctx.side === 'L' ? 'R' : 'L';
                            out.push({ type: 'switchside', side: ctx.side, duration: 0 });
                        }
                    }
                    break;
                }
                case 'difficulty': {
                    var lvls = s.levels || {};
                    var key = LEVEL_KEYS[level] || 'beginner';
                    var pick = lvls[key] || lvls[Object.keys(lvls)[0]] || [];
                    self._flatten(pick, level, ctx, out);
                    break;
                }
            }
        });
    },

    // ─── کنترل پخش ───
    start: function () {
        if (this._running) return;
        this.resolve();
        this._running = true;
        this._paused = false;
        this._cancelled = false;
        this._elapsedMs = 0;
        this._idx = 0;
        this._side = 'L';
        this._breathPhase = 'inhale';
        this._doneCount = 0;
        this._bindControls();
        if (this.render) this.render();
        this._advance();
        var self = this;
        this._ticker = setInterval(function () { self._tick(); }, 100);
        this._ambient(true);
    },

    pause: function () { this._paused = true; if (this.render) this.render(); },
    resume: function () { this._paused = false; if (this.render) this.render(); },
    // «بعدی» حتی هنگام توقف هم گام بعدی را نشان می‌دهد (در حالت pause می‌ماند)
    next: function () { if (this._running) this._advance(); },
    prev: function () {
        if (!this._running) return;
        if (this._idx > 1) { this._idx -= 2; this._doneCount = Math.max(0, this._doneCount - 1); }
        this._advance();
    },

    /** نوار پیشروی: پرش به نقطه‌ی دلخواه از جلسه (بر اساس زمان) */
    seekTo: function (frac) {
        if (!this._running || this._cancelled) return;
        var steps = this.steps;
        if (!steps.length) return;
        frac = Math.max(0, Math.min(1, frac || 0));
        if (frac >= 0.999) { this._idx = steps.length; this.stop(true); return; }
        var totalSec = this._totalSeconds || 1;
        var target = frac * totalSec;
        var acc = 0, k = 0;
        for (; k < steps.length; k++) {
            var d = steps[k].duration || 0;
            if (acc + d >= target) break;
            acc += d;
        }
        if (k >= steps.length) k = steps.length - 1;
        this._elapsedMs = acc * 1000;
        this._idx = k;
        this._advance();
        this._doneCount = Math.min(this._idx, steps.length);
    },

    /** اتصال رویداد دکمه‌ها/نوار جستجو به کانتینر پلیر — چندباری قابل استفاده (بعد از پایان/اجرای دوباره هم کار می‌کند) */
    _bindControls: function () {
        var el = (typeof this.container === 'string') ? document.getElementById(this.container) : this.container;
        if (!el) return;
        if (!el._ypBound) {
            el._ypBound = true;
            el.addEventListener('click', function (e) {
                var p = el._ypPlayer;
                if (!p) return;
                var t = e.target;
                if (!t || !t.closest) return;
                var ctrl = t.closest('[data-yp]');
                if (!ctrl) return;
                var cmd = ctrl.getAttribute('data-yp');
                if (cmd === 'pause') { p.pause(); e.stopPropagation(); }
                else if (cmd === 'resume') { p.resume(); e.stopPropagation(); }
                else if (cmd === 'skip') { p.next(); e.stopPropagation(); }
                else if (cmd === 'prev') { p.prev(); e.stopPropagation(); }
                else if (cmd === 'end') { p.stop(false); e.stopPropagation(); }
            });
            // کشیدن/کلیک روی نوار جستجو — رو به جلو/عقب
            el.addEventListener('mousedown', function (e) {
                var p = el._ypPlayer;
                if (!p || !p._running) return;
                var t = e.target;
                if (!t || !t.closest) return;
                if (!t.closest('[data-yp-seek]')) return;
                e.preventDefault();
                e.stopPropagation();
                document._ypDragHost = el;
                p._seekFromEvent(e);
            });
            if (!document._ypDragBound) {
                document._ypDragBound = true;
                document.addEventListener('mousemove', function (e) {
                    var h = document._ypDragHost;
                    if (!h) return;
                    var p = h._ypPlayer;
                    if (!p || !p._running) { document._ypDragHost = null; return; }
                    p._seekFromEvent(e);
                });
                document.addEventListener('mouseup', function () { document._ypDragHost = null; });
            }
        }
        el._ypPlayer = this;
    },

    /** تبدیل مختصات کلیک/کشیدن روی نوار پیشروی به جایگاه زمانی */
    _seekFromEvent: function (e) {
        var el = (typeof this.container === 'string') ? document.getElementById(this.container) : this.container;
        if (!el) return;
        var seek = el.querySelector('.yp-seek');
        if (!seek) return;
        var r = seek.getBoundingClientRect();
        if (r.width > 0) this.seekTo((e.clientX - r.left) / r.width);
    },

    stop: function (completed) {
        if (!this._running) return;
        this._running = false;
        this._cancelled = true;
        clearInterval(this._ticker);
        this._ticker = null;
        this._ambient(false);
        var elapsed = Math.round(this._elapsedMs / 1000);
        if (completed && elapsed >= 30) this._record(elapsed);
        if (this.onComplete) {
            try { this.onComplete(completed, elapsed, Math.min(this._idx, this.steps.length), this.steps.length); } catch (e) {}
        }
    },

    _advance: function () {
        if (this._cancelled) return;
        if (this._idx >= this.steps.length) { this.stop(true); return; }
        var s = this.steps[this._idx++];
        if (s.type === 'move' || s.type === 'pose' || s.type === 'hold') this._doneCount = Math.min(this._doneCount + 1, this.steps.length);
        this._current = s;
        this._stepRemainingMs = Math.max(0, Math.round((s.duration || 0) * 1000));
        this._breathIdx = 0;
        this._breathPhase = 'inhale';
        if (s.type === 'switchside') this._side = s.side;
        if (this.render) this.render();
        if (this._stepRemainingMs === 0) this._advance();
    },

    /** سهم زمانی سپری‌شده از کل جلسه (۰ تا ۱۰۰) */
    _timePct: function () {
        var total = (this._totalSeconds || 0) * 1000;
        return total ? Math.min(100, Math.round(this._elapsedMs / total * 100)) : 0;
    },

    _tick: function () {
        if (!this._running || this._paused || this._cancelled) return;
        this._elapsedMs += 100;
        if (this._current) {
            this._stepRemainingMs = Math.max(0, this._stepRemainingMs - 100);
            if (this._current.type === 'hold' && this._current.duration > 0) {
                var breathMs = (this._current.duration * 1000) / this._current.count;
                var idx = Math.floor((this._current.duration * 1000 - this._stepRemainingMs) / breathMs);
                if (idx !== this._breathIdx) {
                    this._breathIdx = idx;
                    this._breathPhase = (idx % 2 === 0) ? 'inhale' : 'exhale';
                }
            }
            // فقط گره‌های متغیر را به‌روز کن (بدون بازسازی DOM → دکمه‌ها همیشه کلیک‌پذیر می‌مانند)
            if (this._refreshTick) this._refreshTick();
            if (this._stepRemainingMs === 0) this._advance();
        }
    },

    /** به‌روزرسانی سبک گره‌های متغیر هر تیک (تایمر، نفس، نوار پیشروی، درصد) */
    _refreshTick: function () {
        var el = (typeof this.container === 'string') ? document.getElementById(this.container) : this.container;
        if (!el) return;
        var s = this._current;
        if (!s) return;
        var tPct = this._timePct();
        var fill = el.querySelector('.yp-progress-fill');
        if (fill) fill.style.width = tPct + '%';
        var pctEl = el.querySelector('.yp-pct');
        if (pctEl) pctEl.textContent = faNum(tPct) + '٪';
        var big = el.querySelector('.yp-timer-big');
        var countEl = el.querySelector('.yp-count');
        var breathText = el.querySelector('.yp-breath-text');
        var circle = el.querySelector('.yoga-circle');
        var isHold = s.type === 'hold';
        var remaining = this._stepRemainingMs / 1000;
        if (isHold) {
            var b = Math.min(this._breathIdx + 1, s.count);
            if (big) big.textContent = faNum(b) + ' نفس';
            if (countEl) countEl.textContent = 'نفس ' + faNum(b) + ' از ' + faNum(s.count) + ' · ' + fmtSec(remaining) + ' باقی';
        } else {
            if (big) big.textContent = Math.ceil(remaining) + 's';
            if (countEl) countEl.textContent = (s.type === 'move' || s.type === 'pose' ? 'انتقال · ' : '') + fmtSec(remaining) + ' ثانیه';
        }
        if (breathText) {
            if (isHold) breathText.textContent = this._breathPhase === 'inhale' ? 'دم بکش' : 'بازدم';
            else breathText.textContent = 'انتقال';
        }
        if (circle) {
            circle.classList.remove('inhale', 'exhale');
            if (isHold) circle.classList.add(this._breathPhase);
        }
        var elap = el.querySelector('.yp-elapsed');
        if (elap) elap.textContent = '⏱ ' + fmtSec(this._elapsedMs / 1000) + ' / ' + fmtSec(this._totalSeconds || 0) + ' · حرکت ' + faNum(Math.min(this._idx, this.steps.length)) + ' از ' + faNum(this.steps.length);
    },

    _record: function (elapsedSec) {
        var token = authToken();
        if (!token) return;
        var name = (this.practice.head && this.practice.head.name) || this.practice.name || 'تمرین یوگا';
        fetch('/api/v5/yoga/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify({
                pose_id: null,
                pose_name: name,
                category: 'asanas',
                duration_seconds: elapsedSec,
                completed: true,
                notes: 'تمرین آماده (' + (this.practice.file || this.practice.name || '') + ')'
            })
        }).catch(function () {});
    },

    /** موسیقی محیطی متناسب با پس‌زمینه‌ی تمرین — هر محیط آهنگ خودش را دارد */
    _bgTrack: function () {
        var map = {
            Home: 'cosmic-drone', Studio: 'cosmic-drone', Office: 'cosmic-drone',
            Ocean: 'ocean-waves', Desert: 'wind-chimes', Mountain: 'tibetan-bowl',
            Dojo: 'tibetan-bowl', Temple: 'singing-bowl', Palace: 'wind-chimes',
            Shiva: 'deep-space', Vishnu: 'cosmic-drone', Buddha: 'singing-bowl', 'Samādhi': 'deep-space'
        };
        var id = map[this.background];
        if (!id) return AudioManager.getCurrentTrack();
        try {
            var ok = (AudioManager.getTracks() || []).some(function (t) { return t.id === id; });
            return ok ? id : AudioManager.getCurrentTrack();
        } catch (e) { return AudioManager.getCurrentTrack(); }
    },
    _bgTrackName: function () {
        try {
            var id = this._bgTrack();
            var t = (AudioManager.getTracks() || []).filter(function (x) { return x.id === id; })[0];
            return t ? t.icon + ' ' + t.name : '';
        } catch (e) { return ''; }
    },

    _ambient: function (on) {
        try {
            if (!window.AudioManager) return;
            if (on) { if (AudioManager.play) AudioManager.play(this._bgTrack()); }
            else if (AudioManager.stop) AudioManager.stop();
        } catch (e) {}
    },

    // ─── رندر حرفه‌ای (بازسازی ساختار؛ به‌روزرسانی تیک سبک است) ───
    render: function () {
        if (!this.container) return;
        var el = typeof this.container === 'string' ? document.getElementById(this.container) : this.container;
        if (!el) return;
        var s = this._current;
        if (!s) { el.innerHTML = ''; return; }
        // محیط تمرین — رنگ پس‌زمینه‌ی انتخابی به‌صورت هاله در کل پلیر اعمال می‌شود
        var bgCol = bgColor(this.background);
        if (bgCol) {
            el.style.setProperty('--yp-accent', hexA(bgCol, .55) || 'rgba(184,160,90,.35)');
            el.setAttribute('data-yp-bg', this.background);
        } else {
            el.style.removeProperty('--yp-accent');
        }
        // حرکت: pose هدفِ خودش · حالت/نگه‌داره: poseای که در همان لحظه بیک شده — نه آخرین pose کل جلسه
        var poseName = s.pose || s.toPose || s.name || this._lastPose || '';
        this._lastPose = poseName;
        var poseFa = poseNameFa(poseName) || poseName;
        var img = poseImage(poseName, s.side || this._side);
        var sk = poseSanskrit(poseName);
        var isHold = s.type === 'hold';
        var phaseText = '';
        var phaseCls = '';
        if (isHold) {
            phaseText = this._breathPhase === 'inhale' ? 'دم بکش' : 'بازدم';
            phaseCls = this._breathPhase === 'inhale' ? 'inhale' : 'exhale';
        } else if (s.type === 'move' || s.type === 'pose') {
            phaseText = 'انتقال';
        }
        var total = this.steps.length;
        var tPct = this._timePct();
        var phrase = isHold && PHRASE_FA[s.phrase] ? '<span class="yp-phrase">' + esc(PHRASE_FA[s.phrase]) + '</span>' : '';
        var sideBadge = (s.side || this._side) && SIDE_FA[s.side || this._side]
            ? '<span class="yp-side">' + esc(SIDE_FA[s.side || this._side]) + '</span>' : '';
        var ambLabel = this._bgTrackName();
        var remaining = this._stepRemainingMs / 1000;
        var countText = '';
        var bigTimer = '';
        if (isHold) {
            var b = Math.min(this._breathIdx + 1, s.count);
            bigTimer = faNum(b) + ' نفس';
            countText = 'نفس ' + faNum(b) + ' از ' + faNum(s.count) + ' · ' + fmtSec(remaining) + ' باقی';
        } else {
            bigTimer = Math.ceil(remaining) + 's';
            countText = (s.type === 'move' || s.type === 'pose' ? 'انتقال · ' : '') + fmtSec(remaining) + ' ثانیه';
        }

        el.innerHTML =
            '<div class="yp-topbar">' +
                '<div class="yp-top-left">' +
                    '<span class="yp-title">🧘 ' + esc(this.title || (this.practice.head && this.practice.head.name) || this.practice.name || 'تمرین') + '</span>' +
                    '<span class="yp-badges">' +
                        esc(LEVEL_FA[this.levelKey] || this.levelKey) + ' · ' + faMin(this.targetMinutes) +
                        (this.instructorName ? ' · 👤 ' + esc(this.instructorName) : '') +
                        (ambLabel ? ' · 🎵 ' + esc(ambLabel) : '') +
                    '</span>' +
                '</div>' +
                '<div class="yp-pct">' + faNum(tPct) + '٪</div>' +
            '</div>' +
            '<div class="yp-progress yp-seek" data-yp-seek title="برای رفتن به نقطه‌ی دلخواه از تمرین کلیک کنید" role="slider" aria-label="نوار پیشروی تمرین">' +
                '<div class="yp-progress-fill" style="width:' + tPct + '%"></div>' +
                '<span class="yp-progress-knob" style="left:' + tPct + '%"></span>' +
            '</div>' +
            '<div class="yp-seek-labels">' +
                '<span class="yp-time-cur">⏱ ' + fmtSec(this._elapsedMs / 1000) + '</span>' +
                '<span class="yp-time-total">' + fmtSec(this._totalSeconds || 0) + '</span>' +
            '</div>' +
            '<div class="yp-main">' +
                '<div class="yp-stage">' +
                    (img ? '<img class="yp-img" src="' + esc(img) + '" alt="' + esc(poseFa) + '">' : '') +
                    '<div class="yp-pose-name">' + esc(poseFa) + '</div>' +
                    (sk ? '<div class="yp-pose-sanskrit">' + esc(sk) + '</div>' : '') +
                    sideBadge +
                    '<div class="yp-timer-big">' + esc(bigTimer) + '</div>' +
                '</div>' +
                '<div class="yp-breath">' +
                    '<div class="yoga-circle ' + phaseCls + '"><span class="yp-breath-text">' + esc(phaseText) + '</span></div>' +
                    '<div class="yp-count">' + esc(countText) + '</div>' +
                    phrase +
                '</div>' +
            '</div>' +
            '<div class="yp-controls">' +
                '<button class="yp-btn" data-yp="prev" ' + (this._idx <= 1 ? 'disabled' : '') + ' title="قبلی">⏮ قبلی</button>' +
                (this._paused
                    ? '<button class="yp-btn primary" data-yp="resume">▶ ادامه</button>'
                    : '<button class="yp-btn primary" data-yp="pause">⏸ توقف</button>') +
                '<button class="yp-btn" data-yp="skip">⏭ بعدی</button>' +
                '<button class="yp-btn danger" data-yp="end">✖ پایان</button>' +
            '</div>' +
            '<div class="yp-elapsed">حرکت ' + faNum(Math.min(this._idx, total)) + ' از ' + faNum(total) + '</div>';
    }
};

// ════════════════════════════════════════════════════════════════
//  صفحه‌ی اختصاصی تمرین — مشترک بین تب تمرین و تب مربی‌ها
// ════════════════════════════════════════════════════════════════
function detailPageHTML(p, state) {
    var bg = bgForPractice(p);
    var col = bgColor(bg);
    var accent = hexA(col, .16) || 'rgba(184,160,90,.1)';
    var style = STYLE_FA[p.style] ? '<span class="yp-chip">' + esc(STYLE_FA[p.style]) + '</span>' : '';
    var lvls = (p.difficulties || []).filter(function (d) { return LEVEL_FA[LEVEL_KEYS[d]]; }).map(function (d) {
        return '<span class="yp-chip dim">' + esc(LEVEL_FA[LEVEL_KEYS[d]]) + '</span>';
    }).join('');
    var instr = p.instructor_name ? '<span class="yp-instructor">👤 ' + esc(p.instructor_name) + '</span>' : '';
    var durBtns = (p.durations || [30]).map(function (d) {
        return '<button class="yp-dur-btn' + (state.duration === d ? ' active' : '') + '" data-yp-duration="' + d + '">' + faNum(d) + '</button>';
    }).join('');
    var bgOpts = (D.backgrounds || []).map(function (b) {
        return '<option value="' + esc(b.name) + '"' + ((state.backgroundOverridden ? state.background : bg) === b.name ? ' selected' : '') + '>' +
            esc(bgFa(b.name)) + (b.locked ? ' 🔒' : '') + '</option>';
    }).join('');
    var lock = p.locked
        ? '<span class="yp-lock">🔒 ' + esc(TIER_FA[p.tier] || p.tier) + '</span>'
        : '<span class="yp-lock free">رایگان</span>';
    var target = state.level === 'expert' ? 45 : state.level === 'intermediate' ? 30 : 20;
    var heroImg = practiceImage(p, 'full');
    return '<div class="yp-detail" style="--yp-detail-accent:' + accent + ';--yp-detail-color:' + (col ? hexA(col, .55) : '') + '">' +
            '<div class="yp-detail-hero">' +
                '<button class="yp-detail-back" data-yp-detail-back>→ بازگشت به فهرست</button>' +
                '<div class="yp-detail-hero-row">' +
                    '<div class="yp-detail-hero-info">' +
                        '<div class="yp-detail-title">🧘 ' + esc(practiceTitle(p)) + '</div>' +
                        '<div class="yp-detail-meta">' + style + lvls + lock + instr + '</div>' +
                        '<div class="yp-detail-bg">🌄 محیط: ' + esc(bgFa(bg)) + '</div>' +
                    '</div>' +
                    (heroImg ? '<img class="yp-detail-hero-img" src="' + esc(heroImg) + '" alt="' + esc(practiceTitle(p)) + '">' : '') +
                '</div>' +
            '</div>' +
            '<div class="yp-detail-body">' +
                '<p class="yp-detail-desc">' + esc(practiceDesc(p)) + '</p>' +
                '<div class="yp-detail-stats">' +
                    '<div class="yp-detail-stat"><b>' + faNum((p.durations || []).join('، ')) + '</b><span>دقیقه</span></div>' +
                    '<div class="yp-detail-stat"><b>' + faNum(p.poseCount || 0) + '</b><span>حرکت</span></div>' +
                    '<div class="yp-detail-stat"><b>' + faNum(target) + '</b><span>دقیقه پیشنهادی</span></div>' +
                '</div>' +
                '<div class="yp-opts">' +
                    '<div class="yp-set"><span class="yp-set-label">سطح دشواری</span>' +
                        '<div class="yp-levels">' +
                            '<button class="yp-level-btn' + (state.level === 'beginner' ? ' active' : '') + '" data-yp-level="beginner">مبتدی</button>' +
                            '<button class="yp-level-btn' + (state.level === 'intermediate' ? ' active' : '') + '" data-yp-level="intermediate">متوسط</button>' +
                            '<button class="yp-level-btn' + (state.level === 'expert' ? ' active' : '') + '" data-yp-level="expert">پیشرفته</button>' +
                        '</div>' +
                    '</div>' +
                    '<div class="yp-set"><span class="yp-set-label">مدت زمان</span><div class="yp-dur-btns">' + durBtns + '</div></div>' +
                    '<div class="yp-set"><span class="yp-set-label">پس‌زمینه</span>' +
                        '<select class="yp-bg-select" data-yp-background>' + bgOpts + '</select>' +
                    '</div>' +
                    '<div class="yp-detail-actions">' +
                        '<button class="yp-start-btn" data-yp-go>' + (p.locked ? '🔒 ارتقا برای شروع' : '▶ شروع تمرین') + '</button>' +
                        (p.locked ? '' : '<button class="yp-preview-btn" data-yp-detail-preview>👀 پیش‌نمایش سریع</button>') +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</div>';
}

// ════════════════════════════════════════════════════════════════
//  تب «🧘 جلسه تمرین» — کارت‌های تمرین‌های آماده (فارسی + قفل پلنی)
// ════════════════════════════════════════════════════════════════
var PracticeUI = {
    panelId: 'yogaPlayerPanel',
    active: null,
    selected: null,
    level: 'beginner',
    duration: 30,
    background: 'Home',
    backgroundOverridden: false,
    _detail: false,
    apiPractices: null,

    init: function () {
        var el = document.getElementById(this.panelId);
        if (!el) return;
        this.refreshClassicStats();
        var self = this;
        self._detail = false;
        D.whenReady(function () {
            if (window.YogaClassicModal && YogaClassicModal._el) return;  /* استودیو کلاسیک باز است — پنل را خراب نکن */
            self._loadApi().then(function () { self.renderSelector(el); })
                .catch(function () { self.renderSelector(el); });
        });
    },

    /** نوار آمار استودیو کلاسیک (کارما/جلسه/دقیقه/هفته/آخرین) — از localStorage؛
        بعد از بستن مودال کلاسیک هم صدا زده می‌شود تا آمار بلافاصله تازه شود.
        شمارش «جلسه» فقط تمرین‌های کامل‌شده است؛ «دقیقه» همیشه کل زمان تمرین. */
    refreshClassicStats: function () {
        try {
            var k = JSON.parse(localStorage.getItem('py_karma') || '0') || 0;
            var hist = JSON.parse(localStorage.getItem('py_history') || '[]') || [];
            var totalMin = 0, sessions = 0, weekCount = 0, weekStart = new Date();
            weekStart.setDate(weekStart.getDate() - weekStart.getDay());
            weekStart.setHours(0, 0, 0, 0);
            var last = null;
            hist.forEach(function (h) {
                totalMin += Math.round((h.seconds || 0) / 60);
                /* رکوردهای قدیمی (بدون flag) کامل فرض می‌شوند تا آمار از دست نرود */
                var done = (h.completed === undefined) ? true : !!h.completed;
                if (done) sessions++;
                if (done && h.date && new Date(h.date) >= weekStart) weekCount++;
                if (!last || h.date > last.date) last = h;
            });
            var faD = function (n) { return String(n == null ? 0 : n).replace(/[0-9]/g, function (d) { return '۰۱۲۳۴۵۶۷۸۹'[+d]; }); };
            var set = function (id, v) { var e2 = document.getElementById(id); if (e2) e2.textContent = faNum(v); };
            set('pycKarma', k);
            set('pycSessions', sessions);
            set('pycTime', totalMin);
            set('pycWeek', weekCount);
            var lw = document.getElementById('pycLastWrap');
            if (lw && last) {
                lw.style.display = '';
                var title = last.title || last.practice || '';
                var mins = Math.max(1, Math.round((last.seconds || 0) / 60));
                var le = document.getElementById('pycLast');
                if (le) le.textContent = title + ' (' + faD(mins) + '′)';
            }
        } catch (e) {}
    },

    /** بارگذاری تمرین‌ها از API (فارسی + مربی + قفل)، با fallback به static */
    _loadApi: function () {
        var self = this;
        if (this.apiPractices) return Promise.resolve(this.apiPractices);
        return fetch('/api/v5/yoga/practices', { headers: authHeaders() })
            .then(function (r) { return r.ok ? r.json() : null; })
            .then(function (data) {
                if (!data || !data.items) throw new Error('no api');
                var byName = {};
                (data.items || []).forEach(function (p) { byName[p.name] = p; });
                // ادغام با static تا هیچ تمرینی از دست نرود
                var merged = (D.practices || []).map(function (sp) {
                    var api = byName[sp.name] || {};
                    return {
                        name: sp.name,
                        displayName: api.displayName || '',
                        description: api.description || '',
                        style: api.style || sp.style || 'hatha',
                        durations: (api.durations && api.durations.length ? api.durations : sp.durations) || [30],
                        difficulties: api.difficulties || sp.difficulties || [0],
                        poseCount: api.poseCount || sp.poseCount || 0,
                        locked: !!api.locked,
                        tier: api.tier || 'free',
                        instructor_name: api.instructor_name || '',
                        preferred_background: api.preferred_background || '',
                    };
                });
                Object.keys(byName).forEach(function (k) {
                    var api = byName[k];
                    if (!merged.some(function (m) { return m.name === k; })) {
                        merged.push({
                            name: k, displayName: api.displayName || k, description: api.description || '',
                            style: api.style || 'hatha', durations: api.durations || [30], difficulties: api.difficulties || [0],
                            poseCount: api.poseCount || 0, locked: !!api.locked, tier: api.tier || 'free',
                            instructor_name: api.instructor_name || '',
                            preferred_background: api.preferred_background || '',
                        });
                    }
                });
                self.apiPractices = merged;
                return merged;
            });
    },

    renderSelector: function (el) {
        var self = this;
        var practices = this.apiPractices || D.practices || [];
        if (!practices.length) { el.innerHTML = '<p class="yp-note">⚠ داده‌های یوگا بارگذاری نشدند.</p>'; return; }
        if (this._detail && this.selected) { this.renderDetail(el, this.selected); return; }

        var cards = practices.map(function (p) {
            var sel = self.selected && self.selected.name === p.name ? ' active' : '';
            var style = STYLE_FA[p.style] ? '<span class="yp-chip">' + esc(STYLE_FA[p.style]) + '</span>' : '';
            var lvls = (p.difficulties || []).filter(function (d) { return LEVEL_FA[LEVEL_KEYS[d]]; }).map(function (d) {
                return '<span class="yp-chip dim">' + esc(LEVEL_FA[LEVEL_KEYS[d]]) + '</span>';
            }).join('');
            var lock = p.locked
                ? '<span class="yp-lock" title="این تمرین برای پلن ' + esc(TIER_FA[p.tier] || p.tier) + ' است">🔒 ' + esc(TIER_FA[p.tier] || p.tier) + '</span>'
                : '';
            var instr = p.instructor_name ? '<span class="yp-instructor">👤 ' + esc(p.instructor_name) + '</span>' : '';
            var thumb = practiceImage(p, 'thumb');
            return '<div class="yp-practice-card' + sel + '" data-yp-practice="' + esc(p.name) + '">' +
                (thumb ? '<div class="yp-card-thumb" style="background-image:url(\'' + esc(thumb) + '\')"></div>' : '') +
                '<div class="yp-card-top">' +
                    '<span class="yp-card-name">🧘 ' + esc(practiceTitle(p)) + '</span>' +
                    lock +
                '</div>' +
                '<div class="yp-card-meta">' + style + lvls + '</div>' +
                '<div class="yp-card-desc">' + esc(practiceDesc(p).slice(0, 110)) + (practiceDesc(p).length > 110 ? '…' : '') + '</div>' +
                '<div class="yp-card-foot">' +
                    '<span class="yp-card-dur">' + esc((p.durations || []).map(function (d) { return faNum(d); }).join('، ') + ' دقیقه') + '</span>' +
                    instr +
                '</div>' +
                '<div class="yp-card-count">' + (p.poseCount ? faNum(p.poseCount) + ' حرکت' : '') + '</div>' +
                '<div class="yp-card-actions">' +
                    '<button class="yp-start-btn' + (p.locked ? ' locked' : '') + '" data-yp-start="' + esc(p.name) + '">' +
                        (p.locked ? '🔒 ارتقا برای شروع' : '▶ شروع تمرین') +
                    '</button>' +
                    (p.locked ? '' : '<button class="yp-preview-btn" data-yp-preview="' + esc(p.name) + '" title="پیش‌نمایش سریع تمرین">👀 پیش‌نمایش</button>') +
                '</div>' +
            '</div>';
        }).join('');

        var durBtns = '';
        (this.selected && this.selected.durations || [30, 45, 60]).forEach(function (d) {
            durBtns += '<button class="yp-dur-btn' + (self.duration === d ? ' active' : '') + '" data-yp-duration="' + d + '">' + faNum(d) + '</button>';
        });
        var bgOpts = (D.backgrounds || []).map(function (b) {
            return '<option value="' + esc(b.name) + '"' + (self.background === b.name ? ' selected' : '') + '>' +
                esc(bgFa(b.name)) + (b.locked ? ' 🔒' : '') + '</option>';
        }).join('');

        el.innerHTML =
            '<div class="yp-selector">' +
                '<div class="yp-selector-head"><h3>تمرین‌های آماده</h3>' +
                    '<span class="yp-note">یک تمرین انتخاب کنید؛ سطح و مدت را تنظیم و شروع کنید</span>' +
                    '<button class="yp-classic-btn" data-yp-classic title="بازسازی وفادار Pocket Yoga با صدای اصلی">🎧 استودیو کلاسیک</button>' +
                '</div>' +
                '<div class="yp-practice-grid">' + cards + '</div>' +
                '<div class="yp-opts">' +
                    '<div class="yp-set"><span class="yp-set-label">سطح دشواری</span>' +
                        '<div class="yp-levels">' +
                            '<button class="yp-level-btn' + (self.level === 'beginner' ? ' active' : '') + '" data-yp-level="beginner">مبتدی</button>' +
                            '<button class="yp-level-btn' + (self.level === 'intermediate' ? ' active' : '') + '" data-yp-level="intermediate">متوسط</button>' +
                            '<button class="yp-level-btn' + (self.level === 'expert' ? ' active' : '') + '" data-yp-level="expert">پیشرفته</button>' +
                        '</div>' +
                    '</div>' +
                    '<div class="yp-set"><span class="yp-set-label">مدت زمان</span><div class="yp-dur-btns">' + durBtns + '</div></div>' +
                    '<div class="yp-set"><span class="yp-set-label">پس‌زمینه</span>' +
                        '<select class="yp-bg-select" data-yp-background>' + bgOpts + '</select>' +
                    '</div>' +
                '</div>' +
            '</div>';
        this.bindEvents(el);
    },

    /** صفحه‌ی اختصاصی هر تمرین — محیط (پس‌زمینه)، توضیح کامل و دکمه‌های شروع/پیش‌نمایش */
    renderDetail: function (el, p) {
        el.innerHTML = detailPageHTML(p, {
            level: this.level, duration: this.duration,
            background: this.background, backgroundOverridden: this.backgroundOverridden,
        });
        this.bindEvents(el);
    },

    bindEvents: function (el) {
        var self = this;
        if (this._bound) return;
        this._bound = true;
        el.addEventListener('click', function (e) {
            var t = e.target;
            // 🎧 استودیو کلاسیک — همیشه منوی اصلی (لابی) کلاسیک را باز می‌کند؛
            // شروع تمرین فقط از دکمه‌های «شروع تمرین» انجام می‌شود
            var classicBtn = t.closest('[data-yp-classic]');
            if (classicBtn) {
                YogaClassicModal.open('');
                return;
            }
            // دکمه‌ی پیش‌نمایشِ داخل هر کارت — قبل از انتخاب کارت بررسی شود
            var prevBtn = t.closest('[data-yp-preview]');
            if (prevBtn) {
                var pn = prevBtn.getAttribute('data-yp-preview');
                var pp = (self.apiPractices || D.practices || []).filter(function (x) { return x.name === pn; })[0];
                if (pp) self.previewPractice(pp);
                return;
            }
            // دکمه‌ی شروعِ داخل هر کارت — قبل از انتخاب کارت بررسی شود (در غیر این‌صورت re-render آن را می‌بلعد)
            var startBtn = t.closest('[data-yp-start]');
            if (startBtn) {
                var sn = startBtn.getAttribute('data-yp-start');
                var sp = (self.apiPractices || D.practices || []).filter(function (x) { return x.name === sn; })[0];
                if (!sp) return;
                if (sp.locked) { self._promptUpgrade(sp); return; }
                self.selected = sp;
                self._detail = false;
                self.launch(el);
                return;
            }
            var card = t.closest('[data-yp-practice]');
            if (card) {
                var name = card.getAttribute('data-yp-practice');
                var p = (self.apiPractices || D.practices || []).filter(function (x) { return x.name === name; })[0];
                if (!p) return;
                if (p.locked) { self._promptUpgrade(p); return; }
                self.selected = p;
                self._detail = true;
                if (p.durations && p.durations.indexOf(self.duration) < 0) self.duration = p.durations[0] || 30;
                self.renderSelector(el);
                return;
            }
            var dBack = t.closest('[data-yp-detail-back]');
            if (dBack) { self._detail = false; self.renderSelector(el); return; }
            var dPrev = t.closest('[data-yp-detail-preview]');
            if (dPrev) { self.previewPractice(self.selected); return; }
            var lvl = t.closest('[data-yp-level]');
            if (lvl) { self.level = lvl.getAttribute('data-yp-level'); self.renderSelector(el); return; }
            var dur = t.closest('[data-yp-duration]');
            if (dur) { self.duration = +dur.getAttribute('data-yp-duration'); self.renderSelector(el); return; }
            var go = t.closest('[data-yp-go]');
            if (go) {
                if (self.selected && self.selected.locked) { self._promptUpgrade(self.selected); return; }
                self.launch(el);
                return;
            }
            var back2 = t.closest('[data-yp-back-list]');
            if (back2) { self.active = null; self._detail = false; self.renderSelector(el); return; }
        });
        el.addEventListener('change', function (e) {
            var bg = e.target.closest('[data-yp-background]');
            if (bg) { self.background = bg.value; self.backgroundOverridden = true; }
        });
    },

    _promptUpgrade: function (p) {
        var tier = p.tier || 'gold';
        var msg = 'این تمرین برای پلن «' + (TIER_FA[tier] || tier) + '» است. برای شروع، اشتراک خود را ارتقا دهید.';
        if (window.openPricingModal) { try { window.openPricingModal(); } catch (e) {} }
        try { if (window.showToast) window.showToast('🔒 ' + msg, 'error'); else alert(msg); } catch (e) { alert(msg); }
    },

    /** کپی فشرده‌ی گام‌ها برای پیش‌نمایش: هر حلقه یک دور، نفس‌ها کوتاه‌تر، تندتر */
    previewSteps: function (steps) {
        var self = this;
        return (steps || []).map(function (s) {
            var o = {};
            for (var k in s) { if (Object.prototype.hasOwnProperty.call(s, k)) o[k] = s[k]; }
            if (o.type === 'tempo') o.duration = Math.max(1, Math.round((+o.duration || 4) / 4));
            if (o.type === 'hold') o.count = Math.min(+o.count || 1, 2);
            if (o.type === 'loop') {
                if (Array.isArray(o.count)) o.count = [1]; else o.count = 1;
                if (o.steps) o.steps = self.previewSteps(o.steps);
            }
            if (o.type === 'difficulty' && o.levels) {
                var lv = {};
                Object.keys(o.levels).forEach(function (kk) { lv[kk] = self.previewSteps(o.levels[kk]); });
                o.levels = lv;
            }
            return o;
        });
    },

    /** نوار تایم‌لاین پیش‌نمایش — الگوی .yh-strip استودیو کلاسیک:
        کارت آدمک هر حرکت + حباب مدت؛ کلیک = پرش؛ کارت جاری با فلش زیرش دنبال می‌شود. */
    buildPreviewStrip: function (overlay, player) {
        var strip = overlay.querySelector('[data-yp-preview-strip]');
        if (!strip) return;
        var inner = strip.querySelector('.yh-strip-inner');
        var cards = [];
        player.steps.forEach(function (s, i) {
            if (s.type !== 'move' && s.type !== 'pose' && s.type !== 'hold') return;
            var png = '';
            try {
                if (window.YogaCore && window.YogaCore.getImage) {
                    var poseName = s.toPose || s.name || s.pose || '';
                    png = window.YogaCore.getImage(poseName, { size: 'thumb', side: s.side === 'R' ? 'R' : s.side === 'L' ? 'L' : 'N' });
                }
            } catch (e) { png = ''; }
            if (!png && s.type === 'hold' && !s.pose && s.type !== 'move') return;
            var bubble = s.type === 'hold' ? faNum(s.count) : Math.ceil(s.duration || 0) + 's';
            var card = document.createElement('div');
            card.className = 'tl-card';
            card.dataset.i = i;
            card.innerHTML =
                (png ? '<img alt="" src="' + esc(png) + '">' : '<span class="tl-dot">•</span>') +
                '<span class="tl-bubble">' + esc(bubble) + '</span>';
            card.onclick = function () {
                if (!player._running) return;
                player._idx = Math.min(i, player.steps.length - 1);
                player._advance();
            };
            cards.push({ i: i, el: card });
        });
        /* reverse-insert: گام اول در لبه راست (حس RTL) */
        for (var j = cards.length - 1; j >= 0; j--) inner.appendChild(cards[j].el);
        function sync() {
            var cur = Math.max(0, player._idx - 1);
            var curCard = null;
            cards.forEach(function (c) {
                var isPast = c.i < cur, isCur = c.i === cur;
                c.el.classList.toggle('past', isPast);
                c.el.classList.toggle('cur', isCur);
                if (isCur) curCard = c.el;
            });
            /* کارت جاری وسط نوار */
            if (curCard) {
                var wrapW = strip.clientWidth || 600;
                var r = curCard.offsetLeft + curCard.offsetWidth / 2 - wrapW / 2;
                r = Math.max(0, r);
                inner.style.transform = 'translateX(' + (-r) + 'px)';
            }
        }
        sync();
        strip._syncTimer = setInterval(function () {
            if (!player || !player._running || !document.body.contains(strip)) { clearInterval(strip._syncTimer); return; }
            sync();
        }, 400);
    },

    /** پیش‌نمایش سریع تمرین — همان پلیر واقعی با گام‌های فشرده، بدون ذخیره در سوابق.
        اگر p خودش body.steps داشت (جریان دست‌ساز playFlow) بدون fetch استفاده می‌شود. */
    previewPractice: function (p) {
        var self = this;
        if (!p) return;
        var bg = self.backgroundOverridden ? self.background : bgForPractice(p);
        var ready = (p.body && p.body.steps && p.body.steps.length)
            ? Promise.resolve(p)
            : D.getPractice(p.name);
        ready.then(function (data) {
            var steps = self.previewSteps((data.body && data.body.steps) || []);
            if (!steps.length) { try { window.showToast && showToast('⚠ گام‌های تمرین خالی است', 'error'); } catch (e) {} return; }
            var practice = {
                name: p.name,
                file: p.name + '.preview',
                head: data.head || { name: p.name, style: p.style, durations: p.durations || [30], difficulties: p.difficulties || [0], pose: { name: 'Child Traditional', side: 'left' } },
                body: { preferredBackgroundName: bg, steps: steps },
            };
            var overlay = document.createElement('div');
            overlay.className = 'yp-preview-overlay';
            overlay.innerHTML =
                '<div class="yp-preview-shell">' +
                    '<div class="yp-preview-head">' +
                        '<h3>🧘 پیش‌نمایش: ' + esc(practiceTitle(p)) + '</h3>' +
                        '<span class="yp-preview-note">فشرده‌شده — با ✖ پایان یا ⏭ بگذرید</span>' +
                        '<button class="yp-preview-x" data-yp-preview-x>✕</button>' +
                    '</div>' +
                    /* نوار تایم‌لاین حرکات — همان الگوی استودیو کلاسیک */
                    '<div class="yh-strip yq-strip" data-yp-preview-strip><div class="yh-strip-inner"></div></div>' +
                    '<div class="yp-player yp-preview-host" data-yp-preview-host></div>' +
                '</div>';
            document.body.appendChild(overlay);
            document.body.style.overflow = 'hidden';   /* پس‌زمینه پشت مودال اسکرول نشود */
            var host = overlay.querySelector('[data-yp-preview-host]');
            var player = null;
            host.innerHTML = '<p class="yp-note">در حال بارگذاری پیش‌نمایش…</p>';

            function onKey(e) {
                if (e.key === 'Escape') { e.stopPropagation(); closePreview(); }
            }
            function closePreview() {
                if (player) { try { player.stop(false); } catch (e) {} player = null; }
                document.removeEventListener('keydown', onKey, true);
                overlay.remove();
                document.body.style.overflow = '';
            }
            document.addEventListener('keydown', onKey, true);
            function showDone(completed, elapsed, done, total) {
                host.innerHTML = '<div class="yp-done-modal"><div class="yp-done-card">' +
                    '<div class="yp-done-icon">' + (completed ? '🎉' : '⏹') + '</div>' +
                    '<h3>' + (completed ? 'پایان پیش‌نمایش' : 'پیش‌نمایش متوقف شد') + '</h3>' +
                    '<div class="yp-done-stats">' +
                        '<div class="yp-stat"><b>' + faNum(Math.floor(elapsed / 60)) + '</b><span>دقیقه</span></div>' +
                        '<div class="yp-stat"><b>' + faNum(done) + ' از ' + faNum(total) + '</b><span>حرکت</span></div>' +
                    '</div>' +
                    '<div class="yp-done-actions"><button class="yp-btn primary" data-yp-preview-x>بستن پیش‌نمایش</button></div>' +
                '</div></div>';
                player = null;
            }

            overlay.addEventListener('click', function (e) {
                if (e.target === overlay) { closePreview(); return; }
                if (e.target.closest('[data-yp-preview-x]')) { closePreview(); return; }
                var ctrl = e.target.closest('[data-yp]');
                if (ctrl && player) {
                    var cmd = ctrl.getAttribute('data-yp');
                    if (cmd === 'pause') player.pause();
                    else if (cmd === 'resume') player.resume();
                    else if (cmd === 'skip') player.next();
                    else if (cmd === 'prev') player.prev();
                    else if (cmd === 'end') { player.stop(false); }
                    return;
                }
            });

            player = new YogaSessionPlayer(practice, {
                level: 'beginner',
                duration: 1,
                background: bg,
                instructorName: p.instructor_name || '',
                title: practiceTitle(p) + ' (پیش‌نمایش)',
                container: host,
                onComplete: showDone,
            });
            player._record = function () { return; };  // پیش‌نمایش در سوابق ثبت نمی‌شود
            player.start();
            buildPreviewStrip(overlay, player);
        }).catch(function (err) {
            try { window.showToast && showToast('⚠ بارگذاری پیش‌نمایش ناموفق بود: ' + (err.message || err), 'error'); } catch (e) {}
        });
    },

    /** شروع تمرین — از طریق استودیو کلاسیک (Pocket Yoga) در مودال تمام‌صفحه.
        پلیر داخلی فقط برای پیش‌نمایش استفاده می‌شود. */
    launch: function (el, forcePractice) {
        var self = this;
        var practice = forcePractice || this.selected;
        if (!practice) return;
        var q = ['practice=' + encodeURIComponent(practice.name),
                 'dur=' + (this.duration || 30),
                 'lvl=' + encodeURIComponent(this.level || 'beginner')];
        if (this.backgroundOverridden && this.background) {
            q.push('bg=' + encodeURIComponent(this.background));
        }
        this.active = null;
        YogaClassicModal.open('?' + q.join('&'));
    },

    /** پیش‌نمایش تمرین پیشنهادی روزانه — از نام تمرین، از داخل تب روزانه */
    previewByName: function (name) {
        var self = this;
        var p = (self.apiPractices || D.practices || []).filter(function (x) { return x.name === name; })[0];
        if (!p) p = { name: name, displayName: name, durations: [30], difficulties: [0], locked: false, tier: 'free', instructor_name: '' };
        self.previewPractice(p);
    },

    /** شروع تمرین پیشنهادی روزانه — از نام تمرین، از داخل تب روزانه (استودیو کلاسیک) */
    playByName: function (name) {
        var self = this;
        var p = (self.apiPractices || D.practices || []).filter(function (x) { return x.name === name; })[0];
        if (!p) return;
        self.selected = p;
        self._detail = false;
        if (p.durations && p.durations.indexOf(self.duration) < 0) self.duration = p.durations[0] || 30;
        if (window.YogaLibrary && typeof window.YogaLibrary.switchTab === 'function') {
            window.YogaLibrary.switchTab('practice');
        }
        self.launch(document.getElementById(self.panelId), p);
    },

    /** اجرای جریان حرکات (فلو روزانه/کتابخانه) — جریان دلخواهِ از حرکات ساخته‌شده
        است نه تمرین آماده، پس در پنجره پیش‌نمایش پلیر سبک اجرا می‌شود (بدون ثبت سابقه). */
    playFlow: function (names, rootName) {
        var self = this;
        if (!names || !names.length) return;
        var steps = [];
        names.forEach(function (n) {
            steps.push({ type: 'move', name: n, duration: 4 });
            steps.push({ type: 'hold', count: 4, phrase: 'breathe', audibleCount: false });
        });
        steps.push({ type: 'pose', name: 'Corpse', side: 'left', duration: 4 });
        steps.push({ type: 'hold', count: 8, phrase: 'relax', audibleCount: false });
        var practice = {
            name: rootName || 'جریان تمرین',
            file: 'flow_' + (rootName || 'custom'),
            preferred_background: this.background || 'Home',
            head: {
                name: rootName ? (poseNameFa(rootName) || rootName) : 'جریان تمرین',
                description: 'جریانی از حرکات پیشنهادی',
                style: 'flow',
                durations: [this.duration || 30],
                difficulties: [0, 1, 2],
                pose: { name: names[0], side: 'left' },
            },
            body: { preferredBackgroundName: this.background || 'Home', steps: steps, generated: true },
        };
        self.previewPractice(practice);
    }
};

// ════════════════════════════════════════════════════════════════
//  تب «👨‍🏫 مربی یوگا» — مربی‌ها + نمای فنی تمرین‌ها
// ════════════════════════════════════════════════════════════════
var DEFAULT_INSTRUCTORS = [
    { name: 'لیسا لیبک', specialty: 'وینیاسا، یین', level: 'expert', bio: 'مربی بین‌المللی وینیاسا با بیش از ۱۵ سال تجربه' },
    { name: 'سارا احمدی', specialty: 'هاتا، مدیتیشن', level: 'intermediate', bio: 'تمرکز بر تنفس و آرامش — مناسب شروع‌کننده‌ها' },
    { name: 'علی رضایی', specialty: 'آشتانگا، پاور', level: 'advanced', bio: 'تمرین‌های قدرتی و منظم برای بدن و ذهن' },
    { name: 'مریم کریمی', specialty: 'یوگای ترمیمی، تنفس', level: 'beginner', bio: 'بازگرداندن تعادل بدن با حرکات ملایم و تنفس عمیق' }
];

var CoachUI = {
    panelId: 'yogaCoachPanel',
    _bound: false,
    _opened: {},
    _instructors: null,
    apiPractices: null,
    _detail: false,
    _selected: null,
    _level: 'beginner',
    _duration: 30,
    _bg: 'Home',
    _bgOverridden: false,

    init: function () {
        var el = document.getElementById(this.panelId);
        if (!el) return;
        var self = this;
        this._detail = false;
        D.whenReady(function () {
            var practicesPromise = (window.YogaPracticeUI && YogaPracticeUI._loadApi)
                ? YogaPracticeUI._loadApi().catch(function () { return []; })
                : Promise.resolve([]);
            Promise.all([self._loadInstructors(), practicesPromise]).then(function (res) {
                self._instructors = res[0];
                self.apiPractices = YogaPracticeUI ? YogaPracticeUI.apiPractices : null;
                self.render(el);
            }).catch(function () { self.render(el); });
        });
        this._loadStats(el);
    },

    _loadInstructors: function () {
        return fetch('/api/v5/yoga/instructors').then(function (r) { return r.ok ? r.json() : null; })
            .then(function (data) {
                if (data && data.items && data.items.length) {
                    return data.items.map(function (i) {
                        return { name: i.name, specialty: i.specialty || '', level: i.level || 'intermediate', bio: i.bio || '' };
                    });
                }
                return DEFAULT_INSTRUCTORS;
            })
            .catch(function () { return DEFAULT_INSTRUCTORS; });
    },

    refreshStats: function () {
        // پس از لاگین — فقط بخش آمار را تازه می‌کند بدون رندر کامل پنل
        var box = document.getElementById('yogaCoachStats');
        if (!box) return;
        box.innerHTML = '<span class="yp-note">در حال بارگذاری آمار…</span>';
        this._loadStats();
    },


    _loadStats: function (el) {
        var token = authToken();
        if (!token) return;
        fetch('/api/v5/yoga/stats', { headers: { 'Authorization': 'Bearer ' + token } })
            .then(function (r) { return r.ok ? r.json() : null; })
            .then(function (stats) {
                if (!stats) return;
                var box = document.getElementById('yogaCoachStats');
                if (!box) return;
                box.innerHTML =
                    '<div class="yp-stat"><b>' + faNum(stats.total_sessions || 0) + '</b><span>جلسه</span></div>' +
                    '<div class="yp-stat"><b>' + faNum(stats.total_minutes || 0) + '</b><span>دقیقه تمرین</span></div>' +
                    '<div class="yp-stat"><b>' + faNum(stats.streak || 0) + '</b><span>روز استریک</span></div>';
            })
            .catch(function () {});
        // نشان «داده‌های شما ذخیره شده» — تولد/شهر کاربر از پروفایل ذخیره‌شده
        fetch('/api/v5/user/profile', { headers: { 'Authorization': 'Bearer ' + token } })
            .then(function (r) { return r.ok ? r.json() : null; })
            .then(function (p) {
                if (!p || !p.birth_year) return;
                var box = document.getElementById('yogaCoachStats');
                if (!box) return;
                var dt = faNum(p.birth_year) + '/' + faNum(String(p.birth_month || 1).padStart(2, '0')) + '/' + faNum(String(p.birth_day || 1).padStart(2, '0'));
                var line = '👤 ' + esc(p.name || 'کاربر') + ' · 📅 ' + dt + (p.city ? ' · 📍 ' + esc(p.city) : '') + ' — ✅ در حساب شما ذخیره شده';
                var note = document.createElement('div');
                note.className = 'yp-note yp-profile-note';
                note.style.cssText = 'width:100%;font-size:11.5px;margin-top:2px;';
                note.textContent = line;
                box.appendChild(note);
            })
            .catch(function () {});
    },

    render: function (el) {
        var self = this;
        if (this._detail && this._selected) { this.renderDetail(el, this._selected); return; }
        var practices = this.apiPractices || D.practices || [];
        var cards = practices.map(function (p) {
            var lvls = (p.difficulties || []).filter(function (d) { return LEVEL_FA[LEVEL_KEYS[d]]; }).map(function (d) {
                return '<span class="yp-chip">' + esc(LEVEL_FA[LEVEL_KEYS[d]]) + '</span>';
            }).join('');
            var instr = p.instructor_name ? '<span class="yp-instructor">👤 ' + esc(p.instructor_name) + '</span>' : '';
            var thumb = practiceImage(p, 'thumb');
            return '<div class="yp-coach-card" data-yp-coach-card="' + esc(p.name) + '">' +
                (thumb ? '<div class="yp-card-thumb" style="background-image:url(\'' + esc(thumb) + '\')"></div>' : '') +
                '<div class="yp-card-name">🧘 ' + esc(practiceTitle(p)) + '</div>' +
                '<div class="yp-card-desc">' + esc(practiceDesc(p).slice(0, 110)) + (practiceDesc(p).length > 110 ? '…' : '') + '</div>' +
                '<div class="yp-card-meta">' +
                    (STYLE_FA[p.style] ? '<span class="yp-chip">' + esc(STYLE_FA[p.style]) + '</span>' : '') +
                    '<span class="yp-chip">' + esc((p.durations || []).map(faNum).join('/')) + ' دقیقه</span>' +
                    lvls + instr +
                '</div>' +
                '<div class="yp-card-actions">' +
                    '<button class="yp-btn" data-yp-coach-detail="' + esc(p.name) + '">📋 جزئیات فنی</button>' +
                    '<button class="yp-btn primary" data-yp-coach-run="' + esc(p.name) + '">▶ اجرا</button>' +
                    '<button class="yp-btn" data-yp-coach-card="' + esc(p.name) + '" style="flex:1">🏞 صفحه تمرین</button>' +
                '</div>' +
                '<div class="yp-coach-detail" data-yp-coach-body="' + esc(p.name) + '" style="display:none;"></div>' +
            '</div>';
        }).join('');

        var instrCards = (this._instructors || DEFAULT_INSTRUCTORS).map(function (i) {
            return '<div class="yp-instructor-card">' +
                '<div class="yp-instructor-avatar">' + esc((i.name || '؟').trim().charAt(0)) + '</div>' +
                '<div class="yp-instructor-name">' + esc(i.name) + '</div>' +
                (i.specialty ? '<div class="yp-instructor-spec">' + esc(i.specialty) + '</div>' : '') +
                '<span class="yp-chip dim">' + esc(LEVEL_FA[i.level] || i.level) + '</span>' +
                (i.bio ? '<div class="yp-instructor-bio">' + esc(i.bio) + '</div>' : '') +
            '</div>';
        }).join('');

        el.innerHTML =
            '<div class="yp-coach">' +
                '<div class="yp-coach-head"><h3>👨‍🏫 مربی‌های یوگا</h3>' +
                    '<span class="yp-note">مربیان رصدخانه و تمرین‌های هر یک — نمای فنی برای مربی‌ها</span></div>' +
                '<div class="yp-coach-stats" id="yogaCoachStats">' +
                    (authToken() ? '<span class="yp-note">در حال بارگذاری آمار…</span>' : '<span class="yp-note">برای مشاهده آمار وارد شوید</span>') +
                '</div>' +
                '<div class="yp-instructors-grid">' + instrCards + '</div>' +
                '<h4 class="yp-coach-sub">📋 تمرین‌ها</h4>' +
                '<div class="yp-coach-grid">' + cards + '</div>' +
            '</div>';
        this.bindEvents(el);
    },

    bindEvents: function (el) {
        var self = this;
        if (this._bound) return;
        this._bound = true;
        el.addEventListener('click', function (e) {
            var t = e.target;
            var run = t.closest('[data-yp-coach-run]');
            if (run) {
                var name = run.getAttribute('data-yp-coach-run');
                self.runPractice(name);
                return;
            }
            var detail = t.closest('[data-yp-coach-detail]');
            if (detail) {
                var n = detail.getAttribute('data-yp-coach-detail');
                var body = el.querySelector('[data-yp-coach-body="' + (CSS.escape ? CSS.escape(n) : n) + '"]');
                if (!body) return;
                if (body.style.display === 'none') {
                    body.style.display = 'block';
                    detail.textContent = '📋 بستن جزئیات';
                    self.loadDetail(body, n);
                } else {
                    body.style.display = 'none';
                    detail.textContent = '📋 جزئیات فنی';
                }
                return;
            }
            // باز کردن صفحه‌ی اختصاصی تمرین (محیط + جزئیات)
            var card = t.closest('[data-yp-coach-card]');
            if (card) {
                self.openDetail(card.getAttribute('data-yp-coach-card'));
                return;
            }
            var dBack = t.closest('[data-yp-detail-back]');
            if (dBack) { self._detail = false; self.render(el); return; }
            var dPrev = t.closest('[data-yp-detail-preview]');
            if (dPrev) { if (window.YogaPracticeUI) YogaPracticeUI.previewPractice(self._selected); return; }
            var go = t.closest('[data-yp-go]');
            if (go) {
                if (self._selected && self._selected.locked) {
                    if (window.YogaPracticeUI) YogaPracticeUI._promptUpgrade(self._selected);
                    return;
                }
                self.runPractice(self._selected ? self._selected.name : '');
                return;
            }
            var lvl = t.closest('[data-yp-level]');
            if (lvl) { self._level = lvl.getAttribute('data-yp-level'); self.renderDetail(el, self._selected); return; }
            var dur = t.closest('[data-yp-duration]');
            if (dur) { self._duration = +dur.getAttribute('data-yp-duration'); self.renderDetail(el, self._selected); return; }
        });
        el.addEventListener('change', function (e) {
            var bg = e.target.closest('[data-yp-background]');
            if (bg) { self._bg = bg.value; self._bgOverridden = true; self.renderDetail(el, self._selected); }
        });
    },

    openDetail: function (name) {
        var p = (this.apiPractices || D.practices || []).filter(function (x) { return x.name === name; })[0];
        if (!p) return;
        this._selected = p;
        this._detail = true;
        if (p.durations && p.durations.indexOf(this._duration) < 0) this._duration = p.durations[0] || 30;
        var el = document.getElementById(this.panelId);
        if (el) this.render(el);
    },

    renderDetail: function (el, p) {
        el.innerHTML = detailPageHTML(p, {
            level: this._level, duration: this._duration,
            background: this._bg, backgroundOverridden: this._bgOverridden,
        });
    },

    loadDetail: function (body, name) {
        if (this._opened[name]) { body.innerHTML = this._opened[name]; return; }
        body.innerHTML = '<span class="yp-note">در حال تحلیل…</span>';
        var self = this;
        D.getPractice(name).then(function (practice) {
            var html = self.analyze(practice);
            self._opened[name] = html;
            body.innerHTML = html;
        }).catch(function (err) {
            body.innerHTML = '<span class="yp-note">⚠ ' + esc(err.message || err) + '</span>';
        });
    },

    analyze: function (practice) {
        var counts = { beginner: {}, intermediate: {}, expert: {} };
        var ctx = { tempo: 4, side: 'L', lastPose: null };
        var out = [];
        this._flattenAnalyze(practice.body.steps, LEVEL_KEYS.map(function () { return 0; }), ctx, out, counts);
        var rows = LEVEL_KEYS.map(function (key, li) {
            var c = counts[key];
            var est = (c.holdSec || 0) + (c.moveSec || 0);
            return '<div class="yp-analyze-row"><span class="yp-chip">' + esc(LEVEL_FA[key]) + '</span>' +
                '<span>' + faNum(c.move || 0) + ' انتقال</span>' +
                '<span>' + faNum(c.hold || 0) + ' نگه‌داشت</span>' +
                '<span>' + faNum(c.pose || 0) + ' حالت</span>' +
                '<span>' + faNum(Math.round(est / 60)) + ' دقیقه تخمینی</span></div>';
        }).join('');
        /* توضیح فارسی معتبر — از کارت catalog اگر پیدا شد، وگرنه head.description */
        var card = (this.apiPractices || D.practices || []).filter(function (x) { return x.name === practice.name; })[0];
        var desc = card ? practiceDesc(card) : (practice.head && practice.head.description) || '';
        return '<div class="yp-analyze"><div class="yp-analyze-desc">' + esc(desc) + '</div>' + rows + '</div>';
    },

    _flattenAnalyze: function (steps, levels, ctx, out, counts) {
        var self = this;
        (steps || []).forEach(function (s) {
            if (s.type === 'difficulty') {
                LEVEL_KEYS.forEach(function (key) {
                    var lvls = s.levels || {};
                    self._flattenAnalyze(lvls[key] || [], levels, ctx, out, counts);
                });
                return;
            }
            LEVEL_KEYS.forEach(function (key, li) {
                var c = counts[key];
                if (s.type === 'loop') {
                    var arr = (s.count && s.count.length) ? s.count : [1];
                    var times = arr[Math.min(li, arr.length - 1)] || 1;
                    for (var i = 0; i < times; i++) self._flattenAnalyze(s.steps, levels, ctx, out, counts);
                    return;
                }
                if (s.type === 'move') { c.move = (c.move || 0) + 1; c.moveSec = (c.moveSec || 0) + (s.duration || 4); }
                else if (s.type === 'hold') { c.hold = (c.hold || 0) + 1; c.holdSec = (c.holdSec || 0) + (+s.count || 5) * (s.duration || 4); }
                else if (s.type === 'pose') { c.pose = (c.pose || 0) + 1; }
            });
        });
    },

    runPractice: function (name) {
        var item = (this.apiPractices || D.practices || []).filter(function (x) { return x.name === name; })[0] || {};
        if (item.locked) {
            if (window.YogaPracticeUI) YogaPracticeUI._promptUpgrade(item);
            return;
        }
        /* شروع از استودیو کلاسیک — پلیر داخلی فقط برای پیش‌نمایش */
        var q = ['practice=' + encodeURIComponent(name),
                 'dur=' + (this._duration || 30),
                 'lvl=' + encodeURIComponent(this._level || 'beginner')];
        if (this._bgOverridden && this._bg) {
            q.push('bg=' + encodeURIComponent(this._bg));
        }
        YogaClassicModal.open('?' + q.join('&'));
    }
};

window.YogaSessionPlayer = YogaSessionPlayer;
window.YogaPracticeUI = PracticeUI;
window.YogaCoachUI = CoachUI;

/* «وارد شوید» در کارت پایان تمرین — مودال لاگین را همان‌جا باز می‌کند
   و پس از لاگین، پنل مربی/تمرین را دوباره رندر می‌کند تا آمار و استریک ظاهر شود */
window.__ypAuthReturn = function () {
    if (window.onAfterLogin) {
        window.onAfterLogin(function () {
            try { if (window.YogaCoachUI) YogaCoachUI.init(); } catch (e) {}
            try { if (window.YogaCoachUI && YogaCoachUI.refreshStats) YogaCoachUI.refreshStats(); } catch (e) {}
        });
    }
    if (window.openLoginModal) window.openLoginModal();
    else if (window.showToast) window.showToast('برای ذخیره جلسات، ابتدا وارد شوید', 'info');
};

})();

/* ════════════════════════════════════════════════════════════════
   YogaClassicModal — fullscreen iframe modal for yoga-classic.html
   (faithful Pocket Yoga rebuild). Listens for session-end messages
   from the iframe and records them via the existing session API.
   ════════════════════════════════════════════════════════════════ */
var YogaClassicModal = {
    _el: null,
    open: function (query) {
        if (this._el) { this.close(); }
        var wrap = document.createElement('div');
        wrap.id = 'yogaClassicModal';
        wrap.innerHTML =
            '<div class="ycm-backdrop"></div>' +
            '<div class="ycm-frame">' +
                '<iframe src="yoga-classic.html' + (query || '') + '" allow="autoplay" allowfullscreen></iframe>' +
            '</div>';
        document.body.appendChild(wrap);
        document.body.style.overflow = 'hidden';
        this._el = wrap;
        var self = this;
        /* ✕ حذف شد — «بستن استودیو» داخل خود کلاسیک (action-rail) است؛
           کلیک روی بک‌دراپ هم همچنان می‌بندد */
        wrap.querySelector('.ycm-backdrop').onclick = function () { self.close(); };
        this._msgHandler = function (ev) {
            var d = ev.data || {};
            if (d.source !== 'yoga-classic') return;
            if (d.type === 'close') { self.close(); return; }
            if (d.type === 'session-end' && d.seconds >= 10) {
                /* ثبت از همان API جلسات؛ completed فقط برای تمرین کامل —
                   دقیقه سپری‌شده همیشه ثبت می‌شود، شمارش جلسه/استریک سمت سرور با completed کنترل می‌شود */
                try {
                    var token = localStorage.getItem('cosmic_token') || '';
                    fetch('/api/v5/yoga/session', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                        body: JSON.stringify({
                            pose_id: null,
                            pose_name: d.practice || 'Pocket Yoga Classic',
                            category: 'asanas',
                            duration_seconds: Math.round(d.seconds),
                            completed: !!d.completed,
                            notes: 'استودیو کلاسیک (' + (d.practice || '') + ')'
                        })
                    }).catch(function () {});
                } catch (e) {}
            }
        };
        window.addEventListener('message', this._msgHandler);
    },
    close: function () {
        if (!this._el) return;
        if (this._msgHandler) window.removeEventListener('message', this._msgHandler);
        this._msgHandler = null;
        this._el.remove();
        this._el = null;
        document.body.style.overflow = '';
        /* آمار (کارما/جلسات/دقیقه) بلافاصله بعد از پایان جلسه کلاسیک تازه شود */
        try { if (window.YogaPracticeUI && YogaPracticeUI.refreshClassicStats) YogaPracticeUI.refreshClassicStats(); } catch (e) {}
        try { if (window.YogaCoachUI && YogaCoachUI.refreshStats) YogaCoachUI.refreshStats(); } catch (e) {}
    }
};