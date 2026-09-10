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

// ─── پیام‌های روزانه — ۷۰+ پیام متنوع بر اساس روزِ هفته/فصل ───
var DAILY_MESSAGES = {
    // پیام‌های عمومی (همیشه در استخر)
    general: [
        'با خودت مهربان باش. هر قدم کوچکی اهمیت دارد.',
        'از لحظه‌ی فعلی لذت ببر. گذشته و آینده را رها کن.',
        'نفس عمیق بکش. تو قوی‌تر از آنی که فکر می‌کنی.',
        'سکوت کن و به صدای درونی‌ات گوش بده.',
        'قدردان چیزهای کوچک باش. زیبایی در جزئیات است.',
        'امروز به بدن خود توجه کن. کمی حرکت کن.',
        'یک چیز کوچک را کامل کن؛ احساسِ پایان‌دادن، سوختِ فرداست.',
        'یک آدم را امروز غافلگیر کن — با یک پیامِ ناگهانیِ مهر.',
        'آبی بنوش و پنج دقیقه زیرِ آسمان بایست. همین.',
        'امروز یک صفحه بنویس، هرچه — فردا از آن ممنون خواهی بود.',
        'باور کن که همین حالا کافی هستی؛ بقیه‌اش ساخته می‌شود.',
        'آرامش را در شروعِ روز جست‌وجو نکن؛ خودت بسازش.',
        'انرژی‌ات را جایی خرج کن که دو سالِ دیگر هم به آن افتخار کنی.',
        'امروز یک «نه» بگو به چیزی که انرژی‌ات را می‌خورد.',
        'چیزی که ازش می‌ترسی، فقط یک قدمِ بزرگ‌تر از توست. قدم بردار.'
    ],
    // روزهای هفته — حال‌وهوای هر روز
    weekday: {
        0: [ // یکشنبه
            'یکشنبه، روزِ شروعِ تازه: هفته را با یک نیتِ روشن آغاز کن.',
            'روزِ خورشید ☀️ — مثلِ آن بدرخش، حتی اگر ابری است.',
            'یکشنبه‌ها برایِ ریست‌کردن ساخته شده‌اند: فهرستِ هفته را امروز بنویس.'
        ],
        1: [ // دوشنبه
            'دوشنبه، روزِ ماه 🌙 — به احساساتت گوش بده، نه فقط به تقویم.',
            'شروعِ رسمیِ هفته: یک کارِ مهم را قبل از ظهر تمام کن.',
            'ماه امشب به تو یادآوری می‌کند: نرمی هم نوعی قدرت است.'
        ],
        2: [ // سه‌شنبه
            'سه‌شنبه، روزِ مریخ ♂ — انرژیِ عمل: آن چیزِ معوقه را بزن.',
            'مریخ پشتِ توست؛ بهانه‌ها را امروز جا بگذار.',
            'سه‌شنبه‌ها مالِ شروع‌هایِ جسورانه‌اند — بترسان به کار.'
        ],
        3: [ // چهارشنبه
            'چهارشنبه، روزِ عطارد ☿ — ذهنت تیز است: یادگیری و مذاکره.',
            'نیمه‌ی هفته: یک پاداشِ کوچک برایِ خودت بگذار تا انرژی بماند.',
            'عطارد امروز حرف‌هایت را می‌شنود؛ آن مهم‌ترین را بگو.'
        ],
        4: [ // پنجشنبه
            'پنجشنبه، روزِ مشتری ♃ — روزِ گسترش و بخت؛ بزرگ فکر کن.',
            'مشتری امروز دستِ توست: آن فرصت را رد نکن.',
            'پنجشنبه‌ها برایِ تصمیم‌هایِ بلندپروازانه ساخته شده‌اند.'
        ],
        5: [ // جمعه
            'جمعه، روزِ کیوان ♄ — جمعِ هفته: حساب‌وکتابِ خوبی‌ها را بکن.',
            'جمعه‌ها مالِ خانواده و سکوت است — عجله را تعطیل کن.',
            'کیوان می‌گوید: به خودت هم مثلِ یک کارِ مهم، وقتِ باکیفیت بده.'
        ],
        6: [ // شنبه
            'شنبه، روزِ ناهید ♀ — زیبایی و عشق: خودت و خانه‌ات را بپروران.',
            'شنبه‌ها نرم‌اند: یک لذتِ حسیِ ساده — موسیقی، چایِ خوب، آسمان.',
            'ناهید امروز کنارت است: چیزی بساز که قشنگ است، فقط برایِ لذت.'
        ]
    },
    // فصل‌ها
    season: {
        spring: [
            'بهار است: مثلِ طبیعت، یک چیزِ تازه در خودت بکار.',
            'هوایِ بهاری برایِ شروع‌ها ساخته شده — زمینِ تو آماده است.',
            'در بهار، حتی قدم‌هایِ کوچک سریع جواب می‌دهند.'
        ],
        summer: [
            'تابستان، فصلِ اوج است: انرژی‌ات را در پروژه‌ی اصلی بریز.',
            'آفتابِ تابستان یادت می‌دهد نور، داخل هم پیدا می‌شود.',
            'در گرمایِ تابستان، آبِ بیشتر و عجله‌ی کمتر.'
        ],
        autumn: [
            'پاییز، فصلِ رهاکردن است: چیزهایِ کهنه را مثلِ برگ، بگذار بروند.',
            'پاییز یادت می‌دهد زیبایی در پایان‌ها هم هست.',
            'در پاییز، جمع‌کردنِ ثمرِ تلاش‌ها مهم‌تر از کاشتنِ تازه است.'
        ],
        winter: [
            'زمستان، فصلِ درون است: به خواب و تأملت احترام بگذار.',
            'در زمستان، ریشه‌ها زیرِ برف کار می‌کنند — تو هم همین‌طور.',
            'گرمایِ زمستان را بساز: چای، کتاب، و آدم‌هایِ امن.'
        ]
    }
};

