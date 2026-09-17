/* ═══════════════════════════════════════════════════════════════
   AUDIO v2 — sequential voice cues from res/raw/*.ogg
   Fixes overlap: a strict FIFO chain guarantees cues never play in
   parallel; each session step owns a token — switching steps cancels
   anything still pending from the previous step.
   Ambient: procedural WebAudio per music marker (0-3).
   ═══════════════════════════════════════════════════════════════ */
'use strict';

const Audio2 = (function () {
  let ctx = null;
  let master = null;
  const cache = new Map();          // file → AudioBuffer
  const missing = new Set();
  const pending = new Map();        // file → Promise<AudioBuffer>
  let volume = 1;

  /* ── strict sequential queue ─────────────────────────────────
     queue is a chain: [file, gap, token][]. startAt computes the
     absolute time this cue will begin once every earlier cue
     finishes. A late-loading buffer does NOT start immediately —
     it waits for its computed slot, and a stale token skips it. */
  const queue = [];                 // pending cues [{file, token, gap}]
  let queuedDur = 0;                // sum of durations+gaps queued ahead
  let currentToken = 0;             // bumped on step change / stop
  let playhead = 0;                 // ctx.currentTime anchor for queue

  function actx() {
    if (!ctx) {
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        master = ctx.createGain();
        master.gain.value = volume;
        master.connect(ctx.destination);
      } catch (e) { return null; }
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  }
  function unlock() { actx(); }
  function setVolume(v) {
    volume = Math.max(0, Math.min(1, v));
    if (master) master.gain.value = volume;
  }

  function load(file) {
    if (cache.has(file)) return Promise.resolve(cache.get(file));
    if (missing.has(file)) return Promise.resolve(null);
    if (pending.has(file)) return pending.get(file);
    const p = fetch(rawUrl(file))
      .then(r => { if (!r.ok) throw 0; return r.arrayBuffer(); })
      .then(ab => new Promise((res, rej) => actx().decodeAudioData(ab, res, rej)))
      .then(buf => { cache.set(file, buf); pending.delete(file); return buf; })
      .catch(() => { missing.add(file); pending.delete(file); return null; });
    pending.set(file, p);
    return p;
  }

  const GAP = 0.12;      // small breath between cues
  const MIN_GAP = 0.45;  // minimum spacing enforced at enqueue time so
                         // rapid-fire cues stay intelligible

  /** Enqueue a cue. If token is stale the cue is dropped instantly.
      Returns immediately — playback order is arrival order. */
  function play(file, opts) {
    opts = opts || {};
    const token = opts.token != null ? opts.token : currentToken;
    if (token !== currentToken) return;           // step changed already
    if (!DB.settings.voice) return;
    const c = actx(); if (!c) return;
    const dur = AUDIO_DUR[file] || null;
    let gap = opts.gap != null ? opts.gap : GAP;
    /* intelligibility: if the previous queued cue is close behind,
       widen this one's gap so words never mash together */
    const last = queue[queue.length - 1];
    if (last && last.gap < MIN_GAP && dur != null && (AUDIO_DUR[last.file] || 0.6) < 1.2) {
      gap = Math.max(gap, MIN_GAP);
    }
    queue.push({ file, token, gap });
    queuedDur += (dur || 0.6) + gap;
    _scheduleNext();
  }

  /** Play the next queued cue exactly when the previous one ends.
      Real buffer duration always wins over the ffprobe estimate so a
      cue never gets cut short, and onended (not the estimate) drives
      the queue — late loads re-anchor instead of skipping.
      Overlap guard: ONE chain only. Any schedule started before the
      latest newStep() is dead on arrival — checked again immediately
      before src.start(), the last possible moment. */
  /* ── the play lock ────────────────────────────────────────────
     _busy means «the head of the queue is scheduled and still
     sounding». It must stay TRUE for the whole playback, not just
     while the buffer loads: releasing it in the load callback let a
     cue that arrived while the previous one was still audible re-enter
     _scheduleNext(), find the SAME queue[0] (a cue is only shifted when
     it ends) and schedule it a second time — the bug where a long pose
     instruction was spoken twice and the new cue slid in behind it. */
  let _busy = false;
  let _timer = null;                    // safety release when onended never fires
  function _clearTimer() { if (_timer) { clearTimeout(_timer); _timer = null; } }
  /** free the lock and pull the next cue — the head only moves here.
      Idempotent per cue: onended and the safety timer may both fire. */
  function _finish(next, gen) {
    if (gen !== schedGen || next._ended) return;   // superseded by a newer step
    next._ended = true;
    _clearTimer();
    _busy = false;
    if (queue[0] === next) queue.shift();
    /* advance the anchor past the REAL end of this file */
    const c = actx();
    if (c) playhead = Math.max(playhead, c.currentTime + next.gap);
    _scheduleNext();
  }
  let schedGen = 0;                    // bumped by newStep()
  function _scheduleNext() {
    const c = actx(); if (!c) return;
    if (_busy) return;                 // a cue owns the chain until it ends
    const next = queue[0];
    if (!next) { queuedDur = 0; playhead = 0; return; }
    if (next.token !== currentToken) {             // stale — drop & advance
      queue.shift();
      _scheduleNext();
      return;
    }
    const myGen = schedGen;
    _busy = true;
    /* provisional slot from the estimate; corrected once buffer arrives */
    const myDur = AUDIO_DUR[next.file] || 0.6;
    const base = playhead > c.currentTime ? playhead : c.currentTime + 0.03;
    playhead = base + myDur + next.gap;
    load(next.file).then(buf => {
      /* a newer newStep() happened while loading → this chain is dead;
         never touch _busy/queue of the CURRENT chain */
      if (myGen !== schedGen) return;
      if (!buf || next.token !== currentToken) {   // load failed, or step changed
        /* only drop OUR cue — never a newer one pushed by a fresh
           newStep()+cueStep after this one went stale */
        if (queue[0] === next) queue.shift();
        _busy = false;
        _scheduleNext();
        return;
      }
      const realDur = buf.duration || myDur;
      /* late load → the provisional playhead is behind the real end;
         re-anchor so this cue plays in full and never gets clipped */
      if (base + realDur + next.gap > playhead) playhead = base + realDur + next.gap;
      const src = c.createBufferSource();
      src.buffer = buf;
      src.connect(master);
      liveSources.add(src);
      /* LAST-LINE guard: step changed while decoding → do not start */
      if (myGen !== schedGen || next.token !== currentToken) {
        try { src.stop(); } catch (e) {}
        liveSources.delete(src);
        _busy = false;
        return;
      }
      src.start(base);
      /* ONLY the end of this cue (or the safety timer, if a suspended
         context swallows onended) frees the chain for the next one */
      src.onended = () => { liveSources.delete(src); _finish(next, myGen); };
      _timer = setTimeout(
        () => { liveSources.delete(src); _finish(next, myGen); },
        Math.max(250, (base - c.currentTime + realDur + 0.25) * 1000),
      );
    });
  }

  /** New step → ONE sound policy: kill everything queued AND everything
      currently sounding, so cues never pile up or overlap. */
  const liveSources = new Set();     // BufferSourceNodes still sounding
  function newStep() {
    currentToken++;
    schedGen++;
    queue.length = 0;
    queuedDur = 0;
    playhead = 0;
    liveSources.forEach(src => {
      try { src.onended = null; src.stop(); } catch (e) {}
    });
    liveSources.clear();
    _clearTimer();
    _busy = false;
  }
  /** hard cut — used on stop()/pause()/quit where silence is wanted */
  function killAll() {
    newStep();
  }

  /* durations.json (ffprobe-measured) for precise scheduling */
  let AUDIO_DUR = {};
  fetch('static/yoga-data/Audio/durations.json')
    .then(r => r.ok ? r.json() : {})
    .then(d => { AUDIO_DUR = d || {}; })
    .catch(() => {});

  /* preload helpers + progress reporting (n loaded / total) */
  const preloadStats = { total: 0, loaded: 0 };
  function onProgress(cb) { progressCb = cb; }
  let progressCb = null;
  function bump() {
    preloadStats.loaded++;
    if (progressCb) progressCb(preloadStats.loaded, preloadStats.total);
  }
  function preload(files) {
    const list = files.filter(Boolean).filter(f => hasRaw(f) && !cache.has(f) && !missing.has(f) && !pending.has(f));
    preloadStats.total += list.length;
    if (progressCb) progressCb(preloadStats.loaded, preloadStats.total);
    list.forEach(f => load(f).then(b => { bump(); }));
  }
  function preloadMove(moveName) {
    ['_l', '_r', '', '_2', '_2_l', '_2_r'].forEach(sfx => {
      const f = 'moves_' + moveName + sfx + '.ogg';
      if (hasRaw(f)) load(f);
    });
  }
  function preloadPose(poseName) {
    poseInstructionCandidates(poseName).concat(poseNameCandidates(poseName)).forEach(f => { if (hasRaw(f)) load(f); });
  }

  /* ── cue API — all cues belong to the current step token ── */
  function move(moveName, side) {
    const f = moveAudioCandidates(moveName, side).find(x => hasRaw(x) && !missing.has(x));
    if (f) play(f);
  }
  function poseInstruction(poseName) {
    const f = poseInstructionCandidates(poseName).find(x => hasRaw(x) && !missing.has(x));
    if (f) play(f);
  }
  function poseName(poseName) {
    const f = poseNameCandidates(poseName).find(x => hasRaw(x) && !missing.has(x));
    if (f) play(f, { gap: 0.18 });
  }
  function phrase(p) {
    if (p === 'soften') play('general_soften.ogg');
    else if (p === 'hold') play('general_hold.ogg');
    else if (p === 'rest') play('general_rest.ogg');
  }
  /** Breath count — long gap so it never sits on top of instructions. */
  function number(n) {
    if (n >= 1 && n <= 10) play('numbers_number_' + n + '.ogg', { gap: 0.25 });
    else if (n % 10 === 0 && n <= 100) play('numbers_number_' + n + '.ogg', { gap: 0.25 });
    else if (n % 2 === 0) play('general_inhale.ogg', { gap: 0.25 });
    else play('general_exhale.ogg', { gap: 0.25 });
  }
  function rest() { play('general_rest.ogg'); }
  function silent() { play('general_dynamic_state_going_silent.ogg'); }

  /* Guide/en texts — the spoken words, for the caption line.
     NOTE: the Guide folder sits at static/yoga-data/Guide/en/
     (NOT under resources/ like the other assets). */
  let guideTexts = {};
  function loadGuide() {
    ['general_soften', 'general_hold', 'general_rest'].forEach(b => {
      fetch('static/yoga-data/Guide/en/' + b + '.txt')
        .then(r => r.ok ? r.text() : '')
        .then(t => { if (t) guideTexts[b] = t.trim(); })
        .catch(() => {});
    });
  }

  return {
    unlock, setVolume, preload, preloadMove, preloadPose,
    newStep, killAll, move, poseInstruction, poseName, phrase, number, rest, silent,
    play, loadGuide, guideTexts: () => guideTexts, onProgress,
    stats: () => preloadStats,
    test: () => play('general_soften.ogg', {}),   /* audible self-test */
    get volume() { return volume; },
  };
})();

