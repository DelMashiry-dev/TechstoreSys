/* ict-compare.js — Workshop head-to-head ICT buy comparison by duty profile */

const ictCompareState = {
    items: [],
    selected: new Set(),
    dutyKey: '',
    category: 'laptop',
    lastResult: null
};

function ictCmpEsc(v) {
    return String(v ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function fillIctCompareDutySelect() {
    const el = document.getElementById('ictCompareDuty');
    if (!el || typeof laptopDutyProfileOptions !== 'function') return;
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
        `<optgroup label="${ictCmpEsc(g)}">${groups[g].map((o) => (
            `<option value="${ictCmpEsc(o.value)}">${ictCmpEsc(o.label)}</option>`
        )).join('')}</optgroup>`
    )).join('');
}

function updateIctCompareDutyHint() {
    const hint = document.getElementById('ictCompareDutyHint');
    const profile = typeof getLaptopDutyProfile === 'function'
        ? getLaptopDutyProfile(document.getElementById('ictCompareDuty')?.value)
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

function ictCompareDutyScore(row, profile) {
    const blob = `${row.title || ''} ${row.snippet || ''} ${row.subtitle || ''} ${row.series || ''}`.toLowerCase();
    let score = 35;
    if (!profile) return score;
    const key = profile.key;
    if (profile.group === 'field' && /rugged|toughbook|mil-std|ip6[0-6]|outdoor/.test(blob)) score += 22;
    if (key === 'machine-learning' && /rtx|npu|ultra|gpu|ai pc|core ultra/.test(blob)) score += 22;
    if (key === 'simulations' && /rtx|gpu|workstation|zbook|precision|legion|omen/.test(blob)) score += 22;
    if (key === 'software-engineering' && /32 gb|ultra|ryzen 9|i9|workstation/.test(blob)) score += 16;
    if (key === 'programming' && /thinkpad|elitebook|latitude|16 gb/.test(blob)) score += 14;
    if (key === 'graphic-design' && /oled|creator|macbook|rtx|studio/.test(blob)) score += 18;
    if (key === 'architecture' && /zbook|precision|rtx|cad|workstation/.test(blob)) score += 20;
    if (key === 'drone-robot' && /rugged|toughbook|wwan|outdoor/.test(blob)) score += 20;
    if (key === 'outdoor-field' && /rugged|ip65|hot.?swap|toughbook/.test(blob)) score += 24;
    if (row.source === 'manufacturer') score += 6;
    if (row.source === 'local') score += 4;
    if (row.price && row.price > 0) score += 4;
    return Math.max(8, Math.min(99, score));
}

function ictCompareParseRam(row) {
    const t = `${row.snippet || ''} ${row.title || ''}`;
    const m = t.match(/(\d+)\s*GB/i);
    return m ? `${m[1]} GB` : '—';
}

function getIctCompareVisibleItems() {
    return ictCompareState.items;
}

function renderIctCompareGrid() {
    const grid = document.getElementById('ictCompareGrid');
    if (!grid) return;
    const rows = getIctCompareVisibleItems();
    const profile = typeof getLaptopDutyProfile === 'function'
        ? getLaptopDutyProfile(ictCompareState.dutyKey)
        : null;
    if (!rows.length) {
        grid.innerHTML = '<div class="market-catalog-empty">No listings yet — crawl the web for this duty profile.</div>';
        return;
    }
    grid.innerHTML = rows.map((row, idx) => {
        const fit = ictCompareDutyScore(row, profile);
        const checked = ictCompareState.selected.has(row.id) ? ' checked' : '';
        const img = row.imageUrl
            ? `<img src="${ictCmpEsc(row.imageUrl)}" alt="" class="market-card-img" loading="lazy">`
            : `<div class="market-card-img market-card-img-placeholder" aria-hidden="true">${ictCmpEsc((row.title || '?').slice(0, 1))}</div>`;
        const price = row.priceDisplay || row.priceText || 'Price on request';
        const src = row.source === 'manufacturer' ? 'Official' : (row.source === 'local' ? 'Local catalog' : 'Web');
        return `
            <article class="market-card ict-compare-card">
                <label class="ict-compare-pick">
                    <input type="checkbox" data-ict-pick="${ictCmpEsc(row.id)}"${checked}>
                    Compare
                </label>
                <div class="market-card-media">${img}</div>
                <div class="market-card-body">
                    <h4 class="market-card-title">${ictCmpEsc(row.title)}</h4>
                    <p class="market-card-price">${ictCmpEsc(price)}</p>
                    <p class="market-card-snippet">${ictCmpEsc(row.snippet || src)}</p>
                    <div class="ict-fit-bar" title="Duty fit (not a game FPS score)">
                        <span style="width:${fit}%"></span>
                    </div>
                    <p class="muted">Duty fit ${fit}% · ${ictCmpEsc(src)}</p>
                    ${row.url ? `<a href="${ictCmpEsc(row.url)}" target="_blank" rel="noopener noreferrer" class="market-card-link">Listing ↗</a>` : ''}
                    <button type="button" class="btn btn-ghost btn-sm" data-ict-spec="${idx}">Open in Spec Evaluation</button>
                </div>
            </article>`;
    }).join('');

    grid.querySelectorAll('[data-ict-pick]').forEach((box) => {
        box.addEventListener('change', () => {
            const id = box.getAttribute('data-ict-pick');
            if (box.checked) {
                if (ictCompareState.selected.size >= 4) {
                    box.checked = false;
                    if (typeof showToast === 'function') showToast('Compare up to four machines at a time.', 'info');
                    return;
                }
                ictCompareState.selected.add(id);
            } else {
                ictCompareState.selected.delete(id);
            }
            renderIctCompareTable();
        });
    });
    grid.querySelectorAll('[data-ict-spec]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const idx = parseInt(btn.getAttribute('data-ict-spec'), 10);
            const row = rows[idx];
            if (!row) return;
            if (typeof navigateToModule === 'function') navigateToModule('spec-evaluation');
            setTimeout(() => {
                const itemEl = document.getElementById('specEvalItemName');
                if (itemEl) itemEl.value = row.title || '';
                if (row.source === 'local' && row.product && typeof applyCatalogProductToForm === 'function') {
                    applyCatalogProductToForm(row.product, row.title);
                } else if (typeof autofillSpecEvaluationFromItemName === 'function') {
                    autofillSpecEvaluationFromItemName();
                }
            }, 400);
        });
    });
}

