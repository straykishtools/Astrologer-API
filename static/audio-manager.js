/* ═══════════════════════════════════════════════════════════════
   AUDIO MANAGER — سیستم صدای جامع
   Background music, UI SFX, Yoga/Meditation audio, Admin control
   ═══════════════════════════════════════════════════════════════ */
(function () {
'use strict';

/* ─── State ─── */
var ctx = null;          // AudioContext (lazy)
var masterGain = null;
var bgmGain = null;
var sfxGain = null;
var bgmOscillators = []; // currently playing bgm nodes
var bgmAudioEl = null;   // HTMLAudioElement when an uploaded file plays
var bgmAudioNode = null; // MediaElementSourceNode connected to bgmGain
var AUDIO_FILES_KEY = 'cosmic_admin_audio_files'; // آینه‌ی {fileKey: url} برای ستون «فایل»
var bgmPlaying = false;
var bgmPaused = false;
var bgmTimer = null;
var bgmElapsed = 0;
var analyser = null;      // AnalyserNode for visualizer
var vizCanvas = null;     // topbar visualizer canvas
var vizCtx2d = null;      // 2D context of viz canvas
var vizAnimId = null;     // requestAnimationFrame id
var vizMode = 'bars';     // 'bars' or 'radial'
var vizFadeOpacity = 0;   // current fade opacity
var vizTargetOpacity = 0; // target opacity (0 or 0.85)
var sfxMerge = null;      // GainNode merging sfx into analyser

var PREFS_KEY = 'cosmic_audio_prefs';
var PLANS_KEY = 'cosmic_audio_plans';
var PLANS_ADMIN_KEY = 'cosmic_admin_plans';

/* ─── Preferences ─── */
function loadPrefs() {
    try { return JSON.parse(localStorage.getItem(PREFS_KEY) || '{}'); } catch (_) { return {}; }
}
function savePrefs(p) { localStorage.setItem(PREFS_KEY, JSON.stringify(p)); }
var prefs = loadPrefs();

/* ─── Track definitions (procedural) ─── */
var TRACKS = [
    { id: 'cosmic-drone',   name: '.drone کیهانی',      icon: '🌌', category: 'ambient',  gen: genCosmicDrone,   dur: 180 },
    { id: 'rain-forest',    name: 'باران جنگل',          icon: '🌧️', category: 'nature',   gen: genRainForest,    dur: 120 },
    { id: 'ocean-waves',    name: 'امواج اقیانوس',       icon: '🌊', category: 'nature',   gen: genOceanWaves,    dur: 150 },
    { id: 'tibetan-bowl',   name: 'کاسه تبتی',           icon: '🔔', category: 'ambient',  gen: genTibetanBowl,   dur: 120 },
    { id: 'deep-space',     name: 'فضای عمیق',           icon: '✨', category: 'space',    gen: genDeepSpace,     dur: 200 },
    { id: 'wind-chimes',    name: 'ناقوس باد',            icon: '🎐', category: 'ambient',  gen: genWindChimes,    dur: 100 },
    { id: 'forest-birds',   name: 'پرندگان جنگل',        icon: '🐦', category: 'nature',   gen: genForestBirds,   dur: 130 },
    { id: 'singing-bowl',   name: 'آواز کاسه',            icon: '🥣', category: 'meditation', gen: genSingingBowl, dur: 160 }
];

/* ─── SFX definitions ─── */
var SFX = {
    'click':      { freq: 800,  dur: 0.04, type: 'sine',     vol: 0.15 },
    'success':    { freq: [523, 659, 784], dur: 0.15, type: 'sine', vol: 0.2 },
    'error':      { freq: [300, 200], dur: 0.2, type: 'square', vol: 0.12 },
    'tab-switch': { freq: 600, dur: 0.03, type: 'triangle',  vol: 0.08 },
    'inhale':     { freq: [220, 330], dur: 0.8, type: 'sine', vol: 0.06 },
    'exhale':     { freq: [330, 220], dur: 0.8, type: 'sine', vol: 0.06 },
    'chime':      { freq: [880, 1100, 1320], dur: 0.4, type: 'sine', vol: 0.15 },
    'bell':       { freq: 1200, dur: 0.6, type: 'sine', vol: 0.12 },
    'whoosh':     { freq: [800, 200], dur: 0.3, type: 'sawtooth', vol: 0.06 }
};

/* ─── Breath guide presets ─── */
var BREATH_PRESETS = {
    'box':         { inhale: 4, hold1: 4, exhale: 4, hold2: 4, name: 'تنفس بوکس' },
    'relaxing':    { inhale: 4, hold1: 0, exhale: 6, hold2: 0, name: 'تنفس آرام‌بخش' },
    'energizing':  { inhale: 6, hold1: 0, exhale: 2, hold2: 0, name: 'تنفس انرژی‌بخش' },
    '478':         { inhale: 4, hold1: 7, exhale: 8, hold2: 0, name: 'تنفس ۴-۷-۸' },
    'coherent':    { inhale: 5, hold1: 0, exhale: 5, hold2: 0, name: 'تنفس هماهنگ' }
};

/* ═══════════════════════════════════════
   PROCEDURAL SOUND GENERATORS
   ═══════════════════════════════════════ */

function genCosmicDrone(ac, dest, startTime) {
    var nodes = [];
    // Base drone (Om frequency)
    var o1 = ac.createOscillator(); o1.type = 'sine'; o1.frequency.value = 136.1;
    var g1 = ac.createGain(); g1.gain.value = 0.10;
    o1.connect(g1); g1.connect(dest); o1.start(startTime); nodes.push(o1, g1);
    // Harmonic
    var o2 = ac.createOscillator(); o2.type = 'sine'; o2.frequency.value = 272.2;
    var g2 = ac.createGain(); g2.gain.value = 0.05;
    o2.connect(g2); g2.connect(dest); o2.start(startTime); nodes.push(o2, g2);
    // Sub bass
    var o3 = ac.createOscillator(); o3.type = 'sine'; o3.frequency.value = 68.05;
    var g3 = ac.createGain(); g3.gain.value = 0.07;
    o3.connect(g3); g3.connect(dest); o3.start(startTime); nodes.push(o3, g3);
    // LFO modulation
    var lfo = ac.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 0.08;
    var lfoG = ac.createGain(); lfoG.gain.value = 4;
    lfo.connect(lfoG); lfoG.connect(o1.frequency); lfo.start(startTime); nodes.push(lfo, lfoG);
    return nodes;
}

function genRainForest(ac, dest, startTime) {
    var nodes = [];
    // Brown noise (rain)
    var bufLen = ac.sampleRate * 4;
    var buf = ac.createBuffer(1, bufLen, ac.sampleRate);
    var data = buf.getChannelData(0);
    var last = 0;
    for (var i = 0; i < bufLen; i++) {
        var w = Math.random() * 2 - 1;
        last = (last + (0.02 * w)) / 1.02;
        data[i] = last * 3.5;
    }
    var src = ac.createBufferSource(); src.buffer = buf; src.loop = true;
    var filt = ac.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = 800;
    var g = ac.createGain(); g.gain.value = 0.12;
    src.connect(filt); filt.connect(g); g.connect(dest);
    src.start(startTime); nodes.push(src, filt, g);
    // Distant bird chirps (random sine bursts via LFO)
    var bird = ac.createOscillator(); bird.type = 'sine'; bird.frequency.value = 2400;
    var birdG = ac.createGain(); birdG.gain.value = 0;
    var birdLfo = ac.createOscillator(); birdLfo.type = 'sine'; birdLfo.frequency.value = 0.3;
    var birdLfoG = ac.createGain(); birdLfoG.gain.value = 0.008;
    birdLfo.connect(birdLfoG); birdLfoG.connect(birdG.gain);
    bird.connect(birdG); birdG.connect(dest);
    bird.start(startTime); birdLfo.start(startTime);
    nodes.push(bird, birdG, birdLfo, birdLfoG);
    return nodes;
}

function genOceanWaves(ac, dest, startTime) {
    var nodes = [];
    // Filtered noise with slow amplitude modulation
    var bufLen = ac.sampleRate * 6;
    var buf = ac.createBuffer(1, bufLen, ac.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;
    var src = ac.createBufferSource(); src.buffer = buf; src.loop = true;
    var filt = ac.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = 500;
    var g = ac.createGain(); g.gain.value = 0;
    // Slow wave modulation
    var lfo = ac.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 0.08;
    var lfoG = ac.createGain(); lfoG.gain.value = 0.08;
    lfo.connect(lfoG); lfoG.connect(g.gain);
    src.connect(filt); filt.connect(g); g.connect(dest);
    src.start(startTime); lfo.start(startTime);
    nodes.push(src, filt, g, lfo, lfoG);
    return nodes;
}

function genTibetanBowl(ac, dest, startTime) {
    var nodes = [];
    var freqs = [262, 392, 523, 659];
    freqs.forEach(function(f, i) {
        var o = ac.createOscillator(); o.type = 'sine'; o.frequency.value = f;
        var g = ac.createGain(); g.gain.value = 0.04 / (i + 1);
        // Gentle tremolo
        var trem = ac.createOscillator(); trem.type = 'sine'; trem.frequency.value = 0.5 + i * 0.2;
        var tremG = ac.createGain(); tremG.gain.value = 0.01;
        trem.connect(tremG); tremG.connect(g.gain);
        o.connect(g); g.connect(dest);
        o.start(startTime); trem.start(startTime);
        nodes.push(o, g, trem, tremG);
    });
    return nodes;
}

function genDeepSpace(ac, dest, startTime) {
    var nodes = [];
    // Very low rumble
    var o1 = ac.createOscillator(); o1.type = 'sine'; o1.frequency.value = 30;
    var g1 = ac.createGain(); g1.gain.value = 0.08;
    o1.connect(g1); g1.connect(dest); o1.start(startTime); nodes.push(o1, g1);
    // Ethereal pad
    var o2 = ac.createOscillator(); o2.type = 'sine'; o2.frequency.value = 440;
    var g2 = ac.createGain(); g2.gain.value = 0.02;
    var lfo = ac.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 0.03;
    var lfoG = ac.createGain(); lfoG.gain.value = 10;
    lfo.connect(lfoG); lfoG.connect(o2.frequency);
    o2.connect(g2); g2.connect(dest);
    o2.start(startTime); lfo.start(startTime);
    nodes.push(o2, g2, lfo, lfoG);
    return nodes;
}

function genWindChimes(ac, dest, startTime) {
    var nodes = [];
    var chimeFreqs = [1047, 1319, 1568, 2093, 2637];
    chimeFreqs.forEach(function(f, i) {
        var o = ac.createOscillator(); o.type = 'sine'; o.frequency.value = f;
        var g = ac.createGain(); g.gain.value = 0;
        // Random pluck envelope
        var offset = startTime + i * 0.7 + Math.random() * 2;
        g.gain.setValueAtTime(0, offset);
        g.gain.linearRampToValueAtTime(0.03 / (i + 1), offset + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, offset + 1.5);
        o.connect(g); g.connect(dest);
        o.start(offset); o.stop(offset + 2);
        nodes.push(o, g);
    });
    return nodes;
}

function genForestBirds(ac, dest, startTime) {
    var nodes = [];
    // Wind rustling (filtered noise)
    var bufLen = ac.sampleRate * 3;
    var buf = ac.createBuffer(1, bufLen, ac.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;
    var src = ac.createBufferSource(); src.buffer = buf; src.loop = true;
    var filt = ac.createBiquadFilter(); filt.type = 'bandpass'; filt.frequency.value = 2000; filt.Q.value = 0.5;
    var g = ac.createGain(); g.gain.value = 0.04;
    src.connect(filt); filt.connect(g); g.connect(dest);
    src.start(startTime); nodes.push(src, filt, g);
    // Bird chirps
    [1800, 2200, 2600, 3000].forEach(function(f, i) {
        var o = ac.createOscillator(); o.type = 'sine'; o.frequency.value = f;
        var g2 = ac.createGain(); g2.gain.value = 0;
        var t = startTime + i * 1.5 + Math.random() * 3;
        g2.gain.setValueAtTime(0, t);
        g2.gain.linearRampToValueAtTime(0.02, t + 0.05);
        g2.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        o.connect(g2); g2.connect(dest);
        o.start(t); o.stop(t + 0.5);
        nodes.push(o, g2);
    });
    return nodes;
}

function genSingingBowl(ac, dest, startTime) {
    var nodes = [];
    var freqs = [174, 285, 396, 528];
    freqs.forEach(function(f, i) {
        var o = ac.createOscillator(); o.type = 'sine'; o.frequency.value = f;
        var o2 = ac.createOscillator(); o2.type = 'sine'; o2.frequency.value = f * 1.002; // slight detune for beating
        var g = ac.createGain(); g.gain.value = 0.035 / (i + 1);
        o.connect(g); o2.connect(g); g.connect(dest);
        o.start(startTime); o2.start(startTime);
        nodes.push(o, o2, g);
    });
    return nodes;
}

/* ═══════════════════════════════════════
   AUDIO CONTEXT INIT
   ═══════════════════════════════════════ */

function ensureCtx() {
    if (ctx) return true;
    try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        masterGain = ctx.createGain();
        masterGain.gain.value = 1;
        masterGain.connect(ctx.destination);
        bgmGain = ctx.createGain();
        bgmGain.gain.value = prefs.bgmVolume || 0.5;
        // AnalyserNode for frequency visualizer
        analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        analyser.smoothingTimeConstant = 0.75;
        bgmGain.connect(analyser);
        analyser.connect(masterGain);
        // SFX also feeds into analyser for visualization
        sfxMerge = ctx.createGain(); sfxMerge.gain.value = 0.5;
        sfxMerge.connect(analyser);
        // Attach visualizer canvas
        vizCanvas = document.getElementById('topbarVisualizer');
        if (vizCanvas) {
            vizCtx2d = vizCanvas.getContext('2d');
            vizCanvas.addEventListener('click', function() {
                vizMode = vizMode === 'bars' ? 'radial' : 'bars';
            });
        }
        startVizLoop();
        sfxGain = ctx.createGain();
        sfxGain.gain.value = prefs.sfxEnabled !== false ? (prefs.sfxVolume || 0.4) : 0;
        sfxGain.connect(masterGain);
        sfxGain.connect(sfxMerge);
        return true;
    } catch (e) { console.warn('Web Audio not available'); return false; }
}

function resumeCtx() {
    if (ctx && ctx.state === 'suspended') ctx.resume();
}

/* ═══════════════════════════════════════
   BACKGROUND MUSIC
   ═══════════════════════════════════════ */

function stopBgm() {
    bgmOscillators.forEach(function(n) {
        try { n.stop && n.stop(); } catch (_) {}
        try { n.disconnect(); } catch (_) {}
    });
    bgmOscillators = [];
    if (bgmAudioEl) { try { bgmAudioEl.pause(); } catch (_) {} }
    bgmPlaying = false;
    bgmPaused = false;
    if (bgmTimer) { clearInterval(bgmTimer); bgmTimer = null; }
    stopVizLoop();
    updatePlayerUI();
}

/* ─── مدلِ واحدِ ترک‌ها برای پلیر ───
   سنتزهای داخلی (TRACKS) + ورودی‌های دیتابیسِ ادمین. اگر روی یک ترک فایل
   آپلود شده باشد (fileUrl)، همان فایل پخش می‌شود؛ وگرنه سنتز. ترک‌های
   تازه‌ی ادمین (بدون سنتز) فقط اگر فایلشان موجود باشد در پلی‌لیست می‌آیند. */
function fileUrlFor(trackId) {
    var db = getAudioDb();
    var m = db.find(function (a) { return (a.trackId || ('custom-' + a.id)) === trackId; });
    return (m && m.fileUrl) || '';
}
function getPlayableTracks() {
    var db = getAudioDb();
    var byTrack = {};
    db.forEach(function (a) { if (a.trackId) byTrack[a.trackId] = a; });
    var list = [];
    TRACKS.forEach(function (t) {
        var meta = byTrack[t.id];
        if (db.length && meta && meta.active === false) return; // ادمین غیرفعال کرده
        list.push({
            id: t.id,
            name: (meta && meta.name) || t.name,
            icon: (meta && meta.icon) || t.icon,
            category: (meta && meta.type) || t.category,
            gen: t.gen, dur: t.dur,
            fileUrl: (meta && meta.fileUrl) || '',
            procedural: true
        });
    });
    db.forEach(function (a) {
        var isProcedural = a.trackId && TRACKS.some(function (t) { return t.id === a.trackId; });
        if (isProcedural) return;
        if (!a.active) return;
        var url = a.fileUrl || '';
        if (!url) return; // صدای تازه بدون فایل = پخش‌پذیر نیست
        list.push({
            id: a.trackId || ('custom-' + a.id),
            name: a.name || 'صدای تازه',
            icon: a.icon || '🎵',
            category: a.type || 'custom',
            gen: null, dur: 0,
            fileUrl: url,
            procedural: false
        });
    });
    return list;
}

/* فایل صوتی را روی همان bgmGain وصل می‌کنیم تا ولوم/میوت/ویژوالایزر کار کند */
function startFilePlayback(url) {
    if (!ensureCtx()) return false;
    if (!bgmAudioEl) {
        bgmAudioEl = new window.Audio();
        bgmAudioEl.preload = 'auto';
        bgmAudioEl.loop = true;
        bgmAudioEl.volume = 1; // ولوم از طریق bgmGain کنترل می‌شود
        try {
            bgmAudioNode = ctx.createMediaElementSource(bgmAudioEl);
            bgmAudioNode.connect(bgmGain);
        } catch (_) {
            // اگر createMediaElementSource نشد (مثلاً CORS) → پخش مستقیم بدون گین
            bgmAudioNode = null;
        }
    }
    bgmAudioEl.src = url;
    try { bgmAudioEl.load(); } catch (_) {}
    var p = bgmAudioEl.play();
    if (p && p.catch) p.catch(function () {});
    return true;
}

function playBgm(trackId) {
    if (!ensureCtx()) return;
    resumeCtx();
    stopBgm();

    var list = getPlayableTracks();
    var track = list.find(function (t) { return t.id === trackId; }) || list[0] || TRACKS[0];
    bgmPlaying = true;
    bgmPaused = false;
    bgmElapsed = 0;
    prefs.currentTrack = track.id;
    savePrefs(prefs);
    // اطمینان از اینکه گین روی ولوم فعلی است (بعد از pause/fade قبلی صفر نماند)
    try { bgmGain.gain.cancelScheduledValues(ctx.currentTime); bgmGain.gain.value = prefs.bgmVolume || 0.5; } catch (_) {}

    if (track.fileUrl) {
        // پخش فایل آپلودی (حلقه‌ای) — زمان از خودِ المنت خوانده می‌شود
        startFilePlayback(track.fileUrl);
        if (bgmTimer) clearInterval(bgmTimer);
        bgmTimer = setInterval(function () {
            if (!bgmAudioEl) return;
            bgmElapsed = Math.floor(bgmAudioEl.currentTime || 0);
            updatePlayerTime();
        }, 1000);
    } else {
        var nodes = (track.gen || genCosmicDrone)(ctx, bgmGain, ctx.currentTime);
        bgmOscillators = nodes;
        var dur = track.dur || 180;
        if (bgmTimer) clearInterval(bgmTimer);
        bgmTimer = setInterval(function () {
            if (bgmPaused) return;
            bgmElapsed++;
            if (bgmElapsed >= dur) {
                bgmGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 2);
                setTimeout(function () {
                    if (bgmPlaying && !bgmPaused) {
                        bgmGain.gain.value = prefs.bgmVolume || 0.5;
                        stopBgm();
                        playBgm(track.id);
                    }
                }, 2200);
            }
            updatePlayerTime();
        }, 1000);
    }
    updatePlayerUI();
}

function pauseBgm() {
    if (!bgmPlaying) return;
    bgmPaused = true;
    // Fade out
    if (ctx && bgmGain) {
        bgmGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
    }
    if (bgmAudioEl) { try { bgmAudioEl.pause(); } catch (_) {} }
    stopVizLoop();
    updatePlayerUI();
}

function resumeBgm() {
    if (!bgmPlaying || !bgmPaused) return;
    bgmPaused = false;
    if (ctx && bgmGain) {
        bgmGain.gain.linearRampToValueAtTime(prefs.bgmVolume || 0.5, ctx.currentTime + 0.5);
    }
    if (bgmAudioEl && bgmAudioEl.src) { try { bgmAudioEl.play().catch(function(){}); } catch (_) {} }
    startVizLoop();
    updatePlayerUI();
}

function setBgmVolume(v) {
    prefs.bgmVolume = Math.max(0, Math.min(1, v));
    savePrefs(prefs);
    if (bgmGain && !bgmPaused) {
        bgmGain.gain.linearRampToValueAtTime(prefs.bgmVolume, ctx.currentTime + 0.1);
    }
    var slider = document.getElementById('bgmVolumeSlider');
    if (slider) slider.value = prefs.bgmVolume;
}

function toggleBgm() {
    if (!bgmPlaying) {
        playBgm(prefs.currentTrack || TRACKS[0].id);
    } else if (bgmPaused) {
        resumeBgm();
    } else {
        pauseBgm();
    }
}

function nextTrack() {
    var list = getPlayableTracks();
    if (!list.length) return;
    var currentIdx = list.findIndex(function(t) { return t.id === prefs.currentTrack; });
    var nextIdx = (currentIdx + 1) % list.length;
    playBgm(list[nextIdx].id);
}

function prevTrack() {
    var list = getPlayableTracks();
    if (!list.length) return;
    var currentIdx = list.findIndex(function(t) { return t.id === prefs.currentTrack; });
    var prevIdx = (currentIdx - 1 + list.length) % list.length;
    playBgm(list[prevIdx].id);
}

/* ═══════════════════════════════════════
   SFX
   ═══════════════════════════════════════ */

function playSfx(type) {
    if (prefs.sfxEnabled === false) return;
    if (!ensureCtx()) return;
    resumeCtx();
    var def = SFX[type];
    if (!def) return;
    var now = ctx.currentTime;
    var freqs = Array.isArray(def.freq) ? def.freq : [def.freq];
    freqs.forEach(function(f, i) {
        var o = ctx.createOscillator(); o.type = def.type; o.frequency.value = f;
        var g = ctx.createGain();
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(def.vol, now + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, now + def.dur * (i + 1));
        o.connect(g); g.connect(sfxGain);
        o.start(now + i * 0.05); o.stop(now + def.dur * (freqs.length) + 0.1);
    });
}

/* ═══════════════════════════════════════
   BREATH GUIDE AUDIO
   ═══════════════════════════════════════ */

function playBreathCue(phase) {
    if (phase === 'inhale') playSfx('inhale');
    else if (phase === 'exhale') playSfx('exhale');
    else if (phase === 'hold') playSfx('chime');
}

/* ═══════════════════════════════════════
   MASTER CONTROLS
   ═══════════════════════════════════════ */

function toggleMute() {
    prefs.muted = !prefs.muted;
    savePrefs(prefs);
    if (masterGain) masterGain.gain.value = prefs.muted ? 0 : 1;
    updatePlayerUI();
}

function setSfxEnabled(enabled) {
    prefs.sfxEnabled = enabled;
    savePrefs(prefs);
    if (sfxGain) sfxGain.gain.value = enabled ? (prefs.sfxVolume || 0.4) : 0;
}

function setSfxVolume(v) {
    prefs.sfxVolume = Math.max(0, Math.min(1, v));
    savePrefs(prefs);
    if (sfxGain && prefs.sfxEnabled !== false) sfxGain.gain.value = prefs.sfxVolume;
}

/* ═══════════════════════════════════════
   UI: PLAYER WIDGET
   ═══════════════════════════════════════ */

/* ─── SVG icon set for the player (crisp, replaces emoji) ─── */
var APW_ICONS = {
    play: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 2.6c0-.9 1-1.5 1.8-1L14 6.9c.8.5.8 1.7 0 2.2L6.3 14.4c-.8.5-1.8-.1-1.8-1V2.6z"/></svg>',
    pause: '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="3" y="2.5" width="3.6" height="11" rx="1.2"/><rect x="9.4" y="2.5" width="3.6" height="11" rx="1.2"/></svg>',
    prev: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3a1 1 0 0 1 2 0v3.6l6.4-4.3c.9-.6 2 .1 2 1.2v9c0 1.1-1.1 1.8-2 1.2L5 9.4V13a1 1 0 0 1-2 0V3z"/></svg>',
    next: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M13 3a1 1 0 0 0-2 0v3.6L4.6 2.3c-.9-.6-2 .1-2 1.2v9c0 1.1 1.1 1.8 2 1.2L11 9.4V13a1 1 0 0 0 2 0V3z"/></svg>',
    vol: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8.3 2.2c.5-.4 1.2 0 1.2.6v10.4c0 .6-.7 1-1.2.6L4.9 11H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h1.9l3.4-2.8z"/><path d="M11.5 5.2a1 1 0 0 1 1.4.2A4.6 4.6 0 0 1 13.9 8c0 1-.3 1.9-.9 2.7a1 1 0 1 1-1.6-1.2c.3-.5.5-1 .5-1.5s-.2-1-.5-1.5a1 1 0 0 1 .1-1.3z"/></svg>',
    muted: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8.3 2.2c.5-.4 1.2 0 1.2.6v10.4c0 .6-.7 1-1.2.6L4.9 11H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h1.9l3.4-2.8z"/><path d="M11.3 6.1a.9.9 0 0 1 1.3 0l1 1 1-1a.9.9 0 1 1 1.3 1.3l-1 1 1 1a.9.9 0 1 1-1.3 1.3l-1-1-1 1a.9.9 0 1 1-1.3-1.3l1-1-1-1a.9.9 0 0 1 0-1.3z"/></svg>'
};

function createPlayerWidget() {
    // Inject compact player into topbar
    var slot = document.getElementById('topbarPlayerSlot');
    if (slot && slot.querySelector('#apwPlayPause')) return; // already injected

    // audio-player.css فقط در admin.html لود می‌شود؛ اینجا حداقلی را تزریق می‌کنیم
    if (!document.getElementById('apwInlineStyle')) {
        var st = document.createElement('style');
        st.id = 'apwInlineStyle';
        st.textContent =
            '#audioPlayerWidget{display:flex;align-items:center;gap:2px;position:relative;min-width:0}' +
            '.apw-playlist{position:absolute;top:calc(100% + 10px);left:0;margin:0}' +
            '@media(max-width:640px){#audioPlayerWidget .apw-info{max-width:90px}}';
        document.head.appendChild(st);
    }

    var container = slot || document.body;
    var w = document.createElement('div');
    w.id = 'audioPlayerWidget';
    w.className = slot ? '' : 'audio-player-widget';
    w.innerHTML =
        '<button class="apw-btn apw-play" id="apwPlayPause" title="پخش/مکث">' + APW_ICONS.play + '</button>' +
        '<div class="apw-info" id="apwInfo" title="فهرست پخش">' +
            '<div class="apw-track" id="apwTrackName">انتخاب موسیقی</div>' +
            '<span class="apw-eq" aria-hidden="true"><span></span><span></span><span></span></span>' +
        '</div>' +
        '<input type="range" class="apw-volume" id="bgmVolumeSlider" min="0" max="1" step="0.05" value="' + (prefs.bgmVolume || 0.5) + '" title="صدا">' +
        '<button class="apw-btn" id="apwMute" title="بی‌صدا">' + APW_ICONS.vol + '</button>' +
        '<div class="apw-playlist" id="apwPlaylist" style="display:none;">' +
            '<div class="apw-playlist-title">🎵 فهرست پخش</div>' +
            '<div class="apw-playlist-items" id="apwPlaylistItems"></div>' +
            '<div class="apw-sfx-section">' +
                '<label class="apw-sfx-label"><input type="checkbox" id="apwSfxCheck" ' + (prefs.sfxEnabled !== false ? 'checked' : '') + '> 🔔 رابط</label>' +
                '<input type="range" class="apw-volume" id="sfxVolumeSlider" min="0" max="1" step="0.05" value="' + (prefs.sfxVolume || 0.4) + '" title="صدای SFX">' +
            '</div>' +
        '</div>';
    container.appendChild(w);
    bindPlayerEvents();
    renderPlaylist();
    updatePlayerUI();
    syncVolumeFill(document.getElementById('bgmVolumeSlider'));
}

function bindPlayerEvents() {
    var toggle = document.getElementById('apwToggle');
    var playPause = document.getElementById('apwPlayPause');
    var prev = document.getElementById('apwPrev');
    var next = document.getElementById('apwNext');
    var vol = document.getElementById('bgmVolumeSlider');
    var mute = document.getElementById('apwMute');
    var sfxToggle = document.getElementById('apwSfxToggle');
    var sfxCheck = document.getElementById('apwSfxCheck');
    var sfxVol = document.getElementById('sfxVolumeSlider');
    var info = document.getElementById('apwInfo');

    if (toggle) toggle.addEventListener('click', function() {
        // Toggle playlist visibility
        var pl = document.getElementById('apwPlaylist');
        if (pl) pl.style.display = pl.style.display === 'none' ? '' : 'none';
    });

    if (playPause) playPause.addEventListener('click', function() {
        playSfx('click');
        toggleBgm();
    });
    if (prev) prev.addEventListener('click', function() { playSfx('click'); prevTrack(); });
    if (next) next.addEventListener('click', function() { playSfx('click'); nextTrack(); });
    if (vol) vol.addEventListener('input', function() { setBgmVolume(parseFloat(this.value)); syncVolumeFill(vol); });
    if (mute) mute.addEventListener('click', function() { playSfx('click'); toggleMute(); });
    if (sfxToggle) sfxToggle.addEventListener('click', function() { playSfx('click'); });
    if (sfxCheck) sfxCheck.addEventListener('change', function() { setSfxEnabled(this.checked); });
    if (sfxVol) sfxVol.addEventListener('input', function() { setSfxVolume(parseFloat(this.value)); syncVolumeFill(sfxVol); });

    // Click on track name to toggle playlist
    if (info) info.style.cursor = 'pointer';
    if (info) info.addEventListener('click', function() {
        var pl = document.getElementById('apwPlaylist');
        if (pl) pl.style.display = pl.style.display === 'none' ? '' : 'none';
    });
}

/* ─── Keep the --vol CSS var in sync so the volume track shows a gold fill ─── */
function syncVolumeFill(input) {
    if (!input) return;
    var min = parseFloat(input.min) || 0;
    var max = parseFloat(input.max) || 1;
    var val = parseFloat(input.value) || 0;
    input.style.setProperty('--vol', (((val - min) / (max - min)) * 100).toFixed(1) + '%');
}

function renderPlaylist() {
    var container = document.getElementById('apwPlaylistItems');
    if (!container) return;
    var html = '';
    getPlayableTracks().forEach(function(t) {
        var isActive = prefs.currentTrack === t.id;
        html += '<div class="apw-playlist-item' + (isActive ? ' active' : '') + '" data-track="' + t.id + '">';
        html += '<span class="apw-pl-icon">' + t.icon + '</span>';
        html += '<span class="apw-pl-name">' + t.name + '</span>';
        html += '<span class="apw-pl-cat">' + t.category + (t.fileUrl ? ' · فایل' : '') + '</span>';
        if (isActive && bgmPlaying && !bgmPaused) html += '<span class="apw-pl-playing">♪</span>';
        html += '</div>';
    });
    container.innerHTML = html;
    // Bind clicks
    container.querySelectorAll('.apw-playlist-item').forEach(function(item) {
        item.addEventListener('click', function() {
            playSfx('click');
            playBgm(this.dataset.track);
        });
    });
}

function updatePlayerUI() {
    var playPause = document.getElementById('apwPlayPause');
    var toggle = document.getElementById('apwToggle');
    var mute = document.getElementById('apwMute');
    var trackName = document.getElementById('apwTrackName');

    var isPlaying = bgmPlaying && !bgmPaused;

    if (playPause) playPause.innerHTML = isPlaying ? APW_ICONS.pause : APW_ICONS.play;
    if (toggle) toggle.textContent = prefs.muted ? '🔇' : (bgmPlaying ? '🔊' : '🎵');
    if (mute) {
        mute.innerHTML = prefs.muted ? APW_ICONS.muted : APW_ICONS.vol;
        mute.classList.toggle('is-active', prefs.muted);
    }

    // Playing state on the widget (drives the mini equalizer)
    var widget = document.getElementById('audioPlayerWidget');
    if (widget) widget.classList.toggle('apw-playing', isPlaying);

    var track = getPlayableTracks().find(function(t) { return t.id === prefs.currentTrack; });
    if (trackName) trackName.textContent = track ? track.icon + ' ' + track.name : 'انتخاب موسیقی';

    renderPlaylist();
}

function _fmtMMSS(sec) {
    sec = Math.max(0, Math.floor(sec || 0));
    var m = Math.floor(sec / 60), s = sec % 60;
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
}

function updatePlayerTime() {
    var timeEl = document.getElementById('apwTime');
    if (!timeEl) return;
    if (bgmAudioEl && bgmAudioEl.src) {
        // پخش فایل: زمان فعلی از خود المنت؛ طول ممکن است هنوز لود نشده باشد
        var total = (isFinite(bgmAudioEl.duration) && bgmAudioEl.duration > 0) ? _fmtMMSS(bgmAudioEl.duration) : '∞';
        timeEl.textContent = _fmtMMSS(bgmAudioEl.currentTime) + ' / ' + total;
        return;
    }
    var track = getPlayableTracks().find(function(t) { return t.id === prefs.currentTrack; }) || TRACKS.find(function(t) { return t.id === prefs.currentTrack; });
    if (!track) { timeEl.textContent = ''; return; }
    var dur = track.dur || 0;
    timeEl.textContent = _fmtMMSS(bgmElapsed) + ' / ' + (dur ? _fmtMMSS(dur) : '∞');
}

/* ═══════════════════════════════════════
   YOGA AUDIO INTEGRATION
   ═══════════════════════════════════════ */

function startYogaAmbient(trackId) {
    var track = TRACKS.find(function(t) { return t.id === trackId; }) || TRACKS[0];
    if (!ensureCtx()) return;
    resumeCtx();
    stopBgm();
    var nodes = track.gen(ctx, bgmGain, ctx.currentTime);
    bgmOscillators = nodes;
    bgmPlaying = true;
    bgmPaused = false;
    prefs.currentTrack = track.id;
    savePrefs(prefs);
}

function startYogaBreathGuide(preset) {
    var b = BREATH_PRESETS[preset];
    if (!b) return;
    // Play breath cues in a loop
    var totalCycle = b.inhale + b.hold1 + b.exhale + b.hold2;
    if (totalCycle <= 0) return;
    var elapsed = 0;
    function tick() {
        if (!bgmPlaying && !document.getElementById('ypPlayBtn')) return;
        if (elapsed < b.inhale) playBreathCue('inhale');
        else if (elapsed < b.inhale + b.hold1) playBreathCue('hold');
        else if (elapsed < b.inhale + b.hold1 + b.exhale) playBreathCue('exhale');
        elapsed = (elapsed + 1) % totalCycle;
    }
    tick();
    return setInterval(tick, 1000);
}

/* ═══════════════════════════════════════
   ADMIN: AUDIO MANAGEMENT (localStorage)
   ═══════════════════════════════════════ */

var AUDIO_DB_KEY = 'cosmic_admin_audio';
var BG_DB_KEY = 'cosmic_admin_bg_images';

function getAudioDb() {
    try { return JSON.parse(localStorage.getItem(AUDIO_DB_KEY) || '[]'); } catch (_) { return []; }
}
function saveAudioDb(arr) {
    localStorage.setItem(AUDIO_DB_KEY, JSON.stringify(arr));
    // منبع حقیقت = سرور؛ localStorage فقط آینه‌ی آفلاین است.
    var token = localStorage.getItem('cosmic_token');
    if (token) {
        fetch('/api/v5/settings/audio', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify({ items: arr })
        }).catch(function () {});
    }
}

function getBgDb() {
    try { return JSON.parse(localStorage.getItem(BG_DB_KEY) || '[]'); } catch (_) { return []; }
}
function saveBgDb(arr) {
    localStorage.setItem(BG_DB_KEY, JSON.stringify(arr));
    var token = localStorage.getItem('cosmic_token');
    if (token) {
        fetch('/api/v5/settings/backgrounds', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify({ items: arr })
        }).catch(function () {});
    }
}

