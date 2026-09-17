// scripts/simulate_yoga_audio.mjs
// شبیه‌ساز ساده: منطق tick()/cueStep()/play() رو از audio.js و app.js
// در جاوااسکریپت اجرا می‌کنه، بدون WebAudio، تا timeline دقیق پخش
// در N ثانیهٔ اول چاپ بشه.

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const ROOT = resolve(process.cwd(), 'static', 'yoga-classic');
const ASSETS = resolve(ROOT, '..', 'yoga-data', 'resources', 'assets');

const [, , practice = 'ocean', minutes = '30', level = '0', horizon = '40'] = process.argv;

// ── load durations.json (real file lengths) ──
const AUDIO_DUR = JSON.parse(
  await readFile(resolve(ROOT, '..', 'yoga-data', 'Audio', 'durations.json'), 'utf8')
);

// ── minimal XML parser (regex-based, fine for these simple session files) ──
function parseXMLAttr(s) {
  // converts an XML attributes string to an object
  const out = {};
  const re = /([\w:_-]+)\s*=\s*"([^"]*)"/g;
  let m;
  while ((m = re.exec(s))) out[m[1]] = m[2];
  return out;
}

function tokenize(xml, tag) {
  // very loose: yields { open, close, selfClose, attrs, text, depth } for a single root tag tree
  const out = [];
  const tagRe = new RegExp(`<${tag}\\b([^>/]*)(/?)>`, 'g');
  const closeRe = new RegExp(`</${tag}>`, 'g');
  let cursor = 0;
  while (true) {
    const open = tagRe.exec(xml);
    if (!open) break;
    const isSelf = open[2] === '/';
    const attrs = parseXMLAttr(open[1]);
    if (isSelf) {
      out.push({ type: 'self', tag, attrs, start: open.index, end: open.index + open[0].length });
      continue;
    }
    // find matching close (skip nested same-tag)
    const startIdx = open.index + open[0].length;
    let depth = 1, scanIdx = startIdx;
    const openInner = new RegExp(`<${tag}\\b[^>]*>`, 'g');
    const closeInner = new RegExp(`</${tag}>`, 'g');
    openInner.lastIndex = scanIdx;
    closeInner.lastIndex = scanIdx;
    while (depth > 0) {
      const nextOpen = openInner.exec(xml);
      const nextClose = closeInner.exec(xml);
      if (!nextClose) throw new Error('unbalanced ' + tag);
      if (nextOpen && nextOpen.index < nextClose.index) {
        depth++;
        openInner.lastIndex = nextOpen.index + nextOpen[0].length;
      } else {
        depth--;
        if (depth === 0) {
          out.push({
            type: 'pair', tag, attrs, inner: xml.slice(startIdx, nextClose.index),
            start: open.index, end: nextClose.index + nextClose[0].length,
          });
          cursor = nextClose.index + nextClose[0].length;
          break;
        }
        closeInner.lastIndex = nextClose.index + nextClose[0].length;
      }
    }
  }
  return out;
}

function walkInner(xml) {
  // top-level children of xml
  const out = [];
  const re = /<(\w[\w:_-]*)\b([^>]*?)(\/?)>/g;
  let m;
  while ((m = re.exec(xml))) {
    const [, name, attrStr, self] = m;
    if (self === '/') {
      out.push({ tag: name, attrs: parseXMLAttr(attrStr), self: true, inner: '' });
    } else {
      // find matching close for this exact tag
      const close = new RegExp(`</${name}>`);
      const openInner = new RegExp(`<${name}\\b[^>]*>`, 'g');
      const closeInner = new RegExp(`</${name}>`, 'g');
      openInner.lastIndex = m.index + m[0].length;
      closeInner.lastIndex = m.index + m[0].length;
      let depth = 1, endIdx = -1;
      while (depth > 0) {
        const nO = openInner.exec(xml);
        const nC = closeInner.exec(xml);
        if (!nC) break;
        if (nO && nO.index < nC.index) {
          depth++; openInner.lastIndex = nO.index + nO[0].length;
        } else {
          depth--;
          if (depth === 0) { endIdx = nC.index; break; }
          closeInner.lastIndex = nC.index + nC[0].length;
        }
      }
      if (endIdx < 0) continue;
      out.push({
        tag: name, attrs: parseXMLAttr(attrStr), self: false,
        inner: xml.slice(m.index + m[0].length, endIdx),
      });
      re.lastIndex = endIdx + name.length + 3;
    }
  }
  return out;
}

