/* office-messages.js — directed office messages + unread / read (email-style)
   Directors / Unit Commanders can post peer-to-peer to other Commanders & Directors.
*/

const OFFICE_BROADCAST = 'ALL OFFICES / DEPARTMENTS';

/** Peer commanders / directors a Dir or Unit Commander can address directly */
const PEER_COMMANDER_DESTINATIONS = [
    { value: "ZNA COMMANDER'S OFFICE", label: "ZNA Commander", group: 'Command' },
    { value: 'ARMY HEADQUARTERS', label: 'Army HQ', group: 'Command' },
    { value: 'ARMY CAMP HQ', label: 'Army Camp HQ', group: 'Command' },
    { value: 'GS BRANCH', label: 'Brig GS / GS Branch', group: 'Staff Branches' },
    { value: 'AS BRANCH', label: 'Brig AS / AS Branch', group: 'Staff Branches' },
    { value: 'QS BRANCH', label: 'Brig QS / QS Branch', group: 'Staff Branches' },
    { value: 'TRG BRANCH', label: 'Trg Br (DAT / Training)', group: 'Staff Branches' },
    { value: 'INSPECTORATE BRANCH', label: 'Insp Br (Inspectorate)', group: 'Staff Branches' },
    { value: "IT DIR DIRECTOR'S OFFICE", label: 'IT Dir — Director', group: 'Directors' },
    { value: 'DAF', label: 'Director DAF', group: 'Directors' },
    { value: 'DP', label: 'Director DP', group: 'Directors' },
    { value: 'AIAD', label: 'Director AIAD', group: 'Directors' },
    { value: 'DAT', label: 'Director DAT (Training)', group: 'Directors' },
    { value: 'HARARE DISTRICT', label: 'Harare District Commander', group: 'Districts / Formations' },
    { value: 'BULAWAYO DISTRICT', label: 'Bulawayo District Commander', group: 'Districts / Formations' },
    { value: '1 BRIGADE', label: '1 Brigade Commander', group: 'Districts / Formations' },
    { value: '2 BRIGADE', label: '2 Brigade Commander', group: 'Districts / Formations' },
    { value: '3 BRIGADE', label: '3 Brigade Commander', group: 'Districts / Formations' },
    { value: '4 BRIGADE', label: '4 Brigade Commander', group: 'Districts / Formations' },
    { value: '5 BRIGADE', label: '5 Brigade Commander', group: 'Districts / Formations' }
];

const COMMAND_OFFICES = [
    "ZNA COMMANDER'S OFFICE",
    'ARMY HEADQUARTERS',
    'ARMY CAMP HQ',
    'GS BRANCH',
    'AS BRANCH',
    'QS BRANCH',
    'TRG BRANCH',
    'INSPECTORATE BRANCH',
    'DP',
    'AIAD',
    'DAF',
    'DAT',
    'HARARE DISTRICT',
    'BULAWAYO DISTRICT',
    "IT DIR DIRECTOR'S OFFICE",
    "IT DIR DD'S OFFICE",
    "IT DIR AQSO2'S OFFICE",
    'IT DIR TECHSTORES OFFICE',
    'IT DIR ORDERLY ROOM'
];

/** Roles that may compose / send directed reminders to peer commanders */
const OFFICE_MESSAGE_SENDER_ROLES = new Set([
    'admin',
    'army_commander',
    'brig_gs',
    'brig_as',
    'brig_qs',
    'director',
    'deputy_director',
    'aqso2',
    'dir_aiad',
    'dir_daf',
    'dir_dp',
    'gs_sd',
    'techstores_officer',
    'orderly_clerk',
    'oc_sysadmin',
    'oc_workshop',
    'oc_compengr',
    'oc_swengr',
    'oc_ictsec',
    'oc_itts',
    'oc_admin',
    'oc_gate',
    'workshop',
    'rp'
]);

const ROLE_HOME_DEPARTMENT = {
    admin: 'IT DIR TECHSTORES OFFICE',
    army_commander: "ZNA COMMANDER'S OFFICE",
    brig_gs: 'GS BRANCH',
    brig_as: 'AS BRANCH',
    brig_qs: 'QS BRANCH',
    director: "IT DIR DIRECTOR'S OFFICE",
    deputy_director: "IT DIR DD'S OFFICE",
    aqso2: "IT DIR AQSO2'S OFFICE",
    dir_aiad: 'AIAD',
    dir_daf: 'DAF',
    dir_dp: 'DP',
    gs_sd: 'GS BRANCH',
    supplier: 'SUPPLIER',
    techstores_officer: 'IT DIR TECHSTORES OFFICE',
    rq: 'IT DIR TECHSTORES OFFICE',
    store_officer: 'IT DIR TECHSTORES OFFICE',
    orderly_clerk: 'IT DIR ORDERLY ROOM',
    storeman: 'IT DIR TECHSTORES OFFICE',
    rp: 'IT DIR GATE / RP',
    workshop: 'IT ENGINEERING SUPPORT DEPT (WORKSHOP)',
    oc_sysadmin: 'IT DIR SYSTEMS ADMINISTRATION DEPT',
    oc_workshop: 'IT ENGINEERING SUPPORT DEPT (WORKSHOP)',
    oc_compengr: 'IT DIR COMPUTER ENGINEERING DEPT',
    oc_swengr: 'IT DIR SOFTWARE ENGINEERING DEPT',
    oc_ictsec: 'IT DIR ICT SECURITY DEPT',
    oc_itts: 'ITTS (INFORMATION TECHNOLOGY TRAINING SCHOOL)',
    oc_admin: 'IT DIR ADMIN OFFICE',
    oc_gate: 'IT DIR GATE / RP',
    viewer: 'IT DIR TECHSTORES OFFICE'
};

