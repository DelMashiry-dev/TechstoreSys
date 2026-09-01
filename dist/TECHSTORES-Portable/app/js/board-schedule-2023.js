/* board-schedule-2023.js — IT Dir laptop Board of Survey schedule (ZNA/Q/121)
 * Source: Schedule of Stores Boarded — rows 57–85 (photo of ZNA/Q/121)
 * Convening: Camp/20/3/02/23 (27 Mar 2023) · Request IT/20/1 · Confirmed QS/20/2 (12 Jul 2023)
 */

const BOARD_SCHEDULE_2023_KEY = 'boardSchedule2023';
const BOARD_SCHEDULE_2023_SOURCE = 'board-schedule-2023';

const BOARD_SCHEDULE_2023_META = {
    title: 'Schedule of Stores Boarded — IT Dir laptops (ZNA/Q/121)',
    boardRef: 'Camp/20/3/02/23',
    form1045Ref: 'ZNA/Q/121',
    requestRef: 'IT/20/1',
    confirmationRef: 'QS/20/2',
    boardDate: '2023-03-27',
    confirmedDate: '2023-07-12',
    scheduleRows: '57–85',
    disposalNote: 'Crush / burn / bury per QS/20/2 — EMA notified'
};

/** @type {Array<{serial:number, sectionRef:string, brand:string, holder:string, reason:'BER'|'OBSOLETE'}>} */
const IT_DIR_BOARD_SCHEDULE_2023 = [
    { serial: 57, sectionRef: 'AF33710008NE9114R32392', brand: 'ACER', holder: 'OSD GP 3', reason: 'BER' },
    { serial: 58, sectionRef: 'AF33710008NE914R32392', brand: 'ACER', holder: 'OSD GP 3', reason: 'BER' },
    { serial: 59, sectionRef: 'AF33710008NE914R-4110R4', brand: 'ACER', holder: 'OSD GP 3', reason: 'BER' },
    { serial: 60, sectionRef: 'ZA 287', brand: 'HP', holder: 'OSD GP 3', reason: 'BER' },
    { serial: 61, sectionRef: '18766113-001', brand: 'MICRON', holder: 'OSD GP 3', reason: 'BER' },
    { serial: 62, sectionRef: '18766113-001', brand: 'MICRON', holder: 'BEB GP 3', reason: 'BER' },
    { serial: 63, sectionRef: 'ZA-017', brand: 'HP', holder: 'IT DIR', reason: 'OBSOLETE' },
    { serial: 64, sectionRef: 'ZA 017', brand: 'HP', holder: 'IT DIR', reason: 'OBSOLETE' },
    { serial: 65, sectionRef: 'VMFJIRHFQK', brand: 'HP', holder: 'IT DIR', reason: 'OBSOLETE' },
    { serial: 66, sectionRef: 'ZA 624', brand: 'HP', holder: 'IT DIR', reason: 'OBSOLETE' },
    { serial: 67, sectionRef: '3C893121ZY', brand: 'LENOVO', holder: 'IT DIR', reason: 'OBSOLETE' },
    { serial: 68, sectionRef: 'ZA 584', brand: 'HP', holder: 'IT DIR', reason: 'OBSOLETE' },
    { serial: 69, sectionRef: 'ZA 348', brand: 'HP', holder: 'IT DIR', reason: 'OBSOLETE' },
    { serial: 70, sectionRef: 'ZA 662', brand: 'DELL', holder: 'IT DIR', reason: 'OBSOLETE' },
    { serial: 71, sectionRef: 'QWHB3KH9GY', brand: 'DELL', holder: 'IT DIR', reason: 'OBSOLETE' },
    { serial: 72, sectionRef: 'ZA B43700Q6', brand: 'DELL', holder: 'IT DIR', reason: 'OBSOLETE' },
    { serial: 73, sectionRef: 'ZA 558', brand: 'HP', holder: 'IT DIR', reason: 'OBSOLETE' },
    { serial: 74, sectionRef: '8914CL925145', brand: 'MICRON', holder: 'IT DIR', reason: 'OBSOLETE' },
    { serial: 75, sectionRef: 'ZA 446/99', brand: 'MICRON', holder: 'IT DIR', reason: 'OBSOLETE' },
    { serial: 76, sectionRef: 'ZA 1409', brand: 'HP', holder: 'IT DIR', reason: 'OBSOLETE' },
    { serial: 77, sectionRef: 'ZA 545', brand: 'HP', holder: 'IT DIR', reason: 'OBSOLETE' },
    { serial: 78, sectionRef: 'WZW-315', brand: 'HP', holder: 'IT DIR', reason: 'OBSOLETE' },
    { serial: 79, sectionRef: '0ZC9342XSI', brand: 'DELL', holder: 'IT DIR', reason: 'OBSOLETE' },
    { serial: 80, sectionRef: '43CKYZX', brand: 'DELL', holder: 'IT DIR', reason: 'OBSOLETE' },
    { serial: 81, sectionRef: 'INTRON', brand: 'INTRON', holder: 'IT DIR', reason: 'OBSOLETE' },
    { serial: 82, sectionRef: 'ZA 835', brand: 'HP', holder: 'IT DIR', reason: 'OBSOLETE' },
    { serial: 83, sectionRef: 'ZA 518', brand: 'HP', holder: 'IT DIR', reason: 'OBSOLETE' },
    { serial: 84, sectionRef: 'ZA 577', brand: 'LENOVO', holder: 'IT DIR', reason: 'OBSOLETE' },
    { serial: 85, sectionRef: 'ZA 617', brand: 'HP', holder: 'IT DIR', reason: 'OBSOLETE' }
];

