/* ai-assistant.js — AI status, spec document upload, stores Q&A, requisition drafts */

let aiAssistantState = {
    status: null,
    open: false,
    busy: false
};

function aiApiBase() {
    return typeof API_BASE === 'string' ? API_BASE : '';
}

async function fetchAiStatus(force = false) {
    if (!force && aiAssistantState.status) return aiAssistantState.status;
    try {
        const res = await fetch(`${aiApiBase()}/api/ai/status`);
        const data = await res.json();
        aiAssistantState.status = data;
        updateAiStatusUi(data);
        return data;
    } catch (_) {
        const fallback = { ok: true, aiEnabled: false, hint: 'Server offline — AI features unavailable.' };
        aiAssistantState.status = fallback;
        updateAiStatusUi(fallback);
        return fallback;
    }
}

function updateAiStatusUi(status) {
    const chip = document.getElementById('aiStatusChip');
    if (!chip) return;
    if (status?.aiEnabled) {
        chip.textContent = 'AI: On';
        chip.className = 'context-chip ai-status-chip is-on';
        chip.title = `OpenAI enabled (${status.model || 'model'}) — spec documents, assistant, drafts`;
    } else {
        chip.textContent = 'AI: Off';
        chip.className = 'context-chip ai-status-chip is-off';
        chip.title = status?.hint || 'Set OPENAI_API_KEY on server for full AI';
    }
}

function buildStoresAssistantContext() {
    const parseMoney = (id) => {
        const el = document.getElementById(id);
        if (!el) return 0;
        const n = parseFloat(String(el.textContent || '').replace(/[^0-9.-]/g, ''));
        return Number.isFinite(n) ? n : 0;
    };
    const inv = typeof appState !== 'undefined' ? appState?.storesInventory : null;
    const txns = inv?.transactions || [];
    const lines = [];
    if (typeof buildProductStockRows === 'function') {
        try {
            const { rows } = buildProductStockRows();
            (rows || []).slice(0, 8).forEach((r) => {
                if (r.onHand > 0) lines.push(`${r.itemName}: ${r.onHand} on hand`);
            });
        } catch (_) { /* optional */ }
    }
    return {
        target: parseMoney('glSumTarget'),
        committed: parseMoney('glSumCommitted'),
        vouchers: parseMoney('glSumVouchers'),
        buyingPower: parseMoney('glSumBalance'),
        inventorySummary: {
            ictLines: txns.filter((t) => String(t.itemId || '').includes('ict-equipment')).length,
            totalTransactions: txns.length,
            lines
        },
        user: appState?.currentUser?.username || '',
        role: appState?.currentUser?.role || ''
    };
}

async function askStoresAssistant(question) {
    const q = String(question || '').trim();
    if (q.length < 3) throw new Error('Enter a question.');
    const res = await fetch(`${aiApiBase()}/api/ai/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, context: buildStoresAssistantContext() })
    });
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error || 'Assistant unavailable');
    return data;
}

async function parseSpecDocumentUpload({ text = '', file = null, categoryHint = '', productHint = '' } = {}) {
    let body = { text, categoryHint, productHint };
    if (file) {
        const b64 = await fileToBase64(file);
        body = {
            ...body,
            imageBase64: b64,
            mimeType: file.type || 'image/jpeg',
            productHint: productHint || file.name.replace(/\.[^.]+$/, '')
        };
    }
    if (!body.text && !body.imageBase64) {
        throw new Error('Upload a photo or paste spec text.');
    }
    const res = await fetch(`${aiApiBase()}/api/ai/spec-document`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error || 'Could not parse document');
    return data;
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = String(reader.result || '');
            const idx = result.indexOf(',');
            resolve(idx >= 0 ? result.slice(idx + 1) : result);
        };
        reader.onerror = () => reject(new Error('Could not read file'));
        reader.readAsDataURL(file);
    });
}

async function draftRequisitionJustification(params) {
    const res = await fetch(`${aiApiBase()}/api/ai/draft-justification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
    });
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error || 'Draft failed');
    return data;
}

