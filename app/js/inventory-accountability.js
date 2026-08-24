/* inventory-accountability.js — Procure → Receive/Stock → Issue/Distribute trail */

function slugifyStockKey(value) {
    return String(value || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 48) || 'item';
}

/**
 * Match a designation to the ITDIR catalog, or build an ad-hoc stock item id.
 */
function resolveCatalogOrAdhocItem(designation, preferredCategory) {
    const name = String(designation || '').trim();
    const matches = typeof findCatalogItemsByName === 'function' ? findCatalogItemsByName(name) : [];
    if (matches.length) {
        const exact = matches.find((m) => String(m.name || '').toLowerCase() === name.toLowerCase());
        const hit = exact || matches[0];
        const ledgerKey = preferredCategory
            || (typeof suggestInventoryLedgerKey === 'function' ? suggestInventoryLedgerKey(name) : null)
            || hit.category;
        const led = typeof getInventoryLedgerByKey === 'function' ? getInventoryLedgerByKey(ledgerKey) : null;
        return {
            id: hit.id,
            name: hit.name,
            category: ledgerKey,
            gl: led?.defaultGl || hit.gl || '',
            catalog: true
        };
    }

    const category = preferredCategory
        || (typeof suggestVoucherInventoryCategory === 'function' ? suggestVoucherInventoryCategory(name) : null)
        || 'inv-toner';
    const meta = typeof getVoucherInventoryCategoryMeta === 'function'
        ? getVoucherInventoryCategoryMeta(category)
        : { key: category, gl: '' };
    const led = typeof getInventoryLedgerByKey === 'function' ? getInventoryLedgerByKey(category) : null;

    return {
        id: `adhoc__${category}__${slugifyStockKey(name)}`,
        name,
        category,
        gl: led?.defaultGl || meta.gl || '',
        catalog: false
    };
}

function parseQtyLoose(value) {
    const n = parseFloat(String(value ?? '').replace(/,/g, '').trim());
    return Number.isFinite(n) && n > 0 ? n : 0;
}

function getProcurementStockLines(rec) {
    const items = Array.isArray(rec?.snapshot?.items) ? rec.snapshot.items : [];
    return items.map((line) => {
        const designation = String(line.designation || '').trim();
        if (!designation) return null;
        const qty = parseQtyLoose(line.qty) || 1;
        const resolved = resolveCatalogOrAdhocItem(designation);
        return {
            designation,
            qty,
            itemId: resolved.id,
            itemName: resolved.name,
            category: resolved.category,
            gl: resolved.gl || rec.glValue || '',
            catalog: resolved.catalog
        };
    }).filter(Boolean);
}

/**
 * Post verified procurement delivery into Stores Inventory (receipts).
 * Inventory is informed by what ITDIR procures and receives.
 */
