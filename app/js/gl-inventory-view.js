/* Per-GL inventory table view (View Inventory / Edit Ledger) */

const GL_INVENTORY_VIEW_MODULES = [
    {
        moduleId: 'gl-2200600002',
        tbodyId: 'gl-2200600002-table-body',
        label: 'Computer Consumables',
        model: 'consumables',
        headers: ['Date', 'Voucher No.', 'Received From / Issued To', 'Cat or Part No', 'Designation', 'Entitlement', 'Initial of Officer']
    },
    {
        moduleId: 'gl-2200600003',
        tbodyId: 'gl-2200600003-table-body',
        label: 'Software Licences',
        model: 'ledger',
        headers: ['Date', 'Consignor / Consignee', 'Receipts', 'Issues', 'Stock', 'Voucher / QM Signature', 'Number and Name']
    },
    {
        moduleId: 'gl-2201900002',
        tbodyId: 'gl-2201900002-table-body',
        label: 'Spare Parts',
        model: 'ledger',
        headers: ['Date', 'Consignor / Consignee', 'Receipts', 'Issues', 'Stock', 'Voucher / QM Signature', 'Number and Name']
    },
    {
        moduleId: 'gl-3112210001',
        tbodyId: 'gl-3112210001-table-body',
        label: 'ICT Equipment',
        model: 'ledger',
        headers: ['Date', 'Consignor / Consignee', 'Receipts', 'Issues', 'Stock', 'Voucher / QM Signature', 'Number and Name']
    }
];

function getGlInventoryModuleConfig(moduleId) {
    return GL_INVENTORY_VIEW_MODULES.find((m) => m.moduleId === moduleId) || null;
}

function readGlInventoryRows(moduleId, tbodyId) {
    const tbody = document.getElementById(tbodyId);
    const rows = [];
    if (tbody) {
        tbody.querySelectorAll('tr').forEach((tr) => {
            const inputs = tr.querySelectorAll('input, select, textarea');
            const values = [...inputs].map((el) => {
                if (el.tagName === 'SELECT') return el.options[el.selectedIndex]?.text || el.value || '';
                return String(el.value || '').trim();
            });
            if (values.some((v) => String(v || '').trim() !== '')) {
                rows.push(values);
            }
        });
        return rows;
    }

    const saved = appState.modules?.[moduleId]?.tables?.[tbodyId] || [];
    return saved.map((row) => (row.cells || []).map((c) => String(c?.value ?? '').trim()))
        .filter((values) => values.some(Boolean));
}

function getGlInventoryTotals(moduleId) {
    const cfg = getGlInventoryModuleConfig(moduleId);
    if (!cfg) return { opening: 0, receipts: 0, issues: 0, onHand: 0 };
    if (cfg.model === 'consumables' && typeof getConsumablesInventory === 'function') {
        return getConsumablesInventory();
    }
    if (typeof getLedgerInventory === 'function') {
        return getLedgerInventory(cfg.moduleId, cfg.tbodyId);
    }
    return { opening: 0, receipts: 0, issues: 0, onHand: 0 };
}

