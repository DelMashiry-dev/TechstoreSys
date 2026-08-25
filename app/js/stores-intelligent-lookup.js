/* stores-intelligent-lookup.js — Aggregate name / unit / ZA / item lookups with clickable results */

function silEscapeHtml(v) {
    return String(v ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function silNormalizeQuery(query) {
    return String(query || '').trim();
}

function silQueryTokens(query) {
    return silNormalizeQuery(query).toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length >= 2);
}

function silHayIncludes(hay, query) {
    const h = String(hay || '').toLowerCase();
    const q = silNormalizeQuery(query).toLowerCase();
    if (!q) return false;
    if (h.includes(q)) return true;
    const tokens = silQueryTokens(query);
    return tokens.length > 0 && tokens.every((t) => h.includes(t));
}

function silScoreText(hay, query) {
    const h = String(hay || '').toLowerCase();
    const q = silNormalizeQuery(query).toLowerCase();
    if (!q || !h) return 0;
    if (h === q) return 100;
    if (h.startsWith(q)) return 90;
    if (h.includes(q)) return 75;
    const tokens = silQueryTokens(query);
    if (tokens.length && tokens.every((t) => h.includes(t))) return 65;
    return 0;
}

function looksLikeStoresEntityLookup(query) {
    const q = silNormalizeQuery(query);
    if (q.length < 2) return false;

    if (/\b(how many|how much|what is|what are|explain|describe|help me|can you|should we|trend|recommend|capabilities|buying power|procurement process)\b/i.test(q)) {
        return false;
    }

    if (typeof detectStoresQueryIntent === 'function' && detectStoresQueryIntent(q)) {
        return false;
    }

    if (typeof looksLikeControlledIdQuery === 'function' && looksLikeControlledIdQuery(q)) return true;
    if (/^q\s*1033\s*[\/\-\s]*\d+/i.test(q)) return true;

    const words = q.split(/\s+/).filter(Boolean);
    return words.length <= 5;
}

function inferStoresLookupType(query) {
    const q = silNormalizeQuery(query);
    if (typeof looksLikeControlledIdQuery === 'function' && looksLikeControlledIdQuery(q)) return 'za';
    if (/^q\s*1033/i.test(q)) return 'za';
    if (/\b(directorate|battalion|regiment|brigade|hq|unit)\b/i.test(q)) return 'unit';
    const tokens = silQueryTokens(q);
    if (tokens.length === 1 && /^[a-z]{3,}$/i.test(tokens[0])) return 'person';
    return 'mixed';
}

function silMakeItem({ id, badge, title, subtitle, score, action }) {
    return { id, badge, title, subtitle, score: score || 0, action: action || {} };
}

function silPushGroup(groups, groupId, label, item) {
    if (!item) return;
    let group = groups.find((g) => g.id === groupId);
    if (!group) {
        group = { id: groupId, label, items: [] };
        groups.push(group);
    }
    if (group.items.some((x) => x.id === item.id)) return;
    group.items.push(item);
}

function silSortGroups(groups) {
    groups.forEach((g) => g.items.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title)));
    return groups.filter((g) => g.items.length > 0);
}

