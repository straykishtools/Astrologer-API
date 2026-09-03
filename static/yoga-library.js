// ================================================================
//  YOGA POSE LIBRARY v3 — کتابخانه جامع حرکات یوگا
//  کتابخانه · تمرین روزانه · جلسه تمرین · تنفس و مدیتیشن
//  داده و تصاویر از YogaCore (منبع واحد حقیقت)
// ================================================================
(function () {
'use strict';

var C = window.YogaCore;

// ─── وضعیت ───
var allPoses = [], filteredPoses = [], poseMap = {};
var currentView = 'grid', showTertiary = false, currentSort = 'name_fa';
var currentFilters = { difficulty: [], subcategory: [], category: [], visibility: [], search: '' };
var _inited = false, _activeTab = 'library', _dataLoaded = false;
var activeDetailPose = null, activeDetailSide = 'R';
var PAGE_SIZE = 12, currentPage = 1;
var _eventsBound = false;

var PAGE = {
    gridWrap: 'yogaGridWrap', filters: 'yogaFilters', daily: 'yogaDailyPanel',
    breath: 'yogaBreathPanel', practice: 'yogaPracticePanel', detail: 'yogaDetail'
};

var UI_CATEGORIES = [
    'standing', 'seated', 'supine', 'prone', 'arm_leg_support', 'arm_balance_and_inversion'
];

// ─── پرسشنامه ───
function getQA() { try { return JSON.parse(localStorage.getItem('yoga_questionnaire_answers')) || {}; } catch (e) { return {}; } }

// ─── فیلتر و مرتب‌سازی ───
function searchHaystack(p) {
    var bits = [p.name, p.name_fa, p.display_name, p.display_name_fa];
    if (p.aka) bits.push(String(p.aka));
    if (p.aka_fa) bits.push(String(p.aka_fa));
    (p.sanskrit_names || []).forEach(function (s) {
        bits.push(s.latin, s.latin_fa, s.simplified, s.simplified_fa, s.devanagari);
    });
    return bits.join(' ').toLowerCase();
}

function applyFilters() {
    filteredPoses = allPoses.filter(function (p) {
        if (!showTertiary && p.visibility === 'tertiary') return false;
        if (currentFilters.difficulty.length && currentFilters.difficulty.indexOf(p.difficulty) < 0) return false;
        if (currentFilters.subcategory.length && currentFilters.subcategory.indexOf(p.subcategory) < 0) return false;
        if (currentFilters.category.length && currentFilters.category.indexOf(p.category) < 0) return false;
        if (currentFilters.visibility.length && currentFilters.visibility.indexOf(p.visibility || 'secondary') < 0) return false;
        if (currentFilters.search) {
            var q = currentFilters.search.toLowerCase();
            if (searchHaystack(p).indexOf(q) < 0) return false;
        }
        return true;
    });
    filteredPoses.sort(function (a, b) {
        if (currentSort === 'name_fa') return C.nameFa(a).localeCompare(C.nameFa(b), 'fa');
        if (currentSort === 'name_en') return C.nameEn(a).localeCompare(C.nameEn(b), 'en');
        if (currentSort === 'difficulty') return (C.diffOrder(a.difficulty) || 0) - (C.diffOrder(b.difficulty) || 0);
        if (currentSort === 'category') return (a.category || '').localeCompare(b.category || '');
        return 0;
    });
    currentPage = 1;
    renderGrid();
    updateCount();
}

function updateCount() {
    var el = document.getElementById('yogaCount');
    if (el) {
        var total = filteredPoses.length;
        var scope = (showTertiary || currentFilters.visibility.length) ? total + ' حرکت' : total + ' حرکت';
        el.textContent = scope;
        el.setAttribute('data-total', total);
    }
}

// ─── رندر فیلترها ───
function renderFilters() {
    var el = document.getElementById('yogaFilters');
    if (!el) return;
    var html = '<div class="yoga-filters-row">';
    html += '<input type="text" class="yoga-filter-search" id="yogaSearch" placeholder="🔍 جستجو در نام فارسی، انگلیسی، سانسکریت…" autocomplete="off">';
    html += '<select class="yoga-filter-select" id="yogaSort">';
    html += '<option value="name_fa">مرتب‌سازی: نام فارسی</option>';
    html += '<option value="name_en">مرتب‌سازی: نام انگلیسی</option>';
    html += '<option value="difficulty">مرتب‌سازی: سطح</option>';
    html += '<option value="category">مرتب‌سازی: دسته</option>';
    html += '</select>';
    html += '<button class="yoga-view-btn active" data-view="grid" title="نمای گرید">▦</button>';
    html += '<button class="yoga-view-btn" data-view="list" title="نمای لیست">☰</button>';
    html += '</div>';
    html += '<div class="yoga-filter-tags">';
    html += '<div class="yoga-filter-group"><label>سطح:</label>';
    ['beginner', 'intermediate', 'expert'].forEach(function (d) {
        html += '<button class="yoga-tag" data-filter="difficulty" data-value="' + d + '">' + C.DIFFICULTY_STARS[d] + ' ' + C.DIFFICULTY_FA[d] + '</button>';
    });
    html += '</div>';
    html += '<div class="yoga-filter-group"><label>نوع حرکت:</label>';
    Object.keys(C.SUBCATEGORY_FA).forEach(function (k) {
        html += '<button class="yoga-tag" data-filter="subcategory" data-value="' + k + '">' + C.SUBCATEGORY_FA[k] + '</button>';
    });
    html += '</div>';
    html += '<div class="yoga-filter-group"><label>دسته:</label>';
    UI_CATEGORIES.forEach(function (k) {
        html += '<button class="yoga-tag" data-filter="category" data-value="' + k + '">' + (C.catIcon(k) || '') + ' ' + C.catFa(k) + '</button>';
    });
    html += '</div>';
    html += '<div class="yoga-filter-group"><label>نقش:</label>';
    [['primary', 'اصلی'], ['secondary', 'فرعی'], ['tertiary', 'پنهان']].forEach(function (kv) {
        html += '<button class="yoga-tag" data-filter="visibility" data-value="' + kv[0] + '">' + kv[1] + '</button>';
    });
    html += '</div>';
    html += '<label class="yoga-tertiary-toggle"><input type="checkbox" id="yogaTertiaryToggle"> نمایش حرکات پنهان</label>';
    html += '</div>';
    el.innerHTML = html;
    document.getElementById('yogaSearch').addEventListener('input', function () {
        currentFilters.search = this.value; applyFilters();
    });
    document.getElementById('yogaSort').addEventListener('change', function () {
        currentSort = this.value; applyFilters();
    });
    el.querySelectorAll('.yoga-view-btn').forEach(function (b) {
        b.addEventListener('click', function () {
            currentView = this.dataset.view;
            el.querySelectorAll('.yoga-view-btn').forEach(function (x) { x.classList.remove('active'); });
            this.classList.add('active');
            var grid = document.getElementById('yogaGridWrap');
            if (grid) grid.className = currentView === 'list' ? 'yoga-grid-wrap yoga-list-view' : 'yoga-grid-wrap';
            renderGrid();
        });
    });
    el.querySelectorAll('.yoga-tag').forEach(function (tag) {
        tag.addEventListener('click', function () {
            this.classList.toggle('active');
            var f = this.dataset.filter, v = this.dataset.value;
            var arr = currentFilters[f];
            var idx = arr.indexOf(v);
            if (idx >= 0) arr.splice(idx, 1); else arr.push(v);
            applyFilters();
        });
    });
    document.getElementById('yogaTertiaryToggle').addEventListener('change', function () {
        showTertiary = this.checked; applyFilters();
    });
}

function imgTag(pose, opts) {
    opts = opts || {};
    var url = C.getImage(pose, opts);
    var fb = C.placeholderSvg(pose, 220);
    var cls = opts.cls ? ' class="' + opts.cls + '"' : '';
    var alt = C.escAttr(C.nameEn(pose));
    var lazy = opts.lazy === false ? '' : ' loading="lazy"';
    return '<img src="' + C.escAttr(url) + '"' + cls + ' alt="' + alt + '" data-fb="' + C.escAttr(fb) + '"' + lazy +
        ' onerror="if(this.src!==this.getAttribute(\'data-fb\')){this.onerror=null;this.src=this.getAttribute(\'data-fb\');}">';
}

// ─── رندر کارت‌ها ───
function renderGrid() {
    var grid = document.getElementById('yogaPosesGrid');
    if (!grid) return;
    if (!filteredPoses.length) {
        grid.innerHTML = '<div class="yoga-empty">هیچ حرکتی یافت نشد 🔍</div>';
        var pag = document.getElementById('yogaPagination');
        if (pag) pag.innerHTML = '';
        return;
    }
    var totalPages = Math.ceil(filteredPoses.length / PAGE_SIZE);
    if (currentPage > totalPages) currentPage = totalPages;
    var start = (currentPage - 1) * PAGE_SIZE;
    var pagePoses = filteredPoses.slice(start, start + PAGE_SIZE);
    var favs = C.getFavs();
    var html = '';
    pagePoses.forEach(function (p, i) {
        var isFav = favs.indexOf(p.name) >= 0;
        var isLocked = !C.canAccess(p.difficulty);
        var isTert = p.visibility === 'tertiary';
        html += '<div class="yoga-card' + (isLocked ? ' yoga-card-locked' : '') + (isTert ? ' yoga-card-tertiary' : '') + '" data-yoga-open="' + C.escAttr(p.name) + '" style="animation-delay:' + (i * 30) + 'ms">';
        html += '<div class="yoga-card-img">';
        html += imgTag(p, { size: 'card', side: C.sideOf(p.preferred_side), cls: '', lazy: true });
        if (C.canSwitchSide(p)) html += '<span class="yoga-card-side">↔ دوطرفه</span>';
        if (isLocked) html += '<span class="yoga-card-lock">🔒</span>';
        html += '<button class="yoga-card-fav' + (isFav ? ' active' : '') + '" data-yoga-fav="' + C.escAttr(p.name) + '">' + (isFav ? '♥' : '♡') + '</button>';
        html += '</div>';
        html += '<div class="yoga-card-body">';
        html += '<div class="yoga-card-title">' + C.esc(C.nameFa(p)) + '</div>';
        html += '<div class="yoga-card-sub">' + C.esc(C.nameEn(p)) + '</div>';
        html += '<div class="yoga-card-meta">';
        html += '<span class="yoga-card-stars">' + (C.DIFFICULTY_STARS[p.difficulty] || '') + ' ' + (C.DIFFICULTY_FA[p.difficulty] || '') + '</span>';
        html += '<span class="yoga-card-cat">' + (C.catIcon(p.category) || '') + ' ' + C.catFa(p.category) + '</span>';
        html += '</div>';
        html += '</div>';
        html += '</div>';
    });
    grid.innerHTML = html;
    renderPagination(totalPages);
}

function renderPagination(totalPages) {
    var el = document.getElementById('yogaPagination');
    if (!el) return;
    if (totalPages <= 1) { el.innerHTML = ''; return; }
    var html = '';
    html += '<button class="yoga-page-btn" data-page="prev" ' + (currentPage <= 1 ? 'disabled' : '') + '>→ قبلی</button>';
    var startP = Math.max(1, currentPage - 2);
    var endP = Math.min(totalPages, startP + 4);
    if (endP - startP < 4) startP = Math.max(1, endP - 4);
    if (startP > 1) html += '<button class="yoga-page-btn" data-page="1">۱</button>';
    if (startP > 2) html += '<span class="yoga-page-dots">...</span>';
    for (var i = startP; i <= endP; i++) {
        html += '<button class="yoga-page-btn' + (i === currentPage ? ' active' : '') + '" data-page="' + i + '">' + C.faNum(i) + '</button>';
    }
    if (endP < totalPages - 1) html += '<span class="yoga-page-dots">...</span>';
    if (endP < totalPages) html += '<button class="yoga-page-btn" data-page="' + totalPages + '">' + C.faNum(totalPages) + '</button>';
    html += '<button class="yoga-page-btn" data-page="next" ' + (currentPage >= totalPages ? 'disabled' : '') + '>بعدی ←</button>';
    html += '<span class="yoga-page-info">صفحه ' + C.faNum(currentPage) + ' از ' + C.faNum(totalPages) + ' (' + C.faNum(filteredPoses.length) + ' حرکت)</span>';
    el.innerHTML = html;
    el.querySelectorAll('.yoga-page-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var pg = this.dataset.page;
            if (pg === 'prev') currentPage--;
            else if (pg === 'next') currentPage++;
            else currentPage = parseInt(pg, 10);
            renderGrid();
            var wrap = document.getElementById('yogaGridWrap');
            if (wrap) wrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });
}

// ═══════════ صفحه جزئیات ═══════════
function openDetail(name) {
    var pose = poseMap[name];
    if (!pose) return;
    activeDetailPose = pose;
    var preferred = C.sideOf(pose.preferred_side);
    activeDetailSide = C.sideAvailable(name, preferred) ? preferred : (C.sideAvailable(name, 'R') ? 'R' : 'L');
    showOnly('detail');
    renderDetail(pose);
    try { history.replaceState(null, '', '#yoga/pose/' + encodeURIComponent(name)); } catch (e) {}
    var el = document.getElementById('yogaDetail');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function closeDetail() {
    activeDetailPose = null;
    document.getElementById('yogaDetail').style.display = 'none';
    if (_activeTab === 'library') {
        document.getElementById('yogaGridWrap').style.display = '';
        document.getElementById('yogaFilters').style.display = '';
    } else {
        renderTabs(); // daily/practice/breath restore themselves
    }
    try { history.replaceState(null, '', window.location.pathname + window.location.search); } catch (e) {}
}
function showOnly(name) {
    document.getElementById('yogaGridWrap').style.display = 'none';
    document.getElementById('yogaFilters').style.display = 'none';
    document.getElementById('yogaDailyPanel').style.display = 'none';
    document.getElementById('yogaBreathPanel').style.display = 'none';
    document.getElementById('yogaPracticePanel').style.display = 'none';
    document.getElementById('yogaDetail').style.display = name === 'detail' ? 'block' : 'none';
}

function relItemCard(refName, pose, kind) {
    var p = poseMap[refName];
    if (!p) return '';
    var lab = kind === 'variation'
        ? { fa: C.REL_FA.variations, cls: 'yk-rel-var' }
        : C.relLabel(pose, refName);
    var locked = !C.canAccess(p.difficulty);
    var html = '<div class="yoga-rel-item' + (locked ? ' locked' : '') + '" data-yoga-open="' + C.escAttr(p.name) + '" title="' + C.escAttr(C.nameEn(p)) + '">';
    html += '<div class="yoga-rel-thumb">' + imgTag(p, { size: 'card', side: C.sideOf(p.preferred_side) });
    if (locked) html += '<span class="yoga-rel-lock">🔒</span>';
    html += '</div>';
    html += '<div class="yoga-rel-body">';
    html += '<div class="yoga-rel-name">' + C.esc(C.nameFa(p)) + '</div>';
    html += '<div class="yoga-rel-en">' + C.esc(C.nameEn(p)) + '</div>';
    html += '<div class="yoga-rel-meta">' + (C.DIFFICULTY_STARS[p.difficulty] || '') + ' ' + (C.DIFFICULTY_FA[p.difficulty] || '');
    if (lab.fa) html += ' · <span class="yk-chip ' + lab.cls + '">' + lab.fa + '</span>';
    html += '</div>';
    html += '</div>';
    html += '<span class="yoga-rel-arrow">‹</span>';
    html += '</div>';
    return html;
}

function relSection(title, items, pose, kind) {
    if (!items.length) return '';
    var cls = kind === 'variation' ? 'yk-rel-grid' : 'yk-rel-list';
    var hint = kind === 'variation'
        ? '<div class="yoga-rel-hint">نسخه‌های دیگری از همین حرکت — قابل استفاده به‌جای حالت اصلی در تمرین</div>'
        : '';
    var html = '<div class="yoga-detail-section yk-rel-section ' + (kind === 'variation' ? 'is-variation' : '') + '">';
    html += '<div class="yk-section-head"><span class="yk-section-icon">' + (kind === 'incoming' ? '⤵' : kind === 'outgoing' ? '⤴' : '🔁') + '</span>';
    html += '<h3>' + title + '</h3><span class="yk-section-count">' + C.faNum(items.length) + '</span></div>';
    html += hint;
    html += '<div class="' + cls + '">';
    items.forEach(function (n) { html += relItemCard(n, pose, kind); });
    html += '</div></div>';
    return html;
}

function sanskritBlock(pose) {
    var sans = pose.sanskrit_names || [];
    if (!sans.length) return '';
    var html = '';
    sans.forEach(function (s) {
        html += '<div class="yoga-detail-sanskrit yk-sanskrit">';
        if (s.devanagari) html += '<span class="yk-sanskrit-deva">' + C.esc(s.devanagari) + '</span>';
        html += '<span class="yoga-sanskrit-latin">' + C.esc(s.latin || s.simplified) + '</span>';
        if (s.transliteration_fa || s.simplified_fa) {
            html += '<span class="yoga-sanskrit-fa">' + C.esc(s.transliteration_fa || s.simplified_fa) + '</span>';
        }
        html += '</div>';
        // Word-by-word breakdown
        if (s.translation && s.translation.length) {
            html += '<div class="yk-sanskrit-words">';
            s.translation.forEach(function (w, i) {
                html += '<div class="yk-sanskrit-word">';
                html += '<span class="yk-sanskrit-word-idx">' + C.faNum(i + 1) + '</span>';
                html += '<span class="yk-sanskrit-word-latin">' + C.esc(w.latin || w.simplified || w.devanagari) + '</span>';
                html += '<span class="yk-sanskrit-word-fa">' + C.esc(w.description_fa || w.description || '') + '</span>';
                html += '</div>';
            });
            html += '</div>';
        }
    });
    return html;
}

function akaChips(pose) {
    var en = pose.aka, fa = pose.aka_fa;
    var enList = Array.isArray(en) ? en : (en ? [en] : []);
    var faList = Array.isArray(fa) ? fa : (fa ? [fa] : []);
    if (!enList.length && !faList.length) return '';
    var html = '<div class="yk-aka-row">';
    html += '<span class="yk-aka-label">نام‌های دیگر:</span>';
    faList.forEach(function (a) { html += '<span class="yoga-tag-static yk-aka-fa">' + C.esc(a) + '</span>'; });
    enList.forEach(function (a) { html += '<span class="yoga-tag-static">' + C.esc(a) + '</span>'; });
    html += '</div>';
    return html;
}

function renderDetail(pose) {
    var el = document.getElementById('yogaDetail');
    if (!el) return;
    var side = activeDetailSide;
    var isFav = C.isFav(pose.name);
    var canDo = C.canAccess(pose.difficulty);
    var inSession = C.getSession().indexOf(pose.name) >= 0;

    var html = '';
    html += '<button class="yoga-detail-back" data-yoga-back>→ بازگشت</button>';
    html += '<div class="yoga-detail">';

    // ── تصویر ──
    html += '<div class="yoga-detail-img-wrap">';
    html += imgTag(pose, { size: 'full', side: side, cls: 'yoga-detail-img', lazy: false });
    if (pose.two_sided && !C.canSwitchSide(pose)) {
        html += '<div class="yk-side-note">این حرکت دوطرفه است؛ تصویر ' + (C.sideAvailable(pose.name, side) ? 'همین سمت' : 'سمت در دسترس') + ' نمایش داده شده است.</div>';
    }
    if (pose.two_sided && C.canSwitchSide(pose)) {
        html += '<div class="yoga-detail-side-toggle">';
        html += '<button class="yoga-side-btn' + (side === 'R' ? ' active' : '') + '" data-yoga-side="R">' + (side === 'R' ? '✓ ' : '') + 'سمت راست</button>';
        html += '<button class="yoga-side-btn' + (side === 'L' ? ' active' : '') + '" data-yoga-side="L">' + (side === 'L' ? '✓ ' : '') + 'سمت چپ</button>';
        html += '</div>';
    }
    html += '</div>';

    // ── اطلاعات ──
    html += '<div class="yoga-detail-info">';
    html += '<h2 class="yoga-detail-name-fa">' + C.esc(C.nameFa(pose)) + '</h2>';
    html += '<div class="yoga-detail-name-en">' + C.esc(C.nameEn(pose)) + '</div>';
    html += sanskritBlock(pose);
    html += akaChips(pose);

    html += '<div class="yoga-detail-tags">';
    html += '<span class="yoga-tag-static">' + (C.DIFFICULTY_STARS[pose.difficulty] || '') + ' ' + (C.DIFFICULTY_FA[pose.difficulty] || '') + '</span>';
    html += '<span class="yoga-tag-static">' + (C.catIcon(pose.category) || '') + ' ' + C.catFa(pose.category) + '</span>';
    html += '<span class="yoga-tag-static">' + C.subFa(pose.subcategory) + '</span>';
    if (pose.visibility && C.visFa(pose.visibility)) html += '<span class="yoga-tag-static yk-vis">' + C.visFa(pose.visibility) + '</span>';
    if (C.canSwitchSide(pose)) html += '<span class="yoga-tag-static">↔ دوطرفه</span>';
    html += '</div>';

    if (!canDo) {
        html += '<div class="yk-upgrade-note">🔒 این حرکت در سطح «' + C.DIFFICULTY_FA[pose.difficulty] + '» است. برای تمرین، اشتراک خود را ارتقا دهید.</div>';
    }

    // ── اقدام‌ها ──
    html += '<div class="yk-detail-actions">';
    html += '<button class="yk-act-btn" data-yoga-fav="' + C.escAttr(pose.name) + '">' + (isFav ? '♥ از علاقه‌مندی‌ها حذف شد' : '♡ افزودن به علاقه‌مندی‌ها') + '</button>';
    html += '<button class="yk-act-btn" data-yoga-add="' + C.escAttr(pose.name) + '">' + (inSession ? '✓ در جلسه تمرین' : '+ افزودن به جلسه تمرین') + '</button>';
    html += '</div>';
    html += '<button class="yk-start-flow-btn" data-yoga-flow="' + C.escAttr(pose.name) + '" ' + (canDo ? '' : 'disabled') + '>🧘 شروع تمرین از این حرکت</button>';

    // ── توضیحات ──
    var descFa = pose.description_fa || '';
    var descEn = pose.description || '';
    if (descFa || descEn) {
        html += '<div class="yoga-detail-section"><h3>📖 توضیحات حرکت</h3><p class="yk-desc-p">' + C.renderDesc(descFa || descEn, { linkRefs: true }) + '</p></div>';
    }

    // ── مزایا ──
    var benefits = pose.benefits_fa || pose.benefits || '';
    if (benefits) {
        html += '<div class="yoga-detail-section"><h3>✨ مزایا</h3><p>' + C.esc(benefits) + '</p></div>';
    }

    // ── تغییرات ──
    html += relSection(C.REL_FA.variations, C.variationsOf(pose), pose, 'variation');

    // ── ورودی / خروجی ──
    html += relSection(C.REL_FA.incoming, C.incomingOf(pose), pose, 'incoming');
    html += relSection(C.REL_FA.outgoing, C.outgoingOf(pose), pose, 'outgoing');

    // ── مرتبط ──
    html += relSection(C.REL_FA.related, C.relatedOf(pose, 6).map(function (p) { return p.name; }), pose, 'related');

    html += '</div>'; // yoga-detail-info
    html += '</div>'; // yoga-detail
    el.innerHTML = html;
}

// ═══════════ تب تمرین روزانه ═══════════
function renderDailyPanel() {
    var el = document.getElementById('yogaDailyPanel');
    if (!el) return;
    var practice = C.getPracticeData();
    var favs = C.getFavs().length;
    // حداکثر سطح مجاز: اول از نتیجه تست جدید (yoga-test.js)، بعد پرسشنامه قدیمی
    var maxDiff = 'beginner';
    var tmax = (window.YogaTest && window.YogaTest.maxDifficulty) ? window.YogaTest.maxDifficulty() : null;
    if (tmax) {
        maxDiff = tmax;
    } else {
        var exp = getQA().step_1 && getQA().step_1[0] ? getQA().step_1[0] : 'beginner';
        if (exp === 'intermediate' || exp === 'advanced') maxDiff = 'intermediate';
        if (exp === 'mentor') maxDiff = 'expert';
    }

    // توصیه روز: یک زنجیره متصل از حرکات
    var flow = C.buildFlow('auto', 6).filter(function (n) {
        return C.canAccess(poseMap[n].difficulty) && C.diffOrder(poseMap[n].difficulty) <= C.diffOrder(maxDiff);
    });
    while (flow.length < 4) {
        var extra = C.buildFlow('auto', 1)[0];
        if (extra && flow.indexOf(extra) < 0) flow.push(extra); else break;
    }

    var html = '<div class="yoga-daily">';
    html += '<div class="yoga-daily-stats">';
    html += '<div class="yoga-stat"><div class="yoga-stat-num">' + C.faNum(practice.streak) + '</div><div class="yoga-stat-label">🔥 روز متوالی</div></div>';
    html += '<div class="yoga-stat"><div class="yoga-stat-num">' + C.faNum(practice.totalSessions) + '</div><div class="yoga-stat-label">🧘 جلسه</div></div>';
    html += '<div class="yoga-stat"><div class="yoga-stat-num">' + C.faNum(practice.totalMinutes) + '</div><div class="yoga-stat-label">⏱ دقیقه</div></div>';
    html += '<div class="yoga-stat"><div class="yoga-stat-num">' + C.faNum(favs) + '</div><div class="yoga-stat-label">♥ علاقه‌مندی</div></div>';
    html += '</div>';

    html += '<div class="yoga-daily-status">';
    html += C.practicedToday()
        ? '<span class="yoga-daily-done">✅ امروز تمرین کردید — آفرین!</span>'
        : '<span class="yoga-daily-pending">⏳ هنوز امروز تمرین نکردید</span>';
    html += '</div>';

    if (flow.length) {
        html += '<h3>🌟 جریان پیشنهادی امروز <span class="yk-flow-sub">— حرکات به هم متصل، از ساده به چالش‌برانگیز</span></h3>';
        html += '<div class="yoga-daily-list yk-daily-flow">';
        flow.forEach(function (name, i) {
            var p = poseMap[name];
            var prevPose = i > 0 ? poseMap[flow[i - 1]] : null;
            html += '<div class="yoga-daily-item" data-yoga-open="' + C.escAttr(name) + '">';
            html += '<span class="yk-flow-step">' + C.faNum(i + 1) + '</span>';
            html += imgTag(p, { size: 'card', side: C.sideOf(p.preferred_side), cls: 'yoga-daily-item-img', lazy: true });
            html += '<div class="yoga-daily-item-info">';
            html += '<div class="yoga-daily-item-name">' + C.esc(C.nameFa(p)) + '</div>';
            html += '<div class="yoga-daily-item-sub">' + (C.DIFFICULTY_STARS[p.difficulty] || '') + ' ' + C.subFa(p.subcategory) +
                (prevPose ? ' · پس از ' + C.esc(C.nameFa(prevPose)) : ' · حرکت آغازین') + '</div>';
            html += '</div>';
            html += '<button class="yoga-daily-item-add" data-yoga-add="' + C.escAttr(name) + '" title="افزودن به جلسه تمرین">+</button>';
            html += '</div>';
        });
        html += '</div>';
    } else {
        html += '<div class="yoga-empty">امروز حرکتی پیشنهاد نشد</div>';
    }

    html += '<div class="yoga-daily-start-wrap">';
    html += '<button class="yoga-daily-start-btn" id="yogaStartPractice" data-yoga-run-flow="' + C.escAttr(JSON.stringify(flow)) + '">';
    html += '<span class="yoga-daily-start-icon">🧘</span>';
    html += '<span class="yoga-daily-start-text">شروع تمرین امروز</span>';
    html += '<span class="yoga-daily-start-sub">' + C.faNum(flow.length) + ' حرکت پیوسته با تایمر و راهنما</span>';
    html += '</button>';
    html += '</div>';
    html += '</div>';
    el.innerHTML = html;
}

// ═══════════ تب تنفس و مدیتیشن ═══════════
function renderBreathPanel() {
    var el = document.getElementById('yogaBreathPanel');
    if (!el) return;
    var html = '<div class="yoga-breath">';
    html += '<h3>🌬️ تنفس و مدیتیشن</h3>';
    html += '<p class="yoga-breath-desc">تمرینات تنفسی و مدیتیشن را انتخاب کنید و با راهنمای بصری تمرین کنید. این تمرین‌ها برای پایان جلسات یوگا ایده‌آل هستند.</p>';
    html += '<div class="yoga-breath-cards">';
    var exercises = [
        { id: 'box', name: 'تنفس بوکس', icon: '📦', desc: '۴ ثانیه دم، ۴ حبس، ۴ بازدم، ۴ حبس خالی', color: '#6c8cff' },
        { id: 'diaphragmatic', name: 'تنفس دیافراگمی', icon: '🌬️', desc: 'دم و بازدم عمیق شکمی برای آرامش', color: '#6fcf97' },
        { id: 'kapalabhati', name: 'تنفس آتش', icon: '🔥', desc: 'بازدم‌های سریع از شکم برای انرژی', color: '#f39c12' },
        { id: 'guided', name: 'مراقبه هدایت‌شده', icon: '🧘', desc: 'آرامش ذهن با راهنمای گام‌به‌گام', color: '#a29bfe' },
        { id: 'silent', name: 'مراقبه سکوت', icon: '🌌', desc: 'تمرکز بر نفس در سکوت', color: '#74b9ff' },
        { id: 'body_scan', name: 'اسکن بدن', icon: '🩷', desc: 'آگاهی از هر بخش بدن، از سر تا پا', color: '#55efc4' }
    ];
    exercises.forEach(function (ex) {
        html += '<div class="yoga-breath-card" data-exercise="' + ex.id + '">';
        html += '<div class="yoga-breath-card-icon" style="background:' + ex.color + '20;border-color:' + ex.color + '">' + ex.icon + '</div>';
        html += '<div class="yoga-breath-card-name">' + ex.name + '</div>';
        html += '<div class="yoga-breath-card-desc">' + ex.desc + '</div>';
        html += '<button class="yoga-breath-card-btn" data-yoga-exercise="' + ex.id + '">▶ شروع</button>';
        html += '</div>';
    });
    html += '</div></div>';
    el.innerHTML = html;
}

// ═══════════ رندر تب‌ها ═══════════
function renderTabs() {
    document.querySelectorAll('.yoga-tab').forEach(function (t) {
        t.classList.toggle('active', t.dataset.tab === _activeTab);
    });
    var map = {
        library: { wrap: 'yogaGridWrap', filters: true },
        daily: { wrap: 'yogaDailyPanel' },
        breath: { wrap: 'yogaBreathPanel' },
        practice: { wrap: 'yogaPracticePanel' }
    };
    var cfg = map[_activeTab] || map.library;
    var detailShow = !!activeDetailPose;
    var ids = ['yogaGridWrap', 'yogaDailyPanel', 'yogaBreathPanel', 'yogaPracticePanel', 'yogaDetail'];
    ids.forEach(function (id) {
        var el = document.getElementById(id);
        if (!el) return;
        if (detailShow) { el.style.display = id === 'yogaDetail' ? 'block' : 'none'; return; }
        el.style.display = (id === cfg.wrap) ? '' : 'none';
    });
    var f = document.getElementById('yogaFilters');
    if (f) f.style.display = (cfg.filters && !detailShow) ? '' : 'none';

    if (_activeTab === 'library') applyFilters();
    if (_activeTab === 'daily') renderDailyPanel();
    if (_activeTab === 'breath') renderBreathPanel();
    if (_activeTab === 'practice') {
        if (window.YogaPractice) window.YogaPractice.init();
    }
}

function switchTab(tab) {
    _activeTab = tab;
    activeDetailPose = null;
    var detail = document.getElementById('yogaDetail');
    if (detail) detail.style.display = 'none';
    // renderTabs خودش پنل تب تمرین را نمایش می‌دهد و در صورت نیاز YogaPractice را مقداردهی می‌کند
    renderTabs();
}

function showLibrary() {
    switchTab('library');
}

// ─── رویدادهای سراسری (delegation) ───
function bindPageEvents() {
    if (_eventsBound) return;
    _eventsBound = true;
    var page = document.getElementById('pageYoga');
    if (!page) return;
    page.addEventListener('click', function (e) {
        var target = e.target;

        // باز کردن جزئیات (کارت/آیتم رابطه)
        var openEl = target.closest('[data-yoga-open]');
        if (openEl && !target.closest('button')) {
            openDetail(openEl.getAttribute('data-yoga-open'));
            return;
        }
        // ارجاع داخل توضیحات
        var refEl = target.closest('[data-yoga-ref]');
        if (refEl) { openDetail(refEl.getAttribute('data-yoga-ref')); return; }
        // بازگشت از جزئیات
        if (target.closest('[data-yoga-back]')) { closeDetail(); return; }
        // تغییر سمت
        var sideBtn = target.closest('[data-yoga-side]');
        if (sideBtn) {
            var s = sideBtn.getAttribute('data-yoga-side');
            if (activeDetailPose && C.sideAvailable(activeDetailPose.name, s)) {
                activeDetailSide = s;
                var img = document.getElementById('yogaDetail').querySelector('img.yoga-detail-img');
                if (img) {
                    img.src = C.getImage(activeDetailPose, { size: 'full', side: s });
                    img.setAttribute('data-fb', C.placeholderSvg(activeDetailPose, 460));
                }
                var btns = document.getElementById('yogaDetail').querySelectorAll('[data-yoga-side]');
                btns.forEach(function (b) {
                    b.classList.toggle('active', b.getAttribute('data-yoga-side') === s);
                    var label = b.getAttribute('data-yoga-side') === 'R' ? 'سمت راست' : 'سمت چپ';
                    b.textContent = (b.getAttribute('data-yoga-side') === s ? '✓ ' : '') + label;
                });
            }
            return;
        }
        // علاقه‌مندی
        var favEl = target.closest('[data-yoga-fav]');
        if (favEl) {
            var fname = favEl.getAttribute('data-yoga-fav');
            C.toggleFav(fname);
            var isNowFav = C.isFav(fname);
            favEl.classList.toggle('active', isNowFav);
            favEl.textContent = isNowFav ? '♥ از علاقه‌مندی‌ها حذف شد' : '♡ افزودن به علاقه‌مندی‌ها';
            var gridBtn = document.querySelector('.yoga-card-fav[data-yoga-fav="' + C.escAttr(fname) + '"]');
            if (gridBtn) {
                gridBtn.classList.toggle('active', isNowFav);
                gridBtn.textContent = isNowFav ? '♥' : '♡';
            }
            return;
        }
        // افزودن به جلسه
        var addEl = target.closest('[data-yoga-add]');
        if (addEl) {
            var aname = addEl.getAttribute('data-yoga-add');
            var sess = C.getSession();
            if (sess.indexOf(aname) >= 0) {
                C.removeFromSession(aname);
                addEl.textContent = '+ افزودن به جلسه تمرین';
                if (addEl.classList.contains('yoga-daily-item-add')) addEl.textContent = '+';
            } else {
                C.addToSession(aname);
                addEl.textContent = '✓ در جلسه تمرین';
                if (addEl.classList.contains('yoga-daily-item-add')) addEl.textContent = '✓';
            }
            return;
        }
        // شروع تمرین از حرکت (جریان هوشمند)
        var flowBtn = target.closest('[data-yoga-flow]');
        if (flowBtn) {
            var root = flowBtn.getAttribute('data-yoga-flow');
            var names = C.buildFlow(root, 8);
            if (names.length) launchPractice(names, root);
            return;
        }
        // اجرای جریان روزانه
        var runFlow = target.closest('[data-yoga-run-flow]');
        if (runFlow) {
            var flowNames = [];
            try { flowNames = JSON.parse(runFlow.getAttribute('data-yoga-run-flow')); } catch (err) {}
            if (flowNames && flowNames.length) launchPractice(flowNames, null);
            return;
        }
        // تمرین تنفسی
        var exBtn = target.closest('[data-yoga-exercise]');
        if (exBtn) {
            var ex = exBtn.getAttribute('data-yoga-exercise');
            if (window.YogaEngine) {
                var isMed = ex === 'guided' || ex === 'silent' || ex === 'body_scan';
                window.YogaEngine.openPanel(isMed ? 'meditation' : 'breathing');
                window.YogaEngine.setExercise(ex);
            }
            return;
        }
        // تب‌های یوگا
        var tabBtn = target.closest('.yoga-tab');
        if (tabBtn) { switchTab(tabBtn.dataset.tab); return; }
    });
}

function launchPractice(names, rootName) {
    if (!names || !names.length) return;
    _activeTab = 'practice';
    activeDetailPose = null;
    document.getElementById('yogaDetail').style.display = 'none';
    if (window.YogaPractice) {
        window.YogaPractice.launch(names);
    }
    renderTabs();
}

// ─── بارگذاری داده ───
function onData() {
    allPoses = C.getPoses();
    poseMap = C.getPoseMap();
    _dataLoaded = true;
    renderFilters();
    renderTabs();
    var hash = window.location.hash || '';
    var match = hash.match(/^#yoga\/pose\/([^&?]+)/);
    if (match && poseMap[decodeURIComponent(match[1])]) {
        openDetail(decodeURIComponent(match[1]));
    }
    notifyTest();
}

// ─── راه‌اندازی ───
function init() {
    bindPageEvents();
    if (!_inited) {
        _inited = true;
        window.addEventListener('hashchange', function () {
            var hash = window.location.hash || '';
            var match = hash.match(/^#yoga\/pose\/([^&?]+)/);
            if (match && poseMap[decodeURIComponent(match[1])]) {
                openDetail(decodeURIComponent(match[1]));
            }
        });
    }
    if (!_dataLoaded) {
        C.load().then(onData, function (e) {
            console.error('Yoga data load failed:', e);
            var grid = document.getElementById('yogaPosesGrid');
            if (grid) grid.innerHTML = '<div class="yoga-empty">خطا در بارگذاری داده یوگا — صفحه را مجدداً باز کنید</div>';
        });
        return;
    }
    // Already loaded: refresh current tab content
    if (activeDetailPose) renderDetail(activeDetailPose);
    else if (_activeTab === 'library') renderFilters();
    renderTabs();
    notifyTest();
}

// اطلاعرسانی به ماژول تست تشخیص تمرین (نوار وضعیت + باز شدن خودکار در اولین بازدید)
function notifyTest() {
    if (window.YogaTest && window.YogaTest.onYogaOpened) {
        try { window.YogaTest.onYogaOpened(); } catch (e) {}
    }
}

// ─── API عمومی ───
window.YogaLibrary = {
    init: init,
    showLibrary: showLibrary,
    openDetail: openDetail,
    closeDetail: closeDetail,
    switchTab: switchTab,
    refreshTabs: renderTabs,
    setTab: function (t) { switchTab(t); }
};
})();
