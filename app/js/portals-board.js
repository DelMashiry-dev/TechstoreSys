/* portals-board.js — clickable procurement workflow dashboard under Portals */

const PORTALS_BOARD_ICONS = {
    req: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="10" y="8" width="20" height="26" rx="2"/><path d="M16 16h8M16 22h8M16 28h5"/><circle cx="34" cy="32" r="8"/><path d="M31 32h6M34 29v6"/><path d="M30 38h10l2 4"/></svg>',
    star: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="24" cy="18" r="7"/><path d="M12 40c2-8 8-12 12-12s10 4 12 12"/><path fill="currentColor" stroke="none" d="M36 10l1.4 3.2H41l-2.8 2 1.1 3.2L36 16.4l-3.3 2 1.1-3.2-2.8-2h3.6z"/></svg>',
    suit: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2"><circle cx="24" cy="14" r="6"/><path d="M10 40V28l8-4 6 8 6-8 8 4v12"/><path d="M24 32v8"/></svg>',
    pfms: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2"><rect x="8" y="10" width="32" height="22" rx="2"/><path d="M14 36h20M24 32v4"/><rect x="12" y="14" width="24" height="14" rx="1"/><text x="24" y="24" text-anchor="middle" font-size="7" fill="currentColor" stroke="none" font-weight="800">PFMS</text></svg>',
    handoff: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="10" y="10" width="18" height="24" rx="2"/><path d="M34 18c6 4 6 12 0 16"/><path d="M30 16l6 4-6 4"/></svg>',
    mega: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 20v8l6-2 16 8V14L14 22z"/><path d="M14 26v8l6 2"/></svg>',
    team: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2"><circle cx="24" cy="14" r="5"/><circle cx="12" cy="18" r="4"/><circle cx="36" cy="18" r="4"/><path d="M8 38c1-7 6-10 10-10M30 28c4 0 9 3 10 10M16 38c1-7 6-11 8-11s7 4 8 11"/></svg>',
    trophy: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 12h16v8a8 8 0 0 1-16 0z"/><path d="M16 16H10v2a6 6 0 0 0 6 6M32 16h6v2a6 6 0 0 1-6 6"/><path d="M24 28v6M18 38h12"/></svg>',
    search: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2"><rect x="10" y="8" width="20" height="26" rx="2"/><circle cx="32" cy="32" r="8"/><path d="M37 37l5 5"/></svg>',
    po: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2"><rect x="8" y="8" width="22" height="28" rx="2"/><text x="19" y="24" text-anchor="middle" font-size="9" fill="currentColor" stroke="none" font-weight="800">PO</text><circle cx="34" cy="32" r="7"/><path d="M31 32h6M34 29v6"/></svg>'
};

