/* how-it-works.js — collapsible “How it works” tags on forms (user training / deployment) */

const HIW_SKIP_SELECTOR = [
    '.how-it-works-wrap',
    '.form-hint',
    '.spec-autofill-hint',
    '.q982-note-hint',
    '.or-notify-send-hint',
    '.reports-cards-hint',
    '.ict-acc-za-hint',
    '.ict-acc-days-hint',
    '.ict-acc-repair-hint',
    '.ict-acc-filter-hint',
    '.gl-buying-power-hint',
    '.ict-dist-col-hint',
    '.login-hint',
    '[id$="Hint"]',
    'small',
    'span',
].join(', ');

const HIW_CANDIDATE_SELECTOR = [
    '.form-container p[class*="intro"]',
    '.form-container p.q982-intro',
    '.form-container p.req-intro',
    '.form-container p[class*="-hint"]',
    '.form-container p.dp-f1-send-hint',
    '.form-container p.repair-register-hint',
    '.form-container p.po-register-hint',
    '.form-container p.ws-stores-intro',
].join(', ');

function howItWorksStorageKey(wrap) {
    const module = wrap.closest('.form-container')?.id || 'app';
    const siblings = wrap.parentElement?.querySelectorAll(':scope > .how-it-works-wrap') || [];
    const idx = [...siblings].indexOf(wrap);
    return `techstores_hiw_${module}_${idx}`;
}

function setHowItWorksOpen(wrap, open, persist = true) {
    if (!wrap) return;
    const btn = wrap.querySelector('.how-it-works-tag');
    const body = wrap.querySelector('.how-it-works-body');
    wrap.classList.toggle('is-open', open);
    if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (body) body.hidden = !open;
    if (persist) {
        try {
            localStorage.setItem(howItWorksStorageKey(wrap), open ? '1' : '0');
        } catch (_) { /* ignore */ }
    }
}

function wrapHowItWorksElement(el) {
    if (!el || el.dataset.hiwWrapped === '1') return null;
    if (el.closest('.how-it-works-wrap')) return null;
    if (el.matches(HIW_SKIP_SELECTOR)) return null;

    const cls = el.className || '';
    if (!/(intro|hint)/i.test(cls) && !el.matches('.q982-intro, .req-intro, .dp-f1-send-hint, .repair-register-hint')) {
        return null;
    }
    if (/form-hint|autofill-hint|note-hint|notify-send|cards-hint|za-hint|days-hint|filter-hint|repair-hint|col-hint|buying-power/i.test(cls)) {
        return null;
    }

    el.dataset.hiwWrapped = '1';
    const wrap = document.createElement('div');
    wrap.className = 'how-it-works-wrap';
    wrap.innerHTML = `
        <button type="button" class="how-it-works-tag" aria-expanded="false">
            <span class="how-it-works-tag-label">How it works</span>
            <span class="how-it-works-caret" aria-hidden="true">▾</span>
        </button>
        <div class="how-it-works-body" hidden></div>`;
    const body = wrap.querySelector('.how-it-works-body');
    el.parentNode.insertBefore(wrap, el);
    body.appendChild(el);

    const btn = wrap.querySelector('.how-it-works-tag');
    btn.addEventListener('click', () => {
        setHowItWorksOpen(wrap, !wrap.classList.contains('is-open'));
    });

    let startOpen = false;
    try {
        startOpen = localStorage.getItem(howItWorksStorageKey(wrap)) === '1';
    } catch (_) { /* ignore */ }
    setHowItWorksOpen(wrap, startOpen, false);
    return wrap;
}

function initHowItWorks(root) {
    const scope = root && root.querySelectorAll ? root : document;
    const hosts = root?.matches?.('.form-container') ? [root] : scope.querySelectorAll('.form-container');
    hosts.forEach((container) => {
        if (container.dataset.hiwScanned === '1') return;
        container.dataset.hiwScanned = '1';
        container.querySelectorAll(HIW_CANDIDATE_SELECTOR).forEach((el) => {
            if (el.matches(HIW_SKIP_SELECTOR)) return;
            wrapHowItWorksElement(el);
        });
    });
}

window.initHowItWorks = initHowItWorks;
window.wrapHowItWorksElement = wrapHowItWorksElement;

document.addEventListener('DOMContentLoaded', () => {
    initHowItWorks(document);
});
