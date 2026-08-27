/* field-help.js — toggle Help mode: point at labels/fields/buttons for purpose popups */

const FIELD_HELP = {
    'bin / note': { title: 'Bin / note', body: 'Remarks for this stock line. Record the bin / shelf location or bin-card detail, plus any short note (damage, sealed carton, voucher ref, reason for surplus/deficit).' },
    'bin bal': { title: 'Bin Bal (Bin card balance)', body: 'Quantity shown on the physical bin card at the storage location. Should agree with what is on the shelf and, normally, with the ledger balance.' },
    'bin card': { title: 'Bin card', body: 'Card kept at the shelf/bin showing receipts, issues and balance for that item at that location.' },
    'bin card balance': { title: 'Bin card balance', body: 'Balance on the bin card at the storage place. Compare with physical count and ledger balance during stock take.' },
    'ledger bal': { title: 'Ledger Bal', body: 'Balance on the account / ledger card (or system on-hand). Compared with Bin Bal and physical stock to find surplus or deficit.' },
    'ledger/account card balance': { title: 'Ledger / account card balance', body: 'Quantity on the ledger or account card. Should match the bin card and physical count unless there is a known variance.' },
    'ledger': { title: 'Ledger', body: 'Which stores ledger / family the item belongs to (e.g. Consumables, ICT Equipment, Spares, Softwares).' },
    'ledger use': { title: 'Ledger use', body: 'Which ledger or use the line is posted against on the official Q form.' },
    'vaqs no': { title: 'VAQS No', body: 'Vocabulary / stores catalogue reference number for the item (where used in Army QM forms).' },
    'vaqs': { title: 'VAQS', body: 'Vocabulary of Army Quartermaster Stores — catalogue reference used to identify store items.' },
    'stock': { title: 'Stock', body: 'Physical stock found / counted for this line (what is actually on hand).' },
    'system on hand': { title: 'System on hand', body: 'Quantity the TechStores system currently shows for this item. Book figure used in stock take.' },
    'physical count': { title: 'Physical count', body: 'What you actually count in the store. Variance is calculated against system on hand.' },
    'variance': { title: 'Variance', body: 'Physical count minus system on hand. Positive = surplus; negative = deficit.' },
    'surplus': { title: 'Surplus', body: 'Physical stock is more than the ledger/system. Normally brought on charge (e.g. Q 1033) after investigation.' },
    'deficient': { title: 'Deficient', body: 'Physical stock is less than the ledger/system. Action under ASO loss/write-off rules (e.g. Q 998 / Q 1).' },
    'deficit': { title: 'Deficit', body: 'Shortage — physical less than system/ledger. Investigate and action under ASO Chapter 6 as required.' },
    'remarks': { title: 'Remarks', body: 'Free text notes — bin location, condition, witness, or voucher reference.' },
    'description': { title: 'Description', body: 'Plain-language description of the store item or service on this Q / SVCS form line.' },
    'tv/ctv/crv': { title: 'TV / CTV / CRV', body: 'Voucher references: Transfer Voucher (TV), Credit Transfer Voucher (CTV), or Certified Receipt Voucher (CRV).' },
    'crv': { title: 'CRV', body: 'Certified Receipt Voucher — records receipt of stores onto charge.' },
    'tv': { title: 'TV', body: 'Transfer Voucher — moves stores between accounts / locations.' },
    'indent': { title: 'Indent', body: 'Official written request for stores (e.g. ZNA Q 982). Starts the demand on the Cost Centre Dir.' },
    'aso': { title: 'ASO', body: 'Accounting Standing Orders — Army rules for stores accounting, stock take, losses, retention, etc.' },
    'gl': { title: 'GL (General Ledger)', body: 'Vote / account code used for budgeting and spending.' },
    'view by': { title: 'View by', body: 'Monthly — one DAF vote month. Quarterly — sums Jan–Mar, Apr–Jun, etc. Yearly — sums all twelve months of the selected year.' },
    'target month': { title: 'Target month', body: 'Pick the month to view or edit. In Quarterly/Yearly mode, pick any month inside the quarter or year you want to review.' },
    'cost centre': { title: 'Cost centre', body: 'Directorate or unit vote that owns the requirement (e.g. IT Dir).' },
    'rfq': { title: 'RFQ', body: 'Request for Quotations — DP invites suppliers to quote; AIAD may do due diligence.' },
    'dp': { title: 'DP', body: 'Directorate Procurement — executes purchase after authority; issues RFQ / PO / contract.' },
    'aiad': { title: 'AIAD', body: 'Army Internal Audit Directorate — due diligence on quotations; best value, not always lowest price.' },
    'qs br': { title: 'QS Br', body: 'Quartermaster / QS Branch — authority, distribution and minute sheets.' },
    'stock take date': { title: 'Stock take date', body: 'Date the physical count was conducted.' },
    'conducted by': { title: 'Conducted by', body: 'Name / rank of the person or board who carried out the stock take.' },
    'location': { title: 'Location', body: 'Store or site where the activity / count was done.' },
    'notes': { title: 'Notes', body: 'Extra comments — board, witnesses, references, special conditions.' },
    'section': { title: 'Section', body: 'Stores section or group covered by this certificate / form (e.g. ICT, Consumables).' },
    'certificate of stocktaking at': { title: 'Certificate of stocktaking at', body: 'Place / unit where the stocktaking was carried out (as printed on Q 987).' },
    'year (20..)': { title: 'Year', body: 'Two-digit year of the stocktaking certificate (e.g. 26 for 2026).' },
    'no': { title: 'No', body: 'Serial / certificate / line number for this form entry.' },
    'signature — officer conducting stocktaking': { title: 'Stocktaking officer signature', body: 'Signature / name of the officer who conducted the stocktaking.' },
    'signature — storeholder': { title: 'Storeholder signature', body: 'Signature / name of the storeholder responsible for the stores on charge.' },
    'unit number': { title: 'Unit Number', body: 'Official unit number of the demanding / owning unit on this form.' },
    'unit': { title: 'Unit', body: 'Name of the unit raising or owning this indent / voucher.' },
    'station and date': { title: 'Station and Date', body: 'Location (station) and date written on the form header.' },
    'commenced': { title: 'Commenced', body: 'Date workshop / service work started on this indent.' },
    'completed': { title: 'Completed', body: 'Date workshop / service work was finished.' },
    'job no': { title: 'Job no', body: 'Workshop job number for this line of work on SVCS 1045.' },
    'designation': { title: 'Designation', body: 'Equipment type / designation being repaired or serviced.' },
    'nature of service and authority': { title: 'Nature of service and authority', body: 'What work is required (repair, upgrade, antivirus, etc.) and the authority for the job.' },
    'labour': { title: 'Labour', body: 'Labour cost portion of the workshop indent summary.' },
    'materials': { title: 'Materials', body: 'Materials / spares cost on the workshop indent.' },
    'contracts': { title: 'Contracts', body: 'Contracted work cost (if any) on the workshop indent.' },
    'travelling': { title: 'Travelling', body: 'Travelling cost charged to this workshop indent.' },
    'carriage': { title: 'Carriage', body: 'Carriage / transport cost charged to this workshop indent.' },
    'total cost': { title: 'Total cost', body: 'Sum of labour, materials, contracts, travelling and carriage on SVCS 1045.' },
    'signed': { title: 'Signed', body: 'Signature / name of the person signing this part of the form.' },
    'oc (unit)': { title: 'OC (Unit)', body: 'Officer Commanding of the owning / demanding unit.' },
    'approved': { title: 'Approved', body: 'Approval signature / name for this indent or voucher.' },
    'oc': { title: 'OC', body: 'Officer Commanding — approving or owning authority on this form.' },
    'oc workshops': { title: 'OC Workshops', body: 'Officer Commanding Workshops — workshop authority on SVCS 1045.' },
    'received': { title: 'Received', body: 'Name of the person who received the equipment / form.' },
    'received date': { title: 'Received Date', body: 'Date the equipment or form was received.' },
    'universal search': { title: 'Universal Search', body: 'Jump to modules, GLs, Q forms — and track issued controlled stores by ZA number or Serial Number (printer, laptop, desktop, projector, tablet, router, AP). Shortcut: Ctrl+K.' },
    'learning centre': { title: 'Learning Centre', body: 'Charts and explanations for procurement, suppliers, IT Dir organogram / establishment, multi-unit notes and system structure.' },
    'system help': { title: 'System Help', body: 'Standing guidance: ASO Ch 25 retention, backups, and how to use Alerts / Orderly Room / Field Help.' },
    'field help': { title: 'Field Help', body: 'Click to turn Help mode ON. Then point at any label, field, text box or button to see its purpose. Click again to turn Help mode OFF.' },
    'gate register': { title: 'Gate Register', body: 'Regimental Police book equipment in/out at the gate before it reaches TechStores for repair / upgrade work. Does not change inventory.' },
    'equipment register': { title: 'TechStores Equipment Register', body: 'Storeman custody book for repair intake. Does not affect TechStores equipment inventory on charge.' },
    'workshop register': { title: 'IT Workshop Register', body: 'Workshop booking for diagnosis and repair / upgrade / antivirus work. Every line needs ZNA SVCS 1045.' },
    'orderly room': { title: 'Orderly Room (DF)', body: 'IT Dir Orderly Room Daily File / First Sight — letters and unit requisitions are booked here. Alert TechStores so requisitions are not left un-actioned.' },
    'daily file': { title: 'Daily File (DF)', body: 'Orderly Room file where incoming letters and requisitions are placed for Heads of Department and TechStores awareness.' },
    'first sight': { title: 'First Sight', body: 'Orderly Room routing so commanders / HoDs see correspondence promptly before deeper filing.' },
    'gs branch': { title: 'GS Branch', body: 'General Staff Branch — IT Dir falls under GS. Often authorises unit requisition letters to be actioned, starting the procurement cycle.' },
    'svcs 1045': { title: 'ZNA SVCS 1045', body: 'Workshop indent form. Must accompany every equipment item booked for repair or related workshop action.' },
    'svcs 890': { title: 'ZNA SVCS 890', body: 'Related Services form used with workshop / equipment processes.' },
    'date in': { title: 'Date In', body: 'Date the equipment was received / booked into this register.' },
    's/n or za no': { title: 'S/N or ZA No.', body: 'Serial number or ZA (Army) equipment number identifying the item.' },
    'received by': { title: 'Received By', body: 'Person who received the equipment into this register (RP / storeman / workshop).' },
    'diagnosis': { title: 'Diagnosis', body: 'Workshop assessment of the fault or work required (repair, software upgrade, antivirus, etc.).' },
    'save': { title: 'Save', body: 'Stores the current form / module data into the TechStores database.' },
    'save form': { title: 'Save Form', body: 'Saves this Q / SVCS form data into the TechStores database.' },
    'print': { title: 'Print', body: 'Opens the browser print dialog for this form or report.' },
    'print form': { title: 'Print Form', body: 'Prints this official Q / SVCS form layout.' },
    'refresh': { title: 'Refresh', body: 'Reloads figures from the system so you see the latest on-hand / status.' },
    'software licence': { title: 'Software licence (expended)', body: 'Online purchases (Mastercard etc.) are expended — not stock on hand. Enter Licence Day 1; package (1 month / 1 year) auto-fills expiry. System alerts 5 days before renewal.' },
    'licence day 1': { title: 'Licence Day 1', body: 'Start date of the licence period (e.g. 7 Jul 2026). Expiry is auto-filled from the package term.' },
    'renewal alert': { title: 'Licence renewal alert', body: 'Notifications warn 5 days before a software licence expires so IT Dir can renew in time.' },
    'generate report': { title: 'Generate Report', body: 'Builds a printable / exportable report from the current module data.' },
    'add row': { title: 'Add Row', body: 'Adds another blank line to this Q / SVCS table so you can enter more items.' },
    'save pdf': { title: 'Save PDF', body: 'Prints this view using your PDF printer (Microsoft Print to PDF) so you can keep a file copy.' },
    'close': { title: 'Close', body: 'Closes this panel or form and returns you to the previous screen / dashboard.' },
    'logout': { title: 'Logout', body: 'Ends your session. Data stays in the database — logout does not wipe stores records.' },
    'sign in': { title: 'Sign In', body: 'Logs you into TechStores with your username and password.' },
    'backup': { title: 'Backup', body: 'Exports a backup of system data for safekeeping (keep after major stock takes / month-end).' },
    'username': { title: 'Username', body: 'Your TechStores login name (e.g. admin, store, viewer).' },
    'password': { title: 'Password', body: 'Your TechStores login password. Defaults are for development only.' },
    'voucher no': { title: 'Voucher No', body: 'Official voucher number allocated to this Q form.' },
    'date': { title: 'Date', body: 'Official date of this form / voucher.' },
    'from unit': { title: 'From unit', body: 'Unit issuing or sending the stores on this voucher.' },
    'authority': { title: 'Authority', body: 'Written authority / reference that permits this issue, receipt or service.' },
    'qty': { title: 'Qty', body: 'Quantity for this line item.' },
    'rate': { title: 'Rate', body: 'Unit rate / price used to calculate the amount.' },
    'amount': { title: 'Amount', body: 'Line total (usually Qty × Rate) on this form.' }
};

