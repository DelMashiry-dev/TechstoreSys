/* commander-demo-pack.js — realistic demonstration figures (opt-in, admin-gated) */

const DEMO_PACK_VERSION = 3;

/**
 * FY 2026 IT Dir Bids — SUMMARY sheet totals from
 * `IT DIR BIDS 2026 GS JM26.xlsx` (experimental demo allocation).
 * Excel GL 2200600002 → system ZOFF 6122100009
 * Excel GL 2202000002 + 2202000004 → system Maint 220200002
 * Excel ICT 3112210001 includes HRMS add-on line.
 */
const DEMO_FY2026_BID_BUDGETS = {
    '6122100009': 3644610,  // Consumables / ZOFF
    '2200600002': 3644610,  // legacy consumables alias
    '2200600003': 2554250,  // Software licences
    '220200002': 503000,    // Tech eqpt maint 488000 + office maint 15000
    '2201900002': 456630,   // Parts / spares
    '3112210001': 5169660   // ICT equipment 4516980 + HRMS 652680
};

const DEMO_BIDS_SOURCE = {
    file: 'IT DIR BIDS 2026 GS JM26.xlsx',
    sheet: 'SUMMARY',
    grantTotalUsd: 12328150,
    note: 'Experimental demo — FY bid SUMMARY allocated to GL accounts; monthly DAF ≈ FY ÷ 12.'
};

function demoMonthlyFromFy(fyAmount) {
    return Math.round((Number(fyAmount) || 0) / 12);
}

function demoIsoDaysAgo(days) {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() - days);
    return d.toISOString().slice(0, 10);
}

function demoIsoDaysFromNow(days) {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
}

