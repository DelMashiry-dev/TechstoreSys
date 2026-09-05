/* state.js — app state, API, persistence (SQLite when online, IndexedDB offline) */
let appState = null;

async function apiRequestWithTimeout(path, ms = 5000, options = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    try {
        return await apiRequest(path, { ...options, signal: controller.signal });
    } finally {
        clearTimeout(timer);
    }
}

async function persistLocalCopy(state = appState) {
    if (!state) return;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
        console.warn('localStorage save failed', err);
    }
    if (typeof saveOfflineAppState === 'function') {
        const ok = await saveOfflineAppState(state);
        if (ok) offlineDurable = true;
    }
    if (typeof updateDbStatusBadge === 'function') updateDbStatusBadge();
}

async function loadBestLocalState() {
    let parsed = null;
    if (typeof loadOfflineAppState === 'function') {
        try {
            parsed = await loadOfflineAppState();
        } catch (_) { /* ignore */ }
    }
    if (!parsed) {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) parsed = JSON.parse(raw);
        } catch (_) { /* ignore */ }
    }
    return parsed ? mergeState(parsed) : loadState();
}

async function trySyncStateToServer(force = false) {
    if (!appState) return false;
    try {
        const data = await apiRequest('/api/state', {
            method: 'PUT',
            body: JSON.stringify({ appState, force })
        });
        dbConnected = true;
        pendingServerSync = false;
        if (data?.saveRevision != null) {
            appState.saveRevision = data.saveRevision;
        }
        await persistLocalCopy(appState);
        updateDbStatusBadge();
        return true;
    } catch (error) {
        if (error.status === 409 && !force) {
            return trySyncStateToServer(true);
        }
        dbConnected = false;
        pendingServerSync = true;
        if (typeof queueOfflineSync === 'function') {
            await queueOfflineSync({ appState, queuedAt: new Date().toISOString() });
        }
        updateDbStatusBadge();
        return false;
    }
}

async function reconnectDatabaseIfOnline() {
    if (!appState) return;
    if (typeof probeStorageMode === 'function') {
        await probeStorageMode();
    }
    if (storageMode === 'offline-shell') {
        updateDbStatusBadge();
        return;
    }
    if (dbConnected && !pendingServerSync) return;
    try {
        const health = await apiRequestWithTimeout('/api/health', 4000);
        if (!health?.database) {
            updateDbStatusBadge();
            return;
        }
        storageMode = 'online';
        dbConnected = true;
        const synced = await trySyncStateToServer(true);
        pendingServerSync = !synced;
        if (typeof flushOfflineSyncQueue === 'function') {
            await flushOfflineSyncQueue(async (payload) => {
                if (payload?.appState) {
                    appState = mergeState(payload.appState);
                    await trySyncStateToServer(true);
                }
            });
        }
        updateDbStatusBadge();
        if (typeof updateLoginStorageLabel === 'function') updateLoginStorageLabel();
        if (synced && typeof showToast === 'function') {
            showToast('Database reconnected — synced to techstores.db.', 'success');
        }
        if (typeof refreshStorageModeModal === 'function') refreshStorageModeModal();
    } catch (_) { /* still offline */ }
}

let _connectivityLossNotified = false;

/** Runtime fallback when SQLite server is unreachable — keeps Online as preference, no manual toggle. */
function enterRuntimeOfflineFallback(options = {}) {
    const wasConnected = dbConnected;
    dbConnected = false;
    pendingServerSync = true;
    if (storageMode === 'online') {
        storageMode = offlineDurable ? 'offline-local' : storageMode;
    }
    updateDbStatusBadge();
    if (typeof updateLoginStorageLabel === 'function') updateLoginStorageLabel();
    if (typeof syncModeToggleUi === 'function') syncModeToggleUi();
    const notify = options.notify !== false;
    if (notify && wasConnected && !_connectivityLossNotified && typeof showToast === 'function') {
        _connectivityLossNotified = true;
        showToast(
            options.message
                || 'Database server unreachable — saving to browser copy. Will sync when START-SYSTEM.bat is running again.',
            'warning'
        );
    }
}