/* hydrate: داده‌ی سرور → localStorage → رندر مجدد */
function hydrateSettingsFromServer(ns, localKey, rerender) {
    fetch('/api/v5/settings/' + ns).then(function (r) { return r.ok ? r.json() : null; }).then(function (data) {
        if (!data) return;
        var items = data.items || [];
        if (items.length) {
            localStorage.setItem(localKey, JSON.stringify(items));
            if (rerender) rerender();
        } else {
            try {
                var local = JSON.parse(localStorage.getItem(localKey) || 'null');
                if (local && local.length) {
                    var token = localStorage.getItem('cosmic_token');
                    if (token) {
                        fetch('/api/v5/settings/' + ns, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                            body: JSON.stringify({ items: local })
                        }).catch(function () {});
                    }
                }
            } catch (_) {}
        }
    }).catch(function () {});
}

// Seed defaults
function seedAudioDefaults() {
    var db = getAudioDb();
    if (db.length === 0) {
        db = TRACKS.map(function(t, i) {
            return { id: i + 1, name: t.name, type: t.category, icon: t.icon, trackId: t.id, active: true, assignedTo: 'all', tags: t.category };
        });
        saveAudioDb(db);
    }
    var bgDb = getBgDb();
    if (bgDb.length === 0) {
        bgDb = [
            { id: 1, name: 'جنگل', icon: '🌲', category: 'forest', gradient: 'linear-gradient(135deg,#0a1a0a,#1a3a1a)', active: true },
            { id: 2, name: 'ساحل', icon: '🌊', category: 'beach', gradient: 'linear-gradient(135deg,#0a1628,#1a3050)', active: true },
            { id: 3, name: 'کوه', icon: '🏔️', category: 'mountain', gradient: 'linear-gradient(135deg,#0d0a1a,#2a1860)', active: true },
            { id: 4, name: 'شب', icon: '🌙', category: 'night', gradient: 'linear-gradient(135deg,#05050f,#10103a)', active: true },
            { id: 5, name: 'طلوع', icon: '🌅', category: 'sunrise', gradient: 'linear-gradient(135deg,#1a0a00,#3a2010)', active: true },
            { id: 6, name: 'فضا', icon: '🌌', category: 'space', gradient: 'linear-gradient(135deg,#02020a,#0a0a20)', active: true }
        ];
        saveBgDb(bgDb);
    }
}

