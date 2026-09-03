// ================================================================
//   YOGA TEST — تست تشخیص تمرین یوگا (۱۰ سوال وزندار)
//   پرسشهای غیرفنی → استنتاج سطح · نوع حرکت · دسته · علایق ثانویه
//   منبع داده: YogaCore (yoga.txt — منبع واحد حقیقت)
//   ذخیره: localStorage (yoga_test_done / yoga_test_results)
// ================================================================
var YogaTest = (function () {
'use strict';

var C = window.YogaCore;

var LS_DONE = 'yoga_test_done';
var LS_RESULTS = 'yoga_test_results';
var LS_DISMISSED = 'yoga_test_dismissed';

// ─── سوالات (۱۰ مورد، کاربرپسند و بدون اصطلاح فنی) ───
// گروهها: difficulty | movement | category | secondary | personal
// پاسخها بهصورت حرف A..E ثبت میشوند و نگاشت در جداول SCORE/MOVE/CAT انجام میشود.
var QUESTIONS = [
    // Q1 — difficulty
    { id: 1, group: 'difficulty', text: 'وقتی می‌خواهی یوگا را شروع کنی، ترجیح می‌دهی تمرینت چطور باشد؟', options: [
        { v: 'A', label: 'آرام و ساده، کاملاً در حد توانم و بدون فشار' },
        { v: 'B', label: 'کمی چالش‌برانگیز باشد ولی بتوانم با تمرکز انجامش بدهم' },
        { v: 'C', label: 'سخت باشد و واقعاً احساس کنم بدنم را به چالش کشیده‌ام' }
    ] },
    // Q2 — category
    { id: 2, group: 'category', text: 'در یک تمرین طولانی، کدام حالت بدن برایت راحت‌تر است؟', options: [
        { v: 'A', label: 'روی پاها و در حالت ایستاده و فعال' },
        { v: 'B', label: 'روی زمین و در حالت نشسته' },
        { v: 'C', label: 'درازکشیده روی زمین و رها' }
    ] },
    // Q3 — movement
    { id: 3, group: 'movement', text: 'کدام کشش برایت لذت‌بخش‌تر است؟', options: [
        { v: 'A', label: 'باز شدن جلوی بدن؛ قفسه سینه و شانه‌ها' },
        { v: 'B', label: 'کشیده شدن پشت پاها و پشت بدن' },
        { v: 'C', label: 'کشش عمیق یک طرف بدن به پهلو' },
        { v: 'D', label: 'چرخاندن بالاتنه و ستون فقرات' }
    ] },
    // Q5 — secondary
    { id: 5, group: 'secondary', text: 'وقتی روی یک پا می‌ایستی، چه حسی داری؟', options: [
        { v: 'A', label: 'تعادل روی پاها را دوست دارم و برایم لذت‌بخش است' },
        { v: 'B', label: 'ترجیح می‌دهم هر دو پا محکم روی زمین باشد' },
        { v: 'C', label: 'دوست دارم روزی تعادل روی دست را هم تجربه کنم' }
    ] },
    // Q6 — category
    { id: 6, group: 'category', text: 'در یک کلاس یوگا، دوست داری بیشتر کجا باشی؟', options: [
        { v: 'A', label: 'ایستاده و در جریان حرکت' },
        { v: 'B', label: 'روی زمین، آزاد و ریلکس' },
        { v: 'C', label: 'وزنم بین دست‌ها و پاها تقسیم شود (چهار دست و پا)' },
        { v: 'D', label: 'وارونه و پرانرژی؛ سر پایین‌تر از قلب' }
    ] },
    // Q8 — difficulty
    { id: 8, group: 'difficulty', text: 'بزرگ‌ترین چالش فعلی تو در تمرینات بدنی چیست؟', options: [
        { v: 'A', label: 'پیدا کردن فرم صحیح حرکت‌ها' },
        { v: 'B', label: 'نگه‌داشتن وضعیت برای مدت طولانی‌تر' },
        { v: 'C', label: 'کنترل دقیق و ظریف بدن' },
        { v: 'D', label: 'امتحان کردن حرکت‌های جدید و پیشرفته' }
    ] },
    // Q11 — secondary
    { id: 11, group: 'secondary', text: 'دست‌های تو در حرکت‌ها بیشتر چه نقشی دارند؟', options: [
        { v: 'A', label: 'وسیله کشش و آزادی بدن' },
        { v: 'B', label: 'تکیه‌گاه برای ثبات بیشتر' },
        { v: 'C', label: 'تحمل وزن بدن' }
    ] },
    // Q12 — difficulty
    { id: 12, group: 'difficulty', text: 'سابقه تو در یوگا یا ورزش‌های مشابه چقدر است؟', options: [
        { v: 'A', label: 'تازه می‌خواهم با اصول آشنا شوم' },
        { v: 'B', label: 'چند حرکت را می‌شناسم و انجام می‌دهم' },
        { v: 'C', label: 'به‌طور منظم تمرین دارم' }
    ] },
    // Q14 — movement
    { id: 14, group: 'movement', text: 'کدام حرکت برایت جذاب‌تر است؟', options: [
        { v: 'A', label: 'خم شدن به جلو و نزدیک شدن به پاها' },
        { v: 'B', label: 'باز کردن جلوی بدن به عقب' },
        { v: 'C', label: 'چرخاندن بدن در پیچش' },
        { v: 'D', label: 'کشیده شدن بدن به طرفین' },
        { v: 'E', label: 'ثابت ماندن در یک تعادل زیبا' }
    ] },
    // Q16 — category
    { id: 16, group: 'category', text: 'دوست داری تمرین‌ات بیشتر روی کدام حالت بدن بگذرد؟', options: [
        { v: 'A', label: 'روی پاها و ایستاده' },
        { v: 'B', label: 'نشسته روی زمین' },
        { v: 'C', label: 'به پشت درازکشیده' },
        { v: 'D', label: 'روی شکم' },
        { v: 'E', label: 'چهار دست و پا؛ دست‌ها و پاها روی زمین' }
    ] }
];

// ─── نگاشت وزنی ───
// سوالات سطح: حرف → نمره ۱ تا ۳
var DIFF_SCORES = {
    1: { A: 1, B: 2, C: 3 },
    8: { A: 1, B: 2, C: 3, D: 3 },
    12: { A: 1, B: 2, C: 3 }
};
// سوالات نوع حرکت: حرف → زیردسته
var MOVE_MAP = {
    3: { A: 'backbend', B: 'forward_bend', C: 'lateral_bend', D: 'twist' },
    14: { A: 'forward_bend', B: 'backbend', C: 'twist', D: 'lateral_bend', E: 'balancing' }
};
// سوالات دسته: حرف → دسته
var CAT_MAP = {
    2: { A: 'standing', B: 'seated', C: 'supine' },
    6: { A: 'standing', B: 'supine', C: 'arm_leg_support', D: 'arm_balance_and_inversion' },
    16: { A: 'standing', B: 'seated', C: 'supine', D: 'prone', E: 'arm_leg_support' }
};
// ترتیب برنده‌شدن در حالت تساوی
var MOVE_TIEBREAK = ['forward_bend', 'backbend', 'twist', 'lateral_bend', 'balancing', 'neutral'];
var CAT_TIEBREAK = ['standing', 'seated', 'supine', 'prone', 'arm_leg_support', 'arm_balance_and_inversion'];
var DIFF_THRESH = [
    { key: 'beginner', max: 1.6 },
    { key: 'intermediate', max: 2.3 },
    { key: 'expert', max: 3.0 }
];


// ─── وضعیت ───
var answers = {};      // qid → حرف
var currentIdx = 0;
var profile = null;    // نتیجه محاسبه‌شده
var shownOnce = false; // آیا امسال (این نشست) خودکار باز شد
var dom = {};

// ─── کمکی‌های localStorage ───
function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
function lsDel(k) { try { localStorage.removeItem(k); } catch (e) {} }

function isDone() { return lsGet(LS_DONE) === 'true'; }
function hasOldQuestionnaire() { return lsGet('yoga_questionnaire_done') === 'true'; }
function isDismissed() { return lsGet(LS_DISMISSED) === 'true'; }

function getResults() {
    try {
        var r = JSON.parse(lsGet(LS_RESULTS) || 'null');
        return r && r.difficulty ? r : null;
    } catch (e) { return null; }
}

// ─── امتیازدهی ───
function majorityCounts(mapFn) {
    var counts = {};
    QUESTIONS.forEach(function (q) {
        var a = answers[q.id];
        if (a === undefined || !mapFn[q.id]) return;
        var val = mapFn[q.id][a];
        if (val === undefined) return;
        counts[val] = (counts[val] || 0) + 1;
    });
    return counts;
}
function pickWinner(counts, tiebreak) {
    var best = null, bestCount = -1;
    tiebreak.forEach(function (k) {
        var c = counts[k] || 0;
        if (c > bestCount) { best = k; bestCount = c; }
    });
    return best;
}
function round1(x) { return Math.round(x * 10) / 10; }

function levelFromScore(avg) {
    var key = 'beginner';
    for (var i = 0; i < DIFF_THRESH.length; i++) {
        if (avg <= DIFF_THRESH[i].max + 0.0001) { key = DIFF_THRESH[i].key; break; }
        key = DIFF_THRESH[i].key;
    }
    return key;
}

function computeProfile() {
    // ۱) سطح
    var scores = [];
    Object.keys(DIFF_SCORES).forEach(function (qid) {
        var a = answers[qid];
        if (a === undefined) return;
        var s = DIFF_SCORES[qid][a];
        if (s !== undefined) scores.push(s);
    });
    var avg = scores.length ? scores.reduce(function (x, y) { return x + y; }, 0) / scores.length : 1;
    var diffKey = levelFromScore(avg);
    var diffScore = round1(avg);

    // ۲) نوع حرکت
    var mCounts = majorityCounts(MOVE_MAP);
    var moveKey = pickWinner(mCounts, MOVE_TIEBREAK) || 'neutral';

    // ۳) دسته
    var cCounts = majorityCounts(CAT_MAP);
    var catKey = pickWinner(cCounts, CAT_TIEBREAK) || 'standing';

    // ۴) علایق ثانویه (Q5 / Q11)
    var hints = { armBalance: false, twist: false, neutral: false, balancing: false, open: false };
    var a5 = answers[5], a11 = answers[11];
    if (a5 === 'C' || a11 === 'C') hints.armBalance = true;
    if (a5 === 'A') hints.balancing = true;
    if (a11 === 'A' || a5 === 'B') hints.neutral = true;

    // مدت پیشنهادی
    var minutes = diffKey === 'beginner' ? 12 : diffKey === 'intermediate' ? 18 : 25;

    return {
        difficulty: { key: diffKey, score: diffScore, fa: C.DIFFICULTY_FA[diffKey] || '', stars: C.DIFFICULTY_STARS[diffKey] || '' },
        movement: { key: moveKey, fa: (C.SUBCATEGORY_FA && C.SUBCATEGORY_FA[moveKey]) || moveKey },
        category: { key: catKey, fa: (C.CATEGORY_FA && C.CATEGORY_FA[catKey]) || catKey, icon: (C.catIcon && C.catIcon(catKey)) || '' },
        hints: hints,
        minutes: minutes,
        movementCounts: mCounts,
        categoryCounts: cCounts,
        recommended: [],
        ts: Date.now()
    };
}

// ─── پیشنهاد حرکات (روی منبع واحد حقیقت) ───
function recommend(prof, count) {
    count = count || 8;
    var poses = [];
    try { poses = C.getPoses() || []; } catch (e) { poses = []; }
    var recs = poses.filter(function (p) {
        if (!p || p.visibility === 'tertiary') return false;
        try { if (!C.canAccess(p.difficulty)) return false; } catch (e) {}
        // حرکات «خنثی» فقط وقتی خواسته شده یا در دسته ریلکسی (خوابیده/نشسته) باشند
        if (p.subcategory === 'neutral' && prof.movement.key !== 'neutral' && p.category !== 'supine' && p.category !== 'seated') return false;
        return true;
    }).map(function (p) {
        var s = 0;
        if (p.subcategory === prof.movement.key) s += 42;
        if (p.category === prof.category.key) s += 28;
        var dDist = Math.abs((C.diffOrder(p.difficulty) || 1) - (C.diffOrder(prof.difficulty.key) || 1));
        s += dDist === 0 ? 22 : dDist === 1 ? 8 : 0;
        if (prof.hints.twist && p.subcategory === 'twist') s += 12;
        if (prof.hints.balancing && (p.subcategory === 'balancing')) s += 8;
        if (prof.hints.armBalance && p.category === 'arm_balance_and_inversion') s += 10;
        if (prof.hints.neutral && (p.category === 'supine' || p.category === 'seated') && p.subcategory === 'neutral') s += 6;
        if (prof.movement.key === 'balancing' && p.category === 'standing' && p.subcategory === 'balancing') s += 8;
        if (prof.movement.key === 'backbend' && (p.category === 'prone' || p.category === 'seated')) s += 4;
        if (p.visibility === 'primary') s += 6;
        else if (p.visibility === 'secondary') s += 2;
        if (p.difficulty === 'beginner') s += 1;
        return { name: p.name, s: s };
    }).sort(function (a, b) {
        if (b.s !== a.s) return b.s - a.s;
        var pa = C.get(a.name), pb = C.get(b.name);
        return C.nameFa(pa).localeCompare(C.nameFa(pb), 'fa');
    }).slice(0, count).map(function (r) { return r.name; });
    return recs;
}

// ارتقا لازم است؟ (سطح استنتاجشده بالاتر از دسترسی اشتراک)
function needsUpgrade(prof) {
    if (!prof || !prof.difficulty) return false;
    var maxAvail = 'beginner';
    if (C.canAccess('intermediate')) maxAvail = 'intermediate';
    if (C.canAccess('expert')) maxAvail = 'expert';
    return C.diffOrder(prof.difficulty.key) > C.diffOrder(maxAvail);
}

// ─── ساخت زنجیره تمرین با روابط واقعی ───
function buildPracticeChain(recNames, maxN) {
    maxN = maxN || 8;
    var chain = [], used = {};
    var i, cur, found, k;
    function tryAdd(name) { if (name && C.get(name) && !used[name]) { used[name] = true; chain.push(name); return true; } return false; }
    // از بهترین پیشنهاد شروع کن
    var start = recNames[0] || null;
    if (start && !C.canAccess(C.get(start).difficulty)) {
        for (i = 0; i < recNames.length; i++) {
            if (C.canAccess(C.get(recNames[i]).difficulty)) { start = recNames[i]; break; }
        }
    }
    cur = start;
    while (cur && chain.length < maxN) {
        if (!tryAdd(cur)) break;
        var pose = C.get(cur);
        var nxt = null;
        function fromRefs(field) {
            if (nxt) return;
            var list = [];
            try { list = C.validRefs ? C.validRefs(pose, field) : ((pose[field] || []).filter(function (n) { return C.get(n); })); } catch (e) {}
            for (k = 0; k < list.length; k++) {
                var rn = list[k];
                if (!used[rn] && recNames.indexOf(rn) >= 0 && C.canAccess(C.get(rn).difficulty)) { nxt = rn; return; }
            }
        }
        // اول روابطی که هم در پیشنهادها هستند
        fromRefs('next_poses'); fromRefs('variations'); fromRefs('previous_poses');
        // بعد بقیه پیشنهادها (همنوع حرکت ترجیح دارد)
        if (!nxt) {
            var mvKey = (profile && profile.movement) ? profile.movement.key : null;
            for (k = 0; k < recNames.length; k++) {
                var c2 = recNames[k];
                if (used[c2] || !C.canAccess(C.get(c2).difficulty)) continue;
                if (!nxt) nxt = c2;
                else if (mvKey && C.get(c2).subcategory === mvKey) { nxt = c2; }
            }
        }
        cur = nxt;
    }
    // پایان ملایم: اگر هنوز جا بود و حرکت آخر استراحتی نبود، یک حرکت رهاکردن (خوابیده/خنثی) اضافه کن
    if (chain.length && chain.length < maxN) {
        var last = C.get(chain[chain.length - 1]);
        var isRest = last && last.category === 'supine' && last.subcategory === 'neutral';
        if (!isRest) {
            var pool = [];
            try { pool = C.getPoses(); } catch (e) {}
            for (i = 0; i < pool.length && chain.length < maxN; i++) {
                var rp = pool[i];
                if (used[rp.name]) continue;
                if (rp.visibility === 'tertiary') continue;
                if (!(rp.category === 'supine' && rp.subcategory === 'neutral')) continue;
                if (!C.canAccess(rp.difficulty)) continue;
                tryAdd(rp.name);
                break;
            }
        }
    }
    // پر کردن باقیمانده از پیشنهادها
    for (i = 0; i < recNames.length && chain.length < maxN; i++) {
        tryAdd(recNames[i]);
    }
    return chain;
}

// ═══════════════════ DOM / UI ═══════════════════
function escHtml(s) { return C.esc ? C.esc(s) : String(s == null ? '' : s); }

function ensureDom() {
    var overlay = document.getElementById('yogaTestOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'yq-overlay';
        overlay.id = 'yogaTestOverlay';
        overlay.style.display = 'none';
        overlay.innerHTML =
            '<div class="yq-shell" role="dialog" aria-modal="true">' +
                '<button class="yq-close" data-yq-close title="بستن">✕</button>' +
                '<div id="yqQuiz">' +
                    '<div class="yq-head">' +
                        '<div class="yq-head-title">🧘 به باشگاه یوگا خوش آمدید</div>' +
                        '<div class="yq-head-sub">با پاسخ به ۱۰ پرسش کوتاه، بهترین تمرین را برای تو طراحی می‌کنیم.</div>' +
                    '</div>' +
                    '<div class="yq-progress">' +
                        '<div class="yq-progress-bar" id="yqProgressBar"></div>' +
                        '<div class="yq-progress-text" id="yqProgressText"></div>' +
                    '</div>' +
                    '<div class="yq-q-wrap"><div class="yq-q-text" id="yqQText"></div>' +
                    '<div class="yq-options" id="yqOptions"></div>' +
                    '<div class="yq-warn" id="yqWarn" style="display:none"></div></div>' +
                    '<div class="yq-nav">' +
                        '<button class="yq-btn ghost" id="yqPrev">→ قبلی</button>' +
                        '<button class="yq-btn" id="yqNext">بعدی ←</button>' +
                        '<button class="yq-btn primary" id="yqSubmit" style="display:none">ارسال و دریافت تمرین</button>' +
                    '</div>' +
                '</div>' +
                '<div id="yqResults" style="display:none"></div>' +
            '</div>';
        document.body.appendChild(overlay);
        dom.overlay = overlay;

        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) closeOverlay();
            if (e.target.closest('[data-yq-close]')) { closeOverlay(); return; }
            var opt = e.target.closest('.yq-option');
            if (opt) {
                var inp = opt.querySelector('input');
                if (inp) { inp.checked = true; markSelected(opt); hideWarn(); }
                return;
            }
            if (e.target.closest('[data-yq-open]')) { openPoseDetail(e.target.closest('[data-yq-open]').getAttribute('data-yq-open')); return; }
            if (e.target.closest('[data-yq-fav]')) { toggleRecFav(e.target.closest('[data-yq-fav]')); return; }
            if (e.target.closest('[data-yq-add]')) { toggleRecAdd(e.target.closest('[data-yq-add]')); return; }
        });
        dom.prevBtn = document.getElementById('yqPrev');
        dom.nextBtn = document.getElementById('yqNext');
        dom.submitBtn = document.getElementById('yqSubmit');
        dom.prevBtn.addEventListener('click', goPrev);
        dom.nextBtn.addEventListener('click', goNext);
        dom.submitBtn.addEventListener('click', submitTest);
        document.addEventListener('keydown', function (e) {
            if (!dom.overlay || dom.overlay.style.display === 'none') return;
            if (e.key === 'Enter') {
                if (document.getElementById('yqQuiz').style.display !== 'none') {
                    if (dom.nextBtn.style.display !== 'none') goNext();
                    else submitTest();
                }
                e.preventDefault();
            }
            if (e.key === 'ArrowLeft' || e.key === 'Escape') closeOverlay();
            if (e.key === 'ArrowRight') goPrev();
        });
    }
    dom.overlay = overlay;
    dom.quizEl = document.getElementById('yqQuiz');
    dom.resultsEl = document.getElementById('yqResults');
}

