/* toner-compatibility.js — OEM toner / drum → compatible printer models */

const TONER_PRINTER_COMPATIBILITY = {
    // HP LaserJet black
    CE505A: ['HP LaserJet P2035', 'HP LaserJet P2035n', 'HP LaserJet P2055', 'HP LaserJet P2055d', 'HP LaserJet P2055dn', 'HP LaserJet P2055x'],
    CE278A: ['HP LaserJet P1566', 'HP LaserJet P1606dn', 'HP LaserJet Pro M1536dnf'],
    CE255A: ['HP LaserJet P3015', 'HP LaserJet P3015d', 'HP LaserJet P3015dn', 'HP LaserJet P3015n', 'HP LaserJet P3015x', 'HP LaserJet Enterprise 500 M525'],
    CE256A: ['HP LaserJet Enterprise 500 M525', 'HP LaserJet Enterprise 500 color M551 (imaging drum family — confirm SKU)'],
    CF226A: ['HP LaserJet Pro M402d', 'HP LaserJet Pro M402dn', 'HP LaserJet Pro M402dw', 'HP LaserJet Pro M402n', 'HP LaserJet Pro MFP M426dw', 'HP LaserJet Pro MFP M426fdn', 'HP LaserJet Pro MFP M426fdw'],
    CE283A: ['HP LaserJet Pro M125a', 'HP LaserJet Pro M125nw', 'HP LaserJet Pro M127fn', 'HP LaserJet Pro M127fw', 'HP LaserJet Pro M201dw', 'HP LaserJet Pro M201n', 'HP LaserJet Pro MFP M225dn', 'HP LaserJet Pro MFP M225dw'],
    CE280A: ['HP LaserJet Pro 400 M401a', 'HP LaserJet Pro 400 M401d', 'HP LaserJet Pro 400 M401dn', 'HP LaserJet Pro 400 M401dw', 'HP LaserJet Pro 400 MFP M425dn', 'HP LaserJet Pro 400 MFP M425dw'],
    CF259A: ['HP LaserJet Pro M304a', 'HP LaserJet Pro M404dn', 'HP LaserJet Pro M404dw', 'HP LaserJet Pro M404n', 'HP LaserJet Pro MFP M428fdn', 'HP LaserJet Pro MFP M428fdw', 'HP LaserJet Pro MFP M428dw'],
    CF214A: ['HP LaserJet Enterprise 700 M712', 'HP LaserJet Enterprise MFP M725'],
    CE285A: ['HP LaserJet Pro P1102', 'HP LaserJet Pro P1102w', 'HP LaserJet Pro M1132', 'HP LaserJet Pro M1212nf', 'HP LaserJet Pro M1214nfh', 'HP LaserJet Pro M1217nfw'],
    CF325X: ['HP LaserJet Enterprise M806', 'HP LaserJet Enterprise MFP M830'],
    CE237A: ['HP LaserJet Enterprise M607', 'HP LaserJet Enterprise M608', 'HP LaserJet Enterprise M609', 'HP LaserJet Enterprise MFP M631', 'HP LaserJet Enterprise MFP M632', 'HP LaserJet Enterprise MFP M633'],
    CF237A: ['HP LaserJet Enterprise M607', 'HP LaserJet Enterprise M608', 'HP LaserJet Enterprise M609', 'HP LaserJet Enterprise MFP M631', 'HP LaserJet Enterprise MFP M632', 'HP LaserJet Enterprise MFP M633'],
    CE281A: ['HP LaserJet Enterprise 600 M601', 'HP LaserJet Enterprise 600 M602', 'HP LaserJet Enterprise 600 M603'],
    CE230A: ['HP LaserJet Pro M203', 'HP LaserJet Pro M206', 'HP LaserJet Pro MFP M227', 'HP LaserJet Pro MFP M230'],
    CE232A: ['HP LaserJet Pro M203dn', 'HP LaserJet Pro M203dw', 'HP LaserJet Pro M206dn', 'HP LaserJet Pro MFP M227fdn', 'HP LaserJet Pro MFP M227fdw', 'HP LaserJet Pro MFP M227sdn', 'HP LaserJet Pro MFP M230fdn', 'HP LaserJet Pro MFP M230fdw', 'HP LaserJet Pro MFP M230sdn'],
    CF232A: ['HP LaserJet Pro M203dn', 'HP LaserJet Pro M203dw', 'HP LaserJet Pro M206dn', 'HP LaserJet Pro MFP M227fdn', 'HP LaserJet Pro MFP M227fdw', 'HP LaserJet Pro MFP M227sdn', 'HP LaserJet Pro MFP M230fdn', 'HP LaserJet Pro MFP M230fdw', 'HP LaserJet Pro MFP M230sdn'],
    CF289A: ['HP LaserJet Enterprise M507dn', 'HP LaserJet Enterprise M507x', 'HP LaserJet Enterprise MFP M528dn', 'HP LaserJet Enterprise MFP M528f', 'HP LaserJet Enterprise MFP M528z', 'HP LaserJet Managed E50145', 'HP LaserJet Managed MFP E52645'],
    CF130A: ['HP Color LaserJet Pro MFP M176n', 'HP Color LaserJet Pro MFP M177fw'],
    // HP Color 305A / 410 series
    CE410A: ['HP LaserJet Pro 300 color M351a', 'HP LaserJet Pro 300 color MFP M375nw', 'HP LaserJet Pro 400 color M451dn', 'HP LaserJet Pro 400 color M451dw', 'HP LaserJet Pro 400 color M451nw', 'HP LaserJet Pro 400 color MFP M475dn', 'HP LaserJet Pro 400 color MFP M475dw'],
    CE411A: ['HP LaserJet Pro 300 color M351a', 'HP LaserJet Pro 300 color MFP M375nw', 'HP LaserJet Pro 400 color M451 / MFP M475 series'],
    CE412A: ['HP LaserJet Pro 300 color M351a', 'HP LaserJet Pro 300 color MFP M375nw', 'HP LaserJet Pro 400 color M451 / MFP M475 series'],
    CE413A: ['HP LaserJet Pro 300 color M351a', 'HP LaserJet Pro 300 color MFP M375nw', 'HP LaserJet Pro 400 color M451 / MFP M475 series'],
    // HP 201A
    CF400A: ['HP Color LaserJet Pro M252n', 'HP Color LaserJet Pro M252dw', 'HP Color LaserJet Pro MFP M274n', 'HP Color LaserJet Pro MFP M277n', 'HP Color LaserJet Pro MFP M277dw'],
    CF401A: ['HP Color LaserJet Pro M252 / MFP M274 / MFP M277 series'],
    CF402A: ['HP Color LaserJet Pro M252 / MFP M274 / MFP M277 series'],
    CF403A: ['HP Color LaserJet Pro M252 / MFP M274 / MFP M277 series'],
    // HP 131A
    CF210A: ['HP LaserJet Pro 200 color M251n', 'HP LaserJet Pro 200 color M251nw', 'HP LaserJet Pro 200 color MFP M276n', 'HP LaserJet Pro 200 color MFP M276nw'],
    CF211A: ['HP LaserJet Pro 200 color M251 / MFP M276 series'],
    CF212A: ['HP LaserJet Pro 200 color M251 / MFP M276 series'],
    CF213A: ['HP LaserJet Pro 200 color M251 / MFP M276 series'],
    // HP 415A
    W2030A: ['HP Color LaserJet Pro M454dn', 'HP Color LaserJet Pro M454dw', 'HP Color LaserJet Pro MFP M479fdn', 'HP Color LaserJet Pro MFP M479fdw', 'HP Color LaserJet Pro MFP M479fnw'],
    W2031A: ['HP Color LaserJet Pro M454 / MFP M479 series'],
    W2032A: ['HP Color LaserJet Pro M454 / MFP M479 series'],
    W2033A: ['HP Color LaserJet Pro M454 / MFP M479 series'],
    // HP 117A
    W2070A: ['HP Color Laser 150a', 'HP Color Laser 150nw', 'HP Color Laser MFP 178nw', 'HP Color Laser MFP 179fnw'],
    W2071A: ['HP Color Laser 150 / MFP 178 / MFP 179 series'],
    W2072A: ['HP Color Laser 150 / MFP 178 / MFP 179 series'],
    W2073A: ['HP Color Laser 150 / MFP 178 / MFP 179 series'],
    // HP 104A drum
    W1104A: ['HP LaserJet 107a', 'HP LaserJet 107w', 'HP LaserJet MFP 135a', 'HP LaserJet MFP 135w', 'HP LaserJet MFP 137fnw'],
    // HP 307A
    CE740A: ['HP Color LaserJet Enterprise CP5225', 'HP Color LaserJet Enterprise CP5225dn', 'HP Color LaserJet Enterprise CP5225n'],
    CE741A: ['HP Color LaserJet Enterprise CP5225 series'],
    CE742A: ['HP Color LaserJet Enterprise CP5225 series'],
    CE743A: ['HP Color LaserJet Enterprise CP5225 series'],
    // Canon C-EXV
    EXV54: [
        'Canon imageRUNNER ADVANCE C3025',
        'Canon imageRUNNER ADVANCE C3025i',
        'Canon imageRUNNER ADVANCE C3125i',
        'Canon imageRUNNER ADVANCE C3325i',
        'Canon imageRUNNER ADVANCE C3330i',
        'Canon imageRUNNER ADVANCE C3525i',
        'Canon imageRUNNER ADVANCE C3530i'
    ],
    EXV42: [
        'Canon imageRUNNER ADVANCE 4025',
        'Canon imageRUNNER ADVANCE 4035',
        'Canon imageRUNNER ADVANCE 4045',
        'Canon imageRUNNER ADVANCE 4051',
        'Canon imageRUNNER ADVANCE 4225',
        'Canon imageRUNNER ADVANCE 4235',
        'Canon imageRUNNER ADVANCE 4245',
        'Canon imageRUNNER ADVANCE 4251'
    ],
    C3025I: ['Canon imageRUNNER ADVANCE C3025i (waste toner / related consumable)']
};

