/* laptop-compare.js — ICT Equipment Compare: rank/pick laptops, desktops, servers, printers, etc. */

const ICT_COMPARE_COMMON_SPEC_ROWS = [
    { label: 'Model', re: /^model$/i },
    { label: 'Processor', re: /processor|cpu/i },
    { label: 'Graphics', re: /graphics|gpu/i },
    { label: 'Operating System', re: /operating system|^os$/i },
    { label: 'Display', re: /display|screen/i },
    { label: 'Memory', re: /^(ram|memory)$/i },
    { label: 'Storage', re: /storage|boot storage|internal storage/i },
    { label: 'Keyboard', re: /keyboard/i },
    { label: 'Pointing Device', re: /pointing|touchpad|imagepad|trackpad|clickpad/i },
    { label: 'WebCam', re: /webcam|camera|true vision/i },
    { label: 'Battery', re: /battery/i },
    { label: 'Ports', re: /ports?|connectivity|i\/o|network$/i },
    { label: 'Security', re: /security|tpm/i }
];

const ICT_COMPARE_SERVER_SPEC_ROWS = [
    { label: 'Model', re: /^model$/i },
    { label: 'Form Factor', re: /form factor|chassis|rack/i },
    { label: 'Processor', re: /processor|cpu|xeon/i },
    { label: 'Memory', re: /^(ram|memory)$|memory channels/i },
    { label: 'Boot Storage', re: /boot storage/i },
    { label: 'Internal Storage', re: /internal storage|storage/i },
    { label: 'RAID / Storage Controller', re: /raid|storage controller/i },
    { label: 'Graphics / GPUs', re: /graphics|gpu/i },
    { label: 'Network', re: /network|ethernet|nic/i },
    { label: 'Power Supply', re: /power supply|psu/i },
    { label: 'Remote Management', re: /remote management|ilo|idrac|imm|xclarity/i },
    { label: 'Operating System', re: /operating system|^os$/i },
    { label: 'Warranty', re: /warranty/i }
];

const ICT_COMPARE_PRINTER_SPEC_ROWS = [
    { label: 'Model', re: /^model$/i },
    { label: 'Print Technology', re: /print technology|technology|laser|inkjet/i },
    { label: 'Functions', re: /functions|print.*copy.*scan|mfp/i },
    { label: 'Print Speed', re: /print speed|ppm|ipm/i },
    { label: 'Resolution', re: /resolution|dpi/i },
    { label: 'Paper Size', re: /paper|media size|a4|a3/i },
    { label: 'Duplex', re: /duplex|two.?sided/i },
    { label: 'Duty Cycle', re: /duty cycle|monthly/i },
    { label: 'Connectivity', re: /connectivity|ports?|wifi|ethernet|usb/i },
    { label: 'Tray / Capacity', re: /tray|capacity|input/i },
    { label: 'Warranty', re: /warranty/i }
];

const ICT_COMPARE_NETWORK_SPEC_ROWS = [
    { label: 'Model', re: /^model$/i },
    { label: 'Device Type', re: /device type|type|switch|router|firewall|access point/i },
    { label: 'Ports', re: /ports?|interfaces/i },
    { label: 'Speed / Throughput', re: /speed|throughput|gbps|mbps/i },
    { label: 'PoE', re: /poe|power over ethernet/i },
    { label: 'Management', re: /management|controller|cli|gui/i },
    { label: 'Security', re: /security|firewall|vpn|acl/i },
    { label: 'Warranty', re: /warranty/i }
];

const ICT_COMPARE_CATEGORY_META = {
    laptop: {
        label: 'Laptop',
        singular: 'laptop',
        productType: 'laptop',
        invKeys: ['inv-laptops', 'ict-equipment'],
        nameRe: /\b(laptop|notebook|macbook|omnibook|elitebook|probook|thinkpad|latitude|vostro|xps|zbook|surface\s*laptop|yoga|legion|omen|victus|transcend|toughbook|firefly|vivobook|expertbook|travelmate|alienware)\b/i,
        example: 'Victus, OMEN, EliteBook',
        showRamStorage: true,
        rows: ICT_COMPARE_COMMON_SPEC_ROWS
    },
    desktop: {
        label: 'Desktop / workstation',
        singular: 'desktop',
        productType: 'desktop',
        invKeys: ['inv-desktops', 'ict-equipment'],
        nameRe: /\b(desktop|optiplex|elitedesk|prodesk|thinkcentre|workstation|z2|precision|all-?in-?one|imac|mac\s*mini|tower|sff|tiny)\b/i,
        example: 'OptiPlex, EliteDesk, ThinkCentre',
        showRamStorage: true,
        rows: ICT_COMPARE_COMMON_SPEC_ROWS.filter((r) => !/battery|webcam|keyboard|pointing/i.test(r.label))
    },
    server: {
        label: 'Server',
        singular: 'server',
        productType: 'server',
        invKeys: ['inv-servers', 'ict-equipment'],
        nameRe: /\b(server|proliant|poweredge|thinksystem|dl\d+|ml\d+|r\d{3,4}|tower server|rack)\b/i,
        example: 'DL380, PowerEdge, ThinkSystem',
        showRamStorage: true,
        rows: ICT_COMPARE_SERVER_SPEC_ROWS
    },
    printer: {
        label: 'Printer / MFP',
        singular: 'printer',
        productType: 'printer',
        invKeys: ['inv-printers', 'ict-equipment'],
        nameRe: /\b(printer|mfp|laserjet|imagerunner|ecotank|designjet|photocopier|pagewide|bizhub|workcentre)\b/i,
        example: 'LaserJet, imageRUNNER, EcoTank',
        showRamStorage: false,
        rows: ICT_COMPARE_PRINTER_SPEC_ROWS
    },
    tablet: {
        label: 'Tablet',
        singular: 'tablet',
        productType: 'tablet',
        invKeys: ['ict-equipment'],
        nameRe: /\b(tablet|ipad|galaxy\s*tab|surface\s*go|surface\s*pro|toughpad)\b/i,
        example: 'iPad, Galaxy Tab, Surface',
        showRamStorage: true,
        rows: ICT_COMPARE_COMMON_SPEC_ROWS
    },
    network: {
        label: 'Network equipment',
        singular: 'network device',
        productType: 'network',
        invKeys: ['ict-equipment'],
        nameRe: /\b(switch|router|firewall|access\s*point|catalyst|meraki|fortigate|aruba|ubiquiti|wifi|wlan)\b/i,
        example: 'Catalyst, FortiGate, Aruba AP',
        showRamStorage: false,
        rows: ICT_COMPARE_NETWORK_SPEC_ROWS
    },
    other: {
        label: 'Other ICT equipment',
        singular: 'ICT item',
        productType: 'other',
        invKeys: ['ict-equipment'],
        nameRe: /./i,
        example: 'UPS, scanner, projector',
        showRamStorage: true,
        rows: [
            { label: 'Model', re: /^model$/i },
            { label: 'Device Type', re: /device type|type/i },
            { label: 'Processor', re: /processor|cpu/i },
            { label: 'Memory', re: /^(ram|memory)$/i },
            { label: 'Storage', re: /storage/i },
            { label: 'Connectivity', re: /connectivity|ports?|network/i },
            { label: 'Operating System', re: /operating system|^os$/i },
            { label: 'Warranty', re: /warranty/i }
        ]
    }
};

/** @deprecated kept as alias for older call sites */
const LAPTOP_COMPARE_SIDE_SPEC_ROWS = ICT_COMPARE_COMMON_SPEC_ROWS;

const laptopCompareState = {
    items: [],
    scored: [],
    dutyKey: '',
    category: 'laptop',
    brand: 'Any',
    minRam: 'any',
    minStorage: 'any',
    winner: null,
    pickMode: false,
    marketCandidates: [],
    marketSelected: new Set()
};

const LAPTOP_COMPARE_PICK_IDS = ['laptopComparePickA', 'laptopComparePickB', 'laptopComparePickC'];
const LAPTOP_COMPARE_NAME_RE = ICT_COMPARE_CATEGORY_META.laptop.nameRe;

function getLaptopCompareCategory() {
    const el = document.getElementById('laptopCompareCategory');
    const raw = el?.value || laptopCompareState.category || 'laptop';
    return ICT_COMPARE_CATEGORY_META[raw] ? raw : 'laptop';
}

function getLaptopCompareCategoryMeta(cat = getLaptopCompareCategory()) {
    return ICT_COMPARE_CATEGORY_META[cat] || ICT_COMPARE_CATEGORY_META.laptop;
}

function getLaptopCompareSideSpecRows(cat = getLaptopCompareCategory()) {
    return getLaptopCompareCategoryMeta(cat).rows || ICT_COMPARE_COMMON_SPEC_ROWS;
}

function laptopCmpEsc(v) {
    return String(v ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function fillLaptopCompareDutySelect() {
    const el = document.getElementById('laptopCompareDuty');
    if (!el || typeof laptopDutyProfileOptions !== 'function') return;
    const keep = el.value || laptopCompareState.dutyKey;
    const opts = laptopDutyProfileOptions().filter((o) => o.value !== 'any');
    const groups = {};
    const order = [];
    opts.forEach((o) => {
        const g = o.group || 'Other';
        if (!groups[g]) {
            groups[g] = [];
            order.push(g);
        }
        groups[g].push(o);
    });
    el.innerHTML = order.map((g) => (
        `<optgroup label="${laptopCmpEsc(g)}">${groups[g].map((o) => (
            `<option value="${laptopCmpEsc(o.value)}">${laptopCmpEsc(o.label)}</option>`
        )).join('')}</optgroup>`
    )).join('');
    if (keep && [...el.options].some((o) => o.value === keep)) el.value = keep;
    mountLaptopCompareTypeableSelects();
}

function mountLaptopCompareTypeableSelects() {
    const meta = getLaptopCompareCategoryMeta();
    const noun = meta.singular || 'item';
    const mounts = [
        ['laptopCompareDuty', 'Type or pick duty profile'],
        ['laptopCompareBrand', 'Type or pick brand'],
        ['laptopCompareMinRam', 'Type or pick minimum RAM'],
        ['laptopCompareMinStorage', 'Type or pick minimum storage'],
        ['laptopComparePickA', `Type or pick ${noun} A (e.g. ${meta.example.split(',')[0].trim()})`],
        ['laptopComparePickB', `Type or pick ${noun} B`],
        ['laptopComparePickC', `Type or pick ${noun} C`]
    ];
    mounts.forEach(([id, placeholder]) => {
        const el = document.getElementById(id);
        if (el && typeof mountTypeableSelect === 'function') {
            mountTypeableSelect(el, {
                placeholder,
                allowCustom: true,
                maxItems: id.startsWith('laptopComparePick') ? 400 : 200
            });
        }
    });
}

function listLaptopComparePickOptions() {
    const cat = getLaptopCompareCategory();
    const meta = getLaptopCompareCategoryMeta(cat);
    const byKey = new Map();
    const add = (value, label) => {
        const text = String(label || '').trim();
        if (!text) return;
        const key = text.toLowerCase().replace(/\s+/g, ' ');
        if (byKey.has(key)) return;
        byKey.set(key, { value: String(value || text), label: text });
    };

    const catalog = typeof getEnrichedProductCatalog === 'function'
        ? getEnrichedProductCatalog()
        : (typeof PRODUCT_SPECS_CATALOG !== 'undefined' ? PRODUCT_SPECS_CATALOG : []);
    (catalog || []).forEach((p) => {
        const pCat = String(p.category || '').toLowerCase();
        if (cat !== 'other' && pCat !== cat) return;
        if (cat === 'other' && ['laptop', 'desktop', 'server', 'printer', 'tablet', 'network'].includes(pCat)) return;
        const title = `${p.brand || ''} ${p.model || ''}`.trim();
        add(p.id, title);
        (p.names || []).forEach((n) => {
            const name = String(n || '').trim();
            if (!name || name.toLowerCase() === title.toLowerCase()) return;
            add(`${p.id}::${name}`, name);
        });
    });

    const invKeys = meta.invKeys || ['ict-equipment'];
    const seenInv = new Set();
    invKeys.forEach((key) => {
        const invPool = typeof getCatalogItemsForCategory === 'function'
            ? (getCatalogItemsForCategory(key) || [])
            : [];
        invPool.forEach((item) => {
            const name = String(item.name || '').trim();
            if (!name || seenInv.has(item.id)) return;
            if (cat !== 'other' && meta.nameRe && !meta.nameRe.test(name)) return;
            seenInv.add(item.id);
            add(`inv:${item.id}`, name);
        });
    });

    return [
        { value: '', label: `— Type or pick a ${meta.singular} —` },
        ...[...byKey.values()].sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }))
    ];
}

