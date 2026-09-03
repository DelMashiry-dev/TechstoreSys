/* process-guides.js — in-app learning: crisp HD charts + optional original posters */

function escapePg(v) {
    return String(v ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function processGuideAsset(path) {
    return `../assets/guides/${path}`;
}

/** Raster poster — never stretch; open crisp lightbox at natural size */
function renderProcessGuideChart(src, caption) {
    return `
        <figure class="pg-chart pg-chart-raster">
            <button type="button" class="pg-chart-zoom" data-pg-lightbox="${escapePg(src)}" data-pg-caption="${escapePg(caption)}" title="View full size">
                <img src="${escapePg(src)}" alt="${escapePg(caption)}" loading="lazy" decoding="async"
                    onerror="this.closest('figure').classList.add('pg-chart-missing'); this.replaceWith(Object.assign(document.createElement('p'),{className:'muted',textContent:'Chart image not found — place files in assets/guides/'}));">
            </button>
            <figcaption>${escapePg(caption)} · click to enlarge (original scan)</figcaption>
        </figure>`;
}

function renderHdProcurementPoster() {
    const org = typeof getOrgProfile === 'function' ? getOrgProfile() : null;
    const steps = (typeof ZNA_PROCUREMENT_PROCESS !== 'undefined' ? ZNA_PROCUREMENT_PROCESS : []);
    const actors = (typeof ARMY_PROCESS_ACTORS !== 'undefined' ? ARMY_PROCESS_ACTORS : {});
    const badges = [
        'Originates need', 'Seeks authority', 'Approval granted', 'Executes purchase',
        'Conducted by AIAD', 'Quality over price', 'Formal commitment', 'Verification',
        'Release for use', 'Closure'
    ];
    const rows = steps.map((s, i) => `
        <li class="pg-hd-step">
            <span class="pg-hd-num" aria-hidden="true">${s.n}</span>
            <div class="pg-hd-step-body">
                <div class="pg-hd-step-top">
                    <h4>${escapePg(s.title)}</h4>
                    <span class="pg-hd-badge">${escapePg(badges[i] || actors[s.actor] || '')}</span>
                </div>
                <p class="pg-hd-actor">${escapePg(actors[s.actor] || s.actor)}</p>
                <p>${escapePg(s.detail)}</p>
            </div>
        </li>`).join('');

    return `
        <section class="pg-hd-poster pg-hd-proc" aria-label="Procurement process HD chart">
            <div class="pg-hd-mark">RESTRICTED</div>
            <header class="pg-hd-head">
                <div class="pg-hd-brand">
                    <img src="../assets/zna-logo.png" alt="ZNA" class="pg-hd-logo" onerror="this.style.display='none'">
                    <img src="../assets/techstores-badge.png" alt="techstores" class="pg-hd-badge-img" onerror="this.style.display='none'">
                </div>
                <div class="pg-hd-titles">
                    <p class="pg-hd-kicker">Zimbabwe National Army · TechStores</p>
                    <h3>Procedure to be followed during the procurement process</h3>
                    <p class="pg-hd-tagline">Transparency · Accountability · Efficiency</p>
                    <p class="pg-hd-motto">Right goods · Right quality · Right time · Right value for the Army</p>
                </div>
            </header>
            <p class="pg-hd-cc-note">
                Charts that say <em>Ord Dir</em> mean any <strong>Cost Centre Directorate</strong>.
                This site: <strong>${escapePg(org?.fullName || 'IT Dir Tech Stores')}</strong>
                (<code>${escapePg(org?.costCentre || 'Z04P2SP212')}</code>).
            </p>
            <div class="pg-hd-split">
                <ol class="pg-hd-steps">${rows}</ol>
                <aside class="pg-hd-side">
                    <div class="pg-hd-panel">
                        <h4>Due diligence criteria (AIAD)</h4>
                        <ul>
                            <li><strong>Capacity</strong> — supply ability &amp; timelines</li>
                            <li><strong>Quality</strong> — standards conformity</li>
                            <li><strong>Reputation</strong> — reliability track record</li>
                            <li><strong>Compliance</strong> — legal / tax / regulatory</li>
                            <li><strong>Value for money</strong> — best overall offer (not always cheapest)</li>
                        </ul>
                    </div>
                    <div class="pg-hd-panel pg-hd-panel-dark">
                        <h4>Expected outcomes</h4>
                        <ul>
                            <li>Transparent process</li>
                            <li>Accountability of stakeholders</li>
                            <li>Fair supplier selection</li>
                            <li>Quality products delivered</li>
                            <li>Efficient use of resources</li>
                            <li>Reliable supply chain</li>
                        </ul>
                    </div>
                </aside>
            </div>
            <footer class="pg-hd-foot">
                <p>We procure with integrity · We manage responsibly · We serve the Nation</p>
                <div class="pg-hd-mark">RESTRICTED</div>
            </footer>
        </section>`;
}

function renderHdSupplierPoster() {
    const items = (typeof SUPPLIER_EVALUATION_REQUIREMENTS !== 'undefined' ? SUPPLIER_EVALUATION_REQUIREMENTS : []);
    const titles = [
        'Introductory letter', 'Certificate of Incorporation', 'CR14', 'ZIMRA / VAT11',
        'Tax Clearance', 'NSSA registration', 'PRAZ receipt', 'Vendor number',
        'Bank statement', 'Trade references', 'Company profile', 'Bound document set'
    ];
    const cards = items.map((t, i) => `
        <li class="pg-hd-req">
            <span class="pg-hd-req-n">${i + 1}</span>
            <div>
                <strong>${escapePg(titles[i] || `Requirement ${i + 1}`)}</strong>
                <p>${escapePg(t)}</p>
            </div>
        </li>`).join('');

    return `
        <section class="pg-hd-poster pg-hd-supplier" aria-label="Supplier evaluation HD chart">
            <header class="pg-hd-head pg-hd-head-supplier">
                <div class="pg-hd-titles">
                    <p class="pg-hd-kicker">Directorate Procurement · Army HQ</p>
                    <h3>Requirements for supplier evaluation</h3>
                    <p class="pg-hd-tagline">Submit to Director Procurement, Army HQ, P Bag 7720, Causeway, Harare</p>
                </div>
            </header>
            <ol class="pg-hd-req-grid">${cards}</ol>
            <footer class="pg-hd-foot pg-hd-foot-supplier">
                <p><strong>Ensure all documents are valid, up to date and properly certified.</strong></p>
                <p class="pg-hd-highlight">Complete documentation ensures a smooth evaluation process.</p>
            </footer>
        </section>`;
}

function openProcessGuideLightbox(src, caption) {
    let overlay = document.getElementById('pgLightbox');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'pgLightbox';
        overlay.className = 'pg-lightbox';
        overlay.innerHTML = `
            <div class="pg-lightbox-panel" role="dialog" aria-modal="true" aria-label="Chart enlarge">
                <button type="button" class="pg-lightbox-close" aria-label="Close">&times;</button>
                <img class="pg-lightbox-img" alt="">
                <p class="pg-lightbox-cap"></p>
            </div>`;
        document.body.appendChild(overlay);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay || e.target.closest('.pg-lightbox-close')) {
                overlay.classList.remove('is-open');
            }
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') overlay.classList.remove('is-open');
        });
    }
    const img = overlay.querySelector('.pg-lightbox-img');
    const cap = overlay.querySelector('.pg-lightbox-cap');
    img.src = src;
    img.alt = caption || '';
    cap.textContent = caption || '';
    overlay.classList.add('is-open');
}

