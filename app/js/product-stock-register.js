/* product-stock-register.js — Dashboard List of Inventory + period stock + generated Item IDs */

const PRODUCT_STOCK_PERIODS = [
    { key: 'daily', label: 'Daily' },
    { key: 'weekly', label: 'Weekly' },
    { key: 'monthly', label: 'Monthly' },
    { key: 'quarterly', label: 'Quarterly' },
    { key: 'yearly', label: 'Yearly' },
    { key: 'cumulative', label: 'Cumulative (all time)' }
];

const PRODUCT_CATEGORY_FAMILIES = [
    {
        key: 'consumables',
        label: 'Consumables',
        icon: '../assets/inventory/ink-cartridges.png',
        match: (cat) => /consumable|toner|media|zoff|inv-toner|inv-media/i.test(cat || '')
    },
    {
        key: 'ict',
        label: 'ICT Equipment',
        icon: '../assets/inventory/laptop.png',
        match: (cat) => /ict-equipment|^ict$|inv-ict/i.test(cat || '')
    },
    {
        key: 'spares',
        label: 'Spares & Parts',
        icon: '../assets/inventory/usb.png',
        match: (cat) => /spare|parts|inv-spare/i.test(cat || '')
    },
    {
        key: 'software',
        label: 'Software',
        icon: '../assets/inventory/brands/software-generic.png',
        match: (cat) => /software|licence|license|inv-soft/i.test(cat || '')
    },
    {
        key: 'maintenance',
        label: 'Maintenance',
        icon: '../assets/inventory/printer.png',
        match: (cat) => /maint/i.test(cat || '')
    }
];

/** Type-specific transparent product images (white/solid BG removed). */
const PRODUCT_TYPE_IMAGES = {
    Lap: '../assets/inventory/laptop.png',
    Desk: '../assets/inventory/desktop.png',
    Print: '../assets/inventory/printer.png',
    Ton: '../assets/inventory/ink-cartridges.png',
    Med: '../assets/inventory/usb.png',
    Tab: '../assets/inventory/tablet.png',
    Mon: '../assets/inventory/desktop.png',
    Srv: '../assets/inventory/desktop.png',
    Net: '../assets/inventory/usb.png',
    Spa: '../assets/inventory/usb.png',
    Soft: '../assets/inventory/brands/software-generic.png',
    Maint: '../assets/inventory/printer.png',
    Ict: '../assets/inventory/laptop.png',
    Item: '../assets/inventory/laptop.png'
};

/** Exact catalog item photos (pack shots with white BG removed). */
const PRODUCT_ITEM_IMAGES = {
    'consumables-toners__canon-c-exv42-black': '../assets/inventory/canon-exv42-black.png',
    'consumables-toners__canon-c3025i-waste-toner-cartridges': '../assets/inventory/canon-c3025i.png',
    'consumables-toners__canon-exv54-black': '../assets/inventory/canon-exv54-black.png',
    'consumables-toners__canon-exv54-cyan': '../assets/inventory/canon-exv54-cyan.png',
    'consumables-toners__canon-exv54-magenta': '../assets/inventory/canon-exv54-magenta.png',
    'consumables-toners__canon-exv54-yellow': '../assets/inventory/canon-exv54-yellow.png',
    'consumables-toners__hp-ce230a-toner': '../assets/inventory/hp-ce230a.png',
    'consumables-toners__hp-ce232a-toner': '../assets/inventory/hp-ce232a.png',
    'consumables-toners__hp-ce237a-toner': '../assets/inventory/hp-ce237a.png',
    'consumables-toners__hp-ce255a-toner': '../assets/inventory/hp-ce255a.png',
    'consumables-toners__hp-ce256a-toner': '../assets/inventory/hp-ce256a.png',
    'consumables-toners__hp-ce278a-toner': '../assets/inventory/hp-ce278a.png',
    'consumables-toners__hp-ce280a-toner': '../assets/inventory/hp-ce280a.png',
    'consumables-toners__hp-ce281a-toner': '../assets/inventory/hp-ce281a.png',
    'consumables-toners__hp-ce283a-toner': '../assets/inventory/hp-ce283a.png',
    'consumables-toners__hp-ce285a-toner': '../assets/inventory/hp-ce285a.png',
    'consumables-toners__hp-ce410a-toner-305': '../assets/inventory/hp-ce410a.png',
    'consumables-toners__hp-ce410a-toner-black-410': '../assets/inventory/hp-ce410a.png',
    'consumables-toners__hp-ce411a-toner-305': '../assets/inventory/hp-ce411a.png',
    'consumables-toners__hp-ce411a-toner-cyan-410': '../assets/inventory/hp-ce411a.png',
    'consumables-toners__hp-ce412a-toner-305': '../assets/inventory/hp-ce412a.png',
    'consumables-toners__hp-ce412a-toner-yellow-410': '../assets/inventory/hp-ce412a.png',
    'consumables-toners__hp-ce413a-toner-305': '../assets/inventory/hp-ce413a.png',
    'consumables-toners__hp-ce413a-toner-magenta-410': '../assets/inventory/hp-ce413a.png',
    'consumables-toners__hp-ce505a-toner': '../assets/inventory/hp-ce505a.png',
    'consumables-toners__hp-ce740a-toner-black-307': '../assets/inventory/hp-ce740a.png',
    'consumables-toners__hp-ce741a-toner-cyan-307': '../assets/inventory/hp-ce741a.png',
    'consumables-toners__hp-ce742a-toner-yellow-307': '../assets/inventory/hp-ce742a.png',
    'consumables-toners__hp-ce743a-toner-magenta-307': '../assets/inventory/hp-ce743a.png',
    'consumables-toners__hp-cf130a-toner': '../assets/inventory/hp-cf130a.png',
    'consumables-toners__hp-cf210a-toner-black-131': '../assets/inventory/hp-cf210a.png',
    'consumables-toners__hp-cf211a-toner-cyan-131': '../assets/inventory/hp-cf211a.png',
    'consumables-toners__hp-cf2120a-toner-black-212a': '../assets/inventory/hp-cf2120a.png',
    'consumables-toners__hp-cf2121a-toner-cyan-212a': '../assets/inventory/hp-cf2121a.png',
    'consumables-toners__hp-cf2122a-toner-yellow-212a': '../assets/inventory/hp-cf2122a.png',
    'consumables-toners__hp-cf2123a-toner-magenta-212a': '../assets/inventory/hp-cf2123a.png',
    'consumables-toners__hp-cf212a-toner-yellow-131': '../assets/inventory/hp-cf212a.png',
    'consumables-toners__hp-cf213a-toner-magenta-131': '../assets/inventory/hp-cf213a.png',
    'consumables-toners__hp-cf214a-toner': '../assets/inventory/hp-cf214a.png',
    'consumables-toners__hp-cf226a-toner': '../assets/inventory/hp-cf226a.png',
    'consumables-toners__hp-cf259a-toner': '../assets/inventory/hp-cf259a.png',
    'consumables-toners__hp-cf289a-toner': '../assets/inventory/hp-cf289a.png',
    'consumables-toners__hp-cf325x-toner': '../assets/inventory/hp-cf325x.png',
    'consumables-toners__hp-cf400a-toner-black-201': '../assets/inventory/hp-cf400a.png',
    'consumables-toners__hp-cf401a-toner-cyan-201': '../assets/inventory/hp-cf401a.png',
    'consumables-toners__hp-cf402a-toner-yellow-201': '../assets/inventory/hp-cf402a.png',
    'consumables-toners__hp-cf403a-toner-magenta-201': '../assets/inventory/hp-cf403a.png',
    'consumables-toners__hp-w1104a-104a-toner': '../assets/inventory/hp-w1104a.png',
    'consumables-toners__hp-w2030a-toner-black-415': '../assets/inventory/hp-w2030a.png',
    'consumables-toners__hp-w2031a-toner-cyan-415': '../assets/inventory/hp-w2031a.png',
    'consumables-toners__hp-w2032a-toner-yellow-415': '../assets/inventory/hp-w2032a.png',
    'consumables-toners__hp-w2033a-toner-magenta-415': '../assets/inventory/hp-w2033a.png',
    'consumables-toners__hp-w2070a-117a-black-toner': '../assets/inventory/hp-w2070a-black.png',
    'consumables-toners__hp-w2070a-117a-cyan-toner': '../assets/inventory/hp-w2070a-cyan.png',
    'consumables-toners__hp-w2070a-117a-magenta-toner': '../assets/inventory/hp-w2070a-magenta.png',
    'consumables-toners__hp-w2070a-117a-yellow-toner': '../assets/inventory/hp-w2070a-yellow.png',
    'ict-equipment__apple-imac-24': '../assets/inventory/apple-imac-24.png',
    'ict-equipment__apple-mac-mini-m4': '../assets/inventory/apple-mac-mini-m4.png',
    'ict-equipment__apple-macbook-pro-14': '../assets/inventory/apple-macbook-pro-14.png',
    'ict-equipment__asus-expertbook-b9': '../assets/inventory/asus-expertbook-b9.png',
    'ict-equipment__brother-mfc-l8390cdw': '../assets/inventory/brother-mfc-l8390cdw.png',
    'ict-equipment__canon-imagerunner-advance-dx-c3926i': '../assets/inventory/canon-c3926i.png',
    'ict-equipment__canon-imagerunner-advance-dx-c5840i': '../assets/inventory/canon-c5840i.png',
    'ict-equipment__canon-imagerunner-c3025i': '../assets/inventory/canon-imagerunner-c3025i.png',
    'ict-equipment__dell-latitude-5450': '../assets/inventory/dell-latitude-5450.png',
    'ict-equipment__dell-latitude-7450': '../assets/inventory/dell-latitude-7450.png',
    'ict-equipment__dell-optiplex-7020': '../assets/inventory/dell-optiplex-7020.png',
    'ict-equipment__dell-optiplex-7020-micro': '../assets/inventory/dell-optiplex-7020-micro.png',
    'ict-equipment__dell-precision-3680-tower': '../assets/inventory/dell-precision-3680-tower.png',
    'ict-equipment__epson-workforce-pro-wf-c5890': '../assets/inventory/item-c5890.png',
    'ict-equipment__hp-color-laserjet-enterprise-m554dn': '../assets/inventory/hp-color-laserjet-enterprise-m554dn.png',
    'ict-equipment__hp-designjet-t650': '../assets/inventory/hp-t650.png',
    'ict-equipment__hp-elite-mini-800-g9': '../assets/inventory/hp-elite-mini-800-g9.png',
    'ict-equipment__hp-elitebook-860-g11': '../assets/inventory/hp-elitebook-860-g11.png',
    'ict-equipment__hp-elitebook-x360': '../assets/inventory/hp-x360.png',
    'ict-equipment__hp-elitedesk-800-g9': '../assets/inventory/hp-elitedesk-800-g9.png',
    'ict-equipment__hp-laserjet-enterprise-m507dn': '../assets/inventory/hp-laserjet-enterprise-m507dn.png',
    'ict-equipment__hp-laserjet-enterprise-mfp-m528dn': '../assets/inventory/hp-laserjet-enterprise-mfp-m528dn.png',
    'ict-equipment__hp-omnibook-x-flip-16': '../assets/inventory/hp-omnibook-x-flip-16.png',
    'ict-equipment__hp-prodesk-400-g9': '../assets/inventory/hp-prodesk-400-g9.png',
    'ict-equipment__hp-zbook-firefly': '../assets/inventory/hp-zbook-firefly.png',
    'ict-equipment__hpe-proliant-dl380-gen11': '../assets/inventory/hpe-proliant-dl380-gen11.png',
    'ict-equipment__kyocera-taskalfa-2554ci': '../assets/inventory/kyocera-taskalfa-2554ci.png',
    'ict-equipment__lenovo-thinkcentre-m90a-gen-5-aio': '../assets/inventory/lenovo-thinkcentre-m90a-gen-5-aio.png',
    'ict-equipment__lenovo-thinkcentre-m90q-gen-4': '../assets/inventory/lenovo-thinkcentre-m90q-gen-4.png',
    'ict-equipment__lenovo-thinkpad-t14-gen-5': '../assets/inventory/lenovo-thinkpad-t14-gen-5.png',
    'ict-equipment__lenovo-thinkpad-x1-carbon-gen-12': '../assets/inventory/lenovo-thinkpad-x1-carbon-gen-12.png',
    'ict-equipment__microsoft-surface-laptop-7': '../assets/inventory/microsoft-surface-laptop-7.png',
    'ict-equipment__xerox-altalink-c8155': '../assets/inventory/item-c8155.png',
};

