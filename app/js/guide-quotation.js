/* guide-quotation.js — Rough guide quotation (Republic of Zimbabwe PO-style layout) */

let gqExchangeRate = { usdToZig: 26, source: 'manual-default', asOf: '' };

function gqEsc(v) {
    return String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function ensureGuideQuotations() {
    if (!appState) return [];
    if (!Array.isArray(appState.guideQuotations)) appState.guideQuotations = [];
    return appState.guideQuotations;
}

function gqFmtUsd(n) {
    const v = Number(n);
    if (!Number.isFinite(v)) return '—';
    return `$ ${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function gqFmtZig(n) {
    const v = Number(n);
    if (!Number.isFinite(v)) return '—';
    return `$ ${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function gqUsdToZig(usd) {
    const rate = Number(gqExchangeRate.usdToZig) || 0;
    return rate > 0 ? Math.round(Number(usd || 0) * rate * 100) / 100 : 0;
}

function gqZigToUsd(zig) {
    const rate = Number(gqExchangeRate.usdToZig) || 0;
    return rate > 0 ? Math.round(Number(zig || 0) / rate * 100) / 100 : 0;
}

function gqFormatDisplayDate(iso) {
    if (!iso) return '';
    const d = new Date(iso.includes('T') ? iso : `${iso}T12:00:00`);
    if (Number.isNaN(d.getTime())) return iso;
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}.${mm}.${d.getFullYear()}`;
}

async function gqFetchExchangeRate(force = false) {
    const apiBase = typeof API_BASE === 'string' ? API_BASE : '';
    const url = `${apiBase}/api/exchange-rate${force ? '?force=1' : ''}`;
    try {
        const res = await fetch(url, { cache: 'no-cache' });
        const data = await res.json().catch(() => ({}));
        if (data?.ok && data.usdToZig) {
            gqExchangeRate = data;
            return data;
        }
    } catch (_) { /* offline */ }
    return gqExchangeRate;
}

function renderGqRateBanner() {
    const el = document.getElementById('gqRateBanner');
    if (!el) return;
    const rate = Number(gqExchangeRate.usdToZig) || 0;
    const src = gqExchangeRate.source || 'stored';
    const asOf = gqExchangeRate.asOf || '';
    el.innerHTML = rate
        ? `RBZ prevailing rate: <strong>1 USD = ${rate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} ZiG</strong> (${src}${asOf ? ` · ${asOf}` : ''})`
        : 'Exchange rate unavailable — enter prices manually.';
}

function populateGqBenchmarkDatalist() {
    const list = document.getElementById('gqBenchmarkList');
    if (!list || typeof ZIMBABWE_PO_BENCHMARKS === 'undefined') return;
    list.innerHTML = ZIMBABWE_PO_BENCHMARKS.map((row) =>
        `<option value="${gqEsc(row.description)}" label="${gqEsc(row.poRef)} · ${row.currency} ${row.unitPrice.toLocaleString()}"></option>`
    ).join('');
}

function buildGqRow(data = {}) {
    const tr = document.createElement('tr');
    tr.className = 'gq-item-row';
    const qty = data.qty != null && data.qty !== '' ? data.qty : 1;
    const unit = String(data.unit || 'EA').replace(/"/g, '&quot;');
    const desc = String(data.description || '').replace(/"/g, '&quot;');
    const unitUsd = data.unitUsd != null && data.unitUsd !== '' ? data.unitUsd : '';
    const unitZig = data.unitZig != null && data.unitZig !== '' ? data.unitZig : (unitUsd ? gqUsdToZig(unitUsd) : '');
    const source = String(data.source || '').replace(/"/g, '&quot;');
    tr.innerHTML = `
        <td class="gq-ser">1</td>
        <td><input type="text" class="form-control gq-desc" value="${desc}" placeholder="Item description"></td>
        <td><input type="number" class="form-control gq-qty" min="0" step="1" value="${qty}" inputmode="numeric"></td>
        <td><input type="text" class="form-control gq-unit" value="${unit}" maxlength="8"></td>
        <td><input type="number" class="form-control gq-unit-usd" min="0" step="0.01" value="${unitUsd}" inputmode="decimal"></td>
        <td><input type="number" class="form-control gq-unit-zig" min="0" step="0.01" value="${unitZig}" inputmode="decimal"></td>
        <td class="gq-line-usd">—</td>
        <td class="gq-line-zig">—</td>
        <td><input type="text" class="form-control gq-source" value="${source}" placeholder="DP / market"></td>
        <td class="gq-screen-only"><button type="button" class="btn btn-danger btn-sm gq-remove-row">Remove</button></td>`;
    return tr;
}

function renumberGqRows() {
    document.querySelectorAll('#gq-table-body .gq-item-row').forEach((tr, i) => {
        const ser = tr.querySelector('.gq-ser');
        if (ser) ser.textContent = String(i + 1).padStart(2, '0');
    });
}

function updateGqRowLine(tr) {
    const qty = parseFloat(tr.querySelector('.gq-qty')?.value) || 0;
    const unitUsd = parseFloat(tr.querySelector('.gq-unit-usd')?.value) || 0;
    let unitZig = parseFloat(tr.querySelector('.gq-unit-zig')?.value);
    const zigInput = tr.querySelector('.gq-unit-zig');
    if (unitUsd > 0 && tr.dataset.zigManual !== '1' && (!Number.isFinite(unitZig) || tr.dataset.usdManual === '1')) {
        unitZig = gqUsdToZig(unitUsd);
        if (zigInput) zigInput.value = unitZig ? unitZig.toFixed(2) : '';
    }
    const lineUsd = qty * unitUsd;
    const lineZig = qty * (Number.isFinite(unitZig) ? unitZig : gqUsdToZig(unitUsd));
    const usdEl = tr.querySelector('.gq-line-usd');
    const zigEl = tr.querySelector('.gq-line-zig');
    if (usdEl) usdEl.textContent = lineUsd > 0 ? gqFmtUsd(lineUsd) : '—';
    if (zigEl) zigEl.textContent = lineZig > 0 ? gqFmtZig(lineZig) : '—';
}

function updateGqTotals() {
    let totalUsd = 0;
    let totalZig = 0;
    document.querySelectorAll('#gq-table-body .gq-item-row').forEach((tr) => {
        updateGqRowLine(tr);
        const qty = parseFloat(tr.querySelector('.gq-qty')?.value) || 0;
        const unitUsd = parseFloat(tr.querySelector('.gq-unit-usd')?.value) || 0;
        const unitZig = parseFloat(tr.querySelector('.gq-unit-zig')?.value) || gqUsdToZig(unitUsd);
        totalUsd += qty * unitUsd;
        totalZig += qty * unitZig;
    });
    const usdEl = document.getElementById('gqTotalUsd');
    const zigEl = document.getElementById('gqTotalZig');
    if (usdEl) usdEl.textContent = totalUsd > 0 ? gqFmtUsd(totalUsd) : '—';
    if (zigEl) zigEl.textContent = totalZig > 0 ? gqFmtZig(totalZig) : '—';
}

function wireGqTableEvents() {
    const body = document.getElementById('gq-table-body');
    if (!body || body.dataset.wired === '1') return;
    body.dataset.wired = '1';
    body.addEventListener('input', (e) => {
        const tr = e.target.closest('.gq-item-row');
        if (!tr) return;
        if (e.target.classList.contains('gq-unit-zig')) tr.dataset.zigManual = '1';
        if (e.target.classList.contains('gq-unit-usd')) {
            tr.dataset.usdManual = '1';
            tr.dataset.zigManual = '0';
        }
        updateGqTotals();
    });
    body.addEventListener('click', (e) => {
        if (!e.target.classList.contains('gq-remove-row')) return;
        e.target.closest('.gq-item-row')?.remove();
        renumberGqRows();
        updateGqTotals();
    });
}

function addGqRow(data = {}) {
    const body = document.getElementById('gq-table-body');
    if (!body) return;
    body.appendChild(buildGqRow(data));
    renumberGqRows();
    updateGqTotals();
}

function findPoBenchmark(query) {
    if (typeof searchPoBenchmarks !== 'function') return null;
    const hits = searchPoBenchmarks(query);
    if (!hits.length) return null;
    const q = query.toLowerCase();
    return hits.find((r) => r.description.toLowerCase() === q) || hits[0];
}

function gqLoadDpBenchmark() {
    const query = String(document.getElementById('gqFetchQuery')?.value || '').trim();
    const qty = parseInt(document.getElementById('gqFetchQty')?.value, 10) || 1;
    const status = document.getElementById('gqFetchStatus');
    const bench = findPoBenchmark(query);
    if (!bench) {
        if (status) { status.textContent = 'No DP benchmark match — try EliteBook, ProLiant, Cisco, LaserJet.'; status.className = 'gq-fetch-status is-error'; }
        return;
    }
    let unitUsd = 0;
    let unitZig = 0;
    if (bench.currency === 'USD') {
        unitUsd = bench.unitPrice;
        unitZig = gqUsdToZig(unitUsd);
    } else {
        unitZig = bench.unitPrice;
        unitUsd = gqZigToUsd(unitZig);
    }
    addGqRow({
        description: bench.description,
        qty,
        unit: 'EA',
        unitUsd: unitUsd.toFixed(2),
        unitZig: unitZig.toFixed(2),
        source: `DP benchmark ${bench.poRef}`
    });
    if (status) {
        status.textContent = `Added ${bench.description} at ${bench.currency} ${bench.unitPrice.toLocaleString()} (${bench.poRef}).`;
        status.className = 'gq-fetch-status is-ok';
    }
}

async function gqFetchAndAddLine() {
    const query = String(document.getElementById('gqFetchQuery')?.value || '').trim();
    const category = document.getElementById('gqFetchCategory')?.value || 'laptop';
    const qty = parseInt(document.getElementById('gqFetchQty')?.value, 10) || 1;
    const status = document.getElementById('gqFetchStatus');
    if (query.length < 2) {
        if (status) { status.textContent = 'Enter brand or keywords.'; status.className = 'gq-fetch-status is-error'; }
        return;
    }
    const btn = document.getElementById('gqFetchPriceBtn');
    if (btn) { btn.disabled = true; btn.textContent = 'Fetching…'; }
    if (status) { status.textContent = 'Crawling prevailing market prices…'; status.className = 'gq-fetch-status is-busy'; }

    try {
        await gqFetchExchangeRate(false);
        renderGqRateBanner();
        const apiBase = typeof API_BASE === 'string' ? API_BASE : '';
        const res = await fetch(`${apiBase}/api/market-catalog`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, category, force: false })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) throw new Error(data.error || 'Price lookup failed');
        if (data.exchangeRate?.usdToZig) {
            gqExchangeRate = data.exchangeRate;
            renderGqRateBanner();
        }
        const bench = data.priceBenchmarks || {};
        let unitUsd = bench.avgUsd || bench.minUsd || null;
        let desc = query;
        let source = 'Market benchmark (avg)';
        if (!unitUsd) {
            const priced = (data.items || []).find((r) => r.priceUsd != null || r.price != null);
            if (priced) {
                unitUsd = priced.priceUsd ?? priced.price;
                desc = priced.title || query;
                source = priced.source === 'manufacturer' ? 'Official site' : 'Web listing';
            }
        } else {
            desc = `${query} (market benchmark)`;
            source = `Market avg · ${bench.sampleCount || 0} listing(s)`;
        }
        if (!unitUsd) {
            addGqRow({ description: (data.items || [])[0]?.title || query, qty, unit: 'EA', source: 'Enter price manually' });
            if (status) { status.textContent = 'Added without USD price — enter manually or use DP benchmark.'; status.className = 'gq-fetch-status is-warn'; }
            return;
        }
        addGqRow({
            description: desc,
            qty,
            unit: 'EA',
            unitUsd: Number(unitUsd).toFixed(2),
            unitZig: gqUsdToZig(unitUsd).toFixed(2),
            source
        });
        if (status) { status.textContent = `Added at ${gqFmtUsd(unitUsd)} per unit.`; status.className = 'gq-fetch-status is-ok'; }
    } catch (err) {
        if (status) { status.textContent = err.message || 'Fetch failed.'; status.className = 'gq-fetch-status is-error'; }
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'Web price'; }
    }
}

function collectGqSnapshot() {
    const items = [];
    document.querySelectorAll('#gq-table-body .gq-item-row').forEach((tr) => {
        items.push({
            description: tr.querySelector('.gq-desc')?.value?.trim() || '',
            qty: parseFloat(tr.querySelector('.gq-qty')?.value) || 0,
            unit: tr.querySelector('.gq-unit')?.value?.trim() || 'EA',
            unitUsd: parseFloat(tr.querySelector('.gq-unit-usd')?.value) || 0,
            unitZig: parseFloat(tr.querySelector('.gq-unit-zig')?.value) || 0,
            source: tr.querySelector('.gq-source')?.value?.trim() || ''
        });
    });
    updateGqTotals();
    return {
        id: document.getElementById('guide-quotation')?.dataset.activeId || `gq-${Date.now()}`,
        ref: document.getElementById('gqRef')?.value?.trim() || '',
        date: document.getElementById('gqDate')?.value || '',
        deliveryDate: document.getElementById('gqDeliveryDate')?.value || '',
        currency: document.getElementById('gqCurrency')?.value || 'USD',
        preparedFor: document.getElementById('gqPreparedFor')?.value?.trim() || '',
        purpose: document.getElementById('gqPurpose')?.value?.trim() || '',
        deliverTo: document.getElementById('gqDeliverTo')?.value?.trim() || 'IT DIR',
        glAccount: document.getElementById('gqGlAccount')?.value?.trim() || '3112210001',
        notes: document.getElementById('gqNotes')?.value?.trim() || '',
        exchangeRate: { ...gqExchangeRate },
        items,
        totals: {
            usd: document.getElementById('gqTotalUsd')?.textContent || '',
            zig: document.getElementById('gqTotalZig')?.textContent || '',
            usdNum: 0,
            zigNum: 0
        },
        updatedAt: new Date().toISOString()
    };
}

function loadGqSnapshot(snap) {
    if (!snap) return;
    const root = document.getElementById('guide-quotation');
    if (root && snap.id) root.dataset.activeId = snap.id;
    const set = (id, val) => { const el = document.getElementById(id); if (el && val != null) el.value = val; };
    set('gqRef', snap.ref);
    set('gqDate', snap.date || new Date().toISOString().slice(0, 10));
    set('gqDeliveryDate', snap.deliveryDate);
    set('gqCurrency', snap.currency || 'USD');
    set('gqPreparedFor', snap.preparedFor);
    set('gqPurpose', snap.purpose);
    set('gqDeliverTo', snap.deliverTo || 'IT DIR');
    set('gqGlAccount', snap.glAccount || '3112210001');
    set('gqNotes', snap.notes);
    if (snap.exchangeRate?.usdToZig) {
        gqExchangeRate = snap.exchangeRate;
        renderGqRateBanner();
    }
    const body = document.getElementById('gq-table-body');
    if (body) {
        body.innerHTML = '';
        (snap.items?.length ? snap.items : [{}]).forEach((item) => addGqRow(item));
    }
    updateGqTotals();
}

function saveGuideQuotation() {
    if (typeof canEditData === 'function' && !canEditData()) {
        showToast(typeof viewOnlyDenialMessage === 'function' ? viewOnlyDenialMessage() : 'View only.', 'error');
        return;
    }
    const snap = collectGqSnapshot();
    if (!snap.ref) {
        snap.ref = `GQ/IT/${new Date().getFullYear()}/${String(Date.now()).slice(-4)}`;
        document.getElementById('gqRef').value = snap.ref;
    }
    const list = ensureGuideQuotations();
    const idx = list.findIndex((r) => r.id === snap.id);
    if (idx >= 0) list[idx] = snap;
    else list.push(snap);
    if (appState?.modules) {
        appState.modules['guide-quotation'] = { ...(appState.modules['guide-quotation'] || {}), activeId: snap.id, snapshot: snap, savedAt: snap.updatedAt };
    }
    if (typeof saveState === 'function') saveState();
    if (typeof saveModule === 'function') saveModule('guide-quotation');
    document.getElementById('gqSaveStatus').textContent = `Saved ${snap.ref} · ${new Date().toLocaleString()}`;
    showToast(`Guide quotation ${snap.ref} saved.`, 'success');
}

function buildGqOfficialPrintHtml(snap) {
    const currency = snap.currency || 'USD';
    let totalUsd = 0;
    let totalZig = 0;
    const rows = snap.items.filter((r) => r.description).map((r, i) => {
        const lineUsd = (r.qty || 0) * (r.unitUsd || 0);
        const lineZig = (r.qty || 0) * (r.unitZig || gqUsdToZig(r.unitUsd));
        totalUsd += lineUsd;
        totalZig += lineZig;
        const ser = String(i + 1).padStart(2, '0');
        const primaryAmt = currency === 'ZiG' ? gqFmtZig(lineZig) : gqFmtUsd(lineUsd);
        const altAmt = currency === 'both'
            ? `<br><span class="gq-print-alt">${currency === 'USD' ? gqFmtZig(lineZig) : gqFmtUsd(lineUsd)}</span>`
            : '';
        return `<tr>
            <td class="gq-print-item">${ser}</td>
            <td class="gq-print-desc">${gqEsc(r.description)}</td>
            <td class="gq-print-num">${r.qty || 0}</td>
            <td class="gq-print-unit">${gqEsc(r.unit || 'EA')}</td>
            <td class="gq-print-num">${currency === 'ZiG' ? gqFmtZig(r.unitZig || gqUsdToZig(r.unitUsd)) : gqFmtUsd(r.unitUsd)}</td>
            <td class="gq-print-num">${primaryAmt}${altAmt}</td>
        </tr>`;
    }).join('');

    const primaryTotal = currency === 'ZiG' ? gqFmtZig(totalZig) : gqFmtUsd(totalUsd);
    const altTotal = currency === 'both'
        ? `<div class="gq-print-alt-total">Alt: ${currency === 'USD' ? gqFmtZig(totalZig) : gqFmtUsd(totalUsd)}</div>`
        : '';
    const currencyLabel = currency === 'both' ? 'USD / ZiG' : (currency === 'ZiG' ? 'ZWG / ZiG' : 'USD');
    const crestSrc = '../assets/zw-coat-of-arms.jpg';
    const crestFallback = '../assets/zna-logo.png';

    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${gqEsc(snap.ref || 'Guide Quotation')}</title>
<style>
@page{size:A4;margin:12mm}
body{font-family:Arial,Helvetica,sans-serif;font-size:10.5pt;color:#111;margin:0;padding:12mm}
.gq-print-crest{text-align:center;margin-bottom:6px}
.gq-print-crest img{height:72px;width:auto}
.gq-print-kicker{text-align:center;font-weight:700;font-size:11pt;letter-spacing:0.04em}
.gq-print-title{text-align:center;font-weight:700;font-size:13pt;margin:4px 0 2px}
.gq-print-subtitle{text-align:center;font-size:9pt;color:#444;margin-bottom:12px}
.gq-print-banner{background:#fff3cd;border:1px solid #f0c040;padding:6px 10px;text-align:center;font-size:9pt;font-weight:700;margin-bottom:14px}
.gq-print-top{display:flex;justify-content:space-between;gap:16px;margin-bottom:10px}
.gq-print-left{flex:1;font-size:10pt;line-height:1.45}
.gq-print-ref{border-collapse:collapse;font-size:9.5pt;margin-left:auto}
.gq-print-ref td{border:1px solid #111;padding:4px 10px}
.gq-print-ref td:first-child{font-weight:700;white-space:nowrap}
.gq-print-deliver{margin:8px 0 10px;font-size:10pt}
.gq-print-table{width:100%;border-collapse:collapse;font-size:9.5pt}
.gq-print-table th,.gq-print-table td{border:1px solid #111;padding:5px 6px;vertical-align:top}
.gq-print-table th{background:#f3f4f6;font-weight:700}
.gq-print-num{text-align:right;white-space:nowrap}
.gq-print-item{width:36px;text-align:center}
.gq-print-footer{margin-top:12px;font-size:10pt}
.gq-print-gl{font-weight:700;margin:10px 0 4px}
.gq-print-total{font-weight:700;margin:6px 0}
.gq-print-sign{display:flex;justify-content:space-between;margin-top:28px;font-size:10pt}
.gq-print-sign span{display:inline-block;min-width:180px;border-top:1px solid #111;padding-top:4px}
.gq-print-notes{margin-top:12px;font-size:9pt;color:#444}
.gq-print-alt{font-size:8.5pt;color:#555}
.gq-print-alt-total{font-size:9pt;color:#555;margin-top:2px}
.gq-print-rate{font-size:8.5pt;color:#555;margin-top:8px}
</style></head><body>
<div class="gq-print-crest">
  <img src="${crestSrc}" alt="" onerror="this.onerror=null;this.src='${crestFallback}'">
</div>
<div class="gq-print-kicker">REPUBLIC OF ZIMBABWE</div>
<div class="gq-print-title">ROUGH GUIDE QUOTATION</div>
<div class="gq-print-subtitle">Indicative budget — not an official purchase order</div>
<div class="gq-print-banner">FOR PLANNING ONLY · CONFIRM WITH FORMAL RFQ / SUPPLIER QUOTATIONS BEFORE PROCUREMENT</div>
<div class="gq-print-top">
  <div class="gq-print-left">
    <strong>Prepared for:</strong> ${gqEsc(snap.preparedFor || '—')}<br>
    <strong>Purpose:</strong> ${gqEsc(snap.purpose || '—')}<br>
    <strong>Indicative pricing source:</strong> DP benchmarks &amp; prevailing market (web)
  </div>
  <table class="gq-print-ref">
    <tr><td>Reference</td><td>${gqEsc(snap.ref || '—')}</td></tr>
    <tr><td>Date</td><td>${gqEsc(gqFormatDisplayDate(snap.date))}</td></tr>
    <tr><td>Contact</td><td>Dir of Procurement</td></tr>
    <tr><td>Telephone</td><td>0242-790016</td></tr>
    <tr><td>Delivery date</td><td>${gqEsc(gqFormatDisplayDate(snap.deliveryDate))}</td></tr>
  </table>
</div>
<div class="gq-print-deliver"><strong>Please deliver goods to:</strong> ${gqEsc(snap.deliverTo || 'IT DIR')}</div>
<table class="gq-print-table">
  <thead>
    <tr>
      <th colspan="6" style="text-align:right">Currency ${currencyLabel}</th>
    </tr>
    <tr>
      <th>Item</th><th>Description</th><th>Qty</th><th>Unit</th><th>Price/Unit</th><th>Amount</th>
    </tr>
  </thead>
  <tbody>${rows}</tbody>
</table>
<div class="gq-print-footer">
  <div class="gq-print-gl">GL ACCOUNT: ${gqEsc(snap.glAccount || '3112210001')}</div>
  <div class="gq-print-total">Total net val incl tax ${currencyLabel}: ${primaryTotal}${altTotal}</div>
  <div class="gq-print-rate">RBZ rate used: 1 USD = ${Number(snap.exchangeRate?.usdToZig || gqExchangeRate.usdToZig || 0).toLocaleString()} ZiG (${gqEsc(snap.exchangeRate?.source || gqExchangeRate.source || '')})</div>
  ${snap.notes ? `<div class="gq-print-notes"><strong>Notes:</strong> ${gqEsc(snap.notes)}</div>` : ''}
</div>
<div class="gq-print-sign">
  <span>Signature</span>
  <span>Date</span>
</div>
</body></html>`;
}

function printGuideQuotation() {
    updateGqTotals();
    const snap = collectGqSnapshot();
    const html = buildGqOfficialPrintHtml(snap);
    const w = window.open('', '_blank', 'width=920,height=780');
    if (!w) { showToast('Allow pop-ups to print.', 'error'); return; }
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
}

async function addItemToGuideQuotation(item) {
    if (!item) return;
    if (typeof navigateToModule === 'function') await navigateToModule('guide-quotation');
    if (typeof initGuideQuotationModule === 'function') await initGuideQuotationModule();
    await gqFetchExchangeRate(false);
    renderGqRateBanner();
    const unitUsd = item.priceUsd ?? item.price ?? '';
    addGqRow({
        description: item.title || item.description || '',
        qty: 1,
        unit: 'EA',
        unitUsd: unitUsd ? Number(unitUsd).toFixed(2) : '',
        unitZig: unitUsd ? gqUsdToZig(unitUsd).toFixed(2) : '',
        source: item.source === 'manufacturer' ? 'Official site' : (item.source || 'Market browser')
    });
    showToast('Added to guide quotation.', 'success');
}

async function initGuideQuotationModule() {
    const root = document.getElementById('guide-quotation');
    if (!root || root.dataset.inited === '1') return;
    root.dataset.inited = '1';

    wireGqTableEvents();
    populateGqBenchmarkDatalist();
    const dateEl = document.getElementById('gqDate');
    if (dateEl && !dateEl.value) dateEl.value = new Date().toISOString().slice(0, 10);
    const delEl = document.getElementById('gqDeliveryDate');
    if (delEl && !delEl.value) {
        const d = new Date();
        d.setDate(d.getDate() + 7);
        delEl.value = d.toISOString().slice(0, 10);
    }

    await gqFetchExchangeRate(false);
    renderGqRateBanner();

    const saved = appState?.modules?.['guide-quotation']?.snapshot;
    if (saved?.items?.length) loadGqSnapshot(saved);
    else if (!document.querySelector('#gq-table-body .gq-item-row')) addGqRow({});

    document.getElementById('gqAddRowBtn')?.addEventListener('click', () => addGqRow({}));
    document.getElementById('gqLoadBenchmarkBtn')?.addEventListener('click', gqLoadDpBenchmark);
    document.getElementById('gqFetchPriceBtn')?.addEventListener('click', () => gqFetchAndAddLine());
    document.getElementById('gqFetchQuery')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); gqFetchAndAddLine(); }
    });
    document.getElementById('gqRefreshRateBtn')?.addEventListener('click', async () => {
        await gqFetchExchangeRate(true);
        renderGqRateBanner();
        updateGqTotals();
        showToast('RBZ rate refreshed.', 'info');
    });
    document.getElementById('gqSaveBtn')?.addEventListener('click', saveGuideQuotation);
    document.getElementById('gqPrintBtn')?.addEventListener('click', printGuideQuotation);
}

window.initGuideQuotationModule = initGuideQuotationModule;
window.addItemToGuideQuotation = addItemToGuideQuotation;
window.printGuideQuotation = printGuideQuotation;
