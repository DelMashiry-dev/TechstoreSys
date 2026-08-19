/* ZNA Q 178 / 1033 / 1043 — official print & helpers */

function qmEsc(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function qmVal(id) {
    return String(document.getElementById(id)?.value || '').trim();
}

function qmFmtDate(iso) {
    if (!iso) return '';
    const d = new Date(`${iso}T00:00:00`);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-GB');
}

function qmEnsurePrintHost(id, className) {
    let host = document.getElementById(id);
    if (!host) {
        host = document.createElement('div');
        host.id = id;
        host.className = className;
        document.body.appendChild(host);
    }
    return host;
}

function qmPrintOfficial(hostId, hostClass, bodyClass, html) {
    if (typeof runOfficialPrint === 'function') {
        runOfficialPrint(() => {
            const host = qmEnsurePrintHost(hostId, hostClass);
            host.innerHTML = html;
            host.classList.add('print-target');
            document.body.classList.add('is-printing', bodyClass);
        });
        return;
    }
    const host = qmEnsurePrintHost(hostId, hostClass);
    host.innerHTML = html;
    host.classList.add('print-target');
    document.body.classList.add('is-printing', bodyClass);
    window.print();
}

/* ---------- ZNA Q 178 Sub Ledger ---------- */

function recalculateZnaQ178Stock() {
    const tbody = document.getElementById('zna-q-178-table-body');
    if (!tbody) return;
    let balance = 0;
    tbody.querySelectorAll('tr').forEach((tr) => {
        const inputs = tr.querySelectorAll('input');
        if (inputs.length < 5) return;
        const receipts = parseFloat(inputs[2].value) || 0;
        const issues = parseFloat(inputs[3].value) || 0;
        const hasMovement = String(inputs[0].value || '').trim()
            || String(inputs[1].value || '').trim()
            || String(inputs[2].value || '').trim()
            || String(inputs[3].value || '').trim()
            || String(inputs[4].value || '').trim()
            || String(inputs[5]?.value || '').trim();
        if (hasMovement || receipts || issues) {
            balance = balance + receipts - issues;
            inputs[4].value = String(balance);
        } else if (!String(inputs[4].value || '').trim()) {
            inputs[4].value = '';
        }
    });
    const lastStock = [...tbody.querySelectorAll('tr')].reverse().find((tr) => {
        const stock = tr.querySelectorAll('input')[4]?.value;
        return String(stock || '').trim() !== '';
    });
    const cf = document.getElementById('q178CarriedForward');
    if (cf) cf.value = lastStock ? (lastStock.querySelectorAll('input')[4]?.value || '') : '';
}

function attachZnaQ178RowCalc(tr) {
    tr.querySelectorAll('input').forEach((input) => {
        input.addEventListener('input', recalculateZnaQ178Stock);
        input.addEventListener('change', recalculateZnaQ178Stock);
    });
}

function getZnaQ178FormSnapshot() {
    const items = [];
    document.querySelectorAll('#zna-q-178-table-body tr').forEach((tr) => {
        const inputs = tr.querySelectorAll('input');
        const row = {
            date: String(inputs[0]?.value || '').trim(),
            party: String(inputs[1]?.value || '').trim(),
            receipts: String(inputs[2]?.value || '').trim(),
            issues: String(inputs[3]?.value || '').trim(),
            stock: String(inputs[4]?.value || '').trim(),
            voucher: String(inputs[5]?.value || '').trim()
        };
        if (Object.values(row).some(Boolean)) items.push(row);
    });
    return {
        description: qmVal('q178Description'),
        vocabNo: qmVal('q178VocabNo'),
        folioNo: qmVal('q178FolioNo'),
        establishment: qmVal('q178Establishment'),
        entitlement: qmVal('q178Entitlement'),
        regNo: qmVal('q178RegNo'),
        openerName: qmVal('q178OpenerName'),
        signature: qmVal('q178Signature'),
        unitStamp: qmVal('q178UnitStamp'),
        carriedForward: qmVal('q178CarriedForward'),
        items
    };
}

function buildZnaQ178SheetHtml(s, esc) {
    const rows = [...s.items];
    while (rows.length < 18) {
        rows.push({ date: '', party: '', receipts: '', issues: '', stock: '', voucher: '' });
    }
    const body = rows.map((r) => `
        <tr>
            <td>${esc(r.date)}</td>
            <td class="q178-party">${esc(r.party)}</td>
            <td>${esc(r.receipts)}</td>
            <td>${esc(r.issues)}</td>
            <td>${esc(r.stock)}</td>
            <td class="q178-voucher">${esc(r.voucher)}</td>
        </tr>
    `).join('');

    return `
    <div class="q178-sheet">
        <div class="q178-sheet-top">
            <div class="q178-code-title"><u><strong>ZNAQ 178</strong></u> &nbsp; SUB LEDGER SHEET</div>
            <div class="q178-desc-block">
                <div><strong>DESCRIPTION:</strong> ${esc(s.description)}</div>
                <div><strong>VOCABULARY NUMBER:</strong> ${esc(s.vocabNo)}</div>
            </div>
        </div>
        <div class="q178-admin">
            <div class="q178-stamp-box">
                <div class="q178-stamp-label">UNIT STAMP</div>
                <div class="q178-stamp-value">${esc(s.unitStamp)}</div>
            </div>
            <table class="q178-admin-table">
                <tr><th>ESTABLISHMENT</th><td>${esc(s.establishment)}</td></tr>
                <tr><th>ENTITLEMENT</th><td>${esc(s.entitlement)}</td></tr>
                <tr><th>REGIMENTAL NUMBER OF PERSON OPENING ACCOUNT:</th><td>${esc(s.regNo)}</td></tr>
                <tr><th>NAME OF PERSON OPENING ACCOUNT:</th><td>${esc(s.openerName)}</td></tr>
                <tr><th>SIGNATURE</th><td>${esc(s.signature)}</td></tr>
            </table>
        </div>
        <table class="q178-official-table">
            <thead>
                <tr>
                    <th>DATE</th>
                    <th>CONSIGNOR OR CONSIGNEE TO/FROM</th>
                    <th>RECEIPTS</th>
                    <th>ISSUES</th>
                    <th>STOCK</th>
                    <th>VOUCHER NUMBER OR QM SIGNATURE NUMBER AND NAME</th>
                </tr>
            </thead>
            <tbody>${body}</tbody>
        </table>
        <div class="q178-sheet-foot">
            <div>Carried forward &nbsp; <strong>${esc(s.carriedForward)}</strong></div>
            <div class="q178-folio"><strong>FOLIO NUMBER</strong> &nbsp; ${esc(s.folioNo)}</div>
        </div>
    </div>`;
}

function buildZnaQ178OfficialHtml() {
    const esc = qmEsc;
    const s = getZnaQ178FormSnapshot();
    return `
    <div class="q178-official-doc">
        ${buildZnaQ178SheetHtml(s, esc)}
        ${buildZnaQ178SheetHtml(s, esc)}
    </div>`;
}

function printZnaQ178OfficialForm() {
    qmPrintOfficial('zna-q-178-print-host', 'zna-q-178-print-host', 'printing-zna-q-178', buildZnaQ178OfficialHtml());
}

/* ---------- ZNA Q 1033 Issue & Receipt Voucher ---------- */

function getZnaQ1033FormSnapshot() {
    const items = [];
    document.querySelectorAll('#zna-q-1033-table-body tr').forEach((tr) => {
        const inputs = tr.querySelectorAll('input');
        const row = {
            vaos: String(inputs[0]?.value || '').trim(),
            designation: String(inputs[1]?.value || '').trim(),
            qty: String(inputs[2]?.value || '').trim(),
            marks: String(inputs[3]?.value || '').trim(),
            balance: String(inputs[4]?.value || '').trim(),
            location: String(inputs[5]?.value || '').trim(),
            rate: String(inputs[6]?.value || '').trim(),
            h1: String(inputs[7]?.value || '').trim(),
            h2: String(inputs[8]?.value || '').trim(),
            h3: String(inputs[9]?.value || '').trim(),
            h4: String(inputs[10]?.value || '').trim()
        };
        if (Object.values(row).some(Boolean)) items.push(row);
    });
    return {
        officeStamp: qmVal('q1033OfficeStamp'),
        consignor: qmVal('q1033Consignor'),
        consignee: qmVal('q1033Consignee'),
        signature: qmVal('q1033Signature'),
        issueVoucherNo: qmVal('q1033IssueVoucherNo'),
        issueDate: qmFmtDate(qmVal('q1033IssueDate')) || qmVal('q1033IssueDate'),
        issueAccount: qmVal('q1033IssueAccount'),
        issuedBy: qmVal('q1033IssuedBy'),
        authority: qmVal('q1033Authority'),
        sheetNo: qmVal('q1033SheetNo'),
        numSheets: qmVal('q1033NumSheets'),
        invoice: qmVal('q1033Invoice'),
        receiptVoucherNo: qmVal('q1033ReceiptVoucherNo'),
        receiptDate: qmFmtDate(qmVal('q1033ReceiptDate')) || qmVal('q1033ReceiptDate'),
        receiptAccount: qmVal('q1033ReceiptAccount'),
        issuedTo: qmVal('q1033IssuedTo'),
        conveyance: qmVal('q1033Conveyance'),
        items
    };
}

function buildZnaQ1033OfficialHtml() {
    const esc = qmEsc;
    const s = getZnaQ1033FormSnapshot();
    const rows = [...s.items];
    while (rows.length < 16) {
        rows.push({
            vaos: '', designation: '', qty: '', marks: '', balance: '', location: '',
            rate: '', h1: '', h2: '', h3: '', h4: ''
        });
    }
    const body = rows.map((r) => `
        <tr>
            <td>${esc(r.vaos)}</td>
            <td class="q1033-desig">${esc(r.designation)}</td>
            <td>${esc(r.qty)}</td>
            <td>${esc(r.marks)}</td>
            <td>${esc(r.balance)}</td>
            <td>${esc(r.location)}</td>
            <td>${esc(r.rate)}</td>
            <td>${esc(r.h1)}</td>
            <td>${esc(r.h2)}</td>
            <td>${esc(r.h3)}</td>
            <td>${esc(r.h4)}</td>
        </tr>
    `).join('');

    return `
    <div class="q1033-official-doc">
        <div class="q1033-header">
            <div class="q1033-left">
                <div class="q1033-title">ISSUE &amp; RECEIPT VOUCHER</div>
                <div class="q1033-note"><em>Voucher must accompany stores, if practicable</em></div>
                <div class="q1033-field">*Office stamp<br><strong>${esc(s.officeStamp)}</strong></div>
                <div class="q1033-field">*Consignor (original &amp; triplicate)<br><strong>${esc(s.consignor)}</strong></div>
                <div class="q1033-field">Consignee (duplicate)<br><strong>${esc(s.consignee)}</strong></div>
                <div class="q1033-field">Signature<br><strong>${esc(s.signature)}</strong></div>
            </div>
            <div class="q1033-right">
                <div class="q1033-ir-grid">
                    <div class="q1033-ir-col">
                        <div class="q1033-box"><div class="q1033-lab">ISSUE voucher number &amp; date</div><div>${esc(s.issueVoucherNo)} ${esc(s.issueDate)}</div></div>
                        <div class="q1033-box"><div class="q1033-lab">Account:</div><div>${esc(s.issueAccount)}</div></div>
                        <div class="q1033-box"><div class="q1033-lab">Issued BY:</div><div>${esc(s.issuedBy)}</div></div>
                        <div class="q1033-box"><div class="q1033-lab">Authority for issue</div><div>${esc(s.authority)}</div></div>
                        <div class="q1033-mini">
                            <div><div class="q1033-lab">Sheet Number</div>${esc(s.sheetNo)}</div>
                            <div><div class="q1033-lab">Number of sheets</div>${esc(s.numSheets)}</div>
                        </div>
                    </div>
                    <div class="q1033-ir-col">
                        <div class="q1033-box"><div class="q1033-lab">RECEIPT voucher number &amp; date</div><div>${esc(s.receiptVoucherNo)} ${esc(s.receiptDate)}</div></div>
                        <div class="q1033-box"><div class="q1033-lab">Account:</div><div>${esc(s.receiptAccount)}</div></div>
                        <div class="q1033-box"><div class="q1033-lab">Issued TO:</div><div>${esc(s.issuedTo)}</div></div>
                        <div class="q1033-box"><div class="q1033-lab">Date &amp; mode of conveyance</div><div>${esc(s.conveyance)}</div></div>
                        <div class="q1033-box"><div class="q1033-lab">Invoice number and date</div><div>${esc(s.invoice)}</div></div>
                    </div>
                </div>
            </div>
        </div>
        <table class="q1033-official-table">
            <thead>
                <tr>
                    <th>a<br>VAOS or Section or subsection<br>Part number</th>
                    <th>b<br>DESIGNATION</th>
                    <th>c<br>Qty</th>
                    <th>d<br>Description &amp; marks on packages<br>Line</th>
                    <th colspan="7" class="q1033-depot">For Store Depot use only</th>
                </tr>
                <tr>
                    <th></th><th></th><th></th><th></th>
                    <th>e<br>Balance Posting</th>
                    <th>f<br>Location</th>
                    <th>g<br>Rate</th>
                    <th>h</th><th>h</th><th>h</th><th>h</th>
                </tr>
            </thead>
            <tbody>${body}</tbody>
        </table>
        <div class="q1033-form-code">ZNA Q 1033</div>
    </div>`;
}

function printZnaQ1033OfficialForm() {
    qmPrintOfficial('zna-q-1033-print-host', 'zna-q-1033-print-host', 'printing-zna-q-1033', buildZnaQ1033OfficialHtml());
}

/* ---------- ZNA Q 1043 Condemnation Certificate ---------- */

function getZnaQ1043FormSnapshot() {
    const items = [];
    document.querySelectorAll('#zna-q-1043-table-body tr').forEach((tr) => {
        const designation = String(tr.querySelector('.q1043-desig')?.value || '').trim();
        const qty = String(tr.querySelector('.q1043-qty')?.value || '').trim();
        const cond = tr.querySelector('.q1043-cond:checked')?.value || '';
        if (designation || qty || cond) {
            items.push({ designation, qty, blr: cond === 'BLR', ber: cond === 'BER' });
        }
    });
    return {
        jobNo: qmVal('q1043JobNo'),
        serialNo: qmVal('q1043SerialNo'),
        dated: qmFmtDate(qmVal('q1043Dated')) || qmVal('q1043Dated'),
        toOc: qmVal('q1043ToOc'),
        toUnit: qmVal('q1043ToUnit'),
        indentRef: qmVal('q1043IndentRef'),
        forwardTo: qmVal('q1043ForwardTo'),
        sentenceDate: qmFmtDate(qmVal('q1043SentenceDate')) || qmVal('q1043SentenceDate'),
        officerName: qmVal('q1043OfficerName'),
        rank: qmVal('q1043Rank'),
        appointment: qmVal('q1043Appointment'),
        unitHq: qmVal('q1043UnitHq'),
        items
    };
}

function buildZnaQ1043OfficialHtml() {
    const esc = qmEsc;
    const s = getZnaQ1043FormSnapshot();
    const rows = [...s.items];
    while (rows.length < 10) rows.push({ designation: '', qty: '', blr: false, ber: false });
    const body = rows.map((r) => `
        <tr>
            <td class="q1043-desig-cell">${esc(r.designation)}</td>
            <td>${esc(r.qty)}</td>
            <td class="q1043-mark">${r.blr ? '✓' : ''}</td>
            <td class="q1043-mark">${r.ber ? '✓' : ''}</td>
        </tr>
    `).join('');

    return `
    <div class="q1043-official-doc">
        <div class="q1043-code">ZNAQ1043</div>
        <h1 class="q1043-title">REPORT ON EQUIPMENT AND CONDEMNATION CERTIFICATE</h1>
        <p class="q1043-line">Workshop job number <span class="q1043-dots">${esc(s.jobNo) || '................................'}</span>
            Serial number <span class="q1043-dots">${esc(s.serialNo) || '................................'}</span></p>
        <p class="q1043-line">To Officer Commanding <span class="q1043-dots q1043-long">${esc(s.toOc) || '........................................................'}</span></p>
        <p class="q1043-line"><span class="q1043-dots q1043-long">${esc(s.toUnit) || '................................................................................................'}</span></p>
        <p class="q1043-line">Reference your workshop repair indent (ZNA SVCS 1045) number
            <span class="q1043-dots">${esc(s.indentRef) || '................................................'}</span></p>
        <p class="q1043-line">Dated <span class="q1043-dots">${esc(s.dated) || '................................................'}</span>
            The equipment detailed below has been sentenced as shown (due to fair wear and tear, except as otherwise stated) and, except in the case of A, B and C vehicles you should;</p>
        <ol class="q1043-instructions">
            <li>Forward to ZNA Q 982/1033 for the equipment to
                <span class="q1043-dots q1043-long">${esc(s.forwardTo) || '........................................................................'}</span>
                quoting this report as your authority.</li>
            <li>If stores are required in replacement, this certificate should be attached to your indent.</li>
        </ol>
        <table class="q1043-official-table">
            <thead>
                <tr>
                    <th rowspan="2">Designation (including part number; registered number, etc where applicable)</th>
                    <th rowspan="2">Quantity</th>
                    <th colspan="2">Condition</th>
                </tr>
                <tr>
                    <th>BLR</th>
                    <th>BER</th>
                </tr>
            </thead>
            <tbody>${body}</tbody>
        </table>
        <div class="q1043-signoff">
            <p><span class="q1043-dots">${esc(s.sentenceDate) || '....../....../20.......'}</span>
                <span class="q1043-dots q1043-long">${esc(s.officerName) || '........................................................'}</span>
                <strong>Sentencing officer</strong></p>
            <p>Rank <span class="q1043-dots">${esc(s.rank) || '...............................'}</span>
                Appointment <span class="q1043-dots q1043-long">${esc(s.appointment) || '........................................................................................'}</span></p>
            <p>Unit or Headquarters <span class="q1043-dots q1043-long">${esc(s.unitHq) || '..................................................................................................................'}</span></p>
        </div>
    </div>`;
}

function printZnaQ1043OfficialForm() {
    qmPrintOfficial('zna-q-1043-print-host', 'zna-q-1043-print-host', 'printing-zna-q-1043', buildZnaQ1043OfficialHtml());
}

function ensureQmFormStarterRows() {
    const specs = [
        { id: 'zna-q-178-table-body', build: () => typeof buildZnaQ178Row === 'function' && buildZnaQ178Row(), n: 5 },
        { id: 'zna-q-1033-table-body', build: () => typeof buildZnaQ1033Row === 'function' && buildZnaQ1033Row(), n: 5 },
        { id: 'zna-q-1043-table-body', build: () => typeof buildZnaQ1043Row === 'function' && buildZnaQ1043Row(), n: 5 }
    ];
    specs.forEach((spec) => {
        const tbody = document.getElementById(spec.id);
        if (!tbody || tbody.rows.length > 0) return;
        for (let i = 0; i < spec.n; i += 1) {
            const tr = typeof spec.build === 'function' ? spec.build() : null;
            if (tr) tbody.appendChild(tr);
        }
    });
    if (typeof recalculateZnaQ178Stock === 'function') recalculateZnaQ178Stock();
}

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(ensureQmFormStarterRows, 50);
});
