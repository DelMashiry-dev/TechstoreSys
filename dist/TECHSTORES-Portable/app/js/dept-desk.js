/* dept-desk.js — IT Dir department desks: inbox + demand/requisition form (CC Dir/DD/AQSO2/TechStores) */

const DEPT_DESK_DEFS = [
    {
        moduleId: 'dept-sysadmin',
        key: 'sysadmin',
        estKey: 'sysadmin',
        title: 'Systems Administration Desk',
        blurb: 'Sys Admin demand / requisition desk. File equipment, licences and support needs — copied to Dir, DD, AQSO2 and TechStores.'
    },
    {
        moduleId: 'dept-workshop',
        key: 'workshop',
        estKey: 'engr_sp',
        title: 'Workshop Desk',
        blurb: 'Workshop demand / requisition desk (spares, tools, consumables). Repair booking stays on Workshop Register.',
        extraNav: [{ target: 'workshop-repairs', label: 'Workshop Register' }]
    },
    {
        moduleId: 'dept-compengr',
        key: 'compengr',
        estKey: 'compengr',
        title: 'Computer Engineering / DBA Desk',
        blurb: 'DBA / Computer Engineering demand desk for servers, storage, network and engineering support items.'
    },
    {
        moduleId: 'dept-swengr',
        key: 'swengr',
        estKey: 'swengr',
        title: 'Software Engineering Desk',
        blurb: 'Software Engineering demand desk for tools, licences, development and project support items.'
    },
    {
        moduleId: 'dept-ictsec',
        key: 'ictsec',
        estKey: 'ictsec',
        title: 'ICT Security Desk',
        blurb: 'ICT Security demand desk for security tools, certificates, appliances and related support.'
    },
    {
        moduleId: 'dept-itts',
        key: 'itts',
        estKey: 'itts',
        title: 'ITTS Desk',
        blurb: 'ITTS (Training School) demand desk for training equipment, media and school support items.'
    },
    {
        moduleId: 'dept-admin',
        key: 'admin',
        estKey: 'admin_qm',
        title: 'Admin Office Desk',
        blurb: 'Admin Office / AO demand desk for admin ICT support and internal office requirements.'
    },
    {
        moduleId: 'dept-gate',
        key: 'gate',
        estKey: 'admin_qm',
        estNote: 'Gate / RP posts sit under Admin & QM establishment (Administration branch).',
        title: 'Gate / RP Desk',
        blurb: 'Gate / RP demand desk for gate equipment and related support. Gate movements stay on Gate Register.',
        extraNav: [{ target: 'gate-register', label: 'Gate Register' }]
    }
];

function getDeptDeskDef(moduleId) {
    return DEPT_DESK_DEFS.find((d) => d.moduleId === moduleId) || null;
}

