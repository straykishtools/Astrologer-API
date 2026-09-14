/* ═══════════════════════════════════════════════════════════════
   DATA LAYER — parses the original resources directly, faithfully:
     static/yoga-data/resources/assets/practices.xml   → 5 practices
     static/yoga-data/resources/assets/{name}.session  → session v2 XML
     static/yoga-data/resources/assets/poses.xml       → pose dictionary
     static/yoga-data/resources/assets/moves.xml       → transitions
     static/yoga-data/resources/assets/backgrounds.xml → environments
     static/yoga-data/resources/res/values/strings.xml → app + pose texts
   The resources folder is referenced in place — zero transformation
   of style/color/font/structure: the web build just reads them.
   ═══════════════════════════════════════════════════════════════ */
'use strict';

const RES_BASE  = 'static/yoga-data/resources/';
const ASSETS    = RES_BASE + 'assets/';
const RES       = RES_BASE + 'res/';
const RAW       = RES + 'raw/';
const DRAW_MDPI = RES + 'drawable-mdpi/';
const DRAW_LG   = RES + 'drawable-large-mdpi/';
const DRAW_LG_X = RES + 'drawable-large-xhdpi/';

/* ── XML helpers ─────────────────────────────────────────────── */
function parseXML(text) {
  // strip // line comments (poses.xml & moves.xml use them) and
  // stray control chars that break DOMParser
  const clean = text.replace(/^\s*\/\/.*$/gm, '');
  return new DOMParser().parseFromString(clean, 'text/xml');
}
function fetchText(url) {
  return fetch(url, { cache: 'no-cache' }).then(r => {
    if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + url);
    return r.text();
  });
}

/* ── asset existence caches (HEAD probes, batched lazily) ────── */
const _existsCache = new Map();
function exists(url) {
  if (_existsCache.has(url)) return Promise.resolve(_existsCache.get(url));
  return fetch(url, { method: 'HEAD' }).then(r => {
    const ok = r.ok;
    _existsCache.set(url, ok);
    return ok;
  }).catch(() => { _existsCache.set(url, false); return false; });
}
/* sync variant fed by the preloaded inventory of raw/ + drawables */
const RAW_FILES = new Set();
const PNG_FILES = new Set();

/* ═══════════════════════════════════════════════════════════════
   Store (in-memory + localStorage persistence)
   ═══════════════════════════════════════════════════════════════ */
const LS = {
  karma: 'py_karma', history: 'py_history', unlocked: 'py_unlocked',
  current: 'py_current_bg', settings: 'py_settings',
};
function lsGet(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }
function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

const DB = {
  karma: lsGet(LS.karma, 0),
  history: lsGet(LS.history, []),
  unlocked: lsGet(LS.unlocked, ['Home', 'Studio', 'Office']),
  currentBg: lsGet(LS.current, 'Home'),
  settings: Object.assign({ voice: true, music: true, calories: true, breathFocus: false, envMode: 'light', envBrightness: 100 }, lsGet(LS.settings, {})),
  save() {
    lsSet(LS.karma, this.karma);
    lsSet(LS.history, this.history);
    lsSet(LS.unlocked, this.unlocked);
    lsSet(LS.current, this.currentBg);
    lsSet(LS.settings, this.settings);
  },
};

/* ═══════════════════════════════════════════════════════════════
   Parsed sources
   ═══════════════════════════════════════════════════════════════ */
const Data = {
  practices: [],      // [{name,title,description,style,durations,difficulties,pose,bg}]
  poses: [],          // [{name,baseName,sanskrit,difficulty,category,subcategory,twosided,offset,aka}]
  poseByName: {},
  moves: [],          // [{name,fromPose,toPose,breath}]
  moveByName: {},
  backgrounds: [],    // [{name,backgroundname,color,cost,locked,special}]
  strings: {},        // strings.xml flat map
};

