/* ═══════════════════════════════════════════════════════════════
   POCKET YOGA — WEB APP (Persian UI, desktop-first player)
   Screens follow res/layout/*.xml; texts are Persian:
     - pose names/descriptions/benefits from static/yoga.txt
     - practice names/descs from PRACTICE_FA (data.js)
     - chrome strings from FA_UI (data.js)
   ═══════════════════════════════════════════════════════════════ */
'use strict';

/* ── raw inventory bootstrap ──────────────────────────────────── */
(async function bootstrapInventory() {
  try {
    const r = await fetch('static/yoga-classic/inventory.json', { cache: 'no-cache' });
    if (r.ok) {
      const inv = await r.json();
      (inv.raw || []).forEach(f => RAW_FILES.add(f));
      (inv.png || []).forEach(f => PNG_FILES.add(f));
    }
  } catch (e) { /* lazy probing covers it */ }
})();

/* ── tiny helpers ─────────────────────────────────────────────── */
const $ = id => document.getElementById(id);
function fmtSec(sec) {
  sec = Math.max(0, Math.round(sec));
  const m = Math.floor(sec / 60), s = sec % 60;
  return (m < 10 ? '0' + m : m) + ':' + (s < 10 ? '0' + s : s);
}
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function faDate(ts) {
  try { return new Date(ts).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' }); }
  catch (e) { return faNum(Math.floor(ts / 86400000)); }
}
function faDateTime(ts) {
  try { return new Date(ts).toLocaleString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  catch (e) { return faNum(ts); }
}
let toastT = null;
function toast(msg) {
  const el = $('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastT);
  toastT = setTimeout(() => el.classList.remove('show'), 2400);
}

/* ── screens ──────────────────────────────────────────────────── */
function currentScreenId() {
  const cur = document.querySelector('.screen.show');
  return cur ? cur.id : '';
}
/* floating glass side nav: خانه · تمرین‌ها · پروفایل · تنظیمات
   — active state syncs with the visible screen; hidden during a
     live session (the player owns the screen) and on the splash. */
function sessionLive() { return typeof Player !== 'undefined' && !!Player.live; }
function syncSideNav() {
  const nav = document.getElementById('sideNav');
  if (!nav) return;
  const id = currentScreenId();
  /* hidden only on splash & post-session; inside the live practice it
     docks as a compact icon rail at the top-left (reference layout) */
  const chromeOnly = (id === 'scr-splash' || id === 'scr-post');
  nav.classList.toggle('hide', chromeOnly);
  nav.classList.toggle('compact', id === 'scr-yoga');
  let active = 'home';
  if (id === 'scr-preview' || id === 'scr-poses' || id === 'scr-store' || id === 'scr-history' || id === 'scr-history-detail') active = 'practices';
  else if (id === 'scr-settings') active = 'settings';
  nav.querySelectorAll('.sn-item').forEach(b => b.classList.toggle('on', b.dataset.nav === active));
  /* «بازگشت به تمرین» pill — visible while a session is alive but the
     user is on another screen */
  const pill = $('resumePractice');
  if (pill) pill.hidden = !(sessionLive() && id !== 'scr-yoga');
  /* action rail — بستن استودیو / منوی یوگا / شروع دوباره
     · hidden on splash & post & home-lobby? No — visible everywhere
       except splash; in the player it docks left-center (body.in-player)
     · «منوی یوگا» + «شروع دوباره» only apply while a session is live
     · «بستن استودیو» only when embedded in the cosmic parent app */
  const rail = document.getElementById('actionRail');
  if (rail) {
    const live = sessionLive();
    const cosmic = inCosmicIframe();
    const q = $('uiQuit'), r = $('btnRestart'), cs = $('uiCloseStudio');
    if (q) q.hidden = !live;
    if (r) r.hidden = !live;
    if (cs) cs.hidden = !cosmic;
    /* empty rail looks broken — hide the whole panel when nothing applies */
    const railEmpty = (id === 'scr-splash' || id === 'scr-post') || (!live && !cosmic);
    rail.hidden = railEmpty;
    /* on chrome screens the appbar's back button sits at the top-right —
       shift it aside while the rail covers that corner */
    document.body.classList.toggle('rail-on', !railEmpty && id !== 'scr-yoga');
  }
  document.body.classList.toggle('in-player', id === 'scr-yoga');
}
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('show'));
  $(id).classList.add('show');
  syncSideNav();
}
function initSideNav() {
  const nav = document.getElementById('sideNav');
  if (!nav) return;
  const pill = $('resumePractice');
  if (pill) pill.onclick = () => showScreen('scr-yoga');
  nav.querySelectorAll('.sn-item').forEach(b => {
    b.onclick = () => {
      const n = b.dataset.nav;
      /* حین جلسه فعال: بقیه گزینه‌ها تمرین را قطع نمی‌کنند؛
         فقط «خانه» می‌پرسد و بعد جلسه را می‌بندد. بقیه صفحه را
         باز می‌کنند ولی جلسه زنده می‌ماند و با پیل «بازگشت» برمی‌گردی. */
      if (sessionLive() && n !== 'home') {
        if (!Player.paused && Player.running) Player.pause();   /* سکوت حین مرور */
      }
      if (n === 'home') {
        if (sessionLive() && !confirm(FA_UI.quitConfirm)) return;
        if (sessionLive()) { Player._quitToLobby = true; Player.stop(false); }
        showScreen('scr-home'); Home.go(Home.idx, true);
      }
      else if (n === 'practices') Poses.open();      /* کتابخانه حرکات/جلسات */
      else if (n === 'profile') History.open();      /* آمار و تاریخچه کاربر */
      else if (n === 'settings') Settings.open();
    };
  });
}
function currentBgName() { return DB.currentBg; }
function currentBgImage() { return 'url("' + bgImageUrl(currentBgName(), 'x') + '")'; }
function applyBackground(name) {
  DB.currentBg = name;
  DB.save();
  document.querySelectorAll('.bgview').forEach(b => {
    b.style.backgroundImage = 'url("' + bgImageUrl(name, 'x') + '")';
  });
  const yb = $('yogaBackground');
  if (yb) yb.style.backgroundImage = 'url("' + bgImageUrl(name, 'x') + '")';
  /* wave divider tint per environment (header → scene transition) */
  const waves = {
    Home: 'rgba(158,163,178,.45)', Studio: 'rgba(158,148,170,.45)', Office: 'rgba(120,150,170,.45)',
    Ocean: 'rgba(70,140,190,.5)', Desert: 'rgba(214,164,102,.55)', Mountain: 'rgba(120,140,120,.5)',
    Dojo: 'rgba(120,60,55,.5)', Temple: 'rgba(150,90,80,.5)', Palace: 'rgba(160,120,80,.5)',
    Shiva: 'rgba(90,120,60,.45)', Vishnu: 'rgba(150,100,55,.5)', Buddha: 'rgba(90,140,100,.45)',
    'Samādhi': 'rgba(90,90,120,.45)',
  };
  document.documentElement.style.setProperty('--env-wave', waves[name] || 'rgba(255,255,255,.3)');
}

/* ═══════════════════════════════════════════════════════════════
   HOME (home.xml) — ViewPager of practices + SplitToolbar
   ═══════════════════════════════════════════════════════════════ */
const Home = {
  idx: 0,
  init() {
    const items = [
      { icon: 'ui_karmabutton.png', label: FA_UI.karma, act: () => Store.open('karma') },
      { icon: 'ui_historybutton.png', label: FA_UI.history, act: () => History.open() },
      { icon: 'ui_previewbutton.png', label: FA_UI.preview, act: () => Preview.open(Home.current()) },
      { icon: 'ui_settingsbutton.png', label: FA_UI.settings, act: () => Settings.open() },
      { icon: 'ui_infobutton.png', label: FA_UI.about, act: () => About.open() },
    ];
    $('homeToolbar').innerHTML = items.map((it, i) =>
      '<button class="st-btn" data-i="' + i + '"><img src="' + DRAW_MDPI + it.icon + '" alt=""><span>' + esc(it.label) + '</span></button>'
    ).join('');
    $('homeToolbar').querySelectorAll('.st-btn').forEach(b => {
      b.onclick = () => items[+b.dataset.i].act();
    });
    $('homeKarma').textContent = faNum(DB.karma);
    $('homePrev').onclick = () => this.go(this.idx - 1);
    $('homeNext').onclick = () => this.go(this.idx + 1);
    this.renderCards();
    this.bindPager();
    this.renderNav();
  },
  current() { return Data.practices[this.idx] || Data.practices[0]; },
  renderCards() {
    const track = $('pagerTrack');
    track.innerHTML = '';
    const ind = $('indicator');
    ind.innerHTML = '';
    Data.practices.forEach((p, i) => {
      const fa = PRACTICE_FA[p.name] || {};
      const card = document.createElement('div');
      card.className = 'practice-card';
      /* real-size transparent pose art — no frame, no clipping.
         Dimmed neighbor previews flank the pose; click one to jump. */
      const img = posePngSync(p.pose ? p.pose.name : '', p.pose ? (p.pose.side === 'right' ? 'R' : 'L') : 'N');
      const nb = (j) => {
        if (j < 0 || j >= Data.practices.length) return '<div class="pc-side empty"></div>';
        const q = Data.practices[j];
        const qf = PRACTICE_FA[q.name] || {};
        const qimg = posePngSync(q.pose ? q.pose.name : '', q.pose ? (q.pose.side === 'right' ? 'R' : 'L') : 'N');
        return '<div class="pc-side" data-jump="' + j + '">' +
          (qimg ? '<img src="' + esc(qimg) + '" alt="">' : '') +
          '<span class="pc-tag">' + esc(qf.title || q.title || q.name) + '</span></div>';
      };
      /* name + sub box first, image last — the box renders above the pose */
      card.innerHTML =
        '<div class="pc-name">' + esc(fa.title || p.title || p.name) + '</div>' +
        '<div class="pc-sub">' + esc((fa.style || p.style || '') + ' · ' + faNum((p.durations || [])[0] || 30) + ' ' + FA_UI.minutes) + '</div>' +
        '<div class="pc-row">' + nb(i - 1) + (img ? '<img class="pc-img" src="' + esc(img) + '" alt="">' : '') + nb(i + 1) + '</div>';
      /* clicking the pose opens the inline options form; clicking a
         dimmed neighbor preview jumps straight to that practice */
      card.onclick = (e) => {
        const jump = e.target.closest('.pc-side');
        if (jump && jump.dataset.jump != null) { this.go(+jump.dataset.jump); return; }
        if (e.target.closest('.pc-img') || e.target === card) Options.open(p);
      };
      track.appendChild(card);
      const d = document.createElement('div');
      d.className = 'dot' + (i === this.idx ? ' on' : '');
      d.onclick = () => this.go(i);
      ind.appendChild(d);
    });
    this.go(this.idx, true);
  },
  fillDetail() {
    const p = this.current();
    if (!p) return;
    const fa = PRACTICE_FA[p.name] || {};
    $('pd2Title').textContent = 'تمرین ' + (fa.title || p.title || p.name);
    $('pd2Style').textContent = fa.style || p.style || '—';
    const dl = [FA_UI.begin, FA_UI.intermediate, FA_UI.expert];
    $('pd2Diff').textContent = (p.difficulties || [0, 1, 2]).map(d => dl[d]).join('، ');
    $('pd2Durs').textContent = (p.durations || []).map(d => faNum(d)).join('، ') + ' ' + FA_UI.minutes;
    /* count flattened steps once */
    const steps = flattenSession(p.steps, 0, { tempo: 4, side: 'L', lastPose: null, loopScale: 1, slot: 0 }, []);
    $('pd2Steps').textContent = faNum(steps.filter(s => s.type === 'move' || s.type === 'pose' || s.type === 'hold').length);
    $('pd2Desc').textContent = (fa.desc || p.description || '').slice(0, 160) + ((fa.desc || p.description || '').length > 160 ? '…' : '');
  },
  go(i, instant) {
    const track = $('pagerTrack');
    const n = Data.practices.length;
    this.idx = Math.max(0, Math.min(n - 1, i));
    if (instant) track.classList.add('no-anim');
    /* RTL pager: cards laid right→left; translate X positive moves view */
    track.style.transform = 'translateX(' + (this.idx * 100) + '%)';
    if (instant) requestAnimationFrame(() => track.classList.remove('no-anim'));
    /* subtle re-entrance for the name box on practice change */
    const cur = track.children[this.idx];
    if (cur && !instant) {
      cur.querySelectorAll('.pc-name,.pc-sub').forEach(el => {
        el.classList.remove('swap'); void el.offsetWidth; el.classList.add('swap');
      });
    }
    $('indicator').querySelectorAll('.dot').forEach((d, j) => d.classList.toggle('on', j === this.idx));
    const p = this.current();
    if (p && p.bg) applyBackground(p.bg);
    this.fillDetail();
    this.renderNav();
  },
  /* nav pills show the NEIGHBOR practice's name; hidden at the ends.
     RTL: right pill = previous (arrow mirrored →right),
          left pill  = next (arrow →left, native).            */
  renderNav() {
    const n = Data.practices.length;
    const prev = $('homePrev'), next = $('homeNext');
    const nameOf = (i) => {
      const p = Data.practices[i];
      return (PRACTICE_FA[p.name] || {}).title || p.title || p.name;
    };
    if (this.idx > 0) {
      prev.innerHTML = '<span class="lbl"><span class="dir">◀ تمرین قبلی</span><span>' + esc(nameOf(this.idx - 1)) + '</span></span>';
      prev.classList.add('show');
    } else prev.classList.remove('show');
    if (this.idx < n - 1) {
      next.innerHTML = '<span class="lbl"><span class="dir">تمرین بعدی ▶</span><span>' + esc(nameOf(this.idx + 1)) + '</span></span>';
      next.classList.add('show');
    } else next.classList.remove('show');
  },
  bindPager() {
    let x0 = null, dx = 0;
    const pager = $('pager');
    pager.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; dx = 0; }, { passive: true });
    pager.addEventListener('touchmove', e => { if (x0 != null) dx = e.touches[0].clientX - x0; }, { passive: true });
    pager.addEventListener('touchend', () => {
      if (x0 == null) return;
      if (Math.abs(dx) > 50) this.go(this.idx + (dx > 0 ? 1 : -1)); /* RTL: swipe right → next */
      else this.go(this.idx);
      x0 = null;
    });
    let down = false;
    pager.addEventListener('mousedown', e => { down = true; x0 = e.clientX; dx = 0; e.preventDefault(); });
    window.addEventListener('mousemove', e => { if (down && x0 != null) dx = e.clientX - x0; });
    window.addEventListener('mouseup', () => {
      if (!down) return;
      down = false;
      if (x0 == null) return;
      if (Math.abs(dx) > 60) this.go(this.idx + (dx > 0 ? 1 : -1));
      else this.go(this.idx);
      x0 = null;
    });
  },
};

