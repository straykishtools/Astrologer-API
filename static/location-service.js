/* ═══════════════════════════════════════════════════════════════
   GEO LOCATION — مرجع لوکیشنِ آب‌وهوا/کیفیت هوا
   ───────────────────────────────────────────────────────────────
   اولویت resolve():
     ۱) شهری که کاربر در فرم تولد/پروفایل انتخاب کرده (sharedInputs.city)
     ۲) لوکیشن مرورگر (پس از اجازه؛ کش ۲ ساعته در localStorage)
     ۳) پیش‌فرض: تهران (35.6892 / 51.3890)

   درخواست geolocation هرگز هنگام لود صفحه نیست — فقط بعد از اولین
   تعامل کاربر (کلیک/کلید). وقتی لوکیشن جدیدِ مرورگر گرفته شد، رویداد
   'geoloc:change' روی window شلیک می‌شود؛ مصرف‌کننده‌ها (earth-status،
   cosmic-status، my-dashboard) کش خود را باطل می‌کنند تا در باز شدن
   بعدی با مختصات تازه fetch شود.
   ═══════════════════════════════════════════════════════════════ */
var GeoLoc = (function () {
    'use strict';

    var LS_KEY = 'cosmic_geoloc_browser';
    var TEHRAN = { lat: 35.6892, lng: 51.3890, label: 'تهران', source: 'default' };
    var TTL = 2 * 60 * 60 * 1000;        // کش لوکیشن مرورگر: ۲ ساعت
    var inFlight = false;
    var armed = false;

    function browserCache() {
        try {
            var c = JSON.parse(localStorage.getItem(LS_KEY) || 'null');
            if (c && typeof c.lat === 'number' && typeof c.lng === 'number' && (Date.now() - (c.at || 0)) < TTL) return c;
        } catch (_) {}
        return null;
    }
    function saveBrowser(c) { try { localStorage.setItem(LS_KEY, JSON.stringify(c)); } catch (_) {} }

    /* انتخاب شهریِ کاربر فقط وقتی معتبر است که نام شهر واقعاً ست شده باشد
       (sharedInputs.latitude به‌صورت پیش‌فرض همیشه تهران است) */
    function citySelection() {
        var s = window.sharedInputs;
        if (s && s.city && String(s.city).trim() && s.latitude && s.longitude) {
            return { lat: +s.latitude, lng: +s.longitude, label: String(s.city).trim(), source: 'city' };
        }
        return null;
    }

    /* بهترین لوکیشنِ «همین حالاِ شناخته‌شده» — بدون هیچ درخواستی */
    function resolve() {
        var city = citySelection();
        if (city) return city;
        var b = browserCache();
        if (b) return { lat: b.lat, lng: b.lng, label: b.label || 'موقعیت شما', source: 'browser' };
        return TEHRAN;
    }

    /* درخواست فعال لوکیشن مرورگر (اگر شهر انتخاب نشده باشد).
       onDone(loc) فقط وقتی لوکیشنِ تازه‌ای گرفته شد صدا زده می‌شود. */
    function request(force, onDone) {
        onDone = onDone || function () {};
        if (citySelection()) { onDone(null); return; }
        if (!navigator.geolocation) { onDone(null); return; }
        if (inFlight) { onDone(null); return; }
        var cached = browserCache();
        if (cached && !force) { onDone(null); return; }
        inFlight = true;
        navigator.geolocation.getCurrentPosition(function (pos) {
            inFlight = false;
            var c = {
                lat: Math.round(pos.coords.latitude * 10000) / 10000,
                lng: Math.round(pos.coords.longitude * 10000) / 10000,
                label: 'موقعیت شما',
                at: Date.now()
            };
            saveBrowser(c);
            onDone({ lat: c.lat, lng: c.lng, label: c.label, source: 'browser' });
        }, function () { inFlight = false; onDone(null); },
           { timeout: 8000, maximumAge: 15 * 60 * 1000, enableHighAccuracy: false });
    }

    /* یک‌بار بعد از اولین تعامل کاربر، لوکیشن مرورگر بخواه شود */
    function arm() {
        if (armed) return;
        armed = true;
        ['pointerdown', 'keydown'].forEach(function (ev) {
            window.addEventListener(ev, function once() {
                window.removeEventListener(ev, once);
                request(false, function (fresh) {
                    if (!fresh) return;
                    try { window.dispatchEvent(new CustomEvent('geoloc:change', { detail: fresh })); } catch (_) {}
                });
            }, { passive: true });
        });
    }
    arm();

    return {
        resolve: resolve,
        request: request,
        hasCity: function () { return !!citySelection(); },
        TEHRAN: TEHRAN
    };
})();
window.GeoLoc = GeoLoc;
