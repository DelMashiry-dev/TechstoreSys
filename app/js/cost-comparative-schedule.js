/* cost-comparative-schedule.js — Cost Comparative Schedule for AIAD due diligence */

const CCS_VENDORS = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

function ensureCostComparativeSchedules() {
    if (!appState) return [];
    if (!Array.isArray(appState.costComparativeSchedules)) {
        appState.costComparativeSchedules = [];
    }
    return appState.costComparativeSchedules;
}

function buildCcsItemRow(data = {}) {
    const tr = document.createElement('tr');
    tr.className = 'ccs-item-row';
    const qty = data.qty != null ? data.qty : '';
    const desc = data.description || '';
    const prices = data.prices || {};
    const vendorCells = CCS_VENDORS.map((letter) => {
        const val = prices[letter] != null && prices[letter] !== '' ? prices[letter] : '';
        return `<td><input type="number" class="form-control ccs-price" data-vendor="${letter}" min="0" step="0.01" value="${val}" inputmode="decimal" aria-label="Vendor ${letter} price"></td>`;
    }).join('');
    tr.innerHTML = `
        <td class="ccs-ser">1</td>
        <td><input type="text" class="form-control ccs-desc" value="${String(desc).replace(/"/g, '&quot;')}" placeholder="Item description"></td>
        <td><input type="number" class="form-control ccs-qty" min="0" step="1" value="${qty}" inputmode="numeric" aria-label="Quantity"></td>
        ${vendorCells}
        <td class="ccs-screen-only"><button type="button" class="btn btn-danger btn-sm ccs-remove-row">Remove</button></td>
    `;
    return tr;
}

function renumberCcsRows() {
    document.querySelectorAll('#ccs-table-body .ccs-item-row').forEach((tr, i) => {
        const ser = tr.querySelector('.ccs-ser');
        if (ser) ser.textContent = String(i + 1);
    });
}

function refreshCcsVendorDatalist() {
    const list = document.getElementById('ccsWinningVendorList');
    if (!list) return;
    const names = CCS_VENDORS
        .map((letter) => (document.getElementById(`ccsVendor${letter}`)?.value || '').trim())
        .filter(Boolean);
    list.innerHTML = names.map((n) => `<option value="${n.replace(/"/g, '&quot;')}"></option>`).join('');
}

function refreshCcsDpF1Datalist() {
    const list = document.getElementById('ccsDpF1RefList');
    if (!list) return;
    const dps = typeof ensureDpProcurements === 'function'
        ? ensureDpProcurements()
        : (appState?.dpProcurements || []);
    const refs = [...new Set((dps || []).map((r) => r.refNo).filter(Boolean))];
    list.innerHTML = refs.map((r) => `<option value="${String(r).replace(/"/g, '&quot;')}"></option>`).join('');
}

function getCcsVendorTotals() {
    const totals = Object.fromEntries(CCS_VENDORS.map((v) => [v, 0]));
    const has = Object.fromEntries(CCS_VENDORS.map((v) => [v, false]));
    document.querySelectorAll('#ccs-table-body .ccs-item-row').forEach((tr) => {
        CCS_VENDORS.forEach((letter) => {
            const input = tr.querySelector(`.ccs-price[data-vendor="${letter}"]`);
            const n = Number(input?.value);
            if (Number.isFinite(n) && input.value !== '') {
                totals[letter] += n;
                has[letter] = true;
            }
        });
    });
    return { totals, has };
}

