/* ═══════════════════════════════════════════════════════════════
   Node harness for the REAL yoga-classic browser scripts.

   data.js + engine.js are browser scripts (window / localStorage /
   fetch / DOMParser). This harness runs them unmodified under Node
   against the real resource files, so the pytest suites exercise the
   actual parsing, FA matching and session-timing code — not a
   re-implementation.

   Usage:
     node tests/_yoga_harness.js coverage
     node tests/_yoga_harness.js timing '[...cases]'

   Output is one JSON document on stdout.
   ═══════════════════════════════════════════════════════════════ */
'use strict';

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');

/* ── minimal DOMParser shim (supports the selectors data.js uses) ── */
function decodeEntities(s) {
  return s.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (m, e) => {
    if (e[0] === '#') {
      const code = e[1] === 'x' || e[1] === 'X'
        ? parseInt(e.slice(2), 16)
        : parseInt(e.slice(1), 10);
      return code ? String.fromCodePoint(code) : m;
    }
    return { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }[e] || m;
  });
}

/* 'a > b' → direct children; 'tag' → any descendant */
function matches(el, parts) {
  if (parts.length === 1) return el.tagName === parts[0];
  if (parts.length === 2) return el.tagName === parts[1] && el.parent && el.parent.tagName === parts[0];
  return false;
}
function selectAll(root, sel) {
  const parts = sel.split('>').map(s => s.trim());
  const out = [];
  (function walk(node) {
    if (node.nodeType !== 1 && node.nodeType !== 9) return;  // traverse doc + elements
    if (node !== root && matches(node, parts)) out.push(node);
    for (const c of node.children) walk(c);
  })(root);
  return out;
}

function parseXml(text) {
  const doc = {
    nodeType: 9, tagName: '#document', attributes: [], children: [], parent: null,
    querySelectorAll(sel) { return selectAll(this, sel); },
    querySelector(sel) { return selectAll(this, sel)[0] || null; },
  };
  let current = doc;
  let textBuf = '';
  let pos = 0;
  const len = text.length;

  const flushText = () => {
    if (textBuf) {
      current.children.push({
        nodeType: 3, tagName: '#text', attributes: [], children: [], parent: current,
        data: decodeEntities(textBuf),
      });
      textBuf = '';
    }
  };
  const mkEl = (tagName, attrs) => ({
    nodeType: 1, tagName, attributes: attrs, children: [], parent: current,
    getAttribute(name) {
      for (const a of attrs) if (a.name === name) return a.value;
      return null;
    },
    querySelectorAll(sel) { return selectAll(this, sel); },
    querySelector(sel) { return selectAll(this, sel)[0] || null; },
    get childNodes() { return this.children; },
    get textContent() {
      let out = '';
      (function collect(n) {
        if (n.nodeType === 3) out += n.data;
        else for (const c of n.children) collect(c);
      })(this);
      return out;
    },
  });

  while (pos < len) {
    const lt = text.indexOf('<', pos);
    if (lt < 0) { textBuf += text.slice(pos); break; }
    textBuf += text.slice(pos, lt);
    const gt = text.indexOf('>', lt);
    if (gt < 0) { textBuf += text.slice(lt); break; }
    let inner = text.slice(lt + 1, gt);
    pos = gt + 1;

    if (inner.startsWith('?')) continue;                 // <?xml …?>
    if (inner.startsWith('!--')) {                       // <!-- comment -->
      /* the '>' we consumed is ALREADY the comment's own '-->' closer
         (comments here never contain '>') — do NOT search further, or
         everything between two consecutive comments gets eaten. */
      if (!inner.endsWith('--')) {                       // '>' inside comment text
        const close = text.indexOf('-->', lt + 4);
        pos = close >= 0 ? close + 3 : len;
      }
      continue;
    }
    if (inner.startsWith('/')) {           // </tag> → pop the element stack
      if (current.parent) { flushText(); current = current.parent; }
      continue;
    }
    if (inner.startsWith('!')) continue;  // <!DOCTYPE>
    flushText();

    let selfClosing = inner.endsWith('/');
    if (selfClosing) inner = inner.slice(0, -1).trimEnd();
    const sp = inner.search(/[\s]/);
    const tagName = sp >= 0 ? inner.slice(0, sp) : inner;
    const attrSrc = sp >= 0 ? inner.slice(sp + 1) : '';
    const attrs = [];
    const reAttr = /([^\s=]+)\s*=\s*("([^"]*)"|'([^']*)')/g;
    let am;
    while ((am = reAttr.exec(attrSrc)) !== null) {
      attrs.push({ name: am[1], value: am[3] !== undefined ? am[3] : am[4] });
    }

    const el = mkEl(tagName, attrs);
    current.children.push(el);
    if (!selfClosing) current = el;
  }
  flushText();
  return doc;
}

