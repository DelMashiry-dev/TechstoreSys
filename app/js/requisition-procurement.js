/* requisition-procurement.js — Electronic procurement cycle for unit requisitions
 *
 * Indent / requisition received →
 *   1) Check inventory (on hand)
 *   2) If in stock → issue via ZNA Q 1033
 *   3) Else if GL has buying power → raise DP F1 (electronic procurement)
 *   4) Else → flag: not in stock / await replenishment OR seek DAF funds manually
 */

const REQ_PROCURE_PATHS = {
    issue_q1033: {
        key: 'issue_q1033',
        label: 'Issue (Q 1033)',
        className: 'req-path-issue',
        summary: 'In stock — issue on ZNA Q 1033'
    },
    raise_dpf1: {
        key: 'raise_dpf1',
        label: 'Raise DP F1',
        className: 'req-path-dpf1',
        summary: 'Not in stock — funds available — raise DP F1'
    },
    await_replenishment: {
        key: 'await_replenishment',
        label: 'Await stock',
        className: 'req-path-wait',
        summary: 'Not in stock · no GL buying power — wait for delivery / seek DAF funds manually'
    },
    manual_daf: {
        key: 'manual_daf',
        label: 'Manual DAF funds',
        className: 'req-path-manual',
        summary: 'Manual path — search funds from DAF before DP F1'
    }
};

const GL_MODULE_CODE = {
    'gl-2200600002': '6122100009',
    'gl-2200600003': '2200600003',
    'gl-220200002': '220200002',
    'gl-2201900002': '2201900002',
    'gl-3112210001': '3112210001'
};

const GL_CODE_TO_MODULE = {
    '6122100009': 'gl-2200600002',
    '2200600002': 'gl-2200600002',
    '2200600003': 'gl-2200600003',
    '220200002': 'gl-220200002',
    '2201900002': 'gl-2201900002',
    '3112210001': 'gl-3112210001'
};

