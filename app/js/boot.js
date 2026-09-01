/* boot.js — application startup / event wiring */

function setPeepEyeState(btn, open) {
    if (!btn) return;
    const eyeOpen = btn.querySelector('.peep-eye-open');
    const eyeShut = btn.querySelector('.peep-eye-shut');
    if (eyeOpen) eyeOpen.hidden = !open;
    if (eyeShut) eyeShut.hidden = open;
    btn.classList.toggle('is-peeping', open);
    btn.setAttribute('aria-pressed', open ? 'true' : 'false');
}

function wireLoginPasswordPeep() {
    const input = document.getElementById('loginPassword');
    const btn = document.getElementById('loginPasswordPeep');
    if (!input || !btn || btn.dataset.peepWired === '1') return;
    btn.dataset.peepWired = '1';
    setPeepEyeState(btn, false);
    btn.addEventListener('click', () => {
        const nowShowing = input.type !== 'text';
        input.type = nowShowing ? 'text' : 'password';
        setPeepEyeState(btn, nowShowing);
        btn.setAttribute('aria-label', nowShowing ? 'Hide password' : 'Show password');
        btn.title = nowShowing ? 'Hide password' : 'Show password';
        input.focus({ preventScroll: true });
    });
}

function wireLoginHintCollapse() {
    const hint = document.getElementById('loginHint');
    const toggle = document.getElementById('loginHintToggle');
    const body = document.getElementById('loginHintBody');
    const peep = document.getElementById('loginHintPeep');
    if (!hint || !toggle || !body || toggle.dataset.collapseWired === '1') return;
    toggle.dataset.collapseWired = '1';

    const apply = (collapsed) => {
        hint.classList.toggle('is-collapsed', collapsed);
        body.hidden = collapsed;
        toggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
        toggle.title = collapsed ? 'Expand default accounts' : 'Collapse default accounts';
        if (peep) peep.hidden = collapsed;
        try {
            localStorage.setItem('techstores_login_hint_collapsed', collapsed ? '1' : '0');
        } catch (_) { /* ignore */ }
    };

    let collapsed = true;
    try {
        const stored = localStorage.getItem('techstores_login_hint_collapsed');
        if (stored === '0') collapsed = false;
        if (stored === '1') collapsed = true;
    } catch (_) { /* ignore */ }
    apply(collapsed);

    toggle.addEventListener('click', () => apply(!hint.classList.contains('is-collapsed')));
}

function wireLoginHintPeep() {
    const hint = document.getElementById('loginHint');
    const btn = document.getElementById('loginHintPeep');
    if (!hint || !btn || btn.dataset.peepWired === '1') return;
    btn.dataset.peepWired = '1';
    const label = btn.querySelector('.login-hint-peep-label');
    const apply = (show) => {
        hint.classList.toggle('login-hint-revealed', show);
        setPeepEyeState(btn, show);
        btn.setAttribute('aria-label', show ? 'Hide demo passwords' : 'Show demo passwords');
        btn.title = show ? 'Hide demo passwords' : 'Show demo passwords';
        if (label) label.textContent = show ? 'Hide passwords' : 'Show passwords';
        hint.querySelectorAll('.login-pwd[data-pwd]').forEach((el) => {
            const secret = el.getAttribute('data-pwd') || '';
            if (show) {
                if (!el.dataset.mask) el.dataset.mask = el.textContent;
                el.textContent = secret;
            } else {
                el.textContent = el.dataset.mask || '••••••••';
            }
        });
    };
    apply(false);
    btn.addEventListener('click', () => apply(!hint.classList.contains('login-hint-revealed')));
}

function wireLoginForm() {
    const form = document.getElementById('loginForm');
    if (!form || form.dataset.loginWired === '1') return;
    form.dataset.loginWired = '1';
    wireLoginPasswordPeep();
    wireLoginHintCollapse();
    wireLoginHintPeep();
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        e.stopPropagation();
        setLoginError('');
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        const submitBtn = this.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Signing in...';
        }
        try {
            const result = await attemptLogin(username, password);
            if (!result.ok) {
                setLoginError(result.message);
                return;
            }
            try {
                if (typeof ensureRealDpPurchaseOrders === 'function') ensureRealDpPurchaseOrders();
                restoreAllModules();
                updateDashboard();
                updateVoucherSummary();
                updateSystemAlerts();
            } catch (refreshError) {
                console.error('Post-login refresh failed', refreshError);
            }
            // Password renewal is optional during development — defaults stay valid.
            enterApp(result.user);
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Sign In';
            }
        }
    });
}