function ensureGlInventoryViewShell(cfg) {
    const moduleEl = document.getElementById(cfg.moduleId);
    if (!moduleEl || moduleEl.dataset.glInvView === '1') return moduleEl;
    moduleEl.dataset.glInvView = '1';

    const header = moduleEl.querySelector('.form-header');
    if (!header) return moduleEl;

    const modeBar = document.createElement('div');
    modeBar.className = 'gl-inv-mode-bar';
    modeBar.innerHTML = `
        <div class="gl-inv-mode-toggle" role="group" aria-label="Inventory view mode">
            <button type="button" class="btn btn-secondary btn-sm gl-inv-view-btn" data-gl-mode="view">View Inventory Table</button>
            <button type="button" class="btn btn-ghost btn-sm gl-inv-edit-btn" data-gl-mode="edit">Edit Ledger</button>
        </div>
        <p class="gl-inv-mode-hint">View shows the read-only stock movement table for this GL. Switch to Edit Ledger to add or change lines.</p>
    `;
    header.insertAdjacentElement('afterend', modeBar);

    const viewPanel = document.createElement('div');
    viewPanel.className = 'gl-inv-view-panel';
    viewPanel.id = `${cfg.moduleId}-view-panel`;
    viewPanel.innerHTML = `
        <div class="gl-inv-summary-strip">
            <div class="gl-inv-summary-stat"><span>Opening (B/F)</span><strong data-gl-sum="opening">0</strong></div>
            <div class="gl-inv-summary-stat"><span>Received</span><strong class="inv-received" data-gl-sum="receipts">0</strong></div>
            <div class="gl-inv-summary-stat"><span>Issued</span><strong class="inv-issued" data-gl-sum="issues">0</strong></div>
            <div class="gl-inv-summary-stat"><span>On Hand</span><strong class="inv-onhand" data-gl-sum="onHand">0</strong></div>
            <div class="gl-inv-summary-stat"><span>Lines</span><strong data-gl-sum="lines">0</strong></div>
        </div>
        <div class="module-toolbar">
            <input type="search" class="form-control" id="${cfg.moduleId}-view-search" placeholder="Search inventory lines...">
            <button type="button" class="btn btn-primary btn-sm" data-gl-view-search="${cfg.moduleId}">Search</button>
            <button type="button" class="btn btn-ghost btn-sm" data-gl-view-clear="${cfg.moduleId}">Clear</button>
        </div>
        <div class="form-table-wrapper">
            <table class="overview-table gl-inv-view-table">
                <thead>
                    <tr>${cfg.headers.map((h) => `<th>${h}</th>`).join('')}</tr>
                </thead>
                <tbody id="${cfg.moduleId}-view-body"></tbody>
            </table>
        </div>
        <div class="gl-inv-view-actions">
            <button type="button" class="btn btn-primary btn-sm" data-gl-mode="edit">Edit this ledger</button>
            <button type="button" class="btn btn-secondary btn-sm btn-generate-report" data-report-module="${cfg.moduleId}">Generate Report</button>
        </div>
    `;

    // Wrap remaining content (except header + mode bar + view panel) as edit panel
    const editPanel = document.createElement('div');
    editPanel.className = 'gl-inv-edit-panel';
    editPanel.id = `${cfg.moduleId}-edit-panel`;
    editPanel.hidden = true;

    const toMove = [];
    let node = modeBar.nextSibling;
    while (node) {
        const next = node.nextSibling;
        if (node.nodeType === 1 || (node.nodeType === 3 && String(node.textContent || '').trim())) {
            toMove.push(node);
        }
        node = next;
    }
    toMove.forEach((n) => editPanel.appendChild(n));
    modeBar.insertAdjacentElement('afterend', viewPanel);
    viewPanel.insertAdjacentElement('afterend', editPanel);

    modeBar.querySelectorAll('[data-gl-mode]').forEach((btn) => {
        btn.addEventListener('click', () => setGlInventoryMode(cfg.moduleId, btn.dataset.glMode));
    });
    viewPanel.querySelectorAll('[data-gl-mode]').forEach((btn) => {
        btn.addEventListener('click', () => setGlInventoryMode(cfg.moduleId, btn.dataset.glMode));
    });

    const searchInput = document.getElementById(`${cfg.moduleId}-view-search`);
    viewPanel.querySelector(`[data-gl-view-search="${cfg.moduleId}"]`)?.addEventListener('click', () => {
        renderGlInventoryView(cfg.moduleId);
    });
    viewPanel.querySelector(`[data-gl-view-clear="${cfg.moduleId}"]`)?.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        renderGlInventoryView(cfg.moduleId);
    });
    searchInput?.addEventListener('input', () => renderGlInventoryView(cfg.moduleId));
    searchInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            renderGlInventoryView(cfg.moduleId);
        }
    });

    if (typeof bindSearchHistory === 'function' && searchInput) {
        bindSearchHistory(searchInput);
    }

    moduleEl.querySelector('.btn-save-module')?.addEventListener('click', () => {
        setTimeout(() => {
            renderGlInventoryView(cfg.moduleId);
            setGlInventoryMode(cfg.moduleId, 'view');
        }, 120);
    });

    return moduleEl;
}