function reqProcEscape(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/** Map requisition category → default GL for procurement / issue. */
function resolveGlForRequisition(req) {
    const category = String(req?.category || '').trim();
    if (typeof VOUCHER_INVENTORY_CATEGORIES !== 'undefined') {
        const hit = VOUCHER_INVENTORY_CATEGORIES.find((c) => c.key === category);
        if (hit?.gl) return String(hit.gl);
    }
    const fallback = {
        'consumables-toners': '6122100009',
        'consumables-media': '6122100009',
        'spares-parts': '2201900002',
        'maintenance-equipment': '220200002',
        'software-licences': '2200600003',
        'ict-equipment': '3112210001'
    };
    if (fallback[category]) return fallback[category];

    // Prefer catalog item GL when name resolves
    const name = String(req?.itemDescription || req?.subject || '').trim();
    if (name && typeof resolveCatalogOrAdhocItem === 'function') {
        const resolved = resolveCatalogOrAdhocItem(name, category || 'other');
        if (resolved?.catalog?.gl) return String(resolved.catalog.gl);
        if (resolved?.gl) return String(resolved.gl);
    }
    return '6122100009';
}

function lookupRequisitionStock(req) {
    const name = String(req?.itemDescription || req?.subject || '').trim();
    const category = String(req?.category || '').trim() || 'other';
    const qtyNeeded = Math.max(1, Number(req?.qty) || 1);

    if (!name) {
        return {
            ok: false,
            name: '',
            qtyNeeded,
            onHand: 0,
            inStock: false,
            sufficient: false,
            itemId: '',
            resolved: null,
            hits: []
        };
    }

    const hits = typeof findCatalogItemsByName === 'function'
        ? findCatalogItemsByName(name).slice(0, 8)
        : [];

    let resolved = null;
    if (typeof resolveCatalogOrAdhocItem === 'function') {
        resolved = resolveCatalogOrAdhocItem(name, category);
    } else if (hits[0]) {
        resolved = { id: hits[0].id, name: hits[0].name, category: hits[0].category, catalog: hits[0] };
    }

    const itemId = resolved?.id || hits[0]?.id || '';
    let onHand = 0;
    if (itemId && typeof getItemStockSummary === 'function') {
        onHand = Number(getItemStockSummary(itemId, { mode: 'cumulative' })?.onHand) || 0;
    }

    return {
        ok: true,
        name,
        qtyNeeded,
        onHand,
        inStock: onHand > 0,
        sufficient: onHand >= qtyNeeded,
        itemId,
        resolved,
        hits
    };
}

function getGlBuyingPowerForProcure(glCode) {
    const gl = String(glCode || '').trim();
    if (!gl) return 0;
    if (typeof getGlBuyingPower === 'function') return Number(getGlBuyingPower(gl)) || 0;
    if (typeof getGlMonthlyBalance === 'function') return Number(getGlMonthlyBalance(gl)) || 0;
    if (typeof getGlBalance === 'function') return Number(getGlBalance(gl)) || 0;
    return 0;
}

/**
 * Decide procurement path for a requisition (does not mutate / navigate).
 */
function evaluateRequisitionProcurement(req, options = {}) {
    const estimatedCost = Math.max(0, Number(options.estimatedCost) || 0);
    const gl = options.gl || resolveGlForRequisition(req);
    const stock = lookupRequisitionStock(req);
    const buyingPower = getGlBuyingPowerForProcure(gl);
    const glName = (typeof GL_ACCOUNTS !== 'undefined' && GL_ACCOUNTS[gl]?.name) || gl;
    const fmt = typeof formatCurrency === 'function' ? formatCurrency : (n) => `$${Number(n).toFixed(2)}`;

    // 1) In stock → Q 1033 issue
    if (stock.ok && stock.inStock && stock.sufficient) {
        return {
            path: 'issue_q1033',
            meta: REQ_PROCURE_PATHS.issue_q1033,
            gl,
            glName,
            buyingPower,
            stock,
            estimatedCost,
            message:
                `IN STOCK — ${stock.onHand} on hand (need ${stock.qtyNeeded}). ` +
                `Issue on ZNA Q 1033 against GL ${gl} (${glName}).`
        };
    }

    if (stock.ok && stock.inStock && !stock.sufficient) {
        // Partial stock — still prefer issue what we can, then procure remainder if funds
        const shortfall = stock.qtyNeeded - stock.onHand;
        if (buyingPower > 0 && (estimatedCost <= 0 || estimatedCost <= buyingPower)) {
            return {
                path: 'raise_dpf1',
                meta: REQ_PROCURE_PATHS.raise_dpf1,
                gl,
                glName,
                buyingPower,
                stock,
                estimatedCost,
                partialIssueQty: stock.onHand,
                message:
                    `PARTIAL STOCK — ${stock.onHand} on hand, shortfall ${shortfall}. ` +
                    `Issue available on Q 1033; raise DP F1 for balance (buying power ${fmt(buyingPower)} on GL ${gl}).`
            };
        }
        return {
            path: 'await_replenishment',
            meta: REQ_PROCURE_PATHS.await_replenishment,
            gl,
            glName,
            buyingPower,
            stock,
            estimatedCost,
            partialIssueQty: stock.onHand,
            message:
                `PARTIAL STOCK — ${stock.onHand} on hand, shortfall ${shortfall}. ` +
                `No / insufficient buying power on GL ${gl} (${fmt(buyingPower)}). ` +
                `Issue available qty on Q 1033; await replenishment or seek DAF funds manually for the balance.`
        };
    }

    // 2) Not in stock — electronic DP F1 only if funds permitting
    const fundsOk = buyingPower > 0 && (estimatedCost <= 0 || estimatedCost <= buyingPower);
    if (fundsOk) {
        return {
            path: 'raise_dpf1',
            meta: REQ_PROCURE_PATHS.raise_dpf1,
            gl,
            glName,
            buyingPower,
            stock,
            estimatedCost,
            message:
                `NOT IN STOCK (on hand ${stock.onHand}). ` +
                `Buying power ${fmt(buyingPower)} on GL ${gl} (${glName}) — raise DP F1 to start electronic procurement.`
        };
    }

    // 3) No funds — wait / manual DAF
    return {
        path: buyingPower <= 0 ? 'manual_daf' : 'await_replenishment',
        meta: buyingPower <= 0 ? REQ_PROCURE_PATHS.manual_daf : REQ_PROCURE_PATHS.await_replenishment,
        gl,
        glName,
        buyingPower,
        stock,
        estimatedCost,
        message:
            `NOT IN STOCK (on hand ${stock.onHand}). ` +
            `Buying power on GL ${gl} is ${fmt(buyingPower)} — electronic DP F1 blocked. ` +
            `Flag: waiting for stock replenishment / supplier delivery, OR seek funds manually from DAF before raising DP F1.`
    };
}

function applyRequisitionFulfillmentMeta(req, decision) {
    if (!req || !decision) return req;
    req.fulfillmentPath = decision.path;
    req.fulfillmentLabel = decision.meta?.label || decision.path;
    req.fulfillmentNote = decision.message || '';
    req.fulfillmentAt = new Date().toISOString();
    req.procurementGl = decision.gl || '';
    req.stockOnHand = decision.stock?.onHand ?? null;
    req.buyingPowerAtRoute = decision.buyingPower ?? null;
    if (decision.path === 'await_replenishment' || decision.path === 'manual_daf') {
        if (req.status === 'received') req.status = 'in_progress';
    }
    req.updatedAt = new Date().toISOString();
    return req;
}

async function prefillQ1033FromRequisition(req, decision) {
    const qty = decision?.partialIssueQty != null
        ? decision.partialIssueQty
        : Math.max(1, Number(req.qty) || 1);
    const designation = String(req.itemDescription || req.subject || '').trim();

    if (typeof ensureModuleLoaded === 'function') {
        try { await ensureModuleLoaded('zna-q-1033'); } catch (_) { /* optional */ }
    }
    if (typeof navigateToModule === 'function') {
        await navigateToModule('zna-q-1033');
    }

    const tbody = document.getElementById('zna-q-1033-table-body');
    if (!tbody || typeof buildZnaQ1033Row !== 'function') {
        if (typeof showToast === 'function') showToast('Q 1033 form not available.', 'error');
        return false;
    }

    tbody.innerHTML = '';
    const auth = document.getElementById('q1033Authority');
    if (auth) {
        auth.value = `Unit requisition ${req.reqNo || ''} · ${req.unit || ''} · GL ${decision?.gl || ''}`.trim();
    }
    const issueDate = document.getElementById('q1033IssueDate');
    if (issueDate && typeof todayIsoLocal === 'function') issueDate.value = todayIsoLocal();
    const issuedBy = document.getElementById('q1033IssuedBy');
    if (issuedBy && !issuedBy.value && typeof currentUser !== 'undefined') {
        issuedBy.value = currentUser?.name || currentUser?.username || '';
    }

    const tr = buildZnaQ1033Row();
    const inputs = tr.querySelectorAll('input');
    if (inputs[1]) inputs[1].value = designation;
    if (inputs[2]) inputs[2].value = String(qty);
    if (inputs[5]) inputs[5].value = req.unit || '';
    if (inputs[10]) {
        inputs[10].value = `From requisition ${req.reqNo || ''} · ${decision?.message || 'In-stock issue'}`.slice(0, 180);
    }
    tbody.appendChild(tr);
    return true;
}

async function prefillDpF1FromRequisition(req, decision) {
    if (typeof ensureModuleLoaded === 'function') {
        try { await ensureModuleLoaded('dp-f1-form'); } catch (_) { /* optional */ }
    }
    if (typeof navigateToModule === 'function') {
        await navigateToModule('dp-f1-form');
    }

    const glEl = document.getElementById('dpF1Gl');
    if (glEl && decision?.gl) glEl.value = decision.gl;

    const title = document.getElementById('dpF1Title');
    if (title) {
        title.value = `Procure: ${req.itemDescription || req.subject || 'stores'} (${req.reqNo || 'REQ'})`;
    }
    const purpose = document.getElementById('dpF1Purpose') || document.getElementById('dpF1Justification');
    if (purpose) {
        purpose.value = [
            `Unit requisition ${req.reqNo || ''} from ${req.unit || 'unit'}.`,
            `Item: ${req.itemDescription || req.subject || '—'} × ${req.qty || 1}.`,
            `Stock check: on hand ${decision?.stock?.onHand ?? 0} — not sufficient / not found.`,
            `GL ${decision?.gl || ''} buying power available — electronic procurement cycle.`,
            decision?.message || ''
        ].filter(Boolean).join('\n');
    }

    const costEl = document.getElementById('dpF1EstimatedCost');
    if (costEl && decision?.estimatedCost > 0) {
        costEl.value = String(decision.estimatedCost);
    }

    const dateEl = document.getElementById('dpF1Date');
    if (dateEl && typeof todayIsoLocal === 'function' && !dateEl.value) {
        dateEl.value = todayIsoLocal();
    }

    // Link back on the requisition
    req.dpF1LinkedAt = new Date().toISOString();
    req.notes = [req.notes, `DP F1 raised from requisition route (${new Date().toLocaleDateString()}).`]
        .filter(Boolean).join(' ');

    if (typeof updateDpF1FundingAlert === 'function') updateDpF1FundingAlert();
    if (typeof updateDpF1SendStatus === 'function') updateDpF1SendStatus();
    return true;
}

/**
 * Route a requisition through the procurement cycle.
 * @param {string|object} reqOrId
 * @param {{ navigate?: boolean, estimatedCost?: number, silent?: boolean }} options
 */
async function routeRequisitionProcurement(reqOrId, options = {}) {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) {
        return { ok: false, reason: 'readonly' };
    }

    const list = typeof ensureRequisitions === 'function' ? ensureRequisitions() : [];
    const req = typeof reqOrId === 'object'
        ? reqOrId
        : list.find((r) => r.id === reqOrId);
    if (!req) {
        if (typeof showToast === 'function') showToast('Requisition not found.', 'error');
        return { ok: false, reason: 'missing' };
    }

    const decision = evaluateRequisitionProcurement(req, {
        estimatedCost: options.estimatedCost,
        gl: options.gl
    });
    applyRequisitionFulfillmentMeta(req, decision);

    if (typeof saveState === 'function') saveState();
    if (typeof renderRequisitionsModule === 'function') renderRequisitionsModule();
    if (typeof updateSystemAlerts === 'function') updateSystemAlerts();

    const navigate = options.navigate !== false;

    if (decision.path === 'issue_q1033') {
        if (!options.silent && typeof showToast === 'function') {
            showToast(decision.message, 'success');
        }
        if (navigate) await prefillQ1033FromRequisition(req, decision);
        // Mark part/full issue intent — actual stock post remains via Q 1033 / Close
        if (req.status === 'received') req.status = 'in_progress';
        if (typeof saveState === 'function') saveState();
        return { ok: true, decision, req };
    }

    if (decision.path === 'raise_dpf1') {
        if (!options.silent && typeof showToast === 'function') {
            showToast(decision.message, 'info');
        }
        if (navigate) {
            // If partial stock, offer Q 1033 first for available qty
            if (decision.partialIssueQty > 0) {
                const doPartial = window.confirm(
                    `${decision.partialIssueQty} available in stock.\n\n` +
                    `OK = open Q 1033 to issue available qty first.\n` +
                    `Cancel = go straight to DP F1 for the shortfall.`
                );
                if (doPartial) {
                    await prefillQ1033FromRequisition(req, decision);
                    return { ok: true, decision, req, branched: 'q1033_partial' };
                }
            }
            await prefillDpF1FromRequisition(req, decision);
        }
        if (req.status === 'received') req.status = 'in_progress';
        if (typeof saveState === 'function') saveState();
        if (typeof renderRequisitionsModule === 'function') renderRequisitionsModule();
        return { ok: true, decision, req };
    }

    // await / manual DAF
    if (!options.silent && typeof showToast === 'function') {
        showToast(decision.message, 'warning');
    }
    if (navigate) {
        const seekManual = window.confirm(
            `${decision.message}\n\n` +
            `OK = open DP F1 anyway (manual DAF funds path — funding check may block Send).\n` +
            `Cancel = stay on requisitions (flagged awaiting stock / funds).`
        );
        if (seekManual) {
            await prefillDpF1FromRequisition(req, decision);
        }
    }
    if (typeof saveState === 'function') saveState();
    if (typeof renderRequisitionsModule === 'function') renderRequisitionsModule();
    return { ok: true, decision, req };
}

