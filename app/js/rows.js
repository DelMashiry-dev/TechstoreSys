/* rows.js — row builders and stock/job calculations */

function buildGl2200600002Row() {
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td><input type="date" class="form-control"></td>
        <td><input type="text" class="form-control"></td>
        <td><input type="text" class="form-control"></td>
        <td><input type="text" class="form-control"></td>
        <td><input type="text" class="form-control"></td>
        <td><input type="number" class="form-control gl-issue-qty" min="0" step="1"></td>
        <td><input type="text" class="form-control"></td>
    `;
    attachConsumablesStockRow(tr);
    return tr;
}

function buildStockLedgerRow() {
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td><input type="date" class="form-control"></td>
        <td><input type="text" class="form-control"></td>
        <td><input type="number" class="form-control gl-stock-receipts" min="0" step="1"></td>
        <td><input type="number" class="form-control gl-stock-issues" min="0" step="1"></td>
        <td><input type="number" class="form-control gl-stock-balance stock-summary-readonly" readonly></td>
        <td><input type="text" class="form-control"></td>
        <td><input type="text" class="form-control"></td>
    `;
    attachStockLedgerRow(tr);
    return tr;
}

function buildJobCardRow() {
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td></td>
        <td><input type="text" class="form-control"></td>
        <td><input type="text" class="form-control"></td>
        <td><input type="number" class="form-control job-card-qty" min="0" step="1"></td>
        <td>EA</td>
        <td><input type="number" class="form-control job-card-price" min="0" step="0.01"></td>
        <td><input type="number" class="form-control job-card-amount" readonly></td>
    `;
    attachJobCardRowCalculations(tr);
    return tr;
}

function buildVoucherRow() {
    const defaultGl = document.getElementById('voucherDefaultGl')?.value || '2200600002';
    const catSelect = typeof buildVoucherCategorySelectHtml === 'function'
        ? buildVoucherCategorySelectHtml('ict-equipment')
        : `<select class="form-control voucher-item-category">
            <option value="consumables-toners">Toners &amp; Ink</option>
            <option value="consumables-media">Storage Media</option>
            <option value="spares-parts">Parts / Spares</option>
            <option value="maintenance-equipment">Maint. Equipment</option>
            <option value="software-licences">Software</option>
            <option value="ict-equipment" selected>ICT Equipment</option>
        </select>`;
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td><input type="date" class="form-control voucher-date" data-date-rule="not-future" data-date-label="Voucher date"></td>
        <td>${catSelect}</td>
        <td><input type="text" class="form-control voucher-item-name" placeholder="Item name"></td>
        <td><input type="text" class="form-control" placeholder="Description"></td>
        <td><input type="number" class="form-control voucher-qty" min="0" step="1"></td>
        <td><input type="text" class="form-control" placeholder="EA"></td>
        <td>${buildGlSelectHtml('voucher-gl', defaultGl)}</td>
        <td><input type="number" class="form-control voucher-unit-cost" min="0" step="0.01"></td>
        <td><input type="number" class="form-control voucher-line-total" readonly></td>
        <td><input type="text" class="form-control" placeholder="IV / RV No."></td>
        <td><input type="text" class="form-control"></td>
        <td><input type="text" class="form-control"></td>
        <td><input type="text" class="form-control" placeholder="Name"></td>
        <td><input type="text" class="form-control voucher-appointment" placeholder="e.g. TSO, OC DBA"></td>
        <td><input type="text" class="form-control"></td>
        <td><button class="btn btn-danger btn-sm" onclick="removeRow(this)">Remove</button></td>
    `;
    attachVoucherRowCalculations(tr);
    return tr;
}

function buildBidRow() {
    const tbody = document.getElementById('bids-table-body');
    const rowCount = tbody ? tbody.rows.length + 1 : 1;
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td>${rowCount}</td>
        <td><input type="text" class="form-control"></td>
        <td><input type="text" class="form-control" value="Z04P2SP212" readonly></td>
        <td>
            <select class="form-control">
                <option value="6122100009">6122100009 - Office Supplies &amp; Services (ZOFF)</option>
                <option value="2200600002">2200600002 - Computer Consumables (legacy)</option>
                <option value="2200600003">2200600003 - Software Licenses</option>
                <option value="220200002">220200002 - Tech Equipment Maintenance</option>
                <option value="2201900002">2201900002 - Spare Parts</option>
                <option value="3112210001">3112210001 - ICT Equipment</option>
            </select>
        </td>
        <td><input type="text" class="form-control"></td>
        <td><input type="number" class="form-control bid-qty"></td>
        <td><input type="number" class="form-control bid-unit-cost"></td>
        <td><input type="number" class="form-control bid-total-cost" readonly></td>
        <td><button class="btn btn-danger btn-sm" onclick="removeRow(this)">Remove</button></td>
    `;
    attachBidRowCalculations(tr);
    return tr;
}

const UNIT_EQUIPMENT_LOCATIONS = [
    'System Development Department',
    'Workshop',
    'ITTS',
    'Orderly Room',
    'DBA',
    'QM',
    'Programmers',
    'AQSO',
    'RP',
    'Server Room'
];

function buildUnitEquipmentLocationOptions(selected) {
    const current = selected || '';
    const opts = ['<option value="">— IT Dir location —</option>'].concat(
        UNIT_EQUIPMENT_LOCATIONS.map((loc) =>
            `<option value="${loc}"${loc === current ? ' selected' : ''}>${loc}</option>`
        )
    );
    if (current && !UNIT_EQUIPMENT_LOCATIONS.includes(current)) {
        opts.splice(1, 0, `<option value="${current}" selected>${current}</option>`);
    }
    return opts.join('');
}

function extractZaFromText(value) {
    const m = String(value || '').match(/\bZA\s*-?\s*(\d+)\b/i);
    if (!m) return '';
    return `ZA${m[1]}`;
}

function normalizeUnitEquipmentRow(row) {
    let item = String(row.item || '').trim();
    let zaNumber = String(row.zaNumber || '').trim().toUpperCase().replace(/\s+/g, '');
    let description = String(row.description || '').trim();
    let holdingUnit = String(row.holdingUnit || '').trim();
    let location = String(row.location || '').trim();

    if (!zaNumber) {
        const fromDesc = extractZaFromText(description);
        const fromItem = extractZaFromText(item);
        zaNumber = fromDesc || fromItem || '';
        if (fromDesc && description.replace(/\s+/g, '').toUpperCase() === zaNumber) {
            description = '';
        }
    } else if (!/^ZA/i.test(zaNumber) && /^\d+$/.test(zaNumber)) {
        zaNumber = `ZA${zaNumber}`;
    }

    if (!holdingUnit && location) holdingUnit = location;

    return {
        ser: row.ser || 0,
        item,
        zaNumber,
        description,
        holdingUnit,
        location
    };
}

function attachUnitEquipmentRow(tr) {
    if (!tr) return;
    const holding = tr.querySelector('select.ue-holding-unit');
    if (holding && typeof wireZnaUnitPicker === 'function') {
        wireZnaUnitPicker(holding, null, { includeBlank: true, includeOther: true, blankLabel: '— Select holding unit —' });
    } else if (holding && typeof fillZnaUnitSelect === 'function') {
        fillZnaUnitSelect(holding, holding.value || '', { includeBlank: true, includeOther: true, blankLabel: '— Select holding unit —' });
    }
    const loc = tr.querySelector('select.ue-location');
    if (loc && !loc.options.length) {
        loc.innerHTML = buildUnitEquipmentLocationOptions(loc.value || '');
    }
}

function buildUnitEquipmentRow(seed = {}) {
    const tbody = document.getElementById('unit-equipment-table-body');
    const rowCount = tbody ? tbody.rows.length + 1 : 1;
    const holdingOptions = typeof buildZnaUnitOptionsHtml === 'function'
        ? buildZnaUnitOptionsHtml(seed.holdingUnit || '', { includeBlank: true, includeOther: true, blankLabel: '— Select holding unit —' })
        : '<option value="">— Select holding unit —</option>';
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td>${rowCount}</td>
        <td><input type="text" class="form-control ue-item" placeholder="Item name" value="${ueEscapeAttr(seed.item || '')}"></td>
        <td><input type="text" class="form-control ue-za" placeholder="e.g. ZA820" value="${ueEscapeAttr(seed.zaNumber || '')}"></td>
        <td><input type="text" class="form-control ue-desc" placeholder="Model / notes" value="${ueEscapeAttr(seed.description || '')}"></td>
        <td>
            <select class="form-control ue-holding-unit zna-unit-select" title="Holding unit / formation">
                ${holdingOptions}
            </select>
        </td>
        <td>
            <select class="form-control ue-location">
                ${buildUnitEquipmentLocationOptions(seed.location || '')}
            </select>
        </td>
        <td><button class="btn btn-danger btn-sm" onclick="removeRow(this)">Remove</button></td>
    `;
    attachUnitEquipmentRow(tr);
    return tr;
}

