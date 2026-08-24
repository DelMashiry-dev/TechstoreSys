/* dp-procurement.js — ITDIR ICT Procurement Cycle (aligned to ZNA 8-step pipeline) */

/**
 * Official cycle (ITDIR cost centre for ICT via DP + DAF):
 * 1 Requisition → 2 Spec/tech to raise F1 → 3 F1 to DP (quotes) → ITDIR tech/spec eval of quotes
 *   → return F1+spec to DP → 4 AIAD due diligence → 5 DP raises e-PO (budgeted) or manual PO (DAF auth)
 *   → 6 Supply + DN → 7 Verify delivery → 8 Payment
 */

const DP_PROC_STATUS_LEGACY = {
    sent_to_dp: 'f1_with_dp',
    suppliers_identified: 'f1_with_dp',
    quotations_received: 'quotes_itdir_eval',
    cost_comparison: 'quotes_itdir_eval',
    sent_to_audit: 'aiad_due_diligence',
    due_diligence: 'aiad_certificate',
    awarded: 'po_electronic'
};

const DP_PROC_STATUSES = [
    { value: 'requisition', step: 1, label: '1. Requisition (user / unit / formation)', short: '1 Requisition', group: 'itdir' },
    { value: 'spec_raise_f1', step: 2, label: '2. Spec / tech evaluation to raise DP F1', short: '2 Spec→F1', group: 'itdir' },
    { value: 'f1_with_dp', step: 3, label: '3. F1 with DP — call for quotations', short: '3 F1→DP', group: 'dp' },
    { value: 'quotes_itdir_eval', step: 3, label: '3b. Quotations with ITDIR — tech / spec evaluation', short: '3b ITDIR eval', group: 'itdir' },
    { value: 'spec_returned_dp', step: 3, label: '3c. Spec eval + F1 returned to DP', short: '3c Spec→DP', group: 'dp' },
    { value: 'aiad_due_diligence', step: 4, label: '4. AIAD due diligence (F1 + spec + quotations)', short: '4 AIAD', group: 'aiad' },
    { value: 'aiad_certificate', step: 4, label: '4b. AIAD certificate returned to DP', short: '4b AIAD cert', group: 'aiad' },
    { value: 'po_electronic', step: 5, label: '5. Electronic P/O raised (against target / budget)', short: '5 e-PO', group: 'dp' },
    { value: 'po_manual_pending_daf', step: 5, label: '5. Manual P/O — awaiting DAF authorisation', short: '5 Manual/DAF', group: 'daf' },
    { value: 'po_manual_authorised', step: 5, label: '5b. Manual P/O authorised by DAF', short: '5b DAF OK', group: 'daf' },
    { value: 'supply_delivery', step: 6, label: '6. Supply of goods / services with delivery note', short: '6 Delivery', group: 'supply' },
    { value: 'delivery_verified', step: 7, label: '7. Verification of delivery', short: '7 Verified', group: 'itdir' },
    { value: 'payment_complete', step: 8, label: '8. Payment of goods / services after delivery', short: '8 Paid', group: 'finance' },
    { value: 'cancelled', step: null, label: 'Cancelled / withdrawn', short: 'Cancelled', group: 'closed' }
];

const DP_PROC_STAGE_ORDER_BUDGETED = [
    'requisition',
    'spec_raise_f1',
    'f1_with_dp',
    'quotes_itdir_eval',
    'spec_returned_dp',
    'aiad_due_diligence',
    'aiad_certificate',
    'po_electronic',
    'supply_delivery',
    'delivery_verified',
    'payment_complete'
];

const DP_PROC_STAGE_ORDER_MANUAL = [
    'requisition',
    'spec_raise_f1',
    'f1_with_dp',
    'quotes_itdir_eval',
    'spec_returned_dp',
    'aiad_due_diligence',
    'aiad_certificate',
    'po_manual_pending_daf',
    'po_manual_authorised',
    'supply_delivery',
    'delivery_verified',
    'payment_complete'
];

const DP_PROC_CLOSED = new Set(['payment_complete', 'cancelled']);

const DP_PROC_OPEN = new Set(
    DP_PROC_STATUSES.map((s) => s.value).filter((v) => !DP_PROC_CLOSED.has(v))
);

function normalizeDpProcStatus(status) {
    if (!status) return 'f1_with_dp';
    return DP_PROC_STATUS_LEGACY[status] || status;
}

function ensureDpProcurements() {
    if (!appState) return [];
    if (!Array.isArray(appState.dpProcurements)) {
        appState.dpProcurements = (typeof createDefaultDpProcurements === 'function')
            ? createDefaultDpProcurements()
            : [];
    }
    appState.dpProcurements.forEach((rec) => {
        const next = normalizeDpProcStatus(rec.status);
        if (next !== rec.status) rec.status = next;
        if (Array.isArray(rec.history)) {
            rec.history.forEach((h) => {
                h.status = normalizeDpProcStatus(h.status);
            });
        }
    });
    return appState.dpProcurements;
}

