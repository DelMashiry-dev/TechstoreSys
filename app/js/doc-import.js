/* doc-import.js — upload / paste a document and populate the matching form */

const DOC_IMPORT_MAX_BYTES = 4 * 1024 * 1024;

const DOC_IMPORT_TYPES = [
    { value: 'loose_minute', label: 'Loose minute', moduleId: 'unit-requisitions' },
    { value: 'requisition', label: 'Unit requisition', moduleId: 'unit-requisitions' },
    { value: 'quotation', label: 'Quotation', moduleId: 'guide-quotation' },
    { value: 'purchase_order', label: 'Purchase order', moduleId: 'purchase-orders' },
    { value: 'dp_f1', label: 'DP F1', moduleId: 'dp-f1-form' },
    { value: 'tech_spec', label: 'Tech spec / evaluation', moduleId: 'spec-evaluation' },
    { value: 'delivery_note', label: 'Delivery note', moduleId: 'delivery-note' },
    { value: 'cost_comparative', label: 'Cost comparative schedule', moduleId: 'cost-comparative-schedule' },
    { value: 'unknown', label: 'Unknown', moduleId: '' }
];

const DOC_IMPORT_FIELD_LABELS = {
    unit: 'Unit / formation',
    requestedBy: 'From / requested by',
    contact: 'Contact',
    fileRef: 'File ref',
    originRef: 'Origin ref',
    subject: 'Subject',
    itemDescription: 'Item / description',
    qty: 'Quantity',
    unitPrice: 'Unit price',
    estimatedCost: 'Estimated cost',
    justification: 'Justification / body',
    notes: 'Notes',
    date: 'Date',
    docType: 'Requisition doc type',
    supplier: 'Supplier',
    supplierName: 'Supplier name',
    supplierAddress: 'Supplier address',
    ref: 'Reference',
    preparedFor: 'Prepared for',
    purpose: 'Purpose',
    currency: 'Currency',
    poNumber: 'P/O number',
    vendorNo: 'Vendor no.',
    reqNo: 'Requisition number',
    deliverTo: 'Deliver to',
    deliveryDate: 'Delivery date',
    paymentTerms: 'Payment terms',
    contact: 'Contact',
    telephone: 'Telephone',
    gl: 'GL account',
    delivery: 'Delivery place',
    remarks: 'Remarks',
    productName: 'Product name',
    brand: 'Brand',
    model: 'Model',
    category: 'Category',
    summary: 'Summary',
    item: 'Item',
    description: 'Description',
    uom: 'Unit of measure',
    serial: 'Serial',
    po: 'Purchase no.',
    receivedBy: 'Received by',
    dpF1Ref: 'DP F1 ref',
    winningVendor: 'Winning vendor',
    vendorA: 'Vendor A',
    vendorB: 'Vendor B',
    vendorC: 'Vendor C'
};

let docImportState = {
    file: null,
    result: null
};

function docImportEsc(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function docImportTypeMeta(value) {
    return DOC_IMPORT_TYPES.find((t) => t.value === value) || DOC_IMPORT_TYPES[DOC_IMPORT_TYPES.length - 1];
}

function docImportFileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = String(reader.result || '');
            const idx = result.indexOf(',');
            resolve(idx >= 0 ? result.slice(idx + 1) : result);
        };
        reader.onerror = () => reject(new Error('Could not read file'));
        reader.readAsDataURL(file);
    });
}

function setDocImportStatus(msg, kind = '') {
    const el = document.getElementById('docImportStatus');
    if (!el) return;
    el.textContent = msg || '';
    el.className = `doc-import-status${kind ? ` is-${kind}` : ''}`;
}

