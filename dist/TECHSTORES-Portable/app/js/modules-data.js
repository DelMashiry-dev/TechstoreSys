/* modules-data.js — vouchers, POs, migrations, commits */

/** Legacy unit equipment: [item, description, location]
 *  Current: [item, zaNumber, description, holdingUnit, location]
 */
function migrateUnitEquipmentRowData(rowData) {
    let cells = Array.isArray(rowData.cells) ? [...rowData.cells] : [];
    const blank = (tag, type, value = '') => (
        tag === 'select'
            ? { tag: 'select', value: value || '', selectedIndex: 0 }
            : { tag: 'input', type: type || 'text', value: value || '' }
    );

    // Already migrated (5 controls)
    if (cells.length >= 5) {
        // If description looks like a ZA and za cell empty, shift it
        const zaVal = String(cells[1]?.value || '').trim();
        const descVal = String(cells[2]?.value || '').trim();
        if (!zaVal && /\bZA\s*-?\s*\d+\b/i.test(descVal)) {
            const m = descVal.match(/\bZA\s*-?\s*(\d+)\b/i);
            cells[1] = blank('input', 'text', m ? `ZA${m[1]}` : descVal);
            if (descVal.replace(/\s+/g, '').toUpperCase() === String(cells[1].value).toUpperCase()) {
                cells[2] = blank('input', 'text', '');
            }
        }
        return { ...rowData, cells };
    }

    // Legacy 3 controls: item, description(/ZA), location
    if (cells.length >= 3) {
        const item = cells[0] || blank('input', 'text', '');
        const maybeZaOrDesc = cells[1] || blank('input', 'text', '');
        const location = cells[2] || blank('select', '', '');
        const raw = String(maybeZaOrDesc.value || '').trim();
        const zaMatch = raw.match(/\bZA\s*-?\s*(\d+)\b/i);
        const za = zaMatch ? `ZA${zaMatch[1]}` : '';
        const description = za && raw.replace(/\s+/g, '').toUpperCase() === za.toUpperCase()
            ? ''
            : raw;
        const holding = location.value || '';

        return {
            ...rowData,
            cells: [
                item,
                blank('input', 'text', za),
                blank('input', 'text', description),
                blank('select', '', holding),
                location
            ]
        };
    }

    return {
        ...rowData,
        cells: [
            cells[0] || blank('input', 'text', ''),
            cells[1] || blank('input', 'text', ''),
            cells[2] || blank('input', 'text', ''),
            cells[3] || blank('select', '', ''),
            cells[4] || blank('select', '', '')
        ]
    };
}

function migrateLoanRowData(rowData) {
    let cells = Array.isArray(rowData.cells) ? [...rowData.cells] : [];

    // Legacy short rows (before expected/returned columns)
    if (cells.length < 12) {
        cells = [
            cells[0] || { tag: 'input', type: 'date', value: '' },
            cells[1] || { tag: 'input', type: 'text', value: '' },
            cells[2] || { tag: 'input', type: 'text', value: '' },
            cells[3] || { tag: 'input', type: 'number', value: '' },
            cells[4] || { tag: 'input', type: 'text', value: '' },
            cells[5] || { tag: 'input', type: 'text', value: '' },
            cells[6] || { tag: 'input', type: 'text', value: '' },
            cells[7] || { tag: 'input', type: 'text', value: '' },
            { tag: 'input', type: 'date', value: '' },
            { tag: 'input', type: 'date', value: '' },
            cells[8] || { tag: 'input', type: 'text', value: '' },
            cells[9] || { tag: 'input', type: 'text', value: '' }
        ];
    }

    // Insert ZA Number column after Date (controlled stores)
    if (cells.length === 12) {
        cells = [
            cells[0] || { tag: 'input', type: 'date', value: '' },
            { tag: 'input', type: 'text', value: '' },
            cells[1] || { tag: 'input', type: 'text', value: '' },
            cells[2] || { tag: 'input', type: 'text', value: '' },
            cells[3] || { tag: 'input', type: 'number', value: '' },
            cells[4] || { tag: 'input', type: 'text', value: '' },
            cells[5] || { tag: 'input', type: 'text', value: '' },
            cells[6] || { tag: 'input', type: 'text', value: '' },
            cells[7] || { tag: 'input', type: 'text', value: '' },
            cells[8] || { tag: 'input', type: 'date', value: '' },
            cells[9] || { tag: 'input', type: 'date', value: '' },
            cells[10] || { tag: 'input', type: 'text', value: '' },
            cells[11] || { tag: 'input', type: 'text', value: '' }
        ];
    }

    return { ...rowData, cells };
}

