/* window-chrome.js — Maximize / restore for modals and table focus overlays */

function wcEscapeHtml(v) {
    return String(v ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function winChromeControlsHtml(closeAttr = 'data-wc-close') {
    return `
        <div class="win-chrome-controls" role="group" aria-label="Window controls">
            <button type="button" class="win-chrome-btn" data-win-chrome="max" title="Maximize" aria-label="Maximize">▢</button>
            <button type="button" class="win-chrome-btn win-chrome-close" ${closeAttr} title="Close" aria-label="Close">✕</button>
        </div>`;
}

function toggleWinChromeMaximize(modal, maxBtn) {
    if (!modal) return false;
    const next = !modal.classList.contains('is-maximized');
    modal.classList.toggle('is-maximized', next);
    if (maxBtn) {
        maxBtn.textContent = next ? '❐' : '▢';
        maxBtn.title = next ? 'Restore' : 'Maximize';
        maxBtn.setAttribute('aria-label', next ? 'Restore' : 'Maximize');
    }
    return next;
}

function resetWinChromeMaximize(modal) {
    if (!modal) return;
    modal.classList.remove('is-maximized');
    const maxBtn = modal.querySelector('[data-win-chrome="max"]');
    if (maxBtn) {
        maxBtn.textContent = '▢';
        maxBtn.title = 'Maximize';
        maxBtn.setAttribute('aria-label', 'Maximize');
    }
}

function bindWinChromeModal(modal, options = {}) {
    if (!modal || modal.dataset.wcBound === '1') return;
    modal.dataset.wcBound = '1';
    const maxBtn = modal.querySelector('[data-win-chrome="max"]');
    maxBtn?.addEventListener('click', () => toggleWinChromeMaximize(modal, maxBtn));
    if (typeof options.onClose === 'function') {
        const closeSel = options.closeSelector || '[data-wc-close]';
        modal.querySelectorAll(closeSel).forEach((el) => {
            el.addEventListener('click', options.onClose);
        });
    }
}

let tableFocusState = null;

function restoreModuleMaximize() {
    document.querySelectorAll('.form-container.is-module-maximized').forEach((el) => {
        el.classList.remove('is-module-maximized');
        const btn = el.querySelector('[data-module-max]');
        if (btn) {
            btn.textContent = '▢';
            btn.title = 'Maximize';
            btn.setAttribute('aria-label', 'Maximize');
        }
    });
    document.body.classList.remove('module-maximized');
}

function toggleModuleMaximize(moduleEl, maxBtn) {
    if (!moduleEl) return false;
    const next = !moduleEl.classList.contains('is-module-maximized');
    document.querySelectorAll('.form-container.is-module-maximized').forEach((el) => {
        if (el !== moduleEl) {
            el.classList.remove('is-module-maximized');
            const otherBtn = el.querySelector('[data-module-max]');
            if (otherBtn) {
                otherBtn.textContent = '▢';
                otherBtn.title = 'Maximize';
                otherBtn.setAttribute('aria-label', 'Maximize');
            }
        }
    });
    moduleEl.classList.toggle('is-module-maximized', next);
    document.body.classList.toggle('module-maximized', next);
    const btn = maxBtn || moduleEl.querySelector('[data-module-max]');
    if (btn) {
        btn.textContent = next ? '❐' : '▢';
        btn.title = next ? 'Restore' : 'Maximize';
        btn.setAttribute('aria-label', next ? 'Restore' : 'Maximize');
    }
    if (next) {
        moduleEl.scrollTop = 0;
        moduleEl.querySelector('.req-intray-panel, .form-table-wrapper')?.scrollIntoView({ block: 'start' });
    }
    return next;
}

function ensureModuleMaximizeControl(root) {
    if (!root || !root.id || !root.classList.contains('form-container')) return;
    const header = root.querySelector(':scope > .form-header');
    if (!header || header.querySelector('[data-module-max]')) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'win-chrome-btn form-max-btn';
    btn.setAttribute('data-module-max', root.id);
    btn.title = 'Maximize';
    btn.setAttribute('aria-label', 'Maximize');
    btn.textContent = '▢';
    const close = header.querySelector('.close-btn');
    if (close) {
        if (!close.parentElement?.classList.contains('form-header-controls')) {
            const wrap = document.createElement('div');
            wrap.className = 'form-header-controls';
            close.replaceWith(wrap);
            wrap.appendChild(btn);
            wrap.appendChild(close);
        } else {
            close.parentElement.insertBefore(btn, close);
        }
    } else {
        header.appendChild(btn);
    }
}

function ensureAllModuleMaximizeControls() {
    document.querySelectorAll('.form-container').forEach(ensureModuleMaximizeControl);
    ensureAllTableExpandControls();
}

/** Stable id for tables that lack one so Expand can target them. */
function ensureExpandableTableId(table) {
    if (!table) return '';
    if (table.id) return table.id;
    const moduleRoot = table.closest('.form-container[id], [id]');
    const mod = moduleRoot?.id || 'mod';
    const seq = (ensureExpandableTableId._n = (ensureExpandableTableId._n || 0) + 1);
    table.id = `tbl-expand-${mod}-${seq}`;
    return table.id;
}

function tableAlreadyHasExpandButton(table) {
    if (!table?.id) return false;
    const sel = `#${CSS.escape(table.id)}`;
    return !!document.querySelector(`[data-table-focus="${sel}"]`);
}

function resolveTableExpandTitle(table) {
    const section = table.closest('.form-section, .panel, .req-intray-panel, .gl-panel, [data-section]');
    const heading = section?.querySelector('h2, h3, h4, .section-title, .panel-title, legend');
    if (heading?.textContent?.trim()) return heading.textContent.trim().slice(0, 80);
    const moduleTitle = table.closest('.form-container')?.querySelector(':scope > .form-header h2, :scope > .form-header h1');
    if (moduleTitle?.textContent?.trim()) return moduleTitle.textContent.trim().slice(0, 80);
    return 'Table view';
}

function findOrCreateExpandToolbarHost(table) {
    const wrap = table.closest('.form-table-wrapper, .table-scroll-wrap, .ict-acc-table-wrap, .req-intray-panel');
    const nearby = wrap?.previousElementSibling;
    if (nearby && (nearby.classList.contains('module-toolbar')
        || nearby.classList.contains('inv-movement-filters')
        || nearby.classList.contains('table-expand-toolbar'))) {
        return nearby;
    }
    const section = table.closest('.form-section, .panel, .gl-panel, .req-intray-panel, .form-body') || wrap?.parentElement;
    const toolbar = section?.querySelector(':scope > .module-toolbar, :scope > .inv-movement-filters, :scope > .table-expand-toolbar')
        || section?.querySelector('.module-toolbar, .inv-movement-filters, .table-expand-toolbar');
    if (toolbar) return toolbar;
    if (!wrap?.parentElement) return null;
    const bar = document.createElement('div');
    bar.className = 'module-toolbar table-expand-toolbar';
    wrap.parentElement.insertBefore(bar, wrap);
    return bar;
}

/**
 * Add ⛶ Expand on major data tables so any ledger/grid can open full-screen.
 * Skips tiny form tables, modals, and tables that already have an Expand control.
 */
function ensureTableExpandControls(root = document) {
    const scope = root && root.querySelectorAll ? root : document;

    // Drop Expand buttons whose target table was re-rendered away
    scope.querySelectorAll('[data-table-focus]').forEach((btn) => {
        if (btn.closest('.table-focus-modal')) return;
        const sel = btn.getAttribute('data-table-focus');
        if (!sel) return;
        try {
            if (!document.querySelector(sel)) btn.remove();
        } catch (_) { /* invalid selector */ }
    });

    const tables = scope.querySelectorAll([
        'table.overview-table',
        'table.req-intray-table',
        'table.ict-acc-table',
        '.form-table-wrapper > table',
        '.form-table-wrapper table.overview-table',
        '[data-inv-filters-for] ~ .form-table-wrapper table',
        '.ict-acc-table-wrap table'
    ].join(', '));

    tables.forEach((table) => {
        if (!table || table.closest('.table-focus-modal, .win-chrome-modal, .modal, [role="dialog"]')) return;
        if (table.closest('form.form-entry, .print-only')) return;
        const tbody = table.tBodies?.[0];
        if (!tbody || tbody.rows.length === 0) return;
        if (table.classList.contains('no-table-expand')) return;

        const id = ensureExpandableTableId(table);
        if (!id || tableAlreadyHasExpandButton(table)) return;

        const host = findOrCreateExpandToolbarHost(table);
        if (!host) return;
        if (host.querySelector(`[data-table-focus="#${CSS.escape(id)}"]`)) return;

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn btn-ghost btn-sm table-expand-btn';
        btn.setAttribute('data-table-focus', `#${id}`);
        btn.setAttribute('data-table-focus-title', resolveTableExpandTitle(table));
        btn.title = 'Expand table to full screen';
        btn.textContent = '⛶ Expand';
        host.appendChild(btn);
    });
}

function ensureAllTableExpandControls() {
    ensureTableExpandControls(document);
}

function cloneTableHtml(tableSelector) {
    const table = document.querySelector(tableSelector);
    if (!table) return '';
    const clone = table.cloneNode(true);
    clone.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'));
    clone.querySelectorAll('tbody tr').forEach((tr) => {
        tr.style.display = '';
    });
    return clone.outerHTML;
}

function refreshTableFocusContent() {
    if (!tableFocusState?.tableSelector) return;
    const modal = document.getElementById('tableFocusModal');
    const body = modal?.querySelector('.table-focus-body');
    if (!body) return;
    const tableSelector = tableFocusState.tableSelector;
    const html = cloneTableHtml(tableSelector);
    const sourceFilters = document.querySelector(`[data-inv-filters-for="${tableSelector}"]`);
    let filtersHtml = '';
    if (sourceFilters) {
        const clone = sourceFilters.cloneNode(true);
        clone.removeAttribute('data-inv-filters-bound');
        clone.removeAttribute('data-inv-filters-hint');
        clone.removeAttribute('data-inv-filters-target');
        clone.dataset.invFiltersModal = '1';
        clone.querySelector('[data-table-focus]')?.remove();
        filtersHtml = clone.outerHTML;
    }
    body.innerHTML = filtersHtml
        ? `${filtersHtml}<div class="form-table-wrapper table-focus-table-wrap">${html}</div>`
        : (html
            ? `<div class="form-table-wrapper table-focus-table-wrap">${html}</div>`
            : '<div class="table-focus-empty">Table not found or empty.</div>');
    if (sourceFilters && typeof bindInvMovementFilters === 'function') {
        bindInvMovementFilters(body);
        const destFilters = body.querySelector('.inv-movement-filters');
        if (destFilters) {
            sourceFilters.querySelectorAll('[data-inv-filter]').forEach((src, index) => {
                const dest = destFilters.querySelectorAll('[data-inv-filter]')[index];
                if (dest) dest.value = src.value;
            });
            const srcSort = sourceFilters.querySelector('[data-inv-sort]');
            const destSort = destFilters.querySelector('[data-inv-sort]');
            if (srcSort && destSort) destSort.value = srcSort.value;
            if (typeof applyInvMovementFiltersFromBar === 'function') {
                applyInvMovementFiltersFromBar(destFilters);
            }
        }
    }
    const sub = modal.querySelector('#tableFocusSubtitle');
    if (sub && typeof tableFocusState.subtitle === 'function') {
        sub.textContent = tableFocusState.subtitle() || '';
    } else if (sub && tableFocusState.subtitleText) {
        sub.textContent = tableFocusState.subtitleText;
    }
}

function ensureTableFocusModal() {
    let modal = document.getElementById('tableFocusModal');
    if (modal) return modal;

    modal = document.createElement('div');
    modal.id = 'tableFocusModal';
    modal.className = 'table-focus-modal win-chrome-modal';
    modal.hidden = true;
    modal.innerHTML = `
        <div class="win-chrome-backdrop" data-wc-close></div>
        <div class="table-focus-panel win-chrome-panel" role="dialog" aria-labelledby="tableFocusTitle">
            <header class="table-focus-head win-chrome-head">
                <div>
                    <h2 id="tableFocusTitle">Table view</h2>
                    <p class="table-focus-sub" id="tableFocusSubtitle"></p>
                </div>
                ${winChromeControlsHtml('data-wc-close')}
            </header>
            <div class="table-focus-body" id="tableFocusBody"></div>
        </div>`;
    document.body.appendChild(modal);

    bindWinChromeModal(modal, { onClose: closeTableFocusView });
    return modal;
}

function openTableFocusView(options = {}) {
    const tableSelector = options.tableSelector;
    if (!tableSelector) return;

    const modal = ensureTableFocusModal();
    const titleEl = modal.querySelector('#tableFocusTitle');
    const subEl = modal.querySelector('#tableFocusSubtitle');

    tableFocusState = {
        tableSelector,
        subtitleText: options.subtitle || '',
        subtitle: typeof options.getSubtitle === 'function' ? options.getSubtitle : null
    };

    if (titleEl) titleEl.textContent = options.title || 'Table view';
    if (subEl) {
        subEl.textContent = tableFocusState.subtitle
            ? (tableFocusState.subtitle() || '')
            : (tableFocusState.subtitleText || '');
    }

    refreshTableFocusContent();
    modal.hidden = false;
    modal.classList.add('is-maximized');
    const maxBtn = modal.querySelector('[data-win-chrome="max"]');
    if (maxBtn) {
        maxBtn.textContent = '❐';
        maxBtn.title = 'Restore';
        maxBtn.setAttribute('aria-label', 'Restore');
    }
    document.body.classList.add('table-focus-open');
}

function closeTableFocusView() {
    const modal = document.getElementById('tableFocusModal');
    if (modal) {
        modal.hidden = true;
        resetWinChromeMaximize(modal);
    }
    tableFocusState = null;
    document.body.classList.remove('table-focus-open');
}

function refreshTableFocusViewIfOpen() {
    if (!tableFocusState || document.getElementById('tableFocusModal')?.hidden) return;
    refreshTableFocusContent();
}

function initWindowChrome() {
    ensureAllModuleMaximizeControls();
    document.addEventListener('click', (e) => {
        const maxBtn = e.target.closest('[data-module-max]');
        if (maxBtn) {
            e.preventDefault();
            const id = maxBtn.getAttribute('data-module-max');
            toggleModuleMaximize(document.getElementById(id), maxBtn);
            return;
        }
        const clampCell = e.target.closest('.cell-text-clamp');
        if (clampCell && !e.target.closest('a, button, input, select, textarea')) {
            clampCell.classList.toggle('is-expanded');
            return;
        }
        const btn = e.target.closest('[data-table-focus]');
        if (!btn) return;
        e.preventDefault();
        const selector = btn.getAttribute('data-table-focus');
        if (!selector) return;
        openTableFocusView({
            tableSelector: selector,
            title: btn.getAttribute('data-table-focus-title') || 'Table view',
            getSubtitle: btn.getAttribute('data-table-focus-subtitle-id')
                ? () => document.getElementById(btn.getAttribute('data-table-focus-subtitle-id'))?.textContent || ''
                : null
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        if (document.body.classList.contains('table-focus-open')) {
            closeTableFocusView();
            return;
        }
        if (document.body.classList.contains('module-maximized')) {
            restoreModuleMaximize();
        }
    });

    // Re-wire Expand after lazy module HTML / dynamic table renders
    if (typeof MutationObserver !== 'undefined' && !window.__tableExpandObserver) {
        let scheduled = false;
        window.__tableExpandObserver = new MutationObserver(() => {
            if (scheduled) return;
            scheduled = true;
            requestAnimationFrame(() => {
                scheduled = false;
                ensureAllTableExpandControls();
            });
        });
        window.__tableExpandObserver.observe(document.body, { childList: true, subtree: true });
    }
}

window.toggleWinChromeMaximize = toggleWinChromeMaximize;
window.resetWinChromeMaximize = resetWinChromeMaximize;
window.bindWinChromeModal = bindWinChromeModal;
window.winChromeControlsHtml = winChromeControlsHtml;
window.openTableFocusView = openTableFocusView;
window.closeTableFocusView = closeTableFocusView;
window.refreshTableFocusViewIfOpen = refreshTableFocusViewIfOpen;
window.initWindowChrome = initWindowChrome;
window.toggleModuleMaximize = toggleModuleMaximize;
window.restoreModuleMaximize = restoreModuleMaximize;
window.ensureModuleMaximizeControl = ensureModuleMaximizeControl;
window.ensureAllModuleMaximizeControls = ensureAllModuleMaximizeControls;
window.ensureTableExpandControls = ensureTableExpandControls;
window.ensureAllTableExpandControls = ensureAllTableExpandControls;
