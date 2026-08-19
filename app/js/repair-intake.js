/* repair-intake.js — Gate → TechStores Equipment Register → Workshop + SVCS 1045 */

function riEscape(v) {
    return String(v ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function buildEquipmentCustodyRow(data = {}) {
    const tr = document.createElement('tr');
    tr.className = 'ri-custody-row';
    tr.innerHTML = `
        <td><input type="date" class="form-control ri-date-in" data-date-rule="not-future" data-date-label="Date In" value="${riEscape(data.dateIn || '')}"></td>
        <td><input type="text" class="form-control ri-eq-type" value="${riEscape(data.equipmentType || '')}" placeholder="Laptop / desktop / …"></td>
        <td><input type="text" class="form-control ri-serial" value="${riEscape(data.serialOrZa || '')}" placeholder="S/N or ZA"></td>
        <td><input type="text" class="form-control ri-unit zna-unit-select" value="${riEscape(data.unit || '')}" list="znaUnitDatalist"></td>
        <td><input type="text" class="form-control ri-received-by" value="${riEscape(data.receivedBy || '')}"></td>
        <td><input type="text" class="form-control ri-remark" value="${riEscape(data.remark || '')}" placeholder="Repair / upgrade / antivirus…"></td>
        <td><input type="date" class="form-control ri-date-out" data-date-rule="not-future" data-date-label="Date Out" value="${riEscape(data.dateOut || '')}"></td>
        <td><input type="text" class="form-control ri-number" value="${riEscape(data.number || '')}" placeholder="Force No."></td>
        <td><input type="text" class="form-control ri-rank" value="${riEscape(data.rank || '')}"></td>
        <td><input type="text" class="form-control ri-name" value="${riEscape(data.name || '')}"></td>
        <td><input type="text" class="form-control ri-signature" value="${riEscape(data.signature || '')}"></td>
        <td><input type="text" class="form-control ri-svcs1045" value="${riEscape(data.svcs1045 || '')}" placeholder="Required" title="ZNA SVCS 1045 reference"></td>
        <td class="qm-screen-only ri-actions">
            <label class="ri-select-label" title="Select for push to next stage">
                <input type="checkbox" class="ri-select"> Sel
            </label>
            <button type="button" class="btn btn-danger btn-sm" onclick="removeRow(this)">Remove</button>
        </td>`;
    return tr;
}

function buildWorkshopRegisterRow(data = {}) {
    const tr = document.createElement('tr');
    tr.className = 'ri-workshop-row';
    const serial = data.serial != null && data.serial !== ''
        ? data.serial
        : nextWorkshopSerial();
    tr.innerHTML = `
        <td><input type="text" class="form-control ri-ws-serial" value="${riEscape(serial)}" readonly title="Workshop serial"></td>
        <td><input type="text" class="form-control ri-eq-type" value="${riEscape(data.equipmentType || '')}"></td>
        <td><input type="text" class="form-control ri-serial" value="${riEscape(data.serialOrZa || '')}" placeholder="S/N or ZA"></td>
        <td><input type="text" class="form-control ri-unit" value="${riEscape(data.unit || '')}" list="znaUnitDatalist"></td>
        <td><input type="text" class="form-control ri-diagnosis" value="${riEscape(data.diagnosis || '')}" placeholder="Fault / work required"></td>
        <td><input type="text" class="form-control ri-remark" value="${riEscape(data.remark || '')}"></td>
        <td><input type="date" class="form-control ri-date-in" data-date-rule="not-future" data-date-label="Date In" value="${riEscape(data.dateIn || '')}"></td>
        <td><input type="text" class="form-control ri-received-by" value="${riEscape(data.receivedBy || '')}"></td>
        <td><input type="date" class="form-control ri-date-out" data-date-rule="not-future" data-date-label="Date Out" value="${riEscape(data.dateOut || '')}"></td>
        <td><input type="text" class="form-control ri-svcs1045" value="${riEscape(data.svcs1045 || '')}" placeholder="Required"></td>
        <td class="qm-screen-only">
            <button type="button" class="btn btn-ghost btn-sm ri-open-1045">1045</button>
            <button type="button" class="btn btn-secondary btn-sm" data-ws-stores-request title="Indent / request stores for this job">Stores</button>
            <button type="button" class="btn btn-danger btn-sm" onclick="removeRow(this)">Remove</button>
        </td>`;
    return tr;
}

/** Keep legacy name used by tables.js / ROW_BUILDERS */
function buildWorkshopRepairRow(data) {
    return buildWorkshopRegisterRow(data || {});
}

function nextWorkshopSerial() {
    const body = document.getElementById('workshop-repairs-table-body');
    let max = 0;
    body?.querySelectorAll('.ri-ws-serial').forEach((inp) => {
        const n = parseInt(inp.value, 10);
        if (Number.isFinite(n) && n > max) max = n;
    });
    return String(max + 1);
}

function readCustodyRow(tr) {
    return {
        dateIn: tr.querySelector('.ri-date-in')?.value || '',
        equipmentType: tr.querySelector('.ri-eq-type')?.value || '',
        serialOrZa: tr.querySelector('.ri-serial')?.value || '',
        unit: tr.querySelector('.ri-unit')?.value || '',
        receivedBy: tr.querySelector('.ri-received-by')?.value || '',
        remark: tr.querySelector('.ri-remark')?.value || '',
        dateOut: tr.querySelector('.ri-date-out')?.value || '',
        number: tr.querySelector('.ri-number')?.value || '',
        rank: tr.querySelector('.ri-rank')?.value || '',
        name: tr.querySelector('.ri-name')?.value || '',
        signature: tr.querySelector('.ri-signature')?.value || '',
        svcs1045: tr.querySelector('.ri-svcs1045')?.value || ''
    };
}

function requireSvcs1045(row, label) {
    if (String(row.svcs1045 || '').trim()) return true;
    if (typeof showToast === 'function') {
        showToast(`${label}: enter ZNA SVCS 1045 Ref before pushing / booking to workshop.`, 'warning');
    }
    return false;
}

function ensureCustodySeed(tbodyId, builder) {
    const body = document.getElementById(tbodyId);
    if (!body) return;
    if (!body.children.length) {
        body.appendChild(builder({ dateIn: new Date().toISOString().slice(0, 10) }));
    }
}

function addGateRegisterRow(data) {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;
    const body = document.getElementById('gate-register-table-body');
    if (!body) return;
    const today = typeof todayIsoLocal === 'function' ? todayIsoLocal() : new Date().toISOString().slice(0, 10);
    const tr = buildEquipmentCustodyRow(data || { dateIn: today });
    body.appendChild(tr);
    if (typeof applyDateInputConstraints === 'function') applyDateInputConstraints(tr);
}

function addTechstoresEquipmentRegisterRow(data) {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;
    const body = document.getElementById('techstores-equipment-register-table-body');
    if (!body) return;
    const today = typeof todayIsoLocal === 'function' ? todayIsoLocal() : new Date().toISOString().slice(0, 10);
    const tr = buildEquipmentCustodyRow(data || { dateIn: today });
    body.appendChild(tr);
    if (typeof applyDateInputConstraints === 'function') applyDateInputConstraints(tr);
}

function addWorkshopRegisterRow(data) {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;
    const body = document.getElementById('workshop-repairs-table-body');
    if (!body) return;
    const today = typeof todayIsoLocal === 'function' ? todayIsoLocal() : new Date().toISOString().slice(0, 10);
    const tr = buildWorkshopRegisterRow(data || { dateIn: today });
    body.appendChild(tr);
    if (typeof applyDateInputConstraints === 'function') applyDateInputConstraints(tr);
}

function addWorkshopRepairRow() {
    addWorkshopRegisterRow();
}

function pushGateToTechstores() {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;
    const body = document.getElementById('gate-register-table-body');
    const selected = [...(body?.querySelectorAll('tr') || [])].filter((tr) => tr.querySelector('.ri-select')?.checked);
    if (!selected.length) {
        showToast?.('Select one or more gate entries to push.', 'info');
        return;
    }
    const rows = selected.map(readCustodyRow);
    for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        if (typeof validateCustodyRowDates === 'function') {
            const dateErr = validateCustodyRowDates(r, `Gate row ${i + 1}`);
            if (dateErr) {
                showToast?.(dateErr, 'error');
                return;
            }
        }
        if (!r.equipmentType && !r.serialOrZa) {
            showToast?.('Gate entry needs Equipment Type or S/N / ZA No.', 'warning');
            return;
        }
        if (!requireSvcs1045(r, 'Gate')) return;
    }
    const go = async () => {
        if (typeof navigateToModule === 'function') await navigateToModule('techstores-equipment-register');
        const dest = document.getElementById('techstores-equipment-register-table-body');
        if (!dest) return;
        rows.forEach((r) => {
            dest.appendChild(buildEquipmentCustodyRow({
                ...r,
                receivedBy: r.receivedBy || 'Storeman',
                remark: r.remark || 'From gate register'
            }));
        });
        selected.forEach((tr) => {
            const rem = tr.querySelector('.ri-remark');
            if (rem && !/pushed to techstores/i.test(rem.value)) {
                rem.value = `${rem.value ? rem.value + ' · ' : ''}Pushed to TechStores`;
            }
            const cb = tr.querySelector('.ri-select');
            if (cb) cb.checked = false;
        });
        showToast?.(`Pushed ${rows.length} line(s) to TechStores Equipment Register (custody only — inventory unchanged).`, 'success');
    };
    go();
}

function pushTechstoresToWorkshop() {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;
    const body = document.getElementById('techstores-equipment-register-table-body');
    const selected = [...(body?.querySelectorAll('tr') || [])].filter((tr) => tr.querySelector('.ri-select')?.checked);
    if (!selected.length) {
        showToast?.('Select one or more TechStores register entries to push.', 'info');
        return;
    }
    const rows = selected.map(readCustodyRow);
    for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        if (typeof validateCustodyRowDates === 'function') {
            const dateErr = validateCustodyRowDates(r, `TechStores row ${i + 1}`);
            if (dateErr) {
                showToast?.(dateErr, 'error');
                return;
            }
        }
        if (!r.equipmentType && !r.serialOrZa) {
            showToast?.('Entry needs Equipment Type or S/N / ZA No.', 'warning');
            return;
        }
        if (!requireSvcs1045(r, 'TechStores Equipment Register')) return;
    }
    const go = async () => {
        if (typeof navigateToModule === 'function') await navigateToModule('workshop-repairs');
        const dest = document.getElementById('workshop-repairs-table-body');
        if (!dest) return;
        rows.forEach((r) => {
            dest.appendChild(buildWorkshopRegisterRow({
                equipmentType: r.equipmentType,
                serialOrZa: r.serialOrZa,
                unit: r.unit,
                diagnosis: r.remark || '',
                remark: 'From TechStores Equipment Register',
                dateIn: r.dateIn || new Date().toISOString().slice(0, 10),
                receivedBy: r.receivedBy || '',
                svcs1045: r.svcs1045
            }));
        });
        selected.forEach((tr) => {
            const rem = tr.querySelector('.ri-remark');
            if (rem && !/pushed to workshop/i.test(rem.value)) {
                rem.value = `${rem.value ? rem.value + ' · ' : ''}Pushed to Workshop`;
            }
            const cb = tr.querySelector('.ri-select');
            if (cb) cb.checked = false;
        });
        showToast?.(`Pushed ${rows.length} line(s) to IT Workshop Register. Confirm SVCS 1045 on each line.`, 'success');
    };
    go();
}

