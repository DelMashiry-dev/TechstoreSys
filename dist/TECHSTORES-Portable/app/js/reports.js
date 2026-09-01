/* reports.js — module report generation */

let lastGeneratedReport = null;

const REPORT_TABLE_HEADERS = {
    'gl-2200600002-table-body': ['Date', 'Voucher No.', 'Received From / Issued To', 'Cat or Part No', 'Designation', 'Entitlement', 'Initial of Officer'],
    'gl-2200600003-table-body': ['Date', 'Consignor / Consignee', 'Receipts', 'Issues', 'Stock', 'Voucher / QM Signature', 'Number and Name'],
    'gl-220200002-table-body': ['Serial', 'Item', 'Description', 'Qty', 'Unit', 'Price/Unit', 'Amount'],
    'gl-2201900002-table-body': ['Date', 'Consignor / Consignee', 'Receipts', 'Issues', 'Stock', 'Voucher / QM Signature', 'Number and Name'],
    'gl-3112210001-table-body': ['Date', 'Consignor / Consignee', 'Receipts', 'Issues', 'Stock', 'Voucher / QM Signature', 'Number and Name'],
    'voucher-table-body': ['Date', 'Item Category', 'Item', 'Description', 'Qty', 'UoM', 'GL Account', 'Unit Cost', 'Line Total', 'RV/IV No.', 'Purchase No.', 'Supplied By', 'Issued To', 'Appointment', 'Initials'],
    'bids-table-body': ['Serial', 'Item', 'Cost Centre', 'GL A/C', 'Description', 'Qty', 'Unit Cost', 'Total Cost'],
    'unit-equipment-table-body': ['Ser', 'Item Name', 'ZA Number', 'Description', 'Holding Unit', 'Location'],
    'loans-table-body': ['Date Loaned', 'ZA Number', 'Item', 'Description', 'Qty', 'UoM', 'Issued To', 'Force No.', 'Unit / Formation / Dir', 'Expected Return', 'Date Returned', 'Issued By', 'Issuer Initials'],
    'spec-eval-table-body': ['Ser', 'Specification Field', 'Required Spec / Value', 'Price Justification / Notes'],
    'dp-f1-table-body': ['Ser', 'Designation', 'Qty', 'Holding Stock', 'Potential Supplier'],
    'zna-q-982-table-body': ['Line', 'Stock', 'Location', 'Vocab/Part', 'Section', 'Designation', 'UOI', 'Required', 'Issued', 'To Follow', 'Pkg', 'Weight', '$', 'c'],
    'delivery-table-body': ['Date', 'Item', 'Description', 'Qty', 'UoM', 'Product Serial', 'Purchase No.', 'Supplied By', 'Received By', 'Initials', 'Workshop cert'],
    'purchase-orders-table-body': ['Date', 'Supplier', 'PO Number', 'Total', 'GL Account', 'Vendor No.', 'Signature'],
    'purchase-orders-lines-body': ['Item (Ser)', 'Material Number', 'Order Qty', 'Unit', 'Description', 'Price Per Unit', 'Net Value'],
    'workshop-repairs-table-body': ['Serial', 'Equipment Type', 'S/N or ZA No.', 'Unit', 'Diagnosis', 'Remarks', 'Date In', 'Received By', 'Date Out', 'SVCS 1045 Ref'],
    'gate-register-table-body': ['Date In', 'Equipment Type', 'S/N or ZA No.', 'Unit', 'Received By', 'Remark', 'Date Out', 'Number', 'Rank', 'Name', 'Signature', 'SVCS 1045 Ref'],
    'techstores-equipment-register-table-body': ['Date In', 'Equipment Type', 'S/N or ZA No.', 'Unit', 'Received By', 'Remark', 'Date Out', 'Number', 'Rank', 'Name', 'Signature', 'SVCS 1045 Ref'],
    'suppliers-table-body': ['Supplier ID', 'Supplier Name', 'Contact Person', 'Phone', 'Email', 'Contract Start', 'Contract End', 'Status']
};

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function getReportDateFilters() {
    return {
        from: document.getElementById('reportDateFrom')?.value || '',
        to: document.getElementById('reportDateTo')?.value || ''
    };
}

function rowMatchesDateFilter(rowValues, dateFrom, dateTo) {
    if (!dateFrom && !dateTo) return true;
    const dateValue = (rowValues || []).find((v) => /^\d{4}-\d{2}-\d{2}$/.test(String(v || '').trim()));
    if (!dateValue) return true;
    if (dateFrom && dateValue < dateFrom) return false;
    if (dateTo && dateValue > dateTo) return false;
    return true;
}

function extractModuleTableRows(moduleId) {
    const container = document.getElementById(moduleId);
    const result = [];
    if (!container) return result;

    container.querySelectorAll('tbody[id]').forEach((tbody) => {
        const headerCells = Array.from(tbody.closest('table')?.querySelectorAll('thead th') || []);
        const headers = REPORT_TABLE_HEADERS[tbody.id] || headerCells
            .map((th) => th.textContent.trim())
            .filter((h) => h && h.toLowerCase() !== 'action');

        const rows = [];
        tbody.querySelectorAll('tr').forEach((tr) => {
            const values = [];
            tr.querySelectorAll('td').forEach((td) => {
                if (td.querySelector('button')) return;
                const input = td.querySelector('input, select, textarea');
                if (input) {
                    if (input.tagName === 'SELECT') {
                        values.push(input.options[input.selectedIndex]?.text || input.value);
                    } else {
                        values.push(input.value);
                    }
                } else {
                    values.push(td.textContent.trim());
                }
            });
            if (values.some((v) => String(v || '').trim() !== '')) {
                rows.push(values.slice(0, headers.length));
            }
        });

        result.push({ tbodyId: tbody.id, headers, rows });
    });

    return result;
}

function extractModuleFields(moduleId) {
    const container = document.getElementById(moduleId);
    if (!container) return [];
    const fields = [];
    container.querySelectorAll('input, select, textarea').forEach((el) => {
        if (el.closest('tbody')) return;
        if (el.type === 'file' || el.type === 'search') return;
        if (el.closest('.module-toolbar')) return;
        const labelEl = el.closest('.form-group, .form-col')?.querySelector('.form-label') ||
            el.closest('p')?.querySelector('strong');
        let label = labelEl ? labelEl.textContent.replace(/:$/, '').trim() : '';
        if (!label) return;
        const value = el.tagName === 'SELECT'
            ? (el.options[el.selectedIndex]?.text || el.value)
            : el.value;
        if (String(value || '').trim() !== '') {
            fields.push({ label, value });
        }
    });
    return fields;
}

