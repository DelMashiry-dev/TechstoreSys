/* backup.js — export/import system backup */

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
