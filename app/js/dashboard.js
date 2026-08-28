/* dashboard.js — KPIs, navigation, release cut, theme */

function getModuleLabel(moduleId) {
    const labels = {
        'dashboard': 'Dashboard Overview',
        'gl-2200600002': 'GL 6122100009 - ZOFF / Office Supplies & Services',
        'gl-2200600003': 'GL 2200600003 - Software Licenses',
        'gl-220200002': 'GL 220200002 - Tech Equipment Maintenance',
        'gl-3112210001': 'GL 3112210001 - ICT Equipment',
        'gl-2201900002': 'GL 2201900002 - Spare Parts',
        'voucher-module': 'Issue Voucher / ZNA-Q-1033',
        'stock-take': 'Stock Take — Full Stores Inventory',
        'unit-checks': 'Unit Check Log — ASO Ch 28',
        'financial-year-bids': 'Financial Year Bids',
        'unit-equipment': 'Unit Equipment',
        'ict-accountability': 'ZNA ICT Asset Register',
        'ict-distribution': 'ICT Equipment Distribution Lists',
        'temporary-loans': 'Temporary Loans — Controlled Stores',
        'permanent-loans': 'Permanent Loans — Laptops & iPads',
        'orderly-room': 'Orderly Room — DF & Correspondence Files',
        'it-dir-comms': 'IT Directorate — Communications Portal',
        'unit-requisitions': 'Requisitions — In-tray',
        'monthly-target-proposal': 'IT Dir Monthly Target / Priority List',
        'daf-fund-request-memo': 'DAF Fund Request Memo',
        'monthly-returns': 'Monthly Returns — Unit ICT Equipment',
        'spec-evaluation': 'Spec/Tech Evaluation',
        'ict-compare': 'Workshop — Head-to-head ICT comparison',
        'guide-quotation': 'Rough Guide Quotation',
        'dp-f1-form': 'DP F1 Form',
        'cost-comparative-schedule': 'Cost Comparative Schedule',
        'stores-inventory': 'Stores Inventory',
        'inventory-accountability': 'Inventory Accountability',
        'stakeholder-desk': 'Portals — DP / GS Branch / DAF / Due Diligence / Supplier',
        'portals-board': 'Portals — procurement workflow dashboard',
        'zna-q-982': 'ZNA Q 982 — Combined Indent',
        'zna-q-178': 'ZNA Q 178 — Sub Ledger Sheet',
        'zna-q-1033': 'ZNA Q 1033 — Issue & Receipt Voucher',
        'zna-q-1043': 'ZNA Q 1043 — Condemnation Certificate',
        'zna-q-80': 'ZNA Q 80 — Ledger Sheet',
        'zna-svcs-890': 'ZNA SVCS/890 — Demand / Issue',
        'zna-q-1179': 'ZNA Q 1179 — Clothing Issue Voucher',
        'zna-q-987': 'ZNA Q 987 — Stocktaking Certificate',
        'zna-q-3977': 'ZNA Q 3977 — Neglect / Damage Report',
        'zna-q-985': 'ZNA Q 985 — Discrepancy Report',
        'zna-q-1': 'ZNA Q 1 — Statement of stores lost or damaged to be written off',
        'zna-q-998': 'ZNA Q 998 — Statement of Loss / Damage / Destruction',
        'zna-q-1680': 'ZNA Q 1680 — Miscellaneous credit/debit voucher',
        'zna-q-forms-index': 'SUMMARY OF Q FORMS — Index',
        'zna-q-3': 'ZNA Q 3 — Issue to Government department on repayment',
        'zna-q-31': 'ZNA Q 31 — Cash purchase / receipt',
        'zna-q-40': 'ZNA Q 40 — Artisan tools list',
        'zna-q-1049': 'ZNA Q 1049 — Transfer voucher',
        'zna-q-1229': 'ZNA Q 1229 — Certificate of accidental breakage',
        'zna-q-1571': 'ZNA Q 1571 — Debit voucher',
        'zna-q-1954': 'ZNA Q 1954 — Recoveries from individuals',
        'zna-svcs-1045': 'ZNA SVCS 1045 — Workshop Indent',
        'zna-q-1157': 'ZNA Q 1157 — Clothing & Equipment Record',
        'accommodation-stores': 'Inventory of Accommodation Stores',
        'delivery-note': 'Delivery Note',
        'purchase-orders': 'Purchase Orders',
        'undelivered-orders': 'Undelivered Items',
        'supplier-debts': 'Supplier Debts — Non-paid goods received',
        'workshop-repairs': 'Workshop Register',
        'gate-register': 'Gate Register (RP)',
        'techstores-equipment-register': 'TechStores Equipment Register',
        'suppliers-contracts': 'Suppliers and Contracts',
        'release-cut': 'Release Cut',
        'stores-inventory': 'Stores Inventory',
        'duties-roles': 'Duties & Roles — Storeman / QM / Controlled Stores NCO',
        'process-guides': 'Learning Centre — Process & Charts',
        'system-help': 'System Help / Dictionary',
        'reports-module': 'Reports',
        'techstores-period': 'TechStores Period Report',
        'user-management': 'User Management'
    };
    return labels[moduleId] || 'Record';
}

function getBidCommittedByGl() {
    const committed = {};
    Object.keys(GL_ACCOUNTS).forEach((gl) => { committed[gl] = 0; });

    const bids = appState.modules['financial-year-bids'];
    if (!bids || !bids.tables || !bids.tables['bids-table-body']) return committed;

    bids.tables['bids-table-body'].forEach((row) => {
        const cells = row.cells || [];
        const glSelect = cells[3];
        const qty = parseFloat(cells[5]?.value) || 0;
        const unitCost = parseFloat(cells[6]?.value) || 0;
        const totalCost = parseFloat(cells[7]?.value) || (qty * unitCost);
        const gl = glSelect?.value;
        if (gl && committed[gl] !== undefined) {
            committed[gl] += totalCost;
        }
    });

    return committed;
}

function getPurchaseOrderCommittedByGl() {
    const committed = {};
    Object.keys(GL_ACCOUNTS).forEach((gl) => { committed[gl] = 0; });

    const poModule = appState.modules['purchase-orders'];
    if (!poModule || !poModule.tables || !poModule.tables['purchase-orders-table-body']) {
        return committed;
    }

    poModule.tables['purchase-orders-table-body'].forEach((row) => {
        if (typeof isPurchaseOrderRegisterRowCancelled === 'function' && isPurchaseOrderRegisterRowCancelled(row)) {
            return;
        }
        const cells = row.cells || [];
        const layout = detectPurchaseOrderRowLayout(cells);
        const glCell = layout.gl >= 0 ? cells[layout.gl] : null;
        const gl = glCell?.value;
        const amount = parseFloat(cells[layout.amount]?.value) || 0;
        if (gl && committed[gl] !== undefined && amount > 0) {
            committed[gl] += amount;
        }
    });

    return committed;
}

function getDpF1CommittedByGl() {
    const committed = {};
    Object.keys(GL_ACCOUNTS).forEach((gl) => { committed[gl] = 0; });

    const liveCost = document.getElementById('dpF1EstimatedCost')?.value;
    const liveGl = document.getElementById('dpF1Gl')?.value;
    let amount = parseFloat(String(liveCost || '').replace(/[^0-9.-]/g, '')) || 0;
    let gl = liveGl || '';

    if (!amount || !gl) {
        const dpForm = appState.modules['dp-f1-form'];
        const fields = dpForm?.fields || [];
        const byId = Object.fromEntries(fields.filter((f) => f.id).map((f) => [f.id, f]));
        if (!amount) {
            amount = parseFloat(String(byId.dpF1EstimatedCost?.value || '').replace(/[^0-9.-]/g, '')) || 0;
        }
        if (!gl) gl = byId.dpF1Gl?.value || '';
    }

    if (gl && committed[gl] !== undefined && amount > 0) {
        committed[gl] += amount;
    }

    return committed;
}

function getCommittedByGl() {
    const baseCommitted = getBaseCommittedByGl();
    const voucherImpact = getVoucherImpactByGl();
    const total = {};

    Object.keys(GL_ACCOUNTS).forEach((gl) => {
        total[gl] = (baseCommitted[gl] || 0) + (voucherImpact[gl] || 0);
    });

    return total;
}

function getGlBalance(gl) {
    if (typeof getGlMonthlyBalance === 'function') {
        return getGlMonthlyBalance(gl, typeof getSelectedGlTargetMonth === 'function' ? getSelectedGlTargetMonth() : undefined);
    }
    const budget = appState.glBudgets[gl] || 0;
    const baseCommitted = getBaseCommittedByGl()[gl] || 0;
    const voucherImpact = getVoucherImpactByGl()[gl] || 0;
    return budget - baseCommitted - voucherImpact;
}

