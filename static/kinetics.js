/* ================================================================
   KINETICS-COSMIC (JS) — موتور فیزیک + راه‌انداز کامپوننت‌ها
   اینتگرال فنر از physics-demo.js: a = tension·(target−x) − friction·v
   با ۴ ساب‌استپ برای پایداری. هیچ animate()/ease خطی اینجا نیست.
   API: window.Kinetics = { spring, mountDial, mountPuck, burst, mountComposer, tokens }
   ================================================================ */
var Kinetics = (function () {
'use strict';

var reduce = false;
try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

/* ── حلقهٔ فنر (از physics-demo.js) ──
   از x0 به target با tension/friction حرکت می‌کند؛ هر فریم cb(value). */
function spring(opts) {
    var x = opts.from, target = opts.to, v = opts.v || 0;
    var tension = opts.tension || 320, friction = opts.friction || 24;
    var dt = 1 / 60, settle = 0, raf;
    function step() {
        for (var i = 0; i < 4; i++) {                 /* ساب‌استپِ پایداری */
            var a = tension * (target - x) - friction * v;
            v += a * (dt / 4);
            x += v * (dt / 4);
        }
        opts.onFrame && opts.onFrame(x, v);
        var rest = Math.abs(target - x) < 0.001 && Math.abs(v) < 0.001;
        if (rest) settle++; else settle = 0;
        if (settle < 6 && !reduce) raf = requestAnimationFrame(step);
        else { opts.onFrame && opts.onFrame(target, 0); opts.onSettle && opts.onSettle(target); }
    }
    if (reduce) { opts.onFrame && opts.onFrame(target, 0); opts.onSettle && opts.onSettle(target); return function () {}; }
    raf = requestAnimationFrame(step);
    return function () { cancelAnimationFrame(raf); };
}

/* ═══ Inertial Dial — چرخش با مومنتوم، عقربه با فنر به خانه می‌نشیند ═══ */
function mountDial(root, opts) {
    opts = opts || {};
    var needle = root.querySelector('.k-dial-needle');
    var readout = root.querySelector('.k-dial-readout');
    var labels = opts.labels || [];
    var angle = 0, cancel = null;

    function setAngle(a, animate) {
        angle = a;
        if (animate) {
            cancel && cancel();
            cancel = spring({ from: readAngle(needle), to: a, tension: 160, friction: 16,
                onFrame: function (v) { needle.style.transform = 'translateY(-20px) rotate(' + v + 'deg)'; },
                onSettle: function (v) { needle.style.transform = 'translateY(-20px) rotate(' + v + 'deg)'; showResult(v); } });
        } else { needle.style.transform = 'translateY(-20px) rotate(' + a + 'deg)'; }
    }
    function readAngle(el) {
        var m = (el.style.transform || '').match(/rotate\(([-\d.]+)deg\)/);
        return m ? parseFloat(m[1]) : 0;
    }
    function showResult(a) {
        var idx = Math.round(((a % 360) + 360) % 360 / (360 / Math.max(labels.length, 1))) % Math.max(labels.length, 1);
        if (readout && labels.length) readout.textContent = labels[idx] || '';
        opts.onFocus && opts.onFocus(idx, labels[idx]);
    }
    var dragging = false, startA = 0, lastA = 0, vel = 0;
    function pointerAngle(e) {
        var r = root.getBoundingClientRect();
        return Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180 / Math.PI;
    }
    root.addEventListener('pointerdown', function (e) {
        dragging = true; vel = 0; root.classList.add('dragging');
        startA = pointerAngle(e) - angle; lastA = pointerAngle(e);
        cancel && cancel();
        root.setPointerCapture && root.setPointerCapture(e.pointerId);
    });
    root.addEventListener('pointermove', function (e) {
        if (!dragging) return;
        var pa = pointerAngle(e);
        angle = pa - startA; vel = pa - lastA; lastA = pa;
        setAngle(angle, false);
    });
    function release() {
        if (!dragging) return;
        dragging = false; root.classList.remove('dragging');
        var thrown = angle + vel * 9;                 /* مومنتوم اینرسی */
        setAngle(thrown, true);
    }
    root.addEventListener('pointerup', release);
    root.addEventListener('pointercancel', release);
    root.setAttribute('tabindex', '0');
    root.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowLeft') setAngle(angle - 15, true);
        else if (e.key === 'ArrowRight') setAngle(angle + 15, true);
    });
    setAngle(0, false);
    return { set: function (a) { setAngle(a, true); } };
}

/* ═══ Kinetic XY Puck — درگ + پرش فنری به نقطه (ریاضی از main.js) ═══ */
function mountPuck(root, opts) {
    opts = opts || {};
    var puck = root.querySelector('.k-xypuck');
    var readout = root.querySelector('.k-xyread');
    var dragging = false;
    function set(x, y, animate) {
        puck.style.setProperty('--x', x); puck.style.setProperty('--y', y);
        if (readout) readout.textContent = (x >= 0 ? '+' : '') + x + ' · ' + (y >= 0 ? '+' : '') + y;
        opts.onChange && opts.onChange(x, y);
    }
    function pos(e) {
        var r = root.getBoundingClientRect();
        var hw = r.width / 2 - 16, hh = r.height / 2 - 16;
        return {
            x: Math.round(Math.max(-hw, Math.min(hw, e.clientX - r.left - r.width / 2))),
            y: Math.round(Math.max(-hh, Math.min(hh, e.clientY - r.top - r.height / 2)))
        };
    }
    root.addEventListener('pointerdown', function (e) {
        dragging = true; root.classList.add('dragging');
        root.setPointerCapture && root.setPointerCapture(e.pointerId);
        var p = pos(e); set(p.x, p.y, false);
    });
    root.addEventListener('pointermove', function (e) {
        if (dragging) { var p = pos(e); set(p.x, p.y, false); }
    });
    function up() {
        if (!dragging) return;
        dragging = false; root.classList.remove('dragging');
        opts.onCommit && opts.onCommit(
            Number(puck.style.getPropertyValue('--x')) || 0,
            Number(puck.style.getPropertyValue('--y')) || 0);
    }
    root.addEventListener('pointerup', up);
    root.addEventListener('pointercancel', up);
}

