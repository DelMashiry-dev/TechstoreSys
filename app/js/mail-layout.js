/* mail-layout.js — Gmail-style alternative layout for System Alerts / Inbox / Compose */

const SA_VIEW_KEY = 'techstores_sa_view_v1';
window.saViewMode = window.saViewMode || 'cards'; // cards | mail | whatsapp
window.saMailFolder = window.saMailFolder || 'inbox'; // inbox | unread | starred | sent | drafts | important | all | trash | alerts | compose
window.saMailOpenId = window.saMailOpenId || '';
window.saMailOpenKind = window.saMailOpenKind || ''; // message | alert | draft
window.saMailMoreOpen = window.saMailMoreOpen !== undefined ? window.saMailMoreOpen : true;

function loadSaViewMode() {
    try {
        const v = localStorage.getItem(SA_VIEW_KEY);
        if (v === 'mail' || v === 'cards' || v === 'whatsapp') window.saViewMode = v;
    } catch (_) { /* ignore */ }
    return window.saViewMode;
}

function setSaViewMode(mode) {
    const next = mode === 'mail' ? 'mail' : (mode === 'whatsapp' ? 'whatsapp' : 'cards');
    window.saViewMode = next;
    try { localStorage.setItem(SA_VIEW_KEY, window.saViewMode); } catch (_) { /* ignore */ }
    syncSaViewToggleUi();
    applySaViewMode();
    if (window.saViewMode === 'mail') {
        renderMailLayout();
        return;
    }
    if (window.saViewMode === 'whatsapp') {
        if (typeof renderWhatsAppLayout === 'function') renderWhatsAppLayout();
        return;
    }
    // Restore classic Cards tabs + panes
    if (typeof setSaTab === 'function') setSaTab(window.saActiveTab || 'alerts');
    if (typeof updateCommandBoard === 'function') updateCommandBoard();
    else if (typeof updateSystemAlerts === 'function') updateSystemAlerts();
}