function getBudgetStatus(budget, balance) {
    if (typeof getTargetStatus === 'function') return getTargetStatus(budget, balance);
    if (budget <= 0) return { label: 'No vote', className: 'status-neutral' };
    const ratio = balance / budget;
    if (ratio < 0) return { label: 'Overdrawn', className: 'status-critical' };
    if (ratio < 0.2) return { label: 'Low Balance', className: 'status-warning' };
    if (ratio < 0.5) return { label: 'Monitor', className: 'status-monitor' };
    return { label: 'On Track', className: 'status-healthy' };
}

function updateGlCard(card, gl, budget, committed, vouchers, breakdown) {
    const balance = budget - committed - vouchers;
    const committedPercent = budget > 0 ? Math.min(100, (committed / budget) * 100) : 0;
    const voucherPercent = budget > 0 ? Math.min(100 - committedPercent, Math.abs(vouchers) / budget * 100) : 0;
    const usedPercent = budget > 0 ? Math.min(100, ((committed + vouchers) / budget) * 100) : 0;

    card.querySelector('.budget-total').textContent = formatCurrency(budget);
    card.querySelector('.budget-committed').textContent = formatCurrency(committed);
    const vouchersEl = card.querySelector('.budget-vouchers');
    if (vouchersEl) {
        vouchersEl.textContent = (vouchers >= 0 ? '+' : '') + formatCurrency(vouchers);
        vouchersEl.style.color = vouchers > 0 ? 'var(--danger)' : vouchers < 0 ? 'var(--success)' : 'inherit';
    }
    const balanceEl = card.querySelector('.budget-balance');
    balanceEl.textContent = formatCurrency(balance);
    balanceEl.style.color = balance < budget * 0.2 ? 'var(--warning)' : 'var(--success)';

    const bidsEl = card.querySelector('.budget-bids');
    const posEl = card.querySelector('.budget-pos');
    const dpf1El = card.querySelector('.budget-dpf1');
    if (bidsEl) bidsEl.textContent = formatCurrency(breakdown.bids || 0);
    if (posEl) posEl.textContent = formatCurrency(breakdown.po || 0);
    if (dpf1El) dpf1El.textContent = formatCurrency(breakdown.dpF1 || 0);

    const committedBar = card.querySelector('[data-budget-bar-committed]');
    const voucherBar = card.querySelector('[data-budget-bar-vouchers]');
    if (committedBar) committedBar.style.width = committedPercent.toFixed(1) + '%';
    if (voucherBar) {
        voucherBar.style.width = voucherPercent.toFixed(1) + '%';
        voucherBar.classList.toggle('credit', vouchers < 0);
    }

    const utilizationEl = card.querySelector('[data-utilization]');
    if (utilizationEl) utilizationEl.textContent = usedPercent.toFixed(1) + '% utilized';

    const statusBadge = card.querySelector('[data-status-badge]');
    if (statusBadge) {
        const status = getBudgetStatus(budget, balance);
        statusBadge.textContent = status.label;
        statusBadge.className = 'card-status-badge ' + status.className;
    }

    return { budget, committed, vouchers, balance, usedPercent };
}

/** Default-collapsed secondary panels (user preference overrides once toggled). */
const DASH_COLLAPSE_DEFAULTS = {
    'system-alerts': true,
    'portfolio-pulse': true,
    'gl-portfolio': true,
    'gl-target-overview': true,
    'inventory-ledgers': true,
    'inventory-recon': true,
    'product-stock': false,
    'dashboard-hero': false
};

function getDashCollapseState() {
    try {
        return JSON.parse(localStorage.getItem('techstores_dash_collapse_v1') || '{}') || {};
    } catch (e) {
        return {};
    }
}

function setDashCollapseState(state) {
    try {
        localStorage.setItem('techstores_dash_collapse_v1', JSON.stringify(state || {}));
    } catch (e) { /* ignore */ }
}

/** One-time: apply Phase-1 “alerts collapsed by default” for existing sessions. */
function migrateDashCollapseDefaults() {
    try {
        if (localStorage.getItem('techstores_dash_collapse_migrated_v2') === '1') return;
        const state = getDashCollapseState();
        state['system-alerts'] = true;
        if (!Object.prototype.hasOwnProperty.call(state, 'inventory-ledgers')) {
            state['inventory-ledgers'] = true;
        }
        if (!Object.prototype.hasOwnProperty.call(state, 'inventory-recon') || state['inventory-recon'] === false) {
            state['inventory-recon'] = true;
        }
        setDashCollapseState(state);
        localStorage.setItem('techstores_dash_collapse_migrated_v2', '1');
    } catch (e) { /* ignore */ }
}

function resolveDashCollapsed(key, stored) {
    if (Object.prototype.hasOwnProperty.call(stored, key)) return !!stored[key];
    return !!DASH_COLLAPSE_DEFAULTS[key];
}

function applyDashCollapsePanel(panel, collapsed) {
    if (!panel) return;
    panel.classList.toggle('is-collapsed', !!collapsed);
    const btn = panel.querySelector('.dash-collapse-toggle');
    if (btn) {
        btn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
        btn.title = collapsed ? 'Expand section' : 'Collapse section';
    }
}

function expandDashCollapseByKey(key) {
    const panel = document.querySelector(`.dash-collapse[data-collapse-key="${key}"]`);
    if (!panel) return;
    applyDashCollapsePanel(panel, false);
    const state = getDashCollapseState();
    state[key] = false;
    setDashCollapseState(state);
}

function initDashboardCollapsibles() {
    migrateDashCollapseDefaults();
    const state = getDashCollapseState();
    document.querySelectorAll('.dash-collapse[data-collapse-key]').forEach((panel) => {
        const key = panel.getAttribute('data-collapse-key');
        if (!key) return;
        applyDashCollapsePanel(panel, resolveDashCollapsed(key, state));
        const btn = panel.querySelector('.dash-collapse-toggle');
        if (!btn || btn.dataset.collapseWired === '1') return;
        btn.dataset.collapseWired = '1';
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const next = !panel.classList.contains('is-collapsed');
            applyDashCollapsePanel(panel, next);
            const s = getDashCollapseState();
            s[key] = next;
            setDashCollapseState(s);
        });
    });
}

function renderBudgetOverviewTable(rows) {
    const tbody = document.getElementById('budgetOverviewBody');
    if (!tbody) return;

    const canEdit = typeof canEditData === 'function' ? canEditData() : true;
    const month = typeof getSelectedGlTargetMonth === 'function' ? getSelectedGlTargetMonth() : '';
    const periodMode = typeof getGlTargetPeriodMode === 'function' ? getGlTargetPeriodMode() : 'month';
    const periodEdit = periodMode === 'month';

    tbody.innerHTML = rows.map((row) => {
        const status = getBudgetStatus(row.budget, row.balance);
        const funding = row.fundingNote || '';
        const isTotal = row.code === 'ALL';
        const proposed = row.proposed != null ? row.proposed : 0;
        const targetCell = isTotal || !canEdit || !periodEdit
            ? formatCurrency(row.budget)
            : `<input type="number" class="form-control gl-target-input" min="0" step="0.01"
                    data-gl-target="${row.code}" value="${row.budget || 0}" title="DAF monthly target / vote for ${row.code}">`;
        const proposedCell = isTotal
            ? formatCurrency(proposed)
            : (proposed > 0
                ? `<strong class="${proposed > row.budget && row.budget > 0 ? 'proposal-over-vote' : 'proposal-ok'}">${formatCurrency(proposed)}</strong>`
                : '—');
        return `
            <tr class="${isTotal ? 'gl-target-total-row' : ''} ${row.budget > 0 ? 'is-funded' : 'is-unfunded'}">
                <td><span class="gl-link" data-target="${row.target}">${row.code}</span><br><small>${row.name}</small>
                    ${!isTotal && funding ? `<div class="gl-funding-note">${funding}</div>` : ''}
                </td>
                <td>${proposedCell}</td>
                <td>${targetCell}</td>
                <td>${formatCurrency(row.committed)}</td>
                <td>${(row.vouchers >= 0 ? '+' : '') + formatCurrency(row.vouchers)}</td>
                <td>${formatCurrency(row.expended != null ? row.expended : (row.committed + row.vouchers))}</td>
                <td><strong class="${row.balance < 0 ? 'buying-power-neg' : 'buying-power-ok'}">${formatCurrency(row.balance)}</strong></td>
                <td><span class="card-status-badge ${status.className}">${status.label}</span></td>
            </tr>
        `;
    }).join('');

    tbody.querySelectorAll('.gl-link').forEach((link) => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            navigateToModule(this.dataset.target);
        });
    });

    tbody.querySelectorAll('.gl-target-input').forEach((input) => {
        input.addEventListener('change', () => {
            const gl = input.getAttribute('data-gl-target');
            if (!gl || typeof setGlMonthlyTarget !== 'function') return;
            if (typeof requireEditAccess === 'function' && !requireEditAccess()) {
                updateDashboard();
                return;
            }
            setGlMonthlyTarget(gl, input.value, month);
            showToast(`DAF target recorded for GL ${gl} · ${typeof formatYmLabel === 'function' ? formatYmLabel(month) : month}. Buying power updated.`, 'success');
            updateDashboard();
            if (typeof refreshReleaseCutBuyingPowerHints === 'function') refreshReleaseCutBuyingPowerHints();
        });
    });
}

