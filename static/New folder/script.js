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



function displayGenericChart(data, title) {
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
    if (chart.aspects && chart.aspects.length > 0) {
        html += '<div class="section-card visible"><div class="section-title"><span class="emoji-big">\u26a1</span> \u062c\u0646\u0628\u0647\u200c\u0647\u0627 <span class="badge-count">'+chart.aspects.length+'</span></div><div class="grid-flex">';
        chart.aspects.forEach(function(a) {
            html += '<span class="aspect-item visible">'+translate(a.p1_name||'')+' '+translate(a.aspect||'')+' '+translate(a.p2_name||'')+' ('+(a.orbit?a.orbit.toFixed(1):'?')+'\u00b0)</span>';
        });
        html += '</div></div>';
    }
    if (chart.relationship_score) {
        var rs = chart.relationship_score;
        html += '<div class="section-card visible"><div class="section-title"><span class="emoji-big">\u{1f495}</span> \u0627\u0645\u062a\u06cc\u0627\u0632</div><div class="analysis-box"><h2>\u{1f3c6} \u0627\u0645\u062a\u06cc\u0627\u0632: '+(rs.score_value||rs.score||'?')+' / 100</h2><p>'+(rs.score_description||'')+'</p></div></div>';
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
function makeTzOptions() { return '<option value="-12">UTC-12</option><option value="-11">UTC-11</option><option value="-10">UTC-10</option><option value="-9">UTC-9</option><option value="-8">UTC-8</option><option value="-7">UTC-7</option><option value="-6">UTC-6</option><option value="-5">UTC-5</option><option value="-4">UTC-4</option><option value="-3">UTC-3</option><option value="-2">UTC-2</option><option value="-1">UTC-1</option><option value="0">UTC 0</option><option value="1">UTC+1</option><option value="2">UTC+2</option><option value="3">UTC+3</option><option value="3.5" selected>UTC+3:30</option><option value="4">UTC+4</option><option value="4.5">UTC+4:30</option><option value="5">UTC+5</option><option value="5.5">UTC+5:30</option><option value="5.75">UTC+5:45</option><option value="6">UTC+6</option><option value="7">UTC+7</option><option value="8">UTC+8</option><option value="9">UTC+9</option><option value="9.5">UTC+9:30</option><option value="10">UTC+10</option><option value="11">UTC+11</option><option value="12">UTC+12</option>'; }

function buildBirthForm() {
    return '<div class="form-grid">'+
        '<div class="form-group"><label>\u{1f464} \u0646\u0627\u0645</label><input type="text" id="userName" value="\u06a9\u0627\u0631\u0628\u0631"></div>'+
        '<div class="form-group"><label>\u{1f4c5} \u062a\u0627\u0631\u06cc\u062e</label><input type="date" id="birthDate"></div>'+
        '<div class="form-group"><label>\u23f0</label><select id="birthHour">'+makeHourOptions()+'</select></div>'+
        '<div class="form-group"><label>\u23f1\ufe0f</label><select id="birthMinute">'+makeMinOptions()+'</select></div>'+
        '<div class="form-group full"><label>\u{1f3d9}\ufe0f \u0634\u0647\u0631</label><div class="city-search"><input type="text" id="cityName" placeholder="\u0646\u0627\u0645 \u0634\u0647\u0631" autocomplete="off"><button type="button" id="openMapBtn">\u{1f4cd}</button></div></div>'+
        '<div class="form-group"><label>\u{1f30d} lat</label><input type="number" id="latitude" step="0.0001" value="35.6892"></div>'+
        '<div class="form-group"><label>\u{1f30d} lng</label><input type="number" id="longitude" step="0.0001" value="51.3890"></div>'+
        '<div class="form-group"><label>\u{1f550} tz</label><select id="timezone">'+makeTzOptions()+'</select></div>'+
        '<div class="form-group"><label>\u{1f52e}</label><select id="zodiacType"><option value="tropical">Tropical</option><option value="sidereal">Sidereal</option></select></div>'+
        '</div>';
}


function buildPersonForm(id, label, badge) {
    return '<div class="person-label">👤 '+label+' <span class="person-badge">'+badge+'</span></div>'+
        '<div class="form-section"><div class="form-grid">'+
        '<div class="form-group"><label>👤</label><input type="text" id="'+id+'_name" value="'+label+'"></div>'+
        '<div class="form-group"><label>📅</label><input type="date" id="'+id+'_date"></div>'+
        '<div class="form-group"><label>⏰</label><select id="'+id+'_hour">'+makeHourOptions()+'</select></div>'+
        '<div class="form-group"><label>⏱️</label><select id="'+id+'_minute">'+makeMinOptions()+'</select></div>'+
        '<div class="form-group full"><label>🏙️</label><div class="city-search"><input type="text" id="'+id+'_city" placeholder="city" autocomplete="off"></div></div>'+
        '<div class="form-group"><label>🌍 lat</label><input type="number" id="'+id+'_lat" step="0.0001" value="35.6892"></div>'+
        '<div class="form-group"><label>🌍 lng</label><input type="number" id="'+id+'_lng" step="0.0001" value="51.3890"></div>'+
        '<div class="form-group"><label>🕐</label><select id="'+id+'_tz"><option value="3.5" selected>UTC+3:30</option><option value="0">UTC 0</option><option value="-5">UTC-5</option><option value="1">UTC+1</option><option value="8">UTC+8</option></select></div>'+
        '</div></div>';
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
            '<div class="form-group"><label>📅</label><input type="date" id="transit_date"></div>'+
            '<div class="form-group"><label>⏰</label><select id="transit_hour">'+makeHourOptions()+'</select></div>'+
            '<div class="form-group"><label>⏱️</label><select id="transit_minute">'+makeMinOptions()+'</select></div>'+
            '</div></div>';
    },
    'solar-return': function() {
        formTitle.innerHTML = '☀️ بازگشت خورشیدی'; calcBtn.innerHTML = '☀️ محاسبه';
        var months = Array.from({length:12},(_,i)=>makeOption(i+1,i+1)).join('');
        return buildPersonForm('p1','چارت تولد','natal')+
            '<div class="form-section"><div class="form-grid">'+
            '<div class="form-group"><label>📅 سال</label><input type="number" id="return_year" min="2020" max="2050"></div>'+
            '<div class="form-group"><label>📅 ماه</label><select id="return_month"><option value="0">همه</option>'+months+'</select></div>'+
            '</div></div>';
    },
    'mizaj': function() { formTitle.innerHTML = '🧬 مزاج‌شناسی'; calcBtn.style.display = 'none'; return getMizajForm(); },
    'abjad': function() { formTitle.innerHTML = '🔢 ابجد'; calcBtn.style.display = 'none'; return getAbjadForm(); },
    'tarot': function() { formTitle.innerHTML = '🔮 تاروت'; calcBtn.style.display = 'none'; return getTarotForm(); },
    'numerology': function() { formTitle.innerHTML = '🔢 عددشناسی'; calcBtn.style.display = 'none'; return getNumerologyForm(); },

    'lunar-return': function() {
        formTitle.innerHTML = '🌙 بازگشت ماهانه'; calcBtn.innerHTML = '🌙 محاسبه';
        var months = Array.from({length:12},(_,i)=>makeOption(i+1,i+1)).join('');
        return buildPersonForm('p1','چارت تولد','natal')+
            '<div class="form-section"><div class="form-grid">'+
            '<div class="form-group"><label>📅 سال</label><input type="number" id="return_year" min="2020" max="2050"></div>'+
            '<div class="form-group"><label>📅 ماه</label><select id="return_month"><option value="0">همه</option>'+months+'</select></div>'+
            '</div></div>';
    }
};

document.getElementById('tabNav').addEventListener('click', function(e) {
    var btn = e.target.closest('.tab-btn');
    if (!btn) return;
    var tab = btn.dataset.tab;
    if (tab === currentTab) return;
    document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');
    currentTab = tab;
    formContainer.innerHTML = formBuilders[tab]();
    calcBtn.style.display = 'block';
    attachCityAutocomplete();
    reattachMapButton();
    document.getElementById('result').style.display = 'none';
    document.getElementById('status').style.display = 'none';
});

function attachCityAutocomplete() {
    formContainer.querySelectorAll('input[id$="_city"], #cityName').forEach(function(input) {
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
    var mapBtn = document.getElementById('openMapBtn');
    if (mapBtn) {
        mapBtn.addEventListener('click', function() {
            mapModal.classList.add('active');
            if (!isMapReady) setTimeout(initMap, 300);
            else {
                mapInstance.setView([parseFloat(document.getElementById('latitude').value)||35.6892, parseFloat(document.getElementById('longitude').value)||51.3890], 10);
            }
        });
    }
}

function buildSubject(prefix) {
    var p = prefix ? prefix+'_' : '';
    var dateEl = document.getElementById(p+'date') || document.getElementById('birthDate');
    var hourEl = document.getElementById(p+'hour') || document.getElementById('birthHour');
    var minEl = document.getElementById(p+'minute') || document.getElementById('birthMinute');
    var latEl = document.getElementById(p+'lat') || document.getElementById('latitude');
    var lngEl = document.getElementById(p+'lng') || document.getElementById('longitude');
    var tzEl = document.getElementById(p+'tz') || document.getElementById('timezone');
    var cityEl = document.getElementById(p+'city') || document.getElementById('cityName');
    var nameEl = document.getElementById(p+'name') || document.getElementById('userName');
    if (!dateEl || !dateEl.value) return null;
    var parts = dateEl.value.split('-');
    var tzOffset = String(parseFloat(tzEl.value));
    return {
        year: parseInt(parts[0]), month: parseInt(parts[1]), day: parseInt(parts[2]),
        hour: parseInt(hourEl.value) || 12, minute: parseInt(minEl.value) || 0, second: 0,
        longitude: parseFloat(lngEl.value) || 51.3890, latitude: parseFloat(latEl.value) || 35.6892,
        timezone: TZ_OFFSET_TO_IANA[tzOffset] || 'Etc/UTC',
        city: (cityEl.value || 'Unknown').trim(), nation: null,
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
    var resultDiv = document.getElementById('result');
    var statusDiv = document.getElementById('status');
    resultDiv.style.display = 'block';
    statusDiv.style.display = 'block';
    statusDiv.innerHTML = '<span class="spinner"></span> ⏳ ...';
    statusDiv.style.color = '#b0caff';
    try {
        if (currentTab === 'birth') await handleBirthChart();
        else if (currentTab === 'synastry') await handleSynastry();
        else if (currentTab === 'composite') await handleComposite();
        else if (currentTab === 'transit') await handleTransit();
        else if (currentTab === 'solar-return') await handleReturn('solar-return', '☀️ بازگشت خورشیدی');
        else if (currentTab === 'lunar-return') await handleReturn('lunar-return', '🌙 بازگشت ماهانه');

        else if (currentTab === 'mizaj') { submitMizaj(); return; }
        statusDiv.innerHTML = '✅ انجام شد!';
        statusDiv.style.color = '#5fbf5f';
    } catch (err) {
        statusDiv.innerHTML = '⚠️ خطا: ' + err.message;
        statusDiv.style.color = '#e87474';
        console.error(err);
    }
});

async function handleBirthChart() {
    var subject = buildSubject('');
    if (!subject) throw new Error('تاریخ تولد را انتخاب کنید.');
    var payloadData = { subject: subject };
    var respData = await fetch('/api/v5/chart-data/birth-chart', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payloadData) });
    if (!respData.ok) { var err = await respData.json(); throw new Error(err.message || err.detail || 'خطا'); }
    var data = await respData.json();
    if (data.status !== 'OK') throw new Error(data.message || 'خطا');
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
}

async function handleSynastry() {
    var s1 = buildSubject('p1'), s2 = buildSubject('p2');
    if (!s1 || !s2) throw new Error('اطلاعات هر دو شخص لازم است.');
    var resp = await fetch('/api/v5/chart-data/synastry', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ first_subject: s1, second_subject: s2 }) });
    if (!resp.ok) { var err = await resp.json(); throw new Error(err.message || err.detail || 'خطا'); }
    var data = await resp.json();
    if (data.status !== 'OK') throw new Error(data.message || 'خطا');
    document.getElementById('result').innerHTML = displayGenericChart(data, '💕 سیناستری');
}

