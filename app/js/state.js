/* state.js — app state, API, persistence */
let appState = null;

function createDefaultState() {
    const glBudgets = {};
    Object.keys(GL_ACCOUNTS).forEach((gl) => {
        glBudgets[gl] = GL_ACCOUNTS[gl].defaultBudget;
    });
    return {
        version: 2,
        theme: 'fintech',
        uiDensity: 'comfortable',
        glBudgets,
        glMonthlyTargets: {},
        glTargetViewMonth: '',
        releaseCuts: [],
        storesInventory: createDefaultStoresInventory(),
        customInventoryLedgers: [],
        customCatalogItems: [],
        stockTakes: [],
        monthlyReturns: [],
        ictAccountability: [],
        ictDistributionLists: [],
        ictDistributionActiveId: '',
        requisitions: createDefaultRequisitions(),
        orderlyDailyFile: [],
        correspondenceFiles: [],
        correspondenceHandovers: [],
        undeliveredOrders: createDefaultUndelivered(),
        dpProcurements: createDefaultDpProcurements(),
        costComparativeSchedules: [],
        unitChecks: [],
        unitNews: [],
        alertDesk: { seq: 0, meta: {}, reads: {} },
        officeMessages: [],
        saveRevision: 0,
        savedAt: '',
        savedBy: '',
        modules: {},
        users: createDefaultUsers()
    };
}

function createDefaultRequisitions() {
    return [];
}

function createDefaultUndelivered() {
    return [];
}

function createDefaultDpProcurements() {
    return [];
}

function createDefaultStoresInventory() {
    const openings = {};
    (typeof VOUCHER_INVENTORY_CATEGORIES !== 'undefined' ? VOUCHER_INVENTORY_CATEGORIES : []).forEach((cat) => {
        openings[cat.key] = 0;
    });
    return {
        openings,
        transactions: [],
        daySession: null,
        dayHistory: [],
        ledgerMode: 'perpetual',
        balanceView: 'daily',
        openingAdjustments: [],
        itemDisplayCodes: {}
    };
}

function loadState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return createDefaultState();
        const parsed = JSON.parse(raw);
        const defaults = createDefaultState();
        return {
            ...defaults,
            ...parsed,
            glBudgets: { ...defaults.glBudgets, ...(parsed.glBudgets || {}) },
            glMonthlyTargets: (parsed.glMonthlyTargets && typeof parsed.glMonthlyTargets === 'object')
                ? parsed.glMonthlyTargets
                : {},
            glTargetViewMonth: parsed.glTargetViewMonth || '',
            releaseCuts: parsed.releaseCuts || [],
            storesInventory: mergeStoresInventory(parsed.storesInventory),
            customInventoryLedgers: Array.isArray(parsed.customInventoryLedgers) ? parsed.customInventoryLedgers : [],
            customCatalogItems: Array.isArray(parsed.customCatalogItems) ? parsed.customCatalogItems : [],
            stockTakes: Array.isArray(parsed.stockTakes) ? parsed.stockTakes : [],
            monthlyReturns: Array.isArray(parsed.monthlyReturns) ? parsed.monthlyReturns : [],
            ictAccountability: Array.isArray(parsed.ictAccountability) ? parsed.ictAccountability : [],
            ictDistributionLists: Array.isArray(parsed.ictDistributionLists) ? parsed.ictDistributionLists : [],
            ictDistributionActiveId: parsed.ictDistributionActiveId || '',
            requisitions: Array.isArray(parsed.requisitions) ? parsed.requisitions : [],
            orderlyDailyFile: Array.isArray(parsed.orderlyDailyFile) ? parsed.orderlyDailyFile : [],
            correspondenceFiles: Array.isArray(parsed.correspondenceFiles) ? parsed.correspondenceFiles : [],
            correspondenceHandovers: Array.isArray(parsed.correspondenceHandovers) ? parsed.correspondenceHandovers : [],
            undeliveredOrders: Array.isArray(parsed.undeliveredOrders) ? parsed.undeliveredOrders : [],
            dpProcurements: Array.isArray(parsed.dpProcurements) ? parsed.dpProcurements : [],
            costComparativeSchedules: Array.isArray(parsed.costComparativeSchedules) ? parsed.costComparativeSchedules : [],
            unitChecks: Array.isArray(parsed.unitChecks) ? parsed.unitChecks : [],
            unitNews: Array.isArray(parsed.unitNews) ? parsed.unitNews : [],
            alertDesk: (parsed.alertDesk && typeof parsed.alertDesk === 'object')
                ? {
                    seq: Number(parsed.alertDesk.seq) || 0,
                    meta: (parsed.alertDesk.meta && typeof parsed.alertDesk.meta === 'object') ? parsed.alertDesk.meta : {},
                    reads: (parsed.alertDesk.reads && typeof parsed.alertDesk.reads === 'object') ? parsed.alertDesk.reads : {}
                }
                : { seq: 0, meta: {}, reads: {} },
            officeMessages: Array.isArray(parsed.officeMessages) ? parsed.officeMessages : [],
            saveRevision: Number(parsed.saveRevision) || 0,
            savedAt: parsed.savedAt || '',
            savedBy: parsed.savedBy || '',
            modules: parsed.modules || {},
            users: (parsed.users && parsed.users.length)
                ? (typeof ensureSeedUsersPresent === 'function' ? ensureSeedUsersPresent(parsed.users) : parsed.users)
                : defaults.users
        };
    } catch (error) {
        console.error('Failed to load saved data', error);
        return createDefaultState();
    }
}