function aggregateStoresLookup(query) {
    const q = silNormalizeQuery(query);
    const groups = [];
    const seen = new Set();

    // —— ICT custody & assets ——
    const statusFilter = typeof matchIctStatusQuery === 'function' ? matchIctStatusQuery(q) : null;

    if (statusFilter && typeof getIctAccountabilitySnapshot === 'function') {
        getIctAccountabilitySnapshot().forEach((rec) => {
            const sm = rec.statusMeta || (typeof getIctAccStatusMeta === 'function' ? getIctAccStatusMeta(rec) : null);
            if (!sm || !statusFilter.includes(sm.key)) return;
            const za = typeof normalizeZaNumber === 'function' ? normalizeZaNumber(rec.zaNumber) : rec.zaNumber;
            const key = `ict-${rec.id || za || rec.designation}`;
            if (seen.has(key)) return;
            seen.add(key);
            const where = typeof describeIctAccWhereabouts === 'function' ? describeIctAccWhereabouts(rec) : null;
            silPushGroup(groups, 'custody', 'ICT custody & assets', silMakeItem({
                id: key,
                badge: sm.label?.includes('Condemned') ? 'Condemned' : (sm.label?.includes('Boarded') ? 'Boarded' : 'Asset'),
                title: za ? `ZA ${za} — ${rec.designation || 'Equipment'}` : (rec.designation || 'Equipment'),
                subtitle: where?.primary
                    ? `${where.primary}${where.secondary ? ` · ${where.secondary}` : ''}`
                    : sm.label || 'ICT Asset Register',
                score: 90,
                action: {
                    type: 'ict',
                    moduleId: 'ict-accountability',
                    trackQuery: za || rec.designation || q,
                    ictAccId: rec.id || '',
                    statusFilter: 'backloaded'
                }
            }));
        });
    }

    if (typeof trackAllAccountableItems === 'function') {
        const tracked = trackAllAccountableItems(q);
        (tracked.all || []).forEach((rec) => {
            const za = typeof normalizeZaNumber === 'function' ? normalizeZaNumber(rec.zaNumber) : rec.zaNumber;
            const key = `ict-${rec.id || za || rec.designation}`;
            if (seen.has(key)) return;
            seen.add(key);
            const where = typeof describeIctAccWhereabouts === 'function' ? describeIctAccWhereabouts(rec) : null;
            const score = typeof scoreIctAccTrackMatch === 'function'
                ? scoreIctAccTrackMatch(rec, q)
                : silScoreText(`${rec.holderName} ${rec.designation} ${za} ${rec.unit}`, q);
            silPushGroup(groups, 'custody', 'ICT custody & assets', silMakeItem({
                id: key,
                badge: 'Asset',
                title: za ? `ZA ${za} — ${rec.designation || 'Equipment'}` : (rec.designation || 'Equipment'),
                subtitle: where?.primary
                    ? `${where.primary}${where.secondary ? ` · ${where.secondary}` : ''}`
                    : [rec.holderName, rec.form1033Ref].filter(Boolean).join(' · ') || 'ICT Asset Register',
                score,
                action: {
                    type: 'ict',
                    moduleId: 'ict-accountability',
                    trackQuery: za || rec.holderName || rec.designation || q,
                    ictAccId: rec.id || ''
                }
            }));
        });
    }

    // —— Stock movements ——
    const inv = typeof ensureStoresInventory === 'function'
        ? ensureStoresInventory()
        : (appState?.storesInventory || null);
    (inv?.transactions || []).forEach((txn) => {
        const hay = `${txn.party} ${txn.item} ${txn.voucherNo} ${txn.description} ${txn.by} ${txn.category}`;
        const score = silScoreText(hay, q);
        if (score < 55) return;
        const key = `stk-${txn.id}`;
        if (seen.has(key)) return;
        seen.add(key);
        const isIssue = txn.type === 'issue';
        silPushGroup(groups, 'stock', 'Stock movements', silMakeItem({
            id: key,
            badge: isIssue ? 'Issue' : 'Receive',
            title: `${isIssue ? 'Issue' : 'Receive'} — ${txn.item || txn.party || 'Stock'}`,
            subtitle: [txn.date, txn.party, txn.voucherNo].filter(Boolean).join(' · '),
            score,
            action: {
                type: 'stock',
                moduleId: 'voucher-module',
                stockSearch: txn.party || txn.voucherNo || txn.item || q,
                stockCategory: txn.category || 'ict-equipment'
            }
        }));
    });

    // —— Temporary loans (appState if present) ——
    const loanRows = typeof collectTemporaryLoanRows === 'function' ? collectTemporaryLoanRows() : [];
    loanRows.forEach((loan) => {
        const hay = `${loan.issuedTo} ${loan.item} ${loan.zaNumber} ${loan.unit} ${loan.description}`;
        const score = silScoreText(hay, q);
        if (score < 55) return;
        const key = `loan-${loan.zaNumber || loan.rowIndex}-${loan.loanDate}`;
        if (seen.has(key)) return;
        seen.add(key);
        silPushGroup(groups, 'loans', 'Temporary loans', silMakeItem({
            id: key,
            badge: 'Loan',
            title: `${loan.item || loan.zaNumber || 'Loan item'}`,
            subtitle: [loan.loanDate, loan.issuedTo, loan.status?.label].filter(Boolean).join(' · '),
            score,
            action: {
                type: 'module',
                moduleId: 'temporary-loans',
                trackQuery: loan.zaNumber || loan.issuedTo || q
            }
        }));
    });

    // —— Requisitions ——
    const reqs = typeof ensureRequisitions === 'function' ? ensureRequisitions() : (appState?.requisitions || []);
    reqs.forEach((req) => {
        const hay = `${req.reqNo} ${req.unit} ${req.subject} ${req.itemDescription} ${req.item} ${req.category}`;
        const score = silScoreText(hay, q);
        if (score < 55) return;
        const key = `req-${req.id}`;
        if (seen.has(key)) return;
        seen.add(key);
        silPushGroup(groups, 'requisitions', 'Requisitions', silMakeItem({
            id: key,
            badge: 'Req',
            title: `${req.reqNo || 'Requisition'} — ${req.subject || req.itemDescription || req.item || ''}`.trim(),
            subtitle: [req.unit, req.status].filter(Boolean).join(' · '),
            score,
            action: {
                type: 'requisition',
                moduleId: 'unit-requisitions',
                reqId: req.id
            }
        }));
    });

    // —— Universal search extras (modules, POs, etc.) ——
    if (typeof searchUniversal === 'function') {
        searchUniversal(q, 8).forEach((hit) => {
            if (hit.kind === 'controlled' || hit.kind === 'stock') return;
            const key = `us-${hit.id}-${hit.kind}`;
            if (seen.has(key)) return;
            seen.add(key);
            silPushGroup(groups, 'system', 'System & modules', silMakeItem({
                id: key,
                badge: hit.kind === 'module' ? 'Module' : (hit.kind || 'Go'),
                title: hit.title,
                subtitle: hit.subtitle || '',
                score: silScoreText(hit.haystack || hit.title, q),
                action: {
                    type: 'universal',
                    moduleId: hit.moduleId,
                    trackQuery: hit.trackQuery,
                    ictAccId: hit.ictAccId,
                    reqId: hit.reqId,
                    stockSearch: hit.stockSearch,
                    stockCategory: hit.stockCategory,
                    corrSampleId: hit.corrSampleId,
                    qCode: hit.qCode,
                    dictQuery: hit.dictQuery
                }
            }));
        });
    }

    silSortGroups(groups);
    const totalCount = groups.reduce((n, g) => n + g.items.length, 0);
    const lookupType = inferStoresLookupType(q);

    let summary = `No records matched “${q}”.`;
    if (totalCount > 0 && statusFilter) {
        summary = `Found ${totalCount} ICT item(s) — ${statusFilter.includes('condemned') || statusFilter.includes('boarded') ? 'boarded / condemned / disposal chain' : 'matching status'}. Click to open.`;
    } else if (totalCount > 0) {
        summary = `Found ${totalCount} result(s) for “${q}” — click any row to open the record or module.`;
    } else if (statusFilter) {
        summary = `No ICT items with status matching “${q}”. Check ICT Asset Register or re-import board schedule data.`;
    }

    return {
        query: q,
        lookupType,
        summary,
        groups,
        totalCount
    };
}

