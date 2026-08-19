/* whatsapp-layout.js — WhatsIn chat layout for System Alerts / Inbox */

window.saWaChatId = window.saWaChatId || '';
window.saWaQuery = window.saWaQuery || '';

function waEsc(s) {
    if (typeof omEscape === 'function') return omEscape(s);
    return String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function waWhen(iso) {
    if (typeof omFormatWhen === 'function') return omFormatWhen(iso);
    if (!iso) return '';
    try {
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return String(iso);
        return d.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
    } catch (_) {
        return String(iso);
    }
}

function waClock(iso) {
    if (!iso) return '';
    try {
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return '';
        return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    } catch (_) {
        return '';
    }
}

function waInitials(title) {
    const parts = String(title || '?').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
}

function waIsOutgoing(msg) {
    const key = typeof currentUserKey === 'function' ? currentUserKey() : (currentUser?.id || currentUser?.username || '');
    return !!(key && msg && msg.fromUserId === key);
}

function buildWhatsAppChats() {
    const inbox = typeof getInboxMessages === 'function' ? getInboxMessages() : [];
    const sent = typeof getSentMessages === 'function' ? getSentMessages() : [];
    const map = new Map();

    const touch = (id, patch) => {
        const cur = map.get(id) || {
            id,
            title: '',
            subtitle: '',
            office: '',
            time: '',
            unread: 0,
            kind: 'chat',
            messages: [],
            replyTo: null
        };
        Object.assign(cur, patch);
        map.set(id, cur);
        return cur;
    };

    [...inbox, ...sent].forEach((m) => {
        if (!m) return;
        const outgoing = waIsOutgoing(m);
        const id = outgoing
            ? `to:${m.to || m.toDepartment || m.toLabel || 'unknown'}`
            : `from:${m.fromUserId || m.fromName || 'unknown'}`;
        const title = outgoing
            ? (m.toLabel || m.toDepartment || 'Recipient')
            : (m.fromName || 'Sender');
        const office = outgoing
            ? (m.toLabel || m.toDepartment || '')
            : (m.fromOffice || m.fromRoleLabel || '');
        const chat = touch(id, { title, office, kind: 'chat' });
        chat.messages.push(m);
        const t = m.createdAt || '';
        if (!chat.time || String(t) > String(chat.time)) {
            chat.time = t;
            chat.subtitle = m.subject ? `${m.subject}: ${m.body || ''}` : (m.body || '');
        }
        if (!outgoing && typeof isMessageRead === 'function' && !isMessageRead(m)) {
            chat.unread += 1;
        }
        if (outgoing) {
            chat.replyTo = {
                to: m.to || m.toDepartment || '',
                toKind: m.toKind || 'it_dir_dept',
                toLabel: m.toLabel || m.toDepartment || ''
            };
        } else if (!chat.replyTo) {
            const dept = typeof resolveReplyToDepartment === 'function' ? resolveReplyToDepartment(m) : (m.fromOffice || '');
            chat.replyTo = dept
                ? { to: dept, toKind: 'it_dir_dept', toLabel: dept }
                : null;
        }
    });

    const alerts = Array.isArray(window.__saCachedAlerts) ? window.__saCachedAlerts : [];
    if (alerts.length) {
        const sorted = [...alerts].sort((a, b) =>
            String(b.receivedDate || b.dateIn || '').localeCompare(String(a.receivedDate || a.dateIn || ''))
        );
        const latest = sorted[0];
        let unread = 0;
        if (typeof isAlertUnread === 'function') {
            unread = alerts.filter((a) => isAlertUnread(a.deskId || a.id)).length;
        }
        map.set('alerts', {
            id: 'alerts',
            title: 'Notifications',
            office: 'TechStores desk',
            subtitle: latest?.text || 'Desk alerts',
            time: latest?.receivedDate || latest?.dateIn || '',
            unread,
            kind: 'alerts',
            messages: sorted,
            replyTo: null
        });
    }

    let list = [...map.values()].sort((a, b) => String(b.time || '').localeCompare(String(a.time || '')));
    const q = String(window.saWaQuery || '').trim().toLowerCase();
    if (q) {
        list = list.filter((c) =>
            `${c.title} ${c.office} ${c.subtitle}`.toLowerCase().includes(q)
        );
    }
    return list;
}

function getWhatsAppChatById(id) {
    return buildWhatsAppChats().find((c) => c.id === id) || null;
}

function openWhatsAppChat(id) {
    window.saWaChatId = id || '';
    const chat = getWhatsAppChatById(id);
    if (chat?.kind === 'chat') {
        (chat.messages || []).forEach((m) => {
            if (!waIsOutgoing(m) && typeof markMessageRead === 'function') markMessageRead(m.id);
        });
    }
    if (chat?.kind === 'alerts' && typeof markAlertRead === 'function') {
        (chat.messages || []).forEach((a) => {
            const deskId = a.deskId || a.id;
            if (deskId && typeof isAlertUnread === 'function' && isAlertUnread(deskId)) {
                markAlertRead(deskId);
            }
        });
    }
    renderWhatsAppLayout();
    if (typeof updateSaTabBadges === 'function') {
        updateSaTabBadges(
            Number(document.getElementById('systemAlertsCount')?.textContent || 0),
            Number(document.getElementById('saTabAlertBadge')?.textContent || 0)
        );
    }
}

function renderWaChatList(chats) {
    if (!chats.length) {
        return '<div class="sa-wa-empty-list">No chats yet. Compose a message or wait for inbox traffic.</div>';
    }
    return chats.map((c) => {
        const active = c.id === window.saWaChatId ? ' is-active' : '';
        const unread = c.unread > 0 ? `<span class="sa-wa-unread">${c.unread > 99 ? '99+' : c.unread}</span>` : '';
        return `
            <button type="button" class="sa-wa-chat${active}" data-wa-chat="${waEsc(c.id)}">
                <span class="sa-wa-avatar" aria-hidden="true">${waEsc(waInitials(c.title))}</span>
                <span class="sa-wa-chat-main">
                    <span class="sa-wa-chat-top">
                        <strong>${waEsc(c.title)}</strong>
                        <time>${waEsc(waWhen(c.time))}</time>
                    </span>
                    <span class="sa-wa-chat-bottom">
                        <span class="sa-wa-preview">${waEsc(String(c.subtitle || '').slice(0, 72))}</span>
                        ${unread}
                    </span>
                </span>
            </button>`;
    }).join('');
}

function renderWaBubbles(chat) {
    if (!chat) {
        return `
            <div class="sa-wa-thread-empty">
                <div class="sa-wa-thread-empty-card">
                    <strong>WhatsIn layout</strong>
                    <p>Select a chat on the left to read messages as bubbles — same inbox / sent / alerts data as Cards and Mail.</p>
                </div>
            </div>`;
    }

    if (chat.kind === 'alerts') {
        const bubbles = (chat.messages || []).slice().reverse().map((a) => {
            const pri = (a.priority || 'normal').toLowerCase();
            const hot = pri === 'urgent' || pri === 'critical' || a.redFlag;
            const priLabel = (a.priority || 'normal').toUpperCase();
            return `
                <article class="sa-wa-bubble is-alert${hot ? ' is-urgent' : ''}">
                    <div class="sa-wa-alert-top">
                        <span class="sa-wa-bubble-meta">${waEsc(a.department || 'Alert')}</span>
                        <span class="sa-wa-alert-pri${hot ? ' is-hot' : ''}">${waEsc(priLabel)}</span>
                    </div>
                    <div class="sa-wa-bubble-text">${waEsc(a.text || '')}</div>
                    <div class="sa-wa-bubble-foot">
                        <span>${waEsc(a.receivedDate || a.dateIn || '')}</span>
                        ${a.target ? `<button type="button" class="sa-wa-link" data-wa-alert-open="${waEsc(a.deskId || a.id)}">Open module</button>` : ''}
                    </div>
                </article>`;
        }).join('');
        return `<div class="sa-wa-thread is-alerts" id="saWaThread">${bubbles || '<div class="sa-wa-thread-empty-card">No alerts.</div>'}</div>`;
    }

    const msgs = [...(chat.messages || [])].sort((a, b) =>
        String(a.createdAt || '').localeCompare(String(b.createdAt || ''))
    );
    const bubbles = msgs.map((m) => {
        const out = waIsOutgoing(m);
        const hot = typeof isElevatedMessagePriority === 'function'
            ? isElevatedMessagePriority(m.priority)
            : (m.priority === 'urgent' || m.priority === 'critical' || m.priority === 'flash' || m.priority === 'immediate' || m.priority === 'high');
        const priMeta = typeof getMessagePriorityMeta === 'function' ? getMessagePriorityMeta(m.priority) : null;
        const priLabel = priMeta ? `${priMeta.icon ? priMeta.icon + ' ' : ''}${priMeta.short}` : String(m.priority || 'normal').toUpperCase();
        return `
            <div class="sa-wa-bubble ${out ? 'is-out' : 'is-in'}${hot ? ' is-urgent' : ''}" data-wa-msg="${waEsc(m.id)}">
                <div class="sa-wa-bubble-pri msg-pri msg-pri-${waEsc(priMeta?.value || 'normal')}">${waEsc(priLabel)}</div>
                ${m.subject ? `<div class="sa-wa-bubble-subject">${waEsc(m.subject)}</div>` : ''}
                <div class="sa-wa-bubble-text">${waEsc(m.body || '')}</div>
                <div class="sa-wa-bubble-foot">
                    <span>${waEsc(waClock(m.createdAt))}</span>
                    ${out ? '<span class="sa-wa-ticks" aria-hidden="true">✓✓</span>' : ''}
                </div>
            </div>`;
    }).join('');

    return `<div class="sa-wa-thread" id="saWaThread">${bubbles || '<div class="sa-wa-thread-empty-card">No messages in this chat.</div>'}</div>`;
}

function renderWaComposer(chat) {
    const canCompose = typeof canComposeOfficeMessages === 'function' && canComposeOfficeMessages();
    if (!chat || chat.kind === 'alerts') {
        return `<div class="sa-wa-composer is-disabled"><span>Select a person/office chat to reply here.</span></div>`;
    }
    if (!canCompose) {
        return `<div class="sa-wa-composer is-disabled"><span>Your role cannot send office messages.</span></div>`;
    }
    if (!chat.replyTo?.to) {
        return `<div class="sa-wa-composer is-disabled"><span>Cannot resolve reply destination for this chat.</span></div>`;
    }
    return `
        <form class="sa-wa-composer" id="saWaComposeForm" autocomplete="off">
            <input type="hidden" name="to" value="${waEsc(chat.replyTo.to)}">
            <input type="hidden" name="toKind" value="${waEsc(chat.replyTo.toKind || 'it_dir_dept')}">
            <input type="hidden" name="toLabel" value="${waEsc(chat.replyTo.toLabel || chat.replyTo.to)}">
            <textarea id="saWaBody" name="body" rows="1" placeholder="Type a message" required></textarea>
            <button type="submit" class="sa-wa-send" title="Send">➤</button>
        </form>`;
}

function scrollWaThreadToReadable(thread) {
    if (!thread) return;
    const bubbles = thread.querySelectorAll('.sa-wa-bubble');
    const last = bubbles[bubbles.length - 1];
    if (!last) {
        thread.scrollTop = 0;
        return;
    }
    // Long latest message: pin its start in view (avoid clipping under the chat header).
    // Short messages: keep the latest near the bottom like a normal chat.
    const pad = 10;
    if (last.offsetHeight + pad >= thread.clientHeight) {
        thread.scrollTop = Math.max(0, last.offsetTop - pad);
    } else {
        thread.scrollTop = Math.max(0, thread.scrollHeight - thread.clientHeight);
    }
}

function renderWhatsAppLayout() {
    const shell = document.getElementById('saWaShell');
    if (!shell || window.saViewMode !== 'whatsapp') return;

    const chats = buildWhatsAppChats();
    if (window.saWaChatId && !chats.some((c) => c.id === window.saWaChatId)) {
        window.saWaChatId = chats[0]?.id || '';
    }
    if (!window.saWaChatId && chats.length) window.saWaChatId = chats[0].id;

    const chat = chats.find((c) => c.id === window.saWaChatId) || null;
    const canCompose = typeof canComposeOfficeMessages === 'function' && canComposeOfficeMessages();

    shell.innerHTML = `
        <aside class="sa-wa-side">
            <div class="sa-wa-side-head">
                <strong>Chats</strong>
                ${canCompose ? '<button type="button" class="sa-wa-new" data-wa-compose title="Full compose form">＋</button>' : ''}
            </div>
            <div class="sa-wa-search">
                <input type="search" id="saWaSearch" placeholder="Search chats" value="${waEsc(window.saWaQuery || '')}">
            </div>
            <div class="sa-wa-list">${renderWaChatList(chats)}</div>
        </aside>
        <section class="sa-wa-main">
            <header class="sa-wa-main-head">
                ${chat ? `
                    <span class="sa-wa-avatar" aria-hidden="true">${waEsc(waInitials(chat.title))}</span>
                    <div class="sa-wa-main-titles">
                        <strong>${waEsc(chat.title)}</strong>
                        <span>${waEsc(chat.office || (chat.kind === 'alerts' ? 'Desk alerts' : 'Office message'))}</span>
                    </div>
                ` : `<div class="sa-wa-main-titles"><strong>WhatsIn layout</strong><span>Pick a chat</span></div>`}
            </header>
            ${renderWaBubbles(chat)}
            ${renderWaComposer(chat)}
        </section>`;

    const thread = document.getElementById('saWaThread');
    requestAnimationFrame(() => scrollWaThreadToReadable(thread));

    const search = document.getElementById('saWaSearch');
    if (search) {
        search.addEventListener('input', () => {
            window.saWaQuery = search.value || '';
            renderWhatsAppLayout();
            const again = document.getElementById('saWaSearch');
            if (again) {
                again.focus();
                const len = again.value.length;
                again.setSelectionRange(len, len);
            }
        });
    }

    const form = document.getElementById('saWaComposeForm');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const body = (document.getElementById('saWaBody')?.value || '').trim();
            if (!body) return;
            const to = form.querySelector('[name="to"]')?.value || '';
            const toKind = form.querySelector('[name="toKind"]')?.value || 'it_dir_dept';
            const toLabel = form.querySelector('[name="toLabel"]')?.value || to;
            const lastIn = [...(chat?.messages || [])].reverse().find((m) => !waIsOutgoing(m));
            const subject = lastIn?.subject
                ? (typeof buildReplySubject === 'function' ? buildReplySubject(lastIn.subject) : `Re: ${lastIn.subject}`)
                : 'Chat message';
            if (typeof composeOfficeMessage !== 'function') return;
            const msg = composeOfficeMessage({
                toDepartment: to,
                toKind,
                toLabel,
                subject,
                body,
                priority: 'normal'
            });
            if (msg) {
                window.saWaChatId = `to:${msg.toDepartment || to}`;
                if (typeof refreshOfficeMessagesUi === 'function') refreshOfficeMessagesUi();
                else renderWhatsAppLayout();
            }
        });
    }
}

