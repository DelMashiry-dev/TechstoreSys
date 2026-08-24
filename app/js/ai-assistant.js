/* ai-assistant.js — AI status, spec document upload, stores Q&A, requisition drafts */

let aiAssistantState = {
    status: null,
    open: false,
    busy: false
};

const AI_ASSISTANT_UI_VERSION = '5';

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
        chip.title = `OpenAI enabled (${status.model || 'model'}) — click to open assistant`;
    } else {
        chip.textContent = 'AI: Off';
        chip.className = 'context-chip ai-status-chip is-off';
        chip.title = `${status?.hint || 'Set OPENAI_API_KEY on server for full AI'} — click to open assistant`;
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
    const stockByType = { laptop: 0, desktop: 0, printer: 0, server: 0, tablet: 0 };
    const linesByType = { laptopLines: [], desktopLines: [], printerLines: [], serverLines: [], tabletLines: [] };
    const lines = [];
    if (typeof buildProductStockRows === 'function') {
        try {
            const { rows } = buildProductStockRows({ showZero: false });
            (rows || []).forEach((r) => {
                const oh = r.onHand || 0;
                if (oh <= 0) return;
                const entry = `${r.itemName}: ${oh} on hand`;
                lines.push(entry);
                const tc = r.typeCode || '';
                if (tc === 'Lap') {
                    stockByType.laptop += oh;
                    linesByType.laptopLines.push(entry);
                } else if (tc === 'Desk') {
                    stockByType.desktop += oh;
                    linesByType.desktopLines.push(entry);
                } else if (tc === 'Print') {
                    stockByType.printer += oh;
                    linesByType.printerLines.push(entry);
                } else if (tc === 'Srv') {
                    stockByType.server += oh;
                    linesByType.serverLines.push(entry);
                } else if (tc === 'Tab') {
                    stockByType.tablet += oh;
                    linesByType.tabletLines.push(entry);
                }
            });
        } catch (_) { /* optional */ }
    }

    let temporaryLoans = null;
    if (typeof collectTemporaryLoanRows === 'function' && typeof getTemporaryLoansSummary === 'function') {
        try {
            const loanRows = collectTemporaryLoanRows();
            const summary = getTemporaryLoansSummary(loanRows);
            temporaryLoans = {
                summary,
                active: loanRows
                    .filter((l) => l.status?.active)
                    .slice(0, 8)
                    .map((l) => {
                        const id = l.zaNumber || l.item || 'item';
                        return `${id} → ${l.issuedTo || '—'} (${l.status?.label || 'on loan'})`;
                    })
            };
        } catch (_) { /* optional */ }
    }

    let requisitions = null;
    if (typeof ensureRequisitions === 'function') {
        try {
            const list = ensureRequisitions();
            const recent = list.slice(-5).map((r) =>
                `${r.subject || r.item || 'Req'} (${r.unit || 'unit'}) — ${r.status || 'open'}`
            );
            requisitions = {
                total: list.length,
                pendingAtItDir: typeof getPendingRequisitionsAtItDir === 'function'
                    ? getPendingRequisitionsAtItDir().length : 0,
                pendingAtDp: typeof getPendingRequisitionsAtDp === 'function'
                    ? getPendingRequisitionsAtDp().length : 0,
                recent
            };
        } catch (_) { /* optional */ }
    }

    const alerts = {
        atItDir: requisitions?.pendingAtItDir || 0,
        atDp: requisitions?.pendingAtDp || 0,
        overstayedLoans: temporaryLoans?.summary?.overstayed || 0
    };

    return {
        target: parseMoney('glSumTarget'),
        committed: parseMoney('glSumCommitted'),
        vouchers: parseMoney('glSumVouchers'),
        buyingPower: parseMoney('glSumBalance'),
        stockByType,
        inventorySummary: {
            ictLines: txns.filter((t) => String(t.itemId || '').includes('ict-equipment')).length,
            totalTransactions: txns.length,
            lines: lines.slice(0, 12),
            ...linesByType
        },
        temporaryLoans,
        requisitions,
        alerts,
        user: appState?.currentUser?.username || '',
        role: appState?.currentUser?.role || ''
    };
}