function classifyDocImportLocal(text, fileName, hint) {
    if (hint && DOC_IMPORT_TYPES.some((t) => t.value === hint)) return { docType: hint, confidence: 0.95 };
    const blob = `${fileName || ''}\n${text || ''}`.toLowerCase();
    const rules = [
        ['dp_f1', 0.9, ['official indent', 'dp f1', 'it dir f1', 'current holding stock']],
        ['purchase_order', 0.88, ['purchase order', 'p/o no', 'our ref', 'vendor no']],
        ['cost_comparative', 0.88, ['cost comparative', 'winning vendor', 'vendor a']],
        ['delivery_note', 0.86, ['delivery note', 'd-note', 'goods received note']],
        ['quotation', 0.84, ['quotation', 'proforma', 'quote no']],
        ['tech_spec', 0.82, ['specification', 'tech eval', 'operating system', 'processor']],
        ['loose_minute', 0.84, ['loose minute', 'minute sheet']],
        ['requisition', 0.8, ['requisition', 'indent for']]
    ];
    for (const [docType, confidence, keys] of rules) {
        if (keys.some((k) => blob.includes(k))) return { docType, confidence };
    }
    if (/\bfrom\s*:/.test(blob) && /\b(to|subject)\s*:/.test(blob)) {
        return { docType: 'loose_minute', confidence: 0.6 };
    }
    return { docType: 'unknown', confidence: 0.2 };
}

function localField(text, pattern) {
    const m = String(text || '').match(pattern);
    return m ? String(m[1] || '').trim().replace(/\s+/g, ' ').slice(0, 400) : '';
}

function heuristicDocImport(text, fileName, hint) {
    const { docType, confidence } = classifyDocImportLocal(text, fileName, hint);
    const subject = localField(text, /(?:subject|re)\s*[:.-]\s*(.+)$/im);
    const fields = {
        date: localField(text, /(?:dated|date)\s*[:.]?\s*(\d{1,2}[./-]\d{1,2}[./-]\d{2,4}|\d{4}-\d{2}-\d{2})/i),
        subject,
        itemDescription: subject,
        purpose: subject,
        justification: String(text || '').trim().slice(0, 800),
        notes: 'Imported from document — review before save.'
    };
    const lines = [];
    const lineRe = /^\s*(?:[-*]|\d+[.)])?\s*(\d+(?:\.\d+)?)\s*[x×]\s+([^\n@]+?)(?:\s*@\s*[\$]?\s*([\d,]+\.?\d*))?\s*$/gim;
    let m;
    while ((m = lineRe.exec(text))) {
        lines.push({
            description: m[2].trim(),
            qty: m[1],
            unitUsd: (m[3] || '').replace(/,/g, '')
        });
    }
    if (docType === 'loose_minute' || docType === 'requisition') {
        fields.unit = localField(text, /(?:from|unit|formation)\s*[:.-]\s*(.+)$/im);
        fields.requestedBy = fields.unit;
        fields.fileRef = localField(text, /(?:file\s*ref|our\s*ref|ref(?:erence)?)\s*[:.-]\s*(\S.+)$/im);
        fields.docType = docType === 'loose_minute' ? 'loose_minute' : 'requisition_letter';
        if (lines[0]) {
            fields.qty = lines[0].qty || '1';
            fields.itemDescription = lines[0].description || fields.itemDescription;
            fields.unitPrice = lines[0].unitUsd || '';
        }
    } else if (docType === 'quotation') {
        fields.supplier = localField(text, /(?:from|supplier|vendor)\s*[:.-]\s*(.+)$/im);
        fields.ref = localField(text, /(?:quote\s*no|quotation\s*no|ref)\s*[:.-]\s*(\S.+)$/im);
        fields.currency = /usd/i.test(text) ? 'USD' : 'ZiG';
    } else if (docType === 'purchase_order') {
        fields.poNumber = localField(text, /(?:p\/?o(?:\s*no\.?)?|our\s*ref|purchase\s*order)\s*[:.-]?\s*([A-Z0-9][A-Z0-9/._-]{3,})/i);
        fields.reqNo = localField(text, /(?:requisition|req(?:uisition)?)\s*(?:no\.?|number)?\s*[:.-]?\s*([A-Z0-9][A-Z0-9/._-]{4,})/i);
        fields.contact = localField(text, /(?:contact)\s*[:.-]\s*(.+)$/im);
        fields.telephone = localField(text, /(?:telephone|phone|tel)\s*[:.-]?\s*([+\d][\d ()-]{5,})/im);
        fields.supplierName = localField(text, /(?:supplier|vendor|to)\s*[:.-]\s*(.+)$/im);
        fields.currency = /usd/i.test(text) ? 'USD' : 'ZiG';
    } else if (docType === 'dp_f1') {
        fields.estimatedCost = localField(text, /(?:estimated\s*cost|total)\D{0,12}([\d,]+\.?\d*)/i);
        fields.currency = 'USD';
        fields.gl = localField(text, /\b(2200\d{6}|3112210001)\b/);
    } else if (docType === 'tech_spec') {
        fields.productName = subject || String(text).split('\n')[0].slice(0, 120);
        fields.summary = String(text).trim().slice(0, 400);
    } else if (docType === 'delivery_note') {
        fields.supplier = localField(text, /(?:supplied\s*by|supplier|from)\s*[:.-]\s*(.+)$/im);
        fields.po = localField(text, /(?:p\/?o|purchase\s*(?:order|no\.?))\s*[:.-]?\s*([A-Z0-9][A-Z0-9/._-]{3,})/i);
        fields.item = (lines[0] && lines[0].description) || subject;
        fields.qty = (lines[0] && lines[0].qty) || '1';
        fields.uom = 'ea';
    }
    const meta = docImportTypeMeta(docType);
    return {
        ok: true,
        ai: false,
        docType,
        confidence,
        moduleId: meta.moduleId,
        moduleLabel: meta.label,
        fields,
        lines,
        extractedText: String(text || '').slice(0, 4000),
        fileName: fileName || '',
        note: 'Offline / local extract — review every field. Typed text is more reliable than handwriting without AI.'
    };
}

