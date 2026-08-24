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

function cloneTableHtml(tableSelector) {
    const table = document.querySelector(tableSelector);
    if (!table) return '';
    const clone = table.cloneNode(true);
    clone.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'));
    return clone.outerHTML;
}

function refreshTableFocusContent() {
    if (!tableFocusState?.tableSelector) return;
    const modal = document.getElementById('tableFocusModal');
    const body = modal?.querySelector('.table-focus-body');
    if (!body) return;
    const html = cloneTableHtml(tableFocusState.tableSelector);
    body.innerHTML = html
        ? `<div class="form-table-wrapper table-focus-table-wrap">${html}</div>`
        : '<div class="table-focus-empty">Table not found or empty.</div>';
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
    document.addEventListener('click', (e) => {
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
        if (e.key === 'Escape' && document.body.classList.contains('table-focus-open')) {
            closeTableFocusView();
        }
    });
}

window.toggleWinChromeMaximize = toggleWinChromeMaximize;
window.resetWinChromeMaximize = resetWinChromeMaximize;
window.bindWinChromeModal = bindWinChromeModal;
window.winChromeControlsHtml = winChromeControlsHtml;
window.openTableFocusView = openTableFocusView;
window.closeTableFocusView = closeTableFocusView;
window.refreshTableFocusViewIfOpen = refreshTableFocusViewIfOpen;
window.initWindowChrome = initWindowChrome;
