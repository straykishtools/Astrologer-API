/* ═══════════════════════════════════════════════════════════════
   SESSION ENGINE — faithful flatten of the .session XML semantics.

   Element semantics (Pocket Yoga session v2):
     tempo duration="4.0f"        → seconds per breath-count unit
     music id="0..3"              → ambient track switch marker
     dynamicstate state=          → silent | extrasilent | normal
     move name="a_to_b"           → one transition, 1 tempo long
     pose name / count / side     → entering a posture; count breaths
                                    (count="-60" = 60 seconds hold)
     hold count / phrase /        → staying; phrase cue soften|hold|rest;
       audibleCount                 audibleCount → speak breath numbers
     switchside [force]           → swap L/R (force="right|left")
     loop count="2,4,4"           → repetitions per difficulty level
       switchside="true"            (also swaps side between reps)
     difficulty><beginner|…>      → level-specific branch
     pose count="variable"        → app uses 8 breaths + rest cue

   Duration scaling: the app scales a 90-min master to the chosen
   duration by multiplying LOOP REPETITIONS (not step lengths), and
   keeps the final rest section intact. We implement exactly that.
   ═══════════════════════════════════════════════════════════════ */
'use strict';

const LEVEL_KEYS = ['beginner', 'intermediate', 'expert'];

/* Duration semantics differ by practice (faithful to the XML):
   • ocean/desert/mountain: <durations> = minutes (30/45/60);
     count="2,4,4" lists (3 entries) index by DIFFICULTY LEVEL and the
     duration is reached by repeating loops (loopScale).
   • sun_salutation_*: <durations type="repetitions"> = sun-salutation
     rounds (2,4,6,8,10,20,30,108); count lists have 8 entries indexed
     by the chosen REPETITION SLOT and loops run exactly that many
     times — the XML for that slot IS the session (loopScale = 1).
   level index (0/1/2) always keys <difficulty> branches.            */
function flattenSession(steps, level, ctx, out) {
  ctx = ctx || { tempo: 4.0, side: 'L', lastPose: null, loopScale: 1 };
  out = out || [];
  (steps || []).forEach(function (s) {
    switch (s.type) {
      case 'tempo':
        ctx.tempo = parseFloat(s.duration) || 4.0;
        break;
      case 'builtin': /* <music type="builtin" id="…"/> */
      case 'music':
        out.push({ type: 'music', id: String(s.id), duration: 0 });
        break;
      case 'dynamicstate':
        out.push({ type: 'dyn', state: s.state, duration: 0 });
        break;
      case 'move': {
        const mv = Data.moveByName[s.name];
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
          /* timed hold: count="-60" → 60 seconds */
          const secs = Math.abs(cnt);
          out.push({
            type: 'hold', pose: s.name, side, timed: true,
            count: Math.max(1, Math.round(secs / ctx.tempo)),
            phrase: s.phrase || 'none',
            audibleCount: s.audibleCount === 'true',
            duration: secs,
          });
          ctx.lastPose = s.name;
        } else if (cnt !== null && !isNaN(cnt) && cnt > 0) {
          out.push({
            type: 'hold', pose: s.name, side,
            count: cnt, phrase: s.phrase || 'none',
            audibleCount: s.audibleCount === 'true',
            duration: cnt * ctx.tempo,
          });
          ctx.lastPose = s.name;
        } else {
          /* plain pose = one transition into the posture */
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
          /* 3-entry lists → difficulty level · 8-entry lists (repetition
             sessions) → the chosen repetition slot */
          const slot = arr.length > 3
            ? Math.min(ctx.slot != null ? ctx.slot : 0, arr.length - 1)
            : Math.min(level, arr.length - 1);
          c = arr[slot] || 5;
        } else if (c === 'variable') {
          c = 8;
          if (phrase === 'none') phrase = 'rest';
        } else {
          c = parseFloat(c) || 5;
        }
        out.push({
          type: 'hold', pose: ctx.lastPose, side: ctx.side,
          count: c, phrase, audibleCount: s.audibleCount === 'true',
          duration: c * ctx.tempo,
        });
        break;
      }
      case 'switchside':
        if (s.force === 'right') ctx.side = 'R';
        else if (s.force === 'left') ctx.side = 'L';
        else ctx.side = (ctx.side === 'L') ? 'R' : 'L';
        out.push({ type: 'switchside', side: ctx.side, duration: 0 });
        break;
      case 'loop': {
        const arr = (s.count && s.count.length !== undefined) ? String(s.count).split(',').map(Number) : [1];
        /* 3-entry lists → difficulty level · 8-entry lists → repetition slot.
           count="0" at a slot means the loop is skipped for that choice. */
        const idx = arr.length > 3
          ? Math.min(ctx.slot != null ? ctx.slot : arr.length - 1, arr.length - 1)
          : Math.min(level, arr.length - 1);
        let times = arr[idx] || 0;
        times = Math.round(times * (ctx.loopScale || 1));
        for (let i = 0; i < times; i++) {
          /* tag steps emitted inside a loop so duration scaling can
             target the scalable flow and leave fixed warm-up/intro
             steps (whose audio anchors must not drift) untouched */
          const before = out.length;
          flattenSession(s.steps, level, ctx, out);
          for (let k = before; k < out.length; k++) out[k]._looped = true;
          if (s.switchside && i < times - 1) {
            ctx.side = (ctx.side === 'L') ? 'R' : 'L';
            out.push({ type: 'switchside', side: ctx.side, duration: 0 });
          }
        }
        break;
      }
      case 'difficulty': {
        const key = LEVEL_KEYS[level] || 'beginner';
        const pick = (s.levels && (s.levels[key] || s.levels[Object.keys(s.levels)[0]])) || [];
        flattenSession(pick, level, ctx, out);
        break;
      }
    }
  });
  return out;
}

