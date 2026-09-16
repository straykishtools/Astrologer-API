// ================================================================
//   ANIMATED BACKGROUND (Canvas)
// ================================================================
(function initBackground() {
    const canvas = document.getElementById('bg-canvas');
    const ctx = canvas.getContext('2d');
    let w, h;

    function resize() {
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    const stars = Array.from({ length: 260 }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.8 + 0.3,
        a: Math.random() * 0.6 + 0.2,
        v: Math.random() * 0.008 + 0.004,
        phase: Math.random() * Math.PI * 2
    }));

    const circles = Array.from({ length: 4 }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 120 + 60,
        dx: (Math.random() - 0.5) * 0.3,
        dy: (Math.random() - 0.5) * 0.3,
        color: `hsla(${Math.random() * 60 + 220}, 70%, 50%, 0.03)`
    }));

    function draw() {
        ctx.clearRect(0, 0, w, h);
        for (const s of stars) {
            s.phase += s.v;
            const alpha = s.a * (0.6 + 0.4 * Math.sin(s.phase));
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(220, 230, 255, ${alpha})`;
            ctx.fill();
        }
        for (const c of circles) {
            c.x += c.dx;
            c.y += c.dy;
            if (c.x < -c.r || c.x > w + c.r) c.dx *= -1;
            if (c.y < -c.r || c.y > h + c.r) c.dy *= -1;
            const grad = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.r);
            grad.addColorStop(0, c.color);
            grad.addColorStop(1, 'transparent');
            ctx.beginPath();
            ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
            ctx.fillStyle = grad;
            ctx.fill();
        }
        requestAnimationFrame(draw);
    }
    draw();
})();

// ================================================================
//   TRANSLATIONS
// ================================================================
const faMap = {
    Sun: 'خورشید',
    Moon: 'ماه',
    Mercury: 'عطارد',
    Venus: 'ناهید',
    Mars: 'مریخ',
    Jupiter: 'مشتری',
    Saturn: 'کیوان',
    Uranus: 'اورانوس',
    Neptune: 'نپتون',
    Pluto: 'پلوتون',
    Ari: 'حمل',
    Tau: 'ثور',
    Gem: 'جوزا',
    Can: 'سرطان',
    Leo: 'اسد',
    Vir: 'سنبله',
    Lib: 'میزان',
    Sco: 'عقرب',
    Sag: 'قوس',
    Cap: 'جدی',
    Aqu: 'دلو',
    Pis: 'حوت',
    First_House: 'اول',
    Second_House: 'دوم',
    Third_House: 'سوم',
    Fourth_House: 'چهارم',
    Fifth_House: 'پنجم',
    Sixth_House: 'ششم',
    Seventh_House: 'هفتم',
    Eighth_House: 'هشتم',
    Ninth_House: 'نهم',
    Tenth_House: 'دهم',
    Eleventh_House: 'یازدهم',
    Twelfth_House: 'دوازدهم',
    conjunction: 'مقارنه',
    opposition: 'مقابله',
    trine: 'تثلیث',
    square: 'تربیع',
    sextile: 'تسدیس',
    quintile: 'تخمیس',
    'True_North_Lunar_Node': 'گره شمالی',
    'True_South_Lunar_Node': 'گره جنوبی',
    'Mean_Lilith': 'لیلیت',
    Ascendant: 'ASC',
    Medium_Coeli: 'MC',
    Descendant: 'DSC',
    Imum_Coeli: 'IC',
    Chiron: 'کایرون',
    Ketu: 'کیتو',
    Rahu: 'راهو',
};

function translate(text) {
    if (!text) return text;
    const trimmed = text.toString().trim();
    return faMap[trimmed] || faMap[trimmed.toLowerCase()] || trimmed;
}

function signEmoji(sign) {
    const map = {
        'Ari': '♈',
        'Tau': '♉',
        'Gem': '♊',
        'Can': '♋',
        'Leo': '♌',
        'Vir': '♍',
        'Lib': '♎',
        'Sco': '♏',
        'Sag': '♐',
        'Cap': '♑',
        'Aqu': '♒',
        'Pis': '♓'
    };
    return map[sign] || '';
}

function getNatureClass(nature) {
    if (!nature) return '';
    const n = nature.toLowerCase();
    if (n.includes('benefic')) return 'nature-benefic';
    if (n.includes('malefic')) return 'nature-malefic';
    return 'nature-neutral';
}

function simpleFunctionalNature(nature, type) {
    const nm = {
        'Benefic (Yoga Karaka)': '🍀 بسیار خوش‌یمن و شانس‌آور',
        'Benefic': '☀️ خوش‌یمن',
        'Malefic': '⚠️ چالش‌برانگیز',
        'Neutral': '⚖️ خنثی',
        'Mixed / Neutral': '⚖️ ترکیبی'
    };
    const tm = {
        'Yoga Karaka': 'موفقیت‌آور',
        'Kendra Lord': 'در جایگاه قدرت',
        'Trikona Lord': 'شانس‌آور',
        'Dusthana Lord': 'چالش‌زا',
        'Maraka': 'تأثیرگذار در تصمیمات',
        'Mixed': 'ترکیبی'
    };
    let r = nm[nature] || nature;
    if (type && tm[type]) r += ` — ${tm[type]}`;
    return r;
}

function simplePlanetaryStrength(status) {
    const map = {
        'Uchcha': '🌟 شرف (بسیار قوی)',
        'Moolatrikona': '🌟 مولاتریکونا (بسیار قوی)',
        'Own Sign': '✅ برج خود',
        'Friend': '🤝 برج دوست',
        'Neutral': '⚖️ برج بی‌طرف',
        'Enemy': '⚠️ برج دشمن',
        'Neecha': '🌙 هبوط (ضعیف)',
        'Unknown': '❓ نامشخص'
    };
    return map[status] || status;
}

function getElementInterpretation(element, percentage) {
    const map = {
        'fire': {
            name: 'آتش',
            desc: 'انرژی، اشتیاق، خلاقیت و رهبری. شما فردی پرشور و الهام‌بخش هستید.'
        },
        'earth': {
            name: 'خاک',
            desc: 'عملگرایی، پایداری، مسئولیت‌پذیری. شما فردی عملی و قابل‌اعتماد هستید.'
        },
        'air': {
            name: 'هوا',
            desc: 'ارتباطات، تفکر، اجتماع. شما فردی اجتماعی و اهل تعامل هستید.'
        },
        'water': {
            name: 'آب',
            desc: 'احساسات، شهود، همدلی. شما فردی حساس و عمیقاً شهودی هستید.'
        }
    };
    const el = map[element] || { name: element, desc: '' };
    return `${el.name} ${percentage}% — ${el.desc}`;
}

function getMoonPhaseInterpretation(phaseName) {
    const map = {
        'New Moon': '🌑 شروع تازه، آغاز پروژه‌ها، انرژی نهفته',
        'Waxing Crescent': '🌒 رشد، برنامه‌ریزی، حرکت به سمت اهداف',
        'First Quarter': '🌓 تصمیم‌گیری، اقدام، غلبه بر موانع',
        'Waxing Gibbous': '🌔 تکمیل، صیقل دادن، آماده‌سازی برای نمایش',
        'Full Moon': '🌕 اوج، روشنایی، تکمیل، شفافیت',
        'Waning Gibbous': '🌖 قدردانی، اشتراک‌گذاری، انتشار',
        'Last Quarter': '🌗 بازنگری، رها کردن، پایان‌بندی',
        'Waning Crescent': '🌘 استراحت، تأمل، جمع‌آوری انرژی'
    };
    return map[phaseName] || phaseName;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ================================================================
//   TOOLTIP & INFO SECTION HELPERS
// ================================================================
var TOOLTIPS = {
    tropical: 'Tropical (zodiac) is based on seasons and the vernal equinox. The most common system in Western astrology.',
    sidereal: 'Sidereal zodiac is based on fixed star positions. Used in Vedic (Indian) astrology.',
    placidus: 'Placidus is the most common house system, calculated based on birth time and location.',
    koch: 'Koch is an alternative house system popular in Germany and Eastern Europe.',
    whole_sign: 'Whole Sign: each zodiac sign is one house. An ancient and simple system.',
    synastry: 'Synastry: comparing two birth charts to assess emotional, professional, and friendship compatibility.',
    composite: 'Composite: merging two birth charts into one to reveal the identity of the relationship itself.',
    transit: 'Transit: the current positions of planets and their effect on your birth chart.',
    solar_return: 'Solar Return: a chart cast when the Sun returns to its natal position, showing the year ahead.',
    lunar_return: 'Lunar Return: a chart cast when the Moon returns to its natal position, showing the emotional month ahead.',
    biorhythm: 'Biorhythm: 23, 28, and 33-day cycles representing your physical, emotional, and intellectual states.',
    temperaments: 'Temperament (Mizaj): your body type based on traditional Iranian medicine (hot, cold, wet, dry).',
    abjad: 'Abjad: a numerical system for Arabic letters used to calculate the numeric value of words and names.',
    numerology: 'Numerology: the study of numbers and their influence on personality and destiny.',
    chinese_zodiac: 'Chinese Zodiac: determines your animal and element based on your birth year in the Chinese calendar.'
};

function makeHelpIcon(key) {
    var tip = TOOLTIPS[key] || key;
    return '<span class="help-icon">؟<span class="tooltip-text">' + tip + '</span></span>';
}

function makeInfoSection(title, text) {
    return '<div class="info-section"><div class="info-title">ℹ️ ' + title + '</div><p>' + text + '</p></div>';
}

var TAB_INFO = {
    'birth': { title: 'چارت تولد', text: 'با وارد کردن تاریخ، مکان و زمان تولد، چارت کامل نجومی خود را دریافت کنید. این چارت پایه تمام تحلیل‌های دیگر است.' },
    'synastry': { title: 'سیناستری', text: 'دو چارت تولد را با هم مقایسه کنید و میزان سازگاری عاطفی، کاری و دوستانه خود را با دیگری بسنجید.' },
    'composite': { title: 'کامپوزیت', text: 'چارت ترکیبی دو نفر را محاسبه کنید تا هویت و شخصیت رابطه‌تان را بهتر بشناسید.' },
    'transit': { title: 'ترانزیت', text: 'تأثیر سیارات در حال حرکت بر زندگی امروز شما را بررسی کنید و زمان‌های مناسب برای اقدام را پیدا کنید.' },
    'solar-return': { title: 'بازگشت خورشیدی', text: 'نقشه سالانه خود را دریافت کنید و ببینید سال آینده در چه حوزه‌هایی موفق‌تر خواهید بود.' },
    'lunar-return': { title: 'بازگشت ماهانه', text: 'تمرکز عاطفی و موضوعات مهم ماه آینده را کشف کنید و برنامه‌ریزی بهتری داشته باشید.' },
    'mizaj': { title: 'مزاج‌شناسی', text: 'طبع خود را بر اساس طب سنتی ایرانی شناسایی کنید و توصیه‌های غذایی و سبک زندگی متناسب دریافت کنید.' },
    'abjad': { title: 'ابجد', text: 'ارزش عددی کلمات و نام‌ها را محاسبه کنید و سازگاری دو نام را بررسی کنید.' },
    'tarot': { title: 'تاروت', text: 'کارت‌های تاروت را بکشید و پیام‌های آنها را برای هدایت در زندگی دریافت کنید.' },
    'numerology': { title: 'عددشناسی', text: 'اعداد مسیر زندگی، سال شخصی، عدد بیان و درونی خود را محاسبه کنید و شخصیت خود را بهتر بشناسید.' },
    'biorhythm': { title: 'بیوریتم', text: 'چرخه‌های فیزیکی، عاطفی و ذهنی خود را در هر روز ببینید و برنامه‌ریزی کنید.' },
    'zodiac': { title: 'سال حیوانی چینی', text: 'حیوان و عنصر سال تولد خود را پیدا کنید و شخصیت و سازگاری‌های خود را بررسی کنید.' },
    'daily-question': { title: 'پرسش روزانه', text: 'یک سوال بپرسید و پاسخ ترکیبی از بیوریتم، سال حیوانی و تاروت را دریافت کنید.' },
    'hafez': { title: 'فال حافظ', text: 'فال حافظ بگیرید و غزل تصادفی دیوان حافظ را با تفسیر دریافت کنید. کاملاً آفلاین و بدون نیاز به اینترنت.' },
    'nasa': { title: 'ناسا', text: 'تصویر نجومی روز، تصاویر فضایی، آب و هوای فضا، سیارک‌ها و موقعیت سیارات را مشاهده کنید.' },
    'moon-phase': { title: 'فاز ماه', text: 'فاز ماه و منازل قمری را بر اساس تاریخ انتخابی مشاهده کنید. زمان‌های مناسب برای فعالیت‌های مختلف را بر اساس موقعیت ماه در آسمان پیدا کنید.' }
};

// ================================================================
//   CITY DATABASE & COORDINATES
// ================================================================
const CITY_DB = {
    'تهران': { lat: 35.6892, lng: 51.3890, tz: 3.5 },
    'مشهد': { lat: 36.2605, lng: 59.6168, tz: 3.5 },
    'اصفهان': { lat: 32.6546, lng: 51.6680, tz: 3.5 },
    'شیراز': { lat: 29.5918, lng: 52.5837, tz: 3.5 },
    'تبریز': { lat: 38.0800, lng: 46.2919, tz: 3.5 },
    'اهواز': { lat: 31.3183, lng: 48.6706, tz: 3.5 },
    'کرج': { lat: 35.8400, lng: 50.9391, tz: 3.5 },
    'قم': { lat: 34.6399, lng: 50.8759, tz: 3.5 },
    'کرمانشاه': { lat: 34.3142, lng: 47.0650, tz: 3.5 },
    'ارومیه': { lat: 37.5553, lng: 45.0725, tz: 3.5 },
    'رشت': { lat: 37.2682, lng: 49.5891, tz: 3.5 },
    'یزد': { lat: 31.8974, lng: 54.3569, tz: 3.5 },
    'سنندج': { lat: 35.3024, lng: 46.9957, tz: 3.5 },
    'بندرعباس': { lat: 27.1832, lng: 56.2669, tz: 3.5 },
    'کرمان': { lat: 30.2839, lng: 57.0834, tz: 3.5 },
    'زاهدان': { lat: 29.4964, lng: 60.8629, tz: 3.5 },
    'همدان': { lat: 34.7608, lng: 48.3986, tz: 3.5 },
    'اراک': { lat: 34.0954, lng: 49.6941, tz: 3.5 },
    'لندن': { lat: 51.5074, lng: -0.1278, tz: 0 },
    'نیویورک': { lat: 40.7128, lng: -74.0060, tz: -5 },
    'دبی': { lat: 25.2048, lng: 55.2708, tz: 4 },
    'استانبول': { lat: 41.0082, lng: 28.9784, tz: 3 },
};

// UTC offset -> IANA timezone mapping (for the dropdown)
const TZ_OFFSET_TO_IANA = {
    '-12': 'Etc/GMT+12',
    '-11': 'Pacific/Pago_Pago',
    '-10': 'Pacific/Honolulu',
    '-9': 'America/Anchorage',
    '-8': 'America/Los_Angeles',
    '-7': 'America/Denver',
    '-6': 'America/Chicago',
    '-5': 'America/New_York',
    '-4': 'America/Caracas',
    '-3': 'America/Argentina/Buenos_Aires',
    '-2': 'Atlantic/South_Georgia',
    '-1': 'Atlantic/Azores',
    '0': 'Etc/UTC',
    '1': 'Europe/Paris',
    '2': 'Europe/Athens',
    '3': 'Europe/Moscow',
    '3.5': 'Asia/Tehran',
    '4': 'Asia/Baku',
    '4.5': 'Asia/Kabul',
    '5': 'Asia/Tashkent',
    '5.5': 'Asia/Kolkata',
    '5.75': 'Asia/Kathmandu',
    '6': 'Asia/Dhaka',
    '6.5': 'Asia/Yangon',
    '7': 'Asia/Bangkok',
    '8': 'Asia/Shanghai',
    '9': 'Asia/Tokyo',
    '9.5': 'Australia/Adelaide',
    '10': 'Australia/Sydney',
    '11': 'Pacific/Guadalcanal',
    '12': 'Pacific/Auckland',
    '13': 'Pacific/Tongatapu',
};

async function getCoordinates(cityName) {
    if (!cityName) return null;
    const trimmed = cityName.trim();
    const found = Object.keys(CITY_DB).find(key => key.includes(trimmed) || trimmed.includes(key));
    if (found) {
        const d = CITY_DB[found];
        return { lat: d.lat, lng: d.lng, tz: d.tz, city: found };
    }
    try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(trimmed)}&format=json&limit=1`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Nominatim error');
        const data = await res.json();
        if (data && data.length > 0) {
            const lat = parseFloat(data[0].lat);
            const lng = parseFloat(data[0].lon);
            const tz = lng >= -12.5 && lng < -7.5 ? -5 :
                lng >= -7.5 && lng < -2.5 ? -4 :
                lng >= -2.5 && lng < 2.5 ? 0 :
                lng >= 2.5 && lng < 7.5 ? 1 :
                lng >= 7.5 && lng < 12.5 ? 2 :
                lng >= 12.5 && lng < 17.5 ? 3 :
                lng >= 17.5 && lng < 22.5 ? 4 :
                lng >= 22.5 && lng < 27.5 ? 5 :
                lng >= 27.5 && lng < 32.5 ? 6 :
                lng >= 32.5 && lng < 37.5 ? 7 :
                lng >= 37.5 && lng < 42.5 ? 8 :
                lng >= 42.5 && lng < 47.5 ? 9 :
                lng >= 47.5 && lng < 52.5 ? 10 :
                lng >= 52.5 && lng < 57.5 ? 11 :
                lng >= 57.5 ? 12 : 0;
            return { lat, lng, tz, city: data[0].display_name.split(',')[0] };
        }
    } catch (_) {}
    return null;
}

// ================================================================
//   MAP MODULE
// ================================================================
let mapInstance = null;
let marker = null;
let isMapReady = false;
var _mapPrefix = ''; // Which prefix's fields to update (e.g. '', 'p1_', 'p2_')

const mapModal = document.getElementById('mapModal');
const openMapBtn = document.getElementById('openMapBtn');
const closeMapBtn = document.getElementById('closeMapModal');
const confirmLocationBtn = document.getElementById('confirmLocationBtn');

function initMap() {
    if (isMapReady) return;
    
    var p = _mapPrefix;
    var latEl = document.getElementById(p + 'lat') || document.getElementById('latitude');
    var lngEl = document.getElementById(p + 'lng') || document.getElementById('longitude');
    var defaultLat = parseFloat(latEl ? latEl.value : 35.6892) || 35.6892;
    var defaultLng = parseFloat(lngEl ? lngEl.value : 51.3890) || 51.3890;

    mapInstance = L.map('map').setView([defaultLat, defaultLng], 10);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(mapInstance);

    marker = L.marker([defaultLat, defaultLng], { draggable: true }).addTo(mapInstance);

    mapInstance.on('click', function(e) {
        updateLocation(e.latlng.lat, e.latlng.lng);
    });

    marker.on('dragend', function(e) {
        var pos = marker.getLatLng();
        updateLocation(pos.lat, pos.lng);
    });

    isMapReady = true;
}

function openMapForPrefix(prefix) {
    _mapPrefix = prefix || '';
    mapModal.classList.add('active');
    if (!isMapReady) {
        setTimeout(initMap, 300);
    } else {
        // Reposition marker to current coordinates for this prefix
        var p = _mapPrefix;
        var latEl = document.getElementById(p + 'lat') || document.getElementById('latitude');
        var lngEl = document.getElementById(p + 'lng') || document.getElementById('longitude');
        var lat = parseFloat(latEl ? latEl.value : 35.6892) || 35.6892;
        var lng = parseFloat(lngEl ? lngEl.value : 51.3890) || 51.3890;
        marker.setLatLng([lat, lng]);
        mapInstance.setView([lat, lng], 10);
    }
}
window.openMapForPrefix = openMapForPrefix;

async function updateLocation(lat, lng) {
    var p = _mapPrefix;
    var latEl = document.getElementById(p + 'lat') || document.getElementById('latitude');
    var lngEl = document.getElementById(p + 'lng') || document.getElementById('longitude');
    
    // Map only fills lat/lng — city name is managed by the city selector dropdown
    if (latEl) latEl.value = lat.toFixed(6);
    if (lngEl) lngEl.value = lng.toFixed(6);
    
    marker.setLatLng([lat, lng]);
}

// ================================================================
//   HEADER ACTIONS
// ================================================================
// ─── Actions Dropdown / Profile Dropdown: مدیریت توسط TOPBAR DROPDOWN COORDINATOR در index.html ───
// (هندلرهای قدیمی حذف شدند — دوبار toggle باعث می‌شد پنل‌ها باز به نظر نرسند)
(function() {
    var menu = document.getElementById('actionsMenu');
    if (menu) {
        menu.querySelectorAll('.topbar-actions-item').forEach(function(item) {
            item.addEventListener('click', function() {
                menu.classList.remove('open');
            });
        });
    }
})();