function markSelected(optEl) {
    var box = optEl.parentElement;
    if (!box) return;
    box.querySelectorAll('.yq-option').forEach(function (o) { o.classList.remove('selected'); });
    optEl.classList.add('selected');
}
function hideWarn() {
    var w = document.getElementById('yqWarn');
    if (w) { w.style.display = 'none'; w.textContent = ''; }
}
function showWarn(msg) {
    var w = document.getElementById('yqWarn');
    if (w) { w.textContent = msg; w.style.display = 'block'; }
}

function openOverlay() {
    ensureDom();
    dom.overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}
function closeOverlay() {
    if (!dom.overlay) return;
    dom.overlay.style.display = 'none';
    document.body.style.overflow = '';
    if (!isDone()) lsSet(LS_DISMISSED, 'true');
}

function showQuizView() {
    if (dom.quizEl) dom.quizEl.style.display = '';
    if (dom.resultsEl) dom.resultsEl.style.display = 'none';
}

// ─── پرسشنامه ───
function currentQuestion() { return QUESTIONS[currentIdx]; }

function renderQuestion() {
    var q = currentQuestion();
    var qText = document.getElementById('yqQText');
    var qOpts = document.getElementById('yqOptions');
    var bar = document.getElementById('yqProgressBar');
    var txt = document.getElementById('yqProgressText');
    var n = QUESTIONS.length;
    if (qText) qText.textContent = q.text;
    if (txt) txt.textContent = 'پرسش ' + C.faNum(currentIdx + 1) + ' از ' + C.faNum(n);
    if (bar) bar.style.width = Math.round(((currentIdx + 1) / n) * 100) + '%';
    if (qOpts) {
        var html = '';
        q.options.forEach(function (opt) {
            var selected = answers[q.id] === opt.v ? ' selected' : '';
            var checked = answers[q.id] === opt.v ? ' checked' : '';
            html += '<label class="yq-option' + selected + '">' +
                '<input type="radio" name="yqopt" value="' + opt.v + '"' + checked + '>' +
                '<span class="yq-opt-letter">' + opt.v + '</span>' +
                '<span class="yq-opt-label">' + escHtml(opt.label) + '</span>' +
                '<span class="yq-opt-check">✓</span>' +
                '</label>';
        });
        qOpts.innerHTML = html;
        qOpts.querySelectorAll('input[type="radio"]').forEach(function (inp) {
            inp.addEventListener('change', function () {
                markSelected(inp.closest('.yq-option'));
                hideWarn();
            });
        });
    }
    if (dom.prevBtn) dom.prevBtn.disabled = currentIdx === 0;
    var isLast = currentIdx === n - 1;
    if (dom.nextBtn) dom.nextBtn.style.display = isLast ? 'none' : '';
    if (dom.submitBtn) dom.submitBtn.style.display = isLast ? '' : 'none';
    if (dom.quizEl) dom.quizEl.scrollTop = 0;
}

