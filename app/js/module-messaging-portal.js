/* module-messaging-portal.js — embed Messages inbox + Compose on operational modules (Gate, Workshop, …) */

const MODULE_MSG_PORTALS = [
    {
        moduleId: 'gate-register',
        portalId: 'gateMsgPortal',
        office: 'IT DIR GATE / RP',
        officeLabel: 'Gate / RP',
        title: 'Gate messaging portal',
        lead: 'Same format as Notifications → Messages. Write to TechStores, Workshop, Orderly Room, Dir / DD / AQSO2 and other IT Dir offices about gate bookings, holds, or handovers.'
    },
    {
        moduleId: 'workshop-repairs',
        portalId: 'workshopMsgPortal',
        office: 'IT ENGINEERING SUPPORT DEPT (WORKSHOP)',
        officeLabel: 'Workshop',
        title: 'Workshop messaging portal',
        lead: 'Compose Messages about repair jobs, SVCS 1045, spares or handover — recipients see unread badges under Notifications → Messages.'
    },
    {
        moduleId: 'techstores-equipment-register',
        portalId: 'equipMsgPortal',
        office: 'IT DIR TECHSTORES OFFICE',
        officeLabel: 'TechStores',
        title: 'TechStores messaging portal',
        lead: 'Message Gate, Workshop, Orderly Room or command about equipment custody lines.'
    }
];

function getModuleMsgPortalDef(moduleId) {
    return MODULE_MSG_PORTALS.find((p) => p.moduleId === moduleId) || null;
}

