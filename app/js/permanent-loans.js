/* permanent-loans.js — laptops / iPads on permanent loan (Comd/34 · AS(PLANS)/34 · QM IT DIR 17 Mar 20) */

const PL_YEARS = 3;
const PL_WARN_DAYS = 90;

const PL_POLICY_REFS = [
    { ref: 'Comd/34', date: '06 Nov 2015', title: 'Policy on the issue of laptops and iPads to individuals' },
    { ref: 'AS(PLANS)/34', date: '23 Aug 2018', title: 'Permanent loans — scratch ZA-NO after 3 years; retain as personal' },
    { ref: 'IT/17', date: '15 Aug 2018', title: 'IT Dir letter on permanent loans' },
    { ref: 'QM IT DIR', date: '17 Mar 2020', title: 'Procedure on issuing laptops and iPads on permanent loan' }
];

const PL_CATEGORIES = [
    { value: 'laptop', label: 'Laptop' },
    { value: 'ipad', label: 'iPad / tablet' }
];

const PL_RANKS = [
    { value: '', label: '— Rank —' },
    { value: 'Gen', label: 'General' },
    { value: 'Lt Gen', label: 'Lieutenant General' },
    { value: 'Maj Gen', label: 'Major General' },
    { value: 'Brig Gen', label: 'Brigadier General' },
    { value: 'Col', label: 'Colonel' },
    { value: 'Lt Col', label: 'Lieutenant Colonel' },
    { value: 'Maj', label: 'Major (Grade Two Staff Officer)' },
    { value: 'Capt', label: 'Captain' },
    { value: 'Lt', label: 'Lieutenant' },
    { value: 'Other', label: 'Other' }
];

const PL_ELIGIBILITY = [
    { value: 'lt_col_cmd_staff', label: 'Lt Col and above — command or staff appointment' },
    { value: 'gso2_fmn_ahq', label: 'Grade Two Staff Officer at Formation or Army HQ' },
    { value: 'training', label: 'Training institution / Training Branch (retained — not personal)' },
    { value: 'ineligible', label: 'Not eligible (Comd/34 para 2a / 3)' }
];

const PL_STEPS = [
    { key: 'engrave', n: 1, label: 'Engrave ZA-NO if not already engraved (Masasa / MLG)' },
    { key: 'issue', n: 2, label: 'QM issues permanent T/loan (serving members; replaces 7-day renewal)' },
    { key: 'retire_trigger', n: 3, label: 'Retirement or 3-year completion trigger' },
    { key: 'qs_letter', n: 4, label: 'IT Dir letter to QS Br — instruct Masasa to clear ZA-NO' },
    { key: 'mid_wipe', n: 5, label: 'MID and IT Dir specialist erase information of a military nature' },
    { key: 'write_off', n: 6, label: 'Write-off authority issued; strike off Master Ledger' }
];