function ensureAiAssistantModal() {
    let modal = document.getElementById('aiAssistantModal');
    if (modal) return modal;

    modal = document.createElement('div');
    modal.id = 'aiAssistantModal';
    modal.className = 'ai-assistant-modal';
    modal.hidden = true;
    modal.innerHTML = `
        <div class="ai-assistant-backdrop" data-ai-close></div>
        <div class="ai-assistant-panel" role="dialog" aria-labelledby="aiAssistantTitle">
            <header class="ai-assistant-head">
                <div>
                    <h2 id="aiAssistantTitle">Tech Stores AI Assistant</h2>
                    <p class="ai-assistant-sub" id="aiAssistantSub">Read-only help for GL balances and inventory</p>
                </div>
                <button type="button" class="btn btn-ghost btn-sm" data-ai-close aria-label="Close">✕</button>
            </header>
            <div class="ai-assistant-body">
                <div class="ai-assistant-messages" id="aiAssistantMessages" aria-live="polite"></div>
                <form id="aiAssistantForm" class="ai-assistant-form">
                    <input type="text" class="form-control" id="aiAssistantInput"
                        placeholder="e.g. What is our buying power? Which servers are in stock?"
                        autocomplete="off">
                    <button type="submit" class="btn btn-primary" id="aiAssistantSendBtn">Ask</button>
                </form>
                <p class="ai-assistant-foot muted" id="aiAssistantFoot">
                    Answers use dashboard figures only. AI does not change ledger or stock.
                </p>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    modal.querySelectorAll('[data-ai-close]').forEach((el) => {
        el.addEventListener('click', closeAiAssistant);
    });
    modal.querySelector('#aiAssistantForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        await submitAiAssistantQuestion();
    });
    return modal;
}

function appendAiMessage(text, role = 'assistant') {
    const box = document.getElementById('aiAssistantMessages');
    if (!box) return;
    const div = document.createElement('div');
    div.className = `ai-msg ai-msg-${role}`;
    div.textContent = text;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
}

async function submitAiAssistantQuestion() {
    const input = document.getElementById('aiAssistantInput');
    const btn = document.getElementById('aiAssistantSendBtn');
    const q = input?.value?.trim();
    if (!q) return;
    appendAiMessage(q, 'user');
    if (input) input.value = '';
    if (btn) { btn.disabled = true; btn.textContent = 'Thinking…'; }
    try {
        const data = await askStoresAssistant(q);
        appendAiMessage(
            data.answer + (data.ai ? '' : ' (rule-based)'),
            'assistant'
        );
    } catch (err) {
        appendAiMessage(err.message || 'Assistant error', 'error');
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'Ask'; }
    }
}

function openAiAssistant() {
    if (typeof canSeeStoresOpsDashboard === 'function' && !canSeeStoresOpsDashboard()) {
        if (typeof showToast === 'function') showToast('AI assistant is for stores oversight roles.', 'info');
        return;
    }
    const modal = ensureAiAssistantModal();
    modal.hidden = false;
    document.body.classList.add('ai-assistant-open');
    fetchAiStatus();
    document.getElementById('aiAssistantInput')?.focus();
}

function closeAiAssistant() {
    const modal = document.getElementById('aiAssistantModal');
    if (modal) modal.hidden = true;
    document.body.classList.remove('ai-assistant-open');
}

async function handleSpecDocumentUpload(file) {
    if (!file) return;
    const status = document.getElementById('specDocUploadStatus');
    const setStatus = (msg, kind = '') => {
        if (status) {
            status.textContent = msg;
            status.className = `spec-doc-upload-status${kind ? ` is-${kind}` : ''}`;
        }
    };
    setStatus('Parsing document…');
    try {
        const category = document.getElementById('specEvalCategory')?.value || '';
        const productHint = document.getElementById('specEvalItemName')?.value?.trim() || '';
        const data = await parseSpecDocumentUpload({ file, categoryHint: category, productHint });
        if (typeof applySpecDocumentToForm === 'function') {
            applySpecDocumentToForm(data);
        }
        setStatus(
            data.ai ? 'Spec sheet loaded (AI) — review all fields before sign-off.' : 'Spec sheet loaded — review fields.',
            'ok'
        );
        if (typeof showToast === 'function') {
            showToast('Spec document parsed — review before procurement.', 'success');
        }
    } catch (err) {
        setStatus(err.message || 'Parse failed', 'error');
        if (typeof showToast === 'function') showToast(err.message || 'Parse failed', 'error');
    }
}

async function handleSpecDocumentPaste() {
    const ta = document.getElementById('specDocPasteText');
    const text = ta?.value?.trim();
    if (!text) {
        if (typeof showToast === 'function') showToast('Paste spec text first.', 'error');
        return;
    }
    const status = document.getElementById('specDocUploadStatus');
    if (status) status.textContent = 'Parsing text…';
    try {
        const category = document.getElementById('specEvalCategory')?.value || '';
        const productHint = document.getElementById('specEvalItemName')?.value?.trim() || '';
        const data = await parseSpecDocumentUpload({ text, categoryHint: category, productHint });
        if (typeof applySpecDocumentToForm === 'function') applySpecDocumentToForm(data);
        if (status) status.textContent = 'Text parsed — review all fields.';
        if (typeof showToast === 'function') showToast('Spec text applied.', 'success');
    } catch (err) {
        if (status) status.textContent = err.message || 'Failed';
        if (typeof showToast === 'function') showToast(err.message || 'Failed', 'error');
    }
}

async function handleReqDraftJustification() {
    if (typeof requireEditAccess === 'function' && !requireEditAccess()) return;
    const btn = document.getElementById('reqDraftJustificationBtn');
    if (btn) { btn.disabled = true; btn.textContent = 'Drafting…'; }
    try {
        const data = await draftRequisitionJustification({
            subject: document.getElementById('reqSubject')?.value?.trim(),
            item: document.getElementById('reqItem')?.value?.trim(),
            unit: document.getElementById('reqUnit')?.value?.trim(),
            qty: document.getElementById('reqQty')?.value || '1',
            category: document.getElementById('reqCategory')?.selectedOptions?.[0]?.text || '',
            hints: document.getElementById('reqNotes')?.value?.trim()
        });
        const ta = document.getElementById('reqJustification');
        if (ta && data.justification) {
            ta.value = data.justification;
            ta.focus();
        }
        if (typeof showToast === 'function') {
            showToast(data.ai ? 'AI draft applied — edit as needed.' : 'Template draft applied.', 'success');
        }
    } catch (err) {
        if (typeof showToast === 'function') showToast(err.message || 'Draft failed', 'error');
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'Draft with AI'; }
    }
}

function initAiAssistant() {
    document.getElementById('openAiAssistantBtn')?.addEventListener('click', openAiAssistant);
    document.getElementById('specDocUploadInput')?.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (file) handleSpecDocumentUpload(file);
        e.target.value = '';
    });
    document.getElementById('specDocPasteBtn')?.addEventListener('click', handleSpecDocumentPaste);
    document.getElementById('reqDraftJustificationBtn')?.addEventListener('click', handleReqDraftJustification);

    fetchAiStatus();
}

window.fetchAiStatus = fetchAiStatus;
window.openAiAssistant = openAiAssistant;
window.parseSpecDocumentUpload = parseSpecDocumentUpload;
window.draftRequisitionJustification = draftRequisitionJustification;
window.initAiAssistant = initAiAssistant;
