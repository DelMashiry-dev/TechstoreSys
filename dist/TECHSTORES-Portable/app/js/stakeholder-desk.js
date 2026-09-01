/* stakeholder-desk.js — DP / GS / DAF / AIAD / supplier windows on the shared ICT cycle */

const STK_DESK_DEFS = {
    dp: {
        title: 'DP Window — Directorate Procurement',
        blurb: 'Call for quotations, adjudicate, pick the winning vendor, raise the P/O, and invite the supplier. Upload RFQ packs and the issued P/O.',
        actor: 'dp',
        queueHint: 'Cases after GS + DAF endorsement, plus live awards.'
    },
    gs: {
        title: 'GS Branch Window — Colonel SD',
        blurb: 'Endorse DP F1s from IT Dir. Upload the signed endorsement. You do not see supplier quotes or DAF payment screens.',
        actor: 'gs',
        queueHint: 'F1s waiting for Colonel SD endorsement.'
    },
    daf: {
        title: 'DAF Window — MANAC / payment',
        blurb: 'Endorse the DP F1 for funds (MANAC). After IT Dir inspects delivery, record payment and upload the payment voucher.',
        actor: 'daf',
        queueHint: 'Awaiting MANAC endorsement, or goods received awaiting pay.'
    },
    aiad: {
        title: 'Due Diligence Window — AIAD',
        blurb: 'Evaluate endorsed F1 + IT Dir spec + supplier quotation. Issue the Price Due Diligence certificate and upload the signed form.',
        actor: 'aiad',
        queueHint: 'Cases sent for AIAD pre-audit.'
    },
    supplier: {
        title: 'Supplier Window',
        blurb: 'See RFQs and P/Os addressed to your company. Upload quotation + spec, delivery note, invoice, and banking details.',
        actor: 'supplier',
        queueHint: 'Only cases where you are invited or awarded.'
    }
};

const STK_FILE_MAX = 2 * 1024 * 1024;