function buildDashboardReportData() {
    const headers = ['GL Account', 'Name', 'Target', 'Committed', 'Vouchers', 'Balance', 'Utilization'];
    const rows = [];
    let totalBudget = 0;
    let totalCommitted = 0;
    let totalVouchers = 0;
    let totalBalance = 0;
    const month = typeof getSelectedGlTargetMonth === 'function' ? getSelectedGlTargetMonth() : '';
    const committed = typeof getBaseCommittedByGlForMonth === 'function'
        ? getBaseCommittedByGlForMonth(month)
        : getCommittedByGl();
    const vouchers = typeof getVoucherImpactByGlForMonth === 'function'
        ? getVoucherImpactByGlForMonth(month)
        : getVoucherImpactByGl();

    Object.keys(GL_ACCOUNTS).forEach((gl) => {
        const budget = typeof getGlMonthlyTarget === 'function' ? getGlMonthlyTarget(gl, month) : (appState.glBudgets[gl] || 0);
        const c = committed[gl] || 0;
        const v = vouchers[gl] || 0;
        const balance = typeof getGlMonthlyBalance === 'function' ? getGlMonthlyBalance(gl, month) : getGlBalance(gl);
        const util = budget > 0 ? Math.round(((budget - balance) / budget) * 100) : 0;
        totalBudget += budget;
        totalCommitted += c;
        totalVouchers += v;
        totalBalance += balance;
        rows.push([
            gl,
            GL_ACCOUNTS[gl].name,
            formatCurrency(budget),
            formatCurrency(c),
            formatCurrency(v),
            formatCurrency(balance),
            util + '%'
        ]);
    });

    return {
        title: 'Dashboard Overview Report',
        summary: [
            `Total Target: ${formatCurrency(totalBudget)}`,
            `Total Committed: ${formatCurrency(totalCommitted)}`,
            `Voucher Impact: ${formatCurrency(totalVouchers)}`,
            `Available Balance: ${formatCurrency(totalBalance)}`
        ],
        fields: [],
        tables: [{ tbodyId: 'dashboard-overview', headers, rows }]
    };
}

function buildReleaseCutReportData(dateFrom, dateTo) {
    const headers = ['Date', 'From GL', 'To GL', 'Amount', 'Reason', 'Authorized By'];
    const rows = (appState.releaseCuts || [])
        .filter((cut) => {
            const d = cut.date || '';
            if (dateFrom && d < dateFrom) return false;
            if (dateTo && d > dateTo) return false;
            return true;
        })
        .map((cut) => [
            cut.date || '',
            cut.fromGl || cut.from || '',
            cut.toGl || cut.to || '',
            formatCurrency(cut.amount || 0),
            cut.reason || '',
            cut.authorizedBy || ''
        ]);

    return {
        title: 'Release Cut Transfer Report',
        summary: [`Total transfers: ${rows.length}`],
        fields: [],
        tables: [{ tbodyId: 'release-cuts', headers, rows }]
    };
}

function buildStoresInventoryReportData(dateFrom, dateTo) {
    if (typeof ensureStoresInventory === 'function') ensureStoresInventory();

    const session = appState.storesInventory?.daySession;
    const categories = (typeof VOUCHER_INVENTORY_CATEGORIES !== 'undefined' && VOUCHER_INVENTORY_CATEGORIES)
        ? VOUCHER_INVENTORY_CATEGORIES
        : [];

    const balanceHeaders = ['Category', 'GL', 'Catalog Item', 'Opening', 'Received', 'Issued', 'On Hand', 'Status'];
    const balanceRows = [];
    let totalOpening = 0;
    let totalReceived = 0;
    let totalIssued = 0;
    let totalOnHand = 0;
    let depletedCount = 0;
    let lowCount = 0;

    categories.forEach((cat) => {
        const items = typeof getCatalogItemsForCategory === 'function'
            ? getCatalogItemsForCategory(cat.key)
            : [];
        items.forEach((item) => {
            const row = typeof getItemStockSummary === 'function'
                ? getItemStockSummary(item.id)
                : { opening: 0, received: 0, issued: 0, onHand: 0, item: item.name };
            if (!(row.opening || row.received || row.issued || row.onHand)) return;

            totalOpening += row.opening;
            totalReceived += row.received;
            totalIssued += row.issued;
            totalOnHand += row.onHand;

            let status = 'OK';
            if (row.onHand < 0) {
                status = 'Over-issued';
                depletedCount += 1;
            } else if (row.onHand === 0) {
                status = 'Depleted';
                depletedCount += 1;
            } else {
                const base = row.opening + row.received;
                if (base > 0 && row.onHand / base <= 0.2) {
                    status = 'Low stock';
                    lowCount += 1;
                }
            }

            balanceRows.push([
                cat.label || cat.key,
                cat.gl || '',
                row.item || item.name,
                String(row.opening),
                String(row.received),
                String(row.issued),
                String(row.onHand),
                status
            ]);
        });
    });

    const movementHeaders = ['Date', 'Type', 'Source', 'Category', 'Item', 'Qty', 'UoM', 'GL', 'RV/IV / DN', 'PO / Cycle', 'Party', 'Appointment', 'By', 'Description'];
    const movements = (appState.storesInventory?.transactions || []).filter((txn) => {
        const d = txn.date || '';
        if (dateFrom && d < dateFrom) return false;
        if (dateTo && d > dateTo) return false;
        return true;
    });

    const movementRows = movements.map((txn) => {
        const cat = categories.find((c) => c.key === txn.category);
        return [
            txn.date || '',
            txn.type === 'receipt' ? 'Receive' : 'Issue',
            txn.source || 'manual',
            cat?.label || txn.category || '',
            txn.item || '',
            String(txn.qty ?? ''),
            txn.uom || 'EA',
            txn.gl || '',
            txn.deliveryNoteRef || txn.voucherNo || '',
            [txn.poNumber, txn.dpRef].filter(Boolean).join(' / ') || txn.sourceRef || '',
            txn.party || '',
            txn.appointment || '',
            txn.by || '',
            txn.description || ''
        ];
    });

    const acct = typeof getInventoryAccountabilitySummary === 'function'
        ? getInventoryAccountabilitySummary(dateFrom, dateTo)
        : null;

    const summary = [
        `Catalog items with stock activity: ${balanceRows.length}`,
        `Opening total: ${totalOpening}`,
        `Received total: ${totalReceived}`,
        `Issued total: ${totalIssued}`,
        `On hand total: ${totalOnHand}`,
        `Depleted / over-issued items: ${depletedCount}`,
        `Low stock items: ${lowCount}`,
        `Movements in period: ${movementRows.length}`
    ];

    if (acct) {
        summary.push(`Received from procurement (period): ${acct.fromProcurement}`);
        summary.push(`Issued to unit requisitions (period): ${acct.fromRequisition}`);
        summary.push(`Deliveries awaiting stock post: ${acct.awaitingStockCount}`);
    }

    summary.unshift('Accountability: Opening + Received (procure/stock) − Issued (disburse/distribute) = On Hand');

    if (session && !session.endedAt) {
        summary.unshift(`Store day open: ${session.date || '—'} (started by ${session.startedBy || '—'})`);
    } else if (!session) {
        summary.unshift('Store day: not started');
    } else {
        summary.unshift(`Last closed store day: ${session.date || '—'}`);
    }

    const categoryHeaders = ['Category', 'GL', 'Opening', 'Received', 'Issued', 'On Hand'];
    const categoryRows = categories.map((cat) => {
        const sum = typeof getCategoryStockSummary === 'function'
            ? getCategoryStockSummary(cat.key)
            : { opening: 0, received: 0, issued: 0, onHand: 0 };
        return [
            cat.fullLabel || cat.label || cat.key,
            cat.gl || '',
            String(sum.opening),
            String(sum.received),
            String(sum.issued),
            String(sum.onHand)
        ];
    });

    return {
        title: 'Stores Inventory Report',
        summary,
        fields: [
            { label: 'Cost Centre', value: 'Z04P2SP212' },
            {
                label: 'Report type',
                value: 'Item stock balances and receive/issue movements (procure → stock → issue)'
            }
        ],
        tables: [
            {
                tbodyId: 'inventory-category-summary',
                title: 'Category Summary',
                headers: categoryHeaders,
                rows: categoryRows
            },
            {
                tbodyId: 'inventory-item-balances',
                title: 'Item Stock Balances',
                headers: balanceHeaders,
                rows: balanceRows
            },
            {
                tbodyId: 'inventory-movements',
                title: 'Receive / Issue Movements (with procurement & issue source)',
                headers: movementHeaders,
                rows: movementRows
            }
        ]
    };
}