function mergeStoresInventory(raw) {
    const defaults = createDefaultStoresInventory();
    if (!raw || typeof raw !== 'object') return defaults;
    return {
        openings: { ...defaults.openings, ...(raw.openings || {}) },
        transactions: Array.isArray(raw.transactions) ? raw.transactions : [],
        daySession: raw.daySession || null,
        dayHistory: Array.isArray(raw.dayHistory) ? raw.dayHistory : [],
        ledgerMode: raw.ledgerMode === 'perpetual' ? 'perpetual' : (raw.ledgerMode || 'legacy'),
        balanceView: raw.balanceView === 'cumulative' ? 'cumulative' : 'daily',
        openingAdjustments: Array.isArray(raw.openingAdjustments) ? raw.openingAdjustments : [],
        itemDisplayCodes: (raw.itemDisplayCodes && typeof raw.itemDisplayCodes === 'object')
            ? { ...raw.itemDisplayCodes }
            : {}
    };
}

function mergeState(parsed) {
    const defaults = createDefaultState();
    if (!parsed || typeof parsed !== 'object') return defaults;
    return {
        ...defaults,
        ...parsed,
        glBudgets: { ...defaults.glBudgets, ...(parsed.glBudgets || {}) },
        glMonthlyTargets: (parsed.glMonthlyTargets && typeof parsed.glMonthlyTargets === 'object')
            ? parsed.glMonthlyTargets
            : {},
        glTargetViewMonth: parsed.glTargetViewMonth || '',
        releaseCuts: parsed.releaseCuts || [],
        storesInventory: mergeStoresInventory(parsed.storesInventory),
        customInventoryLedgers: Array.isArray(parsed.customInventoryLedgers) ? parsed.customInventoryLedgers : [],
        customCatalogItems: Array.isArray(parsed.customCatalogItems) ? parsed.customCatalogItems : [],
        stockTakes: Array.isArray(parsed.stockTakes) ? parsed.stockTakes : [],
        monthlyReturns: Array.isArray(parsed.monthlyReturns) ? parsed.monthlyReturns : [],
        ictAccountability: Array.isArray(parsed.ictAccountability) ? parsed.ictAccountability : [],
        ictDistributionLists: Array.isArray(parsed.ictDistributionLists) ? parsed.ictDistributionLists : [],
        ictDistributionActiveId: parsed.ictDistributionActiveId || '',
        requisitions: Array.isArray(parsed.requisitions) ? parsed.requisitions : [],
        orderlyDailyFile: Array.isArray(parsed.orderlyDailyFile) ? parsed.orderlyDailyFile : [],
        correspondenceFiles: Array.isArray(parsed.correspondenceFiles) ? parsed.correspondenceFiles : [],
        correspondenceHandovers: Array.isArray(parsed.correspondenceHandovers) ? parsed.correspondenceHandovers : [],
        undeliveredOrders: Array.isArray(parsed.undeliveredOrders) ? parsed.undeliveredOrders : [],
        dpProcurements: Array.isArray(parsed.dpProcurements) ? parsed.dpProcurements : [],
        costComparativeSchedules: Array.isArray(parsed.costComparativeSchedules) ? parsed.costComparativeSchedules : [],
        unitChecks: Array.isArray(parsed.unitChecks) ? parsed.unitChecks : [],
        unitNews: Array.isArray(parsed.unitNews) ? parsed.unitNews : [],
        alertDesk: (parsed.alertDesk && typeof parsed.alertDesk === 'object')
            ? {
                seq: Number(parsed.alertDesk.seq) || 0,
                meta: (parsed.alertDesk.meta && typeof parsed.alertDesk.meta === 'object') ? parsed.alertDesk.meta : {},
                reads: (parsed.alertDesk.reads && typeof parsed.alertDesk.reads === 'object') ? parsed.alertDesk.reads : {}
            }
            : { seq: 0, meta: {}, reads: {} },
        officeMessages: Array.isArray(parsed.officeMessages) ? parsed.officeMessages : [],
        saveRevision: Number(parsed.saveRevision) || 0,
        savedAt: parsed.savedAt || '',
        savedBy: parsed.savedBy || '',
        modules: parsed.modules || {},
        users: (parsed.users && parsed.users.length)
            ? (typeof ensureSeedUsersPresent === 'function' ? ensureSeedUsersPresent(parsed.users) : parsed.users)
            : defaults.users
    };
}