// ── parse poses/moves/session ──
const posesTxt = await readFile(resolve(ASSETS, 'poses.xml'), 'utf8');
const movesTxt = await readFile(resolve(ASSETS, 'moves.xml'), 'utf8');
const sessTxt = await readFile(resolve(ASSETS, practice + '.session'), 'utf8');

const poseByName = {};
for (const p of walkInner(posesTxt)) {
  if (p.tag !== 'pose') continue;
  if (!p.attrs.name) continue;
  poseByName[p.attrs.name] = {
    name: p.attrs.name,
    baseName: p.attrs.baseName || p.attrs.name,
    excludeTimeline: p.attrs.excludeFromTimeline === 'true',
  };
}
const moveByName = {};
for (const m of walkInner(movesTxt)) {
  if (m.tag !== 'move') continue;
  if (!m.attrs.name) continue;
  let toPose = null;
  for (const c of walkInner(m.inner)) {
    if (c.tag === 'toPose') toPose = c.attrs.name;
  }
  moveByName[m.attrs.name] = {
    name: m.attrs.name,
    toPose,
    soundName: m.attrs.soundName || m.attrs.name,
    breath: m.attrs.breath || 'none',
  };
}

// session.steps
const sessionBlocks = walkInner(sessTxt);
const sessionEl = sessionBlocks.find(b => b.tag === 'session');
const headEl = walkInner(sessionEl.inner).find(b => b.tag === 'head');
const bodyEl = walkInner(sessionEl.inner).find(b => b.tag === 'body');
const repBased = bodyEl.attrs.repetitionBased === 'true';
const durEl = headEl && walkInner(headEl.inner).find(b => b.tag === 'durations');
const durations = durEl
  ? durEl.inner.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n))
  : [30];

function buildSteps(xml) {
  // returns nested step objects mirroring engine.js parseSession's `s` shape
  const out = [];
  for (const c of walkInner(xml)) {
    let step = null;
    switch (c.tag) {
      case 'tempo': step = { type: 'tempo', duration: c.attrs.duration }; break;
      case 'music': step = { type: 'music', id: c.attrs.id || '0' }; break;
      case 'dynamicstate': step = { type: 'dyn', state: c.attrs.state }; break;
      case 'move': step = { type: 'move', name: c.attrs.name }; break;
      case 'pose': step = { type: 'pose', name: c.attrs.name, count: c.attrs.count, side: c.attrs.side, phrase: c.attrs.phrase, audibleCount: c.attrs.audibleCount }; break;
      case 'hold': step = { type: 'hold', pose: c.attrs.pose, count: c.attrs.count, phrase: c.attrs.phrase, audibleCount: c.attrs.audibleCount }; break;
      case 'switchside': step = { type: 'switchside', force: c.attrs.force }; break;
      case 'loop': step = { type: 'loop', count: c.attrs.count, switchside: c.attrs.switchside === 'true', steps: buildSteps(c.inner) }; break;
      case 'difficulty': {
        const levels = {};
        for (const lvl of walkInner(c.inner)) levels[lvl.tag] = buildSteps(lvl.inner);
        step = { type: 'difficulty', levels };
        break;
      }
    }
    if (step) out.push(step);
  }
  return out;
}