/** Ping server; auto-fallback to offline copy or reconnect when preferred mode is Online. */
async function checkDatabaseConnectivity() {
    if (!appState) return;
    if (typeof getPreferredStorageMode === 'function' && getPreferredStorageMode() !== 'online') return;
    if (storageMode === 'offline-shell') return;

    try {
        const health = await apiRequestWithTimeout('/api/health', 2000);
        if (health?.database) {
            _connectivityLossNotified = false;
            if (!dbConnected || pendingServerSync) {
                await reconnectDatabaseIfOnline();
            }
            return;
        }
    } catch (_) { /* server down */ }

    if (dbConnected || storageMode === 'online') {
        enterRuntimeOfflineFallback();
    }
}

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
        fyBidAsk: { byGl: {}, total: 0, updatedAt: '', source: '' },
        glMonthlyTargets: {},
        glTargetViewMonth: '',
        glTargetPeriodMode: 'month',
        monthlyTargetProposals: {},
        releaseCuts: [],
        storesInventory: createDefaultStoresInventory(),
        customInventoryLedgers: [],
        customCatalogItems: [],
        stockTakes: [],
        monthlyReturns: [],
        ictAccountability: [],
        permanentLoans: [],
        ictDistributionLists: [],
        ictDistributionActiveId: '',
        requisitions: createDefaultRequisitions(),
        requisitionSeedRev: 0,
        specEvaluations: [],
        specEvalSeedRev: 0,
        znaSpecifications: [],
        supplierQuotations: [],
        orderlyDailyFile: [],
        correspondenceFiles: [],
        correspondenceHandovers: [],
        undeliveredOrders: createDefaultUndelivered(),
        supplierDebts: [],
        supplierDebtSeedRev: 0,
        workshopReceiptCerts: [],
        dpProcurementSeedRev: 0,
        dpProcurements: createDefaultDpProcurements(),
        costComparativeSchedules: [],
        unitChecks: [],
        unitNews: [],
        alertDesk: { seq: 0, meta: {}, reads: {} },
        officeMessages: [],
        ictCompareHistory: [],
        navMenuOrder: {},
        saveRevision: 0,
        savedAt: '',
        savedBy: '',
        modules: {},
        users: createDefaultUsers()
    };
}

