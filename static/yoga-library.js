// ================================================================
//  YOGA POSE LIBRARY v2 — کتابخانه جامع حرکات یوگا
//  سه تب: کتابخانه · تمرین روزانه · تنفس و مدیتیشن
// ================================================================
(function () {
'use strict';

// ─── ترجمه‌ها ───
var CATEGORY_FA = {
    'standing': 'ایستاده', 'seated': 'نشسته', 'supine': 'خوابیده به پشت',
    'prone': 'خوابیده به شکم', 'arm_leg_support': 'تکیه بر دست و پا',
    'arm_balance_inversion': 'تعادل روی دست و وارونگی'
};
var SUBCATEGORY_FA = {
    'backbend': 'خمش به عقب', 'forward_bend': 'خمش به جلو',
    'lateral_bend': 'خمش جانبی', 'twist': 'پیچش',
    'balancing': 'تعادلی', 'neutral': 'خنثی'
};
var DIFFICULTY_FA = { 'beginner': 'مبتدی', 'intermediate': 'متوسط', 'expert': 'پیشرفته' };
var DIFFICULTY_STARS = { 'beginner': '⭐', 'intermediate': '⭐⭐', 'expert': '⭐⭐⭐' };
var DIFFICULTY_ORDER = { 'beginner': 1, 'intermediate': 2, 'expert': 3 };
var CATEGORY_ICONS = {
    'standing': '🧍', 'seated': '🪑', 'supine': '🛌',
    'prone': '🤕', 'arm_leg_support': '🤸', 'arm_balance_inversion': '🔄'
};

// ─── وضعیت ───
var allPoses = [], filteredPoses = [], poseMap = {};
var currentView = 'grid', showTertiary = false, currentSort = 'name_fa';
var currentFilters = { difficulty: [], subcategory: [], category: [], search: '' };
var _inited = false, _activeTab = 'library';
var activeDetailPose = null, activeDetailSide = 'R';
var PAGE_SIZE = 12, currentPage = 1;

// ─── Helpers: null-safe Persian text ───
function faText(pose, field) {
    return pose[field] || pose[field.replace('_fa', '')] || pose.name || '';
}

// ─── تمرین روزانه ───
var PRACTICE_KEY = 'yoga_practice';
function getPracticeData() {
    try { return JSON.parse(localStorage.getItem(PRACTICE_KEY)) || { history: [], streak: 0, totalMinutes: 0, totalSessions: 0 }; }
    catch (e) { return { history: [], streak: 0, totalMinutes: 0, totalSessions: 0 }; }
}
function savePracticeData(d) { localStorage.setItem(PRACTICE_KEY, JSON.stringify(d)); }
function todayStr() { return new Date().toISOString().split('T')[0]; }
function isPracticedToday() { return getPracticeData().history.some(function (h) { return h.date === todayStr(); }); }

// ─── علاقه‌مندی‌ها ───
function getFavs() { try { return JSON.parse(localStorage.getItem('yoga_favs')) || []; } catch (e) { return []; } }
function saveFavs(f) { localStorage.setItem('yoga_favs', JSON.stringify(f)); }
function toggleFav(name) {
    var f = getFavs(), idx = f.indexOf(name);
    if (idx >= 0) f.splice(idx, 1); else f.push(name);
    saveFavs(f); return f;
}

// ─── جلسه تمرین ───
function getSession() { try { return JSON.parse(localStorage.getItem('yoga_session')) || []; } catch (e) { return []; } }
function saveSession(s) { localStorage.setItem('yoga_session', JSON.stringify(s)); }
function addToSession(name) { var s = getSession(); if (s.indexOf(name) < 0) { s.push(name); saveSession(s); } return s; }
function removeFromSession(name) { var s = getSession(), idx = s.indexOf(name); if (idx >= 0) { s.splice(idx, 1); saveSession(s); } return s; }

// ─── پاسخ پرسشنامه ───
function getQA() { try { return JSON.parse(localStorage.getItem('yoga_questionnaire_answers')) || {}; } catch (e) { return {}; } }
function isQADone() { return localStorage.getItem('yoga_questionnaire_completed') === 'true'; }

// ─── مسیر تصاویر ───
var PREVIEW_BASE = 'static/images/yoga preview/';
var FULL_BASE = 'static/images/yoga/';

function getPreviewUrl(pose, side) {
    if (!side) side = 'R';
    var suffix = pose.two_sided ? ('_' + side) : '';
    return PREVIEW_BASE + pose.name + suffix + '-tn146.png';
}
function getFullUrl(pose, side) {
    if (!side) side = 'R';
    var suffix = pose.two_sided ? ('_' + side) : '';
    return FULL_BASE + pose.name + suffix + '.png';
}
function placeholderSvg(text) {
    var label = text || 'یوگا';
    return 'data:image/svg+xml,' + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect fill="#101a3d" width="200" height="200"/>' +
        '<text x="100" y="108" text-anchor="middle" fill="#ddc070" font-size="40">🧘</text>' +
        '<text x="100" y="140" text-anchor="middle" fill="#7889b5" font-size="11" font-family="sans-serif">' + label + '</text></svg>'
    );
}

// ─── فیلتر و مرتب‌سازی ───
function applyFilters() {
    filteredPoses = allPoses.filter(function (p) {
        if (!showTertiary && p.visibility === 'tertiary') return false;
        if (currentFilters.difficulty.length && currentFilters.difficulty.indexOf(p.difficulty) < 0) return false;
        if (currentFilters.subcategory.length && currentFilters.subcategory.indexOf(p.subcategory) < 0) return false;
        if (currentFilters.category.length && currentFilters.category.indexOf(p.category) < 0) return false;
        if (currentFilters.search) {
            var q = currentFilters.search.toLowerCase();
            var hay = ((p.name || '') + ' ' + (p.name_fa || '') + ' ' + (p.display_name || '') + ' ' + (p.display_name_fa || '')).toLowerCase();
            if (hay.indexOf(q) < 0) return false;
        }
        return true;
    });
    // مرتب‌سازی
    filteredPoses.sort(function (a, b) {
        if (currentSort === 'name_fa') return (a.display_name_fa || a.name_fa || '').localeCompare(b.display_name_fa || b.name_fa || '', 'fa');
        if (currentSort === 'difficulty') return (DIFFICULTY_ORDER[a.difficulty] || 0) - (DIFFICULTY_ORDER[b.difficulty] || 0);
        if (currentSort === 'category') return (a.category || '').localeCompare(b.category || '');
        return 0;
    });
    currentPage = 1;
    renderGrid();
    updateCount();
}

function updateCount() {
    var el = document.getElementById('yogaCount');
    if (el) el.textContent = filteredPoses.length + ' حرکت';
}

// ─── رندر فیلترها ───
function renderFilters() {
    var el = document.getElementById('yogaFilters');
    if (!el) return;
    var html = '<div class="yoga-filters-row">';
    // جستجو
    html += '<input type="text" class="yoga-filter-search" id="yogaSearch" placeholder="🔍 جستجو…" autocomplete="off">';
    // مرتب‌سازی
    html += '<select class="yoga-filter-select" id="yogaSort">';
    html += '<option value="name_fa">مرتب‌سازی: نام</option>';
    html += '<option value="difficulty">مرتب‌سازی: سطح</option>';
    html += '<option value="category">مرتب‌سازی: دسته</option>';
    html += '</select>';
    // نمای/لیست
    html += '<button class="yoga-view-btn active" data-view="grid" title="نمای گرید">▦</button>';
    html += '<button class="yoga-view-btn" data-view="list" title="نمای لیست">☰</button>';
    html += '</div>';
    // تگ‌های فیلتر
    html += '<div class="yoga-filter-tags">';
    // سختی
    html += '<div class="yoga-filter-group"><label>سطح:</label>';
    ['beginner', 'intermediate', 'expert'].forEach(function (d) {
        html += '<button class="yoga-tag" data-filter="difficulty" data-value="' + d + '">' + DIFFICULTY_STARS[d] + ' ' + DIFFICULTY_FA[d] + '</button>';
    });
    html += '</div>';
    // نوع حرکت
    html += '<div class="yoga-filter-group"><label>نوع:</label>';
    Object.keys(SUBCATEGORY_FA).forEach(function (k) {
        html += '<button class="yoga-tag" data-filter="subcategory" data-value="' + k + '">' + SUBCATEGORY_FA[k] + '</button>';
    });
    html += '</div>';
    // دسته
    html += '<div class="yoga-filter-group"><label>عضلات:</label>';
    Object.keys(CATEGORY_FA).forEach(function (k) {
        html += '<button class="yoga-tag" data-filter="category" data-value="' + k + '">' + CATEGORY_ICONS[k] + ' ' + CATEGORY_FA[k] + '</button>';
    });
    html += '</div>';
    // tertiary toggle
    html += '<label class="yoga-tertiary-toggle"><input type="checkbox" id="yogaTertiaryToggle"> نمایش حرکات پنهان</label>';
    html += '</div>';
    el.innerHTML = html;
    // رویدادها
    var searchEl = document.getElementById('yogaSearch');
    if (searchEl) searchEl.addEventListener('input', function () {
        currentFilters.search = this.value; applyFilters();
    });
    var sortEl = document.getElementById('yogaSort');
    if (sortEl) sortEl.addEventListener('change', function () {
        currentSort = this.value; applyFilters();
    });
    document.querySelectorAll('.yoga-view-btn').forEach(function (b) {
        b.addEventListener('click', function () {
            currentView = this.dataset.view;
            document.querySelectorAll('.yoga-view-btn').forEach(function (x) { x.classList.remove('active'); });
            this.classList.add('active');
            var grid = document.getElementById('yogaGridWrap');
            if (grid) grid.className = currentView === 'list' ? 'yoga-grid-wrap yoga-list-view' : 'yoga-grid-wrap';
            renderGrid();
        });
    });
    document.querySelectorAll('.yoga-tag').forEach(function (tag) {
        tag.addEventListener('click', function () {
            this.classList.toggle('active');
            var f = this.dataset.filter, v = this.dataset.value;
            var arr = currentFilters[f];
            var idx = arr.indexOf(v);
            if (idx >= 0) arr.splice(idx, 1); else arr.push(v);
            applyFilters();
        });
    });
    var tert = document.getElementById('yogaTertiaryToggle');
    if (tert) tert.addEventListener('change', function () {
        showTertiary = this.checked; applyFilters();
    });
}

// ─── رندر کارت‌ها با صفحه‌بندی ───
function renderGrid() {
    var grid = document.getElementById('yogaPosesGrid');
    if (!grid) return;
    if (!filteredPoses.length) {
        grid.innerHTML = '<div class="yoga-empty">هیچ حرکتی یافت نشد 🔍</div>';
        var pag = document.getElementById('yogaPagination');
        if (pag) pag.innerHTML = '';
        return;
    }
    // صفحه‌بندی
    var totalPages = Math.ceil(filteredPoses.length / PAGE_SIZE);
    if (currentPage > totalPages) currentPage = totalPages;
    var start = (currentPage - 1) * PAGE_SIZE;
    var pagePoses = filteredPoses.slice(start, start + PAGE_SIZE);
    var favs = getFavs();
    var html = '';
    pagePoses.forEach(function (p, i) {
        var img = getPreviewUrl(p, p.preferred_side || 'R');
        var isFav = favs.indexOf(p.name) >= 0;
        var isLocked = !canAccess(p.difficulty);
        var titleFa = p.display_name_fa || p.name_fa || p.name;
        var titleEn = p.display_name || p.name;
        var diffLabel = (DIFFICULTY_STARS[p.difficulty] || '') + ' ' + (DIFFICULTY_FA[p.difficulty] || '');
        var catLabel = (CATEGORY_ICONS[p.category] || '') + ' ' + (CATEGORY_FA[p.category] || '');
        html += '<div class="yoga-card' + (isLocked ? ' yoga-card-locked' : '') + '" data-name="' + p.name + '" style="animation-delay:' + (i * 30) + 'ms">';
        html += '<div class="yoga-card-img">';
        html += '<img src="' + img + '" alt="' + titleEn + '" loading="lazy" onerror="this.onerror=null;this.src=\'' + placeholderSvg(titleFa) + '\'">';
        if (p.two_sided) html += '<span class="yoga-card-side">↔</span>';
        if (isLocked) html += '<span class="yoga-card-lock">🔒</span>';
        html += '<button class="yoga-card-fav' + (isFav ? ' active' : '') + '" data-fav="' + p.name + '">' + (isFav ? '♥' : '♡') + '</button>';
        html += '</div>';
        html += '<div class="yoga-card-body">';
        html += '<div class="yoga-card-title">' + titleFa + '</div>';
        html += '<div class="yoga-card-sub">' + titleEn + '</div>';
        html += '<div class="yoga-card-meta">';
        html += '<span class="yoga-card-stars">' + diffLabel + '</span>';
        html += '<span class="yoga-card-cat">' + catLabel + '</span>';
        html += '</div>';
        html += '</div>';
        html += '</div>';
    });
    grid.innerHTML = html;
    // رویداد کارت‌ها
    grid.querySelectorAll('.yoga-card').forEach(function (card) {
        card.addEventListener('click', function (e) {
            if (e.target.closest('.yoga-card-fav')) return;
            openDetail(this.dataset.name);
        });
    });
    grid.querySelectorAll('.yoga-card-fav').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            var name = this.dataset.fav;
            toggleFav(name);
            this.classList.toggle('active');
            this.textContent = this.classList.contains('active') ? '♥' : '♡';
        });
    });
    renderPagination(totalPages);
}