/* ═══════════════════════════════════════════════════════════════
   Ambient music — per-environment procedural pads; music markers
   0..3 switch the section mood (warmup / flow / energic / deep).
   ═══════════════════════════════════════════════════════════════ */
const Ambient = (function () {
  let ctx = null, gain = null, nodes = [], timer = null, current = null;
  const SCALES = {
    '0': [196.0, 233.08, 261.63, 311.13],          // warmup
    '1': [220.0, 261.63, 293.66, 329.63],          // flow
    '2': [261.63, 311.13, 349.23, 392.0],          // energic
    '3': [130.81, 155.56, 174.61, 196.0],          // deep rest
  };
  function ensure() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; }
      gain = ctx.createGain(); gain.gain.value = 0; gain.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  }
  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
    nodes.forEach(n => { try { n.stop ? n.stop() : n.disconnect(); } catch (e) {} try { n.disconnect(); } catch (e) {} });
    nodes = [];
    if (gain && ctx) gain.gain.setTargetAtTime(0, ctx.currentTime, 0.6);
    current = null;
  }
  function play(id) {
    if (!DB.settings.music) return;
    const c = ensure(); if (!c) return;
    if (current === id) return;
    stop();
    current = id;
    gain.gain.setTargetAtTime(0.14, c.currentTime, 1.2);
    const scale = SCALES[String(id)] || SCALES['0'];
    const osc = () => {
      if (current === null) return;
      const f = scale[Math.floor(Math.random() * scale.length)];
      const o = c.createOscillator(), g = c.createGain();
      o.type = Math.random() < 0.3 ? 'triangle' : 'sine';
      o.frequency.value = f;
      g.gain.setValueAtTime(0, c.currentTime);
      g.gain.linearRampToValueAtTime(0.32, c.currentTime + 1.6);
      g.gain.linearRampToValueAtTime(0, c.currentTime + 5.6);
      o.connect(g); g.connect(gain);
      o.start(); o.stop(c.currentTime + 5.8);
      nodes.push(o, g);
    };
    osc(); osc();
    timer = setInterval(() => { if (Math.random() < 0.72) osc(); }, 3800);
  }
  function setVolume(v) { if (gain && ctx) gain.gain.setTargetAtTime(0.14 * v, ctx.currentTime, 0.3); }
  return { play, stop, setVolume };
})();

/* ── export to window (same convention as data.js / engine.js) ── */
Object.assign(window, { Audio2, Ambient });
