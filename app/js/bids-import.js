/* bids-import.js — Load official IT DIR packs + import prepared Excel bids */

let _pendingBidsExcelPack = null;

function getBidGlOptionsHtml(selected) {
    const options = [
        { value: '6122100009', label: '6122100009 - Office Supplies & Services (ZOFF)' },
        { value: '2200600002', label: '2200600002 - Computer Consumables (legacy)' },
        { value: '2200600003', label: '2200600003 - Software Licenses' },
        { value: '220200002', label: '220200002 - Tech Equipment Maintenance' },
        { value: '2201900002', label: '2201900002 - Spare Parts' },
        { value: '3112210001', label: '3112210001 - ICT Equipment' }
    ];
    const sel = String(selected || '6122100009');
    return options.map((o) => (
        `<option value="${o.value}"${o.value === sel ? ' selected' : ''}>${o.label}</option>`
    )).join('');
}

function fillBidRowFromItem(tr, item, serial) {
    const inputs = tr.querySelectorAll('input, select');
    const serialCell = tr.querySelector('td:first-child');
    if (serialCell && !serialCell.querySelector('input')) {
        serialCell.textContent = String(serial);
    }
    if (inputs[0]) inputs[0].value = item.item || '';
    if (inputs[1]) inputs[1].value = item.costCentre || 'Z04P2SP212';
    if (inputs[2] && inputs[2].tagName === 'SELECT') {
        inputs[2].innerHTML = getBidGlOptionsHtml(item.gl);
        const gl = String(item.gl || '2200600002');
        if (![...inputs[2].options].some((o) => o.value === gl)) {
            const opt = document.createElement('option');
            opt.value = gl;
            opt.textContent = `${gl} - Imported`;
            inputs[2].appendChild(opt);
        }
        inputs[2].value = gl;
    }
    if (inputs[3]) inputs[3].value = item.description || item.sheet || '';
    if (inputs[4]) inputs[4].value = item.qty != null ? String(item.qty) : '';
    if (inputs[5]) inputs[5].value = item.unitCost != null ? String(item.unitCost) : '';
    if (inputs[6]) {
        const total = item.totalCost != null
            ? item.totalCost
            : (Number(item.qty) || 0) * (Number(item.unitCost) || 0);
        inputs[6].value = String(total);
    }
    if (typeof attachBidRowCalculations === 'function') attachBidRowCalculations(tr);
}

