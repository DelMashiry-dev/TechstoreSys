/* nav-reorder.js — drag sidebar buttons to change menu order */

const NAV_DRAG_THRESHOLD_PX = 7;
const NAV_LONG_PRESS_MS = 420;

let navDefaultOrder = null;
let navDrag = null;
let navSuppressClick = false;
let navLongPressTimer = null;

function navSlugLabel(text) {
    return String(text || '')
        .trim()
        .toLowerCase()
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function navItemId(li) {
    if (!li) return '';
    const link = li.querySelector(':scope > a[data-target]') || li.querySelector(':scope > a');
    if (!link) return '';
    const target = link.getAttribute('data-target');
    const panel = link.getAttribute('data-dept-panel');
    if (target) return panel ? `${target}::${panel}` : target;
    const label = link.querySelector('.nav-label')?.textContent || link.textContent || '';
    const slug = navSlugLabel(label);
    return slug ? `menu:${slug}` : '';
}

function navListId(ul) {
    if (!ul) return '';
    if (ul.classList.contains('sidebar-menu')) return 'root';
    const parentLi = ul.parentElement;
    if (parentLi && parentLi.tagName === 'LI') {
        return `${navItemId(parentLi) || 'group'}__sub`;
    }
    return 'unknown';
}

function navCollectLists(root) {
    const menu = root || document.querySelector('.sidebar-menu');
    if (!menu) return [];
    return [menu, ...menu.querySelectorAll('ul')];
}

function navSnapshotDefaultOrder(root) {
    if (navDefaultOrder) return;
    navDefaultOrder = {};
    navCollectLists(root).forEach((ul) => {
        navDefaultOrder[navListId(ul)] = [...ul.children]
            .filter((el) => el.tagName === 'LI')
            .map(navItemId)
            .filter(Boolean);
    });
}

function navApplyListOrder(ul, savedIds) {
    if (!ul || !Array.isArray(savedIds) || !savedIds.length) return;
    const items = [...ul.children].filter((el) => el.tagName === 'LI');
    const byId = new Map();
    items.forEach((li) => {
        const id = navItemId(li);
        if (id && !byId.has(id)) byId.set(id, li);
    });
    const placed = new Set();
    savedIds.forEach((id) => {
        const li = byId.get(id);
        if (!li) return;
        ul.appendChild(li);
        placed.add(li);
    });
    items.forEach((li) => {
        if (!placed.has(li)) ul.appendChild(li);
    });
}

function applyNavMenuOrder() {
    const root = document.querySelector('.sidebar-menu');
    if (!root) return;
    navSnapshotDefaultOrder(root);
    const saved = (typeof appState !== 'undefined' && appState && appState.navMenuOrder
        && typeof appState.navMenuOrder === 'object'
        && !Array.isArray(appState.navMenuOrder))
        ? appState.navMenuOrder
        : {};
    navCollectLists(root).forEach((ul) => {
        const listId = navListId(ul);
        const order = Array.isArray(saved[listId]) && saved[listId].length
            ? saved[listId]
            : (navDefaultOrder[listId] || []);
        navApplyListOrder(ul, order);
    });
}

function persistNavMenuOrder() {
    if (typeof appState === 'undefined' || !appState) return;
    const root = document.querySelector('.sidebar-menu');
    if (!root) return;
    const next = {};
    navCollectLists(root).forEach((ul) => {
        next[navListId(ul)] = [...ul.children]
            .filter((el) => el.tagName === 'LI')
            .map(navItemId)
            .filter(Boolean);
    });
    appState.navMenuOrder = next;
    if (typeof saveState === 'function') saveState();
}

function resetNavMenuOrder() {
    if (typeof appState !== 'undefined' && appState) {
        appState.navMenuOrder = {};
        if (typeof saveState === 'function') saveState();
    }
    applyNavMenuOrder();
    if (typeof showToast === 'function') {
        showToast('Sidebar menu order reset to the original layout.', 'info');
    }
}

function navDragAfterElement(ul, y) {
    const els = [...ul.querySelectorAll(':scope > li:not(.nav-dragging):not(.nav-hidden)')];
    return els.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset, element: child };
        }
        return closest;
    }, { offset: Number.NEGATIVE_INFINITY, element: null }).element;
}