function ueEscapeAttr(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;');
}

function collectUnitEquipmentRows() {
    const tbody = document.getElementById('unit-equipment-table-body');
    if (!tbody) return [];
    return Array.from(tbody.querySelectorAll('tr')).map((tr, index) => {
        const item = (tr.querySelector('.ue-item')?.value
            || tr.querySelectorAll('input')[0]?.value
            || '').trim();
        const zaNumber = (tr.querySelector('.ue-za')?.value
            || tr.querySelectorAll('input')[1]?.value
            || '').trim();
        const description = (tr.querySelector('.ue-desc')?.value
            || tr.querySelectorAll('input')[2]?.value
            || '').trim();
        const holdingUnit = (tr.querySelector('select.ue-holding-unit')?.value || '').trim();
        const location = (tr.querySelector('select.ue-location')?.value
            || tr.querySelectorAll('select')[tr.querySelector('select.ue-holding-unit') ? 1 : 0]?.value
            || '').trim();

        const normalized = normalizeUnitEquipmentRow({
            ser: index + 1,
            item,
            zaNumber,
            description,
            holdingUnit,
            location
        });
        if (!normalized.item && !normalized.zaNumber && !normalized.description) return null;
        return normalized;
    }).filter(Boolean);
}

/**
 * Push Unit Equipment rows into ZNA ICT Asset Register so Track (ZA / item) can find them.
 */
function syncUnitEquipmentToAssetRegister(options = {}) {
    if (typeof ensureIctAccountability !== 'function' || typeof createIctAccountabilityRecord !== 'function') {
        if (typeof showToast === 'function') showToast('Asset Register is not available.', 'error');
        return { synced: 0, skipped: 0 };
    }
    const quiet = options.quiet === true;
    const rows = collectUnitEquipmentRows();
    const list = ensureIctAccountability();
    let synced = 0;
    let skipped = 0;

    rows.forEach((row) => {
        if (!row.item && !row.zaNumber) {
            skipped += 1;
            return;
        }
        const za = String(row.zaNumber || '').trim().toUpperCase();
        const holding = row.holdingUnit || row.location || '';
        let existing = null;
        if (za) {
            existing = list.find((r) => String(r.zaNumber || '').toUpperCase() === za);
        }
        if (!existing && row.item) {
            existing = list.find((r) =>
                r.sourceModule === 'unit-equipment'
                && String(r.designation || '').toLowerCase() === row.item.toLowerCase()
                && !r.zaNumber
            );
        }

        const remarksParts = [];
        if (row.location) remarksParts.push(`IT Dir location: ${row.location}`);
        if (existing?.remarks && !String(existing.remarks).includes(`IT Dir location: ${row.location || ''}`)) {
            // keep prior non-location remarks lightly
            const prior = String(existing.remarks).replace(/IT Dir location:\s*[^·|]+/gi, '').trim();
            if (prior) remarksParts.push(prior);
        }

        const partial = createIctAccountabilityRecord({
            id: existing?.id,
            assetClass: 'equipment',
            designation: row.item || existing?.designation || za || 'Unit equipment',
            description: row.description || existing?.description || '',
            zaNumber: za || existing?.zaNumber || '',
            unit: holding || existing?.unit || '',
            status: holding ? 'issued' : (existing?.status || 'in_stores'),
            engraved: !!(za || existing?.engraved),
            qty: existing?.qty || 1,
            remarks: remarksParts.filter(Boolean).join(' · '),
            createdAt: existing?.createdAt,
            sourceModule: 'unit-equipment'
        });

        // Allow sync even without ZA for named items (validate would block equipment without ZA)
        if (partial.assetClass === 'equipment' && !partial.zaNumber) {
            partial.assetClass = 'equipment';
            partial.engraved = false;
        }

        if (!partial.designation) {
            skipped += 1;
            return;
        }

        // Bypass toast validation for sync: equipment without ZA still gets registered as trackable named item
        const idx = list.findIndex((r) => r.id === partial.id);
        const toSave = {
            ...partial,
            updatedAt: new Date().toISOString()
        };
        // Store source marker (not in create schema formally but kept on object)
        toSave.sourceModule = 'unit-equipment';

        if (idx >= 0) {
            list[idx] = {
                ...list[idx],
                ...toSave,
                id: list[idx].id,
                createdAt: list[idx].createdAt
            };
        } else {
            // If equipment without ZA, still allow for tracking by item name
            if (toSave.assetClass === 'equipment' && !toSave.zaNumber) {
                toSave.traceRef = toSave.traceRef || `UE-${Date.now().toString(36)}`;
            }
            list.unshift(toSave);
        }
        synced += 1;
    });

    if (typeof saveState === 'function') saveState();
    if (typeof renderIctAccountabilityTable === 'function') renderIctAccountabilityTable();

    if (!quiet && typeof showToast === 'function') {
        showToast(
            synced
                ? `Synced ${synced} item(s) to ZNA ICT Asset Register for tracking.`
                : 'No unit equipment rows to sync.',
            synced ? 'success' : 'info'
        );
    }
    return { synced, skipped };
}

