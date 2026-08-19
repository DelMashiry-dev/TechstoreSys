/* tables.js — add/remove rows and table init helpers */

function initStockCalculations() {
    document.querySelectorAll('.stock-opening-balance').forEach((input) => {
        input.addEventListener('input', function() {
            const module = this.closest('.form-container');
            if (module?.id === 'gl-2200600002') {
                recalculateConsumablesStock(module);
                return;
            }
            const tbody = module?.querySelector('tbody[id]');
            if (tbody) recalculateStockLedger(tbody.id);
        });
    });

    STOCK_LEDGER_TBODY_IDS.forEach((tbodyId) => {
        const tbody = document.getElementById(tbodyId);
        if (!tbody) return;
        tbody.querySelectorAll('tr').forEach(attachStockLedgerRow);
        recalculateStockLedger(tbodyId);
    });
}

function initConsumablesStockCalculations() {
    const moduleEl = document.getElementById('gl-2200600002');
    if (!moduleEl) return;
    moduleEl.querySelectorAll('.gl-issue-qty').forEach((input) => {
        input.addEventListener('input', () => recalculateConsumablesStock(moduleEl));
    });
    moduleEl.querySelector('.stock-opening-balance')?.addEventListener('input', () => recalculateConsumablesStock(moduleEl));
    moduleEl.querySelector('.stock-receipts-total')?.addEventListener('input', () => recalculateConsumablesStock(moduleEl));
    recalculateConsumablesStock(moduleEl);
}

function initJobCardCalculations() {
    document.querySelectorAll('#gl-220200002-table-body tr').forEach(attachJobCardRowCalculations);
    recalculateJobCardTotal();
}

function attachBidRowCalculations(tr) {
    const qtyInput = tr.querySelector('.bid-qty');
    const unitCostInput = tr.querySelector('.bid-unit-cost');
    const totalInput = tr.querySelector('.bid-total-cost');
    function recalc() {
        const total = (parseFloat(qtyInput.value) || 0) * (parseFloat(unitCostInput.value) || 0);
        totalInput.value = total ? total.toFixed(2) : '';
    }
    qtyInput.addEventListener('input', recalc);
    unitCostInput.addEventListener('input', recalc);
}

function renumberSerialRows(tbodyId) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;
    tbody.querySelectorAll('tr').forEach((tr, index) => {
        const serialCell = tr.querySelector('td:first-child');
        if (serialCell && !serialCell.querySelector('input')) {
            serialCell.textContent = String(index + 1);
        }
    });
}

function addRow(tableBodyId) {
    if (!requireEditAccess({ reason: `addRow:${tableBodyId}` })) return;
    const tbody = document.getElementById(tableBodyId);
    const builder = ROW_BUILDERS[tableBodyId];
    if (builder) {
        tbody.appendChild(builder());
    } else if (tbody.rows.length > 0) {
        const newRow = document.createElement('tr');
        newRow.innerHTML = tbody.rows[0].innerHTML;
        tbody.appendChild(newRow);
    }
    if (tableBodyId === 'gl-220200002-table-body') {
        const lastRow = tbody.rows[tbody.rows.length - 1];
        const serialCell = lastRow.querySelector('td:first-child');
        if (serialCell) serialCell.textContent = String(tbody.rows.length);
        recalculateJobCardTotal();
    }
    if (STOCK_LEDGER_TBODY_IDS.includes(tableBodyId)) {
        recalculateStockLedger(tableBodyId);
    }
    if (tableBodyId === 'gl-2200600002-table-body') {
        recalculateConsumablesStock(document.getElementById('gl-2200600002'));
    }
    if (tableBodyId === 'spec-eval-table-body') {
        renumberSerialRows(tableBodyId);
    }
}

/**
 * Gate edits for signed-in users.
 * @param {{ silent?: boolean, reason?: string }} [options] - silent: skip toast (boot / system seed)
 */