async function parseImportDocumentRequest({ text = '', file = null, docTypeHint = '' } = {}) {
    const body = { text, docType: docTypeHint };
    if (file) {
        const b64 = await docImportFileToBase64(file);
        body.mimeType = file.type || '';
        body.fileName = file.name || '';
        if ((file.type || '').startsWith('image/')) body.imageBase64 = b64;
        else body.fileBase64 = b64;
    }
    if (!body.text && !body.imageBase64 && !body.fileBase64) {
        throw new Error('Choose a file or paste typed text.');
    }
    const apiBase = typeof API_BASE === 'string' ? API_BASE : '';
    try {
        const res = await fetch(`${apiBase}/api/ai/import-document`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.ok) return data;
        if (!res.ok && data.error && !body.text) throw new Error(data.error);
        if (res.ok && !data.ok && data.error && !body.text) throw new Error(data.error);
    } catch (err) {
        if (!body.text) throw err;
    }
    return heuristicDocImport(body.text, file?.name || '', docTypeHint);
}

function collectDocImportReview() {
    const result = { ...(docImportState.result || {}) };
    const fields = {};
    document.querySelectorAll('#docImportFieldsBody [data-di-field]').forEach((input) => {
        fields[input.getAttribute('data-di-field')] = input.value.trim();
    });
    result.fields = fields;
    const typeEl = document.getElementById('docImportTypeHint');
    if (typeEl?.value) result.docType = typeEl.value;
    const meta = docImportTypeMeta(result.docType);
    result.moduleId = meta.moduleId;
    result.moduleLabel = meta.label;
    const linesEl = document.getElementById('docImportLinesJson');
    if (linesEl && !document.getElementById('docImportLinesWrap')?.hidden) {
        try {
            const parsed = JSON.parse(linesEl.value || '[]');
            result.lines = Array.isArray(parsed) ? parsed : [];
        } catch (_) {
            throw new Error('Line items JSON is not valid. Fix the array or clear it.');
        }
    }
    return result;
}