function syncLaptopCompareCategoryUi() {
    const cat = getLaptopCompareCategory();
    const meta = getLaptopCompareCategoryMeta(cat);
    laptopCompareState.category = cat;
    const hint = document.getElementById('laptopComparePickHint');
    if (hint) {
        hint.innerHTML = `Type part of a name (e.g. <strong>${laptopCmpEsc(meta.example)}</strong>) or open the list — choose up to three ${laptopCmpEsc(meta.label.toLowerCase())} items.`;
    }
    ['A', 'B', 'C'].forEach((letter) => {
        const label = document.getElementById(`laptopComparePick${letter}Label`);
        if (label) label.textContent = `${meta.label.split('/')[0].trim()} ${letter}`;
    });
    const showRam = !!meta.showRamStorage;
    document.getElementById('laptopCompareMinRamWrap')?.toggleAttribute('hidden', !showRam);
    document.getElementById('laptopCompareMinStorageWrap')?.toggleAttribute('hidden', !showRam);
    fillLaptopComparePickSelects();
    const body = document.getElementById('laptopCompareTableBody');
    if (body && !laptopCompareState.items.length) {
        body.innerHTML = `<tr><td colspan="2" class="req-empty-row">Rank or pick ${laptopCmpEsc(meta.singular)}s to compare.</td></tr>`;
    }
}

function fillLaptopComparePickSelects() {
    const options = listLaptopComparePickOptions();
    const html = options.map((o) => (
        `<option value="${laptopCmpEsc(o.value)}">${laptopCmpEsc(o.label)}</option>`
    )).join('');
    LAPTOP_COMPARE_PICK_IDS.forEach((id) => {
        const el = document.getElementById(id);
        if (!el) return;
        const keep = el.value;
        el.innerHTML = html;
        if (keep && [...el.options].some((o) => o.value === keep)) el.value = keep;
        else el.value = '';
    });
    mountLaptopCompareTypeableSelects();
}

function resolveLaptopComparePick(selectEl) {
    if (!selectEl) return null;
    if (typeof resolveTypeableSelectInput === 'function') resolveTypeableSelectInput(selectEl);
    const value = String(selectEl.value || '').trim();
    const typed = String(selectEl._typeable?.input?.value || '').trim();
    const label = typed || ([...selectEl.options].find((o) => o.value === value)?.textContent || '').trim();
    if (!value && !label) return null;
    return { value, label };
}

function productFromLaptopComparePick(pick) {
    if (!pick) return null;
    const value = String(pick.value || '').trim();
    const label = String(pick.label || '').trim();

    if (value && !value.startsWith('inv:')) {
        const productId = value.includes('::') ? value.split('::')[0] : value;
        const catalog = typeof getEnrichedProductCatalog === 'function'
            ? getEnrichedProductCatalog()
            : (typeof PRODUCT_SPECS_CATALOG !== 'undefined' ? PRODUCT_SPECS_CATALOG : []);
        const hit = (catalog || []).find((p) => p.id === productId);
        if (hit) return typeof enrichCatalogProduct === 'function' ? enrichCatalogProduct(hit) : hit;
    }

    const query = label || value.replace(/^inv:/, '');
    if (query && typeof findProductInCatalog === 'function') {
        const found = findProductInCatalog(query, { minScore: 55 });
        if (found?.product) {
            return typeof enrichCatalogProduct === 'function'
                ? enrichCatalogProduct(found.product)
                : found.product;
        }
    }

    if (value.startsWith('inv:') || label) {
        const title = label || value.replace(/^inv:/, '');
        const meta = getLaptopCompareCategoryMeta();
        return {
            id: value.startsWith('inv:') ? value.slice(4) : `pick-${title.toLowerCase().replace(/\W+/g, '-').slice(0, 40)}`,
            brand: title.split(/\s+/)[0] || '',
            model: title,
            category: meta.productType,
            names: [title],
            specs: [
                ['Device Type', `${meta.label} (inventory / name pick)`, 'Confirm full specs on quotation'],
                ['Model', title, 'Selected for direct compare']
            ]
        };
    }
    return null;
}

function readLaptopComparePicks() {
    return LAPTOP_COMPARE_PICK_IDS
        .map((id) => resolveLaptopComparePick(document.getElementById(id)))
        .filter(Boolean);
}

function clearLaptopComparePicks() {
    LAPTOP_COMPARE_PICK_IDS.forEach((id) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.value = '';
        if (el._typeable?.input) el._typeable.input.value = '';
        if (typeof syncTypeableSelectFromNative === 'function') {
            try { syncTypeableSelectFromNative(el); } catch (_) { /* ignore */ }
        }
    });
    setLaptopCompareStatus('Cleared model picks.', 'info');
}

function laptopCompareWantWeb() {
    return !!document.getElementById('laptopCompareUseWeb')?.checked;
}

function laptopCompareWantAi() {
    return !!document.getElementById('laptopCompareUseAi')?.checked;
}

function setLaptopCompareAiAdvice(html, { hidden = false } = {}) {
    const el = document.getElementById('laptopCompareAiAdvice');
    if (!el) return;
    if (hidden || !html) {
        el.hidden = true;
        el.innerHTML = '';
        return;
    }
    el.hidden = false;
    el.innerHTML = html;
}

function normalizeEnrichSpecs(raw) {
    if (!Array.isArray(raw)) return [];
    return raw.map((row) => {
        if (Array.isArray(row)) {
            return [String(row[0] || '').trim(), String(row[1] || '').trim(), String(row[2] || '').trim()];
        }
        if (row && typeof row === 'object') {
            return [
                String(row.name || row.label || row[0] || '').trim(),
                String(row.value || row[1] || '').trim(),
                String(row.note || row[2] || '').trim()
            ];
        }
        return ['', '', ''];
    }).filter(([label, value]) => label && value);
}

function mergeSpecsPreferEnrich(localSpecs, enrichSpecs) {
    const out = [];
    const byKey = new Map();
    const push = (triple) => {
        const [label, value, note] = triple;
        if (!label || !value) return;
        const key = label.toLowerCase();
        if (byKey.has(key)) {
            const idx = byKey.get(key);
            const prev = out[idx];
            const prevWeak = !prev[1] || prev[1] === '—' || /typical|options|config|confirm/i.test(prev[1]);
            if (prevWeak || value.length > String(prev[1] || '').length) {
                out[idx] = [label, value, note || prev[2] || ''];
            }
            return;
        }
        byKey.set(key, out.length);
        out.push([label, value, note || '']);
    };
    (localSpecs || []).forEach((s) => push(Array.isArray(s) ? s : [s?.[0], s?.[1], s?.[2]]));
    normalizeEnrichSpecs(enrichSpecs).forEach(push);
    return out;
}

function applyWebEnrichToCompareItem(item, payload) {
    if (!item || !payload?.ok) return item;
    const enrichSpecs = normalizeEnrichSpecs(payload.specs);
    const localSpecs = item.product?.specs || [];
    const merged = mergeSpecsPreferEnrich(localSpecs, enrichSpecs);
    const brand = payload.brand || item.product?.brand || '';
    const model = payload.model || item.product?.model || item.title || '';
    item.product = {
        ...(item.product || {}),
        id: item.product?.id || `web-${productWebCacheKey?.(item.title) || item.title}`,
        brand,
        model,
        category: payload.category || item.product?.category || 'laptop',
        specs: merged
    };
    item.snippet = merged
        .filter(([label]) => /processor|memory|^ram$|storage|graphics|display/i.test(label))
        .slice(0, 3)
        .map(([, value]) => value)
        .join(' · ') || item.snippet;
    item.source = payload.ai ? 'web+ai' : 'web';
    item.imageUrl = payload.imageUrl || item.imageUrl || '';
    item.datasheetUrl = payload.datasheetUrl || item.datasheetUrl || '';
    item.webSources = payload.sources || [];
    item.catalogReasons = [
        ...(item.catalogReasons || []).filter((r) => !/web|crawl|ai enrich/i.test(r)),
        payload.ai ? 'Web crawl + AI spec enrich' : 'Web crawl enrich'
    ];
    if (item.catalogScore == null || item.catalogScore < 70) item.catalogScore = 72;
    return item;
}

async function enrichLaptopCompareItemsFromWeb(items, { force = false } = {}) {
    const list = Array.isArray(items) ? items : [];
    if (!list.length) return { enriched: 0, failed: 0 };
    if (typeof fetchProductWebEnrich !== 'function') {
        throw new Error('Web enrich module not loaded.');
    }
    let enriched = 0;
    let failed = 0;
    for (let i = 0; i < list.length; i += 1) {
        const item = list[i];
        const query = item.title || `${item.product?.brand || ''} ${item.product?.model || ''}`.trim();
        if (!query) {
            failed += 1;
            continue;
        }
        setLaptopCompareStatus(`Web-crawling specs ${i + 1}/${list.length}: ${query}…`, 'info');
        try {
            const payload = await fetchProductWebEnrich(query, { force });
            if (payload?.ok) {
                applyWebEnrichToCompareItem(item, payload);
                enriched += 1;
            } else {
                failed += 1;
            }
        } catch (_) {
            failed += 1;
        }
    }
    return { enriched, failed };
}