/* (بازنشسته) CRUD قدیمیِ صدا/تصویر → AudioAdmin + BackgroundAdmin
   توجه: helperهای خط ۷۴۴–۸۲۹ (getAudioDb/seed/hydrate) هنوز توسط
   init() و پلیر سنتزی یوگا استفاده می‌شوند — حذف نشوند. */


function refreshAudioFilesFromServer(cb) {
    var token = _adminToken();
    if (!token) { if (cb) cb(); return; }
    fetch('/api/v5/audio/files', { headers: { 'Authorization': 'Bearer ' + token } })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (d) {
            if (d && d.files) {
                try { localStorage.setItem(AUDIO_FILES_KEY, JSON.stringify(d.files)); } catch (_) {}
                // همگام‌سازی fileUrl در دیتابیس ادمین
                var db = getAudioDb();
                var dirty = false;
                db.forEach(function (a) {
                    var k = _fileKeyOf(a);
                    if (k && d.files[k] && a.fileUrl !== d.files[k]) { a.fileUrl = d.files[k]; dirty = true; }
                });
                if (dirty) {
                    try { localStorage.setItem(AUDIO_DB_KEY, JSON.stringify(db)); } catch (_) {}
                }
            }
            if (cb) cb();
        }).catch(function () { if (cb) cb(); });
}

