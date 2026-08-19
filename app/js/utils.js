/* utils.js — toast, currency, serialize/restore */

function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3200);
}

function formatCurrency(amount) {
    return '$' + Number(amount || 0).toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
}

/** e.g. Thursday 06 August 2026, 14:16 */
function formatFullDateTime(value) {
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${days[d.getDay()]} ${dd} ${months[d.getMonth()]} ${d.getFullYear()}, ${hh}:${mm}`;
}

function getSessionLoggedInAt() {
    try {
        const raw = sessionStorage.getItem(typeof SESSION_KEY !== 'undefined' ? SESSION_KEY : 'techstores_session_v1');
        if (!raw) return null;
        const session = JSON.parse(raw);
        return session?.loggedInAt || null;
    } catch (e) {
        return null;
    }
}

function refreshLastLoggedInDisplay() {
    const stamp = getSessionLoggedInAt() || new Date().toISOString();
    const text = formatFullDateTime(stamp);
    const lastUpdated = document.getElementById('dashboardLastUpdated');
    if (lastUpdated) lastUpdated.textContent = text;
    const chip = document.getElementById('dashboardLastSavedChip');
    if (chip) chip.textContent = text;
}

function isInputElement(el) {
    return el && (el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA');
}

function serializeField(el) {
    if (el.type === 'file') return null;
    const data = {
        tag: el.tagName.toLowerCase(),
        type: el.type || '',
        value: el.value
    };
    if (el.id) data.id = el.id;
    if (el.type === 'checkbox' || el.type === 'radio') {
        data.checked = !!el.checked;
    }
    if (el.tagName === 'SELECT') {
        data.selectedIndex = el.selectedIndex;
    }
    return data;
}

function applyField(el, data) {
    if (!data || !el) return;
    if (el.type === 'file') return;
    if (el.type === 'checkbox' || el.type === 'radio') {
        el.checked = !!data.checked;
        return;
    }
    el.value = data.value ?? '';
    if (el.tagName === 'SELECT' && typeof data.selectedIndex === 'number') {
        el.selectedIndex = data.selectedIndex;
    }
}

function serializeModule(moduleId) {
    const container = document.getElementById(moduleId);
    if (!container) return null;

    const fields = [];
    container.querySelectorAll('input, select, textarea').forEach((el) => {
        if (el.closest('tbody')) return;
        if (el.type === 'file') return;
        fields.push(serializeField(el));
    });

    const tables = {};
    container.querySelectorAll('tbody[id]').forEach((tbody) => {
        if (tbody.getAttribute('data-inventory-view') === '1') return;
        tables[tbody.id] = serializeTableBody(tbody);
    });

    return { fields, tables };
}

function serializeTableBody(tbody) {
    const rows = [];
    tbody.querySelectorAll('tr').forEach((tr) => {
        const row = { cells: [], staticCells: [] };
        tr.querySelectorAll('td').forEach((td) => {
            const input = td.querySelector('input, select, textarea');
            if (input) {
                row.cells.push(serializeField(input));
            } else {
                row.staticCells.push(td.textContent.trim());
            }
        });
        rows.push(row);
    });
    return rows;
}

function restoreModule(moduleId, moduleData) {
    const container = document.getElementById(moduleId);
    if (!container || !moduleData) return;

    const fieldElements = [];
    container.querySelectorAll('input, select, textarea').forEach((el) => {
        if (el.closest('tbody')) return;
        if (el.type === 'file') return;
        fieldElements.push(el);
    });

    (moduleData.fields || []).forEach((field, index) => {
        applyField(fieldElements[index], field);
    });

    Object.entries(moduleData.tables || {}).forEach(([tbodyId, rows]) => {
        restoreTableBody(tbodyId, rows);
    });

    if (moduleId === 'purchase-orders' && typeof initPurchaseOrderModuleDefaults === 'function') {
        initPurchaseOrderModuleDefaults();
    }
}

function restoreTableBody(tbodyId, rows) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;

    tbody.innerHTML = '';
    if (!rows || rows.length === 0) {
        const builder = ROW_BUILDERS[tbodyId];
        if (builder && tbodyId !== 'purchase-orders-table-body') {
            tbody.appendChild(builder());
        }
        return;
    }

    rows.forEach((rowData, rowIndex) => {
        if (tbodyId === 'voucher-table-body') {
            rowData = migrateVoucherRowData(rowData);
        }
        if (tbodyId === 'purchase-orders-table-body') {
            rowData = migratePurchaseOrderRowData(rowData);
        }
        if (tbodyId === 'purchase-orders-lines-body' && typeof migratePurchaseOrderLineRowData === 'function') {
            rowData = migratePurchaseOrderLineRowData(rowData);
        }
        if (tbodyId === 'loans-table-body') {
            rowData = migrateLoanRowData(rowData);
        }
        if (tbodyId === 'unit-equipment-table-body' && typeof migrateUnitEquipmentRowData === 'function') {
            rowData = migrateUnitEquipmentRowData(rowData);
        }
        const builder = ROW_BUILDERS[tbodyId];
        const tr = builder ? builder() : document.createElement('tr');
        if (tbodyId === 'bids-table-body' || tbodyId === 'unit-equipment-table-body' || tbodyId === 'dp-f1-table-body' || tbodyId === 'spec-eval-table-body' || tbodyId === 'zna-q-982-table-body') {
            const serialCell = tr.querySelector('td:first-child');
            if (serialCell && !serialCell.querySelector('input')) {
                serialCell.textContent = String(rowIndex + 1);
            }
        }

        const inputs = tr.querySelectorAll('input, select, textarea');
        rowData.cells.forEach((cellData, index) => {
            applyField(inputs[index], cellData);
        });

        if (tbodyId === 'unit-equipment-table-body' && typeof attachUnitEquipmentRow === 'function') {
            attachUnitEquipmentRow(tr);
        }
        if (tbodyId === 'purchase-orders-lines-body' && typeof attachPurchaseOrderLineRow === 'function') {
            attachPurchaseOrderLineRow(tr);
        }

        tbody.appendChild(tr);
    });

    if (tbodyId === 'bids-table-body') {
        tbody.querySelectorAll('tr').forEach(attachBidRowCalculations);
    }
    if (tbodyId === 'voucher-table-body') {
        tbody.querySelectorAll('tr').forEach(attachVoucherRowCalculations);
    }
    if (tbodyId === 'purchase-orders-lines-body' && typeof updatePurchaseOrderDocumentTotal === 'function') {
        updatePurchaseOrderDocumentTotal();
    }
    if (STOCK_LEDGER_TBODY_IDS.includes(tbodyId)) {
        tbody.querySelectorAll('tr').forEach(attachStockLedgerRow);
        recalculateStockLedger(tbodyId);
    }
    if (tbodyId === 'gl-220200002-table-body') {
        tbody.querySelectorAll('tr').forEach(attachJobCardRowCalculations);
        recalculateJobCardTotal();
    }
    if (tbodyId === 'loans-table-body') {
        tbody.querySelectorAll('tr').forEach((tr) => {
            if (typeof attachTemporaryLoanRow === 'function') attachTemporaryLoanRow(tr);
        });
    }
    if (tbodyId === 'zna-q-178-table-body' && typeof attachZnaQ178RowCalc === 'function') {
        tbody.querySelectorAll('tr').forEach(attachZnaQ178RowCalc);
        if (typeof recalculateZnaQ178Stock === 'function') recalculateZnaQ178Stock();
    }
    if (tbodyId === 'zna-q-80-table-body' && typeof attachZnaQ80RowCalc === 'function') {
        tbody.querySelectorAll('tr').forEach(attachZnaQ80RowCalc);
        if (typeof recalculateZnaQ80Stock === 'function') recalculateZnaQ80Stock();
    }
}

/* ===== Print helpers (fix blank / stuck print preview) ===== */

function clearPrintMode() {
    document.body.classList.remove('is-printing');
    [...document.body.classList]
        .filter((c) => c.startsWith('printing-'))
        .forEach((c) => document.body.classList.remove(c));
    document.querySelectorAll('.print-target').forEach((el) => el.classList.remove('print-target'));
}

/**
 * Official form / report print. Uses afterprint cleanup (not a short timeout),
 * so Chrome/Edge preview is not left with visibility:hidden and a blank page.
 */
function runOfficialPrint(prepare) {
    clearPrintMode();
    if (typeof prepare === 'function') prepare();

    const finish = () => {
        clearPrintMode();
        window.removeEventListener('afterprint', finish);
    };
    window.addEventListener('afterprint', finish);

    // Let the browser paint the print-target before opening the dialog
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            try {
                window.print();
            } catch (err) {
                finish();
            }
            // Fallback if afterprint never fires (some hosts)
            setTimeout(() => {
                if (document.body.classList.contains('is-printing')) finish();
            }, 2000);
        });
    });
}

function ensurePrintHost(hostId) {
    let host = document.getElementById(hostId);
    if (!host) {
        host = document.createElement('div');
        host.id = hostId;
        host.className = hostId;
        document.body.appendChild(host);
    }
    return host;
}

/**
 * Hardened "Save as PDF": prefer the module's official print path, then
 * browser Print → Save as PDF. Avoids blank preview by using runOfficialPrint.
 */
function saveModuleAsPdf(moduleId) {
    const id = moduleId || (typeof currentModuleId !== 'undefined' ? currentModuleId : '');
    if (!id) {
        showToast?.('Open a form first, then use Save PDF.', 'info');
        return;
    }
    showToast?.('Print dialog: choose “Save as PDF” / “Microsoft Print to PDF”.', 'info');

    if (typeof QM_PRINT_MAP !== 'undefined' && typeof QM_PRINT_MAP[id] === 'function') {
        try {
            QM_PRINT_MAP[id]();
            return;
        } catch (e) {
            console.warn('Official PDF print failed', e);
        }
    }

    const printBtn = document.querySelector(`#${CSS.escape(id)} .btn-print-module`)
        || document.querySelector(`.btn-print-module[data-print-target="${CSS.escape(id)}"]`);
    if (printBtn) {
        printBtn.click();
        return;
    }

    const reportBtn = document.querySelector(`#${CSS.escape(id)} .btn-generate-report`)
        || document.querySelector(`.btn-generate-report[data-report-module="${CSS.escape(id)}"]`);
    if (reportBtn) {
        reportBtn.click();
        setTimeout(() => {
            if (typeof runOfficialPrint === 'function') {
                runOfficialPrint(() => {
                    const out = document.getElementById('report-output');
                    if (out) {
                        out.classList.add('print-target');
                        document.body.classList.add('is-printing');
                    }
                });
            } else {
                window.print();
            }
        }, 400);
        return;
    }

    if (typeof runOfficialPrint === 'function') {
        runOfficialPrint(() => {
            const section = document.getElementById(id);
            if (section) {
                section.classList.add('print-target');
                document.body.classList.add('is-printing', `printing-${id}`);
            }
        });
    } else {
        window.print();
    }
}

