/* Additional Annex A fillable forms: Q3, Q31, Q40, Q1049, Q1229, Q1571, Q1954 */

(function registerAnnexPrintMap() {
    if (typeof QM_PRINT_MAP === 'undefined') return;
    const map = {
        'zna-q-3': 'printZnaQ3OfficialForm',
        'zna-q-31': 'printZnaQ31OfficialForm',
        'zna-q-40': 'printZnaQ40OfficialForm',
        'zna-q-1049': 'printZnaQ1049OfficialForm',
        'zna-q-1229': 'printZnaQ1229OfficialForm',
        'zna-q-1571': 'printZnaQ1571OfficialForm',
        'zna-q-1954': 'printZnaQ1954OfficialForm'
    };
    Object.keys(map).forEach((id) => {
        const fn = map[id];
        QM_PRINT_MAP[id] = () => typeof window[fn] === 'function' && window[fn]();
    });
})();

function annexVal(id) { return String(document.getElementById(id)?.value || '').trim(); }
function annexEsc(v) {
    return String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function annexDate(iso) {
    if (!iso) return '';
    const d = new Date(`${iso}T00:00:00`);
    return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-GB');
}
function annexPrint(hostId, bodyClass, html) {
    if (typeof qmBatchPrint === 'function') return qmBatchPrint(hostId, bodyClass, html);
    if (typeof qmGapPrint === 'function') return qmGapPrint(hostId, bodyClass, html);
}
function annexCollect(tbodyId, mapFn) {
    const items = [];
    document.querySelectorAll(`#${tbodyId} tr`).forEach((tr) => {
        const inputs = tr.querySelectorAll('input, select, textarea');
        const row = mapFn(inputs);
        if (Object.values(row).some(Boolean)) items.push(row);
    });
    return items;
}
function annexPad(items, n, blank) {
    const rows = [...items];
    while (rows.length < n) rows.push({ ...blank });
    return rows;
}

/* ===== Q 3 — Issue to Government department on repayment ===== */
function getZnaQ3FormSnapshot() {
    return {
        voucherNo: annexVal('q3VoucherNo'),
        date: annexDate(annexVal('q3Date')) || annexVal('q3Date'),
        fromUnit: annexVal('q3FromUnit'),
        toDept: annexVal('q3ToDept'),
        authority: annexVal('q3Authority'),
        total: annexVal('q3Total'),
        issuer: annexVal('q3Issuer'),
        receiver: annexVal('q3Receiver'),
        items: annexCollect('zna-q-3-table-body', (i) => ({
            description: String(i[0]?.value || '').trim(),
            qty: String(i[1]?.value || '').trim(),
            rate: String(i[2]?.value || '').trim(),
            amount: String(i[3]?.value || '').trim(),
            remarks: String(i[4]?.value || '').trim()
        }))
    };
}
function buildZnaQ3OfficialHtml() {
    const esc = annexEsc; const s = getZnaQ3FormSnapshot();
    const blank = { description: '', qty: '', rate: '', amount: '', remarks: '' };
    const rows = annexPad(s.items, 10, blank).map((r) =>
        `<tr><td class="left">${esc(r.description)}</td><td>${esc(r.qty)}</td><td>${esc(r.rate)}</td><td>${esc(r.amount)}</td><td class="left">${esc(r.remarks)}</td></tr>`).join('');
    return `<div class="annex-q-doc q3-official-doc">
        <div class="annex-q-code">ZNA-Q-3</div>
        <h1 class="annex-q-title">ISSUE TO A GOVERNMENT DEPARTMENT ON REPAYMENT</h1>
        <div class="annex-q-meta"><div>Voucher No: <strong>${esc(s.voucherNo)}</strong></div><div>Date: <strong>${esc(s.date)}</strong></div>
        <div>From (unit): <strong>${esc(s.fromUnit)}</strong></div><div>To (department): <strong>${esc(s.toDept)}</strong></div></div>
        <p>Authority: <strong>${esc(s.authority)}</strong></p>
        <table class="annex-q-table"><thead><tr><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th><th>Remarks</th></tr></thead><tbody>${rows}</tbody></table>
        <p>Total: <strong>${esc(s.total)}</strong></p>
        <div class="annex-q-sigs"><div>Issuing officer<br><strong>${esc(s.issuer)}</strong></div><div>Receiving department<br><strong>${esc(s.receiver)}</strong></div></div>
    </div>`;
}
function printZnaQ3OfficialForm() { annexPrint('zna-q-3-print-host', 'printing-zna-q-3', buildZnaQ3OfficialHtml()); }

/* ===== Q 31 — Cash purchase/receipt ===== */
function getZnaQ31FormSnapshot() {
    return {
        receiptNo: annexVal('q31ReceiptNo'),
        date: annexDate(annexVal('q31Date')) || annexVal('q31Date'),
        unit: annexVal('q31Unit'),
        supplier: annexVal('q31Supplier'),
        paidBy: annexVal('q31PaidBy'),
        total: annexVal('q31Total'),
        cashier: annexVal('q31Cashier'),
        receiver: annexVal('q31Receiver'),
        items: annexCollect('zna-q-31-table-body', (i) => ({
            description: String(i[0]?.value || '').trim(),
            qty: String(i[1]?.value || '').trim(),
            rate: String(i[2]?.value || '').trim(),
            amount: String(i[3]?.value || '').trim(),
            remarks: String(i[4]?.value || '').trim()
        }))
    };
}
function buildZnaQ31OfficialHtml() {
    const esc = annexEsc; const s = getZnaQ31FormSnapshot();
    const blank = { description: '', qty: '', rate: '', amount: '', remarks: '' };
    const rows = annexPad(s.items, 10, blank).map((r) =>
        `<tr><td class="left">${esc(r.description)}</td><td>${esc(r.qty)}</td><td>${esc(r.rate)}</td><td>${esc(r.amount)}</td><td class="left">${esc(r.remarks)}</td></tr>`).join('');
    return `<div class="annex-q-doc q31-official-doc">
        <div class="annex-q-code">ZNA-Q-31</div>
        <h1 class="annex-q-title">CASH PURCHASE / RECEIPT</h1>
        <div class="annex-q-meta"><div>Receipt No: <strong>${esc(s.receiptNo)}</strong></div><div>Date: <strong>${esc(s.date)}</strong></div>
        <div>Unit: <strong>${esc(s.unit)}</strong></div><div>Supplier: <strong>${esc(s.supplier)}</strong></div></div>
        <p>Paid by: <strong>${esc(s.paidBy)}</strong> · Total: <strong>${esc(s.total)}</strong></p>
        <table class="annex-q-table"><thead><tr><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th><th>Remarks</th></tr></thead><tbody>${rows}</tbody></table>
        <div class="annex-q-sigs"><div>Cashier / paying officer<br><strong>${esc(s.cashier)}</strong></div><div>Stores receiver<br><strong>${esc(s.receiver)}</strong></div></div>
    </div>`;
}
function printZnaQ31OfficialForm() { annexPrint('zna-q-31-print-host', 'printing-zna-q-31', buildZnaQ31OfficialHtml()); }

/* ===== Q 40 — Artisan tools list ===== */
function getZnaQ40FormSnapshot() {
    return {
        unit: annexVal('q40Unit'),
        trade: annexVal('q40Trade'),
        holder: annexVal('q40Holder'),
        forceNo: annexVal('q40ForceNo'),
        date: annexDate(annexVal('q40Date')) || annexVal('q40Date'),
        listNo: annexVal('q40ListNo'),
        qmSig: annexVal('q40QmSig'),
        holderSig: annexVal('q40HolderSig'),
        items: annexCollect('zna-q-40-table-body', (i) => ({
            description: String(i[0]?.value || '').trim(),
            qtyAuth: String(i[1]?.value || '').trim(),
            qtyHeld: String(i[2]?.value || '').trim(),
            condition: String(i[3]?.value || '').trim(),
            remarks: String(i[4]?.value || '').trim()
        }))
    };
}
function buildZnaQ40OfficialHtml() {
    const esc = annexEsc; const s = getZnaQ40FormSnapshot();
    const blank = { description: '', qtyAuth: '', qtyHeld: '', condition: '', remarks: '' };
    const rows = annexPad(s.items, 14, blank).map((r) =>
        `<tr><td class="left">${esc(r.description)}</td><td>${esc(r.qtyAuth)}</td><td>${esc(r.qtyHeld)}</td><td>${esc(r.condition)}</td><td class="left">${esc(r.remarks)}</td></tr>`).join('');
    return `<div class="annex-q-doc q40-official-doc">
        <div class="annex-q-code">ZNA-Q-40</div>
        <h1 class="annex-q-title">ARTISAN TOOLS LIST</h1>
        <div class="annex-q-meta"><div>Unit: <strong>${esc(s.unit)}</strong></div><div>List No: <strong>${esc(s.listNo)}</strong></div>
        <div>Trade: <strong>${esc(s.trade)}</strong></div><div>Date: <strong>${esc(s.date)}</strong></div>
        <div>Holder: <strong>${esc(s.holder)}</strong></div><div>Force No: <strong>${esc(s.forceNo)}</strong></div></div>
        <table class="annex-q-table"><thead><tr><th>Tool / item</th><th>Qty auth</th><th>Qty held</th><th>Condition</th><th>Remarks</th></tr></thead><tbody>${rows}</tbody></table>
        <div class="annex-q-sigs"><div>QM / Store Officer<br><strong>${esc(s.qmSig)}</strong></div><div>Tool holder<br><strong>${esc(s.holderSig)}</strong></div></div>
    </div>`;
}
function printZnaQ40OfficialForm() { annexPrint('zna-q-40-print-host', 'printing-zna-q-40', buildZnaQ40OfficialHtml()); }

/* ===== Q 1049 — Transfer voucher ===== */
function getZnaQ1049FormSnapshot() {
    return {
        voucherNo: annexVal('q1049VoucherNo'),
        date: annexDate(annexVal('q1049Date')) || annexVal('q1049Date'),
        fromUnit: annexVal('q1049FromUnit'),
        toUnit: annexVal('q1049ToUnit'),
        authority: annexVal('q1049Authority'),
        issuer: annexVal('q1049Issuer'),
        receiver: annexVal('q1049Receiver'),
        items: annexCollect('zna-q-1049-table-body', (i) => ({
            description: String(i[0]?.value || '').trim(),
            serialZa: String(i[1]?.value || '').trim(),
            qty: String(i[2]?.value || '').trim(),
            uom: String(i[3]?.value || '').trim(),
            remarks: String(i[4]?.value || '').trim()
        }))
    };
}
function buildZnaQ1049OfficialHtml() {
    const esc = annexEsc; const s = getZnaQ1049FormSnapshot();
    const blank = { description: '', serialZa: '', qty: '', uom: '', remarks: '' };
    const rows = annexPad(s.items, 12, blank).map((r) =>
        `<tr><td class="left">${esc(r.description)}</td><td>${esc(r.serialZa)}</td><td>${esc(r.qty)}</td><td>${esc(r.uom)}</td><td class="left">${esc(r.remarks)}</td></tr>`).join('');
    return `<div class="annex-q-doc q1049-official-doc">
        <div class="annex-q-code">ZNA-Q-1049</div>
        <h1 class="annex-q-title">TRANSFER VOUCHER</h1>
        <div class="annex-q-meta"><div>Voucher No: <strong>${esc(s.voucherNo)}</strong></div><div>Date: <strong>${esc(s.date)}</strong></div>
        <div>From: <strong>${esc(s.fromUnit)}</strong></div><div>To: <strong>${esc(s.toUnit)}</strong></div></div>
        <p>Authority for transfer: <strong>${esc(s.authority)}</strong></p>
        <table class="annex-q-table"><thead><tr><th>Description</th><th>Serial / ZA</th><th>Qty</th><th>UoM</th><th>Remarks</th></tr></thead><tbody>${rows}</tbody></table>
        <div class="annex-q-sigs"><div>Issuing unit<br><strong>${esc(s.issuer)}</strong></div><div>Receiving unit<br><strong>${esc(s.receiver)}</strong></div></div>
    </div>`;
}
function printZnaQ1049OfficialForm() { annexPrint('zna-q-1049-print-host', 'printing-zna-q-1049', buildZnaQ1049OfficialHtml()); }

/* ===== Q 1229 — Certificate of accidental breakage ===== */
function getZnaQ1229FormSnapshot() {
    return {
        certNo: annexVal('q1229CertNo'),
        date: annexDate(annexVal('q1229Date')) || annexVal('q1229Date'),
        unit: annexVal('q1229Unit'),
        place: annexVal('q1229Place'),
        circumstance: annexVal('q1229Circumstance'),
        reporter: annexVal('q1229Reporter'),
        witness: annexVal('q1229Witness'),
        coSig: annexVal('q1229CoSig'),
        items: annexCollect('zna-q-1229-table-body', (i) => ({
            description: String(i[0]?.value || '').trim(),
            serialZa: String(i[1]?.value || '').trim(),
            qty: String(i[2]?.value || '').trim(),
            estValue: String(i[3]?.value || '').trim(),
            remarks: String(i[4]?.value || '').trim()
        }))
    };
}
function buildZnaQ1229OfficialHtml() {
    const esc = annexEsc; const s = getZnaQ1229FormSnapshot();
    const blank = { description: '', serialZa: '', qty: '', estValue: '', remarks: '' };
    const rows = annexPad(s.items, 8, blank).map((r) =>
        `<tr><td class="left">${esc(r.description)}</td><td>${esc(r.serialZa)}</td><td>${esc(r.qty)}</td><td>${esc(r.estValue)}</td><td class="left">${esc(r.remarks)}</td></tr>`).join('');
    return `<div class="annex-q-doc q1229-official-doc">
        <div class="annex-q-code">ZNA-Q-1229</div>
        <h1 class="annex-q-title">CERTIFICATE OF ACCIDENTAL BREAKAGE</h1>
        <div class="annex-q-meta"><div>Certificate No: <strong>${esc(s.certNo)}</strong></div><div>Date: <strong>${esc(s.date)}</strong></div>
        <div>Unit: <strong>${esc(s.unit)}</strong></div><div>Place: <strong>${esc(s.place)}</strong></div></div>
        <p><strong>Circumstances:</strong></p>
        <div class="annex-q-narrative">${esc(s.circumstance).replace(/\n/g, '<br>') || '&nbsp;'}</div>
        <table class="annex-q-table"><thead><tr><th>Description</th><th>Serial / ZA</th><th>Qty</th><th>Est. value</th><th>Remarks</th></tr></thead><tbody>${rows}</tbody></table>
        <div class="annex-q-sigs"><div>Reporting officer<br><strong>${esc(s.reporter)}</strong></div><div>Witness<br><strong>${esc(s.witness)}</strong></div><div>CO / OC<br><strong>${esc(s.coSig)}</strong></div></div>
    </div>`;
}
function printZnaQ1229OfficialForm() { annexPrint('zna-q-1229-print-host', 'printing-zna-q-1229', buildZnaQ1229OfficialHtml()); }

/* ===== Q 1571 — Debit voucher ===== */
function getZnaQ1571FormSnapshot() {
    return {
        voucherNo: annexVal('q1571VoucherNo'),
        date: annexDate(annexVal('q1571Date')) || annexVal('q1571Date'),
        unit: annexVal('q1571Unit'),
        debtor: annexVal('q1571Debtor'),
        reason: annexVal('q1571Reason'),
        total: annexVal('q1571Total'),
        issuer: annexVal('q1571Issuer'),
        debtorSig: annexVal('q1571DebtorSig'),
        items: annexCollect('zna-q-1571-table-body', (i) => ({
            description: String(i[0]?.value || '').trim(),
            qty: String(i[1]?.value || '').trim(),
            rate: String(i[2]?.value || '').trim(),
            amount: String(i[3]?.value || '').trim(),
            remarks: String(i[4]?.value || '').trim()
        }))
    };
}
function buildZnaQ1571OfficialHtml() {
    const esc = annexEsc; const s = getZnaQ1571FormSnapshot();
    const blank = { description: '', qty: '', rate: '', amount: '', remarks: '' };
    const rows = annexPad(s.items, 8, blank).map((r) =>
        `<tr><td class="left">${esc(r.description)}</td><td>${esc(r.qty)}</td><td>${esc(r.rate)}</td><td>${esc(r.amount)}</td><td class="left">${esc(r.remarks)}</td></tr>`).join('');
    return `<div class="annex-q-doc q1571-official-doc">
        <div class="annex-q-code">ZNA-Q-1571</div>
        <h1 class="annex-q-title">DEBIT VOUCHER</h1>
        <div class="annex-q-meta"><div>Voucher No: <strong>${esc(s.voucherNo)}</strong></div><div>Date: <strong>${esc(s.date)}</strong></div>
        <div>Unit: <strong>${esc(s.unit)}</strong></div><div>Debtor: <strong>${esc(s.debtor)}</strong></div></div>
        <p>Reason: <strong>${esc(s.reason)}</strong> · Total: <strong>${esc(s.total)}</strong></p>
        <table class="annex-q-table"><thead><tr><th>Particulars</th><th>Qty</th><th>Rate</th><th>Amount</th><th>Remarks</th></tr></thead><tbody>${rows}</tbody></table>
        <div class="annex-q-sigs"><div>Issuing officer<br><strong>${esc(s.issuer)}</strong></div><div>Debtor<br><strong>${esc(s.debtorSig)}</strong></div></div>
    </div>`;
}
function printZnaQ1571OfficialForm() { annexPrint('zna-q-1571-print-host', 'printing-zna-q-1571', buildZnaQ1571OfficialHtml()); }

/* ===== Q 1954 — Recoveries from individuals ===== */
function getZnaQ1954FormSnapshot() {
    return {
        formNo: annexVal('q1954FormNo'),
        date: annexDate(annexVal('q1954Date')) || annexVal('q1954Date'),
        unit: annexVal('q1954Unit'),
        name: annexVal('q1954Name'),
        forceNo: annexVal('q1954ForceNo'),
        recoveryType: annexVal('q1954RecoveryType'),
        total: annexVal('q1954Total'),
        method: annexVal('q1954Method'),
        issuer: annexVal('q1954Issuer'),
        individual: annexVal('q1954Individual'),
        items: annexCollect('zna-q-1954-table-body', (i) => ({
            description: String(i[0]?.value || '').trim(),
            qty: String(i[1]?.value || '').trim(),
            amount: String(i[2]?.value || '').trim(),
            remarks: String(i[3]?.value || '').trim()
        }))
    };
}
function buildZnaQ1954OfficialHtml() {
    const esc = annexEsc; const s = getZnaQ1954FormSnapshot();
    const blank = { description: '', qty: '', amount: '', remarks: '' };
    const rows = annexPad(s.items, 8, blank).map((r) =>
        `<tr><td class="left">${esc(r.description)}</td><td>${esc(r.qty)}</td><td>${esc(r.amount)}</td><td class="left">${esc(r.remarks)}</td></tr>`).join('');
    return `<div class="annex-q-doc q1954-official-doc">
        <div class="annex-q-code">ZNA-Q-1954</div>
        <h1 class="annex-q-title">RECOVERIES FROM INDIVIDUALS</h1>
        <div class="annex-q-meta"><div>Form No: <strong>${esc(s.formNo)}</strong></div><div>Date: <strong>${esc(s.date)}</strong></div>
        <div>Unit: <strong>${esc(s.unit)}</strong></div><div>Name: <strong>${esc(s.name)}</strong></div>
        <div>Force No: <strong>${esc(s.forceNo)}</strong></div><div>Type: <strong>${esc(s.recoveryType)}</strong></div></div>
        <p>Recovery method: <strong>${esc(s.method)}</strong> · Total: <strong>${esc(s.total)}</strong></p>
        <table class="annex-q-table"><thead><tr><th>Particulars</th><th>Qty</th><th>Amount</th><th>Remarks</th></tr></thead><tbody>${rows}</tbody></table>
        <div class="annex-q-sigs"><div>Issuing officer<br><strong>${esc(s.issuer)}</strong></div><div>Individual<br><strong>${esc(s.individual)}</strong></div></div>
    </div>`;
}
function printZnaQ1954OfficialForm() { annexPrint('zna-q-1954-print-host', 'printing-zna-q-1954', buildZnaQ1954OfficialHtml()); }

function ensureAnnexStarterRows() {
    const specs = [
        { id: 'zna-q-3-table-body', build: 'buildZnaQ3Row', n: 4 },
        { id: 'zna-q-31-table-body', build: 'buildZnaQ31Row', n: 4 },
        { id: 'zna-q-40-table-body', build: 'buildZnaQ40Row', n: 6 },
        { id: 'zna-q-1049-table-body', build: 'buildZnaQ1049Row', n: 4 },
        { id: 'zna-q-1229-table-body', build: 'buildZnaQ1229Row', n: 3 },
        { id: 'zna-q-1571-table-body', build: 'buildZnaQ1571Row', n: 3 },
        { id: 'zna-q-1954-table-body', build: 'buildZnaQ1954Row', n: 3 }
    ];
    specs.forEach((spec) => {
        const tbody = document.getElementById(spec.id);
        if (!tbody || tbody.rows.length > 0) return;
        const fn = window[spec.build];
        for (let i = 0; i < spec.n; i += 1) {
            if (typeof fn === 'function') tbody.appendChild(fn());
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(ensureAnnexStarterRows, 110);
});
