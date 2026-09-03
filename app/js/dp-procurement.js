/* dp-procurement.js — ITDIR ICT Procurement Cycle tracker */

/**
 * Operating cycle (ITDIR cost centre for ICT via DP + DAF):
 * Requisition + Target → raise DP F1 → Colonel SD (GS) → MANAC (DD DAF) → PFMS req number
 *   → surrender F1 to DP Contracts → call for quotes → adjudication (incl. tech specs)
 *   → DP SO1 winning vendor → AIAD Price Due Diligence certificate
 *   → DP P/O to IT Dir → supplier supplies → IT Dir inspects → trigger DAF to pay.
 * Tracker statuses below compress that path into eight groups for the register.
 */

const DP_PROC_STATUS_LEGACY = {
    sent_to_dp: 'f1_with_dp',
    suppliers_identified: 'f1_with_dp',
    quotations_received: 'quotes_itdir_eval',
    cost_comparison: 'quotes_itdir_eval',
    sent_to_audit: 'aiad_due_diligence',
    due_diligence: 'aiad_certificate',
    awarded: 'po_electronic'
};

const DP_PROC_STATUSES = [
    { value: 'requisition', step: 1, label: '1. Requisition (user / unit / formation)', short: '1 Requisition', group: 'itdir' },
    { value: 'spec_raise_f1', step: 2, label: '2. Spec / tech evaluation to raise DP F1', short: '2 Spec→F1', group: 'itdir' },
    { value: 'awaiting_gs', step: 2, label: '2b. Awaiting Colonel SD (GS) endorsement', short: '2b GS', group: 'gs' },
    { value: 'awaiting_manac', step: 2, label: '2c. Awaiting MANAC (DAF) endorsement', short: '2c MANAC', group: 'daf' },
    { value: 'pfms_numbered', step: 2, label: '2d. PFMS requisition number on F1', short: '2d PFMS', group: 'itdir' },
    { value: 'f1_with_dp', step: 3, label: '3. F1 with DP — call for quotations', short: '3 F1→DP', group: 'dp' },
    { value: 'quotes_itdir_eval', step: 3, label: '3b. Quotations with ITDIR — tech / spec evaluation', short: '3b ITDIR eval', group: 'itdir' },
    { value: 'spec_returned_dp', step: 3, label: '3c. Spec eval + F1 returned to DP', short: '3c Spec→DP', group: 'dp' },
    { value: 'aiad_due_diligence', step: 4, label: '4. AIAD due diligence (F1 + spec + quotations)', short: '4 AIAD', group: 'aiad' },
    { value: 'aiad_certificate', step: 4, label: '4b. AIAD certificate returned to DP', short: '4b AIAD cert', group: 'aiad' },
    { value: 'po_electronic', step: 5, label: '5. Electronic P/O raised (against target / budget)', short: '5 e-PO', group: 'dp' },
    { value: 'po_manual_pending_daf', step: 5, label: '5. Manual P/O — awaiting DAF authorisation', short: '5 Manual/DAF', group: 'daf' },
    { value: 'po_manual_authorised', step: 5, label: '5b. Manual P/O authorised by DAF', short: '5b DAF OK', group: 'daf' },
    { value: 'supply_delivery', step: 6, label: '6. Supply of goods / services with delivery note', short: '6 Delivery', group: 'supply' },
    { value: 'delivery_verified', step: 7, label: '7. Verification of delivery', short: '7 Verified', group: 'itdir' },
    { value: 'payment_complete', step: 8, label: '8. Payment of goods / services after delivery', short: '8 Paid', group: 'finance' },
    { value: 'cancelled', step: null, label: 'Cancelled / withdrawn', short: 'Cancelled', group: 'closed' }
];

const DP_PROC_STAGE_ORDER_BUDGETED = [
    'requisition',
    'spec_raise_f1',
    'awaiting_gs',
    'awaiting_manac',
    'pfms_numbered',
    'f1_with_dp',
    'quotes_itdir_eval',
    'spec_returned_dp',
    'aiad_due_diligence',
    'aiad_certificate',
    'po_electronic',
    'supply_delivery',
    'delivery_verified',
    'payment_complete'
];

const DP_PROC_STAGE_ORDER_MANUAL = [
    'requisition',
    'spec_raise_f1',
    'awaiting_gs',
    'awaiting_manac',
    'pfms_numbered',
    'f1_with_dp',
    'quotes_itdir_eval',
    'spec_returned_dp',
    'aiad_due_diligence',
    'aiad_certificate',
    'po_manual_pending_daf',
    'po_manual_authorised',
    'supply_delivery',
    'delivery_verified',
    'payment_complete'
];

const DP_PROC_CLOSED = new Set(['payment_complete', 'cancelled']);

const DP_PROC_OPEN = new Set(
    DP_PROC_STATUSES.map((s) => s.value).filter((v) => !DP_PROC_CLOSED.has(v))
);

function normalizeDpProcStatus(status) {
    if (!status) return 'f1_with_dp';
    return DP_PROC_STATUS_LEGACY[status] || status;
}

const DP_PROC_SEED_REV = 3;

function dpProcSeedBase(overrides) {
    const now = '2026-08-28T10:00:00';
    return {
        sentAt: now,
        sentDate: '2026-08-28',
        sentBy: 'ITDIR RQ',
        officers: [{ name: 'MAJ T CHIGWADA', rank: 'MAJ', appointment: 'RQ IT DIR' }],
        snapshot: null,
        officialHtml: '',
        requisitionRef: '',
        budgetProvisioned: 'yes',
        suppliersIdentified: '',
        quotationsNotes: '',
        itdirSpecEvalNotes: '',
        auditRef: '',
        dueDiligenceCert: '',
        awardedSupplier: '',
        awardedQuotationRef: '',
        poNumber: '',
        dafAuthRef: '',
        deliveryNoteRef: '',
        verificationNotes: '',
        paymentRef: '',
        pipelineNotes: '',
        stakeholder: {},
        history: [],
        updatedAt: now,
        seedExample: true,
        ...overrides
    };
}