function mergeNavMenuOrder(parsed) {
    const incoming = parsed && parsed.navMenuOrder;
    if (incoming && typeof incoming === 'object' && !Array.isArray(incoming)) {
        return incoming;
    }
    if (appState && appState.navMenuOrder
        && typeof appState.navMenuOrder === 'object'
        && !Array.isArray(appState.navMenuOrder)) {
        return appState.navMenuOrder;
    }
    return {};
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
            fyBidAsk: (parsed.fyBidAsk && typeof parsed.fyBidAsk === 'object')
                ? { ...defaults.fyBidAsk, ...parsed.fyBidAsk, byGl: { ...(defaults.fyBidAsk?.byGl || {}), ...(parsed.fyBidAsk.byGl || {}) } }
                : defaults.fyBidAsk,
            glMonthlyTargets: (parsed.glMonthlyTargets && typeof parsed.glMonthlyTargets === 'object')
                ? parsed.glMonthlyTargets
                : {},
            glTargetViewMonth: parsed.glTargetViewMonth || '',
            glTargetPeriodMode: parsed.glTargetPeriodMode || 'month',
            monthlyTargetProposals: (parsed.monthlyTargetProposals && typeof parsed.monthlyTargetProposals === 'object')
                ? parsed.monthlyTargetProposals
                : {},
            releaseCuts: parsed.releaseCuts || [],
            storesInventory: mergeStoresInventory(parsed.storesInventory),
            customInventoryLedgers: Array.isArray(parsed.customInventoryLedgers) ? parsed.customInventoryLedgers : [],
            customCatalogItems: Array.isArray(parsed.customCatalogItems) ? parsed.customCatalogItems : [],
            stockTakes: Array.isArray(parsed.stockTakes) ? parsed.stockTakes : [],
            monthlyReturns: Array.isArray(parsed.monthlyReturns) ? parsed.monthlyReturns : [],
            ictAccountability: Array.isArray(parsed.ictAccountability) ? parsed.ictAccountability : [],
            permanentLoans: Array.isArray(parsed.permanentLoans) ? parsed.permanentLoans : [],
            ictDistributionLists: Array.isArray(parsed.ictDistributionLists) ? parsed.ictDistributionLists : [],
            ictDistributionActiveId: parsed.ictDistributionActiveId || '',
            requisitions: Array.isArray(parsed.requisitions) ? parsed.requisitions : [],
            requisitionSeedRev: Number(parsed.requisitionSeedRev) || 0,
            orderlyDailyFile: Array.isArray(parsed.orderlyDailyFile) ? parsed.orderlyDailyFile : [],
            correspondenceFiles: Array.isArray(parsed.correspondenceFiles) ? parsed.correspondenceFiles : [],
            correspondenceHandovers: Array.isArray(parsed.correspondenceHandovers) ? parsed.correspondenceHandovers : [],
            undeliveredOrders: Array.isArray(parsed.undeliveredOrders) ? parsed.undeliveredOrders : [],
            supplierDebts: Array.isArray(parsed.supplierDebts) ? parsed.supplierDebts : [],
            supplierDebtSeedRev: Number(parsed.supplierDebtSeedRev) || 0,
            workshopReceiptCerts: Array.isArray(parsed.workshopReceiptCerts) ? parsed.workshopReceiptCerts : [],
            dpProcurementSeedRev: Number(parsed.dpProcurementSeedRev) || 0,
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
            ictCompareHistory: Array.isArray(parsed.ictCompareHistory) ? parsed.ictCompareHistory : [],
            navMenuOrder: mergeNavMenuOrder(parsed),
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
        fyBidAsk: (parsed.fyBidAsk && typeof parsed.fyBidAsk === 'object')
            ? { ...defaults.fyBidAsk, ...parsed.fyBidAsk, byGl: { ...(defaults.fyBidAsk?.byGl || {}), ...(parsed.fyBidAsk.byGl || {}) } }
            : defaults.fyBidAsk,
        glMonthlyTargets: (parsed.glMonthlyTargets && typeof parsed.glMonthlyTargets === 'object')
            ? parsed.glMonthlyTargets
            : {},
        glTargetViewMonth: parsed.glTargetViewMonth || '',
        glTargetPeriodMode: parsed.glTargetPeriodMode || 'month',
        monthlyTargetProposals: (parsed.monthlyTargetProposals && typeof parsed.monthlyTargetProposals === 'object')
            ? parsed.monthlyTargetProposals
            : {},
        releaseCuts: parsed.releaseCuts || [],
        storesInventory: mergeStoresInventory(parsed.storesInventory),
        customInventoryLedgers: Array.isArray(parsed.customInventoryLedgers) ? parsed.customInventoryLedgers : [],
        customCatalogItems: Array.isArray(parsed.customCatalogItems) ? parsed.customCatalogItems : [],
        stockTakes: Array.isArray(parsed.stockTakes) ? parsed.stockTakes : [],
        monthlyReturns: Array.isArray(parsed.monthlyReturns) ? parsed.monthlyReturns : [],
        ictAccountability: Array.isArray(parsed.ictAccountability) ? parsed.ictAccountability : [],
        permanentLoans: Array.isArray(parsed.permanentLoans) ? parsed.permanentLoans : [],
        ictDistributionLists: Array.isArray(parsed.ictDistributionLists) ? parsed.ictDistributionLists : [],
        ictDistributionActiveId: parsed.ictDistributionActiveId || '',
        requisitions: Array.isArray(parsed.requisitions) ? parsed.requisitions : [],
        requisitionSeedRev: Number(parsed.requisitionSeedRev) || 0,
        specEvaluations: Array.isArray(parsed.specEvaluations) ? parsed.specEvaluations : [],
        specEvalSeedRev: Number(parsed.specEvalSeedRev) || 0,
        znaSpecifications: Array.isArray(parsed.znaSpecifications) ? parsed.znaSpecifications : [],
        supplierQuotations: Array.isArray(parsed.supplierQuotations) ? parsed.supplierQuotations : [],
        orderlyDailyFile: Array.isArray(parsed.orderlyDailyFile) ? parsed.orderlyDailyFile : [],
        correspondenceFiles: Array.isArray(parsed.correspondenceFiles) ? parsed.correspondenceFiles : [],
        correspondenceHandovers: Array.isArray(parsed.correspondenceHandovers) ? parsed.correspondenceHandovers : [],
        undeliveredOrders: Array.isArray(parsed.undeliveredOrders) ? parsed.undeliveredOrders : [],
        supplierDebts: Array.isArray(parsed.supplierDebts) ? parsed.supplierDebts : [],
        supplierDebtSeedRev: Number(parsed.supplierDebtSeedRev) || 0,
        workshopReceiptCerts: Array.isArray(parsed.workshopReceiptCerts) ? parsed.workshopReceiptCerts : [],
        dpProcurementSeedRev: Number(parsed.dpProcurementSeedRev) || 0,
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
        ictCompareHistory: Array.isArray(parsed.ictCompareHistory) ? parsed.ictCompareHistory : [],
        navMenuOrder: mergeNavMenuOrder(parsed),
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
    if (dbConnected) {
        storageMode = 'online';
    } else if (storageMode !== 'offline-shell' && offlineDurable) {
        storageMode = 'offline-local';
    }

    const badge = document.getElementById('dbStatusBadge');
    if (badge) {
        badge.textContent = typeof getStorageModeLabel === 'function' ? getStorageModeLabel() : 'Storage';
        if (dbConnected || storageMode === 'online') {
            badge.className = 'db-status-badge db-online';
            badge.title = 'Database — techstores.db on this PC (local server). Click to switch mode.';
        } else if (storageMode === 'offline-shell' || offlineDurable) {
            badge.className = 'db-status-badge db-offline-durable';
            badge.title = 'Browser-only storage. Click for switch instructions.';
        } else {
            badge.className = 'db-status-badge db-offline';
            badge.title = 'Click to set up database or browser-only storage.';
        }
    }
    const dbChip = document.getElementById('dashboardDbChip');
    if (dbChip) {
        if (dbConnected || storageMode === 'online') {
            dbChip.textContent = pendingServerSync
                ? 'Storage: Database + pending sync'
                : 'Storage: Database (techstores.db)';
        } else if (storageMode === 'offline-shell') {
            dbChip.textContent = 'Storage: Browser (offline shell)';
        } else if (offlineDurable) {
            dbChip.textContent = 'Storage: Browser copy (IndexedDB)';
        } else {
            dbChip.textContent = 'Storage: Local only';
        }
        dbChip.title = 'Click to switch database / browser storage';
    }
    if (typeof syncModeToggleUi === 'function') syncModeToggleUi();
}

