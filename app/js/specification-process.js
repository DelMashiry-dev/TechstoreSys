/* specification-process.js — ZNA Spec → Supplier Quotation → Technical Specs (separate modules, shared data) */

const SPEC_PROC_VICTUS_EXAMPLE = {
    title: 'HP VICTUS 16 LAPTOP SPECIFICATIONS',
    category: 'laptop',
    purpose: 'Laptop for technical / programming duties',
    items: [
        { name: 'Model', value: 'HP VICTUS 16 CORE I7-14700HX' },
        { name: 'Processor', value: 'Intel Core i7-14700HX (up to 5.5 GHz with Intel Turbo Boost Technology), 20 Cores, 28 Threads' },
        { name: 'Graphics', value: 'NVIDIA GeForce RTX 4070 Laptop GPU (8 GB GDDR6 dedicated VRAM), Intel UHD Graphics' },
        { name: 'Operating System', value: 'Microsoft Windows 11 Pro' },
        { name: 'MS Office', value: 'MS Office 2024 with product license key' },
        { name: 'Display', value: '16.1 inch, QHD (2560 x 1440), 240 Hz, 3ms, IPS, micro-edge, anti-glare, Low Blue Light, 300 nits, 100% sRGB' },
        { name: 'Memory', value: '32 GB DDR5 RAM (2x16GB)' },
        { name: 'Storage', value: '1TB PCIe Gen4 NVMe M.2 SSD' },
        { name: 'Keyboard', value: 'Full-size, 1-zone RGB backlit keyboard with numeric keypad' },
        { name: 'Pointing Device', value: 'HP Imagepad with multi-touch gesture support' },
        { name: 'Webcam', value: 'HP True Vision 1080p FHD camera' },
        { name: 'Battery', value: '6-cell, 83Wh Lithium-ion (Li-Ion) Polymer Battery' },
        { name: 'Ports', value: '1 USB-C 5Gbps (PD, DP 1.4, Sleep and Charge), 1 USB-A Sleep and Charge, 2 USB-A, 1 RJ-45, 1 combo audio, 1 HDMI 2.1' },
        { name: 'Carrying case', value: '1x Laptop Bag' },
        { name: 'Warranty', value: '1-Year' }
    ],
    compiled: { idNo: '847318X', rank: 'CPL', name: 'Nyathi PB', appt: 'Tech', sig: '', date: '2026-08-27' },
    approved: { idNo: '789674Q', rank: 'Capt', name: 'L Kativu', appt: 'OC', sig: '', date: '2026-08-27' }
};