// انتخاب پیام روز: deterministic بر اساس تاریخ (هر روز یکی، همه‌جا یکی)
function pickDailyMessage() {
    var now = new Date();
    var seed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
    var pool = (DAILY_MESSAGES.weekday[now.getDay()] || []).concat(DAILY_MESSAGES.general);
    // پیام فصلی: هر ۳ روز یک‌بار واردِ چرخش شود
    var month = now.getMonth() + 1;
    var seasonKey = (month >= 3 && month <= 5) ? 'spring' : (month >= 6 && month <= 8) ? 'summer' : (month >= 9 && month <= 11) ? 'autumn' : 'winter';
    if (seed % 3 === 0) {
        pool = (DAILY_MESSAGES.season[seasonKey] || []).concat(pool);
    }
    return pool[seed % pool.length];
}

// ─── کارت تاروت روزانه — از بک‌اند (/api/v5/tarot/daily با ۷۸ کارت + تفسیر عمیق) ───
var TAROT_CARDS = []; // fallback قدیمی حذف شد — کارت روزانه از API می‌آید
var _dailyTarotCache = { at: 0, data: null };

function fetchDailyTarot() {
    if (_dailyTarotCache.data && (Date.now() - _dailyTarotCache.at) < 10 * 60 * 1000) {
        return Promise.resolve(_dailyTarotCache.data);
    }
    return fetch('/api/v5/tarot/daily')
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (d) {
            if (d && d.status === 'success' && d.data) {
                _dailyTarotCache = { at: Date.now(), data: d.data };
                return _dailyTarotCache.data;
            }
            return null;
        })
        .catch(function () { return null; });
}

// ─── بیوریتم — واقعی: روزهای سپری‌شده از تولد (مثل موتور بک‌اند) ───
function calcBiorhythm(daysSinceBirth) {
    var physical = Math.sin(2 * Math.PI * daysSinceBirth / 23) * 100;
    var emotional = Math.sin(2 * Math.PI * daysSinceBirth / 28) * 100;
    var intellectual = Math.sin(2 * Math.PI * daysSinceBirth / 33) * 100;
    return { physical: Math.round(physical), emotional: Math.round(emotional), intellectual: Math.round(intellectual) };
}

