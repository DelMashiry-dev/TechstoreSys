/* it-dir-departments.js — shared IT Dir office list for Messages, Orderly Room, Dept Desks */

/** Canonical IT Dir internal offices (Messages / desks / Orderly notify) */
const IT_DIR_DEPARTMENTS = [
    { key: 'techstores', value: 'IT DIR TECHSTORES OFFICE', label: 'TechStores (Admin & QM)', short: 'TechStores', moduleId: null, estKey: 'admin_qm' },
    { key: 'workshop', value: 'IT ENGINEERING SUPPORT DEPT (WORKSHOP)', label: 'Engineering Support Dept', short: 'Engr Sp', moduleId: 'dept-workshop', estKey: 'engr_sp' },
    { key: 'sysadmin', value: 'IT DIR SYSTEMS ADMINISTRATION DEPT', label: 'Systems Administration Dept', short: 'Sys Admin', moduleId: 'dept-sysadmin', estKey: 'sysadmin' },
    { key: 'dba', value: 'IT DIR DBA OFFICE', label: 'DBA Office (under Sys Admin)', short: 'DBA', moduleId: null, estKey: 'sysadmin' },
    { key: 'compengr', value: 'IT DIR COMPUTER ENGINEERING DEPT', label: 'Computer Engineering Dept', short: 'Comp Engr', moduleId: 'dept-compengr', estKey: 'compengr' },
    { key: 'swengr', value: 'IT DIR SOFTWARE ENGINEERING DEPT', label: 'Software Engineering Dept', short: 'SW Engr', moduleId: 'dept-swengr', estKey: 'swengr' },
    { key: 'ictsec', value: 'IT DIR ICT SECURITY DEPT', label: 'ICT Security Dept', short: 'ICT Security', moduleId: 'dept-ictsec', estKey: 'ictsec' },
    { key: 'itts', value: 'ITTS (INFORMATION TECHNOLOGY TRAINING SCHOOL)', label: "ITTS Commandant's Office (Trg School)", short: 'ITTS', moduleId: 'dept-itts', estKey: 'itts' },
    { key: 'admin', value: 'IT DIR ADMIN OFFICE', label: 'Admin & QM Dept (AO)', short: 'Admin & QM', moduleId: 'dept-admin', estKey: 'admin_qm' },
    { key: 'gate', value: 'IT DIR GATE / RP', label: 'Gate / RP', short: 'Gate', moduleId: 'dept-gate', estKey: 'admin_qm' },
    { key: 'orderly', value: 'IT DIR ORDERLY ROOM', label: 'Orderly Room', short: 'Orderly Room', moduleId: 'orderly-room', estKey: 'admin_qm' },
    { key: 'dir', value: "IT DIR DIRECTOR'S OFFICE", label: "Director's Office (Dir HQ)", short: 'Dir', moduleId: null, estKey: 'dir_hq' },
    { key: 'dd', value: "IT DIR DD'S OFFICE", label: "DD's Office (Dir HQ)", short: 'DD', moduleId: null, estKey: 'dir_hq' },
    { key: 'aqso2', value: "IT DIR AQSO2'S OFFICE", label: "GSO2 / AQSO2 Office (Dir HQ)", short: 'GSO2/AQSO2', moduleId: null, estKey: 'dir_hq' }
];

/**
 * Communications Portal recipients — Dir HQ + establishment departments + TechStores / DBA desks.
 * Ordered to mirror Annex A org chart.
 */
const IT_DIR_COMMS_OFFICE_KEYS = [
    'dir', 'dd', 'aqso2',
    'sysadmin', 'dba', 'compengr', 'itts', 'swengr',
    'admin', 'techstores', 'workshop', 'ictsec'
];

/** Always copied when a department files a demand / requisition */
const IT_DIR_DEMAND_CC = ['dir', 'dd', 'aqso2', 'techstores'];

function getItDirCommsOffices() {
    const byKey = Object.fromEntries(IT_DIR_DEPARTMENTS.map((d) => [d.key, d]));
    return IT_DIR_COMMS_OFFICE_KEYS.map((k) => byKey[k]).filter(Boolean);
}

function getItDirDepartmentByKey(key) {
    return IT_DIR_DEPARTMENTS.find((d) => d.key === key) || null;
}

function getItDirDepartmentByValue(value) {
    const n = String(value || '').trim().toUpperCase();
    return IT_DIR_DEPARTMENTS.find((d) => d.value.toUpperCase() === n) || null;
}