/* ═══════════════════════════════════════════════════════════════
   PRACTICE OPTIONS — inline popover (scene stays visible)
   ═══════════════════════════════════════════════════════════════ */
const Options = {
  practice: null,
  level: 0,
  duration: 30,
  durationIndex: 0,
  open(p) {
    this.practice = p;
    this.level = 0;
    this.durationIndex = 0;
    const fa = PRACTICE_FA[p.name] || {};
    $('opTitle').textContent = 'تمرین ' + (fa.title || p.title || p.name);
    $('opDesc').textContent = fa.desc || p.description || '';
    const repBased = p.session && p.session.body.repetitionBased;
    const ds = $('opDuration');
    const durs = p.durations || (repBased ? [12, 24, 36] : [30, 45, 60]);
    ds.innerHTML = '<option value="-1" disabled selected>انتخاب کن…</option>' + durs.map((d, i) => {
      const min = repBased ? Math.max(10, Math.round(d * 1.1)) : d;
      return '<option value="' + i + '">' + faNum(d) + (repBased ? ' ' + FA_UI.repsUnit : ' ' + FA_UI.minutes) + ' ~ ' + faNum(min) + ' ' + FA_UI.minutes + '</option>';
    }).join('');
    ds.classList.add('unselected');
    const df = $('opDifficulty');
    const dl = [FA_UI.begin, FA_UI.intermediate, FA_UI.expert];
    df.innerHTML = '<option value="-1" disabled selected>انتخاب کن…</option>' + (p.difficulties || [0, 1, 2]).map(d =>
      '<option value="' + d + '">' + dl[d] + '</option>').join('');
    df.classList.add('unselected');
    const env = $('opEnvironment');
    env.innerHTML = '<option value="" disabled selected>انتخاب کن…</option>' + Data.backgrounds.map(b => {
      const owned = !b.locked || DB.unlocked.includes(b.name);
      return '<option value="' + esc(b.name) + '"' + (owned ? '' : ' disabled') + '>' +
        esc(BG_FA[b.name] || b.name) + (owned ? '' : ' — ' + faNum(b.cost * 2) + ' کارما') + '</option>';
    }).join('');
    env.classList.add('unselected');
    /* unselected placeholders stay grey; chosen option turns white */
    [['opDuration', v => { this.durationIndex = +v; }], ['opDifficulty', v => { this.level = +v; }], ['opEnvironment', v => { applyBackground(v); }]].forEach(([id, set]) => {
      const el = $(id);
      el.onchange = () => {
        el.classList.remove('unselected');
        set(el.value);
      };
    });
    $('optionsPop').classList.add('show');
  },
  close() { $('optionsPop').classList.remove('show'); },
  start() {
    if (this.durationIndex === 0 && +$('opDuration').value === -1) {
      /* duration untouched → default middle */
      const repBased = this.practice.session && this.practice.session.body.repetitionBased;
      const durs = this.practice.durations || [30];
      this.durationIndex = Math.min(1, durs.length - 1);
      this.duration = repBased ? Math.max(10, Math.round(durs[this.durationIndex] * 1.1)) : durs[this.durationIndex];
    } else {
      const repBased = this.practice.session && this.practice.session.body.repetitionBased;
      if (repBased) {
        const durs = this.practice.durations || [12];
        this.duration = Math.max(10, Math.round((durs[this.durationIndex] || 12) * 1.1));
      } else {
        this.duration = this.practice.durations ? this.practice.durations[this.durationIndex] : 30;
      }
    }
    const env = $('opEnvironment').value;
    if (env) applyBackground(env);
    this.close();
    Player.start(this.practice, this.duration, this.level, this.durationIndex);
  },
};
$('opStart').onclick = () => Options.start();
$('opCancel').onclick = () => Options.close();
$('btnMoreOptions').onclick = () => Options.open(Home.current());
$('btnQuickStart').onclick = () => {
  const p = Home.current();
  const repBased = p.session && p.session.body.repetitionBased;
  const durs = p.durations || [30];
  const di = Math.min(1, durs.length - 1);
  const dur = repBased ? Math.max(10, Math.round(durs[di] * 1.1)) : durs[di];
  applyBackground(p.bg || DB.currentBg);
  Player.start(p, dur, 0, di);
};

