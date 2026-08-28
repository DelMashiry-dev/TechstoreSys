/* market-catalog.js — Web market crawl: brand/keyword ICT grid + USD/ZiG pricing */

let marketCatalogState = {
    query: '',
    category: 'laptop',
    seriesFilter: 'all',
    items: [],
    localItems: [],
    lastResult: null
};

function mcEscape(v) {
    return String(v ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function marketCardImageHtml(row, esc) {
    const escape = esc || mcEscape;
    const letter = escape((row.title || '?').slice(0, 1) || '?');
    const ph = `<div class="market-card-img market-card-img-placeholder" aria-hidden="true"${row.imageUrl ? ' hidden' : ''}>${letter}</div>`;
    if (!row.imageUrl) return ph;
    return `<img src="${escape(row.imageUrl)}" alt="" class="market-card-img" loading="lazy" referrerpolicy="no-referrer" decoding="async" onerror="this.hidden=true;var n=this.nextElementSibling;if(n)n.hidden=false;">${ph}`;
}

async function fillMissingProductImages(rows) {
    if (!Array.isArray(rows) || !rows.length) return 0;
    const missing = rows.filter((r) => r && !r.imageUrl && (r.title || r.url));
    if (!missing.length) return 0;
    const apiBase = typeof API_BASE === 'string' ? API_BASE : '';
    try {
        const res = await fetch(`${apiBase}/api/product-images`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                items: missing.slice(0, 12).map((r) => ({
                    id: r.id || r.title,
                    title: r.title || '',
                    url: r.url || ''
                }))
            })
        });
        const data = await res.json().catch(() => ({}));
        const map = data.images || {};
        let n = 0;
        rows.forEach((r) => {
            const key = r.id || r.title;
            if (r && !r.imageUrl && key && map[key]) {
                r.imageUrl = map[key];
                n += 1;
            }
        });
        return n;
    } catch (_) {
        return 0;
    }
}

function mergeLocalCatalogForQuery(query, category) {
    if (typeof PRODUCT_SPECS_CATALOG === 'undefined' || !query) return [];
    const q = query.trim().toLowerCase();
    const parts = q.split(/\s+/).filter((p) => p.length >= 3);
    return PRODUCT_SPECS_CATALOG
        .filter((p) => {
            const blob = `${p.brand || ''} ${p.model || ''} ${p.category || ''} ${(p.specs || []).map((s) => s.join(' ')).join(' ')}`.toLowerCase();
            const brandMatch = parts.length && parts.some((part) => blob.includes(part));
            if (!brandMatch && !parts.every((part) => blob.includes(part) || part.length < 4)) {
                if (!parts.some((part) => blob.includes(part))) return false;
            }
            if (category === 'all') return true;
            if (category === 'tablet' && (p.category === 'other' || p.category === 'tablet')) return true;
            return p.category === category;
        })
        .slice(0, 8)
        .map((p, i) => {
            const proc = (p.specs || []).find((s) => /processor/i.test(s[0]))?.[1] || '';
            const ram = (p.specs || []).find((s) => /ram|memory/i.test(s[0]))?.[1] || '';
            const storage = (p.specs || []).find((s) => /storage/i.test(s[0]))?.[1] || '';
            return {
                id: `local-${p.id || i}`,
                title: `${p.brand} ${p.model}`.trim(),
                subtitle: (p.category || 'equipment').replace('_', ' '),
                series: p.model || '',
                url: '',
                priceText: '',
                price: null,
                snippet: [proc, ram, storage].filter(Boolean).join(' · '),
                imageUrl: '',
                source: 'local',
                isNew: false,
                product: p
            };
        });
}

async function fetchMarketCatalog(query, category, { force = false } = {}) {
    const apiBase = typeof API_BASE === 'string' ? API_BASE : '';
    const res = await fetch(`${apiBase}/api/market-catalog`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, brand: query, keywords: query, category, force })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) {
        throw new Error(data.error || `Market catalog failed (${res.status})`);
    }
    return data;
}