function buildLaptopCompareAiQuestion(scored, profile) {
    const duty = profile?.label || profile?.groupLabel || 'general ICT duty';
    const lines = (scored || []).slice(0, 5).map((s, i) => {
        const row = s.row;
        const specs = getLaptopCompareSideSpecRows().map(({ label, re }) => {
            const val = laptopCompareSpecFromProduct(row.product, re);
            return val && val !== '—' ? `${label}: ${val}` : null;
        }).filter(Boolean).join('; ');
        return `${i + 1}. ${row.title} (buy score ${s.buy}, spec ${s.fit})${specs ? ` — ${specs}` : ''}`;
    });
    const meta = getLaptopCompareCategoryMeta();
    return (
        `For ZNA IT-DIR Tech Stores procurement, recommend which ${meta.singular} to buy for duty “${duty}”. `
        + 'Give a clear winner, why it wins, and any risks (SKU variance, domain OS, rugged/enterprise needs). '
        + 'Use only the comparison facts below; do not invent exact prices.\n\n'
        + lines.join('\n')
    );
}

function buildLaptopCompareAiContext(scored, profile) {
    return {
        module: 'laptop-compare',
        equipmentType: getLaptopCompareCategory(),
        dutyProfile: profile?.key || profile?.label || '',
        dutySummary: profile?.summary || '',
        comparison: (scored || []).slice(0, 5).map((s) => ({
            title: s.row.title,
            buyScore: s.buy,
            specScore: s.fit,
            source: s.row.source,
            specs: Object.fromEntries(
                getLaptopCompareSideSpecRows().map(({ label, re }) => [
                    label,
                    laptopCompareSpecFromProduct(s.row.product, re)
                ])
            )
        }))
    };
}

async function askLaptopCompareAiRecommendation() {
    if (!laptopCompareState.scored.length) {
        setLaptopCompareStatus('Compare or rank laptops first, then ask AI.', 'warn');
        return;
    }
    const btn = document.getElementById('laptopCompareAiBtn');
    if (btn) { btn.disabled = true; btn.textContent = 'AI thinking…'; }
    setLaptopCompareStatus('Asking AI for buy recommendation…', 'info');
    const profile = typeof getLaptopDutyProfile === 'function'
        ? getLaptopDutyProfile(laptopCompareState.dutyKey)
        : null;
    const question = buildLaptopCompareAiQuestion(laptopCompareState.scored, profile);
    const context = {
        ...(typeof buildStoresAssistantContext === 'function' ? buildStoresAssistantContext() : {}),
        ...buildLaptopCompareAiContext(laptopCompareState.scored, profile)
    };
    try {
        let data = null;
        if (typeof askStoresAssistant === 'function') {
            // Prefer dedicated ask with our richer context via API directly
            const apiBase = typeof API_BASE === 'string' ? API_BASE : '';
            const res = await fetch(`${apiBase}/api/ai/ask`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question, context })
            });
            data = await res.json();
            if (!res.ok || !data?.ok) {
                data = await askStoresAssistant(question);
            }
        } else {
            throw new Error('AI assistant not loaded.');
        }
        const answer = String(data.answer || '').trim();
        if (!answer) throw new Error('AI returned an empty recommendation.');
        setLaptopCompareAiAdvice(
            `<strong>AI recommendation ${data.ai ? '(model)' : '(heuristic)'}</strong>`
            + laptopCmpEsc(answer).replace(/\n/g, '<br>')
        );
        setLaptopCompareStatus(
            data.ai
                ? 'AI recommendation ready — review against quotation/datasheet.'
                : 'Heuristic recommendation ready (set OPENAI_API_KEY on the server for full AI).',
            data.ai ? 'ok' : 'warn'
        );
    } catch (err) {
        setLaptopCompareAiAdvice('', { hidden: true });
        setLaptopCompareStatus(err.message || 'AI recommendation failed.', 'error');
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'AI recommend winner'; }
    }
}

async function enrichCurrentLaptopCompareFromWeb() {
    if (!laptopCompareState.items.length) {
        setLaptopCompareStatus('Compare or rank laptops first, then enrich from web.', 'warn');
        return;
    }
    const btn = document.getElementById('laptopCompareEnrichBtn');
    if (btn) { btn.disabled = true; btn.textContent = 'Crawling…'; }
    try {
        const { enriched, failed } = await enrichLaptopCompareItemsFromWeb(laptopCompareState.items, { force: true });
        renderLaptopCompareResults();
        setLaptopCompareStatus(
            enriched
                ? `Web-enriched ${enriched} laptop(s)${failed ? ` · ${failed} failed` : ''}. Table updated.`
                : 'No web specs found — check internet or use a more specific model name.',
            enriched ? 'ok' : 'warn'
        );
    } catch (err) {
        setLaptopCompareStatus(err.message || 'Web enrich failed.', 'error');
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'Enrich current from web'; }
    }
}

async function comparePickedLaptops() {
    const picks = readLaptopComparePicks();
    const meta = getLaptopCompareCategoryMeta();
    if (picks.length < 2) {
        setLaptopCompareStatus(`Pick at least two ${meta.singular}s from the lists (e.g. ${meta.example}).`, 'error');
        return;
    }

    const criteria = readLaptopCompareCriteria();
    const profile = typeof getLaptopDutyProfile === 'function'
        ? getLaptopDutyProfile(criteria.dutyProfile)
        : null;
    const cat = getLaptopCompareCategory();

    const seen = new Set();
    const items = [];
    picks.forEach((pick) => {
        const product = productFromLaptopComparePick(pick);
        if (!product) return;
        product.category = product.category || meta.productType;
        const title = `${product.brand || ''} ${product.model || ''}`.trim() || pick.label;
        const key = title.toLowerCase();
        if (seen.has(key)) return;
        seen.add(key);
        items.push(catalogHitToCompareItem({
            product,
            score: 78,
            reasons: ['Selected for direct name compare']
        }));
    });

    if (items.length < 2) {
        setLaptopCompareStatus('Could not resolve two distinct models — try picking from the dropdown list.', 'error');
        return;
    }

    laptopCompareState.dutyKey = criteria.dutyProfile || laptopCompareState.dutyKey;
    laptopCompareState.category = cat;
    laptopCompareState.brand = criteria.brand;
    laptopCompareState.minRam = criteria.minRamGb;
    laptopCompareState.minStorage = criteria.minStorageGb;
    laptopCompareState.pickMode = true;
    laptopCompareState.items = items;
    setLaptopCompareAiAdvice('', { hidden: true });
    renderLaptopCompareResults();

    const btn = document.getElementById('laptopComparePickedBtn');
    if (btn) { btn.disabled = true; btn.textContent = 'Comparing…'; }

    let enrichNote = '';
    try {
        if (laptopCompareWantWeb()) {
            const { enriched, failed } = await enrichLaptopCompareItemsFromWeb(items, { force: false });
            if (enriched) {
                enrichNote = ` · web-enriched ${enriched}${failed ? ` (${failed} missed)` : ''}`;
                renderLaptopCompareResults();
            } else if (failed) {
                enrichNote = ' · web crawl found no extra specs';
            }
        }

        const dutyBit = profile ? ` for ${profile.label}` : '';
        setLaptopCompareStatus(
            `Comparing ${items.length} ${meta.singular}(s)${dutyBit}: ${items.map((r) => r.title).join(' · ')}${enrichNote}.`,
            'ok'
        );

        if (laptopCompareWantAi()) {
            await askLaptopCompareAiRecommendation();
        }
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'Compare selected'; }
    }
}
function fillLaptopCompareFacets() {
    const facets = typeof SPEC_SEARCH_FACETS !== 'undefined' ? SPEC_SEARCH_FACETS : null;
    if (!facets) return;

    const fill = (id, options) => {
        const el = document.getElementById(id);
        if (!el || !options?.length) return;
        if (typeof options[0] === 'string') {
            el.innerHTML = options.map((b) => (
                `<option value="${laptopCmpEsc(b)}">${laptopCmpEsc(b === 'Any' ? 'Any brand' : b)}</option>`
            )).join('');
            return;
        }
        el.innerHTML = options.map((o) => (
            `<option value="${laptopCmpEsc(o.value)}">${laptopCmpEsc(o.label)}</option>`
        )).join('');
    };

    fill('laptopCompareBrand', facets.brands || ['Any']);
    fill('laptopCompareMinRam', facets.ramOptions || [{ value: 'any', label: 'Any' }]);
    fill('laptopCompareMinStorage', facets.storageOptions || [{ value: 'any', label: 'Any' }]);
    mountLaptopCompareTypeableSelects();
}

function updateLaptopCompareDutyHint() {
    const hint = document.getElementById('laptopCompareDutyHint');
    const profile = typeof getLaptopDutyProfile === 'function'
        ? getLaptopDutyProfile(document.getElementById('laptopCompareDuty')?.value)
        : null;
    if (!hint) return;
    if (!profile) {
        hint.textContent = '';
        hint.hidden = true;
        return;
    }
    const cat = getLaptopCompareCategory();
    const deviceHint = typeof dutyProfileDeviceHint === 'function'
        ? dutyProfileDeviceHint(profile, cat)
        : (profile.deviceHint || '');
    hint.hidden = false;
    hint.textContent = `${profile.groupLabel}: ${profile.summary} ${deviceHint}`.trim();
}

function buildLaptopCompareOnlineQuery() {
    const criteria = readLaptopCompareCriteria();
    const meta = getLaptopCompareCategoryMeta();
    const profile = typeof getLaptopDutyProfile === 'function'
        ? getLaptopDutyProfile(criteria.dutyProfile)
        : null;
    const brand = criteria.brand && criteria.brand !== 'Any' ? criteria.brand : '';
    const dutyQuery = typeof dutyProfileWebQuery === 'function' && profile
        ? dutyProfileWebQuery(profile, meta.productType)
        : `${meta.singular} ${meta.label}`;
    return [brand, dutyQuery].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
}

