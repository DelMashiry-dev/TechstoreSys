/* stores-query-engine.js — Craft stores queries (issues, receipts, custody) with params + table results */

const STORES_QUERY_UI_VERSION = '3';

const STORES_QUERY_TEMPLATES = {
    'stock-issues': {
        id: 'stock-issues',
        label: 'Items issued out',
        description: 'Stock issue movements (Q 1033 / IV) by date, category, item, or issued-to name.',
        moduleId: 'voucher-module',
        icon: '−'
    },
    'stock-receipts': {
        id: 'stock-receipts',
        label: 'Items received in',
        description: 'Stock receipt movements (RV) by date, category, or item.',
        moduleId: 'voucher-module',
        icon: '＋'
    },
    'stock-movements': {
        id: 'stock-movements',
        label: 'Receive & issue movements',
        description: 'All stock movements in a period.',
        moduleId: 'voucher-module',
        icon: '↕'
    },
    'ict-custody': {
        id: 'ict-custody',
        label: 'ICT asset custody',
        description: 'ZNA ICT Asset Register — who holds equipment, Q 1033 refs, issue dates.',
        moduleId: 'ict-accountability',
        icon: 'ZA'
    },
    'boarded-condemned': {
        id: 'boarded-condemned',
        label: 'Boarded / condemned assets',
        description: 'ICT Asset Register — board of survey schedule (ZNA/Q/121), condemned, and disposal chain.',
        moduleId: 'ict-accountability',
        icon: '⊘',
        queryKind: 'ict-custody'
    },
    'temporary-loans': {
        id: 'temporary-loans',
        label: 'Temporary loans',
        description: 'Short-term loan register — active, returned, or overdue in a period.',
        moduleId: 'temporary-loans',
        icon: '⏱'
    },
    'permanent-loans': {
        id: 'permanent-loans',
        label: 'Permanent loans (laptops / iPads)',
        description: 'Comd/34 permanent loan register — serving, 3-year due, return on retirement, or personal.',
        moduleId: 'permanent-loans',
        icon: '💻'
    }
};

