/* universal-search.js — app-wide jump-to search (modules, GLs, Q forms, records, controlled stores) */

const UNIVERSAL_SEARCH_HISTORY_KEY = 'universal';

/** Kinds included when Dashboard Track is open (not full module catalogue). */
const TRACK_SEARCH_KINDS = new Set([
    'controlled',
    'stock',
    'requisition',
    'undelivered',
    'supplier-debt',
    'dp',
    'letter',
    'file',
    'document',
    'message',
    'personnel',
    'unit'
]);

/** Extra keywords so short queries like “memo” or “fuel” find the right module. */
const MODULE_SEARCH_ALIASES = {
    'it-dir-comms': 'memo memos compose memo letter letters correspondence sample correspondence load sample print letter fuel diesel generator standby IT/18 restricted communications portal comms request demand minutes directive',
    'orderly-room': 'daily file first sight correspondence files register letter DF fuel IT/18 orderly clerk',
    'purchase-orders': 'po purchase order sap supplier vendor material net value',
    'unit-requisitions': 'requisition indent demand minute sheet route import document loose minute zna unit formation brigade battalion directorate corps establishment',
    'doc-import': 'import document upload scan ocr paste loose minute quotation purchase order dp f1 spec delivery note',
    'notifications': 'alerts inbox messages compose',
    dashboard: 'notifications alerts kpis gl cards inbox messages',
    'process-guides': 'learning centre how to memo correspondence',
    'system-help': 'dictionary glossary help memo correspondence',
    'zna-q-forms-index': 'q forms catalogue annex',
    'suppliers-contracts': 'vendor supplier register G/C/006',
    'delivery-note': 'dn delivery note goods received supplier',
    'supplier-debts': 'creditors creditor supplier debt debts owed unpaid non-paid goods received age daf chase invoice po dampack creditors register',
    'workshop-repairs': 'workshop register repairs indent',
    'laptop-compare': 'laptop compare buy the winner rank laptops side by side specs recommended buy buy score ranking duty profile brand ram storage local catalog dp purchase order',
    'ict-compare': 'head to head h2h ict equipment compare crawl web duty profile laptop desktop server tablet printer workstation best buy ranking candidates',
    'specification-process': 'specs evaluation specification process zna it dir specification supplier quotation spec evaluation to spec below spec workshop engineers oc dp f1 due diligence cost comparative victus laptop printer',
    'spec-evaluation': 'technical specs spec tech evaluation below to spec datasheet classic infographic search',
    'stakeholder-desk': 'portals portal dp window gs branch daf due diligence aiad supplier desk login upload quotation endorsement creditors payment paid list manac',
    'portals-board': 'portals dashboard workflow procurement chart dp gs daf due diligence supplier requisition pfms purchase order',
    'voucher-module': 'issue voucher receipt rv iv stock',
    'temporary-loans': 'temporary loan za controlled stores 14 day',
    'permanent-loans': 'permanent loan laptop ipad comd/34 masasa za-no three year qs br mid wipe write-off'
};

function looksLikeControlledIdQuery(query) {
    const t = String(query || '').trim();
    if (!t) return false;
    if (typeof looksLikeZaNumber === 'function' && looksLikeZaNumber(t)) return true;
    if (/^za[\s-]?\d+/i.test(t)) return true;
    // Serial / manufacturer S/N patterns (printers, laptops, projectors, APs, etc.)
    if (/^(s\/?n|serial)[\s:.-]*/i.test(t)) return true;
    if (/^[A-Z0-9][A-Z0-9\-_/]{3,}$/i.test(t) && /[0-9]/.test(t) && /[A-Za-z]/.test(t)) return true;
    return false;
}

function normalizeSerialKey(value) {
    return String(value || '')
        .trim()
        .toUpperCase()
        .replace(/^(S\/?N|SERIAL)[\s:.\-]*/i, '')
        .replace(/[^A-Z0-9]/g, '');
}

function formatControlledLocationSubtitle(rec) {
    const where = typeof describeIctAccWhereabouts === 'function'
        ? describeIctAccWhereabouts(rec)
        : null;
    if (where?.primary) {
        return `Location: ${where.primary}${where.secondary ? ` · ${where.secondary}` : ''}`;
    }
    const unit = typeof resolveZnaUnitLabel === 'function'
        ? (resolveZnaUnitLabel(rec.unit) || rec.unit)
        : (rec.unit || '');
    const holder = [rec.holderName, rec.forceNo ? `(${rec.forceNo})` : ''].filter(Boolean).join(' ');
    if (unit && holder) return `Location: ${unit} · Issued to ${holder}`;
    if (unit) return `Location: ${unit}`;
    if (holder) return `Location: ${holder}`;
    if (rec.itDirLocation) return `Location: ${rec.itDirLocation}`;
    return 'Location: not recorded';
}

