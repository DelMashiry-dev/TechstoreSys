/* creditors-import.js — drag/drop Excel creditors register + DAF paid list */

const SD_IMPORT_HOSTS = {
    sd: {
        creditorsPreview: 'sdCreditorsPreview',
        creditorsStatus: 'sdCreditorsImportStatus',
        creditorsMode: 'sdCreditorsLoadMode',
        paidPreview: 'sdPaidPreview',
        confirmCreditorsBtn: 'sdConfirmCreditorsImportBtn',
        cancelCreditorsBtn: 'sdCancelCreditorsImportBtn',
        confirmPaidBtn: 'sdConfirmPaidApplyBtn',
        cancelPaidBtn: 'sdCancelPaidApplyBtn'
    },
    stkDaf: {
        creditorsPreview: 'stkDafCreditorsPreview',
        creditorsStatus: 'stkDafCreditorsImportStatus',
        creditorsMode: 'stkDafCreditorsLoadMode',
        paidPreview: 'stkDafPaidPreview',
        confirmCreditorsBtn: 'stkDafConfirmCreditorsImportBtn',
        cancelCreditorsBtn: 'stkDafCancelCreditorsImportBtn',
        confirmPaidBtn: 'stkDafConfirmPaidApplyBtn',
        cancelPaidBtn: 'stkDafCancelPaidApplyBtn'
    }
};

const _sdPendingByHost = {
    sd: { creditors: null, paid: null },
    stkDaf: { creditors: null, paid: null }
};

function sdImportHost(hostKey = 'sd') {
    return SD_IMPORT_HOSTS[hostKey] || SD_IMPORT_HOSTS.sd;
}

function sdReadFileBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const raw = String(reader.result || '');
            const idx = raw.indexOf(',');
            resolve(idx >= 0 ? raw.slice(idx + 1) : raw);
        };
        reader.onerror = () => reject(reader.error || new Error('Could not read file.'));
        reader.readAsDataURL(file);
    });
}

async function parseCreditorsExcelViaApi(file) {
    const base64 = await sdReadFileBase64(file);
    const res = await fetch('/api/creditors/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            fileBase64: base64,
            fileName: file.name || 'creditors.xlsx'
        })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.ok) {
        throw new Error(data?.error || `Parse failed (${res.status})`);
    }
    return data.pack;
}

async function parseCreditorsPaidViaApi(file) {
    const base64 = await sdReadFileBase64(file);
    const res = await fetch('/api/creditors/parse-paid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            fileBase64: base64,
            fileName: file.name || 'paid-list.xlsx'
        })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.ok) {
        throw new Error(data?.error || `Parse failed (${res.status})`);
    }
    return data.paid;
}

function sdImportNetworkError(msg) {
    return msg.includes('Failed to fetch') || msg.includes('NetworkError');
}

function sdRefreshCreditorsViews() {
    if (typeof renderSupplierDebtsModule === 'function') renderSupplierDebtsModule();
    if (typeof renderStkDafCreditorsPanel === 'function') renderStkDafCreditorsPanel();
    if (typeof updateDashboard === 'function') updateDashboard();
}

