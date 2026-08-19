/* suppliers-seed.js — Registered suppliers G/C/006 (computers, printers, photocopiers, networking & accessories)
 * Compliant with Requirements for Supplier Evaluation (Director Procurement / Army HQ).
 */

const IT_DIR_SUPPLIERS_SOURCE =
    'REGISTERED SUPPLIERS LIST — Computers, Printers, Photocopiers, Networking Equipment and Accessories G/C/006';

const IT_DIR_SUPPLIERS_CATEGORY = 'G/C/006 — Computers, Printers, Photocopiers, Networking Equipment and Accessories';

/**
 * Official registered list (Ser 01–47) from IT-DIR G/C/006 register pages, sorted A–Z by name.
 * Ser 36 omitted (duplicate of Reeltec / Reeltech). Duplicate printed index 43/44 renumbered 43–47.
 * Status Active = listed as compliant with Supplier Evaluation Requirements pack.
 */
const IT_DIR_SUPPLIERS_SEED = [
    { ser: 39, name: 'Albjucy', phone: '0772 605 106 / 0714 024 647' },
    { ser: 44, name: 'Allyme', phone: '0780 388 548' },
    { ser: 1, name: 'Anamay Distributors', phone: '0772 447 499' },
    { ser: 11, name: 'Beckland', phone: '0774 123 580 / 0776 063 471' },
    { ser: 17, name: 'Brand Masters', phone: '0772 285 299 / 0772 940 372' },
    { ser: 6, name: 'Channmael', phone: '0772 433 898' },
    { ser: 12, name: 'Countryvale', phone: '0772 390 641 / 0715 214 933' },
    { ser: 10, name: 'Dampack Enterprises', phone: '0772 974 334' },
    { ser: 38, name: 'Dekford Enterprises', phone: '0772 290 698 / 0771 033 325' },
    { ser: 35, name: 'Devolve Enterprises', phone: '0774 212 089 / 0776 388 108' },
    { ser: 25, name: 'Diamond Alliance Investments', phone: '0771 513 080 / 0719 202 258' },
    { ser: 20, name: 'Ebenezer Shipping & Freight', phone: '0772 844 437 / 0772 344 715' },
    { ser: 2, name: 'Findtech Trading', phone: '0773 338 588' },
    { ser: 18, name: 'Firstpack', phone: '0773 048 896' },
    { ser: 41, name: 'Flowtech', phone: '0782 491 517' },
    { ser: 29, name: 'Forltune Investments', phone: '0776 044 163' },
    { ser: 45, name: 'Foster Tech', phone: '0786 676 432 / 0772 683 537' },
    { ser: 9, name: 'Gerim South Engineering', phone: '0712 588 536' },
    { ser: 13, name: 'Graniteside', phone: '0772 903 505' },
    { ser: 34, name: 'Graymau Investments', phone: '0772 495 538' },
    { ser: 46, name: 'Hardspan', phone: '0772 342 800' },
    { ser: 40, name: 'Jamnely', phone: '0710 281 402 / 0718 778 709' },
    { ser: 21, name: 'Kintex Investments', phone: '0772 283 598' },
    { ser: 3, name: 'Kreamwood Trading', phone: '0785 702 418' },
    { ser: 31, name: 'Kudmeld Investments', phone: '0786 816 146 / 0715 640 254' },
    { ser: 7, name: 'Laserjet Impressions', phone: '0772 335 976' },
    { ser: 14, name: 'Latertech Investments (Pvt)', phone: '0772 391 185 / 0242 0749575' },
    { ser: 47, name: 'Lunacraft', phone: '0785 721 191' },
    { ser: 22, name: 'Makbros', phone: '0771 070 212' },
    { ser: 23, name: 'Munda Wedu', phone: '0772 162 396 / 0783 526' },
    { ser: 26, name: 'NC & Banat Strategic Partners', phone: '0773 412 718 / 0782 819 776' },
    { ser: 19, name: 'Nibex Hardware t/a Century Computers', phone: '0772 101 138 / 0717 239 191' },
    { ser: 43, name: 'Nixzimo', phone: '0712 491 600' },
    { ser: 15, name: 'Norkom', phone: '0772 622 857' },
    { ser: 37, name: 'Osinet', phone: '0772 851 262' },
    { ser: 28, name: 'Potash Zimbabwe', phone: '0772 494 416 / 0786 126 611' },
    { ser: 24, name: 'Ralpam (Pvt) Ltd', phone: '0781 645 288 / 0785 220 509' },
    { ser: 27, name: 'Reeltec Investments', phone: '0783 785 893 / 0785 525 070', notes: 'Also listed as Reeltech Invest (same contacts)' },
    { ser: 5, name: 'Rinfoteck Investments', phone: '0772 762 127' },
    { ser: 4, name: 'Shakeline Investments', phone: '0774 339 332' },
    { ser: 42, name: 'Sunbird Investments', phone: '0779 724 101 / 0782 040 965' },
    { ser: 33, name: 'Tanbenny Technologies', phone: '0775 912 424 / 0772 956 882' },
    { ser: 30, name: 'Trasper Incorporated', phone: '0774 415 414 / 0777 682 745' },
    { ser: 16, name: 'Upright', phone: '0772 676 290' },
    { ser: 8, name: 'Wendyrosso t/a Uplink Tech', phone: '0774 206 160 / 0773 028 940' },
    { ser: 32, name: 'Zacks Electronics', phone: '0774 078 220 / 0773 067 535' }
]

