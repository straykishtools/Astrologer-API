/* ================================================================
   KINETICS-COSMIC (installer) — بخش «آسمانِ جنبشی» را در داشبورد
   می‌سازد و کامپوننت‌های کتابخانهٔ Kinetics را به دادهٔ واقعی وصل می‌کند:
   • Inertial Dial   → قطب‌نمای تمرکز روز (از رویدادهای خورشیدی)
   • Bento Expand    → کارت فال امروز (کلیک = باز شدن، بقیه محو)
   • XY Pad + Burst  → ثبت خلق (انرژی/آرامش) با پالس تأیید
   • Prompt Composer + Token Stream + Bounce → پیش‌نمایش چت AI
   منطق فیزیکی در kinetics.js است؛ این فایل فقط مونتاژ می‌کند.
   ================================================================ */
(function () {
'use strict';

function fa(n) { return String(n == null ? '' : n).replace(/[0-9]/g, function (d) { return '۰۱۲۳۴۵۶۷۸۹'[+d]; }); }

var mounted = false, tries = 0, retryTimer = null;

/* لیبل‌های هشت‌گانهٔ قطب‌نما — در مارک‌آپ (تیک‌ها) و wireDial مشترک */
var DIAL_LABELS = ['عشق', 'کار', 'سلامت', 'سفر', 'خلاقیت', 'مراقبه', 'خانواده', 'مطالعه'];

function mount() {
    if (mounted) { if (retryTimer) { clearInterval(retryTimer); retryTimer = null; } return; }
    tries++;
    if (!window.Kinetics) {
        if (tries === 30) console.warn('[Kinetics] موتور kinetics.js در window نیست — لود نشده؟');
        if (tries > 60) clearInterval(retryTimer);
        return;
    }
    /* جای درج: بالای داشبورد (بلافاصله بعد از هدر) — دیده‌شدن تضمینی */
    var page = document.querySelector('.dashboard-page');
    var anchor = page && page.querySelector('.dash-head');
    if (!anchor) {
        if (tries === 30) console.warn('[Kinetics] لنگر .dashboard-page .dash-head پیدا نشد');
        if (tries > 60) clearInterval(retryTimer);
        return;
    }
    try {
        var section = document.getElementById('kineticSky');
        if (!section) {
            section = document.createElement('section');
            section.id = 'kineticSky';
            section.className = 'kx-section';
            section.innerHTML = markup();
            anchor.insertAdjacentElement('afterend', section);
        }
        /* هر کامپوننت جدا — خطای یکی بقیه را نکشد */
        [wireDial, wirePad, wireTalk, wireComposer, wireBento].forEach(function (fn) {
            try { fn(section); } catch (e) { console.warn('[Kinetics]', fn.name, e); }
        });
        mounted = true;
        if (retryTimer) { clearInterval(retryTimer); retryTimer = null; }
        console.info('[Kinetics] ⚡ آسمانِ جنبشی mount شد');
    } catch (e) {
        console.error('[Kinetics] mount ناموفق:', e);
        if (tries > 60) clearInterval(retryTimer);
    }
}

function markup() {
    return ''
    + '<div class="co-section-head"><div class="co-section-title">⚡ آسمانِ جنبشی</div>'
    +   '<div class="co-section-sub">ابزارهای تعاملی فیزیکی (Kinetics) — قطب‌نما، بن‌تو، ثبت خلق و پیش‌نمایش چت</div></div>'
    + '<div class="kx-grid">'

    /* ── A) Inertial Dial — هشت تیکِ نام‌دار دور صفحه ── */
    + '<div class="kx-card"><h4>🧭 تمرکزِ امروزِ من</h4>'
    +   '<div class="k-dial k-phys" id="kxDial">'
    +     '<div class="k-dial-ticks">' + ticksHTML() + '</div>'
    +     '<div class="k-dial-needle"></div><div class="k-dial-hub"></div>'
    +     '<div class="k-dial-readout">بچرخان…</div>'
    +   '</div>'
    +   '<p class="kx-note">قرص را بچرخان و رها کن — عقربه با اینرسی و فنر روی تمرکزِ روز می‌ایستد</p>'
    + '</div>'

    /* ── B) Bento — فال امروز (کلیک = باز شدن) ── */
    + '<div class="kx-card"><h4>🃏 فالِ امروز (بن‌تو)</h4>'
    +   '<div class="k-bento k-phys" id="kxBento">'
    +     '<div class="k-bento-cell" style="grid-column:1/-1"><div><b>🃏</b>کارت روز</div></div>'
    +     '<div class="k-bento-cell"><div><b>✦</b>بارش</div></div>'
    +     '<div class="k-bento-cell"><div><b>◐</b>سایه</div></div>'
    +   '</div>'
    +   '<p class="kx-note">روی هر خانه «کلیک» کن — خانهٔ هدف باز می‌شود و بقیه محو/تار می‌شوند</p>'
    + '</div>'

    /* ── C) XY Pad + Like Burst ── */
    + '<div class="kx-card"><h4>🙂 خلقِ امروز</h4>'
    +   '<div class="k-xypad k-phys" id="kxPad">'
    +     '<div class="k-xygrid"></div><div class="k-xypuck" tabindex="0"></div>'
    +     '<div class="k-xyread">0 · 0</div>'
    +     '<div class="k-axlabel y-plus">آرام</div><div class="k-axlabel y-minus">پرتنش</div>'
    +     '<div class="k-axlabel x-plus">پرانرژی</div><div class="k-axlabel x-minus">خواب‌آلود</div>'
    +   '</div>'
    +   '<div class="kx-mood-row">'
    +     '<button class="co-btn co-btn--moon k-burst" id="kxMood" type="button">♡ ثبت خلق</button>'
    +     '<span class="kx-mood-log" id="kxMoodLog"></span>'
    +   '</div>'
    + '</div>'

    /* ── D) Prompt Composer + Token Stream + Bounce ── */
    + '<div class="kx-card"><h4>🎙️ بریفینگِ صوتیِ روز</h4>'
    +   '<div class="k-talk k-phys" id="kxTalk">'
    +     '<div class="k-talk-wave"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>'
    +     '<button class="k-talk-btn" type="button">🎙️ نگه‌دار تا بشنوی</button>'
    +     '<div class="k-talk-status"></div>'
    +   '</div>'
    +   '<p class="kx-note">انگشت را نگه‌دار — موج زنده می‌شود و بریفینگِ آسمانِ امروز پخش می‌گردد</p>'
    + '</div>'

    /* ── E) Prompt Composer + Token Stream + Bounce ── */
    + '<div class="kx-card" style="grid-column:1/-1"><h4>🤖 چتِ اخترشناس (پیش‌نمایش)</h4>'
    +   '<div class="k-tokens k-phys" id="kxStream" style="width:100%"></div>'
    +   '<div class="k-composer k-phys" id="kxComposer" style="width:100%;max-width:560px">'
    +     '<textarea rows="1" placeholder="سؤالت را از کیهان بپرس… (این پیش‌نمایشِ رابط است)"></textarea>'
    +     '<span class="k-count">0</span>'
    +     '<button class="k-send" type="button" title="ارسال">➤</button>'
    +   '</div>'
    + '</div>'

    + '</div>';
}

/* ── A) Dial — قطب‌نمای تمرکز روز + هایلایت تیک فعال ── */
function wireDial(root) {
    var dial = root.querySelector('#kxDial');
    Kinetics.mountDial(dial, { labels: DIAL_LABELS, onFocus: function (i, t) {
        var ro = dial.querySelector('.k-dial-readout');
        if (ro) ro.textContent = 'تمرکز: ' + (t || '');
        dial.querySelectorAll('.k-dial-ticks b').forEach(function (b) {
            b.classList.toggle('on', +b.getAttribute('data-tick') === i);
        });
    } });
}

/* ── C) XY pad + burst ── */
function wirePad(root) {
    Kinetics.mountPuck(root.querySelector('#kxPad'), {
        onCommit: function (x, y) {
            var log = root.querySelector('#kxMoodLog');
            if (!log) return;
            var e = x >= 0 ? 'پرانرژی' : 'آرام';
            var m = y >= 0 ? 'خوش' : 'سنگین';
            log.textContent = 'ثبت شد → ' + m + ' · ' + e + ' (' + fa(x) + '،' + fa(y) + ')';
            saveMood(x, y);
        }
    });
    var moodBtn = root.querySelector('#kxMood');
    moodBtn.addEventListener('click', function () {
        moodBtn.classList.add('liked', 'pop');
        moodBtn.textContent = '♥ خلق ثبت شد';
        Kinetics.burst(moodBtn);
        setTimeout(function () {
            moodBtn.classList.remove('pop');
            moodBtn.classList.remove('liked');
            moodBtn.textContent = '♡ ثبت خلق';
        }, 1400);
    });
}

/* ── D) Hold to Talk — بریفینگ صوتی (مرجع CoMoon) ── */
function wireTalk(root) {
    Kinetics.mountTalk(root.querySelector('#kxTalk'), {
        getText: function () {
            if (window.CoMoon) {
                var now = Date.now();
                var info = CoMoon.phaseInfo(CoMoon.phaseFromNow(now));
                var nxt = CoMoon.nextPhase(CoMoon.phaseFromNow(now));
                return 'امروز ماه ' + info.fa + ' است با ' + fa(info.illuminationPct) + ' درصد روشنایی. '
                    + 'رویداد بعدی ' + nxt.fa + '، حدود ' + fa(Math.round(nxt.days)) + ' روز دیگر. '
                    + 'نیتِ خود را با آرامش پیش ببر.';
            }
            return 'آسمان امروز در خدمتِ توست؛ نیتِ خود را با آرامش پیش ببر.';
        }
    });
}

/* ── E) composer + token stream + bounce (چت AI با fallback) ──
   هستهٔ پرس‌وجو در makeAstroTalker مشترک است: داشبورد و اوربِ شناور
   هر دو از یک history و یک endpoint استفاده می‌کنند. */
function makeAstroTalker(stream, greet) {
    var history = [];   // نوبت‌های [role,content] برای مکالمهٔ چندتایی

    stream.classList.remove('k-tokens');    /* استایل کارتِ توکن → ستون حبابی */
    stream.classList.add('cc-msgs');

    function scrollDown() {
        requestAnimationFrame(function () { stream.scrollTop = stream.scrollHeight; });
    }
    /* حباب ساده (متن خالص) */
    function addBubble(role, text) {
        var row = document.createElement('div');
        row.className = 'cc-msg cc-msg--' + (role === 'user' ? 'me' : 'ai');
        var b = document.createElement('div');
        b.className = 'cc-bubble';
        b.textContent = text;
        row.appendChild(b);
        stream.appendChild(row);
        scrollDown();
        return b;
    }
    /* حباب AI با موج نورانی کلمات (باز استفاده از Kinetics.tokens) */
    function addAiBubble(text, hl) {
        var row = document.createElement('div');
        row.className = 'cc-msg cc-msg--ai';
        var b = document.createElement('div');
        b.className = 'cc-bubble';
        var w = document.createElement('span');
        w.className = 'cc-words';
        b.appendChild(w);
        row.appendChild(b);
        stream.appendChild(row);
        Kinetics.tokens(w, text, hl ? { hl: hl } : undefined);
        scrollDown();
    }
    /* سه‌نقطه «در حال نوشتن» داخل حباب AI */
    function addTyping() {
        var row = document.createElement('div');
        row.className = 'cc-msg cc-msg--ai';
        row.innerHTML = '<div class="cc-bubble"><span class="k-bounce"><i></i><i></i><i></i></span></div>';
        stream.appendChild(row);
        scrollDown();
        return row;
    }

    var HL = /(ماه|خورشید|مریخ|ونوس|زحل|برج|خانه|نیت|اوراکل|یوگا|تمرین|آسانا|تنفس|مدیتیشن|کارما|سطح)/;

    function ask(text) {
        addBubble('user', text);
        var typing = addTyping();

        /* اگر همین نشست چارت گرفته، زمینه‌اش بی‌صدا اضافه می‌شود — کاربر چیزی نمی‌فرستد */
        var ctx = '';
        try { ctx = (window.currentContext || '').slice(0, 2000); } catch (e) {}
        fetch('/api/v5/astro-chat', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text, history: history.slice(-6), context: ctx })
        })
        .then(function (r) { return r.ok ? r.json() : Promise.reject(new Error('http')); })
        .then(function (d) {
            var reply = (d && d.reply) || '';
            if (!reply) reply = 'کیهان پاسخی نداشت — دوباره بپرس ✦';
            history.push({ role: 'user', content: text });
            history.push({ role: 'assistant', content: reply });
            typing.remove();
            addAiBubble(reply, HL);
        })
        .catch(function () {
            typing.remove();
            addAiBubble('کیهان در پاسخ به «' + text.slice(0, 24) + '»: امروز انرژیِ ماه را با آرامش پیش ببر ✦', /(ماه|نیت|آرامش)/);
        });
    }
    if (greet) addAiBubble('سلام — کاسمیک اوراکل در خدمتِ پرسش‌های کیهانی و یوگاییِ توست ✦', /(اوراکل|کیهانی|یوگا)/);
    return { ask: ask, history: history };
}