/** After save — evaluate path and stamp requisition (no forced navigate). */
function autoRouteRequisitionAfterSave(req) {
    if (!req) return null;
    const open = ['received', 'in_progress', 'part_issued'].includes(req.status);
    if (!open) return null;
    const decision = evaluateRequisitionProcurement(req);
    applyRequisitionFulfillmentMeta(req, decision);
    if (typeof showToast === 'function') {
        const tone = decision.path === 'issue_q1033' ? 'success'
            : (decision.path === 'raise_dpf1' ? 'info' : 'warning');
        showToast(`Procurement path: ${decision.meta.label} — ${decision.message}`, tone);
    }
    return decision;
}

function openProcurementProcessForGl(glCode, options = {}) {
    const gl = String(glCode || options.gl || '').trim();
    window.__procurePreferredGl = gl || '';

    const go = async () => {
        const target = options.target || 'dp-procurement';
        if (typeof ensureModuleLoaded === 'function') {
            try { await ensureModuleLoaded(target); } catch (_) { /* optional */ }
        }
        if (typeof navigateToModule === 'function') await navigateToModule(target);

        if (target === 'dp-f1-form' && gl) {
            const glEl = document.getElementById('dpF1Gl');
            if (glEl) glEl.value = gl;
            if (typeof updateDpF1FundingAlert === 'function') updateDpF1FundingAlert();
        }

        if (typeof showToast === 'function') {
            const name = (typeof GL_ACCOUNTS !== 'undefined' && GL_ACCOUNTS[gl]?.name) || gl || 'GL';
            const bp = getGlBuyingPowerForProcure(gl);
            const fmt = typeof formatCurrency === 'function' ? formatCurrency : (n) => `$${n}`;
            showToast(
                `Procurement process · ${name}. Buying power ${fmt(bp)}. ` +
                `Requisitions: in stock → Q 1033; else DP F1 if funds permit.`,
                'info'
            );
        }
    };
    return go();
}