function normalizeSupplierNameKey(name) {
    return String(name || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
}

function mergeSupplierPhoneLists(existing, incoming) {
    const parts = `${existing || ''} / ${incoming || ''}`
        .split(/[/,;|]+/)
        .map((p) => p.trim())
        .filter(Boolean);
    const seen = new Set();
    const unique = [];
    parts.forEach((p) => {
        const key = p.replace(/\s+/g, '');
        if (seen.has(key)) return;
        seen.add(key);
        unique.push(p);
    });
    return unique.join(' / ');
}

function supplierComplianceNotes(seed) {
    const bits = [
        IT_DIR_SUPPLIERS_SOURCE,
        IT_DIR_SUPPLIERS_CATEGORY,
        seed?.ser != null ? `Ser ${String(seed.ser).padStart(2, '0')}` : '',
        'Compliant with Requirements for Supplier Evaluation (bound pack)',
        seed?.notes || ''
    ];
    return bits.filter(Boolean).join(' · ');
}

/**
 * Import / replace the Registered Suppliers List (G/C/006).
 * @returns {{ added: number, updated: number, total: number }}
 */
function importOfficialSuppliersList({ replace = true } = {}) {
    const tbody = document.getElementById('suppliers-table-body');
    if (!tbody) return { added: 0, updated: 0, total: 0 };

    if (replace) tbody.innerHTML = '';

    const existingRows = typeof collectSupplierRows === 'function' ? collectSupplierRows() : [];
    const byName = new Map();
    existingRows.forEach((row) => {
        byName.set(normalizeSupplierNameKey(row.name), row);
    });

    let added = 0;
    let updated = 0;
    const year = new Date().getFullYear();
    let nextId = replace ? 1 : existingRows.length + 1;

    IT_DIR_SUPPLIERS_SEED.forEach((seed) => {
        const key = normalizeSupplierNameKey(seed.name);
        const existing = !replace ? byName.get(key) : null;
        if (existing) {
            const tr = tbody.rows[existing.index];
            if (!tr) return;
            const phoneInput = tr.querySelectorAll('input:not([type="hidden"])')[3];
            const notesInput = tr.querySelector('.supplier-notes-field');
            const statusSel = tr.querySelector('select');
            if (phoneInput) {
                phoneInput.value = mergeSupplierPhoneLists(phoneInput.value, seed.phone);
            }
            if (notesInput) {
                notesInput.value = supplierComplianceNotes(seed);
            }
            if (statusSel) statusSel.value = 'Active';
            updated += 1;
            return;
        }

        const id = `SUP-GC006-${year}-${String(seed.ser || nextId).padStart(3, '0')}`;
        nextId += 1;
        const tr = buildSupplierRow({
            id,
            name: seed.name,
            contact: '',
            phone: seed.phone,
            email: '',
            start: '',
            end: '',
            status: 'Active',
            notes: supplierComplianceNotes(seed)
        });
        tbody.appendChild(tr);
        byName.set(key, { name: seed.name });
        added += 1;
    });

    return {
        added,
        updated,
        total: typeof collectSupplierRows === 'function' ? collectSupplierRows().length : tbody.rows.length
    };
}

window.IT_DIR_SUPPLIERS_SEED = IT_DIR_SUPPLIERS_SEED;
window.IT_DIR_SUPPLIERS_SOURCE = IT_DIR_SUPPLIERS_SOURCE;
window.IT_DIR_SUPPLIERS_CATEGORY = IT_DIR_SUPPLIERS_CATEGORY;
window.importOfficialSuppliersList = importOfficialSuppliersList;
window.normalizeSupplierNameKey = normalizeSupplierNameKey;