function renderProcurementProcessGuide() {
    const org = typeof getOrgProfile === 'function' ? getOrgProfile() : null;
    return `
        <article class="pg-article pg-article-wide">
            <header class="pg-header">
                <h3>Procedure during the procurement process</h3>
                <p><strong>RESTRICTED</strong> · Transparency · Accountability · Efficiency</p>
                <p class="pg-note">
                    HD chart below is screen-sharp for learning.
                    Original poster scans are optional (phone resolution — open to compare).
                    This installation is <strong>${escapePg(org?.fullName || 'IT Dir Tech Stores')}</strong>
                    (cost centre <strong>${escapePg(org?.costCentre || 'Z04P2SP212')}</strong>).
                </p>
            </header>
            ${renderHdProcurementPoster()}
            <details class="pg-originals">
                <summary>View original poster scans (optional)</summary>
                ${renderProcessGuideChart(processGuideAsset('procurement-process-chart-a.png'), 'Original procurement chart A')}
                ${renderProcessGuideChart(processGuideAsset('procurement-process-chart-b.png'), 'Original procurement chart B')}
            </details>
            <p class="pg-links">Related modules:
                <button type="button" class="btn btn-ghost btn-sm" data-pg-open="zna-q-982">Q 982 Indent</button>
                <button type="button" class="btn btn-ghost btn-sm" data-pg-open="dp-f1-form">DP F1</button>
                <button type="button" class="btn btn-ghost btn-sm" data-pg-open="dp-procurement">ICT Procurement Cycle</button>
                <button type="button" class="btn btn-ghost btn-sm" data-pg-open="purchase-orders">Purchase Orders</button>
            </p>
        </article>`;
}

function getItdirIctProcurementCycle() {
    return (typeof ITDIR_ICT_PROCUREMENT_CYCLE !== 'undefined' && ITDIR_ICT_PROCUREMENT_CYCLE.length)
        ? ITDIR_ICT_PROCUREMENT_CYCLE
        : [];
}