function clearBidsTable() {
    const tbody = document.getElementById('bids-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';
}

function filterBidItems(items, glFilter) {
    let list = (items || []).slice();
    if (glFilter && glFilter !== 'all') {
        list = list.filter((i) => String(i.gl) === String(glFilter));
    }
    return list;
}

function applyBidItemsToTable(pack, items, options = {}) {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return false;
    if (!pack || !items.length) {
        showToast('No bid lines to load.', 'error');
        return false;
    }

    const mode = options.mode || 'replace';
    const label = pack.label || pack.file || 'Bids';
    if (mode === 'replace') {
        const ok = options.force || confirm(
            `Load ${label} into Financial Year Bids?\n\n` +
            `${items.length} line(s)\n` +
            `Total ≈ USD ${items.reduce((s, i) => s + (Number(i.totalCost) || 0), 0).toLocaleString()}\n\n` +
            `This will REPLACE the current bids table.`
        );
        if (!ok) return false;
        clearBidsTable();
    }

    const tbody = document.getElementById('bids-table-body');
    if (!tbody) return false;

    const startSer = tbody.rows.length + 1;
    items.forEach((item, idx) => {
        const tr = typeof buildBidRow === 'function' ? buildBidRow() : document.createElement('tr');
        tbody.appendChild(tr);
        fillBidRowFromItem(tr, item, startSer + idx);
    });

    Array.from(tbody.rows).forEach((tr, i) => {
        const cell = tr.querySelector('td:first-child');
        if (cell && !cell.querySelector('input')) cell.textContent = String(i + 1);
    });

    if (typeof initBidCalculations === 'function') initBidCalculations();
    if (typeof saveModule === 'function') saveModule('financial-year-bids');
    updateBidsPackSummary(pack, items);
    if (typeof syncFyBidAskFromTable === 'function') syncFyBidAskFromTable();
    if (typeof renderBidsDafAllocPanel === 'function') renderBidsDafAllocPanel();
    if (typeof updateDashboard === 'function') updateDashboard();

    showToast(`Loaded ${items.length} bid line(s) from ${label}.`);
    return true;
}

function loadItDirBidsPack(packId, options = {}) {
    const pack = typeof getItDirBidsPack === 'function' ? getItDirBidsPack(packId) : null;
    if (!pack || !Array.isArray(pack.items) || !pack.items.length) {
        showToast('Bid pack not found or empty.', 'error');
        return false;
    }
    const glFilter = options.glFilter || document.getElementById('bidsPackGlFilter')?.value || 'all';
    const items = filterBidItems(pack.items, glFilter);
    if (!items.length) {
        showToast('No bid lines for that GL filter.', 'error');
        return false;
    }
    const mode = options.mode || document.getElementById('bidsPackLoadMode')?.value || 'replace';
    return applyBidItemsToTable(pack, items, { ...options, mode });
}

function updateBidsPackSummary(pack, items) {
    const el = document.getElementById('bidsPackSummary');
    if (!el) return;
    const list = items || pack?.items || [];
    const total = list.reduce((s, i) => s + (Number(i.totalCost) || 0), 0);
    const byGl = {};
    list.forEach((i) => {
        byGl[i.gl] = (byGl[i.gl] || 0) + (Number(i.totalCost) || 0);
    });
    const glBits = Object.entries(byGl)
        .map(([gl, amt]) => `${gl}: $${amt.toLocaleString()}`)
        .join(' · ');
    el.innerHTML = pack
        ? `<strong>${pack.label}</strong> (FY ${pack.fy || '—'}) — ${list.length} lines · USD ${total.toLocaleString()}` +
          (glBits ? `<br><span class="bids-pack-gl-breakdown">${glBits}</span>` : '')
        : 'Select an official IT DIR BIDS workbook pack to load.';
}

function populateBidsPackSelect() {
    const sel = document.getElementById('bidsPackSelect');
    if (!sel || typeof getItDirBidsPackList !== 'function') return;
    const packs = getItDirBidsPackList();
    sel.innerHTML = packs.map((p) => (
        `<option value="${p.id}">${p.label} (${p.items.length} lines)</option>`
    )).join('');
    if (packs[0]) updateBidsPackSummary(packs[0], packs[0].items);
}

function bidsReadFileBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const raw = String(reader.result || '');
            const idx = raw.indexOf(',');
            resolve(idx >= 0 ? raw.slice(idx + 1) : raw);
        };
        reader.onerror = () => reject(reader.error || new Error('Could not read file.'));
        reader.readAsDataURL(file);
    });
}

async function parseBidsExcelViaApi(file) {
    const base64 = await bidsReadFileBase64(file);
    const res = await fetch('/api/bids/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            fileBase64: base64,
            fileName: file.name || 'bids.xlsx'
        })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.ok) {
        throw new Error(data?.error || `Parse failed (${res.status}). Is START-SYSTEM running?`);
    }
    return data.pack;
}

function setBidsExcelStatus(text, kind = '') {
    const el = document.getElementById('bidsExcelImportStatus');
    if (!el) return;
    el.textContent = text || '';
    el.className = `bids-excel-import-status${kind ? ` is-${kind}` : ''}`;
}

function clearPendingBidsExcel() {
    _pendingBidsExcelPack = null;
    const preview = document.getElementById('bidsExcelPreview');
    const actions = document.getElementById('bidsExcelConfirmActions');
    if (preview) {
        preview.hidden = true;
        preview.innerHTML = '';
    }
    if (actions) actions.hidden = true;
    const input = document.getElementById('excelFile');
    if (input) input.value = '';
}

