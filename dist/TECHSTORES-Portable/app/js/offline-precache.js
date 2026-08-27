/* offline-precache.js — cache scripts/styles/modules for offline use */

async function precacheAppAssetsForOffline() {
    if (!('serviceWorker' in navigator) || !('caches' in window)) return;
    try {
        const reg = await navigator.serviceWorker.ready;
        const urls = [];
        document.querySelectorAll('script[src], link[rel="stylesheet"]').forEach((el) => {
            const href = el.src || el.href;
            if (href && href.startsWith(location.origin)) urls.push(href);
        });
        reg.active?.postMessage({ type: 'CACHE_OFFLINE_ASSETS', urls });
        if (typeof warmOfflineModuleCache === 'function') warmOfflineModuleCache();
    } catch (err) {
        console.warn('Offline precache skipped', err);
    }
}

window.precacheAppAssetsForOffline = precacheAppAssetsForOffline;
