/* guide-quotation.js — Rough guide quotation from prevailing USD/ZiG prices (Zimbabwe) */

let gqExchangeRate = { usdToZig: 26, source: 'manual-default', asOf: '' };

function ensureGuideQuotations() {
    if (!appState) return [];
    if (!Array.isArray(appState.guideQuotations)) appState.guideQuotations = [];
    return appState.guideQuotations;
}

function gqFmtUsd(n) {
    const v = Number(n);
    if (!Number.isFinite(v)) return '—';
    return `US$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function gqFmtZig(n) {
    const v = Number(n);
    if (!Number.isFinite(v)) return '—';
    return `ZiG ${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function gqUsdToZig(usd) {
    const rate = Number(gqExchangeRate.usdToZig) || 0;
    return rate > 0 ? Math.round(Number(usd || 0) * rate * 100) / 100 : 0;
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
    const note = gqExchangeRate.note ? ` · ${gqExchangeRate.note}` : '';
    el.innerHTML = rate
        ? `RBZ prevailing rate: <strong>1 USD = ${rate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} ZiG</strong> (${src}${asOf ? ` · ${asOf}` : ''})${note}`
        : 'Exchange rate unavailable — enter USD manually; ZiG will not auto-calculate.';
}

function buildGqRow(data = {}) {
    const tr = document.createElement('tr');
    tr.className = 'gq-item-row';
    const qty = data.qty != null && data.qty !== '' ? data.qty : 1;
    const desc = String(data.description || '').replace(/"/g, '&quot;');
    const unitUsd = data.unitUsd != null && data.unitUsd !== '' ? data.unitUsd : '';
    const unitZig = data.unitZig != null && data.unitZig !== '' ? data.unitZig : (unitUsd ? gqUsdToZig(unitUsd) : '');
    const source = String(data.source || '').replace(/"/g, '&quot;');
    tr.innerHTML = `
        <td class="gq-ser">1</td>
        <td><input type="text" class="form-control gq-desc" value="${desc}" placeholder="Item description"></td>
        <td><input type="number" class="form-control gq-qty" min="0" step="1" value="${qty}" inputmode="numeric"></td>
        <td><input type="number" class="form-control gq-unit-usd" min="0" step="0.01" value="${unitUsd}" inputmode="decimal" placeholder="0.00"></td>
        <td><input type="number" class="form-control gq-unit-zig" min="0" step="0.01" value="${unitZig}" inputmode="decimal" placeholder="0.00"></td>
        <td class="gq-line-usd">—</td>
        <td class="gq-line-zig">—</td>
        <td><input type="text" class="form-control gq-source" value="${source}" placeholder="Market / manual"></td>
        <td class="gq-screen-only"><button type="button" class="btn btn-danger btn-sm gq-remove-row">Remove</button></td>`;
    return tr;
}

function renumberGqRows() {
    document.querySelectorAll('#gq-table-body .gq-item-row').forEach((tr, i) => {
        const ser = tr.querySelector('.gq-ser');
        if (ser) ser.textContent = String(i + 1);
    });
}

function updateGqRowLine(tr) {
    const qty = parseFloat(tr.querySelector('.gq-qty')?.value) || 0;
    const unitUsd = parseFloat(tr.querySelector('.gq-unit-usd')?.value) || 0;
    let unitZig = parseFloat(tr.querySelector('.gq-unit-zig')?.value);
    const zigInput = tr.querySelector('.gq-unit-zig');
    if (unitUsd > 0 && (!Number.isFinite(unitZig) || tr.dataset.zigManual !== '1')) {
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
        if (e.target.classList.contains('gq-unit-usd')) tr.dataset.zigManual = '0';
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

async function gqFetchAndAddLine() {
    const query = String(document.getElementById('gqFetchQuery')?.value || '').trim();
    const category = document.getElementById('gqFetchCategory')?.value || 'laptop';
    const qty = parseInt(document.getElementById('gqFetchQty')?.value, 10) || 1;
    const status = document.getElementById('gqFetchStatus');
    if (query.length < 2) {
        if (status) { status.textContent = 'Enter brand or keywords to fetch prevailing prices.'; status.className = 'gq-fetch-status is-error'; }
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
                source = priced.source === 'manufacturer' ? 'Official site listing' : 'Web listing';
            }
        } else {
            desc = `${query} (prevailing benchmark)`;
            source = `Market avg · ${bench.sampleCount || 0} priced listing(s)`;
        }

        if (!unitUsd) {
            const top = (data.items || [])[0];
            desc = top?.title || query;
            source = 'No USD price found — enter manually';
            addGqRow({ description: desc, qty, unitUsd: '', unitZig: '', source });
            if (status) {
                status.textContent = `Added “${desc}” without unit price — enter USD manually.`;
                status.className = 'gq-fetch-status is-warn';
            }
            return;
        }

        addGqRow({
            description: desc,
            qty,
            unitUsd: Number(unitUsd).toFixed(2),
            unitZig: gqUsdToZig(unitUsd).toFixed(2),
            source
        });
        if (status) {
            status.textContent = `Added line at ${gqFmtUsd(unitUsd)} / ${gqFmtZig(gqUsdToZig(unitUsd))} per unit (${source}).`;
            status.className = 'gq-fetch-status is-ok';
        }
    } catch (err) {
        if (status) {
            status.textContent = err.message || 'Fetch failed. Is START-SYSTEM running?';
            status.className = 'gq-fetch-status is-error';
        }
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'Fetch & add line'; }
    }
}

function collectGqSnapshot() {
    const items = [];
    document.querySelectorAll('#gq-table-body .gq-item-row').forEach((tr) => {
        items.push({
            description: tr.querySelector('.gq-desc')?.value?.trim() || '',
            qty: parseFloat(tr.querySelector('.gq-qty')?.value) || 0,
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
        preparedFor: document.getElementById('gqPreparedFor')?.value?.trim() || '',
        purpose: document.getElementById('gqPurpose')?.value?.trim() || '',
        notes: document.getElementById('gqNotes')?.value?.trim() || '',
        exchangeRate: { ...gqExchangeRate },
        items,
        totals: {
            usd: document.getElementById('gqTotalUsd')?.textContent || '',
            zig: document.getElementById('gqTotalZig')?.textContent || ''
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
    set('gqPreparedFor', snap.preparedFor);
    set('gqPurpose', snap.purpose);
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
        appState.modules['guide-quotation'] = {
            ...(appState.modules['guide-quotation'] || {}),
            activeId: snap.id,
            snapshot: snap,
            savedAt: snap.updatedAt
        };
    }
    if (typeof saveState === 'function') saveState();
    if (typeof saveModule === 'function') saveModule('guide-quotation');
    const status = document.getElementById('gqSaveStatus');
    if (status) status.textContent = `Saved ${snap.ref} · ${new Date().toLocaleString()}`;
    showToast(`Guide quotation ${snap.ref} saved.`, 'success');
}

function printGuideQuotation() {
    updateGqTotals();
    const snap = collectGqSnapshot();
    const rows = snap.items.filter((r) => r.description || r.unitUsd).map((r, i) => {
        const lineUsd = (r.qty || 0) * (r.unitUsd || 0);
        const lineZig = (r.qty || 0) * (r.unitZig || gqUsdToZig(r.unitUsd));
        return `<tr>
            <td>${i + 1}</td>
            <td>${r.description.replace(/</g, '&lt;')}</td>
            <td style="text-align:right">${r.qty || 0}</td>
            <td style="text-align:right">${gqFmtUsd(r.unitUsd)}</td>
            <td style="text-align:right">${gqFmtZig(r.unitZig || gqUsdToZig(r.unitUsd))}</td>
            <td style="text-align:right">${gqFmtUsd(lineUsd)}</td>
            <td style="text-align:right">${gqFmtZig(lineZig)}</td>
            <td>${(r.source || '').replace(/</g, '&lt;')}</td>
        </tr>`;
    }).join('');

    const rate = Number(gqExchangeRate.usdToZig) || 0;
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${snap.ref || 'Guide Quotation'}</title>
<style>
body{font-family:Segoe UI,Arial,sans-serif;margin:24px;color:#111}
h1{font-size:1.2rem;margin:0 0 4px}
.meta{font-size:0.85rem;color:#444;margin-bottom:16px;line-height:1.5}
table{width:100%;border-collapse:collapse;font-size:0.82rem}
th,td{border:1px solid #ccc;padding:6px 8px;vertical-align:top}
th{background:#f3f4f6;text-align:left}
tfoot td{font-weight:700;background:#ecfdf3}
.disclaimer{margin-top:16px;font-size:0.75rem;color:#555}
</style></head><body>
<h1>ROUGH GUIDE QUOTATION — INDICATIVE BUDGET (NOT A BINDING QUOTE)</h1>
<div class="meta">
<strong>Ref:</strong> ${snap.ref || '—'} · <strong>Date:</strong> ${snap.date || '—'}<br>
<strong>Prepared for:</strong> ${snap.preparedFor || '—'}<br>
<strong>Purpose:</strong> ${snap.purpose || '—'}<br>
<strong>RBZ rate:</strong> 1 USD = ${rate.toLocaleString()} ZiG (${gqExchangeRate.source || 'RBZ'} · ${gqExchangeRate.asOf || ''})
</div>
<table>
<thead><tr><th>Ser</th><th>Description</th><th>Qty</th><th>Unit USD</th><th>Unit ZiG</th><th>Line USD</th><th>Line ZiG</th><th>Source</th></tr></thead>
<tbody>${rows}</tbody>
<tfoot><tr><td colspan="5">Grand total (indicative)</td><td style="text-align:right">${snap.totals.usd}</td><td style="text-align:right">${snap.totals.zig}</td><td></td></tr></tfoot>
</table>
${snap.notes ? `<p><strong>Notes:</strong> ${snap.notes.replace(/</g, '&lt;')}</p>` : ''}
<p class="disclaimer">Indicative prices from prevailing market sources converted at RBZ prevailing bank rate. Confirm with formal supplier quotations before procurement.</p>
</body></html>`;

    const w = window.open('', '_blank', 'width=900,height=700');
    if (!w) { showToast('Allow pop-ups to print.', 'error'); return; }
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
}

async function addItemToGuideQuotation(item) {
    if (!item) return;
    if (typeof navigateToModule === 'function') {
        await navigateToModule('guide-quotation');
    }
    if (typeof initGuideQuotationModule === 'function') {
        await initGuideQuotationModule();
    }
    await gqFetchExchangeRate(false);
    renderGqRateBanner();
    const unitUsd = item.priceUsd ?? item.price ?? '';
    addGqRow({
        description: item.title || item.description || '',
        qty: 1,
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
    const dateEl = document.getElementById('gqDate');
    if (dateEl && !dateEl.value) dateEl.value = new Date().toISOString().slice(0, 10);

    await gqFetchExchangeRate(false);
    renderGqRateBanner();

    const saved = appState?.modules?.['guide-quotation']?.snapshot;
    if (saved?.items?.length) {
        loadGqSnapshot(saved);
    } else if (!document.querySelector('#gq-table-body .gq-item-row')) {
        addGqRow({});
    }

    document.getElementById('gqAddRowBtn')?.addEventListener('click', () => addGqRow({}));
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