function postProcurementDeliveryToStock(rec, options = {}) {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return null;
    if (!rec) {
        showToast('No procurement record selected.', 'error');
        return null;
    }
    if (typeof postStockTransaction !== 'function') {
        showToast('Stores inventory posting is not available.', 'error');
        return null;
    }

    const status = typeof normalizeDpProcStatus === 'function'
        ? normalizeDpProcStatus(rec.status)
        : rec.status;
    const eligible = ['supply_delivery', 'delivery_verified', 'payment_complete'].includes(status);
    if (!eligible && !options.force) {
        showToast('Advance to Supply / Delivery Verified before posting into stock.', 'error');
        return null;
    }

    if (rec.stockPostedAt && !options.force) {
        const again = confirm(
            `${rec.refNo} was already posted to Stores Inventory on ${(rec.stockPostedAt || '').slice(0, 10)}.\n\nPost again?`
        );
        if (!again) return null;
    }

    const lines = getProcurementStockLines(rec);
    if (!lines.length) {
        showToast('No line items on the captured F1 to receive into stock.', 'error');
        return null;
    }

    if (typeof procurementRequiresWorkshopCert === 'function' && procurementRequiresWorkshopCert(rec)) {
        const wrcErr = typeof validateWorkshopCertForIctReceipt === 'function'
            ? validateWorkshopCertForIctReceipt({
                type: 'receipt',
                category: 'ict-equipment',
                item: rec.itemSummary || '',
                poNumber: rec.poNumber || '',
                deliveryNoteRef: rec.deliveryNoteRef || '',
                party: rec.awardedSupplier || '',
                wrcId: rec.workshopCertId || ''
            })
            : '';
        if (wrcErr) {
            showToast(wrcErr, 'error');
            return null;
        }
    }

    const summary = lines.map((l) => `• ${l.qty} × ${l.itemName}`).join('\n');
    if (!options.silentConfirm) {
        const ok = confirm(
            `Post verified delivery into Stores Inventory?\n\n` +
            `${rec.refNo} — DN: ${rec.deliveryNoteRef || '—'}\nPO: ${rec.poNumber || '—'}\n\n${summary}\n\n` +
            `This records RECEIPTS so stock on hand reflects what was procured and received.`
        );
        if (!ok) return null;
    }

    const txnIds = [];
    let posted = 0;
    lines.forEach((line) => {
        const txn = postStockTransaction({
            type: 'receipt',
            itemId: line.itemId,
            item: line.itemName,
            category: line.category,
            gl: line.gl,
            qty: line.qty,
            uom: 'EA',
            voucherNo: rec.deliveryNoteRef || rec.poNumber || '',
            party: rec.awardedSupplier || 'Supplier',
            description: `Procured via ${rec.refNo}${rec.poNumber ? ` / PO ${rec.poNumber}` : ''}`,
            source: 'procurement',
            sourceRef: rec.id,
            dpRef: rec.refNo || '',
            poNumber: rec.poNumber || '',
            deliveryNoteRef: rec.deliveryNoteRef || '',
            date: (rec.sentDate || '').slice(0, 10) || undefined,
            allowAdhoc: true,
            silent: true
        });
        if (txn) {
            txnIds.push(txn.id);
            posted += 1;
        }
    });

    if (!posted) {
        showToast('No stock receipts were posted.', 'error');
        return null;
    }

    rec.stockPostedAt = new Date().toISOString();
    rec.stockTxnIds = [...(rec.stockTxnIds || []), ...txnIds];
    rec.stockPostedQty = lines.reduce((s, l) => s + l.qty, 0);
    if (typeof saveState === 'function') saveState();

    showToast(`${rec.refNo}: ${posted} receipt line(s) posted to Stores Inventory.`);
    if (typeof updateDpProcurementStockStatus === 'function') updateDpProcurementStockStatus(rec);
    if (typeof renderDpProcurementModule === 'function') renderDpProcurementModule();
    if (typeof updateSystemAlerts === 'function') updateSystemAlerts();
    return { posted, txnIds };
}

/**
 * When a unit requisition is issued/distributed, post ISSUE from Stores Inventory.
 */
function postRequisitionIssueToStock(req, options = {}) {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return null;
    if (!req || typeof postStockTransaction !== 'function') return null;
    if (req.stockIssuedAt && !options.force) return null;

    const itemName = String(req.itemDescription || '').trim();
    const qty = Number(req.qty) || 0;
    if (!itemName || qty <= 0) return null;

    const resolved = resolveCatalogOrAdhocItem(itemName, req.category);
    if (!options.silentConfirm) {
        const ok = confirm(
            `Issue from Stores Inventory for ${req.reqNo || 'requisition'}?\n\n` +
            `${qty} × ${resolved.name}\nTo: ${req.unit || req.requestedBy || 'unit'}\n\n` +
            `This records an ISSUE so stock reflects what was disbursed / distributed.`
        );
        if (!ok) return null;
    }

    const txn = postStockTransaction({
        type: 'issue',
        itemId: resolved.id,
        item: resolved.name,
        category: resolved.category,
        gl: resolved.gl,
        qty,
        uom: 'EA',
        voucherNo: req.reqNo || '',
        party: [req.unit, req.requestedBy].filter(Boolean).join(' / '),
        description: `Issued against unit requisition ${req.reqNo || ''}`.trim(),
        source: 'requisition',
        sourceRef: req.id,
        allowAdhoc: true,
        silent: true
    });

    if (!txn) {
        showToast('Could not post issue — check on-hand stock first (Receive procured stock if needed).', 'error');
        return null;
    }

    req.stockIssuedAt = new Date().toISOString();
    req.stockTxnId = txn.id;
    if (typeof saveState === 'function') saveState();
    showToast(`${req.reqNo || 'Requisition'}: issued ${qty} × ${resolved.name} from Stores Inventory.`);
    return txn;
}

