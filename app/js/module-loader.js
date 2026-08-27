/* module-loader.js — load standalone form HTML from app/modules/<id>.html */

const MODULE_HTML_CACHE = Object.create(null);
const MODULE_LOAD_PROMISES = Object.create(null);
let moduleManifestIds = null;

function getModulesHost() {
    let host = document.getElementById('modules-host');
    if (!host) {
        host = document.createElement('div');
        host.id = 'modules-host';
        host.className = 'modules-host';
        const main = document.querySelector('.main-content');
        if (main) main.appendChild(host);
        else document.body.appendChild(host);
    }
    return host;
}

async function fetchAppAsset(url) {
    try {
        const res = await fetch(url, { cache: 'no-cache' });
        if (res.ok) return res;
    } catch (_) { /* offline */ }
    if ('caches' in window) {
        const cached = await caches.match(url);
        if (cached) return cached;
    }
    throw new Error(`Asset unavailable offline: ${url}`);
}

async function fetchModuleManifest() {
    if (moduleManifestIds) return moduleManifestIds;
    try {
        const res = await fetchAppAsset('modules/manifest.json');
        const data = await res.json();
        moduleManifestIds = Array.isArray(data.modules) ? data.modules : [];
        return moduleManifestIds;
    } catch (e) {
        console.warn('Module manifest unavailable', e);
    }
    moduleManifestIds = [];
    return moduleManifestIds;
}

async function loadModuleHtml(moduleId) {
    if (!moduleId || moduleId === 'dashboard') return null;
    if (MODULE_HTML_CACHE[moduleId]) return MODULE_HTML_CACHE[moduleId];
    if (MODULE_LOAD_PROMISES[moduleId]) return MODULE_LOAD_PROMISES[moduleId];

    // Generated IT Dir department desks (no separate HTML file required)
    if (typeof getDeptDeskHtml === 'function') {
        const generated = getDeptDeskHtml(moduleId);
        if (generated) {
            MODULE_HTML_CACHE[moduleId] = generated;
            return generated;
        }
    }

    MODULE_LOAD_PROMISES[moduleId] = (async () => {
        const url = `modules/${encodeURIComponent(moduleId)}.html`;
        const res = await fetchAppAsset(url);
        if (!res.ok) throw new Error(`Module HTML not found: ${moduleId} (${res.status})`);
        const html = await res.text();
        MODULE_HTML_CACHE[moduleId] = html;
        return html;
    })();

    try {
        return await MODULE_LOAD_PROMISES[moduleId];
    } finally {
        delete MODULE_LOAD_PROMISES[moduleId];
    }
}

function wireModuleShellEvents(root) {
    if (!root) return;
    root.querySelectorAll('.close-btn').forEach((btn) => {
        if (btn.dataset.moduleWired === '1') return;
        btn.dataset.moduleWired = '1';
        btn.addEventListener('click', () => {
            if (typeof navigateToModule === 'function') navigateToModule('dashboard', { clearHistory: true });
        });
    });
    if (typeof initFormBackButtons === 'function') initFormBackButtons();
    if (typeof initTableSearch === 'function') initTableSearch();
    if (typeof initStickyModuleActions === 'function') initStickyModuleActions();
}

async function ensureModuleLoaded(moduleId) {
    if (!moduleId || moduleId === 'dashboard') return document.getElementById('dashboard');
    let el = document.getElementById(moduleId);
    if (el) return el;

    const html = await loadModuleHtml(moduleId);
    const host = getModulesHost();
    const wrap = document.createElement('div');
    wrap.innerHTML = html.trim();
    el = wrap.firstElementChild;
    if (!el) throw new Error(`Empty module markup: ${moduleId}`);
    el.style.display = 'none';
    host.appendChild(el);
    wireModuleShellEvents(el);

    // Restore saved field values for this module if available
    if (typeof restoreModule === 'function' && appState?.modules?.[moduleId]) {
        try { restoreModule(moduleId, appState.modules[moduleId]); } catch (e) { console.warn(e); }
    }
    if (typeof applyDateInputConstraints === 'function') applyDateInputConstraints(el);
    if (typeof enhanceFieldHelp === 'function') enhanceFieldHelp(el);
    if (typeof initHowItWorks === 'function') initHowItWorks(el);

    return el;
}

async function preloadAllModules(options = {}) {
    const ids = options.ids || await fetchModuleManifest();
    const concurrency = options.concurrency || 4;
    let i = 0;
    async function worker() {
        while (i < ids.length) {
            const id = ids[i++];
            try {
                await ensureModuleLoaded(id);
            } catch (e) {
                console.warn('Preload failed', id, e);
            }
        }
    }
    await Promise.all(Array.from({ length: concurrency }, () => worker()));
}

function initModuleLoader() {
    getModulesHost();
    // Boot handles full preload before restore; skip duplicate background preload when booting
}

document.addEventListener('DOMContentLoaded', () => {
    initModuleLoader();
});