function injectGlCardProcurementButtons() {
    document.querySelectorAll('.dashboard-cards .gl-card[data-gl]').forEach((card) => {
        if (card.dataset.procureBtn === '1') return;
        if (card.getAttribute('data-gl') === 'summary') return;
        card.dataset.procureBtn = '1';
        const body = card.querySelector('.card-body');
        if (!body) return;
        const wrap = document.createElement('div');
        wrap.className = 'gl-card-procure-actions';
        wrap.innerHTML = `
            <button type="button" class="btn btn-secondary btn-sm" data-gl-procure="${reqProcEscape(card.getAttribute('data-gl'))}">
                Procurement process
            </button>
            <button type="button" class="btn btn-ghost btn-sm" data-gl-procure-f1="${reqProcEscape(card.getAttribute('data-gl'))}">
                Raise DP F1
            </button>`;
        body.appendChild(wrap);
    });
}

function injectGlModuleProcurementButtons() {
    Object.entries(GL_MODULE_CODE).forEach(([moduleId, glCode]) => {
        const mod = document.getElementById(moduleId);
        if (!mod || mod.dataset.procureBtn === '1') return;
        const header = mod.querySelector('.form-header');
        if (!header) return;
        mod.dataset.procureBtn = '1';
        const bar = document.createElement('div');
        bar.className = 'gl-module-procure-bar';
        bar.innerHTML = `
            <p class="gl-module-procure-hint">
                Indent / requisition cycle: check stock → <strong>Q 1033</strong> if on hand;
                else <strong>DP F1</strong> only when this GL has buying power; otherwise await replenishment or seek DAF funds manually.
            </p>
            <div class="gl-module-procure-actions">
                <button type="button" class="btn btn-secondary btn-sm" data-gl-procure="${reqProcEscape(glCode)}">Procurement process</button>
                <button type="button" class="btn btn-primary btn-sm" data-gl-procure-f1="${reqProcEscape(glCode)}">Raise DP F1</button>
                <button type="button" class="btn btn-ghost btn-sm" data-gl-procure-reqs="${reqProcEscape(glCode)}">Unit Requisitions</button>
                <button type="button" class="btn btn-ghost btn-sm" data-gl-procure-q1033="${reqProcEscape(glCode)}">ZNA Q 1033</button>
            </div>`;
        header.insertAdjacentElement('afterend', bar);
    });
}

