/* product-datasheets.js — full specs + datasheet (PDF) for ICT printers / server-room gear */

/** Curated OEM datasheet / spec-sheet URLs (product catalog id → URL). */
const PRODUCT_DATASHEET_PDF_BY_ID = {
    'dell-poweredge-r750': 'https://i.dell.com/sites/csdocuments/Product_Docs/en/poweredge-r750-spec-sheet.pdf',
    'cisco-catalyst-9200': 'https://www.cisco.com/c/en/us/products/collateral/switches/catalyst-9200-series-switches/nb-06-cat9200-ser-data-sheet-cte-en.html',
    'cisco-catalyst-9300': 'https://www.cisco.com/c/en/us/products/collateral/switches/catalyst-9300-series-switches/nb-06-cat9300-ser-data-sheet-cte-en.html',
    'hpe-proliant-dl380': 'https://www.hpe.com/psnow/doc/a00008180enw'
};

/** Local PDFs under assets/datasheets/ — override OEM when present. */
const PRODUCT_DATASHEET_LOCAL_BY_ID = {
    'canon-imagerunner-c3025i': '../assets/datasheets/canon-imagerunner-c3025i.pdf'
};

/** Name match when the inventory row is not the catalog id (e.g. C3025i waste toner). */
const PRODUCT_DATASHEET_LOCAL_BY_NAME = [
    { re: /\bc3025i\b/i, src: '../assets/datasheets/canon-imagerunner-c3025i.pdf' }
];

const DATASHEET_APPLICABLE_CATEGORIES = new Set([
    'printer', 'server', 'network', 'laptop', 'desktop', 'tablet'
]);