function collectControlledStoreSearchEntries(add) {
    const seenZa = new Set();
    const seenSerial = new Set();

    const pushAsset = (rec, extra = {}) => {
        const za = typeof normalizeZaNumber === 'function'
            ? normalizeZaNumber(rec.zaNumber)
            : String(rec.zaNumber || '').trim().toUpperCase();
        const serial = String(rec.serialNo || '').trim();
        const serialKey = normalizeSerialKey(serial);
        if (!za && !serialKey && !rec.designation && !rec.item) return;

        const idKey = za || serialKey || String(rec.id || rec.designation || '').toLowerCase();
        if (za) {
            if (seenZa.has(za)) return;
            seenZa.add(za);
        } else if (serialKey) {
            if (seenSerial.has(serialKey)) return;
            seenSerial.add(serialKey);
        }

        const designation = rec.designation || rec.item || 'Controlled store item';
        const idLabel = za || (serial ? `S/N ${serial}` : designation);
        const title = `${idLabel} — ${designation}`;
        const subtitle = formatControlledLocationSubtitle({
            ...rec,
            zaNumber: za || rec.zaNumber,
            statusMeta: rec.statusMeta || (typeof getIctAccStatusMeta === 'function' ? getIctAccStatusMeta(rec) : null)
        });
        const trackQuery = za || serial || rec.holderName || designation;
        const statusLabel = rec.statusMeta?.label
            || (typeof getIctAccStatusMeta === 'function' ? getIctAccStatusMeta(rec).label : (rec.status || ''));

        add({
            id: `ctrl-${idKey}`,
            kind: 'controlled',
            moduleId: extra.moduleId || 'ict-accountability',
            title,
            subtitle,
            haystack: [
                za, serial, serialKey, designation, rec.description, rec.item,
                rec.holderName, rec.forceNo, rec.unit, rec.itDirLocation,
                rec.traceRef, rec.form1033Ref, rec.boardRef, rec.form1045Ref, rec.remarks,
                rec.source, rec.scheduleSerial,
                statusLabel,
                'za serial sn laptop desktop printer projector tablet router access point controlled store issued personnel name boarded condemned backloaded survey destruction board schedule'
            ].filter(Boolean).join(' ').toLowerCase(),
            trackQuery,
            ictAccId: rec.id || '',
            scoreBoost: extra.scoreBoost || 0
        });
    };

    // Primary: ZNA ICT Asset Register (issued engraved / serialised equipment)
    if (typeof getIctAccountabilitySnapshot === 'function') {
        getIctAccountabilitySnapshot().forEach((rec) => {
            const hasId = !!(rec.zaNumber || rec.serialNo || rec.traceRef);
            if (!hasId && rec.assetClass !== 'equipment') return;
            pushAsset(rec, { scoreBoost: 8 });
        });
    } else if (Array.isArray(appState?.ictAccountability)) {
        appState.ictAccountability.forEach((rec) => pushAsset(rec, { scoreBoost: 8 }));
    }

    // Unit Equipment rows not yet on the register
    if (typeof collectUnitEquipmentRowsForZaLookup === 'function') {
        collectUnitEquipmentRowsForZaLookup().forEach((row) => {
            const za = typeof normalizeZaNumber === 'function'
                ? normalizeZaNumber(row.zaNumber)
                : String(row.zaNumber || '').trim().toUpperCase();
            if (za && seenZa.has(za)) return;
            pushAsset({
                id: `ue-${za || row.item}`,
                assetClass: 'equipment',
                designation: row.item || za || 'Unit equipment',
                description: row.description || '',
                zaNumber: za,
                serialNo: '',
                unit: row.holdingUnit || '',
                itDirLocation: row.location || '',
                status: row.holdingUnit ? 'issued' : 'in_stores',
                engraved: !!za
            }, { scoreBoost: 4 });
        });
    }

    // Active temporary loans (controlled stores issued out)
    if (typeof collectLoanRowsForZaLookup === 'function') {
        collectLoanRowsForZaLookup().forEach((loan) => {
            if (loan.dateReturned || loan.status?.key === 'returned' || loan.status?.key === 'returned_late') return;
            const za = typeof normalizeZaNumber === 'function'
                ? normalizeZaNumber(loan.zaNumber)
                : String(loan.zaNumber || '').trim().toUpperCase();
            const snMatch = String(`${loan.zaNumber || ''} ${loan.description || ''}`)
                .match(/(?:S\/?N|SERIAL)[\s:.\-]*([A-Z0-9\-_/]+)/i);
            const serial = snMatch ? snMatch[1] : '';
            if (za && seenZa.has(za)) return;
            pushAsset({
                id: `loan-${za || loan.rowIndex || loan.item}`,
                assetClass: 'equipment',
                designation: loan.item || za || 'Loan item',
                description: loan.description || '',
                zaNumber: za,
                serialNo: serial,
                holderName: loan.issuedTo || '',
                forceNo: loan.forceNo || '',
                unit: loan.unit || '',
                status: 'on_loan',
                engraved: !!za
            }, { moduleId: 'temporary-loans', scoreBoost: 6 });
        });
    }

    if (typeof collectPermanentLoanRows === 'function') {
        collectPermanentLoanRows().forEach((loan) => {
            if (loan.status?.key === 'returned' || loan.status?.key === 'personal') return;
            const za = typeof normalizeZaNumber === 'function'
                ? normalizeZaNumber(loan.zaNumber)
                : String(loan.zaNumber || '').trim().toUpperCase();
            if (za && seenZa.has(za)) return;
            if (za) seenZa.add(za);
            pushAsset({
                id: `perm-loan-${za || loan.id || loan.item}`,
                assetClass: 'equipment',
                designation: loan.item || za || 'Permanent loan',
                description: loan.description || '',
                zaNumber: za,
                serialNo: loan.serialNo || '',
                holderName: loan.issuedTo || '',
                forceNo: loan.forceNo || '',
                unit: loan.unit || '',
                status: 'on_perm_loan',
                engraved: !!za
            }, { moduleId: 'permanent-loans', scoreBoost: 7 });
        });
    }
}

