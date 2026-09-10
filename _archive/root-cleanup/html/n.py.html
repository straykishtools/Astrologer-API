<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🌌 سامانهٔ کاوش ناسا</title>
    <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Vazirmatn', sans-serif; background: linear-gradient(145deg, #0b0e1a 0%, #1a1f2f 100%); color: #e0e8f0; min-height: 100vh; padding: 20px; }
        .container { max-width: 1400px; margin: 0 auto; }
        header { text-align: center; padding: 30px 0 20px; border-bottom: 1px solid #2a3a5a; margin-bottom: 30px; }
        header h1 { font-size: 2.5rem; font-weight: 700; background: linear-gradient(135deg, #f9d976, #f39c12); -webkit-background-clip: text; -webkit-text-fill-color: transparent; text-shadow: 0 0 30px rgba(243, 156, 18, 0.2); }
        header p { color: #8899bb; font-size: 1rem; margin-top: 8px; }
        .tabs { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; margin-bottom: 30px; }
        .tab-btn { background: #1e2740; border: none; color: #b0c4e0; padding: 12px 24px; border-radius: 50px; font-size: 0.95rem; font-family: inherit; cursor: pointer; transition: all 0.25s ease; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.3); }
        .tab-btn i { font-size: 1.1rem; }
        .tab-btn:hover { background: #2a3560; color: #fff; transform: translateY(-2px); }
        .tab-btn.active { background: #f39c12; color: #0b0e1a; font-weight: 700; box-shadow: 0 0 20px rgba(243, 156, 18, 0.3); }
        .panel { display: none; background: rgba(20, 28, 48, 0.7); backdrop-filter: blur(8px); border-radius: 24px; padding: 28px; border: 1px solid #2a3a5a; box-shadow: 0 10px 40px rgba(0,0,0,0.5); animation: fadeIn 0.4s ease; }
        .panel.active { display: block; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        .panel h2 { font-size: 1.8rem; margin-bottom: 20px; display: flex; align-items: center; gap: 12px; color: #f1c40f; }
        .panel h2 i { font-size: 2rem; }
        .input-group { display: flex; flex-wrap: wrap; gap: 15px; margin-bottom: 25px; align-items: flex-end; }
        .input-group label { display: flex; flex-direction: column; gap: 5px; font-size: 0.9rem; color: #aabbdd; }
        .input-group input, .input-group select { padding: 10px 16px; border-radius: 12px; border: 1px solid #2a4060; background: #111a2e; color: #e0e8f0; font-family: inherit; font-size: 0.95rem; min-width: 180px; transition: border 0.2s; }
        .input-group input:focus, .input-group select:focus { outline: none; border-color: #f39c12; box-shadow: 0 0 0 3px rgba(243, 156, 18, 0.2); }
        .btn-primary { background: #f39c12; color: #0b0e1a; border: none; padding: 10px 28px; border-radius: 50px; font-weight: 700; font-family: inherit; font-size: 1rem; cursor: pointer; transition: all 0.2s; display: inline-flex; align-items: center; gap: 8px; box-shadow: 0 4px 15px rgba(243, 156, 18, 0.3); }
        .btn-primary:hover { background: #e08e0b; transform: scale(1.02); box-shadow: 0 6px 25px rgba(243, 156, 18, 0.5); }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .result-box { background: #0f1628; border-radius: 16px; padding: 20px; max-height: 500px; overflow-y: auto; border: 1px solid #1f2f4a; margin-top: 15px; white-space: pre-wrap; word-wrap: break-word; font-size: 0.9rem; line-height: 1.7; color: #c8d8ee; }
        .result-box img { max-width: 100%; border-radius: 12px; margin: 10px 0; box-shadow: 0 4px 20px rgba(0,0,0,0.5); }
        .result-box .image-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px; }
        .result-box .image-grid img { width: 100%; height: 180px; object-fit: cover; border-radius: 12px; transition: transform 0.2s; }
        .result-box .image-grid img:hover { transform: scale(1.03); }
        .loading { display: inline-block; width: 20px; height: 20px; border: 3px solid #2a4060; border-top: 3px solid #f39c12; border-radius: 50%; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .error-msg { color: #ff6b6b; background: #2a0f0f; padding: 12px 18px; border-radius: 12px; border-right: 4px solid #ff6b6b; }
        .planet-card { background: #111b30; border-radius: 16px; padding: 18px; border: 1px solid #2a4060; box-shadow: 0 4px 15px rgba(0,0,0,0.4); transition: transform 0.2s; text-align: center; }
        .planet-card:hover { transform: translateY(-4px); }
        .planet-icon { font-size: 2.8rem; margin-bottom: 8px; }
        .planet-name { font-weight: 700; font-size: 1.2rem; color: #f1c40f; }
        .planet-detail { font-size: 0.9rem; color: #aabbdd; margin: 4px 0; }
        .planet-retrograde { color: #ff6b6b; font-weight: 700; }
        .planet-direct { color: #2ecc71; font-weight: 700; }
        .sign-badge { display: inline-block; background: #2a5f7a; padding: 2px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; }
        .mars-card { background: #111b30; border-radius: 16px; padding: 18px; border: 1px solid #2a4060; box-shadow: 0 4px 15px rgba(0,0,0,0.4); transition: transform 0.2s; }
        .mars-card:hover { transform: translateY(-4px); }
        .footer { text-align: center; margin-top: 40px; color: #556688; font-size: 0.85rem; border-top: 1px solid #1f2f4a; padding-top: 20px; }
        .flatpickr-calendar { background: #1a1f2f !important; border-color: #2a4060 !important; color: #e0e8f0 !important; }
        .flatpickr-day { color: #e0e8f0 !important; }
        .flatpickr-day.selected { background: #f39c12 !important; border-color: #f39c12 !important; }
        .flatpickr-months .flatpickr-month { color: #f1c40f !important; }
        /* چارت دایره‌ای */
        .chart-container { background: #0f1628; border-radius: 16px; padding: 20px; border: 1px solid #1f2f4a; margin-top: 20px; text-align: center; overflow-x: auto; }
        .chart-container svg { max-width: 100%; height: auto; }
        @media (max-width: 700px) { .tabs .tab-btn { font-size: 0.8rem; padding: 8px 16px; } .input-group label { width: 100%; } .input-group input { width: 100%; min-width: unset; } }
    </style>
</head>
<body>
<div class="container">
    <header>
        <h1><i class="fas fa-rocket" style="-webkit-text-fill-color: initial; color: #f39c12;"></i> سامانهٔ کاوش ناسا</h1>
        <p>داده‌های واقعی از فضا – APOD، تصاویر، آب‌وهوای فضا، سیارک‌ها، مریخ و موقعیت سیارات</p>
    </header>

    <div class="tabs" id="tabButtons">
        <button class="tab-btn active" data-tab="apod"><i class="fas fa-image"></i> APOD</button>
        <button class="tab-btn" data-tab="images"><i class="fas fa-photo-video"></i> تصاویر</button>
        <button class="tab-btn" data-tab="spaceweather"><i class="fas fa-sun"></i> آب‌وهوای فضا</button>
        <button class="tab-btn" data-tab="asteroids"><i class="fas fa-meteor"></i> سیارک‌ها</button>
        <button class="tab-btn" data-tab="mars"><i class="fas fa-mars"></i> آب‌وهوای مریخ</button>
        <button class="tab-btn" data-tab="planets"><i class="fas fa-globe"></i> موقعیت سیارات</button>
    </div>

    <!-- ==================== پنل‌ها ==================== -->

    <!-- 1. APOD -->
    <div id="apod" class="panel active">
        <h2><i class="fas fa-image"></i> تصویر نجومی روز (APOD)</h2>
        <div class="input-group">
            <label>تاریخ (اختیاری) <input type="text" id="apodDate" placeholder="انتخاب تاریخ"></label>
            <button class="btn-primary" id="fetchApod"><i class="fas fa-sync-alt"></i> دریافت</button>
        </div>
        <div id="apodResult" class="result-box">برای دریافت تصویر، دکمه را بزنید...</div>
    </div>

    <!-- 2. تصاویر -->
    <div id="images" class="panel">
        <h2><i class="fas fa-photo-video"></i> جستجوی تصاویر ناسا</h2>
        <div class="input-group">
            <label>کلمه کلیدی <input type="text" id="imageQuery" placeholder="مثلاً: nebula" value="galaxy"></label>
            <label>صفحه <input type="number" id="imagePage" value="1" min="1"></label>
            <button class="btn-primary" id="fetchImages"><i class="fas fa-search"></i> جستجو</button>
        </div>
        <div id="imagesResult" class="result-box">نتایج جستجو در اینجا نمایش داده می‌شود...</div>
    </div>

    <!-- 3. آب‌وهوای فضا -->
    <div id="spaceweather" class="panel">
        <h2><i class="fas fa-sun"></i> آب‌وهوای فضا (DONKI)</h2>
        <div class="input-group">
            <label>تاریخ شروع <input type="text" id="swStart" placeholder="شروع"></label>
            <label>تاریخ پایان <input type="text" id="swEnd" placeholder="پایان"></label>
            <button class="btn-primary" id="fetchSw"><i class="fas fa-cloud-sun"></i> دریافت رویدادها</button>
            <button class="btn-primary" id="fetchSwSummary" style="background: #2a6f9c;"><i class="fas fa-list-ul"></i> خلاصه</button>
        </div>
        <div id="swResult" class="result-box">رویدادهای فضایی در اینجا نشان داده می‌شوند...</div>
    </div>

    <!-- 4. سیارک‌ها (گرافیکی) -->
    <div id="asteroids" class="panel">
        <h2><i class="fas fa-meteor"></i> سیارک‌های نزدیک به زمین</h2>
        <div class="input-group">
            <label>تاریخ شروع <input type="text" id="astStart" placeholder="شروع"></label>
            <label>تاریخ پایان <input type="text" id="astEnd" placeholder="پایان"></label>
            <button class="btn-primary" id="fetchAsteroids"><i class="fas fa-search"></i> دریافت</button>
        </div>
        <div id="asteroidsResult" style="max-height: none; padding: 15px;">
            <div id="asteroidsSummary" style="display: flex; gap: 20px; flex-wrap: wrap; margin-bottom: 15px; padding: 10px; background: #0f1628; border-radius: 12px;"></div>
            <div id="asteroidsCards" style="display: flex; flex-direction: column; gap: 25px;"></div>
        </div>
    </div>

    <!-- 5. آب‌وهوای مریخ (گرافیکی) -->
    <div id="mars" class="panel">
        <h2><i class="fas fa-mars"></i> آب‌وهوای مریخ (InSight)</h2>
        <button class="btn-primary" id="fetchMars"><i class="fas fa-cloud-sun"></i> دریافت آخرین گزارش</button>
        <div id="marsResult" style="max-height: none; padding: 15px;">
            <div id="marsCards" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; margin-top: 10px;"></div>
        </div>
    </div>

    <!-- 6. موقعیت سیارات (گرافیکی + چارت) -->
    <div id="planets" class="panel">
        <h2><i class="fas fa-globe"></i> موقعیت سیارات در برج‌های فلکی</h2>
        <div class="input-group">
            <label>تاریخ <input type="text" id="planetDate" placeholder="تاریخ"></label>
            <button class="btn-primary" id="fetchPlanets"><i class="fas fa-globe-americas"></i> دریافت موقعیت</button>
        </div>
        <div id="planetsResult" style="max-height: none; padding: 15px;">
            <div id="planetsCards" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 15px; margin-top: 10px;"></div>
            <div class="chart-container" id="planetChartContainer" style="display: none;">
                <h3 style="color: #f1c40f; margin-bottom: 15px;">نمودار موقعیت سیارات در منطقه‌البروج</h3>
                <div id="planetChart"></div>
            </div>
        </div>
    </div>

    <div class="footer">
        <i class="fas fa-code"></i> طراحی شده برای تست APIهای ناسا – بک‌اند روی پورت ۸۰۰۰
    </div>
</div>

<!-- ========== اسکریپت‌ها ========== -->
<script src="https://cdn.jsdelivr.net/npm/flatpickr"></script>
<script src="https://cdn.jsdelivr.net/npm/flatpickr/dist/l10n/fa.js"></script>

<script>
    // ========== تنظیمات ==========
    const API_BASE = 'http://localhost:8000/api/v5/nasa';

    // ========== توابع کمکی ==========
    async function callApi(endpoint, options = {}) {
        const url = API_BASE + endpoint;
        const res = await fetch(url, {
            headers: { 'Accept': 'application/json' },
            ...options
        });
        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`خطای ${res.status}: ${errText}`);
        }
        return await res.json();
    }

    function showResult(elementId, data, isImage = false) {
        const el = document.getElementById(elementId);
        if (!data) { el.innerHTML = '<span class="error-msg">داده‌ای دریافت نشد.</span>'; return; }
        if (data.error) { el.innerHTML = `<span class="error-msg">⚠️ ${data.error}</span>`; return; }
        if (isImage && data.data && data.data.url) {
            let html = `<img src="${data.data.url}" alt="APOD" style="max-height:400px;">`;
            html += `<p><strong>عنوان:</strong> ${data.data.title || 'بدون عنوان'}</p>`;
            html += `<p><strong>توضیح:</strong> ${data.data.explanation || ''}</p>`;
            if (data.data.copyright) html += `<p><strong>حقوق:</strong> ${data.data.copyright}</p>`;
            el.innerHTML = html;
            return;
        }
        el.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
    }

    function showImages(elementId, data) {
        const el = document.getElementById(elementId);
        if (!data || !data.data || !data.data.collection || !data.data.collection.items) {
            el.innerHTML = '<span class="error-msg">تصویری یافت نشد.</span>';
            return;
        }
        const items = data.data.collection.items;
        if (items.length === 0) {
            el.innerHTML = '<span class="error-msg">هیچ تصویری برای این جستجو یافت نشد.</span>';
            return;
        }
        let html = `<div class="image-grid">`;
        items.forEach(item => {
            const links = item.links || [];
            const imgLink = links.find(l => l.rel === 'preview' && l.href);
            if (imgLink) {
                html += `<img src="${imgLink.href}" alt="${item.data[0]?.title || 'تصویر'}" loading="lazy">`;
            }
        });
        html += `</div><p>${items.length} تصویر یافت شد.</p>`;
        el.innerHTML = html;
    }

    // ========== رندر سیارک‌ها (با orbit_class) ==========
    function renderAsteroids(data) {
        const summaryEl = document.getElementById('asteroidsSummary');
        const cardsEl = document.getElementById('asteroidsCards');
        cardsEl.innerHTML = '';
        
        if (!data || !data.data || !data.data.asteroids_by_date) {
            summaryEl.innerHTML = '<span class="error-msg">داده‌ای برای نمایش وجود ندارد.</span>';
            return;
        }

        const asteroidsByDate = data.data.asteroids_by_date;
        const totalCount = data.data.element_count || 0;
        const hazardousCount = data.data.hazardous_count || 0;

        summaryEl.innerHTML = `
            <div style="background: #1a2740; padding: 10px 20px; border-radius: 12px; flex: 1; text-align: center;">
                <i class="fas fa-asterisk" style="color: #f39c12;"></i>
                <span style="font-weight: 700; font-size: 1.2rem; margin-right: 8px;">${totalCount}</span>
                <span style="color: #aabbdd;">سیارک</span>
            </div>
            <div style="background: #2a1a1a; padding: 10px 20px; border-radius: 12px; flex: 1; text-align: center; border: 1px solid #e74c3c;">
                <i class="fas fa-exclamation-triangle" style="color: #e74c3c;"></i>
                <span style="font-weight: 700; font-size: 1.2rem; margin-right: 8px; color: #e74c3c;">${hazardousCount}</span>
                <span style="color: #e74c3c;">خطرناک</span>
            </div>
            <div style="background: #1a2a1a; padding: 10px 20px; border-radius: 12px; flex: 1; text-align: center;">
                <i class="fas fa-calendar-alt" style="color: #85c1e9;"></i>
                <span style="font-weight: 700; font-size: 1rem; margin-right: 8px; color: #85c1e9;">${data.data.date_range.start} — ${data.data.date_range.end}</span>
            </div>
        `;

        const sortedDates = Object.keys(asteroidsByDate).sort();
        sortedDates.forEach(date => {
            const asteroids = asteroidsByDate[date];
            if (!asteroids || asteroids.length === 0) return;

            const dateHeader = document.createElement('div');
            dateHeader.style.cssText = `
                background: #1a2740;
                padding: 12px 20px;
                border-radius: 12px;
                margin-bottom: 10px;
                border-right: 4px solid #f39c12;
                font-weight: 700;
                font-size: 1.1rem;
                display: flex;
                justify-content: space-between;
                align-items: center;
            `;
            dateHeader.innerHTML = `
                <span><i class="fas fa-calendar-day" style="color: #f39c12;"></i> ${date}</span>
                <span style="font-size: 0.9rem; color: #aabbdd;">${asteroids.length} سیارک</span>
            `;
            cardsEl.appendChild(dateHeader);

            const cardGrid = document.createElement('div');
            cardGrid.style.cssText = `
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                gap: 15px;
                margin-bottom: 25px;
            `;

            asteroids.forEach(asteroid => {
                const isHazardous = asteroid.is_hazardous;
                const orbitClass = asteroid.orbit_class || 'نامشخص';
                const card = document.createElement('div');
                card.style.cssText = `
                    background: ${isHazardous ? '#2a1a1a' : '#111b30'};
                    border-radius: 16px;
                    padding: 18px;
                    border: 1px solid ${isHazardous ? '#e74c3c' : '#2a4060'};
                    box-shadow: 0 4px 15px rgba(0,0,0,0.4);
                    transition: transform 0.2s;
                    position: relative;
                    overflow: hidden;
                `;
                if (isHazardous) {
                    card.style.borderTop = '4px solid #e74c3c';
                }

                const avgDiameter = ((asteroid.diameter_min_m + asteroid.diameter_max_m) / 2).toFixed(0);
                const diameterRange = `${asteroid.diameter_min_m.toFixed(0)} - ${asteroid.diameter_max_m.toFixed(0)} متر`;

                card.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                        <div style="flex: 1;">
                            <div style="font-weight: 700; font-size: 1.05rem; color: ${isHazardous ? '#ff6b6b' : '#f1c40f'};">
                                ${asteroid.name}
                                ${isHazardous ? ' <i class="fas fa-exclamation-triangle" style="color: #e74c3c; font-size: 1rem;"></i>' : ''}
                            </div>
                            <div style="font-size: 0.75rem; color: #667799; direction: ltr; text-align: left;">ID: ${asteroid.id}</div>
                        </div>
                        <div style="background: ${isHazardous ? '#e74c3c' : '#2a5f7a'}; padding: 2px 12px; border-radius: 20px; font-size: 0.7rem; font-weight: 700; color: #fff; white-space: nowrap;">
                            ${isHazardous ? '⚠️ خطرناک' : '✅ امن'}
                        </div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 12px 0; font-size: 0.9rem;">
                        <div>
                            <i class="fas fa-circle" style="color: #f39c12; font-size: 0.6rem;"></i>
                            <span style="color: #aabbdd;">قطر:</span>
                            <span style="font-weight: 700;">~${avgDiameter} متر</span>
                            <div style="font-size: 0.65rem; color: #556688;">${diameterRange}</div>
                        </div>
                        <div>
                            <i class="fas fa-tachometer-alt" style="color: #85c1e9;"></i>
                            <span style="color: #aabbdd;">سرعت:</span>
                            <span style="font-weight: 700;">${parseFloat(asteroid.velocity_km_s).toFixed(2)} km/s</span>
                        </div>
                        <div style="grid-column: span 2;">
                            <i class="fas fa-arrows-alt-h" style="color: #2ecc71;"></i>
                            <span style="color: #aabbdd;">فاصله:</span>
                            <span style="font-weight: 700;">${parseFloat(asteroid.miss_distance_km).toLocaleString('fa-IR')} کیلومتر</span>
                            <span style="font-size: 0.7rem; color: #556688; margin-right: 8px;">
                                (≈ ${(parseFloat(asteroid.miss_distance_km) / 384400).toFixed(1)} × فاصلهٔ ماه)
                            </span>
                        </div>
                        <div style="grid-column: span 2; font-size: 0.85rem; background: #0f1628; padding: 4px 10px; border-radius: 8px;">
                            <i class="fas fa-orbital" style="color: #aabbdd;"></i>
                            <span style="color: #aabbdd;">نوع مدار:</span>
                            <span style="font-weight: 700; color: #85c1e9;">${orbitClass}</span>
                        </div>
                    </div>
                    
                    <div style="font-size: 0.7rem; color: #667799; border-top: 1px solid #1f2f4a; padding-top: 8px; margin-top: 6px; display: flex; justify-content: space-between;">
                        <span><i class="fas fa-calendar-check"></i> نزدیک‌ترین: ${asteroid.close_approach_date}</span>
                        <a href="${asteroid.nasa_jpl_url}" target="_blank" style="color: #85c1e9; text-decoration: none; font-weight: 700;">
                            <i class="fas fa-external-link-alt"></i> JPL
                        </a>
                    </div>
                `;
                cardGrid.appendChild(card);
            });

            cardsEl.appendChild(cardGrid);
        });
    }

    // ========== رندر مریخ (گرافیکی با تاریخ میلادی) ==========
    function renderMarsWeather(data) {
        const container = document.getElementById('marsCards');
        container.innerHTML = '';
        if (!data || !data.data || !data.data.sols) {
            container.innerHTML = '<span class="error-msg">داده‌ای برای نمایش وجود ندارد.</span>';
            return;
        }
        const sols = data.data.sols;
        sols.forEach(sol => {
            const card = document.createElement('div');
            card.className = 'mars-card';
            // تبدیل تاریخ به فرمت میلادی خوانا (UTC)
            const firstDate = new Date(sol.first_utc);
            const lastDate = new Date(sol.last_utc);
            const dateStr = `${firstDate.toISOString().slice(0,10)} ${firstDate.toISOString().slice(11,19)} UTC — ${lastDate.toISOString().slice(0,10)} ${lastDate.toISOString().slice(11,19)} UTC`;
            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <span style="font-size: 1.2rem; font-weight: 700; color: #f1c40f;">روز ${sol.sol}</span>
                    <span style="background: #2a5f7a; padding: 4px 12px; border-radius: 20px; font-size: 0.8rem;">${sol.season_fa}</span>
                </div>
                <div style="display: flex; justify-content: space-around; text-align: center; margin: 12px 0;">
                    <div><i class="fas fa-thermometer-half" style="color: #e67e22;"></i><div style="font-size: 0.85rem; color: #aabbdd;">میانگین</div><div style="font-weight: 700;">${sol.temperature.avg_c.toFixed(1)}°C</div></div>
                    <div><i class="fas fa-thermometer-low" style="color: #3498db;"></i><div style="font-size: 0.85rem; color: #aabbdd;">حداقل</div><div style="font-weight: 700;">${sol.temperature.min_c.toFixed(1)}°C</div></div>
                    <div><i class="fas fa-thermometer-high" style="color: #e74c3c;"></i><div style="font-size: 0.85rem; color: #aabbdd;">حداکثر</div><div style="font-weight: 700;">${sol.temperature.max_c.toFixed(1)}°C</div></div>
                </div>
                <div style="display: flex; justify-content: space-around; border-top: 1px solid #1f2f4a; padding-top: 12px; margin-top: 8px;">
                    <div><i class="fas fa-wind" style="color: #85c1e9;"></i> <span style="font-weight: 700;">${sol.wind.speed_ms.toFixed(1)} m/s</span></div>
                    <div><i class="fas fa-tachometer-alt" style="color: #f39c12;"></i> <span style="font-weight: 700;">${sol.pressure.avg_pa.toFixed(0)} Pa</span></div>
                </div>
                <div style="font-size: 0.7rem; color: #667799; margin-top: 10px; text-align: left; direction: ltr;">
                    ${dateStr}
                </div>
            `;
            container.appendChild(card);
        });
    }

    // ========== رندر سیارات (کارت‌ها + چارت دایره‌ای) ==========
    // آیکون‌های سیارات از Font Awesome
    const planetIcons = {
        'Sun': 'fa-sun',
        'Moon': 'fa-moon',
        'Mercury': 'fa-mercury',
        'Venus': 'fa-venus',
        'Earth': 'fa-earth',
        'Mars': 'fa-mars',
        'Jupiter': 'fa-jupiter',
        'Saturn': 'fa-saturn',
        'Uranus': 'fa-uranus',
        'Neptune': 'fa-neptune',
        'Pluto': 'fa-planet-ringed'
    };
    // برای سیاراتی که آیکون مستقیم ندارند، از fallback استفاده می‌کنیم
    const planetIconFallback = 'fa-circle';

    // رنگ‌های برج‌های فلکی (برای چارت)
    const signColors = {
        'Aries': '#ff4d4d',
        'Taurus': '#ff8c1a',
        'Gemini': '#f1c40f',
        'Cancer': '#e67e22',
        'Leo': '#f39c12',
        'Virgo': '#85c1e9',
        'Libra': '#2ecc71',
        'Scorpio': '#c0392b',
        'Sagittarius': '#8e44ad',
        'Capricorn': '#34495e',
        'Aquarius': '#1abc9c',
        'Pisces': '#3498db'
    };

    function renderPlanets(data) {
        const cardsEl = document.getElementById('planetsCards');
        const chartContainer = document.getElementById('planetChartContainer');
        const chartEl = document.getElementById('planetChart');
        cardsEl.innerHTML = '';
        chartContainer.style.display = 'none';

        if (!data || !data.data || !data.data.planets) {
            cardsEl.innerHTML = '<span class="error-msg">داده‌ای برای نمایش وجود ندارد.</span>';
            return;
        }

        const planets = data.data.planets;
        const planetNames = Object.keys(planets);

        // ===== کارت‌ها =====
        planetNames.forEach(name => {
            const p = planets[name];
            const icon = planetIcons[name] || planetIconFallback;
            const isRetrograde = p.retrograde || false;
            const card = document.createElement('div');
            card.className = 'planet-card';
            card.innerHTML = `
                <div class="planet-icon"><i class="fas ${icon}" style="color: ${signColors[p.sign] || '#f1c40f'};"></i></div>
                <div class="planet-name">${name}</div>
                <div class="planet-detail"><span class="sign-badge">${p.sign}</span> — ${p.degree_in_sign.toFixed(2)}°</div>
                <div class="planet-detail">طول جغرافیایی: ${p.longitude.toFixed(2)}°</div>
                <div class="planet-detail ${isRetrograde ? 'planet-retrograde' : 'planet-direct'}">
                    ${isRetrograde ? '🔴 بازگشتی' : '🟢 مستقیم'}
                </div>
            `;
            cardsEl.appendChild(card);
        });

        // ===== چارت دایره‌ای =====
        chartContainer.style.display = 'block';
        const svgSize = 600;
        const center = svgSize / 2;
        const radius = 240;
        const labelRadius = 270;
        const planetRadius = 280;

        // شروع SVG
        let svg = `<svg width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}" xmlns="http://www.w3.org/2000/svg" style="background: #0f1628; border-radius: 16px;">`;
        
        // دایرهٔ بیرونی
        svg += `<circle cx="${center}" cy="${center}" r="${radius}" fill="none" stroke="#2a4060" stroke-width="2"/>`;
        svg += `<circle cx="${center}" cy="${center}" r="${radius-30}" fill="none" stroke="#1f2f4a" stroke-width="1" stroke-dasharray="5,5"/>`;
        
        // خطوط ۳۰ درجه‌ای (برای برج‌ها)
        for (let i = 0; i < 12; i++) {
            const angle = (i * 30) * Math.PI / 180;
            const x1 = center + (radius - 15) * Math.sin(angle);
            const y1 = center - (radius - 15) * Math.cos(angle);
            const x2 = center + (radius + 15) * Math.sin(angle);
            const y2 = center - (radius + 15) * Math.cos(angle);
            svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#2a4060" stroke-width="1.5"/>`;
        }

        // نام برج‌ها
        const signNames = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
        signNames.forEach((sign, i) => {
            const angle = (i * 30 + 15) * Math.PI / 180;
            const x = center + labelRadius * Math.sin(angle);
            const y = center - labelRadius * Math.cos(angle);
            const color = signColors[sign] || '#aabbdd';
            svg += `<text x="${x}" y="${y}" fill="${color}" font-size="14" font-weight="bold" text-anchor="middle" dominant-baseline="middle" font-family="Vazirmatn, sans-serif">${sign}</text>`;
        });

        // نقطه‌های سیارات
        planetNames.forEach(name => {
            const p = planets[name];
            const lon = p.longitude; // 0-360
            const angle = lon * Math.PI / 180;
            const dist = planetRadius - 10; // کمی داخل‌تر از لبه
            const x = center + dist * Math.sin(angle);
            const y = center - dist * Math.cos(angle);
            const icon = planetIcons[name] || planetIconFallback;
            const color = signColors[p.sign] || '#f1c40f';
            // دایرهٔ کوچک برای سیاره
            svg += `<circle cx="${x}" cy="${y}" r="8" fill="${color}" stroke="#0b0e1a" stroke-width="2"/>`;
            // لیبل نام سیاره
            const labelOffX = 14;
            const labelOffY = -14;
            const labelX = x + labelOffX;
            const labelY = y + labelOffY;
            svg += `<text x="${labelX}" y="${labelY}" fill="#e0e8f0" font-size="11" font-weight="bold" text-anchor="start" dominant-baseline="middle" font-family="Vazirmatn, sans-serif">${name}</text>`;
        });

        // افسانه: نمایش موقعیت ۰ درجه (آغاز برج حمل)
        svg += `<text x="${center + radius + 20}" y="${center}" fill="#667799" font-size="10" font-family="Vazirmatn, sans-serif">0° (Aries)</text>`;

        svg += '</svg>';
        chartEl.innerHTML = svg;
    }

    // ========== مدیریت تب‌ها ==========
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
            document.getElementById(btn.dataset.tab).classList.add('active');
        });
    });

    // ========== مقداردهی اولیه Flatpickr و تاریخ‌ها ==========
    document.addEventListener('DOMContentLoaded', function() {
        const today = new Date();
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);
        const todayStr = today.toISOString().split('T')[0];
        const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

        document.getElementById('astStart').value = sevenDaysAgoStr;
        document.getElementById('astEnd').value = todayStr;
        document.getElementById('swStart').value = sevenDaysAgoStr;
        document.getElementById('swEnd').value = todayStr;
        document.getElementById('planetDate').value = todayStr;

        document.querySelectorAll('input[type="text"]').forEach(el => {
            if (el.id.includes('Date') || el.id.includes('Start') || el.id.includes('End') || el.id === 'apodDate' || el.id === 'planetDate') {
                flatpickr(el, {
                    dateFormat: "Y-m-d",
                    locale: "fa",
                    allowInput: true,
                    disableMobile: false,
                    onChange: function(selectedDates, dateStr, instance) {
                        el.value = dateStr;
                    }
                });
            }
        });

        document.getElementById('fetchApod').click();
    });

    // ========== رویدادهای دکمه‌ها ==========

    // 1. APOD
    document.getElementById('fetchApod').addEventListener('click', async () => {
        const date = document.getElementById('apodDate').value;
        const endpoint = date ? `/apod?date=${date}` : '/apod';
        const btn = document.getElementById('fetchApod');
        btn.disabled = true;
        btn.innerHTML = '<span class="loading"></span> بارگذاری...';
        try {
            const data = await callApi(endpoint);
            showResult('apodResult', data, true);
        } catch (e) {
            document.getElementById('apodResult').innerHTML = `<span class="error-msg">خطا: ${e.message}</span>`;
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-sync-alt"></i> دریافت';
        }
    });

    // 2. تصاویر
    document.getElementById('fetchImages').addEventListener('click', async () => {
        const query = document.getElementById('imageQuery').value.trim();
        const page = document.getElementById('imagePage').value || 1;
        if (!query) { alert('لطفاً کلمه کلیدی وارد کنید.'); return; }
        const endpoint = `/images?query=${encodeURIComponent(query)}&page=${page}`;
        const btn = document.getElementById('fetchImages');
        btn.disabled = true;
        btn.innerHTML = '<span class="loading"></span> جستجو...';
        try {
            const data = await callApi(endpoint);
            showImages('imagesResult', data);
        } catch (e) {
            document.getElementById('imagesResult').innerHTML = `<span class="error-msg">خطا: ${e.message}</span>`;
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-search"></i> جستجو';
        }
    });

    // 3. آب‌وهوای فضا – رویدادها
    document.getElementById('fetchSw').addEventListener('click', async () => {
        const start = document.getElementById('swStart').value;
        const end = document.getElementById('swEnd').value;
        if (!start) { alert('تاریخ شروع الزامی است.'); return; }
        let endpoint = `/space-weather?startDate=${start}`;
        if (end) endpoint += `&endDate=${end}`;
        const btn = document.getElementById('fetchSw');
        btn.disabled = true;
        btn.innerHTML = '<span class="loading"></span> دریافت...';
        try {
            const data = await callApi(endpoint);
            showResult('swResult', data);
        } catch (e) {
            document.getElementById('swResult').innerHTML = `<span class="error-msg">خطا: ${e.message}</span>`;
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-cloud-sun"></i> دریافت رویدادها';
        }
    });

    // خلاصه آب‌وهوای فضا
    document.getElementById('fetchSwSummary').addEventListener('click', async () => {
        const start = document.getElementById('swStart').value;
        const end = document.getElementById('swEnd').value;
        if (!start) { alert('تاریخ شروع الزامی است.'); return; }
        let endpoint = `/space-weather/summary?startDate=${start}`;
        if (end) endpoint += `&endDate=${end}`;
        const btn = document.getElementById('fetchSwSummary');
        btn.disabled = true;
        btn.innerHTML = '<span class="loading"></span> بارگذاری...';
        try {
            const data = await callApi(endpoint);
            showResult('swResult', data);
        } catch (e) {
            document.getElementById('swResult').innerHTML = `<span class="error-msg">خطا: ${e.message}</span>`;
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-list-ul"></i> خلاصه';
        }
    });

    // 4. سیارک‌ها (گرافیکی)
    document.getElementById('fetchAsteroids').addEventListener('click', async () => {
        const start = document.getElementById('astStart').value;
        const end = document.getElementById('astEnd').value;
        if (!start || !end) { alert('لطفاً هر دو تاریخ را وارد کنید.'); return; }
        const endpoint = `/asteroids?startDate=${start}&endDate=${end}`;
        const btn = document.getElementById('fetchAsteroids');
        btn.disabled = true;
        btn.innerHTML = '<span class="loading"></span> دریافت...';
        try {
            const data = await callApi(endpoint);
            renderAsteroids(data);
        } catch (e) {
            document.getElementById('asteroidsCards').innerHTML = `<span class="error-msg">خطا: ${e.message}</span>`;
            document.getElementById('asteroidsSummary').innerHTML = '';
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-search"></i> دریافت';
        }
    });

    // 5. آب‌وهوای مریخ
    document.getElementById('fetchMars').addEventListener('click', async () => {
        const btn = document.getElementById('fetchMars');
        btn.disabled = true;
        btn.innerHTML = '<span class="loading"></span> دریافت...';
        try {
            const data = await callApi('/mars-weather');
            renderMarsWeather(data);
        } catch (e) {
            document.getElementById('marsCards').innerHTML = `<span class="error-msg">خطا: ${e.message}</span>`;
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-cloud-sun"></i> دریافت آخرین گزارش';
        }
    });

    // 6. موقعیت سیارات
    document.getElementById('fetchPlanets').addEventListener('click', async () => {
        const date = document.getElementById('planetDate').value;
        if (!date) { alert('لطفاً تاریخ را انتخاب کنید.'); return; }
        const endpoint = `/planets?date=${date}`;
        const btn = document.getElementById('fetchPlanets');
        btn.disabled = true;
        btn.innerHTML = '<span class="loading"></span> دریافت...';
        try {
            const data = await callApi(endpoint);
            renderPlanets(data);
        } catch (e) {
            document.getElementById('planetsCards').innerHTML = `<span class="error-msg">خطا: ${e.message}</span>`;
            document.getElementById('planetChartContainer').style.display = 'none';
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-globe-americas"></i> دریافت موقعیت';
        }
    });
</script>
</body>
</html>