function initSavePdfButtons() {
    document.body.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-save-pdf');
        if (!btn) return;
        e.preventDefault();
        const moduleId = btn.getAttribute('data-pdf-module')
            || btn.closest('.form-container')?.id
            || (typeof currentModuleId !== 'undefined' ? currentModuleId : '');
        saveModuleAsPdf(moduleId);
    });
}

/* ——— Date & field validation (accountability) ——— */

function todayIsoLocal() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function parseIsoDateOnly(value) {
    const s = String(value || '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
    const [y, m, d] = s.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null;
    return dt;
}

/** @returns {number} negative if a < b, 0 if equal, positive if a > b; NaN if either invalid */
function compareIsoDates(a, b) {
    const da = parseIsoDateOnly(a);
    const db = parseIsoDateOnly(b);
    if (!da || !db) return NaN;
    return da.getTime() - db.getTime();
}

/**
 * @param {string} value
 * @param {{ required?: boolean, label?: string, notFuture?: boolean, notPast?: boolean, minDate?: string, maxDate?: string }} [opts]
 * @returns {string|null} error message or null if OK
 */
function validateIsoDate(value, opts = {}) {
    const label = opts.label || 'Date';
    const raw = String(value || '').trim();
    if (!raw) {
        return opts.required ? `${label} is required.` : null;
    }
    if (!parseIsoDateOnly(raw)) {
        return `${label} is not a valid date.`;
    }
    const today = todayIsoLocal();
    if (opts.notFuture && compareIsoDates(raw, today) > 0) {
        return `${label} cannot be in the future (today is ${today}).`;
    }
    if (opts.notPast && compareIsoDates(raw, today) < 0) {
        return `${label} cannot be in the past (today is ${today}).`;
    }
    if (opts.minDate && compareIsoDates(raw, opts.minDate) < 0) {
        return `${label} cannot be before ${opts.minDate}.`;
    }
    if (opts.maxDate && compareIsoDates(raw, opts.maxDate) > 0) {
        return `${label} cannot be after ${opts.maxDate}.`;
    }
    return null;
}

function assertValidDate(value, opts = {}) {
    const err = validateIsoDate(value, opts);
    if (err) {
        if (typeof showToast === 'function') showToast(err, 'error');
        return false;
    }
    return true;
}

function assertDateOrder(earlier, later, message) {
    if (!earlier || !later) return true;
    if (compareIsoDates(later, earlier) < 0) {
        if (typeof showToast === 'function') {
            showToast(message || 'End date cannot be before start date.', 'error');
        }
        return false;
    }
    return true;
}

function assertPositiveNumber(value, label = 'Quantity') {
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) {
        if (typeof showToast === 'function') showToast(`${label} must be greater than zero.`, 'error');
        return false;
    }
    return true;
}

