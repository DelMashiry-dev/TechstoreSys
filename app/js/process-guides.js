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

function renderHdProcurementCyclePoster() {
    const ringSteps = [
        { n: 1, phase: 'plan', label: 'Identify needs / scope' },
        { n: 2, phase: 'plan', label: 'Justify needs & analyze options' },
        { n: 3, phase: 'plan', label: 'Specify requirements' },
        { n: 4, phase: 'acquire', label: 'Plan procurement approach' },
        { n: 5, phase: 'acquire', label: 'Approach the market & suppliers' },
        { n: 6, phase: 'acquire', label: 'Negotiate & select contract' },
        { n: 7, phase: 'manage', label: 'Manage contract performance & relationships' },
        { n: 8, phase: 'manage', label: 'Review supplier performance & learn' }
    ];
    const stages = [
        { n: 1, title: 'Need identification & procurement planning', detail: 'Identify needs and develop a procurement plan aligned to organisational objectives.' },
        { n: 2, title: 'Preparation of tender documents and specifications', detail: 'Prepare clear, complete and accurate tender documents and specifications.' },
        { n: 3, title: 'Issue of invitations to tender & tender documentation', detail: 'Invite qualified suppliers and issue tender documents.' },
        { n: 4, title: 'Receipt of offers', detail: 'Receive, open and record tenders in a transparent and secure manner.' },
        { n: 5, title: 'Tender evaluation', detail: 'Evaluate tenders fairly and objectively against pre-defined criteria.' },
        { n: 6, title: 'Approval of tender award', detail: 'Obtain the necessary approval to award the contract to the successful bidder.' },
        { n: 7, title: 'Contract formation', detail: 'Formalise the agreement and terms through contract signing.' },
        { n: 8, title: 'Contract management (acceptance, payment & closure)', detail: 'Manage contract performance, inspect and accept goods/services, make payments and close out the contract / disposal.' }
    ];

    const cx = 160;
    const cy = 160;
    const r = 118;
    const nodes = ringSteps.map((s, i) => {
        const angle = (-90 + i * 45) * (Math.PI / 180);
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        return `<g class="pg-cycle-node pg-cycle-${s.phase}">
            <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="18" />
            <text x="${x.toFixed(1)}" y="${(y + 5).toFixed(1)}" text-anchor="middle">${s.n}</text>
        </g>`;
    }).join('');

    const legend = ringSteps.map((s) => `
        <li class="pg-cycle-leg pg-cycle-${s.phase}">
            <span class="pg-cycle-leg-n">${s.n}</span>
            <span>${escapePg(s.label)}</span>
        </li>`).join('');

    const stageRows = stages.map((s) => `
        <li class="pg-hd-step">
            <span class="pg-hd-num" aria-hidden="true">${s.n}</span>
            <div class="pg-hd-step-body">
                <h4>${escapePg(s.title)}</h4>
                <p>${escapePg(s.detail)}</p>
            </div>
        </li>`).join('');

    return `
        <section class="pg-hd-poster pg-hd-cycle" aria-label="Procurement cycle HD chart">
            <header class="pg-hd-head pg-hd-head-cycle">
                <div class="pg-hd-brand">
                    <img src="../assets/zna-logo.png" alt="ZNA" class="pg-hd-logo" onerror="this.style.display='none'">
                </div>
                <div class="pg-hd-titles">
                    <p class="pg-hd-kicker">Zimbabwe National Army · TechStores</p>
                    <h3>The procurement cycle</h3>
                    <p class="pg-hd-tagline">Ensuring value, transparency and accountability</p>
                </div>
            </header>

            <div class="pg-cycle-layout">
                <div class="pg-cycle-visual">
                    <svg class="pg-cycle-svg" viewBox="0 0 320 320" role="img" aria-label="Eight-step procurement cycle around Needs">
                        <circle class="pg-cycle-ring-outer" cx="160" cy="160" r="138" />
                        <circle class="pg-cycle-ring-mid" cx="160" cy="160" r="118" />
                        <circle class="pg-cycle-core" cx="160" cy="160" r="42" />
                        <text class="pg-cycle-core-text" x="160" y="166" text-anchor="middle">Needs</text>
                        ${nodes}
                    </svg>
                    <div class="pg-cycle-phases">
                        <span class="pg-cycle-phase plan">Plan 1–3</span>
                        <span class="pg-cycle-phase acquire">Acquire 4–6</span>
                        <span class="pg-cycle-phase manage">Service / Manage 7–8</span>
                    </div>
                </div>
                <div class="pg-cycle-side">
                    <div class="pg-hd-panel">
                        <h4>Our goal</h4>
                        <p>Right quality · Right price · Right time · Right supplier</p>
                    </div>
                    <div class="pg-hd-panel">
                        <h4>Value for money</h4>
                        <p>Not always the cheapest — best overall value:</p>
                        <ul>
                            <li>Capacity</li>
                            <li>Quality</li>
                            <li>Reputation</li>
                            <li>Delivery</li>
                            <li>Price</li>
                        </ul>
                    </div>
                    <div class="pg-hd-panel pg-hd-panel-dark">
                        <h4>Due diligence</h4>
                        <p>Conducted by the Army Internal Audit Directorate (AIAD) to certify quotations. Choose best value, not just lowest cost.</p>
                    </div>
                    <ol class="pg-cycle-legend">${legend}</ol>
                </div>
            </div>

            <h4 class="pg-cycle-stages-title">8 stages of the procurement cycle</h4>
            <ol class="pg-hd-steps pg-cycle-stages">${stageRows}</ol>

            <footer class="pg-hd-foot">
                <p><strong>Transparency · Accountability · Integrity · Value for Money</strong></p>
                <p class="pg-hd-motto" style="margin:0">Procure with purpose. Deliver with excellence.</p>
            </footer>
        </section>`;
}

