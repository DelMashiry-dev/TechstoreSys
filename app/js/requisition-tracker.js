/* requisition-tracker.js — Dashboard paperwork location tracker */

const REQ_TRACK_STAGES = [
    { id: 'gs_origin', label: 'FROM GS BRANCH', short: 'FROM GS' },
    { id: 'itdir', label: 'AT IT DIR', short: 'IT DIR' },
    { id: 'col_sd', label: 'WITH COL SD (GS BRANCH)', short: 'COL SD' },
    { id: 'daf_manac', label: 'AT DAF (MANAC)', short: 'MANAC' },
    { id: 'dp', label: 'AT DP', short: 'DP' },
    { id: 'due', label: 'AT DUE DILIGENCE', short: 'DUE' },
    { id: 'supplier', label: 'SUPPLIER', short: 'SUPPLIER' },
    { id: 'daf_pay', label: 'DAF', short: 'DAF' },
    { id: 'funding', label: 'AWAITING FUNDING', short: 'FUNDING' }
];

const REQ_TRACK_STAGE_INDEX = Object.fromEntries(REQ_TRACK_STAGES.map((s, i) => [s.id, i]));

const DP_STATUS_TRACK_STAGE = {
    requisition: 'itdir',
    spec_raise_f1: 'itdir',
    quotes_itdir_eval: 'itdir',
    pfms_numbered: 'itdir',
    awaiting_gs: 'col_sd',
    awaiting_manac: 'daf_manac',
    f1_with_dp: 'dp',
    spec_returned_dp: 'dp',
    aiad_due_diligence: 'due',
    aiad_certificate: 'dp',
    po_electronic: 'supplier',
    po_manual_pending_daf: 'funding',
    po_manual_authorised: 'supplier',
    supply_delivery: 'supplier',
    delivery_verified: 'daf_pay',
    payment_complete: null,
    cancelled: null
};