/** Issued-to / holder names across register, loans, and stock issues. */
function collectPersonnelSearchEntries(add) {
    const byKey = new Map();

    const pushPerson = (name, forceNo, unit, extra = {}) => {
        const holder = String(name || '').trim();
        if (!holder || holder.length < 2) return;
        const key = `${holder.toLowerCase()}|${String(forceNo || '').trim().toLowerCase()}`;
        const prev = byKey.get(key);
        if (prev) {
            if (unit && !prev.units.includes(unit)) prev.units.push(unit);
            if (extra.za && !prev.zas.includes(extra.za)) prev.zas.push(extra.za);
            return;
        }
        byKey.set(key, {
            name: holder,
            forceNo: String(forceNo || '').trim(),
            units: unit ? [unit] : [],
            zas: extra.za ? [extra.za] : [],
            trackQuery: holder
        });
    };

    if (typeof getIctAccountabilitySnapshot === 'function') {
        getIctAccountabilitySnapshot().forEach((rec) => {
            if (!rec.holderName) return;
            const za = typeof normalizeZaNumber === 'function'
                ? normalizeZaNumber(rec.zaNumber)
                : String(rec.zaNumber || '').trim();
            pushPerson(rec.holderName, rec.forceNo, rec.unit, { za });
        });
    } else if (Array.isArray(appState?.ictAccountability)) {
        appState.ictAccountability.forEach((rec) => {
            if (rec.holderName) pushPerson(rec.holderName, rec.forceNo, rec.unit);
        });
    }

    if (typeof collectLoanRowsForZaLookup === 'function') {
        collectLoanRowsForZaLookup().forEach((loan) => {
            if (loan.issuedTo) pushPerson(loan.issuedTo, loan.forceNo, loan.unit);
        });
    }
    if (typeof collectPermanentLoanRows === 'function') {
        collectPermanentLoanRows().forEach((loan) => {
            if (loan.issuedTo) pushPerson(loan.issuedTo, loan.forceNo, loan.unit);
        });
    }

    const inv = typeof ensureStoresInventory === 'function'
        ? ensureStoresInventory()
        : (appState?.storesInventory || null);
    (inv?.transactions || []).forEach((txn) => {
        if (txn.type === 'issue' && txn.party) pushPerson(txn.party, '', '');
    });

    [...byKey.values()].slice(0, 200).forEach((p) => {
        const unitLabel = p.units.slice(0, 2).join(', ');
        add({
            id: `person-${p.name}-${p.forceNo || 'x'}`.toLowerCase().replace(/\s+/g, '-'),
            kind: 'personnel',
            moduleId: 'ict-accountability',
            title: p.forceNo ? `${p.name} (${p.forceNo})` : p.name,
            subtitle: [
                'Personnel',
                unitLabel ? `Unit: ${unitLabel}` : '',
                p.zas.length ? `ZA: ${p.zas.slice(0, 3).join(', ')}` : 'Issued / on loan'
            ].filter(Boolean).join(' · '),
            haystack: [
                p.name, p.forceNo, ...p.units, ...p.zas,
                'personnel person holder issued to force number name soldier officer'
            ].filter(Boolean).join(' ').toLowerCase(),
            trackQuery: p.trackQuery,
            scoreBoost: 5
        });
    });
}

/** ZNA units / formations — track by name or abbr. */
function collectUnitSearchEntries(add) {
    if (typeof flattenZnaUnits !== 'function') return;
    flattenZnaUnits().forEach((u) => {
        add({
            id: `unit-${u.value}`.toLowerCase().replace(/\s+/g, '-'),
            kind: 'unit',
            moduleId: 'unit-requisitions',
            title: u.label || u.value,
            subtitle: `Unit · ${u.group || 'ZNA establishment'}`,
            haystack: [
                u.label, u.value, u.name, u.abbr, u.group,
                'unit formation establishment barracks brigade battalion directorate corps zna'
            ].filter(Boolean).join(' ').toLowerCase(),
            unitValue: u.value,
            scoreBoost: 3
        });
    });
}

/** Orderly Room Daily File — letters, minutes, requisitions as documents. */
function collectOrderlyDocumentSearchEntries(add) {
    if (typeof ensureOrderlyDailyFile !== 'function') return;
    if (typeof syncUnitRequisitionsToOrderlyRoom === 'function') {
        try { syncUnitRequisitionsToOrderlyRoom(); } catch (_) { /* ignore */ }
    }
    ensureOrderlyDailyFile().slice(0, 120).forEach((row) => {
        const ref = row.refNo || row.fileRef || row.id || 'DF';
        const subject = row.subject || row.remarks || 'Daily File entry';
        const docKind = row.docType || 'document';
        add({
            id: `df-${row.id}`,
            kind: 'document',
            moduleId: 'orderly-room',
            title: `${ref} — ${subject}`.trim(),
            subtitle: [
                'Document',
                docKind.replace(/_/g, ' '),
                row.fromUnit || '',
                row.status || ''
            ].filter(Boolean).join(' · '),
            haystack: [
                ref, subject, row.fromUnit, row.docType, row.fileAs, row.status,
                row.remarks, row.receivedBy, row.priority, row.fileRef,
                'document letter loose minute requisition daily file correspondence first sight orderly'
            ].filter(Boolean).join(' ').toLowerCase(),
            orId: row.id,
            scoreBoost: 6
        });
    });
}

/** Office / In-Tray messages and letters. */
function collectOfficeMessageSearchEntries(add) {
    if (typeof ensureOfficeMessagesState !== 'function') return;
    ensureOfficeMessagesState().slice().reverse().slice(0, 100).forEach((msg) => {
        if (!msg?.id) return;
        const subject = msg.subject || '(no subject)';
        add({
            id: `om-${msg.id}`,
            kind: 'message',
            moduleId: 'it-dir-comms',
            title: subject,
            subtitle: [
                'Letter / message',
                msg.fromLabel || msg.fromDepartment || '',
                msg.toLabel || msg.toDepartment || '',
                msg.priority || ''
            ].filter(Boolean).join(' · '),
            haystack: [
                subject, msg.body, msg.fromDepartment, msg.fromLabel,
                msg.toDepartment, msg.toLabel, msg.priority,
                'letter message memo correspondence inbox compose office'
            ].filter(Boolean).join(' ').toLowerCase(),
            omId: msg.id,
            scoreBoost: 4
        });
    });
}

/** Receive/issue stock movements — searchable by issued-to name, voucher no., item. */
function collectStockMovementSearchEntries(add) {
    const inv = typeof ensureStoresInventory === 'function'
        ? ensureStoresInventory()
        : (appState?.storesInventory || null);
    if (!inv || !Array.isArray(inv.transactions)) return;

    inv.transactions.slice().reverse().slice(0, 150).forEach((txn) => {
        if (!txn?.id) return;
        const party = String(txn.party || '').trim();
        const voucher = String(txn.voucherNo || '').trim();
        const item = String(txn.item || '').trim();
        if (!party && !voucher && !item) return;

        const isIssue = txn.type === 'issue';
        add({
            id: `stk-${txn.id}`,
            kind: 'stock',
            moduleId: 'voucher-module',
            title: `${isIssue ? 'Issue' : 'Receive'} — ${party || item || voucher}`,
            subtitle: [txn.date, voucher, item].filter(Boolean).join(' · '),
            haystack: [
                party, voucher, item, txn.description, txn.appointment, txn.by, txn.type,
                txn.source, txn.sourceRef, txn.gl,
                isIssue ? 'issue issued to personnel' : 'receive receipt'
            ].filter(Boolean).join(' ').toLowerCase(),
            stockSearch: party || voucher || item,
            stockCategory: txn.category || 'ict-equipment',
            scoreBoost: isIssue && party ? 6 : 3
        });
    });
}