function uploadAudioFile(trackKey, file, done) {
    var reader = new FileReader();
    reader.onload = function () {
        var dataUrl = String(reader.result || '');
        var comma = dataUrl.indexOf(',');
        var b64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
        var ext = (file.name.split('.').pop() || 'mp3').toLowerCase();
        var token = _adminToken();
        fetch('/api/v5/audio/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify({ track_id: trackKey, ext: ext, data: b64 })
        }).then(function (r) {
            return r.json().then(function (d) { return { ok: r.ok, d: d }; });
        }).then(function (res) {
            if (!res.ok) {
                if (window.showToast) showToast('❌ ' + (res.d.detail || 'خطا در آپلود'), 'error');
                done && done(false, res.d); return;
            }
            done && done(true, res.d);
        }).catch(function (e) {
            if (window.showToast) showToast('❌ خطای شبکه: ' + e.message, 'error');
            done && done(false, { error: String(e) });
        });
    };
    reader.onerror = function () { if (window.showToast) showToast('❌ خطا در خواندن فایل', 'error'); done && done(false); };
    reader.readAsDataURL(file);
}

function removeAudioFile(trackKey, done) {
    var token = _adminToken();
    fetch('/api/v5/audio/file/' + encodeURIComponent(trackKey), {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + token }
    }).then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (res) { done && done(res.ok, res.d); })
      .catch(function () { done && done(false); });
}

