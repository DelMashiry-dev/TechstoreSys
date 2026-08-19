/* Tech Stores service worker — caches app shell for offline launch after first visit.
   Requires a secure context (HTTPS or localhost). LAN HTTP still works in the browser. */
const CACHE = 'techstores-shell-v1';
const SHELL = [
  './index.html',
  './css/main.css',
  './manifest.webmanifest',
  '../assets/favicon.png',
  '../assets/login-logo.png',
  '../assets/pwa-icon-192.png',
  '../assets/pwa-icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL).catch(() => undefined)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  // Prefer network for API; cache-first for shell assets
  if (url.pathname.startsWith('/api/')) return;

  event.respondWith(
    caches.match(req).then((cached) => {
      const fetched = fetch(req)
        .then((res) => {
          if (res && res.ok && (url.pathname.includes('/app/') || url.pathname.includes('/assets/'))) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => undefined);
          }
          return res;
        })
        .catch(() => cached);
      return cached || fetched;
    })
  );
});