function getDpProcStatusMeta(value) {
    const key = normalizeDpProcStatus(value);
    return DP_PROC_STATUSES.find((s) => s.value === key) || { value: key, label: key || '—', short: key || '—', step: null };
}

function getDpProcStatusLabel(value) {
    return getDpProcStatusMeta(value).label;
}

function getDpProcStageOrder(rec) {
    const provisioned = (rec?.budgetProvisioned || document.getElementById('dpProcBudgeted')?.value || 'yes') !== 'no';
    return provisioned ? DP_PROC_STAGE_ORDER_BUDGETED : DP_PROC_STAGE_ORDER_MANUAL;
}

function nextDpProcRef() {
    const list = ensureDpProcurements();
    const year = new Date().getFullYear();
    const prefix = `DP-${year}-`;
    let max = 0;
    list.forEach((rec) => {
        const m = String(rec.refNo || '').match(new RegExp(`^DP-${year}-(\\d+)$`, 'i'));
        if (m) max = Math.max(max, parseInt(m[1], 10) || 0);
    });
    return `${prefix}${String(max + 1).padStart(4, '0')}`;
}

function dpProcTodayIso() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function dpProcEscape(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function summarizeDpF1Items(items) {
    const list = Array.isArray(items) ? items : [];
    if (!list.length) return 'No line items';
    const names = list.map((i) => i.designation).filter(Boolean);
    if (!names.length) return `${list.length} line item(s)`;
    if (names.length === 1) return names[0];
    if (names.length === 2) return `${names[0]}; ${names[1]}`;
    return `${names[0]}; ${names[1]} (+${names.length - 2} more)`;
}

function findOpenDpProcurementForCurrentForm() {
    const snap = typeof getDpF1FormSnapshot === 'function' ? getDpF1FormSnapshot() : null;
    if (!snap) return null;
    const list = ensureDpProcurements();
    const date = snap.date || '';
    const gl = snap.glValue || '';
    const summary = summarizeDpF1Items(snap.items);
    return list.find((rec) => (
        DP_PROC_OPEN.has(normalizeDpProcStatus(rec.status)) &&
        (rec.snapshot?.date || '') === date &&
        (rec.snapshot?.glValue || '') === gl &&
        summarizeDpF1Items(rec.snapshot?.items) === summary
    )) || null;
}

function getLatestOpenDpProcurement() {
    const list = ensureDpProcurements()
        .filter((r) => DP_PROC_OPEN.has(normalizeDpProcStatus(r.status)))
        .sort((a, b) => String(b.sentAt || '').localeCompare(String(a.sentAt || '')));
    return list[0] || null;
}

function validateDpF1ForSend(snap) {
    if (!snap) return 'Unable to read DP F1 form.';
    if (!snap.items || !snap.items.length) {
        return 'Add at least one goods/services/equipment line before sending to DP.';
    }
    const missingDesignation = snap.items.some((i) => !String(i.designation || '').trim());
    if (missingDesignation) {
        return 'Each line item needs an official designation before sending to DP.';
    }
    if (!snap.estimatedCost) {
        return 'Enter estimated cost (section 2) before sending to DP.';
    }
    if (!snap.glValue) {
        return 'Select the General Ledger to be charged (section 4) before sending to DP.';
    }
    const officer = snap.officers?.[0];
    if (!officer || !officer.name) {
        return 'Enter the designated Provision Officer name (section 7) before sending to DP.';
    }

    const funding = typeof checkDpF1Funding === 'function' ? checkDpF1Funding(snap) : null;
    if (funding && !funding.ok) {
        return funding.message;
    }
    return '';
}

function sendDpF1ToDirectorateOfProcurement() {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;

    if (typeof getDpF1FormSnapshot !== 'function') {
        showToast('DP F1 form is not available.', 'error');
        return;
    }

    const snap = getDpF1FormSnapshot();
    const error = validateDpF1ForSend(snap);
    if (error) {
        showToast(error, 'error');
        return;
    }

    const existing = findOpenDpProcurementForCurrentForm();
    if (existing) {
        const go = confirm(
            `This indent appears already in the procurement cycle as ${existing.refNo} (${getDpProcStatusLabel(existing.status)}).\n\nOpen the ICT Procurement Cycle instead?`
        );
        if (go && typeof navigateToModule === 'function') {
            navigateToModule('dp-procurement');
            setTimeout(() => editDpProcurement(existing.id), 50);
        }
        return;
    }

    const itemSummary = summarizeDpF1Items(snap.items);
    const ok = confirm(
        `Send this completed IT Dir F1 to Directorate of Procurement (DP)?\n\n` +
        `Items: ${itemSummary}\n` +
        `Estimated cost: ${snap.estimatedCost}\n` +
        `GL / vote: ${snap.glDisplay || snap.glValue}\n\n` +
        `Next: DP calls for quotations → ITDIR tech/spec evaluation of quotes → ` +
        `return F1+spec to DP → AIAD due diligence → DP raises Electronic or Manual P/O (DAF auth if unbudgeted) → delivery → verification → payment.`
    );
    if (!ok) return;

    if (typeof saveModule === 'function') {
        saveModule('dp-f1-form');
    }

    const now = new Date().toISOString();
    const user = (typeof currentUser !== 'undefined' && currentUser) ? currentUser : null;
    const officialHtml = typeof buildDpF1OfficialHtml === 'function' ? buildDpF1OfficialHtml() : '';

    const record = {
        id: `dpp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        refNo: nextDpProcRef(),
        status: 'f1_with_dp',
        sentAt: now,
        sentDate: snap.date || dpProcTodayIso(),
        sentBy: user?.name || user?.username || 'ITDIR',
        itemSummary,
        estimatedCost: snap.estimatedCost || '',
        glValue: snap.glValue || '',
        glDisplay: snap.glDisplay || '',
        costCentre: snap.costCentre || '',
        delivery: snap.delivery || '',
        remarks: snap.remarks || '',
        officers: snap.officers || [],
        snapshot: snap,
        officialHtml,
        requisitionRef: '',
        budgetProvisioned: 'yes',
        suppliersIdentified: '',
        quotationsNotes: '',
        itdirSpecEvalNotes: '',
        auditRef: '',
        dueDiligenceCert: '',
        awardedSupplier: '',
        awardedQuotationRef: '',
        poNumber: '',
        dafAuthRef: '',
        deliveryNoteRef: '',
        verificationNotes: '',
        paymentRef: '',
        pipelineNotes: '',
        history: [
            {
                at: now,
                status: 'f1_with_dp',
                by: user?.name || user?.username || 'ITDIR',
                note: 'Step 3: IT Dir F1 submitted to DP for call for quotations (ICT procurement cycle).'
            }
        ],
        updatedAt: now
    };

    ensureDpProcurements().unshift(record);
    if (typeof saveState === 'function') saveState();
    updateDpF1SendStatus();
    if (typeof updateSystemAlerts === 'function') updateSystemAlerts();
    if (typeof updateDashboard === 'function') updateDashboard();

    showToast(`${record.refNo} entered procurement cycle — F1 with DP (call for quotations).`);

    const openPipe = confirm('Open ICT Procurement Cycle to track this F1?');
    if (openPipe && typeof navigateToModule === 'function') {
        navigateToModule('dp-procurement');
        setTimeout(() => editDpProcurement(record.id), 50);
    }
}

function updateDpF1SendStatus() {
    const banner = document.getElementById('dpF1SendStatus');
    const btn = document.getElementById('btnSendDpF1ToDp');
    if (!banner) return;

    const open = getLatestOpenDpProcurement();
    if (!open) {
        banner.hidden = true;
        banner.innerHTML = '';
        if (btn) {
            btn.disabled = false;
            btn.textContent = 'Send to Directorate of Procurement (DP)';
        }
        return;
    }

    const meta = getDpProcStatusMeta(open.status);
    banner.hidden = false;
    banner.innerHTML = `
        <strong>${dpProcEscape(open.refNo)}</strong> in procurement cycle —
        <span class="dp-proc-status-pill dp-proc-status-${dpProcEscape(normalizeDpProcStatus(open.status))}">${dpProcEscape(meta.short)}</span>
        <span class="dp-proc-banner-detail">${dpProcEscape(open.itemSummary)}</span>
        <button type="button" class="btn btn-secondary btn-sm" id="dpF1OpenPipelineBtn">Open cycle</button>
    `;
    banner.querySelector('#dpF1OpenPipelineBtn')?.addEventListener('click', () => {
        if (typeof navigateToModule === 'function') {
            navigateToModule('dp-procurement');
            setTimeout(() => editDpProcurement(open.id), 50);
        }
    });
}

function getDpProcurementSummary() {
    const summary = { open: 0, withDp: 0, itdirEval: 0, aiad: 0, po: 0, delivery: 0, paid: 0, cancelled: 0 };
    ensureDpProcurements().forEach((rec) => {
        const status = normalizeDpProcStatus(rec.status);
        if (status === 'payment_complete') summary.paid += 1;
        else if (status === 'cancelled') summary.cancelled += 1;
        else if (DP_PROC_OPEN.has(status)) {
            summary.open += 1;
            if (status === 'quotes_itdir_eval' || status === 'spec_raise_f1' || status === 'requisition' || status === 'delivery_verified') {
                summary.itdirEval += 1;
            } else if (status === 'aiad_due_diligence' || status === 'aiad_certificate') {
                summary.aiad += 1;
            } else if (status === 'po_electronic' || status === 'po_manual_pending_daf' || status === 'po_manual_authorised') {
                summary.po += 1;
            } else if (status === 'supply_delivery') {
                summary.delivery += 1;
            } else {
                summary.withDp += 1;
            }
        }
    });
    return summary;
}

function getDpProcurementAlerts(options = {}) {
    const alerts = [];
    const itdirSet = typeof ALERT_PENDING_AT_ITDIR_STATUSES !== 'undefined'
        ? ALERT_PENDING_AT_ITDIR_STATUSES
        : new Set(['requisition', 'spec_raise_f1', 'quotes_itdir_eval', 'delivery_verified']);
    const dpSet = typeof ALERT_PENDING_AT_DP_STATUSES !== 'undefined'
        ? ALERT_PENDING_AT_DP_STATUSES
        : new Set(['f1_with_dp', 'spec_returned_dp', 'aiad_due_diligence', 'aiad_certificate']);
    const watchCovered = new Set([...itdirSet, ...dpSet]);

    ensureDpProcurements().forEach((rec) => {
        const status = normalizeDpProcStatus(rec.status);
        if (!DP_PROC_OPEN.has(status)) return;
        // Dashboard watch sections cover IT Dir + DP pending requisitions
        if ((options.skipWatchCovered || options.skipPendingAtDp) && watchCovered.has(status)) return;
        const meta = getDpProcStatusMeta(status);
        let type = 'info';
        if (status === 'po_manual_pending_daf' || status === 'aiad_due_diligence' || status === 'quotes_itdir_eval') {
            type = 'warning';
        }
        alerts.push({
            type,
            target: 'dp-procurement',
            dpId: rec.id,
            text: `Procurement ${rec.refNo}: ${meta.short} — ${rec.itemSummary}`
        });
    });
    return alerts;
}

function fillDpProcurementStatusOptions(selected) {
    const sel = document.getElementById('dpProcStatus');
    if (!sel) return;
    const current = normalizeDpProcStatus(selected);
    sel.innerHTML = DP_PROC_STATUSES.map((s) => (
        `<option value="${s.value}"${s.value === current ? ' selected' : ''}>${dpProcEscape(s.label)}</option>`
    )).join('');
}

function renderDpProcCycleStrip(activeStatus) {
    const strip = document.getElementById('dpProcCycleStrip');
    if (!strip) return;
    const active = normalizeDpProcStatus(activeStatus);
    const activeStep = getDpProcStatusMeta(active).step;
    const steps = [
        { n: 1, title: 'Requisition', hint: 'User / unit' },
        { n: 2, title: 'Spec → F1', hint: 'Raise DP F1' },
        { n: 3, title: 'F1 → DP', hint: 'Quotes + ITDIR eval' },
        { n: 4, title: 'AIAD', hint: 'Due diligence' },
        { n: 5, title: 'P/O', hint: 'e-PO or Manual/DAF' },
        { n: 6, title: 'Supply', hint: 'Delivery note' },
        { n: 7, title: 'Verify', hint: 'Accept delivery' },
        { n: 8, title: 'Payment', hint: 'After delivery' }
    ];
    strip.innerHTML = steps.map((s) => {
        const state = activeStep == null
            ? ''
            : (s.n < activeStep ? ' is-done' : (s.n === activeStep ? ' is-active' : ''));
        return `
            <div class="dp-cycle-step${state}" data-cycle-step="${s.n}">
                <span class="dp-cycle-num">${s.n}</span>
                <span class="dp-cycle-title">${dpProcEscape(s.title)}</span>
                <span class="dp-cycle-hint">${dpProcEscape(s.hint)}</span>
            </div>
        `;
    }).join('');
}

function clearDpProcurementForm() {
    const set = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.value = value ?? '';
    };
    set('dpProcEditId', '');
    set('dpProcRefNo', '');
    set('dpProcSentDate', '');
    set('dpProcItemSummary', '');
    set('dpProcEstimatedCost', '');
    set('dpProcGl', '');
    set('dpProcRequisitionRef', '');
    set('dpProcBudgeted', 'yes');
    set('dpProcSuppliers', '');
    set('dpProcQuotations', '');
    set('dpProcItdirEval', '');
    set('dpProcAuditRef', '');
    set('dpProcDdCert', '');
    set('dpProcAwarded', '');
    set('dpProcAwardedQuote', '');
    set('dpProcPoNumber', '');
    set('dpProcDafAuth', '');
    set('dpProcDeliveryNote', '');
    set('dpProcVerification', '');
    set('dpProcPaymentRef', '');
    set('dpProcNotes', '');
    fillDpProcurementStatusOptions('f1_with_dp');
    renderDpProcCycleStrip(null);
    if (typeof updateDpProcurementStockStatus === 'function') updateDpProcurementStockStatus(null);
    const title = document.getElementById('dpProcFormTitle');
    if (title) title.textContent = 'Select a cycle record to update status';
    const hist = document.getElementById('dpProcHistory');
    if (hist) hist.innerHTML = '<p class="dp-proc-muted">No record selected.</p>';
    const preview = document.getElementById('dpProcPreview');
    if (preview) preview.innerHTML = '';
}

function editDpProcurement(id) {
    const rec = ensureDpProcurements().find((r) => r.id === id);
    if (!rec) {
        showToast('Procurement record not found.', 'error');
        return;
    }
    const status = normalizeDpProcStatus(rec.status);
    const set = (fid, value) => {
        const el = document.getElementById(fid);
        if (el) el.value = value ?? '';
    };
    set('dpProcEditId', rec.id);
    set('dpProcRefNo', rec.refNo || '');
    set('dpProcSentDate', rec.sentDate || (rec.sentAt || '').slice(0, 10));
    set('dpProcItemSummary', rec.itemSummary || '');
    set('dpProcEstimatedCost', rec.estimatedCost || '');
    set('dpProcGl', rec.glDisplay || rec.glValue || '');
    set('dpProcRequisitionRef', rec.requisitionRef || '');
    set('dpProcBudgeted', rec.budgetProvisioned || 'yes');
    set('dpProcSuppliers', rec.suppliersIdentified || '');
    set('dpProcQuotations', rec.quotationsNotes || '');
    set('dpProcItdirEval', rec.itdirSpecEvalNotes || rec.costComparisonNotes || '');
    set('dpProcAuditRef', rec.auditRef || '');
    set('dpProcDdCert', rec.dueDiligenceCert || '');
    set('dpProcAwarded', rec.awardedSupplier || '');
    set('dpProcAwardedQuote', rec.awardedQuotationRef || '');
    set('dpProcPoNumber', rec.poNumber || '');
    set('dpProcDafAuth', rec.dafAuthRef || '');
    set('dpProcDeliveryNote', rec.deliveryNoteRef || '');
    set('dpProcVerification', rec.verificationNotes || '');
    set('dpProcPaymentRef', rec.paymentRef || '');
    set('dpProcNotes', rec.pipelineNotes || '');
    fillDpProcurementStatusOptions(status);
    renderDpProcCycleStrip(status);
    if (typeof updateDpProcurementStockStatus === 'function') updateDpProcurementStockStatus(rec);

    const title = document.getElementById('dpProcFormTitle');
    if (title) title.textContent = `Update ${rec.refNo}`;

    const hist = document.getElementById('dpProcHistory');
    if (hist) {
        const rows = (rec.history || []).slice().reverse().map((h) => `
            <li>
                <strong>${dpProcEscape(getDpProcStatusLabel(h.status))}</strong>
                <span class="dp-proc-muted">${dpProcEscape((h.at || '').replace('T', ' ').slice(0, 19))} — ${dpProcEscape(h.by || '')}</span>
                ${h.note ? `<div>${dpProcEscape(h.note)}</div>` : ''}
            </li>
        `).join('');
        hist.innerHTML = rows ? `<ul class="dp-proc-history-list">${rows}</ul>` : '<p class="dp-proc-muted">No history yet.</p>';
    }

    const preview = document.getElementById('dpProcPreview');
    if (preview) {
        preview.innerHTML = rec.officialHtml
            ? `<div class="dp-proc-preview-doc">${rec.officialHtml}</div>`
            : '<p class="dp-proc-muted">No captured official F1 HTML.</p>';
    }

    document.getElementById('dpProcStatus')?.focus();
}

function readDpProcurementForm() {
    return {
        id: document.getElementById('dpProcEditId')?.value || '',
        status: normalizeDpProcStatus(document.getElementById('dpProcStatus')?.value || 'f1_with_dp'),
        requisitionRef: (document.getElementById('dpProcRequisitionRef')?.value || '').trim(),
        budgetProvisioned: document.getElementById('dpProcBudgeted')?.value || 'yes',
        suppliersIdentified: (document.getElementById('dpProcSuppliers')?.value || '').trim(),
        quotationsNotes: (document.getElementById('dpProcQuotations')?.value || '').trim(),
        itdirSpecEvalNotes: (document.getElementById('dpProcItdirEval')?.value || '').trim(),
        auditRef: (document.getElementById('dpProcAuditRef')?.value || '').trim(),
        dueDiligenceCert: (document.getElementById('dpProcDdCert')?.value || '').trim(),
        awardedSupplier: (document.getElementById('dpProcAwarded')?.value || '').trim(),
        awardedQuotationRef: (document.getElementById('dpProcAwardedQuote')?.value || '').trim(),
        poNumber: (document.getElementById('dpProcPoNumber')?.value || '').trim(),
        dafAuthRef: (document.getElementById('dpProcDafAuth')?.value || '').trim(),
        deliveryNoteRef: (document.getElementById('dpProcDeliveryNote')?.value || '').trim(),
        verificationNotes: (document.getElementById('dpProcVerification')?.value || '').trim(),
        paymentRef: (document.getElementById('dpProcPaymentRef')?.value || '').trim(),
        pipelineNotes: (document.getElementById('dpProcNotes')?.value || '').trim()
    };
}

function saveDpProcurementFromForm() {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;

    const data = readDpProcurementForm();
    if (!data.id) {
        showToast('Select a procurement cycle record from the list first.', 'error');
        return;
    }
    const list = ensureDpProcurements();
    const idx = list.findIndex((r) => r.id === data.id);
    if (idx < 0) {
        showToast('Procurement record not found.', 'error');
        return;
    }

    const prev = list[idx];
    const status = data.status;

    if ((status === 'aiad_certificate' || status === 'po_electronic' || status === 'po_manual_pending_daf' || status === 'po_manual_authorised')
        && !data.dueDiligenceCert && !data.auditRef) {
        showToast('Enter the AIAD due diligence certificate / reference.', 'error');
        document.getElementById('dpProcDdCert')?.focus();
        return;
    }
    if ((status === 'po_electronic' || status === 'po_manual_authorised' || status === 'supply_delivery')
        && !data.awardedSupplier) {
        showToast('Enter the awarded supplier (from AIAD-certified quotation).', 'error');
        document.getElementById('dpProcAwarded')?.focus();
        return;
    }
    if ((status === 'po_manual_pending_daf' || status === 'po_manual_authorised') && data.budgetProvisioned === 'yes') {
        const switchOk = confirm(
            'Manual P/O is for items not covered by a target/budget.\n\nMark this as NOT provisioned against target/budget?'
        );
        if (switchOk) data.budgetProvisioned = 'no';
    }
    if (status === 'po_manual_authorised' && !data.dafAuthRef) {
        showToast('Enter DAF authorisation reference before marking Manual P/O as authorised.', 'error');
        document.getElementById('dpProcDafAuth')?.focus();
        return;
    }
    if ((status === 'po_electronic' || status === 'po_manual_authorised') && !data.poNumber) {
        showToast('Enter the Purchase Order number.', 'error');
        document.getElementById('dpProcPoNumber')?.focus();
        return;
    }
    if ((status === 'supply_delivery' || status === 'delivery_verified' || status === 'payment_complete')
        && !data.deliveryNoteRef) {
        showToast('Enter the delivery note reference.', 'error');
        document.getElementById('dpProcDeliveryNote')?.focus();
        return;
    }
    if (status === 'payment_complete' && !data.paymentRef) {
        showToast('Enter payment reference before closing the cycle.', 'error');
        document.getElementById('dpProcPaymentRef')?.focus();
        return;
    }

    const now = new Date().toISOString();
    const user = (typeof currentUser !== 'undefined' && currentUser) ? currentUser : null;
    const history = Array.isArray(prev.history) ? [...prev.history] : [];
    if (status !== normalizeDpProcStatus(prev.status)) {
        history.push({
            at: now,
            status,
            by: user?.name || user?.username || 'User',
            note: data.pipelineNotes || `Advanced to ${getDpProcStatusLabel(status)}.`
        });
    }

    if (status === 'delivery_verified' && typeof validateWorkshopCertForDeliveryVerified === 'function') {
        const draftRec = {
            ...prev,
            ...data,
            poNumber: data.poNumber,
            deliveryNoteRef: data.deliveryNoteRef,
            awardedSupplier: data.awardedSupplier,
            itemSummary: data.itemSummary,
            snapshot: prev.snapshot
        };
        const wrcVerifyErr = validateWorkshopCertForDeliveryVerified(draftRec);
        if (wrcVerifyErr) {
            showToast(wrcVerifyErr, 'error');
            return;
        }
    }

    list[idx] = {
        ...prev,
        ...data,
        status,
        history,
        updatedAt: now
    };

    const becameVerified = status === 'delivery_verified'
        && normalizeDpProcStatus(prev.status) !== 'delivery_verified';

    if (typeof saveState === 'function') saveState();
    renderDpProcurementModule();
    editDpProcurement(data.id);
    updateDpF1SendStatus();
    if (typeof updateSystemAlerts === 'function') updateSystemAlerts();
    showToast(`${prev.refNo} updated — ${getDpProcStatusLabel(status)}.`);

    // Inventory must be informed by what we procure & receive
    if (becameVerified && typeof postProcurementDeliveryToStock === 'function') {
        const postNow = confirm(
            'Delivery verified.\n\nPost these goods into Stores Inventory now?\n\n' +
            '(Opening + Received − Issued = On Hand — reports will account for this receipt.)'
        );
        if (postNow) {
            postProcurementDeliveryToStock(list[idx]);
            editDpProcurement(data.id);
        }
    }
}

function advanceDpProcurementStage() {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;
    const id = document.getElementById('dpProcEditId')?.value;
    if (!id) {
        showToast('Select a procurement cycle record first.', 'error');
        return;
    }
    const rec = ensureDpProcurements().find((r) => r.id === id);
    if (!rec) return;
    const status = normalizeDpProcStatus(rec.status);
    if (DP_PROC_CLOSED.has(status)) {
        showToast('This procurement cycle is already closed.', 'info');
        return;
    }

    if (status === 'aiad_certificate') {
        const choice = confirm(
            'Is this requisition covered by a DAF target / budget / vote?\n\nOK = Yes → Electronic P/O\nCancel = No → Manual P/O (needs DAF authorisation)'
        );
        const nextPo = choice ? 'po_electronic' : 'po_manual_pending_daf';
        const budgetEl = document.getElementById('dpProcBudgeted');
        if (budgetEl) budgetEl.value = choice ? 'yes' : 'no';
        const sel = document.getElementById('dpProcStatus');
        if (sel) sel.value = nextPo;
        saveDpProcurementFromForm();
        return;
    }

    const order = getDpProcStageOrder({
        ...rec,
        budgetProvisioned: document.getElementById('dpProcBudgeted')?.value || rec.budgetProvisioned || 'yes'
    });
    const i = order.indexOf(status);
    const next = i < 0 ? order[0] : order[Math.min(i + 1, order.length - 1)];
    if (next === status) {
        showToast('Already at the final stage of this path.', 'info');
        return;
    }
    const sel = document.getElementById('dpProcStatus');
    if (sel) sel.value = next;
    saveDpProcurementFromForm();
}

function deleteDpProcurement(id) {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;
    const list = ensureDpProcurements();
    const rec = list.find((r) => r.id === id);
    if (!rec) return;
    if (!confirm(`Delete procurement record ${rec.refNo}? This cannot be undone.`)) return;
    const idx = list.findIndex((r) => r.id === id);
    if (idx >= 0) list.splice(idx, 1);
    if (typeof saveState === 'function') saveState();
    clearDpProcurementForm();
    renderDpProcurementModule();
    updateDpF1SendStatus();
    if (typeof updateSystemAlerts === 'function') updateSystemAlerts();
    showToast(`${rec.refNo} deleted.`);
}

function renderDpProcurementModule() {
    ensureDpProcurements();
    const summary = getDpProcurementSummary();
    const setStat = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = String(value);
    };
    setStat('dpProcStatOpen', summary.open);
    setStat('dpProcStatWithDp', summary.withDp);
    setStat('dpProcStatItdir', summary.itdirEval);
    setStat('dpProcStatAudit', summary.aiad);
    setStat('dpProcStatPo', summary.po);
    setStat('dpProcStatPaid', summary.paid);

    const tbody = document.getElementById('dpProcTableBody');
    if (!tbody) return;

    const q = String(document.getElementById('dpProcTableSearch')?.value || '').trim().toLowerCase();
    let rows = ensureDpProcurements().slice();
    if (q) {
        rows = rows.filter((r) => {
            const blob = [
                r.refNo, r.itemSummary, r.status, r.estimatedCost, r.glDisplay, r.glValue,
                r.suppliersIdentified, r.awardedSupplier, r.dueDiligenceCert, r.auditRef,
                r.poNumber, r.dafAuthRef, r.deliveryNoteRef, r.requisitionRef
            ].join(' ').toLowerCase();
            return blob.includes(q);
        });
    }

    if (!rows.length) {
        tbody.innerHTML = `<tr><td colspan="8" class="dp-proc-empty-row">No cycle records yet. Complete IT Dir F1 and send to DP, or capture earlier stages here.</td></tr>`;
        return;
    }

    tbody.innerHTML = rows.map((r) => {
        const status = normalizeDpProcStatus(r.status);
        const meta = getDpProcStatusMeta(status);
        const budget = (r.budgetProvisioned || 'yes') === 'no' ? 'Manual/DAF path' : 'Budgeted';
        return `
            <tr data-dp-id="${dpProcEscape(r.id)}">
                <td><strong>${dpProcEscape(r.refNo)}</strong></td>
                <td>${dpProcEscape(r.sentDate || (r.sentAt || '').slice(0, 10))}</td>
                <td>${dpProcEscape(r.itemSummary)}</td>
                <td>${dpProcEscape(r.estimatedCost)}</td>
                <td>${dpProcEscape(r.glDisplay || r.glValue || '—')}</td>
                <td>${dpProcEscape(budget)}</td>
                <td><span class="dp-proc-status-pill dp-proc-status-${dpProcEscape(status)}">${dpProcEscape(meta.short)}</span></td>
                <td class="dp-proc-actions-cell">
                    <button type="button" class="btn btn-secondary btn-sm" data-dp-action="edit">Update</button>
                    <button type="button" class="btn btn-danger btn-sm" data-dp-action="delete">Delete</button>
                </td>
            </tr>
        `;
    }).join('');
}

function initDpProcurementModule() {
    const sendBtn = document.getElementById('btnSendDpF1ToDp');
    if (sendBtn && sendBtn.dataset.bound !== '1') {
        sendBtn.dataset.bound = '1';
        sendBtn.addEventListener('click', (e) => {
            e.preventDefault();
            sendDpF1ToDirectorateOfProcurement();
        });
    }

    const saveBtn = document.getElementById('dpProcSaveBtn');
    if (saveBtn && saveBtn.dataset.bound !== '1') {
        saveBtn.dataset.bound = '1';
        saveBtn.addEventListener('click', (e) => {
            e.preventDefault();
            saveDpProcurementFromForm();
        });
    }

    const advanceBtn = document.getElementById('dpProcAdvanceBtn');
    if (advanceBtn && advanceBtn.dataset.bound !== '1') {
        advanceBtn.dataset.bound = '1';
        advanceBtn.addEventListener('click', (e) => {
            e.preventDefault();
            advanceDpProcurementStage();
        });
    }

    const clearBtn = document.getElementById('dpProcClearBtn');
    if (clearBtn && clearBtn.dataset.bound !== '1') {
        clearBtn.dataset.bound = '1';
        clearBtn.addEventListener('click', (e) => {
            e.preventDefault();
            clearDpProcurementForm();
        });
    }

    const stockBtn = document.getElementById('dpProcPostStockBtn');
    if (stockBtn && stockBtn.dataset.bound !== '1') {
        stockBtn.dataset.bound = '1';
        stockBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const id = document.getElementById('dpProcEditId')?.value;
            if (!id) {
                showToast('Select a procurement cycle record first.', 'error');
                return;
            }
            const rec = ensureDpProcurements().find((r) => r.id === id);
            if (!rec) return;
            if (typeof postProcurementDeliveryToStock === 'function') {
                postProcurementDeliveryToStock(rec);
                editDpProcurement(id);
            }
        });
    }

    const wrcBtn = document.getElementById('dpProcWorkshopCertBtn');
    if (wrcBtn && wrcBtn.dataset.bound !== '1') {
        wrcBtn.dataset.bound = '1';
        wrcBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const id = document.getElementById('dpProcEditId')?.value;
            if (!id) {
                showToast('Select a procurement cycle record first.', 'error');
                return;
            }
            if (typeof createWrcFromDpProcurement === 'function') {
                createWrcFromDpProcurement(id);
            }
        });
    }

    const search = document.getElementById('dpProcTableSearch');
    if (search && search.dataset.bound !== '1') {
        search.dataset.bound = '1';
        search.addEventListener('input', () => renderDpProcurementModule());
    }

    const statusSel = document.getElementById('dpProcStatus');
    if (statusSel && statusSel.dataset.bound !== '1') {
        statusSel.dataset.bound = '1';
        statusSel.addEventListener('change', () => renderDpProcCycleStrip(statusSel.value));
    }

    const tbody = document.getElementById('dpProcTableBody');
    if (tbody && tbody.dataset.bound !== '1') {
        tbody.dataset.bound = '1';
        tbody.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-dp-action]');
            if (!btn) return;
            const tr = btn.closest('tr[data-dp-id]');
            const id = tr?.getAttribute('data-dp-id');
            if (!id) return;
            const action = btn.getAttribute('data-dp-action');
            if (action === 'edit') editDpProcurement(id);
            if (action === 'delete') deleteDpProcurement(id);
        });
    }

    fillDpProcurementStatusOptions('f1_with_dp');
    renderDpProcCycleStrip(null);
    updateDpF1SendStatus();
}