function getDaysSinceBirth() {
    var bd = window.sharedInputs && window.sharedInputs.birthDate;
    if (!bd || !bd.year || !bd.month || !bd.day) return null;
    var birth;
    if (window.shamsiToGregorianDate) {
        var g = window.shamsiToGregorianDate(bd.year, bd.month, bd.day);
        birth = new Date(g.gy, g.gm - 1, g.gd);
    } else {
        birth = new Date(bd.year, bd.month - 1, bd.day);
    }
    var diff = Math.floor((Date.now() - birth.getTime()) / 86400000);
    return (isNaN(diff) || diff < 0) ? null : diff;
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
    var daysSinceBio = getDaysSinceBirth();
    var bio = daysSinceBio !== null ? calcBiorhythm(daysSinceBio) : { physical: 0, emotional: 0, intellectual: 0 };
    var msg = pickDailyMessage();
    var events = getUpcomingSolarEvents(2);
    var solarDate = getSolarDate();

    var zodiacHtml = zodiac
        ? '<div class="dd-zodiac"><span class="dd-zodiac-emoji">' + zodiac.emoji + '</span><div><div class="dd-zodiac-name">' + animal + ' <span class="dd-zodiac-element" style="color:' + zodiac.elementColor + '">' + zodiac.element + '</span></div><div class="dd-zodiac-personality">' + zodiac.personality + '</div></div></div>'
        : '<div class="dd-zodiac dd-zodiac-empty"><span class="dd-zodiac-emoji">🐉</span><div><div class="dd-zodiac-name">تاریخ تولد ثبت نشده</div><div class="dd-zodiac-personality">برای فعال‌سازی، تاریخ تولد را وارد کنید</div></div></div>';

    /* ⚙️ تنظیمات تولد — ویرایش تاریخ تولد مستقیم از داشبورد
       (بازکردن DateWheelPicker، ذخیره در sharedInputs + پروفایل سرور) */
    var birthEditHtml =
        '<div class="dd-card dd-birth-edit">' +
            '<div class="dd-card-title">⚙️ تنظیمات تولد</div>' +
            '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">' +
                '<button id="ddBirthEditBtn" class="dd-birth-btn">📅 ' +
                    (window.sharedInputs && window.sharedInputs.birthDate
                        ? 'تغییر تاریخ تولد (' + (function(){ var b=window.sharedInputs.birthDate; var fa=function(n){return String(n).replace(/[0-9]/g,function(d){return '۰۱۲۳۴۵۶۷۸۹'[+d]});}; return fa(b.year)+'/'+fa(b.month)+'/'+fa(b.day); })() + ')'
                        : 'ثبت تاریخ تولد') +
                '</button>' +
                '<span style="font-size:11px;color:#8d93a8;">برای همه سرویس‌ها (چارت، بیوریتم، یوگا) به‌روز می‌شود</span>' +
            '</div>' +
        '</div>';

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
            birthEditHtml +
            '<div class="dd-card dd-tarot" id="ddTarotCard">' +
                '<div class="dd-card-title">🔮 فال امروز</div>' +
                '<div class="dd-yoga-loading">در حال آشکار شدن کارت روز…</div>' +
            '</div>' +
            (yogaHtml ? '<div class="dd-card">' + yogaHtml + '</div>' : '') +
            (isLoggedIn() ? '<div class="dd-card dd-yoga-stats" id="ddYogaStats"><div class="dd-card-title">🧘 سوابق یوگای من</div><div class="dd-yoga-loading">در حال بارگذاری…</div></div>' : '') +
            eventHtml +
        '</div>';

    // اعمال تم عنصر
    if (zodiac && zodiac.element) applyElementTheme(zodiac.element);

    // سوابق یوگا از دیتابیس (فقط کاربران واردشده)
    loadYogaStats();

    // کارت روزانه واقعی از بک‌اند
    fetchDailyTarot().then(function (t) {
        var host = document.getElementById('ddTarotCard');
        if (!host) return;
        if (!t) {
            host.innerHTML = '<div class="dd-card-title">🔮 فال امروز</div><div class="dd-yoga-loading">سرویس فال در دسترس نیست.</div>';
            return;
        }
        var card = t.card || {};
        var rev = t.is_reversed;
        var deep = t.deep_interp || '';
        var html = '<div class="dd-card-title">🔮 فال امروز</div>';
        html += '<div style="display:flex;align-items:flex-start;gap:14px;flex-wrap:wrap;">';
        if (card.image) {
            html += '<img src="' + card.image + '" alt="' + (card.name || '') + '" style="width:86px;border-radius:12px;' + (rev ? 'transform:rotate(180deg);' : '') + '" onerror="this.style.display=\'none\'">';
        }
        html += '<div style="flex:1;min-width:150px;">';
        html += '<div style="font-size:1.05rem;font-weight:800;color:var(--gold-300);">' + (card.name || '—') + ' <span style="font-size:0.72rem;font-weight:600;padding:2px 9px;border-radius:12px;background:' + (rev ? 'rgba(231,76,60,0.18);color:#e17055' : 'rgba(46,204,113,0.15);color:#2ecc71') + ';">' + (rev ? '🔄 وارونه' : '⬆️ راست') + '</span></div>';
        if (t.keywords && t.keywords.length) {
            html += '<div style="font-size:0.75rem;color:var(--ink-dim);margin-top:4px;">' + t.keywords.slice(0, 4).join(' · ') + '</div>';
        }
        if (t.deep_interp) {
            html += '<details style="margin-top:8px;"><summary style="color:var(--gold-300);cursor:pointer;font-size:0.82rem;">📜 تفسیر کامل</summary><div style="color:var(--ink-dim);line-height:1.9;font-size:0.82rem;margin-top:6px;padding:8px 12px;background:rgba(253,203,110,0.05);border-radius:8px;border-right:2px solid rgba(253,203,110,0.35);">' + t.deep_interp + '</div></details>';
        } else if (t.meaning) {
            html += '<div style="font-size:0.85rem;color:var(--ink-dim);margin-top:6px;line-height:1.9;">' + t.meaning + '</div>';
        }
        if (t.yes_no) {
            var yesFa = { yes: 'بله ✅', no: 'خیر ❌', maybe: 'شاید ⚖️' }[String(t.yes_no).toLowerCase()] || t.yes_no;
            html += '<div style="font-size:0.78rem;color:var(--ink-dim);margin-top:6px;">سؤالی داری؟ پاسخ کارت: <b style="color:var(--gold-300);">' + yesFa + '</b></div>';
        }
        html += '</div></div>';
        host.innerHTML = html;
    });
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
            var msg = pickDailyMessage();
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
    bindBirthEdit();

    // آپدیت هر ۵ ثانیه (اگر تاریخ تولد تغییر کرد)
    setInterval(function () { renderDashboard('dailyDashboard'); }, 5000);
}