const FIELD_HELP_SKIP = new Set(['SCRIPT', 'STYLE', 'LINK', 'META', 'BR', 'HR', 'SVG', 'PATH', 'IMG']);

let fieldHelpPopupEl = null;
let fieldHelpHideTimer = null;
let fieldHelpShowTimer = null;
let fieldHelpActiveAnchor = null;
let fieldHelpModeOn = false;

function isFieldHelpModeOn() {
    return !!fieldHelpModeOn && document.body.classList.contains('fh-mode-on');
}

function normalizeFieldHelpKey(text) {
    return String(text || '')
        .replace(/\u00a0/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase()
        .replace(/[–—]/g, '/')
        .replace(/[()]/g, '')
        .replace(/\s*\/\s*/g, ' / ')
        .replace(/\s+/g, ' ')
        .trim();
}

function lookupFieldHelp(raw) {
    if (!raw) return null;
    const key = normalizeFieldHelpKey(raw);
    if (!key) return null;
    if (FIELD_HELP[key]) return FIELD_HELP[key];
    const entries = Object.keys(FIELD_HELP).sort((a, b) => b.length - a.length);
    for (const k of entries) {
        if (k.length < 3) continue;
        if (key === k) return FIELD_HELP[k];
        if (key.startsWith(k + ' ') || key.endsWith(' ' + k) || key.includes(' ' + k + ' ')) return FIELD_HELP[k];
        if (key.replace(/\s/g, '') === k.replace(/\s/g, '')) return FIELD_HELP[k];
    }
    for (const k of entries) {
        if (k.length < 3 && key === k) return FIELD_HELP[k];
    }
    return null;
}

function cleanHelpLabel(text) {
    return String(text || '').replace(/\s+/g, ' ').replace(/[×✕✖]/g, 'Close').trim();
}

function moduleContextFor(el) {
    const mod = el.closest('.form-container, #dashboard, .login-card');
    if (!mod) return '';
    if (mod.id === 'dashboard') return 'Dashboard';
    if (typeof getModuleLabel === 'function' && mod.id) {
        const label = getModuleLabel(mod.id);
        if (label) return label;
    }
    const title = mod.querySelector('.form-title')?.textContent;
    return cleanHelpLabel(title || mod.id || '');
}

function controlKind(el) {
    const tag = el.tagName;
    if (tag === 'BUTTON' || el.getAttribute('role') === 'button' || el.classList.contains('btn') || el.classList.contains('nav-btn')) return 'button';
    if (tag === 'A' && (el.classList.contains('btn') || el.classList.contains('nav-btn') || el.hasAttribute('data-target'))) return 'button';
    if (tag === 'SELECT') return 'dropdown';
    if (tag === 'TEXTAREA') return 'text area';
    if (tag === 'LABEL' || el.classList.contains('form-label') || el.classList.contains('nav-label')) return 'label';
    if (tag === 'TH') return 'column';
    if (tag === 'INPUT') {
        const t = (el.type || 'text').toLowerCase();
        if (t === 'checkbox') return 'checkbox';
        if (t === 'radio') return 'option';
        if (t === 'date' || t === 'month' || t === 'datetime-local') return 'date field';
        if (t === 'number') return 'number field';
        if (t === 'search') return 'search field';
        if (t === 'password') return 'password field';
        if (t === 'file') return 'file upload';
        if (t === 'hidden') return 'hidden field';
        return 'text field';
    }
    return 'control';
}

function synthesizeFieldHelp(el, label) {
    const title = cleanHelpLabel(label) || 'This control';
    const kind = controlKind(el);
    const ctx = moduleContextFor(el);
    const inModule = ctx ? ` In: ${ctx}.` : '';
    const low = title.toLowerCase();

    if (kind === 'button') {
        if (/save/.test(low)) return { title, body: `Button — saves the current data to the TechStores database.${inModule}` };
        if (/print/.test(low)) return { title, body: `Button — opens print for this form or report.${inModule}` };
        if (/pdf/.test(low)) return { title, body: `Button — save/export this view as PDF via the print dialog.${inModule}` };
        if (/refresh|reload/.test(low)) return { title, body: `Button — reloads the latest figures from the system.${inModule}` };
        if (/report/.test(low)) return { title, body: `Button — generates a report from this module’s data.${inModule}` };
        if (/search/.test(low)) return { title, body: `Button — opens search to jump to modules, forms or records.${inModule}` };
        if (/close|×|✕/.test(low) || title === 'Close') return { title: 'Close', body: `Button — closes this panel and returns to the previous view.${inModule}` };
        if (/logout|sign out/.test(low)) return { title, body: 'Button — ends your session. Stored data remains in the database.' };
        if (/add|new|create|\+/.test(low)) return { title, body: `Button — adds a new line or record.${inModule}` };
        if (/delete|remove|clear/.test(low)) return { title, body: `Button — removes or clears the selected item. Confirm if asked.${inModule}` };
        if (/edit|update/.test(low)) return { title, body: `Button — opens or applies edits for this record.${inModule}` };
        if (/field help/.test(low)) return { title: 'Field Help', body: 'Toggle Help mode on or off. When ON, point at labels, fields and buttons to see their purpose.' };
        if (el.hasAttribute('data-target') || el.classList.contains('nav-btn')) {
            return { title, body: `Navigation — opens the “${title}” module or screen.${inModule}` };
        }
        return { title, body: `Button — click to run “${title}”.${inModule}` };
    }

    if (kind === 'column') {
        return { title, body: `Table column “${title}” — enter or read this value on each row.${inModule}` };
    }
    if (kind === 'label') {
        return { title, body: `Label for the field “${title}”. Point at the field beside it to enter or change the value.${inModule}` };
    }
    if (kind === 'dropdown') {
        return { title, body: `Dropdown — choose one option for “${title}”.${inModule}` };
    }
    if (kind === 'checkbox') {
        return { title, body: `Checkbox — tick to turn “${title}” on; untick to turn it off.${inModule}` };
    }
    if (kind === 'date field') {
        return { title, body: `Date field — select or type the date for “${title}”.${inModule}` };
    }
    if (kind === 'number field') {
        return { title, body: `Number field — enter a quantity or amount for “${title}”.${inModule}` };
    }
    if (kind === 'search field') {
        return { title, body: `Search field — type to filter or find items related to “${title}”.${inModule}` };
    }
    if (kind === 'password field') {
        return { title, body: `Password field — enter the secret password for “${title}”.${inModule}` };
    }
    if (kind === 'file upload') {
        return { title, body: `File upload — choose a file for “${title}”.${inModule}` };
    }
    if (kind === 'text area') {
        return { title, body: `Text area — type longer notes for “${title}”.${inModule}` };
    }
    return { title, body: `Field — enter or review the value for “${title}”.${inModule}` };
}

function labelTextForElement(el) {
    if (!el) return '';
    if (el.getAttribute('data-help-title')) return el.getAttribute('data-help-title');
    if (el.getAttribute('data-help-key')) return el.getAttribute('data-help-key');
    if (el.getAttribute('aria-label')) return el.getAttribute('aria-label');

    if (el.id) {
        let byFor = null;
        try {
            const esc = (window.CSS && CSS.escape) ? CSS.escape(el.id) : el.id.replace(/"/g, '\\"');
            byFor = document.querySelector(`label[for="${esc}"]`);
        } catch (_) { /* ignore */ }
        if (byFor) return cleanHelpLabel(byFor.textContent);
    }
    const wrapLabel = el.closest('label');
    if (wrapLabel && wrapLabel !== el) {
        const clone = wrapLabel.cloneNode(true);
        clone.querySelectorAll('input, select, textarea, button').forEach((n) => n.remove());
        const t = cleanHelpLabel(clone.textContent);
        if (t) return t;
    }
    const prev = el.closest('.form-col, .form-group, .form-row, td, th, li')?.querySelector('.form-label, label');
    if (prev && prev !== el) {
        const t = cleanHelpLabel(prev.textContent);
        if (t) return t;
    }

    if (el.tagName === 'TH' || el.tagName === 'LABEL' || el.classList.contains('form-label') || el.classList.contains('nav-label')) {
        return cleanHelpLabel(el.textContent);
    }
    if (el.tagName === 'BUTTON' || el.tagName === 'A' || el.classList.contains('btn')) {
        const t = cleanHelpLabel(el.textContent) || el.getAttribute('title') || el.getAttribute('aria-label');
        if (t) return t;
    }
    if (el.getAttribute('placeholder')) return el.getAttribute('placeholder');
    if (el.getAttribute('title')) return el.getAttribute('title');
    if (el.name) return el.name.replace(/[_-]+/g, ' ');
    if (el.id) return el.id.replace(/[_-]+/g, ' ');
    return controlKind(el);
}

function eventElement(target) {
    if (!target) return null;
    if (target.nodeType === 1) return target;
    return target.parentElement || null;
}

function resolveHelpForElement(el) {
    if (!el || el.nodeType !== 1) return null;
    if (FIELD_HELP_SKIP.has(el.tagName)) return null;
    if (el.id === 'fieldHelpToggleBtn' || el.id === 'fieldHelpFab') {
        return FIELD_HELP['field help'];
    }
    if (el.closest('.fh-popup, #fieldHelpModeBanner')) return null;
    if (el.closest('#fieldHelpFab, #fieldHelpToggleBtn')) return null;
    if (el.type === 'hidden') return null;

    const explicit = el.getAttribute('data-help');
    if (explicit) {
        if (explicit.includes('|')) {
            const [title, ...rest] = explicit.split('|');
            return { title: title.trim(), body: rest.join('|').trim() };
        }
        return lookupFieldHelp(explicit) || { title: el.getAttribute('data-help-title') || 'Help', body: explicit };
    }

    const label = labelTextForElement(el);
    const candidates = [
        el.getAttribute('data-help-key'),
        label,
        el.getAttribute('aria-label'),
        el.getAttribute('placeholder'),
        el.getAttribute('title'),
        el.textContent
    ].filter(Boolean);

    for (const c of candidates) {
        const hit = lookupFieldHelp(c);
        if (hit) return hit;
    }

    const nice = cleanHelpLabel(label);
    if (!nice || nice.length > 80) {
        if (/^(INPUT|SELECT|TEXTAREA|BUTTON|A|TH|LABEL)$/i.test(el.tagName) || el.classList.contains('btn') || el.classList.contains('nav-btn')) {
            return synthesizeFieldHelp(el, nice || controlKind(el));
        }
        return null;
    }
    return synthesizeFieldHelp(el, nice);
}

function isHelpableElement(el) {
    if (!el || el.nodeType !== 1) return false;
    if (el.closest('.fh-popup')) return false;
    if (FIELD_HELP_SKIP.has(el.tagName)) return false;
    if (el.type === 'hidden') return false;
    if (el.getAttribute('aria-hidden') === 'true') return false;
    if (el.id === 'fieldHelpToggleBtn' || el.id === 'fieldHelpFab') return true;

    // Never capture sidebar label spans — parent <a> handles nav
    if (el.closest('.sidebar-menu') && (el.classList.contains('nav-label') || el.classList.contains('nav-ico') || el.classList.contains('nav-caret') || el.classList.contains('gl-nav-text'))) {
        return false;
    }

    if (el.matches('label, .form-label, th, [data-help], [data-help-key], .aso-ref')) return true;
    if (el.matches('button, .btn, .nav-btn, a.nav-btn, a[data-target], [role="button"]')) return true;
    if (el.matches('input:not([type="hidden"]), select, textarea')) return true;
    if (el.matches('.duties-tab, .pg-tab, .loan-stat, .card[data-target]')) return true;
    return false;
}

function findHelpTargetFromEvent(start) {
    let el = start;
    while (el && el.nodeType === 1 && el !== document.body && el !== document.documentElement) {
        if (isHelpableElement(el)) {
            const help = resolveHelpForElement(el);
            if (help) return { el, help };
        }
        el = el.parentElement;
    }
    return null;
}

function ensureFieldHelpPopup() {
    if (fieldHelpPopupEl) return fieldHelpPopupEl;
    fieldHelpPopupEl = document.createElement('div');
    fieldHelpPopupEl.id = 'fieldHelpPopup';
    fieldHelpPopupEl.className = 'fh-popup';
    fieldHelpPopupEl.setAttribute('role', 'dialog');
    fieldHelpPopupEl.setAttribute('aria-live', 'polite');
    fieldHelpPopupEl.hidden = true;
    fieldHelpPopupEl.innerHTML = `
        <div class="fh-popup-head">
            <strong class="fh-popup-title"></strong>
            <button type="button" class="fh-popup-close" aria-label="Close help">&times;</button>
        </div>
        <p class="fh-popup-body"></p>
        <p class="fh-popup-hint">Hover any label or field for an explanation · Header “Field Help” turns this off</p>`;
    document.body.appendChild(fieldHelpPopupEl);
    fieldHelpPopupEl.querySelector('.fh-popup-close')?.addEventListener('click', hideFieldHelp);
    return fieldHelpPopupEl;
}

function ensureFieldHelpChrome() {
    let banner = document.getElementById('fieldHelpModeBanner');
    if (!banner) {
        banner = document.createElement('div');
        banner.id = 'fieldHelpModeBanner';
        banner.className = 'fh-mode-banner';
        banner.hidden = true;
        banner.innerHTML = `
            <span><strong>Help mode ON</strong> — point at any label, field, text box or button to see its purpose (especially Q &amp; SVCS forms).</span>
            <button type="button" class="btn btn-ghost btn-sm" id="fieldHelpBannerOffBtn">Turn off</button>`;
        document.body.appendChild(banner);
        banner.querySelector('#fieldHelpBannerOffBtn')?.addEventListener('click', () => setFieldHelpMode(false));
    }

    let fab = document.getElementById('fieldHelpFab');
    if (!fab) {
        fab = document.createElement('button');
        fab.id = 'fieldHelpFab';
        fab.type = 'button';
        fab.className = 'fh-fab';
        fab.title = 'Field Help — click to turn help popups ON';
        fab.setAttribute('aria-pressed', 'false');
        fab.innerHTML = '<span class="fh-fab-label">Field Help</span><span class="fh-fab-state">OFF</span>';
        document.body.appendChild(fab);
        fab.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            setFieldHelpMode(!isFieldHelpModeOn());
        });
    }
    return { banner, fab };
}