function renderNixzimoPaperPack() {
    const papers = [
        {
            stage: '4 · PFMS',
            paper: 'Requisition number on P/O',
            shows: 'Req 10080264 handwritten on DP 3478/2026 (IT Dir RQ writes the PFMS number on the DP F1 / P/O).',
            module: 'unit-requisitions',
            moduleLabel: 'Requisitions'
        },
        {
            stage: '9 · AIAD',
            paper: 'Price Due Diligence certificate',
            shows: 'Pre-audit of procurement contracts. Vendor NIXZIMO PVT LTD. Line on this form: HP EliteBook 830 G9 Core i7, qty 5. Comment: implied price within market range. Prepared SSGT MACHIHA MK; reviewed CAPT S SIBANDA; Head of Internal Audit COL L MSIPA. Stamp 27 Aug 2026, Army Internal Audit Directorate, P Bag 7720 Causeway.',
            module: 'dp-procurement',
            moduleLabel: 'ICT Cycle'
        },
        {
            stage: '10 · P/O',
            paper: 'Republic of Zimbabwe Purchase Order DP 3478/2026',
            shows: 'Date 04.08.2026, delivery 11.08.2026, deliver to IT DIR, currency ZWG. HP ELITEBOOK 830 G9 CORE i7 LAPTOP, 5 EA × ZWG 70,000.00 = ZWG 350,000.00. GL 3112210001. Supplier NIKZIMO / NIXZIMO PVT LTD, 2780 Princess Margaret, Marlborough. Procurement Directorate stamp 17 Aug 2026.',
            module: 'purchase-orders',
            moduleLabel: 'Purchase Orders'
        },
        {
            stage: '7–8 · Quote + spec',
            paper: 'Nixzimo invoice 205 (quotation / spec pack)',
            shows: 'Dated 24/08/2026, customer Zimbabwe National Army. Line: HP Victus Gaming Laptop 15 (Win 11 Pro, i7-13620H, RTX 3050 6 GB, 16 GB, 1 TB, 15.6″ FHD 144 Hz), qty 5 × ZWG 70,000.00 = ZWG 350,000.00. Sales tax listed ZWG 46,969.70 but total still ZWG 350,000.00. Due date on form 31/07/2026 (before the invoice date).',
            module: 'spec-evaluation',
            moduleLabel: 'Spec eval'
        },
        {
            stage: '11 · D-Note',
            paper: 'Nixzimo Delivery Note',
            shows: 'Delivered to OSD HRE GP 3. HP Victus gaming laptop 15, Core i7, 16 GB, 13th Gen, 1 TB SSD, qty 5. Delivery person Leory Juko. Received by SIBANDA F. Date on the note reads 24/08/2024 (year likely a 2026 typing error).',
            module: 'delivery-note',
            moduleLabel: 'Delivery Note'
        },
        {
            stage: '11 · MLG RV',
            paper: 'Issue & Receipt Voucher ZNA Q 1033 (voucher 205)',
            shows: 'MLG master-ledger RV. 25/8/26. Issued by NIXZIMO (C/STORES) to OSD HRE GP 3. Authority DP 3478/2026. “LAPTOP Core i7”, qty 5 EA. Unit 70 000 000 / total 350 000 000 on the voucher (digit scale differs from the P/O ZWG 70,000 / 350,000). Received by MAJ J SIZI, 786209 Z, OC OSD HRE GP 3. OSD Harare stamp 25 Aug 2026.',
            module: 'zna-q-1033',
            moduleLabel: 'Q 1033'
        },
        {
            stage: '11 · DAF pay',
            paper: 'Nixzimo banking details',
            shows: 'CABS Bank, Borrowdale Branch. Account name Nixzimo Pvt Ltd. ZWG 1156015626. USD 1156015634. Used when IT Dir is satisfied and triggers DAF to pay.',
            module: 'supplier-debts',
            moduleLabel: 'Creditors'
        }
    ];
    const rows = papers.map((p) => `
        <tr>
            <td>${escapePg(p.stage)}</td>
            <td><strong>${escapePg(p.paper)}</strong></td>
            <td>${escapePg(p.shows)}</td>
            <td><button type="button" class="btn btn-ghost btn-sm" data-pg-open="${escapePg(p.module)}">${escapePg(p.moduleLabel)}</button></td>
        </tr>`).join('');
    return `
        <div class="pg-paper-pack">
            <h4 class="pg-cycle-stages-title">Worked example — DP 3478/2026 · Nixzimo · Req 10080264</h4>
            <p class="pg-note">
                Paper trail from one live ICT buy (Ministry of Defence / ZNA). Scans stay off the system;
                facts below are the register. Use this pack to walk Requisition → payment.
            </p>
            <div class="table-responsive">
                <table class="overview-table pg-table pg-paper-table">
                    <thead>
                        <tr>
                            <th>Cycle step</th>
                            <th>Paper</th>
                            <th>What it shows</th>
                            <th>Module</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
            <div class="pg-hd-panel pg-inspect-flags">
                <h4>IT Dir inspection — hold points before triggering DAF pay</h4>
                <p>Step 11 is not a rubber stamp. The Nixzimo pack does not line up on description, dates, or denomination. Do not pay until these are resolved on the file.</p>
                <ul>
                    <li><strong>Description mismatch.</strong> P/O and AIAD due diligence name <em>HP EliteBook 830 G9 Core i7</em>. Invoice 205 and the delivery note name <em>HP Victus Gaming Laptop 15</em> (gaming chassis, RTX 3050, 15.6″). Same qty 5 and same ZWG 70,000 / 350,000 as the P/O — different machine.</li>
                    <li><strong>Due diligence after P/O.</strong> P/O dated 04.08.2026; AIAD certificate stamped 27 Aug 2026. The flowchart puts AIAD <em>before</em> the P/O.</li>
                    <li><strong>Figures on the due-diligence form</strong> use ZWL 30,000,000 each (rate 526.59, implied ~USD 56,970) and total ZWL 150,000,000 — not the P/O ZWG 350,000 line.</li>
                    <li><strong>Q 1033 RV</strong> writes unit 70,000,000 / total 350,000,000 versus P/O ZWG 70,000 / 350,000.</li>
                    <li><strong>Invoice arithmetic.</strong> Sales tax ZWG 46,969.70 is listed but the total still equals the subtotal (ZWG 350,000.00). Due date 31/07/2026 is before the invoice date 24/08/2026.</li>
                    <li><strong>Delivery note year</strong> printed 24/08/2024 against an August 2026 buy.</li>
                </ul>
            </div>
        </div>`;
}

