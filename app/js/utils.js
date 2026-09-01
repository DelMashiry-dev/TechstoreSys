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

/** Turn a <select> into a type-to-filter combobox; keeps the native select as the value source. */
function typeableSelectOptions(selectEl) {
    const out = [];
    if (!selectEl) return out;
    selectEl.childNodes.forEach((node) => {
        if (node.tagName === 'OPTGROUP') {
            const group = String(node.label || '').trim();
            [...node.options].forEach((opt) => {
                out.push({
                    value: opt.value,
                    label: String(opt.textContent || '').trim(),
                    group
                });
            });
        } else if (node.tagName === 'OPTION') {
            out.push({
                value: node.value,
                label: String(node.textContent || '').trim(),
                group: ''
            });
        }
    });
    return out;
}

function syncTypeableSelectFromNative(selectEl) {
    const ui = selectEl?._typeable;
    if (!ui) return;
    const opt = selectEl.selectedOptions?.[0];
    ui.input.value = opt ? String(opt.textContent || '').trim() : '';
}

function resolveTypeableSelectInput(selectEl) {
    const ui = selectEl?._typeable;
    if (!ui) return false;
    const q = ui.input.value.trim();
    const qLower = q.toLowerCase();
    const options = typeableSelectOptions(selectEl).filter((o) => o.value !== '' && o.value !== '__other__');
    if (!q) {
        syncTypeableSelectFromNative(selectEl);
        return false;
    }
    let hit = options.find((o) => o.label.toLowerCase() === qLower);
    if (!hit) hit = options.find((o) => o.value.toLowerCase() === qLower);
    if (!hit) hit = options.find((o) => o.label.toLowerCase().startsWith(qLower));
    if (!hit) hit = options.find((o) => o.value.toLowerCase().startsWith(qLower));
    if (!hit) hit = options.find((o) => o.label.toLowerCase().includes(qLower));
    if (!hit) hit = options.find((o) => o.value.toLowerCase().includes(qLower));
    if (!hit) hit = options.find((o) => o.value.toLowerCase() === qLower.replace(/\s+/g, '-'));
    if (!hit && ui.allowCustom) {
        applyTypeableSelectCustomValue(selectEl, q);
        return true;
    }
    if (!hit) return false;
    if (selectEl.value !== hit.value) {
        selectEl.value = hit.value;
        selectEl.dispatchEvent(new Event('change', { bubbles: true }));
    }
    ui.input.value = hit.label;
    return true;
}

function applyTypeableSelectCustomValue(selectEl, text) {
    const ui = selectEl?._typeable;
    const val = String(text || '').trim();
    if (!val || !ui) return;
    let opt = [...selectEl.options].find((o) => o.value === val);
    if (!opt) {
        opt = new Option(`${val} (custom)`, val, true, true);
        selectEl.add(opt);
    }
    selectEl.value = val;
    ui.input.value = val;
    selectEl.dispatchEvent(new Event('change', { bubbles: true }));
}

function hideTypeableSelectList(selectEl) {
    const ui = selectEl?._typeable;
    if (!ui?.list) return;
    ui.list.hidden = true;
    ui.list.style.position = '';
    ui.list.style.left = '';
    ui.list.style.top = '';
    ui.list.style.width = '';
    ui.list.style.maxHeight = '';
    ui.list.style.zIndex = '';
    ui.wrap?.classList.remove('is-open');
    ui.list.querySelectorAll('.typeable-select-item.is-active').forEach((el) => el.classList.remove('is-active'));
    if (ui.wrap && ui.list.parentNode === document.body) {
        ui.wrap.appendChild(ui.list);
    }
    if (ui._reposition) {
        window.removeEventListener('scroll', ui._reposition, true);
        window.removeEventListener('resize', ui._reposition);
        ui._reposition = null;
    }
}

function attachTypeableSelectList(selectEl) {
    const ui = selectEl?._typeable;
    if (!ui?.list) return;
    if (ui.list.parentNode !== document.body) {
        document.body.appendChild(ui.list);
    }
    ui.list.dataset.typeableFor = selectEl.id || '';
}

