/* universal-search.js — app-wide jump-to search (modules, GLs, Q forms, records, controlled stores) */

const UNIVERSAL_SEARCH_HISTORY_KEY = 'universal';

/** Extra keywords so short queries like “memo” or “fuel” find the right module. */
const MODULE_SEARCH_ALIASES = {
    'it-dir-comms': 'memo memos compose memo letter letters correspondence sample correspondence load sample print letter fuel diesel generator standby IT/18 restricted communications portal comms request demand minutes directive',
    'orderly-room': 'daily file first sight correspondence files register letter DF fuel IT/18 orderly clerk',
    'purchase-orders': 'po purchase order sap supplier vendor material net value',
    'unit-requisitions': 'requisition indent demand minute sheet route import document loose minute',
    'doc-import': 'import document upload scan ocr paste loose minute quotation purchase order dp f1 spec delivery note',
    'notifications': 'alerts inbox messages compose',
    dashboard: 'notifications alerts kpis gl cards inbox messages',
    'process-guides': 'learning centre how to memo correspondence',
    'system-help': 'dictionary glossary help memo correspondence',
    'zna-q-forms-index': 'q forms catalogue annex',
    'suppliers-contracts': 'vendor supplier register G/C/006',
    'delivery-note': 'dn delivery note goods received supplier',
    'supplier-debts': 'supplier debt debts owed unpaid non-paid goods received age daf chase invoice po dampack',
    'workshop-repairs': 'workshop register repairs indent',
    'ict-compare': 'head to head compare laptop buy purchase duty profile crawl market benchmark FPS workstation rugged',
    'stakeholder-desk': 'portals portal dp window gs branch daf due diligence aiad supplier desk login upload quotation endorsement',
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
    (reqs || []).slice(0, 80).forEach((req) => {
        const title = `${req.reqNo || 'Req'} — ${req.unit || ''} ${req.itemDescription || ''}`.trim();
        add({
            id: `req-${req.id}`,
            kind: 'requisition',
            moduleId: 'unit-requisitions',
            title,
            subtitle: `Requisition · ${req.status || ''}`,
            haystack: `${req.reqNo || ''} ${req.unit || ''} ${req.itemDescription || ''} ${req.category || ''}`.toLowerCase(),
            reqId: req.id
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
            haystack: `${row.ref || ''} ${row.file || ''} correspondence file register letter`.toLowerCase()
        });
    });

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

    if (item.kind === 'letter') score += 18;
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
    const controlledOnly = !!options.controlledOnly;
    const lim = looksLikeControlledIdQuery(q) || controlledOnly ? Math.max(limit, 20) : limit;
    let items = collectUniversalSearchIndex();
    if (controlledOnly) {
        items = items.filter((item) => item.kind === 'controlled');
        if (!q) {
            return items
                .sort((a, b) => a.title.localeCompare(b.title))
                .slice(0, lim);
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
        renderUniversalSearchResults(input.value, { controlledOnly: mode === 'track' });
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
    const controlledOnly = !!options.controlledOnly
        || document.getElementById('universalSearchModal')?.dataset.mode === 'track';
    const hits = searchUniversal(query, 18, { controlledOnly });
    if (!hits.length) {
        host.innerHTML = controlledOnly
            ? `<div class="universal-search-empty">No serialised / ZA-engraved items found yet. Register them on <strong>ZNA ICT Asset Register</strong> or Unit Equipment first.</div>`
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
            ? 'Track controlled stores (ZA / S/N)'
            : 'Universal search';
    }
    input.placeholder = trackMode
        ? 'Type ZA number or serial number to find location…'
        : 'Search anything — name, ZA / S/N, memo, fuel, PO, modules…';
    modal.hidden = false;
    document.body.classList.add('universal-search-open');
    input.value = prefill || '';
    renderUniversalSearchResults(input.value, { controlledOnly: trackMode });
    requestAnimationFrame(() => {
        input.focus();
        input.select();
    });
}

/** Dashboard Track — list / find location of ZA-engraved and serialised issued stores. */
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