/* ═══ Like Burst — حلقهٔ ذرات شعاعی (از main.js کارت ۱۱) ═══ */
function burst(host, opts) {
    opts = opts || {};
    var n = opts.count || 10;
    for (var i = 0; i < n; i++) {
        var p = document.createElement('span');
        p.className = 'k-particle';
        var ang = (Math.PI * 2 * i) / n;
        var d = 34 + Math.random() * 22;
        p.style.setProperty('--tx', (Math.cos(ang) * d).toFixed(1) + 'px');
        p.style.setProperty('--ty', (Math.sin(ang) * d).toFixed(1) + 'px');
        host.appendChild(p);
        (function (el) { setTimeout(function () { el.remove(); }, 650); })(p);
    }
}

/* ═══ Prompt Composer — رشد خودکار + commit فنری (از main.js) ═══ */
function mountComposer(root) {
    var input = root.querySelector('textarea');
    var send = root.querySelector('.k-send');
    var count = root.querySelector('.k-count');
    function grow() {
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 74) + 'px';
        root.classList.toggle('ready', input.value.trim().length > 0);
        if (count) count.textContent = input.value.length;
    }
    function commit() {
        if (!root.classList.contains('ready')) return;
        var val = input.value.trim();
        root.classList.add('sending');
        (Kinetics.onSubmit || function () {})(val);
        setTimeout(function () { root.classList.remove('sending'); input.value = ''; grow(); input.focus(); }, 420);
    }
    input.addEventListener('input', grow);
    input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commit(); }
    });
    send.addEventListener('click', commit);
}

/* ═══ Hold to Talk — نگه‌دار تا بشنوی (کارت ۵۰ + speechSynthesis) ═══
   pointerdown = موج زنده + شروع گفتار؛ pointerup = قطع و وضعیت «پخش‌شده». */
function mountTalk(root, opts) {
    opts = opts || {};
    var btn = root.querySelector('.k-talk-btn');
    var live = false, timer = null;
    function speak() {
        if (!('speechSynthesis' in window) || !opts.getText) return false;
        try {
            window.speechSynthesis.cancel();
            var u = new SpeechSynthesisUtterance(opts.getText());
            u.lang = 'fa-IR'; u.rate = 1;
            u.onend = u.onerror = function () { if (live) end(true); };
            window.speechSynthesis.speak(u);
            return true;
        } catch (e) { return false; }
    }
    function start(e) {
        if (e && e.preventDefault && e.cancelable !== false) e.preventDefault();
        if (live) return;
        live = true;
        root.classList.remove('sent'); root.classList.add('live');
        var st = root.querySelector('.k-talk-status');
        if (st) { st.textContent = 'در حال پخش بریفینگ…'; st.style.color = 'var(--co-gold-300,#ecd9a0)'; }
        var ok = speak();
        if (!ok) setTimeout(function () { end(); }, 1600);   /* بدون موتور صدا: شبیه‌سازی موج */
    }
    function end(natural) {
        if (!live) return;
        live = false;
        root.classList.remove('live'); root.classList.add('sent');
        try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch (e) {}
        var st = root.querySelector('.k-talk-status');
        if (st) { st.textContent = natural ? 'پخش شد ✓' : 'پخش شد ✓'; st.style.color = ''; }
        clearTimeout(timer);
        timer = setTimeout(function () { root.classList.remove('sent'); }, 1200);
    }
    btn.addEventListener('pointerdown', function (e) { btn.setPointerCapture && btn.setPointerCapture(e.pointerId); start(e); });
    btn.addEventListener('pointerup', function () { end(); });
    btn.addEventListener('pointercancel', function () { end(); });
    btn.addEventListener('pointerleave', function () { if (live) end(); });
    btn.setAttribute('tabindex', '0');
    btn.addEventListener('keydown', function (e) {
        if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) start(e);
    });
    btn.addEventListener('keyup', function (e) {
        if (e.key === ' ' || e.key === 'Enter') end();
    });
}

/* ═══ Token Stream — کاسکید فنری توکن‌ها (کارت New) ═══ */
function tokens(host, str, opts) {
    opts = opts || {};
    host.innerHTML = '';
    var parts = str.split(/(\s+)/).filter(function (s) { return s.trim().length; });
    parts.forEach(function (w, i) {
        var s = document.createElement('span');
        s.textContent = w;
        if (opts.hl && opts.hl.test && opts.hl.test(w)) s.classList.add('hl');
        s.style.animationDelay = (i * 0.09).toFixed(2) + 's';
        host.appendChild(s);
    });
}

/* ⚠ باید return شود: ساختار `var Kinetics = (function(){...})()` بدون return،
   مقدار window.Kinetics را با undefined بازنویسی می‌کرد (علت mounted‌نشدن). */
return window.Kinetics = {
    spring: spring, mountDial: mountDial, mountPuck: mountPuck,
    burst: burst, mountComposer: mountComposer, tokens: tokens, mountTalk: mountTalk,
    reduce: reduce, onSubmit: null
};
})();