/* ⚙️ ویرایش تاریخ تولد از داشبورد — event delegation روی کانتینر:
   renderDashboard هر ۵ ثانیه innerHTML را بازسازی می‌کند و دکمه‌ی
   re-bound از بین می‌رفت («قفل»). delegation مقاوم به re-render است. */
function bindBirthEdit() {
    var el = document.getElementById('dailyDashboard');
    if (!el || el._ddBirthBound) return;
    el._ddBirthBound = true;
    el.addEventListener('click', function (e) {
        var btn = e.target.closest('#ddBirthEditBtn');
        if (!btn) return;
        if (!window.DateWheelPicker) { if (window.showToast) window.showToast('انتخابگر تاریخ آماده نیست', 'error'); return; }
        var cur = (window.sharedInputs && window.sharedInputs.birthDate) || null;
        DateWheelPicker.open({
            calendarType: 'shamsi',
            digits: 'fa',
            defaultValue: cur || { year: 1379, month: 1, day: 1 },
            /* محدودیت سال برداشته شد */
            onSave: function (date) {
                if (!window.sharedInputs) window.sharedInputs = {};
                window.sharedInputs.birthDate = { year: date.year, month: date.month, day: date.day };
                try { localStorage.setItem('cosmic_shared_inputs', JSON.stringify(window.sharedInputs)); } catch (e) {}
                /* ثبت در پروفایل سرور (کاربر لاگین) */
                var token = null;
                try { token = localStorage.getItem('cosmic_token'); } catch (e) {}
                if (token && window.isoShamsiToGregorianISO) {
                    var iso = window.sharedInputs.birthDate.year + '-' +
                        String(window.sharedInputs.birthDate.month).padStart(2, '0') + '-' +
                        String(window.sharedInputs.birthDate.day).padStart(2, '0');
                    var gIso = window.isoShamsiToGregorianISO(iso);
                    var gp = gIso.split('-');
                    fetch('/api/v5/user/profile', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                        body: JSON.stringify({
                            birth_year: parseInt(gp[0]), birth_month: parseInt(gp[1]), birth_day: parseInt(gp[2])
                        })
                    }).catch(function () {});
                }
                /* هر ۵ ثانیه رندر می‌شود؛ برای فیدبک فوری یک‌بار همین حالا */
                renderDashboard('dailyDashboard');
                if (window.showToast) window.showToast('تاریخ تولد به‌روزرسانی شد ✅', 'success');
            }
        });
    });
}

return { init: init, renderDashboard: renderDashboard, applyElementTheme: applyElementTheme, resetTheme: resetTheme };
})();