const lvlKey = ['beginner', 'intermediate', 'expert'][+level] || 'beginner';
function flattenSession(steps, level, ctx, out) {
  ctx = ctx || { tempo: 4.0, side: 'L', lastPose: null, loopScale: 1, slot: 0 };
  out = out || [];
  for (const s of steps) {
    switch (s.type) {
      case 'tempo': ctx.tempo = parseFloat(s.duration) || 4.0; break;
      case 'music': out.push({ type: 'music', id: String(s.id), duration: 0 }); break;
      case 'dyn': out.push({ type: 'dyn', state: s.state, duration: 0 }); break;
      case 'move': {
        const mv = moveByName[s.name];
        const to = mv ? mv.toPose : null;
        out.push({ type: 'move', name: s.name, toPose: to, duration: ctx.tempo, side: ctx.side });
        if (to) ctx.lastPose = to;
        break;
      }
      case 'pose': {
        const raw = s.count;
        const side = s.side === 'left' ? 'L' : s.side === 'right' ? 'R' : ctx.side;
        let cnt = (raw !== undefined && raw !== null && raw !== '') ? parseFloat(raw) : null;
        if (cnt !== null && !isNaN(cnt) && cnt < 0) {
          const secs = Math.abs(cnt);
          out.push({ type: 'hold', pose: s.name, side, timed: true,
            count: Math.max(1, Math.round(secs / ctx.tempo)),
            phrase: s.phrase || 'none',
            audibleCount: s.audibleCount === 'true',
            duration: secs });
          ctx.lastPose = s.name;
        } else if (cnt !== null && !isNaN(cnt) && cnt > 0) {
          out.push({ type: 'hold', pose: s.name, side,
            count: cnt, phrase: s.phrase || 'none',
            audibleCount: s.audibleCount === 'true',
            duration: cnt * ctx.tempo });
          ctx.lastPose = s.name;
        } else {
          out.push({ type: 'pose', name: s.name, side, duration: ctx.tempo });
          ctx.lastPose = s.name;
        }
        break;
      }
      case 'hold': {
        let phrase = s.phrase || 'none';
        let c = s.count;
        if (typeof c === 'string' && c.indexOf(',') >= 0) {
          const arr = c.split(',').map(Number).filter(x => !isNaN(x));
          const slot = arr.length > 3 ? Math.min(ctx.slot != null ? ctx.slot : 0, arr.length - 1) : Math.min(level, arr.length - 1);
          c = arr[slot] || 5;
        } else if (c === 'variable') {
          c = 8;
          if (phrase === 'none') phrase = 'rest';
        } else {
          c = parseFloat(c) || 5;
        }
        out.push({ type: 'hold', pose: ctx.lastPose, side: ctx.side,
          count: c, phrase, audibleCount: s.audibleCount === 'true',
          duration: c * ctx.tempo });
        break;
      }
      case 'switchside':
        if (s.force === 'right') ctx.side = 'R';
        else if (s.force === 'left') ctx.side = 'L';
        else ctx.side = ctx.side === 'L' ? 'R' : 'L';
        out.push({ type: 'switchside', side: ctx.side, duration: 0 });
        break;
      case 'loop': {
        const arr = (s.count && s.count.length !== undefined) ? String(s.count).split(',').map(Number) : [1];
        const idx = arr.length > 3
          ? Math.min(ctx.slot != null ? ctx.slot : arr.length - 1, arr.length - 1)
          : Math.min(level, arr.length - 1);
        let times = arr[idx] || 0;
        times = Math.round(times * (ctx.loopScale || 1));
        for (let i = 0; i < times; i++) {
          const before = out.length;
          flattenSession(s.steps, level, ctx, out);
          for (let k = before; k < out.length; k++) out[k]._looped = true;
          if (s.switchside && i < times - 1) {
            ctx.side = ctx.side === 'L' ? 'R' : 'L';
            out.push({ type: 'switchside', side: ctx.side, duration: 0 });
          }
        }
        break;
      }
      case 'difficulty': {
        const pick = (s.levels && (s.levels[lvlKey] || s.levels[Object.keys(s.levels)[0]])) || [];
        flattenSession(pick, level, ctx, out);
        break;
      }
    }
  }
  return out;
}

const rawSteps = flattenSession(buildSteps(bodyEl.inner), +level, { tempo: 4.0, side: 'L', lastPose: null, loopScale: 1, slot: 0 }, []);
let est = 0, lastMusicIdx = -1;
rawSteps.forEach((s, i) => { est += s.duration || 0; if (s.type === 'music') lastMusicIdx = i; });
let cool = 0;
rawSteps.forEach((s, i) => { if (i > lastMusicIdx) cool += s.duration || 0; });
const target = Math.max(60, (+minutes) * 60);
const coolTarget = (+minutes) >= 60 ? 300 : (+minutes) >= 45 ? 240 : 180;
const coolFactor = cool > 0 ? Math.min(2, coolTarget / cool) : 1;
const mainTarget = Math.max(60, target - cool * coolFactor);
const mainRaw = Math.max(1, est - cool);
const loopScale = repBased ? 1 : Math.max(0.15, Math.min(12, mainTarget / mainRaw));
const out = Math.abs(loopScale - 1) > 0.02
  ? flattenSession(buildSteps(bodyEl.inner), +level, { tempo: 4.0, side: 'L', lastPose: null, loopScale, slot: 0 }, [])
  : rawSteps;

