/* bids-import.js — Load official IT DIR Excel bids into Financial Year Bids */

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
    // Layout: serial cell (text), item, costCentre, gl select, description, qty, unit, total, action
    const serialCell = tr.querySelector('td:first-child');
    if (serialCell && !serialCell.querySelector('input')) {
        serialCell.textContent = String(serial);
    }
    if (inputs[0]) inputs[0].value = item.item || '';
    if (inputs[1]) inputs[1].value = item.costCentre || 'Z04P2SP212';
    if (inputs[2] && inputs[2].tagName === 'SELECT') {
        inputs[2].innerHTML = getBidGlOptionsHtml(item.gl);
        inputs[2].value = item.gl || '2200600002';
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

function loadItDirBidsPack(packId, options = {}) {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return false;
    const pack = typeof getItDirBidsPack === 'function' ? getItDirBidsPack(packId) : null;
    if (!pack || !Array.isArray(pack.items) || !pack.items.length) {
        showToast('Bid pack not found or empty.', 'error');
        return false;
    }

    const glFilter = options.glFilter || document.getElementById('bidsPackGlFilter')?.value || 'all';
    let items = pack.items.slice();
    if (glFilter && glFilter !== 'all') {
        items = items.filter((i) => String(i.gl) === String(glFilter));
    }
    if (!items.length) {
        showToast('No bid lines for that GL filter.', 'error');
        return false;
    }

    const mode = options.mode || document.getElementById('bidsPackLoadMode')?.value || 'replace';
    if (mode === 'replace') {
        const ok = options.force || confirm(
            `Load ${pack.label} into Financial Year Bids?\n\n` +
            `${items.length} line(s)` +
            (glFilter !== 'all' ? ` (GL ${glFilter})` : '') +
            `\nTotal ≈ USD ${items.reduce((s, i) => s + (Number(i.totalCost) || 0), 0).toLocaleString()}\n\n` +
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
        // buildBidRow already appends? No - it creates element. addBidRow appends.
        // buildBidRow uses current tbody length for serial - append first then fill
        tbody.appendChild(tr);
        fillBidRowFromItem(tr, item, startSer + idx);
    });

    // Fix serials
    Array.from(tbody.rows).forEach((tr, i) => {
        const cell = tr.querySelector('td:first-child');
        if (cell && !cell.querySelector('input')) cell.textContent = String(i + 1);
    });

    if (typeof initBidCalculations === 'function') initBidCalculations();
    if (typeof saveModule === 'function') saveModule('financial-year-bids');
    updateBidsPackSummary(pack, items);
    if (typeof updateDashboard === 'function') updateDashboard();

    showToast(`Loaded ${items.length} bid line(s) from ${pack.label}.`);
    return true;
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
        ? `<strong>${pack.label}</strong> (FY ${pack.fy}) — ${list.length} lines · USD ${total.toLocaleString()}` +
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

function initFinancialYearBidsImport() {
    const moduleEl = document.getElementById('financial-year-bids');
    if (!moduleEl || moduleEl.dataset.bidsImportInit === '1') return;
    moduleEl.dataset.bidsImportInit = '1';

    populateBidsPackSelect();

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

    // Keep legacy file input: guide user that official packs are preferred
    const fileInput = document.getElementById('excelFile');
    if (fileInput && fileInput.dataset.bound !== '1') {
        fileInput.dataset.bound = '1';
        fileInput.addEventListener('change', () => {
            showToast(
                'Official IT DIR BIDS workbooks are already built into the system. Use “Load Official Bids Pack” above. Custom Excel import can be added later if needed.',
                'info'
            );
            fileInput.value = '';
        });
    }
}
