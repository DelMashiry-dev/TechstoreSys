/* ict-compare.js — Workshop head-to-head ICT buy comparison by duty profile */

const ICT_COMPARE_HISTORY_MAX = 20;
const ICT_COMPARE_HISTORY_ITEMS_MAX = 28;

const ictCompareState = {
    items: [],
    selected: new Set(),
    dutyKey: '',
    category: 'laptop',
    extra: '',
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
    const keep = el.value || ictCompareState.dutyKey;
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
    if (keep && [...el.options].some((o) => o.value === keep)) el.value = keep;
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
    syncIctCompareCrawlButton();
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
            patchIctCompareHistorySelection();
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

function ictCompareHistoryKey(dutyKey, category, extra) {
    return `${String(dutyKey || '').trim()}::${String(category || 'laptop').trim()}::${String(extra || '').trim().toLowerCase()}`;
}

function currentIctCompareSearchKey() {
    const duty = document.getElementById('ictCompareDuty')?.value || ictCompareState.dutyKey || '';
    const category = document.getElementById('ictCompareCategory')?.value || ictCompareState.category || 'laptop';
    const extra = String(document.getElementById('ictCompareExtra')?.value || ictCompareState.extra || '').trim();
    return ictCompareHistoryKey(duty, category, extra);
}

function ensureIctCompareHistory() {
    if (typeof appState === 'undefined' || !appState) return [];
    if (!Array.isArray(appState.ictCompareHistory)) appState.ictCompareHistory = [];
    return appState.ictCompareHistory;
}

function slimIctCompareItem(row) {
    if (!row || typeof row !== 'object') return null;
    return {
        id: row.id || '',
        title: row.title || '',
        subtitle: row.subtitle || '',
        series: row.series || '',
        url: row.url || '',
        priceText: row.priceText || '',
        priceDisplay: row.priceDisplay || '',
        price: Number.isFinite(Number(row.price)) ? Number(row.price) : null,
        snippet: row.snippet || '',
        imageUrl: row.imageUrl || '',
        source: row.source || 'web',
        isNew: !!row.isNew
    };
}

function findIctCompareHistory(key) {
    const list = ensureIctCompareHistory();
    return list.find((row) => row && row.key === key) || null;
}

function ictCompareWhen(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso);
    return d.toLocaleString(undefined, {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function persistIctCompareHistory({ query, crawled, cached } = {}) {
    if (typeof appState === 'undefined' || !appState) return;
    const dutyKey = ictCompareState.dutyKey;
    const category = ictCompareState.category || 'laptop';
    const extra = String(ictCompareState.extra || '').trim();
    if (!dutyKey) return;
    const key = ictCompareHistoryKey(dutyKey, category, extra);
    const profile = typeof getLaptopDutyProfile === 'function' ? getLaptopDutyProfile(dutyKey) : null;
    const items = ictCompareState.items
        .map(slimIctCompareItem)
        .filter((row) => row && row.id)
        .slice(0, ICT_COMPARE_HISTORY_ITEMS_MAX);
    if (!items.length) return;
    const entry = {
        id: `h2h-${Date.now()}`,
        key,
        dutyKey,
        dutyLabel: profile?.label || dutyKey,
        category,
        extra,
        query: query || '',
        crawledAt: new Date().toISOString(),
        crawled: crawled !== false,
        cached: !!cached,
        selectedIds: [...ictCompareState.selected],
        items
    };
    const next = [entry, ...ensureIctCompareHistory().filter((row) => row && row.key !== key)]
        .slice(0, ICT_COMPARE_HISTORY_MAX);
    appState.ictCompareHistory = next;
    if (typeof saveState === 'function') saveState();
    renderIctCompareHistory();
    syncIctCompareCrawlButton();
}

function patchIctCompareHistorySelection() {
    const key = ictCompareHistoryKey(
        ictCompareState.dutyKey,
        ictCompareState.category,
        ictCompareState.extra
    );
    const hit = findIctCompareHistory(key);
    if (!hit) return;
    hit.selectedIds = [...ictCompareState.selected];
    if (typeof saveState === 'function') saveState();
}

function syncIctCompareCrawlButton() {
    const btn = document.getElementById('ictCompareCrawlBtn');
    if (!btn || btn.disabled) return;
    const hit = findIctCompareHistory(currentIctCompareSearchKey());
    btn.textContent = hit
        ? 'Recall saved ranking'
        : 'Crawl web & rank for this duty';
}

function categoryLabelForHistory(category) {
    const map = {
        laptop: 'Laptop',
        desktop: 'Desktop / workstation',
        tablet: 'Tablet',
        printer: 'Printer / MFP',
        server: 'Server',
        all: 'Any ICT'
    };
    return map[category] || category || 'Laptop';
}

function renderIctCompareHistory() {
    const list = document.getElementById('ictCompareHistoryList');
    if (!list) return;
    const rows = ensureIctCompareHistory();
    if (!rows.length) {
        list.innerHTML = '<li class="ict-compare-history-empty">No saved searches yet. Crawl once and it will appear here.</li>';
        return;
    }
    list.innerHTML = rows.map((row) => {
        const extra = row.extra ? ` · ${ictCmpEsc(row.extra)}` : '';
        const n = Array.isArray(row.items) ? row.items.length : 0;
        const when = ictCompareWhen(row.crawledAt);
        const source = row.crawled ? (row.cached ? 'cached crawl' : 'web crawl') : 'recalled';
        return `<li class="ict-compare-history-item">
            <button type="button" class="ict-hist-recall" data-hist-id="${ictCmpEsc(row.id)}">
                <strong>${ictCmpEsc(row.dutyLabel || row.dutyKey)}</strong>
                <span>${ictCmpEsc(categoryLabelForHistory(row.category))}${extra} · ${n} candidate(s) · ${ictCmpEsc(when)} · ${source}</span>
            </button>
            <button type="button" class="ict-hist-del" data-hist-del="${ictCmpEsc(row.id)}" aria-label="Remove saved search">&times;</button>
        </li>`;
    }).join('');
}

function applyIctCompareHistoryEntry(entry, { note } = {}) {
    if (!entry) return false;
    const dutyEl = document.getElementById('ictCompareDuty');
    const catEl = document.getElementById('ictCompareCategory');
    const extraEl = document.getElementById('ictCompareExtra');
    if (dutyEl && entry.dutyKey) dutyEl.value = entry.dutyKey;
    if (catEl && entry.category) catEl.value = entry.category;
    if (extraEl) extraEl.value = entry.extra || '';

    ictCompareState.dutyKey = entry.dutyKey || '';
    ictCompareState.category = entry.category || 'laptop';
    ictCompareState.extra = entry.extra || '';
    ictCompareState.items = (entry.items || []).map(slimIctCompareItem).filter(Boolean);
    const selected = Array.isArray(entry.selectedIds) ? entry.selectedIds.filter(Boolean) : [];
    ictCompareState.selected = new Set(
        selected.length
            ? selected
            : ictCompareState.items.slice(0, 4).map((r) => r.id).filter(Boolean)
    );
    ictCompareState.lastResult = { cached: true, fromHistory: true };

    updateIctCompareDutyHint();
    renderIctCompareGrid();
    renderIctCompareTable();
    renderIctCompareHistory();
    syncIctCompareCrawlButton();

    const n = ictCompareState.items.length;
    const when = ictCompareWhen(entry.crawledAt);
    setIctCompareStatus(
        note
            || `${n} candidate(s) recalled for ${entry.dutyLabel || entry.dutyKey}${when ? ` (saved ${when})` : ''}. Not crawled — use Force refresh crawl for new web results.`,
        n ? 'ok' : 'warn'
    );
    return true;
}

function deleteIctCompareHistory(id) {
    if (typeof appState === 'undefined' || !appState) return;
    appState.ictCompareHistory = ensureIctCompareHistory().filter((row) => row && row.id !== id);
    if (typeof saveState === 'function') saveState();
    renderIctCompareHistory();
    syncIctCompareCrawlButton();
}

function clearIctCompareHistory() {
    const go = typeof confirmAction === 'function'
        ? confirmAction('Clear all saved head-to-head searches? This does not delete the local product catalog.')
        : window.confirm('Clear all saved head-to-head searches?');
    if (!go) return;
    if (typeof appState !== 'undefined' && appState) {
        appState.ictCompareHistory = [];
        if (typeof saveState === 'function') saveState();
    }
    renderIctCompareHistory();
    syncIctCompareCrawlButton();
    if (typeof showToast === 'function') showToast('Head-to-head search history cleared.', 'info');
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
    const historyKey = ictCompareHistoryKey(profile.key, category, extra);

    if (!force) {
        const saved = findIctCompareHistory(historyKey);
        if (saved && Array.isArray(saved.items) && saved.items.length) {
            applyIctCompareHistoryEntry(saved);
            return;
        }
    }

    ictCompareState.dutyKey = profile.key;
    ictCompareState.category = category;
    ictCompareState.extra = extra;
    ictCompareState.selected = new Set();

    if (typeof rememberSearchTerm === 'function' && extra) {
        rememberSearchTerm('ictCompareExtra', extra);
    }

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
        const saved = findIctCompareHistory(historyKey);
        if (saved && Array.isArray(saved.items) && saved.items.length) {
            applyIctCompareHistoryEntry(saved, {
                note: `${err.message || 'Web crawl failed'} — showing last saved ranking instead.`
            });
            if (btn) {
                btn.disabled = false;
                syncIctCompareCrawlButton();
            }
            return;
        }
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
    persistIctCompareHistory({
        query,
        crawled: true,
        cached: !!result?.cached
    });
    renderIctCompareGrid();
    renderIctCompareTable();

    const n = ictCompareState.items.length;
    const picked = ictCompareState.selected.size;
    setIctCompareStatus(
        n
            ? `${n} candidate(s) ranked for ${profile.label}. Top ${picked} selected for the ranked bar chart.${result?.cached ? ' (server cache — not a new web crawl)' : ' Saved to previous searches.'}`
            : 'No candidates. Check START-SYSTEM is running for web crawl, or widen keywords.',
        n ? 'ok' : 'warn'
    );
    if (btn) {
        btn.disabled = false;
        syncIctCompareCrawlButton();
    }
}

function initIctCompareModule() {
    const root = document.getElementById('ict-compare');
    if (!root) return;
    fillIctCompareDutySelect();
    updateIctCompareDutyHint();
    renderIctCompareHistory();
    if (root.dataset.inited === '1') {
        if (!ictCompareState.items.length) {
            const latest = ensureIctCompareHistory()[0];
            if (latest) applyIctCompareHistoryEntry(latest);
        }
        syncIctCompareCrawlButton();
        return;
    }
    root.dataset.inited = '1';
    document.getElementById('ictCompareDuty')?.addEventListener('change', updateIctCompareDutyHint);
    document.getElementById('ictCompareCategory')?.addEventListener('change', syncIctCompareCrawlButton);
    document.getElementById('ictCompareExtra')?.addEventListener('input', syncIctCompareCrawlButton);
    document.getElementById('ictCompareCrawlBtn')?.addEventListener('click', () => runIctCompareCrawl({ force: false }));
    document.getElementById('ictCompareRefreshBtn')?.addEventListener('click', () => runIctCompareCrawl({ force: true }));
    document.getElementById('ictCompareClearBtn')?.addEventListener('click', () => {
        ictCompareState.items = [];
        ictCompareState.selected = new Set();
        renderIctCompareGrid();
        renderIctCompareTable();
        setIctCompareStatus('Comparison cleared. Previous searches are still saved below.');
    });
    document.getElementById('ictCompareClearHistoryBtn')?.addEventListener('click', clearIctCompareHistory);
    document.getElementById('ictCompareHistoryList')?.addEventListener('click', (e) => {
        const del = e.target.closest('[data-hist-del]');
        if (del) {
            deleteIctCompareHistory(del.getAttribute('data-hist-del'));
            return;
        }
        const recall = e.target.closest('[data-hist-recall]');
        if (!recall) return;
        const id = recall.getAttribute('data-hist-id');
        const entry = ensureIctCompareHistory().find((row) => row && row.id === id);
        if (entry) applyIctCompareHistoryEntry(entry);
    });
    const latest = ensureIctCompareHistory()[0];
    if (latest) applyIctCompareHistoryEntry(latest);
}

window.initIctCompareModule = initIctCompareModule;
window.runIctCompareCrawl = runIctCompareCrawl;