function syncSaViewToggleUi() {
    document.querySelectorAll('[data-sa-view]').forEach((btn) => {
        const on = btn.getAttribute('data-sa-view') === window.saViewMode;
        btn.classList.toggle('is-active', on);
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
}

function applySaViewMode() {
    const root = document.getElementById('systemAlerts');
    const mail = document.getElementById('saMailShell');
    const wa = document.getElementById('saWaShell');
    const tabs = document.getElementById('saTabs');
    const panes = [
        document.getElementById('systemAlertsList'),
        document.getElementById('systemMessagesList'),
        document.getElementById('systemComposePane')
    ];
    const isMail = window.saViewMode === 'mail';
    const isWa = window.saViewMode === 'whatsapp';
    const isCards = !isMail && !isWa;
    root?.classList.toggle('sa-view-mail', isMail);
    root?.classList.toggle('sa-view-whatsapp', isWa);
    root?.classList.toggle('sa-view-cards', isCards);
    if (typeof syncSaWinUi === 'function') syncSaWinUi();

    const hideClassic = isMail || isWa;
    if (hideClassic) {
        if (tabs) tabs.hidden = true;
        panes.forEach((el) => {
            if (!el) return;
            el.hidden = true;
            el.classList.add('sa-pane-hidden');
        });
    } else {
        if (tabs) {
            tabs.hidden = false;
            tabs.removeAttribute('hidden');
            tabs.style.display = '';
        }
        if (typeof applySaTabVisibility === 'function') applySaTabVisibility();
    }

    if (mail) {
        if (isMail) {
            mail.hidden = false;
            mail.removeAttribute('hidden');
            mail.classList.remove('sa-pane-hidden');
        } else {
            mail.hidden = true;
            mail.setAttribute('hidden', '');
            mail.classList.add('sa-pane-hidden');
            mail.innerHTML = '';
        }
    }
    if (wa) {
        if (isWa) {
            wa.hidden = false;
            wa.removeAttribute('hidden');
            wa.classList.remove('sa-pane-hidden');
        } else {
            wa.hidden = true;
            wa.setAttribute('hidden', '');
            wa.classList.add('sa-pane-hidden');
            wa.innerHTML = '';
        }
    }
    if (typeof syncNotificationsScrollButtons === 'function') {
        setTimeout(syncNotificationsScrollButtons, 40);
    }
}

function ensureMessageStarState(msg) {
    if (!msg.starredBy || typeof msg.starredBy !== 'object') msg.starredBy = {};
    return msg.starredBy;
}

function isMessageStarred(msg, user = currentUser) {
    const key = typeof currentUserKey === 'function' ? currentUserKey(user) : (user?.id || user?.username || '');
    if (!key || !msg) return false;
    return !!(msg.starredBy && msg.starredBy[key]);
}

function toggleMessageStar(msgId) {
    const list = typeof ensureOfficeMessagesState === 'function' ? ensureOfficeMessagesState() : [];
    const msg = list.find((m) => m.id === msgId);
    if (!msg) return;
    const key = typeof currentUserKey === 'function' ? currentUserKey() : (currentUser?.id || currentUser?.username || '');
    if (!key) return;
    const stars = ensureMessageStarState(msg);
    if (stars[key]) delete stars[key];
    else stars[key] = new Date().toISOString();
    if (typeof saveState === 'function') saveState();
    renderMailLayout();
    if (typeof refreshOfficeMessagesUi === 'function' && window.saViewMode !== 'mail' && window.saViewMode !== 'whatsapp') refreshOfficeMessagesUi();
}

function getCachedDeskAlerts() {
    return Array.isArray(window.__saCachedAlerts) ? window.__saCachedAlerts : [];
}

function mailFolderCounts() {
    const inbox = typeof getInboxMessages === 'function' ? getInboxMessages() : [];
    const sent = typeof getSentMessages === 'function' ? getSentMessages() : [];
    const trash = typeof getTrashMessages === 'function' ? getTrashMessages() : [];
    const all = typeof getAllMailMessages === 'function' ? getAllMailMessages() : [];
    const important = typeof getImportantMessages === 'function' ? getImportantMessages() : [];
    const drafts = typeof getDraftMessages === 'function' ? getDraftMessages() : [];
    const unread = inbox.filter((m) => typeof isMessageRead === 'function' ? !isMessageRead(m) : true);
    const starred = all.filter((m) => isMessageStarred(m));
    const alerts = getCachedDeskAlerts();
    const alertUnread = alerts.filter((a) => typeof isAlertUnread === 'function' ? isAlertUnread(a.deskId) : false);
    return {
        inbox: inbox.length,
        unread: unread.length,
        starred: starred.length,
        sent: sent.length,
        drafts: drafts.length,
        important: important.length,
        all: all.length,
        trash: trash.length,
        alerts: alerts.length,
        alertsUnread: alertUnread.length
    };
}

function getMailFolderRows() {
    const inbox = typeof getInboxMessages === 'function' ? getInboxMessages() : [];
    const sent = typeof getSentMessages === 'function' ? getSentMessages() : [];
    if (window.saMailFolder === 'sent') {
        return sent.map((m) => ({ kind: 'message', id: m.id, msg: m, sent: true }));
    }
    if (window.saMailFolder === 'alerts') {
        return getCachedDeskAlerts().map((a) => ({ kind: 'alert', id: a.deskId || a.id, alert: a }));
    }
    if (window.saMailFolder === 'trash') {
        const trash = typeof getTrashMessages === 'function' ? getTrashMessages() : [];
        return trash.map((m) => ({ kind: 'message', id: m.id, msg: m, sent: m.fromUserId === (typeof currentUserKey === 'function' ? currentUserKey() : ''), trashed: true }));
    }
    if (window.saMailFolder === 'drafts') {
        const drafts = typeof getDraftMessages === 'function' ? getDraftMessages() : [];
        return drafts.map((d) => ({ kind: 'draft', id: d.id, draft: d }));
    }
    if (window.saMailFolder === 'important') {
        const important = typeof getImportantMessages === 'function' ? getImportantMessages() : [];
        return important.map((m) => ({ kind: 'message', id: m.id, msg: m, sent: false }));
    }
    if (window.saMailFolder === 'all') {
        const all = typeof getAllMailMessages === 'function' ? getAllMailMessages() : [];
        const key = typeof currentUserKey === 'function' ? currentUserKey() : '';
        return all.map((m) => ({ kind: 'message', id: m.id, msg: m, sent: m.fromUserId === key }));
    }
    let rows = inbox;
    if (window.saMailFolder === 'unread') rows = inbox.filter((m) => !isMessageRead(m));
    else if (window.saMailFolder === 'starred') {
        const all = typeof getAllMailMessages === 'function' ? getAllMailMessages() : inbox;
        rows = all.filter((m) => isMessageStarred(m));
    }
    return rows.map((m) => ({ kind: 'message', id: m.id, msg: m, sent: false }));
}

function mailShortDate(iso) {
    if (!iso) return '';
    try {
        const d = new Date(iso);
        const now = new Date();
        if (d.toDateString() === now.toDateString()) {
            return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
        }
        return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch (_) {
        return String(iso).slice(0, 10);
    }
}

function mailSnippet(text, max = 90) {
    const t = String(text || '').replace(/\s+/g, ' ').trim();
    if (t.length <= max) return t;
    return `${t.slice(0, max - 1)}…`;
}

function renderMailMessageRow(row) {
    const m = row.msg;
    const unread = !row.sent && !row.trashed && (typeof isMessageRead === 'function' ? !isMessageRead(m) : false);
    const starred = isMessageStarred(m);
    const open = window.saMailOpenKind === 'message' && window.saMailOpenId === m.id;
    const from = row.sent
        ? (m.toLabel || m.toDepartment || '—')
        : (m.fromName || m.fromOffice || '—');
    const subject = m.subject || '(no subject)';
    const snippet = mailSnippet(m.body);
    const trashActions = row.trashed ? `
            <span class="sa-mail-row-actions">
                <button type="button" class="btn btn-primary btn-sm" data-mail-restore="${omEscape(m.id)}" title="Restore to Inbox">Restore</button>
                <button type="button" class="btn btn-ghost btn-sm" data-mail-purge="${omEscape(m.id)}" title="Delete forever">Delete forever</button>
            </span>` : '';
    return `
        <div class="sa-mail-row${unread ? ' is-unread' : ''}${open ? ' is-open' : ''}${starred ? ' is-starred' : ''}${row.trashed ? ' is-trashed' : ''}"
             data-mail-kind="message" data-mail-id="${omEscape(m.id)}" role="button" tabindex="0">
            <button type="button" class="sa-mail-star${starred ? ' is-on' : ''}" data-mail-star="${omEscape(m.id)}" title="Star" aria-label="Star">★</button>
            <span class="sa-mail-from">${omEscape(from)}</span>
            <span class="sa-mail-subject">
                <strong>${omEscape(subject)}</strong>
                <span class="sa-mail-snippet"> — ${omEscape(snippet)}</span>
            </span>
            ${trashActions || `<span class="sa-mail-date">${omEscape(mailShortDate(row.trashed && m.trashedBy ? Object.values(m.trashedBy)[0] : m.createdAt))}</span>`}
        </div>`;
}

function renderMailDraftRow(row) {
    const d = row.draft;
    const open = window.saMailOpenKind === 'draft' && window.saMailOpenId === d.id;
    const to = d.toLabel || d.toDepartment || '(no recipient)';
    const subject = d.subject || '(no subject)';
    return `
        <div class="sa-mail-row sa-mail-row-draft${open ? ' is-open' : ''}"
             data-mail-kind="draft" data-mail-id="${omEscape(d.id)}" role="button" tabindex="0">
            <span class="sa-mail-star sa-mail-star-spacer" aria-hidden="true">✎</span>
            <span class="sa-mail-from">${omEscape(to)}</span>
            <span class="sa-mail-subject">
                <strong>${omEscape(subject)}</strong>
                <span class="sa-mail-snippet"> — ${omEscape(mailSnippet(d.body))}</span>
            </span>
            <span class="sa-mail-date">${omEscape(mailShortDate(d.updatedAt || d.createdAt))}</span>
        </div>`;
}

function renderMailAlertRow(row) {
    const a = row.alert;
    const unread = typeof isAlertUnread === 'function' ? isAlertUnread(a.deskId) : false;
    const open = window.saMailOpenKind === 'alert' && window.saMailOpenId === (a.deskId || a.id);
    const subject = a.text || a.title || 'Alert';
    const from = a.department || 'Notifications';
    return `
        <div class="sa-mail-row sa-mail-row-alert${unread ? ' is-unread' : ''}${open ? ' is-open' : ''}"
             data-mail-kind="alert" data-mail-id="${omEscape(a.deskId || a.id || '')}" role="button" tabindex="0">
            <span class="sa-mail-star sa-mail-star-spacer" aria-hidden="true">⚠</span>
            <span class="sa-mail-from">${omEscape(from)}</span>
            <span class="sa-mail-subject">
                <strong>${omEscape(mailSnippet(subject, 70))}</strong>
                <span class="sa-mail-snippet"> — ${omEscape((a.priority || 'normal').toUpperCase())}${a.redFlag ? ' · FLAG' : ''}</span>
            </span>
            <span class="sa-mail-date">${omEscape(a.receivedDate || a.dateIn || '')}</span>
        </div>`;
}

function renderMailReader() {
    if (!window.saMailOpenId) {
        return '<div class="sa-mail-reader-empty">Select a message to read.</div>';
    }
    if (window.saMailOpenKind === 'draft') {
        const drafts = typeof getDraftMessages === 'function' ? getDraftMessages() : [];
        const d = drafts.find((x) => x.id === window.saMailOpenId);
        if (!d) return '<div class="sa-mail-reader-empty">Draft not found.</div>';
        return `
            <div class="sa-mail-reader-head">
                <h4>Draft · ${omEscape(d.subject || '(no subject)')}</h4>
                <div class="sa-mail-reader-meta">
                    <span><em>To</em> ${omEscape(d.toLabel || d.toDepartment || '—')}</span>
                    <span><em>Updated</em> ${omEscape(typeof omFormatWhen === 'function' ? omFormatWhen(d.updatedAt || d.createdAt) : mailShortDate(d.updatedAt || d.createdAt))}</span>
                </div>
            </div>
            <div class="sa-mail-reader-body">${omEscape(d.body || '(empty)')}</div>
            <div class="sa-mail-reader-actions">
                <button type="button" class="btn btn-primary btn-sm" data-mail-open-draft="${omEscape(d.id)}">Continue editing</button>
                <button type="button" class="btn btn-ghost btn-sm" data-mail-delete-draft="${omEscape(d.id)}">Delete draft</button>
                <button type="button" class="btn btn-ghost btn-sm" data-mail-close-reader>Close</button>
            </div>`;
    }
    if (window.saMailOpenKind === 'alert') {
        const a = getCachedDeskAlerts().find((x) => (x.deskId || x.id) === window.saMailOpenId);
        if (!a) return '<div class="sa-mail-reader-empty">Alert not found.</div>';
        return `
            <div class="sa-mail-reader-head">
                <h4>${omEscape(mailSnippet(a.text || 'Alert', 120))}</h4>
                <div class="sa-mail-reader-meta">
                    <span><em>Dept</em> ${omEscape(a.department || '—')}</span>
                    <span><em>Priority</em> ${omEscape(a.priority || 'normal')}</span>
                    <span><em>In</em> ${omEscape(a.receivedDate || a.dateIn || '—')}</span>
                    ${a.dueDate ? `<span><em>Due</em> ${omEscape(a.dueDate)}</span>` : ''}
                </div>
            </div>
            <div class="sa-mail-reader-body">${omEscape(a.text || '')}</div>
            <div class="sa-mail-reader-actions">
                ${a.target ? `<button type="button" class="btn btn-primary btn-sm" data-mail-alert-open="${omEscape(a.deskId)}">Open related module</button>` : ''}
                <button type="button" class="btn btn-ghost btn-sm" data-mail-close-reader>Close</button>
            </div>`;
    }
    const list = typeof ensureOfficeMessagesState === 'function' ? ensureOfficeMessagesState() : [];
    const m = list.find((x) => x.id === window.saMailOpenId);
    if (!m) return '<div class="sa-mail-reader-empty">Message not found.</div>';
    const inTrash = typeof isMessageTrashed === 'function' && isMessageTrashed(m);
    const trashedAt = (() => {
        if (!inTrash || !m.trashedBy) return '';
        const key = typeof currentUserKey === 'function' ? currentUserKey() : '';
        return m.trashedBy[key] || Object.values(m.trashedBy)[0] || '';
    })();
    return `
        <div class="sa-mail-reader-head">
            <h4>${omEscape(m.subject || '(no subject)')}</h4>
            <div class="sa-mail-reader-meta">
                <span><em>From</em> ${omEscape(m.fromName)} · ${omEscape(m.fromOffice || m.fromRoleLabel || '')}</span>
                <span><em>To</em> ${omEscape(m.toLabel || m.toDepartment || '—')}</span>
                <span><em>When</em> ${omEscape(typeof omFormatWhen === 'function' ? omFormatWhen(m.createdAt) : mailShortDate(m.createdAt))}</span>
                ${m.dueDate ? `<span><em>Due</em> ${omEscape(m.dueDate)}</span>` : ''}
                ${inTrash && trashedAt ? `<span><em>Trashed</em> ${omEscape(typeof omFormatWhen === 'function' ? omFormatWhen(trashedAt) : mailShortDate(trashedAt))}</span>` : ''}
            </div>
        </div>
        <div class="sa-mail-reader-body">${omEscape(m.body || '')}</div>
        <div class="sa-mail-reader-actions">
            ${inTrash ? `
                <button type="button" class="btn btn-primary btn-sm" data-mail-restore="${omEscape(m.id)}">Restore</button>
                <button type="button" class="btn btn-ghost btn-sm" data-mail-purge="${omEscape(m.id)}">Delete forever</button>
            ` : `
                <button type="button" class="btn btn-primary btn-sm" data-mail-reply="${omEscape(m.id)}">Reply</button>
                <button type="button" class="btn btn-ghost btn-sm" data-mail-star="${omEscape(m.id)}">${isMessageStarred(m) ? 'Unstar' : 'Star'}</button>
                <button type="button" class="btn btn-ghost btn-sm" data-mail-trash="${omEscape(m.id)}">Delete</button>
            `}
            <button type="button" class="btn btn-ghost btn-sm" data-mail-close-reader>Close</button>
        </div>`;
}

function renderMailLayout() {
    const shell = document.getElementById('saMailShell');
    if (!shell || window.saViewMode !== 'mail') return;

    const counts = mailFolderCounts();
    const canCompose = typeof canComposeOfficeMessages === 'function' && canComposeOfficeMessages();

    if (window.saMailFolder === 'compose') {
        shell.innerHTML = `
            <aside class="sa-mail-nav">
                ${canCompose ? '<button type="button" class="btn btn-primary sa-mail-compose-btn" data-mail-folder="compose">Compose</button>' : ''}
                ${renderMailNav(counts)}
            </aside>
            <div class="sa-mail-main">
                <div class="sa-mail-compose-host" id="saMailComposeHost"></div>
            </div>`;
        // Reuse existing compose form renderer into host
        const host = document.getElementById('saMailComposeHost');
        const composePane = document.getElementById('systemComposePane');
        if (host && typeof renderOfficeComposePane === 'function') {
            // Temporarily render into real pane then move HTML
            const wasHidden = composePane?.hidden;
            if (composePane) {
                composePane.hidden = false;
                composePane.classList.remove('sa-pane-hidden');
            }
            renderOfficeComposePane();
            if (composePane && host) {
                host.innerHTML = composePane.innerHTML;
                // Keep form id unique — re-bind submit on shell
                const form = host.querySelector('#omComposeForm');
                if (form) form.id = 'omComposeFormMail';
                wireMailComposeForm(host);
            }
            if (composePane) {
                composePane.innerHTML = '';
                composePane.hidden = true;
                composePane.classList.add('sa-pane-hidden');
                if (wasHidden === false) { /* stay hidden in mail mode */ }
            }
        }
        return;
    }

    const rows = getMailFolderRows();
    const inTrash = window.saMailFolder === 'trash';
    const folderTitle = ({
        inbox: 'Inbox', unread: 'Unread', starred: 'Starred', sent: 'Sent',
        drafts: 'Drafts', important: 'Important', all: 'All Mail', trash: 'Trash', alerts: 'Alerts'
    })[window.saMailFolder] || 'Mail';
    shell.innerHTML = `
        <aside class="sa-mail-nav">
            ${canCompose ? '<button type="button" class="btn btn-primary sa-mail-compose-btn" data-mail-folder="compose">Compose</button>' : ''}
            ${renderMailNav(counts)}
        </aside>
        <div class="sa-mail-main">
            <div class="sa-mail-toolbar">
                <button type="button" class="btn btn-ghost btn-sm" data-mail-refresh title="Refresh">↻</button>
                ${inTrash
                    ? `<button type="button" class="btn btn-primary btn-sm" data-mail-restore="${window.saMailOpenKind === 'message' && window.saMailOpenId ? omEscape(window.saMailOpenId) : ''}" ${window.saMailOpenKind === 'message' && window.saMailOpenId ? '' : 'disabled'} title="Restore selected message">Restore</button>
                       <button type="button" class="btn btn-ghost btn-sm" data-mail-empty-trash ${counts.trash ? '' : 'disabled'}>Empty Trash</button>`
                    : `<button type="button" class="btn btn-ghost btn-sm" data-mail-mark-all ${counts.unread ? '' : 'disabled'}>Mark all read</button>
                       ${window.saMailOpenKind === 'message' && window.saMailOpenId
                            ? `<button type="button" class="btn btn-ghost btn-sm" data-mail-trash="${omEscape(window.saMailOpenId)}">Delete</button>`
                            : ''}`}
                <span class="sa-mail-folder-label">${omEscape(folderTitle)}</span>
                <span class="sa-mail-range">${rows.length ? `1–${rows.length} of ${rows.length}` : '0 items'}</span>
            </div>
            <div class="sa-mail-split">
                <div class="sa-mail-list" role="list">
                    ${rows.length
                        ? rows.map((r) => {
                            if (r.kind === 'alert') return renderMailAlertRow(r);
                            if (r.kind === 'draft') return renderMailDraftRow(r);
                            return renderMailMessageRow(r);
                        }).join('')
                        : `<div class="sa-mail-empty">${inTrash ? 'Trash is empty.' : 'No items in this folder.'}</div>`}
                </div>
                <div class="sa-mail-reader" aria-live="polite">${renderMailReader()}</div>
            </div>
        </div>`;
}

function renderMailNav(counts) {
    const item = (folder, icon, label, count, badgeClass = '') => `
        <button type="button" class="sa-mail-nav-item${window.saMailFolder === folder ? ' is-active' : ''}" data-mail-folder="${folder}">
            <span class="sa-mail-nav-label"><span class="sa-mail-nav-ico" aria-hidden="true">${icon}</span>${label}</span>
            ${count != null && count !== '' && Number(count) > 0 ? `<span class="sa-mail-nav-count${badgeClass}">${count}</span>` : ''}
        </button>`;
    const moreOpen = !!window.saMailMoreOpen;
    return `
        <nav class="sa-mail-folders" aria-label="Mail folders">
            ${item('inbox', '📥', 'Inbox', counts.inbox, counts.unread ? ' is-hot' : '')}
            ${item('starred', '☆', 'Starred', counts.starred)}
            ${item('unread', '●', 'Unread', counts.unread, ' is-hot')}
            ${item('sent', '✈', 'Sent', counts.sent)}
            ${item('drafts', '✎', 'Drafts', counts.drafts, counts.drafts ? ' is-hot' : '')}
            ${item('alerts', '⚠', 'Alerts', counts.alertsUnread || counts.alerts, counts.alertsUnread ? ' is-hot' : '')}
            ${item('trash', '🗑', 'Trash', counts.trash, counts.trash ? ' is-hot' : '')}
            <button type="button" class="sa-mail-nav-item sa-mail-more-toggle${moreOpen ? ' is-open' : ''}" data-mail-more-toggle>
                <span class="sa-mail-nav-label"><span class="sa-mail-nav-ico" aria-hidden="true">${moreOpen ? '▴' : '▾'}</span>${moreOpen ? 'Less' : 'More'}</span>
            </button>
            <div class="sa-mail-more${moreOpen ? '' : ' is-collapsed'}" ${moreOpen ? '' : 'hidden'}>
                ${item('important', '⚑', 'Important', counts.important)}
                ${item('all', '☰', 'All Mail', counts.all)}
            </div>
        </nav>`;
}

function wireMailComposeForm(host) {
    const collectDraftFields = (root) => {
        const map = [
            ['#omToMode', 'omToMode'],
            ['#omToItDir', 'omToItDir'],
            ['#omToPeer', 'omToPeer'],
            ['#omToUnit', 'omToUnit'],
            ['#omToOther', 'omToOther'],
            ['#omToSearch', 'omToSearch'],
            ['#omSubject', 'omSubject'],
            ['#omBody', 'omBody'],
            ['#omPriority', 'omPriority'],
            ['#omDueDate', 'omDueDate']
        ];
        const prev = [];
        map.forEach(([sel, id]) => {
            const el = root.querySelector(sel) || root.querySelector(`[id="${id}"]`);
            if (!el) return;
            prev.push([el, el.id]);
            el.id = id;
        });
        const dest = typeof resolveComposeDestination === 'function'
            ? resolveComposeDestination()
            : { to: '', toKind: 'it_dir_dept', toLabel: '' };
        const fields = {
            id: root.dataset.draftId || '',
            toDepartment: dest.to,
            toKind: dest.toKind,
            toLabel: dest.toLabel,
            toUserId: dest.toUserId || '',
            subject: document.getElementById('omSubject')?.value || '',
            body: document.getElementById('omBody')?.value || '',
            priority: document.getElementById('omPriority')?.value || 'normal',
            dueDate: document.getElementById('omDueDate')?.value || ''
        };
        prev.forEach(([el, id]) => { el.id = id; });
        return fields;
    };

    host.querySelector('#omComposeFormMail, #omComposeForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const fields = collectDraftFields(e.target);
        const msg = typeof composeOfficeMessage === 'function'
            ? composeOfficeMessage({
                toDepartment: fields.toDepartment,
                toKind: fields.toKind,
                toLabel: fields.toLabel,
                toUserId: fields.toUserId,
                subject: fields.subject,
                body: fields.body,
                priority: fields.priority,
                dueDate: fields.dueDate
            })
            : null;
        if (msg) {
            if (fields.id && typeof deleteOfficeDraft === 'function') deleteOfficeDraft(fields.id);
            window.saMailFolder = 'sent';
            window.saMailOpenId = msg.id;
            window.saMailOpenKind = 'message';
            renderMailLayout();
        }
    });

    host.querySelector('[data-om-save-draft]')?.addEventListener('click', (e) => {
        e.preventDefault();
        const form = host.querySelector('#omComposeFormMail, #omComposeForm');
        if (!form) return;
        const fields = collectDraftFields(form);
        const draft = typeof saveOfficeDraft === 'function' ? saveOfficeDraft(fields) : null;
        if (draft) {
            window.saMailFolder = 'drafts';
            window.saMailOpenId = draft.id;
            window.saMailOpenKind = 'draft';
            renderMailLayout();
        }
    });

    // Mode sync for destination fields
    if (typeof wireOfficeComposeRecipientFields === 'function') {
        wireOfficeComposeRecipientFields(host);
    } else {
        const mode = host.querySelector('#omToMode');
        const sync = () => {
            if (typeof syncOfficeComposeToMode === 'function') {
                syncOfficeComposeToMode(host);
                return;
            }
            const m = mode?.value || 'peer';
            const itDir = host.querySelector('#omItDirWrap');
            const peer = host.querySelector('#omPeerWrap');
            const unit = host.querySelector('#omUnitWrap');
            const other = host.querySelector('#omOtherWrap');
            const search = host.querySelector('#omSearchWrap');
            if (itDir) itDir.hidden = m !== 'it_dir';
            if (peer) peer.hidden = m !== 'peer';
            if (unit) unit.hidden = m !== 'unit';
            if (other) other.hidden = m !== 'other';
            if (search) search.hidden = m === 'broadcast';
        };
        mode?.addEventListener('change', sync);
        sync();
    }

    host.querySelector('[data-sa-goto="messages"]')?.addEventListener('click', (e) => {
        e.preventDefault();
        window.saMailFolder = 'inbox';
        renderMailLayout();
    });
}

function openMailItem(kind, id) {
    window.saMailOpenKind = kind;
    window.saMailOpenId = id;
    if (kind === 'message' && typeof markMessageRead === 'function') markMessageRead(id);
    if (kind === 'alert' && typeof markAlertRead === 'function') markAlertRead(id);
    if (typeof updateSaTabBadges === 'function') {
        updateSaTabBadges(
            Number(document.getElementById('systemAlertsCount')?.textContent || 0),
            Number(document.getElementById('saTabAlertBadge')?.textContent || 0)
        );
    }
    renderMailLayout();
}

function fillComposeFromDraft(draft) {
    if (!draft) return;
    const mode = document.getElementById('omToMode');
    const kind = draft.toKind || 'it_dir_dept';
    let modeVal = 'it_dir';
    if (kind === 'peer_commander') modeVal = 'peer';
    else if (kind === 'unit_commander') modeVal = 'unit';
    else if (kind === 'broadcast') modeVal = 'broadcast';
    else if (kind === 'other') modeVal = 'other';
    else if (kind === 'individual') modeVal = 'typed';
    if (mode) {
        mode.value = modeVal;
        mode.dispatchEvent(new Event('change'));
    }
    const to = draft.toDepartment || '';
    const it = document.getElementById('omToItDir');
    const peer = document.getElementById('omToPeer');
    const unit = document.getElementById('omToUnit');
    const other = document.getElementById('omToOther');
    const search = document.getElementById('omToSearch');
    if (modeVal === 'it_dir' && it) it.value = to;
    if (modeVal === 'peer' && peer) peer.value = to;
    if (modeVal === 'unit' && unit) unit.value = to;
    if (modeVal === 'other' && other) other.value = to;
    if (search) {
        search.value = (modeVal === 'typed' || kind === 'individual' || draft.toUserId) ? to : '';
    }
    const sub = document.getElementById('omSubject');
    if (sub) sub.value = draft.subject || '';
    const body = document.getElementById('omBody');
    if (body) body.value = draft.body || '';
    const pri = document.getElementById('omPriority');
    if (pri) pri.value = draft.priority || 'normal';
    const due = document.getElementById('omDueDate');
    if (due) due.value = draft.dueDate || '';
    const form = document.getElementById('omComposeFormMail') || document.getElementById('omComposeForm');
    if (form) form.dataset.draftId = draft.id;
}

function wireMailLayoutUi() {
    const board = document.getElementById('dashCommandBoard') || document.getElementById('systemAlerts');
    if (!board || board.dataset.mailWired === '1') return;
    board.dataset.mailWired = '1';

    board.addEventListener('click', (e) => {
        const viewBtn = e.target.closest('[data-sa-view]');
        if (viewBtn) {
            e.preventDefault();
            setSaViewMode(viewBtn.getAttribute('data-sa-view'));
            return;
        }
        if (window.saViewMode !== 'mail') return;

        if (e.target.closest('[data-mail-more-toggle]')) {
            e.preventDefault();
            window.saMailMoreOpen = !window.saMailMoreOpen;
            renderMailLayout();
            return;
        }

        const folder = e.target.closest('[data-mail-folder]');
        if (folder) {
            e.preventDefault();
            window.saMailFolder = folder.getAttribute('data-mail-folder') || 'inbox';
            window.saMailOpenId = '';
            window.saMailOpenKind = '';
            if (window.saMailFolder === 'compose' && window.saActiveTab !== undefined) {
                window.saActiveTab = 'compose';
            }
            renderMailLayout();
            return;
        }
        const star = e.target.closest('[data-mail-star]');
        if (star) {
            e.preventDefault();
            e.stopPropagation();
            toggleMessageStar(star.getAttribute('data-mail-star'));
            return;
        }
        const trashBtn = e.target.closest('[data-mail-trash]');
        if (trashBtn) {
            e.preventDefault();
            e.stopPropagation();
            const id = trashBtn.getAttribute('data-mail-trash');
            if (typeof trashOfficeMessage === 'function' && trashOfficeMessage(id)) {
                window.saMailOpenId = '';
                window.saMailOpenKind = '';
                window.saMailFolder = 'trash';
                renderMailLayout();
            }
            return;
        }
        const restoreBtn = e.target.closest('[data-mail-restore]');
        if (restoreBtn) {
            e.preventDefault();
            e.stopPropagation();
            const id = restoreBtn.getAttribute('data-mail-restore');
            if (!id) {
                if (typeof showToast === 'function') showToast('Select a message in Trash first.', 'info');
                return;
            }
            if (typeof restoreOfficeMessage === 'function' && restoreOfficeMessage(id)) {
                window.saMailFolder = 'inbox';
                window.saMailOpenId = id;
                window.saMailOpenKind = 'message';
                renderMailLayout();
                if (typeof refreshOfficeMessagesUi === 'function') refreshOfficeMessagesUi();
            }
            return;
        }
        const purgeBtn = e.target.closest('[data-mail-purge]');
        if (purgeBtn) {
            e.preventDefault();
            e.stopPropagation();
            if (!confirm('Delete this message forever? It cannot be recovered.')) return;
            const id = purgeBtn.getAttribute('data-mail-purge');
            if (typeof purgeOfficeMessage === 'function' && purgeOfficeMessage(id)) {
                window.saMailOpenId = '';
                window.saMailOpenKind = '';
                renderMailLayout();
            }
            return;
        }
        if (e.target.closest('[data-mail-empty-trash]')) {
            e.preventDefault();
            if (!confirm('Empty Trash? All items will be deleted forever.')) return;
            if (typeof emptyTrashMessages === 'function') emptyTrashMessages();
            window.saMailOpenId = '';
            window.saMailOpenKind = '';
            renderMailLayout();
            return;
        }
        const openDraft = e.target.closest('[data-mail-open-draft]');
        if (openDraft) {
            e.preventDefault();
            const id = openDraft.getAttribute('data-mail-open-draft');
            const drafts = typeof getDraftMessages === 'function' ? getDraftMessages() : [];
            const draft = drafts.find((d) => d.id === id);
            window.saMailFolder = 'compose';
            renderMailLayout();
            setTimeout(() => fillComposeFromDraft(draft), 40);
            return;
        }
        const delDraft = e.target.closest('[data-mail-delete-draft]');
        if (delDraft) {
            e.preventDefault();
            const id = delDraft.getAttribute('data-mail-delete-draft');
            if (typeof deleteOfficeDraft === 'function') deleteOfficeDraft(id);
            window.saMailOpenId = '';
            window.saMailOpenKind = '';
            renderMailLayout();
            return;
        }
        const reply = e.target.closest('[data-mail-reply]');
        if (reply) {
            e.preventDefault();
            if (typeof startOfficeMessageReply === 'function') {
                // Prefill via cards compose then bounce back to mail compose
                startOfficeMessageReply(reply.getAttribute('data-mail-reply'));
                setTimeout(() => {
                    window.saMailFolder = 'compose';
                    setSaViewMode('mail');
                    // Copy filled fields from system compose into mail after render
                    const sub = document.getElementById('omSubject')?.value;
                    const body = document.getElementById('omBody')?.value;
                    const to = document.getElementById('omToItDir')?.value || document.getElementById('omToPeer')?.value;
                    renderMailLayout();
                    setTimeout(() => {
                        const host = document.getElementById('saMailComposeHost');
                        if (!host) return;
                        if (sub) {
                            const s = host.querySelector('#omSubject');
                            if (s) s.value = sub;
                        }
                        if (body) {
                            const b = host.querySelector('#omBody');
                            if (b) {
                                b.value = body;
                                b.focus();
                                b.setSelectionRange(0, 0);
                            }
                        }
                        if (to) {
                            const mode = host.querySelector('#omToMode');
                            if (mode) {
                                mode.value = 'it_dir';
                                mode.dispatchEvent(new Event('change'));
                            }
                            const it = host.querySelector('#omToItDir');
                            if (it) it.value = to;
                        }
                    }, 50);
                }, 60);
            }
            return;
        }
        if (e.target.closest('[data-mail-close-reader]')) {
            e.preventDefault();
            window.saMailOpenId = '';
            window.saMailOpenKind = '';
            renderMailLayout();
            return;
        }
        if (e.target.closest('[data-mail-refresh]')) {
            e.preventDefault();
            if (typeof updateSystemAlerts === 'function') updateSystemAlerts();
            renderMailLayout();
            return;
        }
        if (e.target.closest('[data-mail-mark-all]')) {
            e.preventDefault();
            if (typeof markAllInboxRead === 'function') markAllInboxRead();
            renderMailLayout();
            return;
        }
        const alertOpen = e.target.closest('[data-mail-alert-open]');
        if (alertOpen) {
            e.preventDefault();
            const deskId = alertOpen.getAttribute('data-mail-alert-open');
            const a = getCachedDeskAlerts().find((x) => x.deskId === deskId);
            if (a?.target && typeof navigateToModule === 'function') navigateToModule(a.target);
            return;
        }
        const row = e.target.closest('.sa-mail-row[data-mail-id]');
        if (row) {
            e.preventDefault();
            openMailItem(row.getAttribute('data-mail-kind') || 'message', row.getAttribute('data-mail-id'));
        }
    });
}

function initMailLayout() {
    loadSaViewMode();
    syncSaViewToggleUi();
    wireMailLayoutUi();
    if (typeof initSaWindow === 'function') initSaWindow();
    applySaViewMode();
    if (window.saViewMode === 'mail') renderMailLayout();
    if (window.saViewMode === 'whatsapp' && typeof renderWhatsAppLayout === 'function') renderWhatsAppLayout();
}

function refreshMailLayoutIfActive() {
    if (window.saViewMode === 'mail') renderMailLayout();
    if (window.saViewMode === 'whatsapp' && typeof renderWhatsAppLayout === 'function') renderWhatsAppLayout();
}

window.setSaViewMode = setSaViewMode;
window.applySaViewMode = applySaViewMode;
window.initMailLayout = initMailLayout;
window.refreshMailLayoutIfActive = refreshMailLayoutIfActive;
window.renderMailLayout = renderMailLayout;
