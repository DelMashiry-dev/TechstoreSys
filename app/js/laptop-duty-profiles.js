/* laptop-duty-profiles.js — canonical laptop issue / spec-search duty profiles
 *
 * Field/tactical uses summarised from military laptop roles in defence
 * (command, UAV/robot control, secure comms, logistics/diagnostics).
 * Technical uses are IT-DIR post workloads: software engineering, programming,
 * machine learning, architecture, graphic designing, database design, server room.
 * Admin/office uses: pay run, secretariat, typing pool.
 */

const LAPTOP_DUTY_PROFILES = [
    {
        key: 'command-control',
        group: 'field',
        groupLabel: 'Field / tactical',
        label: 'Battlefield Command and Control',
        summary: 'Real-time tracking, mission planning, and analysis of reconnaissance data or GPS coordinates.',
        uses: ['Unit tracking and COP / maps', 'Mission planning briefs', 'Reconnaissance and GPS analysis'],
        deviceHint: 'Prefer rugged, sunlight-readable laptops (MIL-STD-810, optional WWAN).'
    },
    {
        key: 'drone-robot',
        group: 'field',
        groupLabel: 'Field / tactical',
        label: 'Drone and Robot Control',
        summary: 'Operate UAVs and land-based defence robots; process high-definition video feeds in the field.',
        uses: ['UAV / UGV control stations', 'HD video and sensor feeds', 'Remote platform command'],
        deviceHint: 'Prefer fully rugged or semi-rugged machines with strong CPU, RAM, and outdoor displays.'
    },
    {
        key: 'secure-comms',
        group: 'field',
        groupLabel: 'Field / tactical',
        label: 'Secure Communications',
        summary: 'Share sensitive data over satellite and tactical networks with hardware encryption and biometric access.',
        uses: ['Encrypted messaging and file share', 'SATCOM / tactical radio endpoints', 'TPM, smart card, biometrics'],
        deviceHint: 'Enterprise security (TPM 2.0, Windows 11 Pro, optional smart card) on rugged or business-class laptops.'
    },
    {
        key: 'logistics-diagnostics',
        group: 'field',
        groupLabel: 'Field / tactical',
        label: 'Logistics and Field Diagnostics',
        summary: 'Supply-chain management, maintenance tracking, and equipment repair support directly in the field.',
        uses: ['Stores / supply tracking', 'Technical manuals and diagnostics', 'Predictive / condition-based maintenance'],
        deviceHint: 'Rugged or business laptops with full-day battery; tablets acceptable for forms and manuals.'
    },
    {
        key: 'software-engineering',
        group: 'technical',
        groupLabel: 'Technical / IT-DIR',
        label: 'Software Engineering',
        summary: 'Application, web and systems development — IDEs, compilers, containers, and local project stores.',
        uses: ['Full-stack / systems development', 'Local builds and repositories', 'Multi-tool desktop'],
        deviceHint: '16 GB+ RAM, fast NVMe, Windows 11 Pro; AI PCs or 32 GB for heavier stacks.'
    },
    {
        key: 'programming',
        group: 'technical',
        groupLabel: 'Technical / IT-DIR',
        label: 'Programming',
        summary: 'Day-to-day coding, scripting, database work, and unit IT development tasks.',
        uses: ['IDE and terminal work', 'Scripting and databases', 'Standard development duties'],
        deviceHint: 'Business-class laptop, 16 GB RAM, 512 GB SSD minimum.'
    },
    {
        key: 'machine-learning',
        group: 'technical',
        groupLabel: 'Technical / IT-DIR',
        label: 'Machine Learning',
        summary: 'On-device AI, model inference, data analysis, and NPU/GPU-assisted workloads.',
        uses: ['NPU / AI PC inference', 'Data analysis and notebooks', 'GPU-assisted training (light/medium)'],
        deviceHint: 'Core Ultra / NPU TOPS, 32 GB RAM preferred, discrete GPU where quoted.'
    },
    {
        key: 'architecture',
        group: 'technical',
        groupLabel: 'Technical / IT-DIR',
        label: 'Architecture',
        summary: 'Systems architecture, CAD/technical drawing, and geospatial / design review.',
        uses: ['CAD / technical drawing', 'Systems and solution architecture', 'GIS and design review'],
        deviceHint: 'Higher RAM, strong display; discrete GPU or workstation-class SKU when CAD-heavy.'
    },
    {
        key: 'graphic-design',
        group: 'technical',
        groupLabel: 'Technical / IT-DIR',
        label: 'Graphic Designing',
        summary: 'Visual production — illustration, layout, photo/video, and high-colour displays.',
        uses: ['Illustration and layout', 'Photo / video editing', 'Briefing graphics'],
        deviceHint: 'High-quality display (2K/OLED), 16–32 GB RAM, 2-in-1 or creative AI PC preferred.'
    },
    {
        key: 'database-design',
        group: 'technical',
        groupLabel: 'Technical / IT-DIR',
        label: 'Database Design',
        summary: 'Schema design, DBA tools, modelling, and local/remote database work.',
        uses: ['ERD / schema design', 'SQL client and DBA tools', 'Backup, restore, and query tuning'],
        deviceHint: '16 GB+ RAM, fast NVMe, Windows 11 Pro; 32 GB for large local databases.'
    },
    {
        key: 'server-room',
        group: 'technical',
        groupLabel: 'Technical / IT-DIR',
        label: 'Server Room',
        summary: 'Rack work, console/KVM access, monitoring, and on-site server administration.',
        uses: ['Console / KVM and crash-cart use', 'Monitoring and firmware tools', 'Cable, rack, and asset notes'],
        deviceHint: 'Business-class laptop with Ethernet (or USB-C dock), TPM, Windows 11 Pro; compact 14\" preferred.'
    },
    {
        key: 'pay-run',
        group: 'admin',
        groupLabel: 'Admin / office',
        label: 'Pay Run',
        summary: 'Payroll processing, pay sheets, and sensitive finance/HR runs that need a reliable locked-down PC.',
        uses: ['Payroll / HRMIS data entry', 'Pay sheet review and print', 'Controlled access to pay data'],
        deviceHint: 'Enterprise laptop (TPM, Windows 11 Pro), 16 GB RAM, reliable keyboard; not a shared public machine.'
    },
    {
        key: 'secretariat',
        group: 'admin',
        groupLabel: 'Admin / office',
        label: 'Secretariat',
        summary: 'Registry, minutes, correspondence, and office administration for HQ and departmental secretariats.',
        uses: ['Correspondence and minute sheets', 'Diary, filing, and DF support', 'Office productivity suite'],
        deviceHint: 'Standard business laptop, 8–16 GB RAM, FHD display, full keyboard and docking.'
    },
    {
        key: 'typing-pool',
        group: 'admin',
        groupLabel: 'Admin / office',
        label: 'Typing Pool',
        summary: 'High-volume typing, transcription, and document production.',
        uses: ['Word processing at volume', 'Transcription and circulars', 'Shared pool workstations'],
        deviceHint: 'Comfortable keyboard, 15.6\" screen acceptable, 8–16 GB RAM; mid-range ProBook/Vostro/IdeaPad class.'
    }
];