function positionFieldHelpPopup(anchor) {
    const popup = ensureFieldHelpPopup();
    const rect = anchor.getBoundingClientRect();
    const pad = 10;
    popup.hidden = false;
    popup.classList.add('is-open');
    const pw = popup.offsetWidth || 320;
    const ph = popup.offsetHeight || 120;
    let left = rect.left + rect.width / 2 - pw / 2;
    let top = rect.bottom + 8;
    if (top + ph > window.innerHeight - pad) top = rect.top - ph - 8;
    if (left < pad) left = pad;
    if (left + pw > window.innerWidth - pad) left = window.innerWidth - pw - pad;
    if (top < pad) top = pad;
    popup.style.left = `${Math.round(left)}px`;
    popup.style.top = `${Math.round(top)}px`;
}

function showFieldHelp(anchor, help, { sticky = false } = {}) {
    if (!isFieldHelpModeOn() || !help) return;
    const target = anchor && anchor.getBoundingClientRect ? anchor : document.body;
    clearTimeout(fieldHelpHideTimer);
    clearTimeout(fieldHelpShowTimer);
    const popup = ensureFieldHelpPopup();
    popup.querySelector('.fh-popup-title').textContent = help.title || 'Help';
    popup.querySelector('.fh-popup-body').textContent = help.body || '';
    const hint = popup.querySelector('.fh-popup-hint');
    if (hint) hint.hidden = !!sticky;
    fieldHelpActiveAnchor = target;
    document.querySelectorAll('.fh-hot.is-active').forEach((n) => n.classList.remove('is-active'));
    if (target.classList) target.classList.add('fh-hot', 'is-active');
    positionFieldHelpPopup(target);
    popup.dataset.sticky = sticky ? '1' : '0';
}

