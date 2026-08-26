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
//   INIT
// ================================================================
window.addEventListener('DOMContentLoaded', function() {
    const today = new Date();
    const y = today.getFullYear() - 20;
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    document.getElementById('birthDate').value = `${y}-${m}-${d}`;
});