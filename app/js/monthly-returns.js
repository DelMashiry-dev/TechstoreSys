/* monthly-returns.js — Unit / Formation Monthly ICT Equipment Returns (RESTRICTED) */

const MR_REMARK_CODES = [
    { value: 'SVC', label: 'SVC — Serviceable' },
    { value: 'UNSVC', label: 'UN SVC — Unserviceable' },
    { value: 'T/LOAN', label: 'T/LOAN — Temporary loan' },
    { value: 'P/LOAN', label: 'P/LOAN — Permanent loan (laptop / iPad)' },
    { value: 'OTHER', label: 'Other (see remarks)' }
];

const MR_APPROVAL_ROLES = [
    'Dir', 'DD', 'Comdt', 'AQSO2', 'CI', 'AO',
    'OC Sys Admin', 'OC Engr', 'OC SW Engr', 'OC Sp Svc',
    'Tech Stores Offr', 'RSM', 'C/C'
];

const MR_CATEGORY_HINTS = [
    { key: 'HP LAPTOPS', match: /hp\s*laptop|laptop.*hp/i },
    { key: 'LAPTOPS', match: /laptop|notebook|macbook|latitude/i },
    { key: 'DESKTOPS / ALL-IN-ONE', match: /desktop|all[\s-]?in[\s-]?one|\baio\b|cpu\b/i },
    { key: 'MONITORS', match: /monitor|display|screen/i },
    { key: 'PRINTERS', match: /printer|mfp|multifunction|ricoh|laserjet/i },
    { key: 'PROJECTORS', match: /projector|benq|epson|sony/i },
    { key: 'MOUSE', match: /mouse/i },
    { key: 'KEYBOARDS', match: /keyboard/i },
    { key: 'TABLETS', match: /tablet|ipad/i },
    { key: 'EXTERNAL HARD DRIVE', match: /ext(ernal)?\s*h\.?d|hard\s*drive|hdd|ssd/i },
    { key: 'PLOTTERS', match: /plotter|designjet/i },
    { key: 'SOFTWARES', match: /licence|license|software|saas|cursor|office\s*365/i },
    { key: 'SPARES & PARTS', match: /spare|roller|fuser|drum|ram\b/i },
    { key: 'MISC CONT STORES', match: /drawing|protractor|compass|t-square|scale\s*ruler/i }
];