/** Bump when inventory PNGs are regenerated so browsers drop stale 160px cache. */
const PRODUCT_IMAGE_CACHE_VER = '20260818a';

function withProductImageCache(src) {
    if (!src) return src;
    const sep = src.includes('?') ? '&' : '?';
    return `${src}${sep}v=${PRODUCT_IMAGE_CACHE_VER}`;
}

/**
 * Name → brand / product image (most-specific rules first).
 * Hardware brand marks are applied only after toner SKU pack-shot lookup.
 */
const PRODUCT_NAME_IMAGES = [
    // --- Exact / product photos ---
    { re: /\bdl380\b|\bproliant\s*dl380\b|\bhpe\s*proliant\b/i, src: '../assets/inventory/hpe-proliant-dl380-gen11.png' },
    { re: /\blatitude\s*5540\b|\bdell\s*5540\b/i, src: '../assets/inventory/dell-latitude-5540.png' },
    { re: /\bc3025i\b|\bimagerunner\s*c3025/i, src: '../assets/inventory/canon-imagerunner-c3025i.png' },
    { re: /\bomnibook\s*x\s*flip\b|\bomnibook\s*flip\b/i, src: '../assets/inventory/hp-omnibook-x-flip-16.png' },

    // --- Product / kind photos (name-driven, real-time on list refresh) ---
    { re: /\bups\b|battery\s*kits?|\bbatter(?:y|ies)\b/i, src: '../assets/inventory/ups-battery.png' },
    { re: /\bsamsung\b/i, src: '../assets/inventory/brands/samsung.png' },
    { re: /\b(tablets?|ipads?|galaxy\s*tab|\btab\s*[sabfe]?\s*\d)/i, src: '../assets/inventory/tablet.png' },
    { re: /\bsandisk\b/i, src: '../assets/inventory/brands/sandisk.png' },
    { re: /\bkingston\b/i, src: '../assets/inventory/brands/kingston.png' },
    { re: /\btranscend\b/i, src: '../assets/inventory/brands/transcend.png' },
    { re: /\b(usb|flash\s*drive|memory\s*stick)\b/i, src: '../assets/inventory/usb.png' },

    // --- Software brands ---
    { re: /\bclaude\b/i, src: '../assets/inventory/software-claude-mark.png' },
    { re: /\bchatgpt\b|\bopenai\b/i, src: '../assets/inventory/brands/chatgpt.png' },
    { re: /\bcursor\b/i, src: '../assets/inventory/brands/cursor.png' },
    { re: /\bcanva\b/i, src: '../assets/inventory/brands/canva.png' },
    { re: /\bgithub\s*copilot\b|\bgithub\b/i, src: '../assets/inventory/brands/github.png' },
    { re: /\bmicrosoft\s*copilot\b|\bcopilot\b/i, src: '../assets/inventory/brands/copilot.png' },
    { re: /\bgoogle\b|\bgemini\b/i, src: '../assets/inventory/brands/google.png' },
    { re: /\bmicrosoft\s*365\b|\boffice\s*365\b|\bm365\b|365\s*apps/i, src: '../assets/inventory/brands/microsoft-365.png' },
    { re: /\bmicrosoft\s*office\b|\boffice\s*20/i, src: '../assets/inventory/brands/microsoft-365.png' },
    { re: /\bwindows\s*1[01]\b|\bwindows\b/i, src: '../assets/inventory/brands/windows.png' },
    { re: /\bsql\s*server\b/i, src: '../assets/inventory/brands/sql-server.png' },
    { re: /\bvisual\s*studio\b/i, src: '../assets/inventory/brands/visual-studio.png' },
    { re: /\bmicrosoft\s*(server|exchange)|exchange\s*server/i, src: '../assets/inventory/brands/microsoft.png' },
    { re: /\bmicrosoft\b|\bsurface\b/i, src: '../assets/inventory/brands/microsoft.png' },
    { re: /\badobe\b|\bphotoshop\b|\billustrator\b|\bindesign\b/i, src: '../assets/inventory/brands/adobe.png' },
    { re: /\bkaspersky\b/i, src: '../assets/inventory/brands/kaspersky.png' },
    { re: /\bvmware\b|\bfusion\b/i, src: '../assets/inventory/brands/vmware.png' },
    { re: /\boracle\b/i, src: '../assets/inventory/brands/oracle.png' },
    { re: /\bmysql\b/i, src: '../assets/inventory/brands/mysql.png' },
    { re: /\bteamviewer\b/i, src: '../assets/inventory/brands/teamviewer.png' },
    { re: /\bcorel\b/i, src: '../assets/inventory/brands/corel.png' },
    { re: /\bapple\b|\bmac\s*voucher\b|\bmacos\b|\bfinal\s*cut\b/i, src: '../assets/inventory/brands/apple.png' }
];

/** Hardware brand marks when no pack shot / SKU image exists. */
const PRODUCT_BRAND_IMAGES = [
    { re: /\bmacbook\b|\bimac\b|\bmac\s*mini\b|\bmac\s*studio\b/i, src: '../assets/inventory/brands/apple.png' },
    { re: /\bhp\b|\bhewlett|omnibook|elitebook|probook|elitedesk|prodesk|zbook|laserjet|designjet|proliant/i, src: '../assets/inventory/brands/hp.png' },
    { re: /\bdell\b|\blatitude\b|\boptiplex\b|\bpoweredge\b|\bvostro\b|\bxps\b|\bprecision\b/i, src: '../assets/inventory/brands/dell.png' },
    { re: /\blenovo\b|\bthinkpad\b|\bthinkcentre\b|\bthinkstation\b|\blegion\b|\bthinksystem\b/i, src: '../assets/inventory/brands/lenovo.png' },
    { re: /\bsamsung\b|\bgalaxy\b/i, src: '../assets/inventory/brands/samsung.png' },
    { re: /\bsandisk\b/i, src: '../assets/inventory/brands/sandisk.png' },
    { re: /\bkingston\b/i, src: '../assets/inventory/brands/kingston.png' },
    { re: /\btranscend\b/i, src: '../assets/inventory/brands/transcend.png' },
    { re: /\bcanon\b|\bimagerunner\b|\bexv\b/i, src: '../assets/inventory/brands/canon.png' },
    { re: /\bepson\b|\becotank\b/i, src: '../assets/inventory/brands/epson.png' },
    { re: /\bbrother\b/i, src: '../assets/inventory/brands/brother.png' },
    { re: /\bxerox\b/i, src: '../assets/inventory/brands/xerox.png' },
    { re: /\bcisco\b|\bcatalyst\b|\bmeraki\b|\bisr\b/i, src: '../assets/inventory/brands/cisco.png' },
    { re: /\baruba\b/i, src: '../assets/inventory/brands/aruba.png' },
    { re: /\bubiquiti\b|\bunifi\b/i, src: '../assets/inventory/brands/ubiquiti.png' },
    { re: /\bfortinet\b|\bfortigate\b/i, src: '../assets/inventory/brands/fortinet.png' }
];