function renderPagination(totalPages) {
    var el = document.getElementById('yogaPagination');
    if (!el) return;
    if (totalPages <= 1) { el.innerHTML = ''; return; }
    var html = '';
    html += '<button class="yoga-page-btn" data-page="prev" ' + (currentPage <= 1 ? 'disabled' : '') + '>→ قبلی</button>';
    // Show max 5 page buttons
    var startP = Math.max(1, currentPage - 2);
    var endP = Math.min(totalPages, startP + 4);
    if (endP - startP < 4) startP = Math.max(1, endP - 4);
    if (startP > 1) html += '<button class="yoga-page-btn" data-page="1">۱</button>';
    if (startP > 2) html += '<span class="yoga-page-dots">...</span>';
    for (var i = startP; i <= endP; i++) {
        html += '<button class="yoga-page-btn' + (i === currentPage ? ' active' : '') + '" data-page="' + i + '">' + i + '</button>';
    }
    if (endP < totalPages - 1) html += '<span class="yoga-page-dots">...</span>';
    if (endP < totalPages) html += '<button class="yoga-page-btn" data-page="' + totalPages + '">' + totalPages + '</button>';
    html += '<button class="yoga-page-btn" data-page="next" ' + (currentPage >= totalPages ? 'disabled' : '') + '>بعدی ←</button>';
    html += '<span class="yoga-page-info">صفحه ' + currentPage + ' از ' + totalPages + ' (' + filteredPoses.length + ' حرکت)</span>';
    el.innerHTML = html;
    el.querySelectorAll('.yoga-page-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var pg = this.dataset.page;
            if (pg === 'prev') currentPage--;
            else if (pg === 'next') currentPage++;
            else currentPage = parseInt(pg);
            renderGrid();
            document.getElementById('yogaGridWrap').scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });
}

