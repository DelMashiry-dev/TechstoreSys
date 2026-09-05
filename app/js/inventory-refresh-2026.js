/* inventory-refresh-2026.js — strike Dell Latitude 5540; add ICT printers / laptops / desktops */

const INVENTORY_REFRESH_2026_KEY = 'inventoryRefresh_2026_08';

const STRIKE_OFF_DELL_5540 = {
    itemId: 'ict-equipment__dell-latitude-5540',
    name: 'Dell Latitude 5540',
    category: 'ict-equipment',
    gl: '3112210001',
    sourceRef: 'IV/IT/0826/STRIKE-5540',
    party: 'Struck off ledger — disposal / backload',
    description: 'Strike off Dell Latitude 5540 from ICT stores ledger'
};

const INVENTORY_REFRESH_RECEIPTS_2026 = [
    // Medium → heavy-duty printers (10)
    { itemId: 'ict-equipment__hp-laserjet-enterprise-m507dn', name: 'HP LaserJet Enterprise M507dn' },
    { itemId: 'ict-equipment__hp-laserjet-enterprise-mfp-m528dn', name: 'HP LaserJet Enterprise MFP M528dn' },
    { itemId: 'ict-equipment__hp-color-laserjet-enterprise-m554dn', name: 'HP Color LaserJet Enterprise M554dn' },
    { itemId: 'ict-equipment__canon-imagerunner-advance-dx-c3926i', name: 'Canon imageRUNNER ADVANCE DX C3926i' },
    { itemId: 'ict-equipment__canon-imagerunner-advance-dx-c5840i', name: 'Canon imageRUNNER ADVANCE DX C5840i' },
    { itemId: 'ict-equipment__xerox-altalink-c8155', name: 'Xerox AltaLink C8155' },
    { itemId: 'ict-equipment__kyocera-taskalfa-2554ci', name: 'Kyocera TASKalfa 2554ci' },
    { itemId: 'ict-equipment__hp-designjet-t650', name: 'HP DesignJet T650 (large format)' },
    { itemId: 'ict-equipment__epson-workforce-pro-wf-c5890', name: 'Epson WorkForce Pro WF-C5890' },
    { itemId: 'ict-equipment__brother-mfc-l8390cdw', name: 'Brother MFC-L8390CDW' },
    // Latest laptops (10)
    { itemId: 'ict-equipment__dell-latitude-7450', name: 'Dell Latitude 7450' },
    { itemId: 'ict-equipment__dell-latitude-5450', name: 'Dell Latitude 5450' },
    { itemId: 'ict-equipment__hp-elitebook-860-g11', name: 'HP EliteBook 860 G11' },
    { itemId: 'ict-equipment__hp-elitebook-x360', name: 'HP EliteBook x360' },
    { itemId: 'ict-equipment__lenovo-thinkpad-x1-carbon-gen-12', name: 'Lenovo ThinkPad X1 Carbon Gen 12' },
    { itemId: 'ict-equipment__lenovo-thinkpad-t14-gen-5', name: 'Lenovo ThinkPad T14 Gen 5' },
    { itemId: 'ict-equipment__apple-macbook-pro-14', name: 'Apple MacBook Pro 14' },
    { itemId: 'ict-equipment__microsoft-surface-laptop-7', name: 'Microsoft Surface Laptop 7' },
    { itemId: 'ict-equipment__hp-zbook-firefly', name: 'HP ZBook Firefly' },
    { itemId: 'ict-equipment__asus-expertbook-b9', name: 'ASUS ExpertBook B9' },
    // Latest desktops (10)
    { itemId: 'ict-equipment__hp-elitedesk-800-g9', name: 'HP EliteDesk 800 G9' },
    { itemId: 'ict-equipment__dell-optiplex-7020', name: 'Dell OptiPlex 7020' },
    { itemId: 'ict-equipment__dell-optiplex-7020-micro', name: 'Dell OptiPlex 7020 Micro' },
    { itemId: 'ict-equipment__lenovo-thinkcentre-m90q-gen-4', name: 'Lenovo ThinkCentre M90q Gen 4' },
    { itemId: 'ict-equipment__hp-prodesk-400-g9', name: 'HP ProDesk 400 G9' },
    { itemId: 'ict-equipment__dell-precision-3680-tower', name: 'Dell Precision 3680 Tower' },
    { itemId: 'ict-equipment__hp-elite-mini-800-g9', name: 'HP Elite Mini 800 G9' },
    { itemId: 'ict-equipment__lenovo-thinkcentre-m90a-gen-5-aio', name: 'Lenovo ThinkCentre M90a Gen 5 AIO' },
    { itemId: 'ict-equipment__apple-imac-24', name: 'Apple iMac 24' },
    { itemId: 'ict-equipment__apple-mac-mini-m4', name: 'Apple Mac mini (M4)' }
];