function getFilteredMarketItems() {
    const series = marketCatalogState.seriesFilter;
    const all = [...marketCatalogState.localItems, ...marketCatalogState.items];
    if (series === 'all') return all;
    return all.filter((row) => (row.series || '').toLowerCase() === series.toLowerCase());
}

function renderMarketBenchmarkBar(result) {
    const host = document.getElementById('marketCatalogBenchmarks');
    if (!host) return;
    const bench = result?.priceBenchmarks || {};
    const rate = result?.exchangeRate || {};
    if (!bench.sampleCount) {
        host.innerHTML = rate.usdToZig
            ? `<div class="market-benchmark-rate">RBZ rate: <strong>1 USD = ${mcEscape(Number(rate.usdToZig).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }))} ZiG</strong> (${mcEscape(rate.source || 'RBZ')} · ${mcEscape(rate.asOf || '')}) · <a href="${mcEscape(rate.referenceUrl || 'https://www.rbz.co.zw/index.php/research/markets/exchange-rates')}" target="_blank" rel="noopener noreferrer">RBZ exchange rates</a></div>`
            : '';
        return;
    }
    host.innerHTML = `
        <div class="market-benchmark-panel">
            <div class="market-benchmark-title">Benchmark prices (${bench.sampleCount} listing(s) with USD price)</div>
            <div class="market-benchmark-grid">
                <div><span>Low</span><strong>${mcEscape(bench.minUsdText || '')}</strong>${bench.minZiGText ? `<em>${mcEscape(bench.minZiGText)}</em>` : ''}</div>
                <div><span>Average</span><strong>${mcEscape(bench.avgUsdText || '')}</strong>${bench.avgZiGText ? `<em>${mcEscape(bench.avgZiGText)}</em>` : ''}</div>
                <div><span>High</span><strong>${mcEscape(bench.maxUsdText || '')}</strong>${bench.maxZiGText ? `<em>${mcEscape(bench.maxZiGText)}</em>` : ''}</div>
            </div>
            <div class="market-benchmark-rate">RBZ rate: <strong>1 USD = ${mcEscape(Number(rate.usdToZig || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }))} ZiG</strong> (${mcEscape(rate.source || 'RBZ')} · ${mcEscape(rate.asOf || '')}) · <a href="${mcEscape(rate.referenceUrl || 'https://www.rbz.co.zw/index.php/research/markets/exchange-rates')}" target="_blank" rel="noopener noreferrer">RBZ exchange rates</a></div>
        </div>`;
}

function renderMarketSeriesFilters(seriesList) {
    const host = document.getElementById('marketCatalogSeriesFilters');
    if (!host) return;
    const chips = ['all', ...(seriesList || [])];
    host.innerHTML = chips.map((s) => {
        const label = s === 'all' ? 'All lines' : s;
        const active = marketCatalogState.seriesFilter === s ? ' is-active' : '';
        return `<button type="button" class="market-series-chip${active}" data-market-series="${mcEscape(s)}">${mcEscape(label)}</button>`;
    }).join('');
    host.querySelectorAll('[data-market-series]').forEach((btn) => {
        btn.addEventListener('click', () => {
            marketCatalogState.seriesFilter = btn.getAttribute('data-market-series') || 'all';
            renderMarketCatalogGrid();
            renderMarketSeriesFilters(seriesList);
        });
    });
}

function renderMarketPriceBlock(row) {
    if (row.priceDisplay || row.priceText) {
        const text = row.priceDisplay || row.priceText;
        if (String(text).includes('ZiG')) {
            const [usdPart, zigPart] = String(text).split('·').map((s) => s.trim());
            return `<div class="market-card-prices">
                <span class="market-card-price">${mcEscape(usdPart)}</span>
                <span class="market-card-price-zig">${mcEscape(zigPart || '')}</span>
            </div>`;
        }
        return `<span class="market-card-price">${mcEscape(text)}</span>`;
    }
    return '<span class="market-card-price muted">Price on request</span>';
}