function renderUnitEquipmentView() {
    const viewBody = document.getElementById('unit-equipment-view-body');
    const summary = document.getElementById('ueSummaryStrip');
    const locationFilterEl = document.getElementById('ueLocationFilter');
    const holdingFilterEl = document.getElementById('ueHoldingFilter');
    if (!viewBody) return;

    const q = (document.getElementById('ueSearchInput')?.value || '').trim().toLowerCase();
    const locationFilter = locationFilterEl?.value || 'all';
    const holdingFilter = holdingFilterEl?.value || 'all';
    const rows = collectUnitEquipmentRows();

    if (locationFilterEl) {
        const prev = locationFilterEl.value || 'all';
        const locations = [...new Set([
            ...UNIT_EQUIPMENT_LOCATIONS,
            ...rows.map((r) => r.location).filter(Boolean)
        ])];
        locationFilterEl.innerHTML = `<option value="all">All locations</option>`
            + locations.map((loc) => `<option value="${loc}">${loc}</option>`).join('');
        if ([...locationFilterEl.options].some((o) => o.value === prev)) locationFilterEl.value = prev;
    }

    if (holdingFilterEl && holdingFilterEl.dataset.znaFilterReady !== '1') {
        initUeHoldingFilter();
    }

    const filtered = rows.filter((row) => {
        if (locationFilter !== 'all' && row.location !== locationFilter) return false;
        if (holdingFilter !== 'all' && row.holdingUnit !== holdingFilter) return false;
        if (!q) return true;
        const holdingLabel = typeof resolveZnaUnitLabel === 'function'
            ? resolveZnaUnitLabel(row.holdingUnit)
            : row.holdingUnit;
        return `${row.item} ${row.zaNumber} ${row.description} ${row.holdingUnit} ${holdingLabel} ${row.location}`
            .toLowerCase()
            .includes(q);
    });

    if (summary) {
        const counts = {};
        rows.forEach((row) => {
            const key = row.holdingUnit || row.location || 'Unassigned';
            counts[key] = (counts[key] || 0) + 1;
        });
        const chips = Object.entries(counts)
            .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
            .map(([loc, count]) => {
                const label = typeof resolveZnaUnitLabel === 'function' ? resolveZnaUnitLabel(loc) : loc;
                return `<div class="ue-summary-chip"><strong>${count}</strong><span>${ueEscape(label)}</span></div>`;
            })
            .join('');
        summary.innerHTML = `
            <div class="ue-summary-chip ue-summary-total"><strong>${rows.length}</strong><span>Total items</span></div>
            ${chips || '<div class="ue-summary-chip"><strong>0</strong><span>No holding units yet</span></div>'}
        `;
    }

    if (!filtered.length) {
        viewBody.innerHTML = `<tr><td colspan="6" class="req-empty-row">${
            rows.length ? 'No equipment matches this search/filter.' : 'No equipment recorded yet. Switch to Edit Records to add items.'
        }</td></tr>`;
        return;
    }

    viewBody.innerHTML = filtered.map((row, idx) => {
        const holdingLabel = typeof resolveZnaUnitLabel === 'function'
            ? (resolveZnaUnitLabel(row.holdingUnit) || row.holdingUnit || '—')
            : (row.holdingUnit || '—');
        return `
            <tr>
                <td>${idx + 1}</td>
                <td><strong>${ueEscape(row.item || '—')}</strong></td>
                <td><strong class="ict-acc-za">${ueEscape(row.zaNumber || '—')}</strong></td>
                <td>${ueEscape(row.description || '—')}</td>
                <td><span class="ue-location-pill ue-holding-pill">${ueEscape(holdingLabel)}</span></td>
                <td><span class="ue-location-pill">${ueEscape(row.location || '—')}</span></td>
            </tr>
        `;
    }).join('');
}

function ueEscape(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function setUnitEquipmentMode(mode) {
    const viewPanel = document.getElementById('ueViewPanel');
    const editPanel = document.getElementById('ueEditPanel');
    const viewBtn = document.getElementById('ueViewModeBtn');
    const editBtn = document.getElementById('ueEditModeBtn');
    const isView = mode !== 'edit';

    if (viewPanel) viewPanel.hidden = !isView;
    if (editPanel) editPanel.hidden = isView;
    if (viewBtn) viewBtn.classList.toggle('btn-secondary', isView);
    if (viewBtn) viewBtn.classList.toggle('btn-ghost', !isView);
    if (editBtn) editBtn.classList.toggle('btn-secondary', !isView);
    if (editBtn) editBtn.classList.toggle('btn-ghost', isView);

    if (isView) renderUnitEquipmentView();
}

function initUeHoldingFilter() {
    const hf = document.getElementById('ueHoldingFilter');
    if (!hf || hf.dataset.znaFilterReady === '1') return;
    hf.dataset.znaFilterReady = '1';
    const znaOpts = typeof buildZnaUnitOptionsHtml === 'function'
        ? buildZnaUnitOptionsHtml('', { includeBlank: false, includeOther: false })
        : '';
    hf.innerHTML = `<option value="all">All holding units</option>${znaOpts}`;
    hf.value = 'all';
    if (typeof mountTypeableSelect === 'function') {
        mountTypeableSelect(hf, { placeholder: 'All holding units', allowCustom: false, maxItems: 220 });
    }
}

function initUnitEquipmentModule() {
    const moduleEl = document.getElementById('unit-equipment');
    if (!moduleEl || moduleEl.dataset.ueInit === '1') return;
    moduleEl.dataset.ueInit = '1';

    initUeHoldingFilter();
    document.getElementById('unit-equipment-table-body')?.querySelectorAll('tr').forEach(attachUnitEquipmentRow);

    document.getElementById('ueViewModeBtn')?.addEventListener('click', () => setUnitEquipmentMode('view'));
    document.getElementById('ueEditModeBtn')?.addEventListener('click', () => setUnitEquipmentMode('edit'));
    document.getElementById('ueSearchBtn')?.addEventListener('click', () => {
        const input = document.getElementById('ueSearchInput');
        if (input && typeof commitSearchInput === 'function') commitSearchInput(input);
        renderUnitEquipmentView();
        setUnitEquipmentMode('view');
    });
    document.getElementById('ueClearBtn')?.addEventListener('click', () => {
        const input = document.getElementById('ueSearchInput');
        if (input) input.value = '';
        const locationFilter = document.getElementById('ueLocationFilter');
        if (locationFilter) locationFilter.value = 'all';
        const holdingFilter = document.getElementById('ueHoldingFilter');
        if (holdingFilter) holdingFilter.value = 'all';
        renderUnitEquipmentView();
        setUnitEquipmentMode('view');
    });
    document.getElementById('ueSearchInput')?.addEventListener('input', renderUnitEquipmentView);
    document.getElementById('ueSearchInput')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            renderUnitEquipmentView();
            setUnitEquipmentMode('view');
        }
    });
    document.getElementById('ueLocationFilter')?.addEventListener('change', () => {
        renderUnitEquipmentView();
        setUnitEquipmentMode('view');
    });
    document.getElementById('ueHoldingFilter')?.addEventListener('change', () => {
        renderUnitEquipmentView();
        setUnitEquipmentMode('view');
    });
    document.getElementById('ueSyncAssetRegisterBtn')?.addEventListener('click', () => {
        if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;
        syncUnitEquipmentToAssetRegister({ quiet: false });
    });

    if (typeof bindSearchHistory === 'function') {
        const searchEl = document.getElementById('ueSearchInput');
        if (searchEl) bindSearchHistory(searchEl);
    }

    moduleEl.querySelector('.btn-save-module')?.addEventListener('click', () => {
        setTimeout(() => {
            const result = syncUnitEquipmentToAssetRegister({ quiet: true });
            renderUnitEquipmentView();
            setUnitEquipmentMode('view');
            if (typeof showToast === 'function' && result.synced > 0) {
                showToast(`${result.synced} item(s) synced to ZNA ICT Asset Register for tracking.`, 'success');
            }
        }, 100);
    });

    setUnitEquipmentMode('view');
}