function renderSdCreditorsPreview(pack, hostKey = 'sd') {
    const host = sdImportHost(hostKey);
    const el = document.getElementById(host.creditorsPreview);
    if (!el) return;
    if (!pack?.cases?.length) {
        el.hidden = true;
        el.innerHTML = '';
        return;
    }
    const top = pack.cases.slice().sort((a, b) => (b.totalUsd || 0) - (a.totalUsd || 0)).slice(0, 6);
    el.hidden = false;
    el.innerHTML = `
        <div class="sd-preview-head">
            <strong>Import preview</strong>
            <span>${pack.caseCount} supplier(s) · ${pack.lineCount} invoice line(s) · USD ${typeof sdFmtUsd === 'function' ? sdFmtUsd(pack.totalUsd) : pack.totalUsd}</span>
        </div>
        <p class="muted">${typeof sdEscape === 'function' ? sdEscape(pack.title || pack.source || '') : (pack.title || '')}</p>
        <ul class="sd-preview-list">
            ${top.map((c) => `
                <li><strong>${typeof sdEscape === 'function' ? sdEscape(c.supplier) : c.supplier}</strong>
                    · USD ${typeof sdFmtUsd === 'function' ? sdFmtUsd(c.totalUsd) : c.totalUsd}
                    · ${(c.lines || []).length} line(s)</li>
            `).join('')}
            ${pack.caseCount > 6 ? `<li class="muted">…and ${pack.caseCount - 6} more supplier(s)</li>` : ''}
        </ul>
        <div class="module-actions">
            <button type="button" class="btn btn-success btn-sm" id="${host.confirmCreditorsBtn}">Import preview into Creditors</button>
            <button type="button" class="btn btn-ghost btn-sm" id="${host.cancelCreditorsBtn}">Cancel preview</button>
        </div>
    `;
    document.getElementById(host.confirmCreditorsBtn)?.addEventListener('click', () => {
        const pending = _sdPendingByHost[hostKey]?.creditors;
        if (!pending) return;
        if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;
        const mode = document.getElementById(host.creditorsMode)?.value || 'merge';
        const result = typeof importItDirCreditorsCases === 'function'
            ? importItDirCreditorsCases(pending.cases, { mode })
            : null;
        _sdPendingByHost[hostKey].creditors = null;
        renderSdCreditorsPreview(null, hostKey);
        const statusEl = document.getElementById(host.creditorsStatus);
        if (statusEl && result) {
            statusEl.hidden = false;
            statusEl.textContent = `Excel import: ${result.added} added · ${result.updated} updated · ${result.skipped} skipped.`;
        }
        sdRefreshCreditorsViews();
        if (typeof showToast === 'function') {
            showToast(`Creditors register imported from ${pending.source || 'Excel'}.`, 'success');
        }
    });
    document.getElementById(host.cancelCreditorsBtn)?.addEventListener('click', () => {
        _sdPendingByHost[hostKey].creditors = null;
        renderSdCreditorsPreview(null, hostKey);
    });
}

function renderSdPaidPreview(paid, hostKey = 'sd') {
    const host = sdImportHost(hostKey);
    const el = document.getElementById(host.paidPreview);
    if (!el || typeof previewCreditorsPaidList !== 'function') return;
    if (!paid?.entries?.length) {
        el.hidden = true;
        el.innerHTML = '';
        return;
    }
    const preview = previewCreditorsPaidList(paid.entries.map((e) => ({ ...e, source: paid.source })));
    el.hidden = false;
    el.innerHTML = `
        <div class="sd-preview-head">
            <strong>Paid-list match preview</strong>
            <span>${preview.matched.length} match(es) · ${preview.unmatchedEntries.length} unmatched paid row(s)</span>
        </div>
        <ul class="sd-preview-list">
            ${preview.matched.slice(0, 8).map(({ rec, entry }) => `
                <li><strong>${sdEscape(rec.supplier || rec.caseNo)}</strong>
                    ${entry.invoiceNo ? ` · inv ${sdEscape(entry.invoiceNo)}` : ''}
                    ${entry.poNo ? ` · PO ${sdEscape(entry.poNo)}` : ''}
                    ${entry.paidDate ? ` · ${sdEscape(entry.paidDate)}` : ''}</li>
            `).join('') || '<li class="muted">No matches to open creditor cases.</li>'}
        </ul>
        <div class="module-actions">
            <button type="button" class="btn btn-success btn-sm" id="${host.confirmPaidBtn}"${preview.matched.length ? '' : ' disabled'}>Mark matched cases paid</button>
            <button type="button" class="btn btn-ghost btn-sm" id="${host.cancelPaidBtn}">Cancel</button>
        </div>
    `;
    document.getElementById(host.confirmPaidBtn)?.addEventListener('click', () => {
        const pending = _sdPendingByHost[hostKey]?.paid;
        if (!pending?.entries?.length) return;
        if (typeof applyCreditorsPaidList === 'function') {
            applyCreditorsPaidList(pending.entries.map((e) => ({ ...e, source: pending.source })), { force: true });
        }
        _sdPendingByHost[hostKey].paid = null;
        renderSdPaidPreview(null, hostKey);
        sdRefreshCreditorsViews();
    });
    document.getElementById(host.cancelPaidBtn)?.addEventListener('click', () => {
        _sdPendingByHost[hostKey].paid = null;
        renderSdPaidPreview(null, hostKey);
    });
}