function renderHdProcurementCyclePoster() {
    const steps = getItdirIctProcurementCycle();
    const boxes = steps.map((s) => `
        <li class="pg-flow-box pg-flow-${escapePg(s.phase)}">
            <span class="pg-flow-n">${s.n}</span>
            <div class="pg-flow-body">
                <h4>${escapePg(s.title)}</h4>
                <p class="pg-flow-actor">${escapePg(s.actor)}</p>
                <p>${escapePg(s.detail)}</p>
                ${s.module ? `<button type="button" class="btn btn-ghost btn-sm" data-pg-open="${escapePg(s.module)}">Open module</button>` : ''}
            </div>
        </li>`).join('');

    return `
        <section class="pg-hd-poster pg-hd-cycle" aria-label="IT Dir procurement cycle from requisition to payment">
            <header class="pg-hd-head pg-hd-head-cycle">
                <div class="pg-hd-brand">
                    <img src="../assets/zna-logo.png" alt="ZNA" class="pg-hd-logo" onerror="this.style.display='none'">
                    <img src="../assets/techstores-badge.png" alt="techstores" class="pg-hd-badge-img" onerror="this.style.display='none'">
                </div>
                <div class="pg-hd-titles">
                    <p class="pg-hd-kicker">Zimbabwe National Army · IT Dir TechStores</p>
                    <h3>Procurement cycle — requisition to payment of goods</h3>
                    <p class="pg-hd-tagline">IT Dir user · GS · DAF · PFMS · DP Contracts · AIAD · supplier · DAF pay</p>
                </div>
            </header>

            <div class="pg-flow-inputs" aria-label="Cycle starts with two inputs">
                <div class="pg-flow-box pg-flow-input">
                    <strong>Requisition</strong>
                    <span>User / unit / formation need</span>
                </div>
                <span class="pg-flow-plus" aria-hidden="true">+</span>
                <div class="pg-flow-box pg-flow-input">
                    <strong>Target</strong>
                    <span>DAF vote / buying power on the GL</span>
                </div>
                <span class="pg-flow-arrow" aria-hidden="true">→</span>
                <p class="pg-flow-inputs-note">Both are required before DP F1 is raised.</p>
            </div>

            <div class="pg-cycle-phases pg-flow-phases">
                <span class="pg-cycle-phase plan">Raise &amp; endorse 1–4</span>
                <span class="pg-cycle-phase acquire">Market 5–8</span>
                <span class="pg-cycle-phase certify">AIAD 9</span>
                <span class="pg-cycle-phase manage">P/O · supply · pay 10–11</span>
            </div>

            <ol class="pg-flow-steps">${boxes}</ol>

            <div class="pg-cycle-side pg-flow-side">
                <div class="pg-hd-panel">
                    <h4>Actors</h4>
                    <ul>
                        <li><strong>IT Dir (user)</strong> — need, spec, inspect, trigger pay</li>
                        <li><strong>IT Dir RQ</strong> — PFMS number; surrenders DP F1</li>
                        <li><strong>Colonel SD (GS)</strong> — endorses DP F1</li>
                        <li><strong>MANAC (DD DAF)</strong> — funds / vote endorsement</li>
                        <li><strong>DP Contracts / SO1</strong> — quotes, adjudication, P/O</li>
                        <li><strong>AIAD</strong> — Price Due Diligence certificate</li>
                        <li><strong>DAF</strong> — pays the supplier after IT Dir is satisfied</li>
                    </ul>
                </div>
                <div class="pg-hd-panel pg-hd-panel-dark">
                    <h4>Paper pack at payment</h4>
                    <p>P/O + supplier quotation/spec + D-Note + AIAD certificate + MLG Q 1033 RV. Banking details go to DAF only after inspection.</p>
                </div>
            </div>

            ${renderNixzimoPaperPack()}

            <footer class="pg-hd-foot">
                <p><strong>Do not pay on the invoice alone.</strong> Match P/O description, qty, GL and D-Note to what was received, then chase DAF.</p>
            </footer>
        </section>`;
}

function renderProcurementCycleGuide() {
    return `
        <article class="pg-article pg-article-wide">
            <header class="pg-header">
                <h3>The procurement cycle — requisition to payment</h3>
                <p>IT Dir ICT path: user requisition through DAF payment of goods.</p>
                <p class="pg-note">
                    This is the operating cycle (DP F1, GS, MANAC, PFMS, DP Contracts, AIAD, P/O, inspect, pay).
                    The <strong>Procurement process</strong> tab remains the Army-wide Cost Centre Dir / QS Br chart.
                    Worked example: <strong>DP 3478/2026</strong> · Nixzimo · <strong>Req 10080264</strong>.
                    Each actor logs into their own portal (DP, GS, DAF, AIAD, supplier) to input or upload their step.
                </p>
            </header>
            ${renderHdProcurementCyclePoster()}
            <details class="pg-originals">
                <summary>View generic textbook cycle poster (optional)</summary>
                ${renderProcessGuideChart(processGuideAsset('procurement-cycle.png'), 'Original procurement cycle poster')}
            </details>
            <p class="pg-links">Related modules:
                <button type="button" class="btn btn-ghost btn-sm" data-pg-open="portals-board">Portals</button>
                <button type="button" class="btn btn-ghost btn-sm" data-pg-open="unit-requisitions">Requisitions</button>
                <button type="button" class="btn btn-ghost btn-sm" data-pg-open="dp-f1-form">DP F1</button>
                <button type="button" class="btn btn-ghost btn-sm" data-pg-open="dp-procurement">ICT Procurement Cycle</button>
                <button type="button" class="btn btn-ghost btn-sm" data-pg-open="spec-evaluation">Spec / Tech Evaluation</button>
                <button type="button" class="btn btn-ghost btn-sm" data-pg-open="cost-comparative-schedule">Cost Comparative</button>
                <button type="button" class="btn btn-ghost btn-sm" data-pg-open="purchase-orders">Purchase Orders</button>
                <button type="button" class="btn btn-ghost btn-sm" data-pg-open="delivery-note">Delivery Note</button>
                <button type="button" class="btn btn-ghost btn-sm" data-pg-open="zna-q-1033">Q 1033</button>
                <button type="button" class="btn btn-ghost btn-sm" data-pg-open="supplier-debts">Creditors</button>
            </p>
        </article>`;
}