/** Extra inbox addresses each role should receive (peer posts) */
const ROLE_INBOX_ALIASES = {
    army_commander: ["ZNA COMMANDER'S OFFICE", 'ARMY HEADQUARTERS', 'ARMY CAMP HQ', 'ZNA COMMANDER'],
    brig_gs: ['GS BRANCH', 'GS BR', 'BRIG GS', 'GENERAL STAFF BRANCH'],
    brig_as: ['AS BRANCH', 'AS BR', 'BRIG AS', 'ADMINISTRATION STAFF BRANCH'],
    brig_qs: ['QS BRANCH', 'QS BR', 'BRIG QS', 'QUARTERMASTER STAFF BRANCH'],
    director: [
        "IT DIR DIRECTOR'S OFFICE", 'IT DIR', 'IT DIRECTORATE', 'INFORMATION TECHNOLOGY DIRECTORATE',
        'IT DIR ADMIN OFFICE', 'IT DIR SYSTEMS ADMINISTRATION DEPT', 'IT DIR COMPUTER ENGINEERING DEPT',
        'IT DIR DBA OFFICE', 'IT DIR SOFTWARE ENGINEERING DEPT', 'IT DIR ICT SECURITY DEPT',
        'ITTS (INFORMATION TECHNOLOGY TRAINING SCHOOL)', 'IT DIR TECHSTORES OFFICE'
    ],
    deputy_director: [
        "IT DIR DD'S OFFICE", 'IT DIR', 'IT DIRECTORATE', 'IT DIR ADMIN OFFICE',
        'IT DIR SYSTEMS ADMINISTRATION DEPT', 'IT DIR COMPUTER ENGINEERING DEPT',
        'IT DIR DBA OFFICE', 'IT DIR SOFTWARE ENGINEERING DEPT', 'IT DIR ICT SECURITY DEPT'
    ],
    aqso2: ["IT DIR AQSO2'S OFFICE", 'IT DIR', 'IT DIR ADMIN OFFICE'],
    dir_aiad: ['AIAD', 'DIRECTOR AIAD', 'ARMY INTERNAL AUDIT'],
    dir_daf: ['DAF', 'DIRECTOR DAF', 'DIRECTORATE OF ARMY FINANCE'],
    dir_dp: ['DP', 'DIRECTOR DP', 'DIRECTORATE OF PROCUREMENT', 'DIRECTORATE PROCUREMENT'],
    gs_sd: ['GS BRANCH', 'GS BR', 'COLONEL SD', 'COL SD'],
    techstores_officer: ['IT DIR TECHSTORES OFFICE', 'TECH STORES', 'TECHSTORES OFFICE'],
    store_officer: ['IT DIR TECHSTORES OFFICE', 'TECH STORES'],
    rq: ['IT DIR TECHSTORES OFFICE', 'TECH STORES'],
    orderly_clerk: ['IT DIR ORDERLY ROOM', 'IT DIR ADMIN OFFICE'],
    workshop: ['IT ENGINEERING SUPPORT DEPT (WORKSHOP)', 'WORKSHOP', 'ENGINEERING SUPPORT'],
    oc_sysadmin: ['IT DIR SYSTEMS ADMINISTRATION DEPT', 'SYS ADMIN', 'SYSTEMS ADMINISTRATION'],
    oc_workshop: ['IT ENGINEERING SUPPORT DEPT (WORKSHOP)', 'WORKSHOP'],
    oc_compengr: ['IT DIR COMPUTER ENGINEERING DEPT', 'IT DIR DBA OFFICE', 'DBA', 'COMPUTER ENGINEERING'],
    oc_swengr: ['IT DIR SOFTWARE ENGINEERING DEPT', 'SOFTWARE ENGINEERING'],
    oc_ictsec: ['IT DIR ICT SECURITY DEPT', 'ICT SECURITY', 'IT SECURITY'],
    oc_itts: ['ITTS (INFORMATION TECHNOLOGY TRAINING SCHOOL)', 'ITTS', 'ITTS COMMANDANT'],
    oc_admin: ['IT DIR ADMIN OFFICE', 'ADMIN OFFICE'],
    oc_gate: ['IT DIR GATE / RP', 'GATE', 'GATE REGISTER'],
    rp: ['IT DIR GATE / RP', 'GATE', 'IT DIR ORDERLY ROOM'],
    admin: [] // admin sees all via role check
};

let saActiveTab = 'alerts';
let saMsgFilter = 'unread'; // unread | read | all | sent

function canComposeOfficeMessages(user = currentUser) {
    if (!user) return false;
    if (OFFICE_MESSAGE_SENDER_ROLES.has(user.role)) return true;
    return !!user.canComposeMessages;
}

function getUserHomeDepartment(user = currentUser) {
    if (!user) return '';
    if (user.department) return user.department;
    return ROLE_HOME_DEPARTMENT[user.role] || 'IT DIR TECHSTORES OFFICE';
}

