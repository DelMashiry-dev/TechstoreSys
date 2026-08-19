/* auth.js — login, roles, user management */

let currentUser = null;

function getRolePermissions(role) {
    return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.viewer;
}

function canAccessModule(moduleId) {
    if (!currentUser) return false;
    const perms = getRolePermissions(currentUser.role);
    if (perms.modules.includes('*')) return true;
    if (moduleId === 'release-cut') return perms.canReleaseCut;
    if (moduleId === 'user-management') return perms.canManageUsers;
    return perms.modules.includes(moduleId);
}

function canEditData() {
    return !!(currentUser && getRolePermissions(currentUser.role).canEdit);
}

function isOversightViewOnly() {
    if (!currentUser) return false;
    const mode = getRolePermissions(currentUser.role).accessMode;
    return mode === 'oversight_view' || (getRolePermissions(currentUser.role).modules.includes('*') && !canEditData());
}

function canManageUsers() {
    return !!(currentUser && getRolePermissions(currentUser.role).canManageUsers);
}

function canBackup() {
    return !!(currentUser && getRolePermissions(currentUser.role).canBackup);
}

function canProcessReleaseCut() {
    return !!(currentUser && getRolePermissions(currentUser.role).canReleaseCut);
}

/** Accountability trail — SQLite audit_log when DB is up; always keep a short in-memory ring. */
let _lastAuditKey = '';
let _lastAuditAt = 0;

function recordAccessAudit(action, detail) {
    const entry = {
        action: String(action || 'event'),
        detail: String(detail || ''),
        username: currentUser?.username || '',
        role: currentUser?.role || '',
        at: new Date().toISOString()
    };
    const dedupeKey = `${entry.action}|${entry.detail}|${entry.username}`;
    const now = Date.now();
    if (dedupeKey === _lastAuditKey && (now - _lastAuditAt) < 4000) return;
    _lastAuditKey = dedupeKey;
    _lastAuditAt = now;

    try {
        if (typeof appState === 'object' && appState) {
            if (!Array.isArray(appState.accessAuditTrail)) appState.accessAuditTrail = [];
            appState.accessAuditTrail.push(entry);
            if (appState.accessAuditTrail.length > 200) {
                appState.accessAuditTrail = appState.accessAuditTrail.slice(-200);
            }
        }
    } catch (_) { /* ignore */ }

    if (typeof dbConnected !== 'undefined' && dbConnected && typeof apiRequest === 'function') {
        apiRequest('/api/audit', {
            method: 'POST',
            body: JSON.stringify({
                action: entry.action,
                username: entry.username || '',
                detail: [entry.username && `user=${entry.username}`, entry.role && `role=${entry.role}`, entry.detail]
                    .filter(Boolean)
                    .join(' | ')
            })
        }).catch(() => { /* offline / ignore */ });
    }
}

function viewOnlyDenialMessage() {
    if (isOversightViewOnly()) {
        return 'Oversight access is view-only: you may open all modules but cannot alter quantities or save changes.';
    }
    return 'Your access level is view-only for this action.';
}

function loadSession() {
    try {
        const raw = sessionStorage.getItem(SESSION_KEY);
        if (!raw) return null;
        const session = JSON.parse(raw);
        if (!session?.userId) return null;
        const user = (appState.users || []).find((u) => u.id === session.userId && u.active !== false);
        return user || null;
    } catch (error) {
        return null;
    }
}

function saveSession(user) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({
        userId: user.id,
        username: user.username,
        loggedInAt: new Date().toISOString()
    }));
}

function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
}

function setLoginError(message) {
    const el = document.getElementById('loginError');
    if (!el) return;
    if (message) {
        el.textContent = message;
        el.classList.add('visible');
    } else {
        el.textContent = '';
        el.classList.remove('visible');
    }
}

