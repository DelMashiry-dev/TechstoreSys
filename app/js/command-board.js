/* command-board.js — top-of-dashboard System Alerts + office messages */

function updateCommandBoard() {
    const alertCount = typeof updateSystemAlerts === 'function' ? updateSystemAlerts() : 0;

    // Unread system alerts (by desk id) — re-collect ids from rendered cards when possible
    let alertUnread = 0;
    if (typeof getUnreadAlertCount === 'function') {
        const ids = [...document.querySelectorAll('#systemAlertsList .ad-card[data-desk-id]')]
            .map((el) => el.getAttribute('data-desk-id'))
            .filter(Boolean);
        alertUnread = ids.length ? getUnreadAlertCount(ids) : 0;
        // Fallback: if alerts pane empty (other tab), use last known from badge or recount via update path
        if (!ids.length && typeof window.__lastAlertDeskIds === 'object') {
            alertUnread = getUnreadAlertCount(window.__lastAlertDeskIds);
        }
    }

    if (typeof updateSaTabBadges === 'function') {
        updateSaTabBadges(alertCount, alertUnread);
    } else {
        const countEl = document.getElementById('systemAlertsCount');
        if (countEl) countEl.textContent = String(alertCount);
    }
    return alertCount;
}

function initCommandBoard() {
    const board = document.getElementById('dashCommandBoard');
    if (!board || board.dataset.cmdInit === '1') return;
    board.dataset.cmdInit = '1';

    if (typeof initOfficeMessages === 'function') initOfficeMessages();
    if (typeof syncNotificationsScrollButtons === 'function') {
        setTimeout(syncNotificationsScrollButtons, 120);
    }

    document.querySelectorAll('[data-scroll-command]').forEach((link) => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            if (typeof expandDashCollapseByKey === 'function') expandDashCollapseByKey('system-alerts');
            const el = document.getElementById('systemAlerts') || document.getElementById('dashCommandBoard');
            el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            el?.classList.add('command-panel-flash');
            setTimeout(() => el?.classList.remove('command-panel-flash'), 1200);
        });
    });
}
