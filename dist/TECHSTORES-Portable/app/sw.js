/* Tech Stores service worker — offline app shell + cached modules after first visit. */
const CACHE = 'techstores-offline-v7';
const SHELL = [
  './index.html',
  './css/main.css',
  './manifest.webmanifest',
  './modules/manifest.json',
  '../assets/favicon.png',
  '../assets/login-logo.png',
  '../assets/pwa-icon-192.png',
  '../assets/pwa-icon-512.png'
];

async function offlineAssetResponse(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  if (request.mode === 'navigate') {
    const index =
      (await caches.match('./index.html'))
      || (await caches.match('/app/index.html'))
      || (await caches.match('index.html'));
    if (index) return index;
  }

  const url = new URL(request.url);
  if (url.pathname.endsWith('/')) {
    const indexUrl = `${url.pathname}index.html`;
    const index = await caches.match(indexUrl);
    if (index) return index;
  }

  return new Response(
    '<!DOCTYPE html><html><body style="font-family:sans-serif;padding:2rem">'
    + '<h1>Tech Stores offline</h1>'
    + '<p>Start <strong>START-OFFLINE.bat</strong> or run the app online once to cache this page.</p>'
    + '<p>Then you can use the same URL without the full database server.</p>'
    + '</body></html>',
    { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}

async function cacheModuleAssets() {
  const cache = await caches.open(CACHE);
  let moduleIds = [];
  try {
    const manifestRes = await fetch('./modules/manifest.json');
    if (manifestRes.ok) {
      const data = await manifestRes.json();
      moduleIds = Array.isArray(data.modules) ? data.modules : [];
    }
  } catch (_) { /* ignore */ }

  const urls = [...SHELL];
  if ('serviceWorker' in navigator) {
    /* populated from page via CACHE_URLS message */
  }
  moduleIds.forEach((id) => {
    urls.push(`./modules/${encodeURIComponent(id)}.html`);
  });

  await Promise.all(urls.map(async (url) => {
    try {
      const res = await fetch(url, { cache: 'reload' });
      if (res.ok) await cache.put(url, res);
    } catch (_) { /* ignore */ }
  }));
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(SHELL).catch(() => undefined))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'CACHE_OFFLINE_ASSETS') {
    event.waitUntil((async () => {
      if (Array.isArray(event.data.urls) && event.data.urls.length) {
        const cache = await caches.open(CACHE);
        await Promise.all(event.data.urls.map(async (url) => {
          try {
            const res = await fetch(url, { cache: 'reload' });
            if (res.ok) await cache.put(url, res);
          } catch (_) { /* ignore */ }
        }));
      }
      await cacheModuleAssets();
    })());
  }
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.ok && (url.pathname.includes('/app/') || url.pathname.includes('/assets/'))) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => undefined);
        }
        return res;
      })
      .catch(() => offlineAssetResponse(req))
  );
});