async function runHeavyBootInit() {
    if (window.__techstoresHeavyBootDone) return;
    window.__techstoresHeavyBootDone = true;
    if (!appState) return;
    if (!Array.isArray(appState.orderlyDailyFile)) {
        appState.orderlyDailyFile = [];
    }
    if (typeof applyPhysicalStockCount20260731 === 'function') {
        const stockResult = applyPhysicalStockCount20260731();
        if (stockResult.applied) {
            if (typeof saveStateNow === 'function') await saveStateNow();
            else saveState();
            console.info('Physical stock count applied:', stockResult.lines);
        }
    }
    if (typeof applyLaptopDistributionAug2026 === 'function') {
        const laptopIv = applyLaptopDistributionAug2026();
        if (laptopIv?.ok && (laptopIv.issues || laptopIv.receipts || laptopIv.patched)) {
            if (typeof saveStateNow === 'function') await saveStateNow();
            else saveState();
            console.info('Laptop distribution IVs applied:', laptopIv);
        }
    }
    if (typeof ensureExampleMidLaptopRequisition === 'function') {
        const ex = ensureExampleMidLaptopRequisition();
        if (ex) {
            if (typeof saveStateNow === 'function') await saveStateNow();
            else saveState();
        }
    }
    if (typeof ensureRealDpPurchaseOrders === 'function') {
        const dpPo = ensureRealDpPurchaseOrders();
        if (dpPo.added > 0) {
            if (typeof saveStateNow === 'function') await saveStateNow();
            else saveState();
        }
    }
    applyTheme(appState.theme);
    if (typeof initInventoryLedgersUi === 'function') initInventoryLedgersUi();
    if (typeof buildVoucherInventorySection === 'function') buildVoucherInventorySection();
    if (typeof preloadAllModules === 'function') {
        preloadAllModules().catch((e) => console.warn('Background module preload', e));
    }
    restoreAllModules();
    if (typeof initFinancialYearBidsImport === 'function') initFinancialYearBidsImport();
    initBidCalculations();
    initVoucherCalculations();
    initStockCalculations();
    initConsumablesStockCalculations();
    initJobCardCalculations();
    initTableSearch();
    initReportsModule();
    if (typeof initGlTargetMonthControls === 'function') initGlTargetMonthControls();
    if (typeof initMonthlyTargetProposalControls === 'function') initMonthlyTargetProposalControls();
    initSpecEvaluationModule();
    if (typeof initAiAssistant === 'function') initAiAssistant();
    if (typeof initDocImportModule === 'function') initDocImportModule();
    if (typeof initStoresQueryEngine === 'function') initStoresQueryEngine();
    if (typeof initWindowChrome === 'function') initWindowChrome();
    if (typeof initRequisitionsModule === 'function') initRequisitionsModule();
    if (typeof initOrderlyRoomModule === 'function') initOrderlyRoomModule();
    if (typeof initCorrespondenceFilesModule === 'function') initCorrespondenceFilesModule();
    if (typeof initMonthlyReturnsModule === 'function') initMonthlyReturnsModule();
    if (typeof initUndeliveredModule === 'function') initUndeliveredModule();
    if (typeof initSupplierDebtsModule === 'function') initSupplierDebtsModule();
    if (typeof initStakeholderDeskModule === 'function') initStakeholderDeskModule();
    if (typeof initPortalsBoardModule === 'function') initPortalsBoardModule();
    if (typeof initWorkshopReceiptCertModule === 'function') initWorkshopReceiptCertModule();
    if (typeof initDeliveryNoteModule === 'function') initDeliveryNoteModule();
    if (typeof initDpProcurementModule === 'function') initDpProcurementModule();
    if (typeof initUnitEquipmentModule === 'function') initUnitEquipmentModule();
    if (typeof initTemporaryLoansModule === 'function') initTemporaryLoansModule();
    if (typeof initPermanentLoansModule === 'function') initPermanentLoansModule();
    if (typeof initIctAccountabilityModule === 'function') initIctAccountabilityModule();
    if (typeof initIctDistributionModule === 'function') initIctDistributionModule();
    if (typeof initStockTakeModule === 'function') initStockTakeModule();
    if (typeof initSuppliersModule === 'function') initSuppliersModule();
    if (typeof initRepairIntakeModules === 'function') initRepairIntakeModules();
    if (typeof ensureRepairIntakeTables === 'function') ensureRepairIntakeTables();
    if (typeof initWorkshopStoresRequest === 'function') initWorkshopStoresRequest();
    initFormBackButtons();
    if (typeof initStockTxnModal === 'function') initStockTxnModal();
    updateDashboard();
    updateVoucherSummary();
    if (typeof renderVoucherInventoryTables === 'function') renderVoucherInventoryTables();
    updateSystemAlerts();
    if (typeof initCommandBoard === 'function') initCommandBoard();
    if (typeof updateCommandBoard === 'function') updateCommandBoard();
    if (typeof initSystemAlertsClicks === 'function') initSystemAlertsClicks();
    if (typeof initItDirCommsSideButton === 'function') initItDirCommsSideButton();
    updateDbStatusBadge();
    if (typeof precacheAppAssetsForOffline === 'function') {
        precacheAppAssetsForOffline();
    }
    if (typeof initPersistentDatabaseHooks === 'function') initPersistentDatabaseHooks();
    if (typeof initFieldHelpSystem === 'function') initFieldHelpSystem();
    if (typeof initNavReorder === 'function') initNavReorder();
}
window.runHeavyBootInit = runHeavyBootInit;