const FEATURED_INVENTORY_ITEM_IDS = [
    'consumables-toners__hp-cf289a-toner',
    'consumables-toners__hp-ce232a-toner',
    'consumables-toners__canon-exv54-yellow'
];

function resolveProductStockImage(itemName, categoryKey, familyKey, itemId) {
    const id = String(itemId || '');
    if (id && PRODUCT_ITEM_IMAGES[id]) return withProductImageCache(PRODUCT_ITEM_IMAGES[id]);
    const name = String(itemName || '');
    for (const rule of PRODUCT_NAME_IMAGES) {
        if (rule.re.test(name)) return withProductImageCache(rule.src);
    }
    const skuMatch = name.match(/\b([A-Z]{1,2}\d{3,4}[A-Z]?X?)\b/i)
        || name.match(/\b(?:C-?EXV|EXV)\s*(\d+)\b/i);
    if (skuMatch) {
        const token = (skuMatch[1] || skuMatch[0]).replace(/\s+/g, '').toLowerCase();
        const hit = Object.entries(PRODUCT_ITEM_IMAGES).find(([key, path]) =>
            key.toLowerCase().includes(token) || path.toLowerCase().includes(token)
        );
        if (hit) {
            const color = (name.match(/\b(black|cyan|magenta|yellow)\b/i) || [])[1];
            if (color) {
                const colored = Object.entries(PRODUCT_ITEM_IMAGES).find(([key, path]) =>
                    (key.toLowerCase().includes(token) || path.toLowerCase().includes(token))
                    && (key.toLowerCase().includes(color.toLowerCase()) || path.toLowerCase().includes(color.toLowerCase()))
                );
                if (colored) return withProductImageCache(colored[1]);
            }
            return withProductImageCache(hit[1]);
        }
    }
    for (const rule of PRODUCT_BRAND_IMAGES) {
        if (rule.re.test(name)) return withProductImageCache(rule.src);
    }
    const kind = classifyInventoryItemKind(itemName, categoryKey);
    if (PRODUCT_TYPE_IMAGES[kind.typeCode]) return withProductImageCache(PRODUCT_TYPE_IMAGES[kind.typeCode]);
    const fam = PRODUCT_CATEGORY_FAMILIES.find((f) => f.key === (familyKey || kind.familyKey));
    return withProductImageCache(fam?.icon || '../assets/inventory/laptop.png');
}

/** Brand codes used in generated Item IDs (HPLap000001, DELDesk000001, …). */
const ITEM_ID_BRANDS = [
    { re: /\bhewlett[-\s]?packard\b|\bhp\b/i, code: 'HP' },
    { re: /\bdell\b/i, code: 'DEL' },
    { re: /\blenovo\b/i, code: 'LEN' },
    { re: /\bsamsung\b/i, code: 'SAM' },
    { re: /\bapple\b|\bmacbook\b|\bimac\b/i, code: 'APL' },
    { re: /\balienware\b/i, code: 'ALW' },
    { re: /\bcanon\b/i, code: 'CAN' },
    { re: /\bepson\b/i, code: 'EPS' },
    { re: /\bbrother\b/i, code: 'BRO' },
    { re: /\bcisco\b/i, code: 'CIS' },
    { re: /\bmicrosoft\b|\bsurface\b/i, code: 'MS' },
    { re: /\basus\b/i, code: 'ASU' },
    { re: /\bacer\b/i, code: 'ACE' },
    { re: /\btoshiba\b/i, code: 'TOS' },
    { re: /\bkonic[a]?\s*minolta\b/i, code: 'KON' },
    { re: /\bxerox\b/i, code: 'XER' },
    { re: /\bkyocera\b/i, code: 'KYO' },
    { re: /\brigoh?\b/i, code: 'RIC' },
    { re: /\bsandisk\b/i, code: 'SNK' },
    { re: /\bseagate\b/i, code: 'SEA' },
    { re: /\bwestern\s*digital\b|\bwd\b/i, code: 'WD' },
    { re: /\bintel\b/i, code: 'INT' },
    { re: /\bamd\b/i, code: 'AMD' }
];

let productStockState = {
    period: 'cumulative',
    focusDate: '',
    category: 'all',
    search: '',
    pageSize: 10,
    page: 1,
    sortKey: 'displayItemId',
    sortDir: 'asc'
};

let productStockCodesDirty = false;