/* ═══════════════════════════════════════════════════════════════
   PREVIEW — timeline of the sequence
   ═══════════════════════════════════════════════════════════════ */
const Preview = {
  open(p) {
    if (!p) return;
    const fa = PRACTICE_FA[p.name] || {};
    $('pvTitle').textContent = 'پیش‌نمایش ' + (fa.title || p.title || p.name);
    const grid = $('previewGrid');
    grid.innerHTML = '';
    const lvl = Options.level || 0;
    const slot = Options.durationIndex || 0;
    const ctx = { tempo: 4.0, side: 'L', lastPose: null, loopScale: 1, slot };
    const steps = flattenSession(p.steps, lvl, ctx, []);
    steps.slice(0, 120).forEach(s => {
      if (s.type === 'move' && s.toPose) {
        const cell = document.createElement('div');
        cell.className = 'pv-cell';
        const png = posePngSync(s.toPose, s.side);
        const faNm = poseNameFa(s.toPose) || s.toPose;
        cell.innerHTML =
          '<span class="pv-duration">' + s.duration + '</span>' +
          (png ? '<img class="pv-icon" src="' + esc(png) + '" alt="' + esc(faNm) + '">'
               : '<div class="pv-icon" style="display:grid;place-items:center;font-size:10px;color:#888;text-align:center;padding:4px;">' + esc(faNm) + '</div>');
        grid.appendChild(cell);
      } else if (s.type === 'hold') {
        const last = grid.lastChild;
        if (last && !last.querySelector('.pv-count')) {
          const tag = document.createElement('div');
          tag.className = 'pv-count';
          tag.textContent = faNum(s.count) + ' نفس';
          last.appendChild(tag);
        }
      }
    });
    showScreen('scr-preview');
  },
};
$('pvBack').onclick = () => showScreen('scr-home');

/* ═══════════════════════════════════════════════════════════════
   PLAYER — desktop-first
   ═══════════════════════════════════════════════════════════════ */
