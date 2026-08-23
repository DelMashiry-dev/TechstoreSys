/* storage-mode.js — detect online vs offline shell vs local-only; in-app mode toggle */

let modeToggleBusy = false;
const MODE_LAUNCHER_BASE = 'http://127.0.0.1:8765';
const PREFERRED_MODE_KEY = 'techstoresPreferredMode';
const AUTOSTART_INSTALLED_KEY = 'techstoresAutostartInstalled';

function getPreferredStorageMode() {
    const saved = localStorage.getItem(PREFERRED_MODE_KEY);
    if (saved === 'offline') return 'offline';
    return 'online';
}

function ensureOnlinePreferredByDefault() {
    if (!localStorage.getItem(PREFERRED_MODE_KEY)) {
        localStorage.setItem(PREFERRED_MODE_KEY, 'online');
    }
}

function setPreferredStorageMode(target) {
    localStorage.setItem(PREFERRED_MODE_KEY, target === 'offline' ? 'offline' : 'online');
}

async function tryWakeServerViaProtocol(target) {
    if (localStorage.getItem(AUTOSTART_INSTALLED_KEY) !== '1') return false;
    try {
        const iframe = document.createElement('iframe');
        iframe.hidden = true;
        iframe.style.display = 'none';
        iframe.src = `techstores-wake:${target === 'offline' ? 'offline' : 'online'}`;
        document.body.appendChild(iframe);
        await new Promise((resolve) => setTimeout(resolve, 1200));
        iframe.remove();
    } catch (_) { /* ignore */ }
    return !!(await fetchLauncherHealth(2500));
}

async function fetchLauncherHealth(timeoutMs = 2500) {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
    try {
        const response = await fetch(`${MODE_LAUNCHER_BASE}/api/health`, {
            cache: 'no-store',
            signal: controller?.signal
        });
        if (!response.ok) return null;
        const data = await response.json();
        if (data?.launcher) {
            localStorage.setItem(AUTOSTART_INSTALLED_KEY, '1');
        }
        return data;
    } catch (_) {
        return null;
    } finally {
        if (timer) clearTimeout(timer);
    }
}

async function postModeSwitch(target) {
    const payload = { target };
    const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    };

    if (typeof apiRequestWithTimeout === 'function') {
        try {
            return await apiRequestWithTimeout('/api/mode/switch', 12000, options);
        } catch (error) {
            if (error?.status === 401 || error?.status === 403) throw error;
        }
    }

    let launcher = await fetchLauncherHealth(2000);
    if (!launcher?.launcher) {
        await tryWakeServerViaProtocol(payload.target);
        launcher = await fetchLauncherHealth(3000);
    }
    if (!launcher?.launcher) {
        throw new Error(
            'Server helper is not running. Double-click OPEN-TECHSTORES.bat in the project folder, '
            + 'or run scripts\\install-autostart.bat once to enable auto-start.'
        );
    }

    const response = await fetch(`${MODE_LAUNCHER_BASE}/api/mode/switch`, options);
    let data = null;
    try {
        data = await response.json();
    } catch (_) {
        data = null;
    }
    if (!response.ok) {
        const message = (data && data.error) || `Launcher switch failed (${response.status})`;
        throw new Error(message);
    }
    return data;
}

async function probeStorageMode(options = {}) {
    const loginScreen = document.body?.classList.contains('app-locked');
    const useFresh = options.fresh !== false;
    if (!useFresh && probeStorageMode._at && Date.now() - probeStorageMode._at < 5000) {
        return storageMode;
    }
    const attempts = Number(options.attempts) || (loginScreen ? 2 : 4);
    const delayMs = Number(options.delayMs) || (loginScreen ? 200 : 450);
    const timeoutMs = Number(options.timeoutMs) || (loginScreen ? 900 : 2000);
    for (let attempt = 0; attempt < attempts; attempt += 1) {
        try {
            const health = await apiRequestWithTimeout('/api/health', timeoutMs);
            if (health?.database) {
                storageMode = 'online';
                probeStorageMode._at = Date.now();
                return storageMode;
            }
            if (health?.offlineShell || health?.mode === 'offline-shell') {
                storageMode = 'offline-shell';
                probeStorageMode._at = Date.now();
                return storageMode;
            }
        } catch (_) {
            if (attempt < attempts - 1) {
                await new Promise((resolve) => setTimeout(resolve, delayMs));
            }
        }
    }
    storageMode = offlineDurable ? 'offline-local' : 'local-only';
    probeStorageMode._at = Date.now();
    return storageMode;
}
probeStorageMode._at = 0;

function isStorageModeOnline() {
    return storageMode === 'online';
}

function getStorageModeLabel() {
    if (storageMode === 'online') {
        return pendingServerSync ? 'Online — syncing' : 'Online — SQLite';
    }
    if (storageMode === 'offline-shell') return 'Offline shell';
    if (storageMode === 'offline-local') return 'Offline — local copy';
    return 'Local only';
}