function wireComposer(root) {
    var stream = root.querySelector('#kxStream');
    var talker = makeAstroTalker(stream, true);
    Kinetics.mountComposer(root.querySelector('#kxComposer'), { onSubmit: talker.ask });
}

/* ── B) bento فال امروز — از سرویس تاروت ── */
/* ── B) bento فال امروز — کلیک‌محور (لرزشِ hover-safe) ── */
function wireBento(root) {
    var bento = root.querySelector('#kxBento');
    if (!bento) return;
    var cells = [].slice.call(bento.querySelectorAll('.k-bento-cell'));
    bento.addEventListener('click', function (e) {
        var cell = e.target.closest('.k-bento-cell');
        if (!cell || cell === bento) return;
        var was = cell.classList.contains('expanded');
        cells.forEach(function (c) { c.classList.remove('expanded'); });
        if (!was) cell.classList.add('expanded');
    });
    hydrateBento(bento);
}

/* هشت تیکِ نام‌دار دور صفحهٔ قطب‌نما — i·45°، برچسب با rotate معکوس صاف می‌ماند */
function ticksHTML() {
    var h = '';
    for (var i = 0; i < DIAL_LABELS.length; i++) {
        h += '<span style="--a:' + (i * 45) + 'deg"><b data-tick="' + i + '">' + DIAL_LABELS[i] + '</b></span>';
    }
    return h;
}

