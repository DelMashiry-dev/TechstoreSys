/* laptop-distribution-aug2026.js — IT Dir laptop distribution (14 Aug 2026)
 * Source: LAP-TOPS.docx — DISTRIBUTION OF LAPTOPS TO IT DIR PERSONNEL AS AT 14 AUGUST 2026
 * Rule: one active ZNA Q 1033 per person — return initial issue before second issue.
 */

const LAPTOP_DIST_AUG2026_KEY = 'laptopDistributionAug2026';
const LAPTOP_DIST_SOURCE = 'laptop-distribution-aug2026';

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

function laptopDistForm1033Ref(za) {
    const z = String(za || '').trim();
    return z ? `Q1033/${z}` : '';
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

function laptopDistPostStock(payload) {
    if (typeof postStockTransaction === 'function') {
        return postStockTransaction({ ...payload, silent: true, skipRender: true, allowDuplicateCustody: true });
    }
    const inv = typeof ensureStoresInventory === 'function'
        ? ensureStoresInventory()
        : (appState.storesInventory = appState.storesInventory || { openings: {}, transactions: [] });
    if (!Array.isArray(inv.transactions)) inv.transactions = [];
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
        voucherNo: payload.voucherNo || '',
        party: payload.party || '',
        source: payload.source || LAPTOP_DIST_SOURCE,
        sourceRef: payload.sourceRef || '',
        by: 'Laptop distribution import',
        createdAt: new Date().toISOString()
    };
    inv.transactions.push(txn);
    return txn;
}

function laptopDistTxnExists(transactions, sourceRef, type) {
    return (transactions || []).some((t) =>
        t.source === LAPTOP_DIST_SOURCE && t.sourceRef === sourceRef && t.type === type
    );
}

/** Import distribution register + Aug 2026 stock movements (returns before re-issues). Idempotent. */
function applyLaptopDistributionAug2026(opts = {}) {
    if (!appState) return { ok: false, reason: 'no-state' };
    const force = !!opts.force;
    const inv = typeof ensureStoresInventory === 'function'
        ? ensureStoresInventory()
        : (appState.storesInventory = appState.storesInventory || { openings: {}, transactions: [] });
    if (!inv[LAPTOP_DIST_AUG2026_KEY]?.applied && !force) {
        // continue — may be partial
    }

    const ictList = typeof ensureIctAccountability === 'function'
        ? ensureIctAccountability()
        : (appState.ictAccountability = appState.ictAccountability || []);

    const summary = {
        ictRecords: 0,
        returns: 0,
        issues: 0,
        holdersActive: 0,
        skipped: 0
    };

    IT_DIR_LAPTOP_DISTRIBUTION_AUG2026.forEach((person) => {
        const holder = laptopDistHolderLabel(person);
        const issues = (person.issues || []).slice().sort((a, b) =>
            laptopDistParseDate(a.date).localeCompare(laptopDistParseDate(b.date))
        );

        issues.forEach((issue, idx) => {
            const iso = laptopDistParseDate(issue.date);
            const isLast = idx === issues.length - 1;
            const isAug2026Issue = iso >= '2026-08-01' && issue.model;
            const status = isLast ? 'issued' : 'returned';
            const cat = issue.model ? LAPTOP_DIST_CATALOG[issue.model] : LAPTOP_DIST_CATALOG.legacy;
            const zaKey = issue.za ? `ZA${issue.za}` : `nodza-${person.name.replace(/\s+/g, '-')}-${idx}`;

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

            if (!isAug2026Issue) return;

            const returnRef = `${issue.za}-return`;
            const issueRef = `${issue.za}-issue`;

            if (idx > 0 && !laptopDistTxnExists(inv.transactions, returnRef, 'receipt')) {
                laptopDistPostStock({
                    type: 'receipt',
                    date: laptopDistDayBefore(iso),
                    itemId: LAPTOP_DIST_CATALOG.legacy.itemId,
                    item: LAPTOP_DIST_CATALOG.legacy.name,
                    category: 'ict-equipment',
                    gl: '3112210001',
                    qty: 1,
                    party: holder,
                    description: `Return of initial/previous laptop before Q 1033/${issue.za} — ${person.name}`,
                    voucherNo: `RV/IT/0826/RET-${issue.za}`,
                    source: LAPTOP_DIST_SOURCE,
                    sourceRef: returnRef,
                    laptopReturn: true
                });
                summary.returns += 1;
            } else if (idx > 0) {
                summary.skipped += 1;
            }

            if (!laptopDistTxnExists(inv.transactions, issueRef, 'issue')) {
                laptopDistPostStock({
                    type: 'issue',
                    date: iso,
                    itemId: cat.itemId,
                    item: cat.name,
                    category: 'ict-equipment',
                    gl: '3112210001',
                    qty: 1,
                    party: holder,
                    description: `Q 1033/${issue.za} — ${person.appointment}`,
                    voucherNo: `IV/IT/0826/${issue.za}`,
                    source: LAPTOP_DIST_SOURCE,
                    sourceRef: issueRef,
                    allowDuplicateCustody: true
                });
                summary.issues += 1;
            } else {
                summary.skipped += 1;
            }
        });
    });

    inv[LAPTOP_DIST_AUG2026_KEY] = {
        applied: true,
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
