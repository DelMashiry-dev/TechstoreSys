/* how-it-works.js — collapsible “How it works” guide on every form (user training / deployment) */

const HIW_SKIP_SELECTOR = [
    '.form-hint',
    '.spec-autofill-hint',
    '[class*="status"]',
    '[class*="empty-hint"]',
    '[id$="Hint"]',
    '[id$="Status"]',
    '[aria-live]',
    '.how-it-works-panel',
    '.how-it-works-section'
].join(', ');

function hiwSectionTitle(el) {
    const panel = el.closest('.dashboard-panel, .gq-fetch-panel, .spec-search-panel, .market-catalog-panel');
    if (panel) {
        const h3 = panel.querySelector('.section-heading h3, .section-heading-compact h3, h3');
        if (h3?.textContent?.trim()) return h3.textContent.trim();
    }
    const dataTitle = el.getAttribute('data-hiw-title');
    if (dataTitle) return dataTitle;
    if (el.classList.contains('req-intro') || /-intro$/.test(el.className)) return 'Overview';
    return 'Guide';
}

function hiwCollectSections(form) {
    const sections = [];
    const seen = new Set();

    const candidates = form.querySelectorAll([
        ':scope > p.req-intro',
        ':scope > p[class*="-intro"]',
        ':scope > p.q982-intro',
        ':scope .dashboard-panel > p[class*="-hint"]',
        ':scope .gq-fetch-panel > p[class*="-hint"]',
        ':scope > p[class*="-hint"]:not(.form-hint)',
        ':scope [data-hiw-content]'
    ].join(', '));

    candidates.forEach((el) => {
        if (seen.has(el)) return;
        if (el.closest(HIW_SKIP_SELECTOR)) return;
        if (el.closest('.how-it-works-panel')) return;
        if (el.matches(HIW_SKIP_SELECTOR)) return;
        if (el.id && /Hint|Status|hint|status/.test(el.id)) return;
        if (el.closest('td, th, .form-col, label')) return;
        const text = (el.textContent || '').trim();
        if (text.length < 12) return;
        seen.add(el);
        sections.push({
            title: hiwSectionTitle(el),
            node: el
        });
    });

    return sections;
}

function setupFormHowItWorks(form) {
    if (!form || form.dataset.hiwWired === '1') return;
    const sections = hiwCollectSections(form);
    if (!sections.length) return;

    const header = form.querySelector('.form-header');
    if (!header) return;

    const panel = document.createElement('div');
    panel.className = 'how-it-works-panel';
    panel.id = `${form.id || 'form'}-how-it-works`;
    panel.hidden = true;

    sections.forEach(({ title, node }) => {
        const wrap = document.createElement('div');
        wrap.className = 'how-it-works-section';
        const heading = document.createElement('h4');
        heading.className = 'how-it-works-section-title';
        heading.textContent = title;
        wrap.appendChild(heading);
        wrap.appendChild(node);
        panel.appendChild(wrap);
    });

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'how-it-works-toggle';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-controls', panel.id);
    toggle.innerHTML = '<span class="how-it-works-toggle-label">How it works</span><span class="how-it-works-caret" aria-hidden="true">▾</span>';

    toggle.addEventListener('click', () => {
        const open = panel.hidden;
        panel.hidden = !open;
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        toggle.classList.toggle('is-open', open);
    });

    const closeBtn = header.querySelector('.close-btn');
    if (closeBtn) header.insertBefore(toggle, closeBtn);
    else header.appendChild(toggle);

    header.insertAdjacentElement('afterend', panel);
    form.dataset.hiwWired = '1';
}

function initHowItWorks(root = document) {
    const scope = root?.querySelectorAll ? root : document;
    scope.querySelectorAll('.form-container').forEach(setupFormHowItWorks);
    if (root?.classList?.contains('form-container')) setupFormHowItWorks(root);
}

window.initHowItWorks = initHowItWorks;
window.setupFormHowItWorks = setupFormHowItWorks;