async function finalizeBootState(state) {
    appState = state || appState;
    if (!appState) {
        try { appState = loadState(); } catch (_) { appState = createDefaultState(); }
    }
    updateDbStatusBadge();
    if (typeof initStorageModeUi === 'function') initStorageModeUi();
    if (!appState.users || !appState.users.length) {
        appState.users = createDefaultUsers();
        saveState();
    } else if (typeof ensureSeedUsersPresent === 'function') {
        const before = appState.users.length;
        appState.users = ensureSeedUsersPresent(appState.users);
        if (appState.users.length !== before) {
            if (typeof saveStateNow === 'function') await saveStateNow();
            else saveState();
        }
    }
    if (!Array.isArray(appState.orderlyDailyFile)) {
        appState.orderlyDailyFile = [];
    }
    applyTheme(appState.theme);
    if (typeof initNavReorder === 'function') initNavReorder();
    const bootSession = typeof loadSession === 'function' ? loadSession() : null;
    if (bootSession) {
        await runHeavyBootInit();
    }
    if (typeof initFieldHelpSystem === 'function') initFieldHelpSystem();
    if (typeof initStorageModeUi === 'function') initStorageModeUi();
}

function bootStorageAndState() {
    if (typeof ensureOnlinePreferredByDefault === 'function') ensureOnlinePreferredByDefault();
    if (typeof initStorageModeUi === 'function') initStorageModeUi();
    if (typeof updateLoginStorageLabel === 'function') updateLoginStorageLabel();

    const probe = typeof quickProbeStorageMode === 'function'
        ? quickProbeStorageMode()
        : (typeof probeStorageMode === 'function'
            ? probeStorageMode({ attempts: 1, timeoutMs: 650, delayMs: 0 })
            : Promise.resolve());

    probe.then(() => {
        if (typeof updateLoginStorageLabel === 'function') updateLoginStorageLabel();
        if (typeof syncModeToggleUi === 'function') syncModeToggleUi();
        if (typeof updateDbStatusBadge === 'function') updateDbStatusBadge();
        if (typeof autoStartAppServerIfNeeded === 'function') {
            autoStartAppServerIfNeeded();
        }
    }).catch(() => { /* ignore */ });

    const hydrate = typeof hydrateAppStateFromDatabase === 'function'
        ? hydrateAppStateFromDatabase()
        : loadStateFromDatabase();

    hydrate.then((state) => finalizeBootState(state)).catch((bootError) => {
        console.error('Boot hydrate failed (login still available)', bootError);
        finalizeBootState(appState);
    });
}

