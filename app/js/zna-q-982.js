/* ZNA Q 982 — Combined Indent and Voucher for Stores (official print/report) */

function q982Escape(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function q982Val(id) {
    const el = document.getElementById(id);
    if (!el) return '';
    if (el.type === 'checkbox') return el.checked ? el.value : '';
    return String(el.value || '').trim();
}

function q982FormatDate(iso) {
    if (!iso) return '';
    const d = new Date(`${iso}T00:00:00`);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-GB');
}

function q982ReasonDisplay() {
    const codes = ['A', 'B', 'C', 'D', 'E'];
    return codes.map((code) => {
        const on = document.getElementById(`q982Reason${code}`)?.checked;
        return on
            ? `<span class="q982-reason-on">${code}</span>`
            : `<span class="q982-reason-off">${code}</span>`;
    }).join(' ');
}

function getZnaQ982FormSnapshot() {
    const items = [];
    document.querySelectorAll('#zna-q-982-table-body tr').forEach((tr, index) => {
        const inputs = tr.querySelectorAll('input, select, textarea');
        if (!inputs.length) return;
        const row = {
            line: String(index + 1),
            stockBalance: String(inputs[0]?.value || '').trim(),
            location: String(inputs[1]?.value || '').trim(),
            vocab: String(inputs[2]?.value || '').trim(),
            section: String(inputs[3]?.value || '').trim(),
            designation: String(inputs[4]?.value || '').trim(),
            uoi: String(inputs[5]?.value || '').trim(),
            qtyRequired: String(inputs[6]?.value || '').trim(),
            qtyIssued: String(inputs[7]?.value || '').trim(),
            qtyToFollow: String(inputs[8]?.value || '').trim(),
            packageNo: String(inputs[9]?.value || '').trim(),
            weight: String(inputs[10]?.value || '').trim(),
            valueDollars: String(inputs[11]?.value || '').trim(),
            valueCents: String(inputs[12]?.value || '').trim()
        };
        const hasData = Object.values(row).some((v, i) => i > 0 && v);
        if (hasData) items.push(row);
    });

    return {
        unitIndentNo: q982Val('q982UnitIndentNo'),
        date: q982FormatDate(q982Val('q982Date')) || q982Val('q982Date'),
        dateRequired: q982FormatDate(q982Val('q982DateRequired')) || q982Val('q982DateRequired'),
        authority: q982Val('q982Authority'),
        normalSpecial: q982Val('q982NormalSpecial') || 'NORMAL',
        degreeUrgency: q982Val('q982DegreeUrgency'),
        issuingDepot: q982Val('q982IssuingDepot'),
        controlNo: q982Val('q982ControlNo'),
        reasonHtml: q982ReasonDisplay(),
        voucherTo: q982Val('q982VoucherTo'),
        address: q982Val('q982Address'),
        railway: q982Val('q982Railway'),
        specialInstructions: q982Val('q982SpecialInstructions'),
        demandingSig: q982Val('q982DemandingSig'),
        demandingName: q982Val('q982DemandingName'),
        items,
        apprDascInitials: q982Val('q982ApprDascInitials'),
        apprDascDate: q982FormatDate(q982Val('q982ApprDascDate')),
        apprCheckedInitials: q982Val('q982ApprCheckedInitials'),
        apprCheckedDate: q982FormatDate(q982Val('q982ApprCheckedDate')),
        postedAccountsInitials: q982Val('q982PostedAccountsInitials'),
        postedAccountsDate: q982FormatDate(q982Val('q982PostedAccountsDate')),
        selectedInitials: q982Val('q982SelectedInitials'),
        selectedDate: q982FormatDate(q982Val('q982SelectedDate')),
        checkedInitials: q982Val('q982CheckedInitials'),
        checkedDate: q982FormatDate(q982Val('q982CheckedDate')),
        postedByInitials: q982Val('q982PostedByInitials'),
        postedByDate: q982FormatDate(q982Val('q982PostedByDate')),
        receiptDate: q982FormatDate(q982Val('q982ReceiptDate')),
        receiptVoucherNo: q982Val('q982ReceiptVoucherNo'),
        receiptSig: q982Val('q982ReceiptSig'),
        receiptNo: q982Val('q982ReceiptNo'),
        receiptName: q982Val('q982ReceiptName')
    };
}

function buildZnaQ982ItemRowsHtml(items, minRows) {
    const esc = q982Escape;
    const rows = [...items];
    while (rows.length < minRows) {
        rows.push({
            line: String(rows.length + 1),
            stockBalance: '', location: '', vocab: '', section: '', designation: '',
            uoi: '', qtyRequired: '', qtyIssued: '', qtyToFollow: '',
            packageNo: '', weight: '', valueDollars: '', valueCents: ''
        });
    }
    return rows.map((item, i) => `
        <tr>
            <td class="q982-c-line">${esc(item.line || String(i + 1))}</td>
            <td>${esc(item.stockBalance)}</td>
            <td>${esc(item.location)}</td>
            <td>${esc(item.vocab)}</td>
            <td>${esc(item.section)}</td>
            <td class="q982-c-desig">${esc(item.designation)}</td>
            <td>${esc(item.uoi)}</td>
            <td>${esc(item.qtyRequired)}</td>
            <td>${esc(item.qtyIssued)}</td>
            <td>${esc(item.qtyToFollow)}</td>
            <td>${esc(item.packageNo)}</td>
            <td>${esc(item.weight)}</td>
            <td>${esc(item.valueDollars)}</td>
            <td>${esc(item.valueCents)}</td>
        </tr>
    `).join('');
}

function buildZnaQ982OfficialHtml() {
    const esc = q982Escape;
    const s = getZnaQ982FormSnapshot();
    const isNormal = String(s.normalSpecial).toUpperCase() === 'NORMAL';
    const normalSpecialHtml = isNormal
        ? `<strong>NORMAL</strong> / <span class="q982-strike">SPECIAL</span>`
        : `<span class="q982-strike">NORMAL</span> / <strong>SPECIAL</strong>`;

    const itemRows = buildZnaQ982ItemRowsHtml(s.items, Math.max(8, s.items.length || 0));

    return `
    <div class="q982-official-doc">
        <div class="q982-official-banner">
            <div class="q982-official-title-block">
                <div class="q982-official-main-title">COMBINED INDENT AND VOUCHER FOR STORES</div>
            </div>
            <div class="q982-official-form-code">ZNAQ 982<br>(LARGE)</div>
        </div>

        <div class="q982-official-topgrid">
            <div class="q982-box q982-indent-no">
                <div class="q982-box-label">UNIT INDENT No</div>
                <div class="q982-box-value">${esc(s.unitIndentNo)}</div>
            </div>
            <div class="q982-box q982-date">
                <div class="q982-box-label">DATE</div>
                <div class="q982-box-value">${esc(s.date)}</div>
            </div>
            <div class="q982-box q982-date-req">
                <div class="q982-box-label">DATE STORES REQUIRED</div>
                <div class="q982-box-value">${esc(s.dateRequired)}</div>
            </div>
            <div class="q982-box q982-authority">
                <div class="q982-box-label">AUTHORITY FOR ISSUE</div>
                <div class="q982-box-value">${esc(s.authority)}</div>
            </div>
            <div class="q982-box q982-zasc">
                <div class="q982-zasc-title">ZASC USE ONLY</div>
                <div class="q982-zasc-row">
                    <div class="q982-zasc-normal">${normalSpecialHtml}<div class="q982-tiny">Delete Word not applicable</div></div>
                    <div class="q982-zasc-urgency"><div class="q982-box-label">DEGREE OF URGENCY</div><div class="q982-box-value">${esc(s.degreeUrgency)}</div></div>
                </div>
                <div class="q982-zasc-row">
                    <div class="q982-zasc-depot"><div class="q982-box-label">ISSUING DEPOT</div><div class="q982-box-value">${esc(s.issuingDepot)}</div></div>
                    <div class="q982-zasc-control"><div class="q982-box-label">CONTROL No</div><div class="q982-box-value">${esc(s.controlNo)}</div></div>
                </div>
            </div>

            <div class="q982-box q982-reason">
                <div class="q982-box-label">REASON FOR INDENT (see note)</div>
                <div class="q982-reason-line">${s.reasonHtml}</div>
                <div class="q982-tiny">Delete Code Not Applicable</div>
            </div>
            <div class="q982-box q982-voucher-to">
                <div class="q982-box-label">VOUCHER TO:</div>
                <div class="q982-box-value">${esc(s.voucherTo)}</div>
            </div>
            <div class="q982-box q982-address">
                <div class="q982-box-label">ADDRESS FOR STORES</div>
                <div class="q982-box-value q982-multiline">${esc(s.address).replace(/\n/g, '<br>')}</div>
            </div>
            <div class="q982-box q982-railway">
                <div class="q982-box-label">NEAREST RAILWAY STATION</div>
                <div class="q982-box-value">${esc(s.railway)}</div>
            </div>
            <div class="q982-box q982-special">
                <div class="q982-box-label">SPECIAL INSTRUCTIONS</div>
                <div class="q982-box-value q982-multiline">${esc(s.specialInstructions).replace(/\n/g, '<br>')}</div>
            </div>
            <div class="q982-box q982-demanding">
                <div class="q982-box-label">SIGNATURE AND RANK OF DEMANDING OFFICER</div>
                <div class="q982-box-value">${esc(s.demandingSig)}</div>
                <div class="q982-box-label">NAME: Block Capitals</div>
                <div class="q982-box-value q982-block-name">${esc(s.demandingName)}</div>
            </div>
        </div>

        <table class="q982-official-table">
            <thead>
                <tr>
                    <th rowspan="2" class="q982-c-line">Line<br>posting</th>
                    <th rowspan="2">Stock<br>balance</th>
                    <th rowspan="2">Location</th>
                    <th rowspan="2">Vocabulary<br>or part No.</th>
                    <th rowspan="2">SECTION</th>
                    <th rowspan="2" class="q982-c-desig">Designation</th>
                    <th rowspan="2">Unit of<br>Issue</th>
                    <th colspan="3">Quantities</th>
                    <th rowspan="2">Package<br>Number</th>
                    <th rowspan="2">Weight</th>
                    <th colspan="2">Value</th>
                </tr>
                <tr>
                    <th>Required</th>
                    <th>Issued</th>
                    <th>To follow</th>
                    <th>$</th>
                    <th>c</th>
                </tr>
            </thead>
            <tbody>${itemRows}</tbody>
        </table>

        <div class="q982-official-footer">
            <table class="q982-foot-table q982-foot-control">
                <thead>
                    <tr><th></th><th>Initials</th><th>Date</th></tr>
                </thead>
                <tbody>
                    <tr><td>Approved DASC ARMY H.Q. As Applicable</td><td>${esc(s.apprDascInitials)}</td><td>${esc(s.apprDascDate)}</td></tr>
                    <tr><td>Approved and Checked By</td><td>${esc(s.apprCheckedInitials)}</td><td>${esc(s.apprCheckedDate)}</td></tr>
                    <tr><td>Posted Accounts</td><td>${esc(s.postedAccountsInitials)}</td><td>${esc(s.postedAccountsDate)}</td></tr>
                </tbody>
            </table>

            <table class="q982-foot-table q982-foot-group">
                <thead>
                    <tr><th></th><th>Initials</th><th>Date</th></tr>
                </thead>
                <tbody>
                    <tr><td>SELECTED BY</td><td>${esc(s.selectedInitials)}</td><td>${esc(s.selectedDate)}</td></tr>
                    <tr><td>CHECKED BY</td><td>${esc(s.checkedInitials)}</td><td>${esc(s.checkedDate)}</td></tr>
                    <tr><td>POSTED BY</td><td>${esc(s.postedByInitials)}</td><td>${esc(s.postedByDate)}</td></tr>
                </tbody>
            </table>

            <div class="q982-foot-note">
                <div class="q982-note-title">NOTE</div>
                <div>A — To complete initial issues to scale BRE/UET.</div>
                <div>B — To replace against B of S, B of C.</div>
                <div>C — Stock replenishment.</div>
                <div>D — Repayment.</div>
                <div>E — Re-indent (quote previous control No.).</div>
            </div>

            <div class="q982-foot-receipt">
                <div class="q982-receipt-title">RECEIPT FOR STORES</div>
                <div class="q982-receipt-grid">
                    <div>
                        <div class="q982-box-label">Date</div>
                        <div class="q982-box-value">${esc(s.receiptDate)}</div>
                        <div class="q982-box-label">Signature, rank and appointment</div>
                        <div class="q982-box-value">${esc(s.receiptSig)}</div>
                        <div class="q982-box-label">No.</div>
                        <div class="q982-box-value">${esc(s.receiptNo)}</div>
                        <div class="q982-box-label">NAME: Block Capitals</div>
                        <div class="q982-box-value q982-block-name">${esc(s.receiptName)}</div>
                    </div>
                    <div class="q982-receipt-voucher">
                        <div class="q982-box-label">RECEIPT VOUCHER NO.</div>
                        <div class="q982-box-value">${esc(s.receiptVoucherNo)}</div>
                    </div>
                </div>
            </div>
        </div>

        <div class="q982-official-bottom-notes">
            <span>INCORRECTLY COMPILED INDENTS WILL BE RETURNED</span>
            <span>SIGN AND RETURN No. 3 COPY IMMEDIATELY</span>
        </div>
    </div>
    `;
}

function ensureZnaQ982PrintHost() {
    let host = document.getElementById('zna-q-982-print-host');
    if (!host) {
        host = document.createElement('div');
        host.id = 'zna-q-982-print-host';
        host.className = 'zna-q-982-print-host';
        document.body.appendChild(host);
    }
    return host;
}

function printZnaQ982OfficialForm() {
    if (typeof runOfficialPrint === 'function') {
        runOfficialPrint(() => {
            const host = ensureZnaQ982PrintHost();
            host.innerHTML = buildZnaQ982OfficialHtml();
            host.classList.add('print-target');
            document.body.classList.add('is-printing', 'printing-zna-q-982');
        });
        return;
    }
    const host = ensureZnaQ982PrintHost();
    host.innerHTML = buildZnaQ982OfficialHtml();
    host.classList.add('print-target');
    document.body.classList.add('is-printing', 'printing-zna-q-982');
    window.print();
}

function ensureZnaQ982StarterRows() {
    const tbody = document.getElementById('zna-q-982-table-body');
    if (!tbody || tbody.rows.length > 0) return;
    for (let i = 0; i < 5; i += 1) {
        if (typeof buildZnaQ982Row === 'function') tbody.appendChild(buildZnaQ982Row());
    }
}

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(ensureZnaQ982StarterRows, 0);
});