function mrEscape(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function ensureMonthlyReturns() {
    if (!appState) return [];
    if (!Array.isArray(appState.monthlyReturns)) appState.monthlyReturns = [];
    return appState.monthlyReturns;
}

function mrMonthLabel(ym) {
    if (!ym || !/^\d{4}-\d{2}$/.test(ym)) return ym || '—';
    const [y, m] = ym.split('-').map(Number);
    const names = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    return `${names[m - 1] || m} ${y}`;
}

function mrDefaultPeriodYm() {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

function mrGuessCategory(designation, description) {
    const hay = `${designation || ''} ${description || ''}`;
    for (const hint of MR_CATEGORY_HINTS) {
        if (hint.match.test(hay)) return hint.key;
    }
    return 'OTHER ICT EQUIPMENT';
}

function mrGuessModel(designation, description) {
    const desc = String(description || '').trim();
    if (desc) return desc;
    const name = String(designation || '').trim();
    const brand = name.match(/\b(HP|DELL|LENOVO|ASUS|ACER|APPLE|RICOH|EPSON|SONY|BENQ|OLIVETTI)\b/i);
    return brand ? brand[1].toUpperCase() : (name.split(/\s+/).slice(0, 2).join(' ') || '—');
}

function mrStatusToRemark(status) {
    const s = typeof normalizeIctAccStatus === 'function' ? normalizeIctAccStatus(status) : status;
    if (s === 'on_loan') return 'T/LOAN';
    if (s === 'unserviceable' || s === 'backloaded' || s === 'boarded' || s === 'condemned') return 'UNSVC';
    if (s === 'serviceable' || s === 'issued' || s === 'in_stores' || s === 'returned') return 'SVC';
    return 'OTHER';
}

function mrUnitMatches(holdingUnit, filterUnit) {
    if (!filterUnit) return true;
    const a = String(holdingUnit || '').trim().toLowerCase();
    const b = String(filterUnit || '').trim().toLowerCase();
    if (!a) return false;
    if (a === b) return true;
    const labelA = typeof resolveZnaUnitLabel === 'function' ? resolveZnaUnitLabel(holdingUnit) : holdingUnit;
    const labelB = typeof resolveZnaUnitLabel === 'function' ? resolveZnaUnitLabel(filterUnit) : filterUnit;
    return String(labelA || '').toLowerCase().includes(b)
        || String(labelB || '').toLowerCase().includes(a)
        || a.includes(b) || b.includes(a);
}

/**
 * Build return lines from ZNA ICT Asset Register for a holding unit.
 */
function collectMonthlyReturnLinesFromRegister(unit) {
    const list = typeof ensureIctAccountability === 'function' ? ensureIctAccountability() : [];
    return list
        .filter((rec) => {
            if (typeof ICT_ACC_CLOSED_STATUSES !== 'undefined' && ICT_ACC_CLOSED_STATUSES.has(normalizeIctAccStatus(rec.status))) {
                // Still show boarded/condemned if held by unit? Usually exclude struck-off
                if (['condemned', 'stolen', 'destroyed_natural', 'written_off'].includes(normalizeIctAccStatus(rec.status))) {
                    return false;
                }
            }
            return mrUnitMatches(rec.unit, unit);
        })
        .map((rec, i) => ({
            id: `mrl-${rec.id || i}`,
            sourceId: rec.id || '',
            category: mrGuessCategory(rec.designation, rec.description),
            model: mrGuessModel(rec.designation, rec.description),
            designation: rec.designation || '',
            serialNo: rec.serialNo || '',
            zaNumber: rec.zaNumber || '',
            qty: Number(rec.qty) || 1,
            remarkCode: mrStatusToRemark(rec.status),
            remarks: rec.remarks || rec.usReason || '',
            assetClass: rec.assetClass || 'equipment'
        }))
        .sort((a, b) => a.category.localeCompare(b.category)
            || a.designation.localeCompare(b.designation)
            || String(a.zaNumber).localeCompare(String(b.zaNumber)));
}

function groupMonthlyReturnLines(lines) {
    const map = new Map();
    (lines || []).forEach((line) => {
        const key = line.category || 'OTHER ICT EQUIPMENT';
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(line);
    });
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}

function createEmptyMonthlyReturn() {
    return {
        id: '',
        periodYm: mrDefaultPeriodYm(),
        unit: '',
        unitAddress: '',
        fileRef: '',
        letterDate: new Date().toISOString().slice(0, 10),
        subject: '',
        coveringText: 'Attached herewith is the above subject forwarded for your action.',
        actionTo: 'IT Dir',
        infoTo: 'File',
        compiledByNo: '',
        compiledByRank: '',
        compiledByName: '',
        compiledByDate: '',
        checkedByNo: '',
        checkedByRank: '',
        checkedByName: '',
        checkedByDate: '',
        signedBy: '',
        signedRank: '',
        signedFor: 'CO / Comdt',
        status: 'draft',
        lines: [],
        miscStores: [],
        approvals: MR_APPROVAL_ROLES.map((role) => ({ role, signed: false, date: '', initials: '' })),
        notes: '',
        createdAt: '',
        updatedAt: ''
    };
}

function getActiveMonthlyReturn() {
    const id = document.getElementById('mrEditId')?.value || '';
    if (!id) return null;
    return ensureMonthlyReturns().find((r) => r.id === id) || null;
}

function readMonthlyReturnForm() {
    const lines = [];
    document.querySelectorAll('#mrLinesBody tr[data-line-id]').forEach((tr) => {
        lines.push({
            id: tr.getAttribute('data-line-id') || `mrl-${Date.now()}`,
            sourceId: tr.getAttribute('data-source-id') || '',
            category: tr.querySelector('.mr-line-cat')?.value?.trim() || 'OTHER ICT EQUIPMENT',
            model: tr.querySelector('.mr-line-model')?.value?.trim() || '',
            designation: tr.querySelector('.mr-line-desig')?.value?.trim() || '',
            serialNo: tr.querySelector('.mr-line-serial')?.value?.trim() || '',
            zaNumber: tr.querySelector('.mr-line-za')?.value?.trim() || '',
            qty: parseFloat(tr.querySelector('.mr-line-qty')?.value) || 1,
            remarkCode: tr.querySelector('.mr-line-remark')?.value || 'SVC',
            remarks: tr.querySelector('.mr-line-notes')?.value?.trim() || '',
            assetClass: tr.getAttribute('data-asset-class') || 'equipment'
        });
    });

    const miscStores = [];
    document.querySelectorAll('#mrMiscBody tr[data-misc-id]').forEach((tr) => {
        const model = tr.querySelector('.mr-misc-model')?.value?.trim() || '';
        if (!model) return;
        miscStores.push({
            id: tr.getAttribute('data-misc-id') || `misc-${Date.now()}`,
            model,
            qty: parseFloat(tr.querySelector('.mr-misc-qty')?.value) || 0,
            remarkCode: tr.querySelector('.mr-misc-remark')?.value || 'SVC'
        });
    });

    const approvals = MR_APPROVAL_ROLES.map((role, i) => {
        const row = document.querySelector(`#mrApprovalsBody tr[data-role-idx="${i}"]`);
        return {
            role,
            signed: !!row?.querySelector('.mr-appr-signed')?.checked,
            date: row?.querySelector('.mr-appr-date')?.value || '',
            initials: row?.querySelector('.mr-appr-init')?.value?.trim() || ''
        };
    });

    const periodYm = document.getElementById('mrPeriod')?.value || mrDefaultPeriodYm();
    const unit = document.getElementById('mrUnit')?.value || '';
    const unitLabel = typeof resolveZnaUnitLabel === 'function' ? resolveZnaUnitLabel(unit) : unit;

    return {
        id: document.getElementById('mrEditId')?.value || '',
        periodYm,
        periodLabel: mrMonthLabel(periodYm),
        unit,
        unitLabel: unitLabel || unit,
        unitAddress: document.getElementById('mrUnitAddress')?.value?.trim() || '',
        fileRef: document.getElementById('mrFileRef')?.value?.trim() || '',
        letterDate: document.getElementById('mrLetterDate')?.value || '',
        subject: document.getElementById('mrSubject')?.value?.trim()
            || `${unitLabel || unit || 'UNIT'} MONTHLY COMPUTER EQUIPMENT RETURN FOR ${mrMonthLabel(periodYm).toUpperCase()}`,
        coveringText: document.getElementById('mrCoverText')?.value?.trim()
            || 'Attached herewith is the above subject forwarded for your action.',
        actionTo: document.getElementById('mrActionTo')?.value?.trim() || 'IT Dir',
        infoTo: document.getElementById('mrInfoTo')?.value?.trim() || 'File',
        compiledByNo: document.getElementById('mrCompiledNo')?.value?.trim() || '',
        compiledByRank: document.getElementById('mrCompiledRank')?.value?.trim() || '',
        compiledByName: document.getElementById('mrCompiledName')?.value?.trim() || '',
        compiledByDate: document.getElementById('mrCompiledDate')?.value || '',
        checkedByNo: document.getElementById('mrCheckedNo')?.value?.trim() || '',
        checkedByRank: document.getElementById('mrCheckedRank')?.value?.trim() || '',
        checkedByName: document.getElementById('mrCheckedName')?.value?.trim() || '',
        checkedByDate: document.getElementById('mrCheckedDate')?.value || '',
        signedBy: document.getElementById('mrSignedBy')?.value?.trim() || '',
        signedRank: document.getElementById('mrSignedRank')?.value?.trim() || '',
        signedFor: document.getElementById('mrSignedFor')?.value?.trim() || 'CO / Comdt',
        status: document.getElementById('mrStatus')?.value || 'draft',
        notes: document.getElementById('mrNotes')?.value?.trim() || '',
        lines,
        miscStores,
        approvals
    };
}

function mrRemarkOptionsHtml(selected) {
    return MR_REMARK_CODES.map((c) =>
        `<option value="${mrEscape(c.value)}"${c.value === selected ? ' selected' : ''}>${mrEscape(c.label)}</option>`
    ).join('');
}

function renderMonthlyReturnLines(lines) {
    const tbody = document.getElementById('mrLinesBody');
    if (!tbody) return;
    if (!lines?.length) {
        tbody.innerHTML = `<tr><td colspan="9" class="req-empty-row">No equipment lines yet. Select unit + period, then click “Load from Asset Register”, or add a blank line.</td></tr>`;
        return;
    }
    tbody.innerHTML = lines.map((line) => `
        <tr data-line-id="${mrEscape(line.id)}" data-source-id="${mrEscape(line.sourceId || '')}" data-asset-class="${mrEscape(line.assetClass || 'equipment')}">
            <td><input type="text" class="form-control mr-line-cat" value="${mrEscape(line.category)}" title="Category heading on the return"></td>
            <td><input type="text" class="form-control mr-line-model" value="${mrEscape(line.model)}" placeholder="HP / DELL…"></td>
            <td><input type="text" class="form-control mr-line-desig" value="${mrEscape(line.designation)}" placeholder="Description"></td>
            <td><input type="text" class="form-control mr-line-serial" value="${mrEscape(line.serialNo)}" placeholder="Mfr serial"></td>
            <td><input type="text" class="form-control mr-line-za" value="${mrEscape(line.zaNumber)}" placeholder="ZA …"></td>
            <td><input type="number" class="form-control mr-line-qty" min="1" step="1" value="${Number(line.qty) || 1}"></td>
            <td><select class="form-control mr-line-remark">${mrRemarkOptionsHtml(line.remarkCode || 'SVC')}</select></td>
            <td><input type="text" class="form-control mr-line-notes" value="${mrEscape(line.remarks)}" placeholder="Cable / mouse U/S…"></td>
            <td><button type="button" class="btn btn-danger btn-sm mr-remove-line">Remove</button></td>
        </tr>
    `).join('');
}

function renderMonthlyReturnMisc(misc) {
    const tbody = document.getElementById('mrMiscBody');
    if (!tbody) return;
    const rows = misc?.length ? misc : [{ id: `misc-${Date.now()}`, model: '', qty: 0, remarkCode: 'SVC' }];
    tbody.innerHTML = rows.map((row) => `
        <tr data-misc-id="${mrEscape(row.id)}">
            <td><input type="text" class="form-control mr-misc-model" value="${mrEscape(row.model)}" placeholder="e.g. PORTABLE DRAWING BOARD"></td>
            <td><input type="number" class="form-control mr-misc-qty" min="0" step="1" value="${Number(row.qty) || 0}"></td>
            <td><select class="form-control mr-misc-remark">${mrRemarkOptionsHtml(row.remarkCode || 'SVC')}</select></td>
            <td><button type="button" class="btn btn-danger btn-sm mr-remove-misc">Remove</button></td>
        </tr>
    `).join('');
}

function renderMonthlyReturnApprovals(approvals) {
    const tbody = document.getElementById('mrApprovalsBody');
    if (!tbody) return;
    const list = approvals?.length ? approvals : MR_APPROVAL_ROLES.map((role) => ({ role, signed: false, date: '', initials: '' }));
    tbody.innerHTML = list.map((a, i) => `
        <tr data-role-idx="${i}">
            <td><strong>${mrEscape(a.role)}</strong></td>
            <td style="text-align:center"><input type="checkbox" class="mr-appr-signed"${a.signed ? ' checked' : ''}></td>
            <td><input type="date" class="form-control mr-appr-date" value="${mrEscape(a.date || '')}"></td>
            <td><input type="text" class="form-control mr-appr-init" value="${mrEscape(a.initials || '')}" placeholder="Sig / SD"></td>
        </tr>
    `).join('');
}

function fillMonthlyReturnForm(rec) {
    const set = (id, v) => {
        const el = document.getElementById(id);
        if (el) el.value = v ?? '';
    };
    const blank = createEmptyMonthlyReturn();
    const r = { ...blank, ...(rec || {}) };
    set('mrEditId', r.id || '');
    set('mrPeriod', r.periodYm || mrDefaultPeriodYm());
    if (typeof fillZnaUnitSelect === 'function') {
        fillZnaUnitSelect(document.getElementById('mrUnit'), r.unit || '', { includeBlank: true, includeOther: true });
        const uf = document.getElementById('mrUnitFilter');
        if (uf) uf.value = '';
    } else {
        set('mrUnit', r.unit || '');
    }
    set('mrUnitAddress', r.unitAddress || '');
    set('mrFileRef', r.fileRef || '');
    set('mrLetterDate', r.letterDate || new Date().toISOString().slice(0, 10));
    set('mrSubject', r.subject || '');
    set('mrCoverText', r.coveringText || blank.coveringText);
    set('mrActionTo', r.actionTo || 'IT Dir');
    set('mrInfoTo', r.infoTo || 'File');
    set('mrCompiledNo', r.compiledByNo || '');
    set('mrCompiledRank', r.compiledByRank || '');
    set('mrCompiledName', r.compiledByName || '');
    set('mrCompiledDate', r.compiledByDate || '');
    set('mrCheckedNo', r.checkedByNo || '');
    set('mrCheckedRank', r.checkedByRank || '');
    set('mrCheckedName', r.checkedByName || '');
    set('mrCheckedDate', r.checkedByDate || '');
    set('mrSignedBy', r.signedBy || '');
    set('mrSignedRank', r.signedRank || '');
    set('mrSignedFor', r.signedFor || 'CO / Comdt');
    set('mrStatus', r.status || 'draft');
    set('mrNotes', r.notes || '');
    renderMonthlyReturnLines(r.lines || []);
    renderMonthlyReturnMisc(r.miscStores || []);
    renderMonthlyReturnApprovals(r.approvals || []);
    const title = document.getElementById('mrFormTitle');
    if (title) {
        title.textContent = r.id
            ? `Edit return — ${r.unitLabel || r.unit || 'Unit'} · ${r.periodLabel || mrMonthLabel(r.periodYm)}`
            : 'Prepare Monthly Return';
    }
}

function clearMonthlyReturnForm() {
    fillMonthlyReturnForm(createEmptyMonthlyReturn());
    document.getElementById('mrEditId').value = '';
}

function loadMonthlyReturnFromRegister() {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;
    const unit = document.getElementById('mrUnit')?.value || '';
    if (!unit) {
        if (typeof showToast === 'function') showToast('Select the unit / formation first.', 'error');
        document.getElementById('mrUnit')?.focus();
        return;
    }
    const lines = collectMonthlyReturnLinesFromRegister(unit);
    renderMonthlyReturnLines(lines);
    const unitLabel = typeof resolveZnaUnitLabel === 'function' ? resolveZnaUnitLabel(unit) : unit;
    const periodYm = document.getElementById('mrPeriod')?.value || mrDefaultPeriodYm();
    const subj = document.getElementById('mrSubject');
    if (subj && !subj.value.trim()) {
        subj.value = `${String(unitLabel || unit).toUpperCase()} MONTHLY COMPUTER EQUIPMENT RETURN FOR ${mrMonthLabel(periodYm).toUpperCase()}`;
    }
    if (typeof showToast === 'function') {
        showToast(lines.length
            ? `Loaded ${lines.length} line(s) from ZNA ICT Asset Register for ${unitLabel || unit}.`
            : `No register assets found for ${unitLabel || unit}. Add blank lines or update Asset Register holding unit.`, lines.length ? 'success' : 'warning');
    }
}

function addMonthlyReturnBlankLine() {
    const tbody = document.getElementById('mrLinesBody');
    if (!tbody) return;
    if (tbody.querySelector('.req-empty-row')) tbody.innerHTML = '';
    const id = `mrl-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
    const tr = document.createElement('tr');
    tr.setAttribute('data-line-id', id);
    tr.innerHTML = `
        <td><input type="text" class="form-control mr-line-cat" value="OTHER ICT EQUIPMENT"></td>
        <td><input type="text" class="form-control mr-line-model" placeholder="HP / DELL…"></td>
        <td><input type="text" class="form-control mr-line-desig" placeholder="Description"></td>
        <td><input type="text" class="form-control mr-line-serial" placeholder="Mfr serial"></td>
        <td><input type="text" class="form-control mr-line-za" placeholder="ZA …"></td>
        <td><input type="number" class="form-control mr-line-qty" min="1" step="1" value="1"></td>
        <td><select class="form-control mr-line-remark">${mrRemarkOptionsHtml('SVC')}</select></td>
        <td><input type="text" class="form-control mr-line-notes"></td>
        <td><button type="button" class="btn btn-danger btn-sm mr-remove-line">Remove</button></td>
    `;
    tbody.appendChild(tr);
}

function addMonthlyReturnMiscRow() {
    const tbody = document.getElementById('mrMiscBody');
    if (!tbody) return;
    const tr = document.createElement('tr');
    tr.setAttribute('data-misc-id', `misc-${Date.now()}`);
    tr.innerHTML = `
        <td><input type="text" class="form-control mr-misc-model" placeholder="Item description"></td>
        <td><input type="number" class="form-control mr-misc-qty" min="0" step="1" value="1"></td>
        <td><select class="form-control mr-misc-remark">${mrRemarkOptionsHtml('SVC')}</select></td>
        <td><button type="button" class="btn btn-danger btn-sm mr-remove-misc">Remove</button></td>
    `;
    tbody.appendChild(tr);
}

function saveMonthlyReturnFromForm() {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;
    const data = readMonthlyReturnForm();
    if (!data.unit) {
        if (typeof showToast === 'function') showToast('Select the unit / formation preparing this return.', 'error');
        return;
    }
    if (!data.periodYm) {
        if (typeof showToast === 'function') showToast('Select the return month.', 'error');
        return;
    }
    if (!data.lines.length && !data.miscStores.length) {
        if (typeof showToast === 'function') showToast('Add equipment lines or misc stores before saving.', 'error');
        return;
    }

    const list = ensureMonthlyReturns();
    const now = new Date().toISOString();
    if (data.id) {
        const idx = list.findIndex((r) => r.id === data.id);
        if (idx < 0) {
            if (typeof showToast === 'function') showToast('Return not found.', 'error');
            return;
        }
        list[idx] = { ...list[idx], ...data, updatedAt: now };
        if (typeof showToast === 'function') showToast(`Updated monthly return for ${data.unitLabel || data.unit}.`, 'success');
    } else {
        const rec = {
            ...data,
            id: `mr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            createdAt: now,
            updatedAt: now
        };
        list.unshift(rec);
        document.getElementById('mrEditId').value = rec.id;
        if (typeof showToast === 'function') showToast(`Saved monthly return · ${data.periodLabel} · ${data.unitLabel || data.unit}.`, 'success');
    }
    if (list.length > 80) list.length = 80;
    if (typeof saveState === 'function') saveState();
    refreshMonthlyReturnsList();
    fillMonthlyReturnForm(ensureMonthlyReturns().find((r) => r.id === (document.getElementById('mrEditId')?.value)) || data);
}