let totalSeconds = 0;
out.forEach(s => totalSeconds += s.duration || 0);

// ── pseudo Audio2 ──
const GAP = 0.12, MIN_GAP = 0.45;
let currentToken = 0;
let lastMoveBreath = 'none';
const visited = new Set();
let phraseCued = false;

function newStep() { currentToken++; }
function moveAudioCandidates(name, side) {
  const a = [];
  if (side === 'L') a.push('moves_' + name + '_l.ogg');
  if (side === 'R') a.push('moves_' + name + '_r.ogg');
  a.push('moves_' + name + '.ogg');
  a.push('moves_' + name + '_2.ogg');
  a.push('moves_' + name + '_2_' + (side === 'R' ? 'r' : 'l') + '.ogg');
  return a;
}
function hasRaw(f) { return AUDIO_DUR[f] != null; }

const allCues = []; // {t, file, dur, gap, step}

function teachPose(poseName, t) {
  if (!poseName || visited.has(poseName)) return;
  const p = poseByName[poseName];
  if (p && p.excludeTimeline) { visited.add(poseName); return; }
  visited.add(poseName);
  if (p) visited.add('base:' + (p.baseName || poseName));
  const base = (p?.baseName || poseName).toLowerCase().replace(/_/g, '_');
  // try ins / ins_2 / ins_3
  const cands = [
    'pose_instructions_' + base + '_ins.ogg',
    'pose_instructions_' + base + '_ins_2.ogg',
    'pose_instructions_' + base + '_ins_3.ogg',
    'pose_instructions_' + base + '_ins_4.ogg',
  ];
  const file = cands.find(hasRaw);
  if (file) allCues.push({ t, file, dur: AUDIO_DUR[file], gap: 0, step: { type: 'pose-instruction', pose: poseName } });
}

function cueStep(s, t) {
  switch (s.type) {
    case 'move': {
      const mv = moveByName[s.name];
      const key = (mv && mv.soundName) || s.name;
      lastMoveBreath = (mv && mv.breath) || 'none';
      const cands = moveAudioCandidates(key, s.side);
      const file = cands.find(hasRaw);
      if (file) {
        allCues.push({ t, file, dur: AUDIO_DUR[file], gap: 0, step: s });
      } else if (lastMoveBreath === 'exhale') {
        allCues.push({ t, file: 'general_exhale.ogg', dur: AUDIO_DUR['general_exhale.ogg'], gap: 0.2, step: s });
      } else if (lastMoveBreath === 'inhale') {
        allCues.push({ t, file: 'general_inhale.ogg', dur: AUDIO_DUR['general_inhale.ogg'], gap: 0.2, step: s });
      }
      break;
    }
    case 'pose': teachPose(s.name, t); break;
    case 'hold': if (s.pose) teachPose(s.pose, t); break;
  }
}