function getLaptopDutyProfile(key) {
    const k = String(key || '').trim();
    if (!k || k === 'any') return null;
    return LAPTOP_DUTY_PROFILES.find((p) => p.key === k) || null;
}

function laptopDutyProfileOptions() {
    return [
        { value: 'any', label: 'Any duty profile' },
        ...LAPTOP_DUTY_PROFILES.map((p) => ({
            value: p.key,
            label: p.label,
            group: p.groupLabel
        }))
    ];
}

function laptopDutySpecBlob(entry) {
    if (typeof getCatalogSpecBlob === 'function') return getCatalogSpecBlob(entry);
    return (entry?.specs || []).map((row) => (Array.isArray(row) ? row.join(' ') : String(row || ''))).join(' ');
}

function inferLaptopDutyKeys(entry) {
    if (Array.isArray(entry?.dutyProfiles) && entry.dutyProfiles.length) {
        return entry.dutyProfiles.filter(Boolean);
    }
    const blob = `${entry?.brand || ''} ${entry?.model || ''} ${laptopDutySpecBlob(entry)}`.toLowerCase();
    const keys = new Set();
    const rugged = /\btoughbook\b|\bmil-std\b|\brugged\b|\bip5[0-9]\b|\bip6[0-6]\b/.test(blob);
    const ai = /\bnpu\b|ai pc|core ultra|\btops\b/.test(blob);
    const creative = /32 gb|discrete|nvidia|2-in-1|flip|oled|macbook|zbook|precision|workstation/.test(blob);
    const enterprise = /elitebook|latitude|thinkpad|expertbook|travelmate|fingerprint|smart card/.test(blob);

    if (rugged) {
        keys.add('command-control');
        keys.add('drone-robot');
        keys.add('secure-comms');
        keys.add('logistics-diagnostics');
    }
    if (ai || creative) {
        keys.add('machine-learning');
        keys.add('graphic-design');
        keys.add('architecture');
        keys.add('software-engineering');
        keys.add('database-design');
    }
    if (enterprise) {
        keys.add('software-engineering');
        keys.add('programming');
        keys.add('database-design');
        keys.add('server-room');
        keys.add('secure-comms');
        keys.add('pay-run');
        keys.add('secretariat');
    }
    if (!keys.size) {
        keys.add('programming');
        keys.add('typing-pool');
        keys.add('secretariat');
        keys.add('pay-run');
        keys.add('logistics-diagnostics');
    } else if (!rugged && !ai && !creative) {
        keys.add('typing-pool');
        keys.add('secretariat');
    }
    return [...keys];
}

function scoreDutyProfileAgainstProduct(entry, dutyKey, mode = 'strict') {
    const profile = getLaptopDutyProfile(dutyKey);
    if (!profile) return { delta: 0, reason: null, reject: false };

    const keys = inferLaptopDutyKeys(entry);
    if (keys.includes(profile.key)) {
        return { delta: 22, reason: profile.label, reject: false };
    }

    const blob = `${entry?.brand || ''} ${entry?.model || ''} ${laptopDutySpecBlob(entry)}`.toLowerCase();
    const rugged = /\btoughbook\b|\bmil-std\b|\brugged\b|\bip5[0-9]\b|\bip6[0-6]\b/.test(blob);

    if (profile.group === 'field') {
        if (rugged) return { delta: 14, reason: 'Rugged / field capable', reject: false };
        if (mode === 'strict') return { delta: 0, reason: null, reject: true };
        return { delta: -16, reason: 'Not a field/rugged match', reject: false };
    }

    if ((profile.group === 'technical' || profile.group === 'admin') && rugged) {
        return { delta: -6, reason: 'Field rugged (secondary for office/dev)', reject: false };
    }

    return { delta: -8, reason: 'Secondary duty fit', reject: false };
}

function dutyProfileAcceptsCatalogCategory(entry, dutyKey, productType) {
    const profile = getLaptopDutyProfile(dutyKey);
    if (!profile) return true;
    const cat = entry?.category;
    if (productType) return true;
    if (profile.group === 'field') {
        return cat === 'laptop' || cat === 'tablet';
    }
    return cat === 'laptop';
}
