/* dept-home.js — department-scoped dashboard homes (non–GL / non–stores roles) */

/** Map role → home preset key. */
const ROLE_DEPT_HOME = {
    rp: 'gate',
    oc_gate: 'gate',
    storeman: 'storeman',
    workshop: 'workshop',
    oc_workshop: 'workshop',
    orderly_clerk: 'orderly',
    oc_admin: 'orderly',
    oc_compengr: 'comms',
    oc_itts: 'comms',
    oc_swengr: 'comms',
    oc_ictsec: 'comms',
    oc_sysadmin: 'comms',
    dir_dp: 'dp',
    gs_sd: 'gs',
    dir_daf: 'daf',
    dir_aiad: 'aiad',
    supplier: 'supplier'
};

const DEPT_HOME_PRESETS = {
    gate: {
        kicker: 'IT-DIR · RP Gate Control',
        title: 'RP Gate — ICT equipment in / out',
        blurb: 'Record ICT equipment entering and leaving the Directorate at the gate. Gate notifications below show equipment still on site and messages addressed to Gate / RP.',
        shortcuts: [
            { target: 'gate-register', label: 'Open Gate Register', primary: true }
        ]
    },
    storeman: {
        kicker: 'IT-DIR · Tech Stores (Storeman)',
        title: 'Storeman workspace',
        blurb: 'Day-to-day stores duties: issue and receipt vouchers (Q 1033), delivery notes, stock take, equipment register, temporary and permanent loans, and ZNA Q forms.',
        shortcuts: [
            { target: 'voucher-module', label: 'Issue / Receipt Voucher (Q 1033)', primary: true },
            { target: 'delivery-note', label: 'Delivery Note' },
            { target: 'doc-import', label: 'Import document' },
            { target: 'stock-take', label: 'Stock Take' },
            { target: 'techstores-equipment-register', label: 'Equipment Register' },
            { target: 'temporary-loans', label: 'Temporary Loans' },
            { target: 'permanent-loans', label: 'Permanent Loans' },
            { target: 'zna-q-forms-index', label: 'ZNA Q Forms' },
            { target: 'system-help', label: 'System Help / Dictionary' }
        ]
    },
    workshop: {
        kicker: 'IT-DIR · Workshop',
        title: 'Workshop workspace',
        blurb: 'Workshop repairs register, specification / technical evaluation, and IT Directorate communications.',
        shortcuts: [
            { target: 'workshop-repairs', label: 'Workshop Register', primary: true },
            { target: 'spec-evaluation', label: 'Spec / Tech Evaluation' },
            { target: 'doc-import', label: 'Import document' },
            { target: 'it-dir-comms', label: 'IT Dir Comms' }
        ]
    },
    orderly: {
        kicker: 'IT-DIR · Orderly Room',
        title: 'Orderly Room workspace',
        blurb: 'Daily File, correspondence routing, and IT Directorate communications. No access to GL accounts or stock ledgers.',
        shortcuts: [
            { target: 'orderly-room', label: 'Orderly Room', primary: true },
            { target: 'doc-import', label: 'Import document' },
            { target: 'it-dir-comms', label: 'IT Dir Comms' }
        ]
    },
    comms: {
        kicker: 'IT-DIR · Department Communications',
        title: 'IT Directorate Communications',
        blurb: 'Department messaging portal. You do not have access to stores ledgers, GL accounts, or procurement screens.',
        shortcuts: [
            { target: 'it-dir-comms', label: 'Open IT Dir Comms', primary: true }
        ]
    },
    dp: {
        kicker: 'Directorate Procurement',
        title: 'DP Window',
        blurb: 'Your desk for IT Dir ICT buys: call for quotations, adjudicate, pick the winning vendor, raise the P/O, and upload scans. You do not see TechStores stock ledgers.',
        shortcuts: [
            { target: 'portals-board', label: 'Portals dashboard' },
            { target: 'stakeholder-desk', desk: 'dp', label: 'Open DP Window', primary: true },
            { target: 'doc-import', label: 'Import document' },
            { target: 'dp-procurement', label: 'ICT Procurement Cycle' },
            { target: 'purchase-orders', label: 'Purchase Orders' },
            { target: 'suppliers-contracts', label: 'Suppliers' }
        ]
    },
    gs: {
        kicker: 'GS Branch · Colonel SD',
        title: 'GS Branch Window',
        blurb: 'Endorse DP F1s from IT Dir and upload the signed endorsement. Next in the cycle is MANAC (DAF).',
        shortcuts: [
            { target: 'portals-board', label: 'Portals dashboard' },
            { target: 'stakeholder-desk', desk: 'gs', label: 'Open GS Window', primary: true },
            { target: 'doc-import', label: 'Import document' },
            { target: 'unit-requisitions', label: 'Requisitions' },
            { target: 'it-dir-comms', label: 'IT Dir Comms' }
        ]
    },
    daf: {
        kicker: 'Directorate of Army Finance',
        title: 'DAF Window',
        blurb: 'MANAC endorsement of DP F1s for funds, then payment of suppliers after IT Dir inspects delivery. Upload payment vouchers here.',
        shortcuts: [
            { target: 'portals-board', label: 'Portals dashboard' },
            { target: 'stakeholder-desk', desk: 'daf', label: 'Open DAF Window', primary: true },
            { target: 'doc-import', label: 'Import document' },
            { target: 'supplier-debts', label: 'Supplier Debts' },
            { target: 'financial-year-bids', label: 'Financial Year Bids' }
        ]
    },
    aiad: {
        kicker: 'Army Internal Audit Directorate',
        title: 'Due Diligence Window',
        blurb: 'Pre-audit of procurement contracts. Review F1, spec and quotation, then issue the Price Due Diligence certificate and upload the signed form.',
        shortcuts: [
            { target: 'portals-board', label: 'Portals dashboard' },
            { target: 'stakeholder-desk', desk: 'aiad', label: 'Open Due Diligence Window', primary: true },
            { target: 'doc-import', label: 'Import document' },
            { target: 'cost-comparative-schedule', label: 'Cost Comparative Schedule' },
            { target: 'dp-procurement', label: 'ICT Procurement Cycle' }
        ]
    },
    supplier: {
        kicker: 'Registered supplier',
        title: 'Supplier Window',
        blurb: 'See RFQs and P/Os for your company only. Upload quotation and spec, delivery note, invoice, and banking details.',
        shortcuts: [
            { target: 'portals-board', label: 'Portals dashboard' },
            { target: 'stakeholder-desk', desk: 'supplier', label: 'Open Supplier Window', primary: true },
            { target: 'doc-import', label: 'Import document' },
            { target: 'process-guides', label: 'Procurement cycle (Learning Centre)' }
        ]
    }
};

