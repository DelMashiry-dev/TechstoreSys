/* requisitions.js — Unit / Formation requisitions capture + aging */

const REQ_STATUSES = [
    { value: 'received', label: 'Received' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'part_issued', label: 'Part Issued' },
    { value: 'issued', label: 'Issued / Closed' },
    { value: 'cancelled', label: 'Cancelled' }
];

const REQ_PRIORITIES = [
    { value: 'normal', label: 'Normal' },
    { value: 'urgent', label: 'Urgent' }
];

const REQ_OPEN_STATUSES = new Set(['received', 'in_progress', 'part_issued']);

/** IT Dir Orderly Room stamp — APPT / SIGNATURE / DATE (as on physical minute stamp) */
const REQ_MINUTE_SHEET_APPTS = [
    'Dir',
    'DD',
    'Comdt',
    'AQSO2',
    'AO',
    'OC Sys Admin',
    'OC Engr',
    'OC SW Engr',
    'OC Sp Svc',
    'Tech Stores Offr',
    'RSM',
    'C/C'
];

const REQ_FILE_IT_34_1 = 'IT/34/1';
const REQ_FILE_IT_34_1_TITLE = 'COMPUTER EQUIPMENT AND MEDIA';

/** Map login roles → stamp APPT row they may sign */
const REQ_ROLE_TO_APPT = {
    director: 'Dir',
    deputy_director: 'DD',
    aqso2: 'AQSO2',
    techstores_officer: 'Tech Stores Offr',
    orderly_clerk: 'C/C',
    store_officer: 'Tech Stores Offr',
    rq: 'Tech Stores Offr'
};

function createBlankMinuteSheet() {
    return REQ_MINUTE_SHEET_APPTS.map((appt) => ({
        appt,
        signature: '',
        date: '',
        signedBy: '',
        signedAt: ''
    }));
}

function normalizeMinuteSheet(rows) {
    const byAppt = new Map((rows || []).map((r) => [r.appt, r]));
    return REQ_MINUTE_SHEET_APPTS.map((appt) => {
        const existing = byAppt.get(appt) || {};
        return {
            appt,
            signature: existing.signature || existing.initials || '',
            date: existing.date || '',
            signedBy: existing.signedBy || '',
            signedAt: existing.signedAt || ''
        };
    });
}