function stkEscape(v) {
    return String(v ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function stkNorm(v) {
    return String(v || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function stkNowIso() {
    return new Date().toISOString();
}

function stkActorName() {
    return currentUser?.name || currentUser?.username || 'User';
}

function stkRoleDeskKey(role) {
    if (typeof stkRoleDeskFromRole === 'function') return stkRoleDeskFromRole(role);
    if (role === 'dir_dp') return 'dp';
    if (role === 'gs_sd') return 'gs';
    if (role === 'dir_daf') return 'daf';
    if (role === 'dir_aiad') return 'aiad';
    if (role === 'supplier') return 'supplier';
    return '';
}

function stkCanSwitchDesk() {
    if (typeof canSwitchPortalDesks === 'function') return canSwitchPortalDesks();
    const role = currentUser?.role || '';
    return role === 'admin' || role === 'store_officer' || role === 'rq' || role === 'techstores_officer';
}

function getStakeholderDeskKey() {
    const mine = stkRoleDeskKey(currentUser?.role);
    if (mine) return mine;
    const override = window._stkDeskOverride;
    if (override && (typeof canAccessPortalDesk !== 'function' || canAccessPortalDesk(override))) {
        return override;
    }
    if (stkCanSwitchDesk()) return override || 'dp';
    if (typeof canAccessPortalDesk === 'function') {
        return ['dp', 'gs', 'daf', 'aiad', 'supplier'].find((k) => canAccessPortalDesk(k)) || '';
    }
    return '';
}

function ensureCycleStakeholder(rec) {
    if (!rec.stakeholder || typeof rec.stakeholder !== 'object') rec.stakeholder = {};
    ['gs', 'daf', 'dp', 'aiad'].forEach((k) => {
        if (!rec.stakeholder[k] || typeof rec.stakeholder[k] !== 'object') {
            rec.stakeholder[k] = { notes: '', files: [] };
        }
        if (!Array.isArray(rec.stakeholder[k].files)) rec.stakeholder[k].files = [];
    });
    if (!rec.stakeholder.suppliers || typeof rec.stakeholder.suppliers !== 'object') {
        rec.stakeholder.suppliers = {};
    }
    return rec.stakeholder;
}

function stkSupplierKey() {
    return String(currentUser?.supplierKey || currentUser?.name || currentUser?.username || '').trim();
}

function stkSupplierBucket(rec, key) {
    const stake = ensureCycleStakeholder(rec);
    const id = stkNorm(key) || 'supplier';
    if (!stake.suppliers[id]) {
        stake.suppliers[id] = { name: key, notes: '', quoteRef: '', banking: '', files: [] };
    }
    if (!Array.isArray(stake.suppliers[id].files)) stake.suppliers[id].files = [];
    return stake.suppliers[id];
}

function stkCaseVisibleToSupplier(rec, key) {
    const k = stkNorm(key);
    if (!k) return false;
    const blob = [
        rec.awardedSupplier, rec.suppliersIdentified, rec.poNumber, rec.itemSummary,
        rec.stakeholder?.dp?.invited
    ].map((x) => stkNorm(x)).join(' | ');
    if (blob.includes(k) || k.includes('nixzimo') && blob.includes('nixzimo')) return true;
    if (k.includes('nixzimo') && /3478/.test(String(rec.poNumber || rec.refNo || ''))) return true;
    return Object.keys(rec.stakeholder?.suppliers || {}).some((id) => id.includes(k) || k.includes(id));
}

function stkQueueForDesk(desk, rec) {
    const st = typeof normalizeDpProcStatus === 'function' ? normalizeDpProcStatus(rec.status) : rec.status;
    if (desk === 'gs') {
        return ['requisition', 'spec_raise_f1', 'awaiting_gs'].includes(st) || !!rec.stakeholder?.gs?.endorsedAt;
    }
    if (desk === 'daf') {
        return ['awaiting_manac', 'po_manual_pending_daf', 'delivery_verified', 'supply_delivery'].includes(st)
            || !!rec.stakeholder?.daf?.endorsedAt;
    }
    if (desk === 'dp') {
        return st !== 'cancelled';
    }
    if (desk === 'aiad') {
        return ['aiad_due_diligence', 'aiad_certificate', 'spec_returned_dp'].includes(st)
            || !!rec.stakeholder?.aiad?.certNo
            || !!rec.dueDiligenceCert;
    }
    if (desk === 'supplier') {
        return stkCaseVisibleToSupplier(rec, stkSupplierKey());
    }
    return true;
}

function stkCasesForDesk(desk) {
    const list = typeof ensureDpProcurements === 'function' ? ensureDpProcurements() : [];
    const q = stkNorm(document.getElementById('stkDeskSearch')?.value);
    return list.filter((rec) => {
        if (!stkQueueForDesk(desk, rec)) return false;
        if (!q) return true;
        const hay = `${rec.refNo} ${rec.poNumber} ${rec.itemSummary} ${rec.awardedSupplier} ${rec.requisitionRef}`.toLowerCase();
        return hay.includes(q);
    });
}

function stkPublicCaseView(rec, desk) {
    const st = typeof getDpProcStatusLabel === 'function' ? getDpProcStatusLabel(rec.status) : rec.status;
    const lines = [
        `<p><strong>${stkEscape(rec.refNo || '')}</strong> · ${stkEscape(st)}</p>`,
        rec.requisitionRef ? `<p>PFMS / Req: <strong>${stkEscape(rec.requisitionRef)}</strong></p>` : '',
        `<p>${stkEscape(rec.itemSummary || '')}</p>`,
        rec.estimatedCost && desk !== 'supplier' ? `<p>Estimated: ${stkEscape(rec.estimatedCost)} · GL ${stkEscape(rec.glValue || '')}</p>` : '',
        rec.poNumber ? `<p>P/O: <strong>${stkEscape(rec.poNumber)}</strong></p>` : '',
        rec.awardedSupplier && desk !== 'supplier' ? `<p>Awarded: ${stkEscape(rec.awardedSupplier)}</p>` : ''
    ];
    if (desk === 'supplier') {
        lines.push(rec.poNumber
            ? `<p>P/O addressed to you (or your invitation). Collect / supply against this order.</p>`
            : `<p>RFQ — submit quotation and spec through this window.</p>`);
    }
    return lines.join('');
}

function stkFileListHtml(files) {
    const list = Array.isArray(files) ? files : [];
    if (!list.length) return '<p class="muted">No files uploaded yet.</p>';
    return `<ul class="stk-file-list">${list.map((f, i) => `
        <li>
            ${f.dataUrl ? `<a href="${stkEscape(f.dataUrl)}" download="${stkEscape(f.name)}">${stkEscape(f.name)}</a>` : stkEscape(f.name)}
            <span class="muted">${stkEscape(f.kind || '')} · ${Math.round((f.size || 0) / 1024)} KB</span>
            <button type="button" class="btn btn-ghost btn-sm" data-stk-del-file="${i}">Remove</button>
        </li>`).join('')}</ul>`;
}

function stkReadUpload(inputEl) {
    return new Promise((resolve, reject) => {
        const file = inputEl?.files?.[0];
        if (!file) {
            resolve(null);
            return;
        }
        if (file.size > STK_FILE_MAX) {
            reject(new Error(`File too large (max ${STK_FILE_MAX / 1024 / 1024} MB).`));
            return;
        }
        const reader = new FileReader();
        reader.onload = () => resolve({
            name: file.name,
            type: file.type || 'application/octet-stream',
            size: file.size,
            kind: '',
            at: stkNowIso(),
            by: stkActorName(),
            dataUrl: String(reader.result || '')
        });
        reader.onerror = () => reject(new Error('Could not read file.'));
        reader.readAsDataURL(file);
    });
}

function stkFormForDesk(desk, rec) {
    const stake = ensureCycleStakeholder(rec);
    if (desk === 'gs') {
        const g = stake.gs;
        return `
            <h4>GS endorsement</h4>
            <label class="form-label">Notes / minute</label>
            <textarea class="form-control" id="stkFieldNotes" rows="3">${stkEscape(g.notes || '')}</textarea>
            ${stkFileListHtml(g.files)}
            <label class="form-label">Upload signed endorsement</label>
            <input type="file" class="form-control" id="stkFieldFile" accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx">
            <div class="module-actions">
                <button type="button" class="btn btn-success" data-stk-act="gs-endorse">Endorse DP F1</button>
            </div>`;
    }
    if (desk === 'daf') {
        const d = stake.daf;
        return `
            <h4>MANAC endorsement / payment</h4>
            <label class="form-label">Endorsement notes</label>
            <textarea class="form-control" id="stkFieldNotes" rows="2">${stkEscape(d.notes || '')}</textarea>
            <label class="form-label">Payment ref (after inspection)</label>
            <input type="text" class="form-control" id="stkFieldPay" value="${stkEscape(rec.paymentRef || d.paymentRef || '')}" placeholder="PV / EFT ref">
            ${stkFileListHtml(d.files)}
            <label class="form-label">Upload endorsement or payment voucher</label>
            <input type="file" class="form-control" id="stkFieldFile" accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx">
            <div class="module-actions">
                <button type="button" class="btn btn-success" data-stk-act="daf-endorse">Endorse funds (MANAC)</button>
                <button type="button" class="btn btn-primary" data-stk-act="daf-pay">Record payment</button>
            </div>`;
    }
    if (desk === 'dp') {
        const d = stake.dp;
        return `
            <h4>DP Contracts / SO1</h4>
            <label class="form-label">Suppliers invited</label>
            <textarea class="form-control" id="stkFieldInvited" rows="2">${stkEscape(d.invited || rec.suppliersIdentified || '')}</textarea>
            <label class="form-label">Adjudication / SO1 notes</label>
            <textarea class="form-control" id="stkFieldNotes" rows="2">${stkEscape(d.notes || rec.itdirSpecEvalNotes || '')}</textarea>
            <label class="form-label">Winning vendor</label>
            <input type="text" class="form-control" id="stkFieldWinner" value="${stkEscape(rec.awardedSupplier || '')}">
            <label class="form-label">P/O number</label>
            <input type="text" class="form-control" id="stkFieldPo" value="${stkEscape(rec.poNumber || '')}" placeholder="DP ####/2026">
            ${stkFileListHtml(d.files)}
            <label class="form-label">Upload RFQ / P/O scan</label>
            <input type="file" class="form-control" id="stkFieldFile" accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx">
            <div class="module-actions">
                <button type="button" class="btn btn-secondary" data-stk-act="dp-quotes">Record call for quotes</button>
                <button type="button" class="btn btn-secondary" data-stk-act="dp-winner">Record winning vendor</button>
                <button type="button" class="btn btn-secondary" data-stk-act="dp-aiad">Send to AIAD</button>
                <button type="button" class="btn btn-success" data-stk-act="dp-po">Issue P/O</button>
            </div>`;
    }
    if (desk === 'aiad') {
        const a = stake.aiad;
        return `
            <h4>Price Due Diligence</h4>
            <label class="form-label">Certificate no. / comment</label>
            <input type="text" class="form-control" id="stkFieldCert" value="${stkEscape(a.certNo || rec.dueDiligenceCert || '')}" placeholder="Implied price within market range">
            <label class="form-label">Notes</label>
            <textarea class="form-control" id="stkFieldNotes" rows="2">${stkEscape(a.notes || '')}</textarea>
            ${stkFileListHtml(a.files)}
            <label class="form-label">Upload signed due diligence certificate</label>
            <input type="file" class="form-control" id="stkFieldFile" accept=".pdf,.png,.jpg,.jpeg,.webp">
            <div class="module-actions">
                <button type="button" class="btn btn-success" data-stk-act="aiad-cert">Issue certificate</button>
            </div>`;
    }
    const bucket = stkSupplierBucket(rec, stkSupplierKey());
    return `
            <h4>Your submission</h4>
            <label class="form-label">Quotation / invoice ref</label>
            <input type="text" class="form-control" id="stkFieldQuote" value="${stkEscape(bucket.quoteRef || rec.awardedQuotationRef || '')}">
            <label class="form-label">Banking details</label>
            <textarea class="form-control" id="stkFieldBank" rows="3" placeholder="Bank, account name, ZWG / USD numbers, branch">${stkEscape(bucket.banking || '')}</textarea>
            <label class="form-label">Notes</label>
            <textarea class="form-control" id="stkFieldNotes" rows="2">${stkEscape(bucket.notes || '')}</textarea>
            ${stkFileListHtml(bucket.files)}
            <label class="form-label">Upload quotation, spec, D-Note, invoice or banking letter</label>
            <input type="file" class="form-control" id="stkFieldFile" accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx">
            <div class="module-actions">
                <button type="button" class="btn btn-secondary" data-stk-act="sup-quote">Submit quotation / spec</button>
                <button type="button" class="btn btn-success" data-stk-act="sup-dnote">Submit delivery note</button>
                <button type="button" class="btn btn-primary" data-stk-act="sup-save">Save banking / files</button>
            </div>`;
}

function stkPushHistory(rec, status, note) {
    if (!Array.isArray(rec.history)) rec.history = [];
    rec.history.push({ at: stkNowIso(), status: status || rec.status, by: stkActorName(), note });
}

async function stkAttachFile(rec, slot) {
    const input = document.getElementById('stkFieldFile');
    try {
        const file = await stkReadUpload(input);
        if (!file) return;
        file.kind = 'attachment';
        if (!Array.isArray(slot.files)) slot.files = [];
        slot.files.push(file);
        if (input) input.value = '';
    } catch (err) {
        if (typeof showToast === 'function') showToast(err.message || 'Upload failed.', 'error');
    }
}

async function stkRunAction(desk, recId, act) {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;
    const rec = (typeof ensureDpProcurements === 'function' ? ensureDpProcurements() : [])
        .find((r) => r.id === recId);
    if (!rec) return;
    const stake = ensureCycleStakeholder(rec);
    const notes = document.getElementById('stkFieldNotes')?.value || '';
    const now = stkNowIso();

    if (desk === 'gs' && act === 'gs-endorse') {
        stake.gs.notes = notes;
        stake.gs.endorsedAt = now;
        stake.gs.endorsedBy = stkActorName();
        await stkAttachFile(rec, stake.gs);
        const st = typeof normalizeDpProcStatus === 'function' ? normalizeDpProcStatus(rec.status) : rec.status;
        if (['requisition', 'spec_raise_f1', 'awaiting_gs'].includes(st)) rec.status = 'awaiting_manac';
        stkPushHistory(rec, rec.status, 'GS Branch (Colonel SD) endorsed the DP F1.');
    }
    if (desk === 'daf' && act === 'daf-endorse') {
        stake.daf.notes = notes;
        stake.daf.endorsedAt = now;
        stake.daf.endorsedBy = stkActorName();
        await stkAttachFile(rec, stake.daf);
        const st = typeof normalizeDpProcStatus === 'function' ? normalizeDpProcStatus(rec.status) : rec.status;
        if (['awaiting_manac', 'awaiting_gs', 'spec_raise_f1', 'pfms_numbered'].includes(st)) rec.status = 'f1_with_dp';
        stkPushHistory(rec, rec.status, 'MANAC (DAF) endorsed funds / vote.');
    }
    if (desk === 'daf' && act === 'daf-pay') {
        rec.paymentRef = document.getElementById('stkFieldPay')?.value.trim() || rec.paymentRef;
        stake.daf.paymentRef = rec.paymentRef;
        stake.daf.paidAt = now;
        await stkAttachFile(rec, stake.daf);
        rec.status = 'payment_complete';
        stkPushHistory(rec, rec.status, `DAF recorded payment ${rec.paymentRef || ''}.`.trim());
    }
    if (desk === 'dp') {
        stake.dp.invited = document.getElementById('stkFieldInvited')?.value || '';
        stake.dp.notes = notes;
        rec.suppliersIdentified = stake.dp.invited;
        rec.itdirSpecEvalNotes = notes;
        rec.awardedSupplier = document.getElementById('stkFieldWinner')?.value.trim() || rec.awardedSupplier;
        rec.poNumber = document.getElementById('stkFieldPo')?.value.trim() || rec.poNumber;
        await stkAttachFile(rec, stake.dp);
        if (act === 'dp-quotes') {
            rec.status = 'f1_with_dp';
            stkPushHistory(rec, rec.status, 'DP called for quotations.');
        }
        if (act === 'dp-winner') {
            rec.status = 'spec_returned_dp';
            stkPushHistory(rec, rec.status, `DP SO1 winning vendor: ${rec.awardedSupplier || '—'}.`);
        }
        if (act === 'dp-aiad') {
            rec.status = 'aiad_due_diligence';
            stkPushHistory(rec, rec.status, 'DP sent F1 + spec + quote to AIAD for due diligence.');
        }
        if (act === 'dp-po') {
            rec.status = 'po_electronic';
            stkPushHistory(rec, rec.status, `DP issued P/O ${rec.poNumber || ''}.`.trim());
        }
    }
    if (desk === 'aiad' && act === 'aiad-cert') {
        stake.aiad.notes = notes;
        stake.aiad.certNo = document.getElementById('stkFieldCert')?.value.trim() || '';
        stake.aiad.certifiedAt = now;
        stake.aiad.certifiedBy = stkActorName();
        rec.dueDiligenceCert = stake.aiad.certNo;
        rec.auditRef = rec.auditRef || `AIAD ${now.slice(0, 10)}`;
        await stkAttachFile(rec, stake.aiad);
        rec.status = 'aiad_certificate';
        stkPushHistory(rec, rec.status, 'AIAD issued Price Due Diligence certificate.');
    }
    if (desk === 'supplier') {
        const bucket = stkSupplierBucket(rec, stkSupplierKey());
        bucket.notes = notes;
        bucket.quoteRef = document.getElementById('stkFieldQuote')?.value.trim() || bucket.quoteRef;
        bucket.banking = document.getElementById('stkFieldBank')?.value || bucket.banking;
        bucket.name = stkSupplierKey();
        await stkAttachFile(rec, bucket);
            if (act === 'sup-quote') {
            rec.quotationsNotes = [rec.quotationsNotes, `${stkSupplierKey()} quote ${bucket.quoteRef}`].filter(Boolean).join(' · ');
            const st = typeof normalizeDpProcStatus === 'function' ? normalizeDpProcStatus(rec.status) : rec.status;
            if (st === 'f1_with_dp') rec.status = 'quotes_itdir_eval';
            stkPushHistory(rec, rec.status, `${stkSupplierKey()} submitted quotation / spec.`);
        }
        if (act === 'sup-dnote') {
            rec.deliveryNoteRef = rec.deliveryNoteRef || `${stkSupplierKey()} D-Note`;
            rec.status = 'supply_delivery';
            stkPushHistory(rec, rec.status, `${stkSupplierKey()} submitted delivery note.`);
        }
        if (act === 'sup-save') {
            stkPushHistory(rec, rec.status, `${stkSupplierKey()} updated banking / attachments.`);
        }
    }

    rec.updatedAt = now;
    rec.pipelineNotes = rec.pipelineNotes || '';
    if (typeof saveState === 'function') saveState();
    if (typeof showToast === 'function') showToast('Saved to the shared procurement cycle.');
    renderStakeholderDeskDetail(rec.id);
    renderStakeholderDeskList();
}

function renderStakeholderDeskList() {
    const host = document.getElementById('stkDeskList');
    if (!host) return;
    const desk = getStakeholderDeskKey();
    const cases = stkCasesForDesk(desk);
    if (!cases.length) {
        host.innerHTML = '<p class="muted">No cases in this window yet.</p>';
        return;
    }
    const selected = host.getAttribute('data-stk-selected') || '';
    host.innerHTML = cases.map((rec) => {
        const st = typeof getDpProcStatusLabel === 'function' ? getDpProcStatusLabel(rec.status) : rec.status;
        return `<button type="button" class="stk-case-btn${rec.id === selected ? ' is-active' : ''}" data-stk-open="${stkEscape(rec.id)}">
            <strong>${stkEscape(rec.refNo || rec.poNumber || 'Case')}</strong>
            <span>${stkEscape(rec.itemSummary || '')}</span>
            <em>${stkEscape(st)}</em>
        </button>`;
    }).join('');
}

function renderStakeholderDeskDetail(id) {
    const host = document.getElementById('stkDeskDetail');
    const list = document.getElementById('stkDeskList');
    if (!host) return;
    const desk = getStakeholderDeskKey();
    const rec = (typeof ensureDpProcurements === 'function' ? ensureDpProcurements() : [])
        .find((r) => r.id === id);
    if (list) list.setAttribute('data-stk-selected', id || '');
    if (!rec) {
        host.innerHTML = '<p class="muted">Select a procurement case.</p>';
        return;
    }
    ensureCycleStakeholder(rec);
    host.innerHTML = `
        <div class="stk-case-head">${stkPublicCaseView(rec, desk)}</div>
        ${stkFormForDesk(desk, rec)}`;
    host.querySelectorAll('[data-stk-act]').forEach((btn) => {
        btn.addEventListener('click', () => stkRunAction(desk, rec.id, btn.getAttribute('data-stk-act')));
    });
    host.querySelectorAll('[data-stk-del-file]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const idx = Number(btn.getAttribute('data-stk-del-file'));
            const slot = desk === 'supplier'
                ? stkSupplierBucket(rec, stkSupplierKey())
                : rec.stakeholder[desk];
            if (slot?.files) slot.files.splice(idx, 1);
            if (typeof saveState === 'function') saveState();
            renderStakeholderDeskDetail(rec.id);
        });
    });
}

function renderStakeholderDeskChrome() {
    const desk = getStakeholderDeskKey();
    const def = STK_DESK_DEFS[desk];
    const title = document.getElementById('stkDeskTitle');
    const intro = document.getElementById('stkDeskIntro');
    if (title) title.textContent = def?.title || 'Portals';
    if (intro) intro.textContent = def ? `${def.blurb} ${def.queueHint}` : '';

    const sw = document.getElementById('stkDeskSwitch');
    if (sw) {
        sw.hidden = true;
        sw.innerHTML = '';
    }
}

function renderStakeholderDesk() {
    const root = document.getElementById('stakeholder-desk');
    if (!root) return;
    if (!getStakeholderDeskKey()) {
        const intro = document.getElementById('stkDeskIntro');
        if (intro) intro.textContent = 'This login does not have a portal.';
        return;
    }
    renderStakeholderDeskChrome();
    renderStakeholderDeskList();
}

function initStakeholderDeskModule() {
    const root = document.getElementById('stakeholder-desk');
    if (!root || root.dataset.stkInit === '1') return;
    root.dataset.stkInit = '1';
    document.getElementById('stkDeskSearch')?.addEventListener('input', () => renderStakeholderDeskList());
    document.getElementById('stkDeskList')?.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-stk-open]');
        if (!btn) return;
        renderStakeholderDeskDetail(btn.getAttribute('data-stk-open'));
        renderStakeholderDeskList();
    });
    renderStakeholderDesk();
}

window.getStakeholderDeskKey = getStakeholderDeskKey;
window.initStakeholderDeskModule = initStakeholderDeskModule;
window.renderStakeholderDesk = renderStakeholderDesk;
window.renderStakeholderDeskChrome = renderStakeholderDeskChrome;
window.STK_DESK_DEFS = STK_DESK_DEFS;
