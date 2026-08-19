/* Inventory of Accommodation Stores — standalone module */

const ACC_COMMON_ITEMS = [
    'CHAIRS - TUBULAR',
    'TABLE MODULE',
    'TABLE - OFFICE',
    'SURGE PROTECTOR',
    'TRAY - CORRESPONDENCE',
    'CPU',
    'VDU',
    'MOUSE',
    'KEYBOARD',
    'FILING CABINET',
    'WHITEBOARD',
    'DESK LAMP'
];

function accEsc(v) {
    return String(v ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function accVal(id) {
    return String(document.getElementById(id)?.value || '').trim();
}

function accFmtDate(iso) {
    if (!iso) return '';
    const d = new Date(`${iso}T00:00:00`);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-GB');
}

function getAccommodationStoresSnapshot() {
    const checks = [1, 2, 3, 4].map((n) => ({
        date: accFmtDate(accVal(`accCheck${n}Date`)) || accVal(`accCheck${n}Date`),
        sig: accVal(`accCheck${n}Sig`)
    }));
    const items = [];
    document.querySelectorAll('#accommodation-stores-table-body tr').forEach((tr) => {
        const inputs = tr.querySelectorAll('input');
        const item = String(inputs[0]?.value || '').trim();
        const qtys = [1, 2, 3, 4].map((_, i) => String(inputs[i + 1]?.value || '').trim());
        if (item || qtys.some(Boolean)) items.push({ item, qtys });
    });
    return {
        unit: accVal('accUnit'),
        yearRef: accVal('accYearRef'),
        counterSig: accVal('accCounterSig'),
        location: accVal('accLocation'),
        personNo: accVal('accPersonNo'),
        rank: accVal('accRank'),
        name: accVal('accName'),
        appt: accVal('accAppt'),
        checks,
        items
    };
}

function buildAccommodationStoresOfficialHtml() {
    const esc = accEsc;
    const s = getAccommodationStoresSnapshot();
    const rows = [...s.items];
    while (rows.length < 18) rows.push({ item: '', qtys: ['', '', '', ''] });

    const dateCells = s.checks.map((c) => `<th class="acc-rot">${esc(c.date)}</th>`).join('');
    const sigCells = s.checks.map((c) => `<th class="acc-rot">${esc(c.sig)}</th>`).join('');
    // pad to look like paper grid (extra blank columns)
    const blankCols = 8;
    const blankHeads = Array.from({ length: blankCols }, () => '<th class="acc-rot">&nbsp;</th>').join('');

    const body = rows.map((r) => {
        const qtys = (r.qtys || []).concat(['', '', '', '']).slice(0, 4);
        const qtyCells = qtys.map((q) => `<td>${esc(q)}</td>`).join('');
        const blanks = Array.from({ length: blankCols }, () => '<td></td>').join('');
        return `<tr><td class="acc-item-cell">${esc(r.item)}</td>${qtyCells}${blanks}</tr>`;
    }).join('');

    return `
    <div class="acc-official-doc">
        <h1 class="acc-title"><u>INVENTORY OF ACCOMODATION STORES</u></h1>
        <div class="acc-header-grid">
            <div class="acc-left-meta">
                <div class="acc-unit-line"><strong>UNIT</strong> <span>${esc(s.unit)}</span></div>
                <div class="acc-year-line">${esc(s.yearRef)}</div>
                <div class="acc-counter-box">
                    <div>Counter Signature of Unit Store holder</div>
                    <div class="acc-counter-sig">${esc(s.counterSig)}</div>
                </div>
                <div class="acc-loc-block">
                    <div><strong>LOCATION</strong> ${esc(s.location)}</div>
                    <div class="acc-person-line">
                        <span><strong>No.</strong> ${esc(s.personNo)}</span>
                        <span><strong>Rank</strong> ${esc(s.rank)}</span>
                    </div>
                    <div class="acc-person-line">
                        <span><strong>Name</strong> ${esc(s.name)}</span>
                        <span><strong>Appt.</strong> ${esc(s.appt)}</span>
                    </div>
                    <div class="acc-pic-label">Person in charge of office or room</div>
                </div>
            </div>
            <div class="acc-right-checks">
                <table class="acc-check-mini">
                    <thead>
                        <tr><th class="acc-rot">DATE</th>${dateCells}${blankHeads}</tr>
                        <tr><th class="acc-rot">SIG</th>${sigCells}${blankHeads}</tr>
                    </thead>
                </table>
            </div>
        </div>
        <table class="acc-official-table">
            <thead>
                <tr>
                    <th class="acc-item-h">Item</th>
                    ${dateCells}${blankHeads}
                </tr>
            </thead>
            <tbody>${body}</tbody>
        </table>
        <p class="acc-official-note">
            <strong>NOTE:</strong> ALTERATION TO THE ABOVE WILL NOT BE MADE WITHOUT THE AUTHORITY OF THE CAMP COMMANDANT WHO WILL <u>COUNTER SIGN ALL ENTRIES / ALTERATIONS</u>.
        </p>
    </div>`;
}

function printAccommodationStoresOfficialForm() {
    if (typeof runOfficialPrint === 'function') {
        runOfficialPrint(() => {
            let host = document.getElementById('accommodation-stores-print-host');
            if (!host) {
                host = document.createElement('div');
                host.id = 'accommodation-stores-print-host';
                host.className = 'accommodation-stores-print-host';
                document.body.appendChild(host);
            }
            host.innerHTML = buildAccommodationStoresOfficialHtml();
            host.classList.add('print-target');
            document.body.classList.add('is-printing', 'printing-accommodation-stores');
        });
        return;
    }
    let host = document.getElementById('accommodation-stores-print-host');
    if (!host) {
        host = document.createElement('div');
        host.id = 'accommodation-stores-print-host';
        host.className = 'accommodation-stores-print-host';
        document.body.appendChild(host);
    }
    host.innerHTML = buildAccommodationStoresOfficialHtml();
    host.classList.add('print-target');
    document.body.classList.add('is-printing', 'printing-accommodation-stores');
    window.print();
}

function seedAccommodationStoreItems() {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;
    const tbody = document.getElementById('accommodation-stores-table-body');
    if (!tbody) return;
    const existing = new Set(
        [...tbody.querySelectorAll('tr')].map((tr) => String(tr.querySelector('input')?.value || '').trim().toUpperCase()).filter(Boolean)
    );
    ACC_COMMON_ITEMS.forEach((item) => {
        if (existing.has(item.toUpperCase())) return;
        if (typeof addAccommodationStoreRow === 'function') {
            addAccommodationStoreRow();
            const last = tbody.querySelector('tr:last-child input');
            if (last) last.value = item;
        }
    });
    if (typeof showToast === 'function') showToast('Common accommodation items loaded.');
}

function ensureAccommodationStoresRows() {
    const tbody = document.getElementById('accommodation-stores-table-body');
    if (!tbody || tbody.rows.length > 0) return;
    for (let i = 0; i < 6; i += 1) {
        if (typeof addAccommodationStoreRow === 'function') addAccommodationStoreRow();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(ensureAccommodationStoresRows, 100);
});