/* ─── مودال آپلود فایل صدا ─── */
function openAudioFileModal(id, onSaved) {
    var db = getAudioDb();
    var item = db.find(function (a) { return a.id === id; });
    if (!item) return;
    var trackKey = _fileKeyOf(item);
    var hasFile = !!item.fileUrl;

    var overlay = document.createElement('div');
    overlay.className = 'admin-modal-overlay';
    overlay.innerHTML =
        '<div class="admin-modal">' +
        '<div class="admin-modal-header"><h3>🎵 فایل صدا: ' + _esc(item.name) + '</h3><button class="admin-modal-close" id="audioFileClose">✕</button></div>' +
        '<div class="admin-modal-body">' +
        '<div style="background:rgba(18,22,46,0.85);border:1px dashed var(--line-strong);border-radius:12px;padding:22px;text-align:center;cursor:pointer;" id="audioDropZone">' +
            '<div style="font-size:34px;margin-bottom:6px;">' + (hasFile ? '🎧' : '📤') + '</div>' +
            '<div style="color:var(--gold-200);font-weight:600;margin-bottom:6px;">' + (hasFile ? 'فایل فعلی را عوض کن' : 'فایل صوتی را اینجا رها کن') + '</div>' +
            '<div style="color:var(--ink-dim);font-size:11px;">mp3 / ogg / wav / m4a — حداکثر ۲۰ مگابایت</div>' +
            '<input type="file" id="audioFileInput" accept="' + _audioAccept() + '" style="display:none;">' +
            '<button class="admin-btn admin-btn-primary" id="audioPickBtn" style="margin-top:10px;">انتخاب فایل</button>' +
        '</div>' +
        (hasFile
            ? '<div style="margin-top:14px;padding:10px 12px;background:rgba(46,204,113,0.08);border:1px solid rgba(46,204,113,0.25);border-radius:10px;font-size:12px;color:#55efc4;">✅ فایل فعال: <code dir="ltr">' + _esc(item.fileUrl) + '</code>' +
              '<div style="margin-top:6px;"><button class="admin-btn admin-btn-danger" id="audioRemoveBtn" style="font-size:11px;padding:4px 10px;">🗑 حذف فایل (بازگشت به سنتز)</button></div></div>'
            : '<div style="margin-top:14px;color:var(--ink-dim);font-size:12px;">فایلی وجود ندارد' + (item.trackId && TRACKS.some(function(t){return t.id===item.trackId;}) ? ' — صدای سنتزی پخش می‌شود.' : ' — این ترک تا آپلود فایل، در پلی‌لیست ظاهر نمی‌شود.</div>') +
        '<div id="audioFileStatus" style="margin-top:10px;color:var(--gold-200);font-size:12px;min-height:20px;"></div>' +
        '</div>' +
        '<div class="admin-modal-footer">' +
        '<button class="admin-btn" id="audioFileCancel">بستن</button>' +
        '</div></div>';
    document.body.appendChild(overlay);
    setTimeout(function () { overlay.classList.add('visible'); }, 10);

    function closeModal() { overlay.classList.remove('visible'); setTimeout(function () { overlay.remove(); }, 300); }
    document.getElementById('audioFileClose').addEventListener('click', closeModal);
    document.getElementById('audioFileCancel').addEventListener('click', closeModal);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeModal(); });

    var input = document.getElementById('audioFileInput');
    document.getElementById('audioPickBtn').addEventListener('click', function () { input.click(); });
    var dz = document.getElementById('audioDropZone');
    ['dragenter','dragover'].forEach(function (ev) { dz.addEventListener(ev, function (e) { e.preventDefault(); dz.style.borderColor = '#f39c12'; }); });
    ['dragleave','drop'].forEach(function (ev) { dz.addEventListener(ev, function (e) { e.preventDefault(); dz.style.borderColor = 'var(--line-strong)'; }); });
    dz.addEventListener('drop', function (e) {
        var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
        if (f) handle(f);
    });
    input.addEventListener('change', function () {
        var f = this.files && this.files[0];
        if (f) handle(f);
    });
    var rmBtn = document.getElementById('audioRemoveBtn');
    if (rmBtn) rmBtn.addEventListener('click', function () {
        if (!confirm('فایل حذف شود و به سنتز قبلی برگردیم؟')) return;
        var status = document.getElementById('audioFileStatus');
        status.textContent = '⏳ در حال حذف...';
        removeAudioFile(trackKey, function (ok) {
            var db2 = getAudioDb();
            var it2 = db2.find(function (a) { return a.id === id; });
            if (it2) delete it2.fileUrl;
            saveAudioDb(db2);
            if (ok) { if (window.showToast) showToast('فایل حذف شد ✅', 'success'); closeModal(); onSaved && onSaved(); }
            else { status.textContent = '❌ خطا در حذف فایل'; }
        });
    });

    function handle(f) {
        if (!f.type || (f.type.indexOf('audio/') !== 0 && !/\.(mp3|ogg|wav|m4a)$/i.test(f.name))) {
            if (window.showToast) showToast('فرمت مجاز نیست — فقط mp3/ogg/wav/m4a', 'error'); return;
        }
        if (f.size > 20 * 1024 * 1024) {
            if (window.showToast) showToast('حجم فایل بیش از ۲۰ مگابایت است ❌', 'error'); return;
        }
        var status = document.getElementById('audioFileStatus');
        status.textContent = '⏳ در حال آپلود ' + _esc(f.name) + ' (' + Math.round(f.size / 1024) + 'KB)...';
        uploadAudioFile(trackKey, f, function (ok, resp) {
            if (!ok) { status.textContent = '❌ ' + ((resp && resp.detail) || 'خطا در آپلود'); return; }
            var db2 = getAudioDb();
            var it2 = db2.find(function (a) { return a.id === id; });
            if (it2) {
                // برای صداهای تازه‌ی بدون trackId، مقدارِ trackId را هم پایداری می‌کنیم
                if (!it2.trackId) it2.trackId = trackKey;
                it2.fileUrl = resp.url;
            }
            saveAudioDb(db2);
            status.textContent = '✅ آپلود شد. در حال به‌روزرسانی...';
            // به‌روزرسانی cache فایل‌ها
            try {
                var map = JSON.parse(localStorage.getItem(AUDIO_FILES_KEY) || '{}');
                map[trackKey] = resp.url;
                localStorage.setItem(AUDIO_FILES_KEY, JSON.stringify(map));
            } catch (_) {}
            setTimeout(function () { closeModal(); onSaved && onSaved(); }, 300);
        });
    }
}