function renderSupplierEvaluationGuide() {
    return `
        <article class="pg-article pg-article-wide">
            <header class="pg-header">
                <h3>Requirements for supplier evaluation</h3>
                <p>Submit to <strong>Director Procurement, Army HQ, P Bag 7720, Causeway, Harare</strong>.</p>
                <p class="pg-note">HD checklist below stays sharp at any screen size. Original scan is optional.</p>
            </header>
            ${renderHdSupplierPoster()}
            <details class="pg-originals">
                <summary>View original poster scan (optional)</summary>
                ${renderProcessGuideChart(processGuideAsset('supplier-evaluation-requirements.png'), 'Original supplier evaluation poster')}
            </details>
            <p class="pg-links">Related module:
                <button type="button" class="btn btn-ghost btn-sm" data-pg-open="suppliers-contracts">Suppliers and Contracts</button>
            </p>
        </article>`;
}

function renderMultiUnitGuide() {
    const org = typeof getOrgProfile === 'function' ? getOrgProfile() : null;
    const profiles = typeof ORG_PROFILES !== 'undefined' ? Object.values(ORG_PROFILES) : [];
    const cards = profiles.map((p) => `
        <div class="pg-profile-card ${p.id === org?.id ? 'is-active' : ''}">
            <strong>${escapePg(p.fullName)}</strong>
            <div class="muted">${escapePg(p.shortName)} · ${escapePg(p.costCentre)}</div>
            <p>${escapePg(p.notes || p.processRoleLabel || '')}</p>
            ${p.id === org?.id ? '<span class="pg-badge">This installation</span>' : '<span class="pg-badge pg-badge-ref">Example / future</span>'}
        </div>`).join('');

    return `
        <article class="pg-article">
            <header class="pg-header">
                <h3>Cost centres &amp; future multi-unit use</h3>
                <p class="pg-note">
                    Processes are similar throughout ZNA cost centres. TechStores is built first for
                    <strong>IT Dir</strong>; later the same shell can be customised for other Army units,
                    Quartermasters and Procurement departments with the relevant module packs.
                </p>
            </header>
            <div class="pg-profile-grid">${cards}</div>
            <h4>What stays the same vs what changes</h4>
            <table class="overview-table pg-table">
                <thead><tr><th>Shared (Army-wide)</th><th>Customisable later</th></tr></thead>
                <tbody>
                    <tr><td>Procurement process steps</td><td>Cost centre name, code, branding</td></tr>
                    <tr><td>Q forms &amp; ASO rules</td><td>Which modules are switched on</td></tr>
                    <tr><td>Supplier evaluation pack</td><td>QM clothing vs TechStores vs DP desk pack</td></tr>
                    <tr><td>AIAD due diligence pillars</td><td>Users and local roles</td></tr>
                </tbody>
            </table>
        </article>`;
}

function renderHdItDirOrganogram() {
    const est = typeof getItDirEstablishment === 'function' ? getItDirEstablishment() : null;
    if (!est) {
        return '<p class="muted">IT Directorate establishment data is not loaded.</p>';
    }
    const deptBoxes = est.departments.map((d) => `
        <div class="pg-org-dept">
            <strong>${escapePg(d.name.replace(' Dept', ''))}</strong>
            <span>${escapePg(d.strength)}</span>
        </div>`).join('');

    return `
        <section class="pg-hd-poster pg-org-poster" aria-label="IT Directorate organogram">
            <div class="pg-hd-mark">CONFIDENTIAL</div>
            <header class="pg-hd-head">
                <div class="pg-hd-titles">
                    <p class="pg-hd-kicker">Zimbabwe National Army · Information Technology Directorate</p>
                    <h3>Organisation of ICT Directorate</h3>
                    <p class="pg-hd-tagline">${escapePg(est.reference)}</p>
                    <p class="pg-hd-motto">Establishment ${escapePg(est.totals.officers)}+${escapePg(est.totals.ors)} · Total ${escapePg(est.totals.total)}</p>
                </div>
            </header>
            <div class="pg-org-tree">
                <div class="pg-org-hq">
                    <div class="pg-org-node pg-org-node-top">
                        <strong>Dir HQ</strong>
                        <span>${escapePg(est.hq.strength)}</span>
                    </div>
                    <ul class="pg-org-hq-posts">
                        ${est.hq.posts.map((p) => `<li><em>${escapePg(p.role)}</em> ${escapePg(p.rank)}</li>`).join('')}
                    </ul>
                </div>
                <div class="pg-org-connector" aria-hidden="true"></div>
                <div class="pg-org-depts">${deptBoxes}</div>
            </div>
            <footer class="pg-hd-foot">
                <p>Official establishment — use for learning, routing and Communications Portal addressing</p>
                <div class="pg-hd-mark">CONFIDENTIAL</div>
            </footer>
        </section>`;
}