async function apiRequest(path, options = {}) {
    const response = await fetch(API_BASE + path, {
        headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
        ...options
    });
    let data = null;
    try {
        data = await response.json();
    } catch (error) {
        data = null;
    }
    if (!response.ok) {
        const message = (data && data.error) || `Request failed (${response.status})`;
        const err = new Error(message);
        err.status = response.status;
        err.data = data;
        throw err;
    }
    return data;
}

function updateDbStatusBadge() {
    const badge = document.getElementById('dbStatusBadge');
    if (badge) {
        if (dbConnected) {
            badge.textContent = 'Database Connected';
            badge.className = 'db-status-badge db-online';
            badge.title = 'Persistent SQLite file: techstores.db (survives shutdown & logout)';
        } else {
            badge.textContent = 'Local Only';
            badge.className = 'db-status-badge db-offline';
            badge.title = 'Start START-SYSTEM.bat / server.py so data saves to techstores.db';
        }
    }
    const dbChip = document.getElementById('dashboardDbChip');
    if (dbChip) {
        dbChip.textContent = dbConnected
            ? 'Storage: Persistent SQLite (techstores.db)'
            : 'Storage: Browser only (not durable)';
        dbChip.title = dbConnected
            ? 'Data remains after logout, browser close, and PC shutdown'
            : 'Run START-SYSTEM.bat to enable the durable database';
    }
}

function stateHasOperationalData(state) {
    if (!state || typeof state !== 'object') return false;
    if (Object.keys(state.modules || {}).length > 0) return true;
    if ((state.releaseCuts || []).length > 0) return true;
    if ((state.stockTakes || []).length > 0) return true;
    if ((state.requisitions || []).length > 0) return true;
    if ((state.undeliveredOrders || []).length > 0) return true;
    if ((state.dpProcurements || []).length > 0) return true;
    if ((state.unitChecks || []).length > 0) return true;
    if ((state.monthlyReturns || []).length > 0) return true;
    if ((state.ictAccountability || []).length > 0) return true;
    if ((state.ictDistributionLists || []).length > 0) return true;
    const inv = state.storesInventory;
    if (inv && Array.isArray(inv.transactions) && inv.transactions.length > 0) return true;
    if (Object.keys(state.glMonthlyTargets || {}).length > 0) return true;
    return false;
}

async function loadStateFromDatabase() {
    try {
        const data = await apiRequest('/api/state');
        dbConnected = true;
        updateDbStatusBadge();
        const remote = mergeState(data.appState);
        const localRaw = localStorage.getItem(STORAGE_KEY);
        if (localRaw) {
            const local = mergeState(JSON.parse(localRaw));
            const remoteEmpty = !stateHasOperationalData(remote);
            const localHasData = stateHasOperationalData(local);
            if (remoteEmpty && localHasData) {
                // First-time / empty DB: migrate browser data into SQLite
                await apiRequest('/api/state', {
                    method: 'PUT',
                    body: JSON.stringify({ appState: local, force: true })
                });
                localStorage.setItem(STORAGE_KEY, JSON.stringify(local));
                if (typeof showToast === 'function') {
                    showToast('Browser data migrated into persistent database (techstores.db).', 'success');
                }
                return local;
            }
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(remote));
        return remote;
    } catch (error) {
        console.warn('Database unavailable, using local storage.', error);
        dbConnected = false;
        updateDbStatusBadge();
        return loadState();
    }
}

function bumpSaveMeta() {
    if (!appState) return;
    // Server owns revision when DB is connected; local-only still increments.
    if (!dbConnected) {
        appState.saveRevision = (Number(appState.saveRevision) || 0) + 1;
    }
    appState.savedAt = new Date().toISOString();
    appState.savedBy = (typeof currentUser !== 'undefined' && currentUser)
        ? (currentUser.username || currentUser.name || 'user')
        : 'system';
    if (typeof recordSaveMeta === 'function') recordSaveMeta();
}