const Player = {
  session: null, steps: [], idx: 0, current: null,
  remainingMs: 0, elapsedMs: 0, totalSeconds: 1,
  running: false, paused: false,
  side: 'L', breathIdx: 0, breathPhase: 'inhale',
  level: 0, durationMin: 30,
  practice: null, visited: null, ticker: null,
  live: false,   /* session survives across screens (side-nav browsing) */

  start(practice, minutes, level, durationIndex) {
    this.practice = practice;
    this.durationMin = minutes;
    this.level = level || 0;
    this._durationIndex = durationIndex || 0;
    const resolved = resolveSession(practice.session, this.level, durationIndex || 0, minutes);
    this.steps = resolved.steps;
    this.totalSeconds = resolved.totalSeconds;
    this._stepStarts = resolved.stepStarts || null;
    this.visited = new Set();
    /* idx points one PAST the current step (advance() reads steps[idx++]);
       current is assigned below as steps[0], so idx must start at 1 or
       the first step would play twice. */
    this.idx = 1; this.elapsedMs = 0;
    this.running = false; this.paused = false;
    this.side = 'L';

    const fa = PRACTICE_FA[practice.name] || {};
    $('ytTitle').textContent = 'تمرین ' + (fa.title || practice.title || practice.name);
    $('ytKarma').textContent = faNum(DB.karma);
    /* current-practice capsule (bottom-left of the scene) */
    $('npName').textContent = fa.title || practice.title || practice.name;
    $('npSub').textContent = (fa.style || practice.style || '') + ' · ' + faNum(minutes) + ' دقیقه';
    /* session ring resets with the fresh total */
    this._syncRing(0);

    /* preload audio for the whole session */
    const uniqMoves = new Set(), uniqPoses = new Set();
    this.steps.forEach(s => {
      if (s.type === 'move') {
        const mv = Data.moveByName[s.name];
        uniqMoves.add((mv && mv.soundName) || s.name);
      }
      if (s.type === 'hold' && s.pose) uniqPoses.add(s.pose);
    });
    uniqMoves.forEach(m => Audio2.preloadMove(m));
    uniqPoses.forEach(p => Audio2.preloadPose(p));
    [1,2,3,4,5,6,7,8,9,10].forEach(n => Audio2.preload(['numbers_number_' + n + '.ogg']));
    Audio2.preload(['general_soften.ogg','general_hold.ogg','general_rest.ogg','general_inhale.ogg','general_exhale.ogg','general_dynamic_state_going_silent.ogg']);
    Audio2.unlock();

    $('calValue').textContent = faNum(0);
    this._setPlayIcon(false);
    this.live = true;                     /* session alive across screens */
    /* build timeline strip + poses panel content */
    this.buildStrip();
    if (typeof PosePanel !== 'undefined') PosePanel.render();
    showScreen('scr-yoga');
    this.current = this.steps[0];
    if (this.current) { this.remainingMs = (this.current.duration || 0) * 1000; this.render(); }
    /* جلسه همیشه در حالت pause باز می‌شود تا کاربر خودش شروع کند (دکمه پخش) */
    this._setPlayIcon(false);
  },

  buildStrip() {
    /* in-header timeline: pose icons + duration bubble (moves/holds).
       Inner strip is LTR; cards are inserted in REVERSE order so the
       first pose sits at the RIGHT edge (RTL feel) while transforms
       use clean LTR math. */
    const strip = $('strip');
    strip.innerHTML = '';
    this.uiList = [];
    const cards = [];
    this.steps.forEach((s, i) => {
      if (s.type === 'switchside' || s.type === 'music' || s.type === 'dyn') return;
      let png = null, bubble = null;
      if (s.type === 'move') {
        png = posePngSync(s.toPose, s.side);
        bubble = Math.ceil(s.duration || 0) + 's';
      } else if (s.type === 'pose') {
        png = posePngSync(s.name, s.side);
        if (s.timed) bubble = Math.ceil(s.duration || 0) + 's';
      } else if (s.type === 'hold') {
        png = posePngSync(s.pose, s.side);
        bubble = s.timed ? Math.ceil(s.duration) + 's' : faNum(s.count);
      }
      if (!png && s.type === 'hold' && !s.pose) return;
      this.uiList.push(i);
      const card = document.createElement('div');
      card.className = 'tl-card';
      card.dataset.i = i;
      card.innerHTML =
        (png ? '<img alt="" src="' + esc(png) + '">' : '') +
        (bubble ? '<span class="tl-bubble">' + esc(bubble) + '</span>' : '');
      card.onclick = () => {
        if (!this.running) return;
        this._jumpTo(i);
      };
      cards.push(card);
    });
    /* reverse-insert: step 0 lands at the right edge */
    for (let j = cards.length - 1; j >= 0; j--) strip.appendChild(cards[j]);
    this._syncStrip(true);
  },

  _jumpTo(i) {
    if (i >= this.steps.length) return;
    this.idx = i;
    this.advance();
  },

  play() {
    Audio2.unlock();               /* user gesture → resume AudioContext */
    const firstStart = !this.running;
    const resuming = this.running && this.paused;
    if (firstStart || resuming) {
      this.running = true;
      this.paused = false;
      if (firstStart && Ambient) Ambient.play(this.musicIdFor(this.steps[this.idx]));
      const self = this;
      clearInterval(this.ticker);
      this.ticker = setInterval(() => self.tick(), 100);
      this._setPlayIcon(true);
      /* replay the current step's cues: on first start, from its
         beginning; after resume, from now */
      if (this.current) { Audio2.newStep(); this.cueStep(this.current); }
    }
  },
  pause() {
    if (!this.running) return;
    this.paused = true;
    Audio2.killAll();          /* hard silence while paused */
    this._setPlayIcon(false);
  },
  toggle() { (this.paused || !this.running) ? this.play() : this.pause(); },
  next() { this.advance(); },
  prev() {
    /* current = steps[idx-1]; to step back one, point at idx-2 and
       advance. At the very first step there is nothing before it —
       stay put (re-cue) instead of skipping FORWARD. */
    if (this.idx <= 1) {
      if (this.current) { Audio2.newStep(); this.cueStep(this.current); }
      return;
    }
    this.idx -= 2;
    this.advance();
  },
  stop(completed) {
    this.running = false;
    this.live = false;                    /* session over — hide the resume pill */
    clearInterval(this.ticker);
    this.ticker = null;
    Ambient.stop();
    Audio2.killAll();
    /* «به حالت سکومیرود» فقط پایانِ طبیعیِ تمرین؛ نه با خروج/از‌نو */
    if (completed === true) Audio2.silent();
    const elapsed = Math.round(this.elapsedMs / 1000);
    /* دقیقه سپری‌شده همیشه ثبت می‌شود؛ کارما فقط برای تمرین کامل (پرش‌های تصادفی <10s ثبت نشوند) */
    if (elapsed >= 10) this.record(elapsed, completed === true);
    reportSessionEnd(completed === true, elapsed);   /* → cosmic parent */
    if (inCosmicIframe()) return;                    /* parent shows the result */
    if (!this._quitToLobby) Post.open(completed === true, elapsed);
    this._quitToLobby = false;
  },

  musicIdFor(atIdx) {
    let id = '0';
    for (let i = Math.min(atIdx || 0, this.steps.length - 1); i >= 0; i--) {
      if (this.steps[i] && this.steps[i].type === 'music') { id = this.steps[i].id; break; }
    }
    return id;
  },

  advance() {
    if (this.idx >= this.steps.length) { this.stop(true); return; }
    const s = this.steps[this.idx++];
    this.current = s;
    this.remainingMs = Math.round((s.duration || 0) * 1000);
    /* first breath of a hold fires IMMEDIATELY (app speaks inhale/exhale
       at the hold's first beat, not one breath-cycle later) */
    this.breathIdx = -1; this.breathPhase = 'inhale';
    this._phraseCued = false;
    /* on skip/prev/next the wall clock snaps to the new step's real
       start time (natural playback keeps tick-advancing from here) */
    if (this._stepStarts && this._stepStarts[this.idx - 1] != null) {
      const target = this._stepStarts[this.idx - 1] * 1000;
      if (Math.abs(this.elapsedMs - target) > 250) this.elapsedMs = target;
    }
    if (s.type === 'switchside') this.side = s.side;
    this.render();
    /* clocks jump instantly on skip/prev/next — no 100ms tick lag */
    this._syncClocks();
    Audio2.newStep();
    this.cueStep(s);
    if (s.type === 'music') Ambient.play(s.id);
    if (s.type === 'dyn') { if (s.state !== 'normal') Ambient.stop(); else Ambient.play(this.musicIdFor(s)); }
    if (this.remainingMs === 0) this.advance();
  },

  /** one place that paints every clock from elapsedMs/totalSeconds */
  _syncClocks() {
    const tPct = Math.min(100, this.elapsedMs / 1000 / this.totalSeconds * 100);
    $('uiProgressFill').style.width = tPct + '%';
    const tip = $('poseTip');
    if (tip) tip.style.right = tPct + '%';
    const cur = faTime(this.elapsedMs / 1000);
    const rem = '-' + faTime(this.totalSeconds - this.elapsedMs / 1000);
    $('uiCurTime').textContent = cur;
    $('uiRemTime').textContent = rem;
    const hc = $('hdrCurTime'); if (hc) hc.textContent = cur;
    const hr = $('hdrRemTime'); if (hr) hr.textContent = rem;
    const sp = $('seekPct'); if (sp) sp.textContent = faNum(Math.round(tPct)) + '٪';
    if (DB.settings.calories) $('calValue').textContent = faNum(caloriesFor(this.elapsedMs / 1000));
    this._syncRing(tPct);
  },

  /** circular minute counter — remaining minutes in the core,
      elapsed portion fills the turquoise arc (r=42 → C≈263.9) */
  _syncRing(tPct) {
    const total = this.totalSeconds || 1;
    const remMin = Math.max(0, Math.ceil((total - this.elapsedMs / 1000) / 60));
    const num = $('sessionRemMin'); if (num) num.textContent = faNum(remMin);
    const arc = $('sessionProg');
    if (arc) arc.style.strokeDashoffset = String(264 - 264 * Math.min(1, (tPct || 0) / 100));
  },

  /** Teach a pose's instruction once per base pose (variations like
      Child Wide Start share Child Wide's file — taught at the real
      hold, never twice). Start-states (excludefromtimeline) skip. */
  _teachPose(poseName) {
    if (!poseName || this.visited.has(poseName)) return;
    const p = Data.poseByName[poseName];
    if (p && p.excludeTimeline) { this.visited.add(poseName); return; }
    const baseKey = p ? (p.baseName || poseName) : poseName;
    const hasIns = poseInstructionCandidates(poseName).some(f => hasRaw(f));
    this.visited.add(poseName);
    this.visited.add('base:' + baseKey);
    if (hasIns) Audio2.poseInstruction(poseName);
  },

  cueStep(s) {
    if (!DB.settings.voice) return;
    if (!this.running || this.paused) return;
    switch (s.type) {
      case 'move': {
        /* app behavior: voice = <soundName> override played FULLY first;
           a no-voice move speaks its <breath> cue (this becomes the first
           breath of the following hold) or stays silent */
        const mv = Data.moveByName[s.name];
        const key = (mv && mv.soundName) || s.name;
        this._lastMoveBreath = (mv && mv.breath) || 'none';
        const hasVoice = moveAudioCandidates(key, s.side).some(f => hasRaw(f));
        if (hasVoice) Audio2.move(key, s.side);
        else if (this._lastMoveBreath === 'exhale') Audio2.play('general_exhale.ogg', { gap: 0.2 });
        else if (this._lastMoveBreath === 'inhale') Audio2.play('general_inhale.ogg', { gap: 0.2 });
        break;
      }
      case 'pose':
        this._teachPose(s.name);
        break;
      case 'hold': {
        /* (first visit of the pose's BASE) ONE instruction. The phrase
           cue ('and soften') is scheduled after the first breath in
           tick(), not here. */
        if (s.pose) this._teachPose(s.pose);
        break;
      }
    }
  },

  tick() {
    if (!this.running || this.paused) return;
    this.elapsedMs += 100;
    if (this.current) {
      this.remainingMs = Math.max(0, this.remainingMs - 100);
      if (this.current.type === 'hold' && this.current.duration > 0 && this.current.count > 0) {
        const breathMs = (this.current.duration * 1000) / this.current.count;
        const idx = Math.floor((this.current.duration * 1000 - this.remainingMs) / breathMs);
        if (idx !== this.breathIdx) {
          /* breathIdx starts at -1 so idx=0 (the hold's first beat) fires */
          if (this.breathIdx === -1) this.remainingMs = Math.max(this.remainingMs, this.current.duration*1000 - 1);
          this.breathIdx = idx;
          /* first breath inherits the preceding move's breath attr
             (forwardbend→halfway ends inhale → hold starts on inhale) */
          if (idx === 0 && this._lastMoveBreath) {
            this.breathPhase = this._lastMoveBreath === 'exhale' ? 'exhale' : 'inhale';
          } else {
            /* alternate from there */
            const startPhase = (this._lastMoveBreath === 'exhale') ? 1 : 0;
            this.breathPhase = ((idx + startPhase) % 2 === 0) ? 'inhale' : 'exhale';
          }
          if (DB.settings.voice && this.current.audibleCount) Audio2.number(idx + 1);
          else if (DB.settings.voice && !this.current.timed) {
            Audio2.play(this.breathPhase === 'inhale' ? 'general_inhale.ogg' : 'general_exhale.ogg', { gap: 0.2 });
          }
          /* the phrase cue ('and soften') lands right AFTER the first
             breath — as the app does — not at the hold's first ms */
          if (idx === 0 && this.current.phrase && this.current.phrase !== 'none' && !this._phraseCued) {
            this._phraseCued = true;
            const map = { soften: 'general_soften.ogg', hold: 'general_hold.ogg', rest: 'general_rest.ogg' };
            const f = map[this.current.phrase];
            if (f && DB.settings.voice) Audio2.play(f, { gap: 0.6 });
          }
          this._updatePhase();
        }
      }
      if (this.remainingMs === 0) { this.advance(); }
    }
    /* clocks — one shared painter (also fired on skip/prev/next) */
    this._syncClocks();
    /* breath count line */
    const s = this.current;
    if (s) {
      const isHold = s.type === 'hold';
      if (isHold) {
        const b = Math.min(this.breathIdx + 1, s.count);
        $('breathCount').textContent = 'نفس ' + faNum(b) + ' از ' + faNum(s.count);
      } else {
        $('breathCount').textContent = FA_UI.transition;
      }
      this._syncStrip();
    }
  },

  _updatePhase() {
    const circle = $('breathCircle');
    const torch = $('torch');
    circle.classList.remove('inhale', 'exhale');
    if (torch) torch.classList.remove('inhale', 'exhale');
    /* breath guide circle always pulses on holds; the focus torch
       only follows when «حالت تمرکز» is switched on */
    if (this.current && this.current.type === 'hold') {
      circle.classList.add(this.breathPhase);
      $('breathText').textContent = this.breathPhase === 'inhale' ? 'دم' : 'بازدم';
      if (torch && DB.settings.breathFocus) torch.classList.add(this.breathPhase);
    } else {
      $('breathText').textContent = '—';
    }
  },

  /** Neighbor pose images: walk from the current step toward the
      previous/next step that has a visible posture. Real step data —
      no placeholders. Clicking a side jumps to that step. */
  _carouselNeighbor(dir) {
    const steps = this.steps;
    let i = this.idx - 1 + dir;          // current = idx-1
    while (i >= 0 && i < steps.length) {
      const s = steps[i];
      let nm = null, side = null;
      if (s.type === 'move') { nm = s.toPose; side = s.side; }
      else if (s.type === 'pose') { nm = s.name; side = s.side; }
      else if (s.type === 'hold' && s.pose) { nm = s.pose; side = s.side; }
      if (nm && (posePngSync(nm, side) || posePngSync(nm, ''))) return { i, nm, side: side || 'N' };
      i += dir;
    }
    return null;
  },
  _renderCarousel() {
    const prevBox = $('carPrev'), nextBox = $('carNext');
    const fill = (box, nb) => {
      if (!nb) { box.classList.add('empty'); box.querySelector('img').removeAttribute('src'); box.onclick = null; return; }
      box.classList.remove('empty');
      const png = posePngSync(nb.nm, nb.side) || posePngSync(nb.nm, '');
      box.querySelector('img').src = png;
      box.onclick = () => { if (this.running) this._jumpTo(nb.i); };
    };
    fill(prevBox, this._carouselNeighbor(-1));
    fill(nextBox, this._carouselNeighbor(+1));
  },

  _setPlayIcon(playing) {
    $('uiPlayImg').src = DRAW_MDPI + (playing ? 'pvc_pause_button.png' : 'pvc_play_button.png');
  },

  render() {
    const s = this.current; if (!s) return;
    let poseName = null, side = this.side;
    if (s.type === 'move') { poseName = s.toPose; side = s.side; }
    else if (s.type === 'pose') { poseName = s.name; side = s.side; }
    else if (s.type === 'hold') { poseName = s.pose; side = s.side; }
    if (poseName) {
      const png = posePngSync(poseName, side) || posePngSync(poseName, '');
      if (png) {
        const img = $('yogaPose');
        if (img.getAttribute('src') !== png) {
          img.style.display = '';
          /* restart fade animation */
          img.style.animation = 'none';
          void img.offsetWidth;
          img.style.animation = '';
          img.src = png;
        }
      } else $('yogaPose').style.display = 'none';
      $('yogaPoseName').textContent = poseNameFa(poseName) || poseName;
      const p = Data.poseByName[poseName];
      $('yogaPoseSanskrit').textContent = p && p.sanskrit ? p.sanskrit : '';
      $('yogaPoseEn').textContent = poseName;
    } else {
      $('yogaPose').style.display = 'none';
      $('yogaPoseName').textContent = '—';
      $('yogaPoseSanskrit').textContent = '';
      $('yogaPoseEn').textContent = '';
    }
    /* side info is folded into the pose pill (en line shows side) */
    $('yogaPoseEn').textContent = poseName + (side === 'R' ? ' — سمت راست' : side === 'L' ? ' — سمت چپ' : '');
    /* scrub-head tooltip mirrors the current pose */
    const tipFa = $('poseTipFa'), tipEn = $('poseTipEn');
    if (tipFa) tipFa.textContent = poseNameFa(poseName) || poseName;
    if (tipEn) tipEn.textContent = poseName || '';
    /* prev → current → next carousel: real neighbor steps */
    this._renderCarousel();
    /* phase */
    this._updatePhase();
    /* cue caption */
    if (s.type === 'hold' && s.phrase && s.phrase !== 'none') {
      const map = { soften: FA_UI.soften, hold: FA_UI.holdCue, rest: FA_UI.restCue };
      this.setCue(map[s.phrase] || '');
    } else this.setCue('');
    /* highlight strip */
    this._syncStrip(true);
  },

  setCue(text) {
    const el = $('yogaCue');
    if (!text) { el.classList.remove('show'); return; }
    el.textContent = text;
    el.classList.add('show');
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove('show'), 2600);
  },

  _syncStrip(force) {
    const strip = $('strip');
    if (!strip) return;
    const cur = Math.max(0, this.idx - 1);
    let curCard = null;
    strip.querySelectorAll('.tl-card').forEach(card => {
      const i = +card.dataset.i;
      const isCur = i === cur;
      if (isCur) curCard = card;
      card.classList.toggle('cur', isCur);
      card.classList.toggle('past', i < cur);
    });
    if (curCard) {
      /* inner strip is LTR (left-anchored): center the current card with
         a negative translateX — same math both directions */
      const wrapW = strip.parentElement.clientWidth || 800;
      const r = curCard.offsetLeft + (curCard.offsetWidth / 2) - (wrapW / 2);
      const clamped = Math.max(0, r);
      if (force || strip._target !== clamped) {
        strip.style.transform = 'translateX(' + (-clamped) + 'px)';
        strip._target = clamped;
      }
    }
  },

  /* ثبت دقیقه‌های سپری‌شده همیشه؛ امتیاز کارما فقط برای تمرین کامل‌شده.
     completed=true → تاریخچه + کارما؛ false (ترک تمرین) → فقط تاریخچه‌ی دقیقه. */
  record(elapsedSec, completed) {
    const p = this.practice || {};
    DB.history.push({
      practice: p.name,
      title: (PRACTICE_FA[p.name] || {}).title || p.title || p.name,
      date: Date.now(),
      seconds: elapsedSec,
      completed: !!completed,
      level: [FA_UI.begin, FA_UI.intermediate, FA_UI.expert][this.level || 0],
    });
    if (completed) {
      const earned = Math.floor(elapsedSec / 900);
      DB.karma += Math.max(1, earned);
    }
    DB.save();
  },
};