function renderRecentTransfers() {
    const listEl = document.getElementById('recentTransfersList');
    if (listEl) {
        const transfers = (appState.releaseCuts || []).slice(-8).reverse();
        if (!transfers.length) {
            listEl.innerHTML = '<li class="empty-state">No release cuts recorded yet.</li>';
        } else {
            listEl.innerHTML = transfers.map((transfer) => `
                <li class="transfer-item">
                    <div><span class="transfer-amount">${formatCurrency(transfer.amount)}</span> from GL ${transfer.fromGl} → GL ${transfer.toGl}</div>
                    <div><small>${transfer.date} · ${transfer.authorizedBy || 'Unknown'} · ${transfer.reason || 'No reason'}</small></div>
                </li>
            `).join('');
        }
    }
    renderReleaseCutsTable();
}

function renderReleaseCutsTable() {
    const tbody = document.getElementById('release-cuts-table-body');
    if (!tbody) return;

    const esc = (value) => String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    const transfers = [...(appState.releaseCuts || [])].reverse();
    if (!transfers.length) {
        tbody.innerHTML = '<tr><td colspan="6">No release cuts recorded yet.</td></tr>';
        return;
    }

    tbody.innerHTML = transfers.map((transfer) => `
        <tr>
            <td>${esc(transfer.date || '')}</td>
            <td>${esc(transfer.fromGl || '')}</td>
            <td>${esc(transfer.toGl || '')}</td>
            <td>${formatCurrency(transfer.amount)}</td>
            <td>${esc(transfer.reason || '')}</td>
            <td>${esc(transfer.authorizedBy || '')}</td>
        </tr>
    `).join('');
}

function countModuleTableRows(moduleId, tbodyId) {
    const moduleData = appState.modules?.[moduleId];
    const rows = moduleData?.tables?.[tbodyId];
    if (Array.isArray(rows)) return rows.length;
    const liveBody = document.getElementById(tbodyId);
    return liveBody ? liveBody.querySelectorAll('tr').length : 0;
}

function updateOpsActivityStrip() {
    const setVal = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = String(value);
    };

    setVal('opsVoucherLines', countModuleTableRows('voucher-module', 'voucher-table-body'));
    setVal('opsBidLines', countModuleTableRows('financial-year-bids', 'bids-table-body'));
    setVal('opsPoLines', countModuleTableRows('purchase-orders', 'purchase-orders-table-body'));
    setVal('opsLoanLines', countModuleTableRows('temporary-loans', 'loans-table-body'));
    setVal('opsWorkshopLines', countModuleTableRows('workshop-repairs', 'workshop-repairs-table-body'));
    setVal('opsTransferCount', (appState.releaseCuts || []).length);
}

function glSummaryShortLabel(gl, name) {
    const map = {
        '6122100009': 'ZOFF',
        '2200600002': 'ZOFF',
        '2200600003': 'Software',
        '220200002': 'Maint',
        '2201900002': 'Spares',
        '3112210001': 'ICT'
    };
    if (map[gl]) return map[gl];
    const n = String(name || gl || '');
    const paren = n.match(/\(([^)]+)\)/);
    if (paren) return paren[1].slice(0, 10);
    return n.split(/\s+/)[0].slice(0, 10) || gl;
}

function glSummaryPaletteHex(code) {
    const map = {
        '6122100009': '#1faa59',
        '2200600002': '#3498db',
        '2200600003': '#9b59b6',
        '220200002': '#e74c3c',
        '2201900002': '#f39c12',
        '3112210001': '#2ecc71'
    };
    return map[code] || '#98a2b3';
}

function glSummaryPaletteCss(code) {
    const map = {
        '6122100009': 'var(--gl-6122100009, #1faa59)',
        '2200600002': 'var(--gl-2200600002, #3498db)',
        '2200600003': 'var(--gl-2200600003, #9b59b6)',
        '220200002': 'var(--gl-220200002, #e74c3c)',
        '2201900002': 'var(--gl-2201900002, #f39c12)',
        '3112210001': 'var(--gl-3112210001, #2ecc71)'
    };
    if (map[code]) return map[code];
    if (typeof GL_ACCOUNTS !== 'undefined' && GL_ACCOUNTS[code]?.colorVar) {
        return `var(${GL_ACCOUNTS[code].colorVar})`;
    }
    return '#667085';
}

/** Build ring slices from monthly target share (fallback: equal slices). */
function buildGlRingSlices(glRows) {
    const rows = (glRows || []).filter((r) => r.code && r.code !== 'ALL');
    const weights = rows.map((r) => Math.max(0, Number(r.budget) || 0));
    const total = weights.reduce((a, b) => a + b, 0);
    return rows.map((r, i) => ({
        code: r.code,
        name: glSummaryShortLabel(r.code, r.name),
        fullName: String(r.name || r.code || ''),
        moduleId: r.target || '',
        color: glSummaryPaletteHex(r.code),
        pct: total > 0 ? (weights[i] / total) * 100 : (rows.length ? 100 / rows.length : 0),
        value: total > 0 ? weights[i] : 0,
        budget: Math.max(0, Number(r.budget) || 0),
        committed: Math.max(0, Number(r.committed) || 0),
        vouchers: Math.max(0, Number(r.vouchers) || 0),
        balance: Number(r.balance) || 0
    }));
}

function glChartEsc(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function ensureGlChartTip() {
    let tip = document.getElementById('glChartTip');
    if (!tip) {
        tip = document.createElement('div');
        tip.id = 'glChartTip';
        tip.className = 'gl-chart-tip';
        tip.setAttribute('role', 'tooltip');
        tip.hidden = true;
        document.body.appendChild(tip);
    }
    return tip;
}

function hideGlChartTip() {
    const tip = document.getElementById('glChartTip');
    if (tip) tip.hidden = true;
}

function showGlChartTip(title, body, clientX, clientY) {
    const tip = ensureGlChartTip();
    tip.innerHTML = `
        <strong>${glChartEsc(title)}</strong>
        <p>${glChartEsc(body)}</p>
        <span class="gl-chart-tip-hint">Click to open GL account</span>`;
    tip.hidden = false;
    const pad = 14;
    tip.style.left = '0px';
    tip.style.top = '0px';
    const place = () => {
        const rect = tip.getBoundingClientRect();
        let x = clientX + pad;
        let y = clientY + pad;
        if (x + rect.width > window.innerWidth - 8) x = clientX - rect.width - pad;
        if (y + rect.height > window.innerHeight - 8) y = clientY - rect.height - pad;
        tip.style.left = `${Math.max(8, x)}px`;
        tip.style.top = `${Math.max(8, y)}px`;
    };
    place();
    requestAnimationFrame(place);
}

function openGlFromChart(moduleId) {
    if (!moduleId) return;
    hideGlChartTip();
    if (typeof navigateToModule === 'function') navigateToModule(moduleId);
}

function wireGlChartInteractions(root) {
    if (!root) return;
    if (!window.__glChartTipGlobalBound) {
        window.__glChartTipGlobalBound = true;
        window.addEventListener('scroll', hideGlChartTip, true);
        window.addEventListener('blur', hideGlChartTip);
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') hideGlChartTip();
        });
    }
    root.querySelectorAll('[data-gl-nav]').forEach((el) => {
        if (el.dataset.glWired === '1') return;
        el.dataset.glWired = '1';
        const title = () => el.getAttribute('data-gl-title') || '';
        const body = () => el.getAttribute('data-gl-body') || '';
        el.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            openGlFromChart(el.getAttribute('data-gl-nav'));
        });
        el.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openGlFromChart(el.getAttribute('data-gl-nav'));
            }
        });
        el.addEventListener('mousemove', (e) => {
            showGlChartTip(title(), body(), e.clientX, e.clientY);
        });
        el.addEventListener('mouseenter', (e) => {
            showGlChartTip(title(), body(), e.clientX, e.clientY);
        });
        el.addEventListener('mouseleave', hideGlChartTip);
        el.addEventListener('focus', () => {
            const r = el.getBoundingClientRect();
            showGlChartTip(title(), body(), r.left + r.width / 2, r.top);
        });
        el.addEventListener('blur', hideGlChartTip);
    });
}

