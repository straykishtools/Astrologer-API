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
    return new Date().toLocaleDateString('fa-IR', { year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'long' });
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