function renderLaptopCompareMarketGrid() {
    const panel = document.getElementById('laptopCompareMarketPanel');
    const grid = document.getElementById('laptopCompareMarketGrid');
    const heading = document.getElementById('laptopCompareMarketHeading');
    const meta = getLaptopCompareCategoryMeta();
    if (!panel || !grid) return;

    const rows = laptopCompareState.marketCandidates || [];
    panel.hidden = !rows.length;
    if (heading) heading.textContent = `Online ${meta.label} listings (${rows.length})`;
    if (!rows.length) {
        grid.innerHTML = '';
        return;
    }

    grid.innerHTML = rows.map((row, idx) => {
        const checked = laptopCompareState.marketSelected.has(row.id) ? ' checked' : '';
        const img = typeof marketCardImageHtml === 'function'
            ? marketCardImageHtml(row, laptopCmpEsc)
            : (row.imageUrl
                ? `<img src="${laptopCmpEsc(row.imageUrl)}" alt="" class="market-card-img" loading="lazy" referrerpolicy="no-referrer">`
                : `<div class="market-card-img market-card-img-placeholder" aria-hidden="true">${laptopCmpEsc((row.title || '?').slice(0, 1))}</div>`);
        const price = row.priceDisplay || row.priceText
            ? `<p class="market-card-price">${laptopCmpEsc(row.priceDisplay || row.priceText)}</p>`
            : '<p class="market-card-price">Price on request</p>';
        const src = row.source === 'manufacturer' ? 'Official' : (row.source === 'local' ? 'Local' : 'Web');
        const link = row.url
            ? `<a href="${laptopCmpEsc(row.url)}" target="_blank" rel="noopener noreferrer" class="market-card-link">View listing ↗</a>`
            : '';
        return `
            <article class="market-card laptop-compare-market-card" data-market-cand="${idx}">
                <label class="laptop-compare-market-check">
                    <input type="checkbox" data-market-cand-check="${laptopCmpEsc(row.id)}"${checked}>
                    Select
                </label>
                <div class="market-card-media">${img}</div>
                <div class="market-card-body">
                    <div class="market-card-badges"><span class="market-badge market-badge-web">${laptopCmpEsc(src)}</span></div>
                    <h4 class="market-card-title">${laptopCmpEsc(row.title || 'Unnamed')}</h4>
                    ${row.subtitle ? `<p class="market-card-series">${laptopCmpEsc(row.subtitle)}</p>` : ''}
                    ${price}
                    ${row.snippet ? `<p class="market-card-snippet">${laptopCmpEsc(row.snippet)}</p>` : ''}
                    <div class="market-card-actions">${link}</div>
                </div>
            </article>`;
    }).join('');

    grid.querySelectorAll('[data-market-cand-check]').forEach((box) => {
        box.addEventListener('change', () => {
            const id = box.getAttribute('data-market-cand-check');
            if (!id) return;
            if (box.checked) laptopCompareState.marketSelected.add(id);
            else laptopCompareState.marketSelected.delete(id);
        });
    });
}

function clearLaptopCompareMarketListings() {
    laptopCompareState.marketCandidates = [];
    laptopCompareState.marketSelected = new Set();
    renderLaptopCompareMarketGrid();
    setLaptopCompareStatus('Cleared online listings.', 'info');
}

async function searchOnlineIctListings({ force = true } = {}) {
    const criteria = readLaptopCompareCriteria();
    const meta = getLaptopCompareCategoryMeta();
    const profile = typeof getLaptopDutyProfile === 'function'
        ? getLaptopDutyProfile(criteria.dutyProfile)
        : null;
    if (!profile) {
        setLaptopCompareStatus('Select a duty profile first, then search online.', 'error');
        return;
    }
    if (typeof fetchMarketCatalog !== 'function') {
        setLaptopCompareStatus('Market catalog unavailable.', 'error');
        return;
    }

    const query = buildLaptopCompareOnlineQuery();
    const btn = document.getElementById('laptopCompareSearchOnlineBtn');
    if (btn) { btn.disabled = true; btn.textContent = 'Searching online…'; }
    setLaptopCompareStatus(`Searching online for ${meta.label}: “${query}”…`, 'info');

    try {
        const marketCat = ['laptop', 'desktop', 'tablet', 'printer', 'server'].includes(meta.productType)
            ? meta.productType
            : (meta.productType === 'network' ? 'network' : 'laptop');
        const result = await fetchMarketCatalog(query, marketCat === 'network' ? 'laptop' : marketCat, { force });
        const webItems = (result.items || []).map((row) => {
            const item = marketRowToCompareItem(row);
            if (!item.id) item.id = `web-${(item.title || Math.random()).toString().toLowerCase().replace(/\W+/g, '-').slice(0, 48)}`;
            if (item.product) item.product.category = meta.productType;
            else {
                item.product = {
                    category: meta.productType,
                    brand: '',
                    model: item.title || '',
                    specs: []
                };
            }
            return item;
        });

        laptopCompareState.dutyKey = criteria.dutyProfile;
        laptopCompareState.category = getLaptopCompareCategory();
        laptopCompareState.marketCandidates = webItems;
        laptopCompareState.marketSelected = new Set(webItems.slice(0, Math.min(3, webItems.length)).map((r) => r.id));
        renderLaptopCompareMarketGrid();

        setLaptopCompareStatus(
            webItems.length
                ? `Found ${webItems.length} online ${meta.singular} listing(s). Tick 2+ then Compare checked listings.`
                : `No online ${meta.singular} listings found — try another duty/brand or Force with Add more market listings.`,
            webItems.length ? 'ok' : 'warn'
        );
    } catch (err) {
        setLaptopCompareStatus(err.message || 'Online search failed.', 'error');
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'Search online listings'; }
    }
}

async function compareCheckedMarketListings() {
    const selected = (laptopCompareState.marketCandidates || [])
        .filter((row) => laptopCompareState.marketSelected.has(row.id));
    if (selected.length < 2) {
        setLaptopCompareStatus('Tick at least two online listings to compare.', 'error');
        return;
    }

    const criteria = readLaptopCompareCriteria();
    const meta = getLaptopCompareCategoryMeta();
    laptopCompareState.dutyKey = criteria.dutyProfile || laptopCompareState.dutyKey;
    laptopCompareState.category = getLaptopCompareCategory();
    laptopCompareState.brand = criteria.brand;
    laptopCompareState.pickMode = true;
    laptopCompareState.items = selected.map((row) => ({
        ...row,
        catalogScore: row.catalogScore || 70,
        catalogReasons: [...(row.catalogReasons || []), 'Selected from online listings']
    }));
    setLaptopCompareAiAdvice('', { hidden: true });
    renderLaptopCompareResults();

    const btn = document.getElementById('laptopCompareMarketCompareBtn');
    if (btn) { btn.disabled = true; btn.textContent = 'Comparing…'; }
    try {
        if (laptopCompareWantWeb()) {
            await enrichLaptopCompareItemsFromWeb(laptopCompareState.items, { force: false });
            renderLaptopCompareResults();
        }
        setLaptopCompareStatus(
            `Comparing ${selected.length} online ${meta.singular}(s): ${selected.map((r) => r.title).join(' · ')}.`,
            'ok'
        );
        if (laptopCompareWantAi()) await askLaptopCompareAiRecommendation();
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'Compare checked listings'; }
    }
}

function readLaptopCompareCriteria() {
    const dutyEl = document.getElementById('laptopCompareDuty');
    const brandEl = document.getElementById('laptopCompareBrand');
    const ramEl = document.getElementById('laptopCompareMinRam');
    const storageEl = document.getElementById('laptopCompareMinStorage');
    if (typeof resolveTypeableSelectInput === 'function') {
        resolveTypeableSelectInput(dutyEl);
        resolveTypeableSelectInput(brandEl);
        resolveTypeableSelectInput(ramEl);
        resolveTypeableSelectInput(storageEl);
    }
    return {
        dutyProfile: dutyEl?.value || '',
        brand: brandEl?.value || 'Any',
        minRamGb: ramEl?.value || 'any',
        minStorageGb: storageEl?.value || 'any'
    };
}

function lookupComparePoPrice(title) {
    if (typeof searchPoBenchmarks !== 'function') return null;
    const hits = searchPoBenchmarks(title);
    if (!hits.length) return null;
    const exact = hits.find((row) => String(row.description || '').toLowerCase().includes(String(title || '').toLowerCase().slice(0, 12)));
    return exact || hits[0];
}

function catalogHitToCompareItem(hit) {
    const p = hit.product;
    const title = `${p.brand || ''} ${p.model || ''}`.trim();
    const priceHit = lookupComparePoPrice(title);
    const price = priceHit?.unitPrice != null ? Number(priceHit.unitPrice) : null;
    const proc = (p.specs || []).find((s) => /processor/i.test(s[0]))?.[1] || '';
    const ram = (p.specs || []).find((s) => /^ram$|memory/i.test(s[0]))?.[1] || '';
    const storage = (p.specs || []).find((s) => /storage/i.test(s[0]))?.[1] || '';
    return {
        id: `local-${p.id}`,
        title,
        subtitle: p.category || 'laptop',
        snippet: [proc, ram, storage].filter(Boolean).join(' · '),
        source: 'local',
        product: p,
        catalogScore: hit.score,
        catalogReasons: hit.reasons || [],
        price,
        priceDisplay: priceHit
            ? `${priceHit.currency === 'USD' ? '$' : ''}${Number(priceHit.unitPrice).toLocaleString()}${priceHit.currency !== 'USD' ? ` ${priceHit.currency}` : ''} (${priceHit.poRef})`
            : '',
        priceText: priceHit ? String(priceHit.unitPrice) : ''
    };
}

function marketRowToCompareItem(row) {
    return {
        id: row.id || `web-${row.title}`,
        title: row.title || '',
        subtitle: row.subtitle || '',
        snippet: row.snippet || '',
        source: row.source || 'web',
        product: row.product || null,
        catalogScore: null,
        catalogReasons: [],
        price: Number(row.price) || null,
        priceDisplay: row.priceDisplay || row.priceText || '',
        priceText: row.priceText || '',
        url: row.url || ''
    };
}

function laptopCompareParseRam(row) {
    const t = `${row.snippet || ''} ${row.title || ''} ${(row.product?.specs || []).map((s) => s[1]).join(' ')}`;
    const m = t.match(/(\d+)\s*GB/i);
    return m ? `${m[1]} GB` : '—';
}

function laptopCompareSpecLine(row) {
    const t = `${row.title || ''} ${row.snippet || ''} ${row.subtitle || ''}`;
    const cpu = t.match(/Intel(?:\s+Core)?(?:\s+Ultra)?\s*\d*\s*[A-Z0-9-]{0,12}|AMD\s+Ryzen(?:\s+AI)?\s*[0-9][^\s,/|]{0,16}|Apple\s+M[1-5]\w*/i);
    const gpu = t.match(/RTX\s*\d{3,4}(?:\s*\d+\s*GB)?|GeForce[^\s,]{0,16}|Arc\s+\w+|Iris\s*Xe|integrated graphics/i);
    const ram = laptopCompareParseRam(row);
    const bits = [
        cpu ? cpu[0].replace(/\s+/g, ' ').trim() : '',
        ram !== '—' ? ram : '',
        gpu ? gpu[0].replace(/\s+/g, ' ').trim() : 'integrated graphics'
    ].filter(Boolean);
    if (bits.length) return bits.join(' / ');
    return String(row.snippet || 'See side-by-side specs').slice(0, 120);
}

function laptopCompareSpecBlob(row) {
    const specs = (row?.product?.specs || [])
        .map((s) => Array.isArray(s) ? `${s[0] || ''} ${s[1] || ''}` : String(s || ''))
        .join(' ');
    return `${row?.title || ''} ${row?.snippet || ''} ${row?.subtitle || ''} ${specs}`.toLowerCase();
}