function normalizeDestKey(value) {
    return String(value || '')
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function destinationMatchesUser(toValue, user = currentUser) {
    if (!toValue || !user) return false;
    const to = normalizeDestKey(toValue);
    const home = normalizeDestKey(getUserHomeDepartment(user));
    if (to && home && (to === home || to.includes(home) || home.includes(to))) return true;

    const aliases = ROLE_INBOX_ALIASES[user.role] || [];
    for (const a of aliases) {
        const na = normalizeDestKey(a);
        if (na && (to === na || to.includes(na) || na.includes(to))) return true;
    }

    const unit = normalizeDestKey(user.unit || user.formation || '');
    if (unit && (to === unit || to.includes(unit) || unit.includes(to))) return true;

    const name = normalizeDestKey(user.name);
    const uname = normalizeDestKey(user.username);
    if (name && (to === name || to.includes(name) || name.includes(to))) return true;
    if (uname && (to === uname || to.includes(uname))) return true;

    return false;
}

function ensureOfficeMessagesState() {
    if (!appState) return [];
    if (!Array.isArray(appState.officeMessages)) appState.officeMessages = [];
    return appState.officeMessages;
}

function ensureAlertReadsState() {
    const desk = typeof ensureAlertDeskState === 'function' ? ensureAlertDeskState() : null;
    if (!desk) return { reads: {} };
    if (!desk.reads || typeof desk.reads !== 'object') desk.reads = {};
    return desk;
}

function currentUserKey(user = currentUser) {
    if (!user) return '';
    return String(user.id || user.username || '');
}

function omEscape(value) {
    if (typeof escapeAlertText === 'function') return escapeAlertText(value);
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function omFormatWhen(iso) {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    } catch (_) {
        return String(iso).slice(0, 16);
    }
}

function isMessageRead(msg, user = currentUser) {
    const key = currentUserKey(user);
    if (!key || !msg) return false;
    return !!(msg.readBy && msg.readBy[key]);
}

function isInboxMessage(msg, user = currentUser) {
    if (!msg || !user) return false;
    const to = msg.toDepartment || '';
    if (to === OFFICE_BROADCAST) return true;
    if (user.role === 'admin' || user.role === 'army_commander') return true;
    const key = currentUserKey(user);
    if (msg.toUserId && key && String(msg.toUserId) === key) return true;
    if (destinationMatchesUser(to, user)) return true;
    if (msg.toLabel && destinationMatchesUser(msg.toLabel, user)) return true;
    // IT Dir command chain sees IT Dir–bound traffic
    if (['director', 'deputy_director', 'aqso2'].includes(user.role)
        && String(to).toUpperCase().includes('IT DIR')) return true;
    return false;
}

function ensureMessageTrashState(msg) {
    if (!msg.trashedBy || typeof msg.trashedBy !== 'object') msg.trashedBy = {};
    if (!msg.purgedBy || typeof msg.purgedBy !== 'object') msg.purgedBy = {};
    return msg;
}

function isMessagePurged(msg, user = currentUser) {
    const key = currentUserKey(user);
    if (!key || !msg) return false;
    ensureMessageTrashState(msg);
    return !!msg.purgedBy[key];
}

function isMessageTrashed(msg, user = currentUser) {
    const key = currentUserKey(user);
    if (!key || !msg) return false;
    ensureMessageTrashState(msg);
    if (msg.purgedBy[key]) return false;
    return !!msg.trashedBy[key];
}

function canSeeOfficeMessage(msg, user = currentUser) {
    if (!msg || !user) return false;
    if (isMessagePurged(msg, user)) return false;
    const key = currentUserKey(user);
    return isInboxMessage(msg, user) || msg.fromUserId === key;
}

function getInboxMessages(user = currentUser) {
    return ensureOfficeMessagesState()
        .filter((m) => isInboxMessage(m, user) && !isMessageTrashed(m, user) && !isMessagePurged(m, user))
        .slice()
        .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
}

function getSentMessages(user = currentUser) {
    const key = currentUserKey(user);
    return ensureOfficeMessagesState()
        .filter((m) => m.fromUserId === key && !isMessageTrashed(m, user) && !isMessagePurged(m, user))
        .slice()
        .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
}

function getTrashMessages(user = currentUser) {
    const key = currentUserKey(user);
    return ensureOfficeMessagesState()
        .filter((m) => canSeeOfficeMessage(m, user) && isMessageTrashed(m, user))
        .slice()
        .sort((a, b) => {
            const ta = (a.trashedBy && a.trashedBy[key]) || a.createdAt || '';
            const tb = (b.trashedBy && b.trashedBy[key]) || b.createdAt || '';
            return String(tb).localeCompare(String(ta));
        });
}

function getAllMailMessages(user = currentUser) {
    return ensureOfficeMessagesState()
        .filter((m) => canSeeOfficeMessage(m, user) && !isMessageTrashed(m, user))
        .slice()
        .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
}

function getImportantMessages(user = currentUser) {
    return getAllMailMessages(user).filter((m) => {
        const p = typeof normalizeMessagePriority === 'function'
            ? normalizeMessagePriority(m.priority)
            : String(m.priority || '').toLowerCase();
        return p === 'immediate' || p === 'high' || p === 'urgent' || p === 'critical' || p === 'flash';
    });
}

function trashOfficeMessage(msgId, user = currentUser) {
    const key = currentUserKey(user);
    if (!key || !msgId) return false;
    const msg = ensureOfficeMessagesState().find((m) => m.id === msgId);
    if (!msg || !canSeeOfficeMessage(msg, user)) return false;
    ensureMessageTrashState(msg);
    msg.trashedBy[key] = new Date().toISOString();
    if (typeof saveState === 'function') saveState();
    if (typeof showToast === 'function') showToast('Moved to Trash.', 'success');
    return true;
}

function restoreOfficeMessage(msgId, user = currentUser) {
    const key = currentUserKey(user);
    if (!key || !msgId) return false;
    const msg = ensureOfficeMessagesState().find((m) => m.id === msgId);
    if (!msg) return false;
    ensureMessageTrashState(msg);
    delete msg.trashedBy[key];
    if (typeof saveState === 'function') saveState();
    if (typeof showToast === 'function') showToast('Restored from Trash.', 'success');
    return true;
}

function purgeOfficeMessage(msgId, user = currentUser) {
    const key = currentUserKey(user);
    if (!key || !msgId) return false;
    const msg = ensureOfficeMessagesState().find((m) => m.id === msgId);
    if (!msg) return false;
    ensureMessageTrashState(msg);
    msg.purgedBy[key] = new Date().toISOString();
    delete msg.trashedBy[key];
    if (typeof saveState === 'function') saveState();
    if (typeof showToast === 'function') showToast('Deleted forever.', 'success');
    return true;
}

function emptyTrashMessages(user = currentUser) {
    const key = currentUserKey(user);
    if (!key) return 0;
    let n = 0;
    getTrashMessages(user).forEach((m) => {
        ensureMessageTrashState(m);
        m.purgedBy[key] = new Date().toISOString();
        delete m.trashedBy[key];
        n += 1;
    });
    if (n && typeof saveState === 'function') saveState();
    if (typeof showToast === 'function') {
        showToast(n ? `Emptied Trash (${n}).` : 'Trash is already empty.', n ? 'success' : 'info');
    }
    return n;
}

function ensureOfficeDraftsState() {
    if (!appState) return [];
    if (!Array.isArray(appState.officeMessageDrafts)) appState.officeMessageDrafts = [];
    return appState.officeMessageDrafts;
}

function getDraftMessages(user = currentUser) {
    const key = currentUserKey(user);
    return ensureOfficeDraftsState()
        .filter((d) => d && d.fromUserId === key)
        .slice()
        .sort((a, b) => String(b.updatedAt || b.createdAt || '').localeCompare(String(a.updatedAt || a.createdAt || '')));
}

function saveOfficeDraft(fields = {}, user = currentUser) {
    const key = currentUserKey(user);
    if (!key) return null;
    const now = new Date().toISOString();
    const drafts = ensureOfficeDraftsState();
    const id = fields.id || `omd-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const existing = drafts.find((d) => d.id === id);
    const draft = {
        id,
        toDepartment: String(fields.toDepartment || '').trim(),
        toKind: fields.toKind || 'it_dir_dept',
        toLabel: fields.toLabel || '',
        toUserId: String(fields.toUserId || '').trim(),
        subject: String(fields.subject || '').trim(),
        body: String(fields.body || '').trim(),
        priority: fields.priority || 'normal',
        dueDate: fields.dueDate || '',
        fromUserId: key,
        fromName: user?.name || user?.username || 'Officer',
        createdAt: existing?.createdAt || now,
        updatedAt: now
    };
    if (!draft.subject && !draft.body && !draft.toDepartment) {
        if (typeof showToast === 'function') showToast('Nothing to save as draft.', 'error');
        return null;
    }
    if (existing) Object.assign(existing, draft);
    else drafts.unshift(draft);
    if (typeof saveState === 'function') saveState();
    if (typeof showToast === 'function') showToast('Draft saved.', 'success');
    return draft;
}

function deleteOfficeDraft(draftId, user = currentUser) {
    const key = currentUserKey(user);
    const drafts = ensureOfficeDraftsState();
    const idx = drafts.findIndex((d) => d.id === draftId && d.fromUserId === key);
    if (idx < 0) return false;
    drafts.splice(idx, 1);
    if (typeof saveState === 'function') saveState();
    return true;
}

function getUnreadMessageCount(user = currentUser) {
    return getInboxMessages(user).filter((m) => !isMessageRead(m, user)).length;
}

function isAlertUnread(deskId, user = currentUser) {
    const key = currentUserKey(user);
    if (!key || !deskId) return true;
    const desk = ensureAlertReadsState();
    return !(desk.reads && desk.reads[deskId] && desk.reads[deskId][key]);
}

function markAlertRead(deskId, user = currentUser) {
    const key = currentUserKey(user);
    if (!key || !deskId) return;
    const desk = ensureAlertReadsState();
    if (!desk.reads[deskId]) desk.reads[deskId] = {};
    if (desk.reads[deskId][key]) return;
    desk.reads[deskId][key] = new Date().toISOString();
    if (typeof saveState === 'function') saveState();
}

function getUnreadAlertCount(alertIds = []) {
    return (alertIds || []).filter((id) => isAlertUnread(id)).length;
}

function markMessageRead(msgId, user = currentUser) {
    const key = currentUserKey(user);
    if (!key || !msgId) return;
    const list = ensureOfficeMessagesState();
    const msg = list.find((m) => m.id === msgId);
    if (!msg) return;
    if (!msg.readBy || typeof msg.readBy !== 'object') msg.readBy = {};
    if (msg.readBy[key]) return;
    msg.readBy[key] = new Date().toISOString();
    if (typeof saveState === 'function') saveState();
}

function markAllInboxRead(user = currentUser) {
    getInboxMessages(user).forEach((m) => markMessageRead(m.id, user));
    refreshOfficeMessagesUi();
}

function collectOfficeMessageDirectory() {
    const items = [];
    const seen = new Set();
    const push = (entry) => {
        const value = String(entry.value || '').trim();
        const label = String(entry.label || value).trim();
        if (!value && !label) return;
        const key = `${normalizeDestKey(value)}|${normalizeDestKey(label)}|${entry.kind || ''}`;
        if (seen.has(key)) return;
        seen.add(key);
        items.push({
            value,
            label,
            kind: entry.kind || 'other',
            userId: entry.userId || '',
            hint: entry.hint || ''
        });
    };

    (typeof getItDirCommsOffices === 'function' ? getItDirCommsOffices() : []).forEach((o) => {
        push({
            value: o.value,
            label: o.label || o.short || o.value,
            kind: 'it_dir_dept',
            hint: 'IT Dir department'
        });
    });

    PEER_COMMANDER_DESTINATIONS.forEach((p) => {
        push({
            value: p.value,
            label: p.label,
            kind: 'peer_commander',
            hint: p.group || 'Peer commander'
        });
    });

    if (typeof ZNA_UNIT_GROUPS !== 'undefined' && Array.isArray(ZNA_UNIT_GROUPS)) {
        ZNA_UNIT_GROUPS.forEach((group) => {
            (group.units || []).forEach((u) => {
                const val = u.name || (typeof getZnaUnitValue === 'function' ? getZnaUnitValue(u) : '');
                const label = u.abbr ? `${u.name} (${u.abbr})` : (u.name || val);
                push({
                    value: val,
                    label,
                    kind: 'unit_commander',
                    hint: group.label || 'Unit / formation'
                });
            });
        });
    }

    (appState?.users || []).forEach((u) => {
        if (u.active === false) return;
        const name = String(u.name || u.username || '').trim();
        if (!name) return;
        const role = (typeof ROLE_LABELS !== 'undefined' && ROLE_LABELS[u.role]) || u.role || '';
        const dept = u.department || '';
        push({
            value: name,
            label: role ? `${name} — ${role}` : name,
            kind: 'individual',
            userId: u.id || u.username || '',
            hint: dept || 'System user'
        });
    });

    const est = typeof IT_DIR_ESTABLISHMENT !== 'undefined' ? IT_DIR_ESTABLISHMENT : null;
    if (est?.hq?.posts) {
        est.hq.posts.forEach((p) => {
            push({
                value: `${p.role} — ${est.hq.name}`,
                label: `${p.role} (${p.rank || ''})`.trim(),
                kind: 'individual',
                hint: 'IT Dir establishment'
            });
        });
    }
    (est?.departments || []).forEach((dept) => {
        (dept.hq?.posts || []).forEach((p) => {
            push({
                value: `${p.role} — ${dept.name}`,
                label: `${p.role} · ${dept.name}`,
                kind: 'individual',
                hint: 'IT Dir establishment'
            });
        });
        (dept.branches || []).forEach((br) => {
            (br.posts || []).forEach((p) => {
                push({
                    value: `${p.role} — ${br.name}`,
                    label: `${p.role} · ${br.name}`,
                    kind: 'individual',
                    hint: dept.name || 'IT Dir establishment'
                });
            });
        });
    });

    return items.sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));
}

function officeMessageDirectoryDatalistHtml() {
    return collectOfficeMessageDirectory().map((item) => {
        const display = item.hint ? `${item.label} — ${item.hint}` : item.label;
        return `<option value="${omEscape(item.value)}" label="${omEscape(display)}"></option>`;
    }).join('');
}

function matchOfficeMessageDirectory(typed) {
    const q = String(typed || '').trim();
    if (!q) return null;
    const nq = normalizeDestKey(q);
    const list = collectOfficeMessageDirectory();
    const exact = list.find((item) => normalizeDestKey(item.value) === nq)
        || list.find((item) => normalizeDestKey(item.label) === nq);
    if (exact) return exact;
    return list.find((item) => {
        const namePart = normalizeDestKey(String(item.label || '').split('—')[0]);
        return namePart && namePart === nq;
    }) || null;
}

function resolveTypedComposeDestination(typed) {
    const text = String(typed || '').trim();
    if (!text) return null;
    const match = matchOfficeMessageDirectory(text);
    if (match) {
        let toLabel = match.label || match.value;
        if (match.kind === 'unit_commander') toLabel = `Commander — ${match.value}`;
        else if (match.kind === 'peer_commander') toLabel = match.label;
        else if (match.kind === 'individual') toLabel = match.label || match.value;
        return {
            to: match.value,
            toKind: match.kind,
            toLabel,
            toUserId: match.userId || ''
        };
    }
    return {
        to: text,
        toKind: 'individual',
        toLabel: text,
        toUserId: ''
    };
}

function resolveComposeDestination() {
    const mode = document.getElementById('omToMode')?.value || 'peer';
    if (mode === 'broadcast') {
        return { to: OFFICE_BROADCAST, toKind: 'broadcast', toLabel: OFFICE_BROADCAST, toUserId: '' };
    }
    const typed = (document.getElementById('omToSearch')?.value || '').trim();
    if (typed) {
        const dest = resolveTypedComposeDestination(typed);
        if (dest) return dest;
    }
    if (mode === 'typed') {
        return { to: '', toKind: 'individual', toLabel: '', toUserId: '' };
    }
    if (mode === 'it_dir') {
        const dept = (document.getElementById('omToItDir')?.value || '').trim();
        const meta = typeof getItDirDepartmentByValue === 'function' ? getItDirDepartmentByValue(dept) : null;
        return { to: dept, toKind: 'it_dir_dept', toLabel: meta?.label || dept, toUserId: '' };
    }
    if (mode === 'other') {
        const other = (document.getElementById('omToOther')?.value || '').trim();
        return { to: other, toKind: 'unit_commander', toLabel: other ? `${other} (Unit / Formation Commander)` : '', toUserId: '' };
    }
    if (mode === 'unit') {
        const unit = (document.getElementById('omToUnit')?.value || '').trim();
        return { to: unit, toKind: 'unit_commander', toLabel: unit ? `Commander — ${unit}` : '', toUserId: '' };
    }
    const peer = (document.getElementById('omToPeer')?.value || '').trim();
    const peerMeta = PEER_COMMANDER_DESTINATIONS.find((p) => p.value === peer);
    return {
        to: peer,
        toKind: 'peer_commander',
        toLabel: peerMeta ? peerMeta.label : peer,
        toUserId: ''
    };
}

function syncOfficeComposeToMode(root = document) {
    const mode = root.querySelector('#omToMode')?.value || 'peer';
    const itDir = root.querySelector('#omItDirWrap');
    const peer = root.querySelector('#omPeerWrap');
    const unit = root.querySelector('#omUnitWrap');
    const other = root.querySelector('#omOtherWrap');
    const search = root.querySelector('#omSearchWrap');
    if (itDir) itDir.hidden = mode !== 'it_dir';
    if (peer) peer.hidden = mode !== 'peer';
    if (unit) unit.hidden = mode !== 'unit';
    if (other) other.hidden = mode !== 'other';
    if (search) search.hidden = mode === 'broadcast';
}

function wireOfficeComposeRecipientFields(root = document) {
    const modeEl = root.querySelector('#omToMode');
    const searchEl = root.querySelector('#omToSearch');
    modeEl?.addEventListener('change', () => {
        const mode = modeEl.value || 'peer';
        if (searchEl && mode !== 'typed' && mode !== 'broadcast') {
            searchEl.value = '';
        }
        syncOfficeComposeToMode(root);
    });
    searchEl?.addEventListener('input', () => {
        if (!searchEl.value.trim() || !modeEl) return;
        if (modeEl.value === 'broadcast') return;
        if (modeEl.value !== 'typed') {
            modeEl.value = 'typed';
            syncOfficeComposeToMode(root);
        }
    });
    syncOfficeComposeToMode(root);
}

function composeOfficeMessage({ toDepartment, toKind, toLabel, toUserId = '', subject, body, priority = 'normal', dueDate = '', messageDate = '' } = {}) {
    if (!canComposeOfficeMessages()) {
        if (typeof showToast === 'function') showToast('Only command / director-level users can send office messages.', 'error');
        return null;
    }
    const to = String(toDepartment || '').trim();
    const sub = String(subject || '').trim();
    const text = String(body || '').trim();
    if (!to) {
        if (typeof showToast === 'function') showToast('Select or type the person, unit or office to receive this message.', 'error');
        return null;
    }
    if (!sub) {
        if (typeof showToast === 'function') showToast('Enter a short subject.', 'error');
        return null;
    }
    if (!text) {
        if (typeof showToast === 'function') showToast('Enter the message / reminder text.', 'error');
        return null;
    }
    const msgDate = String(messageDate || '').trim()
        || (typeof todayIsoLocal === 'function' ? todayIsoLocal() : new Date().toISOString().slice(0, 10));
    if (typeof assertMessageDates === 'function' && !assertMessageDates({ messageDate: msgDate, dueDate })) {
        return null;
    }
    const now = new Date();
    const msg = {
        id: `om-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        toDepartment: to,
        toKind: toKind || 'peer_commander',
        toLabel: toLabel || to,
        toUserId: String(toUserId || '').trim(),
        subject: sub,
        body: text,
        priority: typeof normalizeMessagePriority === 'function'
            ? normalizeMessagePriority(priority || 'normal')
            : (priority || 'normal'),
        messageDate: msgDate,
        dueDate: dueDate || '',
        fromUserId: currentUserKey(),
        fromName: currentUser?.name || currentUser?.username || 'Officer',
        fromRole: currentUser?.role || '',
        fromRoleLabel: (typeof ROLE_LABELS !== 'undefined' ? ROLE_LABELS[currentUser?.role] : '') || currentUser?.role || '',
        fromOffice: getUserHomeDepartment(),
        createdAt: now.toISOString(),
        readBy: {}
    };
    msg.readBy[msg.fromUserId] = now.toISOString();
    ensureOfficeMessagesState().unshift(msg);
    if (typeof saveState === 'function') saveState();
    if (typeof showToast === 'function') showToast(`Message sent to ${msg.toLabel || to}.`, 'success');
    return msg;
}

