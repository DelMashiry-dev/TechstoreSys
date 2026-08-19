const STORAGE_KEY = 'techstores_gl_v1';
const SESSION_KEY = 'techstores_session_v1';
const API_BASE = '';

let dbConnected = false;
let saveTimer = null;

const ROLE_LABELS = {
    admin: 'Administrator',
    army_commander: "Army Commander (ZNA)",
    brig_gs: 'Brigadier GS',
    brig_as: 'Brigadier AS',
    brig_qs: 'Brigadier QS',
    director: 'Director IT Dir (Col)',
    deputy_director: 'Deputy Director (Lt Col)',
    aqso2: 'GSO2 / AQSO2 (Maj)',
    dir_aiad: 'Director AIAD',
    dir_daf: 'Director DAF',
    dir_dp: 'Director DP',
    techstores_officer: 'TechStores Officer',
    rq: 'Regimental Quartermaster (RQ)',
    store_officer: 'Store Officer',
    orderly_clerk: 'Orderly Room / Chief Clerk',
    storeman: 'Storeman (Cpl)',
    rp: 'RP Gate Register',
    workshop: 'Workshop Personnel',
    oc_sysadmin: 'OC Systems Administration',
    oc_workshop: 'OC Workshop / Engr Support',
    oc_compengr: 'OC Computer Engineering / DBA',
    oc_swengr: 'OC Software Engineering',
    oc_ictsec: 'OC ICT Security',
    oc_itts: 'OC ITTS',
    oc_admin: 'Admin Office / AO',
    oc_gate: 'Gate / RP Desk',
    viewer: 'Viewer'
};

/** Full operational module set (no user-mgmt / release-cut — those use flags). */
const MODULES_DEPT_DESKS = [
    'dept-sysadmin', 'dept-workshop', 'dept-compengr', 'dept-swengr',
    'dept-ictsec', 'dept-itts', 'dept-admin', 'dept-gate'
];

/** GL ledgers + stock / stores accounting — TechStores staff (+ oversight view-all). */
const MODULES_STORES_LEDGERS = [
    'gl-2200600002', 'gl-2200600003', 'gl-220200002', 'gl-2201900002', 'gl-3112210001',
    'voucher-module', 'stock-take', 'unit-checks', 'financial-year-bids', 'unit-equipment',
    'ict-accountability', 'ict-distribution', 'temporary-loans', 'monthly-returns', 'undelivered-orders',
    'delivery-note', 'purchase-orders', 'accommodation-stores',
    'zna-q-982', 'zna-q-178', 'zna-q-1033', 'zna-q-1043', 'zna-q-80', 'zna-svcs-890',
    'zna-q-1179', 'zna-q-987', 'zna-q-3977', 'zna-q-1157', 'zna-q-985', 'zna-q-1',
    'zna-q-998', 'zna-q-1680', 'zna-q-forms-index', 'zna-q-3', 'zna-q-31', 'zna-q-40',
    'zna-q-1049', 'zna-q-1229', 'zna-q-1571', 'zna-q-1954'
];

const MODULES_FULL_OPS = [
    'dashboard', 'orderly-room', 'it-dir-comms',
    ...MODULES_DEPT_DESKS,
    ...MODULES_STORES_LEDGERS,
    'unit-requisitions',
    'spec-evaluation', 'dp-f1-form', 'cost-comparative-schedule', 'dp-procurement', 'zna-svcs-1045',
    'workshop-repairs', 'gate-register', 'techstores-equipment-register',
    'suppliers-contracts', 'duties-roles', 'process-guides', 'system-help', 'reports-module'
];

/** RQ — TechStores quartermaster work (ledgers, issues, bids, procurement). */
const MODULES_RQ = [
    'dashboard', 'it-dir-comms',
    ...MODULES_STORES_LEDGERS,
    'unit-requisitions', 'spec-evaluation', 'dp-f1-form', 'cost-comparative-schedule', 'dp-procurement', 'zna-svcs-1045',
    'techstores-equipment-register', 'workshop-repairs',
    'suppliers-contracts', 'duties-roles', 'process-guides', 'system-help', 'reports-module'
];

