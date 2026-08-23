/* voucher-inventory.js — Receive / Issue stock ledger, day start/end, alerts */

function invHtmlEscape(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/** Softwares / licence purchases are expended (not held as stock on hand). */
function isSoftwareLicenceCategory(categoryKey, gl, itemId) {
    if (typeof isSoftwareCatalogCategory === 'function' && isSoftwareCatalogCategory(categoryKey)) return true;
    if (String(gl || '') === '2200600003') return true;
    if (String(itemId || '').startsWith('software-licences__')) return true;
    return false;
}

const LICENCE_PACKAGE_TERMS = [
    { value: '1m', label: 'Monthly (1 month)', months: 1 },
    { value: '1y', label: 'Annual (1 year)', months: 12 }
];

function getLicencePackageMeta(term) {
    return LICENCE_PACKAGE_TERMS.find((t) => t.value === term) || LICENCE_PACKAGE_TERMS[0];
}

/** Add calendar months to an ISO date (YYYY-MM-DD), preserving day-of-month when possible. */
function addLicenceMonthsIso(iso, months) {
    const raw = String(iso || '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return '';
    const [y, m, d] = raw.split('-').map(Number);
    const start = new Date(y, m - 1, d);
    if (Number.isNaN(start.getTime())) return '';
    const targetMonth = start.getMonth() + Number(months || 0);
    const result = new Date(start.getFullYear(), targetMonth, d);
    // Clamp overflow (e.g. 31 Jan + 1m → last day of Feb)
    if (result.getDate() !== d) {
        result.setDate(0);
    }
    const pad = (n) => String(n).padStart(2, '0');
    return `${result.getFullYear()}-${pad(result.getMonth() + 1)}-${pad(result.getDate())}`;
}

function computeLicenceExpiryFromStart(startIso, term) {
    const meta = getLicencePackageMeta(term);
    return addLicenceMonthsIso(startIso, meta.months);
}

function formatLicenceDateShort(iso) {
    if (!iso) return '—';
    if (typeof ictAccFormatDate === 'function') return ictAccFormatDate(iso);
    const d = new Date(`${iso}T00:00:00`);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function findActiveSoftwareLicenceRecord(designation) {
    const name = String(designation || '').trim().toLowerCase();
    if (!name || typeof ensureIctAccountability !== 'function') return null;
    const list = ensureIctAccountability()
        .filter((r) => r.assetClass === 'software'
            && String(r.designation || '').trim().toLowerCase() === name)
        .sort((a, b) => String(b.expiryDate || '').localeCompare(String(a.expiryDate || '')));
    return list[0] || null;
}

/**
 * Register / renew a software licence on the Asset Register after Softwares purchase.
 * Licences are expended (bought & issued) — renewal date is what matters.
 */
function registerSoftwareLicenceFromPurchase({
    itemName,
    qty = 1,
    licenceStart,
    licenceExpiry,
    licenceTerm = '1m',
    paymentMethod = 'Mastercard',
    vendor = '',
    gl = '2200600003',
    voucherNo = '',
    description = ''
} = {}) {
    if (typeof upsertIctAccountabilityRecord !== 'function') return null;
    const termMeta = getLicencePackageMeta(licenceTerm);
    const existing = findActiveSoftwareLicenceRecord(itemName);
    const notes = [
        `Package: ${termMeta.label}`,
        `Payment: ${paymentMethod || 'Mastercard'}`,
        vendor ? `Vendor: ${vendor}` : '',
        'Expended on purchase (not held as stock). Renewal alert 5 days before expiry.'
    ].filter(Boolean).join(' · ');

    return upsertIctAccountabilityRecord({
        id: existing?.id,
        assetClass: 'software',
        designation: itemName,
        description: description || `${termMeta.label} software licence`,
        qty: Number(qty) > 0 ? Number(qty) : (existing?.qty || 1),
        status: 'issued',
        engraved: false,
        holderName: vendor || existing?.holderName || 'IT Dir (online purchase)',
        purchaseDate: licenceStart,
        receivedDate: licenceStart,
        issueDate: licenceStart,
        expiryDate: licenceExpiry,
        renewalNotes: notes,
        glCharge: gl || '2200600003',
        inventoryLedger: 'inv-softwares',
        form1033Ref: voucherNo || existing?.form1033Ref || '',
        remarks: existing?.remarks || 'Bought online · expended · track renewal date only'
    });
}

function canEditInventoryOpenings() {
    return typeof canManageUsers === 'function' && canManageUsers();
}

function getInventoryBalanceView() {
    const inv = appState?.storesInventory;
    return inv?.balanceView === 'cumulative' ? 'cumulative' : 'daily';
}

function setInventoryBalanceView(view) {
    const inv = ensureStoresInventory();
    inv.balanceView = view === 'cumulative' ? 'cumulative' : 'daily';
    try { saveState(); } catch (_) { /* ignore */ }
}

function getInventoryFocusDate() {
    const input = document.getElementById('inventoryFocusDate');
    if (input?.value) return input.value;
    const session = appState?.storesInventory?.daySession;
    if (session?.date && !session.endedAt) return session.date;
    return todayIsoDate();
}

/** Admin-only: correct perpetual Opening (take-on). Does not invent receive/issue movements. */
function setItemOpening(itemId, newOpening, reason) {
    if (!canEditInventoryOpenings()) {
        showToast('Only the Administrator can edit Opening balances.', 'error');
        return false;
    }
    if (!itemId) return false;
    const inv = ensureStoresInventory();
    const prev = Number(inv.openings[itemId]) || 0;
    const next = Math.max(0, Math.round(Number(newOpening) || 0));
    if (prev === next) return true;

    inv.openings[itemId] = next;
    if (!Array.isArray(inv.openingAdjustments)) inv.openingAdjustments = [];
    inv.openingAdjustments.push({
        id: `opn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        itemId,
        prev,
        next,
        reason: (reason || 'Admin opening correction').trim(),
        by: currentUser?.name || currentUser?.username || 'Administrator',
        at: new Date().toISOString()
    });
    if (inv.openingAdjustments.length > 200) {
        inv.openingAdjustments = inv.openingAdjustments.slice(-200);
    }

    if (typeof recordAccessAudit === 'function') {
        const catalog = typeof getCatalogItemById === 'function' ? getCatalogItemById(itemId) : null;
        recordAccessAudit(
            'inventory_opening_edit',
            `${catalog?.name || itemId}: Opening ${prev} → ${next}`
        );
    }

    saveState();
    if (typeof renderVoucherInventoryTables === 'function') renderVoucherInventoryTables();
    if (typeof updateSystemAlerts === 'function') updateSystemAlerts();
    if (typeof updateDashboard === 'function') updateDashboard();
    showToast(`Opening updated: ${prev} → ${next}. On hand recalculated.`);
    return true;
}

/**
 * One-time: restore archived day movements into the live ledger and rebase Opening
 * so On Hand stays unchanged. Enables cumulative Received/Issued without double-counting.
 */
function migrateStoresInventoryToPerpetual(inv) {
    if (!inv || inv.ledgerMode === 'perpetual') return inv;

    const byId = new Map();
    (inv.transactions || []).forEach((t) => {
        if (t?.id) byId.set(t.id, t);
        else if (t) byId.set(`legacy-${byId.size}-${t.itemId}-${t.date}-${t.type}-${t.qty}`, t);
    });

    // Capture on-hand before merge (openings already embed folded prior periods)
    const liveOnHand = {};
    const accumulateLive = (itemId) => {
        if (!itemId || liveOnHand[itemId] != null) return;
        const isCategoryKey = (VOUCHER_INVENTORY_CATEGORIES || []).some((c) => c.key === itemId);
        if (isCategoryKey) return;
        const opening = Number(inv.openings[itemId]) || 0;
        let received = 0;
        let issued = 0;
        (inv.transactions || []).forEach((t) => {
            if (t.itemId !== itemId) return;
            const qty = Number(t.qty) || 0;
            if (t.type === 'receipt') received += qty;
            else if (t.type === 'issue') issued += qty;
        });
        liveOnHand[itemId] = opening + received - issued;
    };

    Object.keys(inv.openings || {}).forEach(accumulateLive);
    (inv.transactions || []).forEach((t) => accumulateLive(t.itemId));
    (inv.dayHistory || []).forEach((day) => {
        (day.transactionsSnapshot || []).forEach((t) => {
            if (!t) return;
            if (t.id && !byId.has(t.id)) byId.set(t.id, t);
            else if (!t.id) byId.set(`hist-${byId.size}-${t.itemId}-${t.date}-${t.type}-${t.qty}`, t);
            accumulateLive(t.itemId);
        });
    });

    const merged = [...byId.values()].sort((a, b) => String(a.date || '').localeCompare(String(b.date || ''))
        || String(a.createdAt || '').localeCompare(String(b.createdAt || '')));

    Object.keys(liveOnHand).forEach((itemId) => {
        const preservedOnHand = liveOnHand[itemId];
        let received = 0;
        let issued = 0;
        merged.forEach((t) => {
            if (t.itemId !== itemId) return;
            const qty = Number(t.qty) || 0;
            if (t.type === 'receipt') received += qty;
            else if (t.type === 'issue') issued += qty;
        });
        inv.openings[itemId] = preservedOnHand - received + issued;
    });

    inv.transactions = merged;
    inv.ledgerMode = 'perpetual';
    if (!Array.isArray(inv.openingAdjustments)) inv.openingAdjustments = [];
    if (inv.balanceView !== 'cumulative') inv.balanceView = inv.balanceView || 'daily';
    inv._persistLedgerMigration = true;
    return inv;
}

function ensureStoresInventory() {
    if (!appState.storesInventory) {
        appState.storesInventory = createDefaultStoresInventory();
    }
    if (!appState.storesInventory.openings) appState.storesInventory.openings = {};
    if (!Array.isArray(appState.storesInventory.transactions)) appState.storesInventory.transactions = [];
    if (!Array.isArray(appState.storesInventory.dayHistory)) appState.storesInventory.dayHistory = [];
    if (!Array.isArray(appState.storesInventory.openingAdjustments)) {
        appState.storesInventory.openingAdjustments = [];
    }
    (VOUCHER_INVENTORY_CATEGORIES || []).forEach((cat) => {
        if (appState.storesInventory.openings[cat.key] == null) {
            appState.storesInventory.openings[cat.key] = 0;
        }
    });
    migrateStoresInventoryToPerpetual(appState.storesInventory);
    if (appState.storesInventory._persistLedgerMigration) {
        delete appState.storesInventory._persistLedgerMigration;
        try {
            if (typeof saveState === 'function') saveState();
        } catch (_) { /* boot may not be ready */ }
    }
    return appState.storesInventory;
}

function todayIsoDate() {
    const d = new Date();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${m}-${day}`;
}

function suggestVoucherInventoryCategory(itemName) {
    if (typeof suggestInventoryLedgerKey === 'function') {
        return suggestInventoryLedgerKey(itemName);
    }
    const t = String(itemName || '').toLowerCase();
    if (!t.trim()) return null;
    if (/\b(toner|cartridge|ink|printhead|ribbon|drum)\b/.test(t)) return 'inv-toner';
    if (/\b(flash|usb\s*stick|memory\s*stick|pen\s*drive)\b/.test(t)) return 'inv-usb';
    if (/\b(external\s*(hard\s*)?(disk|drive|hdd))\b/.test(t)) return 'inv-external-hdd';
    if (/\b(software|licence|license|windows|office|kaspersky|vmware|oracle|sql|devexpress)\b/.test(t)) return 'inv-softwares';
    if (/\b(laptop|notebook)\b/.test(t)) return 'inv-laptops';
    if (/\b(desktop|optiplex)\b/.test(t)) return 'inv-desktops';
    if (/\b(tablet|ipad|galaxy\s*tab)\b/.test(t) || /\btab\s*[sabfe]?\s*\d/.test(t)) return 'inv-tablets';
    if (/\b(printer|mfp)\b/.test(t)) return 'inv-printers';
    if (/\b(projector)\b/.test(t)) return 'inv-projectors';
    if (/\b(smart\s*board|interactive)\b/.test(t)) return 'inv-smartboards';
    if (/\b(motherboard|ssd|ram|ddr|fuser|roller|maintenance\s*kit|fan|battery|solder|blower|spare|ups)\b/.test(t)) return 'inv-spares';
    if (/\b(photocopier|reballing|plotter|fire\s*alarm|id\s*card|maintenance)\b/.test(t)) return 'inv-maintenance';
    return null;
}

function getVoucherInventoryCategoryMeta(key) {
    return (VOUCHER_INVENTORY_CATEGORIES || []).find((c) => c.key === key)
        || { key: 'other', label: 'Other', detail: 'Unclassified store items' };
}

function getActiveInventoryCategory() {
    const active = document.querySelector('.voucher-inv-tab.active');
    return active?.dataset.invTab || (VOUCHER_INVENTORY_CATEGORIES[0]?.key) || 'consumables-toners';
}

function getItemOpening(itemId) {
    const inv = ensureStoresInventory();
    return Number(inv.openings[itemId]) || 0;
}

/**
 * Stock equation (always): On Hand = Opening + Received − Issued
 * - cumulative: Opening = perpetual take-on; R/I = all movements
 * - daily: Opening = balance at start of focus date; R/I = that day's movements
 */
function getItemStockSummary(itemId, options = {}) {
    const mode = options.mode || getInventoryBalanceView();
    const focusDate = options.date || getInventoryFocusDate();
    const openingBase = getItemOpening(itemId);
    const allTxns = ensureStoresInventory().transactions.filter((t) => t.itemId === itemId);

    let opening = openingBase;
    let received = 0;
    let issued = 0;
    let viewTxns = allTxns;

    if (mode === 'daily') {
        let priorIn = 0;
        let priorOut = 0;
        const dayTxns = [];
        allTxns.forEach((t) => {
            const qty = Number(t.qty) || 0;
            const d = t.date || '';
            if (d && d < focusDate) {
                if (t.type === 'receipt') priorIn += qty;
                else if (t.type === 'issue') priorOut += qty;
            } else if (!d || d === focusDate) {
                dayTxns.push(t);
                if (t.type === 'receipt') received += qty;
                else if (t.type === 'issue') issued += qty;
            }
            // Future-dated txns excluded from daily view figures
        });
        opening = openingBase + priorIn - priorOut;
        viewTxns = dayTxns;
    } else {
        allTxns.forEach((t) => {
            const qty = Number(t.qty) || 0;
            if (t.type === 'receipt') received += qty;
            else if (t.type === 'issue') issued += qty;
        });
    }

    const catalog = typeof getCatalogItemById === 'function' ? getCatalogItemById(itemId) : null;
    return {
        itemId,
        item: catalog?.name || allTxns[0]?.item || itemId,
        category: catalog?.category || allTxns[0]?.category || '',
        gl: catalog?.gl || allTxns[0]?.gl || '',
        opening,
        openingBase,
        received,
        issued,
        onHand: opening + received - issued,
        transactions: viewTxns,
        mode,
        focusDate
    };
}

function getCategoryStockSummary(categoryKey, options = {}) {
    const mode = options.mode || getInventoryBalanceView();
    const focusDate = options.date || getInventoryFocusDate();
    const catalogItems = typeof getCatalogItemsForCategory === 'function'
        ? getCatalogItemsForCategory(categoryKey)
        : [];
    const inv = ensureStoresInventory();
    const itemIds = new Set(catalogItems.map((i) => i.id));
    const ledger = typeof getInventoryLedgerByKey === 'function' ? getInventoryLedgerByKey(categoryKey) : null;
    const sourceKeys = ledger?.sourceKeys || [];
    const categoryAliases = new Set([categoryKey, ...sourceKeys]);

    // Include legacy / ad-hoc items that only exist in openings or transactions
    Object.keys(inv.openings || {}).forEach((id) => {
        if ([...categoryAliases].some((k) => String(id).startsWith(`${k}__`))) itemIds.add(id);
    });
    (inv.transactions || []).forEach((t) => {
        if (categoryAliases.has(t.category) && t.itemId) itemIds.add(t.itemId);
    });

    let opening = 0;
    let received = 0;
    let issued = 0;
    const itemSummaries = [];
    const transactions = (inv.transactions || []).filter((t) => {
        if (!categoryAliases.has(t.category)) return false;
        if (mode === 'daily') {
            const d = t.date || '';
            return !d || d === focusDate;
        }
        return true;
    });

    itemIds.forEach((id) => {
        const row = getItemStockSummary(id, { mode, date: focusDate });
        opening += row.opening;
        received += row.received;
        issued += row.issued;
        itemSummaries.push(row);
    });

    // Legacy category-level opening (pre-catalog) — cumulative only
    if (!itemIds.size && mode === 'cumulative') {
        opening += Number(inv.openings[categoryKey]) || 0;
        sourceKeys.forEach((k) => {
            opening += Number(inv.openings[k]) || 0;
        });
    }

    itemSummaries.sort((a, b) => String(a.item).localeCompare(String(b.item)));

    return {
        opening,
        received,
        issued,
        onHand: opening + received - issued,
        transactions,
        items: itemSummaries,
        mode,
        focusDate
    };
}

function getAllCategoryStockSummaries() {
    const map = {};
    (VOUCHER_INVENTORY_CATEGORIES || []).forEach((cat) => {
        map[cat.key] = getCategoryStockSummary(cat.key);
    });
    return map;
}

function getTrackedItemIds() {
    const inv = ensureStoresInventory();
    const ids = new Set();
    Object.keys(inv.openings || {}).forEach((id) => {
        if (id.includes('__')) ids.add(id);
    });
    (inv.transactions || []).forEach((t) => {
        if (t.itemId) ids.add(t.itemId);
    });
    return [...ids];
}

function getStoresItemDepletionAlerts() {
    const alerts = [];
    getTrackedItemIds().forEach((itemId) => {
        const row = getItemStockSummary(itemId, { mode: 'cumulative' });
        if (row.onHand < 0) {
            alerts.push({
                type: 'danger',
                target: 'voucher-module',
                text: `STOCK OVER-ISSUED: ${row.item} is short by ${Math.abs(row.onHand)}. Reconcile immediately.`
            });
        } else if (row.onHand === 0 && (row.openingBase > 0 || row.received > 0 || row.issued > 0)) {
            alerts.push({
                type: 'danger',
                target: 'voucher-module',
                text: `STOCK DEPLETED: ${row.item} on hand is 0. Restock or stop further issues.`
            });
        } else if (row.onHand > 0) {
            const base = row.openingBase + row.received;
            if (base > 0 && row.onHand / base <= 0.2) {
                alerts.push({
                    type: 'warning',
                    target: 'voucher-module',
                    text: `LOW STOCK: ${row.item} has only ${row.onHand} on hand.`
                });
            }
        }
    });

    const session = ensureStoresInventory().daySession;
    if (!session) {
        alerts.push({
            type: 'warning',
            target: 'voucher-module',
            text: 'Day start not recorded. Tap Start of Day to lock opening stock balances.'
        });
    } else if (session.date !== todayIsoDate() && !session.endedAt) {
        alerts.push({
            type: 'warning',
            target: 'voucher-module',
            text: `Previous store day (${session.date}) was not closed. Run Day End Reconcile.`
        });
    }

    return alerts;
}

function postStockTransaction(payload) {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return null;

    const type = payload.type === 'receipt' ? 'receipt' : 'issue';
    let catalogItem = payload.itemId && typeof getCatalogItemById === 'function'
        ? getCatalogItemById(payload.itemId)
        : null;
    let itemId = catalogItem?.id || payload.itemId || '';
    let itemName = (catalogItem?.name || payload.item || '').trim();
    let category = catalogItem?.category || payload.category || 'inv-toner';
    let gl = catalogItem?.gl || payload.gl || '';
    const qty = Number(payload.qty) || 0;
    const silent = !!payload.silent;
    const txnDate = payload.date || (typeof todayIsoLocal === 'function' ? todayIsoLocal() : todayIsoDate());

    if (qty <= 0) {
        if (!silent) showToast('Enter a quantity greater than zero.', 'error');
        return null;
    }
    if (!itemName) {
        if (!silent) showToast('Select a catalog item or enter an item name.', 'error');
        return null;
    }
    if (typeof validateIsoDate === 'function') {
        const dateErr = validateIsoDate(txnDate, { required: true, label: 'Transaction date', notFuture: true });
        if (dateErr) {
            if (!silent) showToast(dateErr, 'error');
            return null;
        }
    }

    // Allow ad-hoc / procurement designations when not in catalog
    if (!itemId && payload.allowAdhoc) {
        if (typeof resolveCatalogOrAdhocItem === 'function') {
            const resolved = resolveCatalogOrAdhocItem(itemName, category);
            itemId = resolved.id;
            itemName = resolved.name;
            category = resolved.category || category;
            gl = resolved.gl || gl;
            catalogItem = resolved.catalog ? resolved : catalogItem;
        } else {
            const slug = itemName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'item';
            itemId = `adhoc__${category}__${slug}`;
        }
    }

    if (!itemId) {
        if (!silent) showToast('Select an item from the IT Directorate catalog.', 'error');
        return null;
    }

    // Idempotent skip if same source+ref+item+type already posted
    if (payload.sourceRef && payload.source) {
        const dup = ensureStoresInventory().transactions.find((t) => (
            t.source === payload.source &&
            t.sourceRef === payload.sourceRef &&
            t.itemId === itemId &&
            t.type === type &&
            Number(t.qty) === qty
        ));
        if (dup) return dup;
    }

    const summary = getItemStockSummary(itemId, { mode: 'cumulative' });
    if (type === 'issue' && qty > summary.onHand) {
        if (!silent) showToast(`Cannot issue ${qty}. Only ${summary.onHand} of "${itemName}" on hand.`, 'error');
        return null;
    }

    if (typeof validateIctLaptopIssueCustody === 'function') {
        const custodyErr = validateIctLaptopIssueCustody({
            type,
            party: payload.party,
            itemId,
            item: itemName,
            category,
            allowDuplicateCustody: payload.allowDuplicateCustody
        });
        if (custodyErr) {
            if (!silent) showToast(custodyErr, 'error');
            return null;
        }
    }

    const inv = ensureStoresInventory();
    const txn = {
        id: `stk-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        date: txnDate,
        type,
        itemId,
        category,
        item: itemName,
        description: (payload.description || '').trim(),
        qty,
        uom: (payload.uom || 'EA').trim() || 'EA',
        gl,
        voucherNo: (payload.voucherNo || '').trim(),
        party: (payload.party || '').trim(),
        source: (payload.source || 'manual').trim(),
        sourceRef: (payload.sourceRef || '').trim(),
        dpRef: (payload.dpRef || '').trim(),
        poNumber: (payload.poNumber || '').trim(),
        deliveryNoteRef: (payload.deliveryNoteRef || '').trim(),
        by: currentUser?.name || currentUser?.username || 'Storeman',
        createdAt: new Date().toISOString()
    };
    inv.transactions.push(txn);
    if (typeof getOrAssignDisplayItemId === 'function') {
        const code = getOrAssignDisplayItemId(itemId, itemName, category);
        txn.displayItemId = code;
    }

    const isLaptopReturn = type === 'receipt' && payload.party && (
        payload.laptopReturn
        || /\b(return|returned)\b/i.test(`${payload.description || ''} ${txn.description || ''}`)
    );
    if (isLaptopReturn && typeof closeIctCustodyOnLaptopReturn === 'function') {
        closeIctCustodyOnLaptopReturn(payload.party);
    }

    saveState();

    const after = getItemStockSummary(itemId, { mode: 'cumulative' });
    if (!silent) {
        if (type === 'receipt') {
            showToast(`Received ${qty} × ${itemName}. On hand: ${after.onHand}.`);
        } else {
            showToast(`Issued ${qty} × ${itemName}. On hand: ${after.onHand}.`);
            if (after.onHand <= 0) {
                showToast(`ALERT: ${itemName} stock is depleted.`, 'error');
            }
        }
    }

    if (!payload.skipRender) {
        if (typeof renderVoucherInventoryTables === 'function') renderVoucherInventoryTables();
        if (typeof renderProductStockRegister === 'function') renderProductStockRegister();
        if (typeof updateSystemAlerts === 'function') updateSystemAlerts();
        if (typeof updateDashboard === 'function') updateDashboard();
    }
    return txn;
}

function startStoreDay() {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;
    const inv = ensureStoresInventory();
    const today = todayIsoDate();

    if (inv.daySession && inv.daySession.date === today && !inv.daySession.endedAt) {
        showToast('Store day already started for today.', 'info');
        return;
    }

    if (inv.daySession && !inv.daySession.endedAt) {
        showToast(`Close the open day (${inv.daySession.date}) with Day End Reconcile first.`, 'error');
        return;
    }

    openStartOfDayModal();
}

function getStockModalDate() {
    return document.getElementById('stockTxnModalDate')?.value || todayIsoDate();
}

function setStockModalDate(value) {
    const el = document.getElementById('stockTxnModalDate');
    if (el) el.value = value || todayIsoDate();
}

function resetStockModalWindowState() {
    const modal = document.getElementById('stockTxnModal');
    const dialog = document.getElementById('stockTxnModalDialog');
    const maxBtn = document.getElementById('stockTxnModalMaximize');
    const minBar = document.getElementById('stockTxnMinimizedBar');
    if (!modal || !dialog) return;

    modal.classList.remove('is-maximized', 'is-minimized');
    dialog.style.width = '';
    dialog.style.height = '';
    if (minBar) minBar.hidden = true;
    if (maxBtn) {
        maxBtn.textContent = '▢';
        maxBtn.title = 'Maximize';
        maxBtn.setAttribute('aria-label', 'Maximize');
    }
}

function minimizeStockTxnModal() {
    const modal = document.getElementById('stockTxnModal');
    const title = document.getElementById('stockTxnModalTitle')?.textContent || 'Stock form';
    const label = document.getElementById('stockTxnMinimizedLabel');
    const minBar = document.getElementById('stockTxnMinimizedBar');
    if (!modal) return;
    modal.classList.remove('is-maximized');
    modal.classList.add('is-minimized');
    if (label) label.textContent = `${title} · ${getStockModalDate()}`;
    if (minBar) minBar.hidden = false;
}

function restoreStockTxnModal() {
    const modal = document.getElementById('stockTxnModal');
    const minBar = document.getElementById('stockTxnMinimizedBar');
    if (!modal) return;
    modal.classList.remove('is-minimized');
    if (minBar) minBar.hidden = true;
}

function toggleMaximizeStockTxnModal() {
    const modal = document.getElementById('stockTxnModal');
    const dialog = document.getElementById('stockTxnModalDialog');
    const maxBtn = document.getElementById('stockTxnModalMaximize');
    if (!modal || !dialog) return;

    const willMaximize = !modal.classList.contains('is-maximized');
    modal.classList.remove('is-minimized');
    const minBar = document.getElementById('stockTxnMinimizedBar');
    if (minBar) minBar.hidden = true;

    if (willMaximize) {
        dialog.style.width = '';
        dialog.style.height = '';
        modal.classList.add('is-maximized');
        if (maxBtn) {
            maxBtn.textContent = '❐';
            maxBtn.title = 'Restore size';
            maxBtn.setAttribute('aria-label', 'Restore size');
        }
    } else {
        modal.classList.remove('is-maximized');
        if (maxBtn) {
            maxBtn.textContent = '▢';
            maxBtn.title = 'Maximize';
            maxBtn.setAttribute('aria-label', 'Maximize');
        }
    }
}

function buildCatalogItemOptionsHtml(categoryKey, selectedId) {
    const items = typeof getCatalogItemsForCategory === 'function'
        ? getCatalogItemsForCategory(categoryKey)
        : [];
    if (typeof buildCatalogItemSelectOptionsHtml === 'function') {
        return buildCatalogItemSelectOptionsHtml(items, selectedId, categoryKey);
    }
    const sorted = [...items].sort((a, b) =>
        String(a.name || '').localeCompare(String(b.name || ''), undefined, { sensitivity: 'base' })
    );
    const opts = ['<option value="">— Select catalog item —</option>']
        .concat(sorted.map((item) => {
            const sel = item.id === selectedId ? ' selected' : '';
            return `<option value="${invHtmlEscape(item.id)}"${sel}>${invHtmlEscape(item.name)}</option>`;
        }));
    return opts.join('');
}

function fillCatalogItemSelect(selectEl, categoryKey, selectedId) {
    if (!selectEl) return;
    selectEl.innerHTML = buildCatalogItemOptionsHtml(categoryKey, selectedId);
}

function openStartOfDayModal() {
    const title = document.getElementById('stockTxnModalTitle');
    const body = document.getElementById('stockTxnModalBody');
    const confirmBtn = document.getElementById('stockTxnModalConfirm');
    if (!title || !body || !confirmBtn) return;

    const category = getActiveInventoryCategory();
    title.textContent = 'Start of Day — Opening Stocks';
    confirmBtn.textContent = 'Lock Opening Stocks';
    confirmBtn.dataset.mode = 'day-start';
    setStockModalDate(todayIsoDate());

    body.innerHTML = `
        <p class="modal-help">Enter opening counts for IT Directorate catalog items. First take-on books into <strong>Opening</strong>. Differences on items that already have a ledger post as variance adjustments (receive/issue). Transaction history is retained.</p>
        <div class="form-row">
            <div class="form-col">
                <label class="form-label">Catalog Category</label>
                <select class="form-control" id="dayStartCategory">${buildCategoryOptionsHtml(category)}</select>
            </div>
            <div class="form-col">
                <label class="form-label">Search Items</label>
                <input type="search" class="form-control" id="dayStartSearch" data-search-history="1" data-search-history-key="day-start-catalog" placeholder="e.g. CE505A / laptop / Cisco" autocomplete="off">
            </div>
        </div>
        <div class="form-table-wrapper">
            <table class="overview-table">
                <thead>
                    <tr>
                        <th>Catalog Item</th>
                        <th>Current System</th>
                        <th>Opening Count</th>
                    </tr>
                </thead>
                <tbody id="dayStartItemsBody"></tbody>
            </table>
        </div>
    `;

    const refreshRows = () => {
        const cat = document.getElementById('dayStartCategory')?.value || category;
        const q = (document.getElementById('dayStartSearch')?.value || '').trim().toLowerCase();
        const items = (typeof getCatalogItemsForCategory === 'function' ? getCatalogItemsForCategory(cat) : [])
            .filter((item) => !q || item.name.toLowerCase().includes(q));
        const tbody = document.getElementById('dayStartItemsBody');
        if (!tbody) return;
        if (!items.length) {
            tbody.innerHTML = '<tr><td colspan="3">No catalog items match this filter.</td></tr>';
            return;
        }
        tbody.innerHTML = items.map((item) => {
            const sys = getItemStockSummary(item.id, { mode: 'cumulative' }).onHand;
            return `
                <tr>
                    <td>${invHtmlEscape(item.name)}</td>
                    <td>${sys}</td>
                    <td>
                        <input type="number" class="form-control day-start-opening" data-item-id="${invHtmlEscape(item.id)}" min="0" step="1" value="${sys}">
                    </td>
                </tr>
            `;
        }).join('');
    };

    body.querySelector('#dayStartCategory')?.addEventListener('change', refreshRows);
    body.querySelector('#dayStartSearch')?.addEventListener('input', refreshRows);
    if (typeof bindSearchHistory === 'function') {
        const searchEl = document.getElementById('dayStartSearch');
        if (searchEl) {
            bindSearchHistory(searchEl);
            searchEl.addEventListener('search-history-commit', refreshRows);
            searchEl.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    if (typeof rememberSearchTerm === 'function') rememberSearchTerm(searchEl, searchEl.value);
                    refreshRows();
                }
            });
        }
    }
    refreshRows();
    openStockTxnModal();
}

function completeStartOfDay() {
    const inv = ensureStoresInventory();
    const dayDate = getStockModalDate();
    const snapshot = {};
    let adjCount = 0;
    let takeOnCount = 0;

    getTrackedItemIds().forEach((itemId) => {
        snapshot[itemId] = getItemStockSummary(itemId, { mode: 'cumulative' }).onHand;
    });

    document.querySelectorAll('.day-start-opening[data-item-id]').forEach((input) => {
        const itemId = input.dataset.itemId;
        if (!itemId) return;
        const raw = Number(input.value);
        const desired = Number.isFinite(raw) && raw >= 0 ? Math.round(raw) : (snapshot[itemId] || 0);
        const cum = getItemStockSummary(itemId, { mode: 'cumulative' });
        const sys = cum.onHand;
        const delta = desired - sys;
        if (delta !== 0) {
            const hasLedger = (Number(cum.openingBase) || 0) !== 0
                || cum.received > 0
                || cum.issued > 0
                || (inv.transactions || []).some((t) => t.itemId === itemId);

            if (!hasLedger) {
                // First take-on: book into Opening (not a fake receipt)
                inv.openings[itemId] = desired;
                if (!Array.isArray(inv.openingAdjustments)) inv.openingAdjustments = [];
                inv.openingAdjustments.push({
                    id: `opn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                    itemId,
                    prev: 0,
                    next: desired,
                    reason: `Start of Day take-on ${dayDate}`,
                    by: currentUser?.name || currentUser?.username || 'Storeman',
                    at: new Date().toISOString()
                });
                takeOnCount += 1;
            } else {
                const catalog = typeof getCatalogItemById === 'function' ? getCatalogItemById(itemId) : null;
                const posted = postStockTransaction({
                    type: delta > 0 ? 'receipt' : 'issue',
                    itemId,
                    item: catalog?.name || itemId,
                    category: catalog?.category,
                    gl: catalog?.gl,
                    qty: Math.abs(delta),
                    date: dayDate,
                    description: 'Start of Day variance adjustment',
                    source: 'day-start-adj',
                    sourceRef: `SOD-${dayDate}-${itemId}`,
                    silent: true,
                    skipRender: true,
                    allowAdhoc: !catalog
                });
                if (posted) adjCount += 1;
            }
        }
        snapshot[itemId] = desired;
    });

    inv.daySession = {
        date: dayDate,
        startedAt: new Date().toISOString(),
        startedBy: currentUser?.name || currentUser?.username || 'Storeman',
        openingSnapshot: { ...snapshot },
        endedAt: null,
        endedBy: null,
        physicalCounts: null,
        systemClosing: null,
        variances: null
    };

    saveState();
    closeStockTxnModal();
    renderVoucherInventoryTables();
    if (typeof updateSystemAlerts === 'function') updateSystemAlerts();
    if (typeof updateDashboard === 'function') updateDashboard();
    const bits = [];
    if (takeOnCount) bits.push(`${takeOnCount} take-on`);
    if (adjCount) bits.push(`${adjCount} variance adj`);
    const extra = bits.length ? ` (${bits.join(', ')})` : '';
    showToast(`Start of Day recorded for ${dayDate}.${extra} History retained.`);
}