function messageDepartmentsList() {
    const base = (typeof ALERT_DEPARTMENTS !== 'undefined' && Array.isArray(ALERT_DEPARTMENTS))
        ? ALERT_DEPARTMENTS.slice()
        : COMMAND_OFFICES.slice();
    const set = new Set([OFFICE_BROADCAST, ...COMMAND_OFFICES, ...PEER_COMMANDER_DESTINATIONS.map((p) => p.value), ...base]);
    return [...set];
}

function peerCommanderOptionsHtml() {
    const groups = {};
    PEER_COMMANDER_DESTINATIONS.forEach((p) => {
        if (!groups[p.group]) groups[p.group] = [];
        groups[p.group].push(p);
    });
    return Object.keys(groups).map((g) => `
        <optgroup label="${omEscape(g)}">
            ${groups[g].map((p) => `<option value="${omEscape(p.value)}">${omEscape(p.label)}</option>`).join('')}
        </optgroup>
    `).join('');
}

function unitCommanderOptionsHtml() {
    if (typeof ZNA_UNIT_GROUPS === 'undefined' || !Array.isArray(ZNA_UNIT_GROUPS)) {
        return '<option value="">— Unit list unavailable —</option>';
    }
    return ZNA_UNIT_GROUPS.map((group) => `
        <optgroup label="${omEscape(group.label || group.id)}">
            ${(group.units || []).map((u) => {
                const val = u.name || (typeof getZnaUnitValue === 'function' ? getZnaUnitValue(u) : u);
                const label = u.abbr ? `${u.name} (${u.abbr})` : (u.name || val);
                return `<option value="${omEscape(val)}">${omEscape(label)}</option>`;
            }).join('')}
        </optgroup>
    `).join('');
}