const MODULES_STORE_OFFICER = MODULES_RQ.slice();

function modulesForDeptDesk(deskId, extras = []) {
    return ['dashboard', deskId, 'it-dir-comms', 'unit-requisitions', ...extras, 'process-guides', 'system-help'];
}

/** Orderly Room — DF / correspondence / routing only (no GL / stock ledgers). */
const MODULES_ORDERLY = [
    'dashboard', 'orderly-room', 'it-dir-comms', 'unit-requisitions',
    'process-guides', 'system-help', 'reports-module'
];

const MODULES_WORKSHOP = [
    'dashboard', 'dept-workshop', 'it-dir-comms',
    'workshop-repairs', 'zna-svcs-1045', 'zna-q-1043',
    'techstores-equipment-register', 'unit-requisitions', 'process-guides', 'system-help'
];

const MODULES_STOREMAN = [
    'dashboard', 'it-dir-comms',
    'voucher-module', 'stock-take', 'delivery-note', 'temporary-loans',
    'unit-requisitions', 'undelivered-orders',
    'zna-q-1033', 'zna-svcs-890', 'zna-svcs-1045',
    'techstores-equipment-register', 'workshop-repairs',
    'duties-roles', 'process-guides', 'system-help'
];

const MODULES_RP = [
    'dashboard', 'gate-register', 'it-dir-comms'
];

const MODULES_COMMON = ['dashboard', 'process-guides', 'system-help'];

/** Oversight: view every module; cannot alter quantities / save data. */
function roleOversightViewAll() {
    return {
        modules: ['*'],
        canEdit: false,
        canReleaseCut: false,
        canManageUsers: false,
        canBackup: true,
        canReports: true,
        accessMode: 'oversight_view'
    };
}