function computeItemOnHand(itemId) {
    const inv = typeof ensureStoresInventory === 'function'
        ? ensureStoresInventory()
        : (appState?.storesInventory || { openings: {}, transactions: [] });
    const opening = Number(inv.openings?.[itemId]) || 0;
    let received = 0;
    let issued = 0;
    (inv.transactions || []).forEach((t) => {
        if (t.itemId !== itemId) return;
        const qty = Number(t.qty) || 0;
        if (t.type === 'receipt') received += qty;
        else if (t.type === 'issue') issued += qty;
    });
    return opening + received - issued;
}

function inventoryRefreshTxnExists(sourceRef, itemId, type) {
    const inv = appState?.storesInventory || {};
    return (inv.transactions || []).some((t) =>
        t.source === 'inventory-refresh-2026'
        && t.sourceRef === sourceRef
        && t.itemId === itemId
        && t.type === type
    );
}

/**
 * Strike Dell Latitude 5540 and receive 30 new ICT catalog lines (10 printers, 10 laptops, 10 desktops).
 * @param {{ force?: boolean }} opts
 */
function applyInventoryRefreshAug2026(opts = {}) {
    if (!appState) return { ok: false, reason: 'no-state' };
    const force = !!opts.force;
    const inv = typeof ensureStoresInventory === 'function'
        ? ensureStoresInventory()
        : (appState.storesInventory = appState.storesInventory || { openings: {}, transactions: [] });
    if (!inv.openings) inv.openings = {};
    if (!Array.isArray(inv.transactions)) inv.transactions = [];

    if (!force && inv[INVENTORY_REFRESH_2026_KEY]?.applied) {
        return { ok: false, reason: 'already', summary: inv[INVENTORY_REFRESH_2026_KEY] };
    }

    const today = typeof todayIsoDate === 'function' ? todayIsoDate() : new Date().toISOString().slice(0, 10);
    const lines = [];
    let struck = 0;
    let received = 0;

    const strike = STRIKE_OFF_DELL_5540;
    const onHand = computeItemOnHand(strike.itemId);
    if (onHand > 0 && (force || !inventoryRefreshTxnExists(strike.sourceRef, strike.itemId, 'issue'))) {
        if (typeof postStockTransaction === 'function') {
            postStockTransaction({
                type: 'issue',
                itemId: strike.itemId,
                item: strike.name,
                category: strike.category,
                gl: strike.gl,
                qty: onHand,
                party: strike.party,
                description: strike.description,
                voucherNo: strike.sourceRef,
                source: 'inventory-refresh-2026',
                sourceRef: strike.sourceRef,
                date: today,
                silent: true,
                skipRender: true
            });
        } else {
            inv.transactions.push({
                id: `stk-refresh-strike-${Date.now()}`,
                date: today,
                type: 'issue',
                itemId: strike.itemId,
                category: strike.category,
                item: strike.name,
                description: strike.description,
                qty: onHand,
                uom: 'EA',
                gl: strike.gl,
                voucherNo: strike.sourceRef,
                party: strike.party,
                source: 'inventory-refresh-2026',
                sourceRef: strike.sourceRef,
                by: 'Inventory refresh',
                createdAt: new Date().toISOString()
            });
        }
        struck = onHand;
        lines.push(`Struck off ${onHand} × ${strike.name}`);
    } else if (onHand <= 0) {
        lines.push(`${strike.name} already at zero on hand`);
    }

    INVENTORY_REFRESH_RECEIPTS_2026.forEach((row, index) => {
        const sourceRef = `RV/IT/0826/REF-${String(index + 1).padStart(3, '0')}`;
        if (!force && inventoryRefreshTxnExists(sourceRef, row.itemId, 'receipt')) return;
        if (typeof postStockTransaction === 'function') {
            postStockTransaction({
                type: 'receipt',
                itemId: row.itemId,
                item: row.name,
                category: 'ict-equipment',
                gl: '3112210001',
                qty: 1,
                party: 'ICT procurement — stores receipt',
                description: 'Inventory refresh Aug 2026',
                voucherNo: sourceRef,
                source: 'inventory-refresh-2026',
                sourceRef,
                date: today,
                silent: true,
                skipRender: true
            });
        } else {
            inv.transactions.push({
                id: `stk-refresh-rcv-${index}-${Date.now()}`,
                date: today,
                type: 'receipt',
                itemId: row.itemId,
                category: 'ict-equipment',
                item: row.name,
                description: 'Inventory refresh Aug 2026',
                qty: 1,
                uom: 'EA',
                gl: '3112210001',
                voucherNo: sourceRef,
                party: 'ICT procurement — stores receipt',
                source: 'inventory-refresh-2026',
                sourceRef,
                by: 'Inventory refresh',
                createdAt: new Date().toISOString()
            });
        }
        received += 1;
        lines.push(`Received 1 × ${row.name}`);
    });

    inv[INVENTORY_REFRESH_2026_KEY] = {
        applied: true,
        appliedAt: new Date().toISOString(),
        struckOff: strike.name,
        struckQty: struck,
        receivedCount: received,
        lines
    };

    if (typeof saveState === 'function') saveState();
    if (typeof renderProductStockRegister === 'function') renderProductStockRegister();
    if (typeof renderVoucherInventoryTables === 'function') renderVoucherInventoryTables();
    if (typeof updateDashboard === 'function') updateDashboard();

    return { ok: true, struck, received, lines, summary: inv[INVENTORY_REFRESH_2026_KEY] };
}

