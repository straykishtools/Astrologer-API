import re

with open('static/script.js', 'r', encoding='utf-8') as f:
    content = f.read()

# ---- PHASE 1: Remove old calcBtn handler (keep DISPLAY RESULT intact) ----
display_marker = '// ================================================================\r\n//   DISPLAY RESULT'
display_pos = content.find(display_marker)
if display_pos == -1:
    display_marker = '// ================================================================\n//   DISPLAY RESULT'
    display_pos = content.find(display_marker)

# Find where MAIN APPLICATION section starts
main_app_start = content.find("let currentData = null;")
if main_app_start == -1:
    main_app_start = content.find("let currentContext = null;")

# Go back to find the section comment above
line_start = content.rfind('// ====', 0, main_app_start)

# Remove everything from section comment to just before DISPLAY RESULT
content = content[:line_start] + content[display_pos:]
print(f"Phase 1: removed old handler, size={len(content)}")

# ---- PHASE 2: Find INIT position and insert new code before it ----
init_marker = '// ================================================================\r\n//   INIT'
init_pos = content.find(init_marker)
if init_pos == -1:
    init_marker = '// ================================================================\n//   INIT'
    init_pos = content.find(init_marker)

# ---- PHASE 3: Build new code blocks ----
NEW_CODE = r"""// ================================================================
//   TAB SWITCHING & FORM BUILDERS
// ================================================================
let currentTab = 'birth';
const formContainer = document.getElementById('formContainer');
const calcBtn = document.getElementById('calcBtn');
const formTitle = document.getElementById('formTitle');

function buildBirthForm() {
    const hours = Array.from({length:24}, (_,i) => '<option value="'+i+'">'+String(i).padStart(2,'0')+':00</option>').join('');
    const mins = Array.from({length:12}, (_,i) => '<option value="'+(i*5)+'">'+String(i*5).padStart(2,'0')+'</option>').join('');
    return `
        <div class="form-grid">
            <div class="form-group"><label>👤 نام</label><input type="text" id="userName" value="کاربر" placeholder="نام"></div>
            <div class="form-group"><label>📅 تاریخ تولد</label><input type="date" id="birthDate"></div>
            <div class="form-group"><label>⏰ ساعت تولد</label><select id="birthHour">${hours}</select></div>
            <div class="form-group"><label>⏱️ دقیقه</label><select id="birthMinute">${mins}</select></div>
            <div class="form-group full"><label>🏙️ شهر تولد</label><div class="city-search"><input type="text" id="cityName" placeholder="نام شهر را فارسی تایپ کنید..." autocomplete="off"><button type="button" id="openMapBtn">📍 انتخاب روی نقشه</button></div></div>
            <div class="form-group"><label>🌍 عرض جغرافیایی</label><input type="number" id="latitude" step="0.0001" value="35.6892" placeholder="35.6892"></div>
            <div class="form-group"><label>🌍 طول جغرافیایی</label><input type="number" id="longitude" step="0.0001" value="51.3890" placeholder="51.3890"></div>
            <div class="form-group"><label>🕐 منطقه زمانی</label><select id="timezone"><option value="-12">UTC -12</option><option value="-11">UTC -11</option><option value="-10">UTC -10</option><option value="-9">UTC -9</option><option value="-8">UTC -8</option><option value="-7">UTC -7</option><option value="-6">UTC -6</option><option value="-5">UTC -5</option><option value="-4">UTC -4</option><option value="-3">UTC -3</option><option value="-2">UTC -2</option><option value="-1">UTC -1</option><option value="0">UTC 0</option><option value="1">UTC +1</option><option value="2">UTC +2</option><option value="3">UTC +3</option><option value="3.5" selected>UTC +3:30 (تهران)</option><option value="4">UTC +4</option><option value="4.5">UTC +4:30</option><option value="5">UTC +5</option><option value="5.5">UTC +5:30</option><option value="5.75">UTC +5:45</option><option value="6">UTC +6</option><option value="7">UTC +7</option><option value="8">UTC +8</option><option value="9">UTC +9</option><option value="9.5">UTC +9:30</option><option value="10">UTC +10</option><option value="11">UTC +11</option><option value="12">UTC +12</option></select></div>
            <div class="form-group"><label>🌐 نوع برج</label><select id="zodiacType"><option value="tropical">Tropical</option><option value="sidereal">Sidereal</option></select></div>
        </div>`;
}

function buildPersonForm(id, label, badge) {
    const hours = Array.from({length:24}, (_,i) => '<option value="'+i+'">'+String(i).padStart(2,'0')+':00</option>').join('');
    const mins = Array.from({length:12}, (_,i) => '<option value="'+(i*5)+'">'+String(i*5).padStart(2,'0')+'</option>').join('');
    return `
        <div class="person-label">👤 ${label} <span class="person-badge">${badge}</span></div>
        <div class="form-section"><div class="form-grid">
            <div class="form-group"><label>👤 نام</label><input type="text" id="${id}_name" value="${label}" placeholder="نام"></div>
            <div class="form-group"><label>📅 تاریخ تولد</label><input type="date" id="${id}_date"></div>
            <div class="form-group"><label>⏰ ساعت</label><select id="${id}_hour">${hours}</select></div>
            <div class="form-group"><label>⏱️ دقیقه</label><select id="${id}_minute">${mins}</select></div>
            <div class="form-group full"><label>🏙️ شهر</label><div class="city-search"><input type="text" id="${id}_city" placeholder="نام شهر" autocomplete="off"></div></div>
            <div class="form-group"><label>🌍 عرض</label><input type="number" id="${id}_lat" step="0.0001" value="35.6892"></div>
            <div class="form-group"><label>🌍 طول</label><input type="number" id="${id}_lng" step="0.0001" value="51.3890"></div>
            <div class="form-group"><label>🕐 timezone</label><select id="${id}_tz"><option value="3.5" selected>UTC +3:30</option><option value="0">UTC 0</option><option value="-5">UTC -5</option><option value="1">UTC +1</option><option value="8">UTC +8</option></select></div>
        </div></div>`;
}

const formBuilders = {
    'birth': () => { formTitle.innerHTML = '🪐 اطلاعات تولد <span>دقیق و حرفه‌ای</span>'; calcBtn.innerHTML = '🔮 دریافت چارت و تحلیل کامل'; return buildBirthForm(); },
    'synastry': () => { formTitle.innerHTML = '💕 سیناستری <span>تطبیق دو چارت</span>'; calcBtn.innerHTML = '💕 محاسبه سیناستری'; return buildPersonForm('p1', 'شخص اول', 'inner wheel') + '<div class="person-divider"><span>+</span></div>' + buildPersonForm('p2', 'شخص دوم', 'outer wheel'); },
    'composite': () => { formTitle.innerHTML = '🔗 کامپوزیت <span>میانگین دو چارت</span>'; calcBtn.innerHTML = '🔗 محاسبه کامپوزیت'; return buildPersonForm('p1', 'شخص اول', 'primary') + '<div class="person-divider"><span>🔗</span></div>' + buildPersonForm('p2', 'شخص دوم', 'secondary'); },
    'transit': () => {
        formTitle.innerHTML = '🌍 ترانزیت <span>تأثیر فعلی بر چارت تولد</span>';
        calcBtn.innerHTML = '🌍 محاسبه ترانزیت';
        const hours = Array.from({length:24}, (_,i) => '<option value="'+i+'">'+String(i).padStart(2,'0')+':00</option>').join('');
        const mins = Array.from({length:12}, (_,i) => '<option value="'+(i*5)+'">'+String(i*5).padStart(2,'0')+'</option>').join('');
        return buildPersonForm('p1', 'چارت تولد (natal)', 'natal') +
            '<div class="person-divider"><span>🌍</span></div>' +
            '<div class="person-label">🌍 لحظه ترانزیت <span class="person-badge">current moment</span></div>' +
            '<div class="form-section"><div class="form-grid">' +
            '<div class="form-group"><label>📅 تاریخ ترانزیت</label><input type="date" id="transit_date"></div>' +
            '<div class="form-group"><label>⏰ ساعت</label><select id="transit_hour">' + hours + '</select></div>' +
            '<div class="form-group"><label>⏱️ دقیقه</label><select id="transit_minute">' + mins + '</select></div>' +
            '</div></div>';
    },
    'solar-return': () => {
        formTitle.innerHTML = '☀️ بازگشت خورشیدی <span>چارت سالانه</s