function positionTypeableSelectList(selectEl) {
    const ui = selectEl?._typeable;
    if (!ui?.list || ui.list.hidden) return;
    attachTypeableSelectList(selectEl);
    const rect = ui.input.getBoundingClientRect();
    const gap = 4;
    const maxH = 260;
    const spaceBelow = window.innerHeight - rect.bottom - gap;
    const spaceAbove = rect.top - gap;
    const openUp = spaceBelow < 160 && spaceAbove > spaceBelow;
    const maxHeight = Math.min(maxH, openUp ? spaceAbove : spaceBelow);
    ui.list.style.position = 'fixed';
    ui.list.style.left = `${Math.max(8, rect.left)}px`;
    ui.list.style.width = `${Math.max(rect.width, 180)}px`;
    ui.list.style.maxHeight = `${Math.max(120, maxHeight)}px`;
    ui.list.style.zIndex = '15000';
    if (openUp) {
        ui.list.style.top = `${Math.max(8, rect.top - gap - Math.min(maxH, maxHeight))}px`;
    } else {
        ui.list.style.top = `${rect.bottom + gap}px`;
    }
}

function showTypeableSelectList(selectEl, filterText) {
    const ui = selectEl?._typeable;
    if (!ui) return;
    renderTypeableSelectList(selectEl, filterText != null ? filterText : ui.input.value);
    ui.wrap.classList.add('is-open');
    ui.list.hidden = false;
    positionTypeableSelectList(selectEl);
    if (!ui._reposition) {
        ui._reposition = () => {
            if (!ui.list.hidden) positionTypeableSelectList(selectEl);
        };
        window.addEventListener('scroll', ui._reposition, true);
        window.addEventListener('resize', ui._reposition);
    }
}

function renderTypeableSelectList(selectEl, filterText = '') {
    const ui = selectEl?._typeable;
    if (!ui?.list) return;
    const q = String(filterText || '').trim().toLowerCase();
    const options = typeableSelectOptions(selectEl).filter((o) => o.value !== '' && o.value !== '__other__');
    const filtered = q
        ? options.filter((o) => {
            const label = o.label.toLowerCase();
            const value = o.value.toLowerCase();
            const group = (o.group || '').toLowerCase();
            const hay = `${label} ${value} ${group}`;
            const parts = q.split(/\s+/).filter(Boolean);
            return parts.length
                ? parts.every((p) => hay.includes(p))
                : true;
        })
        : options;
    let lastGroup = null;
    const parts = [];
    filtered.slice(0, ui.maxItems || 200).forEach((row, index) => {
        if (row.group && row.group !== lastGroup) {
            lastGroup = row.group;
            parts.push(`<li class="typeable-select-group" aria-hidden="true">${escapeHtml(row.group)}</li>`);
        }
        parts.push(
            `<li class="typeable-select-item" role="option" data-value="${escapeHtml(row.value)}" data-index="${index}">${escapeHtml(row.label)}</li>`
        );
    });
    ui.list.innerHTML = parts.length
        ? parts.join('')
        : '<li class="typeable-select-empty">No match — keep typing or pick from the list.</li>';
}