function hideFieldHelp() {
    clearTimeout(fieldHelpHideTimer);
    clearTimeout(fieldHelpShowTimer);
    const popup = ensureFieldHelpPopup();
    popup.hidden = true;
    popup.classList.remove('is-open');
    popup.dataset.sticky = '0';
    document.querySelectorAll('.fh-hot.is-active').forEach((n) => n.classList.remove('is-active'));
    fieldHelpActiveAnchor = null;
}

function scheduleHideFieldHelp(delay = 220) {
    const popup = ensureFieldHelpPopup();
    if (popup.dataset.sticky === '1') return;
    clearTimeout(fieldHelpHideTimer);
    fieldHelpHideTimer = setTimeout(hideFieldHelp, delay);
}

function syncFieldHelpUi() {
    const on = isFieldHelpModeOn();
    document.body.classList.toggle('fh-mode-on', on);
    document.body.classList.toggle('fh-mode-off', !on);

    const headerBtn = document.getElementById('fieldHelpToggleBtn');
    if (headerBtn) {
        headerBtn.classList.toggle('is-active', on);
        headerBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
        headerBtn.title = on
            ? 'Help mode ON — click to turn off popups'
            : 'Help mode OFF — click to show popups when you point at fields';
        headerBtn.textContent = on ? 'Field Help · ON' : 'Field Help';
    }

    const { banner, fab } = ensureFieldHelpChrome();
    banner.hidden = !on;
    if (document.getElementById('fieldHelpToggleBtn')) fab.hidden = true;
    fab.classList.toggle('is-active', on);
    fab.setAttribute('aria-pressed', on ? 'true' : 'false');
    const state = fab.querySelector('.fh-fab-state');
    if (state) state.textContent = on ? 'ON' : 'OFF';
    fab.title = on
        ? 'Help mode ON — click to turn off'
        : 'Help mode OFF — click to turn on; then point at any field';
}