function getStorageModeHelp() {
    if (storageMode === 'online') {
        return {
            title: 'Online mode (database server)',
            body: 'Data saves to techstores.db on this PC. Shared across users and survives restarts.',
            switchTo: 'Use the toggle below to switch to offline mode (browser storage).'
        };
    }
    if (storageMode === 'offline-shell') {
        return {
            title: 'Offline shell',
            body: 'The lightweight offline server is running. Data saves in your browser (IndexedDB) and syncs when you switch back to online.',
            switchTo: 'Use the toggle below to switch to online mode (SQLite database).'
        };
    }
    if (storageMode === 'offline-local') {
        return {
            title: 'Offline — local copy',
            body: 'No app server on port 8080. Your work is in the browser. Use the toggle on the login form to start offline or online mode.',
            switchTo: 'If the toggle does nothing, run START-OFFLINE.bat or START-SYSTEM.bat once (starts the background launcher).'
        };
    }
    return {
        title: 'Local only',
        body: 'No server detected. Use the Storage mode toggle on the login form, or run START-SYSTEM.bat / START-OFFLINE.bat.',
        switchTo: 'The launcher on port 8765 lets the toggle start servers after you run a starter batch file once.'
    };
}

function storageModeToggleMarkup(id) {
    return `
        <span class="storage-mode-toggle-label" data-side="offline">Offline</span>
        <button type="button" class="storage-mode-toggle" id="${id}" role="switch"
            aria-checked="false" aria-label="Switch between online and offline storage">
            <span class="storage-mode-toggle-track"><span class="storage-mode-toggle-thumb"></span></span>
        </button>
        <span class="storage-mode-toggle-label" data-side="online">Online</span>
    `;
}