function psrEscape(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function psrTodayIso() {
    if (typeof todayIsoLocal === 'function') return todayIsoLocal();
    if (typeof todayIsoDate === 'function') return todayIsoDate();
    return new Date().toISOString().slice(0, 10);
}

function psrParseIsoDate(iso) {
    const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return null;
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

function psrFormatIso(d) {
    if (!(d instanceof Date) || Number.isNaN(d.getTime())) return '';
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${mo}-${day}`;
}

function ensureItemDisplayCodes() {
    const inv = typeof ensureStoresInventory === 'function'
        ? ensureStoresInventory()
        : (appState?.storesInventory || {});
    if (!inv.itemDisplayCodes || typeof inv.itemDisplayCodes !== 'object') {
        inv.itemDisplayCodes = {};
    }
    return inv.itemDisplayCodes;
}

/**
 * Classify item type from the specific name.
 * Laptops, desktops and printers are ICT Equipment (not spares),
 * unless the name is clearly a spare/component (LCD, motherboard…).
 * UPS / battery kits stay Spares; Galaxy Tab / iPad are Tablets (ICT).
 */
function classifyInventoryItemKind(itemName, categoryKey) {
    const name = String(itemName || '').trim();
    const t = name.toLowerCase();
    const cat = String(categoryKey || '');

    // Tablets before spares/laptops — "Galaxy Tab S11", "iPad", "Tablet PC"
    if (/\b(tablets?|ipads?)\b/i.test(t)
        || /\bgalaxy\s*tab\b/i.test(t)
        || /\btab\s*[sabfe]?\s*\d/i.test(t)) {
        return { typeCode: 'Tab', familyKey: 'ict', categoryLabel: 'ICT Equipment' };
    }

    // UPS / battery kits (spares) — before generic "battery" laptop-component path needs care:
    // "laptop battery" = spare; "UPS battery kits" = spare; whole UPS unit can be ICT Maint/Other
    if (/\bups\b/i.test(t) || /\bbattery\s*kits?\b/i.test(t)) {
        return { typeCode: 'Spa', familyKey: 'spares', categoryLabel: 'Spares & Parts' };
    }

    const spareComponent = /\b(motherboard|lcd|cooling\s*fan|processor\s*fan|ram\b|hdd\b|ssd\b|adapter|cable|roller|fuser|drum unit|print\s*head|printhead|laptop\s*batter(?:y|ies)|batter(?:y|ies)\b)\b/i.test(t)
        || (/spares-parts|inv-spare/i.test(cat) && !/\b(laptops?|desktops?|printers?|tablets?)\b/i.test(t));

    if (spareComponent && !/\b(hp|dell|lenovo|apple)?\s*(desktop computers?|laptops?|notebooks?)\b/i.test(t)) {
        if (/toner|ink|cartridge|printhead|print\s*head/i.test(t) || /consumable|toner/i.test(cat)) {
            return { typeCode: 'Ton', familyKey: 'consumables', categoryLabel: 'Consumables' };
        }
        return { typeCode: 'Spa', familyKey: 'spares', categoryLabel: 'Spares & Parts' };
    }

    // Whole units — always ICT Equipment
    if (/\b(laptops?|notebooks?|macbooks?|omnibook|latitude|precision|thinkpad|elitebook|probook|inspiron|vostro|xps|macbook|surface\s*laptop|galaxy\s*book|travelmate|expertbook|vivobook|zbook|firefly)\b/i.test(t)) {
        return { typeCode: 'Lap', familyKey: 'ict', categoryLabel: 'ICT Equipment' };
    }
    if (/\b(desktops?|workstations?|desktop computers?|elitedesk|prodesk|optiplex|thinkcentre)\b/i.test(t)) {
        return { typeCode: 'Desk', familyKey: 'ict', categoryLabel: 'ICT Equipment' };
    }
    if (/\b(printers?|plotters?|designjet|mfp|multifunction|laserjet|imagerunner)\b/i.test(t)) {
        return { typeCode: 'Print', familyKey: 'ict', categoryLabel: 'ICT Equipment' };
    }
    if (/\b(monitors?|displays?)\b/i.test(t) && !/laptop|tablet/i.test(t)) {
        return { typeCode: 'Mon', familyKey: 'ict', categoryLabel: 'ICT Equipment' };
    }
    if (/\b(servers?|proliant|poweredge|thinksystem)\b/i.test(t)) {
        return { typeCode: 'Srv', familyKey: 'ict', categoryLabel: 'ICT Equipment' };
    }
    if (/\b(switch|router|firewall|access\s*point|catalyst|meraki)\b/i.test(t)) {
        return { typeCode: 'Net', familyKey: 'ict', categoryLabel: 'ICT Equipment' };
    }
    if (/\bsurface\s*pro\b/i.test(t)) {
        return { typeCode: 'Tab', familyKey: 'ict', categoryLabel: 'ICT Equipment' };
    }

    if (/toner|ink|cartridge|printhead|print\s*head/i.test(t) || /consumables-toners|inv-toner/i.test(cat)) {
        return { typeCode: 'Ton', familyKey: 'consumables', categoryLabel: 'Consumables' };
    }
    if (/usb|flash|memory stick|sandisk|kingston|transcend|external\s*hdd|hard\s*disk|media/i.test(t) || /consumables-media|inv-media/i.test(cat)) {
        return { typeCode: 'Med', familyKey: 'consumables', categoryLabel: 'Consumables' };
    }
    if (/software|licence|license/i.test(t) || /software/i.test(cat)) {
        return { typeCode: 'Soft', familyKey: 'software', categoryLabel: 'Software' };
    }
    if (/maint/i.test(cat)) {
        return { typeCode: 'Maint', familyKey: 'maintenance', categoryLabel: 'Maintenance' };
    }
    if (/spare|parts/i.test(cat)) {
        return { typeCode: 'Spa', familyKey: 'spares', categoryLabel: 'Spares & Parts' };
    }
    if (/ict/i.test(cat)) {
        return { typeCode: 'Ict', familyKey: 'ict', categoryLabel: 'ICT Equipment' };
    }
    return { typeCode: 'Item', familyKey: 'other', categoryLabel: 'Other' };
}

function deriveItemBrandCode(itemName) {
    const name = String(itemName || '');
    for (const brand of ITEM_ID_BRANDS) {
        if (brand.re.test(name)) return brand.code;
    }
    // First significant token as fallback (e.g. "Epson" unknown brands)
    const token = name.replace(/[^A-Za-z0-9\s/-]/g, ' ').trim().split(/[\s/-]+/)[0] || 'GEN';
    const clean = token.replace(/[^A-Za-z]/g, '').toUpperCase();
    if (clean.length >= 2) return clean.slice(0, 3);
    return 'GEN';
}

function buildItemIdPrefix(itemName, categoryKey) {
    const brand = deriveItemBrandCode(itemName);
    const kind = classifyInventoryItemKind(itemName, categoryKey);
    return `${brand}${kind.typeCode}`;
}

function nextItemIdSequence(prefix, codesMap) {
    let max = 0;
    const re = new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\d{6})$`, 'i');
    Object.values(codesMap || {}).forEach((code) => {
        const m = String(code || '').match(re);
        if (m) max = Math.max(max, Number(m[1]) || 0);
    });
    return max + 1;
}

/**
 * Stable generated Item ID from the specific item name + category.
 * Examples: HPLap000001, DELLap000001, HPDesk000001, HPTon000001
 */
function getOrAssignDisplayItemId(catalogItemId, itemName, categoryKey) {
    const key = String(catalogItemId || '').trim();
    if (!key) return '';
    const codes = ensureItemDisplayCodes();
    if (codes[key]) return codes[key];

    const prefix = buildItemIdPrefix(itemName || key, categoryKey);
    const seq = nextItemIdSequence(prefix, codes);
    const code = `${prefix}${String(seq).padStart(6, '0')}`;
    codes[key] = code;
    productStockCodesDirty = true;
    return code;
}

function flushProductStockDisplayCodes() {
    if (!productStockCodesDirty) return;
    productStockCodesDirty = false;
    try {
        if (typeof saveState === 'function') saveState();
    } catch (_) { /* ignore */ }
}

function getProductCategoryFamily(categoryKey, itemName) {
    const kind = classifyInventoryItemKind(itemName, categoryKey);
    if (kind.familyKey === 'ict') {
        return PRODUCT_CATEGORY_FAMILIES.find((f) => f.key === 'ict')
            || { key: 'ict', label: 'ICT Equipment', icon: '../assets/nav-icons/ict-accountability-64.png' };
    }
    const cat = String(categoryKey || '');
    return PRODUCT_CATEGORY_FAMILIES.find((f) => f.match(cat))
        || PRODUCT_CATEGORY_FAMILIES.find((f) => f.key === kind.familyKey)
        || { key: kind.familyKey || 'other', label: kind.categoryLabel || 'Other', icon: '../assets/nav-icons/stock-take-64.png', match: () => false };
}

function psrAddDays(iso, days) {
    const d = psrParseIsoDate(iso);
    if (!d) return iso;
    d.setDate(d.getDate() + days);
    return psrFormatIso(d);
}

/** Resolve inclusive date range for a stock period view. */
function resolveProductStockPeriodRange(period, focusDate) {
    const focus = focusDate || productStockState.focusDate || psrTodayIso();
    const d = psrParseIsoDate(focus) || new Date();
    const key = period || productStockState.period || 'cumulative';

    if (key === 'cumulative') {
        return { from: '', to: '', focus, label: 'Cumulative (all time)', period: key };
    }
    if (key === 'daily') {
        return { from: focus, to: focus, focus, label: `Daily — ${focus}`, period: key };
    }
    if (key === 'weekly') {
        const day = d.getDay(); // 0 Sun
        const mondayOffset = day === 0 ? -6 : 1 - day;
        const fromD = new Date(d);
        fromD.setDate(d.getDate() + mondayOffset);
        const toD = new Date(fromD);
        toD.setDate(fromD.getDate() + 6);
        const from = psrFormatIso(fromD);
        const to = psrFormatIso(toD);
        return { from, to, focus, label: `Weekly — ${from} to ${to}`, period: key };
    }
    if (key === 'monthly') {
        const from = psrFormatIso(new Date(d.getFullYear(), d.getMonth(), 1));
        const to = psrFormatIso(new Date(d.getFullYear(), d.getMonth() + 1, 0));
        return { from, to, focus, label: `Monthly — ${from} to ${to}`, period: key };
    }
    if (key === 'quarterly') {
        const q = Math.floor(d.getMonth() / 3);
        const from = psrFormatIso(new Date(d.getFullYear(), q * 3, 1));
        const to = psrFormatIso(new Date(d.getFullYear(), q * 3 + 3, 0));
        return { from, to, focus, label: `Quarterly — ${from} to ${to}`, period: key };
    }
    if (key === 'yearly') {
        const from = psrFormatIso(new Date(d.getFullYear(), 0, 1));
        const to = psrFormatIso(new Date(d.getFullYear(), 11, 31));
        return { from, to, focus, label: `Yearly — ${from} to ${to}`, period: key };
    }
    return { from: '', to: '', focus, label: 'Cumulative (all time)', period: 'cumulative' };
}

function getItemStockSummaryForPeriod(itemId, range) {
    const from = range?.from || '';
    const to = range?.to || '';
    const openingBase = typeof getItemOpening === 'function'
        ? getItemOpening(itemId)
        : Number(appState?.storesInventory?.openings?.[itemId]) || 0;
    const inv = typeof ensureStoresInventory === 'function'
        ? ensureStoresInventory()
        : (appState?.storesInventory || { transactions: [] });
    const allTxns = (inv.transactions || []).filter((t) => t.itemId === itemId);

    let priorIn = 0;
    let priorOut = 0;
    let received = 0;
    let issued = 0;
    const periodTxns = [];

    allTxns.forEach((t) => {
        const qty = Number(t.qty) || 0;
        const d = t.date || '';
        const before = from && d && d < from;
        const after = to && d && d > to;
        if (before) {
            if (t.type === 'receipt') priorIn += qty;
            else if (t.type === 'issue') priorOut += qty;
            return;
        }
        if (after) return;
        // in range (or cumulative when from/to empty)
        if (!from && !to) {
            if (t.type === 'receipt') received += qty;
            else if (t.type === 'issue') issued += qty;
            periodTxns.push(t);
            return;
        }
        if ((!from || !d || d >= from) && (!to || !d || d <= to)) {
            if (t.type === 'receipt') received += qty;
            else if (t.type === 'issue') issued += qty;
            periodTxns.push(t);
        }
    });

    const opening = (!from && !to) ? openingBase : (openingBase + priorIn - priorOut);
    const catalog = typeof getCatalogItemById === 'function' ? getCatalogItemById(itemId) : null;
    const category = catalog?.category || allTxns[0]?.category || '';
    const itemName = catalog?.name || allTxns[0]?.item || itemId;
    const kind = classifyInventoryItemKind(itemName, category);
    const family = getProductCategoryFamily(category, itemName);
    const displayItemId = getOrAssignDisplayItemId(itemId, itemName, category);
    const image = resolveProductStockImage(itemName, category, kind.familyKey || family.key, itemId);

    return {
        itemId,
        displayItemId,
        itemName,
        category,
        categoryLabel: kind.categoryLabel || family.label,
        familyKey: kind.familyKey || family.key,
        typeCode: kind.typeCode || '',
        image,
        gl: catalog?.gl || allTxns[0]?.gl || '',
        opening,
        received,
        issued,
        onHand: opening + received - issued,
        transactions: periodTxns.slice().sort((a, b) => String(b.createdAt || b.date || '').localeCompare(String(a.createdAt || a.date || ''))),
        allTransactions: allTxns.slice().sort((a, b) => String(b.createdAt || b.date || '').localeCompare(String(a.createdAt || a.date || ''))),
        range
    };
}

function collectProductStockItemIds() {
    const ids = new Set(FEATURED_INVENTORY_ITEM_IDS);
    if (typeof getAllCatalogItems === 'function') {
        getAllCatalogItems().forEach((i) => { if (i?.id) ids.add(i.id); });
    }
    const inv = appState?.storesInventory || {};
    Object.keys(inv.openings || {}).forEach((id) => {
        if (id && !String(id).includes('__legacy') && !(VOUCHER_INVENTORY_CATEGORIES || []).some((c) => c.key === id)) {
            ids.add(id);
        }
    });
    (inv.transactions || []).forEach((t) => {
        if (t?.itemId) ids.add(t.itemId);
    });
    return [...ids];
}

function buildProductStockRows(options = {}) {
    const range = options.range || resolveProductStockPeriodRange(productStockState.period, productStockState.focusDate);
    const categoryFilter = options.category ?? productStockState.category;
    const search = String(options.search ?? productStockState.search ?? '').trim().toLowerCase();
    const showZero = options.showZero !== false;

    let rows = collectProductStockItemIds().map((id) => getItemStockSummaryForPeriod(id, range));

    if (categoryFilter && categoryFilter !== 'all') {
        rows = rows.filter((r) => r.familyKey === categoryFilter);
    }
    if (search) {
        rows = rows.filter((r) =>
            r.itemName.toLowerCase().includes(search)
            || r.itemId.toLowerCase().includes(search)
            || String(r.displayItemId || '').toLowerCase().includes(search)
            || r.categoryLabel.toLowerCase().includes(search)
        );
    }
    if (!showZero) {
        rows = rows.filter((r) => r.onHand !== 0 || r.received || r.issued || r.opening || FEATURED_INVENTORY_ITEM_IDS.includes(r.itemId));
    } else if (search) {
        // Keep zero-stock catalog hits while searching so users can find master items
        rows = rows.filter((r) =>
            r.onHand !== 0 || r.received || r.issued || r.opening
            || FEATURED_INVENTORY_ITEM_IDS.includes(r.itemId)
            || (typeof getCatalogItemById === 'function' && getCatalogItemById(r.itemId))
        );
    } else {
        rows = rows.filter((r) => r.onHand !== 0 || r.received || r.issued || r.opening || FEATURED_INVENTORY_ITEM_IDS.includes(r.itemId));
    }

    const sortKey = options.sortKey || productStockState.sortKey;
    const sortDir = options.sortDir || productStockState.sortDir;
    rows.sort((a, b) => {
        let av = a[sortKey];
        let bv = b[sortKey];
        if (sortKey === 'onHand' || sortKey === 'received' || sortKey === 'issued') {
            av = Number(av) || 0;
            bv = Number(bv) || 0;
            return sortDir === 'desc' ? bv - av : av - bv;
        }
        av = String(av || '').toLowerCase();
        bv = String(bv || '').toLowerCase();
        const cmp = av.localeCompare(bv, undefined, { sensitivity: 'base' });
        return sortDir === 'desc' ? -cmp : cmp;
    });

    return { rows, range };
}

function formatPsrWhen(isoOrDate) {
    if (!isoOrDate) return '—';
    try {
        const d = isoOrDate.includes('T') ? new Date(isoOrDate) : psrParseIsoDate(isoOrDate);
        if (!d || Number.isNaN(d.getTime())) return String(isoOrDate);
        return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: isoOrDate.includes('T') ? 'short' : undefined });
    } catch (_) {
        return String(isoOrDate);
    }
}