/* ── poses.xml ───────────────────────────────────────────────── */
function parsePoses(xmlDoc) {
  const out = [];
  xmlDoc.querySelectorAll('poses > pose').forEach(p => {
    const rec = {
      name: p.getAttribute('name'),
      baseName: (p.querySelector('baseName') || {}).textContent || '',
      sanskrit: (p.querySelector('sanskritName') || {}).textContent || '',
      difficulty: (p.querySelector('difficulty') || {}).textContent || 'beginner',
      category: (p.querySelector('category') || {}).textContent || '',
      subcategory: (p.querySelector('subcategory') || {}).textContent || '',
      twosided: p.getAttribute('twosided') === 'true',
      offset: +(p.getAttribute('offset') || 0),
      aka: (p.querySelector('akaName') || {}).textContent || '',
      /* start/placeholder states excluded from teaching & timeline */
      excludeTimeline: p.getAttribute('excludefromtimeline') === 'true',
      excludeDict: p.getAttribute('excludefromdictionary') === 'true',
      /* the app plays <soundInstructionName> for guidance */
      soundInstruction: (p.querySelector('soundInstructionName') || {}).textContent || '',
    };
    out.push(rec);
  });
  return out;
}

/* ── moves.xml ─────────────────────────────────────────────────
   <soundName> overrides the voice file key (the app speaks the sound,
   not the move name); <breath> inhale|exhale|none tells which breath
   cue a no-voice move gets — both exactly as the original app does. */
function parseMoves(xmlDoc) {
  const out = [];
  xmlDoc.querySelectorAll('moves > move').forEach(m => {
    out.push({
      name: m.getAttribute('name'),
      fromPose: m.getAttribute('fromPose') || '',
      toPose: m.getAttribute('toPose') || '',
      breath: m.getAttribute('breath') || 'none',
      soundName: (m.querySelector('soundName') || {}).textContent || m.getAttribute('name'),
    });
  });
  return out;
}

/* ── practices.xml ───────────────────────────────────────────── */
function parsePractices(xmlDoc) {
  const out = [];
  xmlDoc.querySelectorAll('practices > practice').forEach(p => {
    out.push({ name: p.getAttribute('name'), locked: p.getAttribute('locked') === 'true', downloaded: p.getAttribute('downloaded') !== 'false' });
  });
  return out;
}

/* ── backgrounds.xml ─────────────────────────────────────────── */
function parseBackgrounds(xmlDoc) {
  const out = [];
  xmlDoc.querySelectorAll('backgrounds > background').forEach(b => {
    out.push({
      name: b.getAttribute('name'),
      backgroundname: b.getAttribute('backgroundname'),
      color: b.getAttribute('color'),
      cost: +(b.getAttribute('cost') || 0),
      special: b.getAttribute('special') === 'true',
      locked: b.getAttribute('locked') === 'true',
    });
  });
  return out;
}

/* ── strings.xml (default locale) ────────────────────────────── */
function parseStrings(xmlDoc) {
  const map = {};
  xmlDoc.querySelectorAll('string').forEach(s => { map[s.getAttribute('name')] = s.textContent || ''; });
  return map;
}

