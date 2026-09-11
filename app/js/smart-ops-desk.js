/* smart-ops-desk.js — cross-module projection + priority (Creditors / Undelivered / Targets) */

function sodEscape(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function sodMoney(amount) {
    if (typeof formatCurrency === 'function') return formatCurrency(amount);
    return Number(amount || 0).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function sodFmt(amount) {
    return Number(amount || 0).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function sodTodayIso() {
    return typeof todayIsoLocal === 'function'
        ? todayIsoLocal()
        : new Date().toISOString().slice(0, 10);
}

function sodNav(moduleId, opts) {
    if (!moduleId) return;
    if (moduleId === 'doc-intel-roadmap') {
        if (typeof showToast === 'function') {
            showToast('See docs/INTELLIGENCE-ROADMAP.md in the repo for the full plan.', 'info');
        }
        return;
    }
    if (typeof navigateToModule === 'function') navigateToModule(moduleId, opts || {});
}

function sodCreditorsOpen() {
    if (typeof ensureSupplierDebts !== 'function') return [];
    const open = typeof SD_OPEN_STATUSES !== 'undefined' ? SD_OPEN_STATUSES : new Set(['open', 'chased_daf', 'part_paid']);
    return ensureSupplierDebts().filter((r) => open.has(r.status));
}

function sodCreditorScore(rec) {
    const age = typeof sdAgeDays === 'function' ? sdAgeDays(rec) : 0;
    const usd = typeof sdCaseUsd === 'function' ? sdCaseUsd(rec) : 0;
    const zwg = typeof sdCaseZwg === 'function' ? sdCaseZwg(rec) : 0;
    const amountWeight = usd > 0 ? usd : zwg * 0.002;
    const chasePenalty = rec.dafChasedAt ? -120 : 80;
    return amountWeight * 0.4 + age * 0.6 + chasePenalty;
}

function sodCreditorAmountLabel(rec) {
    if (typeof sdCaseAmountLabel === 'function') return sdCaseAmountLabel(rec);
    return `USD ${sodFmt(typeof sdCaseUsd === 'function' ? sdCaseUsd(rec) : 0)}`;
}

function sodTopCreditors(limit = 8) {
    return sodCreditorsOpen()
        .map((rec) => ({
            rec,
            age: typeof sdAgeDays === 'function' ? sdAgeDays(rec) : 0,
            score: sodCreditorScore(rec),
            chased: Boolean(rec.dafChasedAt)
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
}

function sodUndeliveredOpen() {
    if (typeof ensureUndelivered !== 'function') return [];
    const open = typeof UNDELIVERED_OPEN !== 'undefined' ? UNDELIVERED_OPEN : new Set(['awaiting', 'partial']);
    return ensureUndelivered().filter((r) => open.has(r.status));
}

function sodUndeliveredScore(row) {
    const age = typeof getUndeliveredAgeDays === 'function' ? getUndeliveredAgeDays(row) : 0;
    const bal = typeof getUndeliveredBalance === 'function' ? getUndeliveredBalance(row) : 0;
    return age * 0.7 + bal * 0.3 + (row.status === 'awaiting' ? 10 : 0);
}

function sodTopUndelivered(limit = 8) {
    return sodUndeliveredOpen()
        .map((row) => ({
            row,
            age: typeof getUndeliveredAgeDays === 'function' ? getUndeliveredAgeDays(row) : 0,
            bal: typeof getUndeliveredBalance === 'function' ? getUndeliveredBalance(row) : 0,
            score: sodUndeliveredScore(row)
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
}

function sodDemandSignals(limit = 8) {
    return sodUndeliveredOpen()
        .filter((row) => /parts|toner|consumable/i.test(String(row.category || '')))
        .map((row) => ({
            row,
            bal: typeof getUndeliveredBalance === 'function' ? getUndeliveredBalance(row) : 0,
            age: typeof getUndeliveredAgeDays === 'function' ? getUndeliveredAgeDays(row) : 0
        }))
        .sort((a, b) => b.bal - a.bal || b.age - a.age)
        .slice(0, limit);
}

function sodTargetSnapshot() {
    const ym = typeof getSelectedGlTargetMonth === 'function'
        ? getSelectedGlTargetMonth()
        : sodTodayIso().slice(0, 7);
    const gls = typeof GL_ACCOUNTS !== 'undefined' ? Object.keys(GL_ACCOUNTS) : [];
    const rows = [];
    let targetTotal = 0;
    let powerTotal = 0;
    let expendedTotal = 0;

    gls.forEach((gl) => {
        const target = typeof getGlMonthlyTarget === 'function' ? getGlMonthlyTarget(gl, ym) : 0;
        const power = typeof getGlBuyingPower === 'function' ? getGlBuyingPower(gl, ym) : 0;
        const expended = Math.max(0, Number(target) - Number(power));
        targetTotal += Number(target) || 0;
        powerTotal += Number(power) || 0;
        expendedTotal += expended;
        if (!(target > 0) && !(power !== 0)) return;
        const status = typeof getTargetStatus === 'function'
            ? getTargetStatus(target, power)
            : { label: '—', className: '' };
        rows.push({
            gl,
            name: GL_ACCOUNTS[gl]?.name || gl,
            target,
            expended,
            power,
            status
        });
    });

    rows.sort((a, b) => a.power - b.power);

    const day = Number(String(sodTodayIso()).slice(8, 10)) || 1;
    const burnPerDay = day > 0 ? expendedTotal / day : 0;
    const daysLeft = burnPerDay > 0
        ? Math.max(0, Math.round(powerTotal / burnPerDay))
        : (powerTotal > 0 ? null : 0);

    return {
        ym,
        rows,
        targetTotal,
        powerTotal,
        expendedTotal,
        burnPerDay,
        daysLeft,
        daf: typeof getMonthDafMeta === 'function' ? getMonthDafMeta(ym) : null
    };
}

function sodCreditorsTargetMeta() {
    const pack = typeof getAug2026CreditorsTargetPack === 'function'
        ? getAug2026CreditorsTargetPack()
        : null;
    const loaded = appState?.creditorsTargetAug2026 || null;
    return {
        totalZwg: pack?.totalZwg || loaded?.totalZwg || 0,
        released: Boolean(pack?.dafTargetReleased || loaded?.dafTargetReleased),
        minuteRef: pack?.minuteRef || loaded?.minuteRef || '',
        targetMonth: pack?.targetMonth || loaded?.targetMonth || ''
    };
}

function buildSmartOpsSnapshot() {
    const creditors = sodCreditorsOpen();
    const undelivered = sodUndeliveredOpen();
    const targets = sodTargetSnapshot();
    const credTarget = sodCreditorsTargetMeta();
    const overdue = undelivered.filter((row) => {
        const age = typeof getUndeliveredAgeDays === 'function' ? getUndeliveredAgeDays(row) : 0;
        return age >= 31;
    }).length;
    const unchased = creditors.filter((r) => !r.dafChasedAt && r.status === 'open').length;
    const topCreditors = sodTopCreditors();
    const topUndelivered = sodTopUndelivered();
    const demand = sodDemandSignals();

    const actions = [];
    if (targets.powerTotal <= 0 && targets.targetTotal <= 0) {
        actions.push({
            text: 'No DAF monthly targets recorded for this month — open GL Target Overview / Financial Year Bids.',
            moduleId: 'financial-year-bids',
            urgency: 'high'
        });
    } else if (targets.daysLeft != null && targets.daysLeft <= 7 && targets.powerTotal > 0) {
        actions.push({
            text: `Buying power may last ~${targets.daysLeft} day(s) at current burn — prioritise critical buys or seek DAF top-up / Release Cut.`,
            moduleId: 'release-cut',
            urgency: 'high'
        });
    }
    if (credTarget.released && credTarget.totalZwg > 0) {
        actions.push({
            text: `Creditors Target ${credTarget.targetMonth || ''} released (${sodFmt(credTarget.totalZwg)} ZWG${credTarget.minuteRef ? ` · ${credTarget.minuteRef}` : ''}) — track electronic POs / payment proof.`,
            moduleId: 'supplier-debts',
            urgency: 'high'
        });
    }
    if (unchased > 0) {
        actions.push({
            text: `${unchased} creditor case(s) still open and not chased — push DAF from Creditors.`,
            moduleId: 'supplier-debts',
            urgency: 'medium'
        });
    }
    if (overdue > 0) {
        actions.push({
            text: `${overdue} undelivered line(s) overdue 31d+ — chase suppliers or update deliveries.`,
            moduleId: 'undelivered-orders',
            urgency: 'medium'
        });
    }
    if (demand.length) {
        const units = demand.reduce((s, d) => s + d.bal, 0);
        actions.push({
            text: `${demand.length} Parts/Toner undelivered signal(s) · ${units} unit(s) outstanding (forecast Phase 3).`,
            moduleId: 'undelivered-orders',
            urgency: 'low'
        });
    }
    if (!actions.length) {
        actions.push({
            text: 'No urgent pressure detected — keep registers current and refresh after imports.',
            moduleId: 'smart-ops-desk',
            urgency: 'low'
        });
    }

    return {
        generatedAt: new Date().toISOString(),
        targets,
        credTarget,
        kpis: {
            creditorsOpen: creditors.length,
            undeliveredOpen: undelivered.length,
            overdue,
            unchased,
            powerTotal: targets.powerTotal,
            daysLeft: targets.daysLeft
        },
        topCreditors,
        topUndelivered,
        demand,
        actions
    };
}

function renderSmartOpsKpis(snap) {
    const set = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    };
    set('sodKpiBuying', sodMoney(snap.kpis.powerTotal));
    set(
        'sodKpiBurn',
        snap.kpis.daysLeft == null
            ? (snap.kpis.powerTotal > 0 ? 'Stable' : '—')
            : `${snap.kpis.daysLeft}d`
    );
    set('sodKpiCreditors', String(snap.kpis.creditorsOpen));
    set('sodKpiUndelivered', String(snap.kpis.undeliveredOpen));
    set('sodKpiOverdue', String(snap.kpis.overdue));
    set(
        'sodKpiCredTarget',
        snap.credTarget.totalZwg > 0 ? sodFmt(snap.credTarget.totalZwg) : '—'
    );
}

function renderSmartOpsTargets(snap) {
    const body = document.getElementById('sodTargetsBody');
    const narrative = document.getElementById('sodProjectionNarrative');
    if (narrative) {
        const ymLabel = typeof formatYmLabel === 'function'
            ? formatYmLabel(snap.targets.ym)
            : snap.targets.ym;
        const burn = snap.targets.burnPerDay;
        const days = snap.targets.daysLeft;
        const dafRef = snap.targets.daf?.ref ? ` · DAF ref ${snap.targets.daf.ref}` : '';
        let proj = `Month ${ymLabel}${dafRef}. Target ${sodMoney(snap.targets.targetTotal)}; expended ${sodMoney(snap.targets.expendedTotal)}; buying power ${sodMoney(snap.targets.powerTotal)}.`;
        if (burn > 0 && days != null) {
            proj += ` At ~${sodMoney(burn)}/day burn so far this month, remaining power projects to ~${days} day(s).`;
        } else if (snap.targets.powerTotal > 0 && burn <= 0) {
            proj += ' Little or no expenditure recorded yet this month — projection waits for PO/voucher activity.';
        } else if (!(snap.targets.targetTotal > 0)) {
            proj += ' Enter DAF vote amounts to unlock buying-power projection.';
        }
        narrative.textContent = proj;
    }
    if (!body) return;
    if (!snap.targets.rows.length) {
        body.innerHTML = '<tr><td colspan="5" class="empty-row">No GL targets for this month.</td></tr>';
        return;
    }
    body.innerHTML = snap.targets.rows.map((row) => `
        <tr>
            <td><strong>${sodEscape(row.gl)}</strong><br><span class="muted">${sodEscape(row.name)}</span></td>
            <td>${sodEscape(sodMoney(row.target))}</td>
            <td>${sodEscape(sodMoney(row.expended))}</td>
            <td><strong>${sodEscape(sodMoney(row.power))}</strong></td>
            <td><span class="${sodEscape(row.status.className || '')}">${sodEscape(row.status.label || '—')}</span></td>
        </tr>
    `).join('');
}

function renderSmartOpsCreditors(snap) {
    const host = document.getElementById('sodCreditorsList');
    if (!host) return;
    if (!snap.topCreditors.length) {
        host.innerHTML = '<p class="muted">No open creditor cases.</p>';
        return;
    }
    host.innerHTML = snap.topCreditors.map(({ rec, age, chased }) => `
        <button type="button" class="sod-priority-item" data-sod-nav="supplier-debts" data-sod-sd-id="${sodEscape(rec.id)}">
            <span class="sod-priority-title">${sodEscape(rec.supplier || 'Supplier')}</span>
            <span class="sod-priority-meta">${sodEscape(sodCreditorAmountLabel(rec))} · ${age}d · ${chased ? 'chased' : 'not chased'}</span>
            <span class="sod-priority-why muted">${sodEscape((rec.lines || []).map((l) => l.poNo).filter(Boolean)[0] || rec.minuteRef || rec.caseNo || '')}</span>
        </button>
    `).join('');
}

function renderSmartOpsUndelivered(snap) {
    const host = document.getElementById('sodUndeliveredList');
    if (!host) return;
    if (!snap.topUndelivered.length) {
        host.innerHTML = '<p class="muted">No open undelivered lines.</p>';
        return;
    }
    host.innerHTML = snap.topUndelivered.map(({ row, age, bal }) => `
        <button type="button" class="sod-priority-item" data-sod-nav="undelivered-orders">
            <span class="sod-priority-title">${sodEscape(row.item || 'Item')}</span>
            <span class="sod-priority-meta">${sodEscape(row.supplier || '—')} · ${sodEscape(row.poNo || '—')} · bal ${bal} · ${age}d</span>
            <span class="sod-priority-why muted">${sodEscape(row.remarks || row.status || '')}</span>
        </button>
    `).join('');
}

function renderSmartOpsDemand(snap) {
    const host = document.getElementById('sodDemandList');
    if (!host) return;
    if (!snap.demand.length) {
        host.innerHTML = '<p class="muted">No Parts/Toner undelivered signals right now.</p>';
        return;
    }
    host.innerHTML = snap.demand.map(({ row, bal, age }) => `
        <div class="sod-priority-item sod-priority-static">
            <span class="sod-priority-title">${sodEscape(row.item || 'Item')}</span>
            <span class="sod-priority-meta">${sodEscape(row.category || '')} · bal ${bal} · ${age}d · ${sodEscape(row.supplier || '')}</span>
        </div>
    `).join('');
}

function renderSmartOpsActions(snap) {
    const host = document.getElementById('sodActionsList');
    if (!host) return;
    host.innerHTML = snap.actions.map((action) => `
        <li class="sod-action sod-action-${sodEscape(action.urgency)}">
            <button type="button" class="btn btn-ghost btn-sm" data-sod-nav="${sodEscape(action.moduleId)}">Go</button>
            <span>${sodEscape(action.text)}</span>
        </li>
    `).join('');
}

function renderSmartOpsDesk(snapshot) {
    const snap = snapshot || buildSmartOpsSnapshot();
    renderSmartOpsKpis(snap);
    renderSmartOpsTargets(snap);
    renderSmartOpsCreditors(snap);
    renderSmartOpsUndelivered(snap);
    renderSmartOpsDemand(snap);
    renderSmartOpsActions(snap);
    const updated = document.getElementById('sodUpdatedAt');
    if (updated) {
        updated.textContent = `Updated ${String(snap.generatedAt).slice(0, 19).replace('T', ' ')}`;
    }
    window._smartOpsSnapshot = snap;
    return snap;
}

async function sodRequestAiBrief() {
    const panel = document.getElementById('sodAiBriefPanel');
    const body = document.getElementById('sodAiBriefBody');
    const btn = document.getElementById('sodAiBriefBtn');
    const snap = window._smartOpsSnapshot || buildSmartOpsSnapshot();
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Thinking…';
    }
    if (panel) panel.hidden = false;
    if (body) body.textContent = 'Building brief from live registers…';

    const facts = [
        `Month ${snap.targets.ym}: buying power ${sodFmt(snap.kpis.powerTotal)}, projected days left ${snap.kpis.daysLeft ?? 'n/a'}.`,
        `Open creditors ${snap.kpis.creditorsOpen} (${snap.kpis.unchased} unchased).`,
        `Undelivered open ${snap.kpis.undeliveredOpen}, overdue 31d+ ${snap.kpis.overdue}.`,
        snap.credTarget.totalZwg
            ? `Creditors Target ZWG ${sodFmt(snap.credTarget.totalZwg)} released=${snap.credTarget.released}.`
            : 'No Creditors Target batch loaded.',
        'Top creditors: ' + snap.topCreditors.slice(0, 5).map(({ rec, age }) =>
            `${rec.supplier} (${sodCreditorAmountLabel(rec)}, ${age}d)`).join('; '),
        'Top undelivered: ' + snap.topUndelivered.slice(0, 5).map(({ row, age, bal }) =>
            `${row.item} / ${row.poNo} bal ${bal} ${age}d`).join('; ')
    ].join('\n');

    const question =
        'You are assisting ZNA IT Dir Tech Stores. Using ONLY the facts below, write a short ops brief: ' +
        '(1) top 3 pressures, (2) what to do today, (3) what can wait. Be concrete. No invented figures.\n\n' + facts;

    try {
        const apiBase = (typeof getApiBase === 'function' ? getApiBase() : '') || '';
        const res = await fetch(`${apiBase}/api/ai/ask`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                question,
                context: { module: 'smart-ops-desk', snapshot: {
                    kpis: snap.kpis,
                    ym: snap.targets.ym,
                    actions: snap.actions
                } }
            })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || `AI brief failed (${res.status})`);
        const answer = data.answer || data.text || '';
        if (body) {
            body.innerHTML = answer
                ? `<pre class="sod-ai-pre">${sodEscape(answer)}</pre>`
                : '<p class="muted">No brief returned. Heuristic actions above still apply.</p>';
        }
        if (typeof showToast === 'function') {
            showToast(data.ai ? 'AI ops brief ready.' : 'Heuristic brief ready (set OPENAI_API_KEY for full AI).', 'success');
        }
    } catch (err) {
        if (body) {
            body.innerHTML =
                `<p class="muted">${sodEscape(err.message || 'AI brief unavailable.')}</p>` +
                `<ul>${snap.actions.map((a) => `<li>${sodEscape(a.text)}</li>`).join('')}</ul>`;
        }
        if (typeof showToast === 'function') showToast(err.message || 'AI brief failed.', 'warning');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.textContent = 'AI ops brief';
        }
    }
}

function initSmartOpsDeskModule() {
    const root = document.getElementById('smart-ops-desk');
    if (!root) return;

    renderSmartOpsDesk();

    if (root.dataset.sodBound === '1') return;
    root.dataset.sodBound = '1';

    document.getElementById('sodRefreshBtn')?.addEventListener('click', () => {
        renderSmartOpsDesk();
        if (typeof showToast === 'function') showToast('Smart Ops Desk refreshed.', 'success');
    });
    document.getElementById('sodAiBriefBtn')?.addEventListener('click', () => sodRequestAiBrief());

    root.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-sod-nav]');
        if (!btn) return;
        e.preventDefault();
        const moduleId = btn.getAttribute('data-sod-nav');
        const sdId = btn.getAttribute('data-sod-sd-id');
        sodNav(moduleId, sdId ? { sdId } : undefined);
    });
}

window.buildSmartOpsSnapshot = buildSmartOpsSnapshot;
window.renderSmartOpsDesk = renderSmartOpsDesk;
window.initSmartOpsDeskModule = initSmartOpsDeskModule;

function updateSmartOpsDashboardTeaser() {
    const el = document.getElementById('smartOpsTeaserText');
    if (!el || typeof buildSmartOpsSnapshot !== 'function') return;
    try {
        const snap = buildSmartOpsSnapshot();
        const days = snap.kpis.daysLeft;
        const daysTxt = days == null ? 'burn stable' : `~${days}d power left`;
        el.textContent =
            `${daysTxt} · ${snap.kpis.creditorsOpen} creditors · ${snap.kpis.undeliveredOpen} undelivered` +
            (snap.kpis.overdue ? ` · ${snap.kpis.overdue} overdue` : '') +
            (snap.actions[0] ? ` — ${snap.actions[0].text}` : '');
    } catch (_) {
        el.textContent = 'Open Smart Ops Desk for Creditors / Undelivered / target projection.';
    }
}

window.updateSmartOpsDashboardTeaser = updateSmartOpsDashboardTeaser;