function saveCurrent() {
    var q = currentQuestion();
    var sel = null;
    var inputs = document.querySelectorAll('#yqOptions input[name="yqopt"]');
    inputs.forEach(function (i) { if (i.checked) sel = i.value; });
    if (sel !== null) answers[q.id] = sel;
    return sel;
}

function goNext() {
    var q = currentQuestion();
    if (!q.optional && saveCurrent() === null) { showWarn('⚠️ لطفاً ابتدا یک گزینه را انتخاب کنید.'); return; }
    if (currentIdx < QUESTIONS.length - 1) { currentIdx++; renderQuestion(); }
}
function goPrev() {
    saveCurrent();
    if (currentIdx > 0) { currentIdx--; renderQuestion(); }
}

function unansweredList() {
    var out = [];
    QUESTIONS.forEach(function (q) {
        if (!q.optional && answers[q.id] === undefined) out.push(q.id);
    });
    return out;
}

function submitTest() {
    var q = currentQuestion();
    if (!q.optional && saveCurrent() === null) { showWarn('⚠️ لطفاً ابتدا یک گزینه را انتخاب کنید.'); return; }
    var missing = unansweredList();
    if (missing.length) {
        var faList = missing.map(function (n) { return C.faNum(n); }).join('، ');
        showWarn('⚠️ هنوز به پرسش‌های ' + faList + ' پاسخ نداده‌ای.');
        return;
    }
    finishTest();
}

