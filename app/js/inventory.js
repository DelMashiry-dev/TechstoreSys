/* inventory.js — stores inventory aggregation and dashboard panel (stock ledgers ≠ GL portfolio) */

const INVENTORY_CATEGORIES = [
    {
        gl: '6122100009',
        moduleId: 'gl-2200600002',
        key: 'consumables',
        label: 'ZOFF Inventory (Formerly IT Consumables)',
        detail: 'Office Supplies & Services — computer consumables, accessories, stationery',
        model: 'consumables',
        tbodyId: 'gl-2200600002-table-body'
    },
    {
        gl: '2200600003',
        moduleId: 'gl-2200600003',
        key: 'software',
        label: 'SOFTWARES INVENTORY',
        detail: 'Licences and software renewals',
        model: 'ledger',
        tbodyId: 'gl-2200600003-table-body'
    },
    {
        gl: '2201900002',
        moduleId: 'gl-2201900002',
        key: 'spares',
        label: 'SPARES & PARTS INVENTORY',
        detail: 'Laptop/printer rollers, RJ45, spare parts',
        model: 'ledger',
        tbodyId: 'gl-2201900002-table-body'
    },
    {
        gl: '3112210001',
        moduleId: 'gl-3112210001',
        key: 'ict',
        label: 'ICT EQUIPMENT INVENTORY',
        detail: 'Laptops, desktops, tablets, printers',
        model: 'ledger',
        tbodyId: 'gl-3112210001-table-body'
    },
    {
        gl: '220200002',
        moduleId: 'gl-220200002',
        key: 'maintenance',
        label: 'MAINTENANCE & SERVICES INVENTORY',
        detail: 'Maintenance kits and service stock',
        model: 'ledger',
        tbodyId: 'gl-220200002-table-body'
    }
];

function parseQty(value) {
    const n = parseFloat(String(value ?? '').replace(/[^0-9.-]/g, ''));
    return Number.isFinite(n) ? n : 0;
}

function sumDomValues(selector, root = document) {
    let total = 0;
    root.querySelectorAll(selector).forEach((el) => {
        total += parseQty(el.value);
    });
    return total;
}

function sumSavedTableColumn(moduleId, tbodyId, cellIndex) {
    const rows = appState.modules?.[moduleId]?.tables?.[tbodyId] || [];
    return rows.reduce((sum, row) => sum + parseQty(row.cells?.[cellIndex]?.value), 0);
}

function getSavedOpeningBalance(moduleId, preferredIndex) {
    const fields = appState.modules?.[moduleId]?.fields || [];
    if (preferredIndex != null && fields[preferredIndex]) {
        return parseQty(fields[preferredIndex].value);
    }
    for (let i = 0; i < fields.length; i++) {
        if (fields[i]?.className?.includes?.('stock-opening-balance')) {
            return parseQty(fields[i].value);
        }
    }
    return parseQty(fields[preferredIndex]?.value);
}

function getConsumablesInventory() {
    const moduleEl = document.getElementById('gl-2200600002');
    let opening = 0;
    let receipts = 0;
    let issues = 0;

    if (moduleEl) {
        opening = parseQty(moduleEl.querySelector('.stock-opening-balance')?.value);
        receipts = parseQty(moduleEl.querySelector('.stock-receipts-total')?.value);
        issues = sumDomValues('#gl-2200600002-table-body .gl-issue-qty', moduleEl);
        if (!issues) {
            issues = parseQty(moduleEl.querySelector('.stock-issues-total')?.value);
        }
    } else {
        opening = getSavedOpeningBalance('gl-2200600002', 3);
        const fields = appState.modules?.['gl-2200600002']?.fields || [];
        receipts = parseQty(fields[4]?.value);
        issues = sumSavedTableColumn('gl-2200600002', 'gl-2200600002-table-body', 5);
    }

    const onHand = opening + receipts - issues;
    return { opening, receipts, issues, onHand, movementLines: countModuleTableRows('gl-2200600002', 'gl-2200600002-table-body') };
}