async function attemptLogin(username, password) {
    const resolvedUser = typeof resolveLoginUsername === 'function'
        ? resolveLoginUsername(username)
        : String(username || '').trim();
    const pwd = String(password || '').trim();

    if (dbConnected) {
        try {
            const data = await apiRequest('/api/login', {
                method: 'POST',
                body: JSON.stringify({
                    username: resolvedUser,
                    password: pwd
                })
            });
            // Refresh users/state from DB after login
            const stateData = await apiRequest('/api/state');
            appState = mergeState(stateData.appState);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
            return { ok: true, user: data.user };
        } catch (error) {
            return { ok: false, message: error.message || 'Invalid username or password.' };
        }
    }

    const users = appState.users || [];
    const user = users.find((u) =>
        String(u.username || '').toLowerCase() === String(resolvedUser || '').trim().toLowerCase()
    );
    const pwdOk = user && (
        String(user.password || '') === pwd
        || (typeof passwordMatchesLogin === 'function' && passwordMatchesLogin(user.username, pwd))
    );
    if (!user || !pwdOk) {
        return { ok: false, message: 'Invalid username or password.' };
    }
    if (user.active === false) {
        return { ok: false, message: 'This account is disabled. Contact an administrator.' };
    }
    return { ok: true, user };
}

function updateHeaderUser() {
    const nameEl = document.getElementById('headerUserName');
    const roleEl = document.getElementById('headerUserRole');
    const avatarEl = document.getElementById('headerUserAvatar');
    const signedInChip = document.getElementById('dashboardSignedInChip');
    const accessModeEl = document.getElementById('headerAccessMode');
    if (!currentUser) {
        if (nameEl) nameEl.textContent = 'Not signed in';
        if (roleEl) {
            roleEl.textContent = '—';
            roleEl.className = 'role-badge';
        }
        if (accessModeEl) {
            accessModeEl.hidden = true;
            accessModeEl.textContent = '';
        }
        if (signedInChip) signedInChip.textContent = 'Signed in: —';
        return;
    }
    if (nameEl) nameEl.textContent = currentUser.name || currentUser.username;
    if (roleEl) {
        roleEl.textContent = ROLE_LABELS[currentUser.role] || currentUser.role;
        roleEl.className = `role-badge role-${currentUser.role}`;
    }
    if (accessModeEl) {
        const viewOnly = !canEditData();
        accessModeEl.hidden = !viewOnly;
        accessModeEl.textContent = viewOnly ? 'VIEW ONLY' : '';
        accessModeEl.title = viewOnly
            ? 'You can open allowed modules but cannot alter quantities or save operational data.'
            : '';
        accessModeEl.classList.toggle('access-mode-oversight', isOversightViewOnly());
    }
    if (avatarEl) {
        const label = encodeURIComponent(currentUser.name || currentUser.username || 'User');
        avatarEl.src = `https://ui-avatars.com/api/?name=${label}&background=3498db&color=fff`;
    }
    if (signedInChip) {
        const role = ROLE_LABELS[currentUser.role] || currentUser.role;
        const mode = canEditData() ? '' : ' · VIEW ONLY';
        signedInChip.textContent = `Signed in: ${currentUser.name || currentUser.username} (${role}${mode})`;
    }
    if (typeof syncCommanderDemoPackButton === 'function') syncCommanderDemoPackButton();
}

function canAccessAnyStoresLedger() {
    if (!currentUser) return false;
    const perms = getRolePermissions(currentUser.role);
    if (perms.modules.includes('*')) return true;
    if (typeof MODULES_STORES_LEDGERS === 'undefined') return false;
    return MODULES_STORES_LEDGERS.some((id) => perms.modules.includes(id));
}

function isGateRegisterRole() {
    return !!(currentUser && (currentUser.role === 'rp' || currentUser.role === 'oc_gate'));
}

function hasRoleScopedDashboard() {
    return typeof hasRoleScopedHome === 'function' && hasRoleScopedHome(currentUser?.role);
}

/** Universal search, notifications, track, demo pack — TechStores staff + super oversight only. */
function canSeeStoresOpsDashboard() {
    if (!currentUser) return false;
    const perms = getRolePermissions(currentUser.role);
    if (perms.modules.includes('*')) return true;
    const role = currentUser.role;
    return role === 'store_officer' || role === 'storeman';
}

