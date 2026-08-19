/* org-profile.js — cost-centre / unit instance profile
 *
 * Ord Dir in ZNA procurement charts is ONE example cost centre.
 * The same process applies to IT Dir and other ZNA cost centres.
 * Future: swap ORG_PROFILE (or load from DB) to customise for
 * Quartermaster stores, Procurement desks, and other Army units.
 */

const ORG_PROFILES = {
    /** Current live instance — IT Directorate Tech Stores */
    'it-dir-techstores': {
        id: 'it-dir-techstores',
        shortName: 'IT Dir',
        fullName: 'IT Directorate Tech Stores',
        brandTitle: 'IT-DIR Tech Stores',
        kicker: 'IT-DIR DISPENSABLES AND CONTROLLED STORES INVENTORY',
        costCentre: 'Z04P2SP212',
        location: 'Josiah Magama Tongogara Barracks',
        storesLabel: 'IT Dir Tech Stores',
        /** Role this cost centre plays in Army procurement (same as Ord Dir in the sample chart) */
        processRole: 'cost_centre_directorate',
        processRoleLabel: 'Cost Centre Directorate (originates / receives / accounts)',
        modulePack: 'techstores',
        notes: 'Live TechStores deployment for IT Directorate ICT / consumables / spares.'
    },

    /** Example only — same process pattern as IT Dir */
    'ord-dir-example': {
        id: 'ord-dir-example',
        shortName: 'Ord Dir',
        fullName: 'Ordnance Directorate (example cost centre)',
        brandTitle: 'Ord Dir Stores',
        kicker: 'ORD DIR · Stores Control',
        costCentre: '— (example)',
        location: 'Army HQ / unit stores (example)',
        storesLabel: 'Ord Dir Stores',
        processRole: 'cost_centre_directorate',
        processRoleLabel: 'Cost Centre Directorate (originates / receives / accounts)',
        modulePack: 'quartermaster',
        notes: 'Illustrative profile only — not the live deployment.'
    }
};

/** Army-wide actors that stay constant across cost centres */
const ARMY_PROCESS_ACTORS = {
    user: 'User / demanding unit or branch',
    costCentreDir: 'Cost Centre Directorate (e.g. IT Dir, Ord Dir, other ZNA cost centres)',
    qsBr: 'QS Branch (Quartermaster)',
    cosQs: 'COS QS',
    comdElm: 'Command Element',
    comdZna: 'Comd ZNA',
    dp: 'Directorate Procurement (DP)',
    aiad: 'Army Internal Audit Directorate (AIAD)'
};

/**
 * Standard ZNA procurement process (identical for IT Dir, Ord Dir, and other cost centres).
 * Step wording uses generic “Cost Centre Dir” instead of hard-coding Ord Dir.
 */
const ZNA_PROCUREMENT_PROCESS = [
    { n: 1, title: 'User request (indent / requisition)', actor: 'user', detail: 'User puts requirement in writing to the Cost Centre Dir.' },
    { n: 2, title: 'Seek authority', actor: 'costCentreDir', detail: 'Cost Centre Dir writes to QS Br; Minute Sheet circulates via COS QS / Comd Elm for Comd ZNA approval.' },
    { n: 3, title: 'Authority to process', actor: 'qsBr', detail: 'QS Br authorises DP to initiate procurement.' },
    { n: 4, title: 'DP authorisation / execute', actor: 'dp', detail: 'DP identifies suppliers, specs and quantities; notifies QS Br.' },
    { n: 5, title: 'Due diligence (RFQ)', actor: 'aiad', detail: 'AIAD evaluates quotations (capacity, quality, reputation, compliance, value for money).' },
    { n: 6, title: 'Supplier selection', actor: 'qsBr', detail: 'QS Br / DP select supplier guided by AIAD certificate (quality over lowest price alone).' },
    { n: 7, title: 'Purchase order / contract', actor: 'dp', detail: 'DP issues PO / contract to supplier.' },
    { n: 8, title: 'Goods receipt & report', actor: 'costCentreDir', detail: 'Cost Centre Dir confirms quantity/condition to QS Br and DP; requests distribution.' },
    { n: 9, title: 'Distribution authorisation', actor: 'qsBr', detail: 'QS Br forwards distribution plan via COS QS for Comd ZNA authority.' },
    { n: 10, title: 'Pro-forma / minute sheet closure', actor: 'comdElm', detail: 'Signed pro-formas / minute sheet close the process for all stakeholders.' }
];

/** Supplier evaluation pack (Director Procurement, Army HQ) — Registered Suppliers G/C/006 */
const SUPPLIER_EVALUATION_REQUIREMENTS = [
    'Introductory letter addressed to the Director Procurement, Army HQ, P Bag 7720, Causeway, Harare',
    'Certificate of Incorporation',
    'CR14',
    'ZIMRA / VAT Registration',
    'Tax Clearance Certificate for the current period',
    'NSSA Registration (Compliance Certificate)',
    'Procurement Regulatory Authority of Zimbabwe (PRAZ) receipt — proof of payment of tender documents or admin fee',
    'Vendor Number (Renewal Certificate)',
    'Current Bank Statement (three months)',
    'At least three trade references — invoices from company clients / purchase order copies of companies your company is doing business with',
    'Company profile — professional and technical qualifications, competence, financial resources, equipment, facilities, personnel and experience to perform the contract',
    'All documents to be bound'
];
window.SUPPLIER_EVALUATION_REQUIREMENTS = SUPPLIER_EVALUATION_REQUIREMENTS;

/** Active profile for this installation — change to retarget branding later */
let ORG_PROFILE = ORG_PROFILES['it-dir-techstores'];

function getOrgProfile() {
    return ORG_PROFILE || ORG_PROFILES['it-dir-techstores'];
}

function setOrgProfile(profileId) {
    if (ORG_PROFILES[profileId]) {
        ORG_PROFILE = ORG_PROFILES[profileId];
        applyOrgProfileToShell();
        return true;
    }
    return false;
}

function applyOrgProfileToShell() {
    const p = getOrgProfile();
    document.title = `${p.brandTitle} - General Ledger System`;

    const setText = (sel, text) => {
        document.querySelectorAll(sel).forEach((el) => { el.textContent = text; });
    };

    setText('.sidebar-brand h2', p.brandTitle);
    const costEls = document.querySelectorAll('.sidebar-footer span, .dashboard-hero-sub strong');
    // Cost centre chip in sidebar
    document.querySelectorAll('.sidebar-footer span').forEach((el) => {
        if (/Cost Centre|Z0/i.test(el.textContent) || el.textContent.includes('Z04')) {
            el.textContent = `Cost Centre ${p.costCentre}`;
        }
    });

    const kicker = document.querySelector('.dashboard-kicker');
    if (kicker) kicker.textContent = p.kicker;

    const heroSub = document.querySelector('.dashboard-hero-sub');
    if (heroSub) {
        const strong = heroSub.querySelector('strong');
        if (strong && /Z0|Cost/i.test(heroSub.textContent)) {
            // First strong is usually cost centre in "Cost Centre <strong>…"
            const label = heroSub.childNodes[0];
            if (strong) strong.textContent = p.costCentre;
        }
    }

    const locChip = document.querySelector('.dashboard-context-row .context-chip');
    if (locChip && !locChip.id) locChip.textContent = p.location;

    const loginTitle = document.querySelector('.login-card h1');
    if (loginTitle) loginTitle.textContent = p.brandTitle;
}

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(applyOrgProfileToShell, 50);
});