function getRoleDeptHomeKey(role) {
    return ROLE_DEPT_HOME[role] || '';
}

function hasRoleScopedHome(role) {
    return !!getRoleDeptHomeKey(role);
}

function renderRoleScopedHome() {
    const host = document.getElementById('roleScopedHome');
    if (!host) return;

    const role = currentUser?.role || '';
    const presetKey = getRoleDeptHomeKey(role);
    if (!presetKey) {
        host.hidden = true;
        host.innerHTML = '';
        return;
    }

    const preset = DEPT_HOME_PRESETS[presetKey];
    const roleLabel = (typeof ROLE_LABELS !== 'undefined' && ROLE_LABELS[role]) || role;
    const deptName = currentUser?.department || roleLabel;
    const shortcuts = (preset.shortcuts || []).filter((s) =>
        typeof canAccessModule === 'function' ? canAccessModule(s.target) : true
    );

    host.hidden = false;
    host.innerHTML = `
        <div class="role-scoped-home-card">
            <p class="role-scoped-home-dept">${escapeHtml(deptName)}</p>
            <h3>${escapeHtml(preset.title)}</h3>
            <p>${escapeHtml(preset.blurb || '')}</p>
            <div class="role-scoped-home-actions">
                ${shortcuts.map((s) => `
                    <button type="button" class="btn ${s.primary ? 'btn-primary' : 'btn-secondary'}"
                        data-target="${escapeHtml(s.target)}"${s.desk ? ` data-stk-desk="${escapeHtml(s.desk)}"` : ''}>${escapeHtml(s.label)}</button>
                `).join('')}
            </div>
        </div>`;

    host.querySelectorAll('[data-target]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const target = btn.getAttribute('data-target');
            const desk = btn.getAttribute('data-stk-desk');
            if (target && typeof navigateToModule === 'function') {
                navigateToModule(target, desk ? { stkDesk: desk } : {});
            }
        });
    });

    const dashKicker = document.querySelector('#dashboard .dashboard-kicker');
    if (dashKicker && preset.kicker) {
        if (!dashKicker.dataset.defaultText) dashKicker.dataset.defaultText = dashKicker.textContent;
        dashKicker.textContent = preset.kicker;
    }
}

function resetDashboardKicker() {
    const dashKicker = document.querySelector('#dashboard .dashboard-kicker');
    if (dashKicker?.dataset.defaultText) {
        dashKicker.textContent = dashKicker.dataset.defaultText;
    }
}
