/* search-history.js — predictive search suggestions from previous queries */

const SEARCH_HISTORY_KEY = 'techstores_search_history_v1';
const SEARCH_HISTORY_MAX_PER_FIELD = 40;
const SEARCH_HISTORY_SUGGEST_LIMIT = 8;

function loadSearchHistoryStore() {
    try {
        const raw = localStorage.getItem(SEARCH_HISTORY_KEY);
        const parsed = raw ? JSON.parse(raw) : {};
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (_err) {
        return {};
    }
}

function saveSearchHistoryStore(store) {
    try {
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(store));
    } catch (_err) {
        /* ignore quota / private mode */
    }
}

function getSearchFieldKey(input) {
    if (!input) return 'global';
    return (
        input.dataset.searchHistoryKey
        || input.dataset.searchTarget
        || input.dataset.searchScope
        || input.id
        || (input.placeholder || '').slice(0, 48)
        || 'global'
    );
}

function getSearchHistoryForKey(key) {
    const store = loadSearchHistoryStore();
    const list = store[key];
    return Array.isArray(list) ? list.filter((t) => typeof t === 'string' && t.trim()) : [];
}

function rememberSearchTerm(inputOrKey, term) {
    const key = typeof inputOrKey === 'string' ? inputOrKey : getSearchFieldKey(inputOrKey);
    const value = String(term || '').trim();
    if (!key || !value || value.length < 1) return;

    const store = loadSearchHistoryStore();
    const existing = Array.isArray(store[key]) ? store[key] : [];
    const next = [value, ...existing.filter((t) => t.toLowerCase() !== value.toLowerCase())]
        .slice(0, SEARCH_HISTORY_MAX_PER_FIELD);
    store[key] = next;

    // Keep a shallow global recent list for cross-field hints
    const global = Array.isArray(store.__global__) ? store.__global__ : [];
    store.__global__ = [value, ...global.filter((t) => t.toLowerCase() !== value.toLowerCase())]
        .slice(0, SEARCH_HISTORY_MAX_PER_FIELD);

    saveSearchHistoryStore(store);
}

function rankSearchSuggestion(term, query) {
    const t = term.toLowerCase();
    const q = query.toLowerCase();
    if (!q) return 10;
    if (t === q) return 100;
    if (t.startsWith(q)) return 80;
    if (t.includes(` ${q}`)) return 60;
    if (t.includes(q)) return 40;
    // soft token match
    const tokens = q.split(/\s+/).filter(Boolean);
    if (tokens.length && tokens.every((tok) => t.includes(tok))) return 30;
    return 0;
}

function getSearchSuggestions(input, query) {
    const key = getSearchFieldKey(input);
    const local = getSearchHistoryForKey(key);
    const global = getSearchHistoryForKey('__global__');
    const q = String(query || '').trim();

    const seen = new Set();
    const ranked = [];

    const push = (term, sourceBoost) => {
        const clean = String(term || '').trim();
        if (!clean) return;
        const id = clean.toLowerCase();
        if (seen.has(id)) return;
        const score = rankSearchSuggestion(clean, q) + sourceBoost;
        if (q && score < 30) return;
        seen.add(id);
        ranked.push({ term: clean, score });
    };

    local.forEach((term) => push(term, 5));
    global.forEach((term) => push(term, 0));

    return ranked
        .sort((a, b) => b.score - a.score || a.term.localeCompare(b.term))
        .slice(0, SEARCH_HISTORY_SUGGEST_LIMIT)
        .map((row) => row.term);
}

function ensureSearchSuggestUi(input) {
    if (!input) return null;
    let wrap = input.closest('.search-suggest-wrap');
    if (!wrap) {
        wrap = document.createElement('div');
        wrap.className = 'search-suggest-wrap';
        input.parentNode.insertBefore(wrap, input);
        wrap.appendChild(input);
    }

    let list = wrap.querySelector('.search-suggest-list');
    if (!list) {
        list = document.createElement('ul');
        list.className = 'search-suggest-list';
        list.hidden = true;
        list.setAttribute('role', 'listbox');
        wrap.appendChild(list);
    }

    input.setAttribute('autocomplete', 'off');
    input.setAttribute('aria-autocomplete', 'list');
    return { wrap, list };
}

function hideSearchSuggestions(input) {
    const wrap = input?.closest('.search-suggest-wrap');
    const list = wrap?.querySelector('.search-suggest-list');
    if (!list) return;
    list.hidden = true;
    list.innerHTML = '';
    input?.removeAttribute('aria-activedescendant');
}

function highlightSuggestionMatch(term, query) {
    const safe = String(term)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    const q = String(query || '').trim();
    if (!q) return safe;
    const idx = safe.toLowerCase().indexOf(q.toLowerCase());
    if (idx < 0) return safe;
    const before = safe.slice(0, idx);
    const match = safe.slice(idx, idx + q.length);
    const after = safe.slice(idx + q.length);
    return `${before}<mark>${match}</mark>${after}`;
}

