/* spec-eval.js — Spec Evaluation templates and helpers */

const SPEC_EVAL_TEMPLATES = {
    laptop: [
        ['Duty Profile', '', 'Operational use this laptop must support (field, development, AI, design)'],
        ['Processor', 'Intel Core i5/i7 or AMD Ryzen 5/7 (latest gen)', 'Required for office productivity and development workloads'],
        ['RAM', '16 GB DDR4/DDR5 (expandable)', 'Multitasking and future-proofing'],
        ['Storage', '512 GB NVMe SSD minimum', 'Fast boot and application performance'],
        ['Display', '14\" FHD (1920x1080) anti-glare', 'Standard office readability'],
        ['Graphics', 'Integrated Intel/AMD graphics', 'Adequate for standard IT duties'],
        ['Operating System', 'Windows 11 Pro', 'Domain join and security policy support'],
        ['Connectivity', 'USB-C, USB-A, HDMI, Wi-Fi 6, Bluetooth', 'Peripheral and docking compatibility'],
        ['Battery Life', 'Minimum 8 hours typical use', 'Field and office mobility'],
        ['Webcam / Audio', 'HD webcam with dual mics', 'Virtual meetings'],
        ['Warranty', '3 years onsite / next business day', 'Service continuity and TCO'],
        ['Security', 'TPM 2.0, fingerprint optional', 'ZNA data protection requirements']
    ],
    desktop: [
        ['Processor', 'Intel Core i5/i7 or AMD Ryzen 5/7', 'Office and systems development workloads'],
        ['RAM', '16 GB DDR4/DDR5 (expandable to 32 GB)', 'Multitasking capacity'],
        ['Storage', '512 GB NVMe SSD (+ optional HDD)', 'Performance and local data needs'],
        ['Form Factor', 'SFF / Tower as specified', 'Space and expansion requirements'],
        ['Operating System', 'Windows 11 Pro', 'Domain and policy compliance'],
        ['Graphics', 'Integrated graphics', 'Standard office use'],
        ['Ports', 'USB 3.x, HDMI/DP, Ethernet RJ-45', 'Peripheral connectivity'],
        ['Power Supply', 'Efficient PSU suitable for configuration', 'Reliability and power management'],
        ['Warranty', '3 years parts and labour', 'Lifecycle support'],
        ['Monitor (if bundled)', '24\" FHD IPS', 'Ergonomic workstation setup']
    ],
    printer: [
        ['Print Technology', 'Laser / Inkjet as required', 'Match volume and media needs'],
        ['Print Speed', 'e.g. 30+ ppm A4 mono', 'Throughput for unit workload'],
        ['Resolution', '1200 x 1200 dpi or better', 'Document quality'],
        ['Paper Handling', 'A4; duplex automatic', 'Paper economy and flexibility'],
        ['Connectivity', 'USB + Ethernet (+ Wi-Fi if required)', 'Network print sharing'],
        ['Duty Cycle', 'Monthly duty cycle matching unit volume', 'Avoid under-specified devices'],
        ['Consumables', 'Compatible / high-yield toner/ink available', 'Running cost justification'],
        ['Tray Capacity', 'Minimum 250 sheets', 'Reduced reload frequency'],
        ['Warranty', '1–3 years manufacturer warranty', 'Service cover'],
        ['Drivers / Compatibility', 'Windows 10/11 compatible', 'IT-DIR standard OS support']
    ],
    server: [
        ['Operating System', 'Windows Server 2019/2022 and licence key', 'Domain services, AD, and application hosting'],
        ['Processor', 'Intel Xeon Scalable / AMD EPYC (latest gen, per workload)', 'Virtualization, databases, and compute capacity'],
        ['Memory (RAM)', 'ECC DDR5 — capacity per workload (expandable)', 'Stability under sustained server loads'],
        ['Memory Channels', 'Per processor DIMM channel count (e.g. 8–16 channels)', 'Memory bandwidth for multi-socket configs'],
        ['Boot Storage', 'RAID M.2 / NVMe boot volume (OS + hypervisor)', 'Reliable OS boot separate from data volumes'],
        ['Internal Storage', 'Enterprise SSD/HDD/NVMe — bays and capacity as designed', 'Data, VM, and backup storage'],
        ['RAID / Storage Controller', 'Hardware RAID (Smart Array / PERC / equivalent)', 'Redundancy and array management'],
        ['Expansion Slots', 'PCIe Gen4/Gen5 slots and risers as required', 'NIC, HBA, GPU, and future upgrades'],
        ['Graphics / GPUs', 'None standard; discrete GPU(s) if workload requires', 'VDI, AI, or graphics-intensive apps only'],
        ['Network', 'Dual/quad 1GbE; 10/25GbE optional', 'Service availability and throughput'],
        ['Power Supply', 'Redundant hot-plug PSU (rated for full config)', 'Uptime and failover'],
        ['Form Factor', '1U / 2U rack / tower as specified', 'Server room / rack fit'],
        ['Remote Management', 'iLO / iDRAC / XClarity (licensed)', 'Out-of-band admin and firmware updates'],
        ['Warranty', '1–3 years onsite / next business day (extendable)', 'Mission-critical support cover']
    ],
    network: [
        ['Device Type', 'Switch / Router / Access Point / Firewall', 'Define role in network'],
        ['Ports / Throughput', 'As per site requirement', 'Capacity planning'],
        ['Management', 'Managed / web / CLI', 'Admin capability'],
        ['PoE', 'PoE/PoE+ if required', 'Endpoint power needs'],
        ['Standards', 'Gigabit / Wi-Fi 6 etc.', 'Interoperability'],
        ['Security Features', 'VLANs, ACLs, encryption as required', 'Network defence'],
        ['Warranty', 'Lifetime / 3–5 years as applicable', 'Support window']
    ],
    other: [
        ['Item Description', '', 'Clear description of equipment'],
        ['Key Specification 1', '', 'Critical technical requirement'],
        ['Key Specification 2', '', ''],
        ['Compatibility', '', 'Systems / software it must work with'],
        ['Warranty', '', 'Minimum warranty expectation'],
        ['Standards / Compliance', '', 'Any mandatory standards']
    ],
    tablet: [
        ['Device Type', 'Tablet (Android / iPadOS)', 'Mobile productivity'],
        ['Processor', 'Recent mid/high mobile SoC', 'Smooth office apps'],
        ['RAM', '6–8 GB minimum', 'Multitasking'],
        ['Storage', '128 GB minimum (expandable preferred)', 'Documents and offline content'],
        ['Display', '10–11\" class', 'Readable for manuals/briefings'],
        ['Operating System', 'Android / iPadOS current supported release', 'MDM compatible'],
        ['Connectivity', 'Wi-Fi 6; cellular optional', 'Office and field'],
        ['Security', 'Enterprise MDM / Knox or equivalent', 'ZNA device control'],
        ['Battery', 'Full-day typical use', 'Operational mobility'],
        ['Warranty', '1–2 years manufacturer warranty', 'Service cover']
    ]
};