/** Apply HTML min/max from data-date-rule on date inputs. */
function applyDateInputConstraints(root = document) {
    const today = todayIsoLocal();
    (root.querySelectorAll ? root : document).querySelectorAll?.('input[type="date"][data-date-rule]')?.forEach((el) => {
        const rule = el.getAttribute('data-date-rule');
        if (rule === 'not-future') {
            el.max = today;
            if (!el.getAttribute('data-date-label')) el.setAttribute('data-date-label', 'Date');
        } else if (rule === 'not-past') {
            el.min = today;
            if (!el.getAttribute('data-date-label')) el.setAttribute('data-date-label', 'Date');
        }
    });
}

function initDateValidation() {
    applyDateInputConstraints(document);
    if (document.body.dataset.dateValidationWired === '1') return;
    document.body.dataset.dateValidationWired = '1';
    document.addEventListener('change', (e) => {
        const el = e.target;
        if (!(el instanceof HTMLInputElement) || el.type !== 'date') return;
        const rule = el.getAttribute('data-date-rule');
        if (!rule || !el.value) return;
        const label = el.getAttribute('data-date-label') || 'Date';
        const opts = rule === 'not-future'
            ? { notFuture: true, label }
            : rule === 'not-past'
                ? { notPast: true, label }
                : { label };
        const err = validateIsoDate(el.value, opts);
        if (err) {
            showToast(err, 'error');
            el.value = todayIsoLocal();
        }
    });
}

