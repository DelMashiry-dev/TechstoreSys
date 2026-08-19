/* orderly-room.js — Daily File / First Sight + TechStores requisition alerts */

const OR_DOC_TYPES = {
    requisition: 'Unit Requisition',
    routine: 'Routine',
    pass: 'Pass / movement',
    directive: 'Directive',
    other: 'Other'
};

const OR_FILE_AS = {
    df: 'Daily File (DF)',
    first_sight: 'First Sight'
};

const OR_GS_AUTH = {
    pending: 'Pending',
    yes: 'Yes — authorised',
    no: 'No / returned'
};

const OR_STATUSES = {
    filed: 'Filed in DF / First Sight',
    alerted_techstores: 'Referred — TechStores alerted',
    seen_hod: 'Seen by HoDs',
    actioned: 'Actioned / closed'
};

const OR_OPEN_FOR_TECHSTORES = new Set(['filed', 'alerted_techstores', 'seen_hod']);

function orNotifyDeptList() {
    if (typeof IT_DIR_DEPARTMENTS !== 'undefined' && Array.isArray(IT_DIR_DEPARTMENTS)) {
        return IT_DIR_DEPARTMENTS;
    }
    return [
        { key: 'techstores', value: 'IT DIR TECHSTORES OFFICE', label: 'TechStores Office' },
        { key: 'workshop', value: 'IT ENGINEERING SUPPORT DEPT (WORKSHOP)', label: 'Workshop (Engr Support)' }
    ];
}

function renderOrderlyNotifyGrid(selected) {
    const grid = document.getElementById('orNotifyGrid');
    if (!grid) return;
    if (typeof itDirNotifyCheckboxHtml === 'function') {
        grid.innerHTML = itDirNotifyCheckboxHtml(selected || []);
        return;
    }
    const selectedSet = new Set(selected || []);
    grid.innerHTML = orNotifyDeptList().map((d) => `
        <label class="or-notify-item">
            <input type="checkbox" class="or-notify-cb" value="${orEscape(d.value)}" data-or-notify-key="${orEscape(d.key)}"${selectedSet.has(d.value) ? ' checked' : ''}>
            <span>${orEscape(d.label)}</span>
        </label>
    `).join('');
}

function getSelectedOrderlyNotifyDepts() {
    return [...document.querySelectorAll('#orNotifyGrid .or-notify-cb:checked')]
        .map((cb) => cb.value)
        .filter(Boolean);
}

function setOrderlyNotifySelection(values) {
    const set = new Set(values || []);
    document.querySelectorAll('#orNotifyGrid .or-notify-cb').forEach((cb) => {
        cb.checked = set.has(cb.value);
    });
}

function defaultOrderlyNotifySelection(docType) {
    const list = orNotifyDeptList();
    if (docType === 'requisition') {
        return list.filter((d) => d.key === 'techstores').map((d) => d.value);
    }
    if (docType === 'directive') {
        return list
            .filter((d) => ['dir', 'dd', 'aqso2', 'techstores'].includes(d.key))
            .map((d) => d.value);
    }
    return [];
}

function readOrderlyComposeFields(entry) {
    const subjectEl = document.getElementById('orMsgSubject');
    const bodyEl = document.getElementById('orMsgBody');
    const priEl = document.getElementById('orMsgPriority');
    const dueEl = document.getElementById('orMsgDue');
    const subject = (subjectEl?.value || '').trim()
        || `OR DF: ${entry?.refNo || 'Letter'} — ${entry?.subject || 'For action / info'}`.slice(0, 160);
    const autoBody = [
        `Orderly Room notification (${entry?.fileAs === 'first_sight' ? 'First Sight' : 'Daily File'}).`,
        `From unit: ${entry?.fromUnit || '—'}`,
        `Ref: ${entry?.refNo || '—'}`,
        `Subject: ${entry?.subject || '—'}`,
        `Type: ${OR_DOC_TYPES[entry?.docType] || entry?.docType || '—'}`,
        `Priority: ${(entry?.priority || 'normal').toUpperCase()}`,
        `GS auth: ${OR_GS_AUTH[entry?.gsAuth] || entry?.gsAuth || '—'}`,
        entry?.remarks ? `Remarks: ${entry.remarks}` : '',
        'Please acknowledge under Notifications → Messages.'
    ].filter(Boolean).join('\n');
    return {
        subject,
        body: (bodyEl?.value || '').trim() || autoBody,
        priority: typeof normalizeMessagePriority === 'function'
            ? normalizeMessagePriority(priEl?.value || entry?.priority || 'immediate')
            : (priEl?.value || (entry?.priority === 'urgent' ? 'urgent' : 'immediate')),
        dueDate: dueEl?.value || '',
        messageDate: document.getElementById('orDateIn')?.value || ''
    };
}

