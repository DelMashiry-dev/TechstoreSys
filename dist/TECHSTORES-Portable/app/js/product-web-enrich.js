/* product-web-enrich.js — local catalog first; crawl the web only when necessary */

const PRODUCT_WEB_CACHE_KEY = 'techstores.productWebCache.v1';
const PRODUCT_WEB_CACHE_TTL_MS = 14 * 24 * 60 * 60 * 1000;
const PRODUCT_WEB_INFLIGHT = new Map();

function productWebCacheKey(name) {
    return String(name || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function loadProductWebCacheStore() {
    try {
        const raw = localStorage.getItem(PRODUCT_WEB_CACHE_KEY);
        const data = raw ? JSON.parse(raw) : {};
        return data && typeof data === 'object' ? data : {};
    } catch (_) {
        return {};
    }
}

function saveProductWebCacheStore(store) {
    try {
        const keys = Object.keys(store);
        if (keys.length > 250) {
            const oldest = keys
                .map((k) => [k, store[k]?.cachedAt || 0])
                .sort((a, b) => a[1] - b[1]);
            oldest.slice(0, keys.length - 250).forEach(([k]) => { delete store[k]; });
        }
        localStorage.setItem(PRODUCT_WEB_CACHE_KEY, JSON.stringify(store));
    } catch (_) { /* quota / private mode */ }
}

function getCachedProductWebEnrich(itemName) {
    const key = productWebCacheKey(itemName);
    if (!key) return null;
    const row = loadProductWebCacheStore()[key];
    if (!row?.result) return null;
    if (row.cachedAt && (Date.now() - row.cachedAt) > PRODUCT_WEB_CACHE_TTL_MS) return null;
    return row.result;
}

function saveCachedProductWebEnrich(itemName, result) {
    const key = productWebCacheKey(itemName);
    if (!key || !result?.ok) return;
    const store = loadProductWebCacheStore();
    store[key] = { cachedAt: Date.now(), result };
    saveProductWebCacheStore(store);
}

function isWebEnrichCandidate(itemName, familyKey, typeCode) {
    const name = String(itemName || '').trim();
    if (name.length < 4) return false;
    const type = String(typeCode || '');
    const fam = String(familyKey || '');
    if (['Print', 'Srv', 'Net', 'Lap', 'Desk', 'Tab', 'Ict', 'Mon'].includes(type)) return true;
    if (fam === 'ict') return true;
    if (/\b(printer|mfp|laserjet|server|proliant|poweredge|switch|router|firewall|catalyst|tablet|ipad|laptop|notebook|ups)\b/i.test(name)) {
        return true;
    }
    return /[a-z]/i.test(name) && /\d/.test(name) && fam !== 'software';
}

function shouldCrawlProductWeb(itemName, familyKey, typeCode) {
    if (!isWebEnrichCandidate(itemName, familyKey, typeCode)) return false;
    if (getCachedProductWebEnrich(itemName)?.ok) return false;
    return true;
}

async function fetchProductWebEnrich(itemName, { force = false } = {}) {
    const name = String(itemName || '').trim();
    if (name.length < 2) return null;
    if (!force) {
        const cached = getCachedProductWebEnrich(name);
        if (cached) return cached;
    }
    const inflightKey = `${productWebCacheKey(name)}|${force ? '1' : '0'}`;
    if (PRODUCT_WEB_INFLIGHT.has(inflightKey)) return PRODUCT_WEB_INFLIGHT.get(inflightKey);

    const apiBase = typeof API_BASE === 'string' ? API_BASE : '';
    const job = (async () => {
        const response = await fetch(`${apiBase}/api/product-enrich`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: name, force })
        });
        let payload = null;
        try {
            payload = await response.json();
        } catch (_) {
            payload = null;
        }
        if (!response.ok || !payload?.ok) {
            const err = new Error(payload?.error || `Online lookup failed (${response.status})`);
            err.offline = response.status === 404 || response.status === 0;
            throw err;
        }
        saveCachedProductWebEnrich(name, payload);
        return payload;
    })();

    PRODUCT_WEB_INFLIGHT.set(inflightKey, job);
    try {
        return await job;
    } finally {
        PRODUCT_WEB_INFLIGHT.delete(inflightKey);
    }
}

function applyWebEnrichToInventoryUi(itemName, payload) {
    if (!payload?.ok) return;
    // Specs / datasheet only — inventory thumbnails stay local transparent PNGs (assets/inventory).
}

async function ensureProductWebEnrich(itemName, familyKey, typeCode, { force = false } = {}) {
    const cached = getCachedProductWebEnrich(itemName);
    if (cached && !force) {
        applyWebEnrichToInventoryUi(itemName, cached);
        return cached;
    }
    if (!force && !shouldCrawlProductWeb(itemName, familyKey, typeCode)) return cached || null;
    try {
        const payload = await fetchProductWebEnrich(itemName, { force });
        applyWebEnrichToInventoryUi(itemName, payload);
        return payload;
    } catch (_) {
        return null;
    }
}

function prefetchVisibleInventoryWebEnrich(root) {
    if (!root) return;
    const names = [];
    root.querySelectorAll('[data-psr-item-name]').forEach((el) => {
        names.push({
            name: el.getAttribute('data-psr-item-name') || '',
            family: el.getAttribute('data-psr-item-family') || '',
            type: el.getAttribute('data-psr-item-type') || ''
        });
    });
    let i = 0;
    const next = () => {
        while (i < names.length) {
            const row = names[i++];
            if (!shouldCrawlProductWeb(row.name, row.family, row.type)) continue;
            ensureProductWebEnrich(row.name, row.family, row.type).finally(() => {
                setTimeout(next, 400);
            });
            return;
        }
    };
    next();
}

window.getCachedProductWebEnrich = getCachedProductWebEnrich;
window.shouldCrawlProductWeb = shouldCrawlProductWeb;
window.fetchProductWebEnrich = fetchProductWebEnrich;
window.ensureProductWebEnrich = ensureProductWebEnrich;
window.prefetchVisibleInventoryWebEnrich = prefetchVisibleInventoryWebEnrich;
window.applyWebEnrichToInventoryUi = applyWebEnrichToInventoryUi;
