/* stock-take.js — Full stores stock take across Consumables, ICT, Spares, Softwares */

const STOCK_TAKE_FAMILIES = [
    {
        key: 'zoff',
        label: 'All Consumables (Toners, USB Memory Sticks, Storage Media, Stationery)',
        match: (led) => led.parentKey === 'zoff' || /toner|consumable|media|zoff|stationery|usb/i.test(`${led.key} ${led.label}`)
    },
    {
        key: 'ict',
        label: 'All ICT Equipment (Laptops, Desktops, Projectors, Printers, Tablets, Smartboards)',
        match: (led) => led.parentKey === 'ict' || /laptop|desktop|projector|printer|tablet|smartboard|ict/i.test(`${led.key} ${led.label}`)
    },
    {
        key: 'spares',
        label: 'All Spares & Parts',
        match: (led) => led.parentKey === 'spares' || /spare|parts/i.test(`${led.key} ${led.label}`)
    },
    {
        key: 'softwares',
        label: 'All Softwares / Licences',
        match: (led) => led.parentKey === 'softwares' || /software/i.test(`${led.key} ${led.label}`)
    },
    {
        key: 'maintenance',
        label: 'Maintenance & Services',
        match: (led) => led.parentKey === 'maintenance' || /maint/i.test(`${led.key} ${led.label}`)
    }
];

