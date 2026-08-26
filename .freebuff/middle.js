// ================================================================
//   TAB SWITCHING & FORM BUILDERS
// ================================================================
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

function displayGenericChart(data, title) {
    var chart = data.chart_data || data;
    var subject = chart.subject || {};
    var html = '<div class="section-card visible"><div class="section-title"><span class="emoji-big">🪐</span> '+title+'</div><div class="grid-masonry">';
    if (subject.first_subject || subject.inner_subject) {
        var s1 = subject.first_subject || subject.inner_subject;
        var s2 = subject.second_subject || subject.outer_subject;
        html += '<div class="person-label">👤 شخص اول</div>' + renderPlanetGrid(s1);
        html += '<div class="person-label">👤 شخص دوم</div>' + renderPlanet
Grid(s1);
        html += '<div class="person-label">👤 شخص دوم</div>' + renderPlanetGrid(s2);
    } else {
        html += renderPlanetGrid(subject);
    }
    html += '</div></div>';
    if (chart.aspects && chart.aspects.length > 0) {
        html += '<div class="section-card visible"><div class="section-title"><span class="emoji-big">⚡</span> جنبه‌ها <span class="badge-count">'+chart.aspects.length+'</span></div><div class="grid-flex">';
        chart.aspects.forEach(function(a) {
            html += '<span class="aspect-item visible">'+translate(a.p1_name||'')+' '+translate(a.aspect||'')+' '+translate(a.p2_name||'')+' ('+(a.orbit?a.orbit.toFixed(1):'?')+'°)</span>';
        });
        html += '</div></div>';
    }
    if (chart.relationship_score) {
        var rs = chart.relationship_score;
        html += '<div class="section-card visible"><div class="section-title"><span class="emoji-big">💕</span> امتیاز</div><div class="analysis-box"><h2>🏆 امتیاز: '+(rs.score_value||rs.score||'?')+' / 100</h2><p>'+(rs.score_description||'')+'</p></div></div>';
    }
    return html;
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