/** Notifications — full panel for TechStores / super oversight; gate-filtered for RP. */
function canSeeRoleNotifications() {
    if (!currentUser) return false;
    if (canSeeStoresOpsDashboard()) return true;
    return isGateRegisterRole();
}

function applyAccessControl() {
    const roleClasses = [
        'role-admin', 'role-army_commander', 'role-brig_gs', 'role-brig_as', 'role-brig_qs',
        'role-director', 'role-deputy_director', 'role-aqso2', 'role-dir_aiad', 'role-dir_daf', 'role-dir_dp',
        'role-techstores_officer', 'role-rq', 'role-store_officer', 'role-orderly_clerk',
        'role-storeman', 'role-rp', 'role-workshop',
        'role-oc_sysadmin', 'role-oc_workshop', 'role-oc_compengr', 'role-oc_swengr',
        'role-oc_ictsec', 'role-oc_itts', 'role-oc_admin', 'role-oc_gate',
        'role-viewer', 'access-readonly', 'no-stores-ledgers', 'role-scope-gate', 'role-scoped-home',
        'no-stores-ops-dashboard', 'role-gate-notifications'
    ];
    document.body.classList.remove(...roleClasses);
    if (!currentUser) return;

    document.body.classList.add(`role-${currentUser.role}`);
    if (!canEditData()) document.body.classList.add('access-readonly');
    if (!canAccessAnyStoresLedger()) document.body.classList.add('no-stores-ledgers');
    if (isGateRegisterRole()) document.body.classList.add('role-scope-gate');
    if (hasRoleScopedDashboard()) document.body.classList.add('role-scoped-home');
    if (!canSeeStoresOpsDashboard()) document.body.classList.add('no-stores-ops-dashboard');
    if (isGateRegisterRole()) document.body.classList.add('role-gate-notifications');

    document.querySelectorAll('.sidebar-menu a[data-target]').forEach((link) => {
        const target = link.getAttribute('data-target');
        const li = link.closest('li');
        if (!li) return;
        if (canAccessModule(target)) {
            li.classList.remove('nav-hidden');
        } else {
            li.classList.add('nav-hidden');
        }
    });

    document.querySelectorAll('.nav-submenu-toggle').forEach((toggle) => {
        const parentLi = toggle.closest('li');
        if (!parentLi) return;
        const anyVisible = Array.from(parentLi.querySelectorAll('.submenu a[data-target]'))
            .some((a) => canAccessModule(a.getAttribute('data-target')));
        parentLi.classList.toggle('nav-hidden', !anyVisible);
    });

    document.querySelectorAll('.nav-admin-only').forEach((el) => {
        el.classList.toggle('nav-hidden', !canManageUsers());
    });
    document.querySelectorAll('.admin-only').forEach((el) => {
        el.classList.toggle('nav-hidden', !canBackup());
    });

    const releaseNav = document.querySelector('.sidebar-menu a[data-target="release-cut"]')?.closest('li');
    if (releaseNav) releaseNav.classList.toggle('nav-hidden', !canProcessReleaseCut());

    document.querySelectorAll('.quick-action-btn, .rail-shortcut[data-target], .gl-card[data-target], .card[data-target]').forEach((btn) => {
        const target = btn.dataset.target || btn.getAttribute('data-target');
        if (!target) return;
        const allowed = canAccessModule(target);
        btn.classList.toggle('nav-hidden', !allowed);
        if (btn.classList.contains('quick-action-btn')) {
            btn.style.display = allowed ? '' : 'none';
        }
    });

    const rpHome = document.getElementById('rpGateHome');
    if (rpHome) rpHome.hidden = true;

    if (typeof renderRoleScopedHome === 'function') renderRoleScopedHome();
    else if (isGateRegisterRole()) {
        const legacy = document.getElementById('rpGateHome');
        if (legacy) legacy.hidden = false;
    }

    const notifTitle = document.querySelector('#dashCommandBoard .dash-collapse-titles h3');
    if (notifTitle) {
        if (!notifTitle.dataset.defaultText) notifTitle.dataset.defaultText = notifTitle.textContent.trim();
        if (isGateRegisterRole() && canSeeRoleNotifications()) {
            notifTitle.textContent = 'Gate notifications';
            notifTitle.dataset.gateTitle = '1';
        } else {
            notifTitle.textContent = notifTitle.dataset.defaultText;
        }
    }

    const denied = document.getElementById('userMgmtDenied');
    const content = document.getElementById('userMgmtContent');
    if (denied && content) {
        const allowed = canManageUsers();
        denied.style.display = allowed ? 'none' : 'block';
        content.style.display = allowed ? 'block' : 'none';
    }
}