function renderAdminAudio() {
    seedAudioDefaults();
    var audioDb = getAudioDb();
    var bgDb = getBgDb();
    var html = '';

    // Stats
    html += '<div class="admin-stats" style="margin-bottom:20px;">';
    html += '<div class="admin-stat-card"><div class="admin-stat-icon">🎵</div><div class="admin-stat-value">' + audioDb.length + '</div><div class="admin-stat-label">صدای ثبت‌شده</div></div>';
    html += '<div class="admin-stat-card"><div class="admin-stat-icon">🎧</div><div class="admin-stat-value">' + audioDb.filter(function (a) { return a.fileUrl; }).length + '</div><div class="admin-stat-label">دارای فایل</div></div>';
    html += '<div class="admin-stat-card"><div class="admin-stat-icon">✅</div><div class="admin-stat-value">' + audioDb.filter(function (a) { return a.active; }).length + '</div><div class="admin-stat-label">فعال</div></div>';
    html += '</div>';

    html += '<div style="margin-bottom:10px;color:var(--ink-dim);font-size:12px;">💡 صداهای سنتزی داخلی به‌صورت پیش‌فرض فایل ندارند — با دکمه‌ی «فایل» روی هر ردیف، می‌توانید mp3/ogg/wav/m4a آپلود کنید تا به‌جای سنتز، همان فایل پخش شود.</div>';

    // Audio tracks table
    html += '<h3 style="color:var(--gold-200);margin-bottom:12px;">🎵 فایل‌های صوتی</h3>';
    html += '<div class="admin-table-wrap"><table class="admin-table"><thead><tr>';
    html += '<th>آیکون</th><th>نام</th><th>دسته</th><th>تخصیص</th><th>وضعیت</th><th>منبع صدا</th><th>عملیات</th>';
    html += '</tr></thead><tbody>';
    audioDb.forEach(function (a) {
        var src = a.fileUrl
            ? '<span style="color:#55efc4;font-size:11px;">🎧 فایل آپلودی</span>'
            : (a.trackId && TRACKS.some(function (t) { return t.id === a.trackId; })
                ? '<span style="color:#a29bfe;font-size:11px;">⚡ سنتز داخلی</span>'
                : '<span style="color:#ff7675;font-size:11px;">— بدون فایل (غیرفعال در پلی‌لیست)</span>');
        html += '<tr>';
        html += '<td style="font-size:20px">' + a.icon + '</td>';
        html += '<td>' + _esc(a.name) + '</td>';
        html += '<td><span style="background:rgba(162,155,254,0.15);color:#a29bfe;padding:2px 8px;border-radius:6px;font-size:11px;">' + _esc(a.type) + '</span></td>';
        html += '<td>' + _esc(a.assignedTo || 'all') + '</td>';
        html += '<td>' + (a.active ? '<span style="color:#55efc4">✅ فعال</span>' : '<span style="color:#ff7675">❌ غیرفعال</span>') + '</td>';
        html += '<td>' + src + '</td>';
        html += '<td style="white-space:nowrap;">';
        html += '<button class="admin-icon-btn" onclick="AudioManager.adminToggle(' + a.id + ')" title="فعال/غیرفعال">' + (a.active ? '🔒' : '🔓') + '</button>';
        html += '<button class="admin-icon-btn" onclick="AudioManager.adminPreview(' + a.id + ')" title="پیش‌نمایش">▶️</button>';
        html += '<button class="admin-icon-btn" onclick="AudioManager.adminUploadFile(' + a.id + ')" title="آپلود/جایگزینی فایل صدا">🎧</button>';
        html += '<button class="admin-icon-btn" onclick="AudioManager.adminEdit(' + a.id + ')" title="ویرایش">✏️</button>';
        html += '<button class="admin-icon-btn admin-icon-btn-danger" onclick="AudioManager.adminDelete(' + a.id + ')" title="حذف">🗑️</button>';
        html += '</td></tr>';
    });
    html += '</tbody></table></div>';

    // Add new audio
    html += '<div style="margin-top:16px;padding:16px;background:rgba(18,22,46,0.85);border:1px solid var(--line-strong);border-radius:12px;">';
    html += '<h4 style="color:var(--gold-200);margin-bottom:12px;">➕ افزودن صدای تازه</h4>';
    html += '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:end;">';
    html += '<div><label style="color:var(--ink-dim);font-size:11px;">نام</label><input type="text" class="admin-input" id="adminAudioName" placeholder="نام صدا" style="width:150px;"></div>';
    html += '<div><label style="color:var(--ink-dim);font-size:11px;">آیکون</label><input type="text" class="admin-input" id="adminAudioIcon" placeholder="🎵" maxlength="4" style="width:60px;"></div>';
    html += '<div><label style="color:var(--ink-dim);font-size:11px;">دسته</label><select class="admin-input" id="adminAudioType"><option value="ambient">ambient</option><option value="nature">nature</option><option value="space">space</option><option value="meditation">meditation</option></select></div>';
    html += '<div><label style="color:var(--ink-dim);font-size:11px;">تخصیص</label><select class="admin-input" id="adminAudioAssign"><option value="all">همه</option><option value="yoga">یوگا</option><option value="meditation">مدیتیشن</option><option value="breathing">تنفس</option></select></div>';
    html += '<label style="color:var(--ink-dim);font-size:11px;display:flex;align-items:center;gap:6px;"><input type="checkbox" id="adminAudioBasedOnSynth" style="width:auto;"> بر پایه‌ی سنتز «دران کیهانی»</label>';
    html += '<button class="admin-btn admin-btn-primary" onclick="AudioManager.adminAdd()">➕ افزودن</button>';
    html += '</div>';
    html += '<div style="margin-top:8px;color:var(--ink-dim);font-size:11px;">💡 اگر تیک سنتز را نزنی، بعد از افزودن، با دکمه‌ی 🎧 روی همان ردیف فایل آپلود کن تا در پلی‌لیست ظاهر شود.</div>';
    html += '</div>';

    // Background images
    html += '<h3 style="color:var(--gold-200);margin:24px 0 12px;">🖼️ تصاویر پس‌زمینه</h3>';
    html += '<div style="margin-bottom:12px;"><button class="admin-btn admin-btn-primary" onclick="AudioManager.adminEditBg(null)">➕ افزودن تصویر جدید</button></div>';
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;">';
    bgDb.forEach(function(bg) {
        html += '<div style="background:rgba(18,22,46,0.85);border:1px solid var(--line-strong);border-radius:12px;padding:12px;text-align:center;position:relative;">';
        html += '<button class="admin-icon-btn" onclick="AudioManager.adminEditBg(' + bg.id + ')" title="ویرایش / جایگزینی تصویر" style="position:absolute;top:6px;left:6px;">✏️</button>';
        html += '<button class="admin-icon-btn" onclick="AudioManager.adminDeleteBg(' + bg.id + ')" title="حذف" style="position:absolute;top:6px;right:6px;">🗑️</button>';
        if (bg.imageUrl) {
            html += '<img src="' + _esc(bg.imageUrl) + '" alt="' + _esc(bg.name) + '" style="width:100%;height:80px;object-fit:cover;border-radius:8px;margin-bottom:8px;">';
        } else {
            html += '<div style="width:100%;height:80px;border-radius:8px;background:' + bg.gradient + ';margin-bottom:8px;display:flex;align-items:center;justify-content:center;font-size:32px;">' + bg.icon + '</div>';
        }
        html += '<div style="color:var(--gold-200);font-size:13px;font-weight:600;">' + _esc(bg.name) + '</div>';
        html += '<div style="color:var(--ink-dim);font-size:11px;">' + (bg.active ? '✅' : '❌') + ' ' + _esc(bg.category) + '</div>';
        html += '</div>';
    });
    html += '</div>';

    return html;
}

/* ─── Admin CRUD ─── */
function adminToggle(id) {
    var db = getAudioDb();
    var item = db.find(function(a) { return a.id === id; });
    if (item) { item.active = !item.active; saveAudioDb(db); playSfx('click'); render(); }
}
function adminPreview(id) {
    var db = getAudioDb();
    var item = db.find(function(a) { return a.id === id; });
    if (!item) return;
    var key = _fileKeyOf(item) || 'cosmic-drone';
    playBgm(key);
}
function adminUploadFile(id) {
    openAudioFileModal(id, function () { refreshAudioFilesFromServer(function () { render(); }); });
}
function adminEdit(id) {
    var db = getAudioDb();
    var item = db.find(function(a) { return a.id === id; });
    if (!item) return;
    var newName = prompt('نام جدید:', item.name);
    if (!newName || !newName.trim()) return;
    item.name = newName.trim();
    var newIcon = prompt('آیکون (اموجی):', item.icon || '🎵');
    if (newIcon) item.icon = newIcon.trim();
    var newAssign = prompt('تخصیص (all/yoga/meditation/breathing):', item.assignedTo || 'all');
    if (newAssign) item.assignedTo = newAssign.trim();
    saveAudioDb(db);
    playSfx('success');
    render();
}
function adminDelete(id) {
    var db = getAudioDb();
    var item = db.find(function (a) { return a.id === id; });
    if (!item) return;
    var key = _fileKeyOf(item);
    if (!confirm('این صدا حذف شود؟' + (item.fileUrl ? '\n(فایل آپلودی روی سرور هم پاک خواهد شد)' : ''))) return;
    function apply() {
        var db2 = getAudioDb().filter(function (a) { return a.id !== id; });
        saveAudioDb(db2);
        playSfx('success');
        render();
    }
    if (item.fileUrl && key) {
        removeAudioFile(key, function () { apply(); });
    } else {
        apply();
    }
}
function adminAdd() {
    var name = document.getElementById('adminAudioName');
    var type = document.getElementById('adminAudioType');
    var assign = document.getElementById('adminAudioAssign');
    var icon = document.getElementById('adminAudioIcon');
    var based = document.getElementById('adminAudioBasedOnSynth');
    if (!name || !name.value.trim()) { playSfx('error'); return; }
    var db = getAudioDb();
    var newId = db.length > 0 ? Math.max.apply(null, db.map(function(a) { return a.id; })) + 1 : 1;
    var entry = {
        id: newId,
        name: name.value.trim(),
        type: type.value,
        icon: (icon && icon.value.trim()) || '🎵',
        active: true,
        assignedTo: assign.value,
        tags: type.value
    };
    if (based && based.checked) entry.trackId = 'cosmic-drone';
    db.push(entry);
    saveAudioDb(db);
    name.value = '';
    if (icon) icon.value = '';
    playSfx('success');
    render();
    if (!(based && based.checked) && window.showToast) {
        showToast('صدای تازه ساخته شد — حالا روی همان ردیف 🎧 بزن و فایل صوتی‌اش را آپلود کن.', 'info');
    }
}
function adminDeleteBg(id) {
    if (!confirm('آیا از حذف این تصویر مطمئن هستید؟')) return;
    var db = getBgDb().filter(function(b) { return b.id !== id; });
    saveBgDb(db);
    playSfx('success');
    render();
}

/* ─── Admin: ویرایش/جایگزینی تصویر پس‌زمینه ───
   به‌جای فقط حذف، ادمین می‌تواند نام/دسته/آیکون را عوض کند و خودِ تصویر را
   با یک URL جدید یا فایل محلی جایگزین کند. فایل محلی به data-URL تبدیل می‌شود
   (با سقف حجم، چون در localStorage ذخیره می‌شود). */
var BG_DATA_URL_MAX = 500 * 1024; // سقف ۵۰۰KB برای data-URL در localStorage

/* فایل تصویر → data-URL با کوچک‌سازی خودکار (حداکثر 1280px، JPEG q0.82) */
function processImageFile(file, cb) {
    if (file.size > BG_DATA_URL_MAX * 8) {
        if (window.showToast) showToast('فایل خیلی بزرگ است ❌', 'error');
        return;
    }
    var reader = new FileReader();
    reader.onload = function () {
        var img = new Image();
        img.onload = function () {
            var MAX = 1280;
            var scale = Math.min(1, MAX / Math.max(img.width, img.height));
            // PNG کوچک دست‌نخورده بماند (شفافیت حفظ شود)
            if (scale === 1 && file.type === 'image/png' && file.size <= BG_DATA_URL_MAX) {
                cb(reader.result);
                return;
            }
            var canvas = document.createElement('canvas');
            canvas.width = Math.round(img.width * scale);
            canvas.height = Math.round(img.height * scale);
            canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
            cb(canvas.toDataURL('image/jpeg', 0.82));
        };
        img.onerror = function () { if (window.showToast) showToast('فایل تصویر معتبر نیست ❌', 'error'); };
        img.src = reader.result;
    };
    reader.readAsDataURL(file);
}