window.applyInventoryRefreshAug2026 = applyInventoryRefreshAug2026;
window.INVENTORY_REFRESH_RECEIPTS_2026 = INVENTORY_REFRESH_RECEIPTS_2026;

const DL380_GEN11_RECEIPT = {
    itemId: 'ict-equipment__hpe-proliant-dl380-gen11',
    name: 'HPE ProLiant DL380 Gen11',
    sourceRef: 'RV/IT/0826/SRV-DL380-G11',
    source: 'inventory-receipt-dl380-g11'
};

/** Receipt HPE ProLiant DL380 Gen11 server (qty 1). Idempotent. */
function receiptDl380Gen11Server(opts = {}) {
    if (!appState) return { ok: false, reason: 'no-state' };
    const force = !!opts.force;
    const inv = typeof ensureStoresInventory === 'function'
        ? ensureStoresInventory()
        : (appState.storesInventory = appState.storesInventory || { openings: {}, transactions: [] });
    if (!inv.openings) inv.openings = {};
    if (!Array.isArray(inv.transactions)) inv.transactions = [];

    const row = DL380_GEN11_RECEIPT;
    const exists = (inv.transactions || []).some((t) =>
        t.source === row.source && t.sourceRef === row.sourceRef
        && t.itemId === row.itemId && t.type === 'receipt'
    );
    if (exists && !force) {
        return { ok: false, reason: 'already', itemId: row.itemId };
    }

    const today = typeof todayIsoDate === 'function' ? todayIsoDate() : new Date().toISOString().slice(0, 10);
    if (typeof postStockTransaction === 'function') {
        postStockTransaction({
            type: 'receipt',
            itemId: row.itemId,
            item: row.name,
            category: 'ict-equipment',
            gl: '3112210001',
            qty: 1,
            party: 'ICT procurement — server receipt',
            description: 'HPE ProLiant DL380 Gen11 server — stores receipt',
            voucherNo: row.sourceRef,
            source: row.source,
            sourceRef: row.sourceRef,
            date: today,
            silent: true,
            skipRender: true
        });
    } else {
        inv.transactions.push({
            id: `stk-dl380-${Date.now()}`,
            date: today,
            type: 'receipt',
            itemId: row.itemId,
            category: 'ict-equipment',
            item: row.name,
            description: 'HPE ProLiant DL380 Gen11 server — stores receipt',
            qty: 1,
            uom: 'EA',
            gl: '3112210001',
            voucherNo: row.sourceRef,
            party: 'ICT procurement — server receipt',
            source: row.source,
            sourceRef: row.sourceRef,
            by: 'Inventory receipt',
            createdAt: new Date().toISOString()
        });
    }

    if (typeof saveState === 'function') saveState();
    if (typeof renderProductStockRegister === 'function') renderProductStockRegister();
    if (typeof renderVoucherInventoryTables === 'function') renderVoucherInventoryTables();
    if (typeof updateDashboard === 'function') updateDashboard();
    return { ok: true, itemId: row.itemId, name: row.name, qty: 1 };
}