function finishTest() {
    profile = computeProfile();
    profile.recommended = recommend(profile, 8);
    // ذخیرهسازی (یکبار مصرف — با دکمه «تست دوباره» قابل تکرار)
    lsSet(LS_RESULTS, JSON.stringify(profile));
    lsSet(LS_DONE, 'true');
    lsDel(LS_DISMISSED);
    renderResults();
    renderZone();
    if (window.showToast) {
        try { window.showToast('✅ نتیجه تمرین تو آماده شد — حرکات پیشنهادی برایت نمایش داده می‌شوند.', 'success'); } catch (e) {}
    }
}

// ─── نتیجه و پیشنهادها ───
function openResultsView() {
    var stored = getResults();
    if (!stored) return;
    profile = stored;
    ensureDom();
    renderResults();
    openOverlay();
}

function renderResults() {
    ensureDom();
    var r = profile;
    var wrap = document.getElementById('yqResults');
    if (!wrap || !r) return;
    var headUp = needsUpgrade(r)
        ? '<div class="yq-upgrade-note">💎 سطح استنتاج‌شده تو «' + r.difficulty.stars + ' ' + r.difficulty.fa + '» است، اما با اشتراک فعلی حرکات تا سطح ' +
          C.DIFFICULTY_STARS['intermediate'] + ' ' + C.DIFFICULTY_FA['intermediate'] + ' در دسترس‌اند. پیشنهادها مطابق دسترسی فعلی توست.</div>'
        : '';
    var html = '';
    html += '<div class="yq-res-head">';
    html += '<div class="yq-res-icon">🧘</div>';
    html += '<h3 class="yq-res-title">تمرین شخصی‌سازی‌شده تو آماده است</h3>';
    html += '<p class="yq-res-sub">بر اساس ' + C.faNum(QUESTIONS.length) + ' پاسخ تو، این حرکات بیشترین هماهنگی را با تو دارند.</p>';
    html += '</div>';
    html += '<div class="yq-sum">';
    html += tile('سطح تمرین', r.difficulty.stars + ' ' + r.difficulty.fa, '🎯');
    html += tile('نوع حرکت', r.movement.fa, '🤸');
    html += tile('دسته حرکات', r.category.icon + ' ' + r.category.fa, '🧍');
    html += tile('مدت پیشنهادی', C.faNum(r.minutes) + ' دقیقه', '⏱');
    html += '</div>';
    html += headUp;
    if (r.gender) html += '<div class="yq-gender">جنسیت ثبت‌شده: ' + escHtml(r.gender) + '</div>';
    html += '<div class="yq-res-section-title">✨ حرکات پیشنهادی برای تو</div>';
    if (!r.recommended || !r.recommended.length) {
        html += '<div class="yq-empty">متأسفانه حرکتی هماهنگ پیدا نشد — دوباره تلاش کن یا اشتراک را ارتقا بده.</div>';
    } else {
        html += '<div class="yq-grid">';
        r.recommended.forEach(function (name) {
            var p = C.get(name);
            if (!p) return;
            var match = p.subcategory === r.movement.key ? ' · ' + escHtml(r.movement.fa) : (p.category === r.category.key ? ' · ' + escHtml(C.catFa(p.category)) : '');
            html += '<div class="yq-card" data-yq-open="' + C.escAttr(name) + '" title="' + C.escAttr(C.nameEn(p)) + '">';
            html += '<div class="yq-card-img">' + recImg(p) +
                '<button class="yq-card-fav' + (C.isFav(name) ? ' active' : '') + '" data-yq-fav="' + C.escAttr(name) + '" title="علاقه‌مندی">' + (C.isFav(name) ? '♥' : '♡') + '</button>' +
                '<button class="yq-card-add' + (C.getSession().indexOf(name) >= 0 ? ' active' : '') + '" data-yq-add="' + C.escAttr(name) + '" title="افزودن به جلسه">' + (C.getSession().indexOf(name) >= 0 ? '✓' : '+') + '</button>' +
                '</div>';
            html += '<div class="yq-card-body">';
            html += '<div class="yq-card-name">' + escHtml(C.nameFa(p)) + '</div>';
            html += '<div class="yq-card-en">' + escHtml(C.nameEn(p)) + '</div>';
            html += '<div class="yq-card-meta">';
            html += '<span class="yq-chip">' + (C.DIFFICULTY_STARS[p.difficulty] || '') + ' ' + (C.DIFFICULTY_FA[p.difficulty] || '') + '</span>';
            html += '<span class="yq-chip alt">' + (C.catIcon(p.category) || '') + ' ' + escHtml(C.catFa(p.category)) + '</span>';
            if (match) html += '<span class="yq-chip gold">' + match.replace(' · ', '') + '</span>';
            html += '</div></div></div>';
        });
        html += '</div>';
    }
    html += '<div class="yq-res-actions">';
    html += '<button class="yq-btn primary big" id="yqStartPractice">▶ شروع تمرین پیشنهادی</button>';
    html += '<button class="yq-btn" id="yqSmartLibrary">✨ کتابخانه با حرکات پیشنهادی من</button>';
    html += '<button class="yq-btn ghost" id="yqRetake">🔄 انجام دوباره تست</button>';
    html += '<button class="yq-btn ghost" id="yqBrowse">مرور کتابخانه حرکات</button>';
    html += '</div>';
    html += '<div class="yq-res-foot">تمرینات پیشنهادی از «کتابخانه حرکات» انتخاب شده‌اند و با روابط واقعی حرکات به هم متصل می‌شوند.</div>';
    wrap.innerHTML = html;
    if (dom.quizEl) dom.quizEl.style.display = 'none';
    wrap.style.display = '';
    // رویدادهای دکمههای نتیجه
    var start = document.getElementById('yqStartPractice');
    if (start) start.addEventListener('click', startRecommendedPractice);
    var ret = document.getElementById('yqRetake');
    if (ret) ret.addEventListener('click', function () { retakeTest(); });
    var browse = document.getElementById('yqBrowse');
    if (browse) browse.addEventListener('click', function () { closeOverlay(); goToLibrary(); });
    var smartLib = document.getElementById('yqSmartLibrary');
    if (smartLib) smartLib.addEventListener('click', function () { goToLibrarySmart(); });
}