function getDeptDeskHtml(moduleId) {
    const def = getDeptDeskDef(moduleId);
    if (!def) return null;
    const dept = typeof getItDirDepartmentByKey === 'function' ? getItDirDepartmentByKey(def.key) : null;
    const office = dept?.value || def.key;
    const p = (id) => `${moduleId}__${id}`;
    const extra = (def.extraNav || []).map((n) =>
        `<button type="button" class="btn btn-ghost btn-sm" data-target-nav="${escapeDept(n.target)}">${escapeDept(n.label)}</button>`
    ).join('');

    return `
<div id="${escapeDept(moduleId)}" class="form-container dept-desk" data-dept-desk="${escapeDept(def.key)}" data-dept-office="${escapeDept(office)}">
    <div class="form-header">
        <h2 class="form-title">${escapeDept(def.title)}</h2>
        <button class="close-btn" type="button">&times;</button>
    </div>
    <p class="req-intro">
        <span class="aso-ref">${escapeDept(office)}</span>
        ${escapeDept(def.blurb)}
        Demands are filed as Unit Requisitions and <strong>Messages</strong> are sent (Compose format) to
        <strong>Dir / DD / AQSO2 / TechStores</strong>.
    </p>

    <div class="dept-desk-grid">
        <section class="dashboard-panel dept-desk-panel">
            <h3 style="margin-top:0;">Department demand / requisition</h3>
            <input type="hidden" id="${p('editId')}" value="">
            <div class="form-row">
                <div class="form-col">
                    <label class="form-label" for="${p('date')}">Date</label>
                    <input type="date" class="form-control" id="${p('date')}">
                </div>
                <div class="form-col">
                    <label class="form-label" for="${p('priority')}">Priority</label>
                    <select class="form-control" id="${p('priority')}">
                        <option value="normal">Normal</option>
                        <option value="immediate">Immediate</option>
                        <option value="urgent">Urgent</option>
                        <option value="critical">Critical</option>
                        <option value="flash">⚡ Flash</option>
                    </select>
                </div>
                <div class="form-col">
                    <label class="form-label" for="${p('qty')}">Qty</label>
                    <input type="number" class="form-control" id="${p('qty')}" min="1" value="1">
                </div>
            </div>
            <div class="form-row">
                <div class="form-col" style="flex:2;">
                    <label class="form-label" for="${p('subject')}">Subject</label>
                    <input type="text" class="form-control" id="${p('subject')}" maxlength="160" placeholder="Short subject for Dir / TechStores">
                </div>
            </div>
            <div class="form-row">
                <div class="form-col" style="flex:2;">
                    <label class="form-label" for="${p('item')}">Item(s) / demand detail</label>
                    <textarea class="form-control" id="${p('item')}" rows="3" maxlength="2000" placeholder="Describe equipment, qty, justification…"></textarea>
                </div>
            </div>
            <div class="form-row">
                <div class="form-col" style="flex:2;">
                    <label class="form-label" for="${p('justification')}">Justification / remarks</label>
                    <input type="text" class="form-control" id="${p('justification')}" maxlength="400" placeholder="Why needed / operational link">
                </div>
            </div>
            <p class="dept-desk-cc">Copy (Messages): Director · DD · AQSO2 · TechStores Office</p>
            <div class="module-actions">
                <button type="button" class="btn btn-primary" data-dept-submit="${escapeDept(moduleId)}">Submit demand &amp; notify command</button>
                <button type="button" class="btn btn-ghost" data-dept-clear="${escapeDept(moduleId)}">Clear</button>
                <button type="button" class="btn btn-ghost btn-sm" data-target-nav="unit-requisitions">Unit Requisitions</button>
                <button type="button" class="btn btn-ghost btn-sm" data-sa-open="compose">Open Compose</button>
                ${extra}
            </div>
        </section>

        <section class="dashboard-panel dept-desk-panel">
            <div class="dept-desk-inbox-head">
                <h3 style="margin-top:0;">Messages for this office</h3>
                <button type="button" class="btn btn-ghost btn-sm" data-dept-refresh="${escapeDept(moduleId)}">Refresh</button>
            </div>
            <div class="dept-desk-inbox" id="${p('inbox')}" aria-live="polite"></div>
            <div class="dept-desk-demands">
                <h4>Recent demands from this desk</h4>
                <div id="${p('demands')}"></div>
            </div>
        </section>
    </div>

    <section class="dashboard-panel dept-desk-panel dept-est-panel" id="${p('establishment')}" data-dept-est-panel>
        <div id="${p('estView')}" class="dept-est-view" aria-label="Department establishment"></div>
        <div class="module-actions" style="margin-top:10px;">
            <button type="button" class="btn btn-ghost btn-sm" data-target-nav="it-dir-comms">Full IT Dir Establishment (Comms)</button>
        </div>
    </section>
</div>`;
}