function buildIctAccountabilityReportData(dateFrom, dateTo) {
    const rows = (typeof getIctAccountabilitySnapshot === 'function' ? getIctAccountabilitySnapshot() : [])
        .filter((r) => {
            const d = r.issueDate || '';
            if (!dateFrom && !dateTo) return true;
            if (!d) return false;
            if (dateFrom && d < dateFrom) return false;
            if (dateTo && d > dateTo) return false;
            return true;
        })
        .map((r) => {
            const unitLabel = typeof resolveZnaUnitLabel === 'function'
                ? resolveZnaUnitLabel(r.unit)
                : (r.unit || '');
            const sm = r.statusMeta || (typeof getIctAccStatusMeta === 'function' ? getIctAccStatusMeta(r) : null);
            const daysLeft = sm?.daysLabel
                || (r.assetClass === 'software' && r.expiryDate && typeof formatIctAccLicenceDaysLeft === 'function'
                    ? formatIctAccLicenceDaysLeft(typeof ictAccDaysUntil === 'function' ? ictAccDaysUntil(r.expiryDate) : null)
                    : '');
            return [
                r.zaNumber || r.traceRef || '',
                r.designation || '',
                r.issueDate || '',
                r.description || '',
                [unitLabel, r.holderName, r.forceNo].filter(Boolean).join(' · '),
                (sm && sm.label) || r.status || '',
                daysLeft || (r.expiryDate ? `Expires ${r.expiryDate}` : ''),
                r.remarks || r.renewalNotes || ''
            ];
        });

    const stats = typeof getIctAccountabilityStats === 'function'
        ? getIctAccountabilityStats()
        : { total: rows.length, equipment: 0, expendable: 0, software: 0, issued: 0, renewSoon: 0 };

    return {
        title: 'ZNA ICT Asset Register Report',
        summary: [
            `Total accountable records: ${stats.total}`,
            `ZA-engraved ICT equipment: ${stats.equipment}`,
            `Traceable expendables: ${stats.expendable}`,
            `Software licences: ${stats.software}`,
            `Currently issued out: ${stats.issued}`,
            `Software renewals due ≤90 days: ${stats.renewSoon}`,
            'Filter by item name, holding unit / formation, and issue date period / month / year on the register screen.'
        ],
        fields: [
            { label: 'Directorate', value: 'Information Technology Directorate' },
            { label: 'ZOFF GL', value: '6122100009 — Office Supplies & Services' }
        ],
        tables: [
            {
                tbodyId: 'ict-accountability-report',
                title: 'ZNA ICT Asset Register',
                headers: [
                    'ZA Number', 'Item Name', 'Date of Issue', 'Description',
                    'Holding Unit', 'Status', 'Days left', 'Remarks'
                ],
                rows
            }
        ]
    };
}

function buildPermanentLoansReportData(dateFrom, dateTo) {
    const inPeriod = (iso) => {
        if (!iso) return !dateFrom && !dateTo;
        if (dateFrom && iso < dateFrom) return false;
        if (dateTo && iso > dateTo) return false;
        return true;
    };
    const rows = (typeof collectPermanentLoanRows === 'function' ? collectPermanentLoanRows() : [])
        .filter((rec) => inPeriod(rec.issueDate))
        .map((rec) => [
            rec.zaNumber || '',
            rec.item || (typeof plCategoryLabel === 'function' ? plCategoryLabel(rec.category) : rec.category),
            rec.issueDate || '',
            [rec.rank, rec.issuedTo].filter(Boolean).join(' '),
            rec.forceNo || '',
            (typeof plUnitLabel === 'function' ? plUnitLabel(rec.unit) : rec.unit) || '',
            rec.status?.threeYearIso || '',
            rec.status?.label || '',
            (typeof plEligibilityLabel === 'function' ? plEligibilityLabel(rec.eligibility) : rec.eligibility) || ''
        ]);
    const summaryStats = typeof getPermanentLoansSummary === 'function'
        ? getPermanentLoansSummary()
        : { serving: 0, due3yr: 0, retireReturn: 0, personal: 0, total: rows.length };

    return {
        title: 'Permanent Loans — Laptops & iPads',
        summary: [
            `Records in period: ${rows.length} (register total ${summaryStats.total || rows.length})`,
            `On permanent loan (serving): ${summaryStats.serving || 0}`,
            `3-year / strike-off in progress: ${summaryStats.due3yr || 0}`,
            `Return on retirement (< 3 years): ${summaryStats.retireReturn || 0}`,
            `Personal / struck off: ${summaryStats.personal || 0}`,
            'Policy: Comd/34 (06 Nov 15) · AS(PLANS)/34 · QM IT DIR 17 Mar 20'
        ],
        fields: [
            { label: 'Directorate', value: 'Information Technology Directorate' },
            { label: 'File', value: 'IT/34 — Computer policy instruction and directives' }
        ],
        tables: [
            {
                tbodyId: 'permanent-loans-report',
                title: 'Permanent loan register',
                headers: [
                    'ZA No.', 'Item', 'Date of issue', 'Issued to', 'Force No.',
                    'Unit', '3-year date', 'Status', 'Eligibility'
                ],
                rows
            }
        ]
    };
}

