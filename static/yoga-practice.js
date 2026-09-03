// ================================================================
//  YOGA PRACTICE — تمرین یوگا
//  جلسه‌ساز + راهنمای گام‌به‌گام با روابط واقعی حرکات
//  داده و تصاویر: YogaCore (منبع واحد حقیقت)
// ================================================================
(function () {
'use strict';

var C = window.YogaCore;

// ─── Constants ───
var BACKGROUNDS = [
    { id: 'forest',  emoji: '🌲', name: 'جنگل',  gradient: 'linear-gradient(135deg, #0a1a0a 0%, #0d2818 30%, #1a3a1a 60%, #0f2f12 100%)', overlay: 'radial-gradient(ellipse at 50% 120%, rgba(34,139,34,0.15) 0%, transparent 70%)' },
    { id: 'beach',   emoji: '🌊', name: 'ساحل',   gradient: 'linear-gradient(135deg, #0a1628 0%, #0d2137 30%, #1a3050 60%, #0f2a40 100%)', overlay: 'radial-gradient(ellipse at 50% 130%, rgba(0,180,216,0.12) 0%, transparent 70%)' },
    { id: 'mountain', emoji: '🏔️', name: 'کوه',   gradient: 'linear-gradient(135deg, #0d0a1a 0%, #1a1040 30%, #2a1860 60%, #15103a 100%)', overlay: 'radial-gradient(ellipse at 50% 30%, rgba(138,100,255,0.1) 0%, transparent 70%)' },
    { id: 'night',   emoji: '🌙', name: 'شب',     gradient: 'linear-gradient(135deg, #05050f 0%, #0a0a20 30%, #10103a 60%, #08081a 100%)', overlay: 'radial-gradient(ellipse at 50% 20%, rgba(100,100,255,0.06) 0%, transparent 70%)' },
    { id: 'sunrise', emoji: '🌅', name: 'طلوع',   gradient: 'linear-gradient(135deg, #1a0a00 0%, #2a1500 30%, #3a2010 60%, #20100a 100%)', overlay: 'radial-gradient(ellipse at 50% 130%, rgba(255,165,0,0.12) 0%, transparent 70%)' }
];

var TIMER_CHOICES = [30, 60, 90, 120, 180, 300];
var BREATH_CHOICES = [3, 4, 5, 6];

// ─── State ───
var state = {
    sessionNames: [],      // ordered pose names for the guided session
    currentPoseIdx: 0,
    timerTotal: 90,
    timerRemaining: 90,
    timerRunning: false,
    timerInterval: null,
    breathCount: 4,
    background: 'forest',
    audioPlaying: false,
    audioCtx: null,
    audioGain: null,
    audioNodes: [],
    audioVolume: 0.5,
    guidedActive: false,   // true while inside the guided runner
    sessionCompleted: false,
    recorded: false,
    sessionSeconds: 0,
    breathPhase: 'idle',
    lastTick: null
};

// ─── Helpers ───
function pad2(n) { return n < 10 ? '0' + n : '' + n; }
function fmt(sec) { return pad2(Math.floor(sec / 60)) + ':' + pad2(Math.floor(sec) % 60); }
function poseAt(i) {
    var n = state.sessionNames[i];
    return n ? C.get(n) : null;
}
function currentPose() { return poseAt(state.currentPoseIdx); }
function isLast() { return state.currentPoseIdx >= state.sessionNames.length - 1; }

// ─── Audio ───
function startAmbientSound() {
    if (window.AudioManager) {
        AudioManager.play(AudioManager.getCurrentTrack());
        state.audioPlaying = true;
        updateAudioUI();
        return;
    }
    if (state.audioCtx) return;
    try {
        state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        state.audioGain = state.audioCtx.createGain();
        state.audioGain.gain.value = state.audioVolume;
        state.audioGain.connect(state.audioCtx.destination);
        var ctx = state.audioCtx, now = ctx.currentTime;
        function osc(freq, gainVal) {
            var o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = freq;
            var g = ctx.createGain(); g.gain.value = gainVal;
            o.connect(g); g.connect(state.audioGain); o.start(now);
            state.audioNodes.push(o, g);
        }
        osc(136.1, 0.12); osc(272.2, 0.06); osc(68.05, 0.08);
        var lfo = ctx.createOscillator(); lfo.frequency.value = 0.1;
        var lfoG = ctx.createGain(); lfoG.gain.value = 3;
        lfo.connect(lfoG); lfoG.connect(state.audioNodes[0].frequency); lfo.start(now);
        state.audioNodes.push(lfo, lfoG);
        state.audioPlaying = true;
        updateAudioUI();
    } catch (e) { console.warn('Web Audio unavailable:', e); }
}
function stopAmbientSound() {
    if (window.AudioManager) {
        AudioManager.stop();
        state.audioPlaying = false;
        updateAudioUI();
        return;
    }
    state.audioNodes.forEach(function (n) {
        try { n.stop && n.stop(); } catch (e) {}
        try { n.disconnect(); } catch (e) {}
    });
    state.audioNodes = [];
    state.audioPlaying = false;
    updateAudioUI();
}
function toggleAudio() { if (state.audioPlaying) stopAmbientSound(); else startAmbientSound(); }
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
    if (state.timerRunning || !state.guidedActive) return;
    state.timerRunning = true;
    state.lastTick = Date.now();
    state.timerInterval = setInterval(function () {
        var nowMs = Date.now();
        var delta = Math.min(5, (nowMs - (state.lastTick || nowMs)) / 1000);
        state.lastTick = nowMs;
        state.sessionSeconds += delta;
        if (state.timerRemaining <= 0) {
            onPoseComplete();
            return;
        }
        state.timerRemaining = Math.max(0, state.timerRemaining - delta);
        updateTimerDisplay();
        updateBreathGuide();
    }, 250);
    updateControlButtons();
}
function pauseTimer() {
    state.timerRunning = false;
    state.lastTick = null;
    if (state.timerInterval) { clearInterval(state.timerInterval); state.timerInterval = null; }
    updateControlButtons();
    updateBreathGuide(true);
}
function resetTimer() {
    pauseTimer();
    state.timerRemaining = state.timerTotal;
    state.breathPhase = 'idle';
    updateTimerDisplay();
    updateBreathGuide(true);
    updateControlButtons();
}
function stopTimerHard() {
    state.timerRunning = false;
    if (state.timerInterval) { clearInterval(state.timerInterval); state.timerInterval = null; }
}

function onPoseComplete() {
    if (!state.guidedActive) return;
    pauseTimer();
    if (state.sessionCompleted) return;
    if (isLast()) {
        finishSession();
        return;
    }
    state.currentPoseIdx++;
    state.timerRemaining = state.timerTotal;
    state.breathPhase = 'idle';
    updatePoseView(true);
    // مکث کوتاه برای آماده‌شدن
    setTimeout(function () {
        if (state.guidedActive && !state.sessionCompleted && state.currentPoseIdx === _poseIdxAtSchedule) {
            if (!state.timerRunning && state.timerRemaining > 0) startTimer();
        }
    }, 2200);
    _poseIdxAtSchedule = state.currentPoseIdx;
}
var _poseIdxAtSchedule = 0;

function finishSession() {
    stopTimerHard();
    state.sessionCompleted = true;
    var secs = Math.round(state.sessionSeconds);
    if (secs >= 20 && !state.recorded) {
        state.recorded = true;
        C.recordPractice(Math.max(1, Math.round(secs / 60)), { type: 'yoga' });
    }
    stopAmbientSound();
    renderComplete(secs);
}

function updateTimerDisplay() {
    var el = document.getElementById('ypTimerValue');
    if (el) el.textContent = fmt(state.timerRemaining);
    var ring = document.getElementById('ypProgressRing');
    if (ring) {
        var pct = state.timerTotal > 0 ? (1 - state.timerRemaining / state.timerTotal) : 0;
        var circ = 2 * Math.PI * 90;
        ring.style.strokeDashoffset = circ * (1 - pct);
    }
}
function updateControlButtons() {
    var playBtn = document.getElementById('ypPlayBtn');
    if (playBtn) playBtn.textContent = state.timerRunning ? '⏸️' : '▶️';
}

// ─── Breath guide ───
function updateBreathGuide(forceIdle) {
    var circle = document.getElementById('ypBreathCircle');
    var label = document.getElementById('ypBreathLabel');
    if (!circle || !label) return;
    if (forceIdle || !state.timerRunning || state.timerRemaining <= 0) {
        circle.className = 'yp-breath-circle';
        circle.style.transform = 'scale(1)';
        label.textContent = 'آماده باشید...';
        return;
    }
    var elapsed = state.timerTotal - state.timerRemaining;
    var cycleLen = state.breathCount * 3;
    var pos = (elapsed % cycleLen) / cycleLen;
    if (pos < 0.33) {
        circle.className = 'yp-breath-circle inhale';
        circle.style.transform = 'scale(' + (0.8 + (pos / 0.33) * 0.4) + ')';
        label.textContent = '🌬️ دم بکش...';
    } else if (pos < 0.66) {
        circle.className = 'yp-breath-circle hold';
        circle.style.transform = 'scale(1.2)';
        label.textContent = '⏸️ حبس کن...';
    } else {
        circle.className = 'yp-breath-circle exhale';
        circle.style.transform = 'scale(' + (1.2 - ((pos - 0.66) / 0.34) * 0.4) + ')';
        label.textContent = '🌊 بازدم...';
    }
}

// ─── Guided runner render ───
function renderPracticePage() {
    var container = document.getElementById('yogaPracticePanel');
    if (!container) return;
    var pose = currentPose();
    if (!pose && !state.sessionNames.length) {
        renderHub();
        return;
    }
    var bg = BACKGROUNDS.filter(function (b) { return b.id === state.background; })[0] || BACKGROUNDS[0];

    var html = '';
    html += '<div class="yp-bg" id="ypBg" style="background:' + bg.gradient + ';">';
    html += '<div class="yp-bg-overlay" style="background:' + bg.overlay + ';"></div>';
    html += '<div class="yp-bg-particles" id="ypParticles"></div>';
    html += '</div>';

    html += '<div class="yp-content">';
    html += '<div class="yp-header">';
    html += '<button class="yp-back-btn" id="ypBackBtn">➡️ خروج از تمرین</button>';
    html += '<h2 class="yp-title">🧘 تمرین هدایت‌شده</h2>';
    html += '<div class="yp-header-actions">';
    html += '<button class="yp-icon-btn" id="ypSettingsToggle" title="تنظیمات">⚙️</button>';
    html += '</div>';
    html += '</div>';

    var idx = state.currentPoseIdx, total = state.sessionNames.length;
    html += '<div class="yp-pose-area">';
    html += '<div class="yp-pose-image-wrap">';
    html += '<div class="yp-pose-image" id="ypPoseImage">';
    if (pose) {
        var sideNow = preferredSide(pose);
        var imgUrl = C.getImage(pose, { size: 'full', side: sideNow });
        var fb = C.placeholderSvg(pose, 460);
        html += '<img src="' + C.escAttr(imgUrl) + '" alt="' + C.escAttr(C.nameEn(pose)) + '" data-fb="' + C.escAttr(fb) + '"';
        html += ' onerror="if(this.src!==this.getAttribute(\'data-fb\')){this.onerror=null;this.src=this.getAttribute(\'data-fb\');}">';
    }
    html += '</div>';
    if (pose && C.canSwitchSide(pose)) {
        html += '<div class="yp-side-switch" id="ypSideSwitch">';
        html += '<button class="yp-side-btn' + (sideNow === 'R' ? ' active' : '') + '" data-yoga-side="R">راست</button>';
        html += '<button class="yp-side-btn' + (sideNow === 'L' ? ' active' : '') + '" data-yoga-side="L">چپ</button>';
        html += '</div>';
    }
    html += '</div>';

    html += '<div class="yp-pose-info" id="ypPoseInfo">' + poseInfoHtml() + '</div>';
    html += '</div>';

    // Progress strip across whole session
    html += '<div class="yp-session-progress">';
    for (var i = 0; i < total; i++) {
        var done = i < idx, cur = i === idx;
        html += '<span class="yp-sp-dot' + (done ? ' done' : '') + (cur ? ' cur' : '') + '" title="' + C.escAttr(C.nameFa(poseAt(i))) + '"></span>';
    }
    html += '</div>';

    html += '<div class="yp-timer-area">';
    html += '<div class="yp-timer-ring">';
    html += '<svg viewBox="0 0 200 200">';
    html += '<circle class="yp-timer-track" cx="100" cy="100" r="90"/>';
    html += '<circle class="yp-timer-progress" id="ypProgressRing" cx="100" cy="100" r="90" style="stroke-dasharray: ' + (2 * Math.PI * 90) + '; stroke-dashoffset: ' + (2 * Math.PI * 90) + ';"/>';
    html += '</svg>';
    html += '<div class="yp-timer-value" id="ypTimerValue">' + fmt(state.timerRemaining) + '</div>';
    html += '<div class="yp-timer-label" id="ypCounterLabel">' + C.faNum(idx + 1) + ' از ' + C.faNum(total) + '</div>';
    html += '</div>';
    html += '</div>';

    html += '<div class="yp-breath-area">';
    html += '<div class="yp-breath-circle" id="ypBreathCircle">';
    html += '<span class="yp-breath-icon" id="ypBreathLabel">آماده باشید...</span>';
    html += '</div>';
    html += '</div>';

    html += '<div class="yp-controls">';
    html += '<button class="yp-ctrl-btn" id="ypPrevBtn" title="حرکت قبلی" ' + (idx === 0 ? 'disabled' : '') + '>⏮️</button>';
    html += '<button class="yp-ctrl-btn yp-play" id="ypPlayBtn" title="شروع/مکث">▶️</button>';
    html += '<button class="yp-ctrl-btn" id="ypNextBtn" title="حرکت بعدی" ' + (isLast() ? 'disabled' : '') + '>⏭️</button>';
    html += '<button class="yp-ctrl-btn" id="ypResetBtn" title="شروع دوباره این حرکت">🔄</button>';
    html += '</div>';

    // Instructions
    html += '<div class="yp-instructions" id="ypInstructions"></div>';

    html += '<div class="yp-audio">';
    html += '<button class="yp-audio-toggle" id="ypAudioToggle" title="صدای محیط">▶️</button>';
    html += '<span class="yp-audio-label" id="ypAudioLabel">صدای محیط</span>';
    html += '<input type="range" class="yp-audio-volume" id="ypAudioVolume" min="0" max="1" step="0.05" value="' + state.audioVolume + '">';
    html += '</div>';

    html += '</div>'; // yp-content

    html += renderSettingsPanel();

    html += '<div class="yp-complete-overlay" id="ypCompleteOverlay" style="display:none;">';
    html += '<div class="yp-complete-card" id="ypCompleteCard"></div>';
    html += '</div>';

    container.innerHTML = html;
    bindRunnerEvents();
    createParticles();
    updatePoseView(true);
    updateTimerDisplay();
    updateBreathGuide(true);
    updateControlButtons();
    updateAudioUI();
    if (state.timerRunning) startTimer();
}

function renderInstructions() {
    var el = document.getElementById('ypInstructions');
    if (!el) return;
    var pose = currentPose();
    if (!pose) { el.innerHTML = ''; return; }
    var desc = pose.description_fa || pose.description || '';
    var benefits = pose.benefits_fa || pose.benefits || '';
    var html = '';
    if (desc) {
        html += '<div class="yp-instr-card">';
        html += '<div class="yp-instr-title">📖 راهنمای حرکت</div>';
        html += '<p>' + C.renderDesc(desc, { linkRefs: false }) + '</p>';
        html += '</div>';
    }
    if (benefits) {
        html += '<div class="yp-instr-card yp-instr-benefits">';
        html += '<div class="yp-instr-title">✨ فواید</div>';
        html += '<p>' + C.esc(benefits) + '</p>';
        html += '</div>';
    }
    if (!html) {
        html = '<div class="yp-instr-card"><p class="yp-instr-empty">برای این حرکت توضیحی ثبت نشده است — روی تنفس و آگاهی از بدن تمرکز کنید.</p></div>';
    }
    el.innerHTML = html;
}

function poseInfoHtml() {
    var pose = currentPose();
    var idx = state.currentPoseIdx, total = state.sessionNames.length;
    var html = '';
    if (idx > 0) {
        var prevP = poseAt(idx - 1);
        html += '<div class="yp-context">ادامه از: <strong>' + C.esc(C.nameFa(prevP)) + '</strong></div>';
    } else {
        html += '<div class="yp-context yp-context-start">حرکت آغازین جلسه</div>';
    }
    html += '<div class="yp-pose-name-fa" id="ypPoseNameFa">' + (pose ? C.esc(C.nameFa(pose)) : '') + '</div>';
    html += '<div class="yp-pose-name-en" id="ypPoseNameEn">' + (pose ? C.esc(C.nameEn(pose)) : '') + '</div>';
    if (pose && pose.sanskrit_names && pose.sanskrit_names[0]) {
        var san = pose.sanskrit_names[0];
        html += '<div class="yp-pose-sanskrit">' + C.esc(san.devanagari ? san.devanagari + ' · ' : '') + C.esc(san.latin || san.simplified) + '</div>';
    }
    if (pose) {
        html += '<div class="yp-pose-meta">';
        html += '<span>' + (C.DIFFICULTY_STARS[pose.difficulty] || '') + ' ' + (C.DIFFICULTY_FA[pose.difficulty] || '') + '</span>';
        html += '<span>' + (C.catIcon(pose.category) || '') + ' ' + C.catFa(pose.category) + ' · ' + C.subFa(pose.subcategory) + '</span>';
        html += '</div>';
    }
    if (idx < total - 1) {
        var nextP = poseAt(idx + 1);
        html += '<div class="yp-context yp-context-next">بعدی: <strong>' + C.esc(C.nameFa(nextP)) + '</strong></div>';
    } else {
        html += '<div class="yp-context yp-context-end">حرکت پایانی جلسه 🏁</div>';
    }
    return html;
}

function preferredSide(pose) {
    var pref = C.sideOf(pose.preferred_side);
    return C.sideAvailable(pose.name, pref) ? pref : (C.sideAvailable(pose.name, 'R') ? 'R' : 'L');
}

function updatePoseView(rebuildInstr) {
    var pose = currentPose();
    if (!pose) return;
    var nameFa = document.getElementById('ypPoseNameFa');
    var nameEn = document.getElementById('ypPoseNameEn');
    var imgEl = document.getElementById('ypPoseImage');
    var side = preferredSide(pose);
    if (nameFa) nameFa.textContent = C.nameFa(pose);
    if (nameEn) nameEn.textContent = C.nameEn(pose);
    if (imgEl) {
        var img = imgEl.querySelector('img');
        if (img) {
            img.src = C.getImage(pose, { size: 'full', side: side });
            img.setAttribute('data-fb', C.placeholderSvg(pose, 460));
            img.alt = C.nameEn(pose);
        }
    }
    // Side switch visibility (fixed width so the layout does not jump)
    var sw = document.getElementById('ypSideSwitch');
    if (sw) {
        var canSwitch = C.canSwitchSide(pose);
        sw.style.visibility = canSwitch ? 'visible' : 'hidden';
        if (canSwitch) {
            sw.querySelectorAll('button').forEach(function (b) {
                b.classList.toggle('active', b.getAttribute('data-yoga-side') === side);
            });
        }
    }
    var label = document.getElementById('ypCounterLabel');
    if (label) label.textContent = C.faNum(state.currentPoseIdx + 1) + ' از ' + C.faNum(state.sessionNames.length);
    var infoBox = document.getElementById('ypPoseInfo');
    if (infoBox) infoBox.innerHTML = poseInfoHtml();
    // dots
    var dots = document.querySelectorAll('.yp-sp-dot');
    dots.forEach(function (d, i) {
        d.classList.toggle('done', i < state.currentPoseIdx);
        d.classList.toggle('cur', i === state.currentPoseIdx);
    });
    var pBtn = document.getElementById('ypPrevBtn');
    var nBtn = document.getElementById('ypNextBtn');
    if (pBtn) pBtn.disabled = state.currentPoseIdx === 0;
    if (nBtn) nBtn.disabled = isLast();
    if (rebuildInstr) renderInstructions();
}

// ─── Settings panel ───
function renderSettingsPanel() {
    var html = '<div class="yp-settings" id="ypSettings">';
    html += '<div class="yp-setting-row"><div class="yp-setting-label">⏱️ زمان هر حرکت</div><div class="yp-setting-options">';
    TIMER_CHOICES.forEach(function (sec) {
        html += '<button class="yp-opt-btn' + (state.timerTotal === sec ? ' active' : '') + '" data-setting="duration" data-value="' + sec + '">' + fmt(sec) + '</button>';
    });
    html += '</div></div>';
    html += '<div class="yp-setting-row"><div class="yp-setting-label">💨 تعداد نفس</div><div class="yp-setting-options">';
    BREATH_CHOICES.forEach(function (c) {
        html += '<button class="yp-opt-btn' + (state.breathCount === c ? ' active' : '') + '" data-setting="breath" data-value="' + c + '">' + C.faNum(c) + '</button>';
    });
    html += '</div></div>';
    html += '<div class="yp-setting-row"><div class="yp-setting-label">🌄 پس‌زمینه</div><div class="yp-setting-options">';
    BACKGROUNDS.forEach(function (bg) {
        html += '<button class="yp-bg-btn' + (state.background === bg.id ? ' active' : '') + '" data-setting="bg" data-value="' + bg.id + '" title="' + C.escAttr(bg.name) + '">' + bg.emoji + '</button>';
    });
    html += '</div></div>';
    html += '</div>';
    return html;
}

function setBackground(bgId) {
    state.background = bgId;
    var bg = BACKGROUNDS.filter(function (b) { return b.id === bgId; })[0] || BACKGROUNDS[0];
    var bgEl = document.getElementById('ypBg');
    if (bgEl) bgEl.style.background = bg.gradient;
    var ov = bgEl ? bgEl.querySelector('.yp-bg-overlay') : null;
    if (ov) ov.style.background = bg.overlay;
    document.querySelectorAll('.yp-bg-btn').forEach(function (b) {
        b.classList.toggle('active', b.getAttribute('data-value') === bgId);
    });
}

// ─── Runner events ───
function bindRunnerEvents() {
    var backBtn = document.getElementById('ypBackBtn');
    if (backBtn) backBtn.addEventListener('click', exitRunner);

    var playBtn = document.getElementById('ypPlayBtn');
    if (playBtn) playBtn.addEventListener('click', function () {
        if (state.timerRunning) pauseTimer(); else startTimer();
    });
    var resetBtn = document.getElementById('ypResetBtn');
    if (resetBtn) resetBtn.addEventListener('click', function () { resetTimer(); });

    var prevBtn = document.getElementById('ypPrevBtn');
    var nextBtn = document.getElementById('ypNextBtn');
    if (prevBtn) prevBtn.addEventListener('click', function () {
        if (state.currentPoseIdx > 0) {
            stopTimerHard();
            state.currentPoseIdx--;
            state.timerRemaining = state.timerTotal;
            updatePoseView(true);
            updateTimerDisplay();
            updateBreathGuide(true);
        }
    });
    if (nextBtn) nextBtn.addEventListener('click', function () {
        if (isLast()) {
            finishSession();
            return;
        }
        stopTimerHard();
        state.currentPoseIdx++;
        state.timerRemaining = state.timerTotal;
        updatePoseView(true);
        updateTimerDisplay();
        updateBreathGuide(true);
        if (state.guidedActive) startTimer();
    });

    // Side switch
    var sw = document.getElementById('ypSideSwitch');
    if (sw) sw.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-yoga-side]');
        if (!btn) return;
        var side = btn.getAttribute('data-yoga-side');
        var pose = currentPose();
        if (pose && C.sideAvailable(pose.name, side)) {
            var imgEl = document.getElementById('ypPoseImage');
            var img = imgEl ? imgEl.querySelector('img') : null;
            if (img) {
                img.src = C.getImage(pose, { size: 'full', side: side });
                img.setAttribute('data-fb', C.placeholderSvg(pose, 460));
            }
            sw.querySelectorAll('button').forEach(function (b) {
                b.classList.toggle('active', b.getAttribute('data-yoga-side') === side);
            });
        }
    });

    var audioToggle = document.getElementById('ypAudioToggle');
    if (audioToggle) audioToggle.addEventListener('click', toggleAudio);
    var audioVol = document.getElementById('ypAudioVolume');
    if (audioVol) audioVol.addEventListener('input', function () {
        setAudioVolume(parseFloat(this.value));
    });

    var settingsToggle = document.getElementById('ypSettingsToggle');
    var settingsPanel = document.getElementById('ypSettings');
    if (settingsToggle && settingsPanel) {
        settingsToggle.addEventListener('click', function () {
            settingsPanel.classList.toggle('open');
        });
    }
    document.querySelectorAll('.yp-opt-btn, .yp-bg-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var setting = this.dataset.setting;
            var value = this.dataset.value;
            this.parentElement.querySelectorAll('.yp-opt-btn, .yp-bg-btn').forEach(function (b) { b.classList.remove('active'); });
            this.classList.add('active');
            if (setting === 'duration') {
                state.timerTotal = parseInt(value, 10);
                if (!state.timerRunning) {
                    state.timerRemaining = state.timerTotal;
                    updateTimerDisplay();
                }
            } else if (setting === 'breath') {
                state.breathCount = parseInt(value, 10);
            } else if (setting === 'bg') {
                setBackground(value);
            }
        });
    });
}

