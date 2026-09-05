/* ui-preferences.js — theme / appearance preferences */

const UI_THEMES = [
    {
        id: 'fintech',
        name: 'Fintech Soft',
        desc: 'Airy canvas, floating white cards, soft shadows (current default).',
        swatches: ['#2c3e50', '#1b5e3b', '#eef2f6', '#ffffff']
    },
    {
        id: 'classic',
        name: 'Classic Slate',
        desc: 'Traditional TechStores look — tighter corners, flatter panels.',
        swatches: ['#2c3e50', '#3498db', '#f5f7fa', '#ffffff']
    },
    {
        id: 'forest',
        name: 'Army Forest',
        desc: 'Deep green sidebar and accents — parade-ground, formal stores feel.',
        swatches: ['#14532d', '#1b4332', '#eef5f0', '#ffffff']
    },
    {
        id: 'midnight',
        name: 'Midnight Ops',
        desc: 'Elegant deep slate shell with crisp white work surfaces.',
        swatches: ['#0f172a', '#1e293b', '#e8eef5', '#ffffff']
    },
    {
        id: 'high-contrast',
        name: 'High Contrast',
        desc: 'Maximum readability — black / white / strong borders.',
        swatches: ['#000000', '#1a73e8', '#ffffff', '#f1f5f9']
    },
    {
        id: 'parade',
        name: 'Color Parade',
        desc: 'Bright teal, coral and gold — a lively look for the stores desk.',
        swatches: ['#0f766e', '#ea580c', '#f59e0b', '#fff7ed']
    }
];

const UI_DENSITIES = [
    { id: 'comfortable', name: 'Comfortable', desc: 'More padding — easier to read and click.' },
    { id: 'compact', name: 'Compact', desc: 'Tighter spacing — more on screen at once.' }
];

const UI_BTN_SIZES = [
    { id: 'small', name: 'Small', desc: 'Shorter pills — more buttons fit on the toolbar.' },
    { id: 'medium', name: 'Medium', desc: 'Standard button height and padding.' },
    { id: 'big', name: 'Big', desc: 'Larger, easier to tap — more space around the label.' }
];

const UI_FIELD_SIZES = [
    { id: 'small', name: 'Small', desc: 'Shorter date boxes, dropdowns and typed fields.' },
    { id: 'narrow', name: 'Narrow', desc: 'Slimmer fields — less side padding, more columns visible.' },
    { id: 'medium', name: 'Medium', desc: 'Standard field height and width.' },
    { id: 'big', name: 'Big', desc: 'Taller, larger type — easier to read and tap.' }
];

function normalizeUiThemeId(theme) {
    if (!theme || theme === 'normal') return 'fintech';
    if (UI_THEMES.some((t) => t.id === theme)) return theme;
    return 'fintech';
}

function normalizeUiBtnSize(size) {
    return UI_BTN_SIZES.some((s) => s.id === size) ? size : 'medium';
}

function normalizeUiFieldSize(size) {
    return UI_FIELD_SIZES.some((s) => s.id === size) ? size : 'medium';
}

function getUiPrefs() {
    const theme = normalizeUiThemeId(appState?.theme);
    const density = appState?.uiDensity === 'compact' ? 'compact' : 'comfortable';
    const btnSize = normalizeUiBtnSize(appState?.uiBtnSize);
    const fieldSize = normalizeUiFieldSize(appState?.uiFieldSize);
    return { theme, density, btnSize, fieldSize };
}