function migratePurchaseOrderRowData(rowData) {
    const cells = rowData.cells || [];
    if (cells.length >= 7 && cells.length <= 8 && cells[4]?.tag === 'select') return rowData;
    if (cells.length >= 10 && cells[5]?.tag === 'select') {
        return {
            ...rowData,
            cells: [
                cells[0] || { tag: 'input', type: 'date', value: '' },
                cells[1] || { tag: 'input', type: 'text', value: '' },
                cells[2] || { tag: 'input', type: 'text', value: '' },
                cells[6] || { tag: 'input', type: 'number', value: '' },
                cells[5] || { tag: 'select', value: '2200600002', selectedIndex: 0 },
                cells[8] || { tag: 'input', type: 'text', value: '' },
                cells[9] || { tag: 'input', type: 'text', value: '' }
            ]
        };
    }
    return {
        ...rowData,
        cells: [
            cells[0] || { tag: 'input', type: 'date', value: '' },
            cells[1] || { tag: 'input', type: 'text', value: '' },
            cells[2] || { tag: 'input', type: 'text', value: '' },
            cells[3] || { tag: 'input', type: 'number', value: '' },
            { tag: 'select', value: '2200600002', selectedIndex: 0 },
            cells[4] || { tag: 'input', type: 'text', value: '' },
            cells[5] || { tag: 'input', type: 'text', value: '' }
        ]
    };
}

function detectPurchaseOrderRowLayout(cells) {
    if (cells.length >= 7 && cells.length <= 8 && cells[4]?.tag === 'select') {
        return { gl: 4, amount: 3 };
    }
    if (cells.length >= 10 && cells[5]?.tag === 'select') {
        return { gl: 5, amount: 6 };
    }
    return { gl: -1, amount: 5 };
}

function migratePurchaseOrderLineRowData(rowData) {
    const cells = rowData.cells || [];
    // New: Item, Material, Qty, Unit, Description, Price, Net
    if (cells.length >= 7 && cells[3]?.type !== 'number') return rowData;
    // Legacy: Item, Material, Qty, Description, Price, Net
    if (cells.length >= 6) {
        return {
            ...rowData,
            cells: [
                cells[0] || { tag: 'input', type: 'text', value: '' },
                cells[1] || { tag: 'input', type: 'text', value: '' },
                cells[2] || { tag: 'input', type: 'number', value: '' },
                { tag: 'input', type: 'text', value: 'each' },
                cells[3] || { tag: 'input', type: 'text', value: '' },
                cells[4] || { tag: 'input', type: 'number', value: '' },
                cells[5] || { tag: 'input', type: 'number', value: '' }
            ]
        };
    }
    return rowData;
}

