/* alert-desk.js — numbered / aged / prioritised System Alerts with Dept + Dir comments */

const ALERT_DEPARTMENTS = [
    "ZNA COMMANDER'S OFFICE",
    'GS BRANCH',
    'AS BRANCH',
    'QS BRANCH',
    'ARMY CAMP HQ',
    'HARARE DISTRICT',
    'DP',
    'AIAD',
    'DAF',
    'INSPECTORATE BRANCH',
    'IT DIR ADMIN OFFICE',
    'IT DIR ORDERLY ROOM',
    "IT DIR DIRECTOR'S OFFICE",
    "IT DIR DD'S OFFICE",
    "IT DIR AQSO2'S OFFICE",
    'ITTS (INFORMATION TECHNOLOGY TRAINING SCHOOL)',
    'IT DIR TECHSTORES OFFICE',
    'IT DIR SYSTEMS ADMINISTRATION DEPT',
    'IT ENGINEERING SUPPORT DEPT (WORKSHOP)',
    'IT DIR COMPUTER ENGINEERING DEPT',
    'IT DIR SOFTWARE ENGINEERING DEPT',
    'IT DIR ICT SECURITY DEPT',
    'IT DIR GATE / RP'
];

const ALERT_PRIORITIES = [
    { value: 'critical', label: 'Critical' },
    { value: 'high', label: 'High' },
    { value: 'normal', label: 'Normal' },
    { value: 'low', label: 'Low' }
];

function canManageAlertDesk() {
    if (!currentUser) return false;
    return ['admin', 'army_commander', 'brig_gs', 'brig_as', 'brig_qs', 'director', 'deputy_director', 'aqso2', 'dir_aiad', 'dir_daf', 'dir_dp'].includes(currentUser.role);
}

function ensureAlertDeskState() {
    if (!appState) return { seq: 0, meta: {} };
    if (!appState.alertDesk || typeof appState.alertDesk !== 'object') {
        appState.alertDesk = { seq: 0, meta: {} };
    }
    if (typeof appState.alertDesk.seq !== 'number') appState.alertDesk.seq = 0;
    if (!appState.alertDesk.meta || typeof appState.alertDesk.meta !== 'object') {
        appState.alertDesk.meta = {};
    }
    if (!appState.alertDesk.reads || typeof appState.alertDesk.reads !== 'object') {
        appState.alertDesk.reads = {};
    }
    return appState.alertDesk;
}

function alertDeskTodayIso() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function alertDeskParseDate(value) {
    if (!value) return null;
    const d = new Date(`${String(value).slice(0, 10)}T00:00:00`);
    if (Number.isNaN(d.getTime())) return null;
    d.setHours(0, 0, 0, 0);
    return d;
}