async function handleComposite() {
    var s1 = buildSubject('p1'), s2 = buildSubject('p2');
    if (!s1 || !s2) throw new Error('اطلاعات هر دو شخص لازم است.');
    var resp = await fetch('/api/v5/chart-data/composite', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ first_subject: s1, second_subject: s2 }) });
    if (!resp.ok) { var err = await resp.json(); throw new Error(err.message || err.detail || 'خطا'); }
    var data = await resp.json();
    if (data.status !== 'OK') throw new Error(data.message || 'خطا');
    document.getElementById('result').innerHTML = displayGenericChart(data, '🔗 کامپوزیت');
}

async function handleTransit() {
    var natal = buildSubject('p1');
    if (!natal) throw new Error('اطلاعات چارت تولد لازم است.');
    var td = document.getElementById('transit_date');
    if (!td || !td.value) throw new Error('تاریخ ترانزیت را انتخاب کنید.');
    var parts = td.value.split('-');
    var transitSubject = {
        year: parseInt(parts[0]), month: parseInt(parts[1]), day: parseInt(parts[2]),
        hour: parseInt(document.getElementById('transit_hour').value) || 12,
        minute: parseInt(document.getElementById('transit_minute').value) || 0, second: 0,
        longitude: natal.longitude, latitude: natal.latitude, timezone: natal.timezone,
        city: natal.city, nation: natal.nation, name: 'Transit'
    };
    var resp = await fetch('/api/v5/chart-data/transit', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ first_subject: natal, transit_subject: transitSubject }) });
    if (!resp.ok) { var err = await resp.json(); throw new Error(err.message || err.detail || 'خطا'); }
    var data = await resp.json();
    if (data.status !== 'OK') throw new Error(data.message || 'خطا');
    document.getElementById('result').innerHTML = displayGenericChart(data, '🌍 ترانزیت');
}

