/* zna-units.js — ZNA corps, formations, directorates, units & establishments
   Used for Holding Unit / Formation pickers (ZA asset register, loans, requisitions).
*/

const ZNA_IT_DIR_LOCATIONS = [
    { name: 'Information Technology Directorate', abbr: 'IT Dir' },
    { name: 'System Development Department', abbr: 'SDD' },
    { name: 'IT Training School', abbr: 'ITTS' },
    { name: 'Workshop', abbr: 'Wksp' },
    { name: 'Orderly Room', abbr: 'OR' },
    { name: 'DBA', abbr: 'DBA' },
    { name: 'Quartermaster', abbr: 'QM' },
    { name: 'Programmers', abbr: 'Prog' },
    { name: 'AQSO', abbr: 'AQSO' },
    { name: 'RP', abbr: 'RP' },
    { name: 'Server Room', abbr: 'Srv Rm' }
];

const ZNA_UNIT_GROUPS = [
    {
        id: 'it-dir',
        label: 'IT Directorate (local)',
        units: ZNA_IT_DIR_LOCATIONS
    },
    {
        id: 'corps',
        label: 'Corps of the Zimbabwe National Army',
        units: [
            { name: 'Zimbabwe Corps of Infantry', abbr: 'Z Inf' },
            { name: 'Zimbabwe Intelligence Corps', abbr: 'ZIC' },
            { name: 'Zimbabwe Artillery Corps', abbr: 'ZA' },
            { name: 'Zimbabwe Corps of Engineers', abbr: 'ZE' },
            { name: 'Zimbabwe Corps of Signals', abbr: 'Z Sigs' },
            { name: 'Zimbabwe Army Medical Corps', abbr: 'ZAMC' },
            { name: 'Zimbabwe Army Ordnance Corps', abbr: 'Ord' },
            { name: 'Zimbabwe Corps of Military Police', abbr: 'ZMP' },
            { name: 'Zimbabwe Corps of Electrical and Mechanical Engineering', abbr: 'EME' },
            { name: 'Zimbabwe Army Pay and Records Corps', abbr: 'ZAPARC' },
            { name: 'Zimbabwe Army Education Corps', abbr: 'ZAEC' },
            { name: 'Zimbabwe Corps of Transport', abbr: 'Tpt' },
            { name: 'Zimbabwe Corps of Chaplains', abbr: 'ZCCH' }
        ]
    },
    {
        id: 'formations',
        label: 'Formations (Army)',
        units: [
            { name: 'Zimbabwe Defence Forces Headquarters', abbr: 'ZDF HQ' },
            { name: 'Army Headquarters', abbr: 'Army HQ' },
            { name: '1 Brigade', abbr: '1 Bde' },
            { name: '2 Brigade', abbr: '2 Bde' },
            { name: '3 Brigade', abbr: '3 Bde' },
            { name: '4 Brigade', abbr: '4 Bde' },
            { name: '5 Brigade', abbr: '5 Bde' },
            { name: 'Presidential Guards Brigade', abbr: 'Pres Gd Bde' },
            { name: 'Mechanised Brigade', abbr: 'Mech Bde' },
            { name: 'Field Artillery Brigade', abbr: 'Fd Arty Bde' },
            { name: 'Harare District', abbr: 'Hre Dist' },
            { name: 'Bulawayo District', abbr: 'Byo Dist' }
        ]
    },
    {
        id: 'staff',
        label: 'Staff Branches',
        units: [
            { name: 'General Staff Branch', abbr: 'GS Branch' },
            { name: 'Administration Staff Branch', abbr: 'AS Branch' },
            { name: 'Quartermaster Staff Branch', abbr: 'QS Branch' }
        ]
    },
    {
        id: 'directorates',
        label: 'Directorates (Army)',
        units: [
            { name: 'Engineers Directorate', abbr: 'Engr Dir' },
            { name: 'Electrical and Mechanical Engineering Directorate', abbr: 'EME Dir' },
            { name: 'Signals Directorate', abbr: 'Sigs Dir' },
            { name: 'Directorate of Army Finance', abbr: 'DAF' },
            { name: 'Directorate of Army Training', abbr: 'DAT' },
            { name: 'Medical Directorate', abbr: 'Med Dir' },
            { name: 'Ordnance Directorate', abbr: 'Ord Dir' },
            { name: 'Zimbabwe Military Police Directorate', abbr: 'ZMP Dir' },
            { name: 'Directorate of Legal Services', abbr: 'DLS' },
            { name: 'Army Project', abbr: 'Army Projs' },
            { name: 'Directorate of Procurement', abbr: 'DP' },
            { name: 'Directorate of Prosecution', abbr: 'Dir Pros' },
            { name: 'Transport Directorate', abbr: 'Tpt Dir' },
            { name: 'Education Directorate', abbr: 'Ed Dir' },
            { name: 'Zimbabwe Army Corps of Chaplains', abbr: 'ZACCH' },
            { name: 'Public Relations Directorate', abbr: 'PRD' },
            { name: 'Military Intelligence Directorate', abbr: 'MID' },
            { name: 'Mapping and Research', abbr: 'M&R (MID)' }
        ]
    },
    {
        id: 'units',
        label: 'Units and Establishments — Army',
        units: [
            { name: 'Zimbabwe Staff College', abbr: 'ZSC' },
            { name: 'Zimbabwe Military Academy', abbr: 'ZMA' },
            { name: 'Zimbabwe School of Infantry', abbr: 'ZS Inf' },
            { name: 'Ordnance and Transport Training School', abbr: 'OTTS' },
            { name: 'All Arms Battle School', abbr: 'AABS' },
            { name: 'Electrical Mechanical Engineering Training School', abbr: 'ETS' },
            { name: 'Field Artillery Training School', abbr: 'FATS' },
            { name: '11 Infantry Battalion', abbr: '11 Inf Bn' },
            { name: '12 Infantry Battalion', abbr: '12 Inf Bn' },
            { name: '13 Infantry Battalion', abbr: '13 Inf Bn' },
            { name: '21 Infantry Battalion', abbr: '21 Inf Bn' },
            { name: '22 Infantry Battalion', abbr: '22 Inf Bn' },
            { name: '23 Infantry Battalion', abbr: '23 Inf Bn' },
            { name: '31 Infantry Battalion', abbr: '31 Inf Bn' },
            { name: '32 Infantry Battalion', abbr: '32 Inf Bn' },
            { name: '33 Infantry Battalion', abbr: '33 Inf Bn' },
            { name: '41 Infantry Battalion', abbr: '41 Inf Bn' },
            { name: '42 Infantry Battalion', abbr: '42 Inf Bn' },
            { name: '43 Infantry Battalion', abbr: '43 Inf Bn' },
            { name: '51 Infantry Battalion', abbr: '51 Inf Bn' },
            { name: '52 Infantry Battalion', abbr: '52 Inf Bn' },
            { name: '53 Infantry Battalion', abbr: '53 Inf Bn' },
            { name: '1 Presidential Guard Battalion', abbr: '1 Pres Gd Bn' },
            { name: '2 Presidential Guard Battalion', abbr: '2 Pres Gd Bn' },
            { name: '3 Presidential Guard Battalion', abbr: '3 Pres Gd Bn' },
            { name: 'Presidential Guards Mounted Squadron', abbr: 'Pres Gd Mtd Sqn' },
            { name: 'Parachute Regiment', abbr: 'Para Regt' },
            { name: 'Commando Regiment', abbr: 'Cdo Regt' },
            { name: '1 Mechanized Infantry Battalion', abbr: '1 Mech Bn' },
            { name: '2 Mechanized Infantry Battalion', abbr: '2 Mech Bn' },
            { name: 'School of Military Intelligence', abbr: 'SMI' },
            { name: 'Mapping and Research Wing', abbr: 'M&R Wing' },
            { name: '1 Intelligence Company', abbr: '1 Int Coy' },
            { name: '2 Intelligence Company', abbr: '2 Int Coy' },
            { name: '3 Intelligence Company', abbr: '3 Int Coy' },
            { name: '4 Intelligence Company', abbr: '4 Int Coy' },
            { name: '5 Intelligence Company', abbr: '5 Int Coy' },
            { name: 'Presidential Guard Intelligence Company', abbr: 'Pres Gd Int Coy' },
            { name: 'Zimbabwe Armoured Regiment', abbr: 'ZAR' },
            { name: '1 Field Regiment Zimbabwe Artillery', abbr: '1 Fd Regt ZA' },
            { name: '2 Field Regiment Zimbabwe Artillery', abbr: '2 Fd Regt ZA' },
            { name: '3 Field Regiment Zimbabwe Artillery', abbr: '3 Fd Regt ZA' },
            { name: '1 Air Defence Regiment Zimbabwe Artillery', abbr: '1 AD Regt ZA' },
            { name: 'Zimbabwe School of Military Engineering', abbr: 'ZSME' },
            { name: 'Zimbabwe Engineer\'s Trade Training School', abbr: 'ZETTS' },
            { name: '1 Engineer Support Regiment', abbr: '1 Engr Sp Regt' },
            { name: '2 Engineer Field Squadron', abbr: '2 Engr Fd Sqn' },
            { name: '3 Engineer Field Squadron', abbr: '3 Engr Fd Sqn' },
            { name: '4 Engineer Field Squadron', abbr: '4 Engr Fd Sqn' },
            { name: '5 Engineer Field Squadron', abbr: '5 Engr Fd Sqn' },
            { name: '7 Engineer Field Squadron', abbr: '7 Engrs Fd Sqn' },
            { name: 'Presidential Guard Engineer Squadron', abbr: 'Pres Gd Engr Sqn' },
            { name: '8 Amphibious Engineer Squadron', abbr: '8 Amph Engr Sqn' },
            { name: 'Mechanized Brigade Engineer Squadron', abbr: 'Mech Bde Engr Sqn' },
            { name: 'School of Signals', abbr: 'S Sigs' },
            { name: '1 Signal Regiment', abbr: '1 Sig Regt' },
            { name: '2 Signal Regiment', abbr: '2 Sig Regt' },
            { name: '1 Signal Squadron', abbr: '1 Sig Sqn' },
            { name: '2 Signal Squadron', abbr: '2 Sig Sqn' },
            { name: '3 Signal Squadron', abbr: '3 Sig Sqn' },
            { name: '4 Signal Squadron', abbr: '4 Sig Sqn' },
            { name: '5 Signal Squadron', abbr: '5 Sig Sqn' },
            { name: 'Presidential Guard Signal Squadron', abbr: 'Pres Gd Sig Sqn' },
            { name: '8 Signal Squadron', abbr: '8 Sig Sqn' },
            { name: '10 Signal Squadron', abbr: '10 Sig Sqn' },
            { name: '11 Signal Squadron', abbr: '11 Sig Sqn' },
            { name: '12 Signal Squadron', abbr: '12 Sig Sqn' },
            { name: 'Mechanized Brigade Signals Squadron', abbr: 'Mech Bde Sig Sqn' },
            { name: 'Ordnance and Supplies Depot Harare', abbr: 'OSD Hre' },
            { name: 'Ordnance and Supplies Depot Bulawayo', abbr: 'OSD Byo' },
            { name: 'Harare Base Workshop', abbr: 'Hre Base Wksp' },
            { name: 'Harare Station Workshop', abbr: 'Hre Stn Wksp' },
            { name: 'Bulawayo Station Workshop', abbr: 'Byo Stn Wksp' },
            { name: 'Armour Technical School', abbr: 'ATTS' },
            { name: 'Medical Training School', abbr: 'MTS' },
            { name: '1 Field Ambulance Company', abbr: '1 Fd Amb Coy' },
            { name: '2 Field Ambulance Company', abbr: '2 Fd Amb Coy' },
            { name: '3 Field Ambulance Company', abbr: '3 Fd Amb Coy' },
            { name: '4 Field Ambulance Company', abbr: '4 Fd Amb Coy' },
            { name: '5 Field Ambulance Company', abbr: '5 Fd Amb Coy' },
            { name: 'Mechanised Brigade Field Ambulance Company', abbr: 'Mech Bde Fd Amb Coy' },
            { name: 'Presidential Guards Field Ambulance Company', abbr: 'Pres Gd Fd Amb Coy' },
            { name: '1 Medical Company', abbr: '1 Med Coy' },
            { name: '2 Medical Company', abbr: '2 Med Coy' },
            { name: 'Army Health Unit', abbr: 'AHU' },
            { name: 'Army Medical Equipment Stores', abbr: 'AMES' },
            { name: 'School of Military Police', abbr: 'SMP' },
            { name: '1 Provost Platoon', abbr: '1 Pro Pl' },
            { name: '2 Provost Platoon', abbr: '2 Pro Pl' },
            { name: '3 Provost Platoon', abbr: '3 Pro Pl' },
            { name: '4 Provost Platoon', abbr: '4 Pro Pl' },
            { name: '5 Provost Platoon', abbr: '5 Pro Pl' },
            { name: 'Presidential Guards Provost Platoon', abbr: 'Pres Gd Pro Pl' },
            { name: 'Army Detention Barracks', abbr: 'Army DB' },
            { name: 'Harare District Provost Company', abbr: 'Hre Pro Coy' },
            { name: 'Bulawayo District Provost Company', abbr: 'Byo Pro Coy' },
            { name: 'Pay Corps Training School', abbr: 'PCTS' },
            { name: 'Army Pay Office', abbr: 'APO' },
            { name: 'Army School of Education', abbr: 'ASE' },
            { name: '1 Education Company', abbr: '1 Edn Coy' },
            { name: '2 Education Company', abbr: '2 Edn Coy' },
            { name: '3 Education Company', abbr: '3 Edn Coy' },
            { name: '4 Education Company', abbr: '4 Edn Coy' },
            { name: '5 Education Company', abbr: '5 Edn Coy' },
            { name: 'Mechanised Brigade Education Company', abbr: 'Mech Bde Edn Coy' },
            { name: 'Presidential Guards Education Company', abbr: 'Pres Gd Ed Coy' }
        ]
    }
];