function exitRunner() {
    stopTimerHard();
    stopAmbientSound();
    state.guidedActive = false;
    state.sessionCompleted = false;
    if (window.YogaLibrary) window.YogaLibrary.setTab('library');
}

function renderComplete(secs) {
    var card = document.getElementById('ypCompleteCard');
    var overlay = document.getElementById('ypCompleteOverlay');
    if (!card || !overlay) return;
    var minutes = Math.max(1, Math.round(secs / 60));
    var flowCount = state.sessionNames.length;
    var html = '';
    html += '<div class="yp-complete-emoji">🎉</div>';
    html += '<h2>جلسه کامل شد!</h2>';
    html += '<p>آفرین! ' + C.faNum(flowCount) + ' حرکت را با ' + C.faNum(minutes) + ' دقیقه تمرین به پایان رساندید.</p>';
    // mini recap thumbs
    html += '<div class="yp-complete-recap">';
    state.sessionNames.forEach(function (n, i) {
        var p = C.get(n);
        if (!p) return;
        html += '<div class="yp-recap-item' + (i === state.currentPoseIdx ? ' last' : ' done') + '">';
        var img = C.getImage(p, { size: 'card', side: C.sideOf(p.preferred_side) });
        html += '<img src="' + C.escAttr(img) + '" alt="' + C.escAttr(C.nameEn(p)) + '" data-fb="' + C.escAttr(C.placeholderSvg(p, 200)) + '"';
        html += ' onerror="if(this.src!==this.getAttribute(\'data-fb\')){this.onerror=null;this.src=this.getAttribute(\'data-fb\');}">';
        html += '<span class="yp-recap-num">' + C.faNum(i + 1) + '</span>';
        html += '</div>';
    });
    html += '</div>';
    html += '<div class="yp-complete-actions">';
    html += '<button class="yp-ctrl-btn yp-play" data-yp-restart>🔄 تمرین دوباره</button>';
    html += '<button class="yp-ctrl-btn yp-ghost" data-yp-done>بازگشت به کتابخانه</button>';
    html += '</div>';
    card.innerHTML = html;
    overlay.style.display = 'flex';
    var restart = card.querySelector('[data-yp-restart]');
    if (restart) restart.addEventListener('click', function () {
        state.guidedActive = false;
        launch(state.sessionNames);
    });
    var done = card.querySelector('[data-yp-done]');
    if (done) done.addEventListener('click', exitRunner);
}

