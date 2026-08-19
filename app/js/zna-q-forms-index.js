/* ZNA Q Forms Index — searchable Annex A catalogue (In system vs Reference hub) */

function renderZnaQFormsIndex() {
    const tbody = document.getElementById('znaQIndexBody');
    const searchEl = document.getElementById('znaQIndexSearch');
    const scopeEl = document.getElementById('znaQIndexScope');
    const groupEl = document.getElementById('znaQIndexGroup');
    const statsEl = document.getElementById('znaQIndexStats');
    if (!tbody || typeof ZNA_Q_CATALOGUE === 'undefined') return;

    const q = String(searchEl?.value || '').trim().toLowerCase();
    const scope = String(scopeEl?.value || 'all');
    const groupMode = String(groupEl?.value || 'grouped');

    const filtered = ZNA_Q_CATALOGUE.filter((e) => {
        if (scope === 'implemented' && !e.moduleId) return false;
        if (scope === 'reference' && e.moduleId) return false;
        if (scope === 'itdir' && e.scope !== 'itdir') return false;
        if (scope !== 'all' && scope !== 'implemented' && scope !== 'reference' && scope !== 'itdir' && e.scope !== scope) {
            return false;
        }
        if (!q) return true;
        return (`zna-q-${e.code} ${e.code} ${e.title} ${e.scope}`).toLowerCase().includes(q);
    });

    const implemented = ZNA_Q_CATALOGUE.filter((e) => e.moduleId).length;
    if (statsEl) {
        statsEl.textContent = `Showing ${filtered.length} of ${ZNA_Q_CATALOGUE.length} · ${implemented} fillable in TechStores`;
    }

    const renderRow = (e) => {
        const status = e.moduleId
            ? '<span class="zna-q-status zna-q-status-ok">In system</span>'
            : '<span class="zna-q-status zna-q-status-ref">Reference</span>';
        const scopeLabel = (typeof ZNA_Q_SCOPE_LABELS !== 'undefined' && ZNA_Q_SCOPE_LABELS[e.scope]) || e.scope;
        const action = e.moduleId
            ? `<button type="button" class="btn btn-primary btn-sm" data-open-q="${e.moduleId}">Open</button>`
            : '<span class="muted">Paper / Annex A</span>';
        return `<tr>
            <td class="zna-q-code">ZNA-Q-${e.code}</td>
            <td>${escapeHtmlLite(e.title)}</td>
            <td>${escapeHtmlLite(scopeLabel)}</td>
            <td>${status}</td>
            <td>${action}</td>
        </tr>`;
    };

    let html = '';
    if (groupMode === 'grouped' && scope === 'all') {
        const inSys = filtered.filter((e) => e.moduleId);
        const ref = filtered.filter((e) => !e.moduleId);
        html += `<tr class="zna-q-group-row"><td colspan="5"><strong>In system</strong> — fillable modules (${inSys.length})</td></tr>`;
        html += inSys.map(renderRow).join('') || '<tr><td colspan="5" class="muted">No fillable forms match.</td></tr>';
        html += `<tr class="zna-q-group-row"><td colspan="5"><strong>Reference</strong> — Annex A catalogue (${ref.length})</td></tr>`;
        html += ref.map(renderRow).join('') || '<tr><td colspan="5" class="muted">No reference forms match.</td></tr>';
    } else {
        html = filtered.map(renderRow).join('') || '<tr><td colspan="5">No forms match the filter.</td></tr>';
    }

    tbody.innerHTML = html;

    tbody.querySelectorAll('[data-open-q]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-open-q');
            if (id && typeof navigateToModule === 'function') navigateToModule(id);
        });
    });
}

function escapeHtmlLite(v) {
    return String(v ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function initZnaQFormsIndex() {
    const searchEl = document.getElementById('znaQIndexSearch');
    const scopeEl = document.getElementById('znaQIndexScope');
    const groupEl = document.getElementById('znaQIndexGroup');
    if (!searchEl && !scopeEl) return;
    const refresh = () => renderZnaQFormsIndex();
    searchEl?.addEventListener('input', refresh);
    scopeEl?.addEventListener('change', refresh);
    groupEl?.addEventListener('change', refresh);
    refresh();
}

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initZnaQFormsIndex, 120);
});