function canAccess(diff) {
    if (diff === 'beginner') return true;
    try {
        var u = JSON.parse(localStorage.getItem('user_data'));
        var plan = (u && u.plan) || 'free';
        if (diff === 'intermediate') return plan === 'gold' || plan === 'diamond';
        if (diff === 'expert') return plan === 'diamond';
    } catch (e) {}
    return false;
}

// ─── صفحه جزئیات ───
function openDetail(name) {
    var pose = poseMap[name];
    if (!pose) return;
    activeDetailPose = pose;
    activeDetailSide = pose.preferred_side || 'R';
    document.getElementById('yogaGridWrap').style.display = 'none';
    document.getElementById('yogaFilters').style.display = 'none';
    document.getElementById('yogaDailyPanel').style.display = 'none';
    document.getElementById('yogaBreathPanel').style.display = 'none';
    var detail = document.getElementById('yogaDetail');
    detail.style.display = 'block';
    renderDetail(pose);
    // Update URL hash for sharing
    try { history.replaceState(null, '', '#yoga/pose/' + encodeURIComponent(name)); } catch (_) {}
}
function closeDetail() {
    activeDetailPose = null;
    document.getElementById('yogaDetail').style.display = 'none';
    document.getElementById('yogaGridWrap').style.display = '';
    document.getElementById('yogaFilters').style.display = '';
    if (_activeTab === 'daily') {
        document.getElementById('yogaGridWrap').style.display = 'none';
        document.getElementById('yogaFilters').style.display = 'none';
        document.getElementById('yogaDailyPanel').style.display = 'block';
    }
    if (_activeTab === 'breath') {
        document.getElementById('yogaGridWrap').style.display = 'none';
        document.getElementById('yogaFilters').style.display = 'none';
        document.getElementById('yogaBreathPanel').style.display = 'block';
    }
    // Clear pose hash
    try { history.replaceState(null, '', window.location.pathname + window.location.search); } catch (_) {}
}

