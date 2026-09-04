/* spec-eval-matrix.js — Official BELOW SPEC / TO SPEC evaluation sheet + demo seeds */

const SPEC_EVAL_SEED_REV = 1;
const SPEC_MARK_BELOW = 'below';
const SPEC_MARK_TO = 'to';

const SPEC_EVAL_ITEM_LISTS = {
    laptop: [
        'Product model', 'Processor', 'Graphics Integrated', 'Display', 'Memory', 'Storage',
        'Battery', 'Operating system', 'Keyboard', 'Ports', 'Web cam', 'MS Office 24',
        'Carry case', 'Warranty'
    ],
    desktop: [
        'Product model', 'Processor', 'Graphics', 'Memory', 'Storage', 'Form factor',
        'Operating system', 'Ports', 'Power supply', 'Monitor (if bundled)', 'Warranty'
    ],
    printer: [
        'Product model', 'Functions', 'Processor speed', 'Memory', 'Display', 'Duty cycle',
        'Duplex printing', 'Print technology', 'Scan capabilities', 'Connectivity', 'Warranty'
    ],
    server: [
        'Product model', 'Operating System', 'Processor', 'Memory (RAM)', 'Boot Storage',
        'Internal Storage', 'RAID / Storage Controller', 'Network', 'Power Supply',
        'Form Factor', 'Remote Management', 'Warranty'
    ],
    network: [
        'Product model', 'Device Type', 'Ports / Throughput', 'Management', 'PoE',
        'Standards', 'Security Features', 'Warranty'
    ],
    other: [
        'Product model', 'Key Specification 1', 'Key Specification 2', 'Compatibility',
        'Warranty', 'Standards / Compliance'
    ],
    tablet: [
        'Product model', 'Processor', 'RAM', 'Storage', 'Display', 'Operating System',
        'Connectivity', 'Security', 'Battery', 'Warranty'
    ]
};

let _specSupplierNames = ['Makbros', 'LASERJET', 'COUNTRYVALE'];
let _specMatrixRowSeq = 0;