/**
 * Validate message/document date (not future) and optional action due (not past).
 * @returns {string|null} error
 */
function validateMessageDates({ messageDate = '', dueDate = '' } = {}) {
    const today = todayIsoLocal();
    const msgDate = String(messageDate || '').trim() || today;
    const errMsg = validateIsoDate(msgDate, {
        required: true,
        label: 'Message date',
        notFuture: true
    });
    if (errMsg) return errMsg;
    if (dueDate) {
        const errDue = validateIsoDate(dueDate, {
            label: 'Action due',
            notPast: true
        });
        if (errDue) return errDue;
    }
    return null;
}

function assertMessageDates(opts) {
    const err = validateMessageDates(opts);
    if (err) {
        if (typeof showToast === 'function') showToast(err, 'error');
        return false;
    }
    return true;
}

/** Custody / gate / workshop row date rules. Returns error string or null. */
function validateCustodyRowDates(row, rowLabel = 'Row') {
    const hasContent = !!(
        row.equipmentType || row.serialOrZa || row.unit || row.receivedBy
        || row.remark || row.dateOut || row.name || row.diagnosis
    );
    if (!hasContent && !row.dateIn) return null;
    const errIn = validateIsoDate(row.dateIn, {
        required: hasContent,
        label: `${rowLabel} Date In`,
        notFuture: true
    });
    if (errIn) return errIn;
    if (row.dateOut) {
        const errOut = validateIsoDate(row.dateOut, {
            label: `${rowLabel} Date Out`,
            notFuture: true
        });
        if (errOut) return errOut;
        if (row.dateIn && compareIsoDates(row.dateOut, row.dateIn) < 0) {
            return `${rowLabel}: Date Out cannot be before Date In.`;
        }
    }
    return null;
}

document.addEventListener('DOMContentLoaded', () => {
    clearPrintMode();
    initSavePdfButtons();
    if (typeof initDateValidation === 'function') initDateValidation();
    // Recover if a previous print left the page blank for Ctrl+P
    window.addEventListener('beforeprint', () => {
        if (document.body.classList.contains('is-printing') && !document.querySelector('.print-target')) {
            clearPrintMode();
        }
    });
    window.addEventListener('afterprint', () => {
        if (document.body.classList.contains('is-printing')) clearPrintMode();
    });
});