global.window = global;
global.self = global;
global.DOMParser = class {
  parseFromString(t) { return parseXml(t); }
};
global.localStorage = {
  _m: {},
  getItem(k) { return k in this._m ? this._m[k] : null; },
  setItem(k, v) { this._m[k] = String(v); },
  removeItem(k) { delete this._m[k]; },
};
/* disk-backed fetch: relative URLs are served straight from the repo.
   /yoga-cue/ keys and missing files are faked ok (the audio scheduling
   tests only need fetch to succeed + provide an ArrayBuffer). */
global.fetch = async (url, opts) => {
  const method = (opts && opts.method) || 'GET';
  const clean = String(url).split('?')[0];
  const full = path.join(REPO_ROOT, clean);
  try {
    const content = fs.readFileSync(full, 'utf8');
    return {
      ok: true, status: 200,
      text: async () => content,
      json: async () => JSON.parse(content),
      arrayBuffer: async () => Buffer.from(content).buffer,
    };
  } catch (e) {
    const fake = String(url).indexOf('/yoga-cue/') === 0;
    return {
      ok: fake, status: fake ? 200 : 404,
      text: async () => '', json: async () => ({}),
      arrayBuffer: async () => new ArrayBuffer(0),
    };
  }
};

/* Mock WebAudio for the audio-scheduling test: counts every cue that
   reaches src.start() and simulates onended so the FIFO queue advances.
   decodeAudioData is async (setTimeout) to reproduce the newStep race. */
global.__audio = { starts: 0, connects: 0 };
global.AudioContext = class {
  constructor() { this.currentTime = 0; this.state = 'running'; this.destination = {}; }
  resume() { this.state = 'running'; return Promise.resolve(); }
  createGain() {
    return { gain: { value: 1, setValueAtTime() {}, linearRampToValueAtTime() {}, setTargetAtTime() {} }, connect() {} };
  }
  createBufferSource() {
    const src = { buffer: null, onended: null, connect() { global.__audio.connects++; } };
    src.start = () => {
      global.__audio.starts++;
      const dur = (src.buffer && src.buffer.duration) || 0.05;
      const ms = Math.max(1, Math.min(15, dur * 1000));
      setTimeout(() => { if (typeof src.onended === 'function') src.onended(); }, ms);
    };
    return src;
  }
  createOscillator() { return { type: 'sine', frequency: { value: 200 }, connect() {}, start() {}, stop() {} }; }
  decodeAudioData(ab, ok) { setTimeout(() => ok({ duration: 0.5 }), 1); }
};

/* load the real browser scripts (they export onto window === global) */
eval(fs.readFileSync(path.join(REPO_ROOT, 'static/yoga-classic/data.js'), 'utf8'));
eval(fs.readFileSync(path.join(REPO_ROOT, 'static/yoga-classic/engine.js'), 'utf8'));
eval(fs.readFileSync(path.join(REPO_ROOT, 'static/yoga-classic/audio.js'), 'utf8'));

/* load the real browser scripts (they export onto window === global) */
eval(fs.readFileSync(path.join(REPO_ROOT, 'static/yoga-classic/data.js'), 'utf8'));
eval(fs.readFileSync(path.join(REPO_ROOT, 'static/yoga-classic/engine.js'), 'utf8'));

const { Data, DataReady, loadFaTexts, faPose, validateFaCoverage, resolveSession } = global;

function faName(poseName) {
  const h = faPose(poseName);
  return h && (h.name_fa || h.display_name_fa) ? (h.display_name_fa || h.name_fa) : null;
}

