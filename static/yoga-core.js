// ================================================================
//  YOGA CORE — هسته مشترک یوگا
//  داده، تصویر، روابط و منطق مشترک بین کتابخانه و تمرین
//  منبع واحد حقیقت: static/yoga.txt + static/yoga-images.json
// ================================================================
var YogaCore = (function () {
'use strict';

var POSES_URL = 'static/yoga.txt';
var IMAGES_URL = 'static/yoga-images.json';

var CATEGORY_FA = {
    'standing': 'ایستاده',
    'seated': 'نشسته',
    'supine': 'خوابیده به پشت',
    'prone': 'خوابیده به شکم',
    'arm_leg_support': 'تکیه بر دست و پا',
    'arm_balance_and_inversion': 'تعادل روی دست و وارونگی',
    'arm_balance_inversion': 'تعادل روی دست و وارونگی'
};
var SUBCATEGORY_FA = {
    'backbend': 'خمش به عقب',
    'forward_bend': 'خمش به جلو',
    'lateral_bend': 'خمش جانبی',
    'twist': 'پیچش',
    'balancing': 'تعادلی',
    'neutral': 'خنثی'
};
var DIFFICULTY_FA = { 'beginner': 'مبتدی', 'intermediate': 'متوسط', 'expert': 'پیشرفته' };
var DIFFICULTY_STARS = { 'beginner': '⭐', 'intermediate': '⭐⭐', 'expert': '⭐⭐⭐' };
var DIFFICULTY_ORDER = { 'beginner': 1, 'intermediate': 2, 'expert': 3 };
var VISIBILITY_FA = { 'primary': 'اصلی', 'secondary': 'فرعی', 'tertiary': 'پنهان' };
var CATEGORY_ICONS = {
    'standing': '🧍', 'seated': '🪑', 'supine': '🛌',
    'prone': '🤸', 'arm_leg_support': '🤸', 'arm_balance_and_inversion': '🔄',
    'arm_balance_inversion': '🔄'
};
var SIDE_FA = { R: 'راست', L: 'چپ' };
var REL_FA = {
    incoming: 'حرکات منتهی به این وضعیت',
    outgoing: 'حرکات پس از این وضعیت',
    variations: 'تغییرات این حرکت',
    related: 'حرکات مرتبط',
    preparation: 'آماده‌سازی'
};

var FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';

var poses = [];
var poseMap = {};
var imageMap = {};
var loaded = false;
var loadPromise = null;

// ─── Loaders ───
function fetchText(url) {
    return fetch(url).then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.text();
    });
}

// The manifest may store absolute local paths (e.g. C:/Users/.../static/images/yoga/Archer_L.png).
// Normalize to a URL relative to the site root so the browser can actually load it.
function toRelUrl(path) {
    if (!path) return '';
    var s = String(path).replace(/\\/g, '/');
    var i = s.indexOf('static/images/yoga/');
    if (i >= 0) return s.slice(i);
    var j = s.lastIndexOf('/');
    return 'static/images/yoga/' + (j >= 0 ? s.slice(j + 1) : s);
}

function load() {
    if (loadPromise) return loadPromise;
    loadPromise = Promise.all([fetchText(POSES_URL), fetchText(IMAGES_URL)])
        .then(function (res) {
            poses = JSON.parse(res[0]);
            poseMap = {};
            poses.forEach(function (p) { poseMap[p.name] = p; });
            var img = JSON.parse(res[1]);
            imageMap = {};
            var src = (img && img.poses) || {};
            Object.keys(src).forEach(function (name) {
                var e = src[name];
                if (!e) return;
                var o = {};
                ['card', 'full', 'R', 'L'].forEach(function (k) {
                    if (e[k]) o[k] = toRelUrl(e[k]);
                });
                imageMap[name] = o;
            });
            loaded = true;
            return { poses: poses, poseMap: poseMap, imageMap: imageMap };
        })
        .catch(function (e) {
            loadPromise = null;
            throw e;
        });
    return loadPromise;
}

function isReady() { return loaded; }
function getPoses() { return poses; }
function getPoseMap() { return poseMap; }
function get(name) { return poseMap[name] || null; }

