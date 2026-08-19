/* correspondence-files.js — IT Dir Orderly Room Correspondence Files Register */

const CF_STATUS = {
    in: 'In',
    out: 'Out',
    not_opened: 'Not opened'
};

function cfEscape(v) {
    return String(v ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function createDefaultCorrespondenceFiles() {
    const seed = typeof CORRESPONDENCE_FILES_SEED !== 'undefined' ? CORRESPONDENCE_FILES_SEED : [];
    return seed.map((row) => ({
        ser: row.ser,
        ref: row.ref,
        file: row.file,
        status: row.status || 'in',
        remarks: row.remarks || '',
        updatedAt: '',
        updatedBy: ''
    }));
}

function ensureCorrespondenceFiles() {
    if (!appState) return [];
    if (!Array.isArray(appState.correspondenceFiles) || !appState.correspondenceFiles.length) {
        appState.correspondenceFiles = createDefaultCorrespondenceFiles();
    } else {
        const bySer = new Map(appState.correspondenceFiles.map((r) => [Number(r.ser), r]));
        const seed = typeof CORRESPONDENCE_FILES_SEED !== 'undefined' ? CORRESPONDENCE_FILES_SEED : [];
        seed.forEach((s) => {
            if (!bySer.has(Number(s.ser))) {
                bySer.set(Number(s.ser), {
                    ser: s.ser,
                    ref: s.ref,
                    file: s.file,
                    status: s.status || 'in',
                    remarks: s.remarks || '',
                    updatedAt: '',
                    updatedBy: ''
                });
            } else {
                const cur = bySer.get(Number(s.ser));
                if (!cur.ref) cur.ref = s.ref;
                if (!cur.file) cur.file = s.file;
            }
        });
        appState.correspondenceFiles = [...bySer.values()].sort((a, b) => a.ser - b.ser);
    }
    return appState.correspondenceFiles;
}

function ensureCorrespondenceHandovers() {
    if (!appState) return [];
    if (!Array.isArray(appState.correspondenceHandovers)) {
        appState.correspondenceHandovers = [];
    }
    return appState.correspondenceHandovers;
}

function getCorrespondenceFilterState() {
    return {
        q: (document.getElementById('cfSearch')?.value || '').trim().toLowerCase(),
        status: document.getElementById('cfFilterStatus')?.value || '',
        group: document.getElementById('cfFilterGroup')?.value || ''
    };
}

function correspondenceMatches(row, f) {
    if (f.status && row.status !== f.status) return false;
    if (f.group) {
        const ref = String(row.ref || '');
        if (f.group === 'ict' && !ref.startsWith('IT/34')) return false;
        if (f.group === 'admin' && !/^IT\/9|^IT\/10/.test(ref)) return false;
        if (f.group === 'ops' && !/^IT\/1$|^IT\/1\/|^IT\/3|^IT\/5|^IT\/6|^IT\/7/.test(ref)) return false;
        if (f.group === 'log' && !/^IT\/1[2-8]|^IT\/20|^IT\/2[1-6]/.test(ref)) return false;
    }
    if (!f.q) return true;
    const hay = `${row.ser} ${row.ref || ''} ${row.file || ''} ${row.remarks || ''}`.toLowerCase();
    return hay.includes(f.q);
}

function updateCorrespondenceStats() {
    const all = ensureCorrespondenceFiles();
    const set = (id, n) => {
        const el = document.getElementById(id);
        if (el) el.textContent = String(n);
    };
    set('cfStatTotal', all.length);
    set('cfStatIn', all.filter((r) => r.status === 'in').length);
    set('cfStatOut', all.filter((r) => r.status === 'out').length);
    set('cfStatClosed', all.filter((r) => r.status === 'not_opened').length);
}

function renderCorrespondenceFilesTable() {
    const tbody = document.getElementById('correspondenceFilesBody');
    if (!tbody) return;
    updateCorrespondenceStats();
    const f = getCorrespondenceFilterState();
    const rows = ensureCorrespondenceFiles().filter((r) => correspondenceMatches(r, f));
    const canEdit = typeof canEditData === 'function' ? canEditData() : true;

    tbody.innerHTML = rows.map((row) => `
        <tr data-cf-ser="${row.ser}" class="${row.status === 'not_opened' ? 'cf-row-closed' : ''}${row.status === 'out' ? ' cf-row-out' : ''}">
            <td class="cf-ser">${row.ser}</td>
            <td class="cf-ref"><strong>${cfEscape(row.ref)}</strong></td>
            <td class="cf-file">${cfEscape(row.file)}</td>
            <td>
                ${canEdit ? `
                <select class="form-control cf-status-select" data-cf-status="${row.ser}" aria-label="In/Out status">
                    <option value="in"${row.status === 'in' ? ' selected' : ''}>In</option>
                    <option value="out"${row.status === 'out' ? ' selected' : ''}>Out</option>
                    <option value="not_opened"${row.status === 'not_opened' ? ' selected' : ''}>Not opened</option>
                </select>` : `<span class="cf-status-badge cf-status-${cfEscape(row.status)}">${cfEscape(CF_STATUS[row.status] || row.status)}</span>`}
            </td>
            <td>
                ${canEdit
                    ? `<input type="text" class="form-control cf-remarks-input" data-cf-remarks="${row.ser}" value="${cfEscape(row.remarks)}" placeholder="—" maxlength="120">`
                    : cfEscape(row.remarks || '—')}
            </td>
        </tr>
    `).join('') || '<tr><td colspan="5" class="empty-state">No files match this filter.</td></tr>';
}

function setCorrespondenceStatus(ser, status) {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;
    const row = ensureCorrespondenceFiles().find((r) => Number(r.ser) === Number(ser));
    if (!row) return;
    row.status = status;
    row.updatedAt = new Date().toISOString();
    row.updatedBy = currentUser?.username || '';
    if (status === 'not_opened' && !row.remarks) row.remarks = 'Not opened';
    if (typeof saveState === 'function') saveState();
    updateCorrespondenceStats();
}

function setCorrespondenceRemarks(ser, remarks) {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;
    const row = ensureCorrespondenceFiles().find((r) => Number(r.ser) === Number(ser));
    if (!row) return;
    row.remarks = String(remarks || '').trim();
    row.updatedAt = new Date().toISOString();
    row.updatedBy = currentUser?.username || '';
    if (typeof saveState === 'function') saveState();
}

function renderCorrespondenceHandovers() {
    const tbody = document.getElementById('cfHandoverBody');
    if (!tbody) return;
    const rows = ensureCorrespondenceHandovers().slice().sort((a, b) =>
        String(b.date || '').localeCompare(String(a.date || '')));
    tbody.innerHTML = rows.map((h) => `
        <tr>
            <td>${cfEscape(h.date || '—')}</td>
            <td>${cfEscape(h.checkedBy || '—')}</td>
            <td>${cfEscape(h.receivedBy || '—')}</td>
            <td>${cfEscape(h.verifiedBy || '—')}</td>
            <td>${cfEscape(h.authenticatedBy || '—')}</td>
            <td>${cfEscape(h.notes || '—')}</td>
            <td class="qm-screen-only">
                <button type="button" class="btn btn-ghost btn-sm" data-cf-handover-del="${cfEscape(h.id)}">Del</button>
            </td>
        </tr>
    `).join('') || '<tr><td colspan="7" class="empty-state">No handover / take-over records yet.</td></tr>';
}

function saveCorrespondenceHandover() {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;
    const date = document.getElementById('cfHoDate')?.value || '';
    const checkedBy = (document.getElementById('cfHoChecked')?.value || '').trim();
    const receivedBy = (document.getElementById('cfHoReceived')?.value || '').trim();
    const verifiedBy = (document.getElementById('cfHoVerified')?.value || '').trim();
    const authenticatedBy = (document.getElementById('cfHoAuth')?.value || '').trim();
    const notes = (document.getElementById('cfHoNotes')?.value || '').trim();
    if (!date || (!checkedBy && !receivedBy)) {
        showToast('Enter date and at least Checked by (outgoing) or Received by (incoming).', 'error');
        return;
    }
    ensureCorrespondenceHandovers().unshift({
        id: `cfho-${Date.now()}`,
        date,
        checkedBy,
        receivedBy,
        verifiedBy,
        authenticatedBy,
        notes,
        createdAt: new Date().toISOString(),
        createdBy: currentUser?.username || ''
    });
    if (typeof saveState === 'function') saveState();
    ['cfHoChecked', 'cfHoReceived', 'cfHoVerified', 'cfHoAuth', 'cfHoNotes'].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    renderCorrespondenceHandovers();
    showToast('Handover / take-over recorded.', 'success');
}

function showOrderlyRoomTab(tab) {
    const root = document.getElementById('orderly-room');
    if (!root) return;
    root.querySelectorAll('.or-tab').forEach((b) => b.classList.toggle('is-active', b.getAttribute('data-or-tab') === tab));
    root.querySelectorAll('[data-or-panel]').forEach((p) => {
        p.hidden = p.getAttribute('data-or-panel') !== tab;
    });
    if (tab === 'files') {
        renderCorrespondenceFilesTable();
        renderCorrespondenceHandovers();
    }
}

function initCorrespondenceFilesModule() {
    const root = document.getElementById('orderly-room');
    if (!root || root.dataset.cfInit === '1') return;
    root.dataset.cfInit = '1';

    ensureCorrespondenceFiles();

    root.querySelectorAll('.or-tab').forEach((btn) => {
        btn.addEventListener('click', () => showOrderlyRoomTab(btn.getAttribute('data-or-tab') || 'df'));
    });

    ['cfSearch', 'cfFilterStatus', 'cfFilterGroup'].forEach((id) => {
        document.getElementById(id)?.addEventListener('input', renderCorrespondenceFilesTable);
        document.getElementById(id)?.addEventListener('change', renderCorrespondenceFilesTable);
    });

    document.getElementById('correspondenceFilesBody')?.addEventListener('change', (e) => {
        const sel = e.target.closest('[data-cf-status]');
        if (sel) setCorrespondenceStatus(sel.getAttribute('data-cf-status'), sel.value);
        const input = e.target.closest('[data-cf-remarks]');
        if (input) setCorrespondenceRemarks(input.getAttribute('data-cf-remarks'), input.value);
    });

    document.getElementById('cfHoSaveBtn')?.addEventListener('click', saveCorrespondenceHandover);
    document.getElementById('cfHandoverBody')?.addEventListener('click', (e) => {
        const id = e.target.closest('[data-cf-handover-del]')?.getAttribute('data-cf-handover-del');
        if (!id) return;
        if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;
        if (!confirm('Remove this handover record?')) return;
        appState.correspondenceHandovers = ensureCorrespondenceHandovers().filter((h) => h.id !== id);
        if (typeof saveState === 'function') saveState();
        renderCorrespondenceHandovers();
    });

    const dateEl = document.getElementById('cfHoDate');
    if (dateEl && !dateEl.value) {
        const d = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        dateEl.value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    }
}

function renderCorrespondenceFilesModule() {
    ensureCorrespondenceFiles();
    renderCorrespondenceFilesTable();
    renderCorrespondenceHandovers();
}