document.getElementById('saveBtn').addEventListener('click', () => {
    const content = document.getElementById('result');
    if (!content || content.style.display === 'none') {
        alert('لطفاً ابتدا چارت را محاسبه کنید.');
        return;
    }
    const blob = new Blob([content.innerHTML], { type: 'text/html' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `cosmic-oracle-chart-${new Date().toISOString().slice(0,10)}.html`;
    link.click();
    URL.revokeObjectURL(link.href);
});

document.getElementById('printBtn').addEventListener('click', () => {
    const content = document.getElementById('result');
    if (!content || content.style.display === 'none') {
        alert('لطفاً ابتدا چارت را محاسبه کنید.');
        return;
    }
    const win = window.open('', '_blank');
    win.document.write(`
        <html><head><title>Cosmic Oracle - چارت</title>
        <style>
            body { font-family: 'Tahoma', sans-serif; direction: rtl; padding: 20px; background: #0b0d1a; color: #e8e4f0; }
            ${document.querySelector('style').innerHTML}
            .container { max-width: 1100px; margin: auto; }
        </style>
        </head><body>
        <div class="container">${content.innerHTML}</div>
        <script>
            window.onload = function() { window.print(); }
        <\/script>
        </body></html>
    `);
    win.document.close();
});

document.getElementById('shareBtn').addEventListener('click', () => {
    const content = document.getElementById('result');
    if (!content || content.style.display === 'none') {
        alert('لطفاً ابتدا چارت را محاسبه کنید.');
        return;
    }
    if (navigator.share) {
        navigator.share({
            title: 'چارت تولد من - Cosmic Oracle',
            text: 'چارت تولد من رو ببین!',
            url: window.location.href
        }).catch(() => {});
    } else {
        alert('📋 لینک این صفحه را کپی کنید و با دوستان خود به اشتراک بگذارید.');
        navigator.clipboard?.writeText(window.location.href).then(() => {
            alert('✅ لینک کپی شد!');
        }).catch(() => {});
    }
});





function getScoreColorClass(score) {
    if (score <= 30) return 'score-red';
    if (score <= 60) return 'score-yellow';
    return 'score-green';
}

// ── نگاشت جنبه‌های سیناستری/کامپوزیت به گلایف‌های SVG ──
var ASPECT_GLYPHS = {
    '⭐': 'star', '⚡': 'bolt', '🏠': 'home', '🔮': 'birth', '🔥': 'fire',
    '💕': 'synastry', '🔗': 'composite',
    'emotional': 'heart', 'intellectual': 'brain', 'spiritual': 'spirit'
};
function aspectIcon(key, size) {
    var n = ASPECT_GLYPHS[key];
    if (n) return window.uiIcon(n, size || 20);
    // اگر خودِ کلید نام یک آیکون SVG باشد مستقیم استفاده کن
    if (key && /^[a-z-]+$/.test(key)) return window.uiIcon(key, size || 20);
    return '';
}

function displayGenericChart(data, title, chartType) {
    var chart = data.chart_data || data;
    var subject = chart.subject || {};
    var html = '<div class="section-card visible"><div class="section-title"><span class="emoji-big">\u{1f30d}</span> '+title+'</div><div class="grid-masonry">';
    if (subject.first_subject || subject.inner_subject) {
        var s1 = subject.first_subject || subject.inner_subject;
        var s2 = subject.second_subject || subject.outer_subject;
        html += '<div class="person-label">\u{1f464} \u0634\u062e\u0635 \u0627\u0648\u0644</div>' + renderPlanetGrid(s1);
        html += '<div class="person-label">\u{1f464} \u0634\u062e\u0635 \u062f\u0648\u0645</div>' + renderPlanetGrid(s2);
    } else {
        html += renderPlanetGrid(subject);
    }
    html += '</div></div>';
        if (chart.relationship_score || chartType === 'composite') {
        var rs = chart.relationship_score || null;
        var score = rs ? (rs.score_value || rs.score || 0) : (data.total_score || data.composite_score || 0);
        var isComposite = (chartType === 'composite');
        // Use backend interpretation if available
        var backendInterp = data.interpretation;
        var interp = backendInterp && backendInterp.level ? backendInterp : {level: score + '/100', title: 'امتیاز', text: 'امتیاز شما ' + score + ' از ۱۰۰ است.'};
        var colorCls = getScoreColorClass(score);
        var sectionEmoji = aspectIcon(isComposite ? '🔗' : '💕');
        var sectionTitle = isComposite ? '\u0647ویت \u0631\u0627\u0628\u0637\u0647' : '\u0627\u0645\u062a\u06cc\u0627\u0632';
        html += '<div class="section-card visible synastry-result"><div class="section-title"><span class="emoji-big">' + sectionEmoji + '</span> ' + sectionTitle + '</div>';
        html += '<div class="score-display"><span class="score-number ' + colorCls + '">' + score + '</span><span class="score-label">\u0627\u0632 \u06f1\u06f0\u06f0</span></div>';
        html += '<div class="score-progress-wrap"><div class="score-progress-track"><div class="score-progress-fill ' + colorCls + '" style="width:0%" data-target="' + score + '"></div></div></div>';
        html += '<div class="interp-title">' + interp.title + '</div>';
        html += '<div class="interp-level">' + interp.level + '</div>';
        html += '<p class="interp-text">' + interp.text + '</p>';
        // Show composite categories for composite charts
        if (isComposite && chart.subject) {
            var cats = data.composite_categories || {};
            var avgScore = Math.round((cats.emotional.score + cats.intellectual.score + cats.spiritual.score) / 3);
            var summary = data.composite_summary || '';
            html += '<div class="composite-categories">';
            // House-based description for composite
            var houseDesc = data.composite_house_description || '';
            if (houseDesc) {
                html += '<div class="composite-house-desc">' + houseDesc + '</div>';
            }
            // Strongest & weakest aspect cards
            var allDetails = [].concat(cats.emotional.details, cats.intellectual.details, cats.spiritual.details);
            if (allDetails.length > 0) {
                allDetails.sort(function(a,b) { return Math.abs(b.delta) - Math.abs(a.delta); });
                var strongest = allDetails[0];
                var weakest = allDetails[allDetails.length - 1];
                html += '<div class="cat-sw-cards">';
                html += '<div class="cat-sw-card cat-sw-strong"><span class="cat-sw-icon">💪</span><div class="cat-sw-content"><div class="cat-sw-label">قویترین جنبه</div><div class="cat-sw-text">' + strongest.text + '</div><div class="cat-sw-delta cat-detail-positive">+' + strongest.delta + '</div></div></div>';
                html += '<div class="cat-sw-card cat-sw-weak"><span class="cat-sw-icon">⚠️</span><div class="cat-sw-content"><div class="cat-sw-label">نقطه ضعف</div><div class="cat-sw-text">' + weakest.text + '</div><div class="cat-sw-delta cat-detail-negative">' + weakest.delta + '</div></div></div>';
                html += '</div>';
            }
            // Radar chart
            html += '<div class="cat-radar-wrap"><svg class="cat-radar-svg" viewBox="0 0 200 200">';
            var cx = 100, cy = 100, maxR = 75;
            var angles = [-90, 30, 150]; // emotional=top, intellectual=bottom-right, spiritual=bottom-left
            var labels = ['عاطفی', 'فکری', 'معنوی'];
            var colors = ['#ff6b8a', '#74b9ff', '#a29bfe'];
            var scores = [cats.emotional.score, cats.intellectual.score, cats.spiritual.score];
            // Grid circles
            [0.25,0.5,0.75,1].forEach(function(f) {
                html += '<circle cx="' + cx + '" cy="' + cy + '" r="' + (maxR*f) + '" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="0.5"/>';
            });
            // Grid lines + labels
            angles.forEach(function(a, i) {
                var rad = a * Math.PI / 180;
                var x2 = cx + maxR * Math.cos(rad);
                var y2 = cy + maxR * Math.sin(rad);
                html += '<line x1="' + cx + '" y1="' + cy + '" x2="' + x2 + '" y2="' + y2 + '" stroke="rgba(255,255,255,0.06)" stroke-width="0.5"/>';
                var lx = cx + (maxR + 16) * Math.cos(rad);
                var ly = cy + (maxR + 16) * Math.sin(rad);
                html += '<text x="' + lx + '" y="' + ly + '" text-anchor="middle" dominant-baseline="middle" fill="#aaa" font-size="9" font-family="Vazirmatn,sans-serif">' + labels[i] + '</text>';
            });
            // Data polygon
            var pts = scores.map(function(s, i) {
                var rad = angles[i] * Math.PI / 180;
                var r = maxR * (s / 100);
                return (cx + r * Math.cos(rad)) + ',' + (cy + r * Math.sin(rad));
            }).join(' ');
            html += '<polygon points="' + pts + '" fill="rgba(162,155,254,0.15)" stroke="#a29bfe" stroke-width="1.5"/>';
            // Data dots + score labels
            scores.forEach(function(s, i) {
                var rad = angles[i] * Math.PI / 180;
                var r = maxR * (s / 100);
                var dx = cx + r * Math.cos(rad);
                var dy = cy + r * Math.sin(rad);
                html += '<circle cx="' + dx + '" cy="' + dy + '" r="4" fill="' + colors[i] + '" stroke="white" stroke-width="1"/>';
                html += '<text x="' + dx + '" y="' + (dy - 8) + '" text-anchor="middle" fill="' + colors[i] + '" font-size="10" font-weight="bold" font-family="Vazirmatn,sans-serif">' + s + '</text>';
            });
            // Center dot
            html += '<circle cx="' + cx + '" cy="' + cy + '" r="3" fill="rgba(162,155,254,0.5)"/>';
            html += '</svg></div>';
            html += '<h4 class="composite-cats-title">\u0628\u0631\u0631\u0633\u06cc \u0631\u0627\u0628\u0637\u0647</h4>';
            html += '<div class="composite-summary">' + summary + '</div>';
            ['emotional','intellectual','spiritual'].forEach(function(key, idx) {
                var cat = cats[key];
                var catId = 'cat-detail-' + idx;
                html += '<div class="cat-item">';
                html += '<div class="cat-header cat-toggle" data-target="' + catId + '">';
                html += '<span class="cat-emoji">' + (ASPECT_GLYPHS[key] ? aspectIcon(key, 18) : cat.emoji) + '</span>';
                html += '<span class="cat-label">' + cat.label + '</span>';
                html += '<span class="cat-score" style="color:' + cat.color + '">' + cat.score + '/100</span>';
                html += '<span class="cat-expand-icon">▶</span>';
                html += '</div>';
                html += '<div class="cat-bar-track"><div class="cat-bar-fill" style="width:' + cat.score + '%;background:' + cat.color + '"></div></div>';
                html += '<div class="cat-desc">' + cat.desc + '</div>';
                // Expandable detail panel
                html += '<div class="cat-detail-panel" id="' + catId + '">';
                if (cat.details && cat.details.length > 0) {
                    html += '<div class="cat-detail-list">';
                    cat.details.forEach(function(d) {
                        var cls = d.positive ? 'cat-detail-positive' : 'cat-detail-negative';
                        var sign = d.positive ? '+' : '';
                        html += '<div class="cat-detail-row ' + cls + '">';
                        var icon = d.positive ? '\u2705' : '\u274c';
                        html += '<span class="cat-detail-icon">' + icon + '</span>';
                        html += '<span class="cat-detail-text">' + d.text + '</span>';
                        html += '<span class="cat-detail-delta">' + sign + d.delta + '</span>';
                        html += '</div>';
                    });
                    html += '</div>';
                } else {
                    html += '<div class="cat-detail-empty">\u062a\u0648\u0636\u06cc\u062d \u062e\u0627\u0635\u06cc \u0628\u0631\u0627\u06cc \u0627\u06cc\u0646 \u0628\u0631\u0631\u0633\u06cc \u06cc\u0627\u0641\u062a \u0646\u0634\u062f</div>';
                }
                html += '</div>';
                html += '</div>';
            });
            html += '</div>';
        }
        if (rs && rs.score_breakdown && rs.score_breakdown.length > 0) {
            // ── XSS escape helper ──
            var _esc = function(s) { var d = document.createElement('div'); d.appendChild(document.createTextNode(s || '')); return d.innerHTML; };
            // ── Rule explanations (Persian) ──
            var ruleExplanations = {
                'destiny_sign': 'هر دو نفر در یک نشان سرنوشت‌ساز قرار دارند — پیوندی عمیق و معنوی که فراتر از زندگی روزمره است.',
                'sun_sun_major': 'خورشید هر دو نفر در یک عنصر مشترک (آتش/خاک/هوا/آب) است — درک عمیقی از ماهیت یکدیگر دارید.',
                'sun_sun_minor': 'خورشیدهای شما در عناصر مکمل قرار دارند — تفاوت‌هایتان مکمل یکدیگرند.',
                'sun_sun_quality': 'هر دو خورشید در یک کیفیت (کاردینال/fixed/ changing) هستید — سبک عملکرد شما مشابه است.',
                'moon_moon': 'ماه‌های شما در یک نشان مشترک یا سازگار هستند — از نظر احساسی هماهنگید.',
                'venus_mars': 'ونوس شما با مریخ دیگری در ارتباط است — جذابیت و کشش عاطفی قوی.',
                'sun_moon_conjunction': 'خورشید یکی با ماه دیگری هماهنگ است — حمایت احساسی عمیق بین شما.',
                'sun_moon_other': 'خورشید و ماه شما در جنبه سازگار هستند — درک متقابل عاطفی وجود دارد.',
                'sun_ascendant': 'خورشید شما با طالع دیگری هماهنگ است — نحوه برخورد شما با دنیا مکمل است.',
                'moon_ascendant': 'ماه شما با طالع دیگری هماهنگ است — پیوند احساسی عمیقی دارید.',
                'ascendant_compatibility': 'طالع‌های شما سازگار هستند — نحوه برخورد شما با دنیا مشابه یا مکمل است.',
                'saturn_hard': 'کیوان در جنبه‌های سخت بین شماست — چالش‌هایی وجود دارد که با صبر قابل حل است.',
                'pluto_power': 'پلوتون در ارتباط قوی است — تغییرات عمیق و تحول‌آفرین در رابطه.',
                'neptune_dream': 'نپتون خلاقیت و معنویت را تقویت می‌کند — رابطه‌ای رویایی و الهام‌بخش.',
                'uranus_change': 'اورانوس هیجان و تغییر را به رابطه می‌آورد — غیرقابل پیش‌بینی و مهیج.',
                'aspect_trine': 'تثلیث بین سیارات — جریان انرژی روان و آسان بین شما.',
                'aspect_sextile': 'تسدیس — فرصت‌های رشد و همکاری در رابطه.',
                'aspect_square': 'تربیع — چالش‌هایی که رشد شخصی را تقویت می‌کنند.',
                'aspect_opposition': 'مقابله — کشش و مکمل بودن، نیاز به تعادل.',
                'aspect_conjunction': 'مقارنه — قدرتمندترین جنبه، ترکیب انرژی دو سیاره.',
                'house_comparison': ' مقایسه خانه‌ها — حوزه‌های زندگی که بیشترین تعامل را دارید.',
                'element_balance': 'تعادل عناصر — تنوع یا تمرکز عناصر چهارگانه در رابطه.',
                'default': 'این قانون بر اساس تحلیل اختری بین دو چارت تولد محاسبه شده است.'
            };
            // ── Category mapping ──
            var ruleCategories = {
                'destiny_sign': 0, 'sun_sun_major': 0, 'sun_sun_minor': 0, 'sun_sun_quality': 0,
                'sun_moon_conjunction': 0, 'sun_moon_other': 0,
                'moon_moon': 0, 'venus_mars': 0,
                'sun_ascendant': 1, 'moon_ascendant': 1,
                'aspect_trine': 1, 'aspect_sextile': 1, 'aspect_square': 1,
                'aspect_opposition': 1, 'aspect_conjunction': 1,
                'ascendant_compatibility': 2, 'house_comparison': 2,
                'saturn_hard': 3, 'pluto_power': 3, 'neptune_dream': 3, 'uranus_change': 3,
                'element_balance': 4
            };
            var catNames = ['جنبه‌های اصلی', 'جنبه‌های سیاره‌ای', 'خانه‌ها و طالع', 'سیارات فراسویی', 'تعادل عناصر'];
            var catEmojis = ['star', 'bolt', 'home', 'birth', 'fire'];
            // ── Group items by category ──
            var groups = {};
            var ordered = [];
            rs.score_breakdown.forEach(function(b) {
                var cat = ruleCategories[b.rule] !== undefined ? ruleCategories[b.rule] : 4;
                if (!groups[cat]) { groups[cat] = []; ordered.push(cat); }
                groups[cat].push(b);
            });
            // ── Summary stats ──
            var totalPos = 0, totalNeg = 0;
            rs.score_breakdown.forEach(function(b) { if (b.points > 0) totalPos += b.points; else totalNeg += b.points; });
            html += '<div class="score-breakdown">';
            html += '<h4>\u062c\u0632\u0626\u06cc\u0627\u062a \u0627\u0645\u062a\u06cc\u0627\u0632</h4>';
            html += '<div class="breakdown-summary">';
            html += '<div class="breakdown-sum-item breakdown-sum-pos"><span class="breakdown-sum-icon">✅</span><span>نقاط مثبت</span><span class="breakdown-sum-val">+' + totalPos + '</span></div>';
            html += '<div class="breakdown-sum-item breakdown-sum-neg"><span class="breakdown-sum-icon">⚠️</span><span>نقاط منفی</span><span class="breakdown-sum-val">' + totalNeg + '</span></div>';
            html += '<div class="breakdown-sum-item breakdown-sum-total"><span class="breakdown-sum-icon">📊</span><span>مجموع</span><span class="breakdown-sum-val">' + (totalPos + totalNeg) + '</span></div>';
            html += '</div>';
            // ── Render each category ──
            ordered.forEach(function(cat) {
                var items = groups[cat];
                html += '<div class="breakdown-category">';
                html += '<div class="breakdown-cat-header">';
                html += '<span class="breakdown-cat-emoji">' + (catEmojis[cat] ? aspectIcon(catEmojis[cat], 17) : '📌') + '</span>';
                html += '<span class="breakdown-cat-name">' + (catNames[cat] || 'سایر') + '</span>';
                html += '</div>';
                items.forEach(function(b) {
                    var pts = b.points || 0;
                    var desc = _esc(b.description || b.details || b.rule || '');
                    var detail = _esc(b.details || '');
                    var rule = b.rule || '';
                    var explanation = ruleExplanations[rule] || ruleExplanations['default'];
                    var maxPts = 15;
                    var pctW = Math.min(100, Math.abs(pts) / maxPts * 100);
                    var barColor = pts >= 0 ? 'linear-gradient(90deg, #2ecc71, #51cf66)' : 'linear-gradient(90deg, #e74c3c, #ff6b6b)';
                    html += '<div class="breakdown-item">';
                    html += '<div class="breakdown-item-head">';
                    html += '<span class="breakdown-label">' + desc + '</span>';
                    html += '<span class="breakdown-value" style="color:' + (pts >= 0 ? '#51cf66' : '#ff6b6b') + '">' + (pts >= 0 ? '+' : '') + pts + '</span>';
                    html += '</div>';
                    html += '<div class="breakdown-bar"><div class="breakdown-fill" style="width:' + pctW + '%;background:' + barColor + '"></div></div>';
                    html += '<div class="breakdown-explain">' + explanation + '</div>';
                    if (detail) html += '<div class="breakdown-detail">\u2699\uFE0F ' + detail + '</div>';
                    html += '</div>';
                });
                html += '</div>';
            });
            html += '</div>';
        }
        html += '</div></div>';
    }
    if (chart.aspects && chart.aspects.length > 0) {
        html += '<div class="section-card visible"><div class="section-title"><span class="emoji-big">\u26a1</span> \u062c\u0646\u0628\u0647\u200c\u0647\u0627 <span class="badge-count">'+chart.aspects.length+'</span></div><div class="grid-flex">';
        chart.aspects.forEach(function(a) {
            html += '<span class="aspect-item visible">'+translate(a.p1_name||'')+' '+translate(a.aspect||'')+' '+translate(a.p2_name||'')+' ('+(a.orbit?a.orbit.toFixed(1):'?')+'\u00b0)</span>';
        });
        html += '</div></div>';
    }
    return html;
}



function animateScoreProgressBars() {
    setTimeout(function() {
        var fills = document.querySelectorAll('.score-progress-fill[data-target]');
        fills.forEach(function(fill) {
            var target = fill.getAttribute('data-target') || 0;
            fill.style.width = target + '%';
        });
        // Animate composite category bars
        var catFills = document.querySelectorAll('.cat-bar-fill');
        catFills.forEach(function(fill) {
            var w = fill.style.width;
            fill.style.width = '0%';
            setTimeout(function() { fill.style.width = w; }, 50);
        });
        // Attach click handlers for category toggle
        document.querySelectorAll('.cat-toggle').forEach(function(el) {
            el.addEventListener('click', function() {
                var targetId = el.getAttribute('data-target');
                var panel = document.getElementById(targetId);
                if (!panel) return;
                var icon = el.querySelector('.cat-expand-icon');
                var isOpen = panel.classList.contains('cat-detail-open');
                if (isOpen) {
                    panel.classList.remove('cat-detail-open');
                    if (icon) icon.classList.remove('cat-expand-open');
                } else {
                    panel.classList.add('cat-detail-open');
                    if (icon) icon.classList.add('cat-expand-open');
                }
            });
        });
    }, 100);
}


// ================================================================
//   COMPOSITE CHART CATEGORIES (Emotional, Intellectual, Spiritual)
// ================================================================
// calculateCompositeCategories moved to backend — use data.composite_categories

// getCompositeSummary moved to backend — use data.composite_summary


// ================================================================
//   TRANSIT / SOLAR RETURN / LUNAR RETURN INTERPRETATIONS
// ================================================================
// Score calculation moved to backend — frontend uses total_score from API response


// getCompositeHouseDescription moved to backend — use data.composite_house_description

function displayScoreInterpretation(chartData, title, chartType) {
    var chart = chartData.chart_data || chartData;
    var score = chartData.total_score || chartData.chart_score || 50;
    var interp = chartData.interpretation || {level: score + '/100', title: 'امتیاز', text: 'امتیاز شما ' + score + ' از ۱۰۰ است.'};
    var colorCls = getScoreColorClass(score);
    // Context info
    var ctxParts = [];
    if (chartType === 'solar-return' || chartType === 'lunar-return') {
        // Extract year/month from the chart subject name or data
        var subjectName = (chart.subject && chart.subject.name) || '';
        if (subjectName.indexOf('Solar') !== -1 || chartType === 'solar-return') {
            var yearEl = document.getElementById('return_year');
            var monthEl = document.getElementById('return_month');
            if (yearEl && yearEl.value) ctxParts.push('\u0633\u0627\u0644 ' + yearEl.value);
            if (monthEl && monthEl.value && monthEl.value !== '0') {
                var monthNames = ['\u0641\u0631\u0648\u0631\u06cc\u0646','\u0627ردیبهشت','\u0627ردبهشت','\u062fرویزه','\u062aیر','\u0627ردیبهشت','\u062aیرمه','\u0645هر','\u0622بان','\u0622ذر','\u0622ذار','\u062fیسانبر'];
                ctxParts.push(_jMonthName(parseInt(monthEl.value)));
            }
        } else {
            // Lunar return - show month
            var yearEl2 = document.getElementById('return_year');
            if (yearEl2 && yearEl2.value) ctxParts.push('\u0633\u0627\u0644 ' + yearEl2.value);
        }
    } else if (chartType === 'transit') {
        var tdHidden = document.getElementById('transitDatePicker_hidden');
        if (tdHidden && tdHidden.value) {
            var parts = tdHidden.value.split('-');
            ctxParts.push(parts[0] + '/' + parts[1] + '/' + parts[2]);
        }
    }
    var ctxHtml = ctxParts.length > 0 ? '<div class="score-context">' + ctxParts.join(' \u00b7 ') + '</div>' : '';
    var html = '<div class="section-card visible synastry-result"><div class="section-title"><span class="emoji-big">' + window.uiIcon('transit', 20) + '</span> '+title+'</div>';
    html += '<div class="score-display"><span class="score-number ' + colorCls + '">' + score + '</span><span class="score-label">\u0627\u0632 \u06f1\u06f0\u06f0</span></div>' + ctxHtml;
    html += '<div class="score-progress-wrap"><div class="score-progress-track"><div class="score-progress-fill ' + colorCls + '" style="width:0%" data-target="' + score + '"></div></div></div>';
    html += '<div class="interp-title">' + interp.level + '</div>';
    html += '<p class="interp-text">' + interp.text + '</p>';
    html += '</div>';
    // Planet grid
    if (chart.subject) {
        html += '<div class="section-card visible"><div class="section-title"><span class="emoji-big">\u2699\ufe0f</span> \u0645واقع \u0633یارات</div><div class="grid-masonry">';
        html += renderPlanetGrid(chart.subject);
        html += '</div></div>';
    }
    if (chart.aspects && chart.aspects.length > 0) {
        html += '<div class="section-card visible"><div class="section-title"><span class="emoji-big">\u26a1</span> \u062c\u0646\u0628\u0647\u200c\u0647\u0627 <span class="badge-count">'+chart.aspects.length+'</span></div><div class="grid-flex">';
        chart.aspects.forEach(function(a) {
            html += '<span class="aspect-item visible">'+translate(a.p1_name||'')+' '+translate(a.aspect||'')+' '+translate(a.p2_name||'')+' ('+(a.orbit?a.orbit.toFixed(1):'?')+'\u00b0)</span>';
        });
        html += '</div></div>';
    }
    return html;
}

// ================================================================
//   TAB SWITCHING & FORM BUILDERS
// ================================================================
var currentData = null;

var currentContext = null;



let currentTab = 'birth';
const formContainer = document.getElementById('formContainer');
const calcBtn = document.getElementById('calcBtn');
const formTitle = document.getElementById('formTitle');

function makeOption(val, text) { return '<option value="'+val+'">'+text+'</option>'; }
function makeHourOptions() { return Array.from({length:24},(_,i)=>makeOption(i,String(i).padStart(2,'0')+':00')).join(''); }
function makeMinOptions() { return Array.from({length:12},(_,i)=>makeOption(i*5,String(i*5).padStart(2,'0'))).join(''); }
function makeTzOptions() {
    return [
        {v:'-12', t:'UTC-12'}, {v:'-11', t:'UTC-11 (ساموآ)'}, {v:'-10', t:'UTC-10 (هاوایی)'},
        {v:'-9', t:'UTC-9 (آلاسکا)'}, {v:'-8', t:'UTC-8 (لس‌آنجلس)'}, {v:'-7', t:'UTC-7 (دنور)'},
        {v:'-6', t:'UTC-6 (شیکاگو)'}, {v:'-5', t:'UTC-5 (نیویورک)'}, {v:'-4', t:'UTC-4 (کاراکاس)'},
        {v:'-3', t:'UTC-3 (بوئنوس آیرس)'}, {v:'-2', t:'UTC-2'}, {v:'-1', t:'UTC-1 (آزور)'},
        {v:'0', t:'UTC 0 (لندن)'}, {v:'1', t:'UTC+1 (پاریس)'}, {v:'2', t:'UTC+2 (آتن)'},
        {v:'3', t:'UTC+3 (مسکو)'}, {v:'3.5', t:'UTC+3:30 (تهران)', sel:true},
        {v:'4', t:'UTC+4 (باکو)'}, {v:'4.5', t:'UTC+4:30 (کابل)'},
        {v:'5', t:'UTC+5 (تاشکند)'}, {v:'5.5', t:'UTC+5:30 (کلکته)'}, {v:'5.75', t:'UTC+5:45 (کاتماندو)'},
        {v:'6', t:'UTC+6 (دهکا)'}, {v:'7', t:'UTC+7 (بانکوک)'}, {v:'8', t:'UTC+8 (شانگهای)'},
        {v:'9', t:'UTC+9 (توکیو)'}, {v:'9.5', t:'UTC+9:30 (آدلاید)'}, {v:'10', t:'UTC+10 (سیدنی)'},
        {v:'11', t:'UTC+11 (نومئآ)'}, {v:'12', t:'UTC+12 (آوکلند)'}
    ].map(function(o) {
        return '<option value="' + o.v + '"' + (o.sel ? ' selected' : '') + '>' + o.t + '</option>';
    }).join('');
}

// ================================================================
//  SHARED INPUTS STATE (auto-fill across tabs)
// ================================================================
var sharedInputs = {
    name: '',
    birthDate: null, // { year, month, day }
    birthHour: 0,
    birthMinute: 0,
    city: '',
    province: null, // { id, name, nameEn }
    latitude: 35.6892,
    longitude: 51.3890,
    timezone: '3.5'
};
var sharedInputs2 = {
    name: '',
    birthDate: null,
    birthHour: 0,
    birthMinute: 0,
    city: '',
    province: null,
    latitude: 35.6892,
    longitude: 51.3890,
    timezone: '3.5'
};
var _csInstances = {}; // CitySelector instances keyed by container ID

// Capture shared field changes from any form
function syncSharedInputsFromForm() {
    // Try birth tab IDs first, then person IDs
    var nameEl = document.getElementById('userName') || document.getElementById('p1_name');
    var dateEl = document.getElementById('birthDatePicker_hidden') || document.getElementById('p1_date_hidden');
    var hourEl = document.getElementById('birthHour') || document.getElementById('p1_hour');
    var minEl = document.getElementById('birthMinute') || document.getElementById('p1_minute');
    var cityEl = document.getElementById('cityName') || document.getElementById('p1_city');
    var latEl = document.getElementById('latitude') || document.getElementById('p1_lat');
    var lngEl = document.getElementById('longitude') || document.getElementById('p1_lng');
    var tzEl = document.getElementById('timezone') || document.getElementById('p1_tz');

    if (nameEl && nameEl.value) sharedInputs.name = nameEl.value.trim();
    if (dateEl && dateEl.value) {
        var parts = dateEl.value.split('-');
        if (parts.length >= 3) sharedInputs.birthDate = { year: parseInt(parts[0]), month: parseInt(parts[1]), day: parseInt(parts[2]) };
    }
    if (hourEl) sharedInputs.birthHour = parseInt(hourEl.value) || 0;
    if (minEl) sharedInputs.birthMinute = parseInt(minEl.value) || 0;
    if (cityEl && cityEl.value) sharedInputs.city = cityEl.value.trim();
    if (latEl) sharedInputs.latitude = parseFloat(latEl.value) || 35.6892;
    if (lngEl) sharedInputs.longitude = parseFloat(lngEl.value) || 51.3890;
    if (tzEl) sharedInputs.timezone = tzEl.value || '3.5';
    // Capture province/city from first CitySelector only (p1 or birth)
    var csKeys = Object.keys(_csInstances);
    var firstKey = csKeys.find(function(k) {
        return k === 'birthCitySelector' || k.indexOf('p1_') === 0;
    });
    if (firstKey && _csInstances[firstKey] && typeof _csInstances[firstKey].getValue === 'function') {
        var v = _csInstances[firstKey].getValue();
        if (v.province) sharedInputs.province = v.province;
        if (v.city) sharedInputs.city = v.city.name;
    }
    // Also capture p2 person info for synastry/composite persistence
    var p2NameEl = document.getElementById('p2_name');
    var p2DateEl = document.getElementById('p2_date_hidden');
    var p2HourEl = document.getElementById('p2_hour');
    var p2MinEl = document.getElementById('p2_minute');
    var p2CityEl = document.getElementById('p2_city');
    var p2LatEl = document.getElementById('p2_lat');
    var p2LngEl = document.getElementById('p2_lng');
    var p2TzEl = document.getElementById('p2_tz');
    if (p2NameEl && p2NameEl.value) sharedInputs2.name = p2NameEl.value.trim();
    if (p2DateEl && p2DateEl.value) {
        var p2parts = p2DateEl.value.split('-');
        if (p2parts.length >= 3) sharedInputs2.birthDate = { year: parseInt(p2parts[0]), month: parseInt(p2parts[1]), day: parseInt(p2parts[2]) };
    }
    if (p2HourEl) sharedInputs2.birthHour = parseInt(p2HourEl.value) || 0;
    if (p2MinEl) sharedInputs2.birthMinute = parseInt(p2MinEl.value) || 0;
    if (p2CityEl && p2CityEl.value) sharedInputs2.city = p2CityEl.value.trim();
    if (p2LatEl) sharedInputs2.latitude = parseFloat(p2LatEl.value) || 35.6892;
    if (p2LngEl) sharedInputs2.longitude = parseFloat(p2LngEl.value) || 51.3890;
    if (p2TzEl) sharedInputs2.timezone = p2TzEl.value || '3.5';
    // Capture p2 CitySelector
    var p2CsKey = Object.keys(_csInstances).find(function(k) { return k.indexOf('p2_') === 0; });
    if (p2CsKey && _csInstances[p2CsKey] && typeof _csInstances[p2CsKey].getValue === 'function') {
        var pv = _csInstances[p2CsKey].getValue();
        if (pv.province) sharedInputs2.province = pv.province;
        if (pv.city) sharedInputs2.city = pv.city.name;
    }
    // Update location bar
    updateLocationBar();

    // Also capture from daily-question date picker — با همان گاردِ بیوریتم:
    // اگر کاربر پروفایلِ ثبت‌شده دارد، dq picker تاریخِ تستی است و نباید پروفایل را بازنویسی کند
    var dqDate = document.getElementById('dqDatePicker_hidden');
    if (dqDate && dqDate.value) {
        var dqParts = dqDate.value.split('-');
        if (dqParts.length >= 3 && !getProfileBirthISO()) {
            sharedInputs.birthDate = { year: parseInt(dqParts[0]), month: parseInt(dqParts[1]), day: parseInt(dqParts[2]) };
        }
    }
    // Also capture from Numerology fields
    var numYear = document.getElementById('numYear');
    var numMonth = document.getElementById('numMonth');
    var numDay = document.getElementById('numDay');
    if (numYear && numMonth && numDay && numYear.value && numMonth.value && numDay.value) {
        sharedInputs.birthDate = { year: parseInt(numYear.value), month: parseInt(numMonth.value), day: parseInt(numDay.value) };
    }
    // Also capture from Biorhythm date picker — but if the user already has
    // a REGISTERED profile birth, the bio picker is a test-date and must
    // never overwrite the profile birth date.
    var bioBirthDP = document.getElementById('bioBirthDP_hidden');
    if (bioBirthDP && bioBirthDP.value) {
        var parts2 = bioBirthDP.value.split('-');
        if (parts2.length >= 3 && !getProfileBirthISO()) {
            sharedInputs.birthDate = { year: parseInt(parts2[0]), month: parseInt(parts2[1]), day: parseInt(parts2[2]) };
        }
    }
    // Persist across reloads (localStorage) and, for logged-in users, to the
    // server profile so every service + the yoga/dashboard pages can use it
    persistSharedInputsLocal();
    saveProfileToServer();
}

// ================================================================
//  TOAST NOTIFICATION
// ================================================================
function showToast(message, type) {
    var container = document.getElementById('toastContainer');
    if (!container) return;
    // Cap at 3 visible toasts — remove oldest if over limit
    var toasts = container.querySelectorAll('.toast-msg:not(.toast-out)');
    if (toasts.length >= 3) {
        toasts[0].classList.add('toast-out');
        setTimeout(function() { toasts[0].remove(); }, 300);
    }
    var toast = document.createElement('div');
    toast.className = 'toast-msg' + (type ? ' toast-' + type : '');
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(function() {
        toast.classList.add('toast-out');
        setTimeout(function() { toast.remove(); }, 300);
    }, 2200);
}

// ================================================================
//  LOCATION BAR — persistent city/province display across all tabs
// ================================================================
var _locationBarText = document.getElementById('locationBarText');
var _lastLocationBarKey = '';

function updateLocationBar() {
    if (!_locationBarText) return;
    var city = sharedInputs.city || '';
    var province = sharedInputs.province ? sharedInputs.province.name : '';
    var key = city + '|' + province;
    if (key === _lastLocationBarKey) return; // no change
    _lastLocationBarKey = key;
    // Fade out → update → fade in
    _locationBarText.classList.add('fade-out');
    setTimeout(function() {
        var name = sharedInputs.name || '';
        var namePart = name ? '<span class="location-bar-name">👤 ' + name + '</span> · ' : '';
        var datePart = '';
        if (sharedInputs.birthDate) {
            datePart = ' · 📅 ' + formatDpDisplay(sharedInputs.birthDate, 'shamsi', 'fa');
        }
        var locPart = '';
        if (city && province && city !== province) {
            locPart = '<span class="location-bar-city">' + city + '</span>، <span class="location-bar-province">' + province + '</span>';
        } else if (city) {
            locPart = '<span class="location-bar-city">' + city + '</span>';
        } else if (province) {
            locPart = '<span class="location-bar-province">' + province + '</span>';
        } else {
            locPart = 'تهران (پیش‌فرض)';
        }
        _locationBarText.innerHTML = namePart + locPart + datePart;
        _locationBarText.classList.remove('fade-out');
    }, 200);
}

// ================================================================
//  SHIMMER / SKELETON LOADING HELPERS + آیکون‌های یکپارچه
// ================================================================
window.uiIcon = function (name, size) {
    size = size || 15;
    return '<img class="ui-inline-icon" src="static/images/ui/' + name + '.svg" alt="" style="width:' + size + 'px;height:' + size + 'px;">';
};

function deEmoji(text) {
    if (!text) return text;
    return String(text)
        .replace(/⏳/g, '<span class="ui-spin">' + window.uiIcon('loader', 13) + '</span>')
        .replace(/💕/g, window.uiIcon('synastry'))
        .replace(/🧬/g, window.uiIcon('mizaj'))
        .replace(/❓/g, window.uiIcon('daily-question'))
        .replace(/✨/g, window.uiIcon('star'))
        .replace(/🍃/g, window.uiIcon('hafez'))
        .replace(/📝/g, window.uiIcon('qol'))
        .replace(/📖/g, window.uiIcon('hafez'));
}

function makeShimmerLoading(text) {
    return '<div class="shimmer-loading">' +
        '<div class="shimmer-line-circle"></div>' +
        '<div class="shimmer-line"></div>' +
        '<div class="shimmer-line"></div>' +
        '<div class="shimmer-line"></div>' +
        '<div class="shimmer-line"></div>' +
        '<div class="shimmer-line"></div>' +
        '<div class="shimmer-text">' + deEmoji(text || '⏳ در حال دریافت اطلاعات...') + '</div>' +
        '</div>';
}

function makeShimmerCompact(text) {
    return '<div class="shimmer-loading" style="padding:14px;">' +
        '<div class="shimmer-line" style="width:70%;margin:0 auto 10px;"></div>' +
        '<div class="shimmer-line" style="width:90%;margin:0 auto 10px;"></div>' +
        '<div class="shimmer-line" style="width:50%;margin:0 auto 10px;"></div>' +
        '<div class="shimmer-text">' + deEmoji(text || '⏳ در حال دریافت...') + '</div>' +
        '</div>';
}

// ================================================================
//  RESULT AREA SHIMMER SKELETON (chart tabs)
// ================================================================
function makeResultShimmer() {
    return '<div class="result-shimmer">' +
        '<div class="shimmer-card">' +
            '<div class="shimmer-section-title"></div>' +
            '<div class="shimmer-line-circle" style="margin:0 auto 20px;"></div>' +
            '<div class="shimmer-line" style="width:60%;margin:0 auto 12px;"></div>' +
            '<div class="shimmer-line" style="width:80%;margin:0 auto 12px;"></div>' +
            '<div class="shimmer-line" style="width:50%;margin:0 auto 12px;"></div>' +
            '<div class="shimmer-grid-item"><div class="shimmer-line-short" style="width:40%;"></div><div class="shimmer-line-short" style="width:30%;"></div></div>' +
            '<div class="shimmer-grid-item" style="margin-top:8px;"><div class="shimmer-line-short" style="width:35%;"></div><div class="shimmer-line-short" style="width:25%;"></div></div>' +
        '</div>' +
        '<div class="shimmer-card">' +
            '<div class="shimmer-section-title" style="width:60%;"></div>' +
            '<div class="shimmer-line" style="width:90%;margin-bottom:14px;"></div>' +
            '<div class="shimmer-line" style="width:100%;margin-bottom:14px;"></div>' +
            '<div class="shimmer-line" style="width:75%;margin-bottom:14px;"></div>' +
            '<div class="shimmer-line" style="width:85%;margin-bottom:14px;"></div>' +
            '<div class="shimmer-line" style="width:60%;"></div>' +
        '</div>' +
    '</div>';
}

// Apply shared inputs to all form fields in current tab
function applySharedInputs() {
    document.querySelectorAll('#formContainer input, #formContainer select').forEach(function(el) {
        var id = el.id || '';
        // Name fields
        if ((id === 'userName' || id.endsWith('_name') || id === 'numName' || id === 'numSoulName') && sharedInputs.name) {
            el.value = sharedInputs.name;
        }
        // Hour fields
        if ((id === 'birthHour' || id.endsWith('_hour')) && sharedInputs.birthHour !== undefined) {
            el.value = sharedInputs.birthHour;
        }
        // Minute fields
        if ((id === 'birthMinute' || id.endsWith('_minute')) && sharedInputs.birthMinute !== undefined) {
            el.value = sharedInputs.birthMinute;
        }
        // City fields
        if ((id === 'cityName' || id.endsWith('_city')) && sharedInputs.city) {
            el.value = sharedInputs.city;
        }
        // Lat fields
        if ((id === 'latitude' || id.endsWith('_lat'))) {
            el.value = sharedInputs.latitude;
        }
        // Lng fields
        if ((id === 'longitude' || id.endsWith('_lng'))) {
            el.value = sharedInputs.longitude;
        }
        // TZ fields
        if ((id === 'timezone' || id.endsWith('_tz')) && sharedInputs.timezone) {
            el.value = sharedInputs.timezone;
        }
    });
    // Apply shared birth date to all date picker hidden inputs and displays
    if (sharedInputs.birthDate) {
        var dateStr = sharedInputs.birthDate.year + '-' + String(sharedInputs.birthDate.month).padStart(2,'0') + '-' + String(sharedInputs.birthDate.day).padStart(2,'0');
        /* فاز ماه و ناسا از PresetCalendar استفاده می‌کنند و تاریخِ مستقل دارند —
           تاریخ تولد نباید آن‌ها را بازنویسی کند */
        document.querySelectorAll('[id$="_date_hidden"], #birthDatePicker_hidden').forEach(function(el) {
            if (el.id === 'moonPhaseDP_hidden' ||
                el.id === 'nasaWeatherStartDP_hidden' || el.id === 'nasaWeatherEndDP_hidden' ||
                el.id === 'nasaNeoStartDP_hidden' || el.id === 'nasaNeoEndDP_hidden' ||
                el.id === 'nasaPlanetsDateDP_hidden') return;
            el.value = dateStr;
        });
        // Update display text
        document.querySelectorAll('[id$="_date_display"], #birthDatePicker_display').forEach(function(el) {
            el.textContent = formatDpDisplay(sharedInputs.birthDate, 'shamsi', 'fa');
        });
        // Update _dpState for all date pickers
        Object.keys(_dpState).forEach(function(key) {
            _dpState[key].value = sharedInputs.birthDate;
        });
        // Numerology: fill numYear, numMonth, numDay
        var ny = document.getElementById('numYear');
        var nm = document.getElementById('numMonth');
        var nd = document.getElementById('numDay');
        var py = document.getElementById('pyYear');
        var pm = document.getElementById('pyMonth');
        var pd = document.getElementById('pyDay');
        if (ny) ny.value = sharedInputs.birthDate.year;
        if (nm) nm.value = sharedInputs.birthDate.month;
        if (nd) nd.value = sharedInputs.birthDate.day;
        if (py) py.value = sharedInputs.birthDate.year;
        if (pm) pm.value = sharedInputs.birthDate.month;
        if (pd) pd.value = sharedInputs.birthDate.day;
        // Biorhythm: fill date picker hidden inputs
        var bioHidden = document.getElementById('bioBirthDP_hidden');
        var mbHidden = document.getElementById('bioMonthlyBirthDP_hidden');
        var bioDisplay = document.getElementById('bioBirthDP_display');
        var mbDisplay = document.getElementById('bioMonthlyBirthDP_display');
        if (bioHidden) bioHidden.value = dateStr;
        if (mbHidden) mbHidden.value = dateStr;
        if (bioDisplay) bioDisplay.textContent = formatDpDisplay(sharedInputs.birthDate, 'shamsi', 'fa');
        if (mbDisplay) mbDisplay.textContent = formatDpDisplay(sharedInputs.birthDate, 'shamsi', 'fa');
        // Update _dpState for biorhythm pickers
        if (_dpState['bioBirthDP']) _dpState['bioBirthDP'].value = sharedInputs.birthDate;
        if (_dpState['bioMonthlyBirthDP']) _dpState['bioMonthlyBirthDP'].value = sharedInputs.birthDate;
    }
    // Apply p2 shared inputs for synastry/composite persistence
    if (sharedInputs2.birthDate) {
        var p2DateStr = sharedInputs2.birthDate.year + '-' + String(sharedInputs2.birthDate.month).padStart(2,'0') + '-' + String(sharedInputs2.birthDate.day).padStart(2,'0');
        var p2dHidden = document.getElementById('p2_date_hidden');
        var p2dDisplay = document.getElementById('p2_date_display');
        if (p2dHidden) p2dHidden.value = p2DateStr;
        if (p2dDisplay) p2dDisplay.textContent = formatDpDisplay(sharedInputs2.birthDate, 'shamsi', 'fa');
        /* کلید صحیح در _dpState همان triggerId است: p2_date (نه p2_datePicker) */
        if (_dpState['p2_date']) _dpState['p2_date'].value = sharedInputs2.birthDate;
    }
    var p2NameEl2 = document.getElementById('p2_name');
    var p2HourEl2 = document.getElementById('p2_hour');
    var p2MinEl2 = document.getElementById('p2_minute');
    if (p2NameEl2 && sharedInputs2.name) p2NameEl2.value = sharedInputs2.name;
    if (p2HourEl2 && sharedInputs2.birthHour !== undefined) p2HourEl2.value = sharedInputs2.birthHour;
    if (p2MinEl2 && sharedInputs2.birthMinute !== undefined) p2MinEl2.value = sharedInputs2.birthMinute;
    // Apply p2 province/city to p2 CitySelector
    if (sharedInputs2.province && PERSIAN_PROVINCES) {
        var p2Province = PERSIAN_PROVINCES.find(function(p) { return p.id === sharedInputs2.province.id; });
        if (p2Province) {
            var p2CsKey2 = Object.keys(_csInstances).find(function(k) { return k.indexOf('p2_') === 0; });
            if (p2CsKey2 && _csInstances[p2CsKey2] && typeof _csInstances[p2CsKey2].setValue === 'function') {
                var p2City = null;
                if (sharedInputs2.city && p2Province.cities) {
                    p2City = p2Province.cities.find(function(c2) { return c2.name === sharedInputs2.city; }) || null;
                }
                _csInstances[p2CsKey2].setValue(p2Province, p2City);
            }
        }
    } else if (sharedInputs2.city) {
        var p2LatEl2 = document.getElementById('p2_lat');
        var p2LngEl2 = document.getElementById('p2_lng');
        var p2TzEl2 = document.getElementById('p2_tz');
        var p2CityEl2 = document.getElementById('p2_city');
        if (p2LatEl2) p2LatEl2.value = sharedInputs2.latitude;
        if (p2LngEl2) p2LngEl2.value = sharedInputs2.longitude;
        if (p2TzEl2) { p2TzEl2.value = sharedInputs2.timezone; p2TzEl2.dispatchEvent(new Event('change', {bubbles:true})); }
        if (p2CityEl2) p2CityEl2.value = sharedInputs2.city;
    }
    // Apply province/city to CitySelector instances (first only — p1 auto-fill)
    if (sharedInputs.province && PERSIAN_PROVINCES) {
        var province = PERSIAN_PROVINCES.find(function(p) { return p.id === sharedInputs.province.id; });
        if (province) {
            var csKeys = Object.keys(_csInstances);
            // Only apply to the first CitySelector (birth tab or p1)
            var firstKey = csKeys.find(function(k) {
                return k === 'birthCitySelector' || k.indexOf('p1_') === 0;
            });
            if (firstKey && _csInstances[firstKey] && typeof _csInstances[firstKey].setValue === 'function') {
                var city = null;
                if (sharedInputs.city && province.cities) {
                    city = province.cities.find(function(c) { return c.name === sharedInputs.city; }) || null;
                }
                _csInstances[firstKey].setValue(province, city);
            }
        }
    }
}

// ================================================================
//  DATE WHEEL PICKER INTEGRATION
// ================================================================
var _dpState = {};

function makeDatePickerTrigger(triggerId, opts) {
    var displayId = triggerId + '_display';
    var hiddenId = triggerId + '_hidden';
    /* همیشه شمسی — میلادی فقط نمایش معادلِ داخل پیکر است */
    var defaultVal = opts.defaultValue || { year: 1380, month: 1, day: 1 };
    if (!defaultVal.year || isNaN(defaultVal.year) || !defaultVal.month || !defaultVal.day) {
        defaultVal = { year: 1380, month: 1, day: 1 };
    }
    _dpState[triggerId] = { calType: 'shamsi', value: defaultVal };
    return '<input type="hidden" id="' + hiddenId + '" value="' + defaultVal.year + '-' + String(defaultVal.month).padStart(2,'0') + '-' + String(defaultVal.day).padStart(2,'0') + '">' +
        '<button type="button" class="dp-trigger" id="' + triggerId + '">' +
        '<span class="dp-trigger-icon">📅</span>' +
        '<span><span class="dp-trigger-label">' + (opts.label || 'تاریخ تولد') + '</span><br>' +
        '<span id="' + displayId + '">' + formatDpDisplay(defaultVal, 'shamsi', opts.digits) + '</span></span>' +
        '</button>';
}

/* نام ماه‌های شمسی — منبعِ واحد ( قبلاً دو آرایه‌ی خرابِ تکراری وجود داشت ) */
var _J_MONTHS_FA = ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
function _jMonthName(m) { return _J_MONTHS_FA[(parseInt(m, 10) || 1) - 1] || ''; }

function toFaDigitsLocal(str) {
    var FA = ['\u06f0','\u06f1','\u06f2','\u06f3','\u06f4','\u06f5','\u06f6','\u06f7','\u06f8','\u06f9'];
    return String(str).replace(/[0-9]/g, function(d) { return FA[parseInt(d)]; });
}
function formatDpDisplay(val, calType, digits) {
    var d = digits || 'fa';
    var sep = d === 'fa' ? ' / ' : ' / ';
    var toFa = (typeof DateWheelPicker !== 'undefined' && DateWheelPicker.toFaDigits) ? DateWheelPicker.toFaDigits : toFaDigitsLocal;
    var yStr = d === 'fa' ? toFa(val.year) : String(val.year);
    var mStr = d === 'fa' ? toFa(String(val.month).padStart(2,'0')) : String(val.month).padStart(2,'0');
    var ddStr = d === 'fa' ? toFa(String(val.day).padStart(2,'0')) : String(val.day).padStart(2,'0');
    return yStr + sep + mStr + sep + ddStr;
}

function attachDatePicker(triggerId, opts) {
    var btn = document.getElementById(triggerId);
    if (!btn) return;
    var hiddenId = triggerId + '_hidden';
    var displayId = triggerId + '_display';
    btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var state = _dpState[triggerId] || {};
        /* همیشه شمسی باز می‌شود؛ مقدار ذخیره‌شده شمسی است — بدون تبدیل */
        var defVal = state.value || opts.defaultValue || { year: 1380, month: 1, day: 1 };
        /* 🎯 تقویم گرافیکی popover (مثل چارت تولد) — چرخ فقط fallback است.
           آینده: برای ترانزیت مجاز؛ برای تاریخ تولد نه. */
        if (window.ShamsiCalendar) {
            ShamsiCalendar.open({
                anchor: btn,
                defaultJalali: { jy: defVal.year, jm: defVal.month, jd: defVal.day },
                minJy: 1300,
                allowFuture: !!opts.allowFuture,
                onSave: function (iso) {
                    var p = iso.split('-');
                    var date = { year: parseInt(p[0]), month: parseInt(p[1]), day: parseInt(p[2]) };
                    _dpState[triggerId] = { calType: 'shamsi', value: date };
                    var hidden = document.getElementById(hiddenId);
                    var display = document.getElementById(displayId);
                    if (hidden) hidden.value = date.year + '-' + String(date.month).padStart(2,'0') + '-' + String(date.day).padStart(2,'0');
                    if (display) display.textContent = formatDpDisplay(date, 'shamsi', opts.digits);
                }
            });
            return;
        }
        /* fallback: چرخ قدیمی */
        DateWheelPicker.open({
            calendarType: 'shamsi',
            defaultValue: defVal,
            digits: opts.digits || 'fa',
            loop: false,
            onSave: function (date) {
                /* ذخیره همیشه شمسی — date.calendarType نادیده گرفته می‌شود */
                _dpState[triggerId] = { calType: 'shamsi', value: date };
                var hidden = document.getElementById(hiddenId);
                var display = document.getElementById(displayId);
                if (hidden) hidden.value = date.year + '-' + String(date.month).padStart(2,'0') + '-' + String(date.day).padStart(2,'0');
                if (display) display.textContent = formatDpDisplay(date, 'shamsi', opts.digits);
            }
        });
    });
}