function sqEscapeHtml(v) {
    return String(v ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function sqIsoStartOfMonth(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

function sqIsoEndOfMonth(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()).padStart(2, '0')}`;
}

function sqInPeriod(dateStr, dateFrom, dateTo) {
    const d = String(dateStr || '').slice(0, 10);
    if (!d) return !dateFrom && !dateTo;
    if (dateFrom && d < dateFrom) return false;
    if (dateTo && d > dateTo) return false;
    return true;
}

function sqIctRecordDate(rec) {
    return rec.issueDate || rec.receivedDate || rec.boardDate
        || String(rec.updatedAt || rec.createdAt || '').slice(0, 10) || '';
}

function sqResolveQueryKind(templateId) {
    const tpl = STORES_QUERY_TEMPLATES[templateId];
    return tpl?.queryKind || templateId;
}

function sqIctStatusMatches(rec, status, ictStatuses) {
    const key = rec.status || '';
    if (Array.isArray(ictStatuses) && ictStatuses.length) {
        return ictStatuses.includes(key);
    }
    if (!status || status === 'all') return true;
    return key === status;
}

function parseStoresQueryStatusHints(question) {
    if (typeof matchIctStatusQuery !== 'function') return null;
    const statuses = matchIctStatusQuery(question);
    if (!statuses?.length) return null;
    return {
        ictStatuses: statuses,
        dateFrom: '',
        dateTo: '',
        templateId: /\b(boarded|condemned|survey|disposal|backloaded|destruction)\b/i.test(question)
            ? 'boarded-condemned'
            : 'ict-custody'
    };
}

function sqMonthIndex(name) {
    const map = {
        jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2,
        apr: 3, april: 3, may: 4, jun: 5, june: 5, jul: 6, july: 6,
        aug: 7, august: 7, sep: 8, sept: 8, september: 8,
        oct: 9, october: 9, nov: 10, november: 10, dec: 11, december: 11
    };
    return map[String(name || '').toLowerCase()];
}

/** Parse natural-language period hints from assistant questions. */
function parseStoresQueryPeriodHints(question) {
    const q = String(question || '').toLowerCase();
    const hints = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (/\bthis month\b/.test(q)) {
        hints.dateFrom = sqIsoStartOfMonth(today);
        hints.dateTo = sqIsoEndOfMonth(today);
        return hints;
    }
    if (/\blast month\b/.test(q)) {
        const d = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        hints.dateFrom = sqIsoStartOfMonth(d);
        hints.dateTo = sqIsoEndOfMonth(d);
        return hints;
    }
    if (/\bthis year\b/.test(q)) {
        hints.dateFrom = `${today.getFullYear()}-01-01`;
        hints.dateTo = `${today.getFullYear()}-12-31`;
        return hints;
    }
    if (/\blast (\d{1,3}) days?\b/.test(q)) {
        const m = q.match(/\blast (\d{1,3}) days?\b/);
        const days = Math.min(365, parseInt(m[1], 10) || 30);
        const from = new Date(today);
        from.setDate(from.getDate() - days);
        hints.dateFrom = from.toISOString().slice(0, 10);
        hints.dateTo = today.toISOString().slice(0, 10);
        return hints;
    }

    const monthYear = q.match(/\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sept?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{4})\b/);
    if (monthYear) {
        const mi = sqMonthIndex(monthYear[1]);
        const year = parseInt(monthYear[2], 10);
        if (mi != null && year) {
            const d = new Date(year, mi, 1);
            hints.dateFrom = sqIsoStartOfMonth(d);
            hints.dateTo = sqIsoEndOfMonth(d);
            return hints;
        }
    }

    const yearOnly = q.match(/\b(?:in|for|during)\s+(20\d{2})\b/) || q.match(/\b(20\d{2})\b/);
    if (yearOnly) {
        const y = yearOnly[1];
        hints.dateFrom = `${y}-01-01`;
        hints.dateTo = `${y}-12-31`;
    }

    const range = q.match(/\bfrom\s+(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\s+(?:to|until|through)\s+(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\b/);
    if (range) {
        hints.dateFrom = sqParseDmy(range[1], range[2], range[3]);
        hints.dateTo = sqParseDmy(range[4], range[5], range[6]);
    }

    return hints;
}

function sqParseDmy(d, m, y) {
    let year = parseInt(y, 10);
    if (year < 100) year += 2000;
    return `${year}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function parseStoresQueryItemHints(question) {
    const q = String(question || '').toLowerCase();
    const hints = {};
    const itemMap = [
        [/\b(laptop|notebook|elitebook|omnibook)s?\b/, 'inv-laptops', 'laptop'],
        [/\b(desktop|workstation|pc)s?\b/, 'inv-desktops', 'desktop'],
        [/\b(printer|mfp)s?\b/, 'inv-printers', 'printer'],
        [/\b(tablet|ipad)s?\b/, 'inv-tablets', 'tablet'],
        [/\b(toner|ink)\b/, 'consumables-toners', 'toner'],
        [/\b(server)s?\b/, 'ict-equipment', 'server']
    ];
    for (const [re, category, term] of itemMap) {
        if (re.test(q)) {
            hints.category = category;
            hints.itemContains = term;
            break;
        }
    }
    const party = q.match(/\b(?:to|for|by|holder|person)\s+([a-z][a-z\s.-]{2,40})/i);
    if (party) hints.partyContains = party[1].trim();
    return hints;
}

/** Detect if a natural-language question should open the query builder. */
function detectStoresQueryIntent(question) {
    const raw = String(question || '').trim();
    const q = raw.toLowerCase();

    const craftSlash = raw.match(/^\/craft(?:\s+(.*))?$/i);
    if (craftSlash) {
        const tail = String(craftSlash[1] || '').trim();
        const statusHints = tail ? parseStoresQueryStatusHints(tail) : null;
        if (statusHints) {
            return {
                templateId: statusHints.templateId,
                label: STORES_QUERY_TEMPLATES[statusHints.templateId]?.label || 'Stores query',
                hints: statusHints,
                autoRun: true,
                question: raw
            };
        }
        if (!tail) {
            const tpl = STORES_QUERY_TEMPLATES['stock-movements'];
            return {
                templateId: 'stock-movements',
                label: tpl?.label || 'Stores query',
                hints: { dateFrom: '', dateTo: '' },
                question: raw
            };
        }
        const nested = detectStoresQueryIntent(`craft query ${tail}`);
        if (nested) return { ...nested, question: raw };
        const tpl = STORES_QUERY_TEMPLATES['stock-movements'];
        return {
            templateId: 'stock-movements',
            label: tpl?.label || 'Stores query',
            hints: {
                ...parseStoresQueryPeriodHints(tail),
                ...parseStoresQueryItemHints(tail)
            },
            question: raw
        };
    }

    if (q.length < 4) return null;

    const wantsTable = /\b(list|show|report|history|historical|register|table|query|find all|give me|export|print|who received|issued out|issued to|movements?)\b/.test(q);
    const issueCtx = /\b(issue|issued|issuance|iv\/|q\s*1033|1033)\b/.test(q);
    const receiptCtx = /\b(receiv(e|ed|ing)|rv\/|deliver(y|ed)|goods in)\b/.test(q);
    const custodyCtx = /\b(custody|holder|asset register|ict register|who has|engraved|za number)\b/.test(q);
    const loanCtx = /\b(loan|borrow|temporary|overstayed|due back)\b/.test(q);
    const permLoanCtx = /\b(permanent loan|comd\/?34|i-?pad|ipad)\b/.test(q);
    const movementCtx = /\b(movement|transaction|stock txn)\b/.test(q);
    const periodCtx = /\b(period|between|from|to|month|year|quarter|august|202[0-9]|this month|last month)\b/.test(q);

    if (!wantsTable && !(issueCtx && periodCtx) && !(receiptCtx && periodCtx)) {
        if (!/\b(craft|build|run)\s+(a\s+)?query\b/.test(q)) return null;
    }

    const hints = {
        ...parseStoresQueryPeriodHints(q),
        ...parseStoresQueryItemHints(q),
        ...(parseStoresQueryStatusHints(q) || {})
    };

    let templateId = 'stock-issues';
    let autoRun = false;
    if (hints.ictStatuses?.length) {
        templateId = hints.templateId || 'boarded-condemned';
        autoRun = /\b(boarded|condemned|survey|disposal|backloaded)\b/.test(q);
    } else if (/\b(craft|build|run)\s+(a\s+)?query\b/.test(q) && !issueCtx && !receiptCtx) {
        templateId = 'stock-movements';
    } else if (permLoanCtx && !issueCtx) {
        templateId = 'permanent-loans';
    } else if (loanCtx && !issueCtx) {
        templateId = 'temporary-loans';
    } else if (custodyCtx && !issueCtx && !receiptCtx) {
        templateId = 'ict-custody';
    } else if (receiptCtx && !issueCtx) {
        templateId = 'stock-receipts';
    } else if (movementCtx || (issueCtx && receiptCtx)) {
        templateId = 'stock-movements';
    } else if (issueCtx || /\bissued out\b/.test(q)) {
        templateId = 'stock-issues';
    }

    const tpl = STORES_QUERY_TEMPLATES[templateId];
    return {
        templateId,
        label: tpl?.label || 'Stores query',
        hints,
        autoRun,
        question
    };
}

function sqGetCategoryOptions() {
    const opts = [{ key: '', label: 'All categories' }];
    const seen = new Set(['']);

    if (typeof getAllInventoryLedgers === 'function') {
        getAllInventoryLedgers().forEach((l) => {
            if (!l?.key || seen.has(l.key)) return;
            seen.add(l.key);
            opts.push({ key: l.key, label: l.label || l.fullLabel || l.key });
        });
    }
    (typeof VOUCHER_INVENTORY_CATEGORIES !== 'undefined' ? VOUCHER_INVENTORY_CATEGORIES : []).forEach((c) => {
        if (!c?.key || seen.has(c.key)) return;
        seen.add(c.key);
        opts.push({ key: c.key, label: c.label || c.key });
    });
    return opts;
}

function sqTxnMatchesCategory(txn, category) {
    if (!category) return true;
    if (txn.category === category) return true;
    const ledger = typeof getInventoryLedgerByKey === 'function' ? getInventoryLedgerByKey(category) : null;
    if (ledger?.sourceKeys?.includes(txn.category)) {
        if (!ledger.itemFilter) return true;
        const text = `${txn.item || ''} ${txn.description || ''}`;
        return ledger.itemFilter.test(text);
    }
    if (ledger?.itemFilter) {
        const text = `${txn.item || ''} ${txn.description || ''}`;
        return ledger.itemFilter.test(text);
    }
    return false;
}

function sqGetTransactions() {
    const inv = typeof ensureStoresInventory === 'function'
        ? ensureStoresInventory()
        : (appState?.storesInventory || { transactions: [] });
    return Array.isArray(inv.transactions) ? inv.transactions : [];
}

function runStoresQuery(templateId, params = {}) {
    const tpl = STORES_QUERY_TEMPLATES[templateId] || STORES_QUERY_TEMPLATES['stock-movements'];
    const dateFrom = params.dateFrom || '';
    const dateTo = params.dateTo || '';
    const category = params.category || '';
    const itemContains = String(params.itemContains || '').trim().toLowerCase();
    const partyContains = String(params.partyContains || '').trim().toLowerCase();
    const status = params.status || 'all';

    const periodLabel = typeof getTechStoresPeriodLabel === 'function'
        ? getTechStoresPeriodLabel(dateFrom, dateTo)
        : (dateFrom || dateTo ? `${dateFrom || '…'} to ${dateTo || '…'}` : 'All dates');

    if (sqResolveQueryKind(templateId) === 'ict-custody') {
        const ictStatuses = Array.isArray(params.ictStatuses) && params.ictStatuses.length
            ? params.ictStatuses
            : (templateId === 'boarded-condemned' ? ['boarded', 'condemned', 'backloaded'] : null);
        const list = typeof ensureIctAccountability === 'function'
            ? ensureIctAccountability()
            : (appState?.ictAccountability || []);
        const rows = list
            .filter((rec) => {
                if (!sqIctStatusMatches(rec, status, ictStatuses)) return false;
                if (!sqInPeriod(sqIctRecordDate(rec), dateFrom, dateTo)) return false;
                if (category && rec.inventoryLedger !== category) return false;
                const hay = `${rec.designation} ${rec.description} ${rec.holderName} ${rec.zaNumber} ${rec.form1033Ref} ${rec.boardRef} ${rec.remarks}`.toLowerCase();
                if (itemContains && !hay.includes(itemContains)) return false;
                if (partyContains && !hay.includes(partyContains)) return false;
                return true;
            })
            .sort((a, b) => String(sqIctRecordDate(b)).localeCompare(String(sqIctRecordDate(a))))
            .map((rec, i) => ({
                num: i + 1,
                date: sqIctRecordDate(rec) || '—',
                status: rec.status || '—',
                item: rec.designation || '—',
                za: rec.zaNumber ? `ZA ${rec.zaNumber}` : '—',
                form1033: rec.form1033Ref || '—',
                boardRef: rec.boardRef || '—',
                party: rec.holderName || rec.unit || '—',
                unit: rec.unit || '—',
                remarks: (rec.remarks || '').slice(0, 80) || '—'
            }));

        const showBoard = templateId === 'boarded-condemned' || ictStatuses;
        return {
            templateId,
            title: `${tpl.label} — ${periodLabel}`,
            subtitle: `${rows.length} record(s)`,
            columns: [
                { key: 'num', label: '#' },
                { key: 'date', label: 'Date' },
                { key: 'status', label: 'Status' },
                { key: 'item', label: 'Asset' },
                { key: 'za', label: 'ZA' },
                ...(showBoard ? [{ key: 'boardRef', label: 'Board ref' }] : []),
                { key: 'form1033', label: 'Q 1033' },
                { key: 'party', label: 'Holder / unit' },
                { key: 'unit', label: 'Unit' }
            ],
            rows,
            moduleId: tpl.moduleId,
            openFilter: partyContains || itemContains
        };
    }

    if (templateId === 'temporary-loans') {
        const loanRows = typeof collectTemporaryLoanRows === 'function' ? collectTemporaryLoanRows() : [];
        const rows = loanRows
            .filter((loan) => {
                const d = loan.loanDate || loan.date || '';
                if (!sqInPeriod(d, dateFrom, dateTo)) return false;
                if (status === 'issued' && !loan.status?.active) return false;
                if (status === 'returned' && loan.status?.active) return false;
                const hay = `${loan.item} ${loan.zaNumber} ${loan.issuedTo} ${loan.unit} ${loan.description}`.toLowerCase();
                if (itemContains && !hay.includes(itemContains)) return false;
                if (partyContains && !hay.includes(partyContains)) return false;
                return true;
            })
            .sort((a, b) => String(b.loanDate || b.date || '').localeCompare(String(a.loanDate || a.date || '')))
            .map((loan, i) => ({
                num: i + 1,
                date: loan.loanDate || loan.date || '—',
                status: loan.status?.label || '—',
                item: loan.item || '—',
                za: loan.zaNumber || '—',
                party: loan.issuedTo || '—',
                unit: loan.unit || '—',
                due: loan.expectedReturn || loan.dueDate || '—'
            }));

        return {
            templateId,
            title: `${tpl.label} — ${periodLabel}`,
            subtitle: `${rows.length} loan(s)`,
            columns: [
                { key: 'num', label: '#' },
                { key: 'date', label: 'Issued' },
                { key: 'status', label: 'Status' },
                { key: 'item', label: 'Item' },
                { key: 'za', label: 'ZA' },
                { key: 'party', label: 'Issued to' },
                { key: 'unit', label: 'Unit' },
                { key: 'due', label: 'Due' }
            ],
            rows,
            moduleId: tpl.moduleId,
            openFilter: partyContains || itemContains
        };
    }

    if (templateId === 'permanent-loans') {
        const loanRows = typeof collectPermanentLoanRows === 'function' ? collectPermanentLoanRows() : [];
        const rows = loanRows
            .filter((loan) => {
                const d = loan.issueDate || '';
                if (!sqInPeriod(d, dateFrom, dateTo)) return false;
                if (status === 'issued' && !loan.status?.active) return false;
                if (status === 'returned' && loan.status?.key !== 'returned' && loan.status?.key !== 'personal') return false;
                const hay = `${loan.item} ${loan.zaNumber} ${loan.issuedTo} ${loan.unit} ${loan.description} ${loan.rank}`.toLowerCase();
                if (itemContains && !hay.includes(itemContains)) return false;
                if (partyContains && !hay.includes(partyContains)) return false;
                return true;
            })
            .sort((a, b) => String(b.issueDate || '').localeCompare(String(a.issueDate || '')))
            .map((loan, i) => ({
                num: i + 1,
                date: loan.issueDate || '—',
                status: loan.status?.label || '—',
                item: loan.item || '—',
                za: loan.zaNumber || '—',
                party: [loan.rank, loan.issuedTo].filter(Boolean).join(' ') || '—',
                unit: loan.unit || '—',
                due: loan.status?.threeYearIso || '—'
            }));

        return {
            templateId,
            title: `${tpl.label} — ${periodLabel}`,
            subtitle: `${rows.length} permanent loan(s)`,
            columns: [
                { key: 'num', label: '#' },
                { key: 'date', label: 'Issued' },
                { key: 'status', label: 'Status' },
                { key: 'item', label: 'Item' },
                { key: 'za', label: 'ZA' },
                { key: 'party', label: 'Issued to' },
                { key: 'unit', label: 'Unit' },
                { key: 'due', label: '3-year date' }
            ],
            rows,
            moduleId: tpl.moduleId,
            openFilter: partyContains || itemContains
        };
    }

    const wantIssue = templateId === 'stock-issues' || templateId === 'stock-movements';
    const wantReceipt = templateId === 'stock-receipts' || templateId === 'stock-movements';

    const rows = sqGetTransactions()
        .filter((txn) => {
            if (wantIssue && !wantReceipt && txn.type !== 'issue') return false;
            if (wantReceipt && !wantIssue && txn.type !== 'receipt') return false;
            if (!sqInPeriod(txn.date, dateFrom, dateTo)) return false;
            if (!sqTxnMatchesCategory(txn, category)) return false;
            const hay = `${txn.item} ${txn.description} ${txn.party} ${txn.voucherNo} ${txn.by}`.toLowerCase();
            if (itemContains && !hay.includes(itemContains)) return false;
            if (partyContains && !hay.includes(partyContains)) return false;
            return true;
        })
        .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))
        .map((txn, i) => ({
            num: i + 1,
            date: txn.date || '—',
            type: txn.type === 'receipt' ? 'Receive' : 'Issue',
            item: txn.item || '—',
            qty: txn.qty ?? 1,
            voucher: txn.voucherNo || '—',
            party: txn.party || '—',
            by: txn.by || '—',
            category: txn.category || '—'
        }));

    return {
        templateId,
        title: `${tpl.label} — ${periodLabel}`,
        subtitle: `${rows.length} movement(s)`,
        columns: [
            { key: 'num', label: '#' },
            { key: 'date', label: 'Date' },
            { key: 'type', label: 'Type' },
            { key: 'item', label: 'Item' },
            { key: 'qty', label: 'Qty' },
            { key: 'voucher', label: 'RV/IV No.' },
            { key: 'party', label: 'Party' },
            { key: 'by', label: 'By' }
        ],
        rows,
        moduleId: tpl.moduleId,
        openCategory: category || 'ict-equipment',
        openFilter: partyContains || itemContains
    };
}

