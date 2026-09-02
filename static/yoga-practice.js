// ================================================================
//  YOGA PRACTICE — تمرین پیشرفته یوگا
//  تایمر، راهنمای حرکت، پس‌زمینه، صدا، تنفس
// ================================================================

var YogaPractice = (function () {
'use strict';

// ─── Constants ───
var BACKGROUNDS = [
    { id: 'forest',  emoji: '🌲', name: 'جنگل',  gradient: 'linear-gradient(135deg, #0a1a0a 0%, #0d2818 30%, #1a3a1a 60%, #0f2f12 100%)', overlay: 'radial-gradient(ellipse at 50% 120%, rgba(34,139,34,0.15) 0%, transparent 70%)' },
    { id: 'beach',   emoji: '🌊', name: 'ساحل',   gradient: 'linear-gradient(135deg, #0a1628 0%, #0d2137 30%, #1a3050 60%, #0f2a40 100%)', overlay: 'radial-gradient(ellipse at 50% 130%, rgba(0,180,216,0.12) 0%, transparent 70%)' },
    { id: 'mountain', emoji: '🏔️', name: 'کوه',   gradient: 'linear-gradient(135deg, #0d0a1a 0%, #1a1040 30%, #2a1860 60%, #15103a 100%)', overlay: 'radial-gradient(ellipse at 50% 30%, rgba(138,100,255,0.1) 0%, transparent 70%)' },
    { id: 'night',   emoji: '🌙', name: 'شب',     gradient: 'linear-gradient(135deg, #05050f 0%, #0a0a20 30%, #10103a 60%, #08081a 100%)', overlay: 'radial-gradient(ellipse at 50% 20%, rgba(100,100,255,0.06) 0%, transparent 70%)' },
    { id: 'sunrise', emoji: '🌅', name: 'طلوع',   gradient: 'linear-gradient(135deg, #1a0a00 0%, #2a1500 30%, #3a2010 60%, #20100a 100%)', overlay: 'radial-gradient(ellipse at 50% 130%, rgba(255,165,0,0.12) 0%, transparent 70%)' }
];

var POSES_PER_SESSION = 12;

// ─── State ───
var state = {
    poses: [],
    poseMap: {},
    currentPoseIdx: 0,
    timerTotal: 90,       // seconds
    timerRemaining: 90,
    timerRunning: false,
    timerInterval: null,
    breathCount: 4,
    repetitions: 3,
    speed: 1,
    background: 'forest',
    audioPlaying: false,
    audioCtx: null,
    audioGain: null,
    audioNodes: [],
    audioVolume: 0.5,
    mode: 'auto',         // 'auto' = timed, 'manual' = breath-guided
    practiceStarted: false,
    sessionCompleted: false,
    breathPhase: 'idle',  // idle, inhale, hold, exhale
    breathInterval: null
};

// ─── Helpers ───
function esc(s) { var d = document.createElement('div'); d.appendChild(document.createTextNode(s || '')); return d.innerHTML; }
function pad2(n) { return n < 10 ? '0' + n : '' + n; }
function formatTime(sec) { return pad2(Math.floor(sec / 60)) + ':' + pad2(sec % 60); }
function toPersianNum(n) { return String(n).replace(/[0-9]/g, function(d) { return '۰۱۲۳۴۵۶۷۸۹'[d]; }); }

// ─── Data loading ───
function loadPoses(callback) {
    fetch('static/yoga.txt')
        .then(function(r) { return r.text(); })
        .then(function(txt) {
            try {
                state.poses = JSON.parse(txt);
                state.poseMap = {};
                state.poses.forEach(function(p) { state.poseMap[p.name] = p; });
                // Filter to practice-eligible (non-tertiary)
                state.poses = state.poses.filter(function(p) { return p.visibility !== 'tertiary'; });
            } catch(e) { console.error('Yoga parse error:', e); }
            callback();
        })
        .catch(function() { callback(); });
}

function getRandomPoses(count) {
    var shuffled = state.poses.slice().sort(function() { return Math.random() - 0.5; });
    return shuffled.slice(0, count);
}

function getCurrentPose() {
    return state.practiceSession ? state.practiceSession[state.currentPoseIdx] : null;
}

// ─── Audio Engine (Web Audio API ambient) ───
function initAudio() {
    if (state.audioCtx) return;
    try {
        state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        state.audioGain = state.audioCtx.createGain();
        state.audioGain.gain.value = state.audioVolume;
        state.audioGain.connect(state.audioCtx.destination);
    } catch(e) { console.warn('Web Audio not available'); }
}

function startAmbientSound() {
    initAudio();
    if (!state.audioCtx) return;
    stopAmbientSound();

    // Create a calming ambient drone
    var ctx = state.audioCtx;
    var now = ctx.currentTime;

    // Base drone
    var osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.value = 136.1; // Om frequency
    var gain1 = ctx.createGain();
    gain1.gain.value = 0.12;
    osc1.connect(gain1);
    gain1.connect(state.audioGain);
    osc1.start(now);
    state.audioNodes.push(osc1, gain1);

    // Harmonic overtone
    var osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = 272.2;
    var gain2 = ctx.createGain();
    gain2.gain.value = 0.06;
    osc2.connect(gain2);
    gain2.connect(state.audioGain);
    osc2.start(now);
    state.audioNodes.push(osc2, gain2);

    // Sub bass
    var osc3 = ctx.createOscillator();
    osc3.type = 'sine';
    osc3.frequency.value = 68.05;
    var gain3 = ctx.createGain();
    gain3.gain.value = 0.08;
    osc3.connect(gain3);
    gain3.connect(state.audioGain);
    osc3.start(now);
    state.audioNodes.push(osc3, gain3);

    // Gentle LFO modulation
    var lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.1;
    var lfoGain = ctx.createGain();
    lfoGain.gain.value = 3;
    lfo.connect(lfoGain);
    lfoGain.connect(osc1.frequency);
    lfo.start(now);
    state.audioNodes.push(lfo, lfoGain);

    state.audioPlaying = true;
    updateAudioUI();
}

function stopAmbientSound() {
    state.audioNodes.forEach(function(node) {
        try { node.stop && node.stop(); } catch(e) {}
        try { node.disconnect(); } catch(e) {}
    });
    state.audioNodes = [];
    state.audioPlaying = false;
    updateAudioUI();
}

function toggleAudio() {
    if (state.audioPlaying) stopAmbientSound();
    else startAmbientSound();
}

function setAudioVolume(v) {
    state.audioVolume = v;
    if (state.audioGain) state.audioGain.gain.value = v;
}

function updateAudioUI() {
    var btn = document.getElementById('ypAudioToggle');
    var label = document.getElementById('ypAudioLabel');
    if (btn) btn.textContent = state.audioPlaying ? '⏸️' : '▶️';
    if (label) label.textContent = state.audioPlaying ? 'صدای محیط فعال' : 'صدای محیط';
}

// ─── Timer ───
function startTimer() {
    if (state.timerRunning) return;
    state.timerRunning = true;
    state.timerInterval = setInterval(function() {
        if (state.timerRemaining <= 0) {
            onPoseComplete();
            return;
        }
        state.timerRemaining--;
        updateTimerDisplay();
        updateBreathGuide();
    }, 1000);
    updateControlButtons();
}

function pauseTimer() {
    state.timerRunning = false;
    if (state.timerInterval) { clearInterval(state.timerInterval); state.timerInterval = null; }
    updateControlButtons();
}

function resetTimer() {
    pauseTimer();
    state.timerRemaining = state.timerTotal;
    state.breathPhase = 'idle';
    updateTimerDisplay();
    updateBreathGuide();
    updateControlButtons();
}

function onPoseComplete() {
    pauseTimer();
    state.currentPoseIdx++;
    if (state.currentPoseIdx >= state.practiceSession.length) {
        // Session complete
        state.sessionCompleted = true;
        showSessionComplete();
    } else {
        // Next pose
        state.timerRemaining = state.timerTotal;
        state.breathPhase = 'idle';
        updatePoseDisplay();
        updateTimerDisplay();
        updateBreathGuide();
        // Auto-advance after 2 second pause
        setTimeout(function() {
            if (!state.sessionCompleted) startTimer();
        }, 2000);
    }
}

function updateTimerDisplay() {
    var el = document.getElementById('ypTimerValue');
    if (el) el.textContent = formatTime(state.timerRemaining);
    // Update progress ring
    var ring = document.getElementById('ypProgressRing');
    if (ring) {
        var pct = state.timerTotal > 0 ? (1 - state.timerRemaining / state.timerTotal) : 0;
        var circumference = 2 * Math.PI * 90;
        ring.style.strokeDashoffset = circumference * (1 - pct);
    }
}

function updateControlButtons() {
    var playBtn = document.getElementById('ypPlayBtn');
    if (playBtn) playBtn.textContent = state.timerRunning ? '⏸️' : '▶️';
}

// ─── Breath Guide ───
function updateBreathGuide() {
    var circle = document.getElementById('ypBreathCircle');
    var label = document.getElementById('ypBreathLabel');
    if (!circle || !label) return;

    if (!state.timerRunning || state.timerRemaining <= 0) {
        circle.className = 'yp-breath-circle';
        circle.style.transform = 'scale(1)';
        label.textContent = 'آماده باشید...';
        return;
    }

    // Calculate breath phase based on elapsed time
    var elapsed = state.timerTotal - state.timerRemaining;
    var breathCycleDuration = state.breathCount * 3; // inhale + hold + exhale
    var cyclePos = elapsed % breathCycleDuration;
    var phase = cyclePos / breathCycleDuration;

    if (phase < 0.33) {
        // Inhale
        circle.className = 'yp-breath-circle inhale';
        var inhaleProgress = phase / 0.33;
        circle.style.transform = 'scale(' + (0.8 + inhaleProgress * 0.4) + ')';
        label.textContent = '🌬️ دم بکش...';
    } else if (phase < 0.66) {
        // Hold
        circle.className = 'yp-breath-circle hold';
        circle.style.transform = 'scale(1.2)';
        label.textContent = '⏸️ حبس کن...';
    } else {
        // Exhale
        circle.className = 'yp-breath-circle exhale';
        var exhaleProgress = (phase - 0.66) / 0.34;
        circle.style.transform = 'scale(' + (1.2 - exhaleProgress * 0.4) + ')';
        label.textContent = '🌊 بازدم...';
    }
}

// ─── UI Rendering ───
function renderPracticePage() {
    var container = document.getElementById('yogaPracticePanel');
    if (!container) return;

    var bg = BACKGROUNDS.find(function(b) { return b.id === state.background; }) || BACKGROUNDS[0];
    var pose = getCurrentPose();
    var poseFa = pose ? (pose.display_name_fa || pose.name_fa || pose.name) : '';
    var poseEn = pose ? (pose.display_name || pose.name) : '';

    var html = '';
    // Background layer
    html += '<div class="yp-bg" id="ypBg" style="background:' + bg.gradient + ';">';
    html += '<div class="yp-bg-overlay" style="background:' + bg.overlay + ';"></div>';
    html += '<div class="yp-bg-particles" id="ypParticles"></div>';
    html += '</div>';

    // Main content
    html += '<div class="yp-content">';

    // Header
    html += '<div class="yp-header">';
    html += '<button class="yp-back-btn" id="ypBackBtn">➡️ بازگشت به کتابخانه</button>';
    html += '<h2 class="yp-title">🧘 تمرین یوگا</h2>';
    html += '<div class="yp-header-actions">';
    html += '<button class="yp-icon-btn" id="ypSettingsToggle" title="تنظیمات">⚙️</button>';
    html += '</div>';
    html += '</div>';

    // Pose display
    html += '<div class="yp-pose-area">';
    html += '<div class="yp-pose-image" id="ypPoseImage">';
    if (pose) {
        var imgSrc = 'static/images/yoga/' + pose.name + '_' + (pose.preferred_side || 'R') + '.png';
        html += '<img src="' + imgSrc + '" alt="' + esc(poseEn) + '" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'">';
        html += '<div class="yp-pose-placeholder" style="display:none;">🧘</div>';
    } else {
        html += '<div class="yp-pose-placeholder">🧘</div>';
    }
    html += '</div>';
    html += '<div class="yp-pose-info">';
    html += '<div class="yp-pose-name-fa">' + esc(poseFa) + '</div>';
    html += '<div class="yp-pose-name-en">' + esc(poseEn) + '</div>';
    if (pose && pose.sanskrit_names && pose.sanskrit_names[0]) {
        html += '<div class="yp-pose-sanskrit">' + esc(pose.sanskrit_names[0].latin) + '</div>';
    }
    html += '</div>';
    html += '</div>';

    // Timer area
    html += '<div class="yp-timer-area">';
    html += '<div class="yp-timer-ring">';
    html += '<svg viewBox="0 0 200 200">';
    html += '<circle class="yp-timer-track" cx="100" cy="100" r="90"/>';
    html += '<circle class="yp-timer-progress" id="ypProgressRing" cx="100" cy="100" r="90" style="stroke-dasharray: ' + (2 * Math.PI * 90) + '; stroke-dashoffset: ' + (2 * Math.PI * 90) + ';"/>';
    html += '</svg>';
    html += '<div class="yp-timer-value" id="ypTimerValue">' + formatTime(state.timerRemaining) + '</div>';
    html += '<div class="yp-timer-label">' + toPersianNum(state.currentPoseIdx + 1) + ' از ' + toPersianNum(state.practiceSession ? state.practiceSession.length : 0) + '</div>';
    html += '</div>';
    html += '</div>';

    // Breath circle
    html += '<div class="yp-breath-area">';
    html += '<div class="yp-breath-circle" id="ypBreathCircle">';
    html += '<span class="yp-breath-icon" id="ypBreathLabel">آماده باشید...</span>';
    html += '</div>';
    html += '</div>';

    // Control buttons
    html += '<div class="yp-controls">';
    html += '<button class="yp-ctrl-btn" id="ypPrevBtn" title="حرکت قبلی">⏮️</button>';
    html += '<button class="yp-ctrl-btn yp-play" id="ypPlayBtn" title="شروع/مکث">▶️</button>';
    html += '<button class="yp-ctrl-btn" id="ypNextBtn" title="حرکت بعدی">⏭️</button>';
    html += '<button class="yp-ctrl-btn" id="ypResetBtn" title="بازنشانی">🔄</button>';
    html += '</div>';

    // Audio player
    html += '<div class="yp-audio">';
    html += '<button class="yp-audio-toggle" id="ypAudioToggle" title="صدای محیط">▶️</button>';
    html += '<span class="yp-audio-label" id="ypAudioLabel">صدای محیط</span>';
    html += '<input type="range" class="yp-audio-volume" id="ypAudioVolume" min="0" max="1" step="0.05" value="' + state.audioVolume + '">';
    html += '</div>';

    html += '</div>'; // yp-content

    // Settings panel
    html += renderSettingsPanel();

    // Session complete overlay
    html += '<div class="yp-complete-overlay" id="ypCompleteOverlay" style="display:none;">';
    html += '<div class="yp-complete-card">';
    html += '<div class="yp-complete-emoji">🎉</div>';
    html += '<h2>تمرین تمام شد!</h2>';
    html += '<p>آفرین! شما ' + toPersianNum(state.practiceSession ? state.practiceSession.length : 0) + ' حرکت را تمرین کردید.</p>';
    html += '<button class="yp-ctrl-btn yp-play" onclick="YogaPractice.restartSession()">🔄 شروع مجدد</button>';
    html += '</div>';
    html += '</div>';

    container.innerHTML = html;
    bindEvents();
    createParticles();
}

function renderSettingsPanel() {
    var html = '<div class="yp-settings" id="ypSettings">';

    // Duration
    html += '<div class="yp-setting-row">';
    html += '<div class="yp-setting-label">⏱️ زمان هر حرکت</div>';
    html += '<div class="yp-setting-options">';
    [30, 60, 90, 120, 180, 300].forEach(function(sec) {
        var active = state.timerTotal === sec ? ' active' : '';
        html += '<button class="yp-opt-btn' + active + '" data-setting="duration" data-value="' + sec + '">' + formatTime(sec) + '</button>';
    });
    html += '</div></div>';

    // Breath count
    html += '<div class="yp-setting-row">';
    html += '<div class="yp-setting-label">💨 تعداد نفس</div>';
    html += '<div class="yp-setting-options">';
    [4, 5, 6].forEach(function(c) {
        var active = state.breathCount === c ? ' active' : '';
        html += '<button class="yp-opt-btn' + active + '" data-setting="breath" data-value="' + c + '">' + toPersianNum(c) + '</button>';
    });
    html += '</div></div>';

    // Repetitions
    html += '<div class="yp-setting-row">';
    html += '<div class="yp-setting-label">🔄 تعداد حرکات</div>';
    html += '<div class="yp-setting-options">';
    [3, 5, 8, 12].forEach(function(r) {
        var active = state.repetitions === r ? ' active' : '';
        html += '<button class="yp-opt-btn' + active + '" data-setting="reps" data-value="' + r + '">' + toPersianNum(r) + '</button>';
    });
    html += '</div></div>';

    // Speed
    html += '<div class="yp-setting-row">';
    html += '<div class="yp-setting-label">🎚️ سرعت</div>';
    html += '<div class="yp-setting-options">';
    [1, 1.5, 2].forEach(function(s) {
        var active = state.speed === s ? ' active' : '';
        html += '<button class="yp-opt-btn' + active + '" data-setting="speed" data-value="' + s + '">' + s + 'x</button>';
    });
    html += '</div></div>';

    // Background
    html += '<div class="yp-setting-row">';
    html += '<div class="yp-setting-label">🌄 پس‌زمینه</div>';
    html += '<div class="yp-setting-options">';
    BACKGROUNDS.forEach(function(bg) {
        var active = state.background === bg.id ? ' active' : '';
        html += '<button class="yp-bg-btn' + active + '" data-setting="bg" data-value="' + bg.id + '" title="' + esc(bg.name) + '">' + bg.emoji + '</button>';
    });
    html += '</div></div>';

    html += '</div>';
    return html;
}

function updatePoseDisplay() {
    var pose = getCurrentPose();
    if (!pose) return;

    var poseFa = pose.display_name_fa || pose.name_fa || pose.name;
    var poseEn = pose.display_name || pose.name;

    var nameFa = document.getElementById('ypPoseNameFa');
    var nameEn = document.getElementById('ypPoseNameEn');
    var imgEl = document.getElementById('ypPoseImage');
    var counter = document.querySelector('.yp-timer-label');

    if (nameFa) nameFa.textContent = poseFa;
    if (nameEn) nameEn.textContent = poseEn;
    if (imgEl) {
        var imgSrc = 'static/images/yoga/' + pose.name + '_' + (pose.preferred_side || 'R') + '.png';
        var img = imgEl.querySelector('img');
        if (img) { img.src = imgSrc; img.alt = poseEn; }
    }
    if (counter) counter.textContent = toPersianNum(state.currentPoseIdx + 1) + ' از ' + toPersianNum(state.practiceSession.length);
}

function showSessionComplete() {
    var overlay = document.getElementById('ypCompleteOverlay');
    if (overlay) overlay.style.display = 'flex';
    stopAmbientSound();
}

// ─── Particles ───
function createParticles() {
    var container = document.getElementById('ypParticles');
    if (!container) return;
    container.innerHTML = '';
    for (var i = 0; i < 20; i++) {
        var p = document.createElement('div');
        p.className = 'yp-particle';
        p.style.left = Math.random() * 100 + '%';
        p.style.top = Math.random() * 100 + '%';
        p.style.animationDelay = (Math.random() * 8) + 's';
        p.style.animationDuration = (6 + Math.random() * 8) + 's';
        p.style.width = p.style.height = (2 + Math.random() * 3) + 'px';
        container.appendChild(p);
    }
}

// ─── Background switching ───
function setBackground(bgId) {
    state.background = bgId;
    var bg = BACKGROUNDS.find(function(b) { return b.id === bgId; }) || BACKGROUNDS[0];
    var bgEl = document.getElementById('ypBg');
    var overlayEl = bgEl ? bgEl.querySelector('.yp-bg-overlay') : null;
    if (bgEl) bgEl.style.background = bg.gradient;
    if (overlayEl) overlayEl.style.background = bg.overlay;

    // Update button states
    document.querySelectorAll('.yp-bg-btn').forEach(function(btn) {
        btn.classList.toggle('active', btn.dataset.value === bgId);
    });
}

// ─── Event binding ───
function bindEvents() {
    // Back button
    var backBtn = document.getElementById('ypBackBtn');
    if (backBtn) backBtn.addEventListener('click', function() {
        pauseTimer();
        stopAmbientSound();
        // Switch to library tab
        document.querySelectorAll('.yoga-tab').forEach(function(t) {
            t.classList.toggle('active', t.dataset.tab === 'library');
        });
        document.getElementById('yogaGridWrap').style.display = '';
        document.getElementById('yogaFilters').style.display = '';
        document.getElementById('yogaDailyPanel').style.display = 'none';
        document.getElementById('yogaBreathPanel').style.display = 'none';
        document.getElementById('yogaPracticePanel').style.display = 'none';
        if (window.YogaLibrary) window.YogaLibrary.init();
    });

    // Play/Pause
    var playBtn = document.getElementById('ypPlayBtn');
    if (playBtn) playBtn.addEventListener('click', function() {
        if (state.timerRunning) pauseTimer();
        else startTimer();
    });

    // Reset
    var resetBtn = document.getElementById('ypResetBtn');
    if (resetBtn) resetBtn.addEventListener('click', function() {
        resetTimer();
    });

    // Prev/Next
    var prevBtn = document.getElementById('ypPrevBtn');
    var nextBtn = document.getElementById('ypNextBtn');
    if (prevBtn) prevBtn.addEventListener('click', function() {
        if (state.currentPoseIdx > 0) {
            pauseTimer();
            state.currentPoseIdx--;
            state.timerRemaining = state.timerTotal;
            state.breathPhase = 'idle';
            updatePoseDisplay();
            updateTimerDisplay();
            updateBreathGuide();
        }
    });
    if (nextBtn) nextBtn.addEventListener('click', function() {
        if (state.practiceSession && state.currentPoseIdx < state.practiceSession.length - 1) {
            pauseTimer();
            state.currentPoseIdx++;
            state.timerRemaining = state.timerTotal;
            state.breathPhase = 'idle';
            updatePoseDisplay();
            updateTimerDisplay();
            updateBreathGuide();
        }
    });

    // Audio toggle
    var audioToggle = document.getElementById('ypAudioToggle');
    if (audioToggle) audioToggle.addEventListener('click', toggleAudio);

    // Audio volume
    var audioVol = document.getElementById('ypAudioVolume');
    if (audioVol) audioVol.addEventListener('input', function() {
        setAudioVolume(parseFloat(this.value));
    });

    // Settings toggle
    var settingsToggle = document.getElementById('ypSettingsToggle');
    var settingsPanel = document.getElementById('ypSettings');
    if (settingsToggle && settingsPanel) {
        settingsToggle.addEventListener('click', function() {
            settingsPanel.classList.toggle('open');
        });
    }

    // Settings buttons
    document.querySelectorAll('.yp-opt-btn, .yp-bg-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var setting = this.dataset.setting;
            var value = this.dataset.value;

            // Update button active states
            this.parentElement.querySelectorAll('.yp-opt-btn, .yp-bg-btn').forEach(function(b) {
                b.classList.remove('active');
            });
            this.classList.add('active');

            // Apply setting
            if (setting === 'duration') {
                state.timerTotal = parseInt(value);
                if (!state.timerRunning) {
                    state.timerRemaining = state.timerTotal;
                    updateTimerDisplay();
                }
            } else if (setting === 'breath') {
                state.breathCount = parseInt(value);
            } else if (setting === 'reps') {
                state.repetitions = parseInt(value);
                // Regenerate session
                startSession();
            } else if (setting === 'speed') {
                state.speed = parseFloat(value);
            } else if (setting === 'bg') {
                setBackground(value);
            }
        });
    });
}