function buildSpecEvalRow(specName = '', specValue = '', specNote = '') {
    const tbody = document.getElementById('spec-eval-table-body');
    const rowCount = tbody ? tbody.rows.length + 1 : 1;
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td>${rowCount}</td>
        <td><input type="text" class="form-control spec-field-name" placeholder="Specification name" value="${escapeAttr(specName)}"></td>
        <td><input type="text" class="form-control spec-field-value" placeholder="Required value" value="${escapeAttr(specValue)}"></td>
        <td><input type="text" class="form-control spec-field-note" placeholder="Justification / notes" value="${escapeAttr(specNote)}"></td>
        <td><button class="btn btn-danger btn-sm" onclick="removeRow(this)">Remove</button></td>
    `;
    return tr;
}

function escapeAttr(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function renumberSpecEvalRows() {
    renumberSerialRows('spec-eval-table-body');
}

function addSpecEvalRow(specName = '', specValue = '', specNote = '') {
    if (!requireEditAccess()) return;
    const tbody = document.getElementById('spec-eval-table-body');
    if (!tbody) return;
    tbody.appendChild(buildSpecEvalRow(specName, specValue, specNote));
    renumberSpecEvalRows();
}

function addNamedSpecField() {
    if (!requireEditAccess()) return;
    const input = document.getElementById('newSpecFieldName');
    const name = (input?.value || '').trim();
    if (!name) {
        showToast('Enter a specification field name first.', 'error');
        input?.focus();
        return;
    }
    addSpecEvalRow(name, '', '');
    if (input) input.value = '';
    showToast(`Added spec field: ${name}`);
}

function clearSpecEvalRows() {
    if (!requireEditAccess()) return;
    const tbody = document.getElementById('spec-eval-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';
    tbody.appendChild(buildSpecEvalRow());
}

function loadSpecEvalTemplate(category, { confirmReplace = true } = {}) {
    if (!requireEditAccess()) return;
    const template = SPEC_EVAL_TEMPLATES[category];
    if (!template) {
        showToast('No template available for that category.', 'error');
        return;
    }

    const tbody = document.getElementById('spec-eval-table-body');
    if (!tbody) return;

    const hasContent = Array.from(tbody.querySelectorAll('input')).some((el) => el.value.trim());
    if (confirmReplace && hasContent) {
        const ok = window.confirm('Replace current specification rows with the selected template?');
        if (!ok) return;
    }

    tbody.innerHTML = '';
    template.forEach(([name, value, note]) => {
        tbody.appendChild(buildSpecEvalRow(name, value, note));
    });
    renumberSpecEvalRows();

    const categorySelect = document.getElementById('specEvalCategory');
    if (categorySelect && categorySelect.value !== category) {
        categorySelect.value = category;
    }

    showToast(`${category.charAt(0).toUpperCase() + category.slice(1)} specification template loaded.`);
}

function updateSpecEvalTotal() {
    const qty = parseFloat(document.getElementById('specEvalQty')?.value) || 0;
    const unit = parseFloat(document.getElementById('specEvalUnitPrice')?.value) || 0;
    const totalEl = document.getElementById('specEvalTotal');
    if (totalEl) {
        const total = qty * unit;
        totalEl.value = total ? total.toFixed(2) : '';
    }
}

const SPEC_KNOWN_BRANDS = [
    'Hewlett Packard', 'HP', 'Dell', 'Lenovo', 'Apple', 'ASUS', 'Acer', 'Microsoft',
    'Canon', 'Epson', 'Brother', 'Samsung', 'Cisco', 'Huawei', 'Toshiba', 'MSI',
    'Gigabyte', 'Xerox', 'Kyocera', 'Ricoh', 'TP-Link', 'Ubiquiti', 'Fortinet', 'HPE'
];

const SPEC_SERIES_HINTS = [
    'OmniBook', 'Omnibook', 'EliteBook', 'ProBook', 'Pavilion', 'ZBook', 'Envy',
    'Latitude', 'Precision', 'XPS', 'Inspiron', 'OptiPlex', 'PowerEdge', 'ProLiant', 'DL380', 'DL360', 'Vostro',
    'ThinkPad', 'ThinkCentre', 'ThinkSystem', 'IdeaPad', 'Yoga', 'Legion', 'ThinkStation',
    'LaserJet', 'DeskJet', 'OfficeJet', 'EcoTank', 'ImageCLASS',
    'MacBook', 'iMac', 'Mac mini', 'Mac Studio', 'Surface',
    'ZenBook', 'VivoBook', 'ROG', 'TUF', 'Swift', 'Aspire'
];

function detectSpecCategory(text) {
    const lower = text.toLowerCase();
    const rules = [
        ['laptop', /\b(laptop|notebook|omnibook|elitebook|probook|thinkpad|macbook|zenbook|vivobook|inspiron|latitude|xps|surface laptop|zbook)\b/i],
        ['desktop', /\b(desktop|optiplex|prodesk|thinkcentre|imac|all[-\s]?in[-\s]?one|\baio\b|tower pc|workstation(?!\s*laptop))\b/i],
        ['printer', /\b(printer|laserjet|inkjet|multifunction|\bmfp\b|deskjet|officejet|ecosys|imageclass)\b/i],
        ['server', /\b(server|poweredge|proliant|\bxeon\b|\bepyc\b|rackmount|dl380|dl360|thinksystem|proliant)\b/i],
        ['network', /\b(switch|router|access\s*point|\bap\b|firewall|wireless\s*controller)\b/i],
        ['other', /\b(tablet|ipad|galaxy\s*tab|\btab\s*[as]?\d)\b/i]
    ];
    for (const [category, pattern] of rules) {
        if (pattern.test(lower)) return category;
    }
    return 'other';
}

function extractSpecBrand(text) {
    const sorted = [...SPEC_KNOWN_BRANDS].sort((a, b) => b.length - a.length);
    for (const brand of sorted) {
        const pattern = new RegExp(`\\b${brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (pattern.test(text)) {
            if (/^hewlett\s*packard$/i.test(brand) || /^hpe$/i.test(brand)) return 'HP';
            return brand.replace(/\b\w/g, (c) => c.toUpperCase()).replace(/\bHp\b/, 'HP').replace(/\bHpe\b/, 'HPE');
        }
    }
    return '';
}

function extractSpecProcessor(text) {
    const patterns = [
        /\b((?:\d+(?:st|nd|rd|th|5th)\s+Gen\s+)?Intel\s+Xeon(?:\s+Scalable)?(?:\s+[\w-]+)?)\b/i,
        /\b(AMD\s+EPYC(?:\s+[\w-]+)?)\b/i,
        /\b(Intel\s+Core\s+Ultra\s+\d+\s*(?:[A-Z]\d+)?)\b/i,
        /\b(Intel\s+Core\s+i[3579](?:\s*[-/]?\s*\d{4,5}\w*)?)\b/i,
        /\b(Intel\s+Core\s+i[3579])\b/i,
        /\b(Intel\s+Xeon(?:\s+\w+)?)\b/i,
        /\b(AMD\s+Ryzen\s+(?:AI\s+)?[3579](?:\s*\d{4}\w*)?)\b/i,
        /\b(AMD\s+Ryzen\s+[3579])\b/i,
        /\b(Apple\s+M[1-4](?:\s+(?:Pro|Max|Ultra))?)\b/i,
        /\b(Snapdragon\s+X(?:\s+Elite|\s+Plus)?)\b/i
    ];
    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) return match[1].replace(/\s+/g, ' ').trim();
    }
    return '';
}

function extractSpecMemoryChannels(text) {
    const m = text.match(/\b(\d+)\s*(?:DIMM\s*)?(?:memory\s*)?channels?\s*(?:per\s*processor)?\b/i);
    if (m) return `${m[1]} DIMM channels per processor`;
    const m2 = text.match(/\b(\d+)\s*DIMM\s*(?:slots?|channels?)\b/i);
    if (m2) return `${m2[1]} DIMM channels`;
    return '';
}

function extractSpecBootStorage(text) {
    if (/\braid\s*m\.?2\b/i.test(text)) return 'RAID M.2 boot options';
    const m = text.match(/\bboot\s*(?:storage|drive)?\s*[:\-–]?\s*([^\n|;]{3,80})/i);
    if (m) return m[1].trim();
    if (/\bboot\b/i.test(text) && /\b(nvme|m\.2|ssd)\b/i.test(text)) return 'NVMe/M.2 boot volume';
    return '';
}

function extractSpecInternalStorage(text) {
    const bays = text.match(/\b(\d+)\s*(?:EDSFF|SFF|LFF|hot[-\s]?plug\s*)?(?:drive\s*)?bays?\b/i);
    if (bays) return `${bays[1]} ${(/EDSFF/i.test(text) ? 'EDSFF ' : '')}drive bays`;
    if (/\bedsff\b/i.test(text)) return 'EDSFF drive bays as specified';
    return '';
}

function extractSpecExpansionSlots(text) {
    const m = text.match(/\bPCIe\s*Gen\s*(\d+)\b/i);
    if (m) return `PCIe Gen${m[1]}`;
    const m2 = text.match(/\b(\d+)\s*(?:x\s*)?(?:PCIe|expansion)\s*slots?\b/i);
    if (m2) return `${m2[1]} PCIe expansion slots`;
    if (/\bpcie\b/i.test(text)) return 'PCIe expansion as specified';
    return '';
}

function extractSpecServerGraphics(text) {
    const m = text.match(/\b(\d+)\s*(?:x\s*)?(?:single[-\s]?wide\s*)?GPUs?\b/i);
    if (m) return `Up to ${m[1]} single-wide GPU(s) as required`;
    if (/\bgpu\b/i.test(text)) return 'Discrete GPU(s) as required';
    return '';
}

function extractSpecRam(text) {
    const match = text.match(/\b(\d+(?:\.\d+)?)\s*(TB|GB|G)\s*(DDR\d)?\s*(ECC\s*)?(RAM|Memory)?\b/i);
    if (!match) return '';
    const amount = match[1];
    const unit = match[2].toUpperCase().replace(/^G$/, 'GB');
    const ddr = match[3] ? ` ${match[3].toUpperCase()}` : '';
    const ecc = match[4] ? ' ECC' : (/ECC/i.test(text) ? ' ECC' : '');
    return `${amount} ${unit}${ddr}${ecc}`.replace(/\s+/g, ' ').trim();
}

function extractSpecStorage(text) {
    const match = text.match(/\b(\d+(?:\.\d+)?)\s*(TB|GB)\s*(NVMe\s*)?(SSD|HDD|Storage)?\b/i);
    if (!match) return '';
    const size = `${match[1]} ${match[2].toUpperCase()}`;
    const kind = match[4] ? match[4].toUpperCase() : (match[3] ? 'SSD' : 'SSD');
    const nvme = match[3] ? 'NVMe ' : '';
    return `${size} ${nvme}${kind}`.replace(/\s+/g, ' ').trim();
}

