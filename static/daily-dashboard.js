// ================================================================
//  DAILY DASHBOARD — پنل روزانه جامع
//  حیوان سال · بیوریتم · تاروت · یوگا · پیام روزانه · تم · یادآوری · تقویم شمسی
// ================================================================

var DailyDashboard = (function () {
'use strict';

// ─── دیتابیس حیوانات چینی ───
var ZODIAC = {
    'موش': { emoji: '🐭', element: 'آب', personality: 'باهوش و جذاب', yogaPose: 'Balasana', yogaName: 'پوزیشن کودک', yogaDesc: 'آرامش ذهن', elementColor: '#5b8dee' },
    'گاو': { emoji: '🐮', element: 'خاک', personality: 'صبور و سخت‌کوش', yogaPose: 'Tadasana', yogaName: 'پوزیشن کوه', yogaDesc: 'ثبات و تمرکز', elementColor: '#a88832' },
    'ببر': { emoji: '🐯', element: 'چوب', personality: 'شجاع و پرانرژی', yogaPose: 'Virabhadrasana II', yogaName: 'جنگجو II', yogaDesc: 'قدرت و تعادل', elementColor: '#27ae60' },
    'خرگوش': { emoji: '🐰', element: 'چوب', personality: 'آرام و هنرمند', yogaPose: 'Sasangasana', yogaName: 'پوزیشن خرگوش', yogaDesc: 'کشش ستون فقرات', elementColor: '#27ae60' },
    'اژدها': { emoji: '🐲', element: 'آتش', personality: 'قوی و خوش‌شانس', yogaPose: 'Dragon Pose', yogaName: 'پوزیشن اژدها', yogaDesc: 'باز کردن لگن', elementColor: '#e74c3c' },
    'مار': { emoji: '🐍', element: 'آتش', personality: 'خردمند و مرموز', yogaPose: 'Bhujangasana', yogaName: 'پوزیشن کبرا', yogaDesc: 'باز کردن قفسه سینه', elementColor: '#e74c3c' },
    'اسب': { emoji: '🐴', element: 'آتش', personality: 'مستقل و اجتماعی', yogaPose: 'Vatayanasana', yogaName: 'پوزیشن سوارکار', yogaDesc: 'تعادل و قدرت', elementColor: '#e74c3c' },
    'بز': { emoji: '🐐', element: 'خاک', personality: 'هنرمند و مهربان', yogaPose: 'Bhekasana', yogaName: 'پوزیشن بز', yogaDesc: 'باز کردن مفاصل ران', elementColor: '#a88832' },
    'میمون': { emoji: '🐵', element: 'فلز', personality: 'باهوش و خلاق', yogaPose: 'Hanumanasana', yogaName: 'پوزیشن میمون', yogaDesc: 'کشش عمیق پاها', elementColor: '#ccc' },
    'خروس': { emoji: '🐔', element: 'فلز', personality: 'متعهد و منظم', yogaPose: 'Kukkutasana', yogaName: 'پوزیشن خروس', yogaDesc: 'تقویت هسته مرکزی', elementColor: '#ccc' },
    'سگ': { emoji: '🐶', element: 'خاک', personality: 'وفادار و شجاع', yogaPose: 'Adho Mukha Svanasana', yogaName: 'سگ رو به پایین', yogaDesc: 'کشش کامل بدن', elementColor: '#a88832' },
    'گراز': { emoji: '🐷', element: 'آب', personality: 'صبور و خوش‌بین', yogaPose: 'Varaha Asana', yogaName: 'پوزیشن گراز', yogaDesc: 'تقویت پاها', elementColor: '#5b8dee' }
};

var ELEMENT_THEMES = {
    'آتش': { topbar: 'linear-gradient(135deg, rgba(231,76,60,0.15), rgba(192,57,43,0.08))', accent: '#e74c3c', glow: 'rgba(231,76,60,0.12)' },
    'آب': { topbar: 'linear-gradient(135deg, rgba(91,141,238,0.15), rgba(52,152,219,0.08))', accent: '#5b8dee', glow: 'rgba(91,141,238,0.12)' },
    'خاک': { topbar: 'linear-gradient(135deg, rgba(168,136,50,0.15), rgba(139,119,42,0.08))', accent: '#a88832', glow: 'rgba(168,136,50,0.12)' },
    'چوب': { topbar: 'linear-gradient(135deg, rgba(39,174,96,0.15), rgba(46,134,89,0.08))', accent: '#27ae60', glow: 'rgba(39,174,96,0.12)' },
    'فلز': { topbar: 'linear-gradient(135deg, rgba(200,200,200,0.12), rgba(160,160,160,0.06))', accent: '#aaa', glow: 'rgba(200,200,200,0.08)' }
};

// ─── تقویم شمسی (رویدادها) ───
var SOLAR_EVENTS = [
    { month: 1, day: 1, name: 'نوروز', emoji: '🌱', desc: 'آغاز سال نو شمسی — فصل تازه‌ای برای رشد و نو شدن' },
    { month: 1, day: 12, name: 'روز جمهوری اسلامی', emoji: '🇮🇷', desc: 'سالروز تأسیس جمهوری اسلامی ایران' },
    { month: 1, day: 13, name: 'سیزده بدر', emoji: '🌿', desc: 'روز طبیعت — از خانه بیرون برو و انرژی بگیر' },
    { month: 3, day: 15, name: 'قیام ۱۵ خرداد', emoji: '✊', desc: 'بزرگداشت قیام تاریخی مردم در سال ۱۳۴۲' },
    { month: 4, day: 13, name: 'تیرگان', emoji: '💧', desc: 'جشن آب و پاکیزگی — تصفیه ذهن و بدن' },
    { month: 6, day: 31, name: 'تاسوعا', emoji: '🕌', desc: 'عزاداری تاسوعای حسینی' },
    { month: 7, day: 10, name: 'مهرگان', emoji: '🌸', desc: 'جشن مهر و دوستی — روز عشق و پیوند' },
    { month: 10, day: 30, name: 'شب یلدا', emoji: '🍎', desc: 'شب چله — طولانی‌ترین شب سال، خوردن انار و حافظ خوانی' },
    { month: 11, day: 22, name: '۲۲ بهمن', emoji: '🎉', desc: 'سالروز پیروزی انقلاب اسلامی' },
    { month: 11, day: 29, name: 'چهارشنبه سوری', emoji: '🎆', desc: 'جشن آتش — پاک‌سازی و نو شدن' },
    { month: 12, day: 29, name: 'شب چهارشنبه سوری', emoji: '🔥', desc: 'آخرین چهارشنبه سال — جشن آتش و نو شدن' }
];

// ─── پیام‌های روزانه ───
var DAILY_MESSAGES = [
    'امروز زمان خوبی برای شروع یک عادت جدید است.',
    'با خودت مهربان باش. هر قدم کوچکی اهمیت دارد.',
    'از لحظه‌ی فعلی لذت ببر. گذشته و آینده را رها کن.',
    'امروز به کسی کمک کن. مهربانی بازتاب دارد.',
    ' نفس عمیق بکش. تو قوی‌تر از آنی که فکر می‌کنی.',
    'امروز زمان یادگیری چیز جدیدی است.',
    'سکوت کن و به صدای درونی‌ات گوش بده.',
    'امروز از منطقه امن خود خارج شو.',
    'قدردان چیزهای کوچک باش. زیبایی در جزئیات است.',
    'امروز به بدن خود توجه کن. کمی حرکت کن.'
];

// ─── کارت‌های تاروت ساده ───
var TAROT_CARDS = [
    { name: 'D', nameFA: 'دلقک', emoji: '🃏', message: 'شروعی تازه و پر از شادی در راه است.' },
    { name: 'M', nameFA: 'جادوگر', emoji: '🎩', message: 'تو تمام ابزارهای لازم را داری. فقط عمل کن.' },
    { name: 'HP', nameFA: 'کاهنه', emoji: '🌙', message: 'به شهود خودت اعتماد کن. پاسخ در درون توست.' },
    { name: 'E', nameFA: 'امپراتریس', emoji: '👑', message: 'فراوانی و خلاقیت در زندگی‌ات جاری است.' },
    { name: 'EM', nameFA: 'امپراتور', emoji: '🏛️', message: 'ثبات و ساختار به زندگی‌ات اضافه کن.' },
    { name: 'H', nameFA: 'کاهن اعظم', emoji: '📿', message: 'سنت و خرد قدیمی‌ها راهنمایت باشد.' },
    { name: 'LO', nameFA: 'عاشقان', emoji: '💕', message: 'عشق و ارتباطات عمیق در کانون توجه امروز است.' },
    { name: 'J', nameFA: 'گردون', emoji: '🎡', message: 'چرخ زندگی می‌چرخد. صبور باش، همه چیز درست می‌شود.' },
    { name: 'ST', nameFA: 'ستاره', emoji: '⭐', message: 'امید و الهام در زندگی‌ات جاری است. رویاهایت را دنبال کن.' },
    { name: 'MO', nameFA: 'ماه', emoji: '🌕', message: 'رازها و رمزها آشکار می‌شوند. به حس درونی‌ات گوش بده.' },
    { name: 'SU', nameFA: 'خورشید', emoji: '☀️', message: 'شادی و موفقیت در راه است. روز درخشانی در پیش داری!' },
    { name: 'JD', nameFA: 'دادگر', emoji: '⚖️', message: 'انصاف و تعادل را در تصمیم‌گیری رعایت کن.' }
];

// ─── بیوریتم ساده ───
function calcBiorhythm(dayOfYear) {
    var physical = Math.sin(2 * Math.PI * dayOfYear / 23) * 100;
    var emotional = Math.sin(2 * Math.PI * dayOfYear / 28) * 100;
    var intellectual = Math.sin(2 * Math.PI * dayOfYear / 33) * 100;
    return { physical: Math.round(physical), emotional: Math.round(emotional), intellectual: Math.round(intellectual) };
}

function getDayOfYear() {
    var now = new Date();
    var start = new Date(now.getFullYear(), 0, 0);
    var diff = now - start;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
}

// ─── تاریخ شمسی ساده ───
function getSolarDate() {
    var d = new Date();
    var options = { year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'long' };
    try { return d.toLocaleDateString('fa-IR', options); }
    catch (e) { return d.toLocaleDateString('fa'); }
}

function getSolarMonthDay() {
    var d = new Date();
    // تبدیل تقریبی میلادی به شمسی
    var gY = d.getFullYear(), gM = d.getMonth() + 1, gD = d.getDate();
    var gy = gY - 1600, gm = gM - 1, gd = gD - 1;
    var gDayNo = 365 * gy + Math.floor((gy + 3) / 4) - Math.floor((gy + 99) / 100) + Math.floor((gy + 399) / 400);
    for (var i = 0; i < gm; i++) gDayNo += [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][i];
    gDayNo += gd;
    var jDayNo = gDayNo - 79;
    var jNp = Math.floor(jDayNo / 12053);
    jDayNo %= 12053;
    var jY = 979 + 33 * jNp + 4 * Math.floor(jDayNo / 1461);
    jDayNo %= 1461;
    if (jDayNo >= 366) { jY += Math.floor((jDayNo - 1) / 365); jDayNo = (jDayNo - 1) % 365; }
    var jM, jD;
    if (jDayNo < 186) { jM = 1 + Math.floor(jDayNo / 31); jD = 1 + jDayNo % 31; }
    else { jDayNo -= 186; jM = 7 + Math.floor(jDayNo / 30); jD = 1 + jDayNo % 30; }
    return { month: jM, day: jD, year: jY };
}

function getUpcomingSolarEvents(count) {
    count = count || 2;
    var sd = getSolarMonthDay();
    var events = SOLAR_EVENTS.slice().sort(function (a, b) {
        var aDiff = (a.month > sd.month || (a.month === sd.month && a.day >= sd.day)) ? (a.month - sd.month) * 31 + (a.day - sd.day) : (12 - sd.month + a.month) * 31 + (30 - sd.day + a.day);
        var bDiff = (b.month > sd.month || (b.month === sd.month && b.day >= sd.day)) ? (b.month - sd.month) * 31 + (b.day - sd.day) : (12 - sd.month + b.month) * 31 + (30 - sd.day + b.day);
        return aDiff - bDiff;
    });
    return events.slice(0, count);
}

// ─── دریافت حیوان سال ───
function getBirthYear() {
    if (window.sharedInputs && window.sharedInputs.birthDate) return window.sharedInputs.birthDate.year;
    var el = document.getElementById('numYear');
    if (el && el.value) return parseInt(el.value);
    return null;
}

function getZodiacAnimal() {
    var year = getBirthYear();
    if (!year || isNaN(year)) return null;
    var animals = ['موش', 'گاو', 'ببر', 'خرگوش', 'اژدها', 'مار', 'اسب', 'بز', 'میمون', 'خروس', 'سگ', 'گراز'];
    var idx = (year - 1900) % 12;
    return animals[idx >= 0 ? idx : idx + 12];
}

// ─── رندر داشبورد ───
function renderDashboard(containerId) {
    var el = document.getElementById(containerId);
    if (!el) return;

    var animal = getZodiacAnimal();
    var zodiac = animal ? ZODIAC[animal] : null;
    var bio = calcBiorhythm(getDayOfYear());
    var tarot = TAROT_CARDS[new Date().getDate() % TAROT_CARDS.length];
    var msg = DAILY_MESSAGES[new Date().getDate() % DAILY_MESSAGES.length];
    var events = getUpcomingSolarEvents(2);
    var solarDate = getSolarDate();

    var zodiacHtml = zodiac
        ? '<div class="dd-zodiac"><span class="dd-zodiac-emoji">' + zodiac.emoji + '</span><div><div class="dd-zodiac-name">' + animal + ' <span class="dd-zodiac-element" style="color:' + zodiac.elementColor + '">' + zodiac.element + '</span></div><div class="dd-zodiac-personality">' + zodiac.personality + '</div></div></div>'
        : '<div class="dd-zodiac dd-zodiac-empty"><span class="dd-zodiac-emoji">🐉</span><div><div class="dd-zodiac-name">تاریخ تولد ثبت نشده</div><div class="dd-zodiac-personality">برای فعال‌سازی، تاریخ تولد را وارد کنید</div></div></div>';

    function bioBar(val, label, color) {
        var w = Math.abs(val);
        var side = val >= 0 ? 'right' : 'left';
        var pct = (val >= 0 ? '+' : '') + val + '%';
        return '<div class="dd-bio-row"><span class="dd-bio-label">' + label + '</span><div class="dd-bio-bar"><div class="dd-bio-fill" style="width:' + w + '%;background:' + color + ';float:' + side + '"></div><div class="dd-bio-center"></div></div><span class="dd-bio-val" style="color:' + color + '">' + pct + '</span></div>';
    }

    var yogaHtml = zodiac
        ? '<div class="dd-yoga"><div class="dd-yoga-title">🧘 حرکت پیشنهادی امروز</div><div class="dd-yoga-pose">' + zodiac.yogaName + '</div><div class="dd-yoga-desc">' + zodiac.yogaDesc + ' (' + zodiac.yogaPose + ')</div></div>'
        : '';

    var eventHtml = '';
    if (events.length > 0) {
        eventHtml = '<div class="dd-card dd-event-card">';
        events.forEach(function (ev, i) {
            eventHtml += '<div class="dd-event">';
            eventHtml += '<span class="dd-event-emoji">' + ev.emoji + '</span>';
            eventHtml += '<div><div class="dd-event-name">' + ev.name + '</div>';
            eventHtml += '<div class="dd-event-desc">' + ev.desc + '</div></div></div>';
            if (i < events.length - 1) eventHtml += '<div class="dd-event-sep"></div>';
        });
        eventHtml += '</div>';
    }

    el.innerHTML =
        '<div class="dd-grid">' +
            '<div class="dd-card dd-main">' +
                '<div class="dd-date">📅 ' + solarDate + '</div>' +
                '<div class="dd-message">🌟 ' + msg + '</div>' +
                zodiacHtml +
            '</div>' +
            '<div class="dd-card dd-bio-card">' +
                '<div class="dd-card-title">📊 بیوریتم امروز</div>' +
                bioBar(bio.physical, 'فیزیکی 💪', '#e74c3c') +
                bioBar(bio.emotional, 'عاطفی 💕', '#e84393') +
                bioBar(bio.intellectual, 'ذهنی 🧠', '#5b8dee') +
            '</div>' +
            '<div class="dd-card dd-tarot">' +
                '<div class="dd-card-title">🔮 فال امروز</div>' +
                '<div class="dd-tarot-emoji">' + tarot.emoji + '</div>' +
                '<div class="dd-tarot-name">' + tarot.nameFA + '</div>' +
                '<div class="dd-tarot-msg">' + tarot.message + '</div>' +
            '</div>' +
            (yogaHtml ? '<div class="dd-card">' + yogaHtml + '</div>' : '') +
            (isLoggedIn() ? '<div class="dd-card dd-yoga-stats" id="ddYogaStats"><div class="dd-card-title">🧘 سوابق یوگای من</div><div class="dd-yoga-loading">در حال بارگذاری…</div></div>' : '') +
            eventHtml +
        '</div>';

    // اعمال تم عنصر
    if (zodiac && zodiac.element) applyElementTheme(zodiac.element);

    // سوابق یوگا از دیتابیس (فقط کاربران واردشده)
    loadYogaStats();
}

function isLoggedIn() {
    try { return !!localStorage.getItem('cosmic_token'); } catch (e) { return false; }
}

function faDigits(n) {
    var d = '۰۱۲۳۴۵۶۷۸۹';
    return String(n == null ? '' : n).replace(/\d/g, function (x) { return d[+x]; });
}

// ─── سوابق یوگا (از /api/v5/user/dashboard) ───
var _yogaStatsCache = { at: 0, html: '' };
function loadYogaStats() {
    var host = document.getElementById('ddYogaStats');
    if (!host) return;
    if (!isLoggedIn()) { host.remove(); return; }
    var now = Date.now();
    if (_yogaStatsCache.html && now - _yogaStatsCache.at < 60000) {
        host.innerHTML = _yogaStatsCache.html;
        return;
    }
    var token = '';
    try { token = localStorage.getItem('cosmic_token'); } catch (e) {}
    fetch('/api/v5/user/dashboard', { headers: { 'Authorization': 'Bearer ' + token } })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (dash) {
            if (!dash || !dash.yoga) { host.remove(); return; }
            var y = dash.yoga;
            var recent = y.recent || [];
            var catFa = { asanas: 'آسانا', breathing: 'تنفس', meditation: 'مدیتیشن' };
            function faDate(iso) {
                if (!iso) return '—';
                var p = String(iso).split('T')[0].split('-');
                if (p.length !== 3) return iso;
                return faDigits(p[2]) + '/' + faDigits(p[1]) + '/' + faDigits(p[0]);
            }
            var rows = recent.slice(0, 5).map(function (s) {
                var label = s.pose_name || s.notes || catFa[s.category] || 'تمرین یوگا';
                var mins = faDigits(Math.max(1, Math.round((s.duration_seconds || 0) / 60)));
                return '<div class="dd-yoga-row">' +
                    '<span class="dd-yoga-row-icon">' + (s.completed ? '✅' : '⏹') + '</span>' +
                    '<div class="dd-yoga-row-main">' +
                        '<div class="dd-yoga-row-name">' + label + '</div>' +
                        '<div class="dd-yoga-row-meta">' + (catFa[s.category] || s.category) + ' · ' + faDate(s.practice_date) + '</div>' +
                    '</div>' +
                    '<span class="dd-yoga-row-min">' + mins + ' دقیقه</span>' +
                '</div>';
            }).join('');
            var html =
                '<div class="dd-yoga-stats-grid">' +
                    '<div class="dd-yoga-stat"><b>' + faDigits(y.total_minutes || 0) + '</b><span>دقیقه تمرین</span></div>' +
                    '<div class="dd-yoga-stat"><b>' + faDigits(y.streak || 0) + '</b><span>روز متوالی 🔥</span></div>' +
                    '<div class="dd-yoga-stat"><b>' + faDigits(y.total_sessions || 0) + '</b><span>جلسه</span></div>' +
                    '<div class="dd-yoga-stat"><b>' + faDigits(y.longest_streak || 0) + '</b><span>رکورد استریک</span></div>' +
                '</div>' +
                '<div class="dd-yoga-recent-title">تمرین‌های اخیر</div>' +
                (rows ? rows : '<div class="dd-yoga-empty">هنوز جلسه‌ای ثبت نشده — از بخش یوگا شروع کنید 🧘</div>');
            host.innerHTML = html;
            _yogaStatsCache = { at: now, html: html };
        })
        .catch(function () { host.remove(); });
}

// ─── اعمال تم بر اساس عنصر ───
function applyElementTheme(element) {
    var theme = ELEMENT_THEMES[element];
    if (!theme) return;
    var topbar = document.querySelector('.topbar');
    if (topbar) topbar.style.background = theme.topbar;
    document.documentElement.style.setProperty('--element-accent', theme.accent);
    document.documentElement.style.setProperty('--element-glow', theme.glow);
}

function resetTheme() {
    var topbar = document.querySelector('.topbar');
    if (topbar) topbar.style.background = '';
    document.documentElement.style.setProperty('--element-accent', '');
    document.documentElement.style.setProperty('--element-glow', '');
}

// ─── یادآوری روزانه (Notification API) ───
function scheduleDailyNotification() {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') {
        Notification.requestPermission();
        return;
    }
    // چک هر ۵ دقیقه آیا ساعت ۸ صبح رسیده
    setInterval(function () {
        var now = new Date();
        if (now.getHours() === 8 && now.getMinutes() < 5) {
            var sentKey = 'notif_sent_' + now.toISOString().split('T')[0];
            if (localStorage.getItem(sentKey)) return;
            var animal = getZodiacAnimal();
            var zodiac = animal ? ZODIAC[animal] : null;
            var msg = DAILY_MESSAGES[now.getDate() % DAILY_MESSAGES.length];
            var title = '🌅 صبح بخیر!' + (zodiac ? ' ' + zodiac.emoji + ' ' + animal : '');
            new Notification(title, { body: msg, icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><text x="32" y="44" text-anchor="middle" font-size="40">' + (zodiac ? zodiac.emoji : '🌌') + '</text></svg>' });
            localStorage.setItem(sentKey, '1');
        }
    }, 5 * 60 * 1000);
}

// ─── راه‌اندازی ───
function init() {
    renderDashboard('dailyDashboard');
    scheduleDailyNotification();

    // آپدیت هر ۵ ثانیه (اگر تاریخ تولد تغییر کرد)
    setInterval(function () { renderDashboard('dailyDashboard'); }, 5000);
}

return { init: init, renderDashboard: renderDashboard, applyElementTheme: applyElementTheme, resetTheme: resetTheme };
})();