function specProcEsc(v) {
    return String(v ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function ensureZnaSpecifications() {
    if (!appState) return [];
    if (!Array.isArray(appState.znaSpecifications)) appState.znaSpecifications = [];
    return appState.znaSpecifications;
}

function ensureSupplierQuotations() {
    if (!appState) return [];
    if (!Array.isArray(appState.supplierQuotations)) appState.supplierQuotations = [];
    return appState.supplierQuotations;
}

function specProcItemTemplate(category) {
    if (typeof SPEC_EVAL_ITEM_LISTS !== 'undefined' && SPEC_EVAL_ITEM_LISTS[category]) {
        return SPEC_EVAL_ITEM_LISTS[category].map((name) => ({ name, value: '' }));
    }
    return [{ name: 'Product model', value: '' }, { name: 'Warranty', value: '' }];
}

/** Classify ITEM label → suggestion bucket for preloaded values. */
function specProcItemBucket(itemName) {
    const n = String(itemName || '').toLowerCase();
    if (!n) return 'general';
    if (/processor|cpu|chipset/.test(n)) return 'processor';
    if (/^memory$|ram|memory \(ram\)/.test(n)) return 'memory';
    if (/storage|ssd|hdd|boot storage|internal storage|drive/.test(n)) return 'storage';
    if (/operating system|^os\b|windows|macos/.test(n)) return 'os';
    if (/display|monitor|screen/.test(n)) return 'display';
    if (/graphics|gpu|video/.test(n)) return 'graphics';
    if (/battery/.test(n)) return 'battery';
    if (/keyboard/.test(n)) return 'keyboard';
    if (/webcam|web cam|camera/.test(n)) return 'webcam';
    if (/port|connectivity|network/.test(n)) return 'ports';
    if (/warranty/.test(n)) return 'warranty';
    if (/office|ms office|licence|license/.test(n)) return 'office';
    if (/product model|^model$|form factor|device type/.test(n)) return 'model';
    if (/carry|bag|case/.test(n)) return 'case';
    return 'general';
}

const SPEC_PROC_STATIC_SUGGESTIONS = {
    os: [
        'Microsoft Windows 11 Pro',
        'Microsoft Windows 11 Home',
        'Microsoft Windows 10 Pro',
        'Ubuntu LTS (latest)',
        'No OS (DOS)'
    ],
    warranty: ['1-Year', '1 Year onsite', '2-Year', '3-Year', '3 Year NBD'],
    office: [
        'MS Office 2024 with product license key',
        'Microsoft 365 Apps for enterprise',
        'MS Office LTSC 2021',
        'Not required'
    ],
    memory: [
        '8 GB DDR4 RAM',
        '16 GB DDR4 RAM',
        '16 GB DDR5 RAM',
        '32 GB DDR5 RAM (2x16GB)',
        '32 GB DDR5 RAM',
        '64 GB DDR5 RAM'
    ],
    storage: [
        '256 GB NVMe SSD',
        '512 GB NVMe SSD',
        '512 GB PCIe NVMe M.2 SSD',
        '1TB PCIe Gen4 NVMe M.2 SSD',
        '1 TB NVMe SSD',
        '2 TB NVMe SSD'
    ],
    battery: [
        '3-cell Li-Ion (45 Wh+)',
        '4-cell Li-Ion Polymer',
        '6-cell, 83Wh Lithium-ion Polymer Battery'
    ],
    keyboard: [
        'Full-size backlit keyboard',
        'Full-size, RGB backlit keyboard with numeric keypad',
        'Spill-resistant keyboard'
    ],
    webcam: [
        '720p HD camera',
        '1080p FHD camera',
        'HP True Vision 1080p FHD camera'
    ],
    case: ['1x Laptop Bag', 'Backpack included', 'Not required'],
    graphics: [
        'Integrated Intel UHD / Iris Xe Graphics',
        'Integrated AMD Radeon Graphics',
        'NVIDIA GeForce RTX 4050 Laptop GPU',
        'NVIDIA GeForce RTX 4060 Laptop GPU',
        'NVIDIA GeForce RTX 4070 Laptop GPU (8 GB GDDR6)'
    ],
    display: [
        '14 inch FHD (1920 x 1080) IPS anti-glare',
        '15.6 inch FHD (1920 x 1080) IPS',
        '16.1 inch QHD (2560 x 1440) IPS anti-glare'
    ],
    ports: [
        'USB-C, USB-A, HDMI, RJ-45, combo audio',
        '2x USB-A, 1x USB-C, HDMI, headphone jack',
        'Thunderbolt 4 / USB4, HDMI, SD card'
    ],
    model: [],
    processor: [],
    general: []
};

function specProcUniquePush(list, seen, value) {
    const v = String(value || '').trim();
    if (!v || v.length < 2) return;
    const key = v.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    list.push(v);
}

/** Preloaded values for an ITEM: facets + catalog + saved ZNA specs + static commons. */
function specProcSuggestValuesForItem(itemName) {
    const bucket = specProcItemBucket(itemName);
    const out = [];
    const seen = new Set();
    const itemKey = String(itemName || '').toLowerCase().trim();

    (SPEC_PROC_STATIC_SUGGESTIONS[bucket] || []).forEach((v) => specProcUniquePush(out, seen, v));

    if (bucket === 'processor' && typeof SPEC_SEARCH_FACETS !== 'undefined') {
        (SPEC_SEARCH_FACETS.processorTypes || []).forEach((o) => {
            if (o.value && o.value !== 'any') specProcUniquePush(out, seen, o.label || o.value);
        });
    }
    if (bucket === 'memory' && typeof SPEC_SEARCH_FACETS !== 'undefined') {
        (SPEC_SEARCH_FACETS.ramOptions || []).forEach((o) => {
            if (o.value && o.value !== 'any') specProcUniquePush(out, seen, o.label || `${o.value} GB`);
        });
    }
    if (bucket === 'storage' && typeof SPEC_SEARCH_FACETS !== 'undefined') {
        (SPEC_SEARCH_FACETS.storageOptions || []).forEach((o) => {
            if (o.value && o.value !== 'any') specProcUniquePush(out, seen, o.label || o.value);
        });
        (SPEC_SEARCH_FACETS.storageTypes || []).forEach((o) => {
            if (o.value && o.value !== 'any') specProcUniquePush(out, seen, o.label || o.value);
        });
    }
    if (bucket === 'model' && typeof SPEC_SEARCH_FACETS !== 'undefined') {
        (SPEC_SEARCH_FACETS.brands || []).forEach((b) => {
            if (b && b !== 'Any') specProcUniquePush(out, seen, b);
        });
    }

    const catalog = typeof getEnrichedProductCatalog === 'function'
        ? getEnrichedProductCatalog()
        : (typeof PRODUCT_SPECS_CATALOG !== 'undefined' ? PRODUCT_SPECS_CATALOG : []);
    (catalog || []).forEach((entry) => {
        if (bucket === 'model' && entry?.name) {
            specProcUniquePush(out, seen, entry.name);
            return;
        }
        const specs = entry?.specs || entry?.fields || [];
        (Array.isArray(specs) ? specs : []).forEach((pair) => {
            const field = String(Array.isArray(pair) ? pair[0] : (pair?.name || pair?.field || '')).toLowerCase();
            const val = String(Array.isArray(pair) ? pair[1] : (pair?.value || '')).trim();
            if (!val) return;
            if (itemKey && (field === itemKey || field.includes(itemKey) || itemKey.includes(field))) {
                specProcUniquePush(out, seen, val);
                return;
            }
            if (bucket === 'processor' && /processor|cpu/.test(field)) specProcUniquePush(out, seen, val);
            if (bucket === 'memory' && /ram|memory/.test(field)) specProcUniquePush(out, seen, val);
            if (bucket === 'storage' && /storage|ssd|hdd/.test(field)) specProcUniquePush(out, seen, val);
            if (bucket === 'display' && /display|screen|monitor/.test(field)) specProcUniquePush(out, seen, val);
            if (bucket === 'graphics' && /graphics|gpu/.test(field)) specProcUniquePush(out, seen, val);
            if (bucket === 'os' && /operating|os\b/.test(field)) specProcUniquePush(out, seen, val);
            if (bucket === 'battery' && /battery/.test(field)) specProcUniquePush(out, seen, val);
        });
    });

    ensureZnaSpecifications().forEach((rec) => {
        (rec.items || []).forEach((it) => {
            if (!it?.value) return;
            if (String(it.name || '').toLowerCase() === itemKey) {
                specProcUniquePush(out, seen, it.value);
            }
        });
    });

    (SPEC_PROC_VICTUS_EXAMPLE.items || []).forEach((it) => {
        if (!it?.value) return;
        if (String(it.name || '').toLowerCase() === itemKey || specProcItemBucket(it.name) === bucket) {
            specProcUniquePush(out, seen, it.value);
        }
    });

    return out.slice(0, 120);
}

function specProcReadFieldValue(el) {
    if (!el) return '';
    if (el.classList?.contains('typeable-select-native') && el._typeable) {
        if (typeof resolveTypeableSelectInput === 'function') resolveTypeableSelectInput(el);
        return String(el.value || el._typeable.input?.value || '').trim();
    }
    return String(el.value || '').trim();
}

function mountSpecProcValueSelect(selectEl, itemName, currentValue, extraSuggestions = []) {
    if (!selectEl || typeof mountTypeableSelect !== 'function') return;
    const seen = new Set();
    const suggestions = [];
    (extraSuggestions || []).forEach((v) => specProcUniquePush(suggestions, seen, v));
    specProcSuggestValuesForItem(itemName).forEach((v) => specProcUniquePush(suggestions, seen, v));
    const cur = String(currentValue || '').trim();
    selectEl.innerHTML = '<option value="">— Type or pick —</option>'
        + suggestions.map((v) => `<option value="${specProcEsc(v)}">${specProcEsc(v)}</option>`).join('');
    if (cur && ![...selectEl.options].some((o) => o.value === cur)) {
        const opt = document.createElement('option');
        opt.value = cur;
        opt.textContent = cur;
        selectEl.appendChild(opt);
    }
    selectEl.value = cur || '';

    if (selectEl.dataset.typeableMounted === '1') {
        if (typeof refreshTypeableSelect === 'function') refreshTypeableSelect(selectEl);
        if (selectEl._typeable?.input) selectEl._typeable.input.value = cur;
        return;
    }
    mountTypeableSelect(selectEl, {
        placeholder: 'Type or pick specification…',
        allowCustom: true,
        maxItems: 200
    });
    if (selectEl._typeable?.input && cur) selectEl._typeable.input.value = cur;
}

function wireSpecProcZnaValueSelects() {
    document.querySelectorAll('#specProcZnaBody tr').forEach((tr) => {
        const nameEl = tr.querySelector('[data-spec-proc-zna-name]');
        const valEl = tr.querySelector('[data-spec-proc-zna-value]');
        if (!valEl || valEl.tagName !== 'SELECT') return;
        const name = nameEl?.value || '';
        const current = valEl.getAttribute('data-current-value')
            || (valEl.dataset.typeableMounted === '1' ? specProcReadFieldValue(valEl) : '')
            || '';
        mountSpecProcValueSelect(valEl, name, current);
        valEl.removeAttribute('data-current-value');
        if (nameEl && nameEl.dataset.specProcNameWired !== '1') {
            nameEl.dataset.specProcNameWired = '1';
            const remount = () => {
                const kept = specProcReadFieldValue(valEl);
                mountSpecProcValueSelect(valEl, nameEl.value, kept);
            };
            nameEl.addEventListener('change', remount);
            nameEl.addEventListener('blur', remount);
        }
    });
}

function wireSpecProcSupValueSelects() {
    document.querySelectorAll('#specProcSupBody tr').forEach((tr) => {
        const name = tr.querySelector('[data-spec-proc-sup-name]')?.value || '';
        const valEl = tr.querySelector('[data-spec-proc-sup-offered]');
        if (!valEl || valEl.tagName !== 'SELECT') return;
        const znaHint = tr.querySelector('[data-spec-proc-sup-zna]')?.value || '';
        const current = valEl.getAttribute('data-current-value')
            || (valEl.dataset.typeableMounted === '1' ? specProcReadFieldValue(valEl) : '')
            || '';
        mountSpecProcValueSelect(valEl, name, current, znaHint ? [znaHint] : []);
        valEl.removeAttribute('data-current-value');
    });
}

function renderSpecProcZnaRows(items) {
    const body = document.getElementById('specProcZnaBody');
    if (!body) return;
    const rows = (items && items.length) ? items : [{ name: '', value: '' }];
    body.innerHTML = rows.map((row, idx) => `
        <tr>
            <td>${idx + 1}</td>
            <td><input type="text" class="form-control" data-spec-proc-zna-name value="${specProcEsc(row.name || '')}" placeholder="ITEM"></td>
            <td>
                <select class="form-control" data-spec-proc-zna-value data-current-value="${specProcEsc(row.value || '')}"></select>
            </td>
            <td><button type="button" class="btn btn-ghost btn-sm" data-spec-proc-zna-del title="Remove">×</button></td>
        </tr>
    `).join('');
    wireSpecProcZnaValueSelects();
}

function readSpecProcZnaItems() {
    return [...document.querySelectorAll('#specProcZnaBody tr')].map((tr) => ({
        name: tr.querySelector('[data-spec-proc-zna-name]')?.value?.trim() || '',
        value: specProcReadFieldValue(tr.querySelector('[data-spec-proc-zna-value]'))
    })).filter((r) => r.name || r.value);
}

function specProcSetStep(step) {
    const root = document.getElementById('specification-process');
    if (!root) return;
    root.querySelectorAll('[data-spec-proc-step]').forEach((btn) => {
        btn.classList.toggle('is-active', btn.getAttribute('data-spec-proc-step') === step);
    });
    root.querySelectorAll('[data-spec-proc-panel]').forEach((panel) => {
        panel.hidden = panel.getAttribute('data-spec-proc-panel') !== step;
    });
    if (step === 'supplier') refreshSpecProcReceivedQuotes();
    if (step === 'eval') refreshSpecProcEvalSummary();
    if (typeof mountRelatedProcessChain === 'function') {
        const current = step === 'supplier' ? 'supplier' : (step === 'eval' ? 'eval' : 'zna');
        mountRelatedProcessChain('specProcRelatedChain', 'ict-spec-dd', current);
    }
}

function refreshSpecProcReceivedQuotes() {
    const filter = document.getElementById('specProcReceivedZnaFilter');
    const body = document.getElementById('specProcReceivedQuotesBody');
    const znaList = ensureZnaSpecifications();
    if (filter) {
        const cur = filter.value;
        filter.innerHTML = '<option value="">— All ZNA specs —</option>'
            + znaList.map((r) => `<option value="${specProcEsc(r.id)}">${specProcEsc(r.specNo || r.id)} — ${specProcEsc(r.title || 'Spec')}</option>`).join('');
        if (cur && znaList.some((r) => r.id === cur)) filter.value = cur;
    }
    if (!body) return;
    const znaId = filter?.value || '';
    const quotes = ensureSupplierQuotations().filter((q) => !znaId || q.znaSpecId === znaId);
    if (!quotes.length) {
        body.innerHTML = '<tr><td colspan="6" class="req-empty-row">No supplier quotations yet — suppliers submit on the Supplier Window.</td></tr>';
        return;
    }
    body.innerHTML = quotes.map((q) => {
        const zna = znaList.find((z) => z.id === q.znaSpecId);
        return `<tr>
            <td>${specProcEsc(q.quoteNo || q.id)}</td>
            <td><strong>${specProcEsc(q.supplierName || '—')}</strong></td>
            <td>${specProcEsc(zna ? (zna.specNo || zna.title) : (q.znaSpecId || '—'))}</td>
            <td>${specProcEsc(q.model || '—')}</td>
            <td>${q.unitPrice ? `${specProcEsc(q.currency || '')} ${specProcEsc(q.unitPrice)}` : '—'}</td>
            <td>${specProcEsc(q.date || '—')}</td>
        </tr>`;
    }).join('');
}

function readSpecProcSignoff(prefix) {
    return {
        idNo: document.getElementById(`${prefix}Id`)?.value?.trim() || '',
        rank: document.getElementById(`${prefix}Rank`)?.value?.trim() || '',
        name: document.getElementById(`${prefix}Name`)?.value?.trim() || '',
        appt: document.getElementById(`${prefix}Appt`)?.value?.trim() || '',
        sig: document.getElementById(`${prefix}Sig`)?.value?.trim() || '',
        date: document.getElementById(`${prefix}Date`)?.value || ''
    };
}

function writeSpecProcSignoff(prefix, data = {}) {
    const set = (id, v) => {
        const el = document.getElementById(id);
        if (el) el.value = v || '';
    };
    set(`${prefix}Id`, data.idNo);
    set(`${prefix}Rank`, data.rank);
    set(`${prefix}Name`, data.name);
    set(`${prefix}Appt`, data.appt);
    set(`${prefix}Sig`, data.sig);
    set(`${prefix}Date`, data.date);
}

function clearSpecProcZnaForm() {
    document.getElementById('specProcZnaEditId').value = '';
    document.getElementById('specProcZnaNo').value = '';
    document.getElementById('specProcZnaDate').value = new Date().toISOString().slice(0, 10);
    document.getElementById('specProcZnaCategory').value = 'laptop';
    document.getElementById('specProcZnaTitle').value = '';
    document.getElementById('specProcZnaPurpose').value = '';
    document.getElementById('specProcZnaDpRef').value = '';
    writeSpecProcSignoff('specProcZnaCompiled', {});
    writeSpecProcSignoff('specProcZnaApproved', {});
    renderSpecProcZnaRows(specProcItemTemplate('laptop'));
    const sel = document.getElementById('specProcZnaSavedSelect');
    if (sel) sel.value = '';
}

function loadSpecProcZnaRecord(rec) {
    if (!rec) return;
    document.getElementById('specProcZnaEditId').value = rec.id || '';
    document.getElementById('specProcZnaNo').value = rec.specNo || '';
    document.getElementById('specProcZnaDate').value = rec.date || '';
    document.getElementById('specProcZnaCategory').value = rec.category || 'laptop';
    document.getElementById('specProcZnaTitle').value = rec.title || '';
    document.getElementById('specProcZnaPurpose').value = rec.purpose || '';
    document.getElementById('specProcZnaDpRef').value = rec.dpRef || '';
    writeSpecProcSignoff('specProcZnaCompiled', rec.compiled || {});
    writeSpecProcSignoff('specProcZnaApproved', rec.approved || {});
    renderSpecProcZnaRows(rec.items || []);
    const sel = document.getElementById('specProcZnaSavedSelect');
    if (sel) sel.value = rec.id || '';
}

function populateSpecProcZnaSelect() {
    const sel = document.getElementById('specProcZnaSavedSelect');
    if (!sel) return;
    const list = ensureZnaSpecifications();
    const cur = sel.value;
    sel.innerHTML = '<option value="">— New specification —</option>'
        + list.map((r) => `<option value="${specProcEsc(r.id)}">${specProcEsc(r.specNo || r.id)} — ${specProcEsc(r.title || 'ZNA Spec')}</option>`).join('');
    if (cur && list.some((r) => r.id === cur)) sel.value = cur;
    refreshSpecProcSupplierZnaLinks();
    refreshSpecProcEvalSummary();
}

function saveSpecProcZnaRecord() {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;
    const title = document.getElementById('specProcZnaTitle')?.value?.trim() || '';
    const items = readSpecProcZnaItems();
    if (!title) {
        showToast('Enter the sheet title (e.g. HP VICTUS 16 LAPTOP SPECIFICATIONS).', 'error');
        document.getElementById('specProcZnaTitle')?.focus();
        return;
    }
    if (!items.length) {
        showToast('Add at least one ITEM row.', 'error');
        return;
    }
    const list = ensureZnaSpecifications();
    const now = new Date().toISOString();
    const id = document.getElementById('specProcZnaEditId')?.value || `zna-spec-${Date.now()}`;
    const record = {
        id,
        specNo: document.getElementById('specProcZnaNo')?.value?.trim()
            || `SPEC/${new Date().getFullYear()}/${String(list.length + 1).padStart(3, '0')}`,
        date: document.getElementById('specProcZnaDate')?.value || '',
        category: document.getElementById('specProcZnaCategory')?.value || 'laptop',
        title,
        purpose: document.getElementById('specProcZnaPurpose')?.value?.trim() || '',
        dpRef: document.getElementById('specProcZnaDpRef')?.value?.trim() || '',
        items,
        compiled: readSpecProcSignoff('specProcZnaCompiled'),
        approved: readSpecProcSignoff('specProcZnaApproved'),
        updatedAt: now,
        createdAt: list.find((r) => r.id === id)?.createdAt || now
    };
    const idx = list.findIndex((r) => r.id === id);
    if (idx >= 0) list[idx] = record;
    else list.push(record);
    document.getElementById('specProcZnaEditId').value = id;
    document.getElementById('specProcZnaNo').value = record.specNo;
    populateSpecProcZnaSelect();
    if (typeof saveState === 'function') saveState();
    showToast(`Saved ZNA Specification: ${record.specNo}`);
}

function buildZnaSpecPrintHtml(rec) {
    const items = rec.items || [];
    const rows = items.map((r) => `
        <tr>
            <td class="zna-spec-label">${specProcEsc(r.name)}</td>
            <td class="zna-spec-value">${specProcEsc(r.value)}</td>
        </tr>`).join('');
    const sign = (label, s = {}) => `
        <div class="zna-spec-sign">
            <strong>${label}</strong>
            <span>Number: ${specProcEsc(s.idNo || '________')} &nbsp; Rank: ${specProcEsc(s.rank || '________')} &nbsp; Name: ${specProcEsc(s.name || '________')}</span>
            <span>Appt: ${specProcEsc(s.appt || '________')} &nbsp; Sig: ${specProcEsc(s.sig || '________')} &nbsp; Date: ${specProcEsc(s.date || '________')}</span>
        </div>`;
    return `
        <div class="zna-spec-print-sheet">
            <h1 class="zna-spec-print-title">${specProcEsc(rec.title || 'ZNA IT DIR SPECIFICATION')}</h1>
            <p class="zna-spec-print-meta">ZNA (IT Dir Specification)${rec.specNo ? ` · ${specProcEsc(rec.specNo)}` : ''}${rec.purpose ? ` · ${specProcEsc(rec.purpose)}` : ''}</p>
            <table class="zna-spec-print-table">${rows}</table>
            ${sign('Compiled by', rec.compiled)}
            ${sign('Approved by (OC Engineers)', rec.approved)}
        </div>`;
}

function printSpecProcZna() {
    const title = document.getElementById('specProcZnaTitle')?.value?.trim() || 'ZNA IT DIR SPECIFICATION';
    const rec = {
        title,
        specNo: document.getElementById('specProcZnaNo')?.value || '',
        purpose: document.getElementById('specProcZnaPurpose')?.value || '',
        items: readSpecProcZnaItems(),
        compiled: readSpecProcSignoff('specProcZnaCompiled'),
        approved: readSpecProcSignoff('specProcZnaApproved')
    };
    if (!rec.items.length) {
        showToast('Add ITEM rows before printing.', 'error');
        return;
    }
    let host = document.getElementById('specProcPrintHost');
    if (!host) {
        host = document.createElement('div');
        host.id = 'specProcPrintHost';
        host.className = 'print-only';
        document.body.appendChild(host);
    }
    host.innerHTML = buildZnaSpecPrintHtml(rec);
    host.classList.add('print-target');
    document.body.classList.add('is-printing', 'printing-zna-spec');
    window.print();
    setTimeout(() => {
        document.body.classList.remove('is-printing', 'printing-zna-spec');
        host.classList.remove('print-target');
    }, 500);
}

function refreshSpecProcSupplierZnaLinks() {
    const sel = document.getElementById('specProcSupZnaLink');
    const evalSel = document.getElementById('specProcEvalZnaSelect');
    const list = ensureZnaSpecifications();
    const opts = '<option value="">— Select ZNA spec —</option>'
        + list.map((r) => `<option value="${specProcEsc(r.id)}">${specProcEsc(r.specNo || r.id)} — ${specProcEsc(r.title || 'Spec')}</option>`).join('');
    if (sel) {
        const cur = sel.value;
        sel.innerHTML = opts;
        if (cur && list.some((r) => r.id === cur)) sel.value = cur;
    }
    if (evalSel) {
        const cur = evalSel.value;
        evalSel.innerHTML = opts;
        if (cur && list.some((r) => r.id === cur)) evalSel.value = cur;
    }
}

function renderSpecProcSupRows(items) {
    const body = document.getElementById('specProcSupBody');
    if (!body) return;
    if (!items?.length) {
        body.innerHTML = '<tr><td colspan="4" class="req-empty-row">Select a ZNA specification to load ITEM rows.</td></tr>';
        return;
    }
    body.innerHTML = items.map((row, idx) => `
        <tr>
            <td>${idx + 1}</td>
            <td><strong>${specProcEsc(row.name)}</strong><input type="hidden" data-spec-proc-sup-name value="${specProcEsc(row.name)}"></td>
            <td class="muted">${specProcEsc(row.znaValue || '—')}<input type="hidden" data-spec-proc-sup-zna value="${specProcEsc(row.znaValue || '')}"></td>
            <td>
                <select class="form-control" data-spec-proc-sup-offered data-current-value="${specProcEsc(row.offered || '')}"></select>
            </td>
        </tr>
    `).join('');
    wireSpecProcSupValueSelects();
}

function readSpecProcSupItems() {
    return [...document.querySelectorAll('#specProcSupBody tr')].map((tr) => ({
        name: tr.querySelector('[data-spec-proc-sup-name]')?.value || '',
        znaValue: tr.querySelector('[data-spec-proc-sup-zna]')?.value || '',
        offered: specProcReadFieldValue(tr.querySelector('[data-spec-proc-sup-offered]'))
    })).filter((r) => r.name);
}

function loadSpecProcSupFromZna(znaId) {
    const zna = ensureZnaSpecifications().find((r) => r.id === znaId);
    const hint = document.getElementById('specProcSupZnaHint');
    if (!zna) {
        renderSpecProcSupRows([]);
        if (hint) hint.textContent = 'Select a ZNA specification to copy ITEM rows, then fill the supplier’s offered values.';
        return;
    }
    if (hint) {
        hint.textContent = `Comparing against: ${zna.specNo || zna.id} — ${zna.title}. Fill each offered value from the supplier quotation.`;
    }
    if (!document.getElementById('specProcSupModel')?.value) {
        document.getElementById('specProcSupModel').value = zna.title || '';
    }
    renderSpecProcSupRows((zna.items || []).map((it) => ({
        name: it.name,
        znaValue: it.value,
        offered: ''
    })));
}

function clearSpecProcSupForm() {
    document.getElementById('specProcSupEditId').value = '';
    document.getElementById('specProcSupDate').value = new Date().toISOString().slice(0, 10);
    document.getElementById('specProcSupName').value = '';
    document.getElementById('specProcSupQuoteNo').value = '';
    document.getElementById('specProcSupPrice').value = '';
    document.getElementById('specProcSupCurrency').value = 'USD';
    document.getElementById('specProcSupModel').value = '';
    document.getElementById('specProcSupCapacity').value = '';
    const link = document.getElementById('specProcSupZnaLink');
    if (link) link.value = '';
    renderSpecProcSupRows([]);
    const sel = document.getElementById('specProcSupSavedSelect');
    if (sel) sel.value = '';
}

function loadSpecProcSupRecord(rec) {
    if (!rec) return;
    document.getElementById('specProcSupEditId').value = rec.id || '';
    document.getElementById('specProcSupDate').value = rec.date || '';
    document.getElementById('specProcSupName').value = rec.supplierName || '';
    document.getElementById('specProcSupQuoteNo').value = rec.quoteNo || '';
    document.getElementById('specProcSupPrice').value = rec.unitPrice ?? '';
    document.getElementById('specProcSupCurrency').value = rec.currency || 'USD';
    document.getElementById('specProcSupModel').value = rec.model || '';
    document.getElementById('specProcSupCapacity').value = rec.capacity || '';
    const link = document.getElementById('specProcSupZnaLink');
    if (link) link.value = rec.znaSpecId || '';
    renderSpecProcSupRows(rec.items || []);
    const sel = document.getElementById('specProcSupSavedSelect');
    if (sel) sel.value = rec.id || '';
}

function populateSpecProcSupSelect() {
    const sel = document.getElementById('specProcSupSavedSelect');
    if (!sel) return;
    const list = ensureSupplierQuotations();
    const cur = sel.value;
    sel.innerHTML = '<option value="">— New quotation —</option>'
        + list.map((r) => `<option value="${specProcEsc(r.id)}">${specProcEsc(r.quoteNo || r.id)} — ${specProcEsc(r.supplierName || 'Supplier')}</option>`).join('');
    if (cur && list.some((r) => r.id === cur)) sel.value = cur;
    refreshSpecProcEvalSummary();
}

function saveSpecProcSupRecord() {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;
    // Prefer portal login company name
    const portalName = (typeof stkSupplierKey === 'function' ? stkSupplierKey() : '')
        || (typeof currentUser !== 'undefined' ? (currentUser?.supplierKey || currentUser?.name || '') : '');
    const nameEl = document.getElementById('specProcSupName');
    if (portalName && nameEl && (!nameEl.value.trim() || nameEl.readOnly)) {
        nameEl.value = portalName;
    }
    const supplierName = nameEl?.value?.trim() || '';
    const znaSpecId = document.getElementById('specProcSupZnaLink')?.value || '';
    const items = readSpecProcSupItems();
    if (!supplierName) {
        showToast('Enter the supplier name.', 'error');
        return;
    }
    if (!znaSpecId) {
        showToast('Link this quotation to a ZNA (IT Dir Specification).', 'error');
        return;
    }
    if (!items.length) {
        showToast('Load ZNA ITEMs and enter offered specifications.', 'error');
        return;
    }
    const list = ensureSupplierQuotations();
    const now = new Date().toISOString();
    const id = document.getElementById('specProcSupEditId')?.value || `sup-quote-${Date.now()}`;
    const record = {
        id,
        znaSpecId,
        supplierName,
        quoteNo: document.getElementById('specProcSupQuoteNo')?.value?.trim()
            || `QTN/${new Date().getFullYear()}/${String(list.length + 1).padStart(3, '0')}`,
        date: document.getElementById('specProcSupDate')?.value || '',
        unitPrice: document.getElementById('specProcSupPrice')?.value || '',
        currency: document.getElementById('specProcSupCurrency')?.value || 'USD',
        model: document.getElementById('specProcSupModel')?.value?.trim() || '',
        capacity: document.getElementById('specProcSupCapacity')?.value?.trim() || '',
        items,
        updatedAt: now,
        createdAt: list.find((r) => r.id === id)?.createdAt || now
    };
    const idx = list.findIndex((r) => r.id === id);
    if (idx >= 0) list[idx] = record;
    else list.push(record);
    document.getElementById('specProcSupEditId').value = id;
    document.getElementById('specProcSupQuoteNo').value = record.quoteNo;
    populateSpecProcSupSelect();
    if (typeof saveState === 'function') saveState();
    showToast(`Saved Supplier Quotation: ${record.quoteNo}`);
}

/** Mount / refresh Supplier Spec / Quotation on the Supplier Window. */
function initSpecProcSupplierPortalForm(opts = {}) {
    const panel = document.getElementById('stkDeskSupplierSpecPanel');
    if (!panel) return;

    refreshSpecProcSupplierZnaLinks();
    populateSpecProcSupSelect();

    const nameEl = document.getElementById('specProcSupName');
    const portalName = (typeof stkSupplierKey === 'function' ? stkSupplierKey() : '')
        || (typeof currentUser !== 'undefined' ? (currentUser?.supplierKey || currentUser?.name || currentUser?.username || '') : '');
    if (nameEl && portalName) {
        nameEl.value = portalName;
        nameEl.readOnly = true;
    }

    if (!document.getElementById('specProcSupDate')?.value) {
        document.getElementById('specProcSupDate').value = new Date().toISOString().slice(0, 10);
    }

    if (panel.dataset.specProcSupBound === '1') return;
    panel.dataset.specProcSupBound = '1';

    document.getElementById('specProcSupZnaLink')?.addEventListener('change', (e) => {
        loadSpecProcSupFromZna(e.target.value);
    });
    document.getElementById('specProcSupSaveBtn')?.addEventListener('click', saveSpecProcSupRecord);
    document.getElementById('specProcSupPrintBtn')?.addEventListener('click', printSpecProcSup);
    document.getElementById('specProcSupNewBtn')?.addEventListener('click', () => {
        clearSpecProcSupForm();
        if (nameEl && portalName) {
            nameEl.value = portalName;
            nameEl.readOnly = true;
        }
    });
    document.getElementById('specProcSupSavedSelect')?.addEventListener('change', (e) => {
        const id = e.target.value;
        if (!id) {
            clearSpecProcSupForm();
            if (nameEl && portalName) {
                nameEl.value = portalName;
                nameEl.readOnly = true;
            }
            return;
        }
        const rec = ensureSupplierQuotations().find((r) => r.id === id);
        if (rec) loadSpecProcSupRecord(rec);
    });
}

function printSpecProcSup() {
    const supplierName = document.getElementById('specProcSupName')?.value?.trim() || 'Supplier';
    const model = document.getElementById('specProcSupModel')?.value?.trim() || 'SUPPLIER SPECIFICATION / QUOTATION';
    const items = readSpecProcSupItems();
    if (!items.length) {
        showToast('Add offered specifications before printing.', 'error');
        return;
    }
    const rows = items.map((r) => `
        <tr>
            <td class="zna-spec-label">${specProcEsc(r.name)}</td>
            <td class="zna-spec-value">${specProcEsc(r.offered || '—')}</td>
        </tr>`).join('');
    const html = `
        <div class="zna-spec-print-sheet">
            <h1 class="zna-spec-print-title">${specProcEsc(model)}</h1>
            <p class="zna-spec-print-meta">Supplier Spec / Quotation · ${specProcEsc(supplierName)}
                · Quote ${specProcEsc(document.getElementById('specProcSupQuoteNo')?.value || '—')}
                · ${specProcEsc(document.getElementById('specProcSupCurrency')?.value || '')}
                ${specProcEsc(document.getElementById('specProcSupPrice')?.value || '')}</p>
            <table class="zna-spec-print-table">${rows}</table>
        </div>`;
    let host = document.getElementById('specProcPrintHost');
    if (!host) {
        host = document.createElement('div');
        host.id = 'specProcPrintHost';
        host.className = 'print-only';
        document.body.appendChild(host);
    }
    host.innerHTML = html;
    host.classList.add('print-target');
    document.body.classList.add('is-printing', 'printing-zna-spec');
    window.print();
    setTimeout(() => {
        document.body.classList.remove('is-printing', 'printing-zna-spec');
        host.classList.remove('print-target');
    }, 500);
}

function handOffZnaToSpecEvaluation() {
    const znaId = document.getElementById('specProcEvalZnaSelect')?.value || '';
    const zna = ensureZnaSpecifications().find((r) => r.id === znaId);
    if (!zna) {
        showToast('Select a ZNA specification to hand off.', 'error');
        return;
    }
    if (typeof appState !== 'undefined') appState.specProcPendingEvalZnaId = zna.id;
    if (typeof navigateToModule === 'function') {
        navigateToModule('spec-evaluation', { znaSpecId: zna.id });
    }
}

function refreshSpecProcEvalSummary() {
    refreshSpecProcSupplierZnaLinks();
    const znaId = document.getElementById('specProcEvalZnaSelect')?.value
        || document.getElementById('specProcSupZnaLink')?.value || '';
    const box = document.getElementById('specProcEvalSupList');
    const linkStatus = document.getElementById('specProcEvalLinkStatus');
    if (!box) return;
    const quotes = ensureSupplierQuotations().filter((q) => !znaId || q.znaSpecId === znaId);
    if (!quotes.length) {
        box.innerHTML = '<span class="muted">No supplier quotations linked yet — complete step 2 first.</span>';
    } else {
        box.innerHTML = `<ul class="spec-proc-eval-sup-ul">${quotes.map((q) =>
            `<li><strong>${specProcEsc(q.supplierName)}</strong> — ${specProcEsc(q.quoteNo || q.id)}`
            + (q.unitPrice ? ` · ${specProcEsc(q.currency)} ${specProcEsc(q.unitPrice)}` : '')
            + `</li>`
        ).join('')}</ul>`;
    }
    if (linkStatus) {
        if (!znaId) {
            linkStatus.textContent = '';
            return;
        }
        const evals = (typeof ensureSpecEvaluations === 'function' ? ensureSpecEvaluations() : [])
            .filter((e) => e.znaSpecId === znaId && !e.seedExample);
        const zna = ensureZnaSpecifications().find((z) => z.id === znaId);
        if (evals.length || zna?.linkedEvalId) {
            const e = evals[0] || { evalNo: zna.linkedEvalNo, id: zna.linkedEvalId };
            linkStatus.innerHTML = `Already scored on <strong>Technical Specs</strong>: ${specProcEsc(e.evalNo || e.id)} — open that module to review or edit.`;
        } else {
            linkStatus.textContent = 'Not yet scored on Technical Specs — send ITEMs below to open the shared evaluation sheet.';
        }
    }
}

function initSpecificationProcessModule() {
    const root = document.getElementById('specification-process');
    if (!root) return;

    populateSpecProcZnaSelect();
    refreshSpecProcReceivedQuotes();
    refreshSpecProcSupplierZnaLinks();

    if (root.dataset.specProcInited === '1') {
        refreshSpecProcEvalSummary();
        const active = root.querySelector('[data-spec-proc-step].is-active')?.getAttribute('data-spec-proc-step') || 'zna';
        if (typeof specProcSetStep === 'function') specProcSetStep(active);
        return;
    }
    root.dataset.specProcInited = '1';

    if (!document.getElementById('specProcZnaDate')?.value) {
        clearSpecProcZnaForm();
    }

    root.querySelectorAll('[data-spec-proc-step]').forEach((btn) => {
        btn.addEventListener('click', () => specProcSetStep(btn.getAttribute('data-spec-proc-step')));
    });

    root.querySelectorAll('[data-spec-proc-zna-template]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const cat = btn.getAttribute('data-spec-proc-zna-template');
            document.getElementById('specProcZnaCategory').value = cat;
            renderSpecProcZnaRows(specProcItemTemplate(cat));
        });
    });

    document.getElementById('specProcZnaClearRows')?.addEventListener('click', () => renderSpecProcZnaRows([]));
    document.getElementById('specProcZnaAddRow')?.addEventListener('click', () => {
        const name = document.getElementById('specProcZnaNewItem')?.value?.trim() || '';
        const items = readSpecProcZnaItems();
        items.push({ name: name || 'New ITEM', value: '' });
        renderSpecProcZnaRows(items);
        const input = document.getElementById('specProcZnaNewItem');
        if (input) input.value = '';
    });
    document.getElementById('specProcZnaBody')?.addEventListener('click', (e) => {
        if (!e.target.closest('[data-spec-proc-zna-del]')) return;
        e.target.closest('tr')?.remove();
        const items = readSpecProcZnaItems();
        renderSpecProcZnaRows(items.length ? items : [{ name: '', value: '' }]);
    });

    document.getElementById('specProcZnaLoadVictus')?.addEventListener('click', () => {
        document.getElementById('specProcZnaCategory').value = 'laptop';
        document.getElementById('specProcZnaTitle').value = SPEC_PROC_VICTUS_EXAMPLE.title;
        document.getElementById('specProcZnaPurpose').value = SPEC_PROC_VICTUS_EXAMPLE.purpose;
        writeSpecProcSignoff('specProcZnaCompiled', SPEC_PROC_VICTUS_EXAMPLE.compiled);
        writeSpecProcSignoff('specProcZnaApproved', SPEC_PROC_VICTUS_EXAMPLE.approved);
        renderSpecProcZnaRows(SPEC_PROC_VICTUS_EXAMPLE.items);
        showToast('Loaded Victus paper example — edit and Save ZNA Specification.');
    });

    document.getElementById('specProcZnaSaveBtn')?.addEventListener('click', saveSpecProcZnaRecord);
    document.getElementById('specProcZnaPrintBtn')?.addEventListener('click', printSpecProcZna);
    document.getElementById('specProcZnaNewBtn')?.addEventListener('click', clearSpecProcZnaForm);
    document.getElementById('specProcGotoSupplierBtn')?.addEventListener('click', () => specProcSetStep('supplier'));

    document.getElementById('specProcZnaSavedSelect')?.addEventListener('change', (e) => {
        const id = e.target.value;
        if (!id) {
            clearSpecProcZnaForm();
            return;
        }
        const rec = ensureZnaSpecifications().find((r) => r.id === id);
        if (rec) loadSpecProcZnaRecord(rec);
    });

    document.getElementById('specProcZnaCategory')?.addEventListener('change', (e) => {
        if (!readSpecProcZnaItems().some((r) => r.value)) {
            renderSpecProcZnaRows(specProcItemTemplate(e.target.value));
        }
    });

    document.getElementById('specProcReceivedZnaFilter')?.addEventListener('change', refreshSpecProcReceivedQuotes);
    document.getElementById('specProcOpenSupplierPortalBtn')?.addEventListener('click', () => {
        if (typeof navigateToModule === 'function') {
            navigateToModule('stakeholder-desk', { stkDesk: 'supplier', stkDeskTab: 'specquote' });
        }
    });
    document.getElementById('specProcGotoEvalBtn')?.addEventListener('click', () => specProcSetStep('eval'));

    document.getElementById('specProcEvalZnaSelect')?.addEventListener('change', refreshSpecProcEvalSummary);
    document.getElementById('specProcOpenEvalBtn')?.addEventListener('click', () => {
        const znaId = document.getElementById('specProcEvalZnaSelect')?.value || '';
        if (znaId) {
            handOffZnaToSpecEvaluation();
            return;
        }
        if (typeof navigateToModule === 'function') navigateToModule('spec-evaluation');
        setTimeout(() => document.getElementById('specPaperForm')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 350);
    });
    document.getElementById('specProcOpenLegacyBtn')?.addEventListener('click', () => {
        if (typeof navigateToModule === 'function') navigateToModule('spec-evaluation');
        setTimeout(() => document.querySelector('.spec-search-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 350);
    });
    document.getElementById('specProcOpenCostBtn')?.addEventListener('click', () => {
        if (typeof navigateToModule === 'function') {
            navigateToModule('stakeholder-desk', { stkDesk: 'aiad', stkDeskTab: 'cost' });
        }
    });
    document.getElementById('specProcHandOffEvalBtn')?.addEventListener('click', handOffZnaToSpecEvaluation);

    specProcSetStep('zna');
}

window.initSpecificationProcessModule = initSpecificationProcessModule;
window.initSpecProcSupplierPortalForm = initSpecProcSupplierPortalForm;
window.ensureZnaSpecifications = ensureZnaSpecifications;
window.ensureSupplierQuotations = ensureSupplierQuotations;
window.specProcSetStep = specProcSetStep;