function laptopCompareOnHandQty(row) {
    const pid = String(row?.product?.id || '');
    const stockId = pid.includes('__') ? pid : (pid ? `ict-equipment__${pid}` : '');
    if (typeof getItemStockSummaryForPeriod === 'function' && stockId) {
        const sum = getItemStockSummaryForPeriod(stockId);
        const onHand = Number(sum?.onHand);
        if (Number.isFinite(onHand)) return onHand;
    }
    return 0;
}

/** Capability score from actual specs — category-aware (laptops vs servers vs printers). */
function laptopCompareHardwareScore(row) {
    const blob = laptopCompareSpecBlob(row);
    const cat = String(row.product?.category || laptopCompareState.category || 'laptop').toLowerCase();

    if (cat === 'printer') {
        let score = 40;
        if (/mfp|multifunction|print.*copy.*scan|all.?in.?one/.test(blob)) score += 10;
        if (/laser|pagewide/.test(blob)) score += 8;
        else if (/inkjet|ecotank|tank/.test(blob)) score += 5;
        if (/a3/.test(blob)) score += 8;
        else if (/a4/.test(blob)) score += 3;
        const ppm = blob.match(/(\d+)\s*(?:ppm|ipm)/);
        if (ppm) {
            const n = parseInt(ppm[1], 10);
            if (n >= 40) score += 12;
            else if (n >= 25) score += 8;
            else if (n >= 15) score += 4;
        }
        if (/duplex|two.?sided/.test(blob)) score += 6;
        if (/wifi|wireless|ethernet|network/.test(blob)) score += 4;
        if (/enterprise|workgroup|department/.test(blob)) score += 6;
        return Math.max(8, Math.min(96, Math.round(score)));
    }

    if (cat === 'server') {
        let score = 38;
        if (/xeon|epyc|amd\s*eypc|scalable/.test(blob)) score += 16;
        else if (/core\s*i[579]|ryzen|ultra/.test(blob)) score += 8;
        const ramMatches = [...blob.matchAll(/(\d+)\s*(gb|tb)/gi)];
        let ramGb = 0;
        ramMatches.forEach((m) => {
            const n = parseFloat(m[1]);
            const unit = String(m[2] || '').toLowerCase();
            const gb = unit === 'tb' ? n * 1024 : n;
            if (gb >= 8 && gb <= 4096) ramGb = Math.max(ramGb, gb);
        });
        if (ramGb >= 512) score += 16;
        else if (ramGb >= 128) score += 12;
        else if (ramGb >= 64) score += 8;
        else if (ramGb >= 32) score += 4;
        if (/raid|smart\s*array|perc|hba/.test(blob)) score += 6;
        if (/ilo|idrac|xclarity|imm|ipmi/.test(blob)) score += 6;
        if (/2u|1u|rack/.test(blob)) score += 4;
        if (/redundant|hot.?swap|dual\s*psu/.test(blob)) score += 6;
        if (/proliant|poweredge|thinksystem/.test(blob)) score += 4;
        return Math.max(8, Math.min(96, Math.round(score)));
    }

    if (cat === 'network') {
        let score = 40;
        if (/firewall|fortigate|asa|palo/.test(blob)) score += 10;
        if (/catalyst|nexus|aruba|meraki/.test(blob)) score += 8;
        const ports = blob.match(/(\d+)\s*port/);
        if (ports) {
            const n = parseInt(ports[1], 10);
            if (n >= 48) score += 10;
            else if (n >= 24) score += 7;
            else if (n >= 8) score += 4;
        }
        if (/10\s*g|25\s*g|40\s*g|100\s*g|multi.?gig/.test(blob)) score += 10;
        else if (/gigabit|1\s*g/.test(blob)) score += 4;
        if (/poe/.test(blob)) score += 6;
        if (/wifi\s*6|wifi\s*7|802\.11ax|802\.11be/.test(blob)) score += 8;
        return Math.max(8, Math.min(96, Math.round(score)));
    }

    // laptop / desktop / tablet / other — compute-class scoring
    let score = 36;
    if (/core ultra\s*9|\bultra\s*9\b|ryzen\s*ai\s*9|ryzen\s*9|core\s*i9|\bi9\b/.test(blob)) score += 22;
    else if (/core ultra\s*7|\bultra\s*7\b|ryzen\s*ai\s*7|ryzen\s*7|core\s*i7|\bi7\b|core\s*7/.test(blob)) score += 14;
    else if (/core ultra|ryzen\s*ai|ryzen\s*5|core\s*i5|\bi5\b|core\s*5/.test(blob)) score += 8;
    else if (/i3|ryzen\s*3|celeron|pentium/.test(blob)) score += 2;

    if (/rtx\s*50[89]0|rtx\s*4090|rtx\s*4080/.test(blob)) score += 24;
    else if (/rtx\s*4070|rtx\s*5070/.test(blob)) score += 20;
    else if (/rtx\s*4060|rtx\s*5060/.test(blob)) score += 14;
    else if (/rtx\s*4050|rtx\s*3050/.test(blob)) score += 10;
    else if (/rtx|geforce|discrete\s*gpu|nvidia|quadro|rtx\s*a/.test(blob)) score += 7;
    else if (/iris|uhd|integrated/.test(blob)) score += 1;

    const ramMatches = [...blob.matchAll(/(\d+)\s*gb/gi)]
        .map((m) => parseInt(m[1], 10))
        .filter((n) => n >= 8 && n <= 128);
    const ramMax = ramMatches.length ? Math.max(...ramMatches) : 0;
    if (ramMax >= 64) score += 12;
    else if (ramMax >= 32) score += 10;
    else if (ramMax >= 16) score += 5;
    else if (ramMax >= 8) score += 2;
    if (/lpddr5/.test(blob)) score += 2;

    if (/oled/.test(blob)) score += 10;
    if (/wqxga|2560\s*[×x]\s*1600|2880|3200|3k|4k|uhd/.test(blob)) score += 6;
    else if (/qhd|1440|1600/.test(blob)) score += 4;
    else if (/fhd|1920/.test(blob)) score += 2;
    if (/\b(144|165|240)\s*hz\b/.test(blob)) score += 2;

    if (/\b2\s*tb\b/.test(blob)) score += 5;
    else if (/\b1\s*tb\b/.test(blob)) score += 4;
    else if (/512/.test(blob)) score += 2;

    if (/ai pc|npu|core ultra|ryzen\s*ai|copilot\+?\s*pc/.test(blob)) score += 6;

    if (/transcend|zbook|precision|thinkpad\s*p|legion\s*pro|macbook\s*pro|workstation/.test(blob)) score += 8;
    else if (/\bomen\b/.test(blob) && !/victus/.test(blob)) score += 4;
    else if (/victus|ideapad|pavilion|aspire/.test(blob)) score -= 2;

    const wh = blob.match(/(\d+(?:\.\d+)?)\s*wh/);
    if (wh) {
        const w = parseFloat(wh[1]);
        if (w >= 80) score += 5;
        else if (w >= 60) score += 3;
        else if (w >= 45) score += 1;
    }

    return Math.max(8, Math.min(96, Math.round(score)));
}

function laptopCompareDutyBonus(row, profile) {
    if (!profile) return 0;
    const blob = laptopCompareSpecBlob(row);
    const key = profile.key;
    let bonus = 0;
    if (profile.group === 'field' && /rugged|toughbook|mil-std|ip6[0-6]|outdoor/.test(blob)) bonus += 14;
    if (key === 'machine-learning' && /rtx|npu|ultra|gpu|ai pc|core ultra|ryzen\s*ai/.test(blob)) bonus += 14;
    if (key === 'simulations' && /rtx|gpu|workstation|zbook|precision|legion|omen|transcend/.test(blob)) bonus += 12;
    if (key === 'software-engineering' && /32\s*gb|64\s*gb|ultra|ryzen\s*9|i9|workstation|oled/.test(blob)) bonus += 10;
    if (key === 'programming' && /thinkpad|elitebook|latitude|16\s*gb|ultra/.test(blob)) bonus += 8;
    if (key === 'graphic-design' && /oled|creator|macbook|rtx|studio|transcend|wqxga/.test(blob)) bonus += 12;
    if (key === 'architecture' && /zbook|precision|rtx|cad|workstation|transcend|omen/.test(blob)) bonus += 12;
    if (key === 'outdoor-field' && /rugged|ip65|hot.?swap|toughbook/.test(blob)) bonus += 16;
    return bonus;
}

function laptopCompareDutyScore(row, profile) {
    const hw = laptopCompareHardwareScore(row);
    const duty = laptopCompareDutyBonus(row, profile);
    let score = hw + duty;
    if (row.source === 'local') score += 2;
    if (laptopCompareOnHandQty(row) > 0) score += 3;
    if (row.price && row.price > 0) score += 2;
    return Math.max(8, Math.min(99, score));
}

function laptopCompareScorePicks(picks, profile) {
    const scored = picks.map((row) => {
        const hw = laptopCompareHardwareScore(row);
        const duty = laptopCompareDutyBonus(row, profile);
        const onHand = laptopCompareOnHandQty(row);
        let fit = hw + duty;
        if (row.source === 'local') fit += 2;
        if (onHand > 0) fit += 3;
        fit = Math.max(8, Math.min(99, fit));
        return {
            row,
            fit,
            hw,
            duty,
            onHand,
            price: Number(row.price) || 0
        };
    });
    const priced = scored.filter((s) => s.price > 0);
    const minP = priced.length ? Math.min(...priced.map((s) => s.price)) : 0;
    scored.forEach((s) => {
        // Only apply value bonus when real prices exist — flat +8 was tying every pick at 86.
        const valueBonus = s.price > 0 && minP > 0 ? Math.round(16 * (minP / s.price)) : 0;
        s.buy = Math.min(99, s.fit + valueBonus);
    });
    scored.sort((a, b) => (
        b.buy - a.buy
        || b.fit - a.fit
        || b.hw - a.hw
        || b.onHand - a.onHand
        || String(a.row.title || '').localeCompare(String(b.row.title || ''))
    ));
    return scored;
}

function laptopCompareSpecFromProduct(product, pattern) {
    const specs = product?.specs || [];
    const hit = specs.find(([label]) => pattern.test(String(label || '')));
    return hit ? String(hit[1] || '—').trim() : '—';
}