function setFieldHelpMode(on, { silent = false } = {}) {
    fieldHelpModeOn = !!on;
    syncFieldHelpUi();
    if (!fieldHelpModeOn) {
        hideFieldHelp();
        if (!silent && typeof showToast === 'function') {
            showToast('Help OFF — click Field Help again when you need popups', 'info');
        }
        return;
    }
    enhanceFieldHelp(document);
    if (!silent) {
        const fab = document.getElementById('fieldHelpFab') || document.getElementById('fieldHelpToggleBtn');
        showFieldHelp(fab || document.body, {
            title: 'Hover help is ON',
            body: 'Point at any label, field, text box or button — a popup explains its purpose. Click Field Help again (or press Esc) to turn off.'
        }, { sticky: true });
        if (typeof showToast === 'function') {
            showToast('Hover help ON — point at labels and fields for explanations', 'success');
        }
    }
}

function toggleFieldHelpMode() {
    setFieldHelpMode(!isFieldHelpModeOn());
}

function markHelpHot(el) {
    if (!el || el.dataset.fhMarked === '1') return;
    el.dataset.fhMarked = '1';
    el.classList.add('fh-hot');
}

function shouldEnhanceElement(el) {
    return isHelpableElement(el) && el.dataset.fhMarked !== '1';
}

