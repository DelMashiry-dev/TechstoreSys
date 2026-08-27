/* offline-assistant.js — client-side assistant when server /api/ai/ask is unavailable */

const OFFLINE_ICT_TRENDS = `ICT equipment trends (general industry guidance — not official ZNA policy):
- Laptops: 16 GB RAM, 512 GB NVMe, 3-year warranty; Copilot+ / AI PCs where budget allows.
- Desktops: small-form-factor for admin; towers only where GPU or expansion slots are needed.
- Servers: HPE ProLiant Gen11 / Dell PowerEdge 16G — DDR5, redundant PSU, iLO/iDRAC, 10 GbE.
- Printers: departmental laser MFP with secure pull-print; managed print contracts.
- Networking: Wi-Fi 6E/7 APs; PoE switches; segment guest/IoT VLANs.
- Security: encryption, TPM 2.0, patch cadence; prefer long vendor support life.`;

function offlineParseMoney(val) {
    const n = parseFloat(String(val ?? '').replace(/[^0-9.-]/g, ''));
    return Number.isFinite(n) ? n : 0;
}

function offlineAnswer(question, context) {
    const q = String(question || '').trim().toLowerCase();
    if (q.length < 2) {
        return { ok: false, error: 'Enter a question.' };
    }

    const ctx = context || {};
    const target = offlineParseMoney(ctx.target);
    const committed = offlineParseMoney(ctx.committed);
    const vouchers = offlineParseMoney(ctx.vouchers);
    const buying = offlineParseMoney(ctx.buyingPower);
    const stock = ctx.stockByType || {};
    const inv = ctx.inventorySummary || {};
    const loans = ctx.temporaryLoans || {};
    const perm = ctx.permanentLoans || {};
    const reqs = ctx.requisitions || {};

    if (any(q, ['trend', 'trends', '2025', '2026', 'recommend', 'advice', 'modern', 'upgrade'])) {
        return { ok: true, answer: OFFLINE_ICT_TRENDS, ai: false, readOnly: true, offline: true };
    }

    if (any(q, ['buying power', 'left to spend', 'available to buy']) && (target || buying)) {
        return {
            ok: true,
            answer: `Buying power is $${buying.toLocaleString()}. Target $${target.toLocaleString()} = Committed $${committed.toLocaleString()} + Vouchers $${vouchers.toLocaleString()} + Buying power.`,
            ai: false, readOnly: true, offline: true
        };
    }

    const typeMap = [
        [['laptop', 'notebook', 'laptops'], 'laptop', 'laptopLines'],
        [['desktop', 'desktops', 'pc'], 'desktop', 'desktopLines'],
        [['printer', 'printers'], 'printer', 'printerLines'],
        [['server', 'servers'], 'server', 'serverLines'],
        [['tablet', 'tablets'], 'tablet', 'tabletLines']
    ];
    for (const [keys, key, linesKey] of typeMap) {
        if (keys.some((k) => q.includes(k))) {
            const total = Number(stock[key] || 0);
            const lines = inv[linesKey] || [];
            if (total > 0) {
                const detail = lines.length ? ` Detail: ${lines.slice(0, 6).join('; ')}.` : '';
                return { ok: true, answer: `Total ${key}s on hand: ${total}.${detail}`, ai: false, readOnly: true, offline: true };
            }
            if (lines.length) {
                return { ok: true, answer: `${key[0].toUpperCase()}${key.slice(1)} stock: ${lines.slice(0, 8).join('; ')}.`, ai: false, readOnly: true, offline: true };
            }
            if (q.includes('server')) {
                return { ok: true, answer: 'No servers on hand in the register. Trend: HPE ProLiant Gen11 / Dell PowerEdge 16G for new procurement.', ai: false, readOnly: true, offline: true };
            }
        }
    }

    if (any(q, ['permanent loan', 'permanent loans', 'comd/34', 'comd 34', 'ipad', 'i-pad'])) {
        const summary = perm.summary || {};
        return {
            ok: true,
            answer: `Permanent loans (Comd/34): ${summary.serving || 0} on loan, ${summary.due3yr || 0} at 3-year / strike-off, ${summary.retireReturn || 0} to return on retirement, ${summary.personal || 0} personal / struck off. Open sidebar → Permanent Loans.`,
            ai: false, readOnly: true, offline: true
        };
    }

    if (any(q, ['loan', 'loans', 'temporary', 'overstayed'])) {
        const summary = loans.summary || {};
        if (summary.onLoan || summary.overstayed) {
            return {
                ok: true,
                answer: `Temporary loans: ${summary.onLoan || 0} on loan, ${summary.overstayed || 0} overstayed, ${summary.dueSoon || 0} due soon. Open Temporary Loans module.`,
                ai: false, readOnly: true, offline: true
            };
        }
        return { ok: true, answer: 'Temporary Loans module tracks ZA-numbered items (max 14 days). Open sidebar → Temporary Loans.', ai: false, readOnly: true, offline: true };
    }

    if (any(q, ['requisition', 'requisitions', 'indent'])) {
        let msg = 'Unit Requisitions — capture needs, then Route for Q 1033 issue or DP F1.';
        if (reqs.total) msg += ` Register: ${reqs.total}; ${reqs.pendingAtItDir || 0} at IT Dir, ${reqs.pendingAtDp || 0} at DP.`;
        return { ok: true, answer: msg, ai: false, readOnly: true, offline: true };
    }

    if (any(q, ['procurement', 'dp f1', 'aiad', 'process', 'how to buy'])) {
        return {
            ok: true,
            answer: 'Procurement: Unit Requisition → Route (stock or DP F1) → Spec Evaluation → quotes → Cost Comparative → AIAD → PO → delivery → RV → issue.',
            ai: false, readOnly: true, offline: true
        };
    }

    if (any(q, ['inventory', 'stock', 'on hand']) && (inv.lines || []).length) {
        return { ok: true, answer: `Inventory: ${inv.lines.slice(0, 8).join('; ')}.`, ai: false, readOnly: true, offline: true };
    }

    return {
        ok: true,
        answer: 'Offline assistant — ask about stock, loans, requisitions, buying power, procurement, or ICT trends. Data comes from your saved local copy.',
        ai: false,
        readOnly: true,
        offline: true
    };
}

function any(q, words) {
    return words.some((w) => q.includes(w));
}

window.offlineAnswer = offlineAnswer;