function renderDetail(pose) {
    var el = document.getElementById('yogaDetail');
    if (!el) return;
    var img = getFullUrl(pose, activeDetailSide);
    var html = '';
    // دکمه بازگشت
    html += '<button class="yoga-detail-back" id="yogaDetailBack">← بازگشت به کتابخانه</button>';
    html += '<div class="yoga-detail">';
    // تصویر + تغییر سمت
    html += '<div class="yoga-detail-img-wrap">';
    html += '<img class="yoga-detail-img" id="yogaDetailImg" src="' + img + '" alt="' + (pose.display_name || pose.name) + '" onerror="this.onerror=null;this.src=\'' + placeholderSvg(pose.display_name_fa || '') + '\'">';
    if (pose.two_sided) {
        html += '<div class="yoga-detail-side-toggle">';
        html += '<button class="yoga-side-btn' + (activeDetailSide === 'R' ? ' active' : '') + '" data-side="R">سمت راست</button>';
        html += '<button class="yoga-side-btn' + (activeDetailSide === 'L' ? ' active' : '') + '" data-side="L">سمت چپ</button>';
        html += '</div>';
    }
    html += '</div>';
    // اطلاعات
    html += '<div class="yoga-detail-info">';
    html += '<h2 class="yoga-detail-name-fa">' + (pose.display_name_fa || pose.name_fa || pose.name) + '</h2>';
    html += '<div class="yoga-detail-name-en">' + (pose.display_name || pose.name) + '</div>';
    // سانسکریت
    if (pose.sanskrit_names && pose.sanskrit_names.length) {
        pose.sanskrit_names.forEach(function (s) {
            html += '<div class="yoga-detail-sanskrit">';
            html += '<span class="yoga-sanskrit-latin">' + s.latin + '</span>';
            if (s.transliteration_fa) html += '<span class="yoga-sanskrit-fa"> (' + s.transliteration_fa + ')</span>';
            if (s.translation_fa) html += '<span class="yoga-sanskrit-trans"> — ' + s.translation_fa + '</span>';
            html += '</div>';
        });
    }
    // تگ‌ها
    html += '<div class="yoga-detail-tags">';
    html += '<span class="yoga-tag-static">' + DIFFICULTY_STARS[pose.difficulty] + ' ' + DIFFICULTY_FA[pose.difficulty] + '</span>';
    html += '<span class="yoga-tag-static">' + (CATEGORY_ICONS[pose.category] || '') + ' ' + (CATEGORY_FA[pose.category] || '') + '</span>';
    html += '<span class="yoga-tag-static">' + (SUBCATEGORY_FA[pose.subcategory] || pose.subcategory || '') + '</span>';
    if (pose.two_sided) html += '<span class="yoga-tag-static">↔ دوطرفه</span>';
    html += '</div>';
    // توضیحات (fallback to English if Persian missing)
    var descFa = pose.description_fa || pose.description || '';
    if (descFa) {
        html += '<div class="yoga-detail-section"><h3>توضیحات</h3><p>' + descFa + '</p></div>';
    }
    // مزایا (fallback to English if Persian missing)
    var benefitsFa = pose.benefits_fa || pose.benefits || '';
    if (benefitsFa) {
        html += '<div class="yoga-detail-section"><h3>مزایا</h3><p>' + benefitsFa + '</p></div>';
    }
    // مسیر پیشرفت
    html += renderProgression(pose);
    // دکمه تمرین تنفس
    html += '<button class="yoga-detail-breath-btn" onclick="document.querySelector(\'[data-nav=yoga]\').click();setTimeout(function(){if(window.YogaEngine)window.YogaEngine.openPanel(\'breathing\')},300);">🌬️ تمرین تنفس مرتبط</button>';
    html += '</div>'; // yoga-detail-info
    html += '</div>'; // yoga-detail
    el.innerHTML = html;
    // رویدادها
    document.getElementById('yogaDetailBack').addEventListener('click', closeDetail);
    el.querySelectorAll('.yoga-side-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            activeDetailSide = this.dataset.side;
            var imgEl = document.getElementById('yogaDetailImg');
            if (imgEl) imgEl.src = getFullUrl(pose, activeDetailSide);
            el.querySelectorAll('.yoga-side-btn').forEach(function (b) { b.classList.remove('active'); });
            this.classList.add('active');
        });
    });
}