function enhanceFieldHelp(root = document) {
    if (!isFieldHelpModeOn()) return;
    const scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll(
        'label, .form-label, th, [data-help], [data-help-key], input:not([type="hidden"]), select, textarea, button.btn, .btn, .nav-btn'
    ).forEach((el) => {
        if (shouldEnhanceElement(el)) markHelpHot(el);
    });
}

function onFieldHelpPointerOver(e) {
    if (!isFieldHelpModeOn() || document.body.classList.contains('app-locked')) return;
    const el = eventElement(e.target);
    if (!el || (fieldHelpPopupEl && fieldHelpPopupEl.contains(el))) return;

    const hit = findHelpTargetFromEvent(el);
    if (!hit) {
        scheduleHideFieldHelp(120);
        return;
    }
    clearTimeout(fieldHelpHideTimer);
    clearTimeout(fieldHelpShowTimer);
    fieldHelpShowTimer = setTimeout(() => {
        showFieldHelp(hit.el, hit.help, { sticky: false });
    }, 320);
}

function onFieldHelpPointerOut(e) {
    if (!isFieldHelpModeOn()) return;
    const related = eventElement(e.relatedTarget);
    const from = eventElement(e.target);
    if (fieldHelpPopupEl && related && fieldHelpPopupEl.contains(related)) return;
    if (fieldHelpPopupEl && from && fieldHelpPopupEl.contains(from)) return;
    if (fieldHelpActiveAnchor && related && (
        fieldHelpActiveAnchor === related || fieldHelpActiveAnchor.contains(related)
    )) return;
    scheduleHideFieldHelp(160);
}