function migrateVoucherRowData(rowData) {
    const cells = rowData.cells || [];
    const defaultGl = document.getElementById('voucherDefaultGl')?.value || '2200600002';

    // Already has item-category select at index 1
    if (cells.length >= 13 && cells[1]?.tag === 'select' && cells[6]?.tag === 'select') {
        return rowData;
    }

    // Current hasGl layout (GL at index 5) → insert category after date
    if (cells.length >= 12 && cells[5]?.tag === 'select' && GL_ACCOUNTS[cells[5]?.value]) {
        return {
            ...rowData,
            cells: [
                cells[0] || { tag: 'input', type: 'date', value: '' },
                { tag: 'select', value: 'consumables-toners', className: 'form-control voucher-item-category' },
                cells[1] || { tag: 'input', type: 'text', value: '', className: 'form-control voucher-item-name' },
                cells[2] || { tag: 'input', type: 'text', value: '' },
                cells[3] || { tag: 'input', type: 'number', value: '' },
                cells[4] || { tag: 'input', type: 'text', value: '' },
                cells[5],
                cells[6] || { tag: 'input', type: 'number', value: '' },
                cells[7] || { tag: 'input', type: 'number', value: '' },
                cells[8] || { tag: 'input', type: 'text', value: '' },
                cells[9] || { tag: 'input', type: 'text', value: '' },
                cells[10] || { tag: 'input', type: 'text', value: '' },
                cells[11] || { tag: 'input', type: 'text', value: '' },
                cells[12] || { tag: 'input', type: 'text', value: '' }
            ]
        };
    }

    if (cells.length >= 12) return rowData;

    return {
        ...rowData,
        cells: [
            cells[0] || { tag: 'input', type: 'date', value: '' },
            { tag: 'select', value: 'consumables-toners', className: 'form-control voucher-item-category' },
            cells[1] || { tag: 'input', type: 'text', value: '' },
            cells[2] || { tag: 'input', type: 'text', value: '' },
            cells[3] || { tag: 'input', type: 'number', value: '' },
            cells[4] || { tag: 'input', type: 'text', value: '' },
            { tag: 'select', value: defaultGl },
            { tag: 'input', type: 'number', value: '' },
            { tag: 'input', type: 'number', value: '' },
            cells[5] || { tag: 'input', type: 'text', value: '' },
            cells[6] || { tag: 'input', type: 'text', value: '' },
            cells[7] || { tag: 'input', type: 'text', value: '' },
            cells[8] || { tag: 'input', type: 'text', value: '' },
            cells[9] || { tag: 'input', type: 'text', value: '' }
        ]
    };
}

function buildGlSelectHtml(className, selectedValue) {
    const options = Object.entries(GL_ACCOUNTS).map(([code, info]) => {
        const selected = selectedValue === code ? ' selected' : '';
        return `<option value="${code}"${selected}>${code} - ${info.name}</option>`;
    }).join('');
    return `<select class="form-control ${className}">${options}</select>`;
}

function buildVoucherCategorySelectHtml(selectedValue) {
    const selected = selectedValue || 'other';
    const options = (VOUCHER_INVENTORY_CATEGORIES || []).map((cat) => {
        const isSelected = cat.key === selected ? ' selected' : '';
        return `<option value="${cat.key}"${isSelected}>${cat.label}</option>`;
    }).join('');
    return `<select class="form-control voucher-item-category">${options}</select>`;
}

function getVoucherTypeFromModuleData(moduleData) {
    if (!moduleData || !moduleData.fields || !moduleData.fields.length) return 'iv';
    const typeField = moduleData.fields.find((field) => field.tag === 'select' && (field.value === 'iv' || field.value === 'rv'));
    return typeField ? typeField.value : 'iv';
}

function detectVoucherRowLayout(cells) {
    if (!cells || cells.length < 8) return VOUCHER_ROW_LAYOUT.legacy;
    const catCell = cells[1];
    const glAt6 = cells[6];
    if (catCell && catCell.tag === 'select' && glAt6 && glAt6.tag === 'select' && GL_ACCOUNTS[glAt6.value]) {
        return VOUCHER_ROW_LAYOUT.hasCategory;
    }
    const glCell = cells[5];
    if (glCell && glCell.tag === 'select' && GL_ACCOUNTS[glCell.value]) {
        return VOUCHER_ROW_LAYOUT.hasGl;
    }
    return VOUCHER_ROW_LAYOUT.legacy;
}