/* ── session v2 (assets/<name>.session) ──────────────────────── */
function parseSession(xmlDoc, fileName) {
  const root = xmlDoc.querySelector('session');
  if (!root) throw new Error('not a session file: ' + fileName);
  const head = root.querySelector('head');
  const body = root.querySelector('body');
  const headOut = {
    name: (head.querySelector('name') || {}).textContent || '',
    description: (head.querySelector('description') || {}).textContent || '',
    style: (head.querySelector('style') || {}).textContent || '',
    pose: null,
    durations: [], difficulties: [],
  };
  const hp = head.querySelector('pose');
  if (hp) headOut.pose = { name: hp.getAttribute('name'), side: hp.getAttribute('side') };
  head.querySelectorAll('durations > duration').forEach(d => headOut.durations.push(+d.getAttribute('value')));
  head.querySelectorAll('difficulties > difficulty').forEach(d => headOut.difficulties.push(+d.getAttribute('value')));
  /* <durations type="repetitions"> — sun salutations: values are rounds */
  const dEl = head.querySelector('durations');
  headOut.durationType = dEl ? (dEl.getAttribute('type') || 'minutes') : 'minutes';

  /* body → steps tree (keeps XML shape 1:1) */
  const steps = [];
  body.childNodes.forEach(node => {
    if (node.nodeType !== 1) return;
    steps.push(stepFromXML(node));
  });
  return {
    file: fileName,
    head: headOut,
    body: {
      preferredBackgroundName: body.getAttribute('preferredBackgroundName') || 'Home',
      repetitionBased: headOut.durationType === 'repetitions',
      steps,
    },
  };
}
function stepFromXML(el) {
  const s = { type: el.tagName };
  for (const a of el.attributes) s[a.name] = a.value;
  switch (el.tagName) {
    case 'move':
      s.name = el.getAttribute('name');
      break;
    case 'pose':
      s.name = el.getAttribute('name');
      if (el.getAttribute('side')) s.side = el.getAttribute('side');
      break;
    case 'hold':
      s.count = el.getAttribute('count');
      break;
    case 'tempo':
      s.duration = el.getAttribute('duration');
      break;
    case 'loop':
      s.count = el.getAttribute('count');
      s.switchside = el.getAttribute('switchside') === 'true';
      s.steps = [];
      el.childNodes.forEach(n => { if (n.nodeType === 1) s.steps.push(stepFromXML(n)); });
      break;
    case 'difficulty':
      s.levels = {};
      el.childNodes.forEach(n => {
        if (n.nodeType === 1) {
          const key = n.tagName; // beginner | intermediate | expert
          s.levels[key] = [];
          n.childNodes.forEach(c => { if (c.nodeType === 1) s.levels[key].push(stepFromXML(c)); });
        }
      });
      break;
    case 'music':
      s.type = 'builtin'; s.id = el.getAttribute('id');
      break;
    case 'dynamicstate':
      s.state = el.getAttribute('state');
      break;
  }
  return s;
}

/* ═══════════════════════════════════════════════════════════════
   Load everything
   ═══════════════════════════════════════════════════════════════ */
const DataReady = window.DataReady = (async function loadData() {
  /* raw/ inventory — one listing via fetch of the folder index is not
     possible on a static server, so we probe known prefixes with HEAD
     lazily through exists(); here we preload from the import manifest
     if present, else fall back to per-file HEAD (cached).          */
  const jobs = [];

  /* practices.xml first (names), then each session */
  const practicesDoc = parseXML(await fetchText(ASSETS + 'practices.xml'));
  Data.practices = parsePractices(practicesDoc);

  const poseNames = Data.practices.map(p => p.name);
  const sessionDocs = await Promise.all(poseNames.map(n => fetchText(ASSETS + n + '.session').catch(() => null)));
  sessionDocs.forEach((txt, i) => {
    if (!txt) return;
    try {
      const doc = parseXML(txt);
      const sess = parseSession(doc, poseNames[i]);
      const practice = Data.practices[i];
      practice.title = sess.head.name;
      practice.description = sess.head.description;
      practice.style = sess.head.style;
      practice.durations = sess.head.durations;
      practice.difficulties = sess.head.difficulties;
      practice.pose = sess.head.pose;
      practice.session = sess;
      practice.bg = sess.body.preferredBackgroundName;
      practice.steps = sess.body.steps;
    } catch (e) { console.warn('session parse failed', poseNames[i], e); }
  });

  /* poses + moves + backgrounds + strings */
  const [posesTxt, movesTxt, bgTxt, strTxt] = await Promise.all([
    fetchText(ASSETS + 'poses.xml'), fetchText(ASSETS + 'moves.xml'),
    fetchText(ASSETS + 'backgrounds.xml'), fetchText(RES + 'values/strings.xml'),
  ]);
  Data.poses = parsePoses(parseXML(posesTxt));
  Data.poses.forEach(p => { Data.poseByName[p.name] = p; });
  Data.moves = parseMoves(parseXML(movesTxt));
  Data.moves.forEach(m => { Data.moveByName[m.name] = m; });
  Data.backgrounds = parseBackgrounds(parseXML(bgTxt));
  Data.strings = parseStrings(parseXML(strTxt));

  return Data;
})();

