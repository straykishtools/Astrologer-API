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

const mapModal = document.getElementById('mapModal');
const openMapBtn = document.getElementById('openMapBtn');
const closeMapBtn = document.getElementById('closeMapModal');
const confirmLocationBtn = document.getElementById('confirmLocationBtn');

function initMap() {
    if (isMapReady) return;
    
    const defaultLat = parseFloat(document.getElementById('latitude').value) || 35.6892;
    const defaultLng = parseFloat(document.getElementById('longitude').value) || 51.3890;

    mapInstance = L.map('map').setView([defaultLat, defaultLng], 10);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(mapInstance);

    marker = L.marker([defaultLat, defaultLng], { draggable: true }).addTo(mapInstance);

    mapInstance.on('click', function(e) {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;
        updateLocation(lat, lng);
    });

    marker.on('dragend', function(e) {
        const pos = marker.getLatLng();
        updateLocation(pos.lat, pos.lng);
    });

    isMapReady = true;
}

async function updateLocation(lat, lng) {
    document.getElementById('latitude').value = lat.toFixed(6);
    document.getElementById('longitude').value = lng.toFixed(6);
    
    marker.setLatLng([lat, lng]);
    
    try {
        const resp = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=fa`
        );
        const data = await resp.json();
        if (data && data.display_name) {
            const parts = data.display_name.split(',');
            let city = parts[0] || 'نامشخص';
            if (city.includes(' ')) {
                const words = city.split(' ');
                city = words[0];
            }
            document.getElementById('cityName').value = city;
        }
    } catch (_) {}
}

openMapBtn.addEventListener('click', function() {
    mapModal.classList.add('active');
    if (!isMapReady) {
        setTimeout(initMap, 300);
    } else {
        const lat = parseFloat(document.getElementById('latitude').value) || 35.6892;
        const lng = parseFloat(document.getElementById('longitude').value) || 51.3890;
        mapInstance.setView([lat, lng], 10);
        marker.setLatLng([lat, lng]);
    }
});

confirmLocationBtn.addEventListener('click', function() {
    mapModal.classList.remove('active');
});

closeMapBtn.addEventListener('click', function() {
    mapModal.classList.remove('active');
});

mapModal.addEventListener('click', function(e) {
    if (e.target === mapModal) {
        mapModal.classList.remove('active');
    }
});

// ================================================================
//   HEADER ACTIONS
// ================================================================
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

document.getElementById('payBtn').addEventListener('click', () => {
    alert('🌟 نسخه‌ی کامل با تفسیر پیشرفته، یوگاها و داشاها به‌زودی در دسترس خواهد بود.');
});