function requireEditAccess(options = {}) {
    if (canEditData()) return true;
    // Suppress during boot (no session yet) and when caller asks for silence
    if (!options.silent && currentUser) {
        const msg = typeof viewOnlyDenialMessage === 'function'
            ? viewOnlyDenialMessage()
            : 'Your access level is view-only.';
        showToast(msg, 'error');
        if (typeof recordAccessAudit === 'function') {
            recordAccessAudit(
                'edit_denied',
                options.reason || `Blocked edit (${currentUser.role})`
            );
        }
    }
    return false;
}

function addVoucherRow() {
    if (!requireEditAccess()) return;
    document.getElementById('voucher-table-body').appendChild(buildVoucherRow());
    if (typeof renderVoucherInventoryTables === 'function') renderVoucherInventoryTables();
}

function addBidRow() {
    if (!requireEditAccess()) return;
    document.getElementById('bids-table-body').appendChild(buildBidRow());
}

function addUnitEquipmentRow() {
    if (!requireEditAccess()) return;
    document.getElementById('unit-equipment-table-body').appendChild(buildUnitEquipmentRow());
}

function addLoanRow() {
    if (!requireEditAccess()) return;
    const tr = buildLoanRow();
    document.getElementById('loans-table-body').appendChild(tr);
    if (typeof attachTemporaryLoanRow === 'function') attachTemporaryLoanRow(tr);
}

function addDPF1Row() {
    if (!requireEditAccess()) return;
    document.getElementById('dp-f1-table-body').appendChild(buildDPF1Row());
}

function addZnaQ982Row() {
    if (!requireEditAccess()) return;
    document.getElementById('zna-q-982-table-body').appendChild(buildZnaQ982Row());
}

function addZnaQ178Row() {
    if (!requireEditAccess()) return;
    const tr = buildZnaQ178Row();
    document.getElementById('zna-q-178-table-body').appendChild(tr);
    if (typeof recalculateZnaQ178Stock === 'function') recalculateZnaQ178Stock();
}

function addZnaQ1033Row() {
    if (!requireEditAccess()) return;
    document.getElementById('zna-q-1033-table-body').appendChild(buildZnaQ1033Row());
}

function addZnaQ1043Row() {
    if (!requireEditAccess()) return;
    document.getElementById('zna-q-1043-table-body').appendChild(buildZnaQ1043Row());
}

function addZnaQ80Row() {
    if (!requireEditAccess()) return;
    const tr = buildZnaQ80Row();
    document.getElementById('zna-q-80-table-body').appendChild(tr);
    if (typeof recalculateZnaQ80Stock === 'function') recalculateZnaQ80Stock();
}

function addZnaSvcs890Row() {
    if (!requireEditAccess()) return;
    document.getElementById('zna-svcs-890-table-body').appendChild(buildZnaSvcs890Row());
}

function addZnaQ1179Row() {
    if (!requireEditAccess()) return;
    document.getElementById('zna-q-1179-table-body').appendChild(buildZnaQ1179Row());
}

function addZnaQ987Row() {
    if (!requireEditAccess()) return;
    document.getElementById('zna-q-987-table-body').appendChild(buildZnaQ987Row());
}

function addZnaQ985Row() {
    if (!requireEditAccess()) return;
    document.getElementById('zna-q-985-table-body').appendChild(buildZnaQ985Row());
}

function addZnaQ1Row() {
    if (!requireEditAccess()) return;
    document.getElementById('zna-q-1-table-body').appendChild(buildZnaQ1Row());
}

function addZnaQ998Row() {
    if (!requireEditAccess()) return;
    document.getElementById('zna-q-998-table-body').appendChild(buildZnaQ998Row());
}

function addZnaQ1680Row() {
    if (!requireEditAccess()) return;
    document.getElementById('zna-q-1680-table-body').appendChild(buildZnaQ1680Row());
}