function wireGlProcurementUi() {
    if (window.__glProcureWired) {
        injectGlCardProcurementButtons();
        injectGlModuleProcurementButtons();
        return;
    }
    window.__glProcureWired = true;

    document.addEventListener('click', (e) => {
        const procure = e.target.closest('[data-gl-procure]');
        if (procure) {
            e.preventDefault();
            e.stopPropagation();
            openProcurementProcessForGl(procure.getAttribute('data-gl-procure'), { target: 'dp-procurement' });
            return;
        }
        const f1 = e.target.closest('[data-gl-procure-f1]');
        if (f1) {
            e.preventDefault();
            e.stopPropagation();
            openProcurementProcessForGl(f1.getAttribute('data-gl-procure-f1'), { target: 'dp-f1-form' });
            return;
        }
        const reqs = e.target.closest('[data-gl-procure-reqs]');
        if (reqs) {
            e.preventDefault();
            e.stopPropagation();
            if (typeof navigateToModule === 'function') navigateToModule('unit-requisitions');
            return;
        }
        const q1033 = e.target.closest('[data-gl-procure-q1033]');
        if (q1033) {
            e.preventDefault();
            e.stopPropagation();
            if (typeof navigateToModule === 'function') navigateToModule('zna-q-1033');
        }
    });

    injectGlCardProcurementButtons();
    injectGlModuleProcurementButtons();
}