function renderItDirOrganogramGuide() {
    const est = typeof getItDirEstablishment === 'function' ? getItDirEstablishment() : null;
    const detailCards = est
        ? est.departments.map((d) => `
            <details class="pg-org-details">
                <summary>
                    <strong>${escapePg(d.name)}</strong>
                    <span>${escapePg(d.strength)}${d.page ? ` · p.${d.page}` : ''}</span>
                </summary>
                ${d.hq ? `<p class="pg-org-hqline"><strong>${escapePg(d.hq.title)}</strong> (${escapePg(d.hq.strength || '')})</p>
                    <ul class="pg-bullets">${(d.hq.posts || []).map((p) => `<li>${escapePg(p.role)} — ${escapePg(p.rank)}</li>`).join('')}</ul>` : ''}
                ${(d.branches || []).map((b) => `
                    <h4 class="pg-org-branch">${escapePg(b.name)} <span>${escapePg(b.strength || '')}</span></h4>
                    <ul class="pg-bullets">${(b.posts || []).map((p) => `<li>${escapePg(p.role)} — ${escapePg(p.rank)}</li>`).join('')}</ul>
                `).join('')}
                ${d.note ? `<p class="pg-note">${escapePg(d.note)}</p>` : ''}
            </details>`).join('')
        : '';

    return `
        <article class="pg-article pg-article-wide">
            <header class="pg-header">
                <h3>IT Directorate organogram &amp; establishment</h3>
                <p class="pg-note">
                    Official organisation of the Information Technology Directorate (Annex A / SD Instr 9).
                    Dir HQ sits above seven departments. TechStores sits under <strong>Admin &amp; QM</strong>;
                    DBA sits under <strong>Systems Administration</strong>. Use this chart when addressing
                    internal memos on the Communications Portal.
                </p>
            </header>

            ${renderHdItDirOrganogram()}

            <h4 class="pg-org-section-title">Department detail</h4>
            <div class="pg-org-detail-list">${detailCards}</div>

            <p class="pg-links">Related:
                <button type="button" class="btn btn-ghost btn-sm" data-pg-open="it-dir-comms">Communications Portal</button>
                <button type="button" class="btn btn-ghost btn-sm" data-pg-open="duties-roles">Duties &amp; Roles</button>
            </p>
        </article>`;
}

function renderSystemStructureGuide() {
    return `
        <article class="pg-article pg-article-wide">
            <header class="pg-header">
                <h3>How this system is structured</h3>
                <p class="pg-note">Shell + standalone modules + persistent SQLite database. Charts shown at natural aspect (no stretch).</p>
            </header>
            ${renderProcessGuideChart(processGuideAsset('techstores-system-structure-now.png'), 'Current system structure (modular)')}
            ${renderProcessGuideChart('../assets/techstores-system-structure-infographic.png', 'Earlier system structure overview')}
            <ul class="pg-bullets">
                <li><strong>app/index.html</strong> — shell (login, sidebar, dashboard)</li>
                <li><strong>app/modules/*.html</strong> — each form stands alone</li>
                <li><strong>server.py / START-SYSTEM.bat</strong> — local application server</li>
                <li><strong>techstores.db</strong> — persistent database on disk</li>
            </ul>
        </article>`;
}

function renderRepairIntakeGuide() {
    return `
        <article class="pg-article pg-article-wide">
            <header class="pg-header">
                <h3>Equipment repair / upgrade intake</h3>
                <p class="pg-note">
                    Besides issuing equipment, units or individuals return items for repairs, software upgrades,
                    or antivirus update / renewal. Booking is custody only — it does <strong>not</strong> change TechStores inventory.
                    Every job must carry <strong>ZNA SVCS 1045</strong>.
                </p>
            </header>
            <ol class="pg-hd-steps">
                <li class="pg-hd-step"><span class="pg-hd-num">1</span><div class="pg-hd-step-body">
                    <h4>Gate Register (Regimental Police)</h4>
                    <p>Book Date In, Equipment Type, S/N or ZA No., Unit, Received By, Remark, Date Out, Number, Rank, Name, Signature + SVCS 1045 Ref.</p>
                </div></li>
                <li class="pg-hd-step"><span class="pg-hd-num">2</span><div class="pg-hd-step-body">
                    <h4>TechStores Equipment Register (storeman)</h4>
                    <p>Same columns. Custody book only — does not affect equipment inventory on charge. Then send to workshop.</p>
                </div></li>
                <li class="pg-hd-step"><span class="pg-hd-num">3</span><div class="pg-hd-step-body">
                    <h4>IT Workshop Register</h4>
                    <p>Serial, Equipment Type, Unit, Diagnosis, Remarks, Date In, Received By, Date Out (+ S/N / ZA and SVCS 1045 Ref for control).</p>
                </div></li>
            </ol>
            <p class="pg-links">Open modules:
                <button type="button" class="btn btn-ghost btn-sm" data-pg-open="gate-register">Gate Register</button>
                <button type="button" class="btn btn-ghost btn-sm" data-pg-open="techstores-equipment-register">Equipment Register</button>
                <button type="button" class="btn btn-ghost btn-sm" data-pg-open="workshop-repairs">Workshop Register</button>
                <button type="button" class="btn btn-ghost btn-sm" data-pg-open="zna-svcs-1045">ZNA SVCS 1045</button>
            </p>
        </article>`;
}

