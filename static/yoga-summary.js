// ================================================================
//   YOGA SUMMARY — خلاصه وضعیت یوگا در نوار بالا
//   Practice stats, today's recommendation, progress, quick-start
// ================================================================

var YogaSummary = (function () {
'use strict';

var STORAGE_KEY = 'yoga_practice_log';
var WEEKLY_GOAL = 7; // sessions per week
var dom = {};
var isOpen = false;

// ─── Stats Storage ───
function getLog() {
    try {
        var raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : { sessions: [], totalMinutes: 0 };
    } catch (e) {
        return { sessions: [], totalMinutes: 0 };
    }
}

function saveLog(log) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(log)); } catch (e) {}
}

function recordSession(type, durationMinutes) {
    var log = getLog();
    log.sessions.push({
        type: type,
        date: new Date().toISOString(),
        duration: durationMinutes
    });
    log.totalMinutes = (log.totalMinutes || 0) + durationMinutes;
    saveLog(log);
    if (dom.panel && isOpen) render();
    celebrateCompletion();
}

function celebrateCompletion() {
    if (!dom.panel) return;
    dom.panel.classList.add('ys-celebration');
    setTimeout(function() { dom.panel.classList.remove('ys-celebration'); }, 1600);
    // Confetti particles
    var emojis = ['🎉', '✨', '🌟', '💫', '⭐', '🎊', '🪷', '🧘'];
    for (var i = 0; i < 10; i++) {
        (function(idx) {
            setTimeout(function() {
                var p = document.createElement('span');
                p.className = 'ys-confetti-particle';
                p.textContent = emojis[idx % emojis.length];
                p.style.left = (10 + Math.random() * 80) + '%';
                p.style.top = (30 + Math.random() * 40) + '%';
                p.style.animationDuration = (0.6 + Math.random() * 0.8) + 's';
                dom.panel.appendChild(p);
                setTimeout(function() { p.remove(); }, 1500);
            }, idx * 80);
        })(i);
    }
    // Show toast
    if (window.showToast) showToast('🎉 تمرین با موفقیت ثبت شد!', 'success');
}

// ─── Stats Calculation ───
function getThisWeekSessions() {
    var log = getLog();
    var now = new Date();
    var startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
    startOfWeek.setHours(0, 0, 0, 0);
    return log.sessions.filter(function (s) {
        /* جلسات نیمه‌کاره (partial) در شمارش هفتگی جلسه حساب نمی‌شوند */
        return s.partial !== true && new Date(s.date) >= startOfWeek;
    });
}

function getStreak() {
    var log = getLog();
    if (log.sessions.length === 0) return 0;
    var dates = {};
    log.sessions.forEach(function (s) {
        /* نیمه‌کاره‌ها روز استریک نمی‌سازند — اما اگر همان روز جلسه کامل هم هست، روز شمرده می‌شود */
        if (s.partial === true) return;
        var d = new Date(s.date);
        var key = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
        dates[key] = true;
    });
    var streak = 0;
    var check = new Date();
    check.setHours(0, 0, 0, 0);
    // Check if practiced today
    var todayKey = check.getFullYear() + '-' + (check.getMonth() + 1) + '-' + check.getDate();
    if (!dates[todayKey]) {
        // Check yesterday
        check.setDate(check.getDate() - 1);
        var yKey = check.getFullYear() + '-' + (check.getMonth() + 1) + '-' + check.getDate();
        if (!dates[yKey]) return 0;
    }
    // Count consecutive days
    check = new Date();
    check.setHours(0, 0, 0, 0);
    while (true) {
        var key = check.getFullYear() + '-' + (check.getMonth() + 1) + '-' + check.getDate();
        if (dates[key]) {
            streak++;
            check.setDate(check.getDate() - 1);
        } else {
            break;
        }
    }
    return streak;
}

function getProgress() {
    var weekSessions = getThisWeekSessions();
    return Math.min(100, Math.round((weekSessions.length / WEEKLY_GOAL) * 100));
}

function getTodayMinutes() {
    var log = getLog();
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var total = 0;
    log.sessions.forEach(function (s) {
        var d = new Date(s.date);
        if (d >= today) total += s.duration || 0;
    });
    return total;
}