function itDirDepartmentValues(keys) {
    const set = new Set(keys || []);
    return IT_DIR_DEPARTMENTS.filter((d) => set.has(d.key)).map((d) => d.value);
}

function itDirDepartmentOptionsHtml(selected) {
    const sel = selected || '';
    return IT_DIR_DEPARTMENTS.map((d) =>
        `<option value="${escapeItDirText(d.value)}"${d.value === sel ? ' selected' : ''}>${escapeItDirText(d.label)}</option>`
    ).join('');
}

function itDirNotifyCheckboxHtml(selectedValues) {
    const selected = new Set(selectedValues || []);
    return IT_DIR_DEPARTMENTS.filter((d) => !['dir', 'dd', 'aqso2'].includes(d.key)).map((d) => `
        <label class="or-notify-item">
            <input type="checkbox" class="or-notify-cb" value="${escapeItDirText(d.value)}" data-or-notify-key="${escapeItDirText(d.key)}"${selected.has(d.value) ? ' checked' : ''}>
            <span>${escapeItDirText(d.label)}</span>
        </label>
    `).join('');
}

function escapeItDirText(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/**
 * Post Messages-format notices to one or more departments (same shape as Compose).
 * Returns number of messages created.
 */
function sendOfficeMessagesToDepartments({
    departments = [],
    subject = '',
    body = '',
    priority = 'normal',
    dueDate = '',
    messageDate = '',
    toKind = 'it_dir_dept',
    source = '',
    meta = null,
    force = false
} = {}) {
    const depts = [...new Set((departments || []).map((d) => String(d || '').trim()).filter(Boolean))];
    if (!depts.length) return 0;
    if (!force && typeof canComposeOfficeMessages === 'function' && !canComposeOfficeMessages()) {
        if (typeof showToast === 'function') showToast('You cannot send office messages with this account.', 'error');
        return 0;
    }
    if (typeof ensureOfficeMessagesState !== 'function') return 0;

    const sub = String(subject || '').trim();
    const text = String(body || '').trim();
    if (!sub || !text) return 0;

    const pri = typeof normalizeMessagePriority === 'function'
        ? normalizeMessagePriority(priority)
        : (priority || 'normal');

    const msgDate = String(messageDate || '').trim()
        || (typeof todayIsoLocal === 'function' ? todayIsoLocal() : new Date().toISOString().slice(0, 10));
    if (typeof assertMessageDates === 'function' && !assertMessageDates({ messageDate: msgDate, dueDate })) {
        return 0;
    }

    const now = new Date();
    const list = ensureOfficeMessagesState();
    const fromUserId = (typeof currentUserKey === 'function' ? currentUserKey() : null)
        || currentUser?.id || currentUser?.username || 'system';
    let n = 0;

    depts.forEach((to) => {
        const metaDept = getItDirDepartmentByValue(to);
        const msg = {
            id: `om-${Date.now()}-${n}-${Math.random().toString(36).slice(2, 6)}`,
            toDepartment: to,
            toKind,
            toLabel: metaDept?.label || to,
            subject: sub,
            body: text,
            priority: pri,
            messageDate: msgDate,
            dueDate: dueDate || '',
            fromUserId,
            fromName: currentUser?.name || currentUser?.username || 'Officer',
            fromRole: currentUser?.role || '',
            fromRoleLabel: (typeof ROLE_LABELS !== 'undefined' ? ROLE_LABELS[currentUser?.role] : '') || currentUser?.role || '',
            fromOffice: (typeof getUserHomeDepartment === 'function' ? getUserHomeDepartment() : '') || '',
            createdAt: now.toISOString(),
            readBy: {},
            source: source || '',
            meta: meta || null
        };
        if (fromUserId) msg.readBy[fromUserId] = now.toISOString();
        list.unshift(msg);
        n += 1;
    });

    if (n && typeof saveState === 'function') saveState();
    return n;
}

window.IT_DIR_DEPARTMENTS = IT_DIR_DEPARTMENTS;
window.IT_DIR_COMMS_OFFICE_KEYS = IT_DIR_COMMS_OFFICE_KEYS;
window.IT_DIR_DEMAND_CC = IT_DIR_DEMAND_CC;
window.getItDirCommsOffices = getItDirCommsOffices;
window.getItDirDepartmentByKey = getItDirDepartmentByKey;
window.getItDirDepartmentByValue = getItDirDepartmentByValue;
window.itDirDepartmentOptionsHtml = itDirDepartmentOptionsHtml;
window.itDirDepartmentValues = itDirDepartmentValues;
window.sendOfficeMessagesToDepartments = sendOfficeMessagesToDepartments;