/**
 * Post Messages-format notices (same as System Alerts → Compose) to selected IT Dir departments.
 */
function postOrderlyRoomNotices(entry, departments) {
    const depts = [...new Set((departments || []).filter(Boolean))];
    if (!depts.length || !entry) return 0;
    const composed = readOrderlyComposeFields(entry);
    if (typeof sendOfficeMessagesToDepartments === 'function') {
        return sendOfficeMessagesToDepartments({
            departments: depts,
            subject: composed.subject,
            body: composed.body,
            priority: composed.priority,
            messageDate: composed.messageDate,
            dueDate: composed.dueDate,
            toKind: 'it_dir_dept',
            source: 'orderly-room',
            meta: { orderlyId: entry.id || '' },
            force: true
        });
    }
    return 0;
}

function ensureOrderlyDailyFile() {
    if (!appState) return [];
    if (!Array.isArray(appState.orderlyDailyFile)) {
        appState.orderlyDailyFile = [];
    }
    return appState.orderlyDailyFile;
}

function orTodayIso() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function orEscape(v) {
    return String(v ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function getOrderlyOpenForTechStores() {
    return ensureOrderlyDailyFile()
        .filter((row) => {
            if (row.docType !== 'requisition' && !row.alertTechStores) return false;
            if (!OR_OPEN_FOR_TECHSTORES.has(row.status || 'filed')) return false;
            return true;
        })
        .sort((a, b) => {
            const pu = (b.priority === 'urgent' ? 1 : 0) - (a.priority === 'urgent' ? 1 : 0);
            if (pu) return pu;
            return String(b.dateIn || '').localeCompare(String(a.dateIn || ''));
        });
}

function getOrderlyRoomAlerts() {
    return getOrderlyOpenForTechStores().map((row) => {
        const urgent = row.priority === 'urgent';
        const gs = row.gsAuth === 'yes' ? 'GS authorised' : (row.gsAuth === 'pending' ? 'GS pending' : 'GS returned');
        return {
            type: urgent ? 'danger' : (row.gsAuth === 'yes' ? 'warning' : 'info'),
            target: 'orderly-room',
            orId: row.id,
            text: `Orderly Room DF: ${row.refNo || 'letter'} — ${row.fromUnit || 'Unit'} · ${row.subject || 'Requisition'} (${gs})`,
            receivedDate: row.dateIn || '',
            dueDate: '',
            priority: urgent ? 'high' : 'normal',
            department: row.gsAuth === 'yes' ? 'GS BRANCH' : 'IT DIR ORDERLY ROOM',
            redFlag: urgent
        };
    });
}

function clearOrderlyRoomForm() {
    const set = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.value = value;
    };
    set('orEditId', '');
    set('orDateIn', orTodayIso());
    set('orRefNo', '');
    set('orFrom', '');
    set('orDocType', 'requisition');
    set('orSubject', '');
    set('orFileAs', 'df');
    set('orGsAuth', 'pending');
    set('orPriority', 'normal');
    set('orReceivedBy', currentUser?.name || '');
    set('orStatus', 'filed');
    set('orRemarks', '');
    set('orMsgSubject', '');
    set('orMsgBody', '');
    set('orMsgPriority', 'immediate');
    set('orMsgDue', '');
    const docType = document.getElementById('orDocType')?.value || 'requisition';
    renderOrderlyNotifyGrid(defaultOrderlyNotifySelection(docType));
}

function fillOrderlyRoomForm(row) {
    const set = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.value = value ?? '';
    };
    set('orEditId', row.id);
    set('orDateIn', row.dateIn || orTodayIso());
    set('orRefNo', row.refNo || '');
    set('orFrom', row.fromUnit || '');
    set('orDocType', row.docType || 'requisition');
    set('orSubject', row.subject || '');
    set('orFileAs', row.fileAs || 'df');
    set('orGsAuth', row.gsAuth || 'pending');
    set('orPriority', row.priority || 'normal');
    set('orReceivedBy', row.receivedBy || '');
    set('orStatus', row.status || 'filed');
    set('orRemarks', row.remarks || '');
    const notify = Array.isArray(row.notifyDepts) && row.notifyDepts.length
        ? row.notifyDepts
        : defaultOrderlyNotifySelection(row.docType || 'requisition');
    renderOrderlyNotifyGrid(notify);
}

