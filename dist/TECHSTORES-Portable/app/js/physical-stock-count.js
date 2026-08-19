/* physical-stock-count.js — apply handwritten physical stock (2026-07-31) as openings */

const PHYSICAL_STOCK_COUNT_KEY = 'physicalStockCount_2026_07_31';

const PHYSICAL_STOCK_COUNT_2026_07_31 = [
    { id: 'consumables-toners__hp-ce280a-toner', name: 'HP CE280A / 80A toner', qty: 3 },
    { id: 'consumables-toners__hp-cf226a-toner', name: 'HP CF226A / 26A toner', qty: 15 },
    {
        id: 'custom__inv-toner__hp-507a-toner-set',
        name: 'HP 507A toner set',
        qty: 1,
        custom: { category: 'inv-toner', sourceCategory: 'consumables-toners', gl: '2200600002', sectionLabel: 'Toners' }
    },
    { id: 'consumables-toners__hp-ce232a-toner', name: 'HP CE232A / 230A yellow toner', qty: 5 },
    {
        id: 'custom__inv-toner__hp-230a-magenta-toner',
        name: 'HP 230A magenta toner',
        qty: 5,
        custom: { category: 'inv-toner', sourceCategory: 'consumables-toners', gl: '2200600002', sectionLabel: 'Toners' }
    },
    { id: 'consumables-toners__canon-exv54-black', name: 'Canon C-EXV 54 Black', qty: 6 },
    { id: 'consumables-toners__canon-exv54-magenta', name: 'Canon C-EXV 54 Magenta', qty: 9 },
    { id: 'consumables-toners__canon-exv54-cyan', name: 'Canon C-EXV 54 Cyan', qty: 3 },
    { id: 'consumables-toners__canon-exv54-yellow', name: 'Canon C-EXV 54 Yellow', qty: 4 },
    { id: 'consumables-toners__hp-cf289a-toner', name: 'HP CF289A / 289A toner', qty: 3 },
    {
        id: 'custom__inv-usb__sandisk-32g-usb-memory-stick',
        name: 'SanDisk 32G USB Memory stick',
        qty: 27,
        custom: { category: 'inv-usb', sourceCategory: 'consumables-media', gl: '2200600002', sectionLabel: 'USB / Media' }
    },
    {
        id: 'custom__inv-tablets__samsung-galaxy-tab-s11',
        name: 'Samsung Galaxy Tab S11',
        qty: 2,
        custom: { category: 'inv-tablets', sourceCategory: 'ict-equipment', gl: '3112210001', sectionLabel: 'Tablets' }
    }
];

function ensurePhysicalStockCustomItems() {
    if (!appState) return;
    if (!Array.isArray(appState.customCatalogItems)) appState.customCatalogItems = [];
    const list = appState.customCatalogItems;
    const now = new Date().toISOString();
    PHYSICAL_STOCK_COUNT_2026_07_31.forEach((line) => {
        if (!line.custom) return;
        if (list.some((c) => c.id === line.id)) return;
        list.push({
            id: line.id,
            name: line.name,
            category: line.custom.category,
            sourceCategory: line.custom.sourceCategory,
            gl: line.custom.gl,
            sectionLabel: line.custom.sectionLabel,
            custom: true,
            createdAt: now
        });
    });
}

/**
 * Set opening balances from physical count list.
 * @param {{ force?: boolean }} opts — force=true overwrites even if already applied
 * @returns {{ applied: boolean, lines: string[] }}
 */
function applyPhysicalStockCount20260731(opts = {}) {
    if (!appState) return { applied: false, lines: [] };
    const force = !!opts.force;
    const inv = typeof ensureStoresInventory === 'function'
        ? ensureStoresInventory()
        : (appState.storesInventory = appState.storesInventory || { openings: {}, transactions: [] });
    if (!inv.openings) inv.openings = {};

    const already = inv.physicalStockCount_2026_07_31?.applied || inv.stockCountNote?.dated === '2026-07-31';
    if (!force && already) {
        return {
            applied: false,
            lines: inv.physicalStockCount_2026_07_31?.lines || inv.stockCountNote?.lines || []
        };
    }

    ensurePhysicalStockCustomItems();

    const lines = [];
    PHYSICAL_STOCK_COUNT_2026_07_31.forEach((line) => {
        inv.openings[line.id] = Number(line.qty) || 0;
        lines.push(`${line.qty} × ${line.name}`);
    });

    inv.physicalStockCount_2026_07_31 = {
        applied: true,
        appliedAt: new Date().toISOString(),
        source: 'Physical stock list (handwritten)',
        dated: '2026-07-31',
        lines
    };

    if (typeof saveState === 'function') saveState();
    return { applied: true, lines };
}

window.applyPhysicalStockCount20260731 = applyPhysicalStockCount20260731;
window.PHYSICAL_STOCK_COUNT_2026_07_31 = PHYSICAL_STOCK_COUNT_2026_07_31;