function renderDocImportResult(data) {
    docImportState.result = data;
    const box = document.getElementById('docImportResult');
    if (!box) return;
    box.hidden = false;
    const meta = docImportTypeMeta(data.docType);
    const kind = document.getElementById('docImportKind');
    if (kind) {
        const pct = Math.round((Number(data.confidence) || 0) * 100);
        const via = data.ai ? 'AI' : 'typed-text rules';
        kind.innerHTML = `<strong>${docImportEsc(meta.label)}</strong> · ${pct}% confidence · ${via}`
            + (data.moduleLabel || meta.moduleId ? ` → ${docImportEsc(data.moduleLabel || meta.label)}` : '');
    }
    const note = document.getElementById('docImportNote');
    if (note) note.textContent = data.note || '';
    const typeEl = document.getElementById('docImportTypeHint');
    if (typeEl && data.docType && data.docType !== 'unknown') typeEl.value = data.docType;
    const fields = data.fields || {};
    const keys = Object.keys(fields).filter((k) => fields[k] !== '' && fields[k] != null);
    const extra = ['unit', 'subject', 'itemDescription', 'qty', 'supplier', 'supplierName', 'poNumber', 'ref', 'estimatedCost', 'date']
        .filter((k) => !keys.includes(k));
    const body = document.getElementById('docImportFieldsBody');
    if (body) {
        const rows = [...keys, ...extra].map((key) => {
            const label = DOC_IMPORT_FIELD_LABELS[key] || key;
            const val = fields[key] == null ? '' : String(fields[key]);
            return `<tr>
                <th>${docImportEsc(label)}</th>
                <td><input type="text" class="form-control" data-di-field="${docImportEsc(key)}" value="${docImportEsc(val)}"></td>
            </tr>`;
        }).join('');
        body.innerHTML = rows || '<tr><td colspan="2" class="muted">No fields extracted — type them here or paste clearer text.</td></tr>';
    }
    const linesWrap = document.getElementById('docImportLinesWrap');
    const linesEl = document.getElementById('docImportLinesJson');
    const lines = Array.isArray(data.lines) ? data.lines : [];
    if (linesWrap) linesWrap.hidden = !lines.length;
    if (linesEl) linesEl.value = lines.length ? JSON.stringify(lines, null, 2) : '[]';
    const extracted = document.getElementById('docImportExtracted');
    if (extracted) extracted.value = data.extractedText || '';
}

function clearDocImport() {
    docImportState = { file: null, result: null };
    const file = document.getElementById('docImportFile');
    if (file) file.value = '';
    const paste = document.getElementById('docImportPaste');
    if (paste) paste.value = '';
    const name = document.getElementById('docImportFileName');
    if (name) {
        name.hidden = true;
        name.textContent = '';
    }
    const box = document.getElementById('docImportResult');
    if (box) box.hidden = true;
    const typeEl = document.getElementById('docImportTypeHint');
    if (typeEl) typeEl.value = '';
    setDocImportStatus('');
}

function setDocImportFile(file) {
    if (!file) return;
    if (file.size > DOC_IMPORT_MAX_BYTES) {
        if (typeof showToast === 'function') showToast('File is larger than 4 MB.', 'error');
        return;
    }
    docImportState.file = file;
    const name = document.getElementById('docImportFileName');
    if (name) {
        name.hidden = false;
        name.textContent = `${file.name} (${Math.ceil(file.size / 1024)} KB)`;
    }
}

async function runDocImportParse() {
    const btn = document.getElementById('docImportParseBtn');
    const text = document.getElementById('docImportPaste')?.value?.trim() || '';
    const hint = document.getElementById('docImportTypeHint')?.value || '';
    if (btn) { btn.disabled = true; btn.textContent = 'Reading…'; }
    setDocImportStatus('Reading document…');
    try {
        const data = await parseImportDocumentRequest({
            text,
            file: docImportState.file,
            docTypeHint: hint
        });
        renderDocImportResult(data);
        setDocImportStatus(data.ai ? 'Fields extracted (AI) — review then apply.' : 'Fields extracted — review then apply.', 'ok');
    } catch (err) {
        setDocImportStatus(err.message || 'Could not read document.', 'error');
        if (typeof showToast === 'function') showToast(err.message || 'Could not read document.', 'error');
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'Read document'; }
    }
}

