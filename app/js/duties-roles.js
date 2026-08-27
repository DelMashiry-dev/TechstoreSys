/* duties-roles.js — ZNA Storeman / Quartermaster / Controlled Stores NCO reference */

const DUTIES_ROLES_GUIDES = {
    storeman: {
        id: 'storeman',
        title: 'Duties and Roles of the Storeman',
        rank: 'Normally a Cpl or LCpl acting in the post',
        reportsTo: 'MT NCO, Controlled Stores NCO, Clothing NCO or RQMS (depending on department)',
        summary: 'Responsible for safe custody, control, issue and accountability of all stores, equipment and materials entrusted to the unit in accordance with regulations and procedures.',
        values: ['Accuracy', 'Accountability', 'Control', 'Integrity', 'Security', 'Discipline'],
        coreDuties: [
            { title: 'Ledger entries', text: 'Make sub-ledger entries and enter all IRVs (Issue & Receipt Vouchers) in the ledger.', moduleId: 'zna-q-178' },
            { title: 'Receipt verification', text: 'Count items received and compare them with RVs (Receipt Vouchers).', moduleId: 'zna-q-1033' },
            { title: 'Issue control', text: 'Strike off all IVs (Issue Vouchers) from the ledger.', moduleId: 'voucher-module' },
            { title: 'Group for issue', text: 'Compile IVs and group all items for issuing.', moduleId: 'zna-q-1033' },
            { title: 'Report deficiencies', text: 'Report all deficiencies to the immediate senior.', moduleId: 'zna-q-998' },
            { title: 'Storage & packaging', text: 'Control all items under charge and pack them according to the packaging system.', moduleId: 'stock-take' }
        ],
        responsibilities: [
            { role: 'Custody and safekeeping', text: 'Responsible for all stores, equipment and materials entrusted to him; ensure safe custody at all times.' },
            { role: 'Receiving and verification', text: 'Receive stores and materials, check against delivery documents (RVs), verify quantity and quality, acknowledge receipt.' },
            { role: 'Issuing of stores', text: 'Issue to authorised personnel on proper documentation (IVs) and ensure correct recording.' },
            { role: 'Ledger and record keeping', text: 'Maintain accurate, up-to-date records of all store transactions in ledgers and supporting documents.' },
            { role: 'Inventory and stock control', text: 'Conduct regular stock checks, reconcile balances, and immediately report shortages, losses, damage or excesses.' },
            { role: 'Reporting', text: 'Compile IVs, prepare and submit returns and reports as required to the immediate senior.' },
            { role: 'Accountability', text: 'Personally accountable for all stores, equipment and materials under his charge.' },
            { role: 'Security', text: 'Ensure storage areas are secure, clean and in good order; prevent loss, damage or theft.' },
            { role: 'Maintenance of stores', text: 'Ensure proper preservation, care and maintenance of stores and equipment.' },
            { role: 'Packing and preservation', text: 'Pack, label and preserve stores in accordance with regulations for safe storage and issue.' },
            { role: 'Compliance and discipline', text: 'Comply with military regulations and standing orders relating to storage, accounting and issue of stores.' },
            { role: 'Support to operations', text: 'Ensure availability of required stores and materials to support training and operational readiness.' }
        ]
    },
    quartermaster: {
        id: 'quartermaster',
        title: 'Duties and Roles of the Quartermaster',
        rank: 'Quartermaster (unit / formation QM)',
        reportsTo: 'Commanding Officer / formation command chain',
        summary: 'Responsible for the efficient administration of resources, stores, finances and services to sustain operations and support the force.',
        values: ['Efficiency in support', 'Discipline in action', 'Victory in unity'],
        jobSpecs: [
            { title: 'Requisitions & procurement', text: 'Writes Q 982 requisition / indent forms for all required items.', moduleId: 'zna-q-982' },
            { title: 'Issue of items', text: 'Writes Q 1033 issue vouchers for items issued (including temporary issues and Comd/34 permanent laptop / iPad loans).', moduleId: 'zna-q-1033' },
            { title: 'Receipt of items', text: 'Receipts all items received in the Quartermaster.', moduleId: 'zna-q-1033' },
            { title: 'Record keeping', text: 'Enters all items received in the sub-ledgers and master ledger.', moduleId: 'zna-q-178' },
            { title: 'Write-off & losses', text: 'Strikes off the ledgers all items issued out, lost or stolen.', moduleId: 'zna-q-1' },
            { title: 'Bonding', text: 'Initiates the bonding of unserviceable items.', moduleId: 'zna-q-1043' },
            { title: 'Packaging', text: 'Organises the packaging of items for storage or shipment.', moduleId: null },
            { title: 'Charge sheets', text: 'Prepares charge sheets for offenders.', moduleId: null },
            { title: 'Seminars & training', text: 'Prepares seminars and training workshops for Quartermaster personnel.', moduleId: 'duties-roles' }
        ],
        coreDuties: [
            { title: 'Indent', text: 'Indent for UET, BRE, Clothing, Stationery, Rations, Detergents, Toiletry and Controlled stores.', moduleId: 'zna-q-982' },
            { title: 'Issue', text: 'Issue the above-mentioned items on proper vouchers.', moduleId: 'zna-q-1033' },
            { title: 'Account', text: 'Account for all Quartermaster holdings.', moduleId: 'stock-take' },
            { title: 'Balance & reconcile', text: 'Balance and reconcile all Quartermaster ledgers.', moduleId: 'zna-q-178' },
            { title: 'Repairs', text: 'Initiate repairs for buildings / facilities as required.', moduleId: 'workshop-repairs' },
            { title: 'Bids / funding', text: 'Bid for monies to upkeep grounds and sustain stores operations.', moduleId: 'financial-year-bids' },
            { title: 'CO directives', text: 'Implement the Commanding Officer’s directives and instructions.', moduleId: null },
            { title: 'Plan & lead issues', text: 'Plan, control, organise and lead all Quartermaster issues.', moduleId: 'voucher-module' },
            { title: 'Train personnel', text: 'Train Quartermaster personnel for effective service delivery.', moduleId: 'duties-roles' }
        ],
        responsibilities: [
            { role: 'Resource manager', text: 'Ensure all materiel, equipment and stores are available and properly managed.' },
            { role: 'Financial controller', text: 'Maintain accurate accounts, budgets and financial discipline.' },
            { role: 'Supply chain coordinator', text: 'Ensure timely procurement, storage and distribution of goods and services.' },
            { role: 'Facilities manager', text: 'Responsible for maintenance and repairs of buildings and infrastructure.' },
            { role: 'Leader & administrator', text: 'Lead, organise and train Quartermaster personnel for effective service delivery.' },
            { role: 'Discipline enforcer', text: 'Maintain accountability, secure property and uphold good order and discipline.' }
        ]
    },
    controlledStoresNco: {
        id: 'controlled-stores-nco',
        title: 'Controlled Stores NCO',
        rank: 'Csgt or Sgt acting in the post',
        reportsTo: 'Quartermaster',
        summary: 'Accounts for weapons and controlled stores within the camp / unit area; balances sub-ledgers and supports 100% stocktake.',
        values: ['Accountability', 'Discipline', 'Integrity', 'Service'],
        coreDuties: [
            { title: 'Account for stores', text: 'Account for all stores and controlled stores within Army HQ Camp / unit area.', moduleId: 'stock-take' },
            { title: 'Balance sub-ledgers', text: 'Balance sub-ledgers of controlled stores.', moduleId: 'zna-q-178' },
            { title: 'Assist stock take', text: 'Assist members doing stock take of controlled stores.', moduleId: 'stock-take' }
        ],
        jobSpecs: [
            { title: 'Account — weapons & controlled stores', text: 'Account for all weapons and controlled stores.', moduleId: 'ict-accountability' },
            { title: 'Receive & record', text: 'Receive controlled stores and enter them in the sub-ledgers.', moduleId: 'zna-q-1033' },
            { title: 'Issue', text: 'Issue controlled stores on proper authority / vouchers (temporary loans and Comd/34 permanent laptop / iPad loans).', moduleId: 'temporary-loans' },
            { title: 'Reconcile for QM', text: 'Reconcile the sub-ledger for the Quartermaster’s signature.', moduleId: 'zna-q-178' },
            { title: 'Pack properly', text: 'Pack weapons and controlled stores in the prescribed manner.', moduleId: null },
            { title: 'Clean & maintain', text: 'Clean all weapons and controlled stores.', moduleId: null },
            { title: '100% stocktake', text: 'Make a 100% stocktake on all weapons and controlled stores.', moduleId: 'stock-take' }
        ],
        personnel: [
            'Senior Tac Course',
            'Ceremonial Drill Course',
            'Advanced Storeman’s Course'
        ],
        responsibilities: []
    }
};

