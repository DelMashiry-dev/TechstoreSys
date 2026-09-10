/* backup.js — export/import system backup */

async function refreshSupabaseBackupStatus() {
    const el = document.getElementById('supabaseBackupStatus');
    if (!el) return;
    try {
        const data = await apiRequest('/api/supabase/status');
        if (!data?.configured) {
            el.hidden = false;
            el.textContent = 'Supabase: add SUPABASE_URL + key to .env';
            return;
        }
        if (!data.enabled) {
            el.hidden = false;
            el.textContent = 'Supabase: disabled in .env';
            return;
        }
        const when = data.lastBackupAt ? `last ${new Date(data.lastBackupAt).toLocaleString()}` : 'no backup yet';
        const err = data.lastError ? ` · ${data.lastError}` : '';
        el.hidden = false;
        el.textContent = `Supabase: ${when}${err}`;
    } catch (_) {
        el.hidden = false;
        el.textContent = 'Supabase: status unavailable';
    }
}

async function backupToSupabase() {
    if (!canBackup()) {
        showToast('Only Administrators can back up to Supabase.', 'error');
        return;
    }
    try {
        const result = await apiRequest('/api/supabase/backup', { method: 'POST', body: '{}' });
        showToast(`Cloud backup saved (rev ${result.saveRevision || '?'})`);
        await refreshSupabaseBackupStatus();
    } catch (error) {
        showToast(error?.message || 'Supabase backup failed.', 'error');
        await refreshSupabaseBackupStatus();
    }
}

async function restoreFromSupabase(force = false) {
    if (!canBackup()) {
        showToast('Only Administrators can restore from Supabase.', 'error');
        return;
    }
    if (!force) {
        const ok = window.confirm(
            'Restore the newest Supabase backup into this machine?\n\n'
            + 'This replaces the local SQLite database with the cloud copy.'
        );
        if (!ok) return;
    }
    try {
        const payload = {
            force,
            username: currentUser?.username || currentUser?.name || 'admin'
        };
        const result = await apiRequest('/api/supabase/restore', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        if (result?.appState) {
            const defaults = createDefaultState();
            appState = {
                ...defaults,
                ...result.appState,
                glBudgets: { ...defaults.glBudgets, ...(result.appState.glBudgets || {}) },
                modules: result.appState.modules || {},
                releaseCuts: result.appState.releaseCuts || [],
                users: (result.appState.users && result.appState.users.length)
                    ? result.appState.users
                    : defaults.users
            };
            restoreAllModules();
            initBidCalculations();
            initVoucherCalculations();
            initStockCalculations();
            initConsumablesStockCalculations();
            recalculateJobCardTotal();
            updateDashboard();
            updateVoucherSummary();
            updateSystemAlerts();
            applyAccessControl();
            if (canManageUsers()) renderUsersTable();
        } else if (typeof hydrateAppStateFromDatabase === 'function') {
            await hydrateAppStateFromDatabase(true);
        }
        showToast(`Restored cloud backup (rev ${result.cloudRevision || '?'})`);
        await refreshSupabaseBackupStatus();
    } catch (error) {
        if (error?.status === 409 && !force) {
            const newer = window.confirm(
                (error.message || 'Local data is newer than the cloud backup.')
                + '\n\nRestore from Supabase anyway?'
            );
            if (newer) return restoreFromSupabase(true);
        }
        showToast(error?.message || 'Supabase restore failed.', 'error');
        await refreshSupabaseBackupStatus();
    }
}

function exportSystemData() {
    if (!canBackup()) {
        showToast('Only Administrators can export backups.', 'error');
        return;
    }
    const payload = {
        exportedAt: new Date().toISOString(),
        appState
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `techstores-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('System backup exported successfully.');
}

function importSystemData(file) {
    if (!canBackup()) {
        showToast('Only Administrators can import backups.', 'error');
        return;
    }
    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const parsed = JSON.parse(event.target.result);
            const importedState = parsed.appState || parsed;
            if (!importedState || !importedState.glBudgets) {
                throw new Error('Invalid backup file.');
            }
            const defaults = createDefaultState();
            appState = {
                ...defaults,
                ...importedState,
                glBudgets: { ...defaults.glBudgets, ...(importedState.glBudgets || {}) },
                modules: importedState.modules || {},
                releaseCuts: importedState.releaseCuts || [],
                users: (importedState.users && importedState.users.length) ? importedState.users : defaults.users
            };
            saveState();
            restoreAllModules();
            initBidCalculations();
            initVoucherCalculations();
            initStockCalculations();
            initConsumablesStockCalculations();
            recalculateJobCardTotal();
            updateDashboard();
            updateVoucherSummary();
            updateSystemAlerts();
            applyAccessControl();
            if (canManageUsers()) renderUsersTable();
            showToast('Backup imported successfully.');
        } catch (error) {
            showToast('Failed to import backup: ' + error.message, 'error');
        }
    };
    reader.readAsText(file);
}