function tile(label, value, icon) {
    return '<div class="yq-tile"><div class="yq-tile-icon">' + icon + '</div>' +
        '<div class="yq-tile-label">' + label + '</div>' +
        '<div class="yq-tile-value">' + value + '</div></div>';
}

function recImg(p) {
    var u = C.getImage(p, { size: 'card', side: C.sideOf(p.preferred_side) });
    var fb = C.placeholderSvg(p, 260);
    return '<img src="' + C.escAttr(u) + '" alt="' + C.escAttr(C.nameEn(p)) + '" loading="lazy" data-fb="' + C.escAttr(fb) + '"' +
        ' onerror="if(this.src!==this.getAttribute(\'data-fb\')){this.onerror=null;this.src=this.getAttribute(\'data-fb\');}">';
}

function startRecommendedPractice() {
    var recs = profile.recommended || [];
    if (!recs.length) { showWarnInResults('حرکتی برای شروع نیست — ابتدا سطح یا اشتراک خود را بررسی کن.'); return; }
    var chain = buildPracticeChain(recs, 8);
    if (!chain.length) chain = recs.slice(0, 8);
    closeOverlay();
    if (window.YogaPractice && window.YogaPractice.launch) {
        try { C.setSession(chain); } catch (e) {}
        window.YogaPractice.launch(chain);
        if (window.YogaLibrary && window.YogaLibrary.setTab) {
            window.YogaLibrary.setTab('practice');
            // setTab فقط محتوا را رندر می‌کند؛ پنل را هم نمایش بده
            if (window.YogaLibrary.refreshTabs) window.YogaLibrary.refreshTabs();
        }
    }
}
function showWarnInResults(msg) {
    var w = document.getElementById('yqWarn');
    if (w) { w.textContent = msg; w.style.display = 'block'; }
}