function psrDocEscape(s) {
    return String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function buildOemSupportSearchUrl(brand, model) {
    const q = encodeURIComponent([brand, model].filter(Boolean).join(' ').trim());
    if (!q) return null;
    const b = String(brand || '').toLowerCase();
    if (/^hp$|hewlett/.test(b)) return `https://support.hp.com/us-en/search?q=${q}&filter=`;
    if (/^hpe$|proliant/.test(b)) return `https://support.hpe.com/hpesc/public/home?lang=en-us#q=${q}`;
    if (/dell/.test(b)) return `https://www.dell.com/support/search/en-us#q=${q}`;
    if (/cisco/.test(b)) return `https://www.cisco.com/c/en/us/support/search.html?q=${q}`;
    if (/canon/.test(b)) return `https://www.usa.canon.com/support/s?k=${q}`;
    if (/brother/.test(b)) return `https://support.brother.com/g/b/productsearch.aspx?c=us&lang=en&content=dl&product=${q}`;
    if (/epson/.test(b)) return `https://epson.com/Support/s/${q}`;
    if (/lenovo/.test(b)) return `https://pcsupport.lenovo.com/us/en/search?query=${q}`;
    if (/samsung/.test(b)) return `https://www.samsung.com/us/support/search/?q=${q}`;
    return `https://www.google.com/search?q=${encodeURIComponent(`${brand || ''} ${model || ''} datasheet filetype:pdf`)}`;
}

/**
 * Resolve document actions for an inventory item name.
 * Prefer printers / servers / network (server-room) equipment.
 */
function resolveProductDocumentLinks(itemName, familyKey, typeCode) {
    const name = String(itemName || '').trim();
    const type = String(typeCode || '');
    const fam = String(familyKey || '');

    let product = null;
    if (typeof findProductInCatalog === 'function') {
        const hit = findProductInCatalog(name, { minScore: 55 });
        product = hit?.product || null;
    }

    const web = typeof getCachedProductWebEnrich === 'function' ? getCachedProductWebEnrich(name) : null;
    if (web?.specs?.length && !product) {
        product = {
            brand: web.brand || '',
            model: web.model || name,
            category: web.category || 'other',
            specs: web.specs
        };
    }

    const category = String(product?.category || '').toLowerCase();
    const isServerRoomType = type === 'Print' || type === 'Srv' || type === 'Net'
        || /printer|server|switch|router|firewall|ups|access\s*point/i.test(name);
    const isIctHeavy = fam === 'ict' || DATASHEET_APPLICABLE_CATEGORIES.has(category) || isServerRoomType;

    const hasFullSpecs = !!(product?.specs?.length) || !!(web?.specs?.length);
    const id = product?.id || '';
    const localPdf = (id && PRODUCT_DATASHEET_LOCAL_BY_ID[id])
        || PRODUCT_DATASHEET_LOCAL_BY_NAME.find((rule) => rule.re.test(name))?.src
        || null;
    const oemPdf = id && PRODUCT_DATASHEET_PDF_BY_ID[id] ? PRODUCT_DATASHEET_PDF_BY_ID[id] : null;
    const datasheetUrl = localPdf || oemPdf || web?.datasheetUrl || null;
    const oemSearchUrl = (product && isIctHeavy)
        ? buildOemSupportSearchUrl(product.brand, product.model)
        : (isServerRoomType ? buildOemSupportSearchUrl('', name) : null);

    const applicable = !!datasheetUrl
        || (isIctHeavy && (hasFullSpecs || !!oemSearchUrl || isServerRoomType));

    return {
        applicable,
        hasFullSpecs,
        product,
        datasheetUrl,
        oemSearchUrl,
        canPrintDatasheet: hasFullSpecs || isServerRoomType,
        title: product ? [product.brand, product.model].filter(Boolean).join(' ') : name
    };
}

function renderProductDocumentLinksHtml(itemName, familyKey, typeCode, { compact = false } = {}) {
    const doc = resolveProductDocumentLinks(itemName, familyKey, typeCode);
    if (!doc.applicable) return '';

    const chev = '<span class="psr-doc-chev" aria-hidden="true">›</span>';
    const fullBtn = doc.hasFullSpecs
        ? `<button type="button" class="psr-doc-link" data-psr-full-specs="${psrDocEscape(itemName)}" data-psr-doc-family="${psrDocEscape(familyKey || '')}" data-psr-doc-type="${psrDocEscape(typeCode || '')}">See full Specification ${chev}</button>`
        : '';

    let sheetBtn = '';
    if (doc.datasheetUrl) {
        sheetBtn = `<a class="psr-doc-btn" href="${psrDocEscape(doc.datasheetUrl)}" target="_blank" rel="noopener noreferrer">Datasheet (PDF) ${chev}</a>`;
    } else if (doc.canPrintDatasheet) {
        sheetBtn = `<button type="button" class="psr-doc-btn" data-psr-print-datasheet="${psrDocEscape(itemName)}" data-psr-doc-family="${psrDocEscape(familyKey || '')}" data-psr-doc-type="${psrDocEscape(typeCode || '')}">Datasheet (PDF) ${chev}</button>`;
    }

    const oem = (!compact && doc.oemSearchUrl && !doc.datasheetUrl)
        ? `<a class="psr-doc-oem" href="${psrDocEscape(doc.oemSearchUrl)}" target="_blank" rel="noopener noreferrer">OEM support / datasheet search ${chev}</a>`
        : '';

    if (!fullBtn && !sheetBtn) return '';

    return `
        <div class="psr-doc-actions${compact ? ' is-compact' : ''}">
            ${fullBtn}
            ${sheetBtn}
            ${oem}
        </div>
    `;
}

function openFullProductSpecificationModal(itemName, familyKey, typeCode) {
    if (typeof hideItemNameHoverTip === 'function') hideItemNameHoverTip();
    if (typeof hideProductStockHoverZoom === 'function') hideProductStockHoverZoom();
    const doc = resolveProductDocumentLinks(itemName, familyKey, typeCode);
    const product = doc.product;
    let host = document.getElementById('productStockSpecsHost');
    if (!host) {
        host = document.createElement('div');
        host.id = 'productStockSpecsHost';
        host.className = 'psr-specs-host';
        document.body.appendChild(host);
    }

    const role = typeof getInventoryItemRoleInfo === 'function'
        ? getInventoryItemRoleInfo(itemName, familyKey, typeCode, '')
        : null;

    const rows = (product?.specs || []).map(([label, value, note]) => `
        <tr>
            <th>${psrDocEscape(label)}</th>
            <td>
                <span class="psr-spec-val">${psrDocEscape(value || '—')}</span>
                ${note ? `<span class="psr-spec-note">${psrDocEscape(note)}</span>` : ''}
            </td>
        </tr>
    `).join('');

    const docLinks = renderProductDocumentLinksHtml(itemName, familyKey, typeCode);

    host.hidden = false;
    host.innerHTML = `
        <div class="psr-zoom-backdrop" data-psr-specs-close></div>
        <div class="psr-specs-dialog" role="dialog" aria-modal="true" aria-labelledby="psrFullSpecsTitle">
            <button type="button" class="psr-zoom-close" data-psr-specs-close aria-label="Close">✕</button>
            <header class="psr-specs-head">
                <h3 id="psrFullSpecsTitle">Full specification</h3>
                <p class="psr-modal-sub">${psrDocEscape(doc.title || itemName)}</p>
            </header>
            <div class="psr-specs-body">
                ${role ? `<p class="psr-zoom-role-summary">${psrDocEscape(role.summary)}</p>` : ''}
                ${rows
                    ? `<table class="psr-specs-table"><tbody>${rows}</tbody></table>`
                    : `<p class="psr-zoom-specs-empty">No curated specification rows on file for this model yet. Use Datasheet (PDF) or OEM search where available.</p>`}
                ${docLinks}
            </div>
            <footer class="psr-modal-foot">
                <button type="button" class="btn btn-primary btn-sm" data-psr-specs-close>Close</button>
            </footer>
        </div>
    `;
    host.querySelectorAll('[data-psr-specs-close]').forEach((el) => {
        el.addEventListener('click', () => {
            host.hidden = true;
            host.innerHTML = '';
        });
    });
    wireProductDocumentLinkClicks(host);
}

function openPrintableProductDatasheet(itemName, familyKey, typeCode) {
    const doc = resolveProductDocumentLinks(itemName, familyKey, typeCode);
    if (doc.datasheetUrl) {
        window.open(doc.datasheetUrl, '_blank', 'noopener,noreferrer');
        return;
    }

    const product = doc.product;
    const role = typeof getInventoryItemRoleInfo === 'function'
        ? getInventoryItemRoleInfo(itemName, familyKey, typeCode, '')
        : null;
    const title = doc.title || itemName;
    const rows = (product?.specs || []).map(([label, value, note]) => `
        <tr>
            <th>${psrDocEscape(label)}</th>
            <td>${psrDocEscape(value || '—')}${note ? ` <em>(${psrDocEscape(note)})</em>` : ''}</td>
        </tr>
    `).join('') || `
        <tr><th>Item</th><td>${psrDocEscape(itemName)}</td></tr>
        <tr><th>Role</th><td>${psrDocEscape(role?.role || 'ICT / store item')}</td></tr>
        <tr><th>Summary</th><td>${psrDocEscape(role?.summary || '')}</td></tr>
    `;

    const w = window.open('', '_blank', 'noopener,noreferrer,width=900,height=1000');
    if (!w) {
        if (typeof showToast === 'function') showToast('Allow pop-ups to open the datasheet, or use Print from the full specification view.', 'error');
        return;
    }
    w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${psrDocEscape(title)} — Datasheet</title>
<style>
  body{font-family:Segoe UI,Arial,sans-serif;color:#101828;margin:32px;line-height:1.45}
  h1{font-size:1.35rem;margin:0 0 4px}
  .sub{color:#667085;margin:0 0 18px;font-size:0.9rem}
  .role{margin:0 0 16px;padding:12px 14px;background:#f8fafc;border:1px solid #e4e7ec;border-radius:8px}
  table{width:100%;border-collapse:collapse;font-size:0.92rem}
  th,td{border-bottom:1px solid #eef2f6;padding:8px 6px;vertical-align:top;text-align:left}
  th{width:32%;color:#475467;font-weight:600}
  .actions{margin-top:22px}
  @media print{.actions{display:none} body{margin:12mm}}
</style></head><body>
  <h1>${psrDocEscape(title)}</h1>
  <p class="sub">TECHSTORESys product datasheet · ${psrDocEscape(new Date().toLocaleDateString())}</p>
  ${role ? `<div class="role"><strong>${psrDocEscape(role.role)}</strong><br>${psrDocEscape(role.summary)}</div>` : ''}
  <table><tbody>${rows}</tbody></table>
  <div class="actions">
    <button type="button" onclick="window.print()">Print / Save as PDF</button>
    ${doc.oemSearchUrl ? `<a href="${psrDocEscape(doc.oemSearchUrl)}" target="_blank" rel="noopener">OEM support search</a>` : ''}
  </div>
  <script>setTimeout(function(){ try{ window.print(); }catch(e){} }, 400);<\/script>
</body></html>`);
    w.document.close();
}

function wireProductDocumentLinkClicks(root) {
    if (!root) return;
    root.querySelectorAll('[data-psr-full-specs]').forEach((el) => {
        el.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            openFullProductSpecificationModal(
                el.getAttribute('data-psr-full-specs') || '',
                el.getAttribute('data-psr-doc-family') || '',
                el.getAttribute('data-psr-doc-type') || ''
            );
        });
    });
    root.querySelectorAll('[data-psr-print-datasheet]').forEach((el) => {
        el.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            openPrintableProductDatasheet(
                el.getAttribute('data-psr-print-datasheet') || '',
                el.getAttribute('data-psr-doc-family') || '',
                el.getAttribute('data-psr-doc-type') || ''
            );
        });
    });
}

window.resolveProductDocumentLinks = resolveProductDocumentLinks;
window.renderProductDocumentLinksHtml = renderProductDocumentLinksHtml;
window.openFullProductSpecificationModal = openFullProductSpecificationModal;
window.openPrintableProductDatasheet = openPrintableProductDatasheet;
window.wireProductDocumentLinkClicks = wireProductDocumentLinkClicks;