/* ═══════════════════════════════════════════════════════════════
   Asset resolvers — paths exactly as the original app resolves
   ═══════════════════════════════════════════════════════════════ */
function bgKey(backgroundname) { return backgroundname; }           // l1_home …
/* tnstore thumbnails ship in drawable-mdpi / drawable-xhdpi only */
function bgUrl(backgroundname, variant) {
  const v = variant || 'full';
  if (v === 'tnstore') return DRAW_MDPI + 'bg_' + bgKey(backgroundname) + '_tnstore.jpg';
  const dir = v === 'x' ? DRAW_LG_X : DRAW_LG;
  return dir + 'bg_' + bgKey(backgroundname) + (v === 'tn' ? '_tn' : '') + '.jpg';
}
function bgImageUrl(name, variant) {
  const b = Data.backgrounds.find(x => x.name === name);
  return bgUrl(b ? b.backgroundname : 'l1_home', variant);
}
function poseSnake(name) {
  return String(name || '').trim().toLowerCase().replace(/[\s\-]+/g, '_');
}
/* pose art: drawable-large-mdpi/pose_<baseName>[_l|_r].png
   baseName keeps its XML case (warrior_II) — files are lowercase
   (pose_warrior_ii.png) so candidates include a lowercased variant. */
function posePngCandidates(poseName, side) {
  const p = Data.poseByName[poseName];
  const base = (p && p.baseName) || poseSnake(poseName);
  const bases = [base, base.toLowerCase()];
  const cands = [];
  for (const b of bases) {
    if (side === 'L' || side === 'R') cands.push('pose_' + b + '_' + side.toLowerCase() + '.png');
    cands.push('pose_' + b + '.png');
  }
  if (side === 'L') cands.push('pose_' + base.toLowerCase() + '_r.png');
  if (side === 'R') cands.push('pose_' + base.toLowerCase() + '_l.png');
  return cands.map(f => DRAW_LG + f);
}
const _posePngResolved = new Map();
function posePng(poseName, side) {
  const key = poseName + '|' + (side || 'N');
  if (_posePngResolved.has(key)) return Promise.resolve(_posePngResolved.get(key));
  const cands = posePngCandidates(poseName, side);
  return (async () => {
    for (const u of cands) { if (await exists(u)) { _posePngResolved.set(key, u); return u; } }
    _posePngResolved.set(key, '');
    return '';
  })();
}
const _posePngSync = new Map();
function posePngSync(poseName, side) {
  const key = poseName + '|' + (side || 'N');
  if (_posePngSync.has(key)) return _posePngSync.get(key);
  const cands = posePngCandidates(poseName, side);
  for (const u of cands) { if (PNG_FILES.has(u.slice(DRAW_LG.length))) { _posePngSync.set(key, u); return u; } }
  _posePngSync.set(key, '');
  return '';
}

/* audio: res/raw/<key>.ogg — side-aware candidate list (app order:
   _l/_r specific → plain → _2 variant)                             */
function moveAudioCandidates(moveName, side) {
  const out = [];
  if (side === 'L') out.push('moves_' + moveName + '_l.ogg');
  if (side === 'R') out.push('moves_' + moveName + '_r.ogg');
  out.push('moves_' + moveName + '.ogg');
  out.push('moves_' + moveName + '_2.ogg');
  out.push('moves_' + moveName + '_2_' + (side === 'R' ? 'r' : 'l') + '.ogg');
  return out;
}
function rawUrl(f) {
  /* served via /yoga-cue/ endpoint (inline Content-Disposition) so
     download managers don't intercept the ogg links. The endpoint
     matches [a-z0-9_]+ keys WITHOUT the .ogg extension and appends
     it itself — strip it here or every cue 404s. */
  const key = String(f || '').replace(/\.ogg$/i, '');
  return '/yoga-cue/' + encodeURIComponent(key);
}
function hasRaw(f) { return RAW_FILES.has(f); }
/* audio keys are all-lowercase snake (warrior_II → warrior_ii).
   The app plays <soundInstructionName> when present (child_wide_INS),
   falling back to the baseName-derived key; probe every shipped variant. */