function glDonutSlicePath(cx, cy, rOuter, rInner, startDeg, endDeg) {
    const toRad = (d) => (d * Math.PI) / 180;
    const x0 = cx + rOuter * Math.cos(toRad(startDeg));
    const y0 = cy + rOuter * Math.sin(toRad(startDeg));
    const x1 = cx + rOuter * Math.cos(toRad(endDeg));
    const y1 = cy + rOuter * Math.sin(toRad(endDeg));
    const xi0 = cx + rInner * Math.cos(toRad(startDeg));
    const yi0 = cy + rInner * Math.sin(toRad(startDeg));
    const xi1 = cx + rInner * Math.cos(toRad(endDeg));
    const yi1 = cy + rInner * Math.sin(toRad(endDeg));
    const large = endDeg - startDeg > 180 ? 1 : 0;
    return [
        `M ${x0.toFixed(2)} ${y0.toFixed(2)}`,
        `A ${rOuter} ${rOuter} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`,
        `L ${xi1.toFixed(2)} ${yi1.toFixed(2)}`,
        `A ${rInner} ${rInner} 0 ${large} 0 ${xi0.toFixed(2)} ${yi0.toFixed(2)}`,
        'Z'
    ].join(' ');
}

function renderGlSummaryRing(glRows, usedPercent) {
    const ring = document.getElementById('glSummaryRing');
    const disk = document.getElementById('glSummaryRingDisk');
    const legend = document.getElementById('glSummaryRingLegend');
    const labels = document.getElementById('glSummaryRingLabels');
    const center = document.getElementById('glRingCenterPct');
    const caption = document.getElementById('glRingCaption');
    if (!disk) return;

    const slices = buildGlRingSlices(glRows);
    const hasTarget = slices.some((s) => s.value > 0);

    if (!slices.length) {
        disk.style.background = 'conic-gradient(#e4ebe6 0deg 360deg)';
        if (legend) legend.innerHTML = '';
        if (labels) labels.innerHTML = '';
        if (center) center.textContent = '—';
        if (caption) caption.textContent = 'No GL accounts';
        ring?.querySelector('.gl-ring-hit')?.remove();
        return;
    }

    let cursor = 0;
    const stops = [];
    const gap = slices.length > 1 ? 0.6 : 0;
    const arcMeta = [];
    slices.forEach((s) => {
        const span = Math.max(0, (s.pct / 100) * 360 - gap);
        const start = cursor;
        const end = cursor + span;
        stops.push(`${s.color} ${start.toFixed(2)}deg ${end.toFixed(2)}deg`);
        if (gap > 0) {
            stops.push(`#ffffff ${end.toFixed(2)}deg ${(end + gap).toFixed(2)}deg`);
        }
        arcMeta.push({ ...s, startDeg: start - 90, endDeg: end - 90 });
        cursor = end + gap;
    });
    if (cursor < 360) {
        stops.push(`#eef2f6 ${cursor.toFixed(2)}deg 360deg`);
    }
    disk.style.background = `conic-gradient(from -90deg, ${stops.join(', ')})`;

    if (center) center.textContent = `${Number(usedPercent || 0).toFixed(0)}%`;
    if (caption) {
        caption.textContent = hasTarget
            ? 'Share of monthly DAF target · hover / click a slice'
            : 'Equal mix · set DAF targets to weight the ring · hover / click to open GL';
    }

    if (legend) {
        legend.innerHTML = slices.map((s) => {
            const body = `Target share ${s.pct.toFixed(1)}% · Target ${formatCurrency(s.budget)} · Buying power ${formatCurrency(s.balance)}`;
            return `
            <li>
                <button type="button" class="gl-ring-leg-btn" data-gl-nav="${glChartEsc(s.moduleId)}"
                    data-gl-title="${glChartEsc(s.fullName || s.name)}"
                    data-gl-body="${glChartEsc(body)}"
                    ${s.moduleId ? '' : 'disabled'}>
                    <span class="gl-ring-swatch" style="background:${s.color}"></span>
                    <span class="gl-ring-leg-name">${glChartEsc(s.name)}</span>
                    <span class="gl-ring-leg-leader" aria-hidden="true"></span>
                    <span class="gl-ring-leg-pct">${s.pct.toFixed(1)}%</span>
                </button>
            </li>`;
        }).join('');
    }

    if (labels) {
        let ang = -90;
        labels.innerHTML = slices.map((s) => {
            const span = (s.pct / 100) * 360;
            const mid = ang + span / 2;
            ang += span;
            if (s.pct < 6) return '';
            const rad = (mid * Math.PI) / 180;
            const r = 36;
            const x = 50 + r * Math.cos(rad);
            const y = 50 + r * Math.sin(rad);
            return `<span class="gl-ring-pct" style="left:${x.toFixed(1)}%;top:${y.toFixed(1)}%">${s.pct.toFixed(0)}%</span>`;
        }).join('');
    }

    if (ring) {
        ring.querySelector('.gl-ring-hit')?.remove();
        const hitPaths = arcMeta.map((s) => {
            const body = `Target share ${s.pct.toFixed(1)}% · Target ${formatCurrency(s.budget)} · Committed ${formatCurrency(s.committed)} · Buying power ${formatCurrency(s.balance)}`;
            const d = glDonutSlicePath(50, 50, 49, 28, s.startDeg, Math.max(s.startDeg + 0.2, s.endDeg));
            return `<path class="gl-ring-slice" d="${d}" data-gl-nav="${glChartEsc(s.moduleId)}"
                data-gl-title="${glChartEsc(s.fullName || s.name)}"
                data-gl-body="${glChartEsc(body)}" tabindex="0" role="button"
                aria-label="${glChartEsc((s.fullName || s.name) + ' — open GL')}"></path>`;
        }).join('');
        ring.insertAdjacentHTML('beforeend', `
            <svg class="gl-ring-hit" viewBox="0 0 100 100" aria-hidden="false">${hitPaths}</svg>`);
    }

    wireGlChartInteractions(legend);
    wireGlChartInteractions(ring);
}

function renderGlSummaryBarChart(glRows) {
    const host = document.getElementById('glSummaryBarChart');
    if (!host) return;
    const rows = (glRows || []).filter((r) => r.code && r.code !== 'ALL');
    if (!rows.length) {
        host.innerHTML = '<p class="gl-chart-empty">No GL data</p>';
        return;
    }

    const series = rows.map((r) => ({
        name: glSummaryShortLabel(r.code, r.name),
        fullName: String(r.name || r.code || ''),
        moduleId: r.target || '',
        color: glSummaryPaletteHex(r.code),
        targetAmt: Math.max(0, Number(r.budget) || 0),
        committed: Math.max(0, Number(r.committed) || 0),
        vouchers: Math.max(0, Number(r.vouchers) || 0),
        power: Number(r.balance) || 0
    }));

    const maxAbs = Math.max(
        1,
        ...series.flatMap((s) => [s.targetAmt, s.committed, Math.abs(s.power)])
    );

    const W = 420;
    const H = 128;
    const padL = 28;
    const padR = 8;
    const padT = 10;
    const padB = 28;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;
    const groupW = plotW / series.length;
    const barW = Math.min(10, groupW / 4.2);
    const gap = 2;

    const yScale = (v) => padT + plotH - (Math.max(0, v) / maxAbs) * plotH;
    const hScale = (v) => Math.max(0, (Math.max(0, v) / maxAbs) * plotH);

    const grid = [0.25, 0.5, 0.75, 1].map((t) => {
        const y = padT + plotH * (1 - t);
        return `<line class="gl-chart-grid" x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}"/>`;
    }).join('');

    const groups = series.map((s, i) => {
        const cx = padL + groupW * i + groupW / 2;
        const x0 = cx - (barW * 3 + gap * 2) / 2;
        const powerH = Math.max(hScale(Math.abs(s.power)), s.power !== 0 ? 2 : 0);
        const powerY = yScale(Math.abs(s.power));
        const powerFill = s.power < 0 ? '#d92d20' : '#12b76a';
        const hitX = padL + groupW * i;
        const overview = `Target ${formatCurrency(s.targetAmt)} · Committed ${formatCurrency(s.committed)} · Buying power ${formatCurrency(s.power)}`;
        const attrs = `data-gl-nav="${glChartEsc(s.moduleId)}" data-gl-title="${glChartEsc(s.fullName)}" tabindex="0" role="button"`;
        return `
            <g class="gl-bar-group">
                <rect class="gl-chart-hit" x="${hitX}" y="${padT}" width="${groupW}" height="${plotH + padB - 4}"
                    ${attrs} data-gl-body="${glChartEsc(overview)}" aria-label="${glChartEsc(s.fullName + ' — open GL')}"/>
                <rect class="gl-bar is-target" x="${x0}" y="${yScale(s.targetAmt)}" width="${barW}" height="${Math.max(hScale(s.targetAmt), s.targetAmt ? 2 : 0)}" rx="2"
                    ${attrs} data-gl-body="${glChartEsc(`Target (DAF): ${formatCurrency(s.targetAmt)}`)}"/>
                <rect class="gl-bar is-committed" x="${x0 + barW + gap}" y="${yScale(s.committed)}" width="${barW}" height="${Math.max(hScale(s.committed), s.committed ? 2 : 0)}" rx="2"
                    ${attrs} data-gl-body="${glChartEsc(`Committed: ${formatCurrency(s.committed)}`)}"/>
                <rect class="gl-bar is-power" x="${x0 + (barW + gap) * 2}" y="${powerY}" width="${barW}" height="${powerH}" rx="2" fill="${powerFill}"
                    ${attrs} data-gl-body="${glChartEsc(`Buying power: ${formatCurrency(s.power)}${s.power < 0 ? ' (overdrawn)' : ''}`)}"/>
                <text class="gl-chart-axis gl-chart-axis-link" x="${cx}" y="${H - 8}" text-anchor="middle"
                    ${attrs} data-gl-body="${glChartEsc(overview)}">${glChartEsc(s.name)}</text>
            </g>`;
    }).join('');

    host.innerHTML = `
        <svg class="gl-chart-svg is-interactive" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">
            ${grid}
            <line class="gl-chart-baseline" x1="${padL}" y1="${padT + plotH}" x2="${W - padR}" y2="${padT + plotH}"/>
            ${groups}
        </svg>`;
    wireGlChartInteractions(host);
}