function getInventoryAccountabilitySummary(dateFrom, dateTo) {
    if (typeof ensureStoresInventory === 'function') ensureStoresInventory();
    const txns = (appState.storesInventory?.transactions || []).filter((t) => {
        const d = t.date || '';
        if (dateFrom && d < dateFrom) return false;
        if (dateTo && d > dateTo) return false;
        return true;
    });

    let received = 0;
    let issued = 0;
    let fromProcurement = 0;
    let fromRequisition = 0;
    let manual = 0;

    txns.forEach((t) => {
        const qty = Number(t.qty) || 0;
        if (t.type === 'receipt') {
            received += qty;
            if (t.source === 'procurement') fromProcurement += qty;
            else manual += qty;
        } else if (t.type === 'issue') {
            issued += qty;
            if (t.source === 'requisition') fromRequisition += qty;
            else manual += qty;
        }
    });

    const procurements = (typeof ensureDpProcurements === 'function' ? ensureDpProcurements() : (appState.dpProcurements || []));
    const delivered = procurements.filter((r) => {
        const s = typeof normalizeDpProcStatus === 'function' ? normalizeDpProcStatus(r.status) : r.status;
        return ['supply_delivery', 'delivery_verified', 'payment_complete'].includes(s);
    });
    const awaitingStock = delivered.filter((r) => !r.stockPostedAt);
    const postedStock = delivered.filter((r) => r.stockPostedAt);

    const onHandTotal = (typeof VOUCHER_INVENTORY_CATEGORIES !== 'undefined' ? VOUCHER_INVENTORY_CATEGORIES : [])
        .reduce((sum, cat) => {
            const s = typeof getCategoryStockSummary === 'function' ? getCategoryStockSummary(cat.key) : null;
            return sum + (s?.onHand || 0);
        }, 0);

    return {
        received,
        issued,
        fromProcurement,
        fromRequisition,
        manual,
        onHandTotal,
        deliveredCount: delivered.length,
        awaitingStockCount: awaitingStock.length,
        postedStockCount: postedStock.length,
        awaitingStock,
        postedStock,
        movements: txns
    };
}

function updateDpProcurementStockStatus(rec) {
    const el = document.getElementById('dpProcStockStatus');
    const wrcEl = document.getElementById('dpProcWrcStatus');
    if (!el) return;
    if (!rec) {
        el.textContent = 'Not posted to Stores Inventory.';
        el.className = 'dp-proc-stock-status';
        if (wrcEl) wrcEl.textContent = '';
        return;
    }
    if (rec.stockPostedAt) {
        el.textContent = `Posted to Stores Inventory on ${(rec.stockPostedAt || '').replace('T', ' ').slice(0, 19)} (${rec.stockPostedQty || '?'} units).`;
        el.className = 'dp-proc-stock-status is-posted';
    } else {
        el.textContent = 'Not yet posted to Stores Inventory — post after delivery is verified and MLG engraving complete (ICT).';
        el.className = 'dp-proc-stock-status is-pending';
    }
    if (wrcEl && typeof procurementRequiresWorkshopCert === 'function' && procurementRequiresWorkshopCert(rec)) {
        const cert = typeof findWorkshopReceiptCert === 'function'
            ? findWorkshopReceiptCert({ id: rec.workshopCertId, poNo: rec.poNumber, dnRef: rec.deliveryNoteRef, supplier: rec.awardedSupplier })
            : null;
        if (!cert) {
            wrcEl.textContent = 'Workshop certification: required — not started.';
            wrcEl.className = 'dp-proc-wrc-status is-pending';
        } else {
            const label = typeof getWrcStatusLabel === 'function' ? getWrcStatusLabel(cert.status) : cert.status;
            wrcEl.textContent = `Workshop certification: ${cert.inspectionSerial} — ${label}`;
            wrcEl.className = `dp-proc-wrc-status wrc-status-${cert.status}`;
        }
    } else if (wrcEl) {
        wrcEl.textContent = '';
        wrcEl.className = 'dp-proc-wrc-status';
    }
}