function buildPortalDemoDpProcurements() {
    return [
        dpProcSeedBase({
            id: 'dpp-seed-workshop-rollers-001',
            refNo: 'DP-2026-WKR-001',
            status: 'awaiting_gs',
            itemSummary: 'Printer rollers × 6 — IT Dir Engineering Support (Workshop)',
            estimatedCost: 'ZWG 42,000.00',
            glValue: '2201900002',
            glDisplay: '2201900002 — Spare Parts',
            costCentre: 'Z04P2SP212',
            delivery: 'IT DIR ENGINEERING SUPPORT (WORKSHOP)',
            requisitionRef: 'REQ-2026-0001',
            linkedReqId: 'req-seed-workshop-rollers-001',
            history: [
                { at: '2026-09-01T08:00:00', status: 'requisition', by: 'GS Branch', note: 'Workshop demand via GS Branch channel.' },
                { at: '2026-09-01T10:00:00', status: 'spec_raise_f1', by: 'ITDIR RQ', note: 'Requisition booked — spec eval complete; F1 raised.' },
                { at: '2026-09-02T09:00:00', status: 'awaiting_gs', by: 'ITDIR RQ', note: 'Awaiting Colonel SD (GS Branch) endorsement on DP F1.' }
            ]
        }),
        dpProcSeedBase({
            id: 'dpp-seed-gs-001',
            refNo: 'DP-2026-0001',
            status: 'awaiting_gs',
            itemSummary: 'Dell Latitude 5540 Core i7 laptop × 12 — HQ 3 Inf Bde',
            estimatedCost: 'USD 18,600.00',
            glValue: '3112210001',
            glDisplay: '3112210001 — ICT Equipment',
            costCentre: 'Z04P2SP212',
            delivery: 'HQ 3 INF BDE / IT DIR',
            requisitionRef: '10080112',
            history: [
                { at: '2026-08-26T09:00:00', status: 'spec_raise_f1', by: 'ITDIR RQ', note: 'Spec evaluation complete — F1 raised for GS endorsement.' },
                { at: '2026-08-28T10:00:00', status: 'awaiting_gs', by: 'ITDIR RQ', note: 'Awaiting Colonel SD (GS Branch) endorsement.' }
            ]
        }),
        dpProcSeedBase({
            id: 'dpp-seed-gs-002',
            refNo: 'DP-2026-0002',
            status: 'awaiting_gs',
            itemSummary: 'Cisco Catalyst 9200-24P network switch × 4 — Comp Eng',
            estimatedCost: 'USD 12,400.00',
            glValue: '3112210001',
            glDisplay: '3112210001 — ICT Equipment',
            costCentre: 'Z04P2SP212',
            delivery: 'COMP ENG / IT DIR',
            requisitionRef: '10080118',
            history: [
                { at: '2026-08-27T11:30:00', status: 'awaiting_gs', by: 'ITDIR RQ', note: 'Network refresh F1 — GS endorsement required.' }
            ]
        }),
        dpProcSeedBase({
            id: 'dpp-seed-daf-manac-001',
            refNo: 'DP-2026-0003',
            status: 'awaiting_manac',
            itemSummary: 'HP LaserJet Enterprise MFP M528 × 8 — Admin Office',
            estimatedCost: 'ZWG 960,000.00',
            glValue: '3112210001',
            glDisplay: '3112210001 — ICT Equipment',
            costCentre: 'Z04P2SP212',
            delivery: 'ADMIN OFFICE / IT DIR',
            requisitionRef: '10080125',
            stakeholder: {
                gs: { notes: 'Endorsed for procurement.', files: [], endorsedAt: '2026-08-20T14:00:00' }
            },
            history: [
                { at: '2026-08-18T08:00:00', status: 'awaiting_gs', by: 'ITDIR RQ', note: 'F1 raised.' },
                { at: '2026-08-20T14:00:00', status: 'awaiting_manac', by: 'Col SD GS', note: 'GS endorsement uploaded — forwarded to MANAC (DAF).' }
            ]
        }),
        dpProcSeedBase({
            id: 'dpp-seed-dp-quotes-001',
            refNo: 'DP-2026-0004',
            status: 'f1_with_dp',
            itemSummary: 'Lenovo ThinkSystem SR650 server × 2 — DBA / Comp Eng',
            estimatedCost: 'USD 28,500.00',
            glValue: '3112210001',
            glDisplay: '3112210001 — ICT Equipment',
            costCentre: 'Z04P2SP212',
            delivery: 'COMP ENG / IT DIR',
            requisitionRef: '10080130',
            suppliersIdentified: 'NIXZIMO PVT LTD; TECHWORLD PVT LTD',
            stakeholder: {
                gs: { notes: '', files: [], endorsedAt: '2026-08-10T10:00:00' },
                daf: { notes: '', files: [], endorsedAt: '2026-08-12T11:00:00' },
                dp: { notes: 'RFQ pack issued 15 Aug 2026.', files: [], invited: 'NIXZIMO PVT LTD; TECHWORLD PVT LTD' },
                suppliers: {
                    'nixzimo pvt ltd': { name: 'NIXZIMO PVT LTD', notes: 'Invited to quote.', quoteRef: '', banking: '', files: [] }
                }
            },
            history: [
                { at: '2026-08-15T09:00:00', status: 'f1_with_dp', by: 'DP Contracts', note: 'Call for quotations — 3 suppliers invited.' }
            ]
        }),
        dpProcSeedBase({
            id: 'dpp-seed-dp-quotes-002',
            refNo: 'DP-2026-0005',
            status: 'quotes_itdir_eval',
            itemSummary: 'Samsung 27" FHD monitor × 20 — Software Engineering',
            estimatedCost: 'USD 6,400.00',
            glValue: '3112210001',
            glDisplay: '3112210001 — ICT Equipment',
            costCentre: 'Z04P2SP212',
            delivery: 'SOFTWARE ENG / IT DIR',
            requisitionRef: '10080135',
            suppliersIdentified: 'NIXZIMO PVT LTD; INGRAM MICRO',
            quotationsNotes: 'Nixzimo ZWG 320,000 · Ingram ZWG 315,000 — IT Dir spec eval in progress.',
            stakeholder: {
                gs: { endorsedAt: '2026-08-05T10:00:00', notes: '', files: [] },
                daf: { endorsedAt: '2026-08-07T10:00:00', notes: '', files: [] }
            },
            history: [
                { at: '2026-08-22T10:00:00', status: 'quotes_itdir_eval', by: 'DP', note: 'Quotations received — with IT Dir for tech/spec evaluation.' }
            ]
        }),
        dpProcSeedBase({
            id: 'dpp-seed-aiad-dd-001',
            refNo: 'DP-2026-0006',
            status: 'aiad_due_diligence',
            itemSummary: 'Fortinet FortiGate 100F firewall × 3 — ICT Security',
            estimatedCost: 'USD 9,750.00',
            glValue: '3112210001',
            glDisplay: '3112210001 — ICT Equipment',
            costCentre: 'Z04P2SP212',
            delivery: 'ICT SECURITY / IT DIR',
            requisitionRef: '10080140',
            awardedSupplier: 'NIXZIMO PVT LTD',
            awardedQuotationRef: 'Quote FG-100F/2026',
            quotationsNotes: 'Single responsive quote — Nixzimo USD 3,250 each.',
            stakeholder: {
                gs: { endorsedAt: '2026-07-28T10:00:00', notes: '', files: [] },
                daf: { endorsedAt: '2026-07-30T10:00:00', notes: '', files: [] },
                dp: { notes: 'Winner: Nixzimo.', files: [] }
            },
            history: [
                { at: '2026-08-25T14:00:00', status: 'aiad_due_diligence', by: 'DP SO1', note: 'Pack sent to AIAD for Price Due Diligence.' }
            ]
        }),
        dpProcSeedBase({
            id: 'dpp-seed-aiad-cert-001',
            refNo: 'DP-2026-0007',
            status: 'aiad_certificate',
            itemSummary: 'APC Smart-UPS 3000VA × 6 — IT Training School',
            estimatedCost: 'USD 4,200.00',
            glValue: '3112210001',
            glDisplay: '3112210001 — ICT Equipment',
            costCentre: 'Z04P2SP212',
            delivery: 'ITTS / IT DIR',
            requisitionRef: '10080145',
            awardedSupplier: 'TECHWORLD PVT LTD',
            dueDiligenceCert: 'Price within prevailing market range — cert 2026/ITTS/014.',
            stakeholder: {
                gs: { endorsedAt: '2026-07-15T10:00:00', notes: '', files: [] },
                daf: { endorsedAt: '2026-07-17T10:00:00', notes: '', files: [] },
                aiad: { certNo: '2026/ITTS/014', certifiedAt: '2026-08-26T10:00:00', notes: 'Certificate issued.', files: [] }
            },
            history: [
                { at: '2026-08-26T10:00:00', status: 'aiad_certificate', by: 'AIAD', note: 'Price Due Diligence certificate returned to DP.' }
            ]
        }),
        dpProcSeedBase({
            id: 'dpp-seed-supplier-rfq-001',
            refNo: 'DP-2026-0008',
            status: 'f1_with_dp',
            itemSummary: 'Original HP toner cartridge CF287X × 50 — Workshop spares',
            estimatedCost: 'ZWG 175,000.00',
            glValue: '2201900002',
            glDisplay: '2201900002 — Spare Parts',
            costCentre: 'Z04P2SP212',
            delivery: 'WORKSHOP / IT DIR',
            requisitionRef: '10080150',
            suppliersIdentified: 'NIXZIMO PVT LTD',
            stakeholder: {
                gs: { endorsedAt: '2026-08-14T10:00:00', notes: '', files: [] },
                daf: { endorsedAt: '2026-08-16T10:00:00', notes: '', files: [] },
                dp: { invited: 'NIXZIMO PVT LTD', notes: 'RFQ closing 5 Sep 2026.', files: [] },
                suppliers: {
                    'nixzimo pvt ltd': { name: 'NIXZIMO PVT LTD', notes: 'Awaiting quotation upload.', quoteRef: '', banking: '', files: [] }
                }
            },
            history: [
                { at: '2026-08-28T08:00:00', status: 'f1_with_dp', by: 'DP', note: 'RFQ issued to Nixzimo — toner cartridges.' }
            ]
        }),
        dpProcSeedBase({
            id: 'dpp-seed-supplier-po-001',
            refNo: 'DP-2026-0009',
            status: 'po_electronic',
            itemSummary: 'Canon imageRUNNER ADVANCE C5535i × 2 — Orderly Room',
            estimatedCost: 'ZWG 420,000.00',
            glValue: '3112210001',
            glDisplay: '3112210001 — ICT Equipment',
            costCentre: 'Z04P2SP212',
            delivery: 'ORDERLY ROOM / IT DIR',
            requisitionRef: '10080155',
            awardedSupplier: 'NIXZIMO PVT LTD',
            awardedQuotationRef: 'Quote CANON-IR/2026',
            poNumber: 'DP 3512/2026',
            stakeholder: {
                gs: { endorsedAt: '2026-07-01T10:00:00', notes: '', files: [] },
                daf: { endorsedAt: '2026-07-03T10:00:00', notes: '', files: [] },
                aiad: { certNo: '2026/ORD/008', certifiedAt: '2026-08-10T10:00:00', notes: '', files: [] },
                suppliers: {
                    'nixzimo pvt ltd': { name: 'NIXZIMO PVT LTD', notes: 'P/O received — prepare delivery.', quoteRef: 'Quote CANON-IR/2026', banking: 'CABS Borrowdale ZWG 1156015626', files: [] }
                }
            },
            history: [
                { at: '2026-08-18T10:00:00', status: 'po_electronic', by: 'DP', note: 'P/O DP 3512/2026 issued to Nixzimo.' }
            ]
        }),
        dpProcSeedBase({
            id: 'dpp-seed-done-001',
            refNo: 'DP-2026-0010',
            status: 'payment_complete',
            itemSummary: 'Microsoft 365 E3 licence renewal (annual) — IT Dir establishment',
            estimatedCost: 'USD 14,400.00',
            glValue: '2200600003',
            glDisplay: '2200600003 — Software Licenses',
            costCentre: 'Z04P2SP212',
            delivery: 'IT DIR',
            requisitionRef: '10080090',
            awardedSupplier: 'MICROSOFT / INGRAM',
            poNumber: 'DP 3401/2026',
            paymentRef: 'DAF PV 2026/0842',
            stakeholder: {
                gs: { endorsedAt: '2026-06-01T10:00:00', notes: '', files: [] },
                daf: { endorsedAt: '2026-06-03T10:00:00', notes: '', files: [], paidAt: '2026-07-15T10:00:00', paymentRef: 'DAF PV 2026/0842' }
            },
            history: [
                { at: '2026-07-15T10:00:00', status: 'payment_complete', by: 'DAF', note: 'Payment voucher 2026/0842 — cycle closed.' }
            ]
        }),
        dpProcSeedBase({
            id: 'dpp-seed-daf-pay-manual-001',
            refNo: 'DP-2026-0011',
            status: 'po_manual_pending_daf',
            itemSummary: 'Epson EB-L210SW projector × 3 — IT Training School',
            estimatedCost: 'USD 5,850.00',
            glValue: '3112210001',
            glDisplay: '3112210001 — ICT Equipment',
            costCentre: 'Z04P2SP212',
            delivery: 'ITTS / IT DIR',
            requisitionRef: '10080160',
            awardedSupplier: 'TECHWORLD PVT LTD',
            poNumber: 'DP 3520/2026',
            budgetProvisioned: 'no',
            stakeholder: {
                gs: { endorsedAt: '2026-07-20T10:00:00', notes: '', files: [] },
                daf: { notes: 'Manual P/O — awaiting DAF authorisation.', files: [] },
                aiad: { certNo: '2026/ITTS/019', certifiedAt: '2026-08-15T10:00:00', notes: '', files: [] }
            },
            history: [
                { at: '2026-08-22T10:00:00', status: 'po_manual_pending_daf', by: 'DP', note: 'Manual P/O DP 3520/2026 — DAF authorisation required (non-budgeted vote).' }
            ]
        })
    ];
}