const COMPARE_SHOWCASE_SPECS = [
    { label: 'Display', re: /display|screen/i, fromText: /(\d{2}(?:\.\d)?\s*(?:\"|inch|-inch)[^\n,;]{0,48})/i },
    { label: 'Processor', re: /processor/i, fromText: /Intel(?:\s+Core)?(?:\s+Ultra)?\s*\d*\s*[A-Z0-9-]{0,14}|AMD\s+Ryzen(?:\s+AI)?\s*[0-9][^\s,/|]{0,18}|Apple\s+M[1-5]\w*/i },
    { label: 'RAM', re: /^ram$|memory/i, fromText: /(\d+\s*GB(?:\s*(?:RAM|LPDDR\d|DDR\d))?)/i },
    { label: 'Storage', re: /storage/i, fromText: /(\d+\s*(?:GB|TB)\s*(?:SSD|NVMe|HDD)?)/i },
    { label: 'Graphics', re: /graphics|gpu/i, fromText: /RTX\s*\d{3,4}(?:\s*\d+\s*GB)?|GeForce[^\s,]{0,16}|Arc\s+\w+|Iris\s*Xe|integrated graphics/i }
];

function getCompareLayoutMode() {
    const v = appState?.uiCompareLayout;
    if (v === 'table' || v === 'catalog' || v === 'showcase') return v;
    return 'showcase';
}

function syncCompareLayoutToggle() {
    const mode = getCompareLayoutMode();
    document.querySelectorAll('[data-cmp-layout]').forEach((btn) => {
        btn.classList.toggle('is-active', btn.getAttribute('data-cmp-layout') === mode);
    });
}

function setCompareLayoutMode(mode) {
    const id = (mode === 'table' || mode === 'catalog') ? mode : 'showcase';
    if (appState) appState.uiCompareLayout = id;
    if (typeof saveState === 'function') saveState();
    syncCompareLayoutToggle();
    if (typeof renderLaptopCompareResults === 'function' && laptopCompareState.items.length) {
        renderLaptopCompareResults();
    }
    if (typeof renderIctCompareTable === 'function') {
        renderIctCompareTable();
    }
}

function wireCompareLayoutToggles(root) {
    root?.querySelectorAll('[data-cmp-layout]').forEach((btn) => {
        if (btn.dataset.cmpBound === '1') return;
        btn.dataset.cmpBound = '1';
        btn.addEventListener('click', () => setCompareLayoutMode(btn.getAttribute('data-cmp-layout')));
    });
    syncCompareLayoutToggle();
}

function compareShowcaseChip(row) {
    const blob = `${row.title || ''} ${row.snippet || ''} ${row.subtitle || ''} ${(row.product?.specs || []).map((s) => s[1]).join(' ')}`;
    const intel = /intel/i.test(blob);
    const amd = /amd|ryzen/i.test(blob);
    const apple = /apple|\bm[1-5]\b/i.test(blob);
    if (intel && amd) return 'Intel/AMD';
    if (intel) return 'Intel';
    if (amd) return 'AMD';
    if (apple) return 'Apple';
    return row.product?.brand || row.subtitle || 'ICT';
}

function compareShowcaseTagline(row, profile) {
    const best = laptopCompareSpecFromProduct(row.product, /best for|form factor|device type/i);
    if (best && best !== '—') return best;
    if (row.catalogReasons?.[0]) return row.catalogReasons[0];
    if (profile?.summary) return profile.summary;
    const snip = String(row.snippet || '').trim();
    if (snip) return snip.length > 90 ? `${snip.slice(0, 87)}…` : snip;
    return 'Key specifications for duty comparison.';
}

function compareShowcaseImageSrc(row) {
    if (row.imageUrl) return row.imageUrl;
    const title = row.title || '';
    const pid = String(row.product?.id || '');
    const stockId = pid.includes('__') ? pid : (pid ? `ict-equipment__${pid}` : '');
    if (typeof resolveProductStockImage === 'function') {
        return resolveProductStockImage(title, row.product?.category || row.subtitle, null, stockId)
            || resolveProductStockImage(title, row.product?.category, null, pid)
            || '';
    }
    return '';
}

function compareShowcaseSpecValue(row, spec) {
    const fromProduct = laptopCompareSpecFromProduct(row.product, spec.re);
    if (fromProduct && fromProduct !== '—') return fromProduct;
    const blob = `${row.title || ''} ${row.snippet || ''} ${row.subtitle || ''}`;
    const m = spec.fromText ? blob.match(spec.fromText) : null;
    return m ? String(m[0]).replace(/\s+/g, ' ').trim() : '—';
}

function compareShowcasePhotoHtml(row, esc) {
    const src = compareShowcaseImageSrc(row);
    const letter = esc((row.title || '?').slice(0, 1) || '?');
    const ph = `<div class="cmp-showcase-ph" aria-hidden="true">${letter}</div>`;
    if (!src) return ph;
    return `<img src="${esc(src)}" alt="${esc(row.title || '')}" class="cmp-showcase-img" loading="lazy" referrerpolicy="no-referrer" decoding="async" onerror="this.hidden=true;var n=this.nextElementSibling;if(n)n.hidden=false;"><div class="cmp-showcase-ph" hidden aria-hidden="true">${letter}</div>`;
}

function renderCompareShowcase(host, scored, options = {}) {
    if (!host) return;
    const profile = options.profile || null;
    const extraRows = options.extraRows || [];
    const max = options.max || 4;
    const show = scored.slice(0, max);
    const specN = COMPARE_SHOWCASE_SPECS.length + extraRows.length;
    const esc = options.esc || laptopCmpEsc;

    host.hidden = !show.length;
    if (!show.length) {
        host.innerHTML = '';
        return;
    }

    host.innerHTML = `
        <div class="cmp-showcase" style="--cols:${show.length};--spec-n:${specN}">
            ${show.map((s, i) => {
                const row = s.row;
                const specs = COMPARE_SHOWCASE_SPECS.map((spec) => `
                    <div class="cmp-showcase-spec">
                        <span class="cmp-showcase-spec-label">${esc(spec.label)}</span>
                        <span class="cmp-showcase-spec-value">${esc(compareShowcaseSpecValue(row, spec))}</span>
                    </div>`).join('');
                const extras = extraRows.map((ex) => `
                    <div class="cmp-showcase-spec">
                        <span class="cmp-showcase-spec-label">${esc(ex.label)}</span>
                        <span class="cmp-showcase-spec-value">${ex.html ? ex.html(s, i) : esc(ex.value(s, i))}</span>
                    </div>`).join('');
                return `
                <article class="cmp-showcase-col${i === 0 ? ' is-winner' : ''}">
                    <p class="cmp-showcase-chip">${esc(compareShowcaseChip(row))}</p>
                    <h4 class="cmp-showcase-title">${esc(row.title || 'Unnamed item')}</h4>
                    <div class="cmp-showcase-photo">${compareShowcasePhotoHtml(row, esc)}</div>
                    <p class="cmp-showcase-tagline">${esc(compareShowcaseTagline(row, profile))}</p>
                    <div class="cmp-showcase-keyhead"><span>Key Specifications</span></div>
                    ${specs}${extras}
                </article>`;
            }).join('')}
        </div>
        ${scored.length > show.length
            ? `<p class="cmp-showcase-more">Showing top ${show.length} of ${scored.length}. Switch to Table to see every ranked item.</p>`
            : ''}`;
}

function compareCatalogImages(row) {
    const pid = String(row.product?.id || '');
    const stockId = pid.includes('__') ? pid : (pid ? `ict-equipment__${pid}` : '');
    let gallery = [];
    if (typeof resolveProductGallery === 'function') {
        gallery = resolveProductGallery(row.title, stockId) || [];
    }
    if (!gallery.length) {
        const one = compareShowcaseImageSrc(row);
        if (one) gallery = [one];
    }
    return gallery;
}

function compareCatalogStock(row) {
    const pid = String(row.product?.id || '');
    const stockId = pid.includes('__') ? pid : (pid ? `ict-equipment__${pid}` : '');
    if (typeof getItemStockSummaryForPeriod === 'function' && stockId) {
        const sum = getItemStockSummaryForPeriod(stockId);
        const onHand = Number(sum?.onHand);
        const hasTx = (sum?.allTransactions || []).length > 0 || Number(sum?.opening) > 0;
        if (hasTx && onHand > 0) return { label: `ON HAND · ${onHand}`, kind: 'in' };
        if (hasTx && onHand <= 0) return { label: 'OUT OF STOCK', kind: 'out' };
    }
    if (row.source === 'local') return { label: 'LOCAL CATALOG', kind: 'in' };
    if (row.source === 'manufacturer') return { label: 'OEM LISTING', kind: 'order' };
    return { label: 'WEB LISTING', kind: 'web' };
}

function compareCatalogSpecPipe(row) {
    const labels = [
        { label: 'OS', re: /operating system|^os$/i, fromText: /Windows\s*11(?:\s*(?:Pro|Home))?|macOS[^\s,]{0,16}|ChromeOS/i },
        ...COMPARE_SHOWCASE_SPECS
    ];
    const parts = labels.map((spec) => compareShowcaseSpecValue(row, spec)).filter((v) => v && v !== '—');
    if (parts.length) return parts.join('  ·  ');
    return String(row.snippet || '').trim() || 'See specifications';
}

function compareCatalogIsAiPc(row) {
    const blob = `${row.title || ''} ${row.snippet || ''} ${(row.product?.specs || []).map((s) => s.join(' ')).join(' ')}`;
    return /copilot|ai pc|npu|core ultra|ryzen\s*ai/i.test(blob);
}

function sendCompareRowToSpecEval(row, { toastPrefix = 'Sent to Spec Evaluation' } = {}) {
    if (!row) return;
    if (typeof navigateToModule === 'function') navigateToModule('spec-evaluation');
    setTimeout(() => {
        const itemEl = document.getElementById('specEvalItemName');
        if (itemEl) itemEl.value = row.title || '';
        if (row.product && typeof applyCatalogProductToForm === 'function') {
            applyCatalogProductToForm(row.product, row.title);
        } else if (typeof autofillSpecEvaluationFromItemName === 'function') {
            autofillSpecEvaluationFromItemName();
        }
        if (typeof showToast === 'function') showToast(`${toastPrefix}: ${row.title}`, 'info');
    }, 400);
}

function wireCompareCatalogGallery(host) {
    host.querySelectorAll('[data-cmp-gallery]').forEach((box) => {
        let urls = [];
        try { urls = JSON.parse(box.getAttribute('data-images') || '[]'); } catch (_) { urls = []; }
        if (urls.length < 2) return;
        let i = 0;
        const img = box.querySelector('.cmp-cat-img');
        const count = box.querySelector('.cmp-cat-count');
        const dots = box.querySelectorAll('.cmp-cat-dot');
        const show = () => {
            if (img) img.src = urls[i];
            if (count) count.textContent = `${i + 1}/${urls.length}`;
            dots.forEach((d, di) => d.classList.toggle('is-on', di === i));
        };
        box.querySelector('[data-cmp-gal-prev]')?.addEventListener('click', (e) => {
            e.preventDefault();
            i = (i - 1 + urls.length) % urls.length;
            show();
        });
        box.querySelector('[data-cmp-gal-next]')?.addEventListener('click', (e) => {
            e.preventDefault();
            i = (i + 1) % urls.length;
            show();
        });
        dots.forEach((d, di) => d.addEventListener('click', () => { i = di; show(); }));
    });
}

function renderCompareCatalog(host, scored, options = {}) {
    if (!host) return;
    const profile = options.profile || null;
    const max = options.catalogMax || options.max || 9;
    const show = scored.slice(0, max);
    const esc = options.esc || laptopCmpEsc;
    host.hidden = !show.length;
    if (!show.length) {
        host.innerHTML = '';
        return;
    }

    host.innerHTML = `
        <div class="cmp-catalog">
            ${show.map((s, i) => {
                const row = s.row;
                const stock = compareCatalogStock(row);
                const images = compareCatalogImages(row);
                const letter = esc((row.title || '?').slice(0, 1) || '?');
                const photo = images.length
                    ? `<img src="${esc(images[0])}" alt="${esc(row.title || '')}" class="cmp-cat-img" loading="lazy" referrerpolicy="no-referrer" decoding="async" onerror="this.hidden=true;var n=this.nextElementSibling;if(n)n.hidden=false;"><div class="cmp-showcase-ph" hidden aria-hidden="true">${letter}</div>`
                    : `<div class="cmp-showcase-ph" aria-hidden="true">${letter}</div>`;
                const nav = images.length > 1
                    ? `<div class="cmp-cat-nav">
                            <button type="button" class="cmp-cat-nav-btn" data-cmp-gal-prev aria-label="Previous photo">‹</button>
                            <span class="cmp-cat-count">${1}/${images.length}</span>
                            <button type="button" class="cmp-cat-nav-btn" data-cmp-gal-next aria-label="Next photo">›</button>
                       </div>
                       <div class="cmp-cat-dots">${images.map((_, di) => `<button type="button" class="cmp-cat-dot${di === 0 ? ' is-on' : ''}" aria-label="Photo ${di + 1}"></button>`).join('')}</div>`
                    : '';
                const price = row.priceDisplay || row.priceText || 'Price on request';
                const listing = row.url
                    ? `<a class="cmp-cat-link" href="${esc(row.url)}" target="_blank" rel="noopener noreferrer">View listing</a>`
                    : `<span></span>`;
                return `
                <article class="cmp-cat-card${i === 0 ? ' is-winner' : ''}">
                    <div class="cmp-cat-top">
                        <span class="cmp-cat-stock is-${stock.kind}"><i></i>${esc(stock.label)}</span>
                        ${i === 0 ? '<span class="cmp-cat-promo">Recommended buy</span>' : ''}
                    </div>
                    <div class="cmp-cat-photo" data-cmp-gallery data-images="${esc(JSON.stringify(images))}">${photo}${nav}</div>
                    <div class="cmp-cat-score">
                        <strong>Buy score ${s.buy}/100</strong>
                        <span>Spec ${s.fit}</span>
                        ${compareCatalogIsAiPc(row) ? '<em class="cmp-cat-ai">AI PC</em>' : ''}
                    </div>
                    <h4 class="cmp-cat-title">${esc(row.title || 'Unnamed item')}</h4>
                    <p class="cmp-cat-blurb">${esc(compareShowcaseTagline(row, profile))}</p>
                    <p class="cmp-cat-specs">${esc(compareCatalogSpecPipe(row))}</p>
                    <div class="cmp-cat-price">
                        <span class="cmp-cat-msrp">Price ref</span>
                        <strong>${esc(price)}</strong>
                    </div>
                    <div class="cmp-cat-actions">
                        ${listing}
                        <button type="button" class="btn btn-primary btn-sm" data-cmp-send-spec="${i}">Send to Spec Eval</button>
                    </div>
                </article>`;
            }).join('')}
        </div>
        ${scored.length > show.length
            ? `<p class="cmp-showcase-more">Showing top ${show.length} of ${scored.length}. Switch to Table to see every ranked item.</p>`
            : ''}`;

    wireCompareCatalogGallery(host);
    host.querySelectorAll('[data-cmp-send-spec]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const idx = parseInt(btn.getAttribute('data-cmp-send-spec'), 10);
            const hit = show[idx];
            if (!hit?.row) return;
            sendCompareRowToSpecEval(hit.row, {
                toastPrefix: idx === 0 ? 'Winner sent to Spec Evaluation' : 'Sent to Spec Evaluation'
            });
        });
    });
}