async function handleReturn(endpoint, title) {
    var subject = buildSubject('p1');
    if (!subject) throw new Error('اطلاعات چارت تولد لازم است.');
    var yearEl = document.getElementById('return_year');
    if (!yearEl || !yearEl.value) throw new Error('سال بازگشت را وارد کنید.');
    var payload = { subject: subject, year: parseInt(yearEl.value) };
    var monthEl = document.getElementById('return_month');
    if (monthEl && monthEl.value !== '0') payload.month = parseInt(monthEl.value);
    var resp = await fetch('/api/v5/chart-data/' + endpoint, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) });
    if (!resp.ok) { var err = await resp.json(); throw new Error(err.message || err.detail || 'خطا'); }
    var data = await resp.json();
    if (data.status !== 'OK') throw new Error(data.message || 'خطا');
    document.getElementById('result').innerHTML = displayGenericChart(data, title);
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
    const circle = document.getElementById('yogaCircle');
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

    const headerActions = document.querySelector('.header-actions');
    const yogaBtn = document.createElement('button');
    yogaBtn.className = 'btn-action primary';
    yogaBtn.innerHTML = '🧘 Yoga Engine';
    yogaBtn.style.marginRight = 'auto';
    yogaBtn.addEventListener('click', () => {
        if (!overlay.classList.contains('active')) {
            overlay.classList.add('active');
            startYoga();
        } else {
            stopYoga();
            overlay.classList.remove('active');
        }
    });
    headerActions.prepend(yogaBtn);

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
        <div style="max-width: 700px; margin: 0 auto;">
            <h3 style="color: #a29bfe; text-align: center;">🔮 تاروت - فال و پیش‌بینی</h3>
            
            <!-- Daily Card -->
            <div style="background: rgba(255,255,255,0.03); border-radius: 16px; padding: 20px; margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.05);">
                <h4 style="color: #fdcb6e; margin-top: 0;">🌟 کارت روزانه</h4>
                <button onclick="submitDailyCard()" style="width:100%; padding:12px; background:#6c5ce7; border:none; border-radius:30px; color:#fff; font-weight:bold; cursor:pointer;">🌟 کارت امروز را ببین</button>
                <div id="tarotDailyResult" style="margin-top: 15px;"></div>
            </div>

            <!-- Draw Cards -->
            <div style="background: rgba(255,255,255,0.03); border-radius: 16px; padding: 20px; margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.05);">
                <h4 style="color: #fdcb6e; margin-top: 0;">🃏 کشیدن کارت</h4>
                <div class="form-group">
                    <label>تعداد کارت (۱ تا ۷۸)</label>
                    <input id="tarotCount" type="number" value="3" min="1" max="78" style="width:100%; padding:10px; border-radius:8px; background:rgba(0,0,0,0.3); color:#fff; border:1px solid rgba(255,255,255,0.1);">
                </div>
                <button onclick="submitDrawCards()" style="width:100%; padding:12px; background:#6c5ce7; border:none; border-radius:30px; color:#fff; font-weight:bold; cursor:pointer;">🃏 کشیدن کارت</button>
                <div id="tarotDrawResult" style="margin-top: 15px;"></div>
            </div>

            <!-- Three Card Spread -->
            <div style="background: rgba(255,255,255,0.03); border-radius: 16px; padding: 20px; margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.05);">
                <h4 style="color: #fdcb6e; margin-top: 0;">📜 اسپرید ۳ کارتی (گذشته، حال، آینده)</h4>
                <button onclick="submitThreeCard()" style="width:100%; padding:12px; background:#6c5ce7; border:none; border-radius:30px; color:#fff; font-weight:bold; cursor:pointer;">📜 دریافت فال ۳ کارتی</button>
                <div id="tarotThreeResult" style="margin-top: 15px;"></div>
            </div>

            <!-- Celtic Cross -->
            <div style="background: rgba(255,255,255,0.03); border-radius: 16px; padding: 20px; margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.05);">
                <h4 style="color: #fdcb6e; margin-top: 0;">🔮 اسپرید سلتیک کراس (۱۰ کارتی)</h4>
                <button onclick="submitCelticCross()" style="width:100%; padding:12px; background:#6c5ce7; border:none; border-radius:30px; color:#fff; font-weight:bold; cursor:pointer;">🔮 دریافت فال عمیق</button>
                <div id="tarotCelticResult" style="margin-top: 15px;"></div>
            </div>
        </div>
    `;
}

// ---------- Tarot API Calls ----------

async function submitDailyCard() {
    const resultDiv = document.getElementById('tarotDailyResult');
    resultDiv.innerHTML = '<p style="color: #aaa;">⏳ در حال دریافت...</p>';
    try {
        const res = await fetch('/api/v5/tarot/daily');
        const data = await res.json();
        if (data.status === 'success') {
            displayTarotCard(data.data, resultDiv);
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
    resultDiv.innerHTML = '<p style="color: #aaa;">⏳ در حال کشیدن...</p>';
    try {
        const res = await fetch('/api/v5/tarot/draw', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ count, with_reversed: true })
        });
        const data = await res.json();
        if (data.status === 'success') {
            displayTarotCards(data.data, resultDiv);
        } else {
            resultDiv.innerHTML = `<p style="color: #ff6b6b;">❌ خطا: ${data.detail}</p>`;
        }
    } catch (e) {
        resultDiv.innerHTML = '<p style="color: #ff6b6b;">❌ خطا در ارتباط با سرور</p>';
    }
}

async function submitThreeCard() {
    const resultDiv = document.getElementById('tarotThreeResult');
    resultDiv.innerHTML = '<p style="color: #aaa;">⏳ در حال دریافت...</p>';
    try {
        const res = await fetch('/api/v5/tarot/spread/three');
        const data = await res.json();
        if (data.status === 'success') {
            displayTarotSpread(data.data, resultDiv);
        } else {
            resultDiv.innerHTML = `<p style="color: #ff6b6b;">❌ خطا: ${data.detail}</p>`;
        }
    } catch (e) {
        resultDiv.innerHTML = '<p style="color: #ff6b6b;">❌ خطا در ارتباط با سرور</p>';
    }
}

async function submitCelticCross() {
    const resultDiv = document.getElementById('tarotCelticResult');
    resultDiv.innerHTML = '<p style="color: #aaa;">⏳ در حال دریافت...</p>';
    try {
        const res = await fetch('/api/v5/tarot/spread/celtic');
        const data = await res.json();
        if (data.status === 'success') {
            displayTarotSpread(data.data, resultDiv);
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
                <img src="${imgUrl}" class="tarot-card-image${isReversed ? ' reversed' : ''}" style="width: 140px; height: auto; border-radius: 12px; border: 2px solid rgba(255,255,255,0.15); flex-shrink: 0; transition: transform 0.3s ease;" alt="${card.name || ''}" onerror="this.src='/static/tarot/images/placeholder.webp'">
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
        html += `
            <div style="background: rgba(108,92,231,0.08); border: 1px solid rgba(108,92,231,0.2); border-radius: 12px; padding: 15px; margin-top: 10px; display: flex; gap: 15px; align-items: flex-start;">
                <img src="${imgUrl}" class="tarot-card-image${isReversed ? ' reversed' : ''}" style="width: 80px; height: auto; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); flex-shrink: 0; transition: transform 0.3s ease;" alt="${card.name || ''}" onerror="this.src='/static/tarot/images/placeholder.webp'">
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
        html += `
            <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 15px; margin-top: 10px; display: flex; gap: 15px; align-items: flex-start;">
                <img src="${imgUrl}" class="tarot-card-image${isReversed ? ' reversed' : ''}" style="width: 80px; height: auto; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); flex-shrink: 0; transition: transform 0.3s ease;" alt="${card.name || ''}" onerror="this.src='/static/tarot/images/placeholder.webp'">
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
        <div style="max-width: 700px; margin: 0 auto;">
            <h3 style="color: #a29bfe; text-align: center;">🔢 عددشناسی - رمز اعداد زندگی</h3>

            <!-- Life Path Number -->
            <div style="background: rgba(255,255,255,0.03); border-radius: 16px; padding: 20px; margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.05);">
                <h4 style="color: #fdcb6e; margin-top: 0;">🛤️ عدد مسیر زندگی</h4>
                <div class="form-group"><label>سال تولد</label><input id="numYear" type="number" value="1990"></div>
                <div class="form-group"><label>ماه تولد</label><input id="numMonth" type="number" value="1"></div>
                <div class="form-group"><label>روز تولد</label><input id="numDay" type="number" value="1"></div>
                <button onclick="submitLifePath()" style="width:100%; padding:12px; background:#6c5ce7; border:none; border-radius:30px; color:#fff; font-weight:bold; cursor:pointer;">🛤️ محاسبه مسیر زندگی</button>
                <div id="numLifePathResult" style="margin-top: 15px;"></div>
            </div>

            <!-- Personal Year -->
            <div style="background: rgba(255,255,255,0.03); border-radius: 16px; padding: 20px; margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.05);">
                <h4 style="color: #fdcb6e; margin-top: 0;">📅 سال شخصی</h4>
                <div class="form-group"><label>سال تولد</label><input id="pyYear" type="number" value="1990"></div>
                <div class="form-group"><label>ماه تولد</label><input id="pyMonth" type="number" value="1"></div>
                <div class="form-group"><label>روز تولد</label><input id="pyDay" type="number" value="1"></div>
                <div class="form-group"><label>سال هدف (اختیاری، خالی = سال جاری)</label><input id="pyTarget" type="number" placeholder="مثلاً 2026"></div>
                <button onclick="submitPersonalYear()" style="width:100%; padding:12px; background:#6c5ce7; border:none; border-radius:30px; color:#fff; font-weight:bold; cursor:pointer;">📅 محاسبه سال شخصی</button>
                <div id="numPersonalYearResult" style="margin-top: 15px;"></div>
            </div>

            <!-- Expression Number -->
            <div style="background: rgba(255,255,255,0.03); border-radius: 16px; padding: 20px; margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.05);">
                <h4 style="color: #fdcb6e; margin-top: 0;">✍️ عدد بیان (از نام کامل)</h4>
                <div class="form-group"><label>نام کامل</label><input id="numName" value="علی"></div>
                <button onclick="submitExpression()" style="width:100%; padding:12px; background:#6c5ce7; border:none; border-radius:30px; color:#fff; font-weight:bold; cursor:pointer;">✍️ محاسبه عدد بیان</button>
                <div id="numExpressionResult" style="margin-top: 15px;"></div>
            </div>

            <!-- Soul Urge Number -->
            <div style="background: rgba(255,255,255,0.03); border-radius: 16px; padding: 20px; margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.05);">
                <h4 style="color: #fdcb6e; margin-top: 0;">❤️ عدد درونی (از حروف صدادار)</h4>
                <div class="form-group"><label>نام کامل</label><input id="numSoulName" value="علی"></div>
                <button onclick="submitSoulUrge()" style="width:100%; padding:12px; background:#6c5ce7; border:none; border-radius:30px; color:#fff; font-weight:bold; cursor:pointer;">❤️ محاسبه عدد درونی</button>
                <div id="numSoulUrgeResult" style="margin-top: 15px;"></div>
            </div>

            <!-- Compatibility -->
            <div style="background: rgba(255,255,255,0.03); border-radius: 16px; padding: 20px; margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.05);">
                <h4 style="color: #fdcb6e; margin-top: 0;">💞 سازگاری عددی</h4>
                <div class="form-group"><label>عدد اول</label><input id="numComp1" type="number" value="1"></div>
                <div class="form-group"><label>عدد دوم</label><input id="numComp2" type="number" value="2"></div>
                <button onclick="submitCompatibility()" style="width:100%; padding:12px; background:#6c5ce7; border:none; border-radius:30px; color:#fff; font-weight:bold; cursor:pointer;">💞 بررسی سازگاری</button>
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
    resultDiv.innerHTML = '<p style="color:#aaa;">⏳ در حال محاسبه...</p>';
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
    resultDiv.innerHTML = '<p style="color:#aaa;">⏳ در حال محاسبه...</p>';
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
    resultDiv.innerHTML = '<p style="color:#aaa;">⏳ در حال محاسبه...</p>';
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
    resultDiv.innerHTML = '<p style="color:#aaa;">⏳ در حال محاسبه...</p>';
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
    resultDiv.innerHTML = '<p style="color:#aaa;">⏳ در حال بررسی...</p>';
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
// ================================================================
window.addEventListener('DOMContentLoaded', function() {
    // Build initial birth form
    if (formBuilders && formBuilders['birth']) {
        formContainer.innerHTML = formBuilders['birth']();
        attachCityAutocomplete();
        reattachMapButton();
    }
    // Map modal close/confirm listeners (static elements in HTML)
    if (closeMapBtn) closeMapBtn.addEventListener('click', function() { mapModal.classList.remove('active'); });
    if (confirmLocationBtn) confirmLocationBtn.addEventListener('click', function() { mapModal.classList.remove('active'); });
    if (mapModal) mapModal.addEventListener('click', function(e) { if (e.target === mapModal) mapModal.classList.remove('active'); });

    // Set default date to 20 years ago
    var today = new Date();
    var y = today.getFullYear() - 20;
    var m = String(today.getMonth() + 1).padStart(2, '0');
    var d = String(today.getDate()).padStart(2, '0');
    var bd = document.getElementById('birthDate');
    if (bd) bd.value = y + '-' + m + '-' + d;
});