function renderGlSummaryLineChart(glRows) {
    const host = document.getElementById('glSummaryLineChart');
    if (!host) return;
    const rows = (glRows || []).filter((r) => r.code && r.code !== 'ALL');
    if (!rows.length) {
        host.innerHTML = '<p class="gl-chart-empty">No GL data</p>';
        return;
    }

    const points = rows.map((r) => {
        const budget = Math.max(0, Number(r.budget) || 0);
        const spent = Math.max(0, (Number(r.committed) || 0) + (Number(r.vouchers) || 0));
        const util = budget > 0 ? Math.min(160, (spent / budget) * 100) : (spent > 0 ? 100 : 0);
        const power = Number(r.balance) || 0;
        return {
            name: glSummaryShortLabel(r.code, r.name),
            fullName: String(r.name || r.code || ''),
            moduleId: r.target || '',
            color: glSummaryPaletteHex(r.code),
            util,
            power,
            budget,
            committed: Math.max(0, Number(r.committed) || 0),
            vouchers: Math.max(0, Number(r.vouchers) || 0)
        };
    });

    const maxPower = Math.max(1, ...points.map((p) => Math.abs(p.power)));
    const powerIndex = (p) => Math.max(0, Math.min(100, (p.power / maxPower) * 100));

    const W = 420;
    const H = 128;
    const padL = 28;
    const padR = 12;
    const padT = 12;
    const padB = 28;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;
    const n = points.length;
    const xAt = (i) => padL + (n === 1 ? plotW / 2 : (plotW * i) / (n - 1));
    const yUtil = (v) => padT + plotH - (Math.min(100, Math.max(0, v)) / 100) * plotH;
    const yPow = (v) => padT + plotH - (v / 100) * plotH;
    const bandW = n > 1 ? plotW / (n - 1) : plotW;

    const grid = [0, 25, 50, 75, 100].map((t) => {
        const y = yUtil(t);
        return `<line class="gl-chart-grid" x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}"/>
            <text class="gl-chart-tick" x="${padL - 4}" y="${y + 3}" text-anchor="end">${t}</text>`;
    }).join('');

    const utilPath = points.map((p, i) => `${i ? 'L' : 'M'} ${xAt(i).toFixed(1)} ${yUtil(p.util).toFixed(1)}`).join(' ');
    const powerPath = points.map((p, i) => `${i ? 'L' : 'M'} ${xAt(i).toFixed(1)} ${yPow(powerIndex(p)).toFixed(1)}`).join(' ');

    const hits = points.map((p, i) => {
        const cx = xAt(i);
        const overview = `Utilized ${p.util.toFixed(0)}% · Target ${formatCurrency(p.budget)} · Committed ${formatCurrency(p.committed)} · Buying power ${formatCurrency(p.power)}`;
        const attrs = `data-gl-nav="${glChartEsc(p.moduleId)}" data-gl-title="${glChartEsc(p.fullName)}" tabindex="0" role="button"`;
        const bx = n === 1 ? padL : Math.max(padL, cx - bandW / 2);
        const bw = n === 1 ? plotW : Math.min(bandW, W - padR - bx);
        return `
            <rect class="gl-chart-hit" x="${bx}" y="${padT}" width="${bw}" height="${plotH + padB - 4}"
                ${attrs} data-gl-body="${glChartEsc(overview)}" aria-label="${glChartEsc(p.fullName + ' — open GL')}"/>
            <circle class="gl-line-dot is-power" cx="${cx}" cy="${yPow(powerIndex(p))}" r="4"
                ${attrs} data-gl-body="${glChartEsc(`Buying power index · ${formatCurrency(p.power)}`)}"/>
            <circle class="gl-line-dot is-util" cx="${cx}" cy="${yUtil(p.util)}" r="5" fill="${p.color}"
                ${attrs} data-gl-body="${glChartEsc(`Utilized ${p.util.toFixed(0)}% of target (spent ${formatCurrency(p.committed + p.vouchers)})`)}"/>
            <text class="gl-chart-axis gl-chart-axis-link" x="${cx}" y="${H - 8}" text-anchor="middle"
                ${attrs} data-gl-body="${glChartEsc(overview)}">${glChartEsc(p.name)}</text>`;
    }).join('');

    host.innerHTML = `
        <svg class="gl-chart-svg is-interactive" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">
            ${grid}
            <line class="gl-chart-baseline" x1="${padL}" y1="${padT + plotH}" x2="${W - padR}" y2="${padT + plotH}"/>
            <path class="gl-line is-power-line" d="${powerPath}" fill="none"/>
            <path class="gl-line is-util-line" d="${utilPath}" fill="none"/>
            ${hits}
        </svg>`;
    wireGlChartInteractions(host);
}

function updateGlCollapsedSummary(overviewRows, summaryBudget, summaryCommitted, summaryVouchers, summaryBalance) {
    const el = document.getElementById('glCollapsedSummary');
    if (!el) return;

    const usedPercent = summaryBudget > 0
        ? Math.max(0, ((summaryCommitted + summaryVouchers) / summaryBudget) * 100)
        : 0;
    const committedPercent = summaryBudget > 0 ? Math.min(100, (summaryCommitted / summaryBudget) * 100) : 0;
    const voucherPercent = summaryBudget > 0
        ? Math.min(100 - committedPercent, (Math.abs(summaryVouchers) / summaryBudget) * 100)
        : 0;
    const status = getBudgetStatus(summaryBudget, summaryBalance);

    const setText = (id, value) => {
        const node = document.getElementById(id);
        if (node) node.textContent = value;
    };

    setText('glSumTarget', formatCurrency(summaryBudget));
    setText('glSumCommitted', formatCurrency(summaryCommitted));
    setText('glSumBalance', formatCurrency(summaryBalance));
    setText('glSumUtilPct', `${usedPercent.toFixed(1)}%`);

    const vouchersEl = document.getElementById('glSumVouchers');
    if (vouchersEl) {
        vouchersEl.textContent = (summaryVouchers >= 0 ? '+' : '') + formatCurrency(summaryVouchers);
        vouchersEl.classList.toggle('is-voucher-charge', summaryVouchers > 0);
        vouchersEl.classList.toggle('is-voucher-credit', summaryVouchers < 0);
    }

    const balEl = document.getElementById('glSumBalance');
    if (balEl) {
        balEl.classList.toggle('buying-power-ok', summaryBalance >= 0);
        balEl.classList.toggle('buying-power-neg', summaryBalance < 0);
    }

    const committedBar = document.getElementById('glSumUtilCommitted');
    const voucherBar = document.getElementById('glSumUtilVouchers');
    if (committedBar) committedBar.style.width = `${committedPercent.toFixed(1)}%`;
    if (voucherBar) {
        voucherBar.style.left = `${committedPercent.toFixed(1)}%`;
        voucherBar.style.width = `${voucherPercent.toFixed(1)}%`;
    }

    const glRows = (overviewRows || []).filter((r) => r.code && r.code !== 'ALL');
    const chips = document.getElementById('glSummaryChips');
    if (chips) {
        chips.innerHTML = glRows.map((row) => {
            const st = getBudgetStatus(row.budget, row.balance);
            const tone = String(st.className || 'status-neutral').replace('status-', 'is-');
            const short = glSummaryShortLabel(row.code, row.name);
            const target = row.target || '';
            const color = glSummaryPaletteCss(row.code);
            const neg = Number(row.balance) < 0 ? ' is-neg' : '';
            const title = `${String(row.name || row.code)} · Buying power ${formatCurrency(row.balance)} · ${st.label}`;
            return `
                <button type="button" class="gl-summary-bar-row ${tone}${neg}" role="listitem"
                    data-gl-nav="${target}"
                    data-gl-title="${String(row.name || row.code).replace(/"/g, '&quot;')}"
                    data-gl-body="${(`Buying power ${formatCurrency(row.balance)} · Target ${formatCurrency(row.budget)} · Committed ${formatCurrency(row.committed)} · Vouchers ${(row.vouchers >= 0 ? '+' : '') + formatCurrency(row.vouchers)} · ${st.label}`).replace(/"/g, '&quot;')}"
                    data-target="${target}" title="${title.replace(/"/g, '&quot;')}">
                    <span class="gl-summary-bar-name">${short}</span>
                    <span class="gl-summary-bar-pill" style="--pill-base:${color}">${formatCurrency(row.balance)}</span>
                </button>`;
        }).join('');

        wireGlChartInteractions(chips);
    }

    renderGlSummaryRing(glRows, usedPercent);
    renderGlSummaryBarChart(glRows);
    renderGlSummaryLineChart(glRows);

    const warn = glRows.filter((r) => {
        const st = getBudgetStatus(r.budget, r.balance);
        return st.className === 'status-warning' || st.className === 'status-critical';
    });
    const statusLine = document.getElementById('glSumStatusLine');
    if (statusLine) {
        if (warn.length) {
            statusLine.textContent = `${warn.length} GL ${warn.length === 1 ? 'needs' : 'need'} attention · portfolio ${status.label.toLowerCase()}`;
        } else {
            statusLine.textContent = `Portfolio ${status.label.toLowerCase()}`;
        }
    }
}

