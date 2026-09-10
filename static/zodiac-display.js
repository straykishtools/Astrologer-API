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
    var g = shamsiToGregorianDate(bd.year, bd.month, bd.day);
    var birth = new Date(g.gy, g.gm - 1, g.gd);
    var now = new Date();
    var days = Math.floor((now - birth) / 86400000);
    if (isNaN(days) || days < 0) return null;
    return days;
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
        return '<span class="zodiac-bio-item bio-anim-in" style="animation-delay:' + (idx * 0.12) + 's;--bio-c:' + color + '" data-tooltip-rich="1" '
            + 'data-tt-label="' + label + '" data-tt-val="' + bioPct(val) + '" '
            + 'data-tt-next="' + forecast + '" data-tt-color="' + color + '" '
            + 'data-tt-days="' + daysSince + '" data-tt-cycle="' + (label === 'فیزیکی' ? 23 : label === 'احساسی' ? 28 : 33) + '">'
            + '<span class="zodiac-bio-dot" style="background:' + color + '"></span>' + emoji + '</span>';
    }

    var items = makeItem('فیزیکی', bio.physical, bioNext.physical, bioColor(bio.physical), bioEmoji(bio.physical), 0)
        + makeItem('احساسی', bio.emotional, bioNext.emotional, bioColor(bio.emotional), bioEmoji(bio.emotional), 1)
        + makeItem('ذهنی', bio.mental, bioNext.mental, bioColor(bio.mental), bioEmoji(bio.mental), 2);

    return items; // chips injected directly into #zodiacBio (no nested wrapper)
}

function getZodiacFromYear(year) {
    if (!year || isNaN(year)) return null;
    // همان فرمول موتور بک‌اند (ChineseZodiacEngine.calculate): (year - 4) % 12
    // سال ۴ میلادی = سال موش — با /api/v5/chinese-zodiac یکسان است
    var animals = ['موش', 'گاو', 'ببر', 'خرگوش', 'اژدها', 'مار', 'اسب', 'بز', 'میمون', 'خروس', 'سگ', 'گراز'];
    var idx = (year - 4) % 12;
    idx = ((idx % 12) + 12) % 12;
    return animals[idx];
}

function getZodiacData(animal) {
    return ZODIAC_DATA[animal] || null;
}

/* ─── تبدیل تاریخ شمسی (جلالی) به میلادی — الگوریتم jdf استاندارد (تست‌شده) ─── */
function jalaliToGregorian(jy, jm, jd) {
    jy += 1595;
    var days = -355668 + (365 * jy) + (~~(jy / 33) * 8) + ~~(((jy % 33) + 3) / 4) + jd
        + ((jm < 7) ? (jm - 1) * 31 : ((jm - 7) * 30) + 186);
    var gy = 400 * ~~(days / 146097);
    days %= 146097;
    if (days > 36524) {
        gy += 100 * ~~(--days / 36524);
        days %= 36524;
        if (days >= 365) days++;
    }
    gy += 4 * ~~(days / 1461);
    days %= 1461;
    if (days > 365) {
        gy += ~~((days - 1) / 365);
        days = (days - 1) % 365;
    }
    var gd = days + 1;
    var sal_a = [0, 31, ((gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    var gm;
    for (gm = 0; gm < 13 && gd > sal_a[gm]; gm++) gd -= sal_a[gm];
    return { gy: gy, gm: gm, gd: gd };
}

/* سال تولد را به میلادی نرمال می‌کند (ورودی پیکر چارت شمسی است) */
function normalizeBirthYearToGregorian(year, month, day) {
    if (!year || isNaN(year)) return null;
    // بازه ۱۳۰۰–۱۶۰۰ = شمسی → تبدیل (فقط سال؛ برای سازگاری کد قدیمی)
    if (year >= 1300 && year <= 1600) {
        var g = jalaliToGregorian(year, month || 1, day || 1);
        return g.gy;
    }
    return year;
}

/* ISO شمسی "YYYY-MM-DD" → ISO میلادی (سال+ماه+روز کامل) */
function isoShamsiToGregorianISO(iso) {
    if (!iso) return iso;
    var p = String(iso).split('-').map(function (x) { return parseInt(x, 10); });
    if (p.length !== 3 || isNaN(p[0])) return iso;
    var g = shamsiToGregorianDate(p[0], p[1], p[2]);
    if (!g) return iso;
    return g.gy + '-' + String(g.gm).padStart(2, '0') + '-' + String(g.gd).padStart(2, '0');
}
window.isoShamsiToGregorianISO = isoShamsiToGregorianISO;

/* تبدیل کامل تاریخ شمسی → میلادی (سال + ماه + روز) — برای بیوریتم و غیره */
function shamsiToGregorianDate(jy, jm, jd) {
    if (!jy || isNaN(jy)) return null;
    if (jy >= 1300 && jy <= 1600) {
        var g = jalaliToGregorian(jy, jm || 1, jd || 1);
        return { gy: g.gy, gm: g.gm, gd: g.gd };
    }
    return { gy: jy, gm: jm || 1, gd: jd || 1 };
}
window.shamsiToGregorianDate = shamsiToGregorianDate;

function getGregorianBirthYear() {
    var bd = (window.sharedInputs && window.sharedInputs.birthDate) || null;
    if (bd && bd.year && !isNaN(bd.year)) {
        return normalizeBirthYearToGregorian(bd.year, bd.month, bd.day);
    }
    try {
        var state = localStorage.getItem('yoga_state');
        if (state) { var d = JSON.parse(state); if (d.birthYear) return normalizeBirthYearToGregorian(d.birthYear, d.birthMonth || 1, d.birthDay || 1); }
    } catch (_) {}
    var yearEl = document.getElementById('numYear');
    if (yearEl && yearEl.value) return normalizeBirthYearToGregorian(parseInt(yearEl.value));
    return null;
}
window.normalizeBirthYearToGregorian = normalizeBirthYearToGregorian;

/* ─── سرویس بک‌اند: حیوان + عنصر دقیق سال (کش به ازای هر سال) ─── */
var _zodiacSvcCache = {};
async function fetchZodiacFromService(gYear) {
    if (!gYear || isNaN(gYear)) return null;
    if (_zodiacSvcCache[gYear]) return _zodiacSvcCache[gYear];
    try {
        var resp = await fetch('/api/v5/chinese-zodiac', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ year: gYear })
        });
        if (!resp.ok) return null;
        var data = await resp.json();
        if (data.status === 'success' && data.data) {
            _zodiacSvcCache[gYear] = data.data;
            return data.data;
        }
        return null;
    } catch (e) { return null; }
}