// Project every step onto the timeline. Mimic: advance() calls newStep() + cueStep(s)
// at the step's t0. tick() schedules per-breath cues inside holds.
let t = 0;
let firstHoldFired = new Set();
for (const s of out) {
  if (t > +horizon) break;
  if (s.type === 'music' || s.type === 'dyn' || s.type === 'switchside') { t += s.duration || 0; continue; }
  newStep();
  // mimic Player.advance: Audio2.newStep(); this.cueStep(s);
  cueStep(s, t);
  if (s.type === 'hold' && s.duration > 0 && s.count > 0) {
    const breathMs = (s.duration * 1000) / s.count;
    const startPhase = (lastMoveBreath === 'exhale') ? 1 : 0;
    for (let i = 0; i < s.count; i++) {
      const offsetSec = (i * breathMs) / 1000;
      if (i === 0) {
        // first breath fires immediately (line 765: idx=0, breathIdx was -1)
        if (s.audibleCount) {
          const n = i + 1;
          const file = 'numbers_number_' + n + '.ogg';
          if (hasRaw(file)) allCues.push({ t: t, file, dur: AUDIO_DUR[file], gap: 0.25, step: s });
        } else if (!s.timed) {
          const phase = lastMoveBreath
            ? (lastMoveBreath === 'exhale' ? 'exhale' : 'inhale')
            : ((i + startPhase) % 2 === 0 ? 'inhale' : 'exhale');
          const f = phase === 'inhale' ? 'general_inhale.ogg' : 'general_exhale.ogg';
          if (hasRaw(f)) allCues.push({ t: t, file: f, dur: AUDIO_DUR[f], gap: 0.2, step: s });
        }
        if (s.phrase && s.phrase !== 'none') {
          const map = { soften: 'general_soften.ogg', hold: 'general_hold.ogg', rest: 'general_rest.ogg' };
          const f = map[s.phrase];
          if (f && hasRaw(f)) allCues.push({ t: t, file: f, dur: AUDIO_DUR[f], gap: 0.6, step: s });
          phraseCued = true;
        }
      } else {
        const ts = t + offsetSec;
        if (ts > +horizon) break;
        if (s.audibleCount) {
          const n = i + 1;
          let file;
          if (n >= 1 && n <= 10) file = 'numbers_number_' + n + '.ogg';
          else if (n % 10 === 0 && n <= 100) file = 'numbers_number_' + n + '.ogg';
          else if (n % 2 === 0) file = 'general_inhale.ogg';
          else file = 'general_exhale.ogg';
          if (hasRaw(file)) allCues.push({ t: ts, file, dur: AUDIO_DUR[file], gap: 0.25, step: s });
        } else if (!s.timed) {
          const phase = ((i + startPhase) % 2 === 0) ? 'inhale' : 'exhale';
          const f = phase === 'inhale' ? 'general_inhale.ogg' : 'general_exhale.ogg';
          if (hasRaw(f)) allCues.push({ t: ts, file: f, dur: AUDIO_DUR[f], gap: 0.2, step: s });
        }
      }
    }
  }
  t += s.duration || 0;
}

// Apply minimum-gap intelligibility: if a cue's gap < MIN_GAP and the prior cue is short,
// push it forward.
allCues.sort((a, b) => a.t - b.t);
for (let i = 1; i < allCues.length; i++) {
  const prev = allCues[i - 1];
  const cur = allCues[i];
  if ((cur.t - prev.t) < MIN_GAP && (AUDIO_DUR[prev.file] || 0.6) < 1.2) {
    cur.t = prev.t + Math.max(MIN_GAP, cur.gap);
  }
}

// print
console.log(`# practice=${practice}  minutes=${minutes}  level=${level}  totalSeconds=${totalSeconds.toFixed(1)}  steps=${out.length}`);
console.log(`# loopScale=${loopScale.toFixed(3)}  coolTarget=${coolTarget}  repBased=${repBased}`);
console.log(`# file: ${allCues.length} cues scheduled in first ${horizon}s`);
console.log('');
console.log('   t(s)  | step                                              | file                                          | dur    gap');
console.log('   ------+---------------------------------------------------+-----------------------------------------------+-------------');
for (const c of allCues) {
  if (c.t > +horizon) break;
  const stepDesc = c.step.type === 'move'
    ? `move ${c.step.name}→${c.step.toPose} [${c.step.side}]`
    : c.step.type === 'hold'
      ? `hold ${c.step.pose} c=${c.step.count} aud=${c.step.audibleCount} ph=${c.step.phrase}`
      : c.step.type === 'pose'
        ? `pose ${c.step.name} [${c.step.side}]`
        : c.step.type === 'pose-instruction'
          ? `teach ${c.step.pose}`
          : `${c.step.type}`;
  const step = stepDesc.padEnd(49).slice(0, 49);
  const file = c.file.padEnd(45).slice(0, 45);
  console.log(`${c.t.toFixed(2).padStart(7)} | ${step} | ${file} | ${c.dur.toFixed(2)}s  (gap=${c.gap.toFixed(2)})`);
}

// overlap check
console.log('');
console.log('# OVERLAP CHECK (after gap enforcement)');
let overlaps = 0;
for (let i = 1; i < allCues.length; i++) {
  const prev = allCues[i - 1];
  const cur = allCues[i];
  if (cur.t > +horizon) break;
  if (cur.t < (prev.t + prev.dur)) {
    console.log(`  OVERLAP @${cur.t.toFixed(2)}s: prev=${prev.file} ends ${(prev.t + prev.dur).toFixed(2)} (start ${prev.t.toFixed(2)}), next=${cur.file} starts ${cur.t.toFixed(2)} — overlap ${(prev.t + prev.dur - cur.t).toFixed(2)}s`);
    overlaps++;
  }
}
if (!overlaps) console.log('  none detected');
