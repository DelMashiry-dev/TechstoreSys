/* workshop-receipt-cert.js — IT Dir Workshop assessment before MLG engraving / stores receipt */

const WRC_STATUSES = [
    { value: 'awaiting_assessment', label: 'Awaiting workshop assessment' },
    { value: 'certified', label: 'Certified — meets spec' },
    { value: 'rejected', label: 'Rejected — spec fail' },
    { value: 'at_mlg', label: 'At MLG (engraving)' },
    { value: 'engraved_complete', label: 'Engraved / received' }
];

const WRC_GROUPS = ['GROUP 1', 'GROUP 2', 'GROUP 3', 'VSD', 'RSD'];
const WRC_TRADES = ['EME', 'Ord', 'Tpt', 'HS', 'IT', 'Sigs', 'PR'];
const WRC_LINE_LABELS = 'abcdefghijkl'.split('');

function wrcEscape(v) {
    return String(v ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function ensureWorkshopReceiptCerts() {
    if (!appState) return [];
    if (!Array.isArray(appState.workshopReceiptCerts)) {
        appState.workshopReceiptCerts = [];
    }
    return appState.workshopReceiptCerts;
}

function normalizeWrcMatchKey(value) {
    return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function findWorkshopReceiptCert(criteria = {}) {
    const id = criteria.id || criteria.wrcId;
    if (id) {
        const byId = ensureWorkshopReceiptCerts().find((r) => r.id === id);
        if (byId) return byId;
    }
    const sourceRef = criteria.sourceRef;
    if (sourceRef) {
        const bySrc = ensureWorkshopReceiptCerts().find((r) => r.sourceRef === sourceRef);
        if (bySrc) return bySrc;
    }
    const po = normalizeWrcMatchKey(criteria.poNo || criteria.poNumber);
    const dn = normalizeWrcMatchKey(criteria.dnRef || criteria.deliveryNoteRef);
    const supplier = normalizeWrcMatchKey(criteria.supplier || criteria.party);
    if (!po && !dn) return null;
    return ensureWorkshopReceiptCerts().find((r) => {
        const rPo = normalizeWrcMatchKey(r.poNo);
        const rDn = normalizeWrcMatchKey(r.dnRef);
        const rSup = normalizeWrcMatchKey(r.supplier);
        if (dn && rDn && dn === rDn) return true;
        if (po && rPo && po === rPo) {
            if (!supplier || !rSup || supplier === rSup) return true;
        }
        return false;
    }) || null;
}

function categoryRequiresWorkshopCert(category, itemName) {
    if (category === 'ict-equipment') return true;
    const n = String(itemName || '').toLowerCase();
    return /\b(laptop|notebook|macbook|desktop|workstation|printer|projector|tablet|server|switch|router|access point|omnibook|elitebook|thinkpad|latitude|imac|aio|pc|monitor)\b/.test(n);
}

function procurementRequiresWorkshopCert(rec) {
    if (!rec) return false;
    if (typeof getProcurementStockLines === 'function') {
        const lines = getProcurementStockLines(rec);
        if (lines.some((l) => categoryRequiresWorkshopCert(l.category, l.itemName || l.designation))) return true;
    }
    return categoryRequiresWorkshopCert('', rec.itemSummary || '');
}

function validateWorkshopCertForIctReceipt(payload) {
    if (payload.type !== 'receipt') return '';
    if (payload.wrcBypass || payload.laptopReturn) return '';
    if (payload.source === 'workshop-receipt-cert') return '';
    if (/\b(return|returned)\b/i.test(`${payload.description || ''}`)) return '';

    const category = payload.category || '';
    const item = payload.item || '';
    if (!categoryRequiresWorkshopCert(category, item)) return '';

    const cert = findWorkshopReceiptCert({
        id: payload.wrcId,
        poNo: payload.poNumber,
        dnRef: payload.deliveryNoteRef,
        supplier: payload.party
    });

    if (!cert) {
        return 'ICT equipment receipt blocked: register the delivery on Workshop Receipt Certification first (IT Dir Workshop spec check before MLG).';
    }
    if (cert.status === 'rejected') {
        return `Workshop certification rejected (${cert.inspectionSerial}). Cannot receive into stock.`;
    }
    if (cert.status === 'awaiting_assessment') {
        return `Workshop assessment pending (${cert.inspectionSerial}). Certify spec before stores receipt.`;
    }
    if (cert.status === 'certified' || cert.status === 'at_mlg') {
        return `MLG engraving not complete (${cert.inspectionSerial}). Supplier must present cert + PO + D-Note at MLG; record ZA return before stores receipt.`;
    }
    if (cert.status !== 'engraved_complete') {
        return `Workshop / MLG clearance incomplete (${cert.inspectionSerial}).`;
    }
    return '';
}

function validateWorkshopCertForDeliveryVerified(rec) {
    if (!procurementRequiresWorkshopCert(rec)) return '';
    const cert = findWorkshopReceiptCert({
        poNo: rec.poNumber,
        dnRef: rec.deliveryNoteRef,
        supplier: rec.awardedSupplier
    });
    if (!cert) {
        return 'ICT procurement: create Workshop Receipt Certification when goods arrive (before delivery verified).';
    }
    if (cert.status === 'rejected') {
        return `Workshop rejected this delivery (${cert.inspectionSerial}).`;
    }
    if (cert.status === 'awaiting_assessment') {
        return `Workshop assessment pending (${cert.inspectionSerial}). Certify before marking delivery verified.`;
    }
    return '';
}

function getWrcStatusLabel(status) {
    return WRC_STATUSES.find((s) => s.value === status)?.label || status || '—';
}

function nextWrcInspectionSerial() {
    const year = new Date().getFullYear();
    const prefix = `WRC-${year}-`;
    let max = 0;
    ensureWorkshopReceiptCerts().forEach((r) => {
        const m = String(r.inspectionSerial || '').match(/WRC-\d{4}-(\d+)/i);
        if (m) max = Math.max(max, parseInt(m[1], 10));
    });
    return `${prefix}${String(max + 1).padStart(3, '0')}`;
}

function createWorkshopReceiptCert(partial = {}) {
    const now = new Date().toISOString();
    const lines = Array.isArray(partial.lines) && partial.lines.length
        ? partial.lines
        : [{ label: 'a', designation: partial.itemSummary || '', qty: partial.qty || 1, serialNo: '', specMatch: true }];
    return {
        id: partial.id || `wrc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        inspectionSerial: partial.inspectionSerial || nextWrcInspectionSerial(),
        status: partial.status || 'awaiting_assessment',
        deliveryDate: partial.deliveryDate || '',
        supplier: String(partial.supplier || '').trim(),
        poNo: String(partial.poNo || '').trim(),
        dnRef: String(partial.dnRef || '').trim(),
        itemSummary: String(partial.itemSummary || '').trim(),
        qty: Number(partial.qty) > 0 ? Number(partial.qty) : 1,
        group: partial.group || 'GROUP 3',
        officer: {
            forceNo: String(partial.officer?.forceNo || '').trim(),
            rank: String(partial.officer?.rank || '').trim(),
            name: String(partial.officer?.name || '').trim(),
            unit: String(partial.officer?.unit || 'IT Directorate').trim()
        },
        trade: partial.trade || 'IT',
        expertise: String(partial.expertise || 'ICT equipment / computers').trim(),
        lines,
        remarks: String(partial.remarks || '').trim(),
        certDate: partial.certDate || '',
        source: partial.source || 'manual',
        sourceRef: partial.sourceRef || '',
        mlg: {
            sentDate: partial.mlg?.sentDate || '',
            returnedDate: partial.mlg?.returnedDate || '',
            zaNumbers: Array.isArray(partial.mlg?.zaNumbers) ? partial.mlg.zaNumbers : []
        },
        ictAssetIds: Array.isArray(partial.ictAssetIds) ? partial.ictAssetIds : [],
        history: Array.isArray(partial.history) ? partial.history.slice() : [],
        createdAt: partial.createdAt || now,
        updatedAt: now
    };
}

function wrcPushHistory(rec, note) {
    rec.history = rec.history || [];
    rec.history.push({ at: new Date().toISOString(), note: String(note || '').trim() });
}

function readWrcLinesFromForm() {
    const body = document.getElementById('wrcLinesBody');
    if (!body) return [];
    return [...body.querySelectorAll('tr')].map((tr, idx) => ({
        label: WRC_LINE_LABELS[idx] || String(idx + 1),
        designation: tr.querySelector('.wrc-line-designation')?.value?.trim() || '',
        qty: Number(tr.querySelector('.wrc-line-qty')?.value) || 1,
        serialNo: tr.querySelector('.wrc-line-serial')?.value?.trim() || '',
        specMatch: tr.querySelector('.wrc-line-spec')?.checked !== false
    })).filter((l) => l.designation);
}

function buildWrcLineRow(line = {}, idx = 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td>${wrcEscape(WRC_LINE_LABELS[idx] || idx + 1)}.</td>
        <td><input type="text" class="form-control wrc-line-designation" value="${wrcEscape(line.designation || '')}"></td>
        <td><input type="number" class="form-control wrc-line-qty" min="1" step="1" value="${wrcEscape(line.qty || 1)}"></td>
        <td><input type="text" class="form-control wrc-line-serial" value="${wrcEscape(line.serialNo || '')}"></td>
        <td class="wrc-spec-cell"><input type="checkbox" class="wrc-line-spec"${line.specMatch !== false ? ' checked' : ''}></td>
        <td class="wrc-screen-only"><button type="button" class="btn btn-danger btn-sm wrc-remove-line">Remove</button></td>`;
    tr.querySelector('.wrc-remove-line')?.addEventListener('click', () => tr.remove());
    return tr;
}

function renderWrcLines(lines) {
    const body = document.getElementById('wrcLinesBody');
    if (!body) return;
    body.innerHTML = '';
    const list = (lines && lines.length) ? lines : [{ designation: '', qty: 1, serialNo: '', specMatch: true }];
    list.forEach((line, idx) => body.appendChild(buildWrcLineRow(line, idx)));
}

function clearWrcForm() {
    const today = typeof todayIsoLocal === 'function' ? todayIsoLocal() : new Date().toISOString().slice(0, 10);
    document.getElementById('wrcEditId').value = '';
    document.getElementById('wrcFormTitle').textContent = 'Capture delivery for workshop assessment';
    document.getElementById('wrcInspectionSerial').value = '';
    document.getElementById('wrcDeliveryDate').value = today;
    document.getElementById('wrcSupplier').value = '';
    document.getElementById('wrcPoNo').value = '';
    document.getElementById('wrcDnRef').value = '';
    document.getElementById('wrcItemSummary').value = '';
    document.getElementById('wrcQty').value = '1';
    document.getElementById('wrcGroup').value = 'GROUP 3';
    document.getElementById('wrcOfficerNo').value = '';
    document.getElementById('wrcOfficerRank').value = '';
    document.getElementById('wrcOfficerName').value = '';
    if (typeof setZnaUnitField === 'function') {
        setZnaUnitField('wrcOfficerUnit', 'IT Dir');
    } else {
        document.getElementById('wrcOfficerUnit').value = 'IT Directorate';
    }
    document.getElementById('wrcTrade').value = 'IT';
    document.getElementById('wrcExpertise').value = 'ICT equipment / computers';
    document.getElementById('wrcRemarks').value = '';
    document.getElementById('wrcCertDate').value = '';
    document.getElementById('wrcPrintBtn').disabled = true;
    renderWrcLines([{ designation: '', qty: 1, serialNo: '', specMatch: true }]);
}

function readWrcForm(statusOverride) {
    const id = document.getElementById('wrcEditId')?.value?.trim();
    const existing = id ? ensureWorkshopReceiptCerts().find((r) => r.id === id) : null;
    const lines = readWrcLinesFromForm();
    const itemSummary = document.getElementById('wrcItemSummary')?.value?.trim()
        || lines.map((l) => l.designation).filter(Boolean).join('; ');
    return createWorkshopReceiptCert({
        ...(existing || {}),
        id: id || undefined,
        inspectionSerial: document.getElementById('wrcInspectionSerial')?.value?.trim() || undefined,
        status: statusOverride || existing?.status || 'awaiting_assessment',
        deliveryDate: document.getElementById('wrcDeliveryDate')?.value || '',
        supplier: document.getElementById('wrcSupplier')?.value || '',
        poNo: document.getElementById('wrcPoNo')?.value || '',
        dnRef: document.getElementById('wrcDnRef')?.value || '',
        itemSummary,
        qty: document.getElementById('wrcQty')?.value || 1,
        group: document.getElementById('wrcGroup')?.value || 'GROUP 3',
        officer: {
            forceNo: document.getElementById('wrcOfficerNo')?.value || '',
            rank: document.getElementById('wrcOfficerRank')?.value || '',
            name: document.getElementById('wrcOfficerName')?.value || '',
            unit: document.getElementById('wrcOfficerUnit')?.value || 'IT Directorate'
        },
        trade: document.getElementById('wrcTrade')?.value || 'IT',
        expertise: document.getElementById('wrcExpertise')?.value || '',
        lines,
        remarks: document.getElementById('wrcRemarks')?.value || '',
        certDate: document.getElementById('wrcCertDate')?.value || '',
        source: existing?.source || 'manual',
        sourceRef: existing?.sourceRef || '',
        mlg: existing?.mlg || {},
        ictAssetIds: existing?.ictAssetIds || [],
        history: existing?.history || [],
        createdAt: existing?.createdAt
    });
}

function upsertWorkshopReceiptCert(rec) {
    const list = ensureWorkshopReceiptCerts();
    const idx = list.findIndex((r) => r.id === rec.id);
    rec.updatedAt = new Date().toISOString();
    if (idx >= 0) list[idx] = rec;
    else list.unshift(rec);
    if (typeof saveState === 'function') saveState();
    return rec;
}

function saveWrcDraft() {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;
    const rec = readWrcForm();
    if (!rec.supplier || !rec.poNo) {
        showToast('Enter supplier and purchase order number.', 'warning');
        return;
    }
    if (!rec.inspectionSerial) rec.inspectionSerial = nextWrcInspectionSerial();
    wrcPushHistory(rec, 'Draft saved');
    upsertWorkshopReceiptCert(rec);
    document.getElementById('wrcEditId').value = rec.id;
    document.getElementById('wrcInspectionSerial').value = rec.inspectionSerial;
    showToast('Workshop receipt certification saved.');
    renderWorkshopReceiptCertModule();
}

function certifyWrcFromForm() {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;
    const rec = readWrcForm('certified');
    if (!rec.supplier || !rec.poNo) {
        showToast('Enter supplier and PO before certifying.', 'warning');
        return;
    }
    if (!rec.lines.length) {
        showToast('Add at least one goods line inspected.', 'warning');
        return;
    }
    if (!rec.officer.name || !rec.officer.rank) {
        showToast('Enter certifying officer rank and name.', 'warning');
        return;
    }
    if (rec.lines.some((l) => !l.specMatch)) {
        showToast('All lines must pass spec check to certify. Use Reject or amend lines.', 'warning');
        return;
    }
    rec.certDate = rec.certDate || (typeof todayIsoLocal === 'function' ? todayIsoLocal() : new Date().toISOString().slice(0, 10));
    document.getElementById('wrcCertDate').value = rec.certDate;
    wrcPushHistory(rec, 'Certified — meets specification and quality');
    upsertWorkshopReceiptCert(rec);
    document.getElementById('wrcEditId').value = rec.id;
    document.getElementById('wrcPrintBtn').disabled = false;
    showToast('Certified. Supplier may proceed to MLG with PO + D-Note + this certificate.');
    renderWorkshopReceiptCertModule();
}

function sendWrcToMlg(id) {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;
    const rec = ensureWorkshopReceiptCerts().find((r) => r.id === id);
    if (!rec || rec.status !== 'certified') return;
    rec.status = 'at_mlg';
    rec.mlg = rec.mlg || {};
    rec.mlg.sentDate = typeof todayIsoLocal === 'function' ? todayIsoLocal() : new Date().toISOString().slice(0, 10);
    wrcPushHistory(rec, 'Handed to supplier for MLG engraving (with PO + D-Note)');
    upsertWorkshopReceiptCert(rec);
    showToast('Marked at MLG — awaiting ZA engraving return.');
    renderWorkshopReceiptCertModule();
}

function rejectWrc(id) {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;
    const reason = window.prompt('Reason for rejection (spec / quality):', '');
    if (reason == null) return;
    const rec = ensureWorkshopReceiptCerts().find((r) => r.id === id);
    if (!rec) return;
    rec.status = 'rejected';
    rec.remarks = [rec.remarks, reason].filter(Boolean).join(' · ');
    wrcPushHistory(rec, `Rejected — ${reason}`);
    upsertWorkshopReceiptCert(rec);
    showToast('Delivery marked rejected.');
    renderWorkshopReceiptCertModule();
}

function completeWrcMlgEngraving(id) {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;
    const rec = ensureWorkshopReceiptCerts().find((r) => r.id === id);
    if (!rec) return;
    const zaRaw = window.prompt(
        'Enter ZA number(s) returned from MLG (comma-separated if multiple):',
        (rec.mlg?.zaNumbers || []).join(', ')
    );
    if (zaRaw == null) return;
    const zaList = zaRaw.split(/[,;\s]+/).map((z) => z.replace(/^ZA[\s-]?/i, '').trim()).filter(Boolean);
    if (!zaList.length) {
        showToast('Enter at least one ZA number.', 'warning');
        return;
    }
    rec.mlg = rec.mlg || {};
    rec.mlg.zaNumbers = zaList;
    rec.mlg.returnedDate = typeof todayIsoLocal === 'function' ? todayIsoLocal() : new Date().toISOString().slice(0, 10);
    rec.status = 'engraved_complete';
    rec.ictAssetIds = rec.ictAssetIds || [];

    if (typeof ensureIctAccountability === 'function' && typeof upsertIctAccountabilityRecord === 'function') {
        rec.lines.forEach((line, idx) => {
            const za = zaList[idx] || zaList[0];
            const assetId = `icta-wrc-${rec.id}-${idx}`;
            const saved = upsertIctAccountabilityRecord({
                id: assetId,
                assetClass: 'equipment',
                designation: line.designation || rec.itemSummary || 'ICT equipment',
                zaNumber: za,
                serialNo: line.serialNo || '',
                status: 'in_stores',
                engraved: true,
                unit: 'IT Directorate',
                inventoryLedger: 'inv-laptops',
                glCharge: '3112210001',
                receivedDate: rec.mlg.returnedDate,
                remarks: `Workshop cert ${rec.inspectionSerial} · PO ${rec.poNo} · D-Note ${rec.dnRef || '—'} · MLG engraved`
            });
            if (saved?.id) rec.ictAssetIds.push(saved.id);
        });
    }

    wrcPushHistory(rec, `MLG engraving complete — ZA ${zaList.join(', ')}`);
    upsertWorkshopReceiptCert(rec);
    showToast('MLG engraving recorded. ICT Asset Register updated.');
    renderWorkshopReceiptCertModule();
}

function fillWrcForm(rec) {
    document.getElementById('wrcEditId').value = rec.id;
    document.getElementById('wrcFormTitle').textContent = `Edit — ${rec.inspectionSerial}`;
    document.getElementById('wrcInspectionSerial').value = rec.inspectionSerial || '';
    document.getElementById('wrcDeliveryDate').value = rec.deliveryDate || '';
    document.getElementById('wrcSupplier').value = rec.supplier || '';
    document.getElementById('wrcPoNo').value = rec.poNo || '';
    document.getElementById('wrcDnRef').value = rec.dnRef || '';
    document.getElementById('wrcItemSummary').value = rec.itemSummary || '';
    document.getElementById('wrcQty').value = rec.qty || 1;
    document.getElementById('wrcGroup').value = rec.group || 'GROUP 3';
    document.getElementById('wrcOfficerNo').value = rec.officer?.forceNo || '';
    document.getElementById('wrcOfficerRank').value = rec.officer?.rank || '';
    document.getElementById('wrcOfficerName').value = rec.officer?.name || '';
    if (typeof setZnaUnitField === 'function') {
        setZnaUnitField('wrcOfficerUnit', rec.officer?.unit || 'IT Dir');
    } else {
        document.getElementById('wrcOfficerUnit').value = rec.officer?.unit || 'IT Directorate';
    }
    document.getElementById('wrcTrade').value = rec.trade || 'IT';
    document.getElementById('wrcExpertise').value = rec.expertise || '';
    document.getElementById('wrcRemarks').value = rec.remarks || '';
    document.getElementById('wrcCertDate').value = rec.certDate || '';
    document.getElementById('wrcPrintBtn').disabled = !['certified', 'at_mlg', 'engraved_complete'].includes(rec.status);
    renderWrcLines(rec.lines || []);
    document.getElementById('workshop-receipt-cert')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function createWrcFromUndelivered(undId) {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return null;
    const row = ensureUndelivered?.().find((r) => r.id === undId);
    if (!row) return null;
    const rec = createWorkshopReceiptCert({
        supplier: row.supplier,
        poNo: row.poNo,
        itemSummary: row.item,
        qty: row.qtyDelivered || row.qty || 1,
        deliveryDate: typeof todayIsoLocal === 'function' ? todayIsoLocal() : new Date().toISOString().slice(0, 10),
        source: 'undelivered',
        sourceRef: row.id,
        lines: [{ designation: row.item, qty: row.qtyDelivered || row.qty || 1, serialNo: '', specMatch: true }]
    });
    upsertWorkshopReceiptCert(rec);
    fillWrcForm(rec);
    if (typeof openModule === 'function') openModule('workshop-receipt-cert');
    showToast(`Workshop assessment opened for ${row.item}.`);
    return rec;
}

function createWrcFromDpProcurement(dpId) {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return null;
    const rec = typeof ensureDpProcurements === 'function'
        ? ensureDpProcurements().find((r) => r.id === dpId)
        : null;
    if (!rec) return null;
    const existing = findWorkshopReceiptCert({ sourceRef: rec.id })
        || findWorkshopReceiptCert({ poNo: rec.poNumber, dnRef: rec.deliveryNoteRef, supplier: rec.awardedSupplier });
    if (existing) {
        fillWrcForm(existing);
        if (typeof openModule === 'function') openModule('workshop-receipt-cert');
        showToast(`Opened existing certification ${existing.inspectionSerial}.`);
        return existing;
    }
    const lines = typeof getProcurementStockLines === 'function'
        ? getProcurementStockLines(rec).map((l) => ({
            designation: l.itemName || l.designation,
            qty: l.qty,
            serialNo: '',
            specMatch: true
        }))
        : [{ designation: rec.itemSummary || 'ICT equipment', qty: 1, serialNo: '', specMatch: true }];
    const wrc = createWorkshopReceiptCert({
        supplier: rec.awardedSupplier || '',
        poNo: rec.poNumber || '',
        dnRef: rec.deliveryNoteRef || '',
        itemSummary: rec.itemSummary || '',
        qty: lines.reduce((s, l) => s + (Number(l.qty) || 0), 0) || 1,
        deliveryDate: typeof todayIsoLocal === 'function' ? todayIsoLocal() : new Date().toISOString().slice(0, 10),
        source: 'dp-procurement',
        sourceRef: rec.id,
        lines: lines.length ? lines : undefined
    });
    upsertWorkshopReceiptCert(wrc);
    rec.workshopCertId = wrc.id;
    if (typeof saveState === 'function') saveState();
    fillWrcForm(wrc);
    if (typeof openModule === 'function') openModule('workshop-receipt-cert');
    showToast(`Workshop certification ${wrc.inspectionSerial} opened for ${rec.refNo}.`);
    return wrc;
}

function createWrcFromDeliveryNote(tr) {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return null;
    if (!tr) return null;
    const row = typeof readDeliveryNoteRow === 'function' ? readDeliveryNoteRow(tr) : null;
    if (!row) return null;
    const sourceRef = typeof deliveryNoteRowRef === 'function' ? deliveryNoteRowRef(tr) : `dn-${Date.now()}`;
    const existing = findWorkshopReceiptCert({ sourceRef });
    if (existing) {
        fillWrcForm(existing);
        if (typeof openModule === 'function') openModule('workshop-receipt-cert');
        return existing;
    }
    const dnRef = row.serial ? `DN/${row.serial}` : (row.po ? `DN-PO/${row.po}` : '');
    const wrc = createWorkshopReceiptCert({
        supplier: row.supplier,
        poNo: row.po,
        dnRef,
        itemSummary: [row.item, row.description].filter(Boolean).join(' — '),
        qty: row.qty || 1,
        deliveryDate: row.date || (typeof todayIsoLocal === 'function' ? todayIsoLocal() : new Date().toISOString().slice(0, 10)),
        source: 'delivery-note',
        sourceRef,
        lines: [{
            designation: row.item || row.description || 'ICT equipment',
            qty: row.qty || 1,
            serialNo: row.serial || '',
            specMatch: true
        }]
    });
    upsertWorkshopReceiptCert(wrc);
    fillWrcForm(wrc);
    if (typeof openModule === 'function') openModule('workshop-receipt-cert');
    if (typeof renderDeliveryNoteCertBadges === 'function') renderDeliveryNoteCertBadges();
    showToast(`Workshop certification ${wrc.inspectionSerial} opened from delivery note.`);
    return wrc;
}

function renderWrcSummary() {
    const list = ensureWorkshopReceiptCerts();
    const set = (id, n) => { const el = document.getElementById(id); if (el) el.textContent = String(n); };
    set('wrcStatAwaiting', list.filter((r) => r.status === 'awaiting_assessment').length);
    set('wrcStatCertified', list.filter((r) => r.status === 'certified').length);
    set('wrcStatMlg', list.filter((r) => r.status === 'at_mlg').length);
    set('wrcStatComplete', list.filter((r) => r.status === 'engraved_complete').length);
}

function renderWrcRegister() {
    const tbody = document.getElementById('wrcRegisterBody');
    if (!tbody) return;
    const q = (document.getElementById('wrcTableSearch')?.value || '').trim().toLowerCase();
    const filter = document.getElementById('wrcFilterStatus')?.value || 'open';
    let rows = ensureWorkshopReceiptCerts().slice();
    if (filter === 'open') rows = rows.filter((r) => r.status !== 'engraved_complete' && r.status !== 'rejected');
    else if (filter !== 'all') rows = rows.filter((r) => r.status === filter);
    if (q) {
        rows = rows.filter((r) => [
            r.inspectionSerial, r.supplier, r.poNo, r.dnRef, r.itemSummary, r.status
        ].join(' ').toLowerCase().includes(q));
    }
    const canEdit = typeof canEditData === 'function' ? canEditData() : true;
    if (!rows.length) {
        tbody.innerHTML = '<tr><td colspan="9" class="req-empty-row">No workshop receipt certifications yet.</td></tr>';
        return;
    }
    tbody.innerHTML = rows.map((r) => `
        <tr>
            <td><strong>${wrcEscape(r.inspectionSerial)}</strong></td>
            <td>${wrcEscape(r.supplier)}</td>
            <td>${wrcEscape(r.poNo)}</td>
            <td>${wrcEscape(r.dnRef || '—')}</td>
            <td>${wrcEscape(r.itemSummary)}</td>
            <td>${wrcEscape(r.qty)}</td>
            <td><span class="wrc-status wrc-status-${wrcEscape(r.status)}">${wrcEscape(getWrcStatusLabel(r.status))}</span></td>
            <td>${wrcEscape(r.certDate || '—')}</td>
            <td class="req-actions-cell">${canEdit ? `
                <button type="button" class="btn btn-ghost btn-sm" data-wrc-action="edit" data-wrc-id="${wrcEscape(r.id)}">Edit</button>
                ${r.status === 'certified' ? `<button type="button" class="btn btn-primary btn-sm" data-wrc-action="mlg" data-wrc-id="${wrcEscape(r.id)}">Sent to MLG</button>` : ''}
                ${r.status === 'at_mlg' ? `<button type="button" class="btn btn-success btn-sm" data-wrc-action="engraved" data-wrc-id="${wrcEscape(r.id)}">ZA received</button>` : ''}
                ${r.status === 'awaiting_assessment' ? `<button type="button" class="btn btn-danger btn-sm" data-wrc-action="reject" data-wrc-id="${wrcEscape(r.id)}">Reject</button>` : ''}
                <button type="button" class="btn btn-secondary btn-sm" data-wrc-action="print" data-wrc-id="${wrcEscape(r.id)}"${['certified','at_mlg','engraved_complete'].includes(r.status) ? '' : ' disabled'}>Print</button>
            ` : '—'}</td>
        </tr>`).join('');
}

function buildWrcPrintHtml(rec) {
    const groupLabel = rec.group || 'GROUP 3';
    const lines = (rec.lines || []).slice(0, 12);
    while (lines.length < 12) lines.push({ designation: '', qty: '', serialNo: '' });
    const lineRows = lines.map((l, i) => `
        <tr><td style="width:24px">${WRC_LINE_LABELS[i]}.</td><td>${wrcEscape(l.designation || '')}</td><td style="width:50px;text-align:center">${wrcEscape(l.qty || '')}</td></tr>`).join('');
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${wrcEscape(rec.inspectionSerial)}</title>
<style>
body{font-family:"Times New Roman",serif;font-size:11pt;margin:24px;color:#000}
.restricted{text-align:center;font-weight:bold;letter-spacing:2px;margin:8px 0}
.header-row{display:flex;justify-content:space-between;margin-bottom:12px;font-size:10pt}
.title{text-align:center;font-weight:bold;text-decoration:underline;margin:16px 0 12px;font-size:11pt}
p{margin:8px 0;line-height:1.45}
.blank{border-bottom:1px dotted #000;display:inline-block;min-width:80px;padding:0 4px}
table.items{width:100%;border-collapse:collapse;margin:12px 0}
table.items td,table.items th{border:1px solid #000;padding:4px 6px;vertical-align:top}
.sign{margin-top:28px;display:flex;justify-content:space-between}
.note{font-size:9pt;margin-top:20px}
</style></head><body>
<div class="restricted">RESTRICTED</div>
<div class="header-row">
  <div>RV Number: <span class="blank">${wrcEscape(rec.dnRef || '')}</span></div>
  <div style="text-align:right">Ordnance and Supply Depot Harare<br>P Bag CY 463 Causeway<br>Harare: 2437274</div>
</div>
<div class="title">CERTIFICATION FOR RECEIPTS OF GOODS AND SERVICES IN RESPECT OF ${wrcEscape(groupLabel)}</div>
<p><strong>Inspection Serial Number:</strong> <span class="blank">${wrcEscape(rec.inspectionSerial)}</span></p>
<p>1. I, the undersigned No: <span class="blank">${wrcEscape(rec.officer?.forceNo)}</span>
Rank: <span class="blank">${wrcEscape(rec.officer?.rank)}</span>
Name: <span class="blank">${wrcEscape(rec.officer?.name)}</span>
of: <span class="blank">${wrcEscape(rec.officer?.unit)}</span> (Unit) being a qualified
*${wrcEscape(rec.trade)}/ tradesman/expert in the field of:
<span class="blank">${wrcEscape(rec.expertise)}</span>
hereby certify that I inspected the under listed goods/services supplied by:
<span class="blank">${wrcEscape(rec.supplier)}</span>
on Purchase Order No: <span class="blank">${wrcEscape(rec.poNo)}</span>
and have found them to be of the right specification and quality;</p>
<table class="items"><thead><tr><th></th><th>Designation of goods / services</th><th>Qty</th></tr></thead><tbody>${lineRows}</tbody></table>
<p>2. I, therefore, hereby certify that the goods/services can be received into stock by respective warehouse.</p>
<div class="sign">
  <div>Signature: <span class="blank" style="min-width:160px"></span><br>Date: <span class="blank">${wrcEscape(rec.certDate || '')}</span></div>
  <div>Office Stamp</div>
</div>
<p class="note">Note: *Delete inapplicable trade. ** RV for Depot use only.<br>Supplier to present this certificate with PO and Delivery Note at MLG for engraving.</p>
<div class="restricted">RESTRICTED</div>
<script>window.onload=function(){window.print();}</script>
</body></html>`;
}

function printWorkshopReceiptCert(id) {
    const rec = ensureWorkshopReceiptCerts().find((r) => r.id === (id || document.getElementById('wrcEditId')?.value));
    if (!rec) return;
    if (!['certified', 'at_mlg', 'engraved_complete'].includes(rec.status)) {
        showToast('Certify the delivery before printing.', 'warning');
        return;
    }
    const w = window.open('', '_blank', 'width=820,height=900');
    if (!w) {
        showToast('Allow pop-ups to print the certification.', 'warning');
        return;
    }
    w.document.write(buildWrcPrintHtml(rec));
    w.document.close();
}

function renderWorkshopReceiptCertModule() {
    renderWrcSummary();
    renderWrcRegister();
}

function populateWrcSelects() {
    const group = document.getElementById('wrcGroup');
    if (group && !group.dataset.ready) {
        group.innerHTML = WRC_GROUPS.map((g) => `<option value="${wrcEscape(g)}">${wrcEscape(g)}</option>`).join('');
        group.dataset.ready = '1';
    }
    const trade = document.getElementById('wrcTrade');
    if (trade && !trade.dataset.ready) {
        trade.innerHTML = WRC_TRADES.map((t) => `<option value="${wrcEscape(t)}">${wrcEscape(t)}</option>`).join('');
        trade.dataset.ready = '1';
    }
}

function initWorkshopReceiptCertModule() {
    const moduleEl = document.getElementById('workshop-receipt-cert');
    if (!moduleEl || moduleEl.dataset.wrcInit === '1') return;
    moduleEl.dataset.wrcInit = '1';
    populateWrcSelects();
    clearWrcForm();

    document.getElementById('wrcSaveBtn')?.addEventListener('click', saveWrcDraft);
    document.getElementById('wrcCertifyBtn')?.addEventListener('click', certifyWrcFromForm);
    document.getElementById('wrcClearBtn')?.addEventListener('click', clearWrcForm);
    document.getElementById('wrcPrintBtn')?.addEventListener('click', () => printWorkshopReceiptCert());
    document.getElementById('wrcAddLineBtn')?.addEventListener('click', () => {
        const body = document.getElementById('wrcLinesBody');
        if (!body || body.children.length >= 12) return;
        body.appendChild(buildWrcLineRow({}, body.children.length));
    });
    document.getElementById('wrcTableSearch')?.addEventListener('input', renderWrcRegister);
    document.getElementById('wrcFilterStatus')?.addEventListener('change', renderWrcRegister);

    document.getElementById('wrcRegisterBody')?.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-wrc-action]');
        if (!btn) return;
        const id = btn.getAttribute('data-wrc-id');
        const action = btn.getAttribute('data-wrc-action');
        const rec = ensureWorkshopReceiptCerts().find((r) => r.id === id);
        if (!rec) return;
        if (action === 'edit') fillWrcForm(rec);
        else if (action === 'mlg') sendWrcToMlg(id);
        else if (action === 'engraved') completeWrcMlgEngraving(id);
        else if (action === 'reject') rejectWrc(id);
        else if (action === 'print') printWorkshopReceiptCert(id);
    });

    renderWorkshopReceiptCertModule();
}

window.createWrcFromUndelivered = createWrcFromUndelivered;
window.createWrcFromDpProcurement = createWrcFromDpProcurement;
window.createWrcFromDeliveryNote = createWrcFromDeliveryNote;
window.findWorkshopReceiptCert = findWorkshopReceiptCert;
window.validateWorkshopCertForIctReceipt = validateWorkshopCertForIctReceipt;
window.validateWorkshopCertForDeliveryVerified = validateWorkshopCertForDeliveryVerified;
window.procurementRequiresWorkshopCert = procurementRequiresWorkshopCert;
window.categoryRequiresWorkshopCert = categoryRequiresWorkshopCert;
window.printWorkshopReceiptCert = printWorkshopReceiptCert;
window.initWorkshopReceiptCertModule = initWorkshopReceiptCertModule;