function getLedgerInventory(moduleId, tbodyId) {
    const moduleEl = document.getElementById(moduleId);
    let opening = 0;
    let receipts = 0;
    let issues = 0;

    if (moduleEl) {
        opening = parseQty(moduleEl.querySelector('.stock-opening-balance')?.value);
        receipts = sumDomValues(`#${tbodyId} .gl-stock-receipts`, moduleEl);
        issues = sumDomValues(`#${tbodyId} .gl-stock-issues`, moduleEl);
    } else {
        opening = getSavedOpeningBalance(moduleId, 6);
        receipts = sumSavedTableColumn(moduleId, tbodyId, 2);
        issues = sumSavedTableColumn(moduleId, tbodyId, 3);
    }

    const onHand = opening + receipts - issues;
    return { opening, receipts, issues, onHand, movementLines: countModuleTableRows(moduleId, tbodyId) };
}

function getInventoryStatus(row) {
    if (row.onHand < 0) {
        return { label: 'Over-issued', className: 'status-critical', attention: true };
    }
    if (row.opening === 0 && row.receipts === 0 && row.issues === 0) {
        return { label: 'No stock recorded', className: 'status-neutral', attention: false };
    }
    if (row.onHand === 0 && (row.opening > 0 || row.receipts > 0)) {
        return { label: 'Depleted', className: 'status-warning', attention: true };
    }
    const base = row.opening + row.receipts;
    if (base > 0 && row.onHand / base <= 0.2) {
        return { label: 'Low stock', className: 'status-warning', attention: true };
    }
    if (row.receipts > 0 || row.issues > 0) {
        return { label: 'Active / reconciled', className: 'status-healthy', attention: false };
    }
    return { label: 'Opening only', className: 'status-monitor', attention: false };
}

function countModuleTableRows(moduleId, tbodyId) {
    const live = document.querySelectorAll(`#${tbodyId} tr`).length;
    if (live) return live;
    return (appState.modules?.[moduleId]?.tables?.[tbodyId] || []).length;
}

/** Prefer storesInventory ledger rollups; fall back to legacy GL stock tables. */
function getInventorySnapshot() {
    if (typeof INVENTORY_PARENT_LEDGERS !== 'undefined' && typeof aggregateParentLedgerStock === 'function') {
        const parents = INVENTORY_PARENT_LEDGERS.map((parent) => {
            const qty = aggregateParentLedgerStock(parent.key);
            const status = getInventoryStatus(qty);
            return {
                key: parent.key,
                label: parent.label,
                detail: parent.detail,
                gl: parent.defaultGl,
                moduleId: parent.key,
                cssKey: parent.cssKey || parent.key,
                ...qty,
                status,
                isInventoryLedger: true
            };
        });

        // Surface custom ledgers that are not under a known parent
        const customOrphans = (typeof getAllInventoryLedgers === 'function' ? getAllInventoryLedgers() : [])
            .filter((l) => l.custom && l.parentKey === 'custom')
            .map((led) => {
                const qty = typeof getCategoryStockSummary === 'function'
                    ? (() => {
                        const s = getCategoryStockSummary(led.key);
                        return {
                            opening: s.opening,
                            receipts: s.received,
                            issues: s.issued,
                            onHand: s.onHand,
                            childCount: 1
                        };
                    })()
                    : { opening: 0, receipts: 0, issues: 0, onHand: 0, childCount: 1 };
                return {
                    key: led.key,
                    label: led.fullLabel || led.label,
                    detail: led.detail,
                    gl: led.defaultGl || '—',
                    moduleId: led.key,
                    cssKey: 'custom',
                    ...qty,
                    status: getInventoryStatus(qty),
                    isInventoryLedger: true
                };
            });

        return [...parents, ...customOrphans];
    }

    return INVENTORY_CATEGORIES.map((cat) => {
        const qty = cat.model === 'consumables'
            ? getConsumablesInventory()
            : getLedgerInventory(cat.moduleId, cat.tbodyId);
        const status = getInventoryStatus(qty);
        return { ...cat, ...qty, status, cssKey: cat.key };
    });
}

function formatStockQty(value) {
    const n = Number(value) || 0;
    if (Number.isInteger(n)) return String(n);
    return n.toFixed(2);
}