function buildLoanRow() {
    const tr = document.createElement('tr');
    const unitOptions = typeof buildZnaUnitOptionsHtml === 'function'
        ? buildZnaUnitOptionsHtml('', { includeBlank: true, includeOther: true })
        : '<option value="">— Select unit / formation —</option>';
    tr.innerHTML = `
        <td><input type="date" class="form-control loan-date"></td>
        <td><input type="text" class="form-control loan-za" placeholder="e.g. ZA820"></td>
        <td><input type="text" class="form-control" placeholder="e.g. AIO Desktop"></td>
        <td><input type="text" class="form-control" placeholder="e.g. HP Intel Core Ultra 7"></td>
        <td><input type="number" class="form-control" value="1" min="1"></td>
        <td><input type="text" class="form-control" value="ea"></td>
        <td><input type="text" class="form-control" placeholder="Rank, Name"></td>
        <td><input type="text" class="form-control"></td>
        <td>
            <select class="form-control loan-unit zna-unit-select" title="Unit / Formation / Dir">
                ${unitOptions}
            </select>
        </td>
        <td><input type="date" class="form-control loan-expected-return" title="Defaults to Date Loaned + 14 days"></td>
        <td><input type="date" class="form-control loan-date-returned"></td>
        <td><input type="text" class="form-control"></td>
        <td><input type="text" class="form-control"></td>
        <td><button class="btn btn-danger btn-sm" onclick="removeRow(this)">Remove</button></td>
    `;
    if (typeof attachTemporaryLoanRow === 'function') attachTemporaryLoanRow(tr);
    return tr;
}

function buildDPF1Row() {
    const tbody = document.getElementById('dp-f1-table-body');
    const rowCount = tbody ? tbody.rows.length + 1 : 1;
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td>${rowCount}</td>
        <td><input type="text" class="form-control"></td>
        <td><input type="number" class="form-control"></td>
        <td><input type="number" class="form-control"></td>
        <td><input type="text" class="form-control"></td>
        <td class="dp-f1-screen-only"><button class="btn btn-danger btn-sm" onclick="removeRow(this)">Remove</button></td>
    `;
    return tr;
}

function buildZnaQ982Row() {
    const tbody = document.getElementById('zna-q-982-table-body');
    const rowCount = tbody ? tbody.rows.length + 1 : 1;
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td class="q982-line-no">${rowCount}</td>
        <td><input type="text" class="form-control"></td>
        <td><input type="text" class="form-control"></td>
        <td><input type="text" class="form-control"></td>
        <td><input type="text" class="form-control"></td>
        <td><input type="text" class="form-control"></td>
        <td><input type="text" class="form-control" placeholder="ea / pair / tin"></td>
        <td><input type="number" class="form-control" min="0"></td>
        <td><input type="number" class="form-control" min="0"></td>
        <td><input type="number" class="form-control" min="0"></td>
        <td><input type="text" class="form-control"></td>
        <td><input type="text" class="form-control"></td>
        <td><input type="number" class="form-control" min="0" step="1"></td>
        <td><input type="number" class="form-control" min="0" max="99" step="1"></td>
        <td class="q982-screen-only"><button class="btn btn-danger btn-sm" onclick="removeRow(this)">Remove</button></td>
    `;
    return tr;
}

function buildZnaQ178Row() {
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td><input type="date" class="form-control"></td>
        <td><input type="text" class="form-control"></td>
        <td><input type="number" class="form-control" min="0" step="any"></td>
        <td><input type="number" class="form-control" min="0" step="any"></td>
        <td><input type="number" class="form-control" step="any" readonly title="Auto-calculated"></td>
        <td><input type="text" class="form-control"></td>
        <td class="q178-screen-only"><button class="btn btn-danger btn-sm" onclick="removeRow(this)">Remove</button></td>
    `;
    if (typeof attachZnaQ178RowCalc === 'function') attachZnaQ178RowCalc(tr);
    return tr;
}

function buildZnaQ1033Row() {
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td><input type="text" class="form-control"></td>
        <td><input type="text" class="form-control"></td>
        <td><input type="number" class="form-control" min="0"></td>
        <td><input type="text" class="form-control"></td>
        <td><input type="text" class="form-control"></td>
        <td><input type="text" class="form-control"></td>
        <td><input type="text" class="form-control"></td>
        <td><input type="text" class="form-control"></td>
        <td><input type="text" class="form-control"></td>
        <td><input type="text" class="form-control"></td>
        <td><input type="text" class="form-control"></td>
        <td class="q1033-screen-only"><button class="btn btn-danger btn-sm" onclick="removeRow(this)">Remove</button></td>
    `;
    return tr;
}

function buildZnaQ1043Row() {
    const uid = `q1043cond-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td><input type="text" class="form-control q1043-desig"></td>
        <td><input type="number" class="form-control q1043-qty" min="0"></td>
        <td style="text-align:center;"><input type="radio" class="q1043-cond" name="${uid}" value="BLR"></td>
        <td style="text-align:center;"><input type="radio" class="q1043-cond" name="${uid}" value="BER"></td>
        <td class="q1043-screen-only"><button class="btn btn-danger btn-sm" onclick="removeRow(this)">Remove</button></td>
    `;
    return tr;
}

function buildZnaQ80Row() {
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td><input type="date" class="form-control"></td>
        <td><input type="text" class="form-control"></td>
        <td><input type="text" class="form-control"></td>
        <td><input type="number" class="form-control" min="0" step="any"></td>
        <td><input type="number" class="form-control" min="0" step="any"></td>
        <td><input type="number" class="form-control" step="any"></td>
        <td class="qm-screen-only"><button class="btn btn-danger btn-sm" onclick="removeRow(this)">Remove</button></td>
    `;
    if (typeof attachZnaQ80RowCalc === 'function') attachZnaQ80RowCalc(tr);
    return tr;
}

function buildZnaSvcs890Row() {
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td><input type="text" class="form-control"></td>
        <td><input type="text" class="form-control"></td>
        <td><input type="text" class="form-control"></td>
        <td><input type="number" class="form-control" min="0"></td>
        <td><input type="number" class="form-control" min="0"></td>
        <td><input type="text" class="form-control"></td>
        <td class="qm-screen-only"><button class="btn btn-danger btn-sm" onclick="removeRow(this)">Remove</button></td>
    `;
    return tr;
}

function buildZnaQ1179Row() {
    const tr = document.createElement('tr');
    let qtyCells = '';
    for (let i = 0; i < 12; i += 1) qtyCells += '<td><input type="number" class="form-control" min="0"></td>';
    tr.innerHTML = `
        <td><input type="text" class="form-control"></td>
        <td><input type="text" class="form-control"></td>
        ${qtyCells}
        <td><input type="text" class="form-control"></td>
        <td class="qm-screen-only"><button class="btn btn-danger btn-sm" onclick="removeRow(this)">Remove</button></td>
    `;
    return tr;
}

function buildZnaQ987Row() {
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td><input type="text" class="form-control"></td>
        <td><input type="text" class="form-control"></td>
        <td><input type="text" class="form-control"></td>
        <td><input type="text" class="form-control"></td>
        <td><input type="text" class="form-control"></td>
        <td><input type="text" class="form-control"></td>
        <td><input type="text" class="form-control"></td>
        <td><input type="text" class="form-control"></td>
        <td><input type="text" class="form-control"></td>
        <td><input type="text" class="form-control"></td>
        <td class="qm-screen-only"><button class="btn btn-danger btn-sm" onclick="removeRow(this)">Remove</button></td>
    `;
    return tr;
}

function buildZnaQ985Row() {
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td><input type="text" class="form-control"></td>
        <td><input type="number" class="form-control" min="0" step="any"></td>
        <td><input type="number" class="form-control" min="0" step="any"></td>
        <td><input type="number" class="form-control" min="0" step="any"></td>
        <td><input type="number" class="form-control" min="0" step="any"></td>
        <td><input type="text" class="form-control"></td>
        <td class="qm-screen-only"><button class="btn btn-danger btn-sm" onclick="removeRow(this)">Remove</button></td>
    `;
    return tr;
}