const PORTALS_BOARD_STEPS = [
    {
        id: 's1', n: '1', tone: 'blue', title: 'REQUISITION',
        text: 'User Raises DPF1',
        icon: 'req', module: 'dp-f1-form', windowLabel: 'IT Dir · DP F1'
    },
    {
        id: 's2', n: '2', tone: 'blue', title: 'ENDORSEMENT BY COLONEL SD (GS BRANCH)',
        text: 'DPF1 is endorsed by Colonel SD (GS Branch).',
        icon: 'star', desk: 'gs', windowLabel: 'GS Branch Window'
    },
    {
        id: 's3', n: '3', tone: 'blue', title: 'ENDORSEMENT BY MANAC (DEPUTY DIRECTOR DAF)',
        text: 'Further endorsement by MANAC (Deputy Director DAF).',
        icon: 'suit', desk: 'daf', windowLabel: 'DAF Window'
    },
    {
        id: 's4a', n: '4A', tone: 'blue', title: 'REQUISITION NUMBER CREATION',
        text: 'IT Dir RQ writes the PFMS number on the DPF1 (e.g. Req 10080264). PFMS is the Ministry of Finance Public Financial Management System.',
        icon: 'pfms', module: 'dp-f1-form', windowLabel: 'IT Dir RQ · PFMS on F1'
    },
    {
        id: 's4b', n: '4B', tone: 'blue', title: 'IT DIR RQ SURRENDERS THE DPF1 TO DP CONTRACTS',
        text: 'The endorsed DPF1 is handed to Directorate Procurement — Contracts.',
        icon: 'handoff', desk: 'dp', windowLabel: 'DP Window'
    },
    {
        id: 's4c', n: '4C', tone: 'green', title: 'DP CALLS FOR QUOTATIONS',
        text: 'DP calls for quotations from relevant suppliers.',
        icon: 'mega', desk: 'dp', windowLabel: 'DP Window'
    },
    {
        id: 's4d', n: '4D', tone: 'green', title: 'QUOTATIONS POUR IN',
        text: 'Adjudication team opens the tender box and selects vendors who meet requirements, including technical specs.',
        icon: 'team', desk: 'dp', windowLabel: 'DP Window'
    },
    {
        id: 's6', n: '6', tone: 'green', title: 'DP SO1 HIGHLIGHTS THE BEST VENDOR',
        text: 'DP SO1 picks the winning vendor / supplier.',
        icon: 'trophy', desk: 'dp', windowLabel: 'DP Window'
    },
    {
        id: 's5', n: '5', tone: 'green', title: 'DP TAKES THE ENDORSED DPF1',
        text: 'Attached with IT Dir spec, supplier quotation and specs — for evaluation and a certificate to Due Diligence (AIAD).',
        icon: 'search', desk: 'aiad', windowLabel: 'Due Diligence Window'
    },
    {
        id: 'spo', n: '4', tone: 'green', title: 'DP PRODUCES PURCHASE ORDER (P/O)',
        text: 'DP sends the P/O to IT Dir (user). User informs the supplier. Supplier supplies. IT Dir inspects, then DAF pays.',
        icon: 'po', desk: 'dp', windowLabel: 'DP Window',
        extra: [
            { desk: 'supplier', label: 'Supplier Window' },
            { desk: 'daf', label: 'DAF pay' }
        ]
    }
];

