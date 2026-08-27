/* purchase-orders.js — SAP-style electronic purchase order */

function poEscape(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function poFieldValue(id) {
    const el = document.getElementById(id);
    if (!el) return '';
    return String(el.value || '').trim();
}

function formatPoSapDate(isoDate) {
    if (!isoDate) return '';
    const parts = String(isoDate).split('-');
    if (parts.length === 3) return `${parts[2]}.${parts[1]}.${parts[0]}`;
    const d = new Date(`${isoDate}T00:00:00`);
    if (Number.isNaN(d.getTime())) return isoDate;
    return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
}

function formatPoMoneyPlain(amount) {
    return (Number(amount) || 0).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function formatPoMoney(amount, currency) {
    const formatted = formatPoMoneyPlain(amount);
    const cur = String(currency || '').trim();
    return cur ? `${formatted} ${cur}` : formatted;
}

function collectPurchaseOrderLines() {
    const lines = [];
    document.querySelectorAll('#purchase-orders-lines-body tr').forEach((tr) => {
        const item = tr.querySelector('.po-line-item')?.value?.trim() || '';
        const material = tr.querySelector('.po-line-material')?.value?.trim() || '';
        const qty = tr.querySelector('.po-line-qty')?.value?.trim() || '';
        const unit = tr.querySelector('.po-line-unit')?.value?.trim() || 'each';
        const desc = tr.querySelector('.po-line-desc')?.value?.trim() || '';
        const price = parseFloat(tr.querySelector('.po-line-price')?.value) || 0;
        const net = parseFloat(tr.querySelector('.po-line-net')?.value) || 0;
        if (!item && !material && !desc && !qty && price <= 0) return;
        lines.push({
            item, material, qty, unit, desc, price,
            net: net || (parseFloat(qty) || 0) * price
        });
    });
    return lines;
}

function getPurchaseOrderDocumentTotal(lines) {
    return (lines || collectPurchaseOrderLines()).reduce((sum, line) => sum + (Number(line.net) || 0), 0);
}

function getPurchaseOrderSnapshot() {
    const lines = collectPurchaseOrderLines();
    const currency = poFieldValue('poCurrency') || 'ZiG';
    const total = getPurchaseOrderDocumentTotal(lines);
    return {
        supplierName: poFieldValue('poSupplierName'),
        supplierAddress: document.getElementById('poSupplierAddress')?.value?.trim() || '',
        poNumber: poFieldValue('poNumber'),
        date: poFieldValue('poDate'),
        dateDisplay: formatPoSapDate(poFieldValue('poDate')),
        vendorNo: poFieldValue('poVendorNo'),
        deliverTo: poFieldValue('poDeliverTo'),
        deliveryDate: poFieldValue('poDeliveryDate'),
        deliveryDateDisplay: formatPoSapDate(poFieldValue('poDeliveryDate')),
        paymentTerms: poFieldValue('poPaymentTerms'),
        currency,
        gl: poFieldValue('poGl'),
        glLabel: document.getElementById('poGl')?.selectedOptions?.[0]?.text || poFieldValue('poGl'),
        signature: poFieldValue('poSignature'),
        lines,
        total,
        totalDisplay: formatPoMoney(total, currency)
    };
}

function attachPurchaseOrderLineRow(tr) {
    if (!tr || tr.dataset.poLineBound === '1') return;
    tr.dataset.poLineBound = '1';
    tr.addEventListener('input', (event) => {
        if (event.target.matches('.po-line-qty, .po-line-price')) {
            recalculatePurchaseOrderLineRow(tr);
            updatePurchaseOrderDocumentTotal();
        }
    });
}

function recalculatePurchaseOrderLineRow(tr) {
    const qty = parseFloat(tr.querySelector('.po-line-qty')?.value) || 0;
    const price = parseFloat(tr.querySelector('.po-line-price')?.value) || 0;
    const netInput = tr.querySelector('.po-line-net');
    if (netInput) netInput.value = qty && price ? (qty * price).toFixed(2) : '';
}

function nextPurchaseOrderItemSer() {
    const rows = document.querySelectorAll('#purchase-orders-lines-body .po-line-item');
    let max = 0;
    rows.forEach((input) => {
        const n = parseInt(String(input.value || '').replace(/\D/g, ''), 10);
        if (n > max) max = n;
    });
    return String(max + 10).padStart(5, '0');
}

function buildPurchaseOrderLineRow(data = {}) {
    const esc = poEscape;
    const item = data.item || nextPurchaseOrderItemSer();
    const unit = data.unit || 'each';
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td><input type="text" class="form-control po-line-item" placeholder="00010" value="${esc(item)}"></td>
        <td><input type="text" class="form-control po-line-material" placeholder="Material number" value="${esc(data.material)}"></td>
        <td><input type="number" class="form-control po-line-qty" min="0" step="any" value="${esc(data.qty)}"></td>
        <td><input type="text" class="form-control po-line-unit" placeholder="each" value="${esc(unit)}"></td>
        <td><input type="text" class="form-control po-line-desc" placeholder="Description" value="${esc(data.desc)}"></td>
        <td><input type="number" class="form-control po-line-price" min="0" step="0.01" value="${esc(data.price)}"></td>
        <td><input type="number" class="form-control po-line-net" min="0" step="0.01" readonly tabindex="-1" value="${esc(data.net)}"></td>
        <td class="po-screen-only"><button type="button" class="btn btn-danger btn-sm" onclick="removeRow(this)">Remove</button></td>
    `;
    attachPurchaseOrderLineRow(tr);
    return tr;
}

function buildPurchaseOrderRegisterRow(data = {}) {
    const tr = document.createElement('tr');
    const gl = data.gl || '2200600002';
    tr.innerHTML = `
        <td><input type="date" class="form-control" value="${poEscape(data.date)}"></td>
        <td><input type="text" class="form-control" value="${poEscape(data.supplier)}"></td>
        <td><input type="text" class="form-control" value="${poEscape(data.poNo)}"></td>
        <td><input type="number" class="form-control po-amount" min="0" step="0.01" value="${poEscape(data.amount)}"></td>
        <td>${typeof buildGlSelectHtml === 'function' ? buildGlSelectHtml('po-gl', gl) : ''}</td>
        <td><input type="text" class="form-control" value="${poEscape(data.vendor)}"></td>
        <td><input type="text" class="form-control" value="${poEscape(data.signature)}"></td>
        <td><button type="button" class="btn btn-danger btn-sm" onclick="removeRow(this)">Remove</button></td>
    `;
    return tr;
}

function buildPurchaseOrderRow(data = {}) {
    return buildPurchaseOrderRegisterRow(data);
}

function addPurchaseOrderLineRow() {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;
    const tbody = document.getElementById('purchase-orders-lines-body');
    if (!tbody) return;
    tbody.appendChild(buildPurchaseOrderLineRow());
    updatePurchaseOrderDocumentTotal();
}

function addPurchaseOrderRegisterRow() {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;
    const tbody = document.getElementById('purchase-orders-table-body');
    if (!tbody) return;
    tbody.appendChild(buildPurchaseOrderRegisterRow());
}

function updatePurchaseOrderDocumentTotal() {
    const snap = getPurchaseOrderSnapshot();
    const el = document.getElementById('poDocTotalDisplay');
    const curEl = document.getElementById('poDocTotalCurrency');
    if (curEl) curEl.textContent = snap.currency || 'ZiG';
    if (el) el.textContent = snap.total > 0 ? formatPoMoneyPlain(snap.total) : '—';
}

function collectSystemSuppliers() {
    let rows = [];
    if (typeof collectSupplierRows === 'function') {
        rows = collectSupplierRows();
    }
    if (!rows.length && typeof appState !== 'undefined') {
        const tableRows = appState?.modules?.['suppliers-contracts']?.tables?.['suppliers-table-body'] || [];
        rows = tableRows.map((row, index) => {
            const cells = row.cells || [];
            const statusCell = cells[7];
            const status = statusCell?.tag === 'select'
                ? String(statusCell.value || 'Active').trim()
                : 'Active';
            return {
                index,
                id: String(cells[0]?.value || '').trim(),
                name: String(cells[1]?.value || '').trim(),
                contact: String(cells[2]?.value || '').trim(),
                phone: String(cells[3]?.value || '').trim(),
                email: String(cells[4]?.value || '').trim(),
                status
            };
        });
    }
    const seen = new Set();
    return rows
        .filter((row) => row.name)
        .filter((row) => {
            const key = row.name.toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        })
        .sort((a, b) => {
            const rank = (s) => (s === 'Active' ? 0 : s === 'Pending' ? 1 : 2);
            return rank(a.status) - rank(b.status)
                || a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
        });
}

function refreshPurchaseOrderSupplierOptions() {
    const pick = document.getElementById('poSupplierPick');
    const datalist = document.getElementById('poSupplierList');
    if (!pick || !datalist) return;

    const suppliers = collectSystemSuppliers();
    const currentName = poFieldValue('poSupplierName');
    const currentId = poFieldValue('poVendorNo');

    pick.innerHTML = '<option value="">— Select from register —</option>';
    datalist.innerHTML = '';

    suppliers.forEach((supplier) => {
        const opt = document.createElement('option');
        opt.value = supplier.id || supplier.name;
        const statusNote = supplier.status && supplier.status !== 'Active' ? ` (${supplier.status})` : '';
        opt.textContent = `${supplier.name}${statusNote}`;
        pick.appendChild(opt);

        const dataOpt = document.createElement('option');
        dataOpt.value = supplier.name;
        if (supplier.id) dataOpt.label = supplier.id;
        datalist.appendChild(dataOpt);
    });

    if (currentId && suppliers.some((s) => s.id === currentId)) {
        pick.value = currentId;
    } else if (currentName) {
        const match = suppliers.find((s) => s.name.toLowerCase() === currentName.toLowerCase());
        pick.value = match ? (match.id || match.name) : '';
    }
}

function applyPurchaseOrderSupplierPick() {
    const pick = document.getElementById('poSupplierPick');
    const nameInput = document.getElementById('poSupplierName');
    const vendorInput = document.getElementById('poVendorNo');
    if (!pick || !nameInput) return;

    const key = String(pick.value || '').trim();
    if (!key) return;

    const supplier = collectSystemSuppliers().find((s) => s.id === key || s.name === key);
    if (!supplier) return;

    nameInput.value = supplier.name;
    if (vendorInput) {
        vendorInput.value = supplier.id || '';
        vendorInput.dataset.poAutoVendor = '1';
    }
}

function syncPurchaseOrderSupplierPickFromName() {
    const pick = document.getElementById('poSupplierPick');
    const nameInput = document.getElementById('poSupplierName');
    const vendorInput = document.getElementById('poVendorNo');
    if (!pick || !nameInput) return;

    const typed = nameInput.value.trim();
    if (!typed) {
        pick.value = '';
        return;
    }

    const supplier = collectSystemSuppliers().find((s) => s.name.toLowerCase() === typed.toLowerCase());
    pick.value = supplier ? (supplier.id || supplier.name) : '';
    if (supplier?.id && vendorInput?.dataset.poAutoVendor === '1') {
        vendorInput.value = supplier.id;
    }
}

function reloadRealDpPurchaseOrders({ force = false } = {}) {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;
    if (typeof ensureRealDpPurchaseOrders !== 'function') return;
    const result = ensureRealDpPurchaseOrders({ force });
    if (typeof restoreModule === 'function' && appState?.modules?.['purchase-orders']) {
        restoreModule('purchase-orders', appState.modules['purchase-orders']);
    }
    if (typeof saveState === 'function') saveState();
    if (typeof updateDashboard === 'function') updateDashboard();
    if (typeof showToast === 'function') {
        const msg = result.added
            ? `Loaded ${result.added} real DP purchase order(s) into register (${result.total} total).`
            : `IT DIR DP register already has all ${REAL_DP_PURCHASE_ORDERS?.length || 0} purchase orders.`;
        showToast(msg);
    }
    return result;
}

function bindPurchaseOrderModule() {
    const container = document.getElementById('purchase-orders');
    if (!container) return;

    document.querySelectorAll('#purchase-orders-lines-body tr').forEach(attachPurchaseOrderLineRow);
    refreshPurchaseOrderSupplierOptions();
    updatePurchaseOrderDocumentTotal();
    markRealDpPurchaseOrderRegisterRows();

    if (container.dataset.poBound === '1') return;
    container.dataset.poBound = '1';

    document.getElementById('purchase-orders-table-body')?.addEventListener('click', (event) => {
        if (event.target.closest('button')) return;
        const tr = event.target.closest('tr');
        if (!tr) return;
        const poNo = tr.querySelector('td:nth-child(3) input')?.value?.trim();
        if (!poNo || typeof loadRealDpPurchaseOrderIntoForm !== 'function') return;
        if (!findRealDpPurchaseOrder?.(poNo)) return;
        loadRealDpPurchaseOrderIntoForm(poNo);
        tr.classList.add('po-register-row-active');
        tr.parentElement?.querySelectorAll('tr.po-register-row-active').forEach((row) => {
            if (row !== tr) row.classList.remove('po-register-row-active');
        });
    });

    document.getElementById('poLoadRealDpBtn')?.addEventListener('click', () => reloadRealDpPurchaseOrders());
    document.getElementById('poReloadRealDpBtn')?.addEventListener('click', () => {
        if (!window.confirm('Reload all scanned IT DIR DP purchase orders into the register? Existing matching PO rows will be replaced.')) return;
        reloadRealDpPurchaseOrders({ force: true });
    });

    container.addEventListener('input', (event) => {
        if (event.target.matches('#poCurrency, #poGl, #poSupplierName, #poNumber, #poDate')) {
            updatePurchaseOrderDocumentTotal();
        }
        if (event.target.id === 'poSupplierName') {
            syncPurchaseOrderSupplierPickFromName();
        }
        if (event.target.id === 'poVendorNo') {
            event.target.dataset.poAutoVendor = event.target.value.trim() ? '' : '1';
        }
    });

    document.getElementById('poSupplierPick')?.addEventListener('change', applyPurchaseOrderSupplierPick);
}

function clearPurchaseOrderDocument() {
    const set = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.value = value ?? '';
    };
    set('poSupplierName', '');
    set('poSupplierAddress', '');
    set('poNumber', '');
    set('poDate', '');
    set('poVendorNo', '');
    set('poDeliverTo', 'IT DIR / 04 731831');
    set('poDeliveryDate', '');
    set('poPaymentTerms', '');
    set('poCurrency', 'ZiG');
    set('poGl', '2200600002');
    set('poSignature', '');
    const pick = document.getElementById('poSupplierPick');
    if (pick) pick.value = '';
    const vendorEl = document.getElementById('poVendorNo');
    if (vendorEl) vendorEl.dataset.poAutoVendor = '1';
    const tbody = document.getElementById('purchase-orders-lines-body');
    if (tbody) {
        tbody.innerHTML = '';
        tbody.appendChild(buildPurchaseOrderLineRow());
    }
    updatePurchaseOrderDocumentTotal();
}

function newPurchaseOrderDocument() {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;
    clearPurchaseOrderDocument();
    if (typeof showToast === 'function') showToast('New purchase order document ready.');
}

function validatePurchaseOrderDocument() {
    const snap = getPurchaseOrderSnapshot();
    if (!snap.supplierName && !snap.poNumber && !snap.lines.length) {
        return 'Complete the purchase order document or add register rows.';
    }
    if (snap.lines.length && !snap.gl) return 'Select a GL account for this purchase order.';
    if (snap.lines.length && snap.total <= 0) return 'Enter line quantities and prices so the PO total is greater than zero.';
    if (snap.lines.length && !snap.poNumber) return 'Enter the purchase order number (Our Ref).';
    return null;
}

function addCurrentPoToRegister() {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;
    const error = validatePurchaseOrderDocument();
    if (error) {
        if (typeof showToast === 'function') showToast(error, 'error');
        return;
    }
    const snap = getPurchaseOrderSnapshot();
    const tbody = document.getElementById('purchase-orders-table-body');
    if (!tbody) return;
    tbody.appendChild(buildPurchaseOrderRegisterRow({
        date: snap.date,
        supplier: snap.supplierName,
        poNo: snap.poNumber,
        amount: snap.total.toFixed(2),
        gl: snap.gl,
        vendor: snap.vendorNo,
        signature: snap.signature
    }));
    if (typeof showToast === 'function') showToast(`PO ${snap.poNumber} added to register (${snap.totalDisplay}).`);
}

function buildPurchaseOrderOfficialHtml() {
    const esc = poEscape;
    const snap = getPurchaseOrderSnapshot();
    const lines = snap.lines.length ? snap.lines : [{ item: '', material: '', qty: '', unit: 'each', desc: '', price: '', net: '' }];
    const lineRows = lines.map((line) => `
        <tr>
            <td class="po-col-item">${esc(line.item)}</td>
            <td class="po-col-material">${esc(line.material)}</td>
            <td class="po-col-qty">${esc(line.qty)}</td>
            <td class="po-col-unit">${esc(line.unit || 'each')}</td>
            <td class="po-col-desc">${esc(line.desc)}</td>
            <td class="po-col-price num">${esc(formatPoMoneyPlain(line.price))}</td>
            <td class="po-col-net num">${esc(formatPoMoneyPlain(line.net))}</td>
        </tr>
    `).join('');
    const addressHtml = snap.supplierAddress
        ? snap.supplierAddress.split(/\r?\n/).map((line) => esc(line)).join('<br>')
        : '&nbsp;';

    return `
    <div class="po-official-doc">
        <div class="po-official-header">
            <div class="po-official-vendor">
                <div class="po-official-vendor-name">${esc(snap.supplierName || '')}</div>
                <div class="po-official-vendor-addr">${addressHtml}</div>
            </div>
            <div class="po-official-title-block">
                <div class="po-official-title">Purchase Order</div>
                <table class="po-official-ref-box">
                    <tbody>
                        <tr><td>Our Ref</td><td>${esc(snap.poNumber || '')}</td></tr>
                        <tr><td>Date</td><td>${esc(snap.dateDisplay || snap.date || '')}</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
        <div class="po-official-meta">
            <div class="po-official-meta-row"><span class="po-official-meta-label">Vendor</span><span class="po-official-meta-value">${esc(snap.vendorNo || '')}</span></div>
            <div class="po-official-meta-row"><span class="po-official-meta-label">Deliver to</span><span class="po-official-meta-value">${esc(snap.deliverTo || '')}</span></div>
            <div class="po-official-meta-row"><span class="po-official-meta-label">Delivery Date</span><span class="po-official-meta-value">${esc(snap.deliveryDateDisplay || snap.deliveryDate || '')}</span></div>
            <div class="po-official-meta-row"><span class="po-official-meta-label">Payment Terms</span><span class="po-official-meta-value">${esc(snap.paymentTerms || '')}</span></div>
            <div class="po-official-meta-row"><span class="po-official-meta-label">Currency</span><span class="po-official-meta-value">${esc(snap.currency || '')}</span></div>
            <div class="po-official-meta-row"><span class="po-official-meta-label">GL Account</span><span class="po-official-meta-value">${esc(snap.glLabel || snap.gl || '')}</span></div>
        </div>
        <table class="po-official-lines">
            <thead>
                <tr>
                    <th>Item (Ser)</th>
                    <th>Material Number</th>
                    <th>Order Qty</th>
                    <th>Unit</th>
                    <th>Description</th>
                    <th>Price Per Unit</th>
                    <th>Net Value</th>
                </tr>
            </thead>
            <tbody>${lineRows}</tbody>
            <tfoot>
                <tr>
                    <td colspan="6" class="po-official-total-label">Total net value excl. tax ${esc(snap.currency || 'ZiG')}</td>
                    <td class="po-official-total-value num">${esc(formatPoMoneyPlain(snap.total))}</td>
                </tr>
            </tfoot>
        </table>
        ${snap.signature ? `<div class="po-official-signature">Signature: <strong>${esc(snap.signature)}</strong></div>` : ''}
    </div>`;
}

function ensurePurchaseOrderPrintHost() {
    let host = document.getElementById('purchase-order-print-host');
    if (!host) {
        host = document.createElement('div');
        host.id = 'purchase-order-print-host';
        host.className = 'po-print-host';
        document.body.appendChild(host);
    }
    return host;
}

function printPurchaseOrderOfficialForm() {
    const run = () => {
        const host = ensurePurchaseOrderPrintHost();
        host.innerHTML = buildPurchaseOrderOfficialHtml();
        host.classList.add('print-target');
        document.body.classList.add('is-printing', 'printing-purchase-order');
    };
    if (typeof runOfficialPrint === 'function') {
        runOfficialPrint(run);
        return;
    }
    run();
    window.print();
}

function markRealDpPurchaseOrderRegisterRows() {
    document.querySelectorAll('#purchase-orders-table-body tr').forEach((tr) => {
        const poNo = tr.querySelector('td:nth-child(3) input')?.value?.trim();
        const isReal = poNo && typeof findRealDpPurchaseOrder === 'function' && findRealDpPurchaseOrder(poNo);
        tr.classList.toggle('po-register-row-real-dp', Boolean(isReal));
        const sig = tr.querySelector('td:nth-child(7) input')?.value || '';
        tr.classList.toggle('po-register-row-cancelled', /cancelled/i.test(sig));
        if (isReal) tr.title = 'Real IT DIR DP purchase order — click to load document';
    });
}

function initPurchaseOrderModuleDefaults() {
    if (typeof ensureRealDpPurchaseOrders === 'function') ensureRealDpPurchaseOrders();
    bindPurchaseOrderModule();
    refreshPurchaseOrderSupplierOptions();
    markRealDpPurchaseOrderRegisterRows();
    const dateEl = document.getElementById('poDate');
    if (dateEl && !dateEl.value) dateEl.value = new Date().toISOString().slice(0, 10);
    const vendorEl = document.getElementById('poVendorNo');
    if (vendorEl && !vendorEl.value.trim()) vendorEl.dataset.poAutoVendor = '1';
}

function fillPurchaseOrderDampackSample() {
    const set = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.value = value ?? '';
    };
    set('poSupplierName', 'DAMPACK ENTERPRISES (PVT) LTD');
    set('poNumber', '4204004933');
    set('poDate', '2024-05-14');
    set('poVendorNo', '704196');
    set('poDeliverTo', 'IT DIR / 04 731831');
    set('poDeliveryDate', '2024-05-21');
    set('poCurrency', 'ZiG');
    set('poGl', '2200600002');
    const tbody = document.getElementById('purchase-orders-lines-body');
    if (tbody) {
        tbody.innerHTML = '';
        tbody.appendChild(buildPurchaseOrderLineRow({
            item: '00010',
            material: '117000042',
            qty: '20',
            unit: 'each',
            desc: 'PRINTRONIX RIBBONS P8000/P7000 P/N 25504',
            price: '3794.64',
            net: '75892.80'
        }));
    }
    updatePurchaseOrderDocumentTotal();
}

document.addEventListener('DOMContentLoaded', initPurchaseOrderModuleDefaults);