async function handleSdCreditorsExcelFile(file, hostKey = 'sd') {
    if (!file) return;
    const host = sdImportHost(hostKey);
    const name = String(file.name || '').toLowerCase();
    if (!/\.xlsx?$/.test(name)) {
        showToast('Choose an Excel creditors workbook (.xlsx).', 'error');
        return;
    }
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;

    const statusEl = document.getElementById(host.creditorsStatus);
    if (statusEl) {
        statusEl.hidden = false;
        statusEl.textContent = `Parsing ${file.name}…`;
    }

    try {
        const pack = await parseCreditorsExcelViaApi(file);
        _sdPendingByHost[hostKey].creditors = pack;
        renderSdCreditorsPreview(pack, hostKey);
        if (statusEl) statusEl.textContent = `Ready to import ${pack.caseCount} supplier case(s) from ${file.name}.`;
        if (typeof showToast === 'function') showToast('Creditors workbook parsed — review preview, then import.', 'success');
    } catch (err) {
        _sdPendingByHost[hostKey].creditors = null;
        renderSdCreditorsPreview(null, hostKey);
        const msg = err?.message || String(err);
        if (statusEl) statusEl.textContent = msg;
        showToast(
            sdImportNetworkError(msg)
                ? 'Could not reach START-SYSTEM. Start the server, or use the built-in Nov 2025 register.'
                : msg,
            'error'
        );
    }
}

async function handleSdPaidExcelFile(file, hostKey = 'sd') {
    if (!file) return;
    const name = String(file.name || '').toLowerCase();
    if (!/\.xlsx?$/.test(name)) {
        showToast('Choose an Excel paid list (.xlsx).', 'error');
        return;
    }
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;

    try {
        const paid = await parseCreditorsPaidViaApi(file);
        _sdPendingByHost[hostKey].paid = paid;
        renderSdPaidPreview(paid, hostKey);
        if (typeof showToast === 'function') showToast('Paid list parsed — review matches, then apply.', 'success');
    } catch (err) {
        _sdPendingByHost[hostKey].paid = null;
        renderSdPaidPreview(null, hostKey);
        const msg = err?.message || String(err);
        showToast(sdImportNetworkError(msg) ? 'Could not reach START-SYSTEM for paid-list parse.' : msg, 'error');
    }
}

function initSdFileDropZone(zoneId, inputId, handler) {
    const zone = document.getElementById(zoneId);
    const input = document.getElementById(inputId);
    if (!zone || zone.dataset.ready === '1') return;
    zone.dataset.ready = '1';

    zone.addEventListener('click', () => input?.click());
    zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        zone.classList.add('is-dragover');
    });
    zone.addEventListener('dragleave', () => zone.classList.remove('is-dragover'));
    zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.classList.remove('is-dragover');
        const file = e.dataTransfer?.files?.[0];
        if (file) handler(file);
    });
    input?.addEventListener('change', () => {
        const file = input.files?.[0];
        if (file) handler(file);
        input.value = '';
    });
}

function initSdCreditorsDropZone() {
    initSdFileDropZone('sdCreditorsDropZone', 'sdCreditorsFileInput', (file) => handleSdCreditorsExcelFile(file, 'sd'));
    initSdFileDropZone('sdPaidDropZone', 'sdPaidFileInput', (file) => handleSdPaidExcelFile(file, 'sd'));
}

function initStkDafCreditorsDropZone() {
    initSdFileDropZone('stkDafCreditorsDropZone', 'stkDafCreditorsFileInput', (file) => handleSdCreditorsExcelFile(file, 'stkDaf'));
    initSdFileDropZone('stkDafPaidDropZone', 'stkDafPaidFileInput', (file) => handleSdPaidExcelFile(file, 'stkDaf'));
}