window.receiptDl380Gen11Server = receiptDl380Gen11Server;

const HP_LAPTOP_RECEIPTS_AUG23_2026 = [
    {
        itemId: 'ict-equipment__hp-omnibook-x-flip-16',
        name: 'HP OmniBook X Flip 16 AI (Intel Core Ultra 9)',
        qty: 15,
        sourceRef: 'RV/IT/0823/OMNIBOOK-X-FLIP-U9',
        description: 'HP OmniBook X Flip Ultra 9 laptops — stores receipt (15 units)'
    },
    {
        itemId: 'ict-equipment__hp-elitebook-840-g11',
        name: 'HP EliteBook 840 G11',
        qty: 5,
        sourceRef: 'RV/IT/0823/ELITEBOOK-I7',
        description: 'HP EliteBook 840 G11 Core i7 laptops — stores receipt (5 units)'
    }
];

/** Receipt HP OmniBook X Flip Ultra 9 (15) and HP EliteBook Core i7 (5). Idempotent. */
function receiptHpLaptopsAug232026(opts = {}) {
    if (!appState) return { ok: false, reason: 'no-state' };
    const force = !!opts.force;
    const inv = typeof ensureStoresInventory === 'function'
        ? ensureStoresInventory()
        : (appState.storesInventory = appState.storesInventory || { openings: {}, transactions: [] });
    if (!inv.openings) inv.openings = {};
    if (!Array.isArray(inv.transactions)) inv.transactions = [];

    const today = typeof todayIsoDate === 'function' ? todayIsoDate() : new Date().toISOString().slice(0, 10);
    const source = 'inventory-receipt-hp-laptops-aug23-2026';
    const posted = [];

    HP_LAPTOP_RECEIPTS_AUG23_2026.forEach((row) => {
        const exists = (inv.transactions || []).some((t) =>
            t.source === source && t.sourceRef === row.sourceRef
            && t.itemId === row.itemId && t.type === 'receipt'
        );
        if (exists && !force) return;

        if (typeof postStockTransaction === 'function') {
            postStockTransaction({
                type: 'receipt',
                itemId: row.itemId,
                item: row.name,
                category: 'ict-equipment',
                gl: '3112210001',
                qty: row.qty,
                party: 'ICT procurement — laptop receipt',
                description: row.description,
                voucherNo: row.sourceRef,
                source,
                sourceRef: row.sourceRef,
                date: today,
                silent: true,
                skipRender: true
            });
        } else {
            inv.transactions.push({
                id: `stk-hp-${row.itemId.split('__').pop()}-${Date.now()}`,
                date: today,
                type: 'receipt',
                itemId: row.itemId,
                category: 'ict-equipment',
                item: row.name,
                description: row.description,
                qty: row.qty,
                uom: 'EA',
                gl: '3112210001',
                voucherNo: row.sourceRef,
                party: 'ICT procurement — laptop receipt',
                source,
                sourceRef: row.sourceRef,
                by: 'Inventory receipt',
                createdAt: new Date().toISOString()
            });
        }
        posted.push({ itemId: row.itemId, name: row.name, qty: row.qty });
    });

    if (!posted.length) return { ok: false, reason: 'already', lines: HP_LAPTOP_RECEIPTS_AUG23_2026.length };

    if (typeof saveState === 'function') saveState();
    if (typeof renderProductStockRegister === 'function') renderProductStockRegister();
    if (typeof renderVoucherInventoryTables === 'function') renderVoucherInventoryTables();
    if (typeof updateDashboard === 'function') updateDashboard();
    return { ok: true, posted, totalQty: posted.reduce((s, r) => s + r.qty, 0) };
}