function poseInstructionCandidates(poseName) {
  const p = Data.poseByName[poseName];
  const base = String((p && p.baseName) || poseSnake(poseName)).toLowerCase();
  const out = [];
  /* the XML's explicit instruction key wins — preserves case-insensitive
     probe order with the shipped lowercase files */
  if (p && p.soundInstruction) {
    const si = String(p.soundInstruction).toLowerCase();
    out.push('pose_instructions_' + si + '.ogg');
    ['_2', '_3', '_4'].forEach(s => {
      out.push('pose_instructions_' + si + s + '.ogg');
      out.push('pose_instructions_' + si + s + '_l.ogg');
      out.push('pose_instructions_' + si + s + '_r.ogg');
    });
    out.push('pose_instructions_' + si + '_l.ogg');
    out.push('pose_instructions_' + si + '_r.ogg');
  }
  ['pose_instructions_' + base + '_ins'].forEach(k => {
    out.push(k + '.ogg');
    ['_2', '_3', '_4'].forEach(s => {
      out.push(k + s + '.ogg');
      out.push(k + s + '_l.ogg');
      out.push(k + s + '_r.ogg');
    });
    out.push(k + '_l.ogg');
    out.push(k + '_r.ogg');
  });
  return out;
}
function poseNameCandidates(poseName) {
  const p = Data.poseByName[poseName];
  const base = String((p && p.baseName) || poseSnake(poseName)).toLowerCase();
  return ['pose_names_py_' + base + '.ogg'];
}

/* strings helpers — keys keep the XML baseName verbatim (mixed case,
   e.g. pose_warrior_II_description) with a snake fallback */
function stringCandidates(keyFmt, poseName) {
  const p = Data.poseByName[poseName];
  const out = [];
  if (p && p.baseName) out.push(keyFmt.replace('%s', p.baseName));
  out.push(keyFmt.replace('%s', poseSnake(poseName)));
  return out;
}
function S(key, fallback) { return Data.strings[key] || fallback || ''; }
function poseDescription(poseName) {
  for (const k of stringCandidates('pose_%s_description', poseName)) {
    const v = Data.strings[k];
    if (v) return v;
  }
  return '';
}
function poseBenefits(poseName) {
  for (const k of stringCandidates('pose_%s_benefits', poseName)) {
    const v = Data.strings[k];
    if (v) return v;
  }
  return '';
}
function poseAka(poseName) {
  for (const k of stringCandidates('pose_%s_aka', poseName)) {
    const v = Data.strings[k];
    if (v) return v;
  }
  return '';
}

/* categorised labels (app strings) */
const DIFF_LABEL = { beginner: 'مبتدی', intermediate: 'متوسط', expert: 'پیشرفته' };
const DIFF_LEVEL_FA = null;

/* ═══════════════════════════════════════════════════════════════
   Persian layer — static/yoga.txt (yoga_importer output) carries
   name_fa / description_fa / benefits_fa / aka_fa for 542 poses.
   Matching: poses.xml baseName (warrior_II) ↔ yoga.txt name
   (Warrior II) — compare via lowercase snake of both, plus
   display_name matching for the few renames.
   ═══════════════════════════════════════════════════════════════ */
const FA_TXT = { byKey: {}, byAlnum: {}, byFa: {}, };
function faKey(n) { return String(n || '').trim().toLowerCase().replace(/[\s\-]+/g, '_'); }
/* yoga.txt keys are camelCase (ChildWide) while poses.xml baseNames
   are snake_case (child_wide) — compare both, separator-free. Only
   unambiguous alnum keys are indexed so e.g. Cobra/CobraFull (whose
   display_name collides) can't cross-match. ZWNJ (U+200C) is stripped
   because Persian texts use it inconsistently. */
