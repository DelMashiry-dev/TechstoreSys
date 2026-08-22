/* offline-store.js — durable IndexedDB storage + offline login cache + server sync queue */

const OFFLINE_IDB_NAME = 'techstores-offline-v1';
const OFFLINE_IDB_VERSION = 1;
const OFFLINE_STATE_KEY = 'appState';
const OFFLINE_META_KEY = 'meta';

let offlineDbPromise = null;

function openOfflineDb() {
    if (offlineDbPromise) return offlineDbPromise;
    offlineDbPromise = new Promise((resolve, reject) => {
        if (!('indexedDB' in window)) {
            reject(new Error('IndexedDB unavailable'));
            return;
        }
        const req = indexedDB.open(OFFLINE_IDB_NAME, OFFLINE_IDB_VERSION);
        req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains('kv')) {
                db.createObjectStore('kv');
            }
            if (!db.objectStoreNames.contains('auth')) {
                db.createObjectStore('auth', { keyPath: 'username' });
            }
            if (!db.objectStoreNames.contains('syncQueue')) {
                db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error || new Error('IndexedDB open failed'));
    });
    return offlineDbPromise;
}

function idbTx(storeNames, mode = 'readonly') {
    return openOfflineDb().then((db) => {
        const tx = db.transaction(storeNames, mode);
        return { db, tx };
    });
}

function idbGet(store, key) {
    return new Promise((resolve, reject) => {
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

function idbPut(store, value, key) {
    return new Promise((resolve, reject) => {
        const req = key === undefined ? store.put(value) : store.put(value, key);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

function idbDelete(store, key) {
    return new Promise((resolve, reject) => {
        const req = store.delete(key);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
    });
}

function idbGetAll(store) {
    return new Promise((resolve, reject) => {
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
    });
}

async function sha256Hex(text) {
    if (!window.crypto?.subtle) {
        return String(text);
    }
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function initOfflineStore() {
    try {
        await openOfflineDb();
        return true;
    } catch (err) {
        console.warn('Offline store unavailable', err);
        return false;
    }
}

async function saveOfflineAppState(state) {
    if (!state) return false;
    try {
        const { tx } = await idbTx(['kv'], 'readwrite');
        const store = tx.objectStore('kv');
        await idbPut(store, {
            state,
            savedAt: new Date().toISOString(),
            revision: Number(state.saveRevision) || 0
        }, OFFLINE_STATE_KEY);
        await idbPut(store, {
            durable: true,
            updatedAt: new Date().toISOString()
        }, OFFLINE_META_KEY);
        offlineDurable = true;
        return true;
    } catch (err) {
        console.warn('Failed to save offline state', err);
        return false;
    }
}

async function loadOfflineAppState() {
    try {
        const { tx } = await idbTx(['kv'], 'readonly');
        const row = await idbGet(tx.objectStore('kv'), OFFLINE_STATE_KEY);
        if (row?.state) {
            offlineDurable = true;
            return row.state;
        }
    } catch (err) {
        console.warn('Failed to load offline state', err);
    }
    return null;
}

async function cacheOfflineLogin(username, password, user) {
    if (!username || !password || !user) return;
    try {
        const digest = await sha256Hex(`${String(username).toLowerCase()}:${password}`);
        const { tx } = await idbTx(['auth'], 'readwrite');
        await idbPut(tx.objectStore('auth'), {
            username: String(username).toLowerCase(),
            digest,
            user: {
                id: user.id,
                username: user.username,
                name: user.name,
                role: user.role,
                department: user.department,
                active: user.active !== false,
                mustChangePassword: !!user.mustChangePassword
            },
            cachedAt: new Date().toISOString()
        });
    } catch (err) {
        console.warn('Failed to cache offline login', err);
    }
}

async function verifyOfflineLogin(username, password) {
    const key = String(username || '').trim().toLowerCase();
    if (!key || !password) return null;
    try {
        const digest = await sha256Hex(`${key}:${password}`);
        const { tx } = await idbTx(['auth'], 'readonly');
        const row = await idbGet(tx.objectStore('auth'), key);
        if (row?.digest === digest && row.user) return row.user;
    } catch (err) {
        console.warn('Offline login verify failed', err);
    }
    return null;
}

async function queueOfflineSync(payload) {
    try {
        const { tx } = await idbTx(['syncQueue', 'kv'], 'readwrite');
        await idbPut(tx.objectStore('syncQueue'), {
            payload,
            queuedAt: new Date().toISOString()
        });
        pendingServerSync = true;
        await idbPut(tx.objectStore('kv'), { pendingSync: true, updatedAt: new Date().toISOString() }, OFFLINE_META_KEY);
    } catch (err) {
        console.warn('Failed to queue offline sync', err);
    }
}

async function flushOfflineSyncQueue(syncFn) {
    if (typeof syncFn !== 'function') return false;
    try {
        const { tx } = await idbTx(['syncQueue', 'kv'], 'readwrite');
        const store = tx.objectStore('syncQueue');
        const rows = await idbGetAll(store);
        if (!rows.length) {
            pendingServerSync = false;
            return true;
        }
        for (const row of rows) {
            await syncFn(row.payload);
            await idbDelete(store, row.id);
        }
        pendingServerSync = false;
        await idbPut(tx.objectStore('kv'), { pendingSync: false, updatedAt: new Date().toISOString() }, OFFLINE_META_KEY);
        return true;
    } catch (err) {
        console.warn('Offline sync flush failed', err);
        return false;
    }
}

async function warmOfflineModuleCache() {
    if (!('serviceWorker' in navigator) || !('caches' in window)) return;
    try {
        const reg = await navigator.serviceWorker.ready;
        if (reg?.active) {
            reg.active.postMessage({ type: 'CACHE_OFFLINE_ASSETS' });
        }
    } catch (_) { /* optional */ }
}

window.initOfflineStore = initOfflineStore;
window.saveOfflineAppState = saveOfflineAppState;
window.loadOfflineAppState = loadOfflineAppState;
window.cacheOfflineLogin = cacheOfflineLogin;
window.verifyOfflineLogin = verifyOfflineLogin;
window.queueOfflineSync = queueOfflineSync;
window.flushOfflineSyncQueue = flushOfflineSyncQueue;
window.warmOfflineModuleCache = warmOfflineModuleCache;
