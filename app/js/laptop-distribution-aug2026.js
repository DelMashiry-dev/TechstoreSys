/* laptop-distribution-aug2026.js — IT Dir laptop distribution (14 Aug 2026)
 * Source: LAP-TOPS.docx — DISTRIBUTION OF LAPTOPS TO IT DIR PERSONNEL AS AT 14 AUGUST 2026
 * (document is source only — not stored in the system)
 * Rule: one active ZNA Q 1033 per person — return initial issue before second issue.
 * IVs: each current Aug 2026 laptop is posted as Issue Voucher IV/IT/{yymm}/{za} with ZA No.
 */

const LAPTOP_DIST_AUG2026_KEY = 'laptopDistributionAug2026';
const LAPTOP_DIST_SOURCE = 'laptop-distribution-aug2026';
const LAPTOP_DIST_IV_REV = 3;
const LAPTOP_DIST_CUSTOM_OMNI_ID = 'custom__inv-laptops__hp-omnibook-xflip-intel-core-ultra-9';

const LAPTOP_DIST_CATALOG = {
    omnibook: {
        itemId: 'ict-equipment__hp-omnibook-x-flip-16',
        name: 'HP OmniBook X Flip 16 AI (Intel Core Ultra 9)'
    },
    elitebook: {
        itemId: 'ict-equipment__hp-elitebook-840-g11',
        name: 'HP EliteBook 840 G11'
    },
    legacy: {
        itemId: 'ict-equipment__hp-elitebook',
        name: 'HP EliteBook (prior issue)'
    }
};

/** @type {Array<{rank:string,name:string,appointment:string,issues:Array<{za?:string|null,date:string,model?:keyof typeof LAPTOP_DIST_CATALOG}>}>} */
const IT_DIR_LAPTOP_DISTRIBUTION_AUG2026 = [
    { rank: 'Maj', name: 'T Gahadza', appointment: 'OC Sys Admin', issues: [{ date: '16/07/20' }] },
    { rank: 'Maj', name: 'AT Muzondo', appointment: 'OC Sys Dev', issues: [{ za: '938', date: '01/11/23' }] },
    { rank: 'Capt', name: 'TS Murandu', appointment: 'T/O', issues: [{ za: '875', date: '04/07/22' }] },
    { rank: 'Capt', name: 'K Mauya', appointment: 'OC DBA', issues: [{ za: '684', date: '16/07/20' }, { za: '1103', date: '14/08/26', model: 'omnibook' }] },
    { rank: 'Capt', name: 'B Nzvume', appointment: 'TO', issues: [{ za: '696', date: '28/07/20' }, { za: '1061', date: '14/08/26', model: 'omnibook' }] },
    { rank: 'Capt', name: 'DK Mashiri', appointment: 'TSO', issues: [{ za: '692', date: '16/07/20' }, { za: '1100', date: '14/08/26', model: 'omnibook' }] },
    { rank: 'Capt', name: 'TH Mugazda', appointment: 'DBA', issues: [{ za: '687', date: '16/07/20' }, { za: '1046', date: '14/08/26', model: 'omnibook' }] },
    { rank: 'Capt', name: 'CT Kupara', appointment: 'DBA', issues: [{ za: '705', date: '16/07/20' }, { za: '1094', date: '14/08/26', model: 'omnibook' }] },
    { rank: 'Capt', name: 'JI Magutorima', appointment: 'DBA', issues: [{ za: '691', date: '16/07/20' }, { za: '1047', date: '14/08/26', model: 'omnibook' }] },
    { rank: 'Capt', name: 'L Kativu', appointment: 'OCE', issues: [{ za: '700', date: '16/07/20' }, { za: '1045', date: '14/08/26', model: 'omnibook' }] },
    { rank: 'Capt', name: 'L Manyere', appointment: 'Sys Developer', issues: [{ za: '701', date: '16/07/20' }, { za: '1042', date: '14/08/26', model: 'omnibook' }] },
    { rank: 'Capt', name: 'C Batahana', appointment: 'Web Developer', issues: [{ za: '685', date: '16/07/20' }, { za: '960', date: '22/07/22' }, { za: '1044', date: '10/08/26', model: 'omnibook' }] },
    { rank: 'Capt', name: 'EC Magondo', appointment: 'DBA', issues: [{ za: '960', date: '16/07/20' }, { za: '1095', date: '14/08/26', model: 'omnibook' }] },
    { rank: 'Lt', name: 'T Katsande', appointment: 'TO', issues: [{ za: '1060', date: '14/08/26', model: 'omnibook' }] },
    { rank: 'Lt', name: 'P Chikuhwa', appointment: '2IC Eng.', issues: [{ za: '877', date: '04/07/22' }] },
    { rank: 'WO2', name: 'J Mpandawana', appointment: 'RQ', issues: [{ za: '1097', date: '14/08/26', model: 'elitebook' }] },
    { rank: 'Sgt', name: 'Chari', appointment: 'Programmer', issues: [{ za: '1041', date: '14/08/26', model: 'elitebook' }] },
    { rank: 'Sgt', name: 'Chipato', appointment: 'Programmer', issues: [{ za: '1043', date: '14/08/26', model: 'elitebook' }] },
    { rank: 'Sgt', name: 'Mlambo AA', appointment: 'Programmer', issues: [{ za: '1048', date: '14/08/26', model: 'elitebook' }] },
    { rank: 'Sgt', name: 'Tenesi K', appointment: 'Programmer', issues: [{ za: '1059', date: '14/08/26', model: 'elitebook' }] },
    { rank: 'Sgt', name: 'Maziofa', appointment: 'Programmer', issues: [{ za: '1062', date: '14/08/26', model: 'omnibook' }] },
    { rank: 'Sgt', name: 'Chinodya M', appointment: 'Programmer', issues: [{ za: '1065', date: '14/08/26', model: 'omnibook' }] },
    { rank: 'Cpl', name: 'Kandeya', appointment: 'Programmer', issues: [{ za: '1066', date: '14/08/26', model: 'omnibook' }] }
];