function showPendingBidsExcel(pack) {
    _pendingBidsExcelPack = pack;
    const preview = document.getElementById('bidsExcelPreview');
    const actions = document.getElementById('bidsExcelConfirmActions');
    if (preview) {
        const byGl = pack.byGl || {};
        const glBits = Object.entries(byGl)
            .map(([gl, amt]) => `${gl}: $${Number(amt).toLocaleString()}`)
            .join(' · ');
        const sheets = (pack.sheetsUsed || []).join(', ') || '—';
        preview.hidden = false;
        preview.innerHTML = `
            <strong>${escapeBidsHtml(pack.label || pack.file || 'Import')}</strong>
            — ${pack.itemCount || pack.items?.length || 0} lines · USD ${Number(pack.totalCost || 0).toLocaleString()}
            <br><span class="muted">Sheets: ${escapeBidsHtml(sheets)}</span>
            ${glBits ? `<br><span class="bids-pack-gl-breakdown">${escapeBidsHtml(glBits)}</span>` : ''}`;
    }
    if (actions) actions.hidden = false;
}

function escapeBidsHtml(v) {
    return String(v ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

async function handleBidsExcelFile(file) {
    if (!file) return;
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;
    const name = String(file.name || '').toLowerCase();
    if (!/\.xlsx?$/.test(name)) {
        showToast('Choose an Excel bids workbook (.xlsx).', 'error');
        return;
    }
    setBidsExcelStatus(`Reading ${file.name}…`);
    clearPendingBidsExcel();
    try {
        const pack = await parseBidsExcelViaApi(file);
        if (!pack?.items?.length) {
            setBidsExcelStatus('No bid lines found in that workbook.', 'error');
            showToast('No bid lines found.', 'error');
            return;
        }
        showPendingBidsExcel(pack);
        setBidsExcelStatus(
            `Parsed ${pack.itemCount} line(s) from ${pack.file}. Confirm to load into the table.`,
            'ok'
        );
    } catch (err) {
        console.error(err);
        setBidsExcelStatus(err.message || String(err), 'error');
        showToast(err.message || 'Bids Excel import failed.', 'error');
    }
}

function confirmPendingBidsExcel() {
    const pack = _pendingBidsExcelPack;
    if (!pack?.items?.length) {
        showToast('No parsed bids to load.', 'error');
        return;
    }
    const glFilter = document.getElementById('bidsExcelGlFilter')?.value || 'all';
    const mode = document.getElementById('bidsExcelLoadMode')?.value || 'replace';
    const items = filterBidItems(pack.items, glFilter);
    if (!items.length) {
        showToast('No bid lines for that GL filter.', 'error');
        return;
    }
    const ok = applyBidItemsToTable(pack, items, { mode });
    if (ok) {
        clearPendingBidsExcel();
        setBidsExcelStatus(`Loaded ${items.length} line(s) from ${pack.file || 'Excel'}.`, 'ok');
    }
}

function initBidsExcelDropZone() {
    const zone = document.getElementById('bidsExcelDropZone');
    const input = document.getElementById('excelFile');
    if (!zone || !input || zone.dataset.bound === '1') return;
    zone.dataset.bound = '1';

    const openPicker = () => input.click();
    zone.addEventListener('click', (e) => {
        if (e.target === input) return;
        openPicker();
    });
    zone.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openPicker();
        }
    });
    zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        zone.classList.add('is-dragover');
    });
    zone.addEventListener('dragleave', () => zone.classList.remove('is-dragover'));
    zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.classList.remove('is-dragover');
        const file = e.dataTransfer?.files?.[0];
        if (file) handleBidsExcelFile(file);
    });
    input.addEventListener('change', () => {
        const file = input.files?.[0];
        if (file) handleBidsExcelFile(file);
    });
}