function stEscape(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function ensureStockTakes() {
    if (!appState) return [];
    if (!Array.isArray(appState.stockTakes)) appState.stockTakes = [];
    return appState.stockTakes;
}

function getStockTakeLedgers() {
    if (typeof getAllInventoryLedgers === 'function') {
        return getAllInventoryLedgers().filter((led) => !led.custom || led.sourceKeys?.length || led.key);
    }
    return (typeof VOUCHER_INVENTORY_CATEGORIES !== 'undefined' ? VOUCHER_INVENTORY_CATEGORIES : []) || [];
}

function classifyStockTakeLedger(led) {
    for (const fam of STOCK_TAKE_FAMILIES) {
        if (fam.match(led)) return fam;
    }
    return { key: 'other', label: 'Other inventory' };
}

/**
 * Build flat list of stock-take lines from live catalog + on-hand.
 */
function collectStockTakeLines(options = {}) {
    const showZero = options.showZero === true;
    const familyFilter = options.family || 'all';
    const q = String(options.query || '').trim().toLowerCase();
    const ledgers = getStockTakeLedgers();
    const lines = [];
    const seen = new Set();

    ledgers.forEach((led) => {
        const fam = classifyStockTakeLedger(led);
        if (familyFilter !== 'all' && fam.key !== familyFilter) return;

        const items = typeof getCatalogItemsForCategory === 'function'
            ? getCatalogItemsForCategory(led.key)
            : [];

        items.forEach((item) => {
            if (!item?.id || seen.has(item.id)) return;
            seen.add(item.id);
            const sum = typeof getItemStockSummary === 'function'
                ? getItemStockSummary(item.id)
                : { onHand: 0, opening: 0, received: 0, issued: 0 };
            const onHand = Number(sum.onHand) || 0;
            const hasActivity = !!(sum.opening || sum.received || sum.issued || onHand);
            if (!showZero && !hasActivity) return;
            if (q) {
                const hay = `${item.name} ${led.label} ${fam.label} ${item.id}`.toLowerCase();
                if (!hay.includes(q)) return;
            }
            lines.push({
                itemId: item.id,
                itemName: item.name || item.id,
                ledgerKey: led.key,
                ledgerLabel: led.fullLabel || led.label || led.key,
                familyKey: fam.key,
                familyLabel: fam.label,
                gl: led.defaultGl || led.gl || item.gl || '',
                systemOnHand: onHand,
                physicalCount: onHand,
                remarks: '',
                custom: !!item.custom
            });
        });
    });

    // Also include tracked ad-hoc stock items not in catalog lists
    if (typeof getTrackedItemIds === 'function') {
        getTrackedItemIds().forEach((id) => {
            if (seen.has(id)) return;
            const sum = getItemStockSummary(id);
            const onHand = Number(sum.onHand) || 0;
            const hasActivity = !!(sum.opening || sum.received || sum.issued || onHand);
            if (!showZero && !hasActivity) return;
            const cat = sum.category || '';
            const led = ledgers.find((l) => l.key === cat) || { key: cat, label: cat, parentKey: '' };
            const fam = classifyStockTakeLedger(led);
            if (familyFilter !== 'all' && fam.key !== familyFilter) return;
            if (q && !`${sum.item} ${fam.label}`.toLowerCase().includes(q)) return;
            seen.add(id);
            lines.push({
                itemId: id,
                itemName: sum.item || id,
                ledgerKey: led.key || cat || 'adhoc',
                ledgerLabel: led.fullLabel || led.label || 'Ad-hoc stock',
                familyKey: fam.key,
                familyLabel: fam.label,
                gl: sum.gl || '',
                systemOnHand: onHand,
                physicalCount: onHand,
                remarks: '',
                custom: true
            });
        });
    }

    lines.sort((a, b) =>
        a.familyLabel.localeCompare(b.familyLabel)
        || a.ledgerLabel.localeCompare(b.ledgerLabel)
        || a.itemName.localeCompare(b.itemName, undefined, { sensitivity: 'base' })
    );
    return lines;
}

function getStockTakeFilterState() {
    return {
        family: document.getElementById('stockTakeFamily')?.value || 'all',
        query: document.getElementById('stockTakeSearch')?.value || '',
        showZero: !!document.getElementById('stockTakeShowZero')?.checked,
        showAllCatalog: !!document.getElementById('stockTakeShowAllCatalog')?.checked
    };
}

function readStockTakeCountsFromDom() {
    const map = {};
    document.querySelectorAll('#stockTakeBody tr[data-item-id]').forEach((tr) => {
        const id = tr.getAttribute('data-item-id');
        const physical = parseFloat(tr.querySelector('.st-physical')?.value);
        const remarks = tr.querySelector('.st-remarks')?.value || '';
        map[id] = {
            physicalCount: Number.isFinite(physical) ? physical : 0,
            remarks
        };
    });
    return map;
}

function renderStockTakeTable() {
    const tbody = document.getElementById('stockTakeBody');
    if (!tbody) return;

    const prev = readStockTakeCountsFromDom();
    const filters = getStockTakeFilterState();
    const lines = collectStockTakeLines({
        family: filters.family,
        query: filters.query,
        showZero: filters.showZero || filters.showAllCatalog
    });

    // Restore in-progress counts
    lines.forEach((line) => {
        if (prev[line.itemId]) {
            line.physicalCount = prev[line.itemId].physicalCount;
            line.remarks = prev[line.itemId].remarks;
        }
    });

    const stats = { lines: lines.length, system: 0, physical: 0, surplus: 0, deficient: 0, match: 0 };
    lines.forEach((l) => {
        stats.system += l.systemOnHand;
        stats.physical += Number(l.physicalCount) || 0;
        const v = (Number(l.physicalCount) || 0) - l.systemOnHand;
        if (v > 0) stats.surplus += 1;
        else if (v < 0) stats.deficient += 1;
        else stats.match += 1;
    });
    setStockTakeStats(stats);

    if (!lines.length) {
        tbody.innerHTML = `<tr><td colspan="8" class="req-empty-row">No stock lines match this filter. Receive stock, tick “Show zero / all catalog”, or clear search.</td></tr>`;
        return;
    }

    let html = '';
    let currentFamily = '';
    lines.forEach((line) => {
        if (line.familyLabel !== currentFamily) {
            currentFamily = line.familyLabel;
            html += `<tr class="st-family-row"><td colspan="8"><strong>${stEscape(currentFamily)}</strong></td></tr>`;
        }
        const variance = (Number(line.physicalCount) || 0) - line.systemOnHand;
        const varClass = variance > 0 ? 'st-var-surplus' : variance < 0 ? 'st-var-deficit' : 'st-var-ok';
        html += `
            <tr data-item-id="${stEscape(line.itemId)}" data-family="${stEscape(line.familyKey)}" data-ledger="${stEscape(line.ledgerKey)}">
                <td>${stEscape(line.ledgerLabel)}</td>
                <td><strong>${stEscape(line.itemName)}</strong>${line.custom ? ' ★' : ''}</td>
                <td>${stEscape(line.gl || '—')}</td>
                <td class="st-system" data-system="${line.systemOnHand}"><strong>${line.systemOnHand}</strong></td>
                <td>
                    <input type="number" class="form-control st-physical" min="0" step="1"
                        value="${Number(line.physicalCount) || 0}" aria-label="Physical count for ${stEscape(line.itemName)}">
                </td>
                <td class="st-variance ${varClass}">${variance > 0 ? '+' : ''}${variance}</td>
                <td><input type="text" class="form-control st-remarks" value="${stEscape(line.remarks)}" placeholder="Bin / note"></td>
                <td class="st-actions">
                    <button type="button" class="btn btn-ghost btn-sm st-fill-system" title="Set physical = system">= Sys</button>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

function setStockTakeStats(stats) {
    const set = (id, v) => {
        const el = document.getElementById(id);
        if (el) el.textContent = String(v);
    };
    set('stStatLines', stats.lines);
    set('stStatSystem', stats.system);
    set('stStatPhysical', stats.physical);
    set('stStatMatch', stats.match);
    set('stStatSurplus', stats.surplus);
    set('stStatDeficit', stats.deficient);
}

function updateStockTakeRowVariance(tr) {
    if (!tr) return;
    const system = Number(tr.querySelector('.st-system')?.getAttribute('data-system')) || 0;
    const physical = parseFloat(tr.querySelector('.st-physical')?.value);
    const p = Number.isFinite(physical) ? physical : 0;
    const variance = p - system;
    const cell = tr.querySelector('.st-variance');
    if (!cell) return;
    cell.textContent = `${variance > 0 ? '+' : ''}${variance}`;
    cell.className = `st-variance ${variance > 0 ? 'st-var-surplus' : variance < 0 ? 'st-var-deficit' : 'st-var-ok'}`;
    // refresh footer totals quickly
    let systemT = 0;
    let physicalT = 0;
    let surplus = 0;
    let deficient = 0;
    let match = 0;
    let lines = 0;
    document.querySelectorAll('#stockTakeBody tr[data-item-id]').forEach((row) => {
        lines += 1;
        const s = Number(row.querySelector('.st-system')?.getAttribute('data-system')) || 0;
        const ph = parseFloat(row.querySelector('.st-physical')?.value);
        const pv = Number.isFinite(ph) ? ph : 0;
        systemT += s;
        physicalT += pv;
        const v = pv - s;
        if (v > 0) surplus += 1;
        else if (v < 0) deficient += 1;
        else match += 1;
    });
    setStockTakeStats({ lines, system: systemT, physical: physicalT, surplus, deficient, match });
}

function collectStockTakeSnapshotFromDom() {
    const filters = getStockTakeFilterState();
    const lines = [];
    document.querySelectorAll('#stockTakeBody tr[data-item-id]').forEach((tr) => {
        const itemId = tr.getAttribute('data-item-id');
        const system = Number(tr.querySelector('.st-system')?.getAttribute('data-system')) || 0;
        const physical = parseFloat(tr.querySelector('.st-physical')?.value);
        const p = Number.isFinite(physical) ? physical : 0;
        const cells = tr.querySelectorAll('td');
        lines.push({
            itemId,
            ledgerLabel: cells[0]?.textContent?.trim() || '',
            itemName: cells[1]?.innerText?.replace('★', '').trim() || '',
            gl: cells[2]?.textContent?.trim() || '',
            familyKey: tr.getAttribute('data-family') || '',
            ledgerKey: tr.getAttribute('data-ledger') || '',
            systemOnHand: system,
            physicalCount: p,
            variance: p - system,
            remarks: tr.querySelector('.st-remarks')?.value || ''
        });
    });
    return {
        id: `st-${Date.now()}`,
        date: document.getElementById('stockTakeDate')?.value || new Date().toISOString().slice(0, 10),
        conductedBy: document.getElementById('stockTakeBy')?.value || (typeof currentUser !== 'undefined' ? currentUser?.name : '') || '',
        location: document.getElementById('stockTakeLocation')?.value || 'IT Dir Tech Stores',
        notes: document.getElementById('stockTakeNotes')?.value || '',
        filters,
        lines,
        savedAt: new Date().toISOString(),
        savedBy: (typeof currentUser !== 'undefined' ? currentUser?.username : '') || ''
    };
}

function saveStockTakeSnapshot() {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return null;
    const snap = collectStockTakeSnapshotFromDom();
    if (!snap.lines.length) {
        if (typeof showToast === 'function') showToast('No stock take lines to save.', 'error');
        return null;
    }
    const list = ensureStockTakes();
    list.unshift(snap);
    // keep last 40
    if (list.length > 40) list.length = 40;
    if (typeof saveState === 'function') saveState();
    refreshStockTakeHistorySelect();
    if (typeof showToast === 'function') {
        showToast(`Stock take saved · ${snap.lines.length} line(s) · ${snap.date}`, 'success');
    }
    return snap;
}

function refreshStockTakeHistorySelect() {
    const sel = document.getElementById('stockTakeHistory');
    if (!sel) return;
    const list = ensureStockTakes();
    sel.innerHTML = '<option value="">— Saved stock takes —</option>'
        + list.map((s) => {
            const label = `${s.date} · ${s.lines?.length || 0} lines · ${s.conductedBy || s.savedBy || '—'}`;
            return `<option value="${stEscape(s.id)}">${stEscape(label)}</option>`;
        }).join('');
}

function loadStockTakeSnapshot(id) {
    const snap = ensureStockTakes().find((s) => s.id === id);
    if (!snap) return;
    const set = (elId, v) => {
        const el = document.getElementById(elId);
        if (el) el.value = v || '';
    };
    set('stockTakeDate', snap.date);
    set('stockTakeBy', snap.conductedBy);
    set('stockTakeLocation', snap.location);
    set('stockTakeNotes', snap.notes);
    if (snap.filters) {
        const fam = document.getElementById('stockTakeFamily');
        if (fam && snap.filters.family) fam.value = snap.filters.family;
        const zero = document.getElementById('stockTakeShowZero');
        if (zero) zero.checked = !!snap.filters.showZero;
        const all = document.getElementById('stockTakeShowAllCatalog');
        if (all) all.checked = !!snap.filters.showAllCatalog;
    }
    renderStockTakeTable();
    // apply saved physical counts
    const byId = Object.fromEntries((snap.lines || []).map((l) => [l.itemId, l]));
    document.querySelectorAll('#stockTakeBody tr[data-item-id]').forEach((tr) => {
        const line = byId[tr.getAttribute('data-item-id')];
        if (!line) return;
        const phys = tr.querySelector('.st-physical');
        const rem = tr.querySelector('.st-remarks');
        if (phys) phys.value = line.physicalCount;
        if (rem) rem.value = line.remarks || '';
        updateStockTakeRowVariance(tr);
    });
    if (typeof showToast === 'function') showToast(`Loaded stock take ${snap.date}`, 'info');
}

function fillStockTakePhysicalFromSystem() {
    document.querySelectorAll('#stockTakeBody tr[data-item-id]').forEach((tr) => {
        const system = Number(tr.querySelector('.st-system')?.getAttribute('data-system')) || 0;
        const phys = tr.querySelector('.st-physical');
        if (phys) phys.value = system;
        updateStockTakeRowVariance(tr);
    });
}

function buildStockTakeReportData() {
    const snap = collectStockTakeSnapshotFromDom();
    const surplus = snap.lines.filter((l) => l.variance > 0);
    const deficit = snap.lines.filter((l) => l.variance < 0);
    const families = {};
    snap.lines.forEach((l) => {
        const k = l.familyKey || 'other';
        if (!families[k]) families[k] = { label: l.familyLabel || k, lines: 0, system: 0, physical: 0 };
        families[k].lines += 1;
        families[k].system += l.systemOnHand;
        families[k].physical += l.physicalCount;
    });

    return {
        title: 'IT Dir Tech Stores — Stock Take',
        summary: [
            `Date: ${snap.date}`,
            `Conducted by: ${snap.conductedBy || '—'}`,
            `Location: ${snap.location || '—'}`,
            `Lines: ${snap.lines.length}`,
            `Surplus lines: ${surplus.length}`,
            `Deficient lines: ${deficit.length}`,
            `Families: ${Object.values(families).map((f) => `${f.label} (${f.lines})`).join(' · ') || '—'}`
        ],
        fields: [
            { label: 'Directorate', value: 'Information Technology Directorate' },
            { label: 'Department', value: 'TechStores' },
            { label: 'Cost Centre', value: 'Z04P2SP212' },
            { label: 'Notes', value: snap.notes || '—' }
        ],
        tables: [
            {
                tbodyId: 'stock-take-report',
                title: 'Stock take lines',
                headers: ['Family / Ledger', 'Item', 'GL', 'System', 'Physical', 'Variance', 'Remarks'],
                rows: snap.lines.map((l) => [
                    `${l.familyLabel || ''} / ${l.ledgerLabel || ''}`,
                    l.itemName,
                    l.gl,
                    String(l.systemOnHand),
                    String(l.physicalCount),
                    `${l.variance > 0 ? '+' : ''}${l.variance}`,
                    l.remarks || ''
                ])
            }
        ]
    };
}

function pushStockTakeToQ987() {
    const tbody = document.getElementById('zna-q-987-table-body');
    if (!tbody || typeof buildZnaQ987Row !== 'function') {
        if (typeof showToast === 'function') showToast('ZNA Q 987 form is not available.', 'error');
        return;
    }
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;
    const snap = collectStockTakeSnapshotFromDom();
    if (!snap.lines.length) {
        if (typeof showToast === 'function') showToast('No stock take lines to push.', 'error');
        return;
    }
    tbody.innerHTML = '';
    const atEl = document.getElementById('q987At');
    if (atEl && !atEl.value) atEl.value = snap.location || '';
    const sigEl = document.getElementById('q987StockTakerSig');
    if (sigEl && !sigEl.value) sigEl.value = snap.conductedBy || '';
    const yearEl = document.getElementById('q987Year');
    if (yearEl && !yearEl.value && snap.date) yearEl.value = String(snap.date).slice(2, 4);

    snap.lines.forEach((line) => {
        const tr = buildZnaQ987Row();
        const inputs = tr.querySelectorAll('input');
        // Ledger use | Description | VAQS | Stock | Bin Bal | Ledger Bal | Surplus | Deficient | TV | Remarks
        if (inputs[0]) inputs[0].value = line.ledgerLabel || line.familyLabel || '';
        if (inputs[1]) inputs[1].value = line.itemName || '';
        if (inputs[3]) inputs[3].value = String(line.physicalCount);
        if (inputs[4]) inputs[4].value = String(line.physicalCount);
        if (inputs[5]) inputs[5].value = String(line.systemOnHand);
        if (inputs[6]) inputs[6].value = line.variance > 0 ? String(line.variance) : '';
        if (inputs[7]) inputs[7].value = line.variance < 0 ? String(Math.abs(line.variance)) : '';
        if (inputs[9]) inputs[9].value = line.remarks || '';
        tbody.appendChild(tr);
    });
    if (typeof navigateToModule === 'function') navigateToModule('zna-q-987');
    if (typeof showToast === 'function') {
        showToast(`Pushed ${snap.lines.length} line(s) to ZNA Q 987 — review surplus/deficient columns.`, 'success');
    }
}

function pushStockTakeSurplusToQ1033() {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;
    if (typeof buildZnaQ1033Row !== 'function') {
        showToast?.('ZNA Q 1033 form is not available.', 'error');
        return;
    }
    const snap = collectStockTakeSnapshotFromDom();
    const surplus = snap.lines.filter((l) => Number(l.variance) > 0);
    if (!surplus.length) {
        showToast?.('No surplus lines (physical > system) to push.', 'info');
        return;
    }
    if (typeof confirmAction === 'function'
        && !confirmAction(`Push ${surplus.length} surplus line(s) to ZNA Q 1033 (bring-on / receipt)?`)) {
        return;
    }
    const tbody = document.getElementById('zna-q-1033-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';
    const auth = document.getElementById('q1033Authority');
    if (auth) auth.value = `Stock take surplus · ${snap.date || ''} · ${snap.location || ''}`.trim();
    const issuedBy = document.getElementById('q1033IssuedBy');
    if (issuedBy && !issuedBy.value) issuedBy.value = snap.conductedBy || '';
    const issueDate = document.getElementById('q1033IssueDate');
    if (issueDate && snap.date) issueDate.value = snap.date;
    const receiptDate = document.getElementById('q1033ReceiptDate');
    if (receiptDate && snap.date) receiptDate.value = snap.date;

    surplus.forEach((line) => {
        const tr = buildZnaQ1033Row();
        const inputs = tr.querySelectorAll('input');
        if (inputs[1]) inputs[1].value = line.itemName || '';
        if (inputs[2]) inputs[2].value = String(Math.abs(line.variance));
        if (inputs[4]) inputs[4].value = String(line.physicalCount);
        if (inputs[5]) inputs[5].value = line.ledgerLabel || line.familyLabel || snap.location || '';
        if (inputs[10]) inputs[10].value = line.remarks || 'Surplus from stock take';
        tbody.appendChild(tr);
    });
    navigateToModule?.('zna-q-1033');
    showToast?.(`Pushed ${surplus.length} surplus line(s) to Q 1033.`, 'success');
}

function pushStockTakeDeficitToQ998() {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;
    if (typeof buildZnaQ998Row !== 'function') {
        showToast?.('ZNA Q 998 form is not available.', 'error');
        return;
    }
    const snap = collectStockTakeSnapshotFromDom();
    const deficit = snap.lines.filter((l) => Number(l.variance) < 0);
    if (!deficit.length) {
        showToast?.('No deficit lines (physical < system) to push.', 'info');
        return;
    }
    if (typeof confirmAction === 'function'
        && !confirmAction(`Push ${deficit.length} deficit line(s) to ZNA Q 998 (loss/damage)? You can continue to Q 1 write-off after.`)) {
        return;
    }
    const tbody = document.getElementById('zna-q-998-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';
    const dateEl = document.getElementById('q998Date');
    if (dateEl && snap.date) dateEl.value = snap.date;
    const loc = document.getElementById('q998Location');
    if (loc) loc.value = snap.location || '';
    const circ = document.getElementById('q998Circumstance');
    if (circ && !circ.value) {
        circ.value = `Stock take variance (deficit) recorded ${snap.date || ''} at ${snap.location || 'stores'} by ${snap.conductedBy || 'stock taker'}.`;
    }
    const action = document.getElementById('q998ActionTaken');
    if (action) action.value = 'Write-off on Q 1 / investigate';
    const reporter = document.getElementById('q998Reporter');
    if (reporter && !reporter.value) reporter.value = snap.conductedBy || '';

    deficit.forEach((line) => {
        const tr = buildZnaQ998Row();
        const inputs = tr.querySelectorAll('input');
        if (inputs[0]) inputs[0].value = line.itemName || '';
        if (inputs[2]) inputs[2].value = String(Math.abs(line.variance));
        if (inputs[3]) inputs[3].value = 'Deficit / unaccounted';
        if (inputs[5]) inputs[5].value = line.remarks || `${line.ledgerLabel || ''} · system ${line.systemOnHand} / physical ${line.physicalCount}`;
        tbody.appendChild(tr);
    });
    navigateToModule?.('zna-q-998');
    showToast?.(`Pushed ${deficit.length} deficit line(s) to Q 998. Open Q 1 for write-off schedule if authorised.`, 'success');
}

function pushStockTakeDeficitToQ1() {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;
    if (typeof buildZnaQ1Row !== 'function') {
        showToast?.('ZNA Q 1 form is not available.', 'error');
        return;
    }
    const snap = collectStockTakeSnapshotFromDom();
    const deficit = snap.lines.filter((l) => Number(l.variance) < 0);
    if (!deficit.length) {
        showToast?.('No deficit lines to push to Q 1.', 'info');
        return;
    }
    if (typeof confirmAction === 'function'
        && !confirmAction(`Push ${deficit.length} deficit line(s) to ZNA Q 1 write-off schedule?`)) {
        return;
    }
    const tbody = document.getElementById('zna-q-1-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';
    const dateEl = document.getElementById('q1Date');
    if (dateEl && snap.date) dateEl.value = snap.date;
    const reason = document.getElementById('q1Reason');
    if (reason) reason.value = 'Loss';
    const auth = document.getElementById('q1Authority');
    if (auth && !auth.value) auth.value = 'ASO Ch 6 / stock take deficit';
    const qm = document.getElementById('q1QmSig');
    if (qm && !qm.value) qm.value = snap.conductedBy || '';

    deficit.forEach((line) => {
        const tr = buildZnaQ1Row();
        const inputs = tr.querySelectorAll('input');
        if (inputs[0]) inputs[0].value = line.itemName || '';
        if (inputs[1]) inputs[1].value = String(Math.abs(line.variance));
        if (inputs[3]) inputs[3].value = 'Stock take';
        if (inputs[4]) inputs[4].value = line.remarks || `System ${line.systemOnHand} / Physical ${line.physicalCount}`;
        tbody.appendChild(tr);
    });
    navigateToModule?.('zna-q-1');
    showToast?.(`Pushed ${deficit.length} deficit line(s) to Q 1.`, 'success');
}

function openAnnualStockTakePack() {
    const year = new Date().getFullYear();
    const checklist = [
        `Annual stock take — physical count by 31 May ${year}`,
        `Consolidate Q 987 board / stock sheets`,
        `Surplus → Q 1033 bring-on; deficit → Q 998 then Q 1 write-off`,
        `Submit unit return pack to Brigade / formation by 20 June ${year}`,
        `Retain working papers and backups for 3 years and/or only after Army Internal Audit before destruction (ASO Ch 25)`,
        `Log Ch 28 unit checks separately in Unit Check Log`
    ];
    const msg = `Annual stock-take pack (${year})\n\n` + checklist.map((c, i) => `${i + 1}. ${c}`).join('\n')
        + '\n\nOpen Q Forms Index for the related forms?';
    if (typeof confirmAction === 'function' ? confirmAction(msg) : window.confirm(msg)) {
        navigateToModule?.('zna-q-forms-index');
        const scope = document.getElementById('znaQIndexScope');
        if (scope) {
            scope.value = 'implemented';
            scope.dispatchEvent(new Event('change'));
        }
        const search = document.getElementById('znaQIndexSearch');
        if (search) {
            search.value = '987';
            search.dispatchEvent(new Event('input'));
        }
    }
    showToast?.('Annual pack: count by 31 May · Bde return by 20 Jun.', 'info');
}

function initStockTakeModule() {
    const host = document.getElementById('stock-take');
    if (!host || host.dataset.stockTakeInit === '1') return;
    host.dataset.stockTakeInit = '1';

    const dateEl = document.getElementById('stockTakeDate');
    if (dateEl && !dateEl.value) dateEl.value = new Date().toISOString().slice(0, 10);
    const byEl = document.getElementById('stockTakeBy');
    if (byEl && !byEl.value && typeof currentUser !== 'undefined') {
        byEl.value = currentUser?.name || currentUser?.username || '';
    }

    const fam = document.getElementById('stockTakeFamily');
    if (fam && !fam.dataset.filled) {
        fam.innerHTML = '<option value="all">All families</option>'
            + STOCK_TAKE_FAMILIES.map((f) => `<option value="${stEscape(f.key)}">${stEscape(f.label)}</option>`).join('');
        fam.dataset.filled = '1';
    }

    document.getElementById('stockTakeRefreshBtn')?.addEventListener('click', () => renderStockTakeTable());
    document.getElementById('stockTakeFamily')?.addEventListener('change', () => renderStockTakeTable());
    document.getElementById('stockTakeSearch')?.addEventListener('input', () => renderStockTakeTable());
    document.getElementById('stockTakeShowZero')?.addEventListener('change', () => renderStockTakeTable());
    document.getElementById('stockTakeShowAllCatalog')?.addEventListener('change', () => renderStockTakeTable());
    document.getElementById('stockTakeFillSystemBtn')?.addEventListener('click', fillStockTakePhysicalFromSystem);
    document.getElementById('stockTakeSaveBtn')?.addEventListener('click', saveStockTakeSnapshot);
    document.getElementById('stockTakePushQ987Btn')?.addEventListener('click', pushStockTakeToQ987);
    document.getElementById('stockTakePushQ1033Btn')?.addEventListener('click', pushStockTakeSurplusToQ1033);
    document.getElementById('stockTakePushQ998Btn')?.addEventListener('click', pushStockTakeDeficitToQ998);
    document.getElementById('stockTakePushQ1Btn')?.addEventListener('click', pushStockTakeDeficitToQ1);
    document.getElementById('stockTakeAnnualPackBtn')?.addEventListener('click', openAnnualStockTakePack);
    document.getElementById('stockTakeHistory')?.addEventListener('change', (e) => {
        const id = e.target.value;
        if (id) loadStockTakeSnapshot(id);
    });

    document.getElementById('stockTakeBody')?.addEventListener('input', (e) => {
        if (e.target.classList.contains('st-physical') || e.target.classList.contains('st-remarks')) {
            updateStockTakeRowVariance(e.target.closest('tr'));
        }
    });
    document.getElementById('stockTakeBody')?.addEventListener('click', (e) => {
        const btn = e.target.closest('.st-fill-system');
        if (!btn) return;
        const tr = btn.closest('tr');
        const system = Number(tr?.querySelector('.st-system')?.getAttribute('data-system')) || 0;
        const phys = tr?.querySelector('.st-physical');
        if (phys) phys.value = system;
        updateStockTakeRowVariance(tr);
    });

    refreshStockTakeHistorySelect();
    renderStockTakeTable();
}