function applyTheme(theme) {
    const id = normalizeUiThemeId(theme);
    const density = appState?.uiDensity === 'compact' ? 'compact' : 'comfortable';
    const btnSize = normalizeUiBtnSize(appState?.uiBtnSize);
    const fieldSize = normalizeUiFieldSize(appState?.uiFieldSize);

    document.body.classList.remove(
        'high-contrast',
        'theme-fintech',
        'theme-classic',
        'theme-forest',
        'theme-midnight',
        'theme-high-contrast',
        'theme-parade',
        'density-comfortable',
        'density-compact',
        'btn-size-small',
        'btn-size-medium',
        'btn-size-big',
        'field-size-small',
        'field-size-narrow',
        'field-size-medium',
        'field-size-big'
    );
    document.body.classList.add(
        `theme-${id}`,
        `density-${density}`,
        `btn-size-${btnSize}`,
        `field-size-${fieldSize}`
    );
    document.body.setAttribute('data-theme', id);
    document.body.setAttribute('data-density', density);
    document.body.setAttribute('data-btn-size', btnSize);
    document.body.setAttribute('data-field-size', fieldSize);

    if (id === 'high-contrast') {
        document.body.classList.add('high-contrast');
    }

    if (appState) {
        appState.theme = id;
        appState.uiBtnSize = btnSize;
        appState.uiFieldSize = fieldSize;
    }

    const label = UI_THEMES.find((t) => t.id === id)?.name || 'Theme';
    const btn = document.getElementById('themeToggle');
    if (btn) {
        btn.textContent = 'Appearance';
        btn.title = `Appearance — ${label} · buttons ${btnSize} · fields ${fieldSize}`;
    }

    const sel = document.getElementById('uiThemeSelect');
    if (sel && sel.value !== id) sel.value = id;

    document.querySelectorAll('.ui-theme-card').forEach((card) => {
        card.classList.toggle('is-selected', card.getAttribute('data-theme-id') === id);
    });
    document.querySelectorAll('.ui-density-card').forEach((card) => {
        card.classList.toggle('is-selected', card.getAttribute('data-density-id') === density);
    });
    document.querySelectorAll('.ui-size-card[data-btn-size-id]').forEach((card) => {
        card.classList.toggle('is-selected', card.getAttribute('data-btn-size-id') === btnSize);
    });
    document.querySelectorAll('.ui-size-card[data-field-size-id]').forEach((card) => {
        card.classList.toggle('is-selected', card.getAttribute('data-field-size-id') === fieldSize);
    });
}

function applyUiDensity(density) {
    const d = density === 'compact' ? 'compact' : 'comfortable';
    if (appState) appState.uiDensity = d;
    applyTheme(appState?.theme || 'fintech');
}

function setUiTheme(themeId, { save = true } = {}) {
    if (appState) appState.theme = normalizeUiThemeId(themeId);
    applyTheme(appState?.theme);
    if (save && typeof saveState === 'function') saveState();
    if (typeof showToast === 'function') {
        const name = UI_THEMES.find((t) => t.id === appState.theme)?.name;
        showToast(`Theme: ${name}`, 'info');
    }
}

function setUiDensity(densityId, { save = true } = {}) {
    applyUiDensity(densityId);
    if (save && typeof saveState === 'function') saveState();
    if (typeof showToast === 'function') {
        showToast(`Density: ${densityId === 'compact' ? 'Compact' : 'Comfortable'}`, 'info');
    }
}

function setUiBtnSize(sizeId, { save = true } = {}) {
    const size = normalizeUiBtnSize(sizeId);
    if (appState) appState.uiBtnSize = size;
    applyTheme(appState?.theme || 'fintech');
    if (save && typeof saveState === 'function') saveState();
    if (typeof showToast === 'function') {
        const name = UI_BTN_SIZES.find((s) => s.id === size)?.name || size;
        showToast(`Buttons: ${name}`, 'info');
    }
}

function setUiFieldSize(sizeId, { save = true } = {}) {
    const size = normalizeUiFieldSize(sizeId);
    if (appState) appState.uiFieldSize = size;
    applyTheme(appState?.theme || 'fintech');
    if (save && typeof saveState === 'function') saveState();
    if (typeof showToast === 'function') {
        const name = UI_FIELD_SIZES.find((s) => s.id === size)?.name || size;
        showToast(`Fields: ${name}`, 'info');
    }
}

