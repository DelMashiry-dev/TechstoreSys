/* ict-accountability.js — ZNA ICT Asset Register
 * Tracks:
 *  - Engraved ICT equipment (ZA numbers) issued to users/units
 *  - Traceable expendables (toners, USB, Ext HDD, tablets, bond paper, etc.)
 *  - Software licences (purchase / issue / expiry & renewal)
 *  - Spares & parts issued out
 */

const ICT_ACC_CLASSES = [
    { value: 'equipment', label: 'ICT Equipment (ZA engraved)' },
    { value: 'expendable', label: 'Expendable / Consumable (traceable)' },
    { value: 'software', label: 'Software Licence' },
    { value: 'spare', label: 'Spare / Part' }
];

const ICT_ACC_STATUSES = [
    // Custody / holding
    { value: 'in_stores', label: 'In stores (MLG / IT Dir)', group: 'Custody', className: 'ict-acc-status-ok' },
    { value: 'issued', label: 'Issued to holding unit', group: 'Custody', className: 'ict-acc-status-issued' },
    { value: 'on_loan', label: 'On temporary loan', group: 'Custody', className: 'ict-acc-status-monitor' },
    { value: 'returned', label: 'Returned', group: 'Custody', className: 'ict-acc-status-ok' },
    // Serviceability (printers / laptops / desktops)
    { value: 'serviceable', label: 'Serviceable (S)', group: 'Serviceability', className: 'ict-acc-status-ok' },
    { value: 'unserviceable', label: 'Unserviceable (U/S)', group: 'Serviceability', className: 'ict-acc-status-warn' },
    // Disposal / strike-off chain (U/S → backload → board)
    { value: 'backloaded', label: 'Backloaded — struck off ledger', group: 'Disposal / strike-off', className: 'ict-acc-status-monitor' },
    { value: 'boarded', label: 'Boarded / surveyed (destruction recommended)', group: 'Disposal / strike-off', className: 'ict-acc-status-warn' },
    { value: 'condemned', label: 'Condemned / for destruction', group: 'Disposal / strike-off', className: 'ict-acc-status-critical' },
    { value: 'stolen', label: 'Stolen (accounted)', group: 'Losses', className: 'ict-acc-status-critical' },
    { value: 'destroyed_natural', label: 'Destroyed by natural causes', group: 'Losses', className: 'ict-acc-status-critical' },
    { value: 'written_off', label: 'Written off (legacy)', group: 'Losses', className: 'ict-acc-status-neutral' },
    // Software
    { value: 'expired', label: 'Licence expired', group: 'Software', className: 'ict-acc-status-critical' }
];

const ICT_ACC_US_REASONS = [
    { value: '', label: '— Select U/S reason —' },
    { value: 'not_working', label: 'No longer working' },
    { value: 'depreciated', label: 'Depreciated / end of useful life' },
    { value: 'beyond_economic', label: 'Beyond economic repair (repair > 40% of value)' },
    { value: 'beyond_local', label: 'Beyond local repair (manufacturer required)' }
];

const ICT_ACC_STRUCK_OFF = [
    { value: '', label: '— Not struck off —' },
    { value: 'unit', label: 'Unit ICT equipment ledger' },
    { value: 'mlg', label: 'MLG Master Ledger (Masasa Logistics Garrison)' },
    { value: 'both', label: 'Both unit ledger and MLG Master Ledger' }
];

const ICT_ACC_CLOSED_STATUSES = new Set([
    'backloaded', 'boarded', 'condemned', 'stolen', 'destroyed_natural', 'written_off'
]);

const ICT_ACC_LOSS_STATUSES = new Set(['stolen', 'destroyed_natural']);
const ICT_ACC_DISPOSAL_STATUSES = new Set([
    'unserviceable', 'backloaded', 'boarded', 'condemned', 'stolen', 'destroyed_natural', 'written_off'
]);

function normalizeIctAccStatus(status) {
    const s = String(status || '').trim();
    if (!s) return 'in_stores';
    if (s === 'written_off') return 'condemned';
    return s;
}