function addZnaQ3Row() {
    if (!requireEditAccess()) return;
    document.getElementById('zna-q-3-table-body').appendChild(buildZnaQ3Row());
}
function addZnaQ31Row() {
    if (!requireEditAccess()) return;
    document.getElementById('zna-q-31-table-body').appendChild(buildZnaQ31Row());
}
function addZnaQ40Row() {
    if (!requireEditAccess()) return;
    document.getElementById('zna-q-40-table-body').appendChild(buildZnaQ40Row());
}
function addZnaQ1049Row() {
    if (!requireEditAccess()) return;
    document.getElementById('zna-q-1049-table-body').appendChild(buildZnaQ1049Row());
}
function addZnaQ1229Row() {
    if (!requireEditAccess()) return;
    document.getElementById('zna-q-1229-table-body').appendChild(buildZnaQ1229Row());
}
function addZnaQ1571Row() {
    if (!requireEditAccess()) return;
    document.getElementById('zna-q-1571-table-body').appendChild(buildZnaQ1571Row());
}
function addZnaQ1954Row() {
    if (!requireEditAccess()) return;
    document.getElementById('zna-q-1954-table-body').appendChild(buildZnaQ1954Row());
}

function addZnaSvcs1045Row() {
    if (!requireEditAccess()) return;
    document.getElementById('zna-svcs-1045-table-body').appendChild(buildZnaSvcs1045Row());
}

function addZnaQ1157Row() {
    if (!requireEditAccess()) return;
    document.getElementById('zna-q-1157-table-body').appendChild(buildZnaQ1157Row());
}

function addAccommodationStoreRow() {
    if (!requireEditAccess()) return;
    document.getElementById('accommodation-stores-table-body').appendChild(buildAccommodationStoreRow());
}

function addDeliveryRow() {
    if (!requireEditAccess()) return;
    document.getElementById('delivery-table-body').appendChild(buildDeliveryRow());
}

function addPurchaseOrderRow() {
    addPurchaseOrderRegisterRow();
}

function addWorkshopRepairRow() {
    if (!requireEditAccess()) return;
    document.getElementById('workshop-repairs-table-body').appendChild(buildWorkshopRepairRow());
}

function addSupplierRow() {
    if (!requireEditAccess()) return;
    document.getElementById('suppliers-table-body').appendChild(buildSupplierRow());
}

function removeRow(button) {
    if (!requireEditAccess()) return;
    const row = button.closest('tr');
    const tbody = row.parentNode;
    const tbodyId = tbody.id;
    row.remove();
    if (tbodyId === 'bids-table-body' || tbodyId === 'unit-equipment-table-body' || tbodyId === 'dp-f1-table-body' || tbodyId === 'spec-eval-table-body' || tbodyId === 'zna-q-982-table-body') {
        renumberSerialRows(tbodyId);
    }
    if (tbodyId === 'zna-q-178-table-body' && typeof recalculateZnaQ178Stock === 'function') {
        recalculateZnaQ178Stock();
    }
    if (tbodyId === 'zna-q-80-table-body' && typeof recalculateZnaQ80Stock === 'function') {
        recalculateZnaQ80Stock();
    }
    if (tbodyId === 'gl-220200002-table-body') {
        renumberSerialRows(tbodyId);
        recalculateJobCardTotal();
    }
    if (STOCK_LEDGER_TBODY_IDS.includes(tbodyId)) {
        recalculateStockLedger(tbodyId);
    }
    if (tbodyId === 'gl-2200600002-table-body') {
        recalculateConsumablesStock(document.getElementById('gl-2200600002'));
    }
    if (tbodyId === 'voucher-table-body' && typeof renderVoucherInventoryTables === 'function') {
        renderVoucherInventoryTables();
    }
}

function initBidCalculations() {
    document.querySelectorAll('#bids-table-body tr').forEach(attachBidRowCalculations);
}

function initVoucherCalculations() {
    document.querySelectorAll('#voucher-table-body tr').forEach(attachVoucherRowCalculations);
}

