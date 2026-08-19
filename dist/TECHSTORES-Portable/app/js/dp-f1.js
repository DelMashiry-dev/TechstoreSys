function dpF1Escape(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function dpF1FieldValue(id) {
    const el = document.getElementById(id);
    if (!el) return '';
    return String(el.value || '').trim();
}

function dpF1SelectLabel(id) {
    const el = document.getElementById(id);
    if (!el) return '';
    if (el.tagName === 'SELECT') {
        return String(el.selectedOptions?.[0]?.text || el.value || '').trim();
    }
    return String(el.value || '').trim();
}

function formatDpF1DisplayDate(isoDate) {
    if (!isoDate) return '';
    const d = new Date(`${isoDate}T00:00:00`);
    if (Number.isNaN(d.getTime())) return isoDate;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatDpF1GlDisplay(glValue, glLabel) {
    const code = String(glValue || '').trim();
    if (!code) return '';
    if (/^GL\s/i.test(code)) return code;
    const short = code.replace(/^0+/, '') || code;
    return `GL ${short}`;
}

function dpF1DotValue(value, width) {
    const text = String(value || '').trim();
    if (text) return text;
    return '.'.repeat(width || 20);
}

function getDpF1FormSnapshot() {
    const items = [];
    document.querySelectorAll('#dp-f1-table-body tr').forEach((tr, index) => {
        const inputs = tr.querySelectorAll('input, select, textarea');
        const designation = String(inputs[0]?.value || '').trim();
        const qty = String(inputs[1]?.value || '').trim();
        const holding = String(inputs[2]?.value || '').trim();
        const supplier = String(inputs[3]?.value || '').trim();
        if (!designation && !qty && !holding && !supplier) return;
        items.push({
            ser: String(index + 1),
            designation,
            qty,
            holding,
            supplier
        });
    });

    const glValue = dpF1FieldValue('dpF1Gl');
    const currency = getDpF1Currency();
    const estimatedCostAmount = getDpF1EstimatedCostAmount();
    return {
        date: dpF1FieldValue('dpF1Date'),
        dateDisplay: formatDpF1DisplayDate(dpF1FieldValue('dpF1Date')),
        currency,
        estimatedCostAmount,
        estimatedCost: formatDpF1EstimatedCostDisplay(currency, estimatedCostAmount),
        delivery: dpF1SelectLabel('dpF1Delivery'),
        glValue,
        glDisplay: formatDpF1GlDisplay(glValue, dpF1SelectLabel('dpF1Gl')),
        costCentre: dpF1SelectLabel('dpF1CostCentre') || 'Z04P2SP212',
        remarks: dpF1FieldValue('dpF1Remarks'),
        items,
        officers: [
            {
                no: dpF1FieldValue('dpF1Off1No'),
                rank: dpF1FieldValue('dpF1Off1Rank'),
                name: dpF1FieldValue('dpF1Off1Name'),
                appt: dpF1FieldValue('dpF1Off1Appt'),
                signature: dpF1FieldValue('dpF1Off1Signature'),
                date: formatDpF1DisplayDate(dpF1FieldValue('dpF1Off1Date')) || dpF1FieldValue('dpF1Off1Date')
            },
            {
                no: dpF1FieldValue('dpF1Off2No'),
                rank: dpF1FieldValue('dpF1Off2Rank'),
                name: dpF1FieldValue('dpF1Off2Name'),
                appt: dpF1FieldValue('dpF1Off2Appt'),
                signature: dpF1FieldValue('dpF1Off2Signature'),
                date: formatDpF1DisplayDate(dpF1FieldValue('dpF1Off2Date')) || dpF1FieldValue('dpF1Off2Date')
            }
        ]
    };
}

function buildDpF1OfficerBlockHtml(officer) {
    const esc = dpF1Escape;
    return `
        <div class="dp-f1-official-sign-block">
            <div class="dp-f1-official-sign-line">
                <span>No: <strong>${esc(dpF1DotValue(officer.no, 18))}</strong></span>
                <span>Rank: <strong>${esc(dpF1DotValue(officer.rank, 14))}</strong></span>
                <span>Name: <strong>${esc(dpF1DotValue(officer.name, 28))}</strong></span>
            </div>
            <div class="dp-f1-official-sign-line">
                <span>Appt: <strong>${esc(dpF1DotValue(officer.appt, 18))}</strong></span>
                <span>Signature: <strong>${esc(dpF1DotValue(officer.signature, 18))}</strong></span>
                <span>Date: <strong>${esc(dpF1DotValue(officer.date, 18))}</strong></span>
            </div>
        </div>
    `;
}

function buildDpF1OfficialHtml() {
    const esc = dpF1Escape;
    const snap = getDpF1FormSnapshot();
    const rows = (snap.items.length ? snap.items : [{ ser: '1', designation: '', qty: '', holding: '', supplier: '' }])
        .map((item) => `
            <tr>
                <td class="dp-f1-col-ser">${esc(item.ser)}</td>
                <td class="dp-f1-col-designation">${esc(item.designation)}</td>
                <td class="dp-f1-col-qty">${esc(item.qty)}</td>
                <td class="dp-f1-col-holding">${esc(item.holding)}</td>
                <td class="dp-f1-col-supplier">${esc(item.supplier)}</td>
            </tr>
        `).join('');

    const blankRow = `
        <tr>
            <td class="dp-f1-col-ser">&nbsp;</td>
            <td class="dp-f1-col-designation">&nbsp;</td>
            <td class="dp-f1-col-qty">&nbsp;</td>
            <td class="dp-f1-col-holding">&nbsp;</td>
            <td class="dp-f1-col-supplier">&nbsp;</td>
        </tr>
    `;

    return `
    <div class="dp-f1-official-doc">
        <div class="dp-f1-official-mark">RESTRICTED</div>

        <div class="dp-f1-official-top">
            <div class="dp-f1-official-code">IT Dir F1</div>
            <div class="dp-f1-official-address">
                Information Technology Directorate<br>
                Josiah Magama Tongogara Barracks<br>
                P Bag 7720<br>
                Causeway<br>
                <br>
                Harare: 2708518<br>
                <br>
                ${esc(snap.dateDisplay || snap.date || '')}
            </div>
        </div>

        <h1 class="dp-f1-official-title">OFFICIAL INDENT FOR PURCHASING/PROCUREMENT OF GOODS/SERVICES/EQUIPMENT</h1>

        <p class="dp-f1-official-intro">1. The Directorate request you to purchase/procure the following goods/services/equipment.</p>

        <table class="dp-f1-official-table">
            <colgroup>
                <col class="dp-f1-col-ser">
                <col class="dp-f1-col-designation">
                <col class="dp-f1-col-qty">
                <col class="dp-f1-col-holding">
                <col class="dp-f1-col-supplier">
            </colgroup>
            <thead>
                <tr>
                    <th class="dp-f1-col-ser">SER</th>
                    <th class="dp-f1-col-designation">OFFICIAL DESIGNATION OF<br>GOODS/SERVICES/EQUIPMENT</th>
                    <th class="dp-f1-col-qty">QUANTITY<br>REQUIRED</th>
                    <th class="dp-f1-col-holding">CURRENT STOCK<br>HOLDING</th>
                    <th class="dp-f1-col-supplier">NAME OF POTENTIAL<br>SUPPLIER IF KNOWN</th>
                </tr>
            </thead>
            <tbody>
                ${rows}
                ${blankRow}
            </tbody>
        </table>

        <div class="dp-f1-official-meta">
            <div><span class="dp-f1-meta-label">2. Estimated cost of goods:</span> <strong>${esc(snap.estimatedCost || '')}</strong></div>
            <div><span class="dp-f1-meta-label">3. Place where goods should be delivered:</span> <strong>${esc(snap.delivery || '')}</strong></div>
            <div><span class="dp-f1-meta-label">4. General Ledger to be charged:</span> <strong>${esc(snap.glDisplay || '')}</strong></div>
            <div><span class="dp-f1-meta-label">5. Cost Centre:</span> <strong>${esc(snap.costCentre || '')}</strong></div>
            <div><span class="dp-f1-meta-label">6. Any remarks in respect of this order:</span> <strong>${esc(snap.remarks || '')}</strong></div>
            <div class="dp-f1-meta-officer-heading">7. Details of the Directorate/Branch/Unit Designated Provision Officer:</div>
        </div>

        ${snap.officers.map(buildDpF1OfficerBlockHtml).join('')}

        <div class="dp-f1-official-dir">Information Technology Directorate</div>
        <div class="dp-f1-official-mark dp-f1-official-mark-bottom">RESTRICTED</div>
    </div>
    `;
}

function ensureDpF1PrintHost() {
    let host = document.getElementById('dp-f1-print-host');
    if (!host) {
        host = document.createElement('div');
        host.id = 'dp-f1-print-host';
        host.className = 'dp-f1-print-host';
        document.body.appendChild(host);
    }
    return host;
}

function printDpF1OfficialForm() {
    if (typeof runOfficialPrint === 'function') {
        runOfficialPrint(() => {
            const host = ensureDpF1PrintHost();
            host.innerHTML = buildDpF1OfficialHtml();
            host.classList.add('print-target');
            document.body.classList.add('is-printing', 'printing-dp-f1');
        });
        return;
    }
    const host = ensureDpF1PrintHost();
    host.innerHTML = buildDpF1OfficialHtml();
    host.classList.add('print-target');
    document.body.classList.add('is-printing', 'printing-dp-f1');
    window.print();
}

function parseDpF1Money(value) {
    const n = parseFloat(String(value || '').replace(/[^0-9.-]/g, ''));
    return Number.isFinite(n) ? n : 0;
}

function formatDpF1EstimatedCostDisplay(currency, amount) {
    const cur = String(currency || '').trim() || 'USD';
    const raw = String(amount ?? '').trim();
    if (!raw) return '';
    const n = parseDpF1Money(raw);
    if (!Number.isFinite(n) || n <= 0) {
        // Keep free-text legacy values readable
        if (/[A-Za-z]/.test(raw)) return raw;
        return `${cur} ${raw}`;
    }
    const formatted = n.toLocaleString('en-US', {
        minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
        maximumFractionDigits: 2
    });
    return `${cur} ${formatted}`;
}

function getDpF1Currency() {
    return dpF1FieldValue('dpF1Currency') || 'USD';
}

function getDpF1EstimatedCostAmount() {
    return dpF1FieldValue('dpF1EstimatedCost');
}

/**
 * Available GL funds BEFORE counting this DP F1 estimated cost.
 * GL Portfolio balance already includes the live form cost as a commitment —
 * add it back so we can compare the requested amount fairly.
 */
function getGlAvailableForNewDpF1(glCode) {
    const gl = String(glCode || '').trim();
    if (!gl || typeof getGlBalance !== 'function') return 0;
    const balance = getGlBalance(gl);
    const thisF1 = (typeof getDpF1CommittedByGl === 'function' ? getDpF1CommittedByGl()[gl] : 0) || 0;
    return balance + thisF1;
}

function checkDpF1Funding(snap) {
    const gl = snap?.glValue || document.getElementById('dpF1Gl')?.value || '';
    const costRaw = snap?.estimatedCostAmount
        || snap?.estimatedCost
        || document.getElementById('dpF1EstimatedCost')?.value
        || '';
    const cost = parseDpF1Money(costRaw);
    if (!gl || cost <= 0) {
        return { ok: true, cost, available: 0, gl, message: '' };
    }

    const available = getGlAvailableForNewDpF1(gl);
    const glName = (typeof GL_ACCOUNTS !== 'undefined' && GL_ACCOUNTS[gl]?.name) || gl;
    const fmt = typeof formatCurrency === 'function' ? formatCurrency : (n) => `$${Number(n).toFixed(2)}`;

    if (available <= 0) {
        return {
            ok: false,
            cost,
            available,
            gl,
            message:
                `No buying power — GL ${gl} (${glName}) has no available DAF funds this month ` +
                `(buying power ${fmt(available)}). Record the DAF monthly target, Release Cut from a funded GL, ` +
                `or reduce / change the GL before raising DP F1.`
        };
    }

    if (cost > available) {
        return {
            ok: false,
            cost,
            available,
            gl,
            message:
                `Insufficient buying power on GL ${gl} (${glName}). ` +
                `Estimated cost ${fmt(cost)} exceeds buying power ${fmt(available)}. ` +
                `Reduce the estimate, wait for DAF target, or Release Cut buying power into this GL.`
        };
    }

    return {
        ok: true,
        cost,
        available,
        gl,
        message: `Buying power OK — ${fmt(available)} available on GL ${gl} covers estimated cost ${fmt(cost)}.`
    };
}

function updateDpF1FundingAlert() {
    const el = document.getElementById('dpF1FundingAlert');
    if (!el) return;
    const snap = typeof getDpF1FormSnapshot === 'function' ? getDpF1FormSnapshot() : {
        glValue: document.getElementById('dpF1Gl')?.value || '',
        currency: document.getElementById('dpF1Currency')?.value || 'USD',
        estimatedCostAmount: document.getElementById('dpF1EstimatedCost')?.value || '',
        estimatedCost: document.getElementById('dpF1EstimatedCost')?.value || ''
    };
    const cost = parseDpF1Money(snap.estimatedCostAmount || snap.estimatedCost);
    if (!snap.glValue || cost <= 0) {
        el.hidden = true;
        el.textContent = '';
        el.className = 'dp-f1-funding-alert';
        return;
    }
    const result = checkDpF1Funding(snap);
    el.hidden = false;
    el.textContent = result.message;
    el.className = `dp-f1-funding-alert ${result.ok ? 'is-ok' : 'is-error'}`;
}

function initDpF1FundingWatch() {
    const costEl = document.getElementById('dpF1EstimatedCost');
    const currencyEl = document.getElementById('dpF1Currency');
    const glEl = document.getElementById('dpF1Gl');
    if (!costEl && !glEl && !currencyEl) return;
    const run = () => updateDpF1FundingAlert();
    costEl?.addEventListener('input', run);
    costEl?.addEventListener('change', run);
    currencyEl?.addEventListener('change', run);
    glEl?.addEventListener('change', run);
    run();
}

document.addEventListener('DOMContentLoaded', () => {
    initDpF1FundingWatch();
});