function laptopDistParseDate(raw) {
    const s = String(raw || '').trim();
    const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
    if (!m) return s;
    let y = parseInt(m[3], 10);
    if (y < 100) y += 2000;
    return `${y}-${String(m[2]).padStart(2, '0')}-${String(m[1]).padStart(2, '0')}`;
}

function laptopDistDayBefore(iso) {
    const d = new Date(`${iso}T12:00:00`);
    if (Number.isNaN(d.getTime())) return iso;
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
}

function laptopDistHolderLabel(person) {
    return `${person.rank} ${person.name}`.replace(/\s+/g, ' ').trim();
}

function laptopDistZa(za) {
    const raw = String(za || '').trim();
    if (!raw) return '';
    if (typeof normalizeZaNumber === 'function') return normalizeZaNumber(raw);
    return /^ZA/i.test(raw) ? raw.toUpperCase().replace(/^ZA-?/i, 'ZA') : `ZA${raw}`;
}

function laptopDistYymm(iso) {
    const m = String(iso || '').match(/^(\d{4})-(\d{2})/);
    return m ? `${m[2]}${m[1].slice(2)}` : '0826';
}

function laptopDistIvNo(iso, za) {
    return `IV/IT/${laptopDistYymm(iso)}/${za}`;
}

function laptopDistRvNo(iso, za, kind) {
    const yymm = laptopDistYymm(iso);
    if (kind === 'ret') return `RV/IT/${yymm}/RET-${za}`;
    return `RV/IT/${yymm}/ZA-${za}`;
}

function laptopDistForm1033Ref(za) {
    const z = String(za || '').trim();
    return z ? `Q1033/${z}` : '';
}