function buildInventoryAccountabilityReportData(dateFrom, dateTo) {
    const acct = getInventoryAccountabilitySummary(dateFrom, dateTo);
    const categories = (typeof VOUCHER_INVENTORY_CATEGORIES !== 'undefined' && VOUCHER_INVENTORY_CATEGORIES)
        ? VOUCHER_INVENTORY_CATEGORIES
        : [];

    const balanceRows = [];
    categories.forEach((cat) => {
        const items = typeof getCatalogItemsForCategory === 'function' ? getCatalogItemsForCategory(cat.key) : [];
        const seen = new Set(items.map((i) => i.id));
        // Include ad-hoc items from transactions in this category
        (appState.storesInventory?.transactions || []).forEach((t) => {
            if (t.category === cat.key && t.itemId) seen.add(t.itemId);
        });
        Object.keys(appState.storesInventory?.openings || {}).forEach((id) => {
            if (String(id).startsWith(`${cat.key}__`) || String(id).startsWith(`adhoc__${cat.key}__`)) seen.add(id);
        });

        [...seen].forEach((itemId) => {
            const row = typeof getItemStockSummary === 'function' ? getItemStockSummary(itemId) : null;
            if (!row || !(row.opening || row.received || row.issued || row.onHand)) return;
            const procRecv = (row.transactions || [])
                .filter((t) => t.type === 'receipt' && t.source === 'procurement')
                .reduce((s, t) => s + (Number(t.qty) || 0), 0);
            const reqIssue = (row.transactions || [])
                .filter((t) => t.type === 'issue' && t.source === 'requisition')
                .reduce((s, t) => s + (Number(t.qty) || 0), 0);
            balanceRows.push([
                cat.label || cat.key,
                row.item || itemId,
                String(row.opening),
                String(procRecv),
                String(row.received),
                String(reqIssue),
                String(row.issued),
                String(row.onHand)
            ]);
        });
    });

    const awaitingRows = acct.awaitingStock.map((r) => [
        r.refNo || '',
        r.sentDate || '',
        r.itemSummary || '',
        r.poNumber || '',
        r.deliveryNoteRef || '',
        r.awardedSupplier || '',
        'Awaiting stock post'
    ]);

    const postedRows = acct.postedStock.map((r) => [
        r.refNo || '',
        (r.stockPostedAt || '').slice(0, 10),
        r.itemSummary || '',
        r.poNumber || '',
        r.deliveryNoteRef || '',
        String(r.stockPostedQty ?? ''),
        'In stock'
    ]);

    const movementRows = acct.movements.map((t) => [
        t.date || '',
        t.type === 'receipt' ? 'Receive (stock in)' : 'Issue (disburse)',
        t.source || 'manual',
        t.dpRef || t.sourceRef || '',
        t.poNumber || '',
        t.deliveryNoteRef || t.voucherNo || '',
        t.item || '',
        String(t.qty ?? ''),
        t.party || '',
        t.by || ''
    ]);

    return {
        title: 'Inventory Accountability Report',
        summary: [
            'Equation: Opening + Received (procure/stock) − Issued (disburse/distribute) = On Hand',
            `Received in period: ${acct.received} (of which from procurement: ${acct.fromProcurement})`,
            `Issued in period: ${acct.issued} (of which to unit requisitions: ${acct.fromRequisition})`,
            `Catalog/ad-hoc on-hand total (all categories): ${acct.onHandTotal}`,
            `Deliveries in cycle: ${acct.deliveredCount} | Posted to stock: ${acct.postedStockCount} | Awaiting stock post: ${acct.awaitingStockCount}`,
            `Movements in period: ${movementRows.length}`
        ],
        fields: [
            { label: 'Cost Centre', value: 'Z04P2SP212' },
            { label: 'Directorate', value: 'Information Technology Directorate' },
            { label: 'Report purpose', value: 'Account for ICT items procured, received into stock, and issued/distributed' },
            { label: 'Period from', value: dateFrom || '—' },
            { label: 'Period to', value: dateTo || '—' }
        ],
        tables: [
            {
                tbodyId: 'acct-item-balances',
                title: 'Item accountability (Opening + Procured receipts + All receipts − Req issues − All issues = On Hand)',
                headers: ['Category', 'Item', 'Opening', 'From Procurement', 'All Received', 'To Requisitions', 'All Issued', 'On Hand'],
                rows: balanceRows
            },
            {
                tbodyId: 'acct-awaiting-stock',
                title: 'Procured & delivered — not yet in Stores Inventory',
                headers: ['Cycle Ref', 'Date', 'Items', 'PO', 'Delivery Note', 'Supplier', 'Status'],
                rows: awaitingRows.length ? awaitingRows : [['—', '—', 'None awaiting', '—', '—', '—', '—']]
            },
            {
                tbodyId: 'acct-posted-stock',
                title: 'Procured deliveries posted into stock',
                headers: ['Cycle Ref', 'Posted', 'Items', 'PO', 'Delivery Note', 'Qty posted', 'Status'],
                rows: postedRows.length ? postedRows : [['—', '—', 'None posted yet', '—', '—', '—', '—']]
            },
            {
                tbodyId: 'acct-movements',
                title: 'Stock movements (procure / receive / issue trail)',
                headers: ['Date', 'Movement', 'Source', 'Cycle/Req Ref', 'PO', 'DN / Voucher', 'Item', 'Qty', 'Party', 'By'],
                rows: movementRows
            }
        ]
    };
}