function hideProductStockHoverZoom() {
    const tip = document.getElementById('productStockHoverZoom');
    if (!tip) return;
    tip.hidden = true;
    tip.setAttribute('aria-hidden', 'true');
}

function isTonerInventoryRow(itemName, familyKey, typeCode) {
    if (typeCode === 'Ton') return true;
    if (familyKey === 'consumables' && /toner|cartridge|exv|drum/i.test(String(itemName || ''))) return true;
    return typeof lookupTonerCompatiblePrinters === 'function' && !!lookupTonerCompatiblePrinters(itemName);
}

/**
 * Plain-language “what this item does / is for” — used on name & image hover.
 */
function getInventoryItemRoleInfo(itemName, familyKey, typeCode, categoryLabel) {
    const name = String(itemName || '').trim();
    const t = name.toLowerCase();
    const cat = String(categoryLabel || '').trim();
    const fam = String(familyKey || '');
    const type = String(typeCode || '');

    let role = cat || 'Store item';
    let summary = 'Tracked store stock item for receive / issue against the inventory ledger.';
    const details = [];

    if (type === 'Ton' || /toner|cartridge|exv|print\s*head|printhead|ink\b/i.test(t)) {
        role = 'Printer consumable';
        summary = 'Toner, ink, drum or print-head supply used to keep printers and MFPs printing. Issued against printer maintenance / office printing.';
        details.push('Match the SKU to the correct printer model before issue.');
    } else if (type === 'Med' || /\b(usb|flash|memory\s*stick|sandisk|kingston|transcend|external\s*hdd|hard\s*disk)\b/i.test(t)) {
        role = 'Storage / media';
        summary = 'Portable storage for transferring or backing up files (USB sticks, flash media, external drives).';
        details.push('Issue for data transfer, offline backup, or field use.');
    } else if (type === 'Tab' || /\b(tablet|ipad|galaxy\s*tab|\btab\s*[sabfe]?\s*\d)/i.test(t)) {
        role = 'Tablet / mobile ICT';
        summary = 'Portable touchscreen computer for field work, briefings, presentations, or light office tasks away from a desk.';
        details.push('Issued as accountable ICT equipment to a user / section.');
    } else if (type === 'Lap' || /\b(laptop|notebook|macbook|latitude|elitebook|thinkpad|omnibook)\b/i.test(t)) {
        role = 'Laptop computer';
        summary = 'Portable workstation for office productivity, email, and applications. Accountable ICT equipment issued to a named user.';
    } else if (type === 'Desk' || /\b(desktop|optiplex|elitedesk|prodesk|thinkcentre|workstation)\b/i.test(t)) {
        role = 'Desktop / workstation';
        summary = 'Fixed office computer for desk-based work, often with higher power for design or data tasks.';
    } else if (type === 'Print' || /\b(printer|mfp|laserjet|imagerunner|plotter)\b/i.test(t)) {
        role = 'Printer / MFP';
        summary = 'Prints, copies, and often scans documents for the office. Consumables (toner) are issued separately.';
    } else if (type === 'Srv' || /\bservers?\b/i.test(t)) {
        role = 'Server';
        summary = 'Central computer that hosts shared services (files, email, databases, applications) for the organisation.';
    } else if (type === 'Net' || /\b(switch|router|firewall|access\s*point)\b/i.test(t)) {
        role = 'Network equipment';
        summary = 'Connects computers and devices to the LAN / internet and enforces network access or security.';
    } else if (type === 'Mon' || /\b(monitor|display)\b/i.test(t)) {
        role = 'Display monitor';
        summary = 'External screen used with a desktop or laptop for viewing work.';
    } else if (/\bups\b|battery\s*kits?/i.test(t)) {
        role = 'Power backup / UPS';
        summary = 'Uninterruptible power supply or battery kit that keeps critical ICT equipment running during short power cuts and allows safe shutdown.';
        details.push('Spares & Parts — replace or service UPS batteries as a set.');
    } else if (type === 'Spa' || fam === 'spares') {
        role = 'Spare part / component';
        summary = 'Replacement part (e.g. fan, board, roller, laptop battery) used to repair or maintain ICT equipment — not a complete end-user device.';
        details.push('Issued against a repair / maintenance job, not as a personal issue.');
    } else if (type === 'Soft' || fam === 'software' || /software|licence|license/i.test(t)) {
        role = 'Software licence';
        let natureLabel = '';
        if (typeof classifySoftwareUseNature === 'function') {
            const nature = classifySoftwareUseNature(name);
            natureLabel = typeof getSoftwareUseNatureLabel === 'function'
                ? getSoftwareUseNatureLabel(nature)
                : nature;
        }
        const natureBlurb = {
            'ai-saas': 'AI / online subscription used for drafting, coding assistance, or creative productivity.',
            database: 'Database platform for storing and querying organisational data.',
            'web-dev': 'Tools used to build, debug, or publish software and websites.',
            'os-server': 'Operating system or server platform that computers / servers run on.',
            security: 'Protects endpoints and data (antivirus, encryption, endpoint security).',
            office: 'Day-to-day office work: documents, spreadsheets, email, presentations.',
            creative: 'Design, photo, video, or print production software.',
            virtualization: 'Runs virtual machines or remote desktop sessions.',
            network: 'Monitors or manages network infrastructure.',
            recovery: 'Recovers lost data or supports forensic examination.',
            gis: 'Mapping and geographic information systems.',
            'enterprise-dev': 'Business-system / enterprise application development.',
            education: 'Training and education software.'
        };
        const natureKey = typeof classifySoftwareUseNature === 'function' ? classifySoftwareUseNature(name) : '';
        summary = natureBlurb[natureKey]
            || 'Licensed software entitlement — install / activate only as authorised; track seats and renewal.';
        if (natureLabel) details.push(`Nature of use: ${natureLabel}`);
        details.push('Does not leave the store as physical stock in the same way as hardware; track licences & renewals.');
    } else if (type === 'Maint' || fam === 'maintenance') {
        role = 'Maintenance supply / service item';
        summary = 'Materials or kits used to service photocopiers, printers, or other ICT plant.';
    } else if (fam === 'ict') {
        role = 'ICT equipment';
        summary = 'Information & communications technology asset issued on accountability to a user or section.';
    }

    if (cat && !details.some((d) => d.includes(cat))) {
        details.unshift(`Category: ${cat}`);
    }

    const web = typeof getCachedProductWebEnrich === 'function' ? getCachedProductWebEnrich(name) : null;
    if (web?.summary) {
        summary = web.summary;
        details.push('Online product information — review before issue / procurement.');
    }

    return { role, summary, details: details.slice(0, 5), name };
}

function formatInventoryRoleHoverHtml(info, { compact = false } = {}) {
    if (!info) return '';
    const detailHtml = (info.details || []).map((d) =>
        `<div class="psr-hover-role-detail">${psrEscape(d)}</div>`
    ).join('');
    return `
        <div class="psr-hover-specs-head">${psrEscape(info.role)}</div>
        <p class="psr-hover-role-summary">${psrEscape(info.summary)}</p>
        ${compact ? '' : detailHtml}
    `;
}

