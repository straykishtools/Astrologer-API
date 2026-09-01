// ================================================================
//  BREATH MODULE — صفحه مستقل تنفس و مدیتیشن
//  لیست تکنیک‌ها، تایمر، و فضای مدیتیشن
// ================================================================

var BreathModule = (function() {
    'use strict';

    var techniques = [
        {
            id: 'box',
            name: 'تنفس بوکس',
            nameEn: 'Box Breathing',
            icon: '📦',
            category: 'breathing',
            difficulty: 'مبتدی',
            duration: '۵-۱۰ دقیقه',
            description: 'تنفس چهارگانه متعادل: دم ۴ ثانیه، حبس ۴ ثانیه، بازدم ۴ ثانیه، حبس خالی ۴ ثانیه. این تکنیک آرامش‌بخش و متمرکزکننده است.',
            benefits: 'کاهش استرس، بهبود تمرکز، تنظیم فشار خون',
            phases: [
                { id: 'inhale', label: 'دم بکش...', icon: '🌬️', duration: 4 },
                { id: 'hold', label: 'حبس کن...', icon: '⏸️', duration: 4 },
                { id: 'exhale', label: 'بازدم...', icon: '🌊', duration: 4 },
                { id: 'hold_empty', label: 'حبس خالی...', icon: '⏸️', duration: 4 }
            ],
            guide: '📦 نفس را به صورت چهارگانه کنترل کن. با هر مرحله، بدن آرام‌تر می‌شود.'
        },
        {
            id: 'diaphragmatic',
            name: 'تنفس دیافراگمی',
            nameEn: 'Diaphragmatic Breathing',
            icon: '🫁',
            category: 'breathing',
            difficulty: 'مبتدی',
            duration: '۵-۱۵ دقیقه',
            description: 'تنفس شکمی عمیق: دم ۴ ثانیه، حبس ۴ ثانیه، بازدم ۴ ثانیه. شکم با هر دم بیرون می‌آید و با بازدم به داخل می‌رود.',
            benefits: 'تقویت دیافراگم، کاهش اضطراب، بهبود خواب',
            phases: [
                { id: 'inhale', label: 'دم بکش...', icon: '🌬️', duration: 4 },
                { id: 'hold', label: 'حبس کن...', icon: '⏸️', duration: 4 },
                { id: 'exhale', label: 'بازدم...', icon: '🌊', duration: 4 }
            ],
            guide: '🫁 دست خود را روی شکم بگذارید. با هر دم شکم بالا بیاید و با بازدم پایین برود.'
        },
        {
            id: 'kapalabhati',
            name: 'تنفس آتش (کاپالابهاتی)',
            nameEn: 'Kapalabhati',
            icon: '🔥',
            category: 'breathing',
            difficulty: 'متوسط',
            duration: '۳-۵ دقیقه',
            description: 'بازدم‌های کوتاه و پرقدرت از شکم با دم‌های غیرفعال. این تکنیک انرژی‌بخش و پاک‌کننده است.',
            benefits: 'افزایش انرژی، تقویت تمرکز، پاک‌سازی مجاری تنفسی',
            phases: [
                { id: 'inhale', label: 'دم غیرفعال...', icon: '🌬️', duration: 1 },
                { id: 'exhale_force', label: 'بازدم سریع!', icon: '💨', duration: 0.5 }
            ],
            guide: '🔥 بازدم‌ها کوتاه و پرقدرت باشند. دم‌ها خودکار و آرام. در صورت سرگیجه متوقف شوید.'
        },
        {
            id: 'guided',
            name: 'مراقبه هدایت‌شده',
            nameEn: 'Guided Meditation',
            icon: '🧘',
            category: 'meditation',
            difficulty: 'مبتدی',
            duration: '۱۰-۲۰ دقیقه',
            description: 'مراقبه ۴ مرحله‌ای با راهنمایی متنی. هر مرحله ۸ ثانیه طول می‌کشد و شما را از آرامش بدن به تمرکز ذهنی می‌رساند.',
            benefits: 'کاهش اضطراب، بهبود کیفیت خواب، افزایش آگاهی',
            phases: [
                { id: 'step1', label: 'بدن را آرام کن...', icon: '🕊️', duration: 8 },
                { id: 'step2', label: 'بر تنفس تمرکز کن...', icon: '🌬️', duration: 8 },
                { id: 'step3', label: 'افکار را رها کن...', icon: '💭', duration: 8 },
                { id: 'step4', label: 'در سکوت بمان...', icon: '✨', duration: 8 }
            ],
            guide: '🧘 چشم‌ها را ببندید. از نوک پا تا سر، هر عضله را آرام کنید. سپس فقط تنفس خود را دنبال کنید.'
        },
        {
            id: 'silent',
            name: 'سکوت و تمرکز',
            nameEn: 'Silent Meditation',
            icon: '🤫',
            category: 'meditation',
            difficulty: 'متوسط',
            duration: '۱۰-۳۰ دقیقه',
            description: 'مراقبه بدون راهنمایی متنی. فقط روی تنفس خود تمرکز کنید و افکار را بدون قضاوت مشاهده کنید.',
            benefits: 'افزایش تمرکز، آرامش عمیق، خودآگاهی',
            phases: [
                { id: 'settle', label: 'آرام شوید...', icon: '🕊️', duration: 5 },
                { id: 'breathe', label: 'تنفس را دنبال کنید...', icon: '🌬️', duration: 10 },
                { id: 'silence', label: '...', icon: '🤫', duration: 15 }
            ],
            guide: '🤫 هیچ دستوری نیست. فقط بنشینید و تنفس خود را مشاهده کنید. اگر ذهن پرت شد، آرام برگردانید.'
        },
        {
            id: 'body_scan',
            name: 'اسکن بدن',
            nameEn: 'Body Scan',
            icon: '🦵',
            category: 'meditation',
            difficulty: 'مبتدی',
            duration: '۱۰-۱۵ دقیقه',
            description: 'از سر تا پا، هر ناحیه بدن را چند ثانیه مشاهده و آرام کنید. توجه به تنش‌ها و رها کردن آن‌ها.',
            benefits: 'کاهش درد مزمن، بهبود خواب، افزایش آگاهی بدنی',
            phases: [
                { id: 'head', label: 'سر و صورت...', icon: '🧑', duration: 4 },
                { id: 'shoulders', label: 'شانه‌ها و گردن...', icon: '💪', duration: 4 },
                { id: 'chest', label: 'سینه و شکم...', icon: '🫁', duration: 4 },
                { id: 'legs', label: 'پاها و پاها...', icon: '🦵', duration: 4 },
                { id: 'relax', label: 'بدن را رها کنید...', icon: '✨', duration: 6 }
            ],
            guide: '🦵 چشم‌ها را ببندید. توجه خود را به سر ببرید و آرام به پایین حرکت دهید.'
        }
    ];

    var state = {
        current: null,
        running: false,
        paused: false,
        phaseIndex: 0,
        phaseTimer: 0,
        cycles: 0,
        totalSeconds: 0,
        speed: 4,
        animFrame: null,
        lastTick: 0,
        timerInterval: null
    };

    var dom = {};

    function init() {
        dom.techniques = document.getElementById('breathTechniques');
        dom.timerSection = document.getElementById('breathTimerSection');
        dom.timerTitle = document.getElementById('breathTimerTitle');
        dom.timerDesc = document.getElementById('breathTimerDesc');
        dom.circle = document.getElementById('breathCircle');
        dom.phaseIcon = document.getElementById('breathPhaseIcon');
        dom.phaseText = document.getElementById('breathPhaseText');
        dom.progressBar = document.getElementById('breathProgressBar');
        dom.startBtn = document.getElementById('breathStartBtn');
        dom.pauseBtn = document.getElementById('breathPauseBtn');
        dom.resetBtn = document.getElementById('breathResetBtn');
        dom.timer = document.getElementById('breathTimer');
        dom.cycles = document.getElementById('breathCycles');
        dom.speedSlider = document.getElementById('breathSpeedSlider');
        dom.speedLabel = document.getElementById('breathSpeedLabel');
        dom.guide = document.getElementById('breathGuide');

        if (dom.techniques) renderTechniques();
        bindEvents();
    }

    function renderTechniques() {
        var breathing = techniques.filter(function(t) { return t.category === 'breathing'; });
        var meditation = techniques.filter(function(t) { return t.category === 'meditation'; });

        var html = '';
        // Breathing section
        html += '<div class="breath-section">';
        html += '<h3 class="breath-section-title">🌬️ تکنیک‌های تنفس</h3>';
        html += '<div class="breath-cards">';
        breathing.forEach(function(t) { html += renderTechniqueCard(t); });
        html += '</div></div>';

        // Meditation section
        html += '<div class="breath-section">';
        html += '<h3 class="breath-section-title">🧘 مراقبه و مدیتیشن</h3>';
        html += '<div class="breath-cards">';
        meditation.forEach(function(t) { html += renderTechniqueCard(t); });
        html += '</div></div>';

        dom.techniques.innerHTML = html;
    }

    function renderTechniqueCard(t) {
        return '<div class="breath-card" onclick="BreathModule.start(\'' + t.id + '\')">' +
            '<div class="breath-card-icon">' + t.icon + '</div>' +
            '<div class="breath-card-body">' +
                '<h4 class="breath-card-name">' + t.name + '</h4>' +
                '<span class="breath-card-en">' + t.nameEn + '</span>' +
                '<div class="breath-card-meta">' +
                    '<span>⭐ ' + t.difficulty + '</span>' +
                    '<span>⏱ ' + t.duration + '</span>' +
                '</div>' +
                '<p class="breath-card-desc">' + t.description + '</p>' +
                '<div class="breath-card-benefits">💡 ' + t.benefits + '</div>' +
            '</div>' +
            '<div class="breath-card-action"><button class="btn-primary">▶ شروع</button></div>' +
        '</div>';
    }

    function start(techId) {
        var tech = techniques.find(function(t) { return t.id === techId; });
        if (!tech) return;

        state.current = tech;
        state.phaseIndex = 0;
        state.phaseTimer = 0;
        state.cycles = 0;
        state.totalSeconds = 0;
        state.speed = parseFloat(dom.speedSlider ? dom.speedSlider.value : 4);
        state.running = false;
        state.paused = false;

        // Show timer section
        if (dom.techniques) dom.techniques.style.display = 'none';
        if (dom.timerSection) dom.timerSection.style.display = 'block';
        if (dom.timerTitle) dom.timerTitle.textContent = tech.icon + ' ' + tech.name;
        if (dom.timerDesc) dom.timerDesc.textContent = tech.nameEn + ' — ' + tech.description;
        if (dom.guide) dom.guide.querySelector('p').textContent = tech.guide;

        updatePhase();
        updateTimerDisplay();
        updateCyclesDisplay();

        if (dom.startBtn) dom.startBtn.disabled = false;
        if (dom.pauseBtn) dom.pauseBtn.disabled = true;
    }

    function bindEvents() {
        if (dom.startBtn) dom.startBtn.addEventListener('click', function() {
            if (!state.running) {
                state.running = true;
                state.paused = false;
                state.lastTick = performance.now();
                if (dom.startBtn) dom.startBtn.disabled = true;
                if (dom.pauseBtn) dom.pauseBtn.disabled = false;
                tick();
                startTimerInterval();
            }
        });

        if (dom.pauseBtn) dom.pauseBtn.addEventListener('click', function() {
            if (state.running && !state.paused) {
                state.paused = true;
                cancelAnimationFrame(state.animFrame);
                clearInterval(state.timerInterval);
                if (dom.startBtn) { dom.startBtn.disabled = false; dom.startBtn.textContent = '▶ ادامه'; }
                if (dom.pauseBtn) dom.pauseBtn.disabled = true;
            }
        });

        if (dom.resetBtn) dom.resetBtn.addEventListener('click', function() {
            state.running = false;
            state.paused = false;
            cancelAnimationFrame(state.animFrame);
            clearInterval(state.timerInterval);
            state.phaseIndex = 0;
            state.phaseTimer = 0;
            state.cycles = 0;
            state.totalSeconds = 0;
            if (state.current) {
                updatePhase();
                updateTimerDisplay();
                updateCyclesDisplay();
            }
            if (dom.startBtn) { dom.startBtn.disabled = false; dom.startBtn.textContent = '▶ شروع'; }
            if (dom.pauseBtn) dom.pauseBtn.disabled = true;
        });

        if (dom.speedSlider) {
            dom.speedSlider.addEventListener('input', function() {
                state.speed = parseFloat(this.value);
                var label = Math.round(state.speed) + 'ث';
                if (dom.speedLabel) dom.speedLabel.textContent = label;
            });
        }
    }

    function tick() {
        if (!state.running || state.paused || !state.current) return;

        var now = performance.now();
        var dt = (now - state.lastTick) / 1000;
        state.lastTick = now;

        state.phaseTimer += dt;
        state.totalSeconds += dt;

        var phases = state.current.phases;
        var phase = phases[state.phaseIndex];
        var speedMult = 4 / state.speed; // speed=4 is normal
        var phaseDuration = phase.duration * speedMult;

        // Update progress
        var progress = Math.min(1, state.phaseTimer / phaseDuration);
        if (dom.progressBar) dom.progressBar.style.width = (progress * 100) + '%';

        // Update circle animation
        if (dom.circle) {
            var scale = 1;
            if (phase.id === 'inhale' || phase.id === 'step1' || phase.id === 'step2') {
                scale = 1 + progress * 0.15;
                dom.circle.className = 'yoga-circle inhale';
            } else if (phase.id === 'exhale' || phase.id === 'exhale_force' || phase.id === 'step3' || phase.id === 'step4') {
                scale = 1.15 - progress * 0.15;
                dom.circle.className = 'yoga-circle exhale';
            } else {
                scale = 1 + Math.sin(progress * Math.PI) * 0.05;
                dom.circle.className = 'yoga-circle hold';
            }
            dom.circle.style.transform = 'scale(' + scale + ')';
        }

        // Phase complete?
        if (state.phaseTimer >= phaseDuration) {
            state.phaseTimer = 0;
            state.phaseIndex++;
            if (state.phaseIndex >= phases.length) {
                state.phaseIndex = 0;
                state.cycles++;
                updateCyclesDisplay();
            }
            updatePhase();
        }

        state.animFrame = requestAnimationFrame(tick);
    }

    function startTimerInterval() {
        clearInterval(state.timerInterval);
        state.timerInterval = setInterval(function() {
            if (state.running && !state.paused) {
                updateTimerDisplay();
            }
        }, 1000);
    }

    function updatePhase() {
        if (!state.current || !dom.phaseIcon || !dom.phaseText) return;
        var phase = state.current.phases[state.phaseIndex];
        dom.phaseIcon.textContent = phase.icon;
        dom.phaseText.textContent = phase.label;
        if (dom.progressBar) dom.progressBar.style.width = '0%';
    }

    function updateTimerDisplay() {
        if (!dom.timer) return;
        var mins = Math.floor(state.totalSeconds / 60);
        var secs = Math.floor(state.totalSeconds % 60);
        dom.timer.textContent = (mins < 10 ? '۰' : '') + toFaNum(mins) + ':' + (secs < 10 ? '۰' : '') + toFaNum(secs);
    }

    function updateCyclesDisplay() {
        if (!dom.cycles) return;
        dom.cycles.textContent = toFaNum(state.cycles);
    }

    function toFaNum(n) {
        var faDigits = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'];
        return String(n).replace(/[0-9]/g, function(d) { return faDigits[parseInt(d)]; });
    }

    return {
        init: init,
        start: start
    };
})();
