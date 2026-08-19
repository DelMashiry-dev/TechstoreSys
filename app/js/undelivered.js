/* undelivered.js — Undelivered purchase order items tracking + alerts */

const UNDELIVERED_STATUSES = [
    { value: 'awaiting', label: 'Awaiting Delivery' },
    { value: 'partial', label: 'Part Delivered' },
    { value: 'delivered', label: 'Fully Delivered' },
    { value: 'cancelled', label: 'Cancelled' }
];

const UNDELIVERED_CATEGORIES = ['Parts', 'Toner', 'ICT', 'Consumables', 'Software', 'Other'];

const UNDELIVERED_OPEN = new Set(['awaiting', 'partial']);

/** Seed from IT DIR Undelivered Purchase Orders as at November 2026 */
const UNDELIVERED_SEED = [
    // Upright — DP 564/2025 — Parts
    { supplier: 'Upright', poNo: 'DP 564/2025', category: 'Parts', item: 'Canon IR3025 Film', qty: 5, uom: 'ea', status: 'awaiting', remarks: 'awaiting delivery', contact: '' },
    { supplier: 'Upright', poNo: 'DP 564/2025', category: 'Parts', item: 'Canon IR3025 Unit Drum', qty: 5, uom: 'ea', status: 'awaiting', remarks: 'awaiting delivery', contact: '' },
    { supplier: 'Upright', poNo: 'DP 564/2025', category: 'Parts', item: 'Canon IR3025 Pressure Roller', qty: 5, uom: 'ea', status: 'awaiting', remarks: 'awaiting delivery', contact: '' },
    { supplier: 'Upright', poNo: 'DP 564/2025', category: 'Parts', item: 'Fuser Film M402dn', qty: 7, uom: 'ea', status: 'awaiting', remarks: 'awaiting delivery', contact: '' },
    { supplier: 'Upright', poNo: 'DP 564/2025', category: 'Parts', item: 'Fuser Film M427fdn', qty: 7, uom: 'ea', status: 'awaiting', remarks: 'awaiting delivery', contact: '' },
    { supplier: 'Upright', poNo: 'DP 564/2025', category: 'Parts', item: 'Fuser Film M404dn', qty: 7, uom: 'ea', status: 'awaiting', remarks: 'awaiting delivery', contact: '' },
    { supplier: 'Upright', poNo: 'DP 564/2025', category: 'Parts', item: 'Fuser Film M430f', qty: 7, uom: 'ea', status: 'awaiting', remarks: 'awaiting delivery', contact: '' },
    { supplier: 'Upright', poNo: 'DP 564/2025', category: 'Parts', item: 'Fuser Film M428fdw', qty: 7, uom: 'ea', status: 'awaiting', remarks: 'awaiting delivery', contact: '' },
    { supplier: 'Upright', poNo: 'DP 564/2025', category: 'Parts', item: 'Fuser Film M400', qty: 7, uom: 'ea', status: 'awaiting', remarks: 'awaiting delivery', contact: '' },
    { supplier: 'Upright', poNo: 'DP 564/2025', category: 'Parts', item: '8GB DDR4 Desktop RAM', qty: 5, uom: 'ea', status: 'awaiting', remarks: 'awaiting delivery', contact: '' },
    { supplier: 'Upright', poNo: 'DP 564/2025', category: 'Parts', item: '16GB DDR4 Desktop RAM', qty: 5, uom: 'ea', status: 'awaiting', remarks: 'awaiting delivery', contact: '' },
    { supplier: 'Upright', poNo: 'DP 564/2025', category: 'Parts', item: '8GB DDR4 Laptop RAM', qty: 5, uom: 'ea', status: 'awaiting', remarks: 'awaiting delivery', contact: '' },
    { supplier: 'Upright', poNo: 'DP 564/2025', category: 'Parts', item: '16GB DDR4 Laptop RAM', qty: 5, uom: 'ea', status: 'awaiting', remarks: 'awaiting delivery', contact: '' },

    // Shakeline — 4204002667 — Toner
    { supplier: 'Shakeline', poNo: '4204002667', category: 'Toner', item: 'MPC 2000 Ricoh Toner Black', qty: 3, uom: 'ea', status: 'awaiting', remarks: 'awaiting delivery', contact: '0774339332' },
    { supplier: 'Shakeline', poNo: '4204002667', category: 'Toner', item: 'MPC 2000 Ricoh Toner Cyan', qty: 3, uom: 'ea', status: 'awaiting', remarks: 'awaiting delivery', contact: '0774339332' },
    { supplier: 'Shakeline', poNo: '4204002667', category: 'Toner', item: 'MPC 2000 Ricoh Toner Yellow', qty: 3, uom: 'ea', status: 'awaiting', remarks: 'awaiting delivery', contact: '0774339332' },
    { supplier: 'Shakeline', poNo: '4204002667', category: 'Toner', item: 'MPC 2000 Ricoh Toner Magenta', qty: 3, uom: 'ea', status: 'awaiting', remarks: 'awaiting delivery', contact: '0774339332' },

    // Sigcomx — 4204003252 — ICT
    { supplier: 'Sigcomx', poNo: '4204003252', category: 'ICT', item: 'Medium Printers', qty: 6, uom: 'ea', status: 'awaiting', remarks: 'awaiting delivery', contact: '0774325236' },

    // Sigcomx — DP 1540/2025
    { supplier: 'Sigcomx', poNo: 'DP 1540/2025', category: 'ICT', item: 'Laptops i9', qty: 4, uom: 'ea', status: 'partial', qtyDelivered: 3, remarks: 'delivered 03 bal 01', contact: '0774325236' },
    { supplier: 'Sigcomx', poNo: 'DP 1540/2025', category: 'ICT', item: 'Macbook', qty: 3, uom: 'ea', status: 'awaiting', remarks: 'awaiting delivery', contact: '0774325236' }
];