function openSvcs1045FromRepair() {
    if (typeof navigateToModule === 'function') navigateToModule('zna-svcs-1045');
}

function initRepairIntakeModules() {
    if (document.documentElement.dataset.riInit === '1') return;
    document.documentElement.dataset.riInit = '1';

    document.getElementById('gateRegisterAddBtn')?.addEventListener('click', () => addGateRegisterRow());
    document.getElementById('gatePushTechstoresBtn')?.addEventListener('click', pushGateToTechstores);
    document.getElementById('gateOpen1045Btn')?.addEventListener('click', openSvcs1045FromRepair);

    document.getElementById('terAddBtn')?.addEventListener('click', () => addTechstoresEquipmentRegisterRow());
    document.getElementById('terPushWorkshopBtn')?.addEventListener('click', pushTechstoresToWorkshop);
    document.getElementById('terOpen1045Btn')?.addEventListener('click', openSvcs1045FromRepair);

    document.getElementById('wsAddBtn')?.addEventListener('click', () => addWorkshopRegisterRow());
    document.getElementById('wsOpen1045Btn')?.addEventListener('click', openSvcs1045FromRepair);

    document.addEventListener('click', (e) => {
        if (e.target.closest('#gateOpen1045Btn, #terOpen1045Btn, #wsOpen1045Btn, .ri-open-1045')) {
            e.preventDefault();
            openSvcs1045FromRepair();
        }
        const nav = e.target.closest('[data-pg-open]');
        if (nav?.id === 'gateOpen1045Btn') return;
    });
}

function ensureRepairIntakeTables() {
    ensureCustodySeed('gate-register-table-body', buildEquipmentCustodyRow);
    ensureCustodySeed('techstores-equipment-register-table-body', buildEquipmentCustodyRow);
    const ws = document.getElementById('workshop-repairs-table-body');
    if (ws && !ws.children.length) {
        ws.appendChild(buildWorkshopRegisterRow({ dateIn: new Date().toISOString().slice(0, 10) }));
    }
}

window.buildEquipmentCustodyRow = buildEquipmentCustodyRow;
window.buildWorkshopRegisterRow = buildWorkshopRegisterRow;
window.buildWorkshopRepairRow = buildWorkshopRepairRow;
window.addGateRegisterRow = addGateRegisterRow;
window.addTechstoresEquipmentRegisterRow = addTechstoresEquipmentRegisterRow;
window.addWorkshopRegisterRow = addWorkshopRegisterRow;
window.addWorkshopRepairRow = addWorkshopRepairRow;
window.pushGateToTechstores = pushGateToTechstores;
window.pushTechstoresToWorkshop = pushTechstoresToWorkshop;
window.initRepairIntakeModules = initRepairIntakeModules;
window.ensureRepairIntakeTables = ensureRepairIntakeTables;
