/* unit-checks.js — ASO Ch 28 unit / stores check log */

function ensureUnitChecks() {
    if (!appState.unitChecks) appState.unitChecks = [];
    return appState.unitChecks;
}

function renderUnitChecksModule() {
    const tbody = document.getElementById('unitChecksBody');
    if (!tbody) return;
    const list = ensureUnitChecks().slice().sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
    tbody.innerHTML = list.map((row) => `
        <tr data-check-id="${escapeHtmlLiteUc(row.id)}">
            <td>${escapeHtmlLiteUc(row.date || '')}</td>
            <td>${escapeHtmlLiteUc(row.checkType || '')}</td>
            <td>${escapeHtmlLiteUc(row.area || '')}</td>
            <td>${escapeHtmlLiteUc(row.checkedBy || '')}</td>
            <td>${escapeHtmlLiteUc(row.findings || '')}</td>
            <td>${escapeHtmlLiteUc(row.action || '')}</td>
            <td>${escapeHtmlLiteUc(row.nextDue || '')}</td>
            <td class="qm-screen-only">
                <button type="button" class="btn btn-ghost btn-sm" data-uc-edit="${escapeHtmlLiteUc(row.id)}">Edit</button>
                <button type="button" class="btn btn-danger btn-sm" data-uc-del="${escapeHtmlLiteUc(row.id)}">Delete</button>
            </td>
        </tr>
    `).join('') || '<tr><td colspan="8" class="empty-state">No unit checks logged yet. Record surprise / routine checks per ASO Ch 28.</td></tr>';
}

function escapeHtmlLiteUc(v) {
    return String(v ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function resetUnitCheckForm() {
    const ids = ['ucDate', 'ucType', 'ucArea', 'ucBy', 'ucFindings', 'ucAction', 'ucNextDue'];
    ids.forEach((id) => {
        const el = document.getElementById(id);
        if (!el) return;
        if (el.tagName === 'SELECT') el.selectedIndex = 0;
        else el.value = '';
    });
    const form = document.getElementById('unitCheckForm');
    if (form) form.dataset.editingId = '';
    const dateEl = document.getElementById('ucDate');
    if (dateEl && !dateEl.value) dateEl.value = new Date().toISOString().slice(0, 10);
    const byEl = document.getElementById('ucBy');
    if (byEl && !byEl.value && typeof currentUser !== 'undefined') {
        byEl.value = currentUser?.name || currentUser?.username || '';
    }
}

function saveUnitCheckFromForm() {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;
    const date = document.getElementById('ucDate')?.value || '';
    const checkType = document.getElementById('ucType')?.value || '';
    const area = document.getElementById('ucArea')?.value?.trim() || '';
    const checkedBy = document.getElementById('ucBy')?.value?.trim() || '';
    const findings = document.getElementById('ucFindings')?.value?.trim() || '';
    const action = document.getElementById('ucAction')?.value?.trim() || '';
    const nextDue = document.getElementById('ucNextDue')?.value || '';
    if (!date || !checkType) {
        showToast?.('Date and check type are required.', 'error');
        return;
    }
    const list = ensureUnitChecks();
    const editingId = document.getElementById('unitCheckForm')?.dataset.editingId || '';
    if (editingId) {
        const row = list.find((r) => r.id === editingId);
        if (!row) {
            showToast?.('Record not found.', 'error');
            return;
        }
        Object.assign(row, { date, checkType, area, checkedBy, findings, action, nextDue });
        showToast?.('Unit check updated.', 'success');
    } else {
        list.push({
            id: `uc-${Date.now().toString(36)}`,
            date,
            checkType,
            area,
            checkedBy,
            findings,
            action,
            nextDue,
            createdAt: new Date().toISOString()
        });
        showToast?.('Unit check logged.', 'success');
    }
    saveState?.();
    resetUnitCheckForm();
    renderUnitChecksModule();
    updateSystemAlerts?.();
}

function editUnitCheck(id) {
    const row = ensureUnitChecks().find((r) => r.id === id);
    if (!row) return;
    document.getElementById('ucDate').value = row.date || '';
    document.getElementById('ucType').value = row.checkType || 'Routine';
    document.getElementById('ucArea').value = row.area || '';
    document.getElementById('ucBy').value = row.checkedBy || '';
    document.getElementById('ucFindings').value = row.findings || '';
    document.getElementById('ucAction').value = row.action || '';
    document.getElementById('ucNextDue').value = row.nextDue || '';
    const form = document.getElementById('unitCheckForm');
    if (form) form.dataset.editingId = id;
}

function deleteUnitCheck(id) {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;
    const ok = typeof confirmAction === 'function'
        ? confirmAction('Delete this unit check record?')
        : window.confirm('Delete this unit check record?');
    if (!ok) return;
    appState.unitChecks = ensureUnitChecks().filter((r) => r.id !== id);
    saveState?.();
    renderUnitChecksModule();
    showToast?.('Unit check deleted.', 'info');
}

function getUnitCheckAlerts() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const alerts = [];
    ensureUnitChecks().forEach((row) => {
        if (!row.nextDue) return;
        const due = new Date(row.nextDue);
        due.setHours(0, 0, 0, 0);
        const days = Math.ceil((due - today) / 86400000);
        if (days < 0) {
            alerts.push({
                type: 'warning',
                target: 'unit-checks',
                text: `Unit check overdue: ${row.checkType || 'Check'} · ${row.area || 'stores'} (due ${row.nextDue}).`
            });
        } else if (days <= 14) {
            alerts.push({
                type: 'info',
                target: 'unit-checks',
                text: `Unit check due soon: ${row.checkType || 'Check'} · ${row.area || 'stores'} (${days}d).`
            });
        }
    });
    return alerts;
}

function initUnitChecksModule() {
    const host = document.getElementById('unit-checks');
    if (!host || host.dataset.ucInit === '1') return;
    host.dataset.ucInit = '1';
    resetUnitCheckForm();
    document.getElementById('ucSaveBtn')?.addEventListener('click', saveUnitCheckFromForm);
    document.getElementById('ucResetBtn')?.addEventListener('click', resetUnitCheckForm);
    document.getElementById('unitChecksBody')?.addEventListener('click', (e) => {
        const editId = e.target.closest('[data-uc-edit]')?.getAttribute('data-uc-edit');
        const delId = e.target.closest('[data-uc-del]')?.getAttribute('data-uc-del');
        if (editId) editUnitCheck(editId);
        if (delId) deleteUnitCheck(delId);
    });
    renderUnitChecksModule();
}