function faAlnum(n) { return String(n || '').trim().toLowerCase().replace(/[\s\-_\u200c\u200b]+/g, ''); }
async function loadFaTexts() {
  try {
    const list = await fetch('static/yoga.txt', { cache: 'no-cache' }).then(r => r.ok ? r.json() : []);
    /* Name-first priority: a record's own `name` is authoritative and must
       beat another record's `display_name`. The collision families are all
       "base pose vs variant whose display_name = base name" (CobraFull
       displays as "Cobra", TreePrayer as "Tree", ...) — last-wins made the
       base pose resolve to the variant record. display_names only fill keys
       no record-name claims, so variants never shadow their base. */
    const nameKeys = new Map();
    const seen = new Map();
    list.forEach(p => {
      if (!p.name) return;
      nameKeys.set(faKey(p.name), p);
      const a = faAlnum(p.name);
      if (!seen.has(a)) seen.set(a, p);
      else if (seen.get(a) !== p) seen.set(a, null);
    });
    list.forEach(p => {
      if (!p.display_name || p.display_name === p.name) return;
      const k = faKey(p.display_name);
      if (!nameKeys.has(k)) nameKeys.set(k, p);
      const a = faAlnum(p.display_name);
      if (!seen.has(a)) seen.set(a, p);
      else if (seen.get(a) !== p) seen.set(a, null);
    });
    FA_TXT.byKey = Object.fromEntries(nameKeys);
    FA_TXT.byAlnum = {};
    seen.forEach((v, k) => { if (v) FA_TXT.byAlnum[k] = v; });
    /* FA-name index for //ref// links: Persian descriptions reference poses
       by their Persian names, so index name_fa / display_name_fa / aka_fa.
       Name-first (same rule as byKey): a record's own name_fa beats another
       record's display_name_fa/aka_fa, so e.g. 'کبری' resolves to Cobra
       instead of being nulled because CobraFull also displays as 'کبری'. */
    const faSeen = new Map();
    list.forEach(p => {
      if (!p.name_fa) return;
      const k = faAlnum(p.name_fa);
      if (!faSeen.has(k)) faSeen.set(k, p);
      else if (faSeen.get(k) !== p) faSeen.set(k, null);
    });
    /* display_name_fa / aka_fa only fill keys that no name_fa claimed —
       a base record's own name_fa is never nulled by a variant's display
       or aka (e.g. DownwardDog aka 'کوه' must not kill Mountain's claim).
       Mutual conflicts among display/aka claims themselves still null. */
    const faAlt = new Map();
    list.forEach(p => {
      for (const n of [p.display_name_fa, ...(p.aka_fa || [])]) {
        if (!n) continue;
        const k = faAlnum(n);
        if (faSeen.has(k)) continue;
        const prev = faAlt.get(k);
        if (!faAlt.has(k)) faAlt.set(k, p);
        else if (prev !== p) faAlt.set(k, null);
      }
    });
    faAlt.forEach((v, k) => { if (v) faSeen.set(k, v); });
    FA_TXT.byFa = {};
    faSeen.forEach((v, k) => { if (v) FA_TXT.byFa[k] = v; });
  } catch (e) { console.warn('yoga.txt (fa) load failed', e); }
}
/* Resolve a //ref// inside a description — English name/display first,
   then the Persian-name index. Returns the yoga.txt record or null. */
