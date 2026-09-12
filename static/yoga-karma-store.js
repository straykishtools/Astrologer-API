// ================================================================
//  YOGA KARMA STORE — فروشگاه پس‌زمینه‌های استودیو کلاسیک
//  کاملاً خوداتکا: فهرست ۱۳ محیط داخل همین فایل embed شده (از
//  static/yoga-data/backgrounds.json) — هیچ وابستگی به بارگذاری
//  دادهٔ دیگر ندارد و همیشه رندر می‌شود.
//  خرید با کارما (قیمت ×۲) و انتخاب محیط که مستقیم روی استودیو
//  کلاسیک اعمال می‌شود (py_unlocked / py_current_bg).
// ================================================================
var YogaKarmaStore = (function () {
'use strict';

var COST_MULT = 2;   // کارما موردنیاز تصاویر ۲ برابر شده

/* نام فارسی محیط‌ها — همان BG_FA استودیو کلاسیک */
var BG_FA = {
    Home: 'خانه', Studio: 'استودیو', Office: 'دفتر', Ocean: 'اقیانوس', Desert: 'کویر',
    Mountain: 'کوه', Dojo: 'دوجو', Temple: 'معبد', Palace: 'کاخ',
    Shiva: 'شیوا', Vishnu: 'ویشنو', Buddha: 'بودا', 'Samādhi': 'سماادی',
};

/* ۱۳ محیط — embed شده از static/yoga-data/backgrounds.json */
var BACKGROUNDS = [
    { name: 'Home',    backgroundname: 'l1_home',    color: '#787f99', cost: 0,   locked: false },
    { name: 'Studio',  backgroundname: 'l1_studio',  color: '#b6a2c4', cost: 0,   locked: false },
    { name: 'Office',  backgroundname: 'l1_office',  color: '#2b5878', cost: 0,   locked: false },
    { name: 'Ocean',   backgroundname: 'l2_ocean',   color: '#1b4b84', cost: 3,   locked: true },
    { name: 'Desert',  backgroundname: 'l2_desert',  color: '#a64b00', cost: 3,   locked: true },
    { name: 'Mountain',backgroundname: 'l2_mountain',color: '#676249', cost: 3,   locked: true },
    { name: 'Dojo',    backgroundname: 'l3_dojo',    color: '#2a0400', cost: 9,   locked: true },
    { name: 'Temple',  backgroundname: 'l3_temple',  color: '#4d0000', cost: 9,   locked: true },
    { name: 'Palace',  backgroundname: 'l3_palace',  color: '#442b18', cost: 9,   locked: true },
    { name: 'Shiva',   backgroundname: 'l4_shiva',   color: '#111e00', cost: 27,  locked: true },
    { name: 'Vishnu',  backgroundname: 'l4_vishnu',  color: '#130900', cost: 27,  locked: true },
    { name: 'Buddha',  backgroundname: 'l4_buddha',  color: '#132820', cost: 27,  locked: true },
    { name: 'Samādhi', backgroundname: 'l5_samadhi', color: '#230000', cost: 108, locked: true },
];

function getBackgrounds() {
    /* اگر YOGA_DATA آماده بود از آن استفاده کن (منبع زنده)، وگرنه embed */
    var live = (window.YOGA_DATA && window.YOGA_DATA.backgrounds) || [];
    return live.length ? live : BACKGROUNDS;
}

function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
}
function faNum(n) {
    return String(n == null ? 0 : n).replace(/[0-9]/g, function (d) { return '۰۱۲۳۴۵۶۷۸۹'[+d]; });
}
function classicDB() {
    try {
        return {
            karma: JSON.parse(localStorage.getItem('py_karma') || '0') || 0,
            unlocked: JSON.parse(localStorage.getItem('py_unlocked') || '["Home","Studio","Office"]') || [],
            current: JSON.parse(localStorage.getItem('py_current_bg') || '"Home"') || 'Home',
        };
    } catch (e) { return { karma: 0, unlocked: [], current: 'Home' }; }
}
function saveDB(db) {
    try {
        localStorage.setItem('py_karma', JSON.stringify(db.karma));
        localStorage.setItem('py_unlocked', JSON.stringify(db.unlocked));
        localStorage.setItem('py_current_bg', JSON.stringify(db.current));
    } catch (e) {}
}
function tnUrl(b) {
    return 'static/yoga-data/resources/res/drawable-mdpi/bg_' + (b.backgroundname || 'l1_home') + '_tnstore.jpg';
}
function fullUrl(b) {
    return 'static/yoga-data/resources/res/drawable-large-xhdpi/bg_' + (b.backgroundname || 'l1_home') + '.jpg';
}

function render() {
    var host = document.getElementById('yogaKarmaStorePanel');
    if (!host) return;
    try {
        renderInner(host);
    } catch (e) {
        host.innerHTML = '<p class="yp-note">⚠ نمایش فروشگاه ناموفق بود: ' + esc(e.message || e) + '</p>';
        if (window.console && console.error) console.error('[YogaKarmaStore]', e);
    }
}

function renderInner(host) {
    var bgs = getBackgrounds();
    var db = classicDB();
    var karmaRow =
        '<div class="pks-karma">' +
            '<span class="pks-karma-num">' + faNum(db.karma) + '</span>' +
            '<span class="pks-karma-lbl">امتیاز کارما شما</span>' +
            '<button class="yp-classic-btn" data-pks-open-classic style="margin-right:auto">🎧 ورود به استودیو کلاسیک</button>' +
        '</div>' +
        '<p class="pks-hint">با هر ۱۵ دقیقه تمرین کامل در استودیو کلاسیک ۱ کارما می‌گیرید. این‌ها همان محیط‌های استودیو کلاسیک‌اند — خرید و انتخاب از همین‌جا، بلافاصله در استودیو اعمال می‌شود.</p>';

    var cards = bgs.map(function (b) {
        var owned = !b.locked || db.unlocked.indexOf(b.name) >= 0;
        var isCurrent = db.current === b.name;
        var cost = (b.cost || 0) * COST_MULT;
        var state;
        if (isCurrent) state = '<button class="pks-btn current" disabled>✓ محیط فعلی</button>';
        else if (owned) state = '<button class="pks-btn select" data-pks-select="' + esc(b.name) + '">انتخاب</button>';
        else state = '<button class="pks-btn buy" data-pks-buy="' + esc(b.name) + '"' +
                     (db.karma < cost ? ' disabled title="کارما کافی ندارید"' : '') +
                     '>🪷 ' + faNum(cost) + '</button>';
        return '<div class="pks-card' + (isCurrent ? ' current' : '') + '">' +
            '<div class="pks-thumb-wrap">' +
                '<img class="pks-thumb" loading="lazy" src="' + esc(tnUrl(b)) + '" alt="' + esc(BG_FA[b.name] || b.name) + '" ' +
                    'data-pks-view="' + esc(b.name) + '">' +
                (owned ? '' : '<span class="pks-lock">🔒</span>') +
            '</div>' +
            '<div class="pks-meta">' +
                '<span class="pks-name">' + esc(BG_FA[b.name] || b.name) + '</span>' +
                state +
            '</div>' +
        '</div>';
    }).join('');

    host.innerHTML =
        '<div class="pks-wrap">' +
            '<div class="pks-head"><h3>🪷 فروشگاه کارما</h3>' +
            '<span class="pks-sub">محیط‌های استودیو کلاسیک — خرید و انتخاب</span></div>' +
            karmaRow +
            '<div class="pks-grid">' + cards + '</div>' +
        '</div>' +
        '<div class="pks-viewer" id="pksViewer" style="display:none;">' +
            '<div class="pks-viewer-card">' +
                '<img id="pksViewerImg" alt="">' +
                '<div class="pks-viewer-name" id="pksViewerName"></div>' +
                '<button class="pks-btn" id="pksViewerClose">بستن</button>' +
            '</div>' +
        '</div>';
}

function bind() {
    var host = document.getElementById('yogaKarmaStorePanel');
    if (!host || host._pksBound) return;
    host._pksBound = true;
    host.addEventListener('click', function (e) {
        /* 🎧 ورود به استودیو کلاسیک (لابی) */
        if (e.target.closest('[data-pks-open-classic]')) {
            if (window.YogaClassicModal) window.YogaClassicModal.open('');
            return;
        }
        var view = e.target.closest('[data-pks-view]');
        if (view && e.target.classList.contains('pks-thumb')) {
            var bgs = getBackgrounds();
            var b = bgs.filter(function (x) { return x.name === view.getAttribute('data-pks-view'); })[0];
            if (b) {
                var v = document.getElementById('pksViewer');
                document.getElementById('pksViewerImg').src = fullUrl(b);
                document.getElementById('pksViewerName').textContent = BG_FA[b.name] || b.name;
                v.style.display = 'grid';
            }
            return;
        }
        if (e.target.id === 'pksViewerClose' || e.target.id === 'pksViewer') {
            document.getElementById('pksViewer').style.display = 'none';
            return;
        }
        var buy = e.target.closest('[data-pks-buy]');
        if (buy) {
            purchase(buy.getAttribute('data-pks-buy'));
            return;
        }
        var sel = e.target.closest('[data-pks-select]');
        if (sel) {
            select(sel.getAttribute('data-pks-select'));
        }
    });
}

function purchase(name) {
    var bgs = getBackgrounds();
    var b = bgs.filter(function (x) { return x.name === name; })[0];
    if (!b) return;
    var db = classicDB();
    var cost = (b.cost || 0) * COST_MULT;
    if (db.karma < cost) { if (window.showToast) window.showToast('کارما کافی ندارید — تمرین کنید! 🪷', 'info'); return; }
    db.karma -= cost;
    db.unlocked.push(b.name);
    db.current = b.name;
    saveDB(db);
    if (window.showToast) window.showToast('«' + (BG_FA[name] || name) + '» باز شد و انتخاب شد! 🎉', 'success');
    render();
}

function select(name) {
    var db = classicDB();
    db.current = name;
    saveDB(db);
    if (window.showToast) window.showToast('محیط «' + (BG_FA[name] || name) + '» انتخاب شد', 'success');
    render();
}

/* expose */
window.YogaKarmaStore = { render: render, bind: bind };

/* ── زنجیرهٔ اطمینان ──
   تب karmastore مستقیماً از خود این فایل هم bind می‌شود تا حتی اگر
   yoga-library.js نسخهٔ قدیمی/کش‌شده باشد یا ترتیب لود بهم بخورد،
   کلیک روی «فروشگاه کارما» همیشه رندر کند. */
(function () {
    function hook() {
        var tabs = document.querySelectorAll('.yoga-tab[data-tab="karmastore"]');
        tabs.forEach(function (btn) {
            if (btn._pksHooked) return;
            btn._pksHooked = true;
            btn.addEventListener('click', function () {
                /* کمی بعد از switchTab داخلی اجرا شود تا display درست شود */
                setTimeout(function () {
                    try { window.YogaKarmaStore.render(); window.YogaKarmaStore.bind(); } catch (e) {}
                }, 0);
            }, true);   /* capture: قبل از handlerهای دیگر، مستقل از آن‌ها */
        });
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', hook);
    } else {
        hook();
    }
})();