/* بن‌تو را با فال روز (endpoint موجود) پُر می‌کند؛ در نبودش متن پیش‌فرض */
function hydrateBento(bento) {
    if (!bento) return;
    var cells = bento.querySelectorAll('.k-bento-cell');
    fetch('/api/v5/tarot/daily', { headers: { 'Accept': 'application/json' } })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (j) {
            var t = (j && j.status === 'success' && j.data) ? j.data : null;
            if (!t) { fallbackBento(cells); return; }
            var card = t.card || {};
            var name = card.name || 'نامعلوم';
            var kw = (t.keywords && t.keywords.length ? t.keywords : ['انرژی', 'شهود', 'صبر']);
            var rev = t.is_reversed;
            setCell(cells[0], '🃏', name + (rev ? ' (وارونه)' : ''), (t.deep_interp || kw.join(' · ')));
            setCell(cells[1], '✦', 'کلیدواژه', kw.slice(0, 3).join(' · '));
            setCell(cells[2], '◐', 'سایه', rev ? 'انرژیِ درونی — صبر پیش از اقدام' : 'جریانِ روشن — زمانِ حرکت');
        })
        .catch(function () { fallbackBento(cells); });
}
function fallbackBento(cells) {
    setCell(cells[0], '🃏', 'فالِ روز', 'سرویس تاروت را باز کن تا کارتِ امروز آشکار شود');
    setCell(cells[1], '✦', 'بارش', 'انرژی‌های مثبت در کمینِ تصمیم‌های کوچک');
    setCell(cells[2], '◐', 'سایه', 'عجله را رها کن؛ آهستگی برنده است');
}
function setCell(cell, icon, title, desc) {
    if (!cell) return;
    cell.innerHTML = '<div><b>' + icon + ' ' + title + '</b><span class="k-bd">' + desc + '</span></div>';
}