function portalDemoSeedIds() {
    return buildPortalDemoDpProcurements().map((s) => s.id).concat(['dpp-seed-dp3478-2026']);
}

function ensureNixzimo3478SupplierStakeholder(rec) {
    if (!rec) return;
    const stake = rec.stakeholder && typeof rec.stakeholder === 'object' ? rec.stakeholder : {};
    rec.stakeholder = stake;
    if (!stake.suppliers || typeof stake.suppliers !== 'object') stake.suppliers = {};
    if (!stake.suppliers['nixzimo pvt ltd']) {
        stake.suppliers['nixzimo pvt ltd'] = {
            name: 'NIXZIMO PVT LTD',
            notes: 'Invoice 205 + D-Note uploaded — awaiting IT Dir inspection clearance.',
            quoteRef: 'Invoice 205',
            banking: 'CABS Borrowdale — ZWG 1156015626 / USD 1156015634',
            files: []
        };
    }
}

function mergePortalDemoCases(force) {
    if (!appState || !Array.isArray(appState.dpProcurements)) return 0;
    const list = appState.dpProcurements;
    const seeds = buildPortalDemoDpProcurements();
    let added = 0;
    seeds.forEach((seed) => {
        if (!list.some((rec) => rec.id === seed.id)) {
            list.push(seed);
            added += 1;
        }
    });
    ensureNixzimoDp3478Cycle();
    const nix = list.find((rec) => rec.id === 'dpp-seed-dp3478-2026');
    if (nix) ensureNixzimo3478SupplierStakeholder(nix);
    const expected = portalDemoSeedIds().length;
    const present = portalDemoSeedIds().filter((id) => list.some((rec) => rec.id === id)).length;
    const rev = Number(appState.dpProcurementSeedRev) || 0;
    if (force || added || present < expected || rev < DP_PROC_SEED_REV) {
        appState.dpProcurementSeedRev = DP_PROC_SEED_REV;
        if (typeof saveState === 'function') saveState();
    }
    return added;
}

function ensurePortalDemoCases() {
    mergePortalDemoCases(false);
}

function loadPortalDemoExamples() {
    const added = mergePortalDemoCases(true);
    if (typeof ensurePortalDemoRequisitions === 'function') ensurePortalDemoRequisitions(true);
    if (typeof ensureSupplierDebts === 'function') ensureSupplierDebts();
    if (typeof loadItDirCreditorsRegister === 'function') {
        try { loadItDirCreditorsRegister({ mode: 'merge' }); } catch (_) { /* optional */ }
    }
    if (typeof updateDashboard === 'function') updateDashboard();
    if (typeof updateSystemAlerts === 'function') updateSystemAlerts();
    if (typeof renderStakeholderDesk === 'function') renderStakeholderDesk();
    if (typeof renderRequisitionTrackerDashboard === 'function') renderRequisitionTrackerDashboard();
    if (typeof renderDpProcurementModule === 'function' && document.getElementById('dp-procurement')?.style.display !== 'none') {
        renderDpProcurementModule();
    }
    if (typeof renderRequisitionsModule === 'function' && document.getElementById('unit-requisitions')?.style.display !== 'none') {
        renderRequisitionsModule();
    }
    const msg = added
        ? `Loaded ${added} portal demo case(s).`
        : 'Portal demo examples are ready — open each window tab to explore.';
    if (typeof showToast === 'function') showToast(msg, 'success');
    return added;
}

