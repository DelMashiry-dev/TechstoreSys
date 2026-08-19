/* ict-distribution.js — Proposed / Final / Next ICT equipment distribution lists */

const ICT_DIST_EQ_TYPES = [
    { value: 'laptops', label: 'Laptops' },
    { value: 'desktops', label: 'Desktops' },
    { value: 'printers', label: 'Printers' },
    { value: 'tablets', label: 'Tablets' },
    { value: 'mixed', label: 'Mixed ICT' }
];

const ICT_DIST_NEED = [
    { value: '', label: '—' },
    { value: 'yes', label: 'Yes — new issue' },
    { value: 'no', label: 'No — retain' },
    { value: 'review', label: 'Review' }
];

let _ictDistActiveTab = 'proposed';
let _ictDistRowFilter = '';
let _ictDistInited = false;

function ictDistEscape(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function ensureIctDistribution() {
    if (!appState.ictDistributionLists) appState.ictDistributionLists = [];
    if (!Array.isArray(appState.ictDistributionLists)) appState.ictDistributionLists = [];
    return appState.ictDistributionLists;
}

function createIctDistRow(partial = {}) {
    return {
        id: partial.id || `idr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        rank: String(partial.rank || '').trim(),
        name: String(partial.name || '').trim(),
        appointment: String(partial.appointment || '').trim(),
        unit: String(partial.unit || '').trim(),
        forceNo: String(partial.forceNo || '').trim(),
        initialIssue: String(partial.initialIssue || '').trim() || 'NIL',
        zaSerial: String(partial.zaSerial || '').trim() || 'NIL',
        remarks: String(partial.remarks || '').trim(),
        needIssue: String(partial.needIssue || '').trim(),
        linkedZa: String(partial.linkedZa || '').trim(),
        sourceHint: String(partial.sourceHint || '').trim()
    };
}

function createIctDistExercise(partial = {}) {
    const now = new Date().toISOString();
    return {
        id: partial.id || `idx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title: String(partial.title || 'Proposed distribution of ICT equipment').trim(),
        equipmentType: partial.equipmentType || 'laptops',
        status: partial.status || 'draft',
        createdAt: partial.createdAt || now,
        updatedAt: partial.updatedAt || now,
        createdBy: partial.createdBy || currentUser?.name || currentUser?.username || 'TechStores',
        proposed: Array.isArray(partial.proposed) ? partial.proposed.map(createIctDistRow) : [],
        final: Array.isArray(partial.final) ? partial.final.map(createIctDistRow) : [],
        next: Array.isArray(partial.next) ? partial.next.map(createIctDistRow) : []
    };
}

function getActiveIctDistId() {
    return appState.ictDistributionActiveId || ensureIctDistribution()[0]?.id || '';
}

function setActiveIctDistId(id) {
    appState.ictDistributionActiveId = id || '';
}

function getActiveIctDistExercise() {
    const list = ensureIctDistribution();
    const id = getActiveIctDistId();
    let ex = list.find((e) => e.id === id);
    if (!ex && list.length) {
        ex = list[0];
        setActiveIctDistId(ex.id);
    }
    return ex || null;
}

function getIctDistBucket(ex, tab) {
    if (!ex) return [];
    if (tab === 'final') return ex.final;
    if (tab === 'next') return ex.next;
    return ex.proposed;
}

function setIctDistBucket(ex, tab, rows) {
    if (!ex) return;
    if (tab === 'final') ex.final = rows;
    else if (tab === 'next') ex.next = rows;
    else ex.proposed = rows;
}

function ictDistFormatIssueDate(iso) {
    if (!iso) return '';
    const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return String(iso);
    return `${m[3]}/${m[2]}/${m[1].slice(2)}`;
}

function ictDistConditionLabel(status) {
    const s = String(status || '').toLowerCase();
    if (s === 'unserviceable') return 'u/s';
    if (s === 'serviceable' || s === 'issued' || s === 'on_loan' || s === 'in_stores') return 's';
    if (s === 'stolen' || s === 'destroyed' || s === 'boarded' || s === 'condemned' || s === 'backloaded') {
        return s === 'stolen' ? 'stolen' : s === 'destroyed' ? 'destroyed' : 'u/s';
    }
    return s || '—';
}

function ictDistConditionClass(condition) {
    return String(condition || 'unknown')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-');
}

function ictDistMatchesEquipment(rec, eqFilter) {
    if (!eqFilter) return true;
    const blob = `${rec.designation || ''} ${rec.description || ''} ${rec.assetClass || ''}`.toLowerCase();
    if (eqFilter === 'laptop') return /\blaptop|notebook|elitebook|thinkpad|macbook\b/.test(blob);
    if (eqFilter === 'desktop') return /\bdesktop|optiplex|tower|workstation\b/.test(blob);
    if (eqFilter === 'printer') return /\bprinter|mfp|laserjet|inkjet\b/.test(blob);
    if (eqFilter === 'tablet') return /\btablet|ipad|galaxy\s*tab\b/.test(blob);
    return true;
}

/** Aggregate prior issues for a person/unit from the ICT asset register. */
function lookupIctPriorIssues(query, eqFilter) {
    const q = String(query || '').trim().toLowerCase();
    if (!q || q.length < 2) return [];

    const register = typeof ensureIctAccountability === 'function'
        ? ensureIctAccountability()
        : (appState.ictAccountability || []);

    const byHolder = new Map();
    const zaQ = typeof normalizeZaNumber === 'function' ? normalizeZaNumber(q) : '';

    register.forEach((rec) => {
        if (!ictDistMatchesEquipment(rec, eqFilter)) return;
        const holder = String(rec.holderName || '').trim();
        const unit = String(rec.unit || '').trim();
        const force = String(rec.forceNo || '').trim();
        const za = String(rec.zaNumber || '').trim();
        const serial = String(rec.serialNo || '').trim();
        const hay = `${holder} ${unit} ${force} ${za} ${serial} ${rec.designation || ''}`.toLowerCase();
        const zaNorm = typeof normalizeZaNumber === 'function' ? normalizeZaNumber(za) : za.toUpperCase();
        const match = hay.includes(q)
            || (zaQ && zaNorm && zaNorm === zaQ)
            || (za && za.toLowerCase().includes(q.replace(/^za\s*/i, '')));
        if (!match) return;

        const key = (holder || unit || force || za || 'unknown').toLowerCase();
        if (!byHolder.has(key)) {
            byHolder.set(key, {
                name: holder || '—',
                forceNo: force,
                unit,
                issues: []
            });
        }
        byHolder.get(key).issues.push({
            date: rec.issueDate || rec.receivedDate || '',
            dateDisplay: ictDistFormatIssueDate(rec.issueDate || rec.receivedDate) || 'NIL',
            za: za || 'NIL',
            serial: serial || '',
            zaSerial: [za, serial].filter(Boolean).join(' / ') || 'NIL',
            status: rec.status || '',
            condition: ictDistConditionLabel(rec.status),
            designation: rec.designation || '',
            description: rec.description || '',
            recordId: rec.id
        });
    });

    return [...byHolder.values()].map((group) => {
        group.issues.sort((a, b) => String(a.date).localeCompare(String(b.date)));
        const dates = group.issues.map((i) => i.dateDisplay).filter((d) => d && d !== 'NIL');
        const zas = group.issues.map((i) => i.zaSerial).filter((z) => z && z !== 'NIL');
        const conditions = [...new Set(group.issues.map((i) => i.condition))];
        const latest = group.issues[group.issues.length - 1];
        const needsNew = conditions.includes('u/s')
            || conditions.includes('stolen')
            || conditions.includes('destroyed')
            || !dates.length;
        return {
            ...group,
            initialIssue: dates.length ? dates.join(' and ') : 'NIL',
            zaSerial: zas.length ? zas.join(' and ') : 'NIL',
            remarks: conditions.join(', ') || '—',
            needIssue: needsNew ? 'yes' : 'review',
            suggestion: needsNew
                ? 'Recommend new issue (NIL or U/S / loss)'
                : 'Has serviceable issue on record — review age / entitlement',
            latest
        };
    }).sort((a, b) => String(a.name).localeCompare(String(b.name)));
}

function suggestNeedFromRemarks(remarks, initialIssue) {
    const r = String(remarks || '').toLowerCase();
    const init = String(initialIssue || '').toUpperCase();
    if (init === 'NIL' || !init.trim()) return 'yes';
    if (/\bu\/s\b|unserviceable|stolen|destroyed|nil\b/.test(r)) return 'yes';
    if (/^s$|\bserviceable\b/.test(r)) return 'review';
    return 'review';
}

function saveIctDistExerciseMeta() {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;
    const ex = getActiveIctDistExercise();
    if (!ex) {
        showToast('Create a distribution exercise first.', 'error');
        return;
    }
    ex.title = (document.getElementById('ictDistTitleInput')?.value || ex.title).trim()
        || 'ICT equipment distribution';
    ex.equipmentType = document.getElementById('ictDistEqType')?.value || ex.equipmentType;
    ex.status = document.getElementById('ictDistStatus')?.value || ex.status;
    ex.updatedAt = new Date().toISOString();
    saveState();
    fillIctDistExerciseSelect();
    showToast('Distribution exercise saved.');
}

function createNewIctDistExercise() {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;
    const title = (document.getElementById('ictDistTitleInput')?.value || '').trim()
        || 'Proposed distribution of laptops to IT Dir personnel';
    const equipmentType = document.getElementById('ictDistEqType')?.value || 'laptops';
    const ex = createIctDistExercise({ title, equipmentType });
    ensureIctDistribution().unshift(ex);
    setActiveIctDistId(ex.id);
    saveState();
    fillIctDistExerciseSelect();
    syncIctDistMetaForm();
    renderIctDistTable();
    showToast('New distribution exercise created.');
}

function deleteActiveIctDistExercise() {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;
    const ex = getActiveIctDistExercise();
    if (!ex) return;
    if (!confirm(`Delete distribution exercise “${ex.title}”? This cannot be undone.`)) return;
    const list = ensureIctDistribution();
    const idx = list.findIndex((e) => e.id === ex.id);
    if (idx >= 0) list.splice(idx, 1);
    setActiveIctDistId(list[0]?.id || '');
    saveState();
    fillIctDistExerciseSelect();
    syncIctDistMetaForm();
    renderIctDistTable();
    showToast('Exercise deleted.');
}

function addIctDistBlankRow() {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;
    let ex = getActiveIctDistExercise();
    if (!ex) {
        createNewIctDistExercise();
        ex = getActiveIctDistExercise();
    }
    if (!ex) return;
    const bucket = getIctDistBucket(ex, _ictDistActiveTab);
    bucket.push(createIctDistRow({
        remarks: _ictDistActiveTab === 'proposed' ? 'u/s' : '',
        needIssue: _ictDistActiveTab === 'proposed' ? 'yes' : ''
    }));
    ex.updatedAt = new Date().toISOString();
    saveState();
    renderIctDistTable();
}

function addIctDistRowFromLookup(group) {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;
    let ex = getActiveIctDistExercise();
    if (!ex) {
        createNewIctDistExercise();
        ex = getActiveIctDistExercise();
    }
    if (!ex) return;
    const bucket = getIctDistBucket(ex, _ictDistActiveTab);
    const row = createIctDistRow({
        name: group.name === '—' ? '' : group.name,
        unit: group.unit,
        forceNo: group.forceNo,
        appointment: group.unit || '',
        initialIssue: group.initialIssue,
        zaSerial: group.zaSerial,
        remarks: _ictDistActiveTab === 'proposed' ? group.remarks : '',
        needIssue: group.needIssue || suggestNeedFromRemarks(group.remarks, group.initialIssue),
        linkedZa: group.latest?.za || '',
        sourceHint: 'ICT Asset Register'
    });
    bucket.push(row);
    ex.updatedAt = new Date().toISOString();
    saveState();
    renderIctDistTable();
    showToast(`Added ${row.name || 'row'} to ${_ictDistActiveTab} list.`);
}

function readIctDistRowFromTr(tr) {
    if (!tr) return null;
    return createIctDistRow({
        id: tr.dataset.rowId,
        rank: tr.querySelector('[data-f="rank"]')?.value,
        name: tr.querySelector('[data-f="name"]')?.value,
        appointment: tr.querySelector('[data-f="appointment"]')?.value,
        initialIssue: tr.querySelector('[data-f="initialIssue"]')?.value,
        zaSerial: tr.querySelector('[data-f="zaSerial"]')?.value,
        remarks: tr.querySelector('[data-f="remarks"]')?.value,
        needIssue: tr.querySelector('[data-f="needIssue"]')?.value,
        linkedZa: tr.dataset.linkedZa || '',
        forceNo: tr.dataset.forceNo || '',
        unit: tr.dataset.unit || ''
    });
}

function persistIctDistVisibleRows() {
    const ex = getActiveIctDistExercise();
    if (!ex) return;
    const tbody = document.getElementById('ictDistTableBody');
    if (!tbody) return;
    const rows = [...tbody.querySelectorAll('tr[data-row-id]')].map(readIctDistRowFromTr).filter(Boolean);
    const bucket = getIctDistBucket(ex, _ictDistActiveTab);
    if (!_ictDistRowFilter) {
        setIctDistBucket(ex, _ictDistActiveTab, rows);
    } else {
        const byId = new Map(rows.map((r) => [r.id, r]));
        const next = bucket.map((r) => byId.get(r.id) || r);
        rows.forEach((r) => {
            if (!next.some((x) => x.id === r.id)) next.push(r);
        });
        setIctDistBucket(ex, _ictDistActiveTab, next);
    }
    ex.updatedAt = new Date().toISOString();
}

function saveIctDistRowsFromDom() {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;
    persistIctDistVisibleRows();
    saveState();
    renderIctDistTable();
    showToast('List rows saved.');
}

function moveIctDistRow(rowId, toTab) {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;
    const ex = getActiveIctDistExercise();
    if (!ex) return;
    persistIctDistVisibleRows();
    const from = getIctDistBucket(ex, _ictDistActiveTab);
    const idx = from.findIndex((r) => r.id === rowId);
    if (idx < 0) return;
    const [row] = from.splice(idx, 1);
    if (toTab === 'proposed' && !row.needIssue) {
        row.needIssue = suggestNeedFromRemarks(row.remarks, row.initialIssue);
    }
    getIctDistBucket(ex, toTab).push(row);
    ex.updatedAt = new Date().toISOString();
    saveState();
    renderIctDistTable();
    showToast(`Moved to ${toTab === 'next' ? 'Next to be issued' : toTab} list.`);
}

function deleteIctDistRow(rowId) {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;
    const ex = getActiveIctDistExercise();
    if (!ex) return;
    persistIctDistVisibleRows();
    const bucket = getIctDistBucket(ex, _ictDistActiveTab);
    const idx = bucket.findIndex((r) => r.id === rowId);
    if (idx < 0) return;
    bucket.splice(idx, 1);
    ex.updatedAt = new Date().toISOString();
    saveState();
    renderIctDistTable();
}

function fillIctDistExerciseSelect() {
    const sel = document.getElementById('ictDistExerciseSelect');
    if (!sel) return;
    const list = ensureIctDistribution();
    const active = getActiveIctDistId();
    if (!list.length) {
        sel.innerHTML = '<option value="">— No exercises yet —</option>';
        return;
    }
    sel.innerHTML = list.map((ex) => {
        const eq = ICT_DIST_EQ_TYPES.find((t) => t.value === ex.equipmentType)?.label || ex.equipmentType;
        const selAttr = ex.id === active ? ' selected' : '';
        return `<option value="${ictDistEscape(ex.id)}"${selAttr}>${ictDistEscape(ex.title)} (${ictDistEscape(eq)})</option>`;
    }).join('');
}

function syncIctDistMetaForm() {
    const ex = getActiveIctDistExercise();
    const title = document.getElementById('ictDistTitleInput');
    const eq = document.getElementById('ictDistEqType');
    const status = document.getElementById('ictDistStatus');
    if (!ex) {
        if (title) title.value = '';
        return;
    }
    if (title) title.value = ex.title || '';
    if (eq) eq.value = ex.equipmentType || 'laptops';
    if (status) status.value = ex.status || 'draft';
}

function updateIctDistTabChrome() {
    document.querySelectorAll('[data-ict-dist-tab]').forEach((btn) => {
        const on = btn.dataset.ictDistTab === _ictDistActiveTab;
        btn.classList.toggle('active', on);
        btn.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    const hint = document.getElementById('ictDistColHint');
    const head = document.getElementById('ictDistRemarksHead');
    if (_ictDistActiveTab === 'proposed') {
        if (head) head.textContent = 'Remarks / Condition (g)';
        if (hint) hint.textContent = 'Proposed: use S / U/S (or NIL) to decide who needs a new issue.';
    } else if (_ictDistActiveTab === 'final') {
        if (head) head.textContent = 'Issue / Spec (g)';
        if (hint) hint.textContent = 'Final: record what will be issued (e.g. Core i9, Core i7).';
    } else {
        if (head) head.textContent = 'Issue / Spec (g)';
        if (hint) hint.textContent = 'Next to be issued: queue for the following allocation batch.';
    }

    const ex = getActiveIctDistExercise();
    const setCount = (id, n) => {
        const el = document.getElementById(id);
        if (el) el.textContent = String(n);
    };
    setCount('ictDistCountProposed', ex?.proposed?.length || 0);
    setCount('ictDistCountFinal', ex?.final?.length || 0);
    setCount('ictDistCountNext', ex?.next?.length || 0);
}

function renderIctDistTable() {
    const tbody = document.getElementById('ictDistTableBody');
    if (!tbody) return;
    updateIctDistTabChrome();
    const ex = getActiveIctDistExercise();
    if (!ex) {
        tbody.innerHTML = '<tr><td colspan="9" class="req-empty-row">Create a distribution exercise to begin.</td></tr>';
        return;
    }

    let rows = getIctDistBucket(ex, _ictDistActiveTab);
    const q = _ictDistRowFilter.trim().toLowerCase();
    if (q) {
        rows = rows.filter((r) => {
            const hay = `${r.rank} ${r.name} ${r.appointment} ${r.initialIssue} ${r.zaSerial} ${r.remarks}`.toLowerCase();
            return hay.includes(q);
        });
    }

    if (!rows.length) {
        tbody.innerHTML = '<tr><td colspan="9" class="req-empty-row">No rows on this list yet. Use <strong>Quick access</strong> or <strong>Add blank row</strong>.</td></tr>';
        return;
    }

    const canEdit = typeof canEditData === 'function' ? canEditData() : true;

    tbody.innerHTML = rows.map((row, idx) => {
        const ser = String(idx + 1).padStart(2, '0');
        const needSelect = `
            <select class="form-control ict-dist-cell" data-f="needIssue" ${canEdit ? '' : 'disabled'}>
                ${ICT_DIST_NEED.map((o) =>
                    `<option value="${ictDistEscape(o.value)}"${o.value === row.needIssue ? ' selected' : ''}>${ictDistEscape(o.label)}</option>`
                ).join('')}
            </select>`;
        const moveBtns = [];
        if (_ictDistActiveTab !== 'final') {
            moveBtns.push(`<button type="button" class="btn btn-ghost btn-sm" data-ict-dist-move="final" data-row-id="${ictDistEscape(row.id)}" title="Promote to Final">→ Final</button>`);
        }
        if (_ictDistActiveTab !== 'next') {
            moveBtns.push(`<button type="button" class="btn btn-ghost btn-sm" data-ict-dist-move="next" data-row-id="${ictDistEscape(row.id)}" title="Move to Next">→ Next</button>`);
        }
        if (_ictDistActiveTab !== 'proposed') {
            moveBtns.push(`<button type="button" class="btn btn-ghost btn-sm" data-ict-dist-move="proposed" data-row-id="${ictDistEscape(row.id)}" title="Back to Proposed">← Proposed</button>`);
        }
        return `
            <tr data-row-id="${ictDistEscape(row.id)}" data-linked-za="${ictDistEscape(row.linkedZa)}"
                data-force-no="${ictDistEscape(row.forceNo)}" data-unit="${ictDistEscape(row.unit)}">
                <td class="ict-dist-ser">${ser}</td>
                <td><input type="text" class="form-control ict-dist-cell" data-f="rank" value="${ictDistEscape(row.rank)}" ${canEdit ? '' : 'readonly'} placeholder="Maj"></td>
                <td><input type="text" class="form-control ict-dist-cell" data-f="name" value="${ictDistEscape(row.name)}" ${canEdit ? '' : 'readonly'} placeholder="Name"></td>
                <td><input type="text" class="form-control ict-dist-cell" data-f="appointment" value="${ictDistEscape(row.appointment)}" ${canEdit ? '' : 'readonly'} placeholder="Appointment"></td>
                <td><input type="text" class="form-control ict-dist-cell" data-f="initialIssue" value="${ictDistEscape(row.initialIssue)}" ${canEdit ? '' : 'readonly'} placeholder="NIL or dd/mm/yy"></td>
                <td><input type="text" class="form-control ict-dist-cell" data-f="zaSerial" value="${ictDistEscape(row.zaSerial)}" ${canEdit ? '' : 'readonly'} placeholder="ZA / Serial"></td>
                <td><input type="text" class="form-control ict-dist-cell" data-f="remarks" value="${ictDistEscape(row.remarks)}" ${canEdit ? '' : 'readonly'} placeholder="${_ictDistActiveTab === 'proposed' ? 's / u/s' : 'Core i7'}"></td>
                <td>${needSelect}</td>
                <td class="ict-dist-actions">
                    ${canEdit ? moveBtns.join(' ') : ''}
                    ${canEdit ? `<button type="button" class="btn btn-ghost btn-sm" data-ict-dist-del="${ictDistEscape(row.id)}">Remove</button>` : ''}
                </td>
            </tr>
        `;
    }).join('');
}

function runIctDistLookup() {
    const q = document.getElementById('ictDistLookupQuery')?.value || '';
    const eq = document.getElementById('ictDistLookupEqType')?.value || '';
    const host = document.getElementById('ictDistLookupResults');
    if (!host) return;
    const groups = lookupIctPriorIssues(q, eq);
    if (!String(q).trim()) {
        host.hidden = true;
        host.innerHTML = '';
        return;
    }
    host.hidden = false;
    if (!groups.length) {
        host.innerHTML = `<p class="ict-dist-lookup-empty">No prior issues found in the ICT Asset Register for “${ictDistEscape(q)}”. You can still <strong>Add blank row</strong> and enter NIL.</p>`;
        return;
    }
    const canEdit = typeof canEditData === 'function' ? canEditData() : true;
    host.innerHTML = groups.map((g, i) => {
        const issuesHtml = g.issues.map((iss) => `
            <li>
                <strong>${ictDistEscape(iss.dateDisplay)}</strong>
                · ZA/Serial <code>${ictDistEscape(iss.zaSerial)}</code>
                · <span class="ict-dist-cond ict-dist-cond-${ictDistEscape(ictDistConditionClass(iss.condition))}">${ictDistEscape(iss.condition)}</span>
                · ${ictDistEscape(iss.designation || 'Item')}
            </li>
        `).join('');
        return `
            <article class="ict-dist-lookup-card" data-lookup-idx="${i}">
                <header>
                    <strong>${ictDistEscape(g.name)}</strong>
                    ${g.forceNo ? `<span class="ict-dist-meta">${ictDistEscape(g.forceNo)}</span>` : ''}
                    ${g.unit ? `<span class="ict-dist-meta">${ictDistEscape(g.unit)}</span>` : ''}
                </header>
                <p class="ict-dist-lookup-summary">
                    Initial issue: <strong>${ictDistEscape(g.initialIssue)}</strong>
                    · ZA/Serial: <strong>${ictDistEscape(g.zaSerial)}</strong>
                    · Condition: <strong>${ictDistEscape(g.remarks)}</strong>
                </p>
                <p class="ict-dist-lookup-suggest">${ictDistEscape(g.suggestion)}</p>
                <ul class="ict-dist-issue-list">${issuesHtml}</ul>
                ${canEdit ? `<button type="button" class="btn btn-primary btn-sm" data-ict-dist-add-lookup="${i}">Add to ${_ictDistActiveTab} list</button>` : ''}
            </article>
        `;
    }).join('');
    host._lookupGroups = groups;
}

function printIctDistList() {
    const ex = getActiveIctDistExercise();
    if (!ex) {
        showToast('No exercise to print.', 'error');
        return;
    }
    persistIctDistVisibleRows();
    saveState();

    const tab = _ictDistActiveTab;
    const rows = getIctDistBucket(ex, tab);
    const eqLabel = ICT_DIST_EQ_TYPES.find((t) => t.value === ex.equipmentType)?.label || ex.equipmentType;
    let heading = `PROPOSED DISTRIBUTION OF ${String(eqLabel).toUpperCase()} TO IT DIR PERSONNEL`;
    if (tab === 'final') heading = `FINAL DISTRIBUTION LIST OF ${String(eqLabel).toUpperCase()} TO IT DIR PERSONNEL`;
    if (tab === 'next') heading = `NEXT TO BE ISSUED — ${String(eqLabel).toUpperCase()}`;

    const remarksHead = tab === 'proposed' ? 'REMARKS' : 'ISSUE';
    const body = rows.map((r, i) => `
        <tr>
            <td>${String(i + 1).padStart(2, '0')}</td>
            <td>${ictDistEscape(r.rank)}</td>
            <td>${ictDistEscape(r.name)}</td>
            <td>${ictDistEscape(r.appointment)}</td>
            <td>${ictDistEscape(r.initialIssue || 'NIL')}</td>
            <td>${ictDistEscape(r.zaSerial || 'NIL')}</td>
            <td>${ictDistEscape(r.remarks)}</td>
        </tr>
    `).join('');

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${ictDistEscape(heading)}</title>
<style>
  body { font-family: "Times New Roman", Times, serif; margin: 24px; color: #111; }
  .mark { text-align: center; font-weight: 700; letter-spacing: 0.12em; margin: 8px 0 18px; }
  h1 { text-align: center; font-size: 15pt; margin: 0 0 16px; text-transform: uppercase; }
  .meta { text-align: center; font-size: 10pt; margin-bottom: 14px; }
  table { width: 100%; border-collapse: collapse; font-size: 10pt; }
  th, td { border: 1px solid #222; padding: 4px 6px; vertical-align: top; }
  th { background: #f3f3f3; }
  @media print { .no-print { display: none; } }
</style></head><body>
  <div class="mark">RESTRICTED</div>
  <h1>${ictDistEscape(heading)}</h1>
  <p class="meta">${ictDistEscape(ex.title)} · Status: ${ictDistEscape(ex.status)} · Prepared: ${ictDistEscape((ex.updatedAt || '').slice(0, 10))}</p>
  <table>
    <thead>
      <tr>
        <th>SER<br>(a)</th>
        <th>RANK<br>(b)</th>
        <th>NAME<br>(c)</th>
        <th>APPOINTMENT<br>(d)</th>
        <th>INITIAL ISSUE<br>(e)</th>
        <th>ZA No./Serial<br>(f)</th>
        <th>${remarksHead}<br>(g)</th>
      </tr>
    </thead>
    <tbody>${body || '<tr><td colspan="7">No rows</td></tr>'}</tbody>
  </table>
  <div class="mark" style="margin-top:24px;">RESTRICTED</div>
  <p class="no-print" style="margin-top:16px;"><button onclick="window.print()">Print</button></p>
</body></html>`;

    const w = window.open('', '_blank');
    if (!w) {
        showToast('Allow pop-ups to print the distribution list.', 'error');
        return;
    }
    w.document.write(html);
    w.document.close();
}

function renderIctDistributionModule() {
    ensureIctDistribution();
    fillIctDistExerciseSelect();
    syncIctDistMetaForm();
    updateIctDistTabChrome();
    renderIctDistTable();
}

function initIctDistributionModule() {
    if (_ictDistInited) {
        renderIctDistributionModule();
        return;
    }
    const root = document.getElementById('ict-distribution');
    if (!root) return;
    _ictDistInited = true;

    document.getElementById('ictDistExerciseSelect')?.addEventListener('change', (e) => {
        persistIctDistVisibleRows();
        setActiveIctDistId(e.target.value);
        saveState();
        syncIctDistMetaForm();
        renderIctDistTable();
    });

    document.getElementById('ictDistNewBtn')?.addEventListener('click', createNewIctDistExercise);
    document.getElementById('ictDistSaveMetaBtn')?.addEventListener('click', () => {
        saveIctDistExerciseMeta();
        saveIctDistRowsFromDom();
    });
    document.getElementById('ictDistAddBlankBtn')?.addEventListener('click', addIctDistBlankRow);
    document.getElementById('ictDistDeleteBtn')?.addEventListener('click', deleteActiveIctDistExercise);
    document.getElementById('ictDistPrintBtn')?.addEventListener('click', printIctDistList);

    document.querySelectorAll('[data-ict-dist-tab]').forEach((btn) => {
        btn.addEventListener('click', () => {
            persistIctDistVisibleRows();
            if (typeof canEditData === 'function' && canEditData()) saveState();
            _ictDistActiveTab = btn.dataset.ictDistTab || 'proposed';
            renderIctDistTable();
        });
    });

    document.getElementById('ictDistLookupBtn')?.addEventListener('click', runIctDistLookup);
    document.getElementById('ictDistLookupQuery')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            runIctDistLookup();
        }
    });
    document.getElementById('ictDistLookupClear')?.addEventListener('click', () => {
        const q = document.getElementById('ictDistLookupQuery');
        if (q) q.value = '';
        const host = document.getElementById('ictDistLookupResults');
        if (host) {
            host.hidden = true;
            host.innerHTML = '';
        }
    });

    document.getElementById('ictDistLookupResults')?.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-ict-dist-add-lookup]');
        if (!btn) return;
        const host = document.getElementById('ictDistLookupResults');
        const groups = host?._lookupGroups || [];
        const g = groups[Number(btn.dataset.ictDistAddLookup)];
        if (g) addIctDistRowFromLookup(g);
    });

    document.getElementById('ictDistFilterBtn')?.addEventListener('click', () => {
        persistIctDistVisibleRows();
        _ictDistRowFilter = document.getElementById('ictDistRowFilter')?.value || '';
        renderIctDistTable();
    });
    document.getElementById('ictDistFilterClear')?.addEventListener('click', () => {
        const el = document.getElementById('ictDistRowFilter');
        if (el) el.value = '';
        _ictDistRowFilter = '';
        renderIctDistTable();
    });

    document.getElementById('ictDistTableBody')?.addEventListener('click', (e) => {
        const move = e.target.closest('[data-ict-dist-move]');
        if (move) {
            moveIctDistRow(move.dataset.rowId, move.dataset.ictDistMove);
            return;
        }
        const del = e.target.closest('[data-ict-dist-del]');
        if (del) deleteIctDistRow(del.dataset.ictDistDel);
    });

    document.getElementById('ictDistTableBody')?.addEventListener('change', () => {
        if (typeof canEditData === 'function' && !canEditData()) return;
        persistIctDistVisibleRows();
        saveState();
        updateIctDistTabChrome();
    });

    renderIctDistributionModule();
}