function updateDashboardKpis(summaryBudget, summaryCommitted, summaryVouchers, summaryBalance, breakdownTotals, alertCount) {
    const usedPercent = summaryBudget > 0 ? ((summaryCommitted + summaryVouchers) / summaryBudget) * 100 : 0;
    const status = getBudgetStatus(summaryBudget, summaryBalance);
    const committedPercent = summaryBudget > 0 ? Math.min(100, (summaryCommitted / summaryBudget) * 100) : 0;
    const voucherPercent = summaryBudget > 0
        ? Math.min(100 - committedPercent, (Math.abs(summaryVouchers) / summaryBudget) * 100)
        : 0;

    document.getElementById('kpiTotalBudget').textContent = formatCurrency(summaryBudget);
    document.getElementById('kpiTotalCommitted').textContent = formatCurrency(summaryCommitted);
    document.getElementById('kpiTotalBalance').textContent = formatCurrency(summaryBalance);
    document.getElementById('kpiUtilization').textContent = usedPercent.toFixed(1) + '%';
    document.getElementById('kpiAlertCount').textContent = String(alertCount);

    document.getElementById('kpiCommittedBreakdown').textContent =
        `Bids ${formatCurrency(breakdownTotals.bids)} · POs ${formatCurrency(breakdownTotals.po)} · DP F1 ${formatCurrency(breakdownTotals.dpF1)}`;
    document.getElementById('kpiVoucherImpact').textContent =
        `Vouchers: ${(summaryVouchers >= 0 ? '+' : '') + formatCurrency(summaryVouchers)}`;
    document.getElementById('kpiUtilizationStatus').textContent = status.label;

    const detail = document.getElementById('kpiUtilizationDetail');
    if (detail) detail.textContent = `${Math.max(0, usedPercent).toFixed(1)}% used`;

    const committedBar = document.getElementById('kpiUtilCommittedBar');
    const voucherBar = document.getElementById('kpiUtilVoucherBar');
    if (committedBar) committedBar.style.width = committedPercent.toFixed(1) + '%';
    if (voucherBar) {
        voucherBar.style.width = voucherPercent.toFixed(1) + '%';
        voucherBar.classList.toggle('credit', summaryVouchers < 0);
    }

    const lastUpdated = document.getElementById('dashboardLastUpdated');
    if (lastUpdated) {
        if (typeof refreshLastLoggedInDisplay === 'function') {
            refreshLastLoggedInDisplay();
        } else {
            lastUpdated.textContent = new Date().toLocaleString('en-ZW', {
                dateStyle: 'medium',
                timeStyle: 'short'
            });
        }
    }

    updateOpsActivityStrip();
    if (typeof updateBuyingPowerEmptyHints === 'function') {
        updateBuyingPowerEmptyHints(summaryBudget, summaryBalance);
    }
}

let navHistory = [];
let currentModuleId = 'dashboard';

function getActiveModuleId() {
    const visible = [...document.querySelectorAll('.content-section, .form-container')]
        .find((el) => el.style.display !== 'none' && el.id);
    return visible?.id || currentModuleId || 'dashboard';
}