$('uiPlay').onclick = () => Player.toggle();
$('uiNext').onclick = () => Player.next();
$('uiPrev').onclick = () => Player.prev();
$('uiQuit').onclick = () => {
  if (Player.running && Player.elapsedMs > 30000 && !confirm(FA_UI.quitConfirm)) return;
  Player._quitToLobby = true;
  Player.stop(false);
  /* quit = back to the classic lobby, both standalone and inside cosmic
     (the cosmic modal itself is closed with «بستن استودیو» → postMessage) */
  showScreen('scr-home');
  Home.go(Home.idx, true);
};
/* بستن استودیو — ask the cosmic parent to close the whole modal */
$('uiCloseStudio').onclick = () => {
  if (!inCosmicIframe()) { showScreen('scr-home'); Home.go(Home.idx, true); return; }
  if (Player.live && Player.elapsedMs > 30000 && !confirm(FA_UI.quitConfirm)) return;
  if (Player.live) { Player._quitToLobby = true; Player.stop(false); }
  try { window.parent.postMessage({ source: 'yoga-classic', type: 'close' }, '*'); } catch (e) {}
};
/* اسلایدر صدا — هم نوارِ پایین هم تبِ پنل حرکات (id تکراری داشت: uiVolumePanel) */
function onVolInput(e) {
  const v = +e.target.value / 100;
  Audio2.setVolume(v);
  Ambient.setVolume(v);
  const other = (e.target.id === 'uiVolume') ? $('uiVolumePanel') : $('uiVolume');
  if (other) other.value = e.target.value;   /* همگام دو اسلایدر */
}
$('uiVolume').oninput = onVolInput;
if ($('uiVolumePanel')) $('uiVolumePanel').oninput = onVolInput;
function syncSoundBtn() {
  const b = $('ytSound'); if (!b) return;
  b.classList.toggle('off', !DB.settings.voice);
  const img = b.querySelector('img');
  if (img) img.src = DRAW_MDPI + (DB.settings.voice ? 'volume_on.png' : 'ic_volume_mute_black_24dp.png');
  b.style.opacity = DB.settings.voice ? '' : '.55';
}
function syncMusicBtn() {
  const b = $('ytMusic'); if (!b) return;
  b.classList.toggle('off', !DB.settings.music);
  b.style.opacity = DB.settings.music ? '' : '.55';
}
$('ytSound').onclick = () => {
  DB.settings.voice = !DB.settings.voice;
  DB.save();
  syncSoundBtn();
  if (!DB.settings.voice) Audio2.newStep();
  toast(DB.settings.voice ? 'راهنمای صوتی روشن شد' : 'راهنمای صوتی خاموش شد');
};
$('ytMusic').onclick = () => {
  DB.settings.music = !DB.settings.music;
  DB.save();
  syncMusicBtn();
  if (!DB.settings.music) Ambient.stop();
  else Ambient.play(Player.musicIdFor(Player.idx));
  toast(DB.settings.music ? 'موسیقی روشن شد' : 'موسیقی خاموش شد');
};
/* ═══ ENV RAIL — نور روز / حالت شب / تنظیم دستی نور صحنه
   (the rail beside the practice scene; affects the background image
    only, glass panels stay readable) ═══ */
const ENV_MODES = {
  light:  { b: 1.18, c: 1.04 },
  dark:   { b: 0.78, c: 0.96 },
  custom: null,                       /* from slider */
};
function envApply() {
  const m = DB.settings.envMode || 'light';
  const root = document.documentElement.style;
  let b = 1, c = 1;
  if (m === 'custom') { b = (DB.settings.envBrightness || 100) / 100; c = 1; }
  else { const e = ENV_MODES[m] || ENV_MODES.light; b = e.b; c = e.c; }
  root.setProperty('--scene-b', String(b));
  root.setProperty('--scene-c', String(c));
  const rail = $('envRail');
  if (rail) {
    rail.classList.toggle('custom', m === 'custom');
    rail.querySelectorAll('.er-btn').forEach(x => x.classList.toggle('on', x.dataset.mode === m));
  }
  const sl = $('envBrightness');
  if (sl) sl.value = DB.settings.envBrightness || 100;
}
function envWire() {
  ['envLight', 'envDark', 'envCustom'].forEach(id => {
    const btn = $(id); if (!btn) return;
    btn.onclick = () => {
      DB.settings.envMode = btn.dataset.mode;
      DB.save(); envApply();
      toast(btn.dataset.mode === 'light' ? 'نور روز' : btn.dataset.mode === 'dark' ? 'حالت شب' : 'تنظیم دستی نور');
    };
  });
  const sl = $('envBrightness');
  if (sl) sl.oninput = () => {
    DB.settings.envMode = 'custom';
    DB.settings.envBrightness = +sl.value;
    DB.save(); envApply();
  };
}

/* ═══ FOCUS MODE — «حالت تمرکز» switch on the breath card.
   OFF by default: the torch (breathing light around the scene) stays
   hidden until the user switches it on. The breath circle itself is
   always live. ═══ */
function syncBreathFab() {
  const on = !!DB.settings.breathFocus;
  const sw = $('breathSwitch');
  if (sw) sw.setAttribute('aria-checked', on ? 'true' : 'false');
  const fab = $('breathFab');
  if (fab) fab.classList.toggle('off', !on);
  const torch = $('torch');
  if (torch) {
    torch.classList.toggle('on', on);
    if (!on) torch.classList.remove('inhale', 'exhale');
  }
}
function toggleBreathFocus() {
  DB.settings.breathFocus = !DB.settings.breathFocus;
  DB.save();
  syncBreathFab();
  if (DB.settings.breathFocus) Player._updatePhase();   /* join the current breath now */
  toast(DB.settings.breathFocus ? '🔦 حالت تمرکز روشن شد — نور با تنفس نفس می‌کشد' : 'حالت تمرکز خاموش شد');
}
(function () {
  const sw = $('breathSwitch');
  if (sw) {
    sw.addEventListener('click', e => { e.stopPropagation(); toggleBreathFocus(); });
    sw.addEventListener('keydown', e => {
      if (e.code === 'Enter' || e.code === 'Space') { e.preventDefault(); e.stopPropagation(); toggleBreathFocus(); }
    });
  }
})();