function stateHasOperationalData(state) {
    if (!state || typeof state !== 'object') return false;
    if (Object.keys(state.modules || {}).length > 0) return true;
    if ((state.releaseCuts || []).length > 0) return true;
    if ((state.stockTakes || []).length > 0) return true;
    if ((state.requisitions || []).length > 0) return true;
    if ((state.undeliveredOrders || []).length > 0) return true;
    if ((state.supplierDebts || []).length > 0) return true;
    if ((state.dpProcurements || []).length > 0) return true;
    if ((state.unitChecks || []).length > 0) return true;
    if ((state.monthlyReturns || []).length > 0) return true;
    if ((state.ictAccountability || []).length > 0) return true;
    if ((state.permanentLoans || []).length > 0) return true;
    if ((state.ictDistributionLists || []).length > 0) return true;
    const inv = state.storesInventory;
    if (inv && Array.isArray(inv.transactions) && inv.transactions.length > 0) return true;
    if (Object.keys(state.glMonthlyTargets || {}).length > 0) return true;
    if (Object.keys(state.monthlyTargetProposals || {}).length > 0) return true;
    return false;
}

async function loadStateFromDatabase() {
    const probePromise = typeof probeStorageMode === 'function'
        ? probeStorageMode({ fresh: false })
        : Promise.resolve();
    const offlinePromise = typeof initOfflineStore === 'function'
        ? initOfflineStore()
        : Promise.resolve(true);
    await Promise.all([probePromise, offlinePromise]);

    if (storageMode !== 'online') {
        dbConnected = false;
        const localState = await loadBestLocalState();
        updateDbStatusBadge();
        if (storageMode === 'offline-shell' && typeof showToast === 'function') {
            showToast('Offline shell — data saves in browser storage.', 'info');
        }
        return localState;
    }

    try {
        const data = await apiRequestWithTimeout('/api/state', 2500);
        dbConnected = true;
        pendingServerSync = false;
        storageMode = 'online';
        updateDbStatusBadge();
        const remote = mergeState(data.appState);
        const localState = await loadBestLocalState();
        const remoteEmpty = !stateHasOperationalData(remote);
        const localHasData = stateHasOperationalData(localState);
        if (remoteEmpty && localHasData) {
            await trySyncStateToServer(true);
            await persistLocalCopy(localState);
            if (typeof showToast === 'function') {
                showToast('Browser data migrated into persistent database (techstores.db).', 'success');
            }
            if (typeof warmOfflineModuleCache === 'function') warmOfflineModuleCache();
            return localState;
        }
        persistLocalCopy(remote).catch(() => { /* background */ });
        if (typeof warmOfflineModuleCache === 'function') warmOfflineModuleCache();
        return remote;
    } catch (error) {
        console.warn('Database unavailable, using offline storage.', error?.message || error);
        dbConnected = false;
        const localState = await loadBestLocalState();
        updateDbStatusBadge();
        if (typeof showToast === 'function' && offlineDurable) {
            showToast('Server unavailable — using browser copy. Run START-SYSTEM.bat for database mode.', 'info');
        }
        return localState;
    }
}