document.addEventListener('DOMContentLoaded', function() {
    wireLoginForm();
    try {
        if (!appState) appState = loadState();
    } catch (_) {
        appState = createDefaultState();
    }
    bootStorageAndState();
    if (typeof initPwaInstall === 'function') initPwaInstall();
    document.getElementById('logoutBtn')?.addEventListener('click', logoutUser);

    if (document.body.dataset.targetNavWired !== '1') {
        document.body.dataset.targetNavWired = '1';
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-target-nav]');
            const target = btn?.getAttribute('data-target-nav');
            if (!target || typeof navigateToModule !== 'function') return;
            e.preventDefault();
            const pgTab = btn.getAttribute('data-pg-tab');
            navigateToModule(target, pgTab ? { pgTab } : {});
        });
    }

    document.getElementById('saveUserBtn')?.addEventListener('click', saveUserFromForm);
    document.getElementById('newUserRole')?.addEventListener('change', stkToggleSupplierField);
    document.getElementById('resetUserFormBtn')?.addEventListener('click', function() {
        document.getElementById('newUserPassword').placeholder = 'Password';
        resetUserForm();
    });

    document.getElementById('users-table-body')?.addEventListener('click', function(e) {
        const editBtn = e.target.closest('.btn-edit-user');
        const toggleBtn = e.target.closest('.btn-toggle-user');
        if (editBtn) editUser(editBtn.dataset.userId);
        if (toggleBtn) toggleUserActive(toggleBtn.dataset.userId);
    });

    const menuItems = document.querySelectorAll('.sidebar-menu a[data-target], .card[data-target]');
    const contentSections = document.querySelectorAll('.content-section, .form-container');

    // Capture-phase: always open modules on first click (Field Help must not block nav)
    document.querySelector('.sidebar-menu')?.addEventListener('click', function(e) {
        const link = e.target.closest('a[data-target], a.nav-submenu-toggle');
        if (!link || !this.contains(link)) return;

        // Submenu headers (Portals, GL Accounts, etc.) — toggle expand/collapse
        if (link.classList.contains('nav-submenu-toggle')) {
            const submenu = link.closest('li')?.querySelector(':scope > .submenu');
            if (submenu) {
                e.preventDefault();
                if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
                const opening = !submenu.classList.contains('active');
                submenu.classList.toggle('active');
                link.classList.toggle('is-open', submenu.classList.contains('active'));
                const targetId = link.getAttribute('data-target');
                if (opening && targetId) {
                    navigateToModule(targetId);
                }
                return;
            }
        }

        e.preventDefault();
        const targetId = link.getAttribute('data-target');
        if (!targetId) return;
        const opts = {};
        const panel = link.getAttribute('data-dept-panel');
        if (panel) opts.deptPanel = panel;
        const desk = link.getAttribute('data-stk-desk');
        if (desk) opts.stkDesk = desk;
        navigateToModule(targetId, opts);
    }, true);

    menuItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('data-target');
            if (!targetId) return;
            const opts = {};
            const panel = this.getAttribute('data-dept-panel');
            if (panel) opts.deptPanel = panel;
            const desk = this.getAttribute('data-stk-desk');
            if (desk) opts.stkDesk = desk;
            navigateToModule(targetId, opts);
        });
    });

    document.querySelectorAll('.quick-action-btn, .panel-link[data-target], .rail-shortcut[data-target], #rpGateHome [data-target]').forEach((button) => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            navigateToModule(this.dataset.target);
        });
    });

    document.getElementById('refreshDashboardBtn')?.addEventListener('click', function() {
        updateDashboard();
        showToast('Dashboard refreshed.');
    });

    document.getElementById('dashboardTrackBtn')?.addEventListener('click', function() {
        if (typeof openControlledStoreTrack === 'function') {
            openControlledStoreTrack();
        } else if (typeof openUniversalSearch === 'function') {
            openUniversalSearch();
        } else if (typeof navigateToModule === 'function') {
            navigateToModule('ict-accountability');
        }
    });

    document.querySelectorAll('.close-btn').forEach(button => {
        button.addEventListener('click', function() {
            navigateToModule('dashboard', { skipHistory: true, clearHistory: true });
        });
    });

    contentSections.forEach(section => {
        if (section.id !== 'dashboard') {
            section.style.display = 'none';
        }
    });

    document.getElementById('mobileNavBackdrop')?.addEventListener('click', () => {
        document.body.classList.remove('nav-open');
        document.getElementById('mobileNavBackdrop')?.setAttribute('aria-hidden', 'true');
    });

    document.querySelector('.toggle-sidebar')?.addEventListener('click', function() {
        const sidebar = document.querySelector('.sidebar');
        const isPhone = window.matchMedia('(max-width: 768px)').matches;
        if (isPhone) {
            const open = !document.body.classList.contains('nav-open');
            document.body.classList.toggle('nav-open', open);
            document.getElementById('mobileNavBackdrop')?.setAttribute('aria-hidden', open ? 'false' : 'true');
            sidebar?.classList.remove('collapsed');
            return;
        }
        sidebar?.classList.toggle('collapsed');
    });

    // Close drawer after choosing a module on phone
    document.querySelector('.sidebar-menu')?.addEventListener('click', (e) => {
        if (!window.matchMedia('(max-width: 768px)').matches) return;
        if (e.target.closest('a[data-target]')) {
            document.body.classList.remove('nav-open');
            document.getElementById('mobileNavBackdrop')?.setAttribute('aria-hidden', 'true');
        }
    });

    document.getElementById('themeToggle')?.addEventListener('click', function() {
        if (typeof openUiPreferences === 'function') openUiPreferences();
    });

    if (typeof initUiPreferences === 'function') initUiPreferences();

    document.querySelectorAll('.btn-save-module').forEach(button => {
        button.addEventListener('click', function() {
            const moduleContainer = this.closest('.form-container');
            if (moduleContainer) {
                saveModule(moduleContainer.id);
            }
        });
    });

    document.getElementById('processReleaseCutBtn')?.addEventListener('click', processReleaseCut);

    document.getElementById('voucherType')?.addEventListener('change', function() {
        updateVoucherSummary();
        if (typeof renderVoucherInventoryTables === 'function') renderVoucherInventoryTables();
    });
    document.getElementById('voucherDefaultGl')?.addEventListener('change', function() {
        document.querySelectorAll('#voucher-table-body .voucher-gl').forEach((select) => {
            if (!select.value) select.value = this.value;
        });
    });

    document.getElementById('exportDataBtn')?.addEventListener('click', exportSystemData);
    document.getElementById('importDataFile')?.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) importSystemData(file);
        event.target.value = '';
        closeBackupMenu();
    });

    function closeBackupMenu() {
        const menu = document.getElementById('backupMenu');
        const panel = document.getElementById('backupMenuPanel');
        const btn = document.getElementById('backupMenuBtn');
        if (panel) panel.hidden = true;
        if (btn) btn.setAttribute('aria-expanded', 'false');
        menu?.classList.remove('is-open');
    }

    function toggleBackupMenu() {
        const panel = document.getElementById('backupMenuPanel');
        const btn = document.getElementById('backupMenuBtn');
        const menu = document.getElementById('backupMenu');
        if (!panel || !btn) return;
        const open = panel.hidden;
        panel.hidden = !open;
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        menu?.classList.toggle('is-open', open);
    }

    document.getElementById('backupMenuBtn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleBackupMenu();
    });
    document.getElementById('viewDbTablesBtn')?.addEventListener('click', () => {
        closeBackupMenu();
        window.open('/db-viewer?mode=tables', '_blank', 'noopener');
    });
    document.getElementById('viewDbRecordsBtn')?.addEventListener('click', () => {
        closeBackupMenu();
        window.open('/db-viewer?mode=records', '_blank', 'noopener');
    });
    document.getElementById('viewDbAuditBtn')?.addEventListener('click', () => {
        closeBackupMenu();
        window.open('/db-viewer?mode=audit', '_blank', 'noopener');
    });
    document.getElementById('exportDataBtn')?.addEventListener('click', () => {
        closeBackupMenu();
    });
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#backupMenu')) closeBackupMenu();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeBackupMenu();
    });

    document.querySelectorAll('.btn-print-module').forEach((button) => {
        button.addEventListener('click', function() {
            printModule(this.dataset.printTarget);
        });
    });

    if (typeof initDashboardCollapsibles === 'function') initDashboardCollapsibles();
    if (typeof wireCommanderDemoPackUi === 'function') wireCommanderDemoPackUi();

    const existingSession = loadSession();
    if (existingSession) {
        enterApp(existingSession);
    } else {
        document.body.classList.add('app-locked');
        updateHeaderUser();
    }
});