function ensureStoresQueryModals() {
    let host = document.getElementById('storesQueryHost');
    if (host && host.dataset.uiVersion === STORES_QUERY_UI_VERSION) return host;
    if (host) host.remove();

    host = document.createElement('div');
    host.id = 'storesQueryHost';
    host.dataset.uiVersion = STORES_QUERY_UI_VERSION;
    host.innerHTML = `
        <div id="storesQueryWizardModal" class="stores-query-modal" hidden>
            <div class="stores-query-backdrop" data-sq-close></div>
            <div class="stores-query-panel" role="dialog" aria-labelledby="storesQueryWizardTitle">
                <header class="stores-query-head">
                    <div>
                        <h2 id="storesQueryWizardTitle">Craft stores query</h2>
                        <p class="stores-query-sub" id="storesQueryWizardSub">Set parameters, then run to open a results table.</p>
                    </div>
                    ${typeof winChromeControlsHtml === 'function' ? winChromeControlsHtml('data-sq-close') : '<button type="button" class="btn btn-ghost btn-sm" data-sq-close aria-label="Close">✕</button>'}
                </header>
                <form id="storesQueryWizardForm" class="stores-query-form">
                    <label class="stores-query-field stores-query-field-wide">
                        <span>Query type</span>
                        <select class="form-control" id="sqTemplateSelect" name="templateId"></select>
                    </label>
                    <label class="stores-query-field">
                        <span>Date from</span>
                        <input type="date" class="form-control" id="sqDateFrom" name="dateFrom">
                    </label>
                    <label class="stores-query-field">
                        <span>Date to</span>
                        <input type="date" class="form-control" id="sqDateTo" name="dateTo">
                    </label>
                    <div class="stores-query-presets" role="group" aria-label="Period presets">
                        <button type="button" class="btn btn-ghost btn-sm" data-sq-preset="month">This month</button>
                        <button type="button" class="btn btn-ghost btn-sm" data-sq-preset="last-month">Last month</button>
                        <button type="button" class="btn btn-ghost btn-sm" data-sq-preset="year">This year</button>
                        <button type="button" class="btn btn-ghost btn-sm" data-sq-preset="all">All dates</button>
                    </div>
                    <label class="stores-query-field stores-query-field-wide" id="sqCategoryWrap">
                        <span>Category / ledger</span>
                        <select class="form-control" id="sqCategory" name="category"></select>
                    </label>
                    <label class="stores-query-field" id="sqStatusWrap" hidden>
                        <span>Status</span>
                        <select class="form-control" id="sqStatus" name="status">
                            <option value="all">All</option>
                            <option value="issued">Issued / active</option>
                            <option value="returned">Returned</option>
                        </select>
                    </label>
                    <label class="stores-query-field">
                        <span>Item contains</span>
                        <input type="text" class="form-control" id="sqItemContains" name="itemContains" placeholder="e.g. laptop, OmniBook, toner">
                    </label>
                    <label class="stores-query-field">
                        <span>Issued to / holder</span>
                        <input type="text" class="form-control" id="sqPartyContains" name="partyContains" placeholder="e.g. Mashiri, IT Directorate">
                    </label>
                    <div class="stores-query-actions">
                        <button type="button" class="btn btn-ghost" data-sq-close>Cancel</button>
                        <button type="submit" class="btn btn-primary" id="sqRunBtn">Run query</button>
                    </div>
                </form>
            </div>
        </div>
        <div id="storesQueryResultsModal" class="stores-query-modal stores-query-results-modal" hidden>
            <div class="stores-query-backdrop" data-sq-results-close></div>
            <div class="stores-query-panel stores-query-results-panel" role="dialog" aria-labelledby="storesQueryResultsTitle">
                <header class="stores-query-head">
                    <div>
                        <h2 id="storesQueryResultsTitle">Query results</h2>
                        <p class="stores-query-sub" id="storesQueryResultsSub"></p>
                    </div>
                    ${typeof winChromeControlsHtml === 'function' ? winChromeControlsHtml('data-sq-results-close') : '<button type="button" class="btn btn-ghost btn-sm" data-sq-results-close aria-label="Close">✕</button>'}
                </header>
                <div class="stores-query-results-toolbar">
                    <button type="button" class="btn btn-secondary btn-sm" id="sqPrintBtn">Print</button>
                    <button type="button" class="btn btn-secondary btn-sm" id="sqCsvBtn">Export CSV</button>
                    <button type="button" class="btn btn-ghost btn-sm" id="sqExpandResultsBtn" title="Expand table">⛶ Expand</button>
                    <button type="button" class="btn btn-primary btn-sm" id="sqOpenModuleBtn">Open in module</button>
                    <button type="button" class="btn btn-ghost btn-sm" id="sqEditParamsBtn">Edit parameters</button>
                </div>
                <div class="stores-query-results-body" id="storesQueryResultsBody"></div>
            </div>
        </div>`;
    document.body.appendChild(host);

    host.querySelectorAll('[data-sq-close]').forEach((el) => {
        el.addEventListener('click', closeStoresQueryWizard);
    });
    host.querySelectorAll('[data-sq-results-close]').forEach((el) => {
        el.addEventListener('click', closeStoresQueryResults);
    });

    host.querySelector('#storesQueryWizardForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        runStoresQueryFromWizard();
    });

    host.querySelector('#sqTemplateSelect')?.addEventListener('change', syncStoresQueryWizardFields);

    host.querySelectorAll('[data-sq-preset]').forEach((btn) => {
        btn.addEventListener('click', () => {
            applyStoresQueryPreset(btn.getAttribute('data-sq-preset'));
        });
    });

    host.querySelector('#sqPrintBtn')?.addEventListener('click', printStoresQueryResults);
    host.querySelector('#sqCsvBtn')?.addEventListener('click', exportStoresQueryCsv);
    host.querySelector('#sqOpenModuleBtn')?.addEventListener('click', openStoresQueryInModule);
    host.querySelector('#sqEditParamsBtn')?.addEventListener('click', () => {
        closeStoresQueryResults();
        openStoresQueryWizard(storesQueryEngineState.lastIntent || {});
    });

    host.querySelector('#sqExpandResultsBtn')?.addEventListener('click', () => {
        const result = storesQueryEngineState.lastResult;
        if (!result?.rows?.length) {
            if (typeof showToast === 'function') showToast('No rows to expand.', 'info');
            return;
        }
        if (typeof openTableFocusView === 'function') {
            openTableFocusView({
                tableSelector: '#storesQueryResultsBody .stores-query-table',
                title: result.title || 'Query results',
                subtitleText: result.subtitle || ''
            });
        }
    });

    populateStoresQueryTemplateSelect();
    populateStoresQueryCategorySelect();

    const wizardModal = host.querySelector('#storesQueryWizardModal');
    const resultsModal = host.querySelector('#storesQueryResultsModal');
    if (typeof bindWinChromeModal === 'function') {
        bindWinChromeModal(wizardModal, { onClose: closeStoresQueryWizard, closeSelector: '[data-sq-close]' });
        bindWinChromeModal(resultsModal, { onClose: closeStoresQueryResults, closeSelector: '[data-sq-results-close]' });
    }

    return host;
}