async function runCoverage() {
  await DataReady;
  await loadFaTexts();
  const posesMissing = validateFaCoverage().map(m => m.name);

  /* every pose referenced by the practice sessions (pose steps + move
     targets) must resolve to a Persian record */
  const walk = (steps, set) => (steps || []).forEach(s => {
    if (s.type === 'pose' && s.name) set.add(s.name);
    if (s.type === 'move') {
      const mv = Data.moveByName[s.name];
      if (mv && mv.toPose) set.add(mv.toPose);
    }
    if (s.steps) walk(s.steps, set);
    if (s.levels) Object.values(s.levels).forEach(lv => walk(lv, set));
  });
  const sessionRefs = {};
  Data.practices.forEach(pr => {
    const set = new Set();
    walk(pr.session && pr.session.body.steps, set);
    sessionRefs[pr.name] = Array.from(set).sort();
  });
  const badSessionRefs = {};
  Object.keys(sessionRefs).forEach(k => {
    const bad = sessionRefs[k].filter(n => !faName(n));
    if (bad.length) badSessionRefs[k] = bad;
  });
  const moveTargets = Array.from(new Set(Data.moves.map(m => m.toPose).filter(Boolean))).sort();
  const badMoveTargets = moveTargets.filter(n => !faName(n));

  console.log(JSON.stringify({
    posesTotal: Data.poses.length,
    posesMissing,
    sessionRefs,
    badSessionRefs,
    moveTargets,
    badMoveTargets,
    faRecords: Object.keys(global.FA_TXT.byKey).length,
  }));
}

/* Reference resolution: every //ref// inside description_fa must resolve to a
   yoga.txt record through the REAL faPoseRef matcher (guards the 455-ref fix
   from regressing — a free-form paraphrase or a dropped record fails here). */
async function runRefs() {
  await DataReady;
  await loadFaTexts();
  const { faPoseRef, FA_TXT } = global;
  const records = [];
  const seen = new Set();
  Object.values(FA_TXT.byKey).forEach(r => {
    if (r && r.name && !seen.has(r.name)) { seen.add(r.name); records.push(r); }
  });
  let total = 0, unresolved = 0;
  const unresolvedList = [];
  records.forEach(p => {
    const text = p.description_fa || '';
    const re = /\/\/([^/]+)\/\//g;
    let m;
    while ((m = re.exec(text)) !== null) {
      total++;
      if (!faPoseRef(m[1])) {
        unresolved++;
        if (unresolvedList.length < 15) unresolvedList.push(p.name + ': ' + m[1]);
      }
    }
  });
  console.log(JSON.stringify({ totalRefs: total, unresolvedRefs: unresolved, unresolvedList }));
}

/* Audio scheduling: verify queued cues actually reach src.start() and that
   a step transition (newStep) never drops the next step's first cue. */
const wait = ms => new Promise(r => setTimeout(r, ms));
async function runAudioSched() {
  const { Audio2 } = global;
  Audio2.unlock();
  global.__audio.starts = 0; global.__audio.connects = 0;

  /* race: a step-A cue is still loading when we newStep() and enqueue
     step B. B must still reach start() (not be eaten by A's stale .then). */
  Audio2.play('step_a.ogg');
  Audio2.newStep();
  Audio2.play('step_b.ogg');
  await wait(250);
  const raceStarts = global.__audio.starts;

  /* no-drop: enqueue several cues in one step — every one must play. */
  global.__audio.starts = 0;
  ['c1.ogg', 'c2.ogg', 'c3.ogg', 'c4.ogg'].forEach(f => Audio2.play(f));
  await wait(250);
  const sequentialStarts = global.__audio.starts;

  /* cross-step: three sequential steps, each waits to finish before the
     next newStep — every cue must play exactly once. */
  global.__audio.starts = 0;
  for (let i = 0; i < 3; i++) {
    Audio2.newStep();
    Audio2.play('x' + i + '.ogg');
    await wait(40);
  }
  await wait(120);
  const crossStepStarts = global.__audio.starts;

  console.log(JSON.stringify({ raceStarts, sequentialStarts, crossStepStarts }));
}