window.loadPortalDemoExamples = loadPortalDemoExamples;
window.mergePortalDemoCases = mergePortalDemoCases;

function ensureDpProcurements() {
    if (!appState) return [];
    if (!Array.isArray(appState.dpProcurements)) {
        appState.dpProcurements = (typeof createDefaultDpProcurements === 'function')
            ? createDefaultDpProcurements()
            : [];
    }
    appState.dpProcurements.forEach((rec) => {
        const next = normalizeDpProcStatus(rec.status);
        if (next !== rec.status) rec.status = next;
        if (Array.isArray(rec.history)) {
            rec.history.forEach((h) => {
                h.status = normalizeDpProcStatus(h.status);
            });
        }
    });
    ensurePortalDemoCases();
    ensureNixzimoDp3478Cycle();
    return appState.dpProcurements;
}

function buildNixzimoDp3478Record() {
    return {
        id: 'dpp-seed-dp3478-2026',
        refNo: 'DP 3478/2026',
        status: 'delivery_verified',
        sentAt: '2026-08-04T00:00:00',
        sentDate: '2026-08-04',
        sentBy: 'ITDIR RQ',
        itemSummary: 'HP ELITEBOOK 830 G9 CORE I7 LAPTOP × 5 (P/O) — invoice/D-Note: HP Victus Gaming Laptop 15',
        estimatedCost: 'ZWG 350,000.00',
        glValue: '3112210001',
        glDisplay: '3112210001 — ICT Equipment',
        costCentre: 'Z04P2SP212',
        delivery: 'IT DIR / OSD HRE GP 3',
        remarks: 'Worked example from Learning Centre paper pack. Do not treat as paid until inspection hold is cleared.',
        officers: [],
        snapshot: null,
        officialHtml: '',
        requisitionRef: '10080264',
        budgetProvisioned: 'yes',
        suppliersIdentified: 'NIXZIMO PVT LTD (2780 Princess Margaret, Marlborough, Harare, 0712491600)',
        quotationsNotes: 'Nixzimo invoice 205 dated 24/08/2026 — HP Victus Gaming Laptop 15, 5 × ZWG 70,000 = ZWG 350,000. Tax line ZWG 46,969.70 not added into total.',
        itdirSpecEvalNotes: 'HOLD: P/O and AIAD name EliteBook 830 G9; quotation/D-Note name Victus Gaming 15. Spec match required before DAF pay.',
        auditRef: 'AIAD Price Due Diligence — 27 Aug 2026 (SSGT MACHIHA MK / CAPT S SIBANDA / COL L MSIPA)',
        dueDiligenceCert: 'Implied price within market range (form line EliteBook 830 G9; ZWL 30,000,000 each at rate 526.59 — denomination differs from P/O ZWG 70,000).',
        awardedSupplier: 'NIXZIMO PVT LTD',
        awardedQuotationRef: 'Invoice 205',
        poNumber: 'DP 3478/2026',
        dafAuthRef: '',
        deliveryNoteRef: 'Nixzimo D-Note 24/08 (OSD HRE GP 3, received SIBANDA F)',
        verificationNotes: 'Q 1033 RV 205 dated 25/8/26 — issued NIXZIMO to OSD HRE GP 3, received MAJ J SIZI. HOLD spec mismatch before DAF pay.',
        paymentRef: '',
        pipelineNotes: 'Banking: CABS Borrowdale — Nixzimo Pvt Ltd ZWG 1156015626 / USD 1156015634. Trigger DAF only after IT Dir inspection clears the EliteBook vs Victus mismatch.',
        seedExample: true,
        stakeholder: {
            gs: { endorsedAt: '2026-07-28T10:00:00', notes: 'GS endorsement on file.', files: [] },
            daf: { endorsedAt: '2026-07-30T10:00:00', notes: 'MANAC endorsed.', files: [] },
            aiad: { certNo: 'AIAD 27 Aug 2026', certifiedAt: '2026-08-27T10:00:00', notes: 'Price Due Diligence certificate issued.', files: [] },
            dp: { notes: 'P/O DP 3478/2026 issued.', files: [] },
            suppliers: {
                'nixzimo pvt ltd': {
                    name: 'NIXZIMO PVT LTD',
                    notes: 'Invoice 205 + D-Note — HP Victus Gaming Laptop 15 × 5.',
                    quoteRef: 'Invoice 205',
                    banking: 'CABS Borrowdale — ZWG 1156015626 / USD 1156015634',
                    files: []
                }
            }
        },
        history: [
            { at: '2026-08-04T00:00:00', status: 'po_electronic', by: 'DP', note: 'P/O DP 3478/2026 issued — HP EliteBook 830 G9 × 5, ZWG 350,000, GL 3112210001, Req 10080264.' },
            { at: '2026-08-24T00:00:00', status: 'supply_delivery', by: 'NIXZIMO', note: 'Invoice 205 + D-Note — HP Victus Gaming Laptop 15 × 5 to OSD HRE GP 3.' },
            { at: '2026-08-25T00:00:00', status: 'delivery_verified', by: 'OSD HRE GP 3', note: 'Q 1033 RV 205 received by MAJ J SIZI. Inspection hold: description vs P/O.' },
            { at: '2026-08-27T00:00:00', status: 'delivery_verified', by: 'AIAD', note: 'Price Due Diligence certificate dated 27 Aug 2026 (after P/O date 4 Aug).' }
        ]
    };
}

function ensureNixzimoDp3478Cycle() {
    if (!appState || !Array.isArray(appState.dpProcurements)) return;
    const list = appState.dpProcurements;
    const poKey = typeof normalizeRealDpPoNo === 'function'
        ? normalizeRealDpPoNo('DP 3478/2026')
        : 'DP 3478/2026';
    const exists = list.some((rec) => {
        if (rec.id === 'dpp-seed-dp3478-2026') return true;
        const po = typeof normalizeRealDpPoNo === 'function'
            ? normalizeRealDpPoNo(rec.poNumber || rec.refNo)
            : String(rec.poNumber || rec.refNo || '').toUpperCase();
        return po === poKey;
    });
    if (exists) return;
    list.push(buildNixzimoDp3478Record());
}

function getDpProcStatusMeta(value) {
    const key = normalizeDpProcStatus(value);
    return DP_PROC_STATUSES.find((s) => s.value === key) || { value: key, label: key || '—', short: key || '—', step: null };
}

function getDpProcStatusLabel(value) {
    return getDpProcStatusMeta(value).label;
}

function getDpProcStageOrder(rec) {
    const provisioned = (rec?.budgetProvisioned || document.getElementById('dpProcBudgeted')?.value || 'yes') !== 'no';
    return provisioned ? DP_PROC_STAGE_ORDER_BUDGETED : DP_PROC_STAGE_ORDER_MANUAL;
}

function nextDpProcRef() {
    const list = ensureDpProcurements();
    const year = new Date().getFullYear();
    const prefix = `DP-${year}-`;
    let max = 0;
    list.forEach((rec) => {
        const m = String(rec.refNo || '').match(new RegExp(`^DP-${year}-(\\d+)$`, 'i'));
        if (m) max = Math.max(max, parseInt(m[1], 10) || 0);
    });
    return `${prefix}${String(max + 1).padStart(4, '0')}`;
}