function renderTonerPrintersPanelHtml(itemName) {
    if (typeof formatTonerCompatibilityLines !== 'function') return '';
    const info = formatTonerCompatibilityLines(itemName, 14);
    if (!info) {
        return `
            <aside class="psr-zoom-specs">
                <h4 class="psr-zoom-specs-title">Compatible printers</h4>
                <p class="psr-zoom-specs-empty">No printer compatibility list on file for this toner yet.</p>
            </aside>
        `;
    }
    const lis = info.lines.map((p) => `<li>${psrEscape(p)}</li>`).join('');
    return `
        <aside class="psr-zoom-specs">
            <h4 class="psr-zoom-specs-title">Compatible printers</h4>
            <p class="psr-zoom-specs-model">${psrEscape(info.sku)} · ${info.total} model${info.total === 1 ? '' : 's'}</p>
            <div class="psr-zoom-specs-scroll">
                <ul class="psr-printer-list">${lis}</ul>
                ${info.more ? `<p class="psr-zoom-specs-empty">+${info.more} more — see OEM datasheet for full list</p>` : ''}
            </div>
        </aside>
    `;
}

function showProductStockHoverZoom(imgSrc, anchorEl, itemName, familyKey, typeCode, categoryLabel) {
    const tip = document.getElementById('productStockHoverZoom');
    const tipImg = document.getElementById('productStockHoverZoomImg');
    if (!tip || !tipImg || !imgSrc || !anchorEl) return;
    hideItemNameHoverTip();
    tipImg.src = imgSrc;

    let specsEl = tip.querySelector('.psr-hover-specs');
    if (!specsEl) {
        specsEl = document.createElement('div');
        specsEl.className = 'psr-hover-specs';
        tip.appendChild(specsEl);
    }

    const role = getInventoryItemRoleInfo(itemName, familyKey, typeCode, categoryLabel);
    const toner = isTonerInventoryRow(itemName, familyKey, typeCode);
    let extraHtml = '';

    if (toner && typeof formatTonerCompatibilityLines === 'function') {
        const info = formatTonerCompatibilityLines(itemName, 5);
        if (info) {
            const highlights = info.lines.map((p) => `<div class="psr-hover-printer">${psrEscape(p)}</div>`).join('');
            extraHtml = `
                <div class="psr-hover-specs-head">Works on (${psrEscape(info.sku)})</div>
                ${highlights}
                ${info.more ? `<div class="psr-hover-specs-empty">+${info.more} more — click for full list</div>` : ''}
            `;
        } else {
            extraHtml = '<div class="psr-hover-specs-empty">Compatible printers not listed yet</div>';
        }
    } else if (familyKey === 'ict') {
        const product = lookupIctProductSpecs(itemName);
        if (product?.specs?.length) {
            extraHtml = product.specs.slice(0, 4).map(([label, value]) =>
                `<div><span>${psrEscape(label)}</span> ${psrEscape(value || '—')}</div>`
            ).join('');
        }
    }

    specsEl.innerHTML = `${formatInventoryRoleHoverHtml(role, { compact: !!extraHtml })}${extraHtml}${
        typeof renderProductDocumentLinksHtml === 'function'
            ? renderProductDocumentLinksHtml(itemName, familyKey, typeCode, { compact: true })
            : ''
    }`;
    specsEl.hidden = false;
    tip.style.pointerEvents = 'auto';
    if (typeof wireProductDocumentLinkClicks === 'function') wireProductDocumentLinkClicks(tip);

    tip.hidden = false;
    tip.setAttribute('aria-hidden', 'false');
    const hint = tip.querySelector('.psr-hover-zoom-hint');
    if (hint) {
        if (toner) hint.textContent = 'Click for image & full printer list';
        else if (familyKey === 'ict') hint.textContent = 'Click for image & specifications';
        else hint.textContent = 'Click for larger view';
    }

    const rect = anchorEl.getBoundingClientRect();
    const tipW = 320;
    const tipH = toner ? 400 : (familyKey === 'ict' ? 380 : 340);
    let left = rect.right + 12;
    let top = rect.top + rect.height / 2 - tipH / 2;
    if (left + tipW > window.innerWidth - 12) left = rect.left - tipW - 12;
    if (left < 8) left = 8;
    if (top < 8) top = 8;
    if (top + tipH > window.innerHeight - 8) top = window.innerHeight - tipH - 8;
    tip.style.width = `${tipW}px`;
    tip.style.left = `${Math.round(left)}px`;
    tip.style.top = `${Math.round(top)}px`;
}

function lookupIctProductSpecs(itemName) {
    if (typeof findProductInCatalog === 'function') {
        const hit = findProductInCatalog(itemName, { minScore: 55 });
        if (hit?.product?.specs?.length) return hit.product;
    }
    const web = typeof getCachedProductWebEnrich === 'function' ? getCachedProductWebEnrich(itemName) : null;
    if (web?.specs?.length) {
        return {
            brand: web.brand || '',
            model: web.model || itemName,
            category: web.category || 'other',
            specs: web.specs
        };
    }
    return null;
}

function renderIctSpecsPanelHtml(itemName, familyKey) {
    const product = lookupIctProductSpecs(itemName);
    if (familyKey !== 'ict' && !product) return '';
    if (!product) {
        return `
            <aside class="psr-zoom-specs">
                <h4 class="psr-zoom-specs-title">Specifications</h4>
                <p class="psr-zoom-specs-empty">No curated specs on file for this model yet. Add or match it in Product Specs Catalog for Auto-fill detail.</p>
            </aside>
        `;
    }
    const kindLabel = product.category
        ? String(product.category).replace(/^\w/, (c) => c.toUpperCase())
        : 'ICT';
    const rows = (product.specs || []).slice(0, 12).map(([label, value, note]) => `
        <tr>
            <th>${psrEscape(label)}</th>
            <td>
                <span class="psr-spec-val">${psrEscape(value || '—')}</span>
                ${note ? `<span class="psr-spec-note">${psrEscape(note)}</span>` : ''}
            </td>
        </tr>
    `).join('');
    return `
        <aside class="psr-zoom-specs">
            <h4 class="psr-zoom-specs-title">${psrEscape(kindLabel)} specifications</h4>
            <p class="psr-zoom-specs-model">${psrEscape([product.brand, product.model].filter(Boolean).join(' '))}</p>
            <div class="psr-zoom-specs-scroll">
                <table class="psr-specs-table">
                    <tbody>${rows}</tbody>
                </table>
            </div>
        </aside>
    `;
}

function openProductStockZoom(imgSrc, itemName, familyKey, typeCode, categoryLabel) {
    hideProductStockHoverZoom();
    hideItemNameHoverTip();
    const host = document.getElementById('productStockZoomHost');
    if (!host || !imgSrc) return;
    const toner = isTonerInventoryRow(itemName, familyKey, typeCode);
    const role = getInventoryItemRoleInfo(itemName, familyKey, typeCode, categoryLabel);
    const rolePanel = `
        <aside class="psr-zoom-specs psr-zoom-role">
            <h4 class="psr-zoom-specs-title">What it does</h4>
            <p class="psr-zoom-specs-model">${psrEscape(role.role)}</p>
            <p class="psr-zoom-role-summary">${psrEscape(role.summary)}</p>
            ${(role.details || []).map((d) => `<p class="psr-zoom-role-detail">${psrEscape(d)}</p>`).join('')}
        </aside>
    `;
    const specsHtml = toner
        ? renderTonerPrintersPanelHtml(itemName)
        : renderIctSpecsPanelHtml(itemName, familyKey);
    const wide = ' psr-zoom-dialog--with-specs';
    host.hidden = false;
    host.innerHTML = `
        <div class="psr-zoom-backdrop" data-psr-zoom-close></div>
        <div class="psr-zoom-dialog${wide}" role="dialog" aria-modal="true" aria-label="${psrEscape(itemName || 'Product image')}">
            <button type="button" class="psr-zoom-close" data-psr-zoom-close aria-label="Close">✕</button>
            <div class="psr-zoom-body">
                <div class="psr-zoom-media">
                    <img class="psr-zoom-img" src="${psrEscape(imgSrc)}" alt="${psrEscape(itemName || 'Product')}">
                    <p class="psr-zoom-caption">${psrEscape(itemName || '')}</p>
                </div>
                <div class="psr-zoom-side">
                    ${rolePanel}
                    ${specsHtml}
                    ${typeof renderProductDocumentLinksHtml === 'function'
                        ? renderProductDocumentLinksHtml(itemName, familyKey, typeCode)
                        : ''}
                </div>
            </div>
        </div>
    `;
    host.querySelectorAll('[data-psr-zoom-close]').forEach((el) => {
        el.addEventListener('click', () => {
            host.hidden = true;
            host.innerHTML = '';
        });
    });
    if (typeof wireProductDocumentLinkClicks === 'function') wireProductDocumentLinkClicks(host);
}

function wireProductStockZoom(root) {
    if (!root) return;
    root.querySelectorAll('[data-psr-zoom]').forEach((btn) => {
        const src = btn.getAttribute('data-psr-zoom') || '';
        const name = btn.getAttribute('data-psr-zoom-name') || '';
        const family = btn.getAttribute('data-psr-zoom-family') || '';
        const typeCode = btn.getAttribute('data-psr-zoom-type') || '';
        const categoryLabel = btn.getAttribute('data-psr-zoom-cat') || '';
        let hideTimer = null;
        const show = () => {
            clearTimeout(hideTimer);
            const liveSrc = btn.getAttribute('data-psr-zoom') || src;
            showProductStockHoverZoom(liveSrc, btn, name, family, typeCode, categoryLabel);
            if (typeof ensureProductWebEnrich === 'function') {
                ensureProductWebEnrich(name, family, typeCode).then((payload) => {
                    if (!payload) return;
                    const tip = document.getElementById('productStockHoverZoom');
                    if (tip && !tip.hidden) {
                        showProductStockHoverZoom(btn.getAttribute('data-psr-zoom') || liveSrc, btn, name, family, typeCode, categoryLabel);
                    }
                });
            }
            const tip = document.getElementById('productStockHoverZoom');
            if (tip && !tip.dataset.psrBound) {
                tip.dataset.psrBound = '1';
                tip.addEventListener('mouseenter', () => clearTimeout(hideTimer));
                tip.addEventListener('mouseleave', () => {
                    hideTimer = setTimeout(hideProductStockHoverZoom, 180);
                });
            }
        };
        const hideSoon = () => {
            hideTimer = setTimeout(hideProductStockHoverZoom, 180);
        };
        btn.addEventListener('mouseenter', show);
        btn.addEventListener('mouseleave', hideSoon);
        btn.addEventListener('focus', show);
        btn.addEventListener('blur', hideSoon);
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            openProductStockZoom(btn.getAttribute('data-psr-zoom') || src, name, family, typeCode, categoryLabel);
        });
    });
}