function onFieldHelpFocusIn(e) {
    if (!isFieldHelpModeOn() || document.body.classList.contains('app-locked')) return;
    const el = eventElement(e.target);
    if (!el) return;
    const hit = findHelpTargetFromEvent(el);
    if (!hit) return;
    clearTimeout(fieldHelpHideTimer);
    clearTimeout(fieldHelpShowTimer);
    showFieldHelp(hit.el, hit.help, { sticky: false });
}

function onFieldHelpKeydown(e) {
    if (e.key !== 'Escape') return;
    if (fieldHelpPopupEl && !fieldHelpPopupEl.hidden) {
        hideFieldHelp();
        e.preventDefault();
        return;
    }
    if (isFieldHelpModeOn()) setFieldHelpMode(false);
}

function initFieldHelpSystem() {
    if (document.body.dataset.fieldHelpInit === '1') {
        syncFieldHelpUi();
        return;
    }
    document.body.dataset.fieldHelpInit = '1';

    const popup = ensureFieldHelpPopup();
    popup.addEventListener('mouseenter', () => clearTimeout(fieldHelpHideTimer));
    popup.addEventListener('mouseleave', () => scheduleHideFieldHelp(120));
    ensureFieldHelpChrome();

    document.getElementById('fieldHelpToggleBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        toggleFieldHelpMode();
    });

    document.addEventListener('mouseover', onFieldHelpPointerOver, true);
    document.addEventListener('mouseout', onFieldHelpPointerOut, true);
    document.addEventListener('focusin', onFieldHelpFocusIn, true);
    document.addEventListener('keydown', onFieldHelpKeydown);

    const loggedIn = !document.body.classList.contains('app-locked');
    setFieldHelpMode(loggedIn, { silent: true });
}

window.enhanceFieldHelp = enhanceFieldHelp;
window.initFieldHelpSystem = initFieldHelpSystem;
window.setFieldHelpMode = setFieldHelpMode;
window.toggleFieldHelpMode = toggleFieldHelpMode;
window.lookupFieldHelp = lookupFieldHelp;
window.FIELD_HELP = FIELD_HELP;