// Build a person section with date picker
function buildPersonForm(id, label, badge) {
    var num = id.replace('p','');
    var cls = 'person-section p'+num;
    return '<div class="'+cls+'">'+
        '<div class="person-label">\u{1f464} '+label+' <span class="person-badge">'+badge+'</span></div>'+
        '<div class="form-section"><div class="form-grid">'+
        '<div class="form-group"><label>\u{1f464} \u0646\u0627\u0645</label><input type="text" id="'+id+'_name" value="'+label+'"></div>'+
        '<div class="form-group"><label>\u{1f4c5} \u062a\u0627\u0631\u06cc\u062e \u062a\u0648\u0644\u062f</label>'+makeDatePickerTrigger(id+'_date', {label:'تاریخ تولد '+label, calendarType:'shamsi', digits:'fa'})+'</div>'+
        '<div class="form-group"><label>\u23f0 \u0633\u0627\u0639\u062a</label><select id="'+id+'_hour">'+makeHourOptions()+'</select></div>'+
        '<div class="form-group"><label>\u23f1\ufe0f \u062f\u0642\u06cc\u0642\u0647</label><select id="'+id+'_minute">'+makeMinOptions()+'</select></div>'+
        '<div class="form-group full"><label>\u{1f3d9}\ufe0f \u0634\u0647\u0631 <span class="help-icon">\u061f<span class="tooltip-text">\u0634\u0647\u0631 \u0645\u0648\u0631\u062f \u0646\u0638\u0631 \u0631\u0627 \u0627\u0646\u062a\u062e\u0627\u0628 \u06a9\u0646\u06cc\u062f \u06cc\u0627 \u062c\u0633\u062a\u062c\u0648 \u06a9\u0646\u06cc\u062f.</span></span></label><div class="city-selector" id="'+id+'_city_selector"></div></div>'+
        '<div class="form-group"><label>\u{1f30d} \u0639\u0631\u0636 \u062c\u063a\u0631\u0627\u0641\u06cc\u0627\u06cc\u06cc</label><input type="number" id="'+id+'_lat" step="0.0001" value="35.6892"></div>'+
        '<div class="form-group"><label>\u{1f30d} \u0637\u0648\u0644 \u062c\u063a\u0631\u0627\u0641\u06cc\u0627\u06cc\u06cc</label><input type="number" id="'+id+'_lng" step="0.0001" value="51.3890"></div>'+
        '<div class="form-group"><label>\u{1f550} \u0645\u0646\u0637\u0642\u0647 \u0632\u0645\u0627\u0646\u06cc</label><select id="'+id+'_tz">'+makeTzOptions()+'</select></div>'+
        '</div></div>'+
        '</div>';
}

// For buildSubject, adapt to read hidden date value
var _origBuildSubject = null;

function buildBirthForm() {
    var tropTip = makeHelpIcon('tropical');
    var sidTip = makeHelpIcon('sidereal');
    /* 📚 dropdown چارت‌های قبلیِ همین کاربر — با انتخابشان فرم پر می‌شود،
       موتور دوباره محاسبه می‌کند و تفسیرِ از‌پیش‌نوشته‌شده (بدون AI تازه)
       از سرور برمی‌گردد. لیست در loadMyBirthCharts پُر می‌شود. */
    return '<div id="myBirthChartsWrap" style="display:none;margin:0 0 14px;padding:10px 12px;border:1px solid #2a3560;border-radius:12px;background:rgba(11,14,26,.45)">'+
        '<label for="myBirthChartsSel" style="display:block;margin-bottom:6px;font-size:13px;color:#b0c4e0">📚 چارت‌های قبلیِ من</label>'+
        '<select id="myBirthChartsSel" style="width:100%;padding:10px;border-radius:8px;border:1px solid #2a3560;background:#0b0e1a;color:#fff;font-family:inherit;font-size:13px"><option value="">— انتخاب کنید —</option></select>'+
        '</div>'+
        '<div class="form-grid">'+
        '<div class="form-group"><label>\u{1f464} \u0646\u0627\u0645</label><input type="text" id="userName" value="\u06a9\u0627\u0631\u0628\u0631"></div>'+
        '<div class="form-group"><label>\u{1f4c5} \u062a\u0627\u0631\u06cc\u062e \u062a\u0648\u0644\u062f</label>'+makeDatePickerTrigger('birthDatePicker', {label:'تاریخ تولد', calendarType:'shamsi', digits:'fa'})+'</div>'+
        '<div class="form-group"><label>\u23f0 \u0633\u0627\u0639\u062a</label><select id="birthHour">'+makeHourOptions()+'</select></div>'+
        '<div class="form-group"><label>\u23f1\ufe0f \u062f\u0642\u06cc\u0642\u0647</label><select id="birthMinute">'+makeMinOptions()+'</select></div>'+
        '<div class="form-group full"><label>\u{1f3d9}\ufe0f \u0634\u0647\u0631 <span class="help-icon">\u061f<span class="tooltip-text">\u0634\u0647\u0631 \u0645\u0648\u0631\u062f \u0646\u0638\u0631 \u0631\u0627 \u0627\u0646\u062a\u062e\u0627\u0628 \u06a9\u0646\u06cc\u062f \u06cc\u0627 \u062c\u0633\u062a\u062c\u0648 \u06a9\u0646\u06cc\u062f.</span></span></label><div class="city-selector" id="birthCitySelector"></div></div>'+
        '<div class="form-group"><label>\u{1f30d} \u0639\u0631\u0636 \u062c\u063a\u0631\u0627\u0641\u06cc\u0627\u06cc\u06cc</label><input type="number" id="latitude" step="0.0001" value="35.6892"></div>'+
        '<div class="form-group"><label>\u{1f30d} \u0637\u0648\u0644 \u062c\u063a\u0631\u0627\u0641\u06cc\u0627\u06cc\u06cc</label><input type="number" id="longitude" step="0.0001" value="51.3890"></div>'+
        '<div class="form-group"><label>\u{1f550} \u0645\u0646\u0637\u0642\u0647 \u0632\u0645\u0627\u0646\u06cc</label><select id="timezone">'+makeTzOptions()+'</select></div>'+
        '<div class="form-group"><label>\u{1f52e} \u0633\u06cc\u0633\u062a\u0645 \u0632\u0648\u062f\u06cc\u0627\u06a9 '+tropTip+'/'+sidTip+'</label><select id="zodiacType"><option value="tropical">Tropical</option><option value="sidereal">Sidereal</option></select></div>'+
        '</div>';
}

function attachDatePickerTriggers(tab) {
    var opts = { calendarType: 'shamsi', digits: 'fa' };
    if (tab === 'birth') {
        /* 🎯 تقویم شمسی گرافیکی (popover) برای چارت تولد.
           اگر ShamsiCalendar در دسترس نبود → چرخ قدیمی. */
        if (window.ShamsiCalendar) {
            ShamsiCalendar.attach('birthDatePicker', {
                minJy: 1300,
                onSave: function (iso) {
                    var p = iso.split('-');
                    if (p.length >= 3) {
                        sharedInputs.birthDate = { year: parseInt(p[0]), month: parseInt(p[1]), day: parseInt(p[2]) };
                        persistSharedInputsLocal();
                        saveProfileToServer();
                    }
                }
            });
        } else {
            attachDatePicker('birthDatePicker', opts);
        }
        return;
    }
    if (tab === 'synastry' || tab === 'composite' || tab === 'transit') {
        attachDatePicker('p1_date', opts);
        attachDatePicker('p2_date', opts);
    }
    if (tab === 'solar-return' || tab === 'lunar-return') {
        attachDatePicker('p1_date', opts);
    }
    if (tab === 'transit') attachDatePicker('transitDatePicker', { calendarType: 'shamsi', digits: 'fa', allowFuture: true });
    if (tab === 'daily-question') attachDatePicker('dqDatePicker', opts);
    if (tab === 'biorhythm') {
        attachDatePicker('bioBirthDP', opts);
        attachDatePicker('bioMonthlyBirthDP', opts);
    }
    if (tab === 'numerology') {
        attachDatePicker('pyBirthDP', opts); // پیکر مجزای سال اختیاری
    }
    if (tab === 'nasa') {
        /* تقویم‌های preset‌دارِ ناسا خودشان در getNasaForm می‌شوند؛
           pickerهای قدیمیِ wheel حذف شدند. */
    }
}

// هدر ابزار: مدالیون سرویس (هماهنگ با گرید خانه) + عنوان
// اندازه‌ها به‌صورت ویژگی (attribute) هم ست می‌شوند تا با وجود کش شدن CSS هرگز بزرگ رندر نشود
function toolHead(name, svg) {
    return '<img class="tool-medallion" width="36" height="36" src="static/images/services/' + svg + '.svg" alt="">' + name;
}

var formBuilders = {
    'birth': function() { formTitle.innerHTML = toolHead('اطلاعات تولد', 'birth'); calcBtn.innerHTML = window.uiIcon('birth') + ' دریافت چارت'; return buildBirthForm(); },
    'synastry': function() { formTitle.innerHTML = toolHead('سیناستری', 'synastry'); calcBtn.innerHTML = window.uiIcon('synastry') + ' محاسبه'; return buildPersonForm('p1','شخص اول','inner')+'<div class="person-divider"><span>+</span></div>'+buildPersonForm('p2','شخص دوم','outer'); },
    'composite': function() { formTitle.innerHTML = toolHead('کامپوزیت', 'composite'); calcBtn.innerHTML = window.uiIcon('composite') + ' محاسبه'; return buildPersonForm('p1','شخص اول','primary')+'<div class="person-divider"><span>🔗</span></div>'+buildPersonForm('p2','شخص دوم','secondary'); },
    'transit': function() {
        formTitle.innerHTML = toolHead('ترانزیت', 'transit'); calcBtn.innerHTML = window.uiIcon('transit') + ' محاسبه';
        return buildPersonForm('p1','چارت تولد','natal')+
            '<div class="person-divider"><span>🌍</span></div>'+
            '<div class="person-label">🌍 لحظه ترانزیت</div>'+
            '<div class="form-section"><div class="form-grid">'+
            '<div class="form-group"><label>📅 لحظه ترانزیت</label>'+makeDatePickerTrigger('transitDatePicker', {label:'تاریخ ترانزیت', calendarType:'shamsi', digits:'fa', allowFuture:true})+'</div>'+
            '<div class="form-group"><label>⏰</label><select id="transit_hour">'+makeHourOptions()+'</select></div>'+
            '<div class="form-group"><label>⏱️</label><select id="transit_minute">'+makeMinOptions()+'</select></div>'+
            '</div></div>';
    },
    'solar-return': function() {
        formTitle.innerHTML = toolHead('بازگشت خورشیدی', 'solar-return'); calcBtn.innerHTML = window.uiIcon('solar-return') + ' محاسبه';
        var currentYear = new Date().getFullYear();
        var yearOpts = '';
        for (var y = currentYear; y <= currentYear + 10; y++) yearOpts += makeOption(y, y);
        return buildPersonForm('p1','چارت تولد','natal')+
            '<div class="form-section"><div class="form-grid">'+
            '<div class="form-group"><label>☀️ سال بازگشت</label><select id="return_year">'+yearOpts+'</select></div>'+
            '</div></div>';
    },
    'mizaj': function() { formTitle.innerHTML = toolHead('مزاج‌شناسی', 'mizaj'); calcBtn.style.display = 'none'; return getMizajForm(); },
    'abjad': function() { formTitle.innerHTML = toolHead('ابجد', 'abjad'); calcBtn.style.display = 'none'; return getAbjadForm(); },
    'tarot': function() { formTitle.innerHTML = toolHead('تاروت', 'tarot'); calcBtn.style.display = 'none'; return getTarotForm(); },
    'numerology': function() { formTitle.innerHTML = toolHead('عددشناسی', 'numerology'); calcBtn.style.display = 'none'; return getNumerologyForm(); },
    'biorhythm': function() { formTitle.innerHTML = toolHead('بیوریتم', 'biorhythm'); calcBtn.style.display = 'none'; return getBiorhythmForm(); },
    'zodiac': function() { formTitle.innerHTML = toolHead('سال حیوانی', 'zodiac'); calcBtn.style.display = 'none'; return getZodiacForm(); },
    'daily-question': function() { formTitle.innerHTML = toolHead('پرسش روزانه', 'daily-question'); calcBtn.style.display = 'none'; return getDailyQuestionForm(); },
    'hafez': function() { formTitle.innerHTML = toolHead('فال حافظ', 'hafez'); calcBtn.style.display = 'none'; return getHafezForm(); },
    'nasa': function() { formTitle.innerHTML = toolHead('ناسا', 'nasa'); calcBtn.style.display = 'none'; return getNasaForm(); },
    'moon-phase': function() { formTitle.innerHTML = toolHead('فاز ماه', 'moon-phase'); calcBtn.style.display = 'none'; return getMoonPhaseForm(); },

    'lunar-return': function() {
        formTitle.innerHTML = toolHead('بازگشت ماهانه', 'lunar-return'); calcBtn.innerHTML = window.uiIcon('lunar-return') + ' محاسبه';
        var currentYear = new Date().getFullYear();
        var yearOpts = '';
        for (var y = currentYear; y <= currentYear + 1; y++) yearOpts += makeOption(y, y);
        var monthNames = ['\u0641\u0631\u0648\u0631\u06cc\u0646','\u0627\u0631\u062f\u06cc\u0628\u0647\u0634\u062a','\u0627\u0631\u062f\u0628\u0647\u0634\u062a','\u062f\u0631\u0648\u06cc\u0632\u0647','\u062a\u06cc\u0631','\u0627\u0631\u062f\u06cc\u0628\u0647\u0634\u062a','\u062a\u06cc\u0631\u0645\u0647','\u0645\u0647\u0631','\u0622\u0628\u0627\u0646','\u0622\u0630\u0631','\u0622\u0630\u0627\u0631','\u062f\u06cc\u0633\u0627\u0646\u0628\u0631'];
        var monthOpts = '';
        for (var m = 1; m <= 12; m++) monthOpts += makeOption(m, _jMonthName(m));
        return buildPersonForm('p1','چارت تولد','natal')+
            '<div class="form-section"><div class="form-grid">'+
            '<div class="form-group"><label>🌙 سال</label><select id="return_year">'+yearOpts+'</select></div>'+
            '<div class="form-group"><label>🌙 ماه</label><select id="return_month">'+monthOpts+'</select></div>'+
            '</div></div>';
    }
};

function attachSharedInputListeners() {
    formContainer.querySelectorAll('input, select').forEach(function(el) {
        el.addEventListener('change', syncSharedInputsFromForm);
        el.addEventListener('input', syncSharedInputsFromForm);
    });
}

function doSwitchTab(tab) {
    // Always update calcBtn + orb-wrapper visibility, even on same tab
    var usesCalcBtn = ['birth', 'synastry', 'composite', 'transit', 'solar-return', 'lunar-return'].indexOf(tab) !== -1;
    calcBtn.style.display = usesCalcBtn ? 'block' : 'none';
    var orbWrap = calcBtn.closest('.orb-wrapper');
    if (orbWrap) {
        if (usesCalcBtn) orbWrap.classList.add('visible');
        else orbWrap.classList.remove('visible');
    }
    // Also sync via liquidOrb API if available (handles race with lazy-loaded orb)
    if (window.liquidOrb && window.liquidOrb.sync) window.liquidOrb.sync();

    // Early return فقط اگر فرمِ همان تب واقعاً موجود است
    // (currentTab ممکن است از بازدید قبلی stale باشد و formContainer خالی/متعلق به تب دیگر)
    if (tab === currentTab && formContainer.innerHTML.trim() !== '' && formContainer.querySelector('[data-tab-content="' + tab + '"]')) return;
    syncSharedInputsFromForm();
    document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
    var btn = document.querySelector('.tab-btn[data-tab="' + tab + '"]');
    if (btn) btn.classList.add('active');
    currentTab = tab;
    /* اعلام بخش فعلی به پلیر وینیلی (تخصیص موسیقی هر سرویس) */
    if (window.VinylPlayer) { try { VinylPlayer.setSection(tab); } catch (_) {} }
    var formHtml = formBuilders[tab]();
    var info = TAB_INFO[tab];
    if (info) formHtml = makeInfoSection(info.title, info.text) + formHtml;
    // نشانگر تب فعال برای early-return درست
    formHtml = formHtml.replace('<div style="max-width', '<div data-tab-content="' + tab + '" style="max-width');
    formContainer.innerHTML = formHtml;
    attachCityAutocomplete();
    reattachMapButton();
    applySharedInputs();
    attachDatePickerTriggers(tab);
    _lastLocationBarKey = '';
    updateLocationBar();
    document.getElementById('result').style.display = 'none';
    document.getElementById('status').style.display = 'none';
    attachSharedInputListeners();
    /* ورود به تب چارت با تاریخ ثبت‌شده → خودکار محاسبه/تفسیر را شروع کن
       (بدون کلیک). فقط یک‌بار هر نشست؛ محاسبات موتور تازه، تفسیر از کش. */
    if (tab === 'birth') {
        setTimeout(tryAutoBirthChart, 400);
        setTimeout(loadMyBirthCharts, 250);
    }
    // بادبزن ۱۲ حیوان — فقط در تب زودیاک
    if (tab === 'zodiac' && typeof _zcInitFan === 'function') {
        setTimeout(_zcInitFan, 50);
    }
}
window.switchTab = doSwitchTab;

var _tabNavEl = document.getElementById('tabNav');
if (_tabNavEl) _tabNavEl.addEventListener('click', function(e) {
    var btn = e.target.closest('.tab-btn');
    if (!btn) return;
    doSwitchTab(btn.dataset.tab);
});

function attachCityAutocomplete() {
    // Initialize CitySelector (province→city dropdown) on all city containers
    document.querySelectorAll('.city-selector').forEach(function(container) {
        if (container._csInit) return;
        container._csInit = true;
        // Determine the prefix from container ID
        // e.g. 'birthCitySelector' -> '', 'p1_city_selector' -> 'p1_'
        var cid = container.id || '';
        var prefix = '';
        if (cid.indexOf('p1_') === 0 || cid.indexOf('p2_') === 0) {
            prefix = cid.substring(0, 2) + '_';
        }
        // The hidden input for city name
        var cityInputId = prefix ? prefix + 'city' : 'cityName';
        var instance = CitySelector(container.id, {
            inputId: cityInputId,
            onSelect: function(data) {
                // CitySelector already fills its own hidden inputs for lat/lng/tz
                // Also sync to the form's lat/lng/tz fields
                var latEl = document.getElementById(prefix + 'lat') || document.getElementById('latitude');
                var lngEl = document.getElementById(prefix + 'lng') || document.getElementById('longitude');
                var tzEl = document.getElementById(prefix + 'tz') || document.getElementById('timezone');
                if (data.lat && latEl) latEl.value = data.lat;
                if (data.lng && lngEl) lngEl.value = data.lng;
                if (data.tz && tzEl) {
                    var tzVal = String(data.tz);
                    tzEl.value = tzVal;
                    // Force the select to visually update
                    tzEl.dispatchEvent(new Event('change', { bubbles: true }));
                }
                // Sync shared inputs
                syncSharedInputsFromForm();
                updateLocationBar();
            }
        });
        // Store instance for cross-tab sharing
        _csInstances[container.id] = instance;
        // Add map button next to city selector
        var mapBtn = document.createElement('button');
        mapBtn.type = 'button';
        mapBtn.className = 'cs-map-btn';
        mapBtn.title = 'مختصات دقیق محل تولد';
        mapBtn.innerHTML = '\ud83d\udccd <span class="cs-map-btn-label">مختصات دقیق محل تولد</span>';
        mapBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            openMapForPrefix(prefix);
        });
        container.appendChild(mapBtn);
    });
    // Fallback: old-style Nominatim autocomplete for remaining text inputs
    formContainer.querySelectorAll('input[id$="_city"], #cityName').forEach(function(input) {
        if (input.closest('.city-selector')) return; // skip if city-selector
        var timeout;
        input.addEventListener('input', function() {
            clearTimeout(timeout);
            timeout = setTimeout(async function() {
                var val = input.value.trim();
                if (val.length < 2) return;
                var coords = await getCoordinates(val);
                if (coords) {
                    var prefix = input.id === 'cityName' ? '' : input.id.replace('_city','')+'_';
                    var latEl = document.getElementById(prefix+'lat');
                    var lngEl = document.getElementById(prefix+'lng');
                    var tzEl = document.getElementById(prefix+'tz');
                    if (latEl) latEl.value = coords.lat;
                    if (lngEl) lngEl.value = coords.lng;
                    if (tzEl) tzEl.value = coords.tz;
                }
            }, 400);
        });
    });
}

function reattachMapButton() {
    // Legacy: static openMapBtn in HTML (if present)
    var mapBtn = document.getElementById('openMapBtn');
    if (mapBtn) {
        mapBtn.addEventListener('click', function() {
            openMapForPrefix('');
        });
    }
    // City selector map buttons are handled by city-selector.js via openMapForPrefix
}

function buildSubject(prefix) {
    var p = prefix ? prefix+'_' : '';
    // Try hidden date wheel picker value first, then fall back to date input
    var dateEl = document.getElementById(p+'date_hidden') || document.getElementById(p+'date') || document.getElementById('birthDatePicker_hidden') || document.getElementById('birthDate');
    var hourEl = document.getElementById(p+'hour') || document.getElementById('birthHour');
    var minEl = document.getElementById(p+'minute') || document.getElementById('birthMinute');
    var latEl = document.getElementById(p+'lat') || document.getElementById('latitude');
    var lngEl = document.getElementById(p+'lng') || document.getElementById('longitude');
    var tzEl = document.getElementById(p+'tz') || document.getElementById('timezone');
    var cityEl = document.getElementById(p+'city') || document.getElementById('cityName');
    var nameEl = document.getElementById(p+'name') || document.getElementById('userName');
    if (!dateEl || !dateEl.value) return null;
    var parts = dateEl.value.split('-');
    if (parts.length < 3) return null;
    // The wheel picker stores the date in the SELECTED calendar (default shamsi).
    // Convert 1300–1600 range to Gregorian before sending to the backend, which
    // computes in Gregorian CE only — otherwise the chart is silently wrong.
    var dpState = _dpState[(p ? p.replace(/_$/, '') : '') + 'date'] || _dpState['birthDatePicker'] || {};
    var pickedCal = dpState.calType || 'shamsi';
    var yr = parseInt(parts[0]), mo = parseInt(parts[1]), dy = parseInt(parts[2]);
    if (pickedCal === 'shamsi' && yr >= 1300 && yr <= 1600 && window.shamsiToGregorianDate) {
        var g = window.shamsiToGregorianDate(yr, mo, dy);
        if (g) { yr = g.gy; mo = g.gm; dy = g.gd; }
    }
    if (yr < 1279) throw new Error('مردگان ستاره‌ای در چارت ندارند 🌌');
    var tzOffset = String(parseFloat(tzEl.value));
    return {
        year: yr, month: mo, day: dy,
        hour: parseInt(hourEl.value) || 12, minute: parseInt(minEl.value) || 0, second: 0,
        longitude: parseFloat(lngEl.value) || 51.3890, latitude: parseFloat(latEl.value) || 35.6892,
        timezone: TZ_OFFSET_TO_IANA[tzOffset] || 'Etc/UTC',
        city: (cityEl && cityEl.value ? cityEl.value : 'Unknown').trim(), nation: null,
        name: (nameEl.value || 'User').trim()
    };
}



function renderPlanetGrid(subj) {
    if (!subj) return '';
    var html = '';
    ['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto'].forEach(function(key) {
        var obj = subj[key];
        if (obj && obj.name) {
            html += '<div class="grid-item visible">'+signEmoji(obj.sign)+' <span class="p-name">'+translate(obj.name)+'</span><span class="p-detail">'+translate(obj.sign)+' '+(obj.position?obj.position.toFixed(1):'?')+'° <span class="badge-house">'+translate(obj.house)+'</span></span></div>';
        }
    });
    return html;
}

// ================================================================
//   MAIN CALC BUTTON (TAB-AWARE)
// ================================================================
calcBtn.addEventListener('click', async function() {
    // ─── Premium gating: block only when user tries to USE the tool ───
    var PREMIUM_TOOLS = ['composite', 'solar-return', 'lunar-return', 'qol'];
    if (PREMIUM_TOOLS.indexOf(currentTab) >= 0) {
        var _u = {};
        try { _u = JSON.parse(localStorage.getItem('cosmic_user') || '{}'); } catch(_) {}
        if ((_u.plan || 'free') === 'free') {
            if (window.showToast) showToast('💎 برای استفاده از این ابزار، اشتراک طلایی تهیه کنید', 'warning');
            else alert('💎 برای استفاده از این ابزار، اشتراک طلایی تهیه کنید');
            if (window.openPricingModal) window.openPricingModal();
            else if (window.openLoginModal) window.openLoginModal();
            return;
        }
    }
    /* اگر تفسیر چارتِ تاریخِ قبلی آمادهٔ ثبت‌نشده باشد، اول درباره‌اش بپرس */
    if (window.AnalysisJobs) {
        var _newKey = '';
        try { _newKey = AnalysisJobs.keyFor(buildSubject('')) || ''; } catch (_) {}
        try { await AnalysisJobs.guardNewChart(_newKey); } catch (_) {}
    }
    var resultDiv = document.getElementById('result');
    var statusDiv = document.getElementById('status');
    resultDiv.style.display = 'block';
    resultDiv.innerHTML = makeResultShimmer();
    resultDiv.classList.remove('result-crossfade');
    statusDiv.style.display = 'block';
    statusDiv.innerHTML = makeShimmerCompact('⏳ در حال دریافت اطلاعات...');
    statusDiv.style.color = '#b0caff';
    if (window.liquidOrb) { window.liquidOrb.show(); window.liquidOrb.thinking(); }
    try {
        if (currentTab === 'birth') await handleBirthChart();
        else if (currentTab === 'synastry') await handleSynastry();
        else if (currentTab === 'composite') await handleComposite();
        else if (currentTab === 'transit') await handleTransit();
        else if (currentTab === 'solar-return') await handleReturn('solar-return', '☀️ بازگشت خورشیدی');
        else if (currentTab === 'lunar-return') await handleReturn('lunar-return', '🌙 بازگشت ماهانه');

        else if (currentTab === 'mizaj') { submitMizaj(); if (window.liquidOrb) window.liquidOrb.hide(); return; }
        statusDiv.innerHTML = '✅ انجام شد!';
        statusDiv.style.color = '#5fbf5f';
        if (window.liquidOrb) { window.liquidOrb.idle(); setTimeout(function() { window.liquidOrb.hide(); }, 700); }
    } catch (err) {
        statusDiv.innerHTML = '⚠️ خطا: ' + err.message;
        statusDiv.style.color = '#e87474';
        console.error(err);
        if (window.liquidOrb) { window.liquidOrb.idle(); setTimeout(function() { window.liquidOrb.hide(); }, 700); }
    }
});

// ============================================================
//   CHART RESULT CACHE (sessionStorage)
// ============================================================
var _chartCache = {};

function _hashPayload(payload) {
    // Simple hash of JSON string for cache key
    var s = JSON.stringify(payload);
    var h = 0;
    for (var i = 0; i < s.length; i++) {
        h = ((h << 5) - h) + s.charCodeAt(i);
        h |= 0;
    }
    return h.toString(36);
}

async function fetchWithCache(url, payload) {
    var key = 'chart_' + url.split('/').pop() + '_' + _hashPayload(payload);
    // Check in-memory cache first (instant)
    if (_chartCache[key]) return _chartCache[key];
    // Check sessionStorage (survives tab switches)
    try {
        var cached = sessionStorage.getItem(key);
        if (cached) {
            var data = JSON.parse(cached);
            _chartCache[key] = data;
            return data;
        }
    } catch (_) {}
    // Fetch from API
    var headers = {'Content-Type':'application/json'};
    // Guest (not logged in): attach fingerprint so server enforces per-identity quota
    if (window.getGuestFingerprint && window.isGuestLoggedOut()) {
        headers['X-Guest-Fingerprint'] = window.getGuestFingerprint();
    }
    var resp = await fetch(url, { method: 'POST', headers: headers, body: JSON.stringify(payload) });
    if (!resp.ok) { var err = await resp.json(); throw new Error(err.message || err.detail || 'خطا'); }
    var data = await resp.json();
    if (data.status !== 'OK') throw new Error(data.message || 'خطا');
    // Refresh guest quota display after consuming one
    if (window.refreshGuestUsage) window.refreshGuestUsage();
    // Cache it
    _chartCache[key] = data;
    try { sessionStorage.setItem(key, JSON.stringify(data)); } catch (_) {}
    return data;
}

// ============================================================
//   SHAREABLE CHART LINKS
// ============================================================
function encodeShareData(type, subjects) {
    var data = { t: type };
    if (subjects.p1) data.p1 = subjects.p1;
    if (subjects.p2) data.p2 = subjects.p2;
    return btoa(unescape(encodeURIComponent(JSON.stringify(data))));
}

function decodeShareData(encoded) {
    try {
        return JSON.parse(decodeURIComponent(escape(atob(encoded))));
    } catch (_) { return null; }
}

function getShareUrl(type, subjects) {
    var base = window.location.origin + window.location.pathname;
    var encoded = encodeShareData(type, subjects);
    return base + '?share=' + encoded;
}

async function shareChart() {
    var shareData = window._lastShareData;
    if (!shareData) return;
    var url = getShareUrl(shareData.type, shareData.subjects);
    
    if (navigator.share) {
        try {
            await navigator.share({ title: 'نتیجه چارت ستاره‌شناسی', url: url });
            return;
        } catch (_) {}
    }
    
    // Fallback: copy to clipboard
    try {
        await navigator.clipboard.writeText(url);
        showToast('لینک کپی شد! 📋');
    } catch (_) {
        // Final fallback: show in prompt
        prompt('لینک اشتراک‌گذاری:', url);
    }
}

function showToast(message) {
    var toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;
    toast.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#6c5ce7;color:white;padding:12px 24px;border-radius:12px;z-index:10000;font-size:14px;box-shadow:0 4px 12px rgba(0,0,0,0.3);animation:toastIn 0.3s ease';
    document.body.appendChild(toast);
    setTimeout(function() { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.3s'; setTimeout(function() { toast.remove(); }, 300); }, 2500);
}

// Add share button to result area
function addShareButton(type, subjects) {
    window._lastShareData = { type: type, subjects: subjects };
    var resultDiv = document.getElementById('result');
    if (!resultDiv) return;
    var existing = resultDiv.querySelector('.share-btn-wrap');
    if (existing) existing.remove();
    var wrap = document.createElement('div');
    wrap.className = 'share-btn-wrap';
    wrap.innerHTML = '<button class="share-btn" onclick="shareChart()">📤 اشتراک‌گذاری نتیجه</button>';
    resultDiv.appendChild(wrap);
}

// Auto-fill from shared URL on page load
function loadSharedChart() {
    var params = new URLSearchParams(window.location.search);
    var share = params.get('share');
    if (!share) return;
    var data = decodeShareData(share);
    if (!data) return;
    
    // Auto-fill person 1
    if (data.p1) fillPersonForm('', data.p1);
    // Auto-fill person 2 if present
    if (data.p2) fillPersonForm('p2_', data.p2);
    
    // Auto-trigger the chart after a short delay
    setTimeout(function() {
        var tabMap = { 'birth': 'tab-birth', 'synastry': 'tab-synastry', 'composite': 'tab-composite', 'transit': 'tab-transit', 'solar-return': 'tab-solar', 'lunar-return': 'tab-lunar' };
        var tabId = tabMap[data.t];
        if (tabId) {
            var tab = document.getElementById(tabId);
            if (tab) tab.click();
        }
    }, 500);
    
    // Clean URL
    window.history.replaceState({}, '', window.location.pathname);
}

function fillPersonForm(prefix, personData) {
    var setVal = function(id, val) {
        var el = document.getElementById(id);
        if (el && val !== undefined && val !== null) el.value = val;
    };
    setVal(prefix + 'name', personData.name);
    setVal(prefix + 'date_hidden', personData.year + '-' + String(personData.month).padStart(2,'0') + '-' + String(personData.day).padStart(2,'0'));
    setVal(prefix + 'hour', personData.hour);
    setVal(prefix + 'minute', personData.minute);
    setVal(prefix + 'lat', personData.latitude);
    setVal(prefix + 'lng', personData.longitude);
    setVal(prefix + 'city', personData.city);
    if (personData.timezone) {
        // Try to find matching tz offset
        var tzKeys = Object.keys(TZ_OFFSET_TO_IANA || {});
        for (var i = 0; i < tzKeys.length; i++) {
            if (TZ_OFFSET_TO_IANA[tzKeys[i]] === personData.timezone) {
                setVal(prefix + 'tz', tzKeys[i]);
                break;
            }
        }
    }
}

// Run on page load
document.addEventListener('DOMContentLoaded', loadSharedChart);

async function handleBirthChart() {
    var subject = buildSubject('');
    if (!subject) throw new Error('تاریخ تولد را انتخاب کنید.');
    /* کلید یکتای این تاریخ تولد — مبنای dedup تفسیر AI (محاسبات موتور همیشه تازه) */
    window.__ajKey = (window.AnalysisJobs && AnalysisJobs.keyFor) ? AnalysisJobs.keyFor(subject) : '';
    window.__ajSubject = subject;   // برای subject_json → dropdown چارت‌های من
    var payloadData = { subject: subject };
    var data = await fetchWithCache('/api/v5/chart-data/birth-chart', payloadData);
    currentData = data;
    try {
        var ctxResp = await fetch('/api/v5/context/birth-chart', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payloadData) });
        if (ctxResp.ok) { currentContext = (await ctxResp.json()).context || ''; } else { currentContext = null; }
    } catch (_) { currentContext = null; }
    var svgText = '';
    try {
        var respSvg = await fetch('/api/v5/chart/svg-from-subject', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payloadData) });
        if (respSvg.ok) svgText = await respSvg.text();
    } catch (_) {}
    await displayResult(data, currentContext, svgText);
    addShareButton('birth', { p1: buildSubject('') });
}

/* ── Auto-birth-chart (2026-09-16): ورود به تب با تاریخ ثبت‌شده →
   بدون کلیک «دریافت چارت»، همان جریان calcBtn اجرا شود. محاسبات موتور
   (SVG/سیارات) تازه می‌ماند؛ تفسیر AI با کلیدِ تاریخ از کش برمی‌گردد.
   یک‌بار در نشست؛ prefillِ پروفایل هم بعد از اعمالِ تاریخ صداش می‌زند. ── */
var _autoBirthDone = false;
function tryAutoBirthChart() {
    if (_autoBirthDone || currentTab !== 'birth' || !calcBtn) return;
    var prof = null;
    try { prof = JSON.parse(localStorage.getItem('cosmic_profile') || 'null'); } catch (_) {}
    var g = null;
    try { g = _gregorianBirth(); } catch (_) {}
    var hasProfileBirth = !!(prof && prof.birth_year && prof.birth_month && prof.birth_day);
    var hasRealLocal = !!(g && !(g.year === 2001 && g.month === 1 && g.day === 1));
    if (!hasProfileBirth && !hasRealLocal) return;
    _autoBirthDone = true;
    calcBtn.click();
}
/* ورود/ثبت‌نام که شد: prefill دوباره + تلاش auto */
window.addEventListener('cosmic:auth', function () {
    _autoBirthDone = false;
    try { prefillProfileFromServer(); } catch (_) {}
    setTimeout(tryAutoBirthChart, 1200);   // بعد از رسیدن پاسخ profile
    setTimeout(loadMyBirthCharts, 1400);
});

