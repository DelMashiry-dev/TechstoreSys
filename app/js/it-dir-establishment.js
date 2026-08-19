/* it-dir-establishment.js — Official IT Directorate establishment (Annex A / SD Instr 9) */

/**
 * Source: Organisation of Information and Communication Technology (ICT) Directorate
 * Annex 'A' to Amendment to IT Dir SD Instr 9 (Sep 2025) and departmental pages.
 * Counts are Officers + Other Ranks unless noted.
 */
const IT_DIR_ESTABLISHMENT = {
    title: 'Organisation of Information and Communication Technology (ICT) Directorate',
    shortTitle: 'IT Directorate Establishment',
    reference: "ANNEX 'A' TO AMENDMENT TO IT DIR SD INSTR 9 — SEP 2025",
    classification: 'CONFIDENTIAL',
    totals: { officers: 41, ors: 107, total: 148 },
    summaryByRankNote: 'Summary-by-rank sheet may show slight variance (e.g. 140) vs departmental pages.',
    hq: {
        key: 'dir_hq',
        name: 'Director Headquarters (Dir HQ)',
        strength: '3+3',
        posts: [
            { role: 'Dir (Director)', rank: '1 × Col', officeKey: 'dir' },
            { role: 'DD (Deputy Director)', rank: '1 × Lt Col', officeKey: 'dd' },
            { role: 'GSO2 / AQSO2', rank: '1 × Maj', officeKey: 'aqso2' },
            { role: 'RSM', rank: '1 × WO1', officeKey: null },
            { role: 'PA', rank: '1 × SSgt', officeKey: null },
            { role: 'Dvr', rank: '1 × Sgt', officeKey: null }
        ]
    },
    departments: [
        {
            key: 'sysadmin',
            name: 'Systems Administration Dept',
            strength: '7+13',
            page: 2,
            officeKey: 'sysadmin',
            hq: { title: 'HQ — System Administrator', strength: '1+0', posts: [{ role: 'System Administrator', rank: '1 × Maj' }] },
            branches: [
                {
                    name: 'Database Administration',
                    strength: '2+7',
                    officeKey: 'dba',
                    roles: ['Database Admin', 'Database Designer', 'Database Analyst', 'Backup & Recovery', 'Programmers'],
                    posts: [
                        { role: 'Database Admin', rank: '1 × Capt' },
                        { role: 'Database Designer', rank: '1 × Lt' },
                        { role: 'Database Analyst', rank: '1 × WO2' },
                        { role: 'Backup & Recovery', rank: '2 × SSgt' },
                        { role: 'Programmers', rank: '2 × Sgt + 2 × Cpl' }
                    ]
                },
                {
                    name: 'Network Administration',
                    strength: '2+2',
                    roles: ['Network Admin', 'Network Specialist', 'Asst Network Admin', 'Network Tech'],
                    posts: [
                        { role: 'Network Admin', rank: '1 × Capt' },
                        { role: 'Network Specialist', rank: '1 × Lt' },
                        { role: 'Asst Network Admin', rank: '1 × SSgt' },
                        { role: 'Network Tech', rank: '1 × Cpl' }
                    ]
                },
                {
                    name: 'Web Administration',
                    strength: '2+4',
                    roles: ['Web Admin', 'Web Designer', 'Asst Web Designer'],
                    posts: [
                        { role: 'Web Admin', rank: '1 × Capt' },
                        { role: 'Web Designer', rank: '1 × Lt' },
                        { role: 'Asst Web Designer', rank: '4 × WO2' }
                    ]
                }
            ]
        },
        {
            key: 'compengr',
            name: 'Computer Engineering Dept',
            strength: '5+9',
            page: 3,
            officeKey: 'compengr',
            hq: { title: 'HQ — Chief Comp Engr', strength: '1+0', posts: [{ role: 'Chief Comp Engr', rank: '1 × Maj' }] },
            branches: [
                {
                    name: 'Engineering Workshop',
                    strength: '2+8',
                    posts: [
                        { role: 'IC', rank: '1 × Capt' },
                        { role: 'Design Engr', rank: '1 × Lt' },
                        { role: 'Desktop Analyst', rank: '1 × WO2' },
                        { role: 'Tech', rank: '2 × SSgt' },
                        { role: 'Tech', rank: '5 × Sgt' }
                    ]
                },
                {
                    name: 'R & D Dept',
                    strength: '2+1',
                    posts: [
                        { role: 'IC', rank: '1 × Capt' },
                        { role: 'Design Engr', rank: '1 × Lt' },
                        { role: 'Desktop Analyst', rank: '1 × SSgt' }
                    ]
                }
            ]
        },
        {
            key: 'itts',
            name: 'ICT Training School (ITTS) — Trg School',
            strength: '7+16',
            page: 4,
            officeKey: 'itts',
            hq: {
                title: 'HQ',
                strength: '3+4',
                posts: [
                    { role: 'Comdt (Commandant)', rank: '1 × Lt Col' },
                    { role: 'CI (Chief Instructor)', rank: '1 × Maj' },
                    { role: 'Adjt / A/O', rank: '1 × Capt' },
                    { role: 'SSM', rank: '1 × WO1' },
                    { role: 'Admin NCO', rank: '1 × SSgt' },
                    { role: 'Clk / Typist', rank: '2 × Cpl' }
                ]
            },
            branches: [
                {
                    name: 'Basic ICT Training Wing',
                    strength: '1+7',
                    posts: [
                        { role: 'Cse Offr', rank: '1 × Capt' },
                        { role: 'Snr Instr', rank: '1 × SSgt' },
                        { role: 'Instr', rank: '3 × SSgt' },
                        { role: 'Instr', rank: '3 × Sgt' }
                    ]
                },
                {
                    name: 'Advanced ICT Training Wing',
                    strength: '3+5',
                    posts: [
                        { role: 'Cse Offr', rank: '3 × Capt' },
                        { role: 'Snr Instr', rank: '1 × WO2' },
                        { role: 'Snr Instr', rank: '2 × SSgt' },
                        { role: 'Instr', rank: '2 × Sgt' }
                    ]
                }
            ]
        },
        {
            key: 'swengr',
            name: 'Software Engineering Dept',
            strength: '6+9',
            page: 5,
            officeKey: 'swengr',
            hq: { title: 'HQ — Chief Software Engr', strength: '1+0', posts: [{ role: 'Chief Software Engr', rank: '1 × Maj' }] },
            branches: [
                {
                    name: 'Application Development Wing',
                    strength: '2+3',
                    roles: ['System Analyst', 'Full Stack Developers', 'Back End Developers', 'Snr Developers', 'Programmers'],
                    posts: [
                        { role: 'System Analyst / Wing lead', rank: '1 × Capt' },
                        { role: 'Developer / Analyst', rank: '1 × Lt' },
                        { role: 'Snr Developer', rank: '1 × WO2' },
                        { role: 'Developer', rank: '1 × SSgt' },
                        { role: 'Programmer', rank: '1 × Sgt' }
                    ]
                },
                {
                    name: 'Web & Mobile Dev Wing',
                    strength: '3+6',
                    roles: ['System Analyst', 'Full Stack Developers', 'Back End Developers', 'Snr Developers', 'Programmers'],
                    posts: [
                        { role: 'System Analyst / Wing lead', rank: '1 × Capt' },
                        { role: 'Developer / Analyst', rank: '2 × Lt' },
                        { role: 'Snr Developer', rank: '2 × WO2' },
                        { role: 'Developer', rank: '2 × SSgt' },
                        { role: 'Programmer', rank: '2 × Sgt' }
                    ]
                }
            ]
        },
        {
            key: 'admin_qm',
            name: 'Admin & QM Dept',
            strength: '2+11',
            page: 6,
            officeKey: 'admin',
            hq: { title: 'HQ — AO', strength: '1+0', posts: [{ role: 'AO (Administrative Officer)', rank: '1 × Capt' }] },
            branches: [
                {
                    name: 'Administration',
                    strength: '0+7',
                    posts: [
                        { role: 'Admin NCO', rank: '1 × SSgt' },
                        { role: 'Pro IC', rank: '1 × SSgt' },
                        { role: 'Clk / Typist', rank: '1 × Cpl' },
                        { role: 'RP', rank: '4 × Cpl' }
                    ]
                },
                {
                    name: 'Tech Stores',
                    strength: '1+4',
                    officeKey: 'techstores',
                    posts: [
                        { role: 'Tech Stores Offr', rank: '1 × Capt' },
                        { role: 'Tech Stores 2IC', rank: '1 × WO2' },
                        { role: 'Snr Stmn', rank: '1 × SSgt' },
                        { role: 'Stmn', rank: '1 × Sgt' },
                        { role: 'Stmn', rank: '1 × Cpl' }
                    ]
                }
            ]
        },
        {
            key: 'engr_sp',
            name: 'Engineering Support Dept',
            strength: '3+42',
            page: 7,
            officeKey: 'workshop',
            note: 'Engr Sp Depts for Formations × 10 (Help Desk Sp + Networks per formation).',
            hq: {
                title: 'HQ',
                strength: '3+2',
                posts: [
                    { role: 'Chief Sp Engr', rank: '1 × Maj' },
                    { role: 'Systems Sp Analyst', rank: '1 × Capt' },
                    { role: 'Analyst', rank: '1 × Capt' },
                    { role: 'Clerk', rank: '2 × Sgt' }
                ]
            },
            branches: [
                {
                    name: 'Help Desk Sp (per formation pattern)',
                    strength: '0+2',
                    posts: [
                        { role: 'IC Hardware Tech', rank: '1 × SSgt' },
                        { role: 'Snr Hardware Tech', rank: '1 × Sgt' }
                    ]
                },
                {
                    name: 'Networks (per formation pattern)',
                    strength: '0+2',
                    posts: [
                        { role: 'IC Network Tech', rank: '1 × SSgt' },
                        { role: 'Network Tech', rank: '1 × Sgt' }
                    ]
                }
            ]
        },
        {
            key: 'ictsec',
            name: 'ICT Security Dept',
            strength: '4+4',
            page: 8,
            officeKey: 'ictsec',
            hq: {
                title: 'HQ — CISO',
                strength: '1+0',
                posts: [{ role: 'Chief Information Security Officer (CISO)', rank: '1 × Maj' }]
            },
            branches: [
                {
                    name: 'Security Operations & Incident Response',
                    strength: '2+2',
                    posts: [
                        { role: 'SOC & IR Officer', rank: '1 × Maj' },
                        { role: 'Advanced Analyst & Forensics', rank: '1 × Capt' },
                        { role: 'Cybersecurity Snr Analyst', rank: '1 × WO1' },
                        { role: 'Cyber Security Analyst', rank: '1 × WO2' }
                    ]
                },
                {
                    name: 'Technical Operations',
                    strength: '1+2',
                    posts: [
                        { role: 'Technical Operations Officer', rank: '1 × Maj' },
                        { role: 'Ethical Hacker / VAPT Specialist', rank: '1 × WO2' },
                        { role: 'Digital Forensics Specialist', rank: '1 × SSgt' }
                    ]
                }
            ]
        }
    ]
};