let storesQueryEngineState = { lastResult: null, lastParams: null, lastIntent: null };

function populateStoresQueryTemplateSelect() {
    const sel = document.getElementById('sqTemplateSelect');
    if (!sel) return;
    sel.innerHTML = Object.values(STORES_QUERY_TEMPLATES).map((t) =>
        `<option value="${sqEscapeHtml(t.id)}">${sqEscapeHtml(t.label)}</option>`
    ).join('');
}

function populateStoresQueryCategorySelect() {
    const sel = document.getElementById('sqCategory');
    if (!sel) return;
    sel.innerHTML = sqGetCategoryOptions().map((o) =>
        `<option value="${sqEscapeHtml(o.key)}">${sqEscapeHtml(o.label)}</option>`
    ).join('');
}

function syncStoresQueryWizardFields() {
    const templateId = document.getElementById('sqTemplateSelect')?.value || 'stock-issues';
    const queryKind = sqResolveQueryKind(templateId);
    const isIct = queryKind === 'ict-custody';
    const isLoans = templateId === 'temporary-loans' || templateId === 'permanent-loans';
    const statusWrap = document.getElementById('sqStatusWrap');
    const catWrap = document.getElementById('sqCategoryWrap');
    if (statusWrap) statusWrap.hidden = !(isIct || isLoans);
    if (catWrap) catWrap.hidden = isLoans;
    const statusSel = document.getElementById('sqStatus');
    if (statusSel) {
        if (isIct && typeof ICT_ACC_STATUSES !== 'undefined') {
            statusSel.innerHTML = '<option value="all">All statuses</option>'
                + ICT_ACC_STATUSES.map((s) =>
                    `<option value="${sqEscapeHtml(s.value)}">${sqEscapeHtml(s.label)}</option>`
                ).join('');
        } else if (isLoans) {
            statusSel.innerHTML = `
                <option value="all">All</option>
                <option value="issued">Issued / active</option>
                <option value="returned">Returned</option>`;
        } else {
            statusSel.innerHTML = '<option value="all">All</option>';
        }
    }
    const sub = document.getElementById('storesQueryWizardSub');
    if (sub) sub.textContent = STORES_QUERY_TEMPLATES[templateId]?.description || '';
}