function renderOrderlyRoomGuide() {
    return `
        <article class="pg-article pg-article-wide">
            <header class="pg-header">
                <h3>Orderly Room → TechStores (Daily File)</h3>
                <p class="pg-note">
                    Unit administration and filing sit in the <strong>Orderly Room</strong>.
                    Unit ICT needs arrive as a <strong>loose minute through GS Branch</strong>
                    (Action: Brig Gen GS · Info: Col SD, IT Dir). The Orderly Room stamps them
                    <strong>First Sight / Daily File (DF)</strong> so HoDs and TechStores see the paper the same day.
                </p>
            </header>
            <ol class="pg-hd-steps">
                <li class="pg-hd-step"><span class="pg-hd-num">1</span><div class="pg-hd-step-body">
                    <h4>Receive &amp; book</h4>
                    <p>Chief Clerk (WO1/WO2) supervises; NCMs (Cpl) dispatch outgoing letters. AO (Capt/Lt) → AQSO2 (Maj) → DD (Lt Col) → Dir (Col).</p>
                </div></li>
                <li class="pg-hd-step"><span class="pg-hd-num">2</span><div class="pg-hd-step-body">
                    <h4>File GS Branch loose minutes in First Sight / DF</h4>
                    <p>Unit requisitions come <strong>through GS Branch as loose minutes</strong>. File them First Sight / DF so TechStores / RQ see them in the in-tray. That booking kick-starts issue (Q 1033) or DP F1.</p>
                </div></li>
                <li class="pg-hd-step"><span class="pg-hd-num">3</span><div class="pg-hd-step-body">
                    <h4>Alert TechStores</h4>
                    <p>Use <em>Save &amp; Alert TechStores</em> so the dashboard Alerts tray shows the item — preventing pile-ups of un-actioned requisitions at IT Dir.</p>
                </div></li>
                <li class="pg-hd-step"><span class="pg-hd-num">★</span><div class="pg-hd-step-body">
                    <h4>Correspondence Files Register</h4>
                    <p>IT Dir Correspondence Files Register Book (IT/1 … IT/34/…) kept in the Orderly Room — mark In/Out / Not opened and record Hand Over / Take Over.</p>
                </div></li>
                <li class="pg-hd-step"><span class="pg-hd-num">4</span><div class="pg-hd-step-body">
                    <h4>Act &amp; close</h4>
                    <p>TechStores / RQ process the requirement (Unit Requisitions + ICT Procurement Cycle). Mark DF entry Done when actioned.</p>
                </div></li>
            </ol>
            <h4>Access levels (accountability)</h4>
            <table class="overview-table pg-table">
                <thead><tr><th>Role</th><th>Access</th></tr></thead>
                <tbody>
                    <tr><td>Dir / DD / AQSO2 / TechStores Officer / RQ</td><td>Whole system</td></tr>
                    <tr><td>Orderly Room / Chief Clerk</td><td>DF, Unit Requisitions, Learning Centre</td></tr>
                    <tr><td>Storeman (Cpl)</td><td>Issue / receive and related stores work</td></tr>
                    <tr><td>RP</td><td>Gate Register only</td></tr>
                    <tr><td>Workshop</td><td>Workshop Register + SVCS 1045 related</td></tr>
                </tbody>
            </table>
            <p class="pg-links">Open modules:
                <button type="button" class="btn btn-ghost btn-sm" data-pg-open="orderly-room">Orderly Room (DF)</button>
                <button type="button" class="btn btn-ghost btn-sm" data-pg-open="unit-requisitions">Unit Requisitions</button>
                <button type="button" class="btn btn-ghost btn-sm" data-pg-open="supplier-debts">Creditors</button>
                <button type="button" class="btn btn-ghost btn-sm" data-pg-open="dp-procurement">ICT Procurement Cycle</button>
            </p>
        </article>`;
}