function adminEditBg(id) {
    seedAudioDefaults(); // اگر تب صدا هنوز رندر نشده، پیش‌فرض‌ها ساخته شوند
    var db = getBgDb();
    var item = (id == null) ? null : db.find(function(b) { return b.id === id; });
    var isNew = !item;
    var p = item || { name: '', icon: '🖼️', category: 'custom', gradient: 'linear-gradient(135deg,#121636,#2a1a50)', imageUrl: '', active: true };

    var overlay = document.createElement('div');
    overlay.className = 'admin-modal-overlay';
    overlay.innerHTML =
        '<div class="admin-modal">' +
        '<div class="admin-modal-header"><h3>' + (isNew ? '➕ تصویر پس‌زمینه جدید' : '✏️ ویرایش تصویر: ' + _esc(p.name)) + '</h3><button class="admin-modal-close" id="bgModalClose">✕</button></div>' +
        '<div class="admin-modal-body">' +
        '<div class="admin-form-row"><label>نام</label><input type="text" class="admin-input" id="bgName" value="' + _esc(p.name) + '"></div>' +
        '<div class="admin-form-row"><label>دسته‌بندی</label><input type="text" class="admin-input" id="bgCategory" value="' + _esc(p.category) + '"></div>' +
        '<div class="admin-form-row"><label>آیکون (اموجی)</label><input type="text" class="admin-input" id="bgIcon" value="' + _esc(p.icon) + '" maxlength="4"></div>' +
        '<div class="admin-form-row"><label>تصویر (URL یا فایل)</label><input type="text" class="admin-input" id="bgImageUrl" dir="ltr" placeholder="https://... یا خالی = گرادیان" value="' + _esc(p.imageUrl || '') + '"><input type="file" id="bgImageFile" accept="image/*" style="margin-top:8px;color:var(--ink-dim);font-size:12px;"></div>' +
        '<div class="admin-form-row"><label>گرادیان (وقتی تصویری انتخاب نشده)</label><input type="text" class="admin-input" id="bgGradient" dir="ltr" value="' + _esc(p.gradient) + '"></div>' +
        '<div class="admin-form-row"><label>تخصیص به پلن‌ها (خالی = همه)</label><select id="bgPlans" multiple size="4" class="admin-input" style="width:100%;"></select></div>' +
        '<div style="text-align:center;margin-top:8px;"><div id="bgPreview" style="width:100%;height:90px;border-radius:8px;border:1px dashed var(--line-strong);background:' + (p.imageUrl ? 'url(' + _esc(p.imageUrl) + ') center/cover' : p.gradient) + ';display:flex;align-items:center;justify-content:center;font-size:32px;cursor:pointer;">' + (p.imageUrl ? '' : _esc(p.icon)) + '</div><div style="font-size:10px;color:var(--ink-dim);margin-top:4px;">فایل را روی پیش‌نمایش بکشید و رها کنید یا از دکمه‌ی انتخاب فایل استفاده کنید</div></div>' +
        '</div>' +
        '<div class="admin-modal-footer">' +
        '<button class="admin-btn" id="bgModalCancel">انصراف</button>' +
        '<button class="admin-btn admin-btn-primary" id="bgModalSave">💾 ذخیره</button>' +
        '</div>' +
        '</div>';

    document.body.appendChild(overlay);
    setTimeout(function () { overlay.classList.add('visible'); }, 10);

    /* فهرست پلن‌ها برای تخصیص (از سرور/آینه‌ی محلی) */
    (function fillPlanSelect() {
        var sel = document.getElementById('bgPlans');
        if (!sel) return;
        var assigned = p.assignedPlans || [];
        var plans = null;
        try { plans = JSON.parse(localStorage.getItem('cosmic_admin_plans') || 'null'); } catch (_) {}
        if (!plans || !plans.length) {
            fetch('/api/v5/settings/plans').then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
                if (!d || !d.items || !d.items.length || !document.getElementById('bgPlans')) return;
                document.getElementById('bgPlans').innerHTML = d.items.map(function (pl) {
                    return '<option value="' + _esc(pl.name) + '"' + (assigned.indexOf(pl.name) >= 0 ? ' selected' : '') + '>' + _esc(pl.label) + '</option>';
                }).join('');
            }).catch(function () {});
            return;
        }
        sel.innerHTML = plans.map(function (pl) {
            return '<option value="' + _esc(pl.name) + '"' + (assigned.indexOf(pl.name) >= 0 ? ' selected' : '') + '>' + _esc(pl.label) + '</option>';
        }).join('');
    })();

    function refreshPreview(url, gradient, icon) {
        var prev = document.getElementById('bgPreview');
        if (!prev) return;
        prev.style.background = url ? ('url(' + url + ') center/cover') : gradient;
        prev.textContent = url ? '' : icon;
    }

    var urlInput = document.getElementById('bgImageUrl');
    urlInput.addEventListener('input', function () {
        if (this.value.trim()) document.getElementById('bgImageFile').value = '';
        refreshPreview(this.value.trim(), document.getElementById('bgGradient').value, document.getElementById('bgIcon').value);
    });
    document.getElementById('bgImageFile').addEventListener('change', function () {
        var f = this.files && this.files[0];
        if (!f) return;
        processImageFile(f, function (dataUrl) {
            urlInput.value = '';
            urlInput.dataset.dataUrl = dataUrl;
            refreshPreview(dataUrl, '', '');
        });
    });

    /* درگ‌اند‌دراپ روی پیش‌نمایش */
    var preview = document.getElementById('bgPreview');
    ['dragenter', 'dragover'].forEach(function (ev) {
        preview.addEventListener(ev, function (e) { e.preventDefault(); preview.style.borderColor = '#f39c12'; });
    });
    ['dragleave', 'drop'].forEach(function (ev) {
        preview.addEventListener(ev, function (e) { e.preventDefault(); preview.style.borderColor = 'var(--line-strong)'; });
    });
    preview.addEventListener('drop', function (e) {
        var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
        if (!f || f.type.indexOf('image/') !== 0) return;
        document.getElementById('bgImageFile').value = '';
        processImageFile(f, function (dataUrl) {
            urlInput.value = '';
            urlInput.dataset.dataUrl = dataUrl;
            refreshPreview(dataUrl, '', '');
        });
    });
    document.getElementById('bgGradient').addEventListener('input', function () {
        if (!urlInput.value.trim() && !urlInput.dataset.dataUrl) refreshPreview('', this.value, document.getElementById('bgIcon').value);
    });

    function closeModal() { overlay.classList.remove('visible'); setTimeout(function () { overlay.remove(); }, 300); }
    document.getElementById('bgModalClose').addEventListener('click', closeModal);
    document.getElementById('bgModalCancel').addEventListener('click', closeModal);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeModal(); });

    document.getElementById('bgModalSave').addEventListener('click', function () {
        var name = document.getElementById('bgName').value.trim();
        if (!name) { if (window.showToast) showToast('نام الزامی است ❌', 'error'); return; }
        var assignedPlans = [...document.getElementById('bgPlans').selectedOptions].map(function (o) { return o.value; });
        var finalUrl = urlInput.dataset.dataUrl || urlInput.value.trim();
        var updated = {
            name: name,
            category: document.getElementById('bgCategory').value.trim() || 'custom',
            icon: document.getElementById('bgIcon').value.trim() || '🖼️',
            gradient: document.getElementById('bgGradient').value.trim() || p.gradient,
            imageUrl: finalUrl,
            assignedPlans: assignedPlans,
            active: item ? item.active : true
        };
        if (isNew) {
            var newId = db.length > 0 ? Math.max.apply(null, db.map(function (b) { return b.id; })) + 1 : 1;
            updated.id = newId;
            db.push(updated);
        } else {
            updated.id = item.id;
            var idx = db.indexOf(item);
            db[idx] = updated;
        }
        saveBgDb(db);
        if (window.showToast) showToast(isNew ? 'تصویر اضافه شد ✅' : 'تصویر جایگزین شد ✅', 'success');
        playSfx('success');
        closeModal();
        render();
        applyAdminBackgrounds(db.slice()); // بازخورد فوری روی خود صفحه‌ی ادمین
    });
}

function render() {
    var container = document.getElementById('adminTabAudioContent');
    if (container) container.innerHTML = renderAdminAudio();
}

/* ═══════════════════════════════════════
   TOPBAR VISUALIZER (AnalyserNode)
   ═══════════════════════════════════════ */

function startVizLoop() {
    if (!analyser || !vizCanvas || !vizCtx2d) return;
    vizTargetOpacity = 0.85;
    if (vizCanvas) vizCanvas.classList.add('active');
    var bufLen = analyser.frequencyBinCount;
    var dataArr = new Uint8Array(bufLen);
    var W = vizCanvas.width;
    var H = vizCanvas.height;
    var barCount = 16;
    var barW = Math.floor(W / barCount) - 1;
    var cx = W / 2, cy = H / 2;
    var peakGlow = false;

    function draw() {
        vizAnimId = requestAnimationFrame(draw);
        analyser.getByteFrequencyData(dataArr);

        // Smooth fade
        vizFadeOpacity += (vizTargetOpacity - vizFadeOpacity) * 0.08;
        if (vizFadeOpacity < 0.01) { vizCtx2d.clearRect(0, 0, W, H); return; }

        vizCtx2d.clearRect(0, 0, W, H);
        vizCtx2d.globalAlpha = vizFadeOpacity;

        var step = Math.floor(bufLen / barCount);
        var maxVal = 0;
        var vals = [];
        for (var i = 0; i < barCount; i++) {
            var val = 0;
            for (var j = 0; j < step; j++) val += dataArr[i * step + j];
            val = val / step / 255;
            vals.push(val);
            if (val > maxVal) maxVal = val;
        }

        // Glow class toggle
        peakGlow = maxVal > 0.8;
        if (vizCanvas) vizCanvas.classList.toggle('glowing', peakGlow);

        if (vizMode === 'radial') {
            // Radial mode
            var baseR = Math.min(cx, cy) * 0.3;
            for (var i = 0; i < barCount; i++) {
                var angle = (i / barCount) * Math.PI * 2 - Math.PI / 2;
                var barLen = Math.max(2, vals[i] * (Math.min(cx, cy) - baseR) * 0.9);
                var r = Math.round(201 + (108 - 201) * (1 - vals[i]));
                var g = Math.round(162 + (140 - 162) * (1 - vals[i]));
                var b = Math.round(39 + (255 - 39) * (1 - vals[i]));
                vizCtx2d.strokeStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + (0.5 + vals[i] * 0.5) + ')';
                vizCtx2d.lineWidth = 2.5;
                vizCtx2d.beginPath();
                vizCtx2d.moveTo(cx + Math.cos(angle) * baseR, cy + Math.sin(angle) * baseR);
                vizCtx2d.lineTo(cx + Math.cos(angle) * (baseR + barLen), cy + Math.sin(angle) * (baseR + barLen));
                vizCtx2d.stroke();
            }
        } else {
            // Bar mode
            for (var i = 0; i < barCount; i++) {
                var barH = Math.max(2, vals[i] * H * 0.9);
                var x = i * (barW + 1);
                var y = H - barH;
                var r = Math.round(201 + (108 - 201) * (1 - vals[i]));
                var g = Math.round(162 + (140 - 162) * (1 - vals[i]));
                var b = Math.round(39 + (255 - 39) * (1 - vals[i]));
                vizCtx2d.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + (0.4 + vals[i] * 0.6) + ')';
                vizCtx2d.fillRect(x, y, barW, barH);
                // Glow on peak bars
                if (vals[i] > 0.8) {
                    vizCtx2d.shadowColor = 'rgba(201,162,39,0.6)';
                    vizCtx2d.shadowBlur = 6;
                    vizCtx2d.fillRect(x, y, barW, barH);
                    vizCtx2d.shadowBlur = 0;
                }
            }
        }
        vizCtx2d.globalAlpha = 1;
    }

    draw();
}