function renderMarketCatalogGrid() {
    const grid = document.getElementById('marketCatalogGrid');
    if (!grid) return;
    const rows = getFilteredMarketItems();
    if (!rows.length) {
        grid.innerHTML = '<div class="market-catalog-empty">No products to show — enter a brand or keywords and click <strong>Browse market</strong>.</div>';
        return;
    }

    grid.innerHTML = rows.map((row, idx) => {
        const img = marketCardImageHtml(row, mcEscape);
        const price = renderMarketPriceBlock(row);
        const badges = [
            row.isNew ? '<span class="market-badge market-badge-new">Latest</span>' : '',
            row.source === 'manufacturer' ? '<span class="market-badge market-badge-mfg">Official site</span>' :
            row.source === 'local' ? '<span class="market-badge market-badge-local">Local catalog</span>' :
            '<span class="market-badge market-badge-web">Web</span>'
        ].filter(Boolean).join('');
        const link = row.url
            ? `<a href="${mcEscape(row.url)}" target="_blank" rel="noopener noreferrer" class="market-card-link">View listing ↗</a>`
            : '';
        return `
            <article class="market-card" data-market-idx="${idx}">
                <div class="market-card-media">${img}</div>
                <div class="market-card-body">
                    <div class="market-card-badges">${badges}</div>
                    <h4 class="market-card-title">${mcEscape(row.title)}</h4>
                    ${row.subtitle ? `<p class="market-card-series">${mcEscape(row.subtitle)}</p>` : ''}
                    ${price}
                    ${row.snippet ? `<p class="market-card-snippet">${mcEscape(row.snippet)}</p>` : ''}
                    <div class="market-card-actions">
                        ${link}
                        <button type="button" class="btn btn-ghost btn-sm" data-market-quote="${idx}">Add to guide quote</button>
                        <button type="button" class="btn btn-primary btn-sm" data-market-use="${idx}">Use in spec sheet</button>
                    </div>
                </div>
            </article>`;
    }).join('');

    grid.querySelectorAll('[data-market-use]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const idx = parseInt(btn.getAttribute('data-market-use'), 10);
            useMarketCatalogItem(idx);
        });
    });
    grid.querySelectorAll('[data-market-quote]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const idx = parseInt(btn.getAttribute('data-market-quote'), 10);
            const row = rows[idx];
            if (row && typeof addItemToGuideQuotation === 'function') {
                addItemToGuideQuotation(row);
            }
        });
    });
}

async function useMarketCatalogItem(index) {
    const rows = getFilteredMarketItems();
    const row = rows[index];
    if (!row) return;

    if (row.source === 'local' && row.product) {
        if (typeof applyCatalogProductToForm === 'function') {
            applyCatalogProductToForm(row.product, `${row.product.brand} ${row.product.model}`);
        }
        const itemEl = document.getElementById('specEvalItemName');
        if (itemEl) itemEl.value = `${row.product.brand} ${row.product.model}`.trim();
        if (typeof showToast === 'function') showToast(`Loaded ${row.title} from local catalog.`, 'success');
        document.getElementById('spec-eval-table-body')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
    }

    const itemEl = document.getElementById('specEvalItemName');
    if (itemEl) itemEl.value = row.title;

    if (typeof fetchProductWebEnrich === 'function') {
        try {
            if (typeof showToast === 'function') showToast('Fetching specs from web…', 'info');
            const payload = await fetchProductWebEnrich(row.title, { force: true });
            if (payload?.ok && typeof applyWebLookupToForm === 'function') {
                applyWebLookupToForm(payload, row.title);
                if (typeof showToast === 'function') showToast(`Loaded ${row.title} into spec sheet.`, 'success');
                document.getElementById('spec-eval-table-body')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                return;
            }
        } catch (_) { /* fall through */ }
    }

    if (typeof autofillSpecEvaluationFromItemName === 'function') {
        autofillSpecEvaluationFromItemName();
    }
    if (typeof showToast === 'function') showToast(`Set item name to “${row.title}”. Review spec rows.`, 'info');
}

