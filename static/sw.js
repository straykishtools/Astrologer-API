/* sw.js — service worker برای PWA «اختر»
   فقط /static/** را Cache-First می‌کند. صفحات HTML شبکه‌ای می‌مانند.
   نسخه‌ی کش در CACHE_NAME: بعد از هر تغییر اساسی، v را بالا ببر.
*/
'use strict';

const CACHE_NAME = 'akhtar-static-v1';
const STATIC_PREFIX = '/static/';
// فایل‌های ضروری برای حالت آفلاین (pre-cache در install)
const PRECACHE = [
    '/static/icons/akhtar-wordmark.svg',
    '/static/style.css',
    '/static/kinetics.css',
    '/static/script.js',
    '/static/kinetics.js',
    '/static/kinetics-cosmic.js',
    '/static/kinetics-ui.js',
    '/static/manifest.json',
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) =>
            // pre-cache ولی شکست نخوریم اگر یکی نبود (مثلاً فایل تغییر نام داده)
            Promise.all(
                PRECACHE.map((url) =>
                    cache.add(url).catch(() => null)
                )
            )
        ).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
            )
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('message', (event) => {
    if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
    const req = event.request;
    // فقط GET
    if (req.method !== 'GET') return;
    // فقط /static/**
    const url = new URL(req.url);
    if (url.origin !== self.location.origin) return;
    if (!url.pathname.startsWith(STATIC_PREFIX)) return;

    // Cache-First با fallback به شبکه
    event.respondWith(
        caches.open(CACHE_NAME).then(async (cache) => {
            const cached = await cache.match(req);
            if (cached) {
                // در پس‌زمینه تازه کن (stale-while-revalidate ملایم)
                fetch(req).then((res) => {
                    if (res && res.ok) cache.put(req, res.clone());
                }).catch(() => {});
                return cached;
            }
            return fetch(req).then((res) => {
                if (res && res.ok) cache.put(req, res.clone());
                return res;
            });
        })
    );
});