function specMxEscape(v) {
    return String(v ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function getSpecSupplierNames() {
    return _specSupplierNames.map((n) => String(n || '').trim()).filter(Boolean);
}

function setSpecSupplierNames(names) {
    const list = (names || []).map((n) => String(n || '').trim()).filter(Boolean);
    _specSupplierNames = list.length ? list.slice(0, 6) : ['Supplier A', 'Supplier B', 'Supplier C'];
}

function marksAllTo(n) {
    return Array.from({ length: n }, () => SPEC_MARK_TO);
}

function marksModelOnlyTo(n) {
    return Array.from({ length: n }, (_, i) => (i === 0 ? SPEC_MARK_TO : SPEC_MARK_BELOW));
}

/** Build marks array: for each supplier, 'to' or 'below'. Pattern helpers for demos. */
function marksPattern(supplierCount, toSpecIndexesByItem) {
    return toSpecIndexesByItem.map((toIdxs) => {
        const set = new Set(toIdxs);
        return Array.from({ length: supplierCount }, (_, s) => (set.has(s) ? SPEC_MARK_TO : SPEC_MARK_BELOW));
    });
}

function buildPortalDemoSpecEvaluations() {
    const compiled = {
        idNo: '826473P', rank: 'CSgt', name: 'Dube T', appt: 'Technician',
        sig: 'T. Dube', date: '2026-09-02'
    };
    const approved = {
        idNo: '789674Q', rank: 'Capt', name: 'L Kativhu', appt: 'OC',
        sig: 'L. Kativhu', date: '2026-09-02'
    };

    // Dell Pro Rugged — Makbros, LASERJET, COUNTRYVALE — LASERJET all TO; others model TO only
    const ruggedItems = SPEC_EVAL_ITEM_LISTS.laptop.slice();
    const ruggedMarks = ruggedItems.map((_, i) => (
        i === 0
            ? [SPEC_MARK_TO, SPEC_MARK_TO, SPEC_MARK_TO]
            : [SPEC_MARK_BELOW, SPEC_MARK_TO, SPEC_MARK_BELOW]
    ));

    // LaserJet MFP — Makbros, LASERJET, UPRIGHT — model all TO; rest Makbros below, others TO
    const mfpItems = SPEC_EVAL_ITEM_LISTS.printer.slice();
    const mfpMarks = mfpItems.map((_, i) => (
        i === 0
            ? [SPEC_MARK_TO, SPEC_MARK_TO, SPEC_MARK_TO]
            : [SPEC_MARK_BELOW, SPEC_MARK_TO, SPEC_MARK_TO]
    ));

    // Omen 16 — MAKBROS, COUNTRYVALE, LASERJET, LUNA CRAFT
    // Luna Craft TO on: model(0), memory(4), storage(5), keyboard(8)
    const omenItems = SPEC_EVAL_ITEM_LISTS.laptop.slice();
    const omenMarks = omenItems.map((_, i) => {
        const lunaTo = [0, 4, 5, 8].includes(i);
        return [
            i === 0 ? SPEC_MARK_TO : SPEC_MARK_BELOW,
            i === 0 ? SPEC_MARK_TO : SPEC_MARK_BELOW,
            SPEC_MARK_BELOW,
            lunaTo ? SPEC_MARK_TO : SPEC_MARK_BELOW
        ];
    });

    // OmniBook Ultra — LATERTECH, REELTEC ELECT, LASERJET, LUNA CRAFT, UPRIGHT
    // First 3 mostly TO; Luna Craft below on Memory(4); Upright below on 1–6 (processor..battery)
    const omniItems = SPEC_EVAL_ITEM_LISTS.laptop.slice();
    const omniMarks = omniItems.map((_, i) => {
        const later = SPEC_MARK_TO;
        const reel = SPEC_MARK_TO;
        const laser = SPEC_MARK_TO;
        const luna = i === 4 ? SPEC_MARK_BELOW : SPEC_MARK_TO;
        const upright = (i >= 1 && i <= 6) ? SPEC_MARK_BELOW : SPEC_MARK_TO;
        return [later, reel, laser, luna, upright];
    });

    return [
        {
            id: 'spec-seed-dell-rugged-001',
            evalNo: 'SE/ITDIR/2026/RUG-01',
            date: '2026-09-02',
            categoryValue: 'laptop',
            itemName: 'DELL PRO RUGGED 14 RB14250 BTX LAPTOP',
            brand: 'Dell',
            gl: '3112210001',
            suppliers: ['Makbros', 'LASERJET', 'COUNTRYVALE'],
            items: ruggedItems.map((name, i) => ({ name, marks: ruggedMarks[i] })),
            compiled,
            approved,
            seedExample: true,
            fileRef: 'T/S',
            createdAt: '2026-09-02T10:00:00'
        },
        {
            id: 'spec-seed-laserjet-mfp-001',
            evalNo: 'SE/ITDIR/2026/MFP-01',
            date: '2026-09-02',
            categoryValue: 'printer',
            itemName: 'HP LASERJET MANAGED MFP E78635dn',
            brand: 'HP',
            gl: '3112210001',
            suppliers: ['Makbros', 'LASERJET', 'UPRIGHT'],
            items: mfpItems.map((name, i) => ({ name, marks: mfpMarks[i] })),
            compiled,
            approved,
            seedExample: true,
            createdAt: '2026-09-02T10:05:00'
        },
        {
            id: 'spec-seed-omen-16-001',
            evalNo: 'SE/ITDIR/2026/OMEN-01',
            date: '2026-09-02',
            categoryValue: 'laptop',
            itemName: 'HP OMEN 16 LAPTOP',
            brand: 'HP',
            gl: '3112210001',
            suppliers: ['MAKBROS', 'COUNTRYVALE', 'LASERJET', 'LUNA CRAFT'],
            items: omenItems.map((name, i) => ({ name, marks: omenMarks[i] })),
            compiled,
            approved,
            seedExample: true,
            createdAt: '2026-09-02T10:10:00'
        },
        {
            id: 'spec-seed-omnibook-001',
            evalNo: 'SE/ITDIR/2026/OMNI-01',
            date: '2026-09-02',
            categoryValue: 'laptop',
            itemName: 'HP OMNIBOOK ULTRA LAPTOP NEXT GEN AI 14',
            brand: 'HP',
            gl: '3112210001',
            suppliers: ['LATERTECH', 'REELTEC ELECT', 'LASERJET', 'LUNA CRAFT', 'UPRIGHT'],
            items: omniItems.map((name, i) => ({ name, marks: omniMarks[i] })),
            compiled,
            approved,
            seedExample: true,
            fileRef: 'T/S 05/09/26',
            createdAt: '2026-09-02T10:15:00'
        }
    ];
}

function ensureSpecEvaluations() {
    if (!appState) return [];
    if (!Array.isArray(appState.specEvaluations)) appState.specEvaluations = [];
    return appState.specEvaluations;
}

function ensurePortalDemoSpecEvaluations(force) {
    if (!appState) return 0;
    const list = ensureSpecEvaluations();
    if (!Array.isArray(list)) return 0;
    let seeds;
    try {
        seeds = buildPortalDemoSpecEvaluations();
    } catch (err) {
        console.warn('Spec evaluation demos unavailable', err);
        return 0;
    }
    let added = 0;
    seeds.forEach((seed) => {
        if (!list.some((r) => r.id === seed.id)) {
            list.push({ ...seed });
            added += 1;
        }
    });
    const rev = Number(appState.specEvalSeedRev) || 0;
    if (force || added || rev < SPEC_EVAL_SEED_REV) {
        if (rev < SPEC_EVAL_SEED_REV) {
            seeds.forEach((seed) => {
                const rec = list.find((r) => r.id === seed.id);
                if (!rec) return;
                Object.assign(rec, seed);
            });
        }
        appState.specEvalSeedRev = SPEC_EVAL_SEED_REV;
        try {
            if (typeof saveState === 'function') saveState();
        } catch (err) {
            console.warn('Could not persist spec evaluation demos', err);
        }
    }
    return added;
}

function renderSpecSupplierInputs() {
    const host = document.getElementById('specSupplierInputs');
    if (!host) return;
    host.innerHTML = _specSupplierNames.map((name, idx) => `
        <label class="spec-supplier-field">
            <span>${String.fromCharCode(99 + idx)}</span>
            <input type="text" class="form-control spec-supplier-name" data-supplier-idx="${idx}"
                value="${specMxEscape(name)}" placeholder="Supplier ${idx + 1}">
        </label>
    `).join('');
    host.querySelectorAll('.spec-supplier-name').forEach((input) => {
        const apply = () => {
            const i = Number(input.getAttribute('data-supplier-idx'));
            _specSupplierNames[i] = input.value.trim() || `Supplier ${i + 1}`;
            rebuildSpecMatrixHeader();
            const rows = [...document.querySelectorAll('#spec-eval-table-body tr')].map(readSpecMatrixRow);
            renderSpecMatrixRows(rows);
        };
        input.addEventListener('change', apply);
        input.addEventListener('blur', apply);
    });
}

function rebuildSpecMatrixHeader() {
    const thead = document.getElementById('specEvalMatrixHead');
    if (!thead) return;
    const suppliers = getSpecSupplierNames();
    const letters = suppliers.map((_, i) => String.fromCharCode(99 + i));
    thead.innerHTML = `
        <tr>
            <th rowspan="2" class="spec-col-ser">SER<br><span>(a)</span></th>
            <th rowspan="2" class="spec-col-item">ITEM<br><span>(b)</span></th>
            ${suppliers.map((name, i) => `
                <th colspan="2" class="spec-col-supplier">${specMxEscape(name)}<br><span>(${letters[i]})</span></th>
            `).join('')}
            <th rowspan="2" class="spec-col-action"></th>
        </tr>
        <tr>
            ${suppliers.map(() => `
                <th class="spec-col-mark">BELOW SPEC</th>
                <th class="spec-col-mark">TO SPEC</th>
            `).join('')}
        </tr>
    `;
}

function buildSpecMarkCells(rowId, marks) {
    const suppliers = getSpecSupplierNames();
    return suppliers.map((_, sIdx) => {
        const mark = marks?.[sIdx] || '';
        const group = `spec-mark-${rowId}-${sIdx}`;
        return `
            <td class="spec-mark-cell">
                <label class="spec-mark-tick" title="BELOW SPEC">
                    <input type="radio" name="${group}" value="${SPEC_MARK_BELOW}" ${mark === SPEC_MARK_BELOW ? 'checked' : ''}>
                    <span>✓</span>
                </label>
            </td>
            <td class="spec-mark-cell">
                <label class="spec-mark-tick" title="TO SPEC">
                    <input type="radio" name="${group}" value="${SPEC_MARK_TO}" ${mark === SPEC_MARK_TO ? 'checked' : ''}>
                    <span>✓</span>
                </label>
            </td>
        `;
    }).join('');
}

function buildSpecEvalRow(specName = '', _v = '', _n = '', marks = null) {
    const rowId = `r${++_specMatrixRowSeq}`;
    const tr = document.createElement('tr');
    tr.setAttribute('data-row-id', rowId);
    tr.innerHTML = `
        <td class="spec-ser">01</td>
        <td><input type="text" class="form-control spec-field-name" placeholder="ITEM" value="${specMxEscape(specName)}"></td>
        ${buildSpecMarkCells(rowId, marks)}
        <td><button type="button" class="btn btn-danger btn-sm" onclick="removeRow(this)">Del</button></td>
    `;
    return tr;
}

function renumberSpecEvalRows() {
    const tbody = document.getElementById('spec-eval-table-body');
    if (!tbody) return;
    [...tbody.rows].forEach((tr, i) => {
        const ser = tr.querySelector('.spec-ser');
        if (ser) ser.textContent = String(i + 1).padStart(2, '0');
    });
}

function readSpecMatrixRow(tr) {
    const name = tr.querySelector('.spec-field-name')?.value?.trim() || '';
    const marks = [];
    getSpecSupplierNames().forEach((_, sIdx) => {
        const rowId = tr.getAttribute('data-row-id');
        const checked = tr.querySelector(`input[name="spec-mark-${rowId}-${sIdx}"]:checked`);
        marks[sIdx] = checked?.value || '';
    });
    return { name, marks };
}

function renderSpecMatrixRows(rows) {
    const tbody = document.getElementById('spec-eval-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';
    (rows.length ? rows : [{ name: '', marks: [] }]).forEach((row) => {
        tbody.appendChild(buildSpecEvalRow(row.name || '', '', '', row.marks || null));
    });
    renumberSpecEvalRows();
}

function addSpecEvalRow(specName = '', specValue = '', specNote = '', marks = null) {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;
    const tbody = document.getElementById('spec-eval-table-body');
    if (!tbody) return;
    tbody.appendChild(buildSpecEvalRow(specName, specValue, specNote, marks));
    renumberSpecEvalRows();
}

function clearSpecEvalRows() {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;
    renderSpecMatrixRows([{ name: '', marks: [] }]);
}

function loadSpecEvalTemplate(category, { confirmReplace = true } = {}) {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;
    const items = SPEC_EVAL_ITEM_LISTS[category];
    if (!items) {
        showToast('No ITEM checklist for that category.', 'error');
        return;
    }
    const tbody = document.getElementById('spec-eval-table-body');
    if (!tbody) return;
    const hasContent = Array.from(tbody.querySelectorAll('.spec-field-name')).some((el) => el.value.trim())
        || tbody.querySelectorAll('input[type="radio"]:checked').length > 0;
    if (confirmReplace && hasContent && !window.confirm('Replace current ITEM rows with the selected checklist?')) return;
    renderSpecMatrixRows(items.map((name) => ({ name, marks: [] })));
    const categorySelect = document.getElementById('specEvalCategory');
    if (categorySelect) categorySelect.value = category;
    showToast(`${category} ITEM checklist loaded.`);
}

function updateSpecSheetTitlePreview() {
    const el = document.getElementById('specEvalSheetTitlePreview');
    if (!el) return;
    const name = (document.getElementById('specEvalItemName')?.value || '').trim() || '…';
    el.textContent = `${name.toUpperCase()} SPECIFICATION EVALUATION`;
}

function syncLegacySignoffFields() {
    const compiled = [
        document.getElementById('specCompiledId')?.value,
        document.getElementById('specCompiledRank')?.value,
        document.getElementById('specCompiledName')?.value,
        document.getElementById('specCompiledAppt')?.value
    ].filter(Boolean).join(' · ');
    const approved = [
        document.getElementById('specApprovedId')?.value,
        document.getElementById('specApprovedRank')?.value,
        document.getElementById('specApprovedName')?.value,
        document.getElementById('specApprovedAppt')?.value
    ].filter(Boolean).join(' · ');
    const prep = document.getElementById('specEvalPreparedBy');
    const appr = document.getElementById('specEvalApprovedBy');
    if (prep) prep.value = compiled;
    if (appr) appr.value = approved;
}

function getSpecEvalFormSnapshot() {
    syncLegacySignoffFields();
    const categoryEl = document.getElementById('specEvalCategory');
    const categoryValue = categoryEl?.value || '';
    const categoryLabel = categoryEl?.selectedOptions?.[0]?.text || 'ICT Equipment';
    const suppliers = getSpecSupplierNames();
    const items = [...document.querySelectorAll('#spec-eval-table-body tr')]
        .map(readSpecMatrixRow)
        .filter((r) => r.name || r.marks.some(Boolean));

    // Legacy specs array for older highlight helpers
    const specs = items.map((it) => {
        const toNames = suppliers.filter((_, i) => it.marks[i] === SPEC_MARK_TO);
        const belowNames = suppliers.filter((_, i) => it.marks[i] === SPEC_MARK_BELOW);
        const value = toNames.length
            ? `TO SPEC: ${toNames.join(', ')}`
            : (belowNames.length ? `BELOW SPEC: ${belowNames.join(', ')}` : '');
        return { name: it.name, value, note: belowNames.length ? `Below: ${belowNames.join(', ')}` : '' };
    });

    return {
        id: document.getElementById('specEvalEditId')?.value || '',
        evalNo: document.getElementById('specEvalNumber')?.value?.trim() || '',
        date: document.getElementById('specEvalDate')?.value || '',
        categoryValue,
        categoryLabel,
        itemName: document.getElementById('specEvalItemName')?.value?.trim() || 'ICT Equipment',
        brand: document.getElementById('specEvalBrand')?.value?.trim() || '',
        gl: document.getElementById('specEvalGl')?.selectedOptions?.[0]?.text || '',
        glValue: document.getElementById('specEvalGl')?.value || '',
        qty: document.getElementById('specEvalQty')?.value || '',
        unitPrice: document.getElementById('specEvalUnitPrice')?.value || '',
        total: document.getElementById('specEvalTotal')?.value || '',
        purpose: document.getElementById('specEvalPurpose')?.value?.trim() || '',
        preparedBy: document.getElementById('specEvalPreparedBy')?.value?.trim() || '',
        recommendedBy: document.getElementById('specEvalRecommendedBy')?.value?.trim() || '',
        approvedBy: document.getElementById('specEvalApprovedBy')?.value?.trim() || '',
        suppliers,
        items,
        specs,
        compiled: {
            idNo: document.getElementById('specCompiledId')?.value?.trim() || '',
            rank: document.getElementById('specCompiledRank')?.value?.trim() || '',
            name: document.getElementById('specCompiledName')?.value?.trim() || '',
            appt: document.getElementById('specCompiledAppt')?.value?.trim() || '',
            sig: document.getElementById('specCompiledSig')?.value?.trim() || '',
            date: document.getElementById('specCompiledDate')?.value || ''
        },
        approved: {
            idNo: document.getElementById('specApprovedId')?.value?.trim() || '',
            rank: document.getElementById('specApprovedRank')?.value?.trim() || '',
            name: document.getElementById('specApprovedName')?.value?.trim() || '',
            appt: document.getElementById('specApprovedAppt')?.value?.trim() || '',
            sig: document.getElementById('specApprovedSig')?.value?.trim() || '',
            date: document.getElementById('specApprovedDate')?.value || ''
        }
    };
}

function fillSpecSignoff(prefix, block) {
    if (!block) return;
    const map = {
        Id: 'idNo', Rank: 'rank', Name: 'name', Appt: 'appt', Sig: 'sig', Date: 'date'
    };
    Object.entries(map).forEach(([suffix, key]) => {
        const el = document.getElementById(`${prefix}${suffix}`);
        if (el) el.value = block[key] || '';
    });
}

function applySpecEvaluationRecord(rec) {
    if (!rec) return;
    const set = (id, v) => {
        const el = document.getElementById(id);
        if (el) el.value = v ?? '';
    };
    set('specEvalEditId', rec.id || '');
    set('specEvalNumber', rec.evalNo || '');
    set('specEvalDate', rec.date || '');
    set('specEvalCategory', rec.categoryValue || '');
    set('specEvalItemName', rec.itemName || '');
    set('specEvalBrand', rec.brand || '');
    if (rec.glValue) set('specEvalGl', rec.glValue);
    else if (rec.gl && /^\d+/.test(rec.gl)) set('specEvalGl', String(rec.gl).split(/\s|-/)[0]);
    setSpecSupplierNames(rec.suppliers || ['Supplier A', 'Supplier B', 'Supplier C']);
    renderSpecSupplierInputs();
    rebuildSpecMatrixHeader();
    const rows = (rec.items || []).map((it) => ({
        name: it.name || it.item || '',
        marks: it.marks || []
    }));
    renderSpecMatrixRows(rows.length ? rows : [{ name: '', marks: [] }]);
    fillSpecSignoff('specCompiled', rec.compiled);
    fillSpecSignoff('specApproved', rec.approved);
    syncLegacySignoffFields();
    updateSpecSheetTitlePreview();
}

function clearSpecEvaluationForm() {
    applySpecEvaluationRecord({
        id: '',
        evalNo: '',
        date: new Date().toISOString().slice(0, 10),
        categoryValue: 'laptop',
        itemName: '',
        brand: '',
        glValue: '3112210001',
        suppliers: ['Makbros', 'LASERJET', 'COUNTRYVALE'],
        items: SPEC_EVAL_ITEM_LISTS.laptop.map((name) => ({ name, marks: [] })),
        compiled: {},
        approved: {}
    });
    const sel = document.getElementById('specEvalSavedSelect');
    if (sel) sel.value = '';
}

function populateSpecEvalSavedSelect() {
    const sel = document.getElementById('specEvalSavedSelect');
    if (!sel) return;
    const list = ensureSpecEvaluations();
    const cur = sel.value;
    sel.innerHTML = '<option value="">— New / blank —</option>'
        + list.map((r) => `<option value="${specMxEscape(r.id)}">${specMxEscape(r.evalNo || r.id)} — ${specMxEscape(r.itemName || 'Evaluation')}</option>`).join('');
    if (cur && list.some((r) => r.id === cur)) sel.value = cur;
}

function saveSpecEvaluationRecord() {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;
    const snap = getSpecEvalFormSnapshot();
    if (!snap.itemName || snap.itemName === 'ICT Equipment') {
        showToast('Enter the product title for the sheet heading.', 'error');
        document.getElementById('specEvalItemName')?.focus();
        return;
    }
    if (!snap.items.length) {
        showToast('Add at least one ITEM row.', 'error');
        return;
    }
    const list = ensureSpecEvaluations();
    const now = new Date().toISOString();
    const id = snap.id || `spec-${Date.now()}`;
    const record = {
        id,
        evalNo: snap.evalNo || `SE/${new Date().getFullYear()}/${String(list.length + 1).padStart(3, '0')}`,
        date: snap.date,
        categoryValue: snap.categoryValue,
        itemName: snap.itemName,
        brand: snap.brand,
        glValue: snap.glValue,
        gl: snap.gl,
        suppliers: snap.suppliers,
        items: snap.items,
        compiled: snap.compiled,
        approved: snap.approved,
        updatedAt: now,
        createdAt: list.find((r) => r.id === id)?.createdAt || now
    };
    const idx = list.findIndex((r) => r.id === id);
    if (idx >= 0) list[idx] = { ...list[idx], ...record };
    else list.unshift(record);
    document.getElementById('specEvalEditId').value = id;
    document.getElementById('specEvalNumber').value = record.evalNo;
    if (typeof saveState === 'function') saveState();
    populateSpecEvalSavedSelect();
    const sel = document.getElementById('specEvalSavedSelect');
    if (sel) sel.value = id;
    showToast('Specification Evaluation saved.', 'success');
}

function buildSpecEvalDatasheetHtml() {
    const snap = getSpecEvalFormSnapshot();
    const suppliers = snap.suppliers || [];
    const letters = suppliers.map((_, i) => String.fromCharCode(99 + i));
    const title = `${String(snap.itemName || 'ICT EQUIPMENT').toUpperCase()} SPECIFICATION EVALUATION`;

    const headSuppliers = suppliers.map((name, i) => `
        <th colspan="2">${specMxEscape(name)}<br><span>(${letters[i]})</span></th>
    `).join('');
    const headMarks = suppliers.map(() => `
        <th>BELOW SPEC</th><th>TO SPEC</th>
    `).join('');

    const bodyRows = (snap.items.length ? snap.items : [{ name: '—', marks: [] }]).map((it, idx) => `
        <tr>
            <td class="spec-paper-ser">${String(idx + 1).padStart(2, '0')}</td>
            <td class="spec-paper-item">${specMxEscape(it.name || '—')}</td>
            ${suppliers.map((_, sIdx) => {
                const m = it.marks?.[sIdx] || '';
                return `
                    <td class="spec-paper-mark">${m === SPEC_MARK_BELOW ? '✓' : ''}</td>
                    <td class="spec-paper-mark">${m === SPEC_MARK_TO ? '✓' : ''}</td>
                `;
            }).join('')}
        </tr>
    `).join('');

    const signBlock = (label, b) => `
        <div class="spec-paper-sign">
            <h4>${label}</h4>
            <div><span>ID/Service No:</span> <strong>${specMxEscape(b?.idNo || '')}</strong></div>
            <div><span>Rank:</span> <strong>${specMxEscape(b?.rank || '')}</strong>
                &nbsp;&nbsp;<span>Name:</span> <strong>${specMxEscape(b?.name || '')}</strong></div>
            <div><span>Appt:</span> <strong>${specMxEscape(b?.appt || '')}</strong>
                &nbsp;&nbsp;<span>Sig:</span> <strong>${specMxEscape(b?.sig || '')}</strong></div>
            <div><span>Date:</span> <strong>${specMxEscape(b?.date || '')}</strong></div>
        </div>
    `;

    return `
    <div class="spec-paper-print">
        <h1 class="spec-paper-title">${specMxEscape(title)}</h1>
        <div class="spec-paper-meta">
            ${snap.evalNo ? `<span>Eval No: <strong>${specMxEscape(snap.evalNo)}</strong></span>` : ''}
            ${snap.date ? `<span>Date: <strong>${specMxEscape(snap.date)}</strong></span>` : ''}
            ${snap.gl ? `<span>GL: <strong>${specMxEscape(snap.gl)}</strong></span>` : ''}
        </div>
        <table class="spec-paper-table">
            <thead>
                <tr>
                    <th rowspan="2">SER<br>(a)</th>
                    <th rowspan="2">ITEM<br>(b)</th>
                    ${headSuppliers}
                </tr>
                <tr>${headMarks}</tr>
            </thead>
            <tbody>${bodyRows}</tbody>
        </table>
        <div class="spec-paper-signoff">
            ${signBlock('Compiled by', snap.compiled)}
            ${signBlock('Approved by', snap.approved)}
        </div>
    </div>`;
}

function initSpecEvalMatrixUI() {
    ensurePortalDemoSpecEvaluations(false);
    populateSpecEvalSavedSelect();

    if (!document.getElementById('specEvalMatrixHead')?.children.length) {
        setSpecSupplierNames(['Makbros', 'LASERJET', 'COUNTRYVALE']);
        renderSpecSupplierInputs();
        rebuildSpecMatrixHeader();
        if (!document.querySelector('#spec-eval-table-body .spec-field-name')) {
            renderSpecMatrixRows(SPEC_EVAL_ITEM_LISTS.laptop.map((name) => ({ name, marks: [] })));
        }
    } else {
        renderSpecSupplierInputs();
        rebuildSpecMatrixHeader();
    }

    updateSpecSheetTitlePreview();

    document.getElementById('specEvalItemName')?.addEventListener('input', updateSpecSheetTitlePreview);
    document.getElementById('addBlankSpecRowBtn')?.addEventListener('click', () => addSpecEvalRow());
    document.getElementById('specAddSupplierBtn')?.addEventListener('click', () => {
        if (_specSupplierNames.length >= 6) {
            showToast('Maximum 6 supplier columns.', 'error');
            return;
        }
        const rows = [...document.querySelectorAll('#spec-eval-table-body tr')].map(readSpecMatrixRow);
        _specSupplierNames.push(`Supplier ${String.fromCharCode(65 + _specSupplierNames.length)}`);
        renderSpecSupplierInputs();
        rebuildSpecMatrixHeader();
        renderSpecMatrixRows(rows);
    });
    document.getElementById('specRemoveSupplierBtn')?.addEventListener('click', () => {
        if (_specSupplierNames.length <= 2) {
            showToast('Keep at least 2 suppliers.', 'error');
            return;
        }
        const rows = [...document.querySelectorAll('#spec-eval-table-body tr')].map(readSpecMatrixRow);
        rows.forEach((r) => { r.marks = (r.marks || []).slice(0, _specSupplierNames.length - 1); });
        _specSupplierNames.pop();
        renderSpecSupplierInputs();
        rebuildSpecMatrixHeader();
        renderSpecMatrixRows(rows);
    });
    document.getElementById('specEvalSaveBtn')?.addEventListener('click', saveSpecEvaluationRecord);
    document.getElementById('specEvalNewBtn')?.addEventListener('click', () => {
        clearSpecEvaluationForm();
        showToast('Blank specification evaluation sheet.');
    });
    document.getElementById('specEvalSavedSelect')?.addEventListener('change', (e) => {
        const id = e.target.value;
        if (!id) {
            clearSpecEvaluationForm();
            return;
        }
        const rec = ensureSpecEvaluations().find((r) => r.id === id);
        if (rec) applySpecEvaluationRecord(rec);
    });
    document.getElementById('specEvalLoadDemosBtn')?.addEventListener('click', () => {
        ensurePortalDemoSpecEvaluations(true);
        populateSpecEvalSavedSelect();
        const first = ensureSpecEvaluations().find((r) => r.seedExample);
        if (first) {
            applySpecEvaluationRecord(first);
            const sel = document.getElementById('specEvalSavedSelect');
            if (sel) sel.value = first.id;
        }
        showToast('Four demo Specification Evaluations loaded.');
    });

    // Override category template loader to ITEM checklists
    document.getElementById('specEvalCategory')?.addEventListener('change', function onCat() {
        if (!this.value || !SPEC_EVAL_ITEM_LISTS[this.value]) return;
        // Don't auto-wipe when just opening a saved record
    });
}

// Override globals used by the rest of spec-eval.js / reports
window.SPEC_EVAL_ITEM_LISTS = SPEC_EVAL_ITEM_LISTS;
window.buildSpecEvalRow = buildSpecEvalRow;
window.addSpecEvalRow = addSpecEvalRow;
window.clearSpecEvalRows = clearSpecEvalRows;
window.loadSpecEvalTemplate = loadSpecEvalTemplate;
window.renumberSpecEvalRows = renumberSpecEvalRows;
window.getSpecEvalFormSnapshot = getSpecEvalFormSnapshot;
window.buildSpecEvalDatasheetHtml = buildSpecEvalDatasheetHtml;
window.initSpecEvalMatrixUI = initSpecEvalMatrixUI;
window.ensurePortalDemoSpecEvaluations = ensurePortalDemoSpecEvaluations;
window.applySpecEvaluationRecord = applySpecEvaluationRecord;