/* ── dropdown «چارت‌های قبلیِ من» (2026-09-16) ──
   لیست از /analysis-jobs/mine (سمت سرور — روی هر دستگاه/مرورگری کار
   می‌کند). انتخاب یک مورد = پرکردن فرم با همان subject + اجرای عادی
   calcBtn: موتور/SVG تازه محاسبه می‌شود و تفسیر AI به‌خاطر dedup با
   birth_key از همان کشِ سرور برمی‌گردد (بدون تولید دوباره). */
var _myBirthCharts = [];
async function loadMyBirthCharts() {
    var sel = document.getElementById('myBirthChartsSel');
    var wrap = document.getElementById('myBirthChartsWrap');
    if (!sel || !wrap) return;
    try {
        var h = {};
        var t = _profileToken();
        if (t) h['Authorization'] = 'Bearer ' + t;
        else if (window.getGuestFingerprint) h['X-Guest-Fingerprint'] = window.getGuestFingerprint();
        else { wrap.style.display = 'none'; return; }
        var r = await fetch('/api/v5/analysis-jobs/mine', { headers: h });
        if (!r.ok) { wrap.style.display = 'none'; return; }
        var d = await r.json();
        var items = (d && d.items ? d.items : []).filter(function (x) { return x.subject && x.status !== 'error'; });
        if (!items.length) { wrap.style.display = 'none'; return; }
        _myBirthCharts = items;
        var html = '<option value="">— انتخاب کنید —</option>';
        items.forEach(function (x, i) {
            var s = x.subject;
            var j = s.year, jm = s.month, jd = s.day;
            try { if (window.JalaliDate) { var g2j = JalaliDate.gregorianToJalali(s.year, s.month, s.day); if (g2j && g2j.jy) { j = g2j.jy; jm = g2j.jm; jd = g2j.jd; } } } catch (_) {}
            var when = j + '/' + jm + '/' + jd;
            var lbl = (x.title || s.name || 'چارت') + ' · ' + when + (x.has_interp ? ' ✓تفسیر' : ' ⏳در صف');
            html += '<option value="' + i + '">' + lbl.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;') + '</option>';
        });
        sel.innerHTML = html;
        wrap.style.display = 'block';
        sel.onchange = function () {
            var idx = parseInt(sel.value, 10);
            sel.value = '';
            if (isNaN(idx) || !_myBirthCharts[idx]) return;
            fillFormFromSavedSubject(_myBirthCharts[idx].subject);
        };
    } catch (_) { wrap.style.display = 'none'; }
}
function fillFormFromSavedSubject(s) {
    if (!s) return;
    _autoBirthDone = true;   // ورود دستی‌ست؛ auto-کلیک خودکار دوباره اجرا نشود
    var jd = null;
    try { if (window.JalaliDate) jd = JalaliDate.gregorianToJalali(s.year, s.month, s.day); } catch (_) {}
    sharedInputs.name = s.name || sharedInputs.name;
    if (jd && jd.jy) sharedInputs.birthDate = { year: jd.jy, month: jd.jm, day: jd.jd };
    if (s.hour != null) sharedInputs.birthHour = s.hour;
    if (s.minute != null) sharedInputs.birthMinute = s.minute;
    if (typeof s.latitude === 'number') sharedInputs.latitude = s.latitude;
    if (typeof s.longitude === 'number') sharedInputs.longitude = s.longitude;
    if (s.city) sharedInputs.city = s.city;
    if (s.timezone) {
        var keys = Object.keys(TZ_OFFSET_TO_IANA || {});
        for (var i = 0; i < keys.length; i++) {
            if (TZ_OFFSET_TO_IANA[keys[i]] === s.timezone) { sharedInputs.timezone = keys[i]; break; }
        }
    }
    persistSharedInputsLocal();
    applySharedInputs();
    var nm = document.getElementById('userName'); if (nm && s.name) nm.value = s.name;
    var cityEl = document.getElementById('cityName') || document.querySelector('#birthCitySelector input');
    if (cityEl && s.city) cityEl.value = s.city;
    if (calcBtn) calcBtn.click();
}

async function handleSynastry() {
    var s1 = buildSubject('p1'), s2 = buildSubject('p2');
    if (!s1 || !s2) throw new Error('اطلاعات هر دو شخص لازم است.');
    var data = await fetchWithCache('/api/v5/chart-data/synastry', { first_subject: s1, second_subject: s2 });
    document.getElementById('result').innerHTML = displayGenericChart(data, window.uiIcon('synastry') + ' سیناستری', 'synastry');
    document.getElementById('result').classList.add('result-crossfade');
    animateScoreProgressBars();
    addShareButton('synastry', { p1: buildSubject('p1'), p2: buildSubject('p2') });
}

async function handleComposite() {
    var s1 = buildSubject('p1'), s2 = buildSubject('p2');
    if (!s1 || !s2) throw new Error('اطلاعات هر دو شخص لازم است.');
    var data = await fetchWithCache('/api/v5/chart-data/composite', { first_subject: s1, second_subject: s2 });
    document.getElementById('result').innerHTML = displayGenericChart(data, '🔗 کامپوزیت', 'composite');
    document.getElementById('result').classList.add('result-crossfade');
    animateScoreProgressBars();
    addShareButton('composite', { p1: buildSubject('p1'), p2: buildSubject('p2') });
}

async function handleTransit() {
    var natal = buildSubject('p1');
    if (!natal) throw new Error('اطلاعات چارت تولد لازم است.');
    var tdHidden = document.getElementById('transitDatePicker_hidden');
    if (!tdHidden || !tdHidden.value) throw new Error('تاریخ ترانزیت را انتخاب کنید.');
    /* hidden همیشه شمسی ISO است — مثل buildSubject باید به میلادی تبدیل شود
       (بک‌اند میلادی حساب می‌کند؛ بدون تبدیل، ترانزیتِ «سال ۱۴۰۴ میلادی» می‌گرفت) */
    var tParts = tdHidden.value.split('-');
    var tY = parseInt(tParts[0]), tM = parseInt(tParts[1]), tD = parseInt(tParts[2]);
    if (tY >= 1300 && tY <= 1600 && window.shamsiToGregorianDate) {
        var tg = window.shamsiToGregorianDate(tY, tM, tD);
        if (tg) { tY = tg.gy; tM = tg.gm; tD = tg.gd; }
    }
    var transitSubject = {
        year: tY, month: tM, day: tD,
        hour: parseInt(document.getElementById('transit_hour').value) || 12,
        minute: parseInt(document.getElementById('transit_minute').value) || 0, second: 0,
        longitude: natal.longitude, latitude: natal.latitude, timezone: natal.timezone,
        city: natal.city, nation: natal.nation, name: 'Transit'
    };
    var data = await fetchWithCache('/api/v5/chart-data/transit', { first_subject: natal, transit_subject: transitSubject });
        document.getElementById('result').innerHTML = displayScoreInterpretation(data, '🌍 ترانزیت', 'transit');
    document.getElementById('result').classList.add('result-crossfade');
    animateScoreProgressBars();
    addShareButton('transit', { p1: buildSubject('p1') });
}

async function handleReturn(endpoint, title) {
    var subject = buildSubject('p1');
    if (!subject) throw new Error('\u0627\u0637\u0644\u0627\u0639\u0627\u062a \u0686\u0627\u0631\u062a \u062a\u0648\u0644\u062f \u0644\u0627\u0632\u0645 \u0627\u0633\u062a.');
    var payload = { subject: subject };
    if (endpoint === 'solar-return') {
        var yearEl = document.getElementById('return_year');
        if (!yearEl || !yearEl.value) throw new Error('\u0633\u0627\u0644 \u0628\u0627\u0632\u06af\u0634\u062a \u0631\u0627 \u0648\u0627\u0631\u062f \u06a9\u0646\u06cc\u062f.');
        payload.year = parseInt(yearEl.value);
    } else {
        // Lunar: needs year + month
        var yearEl2 = document.getElementById('return_year');
        var monthEl = document.getElementById('return_month');
        if (!yearEl2 || !yearEl2.value) throw new Error('\u0633\u0627\u0644 \u0631\u0627 \u0648\u0627\u0631\u062f \u06a9\u0646\u06cc\u062f.');
        payload.year = parseInt(yearEl2.value);
        if (monthEl && monthEl.value !== '0') payload.month = parseInt(monthEl.value);
    }
    var data = await fetchWithCache('/api/v5/chart-data/' + endpoint, payload);
    document.getElementById('result').innerHTML = displayScoreInterpretation(data, title, endpoint);
    document.getElementById('result').classList.add('result-crossfade');
    animateScoreProgressBars();
    addShareButton(endpoint, { p1: buildSubject('p1') });
}


// ================================================================
//   DISPLAY RESULT (با ترتیب جدید)
// ================================================================
async function displayResult(data, context, svgContent) {
    const resultDiv = document.getElementById('result');
    const chart = data.chart_data;
    const subject = chart.subject;
    const vedic = data.vedic_interpretations || {};

    let html = '';

    // ---- Grid دوستونی: SVG + DeepSeek ----
    html += '<div class="result-grid">';
    
    if (svgContent && svgContent.trim()) {
        html += `<div class="section-card" id="section-svg">
            <div class="section-title"><span class="emoji-big">🖼️</span> چارت نجومی</div>
            <div style="text-align:center; overflow:auto; max-width:100%;">
                <img src="data:image/svg+xml;utf8,${encodeURIComponent(svgContent)}" style="max-width:100%; height:auto; display:block; margin:0 auto;" />
            </div>
        </div>`;
    } else {
        html += `<div class="section-card" id="section-svg">
            <div class="section-title"><span class="emoji-big">🖼️</span> چارت نجومی</div>
            <div style="text-align:center; color:#5a526e; padding:40px 0;">⚠️ SVG در دسترس نیست</div>
        </div>`;
    }

    if (context) {
        html += `<div class="section-card" id="section-deepseek">
            <div class="section-title"><span class="emoji-big">🧠</span> در حال تحلیل و آماده‌سازی تفسیر چارت</div>
            <div class="analysis-box" id="deepseek-box">
                <span style="color:#5a526e;">${deEmoji('⏳ در حال دریافت تفسیر چارت...')}</span>
            </div>
        </div>`;
    } else {
        html += `<div class="section-card" id="section-deepseek">
            <div class="section-title"><span class="emoji-big">🧠</span> در حال تحلیل و آماده‌سازی تفسیر چارت</div>
            <div class="analysis-box" style="color:#5a526e;">⚠️ متن context در دسترس نیست.</div>
        </div>`;
    }

    html += '</div>';

    // ---- Elements ----
    if (chart.element_distribution) {
        const el = chart.element_distribution;
        html += `<div class="section-card" id="section-elements"><div class="section-title"><span class="emoji-big">🔥</span> توزیع عناصر</div><div class="grid-masonry-3" id="elements-grid">`;
        const items = [
            { key: 'fire', p: el.fire_percentage, color: '#ff6600' },
            { key: 'earth', p: el.earth_percentage, color: '#6a2d04' },
            { key: 'air', p: el.air_percentage, color: '#6f76d1' },
            { key: 'water', p: el.water_percentage, color: '#630e73' }
        ];
        items.forEach(item => {
            const info = getElementInterpretation(item.key, item.p || 0);
            html += `<div class="element-item stagger-item">
                <div class="el-value" style="color:${item.color};">${item.p || 0}%</div>
                <div class="el-label" style="color:${item.color};">${translate(item.key)}</div>
                <div class="el-desc">${info.split('—')[1] || ''}</div>
            </div>`;
        });
        html += `</div></div>`;
    }

    // ---- Moon Phase ----
    if (subject.lunar_phase) {
        const lp = subject.lunar_phase;
        const phaseName = translate(lp.moon_phase_name) || 'نامشخص';
        const phaseDesc = getMoonPhaseInterpretation(lp.moon_phase_name);
        html += `<div class="section-card" id="section-moon"><div class="section-title"><span class="emoji-big">🌙</span> فاز ماه</div>
            <div class="moon-phase-box stagger-item">
                <div class="mp-emoji">${lp.moon_emoji || '🌙'}</div>
                <div class="mp-info">
                    <div class="mp-name">${phaseName}</div>
                    <div class="mp-desc">${phaseDesc}</div>
                </div>
                <div class="mp-degree">مرحله ${lp.moon_phase || 0}</div>
            </div>
        </div>`;
    }

    // ---- Vedic ----
    if (Object.keys(vedic).length > 0) {
        html += `<div class="section-card" id="section-vedic">
            <div class="section-title"><span class="emoji-big">📜</span> تفسیر ودیک (Vedic) <span class="badge-count">${Object.keys(vedic).length}</span></div>
            <div class="vedic-grid" id="vedic-container">`;
        const planetOrder = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Rahu', 'Ketu'];
        const sorted = Object.keys(vedic).sort((a, b) => {
            const ia = planetOrder.indexOf(a);
            const ib = planetOrder.indexOf(b);
            return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
        });
        for (const planet of sorted) {
            const interp = vedic[planet];
            if (!interp) continue;
            const planetFa = translate(planet);
            const signFa = translate(interp.sign) || '';
            const house = interp.house || '?';
            const lordship = interp.lordship || [];
            const fn = interp.functional_nature || {};
            const nature = fn.nature || 'Neutral';
            const type = fn.type || '';
            const drishti = interp.drishti || [];
            const nakshatra = interp.nakshatra;
            const strength = interp.planetary_strength || {};

            const simpleNature = simpleFunctionalNature(nature, type);
            const simpleStrength = strength.status ? simplePlanetaryStrength(strength.status) : '';

            html += `<div class="vedic-item stagger-item">
                <span class="planet-name">${planetFa}</span>
                <span class="planet-detail">در برج ${signFa} · <span class="badge-house">خانه ${house}</span></span>
                ${lordship.length ? `<span class="planet-detail" style="color:#f2d275;font-size:12px;">🏠 صاحب خانه‌های ${lordship.join('، ')}</span>` : ''}
                <span class="vedic-detail ${getNatureClass(nature)}">⭐ ${simpleNature}</span>
                ${drishti.length ? `<span class="vedic-detail" style="color:#b0caff;">👁️ نگاه به خانه‌های ${drishti.join('، ')}</span>` : ''}
                ${simpleStrength ? `<span class="vedic-detail" style="color:#f2d275;">💪 ${simpleStrength}</span>` : ''}
                ${nakshatra ? `<div class="nakshatra-box"><span>⭐ <strong>ناکشاترا:</strong> ${nakshatra.name_fa || nakshatra.name}</span><span>🌙 حاکم: ${translate(nakshatra.lord) || nakshatra.lord}</span>${nakshatra.interpretation ? `<span style="color:#d4c8a0;">📖 ${nakshatra.interpretation}</span>` : ''}</div>` : ''}
            </div>`;
        }
        html += `</div></div>`;
    }

    // ---- Planets ----
    html += `<div class="section-card" id="section-planets"><div class="section-title"><span class="emoji-big">🪐</span> موقعیت سیارات <span class="badge-count">${Object.keys(subject).filter(k => ['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto'].includes(k)).length}</span></div><div class="grid-masonry" id="planets-grid">`;
    const planetKeys = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];
    planetKeys.forEach(key => {
        const obj = subject[key];
        if (obj && obj.name) {
            const nameFa = translate(obj.name);
            const signFa = translate(obj.sign);
            const emoji = signEmoji(obj.sign);
            const pos = obj.position ? obj.position.toFixed(1) : '?';
            const house = translate(obj.house);
            html += `<div class="grid-item stagger-item">${emoji} <span class="p-name">${nameFa}</span><span class="p-detail">${signFa} ${pos}° <span class="badge-house">خانه ${house}</span></span></div>`;
        }
    });
    html += `</div></div>`;

    // ---- Angles ----
    html += `<div class="section-card" id="section-angles"><div class="section-title"><span class="emoji-big">🌅</span> نقاط حساس</div><div class="grid-masonry-2" id="angles-grid">`;
    const angles = ['ascendant', 'medium_coeli', 'descendant', 'imum_coeli'];
    angles.forEach(key => {
        const obj = subject[key];
        if (obj && obj.name) {
            const nameFa = translate(obj.name);
            const signFa = translate(obj.sign);
            const emoji = signEmoji(obj.sign);
            const pos = obj.position ? obj.position.toFixed(1) : '?';
            html += `<div class="grid-item stagger-item">${emoji} <span class="p-name">${nameFa}</span><span class="p-detail">${signFa} ${pos}°</span></div>`;
        }
    });
    html += `</div></div>`;

    // ---- Aspects ----
    if (chart.aspects && chart.aspects.length > 0) {
        html += `<div class="section-card" id="section-aspects"><div class="section-title"><span class="emoji-big">⚡</span> جنبه‌ها <span class="badge-count">${chart.aspects.length}</span></div><div class="grid-flex" id="aspects-container">`;
        chart.aspects.forEach(a => {
            const p1 = translate(a.p1_name);
            const p2 = translate(a.p2_name);
            const aspect = translate(a.aspect);
            const orb = a.orbit ? a.orbit.toFixed(1) : '?';
            html += `<span class="aspect-item stagger-item">${p1} ${aspect} ${p2} (${orb}°)</span>`;
        });
        html += `</div></div>`;
    }

    resultDiv.innerHTML = html;
    resultDiv.classList.add('result-crossfade');
    await showStaggered();

    if (context) {
        const _dsBox = document.getElementById('deepseek-box');
        if (_dsBox && window.AnalysisJobs) {
            /* هر context جدید = job جدیدِ ماندگار سمت سرور (حتی بعد از رفرش).
               اگر برای همین تاریخ تولد قبلاً تفسیر نوشته شده، همان نمایش
               داده می‌شود و AI دوباره صدا زده نمی‌شود (داخل submit چک می‌شود). */
            var _nm = '';
            try { _nm = (buildSubject('') || {}).name || ''; } catch (_) {}
            AnalysisJobs.submit(context, vedic, _nm, window.__ajKey || '', window.__ajSubject || null).catch(function () {
                _dsBox.innerHTML = '<div style="color:#e87474;">⚠️ ثبت درخواست تفسیر ناموفق بود</div>';
            });
            _dsBox.innerHTML = AnalysisJobs.busyHtml(window.__ajKey);
            AnalysisJobs.renderIfOpen();   // اگر کشِ done داشت، فوراً جای busy را می‌گیرد
        } else if (_dsBox) {
            streamChartAnalysis(_dsBox, context, vedic);   // fallback بدون ماژول job
        }
    }

    // ---- فعال‌سازی بزرگنمایی SVG ----
    setTimeout(function() {
        const container = document.querySelector('#section-svg');
        if (!container) return;
        const img = container.querySelector('img');
        if (!img) return;
        let scale = 1;
        const MIN = 0.5, MAX = 3, STEP = 0.1;
        img.style.cursor = 'zoom-in';
        img.style.transformOrigin = 'center center';
        img.style.transition = 'transform 0.1s ease-out';
        container.addEventListener('wheel', function(e) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -STEP : STEP;
            scale = Math.min(MAX, Math.max(MIN, scale + delta));
            img.style.transform = `scale(${scale})`;
        }, { passive: false });
        container.addEventListener('dblclick', function() {
            scale = 1;
            img.style.transform = 'scale(1)';
        });
    }, 100);

    async function showStaggered() {
        const sections = resultDiv.querySelectorAll('.section-card');
        for (let i = 0; i < sections.length; i++) {
            const section = sections[i];
            section.classList.add('visible');
            section.classList.add('appearing');
            const items = section.querySelectorAll('.stagger-item');
            if (items.length) {
                for (let j = 0; j < items.length; j++) {
                    await sleep(180);
                    items[j].classList.add('visible');
                    items[j].classList.add('appearing');
                }
            } else {
                await sleep(400);
            }
            if (i < sections.length - 1) {
                await sleep(900);
            }
        }
    }
}

// ================================================================
//   DEEPSEEK FROM BACKEND
// ================================================================
function buildVedicSummary(vedicData) {
    if (!vedicData || Object.keys(vedicData).length === 0) return "";
    let vedicSummary = "\n\n**📜 اطلاعات تکمیلی ودیک (Vedic):**\n";
    const planetOrder = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Rahu', 'Ketu'];
    const sorted = Object.keys(vedicData).sort((a, b) => {
        const ia = planetOrder.indexOf(a);
        const ib = planetOrder.indexOf(b);
        return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });
    for (const planet of sorted) {
        const d = vedicData[planet];
        if (!d) continue;
        const pf = translate(planet);
        const sf = translate(d.sign) || '';
        const hs = d.house || '?';
        const ls = d.lordship || [];
        const fn = d.functional_nature || {};
        const nature = fn.nature || 'Neutral';
        const st = d.planetary_strength || {};
        const nk = d.nakshatra || {};
        vedicSummary += `\n- **${pf}** در برج ${sf}، خانه ${hs}`;
        if (ls.length) vedicSummary += `\n  🏠 صاحب خانه‌های ${ls.join('، ')}`;
        vedicSummary += `\n  ⭐ طبیعت: ${nature}`;
        if (st.status) vedicSummary += `\n  💪 قدرت: ${st.status}`;
        if (nk.name_fa) vedicSummary += `\n  🌙 ناکشاترا: ${nk.name_fa} — ${nk.interpretation || ''}`;
    }
    return vedicSummary;
}

/* ── خواننده SSE — پارسِ رله بک‌اند: data: {"c"|"done"|"err"} ──
   (بین script.js و kinetics-cosmic.js مشترک؛ روی window globally) */
async function readAIStream(resp, onPiece) {
    const reader = resp.body.getReader();
    const dec = new TextDecoder();
    let buf = '', errMsg = null, sawDone = false;
    for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let nl;
        while ((nl = buf.indexOf('\n')) >= 0) {
            const line = buf.slice(0, nl).trim();
            buf = buf.slice(nl + 1);
            if (!line.startsWith('data:')) continue;
            let obj;
            try { obj = JSON.parse(line.slice(5)); } catch (_) { continue; }
            if (obj.c) onPiece(obj.c);
            else if (obj.err) errMsg = obj.err;
            else if (obj.done) sawDone = true;
        }
    }
    if (!sawDone && !errMsg) errMsg = 'اتصال پیش از پایان پاسخ قطع شد';
    if (errMsg) throw new Error(errMsg);
}

/* تفسیر چارت به‌صورت استریم + ثانیه‌شمار زنده تا اولین تکه */
async function streamChartAnalysis(box, contextText, vedicData) {
    const vedicSummary = buildVedicSummary(vedicData);
    const retry = () => streamChartAnalysis(box, contextText, vedicData);
    const t0 = Date.now();
    box.innerHTML = '<span style="color:#5a526e;">⏳ در حال دریافت تفسیر چارت… <b id="dsElapsed">0</b></span>';
    const tick = setInterval(() => {
        const el = box.querySelector('#dsElapsed');
        if (el) el.textContent = Math.round((Date.now() - t0) / 1000) + ' ثانیه';
        else clearInterval(tick);
    }, 1000);

    // مرورگر/سرورِ قدیمی بدون پشتیبانی استریم → همان مسیر JSON
    if (typeof ReadableStream === 'undefined' || !window.readAIStream) {
        try {
            const analysis = await getDeepSeekAnalysisFromBackend(contextText, vedicData);
            clearInterval(tick);
            box.innerHTML = analysis;
        } catch (err) {
            clearInterval(tick);
            renderAnalysisErr(box, err.message, retry);
        }
        return;
    }

    let acc = '', got = false;
    try {
        const resp = await fetch('/api/v5/deepseek-analysis/stream', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ context: contextText, vedic_summary: vedicSummary })
        });
        if (!resp.ok || !resp.body) {
            let d = 'پاسخ ناموفق از سرور';
            try { d = (await resp.json()).detail || d; } catch (_) {}
            throw new Error(d);
        }
        await readAIStream(resp, (piece) => {
            acc += piece;
            if (!got) { got = true; clearInterval(tick); }
            // باز‌رندر کامل: تگِ نیمه در آخرین innerHTML خودکار بسته می‌شود
            box.innerHTML = acc + '<span style="color:#5a526e;">▌</span>';
        });
        clearInterval(tick);
        box.innerHTML = acc || '<span style="color:#e87474;">پاسخی دریافت نشد.</span>';
    } catch (err) {
        clearInterval(tick);
        if (got) box.innerHTML = acc;           // نصفه آمده — همان را نگه می‌داریم
        else renderAnalysisErr(box, err.message || 'خطا در ارتباط با هوش مصنوعی', retry);
    }
}

function renderAnalysisErr(box, msg, retry) {
    box.innerHTML = '<div style="color:#e87474;">⚠️ ' + msg + '</div>' +
        '<button type="button" class="analysis-box ds-retry" style="margin-top:10px;padding:8px 18px;border-radius:12px;border:1px solid rgba(221,192,112,.45);background:rgba(16,26,61,.6);color:#f3e5b8;font-family:inherit;font-size:13px;cursor:pointer;">🔄 تلاش مجدد</button>';
    const btn = box.querySelector('.ds-retry');
    if (btn) btn.addEventListener('click', retry);
}

async function getDeepSeekAnalysisFromBackend(contextText, vedicData) {
    let vedicSummary = buildVedicSummary(vedicData);

    try {
        const resp = await fetch('/api/v5/deepseek-analysis', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ context: contextText, vedic_summary: vedicSummary })
        });
        if (!resp.ok) {
            const err = await resp.json();
            throw new Error(err.detail || 'خطا در دریافت تحلیل');
        }
        const data = await resp.json();
        return data.analysis;
    } catch (error) {
        console.error('DeepSeek Error:', error);
        return `❌ خطا در ارتباط با DeepSeek: ${error.message}`;
    }
}

// ================================================================
//   YOGA ENGINE
// ================================================================
(function initYoga() {
    const overlay = document.getElementById('yogaOverlay');
    const circle = document.getElementById('yogaOverlayCircle');
    const phaseText = document.getElementById('yogaPhase');
    const textDisplay = document.getElementById('yogaText');
    const toggleBtn = document.getElementById('yogaToggle');
    const speedSlider = document.getElementById('yogaSpeed');
    const closeBtn = document.getElementById('yogaClose');

    let isRunning = false;
    let inhaleDuration = 4000;
    let exhaleDuration = 4000;
    let animFrame = null;
    let startTime = 0;
    let currentPhase = 'inhale';
    let paused = false;

    /* Duplicate yoga button removed — yoga-engine.js handles yogaEngineToggle */

    function startYoga() {
        if (isRunning) return;
        isRunning = true;
        paused = false;
        currentPhase = 'inhale';
        circle.className = 'yoga-circle';
        textDisplay.textContent = 'دم بکش...';
        phaseText.textContent = '🌬️';
        startTime = performance.now();
        toggleBtn.textContent = '⏸️ توقف';
        if (animFrame) cancelAnimationFrame(animFrame);
        updateYoga();
    }

    function stopYoga() {
        isRunning = false;
        if (animFrame) {
            cancelAnimationFrame(animFrame);
            animFrame = null;
        }
        circle.className = 'yoga-circle';
        textDisplay.textContent = '';
        phaseText.textContent = '⏸️';
    }

    function updateYoga() {
        if (!isRunning || paused) {
            animFrame = requestAnimationFrame(updateYoga);
            return;
        }

        const now = performance.now();
        const elapsed = now - startTime;
        const totalDuration = currentPhase === 'inhale' ? inhaleDuration : exhaleDuration;
        const progress = Math.min(elapsed / totalDuration, 1);
        const ease = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;

        if (currentPhase === 'inhale') {
            const scale = 1 + ease * 0.9;
            const opacity = 0.3 + ease * 0.6;
            circle.style.transform = `scale(${scale})`;
            circle.style.opacity = opacity;
            circle.className = 'yoga-circle inhale';
            textDisplay.textContent = 'دم بکش...';
            phaseText.textContent = '🌬️';
        } else {
            const scale = 1.9 - ease * 0.9;
            const opacity = 0.9 - ease * 0.6;
            circle.style.transform = `scale(${scale})`;
            circle.style.opacity = opacity;
            circle.className = 'yoga-circle exhale';
            textDisplay.textContent = 'بازدم...';
            phaseText.textContent = '🌊';
        }

        if (progress >= 1) {
            currentPhase = currentPhase === 'inhale' ? 'exhale' : 'inhale';
            startTime = performance.now();
        }

        animFrame = requestAnimationFrame(updateYoga);
    }

    toggleBtn.addEventListener('click', () => {
        if (!isRunning) return;
        paused = !paused;
        toggleBtn.textContent = paused ? '▶️ ادامه' : '⏸️ توقف';
        if (!paused) {
            startTime = performance.now();
        }
    });

    speedSlider.addEventListener('input', () => {
        const val = parseFloat(speedSlider.value);
        inhaleDuration = val * 1000;
        exhaleDuration = val * 1000;
        if (isRunning) {
            startTime = performance.now();
        }
    });

    closeBtn.addEventListener('click', () => {
        stopYoga();
        overlay.classList.remove('active');
    });

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            stopYoga();
            overlay.classList.remove('active');
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'y' || e.key === 'Y') {
            if (!overlay.classList.contains('active')) {
                overlay.classList.add('active');
                startYoga();
            } else {
                stopYoga();
                overlay.classList.remove('active');
            }
        }
    });
})();

// ================================================================
// TAROT (تاروت) TAB
// ================================================================

function getTarotForm() {
    return `
        <div style="max-width: 100%; margin: 0 auto;">
            <h3 style="color: #a29bfe; text-align: center;">🔮 تاروت - فال و پیش‌بینی</h3>
            
            <!-- Daily Card (PRIMARY) -->
            <div style="background: rgba(255,255,255,0.03); border-radius: 16px; padding: 20px; margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.05);">
                <h4 style="color: #fdcb6e; margin-top: 0;">🌟 کارت روزانه</h4>
                <button class="btn-primary" onclick="submitDailyCard()">🌟 کارت امروز را ببین</button>
                <div id="tarotDailyResult" style="margin-top: 15px;"></div>
            </div>

            <!-- Draw Cards (SECONDARY) -->
            <div style="background: rgba(255,255,255,0.03); border-radius: 16px; padding: 20px; margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.05);">
                <h4 style="color: #fdcb6e; margin-top: 0;">🃏 کشیدن کارت</h4>
                <div class="form-group">
                    <label>تعداد کارت (۱ تا ۷۸)</label>
                    <input id="tarotCount" type="number" value="3" min="1" max="78" style="width:100%; padding:10px; border-radius:8px; background:rgba(0,0,0,0.3); color:#fff; border:1px solid rgba(255,255,255,0.1);">
                </div>
                <button class="btn-secondary" onclick="submitDrawCards()" style="width:100%;">🃏 کشیدن کارت</button>
                <div id="tarotDrawResult" style="margin-top: 15px;"></div>
            </div>

            <!-- Interactive Spread: کاربر خودش کارت برمی‌دارد -->
            <div style="background: rgba(108,92,231,0.06); border-radius: 16px; padding: 20px; margin-bottom: 20px; border: 1px solid rgba(108,92,231,0.25);">
                <h4 style="color: #fdcb6e; margin-top: 0;">✋ فال دست‌خود — از ۷۸ کارت، خودت بکش</h4>
                <p style="color:#8fb4ff;font-size:0.85rem;margin:6px 0 12px;">کارت‌ها پشت‌رو چیده شده‌اند. به تعداد فالت (۳ یا ۱۰) از پخش کارت بردار — همان‌جا به جایگاهش در پایین می‌رود و آشکار می‌شود. <span style="color:#6c8cff;">دابل‌کلیک روی کارت انتخابی = وارونه کشیدن آن.</span></p>
                <div class="form-group" style="max-width:220px;">
                    <label>تعداد کارت فال</label>
                    <select id="tarotPickCount" style="width:100%; padding:10px; border-radius:8px; background:rgba(0,0,0,0.3); color:#fff; border:1px solid rgba(255,255,255,0.1);">
                        <option value="1">۱ کارت — پاسخ سریع</option>
                        <option value="3" selected>۳ کارت — گذشته/حال/آینده</option>
                        <option value="5">۵ کارت — صلیب کوچک</option>
                        <option value="10">۱۰ کارت — سلتیک کراس</option>
                    </select>
                </div>
                <button class="btn-primary" onclick="startTarotPick()">🂠 شروع چیدن کارت‌ها</button>
                <div id="tarotPickArea" style="margin-top: 18px;"></div>
            </div>

            <!-- Three Card Spread (SECONDARY) -->
            <div style="background: rgba(255,255,255,0.03); border-radius: 16px; padding: 20px; margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.05);">
                <h4 style="color: #fdcb6e; margin-top: 0;">📜 اسپرید ۳ کارتی (گذشته، حال، آینده)</h4>
                <button class="btn-secondary" onclick="submitThreeCard()" style="width:100%;">📜 دریافت فال ۳ کارتی</button>
                <div id="tarotThreeResult" style="margin-top: 15px;"></div>
            </div>

            <!-- Celtic Cross (SECONDARY) -->
            <div style="background: rgba(255,255,255,0.03); border-radius: 16px; padding: 20px; margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.05);">
                <h4 style="color: #fdcb6e; margin-top: 0;">🔮 اسپرید سلتیک کراس (۱۰ کارتی)</h4>
                <button class="btn-secondary" onclick="submitCelticCross()" style="width:100%;">🔮 دریافت فال عمیق</button>
                <div id="tarotCelticResult" style="margin-top: 15px;"></div>
            </div>
        </div>
    `;
}

// ---------- Tarot API Calls ----------

// «وارد شوید» در راهنمای مهمان تاروت — مودال لاگین را همان‌جا باز می‌کند
// و پس از لاگین کارت روزانه را دوباره می‌کشد تا این‌بار در تاریخچه ثبت شود.
window.__tarotAuthReturn = function () {
    if (window.onAfterLogin) {
        window.onAfterLogin(function () {
            try { if (typeof submitDailyCard === 'function') submitDailyCard(); } catch (e) {}
        });
    }
    if (window.openLoginModal) window.openLoginModal();
    else if (window.showToast) showToast('برای ذخیره کارت‌ها، ابتدا وارد شوید', 'info');
};

// Save a draw to the user's tarot history (logged-in users only, fire-and-forget)
function saveTarotHistory(spreadType, drawn, question) {
    const token = localStorage.getItem('cosmic_token');
    // Guest hint: make it visible why the draw is not recorded
    if (!token) {
        ['tarotDailyResult', 'tarotDrawResult', 'tarotThreeResult', 'tarotCelticResult'].forEach(function (id) {
            var el = document.getElementById(id);
            if (el && el.innerHTML.trim() && !el.querySelector('.tarot-login-hint')) {
                var hint = document.createElement('p');
                hint.className = 'tarot-login-hint';
                hint.style.cssText = 'color:#8fb4ff;font-size:0.85rem;margin:10px 0 0;text-align:center;';
                hint.innerHTML = '💡 کارت‌های شما ذخیره نمی‌شوند — برای تاریخچه و استریک <a href="#" onclick="window.__tarotAuthReturn && window.__tarotAuthReturn(); return false;" style="color:#a9c6ff;font-weight:700;text-decoration:underline;">وارد شوید</a>';
                el.appendChild(hint);
            }
        });
        return;
    }
    const cardIds = (drawn || []).map(function (d) { return d.card && d.card.id; });
    const reversed = (drawn || []).map(function (d) { return !!(d.is_reversed); });
    if (cardIds.length === 0) return;
    fetch('/api/v5/tarot/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ spread_type: spreadType, card_ids: cardIds, reversed: reversed, question: question || null })
    }).catch(function () {});
}

async function submitDailyCard() {
    const resultDiv = document.getElementById('tarotDailyResult');
    resultDiv.innerHTML = makeShimmerLoading('⏳ در حال دریافت کارت روزانه...');
    try {
        const res = await fetch('/api/v5/tarot/daily');
        const data = await res.json();
        if (data.status === 'success') {
            displayTarotCard(data.data, resultDiv);
            saveTarotHistory('daily', [data.data]);
        } else {
            resultDiv.innerHTML = `<p style="color: #ff6b6b;">❌ خطا: ${data.detail}</p>`;
        }
    } catch (e) {
        resultDiv.innerHTML = '<p style="color: #ff6b6b;">❌ خطا در ارتباط با سرور</p>';
    }
}

