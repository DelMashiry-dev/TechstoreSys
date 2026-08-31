/* real-dp-purchase-orders.js — Official DP ICT purchase orders (IT DIR) scanned into TechStoreSys */

/** @typedef {{ item: string, desc: string, qty: number, unit: string, price: number, amount: number }} RealDpPoLine */
/** @typedef {{
 *   poNumber: string, date: string, deliveryDate: string,
 *   supplierName: string, supplierAddress: string, supplierPhone: string,
 *   contact: string, contactPhone: string, deliverTo: string, paymentTerms: string,
 *   currency: string, gl: string, cancelled?: boolean, lines: RealDpPoLine[], total: number
 * }} RealDpPurchaseOrder */

/** Republic of Zimbabwe DP purchase orders — real issued orders for IT DIR ICT procurement. */
const REAL_DP_PURCHASE_ORDERS = [
    {
        poNumber: 'DP 3199/2026',
        date: '2026-07-17',
        deliveryDate: '2026-07-24',
        supplierName: 'LASERJET IMPRESSIONS',
        supplierAddress: '2ND FLOOR SOUTH WING, THROGMORTON HOUSE, CNR S. MACHEL AVE.',
        supplierPhone: '772311592',
        contact: 'Dir of Procurement',
        contactPhone: '0242-790016',
        deliverTo: 'IT DIR',
        paymentTerms: 'Payable immediately Due net',
        currency: 'USD',
        gl: '3112210001',
        lines: [
            { item: '01', desc: 'HP COLOR LASERJET ENTERPRISE MFP 5800 PRINTER', qty: 2, unit: 'EA', price: 2850, amount: 5700 }
        ],
        total: 5700
    },
    {
        poNumber: 'DP 3478/2026',
        date: '2026-08-04',
        deliveryDate: '2026-08-11',
        reqNo: '10080264',
        supplierName: 'NIXZIMO PVT LTD',
        supplierAddress: '2780 Princess Margaret, Marlborough, Harare',
        supplierPhone: '0712491600',
        contact: 'Dir of Procurement',
        contactPhone: '0242-790016',
        deliverTo: 'IT DIR',
        paymentTerms: 'Payable immediately Due net',
        currency: 'ZiG',
        gl: '3112210001',
        lines: [
            { item: '01', desc: 'HP ELITEBOOK 830 G9 CORE I7 LAPTOP', qty: 5, unit: 'EA', price: 70000, amount: 350000 }
        ],
        total: 350000
    },
    {
        poNumber: 'DP 3549/2026',
        date: '2026-08-12',
        deliveryDate: '2026-08-19',
        supplierName: 'NIXZIMO PVT LTD',
        supplierAddress: '2780 Princess Margaret, Marlborough, Harare',
        supplierPhone: '0712491600',
        contact: 'Dir of Procurement',
        contactPhone: '0242-790016',
        deliverTo: 'IT DIR',
        paymentTerms: 'Payable immediately Due net',
        currency: 'ZiG',
        gl: '3112210001',
        lines: [
            { item: '01', desc: 'HP ELITEBOOK 830 G9 CORE I7 LAPTOP', qty: 9, unit: 'EA', price: 70000, amount: 630000 }
        ],
        total: 630000
    },
    {
        poNumber: 'DP 1651/2026',
        date: '2026-06-02',
        deliveryDate: '2026-06-08',
        supplierName: 'CASSET IMPRESSIONS',
        supplierAddress: '2ND FLOOR SOUTH WING, THROGMORTON HOUSE, CNR S. MACHEL AVE',
        supplierPhone: '772311592',
        contact: 'Dir of Procurement',
        contactPhone: '0242-790016',
        deliverTo: 'IT DIR',
        paymentTerms: 'Payable immediately Due net',
        currency: 'USD',
        gl: '3112210001',
        lines: [
            { item: '01', desc: 'HP PROLIANT DL 380 GEN SERVER', qty: 2, unit: 'EA', price: 8900, amount: 17800 }
        ],
        total: 17800
    },
    {
        poNumber: 'DP 3385/2026',
        date: '2026-07-27',
        deliveryDate: '2026-08-03',
        supplierName: 'LASERJET IMPRESSIONS',
        supplierAddress: '2ND FLOOR SOUTH WING, THROGMORTON HOUSE, CNR S. MACHEL AVE.',
        supplierPhone: '772311592',
        contact: 'Dir of Procurement',
        contactPhone: '0242-790016',
        deliverTo: 'IT DIR',
        paymentTerms: 'Payable immediately Due net',
        currency: 'ZiG',
        gl: '3112210001',
        lines: [
            { item: '01', desc: 'SMART HEAVY DUTY MOBILE STAND FOR INTERACTIVE DISPLAY', qty: 7, unit: 'EA', price: 19100, amount: 133700 }
        ],
        total: 133700
    },
    {
        poNumber: 'DP 2048/2026',
        date: '2026-06-30',
        deliveryDate: '2026-07-08',
        supplierName: 'LASERJET IMPRESSIONS',
        supplierAddress: '2ND FLOOR SOUTH WING, THROGMORTON HOUSE, CNR S. MACHEL AVE',
        supplierPhone: '772311592',
        contact: 'Dir of Procurement',
        contactPhone: '0242-790016',
        deliverTo: 'IT DIR',
        paymentTerms: 'Payable immediately Due net',
        currency: 'USD',
        gl: '3112210001',
        lines: [
            { item: '01', desc: 'HP PROLIANT DL 380 GEN 11 SERVER', qty: 2, unit: 'EA', price: 8900, amount: 17800 },
            { item: '02', desc: '24 PORT CISCO SWITCH', qty: 1, unit: 'EA', price: 1250, amount: 1250 }
        ],
        total: 19050
    },
    {
        poNumber: 'DP 1653/2026',
        date: '2026-06-02',
        deliveryDate: '2026-06-08',
        supplierName: 'NETLARKS TECHNOLOGIES (PVT) LTD',
        supplierAddress: '14-16 George Silundika Ave, Executive Chambers, 2nd Floor, Suite 219-221, Harare',
        supplierPhone: '0773925179',
        contact: 'Dir of Procurement',
        contactPhone: '0242-790016',
        deliverTo: 'IT DIR',
        paymentTerms: 'Payable immediately Due net',
        currency: 'USD',
        gl: '3112210001',
        lines: [
            { item: '01', desc: 'HP AIO DESKTOP COMPUTERS', qty: 6, unit: 'EA', price: 850, amount: 5100 },
            { item: '02', desc: 'DELL G16 7630 LAPTOP INTEL CORE i9 13th GEN', qty: 10, unit: 'EA', price: 2400, amount: 24000 },
            { item: '03', desc: 'CAT6 ETHERNET CABLE NETWORK DRUM (305M)', qty: 1, unit: 'EA', price: 80, amount: 80 }
        ],
        total: 29180
    },
    {
        poNumber: 'DP 1355/2026',
        date: '2026-06-02',
        deliveryDate: '2026-06-08',
        supplierName: 'DEXFORD ENTERPRISES P/L',
        supplierAddress: 'NO 3 FAWDEN CLOSE, HATFIELD, HARARE',
        supplierPhone: '0773531676',
        contact: 'Dir of Procurement',
        contactPhone: '0242-790016',
        deliverTo: 'IT DIR',
        paymentTerms: 'Payable immediately Due net',
        currency: 'USD',
        gl: '3112210001',
        cancelled: true,
        lines: [
            { item: '01', desc: '24 PORT CISCO SWITCH WS-C2960X-24PS-POE PORT CATALYST', qty: 1, unit: 'EA', price: 491, amount: 491 }
        ],
        total: 491
    }
];

