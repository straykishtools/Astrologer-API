// ================================================================
//   DAILY REMINDER v2 — نوتیف‌های تعاملیِ روزانه
//   ۳ نوبت: صبح (بیوریتم) · ظهر (مزاج/شعر) · شب (منزل قمر + فردا)
//   دکمه‌های اکشن بدون باز کردن اپ (با Service Worker)
//   محتوای زنده از موتورهای بک‌اند
// ================================================================

var DailyReminder = (function () {
    'use strict';

    var STORAGE_KEY = 'daily_reminder_v2';
    var _settings = JSON.parse(JSON.stringify({
        enabled: false,
        slots: { morning: true, noon: true, evening: true },
        hours: { morning: 8, noon: 13, evening: 21 },
        features: {
            biorhythm: { on: true,  full: false },
            mansion:   { on: true,  full: false },
            hafez:     { on: false, full: false },
            planets:   { on: false, full: false },
            weather:   { on: false, full: false },
            tarot:     { on: true,  full: false }
        }
    }));
    var _swReg = null;
    var _checkTimer = null;

    /* پیش‌فرضِ تنظیمات پیشرفته */
    var DEFAULT_SETTINGS = {
        enabled: false,
        slots: { morning: true, noon: true, evening: true },
        hours: { morning: 8, noon: 13, evening: 21 },   // ساعتِ شروعِ هر نوبت
        features: {                                      // هر قابلیت: on/off + خلاصه/کامل
            biorhythm: { on: true,  full: false },
            mansion:   { on: true,  full: false },
            hafez:     { on: false, full: false },
            planets:   { on: false, full: false },
            weather:   { on: false, full: false },
            tarot:     { on: true,  full: false }
        }
    };

    /* ─── تنظیمات ─── */
    function loadSettings() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                var p = JSON.parse(raw);
                _settings.enabled = !!p.enabled;
                _settings.slots = Object.assign({}, DEFAULT_SETTINGS.slots, p.slots || {});
                _settings.hours = Object.assign({}, DEFAULT_SETTINGS.hours, p.hours || {});
                _settings.features = Object.assign({}, DEFAULT_SETTINGS.features);
                Object.keys(_settings.features).forEach(function (k) {
                    if (p.features && p.features[k]) {
                        _settings.features[k].on = !!p.features[k].on;
                        _settings.features[k].full = !!p.features[k].full;
                    }
                });
                _settings.sent = p.sent || {};
                return;
            }
        } catch (e) {}
        // مهاجرت از v1
        try {
            var old = localStorage.getItem('daily_reminder_settings');
            if (old) {
                var op = JSON.parse(old);
                if (op.enabled) _settings.enabled = true;
            }
        } catch (e) {}
        _settings.slots = Object.assign({}, DEFAULT_SETTINGS.slots);
        _settings.hours = Object.assign({}, DEFAULT_SETTINGS.hours);
        _settings.features = JSON.parse(JSON.stringify(DEFAULT_SETTINGS.features));
    }

    function saveSettings() {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(_settings)); } catch (e) {}
    }

    function todayKey() { return new Date().toISOString().split('T')[0]; }
    function sentToday(slot) { return _settings.sent[slot + '_' + todayKey()]; }
    function markSent(slot) {
        _settings.sent[slot + '_' + todayKey()] = 1;
        // پاکسازی: کلیدهای قدیمی‌تر از ۳ روز
        var keys = Object.keys(_settings.sent);
        if (keys.length > 12) {
            keys.sort().slice(0, keys.length - 12).forEach(function (k) { delete _settings.sent[k]; });
        }
        saveSettings();
    }

    /* ─── ثبت Service Worker ─── */
    function registerSW() {
        if (!('serviceWorker' in navigator)) return Promise.resolve(null);
        return navigator.serviceWorker.register('/sw.js')
            .then(function (reg) { _swReg = reg; return reg; })
            .catch(function () { return null; });
    }

    /* ─── درخواست مجوز ─── */
    function requestPermission() {
        if (!('Notification' in window)) return Promise.resolve('denied');
        if (Notification.permission !== 'default') return Promise.resolve(Notification.permission);
        return Notification.requestPermission();
    }

    /* ─── نمایش نوتیف (با SW اگر هست، وگرنه ساده) ─── */
    function notify(opts) {
        if (!('Notification' in window) || Notification.permission !== 'granted') return;
        if (_swReg && _swReg.active) {
            // تعاملی با دکمه‌ها — از طریق SW
            _swReg.active.postMessage({
                type: 'SHOW_NOTIFICATION',
                title: opts.title,
                body: opts.body,
                icon: opts.icon,
                tag: opts.tag,
                url: opts.url,
                actions: opts.actions,
                requireInteraction: opts.requireInteraction
            });
        } else {
            // fallback: نوتیفِ ساده بدون دکمه
            var n = new Notification(opts.title, { body: opts.body, icon: opts.icon, tag: opts.tag });
            if (opts.url) n.onclick = function () { window.focus(); location.hash = opts.url.replace('/', '#'); n.close(); };
        }
    }

    /* ─── داده‌های زنده از موتورها ─── */
    function getBirthISO() {
        var bd = (window.sharedInputs && window.sharedInputs.birthDate) || null;
        if (bd && bd.year && bd.month && bd.day) {
            var iso = bd.year + '-' + String(bd.month).padStart(2, '0') + '-' + String(bd.day).padStart(2, '0');
            if (window.isoShamsiToGregorianISO) return window.isoShamsiToGregorianISO(iso);
            return iso;
        }
        return null;
    }

    function fetchJSON(url, opts) {
        return fetch(url, opts).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
    }

    // بیوریتم زنده
    function fetchBio() {
        var birth = getBirthISO();
        if (!birth) return Promise.resolve(null);
        return fetchJSON('/api/v5/biorhythm', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ birth_date: birth })
        }).then(function (d) { return (d && d.status === 'success') ? d.data : null; });
    }

    // منزل قمر
    function fetchMansion() {
        return fetchJSON('/api/v5/moon-mansion')
            .then(function (d) { return (d && d.status === 'success') ? d.data : null; });
    }

    /* ─── محتوای نوبت‌ها ─── */

    // 🌅 صبح: بیوریتم + (حافظ/هوا/سیارات اگر انتخاب شده) + پیشنهادِ روز
    function morningNotification() {
        var f = _settings.features;
        var promises = [];
        if (f.biorhythm.on) promises.push(fetchBio());
        if (f.hafez.on) {
            promises.push(fetchJSON('/api/v5/hafez', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
                .then(function (d) { return (d && d.status === 'success') ? d.data : null; }));
        }
        if (f.weather.on) {
            var lat = (window.sharedInputs && window.sharedInputs.latitude) || 35.6892;
            var lng = (window.sharedInputs && window.sharedInputs.longitude) || 51.3890;
            promises.push(fetchJSON('/api/v5/weather?lat=' + lat + '&lng=' + lng));
        }
        if (!promises.length) promises.push(Promise.resolve(null));

        return Promise.all(promises).then(function (results) {
            var idx = 0;
            var bio = f.biorhythm.on ? results[idx++] : null;
            var hafez = f.hafez.on ? results[idx++] : null;
            var weather = f.weather.on ? results[idx++] : null;

            var parts = [];
            var title = '🌅 صبح بخیر!';
            var actions = [{ action: 'open-dashboard', title: '📊 داشبورد' }];
            var url = '/#/dashboard';

            // بیوریتم
            if (bio && bio.combined) {
                title = '🌅 ' + bio.combined.headline;
                if (f.biorhythm.full) {
                    parts.push((bio.combined.summary || '').slice(0, 160));
                    (bio.combined.suggestions || []).slice(0, 2).forEach(function (s) { parts.push('• ' + s); });
                } else {
                    parts.push((bio.combined.summary || '').slice(0, 120));
                    var s0 = (bio.combined.suggestions || [])[0];
                    if (s0) parts.push('• ' + s0);
                }
                actions.push({ action: 'open-yoga', title: '🧘 شروع روز' });
            }

            // حافظ
            if (hafez && hafez.faal) {
                var hz = hafez.faal;
                var hafezTxt = '📜 ' + (hz.theme_title || 'فالِ حافظ');
                if (hz.omen) {
                    hafezTxt += ' — ' + (f.hafez.full ? hz.omen.slice(0, 150) : (hz.advice || '').slice(0, 90));
                }
                parts.push(hafezTxt);
                actions.push({ action: 'open-tarot', title: '📜 فالِ کامل' });
                url = '/#/app/hafez';
            }

            // هوا
            if (weather && weather.weather) {
                var w = weather.weather;
                parts.push('🌤️ ' + (w.condition || w.condition_group_fa || '') + (w.temp != null ? ' · ' + Math.round(w.temp) + '°C' : ''));
            }

            if (!parts.length) parts.push('امروز روزِ تازه‌ای است — نیت کن و به بدنت گوش بده.');

            notify({ title: title, body: parts.join('\n').slice(0, 400), actions: actions, url: url, tag: 'co-morning', requireInteraction: false });
            markSent('morning');
        });
    }

    // ☀️ ظهر: پیامِ روز + (تاروت اگر انتخاب شده)
    function noonNotification() {
        var f = _settings.features;
        var msg = (window.pickDailyMessage ? window.pickDailyMessage() : 'نیمه‌روز — نفس عمیق بکش.');
        var body = msg;
        var actions = [
            { action: 'open-yoga', title: '🧘 ۵ دقیقه یوگا' },
            { action: 'open-tools', title: '🔮 ابزارها' }
        ];
        var url = '/#/yoga';

        if (f.tarot.on) {
            return fetchJSON('/api/v5/tarot/daily').then(function (d) {
                if (d && d.status === 'success' && d.data) {
                    var card = d.data.card || {};
                    var meaning = f.tarot.full ? (d.data.deep_interp || d.data.meaning || '') : (d.data.meaning || '');
                    body += '\n🃏 کارتِ امروز: ' + (card.name || '') + (d.data.is_reversed ? ' (وارونه)' : '') + '\n' + meaning.slice(0, f.tarot.full ? 180 : 90);
                    actions.push({ action: 'open-tarot', title: '🃏 فالِ کامل' });
                    url = '/#/app/tarot';
                }
                notify({ title: '☀️ نفسِ وسطِ روز', body: body.slice(0, 400), actions: actions, url: url, tag: 'co-noon' });
                markSent('noon');
            });
        }
        notify({ title: '☀️ نفسِ وسطِ روز', body: body.slice(0, 300), actions: actions, url: url, tag: 'co-noon' });
        markSent('noon');
        return Promise.resolve();
    }

    // 🌙 شب: منزل قمر + (سیارات اگر انتخاب شده)
    function eveningNotification() {
        var f = _settings.features;
        var promises = [];
        if (f.mansion.on) promises.push(fetchMansion());
        if (f.planets.on) {
            var today = new Date().toISOString().split('T')[0];
            promises.push(fetchJSON('/api/v5/nasa/planets?date=' + today));
        }
        if (!promises.length) promises.push(Promise.resolve(null));

        return Promise.all(promises).then(function (results) {
            var idx = 0;
            var mm = f.mansion.on ? results[idx++] : null;
            var planets = f.planets.on ? results[idx++] : null;

            var title = '🌙 شبِ آرام';
            var parts = ['زمانِ مرور و استراحت است.'];
            var actions = [{ action: 'open-dashboard', title: '📊 داشبورد' }];
            var url = '/#/dashboard';

            if (mm && mm.mansion) {
                title = '🌙 ' + mm.mansion.name_fa;
                if (f.mansion.full) {
                    parts = [
                        (mm.mansion.meaning || '') + ' — ' + (mm.percent_of_mansion || 0) + '٪ طی شده.',
                        (mm.mansion.interp || '').slice(0, 200)
                    ];
                } else {
                    parts = [(mm.mansion.meaning || '') + ' — ' + (mm.percent_of_mansion || 0) + '٪ طی شده.'];
                }
                if (mm.next && mm.next.name_fa) {
                    parts.push('منزلِ بعدی (' + mm.next.name_fa + ') حدود ' + Math.round(mm.next.in_hours) + ' ساعت دیگر.');
                }
                actions.unshift({ action: 'open-dashboard', title: '🌌 وضعیت آسمان' });
            }

            // سیاراتِ مهم امروز
            if (planets && planets.planets) {
                var names = Object.keys(planets.planets);
                var focus = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars'].filter(function (n) { return names.indexOf(n) !== -1; });
                var interps = {};
                (planets.interpretations || []).forEach(function (it) { interps[it.planet] = it; });
                focus.slice(0, f.planets.full ? 5 : 2).forEach(function (n) {
                    var it = interps[n];
                    if (it) parts.push(it.planet_fa + ' در ' + it.sign_fa + ': ' + it.interpretation.slice(0, f.planets.full ? 120 : 70));
                });
            }

            notify({ title: title, body: parts.join('\n').slice(0, 420), actions: actions, url: url, tag: 'co-evening', requireInteraction: false });
            markSent('evening');
        });
    }

    /* ─── زمان‌بندی — با ساعاتِ دلخواهِ کاربر ─── */
    function checkSlots() {
        if (!_settings.enabled) return;
        var now = new Date();
        var h = now.getHours();

        function inWindow(startHour) {
            // پنجره‌ی ۴ ساعته از ساعتِ شروعِ انتخابی کاربر
            var s = startHour;
            var e = startHour + 4;
            return (h >= s && h < e) || (s > 20 && h < (e - 24)); // پنجره‌های شبانه
        }

        if (_settings.slots.morning && inWindow(_settings.hours.morning) && !sentToday('morning')) {
            morningNotification();
        }
        else if (_settings.slots.noon && inWindow(_settings.hours.noon) && !sentToday('noon')) {
            noonNotification();
        }
        else if (_settings.slots.evening && inWindow(_settings.hours.evening) && !sentToday('evening')) {
            eveningNotification();
        }
    }

    /* ─── UI ─── */
    function showToast(msg) {
        var container = document.querySelector('.toast-container');
        if (!container) return;
        var toast = document.createElement('div');
        toast.style.cssText = 'background:rgba(16,26,61,0.95);border:1px solid var(--line-strong);color:var(--gold-200);padding:10px 18px;border-radius:12px;font-size:13px;box-shadow:0 8px 30px rgba(0,0,0,0.5);';
        toast.textContent = msg;
        container.appendChild(toast);
        setTimeout(function () { toast.remove(); }, 3200);
    }

    function updateBtn() {
        var btn = document.getElementById('dailyReminderBtn');
        if (!btn) return;
        btn.textContent = _settings.enabled ? '🔔' : '🔕';
        btn.title = _settings.enabled
            ? 'یادآور روزانه: فعال (۳ نوبت: صبح/ظهر/شب) — کلیک برای منو'
            : 'یادآور روزانه: خاموش — کلیک برای روشن‌کردن';
    }

    // ─── منوی تنظیماتِ کامل ───
    function openSlotMenu(anchorBtn) {
        var old = document.getElementById('reminderSlotMenu');
        if (old) { old.remove(); return; }
        var menu = document.createElement('div');
        menu.id = 'reminderSlotMenu';
        menu.style.cssText = 'position:fixed;z-index:9200;background:rgba(10,15,35,0.98);border:1px solid var(--line-strong);border-radius:16px;padding:14px 16px;width:300px;max-height:80vh;overflow-y:auto;box-shadow:0 18px 50px rgba(0,0,0,0.65);font-family:Vazirmatn,sans-serif;';
        var rect = anchorBtn.getBoundingClientRect();
        menu.style.top = Math.min(window.innerHeight - 420, rect.bottom + 8) + 'px';
        menu.style.left = Math.max(8, Math.min(window.innerWidth - 316, rect.left - 130)) + 'px';

        function slotRow(key, emoji, label) {
            var h = _settings.hours[key];
            var checked = _settings.slots[key];
            return '<div style="margin-bottom:10px;padding:9px 10px;background:rgba(255,255,255,0.03);border-radius:10px;">' +
                '<label style="display:flex;align-items:center;gap:8px;cursor:pointer;">' +
                '<input type="checkbox" ' + (checked ? 'checked' : '') + ' data-slot="' + key + '" style="accent-color:#c9a227;">' +
                '<span style="font-size:0.9rem;">' + emoji + '</span>' +
                '<b style="color:var(--gold-200);font-size:0.82rem;flex:1;">' + label + '</b>' +
                '<select data-hour="' + key + '" style="padding:4px 6px;border-radius:8px;background:rgba(0,0,0,0.4);color:#ddd;border:1px solid rgba(255,255,255,0.12);font-size:0.72rem;font-family:inherit;">' +
                hoursOptions(h) + '</select>' +
                '</label></div>';
        }
        function hoursOptions(selected) {
            var out = '';
            for (var h = 0; h < 24; h++) {
                out += '<option value="' + h + '"' + (h === selected ? ' selected' : '') + '>' + String(h).padStart(2, '0') + ':۰۰</option>';
            }
            return out;
        }
        function featureRow(key, emoji, label) {
            var f = _settings.features[key];
            return '<div style="display:flex;align-items:center;gap:8px;padding:6px 4px;border-bottom:1px solid rgba(255,255,255,0.04);">' +
                '<input type="checkbox" ' + (f.on ? 'checked' : '') + ' data-feat="' + key + '" style="accent-color:#c9a227;">' +
                '<span style="flex:1;font-size:0.8rem;color:#ccc;">' + emoji + ' ' + label + '</span>' +
                '<label style="display:flex;align-items:center;gap:4px;cursor:pointer;font-size:0.68rem;color:#aaa;" title="کامل یا خلاصه">' +
                '<input type="checkbox" ' + (f.full ? 'checked' : '') + ' data-full="' + key + '" style="accent-color:#a29bfe;">کامل</label>' +
                '</div>';
        }

        menu.innerHTML =
            '<div style="color:var(--gold-200);font-weight:800;font-size:0.9rem;margin-bottom:10px;">🔔 تنظیماتِ یادآورِ روزانه</div>' +

            // ─── نوبت‌ها با ساعتِ دلخواه ───
            '<div style="font-size:0.75rem;color:#a29bfe;font-weight:700;margin-bottom:6px;">⏰ نوبت‌ها و ساعتِ ارسال</div>' +
            slotRow('morning', '🌅', 'صبح') +
            slotRow('noon', '☀️', 'ظهر') +
            slotRow('evening', '🌙', 'شب') +

            // ─── قابلیت‌ها ───
            '<div style="font-size:0.75rem;color:#a29bfe;font-weight:700;margin:12px 0 6px;">✨ چه اطلاعاتی در نوتیف بیاید؟</div>' +
            featureRow('biorhythm', '🧬', 'بیوریتم روز') +
            featureRow('mansion', '🌙', 'منزلِ قمر') +
            featureRow('hafez', '📜', 'فالِ حافظ') +
            featureRow('tarot', '🃏', 'کارتِ تاروتِ روز') +
            featureRow('planets', '🪐', 'موقعیت سیارات') +
            featureRow('weather', '🌤️', 'آب‌وهوا') +

            '<div style="color:#888;font-size:0.68rem;line-height:1.8;margin-top:8px;">💡 تیکِ «کامل» یعنی متنِ تفسیرِ کامل در نوتیف بیاید؛ بدونِ تیک = خلاصهٔ کوتاه.</div>' +

            // ─── نصب PWA ───
            '<div id="pwaInstallArea" style="margin-top:12px;"></div>' +

            '<button id="reminderTestBtn" style="width:100%;margin-top:10px;padding:9px;border-radius:10px;border:1px solid var(--line-strong);background:rgba(221,192,112,0.1);color:var(--gold-200);font-family:inherit;font-size:0.8rem;cursor:pointer;">🧪 نوتیفِ آزمایشی</button>' +
            '<button id="reminderCloseBtn" style="width:100%;margin-top:6px;padding:7px;border-radius:10px;border:none;background:rgba(255,255,255,0.05);color:#aaa;font-family:inherit;font-size:0.75rem;cursor:pointer;">بستن</button>';

        document.body.appendChild(menu);

        // ناحیهٔ نصب PWA
        var pwaArea = menu.querySelector('#pwaInstallArea');
        if (window.deferredPwaPrompt) {
            pwaArea.innerHTML = '<button id="pwaInstallBtn" style="width:100%;padding:10px;border-radius:10px;border:none;background:linear-gradient(180deg,#ecd9a0,#c9a227);color:#070c1f;font-family:inherit;font-size:0.8rem;font-weight:800;cursor:pointer;">📱 نصب روی ' + (/Android|iPhone|iPad/.test(navigator.userAgent) ? 'گوشی' : 'دسکتاپ') + '</button>';
            pwaArea.querySelector('#pwaInstallBtn').addEventListener('click', function () {
                window.deferredPwaPrompt.prompt();
                window.deferredPwaPrompt.userChoice.then(function () { window.deferredPwaPrompt = null; pwaArea.innerHTML = '<div style="color:#2ecc71;font-size:0.75rem;text-align:center;">✅ نصب شد — از صفحه‌ی اصلیِ گوشی/دسکتاپ باز کن</div>'; });
            });
        } else {
            pwaArea.innerHTML = '<div style="color:#888;font-size:0.7rem;text-align:center;line-height:1.8;">برایِ نصبِ اپ روی گوشی/دسکتاپ:<br>در مرورگر: منو ← «Add to Home screen» / «Install»</div>';
        }

        // رویدادها
        menu.querySelectorAll('input[data-slot]').forEach(function (cb) {
            cb.addEventListener('change', function () {
                _settings.slots[cb.getAttribute('data-slot')] = cb.checked;
                saveSettings();
            });
        });
        menu.querySelectorAll('select[data-hour]').forEach(function (sel) {
            sel.addEventListener('change', function () {
                _settings.hours[sel.getAttribute('data-hour')] = parseInt(sel.value, 10);
                saveSettings();
            });
        });
        menu.querySelectorAll('input[data-feat]').forEach(function (cb) {
            cb.addEventListener('change', function () {
                _settings.features[cb.getAttribute('data-feat')].on = cb.checked;
                saveSettings();
            });
        });
        menu.querySelectorAll('input[data-full]').forEach(function (cb) {
            cb.addEventListener('change', function () {
                _settings.features[cb.getAttribute('data-full')].full = cb.checked;
                saveSettings();
            });
        });
        menu.querySelector('#reminderCloseBtn').addEventListener('click', function () { menu.remove(); });
        menu.querySelector('#reminderTestBtn').addEventListener('click', function () {
            notify({
                title: '🧪 نوتیفِ آزمایشی',
                body: 'با تنظیماتِ فعلیِ تو ساخته شد! دکمه‌های زیر را امتحان کن.',
                actions: [
                    { action: 'open-dashboard', title: '📊 داشبورد' },
                    { action: 'open-tarot', title: '🃏 تاروت' }
                ],
                url: '/#/dashboard', tag: 'co-test'
            });
        });

        setTimeout(function () {
            document.addEventListener('click', function closer(ev) {
                if (!menu.contains(ev.target) && ev.target !== anchorBtn) {
                    menu.remove();
                    document.removeEventListener('click', closer);
                }
            });
        }, 10);
    }

    /* ─── toggle اصلی (مشترک بین دکمهٔ نوار و داشبورد) ─── */
    function toggleReminder(sourceBtn) {
        if (!_settings.enabled) {
            requestPermission().then(function (perm) {
                if (perm === 'granted') {
                    _settings.enabled = true;
                    saveSettings();
                    updateBtn();
                    renderDashboardSection();
                    showToast('🔔 یادآور روزانه فعال شد — از منوی 🔔 نوبت‌ها را تنظیم کن');
                    registerSW().then(checkSlots);
                    if (sourceBtn) openSlotMenu(sourceBtn);
                } else {
                    showToast('⚠️ مجوزِ نوتیف داده نشد — از تنظیماتِ مرورگر (آیکونِ قفل در نوارِ آدرس) فعالش کن');
                }
            });
            return;
        }
        _settings.enabled = false;
        saveSettings();
        updateBtn();
        renderDashboardSection();
        showToast('🔕 یادآور روزانه خاموش شد');
    }
    window.toggleReminder = toggleReminder;

    /* ─── بخش نوتیف در داشبورد ─── */
    function renderDashboardSection() {
        var host = document.getElementById('notifDashboardSection');
        if (!host) return;

        var enabled = _settings.enabled;
        var statusEmoji = enabled ? '🔔' : '🔕';
        var statusText = enabled ? 'فعال' : 'خاموش';
        var statusColor = enabled ? '#2ecc71' : '#e17055';

        // وضعیت نوبت‌ها
        function slotInfo(key, emoji, label) {
            var on = enabled && _settings.slots[key];
            var h = _settings.hours[key];
            var hh = String(h).padStart(2, '0') + ':۰۰';
            return '<div style="background:' + (on ? 'rgba(46,204,113,0.07)' : 'rgba(255,255,255,0.03)') + ';border-radius:12px;padding:10px 12px;text-align:center;">' +
                '<div style="font-size:1.3rem;">' + emoji + '</div>' +
                '<div style="font-size:0.75rem;color:' + (on ? '#2ecc71' : '#888') + ';font-weight:700;margin-top:2px;">' + (on ? '✓ ' : '— ') + label + '</div>' +
                '<div style="font-size:0.68rem;color:#888;">' + hh + '</div></div>';
        }

        // قابلیت‌های فعال
        var featNames = {
            biorhythm: '🧬 بیوریتم', mansion: '🌙 منزل قمر', hafez: '📜 فال حافظ',
            tarot: '🃏 تاروت روز', planets: '🪐 سیارات', weather: '🌤️ آب‌وهوا'
        };
        var featChips = '';
        Object.keys(_settings.features).forEach(function (k) {
            var f = _settings.features[k];
            featChips += '<span style="display:inline-block;padding:4px 12px;border-radius:14px;margin:3px;font-size:0.75rem;' +
                (f.on ? 'background:rgba(253,203,110,0.12);color:var(--gold-200);border:1px solid rgba(253,203,110,0.3);' : 'background:rgba(255,255,255,0.04);color:#666;border:1px solid rgba(255,255,255,0.06);') + '">' +
                featNames[k] + (f.on ? (f.full ? ' · کامل' : ' · خلاصه') : '') + '</span>';
        });

        var html =
            '<div class="mdu-card" style="margin-top:24px;">' +
                '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">' +
                    '<div class="mdu-card-title" style="margin:0;border:none;">' + statusEmoji + ' یادآورهای روزانه — <span style="color:' + statusColor + ';">' + statusText + '</span></div>' +
                    '<button class="mdb-cta" style="margin:0;" onclick="toggleReminder(this)">' + (enabled ? '🔕 خاموش‌کردن' : '🔔 روشن‌کردن') + '</button>' +
                '</div>' +
                (enabled ? (
                    '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:14px 0;">' +
                        slotInfo('morning', '🌅', 'صبح') +
                        slotInfo('noon', '☀️', 'ظهر') +
                        slotInfo('evening', '🌙', 'شب') +
                    '</div>' +
                    '<div style="font-size:0.75rem;color:#a29bfe;font-weight:700;margin-bottom:6px;">✨ اطلاعاتی که در نوتیف می‌گیری:</div>' +
                    '<div>' + featChips + '</div>' +
                    '<div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;">' +
                        '<button class="mdb-cta" style="margin:0;" onclick="openReminderSettings(this)">⚙️ تنظیمِ نوبت‌ها و قابلیت‌ها</button>' +
                        '<button class="mdb-cta" style="margin:0;background:rgba(162,155,254,0.1);" onclick="testReminderNow()">🧪 نوتیفِ آزمایشی</button>' +
                    '</div>' +
                    '<div id="pwaInstallDashboard" style="margin-top:12px;"></div>' +
                    '<div style="color:#888;font-size:0.68rem;line-height:1.8;margin-top:8px;">💡 برای دریافتِ نوتیف وقتی سایت بسته است، اپ را <b>نصب</b> کن (دکمهٔ بالا یا Install در نوارِ آدرس) و یک بار سایت را باز بگذاری. سپس نوتیف‌ها با دکمه‌های تعاملی می‌آیند.</div>'
                ) : (
                    '<p style="color:#ccc;font-size:0.85rem;line-height:2;margin-top:10px;">با روشن‌کردنِ یادآور، در <b>۳ نوبتِ روزانه</b> (صبح/ظهر/شب با ساعتِ دلخواه) اعلان می‌گیری: بیوریتمِ روز، منزلِ قمر، فال حافظ، کارت تاروت، وضعیت سیارات و آب‌وهوا — هر کدام را خودت انتخاب می‌کنی و می‌توانی خلاصه یا کامل دریافت کنی. نوتیف‌ها <b>دکمه‌های تعاملی</b> دارند و بدونِ باز کردنِ سایت کار می‌کنند.</p>' +
                    '<div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;">' +
                        '<button class="mdb-cta" style="margin:0;" onclick="toggleReminder(this)">🔔 روشن‌کردنِ یادآورها</button>' +
                    '</div>'
                )) +
            '</div>';

        host.innerHTML = html;

        // PWA install دکمه در داشبورد
        var pwa = document.getElementById('pwaInstallDashboard');
        if (pwa && enabled) {
            if (window.deferredPwaPrompt) {
                pwa.innerHTML = '<button class="mdb-cta" style="margin:0;background:linear-gradient(180deg,#ecd9a0,#c9a227);color:#070c1f;font-weight:800;border:none;" onclick="installPwa()">📱 نصب اپ روی ' + (/Android|iPhone|iPad/.test(navigator.userAgent) ? 'گوشی' : 'دسکتاپ') + '</button>';
            } else {
                pwa.innerHTML = '<div style="color:#888;font-size:0.72rem;">📱 برای نصب: منوی مرورگر ← «Add to Home screen» / «Install»</div>';
            }
        }
    }

    window.openReminderSettings = function (btn) { openSlotMenu(btn); };
    window.testReminderNow = function () {
        notify({
            title: '🧪 نوتیفِ آزمایشی',
            body: 'با تنظیماتِ فعلیِ تو ساخته شد! دکمه‌های زیر را امتحان کن.',
            actions: [{ action: 'open-dashboard', title: '📊 داشبورد' }, { action: 'open-tarot', title: '🃏 تاروت' }],
            url: '/#/dashboard', tag: 'co-test'
        });
    };
    window.installPwa = function () {
        if (window.deferredPwaPrompt) {
            window.deferredPwaPrompt.prompt();
            window.deferredPwaPrompt.userChoice.then(function () { window.deferredPwaPrompt = null; renderDashboardSection(); });
        }
    };

    /* ─── init ─── */
    function init() {
        try {
            console.log('[DailyReminder] init started, v5');
            loadSettings();
            _initInner();
        } catch (e) {
            console.error('[DailyReminder] init FAILED:', e);
        }
    }

    function _initInner() {

        // دکمهٔ نوار بالا — درجِ مطمئن بعد از earth-status (با retry)
        function insertTopbarBtn(tries) {
            if (document.getElementById('dailyReminderBtn')) return;
            var container = document.querySelector('.header-actions');
            if (!container) return;
            var btn = document.createElement('button');
            btn.id = 'dailyReminderBtn';
            btn.className = 'btn-action tb-icon-only';
            btn.textContent = _settings.enabled ? '🔔' : '🔕';
            btn.title = 'یادآور روزانه';
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                // اگر فعال است، کلیک = منوی تنظیمات؛ اگر خاموش، روشن‌کردن
                if (_settings.enabled) openSlotMenu(btn);
                else toggleReminder(btn);
            });
            btn.addEventListener('contextmenu', function (e) {
                e.preventDefault();
                openSlotMenu(btn);
            });
            // درج قبل از منوی ⋯ (actionsMenuBtn)
            var ref = document.getElementById('actionsMenuBtn');
            if (ref && ref.parentElement === container) container.insertBefore(btn, ref);
            else container.appendChild(btn);
        }
        insertTopbarBtn(0);
        // اگر هنوز نبود (lazy load)، بعد از لود کامل دوباره
        if (!document.getElementById('dailyReminderBtn')) {
            window.addEventListener('load', function () { insertTopbarBtn(1); updateBtn(); });
        }
        updateBtn();

        if (_settings.enabled) {
            registerSW().then(function () {
                checkSlots();
                // چک هر ۱۰ دقیقه
                _checkTimer = setInterval(checkSlots, 10 * 60 * 1000);
                // چک وقتی تب دیده می‌شود (کاربر برگشته)
                document.addEventListener('visibilitychange', function () {
                    if (!document.hidden) checkSlots();
                });
            });
        }

        // گرفتنِ رویدادِ نصبِ PWA (نوارِ آدرس: Install icon)
        window.addEventListener('beforeinstallprompt', function (e) {
            e.preventDefault();
            window.deferredPwaPrompt = e;
        });

        // رندرِ بخشِ داشبورد (اگر صفحهٔ داشبورد باز است)
        renderDashboardSection();
        console.log('[DailyReminder] init complete — topbar btn:', !!document.getElementById('dailyReminderBtn'));

        // وقتی داشبورد باز می‌شود هم رندر شود (بدون wrapper — با polling سبک)
        var _dashPoll = setInterval(function () {
            var host = document.getElementById('notifDashboardSection');
            if (host && host.offsetParent !== null && !host.innerHTML.trim()) {
                renderDashboardSection();
            }
        }, 1500);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    return {
        init: init,
        isEnabled: function () { return _settings.enabled; },
        checkNow: checkSlots
    };
})();