function buildModuleReportData(moduleId) {
    const { from: dateFrom, to: dateTo } = getReportDateFilters();

    if (moduleId === 'dashboard') return buildDashboardReportData();
    if (moduleId === 'monthly-target-proposal') {
        return typeof buildMonthlyTargetProposalReportData === 'function'
            ? buildMonthlyTargetProposalReportData()
            : { title: 'Monthly Target Proposal', summary: ['Module not loaded.'], fields: [], tables: [] };
    }
    if (moduleId === 'daf-fund-request-memo') {
        return typeof buildDafFundRequestMemoReportData === 'function'
            ? buildDafFundRequestMemoReportData()
            : { title: 'DAF Fund Request Memo', summary: ['Module not loaded.'], fields: [], tables: [] };
    }
    if (moduleId === 'unit-requisitions') {
        return typeof buildUnitRequisitionsReportData === 'function'
            ? buildUnitRequisitionsReportData()
            : { title: 'Unit Requisitions', summary: ['Module not loaded.'], fields: [], tables: [] };
    }
    if (moduleId === 'supplier-debts') {
        return typeof buildSupplierDebtsReportData === 'function'
            ? buildSupplierDebtsReportData()
            : { title: 'Supplier Debts', summary: ['Module not loaded.'], fields: [], tables: [] };
    }
    if (moduleId === 'supplier-debt-chase') {
        return typeof buildSupplierDebtChaseReportData === 'function'
            ? buildSupplierDebtChaseReportData()
            : { title: 'DAF chase — supplier debt', summary: ['Module not loaded.'], fields: [], tables: [] };
    }
    if (moduleId === 'techstores-period') {
        return typeof buildTechStoresPeriodReportData === 'function'
            ? buildTechStoresPeriodReportData(dateFrom, dateTo)
            : { title: 'TechStores Period Report', summary: ['Report builder not loaded.'], fields: [], tables: [] };
    }
    if (moduleId === 'release-cut') return buildReleaseCutReportData(dateFrom, dateTo);
    if (moduleId === 'stores-inventory') return buildStoresInventoryReportData(dateFrom, dateTo);
    if (moduleId === 'stock-take') {
        return typeof buildStockTakeReportData === 'function'
            ? buildStockTakeReportData()
            : { title: 'Stock Take', summary: ['Stock take module not loaded.'], fields: [], tables: [] };
    }
    if (moduleId === 'monthly-returns') {
        return typeof buildMonthlyReturnsReportData === 'function'
            ? buildMonthlyReturnsReportData()
            : { title: 'Monthly Returns', summary: ['Monthly returns module not loaded.'], fields: [], tables: [] };
    }
    if (moduleId === 'inventory-accountability') return buildInventoryAccountabilityReportData(dateFrom, dateTo);
    if (moduleId === 'ict-accountability') return buildIctAccountabilityReportData(dateFrom, dateTo);
    if (moduleId === 'permanent-loans') return buildPermanentLoansReportData(dateFrom, dateTo);
    if (moduleId === 'dp-procurement') {
        const rows = (typeof ensureDpProcurements === 'function' ? ensureDpProcurements() : [])
            .map((r) => {
                const status = typeof normalizeDpProcStatus === 'function' ? normalizeDpProcStatus(r.status) : r.status;
                const label = typeof getDpProcStatusLabel === 'function' ? getDpProcStatusLabel(status) : status;
                return [
                    r.refNo || '',
                    r.sentDate || '',
                    r.itemSummary || '',
                    r.estimatedCost || '',
                    r.glDisplay || r.glValue || '',
                    (r.budgetProvisioned || 'yes') === 'no' ? 'Manual/DAF' : 'Budgeted',
                    label,
                    r.poNumber || '',
                    r.deliveryNoteRef || '',
                    r.stockPostedAt ? 'In stock' : 'Not posted'
                ];
            });
        return {
            title: 'ICT Procurement Cycle Report',
            summary: [
                `Cycle records: ${rows.length}`,
                `Posted to Stores Inventory: ${rows.filter((r) => r[9] === 'In stock').length}`,
                'Inventory is informed by procure → receive/stock → issue/distribute.'
            ],
            fields: [
                { label: 'Cost Centre', value: 'Z04P2SP212' },
                { label: 'Directorate', value: 'Information Technology Directorate' }
            ],
            tables: [{
                tbodyId: 'dp-procurement-report',
                title: 'Procurement cycle records',
                headers: ['Ref', 'Date', 'Items', 'Est. Cost', 'GL', 'Budget path', 'Status', 'PO', 'DN', 'Stock'],
                rows
            }]
        };
    }
    if (moduleId === 'spec-evaluation') {
        return {
            title: 'Spec Evaluation Datasheet',
            layout: 'spec-sheet',
            html: buildSpecEvalDatasheetHtml(),
            summary: [],
            fields: [],
            tables: []
        };
    }

    if (moduleId === 'dp-f1-form') {
        const snap = typeof getDpF1FormSnapshot === 'function' ? getDpF1FormSnapshot() : { items: [] };
        return {
            title: 'DP F1 Official Indent',
            layout: 'dp-f1',
            html: buildDpF1OfficialHtml(),
            summary: [`Line items: ${snap.items?.length || 0}`],
            fields: [],
            tables: [{
                tbodyId: 'dp-f1-table-body',
                title: 'Indent items',
                headers: ['Ser', 'Designation', 'Qty', 'Holding Stock', 'Potential Supplier'],
                rows: (snap.items || []).map((item) => [
                    item.ser, item.designation, item.qty, item.holding, item.supplier
                ])
            }]
        };
    }

    if (moduleId === 'purchase-orders') {
        const snap = typeof getPurchaseOrderSnapshot === 'function' ? getPurchaseOrderSnapshot() : { lines: [], total: 0 };
        return {
            title: 'Purchase Order',
            layout: 'purchase-order',
            html: typeof buildPurchaseOrderOfficialHtml === 'function' ? buildPurchaseOrderOfficialHtml() : '',
            summary: [
                `PO Ref: ${snap.poNumber || '—'}`,
                `Supplier: ${snap.supplierName || '—'}`,
                `Total net value excl. tax ${snap.currency || 'ZiG'}: ${snap.totalDisplay || formatPoMoneyPlain(snap.total)}`
            ],
            fields: [],
            tables: [{
                tbodyId: 'purchase-orders-lines-body',
                title: 'Line items',
                headers: ['Item (Ser)', 'Material Number', 'Order Qty', 'Unit', 'Description', 'Price Per Unit', 'Net Value'],
                rows: (snap.lines || []).map((line) => [
                    line.item, line.material, line.qty, line.unit || 'each', line.desc,
                    formatPoMoneyPlain(line.price), formatPoMoneyPlain(line.net)
                ])
            }]
        };
    }

    if (moduleId === 'zna-q-982') {
        const snap = typeof getZnaQ982FormSnapshot === 'function' ? getZnaQ982FormSnapshot() : { items: [] };
        return {
            title: 'ZNA Q 982 — Combined Indent and Voucher for Stores',
            layout: 'zna-q-982',
            html: buildZnaQ982OfficialHtml(),
            summary: [`Line items: ${snap.items?.length || 0}`],
            fields: [],
            tables: [{
                tbodyId: 'zna-q-982-table-body',
                title: 'Indent lines',
                headers: ['Line', 'Stock', 'Location', 'Vocab/Part', 'Section', 'Designation', 'UOI', 'Required', 'Issued', 'To Follow', 'Pkg', 'Weight', '$', 'c'],
                rows: (snap.items || []).map((item) => [
                    item.line, item.stockBalance, item.location, item.vocab, item.section,
                    item.designation, item.uoi, item.qtyRequired, item.qtyIssued, item.qtyToFollow,
                    item.packageNo, item.weight, item.valueDollars, item.valueCents
                ])
            }]
        };
    }

    if (moduleId === 'zna-q-178') {
        const snap = getZnaQ178FormSnapshot();
        return {
            title: 'ZNA Q 178 — Sub Ledger Sheet',
            layout: 'zna-q-178',
            html: buildZnaQ178OfficialHtml(),
            summary: [`Ledger lines: ${snap.items?.length || 0}`],
            fields: [],
            tables: [{
                tbodyId: 'zna-q-178-table-body',
                headers: ['Date', 'To/From', 'Receipts', 'Issues', 'Stock', 'Voucher/QM'],
                rows: (snap.items || []).map((i) => [i.date, i.party, i.receipts, i.issues, i.stock, i.voucher])
            }]
        };
    }

    if (moduleId === 'zna-q-1033') {
        const snap = getZnaQ1033FormSnapshot();
        return {
            title: 'ZNA Q 1033 — Issue & Receipt Voucher',
            layout: 'zna-q-1033',
            html: buildZnaQ1033OfficialHtml(),
            summary: [`Lines: ${snap.items?.length || 0}`],
            fields: [],
            tables: [{
                tbodyId: 'zna-q-1033-table-body',
                headers: ['VAOS/Part', 'Designation', 'Qty', 'Marks', 'Balance', 'Location', 'Rate'],
                rows: (snap.items || []).map((i) => [i.vaos, i.designation, i.qty, i.marks, i.balance, i.location, i.rate])
            }]
        };
    }

    if (moduleId === 'zna-q-1043') {
        const snap = getZnaQ1043FormSnapshot();
        return {
            title: 'ZNA Q 1043 — Condemnation Certificate',
            layout: 'zna-q-1043',
            html: buildZnaQ1043OfficialHtml(),
            summary: [`Equipment lines: ${snap.items?.length || 0}`],
            fields: [],
            tables: [{
                tbodyId: 'zna-q-1043-table-body',
                headers: ['Designation', 'Qty', 'BLR', 'BER'],
                rows: (snap.items || []).map((i) => [i.designation, i.qty, i.blr ? 'Y' : '', i.ber ? 'Y' : ''])
            }]
        };
    }

    const qmLayouts = {
        'zna-q-80': () => ({
            title: 'ZNA Q 80 — Ledger Sheet',
            layout: 'zna-q-80',
            html: buildZnaQ80OfficialHtml(),
            summary: [],
            fields: [],
            tables: []
        }),
        'zna-svcs-890': () => ({
            title: 'ZNA SVCS/890',
            layout: 'zna-svcs-890',
            html: buildZnaSvcs890OfficialHtml(),
            summary: [],
            fields: [],
            tables: []
        }),
        'zna-q-1179': () => ({
            title: 'ZNA Q 1179 — Clothing Issue Voucher',
            layout: 'zna-q-1179',
            html: buildZnaQ1179OfficialHtml(),
            summary: [],
            fields: [],
            tables: []
        }),
        'zna-q-987': () => ({
            title: 'ZNA Q 987 — Certificate of Stocktaking',
            layout: 'zna-q-987',
            html: buildZnaQ987OfficialHtml(),
            summary: [],
            fields: [],
            tables: []
        }),
        'zna-q-3977': () => ({
            title: 'ZNA Q 3977 — Neglect / Misuse / Damage',
            layout: 'zna-q-3977',
            html: buildZnaQ3977OfficialHtml(),
            summary: [],
            fields: [],
            tables: []
        }),
        'zna-q-985': () => ({
            title: 'ZNA Q 985 — Discrepancy Report',
            layout: 'zna-q-985',
            html: buildZnaQ985OfficialHtml(),
            summary: [],
            fields: [],
            tables: []
        }),
        'zna-q-1': () => ({
            title: 'ZNA Q 1 — Write-off Schedule',
            layout: 'zna-q-1',
            html: buildZnaQ1OfficialHtml(),
            summary: [],
            fields: [],
            tables: []
        }),
        'zna-q-998': () => ({
            title: 'ZNA Q 998 — Statement of Loss / Damage / Destruction',
            layout: 'zna-q-998',
            html: buildZnaQ998OfficialHtml(),
            summary: [],
            fields: [],
            tables: []
        }),
        'zna-q-1680': () => ({
            title: 'ZNA Q 1680 — Miscellaneous credit/debit voucher',
            layout: 'zna-q-1680',
            html: buildZnaQ1680OfficialHtml(),
            summary: [],
            fields: [],
            tables: []
        }),
        'zna-q-3': () => ({ title: 'ZNA Q 3 — Issue to Government department on repayment', layout: 'zna-q-3', html: buildZnaQ3OfficialHtml(), summary: [], fields: [], tables: [] }),
        'zna-q-31': () => ({ title: 'ZNA Q 31 — Cash purchase / receipt', layout: 'zna-q-31', html: buildZnaQ31OfficialHtml(), summary: [], fields: [], tables: [] }),
        'zna-q-40': () => ({ title: 'ZNA Q 40 — Artisan tools list', layout: 'zna-q-40', html: buildZnaQ40OfficialHtml(), summary: [], fields: [], tables: [] }),
        'zna-q-1049': () => ({ title: 'ZNA Q 1049 — Transfer voucher', layout: 'zna-q-1049', html: buildZnaQ1049OfficialHtml(), summary: [], fields: [], tables: [] }),
        'zna-q-1229': () => ({ title: 'ZNA Q 1229 — Certificate of accidental breakage', layout: 'zna-q-1229', html: buildZnaQ1229OfficialHtml(), summary: [], fields: [], tables: [] }),
        'zna-q-1571': () => ({ title: 'ZNA Q 1571 — Debit voucher', layout: 'zna-q-1571', html: buildZnaQ1571OfficialHtml(), summary: [], fields: [], tables: [] }),
        'zna-q-1954': () => ({ title: 'ZNA Q 1954 — Recoveries from individuals', layout: 'zna-q-1954', html: buildZnaQ1954OfficialHtml(), summary: [], fields: [], tables: [] }),
        'zna-svcs-1045': () => ({
            title: 'ZNA SVCS 1045 — Workshop Indent',
            layout: 'zna-svcs-1045',
            html: buildZnaSvcs1045OfficialHtml(),
            summary: [],
            fields: [],
            tables: []
        }),
        'zna-q-1157': () => ({
            title: 'ZNA Q 1157 — Clothing & Equipment Record',
            layout: 'zna-q-1157',
            html: buildZnaQ1157OfficialHtml(),
            summary: [],
            fields: [],
            tables: []
        }),
        'accommodation-stores': () => ({
            title: 'Inventory of Accommodation Stores',
            layout: 'accommodation-stores',
            html: buildAccommodationStoresOfficialHtml(),
            summary: [],
            fields: [],
            tables: []
        })
    };
    if (qmLayouts[moduleId]) return qmLayouts[moduleId]();

    const fields = extractModuleFields(moduleId);
    const tables = extractModuleTableRows(moduleId).map((table) => ({
        ...table,
        rows: table.rows.filter((row) => rowMatchesDateFilter(row, dateFrom, dateTo))
    }));

    const totalRows = tables.reduce((sum, t) => sum + t.rows.length, 0);
    const summary = [`Records in report: ${totalRows}`];

    if (moduleId === 'voucher-module') {
        const typeEl = document.getElementById('voucherType');
        const typeLabel = typeEl?.selectedOptions?.[0]?.text || '';
        if (typeLabel) summary.unshift(`Voucher type: ${typeLabel}`);
    }

    if (moduleId === 'financial-year-bids') {
        let total = 0;
        tables.forEach((t) => {
            t.rows.forEach((row) => {
                total += parseFloat(String(row[7] || '').replace(/[^0-9.-]/g, '')) || 0;
            });
        });
        summary.push(`Total bid value: ${formatCurrency(total)}`);
    }

    if (moduleId === 'purchase-orders') {
        let total = 0;
        tables.forEach((t) => {
            t.rows.forEach((row) => {
                total += parseFloat(String(row[3] ?? row[5] ?? '').replace(/[^0-9.-]/g, '')) || 0;
            });
        });
        const snap = typeof getPurchaseOrderSnapshot === 'function' ? getPurchaseOrderSnapshot() : null;
        if (snap?.total > 0) summary.push(`Current document total: ${snap.totalDisplay}`);
        summary.push(`Register / report total: ${formatCurrency(total)}`);
    }

    if (moduleId === 'temporary-loans') {
        const loanRows = typeof collectTemporaryLoanRows === 'function' ? collectTemporaryLoanRows() : [];
        if (loanRows.length) {
            const summaryLoans = typeof getTemporaryLoansSummary === 'function'
                ? getTemporaryLoansSummary(loanRows)
                : { onLoan: 0, dueSoon: 0, overstayed: 0, returned: 0 };
            const active = summaryLoans.onLoan + summaryLoans.dueSoon + summaryLoans.overstayed;
            summary.push(`Items currently on loan: ${active}`);
            summary.push(`Due soon (≤3 days): ${summaryLoans.dueSoon}`);
            summary.push(`Overstayed (past 14-day max / due date): ${summaryLoans.overstayed}`);
            summary.push(`Returned: ${summaryLoans.returned}`);
        } else {
            const outstanding = tables[0]?.rows.filter((row) => !String(row[10] || row[9] || '').trim()).length || 0;
            summary.push(`Outstanding loans: ${outstanding}`);
        }
    }

    if (moduleId === 'spec-evaluation') {
        const specCount = tables[0]?.rows.filter((row) => String(row[1] || '').trim()).length || 0;
        summary.push(`Specification fields defined: ${specCount}`);
        const qtyField = fields.find((f) => /quantity/i.test(f.label));
        const unitField = fields.find((f) => /unit price/i.test(f.label));
        const totalField = fields.find((f) => /estimated total/i.test(f.label));
        if (qtyField?.value) summary.push(`Quantity: ${qtyField.value}`);
        if (unitField?.value) summary.push(`Est. unit price: ${formatCurrency(parseFloat(unitField.value) || 0)}`);
        if (totalField?.value) summary.push(`Est. total: ${formatCurrency(parseFloat(totalField.value) || 0)}`);
    }

    return {
        title: getModuleLabel(moduleId) + ' Report',
        summary,
        fields,
        tables
    };
}