function renderMessageCard(msg, { sent = false } = {}) {
    const unread = !sent && !isMessageRead(msg);
    const pri = typeof normalizeMessagePriority === 'function'
        ? normalizeMessagePriority(msg.priority)
        : (msg.priority || 'normal');
    const priBadge = typeof messagePriorityBadgeHtml === 'function'
        ? messagePriorityBadgeHtml(pri, { escapeFn: omEscape })
        : `<span class="om-pri om-pri-${omEscape(pri)}">${omEscape(pri)}</span>`;
    const toDisplay = msg.toLabel || msg.toDepartment || '—';
    const elevated = typeof isElevatedMessagePriority === 'function'
        ? isElevatedMessagePriority(pri)
        : (pri === 'urgent' || pri === 'critical' || pri === 'flash' || pri === 'immediate');
    return `
        <article class="om-card${unread ? ' om-unread' : ' om-read'}${elevated ? ' om-urgent' : ''} om-pri-border-${omEscape(pri)}" data-om-id="${omEscape(msg.id)}">
            <header class="om-card-head">
                ${unread ? '<span class="om-dot" title="Unread"></span>' : '<span class="om-dot om-dot-read" title="Read"></span>'}
                ${priBadge}
                ${msg.toKind === 'peer_commander' || msg.toKind === 'unit_commander' ? '<span class="om-kind">Commander</span>' : ''}
                ${msg.toKind === 'individual' ? '<span class="om-kind">Individual</span>' : ''}
                ${msg.toKind === 'it_dir_dept' || msg.source === 'orderly-room' || msg.source === 'dept-desk' ? '<span class="om-kind">IT Dir</span>' : ''}
                <strong class="om-subject">${omEscape(msg.subject)}</strong>
                <span class="om-when">${omEscape(omFormatWhen(msg.createdAt))}</span>
            </header>
            <div class="om-meta">
                <span><em>From</em> ${omEscape(msg.fromName)} · ${omEscape(msg.fromRoleLabel || msg.fromOffice)}</span>
                <span><em>To</em> ${omEscape(toDisplay)}</span>
                ${msg.dueDate ? `<span><em>Due</em> ${omEscape(msg.dueDate)}</span>` : ''}
            </div>
            <p class="om-body">${omEscape(msg.body)}</p>
            <div class="om-card-actions">
                ${!sent ? `<button type="button" class="btn btn-primary btn-sm" data-om-reply="${omEscape(msg.id)}">Reply</button>` : ''}
                ${!sent && unread ? `<button type="button" class="btn btn-ghost btn-sm" data-om-mark-read="${omEscape(msg.id)}">Mark read</button>` : ''}
                ${!sent && !unread ? `<span class="om-read-label">Read</span>` : ''}
            </div>
        </article>
    `;
}

function buildReplySubject(subject) {
    const s = String(subject || '').trim();
    if (!s) return 'Re:';
    return /^re:\s/i.test(s) ? s : `Re: ${s}`;
}

function buildReplyQuote(msg) {
    const when = omFormatWhen(msg?.createdAt);
    const from = [msg?.fromName, msg?.fromOffice || msg?.fromRoleLabel].filter(Boolean).join(' · ');
    const body = String(msg?.body || '').trim();
    return [

        '',
        '——— Original message ———',
        `From: ${from || '—'}`,
        `Date: ${when}`,
        `Subject: ${msg?.subject || '—'}`,
        '',
        body
    ].join('\n');
}

function resolveReplyToDepartment(msg) {
    if (!msg) return '';
    if (msg.fromOffice) return msg.fromOffice;
    if (typeof ROLE_HOME_DEPARTMENT !== 'undefined' && msg.fromRole && ROLE_HOME_DEPARTMENT[msg.fromRole]) {
        return ROLE_HOME_DEPARTMENT[msg.fromRole];
    }
    return '';
}