function getVoucherLineAmount(cells, layout) {
    const qty = parseFloat(cells[layout.qty]?.value) || 0;
    if (layout.lineTotal >= 0) {
        const lineTotal = parseFloat(cells[layout.lineTotal]?.value);
        if (!isNaN(lineTotal) && lineTotal > 0) return lineTotal;
    }
    if (layout.unitCost >= 0) {
        const unitCost = parseFloat(cells[layout.unitCost]?.value) || 0;
        return qty * unitCost;
    }
    return 0;
}

function getVoucherGlFromCells(cells, layout) {
    if (layout.gl < 0) return null;
    const glCell = cells[layout.gl];
    return glCell && GL_ACCOUNTS[glCell.value] ? glCell.value : null;
}

function getVoucherImpactByGl() {
    const impact = {};
    Object.keys(GL_ACCOUNTS).forEach((gl) => { impact[gl] = 0; });

    const voucherModule = appState.modules['voucher-module'];
    if (!voucherModule || !voucherModule.tables || !voucherModule.tables['voucher-table-body']) {
        return impact;
    }

    const voucherType = getVoucherTypeFromModuleData(voucherModule);
    const multiplier = voucherType === 'rv' ? -1 : 1;

    voucherModule.tables['voucher-table-body'].forEach((row) => {
        const cells = row.cells || [];
        const layout = detectVoucherRowLayout(cells);
        const gl = getVoucherGlFromCells(cells, layout);
        const amount = getVoucherLineAmount(cells, layout);
        if (gl && amount > 0) {
            impact[gl] += amount * multiplier;
        }
    });

    return impact;
}

function getBaseCommittedByGl() {
    const bidCommitted = getBidCommittedByGl();
    const dpCommitted = getDpF1CommittedByGl();
    const poCommitted = getPurchaseOrderCommittedByGl();
    const total = {};
    Object.keys(GL_ACCOUNTS).forEach((gl) => {
        total[gl] = (bidCommitted[gl] || 0) + (dpCommitted[gl] || 0) + (poCommitted[gl] || 0);
    });
    return total;
}

function collectVoucherRowsFromDom() {
    const rows = [];
    document.querySelectorAll('#voucher-table-body tr').forEach((tr) => {
        const qty = parseFloat(tr.querySelector('.voucher-qty')?.value) || 0;
        const gl = tr.querySelector('.voucher-gl')?.value || '';
        const unitCost = parseFloat(tr.querySelector('.voucher-unit-cost')?.value) || 0;
        const lineTotal = parseFloat(tr.querySelector('.voucher-line-total')?.value) || (qty * unitCost);
        const date = tr.querySelector('.voucher-date')?.value || tr.querySelector('td:first-child input[type="date"]')?.value || '';
        const item = tr.querySelector('.voucher-item-name')?.value?.trim() || '';
        rows.push({ qty, gl, unitCost, lineTotal, date, item });
    });
    return rows;
}

function validateVoucherModule() {
    const voucherType = document.getElementById('voucherType').value;
    const rows = collectVoucherRowsFromDom();
    const hasData = rows.some((row) => row.qty > 0 || row.lineTotal > 0 || row.item);

    if (!hasData) {
        return 'Add at least one voucher line with quantity and cost.';
    }

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (row.qty <= 0 && row.lineTotal <= 0 && !row.item) continue;
        if (typeof validateIsoDate === 'function') {
            const dateErr = validateIsoDate(row.date, {
                required: true,
                label: `Row ${i + 1} date`,
                notFuture: true
            });
            if (dateErr) return dateErr;
        }
        if (row.qty <= 0) {
            return `Row ${i + 1}: Quantity must be greater than zero.`;
        }
        if (!row.gl) {
            return `Row ${i + 1}: Select a GL account.`;
        }
        if (row.unitCost <= 0 && row.lineTotal <= 0) {
            return `Row ${i + 1}: Enter a unit cost for GL-linked vouchers.`;
        }
    }

    if (voucherType === 'iv') {
        const baseCommitted = getBaseCommittedByGl();
        const grouped = {};
        rows.forEach((row) => {
            if (!row.gl || row.lineTotal <= 0) return;
            grouped[row.gl] = (grouped[row.gl] || 0) + row.lineTotal;
        });

        for (const gl of Object.keys(grouped)) {
            const check = typeof canBuyOnGl === 'function'
                ? canBuyOnGl(gl, grouped[gl])
                : { ok: grouped[gl] <= ((appState.glBudgets[gl] || 0) - (baseCommitted[gl] || 0)), message: '' };
            if (!check.ok) {
                return check.message
                    || `GL ${gl}: Issue total ${formatCurrency(grouped[gl])} exceeds buying power ${formatCurrency(check.buyingPower || 0)}.`;
            }
        }
    }

    return null;
}