function buildZnaQ1Row() {
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td><input type="text" class="form-control"></td>
        <td><input type="number" class="form-control" min="0" step="any"></td>
        <td><input type="text" class="form-control"></td>
        <td><input type="text" class="form-control"></td>
        <td><input type="text" class="form-control"></td>
        <td class="qm-screen-only"><button class="btn btn-danger btn-sm" onclick="removeRow(this)">Remove</button></td>
    `;
    return tr;
}

function buildZnaQ998Row() {
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td><input type="text" class="form-control"></td>
        <td><input type="text" class="form-control" placeholder="ZA / serial"></td>
        <td><input type="number" class="form-control" min="0" step="any"></td>
        <td><input type="text" class="form-control" placeholder="Lost / Damaged / Destroyed"></td>
        <td><input type="text" class="form-control"></td>
        <td><input type="text" class="form-control"></td>
        <td class="qm-screen-only"><button class="btn btn-danger btn-sm" onclick="removeRow(this)">Remove</button></td>
    `;
    return tr;
}

function buildZnaQ1680Row() {
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td><input type="text" class="form-control"></td>
        <td><input type="number" class="form-control" min="0" step="any"></td>
        <td><input type="text" class="form-control"></td>
        <td><input type="text" class="form-control"></td>
        <td><input type="text" class="form-control"></td>
        <td class="qm-screen-only"><button class="btn btn-danger btn-sm" onclick="removeRow(this)">Remove</button></td>
    `;
    return tr;
}

function buildAnnexQtyRow(cols) {
    const tr = document.createElement('tr');
    const cells = Array.from({ length: cols }, () => '<td><input type="text" class="form-control"></td>').join('');
    tr.innerHTML = `${cells}<td class="qm-screen-only"><button class="btn btn-danger btn-sm" onclick="removeRow(this)">Remove</button></td>`;
    return tr;
}

function buildZnaQ3Row() { return buildAnnexQtyRow(5); }
function buildZnaQ31Row() { return buildAnnexQtyRow(5); }
function buildZnaQ40Row() { return buildAnnexQtyRow(5); }
function buildZnaQ1049Row() { return buildAnnexQtyRow(5); }
function buildZnaQ1229Row() { return buildAnnexQtyRow(5); }
function buildZnaQ1571Row() { return buildAnnexQtyRow(5); }
function buildZnaQ1954Row() { return buildAnnexQtyRow(4); }

function buildZnaSvcs1045Row() {
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td><input type="text" class="form-control"></td>
        <td><input type="text" class="form-control"></td>
        <td><input type="text" class="form-control"></td>
        <td><input type="text" class="form-control"></td>
        <td class="qm-screen-only"><button class="btn btn-danger btn-sm" onclick="removeRow(this)">Remove</button></td>
    `;
    return tr;
}

function buildZnaQ1157Row() {
    const options = (typeof Q1157_ITEMS !== 'undefined' ? Q1157_ITEMS : [])
        .map((item) => `<option value="${item}">${item}</option>`).join('');
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td><input type="date" class="form-control q1157-date"></td>
        <td><select class="form-control q1157-item"><option value="">Select item…</option>${options}<option value="Other">Other</option></select></td>
        <td><input type="number" class="form-control q1157-qty" min="0"></td>
        <td><input type="text" class="form-control q1157-sig"></td>
        <td><input type="text" class="form-control q1157-counter"></td>
        <td class="qm-screen-only"><button class="btn btn-danger btn-sm" onclick="removeRow(this)">Remove</button></td>
    `;
    return tr;
}

function buildAccommodationStoreRow() {
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td><input type="text" class="form-control" list="accItemSuggestions" placeholder="Item description"></td>
        <td><input type="number" class="form-control" min="0" step="1"></td>
        <td><input type="number" class="form-control" min="0" step="1"></td>
        <td><input type="number" class="form-control" min="0" step="1"></td>
        <td><input type="number" class="form-control" min="0" step="1"></td>
        <td class="acc-screen-only"><button class="btn btn-danger btn-sm" onclick="removeRow(this)">Remove</button></td>
    `;
    return tr;
}

function buildDeliveryRow() {
    const tr = document.createElement('tr');
    tr.className = 'dn-row';
    tr.innerHTML = `
        <td><input type="date" class="form-control"></td>
        <td><input type="text" class="form-control"></td>
        <td><input type="text" class="form-control"></td>
        <td><input type="number" class="form-control" min="1" step="1" value="1"></td>
        <td><input type="text" class="form-control" value="ea"></td>
        <td><input type="text" class="form-control" placeholder="S/N if ICT"></td>
        <td><input type="text" class="form-control" placeholder="PO no."></td>
        <td><input type="text" class="form-control" placeholder="Supplier"></td>
        <td><input type="text" class="form-control" placeholder="Received by"></td>
        <td><input type="text" class="form-control"></td>
        <td class="dn-wrc-badge"><span class="muted">—</span></td>
        <td class="dn-actions">
            <button type="button" class="btn btn-secondary btn-sm" data-dn-wrc title="IT Dir Workshop receipt certification">Workshop cert</button>
            <button class="btn btn-danger btn-sm" onclick="removeRow(this)">Remove</button>
        </td>
    `;
    return tr;
}