function applyStoresQueryPreset(preset) {
    const fromEl = document.getElementById('sqDateFrom');
    const toEl = document.getElementById('sqDateTo');
    if (!fromEl || !toEl) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (preset === 'month') {
        fromEl.value = sqIsoStartOfMonth(today);
        toEl.value = sqIsoEndOfMonth(today);
    } else if (preset === 'last-month') {
        const d = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        fromEl.value = sqIsoStartOfMonth(d);
        toEl.value = sqIsoEndOfMonth(d);
    } else if (preset === 'year') {
        fromEl.value = `${today.getFullYear()}-01-01`;
        toEl.value = `${today.getFullYear()}-12-31`;
    } else {
        fromEl.value = '';
        toEl.value = '';
    }
}

function readStoresQueryWizardParams() {
    const templateId = document.getElementById('sqTemplateSelect')?.value || 'stock-issues';
    const params = {
        templateId,
        dateFrom: document.getElementById('sqDateFrom')?.value || '',
        dateTo: document.getElementById('sqDateTo')?.value || '',
        category: document.getElementById('sqCategory')?.value || '',
        status: document.getElementById('sqStatus')?.value || 'all',
        itemContains: document.getElementById('sqItemContains')?.value?.trim() || '',
        partyContains: document.getElementById('sqPartyContains')?.value?.trim() || ''
    };
    if (templateId === 'boarded-condemned') {
        params.ictStatuses = ['boarded', 'condemned', 'backloaded'];
    }
    return params;
}