const ROLE_PERMISSIONS = {
    admin: {
        modules: ['*'],
        canEdit: true,
        canReleaseCut: true,
        canManageUsers: true,
        canBackup: true,
        canReports: true,
        accessMode: 'admin'
    },
    army_commander: roleOversightViewAll(),
    brig_gs: roleOversightViewAll(),
    brig_as: roleOversightViewAll(),
    brig_qs: roleOversightViewAll(),
    director: roleOversightViewAll(),
    deputy_director: roleOversightViewAll(),
    aqso2: roleOversightViewAll(),
    techstores_officer: roleOversightViewAll(),
    dir_aiad: {
        modules: [...MODULES_COMMON, 'it-dir-comms', 'reports-module', 'dp-procurement', 'cost-comparative-schedule', 'duties-roles'],
        canEdit: false, canReleaseCut: false, canManageUsers: false, canBackup: false, canReports: true,
        accessMode: 'oversight_view'
    },
    dir_daf: {
        modules: [...MODULES_COMMON, 'it-dir-comms', 'reports-module', 'financial-year-bids', 'duties-roles'],
        canEdit: false, canReleaseCut: false, canManageUsers: false, canBackup: false, canReports: true,
        accessMode: 'oversight_view'
    },
    dir_dp: {
        modules: [...MODULES_COMMON, 'it-dir-comms', 'reports-module', 'dp-procurement', 'dp-f1-form', 'cost-comparative-schedule', 'spec-evaluation', 'suppliers-contracts', 'duties-roles'],
        canEdit: false, canReleaseCut: false, canManageUsers: false, canBackup: false, canReports: true,
        accessMode: 'oversight_view'
    },
    rq: {
        modules: MODULES_RQ,
        canEdit: true, canReleaseCut: false, canManageUsers: false, canBackup: true, canReports: true,
        accessMode: 'stores_edit'
    },
    store_officer: {
        modules: MODULES_STORE_OFFICER,
        canEdit: true, canReleaseCut: false, canManageUsers: false, canBackup: false, canReports: true,
        accessMode: 'stores_edit'
    },
    orderly_clerk: {
        modules: MODULES_ORDERLY,
        canEdit: true, canReleaseCut: false, canManageUsers: false, canBackup: false, canReports: true,
        accessMode: 'orderly_edit'
    },
    storeman: {
        modules: MODULES_STOREMAN,
        canEdit: true, canReleaseCut: false, canManageUsers: false, canBackup: false, canReports: false,
        accessMode: 'storeman_edit'
    },
    rp: {
        modules: MODULES_RP,
        canEdit: true, canReleaseCut: false, canManageUsers: false, canBackup: false, canReports: false,
        accessMode: 'gate_edit'
    },
    workshop: {
        modules: MODULES_WORKSHOP,
        canEdit: true, canReleaseCut: false, canManageUsers: false, canBackup: false, canReports: false,
        accessMode: 'workshop_edit'
    },
    oc_sysadmin: {
        modules: modulesForDeptDesk('dept-sysadmin'),
        canEdit: true, canReleaseCut: false, canManageUsers: false, canBackup: false, canReports: false,
        accessMode: 'dept_edit'
    },
    oc_workshop: {
        modules: MODULES_WORKSHOP,
        canEdit: true, canReleaseCut: false, canManageUsers: false, canBackup: false, canReports: false,
        accessMode: 'workshop_edit'
    },
    oc_compengr: {
        modules: modulesForDeptDesk('dept-compengr'),
        canEdit: true, canReleaseCut: false, canManageUsers: false, canBackup: false, canReports: false,
        accessMode: 'dept_edit'
    },
    oc_swengr: {
        modules: modulesForDeptDesk('dept-swengr'),
        canEdit: true, canReleaseCut: false, canManageUsers: false, canBackup: false, canReports: false,
        accessMode: 'dept_edit'
    },
    oc_ictsec: {
        modules: modulesForDeptDesk('dept-ictsec'),
        canEdit: true, canReleaseCut: false, canManageUsers: false, canBackup: false, canReports: false,
        accessMode: 'dept_edit'
    },
    oc_itts: {
        modules: modulesForDeptDesk('dept-itts'),
        canEdit: true, canReleaseCut: false, canManageUsers: false, canBackup: false, canReports: false,
        accessMode: 'dept_edit'
    },
    oc_admin: {
        modules: modulesForDeptDesk('dept-admin', ['orderly-room']),
        canEdit: true, canReleaseCut: false, canManageUsers: false, canBackup: false, canReports: false,
        accessMode: 'dept_edit'
    },
    oc_gate: {
        modules: MODULES_RP,
        canEdit: true, canReleaseCut: false, canManageUsers: false, canBackup: false, canReports: false,
        accessMode: 'gate_edit'
    },
    viewer: {
        modules: [...MODULES_COMMON, 'reports-module', 'duties-roles'],
        canEdit: false, canReleaseCut: false, canManageUsers: false, canBackup: false, canReports: true,
        accessMode: 'viewer'
    }
};

function isStoresLedgerModule(moduleId) {
    return MODULES_STORES_LEDGERS.includes(moduleId) || String(moduleId || '').startsWith('gl-');
}