function extractSpecDisplay(text) {
    const match = text.match(/\b(\d{2}(?:\.\d)?)\s*(?:\"|''|inch|in)\b/i)
        || text.match(/\b(\d{2}(?:\.\d)?)(?=\s*(?:FHD|QHD|UHD|OLED|IPS|Display))/i);
    if (!match) return '';
    let value = `${match[1]}"`;
    if (/\b(OLED)\b/i.test(text)) value += ' OLED';
    else if (/\b(UHD|4K)\b/i.test(text)) value += ' UHD';
    else if (/\b(QHD|1440p)\b/i.test(text)) value += ' QHD';
    else if (/\b(FHD|1080p|Full\s*HD)\b/i.test(text)) value += ' FHD';
    else value += ' display';
    return value;
}

function extractSpecSeries(text) {
    const sorted = [...SPEC_SERIES_HINTS].sort((a, b) => b.length - a.length);
    for (const series of sorted) {
        const pattern = new RegExp(`\\b${series.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b(?:\\s+[A-Z0-9][\\w-]*)?`, 'i');
        const match = text.match(pattern);
        if (match) return match[0].replace(/\s+/g, ' ').trim();
    }
    return '';
}

function extractSpecOs(text) {
    if (/\bWindows\s*Server\s*2022\b/i.test(text)) return 'Windows Server 2022 and licence key';
    if (/\bWindows\s*Server\s*2019\b/i.test(text)) return 'Windows Server 2019 and licence key';
    if (/\bWindows\s*Server\b/i.test(text)) return 'Windows Server and licence key';
    if (/\b(RHEL|Red\s*Hat\s*Enterprise)\b/i.test(text)) return 'Red Hat Enterprise Linux';
    if (/\bUbuntu\s*Server\b/i.test(text)) return 'Ubuntu Server LTS';
    if (/\bWindows\s*11\s*Pro\b/i.test(text)) return 'Windows 11 Pro';
    if (/\bWindows\s*11\b/i.test(text)) return 'Windows 11';
    if (/\bWindows\s*10\s*Pro\b/i.test(text)) return 'Windows 10 Pro';
    if (/\bmacOS\b/i.test(text) || /\bMacBook\b/i.test(text) || /\biMac\b/i.test(text)) return 'macOS';
    return '';
}

function parseSpecItemName(rawName) {
    const text = String(rawName || '').trim();
    if (!text) return null;

    const category = detectSpecCategory(text);
    const brand = extractSpecBrand(text);
    const processor = extractSpecProcessor(text);
    const ram = extractSpecRam(text);
    const storage = extractSpecStorage(text);
    const display = extractSpecDisplay(text);
    const series = extractSpecSeries(text);
    const os = extractSpecOs(text);
    const memoryChannels = extractSpecMemoryChannels(text);
    const bootStorage = extractSpecBootStorage(text);
    const internalStorage = extractSpecInternalStorage(text);
    const expansionSlots = extractSpecExpansionSlots(text);
    const serverGraphics = extractSpecServerGraphics(text);

    const brandModel = [brand, series].filter(Boolean).join(' ') || brand || series;
    const overrides = {};

    if (processor) {
        overrides.Processor = processor;
    }
    if (ram) {
        overrides.RAM = ram;
        overrides['Memory (RAM)'] = ram;
    }
    if (storage) {
        overrides.Storage = storage;
        overrides['Internal Storage'] = internalStorage || storage;
    }
    if (bootStorage) overrides['Boot Storage'] = bootStorage;
    if (internalStorage) overrides['Internal Storage'] = internalStorage;
    if (memoryChannels) overrides['Memory Channels'] = memoryChannels;
    if (expansionSlots) overrides['Expansion Slots'] = expansionSlots;
    if (serverGraphics) overrides['Graphics / GPUs'] = serverGraphics;
    if (display) {
        overrides.Display = display;
        overrides['Monitor (if bundled)'] = display;
    }
    if (os) {
        overrides['Operating System'] = os;
        overrides['OS Support'] = os;
        overrides['Drivers / Compatibility'] = `${os} compatible`;
    }
    if (category === 'server') {
        if (/ilo\b/i.test(text)) overrides['Remote Management'] = 'HPE iLO (licensed)';
        else if (/idrac\b/i.test(text)) overrides['Remote Management'] = 'Dell iDRAC';
        else if (/xclarity\b/i.test(text)) overrides['Remote Management'] = 'Lenovo XClarity';
        if (/\b2u\b/i.test(text)) overrides['Form Factor'] = '2U rack';
        else if (/\b1u\b/i.test(text)) overrides['Form Factor'] = '1U rack';
        if (/smart\s*array|perc|raid/i.test(text)) {
            overrides['RAID / Storage Controller'] = /smart\s*array/i.test(text)
                ? 'HPE Smart Array'
                : (/perc/i.test(text) ? 'Dell PERC' : 'Hardware RAID controller');
        }
    }
    if (brandModel) {
        overrides['Preferred Brand / Model'] = brandModel;
        overrides['Item Description'] = text;
    }
    if (brand && category === 'printer') {
        overrides['Print Technology'] = /laser/i.test(text) ? 'Laser' : (/ink/i.test(text) ? 'Inkjet' : overrides['Print Technology']);
    }

    // Extra laptop/desktop notes from named high-end CPU
    if (processor && /i9|Ryzen\s*9|M[234]\s*(Pro|Max|Ultra)?/i.test(processor)) {
        overrides._priceNote = 'Higher-tier processor justifies premium unit price versus mid-range models.';
    }

    return {
        category,
        brand,
        brandModel,
        processor,
        ram,
        storage,
        display,
        series,
        os,
        overrides,
        sourceText: text
    };
}

function applyParsedSpecsToTable(parsed) {
    const category = parsed.category || 'other';
    const template = SPEC_EVAL_TEMPLATES[category] || SPEC_EVAL_TEMPLATES.other;
    const tbody = document.getElementById('spec-eval-table-body');
    if (!tbody) return;

    const fieldMap = {
        Processor: parsed.processor,
        RAM: parsed.ram,
        'Memory (RAM)': parsed.ram,
        Storage: parsed.storage,
        'Internal Storage': parsed.storage,
        'Boot Storage': parsed.overrides?.['Boot Storage'],
        'Memory Channels': parsed.overrides?.['Memory Channels'],
        'Expansion Slots': parsed.overrides?.['Expansion Slots'],
        'Graphics / GPUs': parsed.overrides?.['Graphics / GPUs'],
        Display: parsed.display,
        'Operating System': parsed.os,
        'OS Support': parsed.os,
        'Monitor (if bundled)': parsed.display
    };

    tbody.innerHTML = '';
    template.forEach(([name, defaultValue, defaultNote]) => {
        let value = defaultValue;
        let note = defaultNote;

        if (fieldMap[name]) {
            value = fieldMap[name];
            note = `Extracted from item name: ${parsed.sourceText}`;
        } else if (parsed.overrides[name]) {
            value = parsed.overrides[name];
            note = `Extracted from item name: ${parsed.sourceText}`;
        }

        if (name === 'Processor' && parsed.processor && parsed._priceNote) {
            note = parsed.overrides._priceNote || note;
        }

        // Brand/model row enrichment for first descriptive fields
        if ((name === 'Item Description' || name === 'Key Specification 1') && !fieldMap[name]) {
            if (name === 'Item Description') value = parsed.sourceText;
            if (name === 'Key Specification 1' && parsed.processor) value = parsed.processor;
        }

        tbody.appendChild(buildSpecEvalRow(name, value, note));
    });

    // Ensure extracted facts exist even if template lacked the field
    const ensureFields = [
        ['Brand / Model Series', parsed.brandModel, 'Identified from item name'],
        ['Processor', parsed.processor, 'Identified from item name'],
        ['RAM', parsed.ram, 'Identified from item name'],
        ['Storage', parsed.storage, 'Identified from item name'],
        ['Display', parsed.display, 'Identified from item name']
    ];

    const existingNames = new Set(
        Array.from(tbody.querySelectorAll('.spec-field-name')).map((el) => el.value.trim().toLowerCase())
    );

    ensureFields.forEach(([name, value, note]) => {
        if (!value) return;
        if (existingNames.has(name.toLowerCase())) return;
        // Skip if a close field already holds this value
        const already = Array.from(tbody.querySelectorAll('.spec-field-value')).some((el) => el.value.trim().toLowerCase() === value.toLowerCase());
        if (already && name !== 'Brand / Model Series') return;
        tbody.appendChild(buildSpecEvalRow(name, value, note));
        existingNames.add(name.toLowerCase());
    });

    renumberSpecEvalRows();
}

function applySpecRowsToTable(rows, { sourceNote = '' } = {}) {
    const tbody = document.getElementById('spec-eval-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';
    (rows || []).forEach(([name, value, note]) => {
        const finalNote = note || sourceNote || '';
        tbody.appendChild(buildSpecEvalRow(name, value, finalNote));
    });
    if (!tbody.rows.length) tbody.appendChild(buildSpecEvalRow());
    renumberSpecEvalRows();
}

function applySpecLookupMeta({ category, brand, brandModel, rawName, purposeBits = [] } = {}) {
    const categoryEl = document.getElementById('specEvalCategory');
    if (categoryEl && category) categoryEl.value = category;

    const brandEl = document.getElementById('specEvalBrand');
    if (brandEl) brandEl.value = brandModel || brand || rawName || '';

    if (category === 'laptop' || category === 'desktop' || category === 'server') {
        const glEl = document.getElementById('specEvalGl');
        if (glEl) glEl.value = '3112210001';
    } else if (category === 'printer') {
        const glEl = document.getElementById('specEvalGl');
        if (glEl && !glEl.value) glEl.value = '3112210001';
    }

    const purposeEl = document.getElementById('specEvalPurpose');
    if (purposeEl && !purposeEl.value.trim() && rawName) {
        const bits = purposeBits.filter(Boolean).join(', ');
        purposeEl.value = bits
            ? `Procurement of ${rawName} to meet IT-DIR operational requirements. Key configuration identified: ${bits}. Specifications below justify the estimated unit price.`
            : `Procurement of ${rawName} to meet IT-DIR operational requirements. Specifications below justify the estimated unit price.`;
    }
}

function applyCatalogProductToForm(product, rawName) {
    const brandModel = [product.brand, product.model].filter(Boolean).join(' ');
    applySpecLookupMeta({
        category: product.category || 'other',
        brand: product.brand,
        brandModel,
        rawName,
        purposeBits: [brandModel, product.category]
    });
    applySpecRowsToTable(product.specs || [], {
        sourceNote: `From local product catalog (${product.model || product.id})`
    });
}

/** Apply AI / OCR parsed spec document to the evaluation form. */
function applySpecDocumentToForm(result) {
    const rawName = result.productName || [result.brand, result.model].filter(Boolean).join(' ') || '';
    if (rawName) {
        const itemEl = document.getElementById('specEvalItemName');
        if (itemEl && !itemEl.value.trim()) itemEl.value = rawName;
    }
    applyWebLookupToForm({
        brand: result.brand,
        model: result.model || result.productName,
        category: result.category,
        specs: result.specs,
        sources: [{ provider: result.ai ? 'AI document parse' : 'Document parse' }]
    }, rawName || result.productName || 'Uploaded spec');

    const purposeEl = document.getElementById('specEvalPurpose');
    if (purposeEl && result.purpose && !purposeEl.value.trim()) {
        purposeEl.value = result.purpose;
    } else if (purposeEl && result.summary && !purposeEl.value.trim()) {
        purposeEl.value = result.summary;
    }
}

function applyWebLookupToForm(result, rawName) {
    const brandModel = [result.brand, result.model].filter(Boolean).join(' ') || result.model || rawName;
    const category = result.category || detectSpecCategory(rawName);
    applySpecLookupMeta({
        category,
        brand: result.brand,
        brandModel,
        rawName,
        purposeBits: [brandModel, category]
    });

    let rows = Array.isArray(result.specs) ? result.specs.slice() : [];
    if (!rows.length) {
        const template = SPEC_EVAL_TEMPLATES[category] || SPEC_EVAL_TEMPLATES.other;
        rows = template.map(([name, value, note]) => [name, value, note]);
    }

    const sourceTitles = (result.sources || [])
        .map((s) => s.title || s.provider)
        .filter(Boolean)
        .slice(0, 2)
        .join('; ');
    const sourceNote = sourceTitles
        ? `From online lookup (${sourceTitles})`
        : 'From online lookup';

    applySpecRowsToTable(rows, { sourceNote });
}

function setAutofillBusy(busy) {
    const btn = document.getElementById('autofillFromItemBtn');
    const input = document.getElementById('specEvalItemName');
    if (btn) {
        btn.disabled = !!busy;
        btn.dataset.busy = busy ? '1' : '0';
        btn.textContent = busy ? 'Looking up…' : 'Auto-fill Specs';
    }
    if (input) input.disabled = !!busy;
}

async function fetchOnlineProductSpecs(query) {
    const response = await fetch(`${API_BASE}/api/product-specs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
    });
    let payload = null;
    try {
        payload = await response.json();
    } catch (_err) {
        payload = null;
    }
    if (!response.ok || !payload?.ok) {
        const message = payload?.error || `Online lookup failed (${response.status})`;
        const err = new Error(message);
        err.payload = payload;
        throw err;
    }
    return payload;
}

async function autofillSpecEvaluationFromItemName({ silent = false } = {}) {
    if (!requireEditAccess()) return false;

    const itemInput = document.getElementById('specEvalItemName');
    const rawName = (itemInput?.value || '').trim();
    if (!rawName) {
        if (!silent) showToast('Enter an item name first, e.g. Samsung Tab 11 or HP EliteBook 840 G10.', 'error');
        itemInput?.focus();
        return false;
    }

    setAutofillBusy(true);
    try {
        // Option 1: curated local catalog
        const catalogHit = typeof findProductInCatalog === 'function'
            ? findProductInCatalog(rawName)
            : null;

        if (catalogHit?.product) {
            applyCatalogProductToForm(catalogHit.product, rawName);
            if (!silent) {
                showToast(
                    `Specs filled from local catalog: ${catalogHit.product.model} (match ${catalogHit.score}%). Review before procurement.`
                );
            }
            return true;
        }

        // Option 3: online search + intelligent extract
        try {
            const online = await fetchOnlineProductSpecs(rawName);
            if (online?.specs?.length) {
                applyWebLookupToForm(online, rawName);
                if (!silent) {
                    const mode = online.ai ? 'AI-enriched web lookup' : 'web lookup';
                    showToast(
                        `Specs filled via ${mode} (${online.specs.length} fields). Review carefully before procurement.`
                    );
                }
                return true;
            }

            // Soft online hit with little structure — still apply meta, then parse name
            if (online) {
                applyWebLookupToForm(online, rawName);
            }
        } catch (onlineErr) {
            if (!silent) {
                console.warn('Online product lookup unavailable:', onlineErr);
            }
        }

        // Fallback: parse details already present in the typed name
        const parsed = parseSpecItemName(rawName);
        if (!parsed) {
            if (!silent) showToast('Could not resolve specs from catalog, web, or item name.', 'error');
            return false;
        }

        applySpecLookupMeta({
            category: parsed.category,
            brand: parsed.brand,
            brandModel: parsed.brandModel || parsed.brand,
            rawName,
            purposeBits: [parsed.brandModel || parsed.brand, parsed.processor, parsed.category]
        });
        applyParsedSpecsToTable(parsed);

        const found = [parsed.category, parsed.brand, parsed.processor, parsed.ram, parsed.storage, parsed.display]
            .filter(Boolean);
        if (!silent) {
            showToast(
                `No catalog/web match. Specs inferred from item name (${found.length} details). Add model to catalog or check network.`
            );
        }
        return true;
    } finally {
        setAutofillBusy(false);
    }
}

function populateSpecProductCatalogHints() {
    const list = document.getElementById('specProductCatalogHints');
    if (!list || typeof PRODUCT_SPECS_CATALOG === 'undefined') return;
    list.innerHTML = '';
    PRODUCT_SPECS_CATALOG.forEach((entry) => {
        const labels = new Set([
            `${entry.brand} ${entry.model}`.trim(),
            ...(entry.names || [])
        ]);
        labels.forEach((label) => {
            if (!label) return;
            const option = document.createElement('option');
            option.value = label;
            list.appendChild(option);
        });
    });
}

function getSpecEvalFormSnapshot() {
    const categoryEl = document.getElementById('specEvalCategory');
    const categoryValue = categoryEl?.value || '';
    const categoryLabel = categoryEl?.selectedOptions?.[0]?.text || 'ICT Equipment';
    const specs = [];
    document.querySelectorAll('#spec-eval-table-body tr').forEach((tr) => {
        const name = tr.querySelector('.spec-field-name')?.value?.trim() || '';
        const value = tr.querySelector('.spec-field-value')?.value?.trim() || '';
        const note = tr.querySelector('.spec-field-note')?.value?.trim() || '';
        if (name || value) specs.push({ name, value, note });
    });

    return {
        evalNo: document.getElementById('specEvalNumber')?.value?.trim() || '',
        date: document.getElementById('specEvalDate')?.value || '',
        categoryValue,
        categoryLabel,
        itemName: document.getElementById('specEvalItemName')?.value?.trim() || 'ICT Equipment',
        brand: document.getElementById('specEvalBrand')?.value?.trim() || '',
        gl: document.getElementById('specEvalGl')?.selectedOptions?.[0]?.text || '',
        qty: document.getElementById('specEvalQty')?.value || '',
        unitPrice: document.getElementById('specEvalUnitPrice')?.value || '',
        total: document.getElementById('specEvalTotal')?.value || '',
        purpose: document.getElementById('specEvalPurpose')?.value?.trim() || '',
        preparedBy: document.getElementById('specEvalPreparedBy')?.value?.trim() || '',
        recommendedBy: document.getElementById('specEvalRecommendedBy')?.value?.trim() || '',
        approvedBy: document.getElementById('specEvalApprovedBy')?.value?.trim() || '',
        specs
    };
}

function getSpecSheetIcon(label) {
    const key = String(label || '').toLowerCase();
    if (/operating|os|windows|macos|linux/.test(key)) return 'OS';
    if (/processor|cpu|chip/.test(key)) return 'CPU';
    if (/graphics|gpu|video/.test(key)) return 'GPU';
    if (/display|monitor|screen/.test(key)) return 'DSP';
    if (/memory|ram|dimm|channel/.test(key)) return 'RAM';
    if (/boot\s*storage|boot\s*drive/.test(key)) return 'BOOT';
    if (/internal\s*storage|storage|ssd|hdd|disk|bay/.test(key)) return 'SSD';
    if (/expansion|pcie|slot/.test(key)) return 'PCI';
    if (/raid|controller/.test(key)) return 'RAID';
    if (/remote|management|ilo|idrac/.test(key)) return 'RMT';
    if (/form\s*factor|rack|tower/.test(key)) return 'RCK';
    if (/wireless|wifi|wi-fi|bluetooth|network/.test(key)) return 'NET';
    if (/power|charger|psu/.test(key)) return 'PWR';
    if (/battery/.test(key)) return 'BAT';
    if (/port|i\/o|thunderbolt|usb|hdmi/.test(key)) return 'I/O';
    if (/webcam|camera/.test(key)) return 'CAM';
    if (/keyboard|input|touchpad/.test(key)) return 'INP';
    if (/software|license/.test(key)) return 'APP';
    if (/warranty|secure|security|tpm/.test(key)) return 'SEC';
    if (/brand|model|series/.test(key)) return 'MDL';
    return 'SPC';
}

function buildSpecSheetHighlights(snapshot) {
    const highlights = [
        { title: 'Powerful Performance', text: 'Configured for demanding IT-DIR workloads.' },
        { title: 'Stunning Visuals', text: 'Clear display quality for office and field use.' },
        { title: 'Ultra Fast Storage', text: 'Responsive boot and application loading.' },
        { title: 'Next-Gen Connectivity', text: 'Modern ports and wireless standards.' },
        { title: 'Long Lasting', text: 'Designed for durable day-to-day operations.' },
        { title: 'Reliable & Secure', text: 'Warranty and security aligned to ZNA needs.' }
    ];

    const byHint = [
        { re: /processor|cpu/i, idx: 0 },
        { re: /display|monitor|graphics/i, idx: 1 },
        { re: /storage|ssd/i, idx: 2 },
        { re: /wireless|wifi|port|thunderbolt|connectivity/i, idx: 3 },
        { re: /battery|power/i, idx: 4 },
        { re: /warranty|security|tpm/i, idx: 5 }
    ];

    snapshot.specs.forEach((spec) => {
        byHint.forEach((hint) => {
            if (hint.re.test(spec.name) && spec.value) {
                highlights[hint.idx].text = spec.value;
            }
        });
    });
    return highlights;
}

function buildSpecSheetFeaturePills(snapshot) {
    const pills = [];
    const find = (re) => snapshot.specs.find((s) => re.test(s.name) && s.value);

    const ports = find(/port|i\/o|thunderbolt|usb/i);
    if (ports) pills.push({ title: ports.name, text: ports.value });
    const cam = find(/webcam|camera/i);
    if (cam) pills.push({ title: cam.name, text: cam.value });
    const input = find(/keyboard|touchpad|input/i);
    if (input) pills.push({ title: input.name, text: input.value });
    const secure = find(/warranty|security|tpm/i);
    if (secure) pills.push({ title: 'Secure & Professional', text: secure.value });

    const fallbacks = [
        { title: 'Enterprise Ready', text: 'Configured for IT-DIR operations' },
        { title: 'Service Support', text: 'Warranty-backed procurement' },
        { title: 'Standardised Spec', text: 'Evaluated against Tech Stores requirements' },
        { title: 'Cost Justified', text: 'Specs support estimated unit price' }
    ];
    while (pills.length < 4) pills.push(fallbacks[pills.length]);
    return pills.slice(0, 4);
}

function colorizeProductTitle(itemName) {
    const safe = escapeHtml(itemName || 'ICT Equipment');
    const match = safe.match(/^(.*?)(Intel(?:&reg;)?\s+Core(?:&trade;)?\s+(?:Ultra\s+)?(?:i?[3579Xx]\w*)|AMD\s+Ryzen(?:\s+AI)?\s*[3579]\w*|Apple\s+M[1-4](?:\s+(?:Pro|Max|Ultra))?)(.*)$/i);
    if (!match) return safe;
    return `${match[1]}<span class="spec-sheet-accent">${match[2]}</span>${match[3]}`;
}

function buildSpecEvalDatasheetHtml() {
    const snap = getSpecEvalFormSnapshot();
    const highlights = buildSpecSheetHighlights(snap);
    const pills = buildSpecSheetFeaturePills(snap);
    const badgeLabel = `${(snap.categoryLabel || 'EQUIPMENT').toUpperCase()} SPECIFICATION`;
    const tagline = snap.purpose
        ? escapeHtml(snap.purpose).slice(0, 160)
        : 'Power. Performance. Mobility. Engineered for IT-DIR operations.';
    const osSpec = snap.specs.find((s) => /operating|windows|macos|os support/i.test(s.name));
    const unitPrice = snap.unitPrice ? formatCurrency(parseFloat(snap.unitPrice) || 0) : '—';
    const totalPrice = snap.total ? formatCurrency(parseFloat(snap.total) || 0) : '—';

    const specRows = (snap.specs.length ? snap.specs : [{ name: 'Specification', value: 'Not yet defined', note: '' }])
        .map((spec) => `
            <tr>
                <td class="spec-sheet-icon-cell"><span class="spec-sheet-icon">${escapeHtml(getSpecSheetIcon(spec.name))}</span></td>
                <td class="spec-sheet-label">${escapeHtml((spec.name || 'SPEC').toUpperCase())}</td>
                <td class="spec-sheet-value">${escapeHtml(spec.value || '—')}${spec.note ? `<div class="spec-sheet-note">${escapeHtml(spec.note)}</div>` : ''}</td>
            </tr>
        `).join('');

    const highlightHtml = highlights.map((h) => `
        <div class="spec-sheet-highlight">
            <span class="spec-sheet-highlight-ico"></span>
            <div>
                <strong>${escapeHtml(h.title)}</strong>
                <p>${escapeHtml(h.text)}</p>
            </div>
        </div>
    `).join('');

    const pillsHtml = pills.map((p) => `
        <div class="spec-sheet-pill">
            <span class="spec-sheet-pill-ico"></span>
            <div>
                <strong>${escapeHtml(p.title)}</strong>
                <small>${escapeHtml(p.text)}</small>
            </div>
        </div>
    `).join('');

    return `
    <div class="spec-sheet">
        <header class="spec-sheet-header">
            <div class="spec-sheet-brand">
                <img src="../assets/techstores-badge.png" alt="TechStores logo" class="spec-sheet-logo">
                <div class="spec-sheet-brand-meta">
                    <div>IT-DIR Tech Stores</div>
                    <div>Zimbabwe National Army</div>
                    <div>Cost Centre Z04P2SP212</div>
                </div>
            </div>
            <div class="spec-sheet-title-block">
                <h1>${colorizeProductTitle(snap.itemName)}</h1>
                <div class="spec-sheet-badge">${escapeHtml(badgeLabel)}</div>
                <p class="spec-sheet-tagline">${tagline}</p>
                <div class="spec-sheet-meta-line">
                    ${snap.evalNo ? `<span>Eval No: <strong>${escapeHtml(snap.evalNo)}</strong></span>` : ''}
                    ${snap.date ? `<span>Date: <strong>${escapeHtml(snap.date)}</strong></span>` : ''}
                    ${snap.brand ? `<span>Brand/Model: <strong>${escapeHtml(snap.brand)}</strong></span>` : ''}
                    ${snap.qty ? `<span>Qty: <strong>${escapeHtml(snap.qty)}</strong></span>` : ''}
                    <span>Est. Unit: <strong>${escapeHtml(unitPrice)}</strong></span>
                    <span>Est. Total: <strong>${escapeHtml(totalPrice)}</strong></span>
                </div>
            </div>
            <div class="spec-sheet-hero" aria-hidden="true">
                <div class="spec-sheet-hero-card">
                    <div class="spec-sheet-hero-label">${escapeHtml((snap.categoryLabel || 'ICT').toUpperCase())}</div>
                    <div class="spec-sheet-hero-name">${escapeHtml(snap.brand || snap.itemName)}</div>
                    <div class="spec-sheet-hero-chip">${escapeHtml(osSpec?.value || 'Professional Specification')}</div>
                </div>
            </div>
        </header>

        <div class="spec-sheet-body">
            <div class="spec-sheet-main">
                <table class="spec-sheet-table">
                    <tbody>${specRows}</tbody>
                </table>
            </div>
            <aside class="spec-sheet-side">
                <div class="spec-sheet-side-title">Key Highlights</div>
                ${highlightHtml}
            </aside>
        </div>

        <div class="spec-sheet-features">
            <div class="spec-sheet-pills">${pillsHtml}</div>
            <div class="spec-sheet-os-badge">
                <strong>${escapeHtml(osSpec?.value || 'Windows 11 Pro')}</strong>
                <span>Professional Power. Everyday.</span>
            </div>
        </div>

        <footer class="spec-sheet-signoff">
            <div class="spec-sheet-sign-col">
                <h4>Compiled By:</h4>
                <div class="spec-sheet-sign-name">${escapeHtml(snap.preparedBy || '')}</div>
                <div class="spec-sheet-sign-line"><span>Appt:</span><span class="spec-sheet-sign-rule"></span></div>
                <div class="spec-sheet-sign-line"><span>Date:</span><span class="spec-sheet-sign-rule"></span></div>
                <div class="spec-sheet-sign-line"><span>Signature:</span><span class="spec-sheet-sign-rule"></span></div>
            </div>
            <div class="spec-sheet-sign-col">
                <h4>Approved By:</h4>
                <div class="spec-sheet-sign-name">${escapeHtml(snap.approvedBy || '')}</div>
                <div class="spec-sheet-sign-line"><span>Appt:</span><span class="spec-sheet-sign-rule"></span></div>
                <div class="spec-sheet-sign-line"><span>Date:</span><span class="spec-sheet-sign-rule"></span></div>
                <div class="spec-sheet-sign-line"><span>Signature:</span><span class="spec-sheet-sign-rule"></span></div>
            </div>
        </footer>
    </div>`;
}

function ensureSpecEvalPrintHost() {
    let host = document.getElementById('specEvalPrintHost');
    if (!host) {
        host = document.createElement('div');
        host.id = 'specEvalPrintHost';
        host.className = 'spec-eval-print-host';
        document.body.appendChild(host);
    }
    return host;
}

let specSheetPreviewZoom = 1;

function resetSpecSheetPreviewWindowState() {
    const modal = document.getElementById('specSheetPreviewModal');
    const dialog = document.getElementById('specSheetPreviewDialog');
    const maxBtn = document.getElementById('specSheetMaximizeBtn');
    const minBar = document.getElementById('specSheetMinimizedBar');
    if (!modal || !dialog) return;

    modal.classList.remove('is-maximized', 'is-minimized');
    dialog.style.width = '';
    dialog.style.height = '';
    if (minBar) minBar.hidden = true;
    if (maxBtn) {
        maxBtn.textContent = '▢';
        maxBtn.title = 'Maximize';
        maxBtn.setAttribute('aria-label', 'Maximize');
    }
}

function setSpecSheetPreviewZoom(nextZoom) {
    specSheetPreviewZoom = Math.min(2, Math.max(0.6, Number(nextZoom) || 1));
    const stage = document.getElementById('specSheetPreviewStage');
    const label = document.getElementById('specSheetZoomLabel');
    if (stage) stage.style.setProperty('--spec-preview-zoom', String(specSheetPreviewZoom));
    if (label) label.textContent = `${Math.round(specSheetPreviewZoom * 100)}%`;
}

function openSpecSheetPreview() {
    const modal = document.getElementById('specSheetPreviewModal');
    const stage = document.getElementById('specSheetPreviewStage');
    if (!modal || !stage) {
        printSpecEvaluationDatasheet();
        return;
    }

    resetSpecSheetPreviewWindowState();
    setSpecSheetPreviewZoom(1);
    stage.innerHTML = buildSpecEvalDatasheetHtml();
    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
}

function closeSpecSheetPreview() {
    const modal = document.getElementById('specSheetPreviewModal');
    const stage = document.getElementById('specSheetPreviewStage');
    if (!modal) return;
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
    modal.classList.remove('is-maximized', 'is-minimized');
    if (stage) stage.innerHTML = '';
}

function minimizeSpecSheetPreview() {
    const modal = document.getElementById('specSheetPreviewModal');
    const label = document.getElementById('specSheetMinimizedLabel');
    const minBar = document.getElementById('specSheetMinimizedBar');
    const itemName = document.getElementById('specEvalItemName')?.value?.trim() || 'Specification datasheet';
    if (!modal) return;
    modal.classList.remove('is-maximized');
    modal.classList.add('is-minimized');
    if (label) label.textContent = itemName;
    if (minBar) minBar.hidden = false;
}

function restoreSpecSheetPreview() {
    const modal = document.getElementById('specSheetPreviewModal');
    const minBar = document.getElementById('specSheetMinimizedBar');
    if (!modal) return;
    modal.classList.remove('is-minimized');
    if (minBar) minBar.hidden = true;
}

function toggleMaximizeSpecSheetPreview() {
    const modal = document.getElementById('specSheetPreviewModal');
    const dialog = document.getElementById('specSheetPreviewDialog');
    const maxBtn = document.getElementById('specSheetMaximizeBtn');
    if (!modal || !dialog) return;

    const willMaximize = !modal.classList.contains('is-maximized');
    modal.classList.remove('is-minimized');
    const minBar = document.getElementById('specSheetMinimizedBar');
    if (minBar) minBar.hidden = true;

    if (willMaximize) {
        dialog.style.width = '';
        dialog.style.height = '';
        modal.classList.add('is-maximized');
        if (maxBtn) {
            maxBtn.textContent = '❐';
            maxBtn.title = 'Restore size';
            maxBtn.setAttribute('aria-label', 'Restore size');
        }
    } else {
        modal.classList.remove('is-maximized');
        if (maxBtn) {
            maxBtn.textContent = '▢';
            maxBtn.title = 'Maximize';
            maxBtn.setAttribute('aria-label', 'Maximize');
        }
    }
}

function printSpecEvaluationDatasheet() {
    if (typeof runOfficialPrint === 'function') {
        runOfficialPrint(() => {
            const host = ensureSpecEvalPrintHost();
            host.innerHTML = buildSpecEvalDatasheetHtml();
            host.classList.add('print-target');
            document.body.classList.add('is-printing', 'printing-spec-sheet');
        });
        return;
    }
    const host = ensureSpecEvalPrintHost();
    host.innerHTML = buildSpecEvalDatasheetHtml();
    host.classList.add('print-target');
    document.body.classList.add('is-printing', 'printing-spec-sheet');
    window.print();
}

function readSpecSearchCriteria() {
    return {
        productType: document.getElementById('specSearchProductType')?.value || '',
        dutyProfile: document.getElementById('specSearchDutyProfile')?.value || 'any',
        brand: document.getElementById('specSearchBrand')?.value || 'Any',
        processorType: document.getElementById('specSearchProcessorType')?.value || 'any',
        minProcessorGhz: document.getElementById('specSearchProcessorSpeed')?.value || 'any',
        minRamGb: document.getElementById('specSearchRam')?.value || 'any',
        minStorageGb: document.getElementById('specSearchStorage')?.value || 'any',
        storageType: document.getElementById('specSearchStorageType')?.value || 'any',
        freeText: document.getElementById('specSearchFreeText')?.value || ''
    };
}

function updateSpecSearchDutyHint() {
    const hint = document.getElementById('specSearchDutyHint');
    if (!hint) return;
    const profile = typeof getLaptopDutyProfile === 'function'
        ? getLaptopDutyProfile(document.getElementById('specSearchDutyProfile')?.value)
        : null;
    if (!profile) {
        hint.hidden = true;
        hint.textContent = '';
        return;
    }
    hint.hidden = false;
    hint.textContent = `${profile.groupLabel}: ${profile.summary} ${profile.deviceHint || ''}`.trim();
}

function populateSpecSearchFacets() {
    const facets = typeof SPEC_SEARCH_FACETS !== 'undefined' ? SPEC_SEARCH_FACETS : null;
    if (!facets) {
        console.warn('SPEC_SEARCH_FACETS missing — processor/brand lists unavailable');
        return;
    }

    const esc = (value) => {
        if (typeof escapeAttr === 'function') return escapeAttr(value);
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    };

    const fillSelect = (id, options, valueKey = 'value', labelKey = 'label') => {
        const el = document.getElementById(id);
        if (!el || !options || !options.length) return;
        if (typeof options[0] === 'string') {
            el.innerHTML = options.map((b) => (
                `<option value="${esc(b)}">${esc(b)}</option>`
            )).join('');
            return;
        }
        el.innerHTML = options.map((o) => (
            `<option value="${esc(o[valueKey])}">${esc(o[labelKey])}</option>`
        )).join('');
    };

    const fillGroupedSelect = (id, options, groupKey = 'group') => {
        const el = document.getElementById(id);
        if (!el || !options?.length) return;
        try {
            const any = options.filter((o) => o.value === 'any');
            const rest = options.filter((o) => o.value !== 'any');
            const groups = {};
            const order = [];
            rest.forEach((o) => {
                const g = o[groupKey] || o.manufacturer || o.group || 'Other';
                if (!groups[g]) {
                    groups[g] = [];
                    order.push(g);
                }
                groups[g].push(o);
            });
            const parts = any.map((o) =>
                `<option value="${esc(o.value)}">${esc(o.label)}</option>`
            );
            order.forEach((g) => {
                parts.push(`<optgroup label="${esc(g)}">`);
                groups[g].forEach((o) => {
                    parts.push(`<option value="${esc(o.value)}">${esc(o.label)}</option>`);
                });
                parts.push('</optgroup>');
            });
            el.innerHTML = parts.join('');
        } catch (err) {
            console.error('fillGroupedSelect failed, using flat list', err);
            fillSelect(id, options);
        }
    };

    const fillProcessorSelect = (id, options) => fillGroupedSelect(id, options, 'manufacturer');

    // Fill dropdowns first so a catalog enrich error cannot leave them blank
    fillSelect('specSearchProductType', [{ value: '', label: 'Any product type' }, ...(facets.productTypes || [])]);
    const dutyOpts = typeof laptopDutyProfileOptions === 'function'
        ? laptopDutyProfileOptions()
        : [{ value: 'any', label: 'Any duty profile' }];
    fillGroupedSelect('specSearchDutyProfile', dutyOpts, 'group');
    fillSelect('specSearchBrand', facets.brands || ['Any']);
    fillProcessorSelect('specSearchProcessorType', facets.processorTypes || [{ value: 'any', label: 'Any processor type' }]);
    fillSelect('specSearchProcessorSpeed', facets.processorSpeeds || [{ value: 'any', label: 'Any processor speed' }]);
    fillSelect('specSearchStorage', facets.storageOptions || [{ value: 'any', label: 'Any storage size' }]);
    fillGroupedSelect('specSearchStorageType', facets.storageTypes || [{ value: 'any', label: 'Any storage type' }], 'group');

    let ramOptions = facets.ramOptions || [{ value: 'any', label: 'Any RAM' }];
    try {
        if (typeof getEnrichedProductCatalog === 'function') {
            const sizes = new Set();
            getEnrichedProductCatalog().forEach((e) => {
                const gb = e._attrs?.ramGb;
                if (gb > 0) sizes.add(gb);
            });
            (facets.ramOptions || []).forEach((o) => {
                const n = parseInt(o.value, 10);
                if (n > 0) sizes.add(n);
            });
            ramOptions = [
                { value: 'any', label: 'Any RAM' },
                ...[...sizes].sort((a, b) => a - b).map((gb) => ({ value: String(gb), label: `${gb} GB` }))
            ];
        }
    } catch (err) {
        console.error('RAM facet enrich failed', err);
    }
    fillSelect('specSearchRam', ramOptions);
}

function setSpecSearchStatus(message, type = 'info') {
    const el = document.getElementById('specSearchStatus');
    if (!el) return;
    el.textContent = message || '';
    el.className = `spec-search-status${type ? ` is-${type}` : ''}`;
}

function clearSpecSearchCriteria() {
    const set = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.value = value;
    };
    set('specSearchProductType', '');
    set('specSearchDutyProfile', 'any');
    set('specSearchBrand', 'Any');
    set('specSearchProcessorType', 'any');
    set('specSearchProcessorSpeed', 'any');
    set('specSearchRam', 'any');
    set('specSearchStorage', 'any');
    set('specSearchStorageType', 'any');
    set('specSearchFreeText', '');
    const body = document.getElementById('specSearchResultsBody');
    if (body) {
        body.innerHTML = '<tr><td colspan="9" class="req-empty-row">Set minimum specs above, then Search Matching Products.</td></tr>';
    }
    setSpecSearchStatus('');
    updateSpecSearchDutyHint();
}

function renderSpecSearchResults(results) {
    const body = document.getElementById('specSearchResultsBody');
    if (!body) return;
    window.__specSearchResults = results || [];

    if (!results.length) {
        body.innerHTML = '<tr><td colspan="9" class="req-empty-row">No products matched these minimum specs. Widen criteria or try Online Enrich.</td></tr>';
        return;
    }

    const sourceLabel = (src) => {
        if (src === 'online') return 'Online';
        if (src === 'catalog-near') return 'Near match';
        if (src === 'catalog-suggest') return 'Suggested';
        return 'Local catalog';
    };

    body.innerHTML = results.map((row, idx) => {
        const p = row.product || {};
        const attrs = row.attrs || p._attrs || {};
        const name = [p.brand, p.model].filter(Boolean).join(' ') || p.id || 'Product';
        const type = p.category || '—';
        return `
            <tr data-spec-result-idx="${idx}">
                <td>${idx + 1}</td>
                <td><strong>${escapeAttr(name)}</strong></td>
                <td>${escapeAttr(type)}</td>
                <td>${escapeAttr(attrs.processorLabel || '—')}</td>
                <td>${escapeAttr(attrs.ramLabel || (attrs.ramGb ? `${attrs.ramGb} GB` : '—'))}</td>
                <td>${escapeAttr(attrs.storageLabel || (attrs.storageGb ? `${attrs.storageGb} GB` : '—'))}</td>
                <td><span class="spec-match-pill">${escapeAttr(String(row.matchPercent || row.score || 0))}%</span></td>
                <td>${escapeAttr(sourceLabel(row.source))}</td>
                <td><button type="button" class="btn btn-primary btn-sm" data-spec-pick="${idx}">Select</button></td>
            </tr>
        `;
    }).join('');
}

function selectSpecSearchResult(index) {
    const results = window.__specSearchResults || [];
    const row = results[index];
    if (!row) {
        showToast('Result not found.', 'error');
        return;
    }

    if (row.source === 'online' && row.onlinePayload) {
        applyWebLookupToForm(row.onlinePayload, row.query || '');
        showToast(`Loaded online candidate: ${row.onlinePayload.brand || ''} ${row.onlinePayload.model || ''}`.trim());
        return;
    }

    const product = row.product;
    if (!product) {
        showToast('No product data on that result.', 'error');
        return;
    }

    // Map tablet category onto form (template tablet exists)
    const formProduct = {
        ...product,
        category: product.category === 'tablet' ? 'tablet' : (product.category === 'other' && /tablet|ipad/i.test(product.model || '') ? 'tablet' : product.category)
    };
    applyCatalogProductToForm(formProduct, [product.brand, product.model].filter(Boolean).join(' '));

    const duty = typeof getLaptopDutyProfile === 'function'
        ? getLaptopDutyProfile(document.getElementById('specSearchDutyProfile')?.value)
        : null;
    if (duty) {
        const nameEls = document.querySelectorAll('#spec-eval-table-body .spec-field-name');
        let dutyRow = Array.from(nameEls).find((el) => /duty\s*profile/i.test(el.value || ''));
        if (!dutyRow) {
            addSpecEvalRow('Duty Profile', duty.label, duty.summary);
            const names = document.querySelectorAll('#spec-eval-table-body .spec-field-name');
            dutyRow = Array.from(names).find((el) => /duty\s*profile/i.test(el.value || ''));
        }
        if (dutyRow) {
            dutyRow.value = 'Duty Profile';
            const tr = dutyRow.closest('tr');
            const val = tr?.querySelector('.spec-field-value');
            const note = tr?.querySelector('.spec-field-note');
            if (val) val.value = duty.label;
            if (note) note.value = duty.summary;
        }
        const purposeEl = document.getElementById('specEvalPurpose');
        if (purposeEl) {
            const existing = purposeEl.value.trim();
            const line = `Duty profile: ${duty.label} — ${duty.summary}`;
            if (!existing) purposeEl.value = line;
            else if (!/duty profile/i.test(existing)) purposeEl.value = `${line} ${existing}`;
        }
    }

    const itemEl = document.getElementById('specEvalItemName');
    if (itemEl) itemEl.value = [product.brand, product.model].filter(Boolean).join(' ');

    showToast(`Selected ${product.brand || ''} ${product.model || ''} for Spec Evaluation.`.replace(/\s+/g, ' ').trim());
    document.getElementById('spec-eval-table-body')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function runSpecIntelligentSearch({ online = false } = {}) {
    const criteria = readSpecSearchCriteria();
    const keywords = (criteria.freeText || '').trim();

    const hasHard =
        criteria.productType ||
        (criteria.brand && criteria.brand !== 'Any') ||
        (criteria.processorType && criteria.processorType !== 'any') ||
        (criteria.minProcessorGhz && criteria.minProcessorGhz !== 'any') ||
        (criteria.minRamGb && criteria.minRamGb !== 'any') ||
        (criteria.minStorageGb && criteria.minStorageGb !== 'any') ||
        (criteria.storageType && criteria.storageType !== 'any') ||
        (criteria.dutyProfile && criteria.dutyProfile !== 'any') ||
        keywords;

    if (!hasHard) {
        showToast('Set at least one criterion (duty profile, product type, brand, processor, RAM, storage, or keywords).', 'error');
        return;
    }

    if (typeof searchCatalogByMinspec !== 'function') {
        showToast('Catalog search is not available.', 'error');
        return;
    }

    const catalogHits = searchCatalogByMinspec(
        {
            ...criteria,
            minProcessorGhz: criteria.minProcessorGhz === 'any' ? 0 : criteria.minProcessorGhz,
            minRamGb: criteria.minRamGb === 'any' ? 0 : criteria.minRamGb,
            minStorageGb: criteria.minStorageGb === 'any' ? 0 : criteria.minStorageGb
        },
        { minResults: 5, maxResults: 12 }
    );

    renderSpecSearchResults(catalogHits);
    const nearCount = catalogHits.filter((r) => r.source === 'catalog-near' || r.source === 'catalog-suggest').length;
    const dutyLabel = (criteria.dutyProfile && criteria.dutyProfile !== 'any' && typeof getLaptopDutyProfile === 'function')
        ? (getLaptopDutyProfile(criteria.dutyProfile)?.label || '')
        : '';
    const statusLabel = keywords || [
        dutyLabel,
        criteria.productType,
        criteria.brand !== 'Any' ? criteria.brand : '',
        (criteria.processorType && criteria.processorType !== 'any') ? criteria.processorType : ''
    ].filter(Boolean).join(' / ') || 'selected filters';
    const statusMsg =
        catalogHits.length >= 5
            ? `Showing ${catalogHits.length} best matches for “${statusLabel}” (minimum 5).${nearCount ? ` ${nearCount} near-match(es) included.` : ''}`
            : catalogHits.length
              ? `Showing ${catalogHits.length} match(es) for “${statusLabel}” — catalog has fewer than 5 options for this filter.`
              : `No products matched “${statusLabel}”. Widen criteria or try Online Enrich.`;
    setSpecSearchStatus(statusMsg, catalogHits.length ? 'ok' : 'warn');

    if (!online) return;

    enrichSpecSearchOnline(criteria, catalogHits);
}

async function enrichSpecSearchOnline(criteria, catalogHits) {
    if (typeof fetchOnlineProductSpecs !== 'function') {
        showToast('Online lookup is not available.', 'error');
        return;
    }

    const query = typeof buildMinspecSearchQuery === 'function'
        ? buildMinspecSearchQuery(criteria)
        : [criteria.productType, criteria.brand, criteria.freeText].filter(Boolean).join(' ');

    setSpecSearchStatus(`Searching catalog + online for: ${query}…`, 'info');
    const searchBtn = document.getElementById('specSearchOnlineBtn');
    if (searchBtn) {
        searchBtn.disabled = true;
        searchBtn.textContent = 'Searching online…';
    }

    try {
        const payload = await fetchOnlineProductSpecs(query);
        const brand = payload.brand || '';
        const model = payload.model || payload.query || query;
        const specs = payload.specs || [];
        const blob = specs.map((r) => `${r[0]} ${r[1]}`).join(' ');
        const onlineRow = {
            source: 'online',
            score: 70,
            matchPercent: 70,
            reasons: ['Online enrichment'],
            query,
            onlinePayload: payload,
            product: {
                id: `online-${Date.now()}`,
                brand,
                model,
                category: payload.category || criteria.productType || 'other',
                specs,
                names: [`${brand} ${model}`.trim()]
            },
            attrs: {
                processorLabel: specs.find((r) => /processor|cpu/i.test(r[0] || ''))?.[1] || '—',
                ramLabel: specs.find((r) => /ram|memory/i.test(r[0] || ''))?.[1] || '—',
                storageLabel: specs.find((r) => /storage|ssd|hdd/i.test(r[0] || ''))?.[1] || '—',
                ramGb: typeof parseMaxRamGb === 'function' ? parseMaxRamGb(blob) : 0,
                storageGb: typeof parseMaxStorageGb === 'function' ? parseMaxStorageGb(blob) : 0
            }
        };

        const merged = [...catalogHits];
        const dup = merged.some((r) => {
            const n = `${r.product?.brand || ''} ${r.product?.model || ''}`.toLowerCase();
            return n && n === `${brand} ${model}`.toLowerCase().trim();
        });
        if (!dup) merged.unshift(onlineRow);
        renderSpecSearchResults(merged);
        setSpecSearchStatus(
            `Catalog: ${catalogHits.length} · Online candidate added (${payload.ai ? 'AI-assisted' : 'web extract'}). Review before selecting.`,
            'ok'
        );
    } catch (err) {
        setSpecSearchStatus(
            `Catalog: ${catalogHits.length} match(es). Online enrich unavailable: ${err.message || 'server offline'}.`,
            'warn'
        );
        showToast(err.message || 'Online enrich failed — catalog results still shown.', 'info');
    } finally {
        if (searchBtn) {
            searchBtn.disabled = false;
            searchBtn.textContent = 'Search + Online Enrich';
        }
    }
}

function initSpecIntelligentSearch() {
    populateSpecSearchFacets();
    updateSpecSearchDutyHint();

    document.getElementById('specSearchBtn')?.addEventListener('click', () => runSpecIntelligentSearch({ online: false }));
    document.getElementById('specSearchOnlineBtn')?.addEventListener('click', () => runSpecIntelligentSearch({ online: true }));
    document.getElementById('specSearchClearBtn')?.addEventListener('click', clearSpecSearchCriteria);
    document.getElementById('specSearchDutyProfile')?.addEventListener('change', updateSpecSearchDutyHint);

    document.getElementById('specSearchResultsBody')?.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-spec-pick]');
        if (!btn) return;
        const idx = parseInt(btn.getAttribute('data-spec-pick'), 10);
        if (Number.isNaN(idx)) return;
        selectSpecSearchResult(idx);
    });

    document.getElementById('specSearchFreeText')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            runSpecIntelligentSearch({ online: false });
        }
    });
}

function initSpecSheetPreviewControls() {
    document.getElementById('specEvalPreviewBtn')?.addEventListener('click', openSpecSheetPreview);
    document.getElementById('specSheetCloseBtn')?.addEventListener('click', closeSpecSheetPreview);
    document.getElementById('specSheetCancelBtn')?.addEventListener('click', closeSpecSheetPreview);
    document.getElementById('specSheetMinimizeBtn')?.addEventListener('click', minimizeSpecSheetPreview);
    document.getElementById('specSheetMaximizeBtn')?.addEventListener('click', toggleMaximizeSpecSheetPreview);
    document.getElementById('specSheetRestoreBtn')?.addEventListener('click', restoreSpecSheetPreview);
    document.getElementById('specSheetZoomInBtn')?.addEventListener('click', () => {
        setSpecSheetPreviewZoom(specSheetPreviewZoom + 0.1);
    });
    document.getElementById('specSheetZoomOutBtn')?.addEventListener('click', () => {
        setSpecSheetPreviewZoom(specSheetPreviewZoom - 0.1);
    });
    document.getElementById('specSheetZoomResetBtn')?.addEventListener('click', () => {
        setSpecSheetPreviewZoom(1);
    });
    document.getElementById('specSheetPrintBtn')?.addEventListener('click', () => {
        printSpecEvaluationDatasheet();
    });
    document.getElementById('specSheetPreviewModal')?.addEventListener('click', (e) => {
        if (e.target?.id === 'specSheetPreviewModal' && !e.target.classList.contains('is-minimized')) {
            closeSpecSheetPreview();
        }
    });
    document.getElementById('specSheetPreviewBody')?.addEventListener('wheel', (e) => {
        if (!e.ctrlKey && !e.metaKey) return;
        e.preventDefault();
        setSpecSheetPreviewZoom(specSheetPreviewZoom + (e.deltaY < 0 ? 0.1 : -0.1));
    }, { passive: false });
}

function initSpecEvaluationModule() {
    const moduleEl = document.getElementById('spec-evaluation');
    if (!moduleEl) return;

    // Always refresh facet dropdowns (processor list, RAM, etc.)
    if (typeof populateSpecSearchFacets === 'function') populateSpecSearchFacets();
    if (typeof populateSpecProductCatalogHints === 'function') populateSpecProductCatalogHints();

    if (moduleEl.dataset.specEvalInited === '1') {
        updateSpecEvalTotal();
        return;
    }
    moduleEl.dataset.specEvalInited = '1';

    document.getElementById('specEvalQty')?.addEventListener('input', updateSpecEvalTotal);
    document.getElementById('specEvalUnitPrice')?.addEventListener('input', updateSpecEvalTotal);

    document.getElementById('specEvalCategory')?.addEventListener('change', function() {
        if (!this.value) return;
        if (SPEC_EVAL_TEMPLATES[this.value]) {
            loadSpecEvalTemplate(this.value);
        }
    });

    document.getElementById('loadLaptopSpecsBtn')?.addEventListener('click', () => loadSpecEvalTemplate('laptop'));
    document.getElementById('loadDesktopSpecsBtn')?.addEventListener('click', () => loadSpecEvalTemplate('desktop'));
    document.getElementById('loadTabletSpecsBtn')?.addEventListener('click', () => loadSpecEvalTemplate('tablet'));
    document.getElementById('loadPrinterSpecsBtn')?.addEventListener('click', () => loadSpecEvalTemplate('printer'));
    document.getElementById('loadServerSpecsBtn')?.addEventListener('click', () => loadSpecEvalTemplate('server'));
    document.getElementById('clearSpecsBtn')?.addEventListener('click', clearSpecEvalRows);
    document.getElementById('addNamedSpecFieldBtn')?.addEventListener('click', addNamedSpecField);
    document.getElementById('autofillFromItemBtn')?.addEventListener('click', () => {
        autofillSpecEvaluationFromItemName();
    });

    document.getElementById('newSpecFieldName')?.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            addNamedSpecField();
        }
    });

    const itemNameEl = document.getElementById('specEvalItemName');
    itemNameEl?.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            autofillSpecEvaluationFromItemName();
        }
    });

    populateSpecProductCatalogHints();
    initSpecIntelligentSearch();
    initSpecSheetPreviewControls();
    if (typeof initMarketCatalogPanel === 'function') initMarketCatalogPanel();
    if (typeof initSpecEvalMatrixUI === 'function') initSpecEvalMatrixUI();

    if (!document.getElementById('specEvalDate')?.value) {
        const dateEl = document.getElementById('specEvalDate');
        if (dateEl) dateEl.value = new Date().toISOString().slice(0, 10);
    }

    updateSpecEvalTotal();
}

window.applySpecDocumentToForm = applySpecDocumentToForm;
window.initSpecEvaluationModule = initSpecEvaluationModule;