function portalsEscape(v) {
    return String(v ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function portalsStepAllowed(step) {
    if (step.desk && typeof canAccessPortalDesk === 'function' && canAccessPortalDesk(step.desk)) return true;
    if ((step.extra || []).some((x) => x.desk && typeof canAccessPortalDesk === 'function' && canAccessPortalDesk(x.desk))) {
        return true;
    }
    if (step.module && typeof canAccessModule === 'function' && canAccessModule(step.module)) return true;
    return false;
}

function portalsDeskCount(desk) {
    if (!desk || typeof stkCasesForDesk !== 'function') return 0;
    try {
        return stkCasesForDesk(desk).length;
    } catch (_) {
        return 0;
    }
}

function renderPortalsStepCard(step) {
    const allowed = portalsStepAllowed(step);
    const count = step.desk ? portalsDeskCount(step.desk) : 0;
    const extras = (step.extra || []).filter((x) => !x.desk || (typeof canAccessPortalDesk !== 'function' || canAccessPortalDesk(x.desk)));
    const extraHtml = extras.length
        ? `<span class="portals-step-extras">${extras.map((x) => `
            <button type="button" class="portals-step-chip" data-pb-desk="${portalsEscape(x.desk)}">${portalsEscape(x.label)}</button>
        `).join('')}</span>`
        : '';
    return `
        <article class="card portals-step portals-step-${step.tone} portals-area-${step.id}${allowed ? '' : ' is-locked'}"
            data-pb-id="${portalsEscape(step.id)}" ${allowed ? 'tabindex="0"' : ''}
            title="${allowed ? `Open ${portalsEscape(step.windowLabel)}` : 'No window on this login'}">
            <div class="card-header portals-step-header">
                <span class="portals-step-n">${portalsEscape(step.n)}</span>
                <span class="portals-step-header-title">${portalsEscape(step.title)}</span>
            </div>
            <div class="card-body portals-step-body">
                <div class="portals-step-top">
                    <span class="portals-step-icon" aria-hidden="true">${PORTALS_BOARD_ICONS[step.icon] || ''}</span>
                    ${count ? `<span class="portals-step-count">${count}</span>` : ''}
                </div>
                <strong class="card-title portals-step-title">${portalsEscape(step.text)}</strong>
                <span class="card-text portals-step-text">${portalsEscape(step.windowLabel)}</span>
                ${extraHtml}
            </div>
        </article>`;
}

function renderPortalsBoard() {
    const host = document.getElementById('portalsBoardHost');
    if (!host) return;
    const byId = Object.fromEntries(PORTALS_BOARD_STEPS.map((s) => [s.id, s]));
    const card = (id) => renderPortalsStepCard(byId[id]);
    host.innerHTML = `
        <div class="portals-board-canvas">
            <header class="portals-board-head">
                <p class="portals-board-kicker">Zimbabwe National Army · IT Dir TechStores</p>
                <h3>PROCUREMENT WORKFLOW:</h3>
                <h4>DP PURCHASE ORDER TO CONTRACT</h4>
                <p class="portals-board-hint">Click a box to open the related window.</p>
            </header>
            <div class="portals-board-flow" aria-label="Procurement cycle">
                ${['s1', 's2', 's3', 's4a', 's4b', 's4c', 's4d', 's6', 's5', 'spo']
                    .map((id) => card(id)).join('')}
            </div>
        </div>`;
}

function openPortalsBoardTarget(opts) {
    const desk = opts.desk;
    const moduleId = opts.module;
    if (desk) {
        if (typeof canAccessPortalDesk === 'function' && !canAccessPortalDesk(desk)) {
            if (typeof showToast === 'function') showToast('That window is for another actor.', 'info');
            return;
        }
        if (typeof navigateToModule === 'function') navigateToModule('stakeholder-desk', { stkDesk: desk });
        return;
    }
    if (moduleId) {
        if (typeof canAccessModule === 'function' && !canAccessModule(moduleId)) {
            if (typeof showToast === 'function') showToast('No window for this step on your login.', 'info');
            return;
        }
        if (typeof navigateToModule === 'function') navigateToModule(moduleId);
    }
}

function openPortalsBoardStep(step) {
    if (!step) return;
    if (step.desk && (typeof canAccessPortalDesk !== 'function' || canAccessPortalDesk(step.desk))) {
        openPortalsBoardTarget({ desk: step.desk });
        return;
    }
    const extra = (step.extra || []).find((x) => x.desk && (typeof canAccessPortalDesk !== 'function' || canAccessPortalDesk(x.desk)));
    if (extra) {
        openPortalsBoardTarget({ desk: extra.desk });
        return;
    }
    if (step.module) {
        openPortalsBoardTarget({ module: step.module });
        return;
    }
    if (typeof showToast === 'function') showToast('No window for this step on your login.', 'info');
}

function initPortalsBoardModule() {
    const root = document.getElementById('portals-board');
    if (!root) return;
    if (root.dataset.pbInit !== '1') {
        root.dataset.pbInit = '1';
        const host = document.getElementById('portalsBoardHost');
        host?.addEventListener('click', (e) => {
            const chip = e.target.closest('[data-pb-desk]');
            if (chip && chip.classList.contains('portals-step-chip')) {
                e.preventDefault();
                e.stopPropagation();
                openPortalsBoardTarget({ desk: chip.getAttribute('data-pb-desk') });
                return;
            }
            const tile = e.target.closest('[data-pb-id]');
            if (!tile || tile.classList.contains('is-locked')) return;
            const step = PORTALS_BOARD_STEPS.find((s) => s.id === tile.getAttribute('data-pb-id'));
            if (!step) return;
            openPortalsBoardStep(step);
        });
        host?.addEventListener('keydown', (e) => {
            if (e.key !== 'Enter' && e.key !== ' ') return;
            const tile = e.target.closest('[data-pb-id]');
            if (!tile || tile.classList.contains('is-locked')) return;
            e.preventDefault();
            const step = PORTALS_BOARD_STEPS.find((s) => s.id === tile.getAttribute('data-pb-id'));
            if (step) openPortalsBoardStep(step);
        });
    }
    renderPortalsBoard();
}

window.initPortalsBoardModule = initPortalsBoardModule;
window.renderPortalsBoard = renderPortalsBoard;
window.PORTALS_BOARD_STEPS = PORTALS_BOARD_STEPS;