function faPoseRef(ref) {
  if (!ref) return null;
  return FA_TXT.byKey[faKey(ref)] || FA_TXT.byAlnum[faAlnum(ref)] || FA_TXT.byFa[faAlnum(ref)] || null;
}
function faPose(poseName) {
  if (!poseName) return null;
  const p = Data.poseByName[poseName];
  if (p && p.baseName) {
    const hit = FA_TXT.byKey[faKey(p.baseName)] || FA_TXT.byAlnum[faAlnum(p.baseName)];
    if (hit) return hit;
  }
  return FA_TXT.byKey[faKey(poseName)] || FA_TXT.byAlnum[faAlnum(poseName)] || null;
}
function poseNameFa(poseName) {
  const hit = faPose(poseName);
  return (hit && (hit.display_name_fa || hit.name_fa)) || '';
}
function poseSanskritFa(poseName) { return ''; }
function poseDescriptionFa(poseName) {
  const hit = faPose(poseName);
  return (hit && hit.description_fa) || '';
}
function poseBenefitsFa(poseName) {
  const hit = faPose(poseName);
  return (hit && hit.benefits_fa) || '';
}
function poseAkaFa(poseName) {
  const hit = faPose(poseName);
  return (hit && hit.aka_fa && hit.aka_fa.join('، ')) || '';
}

/* ── FA coverage guard ─────────────────────────────────────────
   After poses.xml + yoga.txt are both loaded, walk every pose in
   the dictionary and log any that has no matching Persian record.
   Keeps the 100% coverage from silently regressing when someone
   adds a pose to poses.xml but forgets the yoga.txt counterpart.
   Call once after `await Promise.all([DataReady, loadFaTexts()])`.
   Returns the count of unmatched poses (0 = full coverage). */
function validateFaCoverage() {
  const missingPoses = [];
  (Data.poses || []).forEach(p => {
    const hit = faPose(p.name);
    if (!hit || (!hit.name_fa && !hit.display_name_fa)) {
      missingPoses.push({ name: p.name, baseName: p.baseName || '' });
      console.warn('[yoga-classic] FA record missing for pose: ' + p.name
        + ' (baseName=' + (p.baseName || '') + ')');
    }
  });
  if (missingPoses.length > 0) {
    console.warn('[yoga-classic] FA coverage: ' + (Data.poses.length - missingPoses.length) + '/' + Data.poses.length
      + ' poses have Persian records (' + missingPoses.length + ' missing)');
  } else {
    console.log('[yoga-classic] FA coverage: ' + Data.poses.length + '/' + Data.poses.length
      + ' poses have Persian records');
  }
  return missingPoses;   // [] = full coverage; otherwise [{name, baseName}] for the banner
}