/* Yoga Core alias guard: name-first alias resolution must never resolve a
   pose to a wrong record, and the known renames must keep working. */
async function runYogaCore() {
  /* yoga-core.js declares `var YogaCore` but doesn't assign window — load it
     as a real script so the var lands on the global object. */
  require('vm').runInThisContext(fs.readFileSync(path.join(REPO_ROOT, 'static/yoga-core.js'), 'utf8'));
  const YC = global.YogaCore;
  await YC.load();
  const get = ref => { const r = YC.get(ref); return r ? r.name : null; };
  const collision = {
    Cobra: get('Cobra'), Tree: get('Tree'), Mountain: get('Mountain'),
    Pyramid: get('Pyramid'), Triangle: get('Triangle'), Fish: get('Fish'),
    Frog: get('Frog'), Garland: get('Garland'),
  };
  const renames = {
    'Wind Removing': get('Wind Removing'), 'Turtle': get('Turtle'),
    'Savasana': get('Savasana'), 'Child Wide Start': get('Child Wide Start'),
    'Seated On Heels Prayer Closed Eyes': get('Seated On Heels Prayer Closed Eyes'),
  };
  const faSamples = { 'کبری': get('کبری'), 'درخت': get('درخت'), 'سگ رو به پایین': get('سگ رو به پایین') };
  /* name-first guarantee: every pose's own name must resolve back to it
     (not to a variant shadowing it). All Latin + Persian aliases must
     resolve to some record (name_fa support is what keyOf's Persian class
     enables). */
  let wrongName = 0; const wrongNameList = [];
  let unresolvedAlias = 0; const unresolvedList = [];
  YC.getPoses().forEach(p => {
    const r = YC.get(p.name);
    if (r && r.name !== p.name) { wrongName++; if (wrongNameList.length < 10) wrongNameList.push(p.name + '->' + r.name); }
    [p.name, p.display_name, p.name_fa].concat(p.aka || []).forEach(k => {
      if (k && !YC.get(k)) { unresolvedAlias++; if (unresolvedList.length < 10) unresolvedList.push(p.name + ':' + k); }
    });
  });
  console.log(JSON.stringify({ collision, renames, faSamples, wrongName, wrongNameList, unresolvedAlias, unresolvedList }));
}

/* Audio-anchor probe: for every practice × duration, walk the resolved
   steps with the app's cueStep semantics (voice on) and record when the
   first cues would fire. 'voiced' = move step with a real raw voice file
   (the spoken instruction); 'number' = breath-count fallback. */
async function runAnchors() {
  await DataReady;
  const { moveAudioCandidates, RAW_FILES } = global;
  /* app.js's bootstrapInventory fills RAW_FILES from the inventory — the
     harness doesn't run app.js, so mirror it here from disk. */
  const inv = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'static/yoga-classic/inventory.json'), 'utf8'));
  RAW_FILES.clear();
  (inv.raw || []).forEach(f => RAW_FILES.add(f));
  const out = [];
  for (const p of Data.practices) {
    const durs = p.durations || [30, 45, 60];
    for (let di = 0; di < durs.length; di++) {
      const level = 0;   /* the app's default difficulty (Options.level = 0) */
      const { steps } = resolveSession(p.session, level, di, durs[di]);
      let t = 0, parity = 0;
      const voiced = [];   /* move steps with a real spoken instruction */
      const audible = [];  /* every step that would play any raw file    */
      const movesHead = [];
      for (const s of steps) {
        if (s.type === 'move') {
          const hasV = moveAudioCandidates(s.name, s.side).some(f => RAW_FILES.has(f));
          if (movesHead.length < 14) movesHead.push({ t: +t.toFixed(2), name: s.name, side: s.side, v: hasV ? 1 : 0 });
          if (hasV) {
            voiced.push({ t, name: s.name });
            audible.push({ t, kind: 'moveVoice', name: s.name });
          } else {
            parity++;
            audible.push({ t, kind: 'number', n: parity });
          }
        }
        t += s.duration || 0;
      }
      out.push({
        practice: p.name, duration: durs[di],
        firstVoice: voiced.length ? voiced[0].t : null,
        secondVoice: voiced.length > 1 ? voiced[1].t : null,
        firstAny: audible.length ? audible[0].t : null,
        movesHead,
      });
    }
  }
  console.log(JSON.stringify(out));
}