function createDefaultUndelivered() {
    return [];
}

function ensureUndelivered() {
    if (!appState) return [];
    if (!Array.isArray(appState.undeliveredOrders)) {
        appState.undeliveredOrders = createDefaultUndelivered();
    }
    return appState.undeliveredOrders;
}

function undEscape(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function getUndeliveredBalance(row) {
    const qty = Number(row.qty) || 0;
    const delivered = Number(row.qtyDelivered) || 0;
    if (row.status === 'delivered') return 0;
    if (row.status === 'cancelled') return 0;
    return Math.max(0, qty - delivered);
}

function getUndeliveredAgeDays(row) {
    const start = row.orderDate || row.asAtDate || row.createdAt;
    if (!start) return 0;
    const d = new Date(`${String(start).slice(0, 10)}T00:00:00`);
    if (Number.isNaN(d.getTime())) return 0;
    const end = new Date();
    end.setHours(0, 0, 0, 0);
    d.setHours(0, 0, 0, 0);
    return Math.max(0, Math.ceil((end - d) / (1000 * 60 * 60 * 24)));
}

function getUndeliveredAgeBucket(ageDays, status) {
    if (!UNDELIVERED_OPEN.has(status)) {
        return { key: 'closed', label: 'Closed', className: 'und-age-closed' };
    }
    if (ageDays <= 14) return { key: 'recent', label: 'Recent (0–14d)', className: 'und-age-recent' };
    if (ageDays <= 30) return { key: 'aging', label: 'Aging (15–30d)', className: 'und-age-aging' };
    return { key: 'overdue', label: 'Overdue (31d+)', className: 'und-age-overdue' };
}

function getUndeliveredStatusLabel(value) {
    return UNDELIVERED_STATUSES.find((s) => s.value === value)?.label || value || '—';
}

function getUndeliveredSummary() {
    const summary = { open: 0, awaiting: 0, partial: 0, overdue: 0, qtyOutstanding: 0 };
    ensureUndelivered().forEach((row) => {
        if (!UNDELIVERED_OPEN.has(row.status)) return;
        summary.open += 1;
        if (row.status === 'awaiting') summary.awaiting += 1;
        if (row.status === 'partial') summary.partial += 1;
        const age = getUndeliveredAgeDays(row);
        if (getUndeliveredAgeBucket(age, row.status).key === 'overdue') summary.overdue += 1;
        summary.qtyOutstanding += getUndeliveredBalance(row);
    });
    return summary;
}

function getUndeliveredAlerts(options = {}) {
    // Dashboard renders PURCHASE ORDERS (AWAITING DELIVERY) as a dedicated watch section
    if (options.skipSummaries) return [];

    const alerts = [];
    const open = ensureUndelivered()
        .filter((row) => UNDELIVERED_OPEN.has(row.status))
        .map((row) => ({ row, age: getUndeliveredAgeDays(row), bal: getUndeliveredBalance(row) }))
        .sort((a, b) => b.age - a.age);

    if (!open.length) return alerts;

    const overdue = open.filter((x) => getUndeliveredAgeBucket(x.age, x.row.status).key === 'overdue');
    const partial = open.filter((x) => x.row.status === 'partial');
    const awaiting = open.filter((x) => x.row.status === 'awaiting');

    overdue.slice(0, 5).forEach(({ row, age, bal }) => {
        alerts.push({
            type: 'danger',
            target: 'undelivered-orders',
            undId: row.id,
            text: `Overdue undelivered (${age}d): ${row.item} × ${bal} from ${row.supplier || 'supplier'} [${row.poNo || 'no PO'}].`
        });
    });

    partial.slice(0, 4).forEach(({ row, bal }) => {
        alerts.push({
            type: 'warning',
            target: 'undelivered-orders',
            undId: row.id,
            text: `Part delivery outstanding: ${row.item} — balance ${bal} (${row.remarks || row.poNo || ''}).`
        });
    });

    if (awaiting.length && !overdue.length) {
        alerts.push({
            type: 'warning',
            target: 'undelivered-orders',
            text: `PURCHASE ORDERS (AWAITING DELIVERY): ${awaiting.length} line(s) still outstanding. Open Undelivered Items.`
        });
    } else if (open.length && overdue.length && awaiting.length > overdue.length) {
        alerts.push({
            type: 'info',
            target: 'undelivered-orders',
            text: `PURCHASE ORDERS (AWAITING DELIVERY): ${open.length} undelivered PO line(s) open (${getUndeliveredSummary().qtyOutstanding} units outstanding).`
        });
    }

    return alerts;
}

function seedUndeliveredFromRegister({ force = false } = {}) {
    const list = ensureUndelivered();
    if (list.length && !force) return { added: 0, total: list.length };

    if (force) appState.undeliveredOrders = [];
    const target = ensureUndelivered();
    const now = new Date().toISOString();
    const asAt = '2026-11-01';

    UNDELIVERED_SEED.forEach((seed, i) => {
        target.push({
            id: `und-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
            asAtDate: asAt,
            orderDate: asAt,
            supplier: seed.supplier,
            poNo: seed.poNo,
            category: seed.category,
            item: seed.item,
            qty: seed.qty,
            qtyDelivered: seed.qtyDelivered || 0,
            uom: seed.uom || 'ea',
            status: seed.status || 'awaiting',
            remarks: seed.remarks || '',
            contact: seed.contact || '',
            createdAt: now,
            updatedAt: now
        });
    });

    return { added: UNDELIVERED_SEED.length, total: target.length };
}

function clearUndeliveredForm() {
    const set = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.value = value;
    };
    set('undEditId', '');
    set('undAsAtDate', '2026-11-01');
    set('undOrderDate', new Date().toISOString().slice(0, 10));
    set('undSupplier', '');
    set('undPoNo', '');
    set('undCategory', 'Parts');
    set('undItem', '');
    set('undQty', '1');
    set('undQtyDelivered', '0');
    set('undUom', 'ea');
    set('undStatus', 'awaiting');
    set('undContact', '');
    set('undRemarks', '');
    const title = document.getElementById('undFormTitle');
    if (title) title.textContent = 'Capture Undelivered Item';
    const btn = document.getElementById('undSaveBtn');
    if (btn) btn.textContent = 'Save Item';
}

function fillUndeliveredForm(row) {
    const set = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.value = value ?? '';
    };
    set('undEditId', row.id);
    set('undAsAtDate', row.asAtDate || '');
    set('undOrderDate', row.orderDate || '');
    set('undSupplier', row.supplier || '');
    set('undPoNo', row.poNo || '');
    set('undCategory', row.category || 'Other');
    set('undItem', row.item || '');
    set('undQty', row.qty != null ? String(row.qty) : '1');
    set('undQtyDelivered', row.qtyDelivered != null ? String(row.qtyDelivered) : '0');
    set('undUom', row.uom || 'ea');
    set('undStatus', row.status || 'awaiting');
    set('undContact', row.contact || '');
    set('undRemarks', row.remarks || '');
    const title = document.getElementById('undFormTitle');
    if (title) title.textContent = `Edit ${row.item || row.poNo || 'Item'}`;
    const btn = document.getElementById('undSaveBtn');
    if (btn) btn.textContent = 'Update Item';
    document.getElementById('undelivered-orders')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    document.getElementById('undItem')?.focus();
}

function readUndeliveredForm() {
    return {
        id: document.getElementById('undEditId')?.value || '',
        asAtDate: document.getElementById('undAsAtDate')?.value || '',
        orderDate: document.getElementById('undOrderDate')?.value || '',
        supplier: (document.getElementById('undSupplier')?.value || '').trim(),
        poNo: (document.getElementById('undPoNo')?.value || '').trim(),
        category: document.getElementById('undCategory')?.value || 'Other',
        item: (document.getElementById('undItem')?.value || '').trim(),
        qty: parseFloat(document.getElementById('undQty')?.value) || 0,
        qtyDelivered: parseFloat(document.getElementById('undQtyDelivered')?.value) || 0,
        uom: (document.getElementById('undUom')?.value || 'ea').trim() || 'ea',
        status: document.getElementById('undStatus')?.value || 'awaiting',
        contact: (document.getElementById('undContact')?.value || '').trim(),
        remarks: (document.getElementById('undRemarks')?.value || '').trim()
    };
}

function saveUndeliveredFromForm() {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;
    const data = readUndeliveredForm();
    if (!data.supplier) {
        showToast('Enter the supplier.', 'error');
        document.getElementById('undSupplier')?.focus();
        return;
    }
    if (!data.item) {
        showToast('Enter the item description.', 'error');
        document.getElementById('undItem')?.focus();
        return;
    }
    if (!data.qty || data.qty < 1) {
        showToast('Quantity must be at least 1.', 'error');
        return;
    }

    // Auto-status from delivered qty
    if (data.qtyDelivered >= data.qty && data.status !== 'cancelled') data.status = 'delivered';
    else if (data.qtyDelivered > 0 && data.qtyDelivered < data.qty && data.status === 'awaiting') data.status = 'partial';

    const list = ensureUndelivered();
    const now = new Date().toISOString();

    if (data.id) {
        const idx = list.findIndex((r) => r.id === data.id);
        if (idx < 0) {
            showToast('Item not found.', 'error');
            return;
        }
        list[idx] = { ...list[idx], ...data, updatedAt: now };
        showToast(`Updated ${data.item}.`);
    } else {
        list.unshift({
            ...data,
            id: `und-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            createdAt: now,
            updatedAt: now
        });
        showToast(`Captured ${data.item}.`);
    }

    if (typeof saveState === 'function') saveState();
    clearUndeliveredForm();
    renderUndeliveredModule();
    if (typeof updateSystemAlerts === 'function') updateSystemAlerts();
    if (typeof updateDashboard === 'function') updateDashboard();
}

function editUndelivered(id) {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;
    const row = ensureUndelivered().find((r) => r.id === id);
    if (!row) {
        showToast('Item not found.', 'error');
        return;
    }
    fillUndeliveredForm(row);
}

function setUndeliveredStatus(id, status, qtyDelivered) {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;
    const row = ensureUndelivered().find((r) => r.id === id);
    if (!row) return;
    row.status = status;
    if (qtyDelivered != null) row.qtyDelivered = qtyDelivered;
    if (status === 'delivered') row.qtyDelivered = row.qty;
    row.updatedAt = new Date().toISOString();
    if (typeof saveState === 'function') saveState();
    renderUndeliveredModule();
    if (typeof updateSystemAlerts === 'function') updateSystemAlerts();
    if (typeof updateDashboard === 'function') updateDashboard();
    showToast(`${row.item} marked ${getUndeliveredStatusLabel(status)}.`);
}

function deleteUndelivered(id) {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;
    const list = ensureUndelivered();
    const row = list.find((r) => r.id === id);
    if (!row) return;
    if (!window.confirm(`Delete undelivered item "${row.item}" (${row.poNo || 'no PO'})?`)) return;
    appState.undeliveredOrders = list.filter((r) => r.id !== id);
    if (document.getElementById('undEditId')?.value === id) clearUndeliveredForm();
    if (typeof saveState === 'function') saveState();
    renderUndeliveredModule();
    if (typeof updateSystemAlerts === 'function') updateSystemAlerts();
    showToast('Item deleted.');
}

function getUndeliveredFilterState() {
    return {
        q: (document.getElementById('undTableSearch')?.value || '').trim().toLowerCase(),
        status: document.getElementById('undFilterStatus')?.value || 'open',
        category: document.getElementById('undFilterCategory')?.value || 'all'
    };
}

function undeliveredMatchesFilters(row, filters) {
    const open = UNDELIVERED_OPEN.has(row.status);
    if (filters.status === 'open' && !open) return false;
    if (filters.status === 'closed' && open) return false;
    if (filters.status !== 'all' && filters.status !== 'open' && filters.status !== 'closed' && row.status !== filters.status) {
        return false;
    }
    if (filters.category !== 'all' && row.category !== filters.category) return false;
    if (!filters.q) return true;
    const hay = [row.supplier, row.poNo, row.category, row.item, row.remarks, row.contact, row.status]
        .join(' ')
        .toLowerCase();
    return hay.includes(filters.q);
}

function renderUndeliveredSummary() {
    const s = getUndeliveredSummary();
    const set = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = String(value);
    };
    set('undStatOpen', s.open);
    set('undStatAwaiting', s.awaiting);
    set('undStatPartial', s.partial);
    set('undStatOverdue', s.overdue);
    set('undStatQty', s.qtyOutstanding);
}

function renderUndeliveredTable() {
    const tbody = document.getElementById('undelivered-table-body');
    if (!tbody) return;
    const filters = getUndeliveredFilterState();
    const canEdit = typeof canEditData === 'function' ? canEditData() : true;
    const rows = ensureUndelivered()
        .filter((row) => undeliveredMatchesFilters(row, filters))
        .sort((a, b) => {
            const aOpen = UNDELIVERED_OPEN.has(a.status) ? 1 : 0;
            const bOpen = UNDELIVERED_OPEN.has(b.status) ? 1 : 0;
            if (aOpen !== bOpen) return bOpen - aOpen;
            return getUndeliveredAgeDays(b) - getUndeliveredAgeDays(a);
        });

    if (!rows.length) {
        tbody.innerHTML = '<tr><td colspan="11" class="req-empty-row">No undelivered items match this filter.</td></tr>';
        return;
    }

    tbody.innerHTML = rows.map((row) => {
        const age = getUndeliveredAgeDays(row);
        const bucket = getUndeliveredAgeBucket(age, row.status);
        const bal = getUndeliveredBalance(row);
        return `
            <tr class="${bucket.className}">
                <td>${undEscape(row.supplier || '—')}</td>
                <td><strong>${undEscape(row.poNo || '—')}</strong></td>
                <td>${undEscape(row.category || '—')}</td>
                <td>${undEscape(row.item || '—')}</td>
                <td>${undEscape(row.qty || 0)}</td>
                <td>${undEscape(row.qtyDelivered || 0)}</td>
                <td><strong>${bal}</strong></td>
                <td>${undEscape(getUndeliveredStatusLabel(row.status))}</td>
                <td><span class="req-age-badge ${bucket.className}" title="${undEscape(bucket.label)}">${age}d</span></td>
                <td>${undEscape(row.remarks || row.contact || '—')}</td>
                <td class="req-actions-cell">
                    ${canEdit ? `
                        <button type="button" class="btn btn-ghost btn-sm" data-und-action="edit" data-und-id="${undEscape(row.id)}">Edit</button>
                        ${UNDELIVERED_OPEN.has(row.status) ? `
                            <button type="button" class="btn btn-primary btn-sm" data-und-action="partial" data-und-id="${undEscape(row.id)}">Part Delivered</button>
                            <button type="button" class="btn btn-success btn-sm" data-und-action="deliver" data-und-id="${undEscape(row.id)}">Mark Delivered</button>
                        ` : ''}
                        <button type="button" class="btn btn-danger btn-sm" data-und-action="delete" data-und-id="${undEscape(row.id)}">Delete</button>
                    ` : '—'}
                </td>
            </tr>
        `;
    }).join('');
}

function renderUndeliveredModule() {
    populateUndeliveredSelects();
    renderUndeliveredSummary();
    renderUndeliveredTable();
}

function populateUndeliveredSelects() {
    const cat = document.getElementById('undCategory');
    if (cat && !cat.dataset.ready) {
        cat.innerHTML = UNDELIVERED_CATEGORIES.map((c) => `<option value="${undEscape(c)}">${undEscape(c)}</option>`).join('');
        cat.dataset.ready = '1';
    }
    const status = document.getElementById('undStatus');
    if (status && !status.dataset.ready) {
        status.innerHTML = UNDELIVERED_STATUSES.map((s) => `<option value="${undEscape(s.value)}">${undEscape(s.label)}</option>`).join('');
        status.dataset.ready = '1';
    }
    const filterCat = document.getElementById('undFilterCategory');
    if (filterCat && !filterCat.dataset.ready) {
        filterCat.innerHTML = `<option value="all">All categories</option>`
            + UNDELIVERED_CATEGORIES.map((c) => `<option value="${undEscape(c)}">${undEscape(c)}</option>`).join('');
        filterCat.dataset.ready = '1';
    }
}

function initUndeliveredModule() {
    const moduleEl = document.getElementById('undelivered-orders');
    if (!moduleEl || moduleEl.dataset.undInit === '1') return;
    moduleEl.dataset.undInit = '1';

    populateUndeliveredSelects();
    clearUndeliveredForm();

    // Seed Nov 2026 register once if empty
    if (!ensureUndelivered().length && typeof canEditData === 'function' && canEditData()) {
        const result = seedUndeliveredFromRegister();
        if (result.added && typeof saveState === 'function') saveState();
        if (result.added) {
            showToast(`Loaded ${result.added} undelivered PO lines from Nov 2026 register.`);
        }
    }

    document.getElementById('undSaveBtn')?.addEventListener('click', saveUndeliveredFromForm);
    document.getElementById('undClearBtn')?.addEventListener('click', () => {
        if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;
        clearUndeliveredForm();
    });
    document.getElementById('undImportSeedBtn')?.addEventListener('click', () => {
        if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;
        const existing = ensureUndelivered().length;
        if (existing) {
            const ok = window.confirm(`Replace current ${existing} line(s) with the Nov 2026 undelivered register?`);
            if (!ok) return;
            seedUndeliveredFromRegister({ force: true });
        } else {
            seedUndeliveredFromRegister();
        }
        if (typeof saveState === 'function') saveState();
        clearUndeliveredForm();
        renderUndeliveredModule();
        if (typeof updateSystemAlerts === 'function') updateSystemAlerts();
        showToast('Undelivered register loaded.');
    });

    document.getElementById('undFilterStatus')?.addEventListener('change', renderUndeliveredTable);
    document.getElementById('undFilterCategory')?.addEventListener('change', renderUndeliveredTable);
    document.getElementById('undTableSearch')?.addEventListener('input', renderUndeliveredTable);
    document.getElementById('undTableSearch')?.addEventListener('search-history-commit', renderUndeliveredTable);
    moduleEl.querySelector('.btn-table-search')?.addEventListener('click', renderUndeliveredTable);
    moduleEl.querySelector('.btn-table-search-clear')?.addEventListener('click', () => {
        setTimeout(renderUndeliveredTable, 0);
    });

    document.getElementById('undelivered-table-body')?.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-und-action]');
        if (!btn) return;
        const id = btn.dataset.undId;
        const action = btn.dataset.undAction;
        if (action === 'edit') editUndelivered(id);
        if (action === 'deliver') setUndeliveredStatus(id, 'delivered');
        if (action === 'partial') {
            const row = ensureUndelivered().find((r) => r.id === id);
            if (!row) return;
            const input = window.prompt(`Qty delivered so far for "${row.item}" (ordered ${row.qty}):`, String(row.qtyDelivered || 0));
            if (input == null) return;
            const delivered = parseFloat(input);
            if (Number.isNaN(delivered) || delivered < 0) {
                showToast('Enter a valid delivered quantity.', 'error');
                return;
            }
            if (delivered >= row.qty) setUndeliveredStatus(id, 'delivered', row.qty);
            else setUndeliveredStatus(id, 'partial', delivered);
        }
        if (action === 'delete') deleteUndelivered(id);
    });

    if (typeof bindSearchHistory === 'function') {
        const searchEl = document.getElementById('undTableSearch');
        if (searchEl) bindSearchHistory(searchEl);
    }

    renderUndeliveredModule();
}
