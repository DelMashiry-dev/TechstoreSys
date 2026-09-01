/* delivery-note.js — supplier deliveries + link to Workshop Receipt Certification */

function dnEscape(v) {
    return String(v ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function readDeliveryNoteRow(tr) {
    if (!tr) return null;
    const cells = tr.querySelectorAll('td');
    if (cells.length < 10) return null;
    const val = (i) => cells[i]?.querySelector('input')?.value?.trim() || '';
    return {
        date: val(0),
        item: val(1),
        description: val(2),
        qty: Number(val(3)) || 1,
        uom: val(4),
        serial: val(5),
        po: val(6),
        supplier: val(7),
        receivedBy: val(8),
        initials: val(9)
    };
}

function deliveryNoteRowRef(tr) {
    if (!tr) return '';
    if (tr.dataset.dnRef) return tr.dataset.dnRef;
    const row = readDeliveryNoteRow(tr);
    const key = [row?.date, row?.po, row?.supplier, row?.item, row?.serial].join('|').toLowerCase();
    let hash = 0;
    for (let i = 0; i < key.length; i += 1) {
        hash = ((hash << 5) - hash) + key.charCodeAt(i);
        hash |= 0;
    }
    tr.dataset.dnRef = `dn-${Math.abs(hash) || Date.now()}`;
    return tr.dataset.dnRef;
}

function looksLikeIctDeliveryRow(row) {
    if (!row) return false;
    const text = `${row.item} ${row.description} ${row.serial}`.toLowerCase();
    if (typeof categoryRequiresWorkshopCert === 'function') {
        return categoryRequiresWorkshopCert('', text) || !!row.serial;
    }
    return /\b(laptop|desktop|printer|macbook|tablet|server|projector|ict|pc)\b/i.test(text);
}

function renderDeliveryNoteCertBadge(tr) {
    const cell = tr.querySelector('.dn-wrc-badge');
    if (!cell || typeof findWorkshopReceiptCert !== 'function') return;
    const ref = deliveryNoteRowRef(tr);
    const cert = findWorkshopReceiptCert({ sourceRef: ref });
    if (!cert) {
        cell.innerHTML = '<span class="muted">—</span>';
        return;
    }
    const label = typeof getWrcStatusLabel === 'function' ? getWrcStatusLabel(cert.status) : cert.status;
    cell.innerHTML = `<span class="wrc-status wrc-status-${dnEscape(cert.status)}" title="${dnEscape(cert.inspectionSerial)}">${dnEscape(label)}</span>`;
}

function renderDeliveryNoteCertBadges() {
    document.querySelectorAll('#delivery-table-body tr.dn-row').forEach(renderDeliveryNoteCertBadge);
}

function initDeliveryNoteModule() {
    const moduleEl = document.getElementById('delivery-note');
    if (!moduleEl || moduleEl.dataset.dnInit === '1') return;
    moduleEl.dataset.dnInit = '1';

    const body = document.getElementById('delivery-table-body');
    body?.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-dn-wrc]');
        if (!btn) return;
        const tr = btn.closest('tr');
        if (tr && typeof createWrcFromDeliveryNote === 'function') {
            createWrcFromDeliveryNote(tr);
        }
    });

    body?.addEventListener('input', (e) => {
        const tr = e.target.closest('tr.dn-row');
        if (tr) renderDeliveryNoteCertBadge(tr);
    });

    const addBtn = moduleEl.querySelector('[onclick*="addDeliveryRow"]');
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            setTimeout(renderDeliveryNoteCertBadges, 0);
        });
    }

    renderDeliveryNoteCertBadges();
}

window.readDeliveryNoteRow = readDeliveryNoteRow;
window.deliveryNoteRowRef = deliveryNoteRowRef;
window.renderDeliveryNoteCertBadges = renderDeliveryNoteCertBadges;
window.initDeliveryNoteModule = initDeliveryNoteModule;
