/* temporary-loans.js — controlled stores temporary loans (ZA-numbered), max 2 weeks */

const LOAN_MAX_DAYS = 14;

function loanEscape(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function loanTodayLocal() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
}

function loanParseIso(value) {
    if (!value) return null;
    const d = new Date(`${value}T00:00:00`);
    if (Number.isNaN(d.getTime())) return null;
    d.setHours(0, 0, 0, 0);
    return d;
}

function loanAddDaysIso(isoDate, days) {
    const d = loanParseIso(isoDate);
    if (!d) return '';
    d.setDate(d.getDate() + days);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function loanFormatDisplayDate(isoDate) {
    if (!isoDate) return '—';
    const d = loanParseIso(isoDate);
    if (!d) return isoDate;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function loanDaysBetween(fromDate, toDate) {
    if (!fromDate || !toDate) return null;
    return Math.round((toDate - fromDate) / (1000 * 60 * 60 * 24));
}

/**
 * Status for a controlled-stores temporary loan.
 * Max authorised period: 14 days from loan date (or Expected Return if set).
 */
function getLoanStatus(loan) {
    const loaned = loanParseIso(loan.loanDate);
    const due = loanParseIso(loan.expectedReturn) || (loan.loanDate ? loanParseIso(loanAddDaysIso(loan.loanDate, LOAN_MAX_DAYS)) : null);
    const returned = loanParseIso(loan.dateReturned);
    const today = loanTodayLocal();

    if (returned) {
        const overdueOnReturn = due && returned > due;
        return {
            key: overdueOnReturn ? 'returned_late' : 'returned',
            label: overdueOnReturn ? 'Returned (late)' : 'Returned',
            className: overdueOnReturn ? 'loan-status-returned-late' : 'loan-status-returned',
            daysOverdue: overdueOnReturn ? loanDaysBetween(due, returned) : 0,
            daysLeft: null,
            daysOnLoan: loaned ? loanDaysBetween(loaned, returned) : null,
            due,
            active: false
        };
    }

    if (!due) {
        return {
            key: 'incomplete',
            label: 'Missing due date',
            className: 'loan-status-incomplete',
            daysOverdue: 0,
            daysLeft: null,
            daysOnLoan: loaned ? loanDaysBetween(loaned, today) : null,
            due: null,
            active: true
        };
    }

    const daysLeft = loanDaysBetween(today, due);
    const daysOnLoan = loaned ? loanDaysBetween(loaned, today) : null;

    if (daysLeft < 0) {
        return {
            key: 'overstayed',
            label: `Overstayed (${Math.abs(daysLeft)}d)`,
            className: 'loan-status-overstayed',
            daysOverdue: Math.abs(daysLeft),
            daysLeft,
            daysOnLoan,
            due,
            active: true
        };
    }
    if (daysLeft <= 3) {
        return {
            key: 'due_soon',
            label: daysLeft === 0 ? 'Due today' : `Due in ${daysLeft}d`,
            className: 'loan-status-due-soon',
            daysOverdue: 0,
            daysLeft,
            daysOnLoan,
            due,
            active: true
        };
    }
    return {
        key: 'on_loan',
        label: 'On loan',
        className: 'loan-status-on-loan',
        daysOverdue: 0,
        daysLeft,
        daysOnLoan,
        due,
        active: true
    };
}

function collectTemporaryLoanRows() {
    const tbody = document.getElementById('loans-table-body');
    if (!tbody) return [];
    return Array.from(tbody.querySelectorAll('tr')).map((tr, index) => {
        const inputs = tr.querySelectorAll('input');
        const unitSelect = tr.querySelector('select.loan-unit, select.zna-unit-select');
        const loanDate = String(inputs[0]?.value || '').trim();
        const zaNumber = String(inputs[1]?.value || '').trim();
        const item = String(inputs[2]?.value || '').trim();
        const description = String(inputs[3]?.value || '').trim();
        const qty = String(inputs[4]?.value || '').trim();
        const uom = String(inputs[5]?.value || '').trim();
        const issuedTo = String(inputs[6]?.value || '').trim();
        const forceNo = String(inputs[7]?.value || '').trim();
        // Unit is a select (ZNA picker); fall back to legacy input index if present
        const unit = String(
            unitSelect?.value
            || inputs[8]?.value
            || ''
        ).trim();
        const expectedReturn = String((unitSelect ? inputs[8] : inputs[9])?.value || '').trim();
        const dateReturned = String((unitSelect ? inputs[9] : inputs[10])?.value || '').trim();
        const issuedBy = String((unitSelect ? inputs[10] : inputs[11])?.value || '').trim();
        const initials = String((unitSelect ? inputs[11] : inputs[12])?.value || '').trim();

        if (!loanDate && !zaNumber && !item && !description && !issuedTo && !forceNo && !unit && !expectedReturn && !dateReturned) {
            return null;
        }

        const loan = {
            rowIndex: index,
            loanDate,
            zaNumber,
            item,
            description,
            qty,
            uom,
            issuedTo,
            forceNo,
            unit,
            expectedReturn: expectedReturn || (loanDate ? loanAddDaysIso(loanDate, LOAN_MAX_DAYS) : ''),
            dateReturned,
            issuedBy,
            initials
        };
        loan.status = getLoanStatus(loan);
        return loan;
    }).filter(Boolean);
}

function getTemporaryLoansSummary(rows) {
    const summary = { total: rows.length, onLoan: 0, dueSoon: 0, overstayed: 0, returned: 0 };
    rows.forEach((loan) => {
        const key = loan.status?.key;
        if (key === 'overstayed') summary.overstayed += 1;
        else if (key === 'due_soon') summary.dueSoon += 1;
        else if (key === 'on_loan' || key === 'incomplete') summary.onLoan += 1;
        else if (key === 'returned' || key === 'returned_late') summary.returned += 1;
    });
    return summary;
}

function getTemporaryLoanAlerts() {
    const alerts = [];
    collectTemporaryLoanRows().forEach((loan) => {
        const status = loan.status;
        if (!status?.active) return;
        const who = loan.issuedTo || 'Unknown';
        const label = loan.zaNumber
            ? `${loan.zaNumber}${loan.item ? ` (${loan.item})` : ''}`
            : (loan.item || 'Controlled item');

        if (status.key === 'overstayed') {
            alerts.push({
                type: 'danger',
                target: 'temporary-loans',
                loanId: loan.id || '',
                text: `Overstayed loan: ${label} issued to ${who} — due ${loan.expectedReturn || 'n/a'} (${status.daysOverdue}d over max ${LOAN_MAX_DAYS}-day period).`,
                receivedDate: loan.dateOut || loan.issuedDate || '',
                dueDate: loan.expectedReturn || '',
                department: 'IT DIR TECHSTORES OFFICE',
                priority: 'critical',
                redFlag: true
            });
        } else if (status.key === 'due_soon') {
            alerts.push({
                type: 'warning',
                target: 'temporary-loans',
                loanId: loan.id || '',
                text: `Loan due soon: ${label} to ${who} (${status.label}).`,
                receivedDate: loan.dateOut || loan.issuedDate || '',
                dueDate: loan.expectedReturn || '',
                department: 'IT DIR TECHSTORES OFFICE',
                priority: 'high'
            });
        }
    });
    return alerts;
}

function setTemporaryLoansMode(mode) {
    const viewPanel = document.getElementById('loanViewPanel');
    const editPanel = document.getElementById('loanEditPanel');
    const viewBtn = document.getElementById('loanViewModeBtn');
    const editBtn = document.getElementById('loanEditModeBtn');
    if (!viewPanel || !editPanel) return;

    const isView = mode !== 'edit';
    viewPanel.hidden = !isView;
    editPanel.hidden = isView;
    viewBtn?.classList.toggle('btn-secondary', isView);
    viewBtn?.classList.toggle('btn-ghost', !isView);
    editBtn?.classList.toggle('btn-secondary', !isView);
    editBtn?.classList.toggle('btn-ghost', isView);

    if (isView) renderTemporaryLoansView();
}

function renderTemporaryLoansView() {
    const viewBody = document.getElementById('loans-view-body');
    if (!viewBody) return;

    const rows = collectTemporaryLoanRows();
    const summary = getTemporaryLoansSummary(rows);
    const q = String(document.getElementById('loanSearchInput')?.value || '').trim().toLowerCase();
    const filter = document.getElementById('loanStatusFilter')?.value || 'active';

    const setStat = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = String(value);
    };
    setStat('loanStatOnLoan', summary.onLoan + summary.dueSoon + summary.overstayed);
    setStat('loanStatDueSoon', summary.dueSoon);
    setStat('loanStatOverstayed', summary.overstayed);
    setStat('loanStatReturned', summary.returned);

    let filtered = rows.filter((loan) => {
        const key = loan.status?.key;
        if (filter === 'active') return loan.status?.active;
        if (filter === 'overstayed') return key === 'overstayed';
        if (filter === 'due_soon') return key === 'due_soon';
        if (filter === 'on_loan') return key === 'on_loan' || key === 'incomplete';
        if (filter === 'returned') return key === 'returned' || key === 'returned_late';
        return true;
    });

    if (q) {
        filtered = filtered.filter((loan) => {
            const blob = [
                loan.zaNumber, loan.item, loan.description, loan.issuedTo, loan.forceNo,
                loan.unit, loan.loanDate, loan.expectedReturn, loan.dateReturned, loan.issuedBy,
                loan.status?.label
            ].join(' ').toLowerCase();
            return blob.includes(q);
        });
    }

    // Overstayed first, then due soon, then on loan, then returned
    const rank = { overstayed: 0, due_soon: 1, incomplete: 2, on_loan: 3, returned_late: 4, returned: 5 };
    filtered.sort((a, b) => {
        const ra = rank[a.status?.key] ?? 9;
        const rb = rank[b.status?.key] ?? 9;
        if (ra !== rb) return ra - rb;
        return String(a.expectedReturn || '').localeCompare(String(b.expectedReturn || ''));
    });

    if (!filtered.length) {
        viewBody.innerHTML = `<tr><td colspan="10" class="req-empty-row">${
            rows.length
                ? 'No loans match this filter/search.'
                : 'No temporary loans recorded yet. Switch to Edit Records to issue a controlled stores item (ZA-numbered).'
        }</td></tr>`;
        return;
    }

    viewBody.innerHTML = filtered.map((loan, idx) => {
        const status = loan.status;
        const daysText = status.active
            ? (status.key === 'overstayed'
                ? `+${status.daysOverdue}d over`
                : (status.daysLeft != null ? `${status.daysLeft}d left` : '—'))
            : (status.daysOnLoan != null ? `${status.daysOnLoan}d held` : '—');
        const borrower = [loan.issuedTo, loan.forceNo].filter(Boolean).join(' / ') || '—';
        return `
            <tr class="${status.className}-row">
                <td>${idx + 1}</td>
                <td><strong>${loanEscape(loan.zaNumber || '—')}</strong></td>
                <td>
                    <strong>${loanEscape(loan.item || '—')}</strong>
                    ${loan.description ? `<div class="loan-view-desc">${loanEscape(loan.description)}</div>` : ''}
                </td>
                <td>${loanEscape(borrower)}</td>
                <td>${loanEscape((typeof resolveZnaUnitLabel === 'function' ? resolveZnaUnitLabel(loan.unit) : loan.unit) || '—')}</td>
                <td>${loanEscape(loanFormatDisplayDate(loan.loanDate))}</td>
                <td>${loanEscape(loanFormatDisplayDate(loan.expectedReturn))}</td>
                <td>${loanEscape(daysText)}</td>
                <td><span class="loan-status-pill ${status.className}">${loanEscape(status.label)}</span></td>
                <td>${loanEscape(loanFormatDisplayDate(loan.dateReturned))}</td>
            </tr>
        `;
    }).join('');
}

function applyLoanDueDateDefault(tr) {
    const dateInput = tr.querySelector('.loan-date');
    const dueInput = tr.querySelector('.loan-expected-return');
    if (!dateInput || !dueInput) return;
    const sync = () => {
        if (!dateInput.value) return;
        if (!dueInput.value || dueInput.dataset.auto === '1') {
            dueInput.value = loanAddDaysIso(dateInput.value, LOAN_MAX_DAYS);
            dueInput.dataset.auto = '1';
        }
    };
    dateInput.addEventListener('change', sync);
    dueInput.addEventListener('change', () => {
        dueInput.dataset.auto = dueInput.value ? '0' : '1';
    });
    if (dateInput.value && !dueInput.value) sync();
}

function attachTemporaryLoanRow(tr) {
    if (!tr || tr.dataset.loanBound === '1') return;
    tr.dataset.loanBound = '1';
    const unitSelect = tr.querySelector('select.loan-unit, select.zna-unit-select');
    if (unitSelect && typeof fillZnaUnitSelect === 'function') {
        fillZnaUnitSelect(unitSelect, unitSelect.value || '', { includeBlank: true, includeOther: true });
        if (!unitSelect.dataset.znaWired) {
            unitSelect.dataset.znaWired = '1';
            unitSelect.addEventListener('change', () => {
                if (unitSelect.value !== '__other__') return;
                const custom = window.prompt('Enter unit / formation / directorate:', '');
                if (custom && custom.trim()) {
                    fillZnaUnitSelect(unitSelect, custom.trim(), { includeBlank: true, includeOther: true });
                } else {
                    unitSelect.value = '';
                }
            });
        }
    }
    applyLoanDueDateDefault(tr);
}

function initTemporaryLoansModule() {
    const moduleEl = document.getElementById('temporary-loans');
    if (!moduleEl || moduleEl.dataset.loanInit === '1') return;
    moduleEl.dataset.loanInit = '1';

    document.getElementById('loanViewModeBtn')?.addEventListener('click', () => setTemporaryLoansMode('view'));
    document.getElementById('loanEditModeBtn')?.addEventListener('click', () => setTemporaryLoansMode('edit'));
    document.getElementById('loanSearchBtn')?.addEventListener('click', () => renderTemporaryLoansView());
    document.getElementById('loanClearBtn')?.addEventListener('click', () => {
        const search = document.getElementById('loanSearchInput');
        const filter = document.getElementById('loanStatusFilter');
        if (search) search.value = '';
        if (filter) filter.value = 'active';
        renderTemporaryLoansView();
    });
    document.getElementById('loanSearchInput')?.addEventListener('input', () => renderTemporaryLoansView());
    document.getElementById('loanStatusFilter')?.addEventListener('change', () => renderTemporaryLoansView());

    moduleEl.querySelectorAll('.loan-stat-filter').forEach((btn) => {
        btn.addEventListener('click', () => {
            const filter = btn.getAttribute('data-loan-filter');
            const sel = document.getElementById('loanStatusFilter');
            if (sel && filter) sel.value = filter;
            setTemporaryLoansMode('view');
            renderTemporaryLoansView();
        });
    });

    document.getElementById('loans-table-body')?.querySelectorAll('tr').forEach(attachTemporaryLoanRow);

    const saveBtn = moduleEl.querySelector('.btn-save-module');
    saveBtn?.addEventListener('click', () => {
        setTimeout(() => {
            if (typeof renderTemporaryLoansView === 'function') renderTemporaryLoansView();
            if (typeof updateSystemAlerts === 'function') updateSystemAlerts();
        }, 50);
    });

    setTemporaryLoansMode('view');
}