function applyCompareLayoutViews(tableWrap, showcaseEl, scored, options) {
    const mode = getCompareLayoutMode();
    const catalogEl = options.catalogEl;
    syncCompareLayoutToggle();
    if (tableWrap) tableWrap.hidden = mode !== 'table';
    if (mode === 'showcase') {
        renderCompareShowcase(showcaseEl, scored, options);
    } else if (showcaseEl) {
        showcaseEl.hidden = true;
        showcaseEl.innerHTML = '';
    }
    if (mode === 'catalog') {
        renderCompareCatalog(catalogEl, scored, options);
    } else if (catalogEl) {
        catalogEl.hidden = true;
        catalogEl.innerHTML = '';
    }
}

function laptopCompareWhyLine(best, scored) {
    if (!best) return 'strongest combined duty fit and value score among ranked laptops';
    const reasons = best.row.catalogReasons || [];
    const bits = [];
    const blob = laptopCompareSpecBlob(best.row);
    if (/core ultra\s*9|ultra\s*9|ryzen\s*ai\s*9|ryzen\s*9|i9/.test(blob)) bits.push('top CPU class');
    else if (/core ultra|ryzen\s*ai|ryzen\s*7|i7|core\s*7/.test(blob)) bits.push('strong CPU class');
    if (/rtx\s*4070|rtx\s*5070/.test(blob)) bits.push('higher GPU class (up to RTX 4070)');
    else if (/rtx\s*4060/.test(blob)) bits.push('RTX 4060-class GPU');
    else if (/rtx/.test(blob)) bits.push('discrete RTX graphics');
    if (/oled/.test(blob)) bits.push('OLED display');
    if (/32\s*gb|64\s*gb/.test(blob)) bits.push('32 GB+ RAM class');
    if (/ai pc|npu|core ultra|ryzen\s*ai/.test(blob)) bits.push('AI PC / NPU class');
    if (best.onHand > 0) bits.push(`on hand (${best.onHand})`);
    if (Array.isArray(scored) && scored.length > 1) {
        const second = scored[1];
        const gap = (best.buy || 0) - (second.buy || 0);
        if (gap > 0) bits.push(`+${gap} buy points vs ${second.row.title}`);
    }
    if (bits.length) return bits.join('; ');
    if (reasons.length) return reasons.slice(0, 3).join('; ');
    return 'strongest hardware + duty fit among ranked laptops';
}

function renderLaptopCompareChart(scored, profile) {
    const bars = document.getElementById('laptopCompareBars');
    if (!bars) return;
    const maxBuy = Math.max(...scored.map((s) => s.buy), 1);
    const dutyLabel = profile?.label || profile?.groupLabel || 'Selected duty';
    bars.innerHTML = `
        <div class="ict-buy-score-chart">
            <div class="ict-buy-score-head">
                <strong>Buy score ranking</strong>
                <span>${laptopCmpEsc(dutyLabel)} · darker bar = overall buy score · lighter inset = spec score</span>
            </div>
            <div class="ict-buy-score-legend" role="group" aria-label="Chart legend">
                <span><i class="ict-buy-score-swatch ict-buy-score-swatch-spec" aria-hidden="true"></i>Spec score</span>
                <span><i class="ict-buy-score-swatch ict-buy-score-swatch-overall" aria-hidden="true"></i>Overall buy score</span>
                <span><i class="ict-buy-score-swatch ict-buy-score-swatch-recommended" aria-hidden="true"></i>Recommended buy</span>
            </div>
            <div class="ict-buy-score-list">
            ${scored.map((s, i) => {
                const outer = Math.max(12, Math.round((s.buy / maxBuy) * 100));
                const specPct = Math.max(28, Math.min(100, Math.round((s.fit / Math.max(s.buy, 1)) * 100)));
                const winner = i === 0 ? ' is-winner' : '';
                return `<div class="ict-buy-score-row${winner}">
                    <div class="ict-buy-score-meta">
                        <strong>${laptopCmpEsc(s.row.title)}</strong>
                        <em>${laptopCmpEsc(laptopCompareSpecLine(s.row))}</em>
                    </div>
                    <div class="ict-buy-score-track" title="Overall buy score ${s.buy} · spec score ${s.fit}">
                        <span class="ict-buy-score-overall" style="width:${outer}%">
                            <span class="ict-buy-score-spec" style="width:${specPct}%"></span>
                            <span class="ict-buy-score-spec-label">${s.fit}</span>
                            <span class="ict-buy-score-value">${s.buy}</span>
                        </span>
                    </div>
                </div>`;
            }).join('')}
            </div>
        </div>`;
}

function renderLaptopCompareSideBySide(scored) {
    const body = document.getElementById('laptopCompareTableBody');
    const headRow = document.getElementById('laptopCompareSideHeadRow');
    if (!body || !headRow) return;

    const head = scored.map((s, i) => (
        `<th class="${i === 0 ? 'is-winner-col' : ''}">${laptopCmpEsc(s.row.title)}</th>`
    )).join('');
    headRow.innerHTML = `<th>Spec</th>${head}`;

    const cell = (s, i, html) => `<td class="${i === 0 ? 'is-winner-col' : ''}">${html}</td>`;
    const rows = getLaptopCompareSideSpecRows().map(({ label, re }) => {
        const cells = scored.map((s, i) => cell(
            s,
            i,
            laptopCmpEsc(laptopCompareSpecFromProduct(s.row.product, re))
        )).join('');
        return `<tr><th>${laptopCmpEsc(label)}</th>${cells}</tr>`;
    });

    rows.push(`<tr><th>Buy score</th>${scored.map((s, i) => cell(s, i, `<strong>${s.buy}</strong>`)).join('')}</tr>`);
    rows.push(`<tr><th>Price ref</th>${scored.map((s, i) => cell(s, i, laptopCmpEsc(s.row.priceDisplay || '—'))).join('')}</tr>`);
    body.innerHTML = rows.join('');
}

