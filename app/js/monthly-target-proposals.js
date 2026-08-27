/* monthly-target-proposals.js — Monthly DAF target proposals from requisitions + priority lists */

const MTP_STATUS = {
    draft: 'Draft',
    submitted: 'Submitted to DAF',
    approved: 'Approved / voted'
};

function formatProposalAmount(amount, currency = 'ZWG') {
    const n = Number(amount) || 0;
    const formatted = n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${currency} ${formatted}`;
}

function formatMemoDisplayDate(isoDate) {
    if (!isoDate) return '';
    const d = new Date(`${isoDate}T00:00:00`);
    if (Number.isNaN(d.getTime())) return isoDate;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function memoEscape(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function getOrgLetterhead() {
    const profile = typeof getOrgProfile === 'function' ? getOrgProfile() : null;
    return {
        directorate: 'Information Technology Directorate',
        location: profile?.location || 'Josiah Magama Tongogara Barracks',
        address: 'P Bag 7720, Causeway, Harare: 708518'
    };
}

function defaultProposalMemo(proposal, month) {
    const ym = month || proposal?.month || currentYmIso();
    const monthLabel = formatYmLabel(ym);
    return {
        recipient: 'See Distribution',
        ref: proposal?.ref || '',
        memoDate: proposal?.memoDate || '',
        subject: proposal?.subject || `REQUEST FOR FUNDS FOR ${monthLabel.toUpperCase()} TARGET AS PRIORITY LIST`,
        distributionAction: 'GS Br',
        distributionInfo: 'DAF, File',
        signatoryName: 'W BARWA',
        signatoryPostnom: "psc' ZW",
        signatoryRank: 'Maj',
        signatoryTitle: 'for Dir',
        enclosure: `IT Dir priority list for ${monthLabel}`,
        closingLine: 'Forwarded for your action.',
        bodyIntro:
            `The Directorate request allocation of funds for ${monthLabel} target amounting to {AMOUNT}. ` +
            'Attached herewith please find the IT Dir priority list crucial for maintaining operations within the organization.'
    };
}

function getProposalMemo(month) {
    const ym = month || (typeof getSelectedGlTargetMonth === 'function' ? getSelectedGlTargetMonth() : currentYmIso());
    const proposal = getMonthlyTargetProposal(ym);
    const defaults = defaultProposalMemo(proposal, ym);
    const memo = { ...defaults, ...(proposal?.memo || {}) };
    if (!memo.ref && proposal?.ref) memo.ref = proposal.ref;
    if (!memo.memoDate && proposal?.memoDate) memo.memoDate = proposal.memoDate;
    if (!memo.subject && proposal?.subject) memo.subject = proposal.subject;
    return memo;
}

function saveProposalMemoFields(partial, month) {
    const ym = month || (typeof getSelectedGlTargetMonth === 'function' ? getSelectedGlTargetMonth() : currentYmIso());
    const proposal = getMonthlyTargetProposal(ym) || {
        id: `mtp-${ym}`,
        month: ym,
        status: 'draft',
        currency: 'ZWG',
        lines: [],
        glTotals: {},
        proposedTargets: {},
        totalRequested: 0,
        createdAt: new Date().toISOString()
    };
    proposal.memo = { ...(proposal.memo || {}), ...(partial || {}) };
    if (partial?.ref) proposal.ref = partial.ref;
    if (partial?.memoDate) proposal.memoDate = partial.memoDate;
    if (partial?.subject) proposal.subject = partial.subject;
    saveMonthlyTargetProposal(proposal, ym);
    return proposal.memo;
}

function syncProposalMemoFormFields() {
    const memo = getProposalMemo();
    const set = (id, value) => {
        const el = document.getElementById(id);
        if (el && el.value !== (value ?? '')) el.value = value ?? '';
    };
    set('proposalMemoRef', memo.ref);
    set('proposalMemoDate', memo.memoDate);
    set('proposalMemoSubject', memo.subject);
    set('proposalMemoRecipient', memo.recipient);
    set('proposalMemoDistAction', memo.distributionAction);
    set('proposalMemoDistInfo', memo.distributionInfo);
    set('proposalMemoEnclosure', memo.enclosure);
    set('proposalMemoSignName', memo.signatoryName);
    set('proposalMemoSignPostnom', memo.signatoryPostnom);
    set('proposalMemoSignRank', memo.signatoryRank);
    set('proposalMemoSignTitle', memo.signatoryTitle);
    set('proposalMemoClosing', memo.closingLine);
}

function readProposalMemoForm() {
    const val = (id) => document.getElementById(id)?.value?.trim() || '';
    return {
        ref: val('proposalMemoRef'),
        memoDate: val('proposalMemoDate'),
        subject: val('proposalMemoSubject'),
        recipient: val('proposalMemoRecipient'),
        distributionAction: val('proposalMemoDistAction'),
        distributionInfo: val('proposalMemoDistInfo'),
        enclosure: val('proposalMemoEnclosure'),
        signatoryName: val('proposalMemoSignName'),
        signatoryPostnom: val('proposalMemoSignPostnom'),
        signatoryRank: val('proposalMemoSignRank'),
        signatoryTitle: val('proposalMemoSignTitle'),
        closingLine: val('proposalMemoClosing')
    };
}

function buildDafFundRequestMemoHtml(month) {
    const ym = month || (typeof getSelectedGlTargetMonth === 'function' ? getSelectedGlTargetMonth() : currentYmIso());
    const proposal = getMonthlyTargetProposal(ym);
    const memo = getProposalMemo(ym);
    const head = getOrgLetterhead();
    const monthLabel = formatYmLabel(ym);
    const currency = proposal?.currency || 'ZWG';
    const total = proposal?.totalRequested
        || Object.values(proposal?.proposedTargets || proposal?.glTotals || {}).reduce((s, n) => s + (Number(n) || 0), 0);
    const amountText = formatProposalAmount(total, currency);
    const bodyText = (memo.bodyIntro || defaultProposalMemo(proposal, ym).bodyIntro).replace('{AMOUNT}', amountText);
    const dateDisplay = formatMemoDisplayDate(memo.memoDate) || formatMemoDisplayDate(new Date().toISOString().slice(0, 10));
    const signLine = [
        memo.signatoryName,
        memo.signatoryPostnom,
        memo.signatoryRank,
        memo.signatoryTitle
    ].filter(Boolean).join(', ');

    return `
<div class="daf-fund-memo-doc official-memo-doc">
  <div class="daf-memo-restricted">RESTRICTED</div>
  <div class="daf-memo-letterhead">
    <div class="daf-memo-org">${memoEscape(head.directorate)}</div>
    <div>${memoEscape(head.location)}</div>
    <div>${memoEscape(head.address)}</div>
  </div>
  <div class="daf-memo-meta">
    <div class="daf-memo-meta-left">
      <div><span class="daf-memo-label">Ref</span> ${memoEscape(memo.ref || '—')}</div>
    </div>
    <div class="daf-memo-meta-right">
      <div><span class="daf-memo-label">To</span> ${memoEscape(memo.recipient || 'See Distribution')}</div>
      <div><span class="daf-memo-label">Date</span> ${memoEscape(dateDisplay)}</div>
    </div>
  </div>
  <div class="daf-memo-subject"><u>${memoEscape(memo.subject || `REQUEST FOR FUNDS FOR ${monthLabel.toUpperCase()} TARGET AS PRIORITY LIST`)}</u></div>
  <div class="daf-memo-body">
    <p>1.&nbsp;&nbsp;${memoEscape(bodyText)}</p>
    <p>2.&nbsp;&nbsp;${memoEscape(memo.closingLine || 'Forwarded for your action.')}</p>
  </div>
  <div class="daf-memo-signatory">
    <div class="daf-memo-sign-line">${memoEscape(signLine)}</div>
  </div>
  <div class="daf-memo-enclosure">
    <strong>Enclosure:</strong> ${memoEscape(memo.enclosure || `IT Dir priority list for ${monthLabel}`)}
  </div>
  <div class="daf-memo-distribution">
    <div><strong>Distribution</strong></div>
    <div>Action:&nbsp;&nbsp;${memoEscape(memo.distributionAction || 'GS Br')}</div>
    <div>Information:&nbsp;&nbsp;${memoEscape(memo.distributionInfo || 'DAF, File')}</div>
  </div>
  <div class="daf-memo-routing">
    <table class="daf-memo-routing-table">
      <thead><tr><th>APPT</th><th>SIGNATURE</th><th>DATE</th></tr></thead>
      <tbody>
        <tr><td>Dir</td><td></td><td></td></tr>
        <tr><td>DD</td><td></td><td></td></tr>
        <tr><td>Comdt</td><td></td><td></td></tr>
        <tr><td>OC Sys Admin</td><td></td><td></td></tr>
        <tr><td>Tech Stores Offr</td><td></td><td></td></tr>
      </tbody>
    </table>
  </div>
  <div class="daf-memo-restricted daf-memo-restricted-foot">RESTRICTED</div>
</div>`;
}

function buildDafFundRequestMemoReportData(month) {
    const ym = month || (typeof getSelectedGlTargetMonth === 'function' ? getSelectedGlTargetMonth() : currentYmIso());
    const proposal = getMonthlyTargetProposal(ym);
    const memo = getProposalMemo(ym);
    const total = proposal?.totalRequested || 0;
    return {
        title: memo.subject || `DAF Fund Request — ${formatYmLabel(ym)}`,
        layout: 'daf-fund-memo',
        html: buildDafFundRequestMemoHtml(ym),
        summary: [
            `Ref: ${memo.ref || '—'}`,
            `Total requested: ${formatProposalAmount(total, proposal?.currency || 'ZWG')}`,
            `Distribution — Action: ${memo.distributionAction || 'GS Br'} · Information: ${memo.distributionInfo || 'DAF, File'}`
        ],
        fields: [],
        tables: []
    };
}

function ensureMonthlyTargetProposals() {
    if (!appState) return {};
    if (!appState.monthlyTargetProposals || typeof appState.monthlyTargetProposals !== 'object') {
        appState.monthlyTargetProposals = {};
    }
    return appState.monthlyTargetProposals;
}

function getMonthlyTargetProposal(month) {
    const ym = month || (typeof getSelectedGlTargetMonth === 'function' ? getSelectedGlTargetMonth() : currentYmIso());
    const all = ensureMonthlyTargetProposals();
    return all[ym] || null;
}

function saveMonthlyTargetProposal(proposal, month) {
    const ym = month || proposal?.month || currentYmIso();
    const all = ensureMonthlyTargetProposals();
    all[ym] = {
        ...proposal,
        month: ym,
        updatedAt: new Date().toISOString()
    };
    if (typeof saveState === 'function') saveState();
    return all[ym];
}

function estimateRequisitionCost(req) {
    const qty = Math.max(1, Number(req.qty) || 1);
    const unit = Math.max(0, Number(req.unitPrice) || 0);
    const direct = Math.max(0, Number(req.estimatedCost) || 0);
    if (direct > 0) return direct;
    if (unit > 0) return unit * qty;
    return 0;
}

function resolveRequisitionGl(req) {
    if (req.procurementGl) return req.procurementGl;
    if (typeof resolveGlForRequisition === 'function') return resolveGlForRequisition(req);
    const cat = String(req.category || '');
    if (cat.includes('ict') || cat.includes('equipment')) return '3112210001';
    if (cat.includes('software')) return '2200600003';
    if (cat.includes('spares')) return '2201900002';
    if (cat.includes('maint')) return '220200002';
    return '2200600002';
}

function requisitionsForTargetMonth(month, { openOnly = true } = {}) {
    const ym = month || currentYmIso();
    const list = typeof ensureRequisitions === 'function' ? ensureRequisitions() : [];
    return list.filter((req) => {
        const reqMonth = req.targetMonth || String(req.receivedDate || '').slice(0, 7);
        if (reqMonth && reqMonth !== ym) return false;
        if (openOnly && typeof REQ_OPEN_STATUSES !== 'undefined' && !REQ_OPEN_STATUSES.has(req.status)) return false;
        return true;
    });
}

function aggregateProposalLinesFromRequisitions(month) {
    const lines = [];
    let ser = 1;
    requisitionsForTargetMonth(month, { openOnly: true }).forEach((req) => {
        const gl = resolveRequisitionGl(req);
        const amount = estimateRequisitionCost(req);
        if (amount <= 0 && !req.itemDescription && !req.subject) return;
        lines.push({
            ser: ser++,
            gl,
            glName: (typeof GL_ACCOUNTS !== 'undefined' && GL_ACCOUNTS[gl]?.name) || gl,
            category: getRequisitionCategoryLabel(req.category),
            item: req.itemDescription || req.subject || '—',
            qty: req.qty || 1,
            unitPrice: Number(req.unitPrice) || (amount && req.qty ? amount / Math.max(1, req.qty) : 0),
            amountRequested: amount,
            user: req.unit || req.originUnitDetail || '—',
            remarks: req.fulfillmentLabel || req.notes || '',
            source: 'requisition',
            requisitionId: req.id,
            reqNo: req.reqNo || '',
            priority: req.priority || 'normal'
        });
    });
    return lines;
}

function sumLinesByGl(lines) {
    const totals = {};
    (lines || []).forEach((line) => {
        const gl = line.gl;
        if (!gl) return;
        totals[gl] = (totals[gl] || 0) + (Number(line.amountRequested) || 0);
    });
    return totals;
}

function buildMonthlyTargetProposalFromRequisitions(month, options = {}) {
    const ym = month || (typeof getSelectedGlTargetMonth === 'function' ? getSelectedGlTargetMonth() : currentYmIso());
    const existing = getMonthlyTargetProposal(ym);
    const reqLines = aggregateProposalLinesFromRequisitions(ym);
    const keepManual = options.keepManualLines !== false
        ? (existing?.lines || []).filter((l) => l.source !== 'requisition')
        : [];
    const lines = [...keepManual, ...reqLines];
    const glTotals = sumLinesByGl(lines);
    const totalRequested = Object.values(glTotals).reduce((s, n) => s + n, 0);
    const meta = existing || {};
    const proposal = {
        id: meta.id || `mtp-${ym}`,
        month: ym,
        status: meta.status || 'draft',
        currency: meta.currency || 'ZWG',
        ref: meta.ref || '',
        memoDate: meta.memoDate || '',
        subject: meta.subject || `REQUEST FOR FUNDS FOR ${formatYmLabel(ym).toUpperCase()} TARGET AS PRIORITY LIST`,
        lines,
        glTotals,
        proposedTargets: { ...(meta.proposedTargets || {}), ...glTotals },
        totalRequested,
        compiledBy: meta.compiledBy || '',
        approvedBy: meta.approvedBy || '',
        createdAt: meta.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        notes: meta.notes || '',
        memo: meta.memo || undefined
    };
    saveMonthlyTargetProposal(proposal, ym);
    return proposal;
}

function applyProposalTargetsToMonth(month, options = {}) {
    const ym = month || (typeof getSelectedGlTargetMonth === 'function' ? getSelectedGlTargetMonth() : currentYmIso());
    const proposal = getMonthlyTargetProposal(ym);
    if (!proposal) {
        return { ok: false, error: 'No target proposal for this month.' };
    }
    const targets = proposal.proposedTargets || proposal.glTotals || {};
    Object.entries(targets).forEach(([gl, amount]) => {
        if (gl.startsWith('_')) return;
        if (typeof setGlMonthlyTarget === 'function') setGlMonthlyTarget(gl, amount, ym);
    });
    if (proposal.ref && typeof saveMonthDafMeta === 'function') {
        saveMonthDafMeta({
            source: 'DAF',
            ref: proposal.ref,
            receivedDate: proposal.memoDate || '',
            notes: proposal.subject || proposal.notes || ''
        }, ym);
    }
    if (options.markApproved) {
        proposal.status = 'approved';
        saveMonthlyTargetProposal(proposal, ym);
    }
    if (typeof saveState === 'function') saveState();
    if (typeof updateDashboard === 'function') updateDashboard();
    if (typeof updateSystemAlerts === 'function') updateSystemAlerts();
    return { ok: true, month: ym, glCount: Object.keys(targets).length };
}

function getProposalAmountForGl(gl, month) {
    const proposal = getMonthlyTargetProposal(month);
    if (!proposal) return 0;
    const fromTargets = Number(proposal.proposedTargets?.[gl]) || 0;
    const fromTotals = Number(proposal.glTotals?.[gl]) || 0;
    return fromTargets || fromTotals || 0;
}

function getTargetProposalAlerts() {
    const alerts = [];
    const ym = typeof getSelectedGlTargetMonth === 'function' ? getSelectedGlTargetMonth() : currentYmIso();
    const proposal = getMonthlyTargetProposal(ym);
    const openReqs = requisitionsForTargetMonth(ym, { openOnly: true });
    const unfundedReqs = openReqs.filter((req) => {
        const cost = estimateRequisitionCost(req);
        const gl = resolveRequisitionGl(req);
        const power = typeof getGlBuyingPower === 'function' ? getGlBuyingPower(gl, ym) : 0;
        return cost > 0 && cost > power;
    });

    if (!proposal && openReqs.length) {
        alerts.push({
            type: 'info',
            target: 'dashboard',
            text: `${openReqs.length} open requisition(s) for ${formatYmLabel(ym)} — build a monthly target proposal from Unit Requisitions / GL Target Overview.`
        });
    }

    if (proposal) {
        if (proposal.status === 'draft') {
            alerts.push({
                type: 'warning',
                target: 'dashboard',
                text: `${formatYmLabel(ym)} target proposal (${proposal.ref || 'draft'}) — ${formatCurrency(proposal.totalRequested || 0)} requested. Review and apply DAF targets.`
            });
        }
        Object.keys(GL_ACCOUNTS || {}).forEach((gl) => {
            const proposed = getProposalAmountForGl(gl, ym);
            const voted = typeof getGlMonthlyTarget === 'function' ? getGlMonthlyTarget(gl, ym) : 0;
            if (proposed > 0 && voted > 0 && proposed > voted) {
                alerts.push({
                    type: 'warning',
                    target: 'dashboard',
                    text: `GL ${gl}: proposal ${formatCurrency(proposed)} exceeds DAF vote ${formatCurrency(voted)} for ${formatYmLabel(ym)}.`
                });
            }
        });
    }

    unfundedReqs.slice(0, 5).forEach((req) => {
        const cost = estimateRequisitionCost(req);
        alerts.push({
            type: 'danger',
            target: 'unit-requisitions',
            reqId: req.id,
            text: `Needs target funding: ${req.unit || 'Unit'} — ${req.itemDescription || req.subject} (${formatCurrency(cost)}) not covered by ${formatYmLabel(ym)} buying power.`
        });
    });

    return alerts;
}

function buildMonthlyTargetProposalReportData(month) {
    const ym = month || (typeof getSelectedGlTargetMonth === 'function' ? getSelectedGlTargetMonth() : currentYmIso());
    const proposal = getMonthlyTargetProposal(ym);
    if (!proposal) {
        return {
            title: `IT Dir Priority List — ${formatYmLabel(ym)}`,
            summary: ['No target proposal recorded for this month. Build one from requisitions or load September 2026 seed.'],
            fields: [],
            tables: []
        };
    }

    const rows = (proposal.lines || []).map((line) => [
        line.ser,
        line.item || '—',
        line.gl || '—',
        line.glName || '',
        line.qty ?? '',
        line.unitPrice ? formatCurrency(line.unitPrice) : '',
        line.amountRequested ? formatCurrency(line.amountRequested) : '',
        line.user || '—',
        line.remarks || '',
        line.source === 'requisition' ? (line.reqNo || 'REQ') : 'Priority'
    ]);

    const glSummaryRows = Object.keys(GL_ACCOUNTS || {}).map((gl) => {
        const proposed = getProposalAmountForGl(gl, ym);
        const voted = typeof getGlMonthlyTarget === 'function' ? getGlMonthlyTarget(gl, ym) : 0;
        return [
            gl,
            GL_ACCOUNTS[gl]?.name || gl,
            proposed ? formatCurrency(proposed) : '—',
            voted ? formatCurrency(voted) : '—',
            proposed && voted ? formatCurrency(voted - proposed) : '—'
        ];
    }).filter((row) => row[2] !== '—' || row[3] !== '—');

    return {
        title: `RESTRICTED — IT DIR PRIORITY LIST FOR ${formatYmLabel(ym).toUpperCase()}`,
        layout: 'priority-list',
        summary: [
            proposal.subject || '',
            `Reference: ${proposal.ref || '—'} · Date: ${proposal.memoDate || '—'}`,
            `Status: ${MTP_STATUS[proposal.status] || proposal.status} · Total requested: ${formatCurrency(proposal.totalRequested || 0)} ${proposal.currency || 'ZWG'}`,
            `Lines: ${(proposal.lines || []).length} · Requisition-backed: ${(proposal.lines || []).filter((l) => l.source === 'requisition').length}`
        ],
        fields: [
            { label: 'Directorate', value: 'Information Technology Directorate' },
            { label: 'Memo ref', value: proposal.ref || '—' },
            { label: 'Compiled by', value: proposal.compiledBy || '—' },
            { label: 'Approved by', value: proposal.approvedBy || '—' }
        ],
        tables: [
            {
                tbodyId: 'priority-list-lines',
                title: 'Priority list (needs / requisitions)',
                headers: ['Ser', 'Item', 'GL ACC', 'GL Name', 'QTY', 'PRICE', 'AMT REQ', 'USER', 'REMARKS', 'Source'],
                rows
            },
            {
                tbodyId: 'priority-list-gl-summary',
                title: 'GL summary — proposed vs DAF vote',
                headers: ['GL', 'Account name', 'Proposed', 'DAF vote', 'Gap'],
                rows: glSummaryRows
            }
        ]
    };
}

function renderTargetProposalBanner() {
    const el = document.getElementById('targetProposalBanner');
    if (!el) return;
    const ym = typeof getSelectedGlTargetMonth === 'function' ? getSelectedGlTargetMonth() : currentYmIso();
    const proposal = getMonthlyTargetProposal(ym);
    if (!proposal) {
        el.innerHTML = `<span class="target-proposal-empty">No ${formatYmLabel(ym)} target proposal yet. Use <strong>Build from requisitions</strong> or load the September 2026 pack.</span>`;
        el.className = 'target-proposal-banner is-empty';
        return;
    }
    const reqCount = (proposal.lines || []).filter((l) => l.source === 'requisition').length;
    el.innerHTML =
        `<strong>${formatYmLabel(ym)} target proposal</strong> · ${MTP_STATUS[proposal.status] || proposal.status}` +
        ` · ${formatCurrency(proposal.totalRequested || 0)} ${proposal.currency || 'ZWG'}` +
        (proposal.ref ? ` · Ref <strong>${String(proposal.ref).replace(/</g, '')}</strong>` : '') +
        ` · ${(proposal.lines || []).length} line(s) (${reqCount} from requisitions)`;
    el.className = `target-proposal-banner status-${proposal.status || 'draft'}`;
}

function initMonthlyTargetProposalControls() {
    document.getElementById('btnBuildTargetProposal')?.addEventListener('click', () => {
        if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;
        const ym = getSelectedGlTargetMonth();
        const proposal = buildMonthlyTargetProposalFromRequisitions(ym);
        renderTargetProposalBanner();
        if (typeof syncProposalMemoFormFields === 'function') syncProposalMemoFormFields();
        if (typeof showToast === 'function') {
            showToast(`Built ${formatYmLabel(ym)} proposal — ${proposal.lines.length} line(s), ${formatCurrency(proposal.totalRequested)} total.`, 'success');
        }
        if (typeof updateDashboard === 'function') updateDashboard();
        if (typeof updateSystemAlerts === 'function') updateSystemAlerts();
    });

    document.getElementById('btnApplyProposalTargets')?.addEventListener('click', () => {
        if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;
        const ym = getSelectedGlTargetMonth();
        if (!confirm(`Apply proposed GL targets to ${formatYmLabel(ym)} DAF votes?`)) return;
        const result = applyProposalTargetsToMonth(ym);
        if (!result.ok) {
            if (typeof showToast === 'function') showToast(result.error, 'error');
            return;
        }
        renderTargetProposalBanner();
        if (typeof showToast === 'function') showToast(`Applied ${result.glCount} GL target(s) for ${formatYmLabel(ym)}.`, 'success');
    });

    document.getElementById('btnPrintTargetProposal')?.addEventListener('click', () => {
        if (typeof generateModuleReport === 'function') {
            generateModuleReport('monthly-target-proposal', { navigate: true, autoPrint: false });
        }
    });

    document.getElementById('btnPrintDafFundMemo')?.addEventListener('click', () => {
        const ym = getSelectedGlTargetMonth();
        if (!getMonthlyTargetProposal(ym)) {
            if (typeof showToast === 'function') showToast('Build or load a target proposal first.', 'warning');
            return;
        }
        if (typeof generateModuleReport === 'function') {
            generateModuleReport('daf-fund-request-memo', { navigate: true, autoPrint: false });
        }
    });

    document.getElementById('btnSaveProposalMemo')?.addEventListener('click', () => {
        if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;
        saveProposalMemoFields(readProposalMemoForm());
        const ref = document.getElementById('proposalMemoRef')?.value?.trim();
        const memoDate = document.getElementById('proposalMemoDate')?.value?.trim();
        if (ref && typeof saveMonthDafMeta === 'function') {
            saveMonthDafMeta({ ref, receivedDate: memoDate || '' });
        }
        renderTargetProposalBanner();
        if (typeof showToast === 'function') showToast('DAF fund request memo saved.', 'success');
    });

    ['proposalMemoRef', 'proposalMemoDate', 'proposalMemoSubject', 'proposalMemoRecipient',
        'proposalMemoDistAction', 'proposalMemoDistInfo', 'proposalMemoEnclosure',
        'proposalMemoSignName', 'proposalMemoSignPostnom', 'proposalMemoSignRank',
        'proposalMemoSignTitle', 'proposalMemoClosing'].forEach((id) => {
        document.getElementById(id)?.addEventListener('change', () => {
            if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;
            saveProposalMemoFields(readProposalMemoForm());
        });
    });

    syncProposalMemoFormFields();

    document.getElementById('btnSeedSeptember2026')?.addEventListener('click', () => {
        if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;
        if (!confirm('Load September 2026 IT Dir priority list, targets, and sample requisitions?')) return;
        seedSeptember2026TargetPack();
        renderTargetProposalBanner();
        if (typeof syncProposalMemoFormFields === 'function') syncProposalMemoFormFields();
        if (typeof updateDashboard === 'function') updateDashboard();
        if (typeof renderRequisitionsModule === 'function') renderRequisitionsModule();
        if (typeof updateSystemAlerts === 'function') updateSystemAlerts();
        if (typeof showToast === 'function') showToast('September 2026 target proposal and requisitions loaded.', 'success');
    });

    renderTargetProposalBanner();
}

/* ——— September 2026 seed (from IT/25 priority list pack) ——— */

function september2026PriorityLines() {
    return [
        { ser: 1, gl: '2200600002', category: 'Offc Supplies & Services Consumables', item: 'Various toner', qty: 636, unitPrice: 4780, amountRequested: 1552348.80, user: 'Fmns/Unit', source: 'priority' },
        { ser: 2, gl: '2200600002', category: 'Offc Supplies & Services Consumables', item: 'HP W2070 117 sets (12)', qty: 12, unitPrice: 3984, amountRequested: 47808, user: 'MID, TRG BR, GS BR, ENGRS DIR', source: 'priority' },
        { ser: 3, gl: '2200600002', category: 'Offc Supplies & Services Consumables', item: '913 Sets (12)', qty: 12, unitPrice: 5312, amountRequested: 63744, user: 'AS BR, CMR', source: 'priority' },
        { ser: 4, gl: '2200600002', category: 'Offc Supplies & Services Consumables', item: 'Ricoh MC 2000i Sets (12)', qty: 12, unitPrice: 5312, amountRequested: 79680, user: 'Schools', source: 'priority' },
        { ser: 5, gl: '2200600002', category: 'Offc Supplies & Services Consumables', item: 'Canon CEXV54 (5)', qty: 5, unitPrice: 3984, amountRequested: 19920, user: 'ZMA, DAF, IT DIR', source: 'priority' },
        { ser: 6, gl: '2200600002', category: 'Offc Supplies & Services Consumables', item: '212 Sets (10)', qty: 10, unitPrice: 9296, amountRequested: 92960, user: 'Comd Elem, Insp', source: 'priority' },
        { ser: 7, gl: '3112210001', category: 'ICT Eqpt', item: 'Xerox C60 Toner Sets (10)', qty: 10, unitPrice: 7968, amountRequested: 95616, user: 'Printing Press', source: 'priority' },
        { ser: 8, gl: '3112210001', category: 'ICT Eqpt', item: 'Desktop × 50', qty: 50, unitPrice: 31872, amountRequested: 3187200, user: 'Fmns/Unit', source: 'priority' },
        { ser: 9, gl: '3112210001', category: 'ICT Eqpt', item: 'iMac Pro 24"', qty: 1, unitPrice: 53120, amountRequested: 53120, user: 'Fmns/Unit', source: 'priority' },
        { ser: 10, gl: '3112210001', category: 'ICT Eqpt', item: 'Laptop Core i9', qty: 178, unitPrice: 39840, amountRequested: 7091520, user: 'Fmns/Unit', source: 'priority' },
        { ser: 11, gl: '3112210001', category: 'ICT Eqpt', item: '600 × Medium Printers', qty: 600, unitPrice: 26560, amountRequested: 1859200, user: 'Fmns/Unit', source: 'priority' },
        { ser: 12, gl: '3112210001', category: 'ICT Eqpt', item: '15 × Multimedia Projectors', qty: 15, unitPrice: 21248, amountRequested: 488704, user: 'Fmns/Unit', source: 'priority' },
        { ser: 13, gl: '3112210001', category: 'ICT Eqpt', item: '15 × Projector Screen', qty: 15, unitPrice: 13280, amountRequested: 265600, user: 'Fmns/Unit', source: 'priority' },
        { ser: 14, gl: '220200002', category: 'Tech Eqpt', item: '12 × Ricoh HD Printers, 8 × M806, 10 × Canon HD Printers', qty: 30, unitPrice: 92950, amountRequested: 2788800, user: 'Fmns/Unit', source: 'priority' },
        { ser: 15, gl: '2200600003', category: 'Renewal Comp Soft', item: 'Kaspersky, Windows/SQL Server, DevExpress, IdeaBlade renewals', qty: 1, unitPrice: 1730940, amountRequested: 1730940, user: 'IT DIR', source: 'priority' },
        { ser: 16, gl: '2201900002', category: 'Part Tech Eqpt', item: 'Universal standard Sp LCD, laptop HDD, SSD, surge protectors', qty: 1, unitPrice: 106240, amountRequested: 106240, user: 'IT Dir — printer repairs', source: 'priority' },
        { ser: 17, gl: '220200002', category: 'Maint of Tech & offc eqpt', item: 'ZAPAR pay printers — svc and maint of ICT eqpt', qty: 1, unitPrice: 203400, amountRequested: 203400, user: 'IT Dir', source: 'priority' }
    ].map((line) => ({
        ...line,
        glName: (typeof GL_ACCOUNTS !== 'undefined' && GL_ACCOUNTS[line.gl]?.name) || line.gl,
        remarks: ''
    }));
}

function seedSeptember2026Requisitions() {
    const ym = '2026-09';
    const list = typeof ensureRequisitions === 'function' ? ensureRequisitions() : [];
    const samples = [
        {
            id: 'req-sep2026-comd-printer',
            reqNo: 'IT/25-LM-01',
            receivedDate: '2026-08-19',
            itDirStampDate: '2026-08-19',
            targetMonth: ym,
            unit: 'Office of Commander ZNA',
            originRef: 'Comd/13',
            requestedBy: 'Comd ZNA',
            docType: 'loose_minute',
            subject: 'Heavy Duty HP LaserJet MFP 5800 colour printer + laptop for external course',
            itemDescription: 'HP LaserJet MFP 5800 colour printer; laptop for Maj M Jingabvura (course China Sep 2026–Jul 2027)',
            category: 'ict-equipment',
            qty: 2,
            unitPrice: 4200,
            estimatedCost: 8400,
            currency: 'USD',
            priority: 'urgent',
            status: 'received',
            fileRef: 'IT/34/1',
            notes: 'Separate USD loose minute — not in ZWG September priority total.',
            demoSeed: true
        },
        {
            id: 'req-sep2026-mid-toner',
            reqNo: 'MR/4/5',
            receivedDate: '2026-08-12',
            targetMonth: ym,
            unit: 'MID',
            originUnitDetail: 'Mapping and Research',
            requestedBy: 'Maj A Munyoro',
            subject: 'Various toner cartridges for MID printers',
            itemDescription: 'Mixed toner set for Ricoh and HP fleet',
            category: 'consumables-toners',
            qty: 24,
            unitPrice: 4780,
            estimatedCost: 114720,
            priority: 'normal',
            status: 'received',
            demoSeed: true
        },
        {
            id: 'req-sep2026-trg-laptops',
            reqNo: 'TRG/ICT/08',
            receivedDate: '2026-08-15',
            targetMonth: ym,
            unit: 'TRG BR',
            subject: 'Core i9 laptops for training wing',
            itemDescription: 'Laptop Core i9 for course delivery',
            category: 'ict-equipment',
            qty: 12,
            unitPrice: 39840,
            estimatedCost: 478080,
            priority: 'normal',
            status: 'in_progress',
            demoSeed: true
        }
    ];

    samples.forEach((sample) => {
        const idx = list.findIndex((r) => r.id === sample.id);
        const row = {
            minuteSheet: typeof createBlankMinuteSheet === 'function' ? createBlankMinuteSheet() : [],
            correspondenceFile: 'IT/34/1',
            actionInfo: 'Action: IT Dir · Info: GS Br, File',
            createdAt: `${sample.receivedDate}T08:00:00.000Z`,
            updatedAt: new Date().toISOString(),
            ...sample
        };
        if (idx >= 0) list[idx] = { ...list[idx], ...row };
        else list.push(row);
    });
}

function seedSeptember2026TargetPack() {
    const ym = '2026-09';
    const lines = september2026PriorityLines();
    const glTotals = sumLinesByGl(lines);
    const proposedTargets = {
        '2200600002': 21791800,
        '3112210001': 2724113,
        '220200002': 2561272,
        '2200600003': 322700,
        '2201900002': 876400
    };
    const totalRequested = 28174285;

    saveMonthlyTargetProposal({
        id: 'mtp-2026-09',
        month: ym,
        status: 'submitted',
        currency: 'ZWG',
        ref: 'IT/25',
        memoDate: '2026-08-19',
        subject: 'REQUEST FOR FUNDS FOR SEPTEMBER TARGET AS PRIORITY LIST',
        lines,
        glTotals,
        proposedTargets,
        totalRequested,
        compiledBy: 'Capt MANZEILA P (825052) · 19/08/26',
        approvedBy: '',
        notes: 'Enclosure: IT Dir priority list for September 2026 · Total ZWG 28,174,285.00',
        createdAt: '2026-08-19T10:00:00.000Z',
        memo: {
            recipient: 'See Distribution',
            ref: 'IT/25',
            memoDate: '2026-08-19',
            subject: 'REQUEST FOR FUNDS FOR SEPTEMBER TARGET AS PRIORITY LIST',
            distributionAction: 'GS Br',
            distributionInfo: 'DAF, File',
            signatoryName: 'W BARWA',
            signatoryPostnom: "psc' ZW",
            signatoryRank: 'Maj',
            signatoryTitle: 'for Dir',
            enclosure: 'IT Dir priority list for September 2026',
            closingLine: 'Forwarded for your action.'
        }
    }, ym);

    if (typeof ensureGlMonthlyTargets === 'function') ensureGlMonthlyTargets();
    appState.glTargetViewMonth = ym;
    Object.entries(proposedTargets).forEach(([gl, amount]) => {
        if (typeof setGlMonthlyTarget === 'function') setGlMonthlyTarget(gl, amount, ym);
    });
    if (typeof saveMonthDafMeta === 'function') {
        saveMonthDafMeta({
            source: 'DAF',
            ref: 'IT/25',
            receivedDate: '2026-08-19',
            notes: 'September 2026 target proposal — ZWG 28,174,285.00 (priority list enclosure)'
        }, ym);
    }

    const monthEl = document.getElementById('glTargetMonth');
    if (monthEl) monthEl.value = ym;
    if (typeof setSelectedGlTargetMonth === 'function') setSelectedGlTargetMonth(ym);

    seedSeptember2026Requisitions();
    buildMonthlyTargetProposalFromRequisitions(ym, { keepManualLines: true });
    if (typeof syncProposalMemoFormFields === 'function') syncProposalMemoFormFields();

    if (typeof saveState === 'function') saveState();
}

window.buildDafFundRequestMemoHtml = buildDafFundRequestMemoHtml;
window.buildDafFundRequestMemoReportData = buildDafFundRequestMemoReportData;
window.saveProposalMemoFields = saveProposalMemoFields;
window.syncProposalMemoFormFields = syncProposalMemoFormFields;
window.ensureMonthlyTargetProposals = ensureMonthlyTargetProposals;
window.getMonthlyTargetProposal = getMonthlyTargetProposal;
window.buildMonthlyTargetProposalFromRequisitions = buildMonthlyTargetProposalFromRequisitions;
window.applyProposalTargetsToMonth = applyProposalTargetsToMonth;
window.getProposalAmountForGl = getProposalAmountForGl;
window.getTargetProposalAlerts = getTargetProposalAlerts;
window.buildMonthlyTargetProposalReportData = buildMonthlyTargetProposalReportData;
window.initMonthlyTargetProposalControls = initMonthlyTargetProposalControls;
window.seedSeptember2026TargetPack = seedSeptember2026TargetPack;
window.requisitionsForTargetMonth = requisitionsForTargetMonth;
