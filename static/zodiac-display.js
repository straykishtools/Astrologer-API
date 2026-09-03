// ================================================================
//   ZODIAC DISPLAY — نمایش حیوان سال و برنامه روزانه
// ================================================================

var ZodiacDisplay = (function () {
'use strict';

var ZODIAC_DATA = {
    'موش': { emoji: '🐭', element: 'آب', personality: 'باهوش، جذاب، مدبر، اما گاهی محتاط.', dailyAdvice: 'امروز بر روی روابط خود تمرکز کن. یک پیام محبت‌آمیز بفرست.', yogaPose: 'پوزیشن کودک (Balasana)', yogaDesc: 'برای آرامش ذهن و کاهش استرس.' },
    'گاو': { emoji: '🐮', element: 'خاک', personality: 'صبور، قابل اعتماد، سخت‌کوش، با اراده‌ای آهنین.', dailyAdvice: 'روز خوبی برای برنامه‌ریزی بلندمدت. قدم‌های کوچک بردار.', yogaPose: 'پوزیشن کوه (Tadasana)', yogaDesc: 'برای ثبات و تمرکز.' },
    'ببر': { emoji: '🐯', element: 'چوب', personality: 'شجاع، پرانرژی، رقابتی، اما گاهی تکانشی.', dailyAdvice: 'از انرژی امروز برای شروع یک پروژه جدید استفاده کن.', yogaPose: 'پوزیشن جنگجو II', yogaDesc: 'برای قدرت و تعادل.' },
    'خرگوش': { emoji: '🐰', element: 'چوب', personality: 'خوش‌شانس، آرام، هنرمند، و مهربان.', dailyAdvice: 'امروز به هنر و خلاقیت خود زمان بده.', yogaPose: 'پوزیشن خرگوش (Sasangasana)', yogaDesc: 'برای کشش ستون فقرات و آرامش.' },
    'اژدها': { emoji: '🐲', element: 'آتش', personality: 'قوی، شجاع، خوش‌شانس، اما گاهی متکبر.', dailyAdvice: 'امروز زمان نشان دادن توانایی‌هایت است. بدرخش!', yogaPose: 'پوزیشن اژدها (Dragon Pose)', yogaDesc: 'برای باز کردن لگن و افزایش انرژی.' },
    'مار': { emoji: '🐍', element: 'آتش', personality: 'خردمند، مرموز، شهودی، و جذاب.', dailyAdvice: 'به حرف‌های ناگفته گوش کن. شهودت راهنمایت است.', yogaPose: 'پوزیشن کبرا (Bhujangasana)', yogaDesc: 'برای باز کردن قفسه سینه.' },
    'اسب': { emoji: '🐴', element: 'آتش', personality: 'مستقل، پرانرژی، آزاد، و اجتماعی.', dailyAdvice: 'به سمت اهداف خود بدو. امروز زمان عمل است.', yogaPose: 'پوزیشن سوارکار (Vatayanasana)', yogaDesc: 'برای تعادل و قدرت پاها.' },
    'بز': { emoji: '🐐', element: 'خاک', personality: 'هنرمند، آرام، مهربان، و کمی حساس.', dailyAdvice: 'امروز زمانی برای خودت اختصاص بده.', yogaPose: 'پوزیشن بز (Bhekasana)', yogaDesc: 'برای باز کردن مفاصل ران.' },
    'میمون': { emoji: '🐵', element: 'فلز', personality: 'باهوش، خلاق، پرانرژی، و بسیار اجتماعی.', dailyAdvice: 'با دوستانت ارتباط بگیر.', yogaPose: 'پوزیشن میمون (Hanumanasana)', yogaDesc: 'برای کشش عمیق پاها.' },
    'خروس': { emoji: '🐔', element: 'فلز', personality: 'متعهد، منظم، با اراده، و رک‌گو.', dailyAdvice: 'برنامه‌های خود را مرتب کن.', yogaPose: 'پوزیشن خروس (Kukkutasana)', yogaDesc: 'برای تقویت هسته مرکزی.' },
    'سگ': { emoji: '🐶', element: 'خاک', personality: 'وفادار، صادق، شجاع، و محافظ.', dailyAdvice: 'به یک دوست قدیمی پیام بده.', yogaPose: 'سگ رو به پایین', yogaDesc: 'برای کشش کامل بدن.' },
    'گراز': { emoji: '🐷', element: 'آب', personality: 'صبور، بخشنده، خونگرم، و خوش‌بین.', dailyAdvice: 'امروز به دیگران کمک کن.', yogaPose: 'پوزیشن گراز (Varaha Asana)', yogaDesc: 'برای تقویت پاها.' }
};

var QUOTES = [
    '💫 "آسمان محدودیت نیست، آغازی است برای پرواز."',
    '🌌 "هر ستاره مسیری دارد، تو نیز مسیر خود را خواهی یافت."',
    '🪐 "زندگی مانند چارت تولد است؛ همه چیز در جای خود معنا دارد."',
    '✨ "انرژی تو، واقعیت تو را می‌سازد. امروز را با عشق بساز."',
    '🌀 "در سکوت، پاسخ‌های بزرگ نهفته‌اند."'
];

var currentZodiac = null;
var dom = {};

function getPersianDate() {
    return new Date().toLocaleDateString('fa-IR', { month: '2-digit', day: '2-digit', weekday: 'short' });
}

function calcBiorhythm(dayOfYear) {
    var physical = Math.sin(2 * Math.PI * dayOfYear / 23) * 100;
    var emotional = Math.sin(2 * Math.PI * dayOfYear / 28) * 100;
    var mental = Math.sin(2 * Math.PI * dayOfYear / 33) * 100;
    return { physical: Math.round(physical), emotional: Math.round(emotional), mental: Math.round(mental) };
}

function getDayOfYear() {
    var now = new Date();
    var start = new Date(now.getFullYear(), 0, 0);
    var diff = now - start;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function getBirthDaysSince() {
    var bd = window.sharedInputs && window.sharedInputs.birthDate;
    if (!bd || !bd.year || !bd.month || !bd.day) return null;
    var shamsiMonth = [1,31,59,90,120,151,181,212,243,273,304,334];
    var birthDayOfYear = (shamsiMonth[bd.month - 1] || 0) + bd.day;
    var now = new Date();
    var thisDayOfYear = getDayOfYear();
    var birthYear = bd.year;
    var currentYear = now.getFullYear();
    var yearsDiff = currentYear - birthYear;
    var totalDays = yearsDiff * 365 + (thisDayOfYear - birthDayOfYear);
    if (totalDays < 0) totalDays = 0;
    return totalDays;
}

function getBiorhythmHtml() {
    var daysSince = getBirthDaysSince();
    if (daysSince === null || daysSince <= 0) return '';
    var bio = calcBiorhythm(daysSince);
    var bioNext = calcBiorhythm(daysSince + 1);
    function bioColor(val) {
        if (val >= 30) return '#2ecc71';
        if (val >= 0) return '#f1c40f';
        if (val >= -30) return '#e67e22';
        return '#e74c3c';
    }
    function bioEmoji(val) {
        if (val >= 50) return '😊';
        if (val >= 0) return '😐';
        if (val >= -50) return '😔';
        return '😟';
    }
    function bioPct(val) { return (val >= 0 ? '+' : '') + val + '%'; }
    function arrow(cur, nxt) { return nxt > cur ? ' ↗' : nxt < cur ? ' ↘' : ' →'; }

    // Build 7-day sparkline SVG
    function sparkline(days, dayOffset, cycle, color) {
        var pts = [];
        for (var i = -6; i <= 0; i++) {
            var v = Math.sin(2 * Math.PI * (days + dayOffset + i) / cycle) * 100;
            pts.push(v);
        }
        var w = 64, h = 20, pad = 2;
        var minY = -100, maxY = 100;
        var coords = pts.map(function(v, i) {
            var x = pad + (i / 6) * (w - pad * 2);
            var y = pad + ((maxY - v) / (maxY - minY)) * (h - pad * 2);
            return x.toFixed(1) + ',' + y.toFixed(1);
        });
        // Zero line
        var zeroY = pad + (maxY / (maxY - minY)) * (h - pad * 2);
        return '<svg width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" style="display:block;margin:3px auto 0;">'
            + '<line x1="' + pad + '" y1="' + zeroY.toFixed(1) + '" x2="' + (w - pad) + '" y2="' + zeroY.toFixed(1) + '" stroke="rgba(255,255,255,0.15)" stroke-width="0.5" stroke-dasharray="2,2"/>'
            + '<polyline points="' + coords.join(' ') + '" fill="none" stroke="' + color + '" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>'
            + '<circle cx="' + coords[6].split(',')[0] + '" cy="' + coords[6].split(',')[1] + '" r="2" fill="' + color + '"/>'
            + '</svg>';
    }

    function makeItem(label, val, nxt, color, emoji, idx) {
        var forecast = bioPct(val) + arrow(val, nxt) + ' ' + bioPct(nxt);
        return '<span class="zodiac-bio-item bio-anim-in" style="animation-delay:' + (idx * 0.12) + 's" data-tooltip-rich="1" '
            + 'data-tt-label="' + label + '" data-tt-val="' + bioPct(val) + '" '
            + 'data-tt-next="' + forecast + '" data-tt-color="' + color + '" '
            + 'data-tt-days="' + daysSince + '" data-tt-cycle="' + (label === 'فیزیکی' ? 23 : label === 'احساسی' ? 28 : 33) + '">'
            + '<span class="zodiac-bio-dot" style="background:' + color + '"></span>' + emoji + '</span>';
    }

    var items = makeItem('فیزیکی', bio.physical, bioNext.physical, bioColor(bio.physical), bioEmoji(bio.physical), 0)
        + makeItem('احساسی', bio.emotional, bioNext.emotional, bioColor(bio.emotional), bioEmoji(bio.emotional), 1)
        + makeItem('ذهنی', bio.mental, bioNext.mental, bioColor(bio.mental), bioEmoji(bio.mental), 2);

    return '<div class="zodiac-bio">' + items + '</div>';
}

function getZodiacFromYear(year) {
    if (!year || isNaN(year)) return null;
    var animals = ['موش', 'گاو', 'ببر', 'خرگوش', 'اژدها', 'مار', 'اسب', 'بز', 'میمون', 'خروس', 'سگ', 'گراز'];
    var idx = (year - 1900) % 12;
    return animals[idx >= 0 ? idx : idx + 12];
}

function getZodiacData(animal) {
    return ZODIAC_DATA[animal] || null;
}

function updateTopbar(animal, data) {
    if (!dom.emoji || !dom.text || !dom.date) return;
    if (animal && data) { dom.emoji.textContent = data.emoji; dom.text.textContent = animal + ' (' + data.element + ')'; }
    else { dom.emoji.textContent = '🐉'; dom.text.textContent = 'ثبت نشده'; }
    dom.date.textContent = getPersianDate();
    var bioContainer = document.getElementById('zodiacBio');
    if (bioContainer) { bioContainer.innerHTML = getBiorhythmHtml(); }
}

function showModal(animal, data) {
    var modal = document.getElementById('zodiacModal');
    var body = document.getElementById('zodiacModalBody');
    if (!modal || !body) return;
    if (!animal || !data) {
        body.innerHTML = '<p style="color:var(--ink-dim);font-size:16px;">🧘 لطفاً تاریخ تولد خود را در بخش <strong>چارت تولد</strong> وارد کنید.</p>';
        modal.classList.add('active'); return;
    }
    var quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    body.innerHTML =
        '<span class="z-emoji">' + data.emoji + '</span>' +
        '<div class="z-title">' + animal + '</div>' +
        '<div class="z-sub">عنصر: ' + data.element + ' · امروز ' + getPersianDate() + '</div>' +
        '<div class="z-message"><strong>🧬 شخصیت:</strong> ' + data.personality + '</div>' +
        '<div class="z-message" style="border-color:#5b8dee;"><strong>🌟 توصیه روزانه:</strong> ' + data.dailyAdvice + '</div>' +
        '<div class="z-yoga"><div class="z-yoga-label">🧘 حرکت یوگای پیشنهادی</div><div class="z-yoga-name">' + data.yogaPose + '</div><div class="z-yoga-desc">' + data.yogaDesc + '</div></div>' +
        '<div class="z-quote">' + quote + '</div>';
    modal.classList.add('active');
}

function getBirthYearFromProject() {
    if (window.sharedInputs && window.sharedInputs.birthDate) return window.sharedInputs.birthDate.year;
    try {
        var state = localStorage.getItem('yoga_state');
        if (state) { var data = JSON.parse(state); if (data.birthYear) return data.birthYear; }
    } catch (_) {}
    var yearEl = document.getElementById('numYear');
    if (yearEl && yearEl.value) return parseInt(yearEl.value);
    return null;
}

function init() {
    dom.emoji = document.getElementById('zodiacEmoji');
    dom.text = document.getElementById('zodiacText');
    dom.date = document.getElementById('zodiacDate');
    dom.trigger = document.getElementById('zodiacTrigger');

    var year = getBirthYearFromProject();
    if (year) {
        var animal = getZodiacFromYear(year);
        var data = animal ? getZodiacData(animal) : null;
        if (animal && data) { currentZodiac = { animal: animal, data: data }; updateTopbar(animal, data); }
        else updateTopbar(null, null);
    } else updateTopbar(null, null);

    if (dom.trigger) {
        dom.trigger.addEventListener('click', function () {
            var y = getBirthYearFromProject();
            if (y) { var a = getZodiacFromYear(y); var d = a ? getZodiacData(a) : null; showModal(a, d); }
            else showModal(null, null);
        });
    }

    var closeBtn = document.getElementById('zodiacModalClose');
    var modal = document.getElementById('zodiacModal');
    if (closeBtn) closeBtn.addEventListener('click', function () { modal.classList.remove('active'); });
    if (modal) modal.addEventListener('click', function (e) { if (e.target === modal) modal.classList.remove('active'); });

    setInterval(function () {
        var y = getBirthYearFromProject();
        if (y) {
            var a = getZodiacFromYear(y);
            var d = a ? getZodiacData(a) : null;
            if (a && d && (!currentZodiac || currentZodiac.animal !== a)) {
                currentZodiac = { animal: a, data: d };
                updateTopbar(a, d);
            }
        }
    }, 5000);

    // ─── Inline sparkline on hover ───
    function buildSparkline(days, offset, cycle, color) {
        var pts = [];
        for (var i = -6; i <= 0; i++) {
            pts.push(Math.sin(2 * Math.PI * (days + offset + i) / cycle) * 100);
        }
        var w = 72, h = 24, pad = 2;
        var minY = -100, maxY = 100;
        var coords = pts.map(function(v, i) {
            var x = pad + (i / 6) * (w - pad * 2);
            var y = pad + ((maxY - v) / (maxY - minY)) * (h - pad * 2);
            return x.toFixed(1) + ',' + y.toFixed(1);
        });
        var zeroY = (pad + (maxY / (maxY - minY)) * (h - pad * 2)).toFixed(1);
        return '<svg width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '">'
            + '<line x1="' + pad + '" y1="' + zeroY + '" x2="' + (w - pad) + '" y2="' + zeroY + '" stroke="rgba(255,255,255,0.15)" stroke-width="0.5" stroke-dasharray="2,2"/>'
            + '<polyline points="' + coords.join(' ') + '" fill="none" stroke="' + color + '" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>'
            + '<circle cx="' + coords[6].split(',')[0] + '" cy="' + coords[6].split(',')[1] + '" r="2.5" fill="' + color + '"/>'
            + '</svg>';
    }

    function showInlineSparkline(el) {
        // Remove any existing sparkline
        var existing = el.parentNode.querySelector('.zodiac-bio-sparkline');
        if (existing) existing.remove();

        var color = el.getAttribute('data-tt-color');
        var label = el.getAttribute('data-tt-label');
        var val = el.getAttribute('data-tt-val');
        var nextText = el.getAttribute('data-tt-next');
        var days = parseInt(el.getAttribute('data-tt-days')) || 0;
        var cycle = parseInt(el.getAttribute('data-tt-cycle')) || 23;

        var spark = document.createElement('span');
        spark.className = 'zodiac-bio-sparkline';
        spark.innerHTML = '<span class="zbs-label" style="color:' + color + '">' + label + ' ' + val + '</span>'
            + buildSparkline(days, 0, cycle, color)
            + '<span class="zbs-next">' + nextText + '</span>';

        el.parentNode.insertBefore(spark, el.nextSibling);
    }

    function hideInlineSparkline(el) {
        var spark = el.parentNode && el.parentNode.querySelector('.zodiac-bio-sparkline');
        if (spark) spark.remove();
    }

    function bindTooltips() {
        document.querySelectorAll('.zodiac-bio-item[data-tooltip-rich]').forEach(function(item) {
            item.addEventListener('mouseenter', function() { showInlineSparkline(this); });
            item.addEventListener('mouseleave', function() { hideInlineSparkline(this); });
        });
    }
    bindTooltips();
    // Re-bind when topbar updates
    var _origUpdate = updateTopbar;
    updateTopbar = function(a, d) {
        _origUpdate(a, d);
        setTimeout(bindTooltips, 50);
    };
}

return {
    init: init,
    getZodiac: function () { return currentZodiac; },
    showModal: showModal,
    updateTopbar: updateTopbar,
    refresh: function () {
        var y = getBirthYearFromProject();
        if (y) {
            var a = getZodiacFromYear(y);
            var d = a ? getZodiacData(a) : null;
            if (a && d) { currentZodiac = { animal: a, data: d }; updateTopbar(a, d); }
        }
    }
};
})();