function znaUnitEscape(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function formatZnaUnitLabel(unit) {
    if (!unit) return '';
    if (typeof unit === 'string') return unit;
    const name = unit.name || '';
    const abbr = unit.abbr || '';
    if (name && abbr && name !== abbr) return `${name} (${abbr})`;
    return name || abbr || '';
}

function getZnaUnitValue(unit) {
    if (!unit) return '';
    if (typeof unit === 'string') return unit;
    return unit.abbr || unit.name || '';
}

function flattenZnaUnits() {
    const out = [];
    const seen = new Set();
    (ZNA_UNIT_GROUPS || []).forEach((group) => {
        (group.units || []).forEach((unit) => {
            const value = getZnaUnitValue(unit);
            if (!value || seen.has(value.toLowerCase())) return;
            seen.add(value.toLowerCase());
            out.push({
                ...unit,
                value,
                label: formatZnaUnitLabel(unit),
                group: group.label,
                groupId: group.id
            });
        });
    });
    return out;
}

function resolveZnaUnitLabel(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';
    const all = flattenZnaUnits();
    const hit = all.find((u) =>
        u.value.toLowerCase() === raw.toLowerCase()
        || u.name.toLowerCase() === raw.toLowerCase()
        || (u.abbr && u.abbr.toLowerCase() === raw.toLowerCase())
        || u.label.toLowerCase() === raw.toLowerCase()
    );
    return hit ? hit.label : raw;
}

/**
 * Build <option>/<optgroup> HTML for a ZNA unit/formation select.
 * @param {string} selected - current value (abbr or free text)
 * @param {{ includeBlank?: boolean, blankLabel?: string, includeOther?: boolean, filter?: string }} opts
 */
function buildZnaUnitOptionsHtml(selected, opts = {}) {
    const includeBlank = opts.includeBlank !== false;
    const blankLabel = opts.blankLabel || '— Select unit / formation —';
    const includeOther = opts.includeOther !== false;
    const filter = String(opts.filter || '').trim().toLowerCase();
    const current = String(selected || '').trim();
    const parts = [];

    if (includeBlank) {
        parts.push(`<option value="">${znaUnitEscape(blankLabel)}</option>`);
    }

    let matchedSelected = false;
    (ZNA_UNIT_GROUPS || []).forEach((group) => {
        const units = (group.units || []).filter((unit) => {
            if (!filter) return true;
            const label = formatZnaUnitLabel(unit).toLowerCase();
            const value = getZnaUnitValue(unit).toLowerCase();
            return label.includes(filter) || value.includes(filter);
        });
        if (!units.length) return;
        parts.push(`<optgroup label="${znaUnitEscape(group.label)}">`);
        units.forEach((unit) => {
            const value = getZnaUnitValue(unit);
            const label = formatZnaUnitLabel(unit);
            const selectedAttr = value === current || unit.name === current || unit.abbr === current
                ? ' selected'
                : '';
            if (selectedAttr) matchedSelected = true;
            parts.push(`<option value="${znaUnitEscape(value)}"${selectedAttr}>${znaUnitEscape(label)}</option>`);
        });
        parts.push('</optgroup>');
    });

    if (current && !matchedSelected) {
        parts.splice(includeBlank ? 1 : 0, 0,
            `<option value="${znaUnitEscape(current)}" selected>${znaUnitEscape(current)} (custom)</option>`
        );
    }

    if (includeOther) {
        parts.push(`<option value="__other__"${current === '__other__' ? ' selected' : ''}>Other / type custom…</option>`);
    }

    return parts.join('');
}

function fillZnaUnitSelect(selectEl, selected, opts = {}) {
    if (!selectEl) return;
    const current = selected != null ? selected : selectEl.value;
    selectEl.innerHTML = buildZnaUnitOptionsHtml(current, opts);
    if (current && selectEl.value !== current) {
        // Prefer exact match after rebuild
        const options = [...selectEl.options];
        const hit = options.find((o) => o.value === current || o.textContent === current);
        if (hit) selectEl.value = hit.value;
    }
}

function wireZnaUnitPicker(selectEl, filterEl, opts = {}) {
    if (!selectEl || selectEl.dataset.znaWired === '1') return;
    selectEl.dataset.znaWired = '1';
    fillZnaUnitSelect(selectEl, selectEl.value || opts.selected || '', opts);

    const refresh = () => {
        const keep = selectEl.value;
        fillZnaUnitSelect(selectEl, keep, {
            ...opts,
            filter: filterEl?.value || ''
        });
        // Keep focus friendly when filtering
        if (filterEl?.value && selectEl.options.length > 1) {
            const firstReal = [...selectEl.options].find((o) => o.value && o.value !== '__other__');
            if (firstReal && !keep) selectEl.value = firstReal.value;
        }
    };

    filterEl?.addEventListener('input', refresh);
    selectEl.addEventListener('change', () => {
        if (selectEl.value !== '__other__') return;
        const custom = window.prompt('Enter unit / formation / directorate:', '');
        if (custom && custom.trim()) {
            fillZnaUnitSelect(selectEl, custom.trim(), { ...opts, filter: '' });
            if (filterEl) filterEl.value = '';
        } else {
            selectEl.value = '';
        }
    });
}

function buildZnaUnitSelectMarkup(id, opts = {}) {
    const filterId = opts.filterId || `${id}Filter`;
    const selected = opts.selected || '';
    const placeholder = opts.filterPlaceholder || 'Type to filter units…';
    return `
        <div class="zna-unit-picker">
            <input type="search" class="form-control zna-unit-filter" id="${znaUnitEscape(filterId)}"
                placeholder="${znaUnitEscape(placeholder)}" autocomplete="off" aria-label="Filter units">
            <select class="form-control zna-unit-select" id="${znaUnitEscape(id)}" title="ZNA unit / formation">
                ${buildZnaUnitOptionsHtml(selected, opts)}
            </select>
        </div>
    `;
}