function realDpPoCell(tag, type, value) {
    if (tag === 'select') {
        return { tag: 'select', value: value == null ? '' : String(value), selectedIndex: 0 };
    }
    return { tag: 'input', type: type || 'text', value: value == null ? '' : String(value) };
}

function normalizeRealDpPoNo(poNo) {
    return String(poNo || '').trim().replace(/\s+/g, ' ').toUpperCase();
}

function findRealDpPurchaseOrder(poNo) {
    const key = normalizeRealDpPoNo(poNo);
    return REAL_DP_PURCHASE_ORDERS.find((po) => normalizeRealDpPoNo(po.poNumber) === key) || null;
}

function realDpRegisterRowFromPo(po) {
    const signature = po.cancelled ? 'CANCELLED' : '';
    const vendor = po.supplierPhone || '';
    return {
        cells: [
            realDpPoCell('input', 'date', po.date),
            realDpPoCell('input', 'text', po.supplierName),
            realDpPoCell('input', 'text', po.poNumber),
            realDpPoCell('input', 'number', po.cancelled ? 0 : po.total),
            realDpPoCell('select', '', po.gl),
            realDpPoCell('input', 'text', vendor),
            realDpPoCell('input', 'text', signature)
        ],
        realDpPo: true
    };
}

function realDpLineRowFromLine(line) {
    return {
        cells: [
            realDpPoCell('input', 'text', line.item),
            realDpPoCell('input', 'text', ''),
            realDpPoCell('input', 'number', line.qty),
            realDpPoCell('input', 'text', line.unit || 'EA'),
            realDpPoCell('input', 'text', line.desc),
            realDpPoCell('input', 'number', line.price),
            realDpPoCell('input', 'number', line.amount)
        ]
    };
}

