function invLedgerEscape(value) {
    if (typeof invHtmlEscape === 'function') return invHtmlEscape(value);
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/** Parent inventory families shown on the dashboard (stock, not budget). */
const INVENTORY_PARENT_LEDGERS = [
    {
        key: 'zoff',
        label: 'ZOFF Inventory (Formerly IT Consumables)',
        shortLabel: 'ZOFF Inventory',
        detail: 'Office Supplies & Services — computer consumables, accessories, stationery (Toners, USB sticks, Ext HDD, bond paper, etc.)',
        defaultGl: '6122100009',
        cssKey: 'zoff'
    },
    {
        key: 'softwares',
        label: 'SOFTWARES INVENTORY',
        shortLabel: 'Softwares',
        detail: 'Licences, renewals and software packages',
        defaultGl: '2200600003',
        cssKey: 'softwares'
    },
    {
        key: 'spares',
        label: 'SPARES & PARTS INVENTORY',
        shortLabel: 'Spares & Parts',
        detail: 'Laptop/printer rollers, RJ45, boards and spare parts',
        defaultGl: '2201900002',
        cssKey: 'spares'
    },
    {
        key: 'ict',
        label: 'ICT EQUIPMENT INVENTORY',
        shortLabel: 'ICT Equipment',
        detail: 'Laptops, desktops, tablets, printers, projectors, smartboards',
        defaultGl: '3112210001',
        cssKey: 'ict'
    },
    {
        key: 'maintenance',
        label: 'MAINTENANCE & SERVICES INVENTORY',
        shortLabel: 'Maintenance & Services',
        detail: 'Maintenance kits, serviceable equipment and related stock',
        defaultGl: '220200002',
        cssKey: 'maintenance'
    }
];

/**
 * Standalone inventory tabs (day-to-day stock ledgers).
 * sourceKeys = catalog section keys; itemFilter narrows items within those sections.
 */
const STANDALONE_INVENTORY_LEDGERS = [
    {
        key: 'inv-toner',
        label: 'Toner',
        fullLabel: 'Toner Inventory',
        parentKey: 'zoff',
        defaultGl: '6122100009',
        detail: 'Toners, ink cartridges and printheads',
        sourceKeys: ['consumables-toners'],
        itemFilter: null
    },
    {
        key: 'inv-usb',
        label: 'USB Memory Stick',
        fullLabel: 'USB Memory Stick Inventory',
        parentKey: 'zoff',
        defaultGl: '6122100009',
        detail: 'Flash sticks / USB memory sticks',
        sourceKeys: ['consumables-media'],
        itemFilter: /usb|flash|memory\s*stick|pen\s*drive|thumb\s*drive/i
    },
    {
        key: 'inv-external-hdd',
        label: 'External Hard Drives',
        fullLabel: 'External Hard Drive Inventory',
        parentKey: 'zoff',
        defaultGl: '6122100009',
        detail: 'External HDD / portable storage',
        sourceKeys: ['consumables-media'],
        itemFilter: /external|hdd|hard\s*drive|portable\s*disk/i
    },
    {
        key: 'inv-softwares',
        label: 'Softwares',
        fullLabel: 'SOFTWARES INVENTORY',
        parentKey: 'softwares',
        defaultGl: '2200600003',
        detail: 'Software licences and renewals',
        sourceKeys: ['software-licences'],
        itemFilter: null
    },
    {
        key: 'inv-spares',
        label: 'Spares',
        fullLabel: 'SPARES & PARTS INVENTORY',
        parentKey: 'spares',
        defaultGl: '2201900002',
        detail: 'Spare parts and repair components',
        sourceKeys: ['spares-parts'],
        itemFilter: null
    },
    {
        key: 'inv-maintenance',
        label: 'Maintenance & Services',
        fullLabel: 'MAINTENANCE & SERVICES INVENTORY',
        parentKey: 'maintenance',
        defaultGl: '220200002',
        detail: 'Maintenance equipment and service stock',
        sourceKeys: ['maintenance-equipment'],
        itemFilter: null
    },
    {
        key: 'inv-laptops',
        label: 'Laptops',
        fullLabel: 'Laptops Inventory',
        parentKey: 'ict',
        defaultGl: '3112210001',
        detail: 'Laptop / notebook computers',
        sourceKeys: ['ict-equipment'],
        itemFilter: /laptop|notebook|elitebook|latitude|thinkpad|macbook|probook|vostro|aspire|vivobook|toughbook|travelmate|expertbook|surface\s*laptop/i
    },
    {
        key: 'inv-desktops',
        label: 'Desktop Computers',
        fullLabel: 'Desktop Computers Inventory',
        parentKey: 'ict',
        defaultGl: '3112210001',
        detail: 'Desktop PCs and workstations',
        sourceKeys: ['ict-equipment'],
        itemFilter: /desktop|optiplex|prodesk|elite\s*desk|thinkcentre|precision|aio|all[\s-]?in[\s-]?one|tower|workstation/i
    },
    {
        key: 'inv-tablets',
        label: 'Tablets',
        fullLabel: 'Tablets Inventory',
        parentKey: 'ict',
        defaultGl: '3112210001',
        detail: 'Tablets and 2-in-1 devices',
        sourceKeys: ['ict-equipment'],
        itemFilter: /tablet|ipad|galaxy\s*tab|surface\s*pro|toughbook\s*g/i
    },
    {
        key: 'inv-printers',
        label: 'Printers',
        fullLabel: 'Printers Inventory',
        parentKey: 'ict',
        defaultGl: '3112210001',
        detail: 'Printers and MFPs',
        sourceKeys: ['ict-equipment'],
        itemFilter: /printer|mfp|multifunction|laserjet|officejet|ecoTank|imageclass|brother|epson|canon/i
    },
    {
        key: 'inv-projectors',
        label: 'Projectors',
        fullLabel: 'Projectors Inventory',
        parentKey: 'ict',
        defaultGl: '3112210001',
        detail: 'Projectors and presentation displays',
        sourceKeys: ['ict-equipment'],
        itemFilter: /projector|beamer|epson\s*eb|benq|viewsonic/i
    },
    {
        key: 'inv-smartboards',
        label: 'Interactive / Smartboard',
        fullLabel: 'Interactive / Smartboard Inventory',
        parentKey: 'ict',
        defaultGl: '3112210001',
        detail: 'Interactive boards and smart classroom displays',
        sourceKeys: ['ict-equipment'],
        itemFilter: /smart\s*board|smartboard|interactive|promethean|clevertouch|viewboard|ifpd/i
    }
];

function ensureCustomInventoryLedgers() {
    if (!appState) return [];
    if (!Array.isArray(appState.customInventoryLedgers)) {
        appState.customInventoryLedgers = [];
    }
    return appState.customInventoryLedgers;
}

function getBuiltinStandaloneLedgers() {
    return STANDALONE_INVENTORY_LEDGERS.slice();
}

function getAllInventoryLedgers() {
    const custom = ensureCustomInventoryLedgers().map((c) => ({
        key: c.key,
        label: c.label,
        fullLabel: c.fullLabel || c.label,
        parentKey: c.parentKey || 'custom',
        defaultGl: c.defaultGl || '',
        detail: c.detail || 'Custom inventory ledger',
        sourceKeys: Array.isArray(c.sourceKeys) ? c.sourceKeys : [],
        itemFilter: c.itemFilterPattern ? new RegExp(c.itemFilterPattern, 'i') : null,
        custom: true
    }));
    return [...getBuiltinStandaloneLedgers(), ...custom];
}

function getInventoryLedgerByKey(key) {
    return getAllInventoryLedgers().find((l) => l.key === key) || null;
}

function getParentInventoryLedger(key) {
    return INVENTORY_PARENT_LEDGERS.find((p) => p.key === key) || null;
}

function getStandaloneLedgersForParent(parentKey) {
    return getAllInventoryLedgers().filter((l) => l.parentKey === parentKey);
}

/** Rebuild voucher inventory tabs from standalone ledgers (stock ≠ GL). */
function rebuildVoucherInventoryCategoriesFromLedgers() {
    const ledgers = getAllInventoryLedgers();
    VOUCHER_INVENTORY_CATEGORIES = ledgers.map((led) => ({
        key: led.key,
        label: led.label,
        fullLabel: led.fullLabel || led.label,
        detail: led.detail,
        gl: led.defaultGl || '',
        parentKey: led.parentKey,
        sourceKeys: led.sourceKeys || [],
        itemFilter: led.itemFilter || null,
        custom: !!led.custom
    }));
    return VOUCHER_INVENTORY_CATEGORIES;
}

function resolveCatalogItemsForLedger(ledger) {
    if (!ledger) return [];
    const sourceKeys = ledger.sourceKeys?.length
        ? ledger.sourceKeys
        : (ledger.key ? [ledger.key] : []);
    let items = [];
    sourceKeys.forEach((sectionKey) => {
        const section = (typeof getStoresCatalogSections === 'function' ? getStoresCatalogSections() : [])
            .find((s) => s.key === sectionKey);
        if (!section) return;
        (section.items || []).forEach((item) => {
            items.push({
                ...item,
                category: ledger.key,
                gl: ledger.defaultGl || section.gl,
                sectionLabel: ledger.fullLabel || ledger.label,
                sourceCategory: section.key
            });
        });
    });

    // User-added catalog items under this ledger / its source sections
    const customPool = typeof ensureCustomCatalogItems === 'function' ? ensureCustomCatalogItems() : [];
    customPool.forEach((item) => {
        const matchesLedger = item.category === ledger.key
            || (item.sourceCategory && sourceKeys.includes(item.sourceCategory));
        if (!matchesLedger) return;
        if (items.some((i) => i.id === item.id || String(i.name).toLowerCase() === String(item.name).toLowerCase())) return;
        items.push({
            ...item,
            category: ledger.key,
            gl: item.gl || ledger.defaultGl || '',
            sectionLabel: ledger.fullLabel || ledger.label,
            sourceCategory: item.sourceCategory || ledger.key,
            custom: true
        });
    });

    const filter = ledger.itemFilter;
    if (filter) {
        items = items.filter((item) => filter.test(String(item.name || '')));
    }

    if (typeof isSoftwareCatalogCategory === 'function' && isSoftwareCatalogCategory(ledger.key)) {
        items = (typeof sortCatalogItemsAlphabetically === 'function'
            ? sortCatalogItemsAlphabetically(items)
            : items).map((item) =>
            typeof annotateCatalogItemUseNature === 'function' ? annotateCatalogItemUseNature(item) : item
        );
    } else if (typeof sortCatalogItemsAlphabetically === 'function') {
        items = sortCatalogItemsAlphabetically(items);
    }

    return items;
}

function suggestInventoryLedgerKey(itemName) {
    const t = String(itemName || '').trim();
    if (!t) return null;
    const ledgers = getAllInventoryLedgers();
    for (const led of ledgers) {
        if (led.itemFilter && led.itemFilter.test(t)) return led.key;
    }
    // Fallbacks by keyword when no specific filter matched
    const lower = t.toLowerCase();
    if (/\b(toner|cartridge|ink|printhead)\b/.test(lower)) return 'inv-toner';
    if (/\b(usb|flash|memory\s*stick|pen\s*drive)\b/.test(lower)) return 'inv-usb';
    if (/\b(external|hdd|hard\s*drive)\b/.test(lower)) return 'inv-external-hdd';
    if (/\b(software|licence|license|windows|office|kaspersky)\b/.test(lower)) return 'inv-softwares';
    if (/\b(motherboard|ssd|ram|ddr|fuser|roller|spare)\b/.test(lower)) return 'inv-spares';
    if (/\b(maintenance|photocopier|reballing)\b/.test(lower)) return 'inv-maintenance';
    if (/\b(laptop|notebook|elitebook|latitude|thinkpad)\b/.test(lower)) return 'inv-laptops';
    if (/\b(desktop|optiplex|prodesk)\b/.test(lower)) return 'inv-desktops';
    if (/\b(tablet|ipad|galaxy\s*tab)\b/.test(lower)) return 'inv-tablets';
    if (/\b(printer|mfp|laserjet)\b/.test(lower)) return 'inv-printers';
    if (/\b(projector)\b/.test(lower)) return 'inv-projectors';
    if (/\b(smart\s*board|interactive)\b/.test(lower)) return 'inv-smartboards';
    return ledgers[0]?.key || null;
}

function addCustomInventoryLedger({ label, detail, parentKey, defaultGl, itemFilterPattern } = {}) {
    const name = String(label || '').trim();
    if (!name) {
        showToast('Enter a name for the inventory ledger.', 'error');
        return null;
    }
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'ledger';
    const key = `inv-custom-${slug}-${Date.now().toString(36).slice(-4)}`;
    const parent = parentKey && getParentInventoryLedger(parentKey) ? parentKey : 'custom';
    const entry = {
        key,
        label: name,
        fullLabel: name,
        detail: String(detail || 'Custom inventory ledger').trim(),
        parentKey: parent,
        defaultGl: String(defaultGl || '').trim(),
        sourceKeys: [],
        itemFilterPattern: String(itemFilterPattern || '').trim() || ''
    };
    ensureCustomInventoryLedgers().push(entry);
    rebuildVoucherInventoryCategoriesFromLedgers();
    if (typeof saveState === 'function') saveState();
    if (typeof renderVoucherInventoryTables === 'function') {
        const host = document.getElementById('voucherInventorySection');
        if (host) host.dataset.built = '0';
        renderVoucherInventoryTables();
    }
    if (typeof renderInventoryDashboard === 'function') renderInventoryDashboard();
    showToast(`Inventory ledger “${name}” added.`);
    return entry;
}

function openAddInventoryLedgerModal() {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;

    const modal = document.getElementById('stockTxnModal');
    const title = document.getElementById('stockTxnModalTitle');
    const body = document.getElementById('stockTxnModalBody');
    const confirmBtn = document.getElementById('stockTxnModalConfirm');
    if (!modal || !title || !body || !confirmBtn) {
        const label = prompt('New inventory ledger name:');
        if (label) addCustomInventoryLedger({ label });
        return;
    }

    title.textContent = 'Add Inventory Ledger';
    confirmBtn.textContent = 'Create Ledger';
    confirmBtn.dataset.mode = 'add-inventory-ledger';

    const parentOpts = [
        ...INVENTORY_PARENT_LEDGERS.map((p) => `<option value="${p.key}">${invLedgerEscape(p.shortLabel || p.label)}</option>`),
        '<option value="custom">Custom (standalone)</option>'
    ].join('');

    const glOpts = typeof buildGlOptionsHtml === 'function'
        ? buildGlOptionsHtml('')
        : '<option value="">— Optional charge GL —</option>';

    body.innerHTML = `
        <p class="modal-help">
            Create a standalone inventory ledger for day-to-day stock (Form 1033 receive/issue).
            This does <strong>not</strong> create a GL budget account — procurement funding stays in GL Portfolio.
        </p>
        <div class="form-group">
            <label class="form-label">Ledger name</label>
            <input type="text" class="form-control" id="newInvLedgerLabel" placeholder="e.g. Network Switches Inventory">
        </div>
        <div class="form-group">
            <label class="form-label">Description</label>
            <input type="text" class="form-control" id="newInvLedgerDetail" placeholder="What stock does this ledger hold?">
        </div>
        <div class="form-row">
            <div class="form-col">
                <label class="form-label">Parent family</label>
                <select class="form-control" id="newInvLedgerParent">${parentOpts}</select>
            </div>
            <div class="form-col">
                <label class="form-label">Optional default GL (reporting only)</label>
                <select class="form-control" id="newInvLedgerGl"><option value="">— None —</option>${glOpts}</select>
            </div>
        </div>
        <div class="form-group">
            <label class="form-label">Optional name filter (regex)</label>
            <input type="text" class="form-control" id="newInvLedgerFilter" placeholder="e.g. switch|router">
        </div>
    `;

    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
    document.getElementById('newInvLedgerLabel')?.focus();
}

function confirmAddInventoryLedgerFromModal() {
    const label = document.getElementById('newInvLedgerLabel')?.value || '';
    const detail = document.getElementById('newInvLedgerDetail')?.value || '';
    const parentKey = document.getElementById('newInvLedgerParent')?.value || 'custom';
    const defaultGl = document.getElementById('newInvLedgerGl')?.value || '';
    const itemFilterPattern = document.getElementById('newInvLedgerFilter')?.value || '';
    const created = addCustomInventoryLedger({ label, detail, parentKey, defaultGl, itemFilterPattern });
    if (created && typeof closeStockTxnModal === 'function') closeStockTxnModal();
    return created;
}

function buildInventoryLedgerOptionsHtml(selected) {
    return getAllInventoryLedgers().map((led) => {
        const sel = led.key === selected ? ' selected' : '';
        return `<option value="${led.key}"${sel}>${invLedgerEscape(led.fullLabel || led.label)}</option>`;
    }).join('');
}

function aggregateParentLedgerStock(parentKey) {
    const children = getStandaloneLedgersForParent(parentKey);
    let opening = 0;
    let receipts = 0;
    let issues = 0;
    children.forEach((led) => {
        if (typeof getCategoryStockSummary !== 'function') return;
        const s = getCategoryStockSummary(led.key);
        opening += Number(s.opening) || 0;
        receipts += Number(s.received) || 0;
        issues += Number(s.issued) || 0;
    });
    return {
        opening,
        receipts,
        issues,
        onHand: opening + receipts - issues,
        childCount: children.length
    };
}

function openInventoryLedgerView(ledgerKey) {
    const led = getInventoryLedgerByKey(ledgerKey) || getParentInventoryLedger(ledgerKey);
    const tabKey = getInventoryLedgerByKey(ledgerKey)?.key
        || getStandaloneLedgersForParent(ledgerKey)[0]?.key
        || ledgerKey;

    if (typeof navigateToModule === 'function') {
        navigateToModule('voucher-module');
    }

    setTimeout(() => {
        if (typeof renderVoucherInventoryTables === 'function') renderVoucherInventoryTables();
        const host = document.getElementById('voucherInventorySection');
        const tab = host?.querySelector(`.voucher-inv-tab[data-inv-tab="${tabKey}"]`);
        if (tab) tab.click();
        host?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (led && typeof showToast === 'function') {
            showToast(`Opened ${led.fullLabel || led.label || led.shortLabel} inventory ledger.`, 'info');
        }
    }, 80);
}

/* ——— Form 1033 → inventory stock movements ——— */

function getZnaQ1033LineItemsFromDom() {
    const rows = [...document.querySelectorAll('#zna-q-1033-table-body tr')];
    return rows.map((tr, idx) => {
        const cells = tr.querySelectorAll('td input');
        return {
            index: idx + 1,
            partNo: cells[0]?.value?.trim() || '',
            designation: cells[1]?.value?.trim() || '',
            qty: parseFloat(String(cells[2]?.value || '').replace(/[^0-9.-]/g, '')) || 0,
            marks: cells[3]?.value?.trim() || '',
            balancePosting: cells[4]?.value?.trim() || '',
            location: cells[5]?.value?.trim() || ''
        };
    }).filter((r) => r.designation || r.qty > 0);
}

function postZnaQ1033ToInventory() {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;
    if (typeof postStockTransaction !== 'function') {
        showToast('Stores inventory posting is not available.', 'error');
        return;
    }

    const movement = document.getElementById('q1033MovementType')?.value || 'receipt';
    const isReceipt = movement === 'receipt';
    const type = isReceipt ? 'receipt' : 'issue';
    const ledgerOverride = document.getElementById('q1033InventoryLedger')?.value || '';
    const lines = getZnaQ1033LineItemsFromDom();

    if (!lines.length) {
        showToast('Add at least one line with a designation and quantity.', 'error');
        return;
    }

    const voucherNo = isReceipt
        ? (document.getElementById('q1033ReceiptVoucherNo')?.value || '').trim()
        : (document.getElementById('q1033IssueVoucherNo')?.value || '').trim();
    const date = isReceipt
        ? (document.getElementById('q1033ReceiptDate')?.value || '')
        : (document.getElementById('q1033IssueDate')?.value || '');
    const party = isReceipt
        ? (document.getElementById('q1033Consignor')?.value || '').trim()
        : (document.getElementById('q1033IssuedTo')?.value || document.getElementById('q1033Consignee')?.value || '').trim();

    if (!voucherNo) {
        showToast(`Enter the ${isReceipt ? 'RECEIPT' : 'ISSUE'} voucher number before posting to inventory.`, 'error');
        return;
    }

    const ok = confirm(
        `Post Form 1033 as ${isReceipt ? 'RECEIPTS (increase)' : 'ISSUES (decrease)'} to inventory ledgers?\n\n` +
        `Lines: ${lines.length}\nVoucher: ${voucherNo}\n\n` +
        `Form 1033 is the turnaround document for day-to-day stock increases and decreases.`
    );
    if (!ok) return;

    let posted = 0;
    let failed = 0;
    lines.forEach((line) => {
        if (!line.designation || line.qty <= 0) {
            failed += 1;
            return;
        }
        const ledgerKey = ledgerOverride || suggestInventoryLedgerKey(line.designation) || 'inv-toner';
        const led = getInventoryLedgerByKey(ledgerKey);
        const txn = postStockTransaction({
            type,
            category: ledgerKey,
            item: line.designation,
            qty: line.qty,
            description: [line.partNo, line.marks, line.location].filter(Boolean).join(' · '),
            gl: led?.defaultGl || '',
            voucherNo,
            party,
            date: date || undefined,
            allowAdhoc: true,
            source: 'zna-q-1033',
            sourceRef: `${voucherNo}:${line.index}:${line.designation}`
        });
        if (txn) posted += 1;
        else failed += 1;
    });

    if (typeof saveModule === 'function') saveModule('zna-q-1033');
    if (typeof renderVoucherInventoryTables === 'function') renderVoucherInventoryTables();
    if (typeof renderInventoryDashboard === 'function') renderInventoryDashboard();
    if (typeof updateDashboard === 'function') updateDashboard();

    if (posted) {
        showToast(`Form 1033 posted: ${posted} line(s) ${isReceipt ? 'received into' : 'issued from'} inventory.`);
    }
    if (failed) {
        showToast(`${failed} line(s) could not be posted (check qty / on-hand).`, 'error');
    }
}

function initInventoryLedgersUi() {
    rebuildVoucherInventoryCategoriesFromLedgers();

    document.getElementById('btnAddInventoryLedger')?.addEventListener('click', openAddInventoryLedgerModal);
    document.getElementById('btnAddInventoryLedgerDash')?.addEventListener('click', openAddInventoryLedgerModal);
    document.getElementById('btnPost1033Inventory')?.addEventListener('click', postZnaQ1033ToInventory);

    const ledgerSelect = document.getElementById('q1033InventoryLedger');
    if (ledgerSelect) {
        ledgerSelect.innerHTML = `<option value="">Auto-detect from designation</option>${buildInventoryLedgerOptionsHtml('')}`;
        ledgerSelect.dataset.filled = '1';
    }
}

/* Patch catalog item lookup so standalone ledgers resolve items correctly */
(function patchCatalogItemsForLedgers() {
    const original = typeof getCatalogItemsForCategory === 'function' ? getCatalogItemsForCategory : null;
    window.getCatalogItemsForCategory = function getCatalogItemsForCategoryPatched(categoryKey) {
        const ledger = getInventoryLedgerByKey(categoryKey)
            || (VOUCHER_INVENTORY_CATEGORIES || []).find((c) => c.key === categoryKey);
        if (ledger && (ledger.sourceKeys?.length || ledger.itemFilter || ledger.custom)) {
            return resolveCatalogItemsForLedger(ledger);
        }
        if (original) return original(categoryKey);
        return [];
    };
})();