function fulfillmentBadgeHtml(req) {
    const path = req?.fulfillmentPath;
    if (!path || !REQ_PROCURE_PATHS[path]) return '';
    const meta = REQ_PROCURE_PATHS[path];
    return `<div class="req-fulfill-badge ${meta.className}" title="${reqProcEscape(req.fulfillmentNote || meta.summary)}">${reqProcEscape(meta.label)}</div>`;
}

window.REQ_PROCURE_PATHS = REQ_PROCURE_PATHS;
window.GL_MODULE_CODE = GL_MODULE_CODE;
window.GL_CODE_TO_MODULE = GL_CODE_TO_MODULE;
window.resolveGlForRequisition = resolveGlForRequisition;
window.lookupRequisitionStock = lookupRequisitionStock;
window.evaluateRequisitionProcurement = evaluateRequisitionProcurement;
window.routeRequisitionProcurement = routeRequisitionProcurement;
window.autoRouteRequisitionAfterSave = autoRouteRequisitionAfterSave;
window.openProcurementProcessForGl = openProcurementProcessForGl;
window.wireGlProcurementUi = wireGlProcurementUi;
window.injectGlCardProcurementButtons = injectGlCardProcurementButtons;
window.fulfillmentBadgeHtml = fulfillmentBadgeHtml;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => wireGlProcurementUi());
} else {
    wireGlProcurementUi();
}