function selectedIctCompareRows() {
    return ictCompareState.items.filter((r) => ictCompareState.selected.has(r.id));
}

function ictCompareSpecLine(row) {
    const t = `${row.title || ''} ${row.snippet || ''} ${row.subtitle || ''}`;
    const cpu = t.match(/Intel(?:\s+Core)?(?:\s+Ultra)?\s*\d*\s*[A-Z0-9-]{0,12}|AMD\s+Ryzen(?:\s+AI)?\s*[0-9][^\s,/|]{0,16}|Apple\s+M[1-5]\w*/i);
    const gpu = t.match(/RTX\s*\d{3,4}(?:\s*\d+\s*GB)?|GeForce[^\s,]{0,16}|Arc\s+\w+|Iris\s*Xe|5060(?:\s*8GB)?/i);
    const tgp = t.match(/(\d{2,3})\s*W(?:\s*TGP)?/i);
    const ram = ictCompareParseRam(row);
    const bits = [
        cpu ? cpu[0].replace(/\s+/g, ' ').trim() : '',
        gpu ? gpu[0].replace(/\s+/g, ' ').trim() : '',
        tgp ? `${tgp[1]}W` : '',
        ram !== '—' ? ram : ''
    ].filter(Boolean);
    return bits.length ? bits.join(' / ') : String(row.snippet || 'Listing specs').slice(0, 90);
}

function ictCompareScorePicks(picks, profile) {
    const scored = picks.map((row) => ({
        row,
        fit: ictCompareDutyScore(row, profile),
        price: Number(row.price) || 0
    }));
    const priced = scored.filter((s) => s.price > 0);
    const minP = priced.length ? Math.min(...priced.map((s) => s.price)) : 0;
    scored.forEach((s) => {
        const valueBonus = s.price > 0 && minP > 0 ? Math.round(18 * (minP / s.price)) : 8;
        s.buy = Math.min(99, s.fit + valueBonus);
    });
    scored.sort((a, b) => b.buy - a.buy);
    return scored;
}