/* خلق به localStorage (تا بک‌اند آماده شود) */
function saveMood(x, y) {
    try {
        var hist = JSON.parse(localStorage.getItem('co_moods') || '[]');
        hist.push({ x: x, y: y, at: Date.now() });
        if (hist.length > 60) hist = hist.slice(-60);
        localStorage.setItem('co_moods', JSON.stringify(hist));
    } catch (e) {}
}

/* ── چت اخترشناس در تاپ‌بار — مستقل از داشبورد، همه‌جا کار می‌کند ── */
function wireChatPop() {
    var btn = document.getElementById('coChatBtn');
    var pop = document.getElementById('coChatPop');
    if (!btn || !pop || btn._coWired) return;
    btn._coWired = true;
    var talker = null;

    /* پاپ‌اور را دقیقاً زیرِ دکمه و داخل صفحه قرار می‌دهد */
    function position() {
        var r = btn.getBoundingClientRect();
        var pw = pop.offsetWidth || 380;
        var ph = pop.offsetHeight || 320;
        var m = 12, vw = window.innerWidth, vh = window.innerHeight;
        var left = Math.min(Math.max(m, r.right - pw), vw - pw - m);
        var top = r.bottom + 8;
        if (top + ph > vh - m) top = Math.max(m, r.top - ph - 8);   /* جا نبود → بالای دکمه */
        pop.style.left = Math.round(left) + 'px';
        pop.style.right = 'auto';
        pop.style.top = Math.round(top) + 'px';
    }
    function open() {
        pop.classList.add('open');
        position();
        requestAnimationFrame(function () { pop.classList.add('show'); });
        if (!talker && window.Kinetics) {
            talker = makeAstroTalker(document.getElementById('coChatStream'), true);
            Kinetics.mountComposer(document.getElementById('coChatComposer'), { onSubmit: talker.ask });
        }
        var ta = pop.querySelector('textarea');
        if (ta) setTimeout(function () { ta.focus(); }, 120);
    }
    function close() { pop.classList.remove('open', 'show'); }
    btn.addEventListener('click', function (e) {
        e.stopPropagation();
        pop.classList.contains('open') ? close() : open();
    });
    var x = document.getElementById('coChatClose');
    if (x) x.addEventListener('click', close);
    pop.addEventListener('click', function (e) { e.stopPropagation(); });
    document.addEventListener('click', function (e) {
        if (pop.classList.contains('open') && !pop.contains(e.target) && !btn.contains(e.target)) close();
    });
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && pop.classList.contains('open')) close();
    });
    window.addEventListener('resize', function () { if (pop.classList.contains('open')) position(); });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
} else { boot(); }
function boot() {
    console.info('[Kinetics] installer loaded — waiting for engine + dashboard anchor…');
    try { wireChatPop(); } catch (e) { console.warn('[Kinetics] chat pop', e); }
    mount();                                   /* تلاش فوری */
    retryTimer = setInterval(function () { mount(); try { wireChatPop(); } catch (e) {} }, 400);      /* تا موفقیت ادامه بده */
}
/* داشبورد با روتینگ عوض می‌شود — دوباره چک کن */
window.addEventListener('hashchange', function () { setTimeout(mount, 250); });
})();
