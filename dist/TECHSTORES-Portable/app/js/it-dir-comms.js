/* it-dir-comms.js — IT Directorate Communications Portal (internal memos) */

const IDC_MODULE_ID = 'it-dir-comms';
let idcActiveTab = 'compose';
let idcSelectedOffices = new Set();
let idcWired = false;

function idcEscape(value) {
    if (typeof omEscape === 'function') return omEscape(value);
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function idcFormatWhen(iso) {
    if (typeof omFormatWhen === 'function') return omFormatWhen(iso);
    return String(iso || '').slice(0, 16) || '—';
}

function canAccessItDirComms(user = currentUser) {
    if (!user) return false;
    if (typeof canAccessModule === 'function') return canAccessModule(IDC_MODULE_ID);
    return true;
}

function getIdcHomeOffice(user = currentUser) {
    return typeof getUserHomeDepartment === 'function'
        ? getUserHomeDepartment(user)
        : (user?.department || '');
}

function isIdcPortalMessage(msg) {
    if (!msg) return false;
    if (msg.source === 'it-dir-comms') return true;
    const offices = typeof getItDirCommsOffices === 'function' ? getItDirCommsOffices() : [];
    const values = new Set(offices.map((o) => o.value.toUpperCase()));
    const to = String(msg.toDepartment || '').toUpperCase();
    const from = String(msg.fromOffice || '').toUpperCase();
    return values.has(to) || [...values].some((v) => to.includes(v) || v.includes(to))
        || values.has(from) || [...values].some((v) => from.includes(v) || v.includes(from));
}

function getIdcInboxMessages() {
    const inbox = typeof getInboxMessages === 'function' ? getInboxMessages() : [];
    return inbox.filter(isIdcPortalMessage);
}

function getIdcSentMessages() {
    const sent = typeof getSentMessages === 'function' ? getSentMessages() : [];
    return sent.filter(isIdcPortalMessage);
}

function renderIdcOfficeList() {
    const host = document.getElementById('idcOfficeList');
    if (!host) return;
    const offices = typeof getItDirCommsOffices === 'function' ? getItDirCommsOffices() : [];
    const home = getIdcHomeOffice();
    const groups = [
        { title: 'Dir HQ', keys: ['dir', 'dd', 'aqso2'] },
        { title: 'Departments', keys: ['sysadmin', 'dba', 'compengr', 'itts', 'swengr', 'admin', 'techstores', 'workshop', 'ictsec'] }
    ];
    const byKey = Object.fromEntries(offices.map((o) => [o.key, o]));
    host.innerHTML = groups.map((g) => {
        const items = g.keys.map((k) => byKey[k]).filter(Boolean);
        if (!items.length) return '';
        return `
            <div class="idc-office-group">
                <div class="idc-office-group-title">${idcEscape(g.title)}</div>
                ${items.map((o) => {
                    const on = idcSelectedOffices.has(o.value);
                    const isHome = home && o.value.toUpperCase() === String(home).toUpperCase();
                    return `
                        <button type="button" class="idc-office-item idc-office-add${on ? ' is-selected' : ''}${isHome ? ' is-home' : ''}"
                            data-idc-add-office="${idcEscape(o.value)}" title="Add to Directed to">
                            <span class="idc-office-text">
                                <strong>${idcEscape(o.short || o.label)}</strong>
                                <span class="idc-office-sub">${idcEscape(o.label)}</span>
                                ${isHome ? '<em>Your office</em>' : ''}
                                ${on ? '<em class="idc-on-tag">Selected</em>' : ''}
                            </span>
                        </button>`;
                }).join('')}
            </div>`;
    }).join('');
    renderIdcToGrid();
    syncIdcSelectedSummary();
}

function renderIdcToGrid() {
    const host = document.getElementById('idcToGrid');
    if (!host) return;
    const offices = typeof getItDirCommsOffices === 'function' ? getItDirCommsOffices() : [];
    const home = getIdcHomeOffice();
    host.innerHTML = offices.map((o) => {
        const checked = idcSelectedOffices.has(o.value) ? ' checked' : '';
        const isHome = home && o.value.toUpperCase() === String(home).toUpperCase();
        return `
            <label class="idc-to-chip${checked ? ' is-on' : ''}${isHome ? ' is-home' : ''}">
                <input type="checkbox" data-idc-office="${idcEscape(o.value)}"${checked}>
                <span>
                    <strong>${idcEscape(o.short || o.label)}</strong>
                    <small>${idcEscape(o.label)}</small>
                </span>
            </label>`;
    }).join('');
}

function syncIdcSelectedSummary() {
    const el = document.getElementById('idcSelectedSummary');
    const box = document.getElementById('idcToBox');
    const sendBtn = document.getElementById('idcSendBtn');
    if (!el) return;
    if (!idcSelectedOffices.size) {
        el.textContent = 'No department selected yet — tick Directed to above.';
        el.classList.add('is-empty');
        box?.classList.add('is-missing');
        if (sendBtn) sendBtn.disabled = true;
        return;
    }
    el.classList.remove('is-empty');
    box?.classList.remove('is-missing');
    if (sendBtn) sendBtn.disabled = false;
    const offices = typeof getItDirCommsOffices === 'function' ? getItDirCommsOffices() : [];
    const labels = [...idcSelectedOffices].map((v) => {
        const hit = offices.find((o) => o.value === v);
        return hit ? hit.label : v;
    });
    el.innerHTML = `<strong>Directed to:</strong> ${labels.map(idcEscape).join(' · ')}`;
}

function renderIdcEstablishment() {
    const host = document.getElementById('idcEstablishmentView');
    if (!host) return;
    const est = typeof getItDirEstablishment === 'function' ? getItDirEstablishment() : null;
    if (!est) {
        host.innerHTML = '<div class="idc-empty">Establishment data not loaded.</div>';
        return;
    }

    const postRows = (posts = []) => posts.map((p) => `
        <li><span>${idcEscape(p.role)}</span><strong>${idcEscape(p.rank)}</strong></li>`).join('');

    const branchHtml = (branches = []) => branches.map((b) => `
        <div class="idc-est-branch">
            <div class="idc-est-branch-head">
                <h5>${idcEscape(b.name)}</h5>
                <span class="idc-est-strength">${idcEscape(b.strength || '')}</span>
            </div>
            ${b.roles?.length ? `<p class="idc-est-roles">${b.roles.map(idcEscape).join(' · ')}</p>` : ''}
            <ul class="idc-est-posts">${postRows(b.posts)}</ul>
            ${b.officeKey ? `<button type="button" class="btn btn-ghost btn-sm" data-idc-select-office-key="${idcEscape(b.officeKey)}">Address this desk</button>` : ''}
        </div>`).join('');

    const deptCards = est.departments.map((d) => `
        <article class="idc-est-card" id="idc-est-${idcEscape(d.key)}">
            <header class="idc-est-card-head">
                <div>
                    <h4>${idcEscape(d.name)}</h4>
                    <p class="idc-est-meta">Strength ${idcEscape(d.strength)}${d.page ? ` · see page ${d.page}` : ''}</p>
                </div>
                ${d.officeKey ? `<button type="button" class="btn btn-primary btn-sm" data-idc-select-office-key="${idcEscape(d.officeKey)}">Memo to dept</button>` : ''}
            </header>
            ${d.note ? `<p class="idc-est-note">${idcEscape(d.note)}</p>` : ''}
            ${d.hq ? `
                <div class="idc-est-hq">
                    <div class="idc-est-branch-head">
                        <h5>${idcEscape(d.hq.title)}</h5>
                        <span class="idc-est-strength">${idcEscape(d.hq.strength || '')}</span>
                    </div>
                    <ul class="idc-est-posts">${postRows(d.hq.posts)}</ul>
                </div>` : ''}
            <div class="idc-est-branches">${branchHtml(d.branches)}</div>
        </article>`).join('');

    host.innerHTML = `
        <div class="idc-est-banner">
            <div>
                <p class="idc-est-class">${idcEscape(est.classification)}</p>
                <h3>${idcEscape(est.shortTitle)}</h3>
                <p class="idc-est-ref">${idcEscape(est.reference)}</p>
                <p class="idc-est-title">${idcEscape(est.title)}</p>
            </div>
            <div class="idc-est-totals">
                <div><span>Offrs</span><strong>${est.totals.officers}</strong></div>
                <div><span>ORs</span><strong>${est.totals.ors}</strong></div>
                <div><span>Total</span><strong>${est.totals.total}</strong></div>
            </div>
        </div>

        <article class="idc-est-card idc-est-hq-card">
            <header class="idc-est-card-head">
                <div>
                    <h4>${idcEscape(est.hq.name)}</h4>
                    <p class="idc-est-meta">Strength ${idcEscape(est.hq.strength)}</p>
                </div>
            </header>
            <ul class="idc-est-posts idc-est-posts-hq">
                ${est.hq.posts.map((p) => `
                    <li>
                        <span>${idcEscape(p.role)}</span>
                        <strong>${idcEscape(p.rank)}</strong>
                        ${p.officeKey ? `<button type="button" class="btn btn-ghost btn-sm" data-idc-select-office-key="${idcEscape(p.officeKey)}">Memo</button>` : ''}
                    </li>`).join('')}
            </ul>
        </article>

        <div class="idc-est-grid">${deptCards}</div>
    `;
}

function selectIdcOfficeByKey(officeKey) {
    const dept = typeof getItDirDepartmentByKey === 'function' ? getItDirDepartmentByKey(officeKey) : null;
    if (!dept) {
        if (typeof showToast === 'function') showToast('Department not found on the Directed to list.', 'error');
        return;
    }
    idcSelectedOffices.add(dept.value);
    renderIdcOfficeList();
    setIdcTab('compose');
    if (typeof showToast === 'function') showToast(`Directed to: ${dept.label}`, 'success');
}

function setIdcTab(tab) {
    idcActiveTab = tab || 'compose';
    document.querySelectorAll('[data-idc-tab]').forEach((btn) => {
        const on = btn.getAttribute('data-idc-tab') === idcActiveTab;
        btn.classList.toggle('is-active', on);
        btn.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    document.querySelectorAll('[data-idc-pane]').forEach((pane) => {
        const show = pane.getAttribute('data-idc-pane') === idcActiveTab;
        pane.hidden = !show;
        pane.classList.toggle('idc-pane-hidden', !show);
    });
    if (idcActiveTab === 'inbox') renderIdcInbox();
    if (idcActiveTab === 'sent') renderIdcSent();
    if (idcActiveTab === 'establishment') renderIdcEstablishment();
}

function renderIdcMessageCard(msg, { sent = false } = {}) {
    const unread = !sent && typeof isMessageRead === 'function' && !isMessageRead(msg);
    const from = sent
        ? (msg.toLabel || msg.toDepartment || '—')
        : (msg.fromName || msg.fromOffice || '—');
    const office = sent ? '' : (msg.fromOffice || msg.fromRoleLabel || '');
    const memoType = msg.meta?.memoType || msg.source || '';
    return `
        <article class="idc-card${unread ? ' is-unread' : ''}" data-idc-msg="${idcEscape(msg.id)}">
            <div class="idc-card-top">
                <span class="idc-card-from">${idcEscape(from)}${office && !sent ? ` · ${idcEscape(office)}` : ''}</span>
                <span class="idc-card-when">${idcEscape(idcFormatWhen(msg.createdAt))}</span>
            </div>
            <h4 class="idc-card-subject">${idcEscape(msg.subject || '(no subject)')}</h4>
            <p class="idc-card-body">${idcEscape(msg.body || '')}</p>
            <div class="idc-card-meta">
                ${(() => {
                    const pri = typeof normalizeMessagePriority === 'function' ? normalizeMessagePriority(msg.priority) : (msg.priority || 'normal');
                    const meta = typeof getMessagePriorityMeta === 'function' ? getMessagePriorityMeta(pri) : null;
                    const label = meta ? `${meta.icon ? meta.icon + ' ' : ''}${meta.short}` : String(pri || '').toUpperCase();
                    return `<span class="idc-pill idc-pill-${idcEscape(pri)} msg-pri msg-pri-${idcEscape(pri)}">${idcEscape(label)}</span>`;
                })()}
                ${memoType ? `<span class="idc-pill">${idcEscape(String(memoType).replace(/_/g, ' '))}</span>` : ''}
                ${msg.dueDate ? `<span class="idc-pill">Due ${idcEscape(msg.dueDate)}</span>` : ''}
                ${!sent ? `<button type="button" class="btn btn-ghost btn-sm" data-idc-reply="${idcEscape(msg.id)}">Reply</button>` : ''}
                ${!sent && unread ? `<button type="button" class="btn btn-ghost btn-sm" data-idc-mark-read="${idcEscape(msg.id)}">Mark read</button>` : ''}
            </div>
        </article>`;
}

function renderIdcInbox() {
    const list = document.getElementById('idcInboxList');
    const countEl = document.getElementById('idcInboxCount');
    const badge = document.getElementById('idcInboxBadge');
    const chip = document.getElementById('idcUnreadChip');
    if (!list) return;
    const rows = getIdcInboxMessages();
    const unread = rows.filter((m) => typeof isMessageRead === 'function' && !isMessageRead(m)).length;
    list.innerHTML = rows.length
        ? rows.map((m) => renderIdcMessageCard(m)).join('')
        : '<div class="idc-empty">No internal memos in your inbox yet.</div>';
    if (countEl) countEl.textContent = `${rows.length} item${rows.length === 1 ? '' : 's'}${unread ? ` · ${unread} unread` : ''}`;
    if (badge) {
        badge.textContent = unread ? String(unread) : '';
        badge.hidden = !unread;
    }
    if (chip) {
        chip.textContent = `${unread} unread`;
        chip.hidden = !unread;
    }
}

function renderIdcSent() {
    const list = document.getElementById('idcSentList');
    const countEl = document.getElementById('idcSentCount');
    if (!list) return;
    const rows = getIdcSentMessages();
    list.innerHTML = rows.length
        ? rows.map((m) => renderIdcMessageCard(m, { sent: true })).join('')
        : '<div class="idc-empty">No memos sent from this portal yet.</div>';
    if (countEl) countEl.textContent = `${rows.length} item${rows.length === 1 ? '' : 's'}`;
}

function submitIdcCompose(e) {
    e.preventDefault();
    if (typeof canComposeOfficeMessages === 'function' && !canComposeOfficeMessages()) {
        if (typeof showToast === 'function') showToast('Your role cannot send IT Dir memos.', 'error');
        return;
    }
    if (!idcSelectedOffices.size) {
        if (typeof showToast === 'function') showToast('Select at least one department under Directed to.', 'error');
        document.getElementById('idcToBox')?.classList.add('is-missing');
        document.getElementById('idcToGrid')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }
    const subject = document.getElementById('idcSubject')?.value || '';
    const body = document.getElementById('idcBody')?.value || '';
    const messageDate = document.getElementById('idcMsgDate')?.value || '';
    const dueDate = document.getElementById('idcDueDate')?.value || '';
    const memoType = document.getElementById('idcMemoType')?.value || 'memo';
    const priority = typeof normalizeMessagePriority === 'function'
        ? normalizeMessagePriority(document.getElementById('idcPriority')?.value || 'normal')
        : (document.getElementById('idcPriority')?.value || 'normal');
    const typeLabel = {
        memo: 'INTERNAL MEMO',
        correspondence: 'CORRESPONDENCE',
        minutes: 'MINUTES',
        message: 'MESSAGE',
        directive: 'DIRECTIVE',
        request: 'REQUEST',
        reminder: 'REMINDER'
    }[memoType] || 'MEMO';
    const sub = String(subject).trim();
    const finalSubject = sub.toUpperCase().startsWith(typeLabel) ? sub : `${typeLabel} — ${sub}`;

    if (typeof assertMessageDates === 'function' && !assertMessageDates({ messageDate, dueDate })) {
        return;
    }

    const n = typeof sendOfficeMessagesToDepartments === 'function'
        ? sendOfficeMessagesToDepartments({
            departments: [...idcSelectedOffices],
            subject: finalSubject,
            body,
            priority,
            messageDate,
            dueDate,
            toKind: 'it_dir_dept',
            source: 'it-dir-comms',
            meta: { memoType, channel: 'it-dir-comms' },
            force: false
        })
        : 0;

    if (!n) {
        if (typeof showToast === 'function') showToast('Could not send. Check subject and body.', 'error');
        return;
    }
    if (typeof saveState === 'function') saveState();
    if (typeof showToast === 'function') showToast(`Memo sent to ${n} office${n === 1 ? '' : 's'}.`, 'success');
    document.getElementById('idcSubject').value = '';
    document.getElementById('idcBody').value = '';
    document.getElementById('idcDueDate').value = '';
    const msgDateEl = document.getElementById('idcMsgDate');
    if (msgDateEl) msgDateEl.value = typeof todayIsoLocal === 'function' ? todayIsoLocal() : '';
    document.getElementById('idcPriority').value = 'normal';
    setIdcTab('sent');
    refreshIdcPortalUi();
    if (typeof refreshOfficeMessagesUi === 'function') refreshOfficeMessagesUi();
    if (typeof updateCommandBoard === 'function') updateCommandBoard();
}

function startIdcReply(msgId) {
    const list = typeof ensureOfficeMessagesState === 'function' ? ensureOfficeMessagesState() : [];
    const msg = list.find((m) => m.id === msgId);
    if (!msg) return;
    if (typeof markMessageRead === 'function') markMessageRead(msgId);
    idcSelectedOffices = new Set();
    const replyTo = msg.fromOffice || '';
    const offices = typeof getItDirCommsOffices === 'function' ? getItDirCommsOffices() : [];
    const hit = offices.find((o) => o.value.toUpperCase() === String(replyTo).toUpperCase())
        || offices.find((o) => String(replyTo).toUpperCase().includes(o.value.toUpperCase()));
    if (hit) idcSelectedOffices.add(hit.value);
    else if (replyTo) idcSelectedOffices.add(replyTo);

    renderIdcOfficeList();
    setIdcTab('compose');
    const sub = document.getElementById('idcSubject');
    const body = document.getElementById('idcBody');
    if (sub) {
        sub.value = typeof buildReplySubject === 'function'
            ? buildReplySubject(msg.subject)
            : `Re: ${msg.subject || ''}`;
    }
    if (body) {
        body.value = typeof buildReplyQuote === 'function' ? buildReplyQuote(msg) : `\n\n———\n${msg.body || ''}`;
        body.focus();
        body.setSelectionRange(0, 0);
    }
    document.getElementById('idcMemoType').value = 'correspondence';
}

function refreshIdcPortalUi() {
    const from = document.getElementById('idcFromOffice');
    if (from) from.textContent = `Your office: ${getIdcHomeOffice() || '—'}`;
    if (typeof populateCorrespondenceSampleSelect === 'function') {
        populateCorrespondenceSampleSelect(document.getElementById('idcSampleSelect'));
    }
    renderIdcOfficeList();
    if (idcActiveTab === 'inbox') renderIdcInbox();
    else if (idcActiveTab === 'sent') renderIdcSent();
    else {
        // still refresh unread badge
        const rows = getIdcInboxMessages();
        const unread = rows.filter((m) => typeof isMessageRead === 'function' && !isMessageRead(m)).length;
        const badge = document.getElementById('idcInboxBadge');
        const chip = document.getElementById('idcUnreadChip');
        if (badge) {
            badge.textContent = unread ? String(unread) : '';
            badge.hidden = !unread;
        }
        if (chip) {
            chip.textContent = `${unread} unread`;
            chip.hidden = !unread;
        }
    }
    updateIdcSideButtonBadge();
}

function wireIdcPortal() {
    const root = document.getElementById(IDC_MODULE_ID);
    if (!root || root.dataset.idcWired === '1') return;
    root.dataset.idcWired = '1';
    idcWired = true;

    root.addEventListener('change', (e) => {
        const cb = e.target.closest('[data-idc-office]');
        if (!cb) return;
        const val = cb.getAttribute('data-idc-office');
        if (cb.checked) idcSelectedOffices.add(val);
        else idcSelectedOffices.delete(val);
        renderIdcOfficeList();
    });

    root.addEventListener('click', (e) => {
        const add = e.target.closest('[data-idc-add-office]');
        if (add) {
            e.preventDefault();
            const val = add.getAttribute('data-idc-add-office');
            if (idcSelectedOffices.has(val)) idcSelectedOffices.delete(val);
            else idcSelectedOffices.add(val);
            renderIdcOfficeList();
            setIdcTab('compose');
            return;
        }
        const tab = e.target.closest('[data-idc-tab]');
        if (tab) {
            e.preventDefault();
            setIdcTab(tab.getAttribute('data-idc-tab'));
            return;
        }
        if (e.target.closest('#idcSelectAllBtn')) {
            e.preventDefault();
            const offices = typeof getItDirCommsOffices === 'function' ? getItDirCommsOffices() : [];
            offices.forEach((o) => idcSelectedOffices.add(o.value));
            renderIdcOfficeList();
            return;
        }
        if (e.target.closest('#idcClearOfficesBtn')) {
            e.preventDefault();
            idcSelectedOffices.clear();
            renderIdcOfficeList();
            return;
        }
        if (e.target.closest('#idcResetComposeBtn')) {
            e.preventDefault();
            document.getElementById('idcComposeForm')?.reset();
            const msgDateEl = document.getElementById('idcMsgDate');
            if (msgDateEl) msgDateEl.value = typeof todayIsoLocal === 'function' ? todayIsoLocal() : '';
            const sampleSelect = document.getElementById('idcSampleSelect');
            if (sampleSelect) sampleSelect.value = '';
            const printBtn = document.getElementById('idcPrintLetterBtn');
            if (printBtn) printBtn.hidden = true;
            idcSelectedOffices.clear();
            renderIdcOfficeList();
            return;
        }
        if (e.target.closest('#idcLoadSampleBtn')) {
            e.preventDefault();
            const sampleId = document.getElementById('idcSampleSelect')?.value;
            if (!sampleId) {
                if (typeof showToast === 'function') showToast('Choose a sample correspondence first.', 'warning');
                return;
            }
            if (typeof applyCorrespondenceSampleToIdc === 'function' && applyCorrespondenceSampleToIdc(sampleId)) {
                if (typeof showToast === 'function') showToast('Sample correspondence loaded.', 'success');
            }
            return;
        }
        if (e.target.closest('#idcPrintLetterBtn')) {
            e.preventDefault();
            const sampleId = document.getElementById('idcPrintLetterBtn')?.dataset.corrSample
                || document.getElementById('idcSampleSelect')?.value;
            if (!sampleId) {
                if (typeof showToast === 'function') showToast('Load a sample letter first.', 'warning');
                return;
            }
            const date = document.getElementById('idcMsgDate')?.value || '';
            if (typeof printCorrespondenceSample === 'function') {
                printCorrespondenceSample(sampleId, { date });
            }
            return;
        }
        if (e.target.closest('#idcRefreshBtn') || e.target.closest('#idcRefreshSentBtn')) {
            e.preventDefault();
            refreshIdcPortalUi();
            return;
        }
        if (e.target.closest('#idcMarkAllReadBtn')) {
            e.preventDefault();
            getIdcInboxMessages().forEach((m) => {
                if (typeof markMessageRead === 'function') markMessageRead(m.id);
            });
            refreshIdcPortalUi();
            if (typeof refreshOfficeMessagesUi === 'function') refreshOfficeMessagesUi();
            return;
        }
        const reply = e.target.closest('[data-idc-reply]');
        if (reply) {
            e.preventDefault();
            startIdcReply(reply.getAttribute('data-idc-reply'));
            return;
        }
        const mark = e.target.closest('[data-idc-mark-read]');
        if (mark) {
            e.preventDefault();
            if (typeof markMessageRead === 'function') markMessageRead(mark.getAttribute('data-idc-mark-read'));
            refreshIdcPortalUi();
            return;
        }
        const pickOffice = e.target.closest('[data-idc-select-office-key]');
        if (pickOffice) {
            e.preventDefault();
            selectIdcOfficeByKey(pickOffice.getAttribute('data-idc-select-office-key'));
            return;
        }
        const card = e.target.closest('.idc-card[data-idc-msg]');
        if (card && idcActiveTab === 'inbox' && !e.target.closest('button')) {
            if (typeof markMessageRead === 'function') markMessageRead(card.getAttribute('data-idc-msg'));
            card.classList.remove('is-unread');
            updateIdcSideButtonBadge();
        }
    });

    root.querySelector('#idcComposeForm')?.addEventListener('submit', submitIdcCompose);
    if (typeof populateCorrespondenceSampleSelect === 'function') {
        populateCorrespondenceSampleSelect(document.getElementById('idcSampleSelect'));
    }
}

function ensureIdcSideButton() {
    // Floating edge button removed — Comms lives in the left sidebar (#idcNavBtn).
    document.getElementById('idcSideBtn')?.remove();
    return document.getElementById('idcNavBtn');
}

function updateIdcSideButtonBadge() {
    document.getElementById('idcSideBtn')?.remove();
    const badge = document.getElementById('idcSideBadge');
    if (!badge) return;
    if (!currentUser || !canAccessItDirComms()) {
        badge.hidden = true;
        return;
    }
    const unread = getIdcInboxMessages().filter((m) => typeof isMessageRead === 'function' && !isMessageRead(m)).length;
    badge.textContent = unread > 99 ? '99+' : String(unread);
    badge.hidden = !unread;
    badge.title = unread ? `${unread} unread — open IT Dir Comms` : '';
}

function initItDirCommsModule() {
    wireIdcPortal();
    ensureIdcSideButton();
    refreshIdcPortalUi();
    setIdcTab(idcActiveTab || 'compose');
    const msgDateEl = document.getElementById('idcMsgDate');
    if (msgDateEl && !msgDateEl.value && typeof todayIsoLocal === 'function') {
        msgDateEl.value = todayIsoLocal();
    }
    if (typeof applyDateInputConstraints === 'function') {
        applyDateInputConstraints(document.getElementById('it-dir-comms') || document);
    }
}

function initItDirCommsSideButton() {
    ensureIdcSideButton();
    updateIdcSideButtonBadge();
}

window.initItDirCommsModule = initItDirCommsModule;
window.initItDirCommsSideButton = initItDirCommsSideButton;
window.refreshIdcPortalUi = refreshIdcPortalUi;
window.setIdcTab = setIdcTab;
window.IDC_MODULE_ID = IDC_MODULE_ID;