async function navigateToModule(targetId, options = {}) {
    if (!targetId) return;
    if (typeof restoreModuleMaximize === 'function') restoreModuleMaximize();
    if (typeof hideFieldHelp === 'function') hideFieldHelp();
    if (!currentUser) {
        document.body.classList.add('app-locked');
        return;
    }
    if (!canAccessModule(targetId)) {
        showToast('Access denied for your access level.', 'error');
        if (typeof recordAccessAudit === 'function') {
            recordAccessAudit('module_denied', `Blocked module “${targetId}”`);
        }
        return;
    }

    const skipHistory = !!options.skipHistory;
    const clearHistory = !!options.clearHistory;
    const fromId = getActiveModuleId();

    if (clearHistory) {
        navHistory = [];
    } else if (!skipHistory && fromId && fromId !== targetId) {
        navHistory.push(fromId);
        if (navHistory.length > 40) navHistory.shift();
    }

    // Standalone module HTML — load on demand from app/modules/<id>.html
    if (targetId !== 'dashboard' && typeof ensureModuleLoaded === 'function') {
        try {
            await ensureModuleLoaded(targetId);
        } catch (err) {
            console.error(err);
            showToast(`Could not load module “${targetId}”.`, 'error');
            return;
        }
    }

    if (options.stkDesk) {
        window._stkDeskOverride = options.stkDesk;
    }

    document.querySelectorAll('.content-section, .form-container').forEach((section) => {
        section.style.display = 'none';
        section.classList.remove('is-open');
    });

    const targetSection = document.getElementById(targetId);
    if (targetSection) {
        targetSection.style.display = 'block';
        targetSection.classList.remove('is-open');
    }
    document.querySelectorAll('.sidebar-menu a').forEach((link) => link.classList.remove('active'));
    const deskKey = options.stkDesk
        || (targetId === 'stakeholder-desk' && typeof getStakeholderDeskKey === 'function' ? getStakeholderDeskKey() : '');
    const menuLink = options.deptPanel
        ? document.querySelector(`.sidebar-menu a[data-target="${targetId}"][data-dept-panel="${options.deptPanel}"]`)
        : (deskKey
            ? document.querySelector(`.sidebar-menu a[data-target="${targetId}"][data-stk-desk="${deskKey}"]`)
            : document.querySelector(`.sidebar-menu a[data-target="${targetId}"]:not([data-dept-panel]):not([data-stk-desk])`))
            || document.querySelector(`.sidebar-menu a[data-target="${targetId}"]:not([data-dept-panel])`)
            || document.querySelector(`.sidebar-menu a[data-target="${targetId}"]`);
    if (menuLink) {
        menuLink.classList.add('active');
        let submenu = menuLink.closest('.submenu');
        while (submenu) {
            submenu.classList.add('active');
            const toggle = submenu.closest('li')?.querySelector(':scope > .nav-submenu-toggle');
            toggle?.classList.add('is-open');
            submenu = submenu.parentElement?.closest('.submenu');
        }
    }
    currentModuleId = targetId;
    updateFormBackButtons();
    if (targetId === 'financial-year-bids') {
        if (typeof populateBidsPackSelect === 'function') populateBidsPackSelect();
        if (typeof initBidCalculations === 'function') initBidCalculations();
    }
    if (targetId === 'voucher-module' && typeof renderVoucherInventoryTables === 'function') {
        renderVoucherInventoryTables();
    }
    if (targetId === 'stock-take') {
        if (typeof initStockTakeModule === 'function') initStockTakeModule();
        if (typeof renderStockTakeTable === 'function') renderStockTakeTable();
    }
    if (targetId === 'unit-checks') {
        if (typeof initUnitChecksModule === 'function') initUnitChecksModule();
        if (typeof renderUnitChecksModule === 'function') renderUnitChecksModule();
    }
    if (targetId === 'unit-requisitions') {
        if (typeof initRequisitionsModule === 'function') initRequisitionsModule();
        if (typeof renderRequisitionsModule === 'function') renderRequisitionsModule();
    }
    if (typeof GL_MODULE_CODE !== 'undefined' && GL_MODULE_CODE[targetId] && typeof injectGlModuleProcurementButtons === 'function') {
        injectGlModuleProcurementButtons();
    }
    if (targetId === 'orderly-room') {
        if (typeof initOrderlyRoomModule === 'function') initOrderlyRoomModule();
        if (typeof renderOrderlyRoomModule === 'function') renderOrderlyRoomModule();
        if (typeof initCorrespondenceFilesModule === 'function') initCorrespondenceFilesModule();
        if (typeof renderCorrespondenceFilesModule === 'function') renderCorrespondenceFilesModule();
    }
    if (targetId === 'it-dir-comms') {
        if (typeof initItDirCommsModule === 'function') initItDirCommsModule();
    }
    if (typeof getDeptDeskDef === 'function' && getDeptDeskDef(targetId)) {
        if (typeof initDeptDeskModule === 'function') initDeptDeskModule(targetId);
        if (typeof renderDeptDeskModule === 'function') renderDeptDeskModule(targetId);
        if (options.deptPanel === 'establishment' && typeof focusDeptDeskEstablishment === 'function') {
            setTimeout(() => focusDeptDeskEstablishment(targetId), 60);
        }
    }
    if (targetId === 'monthly-returns') {
        if (typeof initMonthlyReturnsModule === 'function') initMonthlyReturnsModule();
        if (typeof renderMonthlyReturnsModule === 'function') renderMonthlyReturnsModule();
    }
    if (targetId === 'unit-equipment' && typeof renderUnitEquipmentView === 'function') {
        setUnitEquipmentMode('view');
        renderUnitEquipmentView();
    }
    if (targetId === 'temporary-loans' && typeof renderTemporaryLoansView === 'function') {
        setTemporaryLoansMode('view');
        renderTemporaryLoansView();
    }
    if (targetId === 'permanent-loans' && typeof initPermanentLoansModule === 'function') {
        initPermanentLoansModule();
    }
    if (targetId === 'ict-accountability' && typeof renderIctAccountabilityTable === 'function') {
        if (typeof initIctAccountabilityModule === 'function') initIctAccountabilityModule();
        renderIctAccountabilityTable();
    }
    if (targetId === 'ict-distribution') {
        if (typeof initIctDistributionModule === 'function') initIctDistributionModule();
        else if (typeof renderIctDistributionModule === 'function') renderIctDistributionModule();
    }
    if (targetId === 'spec-evaluation') {
        if (typeof initSpecEvaluationModule === 'function') initSpecEvaluationModule();
        else if (typeof populateSpecSearchFacets === 'function') populateSpecSearchFacets();
    }
    if (targetId === 'ict-compare' && typeof initIctCompareModule === 'function') {
        initIctCompareModule();
    }
    if (targetId === 'guide-quotation' && typeof initGuideQuotationModule === 'function') {
        initGuideQuotationModule();
    }
    if (targetId === 'undelivered-orders' && typeof renderUndeliveredModule === 'function') {
        renderUndeliveredModule();
    }
    if (targetId === 'supplier-debts') {
        if (typeof initSupplierDebtsModule === 'function') initSupplierDebtsModule();
        if (typeof renderSupplierDebtsModule === 'function') renderSupplierDebtsModule();
    }
    if (targetId === 'zna-q-forms-index' && typeof renderZnaQFormsIndex === 'function') {
        renderZnaQFormsIndex();
    }
    if (targetId === 'duties-roles') {
        if (typeof initDutiesRolesModule === 'function') initDutiesRolesModule();
        if (typeof renderDutiesRolesModule === 'function') renderDutiesRolesModule();
    }
    if (targetId === 'process-guides') {
        if (typeof initProcessGuidesModule === 'function') initProcessGuidesModule();
        if (options.pgTab && typeof openProcessGuideTab === 'function') {
            openProcessGuideTab(options.pgTab);
        } else if (typeof renderProcessGuidesContent === 'function') {
            renderProcessGuidesContent();
        }
    }
    if (targetId === 'system-help') {
        if (typeof initRetentionReminder === 'function') initRetentionReminder();
        if (typeof initSystemDictionary === 'function') initSystemDictionary();
    }
    if (targetId === 'dp-f1-form' && typeof updateDpF1SendStatus === 'function') {
        updateDpF1SendStatus();
    }
    if (targetId === 'purchase-orders' && typeof initPurchaseOrderModuleDefaults === 'function') {
        initPurchaseOrderModuleDefaults();
    }
    if (targetId === 'cost-comparative-schedule' && typeof initCostComparativeScheduleModule === 'function') {
        initCostComparativeScheduleModule();
    }
    if (targetId === 'portals-board') {
        if (typeof initPortalsBoardModule === 'function') initPortalsBoardModule();
    }
    if (targetId === 'stakeholder-desk') {
        if (typeof initStakeholderDeskModule === 'function') initStakeholderDeskModule();
        if (typeof renderStakeholderDesk === 'function') renderStakeholderDesk();
    }
    if (targetId === 'dp-procurement' && typeof renderDpProcurementModule === 'function') {
        renderDpProcurementModule();
    }
    if (targetId === 'suppliers-contracts' && typeof renderSuppliersView === 'function') {
        renderSuppliersView();
    }
    if (typeof getGlInventoryModuleConfig === 'function' && getGlInventoryModuleConfig(targetId)) {
        setTimeout(() => {
            if (typeof setGlInventoryMode === 'function') {
                setGlInventoryMode(targetId, options.glMode === 'edit' ? 'edit' : 'view');
            }
        }, 0);
    }
    if (targetId === 'gate-register' || targetId === 'techstores-equipment-register' || targetId === 'workshop-repairs') {
        if (typeof initRepairIntakeModules === 'function') initRepairIntakeModules();
        if (typeof ensureRepairIntakeTables === 'function') ensureRepairIntakeTables();
        if (typeof initModuleMessagingPortal === 'function') initModuleMessagingPortal(targetId);
        if (targetId === 'workshop-repairs' && typeof initWorkshopStoresRequest === 'function') {
            initWorkshopStoresRequest();
        }
    }
    if (targetId === 'user-management' && canManageUsers()) renderUsersTable();
    if (typeof enhanceFieldHelp === 'function') {
        setTimeout(() => enhanceFieldHelp(document.getElementById(targetId) || document), 50);
    }
}

async function navigateBack() {
    while (navHistory.length) {
        const prev = navHistory.pop();
        if (!prev || prev === currentModuleId) continue;
        if (typeof canAccessModule === 'function' && !canAccessModule(prev)) continue;
        if (typeof ensureModuleLoaded === 'function') {
            try { await ensureModuleLoaded(prev); } catch (e) { continue; }
        } else if (!document.getElementById(prev)) {
            continue;
        }
        await navigateToModule(prev, { skipHistory: true });
        return;
    }
    await navigateToModule('dashboard', { skipHistory: true, clearHistory: true });
}

function initFormBackButtons() {
    document.querySelectorAll('.form-container .form-header').forEach((header) => {
        if (header.querySelector('.btn-nav-back')) return;

        const backBtn = document.createElement('button');
        backBtn.type = 'button';
        backBtn.className = 'btn-nav-back';
        backBtn.setAttribute('aria-label', 'Go back');
        backBtn.title = 'Back to previous screen';
        backBtn.innerHTML = '<span aria-hidden="true">←</span><span class="btn-nav-back-label">Back</span>';
        backBtn.addEventListener('click', (e) => {
            e.preventDefault();
            navigateBack();
        });

        // Only reposition a direct-child .form-title — nested titles break insertBefore/appendChild
        const title = Array.from(header.children).find((el) => el.classList?.contains('form-title'));
        if (title) {
            const start = document.createElement('div');
            start.className = 'form-header-start';
            header.insertBefore(start, title);
            start.appendChild(backBtn);
            start.appendChild(title);
        } else {
            header.insertBefore(backBtn, header.firstChild);
        }
    });
    updateFormBackButtons();
}

function updateFormBackButtons() {
    const canGoBack = navHistory.length > 0;
    document.querySelectorAll('.btn-nav-back').forEach((btn) => {
        btn.disabled = false;
        btn.classList.toggle('is-fallback-dashboard', !canGoBack);
        btn.title = canGoBack ? 'Back to previous screen' : 'Back to dashboard';
    });
}