function enterApp(user) {
    currentUser = user;
    saveSession(user);
    document.body.classList.remove('app-locked');
    if (typeof closePasswordChangeModal === 'function') closePasswordChangeModal();
    updateHeaderUser();
    applyAccessControl();
    if (typeof refreshLastLoggedInDisplay === 'function') refreshLastLoggedInDisplay();
    navigateToModule('dashboard', { clearHistory: true, skipHistory: true });
    if (typeof initCommandBoard === 'function') initCommandBoard();
    updateDashboard();
    if (typeof updateCommandBoard === 'function') updateCommandBoard();
    else updateSystemAlerts();
    if (typeof initItDirCommsSideButton === 'function') initItDirCommsSideButton();
    if (canManageUsers()) renderUsersTable();
    const roleLabel = ROLE_LABELS[user.role] || user.role;
    recordAccessAudit('session_start', `Session open as ${user.username} (${roleLabel}; edit=${canEditData() ? 'yes' : 'no'})`);
    if (!canEditData()) {
        showToast(
            `Welcome, ${user.name || user.username} (${roleLabel}) — VIEW ONLY. You cannot alter quantities or save changes.`,
            'info'
        );
    } else {
        showToast(`Welcome, ${user.name || user.username} (${roleLabel})`);
    }
}

async function logoutUser() {
    // Persist data first — logout must never wipe operational records
    if (typeof flushPersistentDatabase === 'function') {
        await flushPersistentDatabase();
    } else if (typeof saveStateNow === 'function') {
        await saveStateNow();
    }
    if (currentUser) {
        recordAccessAudit('logout', `Signed out ${currentUser.username}`);
    }
    currentUser = null;
    clearSession();
    document.body.classList.add('app-locked');
    const idcBtn = document.getElementById('idcSideBtn');
    if (idcBtn) idcBtn.hidden = true;
    document.body.classList.remove(
        'role-admin', 'role-army_commander', 'role-brig_gs', 'role-brig_as', 'role-brig_qs',
        'role-director', 'role-deputy_director', 'role-aqso2', 'role-dir_aiad', 'role-dir_daf', 'role-dir_dp',
        'role-techstores_officer', 'role-rq', 'role-store_officer', 'role-orderly_clerk',
        'role-storeman', 'role-rp', 'role-workshop',
        'role-oc_sysadmin', 'role-oc_workshop', 'role-oc_compengr', 'role-oc_swengr',
        'role-oc_ictsec', 'role-oc_itts', 'role-oc_admin', 'role-oc_gate',
        'role-viewer', 'access-readonly', 'no-stores-ledgers', 'role-scope-gate', 'role-scoped-home',
        'no-stores-ops-dashboard', 'role-gate-notifications'
    );
    if (typeof resetDashboardKicker === 'function') resetDashboardKicker();
    const notifTitle = document.querySelector('#dashCommandBoard .dash-collapse-titles h3');
    if (notifTitle?.dataset.gateTitle) {
        notifTitle.textContent = notifTitle.dataset.defaultText || 'Notifications';
        delete notifTitle.dataset.gateTitle;
    }
    updateHeaderUser();
    setLoginError('');
    const form = document.getElementById('loginForm');
    if (form) form.reset();
    document.getElementById('loginUsername')?.focus();
    showToast(
        dbConnected
            ? 'Signed out. Your data remains in the persistent database.'
            : 'Signed out. Start START-SYSTEM.bat next time so data is stored on disk.',
        'info'
    );
}