/** Prefill Notifications Compose for a reply to an inbox message */
function startOfficeMessageReply(msgId) {
    const list = ensureOfficeMessagesState();
    const msg = list.find((m) => m.id === msgId);
    if (!msg) {
        if (typeof showToast === 'function') showToast('Original message not found.', 'error');
        return;
    }
    markMessageRead(msgId);
    setSaTab('compose');
    // Wait for compose pane render
    setTimeout(() => {
        const to = resolveReplyToDepartment(msg);
        const replyName = String(msg.fromName || '').trim();
        const modeEl = document.getElementById('omToMode');
        const search = document.getElementById('omToSearch');
        if (replyName && search) {
            if (modeEl) {
                modeEl.value = 'typed';
                modeEl.dispatchEvent(new Event('change'));
            }
            search.value = replyName;
        } else {
            if (modeEl) {
                modeEl.value = 'it_dir';
                modeEl.dispatchEvent(new Event('change'));
            }
            const itDir = document.getElementById('omToItDir');
            if (itDir && to) {
                if (![...itDir.options].some((o) => o.value === to)) {
                    const opt = document.createElement('option');
                    opt.value = to;
                    opt.textContent = to;
                    itDir.appendChild(opt);
                }
                itDir.value = to;
            }
            const peer = document.getElementById('omToPeer');
            if (peer && to && (!itDir || !itDir.value)) {
                if ([...peer.options].some((o) => o.value === to)) {
                    if (modeEl) {
                        modeEl.value = 'peer';
                        modeEl.dispatchEvent(new Event('change'));
                    }
                    peer.value = to;
                }
            }
        }
        const sub = document.getElementById('omSubject');
        if (sub) sub.value = buildReplySubject(msg.subject);
        const body = document.getElementById('omBody');
        if (body) {
            body.value = buildReplyQuote(msg);
            body.focus();
            body.setSelectionRange(0, 0);
        }
        const pri = document.getElementById('omPriority');
        if (pri && msg.priority) {
            const n = typeof normalizeMessagePriority === 'function' ? normalizeMessagePriority(msg.priority) : msg.priority;
            pri.value = n;
        }
        if (typeof showToast === 'function') showToast('Reply ready — edit your text above the original, then Send.', 'info');
    }, 40);
}

function renderOfficeMessagesPane() {
    const listEl = document.getElementById('systemMessagesList');
    if (!listEl) return;

    const inbox = getInboxMessages();
    const sent = getSentMessages();
    let rows = inbox;
    if (saMsgFilter === 'unread') rows = inbox.filter((m) => !isMessageRead(m));
    else if (saMsgFilter === 'read') rows = inbox.filter((m) => isMessageRead(m));
    else if (saMsgFilter === 'sent') rows = sent;
    else rows = inbox;

    const unread = getUnreadMessageCount();
    listEl.innerHTML = `
        <div class="om-toolbar">
            <div class="om-filters">
                <button type="button" class="om-filter-btn${saMsgFilter === 'unread' ? ' is-active' : ''}" data-om-filter="unread">Unread (${unread})</button>
                <button type="button" class="om-filter-btn${saMsgFilter === 'read' ? ' is-active' : ''}" data-om-filter="read">Read</button>
                <button type="button" class="om-filter-btn${saMsgFilter === 'all' ? ' is-active' : ''}" data-om-filter="all">All inbox</button>
                <button type="button" class="om-filter-btn${saMsgFilter === 'sent' ? ' is-active' : ''}" data-om-filter="sent">Sent</button>
            </div>
            <div class="om-toolbar-actions">
                <button type="button" class="btn btn-ghost btn-sm" id="omMarkAllReadBtn" ${unread ? '' : 'disabled'}>Mark all read</button>
                ${canComposeOfficeMessages() ? '<button type="button" class="btn btn-primary btn-sm" data-sa-goto="compose">Compose</button>' : ''}
            </div>
        </div>
        <div class="om-list">
            ${rows.length
                ? rows.map((m) => renderMessageCard(m, { sent: saMsgFilter === 'sent' })).join('')
                : `<div class="alert-item alert-success-item">${saMsgFilter === 'sent' ? 'No sent messages yet.' : saMsgFilter === 'unread' ? 'No unread messages.' : 'No messages in this folder.'}</div>`}
        </div>
    `;
}

function renderOfficeComposePane() {
    const listEl = document.getElementById('systemComposePane');
    if (!listEl) return;
    if (!canComposeOfficeMessages()) {
        listEl.innerHTML = '<div class="alert-item alert-warning-item">Your role cannot compose Messages. Orderly Room / Department Desks and Dir / DD / AQSO2 / Commanders can.</div>';
        return;
    }
    const itDirOpts = typeof itDirDepartmentOptionsHtml === 'function'
        ? itDirDepartmentOptionsHtml()
        : '<option value="IT DIR TECHSTORES OFFICE">TechStores Office</option>';
    const defaultMode = ['orderly_clerk', 'oc_sysadmin', 'oc_workshop', 'oc_compengr', 'oc_swengr', 'oc_ictsec', 'oc_itts', 'oc_admin', 'oc_gate', 'workshop', 'rp'].includes(currentUser?.role)
        ? 'it_dir'
        : 'peer';
    listEl.innerHTML = `
        <form class="om-compose" id="omComposeForm">
            <p class="om-compose-lead">
                Compose an office message (email-style) to an <strong>IT Dir department</strong>,
                peer <strong>Director / Commander</strong>, unit, or a <strong>specific individual</strong>.
                Type a name or unit in the search box, or pick from the Post To list.
                Recipients see it under <strong>Inbox</strong> with an unread badge — same card format as Notifications.
            </p>
            <div class="om-compose-grid">
                <label class="ad-field om-span-2">
                    <span>From</span>
                    <input class="form-control" value="${omEscape((currentUser?.name || '') + ' · ' + (ROLE_LABELS?.[currentUser?.role] || currentUser?.role || '') + ' · ' + getUserHomeDepartment())}" readonly>
                </label>
                <label class="ad-field om-span-2">
                    <span>Post to</span>
                    <select class="form-control" id="omToMode">
                        <option value="typed">Specific individual or unit (type below)</option>
                        <option value="it_dir"${defaultMode === 'it_dir' ? ' selected' : ''}>IT Dir internal department</option>
                        <option value="peer"${defaultMode === 'peer' ? ' selected' : ''}>Peer Director / Branch / District Commander</option>
                        <option value="unit">Any Unit / Formation Commander</option>
                        <option value="other">Other commander (type name)</option>
                        <option value="broadcast">Broadcast — all offices</option>
                    </select>
                </label>
                <label class="ad-field om-span-2" id="omSearchWrap">
                    <span>Type individual or unit</span>
                    <input type="search" class="form-control" id="omToSearch" list="omToDirectoryList" maxlength="160"
                        placeholder="Start typing a name, office, or unit…" autocomplete="off" spellcheck="false">
                    <datalist id="omToDirectoryList">${officeMessageDirectoryDatalistHtml()}</datalist>
                    <span class="om-field-hint">Search the directory or type any name / unit. Leave blank to use the Post To list.</span>
                </label>
                <label class="ad-field" id="omItDirWrap">
                    <span>IT Dir department</span>
                    <select class="form-control" id="omToItDir">
                        <option value="">Select department…</option>
                        ${itDirOpts}
                    </select>
                </label>
                <label class="ad-field" id="omPeerWrap" hidden>
                    <span>Commander / Director</span>
                    <select class="form-control" id="omToPeer">
                        <option value="">Select peer commander…</option>
                        ${peerCommanderOptionsHtml()}
                    </select>
                </label>
                <label class="ad-field" id="omUnitWrap" hidden>
                    <span>Unit / Formation</span>
                    <select class="form-control" id="omToUnit">
                        <option value="">Select unit / formation…</option>
                        ${unitCommanderOptionsHtml()}
                    </select>
                </label>
                <label class="ad-field om-span-2" id="omOtherWrap" hidden>
                    <span>Other Unit / Formation Commander</span>
                    <input type="text" class="form-control" id="omToOther" maxlength="120" placeholder="e.g. Mapping and Research (MID) · CO">
                </label>
                <label class="ad-field">
                    <span>Priority</span>
                    <select class="form-control" id="omPriority">
                        <option value="normal">Normal</option>
                        <option value="immediate">Immediate</option>
                        <option value="urgent">Urgent</option>
                        <option value="critical">Critical</option>
                        <option value="flash">⚡ Flash</option>
                    </select>
                </label>
                <label class="ad-field">
                    <span>Message date</span>
                    <input type="date" class="form-control" id="omMsgDate" data-date-rule="not-future" data-date-label="Message date" required>
                </label>
                <label class="ad-field">
                    <span>Action due (optional)</span>
                    <input type="date" class="form-control" id="omDueDate" data-date-rule="not-past" data-date-label="Action due">
                </label>
                <label class="ad-field om-span-2">
                    <span>Subject</span>
                    <input type="text" class="form-control" id="omSubject" maxlength="160" placeholder="Short subject" required>
                </label>
                <label class="ad-field om-span-2">
                    <span>Message / reminder</span>
                    <textarea class="form-control" id="omBody" rows="4" maxlength="2000" placeholder="Write the message for the receiving office…" required></textarea>
                </label>
            </div>
            <div class="om-compose-actions">
                <button type="submit" class="btn btn-primary">Send message</button>
                <button type="button" class="btn btn-ghost" data-om-save-draft>Save draft</button>
                <button type="button" class="btn btn-ghost" data-sa-goto="messages">Cancel</button>
            </div>
        </form>
    `;

    const pane = document.getElementById('systemComposePane') || document;
    wireOfficeComposeRecipientFields(pane);
    const msgDate = document.getElementById('omMsgDate');
    if (msgDate && !msgDate.value && typeof todayIsoLocal === 'function') {
        msgDate.value = todayIsoLocal();
    }
    if (typeof applyDateInputConstraints === 'function') applyDateInputConstraints(document.getElementById('systemComposePane') || document);
}