function readOrderlyRoomForm() {
    return {
        id: document.getElementById('orEditId')?.value || '',
        dateIn: document.getElementById('orDateIn')?.value || orTodayIso(),
        refNo: (document.getElementById('orRefNo')?.value || '').trim(),
        fromUnit: (document.getElementById('orFrom')?.value || '').trim(),
        docType: document.getElementById('orDocType')?.value || 'other',
        subject: (document.getElementById('orSubject')?.value || '').trim(),
        fileAs: document.getElementById('orFileAs')?.value || 'df',
        gsAuth: document.getElementById('orGsAuth')?.value || 'pending',
        priority: document.getElementById('orPriority')?.value || 'normal',
        receivedBy: (document.getElementById('orReceivedBy')?.value || '').trim(),
        status: document.getElementById('orStatus')?.value || 'filed',
        remarks: (document.getElementById('orRemarks')?.value || '').trim(),
        notifyDepts: getSelectedOrderlyNotifyDepts()
    };
}

function linkOrderlyToUnitRequisition(entry) {
    if (typeof ensureRequisitions !== 'function') return null;
    const list = ensureRequisitions();
    if (entry.linkedReqId) {
        const existing = list.find((r) => r.id === entry.linkedReqId);
        if (existing) return existing;
    }
    const byRef = list.find((r) =>
        (entry.refNo && r.reqNo === entry.refNo) ||
        (entry.refNo && r.fileRef === entry.refNo)
    );
    if (byRef) {
        entry.linkedReqId = byRef.id;
        return byRef;
    }
    const now = new Date().toISOString();
    const req = {
        id: `req-or-${Date.now()}`,
        receivedDate: entry.dateIn || orTodayIso(),
        itDirStampDate: entry.dateIn || orTodayIso(),
        reqNo: entry.refNo || `OR-${Date.now().toString().slice(-6)}`,
        unit: entry.fromUnit || '',
        originUnitDetail: entry.fromUnit || '',
        originRef: entry.refNo || '',
        requestedBy: '',
        contact: '',
        fileRef: entry.fileRef || (typeof REQ_FILE_IT_34_1 !== 'undefined' ? REQ_FILE_IT_34_1 : 'IT/34/1'),
        correspondenceFile: typeof REQ_FILE_IT_34_1 !== 'undefined' ? REQ_FILE_IT_34_1 : 'IT/34/1',
        docType: 'requisition_letter',
        actionInfo: entry.gsAuth === 'yes'
            ? 'Action: TechStores (GS Branch authorised) · Info: Orderly Room DF'
            : 'Action: TechStores · Info: Orderly Room DF / First Sight',
        subject: entry.subject || '',
        justification: entry.remarks || 'Filed in Orderly Room Daily File — awaiting TechStores action.',
        category: 'ict-equipment',
        itemDescription: entry.subject || 'Unit requisition (see letter)',
        qty: 1,
        priority: entry.priority || 'normal',
        status: 'received',
        notes: `Orderly Room DF (${entry.fileAs === 'first_sight' ? 'First Sight' : 'DF'}). Filed under IT/34/1 COMPUTER EQUIPMENT AND MEDIA when computer equipment.`,
        actionedDate: '',
        minuteSheet: typeof createBlankMinuteSheet === 'function' ? createBlankMinuteSheet() : [],
        createdAt: now,
        updatedAt: now,
        source: 'orderly-room',
        orderlyId: entry.id
    };
    list.unshift(req);
    entry.linkedReqId = req.id;
    return req;
}

/**
 * Send compose message only (no Daily File letter validation).
 * Uses Subject / Message / To checkboxes in the notify panel.
 */