function openDayEndReconcileModal() {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;
    const inv = ensureStoresInventory();
    if (!inv.daySession || inv.daySession.endedAt) {
        showToast('Start of Day first, then reconcile at day end.', 'error');
        return;
    }

    const body = document.getElementById('stockTxnModalBody');
    const title = document.getElementById('stockTxnModalTitle');
    const confirmBtn = document.getElementById('stockTxnModalConfirm');
    if (!body || !title || !confirmBtn) return;

    const category = getActiveInventoryCategory();
    title.textContent = 'Day End Stock Reconciliation';
    confirmBtn.textContent = 'Complete Day End';
    confirmBtn.dataset.mode = 'day-end';
    setStockModalDate(inv.daySession.date || todayIsoDate());
    body.innerHTML = `
        <p class="modal-help">Enter physical counts for catalog items. Variance = Physical − System. Variances post as adjustment movements (history retained). Completing day end closes the store day without wiping the ledger.</p>
        <div class="form-row">
            <div class="form-col">
                <label class="form-label">Catalog Category</label>
                <select class="form-control" id="dayEndCategory">${buildCategoryOptionsHtml(category)}</select>
            </div>
            <div class="form-col">
                <label class="form-label">Search Items</label>
                <input type="search" class="form-control" id="dayEndSearch" data-search-history="1" data-search-history-key="day-end-catalog" placeholder="Filter items..." autocomplete="off">
            </div>
        </div>
        <label class="form-label" style="display:flex;gap:8px;align-items:center;margin-bottom:8px;">
            <input type="checkbox" id="dayEndShowAll"> Show all catalog items in category (not only items with stock)
        </label>
        <div class="form-table-wrapper">
            <table class="overview-table">
                <thead>
                    <tr>
                        <th>Catalog Item</th>
                        <th>System On Hand</th>
                        <th>Physical Count</th>
                        <th>Variance</th>
                    </tr>
                </thead>
                <tbody id="dayEndItemsBody"></tbody>
            </table>
        </div>
    `;

    const refreshRows = () => {
        const cat = document.getElementById('dayEndCategory')?.value || category;
        const q = (document.getElementById('dayEndSearch')?.value || '').trim().toLowerCase();
        const showAll = !!document.getElementById('dayEndShowAll')?.checked;
        let items = typeof getCatalogItemsForCategory === 'function' ? getCatalogItemsForCategory(cat) : [];
        if (!showAll) {
            items = items.filter((item) => {
                const s = getItemStockSummary(item.id, { mode: 'cumulative' });
                return s.openingBase || s.received || s.issued || s.onHand;
            });
        }
        items = items.filter((item) => !q || item.name.toLowerCase().includes(q));
        const tbody = document.getElementById('dayEndItemsBody');
        if (!tbody) return;
        if (!items.length) {
            tbody.innerHTML = '<tr><td colspan="4">No items to reconcile in this view. Tick “Show all” or receive stock first.</td></tr>';
            return;
        }
        tbody.innerHTML = items.map((item) => {
            const sys = getItemStockSummary(item.id, { mode: 'cumulative' }).onHand;
            return `
                <tr>
                    <td>${invHtmlEscape(item.name)}</td>
                    <td><strong data-sys-close="${invHtmlEscape(item.id)}">${sys}</strong></td>
                    <td>
                        <input type="number" class="form-control day-end-count" data-item-id="${invHtmlEscape(item.id)}" min="0" step="1" value="${sys}">
                    </td>
                    <td class="day-end-variance" data-var-item="${invHtmlEscape(item.id)}">0</td>
                </tr>
            `;
        }).join('');

        tbody.querySelectorAll('.day-end-count').forEach((input) => {
            input.addEventListener('input', () => {
                const id = input.dataset.itemId;
                const sys = Number(tbody.querySelector(`[data-sys-close="${id}"]`)?.textContent) || 0;
                const physical = Number(input.value) || 0;
                const varEl = tbody.querySelector(`[data-var-item="${id}"]`);
                if (varEl) {
                    const v = physical - sys;
                    varEl.textContent = (v >= 0 ? '+' : '') + v;
                    varEl.classList.toggle('var-negative', v < 0);
                    varEl.classList.toggle('var-positive', v > 0);
                }
            });
        });
    };

    body.querySelector('#dayEndCategory')?.addEventListener('change', refreshRows);
    body.querySelector('#dayEndSearch')?.addEventListener('input', refreshRows);
    body.querySelector('#dayEndShowAll')?.addEventListener('change', refreshRows);
    if (typeof bindSearchHistory === 'function') {
        const searchEl = document.getElementById('dayEndSearch');
        if (searchEl) {
            bindSearchHistory(searchEl);
            searchEl.addEventListener('search-history-commit', refreshRows);
            searchEl.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    if (typeof rememberSearchTerm === 'function') rememberSearchTerm(searchEl, searchEl.value);
                    refreshRows();
                }
            });
        }
    }
    refreshRows();
    openStockTxnModal();
}

