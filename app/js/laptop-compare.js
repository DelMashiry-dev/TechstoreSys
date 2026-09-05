/* laptop-compare.js — Workshop Laptop Compare: rank catalog laptops and pick a winner */

const LAPTOP_COMPARE_SIDE_SPEC_ROWS = [
    { label: 'Processor', re: /processor/i },
    { label: 'RAM', re: /^ram$|memory/i },
    { label: 'Storage', re: /storage/i },
    { label: 'Graphics', re: /graphics|gpu/i },
    { label: 'Display', re: /display|screen/i },
    { label: 'OS', re: /operating system|^os$/i },
    { label: 'Security', re: /security|tpm/i },
    { label: 'Battery', re: /battery/i }
];

const laptopCompareState = {
    items: [],
    scored: [],
    dutyKey: '',
    brand: 'Any',
    minRam: 'any',
    minStorage: 'any',
    winner: null
};

function laptopCmpEsc(v) {
    return String(v ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function fillLaptopCompareDutySelect() {
    const el = document.getElementById('laptopCompareDuty');
    if (!el || typeof laptopDutyProfileOptions !== 'function') return;
    const keep = el.value || laptopCompareState.dutyKey;
    const opts = laptopDutyProfileOptions().filter((o) => o.value !== 'any');
    const groups = {};
    const order = [];
    opts.forEach((o) => {
        const g = o.group || 'Other';
        if (!groups[g]) {
            groups[g] = [];
            order.push(g);
        }
        groups[g].push(o);
    });
    el.innerHTML = order.map((g) => (
        `<optgroup label="${laptopCmpEsc(g)}">${groups[g].map((o) => (
            `<option value="${laptopCmpEsc(o.value)}">${laptopCmpEsc(o.label)}</option>`
        )).join('')}</optgroup>`
    )).join('');
    if (keep && [...el.options].some((o) => o.value === keep)) el.value = keep;
    mountLaptopCompareTypeableSelects();
}

function mountLaptopCompareTypeableSelects() {
    const mounts = [
        ['laptopCompareDuty', 'Type or pick duty profile'],
        ['laptopCompareBrand', 'Type or pick brand'],
        ['laptopCompareMinRam', 'Type or pick minimum RAM'],
        ['laptopCompareMinStorage', 'Type or pick minimum storage']
    ];
    mounts.forEach(([id, placeholder]) => {
        const el = document.getElementById(id);
        if (el && typeof mountTypeableSelect === 'function') {
            mountTypeableSelect(el, { placeholder, allowCustom: true });
        }
    });
}
function fillLaptopCompareFacets() {
    const facets = typeof SPEC_SEARCH_FACETS !== 'undefined' ? SPEC_SEARCH_FACETS : null;
    if (!facets) return;

    const fill = (id, options) => {
        const el = document.getElementById(id);
        if (!el || !options?.length) return;
        if (typeof options[0] === 'string') {
            el.innerHTML = options.map((b) => (
                `<option value="${laptopCmpEsc(b)}">${laptopCmpEsc(b === 'Any' ? 'Any brand' : b)}</option>`
            )).join('');
            return;
        }
        el.innerHTML = options.map((o) => (
            `<option value="${laptopCmpEsc(o.value)}">${laptopCmpEsc(o.label)}</option>`
        )).join('');
    };

    fill('laptopCompareBrand', facets.brands || ['Any']);
    fill('laptopCompareMinRam', facets.ramOptions || [{ value: 'any', label: 'Any' }]);
    fill('laptopCompareMinStorage', facets.storageOptions || [{ value: 'any', label: 'Any' }]);
    mountLaptopCompareTypeableSelects();
}

function updateLaptopCompareDutyHint() {
    const hint = document.getElementById('laptopCompareDutyHint');
    const profile = typeof getLaptopDutyProfile === 'function'
        ? getLaptopDutyProfile(document.getElementById('laptopCompareDuty')?.value)
        : null;
    if (!hint) return;
    if (!profile) {
        hint.textContent = '';
        hint.hidden = true;
        return;
    }
    hint.hidden = false;
    hint.textContent = `${profile.groupLabel}: ${profile.summary} ${profile.deviceHint || ''}`.trim();
}

function readLaptopCompareCriteria() {
    const dutyEl = document.getElementById('laptopCompareDuty');
    const brandEl = document.getElementById('laptopCompareBrand');
    const ramEl = document.getElementById('laptopCompareMinRam');
    const storageEl = document.getElementById('laptopCompareMinStorage');
    if (typeof resolveTypeableSelectInput === 'function') {
        resolveTypeableSelectInput(dutyEl);
        resolveTypeableSelectInput(brandEl);
        resolveTypeableSelectInput(ramEl);
        resolveTypeableSelectInput(storageEl);
    }
    return {
        dutyProfile: dutyEl?.value || '',
        brand: brandEl?.value || 'Any',
        minRamGb: ramEl?.value || 'any',
        minStorageGb: storageEl?.value || 'any'
    };
}

function lookupComparePoPrice(title) {
    if (typeof searchPoBenchmarks !== 'function') return null;
    const hits = searchPoBenchmarks(title);
    if (!hits.length) return null;
    const exact = hits.find((row) => String(row.description || '').toLowerCase().includes(String(title || '').toLowerCase().slice(0, 12)));
    return exact || hits[0];
}

function catalogHitToCompareItem(hit) {
    const p = hit.product;
    const title = `${p.brand || ''} ${p.model || ''}`.trim();
    const priceHit = lookupComparePoPrice(title);
    const price = priceHit?.unitPrice != null ? Number(priceHit.unitPrice) : null;
    const proc = (p.specs || []).find((s) => /processor/i.test(s[0]))?.[1] || '';
    const ram = (p.specs || []).find((s) => /^ram$|memory/i.test(s[0]))?.[1] || '';
    const storage = (p.specs || []).find((s) => /storage/i.test(s[0]))?.[1] || '';
    return {
        id: `local-${p.id}`,
        title,
        subtitle: p.category || 'laptop',
        snippet: [proc, ram, storage].filter(Boolean).join(' · '),
        source: 'local',
        product: p,
        catalogScore: hit.score,
        catalogReasons: hit.reasons || [],
        price,
        priceDisplay: priceHit
            ? `${priceHit.currency === 'USD' ? '$' : ''}${Number(priceHit.unitPrice).toLocaleString()}${priceHit.currency !== 'USD' ? ` ${priceHit.currency}` : ''} (${priceHit.poRef})`
            : '',
        priceText: priceHit ? String(priceHit.unitPrice) : ''
    };
}

function marketRowToCompareItem(row) {
    return {
        id: row.id || `web-${row.title}`,
        title: row.title || '',
        subtitle: row.subtitle || '',
        snippet: row.snippet || '',
        source: row.source || 'web',
        product: row.product || null,
        catalogScore: null,
        catalogReasons: [],
        price: Number(row.price) || null,
        priceDisplay: row.priceDisplay || row.priceText || '',
        priceText: row.priceText || '',
        url: row.url || ''
    };
}

function laptopCompareParseRam(row) {
    const t = `${row.snippet || ''} ${row.title || ''} ${(row.product?.specs || []).map((s) => s[1]).join(' ')}`;
    const m = t.match(/(\d+)\s*GB/i);
    return m ? `${m[1]} GB` : '—';
}

function laptopCompareSpecLine(row) {
    const t = `${row.title || ''} ${row.snippet || ''} ${row.subtitle || ''}`;
    const cpu = t.match(/Intel(?:\s+Core)?(?:\s+Ultra)?\s*\d*\s*[A-Z0-9-]{0,12}|AMD\s+Ryzen(?:\s+AI)?\s*[0-9][^\s,/|]{0,16}|Apple\s+M[1-5]\w*/i);
    const gpu = t.match(/RTX\s*\d{3,4}(?:\s*\d+\s*GB)?|GeForce[^\s,]{0,16}|Arc\s+\w+|Iris\s*Xe|integrated graphics/i);
    const ram = laptopCompareParseRam(row);
    const bits = [
        cpu ? cpu[0].replace(/\s+/g, ' ').trim() : '',
        ram !== '—' ? ram : '',
        gpu ? gpu[0].replace(/\s+/g, ' ').trim() : 'integrated graphics'
    ].filter(Boolean);
    if (bits.length) return bits.join(' / ');
    return String(row.snippet || 'See side-by-side specs').slice(0, 120);
}

function laptopCompareDutyScore(row, profile) {
    const blob = `${row.title || ''} ${row.snippet || ''} ${row.subtitle || ''}`.toLowerCase();
    let score = row.catalogScore || 35;
    if (!profile) return score;
    const key = profile.key;
    if (profile.group === 'field' && /rugged|toughbook|mil-std|ip6[0-6]|outdoor/.test(blob)) score += 22;
    if (key === 'machine-learning' && /rtx|npu|ultra|gpu|ai pc|core ultra/.test(blob)) score += 22;
    if (key === 'simulations' && /rtx|gpu|workstation|zbook|precision|legion|omen/.test(blob)) score += 22;
    if (key === 'software-engineering' && /32 gb|ultra|ryzen 9|i9|workstation/.test(blob)) score += 16;
    if (key === 'programming' && /thinkpad|elitebook|latitude|16 gb/.test(blob)) score += 14;
    if (key === 'graphic-design' && /oled|creator|macbook|rtx|studio/.test(blob)) score += 18;
    if (key === 'architecture' && /zbook|precision|rtx|cad|workstation/.test(blob)) score += 20;
    if (key === 'outdoor-field' && /rugged|ip65|hot.?swap|toughbook/.test(blob)) score += 24;
    if (row.source === 'local') score += 4;
    if (row.price && row.price > 0) score += 4;
    return Math.max(8, Math.min(99, score));
}

function laptopCompareScorePicks(picks, profile) {
    const scored = picks.map((row) => ({
        row,
        fit: row.catalogScore || laptopCompareDutyScore(row, profile),
        price: Number(row.price) || 0
    }));
    const priced = scored.filter((s) => s.price > 0);
    const minP = priced.length ? Math.min(...priced.map((s) => s.price)) : 0;
    scored.forEach((s) => {
        const valueBonus = s.price > 0 && minP > 0 ? Math.round(18 * (minP / s.price)) : 8;
        s.buy = Math.min(99, s.fit + valueBonus);
    });
    scored.sort((a, b) => b.buy - a.buy || b.fit - a.fit);
    return scored;
}

function laptopCompareSpecFromProduct(product, pattern) {
    const specs = product?.specs || [];
    const hit = specs.find(([label]) => pattern.test(String(label || '')));
    return hit ? String(hit[1] || '—').trim() : '—';
}

const COMPARE_SHOWCASE_SPECS = [
    { label: 'Display', re: /display|screen/i, fromText: /(\d{2}(?:\.\d)?\s*(?:\"|inch|-inch)[^\n,;]{0,48})/i },
    { label: 'Processor', re: /processor/i, fromText: /Intel(?:\s+Core)?(?:\s+Ultra)?\s*\d*\s*[A-Z0-9-]{0,14}|AMD\s+Ryzen(?:\s+AI)?\s*[0-9][^\s,/|]{0,18}|Apple\s+M[1-5]\w*/i },
    { label: 'RAM', re: /^ram$|memory/i, fromText: /(\d+\s*GB(?:\s*(?:RAM|LPDDR\d|DDR\d))?)/i },
    { label: 'Storage', re: /storage/i, fromText: /(\d+\s*(?:GB|TB)\s*(?:SSD|NVMe|HDD)?)/i },
    { label: 'Graphics', re: /graphics|gpu/i, fromText: /RTX\s*\d{3,4}(?:\s*\d+\s*GB)?|GeForce[^\s,]{0,16}|Arc\s+\w+|Iris\s*Xe|integrated graphics/i }
];

function getCompareLayoutMode() {
    return appState?.uiCompareLayout === 'table' ? 'table' : 'showcase';
}

function syncCompareLayoutToggle() {
    const mode = getCompareLayoutMode();
    document.querySelectorAll('[data-cmp-layout]').forEach((btn) => {
        btn.classList.toggle('is-active', btn.getAttribute('data-cmp-layout') === mode);
    });
}

function setCompareLayoutMode(mode) {
    const id = mode === 'table' ? 'table' : 'showcase';
    if (appState) appState.uiCompareLayout = id;
    if (typeof saveState === 'function') saveState();
    syncCompareLayoutToggle();
    if (typeof renderLaptopCompareResults === 'function' && laptopCompareState.items.length) {
        renderLaptopCompareResults();
    }
    if (typeof renderIctCompareTable === 'function') {
        renderIctCompareTable();
    }
}

function wireCompareLayoutToggles(root) {
    root?.querySelectorAll('[data-cmp-layout]').forEach((btn) => {
        if (btn.dataset.cmpBound === '1') return;
        btn.dataset.cmpBound = '1';
        btn.addEventListener('click', () => setCompareLayoutMode(btn.getAttribute('data-cmp-layout')));
    });
    syncCompareLayoutToggle();
}

function compareShowcaseChip(row) {
    const blob = `${row.title || ''} ${row.snippet || ''} ${row.subtitle || ''} ${(row.product?.specs || []).map((s) => s[1]).join(' ')}`;
    const intel = /intel/i.test(blob);
    const amd = /amd|ryzen/i.test(blob);
    const apple = /apple|\bm[1-5]\b/i.test(blob);
    if (intel && amd) return 'Intel/AMD';
    if (intel) return 'Intel';
    if (amd) return 'AMD';
    if (apple) return 'Apple';
    return row.product?.brand || row.subtitle || 'ICT';
}

function compareShowcaseTagline(row, profile) {
    const best = laptopCompareSpecFromProduct(row.product, /best for|form factor|device type/i);
    if (best && best !== '—') return best;
    if (row.catalogReasons?.[0]) return row.catalogReasons[0];
    if (profile?.summary) return profile.summary;
    const snip = String(row.snippet || '').trim();
    if (snip) return snip.length > 90 ? `${snip.slice(0, 87)}…` : snip;
    return 'Key specifications for duty comparison.';
}

function compareShowcaseImageSrc(row) {
    if (row.imageUrl) return row.imageUrl;
    const title = row.title || '';
    const pid = String(row.product?.id || '');
    const stockId = pid.includes('__') ? pid : (pid ? `ict-equipment__${pid}` : '');
    if (typeof resolveProductStockImage === 'function') {
        return resolveProductStockImage(title, row.product?.category || row.subtitle, null, stockId)
            || resolveProductStockImage(title, row.product?.category, null, pid)
            || '';
    }
    return '';
}

function compareShowcaseSpecValue(row, spec) {
    const fromProduct = laptopCompareSpecFromProduct(row.product, spec.re);
    if (fromProduct && fromProduct !== '—') return fromProduct;
    const blob = `${row.title || ''} ${row.snippet || ''} ${row.subtitle || ''}`;
    const m = spec.fromText ? blob.match(spec.fromText) : null;
    return m ? String(m[0]).replace(/\s+/g, ' ').trim() : '—';
}

function compareShowcasePhotoHtml(row, esc) {
    const src = compareShowcaseImageSrc(row);
    const letter = esc((row.title || '?').slice(0, 1) || '?');
    const ph = `<div class="cmp-showcase-ph" aria-hidden="true">${letter}</div>`;
    if (!src) return ph;
    return `<img src="${esc(src)}" alt="${esc(row.title || '')}" class="cmp-showcase-img" loading="lazy" referrerpolicy="no-referrer" decoding="async" onerror="this.hidden=true;var n=this.nextElementSibling;if(n)n.hidden=false;"><div class="cmp-showcase-ph" hidden aria-hidden="true">${letter}</div>`;
}

function renderCompareShowcase(host, scored, options = {}) {
    if (!host) return;
    const profile = options.profile || null;
    const extraRows = options.extraRows || [];
    const max = options.max || 4;
    const show = scored.slice(0, max);
    const specN = COMPARE_SHOWCASE_SPECS.length + extraRows.length;
    const esc = options.esc || laptopCmpEsc;

    host.hidden = !show.length;
    if (!show.length) {
        host.innerHTML = '';
        return;
    }

    host.innerHTML = `
        <div class="cmp-showcase" style="--cols:${show.length};--spec-n:${specN}">
            ${show.map((s, i) => {
                const row = s.row;
                const specs = COMPARE_SHOWCASE_SPECS.map((spec) => `
                    <div class="cmp-showcase-spec">
                        <span class="cmp-showcase-spec-label">${esc(spec.label)}</span>
                        <span class="cmp-showcase-spec-value">${esc(compareShowcaseSpecValue(row, spec))}</span>
                    </div>`).join('');
                const extras = extraRows.map((ex) => `
                    <div class="cmp-showcase-spec">
                        <span class="cmp-showcase-spec-label">${esc(ex.label)}</span>
                        <span class="cmp-showcase-spec-value">${ex.html ? ex.html(s, i) : esc(ex.value(s, i))}</span>
                    </div>`).join('');
                return `
                <article class="cmp-showcase-col${i === 0 ? ' is-winner' : ''}">
                    <p class="cmp-showcase-chip">${esc(compareShowcaseChip(row))}</p>
                    <h4 class="cmp-showcase-title">${esc(row.title || 'Unnamed item')}</h4>
                    <div class="cmp-showcase-photo">${compareShowcasePhotoHtml(row, esc)}</div>
                    <p class="cmp-showcase-tagline">${esc(compareShowcaseTagline(row, profile))}</p>
                    <div class="cmp-showcase-keyhead"><span>Key Specifications</span></div>
                    ${specs}${extras}
                </article>`;
            }).join('')}
        </div>
        ${scored.length > show.length
            ? `<p class="cmp-showcase-more">Showing top ${show.length} of ${scored.length}. Switch to Table to see every ranked item.</p>`
            : ''}`;
}

function applyCompareLayoutViews(tableWrap, showcaseEl, scored, options) {
    const mode = getCompareLayoutMode();
    syncCompareLayoutToggle();
    if (tableWrap) tableWrap.hidden = mode === 'showcase';
    if (mode === 'showcase') {
        renderCompareShowcase(showcaseEl, scored, options);
    } else if (showcaseEl) {
        showcaseEl.hidden = true;
        showcaseEl.innerHTML = '';
    }
}

function laptopCompareWhyLine(best) {
    const reasons = best.row.catalogReasons || [];
    if (reasons.length) return reasons.slice(0, 3).join('; ');
    const bits = [];
    const blob = `${best.row.title || ''} ${best.row.snippet || ''}`.toLowerCase();
    if (/ultra|i[579]|ryzen\s*9|core\s*i[579]/.test(blob)) bits.push('strong processor class');
    if (/32\s*gb|64\s*gb/.test(blob)) bits.push('32 GB RAM');
    else if (/16\s*gb/.test(blob)) bits.push('16 GB RAM');
    if (/battery|hour|wh/.test(blob)) bits.push('long battery class');
    if (/toughbook|rugged|mil-std/.test(blob)) bits.push('rugged duty fit');
    return bits.length ? bits.join('; ') : 'strongest combined duty fit and value score among ranked laptops';
}

function renderLaptopCompareChart(scored, profile) {
    const bars = document.getElementById('laptopCompareBars');
    if (!bars) return;
    const maxBuy = Math.max(...scored.map((s) => s.buy), 1);
    const dutyLabel = profile?.label || profile?.groupLabel || 'Selected duty';
    bars.innerHTML = `
        <div class="ict-buy-score-chart">
            <div class="ict-buy-score-head">
                <strong>Buy score ranking</strong>
                <span>${laptopCmpEsc(dutyLabel)} · darker bar = overall buy score · lighter inset = spec score</span>
            </div>
            <div class="ict-buy-score-legend" role="group" aria-label="Chart legend">
                <span><i class="ict-buy-score-swatch ict-buy-score-swatch-spec" aria-hidden="true"></i>Spec score</span>
                <span><i class="ict-buy-score-swatch ict-buy-score-swatch-overall" aria-hidden="true"></i>Overall buy score</span>
                <span><i class="ict-buy-score-swatch ict-buy-score-swatch-recommended" aria-hidden="true"></i>Recommended buy</span>
            </div>
            <div class="ict-buy-score-list">
            ${scored.map((s, i) => {
                const outer = Math.max(12, Math.round((s.buy / maxBuy) * 100));
                const specPct = Math.max(28, Math.min(100, Math.round((s.fit / Math.max(s.buy, 1)) * 100)));
                const winner = i === 0 ? ' is-winner' : '';
                return `<div class="ict-buy-score-row${winner}">
                    <div class="ict-buy-score-meta">
                        <strong>${laptopCmpEsc(s.row.title)}</strong>
                        <em>${laptopCmpEsc(laptopCompareSpecLine(s.row))}</em>
                    </div>
                    <div class="ict-buy-score-track" title="Overall buy score ${s.buy} · spec score ${s.fit}">
                        <span class="ict-buy-score-overall" style="width:${outer}%">
                            <span class="ict-buy-score-spec" style="width:${specPct}%"></span>
                            <span class="ict-buy-score-spec-label">${s.fit}</span>
                            <span class="ict-buy-score-value">${s.buy}</span>
                        </span>
                    </div>
                </div>`;
            }).join('')}
            </div>
        </div>`;
}

function renderLaptopCompareSideBySide(scored) {
    const body = document.getElementById('laptopCompareTableBody');
    const headRow = document.getElementById('laptopCompareSideHeadRow');
    if (!body || !headRow) return;

    const head = scored.map((s, i) => (
        `<th class="${i === 0 ? 'is-winner-col' : ''}">${laptopCmpEsc(s.row.title)}</th>`
    )).join('');
    headRow.innerHTML = `<th>Spec</th>${head}`;

    const cell = (s, i, html) => `<td class="${i === 0 ? 'is-winner-col' : ''}">${html}</td>`;
    const rows = LAPTOP_COMPARE_SIDE_SPEC_ROWS.map(({ label, re }) => {
        const cells = scored.map((s, i) => cell(
            s,
            i,
            laptopCmpEsc(laptopCompareSpecFromProduct(s.row.product, re))
        )).join('');
        return `<tr><th>${laptopCmpEsc(label)}</th>${cells}</tr>`;
    });

    rows.push(`<tr><th>Buy score</th>${scored.map((s, i) => cell(s, i, `<strong>${s.buy}</strong>`)).join('')}</tr>`);
    rows.push(`<tr><th>Price ref</th>${scored.map((s, i) => cell(s, i, laptopCmpEsc(s.row.priceDisplay || '—'))).join('')}</tr>`);
    body.innerHTML = rows.join('');
}

function renderLaptopCompareResults() {
    const panel = document.getElementById('laptopCompareResultsPanel');
    const winnerEl = document.getElementById('laptopCompareWinner');
    const sendBtn = document.getElementById('laptopCompareSendWinnerBtn');
    const profile = typeof getLaptopDutyProfile === 'function'
        ? getLaptopDutyProfile(laptopCompareState.dutyKey)
        : null;

    if (!laptopCompareState.items.length) {
        if (panel) panel.hidden = true;
        if (winnerEl) winnerEl.hidden = true;
        if (sendBtn) sendBtn.hidden = true;
        const body = document.getElementById('laptopCompareTableBody');
        if (body) body.innerHTML = '<tr><td colspan="2" class="req-empty-row">Rank laptops to compare.</td></tr>';
        const barsEl = document.getElementById('laptopCompareBars');
        if (barsEl) barsEl.innerHTML = '';
        const showcase = document.getElementById('laptopCompareShowcase');
        if (showcase) { showcase.hidden = true; showcase.innerHTML = ''; }
        laptopCompareState.scored = [];
        laptopCompareState.winner = null;
        return;
    }

    const scored = laptopCompareScorePicks(laptopCompareState.items, profile);
    laptopCompareState.scored = scored;
    const best = scored[0];
    laptopCompareState.winner = best;

    if (panel) panel.hidden = false;
    if (winnerEl && best) {
        winnerEl.hidden = false;
        winnerEl.className = 'ict-recommended-buy';
        winnerEl.innerHTML = `
            <span class="ict-recommended-buy-label">Recommended buy</span>
            <strong class="ict-recommended-buy-title">${laptopCmpEsc(best.row.title)}</strong>
            <span class="ict-recommended-buy-spec">${laptopCmpEsc(laptopCompareSpecLine(best.row))}</span>
            <span class="ict-recommended-buy-score">Buy score <strong>${best.buy}</strong> / 100 · Spec score ${best.fit}</span>
            <span class="ict-recommended-buy-why">Why: ${laptopCmpEsc(laptopCompareWhyLine(best))}.</span>
        `;
    }
    if (sendBtn) sendBtn.hidden = !best;

    renderLaptopCompareChart(scored, profile);
    renderLaptopCompareSideBySide(scored);
    applyCompareLayoutViews(
        document.getElementById('laptopCompareTableWrap'),
        document.getElementById('laptopCompareShowcase'),
        scored,
        {
            profile,
            max: 4,
            extraRows: [
                { label: 'Buy score', html: (s) => `<strong>${s.buy}</strong>` },
                { label: 'Price ref', value: (s) => s.row.priceDisplay || '—' }
            ]
        }
    );
}

function setLaptopCompareStatus(msg, kind = '') {
    const el = document.getElementById('laptopCompareStatus');
    if (!el) return;
    el.textContent = msg || '';
    el.className = `spec-search-status${kind ? ` is-${kind}` : ''}`;
}

function rankLaptopsFromCatalog() {
    const criteria = readLaptopCompareCriteria();
    const profile = typeof getLaptopDutyProfile === 'function'
        ? getLaptopDutyProfile(criteria.dutyProfile)
        : null;
    if (!profile) {
        setLaptopCompareStatus('Select a duty profile first.', 'error');
        return;
    }
    if (typeof searchCatalogByMinspec !== 'function') {
        setLaptopCompareStatus('Product catalog not loaded.', 'error');
        return;
    }

    const hits = searchCatalogByMinspec({
        productType: 'laptop',
        dutyProfile: criteria.dutyProfile,
        brand: criteria.brand,
        minRamGb: criteria.minRamGb,
        minStorageGb: criteria.minStorageGb
    }, { minResults: 5, maxResults: 50 });

    laptopCompareState.dutyKey = criteria.dutyProfile;
    laptopCompareState.brand = criteria.brand;
    laptopCompareState.minRam = criteria.minRamGb;
    laptopCompareState.minStorage = criteria.minStorageGb;
    laptopCompareState.items = hits.map(catalogHitToCompareItem);

    renderLaptopCompareResults();
    setLaptopCompareStatus(
        laptopCompareState.items.length
            ? `Ranked ${laptopCompareState.items.length} laptop(s) for ${profile.label}.`
            : 'No laptops matched — widen brand or RAM/storage filters.',
        laptopCompareState.items.length ? 'ok' : 'warn'
    );
}

async function addLiveMarketListings() {
    const criteria = readLaptopCompareCriteria();
    const profile = typeof getLaptopDutyProfile === 'function'
        ? getLaptopDutyProfile(criteria.dutyProfile)
        : null;
    if (!profile) {
        setLaptopCompareStatus('Select a duty profile first.', 'error');
        return;
    }

    const query = typeof dutyProfileWebQuery === 'function'
        ? dutyProfileWebQuery(profile, 'laptop')
        : `${profile.label} laptop`;
    const btn = document.getElementById('laptopCompareMarketBtn');
    if (btn) { btn.disabled = true; btn.textContent = 'Adding listings…'; }
    setLaptopCompareStatus(`Searching live market for “${query}”…`, 'info');

    try {
        if (typeof fetchMarketCatalog !== 'function') throw new Error('Market catalog unavailable');
        const result = await fetchMarketCatalog(query, 'laptop', { force: false });
        const webItems = (result.items || []).map(marketRowToCompareItem);
        const seen = new Set(laptopCompareState.items.map((r) => (r.title || '').toLowerCase()));
        let added = 0;
        webItems.forEach((row) => {
            const key = (row.title || '').toLowerCase();
            if (!key || seen.has(key)) return;
            seen.add(key);
            laptopCompareState.items.push(row);
            added += 1;
        });
        laptopCompareState.items.sort((a, b) => {
            const profileObj = profile;
            return laptopCompareDutyScore(b, profileObj) - laptopCompareDutyScore(a, profileObj);
        });
        renderLaptopCompareResults();
        setLaptopCompareStatus(
            added
                ? `Added ${added} live listing(s). ${laptopCompareState.items.length} laptop(s) ranked for ${profile.label}.`
                : `No new live listings — ${laptopCompareState.items.length} laptop(s) still ranked.`,
            added ? 'ok' : 'warn'
        );
    } catch (err) {
        setLaptopCompareStatus(err.message || 'Live market lookup failed.', 'error');
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'Add live market listings'; }
    }
}

function sendLaptopCompareWinnerToSpecEval() {
    const best = laptopCompareState.winner;
    if (!best?.row) return;
    const row = best.row;
    if (typeof navigateToModule === 'function') navigateToModule('spec-evaluation');
    setTimeout(() => {
        const itemEl = document.getElementById('specEvalItemName');
        if (itemEl) itemEl.value = row.title || '';
        if (row.product && typeof applyCatalogProductToForm === 'function') {
            applyCatalogProductToForm(row.product, row.title);
        } else if (typeof autofillSpecEvaluationFromItemName === 'function') {
            autofillSpecEvaluationFromItemName();
        }
        if (typeof showToast === 'function') showToast(`Winner sent to Spec Evaluation: ${row.title}`, 'info');
    }, 400);
}

function printLaptopCompareComparison() {
    if (!laptopCompareState.scored.length) {
        setLaptopCompareStatus('Rank laptops first, then print.', 'warn');
        return;
    }
    document.body.classList.add('is-printing', 'printing-laptop-compare');
    window.print();
    window.addEventListener('afterprint', () => {
        document.body.classList.remove('is-printing', 'printing-laptop-compare');
    }, { once: true });
}

function initLaptopCompareModule() {
    const root = document.getElementById('laptop-compare');
    if (!root) return;
    fillLaptopCompareDutySelect();
    fillLaptopCompareFacets();
    updateLaptopCompareDutyHint();
    if (root.dataset.inited === '1') {
        wireCompareLayoutToggles(root);
        return;
    }
    root.dataset.inited = '1';

    document.getElementById('laptopCompareDuty')?.addEventListener('change', updateLaptopCompareDutyHint);
    document.getElementById('laptopCompareRankBtn')?.addEventListener('click', rankLaptopsFromCatalog);
    document.getElementById('laptopCompareMarketBtn')?.addEventListener('click', addLiveMarketListings);
    document.getElementById('laptopComparePrintBtn')?.addEventListener('click', printLaptopCompareComparison);
    document.getElementById('laptopCompareSendWinnerBtn')?.addEventListener('click', sendLaptopCompareWinnerToSpecEval);
    wireCompareLayoutToggles(root);
}

window.initLaptopCompareModule = initLaptopCompareModule;
window.rankLaptopsFromCatalog = rankLaptopsFromCatalog;
window.getCompareLayoutMode = getCompareLayoutMode;
window.setCompareLayoutMode = setCompareLayoutMode;
window.wireCompareLayoutToggles = wireCompareLayoutToggles;
window.applyCompareLayoutViews = applyCompareLayoutViews;
window.renderCompareShowcase = renderCompareShowcase;