function mmEscape(value) {
    if (typeof omEscape === 'function') return omEscape(value);
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function mmFormatWhen(iso) {
    if (typeof omFormatWhen === 'function') return omFormatWhen(iso);
    return String(iso || '').slice(0, 16) || '—';
}

function ensureModuleMsgPortalShell(def) {
    const root = document.getElementById(def.moduleId);
    if (!root) return null;
    let portal = document.getElementById(def.portalId);
    const needsRebuild = portal && !portal.querySelector('[data-mod-msg-quick]');
    if (portal && !needsRebuild) return portal;
    if (needsRebuild) {
        portal.remove();
        portal = null;
    }

    const itDirOpts = typeof itDirDepartmentOptionsHtml === 'function'
        ? itDirDepartmentOptionsHtml()
        : '<option value="IT DIR TECHSTORES OFFICE">TechStores Office</option>';

    portal = document.createElement('section');
    portal.id = def.portalId;
    portal.className = 'mod-msg-portal dashboard-panel';
    portal.setAttribute('data-mod-msg-office', def.office);
    portal.innerHTML = `
        <div class="mod-msg-head">
            <div>
                <h3 style="margin:0 0 4px;">${mmEscape(def.title)}</h3>
                <p class="mod-msg-lead">${mmEscape(def.lead)}</p>
            </div>
            <div class="mod-msg-tabs" role="tablist">
                <button type="button" class="mod-msg-tab is-active" data-mod-msg-tab="inbox" aria-selected="true">Inbox</button>
                <button type="button" class="mod-msg-tab" data-mod-msg-tab="compose" aria-selected="false">More options</button>
            </div>
        </div>
        <form class="mod-msg-quick-send" data-mod-msg-form data-mod-msg-quick>
            <div class="mod-msg-quick-row">
                <label class="ad-field mod-msg-quick-to">
                    <span>To</span>
                    <select class="form-control" data-mod-msg-to required>
                        <option value="">Select department…</option>
                        ${itDirOpts}
                    </select>
                </label>
                <label class="ad-field mod-msg-quick-subject">
                    <span>Subject</span>
                    <input type="text" class="form-control" data-mod-msg-subject maxlength="160" placeholder="Short subject" required>
                </label>
            </div>
            <div class="mod-msg-quick-row mod-msg-quick-body-row">
                <label class="ad-field mod-msg-quick-body">
                    <span>Message</span>
                    <textarea class="form-control" data-mod-msg-body rows="2" maxlength="2000" placeholder="Write your message…" required></textarea>
                </label>
                <button type="submit" class="btn btn-primary mod-msg-send-btn" title="Send message">Send</button>
            </div>
            <input type="hidden" data-mod-msg-priority value="high">
            <input type="hidden" data-mod-msg-due value="">
            <input type="hidden" data-mod-msg-from value="">
        </form>
        <div class="mod-msg-pane" data-mod-msg-pane="inbox">
            <div class="mod-msg-inbox-toolbar">
                <span class="mod-msg-unread" data-mod-msg-unread>0 unread</span>
                <button type="button" class="btn btn-ghost btn-sm" data-mod-msg-refresh>Refresh</button>
                <button type="button" class="btn btn-ghost btn-sm" data-mod-msg-mark-all>Mark all read</button>
            </div>
            <div class="mod-msg-inbox" data-mod-msg-inbox aria-live="polite"></div>
        </div>
        <div class="mod-msg-pane" data-mod-msg-pane="compose" hidden>
            <div class="mod-msg-more om-compose">
                <p class="mod-msg-lead" style="margin-bottom:10px;">Optional: set priority, due date, and copy other offices. Then press <strong>Send</strong> above.</p>
                <div class="om-compose-grid">
                    <label class="ad-field">
                        <span>Priority</span>
                        <select class="form-control" data-mod-msg-priority-ui>
                            <option value="normal">Normal</option>
                            <option value="immediate" selected>Immediate</option>
                            <option value="urgent">Urgent</option>
                            <option value="critical">Critical</option>
                            <option value="flash">⚡ Flash</option>
                        </select>
                    </label>
                    <label class="ad-field">
                        <span>Message date</span>
                        <input type="date" class="form-control" data-mod-msg-date-ui data-date-rule="not-future" data-date-label="Message date">
                    </label>
                    <label class="ad-field">
                        <span>Action due (optional)</span>
                        <input type="date" class="form-control" data-mod-msg-due-ui data-date-rule="not-past" data-date-label="Action due">
                    </label>
                    <label class="ad-field om-span-2">
                        <span>Also copy</span>
                        <div class="mod-msg-cc">
                            <label><input type="checkbox" data-mod-msg-cc="dir"> Dir</label>
                            <label><input type="checkbox" data-mod-msg-cc="dd"> DD</label>
                            <label><input type="checkbox" data-mod-msg-cc="aqso2"> AQSO2</label>
                            <label><input type="checkbox" data-mod-msg-cc="techstores"> TechStores</label>
                            <label><input type="checkbox" data-mod-msg-cc="orderly"> Orderly Room</label>
                            <label><input type="checkbox" data-mod-msg-cc="workshop"> Workshop</label>
                        </div>
                    </label>
                </div>
                <div class="om-compose-actions">
                    <button type="button" class="btn btn-primary mod-msg-send-btn" data-mod-msg-send>Send</button>
                    <button type="button" class="btn btn-ghost" data-mod-msg-tab="inbox">Back to inbox</button>
                </div>
            </div>
        </div>
    `;

    const actions = root.querySelector('.module-actions');
    if (actions && actions.parentNode) actions.insertAdjacentElement('afterend', portal);
    else root.appendChild(portal);
    const dateUi = portal.querySelector('[data-mod-msg-date-ui]');
    if (dateUi && !dateUi.value && typeof todayIsoLocal === 'function') dateUi.value = todayIsoLocal();
    if (typeof applyDateInputConstraints === 'function') applyDateInputConstraints(portal);
    return portal;
}

function getModuleMsgInbox(office) {
    const list = typeof ensureOfficeMessagesState === 'function' ? ensureOfficeMessagesState() : [];
    return list.filter((m) => {
        const to = String(m.toDepartment || '');
        if (to === office) return true;
        if (typeof OFFICE_BROADCAST !== 'undefined' && to === OFFICE_BROADCAST) return true;
        return false;
    });
}

function renderModuleMsgInbox(portal) {
    if (!portal) return;
    const office = portal.getAttribute('data-mod-msg-office') || '';
    const box = portal.querySelector('[data-mod-msg-inbox]');
    const unreadEl = portal.querySelector('[data-mod-msg-unread]');
    if (!box) return;

    const msgs = getModuleMsgInbox(office).slice(0, 20);
    const unread = msgs.filter((m) => typeof isMessageRead === 'function' ? !isMessageRead(m) : true).length;
    if (unreadEl) unreadEl.textContent = `${unread} unread`;

    box.innerHTML = msgs.length
        ? msgs.map((m) => {
            const isUnread = typeof isMessageRead === 'function' ? !isMessageRead(m) : false;
            return `
            <article class="om-card${isUnread ? ' om-unread' : ' om-read'}${m.priority === 'urgent' || m.priority === 'critical' ? ' om-urgent' : ''}" data-om-id="${mmEscape(m.id)}">
                <header class="om-card-head">
                    ${isUnread ? '<span class="om-dot" title="Unread"></span>' : '<span class="om-dot om-dot-read" title="Read"></span>'}
                    <span class="om-pri om-pri-${mmEscape(m.priority || 'normal')}">${mmEscape(m.priority || 'normal')}</span>
                    <span class="om-kind">IT Dir</span>
                    <strong class="om-subject">${mmEscape(m.subject)}</strong>
                    <span class="om-when">${mmEscape(mmFormatWhen(m.createdAt))}</span>
                </header>
                <div class="om-meta">
                    <span><em>From</em> ${mmEscape(m.fromName)} · ${mmEscape(m.fromOffice || m.fromRoleLabel || '')}</span>
                    <span><em>To</em> ${mmEscape(m.toLabel || m.toDepartment)}</span>
                    ${m.dueDate ? `<span><em>Due</em> ${mmEscape(m.dueDate)}</span>` : ''}
                </div>
                <p class="om-body">${mmEscape(m.body)}</p>
                <div class="om-card-actions">
                    <button type="button" class="btn btn-primary btn-sm" data-mod-msg-reply="${mmEscape(m.id)}">Reply</button>
                </div>
            </article>`;
        }).join('')
        : '<div class="alert-item alert-success-item">No messages for this office yet. Use Compose, or wait for Orderly Room / other desks to write here.</div>';
}

function startModuleMsgReply(portal, msgId) {
    const list = typeof ensureOfficeMessagesState === 'function' ? ensureOfficeMessagesState() : [];
    const msg = list.find((m) => m.id === msgId);
    if (!msg) {
        showToast('Original message not found.', 'error');
        return;
    }
    if (typeof markMessageRead === 'function') markMessageRead(msgId);

    const to = typeof resolveReplyToDepartment === 'function'
        ? resolveReplyToDepartment(msg)
        : (msg.fromOffice || '');
    const subject = typeof buildReplySubject === 'function'
        ? buildReplySubject(msg.subject)
        : `Re: ${msg.subject || ''}`;
    const quote = typeof buildReplyQuote === 'function'
        ? buildReplyQuote(msg)
        : `\n\n---\n${msg.body || ''}`;

    const toEl = portal.querySelector('[data-mod-msg-to]');
    const subEl = portal.querySelector('[data-mod-msg-subject]');
    const bodyEl = portal.querySelector('[data-mod-msg-body]');
    if (toEl && to) {
        if (![...toEl.options].some((o) => o.value === to)) {
            const opt = document.createElement('option');
            opt.value = to;
            opt.textContent = msg.fromOffice || to;
            toEl.appendChild(opt);
        }
        toEl.value = to;
    }
    if (subEl) subEl.value = subject;
    if (bodyEl) {
        bodyEl.value = quote;
        bodyEl.focus();
        bodyEl.setSelectionRange(0, 0);
    }
    setModuleMsgTab(portal, 'inbox');
    portal.querySelector('[data-mod-msg-form]')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    showToast('Reply ready — type above the original text, then Send.', 'info');
    renderModuleMsgInbox(portal);
}

function setModuleMsgTab(portal, tab) {
    if (!portal) return;
    portal.querySelectorAll('[data-mod-msg-tab]').forEach((btn) => {
        const active = btn.getAttribute('data-mod-msg-tab') === tab;
        btn.classList.toggle('is-active', active);
        btn.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    portal.querySelectorAll('[data-mod-msg-pane]').forEach((pane) => {
        const show = pane.getAttribute('data-mod-msg-pane') === tab;
        pane.hidden = !show;
    });
    if (tab === 'inbox') renderModuleMsgInbox(portal);
    if (tab === 'compose') {
        const from = portal.querySelector('[data-mod-msg-from]');
        if (from) {
            const role = (typeof ROLE_LABELS !== 'undefined' ? ROLE_LABELS[currentUser?.role] : '') || currentUser?.role || '';
            const home = typeof getUserHomeDepartment === 'function' ? getUserHomeDepartment() : '';
            from.value = `${currentUser?.name || currentUser?.username || 'Officer'} · ${role} · ${home}`;
        }
    }
}

function submitModuleMsgCompose(portal, def) {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;
    const form = portal.querySelector('[data-mod-msg-form]');
    if (!form) return;

    // Sync optional fields from "More options" into hidden inputs
    const priUi = portal.querySelector('[data-mod-msg-priority-ui]');
    const dueUi = portal.querySelector('[data-mod-msg-due-ui]');
    const dateUi = portal.querySelector('[data-mod-msg-date-ui]');
    const priHidden = form.querySelector('[data-mod-msg-priority]');
    const dueHidden = form.querySelector('[data-mod-msg-due]');
    if (priUi && priHidden) priHidden.value = priUi.value || 'high';
    if (dueUi && dueHidden) dueHidden.value = dueUi.value || '';

    const to = (form.querySelector('[data-mod-msg-to]')?.value || '').trim();
    const subject = (form.querySelector('[data-mod-msg-subject]')?.value || '').trim();
    const body = (form.querySelector('[data-mod-msg-body]')?.value || '').trim();
    const priority = priHidden?.value || priUi?.value || 'high';
    const dueDate = dueHidden?.value || dueUi?.value || '';
    const messageDate = dateUi?.value || '';

    if (!to) {
        showToast('Select the receiving IT Dir office.', 'error');
        form.querySelector('[data-mod-msg-to]')?.focus();
        return;
    }
    if (!subject || !body) {
        showToast('Enter subject and message.', 'error');
        (form.querySelector('[data-mod-msg-subject]') || form.querySelector('[data-mod-msg-body]'))?.focus();
        return;
    }
    if (typeof assertMessageDates === 'function' && !assertMessageDates({ messageDate, dueDate })) {
        return;
    }

    const ccKeys = [...portal.querySelectorAll('[data-mod-msg-cc]:checked')]
        .map((cb) => cb.getAttribute('data-mod-msg-cc'))
        .filter(Boolean);
    const ccValues = typeof itDirDepartmentValues === 'function' ? itDirDepartmentValues(ccKeys) : [];
    const departments = [...new Set([to, ...ccValues])];

    const n = typeof sendOfficeMessagesToDepartments === 'function'
        ? sendOfficeMessagesToDepartments({
            departments,
            subject,
            body,
            priority,
            messageDate,
            dueDate,
            toKind: 'it_dir_dept',
            source: def.moduleId,
            meta: { portal: def.portalId },
            force: true
        })
        : 0;

    if (!n) {
        showToast('Could not send message.', 'error');
        return;
    }

    if (typeof saveState === 'function') saveState();
    form.querySelector('[data-mod-msg-subject]').value = '';
    form.querySelector('[data-mod-msg-body]').value = '';
    if (priHidden) priHidden.value = 'high';
    if (dueHidden) dueHidden.value = '';
    if (priUi) priUi.value = 'high';
    if (dueUi) dueUi.value = '';
    if (dateUi) dateUi.value = typeof todayIsoLocal === 'function' ? todayIsoLocal() : '';
    portal.querySelectorAll('[data-mod-msg-cc]').forEach((cb) => { cb.checked = false; });
    setModuleMsgTab(portal, 'inbox');
    renderModuleMsgInbox(portal);
    if (typeof refreshOfficeMessagesUi === 'function') refreshOfficeMessagesUi();
    if (typeof updateSystemAlerts === 'function') updateSystemAlerts();
    showToast(`Sent ${n} message(s) from ${def.officeLabel}.`, 'success');
}

function wireModuleMsgPortal(def) {
    const portal = ensureModuleMsgPortalShell(def);
    if (!portal || portal.dataset.modMsgWired === '1') {
        if (portal) renderModuleMsgInbox(portal);
        return portal;
    }
    portal.dataset.modMsgWired = '1';

    const root = document.getElementById(def.moduleId);
    root?.querySelector(`[data-mod-msg-jump="${def.portalId}"]`)?.addEventListener('click', (e) => {
        e.preventDefault();
        portal.scrollIntoView({ behavior: 'smooth', block: 'start' });
        portal.querySelector('[data-mod-msg-to]')?.focus();
    });

    portal.addEventListener('click', (e) => {
        const tabBtn = e.target.closest('[data-mod-msg-tab]');
        if (tabBtn) {
            e.preventDefault();
            setModuleMsgTab(portal, tabBtn.getAttribute('data-mod-msg-tab') || 'inbox');
            return;
        }
        if (e.target.closest('[data-mod-msg-send]')) {
            e.preventDefault();
            submitModuleMsgCompose(portal, def);
            return;
        }
        if (e.target.closest('[data-mod-msg-refresh]')) {
            e.preventDefault();
            renderModuleMsgInbox(portal);
            return;
        }
        if (e.target.closest('[data-mod-msg-mark-all]')) {
            e.preventDefault();
            const office = portal.getAttribute('data-mod-msg-office') || '';
            getModuleMsgInbox(office).forEach((m) => {
                if (typeof markMessageRead === 'function') markMessageRead(m.id);
            });
            renderModuleMsgInbox(portal);
            if (typeof refreshOfficeMessagesUi === 'function') refreshOfficeMessagesUi();
            return;
        }
        const replyBtn = e.target.closest('[data-mod-msg-reply]');
        if (replyBtn) {
            e.preventDefault();
            e.stopPropagation();
            startModuleMsgReply(portal, replyBtn.getAttribute('data-mod-msg-reply'));
            return;
        }
        if (e.target.closest('[data-mod-msg-reply], [data-mod-msg-send]')) return;
        const card = e.target.closest('.om-card[data-om-id]');
        if (card && typeof markMessageRead === 'function') {
            markMessageRead(card.getAttribute('data-om-id'));
            renderModuleMsgInbox(portal);
            if (typeof refreshOfficeMessagesUi === 'function') refreshOfficeMessagesUi();
        }
    });

    portal.querySelector('[data-mod-msg-form]')?.addEventListener('submit', (e) => {
        e.preventDefault();
        submitModuleMsgCompose(portal, def);
    });

    setModuleMsgTab(portal, 'inbox');
    return portal;
}

function initModuleMessagingPortal(moduleId) {
    const def = getModuleMsgPortalDef(moduleId);
    if (!def) return;
    if (!document.getElementById(moduleId)) return;
    wireModuleMsgPortal(def);
}

function initAllModuleMessagingPortals() {
    MODULE_MSG_PORTALS.forEach((def) => {
        if (document.getElementById(def.moduleId)) wireModuleMsgPortal(def);
    });
}

window.initModuleMessagingPortal = initModuleMessagingPortal;
window.initAllModuleMessagingPortals = initAllModuleMessagingPortals;
window.MODULE_MSG_PORTALS = MODULE_MSG_PORTALS;
