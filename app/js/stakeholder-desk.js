/* stakeholder-desk.js — DP / GS / DAF / AIAD / supplier windows on the shared ICT cycle */

const STK_DESK_DEFS = {
    dp: {
        title: 'DP Window — Directorate Procurement',
        blurb: 'Call for quotations, adjudicate, pick the winning vendor, raise the P/O, and invite the supplier. Upload RFQ packs and the issued P/O.',
        actor: 'dp',
        queueHint: 'Full DP in-tray: F1 lodged with DP through supply, AIAD return, and P/O issue.'
    },
    gs: {
        title: 'GS Branch Window — Colonel SD',
        blurb: 'Endorse DP F1s from IT Dir. Upload the signed endorsement. You do not see supplier quotes or DAF payment screens.',
        actor: 'gs',
        queueHint: 'All procurement cases from spec/F1 raise through GS endorsement and beyond — action required flagged first.'
    },
    daf: {
        title: 'DAF Window — MANAC / payment / creditors',
        blurb: 'Endorse DP F1s for funds (MANAC), record supplier payment after inspection, manage the Creditors register, and apply DAF paid-list imports.',
        actor: 'daf',
        queueHint: 'Procurement awaiting MANAC or pay · open creditor balances · payment proof import.'
    },
    aiad: {
        title: 'Due Diligence Window — AIAD',
        blurb: 'Evaluate endorsed F1 + IT Dir spec + supplier quotation. Issue the Price Due Diligence certificate and upload the signed form.',
        actor: 'aiad',
        queueHint: 'All AIAD due-diligence cases — from spec return through certificate issue.'
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

function stkStageOrders() {
    const orders = [];
    if (typeof DP_PROC_STAGE_ORDER_BUDGETED !== 'undefined') orders.push(DP_PROC_STAGE_ORDER_BUDGETED);
    if (typeof DP_PROC_STAGE_ORDER_MANUAL !== 'undefined') orders.push(DP_PROC_STAGE_ORDER_MANUAL);
    return orders.filter((order) => order.length);
}

function stkStatusesAtOrAfter(anchor) {
    const norm = typeof normalizeDpProcStatus === 'function' ? normalizeDpProcStatus(anchor) : anchor;
    const out = new Set([norm]);
    stkStageOrders().forEach((order) => {
        const idx = order.indexOf(norm);
        if (idx >= 0) order.slice(idx).forEach((s) => out.add(s));
    });
    return out;
}

function stkStatusesForGroup(group) {
    if (typeof DP_PROC_STATUSES === 'undefined') return new Set();
    return new Set(DP_PROC_STATUSES.filter((s) => s.group === group).map((s) => s.value));
}

function stkDeskStakeholderTouch(rec, desk) {
    const slot = rec.stakeholder?.[desk];
    if (!slot) return false;
    if (desk === 'dp') {
        return !!(slot.invited || slot.notes || (Array.isArray(slot.files) && slot.files.length));
    }
    if (desk === 'gs') return !!(slot.endorsedAt || slot.notes || (Array.isArray(slot.files) && slot.files.length));
    if (desk === 'daf') {
        return !!(slot.endorsedAt || slot.paidAt || slot.paymentRef || slot.notes || (Array.isArray(slot.files) && slot.files.length));
    }
    if (desk === 'aiad') {
        return !!(slot.certNo || slot.certifiedAt || slot.notes || (Array.isArray(slot.files) && slot.files.length));
    }
    return !!(slot.notes || (Array.isArray(slot.files) && slot.files.length));
}

function stkDeskNeedsAction(desk, rec) {
    const st = typeof normalizeDpProcStatus === 'function' ? normalizeDpProcStatus(rec.status) : rec.status;
    const stake = rec.stakeholder || {};
    if (desk === 'gs') {
        return st === 'awaiting_gs' && !stake.gs?.endorsedAt;
    }
    if (desk === 'daf') {
        if (st === 'awaiting_manac' && !stake.daf?.endorsedAt) return true;
        if (st === 'po_manual_pending_daf') return true;
        if ((st === 'delivery_verified' || st === 'supply_delivery') && !rec.paymentRef && !stake.daf?.paidAt) return true;
        return false;
    }
    if (desk === 'dp') {
        if (['f1_with_dp', 'spec_returned_dp', 'quotes_itdir_eval'].includes(st)) return true;
        if (st === 'aiad_certificate' && !rec.poNumber) return true;
        return false;
    }
    if (desk === 'aiad') {
        return st === 'aiad_due_diligence' && !stake.aiad?.certNo && !rec.dueDiligenceCert;
    }
    return false;
}

function stkQueueForDesk(desk, rec) {
    const st = typeof normalizeDpProcStatus === 'function' ? normalizeDpProcStatus(rec.status) : rec.status;
    if (st === 'cancelled') return false;
    const touch = stkDeskStakeholderTouch(rec, desk);

    if (desk === 'gs') {
        return stkStatusesAtOrAfter('awaiting_gs').has(st)
            || st === 'spec_raise_f1'
            || touch;
    }
    if (desk === 'daf') {
        return stkStatusesAtOrAfter('awaiting_manac').has(st)
            || stkStatusesForGroup('daf').has(st)
            || touch;
    }
    if (desk === 'dp') {
        return stkStatusesAtOrAfter('f1_with_dp').has(st)
            || stkStatusesForGroup('dp').has(st)
            || st === 'quotes_itdir_eval'
            || touch;
    }
    if (desk === 'aiad') {
        return stkStatusesAtOrAfter('aiad_due_diligence').has(st)
            || st === 'spec_returned_dp'
            || stkStatusesForGroup('aiad').has(st)
            || !!rec.dueDiligenceCert
            || touch;
    }
    if (desk === 'supplier') {
        return stkCaseVisibleToSupplier(rec, stkSupplierKey());
    }
    return true;
}

function stkSortDeskCases(desk, cases) {
    return cases.slice().sort((a, b) => {
        const aAct = stkDeskNeedsAction(desk, a) ? 0 : 1;
        const bAct = stkDeskNeedsAction(desk, b) ? 0 : 1;
        if (aAct !== bAct) return aAct - bAct;
        const aSt = typeof normalizeDpProcStatus === 'function' ? normalizeDpProcStatus(a.status) : a.status;
        const bSt = typeof normalizeDpProcStatus === 'function' ? normalizeDpProcStatus(b.status) : b.status;
        const aMeta = typeof getDpProcStatusMeta === 'function' ? getDpProcStatusMeta(aSt) : { step: 99 };
        const bMeta = typeof getDpProcStatusMeta === 'function' ? getDpProcStatusMeta(bSt) : { step: 99 };
        if ((aMeta.step || 99) !== (bMeta.step || 99)) return (aMeta.step || 99) - (bMeta.step || 99);
        return String(a.refNo || a.poNumber || '').localeCompare(String(b.refNo || b.poNumber || ''));
    });
}

function stkCasesForDesk(desk) {
    const list = typeof ensureDpProcurements === 'function' ? ensureDpProcurements() : [];
    const q = stkNorm(document.getElementById('stkDeskSearch')?.value);
    const filtered = list.filter((rec) => {
        if (!stkQueueForDesk(desk, rec)) return false;
        if (!q) return true;
        const hay = `${rec.refNo} ${rec.poNumber} ${rec.itemSummary} ${rec.awardedSupplier} ${rec.requisitionRef}`.toLowerCase();
        return hay.includes(q);
    });
    return stkSortDeskCases(desk, filtered);
}

function renderStakeholderDeskSummary(desk, cases) {
    const host = document.getElementById('stkDeskSummary');
    if (!host) return;
    const action = cases.filter((rec) => stkDeskNeedsAction(desk, rec)).length;
    const open = cases.filter((rec) => {
        const st = typeof normalizeDpProcStatus === 'function' ? normalizeDpProcStatus(rec.status) : rec.status;
        return st !== 'payment_complete';
    }).length;
    const done = cases.length - open;
    host.innerHTML = `
        <div class="stk-desk-summary" aria-label="Portal in-tray summary">
            <div class="stk-desk-stat is-action${action ? ' has-count' : ''}">
                <span class="stk-desk-stat-value">${action}</span>
                <span class="stk-desk-stat-label">Action required</span>
            </div>
            <div class="stk-desk-stat is-all">
                <span class="stk-desk-stat-value">${cases.length}</span>
                <span class="stk-desk-stat-label">All issues</span>
            </div>
            <div class="stk-desk-stat is-pipeline${open ? ' has-count' : ''}">
                <span class="stk-desk-stat-value">${open}</span>
                <span class="stk-desk-stat-label">In pipeline</span>
            </div>
            <div class="stk-desk-stat is-done${done ? ' has-count' : ''}">
                <span class="stk-desk-stat-value">${done}</span>
                <span class="stk-desk-stat-label">Completed</span>
            </div>
        </div>`;
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
    renderStakeholderDeskSummary(desk, cases);
    if (!cases.length) {
        host.innerHTML = '<p class="muted">No cases in this window yet.</p>';
        return;
    }
    const selected = host.getAttribute('data-stk-selected') || '';
    host.innerHTML = cases.map((rec) => {
        const st = typeof getDpProcStatusLabel === 'function' ? getDpProcStatusLabel(rec.status) : rec.status;
        const needs = stkDeskNeedsAction(desk, rec);
        return `<button type="button" class="stk-case-btn${rec.id === selected ? ' is-active' : ''}${needs ? ' is-action' : ''}" data-stk-open="${stkEscape(rec.id)}">
            <strong>${stkEscape(rec.refNo || rec.poNumber || 'Case')}${needs ? ' · Action' : ''}</strong>
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

function stkDafActiveTab() {
    return window._stkDafTab || 'procurement';
}

function stkSetDafTab(tab) {
    window._stkDafTab = tab === 'creditors' ? 'creditors' : 'procurement';
    const tabs = document.getElementById('stkDafTabs');
    const proc = document.getElementById('stkDafProcPanel');
    const cred = document.getElementById('stkDafCreditorsPanel');
    if (!tabs || !proc || !cred) return;
    tabs.querySelectorAll('[data-stk-daf-tab]').forEach((btn) => {
        const active = btn.getAttribute('data-stk-daf-tab') === window._stkDafTab;
        btn.classList.toggle('is-active', active);
        btn.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    const isCred = window._stkDafTab === 'creditors';
    proc.hidden = isCred;
    cred.hidden = !isCred;
    if (isCred) renderStkDafCreditorsPanel();
    else renderStakeholderDeskList();
}

function stkSyncDafChrome() {
    const desk = getStakeholderDeskKey();
    const isDaf = desk === 'daf';
    const tabs = document.getElementById('stkDafTabs');
    if (tabs) tabs.hidden = !isDaf;
    if (!isDaf) {
        const proc = document.getElementById('stkDafProcPanel');
        const cred = document.getElementById('stkDafCreditorsPanel');
        if (proc) proc.hidden = false;
        if (cred) cred.hidden = true;
        return;
    }
    stkSetDafTab(stkDafActiveTab());
}

function renderStkDafCreditorsPanel() {
    if (getStakeholderDeskKey() !== 'daf') return;
    if (typeof ensureSupplierDebts === 'function') ensureSupplierDebts();

    const summary = typeof renderSupplierDebtSummaryStrip === 'function'
        ? renderSupplierDebtSummaryStrip({
            open: 'stkDafStatOpen',
            usd: 'stkDafStatUsd',
            old: 'stkDafStatOld',
            chased: 'stkDafStatChased',
            suppliers: 'stkDafStatSuppliers'
        })
        : null;

    const badge = document.getElementById('stkDafCreditorsBadge');
    if (badge) {
        if (summary?.openCount) {
            badge.hidden = false;
            badge.textContent = String(summary.openCount);
        } else {
            badge.hidden = true;
            badge.textContent = '';
        }
    }

    if (typeof renderSdIntelligencePanel === 'function') renderSdIntelligencePanel('stkDafIntelligencePanel');

    const body = document.getElementById('stkDafCreditorsTableBody');
    if (body && typeof sdBuildChasePriorityList === 'function') {
        const rows = sdBuildChasePriorityList(12);
        if (!rows.length) {
            body.innerHTML = '<tr><td colspan="5" class="req-empty-row">No open creditor cases.</td></tr>';
        } else {
            body.innerHTML = rows.map(({ rec, age, usd }) => `<tr>
                <td>${stkEscape(rec.supplier || rec.caseNo)}</td>
                <td>USD ${stkEscape(typeof sdFmtUsd === 'function' ? sdFmtUsd(usd) : usd)}</td>
                <td>${stkEscape(typeof sdAgeLabel === 'function' ? sdAgeLabel(age) : `${age}d`)}</td>
                <td>${stkEscape(typeof sdStatusLabel === 'function' ? sdStatusLabel(rec.status) : rec.status)}</td>
                <td><button type="button" class="btn btn-ghost btn-sm" data-stk-daf-creditor="${stkEscape(rec.id)}">Open</button></td>
            </tr>`).join('');
            body.querySelectorAll('[data-stk-daf-creditor]').forEach((btn) => {
                btn.addEventListener('click', () => {
                    if (typeof navigateToModule === 'function') {
                        navigateToModule('supplier-debts', { sdId: btn.getAttribute('data-stk-daf-creditor') });
                    }
                });
            });
        }
    }

    const payHost = document.getElementById('stkDafPayQueue');
    if (payHost) {
        const payCases = (typeof ensureDpProcurements === 'function' ? ensureDpProcurements() : [])
            .filter((rec) => stkQueueForDesk('daf', rec))
            .slice(0, 8);
        if (!payCases.length) {
            payHost.innerHTML = '<p class="muted">No procurement cases currently awaiting DAF action.</p>';
        } else {
            payHost.innerHTML = payCases.map((rec) => {
                const st = typeof getDpProcStatusLabel === 'function' ? getDpProcStatusLabel(rec.status) : rec.status;
                return `<button type="button" class="stk-daf-pay-item" data-stk-daf-pay-id="${stkEscape(rec.id)}">
                    <strong>${stkEscape(rec.refNo || rec.poNumber || 'Case')}</strong>
                    <span>${stkEscape(rec.awardedSupplier || rec.itemSummary || '')}</span>
                    <em>${stkEscape(st)}${rec.paymentRef ? ` · paid ${stkEscape(rec.paymentRef)}` : ''}</em>
                </button>`;
            }).join('');
            payHost.querySelectorAll('[data-stk-daf-pay-id]').forEach((btn) => {
                btn.addEventListener('click', () => {
                    stkSetDafTab('procurement');
                    renderStakeholderDeskDetail(btn.getAttribute('data-stk-daf-pay-id'));
                    renderStakeholderDeskList();
                });
            });
        }
    }

    if (typeof initStkDafCreditorsDropZone === 'function') initStkDafCreditorsDropZone();
}

function initStkDafPortalExtras() {
    const root = document.getElementById('stakeholder-desk');
    if (!root || root.dataset.stkDafInit === '1') return;
    root.dataset.stkDafInit = '1';

    document.getElementById('stkDafTabs')?.addEventListener('click', (e) => {
        const tab = e.target.closest('[data-stk-daf-tab]');
        if (!tab) return;
        stkSetDafTab(tab.getAttribute('data-stk-daf-tab'));
    });
    document.getElementById('stkDafOpenCreditorsBtn')?.addEventListener('click', () => {
        if (typeof navigateToModule === 'function') navigateToModule('supplier-debts');
    });
    document.getElementById('stkDafOpenBidsBtn')?.addEventListener('click', () => {
        if (typeof navigateToModule === 'function') navigateToModule('financial-year-bids');
    });
    document.getElementById('stkDafOpenProcBtn')?.addEventListener('click', () => stkSetDafTab('procurement'));
    document.getElementById('stkDafLoadCreditorsBtn')?.addEventListener('click', () => {
        if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;
        if (typeof loadItDirCreditorsRegister !== 'function') return;
        const mode = document.getElementById('stkDafCreditorsLoadMode')?.value || 'merge';
        const result = loadItDirCreditorsRegister({ mode });
        const statusEl = document.getElementById('stkDafCreditorsImportStatus');
        if (statusEl && result) {
            statusEl.hidden = false;
            statusEl.textContent = `Built-in register: ${result.added} added · ${result.updated} updated · ${result.skipped} skipped.`;
        }
        if (typeof sdRefreshCreditorsViews === 'function') sdRefreshCreditorsViews();
        else renderStkDafCreditorsPanel();
        if (typeof showToast === 'function') showToast('Built-in Nov 2025 creditors register loaded.', 'success');
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
    stkSyncDafChrome();
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
    initStkDafPortalExtras();
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
window.renderStkDafCreditorsPanel = renderStkDafCreditorsPanel;
window.STK_DESK_DEFS = STK_DESK_DEFS;