/** Alias common retail numbers → OEM cartridge codes */
const TONER_SKU_ALIASES = {
    '05A': 'CE505A',
    '78A': 'CE278A',
    '55A': 'CE255A',
    '26A': 'CF226A',
    '83A': 'CE283A',
    '80A': 'CE280A',
    '59A': 'CF259A',
    '14A': 'CF214A',
    '85A': 'CE285A',
    '25X': 'CF325X',
    '37A': 'CF237A',
    '81A': 'CE281A',
    '32A': 'CF232A',
    '89A': 'CF289A',
    '305A': 'CE410A',
    '201A': 'CF400A',
    '131A': 'CF210A',
    '415A': 'W2030A',
    '117A': 'W2070A',
    '104A': 'W1104A',
    '307A': 'CE740A',
    'C-EXV54': 'EXV54',
    'C-EXV42': 'EXV42',
    'C EXV54': 'EXV54',
    'C EXV42': 'EXV42'
};

function extractTonerSkuTokens(itemName) {
    const name = String(itemName || '');
    const tokens = [];
    const oem = name.match(/\b([A-Z]{1,2}\d{3,4}[A-Z]?X?)\b/gi) || [];
    oem.forEach((t) => tokens.push(t.toUpperCase()));
    const retail = name.match(/\b(\d{2,3}A|\d{2}X)\b/gi) || [];
    retail.forEach((t) => tokens.push(t.toUpperCase()));
    const exv = name.match(/\b(?:C-?EXV|EXV)\s*(\d+)\b/gi) || [];
    exv.forEach((m) => {
        const num = m.replace(/[^\d]/g, '');
        if (num) tokens.push(`EXV${num}`);
    });
    if (/c3025i/i.test(name)) tokens.push('C3025I');
    return [...new Set(tokens)];
}

function normalizeTonerSkuKey(token) {
    const t = String(token || '').toUpperCase().replace(/\s+/g, '');
    if (TONER_PRINTER_COMPATIBILITY[t]) return t;
    if (TONER_SKU_ALIASES[t]) return TONER_SKU_ALIASES[t];
    // Color family: CE411A → still own key if present
    return t;
}

/**
 * @returns {{ sku: string, printers: string[] } | null}
 */
function lookupTonerCompatiblePrinters(itemName) {
    const tokens = extractTonerSkuTokens(itemName);
    for (const token of tokens) {
        const key = normalizeTonerSkuKey(token);
        const printers = TONER_PRINTER_COMPATIBILITY[key];
        if (printers?.length) {
            return { sku: key, printers: [...printers] };
        }
    }
    // Color siblings: if yellow CF402A missing, fall back to family black key when only retail number matched
    return null;
}

function formatTonerCompatibilityLines(itemName, limit = 8) {
    const hit = lookupTonerCompatiblePrinters(itemName);
    if (!hit) return null;
    const shown = hit.printers.slice(0, limit);
    const more = hit.printers.length - shown.length;
    return {
        sku: hit.sku,
        lines: shown,
        more: more > 0 ? more : 0,
        total: hit.printers.length
    };
}