function invEscape(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

let inventoryDashboardSnapshot = [];
let inventoryActiveFilter = 'all';

const INVENTORY_FILTER_LABELS = {
    all: 'All inventory ledgers',
    opening: 'Filtered: Opening (B/F) — ledgers with opening balance',
    received: 'Filtered: Received / Restocked',
    issued: 'Filtered: Issued / Depleted',
    onhand: 'Filtered: On Hand stock',
    attention: 'Filtered: Needs Attention'
};

function rowMatchesInventoryFilter(row, filter) {
    if (!filter || filter === 'all') return true;
    if (filter === 'opening' || filter === 'onhand') return true;
    if (filter === 'received') return Number(row.receipts) > 0;
    if (filter === 'issued') return Number(row.issues) > 0;
    if (filter === 'attention') return !!row.status?.attention;
    return true;
}

function applyInventorySummaryFilter(filter) {
    inventoryActiveFilter = filter || 'all';
    const strip = document.querySelector('.inventory-summary-strip');
    strip?.querySelectorAll('.inventory-summary-stat').forEach((btn) => {
        btn.classList.toggle('is-active', btn.dataset.invFilter === inventoryActiveFilter);
    });

    const bar = document.getElementById('inventoryFilterBar');
    const label = document.getElementById('inventoryFilterLabel');
    if (bar && label) {
        const active = inventoryActiveFilter !== 'all';
        bar.hidden = !active;
        label.textContent = INVENTORY_FILTER_LABELS[inventoryActiveFilter] || '';
    }

    const filtered = inventoryDashboardSnapshot.filter((row) => rowMatchesInventoryFilter(row, inventoryActiveFilter));
    renderInventoryDashboardViews(filtered);

    const panel = document.querySelector('.inventory-panel') || document.getElementById('inventoryCards');
    panel?.scrollIntoView({ behavior: 'smooth', block: 'start' });

    if (typeof showToast === 'function') {
        const count = filtered.length;
        const name = INVENTORY_FILTER_LABELS[inventoryActiveFilter] || 'Inventory';
        showToast(`${name.replace(/^Filtered:\s*/, '')}: ${count} ledger${count === 1 ? '' : 's'}`, 'info');
    }
}

function initInventorySummaryClicks() {
    const strip = document.querySelector('.inventory-summary-strip');
    if (!strip || strip.dataset.bound === '1') return;
    strip.dataset.bound = '1';
    strip.addEventListener('click', (e) => {
        const btn = e.target.closest('.inventory-summary-stat[data-inv-filter]');
        if (!btn) return;
        const filter = btn.dataset.invFilter;
        applyInventorySummaryFilter(inventoryActiveFilter === filter ? 'all' : filter);
    });
    document.getElementById('inventoryFilterClear')?.addEventListener('click', () => {
        applyInventorySummaryFilter('all');
    });
}

function openInventoryFromDashboard(targetKey) {
    if (targetKey === 'ict-accountability' || targetKey === 'temporary-loans' || targetKey === 'permanent-loans' || targetKey === 'unit-equipment' || targetKey === 'zna-q-1033') {
        if (typeof navigateToModule === 'function') navigateToModule(targetKey);
        return;
    }
    if (typeof openInventoryLedgerView === 'function') {
        openInventoryLedgerView(targetKey);
        return;
    }
    if (typeof openGlInventoryView === 'function' && String(targetKey).startsWith('gl-')) {
        openGlInventoryView(targetKey);
        return;
    }
    if (typeof navigateToModule === 'function') navigateToModule(targetKey);
}

function buildDashboardFloatCardHtml(card) {
    const badge = card.statusLabel
        ? `<span class="card-status-badge ${invEscape(card.statusClass || 'status-neutral')}">${invEscape(card.statusLabel)}</span>`
        : '';
    const metrics = (card.metrics || []).map((m) => `
        <div><span>${invEscape(m.label)}</span><strong class="${invEscape(m.className || '')}">${invEscape(String(m.value))}</strong></div>
    `).join('');

    return `
        <button type="button" class="inventory-card float-card ${card.accent ? `float-card--${invEscape(card.accent)}` : ''}" data-inv-ledger="${invEscape(card.key)}">
            <div class="inventory-card-top">
                <div>
                    <div class="inventory-card-gl">${invEscape(card.eyebrow || 'Floating card')}</div>
                    <h4>${invEscape(card.label)}</h4>
                    <p>${invEscape(card.detail || '')}</p>
                </div>
                ${badge}
            </div>
            ${metrics ? `<div class="inventory-card-metrics">${metrics}</div>` : ''}
        </button>
    `;
}

function getDashboardFloatCards(snapshot) {
    const byKey = {};
    (snapshot || []).forEach((row) => {
        byKey[row.key] = {
            key: row.key,
            label: row.label,
            detail: row.detail,
            eyebrow: row.gl && row.gl !== '—' ? `Stock ledger · GL ${row.gl}` : 'Stock ledger',
            statusLabel: row.status?.label,
            statusClass: row.status?.className,
            metrics: [
                { label: 'Opening', value: formatStockQty(row.opening) },
                { label: 'Received', value: formatStockQty(row.receipts), className: 'inv-received' },
                { label: 'Issued', value: formatStockQty(row.issues), className: 'inv-issued' },
                { label: 'On Hand', value: formatStockQty(row.onHand), className: 'inv-onhand' }
            ]
        };
    });

    const ictStats = typeof getIctAccountabilityStats === 'function'
        ? getIctAccountabilityStats()
        : { total: 0, equipment: 0, issued: 0, renewSoon: 0 };

    const slotOrder = [
        'zoff',
        'softwares',
        'spares',
        'ict',
        'maintenance',
        'ict-accountability',
        'temporary-loans',
        'permanent-loans',
        'unit-equipment',
        'zna-q-1033'
    ];

    const extras = {
        'ict-accountability': {
            key: 'ict-accountability',
            label: 'ZNA ICT Asset Register',
            detail: 'ZA-engraved equipment · traceable expendables · software renewals',
            eyebrow: 'ZA accountability',
            accent: 'za',
            statusLabel: ictStats.renewSoon ? `${ictStats.renewSoon} renewals` : 'Ready',
            statusClass: ictStats.renewSoon ? 'status-warning' : 'status-healthy',
            metrics: [
                { label: 'Records', value: String(ictStats.total || 0) },
                { label: 'ZA Eqpt', value: String(ictStats.equipment || 0) },
                { label: 'Issued', value: String(ictStats.issued || 0) },
                { label: 'Renew ≤90d', value: String(ictStats.renewSoon || 0), className: ictStats.renewSoon ? 'inv-issued' : '' }
            ]
        },
        'temporary-loans': {
            key: 'temporary-loans',
            label: 'Temporary Loans',
            detail: 'Controlled stores on loan (ZA numbered) · max 14 days',
            eyebrow: 'Controlled stores',
            metrics: [
                { label: 'Module', value: 'Open' },
                { label: 'Focus', value: 'ZA loans' },
                { label: 'Max', value: '14 days' },
                { label: 'Action', value: 'View' }
            ]
        },
        'permanent-loans': {
            key: 'permanent-loans',
            label: 'Permanent Loans',
            detail: 'Laptops / iPads · Comd/34 · 3-year clock then Masasa scratch-off',
            eyebrow: 'Comd/34',
            metrics: (() => {
                const s = typeof getPermanentLoansSummary === 'function'
                    ? getPermanentLoansSummary()
                    : { serving: 0, due3yr: 0, retireReturn: 0, personal: 0 };
                return [
                    { label: 'Serving', value: String(s.serving || 0) },
                    { label: '3-year', value: String(s.due3yr || 0), className: s.due3yr ? 'inv-issued' : '' },
                    { label: 'Return', value: String(s.retireReturn || 0), className: s.retireReturn ? 'inv-issued' : '' },
                    { label: 'Personal', value: String(s.personal || 0) }
                ];
            })()
        },
        'unit-equipment': {
            key: 'unit-equipment',
            label: 'Unit Equipment',
            detail: 'Equipment held by IT Dir locations and units',
            eyebrow: 'Unit holdings',
            metrics: [
                { label: 'Module', value: 'Open' },
                { label: 'Focus', value: 'Locations' },
                { label: 'Edit', value: 'Yes' },
                { label: 'Action', value: 'View' }
            ]
        },
        'zna-q-1033': {
            key: 'zna-q-1033',
            label: 'Form 1033',
            detail: 'Issue & receipt turnaround for inventory increases / decreases',
            eyebrow: 'Stock turnaround',
            metrics: [
                { label: 'Module', value: 'Open' },
                { label: 'Receive', value: 'Yes' },
                { label: 'Issue', value: 'Yes' },
                { label: 'Action', value: 'Form' }
            ]
        }
    };

    return slotOrder.map((key) => byKey[key] || extras[key]).filter(Boolean).slice(0, 9);
}

function renderInventoryDashboardViews(snapshot) {
    const cardsEl = document.getElementById('inventoryCards');
    const tbody = document.getElementById('inventoryOverviewBody');
    const rows = snapshot || [];
    const floatCards = getDashboardFloatCards(rows);

    if (cardsEl) {
        if (!floatCards.length) {
            cardsEl.innerHTML = '<div class="inventory-empty-filter">No inventory ledgers available.</div>';
        } else {
            cardsEl.innerHTML = floatCards.map((card) => buildDashboardFloatCardHtml(card)).join('');
            cardsEl.querySelectorAll('.inventory-card[data-inv-ledger]').forEach((card) => {
                card.addEventListener('click', () => openInventoryFromDashboard(card.dataset.invLedger));
            });
        }
    }

    if (tbody) {
        if (!rows.length) {
            tbody.innerHTML = '<tr><td colspan="8" class="empty-state">No ledgers match this filter. Click a KPI again or Show all.</td></tr>';
        } else {
            tbody.innerHTML = rows.map((row) => `
                <tr>
                    <td>
                        <strong>${invEscape(row.label)}</strong><br>
                        <small>Stock ledger${row.gl && row.gl !== '—' ? ` · GL ${invEscape(row.gl)} (procurement charge only)` : ''}</small>
                    </td>
                    <td>${invEscape(row.detail)}</td>
                    <td>${formatStockQty(row.opening)}</td>
                    <td>${formatStockQty(row.receipts)}</td>
                    <td>${formatStockQty(row.issues)}</td>
                    <td><strong>${formatStockQty(row.onHand)}</strong></td>
                    <td><span class="card-status-badge ${row.status.className}">${invEscape(row.status.label)}</span></td>
                    <td>
                        <button type="button" class="btn btn-ghost btn-sm inv-open-ledger" data-inv-ledger="${invEscape(row.key)}">Open ledger</button>
                    </td>
                </tr>
            `).join('');

            tbody.querySelectorAll('.inv-open-ledger').forEach((el) => {
                el.addEventListener('click', (e) => {
                    e.preventDefault();
                    openInventoryFromDashboard(el.dataset.invLedger);
                });
            });
        }
    }
}

function renderInventoryDashboard() {
    const snapshot = getInventorySnapshot();
    inventoryDashboardSnapshot = snapshot;
    initInventorySummaryClicks();

    const cardsEl = document.getElementById('inventoryCards');
    const tbody = document.getElementById('inventoryOverviewBody');
    if (!cardsEl && !tbody) return snapshot;

    let totalOpening = 0;
    let totalReceived = 0;
    let totalIssued = 0;
    let totalOnHand = 0;
    let attentionCount = 0;

    snapshot.forEach((row) => {
        totalOpening += row.opening;
        totalReceived += row.receipts;
        totalIssued += row.issues;
        totalOnHand += row.onHand;
        if (row.status.attention) attentionCount += 1;
    });

    const setText = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    };

    setText('invTotalOnHand', formatStockQty(totalOnHand));
    setText('invTotalReceived', formatStockQty(totalReceived));
    setText('invTotalIssued', formatStockQty(totalIssued));
    setText('invAttentionCount', String(attentionCount));
    setText('invTotalOpening', formatStockQty(totalOpening));

    const filtered = snapshot.filter((row) => rowMatchesInventoryFilter(row, inventoryActiveFilter));
    renderInventoryDashboardViews(filtered);

    const strip = document.querySelector('.inventory-summary-strip');
    strip?.querySelectorAll('.inventory-summary-stat').forEach((btn) => {
        btn.classList.toggle('is-active', btn.dataset.invFilter === inventoryActiveFilter && inventoryActiveFilter !== 'all');
    });
    const bar = document.getElementById('inventoryFilterBar');
    const label = document.getElementById('inventoryFilterLabel');
    if (bar && label) {
        const active = inventoryActiveFilter !== 'all';
        bar.hidden = !active;
        label.textContent = INVENTORY_FILTER_LABELS[inventoryActiveFilter] || '';
    }

    return snapshot;
}

function getInventoryAlerts() {
    return getInventorySnapshot()
        .filter((row) => row.status?.attention)
        .map((row) => ({
            type: row.onHand < 0 ? 'danger' : 'warning',
            target: 'voucher-module',
            text: `${row.label}: ${row.status.label} (on hand ${formatStockQty(row.onHand)})`
        }));
}