function initFinancialYearBidsImport() {
    const moduleEl = document.getElementById('financial-year-bids');
    if (!moduleEl) return;

    populateBidsPackSelect();
    initBidsExcelDropZone();
    wireBidsDafAllocPanel();

    if (moduleEl.dataset.bidsImportInit === '1') return;
    moduleEl.dataset.bidsImportInit = '1';

    document.getElementById('bidsPackSelect')?.addEventListener('change', () => {
        const id = document.getElementById('bidsPackSelect')?.value;
        const pack = typeof getItDirBidsPack === 'function' ? getItDirBidsPack(id) : null;
        updateBidsPackSummary(pack, pack?.items);
    });

    document.getElementById('bidsLoadPackBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        const id = document.getElementById('bidsPackSelect')?.value;
        loadItDirBidsPack(id);
    });

    document.getElementById('bidsConfirmExcelImportBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        confirmPendingBidsExcel();
    });
    document.getElementById('bidsCancelExcelImportBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        clearPendingBidsExcel();
        setBidsExcelStatus('Import cancelled.');
    });

    document.getElementById('bidsDafRefreshAskBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        syncFyBidAskFromTable();
        renderBidsDafAllocPanel();
        showToast('FY bid ask refreshed from the bids table.');
    });
    document.getElementById('bidsDafSuggestBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        syncFyBidAskFromTable();
        fillBidsDafAllocSuggestions();
        showToast('Suggestion filled — edit to match the DAF advice, then Apply.');
    });
    document.getElementById('bidsDafApplyTargetsBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        applyBidsDafAllocationsToTargets();
    });
    document.getElementById('bidsDafOpenTargetsBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        if (typeof navigateToModule === 'function') navigateToModule('dashboard');
        setTimeout(() => {
            if (typeof expandDashCollapseByKey === 'function') expandDashCollapseByKey('gl-target-overview');
            document.getElementById('glTargetMonth')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 200);
    });
    document.getElementById('bidsDafAllocMonth')?.addEventListener('change', () => renderBidsDafAllocPanel());
    document.getElementById('bidsDafAllocCurrency')?.addEventListener('change', () => renderBidsDafAllocPanel());
}

/** IT Dir money GLs DAF votes onto (bids for consumables map → ZOFF). */
const IT_DIR_DAF_LEDGERS = [
    { gl: '6122100009', short: 'ZOFF', label: 'ZOFF / Office Supplies & Services' },
    { gl: '2200600003', short: 'Software', label: 'Software & Licences' },
    { gl: '2201900002', short: 'Spares', label: 'Spares & Parts' },
    { gl: '220200002', short: 'Maintenance', label: 'Tech Equipment Maintenance' },
    { gl: '3112210001', short: 'ICT', label: 'ICT Equipment' }
];

function mapBidGlToSystemGl(rawGl) {
    const gl = String(rawGl || '').replace(/\D/g, '') || String(rawGl || '');
    if (gl === '2200600002' || gl === '6122100009') return '6122100009';
    if (gl === '2202000002' || gl === '2202000004') return '220200002';
    return gl;
}

function readBidsTableItems() {
    const tbody = document.getElementById('bids-table-body');
    if (!tbody) return [];
    const items = [];
    tbody.querySelectorAll('tr').forEach((tr) => {
        const inputs = tr.querySelectorAll('input, select');
        if (!inputs.length) return;
        const item = (inputs[0]?.value || '').trim();
        if (!item) return;
        const costCentre = (inputs[1]?.value || '').trim() || 'Z04P2SP212';
        const gl = inputs[2]?.tagName === 'SELECT' ? inputs[2].value : '';
        const description = (inputs[3]?.value || '').trim();
        const qty = Number(inputs[4]?.value) || 0;
        const unitCost = Number(inputs[5]?.value) || 0;
        const totalCost = Number(inputs[6]?.value) || (qty * unitCost);
        items.push({ item, costCentre, gl, description, qty, unitCost, totalCost });
    });
    return items;
}

function sumBidsAskBySystemGl(items) {
    const totals = {};
    IT_DIR_DAF_LEDGERS.forEach((L) => { totals[L.gl] = 0; });
    (items || []).forEach((row) => {
        const sys = mapBidGlToSystemGl(row.gl);
        if (!Object.prototype.hasOwnProperty.call(totals, sys)) return;
        totals[sys] += Number(row.totalCost) || 0;
    });
    Object.keys(totals).forEach((k) => { totals[k] = Math.round(totals[k] * 100) / 100; });
    return totals;
}