function wireWhatsAppLayoutUi() {
    if (window.__saWaWired) return;
    window.__saWaWired = true;
    const board = document.getElementById('dashCommandBoard') || document.getElementById('systemAlerts');
    if (!board) return;
    board.addEventListener('click', (e) => {
        if (window.saViewMode !== 'whatsapp') return;
        const chatBtn = e.target.closest('[data-wa-chat]');
        if (chatBtn) {
            e.preventDefault();
            openWhatsAppChat(chatBtn.getAttribute('data-wa-chat'));
            return;
        }
        if (e.target.closest('[data-wa-compose]')) {
            e.preventDefault();
            if (typeof setSaViewMode === 'function') setSaViewMode('cards');
            if (typeof setSaTab === 'function') setSaTab('compose');
            return;
        }
        const alertOpen = e.target.closest('[data-wa-alert-open]');
        if (alertOpen) {
            e.preventDefault();
            const deskId = alertOpen.getAttribute('data-wa-alert-open');
            const alerts = Array.isArray(window.__saCachedAlerts) ? window.__saCachedAlerts : [];
            const a = alerts.find((x) => (x.deskId || x.id) === deskId);
            if (a?.target && typeof navigateToModule === 'function') navigateToModule(a.target);
        }
    });
}

function initWhatsAppLayout() {
    wireWhatsAppLayoutUi();
    if (window.saViewMode === 'whatsapp') renderWhatsAppLayout();
}

window.renderWhatsAppLayout = renderWhatsAppLayout;
window.initWhatsAppLayout = initWhatsAppLayout;
window.buildWhatsAppChats = buildWhatsAppChats;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWhatsAppLayout);
} else {
    initWhatsAppLayout();
}