function laptopDistNormSerial(value) {
    if (typeof normalizeStockSerialOrZa === 'function') return normalizeStockSerialOrZa(value);
    return laptopDistZa(value) || String(value || '').trim().toUpperCase();
}

function laptopDistUpsertIctRecord(partial, list) {
    const rec = typeof createIctAccountabilityRecord === 'function'
        ? createIctAccountabilityRecord(partial)
        : { ...partial, id: partial.id || `icta-${Date.now()}` };
    const idx = list.findIndex((r) => r.id === rec.id);
    if (idx >= 0) {
        list[idx] = { ...list[idx], ...rec, id: list[idx].id, createdAt: list[idx].createdAt };
        return list[idx];
    }
    list.unshift(rec);
    return rec;
}

function laptopDistEnsureTxn(inv, payload) {
    if (!Array.isArray(inv.transactions)) inv.transactions = [];
    const serial = laptopDistNormSerial(payload.serialOrZa);
    const existing = inv.transactions.find((t) =>
        t.source === LAPTOP_DIST_SOURCE
        && t.sourceRef === payload.sourceRef
        && t.type === payload.type
    );
    if (existing) {
        if (serial && !existing.serialOrZa) existing.serialOrZa = serial;
        if (payload.voucherNo && !existing.voucherNo) existing.voucherNo = payload.voucherNo;
        if (payload.appointment && existing.appointment !== payload.appointment) {
            existing.appointment = payload.appointment;
        }
        if (payload.item) existing.item = payload.item;
        if (payload.description) existing.description = payload.description;
        return { txn: existing, created: false };
    }
    const txn = {
        id: `stk-ld-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        date: payload.date,
        type: payload.type,
        itemId: payload.itemId,
        category: payload.category || 'ict-equipment',
        item: payload.item,
        description: payload.description || '',
        qty: Number(payload.qty) || 1,
        uom: 'EA',
        gl: payload.gl || '3112210001',
        serialOrZa: serial,
        voucherNo: payload.voucherNo || '',
        party: payload.party || '',
        appointment: (payload.appointment || '').trim(),
        source: payload.source || LAPTOP_DIST_SOURCE,
        sourceRef: payload.sourceRef || '',
        by: 'Laptop distribution import',
        createdAt: new Date().toISOString()
    };
    inv.transactions.push(txn);
    return { txn, created: true };
}

function laptopDistSerialReceiptExists(transactions, za) {
    const key = laptopDistNormSerial(za);
    if (!key) return false;
    return (transactions || []).some((t) =>
        t.type === 'receipt' && laptopDistNormSerial(t.serialOrZa) === key
    );
}

function laptopDistFindBulkReceipt(transactions) {
    const candidates = (transactions || []).filter((t) => {
        if (t.type !== 'receipt') return false;
        if (t.source === LAPTOP_DIST_SOURCE) return false;
        if (laptopDistNormSerial(t.serialOrZa)) return false;
        const qty = Number(t.qty) || 0;
        if (qty <= 1) return false;
        const blob = `${t.itemId || ''} ${t.item || ''}`.toLowerCase();
        return t.itemId === LAPTOP_DIST_CUSTOM_OMNI_ID || /omnibook/.test(blob);
    });
    candidates.sort((a, b) => (Number(b.qty) || 0) - (Number(a.qty) || 0));
    return candidates[0] || null;
}

function laptopDistCollectAug2026Issues() {
    const rows = [];
    IT_DIR_LAPTOP_DISTRIBUTION_AUG2026.forEach((person) => {
        const holder = laptopDistHolderLabel(person);
        const issues = (person.issues || []).slice().sort((a, b) =>
            laptopDistParseDate(a.date).localeCompare(laptopDistParseDate(b.date))
        );
        issues.forEach((issue, idx) => {
            const iso = laptopDistParseDate(issue.date);
            if (!(iso >= '2026-08-01' && issue.model && issue.za)) return;
            const cat = LAPTOP_DIST_CATALOG[issue.model] || LAPTOP_DIST_CATALOG.legacy;
            rows.push({
                person,
                holder,
                issue,
                idx,
                iso,
                za: String(issue.za).trim(),
                cat,
                prev: idx > 0 ? issues[idx - 1] : null
            });
        });
    });
    rows.sort((a, b) => a.iso.localeCompare(b.iso) || a.za.localeCompare(b.za));
    return rows;
}

/**
 * Turn the unserialized 14 Aug OmniBook batch into one-ZA receipts, or post catalog unit receipts.
 * Returns the itemId used for each ZA so IVs deplete the same ledger line.
 */
function laptopDistAllocateUnitReceipts(inv, augRows, summary) {
    const itemByZa = {};
    const bulk = laptopDistFindBulkReceipt(inv.transactions);
    const batchItemId = bulk?.itemId || '';
    const batchItemName = bulk?.item || '';
    const batchDate = bulk?.date || '';

    if (bulk && Number(bulk.qty) >= augRows.length) {
        const remainQty = Number(bulk.qty) - augRows.length;
        augRows.forEach((row, i) => {
            const serial = laptopDistZa(row.za);
            itemByZa[row.za] = {
                itemId: batchItemId,
                item: row.cat.name,
                category: bulk.category || 'inv-laptops'
            };
            if (laptopDistSerialReceiptExists(inv.transactions, serial)) return;
            if (i === 0) {
                bulk.qty = 1;
                bulk.serialOrZa = serial;
                bulk.voucherNo = bulk.voucherNo || laptopDistRvNo(row.iso, row.za, 'recv');
                bulk.item = row.cat.name;
                bulk.description = [
                    bulk.description,
                    `Allocated ZA${row.za} — ${row.holder} (Q 1033/${row.za})`
                ].filter(Boolean).join(' — ');
                summary.receipts += 1;
                summary.convertedBulk = true;
                return;
            }
            const posted = laptopDistEnsureTxn(inv, {
                type: 'receipt',
                date: batchDate || row.iso,
                itemId: batchItemId,
                item: row.cat.name,
                category: bulk.category || 'inv-laptops',
                gl: '3112210001',
                qty: 1,
                serialOrZa: serial,
                party: bulk.party || 'ICT procurement — laptop receipt',
                description: `Unit receipt from 14 Aug batch — ZA${row.za} for ${row.holder}`,
                voucherNo: laptopDistRvNo(row.iso, row.za, 'recv'),
                source: LAPTOP_DIST_SOURCE,
                sourceRef: `${row.za}-recv`
            });
            if (posted.created) summary.receipts += 1;
        });
        if (remainQty > 0 && !laptopDistSerialReceiptExists(inv.transactions, 'STORES-OMNI-REMAIN-1')) {
            laptopDistEnsureTxn(inv, {
                type: 'receipt',
                date: batchDate || '2026-08-14',
                itemId: batchItemId,
                item: batchItemName || LAPTOP_DIST_CATALOG.omnibook.name,
                category: bulk.category || 'inv-laptops',
                gl: '3112210001',
                qty: 1,
                serialOrZa: 'STORES-OMNI-REMAIN-1',
                party: bulk.party || 'ICT procurement — laptop receipt',
                description: 'Unallocated unit from 14 Aug OmniBook batch (still in stores)',
                voucherNo: 'RV/IT/0826/OMNI-REMAIN',
                source: LAPTOP_DIST_SOURCE,
                sourceRef: 'omni-remain-1'
            });
            summary.receipts += 1;
            if (remainQty > 1) {
                // Extra units beyond 19 issues + 1 remainder stay as a bulk tail on a new line
                laptopDistEnsureTxn(inv, {
                    type: 'receipt',
                    date: batchDate || '2026-08-14',
                    itemId: batchItemId,
                    item: batchItemName || LAPTOP_DIST_CATALOG.omnibook.name,
                    category: bulk.category || 'inv-laptops',
                    gl: '3112210001',
                    qty: remainQty - 1,
                    serialOrZa: '',
                    party: bulk.party || 'ICT procurement — laptop receipt',
                    description: `Remainder of 14 Aug batch after ZA allocation (${remainQty - 1} unserialized)`,
                    voucherNo: 'RV/IT/0826/OMNI-REMAIN-QTY',
                    source: LAPTOP_DIST_SOURCE,
                    sourceRef: 'omni-remain-qty'
                });
            }
        }
        return itemByZa;
    }

    augRows.forEach((row) => {
        const serial = laptopDistZa(row.za);
        itemByZa[row.za] = {
            itemId: row.cat.itemId,
            item: row.cat.name,
            category: 'ict-equipment'
        };
        if (laptopDistSerialReceiptExists(inv.transactions, serial)) return;
        const posted = laptopDistEnsureTxn(inv, {
            type: 'receipt',
            date: laptopDistDayBefore(row.iso),
            itemId: row.cat.itemId,
            item: row.cat.name,
            category: 'ict-equipment',
            gl: '3112210001',
            qty: 1,
            serialOrZa: serial,
            party: 'ICT procurement — laptop receipt',
            description: `Stores receipt ZA${row.za} before Q 1033 issue to ${row.holder}`,
            voucherNo: laptopDistRvNo(row.iso, row.za, 'recv'),
            source: LAPTOP_DIST_SOURCE,
            sourceRef: `${row.za}-recv`
        });
        if (posted.created) summary.receipts += 1;
    });
    return itemByZa;
}

/** Import distribution register + Aug 2026 IVs with ZA numbers. Idempotent. */
function applyLaptopDistributionAug2026(opts = {}) {
    if (!appState) return { ok: false, reason: 'no-state' };
    const force = !!opts.force;
    const inv = typeof ensureStoresInventory === 'function'
        ? ensureStoresInventory()
        : (appState.storesInventory = appState.storesInventory || { openings: {}, transactions: [] });
    if (!Array.isArray(inv.transactions)) inv.transactions = [];

    const already = inv[LAPTOP_DIST_AUG2026_KEY];
    if (!force && already?.applied && Number(already.ivRev) >= LAPTOP_DIST_IV_REV) {
        return { ok: true, reason: 'already', ...already };
    }

    const ictList = typeof ensureIctAccountability === 'function'
        ? ensureIctAccountability()
        : (appState.ictAccountability = appState.ictAccountability || []);

    const summary = {
        ictRecords: 0,
        receipts: 0,
        returns: 0,
        issues: 0,
        holdersActive: 0,
        skipped: 0,
        patched: 0,
        convertedBulk: false
    };

    IT_DIR_LAPTOP_DISTRIBUTION_AUG2026.forEach((person) => {
        const holder = laptopDistHolderLabel(person);
        const issues = (person.issues || []).slice().sort((a, b) =>
            laptopDistParseDate(a.date).localeCompare(laptopDistParseDate(b.date))
        );

        issues.forEach((issue, idx) => {
            const iso = laptopDistParseDate(issue.date);
            const isLast = idx === issues.length - 1;
            const status = isLast ? 'issued' : 'returned';
            const cat = issue.model ? LAPTOP_DIST_CATALOG[issue.model] : LAPTOP_DIST_CATALOG.legacy;

            laptopDistUpsertIctRecord({
                id: `icta-ld-${person.name.replace(/\s+/g, '-').toLowerCase()}-${issue.za || idx}`,
                assetClass: 'equipment',
                designation: cat.name,
                description: `${person.appointment} — IT Dir laptop (${status === 'issued' ? 'current' : 'returned'})`,
                zaNumber: issue.za || '',
                status,
                engraved: !!issue.za,
                holderName: holder,
                unit: 'IT Directorate',
                issueDate: iso,
                form1033Ref: laptopDistForm1033Ref(issue.za),
                inventoryLedger: 'inv-laptops',
                glCharge: '3112210001',
                remarks: status === 'returned'
                    ? 'Returned to stores before subsequent Q 1033 issue'
                    : 'Distribution of laptops to IT Dir personnel — 14 Aug 2026'
            }, ictList);
            summary.ictRecords += 1;
            if (status === 'issued') summary.holdersActive += 1;
        });
    });

    const augRows = laptopDistCollectAug2026Issues();
    const itemByZa = laptopDistAllocateUnitReceipts(inv, augRows, summary);
    const returnedZa = new Set();

    augRows.forEach((row) => {
        const prevZa = row.prev?.za ? String(row.prev.za).trim() : '';
        if (prevZa && !returnedZa.has(prevZa)) {
            returnedZa.add(prevZa);
            const ret = laptopDistEnsureTxn(inv, {
                type: 'receipt',
                date: laptopDistDayBefore(row.iso),
                itemId: LAPTOP_DIST_CATALOG.legacy.itemId,
                item: LAPTOP_DIST_CATALOG.legacy.name,
                category: 'ict-equipment',
                gl: '3112210001',
                qty: 1,
                serialOrZa: laptopDistZa(prevZa),
                party: row.holder,
                description: `Return of previous laptop ZA${prevZa} before Q 1033/${row.za} — ${row.person.name}`,
                voucherNo: laptopDistRvNo(row.iso, prevZa, 'ret'),
                source: LAPTOP_DIST_SOURCE,
                sourceRef: `${prevZa}-return`
            });
            if (ret.created) summary.returns += 1;
            else summary.skipped += 1;
        }

        const stock = itemByZa[row.za] || {
            itemId: row.cat.itemId,
            item: row.cat.name,
            category: 'ict-equipment'
        };
        const iv = laptopDistEnsureTxn(inv, {
            type: 'issue',
            date: row.iso,
            itemId: stock.itemId,
            item: stock.item,
            category: stock.category || 'ict-equipment',
            gl: '3112210001',
            qty: 1,
            serialOrZa: laptopDistZa(row.za),
            party: row.holder,
            appointment: row.person.appointment || '',
            description: `Q 1033/${row.za} — ${row.person.appointment} — ${row.cat.name}`,
            voucherNo: laptopDistIvNo(row.iso, row.za),
            source: LAPTOP_DIST_SOURCE,
            sourceRef: `${row.za}-issue`
        });
        if (iv.created) summary.issues += 1;
        else {
            summary.skipped += 1;
            if (iv.txn && !iv.txn.serialOrZa) {
                iv.txn.serialOrZa = laptopDistZa(row.za);
                summary.patched += 1;
            }
        }
    });

    inv[LAPTOP_DIST_AUG2026_KEY] = {
        applied: true,
        ivRev: LAPTOP_DIST_IV_REV,
        appliedAt: new Date().toISOString(),
        title: 'Distribution of laptops to IT Dir personnel as at 14 August 2026',
        personnel: IT_DIR_LAPTOP_DISTRIBUTION_AUG2026.length,
        ...summary
    };

    if (typeof saveState === 'function') saveState();
    if (typeof renderIctAccountabilityTable === 'function') renderIctAccountabilityTable();
    if (typeof renderProductStockRegister === 'function') renderProductStockRegister();
    if (typeof renderVoucherInventoryTables === 'function') renderVoucherInventoryTables();
    if (typeof updateDashboard === 'function') updateDashboard();

    return { ok: true, ...summary };
}

window.applyLaptopDistributionAug2026 = applyLaptopDistributionAug2026;
window.IT_DIR_LAPTOP_DISTRIBUTION_AUG2026 = IT_DIR_LAPTOP_DISTRIBUTION_AUG2026;