function updateTopbar(animal, data) {
    if (!dom.emoji || !dom.text || !dom.date) return;
    if (animal && data) { dom.emoji.textContent = data.emoji; dom.text.textContent = animal + ' (' + data.element + ')'; }
    else { dom.emoji.textContent = '🐉'; dom.text.textContent = 'ثبت نشده'; }
    dom.date.textContent = getPersianDate();
    var bioContainer = document.getElementById('zodiacBio');
    if (bioContainer) { bioContainer.innerHTML = getBiorhythmHtml(); }
}

/* ─── پنل کشویی زیر دکمه زودیاک (جایگزین مودال) ─── */
function getBiorhythmRowsHtml() {
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
    function row(label, val, nxt, idx) {
        var c = bioColor(val);
        return '<div class="zp-bio-row bio-anim-in" style="animation-delay:' + (idx * 0.1) + 's">'
            + '<span class="zp-bio-emoji">' + bioEmoji(val) + '</span>'
            + '<span class="zp-bio-label">' + label + '</span>'
            + '<span class="zp-bio-bar"><span class="zp-bio-bar-fill" style="background:' + c + ';width:' + Math.abs(val) / 2 + '%;margin-right:' + (val < 0 ? 0 : '50') + '%;"></span>'
            + '<span class="zp-bio-bar-zero"></span></span>'
            + '<span class="zp-bio-val" style="color:' + c + '">' + bioPct(val) + arrow(val, nxt) + '</span>'
            + '</div>';
    }
    return row('فیزیکی', bio.physical, bioNext.physical, 0)
        + row('احساسی', bio.emotional, bioNext.emotional, 1)
        + row('ذهنی', bio.mental, bioNext.mental, 2)
        + '<div class="zp-bio-days">🌟 ' + daysSince.toLocaleString('fa-IR') + ' روز از تولد شما می‌گذرد</div>';
}

function renderZodiacPanel(animal, data) {
    var panel = document.getElementById('zodiacPanel');
    if (!panel) return;
    if (!animal || !data) {
        panel.innerHTML = '<div class="zp-empty">🧘 لطفاً تاریخ تولد خود را در بخش <strong>چارت تولد</strong> وارد کنید.</div>';
        return;
    }
    var quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    var bioRows = getBiorhythmRowsHtml();

    panel.innerHTML =
        '<div class="zp-header">'
            + '<span class="zp-emoji">' + data.emoji + '</span>'
            + '<div class="zp-header-info">'
                + '<div class="zp-title">' + animal + '</div>'
                + '<div class="zp-sub">عنصر: ' + data.element + ' · امروز ' + getPersianDate() + '</div>'
            + '</div>'
        + '</div>'
        + (bioRows ? '<div class="zp-bio"><div class="zp-section-title">🌙 ریتم‌های زیستی امروز</div>' + bioRows + '</div>' : '')
        + '<div class="zp-message"><strong>🧬 شخصیت:</strong> ' + data.personality + '</div>'
        + '<div class="zp-message zp-advice"><strong>🌟 توصیه روزانه:</strong> ' + data.dailyAdvice + '</div>'
        + '<div class="zp-yoga"><div class="zp-yoga-label">🧘 حرکت یوگای پیشنهادی</div><div class="zp-yoga-name">' + data.yogaPose + '</div><div class="zp-yoga-desc">' + data.yogaDesc + '</div></div>'
        + '<div class="zp-quote">' + quote + '</div>';
}