function sendOrderlyRoomMessagesOnly() {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;

    const subject = (document.getElementById('orMsgSubject')?.value || '').trim();
    const body = (document.getElementById('orMsgBody')?.value || '').trim();
    const priority = typeof normalizeMessagePriority === 'function'
        ? normalizeMessagePriority(document.getElementById('orMsgPriority')?.value || 'immediate')
        : (document.getElementById('orMsgPriority')?.value || 'immediate');
    const dueDate = document.getElementById('orMsgDue')?.value || '';
    const messageDate = document.getElementById('orDateIn')?.value || '';
    let depts = getSelectedOrderlyNotifyDepts();

    if (!subject) {
        showToast('Enter a message subject.', 'error');
        document.getElementById('orMsgSubject')?.focus();
        return;
    }
    if (!body) {
        showToast('Enter the message text.', 'error');
        document.getElementById('orMsgBody')?.focus();
        return;
    }
    if (typeof assertMessageDates === 'function' && !assertMessageDates({ messageDate, dueDate })) {
        return;
    }
    if (!depts.length) {
        depts = defaultOrderlyNotifySelection('requisition');
        if (!depts.length) {
            const tech = orNotifyDeptList().find((d) => d.key === 'techstores')?.value;
            if (tech) depts = [tech];
        }
        setOrderlyNotifySelection(depts);
    }
    if (!depts.length) {
        showToast('Tick at least one department to send to.', 'error');
        return;
    }

    const entry = {
        id: document.getElementById('orEditId')?.value || `or-msg-${Date.now()}`,
        refNo: (document.getElementById('orRefNo')?.value || '').trim() || 'MSG',
        subject: (document.getElementById('orSubject')?.value || '').trim() || subject,
        fromUnit: (document.getElementById('orFrom')?.value || '').trim() || 'Orderly Room',
        docType: document.getElementById('orDocType')?.value || 'other',
        fileAs: document.getElementById('orFileAs')?.value || 'df',
        gsAuth: document.getElementById('orGsAuth')?.value || 'pending',
        priority: document.getElementById('orPriority')?.value || 'normal',
        remarks: (document.getElementById('orRemarks')?.value || '').trim()
    };

    // Prefer the compose panel text for the actual office message
    const subjectEl = document.getElementById('orMsgSubject');
    const bodyEl = document.getElementById('orMsgBody');
    if (subjectEl) subjectEl.value = subject;
    if (bodyEl) bodyEl.value = body;

    const notified = typeof sendOfficeMessagesToDepartments === 'function'
        ? sendOfficeMessagesToDepartments({
            departments: depts,
            subject,
            body,
            priority,
            messageDate,
            dueDate,
            toKind: 'it_dir_dept',
            source: 'orderly-room',
            meta: { orderlyId: entry.id, mode: 'message-only' },
            force: true
        })
        : postOrderlyRoomNotices(entry, depts);

    if (!notified) {
        showToast('Could not send message.', 'error');
        return;
    }

    if (typeof saveState === 'function') saveState();
    if (typeof refreshOfficeMessagesUi === 'function') refreshOfficeMessagesUi();
    if (typeof updateSystemAlerts === 'function') updateSystemAlerts();

    const short = depts.map((d) => d.replace(/^IT DIR\s+/i, '').replace(/\s*\(WORKSHOP\)/i, '')).slice(0, 3);
    const more = depts.length > 3 ? ` +${depts.length - 3} more` : '';
    showToast(`Sent ${notified} message(s) to ${short.join(', ')}${more}.`, 'success');
}