function createDefaultUsers() {
    return [
        { id: 'u-admin', username: 'admin', password: 'admin123', name: 'System Administrator', role: 'admin', department: 'IT DIR TECHSTORES OFFICE', active: true, mustChangePassword: false },
        { id: 'u-cmd', username: 'commander', password: 'cmd123', name: 'Army Commander', role: 'army_commander', department: "ZNA COMMANDER'S OFFICE", active: true, mustChangePassword: false },
        { id: 'u-briggs', username: 'briggs', password: 'gs123', name: 'Brigadier GS', role: 'brig_gs', department: 'GS BRANCH', active: true, mustChangePassword: false },
        { id: 'u-brigas', username: 'brigas', password: 'as123', name: 'Brigadier AS', role: 'brig_as', department: 'AS BRANCH', active: true, mustChangePassword: false },
        { id: 'u-brigqs', username: 'brigqs', password: 'qs123', name: 'Brigadier QS', role: 'brig_qs', department: 'QS BRANCH', active: true, mustChangePassword: false },
        { id: 'u-dir', username: 'dir', password: 'dir123', name: 'Director IT Dir', role: 'director', department: "IT DIR DIRECTOR'S OFFICE", active: true, mustChangePassword: false },
        { id: 'u-dd', username: 'dd', password: 'dd123', name: 'Deputy Director', role: 'deputy_director', department: "IT DIR DD'S OFFICE", active: true, mustChangePassword: false },
        { id: 'u-aqso2', username: 'aqso2', password: 'aqso2123', name: 'AQSO2', role: 'aqso2', department: "IT DIR AQSO2'S OFFICE", active: true, mustChangePassword: false },
        { id: 'u-aiad', username: 'aiad', password: 'aiad123', name: 'Director AIAD', role: 'dir_aiad', department: 'AIAD', active: true, mustChangePassword: false },
        { id: 'u-daf', username: 'daf', password: 'daf123', name: 'Director DAF', role: 'dir_daf', department: 'DAF', active: true, mustChangePassword: false },
        { id: 'u-dp', username: 'dp', password: 'dp123', name: 'Director DP', role: 'dir_dp', department: 'DP', active: true, mustChangePassword: false },
        { id: 'u-tso', username: 'tso', password: 'tso123', name: 'TechStores Officer', role: 'techstores_officer', department: 'IT DIR TECHSTORES OFFICE', active: true, mustChangePassword: false },
        { id: 'u-rq', username: 'rq', password: 'rq123', name: 'Regimental Quartermaster', role: 'rq', department: 'IT DIR TECHSTORES OFFICE', active: true, mustChangePassword: false },
        { id: 'u-store', username: 'store', password: 'store123', name: 'Store Officer', role: 'store_officer', department: 'IT DIR TECHSTORES OFFICE', active: true, mustChangePassword: false },
        { id: 'u-orderly', username: 'orderly', password: 'orderly123', name: 'Chief Clerk / Orderly Room', role: 'orderly_clerk', department: 'IT DIR ORDERLY ROOM', active: true, mustChangePassword: false },
        { id: 'u-storeman', username: 'storeman', password: 'storeman123', name: 'Storeman', role: 'storeman', department: 'IT DIR TECHSTORES OFFICE', active: true, mustChangePassword: false },
        { id: 'u-rp', username: 'rp', password: 'rp123', name: 'RP Gate', role: 'rp', department: 'IT DIR GATE / RP', active: true, mustChangePassword: false },
        { id: 'u-workshop', username: 'workshop', password: 'workshop123', name: 'Workshop NCO', role: 'workshop', department: 'IT ENGINEERING SUPPORT DEPT (WORKSHOP)', active: true, mustChangePassword: false },
        { id: 'u-sysadmin', username: 'sysadmin', password: 'sysadmin123', name: 'OC Systems Administration', role: 'oc_sysadmin', department: 'IT DIR SYSTEMS ADMINISTRATION DEPT', active: true, mustChangePassword: false },
        { id: 'u-dba', username: 'dba', password: 'dba123', name: 'OC Computer Engineering / DBA', role: 'oc_compengr', department: 'IT DIR COMPUTER ENGINEERING DEPT', active: true, mustChangePassword: false },
        { id: 'u-swengr', username: 'swengr', password: 'swengr123', name: 'OC Software Engineering', role: 'oc_swengr', department: 'IT DIR SOFTWARE ENGINEERING DEPT', active: true, mustChangePassword: false },
        { id: 'u-ictsec', username: 'ictsec', password: 'ictsec123', name: 'OC ICT Security', role: 'oc_ictsec', department: 'IT DIR ICT SECURITY DEPT', active: true, mustChangePassword: false },
        { id: 'u-itts', username: 'itts', password: 'itts123', name: 'OC ITTS', role: 'oc_itts', department: 'ITTS (INFORMATION TECHNOLOGY TRAINING SCHOOL)', active: true, mustChangePassword: false },
        { id: 'u-ao', username: 'ao', password: 'ao123', name: 'Admin Office / AO', role: 'oc_admin', department: 'IT DIR ADMIN OFFICE', active: true, mustChangePassword: false },
        { id: 'u-gate', username: 'gate', password: 'gate123', name: 'Gate Desk', role: 'oc_gate', department: 'IT DIR GATE / RP', active: true, mustChangePassword: false },
        { id: 'u-viewer', username: 'viewer', password: 'view123', name: 'Read Only Viewer', role: 'viewer', department: 'IT DIR TECHSTORES OFFICE', active: true, mustChangePassword: false }
    ];
}