function demoYm() {
    if (typeof currentYmIso === 'function') return currentYmIso();
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`;
}

function demoCell(tag, type, value) {
    if (tag === 'select') {
        return { tag: 'select', value: value == null ? '' : String(value), selectedIndex: 0 };
    }
    return { tag: 'input', type: type || 'text', value: value == null ? '' : String(value) };
}

function demoLoanRow({
    loanDate, za, item, desc, qty = 1, uom = 'ea',
    issuedTo, forceNo, unit, expected, returned = '', issuedBy, initials
}) {
    return {
        cells: [
            demoCell('input', 'date', loanDate),
            demoCell('input', 'text', za),
            demoCell('input', 'text', item),
            demoCell('input', 'text', desc),
            demoCell('input', 'number', qty),
            demoCell('input', 'text', uom),
            demoCell('input', 'text', issuedTo),
            demoCell('input', 'text', forceNo),
            demoCell('select', '', unit),
            demoCell('input', 'date', expected),
            demoCell('input', 'date', returned),
            demoCell('input', 'text', issuedBy),
            demoCell('input', 'text', initials)
        ]
    };
}

function demoPoRegisterRow({ date, poNo, supplier, gl, amount, vendor, signature }) {
    return {
        cells: [
            demoCell('input', 'date', date),
            demoCell('input', 'text', supplier),
            demoCell('input', 'text', poNo),
            demoCell('input', 'number', amount),
            demoCell('select', '', gl),
            demoCell('input', 'text', vendor || ''),
            demoCell('input', 'text', signature || '')
        ]
    };
}

function demoPoLineRow({ item, material, qty, unit = 'each', desc, price, net }) {
    return {
        cells: [
            demoCell('input', 'text', item),
            demoCell('input', 'text', material),
            demoCell('input', 'number', qty),
            demoCell('input', 'text', unit),
            demoCell('input', 'text', desc),
            demoCell('input', 'number', price),
            demoCell('input', 'number', net)
        ]
    };
}

/** @deprecated legacy demo row — migrated to register on restore */
function demoPoRow({ date, poNo, supplier, item, qty, gl, amount, unitCost, delivery, remarks }) {
    return demoPoRegisterRow({
        date, poNo, supplier, gl, amount,
        vendor: delivery, signature: remarks
    });
}

function demoGateRow({
    dateIn, equipmentType, serialOrZa, unit, receivedBy, remark,
    dateOut = '', number = '', rank = '', name = '', signature = '', svcs1045 = ''
}) {
    return {
        cells: [
            demoCell('input', 'date', dateIn),
            demoCell('input', 'text', equipmentType),
            demoCell('input', 'text', serialOrZa),
            demoCell('input', 'text', unit),
            demoCell('input', 'text', receivedBy),
            demoCell('input', 'text', remark),
            demoCell('input', 'date', dateOut),
            demoCell('input', 'text', number),
            demoCell('input', 'text', rank),
            demoCell('input', 'text', name),
            demoCell('input', 'text', signature),
            demoCell('input', 'text', svcs1045)
        ]
    };
}

/** Voucher row — hasCategory layout (date + category select + …). */
function demoVoucherRow({
    date, category, item, desc, qty, uom = 'EA', gl, unitCost, lineTotal, rvIv = 'IV'
}) {
    const total = lineTotal != null ? lineTotal : (Number(qty) || 0) * (Number(unitCost) || 0);
    return {
        cells: [
            demoCell('input', 'date', date),
            demoCell('select', '', category),
            demoCell('input', 'text', item),
            demoCell('input', 'text', desc),
            demoCell('input', 'number', qty),
            demoCell('input', 'text', uom),
            demoCell('select', '', gl),
            demoCell('input', 'number', unitCost),
            demoCell('input', 'number', total),
            demoCell('input', 'text', rvIv),
            demoCell('input', 'text', ''),
            demoCell('input', 'text', ''),
            demoCell('input', 'text', ''),
            demoCell('input', 'text', 'ST')
        ]
    };
}

function demoStockTxn({ date, type, itemId, category, item, qty, gl, party, sourceRef }) {
    return {
        id: `stk-demo-${type}-${itemId}-${qty}`,
        date,
        type,
        itemId,
        category,
        item,
        description: 'Demonstration demonstration stock movement',
        qty: Number(qty) || 0,
        uom: 'EA',
        gl: gl || '',
        voucherNo: sourceRef || '',
        party: party || 'IT Dir TechStores',
        source: 'demo-pack',
        sourceRef: sourceRef || `DEMO/${type.toUpperCase()}`,
        by: 'Demo Pack',
        createdAt: `${date}T10:00:00.000Z`,
        demoSeed: true
    };
}

function demoOfficeMessage(partial) {
    const id = partial.id || `om-demo-${Math.random().toString(36).slice(2, 8)}`;
    const fromUserId = partial.fromUserId || 'u-orderly';
    return {
        id,
        toDepartment: partial.toDepartment,
        toKind: partial.toKind || 'it_dir_dept',
        toLabel: partial.toLabel || partial.toDepartment,
        subject: partial.subject,
        body: partial.body,
        priority: partial.priority || 'normal',
        messageDate: partial.messageDate || demoIsoDaysAgo(1),
        dueDate: partial.dueDate || '',
        fromUserId,
        fromName: partial.fromName || 'Chief Clerk / Orderly Room',
        fromRole: partial.fromRole || 'orderly_clerk',
        fromRoleLabel: partial.fromRoleLabel || 'Orderly Room',
        fromOffice: partial.fromOffice || 'IT DIR ORDERLY ROOM',
        createdAt: partial.createdAt || `${demoIsoDaysAgo(1)}T15:23:00.000Z`,
        readBy: partial.readBy || { [fromUserId]: `${demoIsoDaysAgo(1)}T15:23:00.000Z` },
        demoSeed: true
    };
}

function demoSeedGlTargets(ym) {
    const fy = DEMO_FY2026_BID_BUDGETS;
    const targets = {
        '6122100009': demoMonthlyFromFy(fy['6122100009']),
        '2200600002': demoMonthlyFromFy(fy['2200600002']),
        '2200600003': demoMonthlyFromFy(fy['2200600003']),
        '220200002': demoMonthlyFromFy(fy['220200002']),
        '2201900002': demoMonthlyFromFy(fy['2201900002']),
        '3112210001': demoMonthlyFromFy(fy['3112210001'])
    };

    appState.glBudgets = {
        ...(appState.glBudgets || {}),
        ...fy
    };

    if (typeof ensureGlMonthlyTargets === 'function') ensureGlMonthlyTargets();
    appState.glMonthlyTargets[ym] = {
        ...(appState.glMonthlyTargets[ym] || {}),
        ...targets,
        _daf: {
            source: 'DAF',
            ref: `DAF/IT/${ym.replace('-', '')}/BIDS26`,
            receivedDate: demoIsoDaysAgo(5),
            notes: `Demo vote from ${DEMO_BIDS_SOURCE.file} · ${DEMO_BIDS_SOURCE.sheet} (FY ÷ 12). Grant total USD ${DEMO_BIDS_SOURCE.grantTotalUsd.toLocaleString()}.`
        }
    };
    appState.glTargetViewMonth = ym;

    Object.entries(targets).forEach(([gl, amount]) => {
        if (typeof setGlMonthlyTarget === 'function') setGlMonthlyTarget(gl, amount, ym);
        else appState.glMonthlyTargets[ym][gl] = amount;
    });

    const monthEl = document.getElementById('glTargetMonth');
    if (monthEl) monthEl.value = ym;
    if (typeof setSelectedGlTargetMonth === 'function') setSelectedGlTargetMonth(ym);
    if (typeof saveMonthDafMeta === 'function') {
        saveMonthDafMeta(appState.glMonthlyTargets[ym]._daf, ym);
    }
    const ref = document.getElementById('dafTargetRef');
    const received = document.getElementById('dafTargetReceived');
    const notes = document.getElementById('dafTargetNotes');
    if (ref) ref.value = appState.glMonthlyTargets[ym]._daf.ref;
    if (received) received.value = appState.glMonthlyTargets[ym]._daf.receivedDate;
    if (notes) notes.value = appState.glMonthlyTargets[ym]._daf.notes;

    document.querySelectorAll('input[data-gl-target]').forEach((input) => {
        const gl = input.getAttribute('data-gl-target');
        if (targets[gl] != null) input.value = String(targets[gl]);
    });
}

function demoSeedInventory() {
    if (typeof applyPhysicalStockCount20260731 === 'function') {
        applyPhysicalStockCount20260731({ force: true });
    }
    const inv = typeof ensureStoresInventory === 'function'
        ? ensureStoresInventory()
        : (appState.storesInventory = appState.storesInventory || { openings: {}, transactions: [] });
    if (!inv.openings) inv.openings = {};
    inv.ledgerMode = 'perpetual';
    if (!inv.balanceView) inv.balanceView = 'daily';

    // Item-level openings (roll into parent ledgers via catalog / sourceKeys)
    Object.assign(inv.openings, {
        'consumables-toners__hp-cf226a-toner': 18,
        'consumables-toners__canon-exv54-black': 8,
        'consumables-toners__hp-ce280a-toner': 6,
        'custom__inv-usb__sandisk-32g-usb-memory-stick': 42,
        'custom__inv-tablets__samsung-galaxy-tab-s11': 5,
        'ict-equipment__canon-imagerunner-c3025i': 1,
        'ict-equipment__hp-omnibook-x-flip-16': 1,
        // Legacy category-level openings (fill empty parent cards)
        'inv-softwares': 36,
        'inv-spares': 54,
        'inv-maintenance': 22,
        'inv-desktops': 9,
        'inv-printers': 7,
        'inv-projectors': 4,
        'inv-smartboards': 2
    });

    // Drop prior demo txns then add receipts / issues
    inv.transactions = (inv.transactions || []).filter((t) => !t.demoSeed && !String(t.id || '').startsWith('stk-demo-'));
    const txns = [
        demoStockTxn({
            date: demoIsoDaysAgo(10), type: 'receipt', itemId: 'consumables-toners__hp-cf226a-toner',
            category: 'inv-toner', item: 'HP CF226A / 26A toner', qty: 20, gl: '6122100009',
            party: 'TechWorld Harare', sourceRef: 'RV/IT/0826/014'
        }),
        demoStockTxn({
            date: demoIsoDaysAgo(4), type: 'issue', itemId: 'consumables-toners__hp-cf226a-toner',
            category: 'inv-toner', item: 'HP CF226A / 26A toner', qty: 6, gl: '6122100009',
            party: 'HQ printers', sourceRef: 'IV/IT/0826/031'
        }),
        demoStockTxn({
            date: demoIsoDaysAgo(8), type: 'receipt', itemId: 'custom__inv-usb__sandisk-32g-usb-memory-stick',
            category: 'inv-usb', item: 'SanDisk 32G USB Memory stick', qty: 30, gl: '6122100009',
            party: 'ICT Hub', sourceRef: 'RV/IT/0826/018'
        }),
        demoStockTxn({
            date: demoIsoDaysAgo(3), type: 'issue', itemId: 'custom__inv-usb__sandisk-32g-usb-memory-stick',
            category: 'inv-usb', item: 'SanDisk 32G USB Memory stick', qty: 12, gl: '6122100009',
            party: 'ITTS course', sourceRef: 'IV/IT/0826/040'
        }),
        demoStockTxn({
            date: demoIsoDaysAgo(12), type: 'receipt', itemId: 'inv-softwares',
            category: 'inv-softwares', item: 'Microsoft 365 Apps seats', qty: 25, gl: '2200600003',
            party: 'SoftServe ZW', sourceRef: 'RV/IT/0826/009'
        }),
        demoStockTxn({
            date: demoIsoDaysAgo(5), type: 'issue', itemId: 'inv-softwares',
            category: 'inv-softwares', item: 'Microsoft 365 Apps seats', qty: 10, gl: '2200600003',
            party: 'Sys Admin dept', sourceRef: 'IV/IT/0826/022'
        }),
        demoStockTxn({
            date: demoIsoDaysAgo(9), type: 'receipt', itemId: 'inv-spares',
            category: 'inv-spares', item: 'Laptop fan / RJ45 mix', qty: 40, gl: '2201900002',
            party: 'Parts Depot', sourceRef: 'RV/IT/0826/011'
        }),
        demoStockTxn({
            date: demoIsoDaysAgo(2), type: 'issue', itemId: 'inv-spares',
            category: 'inv-spares', item: 'Laptop fan / RJ45 mix', qty: 8, gl: '2201900002',
            party: 'Workshop', sourceRef: 'IV/IT/0826/044'
        }),
        demoStockTxn({
            date: demoIsoDaysAgo(11), type: 'receipt', itemId: 'inv-maintenance',
            category: 'inv-maintenance', item: 'UPS battery kits', qty: 12, gl: '220200002',
            party: 'PowerTech', sourceRef: 'RV/IT/0826/007'
        }),
        demoStockTxn({
            date: demoIsoDaysAgo(6), type: 'issue', itemId: 'inv-maintenance',
            category: 'inv-maintenance', item: 'UPS battery kits', qty: 3, gl: '220200002',
            party: 'Server room', sourceRef: 'IV/IT/0826/028'
        }),
        demoStockTxn({
            date: demoIsoDaysAgo(14), type: 'receipt', itemId: 'ict-equipment__dell-latitude-5540',
            category: 'ict-equipment', item: 'Dell Latitude 5540', qty: 8, gl: '3112210001',
            party: 'ICT Hub', sourceRef: 'RV/IT/0826/003'
        }),
        demoStockTxn({
            date: demoIsoDaysAgo(7), type: 'issue', itemId: 'ict-equipment__dell-latitude-5540',
            category: 'ict-equipment', item: 'Dell Latitude 5540', qty: 3, gl: '3112210001',
            party: '1 Inf Bde', sourceRef: 'IV/IT/0826/019'
        }),
        demoStockTxn({
            date: demoIsoDaysAgo(13), type: 'receipt', itemId: 'custom__inv-tablets__samsung-galaxy-tab-s11',
            category: 'inv-tablets', item: 'Samsung Galaxy Tab S11', qty: 4, gl: '3112210001',
            party: 'Mobile stores', sourceRef: 'RV/IT/0826/005'
        }),
        demoStockTxn({
            date: demoIsoDaysAgo(1), type: 'issue', itemId: 'custom__inv-tablets__samsung-galaxy-tab-s11',
            category: 'inv-tablets', item: 'Samsung Galaxy Tab S11', qty: 1, gl: '3112210001',
            party: 'Dir AIAD visit', sourceRef: 'IV/IT/0826/051'
        }),
        demoStockTxn({
            date: demoIsoDaysAgo(16), type: 'receipt', itemId: 'ict-equipment__canon-imagerunner-c3025i',
            category: 'inv-printers', item: 'Canon imageRUNNER C3025i', qty: 1, gl: '3112210001',
            party: 'Canon / ICT Hub', sourceRef: 'RV/IT/0826/002'
        }),
        demoStockTxn({
            date: demoIsoDaysAgo(15), type: 'receipt', itemId: 'ict-equipment__hp-omnibook-x-flip-16',
            category: 'inv-laptops', item: 'HP OmniBook X Flip 16 AI (Intel Core Ultra 9)', qty: 1, gl: '3112210001',
            party: 'HP / ICT Hub', sourceRef: 'RV/IT/0826/006'
        })
    ];
    inv.transactions.push(...txns);

    if (typeof applyInventoryRefreshAug2026 === 'function') {
        applyInventoryRefreshAug2026({ force: true });
    }
}

function demoSeedIctAccountability() {
    const make = (partial) => {
        if (typeof createIctAccountabilityRecord === 'function') {
            const rec = createIctAccountabilityRecord(partial);
            rec.demoSeed = true;
            return rec;
        }
        return { ...partial, id: partial.id || `icta-demo-${Math.random().toString(36).slice(2, 7)}`, demoSeed: true };
    };

    const keep = (Array.isArray(appState.ictAccountability) ? appState.ictAccountability : [])
        .filter((r) => !r.demoSeed);
    appState.ictAccountability = [
        make({
            id: 'icta-demo-za820',
            assetClass: 'equipment',
            designation: 'AIO Desktop HP EliteOne 840',
            zaNumber: 'ZA820',
            serialNo: 'CN8A2041',
            status: 'issued',
            engraved: true,
            holderName: 'WO1 Chikore',
            forceNo: '61502',
            unit: 'IT Dir Systems Admin',
            inventoryLedger: 'inv-desktops',
            glCharge: '3112210001',
            issueDate: demoIsoDaysAgo(6),
            receivedDate: demoIsoDaysAgo(40),
            purchaseDate: demoIsoDaysAgo(120),
            initialValue: 1850
        }),
        make({
            id: 'icta-demo-za300',
            assetClass: 'equipment',
            designation: 'Projector Epson EB-X06',
            zaNumber: 'ZA300',
            serialNo: 'X06-9921',
            status: 'on_loan',
            engraved: true,
            holderName: 'Capt N. Moyo',
            forceNo: '72841',
            unit: '1 Inf Bde',
            inventoryLedger: 'inv-projectors',
            glCharge: '3112210001',
            issueDate: demoIsoDaysAgo(22),
            receivedDate: demoIsoDaysAgo(90),
            initialValue: 620
        }),
        make({
            id: 'icta-demo-za912',
            assetClass: 'equipment',
            designation: 'Laptop Dell Latitude 5540',
            zaNumber: 'ZA912',
            serialNo: 'CN8934',
            status: 'unserviceable',
            engraved: true,
            holderName: 'Workshop',
            unit: 'IT Dir Comp Engr',
            inventoryLedger: 'inv-laptops',
            glCharge: '3112210001',
            receivedDate: demoIsoDaysAgo(2),
            usReason: 'beyond_economic',
            initialValue: 1400,
            repairCost: 720,
            form1045Ref: 'SVCS1045/IT/0826/12'
        }),
        make({
            id: 'icta-demo-za938',
            assetClass: 'equipment',
            designation: 'Laptop HP EliteBook 840',
            zaNumber: 'ZA938',
            serialNo: '938',
            status: 'unserviceable',
            engraved: true,
            holderName: 'T Gahadza',
            forceNo: '',
            unit: 'IT Dir Systems Admin',
            inventoryLedger: 'inv-laptops',
            glCharge: '3112210001',
            issueDate: '2020-07-16',
            receivedDate: '2020-07-10',
            usReason: 'beyond_economic',
            initialValue: 1200,
            repairCost: 550
        }),
        make({
            id: 'icta-demo-za875',
            assetClass: 'equipment',
            designation: 'Laptop Lenovo ThinkPad T480',
            zaNumber: 'ZA875',
            serialNo: '875',
            status: 'issued',
            engraved: true,
            holderName: 'AT Muzondo',
            unit: 'IT Dir Systems Dev',
            inventoryLedger: 'inv-laptops',
            glCharge: '3112210001',
            issueDate: '2022-07-22',
            receivedDate: '2022-07-15',
            initialValue: 1350
        }),
        make({
            id: 'icta-demo-za696a',
            assetClass: 'equipment',
            designation: 'Laptop Dell Latitude 5490',
            zaNumber: 'ZA696',
            serialNo: '696',
            status: 'unserviceable',
            engraved: true,
            holderName: 'C Batahana',
            unit: 'IT Dir DBA',
            inventoryLedger: 'inv-laptops',
            glCharge: '3112210001',
            issueDate: '2020-07-16',
            usReason: 'beyond_economic',
            initialValue: 1100,
            repairCost: 480
        }),
        make({
            id: 'icta-demo-za684b',
            assetClass: 'equipment',
            designation: 'Laptop HP ProBook 450',
            zaNumber: 'ZA684',
            serialNo: '684',
            status: 'unserviceable',
            engraved: true,
            holderName: 'C Batahana',
            unit: 'IT Dir DBA',
            inventoryLedger: 'inv-laptops',
            glCharge: '3112210001',
            issueDate: '2022-07-22',
            usReason: 'beyond_economic',
            initialValue: 1250,
            repairCost: 600
        }),
        make({
            id: 'icta-demo-sw-m365',
            assetClass: 'software',
            designation: 'Microsoft 365 Apps (IT Dir)',
            zaNumber: '',
            status: 'issued',
            unit: 'IT Dir',
            inventoryLedger: 'inv-softwares',
            glCharge: '2200600003',
            expiryDate: demoIsoDaysFromNow(45),
            renewalNotes: 'Renew via SoftServe — 25 seats',
            qty: 25
        }),
        make({
            id: 'icta-demo-sw-av',
            assetClass: 'software',
            designation: 'Endpoint antivirus suite',
            status: 'issued',
            unit: 'IT Dir ICT Security',
            inventoryLedger: 'inv-softwares',
            glCharge: '2200600003',
            expiryDate: demoIsoDaysFromNow(18),
            renewalNotes: 'Critical — renew before month end',
            qty: 120
        }),
        make({
            id: 'icta-demo-za441',
            assetClass: 'equipment',
            designation: 'Laptop Dell Latitude 5540',
            zaNumber: 'ZA441',
            status: 'in_stores',
            engraved: true,
            unit: 'IT Dir TechStores',
            inventoryLedger: 'inv-laptops',
            glCharge: '3112210001',
            receivedDate: demoIsoDaysAgo(3),
            initialValue: 1400
        }),
        ...keep
    ];
}

function demoSeedIctDistribution() {
    const row = (partial) => (typeof createIctDistRow === 'function'
        ? createIctDistRow(partial)
        : { id: `idr-demo-${Math.random().toString(36).slice(2, 6)}`, ...partial });

    const keep = (Array.isArray(appState.ictDistributionLists) ? appState.ictDistributionLists : [])
        .filter((e) => !e.demoSeed);

    const exercise = typeof createIctDistExercise === 'function'
        ? createIctDistExercise({
            id: 'idx-demo-laptops',
            title: 'Proposed distribution of laptops to IT Dir personnel',
            equipmentType: 'laptops',
            status: 'draft',
            proposed: [
                row({
                    rank: 'Maj', name: 'T Gahadza', appointment: 'OC Systems Admin',
                    initialIssue: '16/07/20', zaSerial: '938', remarks: 'u/s', needIssue: 'yes', linkedZa: 'ZA938'
                }),
                row({
                    rank: 'Capt', name: 'AT Muzondo', appointment: 'OC Systems Dev',
                    initialIssue: '22/07/22', zaSerial: '875', remarks: 's', needIssue: 'review', linkedZa: 'ZA875'
                }),
                row({
                    rank: 'WO2', name: 'C Batahana', appointment: 'DBA',
                    initialIssue: '16/07/20 and 22/07/22', zaSerial: '696 and 684', remarks: 'u/s', needIssue: 'yes', linkedZa: 'ZA696'
                }),
                row({
                    rank: 'Sgt', name: 'N Dube', appointment: 'Programmer',
                    initialIssue: 'NIL', zaSerial: 'NIL', remarks: 'u/s', needIssue: 'yes'
                })
            ],
            final: [
                row({
                    rank: 'Maj', name: 'T Gahadza', appointment: 'OC Systems Admin',
                    initialIssue: '16/07/20', zaSerial: '938', remarks: 'Core i9', needIssue: 'yes', linkedZa: 'ZA938'
                }),
                row({
                    rank: 'WO2', name: 'C Batahana', appointment: 'DBA',
                    initialIssue: '16/07/20 and 22/07/22', zaSerial: '696 and 684', remarks: 'Core i7', needIssue: 'yes', linkedZa: 'ZA696'
                })
            ],
            next: [
                row({
                    rank: 'Sgt', name: 'N Dube', appointment: 'Programmer',
                    initialIssue: 'NIL', zaSerial: 'NIL', remarks: 'Core i7', needIssue: 'yes'
                })
            ]
        })
        : {
            id: 'idx-demo-laptops',
            title: 'Proposed distribution of laptops to IT Dir personnel',
            equipmentType: 'laptops',
            status: 'draft',
            proposed: [],
            final: [],
            next: []
        };
    exercise.demoSeed = true;

    appState.ictDistributionLists = [exercise, ...keep];
    appState.ictDistributionActiveId = exercise.id;
}

/**
 * Apply realistic commander-demo figures into appState.
 * @param {{ force?: boolean, silent?: boolean }} opts
 */
function applyCommanderDemoPack(opts = {}) {
    if (!appState) {
        if (typeof showToast === 'function') showToast('System state not loaded yet.', 'error');
        return { ok: false, reason: 'no-state' };
    }
    if (typeof canEditData === 'function' && !canEditData()) {
        if (typeof showToast === 'function') {
            showToast('Log in as admin / RQ / storeman (edit role) to load demonstration figures.', 'error');
        }
        return { ok: false, reason: 'readonly' };
    }

    const force = !!opts.force;
    if (!force && appState.demoPack?.applied && appState.demoPack?.version === DEMO_PACK_VERSION) {
        if (typeof showToast === 'function') {
            showToast('Demonstration figures already loaded. Use “Reload demo figures” to refresh.', 'info');
        }
        return { ok: false, reason: 'already' };
    }

    const ym = demoYm();
    const today = demoIsoDaysAgo(0);

    demoSeedGlTargets(ym);
    demoSeedInventory();
    demoSeedIctAccountability();
    demoSeedIctDistribution();

    if (!appState.modules) appState.modules = {};

    // Temporary loans
    appState.modules['temporary-loans'] = {
        fields: [],
        tables: {
            'loans-table-body': [
                demoLoanRow({
                    loanDate: demoIsoDaysAgo(22), za: 'ZA300', item: 'Projector',
                    desc: 'Epson EB-X06 · briefing room loan', issuedTo: 'Capt N. Moyo',
                    forceNo: '72841', unit: '1 Inf Bde', expected: demoIsoDaysAgo(8),
                    issuedBy: 'Storeman TechStores', initials: 'ST'
                }),
                demoLoanRow({
                    loanDate: demoIsoDaysAgo(6), za: 'ZA820', item: 'AIO Desktop',
                    desc: 'HP EliteOne 840 G9', issuedTo: 'WO1 Chikore',
                    forceNo: '61502', unit: 'IT Dir Systems Admin', expected: demoIsoDaysFromNow(8),
                    issuedBy: 'RQ TechStores', initials: 'RQ'
                }),
                demoLoanRow({
                    loanDate: demoIsoDaysAgo(18), za: 'ZA441', item: 'Laptop',
                    desc: 'Dell Latitude 5540', issuedTo: 'Lt Sibanda',
                    forceNo: '80411', unit: 'HQ 3 Inf Bde', expected: demoIsoDaysAgo(4),
                    returned: demoIsoDaysAgo(3), issuedBy: 'Storeman TechStores', initials: 'ST'
                })
            ]
        },
        demoSeed: true
    };

    // Gate register
    appState.modules['gate-register'] = {
        fields: [],
        tables: {
            'gate-register-table-body': [
                demoGateRow({
                    dateIn: demoIsoDaysAgo(2), equipmentType: 'Laptop', serialOrZa: 'ZA912 / SN CN8934',
                    unit: 'IT Dir Comp Engr', receivedBy: 'RP Gate', remark: 'Repair — no power',
                    number: '55201', rank: 'Sgt', name: 'Dube', signature: 'Dube',
                    svcs1045: 'SVCS1045/IT/0826/12'
                }),
                demoGateRow({
                    dateIn: demoIsoDaysAgo(4), equipmentType: 'Desktop', serialOrZa: 'ZA188',
                    unit: 'ITTS', receivedBy: 'RP Gate', remark: 'Antivirus reload · returned',
                    dateOut: demoIsoDaysAgo(1), number: '44120', rank: 'Cpl', name: 'Ncube',
                    signature: 'Ncube', svcs1045: 'SVCS1045/IT/0726/88'
                })
            ]
        },
        demoSeed: true
    };

    // Purchase orders (commitments) — SAP-style electronic PO + register
    appState.modules['purchase-orders'] = {
        fields: [
            { tag: 'input', type: 'text', id: 'poSupplierName', value: 'DAMPACK ENTERPRISES (PVT) LTD' },
            { tag: 'textarea', type: '', id: 'poSupplierAddress', value: '' },
            { tag: 'input', type: 'text', id: 'poNumber', value: '4204004933' },
            { tag: 'input', type: 'date', id: 'poDate', value: '2024-05-14' },
            { tag: 'input', type: 'text', id: 'poVendorNo', value: '704196' },
            { tag: 'input', type: 'text', id: 'poDeliverTo', value: 'IT DIR / 04 731831' },
            { tag: 'input', type: 'date', id: 'poDeliveryDate', value: '2024-05-21' },
            { tag: 'input', type: 'text', id: 'poPaymentTerms', value: '' },
            { tag: 'select', type: '', id: 'poCurrency', value: 'ZiG' },
            { tag: 'select', type: '', id: 'poGl', value: '2200600002' },
            { tag: 'input', type: 'text', id: 'poSignature', value: '' }
        ],
        tables: {
            'purchase-orders-lines-body': [
                demoPoLineRow({
                    item: '00010', material: '117000042', qty: '20', unit: 'each',
                    desc: 'PRINTRONIX RIBBONS P8000/P7000 P/N 25504',
                    price: 3794.64, net: 75892.80
                })
            ],
            'purchase-orders-table-body': [
                demoPoRegisterRow({
                    date: '2024-05-14', poNo: '4204004933', supplier: 'DAMPACK ENTERPRISES (PVT) LTD',
                    gl: '2200600002', amount: 75892.80, vendor: '704196'
                }),
                demoPoRegisterRow({
                    date: demoIsoDaysAgo(9), poNo: 'PO/IT/0826/014', supplier: 'TechWorld Harare',
                    gl: '6122100009', amount: 42000, vendor: ''
                }),
                demoPoRegisterRow({
                    date: demoIsoDaysAgo(12), poNo: 'PO/IT/0826/009', supplier: 'SoftServe ZW',
                    gl: '2200600003', amount: 38500, vendor: ''
                }),
                demoPoRegisterRow({
                    date: demoIsoDaysAgo(7), poNo: 'PO/IT/0826/021', supplier: 'ICT Hub',
                    gl: '3112210001', amount: 95000, vendor: ''
                })
            ]
        },
        demoSeed: true
    };

    // Issue vouchers (charges buying power this month)
    appState.modules['voucher-module'] = {
        fields: [
            { tag: 'select', type: '', id: 'voucherType', value: 'iv' },
            { tag: 'input', type: 'date', id: 'voucherDate', value: demoIsoDaysAgo(3) },
            { tag: 'input', type: 'text', id: 'voucherNumber', value: 'IV/IT/0826/031' }
        ],
        tables: {
            'voucher-table-body': [
                demoVoucherRow({
                    date: demoIsoDaysAgo(3), category: 'inv-toner', item: 'HP CF226A toner',
                    desc: 'HQ printers top-up', qty: 40, gl: '6122100009', unitCost: 210, rvIv: 'IV'
                }),
                demoVoucherRow({
                    date: demoIsoDaysAgo(7), category: 'inv-laptops', item: 'HP Desktop Core i5',
                    desc: 'Issue to formations', qty: 8, gl: '3112210001', unitCost: 2000, rvIv: 'IV'
                }),
                demoVoucherRow({
                    date: demoIsoDaysAgo(5), category: 'inv-softwares', item: 'Windows / antivirus seats',
                    desc: 'Sys Admin dept', qty: 50, gl: '2200600003', unitCost: 175, rvIv: 'IV'
                })
            ]
        },
        demoSeed: true
    };

    // DP F1 estimated commitment
    appState.modules['dp-f1-form'] = {
        fields: [
            { tag: 'input', type: 'text', id: 'dpF1EstimatedCost', value: '85000' },
            { tag: 'select', type: '', id: 'dpF1Gl', value: '3112210001' },
            { tag: 'input', type: 'text', id: 'dpF1Title', value: 'Server / UPS tranche — Dir server room (bids ICT)' },
            { tag: 'input', type: 'date', id: 'dpF1Date', value: demoIsoDaysAgo(8) }
        ],
        tables: { 'dp-f1-table-body': [] },
        demoSeed: true
    };

    // Release Cut
    appState.releaseCuts = (Array.isArray(appState.releaseCuts) ? appState.releaseCuts : [])
        .filter((c) => !c.demoSeed);
    appState.releaseCuts.unshift({
        id: 'rc-demo-001',
        date: `${demoIsoDaysAgo(3)}T10:15:00.000Z`,
        fromGl: '3112210001',
        toGl: '6122100009',
        amount: 25000,
        reason: 'Demo — reallocate ICT bid vote to urgent toner buy',
        by: 'admin',
        demoSeed: true
    });

    // Office messages
    const keepMsg = (appState.officeMessages || []).filter((m) => !m.demoSeed);
    appState.officeMessages = [
        demoOfficeMessage({
            id: 'om-demo-tonners',
            toDepartment: 'IT DIR TECHSTORES OFFICE',
            toLabel: 'IT Dir TechStores',
            subject: 'OR DF: Letter — Request for Tonners',
            body: [
                'Orderly Room notification (Daily File).',
                'From unit: Orderly Room',
                'Ref: OR/DF/0826/03',
                'Subject: Request for Tonners',
                'Type: Unit Requisition',
                'Priority: URGENT',
                'GS auth: Pending',
                'Remarks: Attend immediately — HQ printers down.',
                'Please acknowledge under Notifications → Messages.'
            ].join('\n'),
            priority: 'urgent',
            messageDate: demoIsoDaysAgo(1),
            createdAt: `${demoIsoDaysAgo(1)}T15:23:00.000Z`
        }),
        demoOfficeMessage({
            id: 'om-demo-memo',
            toDepartment: 'IT DIR SYSTEMS ADMINISTRATION DEPT',
            toLabel: 'Systems Administrator',
            subject: 'INTERNAL MEMO — Patch window Fri 1800',
            body: 'Dir directed: freeze non-critical changes until Friday 1800hrs patch window. Confirm host list to TechStores by Thu 1200.',
            priority: 'high',
            messageDate: demoIsoDaysAgo(2),
            createdAt: `${demoIsoDaysAgo(2)}T09:10:00.000Z`,
            fromUserId: 'u-dir',
            fromName: 'Director IT',
            fromRole: 'director',
            fromRoleLabel: 'Director',
            fromOffice: "IT DIR DIRECTOR'S OFFICE",
            readBy: { 'u-dir': `${demoIsoDaysAgo(2)}T09:10:00.000Z` }
        }),
        demoOfficeMessage({
            id: 'om-demo-gate',
            toDepartment: 'IT DIR GATE / RP',
            toLabel: 'RP Gate',
            subject: 'Expect ICT returns — 2 × laptop',
            body: 'Two laptops due back from 1 Inf Bde this week. Record Date In / SVCS 1045 before release to Workshop.',
            priority: 'normal',
            messageDate: today,
            createdAt: `${today}T08:40:00.000Z`,
            fromUserId: 'u-rq',
            fromName: 'RQ TechStores',
            fromRole: 'rq',
            fromRoleLabel: 'RQ',
            fromOffice: 'IT DIR TECHSTORES OFFICE',
            readBy: { 'u-rq': `${today}T08:40:00.000Z` }
        }),
        ...keepMsg
    ];

    if (typeof ensureExampleMidLaptopRequisition === 'function') {
        ensureExampleMidLaptopRequisition();
    }

    appState.demoPack = {
        applied: true,
        version: DEMO_PACK_VERSION,
        appliedAt: new Date().toISOString(),
        appliedBy: (typeof currentUser !== 'undefined' && currentUser)
            ? (currentUser.username || currentUser.id || '')
            : 'system',
        label: 'FY 2026 Bids SUMMARY demo figures v3',
        bidsSource: DEMO_BIDS_SOURCE,
        fyBudgets: { ...DEMO_FY2026_BID_BUDGETS }
    };

    ['temporary-loans', 'gate-register', 'purchase-orders', 'voucher-module', 'dp-f1-form'].forEach((id) => {
        if (document.getElementById(id) && typeof restoreModule === 'function') {
            try { restoreModule(id, appState.modules[id]); } catch (e) { console.warn(e); }
        }
    });

    // Apply DP F1 live fields if form is in DOM
    const dpCost = document.getElementById('dpF1EstimatedCost');
    const dpGl = document.getElementById('dpF1Gl');
    if (dpCost) dpCost.value = '85000';
    if (dpGl) dpGl.value = '3112210001';
    const dpTitle = document.getElementById('dpF1Title');
    if (dpTitle) dpTitle.value = 'Server / UPS tranche — Dir server room (bids ICT)';

    if (typeof saveState === 'function') saveState();
    if (typeof updateDashboard === 'function') updateDashboard();
    else if (typeof updateSystemAlerts === 'function') updateSystemAlerts();
    if (typeof renderInventoryDashboard === 'function') renderInventoryDashboard();
    if (typeof refreshMailLayoutIfActive === 'function') refreshMailLayoutIfActive();
    if (typeof refreshOfficeMessagesUi === 'function') refreshOfficeMessagesUi();
    if (typeof renderIctAccountability === 'function') {
        try { renderIctAccountability(); } catch (_) { /* optional */ }
    }
    if (typeof refreshTemporaryLoansUi === 'function') {
        try { refreshTemporaryLoansUi(); } catch (_) { /* optional */ }
    }

    if (!opts.silent && typeof showToast === 'function') {
        showToast('Demo figures loaded from FY 2026 Bids SUMMARY — GL budgets, monthly targets, POs & vouchers.', 'success');
    }
    return { ok: true, month: ym };
}

function syncCommanderDemoPackButton() {
    const btn = document.getElementById('btnLoadDemoPack');
    if (!btn) return;
    const can = typeof canEditData === 'function' ? canEditData() : true;
    btn.hidden = !can;
    btn.textContent = appState?.demoPack?.applied ? 'Reload demo figures' : 'Load demo figures';
}

function wireCommanderDemoPackUi() {
    const btn = document.getElementById('btnLoadDemoPack');
    if (!btn) return;
    if (btn.dataset.demoWired !== '1') {
        btn.dataset.demoWired = '1';
        btn.addEventListener('click', () => {
            const already = !!(appState?.demoPack?.applied);
            const ok = window.confirm(
                already
                    ? 'Reload demonstration figures from FY 2026 Bids SUMMARY?\n\nRefreshes GL budgets/targets, stock, loans, gate, POs, vouchers, ZA register, and messages.'
                    : 'Load experimental demo figures from IT DIR BIDS 2026 GS JM26.xlsx (SUMMARY)?\n\nAllocates FY bid totals to ZOFF / Software / Maint / Spares / ICT and sets monthly DAF ≈ FY÷12.\n\nUse only on a demo / practice database.\n\nLog in as admin or RQ (edit role).'
            );
            if (!ok) return;
            applyCommanderDemoPack({ force: true });
            syncCommanderDemoPackButton();
        });
    }
    syncCommanderDemoPackButton();
}

window.applyCommanderDemoPack = applyCommanderDemoPack;
window.wireCommanderDemoPackUi = wireCommanderDemoPackUi;
window.syncCommanderDemoPackButton = syncCommanderDemoPackButton;
