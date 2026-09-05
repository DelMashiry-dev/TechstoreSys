/* sa-window.js — floating System Alerts window (drag / resize / min / max / dock) */

const SA_WIN_KEY = 'techstores_sa_win_v2';
const SA_WIN_MIN_W = 420;
const SA_WIN_MIN_H = 320;

window.saWin = window.saWin || {
    mode: 'docked', // docked | float | max | min
    x: 48,
    y: 48,
    w: 960,
    h: 640,
    preMax: null,
    restoreMode: 'float'
};

function saWinClamp(geom) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const w = Math.max(SA_WIN_MIN_W, Math.min(geom.w || 960, vw - 16));
    const h = Math.max(SA_WIN_MIN_H, Math.min(geom.h || 640, vh - 16));
    const x = Math.max(0, Math.min(geom.x ?? 48, vw - Math.min(w, vw)));
    const y = Math.max(0, Math.min(geom.y ?? 48, vh - Math.min(h, vh)));
    return { x, y, w, h };
}

function saWinDefaultGeom() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const w = Math.min(1040, Math.max(SA_WIN_MIN_W, Math.floor(vw * 0.82)));
    const h = Math.min(720, Math.max(SA_WIN_MIN_H, Math.floor(vh * 0.78)));
    return saWinClamp({
        x: Math.max(24, Math.floor((vw - w) / 2)),
        y: Math.max(24, Math.floor((vh - h) / 2)),
        w,
        h
    });
}