function completeDayEndReconcile() {
    const inv = ensureStoresInventory();
    if (!inv.daySession || inv.daySession.endedAt) {
        showToast('No open store day to close.', 'error');
        return;
    }

    const dayDate = inv.daySession.date || getStockModalDate();
    const physicalCounts = {};
    const systemClosing = {};
    const variances = {};
    let hasShort = false;
    let adjCount = 0;

    getTrackedItemIds().forEach((itemId) => {
        const sys = getItemStockSummary(itemId, { mode: 'cumulative' }).onHand;
        systemClosing[itemId] = sys;
        physicalCounts[itemId] = sys;
        variances[itemId] = 0;
    });

    document.querySelectorAll('.day-end-count[data-item-id]').forEach((input) => {
        const itemId = input.dataset.itemId;
        if (!itemId) return;
        const sys = getItemStockSummary(itemId, { mode: 'cumulative' }).onHand;
        const physical = Number(input.value);
        const count = Number.isFinite(physical) ? physical : sys;
        physicalCounts[itemId] = count;
        systemClosing[itemId] = sys;
        variances[itemId] = count - sys;
        if (count < sys) hasShort = true;

        const delta = count - sys;
        if (delta !== 0) {
            const catalog = typeof getCatalogItemById === 'function' ? getCatalogItemById(itemId) : null;
            const posted = postStockTransaction({
                type: delta > 0 ? 'receipt' : 'issue',
                itemId,
                item: catalog?.name || itemId,
                category: catalog?.category,
                gl: catalog?.gl,
                qty: Math.abs(delta),
                date: dayDate,
                description: 'Day End physical variance adjustment',
                source: 'day-end-adj',
                sourceRef: `EOD-${dayDate}-${itemId}`,
                silent: true,
                skipRender: true,
                allowAdhoc: !catalog
            });
            if (posted) adjCount += 1;
        }
    });

    const dayTxns = (inv.transactions || []).filter((t) => (t.date || '') === dayDate);
    const closedSession = {
        ...inv.daySession,
        endedAt: new Date().toISOString(),
        endedBy: currentUser?.name || currentUser?.username || 'Storeman',
        physicalCounts,
        systemClosing,
        variances,
        transactionsSnapshot: dayTxns
    };
    inv.dayHistory = [...(inv.dayHistory || []), closedSession].slice(-60);
    inv.daySession = null;
    // Perpetual ledger: do not clear transactions or rewrite openings

    saveState();
    closeStockTxnModal();
    renderVoucherInventoryTables();
    if (typeof updateSystemAlerts === 'function') updateSystemAlerts();
    if (typeof updateDashboard === 'function') updateDashboard();

    const adjNote = adjCount ? ` ${adjCount} variance adjustment${adjCount === 1 ? '' : 's'} posted.` : '';
    showToast(`Day end complete. Ledger history retained.${adjNote}`);
    if (hasShort) {
        showToast('ALERT: One or more items counted below system stock.', 'error');
    }
}