function renderLaptopCompareResults() {
    const panel = document.getElementById('laptopCompareResultsPanel');
    const winnerEl = document.getElementById('laptopCompareWinner');
    const sendBtn = document.getElementById('laptopCompareSendWinnerBtn');
    const profile = typeof getLaptopDutyProfile === 'function'
        ? getLaptopDutyProfile(laptopCompareState.dutyKey)
        : null;

    if (!laptopCompareState.items.length) {
        if (panel) panel.hidden = true;
        if (winnerEl) winnerEl.hidden = true;
        if (sendBtn) sendBtn.hidden = true;
        const body = document.getElementById('laptopCompareTableBody');
        if (body) body.innerHTML = '<tr><td colspan="2" class="req-empty-row">Rank laptops to compare.</td></tr>';
        const barsEl = document.getElementById('laptopCompareBars');
        if (barsEl) barsEl.innerHTML = '';
        const showcase = document.getElementById('laptopCompareShowcase');
        if (showcase) { showcase.hidden = true; showcase.innerHTML = ''; }
        const catalog = document.getElementById('laptopCompareCatalog');
        if (catalog) { catalog.hidden = true; catalog.innerHTML = ''; }
        laptopCompareState.scored = [];
        laptopCompareState.winner = null;
        return;
    }

    const scored = laptopCompareScorePicks(laptopCompareState.items, profile);
    laptopCompareState.scored = scored;
    const best = scored[0];
    laptopCompareState.winner = best;

    if (panel) panel.hidden = false;
    if (winnerEl && best) {
        winnerEl.hidden = false;
        winnerEl.className = 'ict-recommended-buy';
        winnerEl.innerHTML = `
            <span class="ict-recommended-buy-label">Recommended buy</span>
            <strong class="ict-recommended-buy-title">${laptopCmpEsc(best.row.title)}</strong>
            <span class="ict-recommended-buy-spec">${laptopCmpEsc(laptopCompareSpecLine(best.row))}</span>
            <span class="ict-recommended-buy-score">Buy score <strong>${best.buy}</strong> / 100 · Spec score ${best.fit}${best.hw != null ? ` · Hardware ${best.hw}` : ''}</span>
            <span class="ict-recommended-buy-why">Why: ${laptopCmpEsc(laptopCompareWhyLine(best, scored))}.</span>
        `;
    }
    if (sendBtn) sendBtn.hidden = !best;

    renderLaptopCompareChart(scored, profile);
    renderLaptopCompareSideBySide(scored);
    applyCompareLayoutViews(
        document.getElementById('laptopCompareTableWrap'),
        document.getElementById('laptopCompareShowcase'),
        scored,
        {
            profile,
            max: 4,
            catalogMax: 9,
            catalogEl: document.getElementById('laptopCompareCatalog'),
            extraRows: [
                { label: 'Buy score', html: (s) => `<strong>${s.buy}</strong>` },
                { label: 'Price ref', value: (s) => s.row.priceDisplay || '—' }
            ]
        }
    );
}

function setLaptopCompareStatus(msg, kind = '') {
    const el = document.getElementById('laptopCompareStatus');
    if (!el) return;
    el.textContent = msg || '';
    el.className = `spec-search-status${kind ? ` is-${kind}` : ''}`;
}

function rankLaptopsFromCatalog() {
    const criteria = readLaptopCompareCriteria();
    const cat = getLaptopCompareCategory();
    const meta = getLaptopCompareCategoryMeta(cat);
    const profile = typeof getLaptopDutyProfile === 'function'
        ? getLaptopDutyProfile(criteria.dutyProfile)
        : null;
    if (!profile) {
        setLaptopCompareStatus('Select a duty profile first.', 'error');
        return;
    }
    if (typeof searchCatalogByMinspec !== 'function') {
        setLaptopCompareStatus('Product catalog not loaded.', 'error');
        return;
    }

    const hits = searchCatalogByMinspec({
        productType: meta.productType,
        dutyProfile: criteria.dutyProfile,
        brand: criteria.brand,
        minRamGb: meta.showRamStorage ? criteria.minRamGb : 'any',
        minStorageGb: meta.showRamStorage ? criteria.minStorageGb : 'any'
    }, { minResults: 5, maxResults: 50 });

    laptopCompareState.dutyKey = criteria.dutyProfile;
    laptopCompareState.category = cat;
    laptopCompareState.brand = criteria.brand;
    laptopCompareState.minRam = criteria.minRamGb;
    laptopCompareState.minStorage = criteria.minStorageGb;
    laptopCompareState.pickMode = false;
    laptopCompareState.items = hits.map((hit) => {
        const item = catalogHitToCompareItem(hit);
        if (item.product && !item.product.category) item.product.category = meta.productType;
        return item;
    });

    setLaptopCompareAiAdvice('', { hidden: true });
    renderLaptopCompareResults();
    setLaptopCompareStatus(
        laptopCompareState.items.length
            ? `Ranked ${laptopCompareState.items.length} ${meta.singular}(s) for ${profile.label}.`
            : `No ${meta.singular}s matched — widen brand or filters, or pick models by name.`,
        laptopCompareState.items.length ? 'ok' : 'warn'
    );
}

async function addLiveMarketListings() {
    const criteria = readLaptopCompareCriteria();
    const meta = getLaptopCompareCategoryMeta();
    const profile = typeof getLaptopDutyProfile === 'function'
        ? getLaptopDutyProfile(criteria.dutyProfile)
        : null;
    const picks = readLaptopComparePicks().map((p) => p.label).filter(Boolean);
    const query = picks.length
        ? picks.slice(0, 3).join(' vs ')
        : (typeof dutyProfileWebQuery === 'function' && profile
            ? dutyProfileWebQuery(profile, meta.productType)
            : `${profile?.label || criteria.brand || 'HP'} ${meta.singular}`);

    if (!picks.length && !profile) {
        setLaptopCompareStatus('Select a duty profile or pick models first.', 'error');
        return;
    }

    const btn = document.getElementById('laptopCompareMarketBtn');
    if (btn) { btn.disabled = true; btn.textContent = 'Adding listings…'; }
    setLaptopCompareStatus(`Searching live market for “${query}”…`, 'info');

    try {
        if (typeof fetchMarketCatalog !== 'function') throw new Error('Market catalog unavailable');
        const marketCat = ['laptop', 'desktop', 'tablet', 'printer', 'server'].includes(meta.productType)
            ? meta.productType
            : 'laptop';
        const result = await fetchMarketCatalog(query, marketCat, { force: false });
        const webItems = (result.items || []).map((row) => {
            const item = marketRowToCompareItem(row);
            if (item.product) item.product.category = meta.productType;
            else item.product = { category: meta.productType, brand: '', model: item.title, specs: [] };
            return item;
        });
        const seen = new Set(laptopCompareState.items.map((r) => (r.title || '').toLowerCase()));
        let added = 0;
        webItems.forEach((row) => {
            const key = (row.title || '').toLowerCase();
            if (!key || seen.has(key)) return;
            seen.add(key);
            laptopCompareState.items.push(row);
            added += 1;
        });
        if (profile) laptopCompareState.dutyKey = criteria.dutyProfile || laptopCompareState.dutyKey;
        laptopCompareState.category = getLaptopCompareCategory();
        laptopCompareState.items.sort((a, b) => laptopCompareDutyScore(b, profile) - laptopCompareDutyScore(a, profile));
        renderLaptopCompareResults();
        setLaptopCompareStatus(
            added
                ? `Added ${added} live listing(s). ${laptopCompareState.items.length} ${meta.singular}(s) in comparison.`
                : `No new live listings — ${laptopCompareState.items.length} ${meta.singular}(s) still ranked.`,
            added ? 'ok' : 'warn'
        );
    } catch (err) {
        setLaptopCompareStatus(err.message || 'Live market lookup failed.', 'error');
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'Add live market listings'; }
    }
}

function sendLaptopCompareWinnerToSpecEval() {
    sendCompareRowToSpecEval(laptopCompareState.winner?.row, { toastPrefix: 'Winner sent to Spec Evaluation' });
}

function printLaptopCompareComparison() {
    if (!laptopCompareState.scored.length) {
        setLaptopCompareStatus('Rank laptops first, then print.', 'warn');
        return;
    }
    document.body.classList.add('is-printing', 'printing-laptop-compare');
    window.print();
    window.addEventListener('afterprint', () => {
        document.body.classList.remove('is-printing', 'printing-laptop-compare');
    }, { once: true });
}

function initLaptopCompareModule() {
    const root = document.getElementById('laptop-compare');
    if (!root) return;
    fillLaptopCompareDutySelect();
    fillLaptopCompareFacets();
    syncLaptopCompareCategoryUi();
    updateLaptopCompareDutyHint();
    if (root.dataset.inited === '1') {
        wireCompareLayoutToggles(root);
        return;
    }
    root.dataset.inited = '1';

    document.getElementById('laptopCompareCategory')?.addEventListener('change', () => {
        laptopCompareState.items = [];
        laptopCompareState.scored = [];
        laptopCompareState.winner = null;
        laptopCompareState.marketCandidates = [];
        laptopCompareState.marketSelected = new Set();
        setLaptopCompareAiAdvice('', { hidden: true });
        syncLaptopCompareCategoryUi();
        updateLaptopCompareDutyHint();
        renderLaptopCompareMarketGrid();
        renderLaptopCompareResults();
        setLaptopCompareStatus(`Equipment type set to ${getLaptopCompareCategoryMeta().label}.`, 'info');
    });
    document.getElementById('laptopCompareDuty')?.addEventListener('change', updateLaptopCompareDutyHint);
    document.getElementById('laptopCompareSearchOnlineBtn')?.addEventListener('click', () => {
        searchOnlineIctListings({ force: true });
    });
    document.getElementById('laptopCompareRankBtn')?.addEventListener('click', rankLaptopsFromCatalog);
    document.getElementById('laptopCompareMarketBtn')?.addEventListener('click', addLiveMarketListings);
    document.getElementById('laptopCompareClearMarketBtn')?.addEventListener('click', clearLaptopCompareMarketListings);
    document.getElementById('laptopCompareMarketCompareBtn')?.addEventListener('click', () => {
        compareCheckedMarketListings();
    });
    document.getElementById('laptopComparePrintBtn')?.addEventListener('click', printLaptopCompareComparison);
    document.getElementById('laptopCompareSendWinnerBtn')?.addEventListener('click', sendLaptopCompareWinnerToSpecEval);
    document.getElementById('laptopComparePickedBtn')?.addEventListener('click', () => {
        comparePickedLaptops();
    });
    document.getElementById('laptopCompareClearPicksBtn')?.addEventListener('click', clearLaptopComparePicks);
    document.getElementById('laptopCompareEnrichBtn')?.addEventListener('click', () => {
        enrichCurrentLaptopCompareFromWeb();
    });
    document.getElementById('laptopCompareAiBtn')?.addEventListener('click', () => {
        askLaptopCompareAiRecommendation();
    });
    wireCompareLayoutToggles(root);
}

window.initLaptopCompareModule = initLaptopCompareModule;
window.rankLaptopsFromCatalog = rankLaptopsFromCatalog;
window.comparePickedLaptops = comparePickedLaptops;
window.searchOnlineIctListings = searchOnlineIctListings;
window.compareCheckedMarketListings = compareCheckedMarketListings;
window.fillLaptopComparePickSelects = fillLaptopComparePickSelects;
window.enrichCurrentLaptopCompareFromWeb = enrichCurrentLaptopCompareFromWeb;
window.askLaptopCompareAiRecommendation = askLaptopCompareAiRecommendation;
window.getCompareLayoutMode = getCompareLayoutMode;
window.setCompareLayoutMode = setCompareLayoutMode;
window.wireCompareLayoutToggles = wireCompareLayoutToggles;
window.applyCompareLayoutViews = applyCompareLayoutViews;
window.renderCompareShowcase = renderCompareShowcase;