function showItemNameHoverTip(anchorEl, itemName, familyKey, typeCode, categoryLabel) {
    if (!anchorEl || !itemName) return;
    hideProductStockHoverZoom();
    const role = getInventoryItemRoleInfo(itemName, familyKey, typeCode, categoryLabel);
    let tip = document.getElementById('productStockItemTip');
    if (!tip) {
        tip = document.createElement('div');
        tip.id = 'productStockItemTip';
        tip.className = 'psr-item-tip';
        tip.setAttribute('role', 'tooltip');
        document.body.appendChild(tip);
    }

    let extra = '';
    const toner = isTonerInventoryRow(itemName, familyKey, typeCode);
    if (toner && typeof formatTonerCompatibilityLines === 'function') {
        const info = formatTonerCompatibilityLines(itemName, 6);
        if (info) {
            extra = `
                <strong class="psr-item-tip-sub">Works on · ${psrEscape(info.sku)}</strong>
                <ul>${info.lines.map((p) => `<li>${psrEscape(p)}</li>`).join('')}</ul>
                ${info.more ? `<p class="psr-item-tip-more">+${info.more} more printers</p>` : ''}
            `;
        }
    } else {
        const product = lookupIctProductSpecs(itemName);
        if (product?.specs?.length) {
            extra = `
                <strong class="psr-item-tip-sub">Key specs</strong>
                <ul>${product.specs.slice(0, 5).map(([label, value]) =>
                    `<li><em>${psrEscape(label)}:</em> ${psrEscape(value || '—')}</li>`
                ).join('')}</ul>
            `;
        }
    }

    tip.innerHTML = `
        <strong>${psrEscape(role.role)}</strong>
        <p class="psr-item-tip-summary">${psrEscape(role.summary)}</p>
        ${(role.details || []).map((d) => `<p class="psr-item-tip-detail">${psrEscape(d)}</p>`).join('')}
        ${extra}
        ${typeof renderProductDocumentLinksHtml === 'function'
            ? renderProductDocumentLinksHtml(itemName, familyKey, typeCode, { compact: true })
            : ''}
    `;
    tip.hidden = false;
    tip.style.pointerEvents = 'auto';
    if (typeof wireProductDocumentLinkClicks === 'function') wireProductDocumentLinkClicks(tip);
    const rect = anchorEl.getBoundingClientRect();
    const tipW = 320;
    let left = rect.right + 10;
    let top = rect.top;
    if (left + tipW > window.innerWidth - 10) left = Math.max(8, rect.left - tipW - 10);
    if (top + 320 > window.innerHeight - 8) top = Math.max(8, window.innerHeight - 330);
    tip.style.left = `${Math.round(left)}px`;
    tip.style.top = `${Math.round(top)}px`;
    if (typeof ensureProductWebEnrich === 'function' && typeof shouldCrawlProductWeb === 'function'
        && shouldCrawlProductWeb(itemName, familyKey, typeCode)) {
        ensureProductWebEnrich(itemName, familyKey, typeCode).then((payload) => {
            const live = document.getElementById('productStockItemTip');
            if (payload && live && !live.hidden) {
                showItemNameHoverTip(anchorEl, itemName, familyKey, typeCode, categoryLabel);
            }
        });
    }
}

function hideItemNameHoverTip() {
    const tip = document.getElementById('productStockItemTip');
    if (tip) tip.hidden = true;
    // legacy id from earlier toner-only tip
    const legacy = document.getElementById('productStockTonerTip');
    if (legacy) legacy.hidden = true;
}

function wireItemNameHover(root) {
    if (!root) return;
    root.querySelectorAll('[data-psr-item-name]').forEach((el) => {
        const name = el.getAttribute('data-psr-item-name') || '';
        const family = el.getAttribute('data-psr-item-family') || '';
        const typeCode = el.getAttribute('data-psr-item-type') || '';
        const cat = el.getAttribute('data-psr-item-cat') || '';
        let hideTimer = null;
        const show = () => {
            clearTimeout(hideTimer);
            showItemNameHoverTip(el, name, family, typeCode, cat);
            const tip = document.getElementById('productStockItemTip');
            if (tip && !tip.dataset.psrBound) {
                tip.dataset.psrBound = '1';
                tip.addEventListener('mouseenter', () => clearTimeout(hideTimer));
                tip.addEventListener('mouseleave', () => {
                    hideTimer = setTimeout(hideItemNameHoverTip, 180);
                });
            }
        };
        const hideSoon = () => {
            hideTimer = setTimeout(hideItemNameHoverTip, 180);
        };
        el.addEventListener('mouseenter', show);
        el.addEventListener('mouseleave', hideSoon);
        el.addEventListener('focus', show);
        el.addEventListener('blur', hideSoon);
    });
}

function renderProductStockHistoryModal(itemId) {
    const host = document.getElementById('productStockHistoryHost');
    if (!host) return;
    const range = resolveProductStockPeriodRange(productStockState.period, productStockState.focusDate);
    const row = getItemStockSummaryForPeriod(itemId, range);
    const txns = row.allTransactions || [];

    host.hidden = false;
    host.innerHTML = `
        <div class="psr-modal-backdrop" data-psr-close></div>
        <div class="psr-modal" role="dialog" aria-modal="true" aria-labelledby="psrHistoryTitle">
            <header class="psr-modal-head">
                <div>
                    <h3 id="psrHistoryTitle">Ledger history — ${psrEscape(row.itemName)}</h3>
                    <p class="psr-modal-sub">
                        Item ID: <code>${psrEscape(row.displayItemId || row.itemId)}</code>
                        · Category: ${psrEscape(row.categoryLabel)}
                        · On hand now: <strong>${psrEscape(formatStockQty ? formatStockQty(row.onHand) : row.onHand)}</strong>
                    </p>
                </div>
                <button type="button" class="btn btn-ghost btn-sm" data-psr-close aria-label="Close">✕</button>
            </header>
            <div class="psr-modal-body">
                <p class="psr-period-note">Showing all ledger movements (receive into stock / issue or strike off). Period filter on the list only changes stock figures above.</p>
                <div class="form-table-wrapper">
                    <table class="overview-table psr-history-table">
                        <thead>
                            <tr>
                                <th>Date / time</th>
                                <th>Action</th>
                                <th>Qty</th>
                                <th>Received from / Issued to</th>
                                <th>Entered by</th>
                                <th>Refs</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${txns.length ? txns.map((t) => {
                                const isIn = t.type === 'receipt';
                                const action = isIn ? 'Received into ledger' : 'Issued / struck off ledger';
                                const when = formatPsrWhen(t.createdAt || t.date);
                                const refs = [t.voucherNo, t.poNumber, t.deliveryNoteRef, t.sourceRef].filter(Boolean).join(' · ') || '—';
                                return `<tr>
                                    <td>${psrEscape(when)}</td>
                                    <td><span class="psr-action ${isIn ? 'is-in' : 'is-out'}">${action}</span></td>
                                    <td>${psrEscape(String(t.qty ?? ''))}</td>
                                    <td>${psrEscape([t.party, t.appointment].filter(Boolean).join(' · ') || '—')}</td>
                                    <td>${psrEscape(t.by || '—')}</td>
                                    <td><small>${psrEscape(refs)}</small></td>
                                </tr>`;
                            }).join('') : '<tr><td colspan="6" class="empty-state">No receive / issue movements recorded for this item yet.</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>
            <footer class="psr-modal-foot">
                <button type="button" class="btn btn-primary btn-sm" data-psr-close>Close</button>
                <button type="button" class="btn btn-ghost btn-sm" data-psr-open-voucher>Open Stores Inventory</button>
            </footer>
        </div>
    `;

    host.querySelectorAll('[data-psr-close]').forEach((el) => {
        el.addEventListener('click', () => {
            host.hidden = true;
            host.innerHTML = '';
        });
    });
    host.querySelector('[data-psr-open-voucher]')?.addEventListener('click', () => {
        host.hidden = true;
        host.innerHTML = '';
        if (typeof navigateToModule === 'function') navigateToModule('voucher-module');
    });
}