function renderPermanentLoanGuide() {
    const steps = [
        { n: 1, title: 'Engrave ZA-NO', detail: 'Make the necessary paperwork to engrave the laptop ZA-NO if it is not already engraved at Masasa / MLG (Master Ledger).' },
        { n: 2, title: 'Issue on permanent T/loan', detail: 'Member is issued the laptop on permanent temporary loan by his QM. Permanent T/loan replaces the 7-day renewal. Permanent loan is issued only to members who are still serving.' },
        { n: 3, title: 'On retiring / 3-year trigger', detail: 'Comd/34: retiring within 3 years of issue — return the gadget. After 3 years, the officer approaches IT Dir to start strike-off (AS(PLANS)/34).' },
        { n: 4, title: 'IT Dir letter to QS Br', detail: 'IT Directorate writes to QS Br to instruct Masasa Base Workshops to scratch off the ZA-NO serial number and strike the item off the Master Ledger.' },
        { n: 5, title: 'MID and IT Dir wipe', detail: 'MID and IT Dir specialists ensure all information of a military nature is erased from the gadget (Comd/34 para 2c).' },
        { n: 6, title: 'Write-off authority', detail: 'Authority for write-off is issued. The individual may then retain the laptop / iPad as a personal item. Training gadgets stay with the institution / Training Branch.' }
    ];
    const stepRows = steps.map((s) => `
        <li class="pg-hd-step">
            <span class="pg-hd-num" aria-hidden="true">${s.n}</span>
            <div class="pg-hd-step-body">
                <h4>${escapePg(s.title)}</h4>
                <p>${escapePg(s.detail)}</p>
            </div>
        </li>`).join('');

    return `
        <article class="pg-article pg-article-wide">
            <header class="pg-header">
                <h3>Permanent loan of laptops and iPads</h3>
                <p>Working procedure for TechStores — eligibility, 3-year clock, Masasa strike-off, MID wipe, write-off</p>
                <p class="pg-note">
                    Laptops and iPads have a useful life of about 3–5 years and become obsolete on charge.
                    They are therefore issued on a <strong>permanent loan</strong> instead of a short temporary loan,
                    without compromising security.
                </p>
            </header>
            <section class="pg-hd-poster" aria-label="Permanent loan procedure">
                <header class="pg-hd-head">
                    <div class="pg-hd-titles">
                        <p class="pg-hd-kicker">Zimbabwe National Army · IT Directorate · TechStores</p>
                        <h3>Procedure on issuing laptops and iPads on permanent loan</h3>
                        <p class="pg-hd-tagline">Eligible officers · 3-year clock · Masasa scratch-off · MID wipe · write-off</p>
                    </div>
                </header>
                <div class="pg-hd-panel" style="margin: 0 0 16px;">
                    <h4>Who may be issued (Comd/34 para 2)</h4>
                    <ul>
                        <li>Lieutenant Colonels and above holding <strong>command or staff</strong> appointments</li>
                        <li><strong>Grade Two Staff Officers</strong> at Formations and Army HQ</li>
                        <li>Training issues stay with the <strong>training institution / Training Branch</strong></li>
                        <li>Retiring within <strong>3 years</strong> of issue — <strong>not eligible</strong>; return the gadget</li>
                        <li>Those not issued have <strong>no right to claim</strong> a gadget on exit</li>
                    </ul>
                </div>
                <ol class="pg-hd-steps">${stepRows}</ol>
                <footer class="pg-hd-foot">
                    <p>Permanent T/loan replaces the 7-day renewal. After 3 years the item may become a personal item once ZA-NO is struck off the Master Ledger.</p>
                </footer>
            </section>
            <p class="pg-links">Related modules:
                <button type="button" class="btn btn-ghost btn-sm" data-pg-open="permanent-loans">Permanent Loans register</button>
                <button type="button" class="btn btn-ghost btn-sm" data-pg-open="temporary-loans">Temporary Loans (14-day)</button>
                <button type="button" class="btn btn-ghost btn-sm" data-pg-open="ict-accountability">ICT Asset Register</button>
                <button type="button" class="btn btn-ghost btn-sm" data-pg-open="zna-q-1">Q 1 Write-off</button>
                <button type="button" class="btn btn-ghost btn-sm" data-pg-open="it-dir-comms">Compose QS Br letter</button>
            </p>
        </article>`;
}

function openProcessGuideTab(tabId) {
    const root = document.getElementById('process-guides');
    if (!root || !tabId) return;
    const btn = root.querySelector(`.pg-tab[data-pg-tab="${tabId}"]`);
    root.querySelectorAll('.pg-tab').forEach((b) => b.classList.remove('is-active'));
    (btn || root.querySelector('.pg-tab'))?.classList.add('is-active');
    renderProcessGuidesContent();
}

function renderProcessGuidesContent() {
    const host = document.getElementById('processGuidesContent');
    if (!host) return;
    const tab = document.querySelector('.pg-tab.is-active')?.getAttribute('data-pg-tab') || 'procurement';
    if (tab === 'cycle') host.innerHTML = renderProcurementCycleGuide();
    else if (tab === 'orderly') host.innerHTML = renderOrderlyRoomGuide();
    else if (tab === 'repair') host.innerHTML = renderRepairIntakeGuide();
    else if (tab === 'permloan') host.innerHTML = renderPermanentLoanGuide();
    else if (tab === 'suppliers') host.innerHTML = renderSupplierEvaluationGuide();
    else if (tab === 'multiunit') host.innerHTML = renderMultiUnitGuide();
    else if (tab === 'organogram') host.innerHTML = renderItDirOrganogramGuide();
    else if (tab === 'structure') host.innerHTML = renderSystemStructureGuide();
    else host.innerHTML = renderProcurementProcessGuide();
}

function initProcessGuidesModule() {
    const root = document.getElementById('process-guides');
    if (!root || root.dataset.pgInit === '1') return;
    root.dataset.pgInit = '1';

    root.querySelectorAll('.pg-tab').forEach((btn) => {
        btn.addEventListener('click', () => {
            root.querySelectorAll('.pg-tab').forEach((b) => b.classList.remove('is-active'));
            btn.classList.add('is-active');
            renderProcessGuidesContent();
        });
    });

    root.addEventListener('click', (e) => {
        const zoom = e.target.closest('[data-pg-lightbox]');
        if (zoom) {
            e.preventDefault();
            openProcessGuideLightbox(
                zoom.getAttribute('data-pg-lightbox'),
                zoom.getAttribute('data-pg-caption') || ''
            );
            return;
        }
        const id = e.target.closest('[data-pg-open]')?.getAttribute('data-pg-open');
        if (id && typeof navigateToModule === 'function') navigateToModule(id);
    });

    document.getElementById('processGuidesPrintBtn')?.addEventListener('click', () => {
        window.print();
    });

    renderProcessGuidesContent();
}