function refreshMonthlyReturnsList() {
    const tbody = document.getElementById('mrSavedBody');
    if (!tbody) return;
    const q = String(document.getElementById('mrListSearch')?.value || '').trim().toLowerCase();
    const rows = ensureMonthlyReturns().filter((r) => {
        if (!q) return true;
        const hay = `${r.periodLabel} ${r.periodYm} ${r.unit} ${r.unitLabel} ${r.fileRef} ${r.status}`.toLowerCase();
        return hay.includes(q);
    });
    if (!rows.length) {
        tbody.innerHTML = `<tr><td colspan="6" class="req-empty-row">No saved monthly returns yet. Each unit must prepare one per month.</td></tr>`;
        return;
    }
    tbody.innerHTML = rows.map((r) => {
        const svc = (r.lines || []).filter((l) => l.remarkCode === 'SVC').length;
        const uns = (r.lines || []).filter((l) => l.remarkCode === 'UNSVC').length;
        const loan = (r.lines || []).filter((l) => l.remarkCode === 'T/LOAN').length;
        return `
            <tr>
                <td>${mrEscape(r.periodLabel || mrMonthLabel(r.periodYm))}</td>
                <td>${mrEscape(r.unitLabel || r.unit)}</td>
                <td>${mrEscape(r.fileRef || '—')}</td>
                <td>${(r.lines || []).length} eq · ${(r.miscStores || []).length} misc<br>
                    <small>SVC ${svc} · UNSVC ${uns} · Loan ${loan}</small></td>
                <td>${mrEscape(r.status || 'draft')}</td>
                <td>
                    <button type="button" class="btn btn-ghost btn-sm" data-mr-action="edit" data-mr-id="${mrEscape(r.id)}">Edit</button>
                    <button type="button" class="btn btn-secondary btn-sm" data-mr-action="print" data-mr-id="${mrEscape(r.id)}">Print</button>
                    <button type="button" class="btn btn-danger btn-sm" data-mr-action="delete" data-mr-id="${mrEscape(r.id)}">Delete</button>
                </td>
            </tr>
        `;
    }).join('');
}

