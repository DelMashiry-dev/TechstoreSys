/* ZNA QM batch 2: Q80, SVCS/890, Q1179, Q987, Q3977, SVCS/1045, Q1157 */

const QM_PRINT_MAP = {
    'zna-q-80': () => typeof printZnaQ80OfficialForm === 'function' && printZnaQ80OfficialForm(),
    'zna-svcs-890': () => typeof printZnaSvcs890OfficialForm === 'function' && printZnaSvcs890OfficialForm(),
    'zna-q-1179': () => typeof printZnaQ1179OfficialForm === 'function' && printZnaQ1179OfficialForm(),
    'zna-q-987': () => typeof printZnaQ987OfficialForm === 'function' && printZnaQ987OfficialForm(),
    'zna-q-3977': () => typeof printZnaQ3977OfficialForm === 'function' && printZnaQ3977OfficialForm(),
    'zna-svcs-1045': () => typeof printZnaSvcs1045OfficialForm === 'function' && printZnaSvcs1045OfficialForm(),
    'zna-q-1157': () => typeof printZnaQ1157OfficialForm === 'function' && printZnaQ1157OfficialForm()
};

function qmBatchVal(id) {
    return String(document.getElementById(id)?.value || '').trim();
}

function qmBatchEsc(v) {
    return String(v ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function qmBatchDate(iso) {
    if (!iso) return '';
    const d = new Date(`${iso}T00:00:00`);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-GB');
}

function qmBatchPrint(hostId, bodyClass, html) {
    if (typeof runOfficialPrint === 'function') {
        runOfficialPrint(() => {
            const host = typeof ensurePrintHost === 'function' ? ensurePrintHost(hostId) : (() => {
                let h = document.getElementById(hostId);
                if (!h) {
                    h = document.createElement('div');
                    h.id = hostId;
                    h.className = hostId;
                    document.body.appendChild(h);
                }
                return h;
            })();
            host.innerHTML = html;
            host.classList.add('print-target');
            document.body.classList.add('is-printing', bodyClass);
        });
        return;
    }
    let host = document.getElementById(hostId);
    if (!host) {
        host = document.createElement('div');
        host.id = hostId;
        host.className = hostId;
        document.body.appendChild(host);
    }
    host.innerHTML = html;
    host.classList.add('print-target');
    document.body.classList.add('is-printing', bodyClass);
    window.print();
    setTimeout(() => {
        host.classList.remove('print-target');
        document.body.classList.remove('is-printing', bodyClass);
    }, 2000);
}

function qmPadRows(items, min, blank) {
    const rows = [...items];
    while (rows.length < min) rows.push({ ...blank });
    return rows;
}

/* ===== ZNA Q 80 Ledger Sheet ===== */

function recalculateZnaQ80Stock() {
    const tbody = document.getElementById('zna-q-80-table-body');
    if (!tbody) return;
    let bal = 0;
    tbody.querySelectorAll('tr').forEach((tr, idx) => {
        const inputs = tr.querySelectorAll('input');
        if (inputs.length < 6) return;
        const receipts = parseFloat(inputs[3].value) || 0;
        const issues = parseFloat(inputs[4].value) || 0;
        const party = String(inputs[1].value || '').trim();
        const isBf = idx === 0 && /brought\s*forward/i.test(party);
        if (isBf && !receipts && !issues) {
            bal = parseFloat(inputs[5].value) || 0;
            return;
        }
        const has = [...inputs].some((el, i) => i !== 5 && String(el.value || '').trim());
        if (has || receipts || issues) {
            bal = bal + receipts - issues;
            inputs[5].value = String(bal);
        }
    });
    const cf = document.getElementById('q80CarriedForward');
    if (cf) cf.value = String(bal || '');
}

function attachZnaQ80RowCalc(tr) {
    tr.querySelectorAll('input').forEach((input) => {
        input.addEventListener('input', recalculateZnaQ80Stock);
        input.addEventListener('change', recalculateZnaQ80Stock);
    });
}

function getZnaQ80FormSnapshot() {
    const items = [];
    document.querySelectorAll('#zna-q-80-table-body tr').forEach((tr) => {
        const inputs = tr.querySelectorAll('input');
        const row = {
            date: String(inputs[0]?.value || '').trim(),
            party: String(inputs[1]?.value || '').trim(),
            voucher: String(inputs[2]?.value || '').trim(),
            receipts: String(inputs[3]?.value || '').trim(),
            issues: String(inputs[4]?.value || '').trim(),
            balance: String(inputs[5]?.value || '').trim()
        };
        if (Object.values(row).some(Boolean)) items.push(row);
    });
    return {
        description: qmBatchVal('q80Description'),
        refNo: qmBatchVal('q80RefNo'),
        sectionNo: qmBatchVal('q80SectionNo'),
        unitStamp: qmBatchVal('q80UnitStamp'),
        establishment: qmBatchVal('q80Establishment'),
        maximum: qmBatchVal('q80Maximum'),
        minimum: qmBatchVal('q80Minimum'),
        price: qmBatchVal('q80Price'),
        partNo: qmBatchVal('q80PartNo'),
        denomination: qmBatchVal('q80Denomination'),
        carriedForward: qmBatchVal('q80CarriedForward'),
        items
    };
}

function buildZnaQ80HalfTable(items, esc) {
    const rows = qmPadRows(items, 14, {
        date: '', party: '', voucher: '', receipts: '', issues: '', balance: ''
    });
    return rows.map((r, i) => `
        <tr>
            <td class="q80-tick"></td>
            <td>${esc(r.date)}</td>
            <td class="q80-party">${i === rows.length - 1 && !r.party ? '<em>Carried forward.....</em>' : esc(r.party)}</td>
            <td>${esc(r.voucher)}</td>
            <td>${esc(r.receipts)}</td>
            <td>${esc(r.issues)}</td>
            <td>${esc(r.balance)}</td>
        </tr>
    `).join('');
}

function buildZnaQ80OfficialHtml() {
    const esc = qmBatchEsc;
    const s = getZnaQ80FormSnapshot();
    const mid = Math.ceil(Math.max(s.items.length, 1) / 2) || 7;
    const left = s.items.slice(0, Math.max(mid, 7));
    const right = s.items.slice(Math.max(mid, 7));
    if (!left.length) left.push({ date: '', party: 'Brought forward..', voucher: '', receipts: '', issues: '', balance: '' });

    const headCols = `
        <tr>
            <th></th><th>Date</th><th>Consignor or Consignee</th><th>Voucher number</th>
            <th>Receipts</th><th>Issues</th><th>Balance in Stock</th>
        </tr>`;

    return `
    <div class="q80-official-doc">
        <div class="q80-title">ZNA Q 80 LEDGER SHEET</div>
        <div class="q80-top-fields">
            <div><strong>DESCRIPTION</strong> ${esc(s.description)}</div>
            <div>
                <div><strong>Reference number</strong> ${esc(s.refNo)}</div>
                <div><strong>Section number</strong> ${esc(s.sectionNo)}</div>
            </div>
        </div>
        <div class="q80-meta">
            <div class="q80-stamp"><div>UNIT STAMPS</div><strong>${esc(s.unitStamp)}</strong></div>
            <div class="q80-meta-fields">
                <div>ESTABLISHMENT: ${esc(s.establishment)} &nbsp; Maximum ${esc(s.maximum)} &nbsp; Minimum ${esc(s.minimum)}</div>
                <div>Price of item ${esc(s.price)}</div>
                <div>Part number or specification ${esc(s.partNo)}</div>
                <div>Denomination of quantity ${esc(s.denomination)}</div>
            </div>
        </div>
        <div class="q80-dual">
            <table class="q80-official-table"><thead>${headCols}</thead><tbody>${buildZnaQ80HalfTable(left, esc)}</tbody></table>
            <table class="q80-official-table"><thead>${headCols}</thead><tbody>${buildZnaQ80HalfTable(right, esc)}</tbody></table>
        </div>
        <div class="q80-foot">
            <span>Printed by the Government Printers, Harare</span>
            <span><strong>Carried forward:</strong> ${esc(s.carriedForward)}</span>
        </div>
    </div>`;
}

function printZnaQ80OfficialForm() {
    qmBatchPrint('zna-q-80-print-host', 'printing-zna-q-80', buildZnaQ80OfficialHtml());
}

/* ===== ZNA SVCS/890 ===== */

function getZnaSvcs890FormSnapshot() {
    const items = [];
    document.querySelectorAll('#zna-svcs-890-table-body tr').forEach((tr, i) => {
        const inputs = tr.querySelectorAll('input');
        const row = {
            ser: String(i + 1),
            description: String(inputs[0]?.value || '').trim(),
            zaNo: String(inputs[1]?.value || '').trim(),
            make: String(inputs[2]?.value || '').trim(),
            qty: String(inputs[3]?.value || '').trim(),
            issued: String(inputs[4]?.value || '').trim(),
            remarks: String(inputs[5]?.value || '').trim()
        };
        if (row.description || row.zaNo || row.make || row.qty || row.issued || row.remarks) items.push(row);
    });
    return {
        date: qmBatchDate(qmBatchVal('svcs890Date')) || qmBatchVal('svcs890Date'),
        tsNo: qmBatchVal('svcs890TsNo'),
        demandNo: qmBatchVal('svcs890DemandNo'),
        jobNo: qmBatchVal('svcs890JobNo'),
        unit: qmBatchVal('svcs890Unit'),
        reqNo: qmBatchVal('svcs890ReqNo'),
        reqRank: qmBatchVal('svcs890ReqRank'),
        reqName: qmBatchVal('svcs890ReqName'),
        recNo: qmBatchVal('svcs890RecNo'),
        recRank: qmBatchVal('svcs890RecRank'),
        recName: qmBatchVal('svcs890RecName'),
        appNo: qmBatchVal('svcs890AppNo'),
        appRank: qmBatchVal('svcs890AppRank'),
        appName: qmBatchVal('svcs890AppName'),
        items
    };
}

function buildZnaSvcs890OfficialHtml() {
    const esc = qmBatchEsc;
    const s = getZnaSvcs890FormSnapshot();
    const rows = qmPadRows(s.items, 12, {
        ser: '', description: '', zaNo: '', make: '', qty: '', issued: '', remarks: ''
    }).map((r, i) => `
        <tr>
            <td>${esc(r.ser || String(i + 1))}</td>
            <td class="left">${esc(r.description)}</td>
            <td>${esc(r.zaNo)}</td>
            <td>${esc(r.make)}</td>
            <td>${esc(r.qty)}</td>
            <td>${esc(r.issued)}</td>
            <td>${esc(r.remarks)}</td>
        </tr>
    `).join('');

    return `
    <div class="svcs890-official-doc">
        <div class="svcs890-code">ZNA SVCS/890</div>
        <div class="svcs890-head">
            <div>DATE: <strong>${esc(s.date)}</strong></div>
            <div>T/S NO: <strong>${esc(s.tsNo)}</strong></div>
        </div>
        <div class="svcs890-head">
            <div>DEMAND NO: <strong>${esc(s.demandNo)}</strong></div>
            <div>JOB NO: <strong>${esc(s.jobNo)}</strong></div>
            <div>UNIT: <strong>${esc(s.unit)}</strong></div>
        </div>
        <table class="svcs890-table">
            <thead>
                <tr>
                    <th>SER</th><th>DESCRIPTION</th><th>ZA-NO</th><th>MAKE</th>
                    <th>QTY</th><th>ISSUED</th><th></th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
        <div class="svcs890-sign">
            <div>
                <div class="svcs890-sign-h"><u>REQUESTED BY</u></div>
                <div>No: ${esc(s.reqNo)}</div>
                <div>Rank: ${esc(s.reqRank)}</div>
                <div>Name: ${esc(s.reqName)}</div>
            </div>
            <div>
                <div class="svcs890-sign-h"><u>RECOMMENDED BY</u></div>
                <div>No: ${esc(s.recNo)}</div>
                <div>Rank: ${esc(s.recRank)}</div>
                <div>Name: ${esc(s.recName)}</div>
            </div>
            <div>
                <div class="svcs890-sign-h"><u>APPROVED BY</u></div>
                <div>No: ${esc(s.appNo)}</div>
                <div>Rank: ${esc(s.appRank)}</div>
                <div>Name: ${esc(s.appName)}</div>
            </div>
        </div>
    </div>`;
}

function printZnaSvcs890OfficialForm() {
    qmBatchPrint('zna-svcs-890-print-host', 'printing-zna-svcs-890', buildZnaSvcs890OfficialHtml());
}

/* ===== ZNA Q 1179 Clothing Issue Voucher ===== */

function getZnaQ1179ItemLabels() {
    const labels = [];
    for (let i = 1; i <= 12; i += 1) {
        labels.push(qmBatchVal(`q1179Item${i}`) || `Item ${i}`);
    }
    return labels;
}

function getZnaQ1179FormSnapshot() {
    const labels = getZnaQ1179ItemLabels();
    const people = [];
    document.querySelectorAll('#zna-q-1179-table-body tr').forEach((tr, i) => {
        const inputs = tr.querySelectorAll('input');
        const qtys = [];
        for (let c = 0; c < 12; c += 1) qtys.push(String(inputs[2 + c]?.value || '').trim());
        const row = {
            no: String(i + 1),
            rank: String(inputs[0]?.value || '').trim(),
            name: String(inputs[1]?.value || '').trim(),
            qtys,
            signature: String(inputs[14]?.value || '').trim()
        };
        if (row.rank || row.name || row.signature || qtys.some(Boolean)) people.push(row);
    });
    return {
        issueVoucherNo: qmBatchVal('q1179IssueVoucherNo'),
        station: qmBatchVal('q1179Station'),
        unit: qmBatchVal('q1179Unit'),
        company: qmBatchVal('q1179Company'),
        period: qmBatchVal('q1179Period'),
        monthYear: qmBatchVal('q1179MonthYear'),
        receiptVoucherNo: qmBatchVal('q1179ReceiptVoucherNo'),
        date: qmBatchDate(qmBatchVal('q1179Date')) || qmBatchVal('q1179Date'),
        folio: qmBatchVal('q1179Folio'),
        labels,
        people
    };
}

function buildZnaQ1179OfficialHtml() {
    const esc = qmBatchEsc;
    const s = getZnaQ1179FormSnapshot();
    const people = qmPadRows(s.people, 12, {
        no: '', rank: '', name: '', qtys: Array(12).fill(''), signature: ''
    });
    const labelCells = s.labels.map((l) => `<th class="q1179-item-h">${esc(l)}</th>`).join('');
    const body = people.map((p, i) => `
        <tr>
            <td>${esc(p.no || String(i + 1))}</td>
            <td>${esc(p.rank)}</td>
            <td class="left">${esc(p.name)}</td>
            ${(p.qtys || Array(12).fill('')).map((q) => `<td>${esc(q)}</td>`).join('')}
            <td>${esc(p.signature)}</td>
        </tr>
    `).join('');

    return `
    <div class="q1179-official-doc">
        <div class="q1179-banner">
            <div class="q1179-title">CLOTHING AND NECESSARIES FREE INITIAL / REPLACEMENT / REPAYMENT ISSUE VOUCHER</div>
            <div class="q1179-code">ZNAQ 1179</div>
        </div>
        <div class="q1179-meta">
            <div>Issue Voucher Number<br><strong>${esc(s.issueVoucherNo)}</strong></div>
            <div>Station<br><strong>${esc(s.station)}</strong></div>
            <div>Unit<br><strong>${esc(s.unit)}</strong></div>
            <div>Company or department<br><strong>${esc(s.company)}</strong></div>
            <div>Period<br><strong>${esc(s.period)}</strong></div>
            <div>Month and year<br><strong>${esc(s.monthYear)}</strong></div>
            <div>Receipt voucher Number<br><strong>${esc(s.receiptVoucherNo)}</strong></div>
            <div>Date<br><strong>${esc(s.date)}</strong></div>
        </div>
        <table class="q1179-table">
            <thead>
                <tr>
                    <th>No</th><th>Rank</th><th>Name</th>
                    ${labelCells}
                    <th>Signature</th>
                </tr>
            </thead>
            <tbody>${body}</tbody>
            <tfoot>
                <tr>
                    <td colspan="3" class="left"><strong>Folio Number</strong></td>
                    <td colspan="12">${esc(s.folio)}</td>
                    <td></td>
                </tr>
            </tfoot>
        </table>
    </div>`;
}

function printZnaQ1179OfficialForm() {
    qmBatchPrint('zna-q-1179-print-host', 'printing-zna-q-1179', buildZnaQ1179OfficialHtml());
}

/* ===== ZNA Q 987 Certificate of Stocktaking ===== */

function getZnaQ987FormSnapshot() {
    const items = [];
    document.querySelectorAll('#zna-q-987-table-body tr').forEach((tr) => {
        const inputs = tr.querySelectorAll('input');
        const row = {
            ledgerUse: String(inputs[0]?.value || '').trim(),
            description: String(inputs[1]?.value || '').trim(),
            vaqs: String(inputs[2]?.value || '').trim(),
            stock: String(inputs[3]?.value || '').trim(),
            binBal: String(inputs[4]?.value || '').trim(),
            ledgerBal: String(inputs[5]?.value || '').trim(),
            surplus: String(inputs[6]?.value || '').trim(),
            deficient: String(inputs[7]?.value || '').trim(),
            voucher: String(inputs[8]?.value || '').trim(),
            remarks: String(inputs[9]?.value || '').trim()
        };
        if (Object.values(row).some(Boolean)) items.push(row);
    });
    return {
        section: qmBatchVal('q987Section'),
        at: qmBatchVal('q987At'),
        year: qmBatchVal('q987Year'),
        certNo: qmBatchVal('q987CertNo'),
        sectionFoot: qmBatchVal('q987SectionFoot'),
        stockTakerSig: qmBatchVal('q987StockTakerSig'),
        storeholderSig: qmBatchVal('q987StoreholderSig'),
        items
    };
}

function buildZnaQ987OfficialHtml() {
    const esc = qmBatchEsc;
    const s = getZnaQ987FormSnapshot();
    const rows = qmPadRows(s.items, 16, {
        ledgerUse: '', description: '', vaqs: '', stock: '', binBal: '',
        ledgerBal: '', surplus: '', deficient: '', voucher: '', remarks: ''
    }).map((r) => `
        <tr>
            <td>${esc(r.ledgerUse)}</td>
            <td class="left">${esc(r.description)}</td>
            <td>${esc(r.vaqs)}</td>
            <td>${esc(r.stock)}</td>
            <td>${esc(r.binBal)}</td>
            <td>${esc(r.ledgerBal)}</td>
            <td>${esc(r.surplus)}</td>
            <td>${esc(r.deficient)}</td>
            <td>${esc(r.voucher)}</td>
            <td class="left">${esc(r.remarks)}</td>
        </tr>
    `).join('');

    return `
    <div class="q987-official-doc">
        <div class="q987-code">ZNA/Q/987</div>
        <div class="q987-head-line">
            SECTION <strong>${esc(s.section)}</strong>
            CERTIFICATE OF STOCKTAKING AT <strong>${esc(s.at)}</strong>
            No <strong>${esc(s.year) || '20'}</strong>
            No <strong>${esc(s.certNo)}</strong>
        </div>
        <table class="q987-table">
            <thead>
                <tr>
                    <th rowspan="2">For ledger or accounts use only</th>
                    <th colspan="2">Completed by officer-in-charge</th>
                    <th colspan="2">Completed by stock taker</th>
                    <th colspan="3">Completed by officer-in-charge ledgers or accounts clerk</th>
                    <th colspan="2">SECTION ${esc(s.sectionFoot)}</th>
                </tr>
                <tr>
                    <th>Description of stores</th>
                    <th>VAQS No</th>
                    <th>Stock</th>
                    <th>Bin Card Balance</th>
                    <th>Ledger/Account card balance</th>
                    <th>Surplus</th>
                    <th>Deficient</th>
                    <th>TV. CTV Or CRV No and date</th>
                    <th>Remarks</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
        <div class="q987-notes">
            <strong>NOTES</strong><br>
            Alterations will be initialed by the officer making the original entry.<br>
            *The prefix letters are as shown against 'Section' above.<br>
            ±Exclusive of stores packed or reported for issue.<br>
            Where there is no stock, the word 'Nil' will be inserted.
        </div>
        <p>I CERTIFY that the numbers and quantities shown in column 'stock' were in store on the date shown at the head of the form.</p>
        <div class="q987-sigs">
            <div>Signature of the officer conducting stocktaking<br><strong>${esc(s.stockTakerSig)}</strong></div>
            <div>Signature of storeholder<br><strong>${esc(s.storeholderSig)}</strong></div>
        </div>
    </div>`;
}

function printZnaQ987OfficialForm() {
    qmBatchPrint('zna-q-987-print-host', 'printing-zna-q-987', buildZnaQ987OfficialHtml());
}

/* ===== ZNA Q 3977 Neglect / Misuse / Damage ===== */

function getZnaQ3977FormSnapshot() {
    return {
        to: qmBatchVal('q3977To'),
        from: qmBatchVal('q3977From'),
        date: qmBatchDate(qmBatchVal('q3977Date')) || qmBatchVal('q3977Date'),
        vehicle: qmBatchVal('q3977Vehicle'),
        a: qmBatchVal('q3977A'),
        onChargeTo: qmBatchVal('q3977OnChargeTo'),
        number: qmBatchVal('q3977Number'),
        type: qmBatchVal('q3977Type'),
        unit: qmBatchVal('q3977Unit'),
        report: qmBatchVal('q3977Report'),
        labourDollars: qmBatchVal('q3977LabourD'),
        labourCents: qmBatchVal('q3977LabourC'),
        materialDollars: qmBatchVal('q3977MaterialD'),
        materialCents: qmBatchVal('q3977MaterialC'),
        extra1: qmBatchVal('q3977Extra1'),
        extra1D: qmBatchVal('q3977Extra1D'),
        extra1C: qmBatchVal('q3977Extra1C'),
        extra2: qmBatchVal('q3977Extra2'),
        extra2D: qmBatchVal('q3977Extra2D'),
        extra2C: qmBatchVal('q3977Extra2C'),
        totalD: qmBatchVal('q3977TotalD'),
        totalC: qmBatchVal('q3977TotalC'),
        sigNumber: qmBatchVal('q3977SigNumber'),
        rank: qmBatchVal('q3977Rank'),
        name: qmBatchVal('q3977Name'),
        appointment: qmBatchVal('q3977Appointment'),
        signature: qmBatchVal('q3977Signature')
    };
}

function buildZnaQ3977OfficialHtml() {
    const esc = qmBatchEsc;
    const s = getZnaQ3977FormSnapshot();
    const reportLines = (s.report || '').split(/\n/).filter(Boolean);
    while (reportLines.length < 7) reportLines.push('');

    return `
    <div class="q3977-official-doc">
        <div class="q3977-code">ZNAQ3977</div>
        <h1 class="q3977-title">VEHICLE/EQUIPMENT NEGLECT, MISUSE AND DAMAGE REPORT</h1>
        <p>TO: <strong>${esc(s.to)}</strong></p>
        <p>FROM: <strong>${esc(s.from)}</strong></p>
        <p>DATE: <strong>${esc(s.date)}</strong></p>
        <p>AN EXAMINATION OF VEHICLE/ EQUIPMENT <strong>${esc(s.vehicle)}</strong> A <strong>${esc(s.a)}</strong></p>
        <p>ON CHARGE TO <strong>${esc(s.onChargeTo)}</strong> NUMBER <strong>${esc(s.number)}</strong></p>
        <p>TYPE OF VEHICLE/EQUIPMENT <strong>${esc(s.type)}</strong> UNIT <strong>${esc(s.unit)}</strong></p>
        <p>HAS REVEALED THE FOLLOWING DEFECTS/NEGLECTS WHICH ARE NOT ATTRIBUTED TO NORMAL FAIR WEAR AND TEAR.</p>
        <h2 class="q3977-report-h">REPORT</h2>
        ${reportLines.map((line) => `<div class="q3977-dots">${esc(line) || '&nbsp;'}</div>`).join('')}
        <table class="q3977-cost">
            <thead><tr><th></th><th>$</th><th>C</th></tr></thead>
            <tbody>
                <tr><td class="left">ESTIMATED LABOUR COSTS</td><td>${esc(s.labourDollars)}</td><td>${esc(s.labourCents)}</td></tr>
                <tr><td class="left">ESTIMATED COST OF MATERIAL AND SPARES</td><td>${esc(s.materialDollars)}</td><td>${esc(s.materialCents)}</td></tr>
                <tr><td class="left">${esc(s.extra1)}</td><td>${esc(s.extra1D)}</td><td>${esc(s.extra1C)}</td></tr>
                <tr><td class="left">${esc(s.extra2)}</td><td>${esc(s.extra2D)}</td><td>${esc(s.extra2C)}</td></tr>
                <tr><td class="center"><strong>TOTAL</strong></td><td><strong>${esc(s.totalD)}</strong></td><td><strong>${esc(s.totalC)}</strong></td></tr>
            </tbody>
        </table>
        <div class="q3977-sig">
            <div>NUMBER: ${esc(s.sigNumber)}</div>
            <div>RANK: ${esc(s.rank)}</div>
            <div>NAME: ${esc(s.name)}</div>
            <div>APPOINTMENT: ${esc(s.appointment)}</div>
            <div>SIGNATURE: ${esc(s.signature)}</div>
        </div>
    </div>`;
}

function printZnaQ3977OfficialForm() {
    qmBatchPrint('zna-q-3977-print-host', 'printing-zna-q-3977', buildZnaQ3977OfficialHtml());
}

function recalcZnaQ3977Total() {
    const pairs = [
        ['q3977LabourD', 'q3977LabourC'],
        ['q3977MaterialD', 'q3977MaterialC'],
        ['q3977Extra1D', 'q3977Extra1C'],
        ['q3977Extra2D', 'q3977Extra2C']
    ];
    let cents = 0;
    pairs.forEach(([d, c]) => {
        cents += (parseInt(document.getElementById(d)?.value, 10) || 0) * 100;
        cents += parseInt(document.getElementById(c)?.value, 10) || 0;
    });
    const td = document.getElementById('q3977TotalD');
    const tc = document.getElementById('q3977TotalC');
    if (td) td.value = String(Math.floor(cents / 100));
    if (tc) tc.value = String(cents % 100).padStart(2, '0');
}

/* ===== ZNA SVCS 1045 Workshop Indent ===== */

function getZnaSvcs1045FormSnapshot() {
    const items = [];
    document.querySelectorAll('#zna-svcs-1045-table-body tr').forEach((tr) => {
        const inputs = tr.querySelectorAll('input');
        const row = {
            jobNo: String(inputs[0]?.value || '').trim(),
            designation: String(inputs[1]?.value || '').trim(),
            no: String(inputs[2]?.value || '').trim(),
            nature: String(inputs[3]?.value || '').trim()
        };
        if (Object.values(row).some(Boolean)) items.push(row);
    });
    return {
        unitNumber: qmBatchVal('svcs1045UnitNumber'),
        unit: qmBatchVal('svcs1045Unit'),
        stationDate: qmBatchVal('svcs1045StationDate'),
        commenced: qmBatchDate(qmBatchVal('svcs1045Commenced')) || qmBatchVal('svcs1045Commenced'),
        completed: qmBatchDate(qmBatchVal('svcs1045Completed')) || qmBatchVal('svcs1045Completed'),
        labour: qmBatchVal('svcs1045Labour'),
        materials: qmBatchVal('svcs1045Materials'),
        contracts: qmBatchVal('svcs1045Contracts'),
        travelling: qmBatchVal('svcs1045Travelling'),
        carriage: qmBatchVal('svcs1045Carriage'),
        total: qmBatchVal('svcs1045Total'),
        signed: qmBatchVal('svcs1045Signed'),
        ocUnit: qmBatchVal('svcs1045OcUnit'),
        approved: qmBatchVal('svcs1045Approved'),
        oc: qmBatchVal('svcs1045Oc'),
        ocWorkshops: qmBatchVal('svcs1045OcWorkshops'),
        received: qmBatchVal('svcs1045Received'),
        receivedDate: qmBatchDate(qmBatchVal('svcs1045ReceivedDate')) || qmBatchVal('svcs1045ReceivedDate'),
        items
    };
}

function buildZnaSvcs1045OfficialHtml() {
    const esc = qmBatchEsc;
    const s = getZnaSvcs1045FormSnapshot();
    const rows = qmPadRows(s.items, 6, { jobNo: '', designation: '', no: '', nature: '' });
    const body = rows.map((r) => `
        <tr>
            <td>${esc(r.jobNo)}</td>
            <td class="left">${esc(r.designation)}</td>
            <td>${esc(r.no)}</td>
            <td class="left">${esc(r.nature)}</td>
        </tr>
    `).join('');

    const sheet = `
    <div class="svcs1045-sheet">
        <div class="svcs1045-top">
            <strong>WORKSHOP INDENT</strong>
            <span>ZNASVCS1045</span>
        </div>
        <p>UNIT NUMBER: <strong>${esc(s.unitNumber)}</strong></p>
        <p>UNIT: <strong>${esc(s.unit)}</strong></p>
        <p>STATION AND DATE: <strong>${esc(s.stationDate)}</strong>
            COMMENCED* <strong>${esc(s.commenced)}</strong>
            COMPLETED* <strong>${esc(s.completed)}</strong></p>
        <div class="svcs1045-grid">
            <table class="svcs1045-table">
                <thead>
                    <tr>
                        <th>Job no*</th>
                        <th>Designation of vehicles or stores</th>
                        <th>No</th>
                        <th>Nature of service and authority</th>
                    </tr>
                </thead>
                <tbody>${body}</tbody>
            </table>
            <div class="svcs1045-costs">
                <div class="svcs1045-costs-h">Summary of costs + Repayments</div>
                <div>Labour including all costs <strong>${esc(s.labour)}</strong></div>
                <div>Materials <strong>${esc(s.materials)}</strong></div>
                <div>Contracts <strong>${esc(s.contracts)}</strong></div>
                <div>Travelling expenses <strong>${esc(s.travelling)}</strong></div>
                <div>Carriage of stores <strong>${esc(s.carriage)}</strong></div>
                <div><strong>Total cost ${esc(s.total)}</strong></div>
            </div>
        </div>
        <div class="svcs1045-foot">
            <div>
                <div>Signed: ${esc(s.signed)}</div>
                <div>OC(Unit): ${esc(s.ocUnit)}</div>
                <div>*Approved: ${esc(s.approved)}</div>
            </div>
            <div>
                <div>OC: ${esc(s.oc)}</div>
                <div>Note: To note completion of service(+ and cost)</div>
                <div>*(Signed) OC Workshops: ${esc(s.ocWorkshops)}</div>
                <div>Received: ${esc(s.received)} Date: ${esc(s.receivedDate)}</div>
            </div>
        </div>
        <div class="svcs1045-note">*For workshop use only + Delete inapplicable</div>
    </div>`;

    return `<div class="svcs1045-official-doc">${sheet}${sheet}</div>`;
}

function printZnaSvcs1045OfficialForm() {
    qmBatchPrint('zna-svcs-1045-print-host', 'printing-zna-svcs-1045', buildZnaSvcs1045OfficialHtml());
}

function recalcZnaSvcs1045Total() {
    const ids = ['svcs1045Labour', 'svcs1045Materials', 'svcs1045Contracts', 'svcs1045Travelling', 'svcs1045Carriage'];
    let total = 0;
    ids.forEach((id) => {
        total += parseFloat(String(document.getElementById(id)?.value || '').replace(/[^0-9.-]/g, '')) || 0;
    });
    const el = document.getElementById('svcs1045Total');
    if (el) el.value = total ? String(total) : '';
}

/* ===== ZNA Q 1157 Clothing and Equipment Record ===== */

const Q1157_ITEMS = [
    'Badges Cap', 'Badges Collar', 'Beret', 'Boots Patrol', 'Brush Hair', 'Brush Shaving',
    'Buttons Set', 'Cap Combat', 'Coat Rain', 'Disc Identity', 'Gloves', 'Holdall',
    'Jacket Combat', 'Jersey', 'Shirt Camouflage', 'Shoes PT', 'Socks', 'Towel Bath',
    'Tie Green', 'Titles Shoulder'
];

function getZnaQ1157FormSnapshot() {
    const issues = [];
    document.querySelectorAll('#zna-q-1157-table-body tr').forEach((tr) => {
        const date = String(tr.querySelector('.q1157-date')?.value || '').trim();
        const item = String(tr.querySelector('.q1157-item')?.value || '').trim();
        const qty = String(tr.querySelector('.q1157-qty')?.value || '').trim();
        const sig = String(tr.querySelector('.q1157-sig')?.value || '').trim();
        const counter = String(tr.querySelector('.q1157-counter')?.value || '').trim();
        if (date || item || qty || sig || counter) issues.push({ date, item, qty, sig, counter });
    });
    return {
        armsNo: qmBatchVal('q1157ArmsNo'),
        armyNo: qmBatchVal('q1157ArmyNo'),
        initials: qmBatchVal('q1157Initials'),
        surname: qmBatchVal('q1157Surname'),
        unitStamp: qmBatchVal('q1157UnitStamp'),
        issues
    };
}

function buildZnaQ1157OfficialHtml() {
    const esc = qmBatchEsc;
    const s = getZnaQ1157FormSnapshot();
    const rows = qmPadRows(s.issues, 14, { date: '', item: '', qty: '', sig: '', counter: '' }).map((r) => `
        <tr>
            <td>${esc(r.date)}</td>
            <td class="left">${esc(r.item)}</td>
            <td>${esc(r.qty)}</td>
            <td>${esc(r.sig)}</td>
            <td>${esc(r.counter)}</td>
        </tr>
    `).join('');

    return `
    <div class="q1157-official-doc">
        <div class="q1157-banner">
            <strong>ZNA/Q/1157</strong>
            <strong>CLOTHING AND EQUIPMENT RECORD</strong>
            <span>ARMS No ${esc(s.armsNo)}</span>
            <span>ARMY No ${esc(s.armyNo)}</span>
            <span>Initials ${esc(s.initials)}</span>
            <span>Surname ${esc(s.surname)}</span>
        </div>
        <div class="q1157-instr">
            <strong>INSTRUCTIONS</strong>
            <ol>
                <li>This form records clothing/equipment for which the soldier is responsible. Entries in ink. Unused spaces ruled through. Items marked * must be fully described.</li>
                <li>Exchange/replacement and withdrawals use ZNAQ 1054. Withdrawn quantities shown in brackets e.g. (2), signed by CQMS and soldier.</li>
            </ol>
        </div>
        <table class="q1157-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Clothing / Equipment Item</th>
                    <th>Qty</th>
                    <th>Signature</th>
                    <th>Unit Counter Signature</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
        <div class="q1157-stamp">UNIT STAMP AND DATE: <strong>${esc(s.unitStamp)}</strong></div>
    </div>`;
}

function printZnaQ1157OfficialForm() {
    qmBatchPrint('zna-q-1157-print-host', 'printing-zna-q-1157', buildZnaQ1157OfficialHtml());
}

function ensureQmBatch2StarterRows() {
    const specs = [
        { id: 'zna-q-80-table-body', build: () => typeof buildZnaQ80Row === 'function' && buildZnaQ80Row(), n: 6 },
        { id: 'zna-svcs-890-table-body', build: () => typeof buildZnaSvcs890Row === 'function' && buildZnaSvcs890Row(), n: 5 },
        { id: 'zna-q-1179-table-body', build: () => typeof buildZnaQ1179Row === 'function' && buildZnaQ1179Row(), n: 5 },
        { id: 'zna-q-987-table-body', build: () => typeof buildZnaQ987Row === 'function' && buildZnaQ987Row(), n: 5 },
        { id: 'zna-svcs-1045-table-body', build: () => typeof buildZnaSvcs1045Row === 'function' && buildZnaSvcs1045Row(), n: 4 },
        { id: 'zna-q-1157-table-body', build: () => typeof buildZnaQ1157Row === 'function' && buildZnaQ1157Row(), n: 5 }
    ];
    specs.forEach((spec) => {
        const tbody = document.getElementById(spec.id);
        if (!tbody || tbody.rows.length > 0) return;
        for (let i = 0; i < spec.n; i += 1) {
            const tr = typeof spec.build === 'function' ? spec.build() : null;
            if (tr) tbody.appendChild(tr);
        }
    });
    const firstParty = document.querySelector('#zna-q-80-table-body tr td:nth-child(2) input');
    if (firstParty && !firstParty.value) firstParty.value = 'Brought forward..';
    if (typeof recalculateZnaQ80Stock === 'function') recalculateZnaQ80Stock();
}

function initZnaQ1179LabelsUi() {
    const wrap = document.getElementById('q1179ItemLabels');
    const thead = document.getElementById('q1179TheadRow');
    if (!wrap || wrap.childElementCount) return;
    for (let i = 1; i <= 12; i += 1) {
        const col = document.createElement('div');
        col.className = 'form-col';
        col.innerHTML = `<label class="form-label">Item ${i}</label><input type="text" id="q1179Item${i}" class="form-control" placeholder="Item ${i}">`;
        wrap.appendChild(col);
    }
    if (thead && !thead.childElementCount) {
        thead.innerHTML = '<th>Rank</th><th>Name</th>'
            + Array.from({ length: 12 }, (_, i) => `<th>I${i + 1}</th>`).join('')
            + '<th>Signature</th><th class="qm-screen-only">Action</th>';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        initZnaQ1179LabelsUi();
        ensureQmBatch2StarterRows();
    }, 80);
    ['q3977LabourD', 'q3977LabourC', 'q3977MaterialD', 'q3977MaterialC', 'q3977Extra1D', 'q3977Extra1C', 'q3977Extra2D', 'q3977Extra2C']
        .forEach((id) => document.getElementById(id)?.addEventListener('input', recalcZnaQ3977Total));
    ['svcs1045Labour', 'svcs1045Materials', 'svcs1045Contracts', 'svcs1045Travelling', 'svcs1045Carriage']
        .forEach((id) => document.getElementById(id)?.addEventListener('input', recalcZnaSvcs1045Total));
});