function navClearLongPress() {
    if (navLongPressTimer) {
        clearTimeout(navLongPressTimer);
        navLongPressTimer = null;
    }
}

function navBeginDrag() {
    if (!navDrag || navDrag.active) return;
    navDrag.active = true;
    navSuppressClick = true;
    navDrag.li.classList.add('nav-dragging');
    document.body.classList.add('nav-reordering');
    try {
        navDrag.li.setPointerCapture(navDrag.pointerId);
    } catch (_) { /* ignore */ }
}

function navEndDrag() {
    navClearLongPress();
    if (!navDrag) return;
    const didDrag = navDrag.active;
    const li = navDrag.li;
    li.classList.remove('nav-dragging');
    document.body.classList.remove('nav-reordering');
    try {
        li.releasePointerCapture(navDrag.pointerId);
    } catch (_) { /* ignore */ }
    navDrag = null;
    if (didDrag) persistNavMenuOrder();
    if (navSuppressClick) {
        setTimeout(() => { navSuppressClick = false; }, 80);
    }
}

function navOnPointerDown(e) {
    if (e.button != null && e.button !== 0) return;
    const root = document.querySelector('.sidebar-menu');
    if (!root) return;
    const li = e.target.closest('li');
    if (!li || !root.contains(li) || li.classList.contains('nav-hidden')) return;
    const ul = li.parentElement;
    if (!ul || ul.tagName !== 'UL' || !root.contains(ul)) return;

    navClearLongPress();
    navDrag = {
        li,
        ul,
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        active: false
    };

    if (e.pointerType === 'touch' || e.pointerType === 'pen') {
        navLongPressTimer = setTimeout(() => navBeginDrag(), NAV_LONG_PRESS_MS);
    }
}

function navOnPointerMove(e) {
    if (!navDrag || e.pointerId !== navDrag.pointerId) return;
    const dx = e.clientX - navDrag.startX;
    const dy = e.clientY - navDrag.startY;
    const dist = Math.hypot(dx, dy);

    if (!navDrag.active) {
        if (e.pointerType === 'touch' || e.pointerType === 'pen') {
            if (dist > NAV_DRAG_THRESHOLD_PX) navClearLongPress();
            return;
        }
        if (dist < NAV_DRAG_THRESHOLD_PX) return;
        navBeginDrag();
    }

    if (e.cancelable) e.preventDefault();
    const after = navDragAfterElement(navDrag.ul, e.clientY);
    if (!after) navDrag.ul.appendChild(navDrag.li);
    else if (after !== navDrag.li) navDrag.ul.insertBefore(navDrag.li, after);
}

function navOnPointerUp(e) {
    if (!navDrag || e.pointerId !== navDrag.pointerId) return;
    navEndDrag();
}

function navOnClickCapture(e) {
    if (!navSuppressClick) return;
    if (!e.target.closest('.sidebar-menu')) return;
    e.preventDefault();
    e.stopPropagation();
    if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
}

function bindNavReorder(root) {
    if (!root || root.dataset.navReorderInit === '1') return;
    root.dataset.navReorderInit = '1';
    root.querySelectorAll('img').forEach((img) => { img.draggable = false; });
    root.addEventListener('dragstart', (e) => e.preventDefault());
    root.addEventListener('pointerdown', navOnPointerDown);
    document.addEventListener('pointermove', navOnPointerMove, { passive: false });
    document.addEventListener('pointerup', navOnPointerUp);
    document.addEventListener('pointercancel', navOnPointerUp);
    root.addEventListener('click', navOnClickCapture, true);
}

function initNavReorder() {
    const root = document.querySelector('.sidebar-menu');
    if (!root) return;
    navSnapshotDefaultOrder(root);
    applyNavMenuOrder();
    bindNavReorder(root);
}

document.addEventListener('DOMContentLoaded', () => {
    initNavReorder();
});

window.initNavReorder = initNavReorder;
window.applyNavMenuOrder = applyNavMenuOrder;
window.resetNavMenuOrder = resetNavMenuOrder;
window.persistNavMenuOrder = persistNavMenuOrder;