async function askStoresAssistant(question) {
    const q = String(question || '').trim();
    if (q.length < 3) throw new Error('Enter a question.');
    try {
        const res = await fetch(`${aiApiBase()}/api/ai/ask`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question: q, context: buildStoresAssistantContext() })
        });
        const data = await res.json();
        if (!res.ok || !data.ok) throw new Error(data.error || 'Assistant unavailable');
        return data;
    } catch (err) {
        if (typeof offlineAnswer === 'function') {
            const fallback = offlineAnswer(q, buildStoresAssistantContext());
            if (fallback?.ok) return fallback;
        }
        throw err;
    }
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
    if (modal && modal.dataset.uiVersion === AI_ASSISTANT_UI_VERSION) return modal;
    if (modal) modal.remove();

    modal = document.createElement('div');
    modal.id = 'aiAssistantModal';
    modal.dataset.uiVersion = AI_ASSISTANT_UI_VERSION;
    modal.className = 'ai-assistant-modal';
    modal.hidden = true;
    modal.innerHTML = `
        <div class="ai-assistant-backdrop" data-ai-close></div>
        <div class="ai-assistant-panel" role="dialog" aria-labelledby="aiAssistantTitle">
            <header class="ai-assistant-head">
                <div>
                    <h2 id="aiAssistantTitle">Tech Stores AI Assistant</h2>
                    <p class="ai-assistant-sub" id="aiAssistantSub">Type a name, unit, ZA number, or item — or ask about stock, requisitions, loans, procurement</p>
                </div>
                ${typeof winChromeControlsHtml === 'function' ? winChromeControlsHtml('data-ai-close') : '<button type="button" class="btn btn-ghost btn-sm" data-ai-close aria-label="Close">✕</button>'}
            </header>
            <div class="ai-assistant-body">
                <div class="ai-assistant-messages" id="aiAssistantMessages" aria-live="polite"></div>
                <div class="ai-assistant-suggestions" id="aiAssistantSuggestions" aria-label="Suggested questions">
                    <button type="button" class="ai-suggest-chip" data-ai-suggest="List laptops issued this month">Laptops issued</button>
                    <button type="button" class="ai-suggest-chip" data-ai-suggest="Show issue history for August 2026">Issue history</button>
                    <button type="button" class="ai-suggest-chip" data-ai-query="stock-issues">Craft query…</button>
                    <button type="button" class="ai-suggest-chip" data-ai-suggest="How many laptops are in stock?">Laptops in stock</button>
                    <button type="button" class="ai-suggest-chip" data-ai-suggest="Temporary loans status">Loans status</button>
                    <button type="button" class="ai-suggest-chip" data-ai-suggest="What is our buying power?">Buying power</button>
                </div>
                <form id="aiAssistantForm" class="ai-assistant-form">
                    <input type="text" class="form-control" id="aiAssistantInput"
                        placeholder="Name, unit, ZA / item, or ask anything about Tech Stores…"
                        autocomplete="off">
                    <button type="submit" class="btn btn-primary" id="aiAssistantSendBtn">Ask</button>
                </form>
                <p class="ai-assistant-foot muted" id="aiAssistantFoot">
                    Read-only — figures from your dashboard and modules. Ask for <strong>issue history</strong> or <strong>reports by period</strong> to open the query builder.
                    <button type="button" class="btn btn-ghost btn-sm ai-craft-query-btn" id="aiCraftQueryBtn">Craft query</button>
                </p>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    modal.querySelectorAll('[data-ai-close]').forEach((el) => {
        el.addEventListener('click', closeAiAssistant);
    });
    if (typeof bindWinChromeModal === 'function') {
        bindWinChromeModal(modal, { onClose: closeAiAssistant, closeSelector: '[data-ai-close]' });
    }
    modal.querySelector('#aiAssistantForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        await submitAiAssistantQuestion();
    });
    modal.querySelectorAll('[data-ai-suggest]').forEach((btn) => {
        btn.addEventListener('click', async () => {
            const input = modal.querySelector('#aiAssistantInput');
            const q = btn.getAttribute('data-ai-suggest') || '';
            if (input) input.value = q;
            await submitAiAssistantQuestion(q);
        });
    });
    modal.querySelectorAll('[data-ai-query]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const templateId = btn.getAttribute('data-ai-query') || 'stock-movements';
            if (typeof openStoresQueryWizard === 'function') {
                openStoresQueryWizard({ templateId, hints: {} });
            }
        });
    });
    modal.querySelector('#aiCraftQueryBtn')?.addEventListener('click', () => {
        if (typeof openStoresQueryWizard === 'function') openStoresQueryWizard({ templateId: 'stock-movements' });
    });

    modal.querySelector('#aiAssistantMessages')?.addEventListener('click', async (e) => {
        const itemBtn = e.target.closest('.ai-lookup-item');
        if (itemBtn) {
            const item = typeof getStoresLookupItemById === 'function'
                ? getStoresLookupItemById(itemBtn.getAttribute('data-lookup-id'))
                : null;
            if (item?.action) {
                closeAiAssistant();
                await openStoresLookupAction(item.action);
            }
            return;
        }
        const actionBtn = e.target.closest('.ai-lookup-action');
        if (actionBtn) {
            const type = actionBtn.getAttribute('data-action-type');
            if (type === 'query' && typeof openStoresQueryWizard === 'function') {
                openStoresQueryWizard({
                    templateId: 'stock-movements',
                    hints: { partyContains: actionBtn.getAttribute('data-party') || '' }
                });
            } else if (type === 'track') {
                closeAiAssistant();
                await openStoresLookupAction({
                    type: 'track',
                    trackQuery: actionBtn.getAttribute('data-track') || ''
                });
            }
        }
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

function appendAiLookupMessage(result) {
    const box = document.getElementById('aiAssistantMessages');
    if (!box || !result) return;
    if (typeof indexSilLookupResult === 'function') indexSilLookupResult(result);
    const div = document.createElement('div');
    div.className = 'ai-msg ai-msg-assistant ai-msg-lookup';
    div.innerHTML = typeof renderAiLookupResults === 'function'
        ? renderAiLookupResults(result)
        : String(result.summary || '');
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
}

async function submitAiAssistantQuestion(presetQuestion) {
    const input = document.getElementById('aiAssistantInput');
    const btn = document.getElementById('aiAssistantSendBtn');
    const q = String(presetQuestion || input?.value || '').trim();
    if (!q) return;
    appendAiMessage(q, 'user');
    if (input && !presetQuestion) input.value = '';

    if (typeof handleStoresQueryFromAssistant === 'function' && handleStoresQueryFromAssistant(q)) {
        appendAiMessage(
            'Opening the query builder — set your date range, category, and filters, then click Run query.',
            'assistant'
        );
        return;
    }

    if (typeof handleStoresLookupFromAssistant === 'function' && handleStoresLookupFromAssistant(q)) {
        const result = typeof aggregateStoresLookup === 'function' ? aggregateStoresLookup(q) : null;
        if (result) {
            appendAiLookupMessage(result);
            if (!result.totalCount && typeof showToast === 'function') {
                showToast('No matches — try ZA number, full surname, or Craft query for a date range.', 'info');
            }
            return;
        }
    }

    if (btn) { btn.disabled = true; btn.textContent = 'Thinking…'; }
    try {
        const data = await askStoresAssistant(q);
        appendAiMessage(data.answer, 'assistant');
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
    if (modal) {
        modal.hidden = true;
        if (typeof resetWinChromeMaximize === 'function') resetWinChromeMaximize(modal);
    }
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

function handleAiStatusChipClick() {
    openAiAssistant();
    const status = aiAssistantState.status;
    if (status && !status.aiEnabled && typeof showToast === 'function') {
        showToast(
            status.hint || 'Copy .env.example to .env, set OPENAI_API_KEY, and restart the server for full AI.',
            'info'
        );
    }
}

function initAiAssistant() {
    document.getElementById('openAiAssistantBtn')?.addEventListener('click', openAiAssistant);
    document.getElementById('aiStatusChip')?.addEventListener('click', handleAiStatusChipClick);
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