async function runTiming(cases) {
  await DataReady;
  const results = (cases || []).map(c => {
    const practice = Data.practices.find(p => p.name === c.practice);
    if (!practice || !practice.session) {
      return { ...c, error: 'no session' };
    }
    const resolved = resolveSession(practice.session, c.level, c.durationIndex, c.targetMinutes);
    let lastMusic = -1;
    resolved.steps.forEach((s, i) => { if (s.type === 'music') lastMusic = i; });
    let mainSeconds = 0, restSeconds = 0;
    resolved.steps.forEach((s, i) => {
      const d = s.duration || 0;
      if (i > lastMusic) restSeconds += d;
      else mainSeconds += d;
    });
    return {
      practice: c.practice, level: c.level, durationIndex: c.durationIndex,
      targetMinutes: c.targetMinutes,
      mainSeconds: +mainSeconds.toFixed(6),
      restSeconds: +restSeconds.toFixed(6),
      totalSeconds: +resolved.totalSeconds.toFixed(6),
    };
  });
  console.log(JSON.stringify(results));
}

/* ═══════════════════════════════════════════════════════════════
   Calconvert mode — pin the shamsi→gregorian conversion the main
   app applies to picked dates (buildSubject + profile auto-save).
   The conversion lives in static/zodiac-display.js (jalaliToGregorian /
   shamsiToGregorianDate); we load the real file and drive it.
   ═══════════════════════════════════════════════════════════════ */
async function runCalConvert() {
  const fs = require('fs');
  const path = require('path');
  const ROOT = path.resolve(__dirname, '..');
  const vm = require('vm');
  const src = fs.readFileSync(path.join(ROOT, 'static', 'zodiac-display.js'), 'utf8');
  vm.runInThisContext(src, { filename: 'zodiac-display.js' });
  const conv = global.shamsiToGregorianDate || (typeof shamsiToGregorianDate === 'function' && shamsiToGregorianDate);
  if (typeof conv !== 'function') throw new Error('shamsiToGregorianDate not found in zodiac-display.js');

  const cases = [
    // [shamsi jy, jm, jd, expected gy, gm, gd]  — values verified against the
    // authoritative `jdatetime` Python library (togregorian)
    [1379, 10, 11, 2000, 12, 31], // winter date: raw 1379 would give Libra instead of Cap
    [1379, 5, 21, 2000, 8, 11],   // matches the profile auto-save live test
    [1403, 5, 21, 2024, 8, 11],
    [1300, 1, 1, 1921, 3, 21],    // lower clamp of the 1300-1600 range
    [1600, 1, 1, 2221, 3, 21],    // upper clamp of the 1300-1600 range
    [2024, 8, 11, 2024, 8, 11],   // gregorian-range input passes through unchanged
    [1900, 5, 10, 1900, 5, 10],   // pre-1300 gregorian passes through
  ];
  const results = cases.map(([jy, jm, jd, gy, gm, gd]) => {
    const out = conv(jy, jm, jd);
    return { in: [jy, jm, jd], out: [out.gy, out.gm, out.gd], expected: [gy, gm, gd], ok: out.gy === gy && out.gm === gm && out.gd === gd };
  });
  const failed = results.filter(r => !r.ok);
  console.log(JSON.stringify({ total: results.length, failed: failed.length, cases: results }));
  if (failed.length) process.exit(1);
}

(async () => {
  const mode = process.argv[2];
  try {
    if (mode === 'coverage') await runCoverage();
    else if (mode === 'timing') await runTiming(JSON.parse(process.argv[3] || '[]'));
    else if (mode === 'audio-sched') await runAudioSched();
    else if (mode === 'yogacore') await runYogaCore();
    else if (mode === 'refs') await runRefs();
    else if (mode === 'anchors') await runAnchors();
    else if (mode === 'calconvert') await runCalConvert();
    else throw new Error('unknown mode: ' + mode);
  } catch (e) {
    console.error('HARNESS_ERROR', e && e.stack || e);
    process.exit(2);
  }
})();