function escapeDutiesHtml(v) {
    return String(v ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function renderDutiesLinkList(items, emptyText) {
    if (!items || !items.length) return `<p class="muted">${escapeDutiesHtml(emptyText || '—')}</p>`;
    return `<ul class="duties-list">${items.map((item) => {
        const openBtn = item.moduleId
            ? `<button type="button" class="btn btn-ghost btn-sm" data-duties-open="${escapeDutiesHtml(item.moduleId)}">Open in system</button>`
            : '';
        return `<li>
            <div class="duties-item-head">
                <strong>${escapeDutiesHtml(item.title || item.role)}</strong>
                ${openBtn}
            </div>
            <p>${escapeDutiesHtml(item.text)}</p>
        </li>`;
    }).join('')}</ul>`;
}

function renderLaptopDutyProfilesGuide() {
    const profiles = typeof LAPTOP_DUTY_PROFILES !== 'undefined' ? LAPTOP_DUTY_PROFILES : [];
    const field = profiles.filter((p) => p.group === 'field');
    const technical = profiles.filter((p) => p.group === 'technical');
    const admin = profiles.filter((p) => p.group === 'admin');
    const renderGroup = (title, items) => `
        <div class="duties-block">
            <h4>${escapeDutiesHtml(title)}</h4>
            <ul class="duties-list">${items.map((p) => `
                <li>
                    <div class="duties-item-head">
                        <strong>${escapeDutiesHtml(p.label)}</strong>
                        <button type="button" class="btn btn-ghost btn-sm" data-duties-open="spec-evaluation">Match in Spec Search</button>
                    </div>
                    <p>${escapeDutiesHtml(p.summary)}</p>
                    <ul class="duties-plain-list">${(p.uses || []).map((u) => `<li>${escapeDutiesHtml(u)}</li>`).join('')}</ul>
                    <p class="muted">${escapeDutiesHtml(p.deviceHint || '')}</p>
                </li>`).join('')}
            </ul>
        </div>`;
    return `
        <article class="duties-guide" data-guide="laptop-duty">
            <header class="duties-guide-header">
                <h3>Laptop duty profiles — issue &amp; spec matching</h3>
                <p class="duties-rank"><strong>Applies to:</strong> Military / ICT laptops issued for operational and technical work</p>
                <p class="duties-reports"><strong>Used in:</strong> Spec/Tech Evaluation — Intelligent Spec Search</p>
                <p class="duties-summary">These are the main duty profiles for laptop procurement and issue. Field/tactical uses cover command, UAV/robot control, secure communications, and logistics diagnostics. Technical uses cover Software Engineering, Programming, Machine Learning, Architecture, Graphic Designing, Database Design, and Server Room. Admin/office uses cover Pay Run, Secretariat, and Typing Pool.</p>
                <div class="duties-values">
                    <span class="duties-value-chip">Field</span>
                    <span class="duties-value-chip">Technical</span>
                    <span class="duties-value-chip">Admin</span>
                    <span class="duties-value-chip">Spec match</span>
                </div>
            </header>
            ${renderGroup('Field / tactical', field)}
            ${renderGroup('Technical / IT-DIR', technical)}
            ${renderGroup('Admin / office', admin)}
        </article>`;
}

function renderDutiesGuide(guide) {
    if (!guide) return '';
    const values = (guide.values || []).map((v) => `<span class="duties-value-chip">${escapeDutiesHtml(v)}</span>`).join('');
    const personnel = guide.personnel?.length
        ? `<div class="duties-block"><h4>Personnel specification</h4><ul class="duties-plain-list">${guide.personnel.map((p) => `<li>${escapeDutiesHtml(p)}</li>`).join('')}</ul></div>`
        : '';
    return `
        <article class="duties-guide" data-guide="${escapeDutiesHtml(guide.id)}">
            <header class="duties-guide-header">
                <h3>${escapeDutiesHtml(guide.title)}</h3>
                <p class="duties-rank"><strong>Rank / post:</strong> ${escapeDutiesHtml(guide.rank)}</p>
                <p class="duties-reports"><strong>Responsible to:</strong> ${escapeDutiesHtml(guide.reportsTo)}</p>
                <p class="duties-summary">${escapeDutiesHtml(guide.summary)}</p>
                <div class="duties-values">${values}</div>
            </header>
            <div class="duties-block">
                <h4>Core duties</h4>
                ${renderDutiesLinkList(guide.coreDuties)}
            </div>
            ${guide.jobSpecs?.length ? `<div class="duties-block"><h4>Job specification</h4>${renderDutiesLinkList(guide.jobSpecs)}</div>` : ''}
            ${guide.responsibilities?.length ? `<div class="duties-block"><h4>Roles &amp; responsibilities</h4>${renderDutiesLinkList(guide.responsibilities)}</div>` : ''}
            ${personnel}
        </article>`;
}

function renderDutiesRolesModule() {
    const host = document.getElementById('dutiesRolesContent');
    if (!host) return;
    const tab = document.querySelector('.duties-tab.is-active')?.getAttribute('data-duties-tab') || 'laptopDuty';
    if (tab === 'laptopDuty') {
        host.innerHTML = renderLaptopDutyProfilesGuide();
        return;
    }
    const guide = DUTIES_ROLES_GUIDES[tab] || DUTIES_ROLES_GUIDES.storeman;
    host.innerHTML = renderDutiesGuide(guide);
}

function initDutiesRolesModule() {
    const root = document.getElementById('duties-roles');
    if (!root || root.dataset.dutiesInit === '1') return;
    root.dataset.dutiesInit = '1';

    root.querySelectorAll('.duties-tab').forEach((btn) => {
        btn.addEventListener('click', () => {
            root.querySelectorAll('.duties-tab').forEach((b) => b.classList.remove('is-active'));
            btn.classList.add('is-active');
            renderDutiesRolesModule();
        });
    });

    root.addEventListener('click', (e) => {
        const openId = e.target.closest('[data-duties-open]')?.getAttribute('data-duties-open');
        if (openId && typeof navigateToModule === 'function') navigateToModule(openId);
    });

    document.getElementById('dutiesRolesPrintBtn')?.addEventListener('click', printDutiesRolesGuide);
    renderDutiesRolesModule();
}

function printDutiesRolesGuide() {
    const tab = document.querySelector('.duties-tab.is-active')?.getAttribute('data-duties-tab') || 'laptopDuty';
    let html;
    if (tab === 'laptopDuty') {
        const profiles = typeof LAPTOP_DUTY_PROFILES !== 'undefined' ? LAPTOP_DUTY_PROFILES : [];
        html = `
        <div class="duties-print-doc">
            <h1>Zimbabwe National Army — Tech Stores</h1>
            <h2>Laptop duty profiles</h2>
            <p>Main operational uses for laptop issue and spec matching.</p>
            ${profiles.map((p) => `
                <h3>${escapeDutiesHtml(p.groupLabel)} — ${escapeDutiesHtml(p.label)}</h3>
                <p>${escapeDutiesHtml(p.summary)}</p>
                <ul>${(p.uses || []).map((u) => `<li>${escapeDutiesHtml(u)}</li>`).join('')}</ul>
                <p>${escapeDutiesHtml(p.deviceHint || '')}</p>
            `).join('')}
        </div>`;
    } else {
    const guide = DUTIES_ROLES_GUIDES[tab] || DUTIES_ROLES_GUIDES.storeman;
    html = `
        <div class="duties-print-doc">
            <h1>Zimbabwe National Army — Tech Stores</h1>
            <h2>${escapeDutiesHtml(guide.title)}</h2>
            <p><strong>Rank / post:</strong> ${escapeDutiesHtml(guide.rank)}</p>
            <p><strong>Responsible to:</strong> ${escapeDutiesHtml(guide.reportsTo)}</p>
            <p>${escapeDutiesHtml(guide.summary)}</p>
            <h3>Core duties</h3>
            <ol>${(guide.coreDuties || []).map((d) => `<li><strong>${escapeDutiesHtml(d.title)}</strong> — ${escapeDutiesHtml(d.text)}</li>`).join('')}</ol>
            ${(guide.jobSpecs || []).length ? `<h3>Job specification</h3><ol>${guide.jobSpecs.map((d) => `<li><strong>${escapeDutiesHtml(d.title)}</strong> — ${escapeDutiesHtml(d.text)}</li>`).join('')}</ol>` : ''}
            ${(guide.responsibilities || []).length ? `<h3>Roles &amp; responsibilities</h3><ol>${guide.responsibilities.map((d) => `<li><strong>${escapeDutiesHtml(d.role)}</strong> — ${escapeDutiesHtml(d.text)}</li>`).join('')}</ol>` : ''}
            ${(guide.personnel || []).length ? `<h3>Personnel specification</h3><ul>${guide.personnel.map((p) => `<li>${escapeDutiesHtml(p)}</li>`).join('')}</ul>` : ''}
            <p class="duties-print-foot">${escapeDutiesHtml((guide.values || []).join(' · '))}</p>
        </div>`;
    }
    if (typeof runOfficialPrint === 'function') {
        runOfficialPrint(() => {
            const host = typeof ensurePrintHost === 'function'
                ? ensurePrintHost('duties-roles-print-host')
                : (() => {
                    let h = document.getElementById('duties-roles-print-host');
                    if (!h) {
                        h = document.createElement('div');
                        h.id = 'duties-roles-print-host';
                        document.body.appendChild(h);
                    }
                    return h;
                })();
            host.className = 'duties-roles-print-host';
            host.innerHTML = html;
            host.classList.add('print-target');
            document.body.classList.add('is-printing', 'printing-duties-roles');
        });
        return;
    }
    window.print();
}
