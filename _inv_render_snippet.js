function syncOpeningInputsFromState() {
    document.querySelectorAll('.voucher-inv-opening').forEach((input) => {
        const key = input.dataset.invCat;
        if (key == null) return;
        input.value = getCategoryStockSummary(key).opening;
    });
}

function buildVoucherInventorySection() {
    const host = document.getElementById('voucherInventorySection');
    if (!host) return;
    if (host.dataset.built === '1') {
        const tabCount = host.querySelectorAll('.voucher-inv-tab').length;
        if (tabCount === (VOUCHER_INVENTORY_CATEGORIES || []).length) return;
        host.dataset.built = '0';
        host.innerHTML = '';
    }

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
                    <p>${invHtmlEscape(cat.detail)} · GL ${invHtmlEscape(cat.gl || '—')}</p>
                </div>
                <div class="voucher-inv-opening-wrap">
                    <label>Category Opening Total</label>
                    <input type="number" class="form-control voucher-inv-opening" data-inv-cat="${cat.key}" min="0" step="1" value="0" readonly title="Sum of item openings">
                </div>
            </div>
            <div class="voucher-inv-metrics">
                <div><span>Received</span><strong class="inv-received" data-inv-received="${cat.key}">0</strong></div>
                <div><span>Issued</span><strong class="inv-issued" data-inv-issued="${cat.key}">0</strong></div>
                <div><span>On Hand</span><strong class="inv-onhand" data-inv-onhand="${cat.key}">0</strong></div>
            </div>

            <h5 class="voucher-inv-subtitle">Item Stock Balances</h5>
            <div class="module-toolbar">
                <input type="search" class="form-control table-search" data-search-target="voucher-inv-items-${cat.key}" placeholder="Search catalog items in this category...">
                <button type="button" class="btn btn-primary btn-sm btn-table-search">Search</button>
                <button type="button" class="btn btn-ghost btn-sm btn-table-search-clear">Clear</button>
            </div>
            <div class="form-table-wrapper">
                <table class="overview-table voucher-inv-table">
                    <thead>
                        <tr>
                            <th>Catalog Item</th>
                            <th>Opening</th>
                            <th>Received</th>
                            <th>Issued</th>
                            <th>On Hand</th>
                        </tr>
                    </thead>
                    <tbody id="voucher-inv-items-${cat.key}" data-inventory-view="1"></tbody>
                </table>
            </div>

            <h5 class="voucher-inv-subtitle">Receive / Issue Movements</h5>
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
                <p>Official IT Directorate catalog · Receive from suppliers · Issue to users · Start of Day / Day End reconcile</p>
            </div>
        </div>

        <div class="store-stock-actions" role="group" aria-label="Stock actions">
            <button type="button" class="btn btn-success" id="btnReceiveStock">＋ Receive</button>
            <button type="button" class="btn btn-danger" id="btnIssueStock">− Issue</button>
            <button type="button" class="btn btn-primary" id="btnStartStoreDay">Start of Day</button>
            <button type="button" class="btn btn-secondary" id="btnDayEndReconcile">Day End Reconcile</button>
            <button type="button" class="btn btn-ghost btn-sm" id="refreshVoucherInventoryBtn">Refresh</button>
        </div>

        <div id="storeDaySessionBanner" class="store-day-banner" aria-live="polite"></div>

        <div class="voucher-inv-tabs" id="voucherInvTabs">${tabs}</div>
        <div class="voucher-inv-panels" id="voucherInvPanels">${panels}</div>
    `;
    host.dataset.built = '1';

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

    document.getElementById('btnReceiveStock')?.addEventListener('click', () => openReceiveIssueModal('receipt'));
    document.getElementById('btnIssueStock')?.addEventListener('click', () => openReceiveIssueModal('issue'));
    document.getElementById('btnStartStoreDay')?.addEventListener('click', startStoreDay);
    document.getElementById('btnDayEndReconcile')?.addEventListener('click', openDayEndReconcileModal);
    document.getElementById('refreshVoucherInventoryBtn')?.addEventListener('click', () => {
        renderVoucherInventoryTables();
        showToast('Inventory refreshed.', 'info');
    });

    syncOpeningInputsFromState();
    if (typeof initTableSearch === 'function') initTableSearch();
}

function renderVoucherInventoryTables() {
    ensureStoresInventory();
    buildVoucherInventorySection();
    const host = document.getElementById('voucherInventorySection');
    if (!host) return;

    syncOpeningInputsFromState();
    updateDaySessionBanner();

    VOUCHER_INVENTORY_CATEGORIES.forEach((cat) => {
        const summary = getCategoryStockSummary(cat.key);
        const catalogItems = typeof getCatalogItemsForCategory === 'function'
            ? getCatalogItemsForCategory(cat.key)
            : [];

        const itemRows = catalogItems.map((item) => getItemStockSummary(item.id))
            .filter((row) => row.opening || row.received || row.issued || row.onHand);

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
            if (!itemRows.length) {
                itemsBody.innerHTML = `<tr class="empty-inv-row"><td colspan="5">No stock recorded for this catalog yet. Use <strong>Start of Day</strong> or <strong>Receive</strong> to post items.</td></tr>`;
            } else {
                itemsBody.innerHTML = itemRows.map((row) => `
                    <tr>
                        <td>${invHtmlEscape(row.item)}</td>
                        <td>${row.opening}</td>
                        <td class="inv-received">${row.received}</td>
                        <td class="inv-issued">${row.issued}</td>
                        <td><strong class="${row.onHand <= 0 ? 'stock-depleted' : 'inv-onhand'}">${row.onHand}</strong></td>
                    </tr>
                `).join('');
            }
        }

        if (tbody) {
            const rows = summary.transactions;
            if (!rows.length) {
                tbody.innerHTML = `<tr class="empty-inv-row"><td colspan="11">No receive/issue movements yet for ${invHtmlEscape(cat.label)}.</td></tr>`;
            } else {
                tbody.innerHTML = rows.map((txn, idx) => {
                    const isReceipt = txn.type === 'receipt';
                    return `
                        <tr>
                            <td>${idx + 1}</td>
                            <td>${invHtmlEscape(txn.date || '—')}</td>
                            <td><span class="txn-badge ${isReceipt ? 'txn-receipt' : 'txn-issue'}">${isReceipt ? 'Receive' : 'Issue'}</span></td>
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