function setMarketCatalogStatus(msg, kind = '') {
    const el = document.getElementById('marketCatalogStatus');
    if (!el) return;
    el.textContent = msg || '';
    el.className = `market-catalog-status${kind ? ` is-${kind}` : ''}`;
}

async function runMarketCatalogBrowse({ force = false } = {}) {
    const queryInput = document.getElementById('marketCatalogBrand');
    const catSel = document.getElementById('marketCatalogCategory');
    const query = String(queryInput?.value || '').trim();
    const category = catSel?.value || 'laptop';
    if (query.length < 2) {
        setMarketCatalogStatus('Enter a brand or keywords (e.g. gaming laptop, architecture workstation, HP EliteBook).', 'error');
        return;
    }

    marketCatalogState.query = query;
    marketCatalogState.category = category;
    marketCatalogState.seriesFilter = 'all';
    marketCatalogState.localItems = mergeLocalCatalogForQuery(query, category);

    const btn = document.getElementById('marketCatalogBrowseBtn');
    if (btn) { btn.disabled = true; btn.textContent = 'Crawling web…'; }
    setMarketCatalogStatus('Searching manufacturer sites and web listings…', 'busy');
    renderMarketBenchmarkBar(null);

    try {
        const result = await fetchMarketCatalog(query, category, { force });
        marketCatalogState.lastResult = result;
        marketCatalogState.items = result.items || [];
        renderMarketSeriesFilters(result.series || []);
        renderMarketBenchmarkBar(result);
        renderMarketCatalogGrid();
        fillMissingProductImages([...marketCatalogState.localItems, ...marketCatalogState.items]).then((n) => {
            if (n) renderMarketCatalogGrid();
        });

        const localN = marketCatalogState.localItems.length;
        const webN = marketCatalogState.items.length;
        const mfgN = result.manufacturerCount || marketCatalogState.items.filter((r) => r.source === 'manufacturer').length;
        const mode = result.searchMode === 'keyword' ? 'keyword search' : (result.searchMode === 'hybrid' ? 'brand + keywords' : 'brand');
        setMarketCatalogStatus(
            `${webN} listing(s) · ${mode}${mfgN ? ` · ${mfgN} official` : ''}${localN ? ` · ${localN} local` : ''}${result.cached ? ' (cached)' : ''} · ${result.crawledAt || 'now'}`,
            'ok'
        );
    } catch (err) {
        marketCatalogState.items = [];
        renderMarketCatalogGrid();
        renderMarketBenchmarkBar(null);
        setMarketCatalogStatus(err.message || 'Market browse failed.', 'error');
        if (marketCatalogState.localItems.length) {
            renderMarketSeriesFilters([]);
            renderMarketCatalogGrid();
            fillMissingProductImages(marketCatalogState.localItems).then((n) => {
                if (n) renderMarketCatalogGrid();
            });
        }
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'Browse market'; }
    }
}

function initMarketCatalogPanel() {
    const panel = document.getElementById('marketCatalogPanel');
    if (!panel || panel.dataset.inited === '1') return;
    panel.dataset.inited = '1';

    document.getElementById('marketCatalogBrowseBtn')?.addEventListener('click', () => runMarketCatalogBrowse());
    document.getElementById('marketCatalogRefreshBtn')?.addEventListener('click', () => runMarketCatalogBrowse({ force: true }));
    document.getElementById('marketCatalogBrand')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            runMarketCatalogBrowse();
        }
    });

    const brandSel = document.getElementById('specSearchBrand');
    const marketBrand = document.getElementById('marketCatalogBrand');
    if (brandSel && marketBrand) {
        brandSel.addEventListener('change', () => {
            const v = brandSel.value;
            if (v && v !== 'Any' && !marketBrand.value.trim()) marketBrand.value = v;
        });
    }
}

window.initMarketCatalogPanel = initMarketCatalogPanel;
window.runMarketCatalogBrowse = runMarketCatalogBrowse;