function realDpFieldsFromPo(po) {
    return [
        { tag: 'input', type: 'text', id: 'poSupplierName', value: po.supplierName },
        { tag: 'textarea', type: '', id: 'poSupplierAddress', value: po.supplierAddress || '' },
        { tag: 'input', type: 'text', id: 'poNumber', value: po.poNumber },
        { tag: 'input', type: 'date', id: 'poDate', value: po.date },
        { tag: 'input', type: 'text', id: 'poVendorNo', value: po.supplierPhone || '' },
        { tag: 'input', type: 'text', id: 'poReqNo', value: po.reqNo || '' },
        { tag: 'input', type: 'text', id: 'poDeliverTo', value: po.deliverTo || 'IT DIR' },
        { tag: 'input', type: 'date', id: 'poDeliveryDate', value: po.deliveryDate || '' },
        { tag: 'input', type: 'text', id: 'poPaymentTerms', value: po.paymentTerms || '' },
        { tag: 'input', type: 'text', id: 'poContact', value: po.contact || 'Dir of Procurement' },
        { tag: 'input', type: 'text', id: 'poTelephone', value: po.contactPhone || '0242-790016' },
        { tag: 'select', type: '', id: 'poCurrency', value: po.currency || 'USD' },
        { tag: 'select', type: '', id: 'poGl', value: po.gl || '3112210001' },
        { tag: 'input', type: 'text', id: 'poSignature', value: po.cancelled ? 'CANCELLED' : '' }
    ];
}

function buildBenchmarksFromRealDpPos() {
    const out = [];
    REAL_DP_PURCHASE_ORDERS.forEach((po) => {
        if (po.cancelled) return;
        po.lines.forEach((line, index) => {
            const slug = line.desc.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48);
            out.push({
                id: `${normalizeRealDpPoNo(po.poNumber).replace(/\s/g, '-')}-${index}`,
                description: line.desc,
                currency: po.currency,
                unitPrice: line.price,
                poRef: po.poNumber,
                gl: po.gl,
                realPo: true
            });
        });
    });
    return out;
}

function ensureRealDpPurchaseOrderModule() {
    if (!appState) return null;
    if (!appState.modules['purchase-orders']) {
        appState.modules['purchase-orders'] = { fields: [], tables: {} };
    }
    const mod = appState.modules['purchase-orders'];
    if (!mod.tables) mod.tables = {};
    if (!Array.isArray(mod.tables['purchase-orders-table-body'])) {
        mod.tables['purchase-orders-table-body'] = [];
    }
    return mod;
}

function getPurchaseOrderRegisterPoNos(register) {
    const set = new Set();
    (register || []).forEach((row) => {
        const poNo = row.cells?.[2]?.value;
        if (poNo) set.add(normalizeRealDpPoNo(poNo));
    });
    return set;
}

