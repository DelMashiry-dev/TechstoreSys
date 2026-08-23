/* gl-targets.js — Monthly GL Targets (votes) + expenditure vs Release Cuts */

function currentYmIso(date = new Date()) {
    const d = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(d.getTime())) {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function formatYmLabel(ym) {
    if (!ym || !/^\d{4}-\d{2}$/.test(ym)) return ym || '—';
    const [y, m] = ym.split('-').map(Number);
    const d = new Date(y, m - 1, 1);
    return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

function getGlTargetPeriodMode() {
    const el = document.getElementById('glTargetPeriodMode');
    const v = el?.value || appState?.glTargetPeriodMode || 'month';
    return (v === 'quarter' || v === 'year') ? v : 'month';
}

function setGlTargetPeriodMode(mode) {
    const next = (mode === 'quarter' || mode === 'year') ? mode : 'month';
    if (appState) appState.glTargetPeriodMode = next;
    const el = document.getElementById('glTargetPeriodMode');
    if (el && el.value !== next) el.value = next;
    syncGlTargetPeriodUi();
    return next;
}

function getGlTargetPeriodBounds(focusYm, mode) {
    const ym = (/^\d{4}-\d{2}$/.test(focusYm) ? focusYm : null)
        || getSelectedGlTargetMonth();
    const mmode = mode || getGlTargetPeriodMode();
    const [y, m] = ym.split('-').map(Number);

    if (mmode === 'month') {
        return {
            mode: 'month',
            months: [ym],
            label: formatYmLabel(ym),
            focusYm: ym
        };
    }

    if (mmode === 'quarter') {
        const q = Math.floor((m - 1) / 3) + 1;
        const startM = (q - 1) * 3 + 1;
        const months = [0, 1, 2].map((i) => `${y}-${String(startM + i).padStart(2, '0')}`);
        const monthNames = months.map((mo) => formatYmLabel(mo).split(' ')[0]);
        return {
            mode: 'quarter',
            months,
            label: `Q${q} ${y} (${monthNames[0]}–${monthNames[2]} ${y})`,
            focusYm: ym,
            quarter: q,
            year: y
        };
    }

    const months = Array.from({ length: 12 }, (_, i) => `${y}-${String(i + 1).padStart(2, '0')}`);
    return {
        mode: 'year',
        months,
        label: `Year ${y}`,
        focusYm: ym,
        year: y
    };
}

function getSelectedGlTargetPeriod() {
    return getGlTargetPeriodBounds(getSelectedGlTargetMonth(), getGlTargetPeriodMode());
}

function syncGlTargetPeriodUi() {
    const period = getSelectedGlTargetPeriod();
    const label = document.getElementById('glTargetMonthLabel');
    if (label) label.textContent = period.label;

    const monthWrap = document.getElementById('glTargetMonthWrap');
    const mode = period.mode;
    if (monthWrap) {
        monthWrap.classList.toggle('is-quarter-mode', mode === 'quarter');
        monthWrap.classList.toggle('is-year-mode', mode === 'year');
    }

    const monthLabel = document.querySelector('label[for="glTargetMonth"]');
    if (monthLabel) {
        monthLabel.textContent = mode === 'month'
            ? 'Target month'
            : (mode === 'quarter' ? 'Pick any month in the quarter' : 'Pick any month in the year');
    }

    const monthEl = document.getElementById('glTargetMonth');
    if (monthEl) {
        monthEl.title = mode === 'month'
            ? 'Month of the DAF vote'
            : (mode === 'quarter'
                ? 'Choose Jan/Mar/Apr/Jun etc. — dashboard shows that quarter’s totals'
                : 'Choose any month — dashboard shows the full calendar year totals');
    }

    const readOnlyNote = document.getElementById('glTargetPeriodNote');
    if (readOnlyNote) {
        readOnlyNote.hidden = mode === 'month';
        readOnlyNote.textContent = mode === 'quarter'
            ? 'Quarterly view — targets and spend are summed for all three months. Switch to Monthly to edit or enter each month’s DAF vote.'
            : 'Yearly view — targets and spend are summed for all twelve months. Switch to Monthly to edit a specific month.';
    }

    document.querySelectorAll('.gl-target-month-only').forEach((el) => {
        el.hidden = mode !== 'month';
    });

    renderGlTargetPeriodBreakdown(period);
}

function sumGlMaps(mapFn, months) {
    const total = {};
    Object.keys(GL_ACCOUNTS || {}).forEach((gl) => { total[gl] = 0; });
    (months || []).forEach((ym) => {
        const part = mapFn(ym) || {};
        Object.keys(total).forEach((gl) => {
            total[gl] += Number(part[gl]) || 0;
        });
    });
    return total;
}

function getGlPeriodTarget(gl, period) {
    if (!gl || gl === '_daf') return 0;
    const p = period || getSelectedGlTargetPeriod();
    return p.months.reduce((sum, ym) => sum + getGlMonthlyTarget(gl, ym), 0);
}

function getVoucherImpactByGlForPeriod(period) {
    const p = period || getSelectedGlTargetPeriod();
    return sumGlMaps(getVoucherImpactByGlForMonth, p.months);
}

function getPurchaseOrderCommittedByGlForPeriod(period) {
    const p = period || getSelectedGlTargetPeriod();
    return sumGlMaps(getPurchaseOrderCommittedByGlForMonth, p.months);
}

function getBaseCommittedByGlForPeriod(period) {
    const p = period || getSelectedGlTargetPeriod();
    return sumGlMaps(getBaseCommittedByGlForMonth, p.months);
}

function getGlPeriodExpended(gl, period) {
    const p = period || getSelectedGlTargetPeriod();
    const vouchers = getVoucherImpactByGlForPeriod(p)[gl] || 0;
    const committed = getBaseCommittedByGlForPeriod(p)[gl] || 0;
    return { vouchers, committed, expended: committed + vouchers };
}

function getGlPeriodBalance(gl, period) {
    const p = period || getSelectedGlTargetPeriod();
    const target = getGlPeriodTarget(gl, p);
    const { expended } = getGlPeriodExpended(gl, p);
    return target - expended;
}

function getProposalAmountForGlPeriod(gl, period) {
    const p = period || getSelectedGlTargetPeriod();
    if (typeof getProposalAmountForGl !== 'function') return 0;
    return p.months.reduce((sum, ym) => sum + (getProposalAmountForGl(gl, ym) || 0), 0);
}

function getGlPeriodFundingNote(gl, period) {
    const p = period || getSelectedGlTargetPeriod();
    if (p.mode === 'month' && typeof getGlFundingNote === 'function') {
        return getGlFundingNote(gl, p.focusYm);
    }
    const target = getGlPeriodTarget(gl, p);
    const power = getGlPeriodBalance(gl, p);
    if (!(target > 0) && power <= 0) return `No DAF vote recorded in ${p.label}`;
    if (power < 0) return `${p.label} — overdrawn by ${formatCurrency(Math.abs(power))}`;
    return `${p.label} · Target ${formatCurrency(target)} · Buying power ${formatCurrency(power)}`;
}

function renderGlTargetPeriodBreakdown(period) {
    const host = document.getElementById('glTargetPeriodBreakdown');
    if (!host) return;
    const p = period || getSelectedGlTargetPeriod();
    if (p.mode === 'month') {
        host.hidden = true;
        host.innerHTML = '';
        return;
    }
    host.hidden = false;
    const rows = p.months.map((ym) => {
        let target = 0;
        let expended = 0;
        Object.keys(GL_ACCOUNTS || {}).forEach((gl) => {
            target += getGlMonthlyTarget(gl, ym);
            expended += getGlMonthlyExpended(gl, ym).expended;
        });
        const balance = target - expended;
        return `<tr>
            <td>${formatYmLabel(ym)}</td>
            <td>${formatCurrency(target)}</td>
            <td>${formatCurrency(expended)}</td>
            <td><strong class="${balance < 0 ? 'buying-power-neg' : 'buying-power-ok'}">${formatCurrency(balance)}</strong></td>
        </tr>`;
    }).join('');
    host.innerHTML = `
        <details class="gl-period-breakdown" open>
            <summary>Month-by-month breakdown — ${p.label}</summary>
            <table class="overview-table gl-period-breakdown-table">
                <thead><tr><th>Month</th><th>DAF target</th><th>Expended</th><th>Buying power</th></tr></thead>
                <tbody>${rows}</tbody>
            </table>
        </details>`;
}

function ensureGlMonthlyTargets() {
    if (!appState) return {};
    if (!appState.glMonthlyTargets || typeof appState.glMonthlyTargets !== 'object') {
        appState.glMonthlyTargets = {};
    }
    return appState.glMonthlyTargets;
}

function getSelectedGlTargetMonth() {
    const el = document.getElementById('glTargetMonth');
    const v = el?.value || appState?.glTargetViewMonth || '';
    if (/^\d{4}-\d{2}$/.test(v)) return v;
    return currentYmIso();
}

function setSelectedGlTargetMonth(ym) {
    const month = /^\d{4}-\d{2}$/.test(ym) ? ym : currentYmIso();
    if (appState) appState.glTargetViewMonth = month;
    const el = document.getElementById('glTargetMonth');
    if (el && el.value !== month) el.value = month;
    if (typeof syncGlTargetPeriodUi === 'function') syncGlTargetPeriodUi();
    else {
        const label = document.getElementById('glTargetMonthLabel');
        if (label) label.textContent = formatYmLabel(month);
    }
    return month;
}

function getGlMonthlyTargetMap(month) {
    const ym = month || getSelectedGlTargetMonth();
    const all = ensureGlMonthlyTargets();
    if (!all[ym] || typeof all[ym] !== 'object') all[ym] = {};
    return all[ym];
}

function getGlMonthlyTarget(gl, month) {
    if (!gl || gl === '_daf') return 0;
    const map = getGlMonthlyTargetMap(month);
    const n = Number(map[gl]);
    return Number.isFinite(n) ? n : 0;
}

function setGlMonthlyTarget(gl, amount, month) {
    const ym = month || getSelectedGlTargetMonth();
    const map = getGlMonthlyTargetMap(ym);
    const n = Math.max(0, Number(amount) || 0);
    map[gl] = n;
    // Keep FY reference map loosely in sync with latest month edits (optional rollup aid)
    if (appState?.glBudgets && Object.prototype.hasOwnProperty.call(appState.glBudgets, gl)) {
        // do not overwrite FY reference automatically
    }
    if (typeof saveState === 'function') saveState();
    return n;
}

/**
 * Seed current month targets from FY reference (glBudgets) — only empty/zero cells.
 */
function seedMonthTargetsFromFyReference(month, { overwrite = false } = {}) {
    const ym = month || getSelectedGlTargetMonth();
    const map = getGlMonthlyTargetMap(ym);
    let count = 0;
    Object.keys(GL_ACCOUNTS || {}).forEach((gl) => {
        const fy = Number(appState?.glBudgets?.[gl]) || 0;
        if (!fy) return;
        if (!overwrite && (Number(map[gl]) || 0) > 0) return;
        map[gl] = fy;
        count += 1;
    });
    if (count && typeof saveState === 'function') saveState();
    return count;
}

function getVoucherImpactByGlForMonth(month) {
    const ym = month || getSelectedGlTargetMonth();
    const impact = {};
    Object.keys(GL_ACCOUNTS || {}).forEach((gl) => { impact[gl] = 0; });

    const voucherModule = appState?.modules?.['voucher-module'];
    const rows = voucherModule?.tables?.['voucher-table-body'];
    if (!Array.isArray(rows)) return impact;

    const voucherType = typeof getVoucherTypeFromModuleData === 'function'
        ? getVoucherTypeFromModuleData(voucherModule)
        : 'iv';
    const multiplier = voucherType === 'rv' ? -1 : 1;

    rows.forEach((row) => {
        const cells = row.cells || [];
        const date = String(cells[0]?.value || '').slice(0, 10);
        if (date && date.slice(0, 7) !== ym) return;
        if (!date && ym !== currentYmIso()) return; // undated only count in current month view
        const layout = typeof detectVoucherRowLayout === 'function' ? detectVoucherRowLayout(cells) : { gl: 6, amount: 8 };
        const gl = typeof getVoucherGlFromCells === 'function' ? getVoucherGlFromCells(cells, layout) : '';
        const amount = typeof getVoucherLineAmount === 'function' ? getVoucherLineAmount(cells, layout) : 0;
        if (gl && impact[gl] !== undefined && amount > 0) {
            impact[gl] += amount * multiplier;
        }
    });

    return impact;
}

function getPurchaseOrderCommittedByGlForMonth(month) {
    const ym = month || getSelectedGlTargetMonth();
    const committed = {};
    Object.keys(GL_ACCOUNTS || {}).forEach((gl) => { committed[gl] = 0; });
    const mod = appState?.modules?.['purchase-orders'];
    const rows = mod?.tables?.['purchase-orders-table-body'];
    if (!Array.isArray(rows)) {
        return typeof getPurchaseOrderCommittedByGl === 'function' ? getPurchaseOrderCommittedByGl() : committed;
    }
    rows.forEach((row) => {
        const cells = row.cells || [];
        const date = String(cells[0]?.value || '').slice(0, 10);
        if (date && date.slice(0, 7) !== ym) return;
        const layout = typeof detectPurchaseOrderRowLayout === 'function'
            ? detectPurchaseOrderRowLayout(cells)
            : { gl: 5, amount: 6 };
        const gl = cells[layout.gl]?.value || '';
        const amount = parseFloat(cells[layout.amount]?.value) || 0;
        if (gl && committed[gl] !== undefined && amount > 0) committed[gl] += amount;
    });
    return committed;
}

function getBaseCommittedByGlForMonth(month) {
    const ym = month || getSelectedGlTargetMonth();
    // Bids / DP F1 are often annual; attribute to selected month only when their dates match,
    // otherwise include them only when viewing the current month (active commitments).
    const isCurrent = ym === currentYmIso();
    const po = getPurchaseOrderCommittedByGlForMonth(ym);
    const bids = (isCurrent && typeof getBidCommittedByGl === 'function') ? getBidCommittedByGl() : (() => {
        const z = {};
        Object.keys(GL_ACCOUNTS || {}).forEach((gl) => { z[gl] = 0; });
        return z;
    })();
    const dpF1 = (isCurrent && typeof getDpF1CommittedByGl === 'function') ? getDpF1CommittedByGl() : (() => {
        const z = {};
        Object.keys(GL_ACCOUNTS || {}).forEach((gl) => { z[gl] = 0; });
        return z;
    })();
    const total = {};
    Object.keys(GL_ACCOUNTS || {}).forEach((gl) => {
        total[gl] = (bids[gl] || 0) + (po[gl] || 0) + (dpF1[gl] || 0);
    });
    return total;
}

function getGlMonthlyExpended(gl, month) {
    const ym = month || getSelectedGlTargetMonth();
    const vouchers = getVoucherImpactByGlForMonth(ym)[gl] || 0;
    const committed = getBaseCommittedByGlForMonth(ym)[gl] || 0;
    return { vouchers, committed, expended: committed + vouchers };
}

function getGlMonthlyBalance(gl, month) {
    const ym = month || getSelectedGlTargetMonth();
    const target = getGlMonthlyTarget(gl, ym);
    const { expended } = getGlMonthlyExpended(gl, ym);
    return target - expended;
}

/** Buying power = amount still available to buy on this GL for the month (DAF target − expended). */
function getGlBuyingPower(gl, month) {
    return getGlMonthlyBalance(gl, month);
}

function canBuyOnGl(gl, amount, month) {
    const need = Number(amount) || 0;
    if (need <= 0) return { ok: true, buyingPower: getGlBuyingPower(gl, month), need: 0 };
    const buyingPower = getGlBuyingPower(gl, month);
    const ym = month || getSelectedGlTargetMonth();
    const target = getGlMonthlyTarget(gl, ym);
    const glName = (typeof GL_ACCOUNTS !== 'undefined' && GL_ACCOUNTS[gl]?.name) || gl;
    if (!(target > 0) && buyingPower <= 0) {
        return {
            ok: false,
            buyingPower,
            need,
            message:
                `No buying power on GL ${gl} (${glName}) for ${formatYmLabel(ym)}. ` +
                `DAF has not voted this GL this month. Record the DAF target, or move funds via Release Cut from a funded GL.`
        };
    }
    if (need > buyingPower) {
        return {
            ok: false,
            buyingPower,
            need,
            message:
                `Insufficient buying power on GL ${gl} (${glName}). ` +
                `Need ${formatCurrency(need)} but only ${formatCurrency(buyingPower)} available this month. ` +
                `Reduce the buy, wait for a DAF target top-up, or Release Cut from a funded GL.`
        };
    }
    return {
        ok: true,
        buyingPower,
        need,
        message: `Buying power OK — ${formatCurrency(buyingPower)} available on GL ${gl} covers ${formatCurrency(need)}.`
    };
}

function getMonthDafMeta(month) {
    const ym = month || getSelectedGlTargetMonth();
    const all = ensureGlMonthlyTargets();
    if (!all[ym] || typeof all[ym] !== 'object') all[ym] = {};
    if (!all[ym]._daf || typeof all[ym]._daf !== 'object') {
        all[ym]._daf = { source: 'DAF', ref: '', receivedDate: '', notes: '' };
    }
    return all[ym]._daf;
}

function saveMonthDafMeta(partial, month) {
    const meta = getMonthDafMeta(month);
    Object.assign(meta, partial || {});
    if (typeof saveState === 'function') saveState();
    return meta;
}

function getTargetStatus(target, balance) {
    if (!(target > 0)) {
        if (balance < 0) return { label: 'No buying power', className: 'status-critical' };
        return { label: 'No DAF vote', className: 'status-neutral' };
    }
    const ratio = balance / target;
    if (ratio < 0) return { label: 'Overdrawn', className: 'status-critical' };
    if (ratio <= 0) return { label: 'Nil buying power', className: 'status-warning' };
    if (ratio < 0.2) return { label: 'Low buying power', className: 'status-warning' };
    if (ratio < 0.5) return { label: 'Monitor', className: 'status-monitor' };
    return { label: 'Buying power OK', className: 'status-healthy' };
}

function getGlFundingNote(gl, month) {
    const ym = month || getSelectedGlTargetMonth();
    const target = getGlMonthlyTarget(gl, ym);
    const power = getGlBuyingPower(gl, ym);
    const cuts = (appState.releaseCuts || []).filter((c) => String(c.date || '').slice(0, 7) === ym);
    const received = cuts.filter((c) => c.toGl === gl).reduce((s, c) => s + (Number(c.amount) || 0), 0);
    const given = cuts.filter((c) => c.fromGl === gl).reduce((s, c) => s + (Number(c.amount) || 0), 0);
    if (target > 0 && received <= 0) {
        return `DAF monthly target · Buying power ${formatCurrency(power)}`;
    }
    if (target > 0 && received > 0) {
        return `DAF target + Release Cut in (+${formatCurrency(received)}) · Power ${formatCurrency(power)}`;
    }
    if (!(target > 0) && received > 0) {
        return `Funded by Release Cut (+${formatCurrency(received)}) · Power ${formatCurrency(power)}`;
    }
    if (given > 0) return `DAF target shared via Release Cut (−${formatCurrency(given)})`;
    if (power < 0) return 'Spent with no DAF vote — Release Cut required';
    return 'No DAF vote — cannot buy until funded';
}

/**
 * Transfer monthly DAF target / buying power from funded GL → another GL for the transfer month.
 */
function applyMonthlyReleaseCut({ date, fromGl, toGl, amount }) {
    const ym = String(date || '').slice(0, 7) || getSelectedGlTargetMonth();
    const map = getGlMonthlyTargetMap(ym);
    const fromTarget = Number(map[fromGl]) || 0;
    const available = getGlBuyingPower(fromGl, ym);
    if (amount > available) {
        return {
            ok: false,
            error:
                `Insufficient buying power on GL ${fromGl} for ${formatYmLabel(ym)}. ` +
                `Available to cut: ${formatCurrency(available)}`
        };
    }
    if (amount > fromTarget) {
        return {
            ok: false,
            error: `Amount exceeds DAF monthly target on GL ${fromGl} (${formatCurrency(fromTarget)}).`
        };
    }
    map[fromGl] = fromTarget - amount;
    map[toGl] = (Number(map[toGl]) || 0) + amount;

    if (appState.glBudgets) {
        appState.glBudgets[fromGl] = Math.max(0, (appState.glBudgets[fromGl] || 0) - amount);
        appState.glBudgets[toGl] = (appState.glBudgets[toGl] || 0) + amount;
    }
    return { ok: true, month: ym };
}

function refreshReleaseCutBuyingPowerHints() {
    const fromGl = document.getElementById('releaseCutFrom')?.value;
    const toGl = document.getElementById('releaseCutTo')?.value;
    const date = document.getElementById('releaseCutDate')?.value || '';
    const ym = date.slice(0, 7) || getSelectedGlTargetMonth();
    const fromEl = document.getElementById('releaseCutFromPower');
    const toEl = document.getElementById('releaseCutToPower');
    if (fromEl && fromGl) {
        const p = getGlBuyingPower(fromGl, ym);
        const t = getGlMonthlyTarget(fromGl, ym);
        fromEl.textContent =
            `${formatYmLabel(ym)} · DAF target ${formatCurrency(t)} · Buying power ${formatCurrency(p)}`;
        fromEl.className = `gl-buying-power-hint ${p > 0 ? 'is-ok' : 'is-bad'}`;
    }
    if (toEl && toGl) {
        const p = getGlBuyingPower(toGl, ym);
        const t = getGlMonthlyTarget(toGl, ym);
        toEl.textContent =
            `${formatYmLabel(ym)} · DAF target ${formatCurrency(t)} · Buying power ${formatCurrency(p)}`;
        toEl.className = `gl-buying-power-hint ${t > 0 || p > 0 ? 'is-ok' : 'is-warn'}`;
    }
}

function initGlTargetMonthControls() {
    const monthEl = document.getElementById('glTargetMonth');
    if (!monthEl) return;
    if (!monthEl.value) monthEl.value = appState?.glTargetViewMonth || currentYmIso();

    const periodEl = document.getElementById('glTargetPeriodMode');
    if (periodEl && appState?.glTargetPeriodMode) periodEl.value = appState.glTargetPeriodMode;
    setSelectedGlTargetMonth(monthEl.value);
    setGlTargetPeriodMode(getGlTargetPeriodMode());

    const syncDafMetaFields = () => {
        const period = getSelectedGlTargetPeriod();
        const ym = getSelectedGlTargetMonth();
        const meta = getMonthDafMeta(ym);
        const ref = document.getElementById('dafTargetRef');
        const received = document.getElementById('dafTargetReceived');
        const notes = document.getElementById('dafTargetNotes');
        if (ref) ref.value = meta.ref || '';
        if (received) received.value = meta.receivedDate || '';
        if (notes) notes.value = meta.notes || '';
        const banner = document.getElementById('dafTargetBanner');
        if (banner) {
            if (period.mode !== 'month') {
                const funded = Object.keys(GL_ACCOUNTS || {}).filter((gl) => getGlPeriodTarget(gl, period) > 0).length;
                banner.innerHTML = `<strong>${period.label}</strong> — aggregated DAF targets &amp; spend` +
                    ` · ${funded} GL(s) with vote in period` +
                    ` · <em>Switch to Monthly to edit individual months</em>`;
                return;
            }
            const funded = Object.keys(GL_ACCOUNTS || {}).filter((gl) => getGlMonthlyTarget(gl, ym) > 0).length;
            banner.innerHTML = meta.ref
                ? `<strong>DAF monthly targets</strong> for ${formatYmLabel(ym)}` +
                  ` · Ref <strong>${String(meta.ref).replace(/</g, '')}</strong>` +
                  (meta.receivedDate ? ` · Received ${meta.receivedDate}` : '') +
                  ` · ${funded} GL(s) funded`
                : `<strong>DAF monthly targets</strong> for ${formatYmLabel(ym)}` +
                  ` · Enter DAF advice / vote ref below, then set Target amounts. Buys are limited to each GL’s <em>buying power</em>.`;
        }
    };

    monthEl.addEventListener('change', () => {
        setSelectedGlTargetMonth(monthEl.value);
        syncDafMetaFields();
        if (typeof syncProposalMemoFormFields === 'function') syncProposalMemoFormFields();
        if (typeof renderTargetProposalBanner === 'function') renderTargetProposalBanner();
        if (typeof updateDashboard === 'function') updateDashboard();
    });

    periodEl?.addEventListener('change', () => {
        setGlTargetPeriodMode(periodEl.value);
        syncDafMetaFields();
        if (typeof updateDashboard === 'function') updateDashboard();
    });

    ['dafTargetRef', 'dafTargetReceived', 'dafTargetNotes'].forEach((id) => {
        document.getElementById(id)?.addEventListener('change', () => {
            if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;
            saveMonthDafMeta({
                source: 'DAF',
                ref: document.getElementById('dafTargetRef')?.value || '',
                receivedDate: document.getElementById('dafTargetReceived')?.value || '',
                notes: document.getElementById('dafTargetNotes')?.value || ''
            });
            syncDafMetaFields();
            if (typeof showToast === 'function') showToast('DAF target advice saved for this month.', 'success');
        });
    });

    document.getElementById('btnSeedMonthTargets')?.addEventListener('click', () => {
        if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;
        const n = seedMonthTargetsFromFyReference(getSelectedGlTargetMonth(), { overwrite: false });
        if (typeof showToast === 'function') {
            showToast(n
                ? `Copied FY reference into ${n} unfunded GL(s) for ${formatYmLabel(getSelectedGlTargetMonth())}. Adjust to match the DAF advice.`
                : 'No empty GLs to seed (or FY reference is empty). Prefer typing the DAF monthly amounts.', n ? 'success' : 'info');
        }
        if (typeof updateDashboard === 'function') updateDashboard();
    });

    document.getElementById('btnClearMonthTargets')?.addEventListener('click', () => {
        if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;
        const ym = getSelectedGlTargetMonth();
        if (!confirm(`Clear all DAF monthly targets for ${formatYmLabel(ym)}?`)) return;
        const daf = getMonthDafMeta(ym);
        ensureGlMonthlyTargets()[ym] = { _daf: daf };
        if (typeof saveState === 'function') saveState();
        if (typeof showToast === 'function') showToast(`Cleared DAF targets for ${formatYmLabel(ym)}.`, 'info');
        if (typeof updateDashboard === 'function') updateDashboard();
    });

    ['releaseCutFrom', 'releaseCutTo', 'releaseCutDate'].forEach((id) => {
        document.getElementById(id)?.addEventListener('change', refreshReleaseCutBuyingPowerHints);
    });
    refreshReleaseCutBuyingPowerHints();
    syncDafMetaFields();
}