/**
 * Map friendly login labels → real usernames (case / spaces ignored).
 * Example: "RP Gate" → "rp"
 */
const LOGIN_USERNAME_ALIASES = {
    'rp gate': 'rp',
    'rpgate': 'rp',
    'rp_gate': 'rp',
    'regimental police': 'rp',
    'gate desk': 'gate',
    'gate rp': 'gate',
    'gaterp': 'gate'
};

/** Extra passwords accepted for a resolved username (demo convenience). */
const LOGIN_PASSWORD_ALIASES = {
    rp: ['rp123', 'rpgate123', 'rp gate123'],
    gate: ['gate123', 'rpgate123', 'rp gate123']
};

function normalizeLoginKey(value) {
    return String(value || '')
        .trim()
        .toLowerCase()
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ');
}

function resolveLoginUsername(username) {
    const raw = String(username || '').trim();
    if (!raw) return '';
    const key = normalizeLoginKey(raw);
    const compact = key.replace(/\s+/g, '');
    if (LOGIN_USERNAME_ALIASES[key]) return LOGIN_USERNAME_ALIASES[key];
    if (LOGIN_USERNAME_ALIASES[compact]) return LOGIN_USERNAME_ALIASES[compact];
    return raw;
}

function passwordMatchesLogin(username, password) {
    const pwd = String(password || '').trim();
    const userKey = String(username || '').trim().toLowerCase();
    const aliases = LOGIN_PASSWORD_ALIASES[userKey];
    if (!aliases) return false;
    const norm = normalizeLoginKey(pwd).replace(/\s+/g, '');
    return aliases.some((a) => normalizeLoginKey(a).replace(/\s+/g, '') === norm);
}

/** Merge any missing seed accounts into an existing users list (by username). */
function ensureSeedUsersPresent(users) {
    const list = Array.isArray(users) ? users.slice() : [];
    const defaults = createDefaultUsers();
    defaults.forEach((seed) => {
        if (!list.some((u) => String(u.username || '').toLowerCase() === seed.username.toLowerCase())) {
            list.push({ ...seed });
        }
    });
    return list;
}

const GL_ACCOUNTS = {
    '6122100009': { defaultBudget: 50000, colorVar: '--gl-6122100009', name: 'Office Supplies & Services (ZOFF)' },
    '2200600002': { defaultBudget: 50000, colorVar: '--gl-2200600002', name: 'Computer Consumables (legacy)' },
    '2200600003': { defaultBudget: 25000, colorVar: '--gl-2200600003', name: 'Software Licenses' },
    '220200002': { defaultBudget: 35000, colorVar: '--gl-220200002', name: 'Tech Equipment Maintenance' },
    '2201900002': { defaultBudget: 20000, colorVar: '--gl-2201900002', name: 'Spare Parts' },
    '3112210001': { defaultBudget: 100000, colorVar: '--gl-3112210001', name: 'ICT Equipment' }
};

const VOUCHER_ROW_LAYOUT = {
    hasCategory: {
        category: 1, item: 2, desc: 3, qty: 4, uom: 5, gl: 6,
        unitCost: 7, lineTotal: 8, rvIv: 9, purchase: 10, supplied: 11, issued: 12, initials: 13
    },
    hasGl: {
        category: -1, item: 1, desc: 2, qty: 3, uom: 4, gl: 5,
        unitCost: 6, lineTotal: 7, rvIv: 8, purchase: 9, supplied: 10, issued: 11, initials: 12
    },
    legacy: {
        category: -1, item: 1, desc: 2, qty: 3, uom: 4, gl: -1,
        unitCost: -1, lineTotal: -1, rvIv: 5, purchase: 6, supplied: 7, issued: 8, initials: 9
    }
};

/* VOUCHER_INVENTORY_CATEGORIES is defined from the IT Directorate catalog in catalog.js */