function editMonthlyReturn(id) {
    const rec = ensureMonthlyReturns().find((r) => r.id === id);
    if (!rec) return;
    fillMonthlyReturnForm(rec);
    document.getElementById('monthly-returns')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function deleteMonthlyReturn(id) {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;
    const list = ensureMonthlyReturns();
    const rec = list.find((r) => r.id === id);
    if (!rec) return;
    if (!window.confirm(`Delete monthly return for ${rec.unitLabel || rec.unit} (${rec.periodLabel || rec.periodYm})?`)) return;
    appState.monthlyReturns = list.filter((r) => r.id !== id);
    if (document.getElementById('mrEditId')?.value === id) clearMonthlyReturnForm();
    if (typeof saveState === 'function') saveState();
    refreshMonthlyReturnsList();
    if (typeof showToast === 'function') showToast('Monthly return deleted.', 'info');
}

function buildMonthlyReturnOfficialHtml(rec) {
    const r = rec || readMonthlyReturnForm();
    const groups = groupMonthlyReturnLines(r.lines || []);
    const unitTitle = (r.unitLabel || r.unit || 'UNIT').toUpperCase();
    const period = (r.periodLabel || mrMonthLabel(r.periodYm) || '').toUpperCase();

    const equipmentTables = groups.map(([cat, lines]) => {
        const qtyMode = lines.every((l) => !l.zaNumber && !l.serialNo && (Number(l.qty) || 0) > 1);
        const rows = lines.map((l, i) => {
            const ser = String(i + 1).padStart(2, '0');
            if (qtyMode) {
                return `<tr><td>${ser}</td><td>${mrEscape(l.designation || l.model)}</td><td>${mrEscape(l.qty)}</td><td>${mrEscape(l.remarkCode)}</td></tr>`;
            }
            return `<tr>
                <td>${ser}</td>
                <td>${mrEscape(l.model || '—')}</td>
                <td>${mrEscape(l.serialNo || '—')}</td>
                <td>${mrEscape(l.zaNumber || '—')}</td>
                <td>${mrEscape(l.remarkCode)}</td>
                <td>${mrEscape(l.remarks || '')}</td>
            </tr>`;
        }).join('');
        const head = qtyMode
            ? '<tr><th>(a) SERIAL</th><th>(b) MODEL / ITEM</th><th>(c) QTY</th><th>(d) REMARK</th></tr>'
            : '<tr><th>(a) SERIAL</th><th>(b) MODEL</th><th>(c) SERIAL NUMBER</th><th>(d) ZA SERIAL</th><th>(e) REMARK</th><th>(f) NOTES</th></tr>';
        return `
            <h4 class="mr-cat-head">${mrEscape(cat)}</h4>
            <table class="mr-official-table">${head}${rows}</table>
        `;
    }).join('');

    const misc = (r.miscStores || []).filter((m) => m.model);
    const miscHtml = misc.length ? `
        <h4 class="mr-cat-head">MISC CONT STORES</h4>
        <table class="mr-official-table">
            <tr><th>(a) SERIAL</th><th>(b) MODEL</th><th>(c) QTY</th><th>(d) REMARK</th></tr>
            ${misc.map((m, i) => `<tr><td>${String(i + 1).padStart(2, '0')}</td><td>${mrEscape(m.model)}</td><td>${mrEscape(m.qty)}</td><td>${mrEscape(m.remarkCode)}</td></tr>`).join('')}
        </table>
    ` : '';

    const approvals = (r.approvals || []).map((a) => `
        <tr>
            <td>${mrEscape(a.role)}</td>
            <td>${a.signed ? mrEscape(a.initials || '✓') : ''}</td>
            <td>${mrEscape(a.date || '')}</td>
        </tr>
    `).join('');

    return `
    <div class="mr-official-doc">
        <div class="mr-class">RESTRICTED</div>

        <div class="mr-cover">
            <div class="mr-cover-top">
                <div>
                    <div class="mr-unit-name">${mrEscape(unitTitle)}</div>
                    <div class="mr-unit-addr">${mrEscape(r.unitAddress || '')}</div>
                    <div class="mr-ref">Ref: ${mrEscape(r.fileRef || '—')}</div>
                </div>
                <div class="mr-cover-date">${mrEscape(r.letterDate || '')}</div>
            </div>
            <p class="mr-subject"><strong>SUBJECT:</strong> ${mrEscape(r.subject || `${unitTitle} MONTHLY COMPUTER EQUIPMENT RETURN FOR ${period}`)}</p>
            <p>${mrEscape(r.coveringText || '')}</p>
            <p class="mr-signed">
                ${mrEscape(r.signedBy || '……………………')}<br>
                ${mrEscape(r.signedRank || '')}<br>
                <em>for ${mrEscape(r.signedFor || 'CO / Comdt')}</em>
            </p>
            <p><strong>Action:</strong> ${mrEscape(r.actionTo || 'IT Dir')}<br>
               <strong>Info:</strong> ${mrEscape(r.infoTo || 'File')}<br>
               <strong>Enclosure:</strong> Monthly computer equipment returns (01)</p>
        </div>

        <div class="mr-page-break"></div>

        <div class="mr-class">RESTRICTED</div>
        <h2 class="mr-title">${mrEscape(unitTitle)} MONTHLY COMPUTER EQUIPMENT RETURN AS AT ${mrEscape(period)}</h2>
        <p class="mr-lead">INFORMATION AND TECHNOLOGY EQUIPMENT RETURN — grouped by category. Remarks: SVC = Serviceable · UNSVC = Unserviceable · T/LOAN = Temporary loan · P/LOAN = Permanent loan.</p>

        ${equipmentTables || '<p>No equipment lines.</p>'}
        ${miscHtml}

        <div class="mr-sign-block">
            <div>
                <strong>COMPILED BY</strong><br>
                NO: ${mrEscape(r.compiledByNo || '………')}<br>
                RANK: ${mrEscape(r.compiledByRank || '………')}<br>
                NAME: ${mrEscape(r.compiledByName || '………')}<br>
                DATE: ${mrEscape(r.compiledByDate || '………')}
            </div>
            <div>
                <strong>CHECKED BY</strong><br>
                NO: ${mrEscape(r.checkedByNo || '………')}<br>
                RANK: ${mrEscape(r.checkedByRank || '………')}<br>
                NAME: ${mrEscape(r.checkedByName || '………')}<br>
                DATE: ${mrEscape(r.checkedByDate || '………')}
            </div>
        </div>

        <h4 class="mr-cat-head">IT DIR ROUTING / SIGN-OFF</h4>
        <table class="mr-official-table mr-appr-table">
            <tr><th>APPT</th><th>SIGNATURE</th><th>DATE</th></tr>
            ${approvals}
        </table>

        ${r.notes ? `<p class="mr-notes"><strong>Notes:</strong> ${mrEscape(r.notes)}</p>` : ''}
        <div class="mr-class mr-class-foot">RESTRICTED</div>
    </div>`;
}

function printMonthlyReturnOfficial(id) {
    const rec = id
        ? ensureMonthlyReturns().find((r) => r.id === id)
        : readMonthlyReturnForm();
    if (!rec || (!(rec.lines || []).length && !(rec.miscStores || []).length && !id)) {
        // allow print of current form even if unsaved
        const live = readMonthlyReturnForm();
        if (!(live.lines || []).length && !(live.miscStores || []).length) {
            if (typeof showToast === 'function') showToast('Nothing to print — load or add lines first.', 'error');
            return;
        }
    }
    const data = id ? ensureMonthlyReturns().find((r) => r.id === id) : readMonthlyReturnForm();
    const html = buildMonthlyReturnOfficialHtml(data);
    if (typeof runOfficialPrint === 'function') {
        runOfficialPrint(() => {
            let host = document.getElementById('mr-print-host');
            if (!host) {
                host = document.createElement('div');
                host.id = 'mr-print-host';
                host.className = 'mr-print-host';
                document.body.appendChild(host);
            }
            host.innerHTML = html;
            host.classList.add('print-target');
            document.body.classList.add('is-printing', 'printing-monthly-returns');
        });
        return;
    }
    let host = document.getElementById('mr-print-host');
    if (!host) {
        host = document.createElement('div');
        host.id = 'mr-print-host';
        host.className = 'mr-print-host';
        document.body.appendChild(host);
    }
    host.innerHTML = html;
    host.classList.add('print-target');
    document.body.classList.add('is-printing', 'printing-monthly-returns');
    window.print();
}

function buildMonthlyReturnsReportData() {
    const live = readMonthlyReturnForm();
    const html = buildMonthlyReturnOfficialHtml(live);
    const svc = (live.lines || []).filter((l) => l.remarkCode === 'SVC').length;
    const uns = (live.lines || []).filter((l) => l.remarkCode === 'UNSVC').length;
    return {
        title: `Monthly Return — ${live.unitLabel || live.unit || 'Unit'} · ${live.periodLabel || ''}`,
        layout: 'monthly-returns',
        html,
        summary: [
            `Unit: ${live.unitLabel || live.unit || '—'}`,
            `Period: ${live.periodLabel || live.periodYm}`,
            `Equipment lines: ${(live.lines || []).length}`,
            `SVC: ${svc} · UNSVC: ${uns}`,
            `Misc stores: ${(live.miscStores || []).length}`,
            `Status: ${live.status || 'draft'}`
        ],
        fields: [
            { label: 'Classification', value: 'RESTRICTED' },
            { label: 'Action', value: live.actionTo || 'IT Dir' },
            { label: 'File ref', value: live.fileRef || '—' }
        ],
        tables: []
    };
}

function renderMonthlyReturnsModule() {
    refreshMonthlyReturnsList();
}

function initMonthlyReturnsModule() {
    const host = document.getElementById('monthly-returns');
    if (!host || host.dataset.mrInit === '1') return;
    host.dataset.mrInit = '1';

    if (typeof fillZnaUnitSelect === 'function') {
        fillZnaUnitSelect(document.getElementById('mrUnit'), '', { includeBlank: true, includeOther: true });
        if (typeof wireZnaUnitPicker === 'function') {
            wireZnaUnitPicker(document.getElementById('mrUnit'), document.getElementById('mrUnitFilter'));
        }
    }

    clearMonthlyReturnForm();
    refreshMonthlyReturnsList();

    document.getElementById('mrLoadRegisterBtn')?.addEventListener('click', loadMonthlyReturnFromRegister);
    document.getElementById('mrAddLineBtn')?.addEventListener('click', addMonthlyReturnBlankLine);
    document.getElementById('mrAddMiscBtn')?.addEventListener('click', addMonthlyReturnMiscRow);
    document.getElementById('mrSaveBtn')?.addEventListener('click', saveMonthlyReturnFromForm);
    document.getElementById('mrClearBtn')?.addEventListener('click', clearMonthlyReturnForm);
    document.getElementById('mrPrintBtn')?.addEventListener('click', () => printMonthlyReturnOfficial());
    document.getElementById('mrListSearch')?.addEventListener('input', refreshMonthlyReturnsList);

    document.getElementById('mrLinesBody')?.addEventListener('click', (e) => {
        if (e.target.closest('.mr-remove-line')) e.target.closest('tr')?.remove();
    });
    document.getElementById('mrMiscBody')?.addEventListener('click', (e) => {
        if (e.target.closest('.mr-remove-misc')) e.target.closest('tr')?.remove();
    });
    document.getElementById('mrSavedBody')?.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-mr-action]');
        if (!btn) return;
        const id = btn.getAttribute('data-mr-id');
        const action = btn.getAttribute('data-mr-action');
        if (action === 'edit') editMonthlyReturn(id);
        if (action === 'print') printMonthlyReturnOfficial(id);
        if (action === 'delete') deleteMonthlyReturn(id);
    });
}