function collectUniversalSearchIndex() {
    const items = [];
    const seen = new Set();

    const add = (entry) => {
        if (!entry?.id || seen.has(entry.id + '|' + (entry.kind || ''))) return;
        if (typeof canAccessModule === 'function' && entry.moduleId && !canAccessModule(entry.moduleId)) return;
        seen.add(entry.id + '|' + (entry.kind || ''));
        items.push(entry);
    };

    // Sidebar / known modules
    document.querySelectorAll('.sidebar-menu a[data-target]').forEach((a) => {
        const id = a.getAttribute('data-target');
        if (!id) return;
        if (a.classList.contains('nav-hidden') || a.closest('li')?.classList.contains('nav-hidden')) return;
        const desk = a.getAttribute('data-stk-desk') || '';
        if (desk && typeof canAccessPortalDesk === 'function' && !canAccessPortalDesk(desk)) return;
        const navLabel = a.querySelector('.nav-label')?.textContent?.trim() || '';
        const label = desk
            ? navLabel
            : ((typeof getModuleLabel === 'function' ? getModuleLabel(id) : '') || navLabel || id);
        const groupEl = a.closest('.submenu')?.closest('li')?.querySelector('.nav-submenu-toggle .nav-label');
        const group = groupEl?.textContent?.trim()
            || (a.closest('.submenu') ? 'Submenu' : 'Modules');
        add({
            id: desk ? `mod-${id}-${desk}` : `mod-${id}`,
            kind: 'module',
            moduleId: id,
            stkDesk: desk,
            title: label,
            subtitle: group,
            haystack: `${id} ${label} ${group} ${desk} ${MODULE_SEARCH_ALIASES[id] || ''}`.toLowerCase()
        });
    });

    // GL accounts
    if (typeof GL_ACCOUNTS !== 'undefined') {
        Object.keys(GL_ACCOUNTS).forEach((code) => {
            const name = GL_ACCOUNTS[code]?.name || '';
            const moduleId = `gl-${code === '6122100009' ? '2200600002' : code}`;
            add({
                id: `gl-${code}`,
                kind: 'gl',
                moduleId,
                title: `GL ${code}`,
                subtitle: name,
                haystack: `gl ${code} ${name}`.toLowerCase()
            });
        });
    }

    // Q catalogue (in-system + reference → index)
    if (typeof ZNA_Q_CATALOGUE !== 'undefined') {
        ZNA_Q_CATALOGUE.forEach((e) => {
            const title = `ZNA-Q-${e.code} — ${e.title}`;
            add({
                id: `q-${e.code}`,
                kind: e.moduleId ? 'q-form' : 'q-ref',
                moduleId: e.moduleId || 'zna-q-forms-index',
                title,
                subtitle: e.moduleId ? 'In system' : 'Reference · open Index',
                haystack: `zna-q-${e.code} q${e.code} ${e.title} ${e.scope || ''}`.toLowerCase(),
                qCode: e.code
            });
        });
    }

    // Open unit requisitions
    const reqs = typeof ensureRequisitions === 'function' ? ensureRequisitions() : (appState?.requisitions || []);
    (reqs || []).slice(0, 120).forEach((req) => {
        const title = `${req.reqNo || 'Req'} — ${req.unit || ''} ${req.itemDescription || ''}`.trim();
        add({
            id: `req-${req.id}`,
            kind: 'requisition',
            moduleId: 'unit-requisitions',
            title,
            subtitle: `Requisition · ${req.status || ''}${req.priority ? ` · ${req.priority}` : ''}`,
            haystack: [
                req.reqNo, req.unit, req.originUnitDetail, req.itemDescription, req.category,
                req.subject, req.status, req.priority, req.fileRef, req.notes, req.justification,
                req.receivedThrough, 'requisition indent demand minute loose minute track'
            ].filter(Boolean).join(' ').toLowerCase(),
            reqId: req.id,
            scoreBoost: 4
        });
    });

    // Undelivered POs
    const und = typeof ensureUndelivered === 'function' ? ensureUndelivered() : (appState?.undeliveredOrders || []);
    (und || []).slice(0, 80).forEach((row) => {
        const title = `${row.poNo || 'PO'} — ${row.item || ''}`.trim();
        add({
            id: `und-${row.id}`,
            kind: 'undelivered',
            moduleId: 'undelivered-orders',
            title,
            subtitle: `Undelivered · ${row.supplier || ''}`,
            haystack: `${row.poNo || ''} ${row.item || ''} ${row.supplier || ''}`.toLowerCase(),
            undId: row.id
        });
    });

    const debts = typeof ensureSupplierDebts === 'function' ? ensureSupplierDebts() : (appState?.supplierDebts || []);
    (debts || []).slice(0, 80).forEach((rec) => {
        const usd = typeof sdCaseUsd === 'function' ? sdCaseUsd(rec) : rec.totalUsd;
        const age = typeof sdAgeLabel === 'function' ? sdAgeLabel(typeof sdAgeDays === 'function' ? sdAgeDays(rec) : 0) : '';
        add({
            id: `sd-${rec.id}`,
            kind: 'supplier-debt',
            moduleId: 'supplier-debts',
            title: `${rec.supplier || rec.caseNo || 'Supplier'} — USD ${usd}`,
            subtitle: `Debt · ${rec.status || ''} · ${age}`,
            haystack: `${rec.supplier || ''} ${rec.caseNo || ''} ${rec.minuteRef || ''} ${rec.description || ''} ${(rec.lines || []).map((l) => `${l.poNo || ''} ${l.invoiceNo || ''}`).join(' ')}`.toLowerCase(),
            sdId: rec.id
        });
    });

    // DP procurements
    const dps = typeof ensureDpProcurements === 'function' ? ensureDpProcurements() : (appState?.dpProcurements || []);
    (dps || []).slice(0, 80).forEach((rec) => {
        const title = `${rec.refNo || 'DP F1'} — ${rec.itemSummary || ''}`.trim();
        add({
            id: `dp-${rec.id}`,
            kind: 'dp',
            moduleId: 'dp-procurement',
            title,
            subtitle: `Procurement · ${rec.status || ''}`,
            haystack: `${rec.refNo || ''} ${rec.itemSummary || ''} ${rec.status || ''}`.toLowerCase(),
            dpId: rec.id
        });
    });

    // Issued / engraved controlled stores — track by ZA or Serial Number
    collectControlledStoreSearchEntries(add);

    // Stock receive/issue — party (issued to), voucher, item
    collectStockMovementSearchEntries(add);

    // Sample correspondence / letters (fuel request, etc.)
    const samples = typeof IT_DIR_CORRESPONDENCE_SAMPLES !== 'undefined'
        ? IT_DIR_CORRESPONDENCE_SAMPLES
        : [];
    samples.forEach((sample) => {
        add({
            id: `corr-sample-${sample.id}`,
            kind: 'letter',
            moduleId: 'it-dir-comms',
            title: sample.label || sample.subject || 'Sample correspondence',
            subtitle: `Sample letter · ${sample.fileRef || 'IT Dir Comms'}`,
            haystack: [
                sample.id, sample.label, sample.subject, sample.body, sample.fileRef,
                sample.fileTitle, sample.fuelType, sample.generatorSerial,
                'memo letter correspondence sample load sample print letter restricted fuel diesel generator standby'
            ].filter(Boolean).join(' ').toLowerCase(),
            corrSampleId: sample.id,
            scoreBoost: 12
        });
    });

    // Correspondence Files Register (IT/18 Fuel, etc.)
    const files = typeof CORRESPONDENCE_FILES_SEED !== 'undefined' ? CORRESPONDENCE_FILES_SEED : [];
    files.forEach((row) => {
        add({
            id: `corr-file-${row.ser || row.ref}`,
            kind: 'file',
            moduleId: 'orderly-room',
            title: `${row.ref || ''} — ${row.file || ''}`.trim(),
            subtitle: 'Correspondence Files Register',
            haystack: `${row.ref || ''} ${row.file || ''} correspondence file register letter document`.toLowerCase()
        });
    });

    // Daily File documents, office letters/messages, personnel, units
    collectOrderlyDocumentSearchEntries(add);
    collectOfficeMessageSearchEntries(add);
    collectPersonnelSearchEntries(add);
    collectUnitSearchEntries(add);

    // System Dictionary terms — jump to the live module when known
    if (typeof getSystemDictionaryFlat === 'function') {
        getSystemDictionaryFlat().forEach((row, i) => {
            const target = row.go && row.go !== 'system-help' ? row.go : 'system-help';
            add({
                id: `dict-${row.groupId}-${i}`,
                kind: 'dictionary',
                moduleId: target,
                title: row.t,
                subtitle: `Dictionary · ${row.groupTitle}`,
                haystack: `${row.t} ${row.d} ${row.w} ${row.groupTitle} dictionary glossary`.toLowerCase(),
                dictQuery: row.t,
                corrSampleId: /fuel/i.test(`${row.t} ${row.d}`) ? 'fuel-standby-generator' : ''
            });
        });
    }

    return items;
}