function fillStoresQueryWizard(options = {}) {
    const templateId = options.templateId || 'stock-issues';
    const hints = options.hints || {};
    const tplSel = document.getElementById('sqTemplateSelect');
    const fromEl = document.getElementById('sqDateFrom');
    const toEl = document.getElementById('sqDateTo');
    if (tplSel) tplSel.value = templateId;
    if (fromEl) fromEl.value = hints.dateFrom || '';
    if (toEl) toEl.value = hints.dateTo || '';
    if (hints.category) document.getElementById('sqCategory').value = hints.category;
    if (hints.itemContains) document.getElementById('sqItemContains').value = hints.itemContains;
    if (hints.partyContains) document.getElementById('sqPartyContains').value = hints.partyContains;
    if (hints.status) document.getElementById('sqStatus').value = hints.status;
    if (!hints.dateFrom && !hints.dateTo) {
        applyStoresQueryPreset(templateId === 'boarded-condemned' || hints.ictStatuses ? 'all' : 'month');
    }
    syncStoresQueryWizardFields();
}

function openStoresQueryWizard(options = {}) {
    if (typeof canSeeStoresOpsDashboard === 'function' && !canSeeStoresOpsDashboard()) {
        if (typeof showToast === 'function') showToast('Query builder is for stores oversight roles.', 'info');
        return;
    }
    ensureStoresQueryModals();
    storesQueryEngineState.lastIntent = { ...options };
    fillStoresQueryWizard(options);
    const modal = document.getElementById('storesQueryWizardModal');
    if (modal) {
        modal.hidden = false;
        modal.style.zIndex = '14200';
    }
    document.body.classList.add('stores-query-open');
}