async function submitDrawCards() {
    const count = parseInt(document.getElementById('tarotCount').value) || 3;
    const resultDiv = document.getElementById('tarotDrawResult');
    resultDiv.innerHTML = makeShimmerLoading('⏳ در حال کشیدن کارت...');
    try {
        const res = await fetch('/api/v5/tarot/draw', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ count, with_reversed: true })
        });
        const data = await res.json();
        if (data.status === 'success') {
            displayTarotCards(data.data, resultDiv);
            saveTarotHistory('custom', data.data);
        } else {
            resultDiv.innerHTML = `<p style="color: #ff6b6b;">❌ خطا: ${data.detail}</p>`;
        }
    } catch (e) {
        resultDiv.innerHTML = '<p style="color: #ff6b6b;">❌ خطا در ارتباط با سرور</p>';
    }
}

async function submitThreeCard() {
    const resultDiv = document.getElementById('tarotThreeResult');
    resultDiv.innerHTML = makeShimmerLoading('⏳ در حال دریافت فال ۳ کارتی...');
    try {
        const res = await fetch('/api/v5/tarot/spread/three');
        const data = await res.json();
        if (data.status === 'success') {
            displayTarotSpread(data.data, resultDiv);
            saveTarotHistory('three-card', (data.data.positions || []).map(function (p) { return p.card; }));
        } else {
            resultDiv.innerHTML = `<p style="color: #ff6b6b;">❌ خطا: ${data.detail}</p>`;
        }
    } catch (e) {
        resultDiv.innerHTML = '<p style="color: #ff6b6b;">❌ خطا در ارتباط با سرور</p>';
    }
}

async function submitCelticCross() {
    const resultDiv = document.getElementById('tarotCelticResult');
    resultDiv.innerHTML = makeShimmerLoading('⏳ در حال دریافت فال عمیق...');
    try {
        const res = await fetch('/api/v5/tarot/spread/celtic');
        const data = await res.json();
        if (data.status === 'success') {
            displayTarotSpread(data.data, resultDiv);
            saveTarotHistory('celtic-cross', (data.data.positions || []).map(function (p) { return p.card; }));
        } else {
            resultDiv.innerHTML = `<p style="color: #ff6b6b;">❌ خطا: ${data.detail}</p>`;
        }
    } catch (e) {
        resultDiv.innerHTML = '<p style="color: #ff6b6b;">❌ خطا در ارتباط با سرور</p>';
    }
}

// ================================================================
//   فال دست‌خود — بادبزنِ ۷۸ کارت، سبک کلاسیک (شبیه Arcane/ериکوس)
// ================================================================
var _tarotPickState = null;

// لایت‌باکس بزرگنمایی تصویر کارت
function showTarotImageZoom(imgUrl, title) {
    var ov = document.getElementById('tarotZoomOverlay');
    if (!ov) {
        ov = document.createElement('div');
        ov.id = 'tarotZoomOverlay';
        ov.style.cssText = 'position:fixed;inset:0;z-index:9500;background:rgba(5,8,20,0.9);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;flex-direction:column;gap:14px;cursor:zoom-out;padding:20px;';
        ov.addEventListener('click', function () { ov.style.display = 'none'; });
        document.body.appendChild(ov);
    }
    ov.innerHTML = '<div style="color:#fdcb6e;font-size:1rem;font-weight:800;">' + (title || '') + '</div>' +
        '<img src="' + imgUrl + '" style="max-height:80vh;max-width:90vw;border-radius:14px;box-shadow:0 20px 70px rgba(0,0,0,0.8);" onclick="event.stopPropagation();">';
    ov.style.display = 'flex';
}
window.showTarotImageZoom = showTarotImageZoom;

function _tarotShuffle(n) {
    var a = [];
    for (var i = 0; i < n; i++) a.push(i);
    for (var j = n - 1; j > 0; j--) {
        var k = Math.floor(Math.random() * (j + 1));
        var t = a[j]; a[j] = a[k]; a[k] = t;
    }
    return a;
}

var _tarotCardCache = null;
async function _tarotGetCards() {
    if (_tarotCardCache) return _tarotCardCache;
    const res = await fetch('/api/v5/tarot/cards');
    const data = await res.json();
    if (data.status === 'success' && Array.isArray(data.data)) {
        _tarotCardCache = data.data;
        return _tarotCardCache;
    }
    throw new Error('no cards');
}

async function startTarotPick(reshuffled) {
    const area = document.getElementById('tarotPickArea');
    if (!area) return;
    const count = parseInt((document.getElementById('tarotPickCount') || {}).value) || 3;
    _tarotPickState = { allCards: [], order: [], count: count, picked: [], shuffleCount: reshuffled ? ((_tarotPickState && _tarotPickState.shuffleCount || 0) + 1) : 1 };

    if (!_tarotCardCache) area.innerHTML = makeShimmerLoading('⏳ در حال بُر زدن ۷۸ کارت...');
    try {
        _tarotPickState.allCards = await _tarotGetCards();
    } catch (e) {
        area.innerHTML = '<p style="color:#ff6b6b;">❌ خطا در دریافت کارت‌ها</p>';
        return;
    }
    _tarotPickState.order = _tarotShuffle(_tarotPickState.allCards.length);

    const msg = reshuffled
        ? 'کارت‌ها دوباره بُر خورد. حالا روی <a href="javascript:void(0)" class="tp-begin" style="color:#fdcb6e;font-weight:700;text-decoration:underline;" onclick="document.getElementById(\'tpFan\').scrollIntoView({behavior:\'smooth\',block:\'center\'})">بادبزن کارت‌ها</a> بزن و ' + count + ' کارت انتخاب کن — یا <a href="javascript:void(0)" class="tp-shuffle" style="color:#a29bfe;font-weight:700;text-decoration:underline;" onclick="startTarotPick(true)">اینجا</a> را بزن تا دوباره بُر بخورد.'
        : 'کارت‌ها ' + (3 + Math.floor(Math.random() * 4)) + ' بار بُر خوردند. حالا روی <a href="javascript:void(0)" class="tp-begin" style="color:#fdcb6e;font-weight:700;text-decoration:underline;" onclick="document.getElementById(\'tpFan\').scrollIntoView({behavior:\'smooth\',block:\'center\'})">بادبزن کارت‌ها</a> بزن و ' + count + ' کارت انتخاب کن — یا <a href="javascript:void(0)" class="tp-shuffle" style="color:#a29bfe;font-weight:700;text-decoration:underline;" onclick="startTarotPick(true)">اینجا</a> را بزن تا دوباره بُر بخورد.';

    const slotLabels = _tarotSlotLabels(count);
    area.innerHTML = `
        <div class="tp-wrap">
            <div class="tp-bubble">${msg}</div>
            <div class="tp-guide" id="tpGuide">انتخاب کن: <b>${count}</b> کارت — کلیک ساده = راست، دابل‌کلیک = وارونه</div>
            <div class="tp-fan-outer" id="tpFan">
                <div class="tp-fan" id="tpFanRow"></div>
            </div>
            <div class="tp-progress" id="tpCounter"></div>
            <div style="margin-top:20px;">
                <h5 style="color:#a29bfe;text-align:center;margin:0 0 12px;">🃏 جایگاه‌های فال</h5>
                <div id="tpSlots" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(90px,1fr));gap:10px;">
                    ${slotLabels.map((lb, i) => `<div id="tpSlot${i}" style="min-height:130px;border:1.5px dashed rgba(162,155,254,0.35);border-radius:12px;padding:10px;text-align:center;background:rgba(0,0,0,0.2);"><div style="color:#8fb4ff;font-size:0.72rem;margin-bottom:8px;">${lb}</div><div class="tp-slot-body" style="color:#555;font-size:1.6rem;padding-top:14px;">⬜</div></div>`).join('')}
                </div>
            </div>
            <div style="text-align:center;margin-top:16px;" id="tpDoneBtn"></div>
            <div id="tpDone" style="margin-top:14px;"></div>
        </div>`;

    _renderFan();
    _updateTpGuide();
}

function _renderFan() {
    const row = document.getElementById('tpFanRow');
    if (!row || !_tarotPickState) return;
    const n = _tarotPickState.allCards.length;

    // پهنای واقعی کانتینر — واکنش‌گرا (موبایل: ردیف‌های رول، دسکتاپ: بادبزن باز)
    const containerW = Math.min(row.parentElement ? row.parentElement.clientWidth : 700, 900);
    const isNarrow = containerW < 620;

    // اندازه کارت بر اساس عرض — ۱۵٪ جمع‌تر
    const cardW = Math.round((isNarrow ? 58 : 74) * 0.85);
    const cardH = Math.round(cardW * 1.6);

    // فاصله افقی هر کارت — بازتر برای لمس آسان (۱۵٪ جمع‌تر)
    const overlap = Math.round((isNarrow ? 16 : 26) * 0.85);
    const totalW = n > 1 ? (cardW + (n - 1) * overlap) : cardW;
    const rightShift = isNarrow ? 12 : 28; // جابه‌جایی به راست

    const CARD_BACK = '/static/tarot/images/card-back.svg';
    let html = '';
    if (isNarrow && totalW > containerW - 24) {
        // ─── موبایل: چند ردیف — هر ردیف یک لایه از دسته، همه کارت‌ها کاملاً قابل‌لمس ───
        const perRow = Math.max(4, Math.floor((containerW - 24) / overlap));
        const rows = Math.ceil(n / perRow);
        const rowH = Math.round(cardH * 0.42); // هر ردیف فقط سرشاخه‌ها را نشان می‌دهد (کارت‌های لبه بالا)
        row.style.cssText = `position:relative;height:${rows * rowH + cardH * 0.6 + 10}px;overflow:visible;`;
        for (let i = 0; i < n; i++) {
            const r = Math.floor(i / perRow);
            const c = i % perRow;
            const perThis = Math.min(perRow, n - r * perRow);
            const x = ((containerW - perThis * overlap - cardW) / 2) + c * overlap + rightShift;
            const y = r * rowH;
            html += `<div class="tp-card" data-pos="${i}" onclick="pickTarotCard(this)" ondblclick="pickTarotCard(this,true)" title="کلیک = راست · دابل‌کلیک = وارونه"
                style="position:absolute;left:${x}px;top:${y}px;z-index:${i + 1};cursor:pointer;width:${cardW}px;height:${cardH}px;border-radius:9px;background:url('${CARD_BACK}') center/cover no-repeat,#241b47;border:1px solid rgba(253,203,110,0.35);box-shadow:0 3px 8px rgba(0,0,0,0.5);transition:transform .18s,opacity .25s,box-shadow .18s;"
                onmouseover="if(this.dataset.used!=='1'){this.style.boxShadow='0 0 16px rgba(253,203,110,0.55)';this.style.borderColor='#fdcb6e';}"
                onmouseout="if(this.dataset.used!=='1'){this.style.boxShadow='0 3px 8px rgba(0,0,0,0.5)';this.style.borderColor='rgba(253,203,110,0.35)';}"
            ></div>`;
        }
    } else {
        // ─── دسکتاپ/تابلت: بادبزنِ کلاسیکِ باز با فاصله بیشتر ───
        const fanAngle = Math.min(150, 24 + n * 1.1);           // قوس وسیع‌تر از قبل
        const spreadX = Math.min(containerW - cardW - 20, n * (overlap + 2));
        for (let i = 0; i < n; i++) {
            const t = n === 1 ? 0.5 : i / (n - 1);
            const angle = (t - 0.5) * fanAngle * 0.5;
            const lift = Math.abs(t - 0.5) * 30;
            const z = i + 1;
            const x = (containerW / 2 - cardW / 2) + (t - 0.5) * spreadX + rightShift;
            html += `<div class="tp-card" data-pos="${i}" onclick="pickTarotCard(this)" ondblclick="pickTarotCard(this,true)" title="کلیک = راست · دابل‌کلیک = وارونه"
                style="position:absolute;left:${x}px;top:${lift}px;transform-origin:50% 140%;transform:rotate(${angle}deg);z-index:${z};cursor:pointer;width:${cardW}px;height:${cardH}px;border-radius:9px;background:url('${CARD_BACK}') center/cover no-repeat,#241b47;border:1px solid rgba(253,203,110,0.35);box-shadow:0 3px 10px rgba(0,0,0,0.5);transition:transform .18s,opacity .25s,box-shadow .18s;"
                onmouseover="if(this.dataset.used!=='1'){this.style.transform+=' translateY(-18px)';this.style.borderColor='#fdcb6e';this.style.boxShadow='0 0 16px rgba(253,203,110,0.55)';}"
                onmouseout="if(this.dataset.used!=='1'){this.style.transform=this.style.transform.replace(' translateY(-18px)','');this.style.borderColor='rgba(253,203,110,0.35)';this.style.boxShadow='0 3px 10px rgba(0,0,0,0.5)';}"
            ></div>`;
        }
        row.style.cssText = `position:relative;height:${cardH + 60}px;overflow:visible;`;
        row.innerHTML = html;
        return;
    }
    row.innerHTML = html;
}

// بازچینش بادبزن با تغییر اندازه پنجره (بدون از دست رفتن انتخاب‌ها)
var _tpResizeTimer = null;
window.addEventListener('resize', function () {
    if (!_tarotPickState || !document.getElementById('tpFanRow')) return;
    clearTimeout(_tpResizeTimer);
    _tpResizeTimer = setTimeout(function () {
        // فقط کارت‌های استفاده‌نشده باید دوباره رندر شوند — state می‌ماند
        _renderFan();
        // کارت‌های قبلاً برداشته‌شده را دوباره محو کن
        document.querySelectorAll('.tp-card[data-used="1"]').forEach(function (el) {
            el.style.opacity = '0';
            el.style.pointerEvents = 'none';
        });
    }, 180);
});

function _updateTpGuide() {
    const g = document.getElementById('tpGuide');
    if (!g || !_tarotPickState) return;
    const remain = _tarotPickState.count - _tarotPickState.picked.length;
    g.innerHTML = remain > 0
        ? `انتخاب کن: <b style="color:#fdcb6e;">${remain}</b> کارتِ دیگر${remain === 1 ? '' : ''} — کلیک ساده = راست، دابل‌کلیک = وارونه`
        : `همه کارت‌ها انتخاب شدند ✨`;
}

function _tarotSlotLabels(count) {
    if (count === 1) return ['پاسخ'];
    if (count === 3) return ['گذشته', 'حال', 'آینده'];
    if (count === 5) return ['وضعیت', 'چالش', 'راهنما', 'زیرِ سطح', 'نتیجه'];
    return ['۱. وضعیت', '۲. چالش', '۳. بنیاد', '۴. گذشته', '۵. بالای سر', '۶. آینده نزدیک', '۷. خودِ تو', '۸. محیط', '۹. امید/ترس', '۱۰. نتیجه'];
}

function pickTarotCard(el, forceReversed) {
    const st = _tarotPickState;
    if (!st || !el || el.dataset.used === '1') return;
    if (st.picked.length >= st.count) return;

    const pos = parseInt(el.dataset.pos);
    const cardIdx = st.order[pos];
    const card = st.allCards[cardIdx];
    const isReversed = forceReversed === true ? true : (Math.random() > 0.85);
    el.dataset.used = '1';
    el.style.opacity = '0';
    el.style.pointerEvents = 'none';

    st.picked.push({ card: card, is_reversed: isReversed });

    const slot = st.picked.length - 1;
    const slotEl = document.getElementById('tpSlot' + slot);
    if (slotEl) {
        const imgUrl = card.image || '/static/tarot/images/card-back.svg';
        const body = slotEl.querySelector('.tp-slot-body');
        // کارت واقعی بلافاصله — انیمیشن ظهور ساده
        body.innerHTML = `
            <img src="${imgUrl}" alt="${card.name || ''}" style="width:100%;max-width:110px;border-radius:9px;box-shadow:0 4px 14px rgba(0,0,0,0.5);${isReversed ? 'transform:rotate(180deg);' : ''}animation:tpPop .4s ease-out;cursor:zoom-in;" onclick="showTarotImageZoom('${imgUrl}','${(card.name||'').replace(/'/g,'')}')" onerror="this.style.display='none'">
            <div style="color:#fdcb6e;font-size:0.72rem;font-weight:700;margin-top:5px;">${card.name || ''}</div>
            <div style="color:${isReversed ? '#e17055' : '#2ecc71'};font-size:0.62rem;">${isReversed ? '🔄 وارونه' : '⬆️ راست'}</div>`;
    }

    _updateTpGuide();
    if (st.picked.length === st.count) {
        // حد نصاب کامل شد — آشکارسازی خودکار (بدون دکمه)
        setTimeout(revealTarotPick, 450);
    }
}

function revealTarotPick() {
    const st = _tarotPickState;
    const done = document.getElementById('tpDone');
    if (!st || !done) return;
    const fan = document.getElementById('tpFan');
    if (fan) fan.style.display = 'none';
    const btn = document.getElementById('tpDoneBtn');
    if (btn) btn.innerHTML = '';

    const labels = _tarotSlotLabels(st.count);
    let html = '<div style="background: rgba(108,92,231,0.08); border: 1px solid rgba(108,92,231,0.25); border-radius: 14px; padding: 16px;">';
    html += '<h5 style="color:#fdcb6e;text-align:center;margin:0 0 12px;">🔮 فال تو آشکار شد</h5>';
    st.picked.forEach(function (p, i) {
        const rev = p.is_reversed;
        const deep = rev ? (p.card.deep_interp_reversed || '') : (p.card.deep_interp_upright || '');
        const meaning = rev ? (p.card.meaning_reversed || '') : (p.card.meaning_upright || '');
        const mood = rev ? (p.card.mood_reversed || '') : (p.card.mood || '');
        const spiritual = rev ? (p.card.spiritual_reversed || '') : (p.card.spiritual || '');
        const yesNo = rev ? (p.card.yes_no_reversed || '') : (p.card.yes_no || '');
        html += `<div style="margin-bottom:12px;padding:12px;background:rgba(0,0,0,0.2);border-radius:10px;display:flex;gap:14px;align-items:flex-start;flex-wrap:wrap;">`;
        // تصویر کارت — وارونه اگر reversed
        const cImg = p.card.image || '/static/tarot/images/card-back.svg';
        html += `<div style="flex-shrink:0;width:110px;">
            <img src="${cImg}" alt="${p.card.name || ''}" style="width:100%;border-radius:9px;box-shadow:0 4px 14px rgba(0,0,0,0.5);${rev ? 'transform:rotate(180deg);' : ''}cursor:zoom-in;" onclick="showTarotImageZoom('${cImg}','${(p.card.name||'').replace(/'/g,'')}')" onerror="this.style.display='none'">
        </div>`;
        html += `<div style="flex:1;min-width:180px;">`;
        html += `<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;"><b style="color:#fdcb6e;">${labels[i]}</b><span style="color:${rev ? '#e17055' : '#2ecc71'};font-size:0.75rem;">${p.card.name} ${rev ? '🔄' : '⬆️'}</span></div>`;
        if (p.card.keywords_upright) {
            const kws = rev ? (p.card.keywords_reversed || []) : (p.card.keywords_upright || []);
            if (kws.length) html += `<div style="color:#8fb4ff;font-size:0.75rem;margin-top:4px;">${kws.join(' · ')}</div>`;
        }
        html += `<div style="color:#ccc;font-size:0.85rem;line-height:1.9;margin-top:6px;">${meaning}</div>`;
        if (deep) {
            html += `<div style="background:rgba(253,203,110,0.05);border-right:3px solid rgba(253,203,110,0.4);border-radius:8px;padding:10px 14px;margin-top:8px;line-height:2;color:#ccc;font-size:0.84rem;"><b style="color:#fdcb6e;">📜 تفسیر:</b><br>${deep}</div>`;
        }
        if (p.card.love) {
            const love = rev ? (p.card.love_reversed || '') : (p.card.love || '');
            if (love) html += `<div style="margin-top:8px;font-size:0.8rem;color:#ff8fab;line-height:1.9;">❤️ <b>عشق:</b> ${love}</div>`;
        }
        if (p.card.career) {
            const career = rev ? (p.card.career_reversed || '') : (p.card.career || '');
            if (career) html += `<div style="margin-top:4px;font-size:0.8rem;color:#74b9ff;line-height:1.9;">💼 <b>کار:</b> ${career}</div>`;
        }
        if (mood) html += `<div style="margin-top:4px;font-size:0.78rem;color:#a29bfe;">🎭 حال و هوا: ${mood}</div>`;
        if (spiritual) html += `<div style="margin-top:4px;font-size:0.78rem;color:#8fe3b4;line-height:1.9;">🕊️ <b>معنویت:</b> ${spiritual}</div>`;
        if (yesNo) {
            const yesFa = { yes: 'بله ✅', no: 'خیر ❌', maybe: 'شاید ⚖️' }[String(yesNo).toLowerCase()] || yesNo;
            html += `<div style="margin-top:6px;font-size:0.8rem;color:var(--ink-dim);">سؤالی داری؟ پاسخ کارت: <b style="color:#fdcb6e;">${yesFa}</b></div>`;
        }
        html += `</div>`; // پایان ستون متن
        html += `</div>`; // پایان ردیف کارت
    });
    html += '<button class="btn-secondary" onclick="startTarotPick(true)" style="width:100%;">🔄 بُر زدن مجدد و انتخاب تازه</button>';
    html += '</div>';
    done.innerHTML = html;
    done.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    saveTarotHistory('hand-pick', st.picked);
}

// ---------- Tarot Display Functions ----------