function goToLibrary() {
    if (window.YogaLibrary && window.YogaLibrary.showLibrary) window.YogaLibrary.showLibrary();
}

// بستن نتایج و رفتن به کتابخانه با چیپ «پیشنهاد برای من» فعال
function goToLibrarySmart() {
    closeOverlay();
    if (window.YogaLibrary && window.YogaLibrary.showLibrary) window.YogaLibrary.showLibrary();
    if (window.YogaLibrary && window.YogaLibrary.enableSmart) {
        try { window.YogaLibrary.enableSmart(); } catch (e) {}
    }
}

function openPoseDetail(name) {
    closeOverlay();
    if (window.YogaLibrary && window.YogaLibrary.openDetail) window.YogaLibrary.openDetail(name);
    else goToLibrary();
}

function toggleRecFav(btn) {
    var name = btn.getAttribute('data-yq-fav');
    if (!name) return;
    C.toggleFav(name);
    var now = C.isFav(name);
    btn.classList.toggle('active', now);
    btn.textContent = now ? '♥' : '♡';
}
function toggleRecAdd(btn) {
    var name = btn.getAttribute('data-yq-add');
    if (!name) return;
    var s = C.getSession();
    if (s.indexOf(name) >= 0) C.removeFromSession(name);
    else C.addToSession(name);
    var inS = C.getSession().indexOf(name) >= 0;
    btn.classList.toggle('active', inS);
    btn.textContent = inS ? '✓' : '+';
}