function closeStoresQueryWizard() {
    const modal = document.getElementById('storesQueryWizardModal');
    if (modal) {
        modal.hidden = true;
        if (typeof resetWinChromeMaximize === 'function') resetWinChromeMaximize(modal);
    }
    if (document.getElementById('storesQueryResultsModal')?.hidden !== false) {
        document.body.classList.remove('stores-query-open');
    }
}

function runStoresQueryFromWizard() {
    const params = readStoresQueryWizardParams();
    const btn = document.getElementById('sqRunBtn');
    if (btn) { btn.disabled = true; btn.textContent = 'Running…'; }
    try {
        if (typeof closeAiAssistant === 'function') closeAiAssistant();
        const result = runStoresQuery(params.templateId, params);
        storesQueryEngineState.lastParams = params;
        storesQueryEngineState.lastResult = result;
        storesQueryEngineState.lastIntent = { templateId: params.templateId, hints: params };
        closeStoresQueryWizard();
        openStoresQueryResults(result);
        if (typeof showToast === 'function') {
            const n = result.rows?.length || 0;
            showToast(
                n ? `${result.subtitle}` : 'No records matched — try All dates or Boarded / condemned query type.',
                n ? 'success' : 'info'
            );
        }
    } catch (err) {
        console.error('Stores query failed', err);
        if (typeof showToast === 'function') showToast(err.message || 'Query failed — refresh and try again.', 'error');
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'Run query'; }
    }
}

function executeStoresQueryIntent(intent) {
    const hints = intent?.hints || {};
    const params = {
        templateId: intent.templateId,
        dateFrom: hints.dateFrom || '',
        dateTo: hints.dateTo || '',
        category: hints.category || '',
        status: hints.status || 'all',
        ictStatuses: hints.ictStatuses || null,
        itemContains: hints.itemContains || '',
        partyContains: hints.partyContains || ''
    };
    if (params.templateId === 'boarded-condemned' && !params.ictStatuses) {
        params.ictStatuses = ['boarded', 'condemned', 'backloaded'];
    }
    if (typeof closeAiAssistant === 'function') closeAiAssistant();
    ensureStoresQueryModals();
    const result = runStoresQuery(params.templateId, params);
    storesQueryEngineState.lastParams = params;
    storesQueryEngineState.lastResult = result;
    storesQueryEngineState.lastIntent = intent;
    openStoresQueryResults(result);
    if (typeof showToast === 'function') {
        const n = result.rows?.length || 0;
        showToast(
            n ? `${result.subtitle}` : 'No records matched — try All dates or re-import board schedule.',
            n ? 'success' : 'info'
        );
    }
    return result;
}