function ensureStorageModeModal() {
    let modal = document.getElementById('storageModeModal');
    if (modal) return modal;

    modal = document.createElement('div');
    modal.id = 'storageModeModal';
    modal.className = 'storage-mode-modal';
    modal.hidden = true;
    modal.innerHTML = `
        <div class="storage-mode-backdrop" data-sm-close></div>
        <div class="storage-mode-panel" role="dialog" aria-labelledby="storageModeTitle">
            <header class="storage-mode-head">
                <h2 id="storageModeTitle">Storage mode</h2>
                <button type="button" class="btn btn-ghost btn-sm" data-sm-close aria-label="Close">✕</button>
            </header>
            <div class="storage-mode-body">
                <p class="storage-mode-current" id="storageModeCurrent">—</p>
                <div class="storage-mode-toggle-row" id="storageModeModalToggleRow">
                    ${storageModeToggleMarkup('storageModeModalToggle')}
                </div>
                <p class="storage-mode-status muted" id="storageModeStatus"></p>
                <p class="storage-mode-desc" id="storageModeDesc"></p>
                <p class="storage-mode-switch muted" id="storageModeSwitch"></p>
                <div class="storage-mode-actions">
                    <button type="button" class="btn btn-primary btn-sm" id="storageModeReconnectBtn">Reconnect to database</button>
                    <button type="button" class="btn btn-secondary btn-sm" id="storageModeReloadBtn">Reload page</button>
                </div>
                <p class="storage-mode-foot muted">Fallback: <strong>TECHSTORES-MODE.bat</strong> in the project folder.</p>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    modal.querySelectorAll('[data-sm-close]').forEach((el) => {
        el.addEventListener('click', closeStorageModeModal);
    });
    modal.querySelector('#storageModeReconnectBtn')?.addEventListener('click', async () => {
        const btn = modal.querySelector('#storageModeReconnectBtn');
        if (btn) { btn.disabled = true; btn.textContent = 'Connecting…'; }
        await probeStorageMode();
        if (typeof reconnectDatabaseIfOnline === 'function') {
            await reconnectDatabaseIfOnline();
        }
        refreshStorageModeModal();
        if (btn) { btn.disabled = false; btn.textContent = 'Reconnect to database'; }
        if (typeof updateDbStatusBadge === 'function') updateDbStatusBadge();
    });
    modal.querySelector('#storageModeReloadBtn')?.addEventListener('click', () => {
        location.reload();
    });
    wireStorageModeToggle(document.getElementById('storageModeModalToggle'));
    return modal;
}

function setModeToggleBusy(busy) {
    modeToggleBusy = !!busy;
    document.querySelectorAll('.storage-mode-toggle').forEach((btn) => {
        btn.disabled = busy;
        btn.classList.toggle('is-busy', busy);
        btn.dataset.busy = busy ? '1' : '0';
    });
    const status = document.getElementById('storageModeStatus');
    if (status && busy) status.textContent = 'Switching server… this takes a few seconds.';
    const loginStatus = document.getElementById('loginModeStatus');
    if (loginStatus) {
        loginStatus.hidden = !busy;
        loginStatus.textContent = busy ? 'Switching server… please wait.' : '';
    }
}

function syncModeToggleUi() {
    ensureOnlinePreferredByDefault();
    const preferOnline = getPreferredStorageMode() === 'online';
    const onLogin = document.body?.classList.contains('app-locked');
    const online = isStorageModeOnline() || (onLogin && preferOnline);
    document.querySelectorAll('.storage-mode-toggle').forEach((btn) => {
        btn.setAttribute('aria-checked', online ? 'true' : 'false');
        btn.classList.toggle('is-online', online);
        btn.disabled = modeToggleBusy;
    });
    document.querySelectorAll('.storage-mode-toggle-wrap, .login-storage-panel').forEach((wrap) => {
        wrap.classList.toggle('is-online', online);
        wrap.classList.toggle('is-offline', !online);
    });
    const loginLabel = document.getElementById('loginStorageLabel');
    if (loginLabel) updateLoginStorageLabel();
}

function updateLoginStorageLabel() {
    const loginLabel = document.getElementById('loginStorageLabel');
    if (!loginLabel) return;
    ensureOnlinePreferredByDefault();
    if (!document.body?.classList.contains('app-locked')) {
        loginLabel.textContent = getStorageModeLabel();
        return;
    }
    const preferOnline = getPreferredStorageMode() === 'online';
    if (preferOnline && !isStorageModeOnline()) {
        loginLabel.textContent = 'Connecting to techstores.db…';
        return;
    }
    if (storageMode === 'online') {
        loginLabel.textContent = pendingServerSync
            ? 'Online — connected (sync pending)'
            : 'Online — connected to techstores.db';
    } else if (storageMode === 'offline-shell') {
        loginLabel.textContent = 'Offline shell — browser storage (switch to Online when ready)';
    } else if (storageMode === 'offline-local') {
        loginLabel.textContent = 'Offline copy — run START-SYSTEM.bat for online (techstores.db)';
    } else {
        loginLabel.textContent = 'Offline copy — run START-SYSTEM.bat for online (techstores.db)';
    }
}

/** Fast probe for the login screen — avoids multi-second waits when the server is down. */
async function quickProbeStorageMode() {
    return probeStorageMode({ fresh: true, attempts: 1, timeoutMs: 650, delayMs: 0 });
}

async function waitForModeAfterSwitch(target, options = {}) {
    const wantOnline = target === 'online';
    const maxAttempts = Number(options.maxAttempts) || 90;
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, 600));
        try {
            const health = await apiRequestWithTimeout('/api/health', 3000);
            if (wantOnline && health?.database) return true;
            if (!wantOnline && (health?.offlineShell || health?.mode === 'offline-shell')) return true;
        } catch (_) {
            try {
                const response = await fetch('http://127.0.0.1:8080/api/health', { cache: 'no-store' });
                if (response.ok) {
                    const health = await response.json();
                    if (wantOnline && health?.database) return true;
                    if (!wantOnline && (health?.offlineShell || health?.mode === 'offline-shell')) return true;
                }
            } catch (_) { /* server still starting */ }
        }
    }
    throw new Error('Server did not respond after mode switch. Check mode_switch.log in the project folder.');
}

async function autoStartAppServerIfNeeded() {
    ensureOnlinePreferredByDefault();
    if (getPreferredStorageMode() !== 'online') return;
    if (sessionStorage.getItem('techstoresAutoStarting') === '1') return;
    if (sessionStorage.getItem('techstoresAutoStartFailed') === '1') return;
    if (isStorageModeOnline()) return;

    let launcher = await fetchLauncherHealth(800);
    if (!launcher?.launcher) {
        const woke = await tryWakeServerViaProtocol('online');
        if (woke) launcher = await fetchLauncherHealth(1200);
    }
    if (!launcher?.launcher) return;

    sessionStorage.setItem('techstoresAutoStarting', '1');
    try {
        if (typeof updateLoginStorageLabel === 'function') updateLoginStorageLabel();
        await postModeSwitch('online');
        await waitForModeAfterSwitch('online', { maxAttempts: 12 });
        storageMode = 'online';
        dbConnected = true;
        sessionStorage.removeItem('techstoresAutoStarting');
        if (typeof resetStateHydratePromise === 'function') resetStateHydratePromise();
        if (typeof hydrateAppStateFromDatabase === 'function') {
            await hydrateAppStateFromDatabase(true);
        }
        if (typeof updateLoginStorageLabel === 'function') updateLoginStorageLabel();
        if (typeof syncModeToggleUi === 'function') syncModeToggleUi();
        if (typeof updateDbStatusBadge === 'function') updateDbStatusBadge();
    } catch (error) {
        sessionStorage.removeItem('techstoresAutoStarting');
        sessionStorage.setItem('techstoresAutoStartFailed', '1');
        if (typeof updateLoginStorageLabel === 'function') updateLoginStorageLabel();
    }
}

async function switchStorageMode(target) {
    if (modeToggleBusy) return;
    const normalized = target === 'online' ? 'online' : 'offline';
    setPreferredStorageMode(normalized);
    if (normalized === 'online' && isStorageModeOnline()) return;
    if (normalized === 'offline' && storageMode === 'offline-shell') return;

    setModeToggleBusy(true);
    try {
        const data = await postModeSwitch(normalized);
        if (data?.already) {
            await probeStorageMode();
            syncModeToggleUi();
            if (typeof updateDbStatusBadge === 'function') updateDbStatusBadge();
            if (typeof showToast === 'function') {
                showToast(`Already in ${normalized === 'online' ? 'online' : 'offline'} mode.`);
            }
            return;
        }
        if (typeof showToast === 'function') {
            showToast(
                normalized === 'online'
                    ? 'Switching to online mode (SQLite)…'
                    : 'Switching to offline mode…',
                'info'
            );
        }
        await waitForModeAfterSwitch(normalized);
        location.reload();
    } catch (error) {
        if (typeof showToast === 'function') {
            showToast(error.message || 'Mode switch failed.', 'warning');
        }
        await probeStorageMode();
        syncModeToggleUi();
        if (typeof updateDbStatusBadge === 'function') updateDbStatusBadge();
    } finally {
        setModeToggleBusy(false);
    }
}

function wireStorageModeToggle(toggleEl) {
    if (!toggleEl || toggleEl.dataset.modeToggleWired === '1') return;
    toggleEl.dataset.modeToggleWired = '1';
    toggleEl.addEventListener('click', async () => {
        const target = isStorageModeOnline() ? 'offline' : 'online';
        await switchStorageMode(target);
    });
}

function refreshStorageModeModal() {
    const help = getStorageModeHelp();
    const cur = document.getElementById('storageModeCurrent');
    const desc = document.getElementById('storageModeDesc');
    const sw = document.getElementById('storageModeSwitch');
    const status = document.getElementById('storageModeStatus');
    if (cur) cur.textContent = getStorageModeLabel();
    if (desc) desc.textContent = help.body;
    if (sw) sw.textContent = help.switchTo;
    if (status && !modeToggleBusy) status.textContent = '';
    const reconnect = document.getElementById('storageModeReconnectBtn');
    if (reconnect) reconnect.hidden = storageMode === 'online' && dbConnected && !pendingServerSync;
    syncModeToggleUi();
}

function openStorageModeModal() {
    const modal = ensureStorageModeModal();
    refreshStorageModeModal();
    modal.hidden = false;
    document.body.classList.add('storage-mode-open');
}

function closeStorageModeModal() {
    const modal = document.getElementById('storageModeModal');
    if (modal) modal.hidden = true;
    document.body.classList.remove('storage-mode-open');
}

function initStorageModeUi() {
    const loginToggle = document.getElementById('loginStorageModeToggle');
    if (loginToggle) wireStorageModeToggle(loginToggle);

    const headerWrap = document.getElementById('storageModeToggleWrap');
    if (headerWrap && !headerWrap.dataset.modeToggleReady) {
        headerWrap.dataset.modeToggleReady = '1';
        headerWrap.innerHTML = storageModeToggleMarkup('storageModeHeaderToggle');
        wireStorageModeToggle(document.getElementById('storageModeHeaderToggle'));
    }

    const badge = document.getElementById('dbStatusBadge');
    const chip = document.getElementById('dashboardDbChip');
    [badge, chip].forEach((el) => {
        if (!el || el.dataset.storageModeWired === '1') return;
        el.dataset.storageModeWired = '1';
        if (el.tagName !== 'BUTTON') {
            el.setAttribute('role', 'button');
            el.setAttribute('tabindex', '0');
        }
        el.addEventListener('click', openStorageModeModal);
        el.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openStorageModeModal();
            }
        });
    });

    syncModeToggleUi();
}

window.probeStorageMode = probeStorageMode;
window.quickProbeStorageMode = quickProbeStorageMode;
window.updateLoginStorageLabel = updateLoginStorageLabel;
window.refreshStorageModeModal = refreshStorageModeModal;
window.initStorageModeUi = initStorageModeUi;
window.openStorageModeModal = openStorageModeModal;
window.switchStorageMode = switchStorageMode;
window.syncModeToggleUi = syncModeToggleUi;
window.autoStartAppServerIfNeeded = autoStartAppServerIfNeeded;
window.setPreferredStorageMode = setPreferredStorageMode;
window.ensureOnlinePreferredByDefault = ensureOnlinePreferredByDefault;