// ─── Persist helpers ───
function faNum(n) {
    return String(n == null ? '' : n).replace(/[0-9]/g, function (d) { return FA_DIGITS[+d]; });
}
function normFa(s) {
    return String(s || '').replace(/\u200c/g, '').replace(/\s+/g, ' ').trim();
}
function esc(s) {
    var d = document.createElement('div');
    d.appendChild(document.createTextNode(s == null ? '' : String(s)));
    return d.innerHTML;
}
function escAttr(s) { return esc(s).replace(/"/g, '&quot;'); }

// ─── Labels ───
function catFa(c) { return CATEGORY_FA[c] || c || ''; }
function subFa(s) { return SUBCATEGORY_FA[s] || s || ''; }
function diffFa(d) { return DIFFICULTY_FA[d] || d || ''; }
function diffStars(d) { return DIFFICULTY_STARS[d] || ''; }
function diffOrder(d) { return DIFFICULTY_ORDER[d] || 0; }
function visFa(v) { return VISIBILITY_FA[v] || ''; }
function catIcon(c) { return CATEGORY_ICONS[c] || ''; }
function nameFa(pose) {
    if (!pose) return '';
    return pose.display_name_fa || pose.name_fa || pose.display_name || pose.name || '';
}
function nameEn(pose) {
    if (!pose) return '';
    return pose.display_name || pose.name || pose.display_name_fa || pose.name_fa || '';
}
function sideOf(pref) {
    var s = String(pref || 'right').toLowerCase();
    return s.indexOf('l') === 0 ? 'L' : 'R';
}
function isPrepName(n) {
    return /(?:^|[A-Z])Preparation$/.test(n || '') || /Preparation$/.test(n || '');
}

// ─── Access control ───
function canAccess(diff) {
    if (diff === 'beginner') return true;
    try {
        var u = JSON.parse(localStorage.getItem('user_data') || 'null');
        var plan = (u && u.plan) || 'free';
        if (diff === 'intermediate') return plan === 'gold' || plan === 'diamond';
        if (diff === 'expert') return plan === 'diamond';
    } catch (e) {}
    return false;
}
function accessLevel() {
    try {
        var u = JSON.parse(localStorage.getItem('user_data') || 'null');
        return (u && u.plan) || 'free';
    } catch (e) { return 'free'; }
}

// ─── Image resolver (canonical, manifest-driven) ───
function placeholderSvg(pose, size) {
    var label = (pose && (nameFa(pose) || pose.name)) || 'یوگا';
    size = size || 400;
    var svg =
        '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '">' +
        '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
        '<stop offset="0" stop-color="#101a3d"/><stop offset="1" stop-color="#1b2a55"/>' +
        '</linearGradient></defs>' +
        '<rect fill="url(#g)" width="' + size + '" height="' + size + '"/>' +
        '<circle cx="' + (size / 2) + '" cy="' + (size / 2 - size * 0.06) + '" r="' + (size * 0.2) + '" fill="#ddc070" opacity="0.12"/>' +
        '<text x="' + (size / 2) + '" y="' + (size / 2 + size * 0.03) + '" text-anchor="middle" dominant-baseline="middle" font-size="' + (size * 0.3) + '">🧘</text>' +
        '<text x="' + (size / 2) + '" y="' + (size * 0.82) + '" text-anchor="middle" fill="#9fb0d8" font-size="' + Math.max(11, size * 0.045) + '" font-family="Vazirmatn, sans-serif">' + label + '</text>' +
        '</svg>';
    return 'data:image/svg+xml,' + encodeURIComponent(svg);
}

function hasImg(name) {
    return !!(imageMap[name] && (imageMap[name].card || imageMap[name].full));
}
function imgEntry(name) { return imageMap[name] || null; }

/**
 * getImage(poseOrName, opts)
 * opts: { size: 'card'|'full' (default 'full'), side: 'R'|'L'|'N', soft: bool }
 * Resolves against the manifest. When the exact variant is absent it falls
 * back to any real asset for the pose, then to an SVG placeholder. Never
 * returns a URL that does not exist in the manifest.
 */
function getImage(poseOrName, opts) {
    opts = opts || {};
    var pose = typeof poseOrName === 'string' ? poseMap[poseOrName] : poseOrName;
    if (!pose) return placeholderSvg(null);
    var name = pose.name;
    var e = imageMap[name];
    var wantFull = opts.size !== 'card';
    var side = opts.side || 'N';

    if (e) {
        // Preferred side file
        if (side === 'R' || side === 'L') {
            if (e[side]) return e[side];
        }
        if (wantFull && e.full) return e.full;
        if (e.card) return e.card;
        if (e.full) return e.full;
    }
    if (opts.soft === false) return '';
    return placeholderSvg(pose, wantFull ? 460 : 220);
}

function sideAvailable(name, side) {
    var e = imageMap[name];
    return !!(e && e[side]);
}
/** True only when the pose has real distinct images for both sides. */
function canSwitchSide(pose) {
    if (!pose || !pose.two_sided) return false;
    return sideAvailable(pose.name, 'R') && sideAvailable(pose.name, 'L');
}

// ─── Relationships ───
function validRefs(pose, field) {
    if (!pose) return [];
    var list = pose[field];
    if (!list || !list.length) return [];
    var seen = {}, out = [];
    list.forEach(function (n) {
        if (n && poseMap[n] && !seen[n]) { seen[n] = true; out.push(n); }
    });
    return out;
}
function incomingOf(pose) { return validRefs(pose, 'previous_poses'); }
function outgoingOf(pose) { return validRefs(pose, 'next_poses'); }
function variationsOf(pose) { return validRefs(pose, 'variations'); }

/** All one-hop neighbours in the relation graph (deduped, ordered). */
function neighboursOf(pose) {
    var out = [];
    var seen = {};
    function add(n, kind) {
        if (!n || seen[n]) return;
        seen[n] = true;
        out.push({ name: n, kind: kind });
    }
    incomingOf(pose).forEach(function (n) { add(n, 'incoming'); });
    outgoingOf(pose).forEach(function (n) { add(n, 'outgoing'); });
    variationsOf(pose).forEach(function (n) { add(n, 'variation'); });
    return out;
}

function isRelatedKind(pose, refName) {
    var p = poseMap[refName];
    if (!p) return false;
    return p.category === pose.category && p.subcategory === pose.subcategory;
}

/**
 * Related poses not already in explicit relationships.
 * Same category/subcategory first, then same subcategory, then same category,
 * all within a close difficulty band. Deterministic order (by name).
 */
function relatedOf(pose, maxN) {
    maxN = maxN || 6;
    if (!pose) return [];
    var used = {};
    used[pose.name] = true;
    neighboursOf(pose).forEach(function (x) { used[x.name] = true; });
    var band = diffOrder(pose.difficulty);
    var sameCatSub = [], sameSub = [], sameCat = [];
    poses.forEach(function (p) {
        if (used[p.name]) return;
        if (p.visibility === 'tertiary') return;
        if (Math.abs(diffOrder(p.difficulty) - band) > 1) return;
        var d = 0;
        if (p.category === pose.category && p.subcategory === pose.subcategory) d = 0;
        else if (p.subcategory === pose.subcategory) d = 1;
        else if (p.category === pose.category) d = 2;
        else return;
        (d === 0 ? sameCatSub : d === 1 ? sameSub : sameCat).push(p);
    });
    var res = sameCatSub.concat(sameSub, sameCat);
    res.sort(function (a, b) {
        var d = diffOrder(a.difficulty) - diffOrder(b.difficulty);
        return d !== 0 ? d : (a.name < b.name ? -1 : 1);
    });
    return res.slice(0, maxN);
}

/**
 * Semantic label + chip class for a referenced pose relative to `pose`.
 * Used to visually separate variations from transitions/preparations.
 */
function relLabel(pose, refName) {
    var target = poseMap[refName];
    if (!target) return { fa: '', cls: '', prep: false, kind: '' };
    var isVar = (pose.variations || []).indexOf(refName) >= 0;
    var inPrev = (pose.previous_poses || []).indexOf(refName) >= 0;
    var inNext = (pose.next_poses || []).indexOf(refName) >= 0;
    var prep = isPrepName(refName);
    if (isVar) {
        return { fa: 'تغییرات', cls: 'yk-rel-var', prep: false, kind: 'variation' };
    }
    if (prep) {
        return { fa: REL_FA.preparation, cls: 'yk-rel-prep', prep: true, kind: 'preparation' };
    }
    if (inPrev && inNext) return { fa: 'ورود و خروج', cls: 'yk-rel-both', prep: false, kind: 'both' };
    if (inPrev) return { fa: 'ورودی', cls: 'yk-rel-in', prep: false, kind: 'incoming' };
    if (inNext) return { fa: 'خروجی', cls: 'yk-rel-out', prep: false, kind: 'outgoing' };
    return { fa: '', cls: '', prep: false, kind: '' };
}

// ─── Description rendering: resolve //PoseName// markers ───
function lookupRefText(token) {
    // Exact English name first
    if (poseMap[token]) return { name: token, pose: poseMap[token] };
    // Persian display names (ZWNJ-insensitive), e.g. //صندلی‌دعا//
    var key = normFa(token);
    if (key) {
        for (var i = 0; i < poses.length; i++) {
            var p = poses[i];
            if (normFa(p.display_name_fa || p.name_fa) === key || normFa(p.display_name) === key) {
                return { name: p.name, pose: p };
            }
        }
    }
    return null;
}

function renderDesc(text, opts) {
    opts = opts || {};
    if (!text) return '';
    var open = opts.openDetail || null; // callback(name)
    var html = '';
    var i = 0;
    var m;
    var re = /\/\/([^/\r\n]+?)\/\//g;
    var last = 0;
    var parts = [];
    while ((m = re.exec(text)) !== null) {
        parts.push({ t: text.slice(last, m.index), ref: m[1] });
        last = m.index + m[0].length;
    }
    parts.push({ t: text.slice(last), ref: null });
    for (var k = 0; k < parts.length; k++) {
        var chunk = parts[k];
        if (chunk.t) html += esc(chunk.t);
        if (chunk.ref) {
            var hit = lookupRefText(chunk.ref.trim());
            if (hit && opts.linkRefs !== false) {
                html += '<a class="yk-desc-ref" data-yoga-ref="' + escAttr(hit.name) + '" href="javascript:void(0)">' +
                    esc(nameFa(hit.pose)) + ' 🧘</a>';
            } else if (hit) {
                html += '<span class="yk-desc-ref-static">' + esc(nameFa(hit.pose)) + '</span>';
            } else {
                html += '<span class="yk-desc-ref-broken">' + esc(chunk.ref.trim()) + '</span>';
            }
        }
    }
    return html;
}

// ─── Favorites / session / practice stats (single source) ───
function getFavs() {
    try { return JSON.parse(localStorage.getItem('yoga_favs') || '[]'); } catch (e) { return []; }
}
function saveFavs(f) { try { localStorage.setItem('yoga_favs', JSON.stringify(f)); } catch (e) {} }
function toggleFav(name) {
    var f = getFavs(), i = f.indexOf(name);
    if (i >= 0) f.splice(i, 1); else f.push(name);
    saveFavs(f); return f;
}
function isFav(name) { return getFavs().indexOf(name) >= 0; }

function getSession() {
    try { return JSON.parse(localStorage.getItem('yoga_session') || '[]'); } catch (e) { return []; }
}
function saveSession(s) { try { localStorage.setItem('yoga_session', JSON.stringify(s)); } catch (e) {} }
function addToSession(name) {
    var s = getSession();
    if (s.indexOf(name) < 0) { s.push(name); saveSession(s); }
    return s;
}
function removeFromSession(name) {
    var s = getSession(), i = s.indexOf(name);
    if (i >= 0) { s.splice(i, 1); saveSession(s); }
    return s;
}
function setSession(s) { saveSession(s || []); return getSession(); }
function moveInSession(fromIdx, toIdx) {
    var s = getSession();
    if (fromIdx < 0 || fromIdx >= s.length) return s;
    var item = s.splice(fromIdx, 1)[0];
    toIdx = Math.max(0, Math.min(s.length, toIdx));
    s.splice(toIdx, 0, item);
    saveSession(s); return s;
}

// Daily practice stats ('yoga_practice') — used by the Daily tab
function getPracticeData() {
    var empty = { history: [], streak: 0, totalMinutes: 0, totalSessions: 0 };
    try { return JSON.parse(localStorage.getItem('yoga_practice')) || empty; }
    catch (e) { return empty; }
}
function savePracticeData(d) { try { localStorage.setItem('yoga_practice', JSON.stringify(d)); } catch (e) {} }
function todayStr() { return new Date().toISOString().split('T')[0]; }
function practicedToday() { return getPracticeData().history.some(function (h) { return h.date === todayStr(); }); }

// Yoga summary log ('yoga_practice_log') — used by the top-bar panel
function getSummaryLog() {
    try { return JSON.parse(localStorage.getItem('yoga_practice_log')) || { sessions: [], totalMinutes: 0 }; }
    catch (e) { return { sessions: [], totalMinutes: 0 }; }
}
function saveSummaryLog(l) { try { localStorage.setItem('yoga_practice_log', JSON.stringify(l)); } catch (e) {} }

function computeStreak(historyDates) {
    if (!historyDates.length) return 0;
    var set = {};
    historyDates.forEach(function (d) { set[d] = true; });
    var streak = 0;
    var cur = new Date(); cur.setHours(0, 0, 0, 0);
    var key = function (d) { return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); };
    if (!set[key(cur)]) {
        cur.setDate(cur.getDate() - 1);
        if (!set[key(cur)]) return 0;
    }
    while (set[key(cur)]) { streak++; cur.setDate(cur.getDate() - 1); }
    return streak;
}

/** Record a completed practice/breath session across both stores. */
function recordPractice(durationMinutes, meta) {
    meta = meta || {};
    var minutes = Math.max(1, Math.round(durationMinutes || 1));
    // 1) daily tab data
    var d = getPracticeData();
    d.history.push({ date: todayStr(), duration: minutes, type: meta.type || 'yoga', at: Date.now() });
    d.totalMinutes = (d.totalMinutes || 0) + minutes;
    d.totalSessions = (d.totalSessions || 0) + 1;
    var byDate = {};
    d.history.forEach(function (h) { byDate[h.date] = true; });
    d.streak = computeStreak(Object.keys(byDate));
    savePracticeData(d);
    // 2) top-bar yoga summary log
    var log = getSummaryLog();
    log.sessions.push({ type: meta.type || 'yoga', date: new Date().toISOString(), duration: minutes });
    log.totalMinutes = (log.totalMinutes || 0) + minutes;
    saveSummaryLog(log);
    // refresh the dropdown if open
    if (window.YogaSummary) {
        try { if (YogaSummary.refresh) YogaSummary.refresh(); } catch (e) {}
    }
    return { minutes: minutes, daily: d };
}

// ─── Flow building (relation-aware practice sequence) ───
function isFlowEligible(p) {
    if (!p) return false;
    if (p.visibility === 'tertiary') return false;
    return true;
}
function pickNext(candidates, used, maxDiffOrder) {
    var scored = candidates.filter(function (n) {
        var p = poseMap[n];
        if (!p || used[n] || !isFlowEligible(p)) return false;
        if (maxDiffOrder && diffOrder(p.difficulty) > maxDiffOrder) return false;
        if (!canAccess(p.difficulty)) return false;
        return true;
    }).map(function (n) {
        var p = poseMap[n];
        var s = 0;
        s -= (diffOrder(p.difficulty) * 2);
        if (p.difficulty === 'beginner') s += 0;
        if (p.category === 'supine' && p.subcategory === 'neutral') s += 6; // rest poses
        if (isPrepName(n)) s += 4;
        if (p.visibility === 'primary') s += 3;
        return { name: n, score: s, diff: diffOrder(p.difficulty) };
    });
    scored.sort(function (a, b) {
        if (b.score !== a.score) return b.score - a.score;
        return a.name < b.name ? -1 : 1;
    });
    return scored[0] ? scored[0].name : null;
}

/**
 * buildFlow(rootOrNames, maxN)
 * - array  -> explicit ordered list (respects visibility gating only for access)
 * - string -> relation-aware chain starting at that pose
 * - 'auto' -> chain rooted at a random accessible primary/secondary pose
 * Returns array of pose names.
 */
function buildFlow(rootOrNames, maxN) {
    maxN = maxN || 8;
    if (Array.isArray(rootOrNames)) {
        var out = [];
        (rootOrNames || []).forEach(function (n) {
            if (poseMap[n] && out.indexOf(n) < 0) out.push(n);
        });
        return out;
    }
    var used = {};
    var seq = [];
    var start = rootOrNames && rootOrNames !== 'auto' ? poseMap[rootOrNames] : null;
    if (!start) {
        var pool = poses.filter(function (p) {
            return isFlowEligible(p) && canAccess(p.difficulty) && diffOrder(p.difficulty) <= 2;
        });
        start = pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
    }
    if (!start) return [];
    var cur = start;
    while (seq.length < maxN && cur) {
        used[cur.name] = true;
        seq.push(cur.name);
        // Prefer the dataset's own outgoing transitions
        var nxt = pickNext(outgoingOf(cur), used, diffOrder(cur.difficulty) + 1);
        if (!nxt) nxt = pickNext(variationsOf(cur), used, diffOrder(cur.difficulty) + 1);
        if (!nxt) nxt = pickNext(incomingOf(cur), used, null);
        if (!nxt) break;
        cur = poseMap[nxt];
    }
    // Gentle close: append a beginner supine/neutral rest pose when missing
    if (seq.length > 1 && !(poseMap[seq[seq.length - 1]].subcategory === 'neutral' && poseMap[seq[seq.length - 1]].category === 'supine')) {
        for (var i = 0; i < poses.length; i++) {
            var p = poses[i];
            if (used[p.name]) continue;
            if (!isFlowEligible(p) || !canAccess(p.difficulty)) continue;
            if (p.category === 'supine' && p.subcategory === 'neutral' && p.difficulty === 'beginner') {
                seq.push(p.name);
                break;
            }
        }
    }
    return seq;
}

// ─── Development audit (not shown to normal users) ───
function audit() {
    var img = imageMap;
    var relBroken = { previous_poses: 0, next_poses: 0, variations: 0 };
    var counts = {
        total: poses.length,
        withImage: 0,
        noImage: 0,
        twoSidedComplete: 0,
        twoSidedIncomplete: 0
    };
    var noImg = [];
    poses.forEach(function (p) {
        var e = img[p.name];
        var has = !!(e && (e.card || e.full));
        if (has) counts.withImage++; else { counts.noImage++; noImg.push(p.name); }
        if (p.two_sided) {
            if (e && e.R && e.L) counts.twoSidedComplete++;
            else counts.twoSidedIncomplete++;
        }
        ['previous_poses', 'next_poses', 'variations'].forEach(function (f) {
            (p[f] || []).forEach(function (r) { if (!poseMap[r]) relBroken[f]++; });
        });
    });
    var orphans = [];
    Object.keys(img).forEach(function (n) { if (!poseMap[n]) orphans.push(n); });
    var report = {
        totalPoses: counts.total,
        images: counts,
        brokenRelations: relBroken,
        orphanManifestEntries: orphans.length,
        posesWithoutImage: noImg
    };
    return report;
}
function printAudit() {
    var r = audit();
    var lines = [
        '═══ Yoga Pose Audit ═══',
        'Total poses: ' + r.totalPoses,
        'Poses with images: ' + r.images.withImage,
        'Poses missing images: ' + r.images.noImage,
        'Two-sided complete (L+R): ' + r.images.twoSidedComplete,
        'Two-sided incomplete: ' + r.images.twoSidedIncomplete,
        'Broken previous refs: ' + r.brokenRelations.previous_poses,
        'Broken next refs: ' + r.brokenRelations.next_poses,
        'Broken variation refs: ' + r.brokenRelations.variations
    ];
    if (window.console && console.table) {
        lines.forEach(function (l) { console.info('%c' + l, 'color:#ddc070'); });
    } else {
        lines.forEach(function (l) { console.log(l); });
    }
    return r;
}

function onReady(fn) {
    load().then(fn, function (e) { console.error('YogaCore load failed:', e); });
}

return {
    load: load, onReady: onReady, isReady: isReady,
    getPoses: getPoses, getPoseMap: getPoseMap, get: get,
    // labels
    catFa: catFa, subFa: subFa, diffFa: diffFa, diffStars: diffStars,
    diffOrder: diffOrder, visFa: visFa, catIcon: catIcon,
    nameFa: nameFa, nameEn: nameEn, sideOf: sideOf, isPrepName: isPrepName,
    faNum: faNum, normFa: normFa, esc: esc, escAttr: escAttr,
    // images
    getImage: getImage, imgEntry: imgEntry, hasImg: hasImg,
    sideAvailable: sideAvailable, canSwitchSide: canSwitchSide, placeholderSvg: placeholderSvg,
    // relations
    incomingOf: incomingOf, outgoingOf: outgoingOf, variationsOf: variationsOf,
    neighboursOf: neighboursOf, relatedOf: relatedOf, relLabel: relLabel,
    validRefs: validRefs, lookupRefText: lookupRefText, renderDesc: renderDesc,
    // storage
    getFavs: getFavs, toggleFav: toggleFav, isFav: isFav,
    getSession: getSession, saveSession: saveSession, setSession: setSession,
    addToSession: addToSession, removeFromSession: removeFromSession, moveInSession: moveInSession,
    getPracticeData: getPracticeData, practicedToday: practicedToday,
    recordPractice: recordPractice,
    // access
    canAccess: canAccess, accessLevel: accessLevel,
    // flow
    buildFlow: buildFlow, isFlowEligible: isFlowEligible,
    // constants
    CATEGORY_FA: CATEGORY_FA, SUBCATEGORY_FA: SUBCATEGORY_FA,
    DIFFICULTY_FA: DIFFICULTY_FA, DIFFICULTY_STARS: DIFFICULTY_STARS,
    VISIBILITY_FA: VISIBILITY_FA, REL_FA: REL_FA, SIDE_FA: SIDE_FA,
    // audit
    audit: audit, printAudit: printAudit
};
})();
