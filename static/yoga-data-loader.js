// ================================================================
//  YOGA DATA LOADER — بارگذاری داده‌های یوگا (خروجی yoga_importer.py)
//  داده‌ها: static/yoga-data/{poses,moves,backgrounds,practices}.json
//  کاربرد:  window.YOGA_DATA.whenReady(cb)  /  YOGA_DATA.getPractice(name)
// ================================================================
(function () {
'use strict';

var BASE = 'static/yoga-data/';

var store = {
    poses: null,          // آرایه حرکات (poses.json)
    moves: null,          // آرایه انتقال‌ها (moves.json)
    backgrounds: null,    // آرایه پس‌زمینه‌ها (backgrounds.json)
    practices: null,      // فهرست تمرین‌های آماده (practices.json)
    poseByName: {},
    movesByName: {}
};

function fetchJson(url) {
    return fetch(url, { cache: 'no-cache' }).then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status + ' برای ' + url);
        return r.json();
    });
}

var readyPromise = Promise.all([
    fetchJson(BASE + 'poses.json').then(function (list) {
        store.poses = list;
        list.forEach(function (p) { store.poseByName[p.name] = p; });
    }),
    fetchJson(BASE + 'moves.json').then(function (list) {
        store.moves = list;
        list.forEach(function (m) { store.movesByName[m.name] = m; });
    }),
    fetchJson(BASE + 'backgrounds.json').then(function (list) { store.backgrounds = list; }),
    fetchJson(BASE + 'practices.json').then(function (list) { store.practices = list; })
]).then(function () {
    window.YOGA_DATA_LOADED = true;
    return store;
}).catch(function (err) {
    console.warn('[YogaData] بارگذاری داده‌ها ناموفق:', err);
    throw err;
});

/**
 * بارگذاری اسکریپت یک تمرین آماده (desert, mountain, ocean, sun_salutation_a, ...)
 * از فایل JSON یا از API در صورت عدم موفقیت.
 */
function getPractice(name) {
    var safe = String(name || '').toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (!safe) return Promise.reject(new Error('نام تمرین معتبر نیست'));
    return fetchJson(BASE + safe + '.json').then(function (practice) {
        practice.name = safe;
        return practice;
    }).catch(function () {
        return fetch('/api/v5/yoga/practices/' + encodeURIComponent(safe))
            .then(function (r) {
                if (!r.ok) throw new Error('HTTP ' + r.status);
                return r.json();
            })
            .then(function (body) { return body.practice; });
    });
}

/** تبدیل نام انتقال به حالت مقصد (toPose) */
function moveTarget(moveName) {
    var m = store.movesByName[moveName];
    return m ? m.toPose : null;
}

window.YOGA_DATA = {
    get poses() { return store.poses; },
    get moves() { return store.moves; },
    get backgrounds() { return store.backgrounds; },
    get practices() { return store.practices; },
    get poseByName() { return store.poseByName; },
    get movesByName() { return store.movesByName; },
    whenReady: function (cb) {
        readyPromise.then(cb, function () { cb && cb(null); });
    },
    getPractice: getPractice,
    moveTarget: moveTarget,
    move: function (name) { return store.movesByName[name] || null; },
    pose: function (name) { return store.poseByName[name] || null; }
};

})();