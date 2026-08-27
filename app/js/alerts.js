/* alerts.js — system alerts panel (clickable → related module) */

/** ICT procurement steps still with IT Directorate (pre-DP / ITDIR eval / verify). */
const ALERT_PENDING_AT_ITDIR_STATUSES = new Set([
    'requisition',
    'spec_raise_f1',
    'quotes_itdir_eval',
    'delivery_verified'
]);

/** ICT procurement steps still with DP / AIAD (F1 lodged, returned, diligence). */
const ALERT_PENDING_AT_DP_STATUSES = new Set([
    'f1_with_dp',
    'spec_returned_dp',
    'aiad_due_diligence',
    'aiad_certificate'
]);

function escapeAlertText(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function mapDpProcAlertRows(statusSet) {
    const list = typeof ensureDpProcurements === 'function' ? ensureDpProcurements() : [];
    return list
        .map((rec) => {
            const status = typeof normalizeDpProcStatus === 'function'
                ? normalizeDpProcStatus(rec.status)
                : rec.status;
            return { rec, status };
        })
        .filter(({ status }) => statusSet.has(status));
}

function getPendingRequisitionsAtItDir() {
    return mapDpProcAlertRows(ALERT_PENDING_AT_ITDIR_STATUSES);
}

function getPendingRequisitionsAtDp() {
    return mapDpProcAlertRows(ALERT_PENDING_AT_DP_STATUSES);
}

function isGateAlertsScope() {
    return typeof isGateRegisterRole === 'function' && isGateRegisterRole();
}

const GATE_ALERT_DEPARTMENT = 'IT DIR GATE / RP';

/** Equipment still on gate premises (Date In recorded, no Date Out). */
function getGateRegisterAlerts() {
    const rows = appState?.modules?.['gate-register']?.tables?.['gate-register-table-body'];
    if (!Array.isArray(rows)) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const alerts = [];

    rows.forEach((row) => {
        const cells = row.cells || [];
        const dateIn = String(cells[0]?.value || '').slice(0, 10);
        const equipType = String(cells[1]?.value || 'Equipment').trim();
        const serialOrZa = String(cells[2]?.value || '').trim();
        const unit = String(cells[3]?.value || '').trim();
        const remark = String(cells[5]?.value || '').trim();
        const dateOut = String(cells[6]?.value || '').slice(0, 10);

        if (!dateIn || dateOut) return;

        const start = new Date(`${dateIn}T00:00:00`);
        if (Number.isNaN(start.getTime())) return;
        start.setHours(0, 0, 0, 0);
        const daysOnSite = Math.max(0, Math.ceil((today - start) / (1000 * 60 * 60 * 24)));
        const identity = [equipType, serialOrZa].filter(Boolean).join(' · ') || equipType;
        const unitLabel = unit || 'Unit/Formation';

        alerts.push({
            type: daysOnSite > 14 ? 'warning' : (daysOnSite > 7 ? 'info' : 'info'),
            target: 'gate-register',
            department: GATE_ALERT_DEPARTMENT,
            focus: serialOrZa || equipType,
            receivedDate: dateIn,
            ageDays: daysOnSite,
            priority: daysOnSite > 14 ? 'high' : 'normal',
            text: `${identity} — ${unitLabel} on site ${daysOnSite} day(s) (in ${dateIn}${remark ? ` · ${remark}` : ''})`
        });
    });

    return alerts.sort((a, b) => (b.ageDays || 0) - (a.ageDays || 0));
}

function buildGateWatchAlertSections() {
    const gateItems = getGateRegisterAlerts();
    const onSite = gateItems.length;
    const longStay = gateItems.filter((a) => (a.ageDays || 0) > 7).length;
    const inboxCount = typeof getInboxMessages === 'function'
        ? getInboxMessages().filter((m) => !isMessageRead(m)).length
        : 0;

    const sections = [{
        key: 'gate-on-site',
        title: 'EQUIPMENT AT GATE (AWAITING RELEASE)',
        count: onSite,
        target: 'gate-register',
        tone: onSite ? (longStay ? 'warning' : 'info') : 'ok',
        summary: onSite
            ? `${onSite} item(s) checked in at the gate with no Date Out recorded${longStay ? ` (${longStay} over 7 days)` : ''}.`
            : 'None — no ICT equipment currently held at the gate.',
        items: gateItems.slice(0, 12)
    }];

    if (inboxCount > 0) {
        sections.push({
            key: 'gate-messages',
            title: 'MESSAGES TO GATE / RP',
            count: inboxCount,
            target: '',
            tone: 'warning',
            summary: `${inboxCount} unread message(s) addressed to Gate / RP — open the Inbox tab.`,
            items: (typeof getInboxMessages === 'function' ? getInboxMessages() : [])
                .filter((m) => typeof isMessageRead === 'function' && !isMessageRead(m))
                .slice(0, 6)
                .map((m) => ({
                    type: m.priority === 'urgent' || m.priority === 'critical' ? 'warning' : 'info',
                    target: '',
                    department: GATE_ALERT_DEPARTMENT,
                    text: `${m.subject || 'Office message'} — from ${m.fromName || m.fromOffice || 'Sender'}`,
                    receivedDate: (m.messageDate || m.createdAt || '').slice(0, 10)
                }))
        });
    }

    return sections;
}

function alertRelevantToGateUser(alert) {
    if (!alert) return false;
    const dept = gateNormKey(alert.department || '');
    const gateDept = gateNormKey(GATE_ALERT_DEPARTMENT);
    if (dept && (dept === gateDept || dept.includes('GATE') || dept.includes(' RP'))) return true;
    if (alert.target === 'gate-register') return true;
    const text = gateNormKey(alert.text || '');
    if (text.includes('GATE') || text.includes('SVCS1045') || text.includes('SVCS 1045')) return true;
    return false;
}

function gateNormKey(value) {
    return String(value || '')
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function getOpenUnitRequisitionsAtItDir() {
    const list = typeof ensureRequisitions === 'function' ? ensureRequisitions() : [];
    const openSet = typeof REQ_OPEN_STATUSES !== 'undefined'
        ? REQ_OPEN_STATUSES
        : new Set(['received', 'in_progress', 'part_issued']);
    return list
        .filter((req) => openSet.has(req.status))
        .map((req) => {
            const age = typeof getRequisitionAgeDays === 'function' ? getRequisitionAgeDays(req) : 0;
            const bucket = typeof getRequisitionAgeBucket === 'function'
                ? getRequisitionAgeBucket(age, req.status)
                : { key: 'ok' };
            return { req, age, bucket };
        })
        .sort((a, b) => b.age - a.age || String(a.req.unit || '').localeCompare(String(b.req.unit || '')));
}

function getPurchaseOrdersAwaitingDelivery() {
    const list = typeof ensureUndelivered === 'function' ? ensureUndelivered() : [];
    const openSet = typeof UNDELIVERED_OPEN !== 'undefined'
        ? UNDELIVERED_OPEN
        : new Set(['awaiting', 'partial']);
    return list.filter((row) => openSet.has(row.status));
}

function mapDpProcWatchItems(rows) {
    return rows.slice(0, 8).map(({ rec, status }) => {
        const label = typeof getDpProcStatusMeta === 'function'
            ? getDpProcStatusMeta(status).short
            : status;
        return {
            type: status === 'aiad_due_diligence' || status === 'quotes_itdir_eval' ? 'warning' : 'info',
            target: 'dp-procurement',
            dpId: rec.id,
            text: `${rec.refNo || 'DP F1'}: ${label} — ${rec.itemSummary || 'Items'}`,
            receivedDate: (rec.updatedAt || rec.createdAt || '').slice(0, 10),
            department: status && String(status).startsWith('aiad') ? 'AIAD' : 'DP',
            priority: status === 'aiad_due_diligence' ? 'high' : 'normal'
        };
    });
}

function buildWatchAlertSections() {
    if (isGateAlertsScope()) return buildGateWatchAlertSections();

    const unitAtItDir = getOpenUnitRequisitionsAtItDir();
    const procAtItDir = getPendingRequisitionsAtItDir();
    const pendingItDirCount = unitAtItDir.length + procAtItDir.length;
    const pendingDp = getPendingRequisitionsAtDp();
    const awaitingPo = getPurchaseOrdersAwaitingDelivery();
    const qtyOut = typeof getUndeliveredSummary === 'function'
        ? getUndeliveredSummary().qtyOutstanding
        : awaitingPo.reduce((sum, r) => {
            const bal = typeof getUndeliveredBalance === 'function'
                ? getUndeliveredBalance(r)
                : Math.max(0, (Number(r.qty) || 0) - (Number(r.qtyDelivered) || 0));
            return sum + bal;
        }, 0);

    const itDirItems = [
        ...unitAtItDir.slice(0, 6).map(({ req, age, bucket }) => {
            const cat = typeof getRequisitionCategoryLabel === 'function'
                ? getRequisitionCategoryLabel(req.category)
                : (req.category || '');
            return {
                type: bucket.key === 'overdue' ? 'danger' : (bucket.key === 'aging' || req.priority === 'urgent' ? 'warning' : 'info'),
                target: 'unit-requisitions',
                reqId: req.id,
                text: `Unit req ${req.reqNo || '—'}: ${req.unit || 'Unit/Formation'} — ${req.itemDescription || cat}${age ? ` (${age}d)` : ''}`,
                receivedDate: req.receivedDate || '',
                dueDate: '',
                ageDays: age,
                priority: req.priority === 'urgent' ? 'high' : 'normal',
                department: 'IT DIR TECHSTORES OFFICE',
                redFlag: bucket.key === 'overdue' || req.priority === 'urgent'
            };
        }),
        ...mapDpProcWatchItems(procAtItDir)
    ].slice(0, 10);

    const sections = [];

    const ym = typeof getSelectedGlTargetMonth === 'function' ? getSelectedGlTargetMonth() : '';
    const proposal = typeof getMonthlyTargetProposal === 'function' ? getMonthlyTargetProposal(ym) : null;
    const openReqsForMonth = typeof requisitionsForTargetMonth === 'function'
        ? requisitionsForTargetMonth(ym, { openOnly: true })
        : [];
    const proposalItems = [];
    if (proposal) {
        proposalItems.push({
            type: proposal.status === 'draft' ? 'warning' : 'info',
            target: 'dashboard',
            text: `${typeof formatYmLabel === 'function' ? formatYmLabel(ym) : ym} proposal ${proposal.ref || ''} — ${typeof formatCurrency === 'function' ? formatCurrency(proposal.totalRequested || 0) : proposal.totalRequested} ${proposal.currency || 'ZWG'} (${proposal.status || 'draft'})`
        });
    }
    openReqsForMonth.slice(0, 4).forEach((req) => {
        const inProposal = proposal?.lines?.some((l) => l.requisitionId === req.id);
        proposalItems.push({
            type: req.priority === 'urgent' ? 'warning' : 'info',
            target: 'unit-requisitions',
            reqId: req.id,
            text: `${req.reqNo || 'REQ'} · ${req.unit || 'Unit'} — ${req.itemDescription || req.subject}${inProposal ? ' · in target proposal' : ' · not yet in proposal'}`
        });
    });
    sections.push({
        key: 'monthly-target-proposal',
        title: 'MONTHLY TARGET PROPOSAL / PRIORITY LIST',
        count: (proposal ? 1 : 0) + openReqsForMonth.length,
        target: 'dashboard',
        tone: proposal?.status === 'draft' ? 'warning' : (openReqsForMonth.length ? 'warning' : 'ok'),
        summary: proposal
            ? `${typeof formatYmLabel === 'function' ? formatYmLabel(ym) : ym}: ${proposal.lines?.length || 0} line(s), ${openReqsForMonth.length} open req(s) for this month.`
            : (openReqsForMonth.length
                ? `${openReqsForMonth.length} open requisition(s) for ${typeof formatYmLabel === 'function' ? formatYmLabel(ym) : ym} — build a target proposal.`
                : 'No target proposal for the selected month.'),
        items: proposalItems.slice(0, 8)
    });

    // Always show — keyed watch items for the TechStores dashboard
    sections.push({
        key: 'pending-at-itdir',
        title: 'PENDING REQUISITIONS (STILL AT IT DIR)',
        count: pendingItDirCount,
        target: unitAtItDir.length ? 'unit-requisitions' : 'dp-procurement',
        tone: pendingItDirCount ? 'warning' : 'ok',
        summary: pendingItDirCount
            ? `${unitAtItDir.length} unit/formation req(s) + ${procAtItDir.length} procurement step(s) still with IT Dir.`
            : 'None — no requisitions currently held at IT Dir.',
        items: itDirItems
    });

    sections.push({
        key: 'pending-at-dp',
        title: 'PENDING REQUISITIONS (STILL AT DP)',
        count: pendingDp.length,
        target: 'dp-procurement',
        tone: pendingDp.length ? 'warning' : 'ok',
        summary: pendingDp.length
            ? `${pendingDp.length} requirement(s) still with DP / AIAD (F1 lodged or under diligence).`
            : 'None — no requisitions currently held at DP.',
        items: mapDpProcWatchItems(pendingDp)
    });

    sections.push({
        key: 'po-awaiting',
        title: 'PURCHASE ORDERS (AWAITING DELIVERY)',
        count: awaitingPo.length,
        target: 'undelivered-orders',
        tone: awaitingPo.length ? 'warning' : 'ok',
        summary: awaitingPo.length
            ? `${awaitingPo.length} PO line(s) awaiting delivery (${qtyOut} unit(s) outstanding).`
            : 'None — no purchase orders awaiting delivery.',
        items: awaitingPo.slice(0, 8).map((row) => {
            const bal = typeof getUndeliveredBalance === 'function'
                ? getUndeliveredBalance(row)
                : Math.max(0, (Number(row.qty) || 0) - (Number(row.qtyDelivered) || 0));
            const age = typeof getUndeliveredAgeDays === 'function' ? getUndeliveredAgeDays(row) : 0;
            const overdue = typeof getUndeliveredAgeBucket === 'function'
                && getUndeliveredAgeBucket(age, row.status).key === 'overdue';
            return {
                type: overdue ? 'danger' : (row.status === 'partial' ? 'warning' : 'info'),
                target: 'undelivered-orders',
                undId: row.id,
                text: `${row.item || 'Item'} × ${bal} — PO ${row.poNo || '—'} / ${row.supplier || 'supplier'}${overdue ? ` (${age}d overdue)` : ''}`,
                receivedDate: row.orderedDate || row.receivedDate || '',
                dueDate: row.expectedDate || '',
                ageDays: age,
                department: 'DP',
                priority: overdue ? 'critical' : 'high',
                redFlag: overdue
            };
        })
    });

    const orderlyOpen = typeof getOrderlyOpenForTechStores === 'function'
        ? getOrderlyOpenForTechStores()
        : [];
    const orderlyItems = typeof getOrderlyRoomAlerts === 'function'
        ? getOrderlyRoomAlerts().slice(0, 10)
        : orderlyOpen.slice(0, 10).map((row) => ({
            type: row.priority === 'urgent' ? 'danger' : 'warning',
            target: 'orderly-room',
            orId: row.id,
            text: `DF: ${row.refNo || 'letter'} — ${row.fromUnit || 'Unit'} · ${row.subject || 'Requisition'}`
        }));

    sections.unshift({
        key: 'orderly-df-reqs',
        title: 'ORDERLY ROOM — REQUISITIONS FOR TECHSTORES',
        count: orderlyOpen.length,
        target: 'orderly-room',
        tone: orderlyOpen.length ? 'warning' : 'ok',
        summary: orderlyOpen.length
            ? `${orderlyOpen.length} requisition letter(s) filed in DF / First Sight awaiting TechStores / RQ action (GS Branch often authorises).`
            : 'None — no Orderly Room requisitions pending for TechStores.',
        items: orderlyItems
    });

    return sections;
}

function renderAlertItemHtml(alert) {
    const target = alert.target || '';
    const reqId = alert.reqId || '';
    const undId = alert.undId || '';
    const dpId = alert.dpId || '';
    const loanId = alert.loanId || '';
    const orId = alert.orId || '';
    const focus = alert.focus || '';
    const clickable = !!target;
    const tag = clickable ? 'button' : 'div';
    const attrs = clickable
        ? `type="button" data-alert-target="${escapeAlertText(target)}"${reqId ? ` data-alert-req-id="${escapeAlertText(reqId)}"` : ''}${undId ? ` data-alert-und-id="${escapeAlertText(undId)}"` : ''}${dpId ? ` data-alert-dp-id="${escapeAlertText(dpId)}"` : ''}${loanId ? ` data-alert-loan-id="${escapeAlertText(loanId)}"` : ''}${orId ? ` data-alert-or-id="${escapeAlertText(orId)}"` : ''}${focus ? ` data-alert-focus="${escapeAlertText(focus)}"` : ''} title="Open related form"`
        : '';
    return `<${tag} class="alert-item alert-${alert.type || 'info'}-item${clickable ? ' alert-item-link' : ''}" ${attrs}>${escapeAlertText(alert.text)}</${tag}>`;
}

function renderWatchSectionHtml(section) {
    const headTag = section.target ? 'button' : 'div';
    const headAttrs = section.target
        ? `type="button" class="alert-watch-head alert-watch-head-link" data-alert-target="${escapeAlertText(section.target)}" title="Open related module"`
        : 'class="alert-watch-head"';
    const itemsHtml = (section.items || []).map(renderAlertItemHtml).join('');
    const more = section.count > (section.items?.length || 0)
        ? `<div class="alert-watch-more">+ ${section.count - section.items.length} more — open module to review all</div>`
        : '';
    return `
        <section class="alert-watch alert-watch-${escapeAlertText(section.tone)}" data-alert-watch="${escapeAlertText(section.key)}">
            <${headTag} ${headAttrs}>
                <span class="alert-watch-title">${escapeAlertText(section.title)}</span>
                <span class="alert-watch-count">${section.count}</span>
            </${headTag}>
            <p class="alert-watch-summary">${escapeAlertText(section.summary)}</p>
            ${itemsHtml}${more}
        </section>
    `;
}

function updateSystemAlerts() {
    const listEl = document.getElementById('systemAlertsList');
    if (!listEl) return 0;

    if (isGateAlertsScope()) {
        const watchSections = buildGateWatchAlertSections();
        const gateAlerts = getGateRegisterAlerts();
        if (typeof renderAlertDesk === 'function') {
            return renderAlertDesk(watchSections, gateAlerts);
        }
        const fallbackWatch = watchSections.map(renderWatchSectionHtml).join('');
        const otherHtml = gateAlerts.length
            ? gateAlerts.map(renderAlertItemHtml).join('')
            : '<div class="alert-item alert-success-item">No equipment currently held at the gate.</div>';
        listEl.innerHTML = fallbackWatch + otherHtml;
        return watchSections.reduce((n, s) => n + s.count, 0) + gateAlerts.length;
    }

    const watchSections = buildWatchAlertSections();
    const watchCount = watchSections.reduce((n, s) => n + s.count, 0);

    const alerts = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const loans = appState.modules['temporary-loans'];
    if (typeof getTemporaryLoanAlerts === 'function') {
        getTemporaryLoanAlerts().forEach((alert) => alerts.push(alert));
    } else if (loans?.tables?.['loans-table-body']) {
        loans.tables['loans-table-body'].forEach((row, index) => {
            const cells = row.cells || [];
            const hasZa = cells.length >= 13;
            const item = hasZa
                ? ((cells[1]?.value ? `${cells[1].value} ` : '') + (cells[2]?.value || `Loan ${index + 1}`)).trim()
                : (cells[1]?.value || `Loan ${index + 1}`);
            const issuedTo = hasZa ? (cells[6]?.value || 'Unknown') : (cells[5]?.value || 'Unknown');
            const expectedIndex = hasZa ? 9 : (cells.length >= 12 ? 8 : -1);
            const returnedIndex = hasZa ? 10 : (cells.length >= 12 ? 9 : -1);
            const expected = expectedIndex >= 0 ? cells[expectedIndex]?.value : '';
            const returned = returnedIndex >= 0 ? cells[returnedIndex]?.value : '';

            if (expected && !returned) {
                const due = new Date(expected);
                due.setHours(0, 0, 0, 0);
                if (due < today) {
                    alerts.push({
                        type: 'danger',
                        target: 'temporary-loans',
                        text: `Overdue loan: ${item} issued to ${issuedTo} (due ${expected}).`
                    });
                } else {
                    const daysLeft = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
                    if (daysLeft <= 7) {
                        alerts.push({
                            type: 'warning',
                            target: 'temporary-loans',
                            text: `Loan due soon: ${item} to ${issuedTo} (${daysLeft} day(s) left).`
                        });
                    }
                }
            }
        });
    }

    if (typeof getPermanentLoanAlerts === 'function') {
        getPermanentLoanAlerts().forEach((alert) => alerts.push(alert));
    }

    const suppliers = appState.modules['suppliers-contracts'];
    if (suppliers?.tables?.['suppliers-table-body']) {
        suppliers.tables['suppliers-table-body'].forEach((row) => {
            const cells = row.cells || [];
            const name = cells[1]?.value || 'Supplier';
            const endDate = cells[6]?.value;
            const status = cells[7]?.value || '';
            if (!endDate || status === 'Inactive') return;

            const expiry = new Date(endDate);
            expiry.setHours(0, 0, 0, 0);
            const daysLeft = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

            if (daysLeft < 0) {
                alerts.push({
                    type: 'danger',
                    target: 'suppliers-contracts',
                    text: `Expired contract: ${name} (ended ${endDate}).`
                });
            } else if (daysLeft <= 30) {
                alerts.push({
                    type: 'warning',
                    target: 'suppliers-contracts',
                    text: `Contract expiring: ${name} in ${daysLeft} day(s) (${endDate}).`
                });
            }
        });
    }

    getInventoryAlerts().forEach((alert) => alerts.push(alert));
    if (typeof getSoftwareRenewalAlerts === 'function') {
        getSoftwareRenewalAlerts().forEach((alert) => alerts.push(alert));
    }
    if (typeof getStoresItemDepletionAlerts === 'function') {
        getStoresItemDepletionAlerts().forEach((alert) => alerts.push(alert));
    }
    if (typeof getTargetProposalAlerts === 'function') {
        getTargetProposalAlerts().forEach((alert) => alerts.push(alert));
    }
    // Unit requisitions are covered by PENDING REQUISITIONS (STILL AT IT DIR)
    if (typeof getRequisitionAlerts === 'function') {
        getRequisitionAlerts({ skipWatchCovered: true }).forEach((alert) => alerts.push(alert));
    }
    // Undelivered + DP / IT Dir watch items are dedicated sections above
    if (typeof getUndeliveredAlerts === 'function') {
        getUndeliveredAlerts({ skipSummaries: true }).forEach((alert) => alerts.push(alert));
    }
    if (typeof getDpProcurementAlerts === 'function') {
        getDpProcurementAlerts({ skipWatchCovered: true }).forEach((alert) => alerts.push(alert));
    }

    if (typeof getUnitCheckAlerts === 'function') {
        getUnitCheckAlerts().forEach((alert) => alerts.push(alert));
    }

    const watchHtml = '';
    let otherHtml = '';
    if (typeof renderAlertDesk === 'function') {
        const deskCount = renderAlertDesk(watchSections, alerts);
        return deskCount;
    }
    // Fallback (desk unavailable)
    const fallbackWatch = watchSections.map(renderWatchSectionHtml).join('');
    if (alerts.length) {
        otherHtml = `
            <div class="alert-other-label">Other alerts</div>
            ${alerts.map(renderAlertItemHtml).join('')}
        `;
    } else if (!watchCount) {
        otherHtml = '<div class="alert-item alert-success-item">No overdue loans, expiring contracts, or stock issues.</div>';
    }
    listEl.innerHTML = fallbackWatch + otherHtml;
    return watchCount + alerts.length;
}

function initSystemAlertsClicks() {
    const board = document.getElementById('dashCommandBoard') || document.getElementById('systemAlertsList');
    if (!board || board.dataset.alertClicksBound === '1') return;
    board.dataset.alertClicksBound = '1';

    board.addEventListener('click', (e) => {
        if (e.target.closest('[data-ad-stop], .ad-controls, .ad-comments, .ad-toolbar, select, input, textarea, label')) {
            return;
        }
        const item = e.target.closest('[data-alert-target]');
        if (!item) return;
        e.preventDefault();
        const target = item.getAttribute('data-alert-target');
        const reqId = item.getAttribute('data-alert-req-id');
        const undId = item.getAttribute('data-alert-und-id');
        const dpId = item.getAttribute('data-alert-dp-id');
        const loanId = item.getAttribute('data-alert-loan-id');
        const orId = item.getAttribute('data-alert-or-id');
        const focus = item.getAttribute('data-alert-focus');
        if (!target || typeof navigateToModule !== 'function') return;
        navigateToModule(target);
        if (reqId && target === 'unit-requisitions' && typeof editRequisition === 'function') {
            setTimeout(() => editRequisition(reqId), 50);
        }
        if (undId && target === 'undelivered-orders' && typeof editUndelivered === 'function') {
            setTimeout(() => editUndelivered(undId), 50);
        }
        if (dpId && target === 'dp-procurement' && typeof editDpProcurement === 'function') {
            setTimeout(() => editDpProcurement(dpId), 50);
        }
        if (orId && target === 'orderly-room' && typeof focusOrderlyEntry === 'function') {
            setTimeout(() => focusOrderlyEntry(orId), 80);
        }
        if (loanId && target === 'temporary-loans') {
            setTimeout(() => {
                const row = document.querySelector(`#loans-table-body tr[data-loan-id="${CSS.escape(loanId)}"]`)
                    || document.querySelector(`#temporary-loans [data-id="${CSS.escape(loanId)}"]`);
                row?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                row?.classList.add('alert-flash-row');
                setTimeout(() => row?.classList.remove('alert-flash-row'), 2500);
            }, 80);
        }
        if (loanId && target === 'permanent-loans' && typeof openPermanentLoanRecord === 'function') {
            setTimeout(() => openPermanentLoanRecord(loanId), 80);
        }
        if (focus) {
            setTimeout(() => {
                const el = document.getElementById(focus) || document.querySelector(focus);
                el?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
                if (el && typeof el.focus === 'function') el.focus();
            }, 80);
        }
    });
}