function setFieldValue(id, value) {
    if (value == null || value === '') return;
    const el = document.getElementById(id);
    if (!el) return;
    if (el.classList.contains('zna-unit-select') && typeof fillZnaUnitSelect === 'function') {
        fillZnaUnitSelect(el, value, { includeBlank: true, includeOther: true });
        return;
    }
    if (typeof setZnaUnitField === 'function' && (el.classList.contains('zna-unit-select') || el.dataset.znaWired === '1')) {
        setZnaUnitField(el, value);
        return;
    }
    el.value = value;
}

function guessReqCategory(text) {
    const t = String(text || '').toLowerCase();
    if (/laptop|notebook|desktop|printer|tablet|server|router/.test(t)) return 'ict-equipment';
    if (/toner|cartridge|ink/.test(t)) return 'consumables-toners';
    return '';
}

async function applyDocImportToRequisition(data) {
    if (typeof navigateToModule === 'function') await navigateToModule('unit-requisitions');
    if (typeof clearRequisitionForm === 'function') clearRequisitionForm();
    const f = data.fields || {};
    const line = (data.lines || [])[0] || {};
    const item = f.itemDescription || f.subject || line.description || line.designation || '';
    const req = {
        id: '',
        receivedDate: f.date || (typeof todayIsoLocal === 'function' ? todayIsoLocal() : ''),
        reqNo: typeof nextRequisitionNo === 'function' ? nextRequisitionNo() : '',
        unit: f.unit || '',
        requestedBy: f.requestedBy || '',
        contact: f.contact || '',
        fileRef: f.fileRef || f.originRef || '',
        originRef: f.originRef || f.fileRef || '',
        docType: f.docType || (data.docType === 'requisition' ? 'requisition_letter' : 'loose_minute'),
        subject: f.subject || item,
        justification: f.justification || f.notes || '',
        itemDescription: item,
        qty: f.qty || line.qty || '1',
        unitPrice: f.unitPrice || line.unitUsd || line.price || '',
        estimatedCost: f.estimatedCost || '',
        notes: [f.notes, data.fileName ? `Imported from ${data.fileName}` : 'Imported document']
            .filter(Boolean).join(' · '),
        category: guessReqCategory(`${item} ${f.subject || ''}`) || 'other',
        status: 'received',
        priority: 'normal'
    };
    if (typeof fillRequisitionForm === 'function') fillRequisitionForm(req);
    setFieldValue('reqEditId', '');
    const title = document.getElementById('reqFormTitle');
    if (title) title.textContent = 'Book in a requisition (imported)';
    const saveBtn = document.getElementById('reqSaveBtn');
    if (saveBtn) saveBtn.textContent = 'Save Requisition';
    else {
        setFieldValue('reqSubject', req.subject);
        setFieldValue('reqItem', req.itemDescription);
        setFieldValue('reqQty', req.qty);
        setFieldValue('reqUnit', req.unit);
    }
}