function renderReportHtml(reportData) {
    if (reportData?.layout === 'spec-sheet' && reportData.html) {
        return reportData.html;
    }
    if (reportData?.layout === 'techstores-period' && reportData.html) {
        return reportData.html;
    }
    if (reportData?.layout === 'daf-fund-memo' && reportData.html) {
        return reportData.html;
    }
    if (reportData?.layout === 'monthly-returns' && reportData.html) {
        return reportData.html;
    }
    if (reportData?.layout === 'dp-f1' && reportData.html) {
        return reportData.html;
    }
    if (reportData?.layout === 'purchase-order' && reportData.html) {
        return reportData.html;
    }
    if (reportData?.layout === 'zna-q-982' && reportData.html) {
        return reportData.html;
    }
    if (reportData?.layout === 'zna-q-178' && reportData.html) {
        return reportData.html;
    }
    if (reportData?.layout === 'zna-q-1033' && reportData.html) {
        return reportData.html;
    }
    if (reportData?.layout === 'zna-q-1043' && reportData.html) {
        return reportData.html;
    }
    const qmHtmlLayouts = ['zna-q-80', 'zna-svcs-890', 'zna-q-1179', 'zna-q-987', 'zna-q-3977', 'zna-q-985', 'zna-q-1', 'zna-q-998', 'zna-q-1680', 'zna-q-3', 'zna-q-31', 'zna-q-40', 'zna-q-1049', 'zna-q-1229', 'zna-q-1571', 'zna-q-1954', 'zna-svcs-1045', 'zna-q-1157', 'accommodation-stores'];
    if (qmHtmlLayouts.includes(reportData?.layout) && reportData.html) {
        return reportData.html;
    }

    const generatedAt = new Date().toLocaleString();
    const { from, to } = getReportDateFilters();
    let period = 'All dates';
    if (from || to) period = `${from || '…'} to ${to || '…'}`;

    let html = `
        <div class="report-doc-header ${reportData.layout === 'priority-list' ? 'report-priority-list-header' : ''}">
            ${reportData.layout === 'priority-list' ? '<div class="report-restricted-mark">RESTRICTED</div>' : ''}
            <h2>Information Technology Directorate</h2>
            <h3>${escapeHtml(reportData.title)}</h3>
            <div>Cost Centre: Z04P2SP212 · Josiah Magama Tongogara Barracks</div>
            ${reportData.layout === 'priority-list' ? '<div class="report-restricted-mark report-restricted-foot">RESTRICTED</div>' : ''}
        </div>
        <div class="report-meta">
            <span><strong>Generated:</strong> ${escapeHtml(generatedAt)}</span>
            <span><strong>Period:</strong> ${escapeHtml(period)}</span>
        </div>
    `;

    if (reportData.summary && reportData.summary.length) {
        html += `<div class="report-summary-box">${reportData.summary.map((s) => `<div>${escapeHtml(s)}</div>`).join('')}</div>`;
    }

    if (reportData.fields && reportData.fields.length) {
        html += '<table><thead><tr><th>Field</th><th>Value</th></tr></thead><tbody>';
        reportData.fields.forEach((f) => {
            html += `<tr><td>${escapeHtml(f.label)}</td><td>${escapeHtml(f.value)}</td></tr>`;
        });
        html += '</tbody></table>';
    }

    if (!reportData.tables || reportData.tables.length === 0 || reportData.tables.every((t) => t.rows.length === 0)) {
        if (!reportData.fields || reportData.fields.length === 0) {
            html += '<div class="report-empty">No saved data found for this module. Save the module first, then generate the report.</div>';
        }
    } else {
        reportData.tables.forEach((table) => {
            if (!table.rows.length) return;
            if (table.title) {
                html += `<h4 class="report-table-title">${escapeHtml(table.title)}</h4>`;
            }
            html += '<table><thead><tr>';
            table.headers.forEach((h) => { html += `<th>${escapeHtml(h)}</th>`; });
            html += '</tr></thead><tbody>';
            table.rows.forEach((row) => {
                html += '<tr>';
                table.headers.forEach((_, i) => {
                    html += `<td>${escapeHtml(row[i] ?? '')}</td>`;
                });
                html += '</tr>';
            });
            html += '</tbody></table>';
        });
    }

    return html;
}