function saveOrderlyRoomEntry(options = {}) {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;

    const data = readOrderlyRoomForm();
    const msgSubject = (document.getElementById('orMsgSubject')?.value || '').trim();
    const msgBody = (document.getElementById('orMsgBody')?.value || '').trim();
    const doNotify = !!options.notifyDepartments;

    // Message-panel subject counts when filing/sending from this form
    if (!data.subject && msgSubject) data.subject = msgSubject;
    if (!data.remarks && msgBody) data.remarks = msgBody.slice(0, 400);
    if (doNotify && !data.fromUnit) {
        data.fromUnit = 'Orderly Room';
    }

    if (!data.refNo && !data.subject) {
        if (doNotify && msgSubject) {
            data.subject = msgSubject;
        } else {
            showToast(
                doNotify
                    ? 'Enter a message Subject (compose panel), or a letter reference / subject above.'
                    : 'Enter a letter reference or subject.',
                'error'
            );
            document.getElementById(doNotify ? 'orMsgSubject' : 'orRefNo')?.focus();
            return;
        }
    }
    if (!data.fromUnit) {
        showToast('Enter the originating unit / branch.', 'error');
        document.getElementById('orFrom')?.focus();
        return;
    }

    let notifyDepts = [...(data.notifyDepts || [])];

    if (doNotify && !notifyDepts.length) {
        notifyDepts = defaultOrderlyNotifySelection(data.docType);
        if (!notifyDepts.length) {
            notifyDepts = defaultOrderlyNotifySelection('requisition');
        }
        setOrderlyNotifySelection(notifyDepts);
        data.notifyDepts = notifyDepts;
    }

    const wantsTechStores = notifyDepts.some((d) => /TECHSTORES/i.test(d));
    const alertTechStores = !!options.alertTechStores
        || wantsTechStores
        || data.docType === 'requisition'
        || data.status === 'alerted_techstores';

    if (options.alertTechStores || (doNotify && wantsTechStores)) {
        data.status = 'alerted_techstores';
    }

    const list = ensureOrderlyDailyFile();
    const now = new Date().toISOString();
    let saved = null;

    if (data.id) {
        const idx = list.findIndex((r) => r.id === data.id);
        if (idx >= 0) {
            saved = {
                ...list[idx],
                ...data,
                notifyDepts,
                alertTechStores: alertTechStores || !!list[idx].alertTechStores,
                updatedAt: now,
                updatedBy: currentUser?.username || ''
            };
            list[idx] = saved;
        }
    }

    if (!saved) {
        saved = {
            ...data,
            id: `or-${Date.now()}`,
            notifyDepts,
            alertTechStores,
            linkedReqId: '',
            createdAt: now,
            updatedAt: now,
            createdBy: currentUser?.username || '',
            updatedBy: currentUser?.username || ''
        };
        list.unshift(saved);
    }

    if (alertTechStores && (saved.docType === 'requisition' || options.alertTechStores || wantsTechStores)) {
        linkOrderlyToUnitRequisition(saved);
        const idx = list.findIndex((r) => r.id === saved.id);
        if (idx >= 0) list[idx] = saved;
    }

    let notified = 0;
    if (doNotify && notifyDepts.length) {
        notified = postOrderlyRoomNotices(saved, notifyDepts);
        saved.lastNotifiedAt = now;
        saved.lastNotifiedDepts = notifyDepts.slice();
        const idx = list.findIndex((r) => r.id === saved.id);
        if (idx >= 0) list[idx] = saved;
    }

    if (typeof saveState === 'function') saveState();
    clearOrderlyRoomForm();
    renderOrderlyRoomModule();
    if (typeof updateSystemAlerts === 'function') updateSystemAlerts();
    if (typeof refreshOfficeMessagesUi === 'function') refreshOfficeMessagesUi();
    if (typeof updateDashboard === 'function') updateDashboard();

    if (doNotify && notified) {
        const short = notifyDepts.map((d) => d.replace(/^IT DIR\s+/i, '').replace(/\s*\(WORKSHOP\)/i, '')).slice(0, 4);
        const more = notifyDepts.length > 4 ? ` +${notifyDepts.length - 4} more` : '';
        showToast(`Filed in DF and notified ${notified} office(s): ${short.join(', ')}${more}.`, 'success');
    } else if (alertTechStores) {
        showToast('Filed in DF and TechStores alerted (dashboard Alerts tray).', 'success');
    } else {
        showToast('Letter filed in Orderly Room Daily File.', 'success');
    }
}

function markOrderlyActioned(id) {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;
    const list = ensureOrderlyDailyFile();
    const row = list.find((r) => r.id === id);
    if (!row) return;
    row.status = 'actioned';
    row.updatedAt = new Date().toISOString();
    row.updatedBy = currentUser?.username || '';
    if (typeof saveState === 'function') saveState();
    renderOrderlyRoomModule();
    if (typeof updateSystemAlerts === 'function') updateSystemAlerts();
    showToast('Marked actioned / closed.', 'success');
}

function alertOrderlyTechStores(id) {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;
    const list = ensureOrderlyDailyFile();
    const row = list.find((r) => r.id === id);
    if (!row) return;
    row.alertTechStores = true;
    row.status = 'alerted_techstores';
    row.docType = row.docType || 'requisition';
    row.updatedAt = new Date().toISOString();
    row.updatedBy = currentUser?.username || '';
    linkOrderlyToUnitRequisition(row);
    const depts = Array.isArray(row.notifyDepts) && row.notifyDepts.length
        ? row.notifyDepts
        : defaultOrderlyNotifySelection('requisition');
    row.notifyDepts = depts;
    const notified = postOrderlyRoomNotices(row, depts);
    row.lastNotifiedAt = new Date().toISOString();
    row.lastNotifiedDepts = depts.slice();
    if (typeof saveState === 'function') saveState();
    renderOrderlyRoomModule();
    if (typeof updateSystemAlerts === 'function') updateSystemAlerts();
    if (typeof refreshOfficeMessagesUi === 'function') refreshOfficeMessagesUi();
    showToast(
        notified
            ? `TechStores / departments notified (${notified} message(s)).`
            : 'TechStores alerted from Orderly Room DF.',
        'success'
    );
}

