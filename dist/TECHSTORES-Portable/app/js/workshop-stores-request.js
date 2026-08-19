/* workshop-stores-request.js — Workshop indent/request from TechStores or QM;
   escalate missing items to Unit Requisitions + TechStores message */

function wsReqEscape(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function wsReqToday() {
    if (typeof todayIsoLocal === 'function') return todayIsoLocal();
    const d = new Date();
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Lookup catalog + on-hand for a spare / accessory / equipment name. */
function lookupWorkshopStoresItem(itemName, preferredCategory) {
    const name = String(itemName || '').trim();
    if (!name) {
        return { ok: false, reason: 'empty', name: '', hits: [], resolved: null, onHand: 0, inCatalog: false, inStock: false };
    }

    const hits = typeof findCatalogItemsByName === 'function'
        ? findCatalogItemsByName(name).slice(0, 12)
        : [];

    let resolved = null;
    if (typeof resolveCatalogOrAdhocItem === 'function') {
        resolved = resolveCatalogOrAdhocItem(name, preferredCategory || 'spares-parts');
    } else if (hits[0]) {
        resolved = { id: hits[0].id, name: hits[0].name, category: hits[0].category, catalog: hits[0] };
    }

    const itemId = resolved?.id || hits[0]?.id || '';
    let onHand = 0;
    if (itemId && typeof getItemStockSummary === 'function') {
        onHand = Number(getItemStockSummary(itemId, { mode: 'cumulative' })?.onHand) || 0;
    }

    const inCatalog = !!(resolved?.catalog || hits.length);
    const inStock = onHand > 0;

    return {
        ok: true,
        name,
        hits,
        resolved,
        itemId,
        onHand,
        inCatalog,
        inStock,
        status: inStock ? 'in_stock' : (inCatalog ? 'catalog_zero' : 'not_found')
    };
}

function createWorkshopRequisitionRecord({
    itemDescription,
    qty = 1,
    category = 'spares-parts',
    priority = 'urgent',
    subject = '',
    jobRef = '',
    channel = 'techstores',
    notes = ''
} = {}) {
    if (typeof ensureRequisitions !== 'function') return null;
    const list = ensureRequisitions();
    const now = new Date().toISOString();
    const desc = String(itemDescription || '').trim();
    if (!desc) return null;

    const channelLabel = channel === 'qm' ? 'QM Stores' : 'TechStores';
    const record = {
        id: `req-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        reqNo: typeof nextRequisitionNo === 'function' ? nextRequisitionNo() : `REQ-WS-${Date.now()}`,
        receivedDate: wsReqToday(),
        unit: 'IT DIR ENGINEERING SUPPORT (WORKSHOP)',
        category: category || 'spares-parts',
        itemDescription: desc,
        qty: Math.max(1, Number(qty) || 1),
        priority: priority || 'urgent',
        status: 'received',
        subject: subject || `Workshop demand — ${desc}`,
        docType: 'workshop_indent',
        minuteSheet: typeof createBlankMinuteSheet === 'function' ? createBlankMinuteSheet() : [],
        createdAt: now,
        updatedAt: now,
        source: 'workshop-stores-request',
        sourceChannel: channel,
        jobRef: String(jobRef || '').trim(),
        remarks: [
            `Raised from Workshop Stores Request (${channelLabel}).`,
            notes ? String(notes).trim() : '',
            'Item not available in stock / catalog — procure / buy.'
        ].filter(Boolean).join(' ')
    };
    list.unshift(record);
    return record;
}

function notifyTechStoresWorkshopDemand({
    itemDescription,
    qty,
    lookup,
    channel,
    reqNo,
    jobRef,
    action
} = {}) {
    if (typeof sendOfficeMessagesToDepartments !== 'function') return 0;
    const channelLabel = channel === 'qm' ? 'QM Stores' : 'TechStores';
    const stockLine = lookup
        ? (lookup.inStock
            ? `On hand: ${lookup.onHand}`
            : (lookup.inCatalog ? `In catalog but on hand: ${lookup.onHand}` : 'Not found in TechStores / QM catalog'))
        : 'Stock status unknown';

    const subject = action === 'buy'
        ? `BUY REQUIRED — Workshop spare/accessory: ${itemDescription}`
        : `Workshop indent — ${channelLabel}: ${itemDescription}`;

    const body = [
        `From: IT Dir Engineering Support (Workshop)`,
        `Action: ${action === 'buy' ? 'Procure / buy (item missing or zero stock)' : `Indent / request from ${channelLabel}`}`,
        `Item: ${itemDescription}`,
        `Qty: ${qty || 1}`,
        jobRef ? `Job / SVCS 1045 ref: ${jobRef}` : '',
        `Stock check: ${stockLine}`,
        reqNo ? `Unit Requisition raised: ${reqNo}` : '',
        '',
        action === 'buy'
            ? 'Please arrange procurement of this spare part / accessory / equipment and update the Unit Requisitions page.'
            : `Please issue / release from ${channelLabel} against this workshop demand.`
    ].filter((line, i, arr) => !(line === '' && arr[i - 1] === '')).join('\n');

    return sendOfficeMessagesToDepartments({
        departments: ['IT DIR TECHSTORES OFFICE'],
        subject,
        body,
        priority: action === 'buy' || (lookup && !lookup.inStock) ? 'high' : 'normal',
        toKind: 'it_dir_dept',
        source: 'workshop-stores-request',
        force: true,
        meta: {
            channel,
            action,
            itemDescription,
            qty,
            reqNo: reqNo || '',
            jobRef: jobRef || '',
            stockStatus: lookup?.status || ''
        }
    });
}

/**
 * Main action:
 * - indent_techstores | request_qm: if in stock → message only; if missing → requisition + message
 * - escalate_buy: always raise requisition + message to buy
 */
function submitWorkshopStoresRequest({
    itemDescription,
    qty = 1,
    category = 'spares-parts',
    jobRef = '',
    channel = 'techstores',
    forceBuy = false
} = {}) {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) {
        return { ok: false, reason: 'readonly' };
    }

    const name = String(itemDescription || '').trim();
    const q = Math.max(1, Number(qty) || 1);
    if (!name) {
        if (typeof showToast === 'function') showToast('Enter the item / spare / accessory required.', 'error');
        return { ok: false, reason: 'empty' };
    }

    const lookup = lookupWorkshopStoresItem(name, category);
    const needBuy = forceBuy || !lookup.inStock;

    let req = null;
    if (needBuy) {
        req = createWorkshopRequisitionRecord({
            itemDescription: name,
            qty: q,
            category,
            priority: 'urgent',
            jobRef,
            channel,
            notes: lookup.inCatalog
                ? `Catalog hit but zero / insufficient on hand (${lookup.onHand}).`
                : 'Item not found in TechStores / QM catalog.'
        });
        if (typeof saveState === 'function') saveState();
        if (typeof renderRequisitionsModule === 'function') renderRequisitionsModule();
        if (typeof updateSystemAlerts === 'function') updateSystemAlerts();
        if (typeof updateDashboard === 'function') updateDashboard();
    }

    const msgCount = notifyTechStoresWorkshopDemand({
        itemDescription: name,
        qty: q,
        lookup,
        channel,
        reqNo: req?.reqNo || '',
        jobRef,
        action: needBuy ? 'buy' : 'indent'
    });
    if (typeof saveState === 'function') saveState();

    return {
        ok: true,
        lookup,
        needBuy,
        requisition: req,
        messagesSent: msgCount
    };
}

function renderWorkshopStoresLookup(lookup) {
    const host = document.getElementById('wsStoresLookupResult');
    if (!host) return;
    if (!lookup || !lookup.ok) {
        host.hidden = true;
        host.innerHTML = '';
        return;
    }

    host.hidden = false;
    const badge = lookup.inStock
        ? '<span class="ws-stock-badge ws-stock-ok">IN STOCK</span>'
        : (lookup.inCatalog
            ? '<span class="ws-stock-badge ws-stock-low">CATALOG · ZERO ON HAND</span>'
            : '<span class="ws-stock-badge ws-stock-miss">NOT FOUND — BUY / REQUISITION</span>');

    const hitsHtml = (lookup.hits || []).slice(0, 6).map((h) => {
        let oh = '—';
        if (h.id && typeof getItemStockSummary === 'function') {
            oh = String(getItemStockSummary(h.id, { mode: 'cumulative' })?.onHand ?? 0);
        }
        return `<li><strong>${wsReqEscape(h.name)}</strong> · on hand ${wsReqEscape(oh)}</li>`;
    }).join('');

    host.innerHTML = `
        <div class="ws-lookup-card">
            ${badge}
            <p><strong>${wsReqEscape(lookup.name)}</strong>
                · On hand: <strong>${lookup.onHand}</strong>
                · ${lookup.inCatalog ? 'Listed in catalog' : 'Not in catalog'}</p>
            ${hitsHtml ? `<ul class="ws-lookup-hits">${hitsHtml}</ul>` : '<p class="ws-lookup-empty">No close catalog matches.</p>'}
            <p class="ws-lookup-hint">${lookup.inStock
                ? 'Item is available — use Indent TechStores or Request QM to notify issue.'
                : 'Item missing or zero stock — system will raise a Unit Requisition and message TechStores to buy.'}</p>
        </div>
    `;
}

function readWorkshopStoresForm() {
    return {
        itemDescription: document.getElementById('wsStoresItem')?.value || '',
        qty: document.getElementById('wsStoresQty')?.value || 1,
        category: document.getElementById('wsStoresCategory')?.value || 'spares-parts',
        jobRef: document.getElementById('wsStoresJobRef')?.value || '',
        channel: document.getElementById('wsStoresChannel')?.value || 'techstores'
    };
}

function fillWorkshopStoresCategorySelect() {
    const sel = document.getElementById('wsStoresCategory');
    if (!sel) return;
    const opts = typeof getRequisitionCategoryOptions === 'function'
        ? getRequisitionCategoryOptions()
        : [
            { value: 'spares-parts', label: 'Parts / Spares' },
            { value: 'consumables-toners', label: 'Toners & Ink' },
            { value: 'ict-equipment', label: 'ICT Equipment' },
            { value: 'other', label: 'Other / Mixed' }
        ];
    const cur = sel.value || 'spares-parts';
    sel.innerHTML = opts.map((o) =>
        `<option value="${wsReqEscape(o.value)}"${o.value === cur ? ' selected' : ''}>${wsReqEscape(o.label)}</option>`
    ).join('');
}

function handleWorkshopStoresAction(forceBuy) {
    const form = readWorkshopStoresForm();
    const result = submitWorkshopStoresRequest({
        ...form,
        channel: form.channel,
        forceBuy: !!forceBuy
    });
    if (!result.ok) return;

    renderWorkshopStoresLookup(result.lookup);

    if (result.needBuy && result.requisition) {
        showToast(`Not in stock — Requisition ${result.requisition.reqNo} raised and TechStores notified to buy.`, 'info');
    } else if (result.lookup.inStock) {
        const where = form.channel === 'qm' ? 'QM' : 'TechStores';
        showToast(`In stock — indent message sent to TechStores for ${where} issue.`);
    } else {
        showToast('Request submitted.', 'info');
    }

    const qtyEl = document.getElementById('wsStoresQty');
    if (qtyEl) qtyEl.value = '1';
}

function openWorkshopStoresFromRow(btn) {
    const tr = btn?.closest('tr');
    if (!tr) return;
    const eqType = tr.querySelector('.ri-eq-type')?.value || '';
    const diagnosis = tr.querySelector('.ri-diagnosis')?.value || '';
    const remarks = tr.querySelector('.ri-remark')?.value || '';
    const svcs = tr.querySelector('.ri-svcs1045')?.value || '';

    const itemGuess = [eqType, diagnosis].map((s) => String(s || '').trim()).filter(Boolean).join(' — ');
    const itemEl = document.getElementById('wsStoresItem');
    const jobEl = document.getElementById('wsStoresJobRef');
    if (itemEl) itemEl.value = itemGuess || String(remarks || '').trim();
    if (jobEl && String(svcs).trim()) jobEl.value = String(svcs).trim();

    document.getElementById('wsStoresRequestPanel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    itemEl?.focus();
    if (itemEl?.value) {
        renderWorkshopStoresLookup(lookupWorkshopStoresItem(itemEl.value, document.getElementById('wsStoresCategory')?.value));
    }
}

function initWorkshopStoresRequest() {
    const panel = document.getElementById('wsStoresRequestPanel');
    if (!panel) return;
    fillWorkshopStoresCategorySelect();

    if (panel.dataset.inited === '1') return;
    panel.dataset.inited = '1';

    document.getElementById('wsStoresLookupBtn')?.addEventListener('click', () => {
        const form = readWorkshopStoresForm();
        renderWorkshopStoresLookup(lookupWorkshopStoresItem(form.itemDescription, form.category));
    });
    document.getElementById('wsStoresItem')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            document.getElementById('wsStoresLookupBtn')?.click();
        }
    });

    document.getElementById('wsStoresIndentTsBtn')?.addEventListener('click', () => {
        const ch = document.getElementById('wsStoresChannel');
        if (ch) ch.value = 'techstores';
        handleWorkshopStoresAction(false);
    });
    document.getElementById('wsStoresRequestQmBtn')?.addEventListener('click', () => {
        const ch = document.getElementById('wsStoresChannel');
        if (ch) ch.value = 'qm';
        handleWorkshopStoresAction(false);
    });
    document.getElementById('wsStoresEscalateBuyBtn')?.addEventListener('click', () => {
        handleWorkshopStoresAction(true);
    });
    document.getElementById('wsStoresOpenReqsBtn')?.addEventListener('click', () => {
        if (typeof navigateToModule === 'function') navigateToModule('unit-requisitions');
    });
    document.getElementById('wsScrollStoresBtn')?.addEventListener('click', () => {
        panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
        document.getElementById('wsStoresItem')?.focus();
    });

    document.getElementById('workshop-repairs-table-body')?.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-ws-stores-request]');
        if (btn) openWorkshopStoresFromRow(btn);
    });
}

window.lookupWorkshopStoresItem = lookupWorkshopStoresItem;
window.submitWorkshopStoresRequest = submitWorkshopStoresRequest;
window.initWorkshopStoresRequest = initWorkshopStoresRequest;
