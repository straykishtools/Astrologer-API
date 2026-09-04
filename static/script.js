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
    'nasa': { title: 'ناسا', text: 'تصویر نجومی روز، تصاویر فضایی، آب و هوای فضا، سیارک‌ها و اطلاعات مریخ را مشاهده کنید.' },
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
// ─── Actions Dropdown ───
(function() {
    var menuBtn = document.getElementById('actionsMenuBtn');
    var menu = document.getElementById('actionsMenu');
    if (menuBtn && menu) {
        menuBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            menu.classList.toggle('open');
        });
        document.addEventListener('click', function(e) {
            if (!menu.contains(e.target) && e.target !== menuBtn) {
                menu.classList.remove('open');
            }
        });
        menu.querySelectorAll('.topbar-actions-item').forEach(function(item) {
            item.addEventListener('click', function() {
                menu.classList.remove('open');
            });
        });
    }
})();
// ─── Profile / Plans Dropdown ───
(function() {
    var trigger = document.getElementById('payBtn');
    var panel = document.getElementById('profilePanel');
    if (!trigger || !panel) return;
    trigger.addEventListener('click', function(e) {
        e.stopPropagation();
        // Close actions menu if open
        var am = document.getElementById('actionsMenu');
        if (am) am.classList.remove('open');
        panel.classList.toggle('open');
    });
    document.addEventListener('click', function(e) {
        if (!panel.contains(e.target) && e.target !== trigger && !trigger.contains(e.target)) {
            panel.classList.remove('open');
        }
    });
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
        var sectionEmoji = isComposite ? '\u{1f517}' : '\u{1f495}';
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
                html += '<span class="cat-emoji">' + cat.emoji + '</span>';
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
            var catNames = ['⭐ جنبه‌های اصلی', '⚡ جنبه‌های سیاره‌ای', '🏠 خانه‌ها و طالع', '🔮 سیارات فراسویی', '🔥 تعادل عناصر'];
            var catEmojis = ['⭐', '⚡', '🏠', '🔮', '🔥'];
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
                html += '<span class="breakdown-cat-emoji">' + (catEmojis[cat] || '📌') + '</span>';
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
                ctxParts.push(monthNames[parseInt(monthEl.value)-1] || '');
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
    var html = '<div class="section-card visible synastry-result"><div class="section-title"><span class="emoji-big">\u{1f30d}</span> '+title+'</div>';
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

    // Also capture from daily-question date picker
    var dqDate = document.getElementById('dqDatePicker_hidden');
    if (dqDate && dqDate.value) {
        var dqParts = dqDate.value.split('-');
        if (dqParts.length >= 3) sharedInputs.birthDate = { year: parseInt(dqParts[0]), month: parseInt(dqParts[1]), day: parseInt(dqParts[2]) };
    }
    // Also capture from Numerology fields
    var numYear = document.getElementById('numYear');
    var numMonth = document.getElementById('numMonth');
    var numDay = document.getElementById('numDay');
    if (numYear && numMonth && numDay && numYear.value && numMonth.value && numDay.value) {
        sharedInputs.birthDate = { year: parseInt(numYear.value), month: parseInt(numMonth.value), day: parseInt(numDay.value) };
    }
    // Also capture from Biorhythm date picker
    var bioBirthDP = document.getElementById('bioBirthDP_hidden');
    if (bioBirthDP && bioBirthDP.value) {
        var parts2 = bioBirthDP.value.split('-');
        if (parts2.length >= 3) sharedInputs.birthDate = { year: parseInt(parts2[0]), month: parseInt(parts2[1]), day: parseInt(parts2[2]) };
    }
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
//  SHIMMER / SKELETON LOADING HELPERS
// ================================================================
function makeShimmerLoading(text) {
    return '<div class="shimmer-loading">' +
        '<div class="shimmer-line-circle"></div>' +
        '<div class="shimmer-line"></div>' +
        '<div class="shimmer-line"></div>' +
        '<div class="shimmer-line"></div>' +
        '<div class="shimmer-line"></div>' +
        '<div class="shimmer-line"></div>' +
        '<div class="shimmer-text">' + (text || '⏳ در حال دریافت اطلاعات...') + '</div>' +
        '</div>';
}

function makeShimmerCompact(text) {
    return '<div class="shimmer-loading" style="padding:14px;">' +
        '<div class="shimmer-line" style="width:70%;margin:0 auto 10px;"></div>' +
        '<div class="shimmer-line" style="width:90%;margin:0 auto 10px;"></div>' +
        '<div class="shimmer-line" style="width:50%;margin:0 auto 10px;"></div>' +
        '<div class="shimmer-text">' + (text || '⏳ در حال دریافت...') + '</div>' +
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
        document.querySelectorAll('[id$="_date_hidden"], #birthDatePicker_hidden').forEach(function(el) {
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
        if (_dpState['p2_datePicker']) _dpState['p2_datePicker'].value = sharedInputs2.birthDate;
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
    var cal = opts.calendarType || 'shamsi';
    var defaultVal = opts.defaultValue || { year: cal === 'shamsi' ? 1379 : 2000, month: cal === 'shamsi' ? 1 : 1, day: 1 };
    _dpState[triggerId] = { calType: cal, value: defaultVal };
    return '<input type="hidden" id="' + hiddenId + '" value="' + defaultVal.year + '-' + String(defaultVal.month).padStart(2,'0') + '-' + String(defaultVal.day).padStart(2,'0') + '">' +
        '<button type="button" class="dp-trigger" id="' + triggerId + '">' +
        '<span class="dp-trigger-icon">📅</span>' +
        '<span><span class="dp-trigger-label">' + (opts.label || 'تاریخ تولد') + '</span><br>' +
        '<span id="' + displayId + '">' + formatDpDisplay(defaultVal, cal, opts.digits) + '</span></span>' +
        '</button>';
}

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
    btn.addEventListener('click', function () {
        var state = _dpState[triggerId] || {};
        DateWheelPicker.open({
            calendarType: opts.calendarType || state.calType || 'shamsi',
            defaultValue: state.value || opts.defaultValue,
            minYear: opts.minYear,
            maxYear: opts.maxYear,
            yearStep: opts.yearStep,
            digits: opts.digits || 'fa',
            loop: false,
            onSave: function (date) {
                _dpState[triggerId] = { calType: date.calendarType, value: date };
                var hidden = document.getElementById(hiddenId);
                var display = document.getElementById(displayId);
                if (hidden) hidden.value = date.year + '-' + String(date.month).padStart(2,'0') + '-' + String(date.day).padStart(2,'0');
                if (display) display.textContent = formatDpDisplay(date, date.calendarType, opts.digits);
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
    return '<div class="form-grid">'+
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
    if (tab === 'birth') attachDatePicker('birthDatePicker', opts);
    if (tab === 'synastry' || tab === 'composite' || tab === 'transit') {
        attachDatePicker('p1_date', opts);
        attachDatePicker('p2_date', opts);
    }
    if (tab === 'solar-return' || tab === 'lunar-return') {
        attachDatePicker('p1_date', opts);
    }
    if (tab === 'transit') attachDatePicker('transitDatePicker', opts);
    if (tab === 'daily-question') attachDatePicker('dqDatePicker', opts);
    if (tab === 'biorhythm') {
        attachDatePicker('bioBirthDP', opts);
        attachDatePicker('bioMonthlyBirthDP', opts);
    }
}

var formBuilders = {
    'birth': function() { formTitle.innerHTML = '🪐 اطلاعات تولد'; calcBtn.innerHTML = '🔮 دریافت چارت'; return buildBirthForm(); },
    'synastry': function() { formTitle.innerHTML = '💕 سیناستری'; calcBtn.innerHTML = '💕 محاسبه'; return buildPersonForm('p1','شخص اول','inner')+'<div class="person-divider"><span>+</span></div>'+buildPersonForm('p2','شخص دوم','outer'); },
    'composite': function() { formTitle.innerHTML = '🔗 کامپوزیت'; calcBtn.innerHTML = '🔗 محاسبه'; return buildPersonForm('p1','شخص اول','primary')+'<div class="person-divider"><span>🔗</span></div>'+buildPersonForm('p2','شخص دوم','secondary'); },
    'transit': function() {
        formTitle.innerHTML = '🌍 ترانزیت'; calcBtn.innerHTML = '🌍 محاسبه';
        return buildPersonForm('p1','چارت تولد','natal')+
            '<div class="person-divider"><span>🌍</span></div>'+
            '<div class="person-label">🌍 لحظه ترانزیت</div>'+
            '<div class="form-section"><div class="form-grid">'+
            '<div class="form-group"><label>📅 لحظه ترانزیت</label>'+makeDatePickerTrigger('transitDatePicker', {label:'تاریخ ترانزیت', calendarType:'shamsi', digits:'fa'})+'</div>'+
            '<div class="form-group"><label>⏰</label><select id="transit_hour">'+makeHourOptions()+'</select></div>'+
            '<div class="form-group"><label>⏱️</label><select id="transit_minute">'+makeMinOptions()+'</select></div>'+
            '</div></div>';
    },
    'solar-return': function() {
        formTitle.innerHTML = '☀️ بازگشت خورشیدی'; calcBtn.innerHTML = '☀️ محاسبه';
        var currentYear = new Date().getFullYear();
        var yearOpts = '';
        for (var y = currentYear; y <= currentYear + 10; y++) yearOpts += makeOption(y, y);
        return buildPersonForm('p1','چارت تولد','natal')+
            '<div class="form-section"><div class="form-grid">'+
            '<div class="form-group"><label>☀️ سال بازگشت</label><select id="return_year">'+yearOpts+'</select></div>'+
            '</div></div>';
    },
    'mizaj': function() { formTitle.innerHTML = '🧬 مزاج‌شناسی'; calcBtn.style.display = 'none'; return getMizajForm(); },
    'abjad': function() { formTitle.innerHTML = '🔢 ابجد'; calcBtn.style.display = 'none'; return getAbjadForm(); },
    'tarot': function() { formTitle.innerHTML = '🔮 تاروت'; calcBtn.style.display = 'none'; return getTarotForm(); },
    'numerology': function() { formTitle.innerHTML = '🔢 عددشناسی'; calcBtn.style.display = 'none'; return getNumerologyForm(); },
    'biorhythm': function() { formTitle.innerHTML = '🔬 بیوریتم'; calcBtn.style.display = 'none'; return getBiorhythmForm(); },
    'zodiac': function() { formTitle.innerHTML = '🐉 سال حیوانی'; calcBtn.style.display = 'none'; return getZodiacForm(); },
    'daily-question': function() { formTitle.innerHTML = '❓ پرسش روزانه'; calcBtn.style.display = 'none'; return getDailyQuestionForm(); },
    'hafez': function() { formTitle.innerHTML = '🍃 فال حافظ'; calcBtn.style.display = 'none'; return getHafezForm(); },
    'nasa': function() { formTitle.innerHTML = '🌌 ناسا'; calcBtn.style.display = 'none'; return getNasaForm(); },
    'moon-phase': function() { formTitle.innerHTML = '🌙 فاز ماه'; calcBtn.style.display = 'none'; return getMoonPhaseForm(); },

    'lunar-return': function() {
        formTitle.innerHTML = '🌙 بازگشت ماهانه'; calcBtn.innerHTML = '🌙 محاسبه';
        var currentYear = new Date().getFullYear();
        var yearOpts = '';
        for (var y = currentYear; y <= currentYear + 1; y++) yearOpts += makeOption(y, y);
        var monthNames = ['\u0641\u0631\u0648\u0631\u06cc\u0646','\u0627\u0631\u062f\u06cc\u0628\u0647\u0634\u062a','\u0627\u0631\u062f\u0628\u0647\u0634\u062a','\u062f\u0631\u0648\u06cc\u0632\u0647','\u062a\u06cc\u0631','\u0627\u0631\u062f\u06cc\u0628\u0647\u0634\u062a','\u062a\u06cc\u0631\u0645\u0647','\u0645\u0647\u0631','\u0622\u0628\u0627\u0646','\u0622\u0630\u0631','\u0622\u0630\u0627\u0631','\u062f\u06cc\u0633\u0627\u0646\u0628\u0631'];
        var monthOpts = '';
        for (var m = 1; m <= 12; m++) monthOpts += makeOption(m, monthNames[m-1]);
        return buildPersonForm('p1','چارت تولد','natal')+
            '<div class="form-section"><div class="form-grid">'+
            '<div class="form-group"><label>🌙 سال</label><select id="return_year">'+yearOpts+'</select></div>'+
            '<div class="form-group"><label>🌙 ماه</label><select id="return_month">'+monthOpts+'</select></div>'+
            '</div></div>';
    }
};

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

    // Early return if same tab already rendered
    if (tab === currentTab && formContainer.innerHTML.trim() !== '') return;
    syncSharedInputsFromForm();
    document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
    var btn = document.querySelector('.tab-btn[data-tab="' + tab + '"]');
    if (btn) btn.classList.add('active');
    currentTab = tab;
    var formHtml = formBuilders[tab]();
    var info = TAB_INFO[tab];
    if (info) formHtml = makeInfoSection(info.title, info.text) + formHtml;
    formContainer.innerHTML = formHtml;
    attachCityAutocomplete();
    reattachMapButton();
    applySharedInputs();
    attachDatePickerTriggers(tab);
    _lastLocationBarKey = '';
    updateLocationBar();
    document.getElementById('result').style.display = 'none';
    document.getElementById('status').style.display = 'none';
    formContainer.querySelectorAll('input, select').forEach(function(el) {
        el.addEventListener('change', syncSharedInputsFromForm);
        el.addEventListener('input', syncSharedInputsFromForm);
    });
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
    var yr = parseInt(parts[0]);
    if (yr < 1279) throw new Error('مردگان ستاره‌ای در چارت ندارند 🌌');
    var tzOffset = String(parseFloat(tzEl.value));
    return {
        year: yr, month: parseInt(parts[1]), day: parseInt(parts[2]),
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

async function handleSynastry() {
    var s1 = buildSubject('p1'), s2 = buildSubject('p2');
    if (!s1 || !s2) throw new Error('اطلاعات هر دو شخص لازم است.');
    var data = await fetchWithCache('/api/v5/chart-data/synastry', { first_subject: s1, second_subject: s2 });
    document.getElementById('result').innerHTML = displayGenericChart(data, '💕 سیناستری', 'synastry');
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
    var parts = tdHidden.value.split('-');
    var transitSubject = {
        year: parseInt(parts[0]), month: parseInt(parts[1]), day: parseInt(parts[2]),
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
                <span style="color:#5a526e;">⏳ در حال دریافت تفسیر چارت...</span>
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
        try {
            const analysis = await getDeepSeekAnalysisFromBackend(context, vedic);
            document.getElementById('deepseek-box').innerHTML = analysis;
        } catch (err) {
            document.getElementById('deepseek-box').innerHTML =
                `<div style="color:#e87474;">⚠️ خطا: ${err.message}</div>`;
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
async function getDeepSeekAnalysisFromBackend(contextText, vedicData) {
    let vedicSummary = "";
    if (vedicData && Object.keys(vedicData).length > 0) {
        vedicSummary = "\n\n**📜 اطلاعات تکمیلی ودیک (Vedic):**\n";
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
    }

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

// Save a draw to the user's tarot history (logged-in users only, fire-and-forget)
function saveTarotHistory(spreadType, drawn, question) {
    const token = localStorage.getItem('cosmic_token');
    if (!token) return;
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

// ---------- Tarot Display Functions ----------

function displayTarotCard(data, container) {
    const card = data.card;
    const isReversed = data.is_reversed || false;
    const status = isReversed ? '🔄 وارونه' : '⬆️ راست';
    const imgUrl = card.image || '/static/tarot/images/placeholder.webp';
    container.innerHTML = `
        <div style="background: rgba(108,92,231,0.1); border: 1px solid rgba(108,92,231,0.3); border-radius: 16px; padding: 20px; margin-top: 10px;">
            <div style="display: flex; gap: 20px; align-items: flex-start; flex-wrap: wrap;">
                <div class="tarot-flip-container auto-flip" onclick="this.classList.toggle('auto-flip');this.classList.toggle('flipped');" title="کلیک کنید">
                    <div class="tarot-flip-inner">
                        <div class="tarot-flip-front"><div class="card-back-pattern">🌟</div></div>
                        <div class="tarot-flip-back">
                            <img src="${imgUrl}" class="${isReversed ? 'reversed' : ''}" alt="${card.name || ''}" onerror="this.src='/static/tarot/images/placeholder.webp'">
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
        const imgUrl = card.image || '/static/tarot/images/placeholder.webp';
        const delay = index * 300;
        html += `
            <div style="background: rgba(108,92,231,0.08); border: 1px solid rgba(108,92,231,0.2); border-radius: 12px; padding: 15px; margin-top: 10px; display: flex; gap: 15px; align-items: flex-start;">
                <div class="tarot-flip-container small auto-flip" onclick="this.classList.toggle('auto-flip');this.classList.toggle('flipped');" style="animation-delay:${delay}ms;" title="کلیک کنید">
                    <div class="tarot-flip-inner" style="animation-delay:${delay}ms;">
                        <div class="tarot-flip-front"><div class="card-back-pattern">🌟</div></div>
                        <div class="tarot-flip-back">
                            <img src="${imgUrl}" class="${isReversed ? 'reversed' : ''}" alt="${card.name || ''}" onerror="this.src='/static/tarot/images/placeholder.webp'">
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
        const imgUrl = card.image || '/static/tarot/images/placeholder.webp';
        const delay = index * 400;
        html += `
            <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 15px; margin-top: 10px; display: flex; gap: 15px; align-items: flex-start;">
                <div class="tarot-flip-container small auto-flip" onclick="this.classList.toggle('auto-flip');this.classList.toggle('flipped');" style="animation-delay:${delay}ms;" title="کلیک کنید">
                    <div class="tarot-flip-inner" style="animation-delay:${delay}ms;">
                        <div class="tarot-flip-front"><div class="card-back-pattern">🌟</div></div>
                        <div class="tarot-flip-back">
                            <img src="${imgUrl}" class="${isReversed ? 'reversed' : ''}" alt="${card.name || ''}" onerror="this.src='/static/tarot/images/placeholder.webp'">
                        </div>
                    </div>
                    <span class="flip-hint">کلیک</span>
                </div>
                <div style="flex: 1;">
                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">
                        <h5 style="color: #fdcb6e; margin: 0;">${index+1}. ${pos.position || ''}</h5>
                        <span style="background: ${isReversed ? '#e17055' : '#00b894'}; padding: 2px 12px; border-radius: 20px; color: #fff; font-size: 0.7rem;">${isReversed ? 'وارونه' : 'راست'}</span>
                    </div>
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
    return `
        <div style="max-width: 100%; margin: 0 auto;">
            <h3 style="color: #a29bfe; text-align: center;">🔢 عددشناسی - رمز اعداد زندگی</h3>

            <!-- Life Path Number (PRIMARY) -->
            <div style="background: rgba(255,255,255,0.03); border-radius: 16px; padding: 20px; margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.05);">
                <h4 style="color: #fdcb6e; margin-top: 0;">🛤️ عدد مسیر زندگی</h4>
                <div class="form-group"><label>سال تولد</label><input id="numYear" type="number" value="1990"></div>
                <div class="form-group"><label>ماه تولد</label><input id="numMonth" type="number" value="1"></div>
                <div class="form-group"><label>روز تولد</label><input id="numDay" type="number" value="1"></div>
                <button class="btn-primary" onclick="submitLifePath()">🛤️ محاسبه مسیر زندگی</button>
                <div id="numLifePathResult" style="margin-top: 15px;"></div>
            </div>

            <!-- Personal Year (SECONDARY) -->
            <div style="background: rgba(255,255,255,0.03); border-radius: 16px; padding: 20px; margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.05);">
                <h4 style="color: #fdcb6e; margin-top: 0;">📅 سال شخصی</h4>
                <div class="form-group"><label>سال تولد</label><input id="pyYear" type="number" value="1990"></div>
                <div class="form-group"><label>ماه تولد</label><input id="pyMonth" type="number" value="1"></div>
                <div class="form-group"><label>روز تولد</label><input id="pyDay" type="number" value="1"></div>
                <div class="form-group"><label>سال هدف (اختیاری، خالی = سال جاری)</label><input id="pyTarget" type="number" placeholder="مثلاً 2026"></div>
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
                <div class="form-group"><label>عدد اول</label><input id="numComp1" type="number" value="1"></div>
                <div class="form-group"><label>عدد دوم</label><input id="numComp2" type="number" value="2"></div>
                <button class="btn-secondary" onclick="submitCompatibility()" style="width:100%;">💞 بررسی سازگاری</button>
                <div id="numCompResult" style="margin-top: 15px;"></div>
            </div>
        </div>
    `;
}

// ---------- API Calls ----------

async function submitLifePath() {
    const year = parseInt(document.getElementById('numYear').value);
    const month = parseInt(document.getElementById('numMonth').value);
    const day = parseInt(document.getElementById('numDay').value);
    const resultDiv = document.getElementById('numLifePathResult');
    if (!year || !month || !day) { resultDiv.innerHTML = '<p style="color:#ff6b6b;">❌ لطفاً تاریخ تولد را کامل وارد کنید</p>'; return; }
    if (year < 1279) { resultDiv.innerHTML = '<p style="color:#e74c3c;">❌ مردگان ستاره‌ای در چارت ندارند 🌌</p>'; return; }
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
    const birth_year = parseInt(document.getElementById('pyYear').value);
    const birth_month = parseInt(document.getElementById('pyMonth').value);
    const birth_day = parseInt(document.getElementById('pyDay').value);
    const targetInput = document.getElementById('pyTarget').value;
    const target_year = targetInput ? parseInt(targetInput) : null;
    const resultDiv = document.getElementById('numPersonalYearResult');
    if (!birth_year || !birth_month || !birth_day) { resultDiv.innerHTML = '<p style="color:#ff6b6b;">❌ لطفاً تاریخ تولد را کامل وارد کنید</p>'; return; }
    if (birth_year < 1279) { resultDiv.innerHTML = '<p style="color:#e74c3c;">❌ مردگان ستاره‌ای در چارت ندارند 🌌</p>'; return; }
    resultDiv.innerHTML = makeShimmerCompact('⏳ در حال محاسبه سال شخصی...');
    try {
        const res = await fetch('/api/v5/numerology/personal-year', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ birth_year, birth_month, birth_day, target_year })
        });
        const data = await res.json();
        if (data.status === 'success') {
            displayNumerologyResult(data.data, resultDiv, '📅 سال شخصی');
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
    for (const [key, value] of Object.entries(data)) {
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
    html += '</div>';
    container.innerHTML = html;
}

// ================================================================
//   INIT
// ============================================
// BIORHYTHM (بیوریتم)
// ============================================

function getBiorhythmForm() {
    var defaultYear = sharedInputs.birthDate ? sharedInputs.birthDate.year : 1379;
    var defaultDate = sharedInputs.birthDate ? sharedInputs.birthDate : { year: defaultYear, month: 1, day: 1 };
    return `
        <div style="max-width:900px;margin:0 auto;">
            <h3 style="color:#a29bfe;text-align:center;">🔬 بیوریتم - انرژی امروز شما</h3>
            
            <!-- Main Calculator -->
            <div style="background:rgba(255,255,255,0.03);border-radius:16px;padding:20px;margin-bottom:20px;border:1px solid rgba(255,255,255,0.05);">
                <h4 style="color:#fdcb6e;margin-top:0;">📅 محاسبه بیوریتم</h4>
                <div class="form-group"><label>تاریخ تولد</label>${makeDatePickerTrigger('bioBirthDP', {label:'تاریخ تولد', calendarType:'shamsi', digits:'fa', defaultValue: defaultDate})}</div>
                <div class="form-group"><label>تاریخ هدف (اختیاری، خالی = امروز)</label><input id="bioTarget" placeholder="YYYY-MM-DD"></div>
                <button class="btn-primary" onclick="submitBiorhythm()">🔬 محاسبه بیوریتم</button>
                <div id="bioResult" style="margin-top:15px;"></div>
            </div>

            <!-- Monthly Overview -->
            <div style="background:rgba(255,255,255,0.03);border-radius:16px;padding:20px;margin-bottom:20px;border:1px solid rgba(255,255,255,0.05);">
                <h4 style="color:#fdcb6e;margin-top:0;">📊 نمای ماهانه</h4>
                <div class="form-group"><label>تاریخ تولد</label>${makeDatePickerTrigger('bioMonthlyBirthDP', {label:'تاریخ تولد', calendarType:'shamsi', digits:'fa', defaultValue: defaultDate})}</div>
                <div class="form-group"><label>سال</label><input id="bioMonthlyYear" type="number" value="2026"></div>
                <div class="form-group"><label>ماه</label><input id="bioMonthlyMonth" type="number" value="8" min="1" max="12"></div>
                <button class="btn-secondary" onclick="submitMonthlyOverview()">📊 نمای ماهانه</button>
                <div id="bioMonthlyResult" style="margin-top:15px;"></div>
            </div>
        </div>
    `;
}

async function submitBiorhythm() {
    var bioHidden = document.getElementById('bioBirthDP_hidden');
    const birth = bioHidden ? bioHidden.value : '';
    const target = document.getElementById('bioTarget').value;
    const resultDiv = document.getElementById('bioResult');
    if (!birth) { resultDiv.innerHTML = '❌ تاریخ تولد را وارد کنید'; return; }
    if (parseInt(birth.split('-')[0]) < 1279) { resultDiv.innerHTML = '<span style="color:#e74c3c;">❌ مردگان ستاره‌ای در چارت ندارند 🌌</span>'; return; }
    resultDiv.innerHTML = '⏳ در حال محاسبه...';
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
    var mbHidden = document.getElementById('bioMonthlyBirthDP_hidden');
    const birth = mbHidden ? mbHidden.value : '';
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
    function barWidth(val) {
        return Math.abs(val) + '%';
    }

    let html = `<div style="background:rgba(108,92,231,0.1);border:1px solid rgba(108,92,231,0.3);border-radius:16px;padding:20px;margin-top:10px;">`;
    html += `<h4 style="color:#fdcb6e;margin-top:0;">📊 بیوریتم — ${data.target_date}</h4>`;
    html += `<p style="color:#aaa;">⏳ ${data.days} روز از تولد (${data.birth_day_of_week}) گذشته است</p>`;
    
    const cycles = [
        { label: '💪 فیزیکی', key: 'physical', status: data.physical_status, phase: data.physical_phase },
        { label: '❤️ عاطفی', key: 'emotional', status: data.emotional_status, phase: data.emotional_phase },
        { label: '🧠 ذهنی', key: 'intellectual', status: data.intellectual_status, phase: data.intellectual_phase },
    ];
    
    html += `<div style="margin-top:15px;">`;
    cycles.forEach(c => {
        const val = data[c.key];
        const color = barColor(val);
        const isPositive = val >= 0;
        html += `
            <div style="margin:12px 0;background:rgba(0,0,0,0.2);border-radius:10px;padding:12px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                    <span style="color:#ddd;font-weight:bold;">${c.label}</span>
                    <span style="color:${color};font-weight:bold;">${val}% ${c.status}</span>
                </div>
                <div style="background:rgba(255,255,255,0.05);border-radius:6px;height:10px;overflow:hidden;position:relative;">
                    <div style="position:absolute;top:0;${isPositive ? 'left:50%' : 'right:50%'};width:25%;height:100%;background:${color};opacity:0.8;border-radius:6px;"></div>
                    <div style="position:absolute;top:0;left:50%;width:2px;height:100%;background:rgba(255,255,255,0.2);"></div>
                </div>
                <div style="color:#aaa;font-size:0.8rem;margin-top:4px;">فاز: ${c.phase}</div>
            </div>`;
    });
    html += `</div>`;

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
    html += `<div style="margin-top:12px;color:#aaa;font-size:0.8rem;">💪 فیزیکی · ❤️ عاطفی · 🧠 ذهنی (درصد)</div>`;
    html += `</div>`;
    container.innerHTML = html;
}

// ============================================
// CHINESE ZODIAC (سال حیوانی چینی)
// ============================================

function getZodiacForm() {
    return `
        <div style="max-width:900px;margin:0 auto;">
            <h3 style="color:#a29bfe;text-align:center;">🐉 سال حیوانی چینی</h3>
            
            <!-- Zodiac Calculator -->
            <div style="background:rgba(255,255,255,0.03);border-radius:16px;padding:20px;margin-bottom:20px;border:1px solid rgba(255,255,255,0.05);">
                <h4 style="color:#fdcb6e;margin-top:0;">🐭 محاسبه حیوان سال تولد</h4>
                <div class="form-group"><label>سال تولد (میلادی)</label><input id="zodiacYear" type="number" value="1990"></div>
                <button class="btn-primary" onclick="submitZodiac()">🐉 محاسبه</button>
                <div id="zodiacResult" style="margin-top:15px;"></div>
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
    resultDiv.innerHTML = '⏳ در حال بررسی...';
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
        {id: 'mars', icon: '\u{1f534}', label: 'مریخ'},
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

    html += '<div id="nasaSpaceWeather" style="display:none;">';
    html += '<div class="form-grid">';
    html += '<div class="form-group"><label>\u{1f4c5} از تاریخ</label><input type="date" id="nasaWeatherStart" value="' + _nasa7Ago + '"></div>';
    html += '<div class="form-group"><label>\u{1f4c5} تا تاریخ</label><input type="date" id="nasaWeatherEnd" value="' + _nasaToday + '"></div>';
    html += '</div>';
    html += '<button class="btn-primary" onclick="fetchNasaSpaceWeather()" style="width:100%;margin-bottom:16px;">\u2600\ufe0f دریافت آب و هوای فضا</button>';
    html += '<div id="nasaWeatherResult"></div></div>';

    html += '<div id="nasaAsteroids" style="display:none;">';
    html += '<div class="form-grid">';
    html += '<div class="form-group"><label>\u{1f4c5} از تاریخ</label><input type="date" id="nasaNeoStart" value="' + _nasa7Ago + '"></div>';
    html += '<div class="form-group"><label>\u{1f4c5} تا تاریخ</label><input type="date" id="nasaNeoEnd" value="' + _nasaToday + '"></div>';
    html += '</div>';
    html += '<button class="btn-primary" onclick="fetchNasaAsteroids()" style="width:100%;margin-bottom:16px;">\u2604\ufe0f دریافت سیارک\u200cها</button>';
    html += '<div id="nasaNeoResult"></div></div>';

    
    var _nasaToday2 = new Date().toISOString().split('T')[0];
    html += '<div id="nasaPlanets" style="display:none;">';
    html += '<div class="form-group"><label>\u{1f4c5} تاریخ</label><input type="date" id="nasaPlanetsDate" value="' + _nasaToday2 + '"></div>';
    html += '<button class="btn-primary" onclick="fetchNasaPlanets()" style="width:100%;margin-bottom:16px;">\ud83c\udf0f دریافت موقعیت سیارات</button>';
    html += '<div id="nasaPlanetsResult"></div></div>';

    html += '<div id="nasaMars" style="display:none;">';
    html += '<button class="btn-primary" onclick="fetchNasaMarsWeather()" style="width:100%;margin-bottom:16px;">\u{1f534} دریافت آب و هوای مریخ</button>';
    html += '<div id="nasaMarsResult"></div></div>';

    html += '</div></div>';

    setTimeout(function() {
        document.querySelectorAll('.nasa-tab[data-nasa-tab]').forEach(function(btn) {
            btn.addEventListener('click', function() { switchNasaTab(this.dataset.nasaTab); });
        });
    }, 0);

    return html;
}

function switchNasaTab(tab) {
    var panels = ['nasaApod','nasaImages','nasaSpaceWeather','nasaAsteroids','nasaMars'];
    panels.forEach(function(id) { var el = document.getElementById(id); if (el) el.style.display = 'none'; });
    document.querySelectorAll('.nasa-tab').forEach(function(b) { b.classList.remove('active'); });
    var tabMap = {'apod':'nasaApod','images':'nasaImages','space-weather':'nasaSpaceWeather','asteroids':'nasaAsteroids','mars':'nasaMars','planets':'nasaPlanets'};
    var target = document.getElementById(tabMap[tab]);
    if (target) target.style.display = 'block';
    var btn = document.querySelector('.nasa-tab[data-nasa-tab="' + tab + '"]');
    if (btn) btn.classList.add('active');
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
    var start = document.getElementById('nasaWeatherStart').value;
    var end = document.getElementById('nasaWeatherEnd').value;
    if (!start) return;
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
    var start = document.getElementById('nasaNeoStart').value;
    var end = document.getElementById('nasaNeoEnd').value;
    if (!start) return;
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

async function fetchNasaMarsWeather() {
    var div = document.getElementById('nasaMarsResult');
    div.innerHTML = '<div class="nasa-loading">\u23f3 در حال دریافت آب و هوای مریخ...</div>';
    try {
        var res = await fetch('/api/v5/nasa/mars-weather');
        var data = await res.json();
        if (data.status === 'success') { displayNasaMarsWeather(data.data, div); }
        else { div.innerHTML = '<div class="nasa-error">\u274c ' + (data.detail || 'خطا') + '</div>'; }
    } catch(e) { div.innerHTML = '<div class="nasa-error">\u274c خطا در ارتباط با سرور</div>'; }
}

function displayNasaMarsWeather(data, container) {
    if (!data.sols || data.sols.length === 0) {
        container.innerHTML = '<div class="nasa-card"><p style="color:#888;text-align:center;">' + (data.note_fa || 'داده‌ای موجود نیست') + '</p></div>';
        return;
    }
    var html = '<div class="nasa-card">';
    html += '<h4 class="nasa-card-title">🔴 ' + (data.source_fa || 'آب و هوای مریخ') + '</h4>';
    html += '<p style="color:#888;font-size:0.85rem;margin-bottom:12px;">' + (data.note_fa || '') + '</p>';
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px;">';
    data.sols.forEach(function(sol) {
        var t = sol.temperature || {};
        var w = sol.wind || {};
        var p = sol.pressure || {};
        var firstDate = sol.first_utc ? new Date(sol.first_utc) : null;
        var lastDate = sol.last_utc ? new Date(sol.last_utc) : null;
        var dateStr = firstDate && lastDate ? firstDate.toISOString().slice(0,10) + ' — ' + lastDate.toISOString().slice(0,10) : '';
        html += '<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:14px;padding:16px;transition:transform 0.2s;">';
        html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">';
        html += '<span style="font-size:1.1rem;font-weight:700;color:#fdcb6e;">Sol ' + sol.sol + '</span>';
        html += '<span style="background:rgba(108,92,231,0.15);padding:3px 12px;border-radius:20px;font-size:0.8rem;color:#a29bfe;">' + (sol.season_fa || sol.season || '') + '</span>';
        html += '</div>';
        html += '<div style="display:flex;justify-content:space-around;text-align:center;margin:12px 0;">';
        html += '<div><div style="font-size:0.8rem;color:#888;">🌡️ میانگین</div><div style="font-weight:700;font-size:1.1rem;">' + (t.avg_c !== null ? t.avg_c.toFixed(1) : 'N/A') + '°C</div></div>';
        html += '<div><div style="font-size:0.8rem;color:#888;">❄️ حداقل</div><div style="font-weight:700;font-size:1.1rem;color:#85c1e9;">' + (t.min_c !== null ? t.min_c.toFixed(1) : 'N/A') + '°C</div></div>';
        html += '<div><div style="font-size:0.8rem;color:#888;">🔥 حداکثر</div><div style="font-weight:700;font-size:1.1rem;color:#ff6b6b;">' + (t.max_c !== null ? t.max_c.toFixed(1) : 'N/A') + '°C</div></div>';
        html += '</div>';
        html += '<div style="display:flex;justify-content:space-around;border-top:1px solid rgba(255,255,255,0.04);padding-top:10px;margin-top:8px;font-size:0.9rem;">';
        html += '<div><span style="color:#888;">🌬️ باد:</span> <strong>' + (w.speed_ms !== null ? w.speed_ms.toFixed(1) : 'N/A') + ' m/s</strong></div>';
        html += '<div><span style="color:#888;">📊 فشار:</span> <strong>' + (p.avg_pa !== null ? p.avg_pa.toFixed(0) : 'N/A') + ' Pa</strong></div>';
        html += '</div>';
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
    var date = document.getElementById('nasaPlanetsDate').value;
    if (!date) return;
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
        <div style="max-width:900px;margin:0 auto;">
            <h3 style="color:#a29bfe;text-align:center;">🍃 فال حافظ</h3>
            <p style="color:#8a82a0;text-align:center;font-size:13px;margin-bottom:16px;">سوال خود را بنویسید و فال حافظ دریافت کنید</p>
            
            <div style="background:rgba(255,255,255,0.03);border-radius:16px;padding:20px;border:1px solid rgba(255,255,255,0.05);">
                <div class="form-group" style="margin-bottom:12px;">
                    <label style="color:#b8aec8;">❓ سوال شما (اختیاری)</label>
                    <input id="hafezQuestion" type="text" placeholder="مثلاً: آیا امروز روز خوبی است؟" style="width:100%;padding:12px;border-radius:10px;background:rgba(0,0,0,0.3);color:#fff;border:1px solid rgba(255,255,255,0.1);font-size:14px;font-family:inherit;">
                </div>
                <button class="btn-primary" onclick="submitHafez()">🍃 فال گرفتن</button>
                <div id="hafezResult" style="margin-top:16px;"></div>
            </div>
        </div>
    `;
}

async function submitHafez() {
    const question = document.getElementById('hafezQuestion').value.trim();
    const resultDiv = document.getElementById('hafezResult');
    resultDiv.innerHTML = '<p style="color:#aaa;"><span class="spinner"></span> ⏳ در حال دریافت فال...</p>';
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
    let html = `<div class="hafez-result-card">`;
    
    if (data.question) {
        html += `<div style="color:#fdcb6e;font-style:italic;margin-bottom:16px;font-size:15px;">📝 سوال: ${data.question}</div>`;
    }
    
    // Poem (if available from API — most APIs only provide interpretation)
    if (data.poem) {
        html += `<div class="hafez-poem">`;
        html += data.poem.replace(/\n/g, '<br>');
        html += `</div>`;
        html += `<div class="hafez-divider"></div>`;
    }
    
    // Interpretation (main content — always shown)
    var interpText = data.interpretation || data.poem || '';
    if (interpText) {
        html += `<div style="color:#a29bfe;font-weight:bold;margin-bottom:8px;">📖 تفسیر:</div>`;
        html += `<div style="color:#ddd;line-height:2;font-size:15px;">${interpText}</div>`;
    }
    
    // Ghazal number
    if (data.ghazal_number_fa) {
        html += `<div style="color:#888;font-size:0.85rem;margin-top:12px;">📜 غزل شماره: ${data.ghazal_number_fa}</div>`;
    }
    
    // Shamsi date
    if (data.date_shamsi_fa) {
        html += `<div style="color:#888;font-size:0.85rem;margin-top:4px;">📅 ${data.date_shamsi_fa}</div>`;
    } else if (data.date) {
        html += `<div style="color:#888;font-size:0.85rem;margin-top:4px;">📅 ${data.date}</div>`;
    }
    
    // Source
    if (data.source) {
        html += `<div style="color:#666;font-size:0.8rem;margin-top:8px;">📚 ${data.source}</div>`;
    }
    
    html += `</div>`;
    container.innerHTML = html;
}

// ================================================================
// DAILY QUESTION (پرسش روزانه)
// ================================================================

function getDailyQuestionForm() {
    return `
        <div class="daily-question-form">
            <h3>❓ پرسش روزانه — پاسخ از ۳ موتور</h3>
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
                <button class="btn-primary" onclick="submitDailyQuestion()">✨ دریافت پاسخ</button>
                <div id="dqResult" style="margin-top:16px;"></div>
            </div>
        </div>
    `;
}

async function submitDailyQuestion() {
    const question = document.getElementById('dqQuestion').value.trim();
    const dqHidden = document.getElementById('dqDatePicker_hidden');
    const birthDate = dqHidden ? dqHidden.value : '';
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
    const imgUrl = card.image || '/static/tarot/images/placeholder.webp';
    
    let html = '<div class="daily-question-result">';
    html += '<h4 style="color:#fdcb6e;margin-bottom:8px;">📝 سوال: ' + (data.question || '') + '</h4>';
    html += '<div style="color:#8a82a0;font-size:12px;margin-bottom:12px;">📅 ' + (data.date || '') + '</div>';
    
    // Tarot card with flip animation
    html += '<div style="display:flex;gap:16px;align-items:flex-start;margin-bottom:16px;flex-wrap:wrap;">';
    html += '<div class="tarot-flip-container auto-flip" onclick="this.classList.toggle(\"auto-flip\");this.classList.toggle(\"flipped\");" title="کلیک کنید تا کارت برگرد">' + '<div class="tarot-flip-inner">' + '<div class="tarot-flip-front"><div class="card-back-pattern">🌟</div></div>' + '<div class="tarot-flip-back"><img src="' + imgUrl + '" class="' + (isReversed ? 'reversed' : '') + '" alt="' + (card.name || '') + '" onerror="this.src=\'/static/tarot/images/placeholder.webp\'"></div>' + '</div>' + '<span class="flip-hint">کلیک کنید</span>' + '</div>';
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
window.addEventListener('DOMContentLoaded', function() {
    // Build initial birth form
    if (formBuilders && formBuilders['birth']) {
        formContainer.innerHTML = formBuilders['birth']();
        attachCityAutocomplete();
        reattachMapButton();
        attachDatePickerTriggers('birth');
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

    // Initialize location bar
    updateLocationBar();
});