function generateModuleReport(moduleId, options = {}) {
    if (!currentUser) {
        showToast('Please sign in to generate reports.', 'error');
        return null;
    }
    if (!canAccessModule('reports-module')) {
        showToast('You do not have access to reports.', 'error');
        return null;
    }
    if (moduleId !== 'dashboard' && moduleId !== 'techstores-period' && moduleId !== 'stores-inventory' && moduleId !== 'stock-take' && moduleId !== 'monthly-returns' && moduleId !== 'inventory-accountability' && moduleId !== 'ict-accountability' && moduleId !== 'dp-procurement' && moduleId !== 'monthly-target-proposal' && moduleId !== 'daf-fund-request-memo' && moduleId !== 'supplier-debt-chase' && !canAccessModule(moduleId) && moduleId !== 'release-cut') {
        showToast('You do not have access to that module report.', 'error');
        return null;
    }
    if (moduleId === 'supplier-debt-chase' && !canAccessModule('supplier-debts')) {
        showToast('You do not have access to supplier debt chase minutes.', 'error');
        return null;
    }
    if ((moduleId === 'stores-inventory' || moduleId === 'stock-take' || moduleId === 'inventory-accountability') && !canAccessModule('voucher-module') && !canAccessModule('stock-take') && !canAccessModule('reports-module')) {
        showToast('You do not have access to inventory reports.', 'error');
        return null;
    }
    if (moduleId === 'release-cut' && !canProcessReleaseCut() && currentUser.role !== 'admin') {
        // Viewers/store officers can still report on modules they can open;
        // release-cut report is admin-only.
        showToast('Release Cut reports require Administrator access.', 'error');
        return null;
    }
    const { navigate = true, autoPrint = false } = options;
    const reportData = buildModuleReportData(moduleId);
    lastGeneratedReport = { moduleId, reportData, generatedAt: new Date().toISOString() };

    const output = document.getElementById('report-output');
    if (output) output.innerHTML = renderReportHtml(reportData);

    const select = document.getElementById('reportModuleSelect');
    if (select) select.value = moduleId;

    document.querySelectorAll('.report-module-card').forEach((card) => {
        card.classList.toggle('active', card.dataset.reportModule === moduleId);
    });

    if (navigate) navigateToModule('reports-module');
    showToast(`Report generated: ${getModuleLabel(moduleId)}`);

    if (autoPrint) {
        setTimeout(() => printGeneratedReport(), 200);
    }

    return reportData;
}