function renderAiLookupResults(result) {
    if (!result?.totalCount) {
        return `<div class="ai-lookup-empty">${silEscapeHtml(result.summary)}</div>
            <div class="ai-lookup-actions">
                <button type="button" class="btn btn-secondary btn-sm ai-lookup-action" data-action-type="query" data-party="${silEscapeHtml(result.query)}">Run issue history query…</button>
            </div>`;
    }

    const groupHtml = result.groups.map((group) => `
        <div class="ai-lookup-group">
            <div class="ai-lookup-group-label">${silEscapeHtml(group.label)}</div>
            <div class="ai-lookup-items">
                ${group.items.map((item) => `
                    <button type="button" class="ai-lookup-item" data-lookup-id="${silEscapeHtml(item.id)}">
                        <span class="ai-lookup-badge">${silEscapeHtml(item.badge)}</span>
                        <span class="ai-lookup-text">
                            <strong>${silEscapeHtml(item.title)}</strong>
                            <small>${silEscapeHtml(item.subtitle || '')}</small>
                        </span>
                    </button>
                `).join('')}
            </div>
        </div>
    `).join('');

    return `
        <div class="ai-lookup-summary">${silEscapeHtml(result.summary)}</div>
        ${groupHtml}
        <div class="ai-lookup-actions">
            <button type="button" class="btn btn-ghost btn-sm ai-lookup-action" data-action-type="query" data-party="${silEscapeHtml(result.query)}">Full history table…</button>
            <button type="button" class="btn btn-ghost btn-sm ai-lookup-action" data-action-type="track" data-track="${silEscapeHtml(result.query)}">Track all matches</button>
        </div>`;
}