const MODULE_IDS = [
    'gl-2200600002', 'gl-2200600003', 'gl-220200002', 'gl-2201900002', 'gl-3112210001',
    'voucher-module', 'stock-take', 'unit-checks', 'financial-year-bids', 'unit-equipment', 'ict-accountability', 'ict-distribution', 'temporary-loans',
    'monthly-returns',
    'spec-evaluation', 'dp-f1-form', 'cost-comparative-schedule', 'dp-procurement', 'zna-q-982', 'zna-q-178', 'zna-q-1033', 'zna-q-1043',
    'zna-q-80', 'zna-svcs-890', 'zna-q-1179', 'zna-q-987', 'zna-q-3977', 'zna-svcs-1045', 'zna-q-1157',
    'zna-q-985', 'zna-q-1', 'zna-q-998', 'zna-q-1680',
    'zna-q-forms-index', 'zna-q-3', 'zna-q-31', 'zna-q-40', 'zna-q-1049', 'zna-q-1229', 'zna-q-1571', 'zna-q-1954',
    'accommodation-stores',
    'delivery-note', 'purchase-orders', 'workshop-repairs', 'gate-register', 'techstores-equipment-register', 'suppliers-contracts',
    'orderly-room', 'it-dir-comms', 'duties-roles', 'process-guides', 'system-help', 'reports-module', 'user-management', 'release-cut'
];

const ROW_BUILDERS = {
    'gl-2200600002-table-body': () => buildGl2200600002Row(),
    'gl-2200600003-table-body': () => buildStockLedgerRow(),
    'gl-220200002-table-body': () => buildJobCardRow(),
    'gl-2201900002-table-body': () => buildStockLedgerRow(),
    'gl-3112210001-table-body': () => buildStockLedgerRow(),
    'voucher-table-body': () => buildVoucherRow(),
    'bids-table-body': () => buildBidRow(),
    'unit-equipment-table-body': () => buildUnitEquipmentRow(),
    'loans-table-body': () => buildLoanRow(),
    'spec-eval-table-body': () => buildSpecEvalRow(),
    'dp-f1-table-body': () => buildDPF1Row(),
    'zna-q-982-table-body': () => buildZnaQ982Row(),
    'zna-q-178-table-body': () => buildZnaQ178Row(),
    'zna-q-1033-table-body': () => buildZnaQ1033Row(),
    'zna-q-1043-table-body': () => buildZnaQ1043Row(),
    'zna-q-80-table-body': () => buildZnaQ80Row(),
    'zna-svcs-890-table-body': () => buildZnaSvcs890Row(),
    'zna-q-1179-table-body': () => buildZnaQ1179Row(),
    'zna-q-987-table-body': () => buildZnaQ987Row(),
    'zna-svcs-1045-table-body': () => buildZnaSvcs1045Row(),
    'zna-q-1157-table-body': () => buildZnaQ1157Row(),
    'zna-q-985-table-body': () => buildZnaQ985Row(),
    'zna-q-1-table-body': () => buildZnaQ1Row(),
    'zna-q-998-table-body': () => buildZnaQ998Row(),
    'zna-q-1680-table-body': () => buildZnaQ1680Row(),
    'zna-q-3-table-body': () => buildZnaQ3Row(),
    'zna-q-31-table-body': () => buildZnaQ31Row(),
    'zna-q-40-table-body': () => buildZnaQ40Row(),
    'zna-q-1049-table-body': () => buildZnaQ1049Row(),
    'zna-q-1229-table-body': () => buildZnaQ1229Row(),
    'zna-q-1571-table-body': () => buildZnaQ1571Row(),
    'zna-q-1954-table-body': () => buildZnaQ1954Row(),
    'accommodation-stores-table-body': () => buildAccommodationStoreRow(),
    'delivery-table-body': () => buildDeliveryRow(),
    'purchase-orders-table-body': () => buildPurchaseOrderRow(),
    'purchase-orders-lines-body': () => buildPurchaseOrderLineRow(),
    'workshop-repairs-table-body': () => buildWorkshopRepairRow(),
    'gate-register-table-body': () => buildEquipmentCustodyRow(),
    'techstores-equipment-register-table-body': () => buildEquipmentCustodyRow(),
    'suppliers-table-body': () => buildSupplierRow()
};

const STOCK_LEDGER_TBODY_IDS = [
    'gl-2200600003-table-body',
    'gl-2201900002-table-body',
    'gl-3112210001-table-body'
];