function openZodiacPanel() {
    var panel = document.getElementById('zodiacPanel');
    if (!panel) return;
    renderZodiacPanel(currentZodiac && currentZodiac.animal ? currentZodiac.animal : null,
                      currentZodiac && currentZodiac.data ? currentZodiac.data : null);
    panel.classList.add('open');
}

function closeZodiacPanel() {
    var panel = document.getElementById('zodiacPanel');
    if (panel) panel.classList.remove('open');
}

/* سازگاری با کدهای قدیمی که showModal را صدا می‌زنند */
var showModal = openZodiacPanel;

/* ─── هسته رندر: سال میلادی → حیوان (محلی فوری + سرویس بک‌اند برای دقت) ─── */
var _lastResolvedAnimal = null;

function applyZodiac(animal) {
    var data = animal ? getZodiacData(animal) : null;
    if (animal && data) {
        currentZodiac = { animal: animal, data: data };
        updateTopbar(animal, data);
    } else {
        updateTopbar(null, null);
    }
}

async function resolveAndRender(gYear) {
    // فوری: محاسبه محلی (همان فرمول بک‌اند)
    var localAnimal = getZodiacFromYear(gYear);
    if (localAnimal && localAnimal !== _lastResolvedAnimal) {
        _lastResolvedAnimal = localAnimal;
        applyZodiac(localAnimal);
    } else if (!gYear && _lastResolvedAnimal) {
        _lastResolvedAnimal = null;
        applyZodiac(null);
    }
    // دقیق: از سرویس بک‌اند (عنصر + جزئیات) — فقط اگر حیوان متفاوت بود جایگزین کن
    if (gYear) {
        var svc = await fetchZodiacFromService(gYear);
        if (svc && svc.animal && svc.animal !== _lastResolvedAnimal) {
            _lastResolvedAnimal = svc.animal;
            applyZodiac(svc.animal);
        }
    }
}

function getBirthYearFromProject() {
    return getGregorianBirthYear();
}

function init() {
    dom.emoji = document.getElementById('zodiacEmoji');
    dom.text = document.getElementById('zodiacText');
    dom.date = document.getElementById('zodiacDate');
    dom.trigger = document.getElementById('zodiacTrigger');

    var year = getBirthYearFromProject();
    resolveAndRender(year);

    // کلیک روی تریگر = باز شدن پنل کشویی (هماهنگ با TOPBAR DROPDOWN COORDINATOR)
    if (dom.trigger) {
        dom.trigger.addEventListener('click', function () {
            openZodiacPanel();
        });
    }

    setInterval(function () {
        var y = getBirthYearFromProject();
        resolveAndRender(y);
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
        var bio = document.getElementById('zodiacBio');
        if (!bio) return;
        // Remove any existing sparkline
        var existing = bio.querySelector('.zodiac-bio-sparkline');
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

        // شناور بالای چیپ — چیدمان نوار بالا را جابه‌جا نمی‌کند
        spark.style.position = 'absolute';
        spark.style.bottom = 'calc(100% + 8px)';
        spark.style.right = '0';
        spark.style.margin = '0';
        el.style.position = 'relative';
        el.appendChild(spark);
    }

    function hideInlineSparkline(el) {
        var bio = document.getElementById('zodiacBio');
        if (bio) {
            var spark = bio.querySelector('.zodiac-bio-sparkline');
            if (spark) spark.remove();
        }
    }

    // ─── Event delegation: با re-render چیپ‌ها هم کار می‌کند ───
    var bioHost = document.getElementById('zodiacBio');
    if (bioHost) {
        bioHost.addEventListener('mouseover', function (e) {
            var item = e.target.closest('.zodiac-bio-item');
            if (item) showInlineSparkline(item);
        });
        bioHost.addEventListener('mouseout', function (e) {
            var item = e.target.closest('.zodiac-bio-item');
            if (item && !item.contains(e.relatedTarget)) hideInlineSparkline(item);
        });
    }
}

return {
    init: init,
    getZodiac: function () { return currentZodiac; },
    showModal: showModal,
    updateTopbar: updateTopbar,
    refresh: function () {
        var y = getBirthYearFromProject();
        resolveAndRender(y);
    }
};
})();