function escapeDept(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function deptDeskFieldId(moduleId, name) {
    return `${moduleId}__${name}`;
}

function deptDeskEl(moduleId, name) {
    return document.getElementById(deptDeskFieldId(moduleId, name));
}

function clearDeptDeskForm(moduleId) {
    const set = (name, value) => {
        const el = deptDeskEl(moduleId, name);
        if (el) el.value = value;
    };
    set('editId', '');
    set('date', typeof todayIsoLocal === 'function' ? todayIsoLocal() : new Date().toISOString().slice(0, 10));
    set('priority', 'normal');
    set('qty', '1');
    set('subject', '');
    set('item', '');
    set('justification', '');
}

function renderDeptDeskInbox(moduleId) {
    const root = document.getElementById(moduleId);
    const inbox = deptDeskEl(moduleId, 'inbox');
    if (!root || !inbox) return;
    const office = root.getAttribute('data-dept-office') || '';
    const msgs = (typeof ensureOfficeMessagesState === 'function' ? ensureOfficeMessagesState() : [])
        .filter((m) => {
            const to = String(m.toDepartment || '');
            if (to === office) return true;
            if (typeof OFFICE_BROADCAST !== 'undefined' && to === OFFICE_BROADCAST) return true;
            return false;
        })
        .slice(0, 12);

    inbox.innerHTML = msgs.length
        ? msgs.map((m) => {
            const unread = typeof isMessageRead === 'function' ? !isMessageRead(m) : false;
            return `
            <article class="om-card${unread ? ' om-unread' : ' om-read'}" data-om-id="${escapeDept(m.id)}">
                <header class="om-card-head">
                    ${unread ? '<span class="om-dot" title="Unread"></span>' : '<span class="om-dot om-dot-read"></span>'}
                    <span class="om-pri om-pri-${escapeDept(typeof normalizeMessagePriority === 'function' ? normalizeMessagePriority(m.priority) : (m.priority || 'normal'))}">${escapeDept((typeof getMessagePriorityMeta === 'function' ? getMessagePriorityMeta(m.priority)?.short : null) || m.priority || 'normal')}</span>
                    <span class="om-kind">Dept</span>
                    <strong class="om-subject">${escapeDept(m.subject)}</strong>
                    <span class="om-when">${escapeDept(typeof omFormatWhen === 'function' ? omFormatWhen(m.createdAt) : (m.createdAt || '').slice(0, 16))}</span>
                </header>
                <div class="om-meta">
                    <span><em>From</em> ${escapeDept(m.fromName)} · ${escapeDept(m.fromOffice || m.fromRoleLabel || '')}</span>
                    <span><em>To</em> ${escapeDept(m.toLabel || m.toDepartment)}</span>
                </div>
                <p class="om-body">${escapeDept(m.body)}</p>
                <div class="om-card-actions">
                    <button type="button" class="btn btn-primary btn-sm" data-dept-reply="${escapeDept(m.id)}">Reply</button>
                </div>
            </article>`;
        }).join('')
        : '<div class="alert-item alert-success-item">No messages for this office yet. Orderly Room / Compose can write here.</div>';
}

function renderDeptDeskDemands(moduleId) {
    const root = document.getElementById(moduleId);
    const box = deptDeskEl(moduleId, 'demands');
    if (!root || !box || typeof ensureRequisitions !== 'function') return;
    const office = root.getAttribute('data-dept-office') || '';
    const rows = ensureRequisitions()
        .filter((r) => r.originDepartment === office || r.sourceDesk === moduleId)
        .slice(0, 8);

    box.innerHTML = rows.length
        ? `<table class="data-table cf-table"><thead><tr><th>Date</th><th>Ref</th><th>Subject</th><th>Status</th><th>Pri</th></tr></thead><tbody>
            ${rows.map((r) => `
                <tr>
                    <td>${escapeDept(r.receivedDate || '—')}</td>
                    <td>${escapeDept(r.reqNo || '—')}</td>
                    <td>${escapeDept(r.subject || r.itemDescription || '—')}</td>
                    <td>${escapeDept(r.status || '—')}</td>
                    <td>${escapeDept(r.priority || 'normal')}</td>
                </tr>
            `).join('')}
           </tbody></table>`
        : '<p class="muted">No demands filed from this desk yet.</p>';
}

function renderDeptDeskEstablishment(moduleId) {
    const def = getDeptDeskDef(moduleId);
    const host = deptDeskEl(moduleId, 'estView');
    if (!def || !host) return;
    if (typeof renderItDirEstablishmentDeptHtml === 'function') {
        host.innerHTML = renderItDirEstablishmentDeptHtml(def.estKey || def.key, { note: def.estNote || '' });
    } else {
        host.innerHTML = '<div class="dept-est-empty muted">Establishment data not loaded.</div>';
    }
}

function focusDeptDeskEstablishment(moduleId) {
    const panel = deptDeskEl(moduleId, 'establishment');
    if (!panel) return;
    panel.classList.add('dept-est-flash');
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => panel.classList.remove('dept-est-flash'), 1400);
}