/* keyboard shortcuts — desktop */
window.addEventListener('keydown', e => {
  if (!$('scr-yoga').classList.contains('show')) return;
  if (e.target && (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || (e.target.closest && e.target.closest('#breathFab')))) return;   /* حین تایپ یا روی دکمه تنفس، میان‌برها غیرفعال */
  if (e.code === 'Space') { e.preventDefault(); Player.toggle(); }
  else if (e.key === 'ArrowLeft') Player.prev();   /* media convention: left = back */
  else if (e.key === 'ArrowRight') Player.next();
});
/* strip drag — horizontal browse (in-header timeline) */
(function () {
  const wrap = document.getElementById('stripWrap') || document.querySelector('.yh-strip');
  const inner = $('strip');
  if (!wrap || !inner) return;
  let dragging = false, startX = 0, startT = 0, moved = 0;
  function currentT() {
    const m = inner.style.transform.match(/translateX\((-?[\d.]+)px\)/);
    return m ? parseFloat(m[1]) : 0;
  }
  function down(x) { dragging = true; moved = 0; startX = x; startT = currentT(); wrap.classList.add('dragging'); }
  function move(x) {
    if (!dragging) return;
    const dx = x - startX;
    moved = Math.max(moved, Math.abs(dx));
    /* LTR inner: transform must stay ≤ 0 (cards scroll left only) */
    const t = Math.min(0, startT + dx);
    inner.style.transform = 'translateX(' + t + 'px)';
  }
  function up() {
    if (!dragging) return;
    dragging = false;
    wrap.classList.remove('dragging');
    if (Player.running) Player._syncStrip(true);
  }
  wrap.addEventListener('touchstart', e => down(e.touches[0].clientX), { passive: true });
  wrap.addEventListener('touchmove', e => move(e.touches[0].clientX), { passive: true });
  wrap.addEventListener('touchend', up);
  wrap.addEventListener('mousedown', e => { down(e.clientX); e.preventDefault(); });
  window.addEventListener('mousemove', e => move(e.clientX));
  window.addEventListener('mouseup', up);
  inner.addEventListener('click', e => {
    if (moved > 8) { e.stopPropagation(); e.preventDefault(); moved = 0; }
  }, true);
})();

/* ═══════════════════════════════════════════════════════════════
   POSES PANEL (player right-side, reference layout)
   ═══════════════════════════════════════════════════════════════ */
const PosePanel = {
  mode: 'session',   /* session | all */
  query: '',
  init() {
    $('btnPosePanel').onclick = () => this.toggle();
    $('panelToggle').onclick = () => this.toggle();
    $('ppClose').onclick = () => this.toggle(false);
    $('ppTabAll').onclick = () => { this.mode = 'all'; this.render(); this.syncTabs(); };
    $('ppTabSession').onclick = () => { this.mode = 'session'; this.render(); this.syncTabs(); };
    $('ppLayout').onclick = () => {
      /* toggling between 4-col and 6-col grid */
      const g = $('posePanelGrid');
      g.style.gridTemplateColumns = g.style.gridTemplateColumns === 'repeat(6, 1fr)' ? '' : 'repeat(6, 1fr)';
    };
    $('poseSearch').oninput = e => { this.query = e.target.value.trim(); this.render(); };
  },
  toggle(force) {
    const open = force != null ? force : !$('posePanel').classList.contains('open');
    $('posePanel').classList.toggle('open', open);
    document.body.classList.toggle('panel-open', open);
  },
  syncTabs() {
    $('ppTabAll').classList.toggle('on', this.mode === 'all');
    $('ppTabSession').classList.toggle('on', this.mode === 'session');
  },
  render() {
    const grid = $('posePanelGrid');
    grid.innerHTML = '';
    const q = this.query.toLowerCase();
    let list = [];
    if (this.mode === 'session' && Player.steps) {
      const seen = new Set();
      Player.steps.forEach(s => {
        const nm = s.type === 'move' ? s.toPose : (s.type === 'pose' ? s.name : (s.type === 'hold' ? s.pose : null));
        if (nm && !seen.has(nm)) { seen.add(nm); list.push(nm); }
      });
    } else {
      list = Data.poses.map(p => p.name);
    }
    if (q) list = list.filter(n => (poseNameFa(n) || n).toLowerCase().includes(q) || n.toLowerCase().includes(q));
    list.forEach(nm => {
      const png = posePngSync(nm, '') || posePngSync(nm, 'R');
      const cell = document.createElement('div');
      cell.className = 'pp-cell';
      cell.title = poseNameFa(nm) || nm;
      cell.innerHTML = png ? '<img loading="lazy" src="' + esc(png) + '" alt="">' : '';
      cell.onclick = () => {
        this.showInfo(nm);
        /* jump to the next step in the session that matches this pose */
        if (!Player.running) return;
        const idx = Player.steps.findIndex((s, i) => i >= Player.idx - 1 &&
          ((s.type === 'move' && s.toPose === nm) || (s.type === 'pose' && s.name === nm) || (s.type === 'hold' && s.pose === nm)));
        if (idx >= 0) Player._jumpTo(idx);
        else if (this.mode === 'all') Poses.detail(Data.poseByName[nm] || { name: nm });
      };
      grid.appendChild(cell);
    });
    if (!list.length) grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:rgba(255,255,255,.8);padding:20px;font-size:13px;">حرکتی پیدا نشد</div>';
  },
  /* show the pose's description + benefits (with clickable //Pose// refs)
     right inside the practice pose panel */
  showInfo(nm) {
    const pane = $('ppInfo'), name = $('ppInfoName'), desc = $('ppInfoDesc'), ben = $('ppInfoBenefits');
    if (!pane || !name || !desc || !ben) return;
    const fa = poseDescriptionFa(nm), en = poseDescription(nm);
    name.textContent = poseNameFa(nm) || nm;
    desc.innerHTML = linkifyFa(fa || en) || '—';
    ben.innerHTML = linkifyFa(poseBenefitsFa(nm) || poseBenefits(nm)) || '';
    pane.hidden = !(fa || en);
  },
};
/* //Pose// refs inside the practice pose panel open the referenced pose */
$('posePanel').addEventListener('click', e => {
  const a = e.target.closest && e.target.closest('a.pose-ref');
  if (!a) return;
  e.preventDefault();
  const pose = Data.poseByName[a.getAttribute('data-pose')];
  if (pose) Poses.detail(pose);
});
let _restartLock = null;
$('btnRestart').onclick = () => {
  if (!Player.practice) return;
  /* debounce: spam-clicks stacked start()s → stacked tickers →
     multiplied breath counts. One restart per 800ms window. */
  const now = Date.now();
  if (_restartLock && now - _restartLock < 800) return;
  _restartLock = now;
  if (Player.running && Player.elapsedMs > 30000 && !confirm('تمرین از ابتدا شروع شود؟')) return;
  Player.stop(false);          /* kills ticker + all audio */
  const p = Player.practice;
  /* start on the next tick so stop()'s cleanup fully lands first */
  setTimeout(() => Player.start(p, Player.durationMin, Player.level, Player._durationIndex || 0), 0);
};

/* ═══════════════════════════════════════════════════════════════
   POST SESSION
   ═══════════════════════════════════════════════════════════════ */
const Post = {
  open(completed, elapsedSec) {
    $('postMsg').textContent = completed ? FA_UI.youCompleted : FA_UI.practiceEnded;
    $('postCal').textContent = faNum(caloriesFor(elapsedSec));
    const earned = completed ? Math.max(1, Math.floor(elapsedSec / 900)) : 0;
    $('postKarma').textContent = faNum(earned);
    $('postKarmaTotal').textContent = faNum(DB.karma);
    showScreen('scr-post');
  },
};
$('postDone').onclick = () => { showScreen('scr-home'); Home.go(Home.idx, true); };
$('postShare').onclick = () => {
  const fa = PRACTICE_FA[(Player.practice || {}).name] || {};
  const txt = 'تمرین ' + (fa.title || 'یوگا') + ' رو با یوگای جیبی انجام دادم — ' +
    faNum(caloriesFor(Player.elapsedMs / 1000)) + ' کالری سوزوندم!';
  if (navigator.share) navigator.share({ text: txt }).catch(() => {});
  else toast(txt);
};

/* ═══════════════════════════════════════════════════════════════
   STORE
   ═══════════════════════════════════════════════════════════════ */
