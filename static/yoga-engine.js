// ================================================================
//   YOGA ENGINE — موتور جامع یوگا، تنفس و مراقبه
// ================================================================

var YogaEngine = (function () {
'use strict';

var STATE = { IDLE: 'idle', RUNNING: 'running', PAUSED: 'paused' };

var EXERCISES = {
    diaphragmatic: {
        name: 'تنفس دیافراگمی', icon: '🌬️',
        phases: [
            { id: 'inhale', label: 'دم بکش...', icon: '🌬️', duration: 4 },
            { id: 'hold', label: 'نفس را حبس کن...', icon: '⏸️', duration: 4 },
            { id: 'exhale', label: 'بازدم...', icon: '🌊', duration: 4 }
        ],
        defaultSpeed: 4,
        guide: '🪷 با هر دم، شکم خود را به آرامی بیرون بده و با هر بازدم، آن را به سمت ستون فقرات بکش.'
    },
    box: {
        name: 'تنفس بوکس', icon: '📦',
        phases: [
            { id: 'inhale', label: 'دم بکش...', icon: '🌬️', duration: 4 },
            { id: 'hold', label: 'حبس کن...', icon: '⏸️', duration: 4 },
            { id: 'exhale', label: 'بازدم...', icon: '🌊', duration: 4 },
            { id: 'hold_empty', label: 'حبس کن (خالی)...', icon: '⏸️', duration: 4 }
        ],
        defaultSpeed: 4,
        guide: '📦 نفس را به صورت چهارگانه کنترل کن: دم، حبس، بازدم، حبس خالی.'
    },
    kapalabhati: {
        name: 'تنفس آتش (کاپالابهاتی)', icon: '🔥',
        phases: [
            { id: 'inhale', label: 'دم غیرفعال...', icon: '🌬️', duration: 1 },
            { id: 'exhale_force', label: 'بازدم سریع!', icon: '💨', duration: 0.5 }
        ],
        defaultSpeed: 0.5,
        guide: '🔥 بازدم‌های کوتاه و پرقدرت از شکم، دم‌ها غیرفعال و آرام.'
    },
    guided: {
        name: 'مراقبه هدایت‌شده', icon: '🧘',
        phases: [
            { id: 'step1', label: 'بدن را آرام کن...', icon: '🕊️', duration: 8 },
            { id: 'step2', label: 'بر تنفس تمرکز کن...', icon: '🌬️', duration: 8 },
            { id: 'step3', label: 'افکار را رها کن...', icon: '☁️', duration: 8 },
            { id: 'step4', label: 'در سکوت حضور داشته باش...', icon: '🌌', duration: 10 }
        ],
        defaultSpeed: 6,
        guide: '🧘 چشمان خود را ببند. با هر بازدم، تنش را از بدن خود خارج کن.'
    },
    asana: {
        name: 'حرکت یوگا (آسانا)', icon: '🧘‍♂️',
        phases: [
            { id: 'pose1', label: 'کوه (Tadasana)', icon: '🏔️', duration: 6 },
            { id: 'pose2', label: 'درخت (Vrksasana)', icon: '🌳', duration: 6 },
            { id: 'pose3', label: 'سگ رو به پایین', icon: '🐕', duration: 6 },
            { id: 'pose4', label: 'جنگجو I', icon: '⚔️', duration: 6 }
        ],
        defaultSpeed: 5,
        guide: '🧘 هر حرکت را با تنفس هماهنگ کن. بدن خود را حس کن.'
    },
    silent: {
        name: 'سکوت و تمرکز', icon: '🌙',
        phases: [
            { id: 'inhale', label: 'دم عمیق...', icon: '🌬️', duration: 5 },
            { id: 'hold', label: 'سکوت و تمرکز...', icon: '🌙', duration: 10 },
            { id: 'exhale', label: 'بازدم آرام...', icon: '🌬️', duration: 5 }
        ],
        defaultSpeed: 6,
        guide: '🌙 چشمان خود را ببند. فقط صدای تنفس خود را بشنوید.'
    },
    body_scan: {
        name: 'اسکن بدن', icon: '🩷',
        phases: [
            { id: 'head', label: 'سر و صورت...', icon: '🩷', duration: 8 },
            { id: 'shoulders', label: 'شانه‌ها و بازوها...', icon: '👌', duration: 8 },
            { id: 'chest', label: 'سینه و شکم...', icon: '💜', duration: 8 },
            { id: 'legs', label: 'پاها و پاچه‌ها...', icon: '🦵', duration: 8 },
            { id: 'relax', label: 'تمام بدن آرام...', icon: '✨', duration: 10 }
        ],
        defaultSpeed: 5,
        guide: '🩷 از بالای سر شروع کن و آرام به پایین برو.'
    }
};

var currentExercise = 'box';
var currentPhaseIndex = 0;
var phaseProgress = 0;
var animFrameId = null;
var lastTimestamp = 0;
var elapsedTime = 0;
var cycleCount = 0;
var isPaused = false;
var isRunning = false;
var speedMultiplier = 1;
var targetDuration = 0; // 0 = unlimited, else seconds
var dom = {};

function getPhases() { var ex = EXERCISES[currentExercise]; return ex ? ex.phases : []; }
function getPhase(i) { var p = getPhases(); return p[i % p.length] || null; }

function formatTime(ms) {
    var s = Math.floor(ms / 1000);
    return (s < 10 ? '0' : '') + Math.floor(s / 60) + ':' + (s % 60 < 10 ? '0' : '') + (s % 60);
}

function updateUI(phase, progress) {
    if (!dom.circle || !dom.progressBar) return;
    var p = phase || getPhase(currentPhaseIndex);
    var prog = progress !== undefined ? progress : phaseProgress;

    dom.circle.className = 'yoga-circle';
    if (p) {
        dom.circle.classList.add(p.id);
        if (dom.phaseIcon) dom.phaseIcon.textContent = p.icon || '🌬️';
        if (dom.phaseText) dom.phaseText.textContent = p.label || '';
    }
    dom.progressBar.style.width = (prog * 100) + '%';

    var ex = EXERCISES[currentExercise];
    if (ex && dom.guide) { dom.guide.innerHTML = '<p>' + ex.guide + '</p>'; dom.guide.classList.add('active'); }
    if (dom.cycleCounter) dom.cycleCounter.textContent = cycleCount;
    if (dom.timer) {
        if (targetDuration > 0) {
            var rem = Math.max(0, targetDuration - Math.floor(elapsedTime / 1000));
            dom.timer.textContent = formatTime(rem * 1000);
        } else {
            dom.timer.textContent = formatTime(elapsedTime);
        }
    }
    if (dom.speedSlider) dom.speedSlider.value = speedMultiplier;
    if (dom.speedLabel) dom.speedLabel.textContent = Math.round(speedMultiplier * 4) + 'ث';
}

function tick(timestamp) {
    if (!isRunning || isPaused) { animFrameId = requestAnimationFrame(tick); return; }
    if (!lastTimestamp) lastTimestamp = timestamp;
    var delta = (timestamp - lastTimestamp) * speedMultiplier;
    lastTimestamp = timestamp;
    elapsedTime += delta;

    // Auto-stop if target duration reached
    if (targetDuration > 0 && elapsedTime >= targetDuration * 1000) {
        updateUI(null, 0);
        if (window.AudioManager) AudioManager.sfx('chime');
        setTimeout(function() { stop(); }, 500);
        return;
    }

    var phases = getPhases();
    var phase = getPhase(currentPhaseIndex);
    if (!phase) { stop(); return; }

    phaseProgress += delta / (phase.duration * 1000);
    if (phaseProgress >= 1) {
        phaseProgress = 0;
        currentPhaseIndex = (currentPhaseIndex + 1) % phases.length;
        if (currentPhaseIndex === 0) cycleCount++;
        updateUI(getPhase(currentPhaseIndex), 0);
    } else {
        updateUI(phase, phaseProgress);
    }
    animFrameId = requestAnimationFrame(tick);
}

function start() {
    if (isRunning && !isPaused) return;
    if (isPaused) { isPaused = false; lastTimestamp = 0; if (dom.startBtn) dom.startBtn.textContent = '▶ در حال اجرا'; if (dom.pauseBtn) dom.pauseBtn.textContent = '⏸ مکث'; return; }
    if (getPhases().length === 0) return;
    isRunning = true; isPaused = false; currentPhaseIndex = 0; phaseProgress = 0; elapsedTime = 0; lastTimestamp = 0;
    if (currentExercise !== 'asana') cycleCount = 0;
    if (dom.startBtn) { dom.startBtn.textContent = '▶ در حال اجرا'; dom.startBtn.classList.add('active'); }
    if (dom.pauseBtn) { dom.pauseBtn.textContent = '⏸ مکث'; dom.pauseBtn.disabled = false; }
    updateUI(getPhase(0), 0);
    if (animFrameId) cancelAnimationFrame(animFrameId);
    animFrameId = requestAnimationFrame(tick);
}

function pause() {
    if (!isRunning || isPaused) return;
    isPaused = true;
    if (dom.pauseBtn) dom.pauseBtn.textContent = '▶ ادامه';
    if (dom.startBtn) { dom.startBtn.textContent = '⏸ مکث شده'; dom.startBtn.classList.remove('active'); }
}

function stop() {
    // Record session if meaningful (>=30s and >=1 cycle)
    if (isRunning && elapsedTime >= 30000) {
        var minutes = Math.max(1, Math.round(elapsedTime / 60000));
        if (window.YogaSummary) {
            YogaSummary.recordSession(currentExercise, minutes);
        }
    }
    isRunning = false; isPaused = false;
    if (animFrameId) { cancelAnimationFrame(animFrameId); animFrameId = null; }
    if (dom.startBtn) { dom.startBtn.textContent = '▶ شروع'; dom.startBtn.classList.remove('active'); }
    if (dom.pauseBtn) { dom.pauseBtn.textContent = '⏸ مکث'; dom.pauseBtn.disabled = true; }
    updateUI(null, 0);
}

function reset() {
    stop(); currentPhaseIndex = 0; phaseProgress = 0; elapsedTime = 0; targetDuration = 0;
    if (currentExercise !== 'asana') cycleCount = 0;
    updateUI(getPhase(0), 0);
    if (dom.timer) dom.timer.textContent = '۰۰:۰۰';
    if (dom.cycleCounter) dom.cycleCounter.textContent = '۰';
    if (dom.progressBar) dom.progressBar.style.width = '0%';
}

function setExercise(id) {
    if (isRunning) stop();
    if (EXERCISES[id]) {
        currentExercise = id; reset();
        // update the correct select
        var breathIds = ['box', 'diaphragmatic', 'kapalabhati'];
        var meditIds = ['guided', 'silent', 'body_scan'];
        if (breathIds.indexOf(id) !== -1 && dom.breathSelect) dom.breathSelect.value = id;
        if (meditIds.indexOf(id) !== -1 && dom.meditSelect) dom.meditSelect.value = id;
        if (dom.guide) { dom.guide.innerHTML = '<p>' + EXERCISES[id].guide + '</p>'; }
    }
}

function setSpeed(val) {
    speedMultiplier = parseFloat(val) || 1;
    if (dom.speedLabel) dom.speedLabel.textContent = Math.round(speedMultiplier * 4) + 'ث';
}

function openPanel(tab) {
    if (dom.panel) {
        dom.panel.classList.add('active');
        if (tab) switchTab(tab);
    }
}

function switchTab(tab) {
    var tabs = document.querySelectorAll('.yoga-panel-tab');
    var sections = document.querySelectorAll('.yoga-panel-section');
    tabs.forEach(function(t) { t.classList.toggle('active', t.getAttribute('data-panel') === tab); });
    sections.forEach(function(s) { s.classList.remove('active'); });
    var target = tab === 'meditation' ? document.getElementById('yogaMeditationSection') : document.getElementById('yogaBreathingSection');
    if (target) target.classList.add('active');
    // auto-select appropriate exercise
    if (tab === 'meditation' && dom.meditSelect) {
        setExercise(dom.meditSelect.value || 'guided');
    } else if (tab === 'breathing' && dom.breathSelect) {
        setExercise(dom.breathSelect.value || 'box');
    }
}

function init() {
    dom.panel = document.getElementById('yogaPanel');
    dom.closeBtn = document.getElementById('yogaPanelClose');
    dom.toggleBtn = document.getElementById('yogaEngineToggle');
    dom.exerciseSelect = document.getElementById('yogaBreathSelect');
    dom.breathSelect = document.getElementById('yogaBreathSelect');
    dom.meditSelect = document.getElementById('yogaMeditSelect');
    dom.breathBtn = document.getElementById('yogaBreathBtn');
    dom.meditBtn = document.getElementById('yogaMeditBtn');
    dom.panelTabs = document.querySelectorAll('.yoga-panel-tab');
    dom.circle = document.getElementById('yogaCircle');
    dom.phaseIcon = document.getElementById('yogaPhaseIcon');
    dom.phaseText = document.getElementById('yogaPhaseText');
    dom.progressBar = document.getElementById('yogaProgressBar');
    dom.startBtn = document.getElementById('yogaStartBtn');
    dom.pauseBtn = document.getElementById('yogaPauseBtn');
    dom.resetBtn = document.getElementById('yogaResetBtn');
    dom.timer = document.getElementById('yogaTimer');
    dom.cycleCounter = document.getElementById('yogaCycleCounter');
    dom.speedSlider = document.getElementById('yogaSpeedSlider');
    dom.speedLabel = document.getElementById('yogaSpeedLabel');
    dom.guide = document.getElementById('yogaGuide');

    if (dom.breathSelect) dom.breathSelect.addEventListener('change', function () { setExercise(this.value); });
    if (dom.meditSelect) dom.meditSelect.addEventListener('change', function () { setExercise(this.value); });
    dom.panelTabs.forEach(function(tab) {
        tab.addEventListener('click', function() { switchTab(this.getAttribute('data-panel')); });
    });
    if (dom.speedSlider) dom.speedSlider.addEventListener('input', function () { setSpeed(this.value); });
    // Duration preset buttons
    document.querySelectorAll('.yoga-dur-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.yoga-dur-btn').forEach(function(b) { b.classList.remove('active'); });
            this.classList.add('active');
            targetDuration = parseInt(this.getAttribute('data-dur')) || 0;
            // Update timer display to show remaining if running
            if (isRunning && targetDuration > 0) {
                var rem = Math.max(0, targetDuration - Math.floor(elapsedTime / 1000));
                if (dom.timer) dom.timer.textContent = formatTime(rem * 1000);
            }
        });
    });
    if (dom.startBtn) dom.startBtn.addEventListener('click', function () {
        if (isRunning && !isPaused) pause(); else if (isRunning && isPaused) isPaused = false, lastTimestamp = 0, start(); else start();
    });
    if (dom.pauseBtn) { dom.pauseBtn.disabled = true; dom.pauseBtn.addEventListener('click', function () { if (isRunning && !isPaused) pause(); else if (isPaused) { isPaused = false; lastTimestamp = 0; start(); } }); }
    if (dom.resetBtn) dom.resetBtn.addEventListener('click', reset);
    // toggleBtn is now handled by YogaSummary dropdown
    if (dom.breathBtn) dom.breathBtn.addEventListener('click', function () { openPanel('breathing'); });
    if (dom.meditBtn) dom.meditBtn.addEventListener('click', function () { openPanel('meditation'); });
    if (dom.closeBtn) dom.closeBtn.addEventListener('click', function () { if (dom.panel) dom.panel.classList.remove('active'); if (isRunning) stop(); });
    if (dom.panel) dom.panel.addEventListener('click', function (e) { if (e.target === dom.panel) { dom.panel.classList.remove('active'); if (isRunning) stop(); } });
    if (dom.guide) dom.guide.innerHTML = '<p>' + EXERCISES[currentExercise].guide + '</p>';
    reset();
}

return { init: init, start: start, pause: pause, stop: stop, reset: reset, setExercise: setExercise, setSpeed: setSpeed, openPanel: openPanel, switchTab: switchTab };
})();