function renderIctCompareChart(scored) {
    const bars = document.getElementById('ictCompareBars');
    if (!bars) return;
    const maxBuy = Math.max(...scored.map((s) => s.buy), 1);
    bars.innerHTML = `
        <div class="ict-h2h-chart">
            <div class="ict-h2h-chart-head">
                <strong>Head-to-head for this duty</strong>
                <span>Glossy pill: fill length is best-buy, inner glass length is duty fit. Ranked top to bottom — not game FPS.</span>
            </div>
            <div class="ict-h2h-legend">
                <span><i class="ict-leg ict-leg-buy"></i> Best-buy (duty fit + listed price)</span>
                <span><i class="ict-leg ict-leg-fit"></i> Duty fit</span>
            </div>
            ${scored.map((s, i) => {
                const outer = Math.max(12, Math.round((s.buy / maxBuy) * 100));
                const glass = Math.max(28, Math.min(92, Math.round((s.fit / Math.max(s.buy, 1)) * 92)));
                const winner = i === 0 ? ' is-winner' : '';
                return `<div class="ict-h2h-row${winner}">
                    <div class="ict-h2h-meta">
                        <strong>${ictCmpEsc(s.row.title)}</strong>
                        <em>${ictCmpEsc(ictCompareSpecLine(s.row))}</em>
                    </div>
                    <div class="ict-h2h-track">
                        <span class="ict-h2h-outer" style="width:${outer}%">
                            <span class="ict-h2h-inner" style="width:${glass}%"></span>
                            <span class="ict-h2h-inner-label">${s.buy}</span>
                        </span>
                    </div>
                </div>`;
            }).join('')}
        </div>`;
}

function renderIctCompareTable() {
    const body = document.getElementById('ictCompareTableBody');
    const winnerEl = document.getElementById('ictCompareWinner');
    const picks = selectedIctCompareRows();
    const profile = typeof getLaptopDutyProfile === 'function'
        ? getLaptopDutyProfile(ictCompareState.dutyKey)
        : null;

    if (!body) return;
    if (picks.length < 2) {
        body.innerHTML = '<tr><td colspan="5" class="req-empty-row">Tick at least two listings — crawl selects the top four automatically.</td></tr>';
        if (winnerEl) winnerEl.textContent = '';
        const barsEl = document.getElementById('ictCompareBars');
        if (barsEl) barsEl.innerHTML = '';
        return;
    }

    const scored = ictCompareScorePicks(picks, profile);
    const best = scored[0];

    if (winnerEl) {
        winnerEl.innerHTML = `<strong>Recommended buy:</strong> ${ictCmpEsc(best.row.title)} ` +
            `(best-buy ${best.buy} · duty fit ${best.fit}%${best.price ? ` · ${ictCmpEsc(best.row.priceDisplay || best.row.priceText)}` : ''}). ` +
            `Confirm a supplier quotation before DP F1.`;
    }

    const factorHead = scored.map((s) => `<th>${ictCmpEsc(s.row.title)}</th>`).join('');
    const theadRow = document.querySelector('#ict-compare .ict-compare-table thead tr');
    if (theadRow) theadRow.innerHTML = `<th>Factor</th>${factorHead}`;

    const factorRow = (label, fn) => `<tr><th>${ictCmpEsc(label)}</th>${scored.map((s) => `<td>${fn(s)}</td>`).join('')}</tr>`;
    body.innerHTML = [
        factorRow('CPU / GPU / TGP (from listing)', (s) => ictCmpEsc(ictCompareSpecLine(s.row))),
        factorRow('Duty fit', (s) => `${s.fit}`),
        factorRow('Best-buy score', (s) => `<strong>${s.buy}</strong>`),
        factorRow('Listed price', (s) => ictCmpEsc(s.row.priceDisplay || s.row.priceText || 'On request')),
        factorRow('Source', (s) => ictCmpEsc(s.row.source || 'web'))
    ].join('');

    renderIctCompareChart(scored);
}