function ictAccEscape(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function ensureIctAccountability() {
    if (!appState.ictAccountability) appState.ictAccountability = [];
    if (!Array.isArray(appState.ictAccountability)) appState.ictAccountability = [];
    return appState.ictAccountability;
}

function ictAccTodayIso() {
    const d = new Date();
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function ictAccParseDate(iso) {
    if (!iso) return null;
    const d = new Date(`${iso}T00:00:00`);
    if (Number.isNaN(d.getTime())) return null;
    d.setHours(0, 0, 0, 0);
    return d;
}

function ictAccDaysUntil(iso) {
    const d = ictAccParseDate(iso);
    if (!d) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.round((d - today) / 86400000);
}

function ictAccFormatDate(iso) {
    if (!iso) return '—';
    const d = ictAccParseDate(iso);
    if (!d) return iso;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getIctAccClassLabel(value) {
    return ICT_ACC_CLASSES.find((c) => c.value === value)?.label || value || '—';
}

/** Always-on licence countdown text (e.g. "312d left", "Expires today", "Overdue 5d"). */
function formatIctAccLicenceDaysLeft(days) {
    if (days == null || Number.isNaN(Number(days))) return '';
    const d = Number(days);
    if (d < 0) return `Overdue ${Math.abs(d)}d`;
    if (d === 0) return 'Expires today';
    return `${d}d left`;
}

function getIctAccDaysLeftClass(days) {
    if (days == null) return 'ict-acc-days-na';
    if (days < 0) return 'ict-acc-days-overdue';
    if (days <= 5) return 'ict-acc-days-overdue';
    if (days <= 30) return 'ict-acc-days-soon';
    if (days <= 90) return 'ict-acc-days-watch';
    return 'ict-acc-days-ok';
}

function getIctAccStatusMeta(rec) {
    const status = normalizeIctAccStatus(rec.status || 'in_stores');
    const base = ICT_ACC_STATUSES.find((s) => s.value === status)
        || ICT_ACC_STATUSES.find((s) => s.value === rec.status)
        || ICT_ACC_STATUSES[0];

    const closed = ICT_ACC_CLOSED_STATUSES.has(status);
    const loss = ICT_ACC_LOSS_STATUSES.has(status);
    const disposal = ICT_ACC_DISPOSAL_STATUSES.has(status);

    if (rec.assetClass === 'software' && rec.expiryDate) {
        const days = ictAccDaysUntil(rec.expiryDate);
        const daysLabel = formatIctAccLicenceDaysLeft(days);
        if (days != null && days < 0) {
            return {
                key: 'expired',
                label: 'Renewal overdue',
                className: 'ict-acc-status-critical',
                days,
                daysLabel,
                closed,
                loss,
                disposal
            };
        }
        if (days != null && days <= 5) {
            return {
                key: 'renew_soon',
                label: days === 0 ? 'Renew today' : `Renew in ${days}d`,
                className: 'ict-acc-status-critical',
                days,
                daysLabel,
                closed,
                loss,
                disposal
            };
        }
        if (days != null && days <= 30) {
            return {
                key: 'renew_soon',
                label: `Renew in ${days}d`,
                className: 'ict-acc-status-warn',
                days,
                daysLabel,
                closed,
                loss,
                disposal
            };
        }
        if (days != null && days <= 90) {
            return {
                key: 'renew_watch',
                label: `Renew in ${days}d`,
                className: 'ict-acc-status-monitor',
                days,
                daysLabel,
                closed,
                loss,
                disposal
            };
        }
        // Full span still visible (e.g. 1-year licence with 300+ days remaining)
        return {
            key: status,
            label: base.label,
            className: base.className || 'ict-acc-status-ok',
            days,
            daysLabel,
            closed,
            loss,
            disposal
        };
    }

    return {
        key: status,
        label: base.label,
        className: base.className || 'ict-acc-status-neutral',
        days: null,
        daysLabel: '',
        closed,
        loss,
        disposal
    };
}

function isIctAccBeyondEconomicRepair(initialValue, repairCost) {
    const initial = Number(initialValue);
    const repair = Number(repairCost);
    if (!(initial > 0) || !(repair >= 0)) return null;
    return repair > (initial * 0.4);
}

function evaluateIctAccRepairRule() {
    const hint = document.getElementById('ictAccRepairRuleHint');
    const reasonEl = document.getElementById('ictAccUsReason');
    const initial = document.getElementById('ictAccInitialValue')?.value;
    const repair = document.getElementById('ictAccRepairCost')?.value;
    const beyond = isIctAccBeyondEconomicRepair(initial, repair);
    if (!hint) return beyond;

    if (beyond == null) {
        hint.hidden = true;
        hint.textContent = '';
        hint.className = 'ict-acc-repair-hint';
        return null;
    }

    hint.hidden = false;
    if (beyond) {
        hint.className = 'ict-acc-repair-hint is-warn';
        hint.textContent = 'Repair exceeds 40% of initial value — treat as beyond economic repair (U/S). Backload, strike off ledger, then board.';
        if (reasonEl && !reasonEl.value) reasonEl.value = 'beyond_economic';
        const statusEl = document.getElementById('ictAccStatus');
        if (statusEl && (statusEl.value === 'serviceable' || statusEl.value === 'issued' || statusEl.value === 'in_stores')) {
            statusEl.value = 'unserviceable';
            toggleIctAccDisposalFields();
        }
    } else {
        hint.className = 'ict-acc-repair-hint is-ok';
        hint.textContent = 'Repair is within 40% of initial value — may remain economically repairable locally.';
    }
    return beyond;
}

function createIctAccountabilityRecord(partial = {}) {
    const status = normalizeIctAccStatus(partial.status || 'in_stores');
    return {
        id: partial.id || `icta-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        assetClass: partial.assetClass || 'equipment',
        designation: String(partial.designation || '').trim(),
        description: String(partial.description || '').trim(),
        zaNumber: normalizeZaNumber(partial.zaNumber),
        traceRef: String(partial.traceRef || '').trim(),
        serialNo: String(partial.serialNo || '').trim(),
        qty: Number(partial.qty) > 0 ? Number(partial.qty) : 1,
        inventoryLedger: partial.inventoryLedger || '',
        glCharge: partial.glCharge || '',
        status,
        engraved: partial.engraved === true || partial.engraved === 'yes' || partial.engraved === '1',
        holderName: String(partial.holderName || '').trim(),
        forceNo: String(partial.forceNo || '').trim(),
        unit: String(partial.unit || '').trim(),
        purchaseDate: partial.purchaseDate || '',
        receivedDate: partial.receivedDate || '',
        issueDate: partial.issueDate || '',
        expiryDate: partial.expiryDate || '',
        renewalNotes: String(partial.renewalNotes || '').trim(),
        form1033Ref: String(partial.form1033Ref || '').trim(),
        form982Ref: String(partial.form982Ref || '').trim(),
        form1045Ref: String(partial.form1045Ref || '').trim(),
        boardRef: String(partial.boardRef || '').trim(),
        usReason: String(partial.usReason || '').trim(),
        initialValue: partial.initialValue === '' || partial.initialValue == null
            ? ''
            : Number(partial.initialValue),
        repairCost: partial.repairCost === '' || partial.repairCost == null
            ? ''
            : Number(partial.repairCost),
        struckOffLedger: String(partial.struckOffLedger || '').trim(),
        remarks: String(partial.remarks || '').trim(),
        createdAt: partial.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
}

function validateIctAccountabilityRecord(rec) {
    if (!rec.designation) return 'Enter the item designation / description.';
    if (rec.assetClass === 'equipment' && !rec.zaNumber) {
        return 'ICT equipment must have a ZA number (engraved accountability mark).';
    }
    if ((rec.status === 'issued' || rec.status === 'on_loan') && !rec.unit && !rec.holderName && rec.assetClass !== 'software') {
        return 'Issued items need a holder name and/or holding unit / formation.';
    }
    if (rec.assetClass === 'software' && !rec.expiryDate && rec.status !== 'in_stores') {
        return 'Software licences should include an expiry / renewal date.';
    }
    if (rec.status === 'unserviceable' && !rec.usReason) {
        return 'Select why the item is Unserviceable (U/S).';
    }
    if ((rec.status === 'backloaded' || rec.status === 'boarded' || rec.status === 'condemned')
        && !rec.struckOffLedger) {
        return 'Record where the item was struck off (Unit ledger and/or MLG Master Ledger).';
    }
    if ((rec.status === 'boarded' || rec.status === 'condemned') && !rec.boardRef && !rec.form1045Ref) {
        return 'Enter ZNA/Q/1045 and/or Board / survey reference for boarded or condemned items.';
    }
    if ((rec.status === 'stolen' || rec.status === 'destroyed_natural') && !rec.remarks) {
        return 'Enter remarks accounting for theft or destruction by natural causes.';
    }
    const beyond = isIctAccBeyondEconomicRepair(rec.initialValue, rec.repairCost);
    if (beyond === true && rec.status === 'serviceable') {
        return 'Repair exceeds 40% of initial value — status cannot remain Serviceable (S). Set Unserviceable (U/S).';
    }
    // ZA is unique across the Asset Register
    const za = normalizeZaNumber(rec.zaNumber);
    if (za) {
        const clash = ensureIctAccountability().find((r) =>
            r.id !== rec.id && normalizeZaNumber(r.zaNumber) === za
        );
        if (clash) {
            return `ZA number ${za} is already assigned to “${clash.designation || 'another item'}”. Each ZA must be unique.`;
        }
    }
    return '';
}

function upsertIctAccountabilityRecord(partial) {
    const list = ensureIctAccountability();
    const rec = createIctAccountabilityRecord(partial);
    const err = validateIctAccountabilityRecord(rec);
    if (err) {
        showToast(err, 'error');
        return null;
    }
    const idx = list.findIndex((r) => r.id === rec.id);
    if (idx >= 0) list[idx] = { ...list[idx], ...rec, id: list[idx].id, createdAt: list[idx].createdAt };
    else list.unshift(rec);
    if (typeof saveState === 'function') saveState();
    return rec;
}

function deleteIctAccountabilityRecord(id) {
    const list = ensureIctAccountability();
    const next = list.filter((r) => r.id !== id);
    appState.ictAccountability = next;
    if (typeof saveState === 'function') saveState();
}

function getIctAccountabilitySnapshot() {
    return ensureIctAccountability().map((rec) => ({
        ...rec,
        statusMeta: getIctAccStatusMeta(rec)
    }));
}

function getIctAccountabilityStats(rows) {
    const list = rows || getIctAccountabilitySnapshot();
    return {
        total: list.length,
        equipment: list.filter((r) => r.assetClass === 'equipment').length,
        expendable: list.filter((r) => r.assetClass === 'expendable').length,
        software: list.filter((r) => r.assetClass === 'software').length,
        spare: list.filter((r) => r.assetClass === 'spare').length,
        issued: list.filter((r) => r.status === 'issued' || r.status === 'on_loan' || r.status === 'serviceable').length,
        unserviceable: list.filter((r) => r.status === 'unserviceable').length,
        backloaded: list.filter((r) => r.status === 'backloaded' || r.status === 'boarded' || r.status === 'condemned').length,
        losses: list.filter((r) => r.status === 'stolen' || r.status === 'destroyed_natural').length,
        renewSoon: list.filter((r) => r.assetClass === 'software' && (r.statusMeta?.key === 'renew_soon' || r.statusMeta?.key === 'renew_watch' || r.statusMeta?.key === 'expired')).length
    };
}

function getSoftwareRenewalAlerts() {
    /** Primary notify window: 5 days before expiry (and overdue). */
    const ALERT_DAYS = 5;
    return getIctAccountabilitySnapshot()
        .filter((r) => r.assetClass === 'software' && r.expiryDate)
        .filter((r) => {
            const d = ictAccDaysUntil(r.expiryDate);
            return d != null && d <= ALERT_DAYS;
        })
        .map((r) => {
            const days = ictAccDaysUntil(r.expiryDate);
            const overdue = days < 0;
            const when = overdue
                ? `expired ${Math.abs(days)}d ago`
                : days === 0
                    ? 'expires today'
                    : `due in ${days}d (alert window ${ALERT_DAYS}d)`;
            return {
                type: 'danger',
                target: 'ict-accountability',
                text: overdue
                    ? `Software renewal OVERDUE: ${r.designation} — ${when} · ${r.unit || r.holderName || 'IT Dir'}`
                    : `Software renewal needed: ${r.designation} — ${when} · ${formatIctAccLicenceDaysLeft(days) || ''} · ${r.holderName || r.unit || 'online licence'}`
            };
        });
}

function normalizeIctAccTrackQuery(value) {
    return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

/** Canonical ZA id: "za 820", "ZA-820", "820" → "ZA820" */
function normalizeZaNumber(value) {
    const raw = String(value || '').trim().toUpperCase().replace(/\s+/g, '');
    if (!raw) return '';
    const m = raw.match(/^ZA-?(\d+)$/i) || raw.match(/^(\d+)$/);
    if (m) return `ZA${m[1]}`;
    if (/^ZA/i.test(raw)) return raw.replace(/^ZA-?/i, 'ZA');
    return raw;
}

function looksLikeZaNumber(value) {
    const t = String(value || '').trim();
    return /^za\s*-?\s*\d+\s*$/i.test(t) || /^\d{2,6}$/.test(t);
}

function getIctAccountabilityByZa(zaRaw) {
    const za = normalizeZaNumber(zaRaw);
    if (!za) return null;
    return ensureIctAccountability().find((r) => normalizeZaNumber(r.zaNumber) === za) || null;
}

function collectUnitEquipmentRowsForZaLookup() {
    const pool = [];
    const seen = new Set();
    const pushRow = (row) => {
        const za = normalizeZaNumber(row.zaNumber);
        const item = String(row.item || '').trim();
        const key = `${za}|${item.toLowerCase()}`;
        if (!za && !item) return;
        if (seen.has(key)) return;
        seen.add(key);
        pool.push({ ...row, zaNumber: za });
    };
    if (typeof collectUnitEquipmentRows === 'function') {
        collectUnitEquipmentRows().forEach(pushRow);
    }
    const saved = appState?.modules?.['unit-equipment']?.tables?.['unit-equipment-table-body'];
    if (Array.isArray(saved)) {
        saved.forEach((rowData, index) => {
            const migrated = typeof migrateUnitEquipmentRowData === 'function'
                ? migrateUnitEquipmentRowData(rowData)
                : rowData;
            const cells = migrated.cells || [];
            pushRow({
                ser: index + 1,
                item: String(cells[0]?.value || '').trim(),
                zaNumber: String(cells[1]?.value || '').trim(),
                description: String(cells[2]?.value || '').trim(),
                holdingUnit: String(cells[3]?.value || '').trim(),
                location: String(cells[4]?.value || '').trim()
            });
        });
    }
    return pool;
}

function collectLoanRowsForZaLookup() {
    const pool = [];
    if (typeof collectTemporaryLoanRows === 'function') {
        collectTemporaryLoanRows().forEach((loan) => pool.push(loan));
    }
    const saved = appState?.modules?.['temporary-loans']?.tables?.['loans-table-body'];
    if (Array.isArray(saved) && !pool.length) {
        saved.forEach((rowData, index) => {
            const cells = rowData.cells || [];
            const zaNumber = String(cells[1]?.value || '').trim();
            if (!zaNumber && !cells[2]?.value) return;
            pool.push({
                rowIndex: index,
                loanDate: String(cells[0]?.value || '').trim(),
                zaNumber,
                item: String(cells[2]?.value || '').trim(),
                description: String(cells[3]?.value || '').trim(),
                qty: String(cells[4]?.value || '').trim(),
                issuedTo: String(cells[6]?.value || '').trim(),
                forceNo: String(cells[7]?.value || '').trim(),
                unit: String(cells[8]?.value || '').trim(),
                expectedReturn: String(cells[9]?.value || '').trim(),
                dateReturned: String(cells[10]?.value || '').trim(),
                status: { label: cells[10]?.value ? 'Returned' : 'On loan', key: cells[10]?.value ? 'returned' : 'on_loan' }
            });
        });
    }
    return pool;
}

/**
 * Full dossier for a ZA number — unique ID lookup across Asset Register,
 * Unit Equipment, and Temporary Loans.
 */
function buildZaDossier(zaRaw) {
    const za = normalizeZaNumber(zaRaw);
    if (!za) {
        return { found: false, za: '', sources: [] };
    }

    const register = getIctAccountabilityByZa(za);
    const unitEquipment = collectUnitEquipmentRowsForZaLookup()
        .filter((r) => normalizeZaNumber(r.zaNumber) === za);
    const loans = collectLoanRowsForZaLookup()
        .filter((r) => normalizeZaNumber(r.zaNumber) === za);
    const activeLoan = loans.find((l) => !l.dateReturned && l.status?.key !== 'returned' && l.status?.key !== 'returned_late')
        || loans.find((l) => !l.dateReturned)
        || null;

    const ue = unitEquipment[0] || null;
    const sources = [];
    if (register) sources.push('Asset Register');
    if (ue) sources.push('Unit Equipment');
    if (loans.length) sources.push('Temporary Loans');

    if (!sources.length) {
        return { found: false, za, sources: [], register: null, unitEquipment: [], loans: [] };
    }

    const unitLabel = (u) => {
        if (!u) return '';
        return typeof resolveZnaUnitLabel === 'function' ? (resolveZnaUnitLabel(u) || u) : u;
    };

    const merged = {
        id: register?.id || `za-dossier-${za}`,
        assetClass: register?.assetClass || 'equipment',
        designation: register?.designation || ue?.item || activeLoan?.item || za,
        description: register?.description || ue?.description || activeLoan?.description || '',
        zaNumber: za,
        serialNo: register?.serialNo || '',
        qty: register?.qty || Number(activeLoan?.qty) || 1,
        status: register?.status || (activeLoan && !activeLoan.dateReturned ? 'on_loan' : (ue?.holdingUnit ? 'issued' : 'in_stores')),
        holderName: register?.holderName || activeLoan?.issuedTo || '',
        forceNo: register?.forceNo || activeLoan?.forceNo || '',
        unit: register?.unit || ue?.holdingUnit || activeLoan?.unit || '',
        purchaseDate: register?.purchaseDate || '',
        receivedDate: register?.receivedDate || '',
        issueDate: register?.issueDate || activeLoan?.loanDate || '',
        expiryDate: register?.expiryDate || '',
        form1033Ref: register?.form1033Ref || '',
        form982Ref: register?.form982Ref || '',
        form1045Ref: register?.form1045Ref || '',
        boardRef: register?.boardRef || '',
        remarks: register?.remarks || (ue?.location ? `IT Dir location: ${ue.location}` : ''),
        renewalNotes: register?.renewalNotes || '',
        glCharge: register?.glCharge || '',
        inventoryLedger: register?.inventoryLedger || '',
        engraved: register ? !!register.engraved : true,
        itDirLocation: ue?.location || '',
        activeLoan,
        onAssetRegister: !!register,
        onUnitEquipment: !!ue
    };

    const sm = getIctAccStatusMeta(merged);
    const where = describeIctAccWhereabouts(merged);

    return {
        found: true,
        za,
        sources,
        register,
        unitEquipment,
        loans,
        activeLoan,
        record: { ...merged, statusMeta: sm },
        where,
        unitLabel: unitLabel(merged.unit),
        daysLabel: sm.daysLabel || '',
        days: sm.days
    };
}

function scoreIctAccTrackMatch(rec, query) {
    const q = normalizeIctAccTrackQuery(query);
    if (!q) return 0;
    const zaNorm = normalizeZaNumber(query);
    const recZa = normalizeZaNumber(rec.zaNumber);
    const za = String(rec.zaNumber || '').trim().toLowerCase();
    const trace = String(rec.traceRef || '').trim().toLowerCase();
    const serial = String(rec.serialNo || '').trim().toLowerCase();
    const serialKey = String(rec.serialNo || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    const qSerialKey = String(query || '').trim().toUpperCase()
        .replace(/^(S\/?N|SERIAL)[\s:.\-]*/i, '')
        .replace(/[^A-Z0-9]/g, '');
    const name = String(rec.designation || '').trim().toLowerCase();
    const desc = String(rec.description || '').trim().toLowerCase();
    const compactQ = q.replace(/\s+/g, '');
    const compactZa = za.replace(/\s+/g, '');

    if (zaNorm && recZa && zaNorm === recZa) return 100;
    if (za && (za === q || compactZa === compactQ)) return 100;
    if (qSerialKey && serialKey && qSerialKey === serialKey) return 100;
    if (za && (za.includes(q) || compactZa.includes(compactQ))) return 90;
    if (trace && (trace === q || trace.includes(q))) return 85;
    if (serial && (serial === q || serial.includes(q) || (qSerialKey && serialKey.includes(qSerialKey)))) return 80;
    if (name === q) return 75;
    if (name.includes(q)) return 70;
    if (desc.includes(q)) return 55;
    if (`${name} ${desc}`.includes(q)) return 50;
    return 0;
}

function trackIctAccountabilityItems(query) {
    const q = String(query || '').trim();
    if (!q) return [];
    return getIctAccountabilitySnapshot()
        .map((rec) => ({ rec, score: scoreIctAccTrackMatch(rec, q) }))
        .filter((row) => row.score > 0)
        .sort((a, b) => b.score - a.score || String(a.rec.designation || '').localeCompare(String(b.rec.designation || '')))
        .map((row) => row.rec);
}

function findUnitEquipmentTrackMatches(query) {
    const q = normalizeIctAccTrackQuery(query);
    if (!q) return [];
    const zaQ = looksLikeZaNumber(query) ? normalizeZaNumber(query) : '';
    return collectUnitEquipmentRowsForZaLookup()
        .map((row) => {
            const za = normalizeZaNumber(row.zaNumber);
            const name = String(row.item || '').trim().toLowerCase();
            const desc = String(row.description || '').trim().toLowerCase();
            let score = 0;
            if (zaQ && za && zaQ === za) score = 100;
            else if (za && za.toLowerCase().includes(q.replace(/\s+/g, ''))) score = 90;
            else if (name === q) score = 75;
            else if (name.includes(q)) score = 70;
            else if (desc.includes(q)) score = 55;
            return { row, score };
        })
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(({ row }) => ({
            id: `ue-track-${normalizeZaNumber(row.zaNumber) || String(row.item || 'item').replace(/\s+/g, '-').toLowerCase()}`,
            assetClass: 'equipment',
            designation: row.item || row.zaNumber || 'Unit equipment',
            description: row.description || '',
            zaNumber: normalizeZaNumber(row.zaNumber),
            unit: row.holdingUnit || row.location || '',
            status: row.holdingUnit ? 'issued' : 'in_stores',
            remarks: row.location ? `IT Dir location: ${row.location}` : '',
            sourceModule: 'unit-equipment',
            unsyncedFromUnitEquipment: true,
            statusMeta: getIctAccStatusMeta({
                assetClass: 'equipment',
                status: row.holdingUnit ? 'issued' : 'in_stores'
            })
        }));
}

function trackAllAccountableItems(query) {
    if (looksLikeZaNumber(query)) {
        const dossier = buildZaDossier(query);
        if (dossier.found) {
            return {
                fromRegister: dossier.register ? [dossier.record] : [],
                fromUe: !dossier.register && dossier.unitEquipment.length ? [dossier.record] : [],
                all: [dossier.record],
                dossier
            };
        }
        return { fromRegister: [], fromUe: [], all: [], dossier };
    }

    const fromRegister = trackIctAccountabilityItems(query);
    const registerZa = new Set(
        fromRegister.map((r) => normalizeZaNumber(r.zaNumber)).filter(Boolean)
    );
    const fromUe = findUnitEquipmentTrackMatches(query).filter((r) => {
        const za = normalizeZaNumber(r.zaNumber);
        if (za && registerZa.has(za)) return false;
        return true;
    });
    return { fromRegister, fromUe, all: fromRegister.concat(fromUe), dossier: null };
}

function describeIctAccWhereabouts(rec) {
    const unitRaw = rec.unit || '';
    const unit = typeof resolveZnaUnitLabel === 'function'
        ? (resolveZnaUnitLabel(unitRaw) || unitRaw)
        : unitRaw;
    const holder = [rec.holderName, rec.forceNo ? `(${rec.forceNo})` : ''].filter(Boolean).join(' ').trim();
    const sm = rec.statusMeta || getIctAccStatusMeta(rec);
    const status = sm.key;

    if (status === 'stolen') {
        return {
            primary: 'Stolen — accounted',
            secondary: rec.remarks || 'Record police / unit investigation remarks',
            status: sm.label,
            tone: 'unknown'
        };
    }
    if (status === 'destroyed_natural') {
        return {
            primary: 'Destroyed by natural causes',
            secondary: rec.remarks || 'Accounted and struck off ledger',
            status: sm.label,
            tone: 'unknown'
        };
    }
    if (status === 'condemned' || status === 'boarded') {
        return {
            primary: status === 'boarded' ? 'Boarded / surveyed' : 'Condemned / for destruction',
            secondary: [
                rec.struckOffLedger === 'mlg' || rec.struckOffLedger === 'both' ? 'MLG Master Ledger' : '',
                rec.struckOffLedger === 'unit' || rec.struckOffLedger === 'both' ? 'Unit ledger struck off' : '',
                rec.boardRef ? `Board ${rec.boardRef}` : '',
                rec.form1045Ref ? `ZNA/Q/1045 ${rec.form1045Ref}` : ''
            ].filter(Boolean).join(' · ') || 'Awaiting destruction authority',
            status: sm.label,
            tone: 'unknown'
        };
    }
    if (status === 'backloaded') {
        return {
            primary: 'Backloaded',
            secondary: [
                rec.struckOffLedger === 'both' ? 'Struck off unit + MLG Master Ledger'
                    : rec.struckOffLedger === 'mlg' ? 'Struck off MLG Master Ledger'
                        : rec.struckOffLedger === 'unit' ? 'Struck off unit ICT ledger'
                            : 'Strike-off ledger to be confirmed',
                unit ? `From ${unit}` : ''
            ].filter(Boolean).join(' · '),
            status: sm.label,
            tone: 'issued'
        };
    }
    if (status === 'unserviceable') {
        const reason = ICT_ACC_US_REASONS.find((r) => r.value === rec.usReason)?.label || 'U/S';
        return {
            primary: unit || holder || 'Holding location not set',
            secondary: `Unserviceable (U/S) — ${reason}. Must be backloaded, struck off ledger, then boarded.`,
            status: sm.label,
            tone: 'unknown'
        };
    }

    const inStores = status === 'in_stores' || status === 'serviceable';
    if (unit && holder) {
        return {
            primary: unit,
            secondary: `Issued to ${holder}${status === 'serviceable' ? ' · Serviceable (S)' : ''}`,
            status: sm.label,
            tone: inStores ? 'stores' : 'issued'
        };
    }
    if (unit) {
        return {
            primary: unit,
            secondary: inStores ? 'Held at unit / MLG (Serviceable path)' : 'Holding unit on record',
            status: sm.label,
            tone: inStores ? 'stores' : 'issued'
        };
    }
    if (holder) {
        return {
            primary: holder,
            secondary: 'Personal holder (no unit selected)',
            status: sm.label,
            tone: 'issued'
        };
    }
    return {
        primary: inStores ? 'MLG / IT Dir stores' : 'Location not recorded',
        secondary: 'Update Holding Unit on the register form',
        status: sm.label,
        tone: inStores ? 'stores' : 'unknown'
    };
}

function renderZaDossierHtml(dossier) {
    const r = dossier.record;
    const sm = r.statusMeta || getIctAccStatusMeta(r);
    const where = dossier.where || describeIctAccWhereabouts(r);
    const loan = dossier.activeLoan;
    const loanUnit = loan?.unit && typeof resolveZnaUnitLabel === 'function'
        ? (resolveZnaUnitLabel(loan.unit) || loan.unit)
        : (loan?.unit || '');
    const holderLine = [r.holderName, r.forceNo ? `(${r.forceNo})` : ''].filter(Boolean).join(' ') || '—';

    return `
        <article class="ict-acc-za-dossier${ !dossier.register ? ' ict-acc-za-dossier--partial' : ''}" data-ict-acc-track-id="${ictAccEscape(r.id)}">
            <div class="ict-acc-za-dossier-hero">
                <div>
                    <div class="ict-acc-za-dossier-kicker">Unique ZA identity</div>
                    <div class="ict-acc-track-za ict-acc-za-dossier-za">${ictAccEscape(dossier.za)}</div>
                    <h4>${ictAccEscape(r.designation || '—')}</h4>
                    <p>${ictAccEscape(r.description || getIctAccClassLabel(r.assetClass))}</p>
                </div>
                <span class="card-status-badge ${sm.className}">${ictAccEscape(sm.label)}</span>
            </div>
            <div class="ict-acc-za-dossier-sources">
                Sources: ${dossier.sources.map((src) => `<span>${ictAccEscape(src)}</span>`).join('')}
            </div>
            <div class="ict-acc-track-where">
                <span class="ict-acc-track-where-label">Current whereabouts</span>
                <strong>${ictAccEscape(where.primary)}</strong>
                <span>${ictAccEscape(where.secondary)}</span>
            </div>
            <div class="ict-acc-track-meta ict-acc-za-dossier-meta">
                <div><span>Item name</span><strong>${ictAccEscape(r.designation || '—')}</strong></div>
                <div><span>Class</span><strong>${ictAccEscape(getIctAccClassLabel(r.assetClass))}</strong></div>
                <div><span>Holding unit</span><strong>${ictAccEscape(dossier.unitLabel || r.unit || '—')}</strong></div>
                <div><span>Issued to</span><strong>${ictAccEscape(holderLine)}</strong></div>
                <div><span>Date of issue</span><strong>${ictAccEscape(ictAccFormatDate(r.issueDate))}</strong></div>
                <div><span>Purchased</span><strong>${ictAccEscape(ictAccFormatDate(r.purchaseDate))}</strong></div>
                <div><span>Received</span><strong>${ictAccEscape(ictAccFormatDate(r.receivedDate))}</strong></div>
                <div><span>S/N</span><strong>${ictAccEscape(r.serialNo || '—')}</strong></div>
                <div><span>Form 1033</span><strong>${ictAccEscape(r.form1033Ref || '—')}</strong></div>
                <div><span>ZNA 982</span><strong>${ictAccEscape(r.form982Ref || '—')}</strong></div>
                <div><span>ZNA/Q/1045</span><strong>${ictAccEscape(r.form1045Ref || '—')}</strong></div>
                <div><span>Qty</span><strong>${ictAccEscape(String(r.qty || 1))}</strong></div>
                ${r.itDirLocation ? `<div><span>IT Dir location</span><strong>${ictAccEscape(r.itDirLocation)}</strong></div>` : ''}
                ${r.expiryDate ? `
                <div><span>Expiry</span><strong>${ictAccEscape(ictAccFormatDate(r.expiryDate))}</strong></div>
                <div><span>Days left</span><strong class="${getIctAccDaysLeftClass(sm.days)}">${ictAccEscape(sm.daysLabel || formatIctAccLicenceDaysLeft(sm.days) || '—')}</strong></div>
                ` : ''}
                ${r.remarks ? `<div class="ict-acc-za-dossier-span"><span>Remarks</span><strong>${ictAccEscape(r.remarks)}</strong></div>` : ''}
            </div>
            ${loan ? `
            <div class="ict-acc-za-dossier-loan">
                <strong>Active temporary loan</strong>
                <span>To ${ictAccEscape(loan.issuedTo || '—')}${loanUnit ? ` · ${ictAccEscape(loanUnit)}` : ''}</span>
                <span>Expected return ${ictAccEscape(ictAccFormatDate(loan.expectedReturn) || '—')} · ${ictAccEscape(loan.status?.label || 'On loan')}</span>
            </div>
            ` : ''}
            <div class="ict-acc-track-actions">
                ${dossier.register
                    ? `<button type="button" class="btn btn-primary btn-sm" data-ict-acc-track-edit="${ictAccEscape(dossier.register.id)}">Open full record</button>
                       <button type="button" class="btn btn-ghost btn-sm" data-ict-acc-track-filter="${ictAccEscape(dossier.register.id)}">Show in table</button>`
                    : `<button type="button" class="btn btn-primary btn-sm" data-ict-acc-track-sync-ue="1">Sync Unit Equipment → Register</button>
                       <button type="button" class="btn btn-ghost btn-sm" data-target-nav="unit-equipment">Open Unit Equipment</button>`}
            </div>
        </article>
    `;
}

function clearIctAccTrackResults() {
    const host = document.getElementById('ictAccTrackResults');
    const input = document.getElementById('ictAccTrackQuery');
    if (input) input.value = '';
    if (host) {
        host.hidden = true;
        host.innerHTML = '';
    }
}

function renderIctAccTrackResults(query) {
    const host = document.getElementById('ictAccTrackResults');
    if (!host) return;

    const q = String(query || document.getElementById('ictAccTrackQuery')?.value || '').trim();
    if (!q) {
        host.hidden = true;
        host.innerHTML = '';
        return;
    }

    const { fromRegister, fromUe, all: matches, dossier } = trackAllAccountableItems(q);
    host.hidden = false;

    if (looksLikeZaNumber(q) && dossier && !dossier.found) {
        const za = dossier.za || normalizeZaNumber(q);
        host.innerHTML = `
            <div class="ict-acc-track-empty">
                <p><strong>${ictAccEscape(za)}</strong> is not registered yet.</p>
                <p class="ict-acc-track-empty-hint">
                    A ZA number is the unique ID for one item. Register it once on
                    <strong>ZNA ICT Asset Register</strong> (or Unit Equipment → Save / Sync).
                    After that, entering <strong>${ictAccEscape(za)}</strong> alone will show the full item profile.
                </p>
            </div>
        `;
        return;
    }

    if (!matches.length) {
        host.innerHTML = `
            <div class="ict-acc-track-empty">
                <p>No match for <strong>${ictAccEscape(q)}</strong>.</p>
                <p class="ict-acc-track-empty-hint">
                    Prefer searching by <strong>ZA number</strong> or <strong>serial number (S/N)</strong>.
                    You can also search by item name. Items must be saved on the Asset Register or Unit Equipment first.
                </p>
            </div>
        `;
        return;
    }

    if (dossier && dossier.found) {
        host.innerHTML = `
            <div class="ict-acc-track-summary">
                ZA lookup · <strong>${ictAccEscape(dossier.za)}</strong> ·
                ${dossier.sources.join(' · ')}
            </div>
            ${renderZaDossierHtml(dossier)}
        `;
        return;
    }

    host.innerHTML = `
        <div class="ict-acc-track-summary">
            Found <strong>${matches.length}</strong> match${matches.length === 1 ? '' : 'es'} for
            <strong>${ictAccEscape(q)}</strong>
            ${fromUe.length && !fromRegister.length
                ? ' · currently in <strong>Unit Equipment</strong> only — sync to keep it on the Asset Register'
                : ''}
        </div>
        <div class="ict-acc-track-cards">
            ${matches.map((r) => {
                const where = describeIctAccWhereabouts(r);
                const sm = r.statusMeta || getIctAccStatusMeta(r);
                const za = r.zaNumber || r.traceRef || '—';
                const unsynced = !!r.unsyncedFromUnitEquipment;
                return `
                    <article class="ict-acc-track-card ict-acc-track-card--${ictAccEscape(where.tone)}${unsynced ? ' ict-acc-track-card--unsynced' : ''}" data-ict-acc-track-id="${ictAccEscape(r.id)}">
                        <div class="ict-acc-track-card-top">
                            <div>
                                <div class="ict-acc-track-za">${ictAccEscape(za)}</div>
                                <h4>${ictAccEscape(r.designation || 'Unnamed item')}</h4>
                                <p>${ictAccEscape(r.description || getIctAccClassLabel(r.assetClass))}</p>
                                ${unsynced ? '<p class="ict-acc-track-unsynced-note">Found in Unit Equipment — not yet on Asset Register</p>' : ''}
                            </div>
                            <span class="card-status-badge ${sm.className}">${ictAccEscape(sm.label)}</span>
                        </div>
                        <div class="ict-acc-track-where">
                            <span class="ict-acc-track-where-label">Current whereabouts</span>
                            <strong>${ictAccEscape(where.primary)}</strong>
                            <span>${ictAccEscape(where.secondary)}</span>
                        </div>
                        <div class="ict-acc-track-meta">
                            <div><span>Issued</span><strong>${ictAccEscape(ictAccFormatDate(r.issueDate))}</strong></div>
                            <div><span>Form 1033</span><strong>${ictAccEscape(r.form1033Ref || '—')}</strong></div>
                            <div><span>S/N</span><strong>${ictAccEscape(r.serialNo || '—')}</strong></div>
                            <div><span>Qty</span><strong>${ictAccEscape(String(r.qty || 1))}</strong></div>
                        </div>
                        <div class="ict-acc-track-actions">
                            ${unsynced
                                ? `<button type="button" class="btn btn-primary btn-sm" data-ict-acc-track-sync-ue="1">Sync Unit Equipment → Register</button>
                                   <button type="button" class="btn btn-ghost btn-sm" data-target-nav="unit-equipment">Open Unit Equipment</button>`
                                : `<button type="button" class="btn btn-primary btn-sm" data-ict-acc-track-edit="${ictAccEscape(r.id)}">Open record</button>
                                   <button type="button" class="btn btn-ghost btn-sm" data-ict-acc-track-filter="${ictAccEscape(r.id)}">Show in table</button>`}
                        </div>
                    </article>
                `;
            }).join('')}
        </div>
    `;
}

function runIctAccTrack() {
    const input = document.getElementById('ictAccTrackQuery');
    const q = String(input?.value || '').trim();
    if (!q) {
        if (typeof showToast === 'function') {
            showToast('Enter a ZA number or serial number to track.', 'error');
        }
        input?.focus();
        return;
    }
    renderIctAccTrackResults(q);

    // Also narrow the register table to the same query for side-by-side tracking
    const itemFilter = document.getElementById('ictAccItemFilter');
    const search = document.getElementById('ictAccSearch');
    const looksLikeZa = looksLikeZaNumber(q) || /^za/i.test(q);
    if (looksLikeZa) {
        const za = normalizeZaNumber(q);
        if (search) search.value = za || q;
        if (itemFilter) itemFilter.value = '';
        if (input && za && input.value !== za) input.value = za;
    } else {
        if (itemFilter) itemFilter.value = q;
        if (search) search.value = '';
    }
    renderIctAccountabilityTable();
}

function getIctAccFilter() {
    return document.getElementById('ictAccFilter')?.value || 'all';
}

function getIctAccSearch() {
    return String(document.getElementById('ictAccSearch')?.value || '').trim().toLowerCase();
}

function getIctAccItemNameFilter() {
    return String(document.getElementById('ictAccItemFilter')?.value || '').trim().toLowerCase();
}

function getIctAccIssueDateRange() {
    const from = String(document.getElementById('ictAccIssueFrom')?.value || '').trim();
    const to = String(document.getElementById('ictAccIssueTo')?.value || '').trim();
    return { from, to };
}

function ictAccMonthBounds(ym) {
    if (!ym || !/^\d{4}-\d{2}$/.test(ym)) return null;
    const [y, m] = ym.split('-').map(Number);
    const lastDay = new Date(y, m, 0).getDate();
    return {
        from: `${ym}-01`,
        to: `${ym}-${String(lastDay).padStart(2, '0')}`
    };
}

function ictAccYearBounds(year) {
    const y = String(year || '').trim();
    if (!/^\d{4}$/.test(y)) return null;
    return { from: `${y}-01-01`, to: `${y}-12-31` };
}

function populateIctAccYearOptions() {
    const sel = document.getElementById('ictAccIssueYear');
    if (!sel || sel.dataset.filled === '1') return;
    const now = new Date().getFullYear();
    const years = [];
    for (let y = now + 1; y >= now - 15; y -= 1) years.push(y);
    sel.innerHTML = ['<option value="">Any year</option>']
        .concat(years.map((y) => `<option value="${y}">${y}</option>`))
        .join('');
    sel.dataset.filled = '1';
}

function applyIctAccMonthPreset() {
    const ym = document.getElementById('ictAccIssueMonth')?.value || '';
    const bounds = ictAccMonthBounds(ym);
    const fromEl = document.getElementById('ictAccIssueFrom');
    const toEl = document.getElementById('ictAccIssueTo');
    const yearEl = document.getElementById('ictAccIssueYear');
    if (!bounds) return;
    if (fromEl) fromEl.value = bounds.from;
    if (toEl) toEl.value = bounds.to;
    if (yearEl) yearEl.value = ym.slice(0, 4);
}

function applyIctAccYearPreset() {
    const year = document.getElementById('ictAccIssueYear')?.value || '';
    const bounds = ictAccYearBounds(year);
    const fromEl = document.getElementById('ictAccIssueFrom');
    const toEl = document.getElementById('ictAccIssueTo');
    const monthEl = document.getElementById('ictAccIssueMonth');
    if (!bounds) {
        if (monthEl && !year) monthEl.value = '';
        return;
    }
    if (fromEl) fromEl.value = bounds.from;
    if (toEl) toEl.value = bounds.to;
    if (monthEl) monthEl.value = '';
}

function clearIctAccFilters() {
    const set = (id, v) => {
        const el = document.getElementById(id);
        if (el) el.value = v;
    };
    set('ictAccItemFilter', '');
    set('ictAccSearch', '');
    set('ictAccFilter', 'all');
    set('ictAccIssueFrom', '');
    set('ictAccIssueTo', '');
    set('ictAccIssueMonth', '');
    set('ictAccIssueYear', '');
    set('ictAccUnitFilterSelect', '');
}

function describeIctAccActiveFilters() {
    const parts = [];
    const item = getIctAccItemNameFilter();
    const { from, to } = getIctAccIssueDateRange();
    const filter = getIctAccFilter();
    const unit = document.getElementById('ictAccUnitFilterSelect')?.value || '';
    const q = getIctAccSearch();
    if (item) parts.push(`item “${item}”`);
    if (unit) {
        const label = typeof resolveZnaUnitLabel === 'function' ? resolveZnaUnitLabel(unit) : unit;
        parts.push(`unit ${label}`);
    }
    if (from || to) {
        if (from && to) parts.push(`issued ${from} → ${to}`);
        else if (from) parts.push(`issued from ${from}`);
        else parts.push(`issued up to ${to}`);
    }
    if (filter && filter !== 'all') parts.push(`class: ${filter}`);
    if (q) parts.push(`search “${q}”`);
    return parts;
}

function updateIctAccFilterHint(matchCount, totalCount) {
    const hint = document.getElementById('ictAccFilterHint');
    if (!hint) return;
    const parts = describeIctAccActiveFilters();
    if (!parts.length) {
        hint.hidden = true;
        hint.textContent = '';
        return;
    }
    hint.hidden = false;
    hint.textContent = `Showing ${matchCount} of ${totalCount} · Filtered by ${parts.join(' · ')}`;
}

function getIctAccUnitFilter() {
    return String(document.getElementById('ictAccUnitFilterSelect')?.value || '').trim().toLowerCase();
}

function populateIctAccUnitFilterSelect() {
    const sel = document.getElementById('ictAccUnitFilterSelect');
    if (!sel) return;
    const keep = sel.value;
    if (typeof buildZnaUnitOptionsHtml === 'function') {
        sel.innerHTML = buildZnaUnitOptionsHtml(keep, {
            includeBlank: true,
            blankLabel: 'Any unit',
            includeOther: false
        });
    }
}

function filterIctAccountabilityRows(rows) {
    const filter = getIctAccFilter();
    const q = getIctAccSearch();
    const itemQ = getIctAccItemNameFilter();
    const unitQ = getIctAccUnitFilter();
    const { from: issueFrom, to: issueTo } = getIctAccIssueDateRange();

    return rows.filter((r) => {
        if (filter === 'equipment' && r.assetClass !== 'equipment') return false;
        if (filter === 'expendable' && r.assetClass !== 'expendable') return false;
        if (filter === 'software' && r.assetClass !== 'software') return false;
        if (filter === 'spare' && r.assetClass !== 'spare') return false;
        if (filter === 'issued' && !(r.status === 'issued' || r.status === 'on_loan' || r.status === 'serviceable')) return false;
        if (filter === 'serviceable' && r.status !== 'serviceable') return false;
        if (filter === 'unserviceable' && r.status !== 'unserviceable') return false;
        if (filter === 'backloaded' && !(r.status === 'backloaded' || r.status === 'boarded' || r.status === 'condemned')) return false;
        if (filter === 'losses' && !(r.status === 'stolen' || r.status === 'destroyed_natural')) return false;
        if (filter === 'renewals') {
            if (r.assetClass !== 'software') return false;
            const d = ictAccDaysUntil(r.expiryDate);
            if (d == null || d > 90) return false;
        }

        if (itemQ) {
            const nameBlob = `${r.designation || ''} ${r.description || ''}`.toLowerCase();
            if (!nameBlob.includes(itemQ)) return false;
        }

        if (unitQ) {
            const unitVal = String(r.unit || '').trim().toLowerCase();
            if (unitVal !== unitQ) return false;
        }

        if (issueFrom || issueTo) {
            const issueDate = String(r.issueDate || '').trim();
            if (!issueDate) return false;
            if (issueFrom && issueDate < issueFrom) return false;
            if (issueTo && issueDate > issueTo) return false;
        }

        if (!q) return true;
        const blob = [
            r.designation, r.description, r.zaNumber, r.traceRef, r.serialNo,
            r.holderName, r.forceNo, r.unit, r.form1033Ref, r.remarks
        ].join(' ').toLowerCase();
        return blob.includes(q);
    });
}

function buildIctAccClassOptions(selected) {
    return ICT_ACC_CLASSES.map((c) => (
        `<option value="${c.value}"${c.value === selected ? ' selected' : ''}>${ictAccEscape(c.label)}</option>`
    )).join('');
}

function buildIctAccStatusOptions(selected) {
    const current = normalizeIctAccStatus(selected || 'in_stores');
    const groups = [];
    ICT_ACC_STATUSES.forEach((s) => {
        const g = s.group || 'Other';
        if (!groups.includes(g)) groups.push(g);
    });
    return groups.map((group) => {
        const opts = ICT_ACC_STATUSES
            .filter((s) => (s.group || 'Other') === group)
            .map((s) => (
                `<option value="${s.value}"${s.value === current || s.value === selected ? ' selected' : ''}>${ictAccEscape(s.label)}</option>`
            ))
            .join('');
        return `<optgroup label="${ictAccEscape(group)}">${opts}</optgroup>`;
    }).join('');
}

function buildIctAccUsReasonOptions(selected) {
    return ICT_ACC_US_REASONS.map((r) => (
        `<option value="${r.value}"${r.value === (selected || '') ? ' selected' : ''}>${ictAccEscape(r.label)}</option>`
    )).join('');
}

function buildIctAccStruckOffOptions(selected) {
    return ICT_ACC_STRUCK_OFF.map((r) => (
        `<option value="${r.value}"${r.value === (selected || '') ? ' selected' : ''}>${ictAccEscape(r.label)}</option>`
    )).join('');
}

function buildIctAccLedgerOptions(selected) {
    const ledgers = typeof getAllInventoryLedgers === 'function' ? getAllInventoryLedgers() : [];
    const opts = ['<option value="">— Select inventory ledger —</option>'];
    ledgers.forEach((l) => {
        opts.push(`<option value="${ictAccEscape(l.key)}"${l.key === selected ? ' selected' : ''}>${ictAccEscape(l.fullLabel || l.label)}</option>`);
    });
    return opts.join('');
}

function buildIctAccGlOptions(selected) {
    if (typeof buildGlOptionsHtml === 'function') return buildGlOptionsHtml(selected || '6122100009');
    return Object.entries(GL_ACCOUNTS || {}).map(([code, info]) => (
        `<option value="${code}"${code === selected ? ' selected' : ''}>${code} - ${ictAccEscape(info.name)}</option>`
    )).join('');
}

function renderIctAccountabilityStats(rows) {
    const stats = getIctAccountabilityStats(rows);
    const set = (id, v) => {
        const el = document.getElementById(id);
        if (el) el.textContent = String(v);
    };
    set('ictAccStatTotal', stats.total);
    set('ictAccStatEquipment', stats.equipment);
    set('ictAccStatExpendable', stats.expendable);
    set('ictAccStatSoftware', stats.software);
    set('ictAccStatIssued', stats.issued);
    set('ictAccStatUnserviceable', stats.unserviceable);
    set('ictAccStatBackloaded', stats.backloaded);
    set('ictAccStatLosses', stats.losses);
    set('ictAccStatRenewals', stats.renewSoon);
}

function renderIctAccountabilityTable() {
    const tbody = document.getElementById('ictAccountabilityBody');
    if (!tbody) return;

    const all = getIctAccountabilitySnapshot();
    renderIctAccountabilityStats(all);
    const rows = filterIctAccountabilityRows(all);
    updateIctAccFilterHint(rows.length, all.length);

    if (!rows.length) {
        tbody.innerHTML = `<tr><td colspan="9" class="req-empty-row">${
            all.length
                ? 'No records match these filters. Try clearing item name or issue-date filters.'
                : 'No accountability records yet. Register engraved ICT equipment, traceable expendables, software licences, or spares.'
        }</td></tr>`;
        return;
    }

    tbody.innerHTML = rows.map((r) => {
        const sm = r.statusMeta || getIctAccStatusMeta(r);
        const zaNumber = r.zaNumber
            ? `<strong class="ict-acc-za">${ictAccEscape(r.zaNumber)}</strong>`
            : (r.traceRef ? `<span class="ict-acc-trace">${ictAccEscape(r.traceRef)}</span>` : '—');
        const holdingUnitRaw = r.unit || '';
        const holdingUnit = typeof resolveZnaUnitLabel === 'function'
            ? (resolveZnaUnitLabel(holdingUnitRaw) || '—')
            : (holdingUnitRaw || '—');
        const holderBits = [holdingUnit];
        if (r.holderName) holderBits.push(r.holderName);
        if (r.forceNo) holderBits.push(`(${r.forceNo})`);
        const daysText = sm.daysLabel
            || (r.assetClass === 'software' && r.expiryDate
                ? formatIctAccLicenceDaysLeft(ictAccDaysUntil(r.expiryDate))
                : '');
        const daysCell = daysText
            ? `<span class="ict-acc-days-badge ${getIctAccDaysLeftClass(sm.days)}" title="${ictAccEscape(r.expiryDate ? `Expires ${ictAccFormatDate(r.expiryDate)}` : '')}">${ictAccEscape(daysText)}</span>`
            : '<span class="ict-acc-days-na">—</span>';
        return `
            <tr data-ict-acc-id="${ictAccEscape(r.id)}">
                <td>${zaNumber}</td>
                <td><strong>${ictAccEscape(r.designation || '—')}</strong></td>
                <td>${ictAccEscape(ictAccFormatDate(r.issueDate))}</td>
                <td>${ictAccEscape(r.description || '—')}</td>
                <td>${ictAccEscape(holderBits.filter(Boolean).join(' · ') || '—')}</td>
                <td><span class="card-status-badge ${sm.className}">${ictAccEscape(sm.label)}</span></td>
                <td class="ict-acc-days-cell">${daysCell}</td>
                <td class="ict-acc-remarks">${ictAccEscape(r.remarks || r.renewalNotes || '—')}</td>
                <td class="ict-acc-actions">
                    <button type="button" class="btn btn-ghost btn-sm" data-ict-acc-edit="${ictAccEscape(r.id)}">Edit</button>
                    <button type="button" class="btn btn-danger btn-sm" data-ict-acc-del="${ictAccEscape(r.id)}">Delete</button>
                </td>
            </tr>
        `;
    }).join('');
}

function clearIctAccForm() {
    const set = (id, v) => {
        const el = document.getElementById(id);
        if (el) el.value = v;
    };
    set('ictAccRecordId', '');
    set('ictAccClass', 'equipment');
    set('ictAccDesignation', '');
    set('ictAccDescription', '');
    set('ictAccZa', '');
    set('ictAccTrace', '');
    set('ictAccSerial', '');
    set('ictAccQty', '1');
    set('ictAccLedger', '');
    set('ictAccGl', '6122100009');
    set('ictAccStatus', 'serviceable');
    set('ictAccEngraved', 'yes');
    set('ictAccHolder', '');
    set('ictAccForce', '');
    if (typeof fillZnaUnitSelect === 'function') {
        fillZnaUnitSelect(document.getElementById('ictAccUnit'), '', { includeBlank: true, includeOther: true });
        const unitFilter = document.getElementById('ictAccUnitFilter');
        if (unitFilter) unitFilter.value = '';
    } else {
        set('ictAccUnit', '');
    }
    set('ictAccPurchase', '');
    set('ictAccReceived', '');
    set('ictAccIssue', '');
    set('ictAccExpiry', '');
    set('ictAcc1033', '');
    set('ictAcc982', '');
    set('ictAcc1045', '');
    set('ictAccBoardRef', '');
    set('ictAccUsReason', '');
    set('ictAccInitialValue', '');
    set('ictAccRepairCost', '');
    set('ictAccStruckOff', '');
    set('ictAccRenewalNotes', '');
    set('ictAccRemarks', '');
    const title = document.getElementById('ictAccFormTitle');
    if (title) title.textContent = 'Register / update accountable item';
    toggleIctAccSoftwareFields();
    toggleIctAccDisposalFields();
    evaluateIctAccRepairRule();
}

function fillIctAccForm(rec) {
    const set = (id, v) => {
        const el = document.getElementById(id);
        if (el) el.value = v ?? '';
    };
    set('ictAccRecordId', rec.id);
    set('ictAccClass', rec.assetClass || 'equipment');
    set('ictAccDesignation', rec.designation);
    set('ictAccDescription', rec.description);
    set('ictAccZa', rec.zaNumber);
    set('ictAccTrace', rec.traceRef);
    set('ictAccSerial', rec.serialNo);
    set('ictAccQty', String(rec.qty || 1));
    set('ictAccLedger', rec.inventoryLedger || '');
    set('ictAccGl', rec.glCharge || '6122100009');
    set('ictAccStatus', normalizeIctAccStatus(rec.status || 'serviceable'));
    set('ictAccEngraved', rec.engraved ? 'yes' : 'no');
    set('ictAccHolder', rec.holderName);
    set('ictAccForce', rec.forceNo);
    if (typeof fillZnaUnitSelect === 'function') {
        fillZnaUnitSelect(document.getElementById('ictAccUnit'), rec.unit || '', { includeBlank: true, includeOther: true });
        const unitFilter = document.getElementById('ictAccUnitFilter');
        if (unitFilter) unitFilter.value = '';
    } else {
        set('ictAccUnit', rec.unit);
    }
    set('ictAccPurchase', rec.purchaseDate);
    set('ictAccReceived', rec.receivedDate);
    set('ictAccIssue', rec.issueDate);
    set('ictAccExpiry', rec.expiryDate);
    set('ictAcc1033', rec.form1033Ref);
    set('ictAcc982', rec.form982Ref || '');
    set('ictAcc1045', rec.form1045Ref || '');
    set('ictAccBoardRef', rec.boardRef || '');
    set('ictAccUsReason', rec.usReason || '');
    set('ictAccInitialValue', rec.initialValue === '' || rec.initialValue == null ? '' : String(rec.initialValue));
    set('ictAccRepairCost', rec.repairCost === '' || rec.repairCost == null ? '' : String(rec.repairCost));
    set('ictAccStruckOff', rec.struckOffLedger || '');
    set('ictAccRenewalNotes', rec.renewalNotes);
    set('ictAccRemarks', rec.remarks);
    const title = document.getElementById('ictAccFormTitle');
    if (title) title.textContent = `Editing: ${rec.designation || rec.zaNumber || rec.id}`;
    toggleIctAccSoftwareFields();
    toggleIctAccDisposalFields();
    evaluateIctAccRepairRule();
    document.getElementById('ictAccDesignation')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function readIctAccForm() {
    const val = (id) => document.getElementById(id)?.value || '';
    return {
        id: val('ictAccRecordId') || undefined,
        assetClass: val('ictAccClass') || 'equipment',
        designation: val('ictAccDesignation'),
        description: val('ictAccDescription'),
        zaNumber: val('ictAccZa'),
        traceRef: val('ictAccTrace'),
        serialNo: val('ictAccSerial'),
        qty: val('ictAccQty'),
        inventoryLedger: val('ictAccLedger'),
        glCharge: val('ictAccGl'),
        status: val('ictAccStatus'),
        engraved: val('ictAccEngraved') === 'yes',
        holderName: val('ictAccHolder'),
        forceNo: val('ictAccForce'),
        unit: val('ictAccUnit'),
        purchaseDate: val('ictAccPurchase'),
        receivedDate: val('ictAccReceived'),
        issueDate: val('ictAccIssue'),
        expiryDate: val('ictAccExpiry'),
        form1033Ref: val('ictAcc1033'),
        form982Ref: val('ictAcc982'),
        form1045Ref: val('ictAcc1045'),
        boardRef: val('ictAccBoardRef'),
        usReason: val('ictAccUsReason'),
        initialValue: val('ictAccInitialValue'),
        repairCost: val('ictAccRepairCost'),
        struckOffLedger: val('ictAccStruckOff'),
        renewalNotes: val('ictAccRenewalNotes'),
        remarks: val('ictAccRemarks')
    };
}

function toggleIctAccSoftwareFields() {
    const cls = document.getElementById('ictAccClass')?.value || 'equipment';
    const soft = cls === 'software';
    const equip = cls === 'equipment';
    document.querySelectorAll('[data-ict-acc-soft-only]').forEach((el) => {
        el.hidden = !soft;
    });
    document.querySelectorAll('[data-ict-acc-equip-only]').forEach((el) => {
        el.hidden = !equip;
    });
    document.querySelectorAll('[data-ict-acc-equip-hint]').forEach((el) => {
        el.hidden = !equip;
    });
    const engraved = document.getElementById('ictAccEngraved');
    if (engraved && equip) engraved.value = 'yes';
    if (engraved && soft) engraved.value = 'no';

    const gl = document.getElementById('ictAccGl');
    if (gl && !gl.dataset.userTouched) {
        if (cls === 'software') gl.value = '2200600003';
        else if (cls === 'spare') gl.value = '2201900002';
        else if (cls === 'equipment') gl.value = '3112210001';
        else gl.value = '6122100009';
    }
    toggleIctAccDisposalFields();
    updateIctAccDaysLeftHint();
}

function updateIctAccDaysLeftHint() {
    const hint = document.getElementById('ictAccDaysLeftHint');
    if (!hint) return;
    const soft = document.getElementById('ictAccClass')?.value === 'software';
    const expiry = document.getElementById('ictAccExpiry')?.value || '';
    if (!soft || !expiry) {
        hint.textContent = '';
        hint.className = 'ict-acc-days-hint';
        return;
    }
    const days = ictAccDaysUntil(expiry);
    const label = formatIctAccLicenceDaysLeft(days);
    hint.textContent = label ? `${label} · expires ${ictAccFormatDate(expiry)}` : '';
    hint.className = `ict-acc-days-hint ${getIctAccDaysLeftClass(days)}`;
}

/**
 * When a ZA is entered on the register form, load everything known about that unique ID.
 */
function lookupIctAccZaField() {
    const zaEl = document.getElementById('ictAccZa');
    const hint = document.getElementById('ictAccZaHint');
    if (!zaEl) return;
    const raw = String(zaEl.value || '').trim();
    if (!raw) {
        if (hint) {
            hint.textContent = '';
            hint.className = 'ict-acc-za-hint';
        }
        return;
    }
    const za = normalizeZaNumber(raw);
    if (za && zaEl.value !== za) zaEl.value = za;

    const dossier = buildZaDossier(za);
    if (!dossier.found) {
        if (hint) {
            hint.textContent = `${za} — new ZA (not registered yet). Complete the fields and Save.`;
            hint.className = 'ict-acc-za-hint is-new';
        }
        return;
    }

    const currentId = document.getElementById('ictAccRecordId')?.value || '';
    if (dossier.register && dossier.register.id !== currentId) {
        fillIctAccForm(dossier.register);
        if (hint) {
            hint.textContent = `${za} found — full record loaded (unique ID).`;
            hint.className = 'ict-acc-za-hint is-found';
        }
        if (typeof showToast === 'function') {
            showToast(`Loaded ${za}: ${dossier.record.designation}`, 'success');
        }
        return;
    }

    // Prefill empty fields from Unit Equipment / loans when starting a new register line
    if (!dossier.register && !currentId) {
        const r = dossier.record;
        const setIfEmpty = (id, value) => {
            const el = document.getElementById(id);
            if (!el || el.value) return;
            if (value != null && value !== '') el.value = value;
        };
        setIfEmpty('ictAccDesignation', r.designation);
        setIfEmpty('ictAccDescription', r.description);
        setIfEmpty('ictAccHolder', r.holderName);
        setIfEmpty('ictAccForce', r.forceNo);
        if (r.unit && typeof fillZnaUnitSelect === 'function') {
            const unitEl = document.getElementById('ictAccUnit');
            if (unitEl && !unitEl.value) {
                fillZnaUnitSelect(unitEl, r.unit, { includeBlank: true, includeOther: true });
            }
        }
        if (hint) {
            hint.textContent = `${za} found in ${dossier.sources.join(' · ')} — details filled. Save to Asset Register.`;
            hint.className = 'ict-acc-za-hint is-found';
        }
        return;
    }

    if (hint) {
        hint.textContent = `${za} — unique ID on this record.`;
        hint.className = 'ict-acc-za-hint is-ok';
    }
}

function toggleIctAccDisposalFields() {
    const status = normalizeIctAccStatus(document.getElementById('ictAccStatus')?.value || '');
    const cls = document.getElementById('ictAccClass')?.value || 'equipment';
    const showDisposal = cls === 'equipment' && ICT_ACC_DISPOSAL_STATUSES.has(status);
    document.querySelectorAll('[data-ict-acc-disposal-row]').forEach((el) => {
        el.hidden = !showDisposal;
    });
    const usReason = document.getElementById('ictAccUsReason');
    if (usReason) {
        usReason.disabled = !(status === 'unserviceable' || status === 'backloaded' || status === 'boarded' || status === 'condemned');
    }
}

function saveIctAccFromForm() {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;
    const rec = upsertIctAccountabilityRecord(readIctAccForm());
    if (!rec) return;
    showToast(`Accountability record saved: ${rec.designation}${rec.zaNumber ? ` (${rec.zaNumber})` : ''}.`);
    clearIctAccForm();
    renderIctAccountabilityTable();
    if (typeof updateSystemAlerts === 'function') updateSystemAlerts();
}

function openIctAccountabilityModule() {
    if (typeof navigateToModule === 'function') navigateToModule('ict-accountability');
    setTimeout(() => renderIctAccountabilityTable(), 50);
}

function initIctAccountabilityModule() {
    const host = document.getElementById('ict-accountability');
    if (!host || host.dataset.inited === '1') {
        renderIctAccountabilityTable();
        return;
    }
    host.dataset.inited = '1';

    const classEl = document.getElementById('ictAccClass');
    const statusEl = document.getElementById('ictAccStatus');
    const ledgerEl = document.getElementById('ictAccLedger');
    const glEl = document.getElementById('ictAccGl');
    if (classEl) classEl.innerHTML = buildIctAccClassOptions('equipment');
    if (statusEl) statusEl.innerHTML = buildIctAccStatusOptions('serviceable');
    if (ledgerEl) ledgerEl.innerHTML = buildIctAccLedgerOptions('');
    if (glEl) glEl.innerHTML = buildIctAccGlOptions('6122100009');

    const usReasonEl = document.getElementById('ictAccUsReason');
    const struckEl = document.getElementById('ictAccStruckOff');
    if (usReasonEl) usReasonEl.innerHTML = buildIctAccUsReasonOptions('');
    if (struckEl) struckEl.innerHTML = buildIctAccStruckOffOptions('');

    if (typeof wireZnaUnitPicker === 'function') {
        wireZnaUnitPicker(
            document.getElementById('ictAccUnit'),
            document.getElementById('ictAccUnitFilter'),
            { includeBlank: true, includeOther: true }
        );
    }
    populateIctAccUnitFilterSelect();
    document.getElementById('ictAccUnitFilterSelect')?.addEventListener('change', renderIctAccountabilityTable);

    document.getElementById('ictAccStatus')?.addEventListener('change', () => {
        toggleIctAccDisposalFields();
        evaluateIctAccRepairRule();
    });
    document.getElementById('ictAccInitialValue')?.addEventListener('input', evaluateIctAccRepairRule);
    document.getElementById('ictAccRepairCost')?.addEventListener('input', evaluateIctAccRepairRule);

    document.getElementById('ictAccTrackBtn')?.addEventListener('click', runIctAccTrack);
    document.getElementById('ictAccTrackClear')?.addEventListener('click', () => {
        clearIctAccTrackResults();
        clearIctAccFilters();
        renderIctAccountabilityTable();
    });
    document.getElementById('ictAccTrackQuery')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            runIctAccTrack();
        }
    });
    document.getElementById('ictAccTrackResults')?.addEventListener('click', (e) => {
        if (e.target.closest('[data-ict-acc-track-sync-ue]')) {
            e.preventDefault();
            if (typeof syncUnitEquipmentToAssetRegister === 'function') {
                syncUnitEquipmentToAssetRegister({ quiet: false });
                runIctAccTrack();
                renderIctAccountabilityTable();
            } else if (typeof showToast === 'function') {
                showToast('Open Unit Equipment and click Sync to Asset Register.', 'info');
            }
            return;
        }
        const navTarget = e.target.closest('[data-target-nav]')?.getAttribute('data-target-nav');
        if (navTarget && typeof navigateToModule === 'function') {
            e.preventDefault();
            navigateToModule(navTarget);
            return;
        }
        const editId = e.target.closest('[data-ict-acc-track-edit]')?.getAttribute('data-ict-acc-track-edit');
        const filterId = e.target.closest('[data-ict-acc-track-filter]')?.getAttribute('data-ict-acc-track-filter');
        const id = editId || filterId;
        if (!id) return;
        const rec = ensureIctAccountability().find((r) => r.id === id);
        if (!rec) return;
        if (editId) {
            fillIctAccForm(rec);
            document.getElementById('ictAccDesignation')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }
        const search = document.getElementById('ictAccSearch');
        if (search) search.value = rec.zaNumber || rec.designation || '';
        const itemFilter = document.getElementById('ictAccItemFilter');
        if (itemFilter) itemFilter.value = '';
        renderIctAccountabilityTable();
        document.getElementById('ictAccountabilityBody')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    document.getElementById('ictAccSaveBtn')?.addEventListener('click', saveIctAccFromForm);
    document.getElementById('ictAccClearBtn')?.addEventListener('click', clearIctAccForm);
    document.getElementById('ictAccClass')?.addEventListener('change', toggleIctAccSoftwareFields);
    document.getElementById('ictAccExpiry')?.addEventListener('change', updateIctAccDaysLeftHint);
    document.getElementById('ictAccExpiry')?.addEventListener('input', updateIctAccDaysLeftHint);
    document.getElementById('ictAccZa')?.addEventListener('blur', lookupIctAccZaField);
    document.getElementById('ictAccZa')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            lookupIctAccZaField();
        }
    });
    document.getElementById('ictAccGl')?.addEventListener('change', () => {
        const el = document.getElementById('ictAccGl');
        if (el) el.dataset.userTouched = '1';
    });
    populateIctAccYearOptions();

    document.getElementById('ictAccFilter')?.addEventListener('change', renderIctAccountabilityTable);
    document.getElementById('ictAccItemFilter')?.addEventListener('input', renderIctAccountabilityTable);
    document.getElementById('ictAccSearch')?.addEventListener('input', renderIctAccountabilityTable);
    document.getElementById('ictAccIssueFrom')?.addEventListener('change', () => {
        const monthEl = document.getElementById('ictAccIssueMonth');
        if (monthEl) monthEl.value = '';
        renderIctAccountabilityTable();
    });
    document.getElementById('ictAccIssueTo')?.addEventListener('change', () => {
        const monthEl = document.getElementById('ictAccIssueMonth');
        if (monthEl) monthEl.value = '';
        renderIctAccountabilityTable();
    });
    document.getElementById('ictAccIssueMonth')?.addEventListener('change', () => {
        applyIctAccMonthPreset();
        renderIctAccountabilityTable();
    });
    document.getElementById('ictAccIssueYear')?.addEventListener('change', () => {
        applyIctAccYearPreset();
        renderIctAccountabilityTable();
    });
    document.getElementById('ictAccSearchBtn')?.addEventListener('click', renderIctAccountabilityTable);
    document.getElementById('ictAccSearchClear')?.addEventListener('click', () => {
        clearIctAccFilters();
        renderIctAccountabilityTable();
    });

    document.getElementById('ictAccountabilityBody')?.addEventListener('click', (e) => {
        const editId = e.target.closest('[data-ict-acc-edit]')?.getAttribute('data-ict-acc-edit');
        const delId = e.target.closest('[data-ict-acc-del]')?.getAttribute('data-ict-acc-del');
        if (editId) {
            const rec = ensureIctAccountability().find((r) => r.id === editId);
            if (rec) fillIctAccForm(rec);
            return;
        }
        if (delId) {
            if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;
            if (!confirm('Delete this accountability record?')) return;
            deleteIctAccountabilityRecord(delId);
            renderIctAccountabilityTable();
            showToast('Accountability record deleted.', 'info');
            if (typeof updateSystemAlerts === 'function') updateSystemAlerts();
        }
    });

    document.querySelectorAll('[data-ict-acc-stat-filter]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const filter = btn.getAttribute('data-ict-acc-stat-filter');
            const sel = document.getElementById('ictAccFilter');
            if (sel && filter) sel.value = filter;
            renderIctAccountabilityTable();
        });
    });

    clearIctAccForm();
    renderIctAccountabilityTable();
}