function renderSearchSuggestions(input, { force = false } = {}) {
    const ui = ensureSearchSuggestUi(input);
    if (!ui) return;
    const query = input.value || '';
    const suggestions = getSearchSuggestions(input, query);

    if (!suggestions.length || (document.activeElement !== input && !force)) {
        hideSearchSuggestions(input);
        return;
    }

    // If typing something with zero history match and query present, hide
    if (query.trim() && !suggestions.length) {
        hideSearchSuggestions(input);
        return;
    }

    ui.list.innerHTML = suggestions.map((term, index) => `
        <li class="search-suggest-item" role="option" id="search-suggest-${getSearchFieldKey(input).replace(/[^a-z0-9_-]/gi, '_')}-${index}" data-value="${String(term).replace(/"/g, '&quot;')}" data-index="${index}">
            <span class="search-suggest-term">${highlightSuggestionMatch(term, query)}</span>
            <span class="search-suggest-meta">History</span>
        </li>
    `).join('');
    ui.list.hidden = false;
}

function moveSearchSuggestion(input, delta) {
    const list = input.closest('.search-suggest-wrap')?.querySelector('.search-suggest-list');
    if (!list || list.hidden) return false;
    const items = Array.from(list.querySelectorAll('.search-suggest-item'));
    if (!items.length) return false;

    let idx = items.findIndex((el) => el.classList.contains('is-active'));
    items.forEach((el) => el.classList.remove('is-active'));
    idx = idx < 0 ? (delta > 0 ? 0 : items.length - 1) : (idx + delta + items.length) % items.length;
    const active = items[idx];
    active.classList.add('is-active');
    input.setAttribute('aria-activedescendant', active.id);
    active.scrollIntoView({ block: 'nearest' });
    return true;
}

function applyActiveSearchSuggestion(input) {
    const list = input.closest('.search-suggest-wrap')?.querySelector('.search-suggest-list');
    const active = list?.querySelector('.search-suggest-item.is-active')
        || list?.querySelector('.search-suggest-item');
    if (!active) return false;
    input.value = active.getAttribute('data-value') || '';
    hideSearchSuggestions(input);
    return true;
}

function commitSearchInput(input) {
    if (!input) return;
    const term = (input.value || '').trim();
    if (term) rememberSearchTerm(input, term);
    if (typeof runTableSearch === 'function') runTableSearch(input);
    hideSearchSuggestions(input);
    // Notify custom listeners (modal filters etc.)
    input.dispatchEvent(new CustomEvent('search-history-commit', { bubbles: true, detail: { term } }));
}

function bindSearchHistory(input) {
    if (!input || input.dataset.searchHistoryBound === '1') return;
    input.dataset.searchHistoryBound = '1';
    ensureSearchSuggestUi(input);

    input.addEventListener('focus', () => {
        renderSearchSuggestions(input, { force: true });
    });

    input.addEventListener('input', () => {
        renderSearchSuggestions(input, { force: true });
    });

    input.addEventListener('keydown', (e) => {
        const list = input.closest('.search-suggest-wrap')?.querySelector('.search-suggest-list');
        const open = list && !list.hidden && list.querySelector('.search-suggest-item');

        if (e.key === 'ArrowDown' && open) {
            e.preventDefault();
            moveSearchSuggestion(input, 1);
            return;
        }
        if (e.key === 'ArrowUp' && open) {
            e.preventDefault();
            moveSearchSuggestion(input, -1);
            return;
        }
        if (e.key === 'Escape') {
            hideSearchSuggestions(input);
            return;
        }
        if (e.key === 'Enter') {
            if (open && list.querySelector('.search-suggest-item.is-active')) {
                e.preventDefault();
                applyActiveSearchSuggestion(input);
                commitSearchInput(input);
                return;
            }
            // Let caller also handle Enter; still remember
            if ((input.value || '').trim()) rememberSearchTerm(input, input.value);
            hideSearchSuggestions(input);
        }
        if (e.key === 'Tab' && open) {
            hideSearchSuggestions(input);
        }
    });

    input.addEventListener('blur', () => {
        // Delay so suggestion click can register
        setTimeout(() => hideSearchSuggestions(input), 150);
    });

    const list = input.closest('.search-suggest-wrap')?.querySelector('.search-suggest-list');
    list?.addEventListener('mousedown', (e) => {
        const item = e.target.closest('.search-suggest-item');
        if (!item) return;
        e.preventDefault();
        input.value = item.getAttribute('data-value') || '';
        commitSearchInput(input);
        input.focus();
    });
}

function initSearchHistory() {
    document.querySelectorAll('input.table-search, input[data-search-history="1"], #dayStartSearch, #dayEndSearch, #stockTxnItemSearch')
        .forEach((input) => bindSearchHistory(input));
}

function clearSearchHistoryForInput(input) {
    const key = getSearchFieldKey(input);
    const store = loadSearchHistoryStore();
    delete store[key];
    saveSearchHistoryStore(store);
    hideSearchSuggestions(input);
}
