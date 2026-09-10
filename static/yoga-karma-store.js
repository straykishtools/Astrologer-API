// ================================================================
//  YOGA KARMA STORE — فروشگاه پس‌زمینه‌های استودیو کلاسیک
//  گالری backgrounds از همان منبع اپ (resources/assets/backgrounds.xml
//  از طریق YOGA_DATA backgrounds)؛ خرید با کارما (قیمت ×۲) و انتخاب
//  محیط که مستقیم روی استودیو کلاسیک اعمال می‌شود (py_current_bg).
//  اگر داخل استودیو باز باشد، انتخاب با postMessage هم اطلاع داده می‌شود.
// ================================================================
var YogaKarmaStore = (function () {
'use strict';

var COST_MULT = 2;   // کارما موردنیاز تصاویر ۲ برابر شده
var _rendered = false;

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
    /* classic thumbnails ship in drawable-mdpi */
    return 'static/yoga-data/resources/res/drawable-mdpi/bg_' + (b.backgroundname || 'l1_home') + '_tnstore.jpg';
}
function fullUrl(b) {
    return 'static/yoga-data/resources/res/drawable-large-xhdpi/bg_' + (b.backgroundname || 'l1_home') + '.jpg';
}

function render() {
    var host = document.getElementById('yogaKarmaStorePanel');
    if (!host) return;
    var bgs = (window.YOGA_DATA && window.YOGA_DATA.backgrounds) || [];
    if (!bgs.length) {
        host.innerHTML = '<p class="yp-note">⚠ پس‌زمینه‌ها بارگذاری نشدند.</p>';
        return;
    }
    var db = classicDB();
    var karmaRow =
        '<div class="pks-karma">' +
            '<span class="pks-karma-num">' + faNum(db.karma) + '</span>' +
            '<span class="pks-karma-lbl">امتیاز کارما شما</span>' +
        '</div>' +
        '<p class="pks-hint">با هر ۱۵ دقیقه تمرین در استودیو کلاسیک ۱ کارما می‌گیرید. انتخاب یک پس‌زمینه بلافاصله در استودیو اعمال می‌شود.</p>';

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
                '<img class="pks-thumb" loading="lazy" src="' + esc(tnUrl(b)) + '" alt="' + esc(b.name) + '" ' +
                    'data-pks-view="' + esc(b.name) + '">' +
                (owned ? '' : '<span class="pks-lock">🔒</span>') +
            '</div>' +
            '<div class="pks-meta">' +
                '<span class="pks-name">' + esc(b.name) + '</span>' +
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
    _rendered = true;
}

function bind() {
    var host = document.getElementById('yogaKarmaStorePanel');
    if (!host || host._pksBound) return;
    host._pksBound = true;
    host.addEventListener('click', function (e) {
        var view = e.target.closest('[data-pks-view]');
        if (view && e.target.classList.contains('pks-thumb')) {
            var bgs = (window.YOGA_DATA && window.YOGA_DATA.backgrounds) || [];
            var b = bgs.filter(function (x) { return x.name === view.getAttribute('data-pks-view'); })[0];
            if (b) {
                var v = document.getElementById('pksViewer');
                document.getElementById('pksViewerImg').src = fullUrl(b);
                document.getElementById('pksViewerName').textContent = b.name;
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
            var name = buy.getAttribute('data-pks-buy');
            purchase(name);
            return;
        }
        var sel = e.target.closest('[data-pks-select]');
        if (sel) {
            select(sel.getAttribute('data-pks-select'));
        }
    });
}

function purchase(name) {
    var bgs = (window.YOGA_DATA && window.YOGA_DATA.backgrounds) || [];
    var b = bgs.filter(function (x) { return x.name === name; })[0];
    if (!b) return;
    var db = classicDB();
    var cost = (b.cost || 0) * COST_MULT;
    if (db.karma < cost) { if (window.showToast) window.showToast('کارما کافی ندارید — تمرین کنید! 🪷', 'info'); return; }
    db.karma -= cost;
    db.unlocked.push(b.name);
    db.current = b.name;
    saveDB(db);
    if (window.showToast) window.showToast('«' + name + '» باز شد و انتخاب شد! 🎉', 'success');
    render();
}

function select(name) {
    var db = classicDB();
    db.current = name;
    saveDB(db);
    if (window.showToast) window.showToast('محیط «' + name + '» انتخاب شد', 'success');
    render();
}

/* expose */
window.YogaKarmaStore = { render: render, bind: bind };
})();