// ─── Session management ───
function startSession() {
    // If no poses loaded, use placeholder poses
    if (!state.poses || state.poses.length === 0) {
        state.poses = [
            { name: 'Mountain', display_name: 'Mountain Pose', display_name_fa: 'پوزیشن کوه', preferred_side: 'R', sanskrit_names: [{ latin: 'Tadasana' }] },
            { name: 'DownwardDog', display_name: 'Downward-Facing Dog', display_name_fa: 'سگ رو به پایین', preferred_side: 'R', sanskrit_names: [{ latin: 'Adho Mukha Svanasana' }] },
            { name: 'WarriorI', display_name: 'Warrior I', display_name_fa: 'جنگجو I', preferred_side: 'R', sanskrit_names: [{ latin: 'Virabhadrasana I' }] },
            { name: 'Tree', display_name: 'Tree Pose', display_name_fa: 'پوزیشن درخت', preferred_side: 'R', sanskrit_names: [{ latin: 'Vrksasana' }] },
            { name: 'Cobra', display_name: 'Cobra Pose', display_name_fa: 'پوزیشن کبرا', preferred_side: 'R', sanskrit_names: [{ latin: 'Bhujangasana' }] },
            { name: 'Child', display_name: "Child's Pose", display_name_fa: 'پوزیشن کودک', preferred_side: 'R', sanskrit_names: [{ latin: 'Balasana' }] },
            { name: 'Cat', display_name: 'Cat-Cow', display_name_fa: 'گاو و گربه', preferred_side: 'R', sanskrit_names: [{ latin: 'Marjaryasana' }] },
            { name: 'Plank', display_name: 'Plank Pose', display_name_fa: 'تخته', preferred_side: 'R', sanskrit_names: [{ latin: 'Phalakasana' }] },
            { name: 'Triangle', display_name: 'Triangle Pose', display_name_fa: 'مثلث', preferred_side: 'R', sanskrit_names: [{ latin: 'Trikonasana' }] },
            { name: 'Bridge', display_name: 'Bridge Pose', display_name_fa: 'پل', preferred_side: 'R', sanskrit_names: [{ latin: 'Setu Bandhasana' }] },
            { name: 'SeatedForwardBend', display_name: 'Seated Forward Bend', display_name_fa: 'خم به جلو نشسته', preferred_side: 'R', sanskrit_names: [{ latin: 'Paschimottanasana' }] },
            { name: 'Corpse', display_name: 'Corpse Pose', display_name_fa: 'مرده', preferred_side: 'R', sanskrit_names: [{ latin: 'Savasana' }] }
        ];
        state.poseMap = {};
        state.poses.forEach(function(p) { state.poseMap[p.name] = p; });
    }
    state.practiceSession = getRandomPoses(state.repetitions);
    state.currentPoseIdx = 0;
    state.timerRemaining = state.timerTotal;
    state.timerRunning = false;
    state.sessionCompleted = false;
    state.breathPhase = 'idle';
    if (state.timerInterval) { clearInterval(state.timerInterval); state.timerInterval = null; }

    var overlay = document.getElementById('ypCompleteOverlay');
    if (overlay) overlay.style.display = 'none';

    renderPracticePage();
}

function init() {
    loadPoses(function() {
        // Even if no poses loaded, still render the UI with a fallback
        startSession();
    });
}

// ─── Public API ───
window.YogaPractice = {
    init: init,
    startSession: startSession,
    restartSession: function() {
        stopAmbientSound();
        startSession();
    }
};

return { init: init };
})();
