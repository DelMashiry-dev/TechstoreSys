/* message-priority.js - standard priority bands for letters / correspondence / minutes / messages */

/**
 * NORMAL (green) | IMMEDIATE (orange) | URGENT (purple) | CRITICAL (red) | FLASH (lightning)
 * Legacy "high" maps to IMMEDIATE.
 */
const MESSAGE_PRIORITIES = [
    { value: 'normal', label: 'Normal', short: 'NORMAL', color: '#12b76a', bg: '#ecfdf3', border: '#12b76a', icon: '' },
    { value: 'immediate', label: 'Immediate', short: 'IMMEDIATE', color: '#dc6803', bg: '#fff6ed', border: '#f79009', icon: '' },
    { value: 'urgent', label: 'Urgent', short: 'URGENT', color: '#7a5af8', bg: '#f4f3ff', border: '#7a5af8', icon: '' },
    { value: 'critical', label: 'Critical', short: 'CRITICAL', color: '#d92d20', bg: '#fef3f2', border: '#d92d20', icon: '' },
    { value: 'flash', label: 'Flash', short: 'FLASH', color: '#f5a524', bg: '#fffbeb', border: '#f5a524', icon: '\u26A1' }
];

function normalizeMessagePriority(value) {
    const raw = String(value || 'normal').toLowerCase().trim();
    if (raw === 'high') return 'immediate';
    if (MESSAGE_PRIORITIES.some((p) => p.value === raw)) return raw;
    return 'normal';
}

function getMessagePriorityMeta(value) {
    const key = normalizeMessagePriority(value);
    return MESSAGE_PRIORITIES.find((p) => p.value === key) || MESSAGE_PRIORITIES[0];
}

function messagePriorityOptionsHtml(selected = 'normal') {
    const sel = normalizeMessagePriority(selected);
    return MESSAGE_PRIORITIES.map((p) => {
        const mark = p.icon ? (p.icon + ' ') : '';
        return '<option value="' + p.value + '"' + (p.value === sel ? ' selected' : '') + '>' + mark + p.label + '</option>';
    }).join('');
}

function messagePriorityBadgeHtml(value, { escapeFn } = {}) {
    const meta = getMessagePriorityMeta(value);
    const esc = typeof escapeFn === 'function'
        ? escapeFn
        : (v) => String(v ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    const icon = meta.icon ? '<span class="msg-pri-flash" aria-hidden="true">' + meta.icon + '</span>' : '';
    return '<span class="msg-pri msg-pri-' + esc(meta.value) + '" title="' + esc(meta.label) + '">' + icon + esc(meta.short) + '</span>';
}

function isElevatedMessagePriority(value) {
    const p = normalizeMessagePriority(value);
    return p === 'immediate' || p === 'urgent' || p === 'critical' || p === 'flash';
}

window.MESSAGE_PRIORITIES = MESSAGE_PRIORITIES;
window.normalizeMessagePriority = normalizeMessagePriority;
window.getMessagePriorityMeta = getMessagePriorityMeta;
window.messagePriorityOptionsHtml = messagePriorityOptionsHtml;
window.messagePriorityBadgeHtml = messagePriorityBadgeHtml;
window.isElevatedMessagePriority = isElevatedMessagePriority;