function boardScheduleParseSectionRef(sectionRef) {
    const raw = String(sectionRef || '').trim();
    if (!raw) return { zaNumber: '', serialNo: '', traceRef: '' };
    const zaPlain = raw.match(/^ZA[\s-]?(\d+)$/i);
    if (zaPlain) {
        return { zaNumber: zaPlain[1], serialNo: '', traceRef: raw };
    }
    const zaSlash = raw.match(/^ZA\s*(\d+)\s*\/\s*(.+)$/i);
    if (zaSlash) {
        return { zaNumber: zaSlash[1], serialNo: zaSlash[2].trim(), traceRef: raw };
    }
    if (/^ZA/i.test(raw)) {
        return { zaNumber: '', serialNo: raw, traceRef: raw };
    }
    return { zaNumber: '', serialNo: raw, traceRef: raw };
}

function boardScheduleMapUnit(holder) {
    const h = String(holder || '').trim().toUpperCase();
    if (h === 'IT DIR' || h === 'IT DIRECTORATE') return 'IT Directorate';
    if (h === 'OSD GP 3') return 'OSD GP 3';
    if (h === 'BEB GP 3') return 'BEB GP 3';
    return holder || 'IT Directorate';
}

function boardScheduleUsReason(reason) {
    return String(reason || '').toUpperCase() === 'BER' ? 'beyond_economic' : 'depreciated';
}

function boardScheduleDesignation(brand) {
    const b = String(brand || '').trim();
    if (!b) return 'Laptop (boarded)';
    if (b.toUpperCase() === 'INTRON') return 'Laptop Intron';
    return `Laptop ${b.charAt(0)}${b.slice(1).toLowerCase()}`;
}

function boardScheduleNormalizeZa(value) {
    const raw = String(value || '').trim().toUpperCase().replace(/\s+/g, '');
    if (!raw) return '';
    const m = raw.match(/^ZA-?(\d+)$/i) || raw.match(/^(\d+)$/);
    return m ? `ZA${m[1]}` : '';
}

function boardScheduleUpsertIctRecord(partial, list) {
    const rec = typeof createIctAccountabilityRecord === 'function'
        ? createIctAccountabilityRecord(partial)
        : { ...partial, id: partial.id || `icta-${Date.now()}` };
    const idx = list.findIndex((r) => r.id === rec.id);
    if (idx >= 0) {
        list[idx] = { ...list[idx], ...rec, id: list[idx].id, createdAt: list[idx].createdAt };
        return list[idx];
    }
    list.unshift(rec);
    return rec;
}