function renderStoresQueryResultsTable(result) {
    if (!result?.rows?.length) {
        return `<div class="stores-query-empty">No records matched your filters. Try widening the date range or clearing item/holder filters.</div>`;
    }
    const head = result.columns.map((c) => `<th>${sqEscapeHtml(c.label)}</th>`).join('');
    const body = result.rows.map((row) => {
        const tds = result.columns.map((c) => `<td>${sqEscapeHtml(row[c.key])}</td>`).join('');
        return `<tr>${tds}</tr>`;
    }).join('');
    return `<div class="form-table-wrapper"><table class="overview-table stores-query-table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
}

function openStoresQueryResults(result) {
    ensureStoresQueryModals();
    if (typeof closeAiAssistant === 'function') closeAiAssistant();
    storesQueryEngineState.lastResult = result;
    const modal = document.getElementById('storesQueryResultsModal');
    const title = document.getElementById('storesQueryResultsTitle');
    const sub = document.getElementById('storesQueryResultsSub');
    const body = document.getElementById('storesQueryResultsBody');
    if (title) title.textContent = result.title || 'Query results';
    if (sub) sub.textContent = result.subtitle || '';
    if (body) body.innerHTML = renderStoresQueryResultsTable(result);
    if (modal) {
        modal.hidden = false;
        modal.style.zIndex = '14200';
    }
    document.body.classList.add('stores-query-open');
}

function closeStoresQueryResults() {
    const modal = document.getElementById('storesQueryResultsModal');
    if (modal) {
        modal.hidden = true;
        if (typeof resetWinChromeMaximize === 'function') resetWinChromeMaximize(modal);
    }
    document.body.classList.remove('stores-query-open');
}

function printStoresQueryResults() {
    const result = storesQueryEngineState.lastResult;
    if (!result) return;
    const html = `
        <!DOCTYPE html><html><head><meta charset="utf-8"><title>${sqEscapeHtml(result.title)}</title>
        <style>
            body{font-family:Segoe UI,Arial,sans-serif;padding:24px;color:#101828}
            h1{font-size:18px;margin:0 0 4px} p{color:#667085;font-size:13px}
            table{width:100%;border-collapse:collapse;margin-top:16px;font-size:12px}
            th,td{border:1px solid #d0d5dd;padding:6px 8px;text-align:left}
            th{background:#f9fafb}
        </style></head><body>
        <h1>${sqEscapeHtml(result.title)}</h1>
        <p>${sqEscapeHtml(result.subtitle || '')} · Printed ${new Date().toLocaleString()}</p>
        ${renderStoresQueryResultsTable(result)}
        </body></html>`;
    const w = window.open('', '_blank');
    if (!w) {
        if (typeof showToast === 'function') showToast('Allow pop-ups to print this report.', 'info');
        return;
    }
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
}

function exportStoresQueryCsv() {
    const result = storesQueryEngineState.lastResult;
    if (!result?.rows?.length) {
        if (typeof showToast === 'function') showToast('No rows to export.', 'info');
        return;
    }
    const header = result.columns.map((c) => c.label);
    const lines = [header.map((h) => `"${String(h).replace(/"/g, '""')}"`).join(',')];
    result.rows.forEach((row) => {
        lines.push(result.columns.map((c) => `"${String(row[c.key] ?? '').replace(/"/g, '""')}"`).join(','));
    });
    const blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `techstores-query-${result.templateId}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
}

async function openStoresQueryInModule() {
    const result = storesQueryEngineState.lastResult;
    const params = storesQueryEngineState.lastParams;
    if (!result?.moduleId || typeof navigateToModule !== 'function') return;
    closeStoresQueryResults();
    await navigateToModule(result.moduleId);
    setTimeout(() => {
        if (result.moduleId === 'voucher-module') {
            const cat = result.openCategory || params?.category || 'ict-equipment';
            document.querySelector(`#voucherInvTabs .voucher-inv-tab[data-inv-tab="${cat}"]`)?.click();
            const filter = result.openFilter || params?.partyContains || params?.itemContains || '';
            if (filter) {
                if (typeof setInvMovementFilters === 'function') {
                    setInvMovementFilters(cat, { item: filter, description: filter });
                } else {
                    const input = document.querySelector(`[data-inv-filters-target="voucher-inv-body-${cat}"] [data-inv-filter="item"]`);
                    if (input) {
                        input.value = filter;
                        input.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                }
            }
            document.querySelector('[data-inv-view-btn="cumulative"]')?.click();
        } else if (result.moduleId === 'ict-accountability') {
            const filter = result.openFilter || params?.partyContains || params?.itemContains || '';
            const input = document.getElementById('ictAccTrackQuery');
            if (input && filter) {
                input.value = filter;
                if (typeof runIctAccTrack === 'function') runIctAccTrack();
            }
        }
    }, 120);
}

/** Called from AI assistant — returns 'ran', 'wizard', or false. */
function handleStoresQueryFromAssistant(question) {
    const intent = detectStoresQueryIntent(question);
    if (!intent) return false;
    if (intent.autoRun) {
        executeStoresQueryIntent(intent);
        return 'ran';
    }
    openStoresQueryWizard(intent);
    return 'wizard';
}

function initStoresQueryEngine() {
    ensureStoresQueryModals();
}

window.detectStoresQueryIntent = detectStoresQueryIntent;
window.openStoresQueryWizard = openStoresQueryWizard;
window.runStoresQuery = runStoresQuery;
window.handleStoresQueryFromAssistant = handleStoresQueryFromAssistant;
window.initStoresQueryEngine = initStoresQueryEngine;