function updateDashboard() {
    const period = typeof getSelectedGlTargetPeriod === 'function'
        ? getSelectedGlTargetPeriod()
        : null;
    const month = typeof getSelectedGlTargetMonth === 'function'
        ? setSelectedGlTargetMonth(getSelectedGlTargetMonth())
        : '';
    const usePeriod = period && period.mode !== 'month';

    const poByGl = usePeriod && typeof getPurchaseOrderCommittedByGlForPeriod === 'function'
        ? getPurchaseOrderCommittedByGlForPeriod(period)
        : (typeof getPurchaseOrderCommittedByGlForMonth === 'function'
            ? getPurchaseOrderCommittedByGlForMonth(month)
            : getPurchaseOrderCommittedByGl());
    const bidByGl = usePeriod ? {} : getBidCommittedByGl();
    const dpF1ByGl = usePeriod ? {} : getDpF1CommittedByGl();
    const baseCommittedByGl = usePeriod && typeof getBaseCommittedByGlForPeriod === 'function'
        ? getBaseCommittedByGlForPeriod(period)
        : (typeof getBaseCommittedByGlForMonth === 'function'
            ? getBaseCommittedByGlForMonth(month)
            : getBaseCommittedByGl());
    const voucherByGl = usePeriod && typeof getVoucherImpactByGlForPeriod === 'function'
        ? getVoucherImpactByGlForPeriod(period)
        : (typeof getVoucherImpactByGlForMonth === 'function'
            ? getVoucherImpactByGlForMonth(month)
            : getVoucherImpactByGl());

    let summaryBudget = 0;
    let summaryCommitted = 0;
    let summaryVouchers = 0;
    const overviewRows = [];
    const breakdownTotals = { bids: 0, po: 0, dpF1: 0 };

    if (!usePeriod) {
        Object.keys(GL_ACCOUNTS).forEach((gl) => {
            breakdownTotals.bids += bidByGl[gl] || 0;
            breakdownTotals.po += poByGl[gl] || 0;
            breakdownTotals.dpF1 += dpF1ByGl[gl] || 0;
        });
    } else {
        Object.keys(GL_ACCOUNTS).forEach((gl) => {
            breakdownTotals.po += poByGl[gl] || 0;
        });
    }

    document.querySelectorAll('.card[data-gl]').forEach((card) => {
        const gl = card.getAttribute('data-gl');
        if (gl === 'summary') return;

        const budget = usePeriod && typeof getGlPeriodTarget === 'function'
            ? getGlPeriodTarget(gl, period)
            : (typeof getGlMonthlyTarget === 'function'
                ? getGlMonthlyTarget(gl, month)
                : (appState.glBudgets[gl] || 0));
        const committed = baseCommittedByGl[gl] || 0;
        const vouchers = voucherByGl[gl] || 0;
        const breakdown = usePeriod
            ? { bids: 0, po: poByGl[gl] || 0, dpF1: 0 }
            : {
                bids: bidByGl[gl] || 0,
                po: poByGl[gl] || 0,
                dpF1: dpF1ByGl[gl] || 0
            };

        const totals = updateGlCard(card, gl, budget, committed, vouchers, breakdown);
        summaryBudget += totals.budget;
        summaryCommitted += totals.committed;
        summaryVouchers += totals.vouchers;

        overviewRows.push({
            code: gl,
            name: GL_ACCOUNTS[gl].name,
            target: card.getAttribute('data-target'),
            proposed: usePeriod && typeof getProposalAmountForGlPeriod === 'function'
                ? getProposalAmountForGlPeriod(gl, period)
                : (typeof getProposalAmountForGl === 'function' ? getProposalAmountForGl(gl, month) : 0),
            budget: totals.budget,
            committed: totals.committed,
            vouchers: totals.vouchers,
            expended: totals.committed + totals.vouchers,
            balance: totals.balance,
            fundingNote: usePeriod && typeof getGlPeriodFundingNote === 'function'
                ? getGlPeriodFundingNote(gl, period)
                : (typeof getGlFundingNote === 'function' ? getGlFundingNote(gl, month) : '')
        });
    });

    const summaryCard = document.querySelector('.card[data-gl="summary"]');
    if (summaryCard) {
        const summaryBalance = summaryBudget - summaryCommitted - summaryVouchers;
        updateGlCard(summaryCard, 'summary', summaryBudget, summaryCommitted, summaryVouchers, breakdownTotals);
        const periodLabel = period?.label || (month ? formatYmLabel(month) : 'Financial Year Total');
        overviewRows.push({
            code: 'ALL',
            name: usePeriod ? `Period total · ${periodLabel}` : (month ? `Month total · ${typeof formatYmLabel === 'function' ? formatYmLabel(month) : month}` : 'Financial Year Total'),
            target: 'financial-year-bids',
            proposed: overviewRows.reduce((s, r) => s + (r.proposed || 0), 0),
            budget: summaryBudget,
            committed: summaryCommitted,
            vouchers: summaryVouchers,
            expended: summaryCommitted + summaryVouchers,
            balance: summaryBalance,
            fundingNote: ''
        });
    }

    const alertCount = typeof updateCommandBoard === 'function'
        ? updateCommandBoard()
        : updateSystemAlerts();
    updateDashboardKpis(summaryBudget, summaryCommitted, summaryVouchers, summaryBudget - summaryCommitted - summaryVouchers, breakdownTotals, alertCount);
    updateGlCollapsedSummary(
        overviewRows,
        summaryBudget,
        summaryCommitted,
        summaryVouchers,
        summaryBudget - summaryCommitted - summaryVouchers
    );
    renderBudgetOverviewTable(overviewRows);
    if (typeof renderGlTargetPeriodBreakdown === 'function') {
        renderGlTargetPeriodBreakdown(period);
    }
    renderInventoryDashboard();
    if (typeof renderProductStockRegister === 'function') renderProductStockRegister();
    renderRecentTransfers();
    if (typeof initDashboardCollapsibles === 'function') initDashboardCollapsibles();
    if (typeof wireGlProcurementUi === 'function') wireGlProcurementUi();
}

function processReleaseCut() {
    if (!canProcessReleaseCut()) {
        showToast('Only Administrators can process Release Cut transfers.', 'error');
        return;
    }
    const date = document.getElementById('releaseCutDate').value;
    const fromGl = document.getElementById('releaseCutFrom').value;
    const toGl = document.getElementById('releaseCutTo').value;
    const amount = parseFloat(document.getElementById('releaseCutAmount').value) || 0;
    const reason = document.getElementById('releaseCutReason').value.trim();
    const authorizedBy = document.getElementById('releaseCutAuthorized').value.trim();

    if (!date) {
        showToast('Please select a transfer date.', 'error');
        return;
    }
    if (typeof assertValidDate === 'function' && !assertValidDate(date, {
        required: true,
        label: 'Transfer date',
        notFuture: true
    })) {
        return;
    }
    if (fromGl === toGl) {
        showToast('Source and destination GL accounts must be different.', 'error');
        return;
    }
    if (amount <= 0) {
        showToast('Transfer amount must be greater than zero.', 'error');
        return;
    }
    if (!reason) {
        showToast('Please enter a reason for the transfer.', 'error');
        return;
    }
    if (!authorizedBy) {
        showToast('Please enter the authorizing officer.', 'error');
        return;
    }

    const fromBalance = getGlBalance(fromGl);
    if (amount > fromBalance) {
        showToast(`Insufficient monthly target balance on GL ${fromGl}. Available: ${formatCurrency(fromBalance)}`, 'error');
        return;
    }

    if (typeof applyMonthlyReleaseCut === 'function') {
        const result = applyMonthlyReleaseCut({ date, fromGl, toGl, amount });
        if (!result.ok) {
            showToast(result.error || 'Release Cut failed.', 'error');
            return;
        }
    } else {
        appState.glBudgets[fromGl] = (appState.glBudgets[fromGl] || 0) - amount;
        appState.glBudgets[toGl] = (appState.glBudgets[toGl] || 0) + amount;
    }

    appState.releaseCuts.push({
        date,
        fromGl,
        toGl,
        amount,
        reason,
        authorizedBy,
        month: String(date).slice(0, 7),
        processedAt: new Date().toISOString()
    });

    saveState();
    if (typeof setSelectedGlTargetMonth === 'function') {
        setSelectedGlTargetMonth(String(date).slice(0, 7));
    }
    updateDashboard();

    document.getElementById('releaseCutAmount').value = '';
    document.getElementById('releaseCutReason').value = '';
    document.getElementById('releaseCutAuthorized').value = '';

    showToast(`Release Cut: moved ${formatCurrency(amount)} buying power from GL ${fromGl} → GL ${toGl} (${String(date).slice(0, 7)}).`);
    if (typeof refreshReleaseCutBuyingPowerHints === 'function') refreshReleaseCutBuyingPowerHints();
}

function restoreAllModules() {
    MODULE_IDS.forEach((moduleId) => {
        if (appState.modules[moduleId]) {
            restoreModule(moduleId, appState.modules[moduleId]);
        }
    });
}