function renderProgression(pose) {
    var prev = null, next = null;
    // Find first valid previous pose (dedup + broken ref filter)
    if (pose.previous_poses && pose.previous_poses.length) {
        var seen = {};
        for (var i = 0; i < pose.previous_poses.length; i++) {
            var pn = pose.previous_poses[i];
            if (!seen[pn] && poseMap[pn]) { prev = poseMap[pn]; break; }
            seen[pn] = true;
        }
    }
    // Find first valid next pose (dedup + broken ref filter)
    if (pose.next_poses && pose.next_poses.length) {
        var seen2 = {};
        for (var j = 0; j < pose.next_poses.length; j++) {
            var nn = pose.next_poses[j];
            if (!seen2[nn] && poseMap[nn]) { next = poseMap[nn]; break; }
            seen2[nn] = true;
        }
    }
    if (!prev && !next) return '';
    var html = '<div class="yoga-progression"><h3>📍 مسیر پیشرفت</h3><div class="yoga-progression-path">';
    if (prev) {
        html += '<div class="yoga-prog-item" data-name="' + prev.name + '">';
        html += '<div class="yoga-prog-img"><img src="' + getPreviewUrl(prev) + '" onerror="this.src=\'' + placeholderSvg('') + '\'"></div>';
        html += '<div class="yoga-prog-label">' + (prev.display_name_fa || prev.name) + '</div>';
        html += '<div class="yoga-prog-sub">حرکت قبلی</div>';
        html += '</div>';
        html += '<div class="yoga-prog-arrow">→</div>';
    }
    html += '<div class="yoga-prog-item current">';
    html += '<div class="yoga-prog-img"><img src="' + getPreviewUrl(pose) + '" onerror="this.src=\'' + placeholderSvg('') + '\'"></div>';
    html += '<div class="yoga-prog-label">' + (pose.display_name_fa || pose.name) + '</div>';
    html += '<div class="yoga-prog-sub">حرکت فعلی</div>';
    html += '</div>';
    if (next) {
        html += '<div class="yoga-prog-arrow">→</div>';
        html += '<div class="yoga-prog-item" data-name="' + next.name + '">';
        html += '<div class="yoga-prog-img"><img src="' + getPreviewUrl(next) + '" onerror="this.src=\'' + placeholderSvg('') + '\'"></div>';
        html += '<div class="yoga-prog-label">' + (next.display_name_fa || next.name) + '</div>';
        html += '<div class="yoga-prog-sub">حرکت بعدی</div>';
        html += '</div>';
    }
    html += '</div></div>';
    return html;
}