function printGeneratedReport() {
    const output = document.getElementById('report-output');
    if (!output || !lastGeneratedReport) {
        showToast('Generate a report first.', 'warning');
        return;
    }
    const layout = lastGeneratedReport.reportData?.layout;
    const printClassMap = {
        'spec-sheet': 'printing-spec-sheet',
        'dp-f1': 'printing-dp-f1',
        'purchase-order': 'printing-purchase-order',
        'zna-q-982': 'printing-zna-q-982',
        'zna-q-178': 'printing-zna-q-178',
        'zna-q-1033': 'printing-zna-q-1033',
        'priority-list': 'printing-priority-list',
        'daf-fund-memo': 'printing-daf-fund-memo',
        'zna-q-80': 'printing-zna-q-80',
        'zna-svcs-890': 'printing-zna-svcs-890',
        'zna-q-1179': 'printing-zna-q-1179',
        'zna-q-987': 'printing-zna-q-987',
        'zna-q-3977': 'printing-zna-q-3977',
        'zna-q-985': 'printing-zna-q-985',
        'zna-q-1': 'printing-zna-q-1',
        'zna-q-998': 'printing-zna-q-998',
        'zna-q-1680': 'printing-zna-q-1680',
        'zna-q-3': 'printing-zna-q-3',
        'zna-q-31': 'printing-zna-q-31',
        'zna-q-40': 'printing-zna-q-40',
        'zna-q-1049': 'printing-zna-q-1049',
        'zna-q-1229': 'printing-zna-q-1229',
        'zna-q-1571': 'printing-zna-q-1571',
        'zna-q-1954': 'printing-zna-q-1954',
        'zna-svcs-1045': 'printing-zna-svcs-1045',
        'zna-q-1157': 'printing-zna-q-1157',
        'accommodation-stores': 'printing-accommodation-stores',
        'monthly-returns': 'printing-monthly-returns'
    };
    const printClass = printClassMap[layout];
    if (typeof runOfficialPrint === 'function') {
        runOfficialPrint(() => {
            output.classList.add('print-target');
            document.body.classList.add('is-printing');
            if (printClass) document.body.classList.add(printClass);
        });
        return;
    }
    output.classList.add('print-target');
    document.body.classList.add('is-printing');
    if (printClass) document.body.classList.add(printClass);
    window.print();
    setTimeout(() => {
        output.classList.remove('print-target');
        document.body.classList.remove('is-printing', ...Object.values(printClassMap));
    }, 2000);
}