function setIctCompareStatus(msg, kind = '') {
    const el = document.getElementById('ictCompareStatus');
    if (!el) return;
    el.textContent = msg || '';
    el.className = `spec-search-status${kind ? ` is-${kind}` : ''}`;
}

async function runIctCompareCrawl({ force = false } = {}) {
    const profile = typeof getLaptopDutyProfile === 'function'
        ? getLaptopDutyProfile(document.getElementById('ictCompareDuty')?.value)
        : null;
    if (!profile) {
        setIctCompareStatus('Select a duty profile first.', 'error');
        return;
    }
    const category = document.getElementById('ictCompareCategory')?.value || 'laptop';
    const extra = String(document.getElementById('ictCompareExtra')?.value || '').trim();
    const base = typeof dutyProfileWebQuery === 'function'
        ? dutyProfileWebQuery(profile, category)
        : `${profile.label} laptop`;
    const query = extra ? `${base} ${extra}` : base;

    ictCompareState.dutyKey = profile.key;
    ictCompareState.category = category;
    ictCompareState.selected = new Set();

    const local = typeof mergeLocalCatalogForQuery === 'function'
        ? mergeLocalCatalogForQuery(query, category === 'all' ? 'laptop' : category)
        : [];

    const btn = document.getElementById('ictCompareCrawlBtn');
    if (btn) { btn.disabled = true; btn.textContent = 'Crawling web…'; }
    setIctCompareStatus(`Searching for “${query}”…`, 'info');

    let webItems = [];
    let result = null;
    try {
        if (typeof fetchMarketCatalog === 'function') {
            result = await fetchMarketCatalog(query, category === 'all' ? 'laptop' : category, { force });
            webItems = result.items || [];
        }
    } catch (err) {
        setIctCompareStatus(err.message || 'Web crawl failed — showing local catalog only.', 'warn');
    }

    const merged = [...local, ...webItems];
    const seen = new Set();
    ictCompareState.items = merged.filter((row) => {
        const k = (row.id || row.title || '').toLowerCase();
        if (!k || seen.has(k)) return false;
        seen.add(k);
        return true;
    }).sort((a, b) => ictCompareDutyScore(b, profile) - ictCompareDutyScore(a, profile));

    ictCompareState.selected = new Set(
        ictCompareState.items.slice(0, 4).map((r) => r.id).filter(Boolean)
    );

    ictCompareState.lastResult = result;
    renderIctCompareGrid();
    renderIctCompareTable();

    const n = ictCompareState.items.length;
    const picked = ictCompareState.selected.size;
    setIctCompareStatus(
        n
            ? `${n} candidate(s) ranked for ${profile.label}. Top ${picked} selected for the ranked bar chart.${result?.cached ? ' (cached crawl)' : ''}`
            : 'No candidates. Check START-SYSTEM is running for web crawl, or widen keywords.',
        n ? 'ok' : 'warn'
    );
    if (btn) { btn.disabled = false; btn.textContent = 'Crawl web & rank for this duty'; }
}

function initIctCompareModule() {
    const root = document.getElementById('ict-compare');
    if (!root) return;
    fillIctCompareDutySelect();
    updateIctCompareDutyHint();
    if (root.dataset.inited === '1') return;
    root.dataset.inited = '1';
    document.getElementById('ictCompareDuty')?.addEventListener('change', updateIctCompareDutyHint);
    document.getElementById('ictCompareCrawlBtn')?.addEventListener('click', () => runIctCompareCrawl({ force: false }));
    document.getElementById('ictCompareRefreshBtn')?.addEventListener('click', () => runIctCompareCrawl({ force: true }));
    document.getElementById('ictCompareClearBtn')?.addEventListener('click', () => {
        ictCompareState.items = [];
        ictCompareState.selected = new Set();
        renderIctCompareGrid();
        renderIctCompareTable();
        setIctCompareStatus('');
    });
}

window.initIctCompareModule = initIctCompareModule;
window.runIctCompareCrawl = runIctCompareCrawl;