// ─── تب تمرین روزانه ───
function renderDailyPanel() {
    var el = document.getElementById('yogaDailyPanel');
    if (!el) return;
    var qa = getQA();
    var exp = qa.step_1 && qa.step_1[0] ? qa.step_1[0] : 'beginner';
    var practice = getPracticeData();
    var html = '<div class="yoga-daily">';
    // آمار
    html += '<div class="yoga-daily-stats">';
    html += '<div class="yoga-stat"><div class="yoga-stat-num">' + practice.streak + '</div><div class="yoga-stat-label">🔥 روز متوالی</div></div>';
    html += '<div class="yoga-stat"><div class="yoga-stat-num">' + practice.totalSessions + '</div><div class="yoga-stat-label">🧘 جلسه</div></div>';
    html += '<div class="yoga-stat"><div class="yoga-stat-num">' + practice.totalMinutes + '</div><div class="yoga-stat-label">⏱ دقیقه</div></div>';
    html += '<div class="yoga-stat"><div class="yoga-stat-num">' + getFavs().length + '</div><div class="yoga-stat-label">♥ علاقه‌مندی</div></div>';
    html += '</div>';
    // وضعیت امروز
    html += '<div class="yoga-daily-status">';
    html += isPracticedToday() ? '<span class="yoga-daily-done">✅ امروز تمرین کردید!</span>' : '<span class="yoga-daily-pending">⏳ هنوز تمرین نکردید</span>';
    html += '</div>';
    // حرکات پیشنهادی
    html += '<h3>🌟 حرکات پیشنهادی امروز</h3>';
    var recs = getRecommendations(exp);
    if (recs.length) {
        html += '<div class="yoga-daily-list">';
        recs.forEach(function (p) {
            html += '<div class="yoga-daily-item" data-name="' + p.name + '">';
            html += '<img class="yoga-daily-item-img" src="' + getPreviewUrl(p) + '" onerror="this.src=\'' + placeholderSvg('') + '\'">';
            html += '<div class="yoga-daily-item-info">';
            html += '<div class="yoga-daily-item-name">' + (p.display_name_fa || p.name) + '</div>';
            html += '<div class="yoga-daily-item-sub">' + DIFFICULTY_STARS[p.difficulty] + ' ' + (SUBCATEGORY_FA[p.subcategory] || '') + '</div>';
            html += '</div>';
            html += '<button class="yoga-daily-item-add" data-add="' + p.name + '">+</button>';
            html += '</div>';
        });
        html += '</div>';
    } else {
        html += '<div class="yoga-empty">حرکتی یافت نشد</div>';
    }
    html += '</div>';
    // دکمه شروع تمرین
    html += '<div style="text-align:center;margin-top:20px;">';
    html += '<button class="btn-primary" id="yogaStartPractice" style="padding:12px 32px;font-size:15px;">🧘 شروع تمرین</button>';
    html += '</div>';
    html += '</div>';
    el.innerHTML = html;
    // رویدادها
    el.querySelectorAll('.yoga-daily-item').forEach(function (item) {
        item.addEventListener('click', function (e) {
            if (e.target.closest('.yoga-daily-item-add')) return;
            openDetail(this.dataset.name);
        });
    });
    el.querySelectorAll('.yoga-daily-item-add').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            addToSession(this.dataset.add);
            this.textContent = '✓';
            this.disabled = true;
        });
    });
    // شروع تمرین
    var startBtn = document.getElementById('yogaStartPractice');
    if (startBtn) {
        startBtn.addEventListener('click', function () {
            // رفتن به تب تمرین پیشرفته
            _activeTab = 'practice';
            document.querySelectorAll('.yoga-tab').forEach(function(t) {
                t.classList.toggle('active', t.dataset.tab === 'practice');
            });
            document.getElementById('yogaGridWrap').style.display = 'none';
            document.getElementById('yogaFilters').style.display = 'none';
            document.getElementById('yogaDailyPanel').style.display = 'none';
            document.getElementById('yogaBreathPanel').style.display = 'none';
            document.getElementById('yogaPracticePanel').style.display = '';
            document.getElementById('yogaDetail').style.display = 'none';
            if (window.YogaPractice) window.YogaPractice.init();
        });
    }
}