function reqTrackEscape(v) {
    return String(v ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function reqTrackGlLabel(req, dp) {
    if (dp?.glDisplay) return String(dp.glDisplay);
    if (!req) return '';
    const code = typeof resolveGlForRequisition === 'function' ? resolveGlForRequisition(req) : '';
    if (!code) return '';
    const meta = typeof GL_ACCOUNTS !== 'undefined' ? GL_ACCOUNTS[code] : null;
    const name = meta?.name || 'GL vote';
    return `${code} — ${name}`;
}

function reqTrackStageIndex(stageId) {
    const idx = REQ_TRACK_STAGE_INDEX[stageId];
    return typeof idx === 'number' ? idx : 0;
}

function findDpProcForRequisition(req) {
    if (!req) return null;
    const list = typeof ensureDpProcurements === 'function' ? ensureDpProcurements() : [];
    const reqNo = String(req.reqNo || '').trim().toUpperCase();
    const reqId = String(req.id || '').trim();
    return list.find((rec) => {
        if (rec.id === req.dpProcId || rec.linkedReqId === reqId) return true;
        const ref = String(rec.requisitionRef || '').trim().toUpperCase();
        if (reqNo && ref && (ref === reqNo || ref.includes(reqNo))) return true;
        return false;
    }) || null;
}

function resolveDpProcTrackStage(rec) {
    if (!rec) return null;
    const st = typeof normalizeDpProcStatus === 'function'
        ? normalizeDpProcStatus(rec.status)
        : rec.status;
    if (st === 'payment_complete' || st === 'cancelled') return null;
    if (rec.budgetProvisioned === 'no' && ['requisition', 'spec_raise_f1', 'awaiting_gs', 'awaiting_manac'].includes(st)) {
        return 'funding';
    }
    return DP_STATUS_TRACK_STAGE[st] || 'itdir';
}

function resolveRequisitionTrackStage(req) {
    if (!req) return null;
    const openSet = typeof REQ_OPEN_STATUSES !== 'undefined'
        ? REQ_OPEN_STATUSES
        : new Set(['received', 'in_progress', 'part_issued']);
    if (!openSet.has(req.status)) return null;
    if (req.trackStageHint && REQ_TRACK_STAGE_INDEX[req.trackStageHint] != null) {
        return req.trackStageHint;
    }
    const linked = findDpProcForRequisition(req);
    if (linked) return resolveDpProcTrackStage(linked);
    if (req.fulfillmentPath === 'manual_daf' || req.fulfillmentPath === 'await_replenishment') {
        return 'funding';
    }
    return 'itdir';
}

function buildRequisitionTrackItems() {
    const items = [];
    const seenDp = new Set();

    const openSet = typeof REQ_OPEN_STATUSES !== 'undefined'
        ? REQ_OPEN_STATUSES
        : new Set(['received', 'in_progress', 'part_issued']);
    const reqs = typeof ensureRequisitions === 'function' ? ensureRequisitions() : [];
    reqs.forEach((req) => {
        if (!openSet.has(req.status)) return;
        const stage = resolveRequisitionTrackStage(req);
        if (!stage) return;
        const linked = findDpProcForRequisition(req);
        if (linked) seenDp.add(linked.id);
        const age = typeof getRequisitionAgeDays === 'function' ? getRequisitionAgeDays(req) : 0;
        items.push({
            id: `req-${req.id}`,
            kind: 'requisition',
            ref: req.reqNo || 'REQ',
            title: req.unit || 'Unit / Formation',
            detail: req.itemDescription || req.subject || 'Requisition',
            glLabel: reqTrackGlLabel(req, linked),
            stage,
            age,
            urgent: req.priority === 'urgent',
            target: 'unit-requisitions',
            navId: req.id,
            dpId: linked?.id || '',
            req,
            dp: linked || null
        });
    });

    const dps = typeof ensureDpProcurements === 'function' ? ensureDpProcurements() : [];
    dps.forEach((rec) => {
        if (seenDp.has(rec.id)) return;
        const stage = resolveDpProcTrackStage(rec);
        if (!stage) return;
        items.push({
            id: `dp-${rec.id}`,
            kind: 'procurement',
            ref: rec.refNo || rec.poNumber || 'DP F1',
            title: rec.awardedSupplier || rec.delivery || 'Procurement case',
            detail: rec.itemSummary || 'ICT procurement cycle',
            glLabel: reqTrackGlLabel(null, rec),
            stage,
            age: 0,
            urgent: stage === 'col_sd' || stage === 'due' || stage === 'funding',
            target: 'dp-procurement',
            navId: rec.id,
            dpId: rec.id,
            req: null,
            dp: rec
        });
    });

    return items.sort((a, b) => {
        const ai = reqTrackStageIndex(a.stage);
        const bi = reqTrackStageIndex(b.stage);
        if (a.urgent !== b.urgent) return a.urgent ? -1 : 1;
        if (ai !== bi) return ai - bi;
        return (b.age || 0) - (a.age || 0) || String(a.ref).localeCompare(String(b.ref));
    });
}

function reqTrackStageCounts(items) {
    const counts = Object.fromEntries(REQ_TRACK_STAGES.map((s) => [s.id, 0]));
    items.forEach((item) => {
        if (counts[item.stage] != null) counts[item.stage] += 1;
    });
    return counts;
}

function reqTrackLastHistoryNote(dp, stageId) {
    if (!dp || !Array.isArray(dp.history)) return '';
    const stageStatuses = {
        gs_origin: ['requisition'],
        itdir: ['spec_raise_f1', 'quotes_itdir_eval', 'pfms_numbered'],
        col_sd: ['awaiting_gs'],
        daf_manac: ['awaiting_manac'],
        dp: ['f1_with_dp', 'spec_returned_dp', 'aiad_certificate'],
        due: ['aiad_due_diligence', 'aiad_certificate'],
        supplier: ['po_electronic', 'po_manual_authorised', 'supply_delivery'],
        daf_pay: ['delivery_verified'],
        funding: ['po_manual_pending_daf']
    };
    const want = new Set(stageStatuses[stageId] || []);
    const hit = dp.history.slice().reverse().find((h) => want.has(h.status));
    return hit?.note || '';
}

function reqTrackStageRelation(item, stageId) {
    const cur = reqTrackStageIndex(item.stage);
    const idx = reqTrackStageIndex(stageId);
    if (idx < cur) return 'done';
    if (idx === cur) return 'current';
    return 'upcoming';
}

function buildTrackStageDetail(item, stageId) {
    const stage = REQ_TRACK_STAGES.find((s) => s.id === stageId) || { label: stageId };
    const rel = reqTrackStageRelation(item, stageId);
    const req = item.req || null;
    const dp = item.dp || (item.kind === 'procurement' ? item.dp : findDpProcForRequisition(req));
    const dpSt = dp && typeof normalizeDpProcStatus === 'function'
        ? normalizeDpProcStatus(dp.status)
        : (dp?.status || '');
    const stake = dp?.stakeholder || {};
    const dpLabel = dp && typeof getDpProcStatusLabel === 'function'
        ? getDpProcStatusLabel(dpSt)
        : dpSt;

    let doing = '';
    let blocker = '';
    let action = '';

    if (stageId === 'gs_origin') {
        doing = 'Unit / formation raises a loose minute. Action is Brig Gen GS; Info is Col SD and IT Dir. The paper comes through GS Branch before it is seen at IT Dir.';
        if (rel === 'current') {
            blocker = req?.notes || 'Loose minute is with GS Branch — not yet stamped into IT Dir First Sight / Daily File.';
            action = 'GS Branch Orderly Room to route the minute to IT Dir Orderly Room (First Sight / DF).';
        } else if (rel === 'done') {
            blocker = req?.receivedDate
                ? `Received at IT Dir ${String(req.receivedDate).slice(0, 10)} — filed First Sight / DF.`
                : 'IT Dir Orderly Room has booked the GS Branch loose minute.';
        } else {
            blocker = 'Loose minute not yet raised through GS Branch.';
            action = 'Unit submits a loose minute through GS Branch (Action: Brig Gen GS).';
        }
    } else if (stageId === 'itdir') {
        doing = req
            ? `GS Branch loose minute ${req.reqNo || ''} is in the IT Dir First Sight / Daily File in-tray — Orderly Room stamp, HoD minute-sheet, stock check, then Q 1033 issue or DP F1.`
            : (dp
                ? `IT Directorate handling: ${dpLabel}. Spec evaluation, PFMS numbering, or F1 preparation before Colonel SD endorsement.`
                : 'IT Dir First Sight / DF — TechStores action on the GS Branch loose minute.');
        if (rel === 'current') {
            if (req) {
                blocker = `In-tray ${item.age} day(s) — ${req.priority === 'urgent' ? 'marked URGENT. ' : ''}${req.fulfillmentNote || req.notes || 'Awaiting TechStores action (route, issue, or send to procurement).'}`;
            } else {
                blocker = dp?.itdirSpecEvalNotes || dp?.verificationNotes || dp?.pipelineNotes || 'Awaiting IT Dir spec eval, F1 raise, or PFMS numbering.';
            }
            action = req ? 'Open First Sight / DF in-tray — respond, route, or raise DP F1.' : 'Open ICT Procurement Cycle for IT Dir steps.';
        } else if (rel === 'done') {
            doing = 'Completed at IT Dir (requisition booked / spec eval / F1 raised for this step).';
            blocker = 'None — moved forward.';
        } else {
            blocker = 'Not reached yet — GS Branch loose minute must be filed First Sight / DF at IT Dir first.';
            action = 'No action until paperwork arrives at IT Dir for this case.';
        }
    } else if (stageId === 'col_sd') {
        doing = 'Colonel SD (GS Branch) endorses the DP F1 procurement authority form and uploads signed endorsement.';
        if (rel === 'current') {
            blocker = stake.gs?.endorsedAt
                ? 'Endorsement recorded — should advance to MANAC.'
                : (reqTrackLastHistoryNote(dp, 'col_sd') || 'Awaiting GS Branch Colonel SD endorsement scan — F1 cannot proceed to MANAC/DP until signed.');
            action = 'Open GS Branch Window → DP F1 endorsement tab.';
        } else if (rel === 'done') {
            blocker = stake.gs?.endorsedAt ? `Endorsed ${String(stake.gs.endorsedAt).slice(0, 10)}.` : 'Colonel SD step completed.';
        } else {
            blocker = 'F1 not yet with GS Branch for Colonel SD endorsement.';
            action = 'Complete IT Dir F1 raise first.';
        }
    } else if (stageId === 'daf_manac') {
        doing = 'DAF / MANAC (DD DAF): funds endorsement on DP F1 before DP Contracts can proceed.';
        if (rel === 'current') {
            blocker = stake.daf?.endorsedAt
                ? 'MANAC endorsement recorded — should advance to DP.'
                : (reqTrackLastHistoryNote(dp, 'daf_manac') || 'Awaiting MANAC (DD DAF) funds endorsement on DP F1.');
            action = 'Open DAF Window → MANAC / DP F1 tab.';
        } else if (rel === 'done') {
            blocker = stake.daf?.endorsedAt ? `MANAC endorsed ${String(stake.daf.endorsedAt).slice(0, 10)}.` : 'MANAC step completed.';
        } else {
            blocker = 'F1 not yet with DAF for MANAC endorsement.';
            action = 'Complete Colonel SD (GS Branch) endorsement first.';
        }
    } else if (stageId === 'dp') {
        doing = 'Directorate Procurement: call for quotations, adjudication, winning vendor (SO1), P/O issue, hand-off to AIAD.';
        if (rel === 'current') {
            blocker = dp?.quotationsNotes || dp?.itdirSpecEvalNotes || dp?.pipelineNotes
                || (dpSt === 'f1_with_dp' ? 'Awaiting supplier quotations and IT Dir spec evaluation return.'
                    : dpSt === 'aiad_certificate' ? 'AIAD certificate returned — DP to issue P/O.'
                        : 'DP Contracts action in progress.');
            action = 'Open DP Window or ICT Procurement Cycle.';
        } else if (rel === 'done') {
            blocker = dp?.poNumber ? `P/O ${dp.poNumber} issued.` : 'DP stage completed for this case.';
        } else {
            blocker = 'Not yet lodged with DP Contracts.';
            action = 'Complete GS and DAF MANAC endorsements first.';
        }
    } else if (stageId === 'due') {
        doing = 'AIAD Price Due Diligence — audit of F1, spec, and supplier quotation before contract award.';
        if (rel === 'current') {
            blocker = stake.aiad?.certNo || dp?.dueDiligenceCert
                ? 'Certificate issued — should return to DP.'
                : (dp?.auditRef || 'Awaiting AIAD due diligence certificate — cannot award contract until AIAD signs off.');
            action = 'Open Due Diligence Window → Due diligence queue.';
        } else if (rel === 'done') {
            blocker = stake.aiad?.certNo || dp?.dueDiligenceCert || 'Due diligence completed.';
        } else {
            blocker = 'Pack not yet sent to AIAD.';
            action = 'DP must send F1 + spec + quotes to AIAD first.';
        }
    } else if (stageId === 'supplier') {
        doing = 'Registered supplier: quotation response, P/O fulfilment, delivery note upload, and goods supply against contract.';
        if (rel === 'current') {
            blocker = dp?.deliveryNoteRef
                ? `${dp.deliveryNoteRef} — awaiting full receipt / IT Dir verification.`
                : (dp?.poNumber ? `P/O ${dp.poNumber} — supplier supplying or D-Note not yet uploaded.` : 'Awaiting supplier quotation or delivery.');
            action = 'Check Supplier Window or Undelivered Items for RFQ/D-Note status.';
        } else if (rel === 'done') {
            blocker = dp?.deliveryNoteRef || 'Supplier supply recorded.';
        } else {
            blocker = 'P/O not yet issued or supplier not yet engaged.';
            action = 'Complete DP adjudication and P/O issue first.';
        }
    } else if (stageId === 'daf_pay') {
        doing = 'DAF supplier payment: after IT Dir delivery inspection, DAF records payment voucher against verified goods.';
        if (rel === 'current') {
            blocker = dp?.paymentRef || stake.daf?.paidAt
                ? 'Payment recorded — case should close.'
                : (dp?.verificationNotes || 'Delivery verified — payment voucher not recorded. Inspection hold may block DAF pay.');
            action = 'Open DAF Window → Supplier payment tab after inspection cleared.';
        } else if (rel === 'done') {
            blocker = stake.daf?.paymentRef || dp?.paymentRef
                ? `Paid: ${stake.daf?.paymentRef || dp.paymentRef}.`
                : 'DAF payment step completed.';
        } else {
            blocker = 'Goods not yet verified for payment.';
            action = 'Complete supplier delivery and IT Dir inspection first.';
        }
    } else if (stageId === 'funding') {
        doing = 'Vote / target / MANAC funding not confirmed — manual DAF path or await replenishment.';
        if (rel === 'current') {
            blocker = req?.fulfillmentNote || req?.notes
                || (dp?.budgetProvisioned === 'no' ? 'Non-budgeted vote — manual P/O awaiting DAF authorisation.'
                    : dpSt === 'po_manual_pending_daf' ? `Manual P/O ${dp?.poNumber || ''} — DAF authorisation required.`
                        : 'No GL buying power or DAF target allocation — cannot proceed on electronic procurement.');
            action = req ? 'Build monthly target proposal or route for manual DAF funds.' : 'Open DAF Window for authorisation / target allocation.';
        } else if (rel === 'done') {
            blocker = 'Funding cleared for this case.';
        } else {
            blocker = 'Not on funding hold yet.';
        }
    }

    return {
        stageLabel: stage.label,
        relation: rel,
        doing: doing || '—',
        blocker: blocker || (rel === 'upcoming' ? 'Stage not started.' : '—'),
        action: action || '—'
    };
}

function renderTrackStageDetailHtml(item, stageId) {
    const d = buildTrackStageDetail(item, stageId);
    const relLabel = d.relation === 'current' ? 'Current location'
        : d.relation === 'done' ? 'Completed step'
            : 'Not yet reached';
    return `
        <div class="req-track-detail-inner">
            <div class="req-track-detail-head">
                <strong>${reqTrackEscape(d.stageLabel)}</strong>
                <span class="req-track-detail-badge is-${reqTrackEscape(d.relation)}">${reqTrackEscape(relLabel)}</span>
            </div>
            <dl class="req-track-detail-list">
                <div><dt>What is happening</dt><dd>${reqTrackEscape(d.doing)}</dd></div>
                <div><dt>Why not progressing</dt><dd>${reqTrackEscape(d.blocker)}</dd></div>
                <div><dt>Next action</dt><dd>${reqTrackEscape(d.action)}</dd></div>
            </dl>
        </div>`;
}

function renderReqTrackStepper(item) {
    const activeIdx = reqTrackStageIndex(item.stage);
    const cols = REQ_TRACK_STAGES.length;
    const progressPct = cols <= 1 ? 0 : (activeIdx / (cols - 1)) * 100;

    const nodes = REQ_TRACK_STAGES.map((stage, idx) => {
        let nodeClass = 'req-track-node';
        if (idx < activeIdx) nodeClass += ' is-done';
        else if (idx === activeIdx) nodeClass += ' is-current';
        else nodeClass += ' is-pending';
        const inner = idx < activeIdx
            ? '<span aria-hidden="true">✓</span>'
            : `<span class="req-track-node-num">${idx + 1}</span>`;
        const connector = idx < cols - 1
            ? `<div class="req-track-seg${idx < activeIdx ? ' is-done' : (idx === activeIdx ? ' is-partial' : '')}" aria-hidden="true"></div>`
            : '';
        const currentLabel = idx === activeIdx ? ` aria-label="Paperwork currently at ${reqTrackEscape(stage.label)}"` : '';
        return `<div class="req-track-col" data-stage="${stage.id}">
            <div class="${nodeClass}" title="${reqTrackEscape(stage.label)}"${currentLabel}>${inner}</div>
            ${connector}
        </div>`;
    }).join('');

    const pills = REQ_TRACK_STAGES.map((stage, idx) => {
        const active = idx === activeIdx ? ' is-active' : (idx < activeIdx ? ' is-passed' : '');
        return `<button type="button" class="req-track-pill${active}${idx === activeIdx ? ' is-open' : ''}" data-track-pill="${reqTrackEscape(stage.id)}" data-track-item="${reqTrackEscape(item.id)}" aria-expanded="${idx === activeIdx ? 'true' : 'false'}" aria-controls="req-track-detail-${reqTrackEscape(item.id)}">${reqTrackEscape(stage.label)}</button>`;
    }).join('');

    const activeStage = REQ_TRACK_STAGES[activeIdx];
    const defaultDetail = renderTrackStageDetailHtml(item, item.stage);

    return `
        <article class="req-track-card" data-track-id="${reqTrackEscape(item.id)}" data-track-target="${reqTrackEscape(item.target)}" data-track-nav="${reqTrackEscape(item.navId)}" data-dp-id="${reqTrackEscape(item.dpId || '')}">
            <header class="req-track-card-head">
                <div class="req-track-card-ref">
                    <strong>${reqTrackEscape(item.ref)}</strong>
                    ${item.urgent ? '<span class="req-track-urgent">URGENT</span>' : ''}
                </div>
                <div class="req-track-card-meta">
                    <span>${reqTrackEscape(item.title)}</span>
                    <em>${reqTrackEscape(item.detail)}${item.glLabel ? ` · ${reqTrackEscape(item.glLabel)}` : ''}</em>
                </div>
                <button type="button" class="btn btn-ghost btn-sm req-track-open-btn" data-track-open="${reqTrackEscape(item.id)}">Open</button>
            </header>
            <div class="req-track-visual" style="--req-track-progress:${progressPct.toFixed(1)}%;--req-track-stage-cols:${cols}">
                <div class="req-track-rail" aria-hidden="true">
                    <div class="req-track-rail-fill"></div>
                </div>
                <div class="req-track-nodes" role="list" aria-label="Procurement progress">${nodes}</div>
                <div class="req-track-pills" role="group" aria-label="Stage labels — click for detail">${pills}</div>
                <div class="req-track-stage-detail" id="req-track-detail-${reqTrackEscape(item.id)}">${defaultDetail}</div>
                <p class="req-track-now">Paperwork at: <strong>${reqTrackEscape(activeStage.label)}</strong>${item.age ? ` · ${item.age}d in tray` : ''} · <span class="muted">Click a stage for detail</span></p>
            </div>
        </article>`;
}

function renderRequisitionTrackerDashboard() {
    const host = document.getElementById('reqTrackerPanel');
    const listHost = document.getElementById('reqTrackerList');
    const summaryHost = document.getElementById('reqTrackerSummary');
    if (!host || !listHost) return;

    const items = buildRequisitionTrackItems();
    const counts = reqTrackStageCounts(items);

    if (summaryHost) {
        summaryHost.innerHTML = REQ_TRACK_STAGES.map((stage) => {
            const n = counts[stage.id] || 0;
            return `<div class="req-track-summary-chip${n ? ' has-count' : ''}">
                <span class="req-track-summary-value">${n}</span>
                <span class="req-track-summary-label">${reqTrackEscape(stage.short)}</span>
            </div>`;
        }).join('');
    }

    if (!items.length) {
        listHost.innerHTML = `<p class="muted req-track-empty">No open GS Branch loose minutes or procurement cases in the pipeline. Book a unit requisition (via GS Branch) or load demo examples to see the tracker.</p>`;
        return;
    }

    listHost.innerHTML = items.slice(0, 16).map((item) => renderReqTrackStepper(item)).join('');
    window._reqTrackItems = Object.fromEntries(items.map((it) => [it.id, it]));

    listHost.querySelectorAll('[data-track-open]').forEach((btn) => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const card = btn.closest('.req-track-card');
            if (!card || typeof navigateToModule !== 'function') return;
            const target = card.getAttribute('data-track-target');
            const navId = card.getAttribute('data-track-nav');
            const dpId = card.getAttribute('data-dp-id');
            if (target === 'dp-procurement' && dpId) {
                navigateToModule('dp-procurement');
                setTimeout(() => {
                    if (typeof editDpProcurement === 'function') editDpProcurement(dpId);
                }, 80);
                return;
            }
            if (target === 'unit-requisitions') {
                navigateToModule('unit-requisitions');
                if (navId && typeof editRequisition === 'function') {
                    setTimeout(() => editRequisition(navId), 80);
                }
                return;
            }
        });
    });

    listHost.querySelectorAll('[data-track-pill]').forEach((btn) => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const card = btn.closest('.req-track-card');
            if (!card) return;
            const itemId = btn.getAttribute('data-track-item');
            const stageId = btn.getAttribute('data-track-pill');
            const item = window._reqTrackItems?.[itemId];
            const detailHost = card.querySelector('.req-track-stage-detail');
            if (!item || !detailHost || !stageId) return;

            const alreadyOpen = btn.classList.contains('is-open') && !detailHost.hidden;
            card.querySelectorAll('[data-track-pill]').forEach((pill) => {
                pill.classList.remove('is-open');
                pill.setAttribute('aria-expanded', 'false');
            });
            if (alreadyOpen) {
                detailHost.hidden = true;
                return;
            }

            btn.classList.add('is-open');
            btn.setAttribute('aria-expanded', 'true');
            detailHost.innerHTML = renderTrackStageDetailHtml(item, stageId);
            detailHost.hidden = false;
        });
    });

    listHost.querySelectorAll('.req-track-card').forEach((card) => {
        card.addEventListener('click', (e) => {
            if (e.target.closest('.req-track-open-btn') || e.target.closest('[data-track-pill]')) return;
            card.classList.toggle('is-expanded');
        });
    });
}

function initRequisitionTrackerModule() {
    const host = document.getElementById('reqTrackerPanel');
    if (!host || host.dataset.reqTrackInit === '1') return;
    host.dataset.reqTrackInit = '1';
    document.getElementById('reqTrackerRefreshBtn')?.addEventListener('click', () => {
        renderRequisitionTrackerDashboard();
        if (typeof showToast === 'function') showToast('Requisition tracker refreshed.');
    });
}

window.REQ_TRACK_STAGES = REQ_TRACK_STAGES;
window.buildRequisitionTrackItems = buildRequisitionTrackItems;
window.renderRequisitionTrackerDashboard = renderRequisitionTrackerDashboard;
window.initRequisitionTrackerModule = initRequisitionTrackerModule;
window.resolveRequisitionTrackStage = resolveRequisitionTrackStage;
window.resolveDpProcTrackStage = resolveDpProcTrackStage;