let stateHydratePromise = null;

/** Load app state without blocking the login screen (online first, offline fallback). */
function hydrateAppStateFromDatabase(force = false) {
    if (!force && stateHydratePromise) return stateHydratePromise;
    stateHydratePromise = loadStateFromDatabase()
        .catch((err) => {
            console.warn('State hydrate failed', err);
            try {
                return loadState();
            } catch (_) {
                return createDefaultState();
            }
        });
    window.__stateHydratePromise = stateHydratePromise;
    return stateHydratePromise;
}

function resetStateHydratePromise() {
    stateHydratePromise = null;
    window.__stateHydratePromise = null;
}

window.hydrateAppStateFromDatabase = hydrateAppStateFromDatabase;
window.resetStateHydratePromise = resetStateHydratePromise;

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
    persistLocalCopy(appState);
    if (!dbConnected) {
        pendingServerSync = true;
        if (typeof queueOfflineSync === 'function') {
            queueOfflineSync({ appState, queuedAt: new Date().toISOString() });
        }
        updateDbStatusBadge();
        return;
    }
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
        try {
            const ok = await trySyncStateToServer(false);
            if (ok && typeof checkSaveConflictOnLoad === 'function') checkSaveConflictOnLoad();
        } catch (error) {
            if (error.status === 409) {
                const ok = typeof confirmAction === 'function'
                    ? confirmAction('Another save is newer on the server. Overwrite with your copy?')
                    : window.confirm('Another save is newer on the server. Overwrite with your copy?');
                if (ok) {
                    const forced = await trySyncStateToServer(true);
                    if (forced && typeof showToast === 'function') showToast('Saved (overwrite).', 'success');
                    return;
                }
                if (typeof showToast === 'function') {
                    showToast('Save skipped — reload to pick up the latest database state.', 'warning');
                }
                return;
            }
            console.error('Failed to save to database', error);
            enterRuntimeOfflineFallback({
            message: 'Database unavailable — saved to browser copy. Will sync when the server is back.'
        });
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
    await persistLocalCopy(appState);
    if (!dbConnected) {
        pendingServerSync = true;
        if (typeof queueOfflineSync === 'function') {
            await queueOfflineSync({ appState, queuedAt: new Date().toISOString() });
        }
        updateDbStatusBadge();
        return false;
    }
    try {
        const ok = await trySyncStateToServer(false);
        if (ok && typeof checkSaveConflictOnLoad === 'function') checkSaveConflictOnLoad();
        return ok;
    } catch (error) {
        if (error.status === 409) {
            return trySyncStateToServer(true);
        }
        console.error('Failed to save to database', error);
        enterRuntimeOfflineFallback();
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
            if (typeof saveOfflineAppState === 'function') {
                saveOfflineAppState(appState);
            }
            if (dbConnected) {
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

    window.addEventListener('online', () => {
        updateDbStatusBadge();
        checkDatabaseConnectivity();
    });
    window.addEventListener('offline', () => {
        enterRuntimeOfflineFallback({
            message: 'Network offline — browser copy active. Database mode resumes when the local server responds.'
        });
    });

    setInterval(() => {
        checkDatabaseConnectivity();
    }, 15000);

    setTimeout(() => checkDatabaseConnectivity(), 2500);
}