window.receiptHpLaptopsAug232026 = receiptHpLaptopsAug232026;
window.HP_LAPTOP_RECEIPTS_AUG23_2026 = HP_LAPTOP_RECEIPTS_AUG23_2026;

/** 5 × HP OMEN 16 Gaming Laptop from Netlarks — stores receipt 4 Sep 2026. */
const HP_OMEN16_NETLARKS_RECEIPT = {
    itemId: 'ict-equipment__hp-omen-16-am0000ne',
    name: 'HP OMEN 16 Gaming Laptop (16-am0000ne)',
    qty: 5,
    date: '2026-09-04',
    source: 'inventory-receipt-omen16-netlarks-20260904',
    sourceRef: 'RV/IT/0904/OMEN-16',
    dnRef: 'DN/NL/OMEN/0904',
    party: 'NETLARKS TECHNOLOGIES (PVT) LTD',
    description: [
        'HP OMEN 16 Gaming Laptop × 5 — Netlarks stores receipt.',
        'Model 16-am0000ne · P/N C92JNEA#ABV · Shadow Black · FreeDOS 3.0.',
        'Intel Core i9-14900HX · RTX 5060 8GB GDDR7 · 16GB DDR5-5600 · 512GB PCIe Gen4 SSD.',
        'Sample S/N 5CD5466WVC (remaining serials to be captured on WRC / MLG).'
    ].join(' ')
};

/**
 * Receive 5 HP OMEN 16 Gaming Laptops from Netlarks into ICT Equipment ledger.
 * Creates Workshop Receipt Cert (engraved_complete) + stock receipt. Idempotent.
 */
