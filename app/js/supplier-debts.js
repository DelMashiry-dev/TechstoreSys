/* supplier-debts.js — Non-paid goods received (IT Dir cost centre → push DAF) */

const SD_STATUSES = [
    { value: 'open', label: 'Open — unpaid' },
    { value: 'chased_daf', label: 'Chased DAF' },
    { value: 'part_paid', label: 'Part paid' },
    { value: 'paid', label: 'Paid' },
    { value: 'cancelled', label: 'Cancelled' }
];

const SD_OPEN_STATUSES = new Set(['open', 'chased_daf', 'part_paid']);
const SD_SEED_REV = 3;
const SD_CREDITORS_IMPORT_SOURCE = 'it-dir-creditors-2025-11';

function sdEscape(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function sdFmtUsd(amount) {
    return Number(amount || 0).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function sdToday() {
    return typeof todayIsoLocal === 'function'
        ? todayIsoLocal()
        : new Date().toISOString().slice(0, 10);
}

function sdParseNum(value) {
    if (value == null || value === '') return 0;
    const n = Number(String(value).replace(/,/g, ''));
    return Number.isFinite(n) ? n : 0;
}

function sdLineUsd(line) {
    const explicit = sdParseNum(line?.totalUsd);
    const parts = sdParseNum(line?.convertedUsd) + sdParseNum(line?.amountUsd);
    if (parts > 0) return Math.round(parts * 100) / 100;
    return Math.round(explicit * 100) / 100;
}

function sdCaseUsd(rec) {
    const lines = Array.isArray(rec?.lines) ? rec.lines : [];
    if (lines.length) {
        return Math.round(lines.reduce((sum, line) => sum + sdLineUsd(line), 0) * 100) / 100;
    }
    return Math.round(sdParseNum(rec?.totalUsd) * 100) / 100;
}

function sdEarliestSupplyDate(rec) {
    const fromLines = (rec?.lines || [])
        .map((line) => String(line.supplyDate || '').slice(0, 10))
        .filter(Boolean)
        .sort();
    return rec?.accumulatedFrom
        || fromLines[0]
        || rec?.receivedDate
        || rec?.createdAt
        || '';
}

function sdAgeEndDate(rec) {
    if (rec?.status === 'paid' && rec.paidDate) return rec.paidDate;
    if (rec?.status === 'cancelled') return rec.paidDate || rec.updatedAt || rec.receivedDate || sdToday();
    return sdToday();
}

function sdAgeDays(rec) {
    const start = sdEarliestSupplyDate(rec);
    if (!start) return 0;
    const d = new Date(`${String(start).slice(0, 10)}T00:00:00`);
    if (Number.isNaN(d.getTime())) return 0;
    const end = new Date(`${String(sdAgeEndDate(rec)).slice(0, 10)}T00:00:00`);
    if (Number.isNaN(end.getTime())) return 0;
    d.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    return Math.max(0, Math.round((end - d) / 86400000));
}

function sdAgeLabel(days) {
    const n = Number(days) || 0;
    const years = Math.floor(n / 365);
    const months = Math.floor((n % 365) / 30);
    if (years >= 1) {
        return months ? `${years}y ${months}m · ${n}d` : `${years}y · ${n}d`;
    }
    if (months >= 1) return `${months}m · ${n}d`;
    return `${n}d`;
}

function sdAgeBucket(days) {
    const n = Number(days) || 0;
    if (n >= 730) return { key: 'y2', label: '2 years+', css: 'req-age-overdue' };
    if (n >= 365) return { key: 'y1', label: '1–2 years', css: 'req-age-aging' };
    if (n >= 180) return { key: 'y0h', label: '6–12 months', css: 'req-age-attention' };
    return { key: 'y0', label: 'Under 1 year', css: 'req-age-new' };
}

function sdStatusLabel(value) {
    return SD_STATUSES.find((s) => s.value === value)?.label || value || '—';
}

function sdNewId() {
    return `sd-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function sdNextCaseNo() {
    const year = new Date().getFullYear();
    const prefix = `SD-${year}-`;
    let max = 0;
    ensureSupplierDebts().forEach((rec) => {
        const m = String(rec.caseNo || '').match(new RegExp(`^SD-${year}-(\\d+)$`, 'i'));
        if (m) max = Math.max(max, Number(m[1]) || 0);
    });
    return `${prefix}${String(max + 1).padStart(3, '0')}`;
}

function createDefaultSupplierDebts() {
    return [];
}

function sdDampackSeedCase() {
    return {
        id: 'sd-seed-dampack-2022',
        caseNo: 'SD-2022-001',
        minuteRef: 'QS/13/3',
        receivedDate: '2024-08-26',
        accumulatedFrom: '2022-07-01',
        supplier: 'Dampack Enterprises (Pvt) Ltd',
        costCentre: 'IT DIR',
        description: 'Printing press repair and maintenance (OSD Hre) — goods/services received, not yet paid.',
        actionTo: 'AS Branch',
        infoTo: 'Brig Gen QS, IT Dir, File',
        status: 'open',
        currency: 'USD',
        totalUsd: 77726.81,
        attachments: 'Reconciled outstanding debt (01 copy)',
        notes: 'Running contract. Cost centres on the invoice register include IT DIR and DAF. Use this case to chase DAF for settlement.',
        dafChasedAt: '',
        dafChasedRef: '',
        paidDate: '',
        createdAt: '2024-08-26T00:00:00',
        updatedAt: '2024-08-26T00:00:00',
        lines: [
            {
                supplyDate: '2022-07-01',
                costCentre: 'IT DIR',
                poNo: 'register',
                invoiceNo: 'ZWL converted (rolled-up)',
                amountZwl: 89545087.87,
                rateUsd: '',
                convertedUsd: 59296.81,
                amountZwg: 16712.88,
                amountUsd: 0,
                totalUsd: 59296.81
            },
            {
                supplyDate: '2022-07-01',
                costCentre: 'IT DIR',
                poNo: 'register',
                invoiceNo: 'Direct USD invoices (rolled-up)',
                amountZwl: 0,
                rateUsd: '',
                convertedUsd: 0,
                amountZwg: 0,
                amountUsd: 18430,
                totalUsd: 18430
            }
        ]
    };
}

function sdNixzimoDp3478SeedCase() {
    return {
        id: 'sd-seed-nixzimo-dp3478-2026',
        caseNo: 'SD-2026-3478',
        minuteRef: 'Req 10080264',
        receivedDate: '2026-08-25',
        accumulatedFrom: '2026-08-24',
        supplier: 'NIXZIMO PVT LTD',
        costCentre: 'IT DIR',
        description: 'DP 3478/2026 — 5 laptops received OSD HRE GP 3 (Q 1033 RV 205). P/O names EliteBook 830 G9; invoice/D-Note name Victus Gaming 15. Inspection hold before DAF pay.',
        actionTo: 'DAF',
        infoTo: 'IT Dir, DP, File',
        status: 'open',
        currency: 'ZWG',
        totalUsd: 0,
        attachments: 'P/O DP 3478/2026 · Invoice 205 · D-Note · Q 1033 RV 205 · AIAD due diligence · CABS banking',
        notes: 'ZWG 350,000.00 on P/O. CABS Borrowdale ZWG 1156015626 / USD 1156015634. Do not chase DAF pay until IT Dir clears the EliteBook vs Victus spec mismatch.',
        dafChasedAt: '',
        dafChasedRef: '',
        paidDate: '',
        createdAt: '2026-08-25T00:00:00',
        updatedAt: '2026-08-28T00:00:00',
        lines: [
            {
                supplyDate: '2026-08-24',
                costCentre: 'IT DIR',
                poNo: 'DP 3478/2026',
                invoiceNo: '205',
                amountZwl: 0,
                rateUsd: '',
                convertedUsd: 0,
                amountZwg: 350000,
                amountUsd: 0,
                totalUsd: 0
            }
        ]
    };
}

function sdNormRef(value) {
    return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function sdPaidEntryMatchesCase(rec, entry) {
    if (!rec || !entry || rec.status === 'paid') return false;
    const entryPo = sdNormRef(entry.poNo);
    const entryInv = sdNormRef(entry.invoiceNo);
    const entrySup = sdSupplierNormKey(entry.supplier);
    const lines = rec.lines || [];

    for (const line of lines) {
        const linePo = sdNormRef(line.poNo);
        const lineInv = sdNormRef(line.invoiceNo);
        if (entryInv && lineInv && entryInv === lineInv) return true;
        if (entryPo && linePo && entryPo === linePo && (!entryInv || !lineInv)) return true;
        if (entryPo && linePo && entryInv && lineInv && entryPo === linePo && entryInv === lineInv) return true;
    }

    if (entrySup && sdSupplierNormKey(rec.supplier) === entrySup) {
        const amt = sdParseNum(entry.amountUsd);
        if (amt > 0 && Math.abs(sdCaseUsd(rec) - amt) <= Math.max(1, amt * 0.02)) return true;
        if (!entryInv && !entryPo) return true;
    }
    return false;
}

function previewCreditorsPaidList(entries) {
    const list = ensureSupplierDebts();
    const open = list.filter((rec) => SD_OPEN_STATUSES.has(rec.status));
    const matched = [];
    const usedIds = new Set();

    (entries || []).forEach((entry) => {
        const hit = open.find((rec) => !usedIds.has(rec.id) && sdPaidEntryMatchesCase(rec, entry));
        if (hit) {
            usedIds.add(hit.id);
            matched.push({ entry, rec: hit });
        }
    });

    return {
        matched,
        unmatchedEntries: (entries || []).filter((entry) => !matched.some((m) => m.entry === entry)),
        unmatchedCases: open.filter((rec) => !usedIds.has(rec.id))
    };
}

function applyCreditorsPaidList(entries, { force = false } = {}) {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return null;
    const preview = previewCreditorsPaidList(entries);
    if (!preview.matched.length) {
        showToast('No open creditor cases matched the paid list.', 'warning');
        return preview;
    }
    if (!force) {
        const ok = confirm(
            `Mark ${preview.matched.length} creditor case(s) as paid?\n\n` +
            preview.matched.slice(0, 8).map(({ rec, entry }) =>
                `• ${rec.supplier || rec.caseNo}${entry.paidDate ? ` · paid ${entry.paidDate}` : ''}`
            ).join('\n') +
            (preview.matched.length > 8 ? `\n…and ${preview.matched.length - 8} more` : '')
        );
        if (!ok) return preview;
    }

    const now = new Date().toISOString();
    preview.matched.forEach(({ rec, entry }) => {
        rec.status = 'paid';
        rec.paidDate = entry.paidDate || sdToday();
        rec.notes = [rec.notes, `Marked paid from ${entry.source || 'DAF paid list'}${entry.invoiceNo ? ` · inv ${entry.invoiceNo}` : ''}`]
            .filter(Boolean).join(' · ');
        rec.updatedAt = now;
    });
    if (typeof saveState === 'function') saveState();
    showToast(`Marked ${preview.matched.length} creditor case(s) as paid.`, 'success');
    renderSupplierDebtsModule();
    if (typeof updateDashboard === 'function') updateDashboard();
    return preview;
}

function sdIsCreditorsSummarySupplier(name) {
    const n = String(name || '').trim().toLowerCase();
    return !n || n === 'grand total' || n === 'total' || n.includes('grand total');
}

function sdNormalizeCreditorsCase(raw) {
    if (sdIsCreditorsSummarySupplier(raw?.supplier)) return null;
    const now = new Date().toISOString();
    const lines = (raw.lines || []).map((line) => ({
        ...emptySdLine(),
        ...line,
        costCentre: line.costCentre || 'IT DIR'
    }));
    const totalUsd = raw.totalUsd != null
        ? Math.round(sdParseNum(raw.totalUsd) * 100) / 100
        : Math.round(lines.reduce((sum, line) => sum + sdLineUsd(line), 0) * 100) / 100;
    const receivedDate = raw.receivedDate || '2025-11-05';
    return {
        id: raw.id || sdNewId(),
        caseNo: raw.caseNo || sdNextCaseNo(),
        minuteRef: raw.minuteRef || '',
        receivedDate,
        accumulatedFrom: raw.accumulatedFrom || sdEarliestSupplyDate({ lines, receivedDate }),
        supplier: raw.supplier || '',
        costCentre: raw.costCentre || 'IT DIR',
        description: raw.description || `Creditors register — ${raw.supplier || 'supplier'}`,
        actionTo: raw.actionTo || 'DAF',
        infoTo: raw.infoTo || 'IT Dir, File',
        status: raw.status || 'open',
        currency: 'USD',
        totalUsd,
        attachments: raw.attachments || '',
        notes: raw.notes || '',
        dafChasedAt: '',
        dafChasedRef: '',
        paidDate: '',
        createdAt: now,
        updatedAt: now,
        importSource: SD_CREDITORS_IMPORT_SOURCE,
        lines
    };
}

function getItDirCreditorsPack() {
    return typeof IT_DIR_CREDITORS_SEED !== 'undefined' ? IT_DIR_CREDITORS_SEED : null;
}

function sdIsImportedCreditorsCase(rec) {
    return rec?.importSource === SD_CREDITORS_IMPORT_SOURCE
        || String(rec?.id || '').startsWith('sd-it-cred-');
}

function importItDirCreditorsCases(rawCases, { mode = 'merge' } = {}) {
    if (!appState) return { added: 0, updated: 0, skipped: 0, total: 0 };
    if (!Array.isArray(appState.supplierDebts)) {
        appState.supplierDebts = createDefaultSupplierDebts();
    }
    const cases = (rawCases || []).map(sdNormalizeCreditorsCase).filter(Boolean);
    if (mode === 'replace-imported') {
        appState.supplierDebts = appState.supplierDebts.filter((rec) => !sdIsImportedCreditorsCase(rec));
    }
    let added = 0;
    let updated = 0;
    let skipped = 0;
    cases.forEach((rec) => {
        const idx = appState.supplierDebts.findIndex((row) => row.id === rec.id);
        if (idx >= 0) {
            if (mode === 'merge-skip') {
                skipped += 1;
                return;
            }
            const prev = appState.supplierDebts[idx];
            appState.supplierDebts[idx] = {
                ...rec,
                status: prev.status && prev.status !== 'open' ? prev.status : rec.status,
                dafChasedAt: prev.dafChasedAt || rec.dafChasedAt,
                dafChasedRef: prev.dafChasedRef || rec.dafChasedRef,
                paidDate: prev.paidDate || rec.paidDate,
                minuteRef: prev.minuteRef || rec.minuteRef,
                description: prev.description || rec.description,
                notes: prev.notes || rec.notes,
                attachments: prev.attachments || rec.attachments,
                createdAt: prev.createdAt || rec.createdAt,
                updatedAt: new Date().toISOString()
            };
            updated += 1;
            return;
        }
        appState.supplierDebts.push(rec);
        added += 1;
    });
    if (typeof saveState === 'function') saveState();
    return { added, updated, skipped, total: cases.length };
}

function updateSdCreditorsPackSummary() {
    const el = document.getElementById('sdCreditorsPackSummary');
    const pack = getItDirCreditorsPack();
    if (!el || !pack) return;
    el.innerHTML = `<strong>${sdEscape(pack.title || 'IT DIR creditors register')}</strong> — ` +
        `${pack.caseCount} supplier case(s) · ${pack.lineCount} invoice line(s) · USD ${sdFmtUsd(pack.totalUsd)}` +
        (pack.source ? ` · source: ${sdEscape(pack.source)}` : '');
}

function loadItDirCreditorsRegister(options = {}) {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return false;
    const pack = getItDirCreditorsPack();
    if (!pack || !Array.isArray(pack.cases) || !pack.cases.length) {
        showToast('IT DIR creditors register pack not found.', 'error');
        return false;
    }
    const mode = options.mode || document.getElementById('sdCreditorsLoadMode')?.value || 'merge';
    const force = options.force === true;
    if (!force && mode === 'replace-imported') {
        const ok = confirm(
            `Replace the imported IT DIR creditors register?\n\n` +
            `${pack.caseCount} supplier case(s) · ${pack.lineCount} invoice line(s) · USD ${sdFmtUsd(pack.totalUsd)}\n\n` +
            `Manual cases (Dampack detail, Nixzimo, etc.) are kept. Only register-imported cases are removed first.`
        );
        if (!ok) return false;
    }
    const result = importItDirCreditorsCases(pack.cases, { mode });
    updateSdCreditorsPackSummary();
    const statusEl = document.getElementById('sdCreditorsImportStatus');
    if (statusEl) {
        statusEl.hidden = false;
        statusEl.textContent = `Last load: ${result.added} added · ${result.updated} updated · ${result.skipped} skipped (${result.total} in register).`;
    }
    if (typeof renderSupplierDebtsModule === 'function') renderSupplierDebtsModule();
    if (typeof updateDashboard === 'function') updateDashboard();
    showToast(
        `Loaded IT DIR creditors register — ${result.added} added, ${result.updated} updated${result.skipped ? `, ${result.skipped} skipped` : ''}.`,
        'success'
    );
    return true;
}

function ensureSupplierDebts() {
    if (!appState) return [];
    if (!Array.isArray(appState.supplierDebts)) {
        appState.supplierDebts = createDefaultSupplierDebts();
    }
    const rev = Number(appState.supplierDebtSeedRev) || 0;
    if (rev < SD_SEED_REV) {
        if (rev < 2) {
            const hasDampack = appState.supplierDebts.some((rec) => rec.id === 'sd-seed-dampack-2022');
            if (!hasDampack) appState.supplierDebts.push(sdDampackSeedCase());
            const hasNixzimo = appState.supplierDebts.some((rec) => rec.id === 'sd-seed-nixzimo-dp3478-2026');
            if (!hasNixzimo) appState.supplierDebts.push(sdNixzimoDp3478SeedCase());
        }
        if (rev < 3) {
            const hasCreditors = appState.supplierDebts.some((rec) => sdIsImportedCreditorsCase(rec));
            const pack = getItDirCreditorsPack();
            if (!hasCreditors && pack?.cases?.length) {
                pack.cases.forEach((raw) => {
                    const rec = sdNormalizeCreditorsCase(raw);
                    if (rec) appState.supplierDebts.push(rec);
                });
            }
        }
        appState.supplierDebtSeedRev = SD_SEED_REV;
        if (typeof saveState === 'function') saveState();
    }
    return appState.supplierDebts;
}

function getSupplierDebtById(id) {
    if (!id) return null;
    return ensureSupplierDebts().find((rec) => rec.id === id) || null;
}

function emptySdLine() {
    return {
        supplyDate: sdToday(),
        costCentre: 'IT DIR',
        poNo: '',
        invoiceNo: '',
        amountZwl: '',
        rateUsd: '',
        convertedUsd: '',
        amountZwg: '',
        amountUsd: '',
        totalUsd: ''
    };
}

function sdReadLineRow(tr) {
    const val = (name) => tr.querySelector(`[data-sd-line="${name}"]`)?.value || '';
    const converted = sdParseNum(val('convertedUsd'));
    const usd = sdParseNum(val('amountUsd'));
    let total = sdParseNum(val('totalUsd'));
    if (converted + usd > 0) total = Math.round((converted + usd) * 100) / 100;
    return {
        supplyDate: val('supplyDate'),
        costCentre: val('costCentre') || 'IT DIR',
        poNo: val('poNo').trim(),
        invoiceNo: val('invoiceNo').trim(),
        amountZwl: sdParseNum(val('amountZwl')) || '',
        rateUsd: val('rateUsd').trim(),
        convertedUsd: converted || '',
        amountZwg: sdParseNum(val('amountZwg')) || '',
        amountUsd: usd || '',
        totalUsd: total || ''
    };
}

function sdLineRowHtml(line) {
    const l = line || emptySdLine();
    const cc = l.costCentre || 'IT DIR';
    const centres = ['IT DIR', 'DAF', 'ORD DIR', 'OSD', 'Other'];
    const ccOpts = centres.map((c) =>
        `<option value="${sdEscape(c)}"${c === cc ? ' selected' : ''}>${sdEscape(c)}</option>`
    ).join('');
    const num = (v) => (v === 0 || v ? String(v) : '');
    return `<tr>
        <td><input type="date" class="form-control" data-sd-line="supplyDate" value="${sdEscape(l.supplyDate || '')}"></td>
        <td><select class="form-control" data-sd-line="costCentre">${ccOpts}</select></td>
        <td><input type="text" class="form-control" data-sd-line="poNo" value="${sdEscape(l.poNo || '')}"></td>
        <td><input type="text" class="form-control" data-sd-line="invoiceNo" value="${sdEscape(l.invoiceNo || '')}"></td>
        <td><input type="number" step="0.01" class="form-control" data-sd-line="amountZwl" value="${sdEscape(num(l.amountZwl))}"></td>
        <td><input type="text" class="form-control" data-sd-line="rateUsd" value="${sdEscape(l.rateUsd || '')}"></td>
        <td><input type="number" step="0.01" class="form-control" data-sd-line="convertedUsd" value="${sdEscape(num(l.convertedUsd))}"></td>
        <td><input type="number" step="0.01" class="form-control" data-sd-line="amountZwg" value="${sdEscape(num(l.amountZwg))}"></td>
        <td><input type="number" step="0.01" class="form-control" data-sd-line="amountUsd" value="${sdEscape(num(l.amountUsd))}"></td>
        <td><input type="number" step="0.01" class="form-control" data-sd-line="totalUsd" value="${sdEscape(num(l.totalUsd || sdLineUsd(l)))}"></td>
        <td><button type="button" class="btn btn-ghost btn-sm" data-sd-line-remove title="Remove line">×</button></td>
    </tr>`;
}

function sdReadLinesFromDom() {
    return Array.from(document.querySelectorAll('#sd-lines-body tr')).map(sdReadLineRow);
}

function sdRefreshLineTotals() {
    const lines = sdReadLinesFromDom();
    let converted = 0;
    let zig = 0;
    let usd = 0;
    let grand = 0;
    lines.forEach((line) => {
        converted += sdParseNum(line.convertedUsd);
        zig += sdParseNum(line.amountZwg);
        usd += sdParseNum(line.amountUsd);
        grand += sdLineUsd(line);
    });
    const set = (id, n) => {
        const el = document.getElementById(id);
        if (el) el.textContent = sdFmtUsd(n);
    };
    set('sdTotConverted', converted);
    set('sdTotZig', zig);
    set('sdTotUsd', usd);
    set('sdTotGrand', grand);
}

function renderSdLines(lines) {
    const body = document.getElementById('sd-lines-body');
    if (!body) return;
    const rows = (lines && lines.length) ? lines : [emptySdLine()];
    body.innerHTML = rows.map(sdLineRowHtml).join('');
    sdRefreshLineTotals();
}

function addSdLine() {
    const body = document.getElementById('sd-lines-body');
    if (!body) return;
    body.insertAdjacentHTML('beforeend', sdLineRowHtml(emptySdLine()));
    sdRefreshLineTotals();
}

function populateSdStatusSelect() {
    const el = document.getElementById('sdStatus');
    if (!el || el.dataset.ready === '1') return;
    el.innerHTML = SD_STATUSES.map((s) =>
        `<option value="${sdEscape(s.value)}">${sdEscape(s.label)}</option>`
    ).join('');
    el.dataset.ready = '1';
}

function collectListedSdSuppliers() {
    const map = new Map();
    const add = (name, source) => {
        const n = String(name || '').trim();
        if (!n) return;
        const key = n.toLowerCase();
        const prev = map.get(key);
        if (!prev) {
            map.set(key, { name: n, source });
            return;
        }
        if (source === 'owed' || (source === 'tray' && prev.source === 'register')) {
            prev.source = source;
            prev.name = n;
        }
    };
    ensureSupplierDebts().forEach((rec) => {
        add(rec.supplier, SD_OPEN_STATUSES.has(rec.status) ? 'owed' : 'tray');
    });
    if (typeof collectSystemSuppliers === 'function') {
        collectSystemSuppliers().forEach((row) => add(row.name, 'register'));
    } else if (typeof collectSupplierRows === 'function') {
        collectSupplierRows().forEach((row) => add(row.name, 'register'));
    }
    if (typeof IT_DIR_SUPPLIERS_SEED !== 'undefined') {
        IT_DIR_SUPPLIERS_SEED.forEach((s) => add(s.name, 'register'));
    }
    add('Dampack Enterprises (Pvt) Ltd', 'owed');
    return Array.from(map.values()).sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    );
}

function sdSupplierSourceLabel(source) {
    if (source === 'owed') return 'Owed';
    if (source === 'tray') return 'On tray';
    return 'Register';
}

function filterListedSdSuppliers(query) {
    const q = String(query || '').trim().toLowerCase();
    const rows = collectListedSdSuppliers();
    if (!q) return rows;
    return rows.filter((row) => row.name.toLowerCase().includes(q));
}

function hideSdComboList(list, input) {
    if (list) list.hidden = true;
    if (input) input.setAttribute('aria-expanded', 'false');
}

function hideAllSdComboLists(exceptList) {
    document.querySelectorAll('.sd-combo-list').forEach((list) => {
        if (exceptList && list === exceptList) return;
        hideSdComboList(list, list.closest('.sd-combo')?.querySelector('input'));
    });
}

function setSdComboActive(list, index) {
    const items = Array.from(list.querySelectorAll('.sd-combo-item'));
    items.forEach((el, i) => el.classList.toggle('is-active', i === index));
    items[index]?.scrollIntoView({ block: 'nearest' });
}

function renderSdComboList(list, query, { showAll = false } = {}) {
    if (!list) return [];
    const q = showAll ? '' : query;
    const rows = filterListedSdSuppliers(q);
    if (!rows.length) {
        const typed = String(query || '').trim();
        list.innerHTML = typed
            ? '<li class="sd-combo-empty">No listed match — keep typing a new name.</li>'
            : '<li class="sd-combo-empty">No listed suppliers yet.</li>';
        return [];
    }
    list.innerHTML = rows.map((row, index) => `
        <li class="sd-combo-item${row.source === 'owed' ? ' is-owed' : ''}" role="option" data-sd-name="${sdEscape(row.name)}" data-index="${index}">
            <span>${sdEscape(row.name)}</span>
            <span class="sd-combo-meta">${sdEscape(sdSupplierSourceLabel(row.source))}</span>
        </li>
    `).join('');
    return rows;
}

function showSdComboList(input, list, { showAll = false } = {}) {
    if (!input || !list) return;
    hideAllSdComboLists(list);
    renderSdComboList(list, input.value, { showAll });
    list.hidden = false;
    input.setAttribute('aria-expanded', 'true');
}

function pickSdComboValue(input, name, onPick) {
    if (!input) return;
    input.value = name || '';
    hideSdComboList(input.closest('.sd-combo')?.querySelector('.sd-combo-list'), input);
    if (typeof onPick === 'function') onPick();
}

function initSdSupplierCombo(inputId, listId, toggleId, onPick) {
    const input = document.getElementById(inputId);
    const list = document.getElementById(listId);
    const toggle = document.getElementById(toggleId);
    if (!input || !list || input.dataset.sdComboReady === '1') return;
    input.dataset.sdComboReady = '1';

    input.addEventListener('focus', () => showSdComboList(input, list));
    input.addEventListener('input', () => {
        showSdComboList(input, list);
        if (typeof onPick === 'function') onPick();
    });
    input.addEventListener('keydown', (e) => {
        const open = list && !list.hidden;
        const items = Array.from(list.querySelectorAll('.sd-combo-item'));
        const active = list.querySelector('.sd-combo-item.is-active');
        const idx = active ? items.indexOf(active) : -1;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (!open) showSdComboList(input, list, { showAll: true });
            else setSdComboActive(list, Math.min(items.length - 1, idx + 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (open) setSdComboActive(list, Math.max(0, idx - 1));
        } else if (e.key === 'Enter') {
            if (open && active) {
                e.preventDefault();
                pickSdComboValue(input, active.getAttribute('data-sd-name'), onPick);
            } else if (open) {
                hideSdComboList(list, input);
            }
        } else if (e.key === 'Escape') {
            hideSdComboList(list, input);
        }
    });
    toggle?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!list.hidden) {
            hideSdComboList(list, input);
            return;
        }
        input.focus();
        showSdComboList(input, list, { showAll: true });
    });
    list.addEventListener('mousedown', (e) => {
        const item = e.target.closest('.sd-combo-item');
        if (!item) return;
        e.preventDefault();
        pickSdComboValue(input, item.getAttribute('data-sd-name'), onPick);
    });
}

function clearSupplierDebtForm() {
    const set = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.value = value ?? '';
    };
    set('sdEditId', '');
    set('sdReceivedDate', sdToday());
    set('sdAccumulatedFrom', '');
    set('sdMinuteRef', '');
    set('sdCaseNo', '');
    set('sdSupplier', '');
    set('sdCostCentre', 'IT DIR');
    set('sdStatus', 'open');
    set('sdDescription', '');
    set('sdActionTo', 'AS Branch');
    set('sdInfoTo', 'DAF, File');
    set('sdPaidDate', '');
    set('sdDafChasedAt', '');
    set('sdDafChasedRef', '');
    set('sdAttachments', '');
    set('sdNotes', '');
    const title = document.getElementById('sdFormTitle');
    if (title) title.textContent = 'Book a non-paid delivery';
    const btn = document.getElementById('sdSaveBtn');
    if (btn) btn.textContent = 'Save case';
    renderSdLines([emptySdLine()]);
}

function fillSupplierDebtForm(rec) {
    const set = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.value = value ?? '';
    };
    set('sdEditId', rec.id);
    set('sdReceivedDate', rec.receivedDate || '');
    set('sdAccumulatedFrom', rec.accumulatedFrom || sdEarliestSupplyDate(rec));
    set('sdMinuteRef', rec.minuteRef || '');
    set('sdCaseNo', rec.caseNo || '');
    set('sdSupplier', rec.supplier || '');
    set('sdCostCentre', rec.costCentre || 'IT DIR');
    set('sdStatus', rec.status || 'open');
    set('sdDescription', rec.description || '');
    set('sdActionTo', rec.actionTo || '');
    set('sdInfoTo', rec.infoTo || '');
    set('sdPaidDate', rec.paidDate || '');
    set('sdDafChasedAt', rec.dafChasedAt || '');
    set('sdDafChasedRef', rec.dafChasedRef || '');
    set('sdAttachments', rec.attachments || '');
    set('sdNotes', rec.notes || '');
    const title = document.getElementById('sdFormTitle');
    if (title) title.textContent = `Edit ${rec.supplier || rec.caseNo || 'case'}`;
    const btn = document.getElementById('sdSaveBtn');
    if (btn) btn.textContent = 'Update case';
    renderSdLines(rec.lines && rec.lines.length ? rec.lines : [emptySdLine()]);
    document.getElementById('sdCapturePanel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function editSupplierDebt(id) {
    const rec = getSupplierDebtById(id);
    if (!rec) {
        showToast('Case not found.', 'error');
        return;
    }
    fillSupplierDebtForm(rec);
}

function readSupplierDebtForm() {
    const lines = sdReadLinesFromDom().filter((line) =>
        line.invoiceNo || line.poNo || sdLineUsd(line) > 0 || line.supplyDate
    );
    const totalUsd = lines.length
        ? Math.round(lines.reduce((s, l) => s + sdLineUsd(l), 0) * 100) / 100
        : 0;
    const status = document.getElementById('sdStatus')?.value || 'open';
    return {
        id: document.getElementById('sdEditId')?.value || '',
        receivedDate: document.getElementById('sdReceivedDate')?.value || sdToday(),
        accumulatedFrom: document.getElementById('sdAccumulatedFrom')?.value || '',
        minuteRef: (document.getElementById('sdMinuteRef')?.value || '').trim(),
        caseNo: (document.getElementById('sdCaseNo')?.value || '').trim(),
        supplier: (document.getElementById('sdSupplier')?.value || '').trim(),
        costCentre: document.getElementById('sdCostCentre')?.value || 'IT DIR',
        status,
        description: (document.getElementById('sdDescription')?.value || '').trim(),
        actionTo: (document.getElementById('sdActionTo')?.value || '').trim(),
        infoTo: (document.getElementById('sdInfoTo')?.value || '').trim(),
        paidDate: document.getElementById('sdPaidDate')?.value || '',
        dafChasedAt: document.getElementById('sdDafChasedAt')?.value || '',
        dafChasedRef: (document.getElementById('sdDafChasedRef')?.value || '').trim(),
        attachments: (document.getElementById('sdAttachments')?.value || '').trim(),
        notes: (document.getElementById('sdNotes')?.value || '').trim(),
        currency: 'USD',
        totalUsd,
        lines
    };
}

function saveSupplierDebtFromForm() {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return null;
    const data = readSupplierDebtForm();
    if (!data.supplier) {
        showToast('Enter the supplier.', 'error');
        document.getElementById('sdSupplier')?.focus();
        return null;
    }
    if (!data.totalUsd && !(data.lines || []).length) {
        showToast('Add at least one invoice line with a USD amount.', 'error');
        return null;
    }
    if (data.status === 'paid' && !data.paidDate) {
        data.paidDate = sdToday();
    }
    if (!data.accumulatedFrom) {
        data.accumulatedFrom = sdEarliestSupplyDate(data) || data.receivedDate;
    }
    const list = ensureSupplierDebts();
    const now = new Date().toISOString();
    if (data.id) {
        const idx = list.findIndex((r) => r.id === data.id);
        if (idx < 0) {
            showToast('Case not found.', 'error');
            return null;
        }
        list[idx] = {
            ...list[idx],
            ...data,
            caseNo: data.caseNo || list[idx].caseNo || sdNextCaseNo(),
            updatedAt: now
        };
        if (typeof saveState === 'function') saveState();
        showToast('Creditor case updated.', 'success');
        renderSupplierDebtsModule();
        return list[idx];
    }
    const rec = {
        ...data,
        id: sdNewId(),
        caseNo: data.caseNo || sdNextCaseNo(),
        createdAt: now,
        updatedAt: now
    };
    list.push(rec);
    if (typeof saveState === 'function') saveState();
    showToast('Non-paid delivery booked.', 'success');
    fillSupplierDebtForm(rec);
    renderSupplierDebtsModule();
    return rec;
}

function markSupplierDebtPaid(id) {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;
    const rec = getSupplierDebtById(id);
    if (!rec) return;
    rec.status = 'paid';
    rec.paidDate = rec.paidDate || sdToday();
    rec.updatedAt = new Date().toISOString();
    if (typeof saveState === 'function') saveState();
    showToast(`${rec.supplier || 'Supplier'} marked paid.`, 'success');
    renderSupplierDebtsModule();
}

function chaseSupplierDebtDaf(id) {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;
    let rec = id ? getSupplierDebtById(id) : null;
    if (!rec) {
        rec = saveSupplierDebtFromForm();
        if (!rec) return;
    }
    if (!SD_OPEN_STATUSES.has(rec.status) && rec.status !== 'chased_daf') {
        showToast('This case is already closed.', 'warning');
        return;
    }
    rec.status = rec.status === 'part_paid' ? 'part_paid' : 'chased_daf';
    rec.dafChasedAt = rec.dafChasedAt || sdToday();
    rec.dafChasedRef = rec.dafChasedRef || rec.minuteRef || rec.caseNo || '';
    rec.updatedAt = new Date().toISOString();
    if (typeof saveState === 'function') saveState();
    fillSupplierDebtForm(rec);
    renderSupplierDebtsModule();
    window._sdChaseCaseId = rec.id;
    if (typeof generateModuleReport === 'function') {
        generateModuleReport('supplier-debt-chase', { navigate: true, autoPrint: false });
        showToast('DAF chase noted — print the minute from Reports.', 'success');
    } else {
        showToast('DAF chase dated. Print the minute from Reports.', 'info');
    }
}

function getSupplierDebtSummary() {
    const list = ensureSupplierDebts();
    const open = list.filter((r) => SD_OPEN_STATUSES.has(r.status));
    const usd = open.reduce((s, r) => s + sdCaseUsd(r), 0);
    const old = open.filter((r) => sdAgeDays(r) >= 365).length;
    const chased = open.filter((r) => r.status === 'chased_daf' || r.dafChasedAt).length;
    const suppliers = new Set(open.map((r) => (r.supplier || '').trim()).filter(Boolean));
    return {
        openCount: open.length,
        usdOwed: Math.round(usd * 100) / 100,
        yearPlus: old,
        chased,
        suppliers: suppliers.size
    };
}

function rollupSupplierDebts() {
    const map = new Map();
    ensureSupplierDebts().filter((r) => SD_OPEN_STATUSES.has(r.status)).forEach((rec) => {
        const key = (rec.supplier || 'Unknown').trim() || 'Unknown';
        if (!map.has(key)) {
            map.set(key, { supplier: key, cases: 0, usd: 0, oldestDays: 0, lastChase: '' });
        }
        const row = map.get(key);
        row.cases += 1;
        row.usd += sdCaseUsd(rec);
        row.oldestDays = Math.max(row.oldestDays, sdAgeDays(rec));
        const chase = rec.dafChasedAt || '';
        if (chase && (!row.lastChase || chase > row.lastChase)) row.lastChase = chase;
    });
    return Array.from(map.values()).sort((a, b) => b.usd - a.usd || a.supplier.localeCompare(b.supplier));
}

function renderSupplierDebtSummaryStrip(ids = {}) {
    const s = getSupplierDebtSummary();
    const set = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    };
    set(ids.open || 'sdStatOpen', String(s.openCount));
    set(ids.usd || 'sdStatUsd', sdFmtUsd(s.usdOwed));
    set(ids.old || 'sdStatOld', String(s.yearPlus));
    set(ids.chased || 'sdStatChased', String(s.chased));
    set(ids.suppliers || 'sdStatSuppliers', String(s.suppliers));
    return s;
}

function renderSupplierDebtRollup() {
    const body = document.getElementById('sd-supplier-summary-body');
    if (!body) return;
    const rows = rollupSupplierDebts();
    if (!rows.length) {
        body.innerHTML = '<tr><td colspan="5" class="empty-row">No unpaid supplier balances.</td></tr>';
        return;
    }
    body.innerHTML = rows.map((row) => `<tr data-sd-supplier="${sdEscape(row.supplier)}" title="Filter in-tray by this supplier">
        <td>${sdEscape(row.supplier)}</td>
        <td>${row.cases}</td>
        <td>USD ${sdEscape(sdFmtUsd(row.usd))}</td>
        <td>${sdEscape(sdAgeLabel(row.oldestDays))}</td>
        <td>${sdEscape(row.lastChase || '—')}</td>
    </tr>`).join('');
}

function sdMatchesFilters(rec) {
    const statusFilter = document.getElementById('sdFilterStatus')?.value || 'open';
    const ageFilter = document.getElementById('sdFilterAge')?.value || 'all';
    const q = (document.getElementById('sdTableSearch')?.value || '').trim().toLowerCase();
    if (statusFilter === 'open' && !SD_OPEN_STATUSES.has(rec.status)) return false;
    if (statusFilter === 'open_only' && rec.status !== 'open') return false;
    if (statusFilter !== 'all' && statusFilter !== 'open' && statusFilter !== 'open_only' && rec.status !== statusFilter) return false;
    const days = sdAgeDays(rec);
    if (ageFilter === 'y0' && days >= 365) return false;
    if (ageFilter === 'y1' && (days < 365 || days >= 730)) return false;
    if (ageFilter === 'y2' && days < 730) return false;
    if (q) {
        const hay = [
            rec.supplier, rec.caseNo, rec.minuteRef, rec.costCentre, rec.description,
            rec.poNo, rec.notes, rec.attachments,
            ...(rec.lines || []).flatMap((l) => [l.poNo, l.invoiceNo, l.costCentre])
        ].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
    }
    return true;
}

function renderSupplierDebtsTable() {
    const body = document.getElementById('sd-cases-body');
    if (!body) return;
    const rows = ensureSupplierDebts()
        .filter(sdMatchesFilters)
        .slice()
        .sort((a, b) => sdAgeDays(b) - sdAgeDays(a) || String(a.supplier).localeCompare(String(b.supplier)));
    if (!rows.length) {
        body.innerHTML = '<tr><td colspan="8" class="empty-row">No matching non-paid deliveries.</td></tr>';
        return;
    }
    body.innerHTML = rows.map((rec) => {
        const days = sdAgeDays(rec);
        const bucket = sdAgeBucket(days);
        const closed = !SD_OPEN_STATUSES.has(rec.status);
        const ageCss = closed ? 'req-age-closed' : bucket.css;
        const poHint = rec.minuteRef
            || (rec.lines || []).map((l) => l.poNo).filter(Boolean)[0]
            || rec.caseNo
            || '—';
        const chaseBtn = closed
            ? ''
            : `<button type="button" class="btn btn-primary btn-sm" data-sd-action="chase" data-sd-id="${sdEscape(rec.id)}">Chase DAF</button>`;
        const paidBtn = closed
            ? ''
            : `<button type="button" class="btn btn-success btn-sm" data-sd-action="paid" data-sd-id="${sdEscape(rec.id)}">Mark paid</button>`;
        return `<tr class="${ageCss}" data-sd-id="${sdEscape(rec.id)}">
            <td>${sdEscape(rec.receivedDate || '—')}</td>
            <td>${sdEscape(rec.supplier || '—')}</td>
            <td>${sdEscape(poHint)}</td>
            <td>${sdEscape(rec.costCentre || '—')}</td>
            <td>USD ${sdEscape(sdFmtUsd(sdCaseUsd(rec)))}</td>
            <td><span class="req-age-badge ${ageCss}">${sdEscape(sdAgeLabel(days))}</span></td>
            <td>${sdEscape(sdStatusLabel(rec.status))}</td>
            <td class="sd-actions">
                <button type="button" class="btn btn-ghost btn-sm" data-sd-action="edit" data-sd-id="${sdEscape(rec.id)}">Open</button>
                ${chaseBtn}
                ${paidBtn}
            </td>
        </tr>`;
    }).join('');
}

function sdSupplierNormKey(name) {
    return String(name || '')
        .toLowerCase()
        .replace(/\b(pvt\.?\s*ltd|private limited|investments?|enterprises?|enterp|inv\.?|trading|technologies?|tech|distributors?|impressions?)\b/gi, '')
        .replace(/[^a-z0-9]/g, '')
        .trim();
}

function sdSupplierVendorKey(rec) {
    const vendors = (rec?.lines || [])
        .map((line) => String(line.vendor || '').trim())
        .filter((v) => /^\d+$/.test(v));
    if (vendors.length) return `vendor-${vendors[0]}`;
    return `name-${sdSupplierNormKey(rec?.supplier)}`;
}

function sdFindDuplicateSupplierGroups() {
    const open = ensureSupplierDebts().filter((r) => SD_OPEN_STATUSES.has(r.status));
    const byKey = new Map();
    open.forEach((rec) => {
        const key = sdSupplierVendorKey(rec);
        if (!key || key === 'name-') return;
        if (!byKey.has(key)) byKey.set(key, []);
        byKey.get(key).push(rec);
    });
    return Array.from(byKey.values()).filter((group) => {
        if (group.length < 2) return false;
        const names = new Set(group.map((r) => String(r.supplier || '').trim().toLowerCase()));
        return names.size > 1;
    });
}

function sdMergeCreditorCases(keepId, mergeIds) {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return false;
    const keep = getSupplierDebtById(keepId);
    if (!keep) {
        showToast('Keep case not found.', 'error');
        return false;
    }
    const ids = (mergeIds || []).filter((id) => id && id !== keepId);
    if (!ids.length) return false;
    ids.forEach((id) => {
        const rec = getSupplierDebtById(id);
        if (!rec) return;
        keep.lines = [...(keep.lines || []), ...(rec.lines || [])];
        keep.totalUsd = Math.round((keep.lines || []).reduce((s, line) => s + sdLineUsd(line), 0) * 100) / 100;
        keep.accumulatedFrom = sdEarliestSupplyDate(keep);
        keep.notes = [keep.notes, rec.notes].filter(Boolean).join(' · ');
        keep.updatedAt = new Date().toISOString();
        appState.supplierDebts = appState.supplierDebts.filter((row) => row.id !== id);
    });
    if (typeof saveState === 'function') saveState();
    showToast(`Merged ${ids.length} duplicate case(s) into ${keep.supplier || keep.caseNo}.`, 'success');
    renderSupplierDebtsModule();
    if (typeof renderStkDafCreditorsPanel === 'function') renderStkDafCreditorsPanel();
    return true;
}

function sdBuildChasePriorityList(limit = 8) {
    return ensureSupplierDebts()
        .filter((r) => SD_OPEN_STATUSES.has(r.status))
        .map((rec) => ({
            rec,
            age: sdAgeDays(rec),
            usd: sdCaseUsd(rec),
            chased: Boolean(rec.dafChasedAt),
            score: sdCaseUsd(rec) * 0.4 + sdAgeDays(rec) * 0.6 + (rec.dafChasedAt ? -120 : 80)
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
}

function renderSdIntelligencePanel(hostId = 'sdIntelligencePanel') {
    const el = document.getElementById(hostId);
    if (!el) return;

    const priorities = sdBuildChasePriorityList(6);
    const dupes = sdFindDuplicateSupplierGroups();
    const staleChased = ensureSupplierDebts()
        .filter((r) => SD_OPEN_STATUSES.has(r.status) && r.dafChasedAt)
        .filter((r) => {
            const chased = new Date(`${String(r.dafChasedAt).slice(0, 10)}T00:00:00`);
            const now = new Date(`${sdToday()}T00:00:00`);
            return (now - chased) / 86400000 >= 90;
        });

    const priorityHtml = priorities.length
        ? `<ul class="sd-insight-list">${priorities.map(({ rec, age, usd, chased }) => `
            <li>
                <button type="button" class="sd-insight-link" data-sd-priority-id="${sdEscape(rec.id)}">
                    <strong>${sdEscape(rec.supplier || rec.caseNo)}</strong>
                    <span>USD ${sdEscape(sdFmtUsd(usd))} · ${sdEscape(sdAgeLabel(age))}${chased ? ' · chased' : ' · not chased'}</span>
                </button>
            </li>`).join('')}</ul>`
        : '<p class="muted">No open creditor cases.</p>';

    const dupeHtml = dupes.length
        ? `<ul class="sd-insight-list">${dupes.slice(0, 5).map((group) => {
            const keep = group.slice().sort((a, b) => sdCaseUsd(b) - sdCaseUsd(a))[0];
            const names = group.map((r) => r.supplier).join(' / ');
            return `<li class="sd-insight-dupe">
                <span><strong>Possible duplicate:</strong> ${sdEscape(names)}</span>
                <button type="button" class="btn btn-ghost btn-sm" data-sd-merge-keep="${sdEscape(keep.id)}" data-sd-merge-ids="${sdEscape(group.filter((r) => r.id !== keep.id).map((r) => r.id).join(','))}">Merge into ${sdEscape(keep.supplier || keep.caseNo)}</button>
            </li>`;
        }).join('')}</ul>`
        : '<p class="muted">No duplicate supplier names detected.</p>';

    el.innerHTML = `
        <div class="sd-insight-grid">
            <div class="sd-insight-card">
                <h4>Priority DAF chase</h4>
                <p class="muted">Ranked by age, USD owed, and whether DAF was already chased.</p>
                ${priorityHtml}
            </div>
            <div class="sd-insight-card">
                <h4>Smart checks</h4>
                <ul class="sd-insight-stats">
                    <li><span>Duplicate name groups</span><strong>${dupes.length}</strong></li>
                    <li><span>Chased 90+ days, still open</span><strong>${staleChased.length}</strong></li>
                    <li><span>1 year+ unpaid</span><strong>${getSupplierDebtSummary().yearPlus}</strong></li>
                </ul>
                ${dupeHtml}
            </div>
        </div>
    `;

    el.querySelectorAll('[data-sd-priority-id]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-sd-priority-id');
            if (hostId === 'stkDafIntelligencePanel' && typeof navigateToModule === 'function') {
                navigateToModule('supplier-debts', { sdId: id });
                return;
            }
            editSupplierDebt(id);
        });
    });
    el.querySelectorAll('[data-sd-merge-keep]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const keepId = btn.getAttribute('data-sd-merge-keep');
            const mergeIds = (btn.getAttribute('data-sd-merge-ids') || '').split(',').filter(Boolean);
            if (!mergeIds.length) return;
            const ok = confirm(`Merge ${mergeIds.length} duplicate case(s) into the selected supplier record?\n\nInvoice lines will be combined. This cannot be undone automatically.`);
            if (!ok) return;
            sdMergeCreditorCases(keepId, mergeIds);
        });
    });
}

function renderSupplierDebtsModule() {
    ensureSupplierDebts();
    populateSdStatusSelect();
    renderSupplierDebtSummaryStrip();
    renderSdIntelligencePanel();
    renderSupplierDebtRollup();
    renderSupplierDebtsTable();
}

function getSupplierDebtAlerts(options = {}) {
    if (options.skipWatchCovered) return [];
    const alerts = [];
    const open = ensureSupplierDebts()
        .filter((r) => SD_OPEN_STATUSES.has(r.status))
        .map((rec) => ({ rec, age: sdAgeDays(rec), usd: sdCaseUsd(rec) }))
        .sort((a, b) => b.age - a.age);
    open.filter(({ age }) => age >= 365).slice(0, 6).forEach(({ rec, age, usd }) => {
        alerts.push({
            type: age >= 730 ? 'danger' : 'warning',
            target: 'supplier-debts',
            sdId: rec.id,
            text: `Non-paid goods received (${sdAgeLabel(age)}): ${rec.supplier || 'Supplier'} — USD ${sdFmtUsd(usd)}.`
        });
    });
    const unchased = open.filter(({ rec }) => !rec.dafChasedAt && rec.status === 'open');
    if (unchased.length) {
        alerts.push({
            type: 'warning',
            target: 'supplier-debts',
            text: `${unchased.length} unpaid creditor case(s) not yet chased with DAF.`
        });
    }
    const dupes = typeof sdFindDuplicateSupplierGroups === 'function' ? sdFindDuplicateSupplierGroups() : [];
    if (dupes.length) {
        alerts.push({
            type: 'warning',
            target: 'supplier-debts',
            text: `${dupes.length} possible duplicate supplier group(s) in Creditors — review and merge.`
        });
    }
    return alerts;
}

function getOpenSupplierDebtsForWatch() {
    return ensureSupplierDebts()
        .filter((r) => SD_OPEN_STATUSES.has(r.status))
        .map((rec) => ({ rec, age: sdAgeDays(rec), usd: sdCaseUsd(rec), bucket: sdAgeBucket(sdAgeDays(rec)) }))
        .sort((a, b) => b.age - a.age || b.usd - a.usd);
}

function buildSupplierDebtChaseMemoHtml(rec) {
    const head = typeof getOrgLetterhead === 'function'
        ? getOrgLetterhead()
        : { directorate: 'Information Technology Directorate', location: 'Josiah Magama Tongogara Barracks', address: '' };
    const dateDisplay = typeof formatMemoDisplayDate === 'function'
        ? formatMemoDisplayDate(rec.dafChasedAt || sdToday())
        : (rec.dafChasedAt || sdToday());
    const usd = sdFmtUsd(sdCaseUsd(rec));
    const age = sdAgeLabel(sdAgeDays(rec));
    const from = sdEarliestSupplyDate(rec) || rec.receivedDate || '—';
    const lineRows = (rec.lines || []).slice(0, 20).map((line, i) =>
        `<tr>
            <td>${i + 1}</td>
            <td>${sdEscape(line.supplyDate || '')}</td>
            <td>${sdEscape(line.costCentre || rec.costCentre || '')}</td>
            <td>${sdEscape(line.poNo || '')}</td>
            <td>${sdEscape(line.invoiceNo || '')}</td>
            <td>USD ${sdEscape(sdFmtUsd(sdLineUsd(line)))}</td>
        </tr>`
    ).join('');
    const table = lineRows
        ? `<table class="daf-memo-routing-table" style="margin-top:12px;">
            <thead><tr><th>Ser</th><th>Date of supply</th><th>Cost centre</th><th>PO</th><th>Invoice</th><th>USD</th></tr></thead>
            <tbody>${lineRows}</tbody>
          </table>`
        : '';
    const memoEscapeFn = typeof memoEscape === 'function' ? memoEscape : sdEscape;
    return `
<div class="daf-fund-memo-doc official-memo-doc">
  <div class="daf-memo-restricted">RESTRICTED</div>
  <div class="daf-memo-letterhead">
    <div class="daf-memo-org">${memoEscapeFn(head.directorate)}</div>
    <div>${memoEscapeFn(head.location)}</div>
    <div>${memoEscapeFn(head.address)}</div>
  </div>
  <div class="daf-memo-meta">
    <div class="daf-memo-meta-left">
      <div><span class="daf-memo-label">Ref</span> ${memoEscapeFn(rec.dafChasedRef || rec.minuteRef || rec.caseNo || '—')}</div>
    </div>
    <div class="daf-memo-meta-right">
      <div><span class="daf-memo-label">To</span> DAF</div>
      <div><span class="daf-memo-label">Date</span> ${memoEscapeFn(dateDisplay)}</div>
    </div>
  </div>
  <div class="daf-memo-subject"><u>REQUEST FOR SETTLEMENT OF OUTSTANDING CREDITOR — ${memoEscapeFn((rec.supplier || 'SUPPLIER').toUpperCase())} — USD ${memoEscapeFn(usd)}</u></div>
  <div class="daf-memo-body">
    <p>1.&nbsp;&nbsp;IT Dir, as cost centre, records that goods/services have been received from ${memoEscapeFn(rec.supplier || 'the supplier')} but remain unpaid. The outstanding amount is USD ${memoEscapeFn(usd)}. Debt has accumulated from ${memoEscapeFn(from)} (age ${memoEscapeFn(age)}).</p>
    <p>2.&nbsp;&nbsp;${memoEscapeFn(rec.description || 'See invoice / PO register attached.')}</p>
    <p>3.&nbsp;&nbsp;Payment is effected by DAF. This minute is raised so that the outstanding debt can be settled and continuity of supply maintained.</p>
    <p>4.&nbsp;&nbsp;Forwarded for your action.</p>
    ${table}
  </div>
  <div class="daf-memo-enclosure">
    <strong>Enclosure:</strong> ${memoEscapeFn(rec.attachments || 'Reconciled outstanding debt register')}
  </div>
  <div class="daf-memo-distribution">
    <div><strong>Distribution</strong></div>
    <div>Action:&nbsp;&nbsp;DAF</div>
    <div>Information:&nbsp;&nbsp;${memoEscapeFn(rec.infoTo || 'QS Br, IT Dir, File')}</div>
  </div>
  <div class="daf-memo-restricted daf-memo-restricted-foot">RESTRICTED</div>
</div>`;
}

function buildSupplierDebtsReportData() {
    const summary = getSupplierDebtSummary();
    const rows = ensureSupplierDebts().map((rec) => [
        rec.caseNo || '',
        rec.receivedDate || '',
        rec.supplier || '',
        rec.costCentre || '',
        rec.minuteRef || '',
        sdFmtUsd(sdCaseUsd(rec)),
        sdAgeLabel(sdAgeDays(rec)),
        sdStatusLabel(rec.status),
        rec.dafChasedAt || '—'
    ]);
    return {
        title: 'Creditors — Non-paid goods received',
        summary: [
            `Open cases: ${summary.openCount}`,
            `USD owed: ${sdFmtUsd(summary.usdOwed)}`,
            `Cases 1 year+: ${summary.yearPlus}`,
            'DAF effects payment. IT Dir keeps this register to follow up unpaid deliveries.'
        ],
        fields: [
            { label: 'Cost Centre', value: 'Z04P2SP212' },
            { label: 'Directorate', value: 'Information Technology Directorate' }
        ],
        tables: [{
            tbodyId: 'supplier-debts-report',
            title: 'Creditor cases',
            headers: ['Case', 'Date in', 'Supplier', 'Cost centre', 'Ref', 'USD owed', 'Age', 'Status', 'DAF chased'],
            rows
        }]
    };
}

function buildSupplierDebtChaseReportData() {
    const id = window._sdChaseCaseId || document.getElementById('sdEditId')?.value || '';
    const rec = getSupplierDebtById(id) || ensureSupplierDebts().find((r) => SD_OPEN_STATUSES.has(r.status));
    if (!rec) {
        return {
            title: 'DAF chase — creditor',
            summary: ['No creditor case selected.'],
            fields: [],
            tables: []
        };
    }
    return {
        title: `DAF chase — ${rec.supplier || rec.caseNo}`,
        layout: 'daf-fund-memo',
        html: buildSupplierDebtChaseMemoHtml(rec),
        summary: [
            `Supplier: ${rec.supplier || '—'}`,
            `USD owed: ${sdFmtUsd(sdCaseUsd(rec))}`,
            `Age: ${sdAgeLabel(sdAgeDays(rec))}`
        ],
        fields: [],
        tables: []
    };
}

function initSupplierDebtsModule() {
    const moduleEl = document.getElementById('supplier-debts');
    if (!moduleEl || moduleEl.dataset.sdInit === '1') return;
    moduleEl.dataset.sdInit = '1';

    populateSdStatusSelect();
    initSdSupplierCombo('sdTableSearch', 'sdFilterSupplierList', 'sdFilterSupplierToggle', renderSupplierDebtsTable);
    initSdSupplierCombo('sdSupplier', 'sdSupplierPickList', 'sdSupplierToggle');
    if (!document.body.dataset.sdComboDocClose) {
        document.body.dataset.sdComboDocClose = '1';
        document.addEventListener('mousedown', (e) => {
            if (e.target.closest('.sd-combo')) return;
            hideAllSdComboLists();
        });
    }
    if (!document.getElementById('sdEditId')?.value) clearSupplierDebtForm();

    document.getElementById('sdSaveBtn')?.addEventListener('click', () => saveSupplierDebtFromForm());
    document.getElementById('sdClearBtn')?.addEventListener('click', () => {
        if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;
        clearSupplierDebtForm();
    });
    document.getElementById('sdChaseBtn')?.addEventListener('click', () => {
        const id = document.getElementById('sdEditId')?.value || '';
        chaseSupplierDebtDaf(id);
    });
    document.getElementById('sdAddLineBtn')?.addEventListener('click', () => {
        if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;
        addSdLine();
    });

    document.getElementById('sd-lines-body')?.addEventListener('input', (e) => {
        if (!e.target.closest('[data-sd-line]')) return;
        const tr = e.target.closest('tr');
        if (!tr) return;
        const name = e.target.getAttribute('data-sd-line');
        if (name === 'convertedUsd' || name === 'amountUsd') {
            const converted = sdParseNum(tr.querySelector('[data-sd-line="convertedUsd"]')?.value);
            const usd = sdParseNum(tr.querySelector('[data-sd-line="amountUsd"]')?.value);
            const totalEl = tr.querySelector('[data-sd-line="totalUsd"]');
            if (totalEl && (converted + usd > 0)) {
                totalEl.value = String(Math.round((converted + usd) * 100) / 100);
            }
        }
        sdRefreshLineTotals();
    });
    document.getElementById('sd-lines-body')?.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-sd-line-remove]');
        if (!btn) return;
        if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;
        btn.closest('tr')?.remove();
        if (!document.querySelector('#sd-lines-body tr')) addSdLine();
        sdRefreshLineTotals();
    });

    document.getElementById('sdFilterStatus')?.addEventListener('change', renderSupplierDebtsTable);
    document.getElementById('sdFilterAge')?.addEventListener('change', renderSupplierDebtsTable);
    document.getElementById('sdTableSearch')?.addEventListener('search-history-commit', renderSupplierDebtsTable);
    moduleEl.querySelector('.btn-table-search')?.addEventListener('click', renderSupplierDebtsTable);
    moduleEl.querySelector('.btn-table-search-clear')?.addEventListener('click', () => {
        hideAllSdComboLists();
        setTimeout(renderSupplierDebtsTable, 0);
    });
    document.getElementById('sd-supplier-summary-body')?.addEventListener('click', (e) => {
        const tr = e.target.closest('tr[data-sd-supplier]');
        if (!tr) return;
        const input = document.getElementById('sdTableSearch');
        if (input) input.value = tr.getAttribute('data-sd-supplier') || '';
        hideAllSdComboLists();
        renderSupplierDebtsTable();
    });

    document.getElementById('sd-cases-body')?.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-sd-action]');
        if (!btn) return;
        const id = btn.dataset.sdId;
        const action = btn.dataset.sdAction;
        if (action === 'edit') editSupplierDebt(id);
        if (action === 'chase') chaseSupplierDebtDaf(id);
        if (action === 'paid') markSupplierDebtPaid(id);
    });

    updateSdCreditorsPackSummary();
    document.getElementById('sdLoadCreditorsBtn')?.addEventListener('click', () => loadItDirCreditorsRegister());
    if (typeof initSdCreditorsDropZone === 'function') initSdCreditorsDropZone();

    renderSupplierDebtsModule();
}
