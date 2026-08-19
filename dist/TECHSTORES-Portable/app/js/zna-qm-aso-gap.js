/* ZNA QM ASO gap forms: Q 985, Q 1, Q 998, Q 1680 (ASO Pt 1 Ch 6, 7, 27) */

(function registerAsoGapPrintMap() {
    if (typeof QM_PRINT_MAP === 'undefined') return;
    QM_PRINT_MAP['zna-q-985'] = () => typeof printZnaQ985OfficialForm === 'function' && printZnaQ985OfficialForm();
    QM_PRINT_MAP['zna-q-1'] = () => typeof printZnaQ1OfficialForm === 'function' && printZnaQ1OfficialForm();
    QM_PRINT_MAP['zna-q-998'] = () => typeof printZnaQ998OfficialForm === 'function' && printZnaQ998OfficialForm();
    QM_PRINT_MAP['zna-q-1680'] = () => typeof printZnaQ1680OfficialForm === 'function' && printZnaQ1680OfficialForm();
})();

function qmGapVal(id) {
    return String(document.getElementById(id)?.value || '').trim();
}

function qmGapEsc(v) {
    return String(v ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function qmGapDate(iso) {
    if (!iso) return '';
    const d = new Date(`${iso}T00:00:00`);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-GB');
}

function qmGapPrint(hostId, bodyClass, html) {
    if (typeof qmBatchPrint === 'function') {
        qmBatchPrint(hostId, bodyClass, html);
        return;
    }
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
}

function qmGapPadRows(items, min, blank) {
    const rows = [...items];
    while (rows.length < min) rows.push({ ...blank });
    return rows;
}

function qmGapCollectTable(tbodyId, mapFn) {
    const items = [];
    document.querySelectorAll(`#${tbodyId} tr`).forEach((tr) => {
        const inputs = tr.querySelectorAll('input, select, textarea');
        const row = mapFn(inputs);
        if (Object.values(row).some(Boolean)) items.push(row);
    });
    return items;
}

/* ===== ZNA Q 985 Discrepancy Report (ASO Pt 1 Ch 7) ===== */

function getZnaQ985FormSnapshot() {
    return {
        unit: qmGapVal('q985Unit'),
        station: qmGapVal('q985Station'),
        date: qmGapDate(qmGapVal('q985Date')) || qmGapVal('q985Date'),
        reportNo: qmGapVal('q985ReportNo'),
        consignor: qmGapVal('q985Consignor'),
        consignee: qmGapVal('q985Consignee'),
        voucherNo: qmGapVal('q985VoucherNo'),
        voucherDate: qmGapDate(qmGapVal('q985VoucherDate')) || qmGapVal('q985VoucherDate'),
        voucherType: qmGapVal('q985VoucherType'),
        narrative: qmGapVal('q985Narrative'),
        consigneeSig: qmGapVal('q985ConsigneeSig'),
        consignorSig: qmGapVal('q985ConsignorSig'),
        coSig: qmGapVal('q985CoSig'),
        items: qmGapCollectTable('zna-q-985-table-body', (inputs) => ({
            description: String(inputs[0]?.value || '').trim(),
            voucherQty: String(inputs[1]?.value || '').trim(),
            receivedQty: String(inputs[2]?.value || '').trim(),
            surplus: String(inputs[3]?.value || '').trim(),
            deficit: String(inputs[4]?.value || '').trim(),
            remarks: String(inputs[5]?.value || '').trim()
        }))
    };
}

function buildZnaQ985OfficialHtml() {
    const esc = qmGapEsc;
    const s = getZnaQ985FormSnapshot();
    const blank = { description: '', voucherQty: '', receivedQty: '', surplus: '', deficit: '', remarks: '' };
    const rows = qmGapPadRows(s.items, 10, blank).map((r) => `
        <tr>
            <td class="left">${esc(r.description)}</td>
            <td>${esc(r.voucherQty)}</td>
            <td>${esc(r.receivedQty)}</td>
            <td>${esc(r.surplus)}</td>
            <td>${esc(r.deficit)}</td>
            <td class="left">${esc(r.remarks)}</td>
        </tr>
    `).join('');

    return `
    <div class="q985-official-doc">
        <div class="q985-code">ZNA/Q/985</div>
        <h1 class="q985-title">DISCREPANCY REPORT</h1>
        <p class="q985-sub">Accounting Standing Orders — Part 1 Chapter 7</p>
        <div class="q985-meta">
            <div>Unit / Establishment: <strong>${esc(s.unit)}</strong></div>
            <div>Station: <strong>${esc(s.station)}</strong></div>
            <div>Date: <strong>${esc(s.date)}</strong></div>
            <div>Report No: <strong>${esc(s.reportNo)}</strong></div>
        </div>
        <div class="q985-meta">
            <div>Consignor: <strong>${esc(s.consignor)}</strong></div>
            <div>Consignee: <strong>${esc(s.consignee)}</strong></div>
            <div>Related voucher: <strong>${esc(s.voucherType)} ${esc(s.voucherNo)}</strong></div>
            <div>Voucher date: <strong>${esc(s.voucherDate)}</strong></div>
        </div>
        <p><em>Do not amend the consignee's or consignor's voucher copies. Raise this report when quantity or description received differs from that charged.</em></p>
        <table class="q985-table">
            <thead>
                <tr>
                    <th>Description of stores</th>
                    <th>Voucher qty</th>
                    <th>Received qty</th>
                    <th>Surplus</th>
                    <th>Deficit</th>
                    <th>Remarks</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
        <p><strong>Particulars of discrepancy:</strong></p>
        <div class="q985-narrative">${esc(s.narrative).replace(/\n/g, '<br>') || '&nbsp;'}</div>
        <div class="q985-sigs">
            <div>Consignee<br><strong>${esc(s.consigneeSig)}</strong></div>
            <div>Consignor acknowledgement<br><strong>${esc(s.consignorSig)}</strong></div>
            <div>Commanding Officer / OC<br><strong>${esc(s.coSig)}</strong></div>
        </div>
    </div>`;
}

function printZnaQ985OfficialForm() {
    qmGapPrint('zna-q-985-print-host', 'printing-zna-q-985', buildZnaQ985OfficialHtml());
}

/* ===== ZNA Q 1 Write-off Schedule (ASO Pt 1 Ch 6) ===== */

function getZnaQ1FormSnapshot() {
    return {
        unit: qmGapVal('q1Unit'),
        scheduleNo: qmGapVal('q1ScheduleNo'),
        period: qmGapVal('q1Period'),
        date: qmGapDate(qmGapVal('q1Date')) || qmGapVal('q1Date'),
        authority: qmGapVal('q1Authority'),
        reason: qmGapVal('q1Reason'),
        coSig: qmGapVal('q1CoSig'),
        qmSig: qmGapVal('q1QmSig'),
        items: qmGapCollectTable('zna-q-1-table-body', (inputs) => ({
            description: String(inputs[0]?.value || '').trim(),
            qty: String(inputs[1]?.value || '').trim(),
            bookValue: String(inputs[2]?.value || '').trim(),
            authorityRef: String(inputs[3]?.value || '').trim(),
            remarks: String(inputs[4]?.value || '').trim()
        }))
    };
}

function buildZnaQ1OfficialHtml() {
    const esc = qmGapEsc;
    const s = getZnaQ1FormSnapshot();
    const blank = { description: '', qty: '', bookValue: '', authorityRef: '', remarks: '' };
    const rows = qmGapPadRows(s.items, 12, blank).map((r) => `
        <tr>
            <td class="left">${esc(r.description)}</td>
            <td>${esc(r.qty)}</td>
            <td>${esc(r.bookValue)}</td>
            <td>${esc(r.authorityRef)}</td>
            <td class="left">${esc(r.remarks)}</td>
        </tr>
    `).join('');

    return `
    <div class="q1-official-doc">
        <div class="q1-code">ZNA/Q/1</div>
        <h1 class="q1-title">STATEMENT OF STORES LOST OR DAMAGED TO BE WRITTEN OFF</h1>
        <p class="q1-sub">SUMMARY OF Q FORMS — Annex A · Section 1 Chapter 7</p>
        <div class="q1-meta">
            <div>Unit: <strong>${esc(s.unit)}</strong></div>
            <div>Schedule No: <strong>${esc(s.scheduleNo)}</strong></div>
            <div>Period: <strong>${esc(s.period)}</strong></div>
            <div>Date: <strong>${esc(s.date)}</strong></div>
        </div>
        <p>Powers / authority for write-off: <strong>${esc(s.authority)}</strong></p>
        <p>Reason (loss / damage / destruction / other): <strong>${esc(s.reason)}</strong></p>
        <table class="q1-table">
            <thead>
                <tr>
                    <th>Description of stores</th>
                    <th>Qty</th>
                    <th>Book value</th>
                    <th>Authority / ref</th>
                    <th>Remarks</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
        <div class="q1-sigs">
            <div>Quartermaster / Store Officer<br><strong>${esc(s.qmSig)}</strong></div>
            <div>Commanding Officer<br><strong>${esc(s.coSig)}</strong></div>
        </div>
    </div>`;
}

function printZnaQ1OfficialForm() {
    qmGapPrint('zna-q-1-print-host', 'printing-zna-q-1', buildZnaQ1OfficialHtml());
}

/* ===== ZNA Q 998 Statement of Loss / Damage / Destruction (ASO Pt 1 Ch 6) ===== */

function getZnaQ998FormSnapshot() {
    return {
        unit: qmGapVal('q998Unit'),
        statementNo: qmGapVal('q998StatementNo'),
        date: qmGapDate(qmGapVal('q998Date')) || qmGapVal('q998Date'),
        location: qmGapVal('q998Location'),
        circumstance: qmGapVal('q998Circumstance'),
        boardHeld: qmGapVal('q998BoardHeld'),
        actionTaken: qmGapVal('q998ActionTaken'),
        reporter: qmGapVal('q998Reporter'),
        coSig: qmGapVal('q998CoSig'),
        items: qmGapCollectTable('zna-q-998-table-body', (inputs) => ({
            description: String(inputs[0]?.value || '').trim(),
            serialZa: String(inputs[1]?.value || '').trim(),
            qty: String(inputs[2]?.value || '').trim(),
            condition: String(inputs[3]?.value || '').trim(),
            estValue: String(inputs[4]?.value || '').trim(),
            remarks: String(inputs[5]?.value || '').trim()
        }))
    };
}

function buildZnaQ998OfficialHtml() {
    const esc = qmGapEsc;
    const s = getZnaQ998FormSnapshot();
    const blank = { description: '', serialZa: '', qty: '', condition: '', estValue: '', remarks: '' };
    const rows = qmGapPadRows(s.items, 8, blank).map((r) => `
        <tr>
            <td class="left">${esc(r.description)}</td>
            <td>${esc(r.serialZa)}</td>
            <td>${esc(r.qty)}</td>
            <td>${esc(r.condition)}</td>
            <td>${esc(r.estValue)}</td>
            <td class="left">${esc(r.remarks)}</td>
        </tr>
    `).join('');

    return `
    <div class="q998-official-doc">
        <div class="q998-code">ZNA/Q/998</div>
        <h1 class="q998-title">STATEMENT OF LOSS, DAMAGE OR DESTRUCTION</h1>
        <p class="q998-sub">Accounting Standing Orders — Part 1 Chapter 6</p>
        <div class="q998-meta">
            <div>Unit: <strong>${esc(s.unit)}</strong></div>
            <div>Statement No: <strong>${esc(s.statementNo)}</strong></div>
            <div>Date: <strong>${esc(s.date)}</strong></div>
            <div>Location: <strong>${esc(s.location)}</strong></div>
        </div>
        <p><strong>Circumstances:</strong></p>
        <div class="q998-narrative">${esc(s.circumstance).replace(/\n/g, '<br>') || '&nbsp;'}</div>
        <table class="q998-table">
            <thead>
                <tr>
                    <th>Description</th>
                    <th>Serial / ZA</th>
                    <th>Qty</th>
                    <th>Condition</th>
                    <th>Est. value</th>
                    <th>Remarks</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
        <p>Board of Inquiry held: <strong>${esc(s.boardHeld)}</strong></p>
        <p>Action taken / recommended: <strong>${esc(s.actionTaken)}</strong></p>
        <div class="q998-sigs">
            <div>Reporting officer<br><strong>${esc(s.reporter)}</strong></div>
            <div>Commanding Officer<br><strong>${esc(s.coSig)}</strong></div>
        </div>
    </div>`;
}

function printZnaQ998OfficialForm() {
    qmGapPrint('zna-q-998-print-host', 'printing-zna-q-998', buildZnaQ998OfficialHtml());
}

/* ===== ZNA Q 1680 Debit Voucher (ASO Pt 1 Ch 27) ===== */

function getZnaQ1680FormSnapshot() {
    return {
        voucherNo: qmGapVal('q1680VoucherNo'),
        date: qmGapDate(qmGapVal('q1680Date')) || qmGapVal('q1680Date'),
        issuingUnit: qmGapVal('q1680IssuingUnit'),
        issuingOfficer: qmGapVal('q1680IssuingOfficer'),
        debtorName: qmGapVal('q1680DebtorName'),
        debtorForce: qmGapVal('q1680DebtorForce'),
        debtorUnit: qmGapVal('q1680DebtorUnit'),
        circumstance: qmGapVal('q1680Circumstance'),
        recoveryMethod: qmGapVal('q1680RecoveryMethod'),
        amount: qmGapVal('q1680Amount'),
        liabilityAck: qmGapVal('q1680LiabilityAck'),
        imprestHolder: qmGapVal('q1680ImprestHolder'),
        issuerSig: qmGapVal('q1680IssuerSig'),
        debtorSig: qmGapVal('q1680DebtorSig'),
        items: qmGapCollectTable('zna-q-1680-table-body', (inputs) => ({
            description: String(inputs[0]?.value || '').trim(),
            qty: String(inputs[1]?.value || '').trim(),
            rate: String(inputs[2]?.value || '').trim(),
            amount: String(inputs[3]?.value || '').trim(),
            remarks: String(inputs[4]?.value || '').trim()
        }))
    };
}

function buildZnaQ1680OfficialHtml() {
    const esc = qmGapEsc;
    const s = getZnaQ1680FormSnapshot();
    const blank = { description: '', qty: '', rate: '', amount: '', remarks: '' };
    const rows = qmGapPadRows(s.items, 8, blank).map((r) => `
        <tr>
            <td class="left">${esc(r.description)}</td>
            <td>${esc(r.qty)}</td>
            <td>${esc(r.rate)}</td>
            <td>${esc(r.amount)}</td>
            <td class="left">${esc(r.remarks)}</td>
        </tr>
    `).join('');

    return `
    <div class="q1680-official-doc">
        <div class="q1680-code">ZNA/Q/1680</div>
        <h1 class="q1680-title">MISCELLANEOUS CREDIT / DEBIT VOUCHER</h1>
        <p class="q1680-sub">SUMMARY OF Q FORMS — Annex A · Recoveries to Public Funds</p>
        <div class="q1680-meta">
            <div>Voucher No: <strong>${esc(s.voucherNo)}</strong></div>
            <div>Date: <strong>${esc(s.date)}</strong></div>
            <div>Issuing unit: <strong>${esc(s.issuingUnit)}</strong></div>
            <div>Issuing officer: <strong>${esc(s.issuingOfficer)}</strong></div>
        </div>
        <div class="q1680-meta">
            <div>Debtor name: <strong>${esc(s.debtorName)}</strong></div>
            <div>Force No: <strong>${esc(s.debtorForce)}</strong></div>
            <div>Unit / establishment: <strong>${esc(s.debtorUnit)}</strong></div>
            <div>Recovery: <strong>${esc(s.recoveryMethod)}</strong></div>
        </div>
        <p>Circumstance (ASO Ch 27): <strong>${esc(s.circumstance)}</strong></p>
        <table class="q1680-table">
            <thead>
                <tr>
                    <th>Particulars</th>
                    <th>Qty</th>
                    <th>Rate</th>
                    <th>Amount</th>
                    <th>Remarks</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
        <p>Total amount recoverable: <strong>${esc(s.amount)}</strong></p>
        <p>I acknowledge liability for the amount stated: <strong>${esc(s.liabilityAck)}</strong></p>
        <div class="q1680-sigs">
            <div>Debtor<br><strong>${esc(s.debtorSig)}</strong></div>
            <div>Issuing officer<br><strong>${esc(s.issuerSig)}</strong></div>
            <div>Imprest holder / Paymaster<br><strong>${esc(s.imprestHolder)}</strong></div>
        </div>
        <p class="q1680-note">Compile in quadruplicate. Cash: original &amp; duplicate to imprest holder; triplicate to debtor; quadruplicate retained. Recovery from pay: original &amp; duplicate to Unit Paymaster / D PAR as applicable.</p>
    </div>`;
}

function printZnaQ1680OfficialForm() {
    qmGapPrint('zna-q-1680-print-host', 'printing-zna-q-1680', buildZnaQ1680OfficialHtml());
}

function ensureAsoGapStarterRows() {
    const specs = [
        { id: 'zna-q-985-table-body', build: () => typeof buildZnaQ985Row === 'function' && buildZnaQ985Row(), n: 4 },
        { id: 'zna-q-1-table-body', build: () => typeof buildZnaQ1Row === 'function' && buildZnaQ1Row(), n: 4 },
        { id: 'zna-q-998-table-body', build: () => typeof buildZnaQ998Row === 'function' && buildZnaQ998Row(), n: 4 },
        { id: 'zna-q-1680-table-body', build: () => typeof buildZnaQ1680Row === 'function' && buildZnaQ1680Row(), n: 3 }
    ];
    specs.forEach((spec) => {
        const tbody = document.getElementById(spec.id);
        if (!tbody || tbody.rows.length > 0) return;
        for (let i = 0; i < spec.n; i += 1) {
            const tr = typeof spec.build === 'function' ? spec.build() : null;
            if (tr) tbody.appendChild(tr);
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(ensureAsoGapStarterRows, 100);
});