function alertDeskAgeDays(receivedIso, dueIso) {
    const start = alertDeskParseDate(receivedIso);
    if (!start) return 0;
    const end = new Date();
    end.setHours(0, 0, 0, 0);
    return Math.max(0, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
}

function alertDeskAgingBucket(ageDays, type, dueIso) {
    const due = alertDeskParseDate(dueIso);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (due && due < today) return { key: 'overdue', label: 'Overdue' };
    if (type === 'danger') return { key: 'overdue', label: 'Overdue' };
    if (ageDays <= 1) return { key: 'new', label: 'New (0–1d)' };
    if (ageDays <= 3) return { key: 'attention', label: 'Attention (2–3d)' };
    if (ageDays <= 7) return { key: 'aging', label: 'Aging (4–7d)' };
    return { key: 'overdue', label: 'Aging 8d+' };
}

function defaultDepartmentForAlert(alert) {
    if (alert.department) return alert.department;
    const t = alert.target || '';
    if (t === 'orderly-room') return 'IT DIR ORDERLY ROOM';
    if (t === 'unit-requisitions') return 'IT DIR TECHSTORES OFFICE';
    if (t === 'dp-procurement') {
        const text = String(alert.text || '').toLowerCase();
        if (text.includes('aiad')) return 'AIAD';
        return 'DP';
    }
    if (t === 'undelivered-orders' || t === 'purchase-orders') return 'DP';
    if (t === 'workshop-repairs' || t === 'zna-svcs-1045') return 'IT ENGINEERING SUPPORT DEPT (WORKSHOP)';
    if (t === 'gate-register') return 'IT DIR GATE / RP';
    if (t === 'temporary-loans' || t === 'permanent-loans' || t === 'voucher-module' || t === 'stock-take') return 'IT DIR TECHSTORES OFFICE';
    if (t === 'suppliers-contracts') return 'DP';
    return 'IT DIR TECHSTORES OFFICE';
}

function defaultPriorityForAlert(alert) {
    if (alert.priority) return alert.priority;
    if (alert.type === 'danger' || alert.redFlag) return 'critical';
    if (alert.type === 'warning') return 'high';
    return 'normal';
}

function alertStableId(alert) {
    if (alert.alertId) return String(alert.alertId);
    const parts = [
        alert.target || 'x',
        alert.reqId || '',
        alert.undId || '',
        alert.dpId || '',
        alert.loanId || '',
        alert.orId || '',
        alert.focus || '',
        (alert.text || '').slice(0, 80)
    ];
    return parts.join('|').replace(/\s+/g, ' ').trim();
}

function getOrCreateAlertMeta(alert) {
    const desk = ensureAlertDeskState();
    const id = alertStableId(alert);
    let created = false;
    if (!desk.meta[id]) {
        created = true;
        desk.seq += 1;
        desk.meta[id] = {
            number: desk.seq,
            department: defaultDepartmentForAlert(alert),
            priority: defaultPriorityForAlert(alert),
            redFlag: !!(alert.type === 'danger' || alert.redFlag),
            receivedDate: alert.receivedDate || alertDeskTodayIso(),
            dueDate: alert.dueDate || '',
            comments: [],
            firstSeenAt: new Date().toISOString()
        };
    } else {
        const m = desk.meta[id];
        if (!m.number) {
            desk.seq += 1;
            m.number = desk.seq;
            created = true;
        }
        if (!m.department) m.department = defaultDepartmentForAlert(alert);
        if (!m.priority) m.priority = defaultPriorityForAlert(alert);
        if (!m.receivedDate) m.receivedDate = alert.receivedDate || alertDeskTodayIso();
        if (!m.dueDate && alert.dueDate) m.dueDate = alert.dueDate;
        if (!Array.isArray(m.comments)) m.comments = [];
        if (m.redFlag == null) m.redFlag = alert.type === 'danger';
    }
    return { id, meta: desk.meta[id], created };
}

function enrichAlertForDesk(alert) {
    const { id, meta, created } = getOrCreateAlertMeta(alert);
    const receivedDate = meta.receivedDate || alert.receivedDate || alertDeskTodayIso();
    const dueDate = meta.dueDate || alert.dueDate || '';
    const ageDays = alert.ageDays != null ? Number(alert.ageDays) : alertDeskAgeDays(receivedDate);
    const priority = meta.priority || defaultPriorityForAlert(alert);
    const redFlag = !!meta.redFlag;
    const aging = alertDeskAgingBucket(ageDays, alert.type, dueDate);
    return {
        ...alert,
        deskId: id,
        number: meta.number,
        department: meta.department || defaultDepartmentForAlert(alert),
        priority,
        redFlag,
        receivedDate,
        dueDate,
        ageDays,
        aging,
        comments: meta.comments || [],
        _metaCreated: created
    };
}

function collectDeskAlerts(watchSections, otherAlerts) {
    const list = [];
    let createdAny = false;
    (watchSections || []).forEach((section) => {
        (section.items || []).forEach((item) => {
            const enriched = enrichAlertForDesk({
                ...item,
                sectionKey: section.key,
                sectionTitle: section.title
            });
            if (enriched._metaCreated) createdAny = true;
            delete enriched._metaCreated;
            list.push(enriched);
        });
    });
    (otherAlerts || []).forEach((item) => {
        const enriched = enrichAlertForDesk({
            ...item,
            sectionKey: 'other',
            sectionTitle: 'Other alerts'
        });
        if (enriched._metaCreated) createdAny = true;
        delete enriched._metaCreated;
        list.push(enriched);
    });
    const priRank = { critical: 0, high: 1, normal: 2, low: 3 };
    list.sort((a, b) => {
        const rf = Number(!!b.redFlag) - Number(!!a.redFlag);
        if (rf) return rf;
        const pr = (priRank[a.priority] ?? 9) - (priRank[b.priority] ?? 9);
        if (pr) return pr;
        const age = (b.ageDays || 0) - (a.ageDays || 0);
        if (age) return age;
        return (a.number || 0) - (b.number || 0);
    });
    if (createdAny && typeof saveState === 'function') saveState();
    window.__lastAlertDeskIds = list.map((a) => a.deskId).filter(Boolean);
    return list;
}

function deptOptionsHtml(selected) {
    return ALERT_DEPARTMENTS.map((d) =>
        `<option value="${escapeAlertText(d)}"${d === selected ? ' selected' : ''}>${escapeAlertText(d)}</option>`
    ).join('');
}

function priorityOptionsHtml(selected) {
    return ALERT_PRIORITIES.map((p) =>
        `<option value="${escapeAlertText(p.value)}"${p.value === selected ? ' selected' : ''}>${escapeAlertText(p.label)}</option>`
    ).join('');
}

function renderAlertDeskCard(alert) {
    const canManage = canManageAlertDesk();
    const unread = typeof isAlertUnread === 'function' ? isAlertUnread(alert.deskId) : false;
    const clickAttrs = alert.target
        ? `data-alert-target="${escapeAlertText(alert.target)}"${alert.reqId ? ` data-alert-req-id="${escapeAlertText(alert.reqId)}"` : ''}${alert.undId ? ` data-alert-und-id="${escapeAlertText(alert.undId)}"` : ''}${alert.dpId ? ` data-alert-dp-id="${escapeAlertText(alert.dpId)}"` : ''}${alert.loanId ? ` data-alert-loan-id="${escapeAlertText(alert.loanId)}"` : ''}${alert.orId ? ` data-alert-or-id="${escapeAlertText(alert.orId)}"` : ''}${alert.focus ? ` data-alert-focus="${escapeAlertText(alert.focus)}"` : ''}`
        : '';
    const commentsHtml = (alert.comments || []).slice(-3).map((c) => `
        <div class="ad-comment">
            <strong>${escapeAlertText(c.by || 'Officer')}</strong>
            <span class="ad-comment-role">${escapeAlertText(c.roleLabel || c.role || '')}</span>
            <span class="ad-comment-at">${escapeAlertText(c.atLabel || '')}</span>
            <p>${escapeAlertText(c.text)}</p>
        </div>
    `).join('');

    return `
        <article class="ad-card alert-${escapeAlertText(alert.type || 'info')}-item${alert.redFlag ? ' ad-card-flagged' : ''} ad-pri-${escapeAlertText(alert.priority)}${unread ? ' ad-unread' : ' ad-read'}" data-desk-id="${escapeAlertText(alert.deskId)}">
            <header class="ad-card-head">
                ${unread ? '<span class="om-dot" title="Unread alert"></span>' : '<span class="om-dot om-dot-read" title="Read"></span>'}
                <span class="ad-number" title="Alert number">#${String(alert.number).padStart(3, '0')}</span>
                ${alert.redFlag ? '<span class="ad-flag" title="Red flagged">FLAG</span>' : ''}
                <span class="ad-priority ad-priority-${escapeAlertText(alert.priority)}">${escapeAlertText((ALERT_PRIORITIES.find((p) => p.value === alert.priority) || {}).label || alert.priority)}</span>
                <span class="ad-aging ad-aging-${escapeAlertText(alert.aging.key)}">${escapeAlertText(alert.aging.label)} · ${alert.ageDays}d</span>
                ${unread ? '<span class="ad-unread-tag">NEW</span>' : '<span class="ad-read-tag">Read</span>'}
            </header>
            <button type="button" class="ad-card-body"${clickAttrs ? ` ${clickAttrs}` : ''} title="Open related module" data-ad-open="${escapeAlertText(alert.deskId)}">
                <div class="ad-text">${escapeAlertText(alert.text)}</div>
                <div class="ad-meta-row">
                    <span><em>Dept</em> ${escapeAlertText(alert.department)}</span>
                    <span><em>In</em> ${escapeAlertText(alert.receivedDate || '—')}</span>
                    <span><em>Due</em> ${escapeAlertText(alert.dueDate || '—')}</span>
                </div>
            </button>
            ${canManage ? `
            <div class="ad-controls" data-ad-stop>
                <label class="ad-field">
                    <span>Department</span>
                    <select class="form-control ad-dept" data-ad-dept="${escapeAlertText(alert.deskId)}">${deptOptionsHtml(alert.department)}</select>
                </label>
                <label class="ad-field">
                    <span>Priority</span>
                    <select class="form-control ad-pri" data-ad-pri="${escapeAlertText(alert.deskId)}">${priorityOptionsHtml(alert.priority)}</select>
                </label>
                <label class="ad-field">
                    <span>Date in</span>
                    <input type="date" class="form-control" data-ad-received="${escapeAlertText(alert.deskId)}" value="${escapeAlertText(alert.receivedDate || '')}">
                </label>
                <label class="ad-field">
                    <span>Due</span>
                    <input type="date" class="form-control" data-ad-due="${escapeAlertText(alert.deskId)}" value="${escapeAlertText(alert.dueDate || '')}">
                </label>
                <label class="ad-flag-toggle">
                    <input type="checkbox" data-ad-flag="${escapeAlertText(alert.deskId)}"${alert.redFlag ? ' checked' : ''}>
                    Red flag
                </label>
            </div>
            <div class="ad-comments" data-ad-stop>
                ${commentsHtml || '<div class="ad-comment-empty">No command comments yet.</div>'}
                <div class="ad-comment-compose">
                    <input type="text" class="form-control" data-ad-comment-input="${escapeAlertText(alert.deskId)}" maxlength="240" placeholder="Comment as Dir / DD / AQSO2…">
                    <button type="button" class="btn btn-primary btn-sm" data-ad-comment-btn="${escapeAlertText(alert.deskId)}">Post</button>
                </div>
            </div>
            ` : `
            <div class="ad-comments ad-comments-readonly">
                ${commentsHtml || ''}
            </div>
            `}
        </article>
    `;
}

function getAlertDeskFilterState() {
    return {
        dept: document.getElementById('adFilterDept')?.value || '',
        priority: document.getElementById('adFilterPriority')?.value || '',
        flagged: document.getElementById('adFilterFlagged')?.checked || false,
        aging: document.getElementById('adFilterAging')?.value || '',
        unreadOnly: document.getElementById('adFilterUnreadOnly')?.checked || false
    };
}

function alertMatchesDeskFilter(alert, f) {
    if (f.dept && alert.department !== f.dept) return false;
    if (f.priority && alert.priority !== f.priority) return false;
    if (f.flagged && !alert.redFlag) return false;
    if (f.aging && alert.aging?.key !== f.aging) return false;
    if (f.unreadOnly && typeof isAlertUnread === 'function' && !isAlertUnread(alert.deskId)) return false;
    return true;
}

function renderAlertDesk(watchSections, otherAlerts) {
    const listEl = document.getElementById('systemAlertsList');
    if (!listEl) return 0;

    ensureAlertDeskState();
    const all = collectDeskAlerts(watchSections, otherAlerts);
    const filters = getAlertDeskFilterState();
    const filtered = all.filter((a) => alertMatchesDeskFilter(a, filters));
    const unreadCount = typeof getUnreadAlertCount === 'function'
        ? getUnreadAlertCount(all.map((a) => a.deskId))
        : 0;

    const watchSummary = (watchSections || []).map((s) => `
        <button type="button" class="ad-chip ad-chip-${escapeAlertText(s.tone)}" data-alert-target="${escapeAlertText(s.target || '')}" title="${escapeAlertText(s.summary || '')}">
            <span>${escapeAlertText(s.title.replace(/^PENDING REQUISITIONS |^ORDERLY ROOM — |^PURCHASE ORDERS /, '').slice(0, 28))}</span>
            <strong>${s.count}</strong>
        </button>
    `).join('');

    listEl.innerHTML = `
        <div class="ad-chip-row">${watchSummary}</div>
        <div class="ad-toolbar">
            <select class="form-control" id="adFilterDept" title="Filter by department">
                <option value="">All departments</option>
                ${ALERT_DEPARTMENTS.map((d) => `<option value="${escapeAlertText(d)}"${filters.dept === d ? ' selected' : ''}>${escapeAlertText(d)}</option>`).join('')}
            </select>
            <select class="form-control" id="adFilterPriority" title="Filter by priority">
                <option value="">All priorities</option>
                ${ALERT_PRIORITIES.map((p) => `<option value="${escapeAlertText(p.value)}"${filters.priority === p.value ? ' selected' : ''}>${escapeAlertText(p.label)}</option>`).join('')}
            </select>
            <select class="form-control" id="adFilterAging" title="Filter by aging">
                <option value="">All ages</option>
                <option value="new"${filters.aging === 'new' ? ' selected' : ''}>New</option>
                <option value="attention"${filters.aging === 'attention' ? ' selected' : ''}>Attention</option>
                <option value="aging"${filters.aging === 'aging' ? ' selected' : ''}>Aging</option>
                <option value="overdue"${filters.aging === 'overdue' ? ' selected' : ''}>Overdue</option>
            </select>
            <label class="ad-flag-filter"><input type="checkbox" id="adFilterFlagged"${filters.flagged ? ' checked' : ''}> Flagged only</label>
            <label class="ad-flag-filter"><input type="checkbox" id="adFilterUnreadOnly"${filters.unreadOnly ? ' checked' : ''}> Unread only</label>
        </div>
        <div class="ad-list">
            ${filtered.length
                ? filtered.map(renderAlertDeskCard).join('')
                : '<div class="alert-item alert-success-item">No alerts match this filter — clear filters or check back later.</div>'}
        </div>
    `;

    wireAlertDeskControls();
    if (typeof updateSaTabBadges === 'function') updateSaTabBadges(all.length, unreadCount);
    window.__saCachedAlerts = all;
    if (typeof refreshMailLayoutIfActive === 'function') refreshMailLayoutIfActive();
    // Keep only the active tab pane visible after alert refresh (do not rebuild Compose)
    if (typeof applySaTabVisibility === 'function') applySaTabVisibility();
    else if (typeof setSaTab === 'function') setSaTab(window.saActiveTab || 'alerts');
    return all.length;
}

function wireAlertDeskControls() {
    const root = document.getElementById('systemAlertsList');
    if (!root) return;

    if (root.dataset.adWired !== '1') {
        root.dataset.adWired = '1';
        root.addEventListener('change', (e) => {
            if (e.target.id === 'adFilterDept' || e.target.id === 'adFilterPriority'
                || e.target.id === 'adFilterAging' || e.target.id === 'adFilterFlagged'
                || e.target.id === 'adFilterUnreadOnly') {
                if (typeof updateSystemAlerts === 'function') updateSystemAlerts();
                if (typeof updateCommandBoard === 'function') updateCommandBoard();
                return;
            }
            const dept = e.target.closest('[data-ad-dept]');
            const pri = e.target.closest('[data-ad-pri]');
            const flag = e.target.closest('[data-ad-flag]');
            const received = e.target.closest('[data-ad-received]');
            const due = e.target.closest('[data-ad-due]');
            if (dept) updateAlertDeskField(dept.getAttribute('data-ad-dept'), { department: dept.value });
            if (pri) {
                const priority = pri.value;
                updateAlertDeskField(pri.getAttribute('data-ad-pri'), {
                    priority,
                    ...(priority === 'critical' ? { redFlag: true } : {})
                });
            }
            if (flag) updateAlertDeskField(flag.getAttribute('data-ad-flag'), { redFlag: !!flag.checked });
            if (received) updateAlertDeskField(received.getAttribute('data-ad-received'), { receivedDate: received.value || '' });
            if (due) updateAlertDeskField(due.getAttribute('data-ad-due'), { dueDate: due.value || '' });
        });

        root.addEventListener('click', (e) => {
            const open = e.target.closest('[data-ad-open], .ad-card[data-desk-id]');
            if (open) {
                const deskId = open.getAttribute('data-ad-open')
                    || open.closest('[data-desk-id]')?.getAttribute('data-desk-id');
                if (deskId && typeof markAlertRead === 'function') {
                    markAlertRead(deskId);
                    const card = [...root.querySelectorAll('.ad-card[data-desk-id]')]
                        .find((el) => el.getAttribute('data-desk-id') === deskId);
                    if (card) {
                        card.classList.remove('ad-unread');
                        card.classList.add('ad-read');
                        const dot = card.querySelector('.om-dot');
                        if (dot) {
                            dot.classList.add('om-dot-read');
                            dot.title = 'Read';
                        }
                        const tag = card.querySelector('.ad-unread-tag');
                        if (tag) {
                            tag.className = 'ad-read-tag';
                            tag.textContent = 'Read';
                        }
                    }
                    if (typeof updateCommandBoard === 'function') updateCommandBoard();
                }
            }
            const btn = e.target.closest('[data-ad-comment-btn]');
            if (!btn) return;
            e.preventDefault();
            e.stopPropagation();
            const id = btn.getAttribute('data-ad-comment-btn');
            const input = [...root.querySelectorAll('[data-ad-comment-input]')]
                .find((el) => el.getAttribute('data-ad-comment-input') === id);
            postAlertDeskComment(id, input?.value || '');
            if (input) input.value = '';
        });
    }
}

function updateAlertDeskField(deskId, patch) {
    if (!canManageAlertDesk()) {
        showToast('Only Dir / DD / AQSO2 can update alert desk fields.', 'error');
        return;
    }
    const desk = ensureAlertDeskState();
    if (!desk.meta[deskId]) return;
    Object.assign(desk.meta[deskId], patch);
    if (typeof saveState === 'function') saveState();
    if (typeof updateSystemAlerts === 'function') updateSystemAlerts();
    if (typeof updateCommandBoard === 'function') updateCommandBoard();
}

function postAlertDeskComment(deskId, text) {
    if (!canManageAlertDesk()) {
        showToast('Only Dir / DD / AQSO2 can comment on alerts.', 'error');
        return;
    }
    const body = String(text || '').trim();
    if (!body) {
        showToast('Enter a short comment.', 'error');
        return;
    }
    const desk = ensureAlertDeskState();
    if (!desk.meta[deskId]) return;
    const now = new Date();
    desk.meta[deskId].comments = desk.meta[deskId].comments || [];
    desk.meta[deskId].comments.push({
        id: `adc-${Date.now()}`,
        text: body,
        by: currentUser?.name || currentUser?.username || 'Officer',
        role: currentUser?.role || '',
        roleLabel: (typeof ROLE_LABELS !== 'undefined' ? ROLE_LABELS[currentUser?.role] : '') || currentUser?.role || '',
        at: now.toISOString(),
        atLabel: now.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
    });
    if (typeof saveState === 'function') saveState();
    showToast('Comment posted on alert.', 'success');
    if (typeof updateSystemAlerts === 'function') updateSystemAlerts();
    if (typeof updateCommandBoard === 'function') updateCommandBoard();
}