function boardScheduleFindExisting(list, parsed, rowSerial) {
    const byId = list.find((r) => r.id === `icta-bs2023-r${rowSerial}`);
    if (byId) return byId;
    const zaNorm = boardScheduleNormalizeZa(parsed.zaNumber);
    if (!zaNorm) return null;
    return list.find((r) =>
        r.source !== BOARD_SCHEDULE_2023_SOURCE
        && boardScheduleNormalizeZa(r.zaNumber) === zaNorm
    ) || null;
}

/** Import boarded laptop schedule into ICT register. Idempotent. */
function applyBoardSchedule2023(opts = {}) {
    if (!appState) return { ok: false, reason: 'no-state' };

    const inv = typeof ensureStoresInventory === 'function'
        ? ensureStoresInventory()
        : (appState.storesInventory = appState.storesInventory || { openings: {}, transactions: [] });
    const ictList = typeof ensureIctAccountability === 'function'
        ? ensureIctAccountability()
        : (appState.ictAccountability = appState.ictAccountability || []);

    const summary = { inserted: 0, updated: 0, rows: IT_DIR_BOARD_SCHEDULE_2023.length };

    IT_DIR_BOARD_SCHEDULE_2023.forEach((row) => {
        const parsed = boardScheduleParseSectionRef(row.sectionRef);
        const unit = boardScheduleMapUnit(row.holder);
        const existing = boardScheduleFindExisting(ictList, parsed, row.serial);
        const recId = existing?.id || `icta-bs2023-r${row.serial}`;
        const remarks = [
            BOARD_SCHEDULE_2023_META.title,
            `Schedule row ${row.serial} (${BOARD_SCHEDULE_2023_META.scheduleRows})`,
            `Request ${BOARD_SCHEDULE_2023_META.requestRef}`,
            `Confirmed ${BOARD_SCHEDULE_2023_META.confirmationRef}`,
            BOARD_SCHEDULE_2023_META.disposalNote
        ].join(' · ');

        boardScheduleUpsertIctRecord({
            id: recId,
            assetClass: 'equipment',
            designation: boardScheduleDesignation(row.brand),
            description: `Board of Survey — ${row.brand} laptop (${row.reason})`,
            zaNumber: parsed.zaNumber,
            serialNo: parsed.serialNo,
            traceRef: parsed.traceRef,
            status: 'condemned',
            engraved: !!parsed.zaNumber,
            holderName: '',
            unit,
            inventoryLedger: 'inv-laptops',
            glCharge: '3112210001',
            usReason: boardScheduleUsReason(row.reason),
            struckOffLedger: 'both',
            boardRef: BOARD_SCHEDULE_2023_META.boardRef,
            form1045Ref: BOARD_SCHEDULE_2023_META.form1045Ref,
            issueDate: '',
            receivedDate: BOARD_SCHEDULE_2023_META.boardDate,
            remarks,
            source: BOARD_SCHEDULE_2023_SOURCE,
            scheduleSerial: row.serial
        }, ictList);

        if (existing) summary.updated += 1;
        else summary.inserted += 1;
    });

    inv[BOARD_SCHEDULE_2023_KEY] = {
        applied: true,
        appliedAt: new Date().toISOString(),
        ...BOARD_SCHEDULE_2023_META,
        ...summary
    };

    if (typeof saveState === 'function') saveState();
    if (typeof renderIctAccountabilityTable === 'function') renderIctAccountabilityTable();
    if (typeof updateDashboard === 'function') updateDashboard();

    return { ok: true, ...summary };
}

window.applyBoardSchedule2023 = applyBoardSchedule2023;
window.IT_DIR_BOARD_SCHEDULE_2023 = IT_DIR_BOARD_SCHEDULE_2023;
window.BOARD_SCHEDULE_2023_META = BOARD_SCHEDULE_2023_META;