// ─── Today's Recommendation ───
var RECOMMENDATIONS = [
    { day: 0, type: 'meditation', name: 'مراقبه هدایت‌شده', icon: '🧘', desc: 'روز استراحت — مراقبه آرام برای بازیابی انرژی', panel: 'meditation', exercise: 'guided' },
    { day: 1, type: 'breathing', name: 'تنفس بوکس', icon: '📦', desc: 'شروع هفته با تمرکز و انرژی', panel: 'breathing', exercise: 'box' },
    { day: 2, type: 'yoga', name: 'حرکات آسانا', icon: '🧘‍♂️', desc: 'روز تقویت بدن با حرکات یوگا', panel: 'yoga', exercise: '' },
    { day: 3, type: 'breathing', name: 'تنفس آتش', icon: '🔥', desc: 'نیمه هفته — افزایش انرژی با کاپالابهاتی', panel: 'breathing', exercise: 'kapalabhati' },
    { day: 4, type: 'meditation', name: 'اسکن بدن', icon: '🩷', desc: 'آرامش عمیق با اسکن بدن', panel: 'meditation', exercise: 'body_scan' },
    { day: 5, type: 'breathing', name: 'تنفس دیافراگمی', icon: '🌬️', desc: 'آماده شدن برای آخر هفته', panel: 'breathing', exercise: 'diaphragmatic' },
    { day: 6, type: 'meditation', name: 'سکوت و تمرکز', icon: '🌙', desc: 'روز سکوت — تأمل و بازیابی', panel: 'meditation', exercise: 'silent' }
];

function getTodayRecommendation() {
    var day = new Date().getDay();
    return RECOMMENDATIONS[day];
}

// ─── Render Dropdown ───
function classicStats() {
    /* classic-studio (Pocket Yoga rebuild) karma + sessions + minutes
       جلسه = فقط تمرین‌های کامل‌شده؛ دقیقه = کل زمان تمرین */
    try {
        var k = JSON.parse(localStorage.getItem('py_karma') || '0') || 0;
        var hist = JSON.parse(localStorage.getItem('py_history') || '[]') || [];
        var min = 0, sessions = 0;
        hist.forEach(function (h) {
            min += Math.round((h.seconds || 0) / 60);
            if (h.completed === undefined ? true : !!h.completed) sessions++;
        });
        return { karma: k, sessions: sessions, minutes: min };
    } catch (e) { return { karma: 0, sessions: 0, minutes: 0 }; }
}