async function applyDocImportToDpF1(data) {
    if (typeof navigateToModule === 'function') await navigateToModule('dp-f1-form');
    const f = data.fields || {};
    setFieldValue('dpF1Date', f.date);
    setFieldValue('dpF1EstimatedCost', f.estimatedCost);
    setFieldValue('dpF1Currency', f.currency || 'USD');
    setFieldValue('dpF1Gl', f.gl);
    setFieldValue('dpF1Remarks', f.remarks || f.subject || f.itemDescription || '');
    if (f.delivery) {
        const del = document.getElementById('dpF1Delivery');
        if (del) {
            const match = [...del.options].find((o) => o.text.toLowerCase().includes(String(f.delivery).toLowerCase()));
            if (match) del.value = match.value;
        }
    }
    const items = (data.lines || []).map((row) => ({
        designation: row.designation || row.description || row.desc || row.itemDescription || '',
        qty: row.qty || '',
        holding: row.holding || '',
        supplier: row.supplier || f.supplier || f.supplierName || ''
    })).filter((row) => row.designation || row.qty);
    if (!items.length && (f.itemDescription || f.subject)) {
        items.push({
            designation: f.itemDescription || f.subject,
            qty: f.qty || '1',
            holding: '',
            supplier: f.supplier || f.supplierName || ''
        });
    }
    const tbody = document.getElementById('dp-f1-table-body');
    if (tbody && items.length && typeof buildDPF1Row === 'function') {
        tbody.innerHTML = '';
        items.forEach((item) => {
            const tr = buildDPF1Row();
            tbody.appendChild(tr);
            const inputs = tr.querySelectorAll('input');
            if (inputs[0]) inputs[0].value = item.designation;
            if (inputs[1]) inputs[1].value = item.qty;
            if (inputs[2]) inputs[2].value = item.holding;
            if (inputs[3]) inputs[3].value = item.supplier;
        });
    }
    if (typeof updateDpF1FundingAlert === 'function') updateDpF1FundingAlert();
}

async function applyDocImportToPurchaseOrder(data) {
    if (typeof navigateToModule === 'function') await navigateToModule('purchase-orders');
    if (typeof clearPurchaseOrderDocument === 'function') clearPurchaseOrderDocument();
    const f = data.fields || {};
    setFieldValue('poSupplierName', f.supplierName || f.supplier || '');
    setFieldValue('poSupplierAddress', f.supplierAddress || '');
    setFieldValue('poNumber', f.poNumber || f.ref || '');
    setFieldValue('poDate', f.date);
    setFieldValue('poVendorNo', f.vendorNo || '');
    setFieldValue('poReqNo', f.reqNo || f.requisitionNo || '');
    setFieldValue('poDeliverTo', f.deliverTo || '');
    setFieldValue('poDeliveryDate', f.deliveryDate || '');
    setFieldValue('poPaymentTerms', f.paymentTerms || '');
    setFieldValue('poContact', f.contact || '');
    setFieldValue('poTelephone', f.telephone || f.phone || '');
    setFieldValue('poCurrency', f.currency || '');
    setFieldValue('poGl', f.gl);
    const tbody = document.getElementById('purchase-orders-lines-body');
    const lines = (data.lines || []).map((row, i) => ({
        item: row.item || String((i + 1) * 10).padStart(5, '0'),
        material: row.material || '',
        qty: row.qty || '1',
        unit: row.unit || 'each',
        desc: row.desc || row.description || row.designation || '',
        price: row.price || row.unitUsd || ''
    })).filter((row) => row.desc || row.qty);
    if (tbody && typeof buildPurchaseOrderLineRow === 'function' && lines.length) {
        tbody.innerHTML = '';
        lines.forEach((line) => tbody.appendChild(buildPurchaseOrderLineRow(line)));
        if (typeof updatePurchaseOrderDocumentTotal === 'function') updatePurchaseOrderDocumentTotal();
    }
}