function buildCategoryOptionsHtml(selected) {
    return (VOUCHER_INVENTORY_CATEGORIES || []).map((cat) => {
        const sel = cat.key === selected ? ' selected' : '';
        return `<option value="${cat.key}"${sel}>${invHtmlEscape(cat.label)}</option>`;
    }).join('');
}

function buildGlOptionsHtml(selected) {
    const value = selected || '2200600002';
    return Object.entries(GL_ACCOUNTS).map(([code, info]) => {
        const sel = code === value ? ' selected' : '';
        return `<option value="${code}"${sel}>${code} - ${invHtmlEscape(info.name)}</option>`;
    }).join('');
}

function openReceiveIssueModal(type) {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;

    const isReceipt = type === 'receipt';
    const title = document.getElementById('stockTxnModalTitle');
    const body = document.getElementById('stockTxnModalBody');
    const confirmBtn = document.getElementById('stockTxnModalConfirm');
    if (!title || !body || !confirmBtn) return;

    const category = getActiveInventoryCategory();
    const section = (VOUCHER_INVENTORY_CATEGORIES || []).find((c) => c.key === category);
    const defaultGl = section?.gl || '2200600002';

    title.textContent = isReceipt ? 'Receive Stock (Increase Inventory)' : 'Issue Stock (Deplete Inventory)';
    confirmBtn.textContent = isReceipt ? 'Confirm Receive' : 'Confirm Issue';
    confirmBtn.dataset.mode = isReceipt ? 'receipt' : 'issue';
    setStockModalDate(todayIsoDate());

    const licenceStartDefault = todayIsoDate();
    const licenceExpiryDefault = computeLicenceExpiryFromStart(licenceStartDefault, '1m');

    body.innerHTML = `
        <p class="modal-help" id="stockTxnHelpText">
            ${isReceipt
                ? 'Choose or <strong>type</strong> a catalog item to receive from a supplier. This increases that item’s stock.'
                : 'Choose or <strong>type</strong> a catalog item to issue to a user. This depletes that item’s stock.'}
            If the name is not in the list, it is saved to this category when you confirm.
        </p>
        <div class="form-row">
            <div class="form-col">
                <label class="form-label">Catalog Category</label>
                <select class="form-control" id="stockTxnCategory">${buildCategoryOptionsHtml(category)}</select>
            </div>
            <div class="form-col">
                <label class="form-label" for="stockTxnItemName">Catalog Item</label>
                <input type="text" class="form-control" id="stockTxnItemName" list="stockTxnItemDatalist"
                    placeholder="Type to search or enter a new item…" autocomplete="off" spellcheck="false">
                <input type="hidden" id="stockTxnItemId" value="">
                <datalist id="stockTxnItemDatalist"></datalist>
                <p class="modal-help stock-txn-item-status" id="stockTxnItemStatus" style="margin:6px 0 0;"></p>
            </div>
        </div>
        <div class="stock-add-catalog-box" id="stockTxnNatureBox" hidden>
            <div class="stock-add-catalog-panel" id="stockTxnAddItemPanel">
                <div class="form-row">
                    <div class="form-col" id="stockTxnNewItemNatureWrap" style="flex:1.2;">
                        <label class="form-label" for="stockTxnNewItemNature">Nature of use (new software)</label>
                        <select class="form-control" id="stockTxnNewItemNature">
                            ${typeof buildSoftwareUseNatureOptionsHtml === 'function'
                                ? buildSoftwareUseNatureOptionsHtml('other')
                                : '<option value="other">Other Software</option>'}
                        </select>
                    </div>
                </div>
            </div>
        </div>
        <div class="form-row">
            <div class="form-col">
                <label class="form-label" id="stockTxnQtyLabel">Quantity</label>
                <input type="number" class="form-control" id="stockTxnQty" min="1" step="1" value="1">
            </div>
            <div class="form-col"></div>
        </div>
        <div class="stock-licence-panel" id="stockTxnLicencePanel" hidden>
            <div class="stock-licence-panel-head">
                <strong>Software licence (expended)</strong>
                <span>Bought online · not held as stock · track renewal date</span>
            </div>
            <div class="form-row">
                <div class="form-col">
                    <label class="form-label" for="stockTxnLicenceTerm">Licence package</label>
                    <select class="form-control" id="stockTxnLicenceTerm">
                        ${LICENCE_PACKAGE_TERMS.map((t) =>
                            `<option value="${t.value}"${t.value === '1m' ? ' selected' : ''}>${invHtmlEscape(t.label)}</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="form-col">
                    <label class="form-label" for="stockTxnLicenceStart">Licence Day 1 (start)</label>
                    <input type="date" class="form-control" id="stockTxnLicenceStart" value="${licenceStartDefault}">
                </div>
                <div class="form-col">
                    <label class="form-label" for="stockTxnLicenceExpiry">Licence last day (expiry)</label>
                    <input type="date" class="form-control" id="stockTxnLicenceExpiry" value="${licenceExpiryDefault}" title="Auto-filled from Day 1 + package; you may adjust">
                </div>
            </div>
            <div class="form-row">
                <div class="form-col">
                    <label class="form-label" for="stockTxnPaymentMethod">Payment method</label>
                    <select class="form-control" id="stockTxnPaymentMethod">
                        <option value="Mastercard" selected>Mastercard (online)</option>
                        <option value="Visa">Visa (online)</option>
                        <option value="Bank transfer">Bank transfer</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
                <div class="form-col">
                    <label class="form-label" for="stockTxnLicenceVendor">Vendor / storefront</label>
                    <input type="text" class="form-control" id="stockTxnLicenceVendor" placeholder="e.g. Anthropic · Microsoft · Adobe">
                </div>
            </div>
            <p class="stock-licence-hint" id="stockTxnLicenceHint">
                Example: Day 1 = 7 Jul 2026 · Monthly → expires 7 Aug 2026. System alerts <strong>5 days before</strong> renewal.
            </p>
        </div>
        <div class="form-row">
            <div class="form-col">
                <label class="form-label">Description / Remarks</label>
                <input type="text" class="form-control" id="stockTxnDesc" placeholder="Optional details">
            </div>
            <div class="form-col">
                <label class="form-label">Unit of Measure</label>
                <input type="text" class="form-control" id="stockTxnUom" value="EA">
            </div>
        </div>
        <div class="form-row">
            <div class="form-col">
                <label class="form-label">GL Account</label>
                <select class="form-control" id="stockTxnGl">${buildGlOptionsHtml(defaultGl)}</select>
            </div>
            <div class="form-col">
                <label class="form-label">${isReceipt ? 'RV No.' : 'IV No.'}</label>
                <input type="text" class="form-control" id="stockTxnVoucherNo">
            </div>
        </div>
        <div class="form-group">
            <label class="form-label" id="stockTxnPartyLabel">${isReceipt ? 'Received From / Supplier' : 'Issued To'}</label>
            <input type="text" class="form-control" id="stockTxnParty" placeholder="${isReceipt ? 'Supplier / consignor' : 'Unit / person'}">
        </div>
        <div class="stock-onhand-hint" id="stockTxnOnHandHint">Select a catalog item to see on-hand quantity.</div>
    `;

    const syncLicenceExpiry = () => {
        const start = document.getElementById('stockTxnLicenceStart')?.value;
        const term = document.getElementById('stockTxnLicenceTerm')?.value || '1m';
        const expiryEl = document.getElementById('stockTxnLicenceExpiry');
        const hint = document.getElementById('stockTxnLicenceHint');
        if (!start || !expiryEl) return;
        const expiry = computeLicenceExpiryFromStart(start, term);
        if (expiry) expiryEl.value = expiry;
        if (hint) {
            const meta = getLicencePackageMeta(term);
            hint.innerHTML = `Day 1 <strong>${invHtmlEscape(formatLicenceDateShort(start))}</strong> · ${invHtmlEscape(meta.label)} → expires <strong>${invHtmlEscape(formatLicenceDateShort(expiry))}</strong>. Alert <strong>5 days before</strong> renewal.`;
        }
    };

    const syncSoftwareLicenceUi = () => {
        const cat = document.getElementById('stockTxnCategory')?.value || category;
        const gl = document.getElementById('stockTxnGl')?.value || '';
        const itemId = document.getElementById('stockTxnItemId')?.value || '';
        const isSw = isReceipt && isSoftwareLicenceCategory(cat, gl, itemId);
        const panel = document.getElementById('stockTxnLicencePanel');
        if (panel) panel.hidden = !isSw;
        const help = document.getElementById('stockTxnHelpText');
        const qtyLabel = document.getElementById('stockTxnQtyLabel');
        const partyLabel = document.getElementById('stockTxnPartyLabel');
        const party = document.getElementById('stockTxnParty');
        if (isSw) {
            if (title) title.textContent = 'Purchase Software Licence (Expended)';
            if (confirmBtn) confirmBtn.textContent = 'Confirm Licence Purchase';
            if (help) {
                hintSoftwareHelp(help);
            }
            if (qtyLabel) qtyLabel.textContent = 'Seats / licences';
            if (partyLabel) partyLabel.textContent = 'Vendor (optional — or use Vendor field above)';
            if (party && !party.placeholder.includes('Anthropic')) {
                party.placeholder = 'Online vendor / account';
            }
            const vendorEl = document.getElementById('stockTxnLicenceVendor');
            if (vendorEl && !vendorEl.value) {
                const itemName = document.getElementById('stockTxnItemName')?.value || '';
                if (/claude/i.test(itemName)) vendorEl.value = 'Anthropic';
                else if (/microsoft|office|365|windows/i.test(itemName)) vendorEl.value = 'Microsoft';
                else if (/adobe/i.test(itemName)) vendorEl.value = 'Adobe';
                else if (/kaspersky/i.test(itemName)) vendorEl.value = 'Kaspersky';
            }
            syncLicenceExpiry();
        } else if (isReceipt) {
            if (title) title.textContent = 'Receive Stock (Increase Inventory)';
            if (confirmBtn) confirmBtn.textContent = 'Confirm Receive';
            if (help) {
                help.innerHTML = 'Choose or <strong>type</strong> a catalog item to receive. New names are saved to this category on confirm.';
            }
            if (qtyLabel) qtyLabel.textContent = 'Quantity';
            if (partyLabel) partyLabel.textContent = 'Received From / Supplier';
            if (party) party.placeholder = 'Supplier / consignor';
        }
    };

    function hintSoftwareHelp(helpEl) {
        helpEl.innerHTML = 'Software licences bought online (e.g. Mastercard) are <strong>expended on purchase</strong> — not held as stock on hand. Enter <strong>Licence Day 1</strong>; the system auto-fills the last day from the package (1 month / 1 year) and raises a renewal alert <strong>5 days before</strong> renewal.';
    }

    const syncTypedCatalogItem = () => {
        const cat = document.getElementById('stockTxnCategory')?.value || category;
        const nameEl = document.getElementById('stockTxnItemName');
        const idEl = document.getElementById('stockTxnItemId');
        const statusEl = document.getElementById('stockTxnItemStatus');
        const natureBox = document.getElementById('stockTxnNatureBox');
        const typed = (nameEl?.value || '').trim();
        if (!idEl) return null;

        if (!typed) {
            idEl.value = '';
            if (statusEl) statusEl.textContent = '';
            if (natureBox) natureBox.hidden = true;
            return null;
        }

        const items = typeof getCatalogItemsForCategory === 'function' ? getCatalogItemsForCategory(cat) : [];
        const exact = items.find((i) => String(i.name || '').toLowerCase() === typed.toLowerCase());
        const starts = !exact
            ? items.find((i) => String(i.name || '').toLowerCase().startsWith(typed.toLowerCase()))
            : null;
        const match = exact || (starts && items.filter((i) => String(i.name || '').toLowerCase().startsWith(typed.toLowerCase())).length === 1 ? starts : null);

        if (match) {
            idEl.value = match.id;
            if (exact && nameEl && nameEl.value !== match.name) {
                // keep user typing; only normalize when exact match selected from list
            }
            if (statusEl) {
                statusEl.innerHTML = match.custom
                    ? `Matched custom item <strong>${invHtmlEscape(match.name)}</strong>`
                    : `Matched catalog item <strong>${invHtmlEscape(match.name)}</strong>`;
            }
            if (natureBox) natureBox.hidden = true;
            return match;
        }

        idEl.value = '';
        const isSoft = typeof isSoftwareCatalogCategory === 'function' && isSoftwareCatalogCategory(cat);
        if (natureBox) natureBox.hidden = !isSoft;
        if (isSoft && typeof classifySoftwareUseNature === 'function') {
            const natureEl = document.getElementById('stockTxnNewItemNature');
            if (natureEl) natureEl.value = classifySoftwareUseNature(typed);
        }
        if (statusEl) {
            statusEl.innerHTML = `New item — will be saved under this category as <strong>${invHtmlEscape(typed)}</strong>`;
        }
        return null;
    };

    const refreshHint = () => {
        const itemId = document.getElementById('stockTxnItemId')?.value;
        const typed = (document.getElementById('stockTxnItemName')?.value || '').trim();
        const hint = document.getElementById('stockTxnOnHandHint');
        if (!hint) return;
        const cat = document.getElementById('stockTxnCategory')?.value || category;
        const gl = document.getElementById('stockTxnGl')?.value || '';
        if (isReceipt && isSoftwareLicenceCategory(cat, gl, itemId)) {
            const start = document.getElementById('stockTxnLicenceStart')?.value;
            const expiry = document.getElementById('stockTxnLicenceExpiry')?.value;
            const term = getLicencePackageMeta(document.getElementById('stockTxnLicenceTerm')?.value || '1m');
            hint.innerHTML = (itemId || typed)
                ? `Licence will be <strong>expended</strong> (On Hand unchanged). ${invHtmlEscape(term.label)}: <strong>${invHtmlEscape(formatLicenceDateShort(start))}</strong> → <strong>${invHtmlEscape(formatLicenceDateShort(expiry))}</strong>.`
                : 'Type a software catalogue item, then set Licence Day 1 and package.';
            return;
        }
        if (!itemId) {
            hint.textContent = typed
                ? 'New catalog item — on-hand starts from this transaction.'
                : 'Type or pick a catalog item to see on-hand quantity.';
            return;
        }
        const sum = getItemStockSummary(itemId);
        hint.innerHTML = `On hand for <strong>${invHtmlEscape(sum.item)}</strong>: <strong>${sum.onHand}</strong>`;
    };

    const refillItems = (preferSelectId) => {
        const cat = document.getElementById('stockTxnCategory')?.value || category;
        const list = document.getElementById('stockTxnItemDatalist');
        const nameEl = document.getElementById('stockTxnItemName');
        const idEl = document.getElementById('stockTxnItemId');
        let items = typeof getCatalogItemsForCategory === 'function' ? getCatalogItemsForCategory(cat) : [];
        if (list) {
            list.innerHTML = items.map((item) =>
                `<option value="${invHtmlEscape(item.name)}"></option>`
            ).join('');
        }
        if (preferSelectId && idEl && nameEl) {
            const hit = items.find((i) => i.id === preferSelectId);
            if (hit) {
                idEl.value = hit.id;
                nameEl.value = hit.name;
            }
        }
        const meta = (VOUCHER_INVENTORY_CATEGORIES || []).find((c) => c.key === cat);
        const glEl = document.getElementById('stockTxnGl');
        if (glEl && meta?.gl) glEl.value = meta.gl;
        syncTypedCatalogItem();
        syncSoftwareLicenceUi();
        refreshHint();
    };

    body.querySelector('#stockTxnCategory')?.addEventListener('change', () => {
        const nameEl = document.getElementById('stockTxnItemName');
        const idEl = document.getElementById('stockTxnItemId');
        if (nameEl) nameEl.value = '';
        if (idEl) idEl.value = '';
        refillItems();
    });
    body.querySelector('#stockTxnItemName')?.addEventListener('input', () => {
        syncTypedCatalogItem();
        syncSoftwareLicenceUi();
        refreshHint();
        // Suggest vendor from typed software name
        const vendorEl = document.getElementById('stockTxnLicenceVendor');
        const itemName = document.getElementById('stockTxnItemName')?.value || '';
        if (vendorEl && !vendorEl.value) {
            if (/claude/i.test(itemName)) vendorEl.value = 'Anthropic';
            else if (/microsoft|office|365|windows/i.test(itemName)) vendorEl.value = 'Microsoft';
            else if (/adobe/i.test(itemName)) vendorEl.value = 'Adobe';
            else if (/kaspersky/i.test(itemName)) vendorEl.value = 'Kaspersky';
        }
    });
    body.querySelector('#stockTxnItemName')?.addEventListener('change', () => {
        syncTypedCatalogItem();
        syncSoftwareLicenceUi();
        refreshHint();
    });
    body.querySelector('#stockTxnGl')?.addEventListener('change', () => {
        syncSoftwareLicenceUi();
        refreshHint();
    });
    body.querySelector('#stockTxnLicenceTerm')?.addEventListener('change', () => {
        syncLicenceExpiry();
        refreshHint();
    });
    body.querySelector('#stockTxnLicenceStart')?.addEventListener('change', () => {
        syncLicenceExpiry();
        refreshHint();
    });
    body.querySelector('#stockTxnLicenceExpiry')?.addEventListener('change', refreshHint);
    refillItems();
    syncSoftwareLicenceUi();

    openStockTxnModal();
    setTimeout(() => document.getElementById('stockTxnItemName')?.focus(), 50);
}

function confirmStockTxnModal() {
    const confirmBtn = document.getElementById('stockTxnModalConfirm');
    const mode = confirmBtn?.dataset.mode;
    if (mode === 'day-start') {
        completeStartOfDay();
        return;
    }
    if (mode === 'day-end') {
        completeDayEndReconcile();
        return;
    }
    if (mode === 'add-inventory-ledger') {
        if (typeof confirmAddInventoryLedgerFromModal === 'function') confirmAddInventoryLedgerFromModal();
        return;
    }
    if (mode !== 'receipt' && mode !== 'issue') return;

    let itemId = document.getElementById('stockTxnItemId')?.value || '';
    let catalogItem = typeof getCatalogItemById === 'function' ? getCatalogItemById(itemId) : null;
    const typedName = (document.getElementById('stockTxnItemName')?.value || '').trim();
    const category = document.getElementById('stockTxnCategory')?.value || catalogItem?.category || '';
    const gl = document.getElementById('stockTxnGl')?.value || catalogItem?.gl || '';

    if (!itemId && typedName) {
        if (typeof addCustomCatalogItem !== 'function') {
            showToast('Select a catalog item from the list.', 'error');
            document.getElementById('stockTxnItemName')?.focus();
            return;
        }
        const useNature = document.getElementById('stockTxnNewItemNature')?.value || '';
        const created = addCustomCatalogItem({ name: typedName, category, gl, useNature });
        if (!created) {
            document.getElementById('stockTxnItemName')?.focus();
            return;
        }
        itemId = created.id;
        catalogItem = typeof getCatalogItemById === 'function' ? getCatalogItemById(itemId) : created;
        const idEl = document.getElementById('stockTxnItemId');
        if (idEl) idEl.value = itemId;
    }

    if (!itemId) {
        showToast('Type or select a catalog item.', 'error');
        document.getElementById('stockTxnItemName')?.focus();
        return;
    }

    const isLicencePurchase = mode === 'receipt' && isSoftwareLicenceCategory(category, gl, itemId);

    const licenceStart = document.getElementById('stockTxnLicenceStart')?.value || '';
    const licenceExpiry = document.getElementById('stockTxnLicenceExpiry')?.value || '';
    const licenceTerm = document.getElementById('stockTxnLicenceTerm')?.value || '1m';
    const paymentMethod = document.getElementById('stockTxnPaymentMethod')?.value || 'Mastercard';
    const licenceVendor = (document.getElementById('stockTxnLicenceVendor')?.value || '').trim();

    if (isLicencePurchase) {
        if (!licenceStart) {
            showToast('Enter Licence Day 1 (start date).', 'error');
            document.getElementById('stockTxnLicenceStart')?.focus();
            return;
        }
        let expiry = licenceExpiry || computeLicenceExpiryFromStart(licenceStart, licenceTerm);
        if (!expiry) {
            showToast('Could not calculate licence expiry. Check Day 1 and package.', 'error');
            return;
        }
        if (expiry <= licenceStart) {
            showToast('Licence last day must be after Day 1.', 'error');
            return;
        }
        // Keep expiry field in sync if user left it blank
        const expiryEl = document.getElementById('stockTxnLicenceExpiry');
        if (expiryEl && !expiryEl.value) expiryEl.value = expiry;
    }

    const party = document.getElementById('stockTxnParty')?.value || '';
    const descParts = [
        document.getElementById('stockTxnDesc')?.value || '',
        isLicencePurchase ? `${getLicencePackageMeta(licenceTerm).label} · ${paymentMethod}` : ''
    ].filter(Boolean);

    const payload = {
        type: mode,
        date: getStockModalDate(),
        itemId,
        category,
        item: catalogItem?.name || typedName || '',
        description: descParts.join(' · '),
        qty: document.getElementById('stockTxnQty')?.value,
        uom: document.getElementById('stockTxnUom')?.value || 'EA',
        gl,
        voucherNo: document.getElementById('stockTxnVoucherNo')?.value || '',
        party: licenceVendor || party,
        licenceTerm: isLicencePurchase ? licenceTerm : '',
        licenceStart: isLicencePurchase ? licenceStart : '',
        licenceExpiry: isLicencePurchase ? (licenceExpiry || computeLicenceExpiryFromStart(licenceStart, licenceTerm)) : '',
        paymentMethod: isLicencePurchase ? paymentMethod : '',
        expendedLicence: isLicencePurchase,
        skipRender: isLicencePurchase
    };

    const txn = postStockTransaction(payload);
    if (!txn) return;

    if (isLicencePurchase) {
        // Expend immediately: buy = issue (not held as stock on hand)
        const issueTxn = postStockTransaction({
            type: 'issue',
            date: payload.date,
            itemId: txn.itemId,
            category: txn.category,
            item: txn.item,
            description: `Licence expended · renews ${formatLicenceDateShort(payload.licenceExpiry)}`,
            qty: txn.qty,
            uom: txn.uom,
            gl: txn.gl,
            voucherNo: txn.voucherNo,
            party: txn.party || 'IT Dir (online)',
            source: 'licence-expend',
            sourceRef: txn.id,
            silent: true,
            skipRender: true
        });

        // Attach licence metadata on the receipt txn for audit
        const inv = ensureStoresInventory();
        const receipt = inv.transactions.find((t) => t.id === txn.id);
        if (receipt) {
            receipt.licenceTerm = payload.licenceTerm;
            receipt.licenceStart = payload.licenceStart;
            receipt.licenceExpiry = payload.licenceExpiry;
            receipt.paymentMethod = payload.paymentMethod;
            receipt.expendedLicence = true;
        }
        if (issueTxn) {
            const issue = inv.transactions.find((t) => t.id === issueTxn.id);
            if (issue) {
                issue.licenceExpiry = payload.licenceExpiry;
                issue.expendedLicence = true;
            }
        }
        saveState();

        const lic = registerSoftwareLicenceFromPurchase({
            itemName: txn.item,
            qty: txn.qty,
            licenceStart: payload.licenceStart,
            licenceExpiry: payload.licenceExpiry,
            licenceTerm: payload.licenceTerm,
            paymentMethod: payload.paymentMethod,
            vendor: txn.party,
            gl: txn.gl,
            voucherNo: txn.voucherNo,
            description: payload.description
        });

        if (typeof renderVoucherInventoryTables === 'function') renderVoucherInventoryTables();
        if (typeof renderIctAccountabilityTable === 'function') renderIctAccountabilityTable();
        if (typeof updateSystemAlerts === 'function') updateSystemAlerts();
        if (typeof updateDashboard === 'function') updateDashboard();

        if (lic) {
            showToast(
                `${txn.item}: licence ${formatLicenceDateShort(payload.licenceStart)} → ${formatLicenceDateShort(payload.licenceExpiry)} recorded. Expended (not on hand). Renewal alert 5 days before expiry.`
            );
        } else {
            showToast(`${txn.item} purchase posted and expended. Could not save renewal register — check Asset Register.`, 'error');
        }
    }

    closeStockTxnModal();
}

function openStockTxnModal() {
    const modal = document.getElementById('stockTxnModal');
    if (!modal) return;
    resetStockModalWindowState();
    if (!document.getElementById('stockTxnModalDate')?.value) {
        setStockModalDate(todayIsoDate());
    }
    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
}

function closeStockTxnModal() {
    const modal = document.getElementById('stockTxnModal');
    if (!modal) return;
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
    resetStockModalWindowState();
}

function syncOpeningInputsFromState() {
    document.querySelectorAll('.voucher-inv-opening').forEach((input) => {
        const key = input.dataset.invCat;
        if (key == null) return;
        input.value = getCategoryStockSummary(key).opening;
    });
}

function updateInventoryViewChrome() {
    const mode = getInventoryBalanceView();
    const focusDate = getInventoryFocusDate();
    const isDaily = mode === 'daily';

    document.querySelectorAll('[data-inv-view-btn]').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.invViewBtn === mode);
    });

    const dateWrap = document.getElementById('inventoryFocusDateWrap');
    if (dateWrap) dateWrap.hidden = !isDaily;

    const dateInput = document.getElementById('inventoryFocusDate');
    if (dateInput && !dateInput.value) dateInput.value = focusDate;

    const hint = document.getElementById('inventoryViewHint');
    if (hint) {
        hint.textContent = isDaily
            ? `Daily view · ${focusDate} — Opening is stock at start of day; Received/Issued are that day’s movements. On Hand = Opening + Received − Issued.`
            : 'Cumulative view — Opening is perpetual take-on (admin-editable); Received/Issued are all-time movements. On Hand = Opening + Received − Issued.';
    }

    document.querySelectorAll('[data-inv-opening-label]').forEach((el) => {
        el.textContent = isDaily ? 'Day Opening Total' : 'Opening Total';
    });
    document.querySelectorAll('[data-inv-metric-label="received"]').forEach((el) => {
        el.textContent = isDaily ? 'Received (day)' : 'Received (all)';
    });
    document.querySelectorAll('[data-inv-metric-label="issued"]').forEach((el) => {
        el.textContent = isDaily ? 'Issued (day)' : 'Issued (all)';
    });
    document.querySelectorAll('[data-inv-metric-label="onhand"]').forEach((el) => {
        el.textContent = isDaily ? 'On Hand (day)' : 'On Hand';
    });
    document.querySelectorAll('[data-inv-items-title]').forEach((el) => {
        el.textContent = isDaily ? 'Item Stock Balances (Daily)' : 'Item Stock Balances (Cumulative)';
    });
    document.querySelectorAll('[data-inv-movements-title]').forEach((el) => {
        el.textContent = isDaily ? 'Receive / Issue Movements (Daily)' : 'Receive / Issue Movements (All time)';
    });
    document.querySelectorAll('.voucher-inv-th-opening').forEach((el) => {
        el.textContent = isDaily ? 'Day Opening' : 'Opening';
    });
}

function updateDaySessionBanner() {
    const el = document.getElementById('storeDaySessionBanner');
    if (!el) return;
    const session = ensureStoresInventory().daySession;
    if (!session) {
        el.className = 'store-day-banner store-day-banner-warn';
        el.innerHTML = '<strong>Day not started.</strong> Tap <em>Start of Day</em> to lock opening stocks before receiving or issuing.';
        return;
    }
    if (session.endedAt) {
        el.className = 'store-day-banner';
        el.textContent = 'No active store day.';
        return;
    }
    el.className = 'store-day-banner store-day-banner-ok';
    el.innerHTML = `<strong>Store day open:</strong> ${invHtmlEscape(session.date)} · started by ${invHtmlEscape(session.startedBy || '—')} · openings locked · ledger history retained`;
}

function buildVoucherInventorySection() {
    const host = document.getElementById('voucherInventorySection');
    if (!host) return;
    if (host.dataset.built === '1' && host.dataset.invUi === '3') {
        const tabCount = host.querySelectorAll('.voucher-inv-tab').length;
        if (tabCount === (VOUCHER_INVENTORY_CATEGORIES || []).length) return;
        host.dataset.built = '0';
        host.innerHTML = '';
    } else if (host.dataset.built === '1') {
        host.dataset.built = '0';
        host.innerHTML = '';
    }

    const focusDate = getInventoryFocusDate();
    const tabs = VOUCHER_INVENTORY_CATEGORIES.map((cat, i) => `
        <button type="button" class="voucher-inv-tab${i === 0 ? ' active' : ''}" data-inv-tab="${cat.key}" title="${invHtmlEscape(cat.fullLabel || cat.label)}">
            ${invHtmlEscape(cat.label)}
            <span class="voucher-inv-tab-count" data-inv-count="${cat.key}">0</span>
        </button>
    `).join('');

    const panels = VOUCHER_INVENTORY_CATEGORIES.map((cat, i) => `
        <div class="voucher-inv-panel${i === 0 ? ' active' : ''}" data-inv-panel="${cat.key}" ${i === 0 ? '' : 'hidden'}>
            <div class="voucher-inv-panel-head">
                <div>
                    <h4>${invHtmlEscape(cat.fullLabel || cat.label)}</h4>
                    <p>${invHtmlEscape(cat.detail)}${cat.gl ? ` · Charge GL ${invHtmlEscape(cat.gl)} (procurement only)` : ''}</p>
                </div>
                <div class="voucher-inv-opening-wrap">
                    <label data-inv-opening-label>Day Opening Total</label>
                    <input type="number" class="form-control voucher-inv-opening" data-inv-cat="${cat.key}" min="0" step="1" value="0" readonly title="Sum of item openings for current view">
                </div>
            </div>
            <div class="voucher-inv-metrics">
                <div><span data-inv-metric-label="received">Received (day)</span><strong class="inv-received" data-inv-received="${cat.key}">0</strong></div>
                <div><span data-inv-metric-label="issued">Issued (day)</span><strong class="inv-issued" data-inv-issued="${cat.key}">0</strong></div>
                <div><span data-inv-metric-label="onhand">On Hand (day)</span><strong class="inv-onhand" data-inv-onhand="${cat.key}">0</strong></div>
            </div>

            <h5 class="voucher-inv-subtitle" data-inv-items-title>Item Stock Balances (Daily)</h5>
            <div class="module-toolbar">
                <input type="search" class="form-control table-search" data-search-target="voucher-inv-items-${cat.key}" placeholder="Search catalog items...">
                <button type="button" class="btn btn-primary btn-sm btn-table-search">Search</button>
                <button type="button" class="btn btn-ghost btn-sm btn-table-search-clear">Clear</button>
            </div>
            <div class="form-table-wrapper">
                <table class="overview-table voucher-inv-table">
                    <thead>
                        <tr>
                            <th>Catalog Item</th>
                            <th class="voucher-inv-th-opening">Day Opening</th>
                            <th>Received</th>
                            <th>Issued</th>
                            <th>On Hand</th>
                        </tr>
                    </thead>
                    <tbody id="voucher-inv-items-${cat.key}" data-inventory-view="1"></tbody>
                </table>
            </div>

            <h5 class="voucher-inv-subtitle" data-inv-movements-title>Receive / Issue Movements (Daily)</h5>
            <div class="module-toolbar">
                <input type="search" class="form-control table-search" data-search-target="voucher-inv-body-${cat.key}" placeholder="Search movements...">
                <button type="button" class="btn btn-primary btn-sm btn-table-search">Search</button>
                <button type="button" class="btn btn-ghost btn-sm btn-table-search-clear">Clear</button>
            </div>
            <div class="form-table-wrapper">
                <table class="overview-table voucher-inv-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Date</th>
                            <th>Type</th>
                            <th>Item</th>
                            <th>Description</th>
                            <th>Qty</th>
                            <th>UoM</th>
                            <th>GL</th>
                            <th>RV/IV No.</th>
                            <th>Party</th>
                            <th>By</th>
                        </tr>
                    </thead>
                    <tbody id="voucher-inv-body-${cat.key}" data-inventory-view="1"></tbody>
                </table>
            </div>
        </div>
    `).join('');

    host.innerHTML = `
        <div class="section-heading">
            <div>
                <h3>Stores Inventory Control</h3>
                <p>Standalone inventory ledgers (separate from GL Portfolio) · Form 1033 receive/issue · Start of Day / Day End · Daily &amp; cumulative balances</p>
            </div>
        </div>

        <div class="store-stock-actions" role="group" aria-label="Stock actions">
            <button type="button" class="btn btn-success" id="btnReceiveStock">＋ Receive</button>
            <button type="button" class="btn btn-danger" id="btnIssueStock">− Issue</button>
            <button type="button" class="btn btn-primary" id="btnStartStoreDay">Start of Day</button>
            <button type="button" class="btn btn-secondary" id="btnDayEndReconcile">Day End Reconcile</button>
            <button type="button" class="btn btn-ghost" id="btnAddInventoryLedger">＋ Add Inventory Ledger</button>
            <button type="button" class="btn btn-secondary btn-generate-report" id="btnInventoryReport" data-report-module="stores-inventory">Generate Inventory Report</button>
            <button type="button" class="btn btn-ghost btn-sm" id="refreshVoucherInventoryBtn">Refresh</button>
        </div>

        <div class="inv-balance-toolbar" role="group" aria-label="Balance view">
            <div class="inv-balance-view-toggle">
                <button type="button" class="btn btn-sm" data-inv-view-btn="daily">Daily</button>
                <button type="button" class="btn btn-sm" data-inv-view-btn="cumulative">Cumulative</button>
            </div>
            <div class="inv-focus-date-wrap" id="inventoryFocusDateWrap">
                <label for="inventoryFocusDate">Focus date</label>
                <input type="date" class="form-control" id="inventoryFocusDate" value="${invHtmlEscape(focusDate)}">
            </div>
            <p class="inv-view-hint" id="inventoryViewHint"></p>
        </div>

        <div id="storeDaySessionBanner" class="store-day-banner" aria-live="polite"></div>

        <div class="voucher-inv-tabs" id="voucherInvTabs">${tabs}</div>
        <div class="voucher-inv-panels" id="voucherInvPanels">${panels}</div>
    `;
    host.dataset.built = '1';
    host.dataset.invUi = '3';

    host.querySelectorAll('.voucher-inv-tab').forEach((tab) => {
        tab.addEventListener('click', () => {
            const key = tab.dataset.invTab;
            host.querySelectorAll('.voucher-inv-tab').forEach((t) => t.classList.toggle('active', t === tab));
            host.querySelectorAll('.voucher-inv-panel').forEach((panel) => {
                const on = panel.dataset.invPanel === key;
                panel.classList.toggle('active', on);
                panel.hidden = !on;
            });
        });
    });

    host.querySelectorAll('[data-inv-view-btn]').forEach((btn) => {
        btn.addEventListener('click', () => {
            setInventoryBalanceView(btn.dataset.invViewBtn);
            renderVoucherInventoryTables();
        });
    });
    document.getElementById('inventoryFocusDate')?.addEventListener('change', () => {
        renderVoucherInventoryTables();
    });

    document.getElementById('btnReceiveStock')?.addEventListener('click', () => openReceiveIssueModal('receipt'));
    document.getElementById('btnIssueStock')?.addEventListener('click', () => openReceiveIssueModal('issue'));
    document.getElementById('btnStartStoreDay')?.addEventListener('click', startStoreDay);
    document.getElementById('btnDayEndReconcile')?.addEventListener('click', openDayEndReconcileModal);
    document.getElementById('btnAddInventoryLedger')?.addEventListener('click', () => {
        if (typeof openAddInventoryLedgerModal === 'function') openAddInventoryLedgerModal();
    });
    document.getElementById('refreshVoucherInventoryBtn')?.addEventListener('click', () => {
        renderVoucherInventoryTables();
        showToast('Inventory refreshed.', 'info');
    });

    syncOpeningInputsFromState();
    updateInventoryViewChrome();
    if (typeof initTableSearch === 'function') initTableSearch();
}

function bindOpeningEditInputs(container) {
    if (!container || !canEditInventoryOpenings()) return;
    container.querySelectorAll('.inv-opening-input').forEach((input) => {
        if (input.dataset.bound === '1') return;
        input.dataset.bound = '1';
        const commit = () => {
            const itemId = input.dataset.itemId;
            if (!itemId) return;
            setItemOpening(itemId, input.value, 'Inline admin opening edit');
        };
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                input.blur();
            }
        });
        input.addEventListener('change', commit);
    });
}

function renderVoucherInventoryTables() {
    ensureStoresInventory();
    buildVoucherInventorySection();
    const host = document.getElementById('voucherInventorySection');
    if (!host) return;

    updateInventoryViewChrome();
    syncOpeningInputsFromState();
    updateDaySessionBanner();

    const mode = getInventoryBalanceView();
    const focusDate = getInventoryFocusDate();
    const adminOpenings = mode === 'cumulative' && canEditInventoryOpenings();

    VOUCHER_INVENTORY_CATEGORIES.forEach((cat) => {
        const summary = getCategoryStockSummary(cat.key, { mode, date: focusDate });
        const catalogItems = typeof getCatalogItemsForCategory === 'function'
            ? getCatalogItemsForCategory(cat.key)
            : [];
        const itemRows = catalogItems.map((item) => getItemStockSummary(item.id, { mode, date: focusDate }))
            .filter((row) => row.opening || row.received || row.issued || row.onHand
                || (mode === 'cumulative' && row.openingBase));

        const itemsBody = document.getElementById(`voucher-inv-items-${cat.key}`);
        const tbody = document.getElementById(`voucher-inv-body-${cat.key}`);
        const countEl = host.querySelector(`[data-inv-count="${cat.key}"]`);
        if (countEl) countEl.textContent = String(itemRows.length || summary.transactions.length);

        const onHandEl = host.querySelector(`[data-inv-onhand="${cat.key}"]`);
        if (onHandEl) {
            onHandEl.textContent = String(summary.onHand);
            onHandEl.classList.toggle('stock-depleted', summary.onHand <= 0 && (summary.opening > 0 || summary.received > 0 || summary.issued > 0));
            onHandEl.classList.toggle('stock-overdrawn', summary.onHand < 0);
        }

        if (itemsBody) {
            const isSoftwares = isSoftwareLicenceCategory(cat.key, cat.gl);
            const table = itemsBody.closest('table');
            const theadRow = table?.querySelector('thead tr');
            if (theadRow && isSoftwares) {
                theadRow.innerHTML = `
                    <th>Catalog Item</th>
                    <th>Purchases</th>
                    <th>Expended</th>
                    <th>On Hand</th>
                    <th>Licence Day 1</th>
                    <th>Renews</th>
                    <th>Days left</th>
                `;
            } else if (theadRow && !isSoftwares) {
                theadRow.innerHTML = `
                    <th>Catalog Item</th>
                    <th class="voucher-inv-th-opening">${mode === 'daily' ? 'Day Opening' : 'Opening'}</th>
                    <th>Received</th>
                    <th>Issued</th>
                    <th>On Hand</th>
                `;
            }

            if (!itemRows.length) {
                itemsBody.innerHTML = `<tr class="empty-inv-row"><td colspan="${isSoftwares ? 7 : 5}">${
                    isSoftwares
                        ? 'No software licence movements yet. Use <strong>Receive</strong> → Softwares to purchase a licence (expended; renewal date tracked).'
                        : 'No stock recorded for this catalog yet. Use <strong>Start of Day</strong> or <strong>Receive</strong>.'
                }</td></tr>`;
            } else if (isSoftwares) {
                itemsBody.innerHTML = itemRows.map((row) => {
                    const lic = findActiveSoftwareLicenceRecord(row.item);
                    const days = lic?.expiryDate && typeof ictAccDaysUntil === 'function'
                        ? ictAccDaysUntil(lic.expiryDate)
                        : null;
                    const daysText = days == null
                        ? '—'
                        : (typeof formatIctAccLicenceDaysLeft === 'function'
                            ? formatIctAccLicenceDaysLeft(days)
                            : `${days}d`);
                    const daysClass = typeof getIctAccDaysLeftClass === 'function'
                        ? getIctAccDaysLeftClass(days)
                        : '';
                    return `
                    <tr>
                        <td><strong>${invHtmlEscape(row.item)}</strong></td>
                        <td class="inv-received">${row.received}</td>
                        <td class="inv-issued">${row.issued}</td>
                        <td><strong class="${row.onHand <= 0 ? 'stock-depleted' : 'inv-onhand'}">${row.onHand}</strong>
                            <div class="inv-licence-note">Licences expended — on hand should stay 0</div></td>
                        <td>${invHtmlEscape(formatLicenceDateShort(lic?.purchaseDate || lic?.issueDate || ''))}</td>
                        <td>${invHtmlEscape(formatLicenceDateShort(lic?.expiryDate || ''))}</td>
                        <td>${days == null ? '—' : `<span class="ict-acc-days-badge ${daysClass}">${invHtmlEscape(daysText)}</span>`}</td>
                    </tr>
                `;
                }).join('');
            } else {
                itemsBody.innerHTML = itemRows.map((row) => {
                    const openingCell = adminOpenings
                        ? `<input type="number" class="form-control inv-opening-input" data-item-id="${invHtmlEscape(row.itemId)}" min="0" step="1" value="${row.openingBase}" title="Admin: edit perpetual Opening (take-on). On Hand recalculates.">`
                        : String(row.opening);
                    return `
                    <tr>
                        <td>${invHtmlEscape(row.item)}</td>
                        <td>${openingCell}</td>
                        <td class="inv-received">${row.received}</td>
                        <td class="inv-issued">${row.issued}</td>
                        <td><strong class="${row.onHand <= 0 ? 'stock-depleted' : 'inv-onhand'}">${row.onHand}</strong></td>
                    </tr>
                `;
                }).join('');
                bindOpeningEditInputs(itemsBody);
            }
        }

        if (tbody) {
            const rows = summary.transactions;
            if (!rows.length) {
                tbody.innerHTML = `<tr class="empty-inv-row"><td colspan="11">No receive/issue movements yet for ${invHtmlEscape(cat.label)}${mode === 'daily' ? ` on ${invHtmlEscape(focusDate)}` : ''}.</td></tr>`;
            } else {
                tbody.innerHTML = rows.map((txn, idx) => {
                    const isReceipt = txn.type === 'receipt';
                    const src = txn.source && txn.source !== 'manual'
                        ? ` <span class="txn-source">(${invHtmlEscape(txn.source)})</span>`
                        : '';
                    return `
                        <tr>
                            <td>${idx + 1}</td>
                            <td>${invHtmlEscape(txn.date || '—')}</td>
                            <td><span class="txn-badge ${isReceipt ? 'txn-receipt' : 'txn-issue'}">${isReceipt ? 'Receive' : 'Issue'}</span>${src}</td>
                            <td>${invHtmlEscape(txn.item)}</td>
                            <td>${invHtmlEscape(txn.description || '—')}</td>
                            <td>${txn.qty || 0}</td>
                            <td>${invHtmlEscape(txn.uom || 'EA')}</td>
                            <td>${invHtmlEscape(txn.gl || '—')}</td>
                            <td>${invHtmlEscape(txn.voucherNo || '—')}</td>
                            <td>${invHtmlEscape(txn.party || '—')}</td>
                            <td>${invHtmlEscape(txn.by || '—')}</td>
                        </tr>
                    `;
                }).join('');
            }
        }

        const setMetric = (sel, value) => {
            const el = host.querySelector(sel);
            if (el) el.textContent = String(value);
        };
        setMetric(`[data-inv-received="${cat.key}"]`, summary.received);
        setMetric(`[data-inv-issued="${cat.key}"]`, summary.issued);
    });
}

function attachVoucherInventoryRowWatch(tr) {
    if (!tr || tr.dataset.invWatch === '1') return;
    tr.dataset.invWatch = '1';

    const nameInput = tr.querySelector('.voucher-item-name');
    const categorySelect = tr.querySelector('.voucher-item-category');
    nameInput?.addEventListener('blur', () => {
        if (!categorySelect) return;
        if (categorySelect.value && categorySelect.value !== 'other') return;
        const suggested = suggestVoucherInventoryCategory(nameInput.value);
        if (suggested) categorySelect.value = suggested;
    });
}

function initStockTxnModal() {
    document.getElementById('stockTxnModalClose')?.addEventListener('click', closeStockTxnModal);
    document.getElementById('stockTxnModalCancel')?.addEventListener('click', closeStockTxnModal);
    document.getElementById('stockTxnModalConfirm')?.addEventListener('click', confirmStockTxnModal);
    document.getElementById('stockTxnModalMinimize')?.addEventListener('click', minimizeStockTxnModal);
    document.getElementById('stockTxnModalMaximize')?.addEventListener('click', toggleMaximizeStockTxnModal);
    document.getElementById('stockTxnModalRestore')?.addEventListener('click', restoreStockTxnModal);
    document.getElementById('stockTxnModal')?.addEventListener('click', (e) => {
        if (e.target?.id === 'stockTxnModal' && !e.target.classList.contains('is-minimized')) {
            closeStockTxnModal();
        }
    });
    setStockModalDate(todayIsoDate());
}