function syncFyBidAskFromTable() {
    if (!window.appState) return null;
    const items = readBidsTableItems();
    const byGl = sumBidsAskBySystemGl(items);
    appState.fyBidAsk = {
        updatedAt: new Date().toISOString(),
        source: 'financial-year-bids',
        byGl,
        total: Object.values(byGl).reduce((s, n) => s + n, 0)
    };
    // FY reference budgets mirror bid ask (informs Seed from FY / dashboard)
    appState.glBudgets = { ...(appState.glBudgets || {}) };
    IT_DIR_DAF_LEDGERS.forEach((L) => {
        appState.glBudgets[L.gl] = byGl[L.gl] || 0;
    });
    if (typeof saveState === 'function') saveState();
    return appState.fyBidAsk;
}

function getFyBidAskByGl() {
    if (appState?.fyBidAsk?.byGl) return { ...appState.fyBidAsk.byGl };
    // Fallback: derive from glBudgets if present
    const out = {};
    IT_DIR_DAF_LEDGERS.forEach((L) => {
        out[L.gl] = Number(appState?.glBudgets?.[L.gl]) || 0;
    });
    return out;
}

function formatBidsMoney(amount, currency = 'ZiG') {
    const n = Number(amount) || 0;
    const formatted = n.toLocaleString(undefined, { maximumFractionDigits: 2 });
    const cur = String(currency || 'ZiG');
    if (cur === 'USD') return `USD ${formatted}`;
    return `ZiG ${formatted}`;
}

function renderBidsDafAllocPanel() {
    const body = document.getElementById('bidsDafAllocBody');
    if (!body) return;
    const ask = getFyBidAskByGl();
    const currency = document.getElementById('bidsDafAllocCurrency')?.value || 'ZiG';
    const monthEl = document.getElementById('bidsDafAllocMonth');
    if (monthEl && !monthEl.value && typeof getSelectedGlTargetMonth === 'function') {
        monthEl.value = getSelectedGlTargetMonth();
    }
    const ym = monthEl?.value || (typeof getSelectedGlTargetMonth === 'function' ? getSelectedGlTargetMonth() : '');
    body.innerHTML = IT_DIR_DAF_LEDGERS.map((L) => {
        const fyAsk = Number(ask[L.gl]) || 0;
        const current = typeof getGlMonthlyTarget === 'function' ? getGlMonthlyTarget(L.gl, ym) : 0;
        return `<tr data-daf-alloc-gl="${L.gl}">
            <td><strong>${escapeBidsHtml(L.short)}</strong><br><small>${escapeBidsHtml(L.label)}</small></td>
            <td>${escapeBidsHtml(L.gl)}</td>
            <td>${formatBidsMoney(fyAsk, 'USD')}<br><small class="muted">Cost-centre FY bid</small></td>
            <td>
                <input type="number" class="form-control bids-daf-alloc-input" min="0" step="0.01"
                    data-gl="${escapeBidsHtml(L.gl)}" value="${current || ''}"
                    placeholder="e.g. 500000" title="DAF monthly allocation (${currency})">
            </td>
        </tr>`;
    }).join('');
    const status = document.getElementById('bidsDafAllocStatus');
    const totalAsk = Object.values(ask).reduce((s, n) => s + (Number(n) || 0), 0);
    if (status) {
        status.textContent = totalAsk > 0
            ? `FY bid ask across ledgers ≈ ${formatBidsMoney(totalAsk, 'USD')}. Enter DAF ${currency} amounts for the month, then Apply.`
            : 'No bid lines yet — load an official pack or import Excel first.';
    }
}

function fillBidsDafAllocSuggestions() {
    const mode = document.getElementById('bidsDafAllocSuggest')?.value || 'month12';
    const ask = getFyBidAskByGl();
    document.querySelectorAll('.bids-daf-alloc-input').forEach((input) => {
        const gl = input.getAttribute('data-gl');
        const fy = Number(ask[gl]) || 0;
        if (mode === 'blank') {
            input.value = '';
            return;
        }
        const amount = mode === 'full' ? fy : (fy / 12);
        input.value = amount ? String(Math.round(amount * 100) / 100) : '';
    });
}