/** Merge real DP POs into the purchase order register (idempotent). */
function ensureRealDpPurchaseOrders({ force = false } = {}) {
    const mod = ensureRealDpPurchaseOrderModule();
    if (!mod) return { added: 0, total: 0 };

    let register = mod.tables['purchase-orders-table-body'];
    const realKeys = new Set(REAL_DP_PURCHASE_ORDERS.map((po) => normalizeRealDpPoNo(po.poNumber)));

    if (force) {
        register = register.filter((row) => {
            const poNo = normalizeRealDpPoNo(row.cells?.[2]?.value);
            return !realKeys.has(poNo);
        });
        mod.tables['purchase-orders-table-body'] = register;
    }

    const existing = getPurchaseOrderRegisterPoNos(register);
    let added = 0;

    REAL_DP_PURCHASE_ORDERS.forEach((po) => {
        const key = normalizeRealDpPoNo(po.poNumber);
        if (existing.has(key)) return;
        register.push(realDpRegisterRowFromPo(po));
        existing.add(key);
        added += 1;
    });

    register.sort((a, b) => {
        const da = a.cells?.[0]?.value || '';
        const db = b.cells?.[0]?.value || '';
        return String(da).localeCompare(String(db));
    });

    if (!mod.fields?.length && REAL_DP_PURCHASE_ORDERS.length) {
        mod.fields = realDpFieldsFromPo(REAL_DP_PURCHASE_ORDERS[0]);
        mod.tables['purchase-orders-lines-body'] = REAL_DP_PURCHASE_ORDERS[0].lines.map(realDpLineRowFromLine);
    }

    appState.realDpPurchaseOrdersLoaded = true;
    return { added, total: register.length };
}

function loadRealDpPurchaseOrderIntoForm(poNo) {
    const po = findRealDpPurchaseOrder(poNo);
    if (!po) {
        if (typeof showToast === 'function') showToast(`PO ${poNo} not found in IT DIR DP register.`, 'error');
        return false;
    }

    const set = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.value = value ?? '';
    };

    set('poSupplierName', po.supplierName);
    set('poSupplierAddress', po.supplierAddress || '');
    set('poNumber', po.poNumber);
    set('poDate', po.date);
    set('poVendorNo', po.supplierPhone || '');
    set('poReqNo', po.reqNo || '');
    set('poDeliverTo', po.deliverTo || 'IT DIR');
    set('poDeliveryDate', po.deliveryDate || '');
    set('poPaymentTerms', po.paymentTerms || '');
    set('poContact', po.contact || 'Dir of Procurement');
    set('poTelephone', po.contactPhone || '0242-790016');
    set('poCurrency', po.currency || 'USD');
    set('poGl', po.gl || '3112210001');
    set('poSignature', po.cancelled ? 'CANCELLED' : '');

    const tbody = document.getElementById('purchase-orders-lines-body');
    if (tbody) {
        tbody.innerHTML = '';
        po.lines.forEach((line) => {
            const tr = typeof buildPurchaseOrderLineRow === 'function'
                ? buildPurchaseOrderLineRow({
                    item: line.item,
                    qty: String(line.qty),
                    unit: line.unit || 'EA',
                    desc: line.desc,
                    price: String(line.price),
                    net: String(line.amount)
                })
                : null;
            if (tr) tbody.appendChild(tr);
        });
        if (!po.lines.length && typeof buildPurchaseOrderLineRow === 'function') {
            tbody.appendChild(buildPurchaseOrderLineRow());
        }
    }

    if (typeof refreshPurchaseOrderSupplierOptions === 'function') refreshPurchaseOrderSupplierOptions();
    if (typeof syncPurchaseOrderSupplierPickFromName === 'function') syncPurchaseOrderSupplierPickFromName();
    if (typeof updatePurchaseOrderDocumentTotal === 'function') updatePurchaseOrderDocumentTotal();

    if (typeof showToast === 'function') {
        const note = po.cancelled ? ' (cancelled)' : '';
        showToast(`Loaded ${po.poNumber}${note} — ${po.supplierName}`);
    }
    return true;
}

function isPurchaseOrderRegisterRowCancelled(row) {
    const sig = String(row?.cells?.[6]?.value || '').trim().toUpperCase();
    return sig.includes('CANCELLED');
}

window.REAL_DP_PURCHASE_ORDERS = REAL_DP_PURCHASE_ORDERS;
window.findRealDpPurchaseOrder = findRealDpPurchaseOrder;
window.ensureRealDpPurchaseOrders = ensureRealDpPurchaseOrders;
window.loadRealDpPurchaseOrderIntoForm = loadRealDpPurchaseOrderIntoForm;
window.buildBenchmarksFromRealDpPos = buildBenchmarksFromRealDpPos;
window.isPurchaseOrderRegisterRowCancelled = isPurchaseOrderRegisterRowCancelled;
window.normalizeRealDpPoNo = normalizeRealDpPoNo;