function deleteOrderlyEntry(id) {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;
    if (!confirm('Remove this entry from the Daily File?')) return;
    appState.orderlyDailyFile = ensureOrderlyDailyFile().filter((r) => r.id !== id);
    if (typeof saveState === 'function') saveState();
    renderOrderlyRoomModule();
    if (typeof updateSystemAlerts === 'function') updateSystemAlerts();
    showToast('Entry removed.', 'info');
}

function getFilteredOrderlyRows() {
    const status = document.getElementById('orFilterStatus')?.value || '';
    const type = document.getElementById('orFilterType')?.value || '';
    const q = (document.getElementById('orSearch')?.value || '').trim().toLowerCase();
    return ensureOrderlyDailyFile().filter((row) => {
        if (status && row.status !== status) return false;
        if (type && row.docType !== type) return false;
        if (!q) return true;
        const hay = `${row.refNo || ''} ${row.fromUnit || ''} ${row.subject || ''} ${row.remarks || ''}`.toLowerCase();
        return hay.includes(q);
    });
}

function updateOrderlyStats() {
    const all = ensureOrderlyDailyFile();
    const open = getOrderlyOpenForTechStores();
    const reqs = all.filter((r) => r.docType === 'requisition');
    const urgent = open.filter((r) => r.priority === 'urgent');
    const set = (id, n) => {
        const el = document.getElementById(id);
        if (el) el.textContent = String(n);
    };
    set('orStatOpen', open.length);
    set('orStatReq', reqs.length);
    set('orStatUrgent', urgent.length);
}

function renderOrderlyRoomModule() {
    const tbody = document.getElementById('orderlyRoomBody');
    if (!tbody) return;
    updateOrderlyStats();
    const rows = getFilteredOrderlyRows();
    const canEdit = typeof canEditData === 'function' ? canEditData() : true;

    tbody.innerHTML = rows.map((row) => `
        <tr data-or-id="${orEscape(row.id)}" class="or-row-pri-${orEscape(typeof normalizeMessagePriority === 'function' ? normalizeMessagePriority(row.priority) : (row.priority || 'normal'))}${row.alertTechStores && OR_OPEN_FOR_TECHSTORES.has(row.status) ? ' or-row-alert' : ''}">
            <td>${orEscape(row.dateIn || '—')}</td>
            <td>${orEscape(row.refNo || '—')}</td>
            <td>${orEscape(row.fromUnit || '—')}</td>
            <td>${orEscape(OR_DOC_TYPES[row.docType] || row.docType || '—')}</td>
            <td>${orEscape(row.subject || '—')}</td>
            <td>${orEscape(OR_FILE_AS[row.fileAs] || row.fileAs || 'DF')}</td>
            <td>${orEscape(OR_GS_AUTH[row.gsAuth] || row.gsAuth || '—')}</td>
            <td>${orEscape(OR_STATUSES[row.status] || row.status || '—')}</td>
            <td>${(() => {
                const meta = typeof getMessagePriorityMeta === 'function' ? getMessagePriorityMeta(row.priority) : null;
                return orEscape(meta ? `${meta.icon ? meta.icon + ' ' : ''}${meta.label}` : (row.priority || 'Normal'));
            })()}</td>
            <td class="qm-screen-only">
                ${canEdit ? `
                <button type="button" class="btn btn-ghost btn-sm" data-or-edit="${orEscape(row.id)}">Edit</button>
                ${row.status !== 'alerted_techstores' && row.status !== 'actioned' ? `<button type="button" class="btn btn-primary btn-sm" data-or-alert="${orEscape(row.id)}">Alert TS</button>` : ''}
                ${row.status !== 'actioned' ? `<button type="button" class="btn btn-success btn-sm" data-or-done="${orEscape(row.id)}">Done</button>` : ''}
                <button type="button" class="btn btn-ghost btn-sm" data-or-del="${orEscape(row.id)}">Del</button>
                ` : '—'}
            </td>
        </tr>
    `).join('') || '<tr><td colspan="10" class="empty-state">No letters filed yet. Use the form above to book into DF / First Sight.</td></tr>';
}