function csvEscape(value) {
    const str = String(value ?? '');
    if (/[",\n\r]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
    return str;
}

function exportReportCsv() {
    if (!lastGeneratedReport) {
        showToast('Generate a report first.', 'warning');
        return;
    }
    const { moduleId, reportData } = lastGeneratedReport;
    const lines = [];
    lines.push(['Report', reportData.title].map(csvEscape).join(','));
    lines.push(['Generated', new Date(lastGeneratedReport.generatedAt).toLocaleString()].map(csvEscape).join(','));
    lines.push('');

    (reportData.summary || []).forEach((s) => lines.push(csvEscape(s)));
    if (reportData.summary?.length) lines.push('');

    if (reportData.fields?.length) {
        lines.push(['Field', 'Value'].map(csvEscape).join(','));
        reportData.fields.forEach((f) => lines.push([f.label, f.value].map(csvEscape).join(',')));
        lines.push('');
    }

    (reportData.tables || []).forEach((table) => {
        if (!table.rows.length) return;
        lines.push(table.headers.map(csvEscape).join(','));
        table.rows.forEach((row) => {
            lines.push(table.headers.map((_, i) => csvEscape(row[i] ?? '')).join(','));
        });
        lines.push('');
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    downloadReportBlob(blob, `${getReportExportBasename()}.csv`);
    showToast('Report exported as CSV.');
}

function getReportExportBasename() {
    const moduleId = lastGeneratedReport?.moduleId || 'report';
    return `techstores-report-${moduleId}-${new Date().toISOString().slice(0, 10)}`;
}

function downloadReportBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

function getGeneratedReportInnerHtml() {
    const output = document.getElementById('report-output');
    if (!output || !lastGeneratedReport) return '';
    if (output.querySelector('.report-empty') && !output.querySelector('.spec-sheet') && !output.querySelector('.dp-f1-official-doc') && !output.querySelector('.q982-official-doc') && !output.querySelector('.q178-official-doc') && !output.querySelector('.q1033-official-doc') && !output.querySelector('.q1043-official-doc') && !output.querySelector('table') && !output.querySelector('.report-doc-header')) {
        return '';
    }
    return output.innerHTML;
}

async function resolveUrlToDataUri(url) {
    try {
        const absolute = new URL(url, window.location.href).href;
        const response = await fetch(absolute);
        if (!response.ok) return absolute;
        const blob = await response.blob();
        return await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        return url;
    }
}

async function prepareHtmlForExport(html) {
    const wrap = document.createElement('div');
    wrap.innerHTML = html;
    const nodes = [...wrap.querySelectorAll('[src]')];
    await Promise.all(nodes.map(async (el) => {
        const src = el.getAttribute('src');
        if (!src || src.startsWith('data:')) return;
        el.setAttribute('src', await resolveUrlToDataUri(src));
    }));
    return wrap.innerHTML;
}

function getReportExportStyles() {
    return `
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #222; margin: 20px; }
      table { width: 100%; border-collapse: collapse; margin: 12px 0 18px; }
      th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; vertical-align: top; }
      th { background: #f3f5f7; }
      .report-doc-header h2 { margin: 0 0 4px; color: #2c3e50; }
      .report-doc-header h3 { margin: 0 0 6px; color: #34495e; }
      .report-meta { display: flex; gap: 18px; flex-wrap: wrap; margin-bottom: 12px; color: #555; font-size: 12px; }
      .report-summary-box { background: #f8fafb; border: 1px solid #e5e9ee; padding: 10px 12px; margin-bottom: 12px; }
      .spec-sheet { --spec-red: #c8102e; border: 1px solid #ececec; padding: 16px; }
      .spec-sheet-header { display: grid; grid-template-columns: 140px 1fr 160px; gap: 12px; border-bottom: 2px solid #c8102e; padding-bottom: 12px; margin-bottom: 12px; }
      .spec-sheet-logo { width: 84px; height: 84px; border-radius: 50%; }
      .spec-sheet-brand-meta { font-size: 11px; color: #666; text-align: center; }
      .spec-sheet-title-block h1 { font-size: 22px; margin: 0 0 8px; text-transform: uppercase; }
      .spec-sheet-accent { color: #c8102e; }
      .spec-sheet-badge { display: inline-block; background: #c8102e; color: #fff; padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; margin-bottom: 8px; }
      .spec-sheet-tagline { color: #666; font-size: 12px; }
      .spec-sheet-meta-line { display: flex; flex-wrap: wrap; gap: 10px; font-size: 11px; margin-top: 8px; }
      .spec-sheet-body { display: grid; grid-template-columns: 1fr 230px; gap: 14px; }
      .spec-sheet-table { width: 100%; border-collapse: collapse; }
      .spec-sheet-table td { border: none; border-bottom: 1px solid #e5e5e5; padding: 8px 4px; }
      .spec-sheet-icon { display: inline-block; background: #c8102e; color: #fff; font-size: 9px; font-weight: 800; padding: 4px 5px; border-radius: 4px; }
      .spec-sheet-label { font-size: 11px; font-weight: 800; width: 28%; }
      .spec-sheet-value { font-size: 12px; }
      .spec-sheet-note { font-size: 10px; color: #777; }
      .spec-sheet-side { border: 1px solid #f0d0d5; }
      .spec-sheet-side-title { background: #c8102e; color: #fff; text-align: center; padding: 8px; font-weight: 800; font-size: 12px; text-transform: uppercase; }
      .spec-sheet-highlight { padding: 8px 10px; border-bottom: 1px solid #f3f3f3; }
      .spec-sheet-highlight strong { display: block; font-size: 12px; }
      .spec-sheet-highlight p { margin: 2px 0 0; font-size: 11px; color: #666; }
      .spec-sheet-features { display: grid; grid-template-columns: 1fr 160px; gap: 10px; border-top: 1px solid #e5e5e5; border-bottom: 1px solid #e5e5e5; padding: 10px 0; margin: 12px 0; }
      .spec-sheet-pills { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
      .spec-sheet-pill strong { display: block; font-size: 11px; }
      .spec-sheet-pill small { color: #777; font-size: 10px; }
      .spec-sheet-os-badge { text-align: center; border-left: 1px solid #e5e5e5; padding-left: 8px; }
      .spec-sheet-signoff { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
      .spec-sheet-sign-col h4 { color: #c8102e; margin: 0 0 8px; text-transform: uppercase; }
      .spec-sheet-sign-line { font-size: 12px; margin-bottom: 6px; }
      @media print {
        body { margin: 0; }
        .no-print { display: none !important; }
      }
    `;
}

function buildWordDocumentHtml(bodyHtml, title) {
    return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:w="urn:schemas-microsoft-com:office:word"
 xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<title>${escapeHtml(title || 'Tech Stores Report')}</title>
<!--[if gte mso 9]>
<xml>
  <w:WordDocument>
    <w:View>Print</w:View>
    <w:Zoom>100</w:Zoom>
  </w:WordDocument>
</xml>
<![endif]-->
<style>${getReportExportStyles()}</style>
</head>
<body>
${bodyHtml}
</body>
</html>`;
}

async function exportReportWord() {
    if (!lastGeneratedReport) {
        showToast('Generate a report first.', 'warning');
        return;
    }
    const rawHtml = getGeneratedReportInnerHtml();
    if (!rawHtml) {
        showToast('No report content to export. Generate a report first.', 'warning');
        return;
    }

    try {
        showToast('Preparing Word document…');
        const html = await prepareHtmlForExport(rawHtml);
        const docHtml = buildWordDocumentHtml(html, lastGeneratedReport.reportData.title);
        const blob = new Blob(['\ufeff', docHtml], { type: 'application/msword;charset=utf-8' });
        downloadReportBlob(blob, `${getReportExportBasename()}.doc`);
        showToast('Report saved as Word (.doc). Open in Microsoft Word to edit.');
    } catch (error) {
        console.error(error);
        showToast('Could not export Word document.', 'error');
    }
}

async function exportReportPdf() {
    if (!lastGeneratedReport) {
        showToast('Generate a report first.', 'warning');
        return;
    }
    const rawHtml = getGeneratedReportInnerHtml();
    if (!rawHtml) {
        showToast('No report content to export. Generate a report first.', 'warning');
        return;
    }

    try {
        showToast('Opening PDF save dialog… Choose “Save as PDF” or “Microsoft Print to PDF”.');
        const html = await prepareHtmlForExport(rawHtml);
        const title = lastGeneratedReport.reportData.title || 'Tech Stores Report';
        const win = window.open('', '_blank', 'noopener,noreferrer,width=980,height=720');
        if (!win) {
            showToast('Pop-up blocked. Allow pop-ups for this site, then try again.', 'error');
            return;
        }

        win.document.open();
        win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)}</title>
  <style>${getReportExportStyles()}</style>
</head>
<body>
  <div class="no-print" style="margin-bottom:12px;padding:10px 12px;background:#fff3cd;border:1px solid #ffecb5;border-radius:8px;font-size:13px;">
    In the print dialog, set <strong>Destination</strong> to <strong>Save as PDF</strong> (or Microsoft Print to PDF), then click Save.
  </div>
  ${html}
  <script>
    window.addEventListener('load', function () {
      setTimeout(function () { window.focus(); window.print(); }, 350);
    });
  <\/script>
</body>
</html>`);
        win.document.close();
    } catch (error) {
        console.error(error);
        showToast('Could not open PDF export window.', 'error');
    }
}

async function exportModuleAsPdf(moduleId) {
    const report = generateModuleReport(moduleId, { navigate: false });
    if (!report) return;
    await exportReportPdf();
}

async function exportModuleAsWord(moduleId) {
    const report = generateModuleReport(moduleId, { navigate: false });
    if (!report) return;
    await exportReportWord();
}

function initReportsModule() {
    const grid = document.getElementById('reportsModuleGrid');
    if (!grid) return;

    const reportModules = [
        'techstores-period',
        'dashboard',
        'stores-inventory',
        'stock-take',
        'monthly-returns',
        'inventory-accountability',
        'dp-procurement',
        ...MODULE_IDS,
        'release-cut'
    ];

    grid.innerHTML = reportModules.map((id) => `
        <div class="report-module-card${id === 'techstores-period' ? ' report-module-card-featured' : ''}" data-report-module="${id}">
            <h4>${escapeHtml(getModuleLabel(id))}</h4>
            <p>${id === 'techstores-period' ? 'Monthly · Quarterly · Yearly consolidated' : 'Click to generate report'}</p>
        </div>
    `).join('');

    grid.querySelectorAll('.report-module-card').forEach((card) => {
        card.addEventListener('click', function() {
            generateModuleReport(this.dataset.reportModule, { navigate: false });
        });
    });

    document.getElementById('generateSelectedReportBtn')?.addEventListener('click', function() {
        const moduleId = document.getElementById('reportModuleSelect').value;
        generateModuleReport(moduleId, { navigate: false });
    });

    document.getElementById('printGeneratedReportBtn')?.addEventListener('click', printGeneratedReport);
    document.getElementById('exportReportPdfBtn')?.addEventListener('click', () => { exportReportPdf(); });
    document.getElementById('exportReportWordBtn')?.addEventListener('click', () => { exportReportWord(); });
    document.getElementById('exportReportCsvBtn')?.addEventListener('click', exportReportCsv);

    document.getElementById('specEvalSavePdfBtn')?.addEventListener('click', () => { exportModuleAsPdf('spec-evaluation'); });
    document.getElementById('specEvalSaveWordBtn')?.addEventListener('click', () => { exportModuleAsWord('spec-evaluation'); });

    if (typeof initTechStoresPeriodReportControls === 'function') {
        initTechStoresPeriodReportControls();
    }

    document.getElementById('btnGenerateTechStoresPeriod')?.addEventListener('click', () => {
        const select = document.getElementById('reportModuleSelect');
        if (select) select.value = 'techstores-period';
        generateModuleReport('techstores-period', { navigate: false });
    });

    document.body.addEventListener('click', function(e) {
        const button = e.target.closest('.btn-generate-report');
        if (!button || !button.dataset.reportModule) return;
        e.preventDefault();
        generateModuleReport(button.dataset.reportModule, { navigate: true });
    });
}