function getRecommendations(expLevel) {
    var qa = getQA();
    var focus = qa.step_3 || [];
    // فیلتر بر اساس سطح تجربه
    var maxDiff = 'beginner';
    if (expLevel === 'intermediate' || expLevel === 'advanced') maxDiff = 'intermediate';
    if (expLevel === 'advanced' || expLevel === 'mentor') maxDiff = 'expert';
    var result = allPoses.filter(function (p) {
        if (p.visibility === 'tertiary') return false;
        if (DIFFICULTY_ORDER[p.difficulty] > DIFFICULTY_ORDER[maxDiff]) return false;
        return true;
    });
    // انتخاب تصادفی ۶ تا
    result.sort(function () { return Math.random() - 0.5; });
    return result.slice(0, 6);
}

// ─── تب تنفس و مدیتیشن ───
function renderBreathPanel() {
    var el = document.getElementById('yogaBreathPanel');
    if (!el) return;
    var html = '<div class="yoga-breath">';
    html += '<h3>🌬️ تنفس و مدیتیشن</h3>';
    html += '<p class="yoga-breath-desc">تمرینات تنفسی و مدیتیشن را انتخاب کنید و با راهنمای بصری تمرین کنید.</p>';
    html += '<div class="yoga-breath-cards">';
    var exercises = [
        { id: 'box', name: 'تنفس بوکس', icon: '📦', desc: '۴ ثانیه دم، ۴ حبس، ۴ بازدم، ۴ حبس خالی', color: '#6c8cff' },
        { id: 'diaphragmatic', name: 'تنفس دیافراگمی', icon: '🌬️', desc: '۴ ثانیه دم، ۴ حبس، ۴ بازدم', color: '#6fcf97' },
        { id: 'kapalabhati', name: 'تنفس آتش', icon: '🔥', desc: 'بازدم‌های سریع از شکم', color: '#f39c12' },
        { id: 'guided', name: 'مراقبه هدایت‌شده', icon: '🧘', desc: 'آرامش ذهن با راهنمای صوتی', color: '#a29bfe' },
        { id: 'silent', name: 'مراقبه سکوت', icon: '🌌', desc: 'تمرکز بر نفس در سکوت', color: '#74b9ff' },
        { id: 'body_scan', name: 'اسکن بدن', icon: '🫁', desc: 'آگاهی از هر بخش بدن', color: '#55efc4' }
    ];
    exercises.forEach(function (ex) {
        html += '<div class="yoga-breath-card" data-exercise="' + ex.id + '">';
        html += '<div class="yoga-breath-card-icon" style="background:' + ex.color + '20;border-color:' + ex.color + '">' + ex.icon + '</div>';
        html += '<div class="yoga-breath-card-name">' + ex.name + '</div>';
        html += '<div class="yoga-breath-card-desc">' + ex.desc + '</div>';
        html += '<button class="yoga-breath-card-btn" data-exercise="' + ex.id + '">▶ شروع</button>';
        html += '</div>';
    });
    html += '</div></div>';
    el.innerHTML = html;
    // رویدادها
    el.querySelectorAll('.yoga-breath-card-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            if (window.YogaEngine) {
                window.YogaEngine.openPanel(this.dataset.exercise === 'guided' || this.dataset.exercise === 'silent' || this.dataset.exercise === 'body_scan' ? 'meditation' : 'breathing');
                window.YogaEngine.setExercise(this.dataset.exercise);
            }
        });
    });
}

