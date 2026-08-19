/* techstores-period-report.js — Monthly / quarterly / yearly TechStores consolidated report
 * Matches IT Dir TechStores Report style (RESTRICTED memo sections).
 */

function tsPeriodIsoDate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function tsPeriodStartOfMonth(d) {
    return new Date(d.getFullYear(), d.getMonth(), 1);
}

function tsPeriodEndOfMonth(d) {
    return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function tsPeriodQuarterBounds(d) {
    const q = Math.floor(d.getMonth() / 3);
    const from = new Date(d.getFullYear(), q * 3, 1);
    const to = new Date(d.getFullYear(), q * 3 + 3, 0);
    return { from, to, quarter: q + 1 };
}

/**
 * Apply Monthly / Quarterly / Yearly / Custom period to report date inputs.
 * @param {'month'|'quarter'|'year'|'custom'} preset
 */
function applyTechStoresReportPeriod(preset) {
    const fromEl = document.getElementById('reportDateFrom');
    const toEl = document.getElementById('reportDateTo');
    const labelEl = document.getElementById('reportPeriodLabel');
    if (!fromEl || !toEl) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let from = '';
    let to = '';
    let label = 'Custom period';

    if (preset === 'month') {
        from = tsPeriodIsoDate(tsPeriodStartOfMonth(today));
        to = tsPeriodIsoDate(tsPeriodEndOfMonth(today));
        label = today.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    } else if (preset === 'quarter') {
        const bounds = tsPeriodQuarterBounds(today);
        from = tsPeriodIsoDate(bounds.from);
        to = tsPeriodIsoDate(bounds.to);
        label = `Q${bounds.quarter} ${today.getFullYear()}`;
    } else if (preset === 'year') {
        from = `${today.getFullYear()}-01-01`;
        to = `${today.getFullYear()}-12-31`;
        label = `Year ${today.getFullYear()}`;
    } else {
        from = fromEl.value || '';
        to = toEl.value || '';
        label = from || to ? `${from || '…'} to ${to || '…'}` : 'All dates';
    }

    if (preset !== 'custom') {
        fromEl.value = from;
        toEl.value = to;
    }
    if (labelEl) labelEl.textContent = label;

    document.querySelectorAll('[data-report-period]').forEach((btn) => {
        btn.classList.toggle('active', btn.getAttribute('data-report-period') === preset);
    });

    return { from, to, label, preset };
}

function getTechStoresPeriodLabel(dateFrom, dateTo) {
    if (!dateFrom && !dateTo) return 'All recorded data (no period filter)';
    if (dateFrom && dateTo && dateFrom.slice(0, 7) === dateTo.slice(0, 7)
        && dateFrom.endsWith('-01')) {
        const end = new Date(`${dateTo}T00:00:00`);
        const start = new Date(`${dateFrom}T00:00:00`);
        if (end.getDate() === new Date(end.getFullYear(), end.getMonth() + 1, 0).getDate()
            && start.getDate() === 1) {
            return start.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
        }
    }
    if (dateFrom && dateTo && dateFrom.endsWith('-01-01') && dateTo.endsWith('-12-31')
        && dateFrom.slice(0, 4) === dateTo.slice(0, 4)) {
        return `Year ${dateFrom.slice(0, 4)}`;
    }
    if (dateFrom && dateTo) {
        const s = new Date(`${dateFrom}T00:00:00`);
        const e = new Date(`${dateTo}T00:00:00`);
        if (!Number.isNaN(s.getTime()) && !Number.isNaN(e.getTime())) {
            const q = Math.floor(s.getMonth() / 3) + 1;
            const qStart = new Date(s.getFullYear(), (q - 1) * 3, 1);
            const qEnd = new Date(s.getFullYear(), (q - 1) * 3 + 3, 0);
            if (tsPeriodIsoDate(qStart) === dateFrom && tsPeriodIsoDate(qEnd) === dateTo) {
                return `Q${q} ${s.getFullYear()}`;
            }
        }
        return `${dateFrom} to ${dateTo}`;
    }
    return `${dateFrom || '…'} to ${dateTo || '…'}`;
}

function tsInPeriod(dateStr, dateFrom, dateTo) {
    const d = String(dateStr || '').slice(0, 10);
    if (!d) return !dateFrom && !dateTo;
    if (dateFrom && d < dateFrom) return false;
    if (dateTo && d > dateTo) return false;
    return true;
}

function tsLooksLikeCash(text) {
    return /\bcash\b|\bcash purchase\b|\bpetty cash\b|\bimprest\b/i.test(String(text || ''));
}

function collectTechStoresDeliveryParagraphs(dateFrom, dateTo) {
    const txns = (appState.storesInventory?.transactions || []).filter((t) =>
        tsInPeriod(t.date, dateFrom, dateTo)
    );
    const byItem = new Map();

    txns.forEach((t) => {
        const key = t.itemId || t.item || 'item';
        if (!byItem.has(key)) {
            byItem.set(key, {
                item: t.item || key,
                received: 0,
                issued: 0,
                suppliers: new Set(),
                parties: new Set(),
                receipts: [],
                issues: []
            });
        }
        const row = byItem.get(key);
        const qty = Number(t.qty) || 0;
        if (t.type === 'receipt') {
            row.received += qty;
            if (t.party) row.suppliers.add(t.party);
            row.receipts.push(t);
        } else if (t.type === 'issue') {
            row.issued += qty;
            if (t.party) row.parties.add(t.party);
            row.issues.push(t);
        }
    });

    const paragraphs = [];
    byItem.forEach((row) => {
        if (!row.received && !row.issued) return;
        const onHand = typeof getItemStockSummary === 'function' && row.receipts[0]?.itemId
            ? getItemStockSummary(row.receipts[0].itemId).onHand
            : (row.received - row.issued);
        const supplier = [...row.suppliers].join(', ') || 'supplier';
        const recipients = [...row.parties].join(', ') || 'formations and units';
        let text = '';
        if (row.received && row.issued) {
            text = `Received ${row.received} x ${row.item} from ${supplier} and distributed ${row.issued} to ${recipients}`
                + (onHand > 0 ? ` (balance of ${onHand} in stock)` : onHand === 0 ? ' (nil balance in stock)' : ` (balance ${onHand})`)
                + '.';
        } else if (row.received) {
            text = `Received ${row.received} x ${row.item} from ${supplier}`
                + (onHand != null ? ` (balance of ${onHand} in stock)` : '')
                + '.';
        } else {
            text = `Distributed / issued ${row.issued} x ${row.item} to ${recipients}.`;
        }
        paragraphs.push(text);
    });

    return paragraphs;
}

function collectTechStoresDafPayRows(dateFrom, dateTo) {
    const list = typeof ensureDpProcurements === 'function' ? ensureDpProcurements() : [];
    return list
        .filter((r) => {
            const s = typeof normalizeDpProcStatus === 'function' ? normalizeDpProcStatus(r.status) : r.status;
            const payish = ['po_manual_pending_daf', 'po_manual_authorised', 'payment_complete'].includes(s)
                || (r.budgetProvisioned === 'no');
            if (!payish) return false;
            const d = r.sentDate || r.updatedAt || r.createdAt || '';
            return tsInPeriod(d, dateFrom, dateTo) || (!dateFrom && !dateTo);
        })
        .map((r) => {
            const s = typeof normalizeDpProcStatus === 'function' ? normalizeDpProcStatus(r.status) : r.status;
            const label = typeof getDpProcStatusLabel === 'function'
                ? getDpProcStatusLabel(s)
                : (typeof getDpProcStatusMeta === 'function' ? getDpProcStatusMeta(s).label : s);
            return [
                r.refNo || '',
                r.itemSummary || '',
                r.estimatedCost || '',
                r.dafAuthRef || '',
                r.paymentRef || '',
                label
            ];
        });
}

function collectTechStoresUndeliveredRows() {
    const list = typeof ensureUndelivered === 'function' ? ensureUndelivered() : [];
    return list
        .filter((r) => UNDELIVERED_OPEN?.has?.(r.status) || r.status === 'awaiting' || r.status === 'partial')
        .map((r) => {
            const bal = typeof getUndeliveredBalance === 'function' ? getUndeliveredBalance(r) : (Number(r.qty) || 0);
            return [
                r.poNo || '',
                r.supplier || '',
                r.item || '',
                String(r.qty ?? ''),
                String(r.qtyDelivered ?? 0),
                String(bal),
                r.category || '',
                r.remarks || ''
            ];
        });
}

function collectTechStoresPendingDpRows(dateFrom, dateTo) {
    const pendingStatuses = new Set([
        'requisition', 'spec_raise_f1', 'f1_with_dp', 'quotes_itdir_eval',
        'spec_returned_dp', 'aiad_due_diligence', 'aiad_certificate'
    ]);
    const list = typeof ensureDpProcurements === 'function' ? ensureDpProcurements() : [];
    return list
        .filter((r) => {
            const s = typeof normalizeDpProcStatus === 'function' ? normalizeDpProcStatus(r.status) : r.status;
            if (!pendingStatuses.has(s)) return false;
            const d = r.sentDate || r.updatedAt || r.createdAt || '';
            return tsInPeriod(d, dateFrom, dateTo) || (!dateFrom && !dateTo);
        })
        .map((r) => {
            const s = typeof normalizeDpProcStatus === 'function' ? normalizeDpProcStatus(r.status) : r.status;
            const label = typeof getDpProcStatusMeta === 'function' ? getDpProcStatusMeta(s).label : s;
            return [
                r.refNo || 'DP F1',
                r.itemSummary || '',
                r.estimatedCost || '',
                r.glDisplay || r.glValue || '',
                label,
                r.sentDate || ''
            ];
        });
}

function collectTechStoresCashPurchaseRows(dateFrom, dateTo) {
    const rows = [];
    const txns = (appState.storesInventory?.transactions || []).filter((t) =>
        t.type === 'receipt' && tsInPeriod(t.date, dateFrom, dateTo)
        && (tsLooksLikeCash(t.party) || tsLooksLikeCash(t.description) || tsLooksLikeCash(t.note))
    );
    txns.forEach((t) => {
        rows.push([
            t.date || '',
            t.item || '',
            String(t.qty ?? ''),
            t.party || 'Cash purchase',
            t.description || t.note || '',
            t.voucherNo || t.deliveryNoteRef || ''
        ]);
    });

    // Issue voucher module lines tagged cash
    const voucherMod = appState.modules?.['voucher-module'];
    const voucherRows = voucherMod?.tables?.['voucher-table-body'] || [];
    voucherRows.forEach((rowData) => {
        const cells = rowData.cells || [];
        const date = cells[0]?.value || '';
        if (!tsInPeriod(date, dateFrom, dateTo)) return;
        const item = cells[2]?.value || cells[1]?.value || '';
        const desc = cells[3]?.value || '';
        const qty = cells[4]?.value || '';
        const suppliedBy = cells[11]?.value || cells[10]?.value || '';
        const issuedTo = cells[12]?.value || cells[11]?.value || '';
        const blob = `${desc} ${suppliedBy} ${issuedTo}`;
        if (!tsLooksLikeCash(blob) && !tsLooksLikeCash(suppliedBy)) return;
        rows.push([date, item, String(qty), suppliedBy || 'Cash', desc, cells[9]?.value || '']);
    });

    return rows;
}

function collectTechStoresStockOnHandRows() {
    const categories = (typeof VOUCHER_INVENTORY_CATEGORIES !== 'undefined' && VOUCHER_INVENTORY_CATEGORIES)
        ? VOUCHER_INVENTORY_CATEGORIES
        : [];
    const rows = [];
    categories.forEach((cat) => {
        const items = typeof getCatalogItemsForCategory === 'function'
            ? getCatalogItemsForCategory(cat.key)
            : [];
        items.forEach((item) => {
            const sum = typeof getItemStockSummary === 'function' ? getItemStockSummary(item.id) : null;
            if (!sum || !(sum.onHand > 0)) return;
            rows.push([
                cat.label || cat.key,
                sum.item || item.name,
                String(sum.onHand),
                sum.uom || 'EA',
                cat.gl || sum.gl || ''
            ]);
        });
    });
    return rows.sort((a, b) => a[0].localeCompare(b[0]) || a[1].localeCompare(b[1]));
}

function collectTechStoresSoftwareRenewalRows() {
    if (typeof getIctAccountabilitySnapshot !== 'function') return [];
    return getIctAccountabilitySnapshot()
        .filter((r) => r.assetClass === 'software' && r.expiryDate)
        .map((r) => {
            const days = typeof ictAccDaysUntil === 'function' ? ictAccDaysUntil(r.expiryDate) : null;
            const daysLabel = typeof formatIctAccLicenceDaysLeft === 'function'
                ? formatIctAccLicenceDaysLeft(days)
                : (days != null ? `${days}d` : '');
            return [
                r.designation || '',
                r.zaNumber || '',
                r.expiryDate || '',
                daysLabel,
                r.holderName || r.unit || '',
                r.renewalNotes || r.remarks || ''
            ];
        })
        .sort((a, b) => String(a[2]).localeCompare(String(b[2])));
}

function collectTechStoresAccommodationNote() {
    if (typeof getAccommodationStoresSnapshot !== 'function') return '';
    try {
        const snap = getAccommodationStoresSnapshot();
        if (!snap) return '';
        if (typeof snap === 'string') return snap.slice(0, 400);
        if (snap.summary) return String(snap.summary);
        if (Array.isArray(snap.items)) return `${snap.items.length} accommodation store line(s) on record.`;
    } catch (_) { /* optional */ }
    return '';
}

/**
 * Build consolidated TechStores department report for a period.
 */
function buildTechStoresPeriodReportData(dateFrom, dateTo) {
    if (typeof ensureStoresInventory === 'function') ensureStoresInventory();

    const periodLabel = getTechStoresPeriodLabel(dateFrom, dateTo);
    const deliveries = collectTechStoresDeliveryParagraphs(dateFrom, dateTo);
    const dafRows = collectTechStoresDafPayRows(dateFrom, dateTo);
    const undeliveredRows = collectTechStoresUndeliveredRows();
    const pendingDpRows = collectTechStoresPendingDpRows(dateFrom, dateTo);
    const cashRows = collectTechStoresCashPurchaseRows(dateFrom, dateTo);
    const stockRows = collectTechStoresStockOnHandRows();
    const softwareRows = collectTechStoresSoftwareRenewalRows();
    const acct = typeof getInventoryAccountabilitySummary === 'function'
        ? getInventoryAccountabilitySummary(dateFrom, dateTo)
        : null;
    const accommodationNote = collectTechStoresAccommodationNote();

    const summary = [
        `Period: ${periodLabel}`,
        `ICT / stores movements summarised: ${deliveries.length} item group(s)`,
        `Received (period): ${acct?.received ?? '—'} · Issued (period): ${acct?.issued ?? '—'} · On hand (now): ${acct?.onHandTotal ?? '—'}`,
        `Purchase orders awaiting delivery: ${undeliveredRows.length}`,
        `Pending at DP / early cycle: ${pendingDpRows.length}`,
        `DAF / payment-path items: ${dafRows.length}`,
        `Cash-tagged purchases in period: ${cashRows.length}`,
        `Catalog lines with stock on hand: ${stockRows.length}`,
        `Software licences on register: ${softwareRows.length}`
    ];

    const tables = [
        {
            tbodyId: 'ts-deliveries',
            title: '1. ICT Equipment Deliveries (period movements)',
            headers: ['Narrative'],
            rows: deliveries.length
                ? deliveries.map((p) => [p])
                : [['No receive/issue movements recorded for this period. Post deliveries and issues via Stores Inventory / Issue Voucher.']]
        },
        {
            tbodyId: 'ts-daf-pay',
            title: '2. Pay System / Proforma & DAF Authorisation',
            headers: ['Ref', 'Items / Requirement', 'Est. Cost', 'DAF Auth Ref', 'Payment Ref', 'Status'],
            rows: dafRows.length ? dafRows : [['—', 'No Manual/DAF or payment-path cycles in filter', '', '', '', '']]
        },
        {
            tbodyId: 'ts-undelivered',
            title: '3. Purchase Orders (Awaiting Delivery)',
            headers: ['PO No.', 'Supplier', 'Item', 'Ordered', 'Delivered', 'Balance', 'Category', 'Remarks'],
            rows: undeliveredRows.length ? undeliveredRows : [['—', '—', 'No open undelivered POs', '', '', '', '', '']]
        },
        {
            tbodyId: 'ts-pending-dp',
            title: '4. Pending Requisitions / Still at DP (DP F1 cycle)',
            headers: ['Ref', 'Items', 'Est. Cost', 'GL', 'Status', 'Date'],
            rows: pendingDpRows.length ? pendingDpRows : [['—', 'No open DP F1 / early-cycle items', '', '', '', '']]
        },
        {
            tbodyId: 'ts-cash',
            title: '5. Items Purchased on Cash',
            headers: ['Date', 'Item', 'Qty', 'Supplier / Party', 'Description', 'Voucher / DN'],
            rows: cashRows.length
                ? cashRows
                : [['—', 'None tagged as cash in this period. Record cash buys via Receive and put “Cash” in party/remarks.', '', '', '', '']]
        },
        {
            tbodyId: 'ts-stock',
            title: '6. ICT Equipment and Consumables in Stocks (on hand now)',
            headers: ['Ledger', 'Item', 'On Hand', 'UoM', 'GL'],
            rows: stockRows.length ? stockRows : [['—', 'No positive on-hand balances', '', '', '']]
        },
        {
            tbodyId: 'ts-software',
            title: '7. Software Licences (days left)',
            headers: ['Licence / Product', 'ZA / Ref', 'Expiry', 'Days left', 'Holder / Unit', 'Notes'],
            rows: softwareRows.length ? softwareRows : [['—', '', '', '', '', 'No software licences on Asset Register']]
        }
    ];

    if (accommodationNote) {
        tables.push({
            tbodyId: 'ts-clothing',
            title: '8. Clothing / Accommodation Stores',
            headers: ['Note'],
            rows: [[accommodationNote]]
        });
    }

    tables.push({
        tbodyId: 'ts-system',
        title: '9. TechStores Information System',
        headers: ['Note'],
        rows: [[
            'The TechStores Department has developed and demonstrated the IT Dir TechStores Information System — '
            + 'a web-based application under continuous improvement, scrutiny and development. '
            + 'This consolidated report is generated from live Stores Inventory, Undelivered POs, DP procurement cycle, '
            + 'vouchers, and the ZNA ICT Asset Register.'
        ]]
    });

    const html = buildTechStoresPeriodReportHtml({
        periodLabel,
        dateFrom,
        dateTo,
        summary,
        deliveries,
        dafRows,
        undeliveredRows,
        pendingDpRows,
        cashRows,
        stockRows,
        softwareRows,
        accommodationNote,
        acct
    });

    return {
        title: 'INFORMATION TECHNOLOGY DIRECTORATE — TECHSTORES REPORT',
        layout: 'techstores-period',
        html,
        summary,
        fields: [
            { label: 'Directorate', value: 'Information Technology Directorate' },
            { label: 'Department', value: 'TechStores' },
            { label: 'Cost Centre', value: 'Z04P2SP212' },
            { label: 'Period', value: periodLabel },
            { label: 'Classification', value: 'RESTRICTED' }
        ],
        tables
    };
}

function buildTechStoresPeriodReportHtml(data) {
    const generatedAt = new Date().toLocaleString('en-GB');
    const esc = (v) => String(v ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    const listBlock = (items, emptyMsg) => {
        if (!items.length) return `<p class="ts-report-empty">${esc(emptyMsg)}</p>`;
        return `<ol class="ts-report-olist">${items.map((t) => `<li>${esc(t)}</li>`).join('')}</ol>`;
    };

    const tableBlock = (headers, rows) => {
        if (!rows.length) return '<p class="ts-report-empty">Nil.</p>';
        return `<div class="ts-report-table-wrap"><table class="ts-report-table"><thead><tr>${
            headers.map((h) => `<th>${esc(h)}</th>`).join('')
        }</tr></thead><tbody>${
            rows.map((row) => `<tr>${headers.map((_, i) => `<td>${esc(row[i] ?? '')}</td>`).join('')}</tr>`).join('')
        }</tbody></table></div>`;
    };

    const letterList = (rows, mapFn) => {
        if (!rows.length) return '<p class="ts-report-empty">Nil.</p>';
        return `<ol class="ts-report-alpha">${rows.map((r, i) => `<li>${esc(mapFn(r, i))}</li>`).join('')}</ol>`;
    };

    return `
    <div class="ts-period-report">
        <div class="ts-report-class">RESTRICTED</div>
        <header class="ts-report-header">
            <h2>INFORMATION TECHNOLOGY DIRECTORATE</h2>
            <h3>TECHSTORES REPORT</h3>
            <p class="ts-report-sub">Cost Centre Z04P2SP212 · Period: <strong>${esc(data.periodLabel)}</strong></p>
            <p class="ts-report-sub">Generated: ${esc(generatedAt)}</p>
        </header>

        <section class="ts-report-section">
            <h4>ICT EQUIPMENT DELIVERIES</h4>
            <p class="ts-report-lead">1. Deliveries and distributions recorded for the period:</p>
            ${listBlock(data.deliveries, 'No ICT equipment receive/issue movements recorded for this period.')}
        </section>

        <section class="ts-report-section">
            <h4>PAY SYSTEM REQUIREMENTS</h4>
            <p class="ts-report-lead">2. Proforma / Manual PO path and DAF authorisation / payment status:</p>
            ${tableBlock(
                ['Ref', 'Items / Requirement', 'Est. Cost', 'DAF Auth', 'Payment Ref', 'Status'],
                data.dafRows
            )}
        </section>

        <section class="ts-report-section">
            <h4>PURCHASE ORDERS (AWAITING DELIVERY)</h4>
            <p class="ts-report-lead">3. Open purchase orders still awaiting delivery:</p>
            ${letterList(data.undeliveredRows, (r) =>
                `${r[2] || 'Item'} — PO ${r[0] || '—'} with ${r[1] || 'supplier'}`
                + (r[5] ? ` (balance ${r[5]})` : '')
                + (r[7] ? ` — ${r[7]}` : '')
            )}
            ${tableBlock(
                ['PO No.', 'Supplier', 'Item', 'Ordered', 'Delivered', 'Balance', 'Category', 'Remarks'],
                data.undeliveredRows
            )}
        </section>

        <section class="ts-report-section">
            <h4>PENDING REQUISITIONS (STILL AT DP)</h4>
            <p class="ts-report-lead">4. Requirements still in the DP F1 / early procurement cycle:</p>
            ${letterList(data.pendingDpRows, (r) =>
                `${r[0] || 'DP F1'}: ${r[1] || 'Items'} — ${r[4] || ''}`
            )}
            ${tableBlock(
                ['Ref', 'Items', 'Est. Cost', 'GL', 'Status', 'Date'],
                data.pendingDpRows
            )}
        </section>

        <section class="ts-report-section">
            <h4>ITEMS PURCHASED ON CASH</h4>
            <p class="ts-report-lead">5. Cash / imprest purchases tagged in the period:</p>
            ${letterList(data.cashRows, (r) =>
                `${r[2] || '?'} x ${r[1] || 'item'} (${r[3] || 'Cash'})${r[4] ? ` — ${r[4]}` : ''}`
            )}
        </section>

        <section class="ts-report-section">
            <h4>ICT EQUIPMENT AND CONSUMABLES IN STOCKS</h4>
            <p class="ts-report-lead">6. Current on-hand balances (as at report generation):</p>
            ${letterList(data.stockRows, (r) => `${r[2]} x ${r[1]} (${r[0]})`)}
            ${data.stockRows.length > 12 ? tableBlock(
                ['Ledger', 'Item', 'On Hand', 'UoM', 'GL'],
                data.stockRows
            ) : ''}
        </section>

        <section class="ts-report-section">
            <h4>SOFTWARE LICENCES</h4>
            <p class="ts-report-lead">7. Software licences on the ZNA ICT Asset Register (days left always shown):</p>
            ${tableBlock(
                ['Licence / Product', 'ZA / Ref', 'Expiry', 'Days left', 'Holder / Unit', 'Notes'],
                data.softwareRows
            )}
        </section>

        ${data.accommodationNote ? `
        <section class="ts-report-section">
            <h4>CLOTHING / ACCOMMODATION STORES</h4>
            <p class="ts-report-lead">8. ${esc(data.accommodationNote)}</p>
        </section>` : ''}

        <section class="ts-report-section">
            <h4>TECHSTORE INFORMATION SYSTEM</h4>
            <p class="ts-report-lead">${data.accommodationNote ? '9' : '8'}. The TechStores Department has managed to develop and demonstrate the IT Dir TechStores Information System. The system is a Web Based Application Software and is still going through continuous improvements, scrutiny and development. This consolidated report is produced from live system data for the selected period.</p>
        </section>

        <div class="ts-report-summary-strip">
            ${(data.summary || []).map((s) => `<div>${esc(s)}</div>`).join('')}
        </div>

        <div class="ts-report-class ts-report-class-footer">RESTRICTED</div>
    </div>`;
}

function initTechStoresPeriodReportControls() {
    document.querySelectorAll('[data-report-period]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const preset = btn.getAttribute('data-report-period') || 'custom';
            applyTechStoresReportPeriod(preset);
            if (preset !== 'custom') {
                const select = document.getElementById('reportModuleSelect');
                if (select) select.value = 'techstores-period';
            }
        });
    });

    const syncCustom = () => {
        document.querySelectorAll('[data-report-period]').forEach((btn) => {
            btn.classList.toggle('active', btn.getAttribute('data-report-period') === 'custom');
        });
        const labelEl = document.getElementById('reportPeriodLabel');
        const from = document.getElementById('reportDateFrom')?.value || '';
        const to = document.getElementById('reportDateTo')?.value || '';
        if (labelEl) labelEl.textContent = getTechStoresPeriodLabel(from, to);
    };
    document.getElementById('reportDateFrom')?.addEventListener('change', syncCustom);
    document.getElementById('reportDateTo')?.addEventListener('change', syncCustom);

    // Default to current month for TechStores reporting
    if (!document.getElementById('reportDateFrom')?.value
        && !document.getElementById('reportDateTo')?.value) {
        applyTechStoresReportPeriod('month');
    }
}