function reqEscape(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function ensureRequisitions() {
    if (!appState) return [];
    if (!Array.isArray(appState.requisitions)) {
        appState.requisitions = createDefaultRequisitions();
    }
    return appState.requisitions;
}

function todayIsoLocal() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function parseIsoDateOnly(value) {
    if (!value) return null;
    const d = new Date(`${value}T00:00:00`);
    if (Number.isNaN(d.getTime())) return null;
    d.setHours(0, 0, 0, 0);
    return d;
}

function getRequisitionAgeDays(req) {
    const start = parseIsoDateOnly(req.receivedDate || (req.createdAt || '').slice(0, 10));
    if (!start) return 0;
    const end = REQ_OPEN_STATUSES.has(req.status)
        ? new Date()
        : (parseIsoDateOnly(req.actionedDate) || new Date());
    end.setHours(0, 0, 0, 0);
    return Math.max(0, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
}

function getRequisitionAgeBucket(ageDays, status) {
    if (!REQ_OPEN_STATUSES.has(status)) {
        return { key: 'closed', label: 'Closed', className: 'req-age-closed' };
    }
    if (ageDays <= 1) return { key: 'new', label: 'New (0–1d)', className: 'req-age-new' };
    if (ageDays <= 3) return { key: 'attention', label: 'Attention (2–3d)', className: 'req-age-attention' };
    if (ageDays <= 7) return { key: 'aging', label: 'Aging (4–7d)', className: 'req-age-aging' };
    return { key: 'overdue', label: 'Overdue (8d+)', className: 'req-age-overdue' };
}

function formatReqDateIn(iso) {
    const d = parseIsoDateOnly(iso);
    if (!d) return '—';
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function getRequisitionStockSplit(req) {
    const qtyNeeded = Math.max(1, Number(req?.qty) || 1);
    const lookup = typeof lookupRequisitionStock === 'function' ? lookupRequisitionStock(req) : null;
    const known = !!(lookup && lookup.ok && lookup.name);
    const onHand = Number(lookup?.onHand) || 0;
    const inQty = known ? Math.min(onHand, qtyNeeded) : 0;
    const outQty = known ? Math.max(0, qtyNeeded - onHand) : qtyNeeded;
    return {
        qtyNeeded,
        onHand,
        inQty,
        outQty,
        known,
        sufficient: known && onHand >= qtyNeeded
    };
}

function getRequisitionAgeDisplay(req) {
    const age = getRequisitionAgeDays(req);
    const bucket = getRequisitionAgeBucket(age, req.status);
    if (req.status === 'issued') {
        return { age, bucket, text: `${age}d · satisfied`, title: 'Days from date in until issued / closed' };
    }
    if (req.status === 'cancelled') {
        return { age, bucket, text: `${age}d · cancelled`, title: 'Days from date in until cancelled' };
    }
    if (req.status === 'part_issued') {
        return { age, bucket, text: `${age}d · not fully satisfied`, title: 'Still in tray — remaining quantity not yet issued or bought' };
    }
    if (req.status === 'in_progress') {
        return { age, bucket, text: `${age}d · in tray`, title: 'Responded but not yet satisfied' };
    }
    return { age, bucket, text: `${age}d · in tray`, title: 'Days in in-tray — not yet responded to or satisfied' };
}

function reqStockInCell(split) {
    if (!split.known) {
        return '<span class="req-stock-unk" title="Item not matched on the inventory catalog">—</span>';
    }
    if (split.inQty <= 0) {
        return '<span class="req-stock-zero">0</span>';
    }
    const cls = split.sufficient ? 'req-stock-in is-full' : 'req-stock-in';
    return `<span class="${cls}" title="On hand ${split.onHand}">${split.inQty}</span><small class="req-stock-of"> / ${split.qtyNeeded}</small>`;
}

function reqStockOutCell(split) {
    if (!split.known) {
        return `<span class="req-stock-out" title="Not found in catalog — treat as shortfall">${split.outQty}</span>`;
    }
    if (split.outQty <= 0) {
        return '<span class="req-stock-ok">0</span>';
    }
    return `<span class="req-stock-out" title="Shortfall against quantity requested">${split.outQty}</span>`;
}

function getRequisitionCategoryOptions() {
    const fromCatalog = (typeof VOUCHER_INVENTORY_CATEGORIES !== 'undefined' ? VOUCHER_INVENTORY_CATEGORIES : [])
        .map((c) => ({ value: c.key, label: c.label }));
    if (fromCatalog.length) {
        return [...fromCatalog, { value: 'other', label: 'Other / Mixed' }];
    }
    return [
        { value: 'consumables-toners', label: 'Toners & Ink' },
        { value: 'consumables-media', label: 'Storage Media' },
        { value: 'spares-parts', label: 'Parts / Spares' },
        { value: 'ict-equipment', label: 'ICT Equipment' },
        { value: 'software-licences', label: 'Software' },
        { value: 'other', label: 'Other / Mixed' }
    ];
}

function getRequisitionCategoryLabel(value) {
    return getRequisitionCategoryOptions().find((c) => c.value === value)?.label || value || '—';
}

function getRequisitionStatusLabel(value) {
    return REQ_STATUSES.find((s) => s.value === value)?.label || value || '—';
}

function nextRequisitionNo() {
    const list = ensureRequisitions();
    const year = new Date().getFullYear();
    const prefix = `REQ-${year}-`;
    let max = 0;
    list.forEach((req) => {
        const m = String(req.reqNo || '').match(new RegExp(`^REQ-${year}-(\\d+)$`, 'i'));
        if (m) max = Math.max(max, parseInt(m[1], 10) || 0);
    });
    return `${prefix}${String(max + 1).padStart(4, '0')}`;
}

function getRequisitionAgingSummary() {
    const summary = { open: 0, new: 0, attention: 0, aging: 0, overdue: 0, urgent: 0, closed: 0 };
    ensureRequisitions().forEach((req) => {
        if (!REQ_OPEN_STATUSES.has(req.status)) {
            summary.closed += 1;
            return;
        }
        summary.open += 1;
        if (req.priority === 'urgent') summary.urgent += 1;
        const bucket = getRequisitionAgeBucket(getRequisitionAgeDays(req), req.status).key;
        if (summary[bucket] != null) summary[bucket] += 1;
    });
    return summary;
}

function getRequisitionAlerts(options = {}) {
    // Dashboard shows PENDING REQUISITIONS (STILL AT IT DIR) as a dedicated watch section
    if (options.skipWatchCovered) return [];

    const alerts = [];
    const open = ensureRequisitions()
        .filter((req) => REQ_OPEN_STATUSES.has(req.status))
        .map((req) => {
            const age = getRequisitionAgeDays(req);
            return { req, age, bucket: getRequisitionAgeBucket(age, req.status) };
        })
        .sort((a, b) => b.age - a.age || String(a.req.unit || '').localeCompare(String(b.req.unit || '')));

    const overdue = open.filter((row) => row.bucket.key === 'overdue');
    const aging = open.filter((row) => row.bucket.key === 'aging');
    const attention = open.filter((row) => row.bucket.key === 'attention');
    const urgent = open.filter((row) => row.req.priority === 'urgent');

    overdue.slice(0, 6).forEach(({ req, age }) => {
        alerts.push({
            type: 'danger',
            target: 'unit-requisitions',
            reqId: req.id,
            text: `Overdue requisition (${age}d): ${req.unit || 'Unit/Formation'} — ${req.itemDescription || getRequisitionCategoryLabel(req.category)} [${req.reqNo || 'no ref'}].`
        });
    });

    aging.slice(0, 4).forEach(({ req, age }) => {
        alerts.push({
            type: 'warning',
            target: 'unit-requisitions',
            reqId: req.id,
            text: `Aging requisition (${age}d): ${req.unit || 'Unit/Formation'} — ${req.itemDescription || getRequisitionCategoryLabel(req.category)}.`
        });
    });

    if (urgent.length) {
        alerts.push({
            type: 'warning',
            target: 'unit-requisitions',
            text: `${urgent.length} urgent unit/formation requisition(s) still open. Action via Unit Requisitions.`
        });
    } else if (attention.length && !overdue.length && !aging.length) {
        alerts.push({
            type: 'warning',
            target: 'unit-requisitions',
            text: `${attention.length} requisition(s) awaiting action for 2–3 days.`
        });
    }

    if (open.length && !overdue.length && !aging.length && !attention.length && !urgent.length) {
        alerts.push({
            type: 'info',
            target: 'unit-requisitions',
            text: `${open.length} open unit/formation requisition(s) received — review and issue from Unit Requisitions.`
        });
    }

    open.filter(({ req }) => req.fulfillmentPath === 'manual_daf' || req.fulfillmentPath === 'await_replenishment').slice(0, 4).forEach(({ req }) => {
        alerts.push({
            type: 'warning',
            target: 'unit-requisitions',
            reqId: req.id,
            text: `Awaiting DAF / target: ${req.unit || 'Unit'} — ${req.itemDescription || req.subject} (${req.fulfillmentLabel || 'needs funding'}).`
        });
    });

    const ym = typeof getSelectedGlTargetMonth === 'function' ? getSelectedGlTargetMonth() : '';
    open.filter(({ req }) => (req.targetMonth || String(req.receivedDate || '').slice(0, 7)) === ym).slice(0, 3).forEach(({ req }) => {
        const proposal = typeof getMonthlyTargetProposal === 'function' ? getMonthlyTargetProposal(ym) : null;
        const linked = proposal?.lines?.some((l) => l.requisitionId === req.id);
        if (!linked) {
            alerts.push({
                type: 'info',
                target: 'unit-requisitions',
                reqId: req.id,
                text: `${req.reqNo || 'REQ'} for ${typeof formatYmLabel === 'function' ? formatYmLabel(ym) : ym} — add to monthly target proposal (Build from requisitions).`
            });
        }
    });

    return alerts;
}

function clearRequisitionForm() {
    const set = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.value = value;
    };
    set('reqEditId', '');
    set('reqReceivedDate', todayIsoLocal());
    set('reqNo', nextRequisitionNo());
    if (typeof fillZnaUnitSelect === 'function') {
        fillZnaUnitSelect(document.getElementById('reqUnit'), '', { includeBlank: true, includeOther: true });
        const uf = document.getElementById('reqUnitFilter');
        if (uf) uf.value = '';
    } else {
        set('reqUnit', '');
    }
    set('reqRequestedBy', '');
    set('reqContact', '');
    set('reqFileRef', '');
    set('reqDocType', 'loose_minute');
    set('reqActionInfo', 'Action: IT Dir · Info: File');
    set('reqSubject', '');
    set('reqJustification', '');
    set('reqCategory', getRequisitionCategoryOptions()[0]?.value || 'other');
    set('reqItem', '');
    set('reqQty', '1');
    set('reqUnitPrice', '');
    set('reqEstimatedCost', '');
    set('reqTargetMonth', typeof getSelectedGlTargetMonth === 'function' ? getSelectedGlTargetMonth() : '');
    set('reqPriority', 'normal');
    set('reqStatus', 'received');
    set('reqNotes', '');
    set('reqActionedDate', '');
    set('reqOriginRef', '');
    set('reqOriginUnitDetail', '');
    set('reqItDirStampDate', todayIsoLocal());
    renderRequisitionMinuteSheet(createBlankMinuteSheet());
    const title = document.getElementById('reqFormTitle');
    if (title) title.textContent = 'Book in a requisition';
    const saveBtn = document.getElementById('reqSaveBtn');
    if (saveBtn) saveBtn.textContent = 'Save Requisition';
}

function fillRequisitionForm(req) {
    const set = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.value = value ?? '';
    };
    set('reqEditId', req.id);
    set('reqReceivedDate', req.receivedDate || todayIsoLocal());
    set('reqNo', req.reqNo || '');
    if (typeof fillZnaUnitSelect === 'function') {
        fillZnaUnitSelect(document.getElementById('reqUnit'), req.unit || '', { includeBlank: true, includeOther: true });
        const uf = document.getElementById('reqUnitFilter');
        if (uf) uf.value = '';
    } else {
        set('reqUnit', req.unit || '');
    }
    set('reqRequestedBy', req.requestedBy || '');
    set('reqContact', req.contact || '');
    set('reqFileRef', req.fileRef || '');
    set('reqDocType', req.docType || 'loose_minute');
    set('reqActionInfo', req.actionInfo || 'Action: IT Dir · Info: File');
    set('reqSubject', req.subject || '');
    set('reqJustification', req.justification || '');
    set('reqCategory', req.category || 'other');
    set('reqItem', req.itemDescription || '');
    set('reqQty', req.qty != null ? String(req.qty) : '1');
    set('reqUnitPrice', req.unitPrice != null ? String(req.unitPrice) : '');
    set('reqEstimatedCost', req.estimatedCost != null ? String(req.estimatedCost) : '');
    set('reqTargetMonth', req.targetMonth || (typeof getSelectedGlTargetMonth === 'function' ? getSelectedGlTargetMonth() : ''));
    set('reqPriority', req.priority || 'normal');
    set('reqStatus', req.status || 'received');
    set('reqNotes', req.notes || '');
    set('reqActionedDate', req.actionedDate || '');
    set('reqOriginRef', req.originRef || '');
    set('reqOriginUnitDetail', req.originUnitDetail || '');
    set('reqItDirStampDate', req.itDirStampDate || req.receivedDate || todayIsoLocal());
    if (!req.fileRef) set('reqFileRef', '');
    renderRequisitionMinuteSheet(normalizeMinuteSheet(req.minuteSheet));
    const title = document.getElementById('reqFormTitle');
    if (title) title.textContent = `Edit ${req.reqNo || 'Requisition'}`;
    const saveBtn = document.getElementById('reqSaveBtn');
    if (saveBtn) saveBtn.textContent = 'Update Requisition';
}

function readRequisitionMinuteSheet() {
    const tbody = document.getElementById('reqMinuteSheetBody');
    if (!tbody) return createBlankMinuteSheet();
    return [...tbody.querySelectorAll('tr[data-appt]')].map((tr) => ({
        appt: tr.getAttribute('data-appt') || '',
        signature: (tr.querySelector('.req-ms-sig')?.value || '').trim(),
        date: tr.querySelector('.req-ms-date')?.value || '',
        signedBy: tr.getAttribute('data-signed-by') || '',
        signedAt: tr.getAttribute('data-signed-at') || ''
    }));
}

function renderRequisitionMinuteSheet(rows) {
    const tbody = document.getElementById('reqMinuteSheetBody');
    if (!tbody) return;
    const list = normalizeMinuteSheet(rows);
    const myAppt = currentUser ? REQ_ROLE_TO_APPT[currentUser.role] : '';
    tbody.innerHTML = list.map((row) => {
        const mine = myAppt && row.appt === myAppt;
        const filled = !!(row.signature || row.date);
        return `
            <tr data-appt="${reqEscape(row.appt)}" data-signed-by="${reqEscape(row.signedBy || '')}" data-signed-at="${reqEscape(row.signedAt || '')}" class="${filled ? 'req-ms-filled' : ''}${mine ? ' req-ms-mine' : ''}">
                <td class="req-ms-appt"><strong>${reqEscape(row.appt)}</strong></td>
                <td><input type="text" class="form-control req-ms-sig" value="${reqEscape(row.signature)}" maxlength="40" placeholder="Initials / sig" aria-label="Signature ${reqEscape(row.appt)}"></td>
                <td><input type="date" class="form-control req-ms-date" value="${reqEscape(row.date)}" aria-label="Date ${reqEscape(row.appt)}"></td>
                <td class="req-ms-action">
                    ${mine || currentUser?.role === 'admin' ? `<button type="button" class="btn btn-ghost btn-sm req-ms-sign-btn" data-ms-appt="${reqEscape(row.appt)}" title="Sign as ${reqEscape(row.appt)}">Sign</button>` : '—'}
                </td>
            </tr>
        `;
    }).join('');
}

function signRequisitionMinuteAppt(appt) {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;
    const allowed = currentUser?.role === 'admin' || REQ_ROLE_TO_APPT[currentUser?.role] === appt;
    if (!allowed) {
        showToast('You can only sign your own appointment row.', 'error');
        return;
    }
    const tbody = document.getElementById('reqMinuteSheetBody');
    const tr = [...(tbody?.querySelectorAll('tr[data-appt]') || [])]
        .find((el) => el.getAttribute('data-appt') === appt);
    if (!tr) return;
    const initials = (currentUser?.name || currentUser?.username || 'SD')
        .split(/\s+/)
        .map((p) => p[0])
        .join('')
        .toUpperCase()
        .slice(0, 4);
    const sigEl = tr.querySelector('.req-ms-sig');
    const dateEl = tr.querySelector('.req-ms-date');
    if (sigEl && !sigEl.value.trim()) sigEl.value = initials;
    if (dateEl) dateEl.value = todayIsoLocal();
    tr.setAttribute('data-signed-by', currentUser?.username || '');
    tr.setAttribute('data-signed-at', new Date().toISOString());
    tr.classList.add('req-ms-filled');
    showToast(`Signed as ${appt}.`, 'success');
}

function readRequisitionForm() {
    return {
        id: document.getElementById('reqEditId')?.value || '',
        receivedDate: document.getElementById('reqReceivedDate')?.value || todayIsoLocal(),
        itDirStampDate: document.getElementById('reqItDirStampDate')?.value || '',
        reqNo: (document.getElementById('reqNo')?.value || '').trim(),
        unit: (document.getElementById('reqUnit')?.value || '').trim(),
        originUnitDetail: (document.getElementById('reqOriginUnitDetail')?.value || '').trim(),
        originRef: (document.getElementById('reqOriginRef')?.value || '').trim(),
        requestedBy: (document.getElementById('reqRequestedBy')?.value || '').trim(),
        contact: (document.getElementById('reqContact')?.value || '').trim(),
        fileRef: (document.getElementById('reqFileRef')?.value || '').trim(),
        correspondenceFile: REQ_FILE_IT_34_1,
        docType: document.getElementById('reqDocType')?.value || 'loose_minute',
        actionInfo: (document.getElementById('reqActionInfo')?.value || '').trim(),
        subject: (document.getElementById('reqSubject')?.value || '').trim(),
        justification: (document.getElementById('reqJustification')?.value || '').trim(),
        category: document.getElementById('reqCategory')?.value || 'other',
        itemDescription: (document.getElementById('reqItem')?.value || '').trim(),
        qty: parseFloat(document.getElementById('reqQty')?.value) || 0,
        unitPrice: parseFloat(document.getElementById('reqUnitPrice')?.value) || 0,
        estimatedCost: parseFloat(document.getElementById('reqEstimatedCost')?.value) || 0,
        targetMonth: document.getElementById('reqTargetMonth')?.value || '',
        priority: document.getElementById('reqPriority')?.value || 'normal',
        status: document.getElementById('reqStatus')?.value || 'received',
        notes: (document.getElementById('reqNotes')?.value || '').trim(),
        actionedDate: document.getElementById('reqActionedDate')?.value || '',
        minuteSheet: readRequisitionMinuteSheet()
    };
}

function saveRequisitionFromForm() {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;

    const data = readRequisitionForm();
    if (!data.itemDescription && data.subject) data.itemDescription = data.subject;
    if (!data.subject && data.itemDescription) data.subject = data.itemDescription;

    if (!data.unit) {
        showToast('Enter the unit / formation requesting.', 'error');
        document.getElementById('reqUnit')?.focus();
        return;
    }
    if (!data.itemDescription) {
        showToast('Enter the item(s) requisitioned (or subject).', 'error');
        document.getElementById('reqItem')?.focus();
        return;
    }
    if (!data.qty || data.qty < 1) {
        showToast('Quantity must be at least 1.', 'error');
        document.getElementById('reqQty')?.focus();
        return;
    }
    if (!data.estimatedCost && data.unitPrice && data.qty) {
        data.estimatedCost = data.unitPrice * data.qty;
    }
    if (!data.targetMonth) {
        data.targetMonth = typeof getSelectedGlTargetMonth === 'function' ? getSelectedGlTargetMonth() : String(data.receivedDate || '').slice(0, 7);
    }

    const list = ensureRequisitions();
    const now = new Date().toISOString();
    const closed = !REQ_OPEN_STATUSES.has(data.status);
    if (closed && !data.actionedDate) data.actionedDate = todayIsoLocal();
    if (!closed) data.actionedDate = data.actionedDate || '';

    let savedReq = null;
    let becameIssued = false;

    if (data.id) {
        const idx = list.findIndex((r) => r.id === data.id);
        if (idx < 0) {
            showToast('Requisition not found.', 'error');
            return;
        }
        const prevStatus = list[idx].status;
        list[idx] = {
            ...list[idx],
            ...data,
            updatedAt: now
        };
        savedReq = list[idx];
        becameIssued = (data.status === 'issued' || data.status === 'part_issued')
            && prevStatus !== data.status;
        showToast(`Updated ${list[idx].reqNo || 'requisition'}.`);
    } else {
        const record = {
            ...data,
            id: `req-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            reqNo: data.reqNo || nextRequisitionNo(),
            createdAt: now,
            updatedAt: now
        };
        list.unshift(record);
        savedReq = record;
        becameIssued = data.status === 'issued' || data.status === 'part_issued';
        showToast(`Captured ${record.reqNo}.`);
    }

    if (typeof saveState === 'function') saveState();
    clearRequisitionForm();
    renderRequisitionsModule();
    if (typeof updateSystemAlerts === 'function') updateSystemAlerts();
    if (typeof updateDashboard === 'function') updateDashboard();

    if (becameIssued && savedReq && typeof postRequisitionIssueToStock === 'function') {
        postRequisitionIssueToStock(savedReq);
    } else if (savedReq && typeof autoRouteRequisitionAfterSave === 'function') {
        autoRouteRequisitionAfterSave(savedReq);
        if (typeof saveState === 'function') saveState();
        renderRequisitionsModule();
    }
}

function editRequisition(id) {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;
    const req = ensureRequisitions().find((r) => r.id === id);
    if (!req) {
        showToast('Requisition not found.', 'error');
        return;
    }
    fillRequisitionForm(req);
    document.getElementById('reqCapturePanel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    document.getElementById('reqUnit')?.focus();
}

function setRequisitionStatus(id, status) {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;
    const list = ensureRequisitions();
    const req = list.find((r) => r.id === id);
    if (!req) return;
    req.status = status;
    req.updatedAt = new Date().toISOString();
    if (!REQ_OPEN_STATUSES.has(status)) {
        req.actionedDate = req.actionedDate || todayIsoLocal();
    }
    if (typeof saveState === 'function') saveState();
    renderRequisitionsModule();
    if (typeof updateSystemAlerts === 'function') updateSystemAlerts();
    if (typeof updateDashboard === 'function') updateDashboard();
    showToast(`${req.reqNo || 'Requisition'} marked ${getRequisitionStatusLabel(status)}.`);

    if ((status === 'issued' || status === 'part_issued') && typeof postRequisitionIssueToStock === 'function') {
        postRequisitionIssueToStock(req);
    }
}

function deleteRequisition(id) {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;
    const list = ensureRequisitions();
    const req = list.find((r) => r.id === id);
    if (!req) return;
    if (!window.confirm(`Delete requisition ${req.reqNo || ''} from ${req.unit || 'unit'}?`)) return;
    appState.requisitions = list.filter((r) => r.id !== id);
    if (typeof saveState === 'function') saveState();
    if (document.getElementById('reqEditId')?.value === id) clearRequisitionForm();
    renderRequisitionsModule();
    if (typeof updateSystemAlerts === 'function') updateSystemAlerts();
    if (typeof updateDashboard === 'function') updateDashboard();
    showToast('Requisition deleted.');
}

function getRequisitionFilterState() {
    return {
        q: (document.getElementById('reqTableSearch')?.value || '').trim().toLowerCase(),
        status: document.getElementById('reqFilterStatus')?.value || 'open',
        age: document.getElementById('reqFilterAge')?.value || 'all',
        stock: document.getElementById('reqFilterStock')?.value || 'all'
    };
}

function requisitionMatchesFilters(req, filters) {
    const age = getRequisitionAgeDays(req);
    const bucket = getRequisitionAgeBucket(age, req.status).key;
    const open = REQ_OPEN_STATUSES.has(req.status);

    if (filters.status === 'open' && !open) return false;
    if (filters.status === 'closed' && open) return false;
    if (filters.status !== 'all' && filters.status !== 'open' && filters.status !== 'closed' && req.status !== filters.status) {
        return false;
    }
    if (filters.age !== 'all' && bucket !== filters.age) return false;

    if (filters.stock === 'in' || filters.stock === 'out') {
        const split = getRequisitionStockSplit(req);
        if (filters.stock === 'in' && !split.sufficient) return false;
        if (filters.stock === 'out' && split.outQty <= 0) return false;
    }

    if (!filters.q) return true;
    const hay = [
        req.reqNo, req.unit, req.requestedBy, req.contact, req.itemDescription,
        req.subject, req.fileRef, req.justification, req.actionInfo,
        getRequisitionCategoryLabel(req.category), getRequisitionStatusLabel(req.status), req.notes
    ].join(' ').toLowerCase();
    return hay.includes(filters.q);
}

function renderRequisitionAgingStrip() {
    const summary = getRequisitionAgingSummary();
    const set = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = String(value);
    };
    set('reqStatOpen', summary.open);
    set('reqStatNew', summary.new);
    set('reqStatAttention', summary.attention);
    set('reqStatAging', summary.aging);
    set('reqStatOverdue', summary.overdue);
    set('reqStatUrgent', summary.urgent);
}

function getRequisitionItemCell(req) {
    const item = String(req.itemDescription || '').trim();
    const subject = String(req.subject || '').trim();
    const fileRef = String(req.fileRef || '').trim();
    const reqNo = String(req.reqNo || '').trim();
    const primary = item || subject || '—';
    const same = (a, b) => a && b && a.toLowerCase() === b.toLowerCase();
    // Avoid repeating subject/item/ref when Orderly Room (or form) filled them with the same text
    const secondary = subject && !same(subject, primary) ? subject : '';
    const refLine = fileRef && !same(fileRef, reqNo) && !same(fileRef, primary) ? fileRef : '';
    return { primary, secondary, refLine };
}

function renderRequisitionsTable() {
    const tbody = document.getElementById('requisitions-table-body');
    if (!tbody) return;

    const filters = getRequisitionFilterState();
    const rows = ensureRequisitions()
        .filter((req) => requisitionMatchesFilters(req, filters))
        .sort((a, b) => {
            const aOpen = REQ_OPEN_STATUSES.has(a.status) ? 1 : 0;
            const bOpen = REQ_OPEN_STATUSES.has(b.status) ? 1 : 0;
            if (aOpen !== bOpen) return bOpen - aOpen;
            const da = String(a.receivedDate || a.createdAt || '');
            const db = String(b.receivedDate || b.createdAt || '');
            if (db !== da) return db.localeCompare(da);
            return getRequisitionAgeDays(b) - getRequisitionAgeDays(a);
        });

    if (!rows.length) {
        tbody.innerHTML = '<tr><td colspan="7" class="req-empty-row">No requisitions in this view. Book one in below, or widen the filters.</td></tr>';
        if (typeof refreshTableFocusViewIfOpen === 'function') refreshTableFocusViewIfOpen();
        return;
    }

    tbody.innerHTML = rows.map((req) => {
        const ageView = getRequisitionAgeDisplay(req);
        const split = getRequisitionStockSplit(req);
        const canEdit = typeof canEditData === 'function' ? canEditData() : true;
        const item = getRequisitionItemCell(req);
        const unitLabel = (typeof resolveZnaUnitLabel === 'function' ? resolveZnaUnitLabel(req.unit) : req.unit) || '—';
        const open = REQ_OPEN_STATUSES.has(req.status);
        const qty = Math.max(1, Number(req.qty) || 1);
        return `
            <tr class="${ageView.bucket.className}" data-req-id="${reqEscape(req.id)}">
                <td class="req-cell-date">
                    <strong>${reqEscape(formatReqDateIn(req.receivedDate))}</strong>
                    <div class="req-item-meta">${reqEscape(req.reqNo || '—')}</div>
                </td>
                <td class="req-cell-unit" title="${reqEscape(unitLabel)}">${reqEscape(unitLabel)}</td>
                <td class="req-cell-item">
                    <div class="req-item-primary">${reqEscape(item.primary)}</div>
                    <div class="req-item-meta">Qty ${reqEscape(qty)}${req.priority === 'urgent' ? ' · URGENT' : ''}</div>
                    ${item.secondary ? `<div class="req-item-meta">${reqEscape(item.secondary)}</div>` : ''}
                    ${typeof fulfillmentBadgeHtml === 'function' ? fulfillmentBadgeHtml(req) : ''}
                </td>
                <td class="req-cell-stock">${reqStockInCell(split)}</td>
                <td class="req-cell-stock">${reqStockOutCell(split)}</td>
                <td>
                    <span class="req-age-badge ${ageView.bucket.className}" title="${reqEscape(ageView.title)}">${reqEscape(ageView.text)}</span>
                    <div class="req-item-meta">${reqEscape(getRequisitionStatusLabel(req.status))}</div>
                </td>
                <td class="req-actions-cell">
                    ${canEdit ? `
                        <div class="req-action-bar" role="group" aria-label="Requisition actions">
                            <button type="button" class="btn btn-primary btn-sm" data-req-action="route" data-req-id="${reqEscape(req.id)}" title="Stock check → Q 1033 or DP F1">Route</button>
                            <button type="button" class="btn btn-ghost btn-sm" data-req-action="edit" data-req-id="${reqEscape(req.id)}" title="Edit">Edit</button>
                            ${open ? `
                                <button type="button" class="btn btn-ghost btn-sm" data-req-action="progress" data-req-id="${reqEscape(req.id)}" title="Mark in progress">Progress</button>
                                <button type="button" class="btn btn-success btn-sm" data-req-action="issue" data-req-id="${reqEscape(req.id)}" title="Issue / close">Close</button>
                            ` : ''}
                            <button type="button" class="btn btn-ghost btn-sm req-btn-del" data-req-action="delete" data-req-id="${reqEscape(req.id)}" title="Delete">Del</button>
                        </div>
                    ` : '—'}
                </td>
            </tr>
        `;
    }).join('');
    if (typeof refreshTableFocusViewIfOpen === 'function') refreshTableFocusViewIfOpen();
}

function renderRequisitionsModule() {
    populateRequisitionSelects();
    renderRequisitionAgingStrip();
    renderRequisitionsTable();
}

function populateRequisitionSelects() {
    const catEl = document.getElementById('reqCategory');
    if (catEl && !catEl.dataset.ready) {
        catEl.innerHTML = getRequisitionCategoryOptions()
            .map((c) => `<option value="${reqEscape(c.value)}">${reqEscape(c.label)}</option>`)
            .join('');
        catEl.dataset.ready = '1';
    }

    const statusEl = document.getElementById('reqStatus');
    if (statusEl && !statusEl.dataset.ready) {
        statusEl.innerHTML = REQ_STATUSES
            .map((s) => `<option value="${reqEscape(s.value)}">${reqEscape(s.label)}</option>`)
            .join('');
        statusEl.dataset.ready = '1';
    }

    const priorityEl = document.getElementById('reqPriority');
    if (priorityEl && !priorityEl.dataset.ready) {
        priorityEl.innerHTML = REQ_PRIORITIES
            .map((p) => `<option value="${reqEscape(p.value)}">${reqEscape(p.label)}</option>`)
            .join('');
        priorityEl.dataset.ready = '1';
    }
}

function handleRequisitionActionClick(e) {
    const btn = e.target.closest('[data-req-action]');
    if (!btn) return;
    const id = btn.dataset.reqId;
    const action = btn.dataset.reqAction;
    const fromOverlay = !!btn.closest('#tableFocusModal');
    if (action === 'edit' || action === 'route') {
        if (fromOverlay && typeof closeTableFocusView === 'function') closeTableFocusView();
        if (fromOverlay && typeof restoreModuleMaximize === 'function') restoreModuleMaximize();
    }
    if (action === 'route') {
        if (typeof routeRequisitionProcurement === 'function') routeRequisitionProcurement(id, { navigate: true });
        return;
    }
    if (action === 'edit') editRequisition(id);
    if (action === 'progress') setRequisitionStatus(id, 'in_progress');
    if (action === 'issue') setRequisitionStatus(id, 'issued');
    if (action === 'delete') deleteRequisition(id);
}

function initRequisitionsModule() {
    const moduleEl = document.getElementById('unit-requisitions');
    if (!moduleEl || moduleEl.dataset.reqInit === '1') return;
    moduleEl.dataset.reqInit = '1';

    populateRequisitionSelects();
    if (typeof wireZnaUnitPicker === 'function') {
        wireZnaUnitPicker(
            document.getElementById('reqUnit'),
            document.getElementById('reqUnitFilter'),
            { includeBlank: true, includeOther: true }
        );
    }
    clearRequisitionForm();

    document.getElementById('reqSaveBtn')?.addEventListener('click', saveRequisitionFromForm);
    document.getElementById('reqClearBtn')?.addEventListener('click', () => {
        if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;
        clearRequisitionForm();
    });
    document.getElementById('reqFileIt341Btn')?.addEventListener('click', () => {
        const el = document.getElementById('reqFileRef');
        if (el) el.value = REQ_FILE_IT_34_1;
        showToast(`Filed under ${REQ_FILE_IT_34_1} — ${REQ_FILE_IT_34_1_TITLE}`, 'info');
    });

    document.getElementById('reqMinuteSheetBody')?.closest('#reqMinuteStamp')?.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-ms-appt]');
        if (!btn) return;
        e.preventDefault();
        signRequisitionMinuteAppt(btn.getAttribute('data-ms-appt'));
    });

    // Keep Subject → Item(s) aligned so the table stays uniform (one description line)
    document.getElementById('reqSubject')?.addEventListener('blur', () => {
        const subject = (document.getElementById('reqSubject')?.value || '').trim();
        const itemEl = document.getElementById('reqItem');
        if (!itemEl || !subject) return;
        if (!String(itemEl.value || '').trim()) itemEl.value = subject;
    });
    document.getElementById('reqItem')?.addEventListener('blur', () => {
        const item = (document.getElementById('reqItem')?.value || '').trim();
        const subjectEl = document.getElementById('reqSubject');
        if (!subjectEl || !item) return;
        if (!String(subjectEl.value || '').trim()) subjectEl.value = item;
    });

    const syncReqEstimatedCost = () => {
        const qty = parseFloat(document.getElementById('reqQty')?.value) || 0;
        const unit = parseFloat(document.getElementById('reqUnitPrice')?.value) || 0;
        const estEl = document.getElementById('reqEstimatedCost');
        if (estEl && qty > 0 && unit > 0) estEl.value = String(qty * unit);
    };
    ['reqQty', 'reqUnitPrice'].forEach((id) => {
        document.getElementById(id)?.addEventListener('input', syncReqEstimatedCost);
    });

    document.getElementById('reqFilterStatus')?.addEventListener('change', renderRequisitionsTable);
    document.getElementById('reqFilterAge')?.addEventListener('change', renderRequisitionsTable);
    document.getElementById('reqFilterStock')?.addEventListener('change', renderRequisitionsTable);
    document.getElementById('reqTableSearch')?.addEventListener('input', renderRequisitionsTable);
    document.getElementById('reqTableSearch')?.addEventListener('search-history-commit', renderRequisitionsTable);
    moduleEl.querySelector('.btn-table-search')?.addEventListener('click', renderRequisitionsTable);
    moduleEl.querySelector('.btn-table-search-clear')?.addEventListener('click', () => {
        setTimeout(renderRequisitionsTable, 0);
    });

    document.getElementById('requisitions-table-body')?.addEventListener('click', handleRequisitionActionClick);
    if (!document.body.dataset.reqActionBound) {
        document.body.dataset.reqActionBound = '1';
        document.addEventListener('click', (e) => {
            if (e.target.closest('#requisitions-table-body')) return;
            if (!e.target.closest('#tableFocusBody [data-req-action], .table-focus-table-wrap [data-req-action]')) return;
            handleRequisitionActionClick(e);
        });
    }

    if (typeof bindSearchHistory === 'function') {
        const searchEl = document.getElementById('reqTableSearch');
        if (searchEl) bindSearchHistory(searchEl);
    }

    renderRequisitionsModule();
}

/**
 * Example: Mapping and Research (MID) letter MR/4/5 — laptops for drone FTX.
 * Filed under IT/34/1 COMPUTER EQUIPMENT AND MEDIA with IT Dir minute stamp.
 */
function ensureExampleMidLaptopRequisition() {
    if (!appState) return null;
    const list = ensureRequisitions();
    const EXAMPLE_ID = 'req-example-mid-mr-4-5';
    if (list.some((r) => r.id === EXAMPLE_ID || r.originRef === 'MR/4/5')) return null;

    const sheet = createBlankMinuteSheet().map((row) => {
        if (row.appt === 'C/C') return { ...row, signature: 'ATC', date: '2026-07-29', signedBy: 'orderly', signedAt: '2026-07-29T10:00:00.000Z' };
        if (row.appt === 'DD') return { ...row, signature: 'SDm', date: '2026-07-30', signedBy: 'dd', signedAt: '2026-07-30T09:00:00.000Z' };
        if (row.appt === 'AQSO2') return { ...row, signature: 'AQ', date: '2026-07-30', signedBy: 'aqso2', signedAt: '2026-07-30T11:00:00.000Z' };
        if (row.appt === 'AO') return { ...row, signature: 'SD', date: '2026-07-31', signedBy: 'ao', signedAt: '2026-07-31T08:30:00.000Z' };
        return row;
    });

    const now = new Date().toISOString();
    const req = {
        id: EXAMPLE_ID,
        receivedDate: '2026-07-29',
        itDirStampDate: '2026-07-29',
        reqNo: 'MR/4/5',
        originRef: 'MR/4/5',
        unit: 'Mapping and Research',
        originUnitDetail: 'Mapping and Research Wing — MID (Zimbabwe Intelligence Corps)',
        requestedBy: "Lt Col T NYAHWEMA 'psc' ZW GEOINT (UZ) — CO",
        contact: 'Harare 2743439',
        fileRef: REQ_FILE_IT_34_1,
        correspondenceFile: REQ_FILE_IT_34_1,
        docType: 'requisition_letter',
        actionInfo: 'Action: IT Dir · Info: File IT/34/1',
        subject: 'REQUEST FOR THE PURCHASE OF LAPTOPS FOR DRONE TECHNOLOGY COURSE FIELD TRAINING EXERCISE',
        justification:
            'Mapping and Research is running a Drone Technology course (6 Jul – 14 Aug 2026). ' +
            'FTX 3–12 Aug 2026 at Mukumbura requires specified laptops for UAV employment. ' +
            'Unit requests 10 × Laptops (Intel Core i9, 32 GB RAM, 16 cores, 1 TB storage) for students during FTX. ' +
            'Letter dated 28 Jul 2026; IT Dir Orderly Room stamped 29 Jul 2026.',
        category: 'ict-equipment',
        itemDescription: '10 × Laptops — Intel Core i9, 32 GB RAM, 16 cores, 1 TB storage (Drone Technology FTX)',
        qty: 10,
        priority: 'urgent',
        status: 'received',
        notes: `RESTRICTED · Filed under ${REQ_FILE_IT_34_1} ${REQ_FILE_IT_34_1_TITLE}. Originating OR stamp Mapping and Research 28 Jul 2026.`,
        actionedDate: '',
        minuteSheet: sheet,
        createdAt: now,
        updatedAt: now,
        source: 'example-seed',
        exampleSeed: true
    };
    list.unshift(req);

    // Mirror in Orderly Room DF if available
    if (typeof ensureOrderlyDailyFile === 'function') {
        const df = ensureOrderlyDailyFile();
        const orId = 'or-example-mid-mr-4-5';
        if (!df.some((r) => r.id === orId)) {
            df.unshift({
                id: orId,
                dateIn: '2026-07-29',
                refNo: 'MR/4/5',
                fromUnit: 'Mapping and Research (MID)',
                docType: 'requisition',
                subject: req.subject,
                fileAs: 'first_sight',
                gsAuth: 'pending',
                priority: 'urgent',
                receivedBy: 'IT Dir Orderly Room',
                status: 'alerted_techstores',
                remarks: `Stamped IT Dir OR 29 Jul 2026. File ${REQ_FILE_IT_34_1} ${REQ_FILE_IT_34_1_TITLE}.`,
                alertTechStores: true,
                linkedReqId: EXAMPLE_ID,
                fileRef: REQ_FILE_IT_34_1,
                createdAt: now,
                updatedAt: now,
                createdBy: 'system'
            });
        }
    }

    if (typeof saveState === 'function') saveState();
    return req;
}

function buildUnitRequisitionsReportData() {
    const rows = ensureRequisitions()
        .filter((req) => REQ_OPEN_STATUSES.has(req.status))
        .sort((a, b) => {
            if (a.priority === 'urgent' && b.priority !== 'urgent') return -1;
            if (b.priority === 'urgent' && a.priority !== 'urgent') return 1;
            return getRequisitionAgeDays(b) - getRequisitionAgeDays(a);
        })
        .map((req) => {
            const split = typeof getRequisitionStockSplit === 'function' ? getRequisitionStockSplit(req) : null;
            const ageView = typeof getRequisitionAgeDisplay === 'function'
                ? getRequisitionAgeDisplay(req)
                : { text: `${getRequisitionAgeDays(req)}d` };
            return [
                req.receivedDate || '',
                req.unit || '',
                req.itemDescription || req.subject || '',
                split ? (split.known ? String(split.inQty) : '—') : (req.qty || ''),
                split ? String(split.outQty) : '',
                ageView.text,
                getRequisitionStatusLabel(req.status)
            ];
        });
    return {
        title: 'Requisitions — In-tray',
        summary: [
            `Listed: ${rows.length}`,
            'Date in, unit, items, in-stock / out-of-stock, and age (days in tray until satisfied).'
        ],
        fields: [],
        tables: [{
            tbodyId: 'unit-requisitions-priority',
            title: 'Requisitions in-tray',
            headers: ['Date in', 'Unit', 'Item(s) requested', 'In-stock', 'Out-of-stock', 'Age', 'Status'],
            rows
        }]
    };
}

window.buildUnitRequisitionsReportData = buildUnitRequisitionsReportData;
window.getRequisitionStockSplit = getRequisitionStockSplit;
window.getRequisitionAgeDisplay = getRequisitionAgeDisplay;
window.formatReqDateIn = formatReqDateIn;
window.ensureExampleMidLaptopRequisition = ensureExampleMidLaptopRequisition;
window.createBlankMinuteSheet = createBlankMinuteSheet;
window.REQ_MINUTE_SHEET_APPTS = REQ_MINUTE_SHEET_APPTS;
window.REQ_FILE_IT_34_1 = REQ_FILE_IT_34_1;