function displayTarotCard(data, container) {
    const card = data.card;
    const isReversed = data.is_reversed || false;
    const status = isReversed ? '🔄 وارونه' : '⬆️ راست';
    const imgUrl = card.image || '/static/tarot/images/card-back.svg';
    container.innerHTML = `
        <div style="background: rgba(108,92,231,0.1); border: 1px solid rgba(108,92,231,0.3); border-radius: 16px; padding: 20px; margin-top: 10px;">
            <div style="display: flex; gap: 20px; align-items: flex-start; flex-wrap: wrap;">
                <div class="tarot-flip-container auto-flip" onclick="this.classList.toggle('auto-flip');this.classList.toggle('flipped');" title="کلیک کنید">
                    <div class="tarot-flip-inner">
                        <div class="tarot-flip-front"><div class="card-back-pattern">🌟</div></div>
                        <div class="tarot-flip-back">
                            <img src="${imgUrl}" class="${isReversed ? 'reversed' : ''}" alt="${card.name || ''}" onerror="this.src='/static/tarot/images/card-back.svg'">
                        </div>
                    </div>
                    <span class="flip-hint">کلیک کنید</span>
                </div>
                <div style="flex: 1; min-width: 200px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">
                        <h4 style="color: #fdcb6e; margin: 0;">${card.name || 'بدون نام'}</h4>
                        <span style="background: ${isReversed ? '#e17055' : '#00b894'}; padding: 4px 14px; border-radius: 20px; color: #fff; font-size: 0.8rem;">${status}</span>
                    </div>
                    <div style="margin-top: 10px; color: #ddd; line-height: 1.8;">
                        <p><strong>معنی:</strong> ${data.meaning || 'توضیحی موجود نیست'}</p>
                        ${data.deep_interp ? `<div style="background: rgba(253,203,110,0.06); border-right: 3px solid rgba(253,203,110,0.4); border-radius: 8px; padding: 10px 14px; margin: 10px 0; line-height: 2;"><strong style="color:#fdcb6e;">📜 تفسیر:</strong><br>${data.deep_interp}</div>` : ''}
                        <p><strong>کلمات کلیدی:</strong> ${Array.isArray(data.keywords) ? data.keywords.join('، ') : data.keywords || '—'}</p>
                        <div style="display: flex; flex-wrap: wrap; gap: 5px; margin-top: 10px;">
                            ${data.love ? `<span style="background: rgba(255,255,255,0.05); padding: 4px 12px; border-radius: 20px;">❤️ ${data.love}</span>` : ''}
                            ${data.career ? `<span style="background: rgba(255,255,255,0.05); padding: 4px 12px; border-radius: 20px;">💼 ${data.career}</span>` : ''}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function displayTarotCards(cards, container) {
    let html = '';
    cards.forEach((item, index) => {
        const card = item.card;
        const isReversed = item.is_reversed || false;
        const status = isReversed ? '🔄 وارونه' : '⬆️ راست';
        const imgUrl = card.image || '/static/tarot/images/card-back.svg';
        const delay = index * 300;
        html += `
            <div style="background: rgba(108,92,231,0.08); border: 1px solid rgba(108,92,231,0.2); border-radius: 12px; padding: 15px; margin-top: 10px; display: flex; gap: 15px; align-items: flex-start;">
                <div class="tarot-flip-container small auto-flip" onclick="this.classList.toggle('auto-flip');this.classList.toggle('flipped');" style="animation-delay:${delay}ms;" title="کلیک کنید">
                    <div class="tarot-flip-inner" style="animation-delay:${delay}ms;">
                        <div class="tarot-flip-front"><div class="card-back-pattern">🌟</div></div>
                        <div class="tarot-flip-back">
                            <img src="${imgUrl}" class="${isReversed ? 'reversed' : ''}" alt="${card.name || ''}" onerror="this.src='/static/tarot/images/card-back.svg'">
                        </div>
                    </div>
                    <span class="flip-hint">کلیک</span>
                </div>
                <div style="flex: 1;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <h5 style="color: #fdcb6e; margin: 0;">#${index+1}: ${card.name || 'بدون نام'}</h5>
                        <span style="background: ${isReversed ? '#e17055' : '#00b894'}; padding: 2px 12px; border-radius: 20px; color: #fff; font-size: 0.7rem;">${status}</span>
                    </div>
                    <p style="color: #ccc; margin: 8px 0 0 0; font-size: 0.9rem;">${item.meaning || ''}</p>
                    ${item.deep_interp ? `<details style="margin-top: 8px;"><summary style="color: #a29bfe; cursor: pointer; font-size: 0.85rem;">📜 تفسیر کامل</summary><div style="color: #bbb; line-height: 2; margin-top: 8px; padding: 10px 14px; background: rgba(253,203,110,0.05); border-radius: 8px; border-right: 3px solid rgba(253,203,110,0.35); font-size: 0.88rem;">${item.deep_interp}</div></details>` : ''}
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

function displayTarotSpread(data, container) {
    let html = `<h4 style="color: #a29bfe;">📊 ${data.spread || 'اسپرید'}</h4>`;
    const positions = data.positions || [];
    positions.forEach((pos, index) => {
        const card = pos.card?.card || {};
        const isReversed = pos.card?.is_reversed || false;
        const imgUrl = card.image || '/static/tarot/images/card-back.svg';
        const delay = index * 400;
        html += `
            <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 15px; margin-top: 10px; display: flex; gap: 15px; align-items: flex-start;">
                <div class="tarot-flip-container small auto-flip" onclick="this.classList.toggle('auto-flip');this.classList.toggle('flipped');" style="animation-delay:${delay}ms;" title="کلیک کنید">
                    <div class="tarot-flip-inner" style="animation-delay:${delay}ms;">
                        <div class="tarot-flip-front"><div class="card-back-pattern">🌟</div></div>
                        <div class="tarot-flip-back">
                            <img src="${imgUrl}" class="${isReversed ? 'reversed' : ''}" alt="${card.name || ''}" onerror="this.src='/static/tarot/images/card-back.svg'">
                        </div>
                    </div>
                    <span class="flip-hint">کلیک</span>
                </div>
                <div style="flex: 1;">
                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">
                        <h5 style="color: #fdcb6e; margin: 0;">${index+1}. ${pos.position || ''}</h5>
                        <span style="background: ${isReversed ? '#e17055' : '#00b894'}; padding: 2px 12px; border-radius: 20px; color: #fff; font-size: 0.7rem;">${isReversed ? 'وارونه' : 'راست'}</span>
                    </div>
                    ${pos.position_guide ? `<p style="color:#a29bfe;font-size:0.78rem;margin:6px 0 0 0;line-height:1.8;">${pos.position_guide}</p>` : ''}
                    <p style="color: #ddd; margin: 8px 0 0 0;"><strong>${card.name || ''}</strong> — ${pos.card?.meaning || ''}</p>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

// ============================================
// NUMEROLOGY (عددشناسی) TAB
// ============================================

function getNumerologyForm() {
    // تاریخ تولد مشترک — از birthDatePicker چارت (هم‌ست با بقیه سایت)
    var hasBirth = !!(sharedInputs.birthDate && sharedInputs.birthDate.year);
    var birthDisplay = hasBirth ? formatDpDisplay(sharedInputs.birthDate, 'shamsi', 'fa') : 'ثبت نشده';
    var birthHtml = hasBirth
        ? '<div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:rgba(46,204,113,0.06);border:1px solid rgba(46,204,113,0.2);border-radius:12px;margin-bottom:12px;">' +
          '<span style="font-size:1.3rem;">📅</span>' +
          '<div style="flex:1;"><div style="font-size:0.85rem;color:#2ecc71;font-weight:700;">تاریخ تولد شما: ' + birthDisplay + '</div>' +
          '<div style="font-size:0.72rem;color:#8fb4ff;margin-top:2px;">برای تغییر، به <a href="javascript:void(0)" onclick="if(window.showPage)showPage(\'dashboard\')" style="color:#a29bfe;text-decoration:underline;">داشبورد کاربری</a> بروید — تغییر این‌جا فقط برای محاسبات این بخش موقتی است.</div></div></div>'
        : '<div style="padding:10px 14px;background:rgba(243,156,18,0.08);border:1px solid rgba(243,156,18,0.25);border-radius:12px;margin-bottom:12px;font-size:0.85rem;color:#fdcb6e;">⚠️ تاریخ تولد ثبت نشده — ابتدا در بخش چارت تولد وارد کنید.</div>';

    return `
        <div style="max-width: 100%; margin: 0 auto;">
            <h3 style="color: #a29bfe; text-align: center;">🔢 عددشناسی - رمز اعداد زندگی</h3>

            <!-- Life Path Number (PRIMARY) — از تاریخ تولد مشترک -->
            <div style="background: rgba(255,255,255,0.03); border-radius: 16px; padding: 20px; margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.05);">
                <h4 style="color: #fdcb6e; margin-top: 0;">🛤️ عدد مسیر زندگی</h4>
                ${birthHtml}
                <button class="btn-primary" onclick="submitLifePath()">🛤️ محاسبه مسیر زندگی</button>
                <div id="numLifePathResult" style="margin-top: 15px;"></div>
            </div>

            <!-- Personal Year (SECONDARY) — birthDatePicker مجزا، بدون ذخیره -->
            <div style="background: rgba(255,255,255,0.03); border-radius: 16px; padding: 20px; margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.05);">
                <h4 style="color: #fdcb6e; margin-top: 0;">📅 سال اختیاری (سال شخصی هر سالی که بخواهی)</h4>
                <p style="color:#8fb4ff;font-size:0.8rem;margin:4px 0 10px;">تاریخ تولد را همین‌جا وارد کن (ذخیره نمی‌شود — فقط برای همین محاسبه) و سال دلخواهت را بزن تا ببینی آن سال در چه فضایی خواهی بود.</p>
                <div class="form-group">${makeDatePickerTrigger('pyBirthDP', {label:'تاریخ تولد', calendarType:'shamsi', digits:'fa'})}</div>
                <div class="form-group"><label>سال موردنظر</label><input id="pyTarget" type="number" placeholder="خالی = سال جاری" value=""></div>
                <button class="btn-secondary" onclick="submitPersonalYear()" style="width:100%;">📅 محاسبه سال شخصی</button>
                <div id="numPersonalYearResult" style="margin-top: 15px;"></div>
            </div>

            <!-- Expression Number (SECONDARY) -->
            <div style="background: rgba(255,255,255,0.03); border-radius: 16px; padding: 20px; margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.05);">
                <h4 style="color: #fdcb6e; margin-top: 0;">✍️ عدد بیان (از نام کامل)</h4>
                <div class="form-group"><label>نام کامل</label><input id="numName" value="علی"></div>
                <button class="btn-secondary" onclick="submitExpression()" style="width:100%;">✍️ محاسبه عدد بیان</button>
                <div id="numExpressionResult" style="margin-top: 15px;"></div>
            </div>

            <!-- Soul Urge Number (SECONDARY) -->
            <div style="background: rgba(255,255,255,0.03); border-radius: 16px; padding: 20px; margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.05);">
                <h4 style="color: #fdcb6e; margin-top: 0;">❤️ عدد درونی (از حروف صدادار)</h4>
                <div class="form-group"><label>نام کامل</label><input id="numSoulName" value="علی"></div>
                <button class="btn-secondary" onclick="submitSoulUrge()" style="width:100%;">❤️ محاسبه عدد درونی</button>
                <div id="numSoulUrgeResult" style="margin-top: 15px;"></div>
            </div>

            <!-- Compatibility (SECONDARY) -->
            <div style="background: rgba(255,255,255,0.03); border-radius: 16px; padding: 20px; margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.05);">
                <h4 style="color: #fdcb6e; margin-top: 0;">💞 سازگاری عددی</h4>
                <div class="form-group"><label>عدد اول</label><input id="numComp1" type="number" value="1" min="1" max="33"></div>
                <div class="form-group"><label>عدد دوم</label><input id="numComp2" type="number" value="2" min="1" max="33"></div>
                <button class="btn-secondary" onclick="submitCompatibility()" style="width:100%;">💞 بررسی سازگاری</button>
                <div id="numCompResult" style="margin-top: 15px;"></div>
            </div>
        </div>
    `;
}

// ---------- API Calls ----------

async function submitLifePath() {
    // از تاریخ تولد مشترک (هم‌ست با چارت و بقیه سایت)
    var bd = sharedInputs.birthDate;
    var year, month, day;
    if (bd && bd.year && bd.month && bd.day) {
        // تبدیل شمسی → میلادی برای محاسبه درست
        var g = bd.year >= 1300 && bd.year <= 1600 ? (window.isoShamsiToGregorianISO ? window.isoShamsiToGregorianISO(bd.year + '-' + String(bd.month).padStart(2,'0') + '-' + String(bd.day).padStart(2,'0')).split('-') : [bd.year, bd.month, bd.day]) : [bd.year, bd.month, bd.day];
        year = parseInt(g[0]); month = parseInt(g[1]); day = parseInt(g[2]);
    } else {
        var resultDiv0 = document.getElementById('numLifePathResult');
        if (resultDiv0) resultDiv0.innerHTML = '<p style="color:#fdcb6b;">⚠️ تاریخ تولد ثبت نشده — ابتدا در بخش چارت تولد وارد کنید یا به داشبورد بروید.</p>';
        return;
    }
    const resultDiv = document.getElementById('numLifePathResult');
    resultDiv.innerHTML = makeShimmerCompact('⏳ در حال محاسبه مسیر زندگی...');
    try {
        const res = await fetch('/api/v5/numerology/life-path', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ year, month, day })
        });
        const data = await res.json();
        if (data.status === 'success') {
            displayNumerologyResult(data.data, resultDiv, '🛤️ عدد مسیر زندگی');
        } else {
            resultDiv.innerHTML = '<p style="color:#ff6b6b;">❌ ' + (data.detail || 'خطای ناشناخته') + '</p>';
        }
    } catch(e) { resultDiv.innerHTML = '<p style="color:#ff6b6b;">❌ خطا در ارتباط با سرور</p>'; }
}

async function submitPersonalYear() {
    // از پیکرِ مجزای pyBirthDP — بدون ذخیره‌سازی
    const pyHidden = document.getElementById('pyBirthDP_hidden');
    const birth = pyHidden ? window.isoShamsiToGregorianISO ? window.isoShamsiToGregorianISO(pyHidden.value) : pyHidden.value : '';
    const targetInput = document.getElementById('pyTarget').value;
    const target_year = targetInput ? parseInt(targetInput) : null;
    const resultDiv = document.getElementById('numPersonalYearResult');
    if (!birth) { resultDiv.innerHTML = '<p style="color:#ff6b6b;">❌ لطفاً تاریخ تولد را وارد کنید</p>'; return; }
    var parts = birth.split('-').map(function(x){ return parseInt(x, 10); });
    const birth_year = parts[0], birth_month = parts[1], birth_day = parts[2];
    if (birth_year < 1279 && (birth_year < 1000)) { /* میلادی است — ok */ }
    resultDiv.innerHTML = makeShimmerCompact('⏳ در حال محاسبه سال شخصی...');
    try {
        const res = await fetch('/api/v5/numerology/personal-year', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ birth_year, birth_month, birth_day, target_year })
        });
        const data = await res.json();
        if (data.status === 'success') {
            displayNumerologyResult(data.data, resultDiv, '📅 سال شخصی — سال ' + (target_year || new Date().getFullYear()));
        } else {
            resultDiv.innerHTML = '<p style="color:#ff6b6b;">❌ ' + (data.detail || 'خطای ناشناخته') + '</p>';
        }
    } catch(e) { resultDiv.innerHTML = '<p style="color:#ff6b6b;">❌ خطا در ارتباط با سرور</p>'; }
}

async function submitExpression() {
    const name = document.getElementById('numName').value.trim();
    const resultDiv = document.getElementById('numExpressionResult');
    if (!name) { resultDiv.innerHTML = '<p style="color:#ff6b6b;">❌ لطفاً نام را وارد کنید</p>'; return; }
    resultDiv.innerHTML = makeShimmerCompact('⏳ در حال محاسبه عدد بیان...');
    try {
        const res = await fetch('/api/v5/numerology/expression', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });
        const data = await res.json();
        if (data.status === 'success') {
            displayNumerologyResult(data.data, resultDiv, '✍️ عدد بیان');
        } else {
            resultDiv.innerHTML = '<p style="color:#ff6b6b;">❌ ' + (data.detail || 'خطای ناشناخته') + '</p>';
        }
    } catch(e) { resultDiv.innerHTML = '<p style="color:#ff6b6b;">❌ خطا در ارتباط با سرور</p>'; }
}

async function submitSoulUrge() {
    const name = document.getElementById('numSoulName').value.trim();
    const resultDiv = document.getElementById('numSoulUrgeResult');
    if (!name) { resultDiv.innerHTML = '<p style="color:#ff6b6b;">❌ لطفاً نام را وارد کنید</p>'; return; }
    resultDiv.innerHTML = makeShimmerCompact('⏳ در حال محاسبه عدد درونی...');
    try {
        const res = await fetch('/api/v5/numerology/soul-urge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });
        const data = await res.json();
        if (data.status === 'success') {
            displayNumerologyResult(data.data, resultDiv, '❤️ عدد درونی');
        } else {
            resultDiv.innerHTML = '<p style="color:#ff6b6b;">❌ ' + (data.detail || 'خطای ناشناخته') + '</p>';
        }
    } catch(e) { resultDiv.innerHTML = '<p style="color:#ff6b6b;">❌ خطا در ارتباط با سرور</p>'; }
}

async function submitCompatibility() {
    const num1 = parseInt(document.getElementById('numComp1').value);
    const num2 = parseInt(document.getElementById('numComp2').value);
    const resultDiv = document.getElementById('numCompResult');
    if (isNaN(num1) || isNaN(num2)) { resultDiv.innerHTML = '<p style="color:#ff6b6b;">❌ لطفاً دو عدد معتبر وارد کنید</p>'; return; }
    resultDiv.innerHTML = makeShimmerCompact('⏳ در حال بررسی سازگاری...');
    try {
        const res = await fetch('/api/v5/numerology/compatibility', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ num1, num2 })
        });
        const data = await res.json();
        if (data.status === 'success') {
            displayNumerologyResult(data.data, resultDiv, '💞 سازگاری عددی');
        } else {
            resultDiv.innerHTML = '<p style="color:#ff6b6b;">❌ ' + (data.detail || 'خطای ناشناخته') + '</p>';
        }
    } catch(e) { resultDiv.innerHTML = '<p style="color:#ff6b6b;">❌ خطا در ارتباط با سرور</p>'; }
}

// ---------- Display Function ----------
function displayNumerologyResult(data, container, title) {
    let html = '<div style="background:rgba(108,92,231,0.1);border:1px solid rgba(108,92,231,0.3);border-radius:16px;padding:20px;margin-top:10px;">';
    html += '<h4 style="color:#fdcb6e;margin-top:0;">' + title + '</h4>';

    // ─── تفسیر عمیق (اگر موجود) — قبل از جزئیات عددی ───
    var deep = data.deep || null;
    if (deep && deep.identity) {
        html += '<div style="margin:8px 0 14px;padding:14px 16px;background:rgba(253,203,110,0.06);border-right:3px solid rgba(253,203,110,0.45);border-radius:10px;">';
        html += '<div style="font-size:1.05rem;font-weight:800;color:#fdcb6e;margin-bottom:8px;">' + deep.identity + '</div>';
        html += '<div style="line-height:2;color:#ddd;font-size:0.9rem;margin-bottom:8px;">' + deep.essence + '</div>';
        html += '<div style="line-height:2;color:#8fe3b4;font-size:0.85rem;margin-bottom:6px;"><b>💪 نقاط قوت:</b> ' + deep.strengths + '</div>';
        html += '<div style="line-height:2;color:#ff8fab;font-size:0.85rem;margin-bottom:6px;"><b>🌑 سایه / چالش:</b> ' + deep.shadow + '</div>';
        html += '<div style="line-height:2;color:#8fb4ff;font-size:0.85rem;"><b>🌱 مسیر رشد:</b> ' + deep.growth + '</div>';
        html += '</div>';
    }

    // تفسیر سال شخصی
    if (data.deep_year) {
        html += '<div style="margin:8px 0 14px;padding:14px 16px;background:rgba(162,155,254,0.08);border-right:3px solid rgba(162,155,254,0.45);border-radius:10px;line-height:2;color:#ddd;font-size:0.9rem;">';
        html += '<b style="color:#a29bfe;">🔮 این سال چگونه خواهد بود:</b><br>' + data.deep_year + '</div>';
    }

    // استعداد روز تولد
    if (data.birth_day_talent) {
        html += '<div style="margin:8px 0 14px;padding:12px 16px;background:rgba(46,204,113,0.07);border-right:3px solid rgba(46,204,113,0.4);border-radius:10px;line-height:2;color:#ddd;font-size:0.88rem;">';
        html += '<b style="color:#2ecc71;">✨ استعداد روز تولد (روز ' + data.birth_day_number + '):</b> ' + data.birth_day_talent + '</div>';
    }

    for (const [key, value] of Object.entries(data)) {
        if (['deep', 'deep_year', 'birth_day_talent', 'birth_day_number', 'birth_day_deep', 'dynamic', 'challenges', 'advice'].includes(key)) continue;
        if (key === 'details' && Array.isArray(value)) {
            html += '<div style="color:#aaa;font-size:0.85rem;margin:5px 0;"><strong>جزئیات:</strong> ';
            html += value.map(function(d) { return d.char + '=' + d.value; }).join(' + ');
            html += '</div>';
        } else if (typeof value === 'string' || typeof value === 'number') {
            var labels = {
                'life_path': '🟣 عدد مسیر زندگی',
                'personal_year': '🟡 سال شخصی',
                'expression': '🟢 عدد بیان',
                'soul_urge': '🔴 عدد درونی',
                'compatibility_level': '⭐ سطح سازگاری',
                'description': '📝 توضیح',
                'meaning': '📖 تفسیر',
                'total': '📊 جمع کل',
                'difference': '📏 تفاوت',
                'name': '👤 نام',
                'target_year': '🎯 سال هدف',
                'target_sum': '📊 جمع سال هدف',
                'month_sum': '📊 جمع ماه',
                'day_sum': '📊 جمع روز',
                'year_sum': '📊 جمع سال'
            };
            var label = labels[key] || key;
            html += '<div style="margin:5px 0;color:#ddd;"><strong>' + label + ':</strong> ' + value + '</div>';
        }
    }

    // ─── تحلیل پویای سازگاری ───
    if (data.dynamic) {
        html += '<div style="margin:12px 0;padding:14px 16px;background:rgba(108,92,231,0.08);border-right:3px solid rgba(108,92,231,0.5);border-radius:10px;line-height:2;color:#ddd;font-size:0.9rem;">';
        html += '<b style="color:#a29bfe;">🎭 پویایی رابطه:</b><br>' + data.dynamic + '</div>';
    }
    if (data.challenges && data.challenges.length) {
        html += '<div style="margin:10px 0;padding:12px 16px;background:rgba(231,76,60,0.06);border-right:3px solid rgba(231,76,60,0.4);border-radius:10px;">';
        html += '<b style="color:#e17055;">⚠️ چالش‌های محتمل:</b><ul style="margin:6px 0 0;padding-right:18px;color:#ddd;font-size:0.85rem;line-height:2;">';
        data.challenges.forEach(function (c) { html += '<li>' + c + '</li>'; });
        html += '</ul></div>';
    }
    if (data.advice && data.advice.length) {
        html += '<div style="margin:10px 0;padding:12px 16px;background:rgba(46,204,113,0.06);border-right:3px solid rgba(46,204,113,0.4);border-radius:10px;">';
        html += '<b style="color:#2ecc71;">💡 توصیه‌های عملی:</b><ul style="margin:6px 0 0;padding-right:18px;color:#ddd;font-size:0.85rem;line-height:2;">';
        data.advice.forEach(function (a) { html += '<li>' + a + '</li>'; });
        html += '</ul></div>';
    }
    html += '</div>';
    container.innerHTML = html;
}

// ================================================================
//   INIT
// ============================================
// BIORHYTHM (بیوریتم)
// ============================================

function getBiorhythmForm() {
    var profileISO = getProfileBirthISO();
    var hasProfile = !!profileISO;
    var defaultYear = sharedInputs.birthDate ? sharedInputs.birthDate.year : 1379;
    var defaultDate = sharedInputs.birthDate ? sharedInputs.birthDate : { year: defaultYear, month: 1, day: 1 };
    var profileShamsi = '';
    if (hasProfile && sharedInputs.birthDate) {
        profileShamsi = formatDpDisplay(sharedInputs.birthDate, 'shamsi', 'fa');
    }
    var banner = hasProfile
        ? `<div style="background:rgba(46,204,113,0.08);border:1px solid rgba(46,204,113,0.35);border-radius:14px;padding:14px 18px;margin-bottom:16px;">
             <b style="color:#2ecc71;">✅ بیوریتم شما</b>
             <div style="font-size:0.85rem;color:#ccc;margin-top:4px;">تاریخ تولد ثبت‌شده‌ی پروفایل: <b style="color:#fff;">${profileShamsi || profileISO}</b></div>
             <div style="font-size:0.78rem;color:#999;margin-top:4px;">محاسبه‌ها بر اساس همین تاریخ انجام می‌شود. برای تغییر تاریخ تولد به <button onclick="navigate('dashboard')" style="background:none;border:none;color:#fdcb6e;cursor:pointer;font-family:inherit;font-size:0.78rem;text-decoration:underline;padding:0;">داشبورد کاربری ← تنظیمات تولد</button> بروید. تاریخ دلخواهِ پایین فقط برای «آزمایش» است.</div>
           </div>`
        : `<div style="background:rgba(253,203,110,0.08);border:1px solid rgba(253,203,110,0.35);border-radius:14px;padding:14px 18px;margin-bottom:16px;">
             <b style="color:#fdcb6e;">📅 تاریخ تولد ثبت نشده</b>
             <div style="font-size:0.82rem;color:#ccc;margin-top:4px;">اگر وارد شده‌اید، تاریخ انتخابی زیر به‌عنوان تاریخ تولد پروفایل شما ثبت می‌شود. برای تغییر بعدی به داشبورد کاربری ← تنظیمات تولد بروید.</div>
           </div>`;
    return `
        <div style="max-width:900px;margin:0 auto;">
            <h3 style="color:#a29bfe;text-align:center;">🔬 بیوریتم - انرژی امروز شما</h3>
            ${banner}

            <!-- Main Calculator -->
            <div style="background:rgba(255,255,255,0.03);border-radius:16px;padding:20px;margin-bottom:20px;border:1px solid rgba(255,255,255,0.05);">
                <h4 style="color:#fdcb6e;margin-top:0;">📅 محاسبه بیوریتم</h4>
                <div class="form-group"><label>${hasProfile ? 'تاریخ دلخواه (آزمایشی — روی پروفایل اثری ندارد)' : 'تاریخ تولد'}</label>${makeDatePickerTrigger('bioBirthDP', {label: hasProfile ? 'تاریخ دلخواه' : 'تاریخ تولد', calendarType:'shamsi', digits:'fa', defaultValue: defaultDate})}</div>
                <div class="form-group"><label>تاریخ هدف (اختیاری، خالی = امروز)</label><input id="bioTarget" placeholder="YYYY-MM-DD"></div>
                <button class="btn-primary" onclick="submitBiorhythm()">🔬 محاسبه بیوریتم</button>
                <div id="bioResult" style="margin-top:15px;"></div>
            </div>

            <!-- Monthly Overview -->
            <div style="background:rgba(255,255,255,0.03);border-radius:16px;padding:20px;margin-bottom:20px;border:1px solid rgba(255,255,255,0.05);">
                <h4 style="color:#fdcb6e;margin-top:0;">📊 نمای ماهانه</h4>
                <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:10px;">
                    <button class="btn-secondary" onclick="submitMyMonthlyView()">🌙 نمای ماهانه من</button>
                    <span style="font-size:0.78rem;color:#999;">بر اساس تاریخ تولد ${hasProfile ? 'ثبت‌شده‌ی' : 'انتخاب‌شده‌ی'} شما در ماهِ تولدتان</span>
                </div>
                <div class="form-group"><label>تاریخ تولد (دلخواه/آزمایشی)</label>${makeDatePickerTrigger('bioMonthlyBirthDP', {label:'تاریخ تولد', calendarType:'shamsi', digits:'fa', defaultValue: defaultDate})}</div>
                <div class="form-group"><label>سال</label><input id="bioMonthlyYear" type="number" value="2026"></div>
                <div class="form-group"><label>ماه</label><input id="bioMonthlyMonth" type="number" value="8" min="1" max="12"></div>
                <button class="btn-secondary" onclick="submitMonthlyOverview()">📊 نمای ماهانه</button>
                <div id="bioMonthlyResult" style="margin-top:15px;"></div>
            </div>
        </div>
    `;
}

/* resolve which birth date a biorhythm calc should use:
   1) profile birth (if registered)  2) picked test date  */
function resolveBioBirth(pickerId) {
    var profileISO = getProfileBirthISO();
    if (profileISO) return { iso: profileISO, source: 'profile' };
    var h = document.getElementById(pickerId + '_hidden');
    if (h && h.value) return { iso: isoShamsiToGregorian(h.value), source: 'picked' };
    return null;
}

/* «نمای ماهانه من» — uses profile (or picked) birth, targets the birth
   month of the CURRENT year (or the month the user registered in) */
async function submitMyMonthlyView() {
    var r = resolveBioBirth('bioMonthlyBirthDP');
    var resultDiv = document.getElementById('bioMonthlyResult');
    if (!r) { resultDiv.innerHTML = '❌ ابتدا تاریخ تولد را انتخاب کنید یا در پروفایل ثبت کنید'; return; }
    if (parseInt(r.iso.split('-')[0]) < 1279) { resultDiv.innerHTML = '<span style="color:#e74c3c;">❌ مردگان ستاره‌ای در چارت ندارند 🌌</span>'; return; }
    var bd = new Date(r.iso + 'T00:00:00');
    var year = new Date().getFullYear();
    var month = bd.getMonth() + 1;   /* the user's birth month */
    resultDiv.innerHTML = makeShimmerCompact('⏳ در حال محاسبه نمای ماهانه شما... (' + month + '/' + year + ')');
    try {
        const res = await fetch('/api/v5/biorhythm/monthly', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ birth_date: r.iso, year: year, month: month })
        });
        const data = await res.json();
        if (data.status === 'success') {
            displayMonthlyOverview(data.data, resultDiv);
        } else {
            resultDiv.innerHTML = `❌ ${data.detail || 'خطا'}`;
        }
    } catch(e) { resultDiv.innerHTML = '❌ خطا در ارتباط با سرور'; }
}

// ─── تبدیل تاریخ ISO شمسی (1300–1600) به میلادی برای بک‌اند ───
// از zodiac-display.js استفاده می‌کند (سال+ماه+روز کامل)
function isoShamsiToGregorian(iso) {
    if (window.isoShamsiToGregorianISO) return window.isoShamsiToGregorianISO(iso);
    return iso;
}

async function submitBiorhythm() {
    const resultDiv = document.getElementById('bioResult');
    var profileISO = getProfileBirthISO();
    var bioHidden = document.getElementById('bioBirthDP_hidden');
    var birth;
    if (profileISO) {
        /* profile birth always wins for the main calc */
        birth = profileISO;
    } else {
        birth = isoShamsiToGregorian(bioHidden ? bioHidden.value : '');
        /* guest picking a birth date here → register it to their profile
           (server-side if logged in; locally always) */
        if (birth && bioHidden && bioHidden.value) {
            var parts2 = bioHidden.value.split('-');
            if (parts2.length >= 3) {
                sharedInputs.birthDate = { year: parseInt(parts2[0]), month: parseInt(parts2[1]), day: parseInt(parts2[2]) };
                persistSharedInputsLocal();
                saveProfileToServer();
            }
        }
    }
    const target = document.getElementById('bioTarget').value;
    if (!birth) { resultDiv.innerHTML = '❌ تاریخ تولد را وارد کنید'; return; }
    if (parseInt(birth.split('-')[0]) < 1279) { resultDiv.innerHTML = '<span style="color:#e74c3c;">❌ مردگان ستاره‌ای در چارت ندارند 🌌</span>'; return; }
    resultDiv.innerHTML = deEmoji('⏳ در حال محاسبه...');
    try {
        const res = await fetch('/api/v5/biorhythm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ birth_date: birth, target_date: target || null })
        });
        const data = await res.json();
        if (data.status === 'success') {
            displayBiorhythm(data.data, resultDiv);
        } else {
            resultDiv.innerHTML = `❌ ${data.detail || 'خطا'}`;
        }
    } catch(e) { resultDiv.innerHTML = '❌ خطا در ارتباط با سرور'; }
}

async function submitMonthlyOverview() {
    var profileISO = getProfileBirthISO();
    var mbHidden = document.getElementById('bioMonthlyBirthDP_hidden');
    const birth = profileISO || isoShamsiToGregorian(mbHidden ? mbHidden.value : '');
    const year = parseInt(document.getElementById('bioMonthlyYear').value);
    const month = parseInt(document.getElementById('bioMonthlyMonth').value);
    const resultDiv = document.getElementById('bioMonthlyResult');
    if (!birth || !year || !month) { resultDiv.innerHTML = '❌ اطلاعات را کامل وارد کنید'; return; }
    if (parseInt(birth.split('-')[0]) < 1279) { resultDiv.innerHTML = '<span style="color:#e74c3c;">❌ مردگان ستاره‌ای در چارت ندارند 🌌</span>'; return; }
    resultDiv.innerHTML = makeShimmerCompact('⏳ در حال محاسبه نمای ماهانه...');
    try {
        const res = await fetch('/api/v5/biorhythm/monthly', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ birth_date: birth, year, month })
        });
        const data = await res.json();
        if (data.status === 'success') {
            displayMonthlyOverview(data.data, resultDiv);
        } else {
            resultDiv.innerHTML = `❌ ${data.detail || 'خطا'}`;
        }
    } catch(e) { resultDiv.innerHTML = '❌ خطا در ارتباط با سرور'; }
}

function displayBiorhythm(data, container) {
    // Helper: bar color based on value
    function barColor(val) {
        if (val > 70) return '#00b894';
        if (val > 30) return '#00cec9';
        if (val > -30) return '#fdcb6e';
        if (val > -70) return '#e17055';
        return '#d63031';
    }

    let html = `<div style="background:rgba(108,92,231,0.1);border:1px solid rgba(108,92,231,0.3);border-radius:16px;padding:20px;margin-top:10px;">`;
    html += `<h4 style="color:#fdcb6e;margin-top:0;">📊 بیوریتم — ${data.target_date}</h4>`;
    html += `<p style="color:#aaa;">⏳ ${data.days} روز از تولد (${data.birth_day_of_week}) گذشته است</p>`;

    // ─── تفسیر ترکیبی روز (اگر بک‌اند فرستاده) ───
    if (data.combined) {
        html += `<div style="margin:14px 0;padding:16px 18px;background:rgba(253,203,110,0.07);border-right:3px solid rgba(253,203,110,0.5);border-radius:12px;">`;
        html += `<div style="font-size:1.15rem;font-weight:800;color:#fdcb6e;margin-bottom:6px;">${data.combined.headline}</div>`;
        html += `<div style="line-height:2;color:#ddd;font-size:0.9rem;">${data.combined.summary}</div>`;
        if (data.combined.suggestions && data.combined.suggestions.length) {
            html += `<div style="margin-top:10px;"><b style="color:#a29bfe;">💡 پیشنهادهای امروز:</b><ul style="margin:6px 0 0;padding-right:18px;color:#ccc;font-size:0.85rem;line-height:2;">`;
            data.combined.suggestions.forEach(function (s) { html += '<li>' + s + '</li>'; });
            html += `</ul></div>`;
        }
        html += `</div>`;
    }

    const cycles = [
        { label: '💪 فیزیکی', key: 'physical', status: data.physical_status, phase: data.physical_phase, pt: data.physical_phase_type, cd: data.cycle_details && data.cycle_details.physical },
        { label: '❤️ عاطفی', key: 'emotional', status: data.emotional_status, phase: data.emotional_phase, pt: data.emotional_phase_type, cd: data.cycle_details && data.cycle_details.emotional },
        { label: '🧠 ذهنی', key: 'intellectual', status: data.intellectual_status, phase: data.intellectual_phase, pt: data.intellectual_phase_type, cd: data.cycle_details && data.cycle_details.intellectual },
    ];

    html += `<div style="margin-top:15px;">`;
    cycles.forEach(c => {
        const val = data[c.key];
        const color = barColor(val);
        const isPositive = val >= 0;
        const phaseBadge = c.pt ? `<span style="font-size:0.7rem;padding:2px 10px;border-radius:12px;background:${c.pt.critical ? 'rgba(231,76,60,0.15);color:#e17055' : c.pt.type.startsWith('مثبت') ? 'rgba(0,184,148,0.15);color:#00b894' : 'rgba(253,203,110,0.15);color:#fdcb6e'};margin-right:6px;">${c.pt.type} ${c.pt.direction}</span>` : '';
        html += `
            <div style="margin:12px 0;background:rgba(0,0,0,0.2);border-radius:10px;padding:12px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;flex-wrap:wrap;gap:4px;">
                    <span style="color:#ddd;font-weight:bold;">${c.label} ${phaseBadge}</span>
                    <span style="color:${color};font-weight:bold;">${val}% ${c.status}</span>
                </div>
                <div style="background:rgba(255,255,255,0.05);border-radius:6px;height:10px;overflow:hidden;position:relative;">
                    <div style="position:absolute;top:0;${isPositive ? 'left:50%' : 'right:50%'};width:${Math.abs(val) / 2}%;height:100%;background:${color};opacity:0.8;border-radius:6px;"></div>
                    <div style="position:absolute;top:0;left:50%;width:2px;height:100%;background:rgba(255,255,255,0.2);"></div>
                </div>
                <div style="color:#aaa;font-size:0.78rem;margin-top:5px;line-height:1.8;">
                    فاز: ${c.phase}${c.pt && c.pt.critical ? ' — <span style="color:#e17055;">' + c.pt.desc + '</span>' : ''}
                    ${c.cd ? `<br>📅 روز ${c.cd.position_in_cycle} از چرخهٔ ${c.cd.cycle}روزه · روز بحرانیِ بعدی: ${c.cd.days_to_critical} روز دیگر` : ''}
                </div>
            </div>`;
    });
    html += `</div>`;

    // ─── چرخه‌های فرعی ───
    if (data.secondary_cycles) {
        const sec = data.secondary_cycles;
        html += `<div style="margin-top:16px;padding:14px 16px;background:rgba(162,155,254,0.06);border:1px solid rgba(162,155,254,0.2);border-radius:12px;">`;
        html += `<h5 style="color:#a29bfe;margin:0 0 10px;">🌟 چرخه‌های فرعی (ترکیبی)</h5>`;
        Object.keys(sec).forEach(function (k) {
            const s = sec[k];
            const color = barColor(s.value);
            html += `<div style="margin:10px 0;">
                <div style="display:flex;justify-content:space-between;font-size:0.85rem;margin-bottom:4px;">
                    <span style="color:#ddd;font-weight:700;">${s.label} <span style="color:#888;font-weight:400;">(${s.cycle} روزه)</span></span>
                    <span style="color:${color};font-weight:800;">${s.value}%</span>
                </div>
                <div style="background:rgba(255,255,255,0.05);border-radius:5px;height:7px;overflow:hidden;position:relative;">
                    <div style="position:absolute;top:0;${s.value >= 0 ? 'left:50%' : 'right:50%'};width:${Math.abs(s.value) / 2}%;height:100%;background:${color};opacity:0.8;border-radius:5px;"></div>
                    <div style="position:absolute;top:0;left:50%;width:2px;height:100%;background:rgba(255,255,255,0.2);"></div>
                </div>
                <div style="color:#888;font-size:0.75rem;margin-top:3px;line-height:1.7;">${s.desc}</div>
            </div>`;
        });
        html += `</div>`;
    }

    // Tomorrow preview
    if (data.next_day) {
        html += `<div style="margin-top:15px;padding:12px;background:rgba(0,184,148,0.1);border-radius:10px;border:1px solid rgba(0,184,148,0.2);">
            <h5 style="color:#00b894;margin:0 0 8px 0;">📆 فردا</h5>
            <div style="color:#ccc;font-size:0.9rem;">
                💪 فیزیکی: ${data.next_day.physical}% · ❤️ عاطفی: ${data.next_day.emotional}% · 🧠 ذهنی: ${data.next_day.intellectual}%
            </div>
        </div>`;
    }

    html += `</div>`;
    container.innerHTML = html;
}

function displayMonthlyOverview(data, container) {
    if (!data.days || data.days.length === 0) {
        container.innerHTML = '❌ داده‌ای موجود نیست';
        return;
    }
    
    function valColor(val) {
        if (val > 70) return '#00b894';
        if (val > 30) return '#00cec9';
        if (val > -30) return '#fdcb6e';
        if (val > -70) return '#e17055';
        return '#d63031';
    }
    
    let html = `<div style="background:rgba(108,92,231,0.1);border:1px solid rgba(108,92,231,0.3);border-radius:16px;padding:20px;margin-top:10px;overflow-x:auto;">`;
    html += `<h4 style="color:#fdcb6e;margin-top:0;">📊 نمای بیوریتم — ${data.month}/${data.year}</h4>`;
    
    // Mini calendar grid
    html += `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(80px,1fr));gap:8px;margin-top:15px;">`;
    data.days.forEach(d => {
        html += `
            <div style="background:rgba(0,0,0,0.3);border-radius:8px;padding:8px;text-align:center;font-size:0.75rem;">
                <div style="color:#aaa;margin-bottom:4px;">${d.day}</div>
                <div style="color:${valColor(d.physical)};">💪 ${d.physical.toFixed(0)}</div>
                <div style="color:${valColor(d.emotional)};">❤️ ${d.emotional.toFixed(0)}</div>
                <div style="color:${valColor(d.intellectual)};">🧠 ${d.intellectual.toFixed(0)}</div>
            </div>`;
    });
    html += `</div>`;
    // روزهای بحرانی ماه
    if (data.critical_days && data.critical_days.length) {
        html += `<div style="margin-top:14px;padding:12px 16px;background:rgba(231,76,60,0.07);border-right:3px solid rgba(231,76,60,0.4);border-radius:10px;">`;
        html += `<b style="color:#e17055;">⚡ روزهای بحرانی این ماه:</b><div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px;">`;
        data.critical_days.forEach(function (cd) {
            html += `<span style="background:rgba(231,76,60,0.12);padding:4px 12px;border-radius:14px;font-size:0.8rem;color:#ddd;">روز ${cd.day} — ${cd.cycle}</span>`;
        });
        html += `</div><div style="color:#888;font-size:0.75rem;margin-top:6px;">روزِ عبور چرخه از خط صفر — بیشترین ریسکِ خطا؛ مراقبت و تصمیم‌نگرفتن در این روزها توصیه می‌شود.</div></div>`;
    }
    html += `<div style="margin-top:12px;color:#aaa;font-size:0.8rem;">💪 فیزیکی · ❤️ عاطفی · 🧠 ذهنی (درصد)</div>`;
    html += `</div>`;
    container.innerHTML = html;
}

// ============================================
// CHINESE ZODIAC (سال حیوانی چینی)
// ============================================

function getZodiacForm() {
    var zodiacYearDefault = window.sharedInputs && window.sharedInputs.birthDate && window.sharedInputs.birthDate.year >= 1300 && window.sharedInputs.birthDate.year <= 1600
        ? (window.normalizeBirthYearToGregorian ? window.normalizeBirthYearToGregorian(window.sharedInputs.birthDate.year, window.sharedInputs.birthDate.month, window.sharedInputs.birthDate.day) : 1990)
        : 1990;
    return `
        <div style="max-width:900px;margin:0 auto;">
            <h3 style="color:#a29bfe;text-align:center;">🐉 سال حیوانی چینی</h3>

            <!-- Zodiac Calculator -->
            <div style="background:rgba(255,255,255,0.03);border-radius:16px;padding:20px;margin-bottom:20px;border:1px solid rgba(255,255,255,0.05);">
                <h4 style="color:#fdcb6e;margin-top:0;">🐭 محاسبه حیوان سال تولد</h4>
                <div class="form-group"><label>سال تولد (میلادی)</label><input id="zodiacYear" type="number" value="${zodiacYearDefault}"></div>
                <button class="btn-primary" onclick="submitZodiac()">🐉 محاسبه</button>
                <div id="zodiacResult" style="margin-top:15px;"></div>
            </div>

            <!-- ═══ اکتشاف: بادبزن ۱۲ حیوان ═══ -->
            <div style="background:rgba(108,92,231,0.06);border-radius:16px;padding:20px;margin-bottom:20px;border:1px solid rgba(108,92,231,0.25);">
                <h4 style="color:#fdcb6e;margin-top:0;">🏮 کاوشِ ۱۲ حیوان — روی هر حیوان بزن</h4>
                <div id="zcFan" style="display:flex;flex-wrap:wrap;justify-content:center;gap:10px;margin:14px 0;"></div>
                <div id="zcDetail" style="display:none;margin-top:10px;"></div>
            </div>

            <!-- Compatibility -->
            <div style="background:rgba(255,255,255,0.03);border-radius:16px;padding:20px;margin-bottom:20px;border:1px solid rgba(255,255,255,0.05);">
                <h4 style="color:#fdcb6e;margin-top:0;">💞 سازگاری دو حیوان</h4>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                    <div class="form-group"><label>حیوان اول</label><select id="zodiacAnimal1" style="width:100%;padding:8px;border-radius:8px;background:#1a1a2e;color:#ddd;border:1px solid rgba(255,255,255,0.1);">
                        <option>موش</option><option>گاو</option><option>ببر</option><option>خرگوش</option><option>اژدها</option><option>مار</option><option>اسب</option><option>بز</option><option>میمون</option><option>خروس</option><option>سگ</option><option>گراز</option>
                    </select></div>
                    <div class="form-group"><label>حیوان دوم</label><select id="zodiacAnimal2" style="width:100%;padding:8px;border-radius:8px;background:#1a1a2e;color:#ddd;border:1px solid rgba(255,255,255,0.1);">
                        <option>موش</option><option>گاو</option><option>ببر</option><option>خرگوش</option><option selected>اژدها</option><option>مار</option><option>اسب</option><option>بز</option><option>میمون</option><option>خروس</option><option>سگ</option><option>گراز</option>
                    </select></div>
                </div>
                <button class="btn-secondary" onclick="submitZodiacCompat()">💞 بررسی سازگاری</button>
                <div id="zodiacCompatResult" style="margin-top:15px;"></div>
            </div>
        </div>
    `;
}

// بادبزن ۱۲ حیوان — کلیک: نمایش تفسیر عمیق + محاسبهٔ سال
function _zcInitFan() {
    const fan = document.getElementById('zcFan');
    if (!fan) return;
    const animals = [
        { n:'موش', e:'🐭', y:2020 }, { n:'گاو', e:'🐮', y:2021 },
        { n:'ببر', e:'🐯', y:2022 }, { n:'خرگوش', e:'🐰', y:2023 },
        { n:'اژدها', e:'🐲', y:2024 }, { n:'مار', e:'🐍', y:2025 },
        { n:'اسب', e:'🐴', y:2026 }, { n:'بز', e:'🐐', y:2027 },
        { n:'میمون', e:'🐵', y:2028 }, { n:'خروس', e:'🐔', y:2029 },
        { n:'سگ', e:'🐶', y:2030 }, { n:'گراز', e:'🐷', y:2031 }
    ];
    fan.innerHTML = animals.map(function (a, i) {
        return `<button class="zc-card" data-animal="${a.n}" data-year="${a.y}" onclick="zcShow('${a.n}','${a.y}',this)"
            style="display:flex;flex-direction:column;align-items:center;gap:4px;padding:12px 10px;border-radius:14px;background:rgba(255,255,255,0.03);border:1px solid rgba(162,155,254,0.2);cursor:pointer;transition:all .2s;min-width:74px;"
            onmouseover="this.style.borderColor='#fdcb6e';this.style.transform='translateY(-4px)';"
            onmouseout="this.style.borderColor='rgba(162,155,254,0.2)';this.style.transform='';"
        ><span style="font-size:2rem;">${a.e}</span><span style="font-size:0.78rem;color:#ddd;">${a.n}</span><span style="font-size:0.65rem;color:#888;">${a.y}</span></button>`;
    }).join('');
}

async function zcShow(animal, year, btn) {
    const detail = document.getElementById('zcDetail');
    if (!detail) return;
    // هایلایت انتخاب
    document.querySelectorAll('.zc-card').forEach(function (c) {
        c.style.background = 'rgba(255,255,255,0.03)';
        c.style.borderColor = 'rgba(162,155,254,0.2)';
    });
    if (btn) { btn.style.background = 'rgba(253,203,110,0.12)'; btn.style.borderColor = '#fdcb6e'; }

    detail.style.display = 'block';
    detail.innerHTML = makeShimmerCompact('⏳ در حال آشکار شدن...');

    try {
        const res = await fetch('/api/v5/chinese-zodiac', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ year: parseInt(year) })
        });
        const data = await res.json();
        if (data.status !== 'success') { detail.innerHTML = '<p style="color:#ff6b6b;">❌ خطا</p>'; return; }
        const d = data.data.deep || {};
        const best = (data.data.compatibility.best_matches || []).join('، ');
        const avoid = (data.data.compatibility.avoid || []).join('، ');

        detail.innerHTML = `
            <div style="background:rgba(253,203,110,0.05);border-radius:14px;padding:18px;border:1px solid rgba(253,203,110,0.2);">
                <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
                    <span style="font-size:2.6rem;">${data.data.animal_emoji}</span>
                    <div>
                        <div style="font-size:1.15rem;font-weight:800;color:#fdcb6e;">${data.data.description}</div>
                        <div style="font-size:0.78rem;color:#8fb4ff;">نمونهٔ سال: ${data.data.year} · تکرار بعدی: ${data.data.next_occurrence}</div>
                    </div>
                </div>
                <div style="margin-top:12px;line-height:2;color:#ddd;font-size:0.88rem;">${d.legend || data.data.personality}</div>
                ${d.strengths ? `<div style="margin-top:10px;line-height:2;color:#8fe3b4;font-size:0.85rem;"><b>💪 نقاط قوت:</b> ${d.strengths}</div>` : ''}
                ${d.shadow ? `<div style="margin-top:8px;line-height:2;color:#ff8fab;font-size:0.85rem;"><b>🌑 سایه:</b> ${d.shadow}</div>` : ''}
                ${d.career ? `<div style="margin-top:8px;line-height:2;color:#74b9ff;font-size:0.85rem;"><b>💼 شغل‌های مناسب:</b> ${d.career}</div>` : ''}
                ${d.love ? `<div style="margin-top:8px;line-height:2;color:#ff8fab;font-size:0.85rem;"><b>❤️ در عشق:</b> ${d.love}</div>` : ''}
                <div style="margin-top:10px;font-size:0.82rem;">
                    ${best ? `<div style="color:#00b894;">⭐ بهترین جفت‌ها: ${best}</div>` : ''}
                    ${avoid ? `<div style="color:#e17055;">⚠️ اجتناب: ${avoid}</div>` : ''}
                </div>
            </div>`;
    } catch (e) {
        detail.innerHTML = '<p style="color:#ff6b6b;">❌ خطا در ارتباط با سرور</p>';
    }
}
window.zcShow = zcShow;