function updateCcsTotals() {
    const { totals, has } = getCcsVendorTotals();
    const currency = document.getElementById('ccsCurrency')?.value || 'USD';
    document.querySelectorAll('.ccs-total').forEach((cell) => {
        const letter = cell.getAttribute('data-vendor');
        if (!has[letter]) {
            cell.textContent = '—';
            cell.classList.remove('is-best');
            return;
        }
        cell.textContent = `${currency} ${totals[letter].toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    });
    const scored = CCS_VENDORS.filter((v) => has[v]);
    if (scored.length) {
        let best = scored[0];
        scored.forEach((v) => {
            if (totals[v] < totals[best]) best = v;
        });
        document.querySelectorAll('.ccs-total').forEach((cell) => {
            cell.classList.toggle('is-best', cell.getAttribute('data-vendor') === best);
        });
    }
    refreshCcsVendorDatalist();
}

function collectCcsFormSnapshot() {
    const vendors = {};
    CCS_VENDORS.forEach((letter) => {
        vendors[letter] = (document.getElementById(`ccsVendor${letter}`)?.value || '').trim();
    });
    const items = [];
    document.querySelectorAll('#ccs-table-body .ccs-item-row').forEach((tr) => {
        const prices = {};
        CCS_VENDORS.forEach((letter) => {
            const raw = tr.querySelector(`.ccs-price[data-vendor="${letter}"]`)?.value;
            prices[letter] = raw === '' || raw == null ? '' : Number(raw);
        });
        items.push({
            description: tr.querySelector('.ccs-desc')?.value || '',
            qty: tr.querySelector('.ccs-qty')?.value || '',
            prices
        });
    });
    return {
        id: document.getElementById('ccsRef')?.dataset.scheduleId || `ccs-${Date.now()}`,
        ref: (document.getElementById('ccsRef')?.value || '').trim(),
        date: document.getElementById('ccsDate')?.value || '',
        preparedAt: document.getElementById('ccsPreparedAt')?.value || 'IT Dir',
        dpF1Ref: (document.getElementById('ccsDpF1Ref')?.value || '').trim(),
        currency: document.getElementById('ccsCurrency')?.value || 'USD',
        vendors,
        items,
        winningVendor: (document.getElementById('ccsWinningVendor')?.value || '').trim(),
        winningLetter: document.getElementById('ccsWinningLetter')?.value || '',
        status: document.getElementById('ccsStatus')?.value || 'draft',
        reasons: (document.getElementById('ccsReasons')?.value || '').trim(),
        attachmentsNote: (document.getElementById('ccsAttachmentsNote')?.value || '').trim(),
        aiadCert: (document.getElementById('ccsAiadCert')?.value || '').trim(),
        compiled: {
            no: document.getElementById('ccsCompNo')?.value || '',
            rank: document.getElementById('ccsCompRank')?.value || '',
            name: document.getElementById('ccsCompName')?.value || '',
            sig: document.getElementById('ccsCompSig')?.value || '',
            date: document.getElementById('ccsCompDate')?.value || '',
            appt: document.getElementById('ccsCompAppt')?.value || ''
        },
        checked: {
            no: document.getElementById('ccsCheckNo')?.value || '',
            rank: document.getElementById('ccsCheckRank')?.value || '',
            name: document.getElementById('ccsCheckName')?.value || '',
            sig: document.getElementById('ccsCheckSig')?.value || '',
            date: document.getElementById('ccsCheckDate')?.value || '',
            appt: document.getElementById('ccsCheckAppt')?.value || ''
        },
        approved: {
            no: document.getElementById('ccsApprNo')?.value || '',
            rank: document.getElementById('ccsApprRank')?.value || '',
            name: document.getElementById('ccsApprName')?.value || '',
            sig: document.getElementById('ccsApprSig')?.value || '',
            date: document.getElementById('ccsApprDate')?.value || '',
            appt: document.getElementById('ccsApprAppt')?.value || ''
        },
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser?.username || currentUser?.name || 'user'
    };
}

function applyCcsSnapshot(snap) {
    if (!snap) return;
    const set = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val ?? '';
    };
    const refEl = document.getElementById('ccsRef');
    if (refEl) {
        refEl.value = snap.ref || '';
        refEl.dataset.scheduleId = snap.id || '';
    }
    set('ccsDate', snap.date);
    set('ccsPreparedAt', snap.preparedAt || 'IT Dir');
    set('ccsDpF1Ref', snap.dpF1Ref);
    set('ccsCurrency', snap.currency || 'USD');
    CCS_VENDORS.forEach((letter) => {
        set(`ccsVendor${letter}`, snap.vendors?.[letter] || '');
    });
    set('ccsWinningVendor', snap.winningVendor);
    set('ccsWinningLetter', snap.winningLetter);
    set('ccsStatus', snap.status || 'draft');
    set('ccsReasons', snap.reasons);
    set('ccsAttachmentsNote', snap.attachmentsNote);
    set('ccsAiadCert', snap.aiadCert);
    const applySign = (prefix, block) => {
        set(`${prefix}No`, block?.no);
        set(`${prefix}Rank`, block?.rank);
        set(`${prefix}Name`, block?.name);
        set(`${prefix}Sig`, block?.sig);
        set(`${prefix}Date`, block?.date);
        set(`${prefix}Appt`, block?.appt);
    };
    applySign('ccsComp', snap.compiled);
    applySign('ccsCheck', snap.checked);
    applySign('ccsAppr', snap.approved);

    const body = document.getElementById('ccs-table-body');
    if (body) {
        body.innerHTML = '';
        const items = snap.items?.length ? snap.items : [{}];
        items.forEach((item) => body.appendChild(buildCcsItemRow(item)));
        renumberCcsRows();
    }
    updateCcsTotals();
}

function saveCostComparativeSchedule() {
    if (typeof canEditData === 'function' && !canEditData()) {
        showToast(typeof viewOnlyDenialMessage === 'function' ? viewOnlyDenialMessage() : 'View only.', 'error');
        return null;
    }
    const snap = collectCcsFormSnapshot();
    if (!snap.ref) {
        snap.ref = `CCS/${new Date().getFullYear()}/${String(Date.now()).slice(-4)}`;
        const refEl = document.getElementById('ccsRef');
        if (refEl) refEl.value = snap.ref;
    }
    const list = ensureCostComparativeSchedules();
    const idx = list.findIndex((r) => r.id === snap.id || (snap.ref && r.ref === snap.ref));
    if (idx >= 0) list[idx] = { ...list[idx], ...snap };
    else list.push(snap);

    // Keep a copy on the module payload for print/saveModule compatibility
    if (appState?.modules) {
        appState.modules['cost-comparative-schedule'] = {
            ...(appState.modules['cost-comparative-schedule'] || {}),
            activeScheduleId: snap.id,
            snapshot: snap,
            savedAt: snap.updatedAt
        };
    }

    // Mirror into linked DP procurement cycle when possible
    const dps = typeof ensureDpProcurements === 'function'
        ? ensureDpProcurements()
        : (appState?.dpProcurements || []);
    if (snap.dpF1Ref) {
        const rec = (dps || []).find((r) => r.refNo === snap.dpF1Ref);
        if (rec) {
            rec.costComparativeRef = snap.ref;
            rec.quotationsNotes = [
                rec.quotationsNotes || '',
                `Cost Comparative Schedule ${snap.ref} — winning: ${snap.winningVendor || snap.winningLetter || '—'}`
            ].filter(Boolean).join('\n').trim();
            if (snap.status === 'ready_aiad' || snap.status === 'with_aiad') {
                rec.status = 'aiad_due_diligence';
            }
            if (snap.status === 'dd_cert_awarded' && snap.aiadCert) {
                rec.status = 'aiad_certificate';
                rec.dueDiligenceCert = snap.aiadCert;
            }
        }
    }

    if (typeof saveState === 'function') saveState();
    if (typeof saveModule === 'function') saveModule('cost-comparative-schedule');
    if (typeof recordAccessAudit === 'function') {
        recordAccessAudit('ccs_save', `Saved Cost Comparative Schedule ${snap.ref}`);
    }
    const status = document.getElementById('ccsSaveStatus');
    if (status) status.textContent = `Saved ${snap.ref} · ${new Date().toLocaleString()}`;
    showToast(`Cost Comparative Schedule ${snap.ref} saved.`, 'success');
    return snap;
}

function suggestCcsBestVendor() {
    const { totals, has } = getCcsVendorTotals();
    const scored = CCS_VENDORS.filter((v) => has[v]);
    if (!scored.length) {
        showToast('Enter vendor prices first.', 'error');
        return;
    }
    let best = scored[0];
    scored.forEach((v) => {
        if (totals[v] < totals[best]) best = v;
    });
    const name = (document.getElementById(`ccsVendor${best}`)?.value || '').trim() || `Vendor ${best}`;
    const letterEl = document.getElementById('ccsWinningLetter');
    const winEl = document.getElementById('ccsWinningVendor');
    if (letterEl) letterEl.value = best;
    if (winEl) winEl.value = name;
    const reasons = document.getElementById('ccsReasons');
    if (reasons && !reasons.value.trim()) {
        reasons.value = `Suggested on lowest total quotation (${document.getElementById('ccsCurrency')?.value || 'USD'} ${totals[best].toFixed(2)}). Confirm value for money (quality, lead time, warranty) before AIAD.`;
    }
    updateCcsTotals();
    showToast(`Suggested winning vendor: ${name} (column ${best}).`, 'success');
}

function loadCcsSuppliersIntoVendors() {
    const rows = appState?.modules?.['suppliers-contracts']?.rows
        || (typeof getSuppliersList === 'function' ? getSuppliersList() : null)
        || [];
    let names = [];
    if (Array.isArray(rows) && rows.length) {
        names = rows.map((r) => r.name || r.supplierName || r[0]).filter(Boolean);
    } else {
        // Fallback: try rendered suppliers table / seed
        const seed = typeof IT_DIR_SUPPLIERS_SEED !== 'undefined' ? IT_DIR_SUPPLIERS_SEED : [];
        names = (seed || []).map((s) => s.name || s.supplier).filter(Boolean);
    }
    if (!names.length) {
        // Parse from suppliers view text inputs if present
        document.querySelectorAll('#suppliers-view-body tr td:first-child, #suppliers-table-body input').forEach((el) => {
            const t = (el.value || el.textContent || '').trim();
            if (t) names.push(t);
        });
    }
    names = [...new Set(names)]
        .sort((a, b) => String(a).localeCompare(String(b), undefined, { sensitivity: 'base' }))
        .slice(0, 7);
    if (!names.length) {
        showToast('No suppliers found. Open Suppliers and Contracts first.', 'error');
        return;
    }
    names.forEach((name, i) => {
        const letter = CCS_VENDORS[i];
        const el = document.getElementById(`ccsVendor${letter}`);
        if (el) el.value = name;
    });
    refreshCcsVendorDatalist();
    showToast(`Loaded ${names.length} supplier(s) into Vendor A–G.`, 'success');
}

function prefillCcsFromDpF1() {
    const snap = typeof getDpF1FormSnapshot === 'function' ? getDpF1FormSnapshot() : null;
    const body = document.getElementById('ccs-table-body');
    if (!body) return;

    let items = [];
    if (snap?.items?.length) {
        items = snap.items.map((it) => ({
            description: it.designation || it.description || it.item || '',
            qty: it.qty || it.quantity || '',
            prices: {}
        }));
    } else {
        document.querySelectorAll('#dp-f1-table-body tr').forEach((tr) => {
            const inputs = tr.querySelectorAll('input');
            if (!inputs.length) return;
            const description = inputs[0]?.value || '';
            const qty = inputs[1]?.value || '';
            if (description || qty) items.push({ description, qty, prices: {} });
        });
    }

    const refHint = document.getElementById('ccsDpF1Ref');
    const dps = typeof ensureDpProcurements === 'function' ? ensureDpProcurements() : [];
    if (refHint && !refHint.value && dps?.[0]?.refNo) refHint.value = dps[0].refNo;

    if (!items.length) {
        showToast('No DP F1 lines found. Open DP F1 and enter items first.', 'error');
        return;
    }
    body.innerHTML = '';
    items.forEach((item) => body.appendChild(buildCcsItemRow(item)));
    renumberCcsRows();
    updateCcsTotals();

    const attach = document.getElementById('ccsAttachmentsNote');
    if (attach && !attach.value.trim()) {
        attach.value = `DP F1${refHint?.value ? ` (${refHint.value})` : ''} · Vendor quotations A–G · Spec / Tech Evaluation (if any)`;
    }
    showToast(`Prefilled ${items.length} item(s) from DP F1.`, 'success');
}

function markCcsReadyForAiad() {
    const status = document.getElementById('ccsStatus');
    if (status) status.value = status.value === 'draft' ? 'ready_aiad' : 'with_aiad';
    const win = (document.getElementById('ccsWinningVendor')?.value || '').trim();
    if (!win) {
        showToast('Select a winning vendor (value for money) before sending to AIAD.', 'error');
        return;
    }
    const snap = saveCostComparativeSchedule();
    if (!snap) return;
    if (typeof recordAccessAudit === 'function') {
        recordAccessAudit('ccs_aiad', `Cost Comparative ${snap.ref} → AIAD due diligence`);
    }
    showToast('Schedule marked for AIAD Due Diligence (attach DP F1 + quotations).', 'success');
    if (typeof navigateToModule === 'function') {
        // Stay on form; user can open cycle separately
    }
}

function initCostComparativeScheduleModule() {
    const root = document.getElementById('cost-comparative-schedule');
    if (!root) return;

    const body = document.getElementById('ccs-table-body');
    if (body && !body.children.length) {
        body.appendChild(buildCcsItemRow());
        body.appendChild(buildCcsItemRow());
        renumberCcsRows();
    }

    const dateEl = document.getElementById('ccsDate');
    if (dateEl && !dateEl.value) {
        dateEl.value = new Date().toISOString().slice(0, 10);
    }

    // Restore latest saved schedule if present
    const list = ensureCostComparativeSchedules();
    const mod = appState?.modules?.['cost-comparative-schedule'];
    const active = list.find((r) => r.id === mod?.activeScheduleId)
        || mod?.snapshot
        || list[list.length - 1];
    if (active) applyCcsSnapshot(active);

    refreshCcsDpF1Datalist();
    refreshCcsVendorDatalist();
    updateCcsTotals();

    if (root.dataset.ccsInit === '1') return;
    root.dataset.ccsInit = '1';

    root.addEventListener('input', (e) => {
        if (e.target.matches('.ccs-price, .ccs-qty, .ccs-vendor-name, #ccsCurrency')) {
            updateCcsTotals();
        }
    });
    root.addEventListener('click', (e) => {
        if (e.target.closest('.ccs-remove-row')) {
            e.target.closest('tr')?.remove();
            renumberCcsRows();
            updateCcsTotals();
        }
        const nav = e.target.closest('[data-target-nav]')?.getAttribute('data-target-nav');
        if (nav && typeof navigateToModule === 'function') {
            e.preventDefault();
            navigateToModule(nav);
        }
    });

    document.getElementById('ccsAddRowBtn')?.addEventListener('click', () => {
        document.getElementById('ccs-table-body')?.appendChild(buildCcsItemRow());
        renumberCcsRows();
    });
    document.getElementById('ccsSaveBtn')?.addEventListener('click', saveCostComparativeSchedule);
    document.getElementById('ccsSuggestBestBtn')?.addEventListener('click', suggestCcsBestVendor);
    document.getElementById('ccsLoadSuppliersBtn')?.addEventListener('click', loadCcsSuppliersIntoVendors);
    document.getElementById('ccsPrefillDpF1Btn')?.addEventListener('click', prefillCcsFromDpF1);
    document.getElementById('ccsSendAiadBtn')?.addEventListener('click', markCcsReadyForAiad);

    document.getElementById('ccsWinningLetter')?.addEventListener('change', () => {
        const letter = document.getElementById('ccsWinningLetter')?.value;
        if (!letter) return;
        const name = (document.getElementById(`ccsVendor${letter}`)?.value || '').trim();
        const win = document.getElementById('ccsWinningVendor');
        if (win && name) win.value = name;
    });
}

window.ensureCostComparativeSchedules = ensureCostComparativeSchedules;
window.initCostComparativeScheduleModule = initCostComparativeScheduleModule;
window.saveCostComparativeSchedule = saveCostComparativeSchedule;
window.buildCcsItemRow = buildCcsItemRow;