function rankUniversalHit(item, query) {
    const q = String(query || '').trim().toLowerCase();
    if (!q) return item.kind === 'module' ? 5 : (item.kind === 'controlled' ? 2 : 1);
    const h = item.haystack || '';
    const t = (item.title || '').toLowerCase();
    const words = h.split(/[^a-z0-9/]+/).filter(Boolean);
    let score = 0;
    if (t === q || h === q) score = 100;
    else if (t.startsWith(q) || h.startsWith(q)) score = 90;
    else if (t.includes(q)) score = 75;
    else if (h.includes(` ${q}`) || h.includes(`/${q}`) || words.includes(q)) score = 70;
    else if (h.includes(q)) score = 55;
    else {
        const tokens = q.split(/\s+/).filter(Boolean);
        if (tokens.length && tokens.every((tok) => h.includes(tok))) score = 45;
        else if (tokens.length && tokens.every((tok) => words.some((w) => w.startsWith(tok)))) score = 42;
    }
    if (!score) return 0;

    if (item.kind === 'letter' || item.kind === 'document' || item.kind === 'message') score += 18;
    if (item.kind === 'requisition' || item.kind === 'personnel' || item.kind === 'unit') score += 12;
    if (item.kind === 'module') score += 8;
    score += Number(item.scoreBoost || 0);

    // Prefer exact ZA / serial hits when the query looks like an engraved ID
    if (item.kind === 'controlled' && (looksLikeControlledIdQuery(query) || /^\d{2,6}$/.test(q))) {
        const zaQ = typeof normalizeZaNumber === 'function' ? normalizeZaNumber(query) : '';
        const snQ = normalizeSerialKey(query);
        const titleU = (item.title || '').toUpperCase();
        if (zaQ && (titleU.startsWith(zaQ) || titleU.includes(zaQ))) score += 50;
        else if (snQ && normalizeSerialKey(item.haystack).includes(snQ)) score += 35;
        else if (zaQ && (item.haystack || '').toUpperCase().includes(zaQ)) score += 45;
        else score += 15;
    }
    return score;
}