async function submitZodiac() {
    const year = parseInt(document.getElementById('zodiacYear').value);
    const resultDiv = document.getElementById('zodiacResult');
    if (!year) { resultDiv.innerHTML = '❌ سال را وارد کنید'; return; }
    if (year < 1279) { resultDiv.innerHTML = '<span style="color:#e74c3c;">❌ مردگان ستاره‌ای در چارت ندارند 🌌</span>'; return; }
    resultDiv.innerHTML = makeShimmerCompact('⏳ در حال محاسبه سال حیوانی...');
    try {
        const res = await fetch('/api/v5/chinese-zodiac', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ year })
        });
        const data = await res.json();
        if (data.status === 'success') {
            displayZodiac(data.data, resultDiv);
        } else {
            resultDiv.innerHTML = `❌ ${data.detail || 'خطا'}`;
        }
    } catch(e) { resultDiv.innerHTML = '❌ خطا در ارتباط با سرور'; }
}

async function submitZodiacCompat() {
    const animal1 = document.getElementById('zodiacAnimal1').value;
    const animal2 = document.getElementById('zodiacAnimal2').value;
    const resultDiv = document.getElementById('zodiacCompatResult');
    resultDiv.innerHTML = deEmoji('⏳ در حال بررسی...');
    try {
        const res = await fetch('/api/v5/chinese-zodiac/compatibility', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ animal1, animal2 })
        });
        const data = await res.json();
        if (data.status === 'success') {
            displayZodiacCompat(data.data, resultDiv);
        } else {
            resultDiv.innerHTML = `❌ ${data.detail || 'خطا'}`;
        }
    } catch(e) { resultDiv.innerHTML = '❌ خطا در ارتباط با سرور'; }
}

function displayZodiac(data, container) {
    const emojis = { 'موش':'🐭','گاو':'🐮','ببر':'🐯','خرگوش':'🐰','اژدها':'🐲','مار':'🐍','اسب':'🐴','بز':'🐐','میمون':'🐵','خروس':'🐔','سگ':'🐶','گراز':'🐷' };
    const emoji = emojis[data.animal] || '🐉';
    const bestStr = (data.compatibility.best_matches || []).map(a => `${emojis[a]||''} ${a}`).join('  ');
    const goodStr = (data.compatibility.good_matches || []).map(a => `${emojis[a]||''} ${a}`).join('  ');
    const avoidStr = (data.compatibility.avoid || []).map(a => `${emojis[a]||''} ${a}`).join('  ');

    container.innerHTML = `
        <div style="background:rgba(108,92,231,0.1);border:1px solid rgba(108,92,231,0.3);border-radius:16px;padding:25px;text-align:center;margin-top:10px;">
            <div style="font-size:4rem;margin-bottom:10px;">${emoji}</div>
            <h3 style="color:#fdcb6e;margin:5px 0;">${data.element} ${data.animal}</h3>
            <p style="color:#aaa;font-size:0.9rem;">${data.year} — ${data.stem_branch}</p>
            <p style="color:#ddd;margin:10px 0;line-height:1.8;">${data.personality}</p>
            <div style="margin-top:15px;text-align:right;">
                ${bestStr ? `<div style="margin:5px 0;color:#00b894;">⭐ بهترین‌ها: ${bestStr}</div>` : ''}
                ${goodStr ? `<div style="margin:5px 0;color:#00cec9;">👍 خوب: ${goodStr}</div>` : ''}
                ${avoidStr ? `<div style="margin:5px 0;color:#e17055;">⚠️ اجتناب: ${avoidStr}</div>` : ''}
            </div>
            <div style="margin-top:15px;padding:10px;background:rgba(0,184,148,0.1);border-radius:10px;color:#aaa;font-size:0.85rem;">
                🔄 تکرار بعدی این سال: ${data.next_occurrence}
            </div>
        </div>`;
}

function displayZodiacCompat(data, container) {
    const emojis = { 'موش':'🐭','گاو':'🐮','ببر':'🐯','خرگوش':'🐰','اژدها':'🐲','مار':'🐍','اسب':'🐴','بز':'🐐','میمون':'🐵','خروس':'🐔','سگ':'🐶','گراز':'🐷' };
    let levelColor = '#00b894';
    if (data.compatibility_level.includes('متوسط')) levelColor = '#fdcb6e';
    if (data.compatibility_level.includes('چالش')) levelColor = '#e17055';

    container.innerHTML = `
        <div style="background:rgba(108,92,231,0.1);border:1px solid rgba(108,92,231,0.3);border-radius:16px;padding:25px;text-align:center;margin-top:10px;">
            <div style="font-size:2.5rem;">${emojis[data.animal1]||'?'} ❤️ ${emojis[data.animal2]||'?'}</div>
            <h3 style="color:${levelColor};margin:10px 0;">${data.compatibility_level}</h3>
            <p style="color:#ddd;">${data.description}</p>
            <div style="margin-top:10px;color:#aaa;font-size:0.85rem;">
                ${data.animal1_sees_animal2 ? '✅ ' + data.animal1 + ' سازگار ' + data.animal2 + ' را می‌بیند' : ''}
                ${data.animal2_sees_animal1 ? '✅ ' + data.animal2 + ' سازگار ' + data.animal1 + ' را می‌بیند' : ''}
            </div>
        </div>`;
}

// ================================================================
// NASA (ناسا)
// ================================================================

function getNasaForm() {
    var html = '<div class="nasa-form"><div class="nasa-tabs">';
    var tabs = [
        {id: 'apod', icon: '\u{1f30c}', label: 'تصویر روز'},
        {id: 'images', icon: '\u{1f5bc}\ufe0f', label: 'تصاویر'},
        {id: 'space-weather', icon: '\u2600\ufe0f', label: 'آب و هوای فضا'},
        {id: 'asteroids', icon: '\u2604\ufe0f', label: 'سیارک\u200cها'},
        {id: 'planets', icon: '🌏', label: 'موقعیت سیارات'}
    ];
    tabs.forEach(function(t, i) {
        var cls = i === 0 ? 'nasa-tab active' : 'nasa-tab';
        html += '<button class="' + cls + '" data-nasa-tab="' + t.id + '">' + t.icon + ' ' + t.label + '</button>';
    });
    html += '</div><div id="nasaContent">';
    html += '<div id="nasaApod">';
    html += '<button class="btn-primary" onclick="fetchNasaApod()" style="width:100%;margin-bottom:16px;">\u{1f30c} دریافت تصویر نجومی روز</button>';
    html += '<div id="nasaApodResult"></div></div>';
    html += '<div id="nasaImages" style="display:none;">';
    html += '<div class="form-group"><label>\u{1f50d} کلمه کلیدی</label><input type="text" id="nasaImageQuery" value="galaxy" placeholder="مثلاً: nebula, galaxy, mars"></div>';
    html += '<button class="btn-primary" onclick="fetchNasaImages()" style="width:100%;margin-bottom:16px;">\u{1f50d} جستجو</button>';
    html += '<div id="nasaImagesResult"></div></div>';
    var _nasaToday = new Date().toISOString().split('T')[0];
    var _nasa7Ago = new Date(Date.now() - 7*86400000).toISOString().split('T')[0];
    function _gregToShamsi(iso) {
        try {
            var d = new Date(iso + 'T00:00:00');
            if (window.DateWheelPicker && DateWheelPicker.miladiToShamsi) {
                var j = DateWheelPicker.miladiToShamsi(d.getFullYear(), d.getMonth() + 1, d.getDate());
                if (j && j.year > 1200) return { year: j.year, month: j.month, day: j.day };
            }
            var fmt = new Intl.DateTimeFormat('en-u-ca-persian', { year: 'numeric', month: 'numeric', day: 'numeric' });
            var parts = {};
            fmt.formatToParts(d).forEach(function (p) { parts[p.type] = p.value; });
            return { year: parseInt(parts.year), month: parseInt(parts.month), day: parseInt(parts.day) };
        } catch (e) {
            try {
                if (window.DateWheelPicker && DateWheelPicker.miladiToShamsi) {
                    var now = new Date();
                    var j2 = DateWheelPicker.miladiToShamsi(now.getFullYear(), now.getMonth() + 1, now.getDate());
                    return { year: j2.year, month: j2.month, day: j2.day };
                }
            } catch (e2) {}
            return { year: 1404, month: 6, day: 17 };
        }
    }
    html += '<div id="nasaSpaceWeather" style="display:none;">';
    html += '<div class="form-grid">';
    html += '<div class="form-group"><label>\u{1f4c5} از تاریخ (شمسی)</label><div id="nasaWeatherRangePC"></div></div>';
    html += '</div>';
    html += '<button class="btn-primary" onclick="fetchNasaSpaceWeather()" style="width:100%;margin-bottom:16px;">☀️ دریافت آب و هوای فضا</button>';
    html += '<div id="nasaWeatherResult"></div></div>';
    html += '<div id="nasaAsteroids" style="display:none;">';
    html += '<div class="form-grid">';
    html += '<div class="form-group"><label>\u{1f4c5} بازه‌ی تاریخ (شمسی)</label><div id="nasaNeoRangePC"></div></div>';
    html += '</div>';
    html += '<button class="btn-primary" onclick="fetchNasaAsteroids()" style="width:100%;margin-bottom:16px;">☄️ دریافت سیارک‌ها</button>';
    html += '<div id="nasaNeoResult"></div></div>';
    var _nasaToday2 = new Date().toISOString().split('T')[0]; //x2
    html += '<div id="nasaPlanets" style="display:none;">';
    html += '<div class="form-group"><label>\u{1f4c5} تاریخ (شمسی)</label><div id="nasaPlanetsSinglePC"></div></div>';
    html += '<button class="btn-primary" onclick="fetchNasaPlanets()" style="width:100%;margin-bottom:16px;">🌏 دریافت موقعیت سیارات</button>';
    html += '<div id="nasaPlanetsResult"></div></div>';
    html += '</div></div>';
    setTimeout(function() {
        document.querySelectorAll('.nasa-tab[data-nasa-tab]').forEach(function(btn) {
            btn.addEventListener('click', function() { switchNasaTab(this.dataset.nasaTab); });
        });
        /* تقویم‌های preset‌دار */
        if (window.PresetCalendar) {
            PresetCalendar.mount({ mountId: 'nasaWeatherRangePC', mode: 'range', startHiddenId: 'nasaWeatherStartDP_hidden', endHiddenId: 'nasaWeatherEndDP_hidden', defaultFrom: '-7d', defaultTo: '0d' });
            PresetCalendar.mount({ mountId: 'nasaNeoRangePC', mode: 'range', startHiddenId: 'nasaNeoStartDP_hidden', endHiddenId: 'nasaNeoEndDP_hidden', defaultFrom: '-7d', defaultTo: '0d' });
            PresetCalendar.mount({ mountId: 'nasaPlanetsSinglePC', mode: 'single', hiddenId: 'nasaPlanetsDateDP_hidden', defaultDuration: '0d' });
        }
    }, 0);
    return html;
}
/* DEADBLOCK-START (old NASA code, inert)
function _deadNasaFragment_REMOVED() {
   deadcode: removed // KEEPMARK-START — DELETE-FROM-HERE
        {id: 'mars___REMOVEDT2___', icon: 'X', label: 'Curiosity'},
SPLIT-MARKER-INLINE-CLOSED-NEUTRALIZED
        {id: 'planets', icon: '\ud83c\udf0f', label: 'موقعیت سیارات'}
    ];
    tabs.forEach(function(t, i) {
        var cls = i === 0 ? 'nasa-tab active' : 'nasa-tab';
        html += '<button class="' + cls + '" data-nasa-tab="' + t.id + '">' + t.icon + ' ' + t.label + '</button>';
    });
    html += '</div><div id="nasaContent">';

    html += '<div id="nasaApod">';
    html += '<button class="btn-primary" onclick="fetchNasaApod()" style="width:100%;margin-bottom:16px;">\u{1f30c} دریافت تصویر نجومی روز</button>';
    html += '<div id="nasaApodResult"></div></div>';

    html += '<div id="nasaImages" style="display:none;">';
    html += '<div class="form-group"><label>\u{1f50d} کلمه کلیدی</label><input type="text" id="nasaImageQuery" value="galaxy" placeholder="مثلاً: nebula, galaxy, mars"></div>';
    html += '<button class="btn-primary" onclick="fetchNasaImages()" style="width:100%;margin-bottom:16px;">\u{1f50d} جستجو</button>';
    html += '<div id="nasaImagesResult"></div></div>';

    var _nasaToday = new Date().toISOString().split('T')[0];
    var _nasa7Ago = new Date(Date.now() - 7*86400000).toISOString().split('T')[0];

    // میلادیِ ISO → شمسیِ آبجکت برای date-picker
    // اولویت: DateWheelPicker.miladiToShamsi (تقویمِ دقیقِ جلالی) — Intl فقط fallback
    function _gregToShamsi(iso) {
        try {
            var d = new Date(iso + 'T00:00:00');
            if (window.DateWheelPicker && DateWheelPicker.miladiToShamsi) {
                var j = DateWheelPicker.miladiToShamsi(d.getFullYear(), d.getMonth() + 1, d.getDate());
                if (j && j.year > 1200) return { year: j.year, month: j.month, day: j.day };
            }
            var fmt = new Intl.DateTimeFormat('en-u-ca-persian', { year: 'numeric', month: 'numeric', day: 'numeric' });
            var parts = {};
            fmt.formatToParts(d).forEach(function (p) { parts[p.type] = p.value; });
            return { year: parseInt(parts.year), month: parseInt(parts.month), day: parseInt(parts.day) };
        } catch (e) {
            try {
                if (window.DateWheelPicker && DateWheelPicker.miladiToShamsi) {
                    var now = new Date();
                    var j2 = DateWheelPicker.miladiToShamsi(now.getFullYear(), now.getMonth() + 1, now.getDate());
                    return { year: j2.year, month: j2.month, day: j2.day };
                }
            } catch (e2) {}
            return { year: 1404, month: 6, day: 17 };
        }
    }

    html += '<div id="nasaSpaceWeather" style="display:none;">';
    html += '<div class="form-grid">';
    html += '<div class="form-group"><label>\u{1f4c5} از تاریخ (شمسی)</label>' + makeDatePickerTrigger('nasaWeatherStartDP', {label:'از تاریخ', calendarType:'shamsi', digits:'fa', defaultValue: _gregToShamsi(_nasa7Ago)}) + '</div>';
    html += '<div class="form-group"><label>\u{1f4c5} تا تاریخ (شمسی)</label>' + makeDatePickerTrigger('nasaWeatherEndDP', {label:'تا تاریخ', calendarType:'shamsi', digits:'fa', defaultValue: _gregToShamsi(_nasaToday)}) + '</div>';
    html += '</div>';
    html += '<button class="btn-primary" onclick="fetchNasaSpaceWeather()" style="width:100%;margin-bottom:16px;">\u2600\ufe0f دریافت آب و هوای فضا</button>';
    html += '<div id="nasaWeatherResult"></div></div>';

    html += '<div id="nasaAsteroids" style="display:none;">';
    html += '<div class="form-grid">';
    html += '<div class="form-group"><label>\u{1f4c5} از تاریخ (شمسی)</label>' + makeDatePickerTrigger('nasaNeoStartDP', {label:'از تاریخ', calendarType:'shamsi', digits:'fa', defaultValue: _gregToShamsi(_nasa7Ago)}) + '</div>';
    html += '<div class="form-group"><label>\u{1f4c5} تا تاریخ (شمسی)</label>' + makeDatePickerTrigger('nasaNeoEndDP', {label:'تا تاریخ', calendarType:'shamsi', digits:'fa', defaultValue: _gregToShamsi(_nasaToday)}) + '</div>';
    html += '</div>';
    html += '<button class="btn-primary" onclick="fetchNasaAsteroids()" style="width:100%;margin-bottom:16px;">\u2604\ufe0f دریافت سیارک\u200cها</button>';
    html += '<div id="nasaNeoResult"></div></div>';

    
    var _nasaToday2 = new Date().toISOString().split('T')[0]; //x2
    html += '<div id="nasaPlanets" style="display:none;">';
    html += '<div class="form-group"><label>\u{1f4c5} تاریخ (شمسی)</label>' + makeDatePickerTrigger('nasaPlanetsDateDP', {label:'تاریخ', calendarType:'shamsi', digits:'fa', defaultValue: _gregToShamsi(_nasaToday2)}) + '</div>';
    html += '<button class="btn-primary" onclick="fetchNasaPlanets()" style="width:100%;margin-bottom:16px;">\ud83c\udf0f دریافت موقعیت سیارات</button>';
    html += '<div id="nasaPlanetsResult"></div></div>';

    html += '</div></div>';

    setTimeout(function() {
        document.querySelectorAll('.nasa-tab[data-nasa-tab]').forEach(function(btn) {
            btn.addEventListener('click', function() { switchNasaTab(this.dataset.nasaTab); });
        });
    }, 0);

    return html;
}

function _oldGetaNasaForm_REMOVED() {
    var html = '';
    var tabs = [
        {id: 'apod', icon: 'A', label: 'x'}
    ];
    tabs.forEach(function(t, i) {
        var cls = i === 0 ? 'nasa-tab active' : 'nasa-tab';
        html += '<button class="' + cls + '" data-nasa-tab="' + t.id + '">' + t.icon + ' ' + t.label + '</button>';
    });
    html += '<div id="x"></div>';
    setTimeout(function() {}, 0);
    return html;
}

function _unused_switchNasaTab_OLD(tab) {
    // هر ۵ پنل — پس از حذفِ تب‌های مریخ و Curiosity
    var panels = ['nasaApod','nasaImages','nasaSpaceWeather','nasaAsteroids','nasaPlanets'];
    panels.forEach(function(id) { var el = document.getElementById(id); if (el) el.style.display = 'none'; });
    document.querySelectorAll('.nasa-tab').forEach(function(b) { b.classList.remove('active'); });
    var tabMap = {'apod':'nasaApod','images':'nasaImages','space-weather':'nasaSpaceWeather','asteroids':'nasaAsteroids','planets':'nasaPlanets'};
    var target = document.getElementById(tabMap[tab]);
    if (target) target.style.display = 'block';
    var btn = document.querySelector('.nasa-tab[data-nasa-tab="' + tab + '"]');
    if (btn) btn.classList.add('active');
    // ─── پاک‌سازی نتایجِ تب‌هایِ دیگر: هیچ نتیجه‌ای از تب قبلی نچسبد ───
    var resultIds = { apod:'nasaApodResult', images:'nasaImagesResult', 'space-weather':'nasaWeatherResult',
                      asteroids:'nasaNeoResult', planets:'nasaPlanetsResult' };
    Object.keys(resultIds).forEach(function (k) {
        if (k !== tab) { var el = document.getElementById(resultIds[k]); if (el) el.innerHTML = ''; }
    });
}

// ═══ Curiosity — خروجیِ خامِ REMS (تبِ مجزا) ═══
async function fetchCuriosityRaw() {
    var div = document.getElementById('nasaCuriosityResult');
    div.innerHTML = '<div class="nasa-loading">⏳ در حال دریافت داده از Curiosity...</div>';
    try {
        var res = await fetch('/api/v5/nasa/mars-weather');
        var data = await res.json();
        if (data.status !== 'success') {
            div.innerHTML = '<div class="nasa-error">❌ ' + (data.detail || data.note_fa || 'خطا') + '</div>';
            return;
        }
        var d = data.data;
        var sols = d.sols || [];
        var live = !d.historical;
        var html = '<div style="background:rgba(0,184,148,0.06);border:1px solid rgba(0,184,148,0.25);border-radius:14px;padding:14px 16px;margin-bottom:14px;">';
        html += '<b style="color:#00b894;">' + (live ? '🟢 دادهٔ زنده' : '⏳ دادهٔ تاریخی') + '</b> — ' + (d.source_fa || '') ;
        html += '<div style="color:#888;font-size:0.78rem;margin-top:4px;line-height:1.8;">' + (d.note_fa || '') + '</div></div>';
        html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px;">';
        sols.forEach(function (s) {
            var t = s.temperature || {};
            html += '<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:14px;">';
            html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;"><b style="color:#fdcb6e;">Sol ' + s.sol + '</b><span style="font-size:0.75rem;color:#a29bfe;">' + (s.season_fa || '') + '</span></div>';
            html += '<div style="display:flex;justify-content:space-around;font-size:0.85rem;text-align:center;">';
            html += '<div><div style="color:#888;font-size:0.7rem;">کمینه</div><b style="color:#85c1e9;">' + (t.min_c != null ? t.min_c + '°' : '—') + '</b></div>';
            html += '<div><div style="color:#888;font-size:0.7rem;">میانگین</div><b style="color:#fdcb6e;">' + (t.avg_c != null ? t.avg_c + '°' : '—') + '</b></div>';
            html += '<div><div style="color:#888;font-size:0.7rem;">بیشینه</div><b style="color:#ff6b6b;">' + (t.max_c != null ? t.max_c + '°' : '—') + '</b></div>';
            html += '</div>';
            if (s.interpretation_fa) html += '<div style="margin-top:8px;font-size:0.78rem;color:#ccc;line-height:1.9;">📜 ' + s.interpretation_fa + '</div>';
            html += '</div>';
        });
        html += '</div>';
        div.innerHTML = html;
    } catch (e) {
        div.innerHTML = '<div class="nasa-error">❌ خطا در ارتباط با سرور</div>';
    }
}
window.fetchCuriosityRaw = fetchCuriosityRaw; // dc-end8
*/ // DEADBLOCK-END

function switchNasaTab(tab) {
    // هر ۵ پنل — پس از حذفِ تب‌های مریخ و Curiosity
    var panels = ['nasaApod','nasaImages','nasaSpaceWeather','nasaAsteroids','nasaPlanets'];
    panels.forEach(function(id) { var el = document.getElementById(id); if (el) el.style.display = 'none'; });
    document.querySelectorAll('.nasa-tab').forEach(function(b) { b.classList.remove('active'); });
    var tabMap = {'apod':'nasaApod','images':'nasaImages','space-weather':'nasaSpaceWeather','asteroids':'nasaAsteroids','planets':'nasaPlanets'};
    var target = document.getElementById(tabMap[tab]);
    if (target) target.style.display = 'block';
    var btn = document.querySelector('.nasa-tab[data-nasa-tab="' + tab + '"]');
    if (btn) btn.classList.add('active');
    // ─── پاک‌سازی نتایجِ تب‌هایِ دیگر: هیچ نتیجه‌ای از تب قبلی نچسبد ───
    var resultIds = { apod:'nasaApodResult', images:'nasaImagesResult', 'space-weather':'nasaWeatherResult',
                      asteroids:'nasaNeoResult', planets:'nasaPlanetsResult' };
    Object.keys(resultIds).forEach(function (k) {
        if (k !== tab) { var el = document.getElementById(resultIds[k]); if (el) el.innerHTML = ''; }
    });
}

async function fetchNasaApod() {
    var div = document.getElementById('nasaApodResult');
    div.innerHTML = '<div class="nasa-loading">\u23f3 در حال دریافت تصویر از ناسا...</div>';
    try {
        var res = await fetch('/api/v5/nasa/apod');
        var data = await res.json();
        if (data.status === 'success') { displayNasaApod(data.data, div); }
        else { div.innerHTML = '<div class="nasa-error">\u274c ' + (data.detail || 'خطا') + '</div>'; }
    } catch(e) { div.innerHTML = '<div class="nasa-error">\u274c خطا در ارتباط با سرور</div>'; }
}

function displayNasaApod(data, container) {
    var mediaHtml = '';
    if (data.media_type === 'image') {
        mediaHtml = '<img src="' + data.url + '" alt="' + data.title + '" style="width:100%;border-radius:12px;margin:12px 0;">';
    } else {
        mediaHtml = '<iframe src="' + data.url + '" style="width:100%;height:400px;border:none;border-radius:12px;margin:12px 0;"></iframe>';
    }
    var titleFa = data.title_fa || data.title;
    var transBadge = data.title_fa ? '' : ' <span style="color:#fdcb6e;">به\u200cزودی با ترجمه فارسی</span>';
    var cr = data.copyright ? ' | \u00a9 ' + data.copyright : ' | \u00a9 ناسا';
    container.innerHTML = '<div class="nasa-card">' +
        '<h4 class="nasa-card-title">' + titleFa + '</h4>' +
        '<p style="color:#888;font-size:0.85rem;">' + data.title + transBadge + '</p>' +
        mediaHtml +
        '<p class="nasa-card-text">' + (data.explanation_fa || data.explanation) + '</p>' +
        '<div class="nasa-card-footer">\u{1f4c5} ' + data.date + cr + '</div>' +
        '</div>';
}

async function fetchNasaImages() {
    var query = document.getElementById('nasaImageQuery').value;
    if (!query) return;
    var div = document.getElementById('nasaImagesResult');
    div.innerHTML = '<div class="nasa-loading">\u23f3 در حال جستجو...</div>';
    try {
        var res = await fetch('/api/v5/nasa/images?query=' + encodeURIComponent(query));
        var data = await res.json();
        if (data.status === 'success') { displayNasaImages(data.data, div); }
        else { div.innerHTML = '<div class="nasa-error">\u274c ' + (data.detail || 'خطا') + '</div>'; }
    } catch(e) { div.innerHTML = '<div class="nasa-error">\u274c خطا در ارتباط با سرور</div>'; }
}

function displayNasaImages(data, container) {
    if (!data || !data.collection || !data.collection.items || data.collection.items.length === 0) {
        container.innerHTML = '<p style="color:#888;text-align:center;">نتیجه‌ای یافت نشد</p>';
        return;
    }
    var items = data.collection.items;
    var totalHits = (data.collection.metadata && data.collection.metadata.total_hits) || items.length;
    var html = '<p style="color:#888;margin-bottom:12px;">' + totalHits + ' نتیجه</p><div class="nasa-grid">';
    items.forEach(function(item) {
        var imgSrc = '';
        var imgTitle = '';
        if (item.data && item.data.length > 0) {
            imgTitle = item.data[0].title || '';
        }
        if (item.links && item.links.length > 0) {
            var preview = null;
            for (var i = 0; i < item.links.length; i++) {
                if (item.links[i].rel === 'preview' && item.links[i].href) {
                    preview = item.links[i];
                    break;
                }
            }
            if (preview) imgSrc = preview.href;
            else if (item.links[0].href) imgSrc = item.links[0].href;
        }
        var imgHtml = imgSrc ? '<img src="' + imgSrc + '" alt="' + imgTitle + '" loading="lazy" style="width:100%;border-radius:8px;">' : '';
        html += '<div class="nasa-grid-item">' + imgHtml +
            '<p style="font-size:0.8rem;color:#ddd;margin:6px 0 0;">' + imgTitle + '</p>';
        if (item.data && item.data[0] && item.data[0].description) {
            html += '<p style="font-size:0.7rem;color:#999;margin:2px 0 0;line-height:1.4;">' + item.data[0].description.substring(0, 120) + '...</p>';
        }
        html += '</div>';
    });
    html += '</div>';
    container.innerHTML = html;
}

async function fetchNasaSpaceWeather() {
    // از date-picker شمسی می‌خواند و به میلادیِ ISO تبدیل می‌کند
    var sEl = document.getElementById('nasaWeatherStartDP_hidden');
    var eEl = document.getElementById('nasaWeatherEndDP_hidden');
    var start = sEl ? (window.isoShamsiToGregorianISO ? window.isoShamsiToGregorianISO(sEl.value) : sEl.value) : '';
    var end = eEl ? (window.isoShamsiToGregorianISO ? window.isoShamsiToGregorianISO(eEl.value) : eEl.value) : '';
    if (!start) { alert('تاریخ شروع را انتخاب کنید'); return; }
    var div = document.getElementById('nasaWeatherResult');
    div.innerHTML = '<div class="nasa-loading">\u23f3 در حال دریافت اطلاعات...</div>';
    try {
        var url = '/api/v5/nasa/space-weather?startDate=' + start;
        if (end) url += '&endDate=' + end;
        var res = await fetch(url);
        var data = await res.json();
        if (data.status === 'success') { displayNasaSpaceWeather(data.data, div); }
        else { div.innerHTML = '<div class="nasa-error">\u274c ' + (data.detail || 'خطا') + '</div>'; }
    } catch(e) { div.innerHTML = '<div class="nasa-error">\u274c خطا در ارتباط با سرور</div>'; }
}

function displayNasaSpaceWeather(data, container) {
    // Backend returns DONKI/FLR array directly (not wrapped in {events:...})
    var events = Array.isArray(data) ? data : (data.events || []);
    if (events.length === 0) {
        container.innerHTML = '<div class="nasa-card"><p style="color:#888;text-align:center;">\u2705 رویداد خورشیدی ثبت نشد — فضا آرام است</p></div>';
        return;
    }
    var html = '<div class="nasa-card"><h4 class="nasa-card-title">\u2600\ufe0f ' + (data.type_fa || 'پرتوهای خورشیدی') + '</h4>' +
        '<p style="color:#888;font-size:0.85rem;">' + events.length + ' رویداد ثبت شده</p>';
    html += '<div style="max-height:400px;overflow-y:auto;margin-top:12px;">';
    events.slice(0, 30).forEach(function(ev) {
        var classType = ev.classType || ev.class_type || '?';
        var source = ev.sourceLocation || ev.source_location || '';
        var peak = ev.peakTime || ev.peak_time || '';
        var begin = ev.beginTime || ev.begin_time || '';
        var instruments = (ev.instruments || []).map(function(i) { return i.displayName || i.display_name || ''; }).join(', ');
        var color = classType.startsWith('X') ? '#ff6b6b' : classType.startsWith('M') ? '#fdcb6e' : '#51cf66';
        html += '<div style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;">' +
            '<span style="color:' + color + ';font-weight:bold;font-size:1.1rem;">' + classType + '</span>' +
            '<span style="color:#666;font-size:0.75rem;">' + (peak ? new Date(peak).toLocaleString('fa-IR') : '') + '</span>' +
            '</div>' +
            (source ? '<div style="color:#aaa;font-size:0.85rem;margin-top:2px;">\ud83d\udccd ' + source + '</div>' : '') +
            (instruments ? '<div style="color:#666;font-size:0.75rem;margin-top:2px;">\ud83d\udcf1 ' + instruments + '</div>' : '') +
            '</div>';
    });
    html += '</div></div>';
    container.innerHTML = html;
}

async function fetchNasaAsteroids() {
    var sEl = document.getElementById('nasaNeoStartDP_hidden');
    var eEl = document.getElementById('nasaNeoEndDP_hidden');
    var start = sEl ? (window.isoShamsiToGregorianISO ? window.isoShamsiToGregorianISO(sEl.value) : sEl.value) : '';
    var end = eEl ? (window.isoShamsiToGregorianISO ? window.isoShamsiToGregorianISO(eEl.value) : eEl.value) : '';
    if (!start) { alert('تاریخ شروع را انتخاب کنید'); return; }
    var div = document.getElementById('nasaNeoResult');
    div.innerHTML = '<div class="nasa-loading">\u23f3 در حال دریافت اطلاعات سیارک‌ها...</div>';
    try {
        var url = '/api/v5/nasa/asteroids?startDate=' + start;
        if (end) url += '&endDate=' + end;
        var res = await fetch(url);
        var data = await res.json();
        if (data.status === 'success') { displayNasaAsteroids(data.data, div); }
        else { div.innerHTML = '<div class="nasa-error">\u274c ' + (data.detail || 'خطا') + '</div>'; }
    } catch(e) { div.innerHTML = '<div class="nasa-error">\u274c خطا در ارتباط با سرور</div>'; }
}

function displayNasaAsteroids(data, container) {
    var byDate = data.asteroids_by_date || {};
    var totalCount = data.element_count || 0;
    var hazardousCount = data.hazardous_count || 0;
    if (totalCount === 0 && Object.keys(byDate).length === 0) {
        container.innerHTML = '<div class="nasa-card"><p style="color:#888;text-align:center;">سیراکی یافت نشد</p></div>';
        return;
    }
    var html = '<div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap;">';
    html += '<div style="background:rgba(253,203,110,0.08);border:1px solid rgba(253,203,110,0.2);border-radius:12px;padding:10px 20px;flex:1;text-align:center;">';
    html += '<div style="font-weight:700;font-size:1.4rem;color:#fdcb6e;">' + totalCount + '</div>';
    html += '<div style="color:#888;font-size:0.85rem;">سیراک</div></div>';
    html += '<div style="background:rgba(231,76,60,0.08);border:1px solid rgba(231,76,60,0.2);border-radius:12px;padding:10px 20px;flex:1;text-align:center;">';
    html += '<div style="font-weight:700;font-size:1.4rem;color:#e74c3c;">' + hazardousCount + '</div>';
    html += '<div style="color:#e74c3c;font-size:0.85rem;">⚠️ خطرناک</div></div>';
    html += '</div>';
    var sortedDates = Object.keys(byDate).sort();
    sortedDates.forEach(function(date) {
        var asteroids = byDate[date];
        if (!asteroids || asteroids.length === 0) return;
        html += '<div style="background:rgba(253,203,110,0.06);border:1px solid rgba(253,203,110,0.12);border-radius:12px;padding:10px 16px;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;">';
        html += '<span style="font-weight:700;color:#fdcb6e;">📅 ' + date + '</span>';
        html += '<span style="color:#888;font-size:0.85rem;">' + asteroids.length + ' \u0633\u06cc\u0631\u0627\u06a9</span>';
        html += '</div>';
        html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px;margin-bottom:20px;">';
        asteroids.slice(0, 10).forEach(function(a) {
            var isHazard = a.is_hazardous;
            var bgColor = isHazard ? 'rgba(231,76,60,0.06)' : 'rgba(108,92,231,0.04)';
            var borderColor = isHazard ? 'rgba(231,76,60,0.3)' : 'rgba(255,255,255,0.06)';
            var nameColor = isHazard ? '#ff6b6b' : '#fdcb6e';
            var badge = isHazard ? '<span style="background:#e74c3c;color:#fff;padding:2px 10px;border-radius:20px;font-size:0.7rem;">⚠️ خطرناک</span>' : '<span style="background:#2a5f7a;color:#fff;padding:2px 10px;border-radius:20px;font-size:0.7rem;">✅ بی خطر</span>';
            var avgDiam = ((a.diameter_min_m + a.diameter_max_m) / 2).toFixed(0);
            var missKm = a.miss_distance_km ? parseFloat(a.miss_distance_km) : 0;
            var missMillion = (missKm / 1e6).toFixed(2);
            var missMoon = missKm ? (missKm / 384400).toFixed(1) : '?';
            html += '<div style="background:' + bgColor + ';border:1px solid ' + borderColor + ';border-radius:14px;padding:14px;' + (isHazard ? 'border-top:3px solid #e74c3c;' : '') + '">';
            html += '<div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:6px;">';
            html += '<div style="font-weight:700;color:' + nameColor + ';flex:1;">' + a.name + '</div>';
            html += badge + '</div>';
            html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:10px 0;font-size:0.85rem;">';
            html += '<div><span style="color:#888;">📀 قطر:</span> <strong>~' + avgDiam + ' m</strong></div>';
            html += '<div><span style="color:#888;">💨 سرعت:</span> <strong>' + (a.velocity_km_s || '?') + ' km/s</strong></div>';
            html += '<div style="grid-column:span 2;"><span style="color:#888;">⬍ فاصله:</span> <strong>' + missMillion + ' میلیان کیلومتر)</strong> <span style="color:#666;font-size:0.75rem;">(~' + missMoon + ' ماه)</span></div>';
            html += '</div>';
            if (a.close_approach_date) {
                html += '<div style="font-size:0.75rem;color:#666;border-top:1px solid rgba(255,255,255,0.04);padding-top:6px;display:flex;justify-content:space-between;">';
                html += '<span>📅 نزدیک‌ترین: ' + a.close_approach_date + '</span>';
                if (a.nasa_jpl_url) html += '<a href="' + a.nasa_jpl_url + '" target="_blank" style="color:#85c1e9;text-decoration:none;">JPL</a>';
                html += '</div>';
            }
            html += '</div>';
        });
        html += '</div>';
    });
    container.innerHTML = html;
}

async function _removed_fetchNasaMarsWeather() {
    var div = document.getElementById('nasaMarsResult');
    div.innerHTML = '<div class="nasa-loading">\u23f3 در حال دریافت آب و هوای مریخ...</div>';
    try {
        var res = await fetch('/api/v5/nasa/mars-weather');
        var data = await res.json();
        if (data.status === 'success') { _removed_displayNasaMarsWeather(data.data, div); }
        else { div.innerHTML = '<div class="nasa-error">\u274c ' + (data.detail || 'خطا') + '</div>'; }
    } catch(e) { div.innerHTML = '<div class="nasa-error">\u274c خطا در ارتباط با سرور</div>'; }
}