function renderDeptDeskModule(moduleId) {
    if (!document.getElementById(moduleId)) return;
    renderDeptDeskInbox(moduleId);
    renderDeptDeskDemands(moduleId);
    renderDeptDeskEstablishment(moduleId);
}

function submitDeptDeskDemand(moduleId) {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;
    const def = getDeptDeskDef(moduleId);
    const root = document.getElementById(moduleId);
    if (!def || !root) return;

    const office = root.getAttribute('data-dept-office') || '';
    const subject = (deptDeskEl(moduleId, 'subject')?.value || '').trim();
    const item = (deptDeskEl(moduleId, 'item')?.value || '').trim();
    const justification = (deptDeskEl(moduleId, 'justification')?.value || '').trim();
    const priority = typeof normalizeMessagePriority === 'function'
        ? normalizeMessagePriority(deptDeskEl(moduleId, 'priority')?.value || 'normal')
        : (deptDeskEl(moduleId, 'priority')?.value || 'normal');
    const qty = Math.max(1, parseInt(deptDeskEl(moduleId, 'qty')?.value || '1', 10) || 1);
    const dateIn = deptDeskEl(moduleId, 'date')?.value
        || (typeof todayIsoLocal === 'function' ? todayIsoLocal() : new Date().toISOString().slice(0, 10));

    if (!subject && !item) {
        showToast('Enter a subject or item detail.', 'error');
        deptDeskEl(moduleId, 'subject')?.focus();
        return;
    }
    if (typeof ensureRequisitions !== 'function') {
        showToast('Requisitions module not available.', 'error');
        return;
    }

    const now = new Date().toISOString();
    const deptLabel = (typeof getItDirDepartmentByKey === 'function' ? getItDirDepartmentByKey(def.key)?.label : null) || def.title;
    const list = ensureRequisitions();
    const req = {
        id: `req-desk-${Date.now()}`,
        receivedDate: dateIn,
        itDirStampDate: dateIn,
        reqNo: typeof nextRequisitionNo === 'function' ? nextRequisitionNo() : `REQ-${Date.now()}`,
        unit: deptLabel,
        originUnitDetail: office,
        originDepartment: office,
        originRef: '',
        requestedBy: currentUser?.name || currentUser?.username || '',
        contact: '',
        fileRef: typeof REQ_FILE_IT_34_1 !== 'undefined' ? REQ_FILE_IT_34_1 : 'IT/34/1',
        correspondenceFile: typeof REQ_FILE_IT_34_1 !== 'undefined' ? REQ_FILE_IT_34_1 : 'IT/34/1',
        docType: 'department_demand',
        actionInfo: 'Action: TechStores · Info: Dir / DD / AQSO2 (department demand)',
        subject: subject || item.slice(0, 120),
        justification: justification || `Internal demand from ${deptLabel}.`,
        category: 'ict-equipment',
        itemDescription: item || subject,
        qty,
        priority,
        status: 'received',
        notes: `Filed from ${def.title}. Messages copied to Dir / DD / AQSO2 / TechStores.`,
        actionedDate: '',
        minuteSheet: typeof createBlankMinuteSheet === 'function' ? createBlankMinuteSheet() : [],
        createdAt: now,
        updatedAt: now,
        source: 'dept-desk',
        sourceDesk: moduleId
    };
    list.unshift(req);

    const ccValues = typeof itDirDepartmentValues === 'function'
        ? itDirDepartmentValues(typeof IT_DIR_DEMAND_CC !== 'undefined' ? IT_DIR_DEMAND_CC : ['dir', 'dd', 'aqso2', 'techstores'])
        : [
            "IT DIR DIRECTOR'S OFFICE",
            "IT DIR DD'S OFFICE",
            "IT DIR AQSO2'S OFFICE",
            'IT DIR TECHSTORES OFFICE'
        ];

    const body = [
        `Department demand from ${deptLabel}.`,
        `Ref: ${req.reqNo}`,
        `Subject: ${req.subject}`,
        `Item(s): ${req.itemDescription}`,
        `Qty: ${qty}`,
        `Priority: ${String(priority).toUpperCase()}`,
        justification ? `Justification: ${justification}` : '',
        'Filed under Unit Requisitions. Please action / minute as required.'
    ].filter(Boolean).join('\n');

    const notified = typeof sendOfficeMessagesToDepartments === 'function'
        ? sendOfficeMessagesToDepartments({
            departments: ccValues,
            subject: `Dept demand: ${req.reqNo} — ${req.subject}`.slice(0, 160),
            body,
            priority,
            toKind: 'it_dir_dept',
            source: 'dept-desk',
            meta: { reqId: req.id, desk: moduleId },
            force: true
        })
        : 0;

    if (typeof saveState === 'function') saveState();
    clearDeptDeskForm(moduleId);
    renderDeptDeskModule(moduleId);
    if (typeof updateSystemAlerts === 'function') updateSystemAlerts();
    if (typeof refreshOfficeMessagesUi === 'function') refreshOfficeMessagesUi();
    if (typeof renderRequisitionsModule === 'function') renderRequisitionsModule();

    showToast(
        notified
            ? `Demand ${req.reqNo} filed and ${notified} Messages sent to Dir / DD / AQSO2 / TechStores.`
            : `Demand ${req.reqNo} filed.`,
        'success'
    );
}