/* Pass 1: raw estimate, find last music marker (final rest boundary).
   Pass 2: scale main flow by repeating loops so total ≈ target,
   final rest stretched to 3/4/5 min by duration (as the app does).
   For repetition-based sessions (sun salutations) the count lists are
   indexed by the repetition slot and loops repeat `reps` times 1:1 —
   no extra scaling needed: the raw XML with slot-selected counts IS
   the session for that choice. */
function resolveSession(session, level, durationIndex, targetMinutes) {
  const steps = session.body.steps;
  const repBased = session.body.repetitionBased === true;

  let ctx = { tempo: 4.0, side: 'L', lastPose: null, loopScale: 1, slot: durationIndex };
  const raw = flattenSession(steps, level, ctx, []);
  let est = 0, lastMusicIdx = -1;
  raw.forEach((s, i) => { est += s.duration || 0; if (s.type === 'music') lastMusicIdx = i; });
  let cool = 0;
  raw.forEach((s, i) => { if (i > lastMusicIdx) cool += s.duration || 0; });

  const target = Math.max(60, (targetMinutes || 30) * 60);
  /* Final rest section: 3 min (30') / 4 min (45') / 5 min (60') — so the
     last pose starts exactly at minute 27 / 41 / 55 (the app's formula). */
  const coolTarget = targetMinutes >= 60 ? 300 : targetMinutes >= 45 ? 240 : 180;
  const coolFactor = cool > 0 ? Math.min(2, coolTarget / cool) : 1;
  const mainTarget = Math.max(60, target - cool * coolFactor);
  const mainRaw = Math.max(1, est - cool);
  /* Repetition sessions run their loops exactly as chosen — the XML
     for that slot is already the right length. Minutes-based sessions
     repeat loops up to hit the target. */
  const loopScale = repBased ? 1 : Math.max(0.15, Math.min(12, mainTarget / mainRaw));

  ctx = { tempo: 4.0, side: 'L', lastPose: null, loopScale, slot: durationIndex };
  const out = Math.abs(loopScale - 1) > 0.02 ? flattenSession(steps, level, ctx, []) : raw;

  /* stretch/shrink the final rest to EXACTLY coolTarget so the boundary
     sits at target − coolTarget (27/41/55 min). Repetition-based sessions
     (sun salutations) are skipped entirely: for them the XML for the
     chosen slot IS the session — no rest stretching, no hold scaling. */
  let lm = -1;
  out.forEach((s, i) => { if (s.type === 'music') lm = i; });
  if (lm >= 0 && !repBased) {
    let coolNow = 0;
    out.forEach((s, i) => { if (i > lm) coolNow += s.duration || 0; });
    if (coolNow > 0) {
      const f = coolTarget / coolNow;
      out.forEach((s, i) => {
        if (i > lm && (s.duration || 0) > 0) s.duration = +(s.duration * f).toFixed(2);
      });
    }
    /* integer loop rounding leaves the main flow off target − coolTarget.
       Distribute the exact remainder across looped holds ONLY (≥2s each
       stay plausible) — fixed warm-up/intro steps must not be touched so
       the XML audio anchors (00:08 first audio, 00:20/00:44 exhale+next)
       stay exactly where the session defines them. */
    let mainNow = 0;
    out.forEach((s, i) => { if (i <= lm) mainNow += s.duration || 0; });
    const mainGoal = Math.max(60, target - coolTarget);
    const delta = mainGoal - mainNow;   /* seconds to add (can be negative) */
    if (Math.abs(delta) > 1) {
      const holds = out.filter((s, i) => i <= lm && s.type === 'hold' && s._looped && (s.duration || 0) >= 2);
      const holdTotal = holds.reduce((a, s) => a + s.duration, 0);
      if (holdTotal > 0) {
        const f = (holdTotal + delta) / holdTotal;
        if (f > 0.4 && f < 2.5) {
          out.forEach((s, i) => {
            if (i <= lm && s.type === 'hold' && s._looped && (s.duration || 0) >= 2) {
              s.duration = +(s.duration * f).toFixed(2);
            }
          });
        }
      }
    }
    /* snap the boundary EXACTLY: toFixed(2) per-hold rounding leaves a
       sub-second residual (e.g. 1619.93 vs 1620). Fold the residual into
       the last eligible (looped, ≥2s) hold so the final pose starts at
       exactly 27:00 / 41:00 / 55:00. */
    let mainNow2 = 0;
    out.forEach((s, i) => { if (i <= lm) mainNow2 += s.duration || 0; });
    const residual = +(mainGoal - mainNow2).toFixed(3);
    if (Math.abs(residual) > 0.001) {
      for (let i = lm; i >= 0; i--) {
        const s = out[i];
        if (s.type === 'hold' && s._looped && (s.duration || 0) >= 2) {
          s.duration = +(s.duration + residual).toFixed(2);
          break;
        }
      }
    }
    /* same for the final rest: per-hold rounding leaves it a few tenths
       off coolTarget. Fold that residual into the last rest step so the
       total lands EXACTLY on the chosen duration (30/45/60 min). */
    let restNow2 = 0;
    out.forEach((s, i) => { if (i > lm) restNow2 += s.duration || 0; });
    const restResidual = +(coolTarget - restNow2).toFixed(3);
    if (Math.abs(restResidual) > 0.001) {
      for (let i = out.length - 1; i > lm; i--) {
        const s = out[i];
        if ((s.duration || 0) > 0) {
          s.duration = +(s.duration + restResidual).toFixed(2);
          break;
        }
      }
    }
  }

  /* UI cards: a new card appears only when the body-state changes
     (move target / pose) — hold & switchside attach to current card */
  let ui = 0, lastKey = null;
  out.forEach(s => {
    let key = null;
    if (s.type === 'move') key = s.toPose || null;
    else if (s.type === 'pose') key = s.name;
    else if (s.type === 'hold' && s.pose && lastKey !== s.pose) key = s.pose;
    if (key != null) {
      const p = Data.poseByName[key];
      key = p ? p.name : String(key);
    }
    if (key != null && key !== lastKey) { lastKey = key; s.ui = ui++; }
    else s.ui = -1;
  });
  const cardDur = [];
  out.forEach(s => {
    if (s.ui >= 0) cardDur[s.ui] = (cardDur[s.ui] || 0) + (s.duration || 0);
    else if (cardDur.length && s.type !== 'music' && s.type !== 'dyn') cardDur[cardDur.length - 1] += (s.duration || 0);
  });

  let total = 0;
  out.forEach(s => { total += s.duration || 0; });
  /* start offset of every step (seconds) — lets the player jump its
     clock to the exact position of a step on skip/prev/next */
  let acc = 0;
  const starts = out.map(s => { const t = acc; acc += s.duration || 0; return t; });
  return { steps: out, totalSeconds: total || 1, cardDurations: cardDur, stepStarts: starts };
}

/* Calories — the app shows a kcal counter during practice.
   Metabolic rounding of ~3.5 kcal / minute for vinyasa-level flow. */
function caloriesFor(seconds) { return Math.round(seconds / 60 * 3.5); }

/* ── export to window for cross-script access (app.js) ── */
Object.assign(window, {
  flattenSession, resolveSession, caloriesFor, LEVEL_KEYS,
});