// ─── نوار بالای صفحه یوگا ───
function renderZone() {
    var zone = document.getElementById('yogaTestZone');
    if (!zone) return;
    var r = getResults();
    if (isDone() && r) {
        zone.innerHTML =
            '<div class="yq-zone bar">' +
                '<div class="yq-zone-title">🎯 پروفایل تمرین تو</div>' +
                '<div class="yq-pf-chips">' +
                    '<span class="yq-chip gold">' + r.difficulty.stars + ' ' + escHtml(r.difficulty.fa) + '</span>' +
                    '<span class="yq-chip gold">🤸 ' + escHtml(r.movement.fa) + '</span>' +
                    '<span class="yq-chip gold">' + (r.category.icon || '') + ' ' + escHtml(r.category.fa) + '</span>' +
                    '<span class="yq-chip gold">⏱ ' + C.faNum(r.minutes) + ' دقیقه</span>' +
                '</div>' +
                '<div class="yq-zone-actions">' +
                    '<button class="yq-btn small" data-yq-zone="results">✨ حرکات پیشنهادی</button>' +
                    '<button class="yq-btn small ghost" data-yq-zone="retake">ویرایش</button>' +
                '</div>' +
            '</div>';
    } else {
        var oldNote = hasOldQuestionnaire() ? '<div class="yq-zone-note">نسخه قبلی تست را انجام داده‌ای — با تست جدید ۱۰ پرسشی، نتیجه دقیق‌تری می‌گیری.</div>' : '';
        zone.innerHTML =
            '<div class="yq-zone cta">' +
                '<div class="yq-cta-text">' +
                    '<div class="yq-cta-title">🧘 به باشگاه یوگا خوش آمدی</div>' +
                    '<div class="yq-cta-sub">با یک تست کوتاه، حرکات مناسب سطح و بدن تو را پیشنهاد می‌دهیم — بدون هیچ اصطلاح فنی.</div>' +
                    oldNote +
                '</div>' +
                '<button class="yq-btn primary" data-yq-zone="start">🎯 شروع تست تشخیص تمرین</button>' +
            '</div>';
    }
}

