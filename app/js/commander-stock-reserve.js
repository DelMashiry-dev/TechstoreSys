/* commander-stock-reserve.js — ZNA Commander 10% stock reserve + min-order graphics
 *
 * Policy: of all quantity taken into stock (opening take-on + receipts), 10% is
 * Commander reserve and must never be issued away. Issues may only draw from the
 * free float above that floor.
 */

const COMMANDER_RESERVE_RATIO = 0.10;

function cmdReserveEscape(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/**
 * @param {object} row - getItemStockSummary-style row (cumulative preferred)
 * @returns {{
 *   stocked: number, reserveQty: number, onHand: number, freeFloat: number,
 *   reserveHeld: number, breached: boolean, minStock: number, preferredFloor: number,
 *   minOrderQty: number, scale: number, pctFloat: number, pctReserve: number,
 *   pctGap: number, status: string, statusLabel: string
 * }}
 */
function computeCommanderReserveLevels(row) {
    const onHand = Number(row?.onHand) || 0;
    const openingBase = Math.max(0, Number(row?.openingBase != null ? row.openingBase : row?.opening) || 0);
    const received = Math.max(0, Number(row?.received) || 0);
    let stocked = openingBase + received;
    if (stocked <= 0 && onHand > 0) stocked = onHand;

    const minStock = Math.max(0, Number(row?.minStock) || 0);
    let reserveQty = 0;
    if (stocked > 0) {
        reserveQty = Math.min(stocked, Math.max(1, Math.ceil(stocked * COMMANDER_RESERVE_RATIO)));
    }

    const freeFloat = Math.max(0, onHand - reserveQty);
    const reserveHeld = Math.min(Math.max(0, onHand), reserveQty);
    const breached = stocked > 0 && onHand < reserveQty;
    const preferredFloor = reserveQty + Math.max(minStock, stocked > 0 ? Math.ceil(stocked * 0.05) : 0);
    const minOrderQty = Math.max(0, preferredFloor - Math.max(0, onHand));

    const scale = Math.max(stocked, onHand, preferredFloor, 1);
    const pctFloat = Math.round((freeFloat / scale) * 1000) / 10;
    const pctReserve = Math.round((reserveHeld / scale) * 1000) / 10;
    const pctGap = Math.max(0, Math.round(((scale - Math.max(0, onHand)) / scale) * 1000) / 10);

    let status = 'ok';
    let statusLabel = 'Reserve intact';
    if (breached) {
        status = 'breach';
        statusLabel = 'Reserve breached';
    } else if (minOrderQty > 0) {
        status = 'reorder';
        statusLabel = 'Below preferred floor';
    } else if (freeFloat <= 0 && onHand > 0) {
        status = 'at-floor';
        statusLabel = 'At Commander floor';
    }

    return {
        stocked,
        reserveQty,
        onHand,
        freeFloat,
        reserveHeld,
        breached,
        minStock,
        preferredFloor,
        minOrderQty,
        scale,
        pctFloat,
        pctReserve,
        pctGap,
        ratio: COMMANDER_RESERVE_RATIO,
        status,
        statusLabel
    };
}

function getItemCommanderReserveLevels(itemId, options = {}) {
    if (!itemId || typeof getItemStockSummary !== 'function') {
        return computeCommanderReserveLevels({ onHand: 0, openingBase: 0, received: 0 });
    }
    const row = getItemStockSummary(itemId, { mode: 'cumulative', ...(options || {}) });
    return computeCommanderReserveLevels(row);
}

/** How many units may still be issued without touching Commander reserve. */
function getCommanderIssuableQty(itemId) {
    return getItemCommanderReserveLevels(itemId).freeFloat;
}

/**
 * Validate an issue against Commander reserve.
 * @returns {string|null} error message or null if OK
 */
function validateCommanderReserveIssue(itemId, qty) {
    const need = Number(qty) || 0;
    if (need <= 0) return null;
    const levels = getItemCommanderReserveLevels(itemId);
    if (levels.reserveQty <= 0) return null;
    if (levels.onHand - need < levels.reserveQty) {
        return (
            `Blocked by ZNA Commander reserve (10%). ` +
            `On hand ${levels.onHand}; reserve floor ${levels.reserveQty}; ` +
            `issuable now ${levels.freeFloat}. ` +
            `Receive stock or reduce the issue quantity.`
        );
    }
    return null;
}

function renderCommanderReserveMeterHtml(levels, options = {}) {
    const L = levels || computeCommanderReserveLevels({});
    const compact = options.compact === true;
    const showOrder = options.showOrder !== false;
    const title = [
        `Stocked ${L.stocked}`,
        `On hand ${L.onHand}`,
        `Commander reserve 10% = ${L.reserveQty}`,
        `Free float ${L.freeFloat}`,
        L.minOrderQty > 0 ? `Suggested min order ${L.minOrderQty}` : 'No min order'
    ].join(' · ');

    if (L.stocked <= 0 && L.onHand <= 0) {
        return `<div class="stock-reserve-meter is-empty muted"${compact ? '' : ''}>No stock yet</div>`;
    }

    return `
      <div class="stock-reserve-meter is-${cmdReserveEscape(L.status)}" title="${cmdReserveEscape(title)}">
        <div class="stock-reserve-track" role="img" aria-label="${cmdReserveEscape(title)}">
          <span class="stock-reserve-seg stock-reserve-float" style="width:${L.pctFloat}%"></span>
          <span class="stock-reserve-seg stock-reserve-band" style="width:${L.pctReserve}%"></span>
          <span class="stock-reserve-seg stock-reserve-gap" style="width:${L.pctGap}%"></span>
        </div>
        ${compact ? `
          <div class="stock-reserve-compact-meta">
            <span>Cmd ${L.reserveQty}</span>
            <span>Float ${L.freeFloat}</span>
            ${showOrder && L.minOrderQty > 0 ? `<span class="stock-reserve-order-pill">Order ${L.minOrderQty}</span>` : ''}
          </div>
        ` : `
          <div class="stock-reserve-legend">
            <span class="stock-reserve-key stock-reserve-key-float">Float ${L.freeFloat}</span>
            <span class="stock-reserve-key stock-reserve-key-band">Cmd 10% ${L.reserveQty}</span>
            ${showOrder ? (
                L.minOrderQty > 0
                    ? `<span class="stock-reserve-key stock-reserve-key-order">Min order ${L.minOrderQty}</span>`
                    : `<span class="stock-reserve-key stock-reserve-key-ok">${cmdReserveEscape(L.statusLabel)}</span>`
            ) : ''}
          </div>
        `}
      </div>
    `;
  }

function getCommanderReserveBreachAlerts() {
    const alerts = [];
    if (typeof getTrackedItemIds !== 'function' || typeof getItemStockSummary !== 'function') return alerts;
    getTrackedItemIds().forEach((itemId) => {
        const row = getItemStockSummary(itemId, { mode: 'cumulative' });
        if (typeof isSoftwareLicenceCategory === 'function' && isSoftwareLicenceCategory(row.category, row.gl, itemId)) {
            return;
        }
        const tracked = row.openingBase > 0 || row.received > 0 || row.issued > 0;
        if (!tracked) return;
        const levels = computeCommanderReserveLevels(row);
        if (levels.breached) {
            alerts.push({
                type: 'danger',
                target: 'voucher-module',
                text: `COMMANDER RESERVE BREACH: ${row.item} on hand ${levels.onHand} is below 10% floor ${levels.reserveQty}. Stop issues; restock urgently.`
            });
        } else if (levels.minOrderQty > 0) {
            alerts.push({
                type: 'warning',
                target: 'voucher-module',
                text: `MIN STOCK ORDER: ${row.item} — suggest receive ≥ ${levels.minOrderQty} (Cmd reserve ${levels.reserveQty}; float ${levels.freeFloat}).`
            });
        }
    });
    return alerts;
}

window.COMMANDER_RESERVE_RATIO = COMMANDER_RESERVE_RATIO;
window.computeCommanderReserveLevels = computeCommanderReserveLevels;
window.getItemCommanderReserveLevels = getItemCommanderReserveLevels;
window.getCommanderIssuableQty = getCommanderIssuableQty;
window.validateCommanderReserveIssue = validateCommanderReserveIssue;
window.renderCommanderReserveMeterHtml = renderCommanderReserveMeterHtml;
window.getCommanderReserveBreachAlerts = getCommanderReserveBreachAlerts;