function createParticles() {
    var container = document.getElementById('ypParticles');
    if (!container) return;
    container.innerHTML = '';
    for (var i = 0; i < 18; i++) {
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

// ═══════════ Session hub ═══════════
function renderHub() {
    var container = document.getElementById('yogaPracticePanel');
    if (!container) return;
    var names = C.getSession().filter(function (n) { return C.get(n); });
    var favs = C.getFavs().filter(function (n) { return C.get(n) && names.indexOf(n) < 0; });
    var html = '<div class="yk-hub">';
    html += '<div class="yk-hub-head">';
    html += '<div><h3>🧘 جلسه تمرین شما</h3>';
    html += '<p class="yk-hub-sub">حرکات را مرتب کنید — هنگام اجرا، ترتیب و روابط واقعی حرکات حفظ می‌شود.</p></div>';
    html += '</div>';

    if (names.length) {
        html += '<div class="yk-hub-list">';
        names.forEach(function (n, i) {
            var p = C.get(n);
            var locked = !C.canAccess(p.difficulty);
            html += '<div class="yk-hub-item' + (locked ? ' locked' : '') + '">';
            html += '<span class="yk-hub-idx">' + C.faNum(i + 1) + '</span>';
            html += '<div class="yk-hub-thumb">' + imgHtml(p) + '</div>';
            html += '<div class="yk-hub-info">';
            html += '<div class="yk-hub-name">' + C.esc(C.nameFa(p)) + (locked ? ' 🔒' : '') + '</div>';
            html += '<div class="yk-hub-sub">' + C.esc(C.nameEn(p)) + ' · ' + (C.DIFFICULTY_STARS[p.difficulty] || '') + ' ' + C.catFa(p.category) + '</div>';
            html += '</div>';
            html += '<div class="yk-hub-ops">';
            html += '<button class="yk-hub-op" data-sess-move="-1" data-idx="' + i + '" title="جابه‌جایی بالا" ' + (i === 0 ? 'disabled' : '') + '>↑</button>';
            html += '<button class="yk-hub-op" data-sess-move="1" data-idx="' + i + '" title="جابه‌جایی پایین" ' + (i === names.length - 1 ? 'disabled' : '') + '>↓</button>';
            html += '<button class="yk-hub-op danger" data-sess-del data-idx="' + i + '" title="حذف">✕</button>';
            html += '</div>';
            html += '</div>';
        });
        html += '</div>';
    } else {
        html += '<div class="yk-hub-empty">جلسه شما خالی است. از کتابخانه یا علاقه‌مندی‌ها حرکت اضافه کنید، یا یک جریان پیشنهادی بسازید.</div>';
    }

    html += '<div class="yk-hub-row">';
    html += '<button class="yk-hub-action" data-hub-flow>✨ ساخت جریان پیشنهادی (' + C.faNum(8) + ' حرکت)</button>';
    html += '<button class="yk-hub-action ghost' + (names.length ? '' : ' disabled') + '" data-hub-clear>🗑 پاک کردن جلسه</button>';
    html += '</div>';

    if (favs.length) {
        html += '<div class="yk-hub-section-title">♥ افزودن از علاقه‌مندی‌ها</div>';
        html += '<div class="yk-hub-chips">';
        favs.forEach(function (n) {
            var p = C.get(n);
            html += '<button class="yk-hub-chip" data-hub-add="' + C.escAttr(n) + '">' + C.esc(C.nameFa(p)) + '</button>';
        });
        html += '</div>';
    }
    // Suggestions from favourites of the flow for quick add (top recs in difficulty range)
    var pool = C.getPoses().filter(function (p) {
        if (p.visibility === 'tertiary') return false;
        if (names.indexOf(p.name) >= 0 || favs.indexOf(p.name) >= 0) return false;
        return C.canAccess(p.difficulty);
    });
    if (pool.length) {
        var picks = pool.slice(0, 60).sort(function () { return Math.random() - 0.5; }).slice(0, 10);
        html += '<div class="yk-hub-section-title">⚡ پیشنهادهای سریع</div>';
        html += '<div class="yk-hub-chips">';
        picks.forEach(function (p) {
            html += '<button class="yk-hub-chip alt" data-hub-add="' + C.escAttr(p.name) + '">' + C.esc(C.nameFa(p)) + '</button>';
        });
        html += '</div>';
    }

    // Settings
    html += '<div class="yk-hub-settings">';
    html += '<div class="yk-hub-section-title">تنظیمات اجرا</div>';
    html += '<div class="yk-hub-settings-row"><span>⏱ زمان هر حرکت</span><div>';
    TIMER_CHOICES.forEach(function (sec) {
        html += '<button class="yp-opt-btn' + (state.timerTotal === sec ? ' active' : '') + '" data-hub-dur="' + sec + '">' + fmt(sec) + '</button>';
    });
    html += '</div></div>';
    html += '<div class="yk-hub-settings-row"><span>🌄 پس‌زمینه</span><div>';
    BACKGROUNDS.forEach(function (bg) {
        html += '<button class="yp-bg-btn' + (state.background === bg.id ? ' active' : '') + '" data-hub-bg="' + bg.id + '" title="' + C.escAttr(bg.name) + '">' + bg.emoji + '</button>';
    });
    html += '</div></div>';
    html += '</div>';

    html += '<button class="yk-hub-start" id="ykHubStart"' + (names.length ? '' : ' disabled') + '>▶ شروع تمرین (' + C.faNum(names.length) + ' حرکت)</button>';
    html += '</div>';
    container.innerHTML = html;
    ensureHubEvents();
}

var _hubBound = false;
function ensureHubEvents() {
    if (_hubBound) return;
    _hubBound = true;
    var panel = document.getElementById('yogaPracticePanel');
    if (!panel) return;
    panel.addEventListener('click', hubClickHandler);
}

function hubClickHandler(e) {
    var move = e.target.closest('[data-sess-move]');
    if (move) {
        var from = parseInt(move.dataset.idx, 10);
        C.moveInSession(from, from + parseInt(move.dataset.sessMove, 10));
        renderHub();
        return;
    }
    var del = e.target.closest('[data-sess-del]');
    if (del) {
        var s = C.getSession();
        var n = s[parseInt(del.dataset.idx, 10)];
        if (n) C.removeFromSession(n);
        renderHub();
        return;
    }
    var add = e.target.closest('[data-hub-add]');
    if (add) {
        C.addToSession(add.getAttribute('data-hub-add'));
        renderHub();
        return;
    }
    if (e.target.closest('[data-hub-clear]')) {
        C.setSession([]);
        renderHub();
        return;
    }
    if (e.target.closest('[data-hub-flow]')) {
        var flow = C.buildFlow('auto', 8);
        if (flow.length) C.setSession(flow);
        renderHub();
        return;
    }
    var dur = e.target.closest('[data-hub-dur]');
    if (dur) {
        state.timerTotal = parseInt(dur.getAttribute('data-hub-dur'), 10);
        state.timerRemaining = state.timerTotal;
        renderHub();
        return;
    }
    var bg = e.target.closest('[data-hub-bg]');
    if (bg) {
        state.background = bg.getAttribute('data-hub-bg');
        renderHub();
        return;
    }
    if (e.target.closest('#ykHubStart')) {
        var names = C.getSession();
        if (names.length) launch(names);
    }
}

function imgHtml(p) {
    var img = C.getImage(p, { size: 'card', side: C.sideOf(p.preferred_side) });
    var fb = C.placeholderSvg(p, 200);
    return '<img src="' + C.escAttr(img) + '" alt="' + C.escAttr(C.nameEn(p)) + '" data-fb="' + C.escAttr(fb) + '"' +
        ' onerror="if(this.src!==this.getAttribute(\'data-fb\')){this.onerror=null;this.src=this.getAttribute(\'data-fb\');}">';
}

// ═══════════ Session control ═══════════
function launch(names) {
    stopTimerHard();
    stopAmbientSound();
    if (!names || !names.length) {
        state.guidedActive = false;
        renderHub();
        return;
    }
    // Filter to poses that exist; keep explicit user order
    var valid = [];
    names.forEach(function (n) { if (C.get(n) && valid.indexOf(n) < 0) valid.push(n); });
    if (!valid.length) { state.guidedActive = false; renderHub(); return; }
    C.setSession(valid);
    state.sessionNames = valid;
    state.currentPoseIdx = 0;
    state.timerRemaining = state.timerTotal;
    state.timerRunning = false;
    state.guidedActive = true;
    state.sessionCompleted = false;
    state.recorded = false;
    state.sessionSeconds = 0;
    state.breathPhase = 'idle';
    _poseIdxAtSchedule = 0;
    renderPracticePage();
}

function init() {
    // Ensure data is loaded before showing anything
    var done = function () {
        if (state.guidedActive && !state.sessionCompleted) {
            renderPracticePage();
        } else {
            state.guidedActive = false;
            renderHub();
        }
    };
    if (C.isReady()) { done(); return; }
    C.onReady(done);
}

// ─── Public API ───
window.YogaPractice = {
    init: init,
    launch: launch,
    startSession: launch,           // legacy alias
    restartSession: function () {
        launch(state.sessionNames.length ? state.sessionNames : C.getSession());
    },
    exitRunner: exitRunner,
    isGuidedActive: function () { return state.guidedActive; }
};
})();
