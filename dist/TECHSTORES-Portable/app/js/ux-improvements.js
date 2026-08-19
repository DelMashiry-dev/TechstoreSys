/* ux-improvements.js — confirmations, sticky actions, retention, empty states, save lock */

const UX_DEFAULT_PASSWORDS = new Set(['admin123', 'store123', 'view123']);
const UX_RETENTION_KEY = 'techstores_retention_ack_v1';
const UX_SAVE_META_KEY = 'techstores_save_meta_v1';

function confirmAction(message, options = {}) {
    const okLabel = options.okLabel || 'OK';
    // Native confirm is already used across the app; keep consistent + optional toast cancel
    const ok = window.confirm(message);
    if (!ok && options.cancelToast && typeof showToast === 'function') {
        showToast(options.cancelToast, 'info');
    }
    return ok;
}

function initStickyModuleActions() {
    document.querySelectorAll('.form-container').forEach((mod) => {
        if (mod.dataset.stickyActions === '1') return;
        let actions = mod.querySelector(':scope > .module-actions, :scope > .ict-acc-actions-bar');
        if (!actions) {
            const buttons = [...mod.querySelectorAll(':scope > .btn-save-module, :scope > .btn-print-module, :scope > .btn-generate-report')];
            if (!buttons.length) return;
            actions = document.createElement('div');
            actions.className = 'module-actions module-actions-sticky';
            buttons.forEach((b) => actions.appendChild(b));
            mod.appendChild(actions);
        } else {
            actions.classList.add('module-actions-sticky');
        }
        if (!actions.querySelector('.btn-save-pdf') && (actions.querySelector('.btn-print-module, .btn-generate-report'))) {
            const pdfBtn = document.createElement('button');
            pdfBtn.type = 'button';
            pdfBtn.className = 'btn btn-ghost btn-save-pdf';
            pdfBtn.setAttribute('data-pdf-module', mod.id || '');
            pdfBtn.textContent = 'Save PDF';
            actions.appendChild(pdfBtn);
        }
        mod.dataset.stickyActions = '1';
    });
}

function updateBuyingPowerEmptyHints(summaryBudget, summaryBalance) {
    const balanceEl = document.getElementById('kpiTotalBalance');
    const utilEl = document.getElementById('kpiUtilizationStatus');
    const targetEl = document.getElementById('kpiTotalBudget');
    let hint = document.getElementById('dashEmptyStateHint');
    if (!hint) {
        const pulseBody = document.querySelector('[data-collapse-key="portfolio-pulse"] .dash-collapse-body');
        if (pulseBody) {
            hint = document.createElement('div');
            hint.id = 'dashEmptyStateHint';
            hint.className = 'dash-empty-hint';
            pulseBody.insertBefore(hint, pulseBody.firstChild);
        }
    }
    if (!hint) return;

    if (summaryBudget <= 0) {
        hint.hidden = false;
        hint.innerHTML = '<strong>No DAF targets set</strong> for this month. Open <em>GL Target Overview</em> and enter the DAF vote amounts, or use <em>Release Cut</em> to move buying power.';
        if (utilEl) utilEl.textContent = 'Set DAF targets';
    } else if (summaryBalance < 0) {
        hint.hidden = false;
        hint.innerHTML = '<strong>Buying power overdrawn</strong>. Reduce commitments (bids / POs / DP F1), adjust voucher postings, or increase DAF targets / Release Cut from a funded GL.';
    } else {
        hint.hidden = true;
        hint.innerHTML = '';
    }
    if (balanceEl) balanceEl.classList.toggle('kpi-neg', summaryBalance < 0);
    if (targetEl) targetEl.classList.toggle('kpi-warn', summaryBudget <= 0);
}

function initRetentionReminder() {
    // Retention guidance lives in System Help — do not inject a banner on the dashboard.
    const existing = document.getElementById('retentionBanner');
    if (existing) existing.remove();

    const backupBtn = document.getElementById('retentionBackupBtn');
    if (backupBtn && backupBtn.dataset.wired !== '1') {
        backupBtn.dataset.wired = '1';
        backupBtn.addEventListener('click', () => {
            if (typeof exportSystemData === 'function') exportSystemData();
        });
    }

    const helpRoot = document.getElementById('system-help');
    if (helpRoot && helpRoot.dataset.helpNavWired !== '1') {
        helpRoot.dataset.helpNavWired = '1';
        helpRoot.addEventListener('click', (e) => {
            const target = e.target.closest('[data-target-nav]')?.getAttribute('data-target-nav');
            if (target && typeof navigateToModule === 'function') {
                e.preventDefault();
                navigateToModule(target);
            }
        });
    }
}

function recordSaveMeta() {
    const meta = {
        at: appState?.savedAt || new Date().toISOString(),
        by: appState?.savedBy || currentUser?.username || currentUser?.name || 'unknown',
        revision: Number(appState?.saveRevision) || 0
    };
    try {
        localStorage.setItem(UX_SAVE_META_KEY, JSON.stringify(meta));
    } catch (e) { /* ignore */ }
    // Login stamp is shown separately — do not overwrite with last-save text
    if (typeof refreshLastLoggedInDisplay === 'function') refreshLastLoggedInDisplay();
    return meta;
}