let silLastLookupResult = null;
let silItemIndex = new Map();

function indexSilLookupResult(result) {
    silLastLookupResult = result;
    silItemIndex = new Map();
    (result?.groups || []).forEach((g) => {
        g.items.forEach((item) => silItemIndex.set(item.id, item));
    });
}

async function openStoresLookupAction(action) {
    if (!action?.type) return;

    if (action.type === 'query' && typeof openStoresQueryWizard === 'function') {
        openStoresQueryWizard({
            templateId: 'stock-movements',
            hints: {
                partyContains: action.partyContains || action.trackQuery || '',
                itemContains: action.itemContains || '',
                dateFrom: action.dateFrom || '',
                dateTo: action.dateTo || ''
            }
        });
        return;
    }

    if (action.type === 'track') {
        if (typeof openControlledStoreTrack === 'function') {
            openControlledStoreTrack(action.trackQuery || '');
        } else if (typeof openUniversalSearch === 'function') {
            openUniversalSearch(action.trackQuery || '', { trackMode: true });
        }
        return;
    }

    if (action.moduleId && typeof navigateToModule === 'function') {
        await navigateToModule(action.moduleId);
    }

    setTimeout(() => {
        if (action.type === 'ict' || action.moduleId === 'ict-accountability') {
            const filterSel = document.getElementById('ictAccFilter');
            if (action.statusFilter && filterSel) {
                filterSel.value = action.statusFilter;
                if (typeof renderIctAccountabilityTable === 'function') renderIctAccountabilityTable();
            }
            const input = document.getElementById('ictAccTrackQuery');
            const tq = action.trackQuery || '';
            if (input) input.value = tq;
            if (typeof runIctAccTrack === 'function') runIctAccTrack();
            else if (typeof renderIctAccTrackResults === 'function') renderIctAccTrackResults(tq);
            if (action.ictAccId && typeof fillIctAccForm === 'function') {
                const rec = typeof ensureIctAccountability === 'function'
                    ? ensureIctAccountability().find((r) => r.id === action.ictAccId)
                    : null;
                if (rec) fillIctAccForm(rec);
            }
            document.getElementById('ictAccTrackPanel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            return;
        }

        if (action.type === 'stock' || action.stockSearch) {
            const cat = action.stockCategory || 'ict-equipment';
            document.querySelector(`#voucherInvTabs .voucher-inv-tab[data-inv-tab="${cat}"]`)?.click();
            document.querySelector('[data-inv-view-btn="cumulative"]')?.click();
            const input = document.querySelector(`input.table-search[data-search-target="voucher-inv-body-${cat}"]`);
            if (input && action.stockSearch) {
                input.value = action.stockSearch;
                input.dispatchEvent(new Event('input', { bubbles: true }));
            }
            return;
        }

        if (action.type === 'requisition' && action.reqId && typeof editRequisition === 'function') {
            editRequisition(action.reqId);
            return;
        }

        if (action.type === 'universal') {
            if (action.corrSampleId && typeof openCorrespondenceSampleInComms === 'function') {
                openCorrespondenceSampleInComms(action.corrSampleId);
                return;
            }
            if (action.reqId && typeof editRequisition === 'function') editRequisition(action.reqId);
            if (action.qCode && action.moduleId === 'zna-q-forms-index') {
                const search = document.getElementById('znaQIndexSearch');
                if (search) {
                    search.value = action.qCode;
                    search.dispatchEvent(new Event('input'));
                }
            }
        }
    }, 100);
}

function handleStoresLookupFromAssistant(query) {
    return looksLikeStoresEntityLookup(query);
}

function getStoresLookupItemById(id) {
    return silItemIndex.get(id) || null;
}

window.aggregateStoresLookup = aggregateStoresLookup;
window.looksLikeStoresEntityLookup = looksLikeStoresEntityLookup;
window.renderAiLookupResults = renderAiLookupResults;
window.handleStoresLookupFromAssistant = handleStoresLookupFromAssistant;
window.openStoresLookupAction = openStoresLookupAction;
window.getStoresLookupItemById = getStoresLookupItemById;
window.indexSilLookupResult = indexSilLookupResult;