function bindZone() {
    var zone = document.getElementById('yogaTestZone');
    if (!zone) return;
    zone.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-yq-zone]');
        if (!btn) return;
        var act = btn.getAttribute('data-yq-zone');
        if (act === 'start') openQuiz();
        else if (act === 'results') openResultsView();
        else if (act === 'retake') retakeTest();
    });
}

// ─── گردش کار ───
function openQuiz() {
    ensureDom();
    showQuizView();
    renderQuestion();
    openOverlay();
}

function retakeTest() {
    lsDel(LS_DONE);
    lsDel(LS_RESULTS);
    answers = {};
    currentIdx = 0;
    profile = null;
    renderZone();
    openQuiz();
}

/**
 * هر بار که صفحه یوگا باز میشود (از YogaLibrary.init صدا زده میشود):
 * ۱) نوار وضعیت تست را بهروز کن
 * ۲) اولین بازدید — اگر تست هنوز انجام نشده، خودکار نمایش بده
 */
function onYogaOpened() {
    ensureDom();
    renderZone();
    bindZone();
    if (isDone()) return;
    if (shownOnce || isDismissed() || hasOldQuestionnaire()) return;
    // منتظر بمان تا دادهها آماده و صفحه دیده شود
    shownOnce = true;
    setTimeout(function () {
        var pg = document.getElementById('pageYoga');
        if (pg && !pg.hidden) openQuiz();
    }, 450);
}

// ─── API عمومی ───
return {
    onYogaOpened: onYogaOpened,
    openQuiz: openQuiz,
    openResults: openResultsView,
    retakeTest: retakeTest,
    isDone: isDone,
    getResults: getResults,
    // برای روزانه: حداکثر سطح مجاز بر اساس نتیجه تست
    maxDifficulty: function () {
        var r = getResults();
        if (r && r.difficulty && r.difficulty.key) return r.difficulty.key;
        // سازگاری با پرسشنامه قدیمی
        try {
            var old = JSON.parse(lsGet('yoga_questionnaire_answers') || '{}');
            var exp = old.step_1 && old.step_1[0] ? old.step_1[0] : '';
            if (exp === 'advanced' || exp === 'mentor') return 'expert';
            if (exp === 'intermediate') return 'intermediate';
            if (exp === 'beginner') return 'beginner';
        } catch (e) {}
        return null;
    }
};
})();