function dpProcTodayIso() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function dpProcEscape(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function summarizeDpF1Items(items) {
    const list = Array.isArray(items) ? items : [];
    if (!list.length) return 'No line items';
    const names = list.map((i) => i.designation).filter(Boolean);
    if (!names.length) return `${list.length} line item(s)`;
    if (names.length === 1) return names[0];
    if (names.length === 2) return `${names[0]}; ${names[1]}`;
    return `${names[0]}; ${names[1]} (+${names.length - 2} more)`;
}

function findOpenDpProcurementForCurrentForm() {
    const snap = typeof getDpF1FormSnapshot === 'function' ? getDpF1FormSnapshot() : null;
    if (!snap) return null;
    const list = ensureDpProcurements();
    const date = snap.date || '';
    const gl = snap.glValue || '';
    const summary = summarizeDpF1Items(snap.items);
    return list.find((rec) => (
        DP_PROC_OPEN.has(normalizeDpProcStatus(rec.status)) &&
        (rec.snapshot?.date || '') === date &&
        (rec.snapshot?.glValue || '') === gl &&
        summarizeDpF1Items(rec.snapshot?.items) === summary
    )) || null;
}

function getLatestOpenDpProcurement() {
    const list = ensureDpProcurements()
        .filter((r) => DP_PROC_OPEN.has(normalizeDpProcStatus(r.status)))
        .sort((a, b) => String(b.sentAt || '').localeCompare(String(a.sentAt || '')));
    return list[0] || null;
}

function validateDpF1ForSend(snap) {
    if (!snap) return 'Unable to read DP F1 form.';
    if (!snap.items || !snap.items.length) {
        return 'Add at least one goods/services/equipment line before sending to DP.';
    }
    const missingDesignation = snap.items.some((i) => !String(i.designation || '').trim());
    if (missingDesignation) {
        return 'Each line item needs an official designation before sending to DP.';
    }
    if (!snap.estimatedCost) {
        return 'Enter estimated cost (section 2) before sending to DP.';
    }
    if (!snap.glValue) {
        return 'Select the General Ledger to be charged (section 4) before sending to DP.';
    }
    const officer = snap.officers?.[0];
    if (!officer || !officer.name) {
        return 'Enter the designated Provision Officer name (section 7) before sending to DP.';
    }

    const funding = typeof checkDpF1Funding === 'function' ? checkDpF1Funding(snap) : null;
    if (funding && !funding.ok) {
        return funding.message;
    }
    return '';
}

function sendDpF1ToDirectorateOfProcurement() {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;

    if (typeof getDpF1FormSnapshot !== 'function') {
        showToast('DP F1 form is not available.', 'error');
        return;
    }

    const snap = getDpF1FormSnapshot();
    const error = validateDpF1ForSend(snap);
    if (error) {
        showToast(error, 'error');
        return;
    }

    const existing = findOpenDpProcurementForCurrentForm();
    if (existing) {
        const go = confirm(
            `This indent appears already in the procurement cycle as ${existing.refNo} (${getDpProcStatusLabel(existing.status)}).\n\nOpen the ICT Procurement Cycle instead?`
        );
        if (go && typeof navigateToModule === 'function') {
            navigateToModule('dp-procurement');
            setTimeout(() => editDpProcurement(existing.id), 50);
        }
        return;
    }

    const itemSummary = summarizeDpF1Items(snap.items);
    const ok = confirm(
        `Send this completed IT Dir F1 to Directorate of Procurement (DP)?\n\n` +
        `Items: ${itemSummary}\n` +
        `Estimated cost: ${snap.estimatedCost}\n` +
        `GL / vote: ${snap.glDisplay || snap.glValue}\n\n` +
        `Next: Colonel SD (GS) + MANAC (DAF) endorse → PFMS req number on F1 → surrender to DP Contracts → ` +
        `quotes / adjudication / SO1 winner → AIAD Price Due Diligence → DP P/O to IT Dir → supply → IT Dir inspects → DAF pays.`
    );
    if (!ok) return;

    if (typeof saveModule === 'function') {
        saveModule('dp-f1-form');
    }

    const now = new Date().toISOString();
    const user = (typeof currentUser !== 'undefined' && currentUser) ? currentUser : null;
    const officialHtml = typeof buildDpF1OfficialHtml === 'function' ? buildDpF1OfficialHtml() : '';

    const record = {
        id: `dpp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        refNo: nextDpProcRef(),
        status: 'awaiting_gs',
        sentAt: now,
        sentDate: snap.date || dpProcTodayIso(),
        sentBy: user?.name || user?.username || 'ITDIR',
        itemSummary,
        estimatedCost: snap.estimatedCost || '',
        glValue: snap.glValue || '',
        glDisplay: snap.glDisplay || '',
        costCentre: snap.costCentre || '',
        delivery: snap.delivery || '',
        remarks: snap.remarks || '',
        officers: snap.officers || [],
        snapshot: snap,
        officialHtml,
        requisitionRef: '',
        budgetProvisioned: 'yes',
        suppliersIdentified: '',
        quotationsNotes: '',
        itdirSpecEvalNotes: '',
        auditRef: '',
        dueDiligenceCert: '',
        awardedSupplier: '',
        awardedQuotationRef: '',
        poNumber: '',
        dafAuthRef: '',
        deliveryNoteRef: '',
        verificationNotes: '',
        paymentRef: '',
        pipelineNotes: '',
        history: [
            {
                at: now,
                status: 'awaiting_gs',
                by: user?.name || user?.username || 'ITDIR',
                note: 'DP F1 raised. Next: Colonel SD (GS Branch) endorses in the GS window.'
            }
        ],
        updatedAt: now
    };

    ensureDpProcurements().unshift(record);
    if (typeof saveState === 'function') saveState();
    updateDpF1SendStatus();
    if (typeof updateSystemAlerts === 'function') updateSystemAlerts();
    if (typeof updateDashboard === 'function') updateDashboard();

    showToast(`${record.refNo} entered procurement cycle — F1 with DP (call for quotations).`);

    const openPipe = confirm('Open ICT Procurement Cycle to track this F1?');
    if (openPipe && typeof navigateToModule === 'function') {
        navigateToModule('dp-procurement');
        setTimeout(() => editDpProcurement(record.id), 50);
    }
}

function updateDpF1SendStatus() {
    const banner = document.getElementById('dpF1SendStatus');
    const btn = document.getElementById('btnSendDpF1ToDp');
    if (!banner) return;

    const open = getLatestOpenDpProcurement();
    if (!open) {
        banner.hidden = true;
        banner.innerHTML = '';
        if (btn) {
            btn.disabled = false;
            btn.textContent = 'Send to Directorate of Procurement (DP)';
        }
        return;
    }

    const meta = getDpProcStatusMeta(open.status);
    banner.hidden = false;
    banner.innerHTML = `
        <strong>${dpProcEscape(open.refNo)}</strong> in procurement cycle —
        <span class="dp-proc-status-pill dp-proc-status-${dpProcEscape(normalizeDpProcStatus(open.status))}">${dpProcEscape(meta.short)}</span>
        <span class="dp-proc-banner-detail">${dpProcEscape(open.itemSummary)}</span>
        <button type="button" class="btn btn-secondary btn-sm" id="dpF1OpenPipelineBtn">Open cycle</button>
    `;
    banner.querySelector('#dpF1OpenPipelineBtn')?.addEventListener('click', () => {
        if (typeof navigateToModule === 'function') {
            navigateToModule('dp-procurement');
            setTimeout(() => editDpProcurement(open.id), 50);
        }
    });
}

function getDpProcurementSummary() {
    const summary = { open: 0, withDp: 0, itdirEval: 0, aiad: 0, po: 0, delivery: 0, paid: 0, cancelled: 0 };
    ensureDpProcurements().forEach((rec) => {
        const status = normalizeDpProcStatus(rec.status);
        if (status === 'payment_complete') summary.paid += 1;
        else if (status === 'cancelled') summary.cancelled += 1;
        else if (DP_PROC_OPEN.has(status)) {
            summary.open += 1;
            if (status === 'quotes_itdir_eval' || status === 'spec_raise_f1' || status === 'requisition' || status === 'delivery_verified') {
                summary.itdirEval += 1;
            } else if (status === 'aiad_due_diligence' || status === 'aiad_certificate') {
                summary.aiad += 1;
            } else if (status === 'po_electronic' || status === 'po_manual_pending_daf' || status === 'po_manual_authorised') {
                summary.po += 1;
            } else if (status === 'supply_delivery') {
                summary.delivery += 1;
            } else {
                summary.withDp += 1;
            }
        }
    });
    return summary;
}

function getDpProcurementAlerts(options = {}) {
    const alerts = [];
    const itdirSet = typeof ALERT_PENDING_AT_ITDIR_STATUSES !== 'undefined'
        ? ALERT_PENDING_AT_ITDIR_STATUSES
        : new Set(['requisition', 'spec_raise_f1', 'quotes_itdir_eval', 'delivery_verified']);
    const dpSet = typeof ALERT_PENDING_AT_DP_STATUSES !== 'undefined'
        ? ALERT_PENDING_AT_DP_STATUSES
        : new Set(['f1_with_dp', 'spec_returned_dp', 'aiad_due_diligence', 'aiad_certificate']);
    const watchCovered = new Set([...itdirSet, ...dpSet]);

    ensureDpProcurements().forEach((rec) => {
        const status = normalizeDpProcStatus(rec.status);
        if (!DP_PROC_OPEN.has(status)) return;
        // Dashboard watch sections cover IT Dir + DP pending requisitions
        if ((options.skipWatchCovered || options.skipPendingAtDp) && watchCovered.has(status)) return;
        const meta = getDpProcStatusMeta(status);
        let type = 'info';
        if (status === 'po_manual_pending_daf' || status === 'aiad_due_diligence' || status === 'quotes_itdir_eval') {
            type = 'warning';
        }
        alerts.push({
            type,
            target: 'dp-procurement',
            dpId: rec.id,
            text: `Procurement ${rec.refNo}: ${meta.short} — ${rec.itemSummary}`
        });
    });
    return alerts;
}

function fillDpProcurementStatusOptions(selected) {
    const sel = document.getElementById('dpProcStatus');
    if (!sel) return;
    const current = normalizeDpProcStatus(selected);
    sel.innerHTML = DP_PROC_STATUSES.map((s) => (
        `<option value="${s.value}"${s.value === current ? ' selected' : ''}>${dpProcEscape(s.label)}</option>`
    )).join('');
}

function renderDpProcCycleStrip(activeStatus) {
    const strip = document.getElementById('dpProcCycleStrip');
    if (!strip) return;
    const active = normalizeDpProcStatus(activeStatus);
    const activeStep = getDpProcStatusMeta(active).step;
    const steps = [
        { n: 1, title: 'Requisition', hint: 'User need + target' },
        { n: 2, title: 'DP F1', hint: 'GS · MANAC · PFMS no.' },
        { n: 3, title: 'DP Contracts', hint: 'Quotes · adjudicate · SO1' },
        { n: 4, title: 'AIAD', hint: 'Price due diligence' },
        { n: 5, title: 'P/O', hint: 'DP P/O to IT Dir' },
        { n: 6, title: 'Supply', hint: 'D-Note' },
        { n: 7, title: 'Inspect', hint: 'Spec match · Q 1033 RV' },
        { n: 8, title: 'DAF pay', hint: 'After IT Dir satisfied' }
    ];
    strip.innerHTML = steps.map((s) => {
        const state = activeStep == null
            ? ''
            : (s.n < activeStep ? ' is-done' : (s.n === activeStep ? ' is-active' : ''));
        return `
            <div class="dp-cycle-step${state}" data-cycle-step="${s.n}">
                <span class="dp-cycle-num">${s.n}</span>
                <span class="dp-cycle-title">${dpProcEscape(s.title)}</span>
                <span class="dp-cycle-hint">${dpProcEscape(s.hint)}</span>
            </div>
        `;
    }).join('');
}

function clearDpProcurementForm() {
    const set = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.value = value ?? '';
    };
    set('dpProcEditId', '');
    set('dpProcRefNo', '');
    set('dpProcSentDate', '');
    set('dpProcItemSummary', '');
    set('dpProcEstimatedCost', '');
    set('dpProcGl', '');
    set('dpProcRequisitionRef', '');
    set('dpProcBudgeted', 'yes');
    set('dpProcSuppliers', '');
    set('dpProcQuotations', '');
    set('dpProcItdirEval', '');
    set('dpProcAuditRef', '');
    set('dpProcDdCert', '');
    set('dpProcAwarded', '');
    set('dpProcAwardedQuote', '');
    set('dpProcPoNumber', '');
    set('dpProcDafAuth', '');
    set('dpProcDeliveryNote', '');
    set('dpProcVerification', '');
    set('dpProcPaymentRef', '');
    set('dpProcNotes', '');
    fillDpProcurementStatusOptions('f1_with_dp');
    renderDpProcCycleStrip(null);
    if (typeof updateDpProcurementStockStatus === 'function') updateDpProcurementStockStatus(null);
    const title = document.getElementById('dpProcFormTitle');
    if (title) title.textContent = 'Select a cycle record to update status';
    const hist = document.getElementById('dpProcHistory');
    if (hist) hist.innerHTML = '<p class="dp-proc-muted">No record selected.</p>';
    const preview = document.getElementById('dpProcPreview');
    if (preview) preview.innerHTML = '';
}

function editDpProcurement(id) {
    const rec = ensureDpProcurements().find((r) => r.id === id);
    if (!rec) {
        showToast('Procurement record not found.', 'error');
        return;
    }
    const status = normalizeDpProcStatus(rec.status);
    const set = (fid, value) => {
        const el = document.getElementById(fid);
        if (el) el.value = value ?? '';
    };
    set('dpProcEditId', rec.id);
    set('dpProcRefNo', rec.refNo || '');
    set('dpProcSentDate', rec.sentDate || (rec.sentAt || '').slice(0, 10));
    set('dpProcItemSummary', rec.itemSummary || '');
    set('dpProcEstimatedCost', rec.estimatedCost || '');
    set('dpProcGl', rec.glDisplay || rec.glValue || '');
    set('dpProcRequisitionRef', rec.requisitionRef || '');
    set('dpProcBudgeted', rec.budgetProvisioned || 'yes');
    set('dpProcSuppliers', rec.suppliersIdentified || '');
    set('dpProcQuotations', rec.quotationsNotes || '');
    set('dpProcItdirEval', rec.itdirSpecEvalNotes || rec.costComparisonNotes || '');
    set('dpProcAuditRef', rec.auditRef || '');
    set('dpProcDdCert', rec.dueDiligenceCert || '');
    set('dpProcAwarded', rec.awardedSupplier || '');
    set('dpProcAwardedQuote', rec.awardedQuotationRef || '');
    set('dpProcPoNumber', rec.poNumber || '');
    set('dpProcDafAuth', rec.dafAuthRef || '');
    set('dpProcDeliveryNote', rec.deliveryNoteRef || '');
    set('dpProcVerification', rec.verificationNotes || '');
    set('dpProcPaymentRef', rec.paymentRef || '');
    set('dpProcNotes', rec.pipelineNotes || '');
    fillDpProcurementStatusOptions(status);
    renderDpProcCycleStrip(status);
    if (typeof updateDpProcurementStockStatus === 'function') updateDpProcurementStockStatus(rec);

    const title = document.getElementById('dpProcFormTitle');
    if (title) title.textContent = `Update ${rec.refNo}`;

    const hist = document.getElementById('dpProcHistory');
    if (hist) {
        const rows = (rec.history || []).slice().reverse().map((h) => `
            <li>
                <strong>${dpProcEscape(getDpProcStatusLabel(h.status))}</strong>
                <span class="dp-proc-muted">${dpProcEscape((h.at || '').replace('T', ' ').slice(0, 19))} — ${dpProcEscape(h.by || '')}</span>
                ${h.note ? `<div>${dpProcEscape(h.note)}</div>` : ''}
            </li>
        `).join('');
        hist.innerHTML = rows ? `<ul class="dp-proc-history-list">${rows}</ul>` : '<p class="dp-proc-muted">No history yet.</p>';
    }

    const preview = document.getElementById('dpProcPreview');
    if (preview) {
        preview.innerHTML = rec.officialHtml
            ? `<div class="dp-proc-preview-doc">${rec.officialHtml}</div>`
            : '<p class="dp-proc-muted">No captured official F1 HTML.</p>';
    }

    document.getElementById('dpProcStatus')?.focus();
}

function readDpProcurementForm() {
    return {
        id: document.getElementById('dpProcEditId')?.value || '',
        status: normalizeDpProcStatus(document.getElementById('dpProcStatus')?.value || 'f1_with_dp'),
        requisitionRef: (document.getElementById('dpProcRequisitionRef')?.value || '').trim(),
        budgetProvisioned: document.getElementById('dpProcBudgeted')?.value || 'yes',
        suppliersIdentified: (document.getElementById('dpProcSuppliers')?.value || '').trim(),
        quotationsNotes: (document.getElementById('dpProcQuotations')?.value || '').trim(),
        itdirSpecEvalNotes: (document.getElementById('dpProcItdirEval')?.value || '').trim(),
        auditRef: (document.getElementById('dpProcAuditRef')?.value || '').trim(),
        dueDiligenceCert: (document.getElementById('dpProcDdCert')?.value || '').trim(),
        awardedSupplier: (document.getElementById('dpProcAwarded')?.value || '').trim(),
        awardedQuotationRef: (document.getElementById('dpProcAwardedQuote')?.value || '').trim(),
        poNumber: (document.getElementById('dpProcPoNumber')?.value || '').trim(),
        dafAuthRef: (document.getElementById('dpProcDafAuth')?.value || '').trim(),
        deliveryNoteRef: (document.getElementById('dpProcDeliveryNote')?.value || '').trim(),
        verificationNotes: (document.getElementById('dpProcVerification')?.value || '').trim(),
        paymentRef: (document.getElementById('dpProcPaymentRef')?.value || '').trim(),
        pipelineNotes: (document.getElementById('dpProcNotes')?.value || '').trim()
    };
}

function saveDpProcurementFromForm() {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;

    const data = readDpProcurementForm();
    if (!data.id) {
        showToast('Select a procurement cycle record from the list first.', 'error');
        return;
    }
    const list = ensureDpProcurements();
    const idx = list.findIndex((r) => r.id === data.id);
    if (idx < 0) {
        showToast('Procurement record not found.', 'error');
        return;
    }

    const prev = list[idx];
    const status = data.status;

    if ((status === 'aiad_certificate' || status === 'po_electronic' || status === 'po_manual_pending_daf' || status === 'po_manual_authorised')
        && !data.dueDiligenceCert && !data.auditRef) {
        showToast('Enter the AIAD due diligence certificate / reference.', 'error');
        document.getElementById('dpProcDdCert')?.focus();
        return;
    }
    if ((status === 'po_electronic' || status === 'po_manual_authorised' || status === 'supply_delivery')
        && !data.awardedSupplier) {
        showToast('Enter the awarded supplier (from AIAD-certified quotation).', 'error');
        document.getElementById('dpProcAwarded')?.focus();
        return;
    }
    if ((status === 'po_manual_pending_daf' || status === 'po_manual_authorised') && data.budgetProvisioned === 'yes') {
        const switchOk = confirm(
            'Manual P/O is for items not covered by a target/budget.\n\nMark this as NOT provisioned against target/budget?'
        );
        if (switchOk) data.budgetProvisioned = 'no';
    }
    if (status === 'po_manual_authorised' && !data.dafAuthRef) {
        showToast('Enter DAF authorisation reference before marking Manual P/O as authorised.', 'error');
        document.getElementById('dpProcDafAuth')?.focus();
        return;
    }
    if ((status === 'po_electronic' || status === 'po_manual_authorised') && !data.poNumber) {
        showToast('Enter the Purchase Order number.', 'error');
        document.getElementById('dpProcPoNumber')?.focus();
        return;
    }
    if ((status === 'supply_delivery' || status === 'delivery_verified' || status === 'payment_complete')
        && !data.deliveryNoteRef) {
        showToast('Enter the delivery note reference.', 'error');
        document.getElementById('dpProcDeliveryNote')?.focus();
        return;
    }
    if (status === 'payment_complete' && !data.paymentRef) {
        showToast('Enter payment reference before closing the cycle.', 'error');
        document.getElementById('dpProcPaymentRef')?.focus();
        return;
    }

    const now = new Date().toISOString();
    const user = (typeof currentUser !== 'undefined' && currentUser) ? currentUser : null;
    const history = Array.isArray(prev.history) ? [...prev.history] : [];
    if (status !== normalizeDpProcStatus(prev.status)) {
        history.push({
            at: now,
            status,
            by: user?.name || user?.username || 'User',
            note: data.pipelineNotes || `Advanced to ${getDpProcStatusLabel(status)}.`
        });
    }

    if (status === 'delivery_verified' && typeof validateWorkshopCertForDeliveryVerified === 'function') {
        const draftRec = {
            ...prev,
            ...data,
            poNumber: data.poNumber,
            deliveryNoteRef: data.deliveryNoteRef,
            awardedSupplier: data.awardedSupplier,
            itemSummary: data.itemSummary,
            snapshot: prev.snapshot
        };
        const wrcVerifyErr = validateWorkshopCertForDeliveryVerified(draftRec);
        if (wrcVerifyErr) {
            showToast(wrcVerifyErr, 'error');
            return;
        }
    }

    list[idx] = {
        ...prev,
        ...data,
        status,
        history,
        updatedAt: now
    };

    const becameVerified = status === 'delivery_verified'
        && normalizeDpProcStatus(prev.status) !== 'delivery_verified';

    if (typeof saveState === 'function') saveState();
    renderDpProcurementModule();
    editDpProcurement(data.id);
    updateDpF1SendStatus();
    if (typeof updateSystemAlerts === 'function') updateSystemAlerts();
    showToast(`${prev.refNo} updated — ${getDpProcStatusLabel(status)}.`);

    // Inventory must be informed by what we procure & receive
    if (becameVerified && typeof postProcurementDeliveryToStock === 'function') {
        const postNow = confirm(
            'Delivery verified.\n\nPost these goods into Stores Inventory now?\n\n' +
            '(Opening + Received − Issued = On Hand — reports will account for this receipt.)'
        );
        if (postNow) {
            postProcurementDeliveryToStock(list[idx]);
            editDpProcurement(data.id);
        }
    }
}

function advanceDpProcurementStage() {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;
    const id = document.getElementById('dpProcEditId')?.value;
    if (!id) {
        showToast('Select a procurement cycle record first.', 'error');
        return;
    }
    const rec = ensureDpProcurements().find((r) => r.id === id);
    if (!rec) return;
    const status = normalizeDpProcStatus(rec.status);
    if (DP_PROC_CLOSED.has(status)) {
        showToast('This procurement cycle is already closed.', 'info');
        return;
    }

    if (status === 'aiad_certificate') {
        const choice = confirm(
            'Is this requisition covered by a DAF target / budget / vote?\n\nOK = Yes → Electronic P/O\nCancel = No → Manual P/O (needs DAF authorisation)'
        );
        const nextPo = choice ? 'po_electronic' : 'po_manual_pending_daf';
        const budgetEl = document.getElementById('dpProcBudgeted');
        if (budgetEl) budgetEl.value = choice ? 'yes' : 'no';
        const sel = document.getElementById('dpProcStatus');
        if (sel) sel.value = nextPo;
        saveDpProcurementFromForm();
        return;
    }

    const order = getDpProcStageOrder({
        ...rec,
        budgetProvisioned: document.getElementById('dpProcBudgeted')?.value || rec.budgetProvisioned || 'yes'
    });
    const i = order.indexOf(status);
    const next = i < 0 ? order[0] : order[Math.min(i + 1, order.length - 1)];
    if (next === status) {
        showToast('Already at the final stage of this path.', 'info');
        return;
    }
    const sel = document.getElementById('dpProcStatus');
    if (sel) sel.value = next;
    saveDpProcurementFromForm();
}

function deleteDpProcurement(id) {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;
    const list = ensureDpProcurements();
    const rec = list.find((r) => r.id === id);
    if (!rec) return;
    if (!confirm(`Delete procurement record ${rec.refNo}? This cannot be undone.`)) return;
    const idx = list.findIndex((r) => r.id === id);
    if (idx >= 0) list.splice(idx, 1);
    if (typeof saveState === 'function') saveState();
    clearDpProcurementForm();
    renderDpProcurementModule();
    updateDpF1SendStatus();
    if (typeof updateSystemAlerts === 'function') updateSystemAlerts();
    showToast(`${rec.refNo} deleted.`);
}

function renderDpProcurementModule() {
    ensureDpProcurements();
    const summary = getDpProcurementSummary();
    const setStat = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = String(value);
    };
    setStat('dpProcStatOpen', summary.open);
    setStat('dpProcStatWithDp', summary.withDp);
    setStat('dpProcStatItdir', summary.itdirEval);
    setStat('dpProcStatAudit', summary.aiad);
    setStat('dpProcStatPo', summary.po);
    setStat('dpProcStatPaid', summary.paid);

    const tbody = document.getElementById('dpProcTableBody');
    if (!tbody) return;

    const q = String(document.getElementById('dpProcTableSearch')?.value || '').trim().toLowerCase();
    let rows = ensureDpProcurements().slice();
    if (q) {
        rows = rows.filter((r) => {
            const blob = [
                r.refNo, r.itemSummary, r.status, r.estimatedCost, r.glDisplay, r.glValue,
                r.suppliersIdentified, r.awardedSupplier, r.dueDiligenceCert, r.auditRef,
                r.poNumber, r.dafAuthRef, r.deliveryNoteRef, r.requisitionRef
            ].join(' ').toLowerCase();
            return blob.includes(q);
        });
    }

    if (!rows.length) {
        tbody.innerHTML = `<tr><td colspan="8" class="dp-proc-empty-row">No cycle records yet. Complete IT Dir F1 and send to DP, or capture earlier stages here.</td></tr>`;
        return;
    }

    tbody.innerHTML = rows.map((r) => {
        const status = normalizeDpProcStatus(r.status);
        const meta = getDpProcStatusMeta(status);
        const budget = (r.budgetProvisioned || 'yes') === 'no' ? 'Manual/DAF path' : 'Budgeted';
        return `
            <tr data-dp-id="${dpProcEscape(r.id)}">
                <td><strong>${dpProcEscape(r.refNo)}</strong></td>
                <td>${dpProcEscape(r.sentDate || (r.sentAt || '').slice(0, 10))}</td>
                <td>${dpProcEscape(r.itemSummary)}</td>
                <td>${dpProcEscape(r.estimatedCost)}</td>
                <td>${dpProcEscape(r.glDisplay || r.glValue || '—')}</td>
                <td>${dpProcEscape(budget)}</td>
                <td><span class="dp-proc-status-pill dp-proc-status-${dpProcEscape(status)}">${dpProcEscape(meta.short)}</span></td>
                <td class="dp-proc-actions-cell">
                    <button type="button" class="btn btn-secondary btn-sm" data-dp-action="edit">Update</button>
                    <button type="button" class="btn btn-danger btn-sm" data-dp-action="delete">Delete</button>
                </td>
            </tr>
        `;
    }).join('');
}

function initDpProcurementModule() {
    const sendBtn = document.getElementById('btnSendDpF1ToDp');
    if (sendBtn && sendBtn.dataset.bound !== '1') {
        sendBtn.dataset.bound = '1';
        sendBtn.addEventListener('click', (e) => {
            e.preventDefault();
            sendDpF1ToDirectorateOfProcurement();
        });
    }

    const saveBtn = document.getElementById('dpProcSaveBtn');
    if (saveBtn && saveBtn.dataset.bound !== '1') {
        saveBtn.dataset.bound = '1';
        saveBtn.addEventListener('click', (e) => {
            e.preventDefault();
            saveDpProcurementFromForm();
        });
    }

    const advanceBtn = document.getElementById('dpProcAdvanceBtn');
    if (advanceBtn && advanceBtn.dataset.bound !== '1') {
        advanceBtn.dataset.bound = '1';
        advanceBtn.addEventListener('click', (e) => {
            e.preventDefault();
            advanceDpProcurementStage();
        });
    }

    const clearBtn = document.getElementById('dpProcClearBtn');
    if (clearBtn && clearBtn.dataset.bound !== '1') {
        clearBtn.dataset.bound = '1';
        clearBtn.addEventListener('click', (e) => {
            e.preventDefault();
            clearDpProcurementForm();
        });
    }

    const stockBtn = document.getElementById('dpProcPostStockBtn');
    if (stockBtn && stockBtn.dataset.bound !== '1') {
        stockBtn.dataset.bound = '1';
        stockBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const id = document.getElementById('dpProcEditId')?.value;
            if (!id) {
                showToast('Select a procurement cycle record first.', 'error');
                return;
            }
            const rec = ensureDpProcurements().find((r) => r.id === id);
            if (!rec) return;
            if (typeof postProcurementDeliveryToStock === 'function') {
                postProcurementDeliveryToStock(rec);
                editDpProcurement(id);
            }
        });
    }

    const wrcBtn = document.getElementById('dpProcWorkshopCertBtn');
    if (wrcBtn && wrcBtn.dataset.bound !== '1') {
        wrcBtn.dataset.bound = '1';
        wrcBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const id = document.getElementById('dpProcEditId')?.value;
            if (!id) {
                showToast('Select a procurement cycle record first.', 'error');
                return;
            }
            if (typeof createWrcFromDpProcurement === 'function') {
                createWrcFromDpProcurement(id);
            }
        });
    }

    const search = document.getElementById('dpProcTableSearch');
    if (search && search.dataset.bound !== '1') {
        search.dataset.bound = '1';
        search.addEventListener('input', () => renderDpProcurementModule());
    }

    const statusSel = document.getElementById('dpProcStatus');
    if (statusSel && statusSel.dataset.bound !== '1') {
        statusSel.dataset.bound = '1';
        statusSel.addEventListener('change', () => renderDpProcCycleStrip(statusSel.value));
    }

    const tbody = document.getElementById('dpProcTableBody');
    if (tbody && tbody.dataset.bound !== '1') {
        tbody.dataset.bound = '1';
        tbody.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-dp-action]');
            if (!btn) return;
            const tr = btn.closest('tr[data-dp-id]');
            const id = tr?.getAttribute('data-dp-id');
            if (!id) return;
            const action = btn.getAttribute('data-dp-action');
            if (action === 'edit') editDpProcurement(id);
            if (action === 'delete') deleteDpProcurement(id);
        });
    }

    fillDpProcurementStatusOptions('f1_with_dp');
    renderDpProcCycleStrip(null);
    updateDpF1SendStatus();
}