function render() {
    if (!dom.panel) return;

    var weekSessions = getThisWeekSessions();
    /* شمارش جلسه فقط کامل‌ها؛ دقیقه کل شامل نیمه‌کاره‌ها هم هست */
    var totalSessions = getLog().sessions.filter(function (s) { return s.partial !== true; }).length;
    var totalMinutes = getLog().totalMinutes || 0;
    var streak = getStreak();
    var cs = classicStats();
    totalSessions += cs.sessions;
    totalMinutes += cs.minutes;
    var progress = getProgress();
    var todayMin = getTodayMinutes();
    var rec = getTodayRecommendation();

    var html = '';

    // Header
    html += '<div class="ys-header">';
    html += '<div class="ys-header-title">🧘 وضعیت یوگا و مدیتیشن</div>';
    html += '</div>';

    // Stats Grid
    // Build fire string: 🔥🔥🔥 grows with streak
    var fireCount = Math.min(streak, 12);
    var fireStr = '';
    var fireSize = streak >= 10 ? 'lg' : streak >= 5 ? 'md' : 'sm';
    for (var fi = 0; fi < fireCount; fi++) fireStr += '🔥';
    if (streak === 0) fireStr = '—';

    html += '<div class="ys-stats">';
    html += '<div class="ys-stat"><div class="ys-stat-num">' + totalSessions + '</div><div class="ys-stat-label">کل جلسات</div></div>';
    html += '<div class="ys-stat ys-stat-streak"><div class="ys-streak-fire ys-fire-' + fireSize + '">' + fireStr + '</div><div class="ys-stat-num">' + streak + '</div><div class="ys-stat-label">🔴 روز متوالی</div></div>';
    html += '<div class="ys-stat"><div class="ys-stat-num">' + totalMinutes + '</div><div class="ys-stat-label">دقیقه کل</div></div>';
    html += '<div class="ys-stat"><div class="ys-stat-num">' + cs.karma + '</div><div class="ys-stat-label">🪷 کارما</div></div>';
    html += '<div class="ys-stat"><div class="ys-stat-num">' + todayMin + '</div><div class="ys-stat-label">دقیقه امروز</div></div>';
    html += '</div>';

    // Weekly Progress
    html += '<div class="ys-section">';
    html += '<div class="ys-progress-header">';
    html += '<span class="ys-progress-label">پیشرفت هفتگی</span>';
    html += '<span class="ys-progress-pct">' + progress + '%</span>';
    html += '</div>';
    html += '<div class="ys-progress-bar"><div class="ys-progress-fill" style="width:' + progress + '%"></div></div>';
    html += '<div class="ys-progress-sub">' + weekSessions.length + ' از ' + WEEKLY_GOAL + ' جلسه این هفته</div>';
    html += '</div>';

    // Weekly History Row
    var dayNames = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'];
    var log = getLog();
    var today = new Date();
    var dayOfWeek = today.getDay(); // 0=Sun
    var startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);
    // Map each day of the week to session count
    var dailyCounts = [0, 0, 0, 0, 0, 0, 0];
    log.sessions.forEach(function(s) {
        var sd = new Date(s.date);
        if (sd >= startOfWeek) {
            var dow = sd.getDay();
            dailyCounts[dow]++;
        }
    });
    html += '<div class="ys-section">';
    html += '<div class="ys-weekly-row">';
    for (var di = 0; di < 7; di++) {
        var count = dailyCounts[di];
        var isToday = di === dayOfWeek;
        var cls = 'ys-weekly-day';
        if (count > 0) cls += ' ys-weekly-done';
        if (isToday) cls += ' ys-weekly-today';
        var icon = count > 0 ? '✅' : (isToday ? '📍' : '·');
        html += '<div class="' + cls + '">';
        html += '<div class="ys-weekly-icon">' + icon + '</div>';
        html += '<div class="ys-weekly-label">' + dayNames[di].substring(0, 3) + '</div>';
        if (count > 0) html += '<div class="ys-weekly-count">' + count + '</div>';
        html += '</div>';
    }
    html += '</div>';
    html += '</div>';

    html += '<div class="ys-divider"></div>';

    // Today's Recommendation
    html += '<div class="ys-section">';
    html += '<div class="ys-rec">';
    html += '<span class="ys-rec-emoji">' + rec.icon + '</span>';
    html += '<div class="ys-rec-info">';
    html += '<div class="ys-rec-label">تمرین پیشنهادی امروز</div>';
    html += '<div class="ys-rec-name">' + rec.name + '</div>';
    html += '<div class="ys-rec-desc">' + rec.desc + '</div>';
    html += '</div>';
    html += '</div>';
    html += '<button class="ys-rec-start" onclick="YogaSummary.quickStart(\'' + rec.panel + '\',\'' + rec.exercise + '\')">▶ شروع تمرین</button>';
    html += '</div>';

    html += '<div class="ys-divider"></div>';

    // Quick Links
    html += '<div class="ys-section">';
    html += '<div class="ys-links">';
    html += '<button class="ys-link" onclick="YogaSummary.quickStart(\'breathing\',\'box\')"><span class="ys-link-icon">📦</span><span class="ys-link-text">تنفس بوکس</span></button>';
    html += '<button class="ys-link" onclick="YogaSummary.quickStart(\'breathing\',\'kapalabhati\')"><span class="ys-link-icon">🔥</span><span class="ys-link-text">تنفس آتش</span></button>';
    html += '<button class="ys-link" onclick="YogaSummary.quickStart(\'meditation\',\'guided\')"><span class="ys-link-icon">🧘</span><span class="ys-link-text">مراقبه</span></button>';
    html += '<button class="ys-link" onclick="YogaSummary.quickStart(\'meditation\',\'body_scan\')"><span class="ys-link-icon">🩷</span><span class="ys-link-text">اسکن بدن</span></button>';
    html += '<button class="ys-link" onclick="YogaSummary.quickStart(\'breathing\',\'diaphragmatic\')"><span class="ys-link-icon">🌬️</span><span class="ys-link-text">تنفس عمیق</span></button>';
    html += '<button class="ys-link" onclick="YogaSummary.quickStart(\'yoga\',\'\')"><span class="ys-link-icon">🧘‍♂️</span><span class="ys-link-text">حرکات یوگا</span></button>';
    html += '</div>';
    html += '</div>';

    dom.panel.innerHTML = html;
}

// ─── Actions ───
function quickStart(panel, exercise) {
    close();
    // «یوگا» = صفحهٔ جدید یوگا (کتابخانه/جلسه/کلاسیک)؛ بقیه پنل شناور تنفس/مراقبه
    if (panel === 'yoga') {
        if (window.openService) openService('yoga');
        return;
    }
    if (window.YogaEngine) {
        YogaEngine.openPanel(panel);
        if (exercise) YogaEngine.setExercise(exercise);
    }
}

function toggle() {
    if (!dom.panel) return;
    isOpen = !isOpen;
    dom.panel.classList.toggle('open', isOpen);
    if (isOpen) render();
}

function close() {
    if (isOpen) { isOpen = false; dom.panel.classList.remove('open'); }
}

function init() {
    dom.btn = document.getElementById('yogaEngineToggle');
    dom.panel = document.getElementById('yogaSummaryPanel');

    if (dom.btn) {
        dom.btn.addEventListener('click', function (e) {
            e.stopPropagation();
            toggle();
        });
    }

    document.addEventListener('click', function (e) {
        if (isOpen && dom.panel && !dom.panel.contains(e.target) && dom.btn && !dom.btn.contains(e.target)) {
            close();
        }
    });

    if (dom.panel) render();
}

return { init: init, toggle: toggle, close: close, refresh: render, recordSession: recordSession, quickStart: quickStart };
})();