function loadSaWinState() {
    try {
        const raw = localStorage.getItem(SA_WIN_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') return;
        if (['docked', 'float', 'max', 'min'].includes(parsed.mode)) {
            window.saWin.mode = parsed.mode;
        }
        const g = saWinClamp({
            x: Number(parsed.x),
            y: Number(parsed.y),
            w: Number(parsed.w),
            h: Number(parsed.h)
        });
        Object.assign(window.saWin, g);
        if (parsed.preMax && typeof parsed.preMax === 'object') {
            window.saWin.preMax = saWinClamp(parsed.preMax);
        }
        if (parsed.restoreMode === 'max' || parsed.restoreMode === 'float') {
            window.saWin.restoreMode = parsed.restoreMode;
        }
    } catch (_) { /* ignore */ }
}

function saveSaWinState() {
    try {
        localStorage.setItem(SA_WIN_KEY, JSON.stringify({
            mode: window.saWin.mode,
            x: window.saWin.x,
            y: window.saWin.y,
            w: window.saWin.w,
            h: window.saWin.h,
            preMax: window.saWin.preMax,
            restoreMode: window.saWin.restoreMode || 'float'
        }));
    } catch (_) { /* ignore */ }
}

function ensureSaWinChrome() {
    const panel = document.getElementById('systemAlerts');
    if (!panel) return null;

    let handles = panel.querySelector('.sa-win-handles');
    if (!handles) {
        handles = document.createElement('div');
        handles.className = 'sa-win-handles';
        handles.setAttribute('aria-hidden', 'true');
        handles.innerHTML = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw']
            .map((d) => `<div class="sa-win-handle sa-win-handle-${d}" data-sa-resize="${d}"></div>`)
            .join('');
        panel.appendChild(handles);
    }

    let ph = document.getElementById('saFloatPlaceholder');
    if (!ph && panel.parentNode) {
        ph = document.createElement('div');
        ph.id = 'saFloatPlaceholder';
        ph.className = 'sa-float-placeholder';
        ph.hidden = true;
        ph.innerHTML = `
            <span>In-Tray is floating.</span>
            <button type="button" class="btn btn-ghost btn-sm" data-sa-win="dock">Dock ↓</button>`;
        panel.parentNode.insertBefore(ph, panel);
    }

    let minBar = document.getElementById('saWinMinBar');
    if (!minBar) {
        minBar = document.createElement('div');
        minBar.id = 'saWinMinBar';
        minBar.className = 'sa-win-min-bar';
        minBar.hidden = true;
        minBar.innerHTML = `
            <button type="button" class="sa-win-min-restore" data-sa-win="restore">
                <strong>In-Tray</strong>
                <span>Click to restore</span>
            </button>
            <button type="button" class="sa-win-min-dock" data-sa-win="dock" title="Dock back">⬇</button>`;
        document.body.appendChild(minBar);
    }

    return panel;
}

function applySaWinGeometry() {
    const panel = document.getElementById('systemAlerts');
    if (!panel) return;
    const mode = window.saWin.mode;
    if (mode === 'float') {
        const g = saWinClamp(window.saWin);
        Object.assign(window.saWin, g);
        panel.style.left = `${g.x}px`;
        panel.style.top = `${g.y}px`;
        panel.style.width = `${g.w}px`;
        panel.style.height = `${g.h}px`;
        panel.style.right = 'auto';
        panel.style.bottom = 'auto';
    } else if (mode === 'max') {
        panel.style.left = '0';
        panel.style.top = '0';
        panel.style.width = '100vw';
        panel.style.height = '100vh';
        panel.style.right = 'auto';
        panel.style.bottom = 'auto';
    } else {
        panel.style.left = '';
        panel.style.top = '';
        panel.style.width = '';
        panel.style.height = '';
        panel.style.right = '';
        panel.style.bottom = '';
    }
}

function syncSaWinUi() {
    const panel = ensureSaWinChrome();
    if (!panel) return;
    const mode = window.saWin.mode || 'docked';
    const floating = mode === 'float' || mode === 'max' || mode === 'min';
    const isMax = mode === 'max';
    const isMin = mode === 'min';

    panel.classList.toggle('sa-is-window', floating && !isMin);
    panel.classList.toggle('sa-is-float-max', isMax);
    panel.classList.toggle('sa-is-float-win', mode === 'float');
    panel.classList.toggle('sa-is-minimized', isMin);
    document.body.classList.toggle('sa-alerts-float-max', isMax);
    document.body.classList.toggle('sa-alerts-window', floating && !isMin);

    applySaWinGeometry();

    const ph = document.getElementById('saFloatPlaceholder');
    if (ph) {
        const showPh = floating;
        ph.hidden = !showPh;
        if (showPh) {
            ph.removeAttribute('hidden');
            const label = ph.querySelector('span');
            if (label) {
                label.textContent = isMin
                    ? 'In-Tray is minimized.'
                    : (isMax ? 'In-Tray is maximized.' : 'In-Tray is floating.');
            }
        } else {
            ph.setAttribute('hidden', '');
        }
    }

    const minBar = document.getElementById('saWinMinBar');
    if (minBar) {
        minBar.hidden = !isMin;
        if (isMin) minBar.removeAttribute('hidden');
        else minBar.setAttribute('hidden', '');
        const view = window.saViewMode === 'whatsapp' ? 'WhatsIn'
            : (window.saViewMode === 'mail' ? 'Mail' : 'Cards');
        const sub = minBar.querySelector('.sa-win-min-restore span');
        if (sub) sub.textContent = `${view} · click to restore`;
    }

    const maxBtn = document.querySelector('[data-sa-win="max"]');
    if (maxBtn) {
        maxBtn.textContent = isMax ? '❐' : '▢';
        maxBtn.title = isMax ? 'Restore size' : 'Maximize';
        maxBtn.setAttribute('aria-label', maxBtn.title);
    }

    document.querySelectorAll('[data-sa-win]').forEach((btn) => {
        const action = btn.getAttribute('data-sa-win');
        if (action === 'float') btn.hidden = floating;
        if (action === 'dock') btn.hidden = !floating;
        if (action === 'min' || action === 'max') btn.hidden = mode === 'docked';
        if (action === 'restore') btn.hidden = false;
    });

    if (floating) {
        const board = document.getElementById('dashCommandBoard');
        if (board?.classList.contains('is-collapsed')) {
            board.classList.remove('is-collapsed');
            const toggle = board.querySelector('.dash-collapse-toggle');
            if (toggle) toggle.setAttribute('aria-expanded', 'true');
        }
    }
}

function setSaWinMode(mode) {
    const next = ['docked', 'float', 'max', 'min'].includes(mode) ? mode : 'docked';
    const cur = window.saWin.mode;

    if (next === 'float' && (cur === 'docked' || cur === 'min')) {
        if (cur === 'docked') Object.assign(window.saWin, saWinDefaultGeom());
    }
    if (next === 'max') {
        if (cur === 'float' || cur === 'docked') {
            if (cur === 'docked') Object.assign(window.saWin, saWinDefaultGeom());
            window.saWin.preMax = {
                x: window.saWin.x,
                y: window.saWin.y,
                w: window.saWin.w,
                h: window.saWin.h
            };
        }
    }
    if (next === 'float' && cur === 'max' && window.saWin.preMax) {
        Object.assign(window.saWin, saWinClamp(window.saWin.preMax));
        window.saWin.preMax = null;
    }
    if (next === 'min') {
        window.saWin.restoreMode = (cur === 'max') ? 'max' : 'float';
        if (cur === 'docked') Object.assign(window.saWin, saWinDefaultGeom());
    }
    if (next === 'docked') {
        window.saWin.preMax = null;
        window.saWin.restoreMode = 'float';
    }

    window.saWin.mode = next;
    saveSaWinState();
    syncSaWinUi();
}

function saWinAction(action) {
    const mode = window.saWin.mode;
    switch (action) {
        case 'float':
            setSaWinMode('float');
            break;
        case 'dock':
            setSaWinMode('docked');
            break;
        case 'min':
            setSaWinMode('min');
            break;
        case 'max':
            if (mode === 'max') setSaWinMode('float');
            else setSaWinMode('max');
            break;
        case 'restore':
            setSaWinMode(window.saWin.restoreMode === 'max' ? 'max' : 'float');
            break;
        case 'toggle-max':
            saWinAction('max');
            break;
        default:
            break;
    }
}

function wireSaWinInteractions() {
    if (document.body.dataset.saWinWired === '1') return;
    document.body.dataset.saWinWired = '1';

    document.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-sa-win]');
        if (!btn) return;
        e.preventDefault();
        e.stopPropagation();
        saWinAction(btn.getAttribute('data-sa-win'));
    });

    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        if (window.saWin.mode === 'max') {
            e.preventDefault();
            setSaWinMode('float');
        } else if (window.saWin.mode === 'float' || window.saWin.mode === 'min') {
            e.preventDefault();
            setSaWinMode('docked');
        }
    });

    // Drag
    document.addEventListener('pointerdown', (e) => {
        if (window.saWin.mode !== 'float') return;
        const panel = document.getElementById('systemAlerts');
        if (!panel) return;

        const resizeHandle = e.target.closest('[data-sa-resize]');
        if (resizeHandle && panel.contains(resizeHandle)) {
            e.preventDefault();
            startSaWinResize(e, resizeHandle.getAttribute('data-sa-resize'));
            return;
        }

        const head = e.target.closest('.command-panel-head, .sa-win-drag');
        if (!head || !panel.contains(head)) return;
        if (e.target.closest('button, a, input, select, textarea, .sa-view-toggle, .command-badges')) return;
        e.preventDefault();
        startSaWinDrag(e);
    });

    document.addEventListener('dblclick', (e) => {
        if (window.saWin.mode !== 'float' && window.saWin.mode !== 'max') return;
        const panel = document.getElementById('systemAlerts');
        const head = e.target.closest('.command-panel-head');
        if (!panel || !head || !panel.contains(head)) return;
        if (e.target.closest('button, a, input, .sa-view-toggle')) return;
        e.preventDefault();
        saWinAction('max');
    });

    window.addEventListener('resize', () => {
        if (window.saWin.mode === 'float') {
            Object.assign(window.saWin, saWinClamp(window.saWin));
            applySaWinGeometry();
            saveSaWinState();
        } else if (window.saWin.mode === 'max') {
            applySaWinGeometry();
        }
    });
}