const BG_FA = {
  Home: 'خانه', Studio: 'استودیو', Office: 'دفتر', Ocean: 'اقیانوس', Desert: 'کویر',
  Mountain: 'کوه', Dojo: 'دوجو', Temple: 'معبد', Palace: 'کاخ',
  Shiva: 'شیوا', Vishnu: 'ویشنو', Buddha: 'بودا', 'Samādhi': 'سماдhi',
};
const Store = {
  open(tab) {
    this.renderKarma();
    this.renderGrid();
    showScreen('scr-store');
    this.tab(tab || 'backgrounds');
  },
  tab(t) {
    document.querySelectorAll('#storeTabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === t));
    $('page-backgrounds').classList.toggle('show', t === 'backgrounds');
    $('page-karma').classList.toggle('show', t === 'karma');
  },
  renderKarma() {
    $('storeKarmaVal').textContent = faNum(DB.karma);
    $('karmaBigVal').textContent = faNum(DB.karma);
    $('ytKarma').textContent = faNum(DB.karma);
  },
  renderGrid() {
    const grid = $('bgGrid');
    grid.innerHTML = '';
    Data.backgrounds.forEach(b => {
      const owned = !b.locked || DB.unlocked.includes(b.name);
      const item = document.createElement('div');
      item.className = 'bg-item' + (owned ? ' owned' : '');
      item.innerHTML =
        '<div class="card">' +
          '<img class="tn" src="' + esc(bgUrl(b.backgroundname, 'tnstore')) + '" alt="' + esc(BG_FA[b.name] || b.name) + '">' +
          '<div class="lockrow">' +
            '<img class="lock" src="' + DRAW_MDPI + 'store_background_lock_icon.png" alt="">' +
            '<span class="nm">' + esc(BG_FA[b.name] || b.name) + '</span>' +
            (owned ? '' : '<span class="cost">' + faNum(b.cost * 2) + '<img src="' + DRAW_MDPI + 'karma_symbol_small.png" alt=""></span>') +
          '</div>' +
        '</div>';
      item.onclick = () => this.detail(b);
      grid.appendChild(item);
    });
  },
  detail(b) {
    const owned = !b.locked || DB.unlocked.includes(b.name);
    $('bgDetailImg').src = bgUrl(b.backgroundname, 'x');
    $('bgDetailName').textContent = BG_FA[b.name] || b.name;
    const btn = $('bgDetailBtn');
    if (owned) {
      $('bgDetailState').textContent = 'برای تنظیم به‌عنوان محیط فعلی، انتخاب کن';
      btn.disabled = false;
      btn.textContent = FA_UI.select;
      btn.onclick = () => {
        applyBackground(b.name);
        $('bgDetail').classList.remove('show');
        toast(FA_UI.envSet + ' ' + (BG_FA[b.name] || b.name));
      };
    } else {
      var cost2 = b.cost * 2;
      $('bgDetailState').textContent = 'قفل — ' + faNum(cost2) + ' امتیاز کارما';
      btn.disabled = DB.karma < cost2;
      btn.textContent = FA_UI.unlockFor + ' (' + faNum(cost2) + ')';
      btn.onclick = () => {
        var cost2 = b.cost * 2;
        if (DB.karma < cost2) { toast(FA_UI.notEnoughKarma); return; }
        DB.karma -= cost2;
        DB.unlocked.push(b.name);
        DB.save();
        this.renderKarma();
        this.renderGrid();
        $('bgDetail').classList.remove('show');
        toast((BG_FA[b.name] || b.name) + ' باز شد! 🎉');
      };
    }
    $('bgDetail').classList.add('show');
  },
};
$('storeBack').onclick = () => showScreen('scr-home');
$('bgDetailBack').onclick = () => $('bgDetail').classList.remove('show');
$('storeTabs').querySelectorAll('button').forEach(b => { b.onclick = () => Store.tab(b.dataset.tab); });

/* ═══════════════════════════════════════════════════════════════
   HISTORY
   ═══════════════════════════════════════════════════════════════ */
const History = {
  tf: 'all',
  open() { this.render(); showScreen('scr-history'); },
  filtered() {
    const now = Date.now();
    if (this.tf === 'week') return DB.history.filter(h => now - h.date <= 7 * 864e5);
    if (this.tf === 'month') return DB.history.filter(h => now - h.date <= 30 * 864e5);
    return DB.history.slice();
  },
  render() {
    const list = this.filtered();
    let totalSec = 0;
    list.forEach(h => totalSec += h.seconds || 0);
    $('hsPractices').textContent = faNum(list.length);
    $('hsTime').textContent = faTime(totalSec);
    const el = $('historyList');
    el.innerHTML = '';
    list.slice().sort((a, b) => b.date - a.date).forEach(h => {
      const row = document.createElement('div');
      row.className = 'history-row';
      row.innerHTML =
        '<span class="t1">' + esc(h.title || h.practice) + '</span>' +
        '<span class="t2">' + faDate(h.date) + ' · ' + faNum(Math.round(h.seconds / 60)) + ' دقیقه</span>';
      row.onclick = () => HistoryDetail.open(h);
      el.appendChild(row);
    });
    if (!list.length) el.innerHTML = '<div class="history-row" style="cursor:default;"><span class="t2">' + FA_UI.noHistory + '</span></div>';
  },
};
$('historyBack').onclick = () => showScreen('scr-home');
$('histTimeframe').querySelectorAll('button').forEach(b => {
  b.onclick = () => {
    History.tf = b.dataset.tf;
    $('histTimeframe').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
    History.render();
  };
});
const HistoryDetail = {
  open(h) {
    $('hdPractice').textContent = h.title || h.practice;
    $('hdDate').textContent = faDateTime(h.date);
    $('hdDuration').textContent = faNum(Math.round(h.seconds / 60)) + ' دقیقه';
    $('hdDifficulty').textContent = h.level || FA_UI.begin;
    showScreen('scr-history-detail');
  },
};
$('hdetailBack').onclick = () => showScreen('scr-history');

/* ═══════════════════════════════════════════════════════════════
   POSES
   ═══════════════════════════════════════════════════════════════ */
const CAT_FA = {
  standing: 'ایستاده', seated: 'نشسته', supine: 'خوابیده به پشت', prone: 'خوابیده به شکم',
  arm_leg_support: 'تکیه بر دست و پا', arm_balance_and_inversion: 'تعادل روی دست و وارونگی',
  arm_balance_inversion: 'تعادل روی دست و وارونگی',
};
const SUB_FA = {
  backbend: 'خمش به عقب', forward_bend: 'خمش به جلو', lateral_bend: 'خمش جانبی',
  twist: 'پیچش', balancing: 'تعادلی', neutral: 'خنثی', inversion: 'وارونگی',
  hip_opener: 'بازکننده ران', strength: 'قدرتی',  heart_opener: 'بازکننده سینه',
};

/* ── Pose-reference links ──────────────────────────────────────
   Descriptions contain //Pose// references (e.g. "from //ChildWide//").
   They should render as clickable links that open the referenced pose.
   A ref resolves when its record (English name/display or Persian name)
   maps to a pose in the visible dictionary; anything unresolved stays
   plain text so no link ever points at the wrong pose. */
let _poseByBase = null;
function poseForFaRecord(rec) {
  if (!_poseByBase) {
    _poseByBase = new Map();
    const claim = (p, fill) => {
      if (!p.baseName) return;
      const k = faAlnum(p.baseName);
      if (fill && _poseByBase.has(k)) return;   // second pass only fills gaps
      if (!_poseByBase.has(k)) _poseByBase.set(k, p);
    };
    /* pass 1: canonical poses (name === baseName, e.g. "Child Wide")
       win over Start/excluded aliases that share their baseName. */
    Data.poses.forEach(p => { if (faAlnum(p.name) === faAlnum(p.baseName)) claim(p, false); });
    Data.poses.forEach(p => { if (faAlnum(p.name) !== faAlnum(p.baseName)) claim(p, true); });
  }
  return _poseByBase.get(faAlnum(rec.name)) || null;
}
function linkifyFa(text) {
  if (!text) return '';
  return text.split(/(\/\/[^/]+\/\/)/g).map(seg => {
    const m = /^\/\/(.+)\/\/$/.exec(seg);
    if (!m) return esc(seg);
    const ref = m[1];
    const rec = faPoseRef(ref);
    const pose = rec && poseForFaRecord(rec);
    if (!pose) return esc(ref);   // unresolved ref — render as plain text, no slashes
    return '<a class="pose-ref" href="#" data-pose="' + esc(pose.name) + '">'
         + esc(poseNameFa(pose.name) || ref) + '</a>';
  }).join('');
}
const Poses = {
  mode: 'grid',
  side: 'R',
  open() {
    this.renderGrid();
    showScreen('scr-poses');
  },
  renderGrid() {
    const grid = $('poseGrid');
    grid.classList.remove('list-mode');
    grid.innerHTML = '';
    $('poseGridPage').classList.add('show');
    $('poseDetailPage').classList.remove('show');
    $('posesTitle').textContent = FA_UI.poses;
    const sorted = Data.poses.slice().sort((a, b) => (poseNameFa(a.name) || a.name).localeCompare(poseNameFa(b.name) || b.name, 'fa'));
    sorted.forEach(p => {
      const png = posePngSync(p.name, (p.preferredside || '').toLowerCase().startsWith('l') ? 'L' : 'R') || posePngSync(p.name, '');
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.innerHTML = '<img loading="lazy" src="' + esc(png || (DRAW_LG + 'notfound.png')) + '" alt="' + esc(poseNameFa(p.name) || p.name) + '">';
      cell.onclick = () => this.detail(p);
      grid.appendChild(cell);
    });
  },
  renderList() {
    const grid = $('poseGrid');
    grid.classList.add('list-mode');
    grid.innerHTML = '';
    const sorted = Data.poses.slice().sort((a, b) => (poseNameFa(a.name) || a.name).localeCompare(poseNameFa(b.name) || b.name, 'fa'));
    sorted.forEach(p => {
      const png = posePngSync(p.name, '') || (DRAW_LG + 'notfound.png');
      const row = document.createElement('div');
      row.className = 'cell';
      row.innerHTML =
        '<img loading="lazy" src="' + esc(png) + '" alt="">' +
        '<div class="row-txt"><div class="nm">' + esc(poseNameFa(p.name) || p.name) + '</div>' +
        '<div class="sk">' + esc(p.sanskrit || '') + '</div></div>';
      row.onclick = () => this.detail(p);
      grid.appendChild(row);
    });
  },
  detail(p, forceSide) {
    $('poseGridPage').classList.remove('show');
    $('poseDetailPage').classList.add('show');
    $('posesTitle').textContent = poseNameFa(p.name) || p.name;
    this._pose = p;
    this.side = forceSide || ((p.preferredside || '').toLowerCase().startsWith('l') ? 'L' : 'R');
    this.fill();
  },
  fill() {
    const p = this._pose;
    $('pdName').textContent = poseNameFa(p.name) || p.name;
    $('pdSanskrit').textContent = p.sanskrit || '';
    const png = posePngSync(p.name, this.side) || posePngSync(p.name, '');
    $('pdImg').src = png || (DRAW_LG + 'notfound.png');
    const aka = poseAkaFa(p.name);
    $('pdAltRow').style.display = aka ? '' : 'none';
    $('pdAltName').textContent = aka;
    const cat = CAT_FA[p.category] || p.category || '';
    const sub = SUB_FA[p.subcategory] || (p.subcategory || '').replace(/_/g, ' ');
    $('pdCategory').textContent = cat + (sub ? ' · ' + sub : '');
    $('pdDifficulty').textContent = DIFF_LABEL[p.difficulty] || p.difficulty;
    $('pdDesc').innerHTML = linkifyFa(poseDescriptionFa(p.name) || poseDescription(p.name)) || '—';
    $('pdBenefits').innerHTML = linkifyFa(poseBenefitsFa(p.name) || poseBenefits(p.name)) || '—';
    $('pdAltBtn').style.display = (p.twosided && posePngSync(p.name, 'L') && posePngSync(p.name, 'R')) ? '' : 'none';
  },
};
$('posesBack').onclick = () => {
  if ($('poseDetailPage').classList.contains('show')) Poses.renderGrid();
  else showScreen('scr-home');
};
$('pdAltBtn').onclick = () => {
  Poses.side = Poses.side === 'L' ? 'R' : 'L';
  Poses.fill();
};
$('poseDetailPage').addEventListener('click', e => {
  const a = e.target.closest && e.target.closest('a.pose-ref');
  if (!a) return;
  e.preventDefault();
  const pose = Data.poseByName[a.getAttribute('data-pose')];
  if (pose) Poses.detail(pose);
});
$('posesLayout').onclick = () => {
  if (Poses.mode === 'grid') { Poses.mode = 'list'; Poses.renderList(); $('posesLayoutIcon').src = DRAW_MDPI + 'ic_view_headline_white_24dp.png'; }
  else { Poses.mode = 'grid'; Poses.renderGrid(); $('posesLayoutIcon').src = DRAW_MDPI + 'ic_view_module_white_24dp.png'; }
};

/* ═══════════════════════════════════════════════════════════════
   SETTINGS
   ═══════════════════════════════════════════════════════════════ */
const Settings = {
  open() {
    $('setVoice').classList.toggle('on', !!DB.settings.voice);
    $('setMusic').classList.toggle('on', !!DB.settings.music);
    $('setCalories').classList.toggle('on', !!DB.settings.calories);
    showScreen('scr-settings');
  },
};
$('settingsBack').onclick = () => showScreen('scr-home');
[['setVoice', 'voice'], ['setMusic', 'music'], ['setCalories', 'calories']].forEach(([id, key]) => {
  $(id).onclick = () => {
    DB.settings[key] = !DB.settings[key];
    DB.save();
    $(id).classList.toggle('on', DB.settings[key]);
    if (key === 'music' && !DB.settings.music) Ambient.stop();
    $('ytSound').classList.toggle('off', !DB.settings.voice);
    $('ytMusic').classList.toggle('off', !DB.settings.music);
  };
});

/* ═══════════════════════════════════════════════════════════════
   ABOUT
   ═══════════════════════════════════════════════════════════════ */
const About = {
  open() { showScreen('scr-about'); },
};
$('aboutBack').onclick = () => showScreen('scr-home');

/* ═══════════════════════════════════════════════════════════════
   COSMIC INTEGRATION — running inside the main app iframe?
   Parent passes practice/dur/lvl via query; session end goes back
   via postMessage so the main app can record it.
   ═══════════════════════════════════════════════════════════════ */
function inCosmicIframe() {
  try { return window.self !== window.top; } catch (e) { return true; }
}
function classicQuery() {
  const q = new URLSearchParams(location.search);
  return {
    practice: q.get('practice'),
    dur: +q.get('dur') || null,
    lvl: q.get('lvl'),
    bg: q.get('bg'),          /* override محیط (از تب جلسه تمرین اپ اصلی) */
  };
}
function reportSessionEnd(completed, seconds) {
  if (!inCosmicIframe()) return;
  try {
    window.parent.postMessage({
      source: 'yoga-classic',
      type: 'session-end',
      completed: !!completed,
      seconds: Math.round(seconds),
      practice: Player.practice ? (PRACTICE_FA[Player.practice.name] || {}).title || Player.practice.name : '',
    }, '*');
  } catch (e) {}
}

/* ═══════════════════════════════════════════════════════════════
   BOOT
   ═══════════════════════════════════════════════════════════════ */
(async function boot() {
  /* file:// can't fetch() the XML assets — explain clearly */
  if (location.protocol === 'file:') {
    document.body.insertAdjacentHTML('beforeend',
      '<div style="position:fixed;inset:0;z-index:999;display:grid;place-items:center;background:rgba(0,0,0,.9);text-align:center;padding:24px;">' +
      '<div style="max-width:440px;line-height:2.2;">' +
      '<div style="font-size:38px;">🧘</div>' +
      '<b style="font-size:17px;">این صفحه باید از سرور باز شود</b>' +
      '<p style="font-size:14px;opacity:.85;margin-top:10px;">داده‌های تمرین (XML) با پروتکل file:// قابل بارگذاری نیستند.<br>سرور را اجرا کن و این آدرس را باز کن:<br>' +
      '<code style="background:rgba(255,255,255,.12);padding:4px 10px;border-radius:6px;display:inline-block;margin-top:8px;direction:ltr;">http://127.0.0.1:8006/yoga-classic.html</code></p>' +
      '</div></div>');
    return;
  }
  try {
    await Promise.all([DataReady, loadFaTexts()]);   /* data + Persian texts */
    const missingFa = validateFaCoverage();   /* [] = full coverage */
    if (missingFa.length) {
      const banner = $('faCoverageBanner'), text = $('faCoverageText');
      if (banner && text) {
        const names = missingFa.map(m => m.name).join('، ');
        text.textContent = '⚠️ ' + faNum(missingFa.length) + ' حرکت فاقد ترجمهٔ فارسی است: ' + names
          + ' — به yoga.txt رکورد نام‌فارسی اضافه کن.';
        banner.hidden = false;
        $('faCoverageClose').onclick = () => { banner.hidden = true; };
      }
    }
    Audio2.loadGuide();
    initSideNav();
    envWire(); envApply();
    syncBreathFab();
    Home.init();
    PosePanel.init();
    applyBackground(DB.currentBg);
    syncSoundBtn();
    syncMusicBtn();
    /* preload the core cues right away (home) — user can verify with the
       test button before starting a practice; full session preloads on start */
    Audio2.onProgress((n, total) => {
      const fill = $('asFill'), label = $('asLabel');
      if (!fill) return;
      fill.style.width = total ? Math.round(n / total * 100) + '%' : '100%';
      if (label) label.textContent = n >= total
        ? '✓ صداها آماده است — با دکمه تست بشنو'
        : '🎧 آماده‌سازی صداها… ' + faNum(n) + ' از ' + faNum(total);
    });
    Audio2.preload([
      'general_soften.ogg','general_hold.ogg','general_rest.ogg',
      'general_inhale.ogg','general_exhale.ogg','general_dynamic_state_going_silent.ogg',
      'moves_childwidestart_to_childwide.ogg','moves_childwidestart_to_childwidestart.ogg',
      'numbers_number_1.ogg','numbers_number_2.ogg',
    ]);
    $('asTest').onclick = () => {
      Audio2.unlock();          /* user gesture */
      Audio2.test();
      toast('اگر صدای «نرم‌شو» شنیدی، صداها سالم‌اند 🎧');
    };
    /* cosmic iframe mode: auto-start the requested practice — ONCE per
       page lifetime; reopening the modal keeps the classic lobby */
    const q = classicQuery();
    if (!window.__pycAutoStarted && inCosmicIframe() && q.practice) {
      window.__pycAutoStarted = true;
      const p = Data.practices.find(x => x.name === q.practice);
      if (p) {
        const repBased = p.session && p.session.body.repetitionBased;
        const durs = p.durations || [30];
        const di = q.dur ? Math.max(0, durs.indexOf(q.dur)) : Math.min(1, durs.length - 1);
        const minutes = repBased ? Math.max(10, Math.round(durs[di] * 1.1)) : durs[di];
        const lvl = Math.max(0, ['beginner', 'intermediate', 'expert'].indexOf(q.lvl));
        applyBackground(q.bg || p.bg || DB.currentBg);
        showScreen('scr-yoga');
        Player.start(p, minutes, lvl, di);
        return;
      }
    }
    setTimeout(() => showScreen('scr-home'), 900);
  } catch (e) {
    console.error(e);
    toast('بارگذاری داده‌های تمرین ناموفق بود: ' + (e && e.message || e));
  }
})();