// ─── رندر تب‌ها ───
function renderTabs() {
    // هایلایت تب فعال
    document.querySelectorAll('.yoga-tab').forEach(function (t) {
        t.classList.toggle('active', t.dataset.tab === _activeTab);
    });
    // نمایش/مخفی پنل‌ها
    var show = { library: 'yogaGridWrap', daily: 'yogaDailyPanel', breath: 'yogaBreathPanel', practice: 'yogaPracticePanel' };
    var filterShow = _activeTab === 'library';
    var detailShow = activeDetailPose ? true : false;
    Object.keys(show).forEach(function (k) {
        var el = document.getElementById(show[k]);
        if (el) el.style.display = (k === _activeTab && !detailShow) ? '' : 'none';
    });
    var filterEl = document.getElementById('yogaFilters');
    if (filterEl) filterEl.style.display = filterShow && !detailShow ? '' : 'none';
    // رندر محتوای تب
    if (_activeTab === 'library') { applyFilters(); }
    if (_activeTab === 'daily') renderDailyPanel();
    if (_activeTab === 'breath') renderBreathPanel();
    if (_activeTab === 'practice') {
        if (window.YogaPractice) window.YogaPractice.init();
    }
}

// ─── بارگذاری داده ───
function loadData(callback) {
    fetch('static/yoga.txt')
        .then(function (r) { return r.text(); })
        .then(function (txt) {
            try {
                allPoses = JSON.parse(txt);
                // ساخت poseMap
                poseMap = {};
                allPoses.forEach(function (p) { poseMap[p.name] = p; });
                callback();
            } catch (e) {
                console.error('Yoga JSON parse error:', e);
                callback();
            }
        })
        .catch(function (e) {
            console.error('Yoga fetch error:', e);
            callback();
        });
}

// ─── راه‌اندازی ───
function init() {
    if (_inited) { renderTabs(); return; }
    _inited = true;
    // رویداد تب‌ها
    document.querySelectorAll('.yoga-tab').forEach(function (t) {
        t.addEventListener('click', function () {
            _activeTab = this.dataset.tab;
            activeDetailPose = null;
            document.getElementById('yogaDetail').style.display = 'none';
            renderTabs();
        });
    });
    // Hash routing: #yoga/pose/[name]
    window.addEventListener('hashchange', function () {
        var hash = window.location.hash || '';
        var match = hash.match(/^#yoga\/pose\/([^&?]+)/);
        if (match && poseMap[decodeURIComponent(match[1])]) {
            openDetail(decodeURIComponent(match[1]));
        }
    });
    // بارگذاری داده
    loadData(function () {
        renderFilters();
        renderTabs();
        // Check initial hash for pose routing
        var hash = window.location.hash || '';
        var match = hash.match(/^#yoga\/pose\/([^&?]+)/);
        if (match && poseMap[decodeURIComponent(match[1])]) {
            openDetail(decodeURIComponent(match[1]));
        }
    });
}

// ─── API عمومی ───
window.YogaLibrary = { init: init };
})();