function startSaWinDrag(e) {
    const startX = e.clientX;
    const startY = e.clientY;
    const origX = window.saWin.x;
    const origY = window.saWin.y;
    const panel = document.getElementById('systemAlerts');
    panel?.classList.add('sa-is-dragging');

    const onMove = (ev) => {
        const next = saWinClamp({
            x: origX + (ev.clientX - startX),
            y: origY + (ev.clientY - startY),
            w: window.saWin.w,
            h: window.saWin.h
        });
        window.saWin.x = next.x;
        window.saWin.y = next.y;
        applySaWinGeometry();
    };
    const onUp = () => {
        panel?.classList.remove('sa-is-dragging');
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', onUp);
        saveSaWinState();
    };
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
}

function startSaWinResize(e, dir) {
    const startX = e.clientX;
    const startY = e.clientY;
    const orig = {
        x: window.saWin.x,
        y: window.saWin.y,
        w: window.saWin.w,
        h: window.saWin.h
    };
    const panel = document.getElementById('systemAlerts');
    panel?.classList.add('sa-is-resizing');

    const onMove = (ev) => {
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        let { x, y, w, h } = orig;
        if (dir.includes('e')) w = orig.w + dx;
        if (dir.includes('s')) h = orig.h + dy;
        if (dir.includes('w')) {
            w = orig.w - dx;
            x = orig.x + dx;
        }
        if (dir.includes('n')) {
            h = orig.h - dy;
            y = orig.y + dy;
        }
        const clamped = saWinClamp({ x, y, w, h });
        // Keep opposite edge stable when clamping min size from left/top
        if (dir.includes('w') && clamped.w === SA_WIN_MIN_W) {
            clamped.x = orig.x + orig.w - SA_WIN_MIN_W;
        }
        if (dir.includes('n') && clamped.h === SA_WIN_MIN_H) {
            clamped.y = orig.y + orig.h - SA_WIN_MIN_H;
        }
        Object.assign(window.saWin, clamped);
        applySaWinGeometry();
    };
    const onUp = () => {
        panel?.classList.remove('sa-is-resizing');
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', onUp);
        saveSaWinState();
    };
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
}

function initSaWindow() {
    loadSaWinState();
    // Migrate old maximize-only preference
    try {
        if (localStorage.getItem('techstores_sa_float_max_v1') === '1' && window.saWin.mode === 'docked') {
            window.saWin.mode = 'max';
            localStorage.removeItem('techstores_sa_float_max_v1');
            saveSaWinState();
        }
    } catch (_) { /* ignore */ }
    ensureSaWinChrome();
    wireSaWinInteractions();
    syncSaWinUi();
}

window.initSaWindow = initSaWindow;
window.syncSaWinUi = syncSaWinUi;
window.setSaWinMode = setSaWinMode;
window.saWinAction = saWinAction;