async function applyDocImportToQuotation(data) {
    if (typeof navigateToModule === 'function') await navigateToModule('guide-quotation');
    const f = data.fields || {};
    const items = (data.lines || []).map((row) => ({
        description: row.description || row.desc || row.designation || '',
        qty: row.qty || 1,
        unit: row.unit || 'EA',
        unitUsd: row.unitUsd || row.price || '',
        unitZig: row.unitZig || '',
        source: row.source || f.supplier || ''
    })).filter((row) => row.description);
    if (!items.length && (f.itemDescription || f.subject)) {
        items.push({
            description: f.itemDescription || f.subject,
            qty: f.qty || 1,
            unit: 'EA',
            unitUsd: f.unitPrice || '',
            source: f.supplier || ''
        });
    }
    const snap = {
        ref: f.ref || '',
        date: f.date || '',
        purpose: f.purpose || f.subject || '',
        preparedFor: f.preparedFor || f.supplier || '',
        currency: f.currency || 'USD',
        notes: f.notes || '',
        deliverTo: f.deliverTo || 'IT DIR',
        glAccount: f.gl || '',
        items
    };
    if (typeof loadGqSnapshot === 'function') loadGqSnapshot(snap);
    else {
        setFieldValue('gqRef', snap.ref);
        setFieldValue('gqPurpose', snap.purpose);
        setFieldValue('gqPreparedFor', snap.preparedFor);
    }
}

async function applyDocImportToSpec(data) {
    if (typeof navigateToModule === 'function') await navigateToModule('spec-evaluation');
    const f = data.fields || {};
    const specs = (data.lines || []).map((row) => {
        if (row.name && row.value) return [row.name, row.value, row.note || 'From imported document'];
        if (Array.isArray(row) && row.length >= 2) return row;
        return null;
    }).filter(Boolean);
    const payload = {
        productName: f.productName || f.itemDescription || f.subject || '',
        brand: f.brand || '',
        model: f.model || '',
        category: f.category || '',
        purpose: f.purpose || f.justification || '',
        summary: f.summary || '',
        specs,
        ai: !!data.ai
    };
    if (typeof applySpecDocumentToForm === 'function') applySpecDocumentToForm(payload);
    else setFieldValue('specEvalItemName', payload.productName);
}

async function applyDocImportToDeliveryNote(data) {
    if (typeof navigateToModule === 'function') await navigateToModule('delivery-note');
    const f = data.fields || {};
    const rows = (data.lines || []).length
        ? data.lines
        : [{
            date: f.date,
            item: f.item || f.itemDescription || f.subject,
            description: f.description || f.itemDescription || '',
            qty: f.qty || '1',
            uom: f.uom || 'ea',
            serial: f.serial || '',
            po: f.po || f.poNumber || '',
            supplier: f.supplier || f.supplierName || '',
            receivedBy: f.receivedBy || ''
        }];
    const tbody = document.getElementById('delivery-table-body');
    if (!tbody || typeof buildDeliveryRow !== 'function') return;
    rows.forEach((row) => {
        const tr = buildDeliveryRow();
        tbody.appendChild(tr);
        const inputs = tr.querySelectorAll('input');
        if (inputs[0]) inputs[0].value = row.date || f.date || '';
        if (inputs[1]) inputs[1].value = row.item || row.description || row.desc || '';
        if (inputs[2]) inputs[2].value = row.description || row.desc || row.item || '';
        if (inputs[3]) inputs[3].value = row.qty || '1';
        if (inputs[4]) inputs[4].value = row.uom || 'ea';
        if (inputs[5]) inputs[5].value = row.serial || '';
        if (inputs[6]) inputs[6].value = row.po || row.poNumber || '';
        if (inputs[7]) inputs[7].value = row.supplier || '';
        if (inputs[8]) inputs[8].value = row.receivedBy || '';
        if (typeof renderDeliveryNoteCertBadge === 'function') renderDeliveryNoteCertBadge(tr);
    });
}

async function applyDocImportToCcs(data) {
    if (typeof navigateToModule === 'function') await navigateToModule('cost-comparative-schedule');
    const f = data.fields || {};
    const items = (data.lines || []).map((row) => ({
        description: row.description || row.desc || '',
        qty: row.qty || '',
        prices: {
            A: row.priceA || row.prices?.A || '',
            B: row.priceB || row.prices?.B || '',
            C: row.priceC || row.prices?.C || ''
        }
    })).filter((row) => row.description);
    const snap = {
        ref: f.ref || '',
        date: f.date || '',
        dpF1Ref: f.dpF1Ref || '',
        currency: f.currency || 'USD',
        winningVendor: f.winningVendor || '',
        vendors: { A: f.vendorA || '', B: f.vendorB || '', C: f.vendorC || '' },
        items,
        status: 'draft'
    };
    if (typeof applyCcsSnapshot === 'function') applyCcsSnapshot(snap);
}