function searchUniversal(query, limit = 18, options = {}) {
    const q = String(query || '').trim();
    const trackMode = !!options.trackMode || !!options.controlledOnly;
    const lim = looksLikeControlledIdQuery(q) || trackMode ? Math.max(limit, 24) : limit;
    let items = collectUniversalSearchIndex();
    if (trackMode) {
        items = items.filter((item) => TRACK_SEARCH_KINDS.has(item.kind));
        if (!q) {
            const order = [
                'controlled', 'requisition', 'document', 'letter', 'message',
                'personnel', 'unit', 'undelivered', 'dp', 'stock', 'file', 'supplier-debt'
            ];
            const buckets = Object.fromEntries(order.map((k) => [k, []]));
            items.forEach((item) => {
                if (buckets[item.kind]) buckets[item.kind].push(item);
            });
            const caps = {
                controlled: 6, requisition: 5, document: 4, letter: 3, message: 3,
                personnel: 4, unit: 4, undelivered: 2, dp: 2, stock: 2, file: 2, 'supplier-debt': 2
            };
            const preview = [];
            order.forEach((k) => {
                preview.push(...buckets[k].sort((a, b) => a.title.localeCompare(b.title)).slice(0, caps[k] || 2));
            });
            return preview.slice(0, lim);
        }
    }
    return items
        .map((item) => ({ item, score: rankUniversalHit(item, q) }))
        .filter((r) => r.score > 0)
        .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title))
        .slice(0, lim)
        .map((r) => r.item);
}

function ensureUniversalSearchUi() {
    let modal = document.getElementById('universalSearchModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'universalSearchModal';
        modal.className = 'universal-search-modal';
        modal.hidden = true;
        modal.innerHTML = `
        <div class="universal-search-backdrop" data-us-close></div>
        <div class="universal-search-panel" role="dialog" aria-modal="true" aria-labelledby="universalSearchTitle">
            <div class="universal-search-head">
                <h3 id="universalSearchTitle">Universal search</h3>
                <div class="universal-search-window-controls" role="group" aria-label="Window controls">
                    <kbd class="universal-search-hint">Esc</kbd>
                    <button type="button" class="us-win-btn" id="universalSearchMaximizeBtn" title="Maximize" aria-label="Maximize">▢</button>
                    <button type="button" class="us-win-btn us-win-close" id="universalSearchCloseBtn" title="Close" aria-label="Close">✕</button>
                </div>
            </div>
            <input type="search" id="universalSearchInput" class="form-control universal-search-input"
                placeholder="Search anything — name, ZA / S/N, memo, fuel, PO, modules…"
                data-search-history-key="${UNIVERSAL_SEARCH_HISTORY_KEY}"
                autocomplete="off" spellcheck="false">
            <div id="universalSearchResults" class="universal-search-results" role="listbox"></div>
            <p class="universal-search-foot muted">Names (issued to) · <kbd>ZA</kbd> / <kbd>S/N</kbd> · memo, fuel, PO · <kbd>Ctrl</kbd>+<kbd>K</kbd> · Enter to open</p>
        </div>`;
        document.body.appendChild(modal);
    } else if (!document.getElementById('universalSearchMaximizeBtn')) {
        const head = modal.querySelector('.universal-search-head');
        if (head) {
            head.querySelector('.universal-search-hint')?.remove();
            const controls = document.createElement('div');
            controls.className = 'universal-search-window-controls';
            controls.setAttribute('role', 'group');
            controls.setAttribute('aria-label', 'Window controls');
            controls.innerHTML = `
                <kbd class="universal-search-hint">Esc</kbd>
                <button type="button" class="us-win-btn" id="universalSearchMaximizeBtn" title="Maximize" aria-label="Maximize">▢</button>
                <button type="button" class="us-win-btn us-win-close" id="universalSearchCloseBtn" title="Close" aria-label="Close">✕</button>`;
            head.appendChild(controls);
        }
    }

    if (modal.dataset.usWired === '1') return;
    modal.dataset.usWired = '1';

    modal.querySelector('[data-us-close]')?.addEventListener('click', closeUniversalSearch);
    document.getElementById('universalSearchCloseBtn')?.addEventListener('click', closeUniversalSearch);
    document.getElementById('universalSearchMaximizeBtn')?.addEventListener('click', toggleMaximizeUniversalSearch);

    const input = document.getElementById('universalSearchInput');
    input?.addEventListener('input', () => {
        const mode = document.getElementById('universalSearchModal')?.dataset.mode;
        renderUniversalSearchResults(input.value, { trackMode: mode === 'track' });
    });
    input?.addEventListener('keydown', (e) => {
        const list = document.getElementById('universalSearchResults');
        const items = [...(list?.querySelectorAll('[data-us-index]') || [])];
        const active = list?.querySelector('.is-active');
        let idx = active ? Number(active.getAttribute('data-us-index')) : -1;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            idx = Math.min(items.length - 1, idx + 1);
            setUniversalActive(idx);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            idx = Math.max(0, idx - 1);
            setUniversalActive(idx);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const pick = list?.querySelector('.is-active') || items[0];
            if (pick) activateUniversalResult(pick);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            closeUniversalSearch();
        }
    });
    document.getElementById('universalSearchResults')?.addEventListener('click', (e) => {
        const row = e.target.closest('[data-us-index]');
        if (row) activateUniversalResult(row);
    });
}

function toggleMaximizeUniversalSearch() {
    const modal = document.getElementById('universalSearchModal');
    const maxBtn = document.getElementById('universalSearchMaximizeBtn');
    if (!modal) return;
    const next = !modal.classList.contains('is-maximized');
    modal.classList.toggle('is-maximized', next);
    if (maxBtn) {
        maxBtn.textContent = next ? '❐' : '▢';
        maxBtn.title = next ? 'Restore' : 'Maximize';
        maxBtn.setAttribute('aria-label', next ? 'Restore' : 'Maximize');
    }
    requestAnimationFrame(() => {
        document.getElementById('universalSearchInput')?.focus();
    });
}

function resetUniversalSearchWindow() {
    const modal = document.getElementById('universalSearchModal');
    const maxBtn = document.getElementById('universalSearchMaximizeBtn');
    if (!modal) return;
    modal.classList.remove('is-maximized');
    if (maxBtn) {
        maxBtn.textContent = '▢';
        maxBtn.title = 'Maximize';
        maxBtn.setAttribute('aria-label', 'Maximize');
    }
}

function setUniversalActive(idx) {
    const list = document.getElementById('universalSearchResults');
    if (!list) return;
    list.querySelectorAll('[data-us-index]').forEach((el) => {
        el.classList.toggle('is-active', Number(el.getAttribute('data-us-index')) === idx);
    });
    list.querySelector('.is-active')?.scrollIntoView({ block: 'nearest' });
}