function renderUsersTable() {
    const tbody = document.getElementById('users-table-body');
    if (!tbody) return;
    const users = appState.users || [];
    tbody.innerHTML = users.map((user) => `
        <tr data-user-id="${escapeHtml(user.id)}">
            <td>${escapeHtml(user.name)}</td>
            <td>${escapeHtml(user.username)}</td>
            <td><span class="role-badge role-${escapeHtml(user.role)}">${escapeHtml(ROLE_LABELS[user.role] || user.role)}</span></td>
            <td>${user.active === false ? 'Disabled' : 'Active'}</td>
            <td>
                <button class="btn btn-ghost btn-sm btn-edit-user" type="button" data-user-id="${escapeHtml(user.id)}">Edit</button>
                <button class="btn btn-secondary btn-sm btn-toggle-user" type="button" data-user-id="${escapeHtml(user.id)}">
                    ${user.active === false ? 'Enable' : 'Disable'}
                </button>
            </td>
        </tr>
    `).join('') || '<tr><td colspan="5" class="empty-state">No users found.</td></tr>';
}

function resetUserForm() {
    document.getElementById('newUserName').value = '';
    document.getElementById('newUserUsername').value = '';
    document.getElementById('newUserPassword').value = '';
    document.getElementById('newUserRole').value = 'store_officer';
    document.getElementById('newUserUsername').dataset.editingId = '';
}

function saveUserFromForm() {
    if (!canManageUsers()) {
        showToast('Only administrators can manage users.', 'error');
        return;
    }
    const name = document.getElementById('newUserName').value.trim();
    const username = document.getElementById('newUserUsername').value.trim();
    const password = document.getElementById('newUserPassword').value;
    const role = document.getElementById('newUserRole').value;
    const editingId = document.getElementById('newUserUsername').dataset.editingId || '';

    if (!name || !username) {
        showToast('Name and username are required.', 'error');
        return;
    }
    if (!ROLE_PERMISSIONS[role]) {
        showToast('Invalid access level.', 'error');
        return;
    }

    if (!appState.users) appState.users = createDefaultUsers();

    const duplicate = appState.users.find((u) =>
        u.username.toLowerCase() === username.toLowerCase() && u.id !== editingId
    );
    if (duplicate) {
        showToast('That username is already in use.', 'error');
        return;
    }

    if (editingId) {
        const user = appState.users.find((u) => u.id === editingId);
        if (!user) {
            showToast('User not found.', 'error');
            return;
        }
        user.name = name;
        user.username = username;
        user.role = role;
        if (password) user.password = password;
        if (currentUser && currentUser.id === user.id) {
            currentUser = { ...user };
            updateHeaderUser();
            applyAccessControl();
        }
        showToast('User updated successfully.');
    } else {
        if (!password) {
            showToast('Password is required for new users.', 'error');
            return;
        }
        appState.users.push({
            id: 'u-' + Date.now(),
            name,
            username,
            password,
            role,
            active: true,
            mustChangePassword: false
        });
        showToast('User created successfully.');
    }

    saveState();
    resetUserForm();
    renderUsersTable();
}

function editUser(userId) {
    const user = (appState.users || []).find((u) => u.id === userId);
    if (!user) return;
    document.getElementById('newUserName').value = user.name || '';
    document.getElementById('newUserUsername').value = user.username || '';
    document.getElementById('newUserPassword').value = '';
    document.getElementById('newUserPassword').placeholder = 'Leave blank to keep current password';
    document.getElementById('newUserRole').value = user.role;
    document.getElementById('newUserUsername').dataset.editingId = user.id;
}

function toggleUserActive(userId) {
    if (!canManageUsers()) return;
    const user = (appState.users || []).find((u) => u.id === userId);
    if (!user) return;
    if (currentUser && currentUser.id === user.id) {
        showToast('You cannot disable your own account while signed in.', 'error');
        return;
    }
    user.active = user.active === false;
    saveState();
    renderUsersTable();
    showToast(`User ${user.active === false ? 'disabled' : 'enabled'}.`);
}