function escapeHtml(v) {
    return String(v ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function refreshTypeableSelect(selectEl) {
    if (!selectEl?._typeable) return;
    syncTypeableSelectFromNative(selectEl);
    if (!selectEl._typeable.list.hidden) {
        renderTypeableSelectList(selectEl, selectEl._typeable.input.value);
        positionTypeableSelectList(selectEl);
    }
}

function mountTypeableSelect(selectEl, { placeholder = 'Type or pick…', allowCustom = false, maxItems = 200 } = {}) {
    if (!selectEl) return;
    if (selectEl.dataset.typeableMounted === '1') {
        refreshTypeableSelect(selectEl);
        return;
    }
    selectEl.dataset.typeableMounted = '1';

    const wrap = document.createElement('div');
    wrap.className = 'typeable-select';
    selectEl.parentNode.insertBefore(wrap, selectEl);
    wrap.appendChild(selectEl);
    selectEl.classList.add('typeable-select-native');
    selectEl.tabIndex = -1;
    selectEl.setAttribute('aria-hidden', 'true');

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'form-control typeable-select-input';
    input.autocomplete = 'off';
    input.spellcheck = false;
    input.placeholder = placeholder;
    wrap.insertBefore(input, selectEl);

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'typeable-select-toggle';
    toggle.setAttribute('aria-label', 'Show options');
    toggle.textContent = '▾';
    wrap.insertBefore(toggle, selectEl);

    const list = document.createElement('ul');
    list.className = 'typeable-select-list';
    list.setAttribute('role', 'listbox');
    list.hidden = true;
    wrap.appendChild(list);

    selectEl._typeable = { input, list, toggle, wrap, allowCustom: !!allowCustom, maxItems };

    input.addEventListener('focus', () => {
        showTypeableSelectList(selectEl, '');
    });
    input.addEventListener('click', () => {
        if (ui.list.hidden) showTypeableSelectList(selectEl, '');
        else showTypeableSelectList(selectEl, input.value);
    });
    input.addEventListener('input', () => {
        showTypeableSelectList(selectEl, input.value);
    });
    input.addEventListener('blur', () => {
        window.setTimeout(() => {
            if (!wrap.contains(document.activeElement)) {
                resolveTypeableSelectInput(selectEl);
                hideTypeableSelectList(selectEl);
            }
        }, 120);
    });
    input.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            if (list.hidden) showTypeableSelectList(selectEl, input.value);
            const items = [...list.querySelectorAll('.typeable-select-item')];
            if (!items.length) return;
            const active = list.querySelector('.typeable-select-item.is-active');
            let idx = active ? items.indexOf(active) : -1;
            if (e.key === 'ArrowDown') idx = Math.min(items.length - 1, idx + 1);
            else idx = Math.max(0, idx <= 0 ? 0 : idx - 1);
            items.forEach((el) => el.classList.remove('is-active'));
            if (items[idx]) {
                items[idx].classList.add('is-active');
                items[idx].scrollIntoView({ block: 'nearest' });
            }
            return;
        }
        const active = list.querySelector('.typeable-select-item.is-active');
        if (e.key === 'Enter') {
            if (active) {
                e.preventDefault();
                selectEl.value = active.getAttribute('data-value') || '';
                uiSyncAndClose(selectEl, active.textContent.trim());
                selectEl.dispatchEvent(new Event('change', { bubbles: true }));
            } else {
                e.preventDefault();
                resolveTypeableSelectInput(selectEl);
                hideTypeableSelectList(selectEl);
            }
            return;
        } else if (e.key === 'Escape') {
            hideTypeableSelectList(selectEl);
            syncTypeableSelectFromNative(selectEl);
        }
    });

    toggle.addEventListener('mousedown', (e) => {
        e.preventDefault();
    });
    toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        if (list.hidden) {
            input.focus();
            showTypeableSelectList(selectEl, '');
        } else {
            hideTypeableSelectList(selectEl);
        }
    });

    list.addEventListener('mousedown', (e) => {
        const item = e.target.closest('.typeable-select-item');
        if (!item) return;
        e.preventDefault();
        selectEl.value = item.getAttribute('data-value') || '';
        uiSyncAndClose(selectEl, item.textContent.trim());
        selectEl.dispatchEvent(new Event('change', { bubbles: true }));
    });

    function uiSyncAndClose(sel, label) {
        input.value = label;
        hideTypeableSelectList(sel);
    }

    if (!document.body.dataset.typeableSelectBound) {
        document.body.dataset.typeableSelectBound = '1';
        document.addEventListener('click', (e) => {
            document.querySelectorAll('.typeable-select-native').forEach((sel) => {
                const ui = sel._typeable;
                if (!ui) return;
                if (ui.wrap.contains(e.target) || ui.list.contains(e.target)) return;
                hideTypeableSelectList(sel);
            });
        });
    }

    syncTypeableSelectFromNative(selectEl);
}

window.mountTypeableSelect = mountTypeableSelect;
window.refreshTypeableSelect = refreshTypeableSelect;