function checkSaveConflictOnLoad() {
    if (typeof refreshLastLoggedInDisplay === 'function') refreshLastLoggedInDisplay();
}

function wrapDestructiveConfirms() {
    // Soft-wrap known clear/delete entry points via event delegation where safe
    document.getElementById('btnClearMonthTargets')?.addEventListener('click', function clearGuard(e) {
        if (this.dataset.confirmOk === '1') {
            this.dataset.confirmOk = '';
            return;
        }
        e.preventDefault();
        e.stopImmediatePropagation();
        if (!confirmAction('Clear all DAF targets for the selected month? This cannot be undone.')) return;
        this.dataset.confirmOk = '1';
        this.click();
    }, true);
}

function initPasswordChangeUi() {
    if (document.getElementById('passwordChangeModal')) return;
    const modal = document.createElement('div');
    modal.id = 'passwordChangeModal';
    modal.className = 'stock-modal';
    modal.hidden = true;
    modal.innerHTML = `
        <div class="stock-modal-backdrop" data-pw-close></div>
        <div class="stock-modal-card" role="dialog" aria-labelledby="pwChangeTitle">
            <h3 id="pwChangeTitle">Change password</h3>
            <p class="muted">You must set a new password before continuing (default passwords are not allowed for daily use).</p>
            <label class="form-label" for="pwChangeNew">New password</label>
            <input type="password" id="pwChangeNew" class="form-control" autocomplete="new-password" minlength="8">
            <label class="form-label" for="pwChangeConfirm">Confirm password</label>
            <input type="password" id="pwChangeConfirm" class="form-control" autocomplete="new-password" minlength="8">
            <p id="pwChangeError" class="login-error" hidden></p>
            <div class="module-actions" style="margin-top:12px;">
                <button type="button" class="btn btn-success" id="pwChangeSaveBtn">Save &amp; continue</button>
            </div>
        </div>`;
    document.body.appendChild(modal);
    document.getElementById('pwChangeSaveBtn')?.addEventListener('click', submitPasswordChange);
}

function openPasswordChangeModal(user) {
    initPasswordChangeUi();
    const modal = document.getElementById('passwordChangeModal');
    if (!modal) return;
    modal.hidden = false;
    document.body.classList.add('pw-change-open');
    modal.dataset.userId = user?.id || '';
    modal.dataset.username = user?.username || '';
    document.getElementById('pwChangeNew').value = '';
    document.getElementById('pwChangeConfirm').value = '';
    const err = document.getElementById('pwChangeError');
    if (err) { err.hidden = true; err.textContent = ''; }
}

function closePasswordChangeModal() {
    const modal = document.getElementById('passwordChangeModal');
    if (modal) modal.hidden = true;
    document.body.classList.remove('pw-change-open');
}

async function submitPasswordChange() {
    const modal = document.getElementById('passwordChangeModal');
    const err = document.getElementById('pwChangeError');
    const next = String(document.getElementById('pwChangeNew')?.value || '');
    const conf = String(document.getElementById('pwChangeConfirm')?.value || '');
    const showErr = (m) => { if (err) { err.hidden = false; err.textContent = m; } };
    if (next.length < 8) return showErr('Password must be at least 8 characters.');
    if (next !== conf) return showErr('Passwords do not match.');
    if (UX_DEFAULT_PASSWORDS.has(next)) return showErr('Choose a password that is not a system default.');
    const username = modal?.dataset.username || currentUser?.username;
    if (!appState.users) appState.users = [];
    let user = appState.users.find((u) => u.username === username || u.id === modal?.dataset.userId);
    if (!user && currentUser) {
        user = { ...currentUser };
        appState.users.push(user);
    }
    if (!user) return showErr('User not found.');
    user.password = next;
    user.mustChangePassword = false;
    currentUser = { ...user, mustChangePassword: false };
    if (typeof saveStateNow === 'function') {
        const ok = await saveStateNow();
        if (dbConnected && !ok) return showErr('Could not save password to database.');
    } else if (typeof saveState === 'function') {
        saveState();
    }
    closePasswordChangeModal();
    if (typeof showToast === 'function') showToast('Password updated.', 'success');
    if (typeof enterApp === 'function') enterApp(currentUser);
}

/** Forced renewal disabled while the system is under development. */
const FORCE_PASSWORD_CHANGE = false;

function userNeedsPasswordChange(user, plainPassword) {
    if (!FORCE_PASSWORD_CHANGE || !user) return false;
    if (user.mustChangePassword) return true;
    if (plainPassword && UX_DEFAULT_PASSWORDS.has(String(plainPassword))) return true;
    return false;
}

function initUxImprovements() {
    initStickyModuleActions();
    initRetentionReminder();
    initPasswordChangeUi();
    closePasswordChangeModal();
    wrapDestructiveConfirms();
    checkSaveConflictOnLoad();
    // Prefer the hero LAST LOGGED IN line — do not inject a separate Last save chip
    if (typeof refreshLastLoggedInDisplay === 'function') refreshLastLoggedInDisplay();
}

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initUxImprovements, 200);
});

/* Hook saveState if present */
(function patchSaveState() {
    const prev = window.saveState;
    if (typeof prev !== 'function') return;
    // Will be re-wrapped after state.js loads — boot calls after all scripts
})();