function kindBadge(kind) {
    const map = {
        module: 'Module',
        gl: 'GL',
        'q-form': 'Q form',
        'q-ref': 'Q ref',
        requisition: 'Req',
        undelivered: 'PO',
        'supplier-debt': 'Debt',
        dp: 'DP',
        dictionary: 'Dict',
        letter: 'Letter',
        file: 'File',
        document: 'Doc',
        message: 'Msg',
        personnel: 'Person',
        unit: 'Unit',
        controlled: 'ZA / S/N',
        stock: 'Stock'
    };
    return map[kind] || 'Go';
}

function escapeUs(v) {
    return String(v ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function renderUniversalSearchResults(query, options = {}) {
    const host = document.getElementById('universalSearchResults');
    if (!host) return;
    const trackMode = !!options.trackMode
        || !!options.controlledOnly
        || document.getElementById('universalSearchModal')?.dataset.mode === 'track';
    const hits = searchUniversal(query, 18, { trackMode });
    if (!hits.length) {
        host.innerHTML = trackMode
            ? `<div class="universal-search-empty">No track hits for “${escapeUs(query)}”. Try a <strong>ZA / S/N</strong>, requisition no., letter subject, person name, unit, or document ref.</div>`
            : `<div class="universal-search-empty">No matches for “${escapeUs(query)}”. Try a <strong>name</strong> (issued to), ZA / Q 1033 ref, memo, fuel, PO, or module name. Refresh the page if you just imported data.</div>`;
        return;
    }
    host.innerHTML = hits.map((item, i) => `
        <button type="button" class="universal-search-item${i === 0 ? ' is-active' : ''}"
            role="option" data-us-index="${i}"
            data-module="${escapeUs(item.moduleId || '')}"
            data-req-id="${escapeUs(item.reqId || '')}"
            data-und-id="${escapeUs(item.undId || '')}"
            data-sd-id="${escapeUs(item.sdId || '')}"
            data-dp-id="${escapeUs(item.dpId || '')}"
            data-q-code="${escapeUs(item.qCode || '')}"
            data-dict-query="${escapeUs(item.dictQuery || '')}"
            data-corr-sample="${escapeUs(item.corrSampleId || '')}"
            data-track-query="${escapeUs(item.trackQuery || '')}"
            data-ict-acc-id="${escapeUs(item.ictAccId || '')}"
            data-stock-search="${escapeUs(item.stockSearch || '')}"
            data-stock-category="${escapeUs(item.stockCategory || '')}"
            data-or-id="${escapeUs(item.orId || '')}"
            data-om-id="${escapeUs(item.omId || '')}"
            data-unit-value="${escapeUs(item.unitValue || '')}"
            data-stk-desk="${escapeUs(item.stkDesk || '')}">
            <span class="universal-search-badge">${escapeUs(kindBadge(item.kind))}</span>
            <span class="universal-search-text">
                <strong>${escapeUs(item.title)}</strong>
                <small>${escapeUs(item.subtitle || '')}</small>
            </span>
        </button>
    `).join('');
}

async function activateUniversalResult(el) {
    const moduleId = el.getAttribute('data-module');
    const reqId = el.getAttribute('data-req-id');
    const undId = el.getAttribute('data-und-id');
    const sdId = el.getAttribute('data-sd-id');
    const dpId = el.getAttribute('data-dp-id');
    const qCode = el.getAttribute('data-q-code');
    const dictQuery = el.getAttribute('data-dict-query');
    const corrSample = el.getAttribute('data-corr-sample');
    const trackQuery = el.getAttribute('data-track-query');
    const ictAccId = el.getAttribute('data-ict-acc-id');
    const stockSearch = el.getAttribute('data-stock-search');
    const stockCategory = el.getAttribute('data-stock-category');
    const orId = el.getAttribute('data-or-id');
    const omId = el.getAttribute('data-om-id');
    const unitValue = el.getAttribute('data-unit-value');
    const stkDesk = el.getAttribute('data-stk-desk');
    const q = document.getElementById('universalSearchInput')?.value || '';
    if (q && typeof rememberSearchTerm === 'function') {
        rememberSearchTerm(UNIVERSAL_SEARCH_HISTORY_KEY, q);
    }
    closeUniversalSearch();
    if (corrSample && typeof openCorrespondenceSampleInComms === 'function') {
        await openCorrespondenceSampleInComms(corrSample);
        return;
    }
    if (!moduleId || typeof navigateToModule !== 'function') return;

    let targetModule = moduleId;
    if (trackQuery && (moduleId === 'ict-accountability' || moduleId === 'temporary-loans' || moduleId === 'permanent-loans')) {
        if (typeof canAccessModule === 'function' && canAccessModule('ict-accountability')) {
            targetModule = 'ict-accountability';
        }
    }

    await navigateToModule(targetModule, stkDesk ? { stkDesk } : {});

    if (stockSearch && moduleId === 'voucher-module') {
        setTimeout(() => {
            const cat = stockCategory || 'ict-equipment';
            document.querySelector(`#voucherInvTabs .voucher-inv-tab[data-inv-tab="${cat}"]`)?.click();
            if (typeof setInvMovementFilters === 'function') {
                setInvMovementFilters(cat, { item: stockSearch, description: stockSearch });
            } else {
                const itemInput = document.querySelector(
                    `[data-inv-filters-target="voucher-inv-body-${cat}"] [data-inv-filter="item"]`
                );
                if (itemInput) {
                    itemInput.value = stockSearch;
                    itemInput.dispatchEvent(new Event('input', { bubbles: true }));
                }
            }
            document.querySelector(`[data-inv-filters-target="voucher-inv-body-${cat}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 120);
        return;
    }

    if (trackQuery && targetModule === 'ict-accountability') {
        const runTrack = () => {
            const input = document.getElementById('ictAccTrackQuery');
            if (input) input.value = trackQuery;
            if (typeof runIctAccTrack === 'function') runIctAccTrack();
            else if (typeof renderIctAccTrackResults === 'function') renderIctAccTrackResults(trackQuery);
            document.getElementById('ictAccTrackPanel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            if (ictAccId && typeof fillIctAccForm === 'function') {
                const rec = typeof ensureIctAccountability === 'function'
                    ? ensureIctAccountability().find((r) => r.id === ictAccId)
                    : null;
                if (rec) fillIctAccForm(rec);
            }
        };
        setTimeout(runTrack, 80);
        return;
    }

    setTimeout(() => {
        if (reqId && typeof editRequisition === 'function') editRequisition(reqId);
        if (undId && typeof editUndelivered === 'function') editUndelivered(undId);
        if (sdId && typeof editSupplierDebt === 'function') editSupplierDebt(sdId);
        if (dpId && typeof editDpProcurement === 'function') editDpProcurement(dpId);
        if (orId && typeof fillOrderlyRoomForm === 'function') {
            const row = typeof ensureOrderlyDailyFile === 'function'
                ? ensureOrderlyDailyFile().find((r) => r.id === orId)
                : null;
            if (row) fillOrderlyRoomForm(row);
            document.getElementById('orEditId')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        if (omId) {
            const msgEl = document.querySelector(`[data-om-id="${omId}"], [data-message-id="${omId}"]`);
            msgEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            msgEl?.classList?.add('is-highlight');
        }
        if (unitValue) {
            const unitField = document.getElementById('reqUnit')
                || document.getElementById('reqOriginUnit')
                || document.querySelector('[data-zna-unit], #reqFilterUnit, [name="unit"]');
            if (unitField) {
                if (typeof setZnaUnitField === 'function') setZnaUnitField(unitField, unitValue);
                else {
                    unitField.value = unitValue;
                    unitField.dispatchEvent(new Event('input', { bubbles: true }));
                    unitField.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }
            const filter = document.getElementById('reqSearch') || document.getElementById('reqFilter');
            if (filter) {
                filter.value = unitValue;
                filter.dispatchEvent(new Event('input', { bubbles: true }));
            }
        }
        if (qCode && moduleId === 'zna-q-forms-index') {
            const search = document.getElementById('znaQIndexSearch');
            if (search) {
                search.value = qCode;
                search.dispatchEvent(new Event('input'));
            }
        }
        if (dictQuery && moduleId === 'system-help') {
            if (typeof initSystemDictionary === 'function') initSystemDictionary();
            const search = document.getElementById('systemDictionarySearch');
            const group = document.getElementById('systemDictionaryGroup');
            if (group) group.value = 'all';
            if (search) {
                search.value = dictQuery;
                search.dispatchEvent(new Event('input'));
                search.focus();
            }
            document.getElementById('systemDictionary')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, 60);
}

function openUniversalSearch(prefill = '', options = {}) {
    if (document.body.classList.contains('app-locked')) return;
    ensureUniversalSearchUi();
    const modal = document.getElementById('universalSearchModal');
    const input = document.getElementById('universalSearchInput');
    const title = document.getElementById('universalSearchTitle');
    if (!modal || !input) return;
    const trackMode = !!options.trackMode;
    modal.dataset.mode = trackMode ? 'track' : 'all';
    if (!options.keepMaximized) resetUniversalSearchWindow();
    if (title) {
        title.textContent = trackMode
            ? 'Track — stores, docs, reqs, letters, people, units'
            : 'Universal search';
    }
    input.placeholder = trackMode
        ? 'ZA / S/N, requisition, letter, person, unit, document ref…'
        : 'Search anything — name, ZA / S/N, memo, fuel, PO, modules…';
    modal.hidden = false;
    document.body.classList.add('universal-search-open');
    input.value = prefill || '';
    renderUniversalSearchResults(input.value, { trackMode });
    requestAnimationFrame(() => {
        input.focus();
        input.select();
    });
}

/** Dashboard Track — stores (ZA/S/N), documents, requisitions, letters, personnel, units, etc. */
function openControlledStoreTrack(prefill = '') {
    openUniversalSearch(prefill, { trackMode: true });
}

function closeUniversalSearch() {
    const modal = document.getElementById('universalSearchModal');
    if (modal) {
        modal.hidden = true;
        modal.dataset.mode = 'all';
        resetUniversalSearchWindow();
    }
    document.body.classList.remove('universal-search-open');
}

function initUniversalSearch() {
    if (document.body.dataset.universalSearchInit === '1') return;
    document.body.dataset.universalSearchInit = '1';
    ensureUniversalSearchUi();

    // Event delegation — works even if buttons are re-rendered
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-universal-search], #universalSearchBtn, #headerSearchBtn');
        if (!btn) return;
        if (typeof canSeeStoresOpsDashboard === 'function' && !canSeeStoresOpsDashboard()) return;
        e.preventDefault();
        openUniversalSearch();
    });

    const dashInput = document.getElementById('dashboardUniversalSearchInput');
    if (dashInput) {
        const openFromField = (e) => {
            if (typeof canSeeStoresOpsDashboard === 'function' && !canSeeStoresOpsDashboard()) return;
            e.preventDefault();
            openUniversalSearch(String(dashInput.value || '').trim());
        };
        dashInput.addEventListener('focus', openFromField);
        dashInput.addEventListener('click', openFromField);
        dashInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') openFromField(e);
        });
    }

    document.addEventListener('keydown', (e) => {
        if (document.body.classList.contains('app-locked')) return;
        const tag = (e.target && e.target.tagName) || '';
        const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target?.isContentEditable;
        if ((e.ctrlKey || e.metaKey) && String(e.key).toLowerCase() === 'k') {
            if (typeof canSeeStoresOpsDashboard === 'function' && !canSeeStoresOpsDashboard()) return;
            e.preventDefault();
            openUniversalSearch();
            return;
        }
        if (!typing && e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
            e.preventDefault();
            openUniversalSearch();
        }
        if (e.key === 'Escape' && document.body.classList.contains('universal-search-open')) {
            closeUniversalSearch();
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initUniversalSearch();
});
// Also init after late boot in case DOMContentLoaded already fired
if (document.readyState !== 'loading') {
    setTimeout(initUniversalSearch, 0);
}