function focusOrderlyEntry(id) {
    renderOrderlyRoomModule();
    const row = document.querySelector(`#orderlyRoomBody tr[data-or-id="${CSS.escape(id)}"]`);
    row?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    row?.classList.add('alert-flash-row');
    setTimeout(() => row?.classList.remove('alert-flash-row'), 2500);
    const entry = ensureOrderlyDailyFile().find((r) => r.id === id);
    if (entry) fillOrderlyRoomForm(entry);
}

function initOrderlyRoomModule() {
    const root = document.getElementById('orderly-room');
    if (!root || root.dataset.orInit === '1') return;
    root.dataset.orInit = '1';

    if (!document.getElementById('orEditId')) {
        const hidden = document.createElement('input');
        hidden.type = 'hidden';
        hidden.id = 'orEditId';
        root.querySelector('.dashboard-panel')?.prepend(hidden);
    }

    renderOrderlyNotifyGrid(defaultOrderlyNotifySelection('requisition'));
    clearOrderlyRoomForm();

    document.getElementById('orSaveBtn')?.addEventListener('click', () => saveOrderlyRoomEntry({ alertTechStores: false }));
    document.getElementById('orSaveAlertBtn')?.addEventListener('click', () =>
        saveOrderlyRoomEntry({ alertTechStores: true, notifyDepartments: true })
    );
    document.getElementById('orSendMsgBtn')?.addEventListener('click', sendOrderlyRoomMessagesOnly);
    document.getElementById('orClearBtn')?.addEventListener('click', clearOrderlyRoomForm);

    document.getElementById('orNotifyTechstoresBtn')?.addEventListener('click', () => {
        const tech = orNotifyDeptList().find((d) => d.key === 'techstores')?.value;
        const cur = new Set(getSelectedOrderlyNotifyDepts());
        if (tech) cur.add(tech);
        setOrderlyNotifySelection([...cur]);
    });
    document.getElementById('orNotifyWorkshopBtn')?.addEventListener('click', () => {
        const ws = orNotifyDeptList().find((d) => d.key === 'workshop')?.value;
        const cur = new Set(getSelectedOrderlyNotifyDepts());
        if (ws) cur.add(ws);
        setOrderlyNotifySelection([...cur]);
    });
    document.getElementById('orNotifyAllItDirBtn')?.addEventListener('click', () => {
        setOrderlyNotifySelection(orNotifyDeptList().map((d) => d.value));
    });
    document.getElementById('orNotifyClearBtn')?.addEventListener('click', () => {
        setOrderlyNotifySelection([]);
    });

    document.getElementById('orDocType')?.addEventListener('change', (e) => {
        const selected = getSelectedOrderlyNotifyDepts();
        if (!selected.length) {
            renderOrderlyNotifyGrid(defaultOrderlyNotifySelection(e.target.value));
        }
    });

    ['orFilterStatus', 'orFilterType', 'orSearch'].forEach((id) => {
        document.getElementById(id)?.addEventListener('input', renderOrderlyRoomModule);
        document.getElementById(id)?.addEventListener('change', renderOrderlyRoomModule);
    });

    root.addEventListener('click', (e) => {
        const nav = e.target.closest('[data-target-nav]')?.getAttribute('data-target-nav');
        if (nav && typeof navigateToModule === 'function') {
            e.preventDefault();
            navigateToModule(nav);
            return;
        }
        const editId = e.target.closest('[data-or-edit]')?.getAttribute('data-or-edit');
        const alertId = e.target.closest('[data-or-alert]')?.getAttribute('data-or-alert');
        const doneId = e.target.closest('[data-or-done]')?.getAttribute('data-or-done');
        const delId = e.target.closest('[data-or-del]')?.getAttribute('data-or-del');
        if (editId) {
            const row = ensureOrderlyDailyFile().find((r) => r.id === editId);
            if (row) {
                fillOrderlyRoomForm(row);
                root.querySelector('.dashboard-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
        if (alertId) alertOrderlyTechStores(alertId);
        if (doneId) markOrderlyActioned(doneId);
        if (delId) deleteOrderlyEntry(delId);
    });

    renderOrderlyRoomModule();
}