function renderUiPreferencesPanel() {
    const themeHost = document.getElementById('uiThemeCards');
    const densHost = document.getElementById('uiDensityCards');
    const btnHost = document.getElementById('uiBtnSizeCards');
    const fieldHost = document.getElementById('uiFieldSizeCards');
    if (!themeHost || !densHost) return;
    const prefs = getUiPrefs();

    themeHost.innerHTML = UI_THEMES.map((t) => `
        <button type="button" class="ui-theme-card ${t.id === prefs.theme ? 'is-selected' : ''}" data-theme-id="${t.id}">
            <div class="ui-theme-swatches" aria-hidden="true">
                ${t.swatches.map((c) => `<span style="background:${c}"></span>`).join('')}
            </div>
            <strong>${t.name}</strong>
            <p>${t.desc}</p>
        </button>`).join('');

    densHost.innerHTML = UI_DENSITIES.map((d) => `
        <button type="button" class="ui-density-card ${d.id === prefs.density ? 'is-selected' : ''}" data-density-id="${d.id}">
            <strong>${d.name}</strong>
            <p>${d.desc}</p>
        </button>`).join('');

    if (btnHost) {
        btnHost.innerHTML = UI_BTN_SIZES.map((s) => `
            <button type="button" class="ui-size-card ${s.id === prefs.btnSize ? 'is-selected' : ''}" data-btn-size-id="${s.id}">
                <span class="ui-size-preview ui-size-preview-btn ui-size-preview--${s.id}" aria-hidden="true">Button</span>
                <strong>${s.name}</strong>
                <p>${s.desc}</p>
            </button>`).join('');
    }
    if (fieldHost) {
        fieldHost.innerHTML = UI_FIELD_SIZES.map((s) => `
            <button type="button" class="ui-size-card ${s.id === prefs.fieldSize ? 'is-selected' : ''}" data-field-size-id="${s.id}">
                <span class="ui-size-preview ui-size-preview-field ui-size-preview--${s.id}" aria-hidden="true">15 Aug, 2026</span>
                <strong>${s.name}</strong>
                <p>${s.desc}</p>
            </button>`).join('');
    }
}

function openUiPreferences() {
    const modal = document.getElementById('uiPrefsModal');
    if (!modal) return;
    renderUiPreferencesPanel();
    modal.hidden = false;
    modal.classList.add('is-open');
    document.body.classList.add('ui-prefs-open');
}

function closeUiPreferences() {
    const modal = document.getElementById('uiPrefsModal');
    if (!modal) return;
    modal.hidden = true;
    modal.classList.remove('is-open');
    document.body.classList.remove('ui-prefs-open');
}

function initUiPreferences() {
    if (document.documentElement.dataset.uiPrefsInit === '1') return;
    document.documentElement.dataset.uiPrefsInit = '1';

    // Migrate legacy "normal"
    if (appState && (appState.theme === 'normal' || !appState.theme)) {
        appState.theme = 'fintech';
    }
    if (appState && !appState.uiDensity) appState.uiDensity = 'comfortable';
    if (appState && !appState.uiBtnSize) appState.uiBtnSize = 'medium';
    if (appState && !appState.uiFieldSize) appState.uiFieldSize = 'medium';
    applyTheme(appState?.theme || 'fintech');

    document.getElementById('uiPrefsCloseBtn')?.addEventListener('click', closeUiPreferences);
    document.getElementById('uiPrefsBackdrop')?.addEventListener('click', closeUiPreferences);
    document.getElementById('uiPrefsDoneBtn')?.addEventListener('click', closeUiPreferences);
    document.getElementById('uiPrefsResetNavOrder')?.addEventListener('click', () => {
        if (typeof resetNavMenuOrder === 'function') resetNavMenuOrder();
    });

    document.getElementById('uiPrefsModal')?.addEventListener('click', (e) => {
        const themeId = e.target.closest('[data-theme-id]')?.getAttribute('data-theme-id');
        if (themeId) {
            setUiTheme(themeId);
            return;
        }
        const densId = e.target.closest('[data-density-id]')?.getAttribute('data-density-id');
        if (densId) {
            setUiDensity(densId);
            return;
        }
        const btnSizeId = e.target.closest('[data-btn-size-id]')?.getAttribute('data-btn-size-id');
        if (btnSizeId) {
            setUiBtnSize(btnSizeId);
            return;
        }
        const fieldSizeId = e.target.closest('[data-field-size-id]')?.getAttribute('data-field-size-id');
        if (fieldSizeId) setUiFieldSize(fieldSizeId);
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && document.body.classList.contains('ui-prefs-open')) {
            closeUiPreferences();
        }
    });
}

window.UI_THEMES = UI_THEMES;
window.applyTheme = applyTheme;
window.setUiTheme = setUiTheme;
window.setUiDensity = setUiDensity;
window.setUiBtnSize = setUiBtnSize;
window.setUiFieldSize = setUiFieldSize;
window.initUiPreferences = initUiPreferences;
window.openUiPreferences = openUiPreferences;
window.closeUiPreferences = closeUiPreferences;