function stopVizLoop() {
    vizTargetOpacity = 0;
    if (vizCanvas) vizCanvas.classList.remove('active', 'glowing');
    // Loop continues briefly for fade-out, then clears
    setTimeout(function() {
        if (vizTargetOpacity === 0 && vizFadeOpacity < 0.02) {
            if (vizAnimId) { cancelAnimationFrame(vizAnimId); vizAnimId = null; }
            if (vizCtx2d && vizCanvas) vizCtx2d.clearRect(0, 0, vizCanvas.width, vizCanvas.height);
        }
    }, 1200);
}

/* ═══════════════════════════════════════
   MEDITATION TIMER — chains ambient → breath → bell
   ═══════════════════════════════════════ */

var medTimer = {
    duration: 600,   // seconds (10 min default)
    track: 'cosmic-drone',
    breathPreset: 'coherent',
    breathInterval: null,
    countdownInterval: null,
    remaining: 0,
    running: false,
    onTick: null,   // callback(remaining)
    onPhase: null,  // callback(phaseName)
    onComplete: null
};

function medStart(cfg) {
    if (medTimer.running) medStop();
    medTimer.duration = cfg.duration || 600;
    medTimer.track = cfg.track || 'cosmic-drone';
    medTimer.breathPreset = cfg.breathPreset || 'coherent';
    medTimer.onTick = cfg.onTick || null;
    medTimer.onPhase = cfg.onPhase || null;
    medTimer.onComplete = cfg.onComplete || null;
    medTimer.remaining = medTimer.duration;
    medTimer.running = true;

    // Phase 1: start ambient music — اگر برای بخش مدیتیشن فایل آپلودی وجود
    // داشته باشد، وینیل (VinylPlayer) پخشش می‌کند و سنتز ambient رد می‌شود
    var _vinylHas = window.VinylPlayer && VinylPlayer.hasFileFor && VinylPlayer.hasFileFor('meditation');
    if (!_vinylHas) playBgm(medTimer.track);
    if (medTimer.onPhase) medTimer.onPhase('ambient');

    // After 5 seconds, start breath guide
    setTimeout(function() {
        if (!medTimer.running) return;
        if (medTimer.onPhase) medTimer.onPhase('breathing');
        medTimer.breathInterval = startYogaBreathGuide(medTimer.breathPreset);
    }, 5000);

    // Countdown ticker
    medTimer.countdownInterval = setInterval(function() {
        medTimer.remaining--;
        if (medTimer.onTick) medTimer.onTick(medTimer.remaining);
        if (medTimer.remaining <= 0) {
            medComplete();
        }
    }, 1000);
}

function medComplete() {
    if (!medTimer.running) return;
    medTimer.running = false;
    if (medTimer.onPhase) medTimer.onPhase('bell');

    // Stop breath guide
    if (medTimer.breathInterval) { clearInterval(medTimer.breathInterval); medTimer.breathInterval = null; }
    if (medTimer.countdownInterval) { clearInterval(medTimer.countdownInterval); medTimer.countdownInterval = null; }

    // Fade out music
    if (ctx && bgmGain) {
        bgmGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 3);
        setTimeout(function() { stopBgm(); }, 3500);
    }

    // Play completion bell sequence
    playSfx('bell');
    setTimeout(function() { playSfx('chime'); }, 800);
    setTimeout(function() { playSfx('chime'); }, 1600);

    if (medTimer.onComplete) medTimer.onComplete();
}

function medStop() {
    medTimer.running = false;
    if (medTimer.breathInterval) { clearInterval(medTimer.breathInterval); medTimer.breathInterval = null; }
    if (medTimer.countdownInterval) { clearInterval(medTimer.countdownInterval); medTimer.countdownInterval = null; }
    stopBgm();
}

function medIsRunning() { return medTimer.running; }
function medRemaining() { return medTimer.remaining; }
function medFormatTime(sec) {
    var m = Math.floor(sec / 60);
    var s = sec % 60;
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
}

/* ═══════════════════════════════════════
   APPLY BACKGROUNDS (per-plan, real page background)
   تصاویری که ادمین به پلن‌ها تخصیص داده به‌عنوان پس‌زمینه‌ی واقعی صفحه اعمال
   می‌شوند: اولویت با تصویرِ پلن کاربر؛ مهمان → تصاویر بدون تخصیص؛ بعد گرادیان.
   ═══════════════════════════════════════ */

function applyAdminBackgrounds(bgs) {
    try {
        bgs = bgs || getBgDb();
        var user = {};
        try { user = JSON.parse(localStorage.getItem('cosmic_user') || '{}'); } catch (_) {}
        var plan = user.plan || null;
        var pick = null;
        var unassigned = [];
        bgs.forEach(function (b) {
            if (!b.active) return;
            if (b.imageUrl) {
                if (b.assignedPlans && b.assignedPlans.length) {
                    if (plan && b.assignedPlans.indexOf(plan) >= 0 && !pick) pick = b;
                } else {
                    unassigned.push(b);
                }
            }
        });
        var chosen = pick || (unassigned.length ? unassigned[0] : null);
        var el = document.getElementById('cosmicBgLayer');
        if (!el) {
            el = document.createElement('div');
            el.id = 'cosmicBgLayer';
            el.style.cssText = 'position:fixed;inset:0;z-index:-1;pointer-events:none;'
                + 'background-size:cover;background-position:center;transition:opacity .6s;';
            document.body.appendChild(el);
        }
        if (chosen) {
            el.style.backgroundImage = 'url("' + chosen.imageUrl + '")';
            el.style.opacity = '0.35'; // ملایم — خوانایی محتوا حفظ شود
        } else {
            el.style.backgroundImage = 'none';
        }
    } catch (_) { /* هرگز نباید صفحه را بشکند */ }
}

function initAdminBackgrounds() {
    // ۱) اعمال فوری از آینه‌ی محلی؛ ۲) تازه‌سازی از سرور و اعمال مجدد
    applyAdminBackgrounds();
    hydrateSettingsFromServer('backgrounds', BG_DB_KEY, function () { applyAdminBackgrounds(); });
    // پس از ورود/خروج، پلن عوض می‌شود → انتخاب تصویر هم باید عوض شود
    var lastPlan = null;
    setInterval(function () {
        var plan = null;
        try { plan = (JSON.parse(localStorage.getItem('cosmic_user') || '{}').plan) || null; } catch (_) {}
        if (plan !== lastPlan) { lastPlan = plan; applyAdminBackgrounds(); }
    }, 2000);
}

/* ═══════════════════════════════════════
   PUBLIC API
   ═══════════════════════════════════════ */

window.AudioManager = {
    // BGM
    play: playBgm,
    pause: pauseBgm,
    resume: resumeBgm,
    stop: stopBgm,
    toggle: toggleBgm,
    next: nextTrack,
    prev: prevTrack,
    setVolume: setBgmVolume,
    toggleMute: toggleMute,
    // SFX
    sfx: playSfx,
    setSfxEnabled: setSfxEnabled,
    setSfxVolume: setSfxVolume,
    // Yoga
    startYogaAmbient: startYogaAmbient,
    startYogaBreathGuide: startYogaBreathGuide,
    playBreathCue: playBreathCue,
    // Tracks
    getTracks: function() { return TRACKS.slice(); },
    getBreathPresets: function() { return BREATH_PRESETS; },
    getCurrentTrack: function() { return prefs.currentTrack || TRACKS[0].id; },
    isPlaying: function() { return bgmPlaying && !bgmPaused; },
    // Init
    init: function() {
        // اگر پلیر وینیلی (vinyl-player.js) فعال است، ویجت قدیمی ساخته نشود تا تداخل نکند
        if (!window.VinylPlayer) createPlayerWidget();
        // بعد از hydrate، پلی‌لیست/نام‌ها/فایل‌ها را بازتاب بده
        hydrateSettingsFromServer('audio', AUDIO_DB_KEY, updatePlayerUI);
        hydrateSettingsFromServer('backgrounds', BG_DB_KEY);
        initAdminBackgrounds();
    },
    // Meditation Timer
    medStart: medStart,
    medStop: medStop,
    medIsRunning: medIsRunning,
    medRemaining: medRemaining,
    medFormatTime: medFormatTime,
    // Admin — تنها applyAdminBackgrounds هنوز لازم است (تب 🖼️ پس‌زمینه آن را صدا می‌زند).
    // CRUD قدیمیِ صدا/تصویر حذف شده: AudioAdmin + BackgroundAdmin جانشین شده‌اند.
    applyAdminBackgrounds: applyAdminBackgrounds
};

function _esc(s) {
    var d = document.createElement('div');
    d.appendChild(document.createTextNode(s || ''));
    return d.innerHTML;
}

})();