function applyBidsDafAllocationsToTargets() {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return false;
    const monthEl = document.getElementById('bidsDafAllocMonth');
    const ym = monthEl?.value || (typeof getSelectedGlTargetMonth === 'function' ? getSelectedGlTargetMonth() : '');
    if (!ym) {
        showToast('Select the DAF target month.', 'error');
        return false;
    }
    const currency = document.getElementById('bidsDafAllocCurrency')?.value || 'ZiG';
    const ref = document.getElementById('bidsDafAllocRef')?.value?.trim() || '';
    const inputs = [...document.querySelectorAll('.bids-daf-alloc-input')];
    const amounts = inputs.map((el) => ({
        gl: el.getAttribute('data-gl'),
        amount: Math.max(0, Number(el.value) || 0)
    }));
    const funded = amounts.filter((a) => a.amount > 0);
    if (!funded.length) {
        showToast('Enter at least one DAF allocation amount.', 'error');
        return false;
    }
    const total = funded.reduce((s, a) => s + a.amount, 0);
    const ok = confirm(
        `Apply DAF allocations for ${ym}?\n\n` +
        funded.map((a) => {
            const L = IT_DIR_DAF_LEDGERS.find((x) => x.gl === a.gl);
            return `${L?.short || a.gl}: ${formatBidsMoney(a.amount, currency)}`;
        }).join('\n') +
        `\n\nTotal ${formatBidsMoney(total, currency)}\n` +
        `These become the monthly DAF targets (buying-power ceiling) on the dashboard.`
    );
    if (!ok) return false;

    syncFyBidAskFromTable();
    if (typeof setSelectedGlTargetMonth === 'function') setSelectedGlTargetMonth(ym);
    amounts.forEach(({ gl, amount }) => {
        if (typeof setGlMonthlyTarget === 'function') setGlMonthlyTarget(gl, amount, ym);
    });
    if (typeof saveMonthDafMeta === 'function') {
        saveMonthDafMeta({
            source: 'DAF',
            currency,
            ref: ref || `Bid-informed ${ym}`,
            receivedDate: new Date().toISOString().slice(0, 10),
            notes: `Allocated from cost-centre FY bids (${currency}).`
        }, ym);
    }
    const status = document.getElementById('bidsDafAllocStatus');
    if (status) {
        status.textContent = `Applied ${funded.length} ledger allocation(s) for ${ym} · ${formatBidsMoney(total, currency)}.`;
        status.className = 'bids-daf-alloc-status is-ok';
    }
    showToast(`DAF ${currency} allocations applied for ${ym}.`, 'success');
    if (typeof updateDashboard === 'function') updateDashboard();
    return true;
}

function wireBidsDafAllocPanel() {
    const monthEl = document.getElementById('bidsDafAllocMonth');
    if (monthEl && !monthEl.value && typeof getSelectedGlTargetMonth === 'function') {
        monthEl.value = getSelectedGlTargetMonth();
    }
    if (typeof getMonthDafMeta === 'function' && monthEl?.value) {
        const meta = getMonthDafMeta(monthEl.value);
        const cur = document.getElementById('bidsDafAllocCurrency');
        if (cur && meta.currency) cur.value = meta.currency === 'USD' ? 'USD' : 'ZiG';
        const ref = document.getElementById('bidsDafAllocRef');
        if (ref && meta.ref && !ref.value) ref.value = meta.ref;
    }
    renderBidsDafAllocPanel();
}

window.loadItDirBidsPack = loadItDirBidsPack;
window.initFinancialYearBidsImport = initFinancialYearBidsImport;
window.handleBidsExcelFile = handleBidsExcelFile;
window.IT_DIR_DAF_LEDGERS = IT_DIR_DAF_LEDGERS;
window.mapBidGlToSystemGl = mapBidGlToSystemGl;
window.syncFyBidAskFromTable = syncFyBidAskFromTable;
window.getFyBidAskByGl = getFyBidAskByGl;
window.formatBidsMoney = formatBidsMoney;
window.renderBidsDafAllocPanel = renderBidsDafAllocPanel;