function wireDeptDeskModule(moduleId) {
    const root = document.getElementById(moduleId);
    if (!root || root.dataset.deptWired === '1') return;
    root.dataset.deptWired = '1';

    clearDeptDeskForm(moduleId);

    root.addEventListener('click', (e) => {
        const nav = e.target.closest('[data-target-nav]')?.getAttribute('data-target-nav');
        if (nav && typeof navigateToModule === 'function') {
            e.preventDefault();
            navigateToModule(nav);
            return;
        }
        if (e.target.closest('[data-sa-open]')) {
            e.preventDefault();
            if (typeof navigateToModule === 'function') navigateToModule('dashboard');
            setTimeout(() => {
                if (typeof setSaTab === 'function') setSaTab('compose');
                document.getElementById('systemAlerts')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 80);
            return;
        }
        if (e.target.closest(`[data-dept-submit="${moduleId}"]`)) {
            e.preventDefault();
            submitDeptDeskDemand(moduleId);
            return;
        }
        if (e.target.closest(`[data-dept-clear="${moduleId}"]`)) {
            e.preventDefault();
            clearDeptDeskForm(moduleId);
            return;
        }
        if (e.target.closest(`[data-dept-refresh="${moduleId}"]`)) {
            e.preventDefault();
            renderDeptDeskModule(moduleId);
            return;
        }
        const replyBtn = e.target.closest('[data-dept-reply]');
        if (replyBtn) {
            e.preventDefault();
            e.stopPropagation();
            if (typeof navigateToModule === 'function') navigateToModule('dashboard');
            setTimeout(() => {
                if (typeof startOfficeMessageReply === 'function') {
                    startOfficeMessageReply(replyBtn.getAttribute('data-dept-reply'));
                }
                document.getElementById('systemAlerts')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
            return;
        }
        if (e.target.closest('[data-dept-reply]')) return;
        const omId = e.target.closest('.om-card[data-om-id]')?.getAttribute('data-om-id');
        if (omId && typeof markMessageRead === 'function') {
            markMessageRead(omId);
            renderDeptDeskInbox(moduleId);
            if (typeof refreshOfficeMessagesUi === 'function') refreshOfficeMessagesUi();
        }
    });
}

function initDeptDeskModule(moduleId) {
    if (!getDeptDeskDef(moduleId)) return;
    wireDeptDeskModule(moduleId);
    renderDeptDeskModule(moduleId);
}

function initAllDeptDeskModules() {
    DEPT_DESK_DEFS.forEach((d) => {
        if (document.getElementById(d.moduleId)) initDeptDeskModule(d.moduleId);
    });
}

window.DEPT_DESK_DEFS = DEPT_DESK_DEFS;
window.getDeptDeskHtml = getDeptDeskHtml;
window.initDeptDeskModule = initDeptDeskModule;
window.focusDeptDeskEstablishment = focusDeptDeskEstablishment;
window.renderDeptDeskEstablishment = renderDeptDeskEstablishment;
window.initAllDeptDeskModules = initAllDeptDeskModules;
window.renderDeptDeskModule = renderDeptDeskModule;