function renderProcurementCycleGuide() {
    return `
        <article class="pg-article pg-article-wide">
            <header class="pg-header">
                <h3>The procurement cycle</h3>
                <p>Ensuring value, transparency and accountability</p>
                <p class="pg-note">
                    HD cycle chart below is screen-sharp. Complements the Army procedure steps on the
                    <strong>Procurement process</strong> tab (Cost Centre Dir / QS Br / DP / AIAD).
                </p>
            </header>
            ${renderHdProcurementCyclePoster()}
            <details class="pg-originals">
                <summary>View original cycle poster (optional)</summary>
                ${renderProcessGuideChart(processGuideAsset('procurement-cycle.png'), 'Original procurement cycle poster')}
            </details>
            <p class="pg-links">Related modules:
                <button type="button" class="btn btn-ghost btn-sm" data-pg-open="dp-procurement">ICT Procurement Cycle</button>
                <button type="button" class="btn btn-ghost btn-sm" data-pg-open="dp-f1-form">DP F1</button>
                <button type="button" class="btn btn-ghost btn-sm" data-pg-open="purchase-orders">Purchase Orders</button>
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
                    Unit administration and filing sit in the <strong>Orderly Room</strong>: Roll Call, establishment,
                    personal files, typing pool, passes, and letter booking. Letters that originate at unit level are
                    signed by the <strong>DD or Dir</strong>. Incoming Army / unit letters are filed in the
                    <strong>Daily File (DF)</strong> or <strong>First Sight</strong> so HoDs stay updated.
                </p>
            </header>
            <ol class="pg-hd-steps">
                <li class="pg-hd-step"><span class="pg-hd-num">1</span><div class="pg-hd-step-body">
                    <h4>Receive &amp; book</h4>
                    <p>Chief Clerk (WO1/WO2) supervises; NCMs (Cpl) dispatch outgoing letters. AO (Capt/Lt) → AQSO2 (Maj) → DD (Lt Col) → Dir (Col).</p>
                </div></li>
                <li class="pg-hd-step"><span class="pg-hd-num">2</span><div class="pg-hd-step-body">
                    <h4>File requisition letters in DF</h4>
                    <p>Unit requisitions (often via <strong>GS Branch</strong>) are put in DF so TechStores Officer / RQ see them. GS authorisation kick-starts the procurement cycle.</p>
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
                <button type="button" class="btn btn-ghost btn-sm" data-pg-open="dp-procurement">ICT Procurement Cycle</button>
            </p>
        </article>`;
}

function renderProcessGuidesContent() {
    const host = document.getElementById('processGuidesContent');
    if (!host) return;
    const tab = document.querySelector('.pg-tab.is-active')?.getAttribute('data-pg-tab') || 'procurement';
    if (tab === 'cycle') host.innerHTML = renderProcurementCycleGuide();
    else if (tab === 'orderly') host.innerHTML = renderOrderlyRoomGuide();
    else if (tab === 'repair') host.innerHTML = renderRepairIntakeGuide();
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