function plEscape(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function plTodayIso() {
    const d = new Date();
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function plTodayLocal() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
}

function plParseIso(value) {
    if (!value) return null;
    const d = new Date(`${value}T00:00:00`);
    if (Number.isNaN(d.getTime())) return null;
    d.setHours(0, 0, 0, 0);
    return d;
}

function plAddYearsIso(isoDate, years) {
    const d = plParseIso(isoDate);
    if (!d) return '';
    d.setFullYear(d.getFullYear() + years);
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function plFormatDate(isoDate) {
    if (!isoDate) return '—';
    const d = plParseIso(isoDate);
    if (!d) return isoDate;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function plDaysBetween(fromDate, toDate) {
    if (!fromDate || !toDate) return null;
    return Math.round((toDate - fromDate) / (1000 * 60 * 60 * 24));
}

function ensurePermanentLoans() {
    if (!appState.permanentLoans) appState.permanentLoans = [];
    if (!Array.isArray(appState.permanentLoans)) appState.permanentLoans = [];
    return appState.permanentLoans;
}

function plDefaultSteps() {
    const steps = {};
    PL_STEPS.forEach((s) => {
        steps[s.key] = { done: false, date: '', note: '' };
    });
    return steps;
}

function createPermanentLoanRecord(partial = {}) {
    const steps = { ...plDefaultSteps(), ...(partial.steps || {}) };
    PL_STEPS.forEach((s) => {
        const cur = steps[s.key] || {};
        steps[s.key] = {
            done: cur.done === true || cur.done === '1' || cur.done === 'yes',
            date: String(cur.date || '').trim(),
            note: String(cur.note || '').trim()
        };
    });
    return {
        id: partial.id || `pl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        issueDate: String(partial.issueDate || '').trim(),
        category: partial.category === 'ipad' ? 'ipad' : 'laptop',
        item: String(partial.item || '').trim(),
        description: String(partial.description || '').trim(),
        zaNumber: String(partial.zaNumber || '').trim().toUpperCase().replace(/\s+/g, ''),
        serialNo: String(partial.serialNo || '').trim(),
        qty: Number(partial.qty) > 0 ? Number(partial.qty) : 1,
        issuedTo: String(partial.issuedTo || '').trim(),
        rank: String(partial.rank || '').trim(),
        forceNo: String(partial.forceNo || '').trim(),
        appointment: String(partial.appointment || '').trim(),
        eligibility: PL_ELIGIBILITY.some((e) => e.value === partial.eligibility)
            ? partial.eligibility
            : 'lt_col_cmd_staff',
        unit: String(partial.unit || '').trim(),
        purpose: partial.purpose === 'training' ? 'training' : 'individual',
        engraved: partial.engraved === false || partial.engraved === 'no' ? 'no' : 'yes',
        voucherNo: String(partial.voucherNo || '').trim(),
        issuedBy: String(partial.issuedBy || '').trim(),
        serving: partial.serving === 'no' || partial.serving === false ? 'no' : 'yes',
        retirementDate: String(partial.retirementDate || '').trim(),
        steps,
        masasaClearedDate: String(partial.masasaClearedDate || '').trim(),
        qsLetterRef: String(partial.qsLetterRef || '').trim(),
        writeOffAuthority: String(partial.writeOffAuthority || '').trim(),
        outcome: ['personal', 'returned', 'training_held', ''].includes(partial.outcome)
            ? (partial.outcome || '')
            : '',
        remarks: String(partial.remarks || '').trim(),
        createdAt: partial.createdAt || plTodayIso(),
        updatedAt: plTodayIso()
    };
}

function plSuggestEligibility(rank, purpose) {
    if (purpose === 'training') return 'training';
    const r = String(rank || '').toLowerCase();
    if (/^(gen|lt gen|maj gen|brig|brig gen|col|lt col)\b/.test(r) || r === 'lt col') {
        return 'lt_col_cmd_staff';
    }
    if (r === 'maj' || /major/.test(r) || /gso2|grade two/.test(r)) {
        return 'gso2_fmn_ahq';
    }
    if (!r) return 'lt_col_cmd_staff';
    return 'ineligible';
}

function plIsTraining(rec) {
    return rec.purpose === 'training' || rec.eligibility === 'training';
}

function plIsEligibleOfficer(rec) {
    return rec.eligibility === 'lt_col_cmd_staff' || rec.eligibility === 'gso2_fmn_ahq';
}

function getPermanentLoanStatus(rec) {
    const issue = plParseIso(rec.issueDate);
    const threeYearIso = rec.issueDate ? plAddYearsIso(rec.issueDate, PL_YEARS) : '';
    const threeYear = plParseIso(threeYearIso);
    const today = plTodayLocal();
    const daysTo3yr = threeYear ? plDaysBetween(today, threeYear) : null;
    const retire = plParseIso(rec.retirementDate);
    const endDate = rec.serving === 'no' && retire ? retire : today;
    const yearsHeldDays = issue ? plDaysBetween(issue, endDate) : null;
    const heldYears = yearsHeldDays != null ? yearsHeldDays / 365.25 : null;
    const underThreeYears = heldYears != null && heldYears < PL_YEARS;
    const training = plIsTraining(rec);

    if (rec.outcome === 'personal' || rec.steps?.write_off?.done) {
        return {
            key: 'personal',
            label: 'Personal item (struck off)',
            className: 'pl-status-personal',
            daysTo3yr,
            threeYearIso,
            active: false
        };
    }
    if (rec.outcome === 'returned') {
        return {
            key: 'returned',
            label: 'Returned to stores',
            className: 'pl-status-returned',
            daysTo3yr,
            threeYearIso,
            active: false
        };
    }
    if (training || rec.outcome === 'training_held') {
        return {
            key: 'training',
            label: 'Training — retained by institution',
            className: 'pl-status-training',
            daysTo3yr,
            threeYearIso,
            active: true
        };
    }
    if (rec.eligibility === 'ineligible') {
        return {
            key: 'ineligible',
            label: 'Not eligible (Comd/34)',
            className: 'pl-status-ineligible',
            daysTo3yr,
            threeYearIso,
            active: false
        };
    }

    const separating = rec.serving === 'no' || (retire && retire <= today);
    if (separating && underThreeYears) {
        return {
            key: 'retire_return',
            label: 'Return on retirement (< 3 yrs)',
            className: 'pl-status-return',
            daysTo3yr,
            threeYearIso,
            active: true
        };
    }

    if (rec.steps?.mid_wipe?.done && !rec.steps?.write_off?.done) {
        return {
            key: 'wiped',
            label: 'Wiped — awaiting write-off',
            className: 'pl-status-qs',
            daysTo3yr,
            threeYearIso,
            active: true
        };
    }
    if ((rec.steps?.qs_letter?.done || rec.masasaClearedDate) && !rec.steps?.write_off?.done) {
        return {
            key: 'qs_letter',
            label: 'QS Br / Masasa in progress',
            className: 'pl-status-qs',
            daysTo3yr,
            threeYearIso,
            active: true
        };
    }

    if (daysTo3yr != null && daysTo3yr <= 0) {
        return {
            key: 'due_3yr',
            label: '3 years complete — initiate strike-off',
            className: 'pl-status-due',
            daysTo3yr,
            threeYearIso,
            active: true
        };
    }
    if (daysTo3yr != null && daysTo3yr <= PL_WARN_DAYS) {
        return {
            key: 'approaching_3yr',
            label: `3-year due in ${daysTo3yr}d`,
            className: 'pl-status-soon',
            daysTo3yr,
            threeYearIso,
            active: true
        };
    }
    return {
        key: 'serving',
        label: 'On permanent loan (serving)',
        className: 'pl-status-serving',
        daysTo3yr,
        threeYearIso,
        active: true
    };
}

function collectPermanentLoanRows() {
    return ensurePermanentLoans().map((raw) => {
        const rec = createPermanentLoanRecord(raw);
        rec.status = getPermanentLoanStatus(rec);
        return rec;
    });
}

function getPermanentLoansSummary(rows) {
    const list = rows || collectPermanentLoanRows();
    const summary = {
        total: list.length,
        serving: 0,
        due3yr: 0,
        retireReturn: 0,
        personal: 0,
        training: 0
    };
    list.forEach((rec) => {
        const key = rec.status?.key;
        if (key === 'personal') summary.personal += 1;
        else if (key === 'training') summary.training += 1;
        else if (key === 'retire_return') summary.retireReturn += 1;
        else if (key === 'due_3yr' || key === 'approaching_3yr' || key === 'qs_letter' || key === 'wiped') {
            summary.due3yr += 1;
        } else if (rec.status?.active) summary.serving += 1;
    });
    return summary;
}

function getPermanentLoanAlerts() {
    const alerts = [];
    collectPermanentLoanRows().forEach((rec) => {
        const who = rec.issuedTo || 'Unknown';
        const label = rec.zaNumber
            ? `${rec.zaNumber}${rec.item ? ` (${rec.item})` : ''}`
            : (rec.item || 'Laptop / iPad');
        const st = rec.status;

        if (st?.key === 'retire_return') {
            alerts.push({
                type: 'danger',
                target: 'permanent-loans',
                loanId: rec.id,
                text: `Permanent loan return: ${label} issued to ${who} — retiring within 3 years of issue (Comd/34 para 2d). Recover the gadget.`,
                receivedDate: rec.issueDate || '',
                dueDate: rec.retirementDate || '',
                department: 'IT DIR TECHSTORES OFFICE',
                priority: 'critical',
                redFlag: true
            });
        } else if (st?.key === 'due_3yr') {
            alerts.push({
                type: 'warning',
                target: 'permanent-loans',
                loanId: rec.id,
                text: `3-year permanent loan complete: ${label} to ${who} — liaise with IT Dir for QS Br / Masasa ZA-NO scratch-off (AS(PLANS)/34).`,
                receivedDate: rec.issueDate || '',
                dueDate: st.threeYearIso || '',
                department: 'IT DIR TECHSTORES OFFICE',
                priority: 'high'
            });
        } else if (st?.key === 'approaching_3yr') {
            alerts.push({
                type: 'warning',
                target: 'permanent-loans',
                loanId: rec.id,
                text: `Permanent loan 3-year due soon: ${label} to ${who} (${st.label}).`,
                receivedDate: rec.issueDate || '',
                dueDate: st.threeYearIso || '',
                department: 'IT DIR TECHSTORES OFFICE',
                priority: 'high'
            });
        } else if (st?.key === 'qs_letter' || st?.key === 'wiped') {
            alerts.push({
                type: 'warning',
                target: 'permanent-loans',
                loanId: rec.id,
                text: `Permanent loan strike-off in progress: ${label} to ${who} — ${st.label}.`,
                receivedDate: rec.issueDate || '',
                dueDate: rec.masasaClearedDate || st.threeYearIso || '',
                department: 'IT DIR TECHSTORES OFFICE',
                priority: 'high'
            });
        }
        if (rec.engraved === 'no' && st?.active && !plIsTraining(rec) && rec.eligibility !== 'ineligible') {
            alerts.push({
                type: 'warning',
                target: 'permanent-loans',
                loanId: rec.id,
                text: `ZA-NO not engraved: ${label} to ${who} — complete paperwork to engrave before / with issue (QM IT DIR step 1).`,
                receivedDate: rec.issueDate || '',
                department: 'IT DIR TECHSTORES OFFICE',
                priority: 'high'
            });
        }
    });
    return alerts;
}

function validatePermanentLoanRecord(rec) {
    if (!rec.issuedTo) return 'Enter the officer issued the gadget (rank and name).';
    if (!rec.item && !rec.zaNumber) return 'Enter the item (laptop / iPad) or ZA number.';
    if (!rec.issueDate) return 'Enter the date of issue — the 3-year clock starts here.';
    if (rec.purpose !== 'training' && rec.eligibility === 'ineligible'
        && (rec.steps?.issue?.done || rec.outcome === 'personal')) {
        return 'Comd/34: only Lt Col and above (command/staff) and Grade Two Staff Officers at Formations / Army HQ may receive a permanent loan. Those not issued have no claim on exit.';
    }
    if (plIsTraining(rec) && rec.outcome === 'personal') {
        return 'Training laptops / iPads stay with the training institution or Training Branch — they are not personal items.';
    }
    const st = getPermanentLoanStatus(rec);
    if (st.key === 'retire_return' && rec.outcome === 'personal') {
        return 'Comd/34 para 2d: retiring within 3 years of issue is not eligible to retain the gadget. Return it to stores.';
    }
    if (rec.steps?.write_off?.done && rec.outcome !== 'returned' && !plIsTraining(rec)) {
        const issue = plParseIso(rec.issueDate);
        const today = plTodayLocal();
        const days = issue ? plDaysBetween(issue, today) : 0;
        if (days < PL_YEARS * 365) {
            return 'Write-off to personal item is only after 3 years from date of issue (AS(PLANS)/34).';
        }
    }
    const za = rec.zaNumber;
    if (za) {
        const clash = ensurePermanentLoans().find((r) =>
            r.id !== rec.id && String(r.zaNumber || '').toUpperCase().replace(/\s+/g, '') === za
        );
        if (clash) {
            return `ZA number ${za} is already on permanent loan to ${clash.issuedTo || 'another officer'}.`;
        }
    }
    return '';
}

function upsertPermanentLoanRecord(partial) {
    const list = ensurePermanentLoans();
    const rec = createPermanentLoanRecord(partial);
    const err = validatePermanentLoanRecord(rec);
    if (err) {
        if (typeof showToast === 'function') showToast(err, 'error');
        return null;
    }
    if (plIsTraining(rec) && !rec.outcome) rec.outcome = 'training_held';
    if (rec.steps.write_off.done && !rec.outcome && !plIsTraining(rec)) rec.outcome = 'personal';
    const idx = list.findIndex((r) => r.id === rec.id);
    if (idx >= 0) list[idx] = { ...list[idx], ...rec, id: list[idx].id, createdAt: list[idx].createdAt };
    else list.unshift(rec);
    if (typeof saveState === 'function') saveState();
    return rec;
}

function deletePermanentLoanRecord(id) {
    appState.permanentLoans = ensurePermanentLoans().filter((r) => r.id !== id);
    if (typeof saveState === 'function') saveState();
}

function plEligibilityLabel(value) {
    return PL_ELIGIBILITY.find((e) => e.value === value)?.label || value || '—';
}

function plCategoryLabel(value) {
    return PL_CATEGORIES.find((c) => c.value === value)?.label || value || '—';
}

function plUnitLabel(unit) {
    if (typeof resolveZnaUnitLabel === 'function') return resolveZnaUnitLabel(unit) || unit || '—';
    return unit || '—';
}

function setPermanentLoansMode(mode) {
    const viewPanel = document.getElementById('plViewPanel');
    const editPanel = document.getElementById('plEditPanel');
    const viewBtn = document.getElementById('plViewModeBtn');
    const editBtn = document.getElementById('plEditModeBtn');
    if (!viewPanel || !editPanel) return;
    const isView = mode !== 'edit';
    viewPanel.hidden = !isView;
    editPanel.hidden = isView;
    viewBtn?.classList.toggle('btn-secondary', isView);
    viewBtn?.classList.toggle('btn-ghost', !isView);
    editBtn?.classList.toggle('btn-secondary', !isView);
    editBtn?.classList.toggle('btn-ghost', isView);
    if (isView) renderPermanentLoansView();
}

function renderPermanentLoansView() {
    const viewBody = document.getElementById('pl-view-body');
    if (!viewBody) return;

    const rows = collectPermanentLoanRows();
    const summary = getPermanentLoansSummary(rows);
    const q = String(document.getElementById('plSearchInput')?.value || '').trim().toLowerCase();
    const filter = document.getElementById('plStatusFilter')?.value || 'active';

    const setStat = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = String(value);
    };
    setStat('plStatServing', summary.serving);
    setStat('plStatDue', summary.due3yr);
    setStat('plStatReturn', summary.retireReturn);
    setStat('plStatPersonal', summary.personal);

    let filtered = rows.filter((rec) => {
        const key = rec.status?.key;
        if (filter === 'active') return rec.status?.active;
        if (filter === 'serving') return key === 'serving';
        if (filter === 'due_3yr') return key === 'due_3yr' || key === 'approaching_3yr' || key === 'qs_letter' || key === 'wiped';
        if (filter === 'retire_return') return key === 'retire_return';
        if (filter === 'personal') return key === 'personal';
        if (filter === 'training') return key === 'training';
        if (filter === 'returned') return key === 'returned';
        return true;
    });

    if (q) {
        filtered = filtered.filter((rec) => {
            const blob = [
                rec.zaNumber, rec.item, rec.description, rec.issuedTo, rec.rank, rec.forceNo,
                rec.unit, rec.appointment, rec.issueDate, rec.status?.label, rec.serialNo, rec.voucherNo
            ].join(' ').toLowerCase();
            return blob.includes(q);
        });
    }

    const rank = {
        retire_return: 0, due_3yr: 1, wiped: 2, qs_letter: 3, approaching_3yr: 4,
        serving: 5, ineligible: 6, training: 7, returned: 8, personal: 9
    };
    filtered.sort((a, b) => {
        const ra = rank[a.status?.key] ?? 9;
        const rb = rank[b.status?.key] ?? 9;
        if (ra !== rb) return ra - rb;
        return String(a.issueDate || '').localeCompare(String(b.issueDate || ''));
    });

    if (!filtered.length) {
        viewBody.innerHTML = `<tr><td colspan="10" class="req-empty-row">${
            rows.length
                ? 'No permanent loans match this filter/search.'
                : 'No permanent loans recorded yet. Switch to Issue / Edit to record a laptop or iPad under Comd/34.'
        }</td></tr>`;
        return;
    }

    viewBody.innerHTML = filtered.map((rec, idx) => {
        const st = rec.status;
        const who = [rec.rank, rec.issuedTo].filter(Boolean).join(' ') || '—';
        const three = st.threeYearIso ? plFormatDate(st.threeYearIso) : '—';
        const daysText = st.daysTo3yr == null
            ? '—'
            : (st.daysTo3yr <= 0 ? 'Due' : `${st.daysTo3yr}d`);
        return `
            <tr class="${st.className}-row" data-pl-id="${plEscape(rec.id)}" title="Open record">
                <td>${idx + 1}</td>
                <td><strong>${plEscape(rec.zaNumber || '—')}</strong></td>
                <td>
                    <strong>${plEscape(rec.item || plCategoryLabel(rec.category))}</strong>
                    ${rec.description ? `<div class="loan-view-desc">${plEscape(rec.description)}</div>` : ''}
                </td>
                <td>${plEscape(who)}${rec.forceNo ? `<div class="loan-view-desc">${plEscape(rec.forceNo)}</div>` : ''}</td>
                <td>${plEscape(plUnitLabel(rec.unit))}</td>
                <td>${plEscape(plFormatDate(rec.issueDate))}</td>
                <td>${plEscape(three)}${st.active && daysText !== '—' ? `<div class="loan-view-desc">${plEscape(daysText)}</div>` : ''}</td>
                <td><span class="loan-status-pill ${st.className}">${plEscape(st.label)}</span></td>
                <td>${plEscape(plEligibilityLabel(rec.eligibility))}</td>
                <td><button type="button" class="btn btn-ghost btn-sm" data-pl-open="${plEscape(rec.id)}">Open</button></td>
            </tr>
        `;
    }).join('');
}

function plFillSelect(el, options, value) {
    if (!el) return;
    el.innerHTML = options.map((o) =>
        `<option value="${plEscape(o.value)}"${o.value === value ? ' selected' : ''}>${plEscape(o.label)}</option>`
    ).join('');
}

function plReadStepsFromForm() {
    const steps = plDefaultSteps();
    PL_STEPS.forEach((s) => {
        const done = document.getElementById(`plStep_${s.key}`)?.checked;
        const date = document.getElementById(`plStepDate_${s.key}`)?.value || '';
        const note = document.getElementById(`plStepNote_${s.key}`)?.value || '';
        steps[s.key] = { done: !!done, date, note };
    });
    return steps;
}

function plWriteStepsToForm(steps) {
    const src = steps || plDefaultSteps();
    PL_STEPS.forEach((s) => {
        const row = src[s.key] || {};
        const cb = document.getElementById(`plStep_${s.key}`);
        const date = document.getElementById(`plStepDate_${s.key}`);
        const note = document.getElementById(`plStepNote_${s.key}`);
        if (cb) cb.checked = !!row.done;
        if (date) date.value = row.date || '';
        if (note) note.value = row.note || '';
    });
}

function readPermanentLoanForm() {
    return createPermanentLoanRecord({
        id: document.getElementById('plRecordId')?.value || '',
        issueDate: document.getElementById('plIssueDate')?.value || '',
        category: document.getElementById('plCategory')?.value || 'laptop',
        item: document.getElementById('plItem')?.value || '',
        description: document.getElementById('plDescription')?.value || '',
        zaNumber: document.getElementById('plZaNumber')?.value || '',
        serialNo: document.getElementById('plSerialNo')?.value || '',
        qty: document.getElementById('plQty')?.value || 1,
        issuedTo: document.getElementById('plIssuedTo')?.value || '',
        rank: document.getElementById('plRank')?.value || '',
        forceNo: document.getElementById('plForceNo')?.value || '',
        appointment: document.getElementById('plAppointment')?.value || '',
        eligibility: document.getElementById('plEligibility')?.value || '',
        unit: document.getElementById('plUnit')?.value || '',
        purpose: document.getElementById('plPurpose')?.value || 'individual',
        engraved: document.getElementById('plEngraved')?.value || 'yes',
        voucherNo: document.getElementById('plVoucherNo')?.value || '',
        issuedBy: document.getElementById('plIssuedBy')?.value || '',
        serving: document.getElementById('plServing')?.value || 'yes',
        retirementDate: document.getElementById('plRetirementDate')?.value || '',
        steps: plReadStepsFromForm(),
        masasaClearedDate: document.getElementById('plMasasaDate')?.value || '',
        qsLetterRef: document.getElementById('plQsLetterRef')?.value || '',
        writeOffAuthority: document.getElementById('plWriteOffAuth')?.value || '',
        outcome: document.getElementById('plOutcome')?.value || '',
        remarks: document.getElementById('plRemarks')?.value || ''
    });
}

function updatePermanentLoanFormHints() {
    const rec = readPermanentLoanForm();
    rec.status = getPermanentLoanStatus(rec);
    const threeEl = document.getElementById('plThreeYearDisplay');
    if (threeEl) {
        threeEl.textContent = rec.status.threeYearIso
            ? `3-year date: ${plFormatDate(rec.status.threeYearIso)} (${rec.status.label})`
            : '3-year date: enter date of issue.';
    }
    const banner = document.getElementById('plEligBanner');
    if (banner) {
        if (rec.eligibility === 'ineligible' && rec.purpose !== 'training') {
            banner.hidden = false;
            banner.className = 'pl-banner pl-banner-danger';
            banner.textContent = 'Comd/34 para 2a and 3: not eligible. Those not issued laptops/iPads have no right to claim a gadget on exit.';
        } else if (plIsTraining(rec)) {
            banner.hidden = false;
            banner.className = 'pl-banner';
            banner.textContent = 'Training issue: the gadget stays with the training institution or Training Branch. It is not converted to a personal item.';
        } else if (rec.status.key === 'retire_return') {
            banner.hidden = false;
            banner.className = 'pl-banner pl-banner-danger';
            banner.textContent = 'Comd/34 para 2d: retiring within 3 years of being loaned the gadget — return it. Not eligible to retain.';
        } else if (rec.status.key === 'due_3yr') {
            banner.hidden = false;
            banner.className = 'pl-banner pl-banner-warn';
            banner.textContent = 'AS(PLANS)/34: 3 years complete. Approach IT Dir to write to QS Br for Masasa to scratch the ZA-NO and strike the item off the Master Ledger. Then MID / IT Dir wipe military data before it is a personal item.';
        } else {
            banner.hidden = true;
        }
    }
    const letterBtn = document.getElementById('plQsLetterBtn');
    if (letterBtn) {
        const ready = rec.status.key === 'due_3yr' || rec.status.key === 'qs_letter'
            || rec.status.key === 'wiped' || rec.steps?.qs_letter?.done
            || (rec.status.daysTo3yr != null && rec.status.daysTo3yr <= 0);
        letterBtn.disabled = !ready;
        letterBtn.title = ready
            ? 'Compose IT Dir letter to QS Br (Masasa scratch-off)'
            : 'Letter to QS Br is raised after 3 years from date of issue (AS(PLANS)/34).';
    }
}

function fillPermanentLoanForm(rec) {
    const r = rec ? createPermanentLoanRecord(rec) : createPermanentLoanRecord({});
    const set = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val ?? '';
    };
    set('plRecordId', r.id && rec ? r.id : '');
    set('plIssueDate', r.issueDate);
    set('plCategory', r.category);
    set('plItem', r.item);
    set('plDescription', r.description);
    set('plZaNumber', r.zaNumber);
    set('plSerialNo', r.serialNo);
    set('plQty', String(r.qty || 1));
    set('plIssuedTo', r.issuedTo);
    set('plRank', r.rank);
    set('plForceNo', r.forceNo);
    set('plAppointment', r.appointment);
    set('plEligibility', r.eligibility);
    set('plUnit', r.unit);
    set('plPurpose', r.purpose);
    set('plEngraved', r.engraved);
    set('plVoucherNo', r.voucherNo);
    set('plIssuedBy', r.issuedBy);
    set('plServing', r.serving);
    set('plRetirementDate', r.retirementDate);
    set('plMasasaDate', r.masasaClearedDate);
    set('plQsLetterRef', r.qsLetterRef);
    set('plWriteOffAuth', r.writeOffAuthority);
    set('plOutcome', r.outcome);
    set('plRemarks', r.remarks);
    plWriteStepsToForm(r.steps);
    const unitSelect = document.getElementById('plUnit');
    if (unitSelect && typeof fillZnaUnitSelect === 'function') {
        fillZnaUnitSelect(unitSelect, r.unit || '', { includeBlank: true, includeOther: true });
    }
    const title = document.getElementById('plFormTitle');
    if (title) title.textContent = rec?.id ? 'Edit permanent loan' : 'Issue laptop / iPad on permanent loan';
    updatePermanentLoanFormHints();
}

function clearPermanentLoanForm() {
    fillPermanentLoanForm(null);
    const title = document.getElementById('plFormTitle');
    if (title) title.textContent = 'Issue laptop / iPad on permanent loan';
}

function openPermanentLoanRecord(id) {
    const rec = ensurePermanentLoans().find((r) => r.id === id);
    if (!rec) {
        if (typeof showToast === 'function') showToast('Permanent loan record not found.', 'error');
        return;
    }
    fillPermanentLoanForm(rec);
    setPermanentLoansMode('edit');
    document.getElementById('plEditPanel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function savePermanentLoanFromForm() {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;
    const rec = upsertPermanentLoanRecord(readPermanentLoanForm());
    if (!rec) return;
    if (typeof showToast === 'function') {
        showToast(`Permanent loan saved: ${rec.zaNumber || rec.item || rec.issuedTo}.`, 'success');
    }
    clearPermanentLoanForm();
    setPermanentLoansMode('view');
    renderPermanentLoansView();
    if (typeof updateSystemAlerts === 'function') updateSystemAlerts();
}

function buildPermanentLoanQsLetterBody(rec) {
    const who = [rec.rank, rec.issuedTo].filter(Boolean).join(' ') || 'the officer';
    const za = rec.zaNumber || '(ZA-NO to be inserted)';
    const item = rec.item || plCategoryLabel(rec.category);
    const issued = plFormatDate(rec.issueDate);
    const three = rec.issueDate ? plFormatDate(plAddYearsIso(rec.issueDate, PL_YEARS)) : 'the 3-year date';
    return `1. Reference is made to Army HQ letter Comd/34 dated 06 Nov 15 (policy on the issue of laptops and iPads to individuals on a permanent loan basis) and Army HQ AS(PLANS)/34 on scratch-off of ZNA serial numbers after three (03) years.

2. ${who}${rec.forceNo ? ` (Force No. ${rec.forceNo})` : ''} was issued ${item}${za ? ` ZA-NO ${za}` : ''} on ${issued}. The officer has completed three (03) years from date of issue (${three}).

3. IT Dir therefore requests QS Br to instruct Masasa Base Workshops to scratch off the ZNA serial number from the item and strike the computer equipment off the Master Ledger.

4. Thereafter the individual may retain the gadget as a personal item, subject to MID and IT Dir specialists erasing all information of a military nature (Comd/34 para 2c).

5. Your usual support is greatly appreciated.`;
}

async function openPermanentLoanQsLetter() {
    const rec = readPermanentLoanForm();
    rec.status = getPermanentLoanStatus(rec);
    if (!rec.issuedTo && !rec.zaNumber) {
        if (typeof showToast === 'function') showToast('Save or complete the record before composing the QS Br letter.', 'error');
        return;
    }
    const draft = {
        id: 'perm-loan-qs-masasa',
        memoType: 'correspondence',
        priority: 'normal',
        fileRef: 'IT/34',
        location: 'Army HQ Camp',
        subject: `REQUEST TO STRIKE OFF ZA NUMBER — ${rec.zaNumber || 'PERMANENT LOAN LAPTOP / IPAD'}`,
        body: buildPermanentLoanQsLetterBody(rec),
        signName: rec.issuedBy || 'for Dir',
        signRank: '',
        signAppt: 'IT Dir'
    };
    if (typeof navigateToModule === 'function') {
        await navigateToModule('it-dir-comms');
    }
    if (typeof initItDirCommsModule === 'function') initItDirCommsModule();
    if (typeof setIdcTab === 'function') setIdcTab('compose');
    if (typeof applyCorrespondenceSampleToIdc === 'function') {
        applyCorrespondenceSampleToIdc(draft);
    }
    document.getElementById('idcComposeForm')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function initPermanentLoansModule() {
    const moduleEl = document.getElementById('permanent-loans');
    if (!moduleEl) return;

    if (moduleEl.dataset.plInit !== '1') {
        moduleEl.dataset.plInit = '1';

        plFillSelect(document.getElementById('plRank'), PL_RANKS, '');
        plFillSelect(document.getElementById('plEligibility'), PL_ELIGIBILITY, 'lt_col_cmd_staff');
        plFillSelect(document.getElementById('plCategory'), PL_CATEGORIES, 'laptop');

        const unitSelect = document.getElementById('plUnit');
        if (unitSelect && typeof wireZnaUnitPicker === 'function') {
            wireZnaUnitPicker(unitSelect, null, { includeBlank: true, includeOther: true });
        } else if (unitSelect && typeof fillZnaUnitSelect === 'function') {
            fillZnaUnitSelect(unitSelect, '', { includeBlank: true, includeOther: true });
        }

        document.getElementById('plViewModeBtn')?.addEventListener('click', () => setPermanentLoansMode('view'));
        document.getElementById('plEditModeBtn')?.addEventListener('click', () => {
            setPermanentLoansMode('edit');
        });
        document.getElementById('plSearchBtn')?.addEventListener('click', () => renderPermanentLoansView());
        document.getElementById('plClearBtn')?.addEventListener('click', () => {
            const search = document.getElementById('plSearchInput');
            const filter = document.getElementById('plStatusFilter');
            if (search) search.value = '';
            if (filter) filter.value = 'active';
            renderPermanentLoansView();
        });
        document.getElementById('plSearchInput')?.addEventListener('input', () => renderPermanentLoansView());
        document.getElementById('plStatusFilter')?.addEventListener('change', () => renderPermanentLoansView());

        moduleEl.querySelectorAll('.pl-stat-filter').forEach((btn) => {
            btn.addEventListener('click', () => {
                const filter = btn.getAttribute('data-pl-filter');
                const sel = document.getElementById('plStatusFilter');
                if (sel && filter) sel.value = filter;
                setPermanentLoansMode('view');
                renderPermanentLoansView();
            });
        });

        document.getElementById('plSaveBtn')?.addEventListener('click', () => savePermanentLoanFromForm());
        document.getElementById('plNewBtn')?.addEventListener('click', () => {
            clearPermanentLoanForm();
            setPermanentLoansMode('edit');
        });
        document.getElementById('plQsLetterBtn')?.addEventListener('click', () => openPermanentLoanQsLetter());
        document.getElementById('plDeleteBtn')?.addEventListener('click', () => {
            const id = document.getElementById('plRecordId')?.value;
            if (!id) {
                clearPermanentLoanForm();
                return;
            }
            if (typeof confirmAction === 'function' && !confirmAction('Delete this permanent loan record?')) return;
            deletePermanentLoanRecord(id);
            clearPermanentLoanForm();
            setPermanentLoansMode('view');
            renderPermanentLoansView();
            if (typeof showToast === 'function') showToast('Permanent loan record deleted.', 'success');
        });

        document.getElementById('plViewPanel')?.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-pl-open]');
            const row = e.target.closest('tr[data-pl-id]');
            const id = btn?.getAttribute('data-pl-open') || row?.getAttribute('data-pl-id');
            if (id) openPermanentLoanRecord(id);
        });

        ['plIssueDate', 'plRank', 'plEligibility', 'plPurpose', 'plServing', 'plRetirementDate', 'plEngraved']
            .forEach((id) => {
                document.getElementById(id)?.addEventListener('change', () => {
                    if (id === 'plRank' || id === 'plPurpose') {
                        const rank = document.getElementById('plRank')?.value;
                        const purpose = document.getElementById('plPurpose')?.value;
                        const elig = document.getElementById('plEligibility');
                        if (elig) elig.value = plSuggestEligibility(rank, purpose);
                    }
                    if (id === 'plIssueDate') {
                        const issue = document.getElementById('plIssueDate')?.value;
                        const engraveDate = document.getElementById('plStepDate_engrave');
                        const issueStep = document.getElementById('plStepDate_issue');
                        const engraveCb = document.getElementById('plStep_engrave');
                        const issueCb = document.getElementById('plStep_issue');
                        if (issue && issueStep && !issueStep.value) issueStep.value = issue;
                        if (issue && issueCb) issueCb.checked = true;
                        if (document.getElementById('plEngraved')?.value === 'yes' && engraveCb) {
                            engraveCb.checked = true;
                            if (engraveDate && !engraveDate.value) engraveDate.value = issue;
                        }
                    }
                    updatePermanentLoanFormHints();
                });
            });

        moduleEl.querySelectorAll('[id^="plStep_"]').forEach((cb) => {
            cb.addEventListener('change', () => {
                const key = cb.id.replace('plStep_', '');
                const dateEl = document.getElementById(`plStepDate_${key}`);
                if (cb.checked && dateEl && !dateEl.value) dateEl.value = plTodayIso();
                updatePermanentLoanFormHints();
            });
        });
    }

    setPermanentLoansMode('view');
    renderPermanentLoansView();
}