function saveState() {
    // Signed-in view-only / oversight must not persist quantity or form changes
    if (typeof currentUser !== 'undefined' && currentUser
        && typeof canEditData === 'function' && !canEditData()) {
        if (typeof recordAccessAudit === 'function') {
            recordAccessAudit('save_denied', 'Blocked saveState (view-only session)');
        }
        return;
    }
    bumpSaveMeta();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
    if (!dbConnected) return;
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
        try {
            const data = await apiRequest('/api/state', {
                method: 'PUT',
                body: JSON.stringify({ appState })
            });
            if (data?.saveRevision != null) {
                appState.saveRevision = data.saveRevision;
                localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
            }
            if (typeof checkSaveConflictOnLoad === 'function') checkSaveConflictOnLoad();
        } catch (error) {
            if (error.status === 409) {
                const ok = typeof confirmAction === 'function'
                    ? confirmAction('Another save is newer on the server. Overwrite with your copy?')
                    : window.confirm('Another save is newer on the server. Overwrite with your copy?');
                if (ok) {
                    try {
                        const data = await apiRequest('/api/state', {
                            method: 'PUT',
                            body: JSON.stringify({ appState, force: true })
                        });
                        if (data?.saveRevision != null) appState.saveRevision = data.saveRevision;
                        localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
                        showToast('Saved (overwrite).', 'success');
                        return;
                    } catch (e2) {
                        console.error('Force save failed', e2);
                    }
                }
                showToast('Save skipped — reload to pick up the latest database state.', 'warning');
                return;
            }
            console.error('Failed to save to database', error);
            dbConnected = false;
            updateDbStatusBadge();
            showToast('Database save failed. Data kept in browser only.', 'error');
        }
    }, 250);
}

async function saveStateNow() {
    if (typeof currentUser !== 'undefined' && currentUser
        && typeof canEditData === 'function' && !canEditData()) {
        if (typeof recordAccessAudit === 'function') {
            recordAccessAudit('save_denied', 'Blocked saveStateNow (view-only session)');
        }
        return false;
    }
    if (saveTimer) {
        clearTimeout(saveTimer);
        saveTimer = null;
    }
    bumpSaveMeta();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
    if (!dbConnected) return false;
    try {
        const data = await apiRequest('/api/state', {
            method: 'PUT',
            body: JSON.stringify({ appState })
        });
        if (data?.saveRevision != null) {
            appState.saveRevision = data.saveRevision;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
        }
        if (typeof checkSaveConflictOnLoad === 'function') checkSaveConflictOnLoad();
        return true;
    } catch (error) {
        if (error.status === 409) {
            try {
                await apiRequest('/api/state', {
                    method: 'PUT',
                    body: JSON.stringify({ appState, force: true })
                });
                return true;
            } catch (e2) {
                showToast('Save conflict — another user may have saved first. Use Backup, then reload.', 'warning');
                return false;
            }
        }
        console.error('Failed to save to database', error);
        dbConnected = false;
        updateDbStatusBadge();
        return false;
    }
}

/** Flush pending writes to SQLite (logout / tab close / PC sleep). */
async function flushPersistentDatabase() {
    try {
        if (!appState) return false;
        return await saveStateNow();
    } catch (e) {
        console.warn('Flush to database failed', e);
        return false;
    }
}

function initPersistentDatabaseHooks() {
    if (document.body.dataset.persistHooks === '1') return;
    document.body.dataset.persistHooks = '1';

    window.addEventListener('beforeunload', () => {
        try {
            if (!appState) return;
            bumpSaveMeta();
            localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
            if (dbConnected) {
                // keepalive fetch survives tab close better than a normal await
                fetch('/api/state', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ appState, force: true }),
                    keepalive: true
                }).catch(() => { /* ignore */ });
            }
        } catch (e) { /* ignore */ }
    });

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            flushPersistentDatabase();
        }
    });

    // Reconnect if server comes back after going offline
    setInterval(async () => {
        if (dbConnected || !appState) return;
        try {
            await apiRequest('/api/state');
            dbConnected = true;
            updateDbStatusBadge();
            await saveStateNow();
            if (typeof showToast === 'function') {
                showToast('Database reconnected — data syncing to techstores.db.', 'success');
            }
        } catch (e) { /* still offline */ }
    }, 15000);
}