function updateSaTabBadges(alertTotal = 0, alertUnread = 0) {
    const msgUnread = getUnreadMessageCount();
    const totalUnread = msgUnread + alertUnread;

    const unreadEl = document.getElementById('systemAlertsUnread');
    if (unreadEl) {
        unreadEl.textContent = String(totalUnread);
        unreadEl.hidden = totalUnread === 0;
        unreadEl.title = `${totalUnread} unread — click to open Inbox`;
        unreadEl.setAttribute('aria-label', `${totalUnread} unread — open messages`);
        unreadEl.classList.toggle('has-unread', totalUnread > 0);
    }

    const totalEl = document.getElementById('systemAlertsCount');
    if (totalEl) {
        totalEl.textContent = String(alertTotal);
        totalEl.title = `${alertTotal} system alerts`;
    }

    const ab = document.getElementById('saTabAlertBadge');
    if (ab) {
        ab.textContent = alertUnread ? String(alertUnread) : '';
        ab.hidden = !alertUnread;
    }
    const mb = document.getElementById('saTabMsgBadge');
    if (mb) {
        mb.textContent = msgUnread ? String(msgUnread) : '';
        mb.hidden = !msgUnread;
    }

    const composeTab = document.getElementById('saTabCompose');
    if (composeTab) composeTab.hidden = !canComposeOfficeMessages();
}

function applySaTabVisibility() {
    if (window.saViewMode === 'mail' || window.saViewMode === 'whatsapp') {
        if (typeof applySaViewMode === 'function') applySaViewMode();
        return;
    }
    const panes = {
        alerts: document.getElementById('systemAlertsList'),
        messages: document.getElementById('systemMessagesList'),
        compose: document.getElementById('systemComposePane')
    };
    Object.entries(panes).forEach(([key, el]) => {
        if (!el) return;
        const show = key === saActiveTab;
        el.hidden = !show;
        el.classList.toggle('sa-pane-hidden', !show);
        el.setAttribute('aria-hidden', show ? 'false' : 'true');
    });

    document.querySelectorAll('[data-sa-tab]').forEach((btn) => {
        const active = btn.getAttribute('data-sa-tab') === saActiveTab;
        btn.classList.toggle('is-active', active);
        btn.setAttribute('aria-selected', active ? 'true' : 'false');
    });
}

function setSaTab(tab) {
    saActiveTab = tab || 'alerts';
    window.saActiveTab = saActiveTab;
    applySaTabVisibility();

    if (window.saViewMode === 'mail') {
        if (saActiveTab === 'compose') window.saMailFolder = 'compose';
        else if (saActiveTab === 'alerts') window.saMailFolder = 'alerts';
        else if (saActiveTab === 'messages') window.saMailFolder = saMsgFilter === 'sent' ? 'sent' : 'inbox';
        if (typeof renderMailLayout === 'function') renderMailLayout();
        setTimeout(syncNotificationsScrollButtons, 40);
        return;
    }
    if (window.saViewMode === 'whatsapp') {
        if (typeof renderWhatsAppLayout === 'function') renderWhatsAppLayout();
        setTimeout(syncNotificationsScrollButtons, 40);
        return;
    }

    if (saActiveTab === 'messages') renderOfficeMessagesPane();
    if (saActiveTab === 'compose') renderOfficeComposePane();
    setTimeout(syncNotificationsScrollButtons, 40);
}

function refreshOfficeMessagesUi() {
    updateSaTabBadges(
        Number(document.getElementById('systemAlertsCount')?.textContent || 0),
        Number(document.getElementById('saTabAlertBadge')?.textContent || 0)
    );
    if (window.saViewMode === 'mail') {
        if (typeof renderMailLayout === 'function') renderMailLayout();
        if (typeof updateCommandBoard === 'function') updateCommandBoard();
        setTimeout(syncNotificationsScrollButtons, 40);
        return;
    }
    if (window.saViewMode === 'whatsapp') {
        if (typeof renderWhatsAppLayout === 'function') renderWhatsAppLayout();
        if (typeof updateCommandBoard === 'function') updateCommandBoard();
        setTimeout(syncNotificationsScrollButtons, 40);
        return;
    }
    if (saActiveTab === 'messages') renderOfficeMessagesPane();
    if (saActiveTab === 'compose') renderOfficeComposePane();
    if (typeof updateCommandBoard === 'function') updateCommandBoard();
    setTimeout(syncNotificationsScrollButtons, 40);
}

function initOfficeMessages() {
    wireOfficeMessagesUi();
    if (typeof initMailLayout === 'function') initMailLayout();
    setSaTab(saActiveTab || 'alerts');
    updateSaTabBadges(0, 0);
}