function buildWorkshopRepairRow() {
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td><input type="date" class="form-control"></td>
        <td><input type="text" class="form-control"></td>
        <td><input type="text" class="form-control"></td>
        <td><input type="text" class="form-control"></td>
        <td><input type="text" class="form-control"></td>
        <td><input type="text" class="form-control"></td>
        <td><input type="date" class="form-control"></td>
        <td><input type="text" class="form-control"></td>
        <td><input type="text" class="form-control"></td>
        <td><input type="text" class="form-control"></td>
        <td><input type="text" class="form-control"></td>
        <td><button class="btn btn-danger btn-sm" onclick="removeRow(this)">Remove</button></td>
    `;
    return tr;
}

function buildSupplierRow(data = {}) {
    const tr = document.createElement('tr');
    const status = data.status || 'Active';
    tr.innerHTML = `
        <td><input type="text" class="form-control" value="${ueEscape(data.id || '')}"></td>
        <td><input type="text" class="form-control" value="${ueEscape(data.name || '')}"></td>
        <td><input type="text" class="form-control" value="${ueEscape(data.contact || '')}"></td>
        <td><input type="text" class="form-control" value="${ueEscape(data.phone || '')}"></td>
        <td><input type="email" class="form-control" value="${ueEscape(data.email || '')}"></td>
        <td><input type="date" class="form-control" value="${ueEscape(data.start || '')}"></td>
        <td><input type="date" class="form-control" value="${ueEscape(data.end || '')}"></td>
        <td>
            <select class="form-control">
                <option${status === 'Active' ? ' selected' : ''}>Active</option>
                <option${status === 'Inactive' ? ' selected' : ''}>Inactive</option>
                <option${status === 'Pending' ? ' selected' : ''}>Pending</option>
            </select>
            <input type="hidden" class="supplier-notes-field" value="${ueEscape(data.notes || '')}">
        </td>
        <td><button class="btn btn-danger btn-sm" onclick="removeRow(this)">Remove</button></td>
    `;
    return tr;
}

function collectSupplierRows() {
    const tbody = document.getElementById('suppliers-table-body');
    if (!tbody) return [];
    return Array.from(tbody.querySelectorAll('tr')).map((tr, index) => {
        const inputs = tr.querySelectorAll('input:not([type="hidden"])');
        const notesInput = tr.querySelector('.supplier-notes-field');
        const select = tr.querySelector('select');
        return {
            index,
            id: (inputs[0]?.value || '').trim(),
            name: (inputs[1]?.value || '').trim(),
            contact: (inputs[2]?.value || '').trim(),
            phone: (inputs[3]?.value || '').trim(),
            email: (inputs[4]?.value || '').trim(),
            start: (inputs[5]?.value || '').trim(),
            end: (inputs[6]?.value || '').trim(),
            status: (select?.value || '').trim() || 'Active',
            notes: (notesInput?.value || '').trim()
        };
    }).filter((row) => row.id || row.name || row.contact || row.phone || row.email);
}

function supplierStatusClass(status) {
    const key = String(status || '').toLowerCase();
    if (key === 'inactive') return 'supplier-status-inactive';
    if (key === 'pending') return 'supplier-status-pending';
    return 'supplier-status-active';
}

function clearSupplierForm() {
    const set = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.value = value;
    };
    set('supplierEditIndex', '');
    set('supplierId', '');
    set('supplierName', '');
    set('supplierContact', '');
    set('supplierPhone', '');
    set('supplierEmail', '');
    set('supplierStart', '');
    set('supplierEnd', '');
    set('supplierStatus', 'Active');
    set('supplierNotes', '');
    const title = document.getElementById('supplierFormTitle');
    if (title) title.textContent = 'Add Supplier';
    const saveBtn = document.getElementById('supplierSaveBtn');
    if (saveBtn) saveBtn.textContent = 'Save Supplier';
}

function fillSupplierForm(row) {
    const set = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.value = value ?? '';
    };
    set('supplierEditIndex', String(row.index));
    set('supplierId', row.id || '');
    set('supplierName', row.name || '');
    set('supplierContact', row.contact || '');
    set('supplierPhone', row.phone || '');
    set('supplierEmail', row.email || '');
    set('supplierStart', row.start || '');
    set('supplierEnd', row.end || '');
    set('supplierStatus', row.status || 'Active');
    set('supplierNotes', row.notes || '');
    const title = document.getElementById('supplierFormTitle');
    if (title) title.textContent = `Edit ${row.name || row.id || 'Supplier'}`;
    const saveBtn = document.getElementById('supplierSaveBtn');
    if (saveBtn) saveBtn.textContent = 'Update Supplier';
    document.getElementById('supplierDetailsForm')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    document.getElementById('supplierName')?.focus();
}

function readSupplierForm() {
    return {
        id: (document.getElementById('supplierId')?.value || '').trim(),
        name: (document.getElementById('supplierName')?.value || '').trim(),
        contact: (document.getElementById('supplierContact')?.value || '').trim(),
        phone: (document.getElementById('supplierPhone')?.value || '').trim(),
        email: (document.getElementById('supplierEmail')?.value || '').trim(),
        start: document.getElementById('supplierStart')?.value || '',
        end: document.getElementById('supplierEnd')?.value || '',
        status: document.getElementById('supplierStatus')?.value || 'Active',
        notes: (document.getElementById('supplierNotes')?.value || '').trim()
    };
}

function persistSuppliersModule() {
    if (typeof canEditData === 'function' && !canEditData()) return;
    if (typeof serializeModule === 'function') {
        appState.modules['suppliers-contracts'] = serializeModule('suppliers-contracts');
    }
    if (typeof saveState === 'function') saveState();
    if (typeof updateSystemAlerts === 'function') updateSystemAlerts();
    if (typeof updateDashboard === 'function') updateDashboard();
    if (typeof refreshPurchaseOrderSupplierOptions === 'function') refreshPurchaseOrderSupplierOptions();
}

function saveSupplierFromForm() {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;

    const data = readSupplierForm();
    if (!data.name) {
        showToast('Enter the supplier name.', 'error');
        document.getElementById('supplierName')?.focus();
        return;
    }

    const tbody = document.getElementById('suppliers-table-body');
    if (!tbody) return;

    const editIndexRaw = document.getElementById('supplierEditIndex')?.value;
    const editIndex = editIndexRaw === '' ? -1 : parseInt(editIndexRaw, 10);
    const rows = Array.from(tbody.querySelectorAll('tr'));

    if (editIndex >= 0 && rows[editIndex]) {
        const tr = buildSupplierRow(data);
        rows[editIndex].replaceWith(tr);
        showToast(`Updated ${data.name}.`);
    } else {
        tbody.appendChild(buildSupplierRow(data));
        showToast(`Added ${data.name}.`);
    }

    clearSupplierForm();
    persistSuppliersModule();
    renderSuppliersView();
}

function editSupplierAt(index) {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;
    const rows = collectSupplierRows();
    const row = rows.find((r) => r.index === index) || rows[index];
    if (!row) {
        showToast('Supplier not found.', 'error');
        return;
    }
    fillSupplierForm(row);
}

function deleteSupplierAt(index) {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;
    const tbody = document.getElementById('suppliers-table-body');
    const tr = tbody?.rows?.[index];
    if (!tr) return;
    const name = tr.querySelectorAll('input')[1]?.value || 'this supplier';
    if (!window.confirm(`Delete ${name}?`)) return;
    tr.remove();
    const editIndex = document.getElementById('supplierEditIndex')?.value;
    if (editIndex !== '' && parseInt(editIndex, 10) === index) clearSupplierForm();
    persistSuppliersModule();
    renderSuppliersView();
    showToast('Supplier deleted.');
}

function renderSuppliersView() {
    const viewBody = document.getElementById('suppliers-view-body');
    const summary = document.getElementById('supplierSummaryStrip');
    if (!viewBody) return;

    const q = (document.getElementById('supplierSearchInput')?.value || '').trim().toLowerCase();
    const statusFilter = document.getElementById('supplierStatusFilter')?.value || 'all';
    const rows = collectSupplierRows().slice().sort((a, b) =>
        String(a.name || '').localeCompare(String(b.name || ''), undefined, { sensitivity: 'base' })
    );
    const canEdit = typeof canEditData === 'function' ? canEditData() : true;

    const filtered = rows.filter((row) => {
        if (statusFilter !== 'all' && row.status !== statusFilter) return false;
        if (!q) return true;
        return `${row.id} ${row.name} ${row.contact} ${row.phone} ${row.email} ${row.status} ${row.notes}`.toLowerCase().includes(q);
    });

    if (summary) {
        const counts = { Active: 0, Inactive: 0, Pending: 0 };
        rows.forEach((row) => {
            if (counts[row.status] != null) counts[row.status] += 1;
        });
        summary.innerHTML = `
            <div class="ue-summary-chip ue-summary-total"><strong>${rows.length}</strong><span>Total suppliers</span></div>
            <div class="ue-summary-chip"><strong>${counts.Active || 0}</strong><span>Active</span></div>
            <div class="ue-summary-chip"><strong>${counts.Pending || 0}</strong><span>Pending</span></div>
            <div class="ue-summary-chip"><strong>${counts.Inactive || 0}</strong><span>Inactive</span></div>
        `;
    }

    if (!filtered.length) {
        viewBody.innerHTML = `<tr><td colspan="9" class="req-empty-row">${
            rows.length ? 'No suppliers match this search/filter.' : 'No suppliers recorded yet. Use the form above to add one.'
        }</td></tr>`;
        return;
    }

    viewBody.innerHTML = filtered.map((row) => `
        <tr>
            <td>${ueEscape(row.id || '—')}</td>
            <td><strong>${ueEscape(row.name || '—')}</strong></td>
            <td>${ueEscape(row.contact || '—')}</td>
            <td>${ueEscape(row.phone || '—')}</td>
            <td>${ueEscape(row.email || '—')}</td>
            <td>${ueEscape(row.start || '—')}</td>
            <td>${ueEscape(row.end || '—')}</td>
            <td><span class="supplier-status-pill ${supplierStatusClass(row.status)}">${ueEscape(row.status)}</span></td>
            <td class="req-actions-cell">
                ${canEdit ? `
                    <button type="button" class="btn btn-ghost btn-sm" data-supplier-action="edit" data-supplier-index="${row.index}">Edit</button>
                    <button type="button" class="btn btn-danger btn-sm" data-supplier-action="delete" data-supplier-index="${row.index}">Delete</button>
                ` : '—'}
            </td>
        </tr>
    `).join('');
}

function runOfficialSuppliersImport({ replace = true, silent = false } = {}) {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return null;
    if (typeof importOfficialSuppliersList !== 'function') {
        if (!silent) showToast('Official supplier list is not loaded.', 'error');
        return null;
    }
    const result = importOfficialSuppliersList({ replace });
    if (typeof persistSuppliersModule === 'function') persistSuppliersModule();
    clearSupplierForm();
    renderSuppliersView();
    if (!silent) {
        const mode = replace ? 'replaced with' : 'merged into';
        showToast(
            `Registered G/C/006 list ${mode} suppliers: ${result.added} added, ${result.updated} updated (${result.total} total).`
        );
    }
    return result;
}

function renderSupplierEvalRequirements() {
    const host = document.getElementById('supplierEvalReqsList');
    if (!host) return;
    const items = typeof SUPPLIER_EVALUATION_REQUIREMENTS !== 'undefined'
        ? SUPPLIER_EVALUATION_REQUIREMENTS
        : [];
    host.innerHTML = items.map((t) => `<li>${String(t).replace(/</g, '&lt;')}</li>`).join('');
}

function initSuppliersModule() {
    const moduleEl = document.getElementById('suppliers-contracts');
    if (!moduleEl || moduleEl.dataset.supplierInit === '1') {
        renderSupplierEvalRequirements();
        return;
    }
    moduleEl.dataset.supplierInit = '1';
    renderSupplierEvalRequirements();

    document.getElementById('supplierSaveBtn')?.addEventListener('click', saveSupplierFromForm);
    document.getElementById('supplierFormClearBtn')?.addEventListener('click', () => {
        if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;
        clearSupplierForm();
    });
    document.getElementById('supplierImportOfficialBtn')?.addEventListener('click', () => {
        const existing = collectSupplierRows().length;
        if (existing > 0) {
            const ok = window.confirm(
                `Replace the current ${existing} supplier(s) with the Registered G/C/006 list ` +
                `(${typeof IT_DIR_SUPPLIERS_SEED !== 'undefined' ? IT_DIR_SUPPLIERS_SEED.length : 46} compliant suppliers)?\n\n` +
                'OK = replace with registered list\nCancel = abort'
            );
            if (!ok) return;
        }
        runOfficialSuppliersImport({ replace: true });
    });
    document.getElementById('supplierSearchBtn')?.addEventListener('click', () => {
        const input = document.getElementById('supplierSearchInput');
        if (input && typeof commitSearchInput === 'function') commitSearchInput(input);
        renderSuppliersView();
    });
    document.getElementById('supplierClearBtn')?.addEventListener('click', () => {
        const input = document.getElementById('supplierSearchInput');
        if (input) input.value = '';
        const filter = document.getElementById('supplierStatusFilter');
        if (filter) filter.value = 'all';
        renderSuppliersView();
    });
    document.getElementById('supplierSearchInput')?.addEventListener('input', renderSuppliersView);
    document.getElementById('supplierSearchInput')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            renderSuppliersView();
        }
    });
    document.getElementById('supplierStatusFilter')?.addEventListener('change', renderSuppliersView);

    document.getElementById('suppliers-view-body')?.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-supplier-action]');
        if (!btn) return;
        const index = parseInt(btn.dataset.supplierIndex, 10);
        if (Number.isNaN(index)) return;
        if (btn.dataset.supplierAction === 'edit') editSupplierAt(index);
        if (btn.dataset.supplierAction === 'delete') deleteSupplierAt(index);
    });

    if (typeof bindSearchHistory === 'function') {
        const searchEl = document.getElementById('supplierSearchInput');
        if (searchEl) bindSearchHistory(searchEl);
    }

    clearSupplierForm();

    // Auto-load official register when the suppliers table is empty
    const existing = collectSupplierRows();
    if (!existing.length && typeof importOfficialSuppliersList === 'function' && typeof canEditData === 'function' && canEditData()) {
        runOfficialSuppliersImport({ replace: true, silent: true });
        const n = typeof IT_DIR_SUPPLIERS_SEED !== 'undefined' ? IT_DIR_SUPPLIERS_SEED.length : 0;
        showToast(`Loaded ${n} registered G/C/006 suppliers (compliant with Supplier Evaluation Requirements).`);
    } else {
        renderSuppliersView();
    }
}

function attachVoucherRowCalculations(tr) {
    const qtyInput = tr.querySelector('.voucher-qty');
    const unitCostInput = tr.querySelector('.voucher-unit-cost');
    const totalInput = tr.querySelector('.voucher-line-total');
    if (!qtyInput || !unitCostInput || !totalInput) return;

    function recalc() {
        const total = (parseFloat(qtyInput.value) || 0) * (parseFloat(unitCostInput.value) || 0);
        totalInput.value = total ? total.toFixed(2) : '';
        if (typeof renderVoucherInventoryTables === 'function') renderVoucherInventoryTables();
    }

    qtyInput.addEventListener('input', recalc);
    unitCostInput.addEventListener('input', recalc);
    if (typeof attachVoucherInventoryRowWatch === 'function') attachVoucherInventoryRowWatch(tr);
}

function attachStockLedgerRow(tr) {
    const tbody = tr.closest('tbody');
    if (!tbody) return;
    tr.querySelectorAll('.gl-stock-receipts, .gl-stock-issues').forEach((input) => {
        input.addEventListener('input', () => recalculateStockLedger(tbody.id));
    });
}

function attachConsumablesStockRow(tr) {
    const moduleEl = tr.closest('#gl-2200600002');
    tr.querySelector('.gl-issue-qty')?.addEventListener('input', () => {
        if (moduleEl) recalculateConsumablesStock(moduleEl);
    });
}

function getOpeningStockFromModule(moduleEl) {
    const openingInput = moduleEl?.querySelector('.stock-opening-balance');
    return parseFloat(openingInput?.value) || 0;
}

function recalculateStockLedger(tbodyId) {
    const tbody = document.getElementById(tbodyId);
    const moduleEl = tbody?.closest('.form-container');
    if (!tbody || !moduleEl) return;

    let running = getOpeningStockFromModule(moduleEl);
    tbody.querySelectorAll('tr').forEach((tr) => {
        const receipts = parseFloat(tr.querySelector('.gl-stock-receipts')?.value) || 0;
        const issues = parseFloat(tr.querySelector('.gl-stock-issues')?.value) || 0;
        running = running + receipts - issues;
        const balanceInput = tr.querySelector('.gl-stock-balance');
        if (balanceInput) balanceInput.value = running;
    });
}

function recalculateConsumablesStock(moduleEl) {
    const receiptsInput = moduleEl.querySelector('.stock-receipts-total');
    const issuesInput = moduleEl.querySelector('.stock-issues-total');
    const stockInput = moduleEl.querySelector('.stock-on-hand');
    const opening = getOpeningStockFromModule(moduleEl);
    const receipts = parseFloat(receiptsInput?.value) || 0;
    let issues = 0;

    moduleEl.querySelectorAll('.gl-issue-qty').forEach((input) => {
        issues += parseFloat(input.value) || 0;
    });

    if (issuesInput) issuesInput.value = issues;
    if (stockInput) stockInput.value = opening + receipts - issues;
}

function attachJobCardRowCalculations(tr) {
    const qtyInput = tr.querySelector('.job-card-qty');
    const priceInput = tr.querySelector('.job-card-price');
    const amountInput = tr.querySelector('.job-card-amount');
    if (!qtyInput || !priceInput || !amountInput) return;

    function recalc() {
        const amount = (parseFloat(qtyInput.value) || 0) * (parseFloat(priceInput.value) || 0);
        amountInput.value = amount ? amount.toFixed(2) : '';
        recalculateJobCardTotal();
    }

    qtyInput.addEventListener('input', recalc);
    priceInput.addEventListener('input', recalc);
}

function recalculateJobCardTotal() {
    const totalEl = document.getElementById('jobCardTotalAmount');
    if (!totalEl) return;
    let total = 0;
    document.querySelectorAll('#gl-220200002-table-body .job-card-amount').forEach((input) => {
        total += parseFloat(input.value) || 0;
    });
    totalEl.textContent = formatCurrency(total);
}

function getRowSearchText(tr) {
    const parts = [];
    tr.querySelectorAll('td').forEach((td) => {
        const fields = td.querySelectorAll('input, select, textarea');
        if (fields.length) {
            fields.forEach((el) => {
                if (el.tagName === 'SELECT') {
                    parts.push(el.options[el.selectedIndex]?.text || el.value || '');
                } else {
                    parts.push(el.value || '');
                }
            });
        } else {
            parts.push(td.textContent || '');
        }
    });
    return parts.join(' ').toLowerCase();
}

function filterTableRows(tbodyId, query) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return { visible: 0, total: 0, query: '' };
    const normalized = query.trim().toLowerCase();
    let visible = 0;
    const rows = tbody.querySelectorAll('tr');
    rows.forEach((tr) => {
        const text = getRowSearchText(tr);
        const show = !normalized || text.includes(normalized);
        tr.style.display = show ? '' : 'none';
        if (show) visible += 1;
    });
    return { visible, total: rows.length, query: normalized };
}

function updateTableSearchHint(input, stats) {
    const hintId = input?.dataset?.searchHintId;
    if (!hintId) return;
    const hint = document.getElementById(hintId);
    if (!hint) return;
    const q = stats?.query || '';
    if (!q) {
        hint.hidden = true;
        hint.textContent = '';
        return;
    }
    hint.hidden = false;
    if (!stats.total || stats.visible === 0) {
        hint.textContent = `No rows match “${q}”. Try Clear, another ledger tab (e.g. Laptops), or Cumulative view.`;
        hint.className = 'table-search-hint is-empty';
    } else if (stats.visible < stats.total) {
        hint.textContent = `Showing ${stats.visible} of ${stats.total} rows matching “${q}”.`;
        hint.className = 'table-search-hint';
    } else {
        hint.textContent = `${stats.visible} row(s) match “${q}”.`;
        hint.className = 'table-search-hint';
    }
}

function filterSearchScope(scopeId, itemSelector, query) {
    const scope = document.getElementById(scopeId);
    if (!scope) return;
    const normalized = query.trim().toLowerCase();
    scope.querySelectorAll(itemSelector).forEach((item) => {
        const text = (item.textContent || '').toLowerCase();
        item.style.display = !normalized || text.includes(normalized) ? '' : 'none';
    });
}

function runTableSearch(input) {
    if (!input) return;
    if (input.dataset.searchTarget) {
        const stats = filterTableRows(input.dataset.searchTarget, input.value);
        updateTableSearchHint(input, stats);
    }
    if (input.dataset.searchScope) {
        filterSearchScope(
            input.dataset.searchScope,
            input.dataset.searchItem || '.report-module-card',
            input.value
        );
    }
}

function initTableSearch() {
    document.querySelectorAll('.module-toolbar').forEach((toolbar) => {
        const input = toolbar.querySelector('.table-search');
        if (!input) return;

        if (typeof bindSearchHistory === 'function') bindSearchHistory(input);

        if (toolbar.dataset.tableSearchBound === '1') return;
        toolbar.dataset.tableSearchBound = '1';

        input.addEventListener('input', function() {
            runTableSearch(this);
        });
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (typeof commitSearchInput === 'function') {
                    commitSearchInput(this);
                } else {
                    runTableSearch(this);
                }
            }
        });

        toolbar.querySelector('.btn-table-search')?.addEventListener('click', () => {
            if (typeof commitSearchInput === 'function') {
                commitSearchInput(input);
            } else {
                runTableSearch(input);
            }
        });
        toolbar.querySelector('.btn-table-search-clear')?.addEventListener('click', () => {
            input.value = '';
            runTableSearch(input);
            if (typeof hideSearchSuggestions === 'function') hideSearchSuggestions(input);
            input.focus();
        });
    });

    if (typeof initSearchHistory === 'function') initSearchHistory();
}

function printModule(moduleId) {
    if (moduleId === 'spec-evaluation') {
        if (typeof openSpecSheetPreview === 'function') {
            openSpecSheetPreview();
        } else {
            printSpecEvaluationDatasheet();
        }
        return;
    }
    if (moduleId === 'dp-f1-form') {
        if (typeof printDpF1OfficialForm === 'function') {
            printDpF1OfficialForm();
        }
        return;
    }
    if (moduleId === 'purchase-orders') {
        if (typeof printPurchaseOrderOfficialForm === 'function') {
            printPurchaseOrderOfficialForm();
        }
        return;
    }
    if (moduleId === 'zna-q-982') {
        if (typeof printZnaQ982OfficialForm === 'function') {
            printZnaQ982OfficialForm();
        }
        return;
    }
    if (moduleId === 'zna-q-178') {
        if (typeof printZnaQ178OfficialForm === 'function') printZnaQ178OfficialForm();
        return;
    }
    if (moduleId === 'zna-q-1033') {
        if (typeof printZnaQ1033OfficialForm === 'function') printZnaQ1033OfficialForm();
        return;
    }
    if (moduleId === 'zna-q-1043') {
        if (typeof printZnaQ1043OfficialForm === 'function') printZnaQ1043OfficialForm();
        return;
    }
    if (typeof QM_PRINT_MAP !== 'undefined' && QM_PRINT_MAP[moduleId]) {
        QM_PRINT_MAP[moduleId]();
        return;
    }
    if (moduleId === 'accommodation-stores') {
        if (typeof printAccommodationStoresOfficialForm === 'function') {
            printAccommodationStoresOfficialForm();
        }
        return;
    }
    const section = document.getElementById(moduleId);
    if (!section) return;
    if (typeof runOfficialPrint === 'function') {
        runOfficialPrint(() => {
            section.classList.add('print-target');
            document.body.classList.add('is-printing');
        });
        return;
    }
    section.classList.add('print-target');
    document.body.classList.add('is-printing');
    window.print();
    setTimeout(() => {
        section.classList.remove('print-target');
        document.body.classList.remove('is-printing');
    }, 2000);
}