function _removed_displayNasaMarsWeather(data, container) {
    if (!data.sols || data.sols.length === 0) {
        container.innerHTML = '<div class="nasa-card"><p style="color:#888;text-align:center;">' + (data.note_fa || 'داده‌ای موجود نیست') + '</p></div>';
        return;
    }
    var liveBadge = data.historical
        ? '<span style="background:rgba(225,112,85,0.2);padding:3px 12px;border-radius:20px;font-size:0.72rem;color:#e17055;">⏳ تاریخی</span>'
        : '<span style="background:rgba(0,184,148,0.18);padding:3px 12px;border-radius:20px;font-size:0.72rem;color:#00b894;">🟢 زنده</span>';
    var html = '<div class="nasa-card">';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:4px;">';
    html += '<h4 class="nasa-card-title" style="margin:0;">🔴 ' + (data.source_fa || 'آب و هوای مریخ') + '</h4>';
    html += liveBadge;
    html += '</div>';
    html += '<p style="color:#888;font-size:0.8rem;margin-bottom:12px;line-height:1.9;">' + (data.note_fa || '') + '</p>';
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px;">';
    data.sols.forEach(function(sol) {
        var t = sol.temperature || {};
        var w = sol.wind || {};
        var p = sol.pressure || {};
        var firstDate = sol.first_utc ? new Date(sol.first_utc) : null;
        var lastDate = sol.last_utc ? new Date(sol.last_utc) : null;
        var dateStr = firstDate && lastDate ? firstDate.toISOString().slice(0,10) + ' — ' + lastDate.toISOString().slice(0,10) : (sol.first_utc || '');
        html += '<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:14px;padding:16px;transition:transform 0.2s;">';
        html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">';
        html += '<span style="font-size:1.1rem;font-weight:700;color:#fdcb6e;">Sol ' + sol.sol + '</span>';
        html += '<span style="background:rgba(108,92,231,0.15);padding:3px 12px;border-radius:20px;font-size:0.8rem;color:#a29bfe;">' + (sol.season_fa || sol.season || '') + '</span>';
        html += '</div>';
        html += '<div style="display:flex;justify-content:space-around;text-align:center;margin:12px 0;">';
        html += '<div><div style="font-size:0.8rem;color:#888;">🌡️ میانگین</div><div style="font-weight:700;font-size:1.1rem;">' + (t.avg_c !== null && t.avg_c !== undefined ? t.avg_c.toFixed(1) : 'N/A') + '°C</div></div>';
        html += '<div><div style="font-size:0.8rem;color:#888;">❄️ حداقل</div><div style="font-weight:700;font-size:1.1rem;color:#85c1e9;">' + (t.min_c !== null && t.min_c !== undefined ? t.min_c.toFixed(1) : 'N/A') + '°C</div></div>';
        html += '<div><div style="font-size:0.8rem;color:#888;">🔥 حداکثر</div><div style="font-weight:700;font-size:1.1rem;color:#ff6b6b;">' + (t.max_c !== null && t.max_c !== undefined ? t.max_c.toFixed(1) : 'N/A') + '°C</div></div>';
        html += '</div>';
        html += '<div style="display:flex;justify-content:space-around;border-top:1px solid rgba(255,255,255,0.04);padding-top:10px;margin-top:8px;font-size:0.9rem;">';
        html += '<div><span style="color:#888;">🌬️ باد:</span> <strong>' + (w.speed_ms !== null && w.speed_ms !== undefined ? w.speed_ms.toFixed(1) : 'N/A') + ' m/s</strong></div>';
        html += '<div><span style="color:#888;">📊 فشار:</span> <strong>' + (p.avg_pa !== null && p.avg_pa !== undefined ? p.avg_pa.toFixed(0) : 'N/A') + ' Pa</strong></div>';
        html += '</div>';
        // تفسیر فارسی
        if (sol.interpretation_fa) {
            html += '<div style="margin-top:10px;padding:8px 12px;background:rgba(253,203,110,0.06);border-right:2px solid rgba(253,203,110,0.4);border-radius:8px;color:#ccc;font-size:0.8rem;line-height:1.9;">📜 ' + sol.interpretation_fa + '</div>';
        }
        if (dateStr) {
            html += '<div style="font-size:0.7rem;color:#555;margin-top:8px;text-align:left;direction:ltr;">' + dateStr + '</div>';
        }
        html += '</div>';
    });
    html += '</div></div>';
    container.innerHTML = html;
}




// ================================================================
// NASA PLANETS — موقعیت سیارات
// ================================================================
var _nasaSignColors = {
    'Aries': '#FF6B6B', 'Taurus': '#FF9F43', 'Gemini': '#FECA57',
    'Cancer': '#FF9FF3', 'Leo': '#F368E0', 'Virgo': '#54A0FF',
    'Libra': '#5F27CD', 'Scorpio': '#341F97', 'Sagittarius': '#00D2D3',
    'Capricorn': '#01A3A4', 'Aquarius': '#10AC84', 'Pisces': '#EE5A24'
};
var _nasaSignShort = {
    'Aries': '\u2648', 'Taurus': '\u2649', 'Gemini': '\u264a',
    'Cancer': '\u264b', 'Leo': '\u264c', 'Virgo': '\u264d',
    'Libra': '\u264e', 'Scorpio': '\u264f', 'Sagittarius': '\u2650',
    'Capricorn': '\u2651', 'Aquarius': '\u2652', 'Pisces': '\u2653'
};
var _nasaPlanetEmoji = {
    'Sun': '\u2600\ufe0f', 'Moon': '\ud83c\udf19', 'Mercury': '\u263f\ufe0f',
    'Venus': '\u2640\ufe0f', 'Mars': '\u2642\ufe0f',
    'Jupiter': '\u2643\ufe0f', 'Saturn': '\u2644\ufe0f',
    'Uranus': '\u2645\ufe0f', 'Neptune': '\u2646\ufe0f', 'Pluto': '\u2647\ufe0f'
};

async function fetchNasaPlanets() {
    var dEl = document.getElementById('nasaPlanetsDateDP_hidden');
    var date = dEl ? (window.isoShamsiToGregorianISO ? window.isoShamsiToGregorianISO(dEl.value) : dEl.value) : '';
    if (!date) { alert('تاریخ را انتخاب کنید'); return; }
    var div = document.getElementById('nasaPlanetsResult');
    div.innerHTML = '<div class="nasa-loading">\u23f3 در حال دریافت موقعیت سیارات...</div>';
    try {
        var res = await fetch('/api/v5/nasa/planets?date=' + date);
        var data = await res.json();
        if (data.status === 'success') { displayNasaPlanets(data.data, div); }
        else { div.innerHTML = '<div class="nasa-error">\u274c ' + (data.detail || data.error || 'خطا') + '</div>'; }
    } catch(e) { div.innerHTML = '<div class="nasa-error">\u274c خطا در ارتباط با سرور</div>'; }
}

function displayNasaPlanets(data, container) {
    if (!data || !data.planets) {
        container.innerHTML = '<div class="nasa-card"><p style="color:#888;text-align:center;">داده‌ای موجود نیست</p></div>';
        return;
    }
    var planets = data.planets;
    var planetNames = Object.keys(planets);

    var html = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;margin-bottom:20px;">';
    planetNames.forEach(function(name) {
        var p = planets[name];
        var emoji = _nasaPlanetEmoji[name] || '\u2b50';
        var isRetro = p.retrograde || false;
        var signColor = _nasaSignColors[p.sign] || '#f1c40f';
        html += '<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:14px;padding:14px;text-align:center;transition:transform 0.2s;">';
        html += '<div style="font-size:2rem;margin-bottom:4px;">' + emoji + '</div>';
        html += '<div style="font-weight:700;color:#fdcb6e;font-size:1rem;">' + name + '</div>';
        html += '<div style="margin-top:6px;"><span style="background:' + signColor + '22;color:' + signColor + ';padding:2px 10px;border-radius:20px;font-size:0.75rem;font-weight:700;">' + (p.sign || '') + '</span> — ' + (p.degree_in_sign ? p.degree_in_sign.toFixed(2) : '?') + '\u00b0</div>';
        html += '<div style="color:#888;font-size:0.8rem;margin-top:4px;">\u0637\u0648\u0644: ' + (p.longitude ? p.longitude.toFixed(2) : '?') + '\u00b0</div>';
        html += '<div style="margin-top:6px;font-size:0.8rem;color:' + (isRetro ? '#ff6b6b' : '#51cf66') + ';font-weight:700;">' + (isRetro ? '\ud83d\udd34 \u0628\u0627\u0632\u06af\u0634\u062a\u06cc' : '\ud83d\udfe2 \u0645\u0633\u062a\u0642\u06cc\u0645') + '</div>';
        html += '</div>';
    });
    html += '</div>';

    // ===== Circular SVG Chart =====
    var size = 700, center = size / 2, outerR = 280, innerR = 60, labelR = 305, planetR = outerR - 20;
    var svg = '<svg width="100%" viewBox="0 0 ' + size + ' ' + size + '" xmlns="http://www.w3.org/2000/svg" style="background:radial-gradient(circle at center,#0f1628,#0a0e1a);border-radius:20px;max-width:700px;margin:0 auto;display:block;">';

    // Outer circles
    svg += '<circle cx="' + center + '" cy="' + center + '" r="' + (outerR+10) + '" fill="none" stroke="#1a2a4a" stroke-width="1" opacity="0.3"/>';
    svg += '<circle cx="' + center + '" cy="' + center + '" r="' + outerR + '" fill="none" stroke="#2a4060" stroke-width="2"/>';
    svg += '<circle cx="' + center + '" cy="' + center + '" r="' + innerR + '" fill="none" stroke="#2a4060" stroke-width="1" stroke-dasharray="4,4"/>';

    // Radial lines for each sign
    var signNames = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
    signNames.forEach(function(sign, i) {
        var angle = (i * 30) * Math.PI / 180;
        var x1 = center + innerR * Math.sin(angle);
        var y1 = center - innerR * Math.cos(angle);
        var x2 = center + outerR * Math.sin(angle);
        var y2 = center - outerR * Math.cos(angle);
        svg += '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="#1f2f4a" stroke-width="1.5"/>';
    });

    // Sign labels
    signNames.forEach(function(sign, i) {
        var angle = (i * 30 + 15) * Math.PI / 180;
        var x = center + labelR * Math.sin(angle);
        var y = center - labelR * Math.cos(angle);
        var color = _nasaSignColors[sign] || '#aabbdd';
        var short = _nasaSignShort[sign] || sign;
        svg += '<text x="' + x + '" y="' + y + '" fill="' + color + '" font-size="18" font-weight="bold" text-anchor="middle" dominant-baseline="middle" font-family="Vazirmatn, sans-serif">' + short + '</text>';
    });

    // Planet dots with glow
    planetNames.forEach(function(name) {
        var p = planets[name];
        var lon = p.longitude || 0;
        var angle = lon * Math.PI / 180;
        var dist = planetR - 10;
        var x = center + dist * Math.sin(angle);
        var y = center - dist * Math.cos(angle);
        var color = _nasaSignColors[p.sign] || '#f1c40f';
        svg += '<circle cx="' + x + '" cy="' + y + '" r="14" fill="' + color + '" opacity="0.2"/>';
        svg += '<circle cx="' + x + '" cy="' + y + '" r="10" fill="' + color + '" opacity="0.5"/>';
        svg += '<circle cx="' + x + '" cy="' + y + '" r="6" fill="#fff" stroke="' + color + '" stroke-width="2"/>';
        svg += '<text x="' + (x + 20) + '" y="' + (y - 20) + '" fill="#e0e8f0" font-size="12" font-weight="bold" text-anchor="start" dominant-baseline="middle" font-family="Vazirmatn, sans-serif">' + name + '</text>';
    });

    // Center sun
    svg += '<circle cx="' + center + '" cy="' + center + '" r="20" fill="#f39c12" opacity="0.8"/>';
    svg += '<text x="' + center + '" y="' + center + '" fill="#0b0e1a" font-size="16" font-weight="bold" text-anchor="middle" dominant-baseline="middle">\u2600</text>';
    svg += '</svg>';

    html += '<div style="background:rgba(108,92,231,0.04);border:1px solid rgba(255,255,255,0.06);border-radius:20px;padding:20px;margin-top:16px;">';
    html += '<h4 style="color:#fdcb6e;text-align:center;margin-bottom:12px;">\ud83c\udf0f \u0646\u0645\u0648\u062f\u0627\u0631 \u0645\u0648\u0642\u0639\u06cc\u062a \u0633\u06cc\u0627\u0631\u062a\u0627\u062f\u0631 \u062f\u0631 \u0645\u0646\u0637\u0642\u0647\u200c\u0627\u0644\u0628\u0631\u0648\u062c</h4>';
    html += svg;
    html += '</div>';

    container.innerHTML = html;
}


function getHafezForm() {
    return `
        <div style="max-width:820px;margin:0 auto;">
            <!-- سربرگِ کتاب خطی -->
            <div style="text-align:center;margin-bottom:20px;">
                <div style="display:inline-flex;align-items:center;gap:14px;">
                    <span style="width:60px;height:1px;background:linear-gradient(90deg,transparent,#c9a227);"></span>
                    <span style="font-size:2rem;filter:drop-shadow(0 0 10px rgba(201,162,39,0.4));">📜</span>
                    <span style="width:60px;height:1px;background:linear-gradient(270deg,transparent,#c9a227);"></span>
                </div>
                <h3 style="font-family:'Reem Kufi','Vazirmatn',sans-serif;color:#ecd9a0;margin:8px 0 4px;font-size:1.5rem;letter-spacing:0.05em;">فالِ حافظ</h3>
                <p style="color:#8a82a0;font-size:0.85rem;margin:0;">نیت کن، سؤالِ دل را بنویس، و بر دیوانِ خواجه تفأل بزن</p>
            </div>

            <div style="background:linear-gradient(160deg,rgba(37,53,107,0.35),rgba(10,15,35,0.85));border:1px solid rgba(201,162,39,0.3);border-radius:20px;padding:24px;box-shadow:0 16px 50px rgba(0,0,0,0.5);">
                <div class="form-group" style="margin-bottom:14px;">
                    <label style="color:#b8aec8;font-size:0.85rem;">❓ نیت و سؤال شما (اختیاری — عشق، کار، سفر...)</label>
                    <input id="hafezQuestion" type="text" placeholder="مثلاً: آیا در کارم موفق می‌شوم؟" style="width:100%;padding:13px 16px;border-radius:12px;background:rgba(0,0,0,0.35);color:#fff;border:1px solid rgba(201,162,39,0.25);font-size:14px;font-family:inherit;">
                </div>
                <button class="btn-primary" onclick="submitHafez()" style="background:linear-gradient(180deg,#ecd9a0,#c9a227 60%,#a8812a);color:#070c1f;font-weight:800;">📜 تفأل بزن</button>
                <div id="hafezResult" style="margin-top:18px;"></div>
            </div>
        </div>
    `;
}

async function submitHafez() {
    const question = document.getElementById('hafezQuestion').value.trim();
    const resultDiv = document.getElementById('hafezResult');
    // انیمیشن ورق‌زدن
    resultDiv.innerHTML = `
        <div style="text-align:center;padding:40px 20px;">
            <div style="font-size:3rem;animation:hafezShuffle 1s ease infinite;">📜</div>
            <p style="color:#c9a227;font-family:'Reem Kufi','Vazirmatn',sans-serif;margin-top:12px;">دیوان می‌گشاییم...</p>
        </div>`;
    try {
        const res = await fetch('/api/v5/hafez', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question: question || null })
        });
        const data = await res.json();
        if (data.status === 'success') {
            displayHafez(data.data, resultDiv);
        } else {
            resultDiv.innerHTML = `<p style="color:#ff6b6b;">❌ ${data.detail || 'خطا'}</p>`;
        }
    } catch(e) {
        resultDiv.innerHTML = '<p style="color:#ff6b6b;">❌ خطا در ارتباط با سرور</p>';
    }
}

function displayHafez(data, container) {
    const faal = data.faal || {};

    const html = `
    <div style="animation:hafezOpen .7s ease-out;">
        <div style="background:linear-gradient(155deg,#1a1230 0%,#0f0b1e 60%,#141028 100%);border:2px solid rgba(201,162,39,0.45);border-radius:18px;overflow:hidden;box-shadow:0 24px 70px rgba(0,0,0,0.65),inset 0 0 0 1px rgba(201,162,39,0.15);">
            <div style="text-align:center;padding:18px 20px 12px;background:linear-gradient(180deg,rgba(201,162,39,0.12),transparent);border-bottom:1px solid rgba(201,162,39,0.25);">
                <div style="font-family:'Reem Kufi','Vazirmatn',sans-serif;font-size:1.25rem;color:#ecd9a0;letter-spacing:0.06em;">📜 فالِ حافظ</div>
                ${data.metadata && data.metadata.ghazal_number_fa ? `<div style="color:#8a82a0;font-size:0.8rem;margin-top:4px;">غزلِ ${data.metadata.ghazal_number_fa} · ${faal.tone || ''}</div>` : ''}
            </div>

            <div style="padding:24px 26px;">
                ${data.question ? `<div style="color:#c9a227;font-style:italic;margin-bottom:16px;font-size:0.9rem;text-align:center;border-bottom:1px dashed rgba(201,162,39,0.25);padding-bottom:12px;">«${data.question}»</div>` : ''}

                ${faal.theme_title ? `<div style="text-align:center;margin-bottom:14px;"><span style="display:inline-block;background:rgba(201,162,39,0.14);border:1px solid rgba(201,162,39,0.35);padding:6px 20px;border-radius:20px;color:#ecd9a0;font-size:0.95rem;font-weight:700;">${faal.theme_title}</span></div>` : ''}

                <!-- شعر — دوستونه به سبکِ نسخه -->
                ${data.poem ? `<div style="background:rgba(0,0,0,0.25);border-radius:12px;padding:18px 14px;margin-bottom:16px;">
                    ${data.poem.split('\n').filter(l=>l.trim()).reduce(function(rows, line, i, arr) {
                        if (i % 2 === 0) rows.push([line, arr[i+1] || '']);
                        return rows;
                    }, []).map(function(pair) {
                        return `<div style="display:flex;justify-content:center;gap:18px;margin:7px 0;">` +
                            `<span style="flex:1;text-align:center;color:#e8dfc8;font-size:1.02rem;line-height:2.1;font-family:'Vazirmatn',serif;">${pair[0]}</span>` +
                            (pair[1] ? `<span style="flex:1;text-align:center;color:#e8dfc8;font-size:1.02rem;line-height:2.1;">${pair[1]}</span>` : `<span style="flex:1;"></span>`) +
                        `</div>`;
                    }).join('')}
                </div>` : ''}

                <!-- تعبیر -->
                ${faal.omen ? `<div style="margin:16px 0;padding:16px 18px;background:rgba(162,155,254,0.06);border-right:3px solid rgba(201,162,39,0.5);border-radius:12px;">
                    <div style="color:#ecd9a0;font-weight:800;font-size:0.9rem;margin-bottom:6px;">🔮 پیامِ فال</div>
                    <div style="color:#ddd;line-height:2.1;font-size:0.92rem;">${faal.omen}</div>
                </div>` : ''}

                ${faal.question_specific ? `<div style="margin:12px 0;padding:14px 18px;background:rgba(201,162,39,0.08);border-right:3px solid rgba(201,162,39,0.5);border-radius:12px;line-height:2.1;color:#e8dfc8;font-size:0.9rem;">
                    <b style="color:#fdcb6e;">🎯 در پاسخِ نیتِ شما:</b><br>${faal.question_specific}</div>` : ''}

                ${faal.advice ? `<div style="margin:12px 0;padding:14px 18px;background:rgba(46,204,113,0.06);border-right:3px solid rgba(46,204,113,0.45);border-radius:12px;line-height:2.1;color:#ccc;font-size:0.88rem;">
                    <b style="color:#2ecc71;">🕯️ مشورتِ حافظ:</b> ${faal.advice}</div>` : ''}

                <!-- پانوشت -->
                <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-top:18px;padding-top:12px;border-top:1px dashed rgba(201,162,39,0.25);color:#777;font-size:0.75rem;">
                    <span>${data.metadata && data.metadata.title ? '📖 ' + data.metadata.title : ''}</span>
                    <span>${data.metadata && data.metadata.source ? '📚 ' + data.metadata.source : ''}</span>
                </div>
            </div>
        </div>
        <div style="text-align:center;margin-top:14px;">
            <button class="btn-secondary" onclick="submitHafez()" style="max-width:280px;">📜 تفألِ دیگر</button>
        </div>
    </div>`;
    container.innerHTML = html;
}

// ================================================================
// DAILY QUESTION (پرسش روزانه)
// ================================================================

function getDailyQuestionForm() {
    return `
        <div class="daily-question-form">
            <h3>${window.uiIcon('daily-question', 18)} پرسش روزانه — پاسخ از ۳ موتور</h3>
            <p style="color:#8a82a0;text-align:center;font-size:13px;margin-bottom:16px;">سوال خود را بنویسید و پاسخ ترکیبی از بیوریتم، سال حیوانی و تاروت دریافت کنید</p>
            
            <div style="background:rgba(255,255,255,0.03);border-radius:16px;padding:20px;border:1px solid rgba(255,255,255,0.05);">
                <div class="form-group" style="margin-bottom:12px;">
                    <label style="color:#b8aec8;">❓ سوال شما</label>
                    <input id="dqQuestion" type="text" placeholder="مثلاً: آیا امروز برای سفر خوب است؟" style="width:100%;padding:12px;border-radius:10px;background:rgba(0,0,0,0.3);color:#fff;border:1px solid rgba(255,255,255,0.1);font-size:14px;font-family:inherit;">
                </div>
                <div class="form-group">
                    <label style="color:#b8aec8;">📅 تاریخ تولد</label>
                    ${makeDatePickerTrigger('dqDatePicker', {label:'تاریخ تولد', calendarType:'shamsi', digits:'fa'})}
                </div>
                <button class="btn-primary" onclick="submitDailyQuestion()">${window.uiIcon('star')} دریافت پاسخ</button>
                <div id="dqResult" style="margin-top:16px;"></div>
            </div>
        </div>
    `;
}

async function submitDailyQuestion() {
    const question = document.getElementById('dqQuestion').value.trim();
    const dqHidden = document.getElementById('dqDatePicker_hidden');
    /* hidden شمسی ISO است — بک‌اند میلادی می‌خواهد؛ مثل بقیه‌ی سرویس‌ها تبدیل شود */
    const birthDate = dqHidden && dqHidden.value ? isoShamsiToGregorian(dqHidden.value) : '';
    const birthYear = birthDate ? parseInt(birthDate.split('-')[0]) : 0;
    const resultDiv = document.getElementById('dqResult');
    
    if (!question) {
        resultDiv.innerHTML = '<p style="color:#ff6b6b;">❌ لطفاً سوال خود را بنویسید</p>';
        return;
    }
    if (!birthDate || !birthYear) {
        resultDiv.innerHTML = '<p style="color:#ff6b6b;">❌ لطفاً تاریخ تولد را وارد کنید</p>';
        return;
    }
    if (birthYear < 1279) {
        resultDiv.innerHTML = '<p style="color:#e74c3c;">❌ مردگان ستاره‌ای در چارت ندارند 🌌</p>';
        return;
    }
    
    resultDiv.innerHTML = makeShimmerLoading('⏳ در حال دریافت پاسخ از ۳ موتور...');
    
    try {
        const res = await fetch('/api/v5/daily-question', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question, birth_date: birthDate, birth_year: birthYear })
        });
        const data = await res.json();
        if (data.status === 'success') {
            displayDailyQuestion(data.data, resultDiv);
        } else {
            resultDiv.innerHTML = `<p style="color:#ff6b6b;">❌ ${data.detail || 'خطا'}</p>`;
        }
    } catch(e) {
        resultDiv.innerHTML = '<p style="color:#ff6b6b;">❌ خطا در ارتباط با سرور</p>';
    }
}

function displayDailyQuestion(data, container) {
    // Engine returns raw (biorhythm/zodiac/tarot) and sections (structured)
    const raw = data.raw || {};
    const sections = data.sections || [];
    const tarotRaw = raw.tarot || {};
    const card = tarotRaw.card || {};
    const isReversed = tarotRaw.is_reversed || false;
    const imgUrl = card.image || '/static/tarot/images/card-back.svg';
    
    let html = '<div class="daily-question-result">';
    html += '<h4 style="color:#fdcb6e;margin-bottom:8px;">📝 سوال: ' + (data.question || '') + '</h4>';
    html += '<div style="color:#8a82a0;font-size:12px;margin-bottom:12px;">📅 ' + (data.date || '') + '</div>';
    
    // Tarot card with flip animation
    html += '<div style="display:flex;gap:16px;align-items:flex-start;margin-bottom:16px;flex-wrap:wrap;">';
    html += '<div class="tarot-flip-container auto-flip" onclick="this.classList.toggle(\"auto-flip\");this.classList.toggle(\"flipped\");" title="کلیک کنید تا کارت برگرد">' + '<div class="tarot-flip-inner">' + '<div class="tarot-flip-front"><div class="card-back-pattern">🌟</div></div>' + '<div class="tarot-flip-back"><img src="' + imgUrl + '" class="' + (isReversed ? 'reversed' : '') + '" alt="' + (card.name || '') + '" onerror="this.src=\'/static/tarot/images/card-back.svg\'"></div>' + '</div>' + '<span class="flip-hint">کلیک کنید</span>' + '</div>';
    html += '<div style="flex:1;min-width:200px;">';
    html += '<div style="color:#a29bfe;font-weight:bold;font-size:15px;margin-bottom:8px;">🃏 کارت راهنما: ' + (card.name || 'ناشناس') + '</div>';
    html += '<div style="color:#aaa;font-size:13px;">' + (isReversed ? '🔄 وارونه' : '⬆️ راست') + '</div>';
    html += '</div></div>';
    
    // Render structured sections from engine
    if (sections.length > 0) {
        sections.forEach(function(sec) {
            html += '<div style="margin-bottom:14px;padding:14px;background:rgba(255,255,255,0.03);border-radius:12px;border:1px solid rgba(255,255,255,0.05);">';
            html += '<div style="color:#fdcb6e;font-weight:bold;margin-bottom:8px;">' + (sec.icon || '') + ' ' + (sec.title || '') + '</div>';
            if (sec.type === 'biorhythm' && sec.data) {
                var d = sec.data;
                html += '<div style="color:#ddd;line-height:2;">';
                html += '💪 فیزیکی: ' + d.physical + '<br>';
                html += '❤️ عاطفی: ' + d.emotional + '<br>';
                html += '🧠 ذهنی: ' + d.intellectual + '<br>';
                html += '<span style="color:' + (d.color || '#fdcb6e') + ';font-weight:bold;">کل: ' + d.overall + '</span>';
                html += '</div>';
            } else if (sec.type === 'zodiac' && sec.data) {
                var zd = sec.data;
                html += '<div style="color:#ddd;line-height:2;">';
                html += (zd.emoji || '') + ' سال ' + zd.element + ' ' + zd.animal + '<br>';
                html += '📝 ' + zd.personality + '<br>';
                if (zd.compatibility) html += '💕 ' + zd.compatibility + '<br>';
                html += '<span style="color:#888;font-size:0.85rem;">' + zd.description + '</span>';
                html += '</div>';
            } else if (sec.type === 'tarot' && sec.data) {
                var td = sec.data;
                html += '<div style="color:#ddd;line-height:2;">';
                html += '<strong>' + td.name + '</strong> (' + td.direction + ')<br>';
                html += td.meaning + '<br>';
                if (td.keywords) html += '<span style="color:#888;font-size:0.85rem;">کلمات کلیدی: ' + td.keywords + '</span>';
                html += '</div>';
            } else if (sec.type === 'summary' && sec.data) {
                var sd = sec.data;
                html += '<div style="color:#ddd;line-height:2.2;">' + (sd.text || '').replace(/\n/g, '<br>') + '</div>';
                html += '<div style="margin-top:8px;color:#a29bfe;font-size:0.85rem;">🟡 سطح: ' + sd.energy_level + ' | 📝 حوزه: ' + sd.topic + '</div>';
            }
            html += '</div>';
        });
    }
    
    html += '</div>';
    container.innerHTML = html;
}

// ================================================================
//  BIRTH PROFILE SYNC — save/prefill birth data for logged-in users
//  (persisted server-side via /api/v5/user/profile; guests fall back
//   to localStorage so at least the form survives reloads)
// ================================================================

var _profileSaveInFlight = false;
var _lastProfileSavedSig = null; // فینگرپرینت آخرین ذخیره موفق — برای جلوگیری از توست تکراری

function _profileToken() {
    try { return localStorage.getItem('cosmic_token') || ''; } catch (_) { return ''; }
}

function _gregorianBirth() {
    var bd = sharedInputs.birthDate;
    if (!bd || !bd.year) return null;
    // sharedInputs.birthDate holds the picked calendar values (default shamsi)
    var y = bd.year, m = bd.month, d = bd.day;
    if (y >= 1300 && y <= 1600 && window.shamsiToGregorianDate) {
        var g = window.shamsiToGregorianDate(y, m, d);
        if (g) { y = g.gy; m = g.gm; d = g.gd; }
    }
    return { year: y, month: m, day: d };
}

function saveProfileToServer() {
    var token = _profileToken();
    if (!token || _profileSaveInFlight) return;
    var g = _gregorianBirth();
    if (!g) return; // nothing to save yet
    var body = {
        name: sharedInputs.name || undefined,
        birth_year: g.year,
        birth_month: g.month,
        birth_day: g.day,
        birth_hour: sharedInputs.birthHour || 0,
        birth_minute: sharedInputs.birthMinute || 0,
        city: sharedInputs.city || undefined,
        latitude: sharedInputs.latitude,
        longitude: sharedInputs.longitude,
        timezone: TZ_OFFSET_TO_IANA[String(parseFloat(sharedInputs.timezone))] || undefined
    };
    _profileSaveInFlight = true;
    fetch('/api/v5/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify(body)
    }).then(function (r) {
        // تأیید کوچک — فقط وقتی وضعیت واقعاً تغییر کرده باشد (نه هر کلید)
        if (!r.ok) return;
        var sig = JSON.stringify(body);
        if (sig !== _lastProfileSavedSig) {
            _lastProfileSavedSig = sig;
            if (window.showToast) showToast('💾 اطلاعات تولد در حساب شما ذخیره شد', 'success');
        }
    }).catch(function () {}).finally(function () { _profileSaveInFlight = false; });
}

function persistSharedInputsLocal() {
    try {
        localStorage.setItem('cosmic_shared_inputs', JSON.stringify({
            name: sharedInputs.name,
            birthDate: sharedInputs.birthDate,
            birthHour: sharedInputs.birthHour,
            birthMinute: sharedInputs.birthMinute,
            city: sharedInputs.city,
            latitude: sharedInputs.latitude,
            longitude: sharedInputs.longitude,
            timezone: sharedInputs.timezone
        }));
    } catch (_) {}
}

function loadLocalSharedInputs() {
    try {
        var saved = JSON.parse(localStorage.getItem('cosmic_shared_inputs') || 'null');
        if (!saved) return;
        ['name', 'birthDate', 'birthHour', 'birthMinute', 'city', 'latitude', 'longitude', 'timezone'].forEach(function (k) {
            if (saved[k] !== undefined && saved[k] !== null && saved[k] !== '') sharedInputs[k] = saved[k];
        });
    } catch (_) {}
}


/* ── Biorhythm: profile-first helpers ──
   Returns the logged-in user's registered birth date (gregorian y-m-d)
   or null. Never mutates the profile. */
function getProfileBirthISO() {
    try {
        var p = JSON.parse(localStorage.getItem('cosmic_profile') || 'null');
        if (p && p.birth_year && p.birth_month && p.birth_day) {
            return p.birth_year + '-' + String(p.birth_month).padStart(2,'0') + '-' + String(p.birth_day).padStart(2,'0');
        }
    } catch (e) {}
    // fall back to sharedInputs if it was already persisted to the server
    var g = _gregorianBirth ? _gregorianBirth() : null;
    return g || null;
}

function isProfileBirthRegistered() {
    return !!getProfileBirthISO();
}

/* store profile into localStorage cache when prefill runs so getProfileBirthISO works offline */
function cacheProfileBirth(p) {
    try { localStorage.setItem('cosmic_profile', JSON.stringify(p)); } catch (e) {}
}

function prefillProfileFromServer() {
    var token = _profileToken();
    if (!token) return;
    fetch('/api/v5/user/profile', { headers: { 'Authorization': 'Bearer ' + token } })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (p) {
            if (!p || !p.birth_year) return;
            cacheProfileBirth(p);
            /* ⚑ تاریخِ سرور برنده است (تصمیم ۲۰۲۶-۰۹-۱۶): پیش‌فرضِ ۱۳۸۰ picker
               روی تاریخِ ثبت‌شده غلبه نمی‌کند. فقط اگر کاربر همین نشست تاریخِ
               متفاوتی دستي زده باشد (نشانِه: فرم با مقدارِ غیرپیش‌فرض پر شده)،
               بهش دست نمی‌زنیم. */
            var cur = sharedInputs.birthDate;
            var isDefault = !cur || !cur.year || (cur.year === 1380 && cur.month === 1 && cur.day === 1);
            var sameAsProfile = cur && String(cur.year) === String(p.birth_year) && cur.month === (p.birth_month || 1) && cur.day === (p.birth_day || 1);
            var serverDate = { year: p.birth_year, month: p.birth_month || 1, day: p.birth_day || 1 };
            var local = (function () { try { return JSON.parse(localStorage.getItem('cosmic_shared_inputs') || 'null'); } catch (_) { return null; } })();
            var localDate = local && local.birthDate;
            var localEdited = localDate && !(localDate.year === 1380 && localDate.month === 1 && localDate.day === 1);
            if (isDefault && !sameAsProfile && !localEdited) {
                sharedInputs.birthDate = serverDate;
                persistSharedInputsLocal();
                if (formContainer && formContainer.innerHTML.trim() !== '') applySharedInputs();
            }
            if (p.name && !sharedInputs.name) sharedInputs.name = p.name;
            if (p.city && !sharedInputs.city) sharedInputs.city = p.city;
            if (typeof p.latitude === 'number') sharedInputs.latitude = p.latitude;
            if (typeof p.longitude === 'number') sharedInputs.longitude = p.longitude;
            if (p.timezone) {
                // Map IANA back to the select's offset value
                var keys = Object.keys(TZ_OFFSET_TO_IANA || {});
                for (var i = 0; i < keys.length; i++) {
                    if (TZ_OFFSET_TO_IANA[keys[i]] === p.timezone) { sharedInputs.timezone = keys[i]; break; }
                }
            }
            persistSharedInputsLocal();
            if (formContainer && formContainer.innerHTML.trim() !== '') applySharedInputs();
            tryAutoBirthChart();   // تاریخِ سرور تازه اعمال شد → محاسبهٔ خودکار
        })
        .catch(function () {});
}

// ================================================================
window.addEventListener('DOMContentLoaded', function() {
    // Build initial birth form
    if (formBuilders && formBuilders['birth']) {
        formContainer.innerHTML = formBuilders['birth']();
        attachCityAutocomplete();
        reattachMapButton();
        attachDatePickerTriggers('birth');
        attachSharedInputListeners();
    }
    // Map modal close/confirm listeners (static elements in HTML)
    if (closeMapBtn) closeMapBtn.addEventListener('click', function() { mapModal.classList.remove('active'); });
    if (confirmLocationBtn) confirmLocationBtn.addEventListener('click', function() { mapModal.classList.remove('active'); syncSharedInputsFromForm(); });
    if (mapModal) mapModal.addEventListener('click', function(e) { if (e.target === mapModal) mapModal.classList.remove('active'); });

    // Set default date to 20 years ago
    var today = new Date();
    var y = today.getFullYear() - 20;
    var m = String(today.getMonth() + 1).padStart(2, '0');
    var d = String(today.getDate()).padStart(2, '0');
    var bd = document.getElementById('birthDate');
    if (bd) bd.value = y + '-' + m + '-' + d;

    // Restore birth inputs from localStorage (guests) and then from the
    // server profile (logged-in users — server wins only if nothing picked yet)
    loadLocalSharedInputs();
    applySharedInputs();
    prefillProfileFromServer();

    // Initialize location bar
    updateLocationBar();
});