function receiptHpOmen16NetlarksSep2026(opts = {}) {
    if (!appState) return { ok: false, reason: 'no-state' };
    const force = !!opts.force;
    const row = HP_OMEN16_NETLARKS_RECEIPT;
    const inv = typeof ensureStoresInventory === 'function'
        ? ensureStoresInventory()
        : (appState.storesInventory = appState.storesInventory || { openings: {}, transactions: [] });
    if (!inv.openings) inv.openings = {};
    if (!Array.isArray(inv.transactions)) inv.transactions = [];

    const exists = (inv.transactions || []).some((t) =>
        t.source === row.source && t.sourceRef === row.sourceRef
        && t.itemId === row.itemId && t.type === 'receipt'
    );
    if (exists && !force) {
        return { ok: false, reason: 'already', itemId: row.itemId, qty: row.qty };
    }

    let wrcId = '';
    if (typeof ensureWorkshopReceiptCerts === 'function' && typeof createWorkshopReceiptCert === 'function') {
        const certs = ensureWorkshopReceiptCerts();
        let cert = certs.find((c) => c.source === row.source && c.sourceRef === row.sourceRef);
        if (!cert || force) {
            const lines = [
                {
                    label: 'a',
                    designation: row.name,
                    qty: row.qty,
                    serialNo: '5CD5466WVC (+4 serials pending capture)',
                    specMatch: true
                }
            ];
            cert = createWorkshopReceiptCert({
                id: cert?.id || `wrc-omen16-netlarks-20260904`,
                inspectionSerial: cert?.inspectionSerial || (typeof nextWrcInspectionSerial === 'function'
                    ? nextWrcInspectionSerial()
                    : 'WRC-2026-OMEN16'),
                status: 'engraved_complete',
                deliveryDate: row.date,
                supplier: row.party,
                poNo: '',
                dnRef: row.dnRef,
                itemSummary: `${row.qty} × ${row.name}`,
                qty: row.qty,
                lines,
                remarks: row.description,
                certDate: row.date,
                source: row.source,
                sourceRef: row.sourceRef,
                mlg: {
                    sentDate: row.date,
                    returnedDate: row.date,
                    zaNumbers: []
                },
                history: [
                    { at: `${row.date}T12:00:00.000Z`, note: 'Delivery received from Netlarks — workshop/spec accepted' },
                    { at: `${row.date}T12:05:00.000Z`, note: 'Taken on charge to ICT Equipment ledger (qty 5)' }
                ]
            });
            if (force && certs.some((c) => c.id === cert.id)) {
                const idx = certs.findIndex((c) => c.id === cert.id);
                certs[idx] = cert;
            } else if (!certs.some((c) => c.id === cert.id)) {
                certs.unshift(cert);
            }
        }
        wrcId = cert.id;
    }

    let posted = null;
    if (typeof postStockTransaction === 'function') {
        posted = postStockTransaction({
            type: 'receipt',
            itemId: row.itemId,
            item: row.name,
            category: 'ict-equipment',
            gl: '3112210001',
            qty: row.qty,
            party: row.party,
            description: row.description,
            voucherNo: row.sourceRef,
            deliveryNoteRef: row.dnRef,
            source: row.source,
            sourceRef: row.sourceRef,
            wrcId,
            wrcBypass: true,
            date: row.date,
            silent: true,
            skipRender: true
        });
    }
    if (!posted) {
        if (exists && !force) {
            return { ok: false, reason: 'already', itemId: row.itemId, qty: row.qty };
        }
        inv.transactions.push({
            id: `stk-omen16-netlarks-${Date.now()}`,
            date: row.date,
            type: 'receipt',
            itemId: row.itemId,
            category: 'ict-equipment',
            item: row.name,
            description: row.description,
            qty: row.qty,
            uom: 'EA',
            gl: '3112210001',
            voucherNo: row.sourceRef,
            party: row.party,
            deliveryNoteRef: row.dnRef,
            source: row.source,
            sourceRef: row.sourceRef,
            wrcId,
            by: 'Inventory receipt',
            createdAt: new Date().toISOString()
        });
    }

    inv.omen16NetlarksReceipt_20260904 = {
        applied: true,
        appliedAt: new Date().toISOString(),
        itemId: row.itemId,
        qty: row.qty,
        party: row.party,
        voucherNo: row.sourceRef,
        dnRef: row.dnRef,
        wrcId
    };

    // Ensure Netlarks is on the suppliers register when the module table exists
    try {
        const tbody = document.getElementById('suppliers-table-body');
        if (tbody && typeof buildSupplierRow === 'function' && typeof collectSupplierRows === 'function') {
            const has = collectSupplierRows().some((r) =>
                /netlarks/i.test(String(r.name || ''))
            );
            if (!has) {
                tbody.appendChild(buildSupplierRow({
                    id: `SUP-NETLARKS-${row.date.replace(/-/g, '')}`,
                    name: 'Netlarks Technologies (Pvt) Ltd',
                    contact: '',
                    phone: '0773 925 179',
                    email: '',
                    start: row.date,
                    end: '',
                    status: 'Active',
                    notes: 'NETLARKS TECHNOLOGIES (PVT) LTD — HP OMEN 16 receipt 2026-09-04'
                }));
                if (typeof persistSuppliersModule === 'function') persistSuppliersModule();
            }
        }
    } catch (_) { /* suppliers module optional at boot */ }

    if (typeof saveState === 'function') saveState();
    if (typeof renderProductStockRegister === 'function') renderProductStockRegister();
    if (typeof renderVoucherInventoryTables === 'function') renderVoucherInventoryTables();
    if (typeof renderWorkshopReceiptCertTable === 'function') renderWorkshopReceiptCertTable();
    if (typeof updateDashboard === 'function') updateDashboard();
    if (typeof showToast === 'function' && !opts.silent) {
        showToast(`Received ${row.qty} × ${row.name} from Netlarks.`, 'success');
    }
    return { ok: true, itemId: row.itemId, name: row.name, qty: row.qty, wrcId };
}

window.receiptHpOmen16NetlarksSep2026 = receiptHpOmen16NetlarksSep2026;
window.HP_OMEN16_NETLARKS_RECEIPT = HP_OMEN16_NETLARKS_RECEIPT;