function getItDirEstablishment() {
    return IT_DIR_ESTABLISHMENT;
}

function getItDirEstablishmentDept(key) {
    if (!key) return null;
    if (key === 'dir_hq' || key === 'hq') return IT_DIR_ESTABLISHMENT.hq;
    return IT_DIR_ESTABLISHMENT.departments.find((d) => d.key === key || d.officeKey === key) || null;
}

function escapeEstHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/** Compact HTML for one department's establishment (used on dept desks). */
function renderItDirEstablishmentDeptHtml(estKey, { note } = {}) {
    const est = getItDirEstablishment();
    const dept = getItDirEstablishmentDept(estKey);
    if (!dept) {
        return `<div class="dept-est-empty muted">No establishment entry for this department.</div>`;
    }

    const postRows = (posts = []) => posts.map((p) => `
        <li><span>${escapeEstHtml(p.role)}</span><strong>${escapeEstHtml(p.rank)}</strong></li>`).join('');

    const isHq = estKey === 'dir_hq' || estKey === 'hq' || dept === est.hq;
    if (isHq || dept.posts) {
        return `
        <div class="dept-est-block">
            <header class="dept-est-head">
                <div>
                    <h3>Establishment — ${escapeEstHtml(dept.name || 'Dir HQ')}</h3>
                    <p class="dept-est-meta">Strength ${escapeEstHtml(dept.strength || '')} · ${escapeEstHtml(est.reference || '')}</p>
                </div>
            </header>
            ${note ? `<p class="dept-est-note">${escapeEstHtml(note)}</p>` : ''}
            <ul class="idc-est-posts">${postRows(dept.posts || [])}</ul>
        </div>`;
    }

    const branches = (dept.branches || []).map((b) => `
        <div class="idc-est-branch">
            <div class="idc-est-branch-head">
                <h5>${escapeEstHtml(b.name)}</h5>
                <span class="idc-est-strength">${escapeEstHtml(b.strength || '')}</span>
            </div>
            ${b.roles?.length ? `<p class="idc-est-roles">${b.roles.map(escapeEstHtml).join(' · ')}</p>` : ''}
            <ul class="idc-est-posts">${postRows(b.posts)}</ul>
        </div>`).join('');

    return `
    <div class="dept-est-block" id="dept-est-${escapeEstHtml(dept.key || estKey)}">
        <header class="dept-est-head">
            <div>
                <h3>Establishment — ${escapeEstHtml(dept.name)}</h3>
                <p class="dept-est-meta">Strength ${escapeEstHtml(dept.strength || '')}${dept.page ? ` · see page ${dept.page}` : ''} · ${escapeEstHtml(est.classification || '')}</p>
            </div>
            <span class="dept-est-pill">${escapeEstHtml(dept.strength || '')}</span>
        </header>
        ${note ? `<p class="dept-est-note">${escapeEstHtml(note)}</p>` : ''}
        ${dept.note ? `<p class="dept-est-note">${escapeEstHtml(dept.note)}</p>` : ''}
        ${dept.hq ? `
            <div class="idc-est-hq">
                <div class="idc-est-branch-head">
                    <h5>${escapeEstHtml(dept.hq.title)}</h5>
                    <span class="idc-est-strength">${escapeEstHtml(dept.hq.strength || '')}</span>
                </div>
                <ul class="idc-est-posts">${postRows(dept.hq.posts)}</ul>
            </div>` : ''}
        <div class="idc-est-branches">${branches}</div>
        <p class="dept-est-ref muted">${escapeEstHtml(est.reference || '')}</p>
    </div>`;
}

function parseStrength(str) {
    const m = String(str || '').match(/(\d+)\s*\+\s*(\d+)/);
    if (!m) return { officers: 0, ors: 0, total: 0 };
    const officers = Number(m[1]) || 0;
    const ors = Number(m[2]) || 0;
    return { officers, ors, total: officers + ors };
}

window.IT_DIR_ESTABLISHMENT = IT_DIR_ESTABLISHMENT;
window.getItDirEstablishment = getItDirEstablishment;
window.getItDirEstablishmentDept = getItDirEstablishmentDept;
window.renderItDirEstablishmentDeptHtml = renderItDirEstablishmentDeptHtml;
window.parseStrength = parseStrength;