async function applyDocImportResult() {
    let data;
    try {
        data = collectDocImportReview();
    } catch (err) {
        if (typeof showToast === 'function') showToast(err.message, 'error');
        return;
    }
    const meta = docImportTypeMeta(data.docType);
    if (!meta.moduleId) {
        if (typeof showToast === 'function') {
            showToast('Choose a document type, then apply again.', 'error');
        }
        return;
    }
    if (typeof canAccessModule === 'function' && !canAccessModule(meta.moduleId)) {
        if (typeof showToast === 'function') showToast('Your login cannot open that form.', 'error');
        return;
    }
    try {
        if (data.docType === 'loose_minute' || data.docType === 'requisition') {
            await applyDocImportToRequisition(data);
        } else if (data.docType === 'dp_f1') {
            await applyDocImportToDpF1(data);
        } else if (data.docType === 'purchase_order') {
            await applyDocImportToPurchaseOrder(data);
        } else if (data.docType === 'quotation') {
            await applyDocImportToQuotation(data);
        } else if (data.docType === 'tech_spec') {
            await applyDocImportToSpec(data);
        } else if (data.docType === 'delivery_note') {
            await applyDocImportToDeliveryNote(data);
        } else if (data.docType === 'cost_comparative') {
            await applyDocImportToCcs(data);
        } else {
            throw new Error('Unsupported document type.');
        }
        if (typeof showToast === 'function') {
            showToast(`Opened ${meta.label} with imported fields — review, then save.`, 'success');
        }
    } catch (err) {
        if (typeof showToast === 'function') showToast(err.message || 'Could not fill the form.', 'error');
    }
}

function openDocImportModule() {
    if (typeof canAccessModule === 'function' && !canAccessModule('doc-import')) {
        if (typeof showToast === 'function') showToast('Access denied for your access level.', 'error');
        return;
    }
    if (typeof navigateToModule === 'function') navigateToModule('doc-import');
}

function initDocImportModule() {
    document.querySelectorAll('.doc-import-entry').forEach((btn) => {
        if (btn.dataset.diWired === '1') return;
        btn.dataset.diWired = '1';
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            openDocImportModule();
        });
    });

    const root = document.getElementById('doc-import');
    if (!root || root.dataset.diInit === '1') return;
    root.dataset.diInit = '1';

    const drop = document.getElementById('docImportDrop');
    const fileInput = document.getElementById('docImportFile');
    document.getElementById('docImportPickBtn')?.addEventListener('click', () => fileInput?.click());
    fileInput?.addEventListener('change', () => {
        const file = fileInput.files?.[0];
        if (file) setDocImportFile(file);
        fileInput.value = '';
    });
    drop?.addEventListener('dragover', (e) => {
        e.preventDefault();
        drop.classList.add('is-drag');
    });
    drop?.addEventListener('dragleave', () => drop.classList.remove('is-drag'));
    drop?.addEventListener('drop', (e) => {
        e.preventDefault();
        drop.classList.remove('is-drag');
        const file = e.dataTransfer?.files?.[0];
        if (file) setDocImportFile(file);
    });
    document.getElementById('docImportParseBtn')?.addEventListener('click', runDocImportParse);
    document.getElementById('docImportApplyBtn')?.addEventListener('click', applyDocImportResult);
    document.getElementById('docImportClearBtn')?.addEventListener('click', clearDocImport);
}

window.openDocImportModule = openDocImportModule;
window.initDocImportModule = initDocImportModule;
window.parseImportDocumentRequest = parseImportDocumentRequest;