function setGlInventoryMode(moduleId, mode) {
    const cfg = getGlInventoryModuleConfig(moduleId);
    if (!cfg) return;
    ensureGlInventoryViewShell(cfg);

    const isView = mode !== 'edit';
    const viewPanel = document.getElementById(`${moduleId}-view-panel`);
    const editPanel = document.getElementById(`${moduleId}-edit-panel`);
    const moduleEl = document.getElementById(moduleId);
    if (viewPanel) viewPanel.hidden = !isView;
    if (editPanel) editPanel.hidden = isView;

    moduleEl?.querySelectorAll('.gl-inv-view-btn').forEach((btn) => {
        btn.classList.toggle('btn-secondary', isView);
        btn.classList.toggle('btn-ghost', !isView);
    });
    moduleEl?.querySelectorAll('.gl-inv-edit-btn').forEach((btn) => {
        btn.classList.toggle('btn-secondary', !isView);
        btn.classList.toggle('btn-ghost', isView);
    });

    if (!moduleEl) return;
    moduleEl.dataset.glInvMode = isView ? 'view' : 'edit';
    if (isView) renderGlInventoryView(moduleId);
}

function renderGlInventoryView(moduleId) {
    const cfg = getGlInventoryModuleConfig(moduleId);
    if (!cfg) return;
    ensureGlInventoryViewShell(cfg);

    const totals = getGlInventoryTotals(moduleId);
    const viewPanel = document.getElementById(`${moduleId}-view-panel`);
    if (viewPanel) {
        const setSum = (key, value) => {
            const el = viewPanel.querySelector(`[data-gl-sum="${key}"]`);
            if (el) el.textContent = typeof formatStockQty === 'function' ? formatStockQty(value) : String(value ?? 0);
        };
        setSum('opening', totals.opening);
        setSum('receipts', totals.receipts);
        setSum('issues', totals.issues);
        setSum('onHand', totals.onHand);
    }

    let rows = readGlInventoryRows(cfg.moduleId, cfg.tbodyId);
    const search = String(document.getElementById(`${moduleId}-view-search`)?.value || '').trim().toLowerCase();
    if (search) {
        rows = rows.filter((r) => r.some((cell) => String(cell || '').toLowerCase().includes(search)));
    }

    if (viewPanel) {
        const linesEl = viewPanel.querySelector('[data-gl-sum="lines"]');
        if (linesEl) linesEl.textContent = String(rows.length);
    }

    const tbody = document.getElementById(`${moduleId}-view-body`);
    if (!tbody) return;

    const colCount = cfg.headers.length;
    if (!rows.length) {
        tbody.innerHTML = `<tr><td colspan="${colCount}" class="empty-state">No inventory lines yet. Switch to Edit Ledger to add receipts and issues.</td></tr>`;
        return;
    }

    const esc = typeof invEscape === 'function'
        ? invEscape
        : (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    tbody.innerHTML = rows.map((values) => {
        const cells = [];
        for (let i = 0; i < colCount; i += 1) {
            const raw = values[i] ?? '';
            cells.push(`<td>${esc(raw)}</td>`);
        }
        return `<tr>${cells.join('')}</tr>`;
    }).join('');
}

function initGlInventoryViews() {
    GL_INVENTORY_VIEW_MODULES.forEach((cfg) => {
        ensureGlInventoryViewShell(cfg);
        setGlInventoryMode(cfg.moduleId, 'view');
    });
}

function openGlInventoryView(moduleId) {
    if (typeof navigateToModule === 'function') {
        navigateToModule(moduleId);
    }
    setTimeout(() => setGlInventoryMode(moduleId, 'view'), 0);
}

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initGlInventoryViews, 60);
});