function saveVoucherModule() {
    const error = validateVoucherModule();
    if (error) {
        showToast(error, 'error');
        return;
    }

    const data = serializeModule('voucher-module');
    appState.modules['voucher-module'] = data;
    saveState();
    updateDashboard();
    updateVoucherSummary();
    if (typeof renderVoucherInventoryTables === 'function') renderVoucherInventoryTables();

    const voucherType = getVoucherTypeFromModuleData(data);
    const impact = getVoucherImpactByGl();
    const totalImpact = Object.values(impact).reduce((sum, value) => sum + Math.abs(value), 0);
    const typeLabel = voucherType === 'iv' ? 'Issue Voucher' : 'Receipt Voucher';
    showToast(`${typeLabel} saved. GL impact: ${formatCurrency(totalImpact)}.`);
}

function updateVoucherSummary() {
    const summaryEl = document.getElementById('voucherSummary');
    const typeEl = document.getElementById('voucherSummaryType');
    const gridEl = document.getElementById('voucherSummaryGrid');
    if (!summaryEl || !typeEl || !gridEl) return;

    const voucherModule = appState.modules['voucher-module'];
    gridEl.innerHTML = '';

    if (!voucherModule) {
        typeEl.textContent = 'No saved voucher data yet.';
        summaryEl.classList.remove('voucher-type-iv', 'voucher-type-rv');
        if (typeof renderVoucherInventoryTables === 'function') renderVoucherInventoryTables();
        return;
    }

    const voucherType = getVoucherTypeFromModuleData(voucherModule);
    const impact = getVoucherImpactByGl();
    const typeLabel = voucherType === 'iv'
        ? 'Issue Voucher (IV) — charges GL accounts'
        : 'Receipt Voucher (RV) — credits GL accounts';

    summaryEl.classList.remove('voucher-type-iv', 'voucher-type-rv');
    summaryEl.classList.add(voucherType === 'iv' ? 'voucher-type-iv' : 'voucher-type-rv');
    typeEl.textContent = typeLabel;

    let hasImpact = false;
    Object.entries(impact).forEach(([gl, amount]) => {
        if (Math.abs(amount) < 0.01) return;
        hasImpact = true;
        const item = document.createElement('div');
        item.className = 'voucher-summary-item';
        const sign = amount >= 0 ? '+' : '-';
        item.innerHTML = `<strong>GL ${gl}</strong><br>${GL_ACCOUNTS[gl].name}<br>${sign}${formatCurrency(Math.abs(amount))}`;
        gridEl.appendChild(item);
    });

    if (!hasImpact) {
        typeEl.textContent += ' — no GL amounts recorded yet.';
    }
    if (typeof renderVoucherInventoryTables === 'function') renderVoucherInventoryTables();
}

function validateCustodyModule(tbodyId, label) {
    const body = document.getElementById(tbodyId);
    if (!body) return null;
    const rows = [...body.querySelectorAll('tr')];
    for (let i = 0; i < rows.length; i++) {
        const r = typeof readCustodyRow === 'function'
            ? readCustodyRow(rows[i])
            : {
                dateIn: rows[i].querySelector('.ri-date-in')?.value || '',
                dateOut: rows[i].querySelector('.ri-date-out')?.value || '',
                equipmentType: rows[i].querySelector('.ri-eq-type')?.value || '',
                serialOrZa: rows[i].querySelector('.ri-serial')?.value || '',
                unit: rows[i].querySelector('.ri-unit')?.value || '',
                receivedBy: rows[i].querySelector('.ri-received-by')?.value || '',
                remark: rows[i].querySelector('.ri-remark')?.value || '',
                diagnosis: rows[i].querySelector('.ri-diagnosis')?.value || ''
            };
        if (typeof validateCustodyRowDates === 'function') {
            const err = validateCustodyRowDates(r, `${label} row ${i + 1}`);
            if (err) return err;
        }
    }
    return null;
}

