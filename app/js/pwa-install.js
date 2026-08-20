/* pwa-install.js — register service worker + Install / Add to Home Screen helpers */

/** Set false to hide the bottom “Install Tech Stores” banner (desktop / internal use). */
const PWA_INSTALL_BANNER_ENABLED = false;

let deferredInstallPrompt = null;

function isStandaloneDisplay() {
    return window.matchMedia('(display-mode: standalone)').matches
        || window.navigator.standalone === true;
}

function isSecurePwaContext() {
    return window.isSecureContext === true;
}

function updatePwaInstallUi() {
    const banner = document.getElementById('pwaInstallBanner');
    const btn = document.getElementById('pwaInstallBtn');
    const hint = document.getElementById('pwaInstallHint');
    if (!banner) return;

    if (!PWA_INSTALL_BANNER_ENABLED) {
        banner.hidden = true;
        return;
    }

    if (isStandaloneDisplay()) {
        banner.hidden = true;
        return;
    }

    const dismissed = sessionStorage.getItem('pwaInstallDismissed') === '1';
    if (dismissed) {
        banner.hidden = true;
        return;
    }

    banner.hidden = false;
    if (deferredInstallPrompt && btn) {
        btn.hidden = false;
        btn.textContent = 'Install app';
        if (hint) {
            hint.textContent = 'Install Tech Stores on this phone or computer for a full-screen app icon.';
        }
    } else if (btn) {
        btn.hidden = true;
        if (hint) {
            const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
            hint.textContent = ios
                ? 'iPhone/iPad: tap Share → Add to Home Screen.'
                : (isSecurePwaContext()
                    ? 'Use your browser menu → Install app / Add to Home screen.'
                    : 'On this phone: open the PC address below in Chrome → menu ⋮ → Add to Home screen. (Full install needs HTTPS or localhost.)');
        }
    }
}

async function registerTechStoresServiceWorker() {
    if (!('serviceWorker' in navigator) || !isSecurePwaContext()) return null;
    try {
        const reg = await navigator.serviceWorker.register('./sw.js', { scope: './' });
        return reg;
    } catch (err) {
        console.warn('Service worker not registered', err);
        return null;
    }
}

async function promptPwaInstall() {
    if (!deferredInstallPrompt) {
        updatePwaInstallUi();
        return;
    }
    deferredInstallPrompt.prompt();
    try {
        await deferredInstallPrompt.userChoice;
    } catch (_) { /* ignore */ }
    deferredInstallPrompt = null;
    updatePwaInstallUi();
}

function dismissPwaInstallBanner() {
    sessionStorage.setItem('pwaInstallDismissed', '1');
    const banner = document.getElementById('pwaInstallBanner');
    if (banner) banner.hidden = true;
}

function initPwaInstall() {
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredInstallPrompt = e;
        updatePwaInstallUi();
    });
    window.addEventListener('appinstalled', () => {
        deferredInstallPrompt = null;
        sessionStorage.setItem('pwaInstallDismissed', '1');
        updatePwaInstallUi();
        if (typeof showToast === 'function') showToast('Tech Stores installed on this device.');
    });

    document.getElementById('pwaInstallBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        promptPwaInstall();
    });
    document.getElementById('pwaInstallDismiss')?.addEventListener('click', (e) => {
        e.preventDefault();
        dismissPwaInstallBanner();
    });

    registerTechStoresServiceWorker();
    updatePwaInstallUi();

    // Show LAN tip on login when opened from a non-local host (phone on Wi‑Fi)
    const host = location.hostname;
    const tip = document.getElementById('pwaLanTip');
    if (tip && host && host !== '127.0.0.1' && host !== 'localhost') {
        tip.hidden = false;
        tip.textContent = `Connected to Tech Stores on ${host}. Use Install / Add to Home Screen for a phone icon.`;
    }
}

window.initPwaInstall = initPwaInstall;
window.promptPwaInstall = promptPwaInstall;