function renderProductStockRegister() {
    const root = document.getElementById('productStockRegister');
    if (!root) return;

    if (!productStockState.focusDate) productStockState.focusDate = psrTodayIso();

    const { rows, range } = buildProductStockRows();
    const pageSize = Number(productStockState.pageSize) || 10;
    const total = rows.length;
    const pages = Math.max(1, Math.ceil(total / pageSize));
    if (productStockState.page > pages) productStockState.page = pages;
    const page = productStockState.page;
    const start = (page - 1) * pageSize;
    const pageRows = rows.slice(start, start + pageSize);
    const showingFrom = total ? start + 1 : 0;
    const showingTo = Math.min(start + pageSize, total);
    const fmt = typeof formatStockQty === 'function' ? formatStockQty : (n) => String(n ?? 0);

    const periodOpts = PRODUCT_STOCK_PERIODS.map((p) =>
        `<option value="${p.key}"${productStockState.period === p.key ? ' selected' : ''}>${psrEscape(p.label)}</option>`
    ).join('');
    const catOpts = [
        `<option value="all"${productStockState.category === 'all' ? ' selected' : ''}>All categories</option>`,
        ...PRODUCT_CATEGORY_FAMILIES.filter((f) => f.key !== 'maintenance').map((f) =>
            `<option value="${f.key}"${productStockState.category === f.key ? ' selected' : ''}>${psrEscape(f.label)}</option>`
        ),
        `<option value="maintenance"${productStockState.category === 'maintenance' ? ' selected' : ''}>Maintenance</option>`
    ].join('');

    root.innerHTML = `
        <div class="psr-toolbar">
            <div class="psr-toolbar-left">
                <label class="psr-field">
                    <span>Period</span>
                    <select class="form-control" id="psrPeriod">${periodOpts}</select>
                </label>
                <label class="psr-field">
                    <span>As at / focus date</span>
                    <input type="date" class="form-control" id="psrFocusDate" value="${psrEscape(productStockState.focusDate)}">
                </label>
                <label class="psr-field">
                    <span>Category</span>
                    <select class="form-control" id="psrCategory">${catOpts}</select>
                </label>
                <label class="psr-field psr-field-show">
                    <span>Show</span>
                    <span class="psr-show-row">
                        <select class="form-control" id="psrPageSize">
                            ${[10, 25, 50, 100].map((n) =>
                                `<option value="${n}"${pageSize === n ? ' selected' : ''}>${n}</option>`
                            ).join('')}
                        </select>
                        <span class="psr-inline-hint">entries</span>
                    </span>
                </label>
            </div>
            <div class="psr-toolbar-right">
                <label class="psr-field psr-search">
                    <span>Search</span>
                    <input type="search" class="form-control" id="psrSearch" placeholder="Item name or ID…" value="${psrEscape(productStockState.search)}">
                </label>
                <div class="psr-field psr-field-action">
                    <span class="psr-action-spacer" aria-hidden="true">&nbsp;</span>
                    <button type="button" class="btn btn-primary btn-sm" id="psrAddProductBtn" title="Receive stock via Issue Voucher">+ Add / Receive</button>
                </div>
            </div>
        </div>
        <p class="psr-range-label">${psrEscape(range.label)} · Opening + Received − Issued in this period = Quantity in stock</p>
        <div class="form-table-wrapper">
            <table class="overview-table psr-table" id="psrTable">
                <thead>
                    <tr>
                        <th data-psr-sort="displayItemId">Item ID</th>
                        <th data-psr-sort="itemName">Item Name</th>
                        <th data-psr-sort="onHand">Quantity in stock</th>
                        <th>Image</th>
                        <th data-psr-sort="categoryLabel">Category</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${pageRows.length ? pageRows.map((r) => {
                        const toner = isTonerInventoryRow(r.itemName, r.familyKey, r.typeCode);
                        const nameAttrs = [
                            ' class="psr-item-name psr-item-name--info"',
                            ' tabindex="0"',
                            ` data-psr-item-name="${psrEscape(r.itemName)}"`,
                            ` data-psr-item-family="${psrEscape(r.familyKey || '')}"`,
                            ` data-psr-item-type="${psrEscape(r.typeCode || '')}"`,
                            ` data-psr-item-cat="${psrEscape(r.categoryLabel || '')}"`,
                            ' title="Hover to see what this item does"'
                        ].join('');
                        const thumbTitle = toner
                            ? 'Hover: what it does + printers · click for full details'
                            : (r.familyKey === 'ict'
                                ? 'Hover: what it does + specs · click for full details'
                                : 'Hover: what it does · click to enlarge');
                        return `
                        <tr>
                            <td><code class="psr-id" title="${psrEscape(r.itemId)}">${psrEscape(r.displayItemId || r.itemId)}</code></td>
                            <td>
                                <strong${nameAttrs}>${psrEscape(r.itemName)}</strong>
                                <div class="psr-row-meta">In ${fmt(r.received)} · Out ${fmt(r.issued)} · Opening ${fmt(r.opening)}</div>
                            </td>
                            <td><strong class="psr-qty">${fmt(r.onHand)}</strong></td>
                            <td>
                                <button type="button" class="psr-thumb-btn" data-psr-zoom="${psrEscape(/claude/i.test(r.itemName) ? withProductImageCache('../assets/inventory/software-claude.png') : r.image)}" data-psr-zoom-name="${psrEscape(r.itemName)}" data-psr-zoom-family="${psrEscape(r.familyKey || '')}" data-psr-zoom-type="${psrEscape(r.typeCode || '')}" data-psr-zoom-cat="${psrEscape(r.categoryLabel || '')}" title="${thumbTitle}">
                                    <img class="psr-thumb" src="${psrEscape(r.image)}" alt="${psrEscape(r.itemName)}" width="40" height="40" loading="lazy"
                                        onerror="this.classList.add('is-missing'); this.alt='—';">
                                </button>
                            </td>
                            <td><span class="psr-cat psr-cat-${psrEscape(r.familyKey)}">${psrEscape(r.categoryLabel)}</span></td>
                            <td class="psr-actions">
                                <button type="button" class="btn btn-primary btn-sm" data-psr-history="${psrEscape(r.itemId)}" title="Receive / issue history">History</button>
                                <button type="button" class="btn btn-ghost btn-sm" data-psr-ledger="${psrEscape(r.category)}" title="Open ledger">Ledger</button>
                            </td>
                        </tr>`;
                    }).join('') : `<tr><td colspan="6" class="empty-state">No inventory matches this period / filter. Receive stock on Issue Voucher, or change Period / Category.</td></tr>`}
                </tbody>
            </table>
        </div>
        <div class="psr-footer">
            <span>Showing ${showingFrom} to ${showingTo} of ${total} entries</span>
            <div class="psr-pager">
                <button type="button" class="btn btn-ghost btn-sm" id="psrPrev" ${page <= 1 ? 'disabled' : ''}>Previous</button>
                <span class="psr-page-num">${page}</span>
                <button type="button" class="btn btn-ghost btn-sm" id="psrNext" ${page >= pages ? 'disabled' : ''}>Next</button>
            </div>
        </div>
    `;

    const periodEl = root.querySelector('#psrPeriod');
    const dateEl = root.querySelector('#psrFocusDate');
    const catEl = root.querySelector('#psrCategory');
    const sizeEl = root.querySelector('#psrPageSize');
    const searchEl = root.querySelector('#psrSearch');

    periodEl?.addEventListener('change', () => {
        productStockState.period = periodEl.value;
        productStockState.page = 1;
        renderProductStockRegister();
    });
    dateEl?.addEventListener('change', () => {
        productStockState.focusDate = dateEl.value || psrTodayIso();
        productStockState.page = 1;
        renderProductStockRegister();
    });
    catEl?.addEventListener('change', () => {
        productStockState.category = catEl.value;
        productStockState.page = 1;
        renderProductStockRegister();
    });
    sizeEl?.addEventListener('change', () => {
        productStockState.pageSize = Number(sizeEl.value) || 10;
        productStockState.page = 1;
        renderProductStockRegister();
    });
    let searchTimer = null;
    searchEl?.addEventListener('input', () => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
            productStockState.search = searchEl.value || '';
            productStockState.page = 1;
            renderProductStockRegister();
        }, 200);
    });

    root.querySelector('#psrPrev')?.addEventListener('click', () => {
        productStockState.page = Math.max(1, productStockState.page - 1);
        renderProductStockRegister();
    });
    root.querySelector('#psrNext')?.addEventListener('click', () => {
        productStockState.page += 1;
        renderProductStockRegister();
    });
    root.querySelector('#psrAddProductBtn')?.addEventListener('click', () => {
        if (typeof navigateToModule === 'function') navigateToModule('voucher-module');
    });

    root.querySelectorAll('[data-psr-sort]').forEach((th) => {
        th.style.cursor = 'pointer';
        th.addEventListener('click', () => {
            const key = th.getAttribute('data-psr-sort');
            if (productStockState.sortKey === key) {
                productStockState.sortDir = productStockState.sortDir === 'asc' ? 'desc' : 'asc';
            } else {
                productStockState.sortKey = key;
                productStockState.sortDir = 'asc';
            }
            renderProductStockRegister();
        });
    });

    root.querySelectorAll('[data-psr-history]').forEach((btn) => {
        btn.addEventListener('click', () => renderProductStockHistoryModal(btn.getAttribute('data-psr-history')));
    });
    root.querySelectorAll('[data-psr-ledger]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const key = btn.getAttribute('data-psr-ledger');
            if (typeof openInventoryFromDashboard === 'function') openInventoryFromDashboard(key);
            else if (typeof openInventoryLedgerView === 'function') openInventoryLedgerView(key);
            else if (typeof navigateToModule === 'function') navigateToModule('voucher-module');
        });
    });

    wireProductStockZoom(root);
    wireItemNameHover(root);
    flushProductStockDisplayCodes();
    if (typeof prefetchVisibleInventoryWebEnrich === 'function') {
        prefetchVisibleInventoryWebEnrich(root);
    }
}

function initProductStockRegister() {
    if (document.body.dataset.psrBound === '1') {
        renderProductStockRegister();
        return;
    }
    document.body.dataset.psrBound = '1';
    if (!productStockState.focusDate) productStockState.focusDate = psrTodayIso();
    renderProductStockRegister();
}

window.renderProductStockRegister = renderProductStockRegister;
window.initProductStockRegister = initProductStockRegister;
window.resolveProductStockPeriodRange = resolveProductStockPeriodRange;
window.getItemStockSummaryForPeriod = getItemStockSummaryForPeriod;
window.getOrAssignDisplayItemId = getOrAssignDisplayItemId;
window.classifyInventoryItemKind = classifyInventoryItemKind;
window.buildItemIdPrefix = buildItemIdPrefix;