function saveModule(moduleId) {
    if (!canEditData()) {
        if (currentUser) {
            showToast('Your access level is view-only. Changes cannot be saved.', 'error');
        }
        return;
    }
    if (moduleId === 'voucher-module') {
        saveVoucherModule();
        return;
    }
    if (moduleId === 'purchase-orders') {
        savePurchaseOrderModule();
        return;
    }
    if (moduleId === 'gate-register') {
        const err = validateCustodyModule('gate-register-table-body', 'Gate');
        if (err) { showToast(err, 'error'); return; }
    }
    if (moduleId === 'techstores-equipment-register') {
        const err = validateCustodyModule('techstores-equipment-register-table-body', 'TechStores');
        if (err) { showToast(err, 'error'); return; }
    }
    if (moduleId === 'workshop-repairs') {
        const err = validateCustodyModule('workshop-repairs-table-body', 'Workshop');
        if (err) { showToast(err, 'error'); return; }
    }
    const data = serializeModule(moduleId);
    appState.modules[moduleId] = data;
    saveState();
    updateDashboard();
    updateSystemAlerts();
    showToast(`${getModuleLabel(moduleId)} saved${dbConnected ? ' to database' : ''} successfully.`);
}

function validatePurchaseOrderModule() {
    const rows = document.querySelectorAll('#purchase-orders-table-body tr');
    let hasData = false;
    const grouped = {};

    for (let i = 0; i < rows.length; i++) {
        const tr = rows[i];
        const amount = parseFloat(tr.querySelector('.po-amount')?.value) || 0;
        const gl = tr.querySelector('.po-gl')?.value || '';
        const poNo = tr.querySelector('td:nth-child(3) input')?.value?.trim() || '';
        const supplier = tr.querySelector('td:nth-child(2) input')?.value?.trim() || '';

        if (amount > 0 || poNo || supplier) {
            hasData = true;
            if (!gl) return `Register row ${i + 1}: Select a GL account for the purchase order.`;
            if (amount <= 0) return `Register row ${i + 1}: Enter a purchase order amount.`;
            grouped[gl] = (grouped[gl] || 0) + amount;
        }
    }

    if (!hasData) {
        const docErr = typeof validatePurchaseOrderDocument === 'function' ? validatePurchaseOrderDocument() : null;
        const snap = typeof getPurchaseOrderSnapshot === 'function' ? getPurchaseOrderSnapshot() : null;
        const hasDraft = snap && (snap.lines.length || snap.poNumber || snap.supplierName);
        if (hasDraft && !docErr) return 'Add the current document to the register before saving, or clear the draft.';
        if (docErr) return docErr;
        return 'Add at least one purchase order to the register with GL account and amount.';
    }

    if (typeof canBuyOnGl === 'function') {
        for (const gl of Object.keys(grouped)) {
            const check = canBuyOnGl(gl, grouped[gl]);
            if (!check.ok) {
                return check.message
                    || `GL ${gl}: PO total ${formatCurrency(grouped[gl])} exceeds buying power ${formatCurrency(check.buyingPower || 0)}.`;
            }
        }
    }

    return null;
}

function savePurchaseOrderModule() {
    const error = validatePurchaseOrderModule();
    if (error) {
        showToast(error, 'error');
        return;
    }

    const data = serializeModule('purchase-orders');
    appState.modules['purchase-orders'] = data;
    saveState();
    updateDashboard();
    updateSystemAlerts();
    showToast('Purchase Orders saved and linked to GL accounts.');
}