function openUnreadMessagesFromBadge() {
    if (typeof navigateToModule === 'function') {
        try { navigateToModule('dashboard'); } catch (_) { /* ignore */ }
    }

    if (typeof expandDashCollapseByKey === 'function') {
        expandDashCollapseByKey('system-alerts');
    } else {
        const board = document.getElementById('dashCommandBoard');
        board?.classList.remove('is-collapsed');
        const toggle = board?.querySelector('.dash-collapse-toggle');
        if (toggle) toggle.setAttribute('aria-expanded', 'true');
    }

    if (typeof window.saMsgFilter !== 'undefined') window.saMsgFilter = 'unread';
    if (window.saViewMode === 'mail') window.saMailFolder = 'unread';

    if (typeof setSaTab === 'function') setSaTab('messages');

    const panel = document.getElementById('systemAlerts') || document.getElementById('dashCommandBoard');
    panel?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    panel?.classList.add('command-panel-flash');
    setTimeout(() => panel?.classList.remove('command-panel-flash'), 1200);
}

function syncNotificationsScrollButtons() {
    /* Scroll arrow controls removed — native panel scroll only. */
}

function getNotificationsScrollTarget() {
    return null;
}

function wireOfficeMessagesUi() {
    const board = document.getElementById('dashCommandBoard') || document.getElementById('systemAlerts');
    if (!board || board.dataset.omWired === '1') return;
    board.dataset.omWired = '1';

    board.addEventListener('click', (e) => {
        const unreadBadge = e.target.closest('#systemAlertsUnread');
        if (unreadBadge) {
            e.preventDefault();
            e.stopPropagation();
            openUnreadMessagesFromBadge();
            return;
        }
        const tab = e.target.closest('[data-sa-tab]');
        if (tab) {
            e.preventDefault();
            setSaTab(tab.getAttribute('data-sa-tab'));
            return;
        }
        const goto = e.target.closest('[data-sa-goto]');
        if (goto) {
            e.preventDefault();
            setSaTab(goto.getAttribute('data-sa-goto'));
            return;
        }
        const mark = e.target.closest('[data-om-mark-read]');
        if (mark) {
            e.preventDefault();
            markMessageRead(mark.getAttribute('data-om-mark-read'));
            refreshOfficeMessagesUi();
            return;
        }
        const reply = e.target.closest('[data-om-reply]');
        if (reply) {
            e.preventDefault();
            e.stopPropagation();
            startOfficeMessageReply(reply.getAttribute('data-om-reply'));
            return;
        }
        const filter = e.target.closest('[data-om-filter]');
        if (filter) {
            e.preventDefault();
            saMsgFilter = filter.getAttribute('data-om-filter') || 'all';
            renderOfficeMessagesPane();
            return;
        }
        if (e.target.closest('#omMarkAllReadBtn')) {
            e.preventDefault();
            markAllInboxRead();
            return;
        }
        const saveDraft = e.target.closest('[data-om-save-draft]');
        if (saveDraft) {
            e.preventDefault();
            const dest = resolveComposeDestination();
            const draft = saveOfficeDraft({
                toDepartment: dest.to,
                toKind: dest.toKind,
                toLabel: dest.toLabel,
                toUserId: dest.toUserId,
                subject: document.getElementById('omSubject')?.value || '',
                body: document.getElementById('omBody')?.value || '',
                priority: document.getElementById('omPriority')?.value || 'normal',
                messageDate: document.getElementById('omMsgDate')?.value || '',
                dueDate: document.getElementById('omDueDate')?.value || ''
            });
            if (draft && window.saViewMode === 'mail') {
                window.saMailFolder = 'drafts';
                if (typeof renderMailLayout === 'function') renderMailLayout();
            }
            return;
        }
        if (e.target.closest('[data-om-reply], [data-om-mark-read]')) return;
        const card = e.target.closest('.om-card[data-om-id]');
        if (card && saMsgFilter !== 'sent') {
            markMessageRead(card.getAttribute('data-om-id'));
            card.classList.remove('om-unread');
            card.classList.add('om-read');
            const dot = card.querySelector('.om-dot');
            if (dot) {
                dot.classList.add('om-dot-read');
                dot.title = 'Read';
            }
            updateSaTabBadges(
                Number(document.getElementById('systemAlertsCount')?.textContent || 0),
                Number(document.getElementById('saTabAlertBadge')?.textContent || 0)
            );
        }
    });

    board.addEventListener('submit', (e) => {
        if (e.target?.id !== 'omComposeForm') return;
        e.preventDefault();
        const dest = resolveComposeDestination();
        const msg = composeOfficeMessage({
            toDepartment: dest.to,
            toKind: dest.toKind,
            toLabel: dest.toLabel,
            toUserId: dest.toUserId,
            subject: document.getElementById('omSubject')?.value || '',
            body: document.getElementById('omBody')?.value || '',
            priority: document.getElementById('omPriority')?.value || 'normal',
            messageDate: document.getElementById('omMsgDate')?.value || '',
            dueDate: document.getElementById('omDueDate')?.value || ''
        });
        if (msg) {
            saMsgFilter = 'sent';
            setSaTab('messages');
            if (typeof updateCommandBoard === 'function') updateCommandBoard();
        }
    });
}

window.canComposeOfficeMessages = canComposeOfficeMessages;
window.getUnreadMessageCount = getUnreadMessageCount;
window.isAlertUnread = isAlertUnread;
window.markAlertRead = markAlertRead;
window.getUnreadAlertCount = getUnreadAlertCount;
window.updateSaTabBadges = updateSaTabBadges;
window.setSaTab = setSaTab;
window.openUnreadMessagesFromBadge = openUnreadMessagesFromBadge;
window.applySaTabVisibility = applySaTabVisibility;
window.initOfficeMessages = initOfficeMessages;
window.refreshOfficeMessagesUi = refreshOfficeMessagesUi;
window.syncNotificationsScrollButtons = syncNotificationsScrollButtons;
window.getUserHomeDepartment = getUserHomeDepartment;
window.startOfficeMessageReply = startOfficeMessageReply;
window.buildReplySubject = buildReplySubject;
window.buildReplyQuote = buildReplyQuote;
window.resolveReplyToDepartment = resolveReplyToDepartment;
window.syncOfficeComposeToMode = syncOfficeComposeToMode;
window.wireOfficeComposeRecipientFields = wireOfficeComposeRecipientFields;
window.resolveComposeDestination = resolveComposeDestination;
window.OFFICE_BROADCAST = OFFICE_BROADCAST;
window.getInboxMessages = getInboxMessages;
window.getSentMessages = getSentMessages;
window.getTrashMessages = getTrashMessages;
window.getAllMailMessages = getAllMailMessages;
window.getImportantMessages = getImportantMessages;
window.getDraftMessages = getDraftMessages;
window.trashOfficeMessage = trashOfficeMessage;
window.restoreOfficeMessage = restoreOfficeMessage;
window.purgeOfficeMessage = purgeOfficeMessage;
window.emptyTrashMessages = emptyTrashMessages;
window.saveOfficeDraft = saveOfficeDraft;
window.deleteOfficeDraft = deleteOfficeDraft;
window.isMessageTrashed = isMessageTrashed;
window.ensureOfficeMessagesState = ensureOfficeMessagesState;
window.resolveComposeDestination = resolveComposeDestination;
window.composeOfficeMessage = composeOfficeMessage;
window.markMessageRead = markMessageRead;
window.markAllInboxRead = markAllInboxRead;
window.renderOfficeComposePane = renderOfficeComposePane;
