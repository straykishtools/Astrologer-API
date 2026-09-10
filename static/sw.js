// ================================================================
//   SERVICE WORKER — نوتیف‌های تعاملی Cosmic Oracle
//   دکمه‌های اکشن بدون باز کردن اپ + کلیک با payload
// ================================================================

var VERSION = 'v1';

self.addEventListener('install', function (e) {
    self.skipWaiting();
});

self.addEventListener('activate', function (e) {
    e.waitUntil(clients.claim());
});

// ─── نمایش نوتیف (از صفحه فراخوانی می‌شود) ───
self.addEventListener('message', function (e) {
    var d = e.data || {};
    if (d.type === 'SHOW_NOTIFICATION') {
        var opts = {
            body: d.body || '',
            icon: d.icon || '/static/images/ui/logo.svg',
            badge: d.icon || '/static/images/ui/logo.svg',
            tag: d.tag || ('co-' + Date.now()),
            renotify: true,
            data: { url: d.url || '/', action: d.action || null },
            vibrate: [80, 40, 80]
        };
        // دکمه‌های اکشن — تعاملی بدون باز کردن اپ
        if (d.actions && d.actions.length) {
            opts.actions = d.actions; // [{action:'x', title:'...'}]
        }
        if (d.requireInteraction) opts.requireInteraction = true;
        self.registration.showNotification(d.title || 'Cosmic Oracle', opts);
    }
});

// ─── کلیک روی بدنه/دکمه‌های نوتیف ───
self.addEventListener('notificationclick', function (e) {
    var notif = e.notification;
    var action = e.action; // '' یعنی کلیک روی خودِ بدنه
    var data = notif.data || {};
    notif.close();

    e.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
            // اگر اکشنِ خاصی داشت (مثلاً «دفتر ثبت کن»)، به URLِ خاصی برو
            var targetUrl = data.url || '/';
            if (action === 'open-dashboard') targetUrl = '/#/dashboard';
            else if (action === 'open-tarot') targetUrl = '/#/app/tarot';
            else if (action === 'open-yoga') targetUrl = '/#/yoga';
            else if (action === 'open-tools') targetUrl = '/#/app/birth';

            // تبِ موجود را فوکوس کن یا تبِ جدید باز کن
            for (var i = 0; i < clientList.length; i++) {
                var client = clientList[i];
                if ('focus' in client) {
                    client.navigate(targetUrl).catch(function(){});
                    return client.focus();
                }
            }
            return clients.openWindow(targetUrl);
        })
    );
});
