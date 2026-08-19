/* correspondence-samples.js — official IT Dir letter templates */

const IT_DIR_CORRESPONDENCE_SAMPLES = [
    {
        id: 'fuel-standby-generator',
        label: 'Fuel request — standby generator (IT/18)',
        fileRef: 'IT/18',
        fileTitle: 'FUEL OIL AND LUBRICANTS POLICY ORDERS AND DIRECTIVES AND INSTRUCTIONS',
        memoType: 'correspondence',
        priority: 'normal',
        subject: 'REQUEST FOR FUEL FOR STANDBY GENERATOR',
        location: 'Army HQ Camp',
        litres: 40,
        fuelType: 'diesel',
        generatorSerial: 'W9246A/001',
        lastRefueled: 'May',
        signName: 'DK Mashiri',
        signRank: 'Capt',
        signAppt: 'for Dir',
        body: `1. The Directorate is kindly requesting for forty (40) litres of diesel for refueling of IT Dir Standby Generator Serial number W9246A/001. The Generator was last refueled in May and the fuel is now low.

2. Your usual support is greatly appreciated.`
    }
];

function getCorrespondenceSample(id) {
    return IT_DIR_CORRESPONDENCE_SAMPLES.find((s) => s.id === id) || null;
}

function formatCorrespondenceLetterDate(value) {
    if (!value) return '';
    const d = new Date(`${value}T00:00:00`);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function corrSampleEscape(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function buildCorrespondenceLetterHtml(sample, options = {}) {
    const esc = corrSampleEscape;
    const dateIso = options.date || (typeof todayIsoLocal === 'function' ? todayIsoLocal() : '');
    const dateDisplay = formatCorrespondenceLetterDate(dateIso);
    const ref = sample.fileRef || 'IT/18';
    const location = sample.location || 'Army HQ Camp';
    const subject = sample.subject || '';
    const body = String(sample.body || '').trim();
    const paragraphs = body.split(/\n\s*\n/).filter(Boolean);

    return `
    <div class="corr-official-doc">
        <div class="corr-official-mark">RESTRICTED</div>
        <div class="corr-official-top">
            <div class="corr-official-ref-block">
                <div class="corr-official-ref">${esc(ref)}</div>
                <div class="corr-official-location">${esc(location)}</div>
            </div>
            <div class="corr-official-address">
                Information Technology Directorate<br>
                Josiah Magama Tongogara Barracks<br>
                P Bag 7720<br>
                Causeway<br>
                <br>
                Harare: 2708518<br>
                <br>
                ${esc(dateDisplay)}
            </div>
        </div>
        <h1 class="corr-official-subject">${esc(subject)}</h1>
        <div class="corr-official-body">
            ${paragraphs.map((p) => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join('')}
        </div>
        <div class="corr-official-sign">
            <div class="corr-official-sign-line">&nbsp;</div>
            <div>${esc(sample.signName || '')}</div>
            <div>${esc(sample.signRank || '')}</div>
            <div>${esc(sample.signAppt || '')}</div>
        </div>
        <div class="corr-official-mark corr-official-mark-bottom">RESTRICTED</div>
    </div>`;
}

function ensureCorrespondencePrintHost() {
    let host = document.getElementById('correspondence-print-host');
    if (!host) {
        host = document.createElement('div');
        host.id = 'correspondence-print-host';
        host.className = 'corr-print-host';
        document.body.appendChild(host);
    }
    return host;
}

function printCorrespondenceSample(sampleId, options = {}) {
    const sample = getCorrespondenceSample(sampleId);
    if (!sample) {
        if (typeof showToast === 'function') showToast('Correspondence sample not found.', 'error');
        return;
    }
    const run = () => {
        const host = ensureCorrespondencePrintHost();
        host.innerHTML = buildCorrespondenceLetterHtml(sample, options);
        host.classList.add('print-target');
        document.body.classList.add('is-printing', 'printing-correspondence');
    };
    if (typeof runOfficialPrint === 'function') {
        runOfficialPrint(run);
        return;
    }
    run();
    window.print();
}

function applyCorrespondenceSampleToIdc(sampleId) {
    const sample = getCorrespondenceSample(sampleId);
    if (!sample) return false;

    const memoType = document.getElementById('idcMemoType');
    const priority = document.getElementById('idcPriority');
    const subject = document.getElementById('idcSubject');
    const body = document.getElementById('idcBody');
    const msgDate = document.getElementById('idcMsgDate');

    if (memoType) memoType.value = sample.memoType || 'correspondence';
    if (priority) priority.value = sample.priority || 'normal';
    if (subject) {
        subject.value = sample.fileRef
            ? `${sample.fileRef} — ${sample.subject}`
            : sample.subject;
    }
    if (body) {
        body.value = `RESTRICTED

${sample.fileRef || ''} · ${sample.location || 'Army HQ Camp'}

${sample.subject}

${sample.body}

${sample.signName || ''}
${sample.signRank || ''}
${sample.signAppt || ''}

RESTRICTED`;
        body.focus();
        body.setSelectionRange(0, 0);
    }
    if (msgDate && !msgDate.value && typeof todayIsoLocal === 'function') {
        msgDate.value = todayIsoLocal();
    }

    const printBtn = document.getElementById('idcPrintLetterBtn');
    if (printBtn) {
        printBtn.hidden = false;
        printBtn.dataset.corrSample = sampleId;
    }
    return true;
}

function populateCorrespondenceSampleSelect(selectEl) {
    if (!selectEl) return;
    const current = selectEl.value;
    selectEl.innerHTML = [
        '<option value="">Load sample correspondence…</option>',
        ...IT_DIR_CORRESPONDENCE_SAMPLES.map((s) =>
            `<option value="${corrSampleEscape(s.id)}">${corrSampleEscape(s.label)}</option>`)
    ].join('');
    if (current) selectEl.value = current;
}

async function openCorrespondenceSampleInComms(sampleId) {
    if (typeof navigateToModule === 'function') {
        await navigateToModule('it-dir-comms');
    }
    if (typeof initItDirCommsModule === 'function') initItDirCommsModule();
    if (typeof setIdcTab === 'function') setIdcTab('compose');
    const selectEl = document.getElementById('idcSampleSelect');
    if (selectEl) {
        if (typeof populateCorrespondenceSampleSelect === 'function') {
            populateCorrespondenceSampleSelect(selectEl);
        }
        selectEl.value = sampleId || '';
    }
    if (sampleId && typeof applyCorrespondenceSampleToIdc === 'function') {
        applyCorrespondenceSampleToIdc(sampleId);
    }
    document.getElementById('idcComposeForm')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
