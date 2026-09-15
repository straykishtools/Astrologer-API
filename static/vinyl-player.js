/* ═══════════════════════════════════════════════════════════════
   VINYL PLAYER — پلیر وینیلی فایل‌محور برای موسیقی پس‌زمینه
   ───────────────────────────────────────────────────────────────
   • مستقل از audio-manager.js (سنتز یوگا/تنفس/مدیتیشن آنجا است).
   • ترک‌ها: /api/v5/settings/tracks → [{id,name,icon,fileUrl,active,assignedTo[]}]
   • لود تنبل: تا کاربر پخش نکند چیزی دانلود نمی‌شود؛ ۲۵ ثانیه به انتهای
     هر ترک که برسد، ترک بعدی پشت‌صحنه گرم می‌شود (بدون وقفه).
   • ادامه‌پخش: {id,time} در localStorage با timestamp؛ تا ۲ دقیقه بعد از
     رفرش/تغییر صفحه، همان‌جا که بودیم ادامه می‌دهد.
   • پخش خودکار فقط بعد از اولین تعامل کاربر (سیاست autoplay مرورگر).
   ═══════════════════════════════════════════════════════════════ */
(function () {
    'use strict';

    var API_TRACKS = '/api/v5/settings/tracks';
    var STATE_KEY = 'cosmic_vinyl_state';    // {id, t, at}
    var VOL_KEY = 'cosmic_vinyl_volume';
    var RESUME_WINDOW = 2 * 60 * 1000;       // ۲ دقیقه

    var tracks = [];      // ترک‌های فعالِ دارای فایل
    var queue = [];       // منطبق با بخش فعلی
    var curIdx = -1;
    var audio = null;
    var root = null, els = {};
    var currentSection = 'site';
    var userPaused = false;
    var volume = 0.5;
    var hasInteracted = false;
    var pendingSeek = 0;      // موقعیت رزَوْم برای ترک در حال بارگذاری
    var lastSaveAt = 0;
    var warmedId = '';

    /* ─── کمکی ─── */
    function esc(s) {
        var d = document.createElement('div');
        d.appendChild(document.createTextNode(s == null ? '' : String(s)));
        return d.innerHTML;
    }
    function mmss(sec) {
        sec = Math.max(0, Math.floor(sec || 0));
        var m = Math.floor(sec / 60), s = sec % 60;
        return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
    }
    function lsGet(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (_) { return null; } }
    function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} }

    function savedState() {
        var st = lsGet(STATE_KEY);
        if (st && st.id && typeof st.t === 'number' && (Date.now() - (st.at || 0)) < RESUME_WINDOW) return st;
        return null;
    }
    function persistState(force) {
        var now = Date.now();
        if (!force && now - lastSaveAt < 4000) return;
        lastSaveAt = now;
        var t = current();
        if (t && audio && isFinite(audio.currentTime) && audio.currentTime > 2) {
            lsSet(STATE_KEY, { id: t.id, t: audio.currentTime, at: now });
        }
    }
    function clearState() { try { localStorage.removeItem(STATE_KEY); } catch (_) {} }

    /* ─── صف بخش ─── */
    function computeQueue() {
        queue = tracks.filter(function (t) {
            var a = t.assignedTo || [];
            return a.indexOf('all') >= 0 || a.indexOf(currentSection) >= 0 || (!a.length && currentSection === 'site');
        });
        if (!queue.length) {
            queue = tracks.filter(function (t) { return (t.assignedTo || []).indexOf('site') >= 0; });
        }
    }
    function current() { return (curIdx >= 0 && queue[curIdx]) ? queue[curIdx] : null; }
    function findInQueue(id) {
        for (var i = 0; i < queue.length; i++) if (queue[i].id === id) return i;
        return -1;
    }

    /* ─── DOM ─── */
    function build(slot) {
        // چیدمان دو‌خطی: بالا نام+زمان، پایین دیسک-کنترل‌ها-ولوم؛ + مینی‌دکمه ریل
        slot.innerHTML =
            '<div class="vp" id="vinylPlayer">' +
                '<div class="vp-panel" id="vpPanel">' +
                    '<div class="vp-disc"></div>' +
                    '<div class="vp-info" id="vpInfo">' +
                        '<div class="vp-line">' +
                            '<span class="vp-name" id="vpName">—</span>' +
                            '<span class="vp-time"><b id="vpCur">00:00</b> / <span id="vpDur">00:00</span></span>' +
                        '</div>' +
                        '<div class="vp-line">' +
                            '<div class="vp-controls">' +
                                '<div class="vp-btn vp-prev" id="vpPrev" title="قبلی"></div>' +
                                '<div class="vp-btn vp-play" id="vpPlay" title="پخش/مکث"></div>' +
                                '<div class="vp-btn vp-next" id="vpNext" title="بعدی"></div>' +
                            '</div>' +
                            '<input type="range" class="vp-vol" id="vpVol" min="0" max="1" step="0.05" value="' + volume + '" title="بلندی صدا" dir="ltr">' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<div class="vp-progress"><div class="vp-bar" id="vpBar"></div></div>' +
                '<div class="vp-list" id="vpList"></div>' +
            '</div>' +
            '<button class="vp-rail-btn" id="vpRailBtn" title="پخش/توقف موسیقی" aria-label="پخش یا توقف موسیقی">▶</button>';

        root = slot.firstChild;
        els.info = document.getElementById('vpInfo');
        els.panel = document.getElementById('vpPanel');
        els.name = document.getElementById('vpName');
        els.cur = document.getElementById('vpCur');
        els.dur = document.getElementById('vpDur');
        els.bar = document.getElementById('vpBar');
        els.list = document.getElementById('vpList');
        els.play = document.getElementById('vpPlay');
        els.vol = document.getElementById('vpVol');
        els.rail = document.getElementById('vpRailBtn');

        els.play.addEventListener('click', function (e) { e.stopPropagation(); markGesture(); toggle(); });
        document.getElementById('vpPrev').addEventListener('click', function (e) { e.stopPropagation(); markGesture(); step(-1); });
        document.getElementById('vpNext').addEventListener('click', function (e) { e.stopPropagation(); markGesture(); step(1); });
        els.vol.addEventListener('input', function () { markGesture(); setVolume(+this.value); });
        els.rail.addEventListener('click', function (e) { e.stopPropagation(); markGesture(); toggle(); });
        els.panel.addEventListener('click', function (e) {
            if (e.target.closest('.vp-btn, .vp-vol, .vp-name')) return;
            els.list.classList.toggle('show'); renderList();
        });
        els.name.addEventListener('click', function (e) { e.stopPropagation(); els.list.classList.toggle('show'); renderList(); });
        document.addEventListener('click', function (e) {
            if (root && !slot.contains(e.target)) els.list.classList.remove('show');
        });
    }

    function setVolume(v) {
        volume = Math.max(0, Math.min(1, v));
        if (audio) audio.volume = volume;
        lsSet(VOL_KEY, volume);
        refreshPlayIcons();
    }
    function refreshPlayIcons() {
        if (!audio) return;
        var playing = !audio.paused;
        if (els.play) els.play.classList.toggle('is-playing', playing);
        if (els.rail) els.rail.textContent = playing ? '❚❚' : '▶';
    }

    function markGesture() {
        if (hasInteracted) return;
        hasInteracted = true;
        // اگر کاربر بعد از رفرش روی پخش زد، از همان لحظه‌ای که شنیده بود ادامه بده
        if (audio && audio.src && audio.paused && !userPaused) { var p = audio.play(); if (p && p.catch) p.catch(function () {}); }
    }

    /* ─── صوت ─── */
    function ensureAudio() {
        if (audio) return;
        volume = (lsGet(VOL_KEY) != null) ? lsGet(VOL_KEY) : 0.5;
        if (els.vol) els.vol.value = volume;
        audio = new window.Audio();
        audio.preload = 'metadata'; // تا قبل از تعامل کاربر فقط متادیتا می‌آید (بدون دانلود کامل)
        audio.volume = volume;
        audio.addEventListener('loadedmetadata', function () {
            els.dur.textContent = mmss(audio.duration);
            if (pendingSeek > 2 && pendingSeek < (audio.duration || Infinity) - 3) {
                try { audio.currentTime = pendingSeek; } catch (_) {}
            }
            pendingSeek = 0;
        });
        audio.addEventListener('timeupdate', function () {
            els.cur.textContent = mmss(audio.currentTime);
            var pct = (audio.duration > 0) ? (audio.currentTime / audio.duration * 100) : 0;
            els.bar.style.width = pct.toFixed(1) + '%';
            persistState(false);
            maybeWarmNext();
        });
        audio.addEventListener('play', function () { userPaused = false; refreshUI(); });
        audio.addEventListener('pause', function () { persistState(true); refreshUI(); });
        audio.addEventListener('ended', function () { clearState(); step(1, true); });
    }

    /* ترک بعدی را ۲۵ ثانیه زودتر گرم کن تا بدون وقفه وصل شود */
    function maybeWarmNext() {
        if (!audio.duration || queue.length < 2) return;
        if (audio.duration - audio.currentTime > 25) return;
        var nt = queue[(curIdx + 1) % queue.length];
        if (!nt || nt.id === warmedId || nt.id === (current() || {}).id) return;
        warmedId = nt.id;
        try {
            var w = new window.Audio(nt.fileUrl);
            w.preload = 'auto';
            setTimeout(function () { try { w.pause(); w.removeAttribute('src'); } catch (_) {} }, 20000);
        } catch (_) {}
    }

    function playAt(i, autoplay) {
        if (!queue.length) return;
        ensureAudio();
        curIdx = ((i % queue.length) + queue.length) % queue.length;
        var t = queue[curIdx];
        var st = savedState();
        pendingSeek = (st && st.id === t.id) ? st.t : 0;
        audio.preload = (autoplay || hasInteracted) ? 'auto' : 'metadata';
        audio.src = t.fileUrl;
        try { audio.load(); } catch (_) {}
        if (autoplay && !userPaused) { var p = audio.play(); if (p && p.catch) p.catch(function () {}); }
        refreshUI();
    }
    function toggle() {
        if (!queue.length) return;
        ensureAudio();
        if (!audio.src) { playAt(0, true); return; }
        if (audio.paused) { userPaused = false; var p = audio.play(); if (p && p.catch) p.catch(function () {}); }
        else { userPaused = true; audio.pause(); }
        refreshUI();
    }
    function step(d, auto) {
        if (!queue.length) return;
        playAt(curIdx + d, !!auto || (hasInteracted && !userPaused));
    }

    /* ─── UI ─── */
    function refreshUI() {
        if (!root) return;
        var t = current();
        if (!queue.length || !t) { root.classList.add('vp-empty'); return; }
        root.classList.remove('vp-empty');
        els.name.textContent = (t.icon ? t.icon + ' ' : '') + (t.name || '');
        var playing = audio && !audio.paused;
        els.play.classList.toggle('is-playing', playing);
        els.panel.classList.toggle('active', playing);
        if (els.rail) els.rail.textContent = playing ? '❚❚' : '▶';
        renderList();
    }
    function renderList() {
        var html = '<div class="vp-list-title">فهرست پخش</div>';
        queue.forEach(function (t, i) {
            html += '<div class="vp-item' + (i === curIdx ? ' active' : '') + '" data-i="' + i + '">' +
                '<span>' + esc(t.icon || '🎵') + '</span><span class="vp-item-name">' + esc(t.name) + '</span></div>';
        });
        els.list.innerHTML = html;
        els.list.querySelectorAll('.vp-item').forEach(function (el) {
            el.addEventListener('click', function (e) {
                e.stopPropagation();
                markGesture();
                playAt(parseInt(el.dataset.i, 10), true);
            });
        });
    }

    /* ─── داده/بخش ─── */
    function refresh(cb) {
        fetch(API_TRACKS).then(function (r) { return r.ok ? r.json() : null; })
            .then(function (d) {
                tracks = ((d && d.items) || []).filter(function (t) { return t.active !== false && t.fileUrl; });
                applySection();
                if (cb) cb();
            })
            .catch(function () { if (cb) cb(); });
    }

    function applySection() {
        ensureAudio();
        var prevId = (current() || {}).id;
        computeQueue();
        if (!queue.length) {
            try { audio.pause(); audio.removeAttribute('src'); } catch (_) {}
            root && root.classList.add('vp-empty');
            return;
        }
        var keep = findInQueue(prevId);
        if (keep >= 0) { curIdx = keep; refreshUI(); return; }   // همان ترک در بخش جدید هم هست → بدون وقفه ادامه
        var start = 0;
        var st = savedState();
        if (st) { var si = findInQueue(st.id); if (si >= 0) start = si; }
        playAt(start, hasInteracted);   // قبل از تعامل کاربر فقط آماده می‌شود، دانلود سنگین نمی‌شود
    }

    /* ─── API عمومی ─── */
    window.VinylPlayer = {
        setSection: function (key) { currentSection = key || 'site'; applySection(); },
        getSection: function () { return currentSection; },
        setVolume: function (v) { setVolume(v); },
        toggle: function () { markGesture(); toggle(); },
        isPlaying: function () { return !!(audio && !audio.paused); },
        /** آیا برای این بخش فایلی تخصیص داده شده؟ (مدیتیشن می‌پرسد تا سنتز را رد کند) */
        hasFileFor: function (key) {
            return tracks.some(function (t) {
                var a = t.assignedTo || [];
                return t.fileUrl && (a.indexOf('all') >= 0 || a.indexOf(key) >= 0);
            });
        },
        reload: function () { refresh(); },
        refresh: refresh
    };

    /* ─── راه‌اندازی ─── */
    function detectSectionFromHash() {
        var h = location.hash || '';
        var m = h.match(/^#\/app\/([a-z0-9-]+)/i);
        if (m) return m[1];
        var mm = h.match(/#\/([a-z0-9-]+)/i);
        return mm ? mm[1] : 'site';
    }

    var _booted = false;
    function boot() {
        if (_booted) return;
        _booted = true;
        // همیشه داخل سایدبار (در موبایل سایدبار = drawer کشویی، همان‌جا دیده می‌شود)؛
        // شناور گوشه فقط برای صفحاتی که اصلاً سایدبار ندارند
        var sidebar = document.querySelector('.sidebar');
        var host = document.createElement('div');
        if (sidebar) {
            host.className = 'vp-wrap';
            var footer = sidebar.querySelector('.sidebar-footer');
            if (footer) sidebar.insertBefore(host, footer);
            else sidebar.appendChild(host);
        } else {
            document.body.appendChild(host);
        }
        build(host);
        if (!sidebar && root) root.classList.add('vp-float');
        currentSection = detectSectionFromHash();
        refresh();
        window.addEventListener('hashchange', function () {
            var s = detectSectionFromHash();
            if (s !== currentSection) { currentSection = s; applySection(); }
        });
        // اولین تعامل (هر جای صفحه) autoplay بعدی را مجاز می‌کند
        ['pointerdown', 'keydown'].forEach(function (ev) {
            window.addEventListener(ev, function once() { markGesture(); window.removeEventListener(ev, once); }, { passive: true, once: true });
        });
        // قبل ترک صفحه/رفرش: موقعیت را نگه دار
        window.addEventListener('pagehide', function () { persistState(true); });
        document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') persistState(true); });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
})();