/* Persian UI strings — app chrome */
const FA_UI = {
  appName: 'یوگای جیبی',
  karma: 'کارما', history: 'تاریخچه', preview: 'پیش‌نمایش', settings: 'تنظیمات', about: 'درباره',
  poses: 'حرکات',
  practice: 'تمرین', practices: 'تمرین‌ها', date: 'تاریخ', duration: 'مدت', difficulty: 'درجه سختی',
  durationLabel: 'مدت جلسه:', difficultyLabel: 'درجه سختی:', environmentLabel: 'محیط:',
  startPractice: 'شروع تمرین',
  karmaHint: 'هر ۱۵ دقیقه تمرین = ۱ امتیاز کارما',
  minutes: 'دقیقه', repsUnit: 'دور',
  begin: 'مبتدی', intermediate: 'متوسط', expert: 'پیشرفته',
  store: 'فروشگاه', backgrounds: 'پس‌زمینه‌ها',
  owned: 'داری', locked: 'قفل', unlockFor: 'باز کردن', select: 'انتخاب',
  notEnoughKarma: 'کارما کافی نداری',
  totalKarma: 'مجموع امتیاز کارما',
  karmaDesc: 'با تمرین یوگا امتیاز کارما می‌گیری. هر ۱۵ دقیقه تمرین ۱ امتیاز کارما است. می‌توانی امتیازها را در فروشگاه خرج باز کردن محیط‌های جدید کنی.',
  stats: 'آمار', all: 'همه', lastWeek: 'هفته گذشته', lastMonth: 'ماه گذشته',
  completedPractices: 'تمرین‌های انجام‌شده',
  time: 'زمان', noHistory: 'هنوز تمرینی ثبت نشده',
  altName: 'نام دیگر:', category: 'دسته:', benefits: 'مزایا:', description: 'توضیحات:',
  voice: 'راهنمای صوتی', music: 'موسیقی', showCalories: 'نمایش کالری',
  voiceHint: 'صدای راهنمای تمرین', musicHint: 'موسیقی پس‌زمینه', caloriesHint: 'نمایش کالری مصرفی حین تمرین',
  youCompleted: 'تمرینت کامل شد!', practiceEnded: 'تمرین به پایان رسید.',
  caloriesBurned: 'کالری سوزانده‌شده', karmaEarned: 'امتیاز کارما کسب‌شده', totalKarmaPoints: 'مجموع امتیاز کارما',
  share: 'همرسانی', done: 'پایان',
  quitConfirm: 'تمرین نیمه‌کاره رها شود؟',
  envSet: 'محیط فعلی:',
  transition: 'انتقال', soften: 'نرم‌شو…', holdCue: 'نگه‌دار…', restCue: 'استراحت…',
  faDigits: '۰۱۲۳۴۵۶۷۸۹',
};
const PRACTICE_FA = {
  ocean: { title: 'اقیانوس', style: 'وینیاسا', desc: 'تمرینی پویا و پرانرژی با موج‌های جریان وینیاسا، نگه‌داشتن‌های قدرتی و حرکات بازکننده — کاملاً هماهنگ با تنفس. «موج خودت را پیدا کن و سوارش شو تا رهایی ذهن و بدن و روح…»' },
  desert: { title: 'کویر', style: 'هاتا', desc: 'تمرینی آرام با تمرکز بر باز کردن قفسه سینه، افزایش انعطاف‌پذیری و رها کردن تنش‌های بدن و ذهن — مناسب پایان روز و آرام‌سازی عمیق. «در کویر، فضا داری که باز شوی، رها شوی، روی زمین کویر پهن شوی و شفا بگیری.»' },
  mountain: { title: 'کوه', style: 'پاور', desc: 'تمرینی قدرتی برای تقویت بدن و ذهن با نظم و انضباط — توالی‌های منظم ایستاده و تعادلی برای کسانی که چالش می‌خواهند. «تمرینت آنجا شروع می‌شود که می‌خواهی از حرکت بیایی پایین.»' },
  sun_salutation_a: { title: 'سلام خورشید A', style: 'کلاسیک', desc: 'توالی کلاسیک سلام خورشید (سوریا ناماسکارا) برای گرم کردن بدن و هماهنگی تنفس با حرکت — بهترین شروع برای هر جلسه‌ای.' },
  sun_salutation_b: { title: 'سلام خورشید B', style: 'کلاسیک', desc: 'نسخه‌ی پویاتر سلام خورشید با حرکات جنگجو — برای قدرت، استقامت و گرمای عمیق در کل بدن.' },
};
function faNum(n) {
  return String(n == null ? '' : n).replace(/\d/g, d => FA_UI.faDigits[+d]);
}
function faTime(sec) {
  sec = Math.max(0, Math.round(sec));
  const m = Math.floor(sec / 60), s = sec % 60;
  return faNum(m) + ':' + String(s).padStart(2, '0').replace(/\d/g, d => FA_UI.faDigits[+d]);
}

/* ── export to window for cross-script access (engine/audio/app) ── */
Object.assign(window, {
  Data, DataReady, DB, LS, RAW_FILES, PNG_FILES, _existsCache,
  RES_BASE, ASSETS, RES, RAW, DRAW_MDPI, DRAW_LG, DRAW_LG_X,
  parseXML, fetchText, exists, bgUrl, bgImageUrl, poseSnake,
  posePngCandidates, posePng, posePngSync,
  moveAudioCandidates, rawUrl, hasRaw,
  poseInstructionCandidates, poseNameCandidates,
  S, poseDescription, poseBenefits, poseAka, DIFF_LABEL,
  parseSession, parsePoses, parseMoves, parsePractices, parseBackgrounds, parseStrings,
  loadFaTexts, faPose, faPoseRef, poseNameFa, poseDescriptionFa, poseBenefitsFa, poseAkaFa,
  validateFaCoverage,
  FA_UI, FA_TXT, PRACTICE_FA, faNum, faTime,
});
