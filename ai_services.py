"""
AI-assisted services for TECHSTORESys — spec documents, stores Q&A, draft text.
Requires OPENAI_API_KEY for full capability; heuristic fallbacks when unset.
"""

from __future__ import annotations

import json
import os
import re
import ssl
import urllib.request
from typing import Any

USER_AGENT = (
    "Mozilla/5.0 (compatible; TechStoresAI/1.0; IT-DIR internal procurement aide)"
)


def _api_key() -> str:
    return os.environ.get("OPENAI_API_KEY", "").strip()


def ai_status() -> dict[str, Any]:
    key = _api_key()
    model = os.environ.get("OPENAI_MODEL", "gpt-4o-mini").strip() or "gpt-4o-mini"
    return {
        "ok": True,
        "aiEnabled": bool(key),
        "model": model if key else None,
        "features": {
            "specDocument": bool(key),
            "specDocumentVision": bool(key),
            "documentImport": True,
            "documentImportVision": bool(key),
            "storesAssistant": True,
            "draftJustification": bool(key),
            "productEnrich": bool(key),
        },
        "hint": (
            "AI fully enabled."
            if key
            else "Set OPENAI_API_KEY on the server for document parsing, vision, and smart drafts."
        ),
    }


def _openai_json(system: str, user: str, *, model: str | None = None, timeout: int = 45) -> dict | None:
    api_key = _api_key()
    if not api_key:
        return None
    model = model or os.environ.get("OPENAI_MODEL", "gpt-4o-mini")
    body = json.dumps({
        "model": model,
        "temperature": 0.15,
        "response_format": {"type": "json_object"},
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user[:12000]},
        ],
    }).encode("utf-8")
    req = urllib.request.Request(
        "https://api.openai.com/v1/chat/completions",
        data=body,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "User-Agent": USER_AGENT,
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout, context=ssl.create_default_context()) as resp:
            payload = json.loads(resp.read().decode("utf-8"))
        content = payload["choices"][0]["message"]["content"]
        return json.loads(content)
    except Exception:
        return None


def _openai_vision_json(
    system: str,
    text_prompt: str,
    image_b64: str,
    mime_type: str = "image/jpeg",
    *,
    timeout: int = 60,
) -> dict | None:
    api_key = _api_key()
    if not api_key or not image_b64:
        return None
    model = os.environ.get("OPENAI_VISION_MODEL", os.environ.get("OPENAI_MODEL", "gpt-4o-mini"))
    data_url = f"data:{mime_type};base64,{image_b64}"
    body = json.dumps({
        "model": model,
        "temperature": 0.1,
        "response_format": {"type": "json_object"},
        "messages": [
            {"role": "system", "content": system},
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": text_prompt[:4000]},
                    {"type": "image_url", "image_url": {"url": data_url, "detail": "high"}},
                ],
            },
        ],
    }).encode("utf-8")
    req = urllib.request.Request(
        "https://api.openai.com/v1/chat/completions",
        data=body,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "User-Agent": USER_AGENT,
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout, context=ssl.create_default_context()) as resp:
            payload = json.loads(resp.read().decode("utf-8"))
        content = payload["choices"][0]["message"]["content"]
        return json.loads(content)
    except Exception:
        return None


SPEC_DOC_SYSTEM = """You extract ICT procurement specification sheets into JSON.
Return keys: productName, brand, model, category (laptop|desktop|tablet|printer|server|network|other),
summary (1-2 sentences), purpose (procurement justification draft),
specs (array of {name, value, note}).
For servers include when present: Operating System, Processor, Memory (RAM), Memory Channels,
Boot Storage, Internal Storage, RAID / Storage Controller, Expansion Slots, Graphics / GPUs,
Network, Power Supply, Form Factor, Remote Management, Warranty.
Use only facts visible in the document. If unknown, omit. Values concise. Notes = brief justification."""


def _normalize_spec_rows(specs: Any) -> list[list[str]]:
    rows: list[list[str]] = []
    if not isinstance(specs, list):
        return rows
    for row in specs:
        if isinstance(row, dict):
            name = str(row.get("name") or "").strip()
            value = str(row.get("value") or "").strip()
            note = str(row.get("note") or "From uploaded spec document").strip()
        elif isinstance(row, (list, tuple)) and len(row) >= 2:
            name = str(row[0] or "").strip()
            value = str(row[1] or "").strip()
            note = str(row[2] if len(row) > 2 else "From uploaded spec document").strip()
        else:
            continue
        if name and value:
            rows.append([name, value, note])
    return rows


def parse_spec_document(
    *,
    text: str = "",
    image_base64: str = "",
    mime_type: str = "image/jpeg",
    category_hint: str = "",
    product_hint: str = "",
) -> dict[str, Any]:
    hint = f"Category hint: {category_hint or 'auto'}. Product hint: {product_hint or 'auto'}."
    parsed: dict | None = None
    ai_used = False

    if image_base64.strip():
        parsed = _openai_vision_json(
            SPEC_DOC_SYSTEM,
            f"Extract all specifications from this spec/evaluation document photo.\n{hint}",
            image_base64.strip(),
            mime_type or "image/jpeg",
        )
        ai_used = bool(parsed)

    if not parsed and text.strip():
        if _api_key():
            parsed = _openai_json(
                SPEC_DOC_SYSTEM,
                f"Extract specifications from this text:\n{hint}\n\n---\n{text[:9000]}",
            )
            ai_used = bool(parsed)
        else:
            from product_specs_lookup import detect_brand, detect_category, extract_specs_from_text

            category = category_hint or detect_category(text, product_hint)
            specs = extract_specs_from_text(text)
            brand = detect_brand(text) or detect_brand(product_hint)
            return {
                "ok": True,
                "ai": False,
                "productName": product_hint or text.split("\n", 1)[0][:120],
                "brand": brand,
                "model": product_hint,
                "category": category,
                "summary": "Heuristic extraction from pasted text (set OPENAI_API_KEY for full parse).",
                "purpose": "",
                "specs": specs,
                "note": "Heuristic only — review all fields before procurement.",
            }

    if not parsed:
        return {
            "ok": False,
            "error": (
                "Could not parse document. Set OPENAI_API_KEY for photo upload, "
                "or paste spec text manually."
            ),
        }

    specs = _normalize_spec_rows(parsed.get("specs"))
    return {
        "ok": True,
        "ai": ai_used,
        "productName": str(parsed.get("productName") or product_hint or "").strip(),
        "brand": str(parsed.get("brand") or "").strip(),
        "model": str(parsed.get("model") or "").strip(),
        "category": str(parsed.get("category") or category_hint or "other").strip(),
        "summary": str(parsed.get("summary") or "").strip()[:600],
        "purpose": str(parsed.get("purpose") or "").strip()[:800],
        "specs": specs,
        "note": "AI-extracted from uploaded document — human review required before procurement.",
    }


def _money(val: Any) -> float:
    try:
        return float(str(val).replace(",", "").replace("$", "").strip() or 0)
    except Exception:
        return 0.0


ICT_TRENDS_2025_2026 = """
ICT equipment trends (general industry guidance — not official ZNA policy):
- Laptops: Copilot+ / AI PCs with NPUs for future Windows AI features; minimum 16 GB RAM and 512 GB NVMe for staff;
  rugged or semi-rugged options for field units; 3-year warranty with next-business-day support where budget allows.
- Desktops: small-form-factor (Mac mini, USFF) for admin desks; tower/workstation only where GPU or expansion slots needed.
- Servers: HPE ProLiant Gen11 / Dell PowerEdge 16G — DDR5, redundant PSU, iLO/iDRAC, 10 GbE baseline; spec for 5-year lifecycle.
- Printers: departmental laser MFPs (secure pull-print, duplex); reduce inkjet except photo/specialist; managed print contracts.
- Networking: Wi-Fi 6E/7 APs for new installs; PoE switches with spare ports; segment IoT/guest VLANs (zero-trust direction).
- Security: BitLocker/device encryption, TPM 2.0, patch cadence; prefer vendors with long driver/firmware support.
- Sustainability: energy-star ratings, toner yield per page, take-back/recycling programmes when comparing quotes.
- Procurement tip: use Spec Evaluation + Cost Comparative Schedule; AIAD due diligence favours value-for-money, not always cheapest.
""".strip()

SYSTEM_MODULE_GUIDE = """
Key TECHSTORESys modules (sidebar):
- Dashboard — GL targets, buying power, alerts, stock overview.
- Unit Requisitions — capture unit needs; Route checks stock → Q 1033 issue or DP F1 procurement.
- Import document — upload or paste a loose minute, requisition, quotation, P/O, DP F1, spec sheet or D-Note; review extracted fields then open the matching form.
- Spec Evaluation — write/search specs; upload spec sheets for procurement files.
- DP F1 / DP Procurement — electronic procurement cycle with AIAD due diligence.
- Issue Voucher (Q 1033) — issue/receipt stock; RV/IV movements.
- Temporary Loans — controlled stores loaned out (max 14 days, ZA-numbered); track due/overstayed.
- ICT Accountability / ICT Distribution — serialised asset tracking and distribution.
- Gate Register — equipment on/off premises at the gate.
- Stock Take — physical count vs system; surplus→Q 1033, deficit→Q 998.
- Orderly Room — DF / first sight of incoming requisitions.
- Process Guides & System Help — in-app learning and glossary.
- Universal Search (Ctrl+K) — find memos, POs, ZA numbers, requisitions across modules.
""".strip()

PROCUREMENT_FLOW = """
ZNA ICT procurement flow (summary):
1. Unit need → Unit Requisition (minute sheet) → GS/authority as applicable.
2. Tech Stores Route: in stock → ZNA Q 1033 issue; not in stock + buying power → DP F1;
   no funds → Manual DAF authority; await replenishment if neither.
3. Spec Evaluation → quotes → Cost Comparative Schedule → AIAD Due Diligence Certificate.
4. DP PO → Delivery Note → verification → RV receipt → issue to unit.
""".strip()

ASSISTANT_SYSTEM_PROMPT = """You are the Tech Stores AI Assistant for IT-DIR Zimbabwe National Army (TECHSTORESys).

Help with anything related to this system: GL money, inventory/stock, requisitions, procurement (DP F1/AIAD),
Q forms, temporary loans, gate register, spec evaluation, modules/navigation, and practical ICT procurement advice.

Rules:
- For money and stock QUANTITIES: use ONLY numbers in the JSON context. Never invent figures.
  If missing, say which module to open (e.g. Temporary Loans, Unit Requisitions) or suggest Load demo figures.
- For process/how-to: use systemKnowledge, moduleGuide, procurementFlow in context.
- For trends/recommendations: use ictTrends; label as general industry guidance, not official ZNA policy.
- Offer concise actionable advice where helpful (e.g. overstayed loan → chase return; low buying power → Release Cut or DAF).
- Suggest relevant module names. Under 220 words unless listing stock lines.
- Read-only: you never change ledger, stock, or records.
Return JSON: {"answer": "..."}"""


def _matches_equipment_query(q: str, keywords: tuple[str, ...]) -> bool:
    if not any(w in q for w in keywords):
        return False
    if any(w in q for w in ("stock", "inventory", "hand", "many", "how many", "count", "available", "in store")):
        return True
    words = re.findall(r"[a-z0-9]+", q)
    return len(words) <= 4


EQUIPMENT_TREND_SNIPPETS = {
    "laptop": "Trend: 16 GB RAM, 512 GB NVMe, 3-year warranty; Copilot+ / AI PCs where budget allows.",
    "desktop": "Trend: USFF/small-form for admin; towers only where expansion or GPU is required.",
    "printer": "Trend: departmental laser MFP with secure pull-print; managed print contracts.",
    "server": "Trend: HPE ProLiant Gen11 / Dell PowerEdge 16G — DDR5, redundant PSU, iLO/iDRAC, 10 GbE; 5-year lifecycle.",
    "tablet": "Trend: rugged or enterprise tablets for field use; MDM-ready with long support life.",
}


def _stock_type_answer(q: str, context: dict[str, Any]) -> str | None:
    stock = context.get("stockByType") or {}
    inv = context.get("inventorySummary") or {}
    type_map = [
        (("laptop", "notebook", "laptops"), "laptop", "laptopLines"),
        (("desktop", "desktops", "pc", "workstation"), "desktop", "desktopLines"),
        (("printer", "printers", "mfp"), "printer", "printerLines"),
        (("server", "servers"), "server", "serverLines"),
        (("tablet", "tablets", "ipad"), "tablet", "tabletLines"),
    ]
    for keywords, key, lines_key in type_map:
        if not _matches_equipment_query(q, keywords):
            continue
        total = int(stock.get(key) or 0)
        typed_lines = inv.get(lines_key) or []
        trend = EQUIPMENT_TREND_SNIPPETS.get(key, "")
        if total > 0:
            detail = ""
            if typed_lines:
                detail = " Detail: " + "; ".join(typed_lines[:6]) + "."
            msg = f"Total {key}s on hand: {total} unit(s).{detail} Open ICT Equipment / Product Stock Register for full ledger."
            if trend and len(q.split()) <= 4:
                msg += f" {trend}"
            return msg
        if typed_lines:
            return f"{key.title()} stock: " + "; ".join(typed_lines[:8]) + "."
        if trend:
            return (
                f"No {key}s currently on hand in the stock register. {trend} "
                f"Use Unit Requisitions or Spec Evaluation to raise a procurement need."
            )
    return None


def _loans_answer(q: str, context: dict[str, Any]) -> str | None:
    if not any(w in q for w in ("loan", "loans", "borrow", "temporary", "overstayed", "due back")):
        return None
    loans = context.get("temporaryLoans") or {}
    summary = loans.get("summary") or {}
    active = loans.get("active") or []
    if summary:
        parts = [
            f"{summary.get('onLoan', 0)} on loan",
            f"{summary.get('overstayed', 0)} overstayed",
            f"{summary.get('dueSoon', 0)} due soon",
            f"{summary.get('returned', 0)} returned",
        ]
        msg = (
            f"Temporary Loans module tracks controlled stores (ZA-numbered, max 14 days). "
            f"Current register: {', '.join(parts)}."
        )
        if active:
            msg += " Active: " + "; ".join(active[:5]) + "."
        if summary.get("overstayed", 0) > 0:
            msg += " Advice: chase overstayed items for return or formal issue via Q 1033."
        msg += " Open sidebar → Temporary Loans."
        return msg
    return (
        "Temporary Loans (sidebar) records controlled stores issued short-term — max 14 days, ZA-numbered. "
        "Track on-loan, due-soon, and overstayed items. Switch to Edit Records to issue; View mode shows status."
    )


def _requisitions_answer(q: str, context: dict[str, Any]) -> str | None:
    if not any(w in q for w in ("requisition", "requisitions", "req", "indent", "unit request")):
        return None
    req = context.get("requisitions") or {}
    total = req.get("total", 0)
    pending = req.get("pendingAtItDir", 0)
    at_dp = req.get("pendingAtDp", 0)
    recent = req.get("recent") or []
    msg = "Unit Requisitions module captures formation needs with minute sheet. Route button checks stock → Q 1033 or DP F1."
    if total:
        msg += f" Register: {total} requisition(s)"
        if pending or at_dp:
            msg += f"; {pending} pending at IT Dir, {at_dp} at DP/AIAD"
        msg += "."
    if recent:
        msg += " Recent: " + "; ".join(recent[:4]) + "."
    if pending:
        msg += " Check Dashboard alerts for items still at IT Directorate."
    return msg


def _module_or_process_answer(q: str) -> str | None:
    module_hints = [
        (("dp f1", "f1 form", "procurement form"), "DP F1 module — starts electronic procurement against GL buying power."),
        (("spec eval", "specification", "spec sheet"), "Spec Evaluation — write specs, upload documents, support AIAD file."),
        (("q 1033", "1033", "issue voucher"), "ZNA Q 1033 / Issue Voucher — issue or receipt stock; satisfies requisitions from stores."),
        (("stock take", "physical count", "variance"), "Stock Take — count shelves vs system; route surplus/deficit to Q forms."),
        (("gate", "premises"), "Gate Register — equipment checked in/out at IT Dir gate."),
        (("release cut", "transfer vote"), "Release Cut (admin) — move buying power between GLs for the month."),
        (("aiad", "due diligence", "comparative"), "Cost Comparative Schedule + AIAD Due Diligence — value-for-money quote review."),
        (("orderly", "daily file", "df"), "Orderly Room — first sight / DF filing of incoming correspondence."),
        (("help", "glossary", "dictionary"), "System Help — full glossary; Process Guides — procurement charts."),
    ]
    for keywords, answer in module_hints:
        if any(w in q for w in keywords):
            return answer + " " + SYSTEM_MODULE_GUIDE.split("\n")[0]
    if any(w in q for w in ("how to procure", "procurement process", "procurement cycle", "how do i buy")):
        return PROCUREMENT_FLOW
    if any(w in q for w in ("what can you", "what do you", "help me", "capabilities")):
        return (
            "I can answer questions about GL/buying power, stock levels, requisitions, temporary loans, "
            "procurement workflow, Q forms, module navigation, and ICT equipment trends/advice. "
            "Ask naturally — e.g. 'how many laptops?', 'loans overdue?', 'route a requisition', 'server trends 2026'."
        )
    return None


def _trends_answer(q: str) -> str | None:
    if not any(w in q for w in (
        "trend", "trends", "recommend", "advice", "should we buy", "best practice",
        "latest", "2025", "2026", "what to procure", "modern", "upgrade path",
    )):
        return None
    return ICT_TRENDS_2025_2026


def heuristic_stores_answer(question: str, context: dict[str, Any]) -> str | None:
    q = (question or "").lower()
    target = _money(context.get("target"))
    committed = _money(context.get("committed"))
    vouchers = _money(context.get("vouchers"))
    buying = _money(context.get("buyingPower"))
    has_gl = any((target, committed, buying))

    if has_gl:
        if any(w in q for w in ("buying power", "left to spend", "available to buy")):
            return (
                f"Buying power is ${buying:,.0f}. "
                f"Equation: Target ${target:,.0f} = Committed ${committed:,.0f} + Vouchers ${vouchers:,.0f} + Buying power."
            )
        if "committed" in q or "utilised" in q or "utilized" in q:
            pct = (committed / target * 100) if target else 0
            return f"Committed funds: ${committed:,.0f} ({pct:.1f}% of target ${target:,.0f})."
        if "voucher" in q:
            return f"Vouchers recorded: ${vouchers:,.0f} (part of the GL balance equation)."
        if ("target" in q and "gl" in q) or q.strip() == "target":
            return f"GL target total: ${target:,.0f} across ICT / stores ledgers."
        if "equation" in q or ("balance" in q and "gl" in q):
            return (
                f"Equation: Target (${target:,.0f}) = Committed (${committed:,.0f}) "
                f"+ Vouchers (${vouchers:,.0f}) + Buying power (${buying:,.0f})."
            )
        if buying <= 0 and any(w in q for w in ("buy", "procure", "f1", "purchase")):
            return (
                f"Buying power is ${buying:,.0f} — electronic DP F1 may be blocked until funds are available. "
                "Options: Release Cut from another GL (admin), seek Manual DAF authority, or await replenishment."
            )

    stock_ans = _stock_type_answer(q, context)
    if stock_ans:
        return stock_ans

    loans_ans = _loans_answer(q, context)
    if loans_ans:
        return loans_ans

    req_ans = _requisitions_answer(q, context)
    if req_ans:
        return req_ans

    module_ans = _module_or_process_answer(q)
    if module_ans:
        return module_ans

    trends_ans = _trends_answer(q)
    if trends_ans:
        return trends_ans

    inv = context.get("inventorySummary") or {}
    if any(w in q for w in ("inventory", "stock", "on hand", "in store")):
        lines = inv.get("lines") or []
        if lines:
            top = "; ".join(lines[:8])
            return f"Inventory highlights: {top}. Open Product Stock Register or ICT ledger for detail."
        total = inv.get("ictLines") or inv.get("totalLines")
        if total is not None:
            return f"Inventory register shows {total} ICT product line(s) with stock movements."

    alerts = context.get("alerts") or {}
    if "alert" in q or "pending" in q or "notification" in q:
        parts = []
        if alerts.get("atItDir"):
            parts.append(f"{alerts['atItDir']} requisition(s) at IT Dir")
        if alerts.get("atDp"):
            parts.append(f"{alerts['atDp']} at DP/AIAD")
        if alerts.get("overstayedLoans"):
            parts.append(f"{alerts['overstayedLoans']} overstayed loan(s)")
        if parts:
            return "Dashboard alerts: " + "; ".join(parts) + ". Expand Notifications on the dashboard."
        return "No pending alert counts in current context — check Dashboard → Notifications."

    return None


def _enrich_assistant_context(context: dict[str, Any]) -> dict[str, Any]:
    enriched = dict(context)
    enriched.setdefault("systemKnowledge", "TECHSTORESys — IT-DIR Tech Stores for ZNA ICT procurement and controlled stores.")
    enriched.setdefault("moduleGuide", SYSTEM_MODULE_GUIDE)
    enriched.setdefault("procurementFlow", PROCUREMENT_FLOW)
    enriched.setdefault("ictTrends", ICT_TRENDS_2025_2026)
    return enriched


def answer_stores_question(question: str, context: dict[str, Any]) -> dict[str, Any]:
    q = (question or "").strip()
    if len(q) < 3:
        return {"ok": False, "error": "Enter a question about Tech Stores, GL, inventory, or procurement."}

    ctx = _enrich_assistant_context(context if isinstance(context, dict) else {})
    heuristic = heuristic_stores_answer(q, ctx)

    if _api_key():
        ctx_text = json.dumps(ctx, indent=2)[:10000]
        parsed = _openai_json(
            ASSISTANT_SYSTEM_PROMPT,
            f"Context:\n{ctx_text}\n\nQuestion: {q}",
        )
        if parsed and parsed.get("answer"):
            return {
                "ok": True,
                "answer": str(parsed["answer"]).strip(),
                "ai": True,
                "readOnly": True,
            }

    if heuristic:
        return {"ok": True, "answer": heuristic, "ai": False, "readOnly": True}

    return {
        "ok": True,
        "answer": (
            "I can help with GL/buying power, stock counts (e.g. laptops, servers), requisitions, temporary loans, "
            "procurement steps (DP F1 → AIAD → PO), module navigation, and ICT equipment trends. "
            "Try: 'how many laptops in stock?', 'temporary loans status', 'procurement process', or 'server trends 2026'. "
            + ("" if _api_key() else "Set OPENAI_API_KEY on the server for deeper natural-language answers.")
        ),
        "ai": False,
        "readOnly": True,
    }


def draft_requisition_justification(params: dict[str, Any]) -> dict[str, Any]:
    subject = str(params.get("subject") or params.get("item") or "").strip()
    unit = str(params.get("unit") or "").strip()
    qty = str(params.get("qty") or "1").strip()
    category = str(params.get("category") or "").strip()
    hints = str(params.get("hints") or params.get("notes") or "").strip()

    if not subject and not unit:
        return {"ok": False, "error": "Enter subject/item and unit first."}

    template = (
        f"Unit/formation {unit or '—'} requests {qty} × {subject or 'ICT item'}"
        f"{f' ({category})' if category else ''} "
        f"to support IT-DIR operational requirements. "
        f"{hints + '. ' if hints else ''}"
        "Procurement route: check stores stock → ZNA Q 1033 issue if available, "
        "else DP F1 if GL buying power permits."
    )

    if _api_key():
        parsed = _openai_json(
            "Draft concise ZNA IT-DIR requisition justification (2-4 sentences, formal tone). "
            'Return JSON: {"justification": "..."}',
            json.dumps({
                "unit": unit,
                "subject": subject,
                "quantity": qty,
                "category": category,
                "extraHints": hints,
            }),
        )
        if parsed and parsed.get("justification"):
            return {
                "ok": True,
                "justification": str(parsed["justification"]).strip(),
                "ai": True,
            }

    return {"ok": True, "justification": template, "ai": False}


# --- Import any system document (typed, PDF, scan / handwriting) ---

IMPORT_DOC_TYPES = (
    "loose_minute",
    "requisition",
    "quotation",
    "purchase_order",
    "dp_f1",
    "tech_spec",
    "delivery_note",
    "cost_comparative",
    "unknown",
)

IMPORT_MODULE_MAP = {
    "loose_minute": ("unit-requisitions", "Requisitions"),
    "requisition": ("unit-requisitions", "Requisitions"),
    "quotation": ("guide-quotation", "Guide Quotation"),
    "purchase_order": ("purchase-orders", "Purchase Orders"),
    "dp_f1": ("dp-f1-form", "DP F1 Form"),
    "tech_spec": ("spec-evaluation", "Spec / Tech Evaluation"),
    "delivery_note": ("delivery-note", "Delivery Note"),
    "cost_comparative": ("cost-comparative-schedule", "Cost Comparative Schedule"),
    "unknown": ("", ""),
}

IMPORT_DOC_SYSTEM = """You extract ZNA / IT-DIR Tech Stores paperwork into JSON.
Return only JSON with keys: docType, confidence, fields, lines.

docType must be one of:
loose_minute, requisition, quotation, purchase_order, dp_f1, tech_spec, delivery_note, cost_comparative, unknown.

confidence is 0 to 1.

fields is an object of string/number values. Use these keys when present:
- loose_minute / requisition: unit, requestedBy, contact, fileRef, subject, itemDescription, qty, unitPrice, estimatedCost, justification, notes, date, originRef, docType (loose_minute or requisition_letter)
- quotation: supplier, ref, date, preparedFor, purpose, currency, notes
- purchase_order: supplierName, supplierAddress, poNumber, date, vendorNo, reqNo, deliverTo, deliveryDate, paymentTerms, contact, telephone, currency, gl
- dp_f1: date, estimatedCost, currency, delivery, gl, remarks
- tech_spec: productName, brand, model, category, purpose, summary
- delivery_note: date, item, description, qty, uom, serial, po, supplier, receivedBy
- cost_comparative: ref, date, dpF1Ref, currency, winningVendor, vendorA, vendorB, vendorC

lines is an array of objects:
- requisition / quotation: description, qty, unit, unitUsd, unitZig, source
- purchase_order: item, material, qty, unit, desc, price
- dp_f1: designation, qty, holding, supplier
- tech_spec: name, value, note
- delivery_note: item, description, qty, uom, serial, po, supplier
- cost_comparative: description, qty, priceA, priceB, priceC

Use only facts visible in the document. Empty string if unknown. Never invent totals, ranks, or serials.
Dates as YYYY-MM-DD when possible. Quantity as a number. Money as a number without currency symbol."""


def _import_module_for(doc_type: str) -> tuple[str, str]:
    return IMPORT_MODULE_MAP.get(doc_type) or ("", "")


def _clean_str(val: Any, limit: int = 400) -> str:
    return str(val or "").strip()[:limit]


def _clean_num(val: Any) -> str:
    if val is None or val == "":
        return ""
    if isinstance(val, (int, float)) and not isinstance(val, bool):
        n = float(val)
        return str(int(n) if n.is_integer() else n)
    s = str(val).replace(",", "").replace("$", "").strip()
    m = re.search(r"-?\d+(?:\.\d+)?", s)
    return m.group(0) if m else ""


def _iso_date(val: Any) -> str:
    s = str(val or "").strip()
    if not s:
        return ""
    m = re.search(r"(\d{4})-(\d{2})-(\d{2})", s)
    if m:
        return m.group(0)
    m = re.search(r"\b(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})\b", s)
    if m:
        day, month, year = m.group(1), m.group(2), m.group(3)
        if len(year) == 2:
            year = "20" + year
        return f"{year}-{month.zfill(2)}-{day.zfill(2)}"
    return ""


def _decode_b64(raw: str) -> bytes:
    import base64

    data = (raw or "").strip()
    if not data:
        return b""
    try:
        return base64.b64decode(data, validate=False)
    except Exception:
        return b""


def _extract_pdf_text(data: bytes) -> str:
    if not data.startswith(b"%PDF"):
        return ""
    try:
        from io import BytesIO
        from pypdf import PdfReader

        reader = PdfReader(BytesIO(data))
        parts = [(page.extract_text() or "") for page in reader.pages[:16]]
        text = "\n".join(parts).strip()
        if text:
            return text
    except Exception:
        pass
    try:
        from io import BytesIO
        from PyPDF2 import PdfReader as LegacyReader

        reader = LegacyReader(BytesIO(data))
        parts = [(page.extract_text() or "") for page in reader.pages[:16]]
        text = "\n".join(parts).strip()
        if text:
            return text
    except Exception:
        pass
    chunks = re.findall(rb"\((?:\\.|[^\\)]){3,}\)Tj", data[:800000])
    out: list[str] = []
    for chunk in chunks[:400]:
        inner = chunk[1:-3].decode("latin-1", "ignore")
        inner = inner.replace("\\n", " ").replace("\\r", " ")
        inner = re.sub(r"\\[()]", "", inner)
        if inner.strip():
            out.append(inner.strip())
    return " ".join(out).strip()


def _extract_docx_text(data: bytes) -> str:
    if data[:2] != b"PK":
        return ""
    try:
        import zipfile
        from html import unescape
        from io import BytesIO

        with zipfile.ZipFile(BytesIO(data)) as zf:
            xml = zf.read("word/document.xml").decode("utf-8", "ignore")
        xml = re.sub(r"</w:p>", "\n", xml)
        xml = re.sub(r"<[^>]+>", "", xml)
        return unescape(xml).strip()
    except Exception:
        return ""


def _extract_plain_bytes(data: bytes) -> str:
    if not data:
        return ""
    for enc in ("utf-8", "utf-16", "cp1252", "latin-1"):
        try:
            text = data.decode(enc)
            if text.strip():
                return text
        except Exception:
            continue
    return ""


def _field_search(text: str, *patterns: str) -> str:
    for pattern in patterns:
        m = re.search(pattern, text, re.I | re.M)
        if m:
            val = (m.group(1) if m.lastindex else m.group(0)).strip()
            val = re.sub(r"\s+", " ", val).strip(" .:;-")
            if val:
                return val[:400]
    return ""


def _classify_import_doc(text: str, file_name: str = "", hint: str = "") -> tuple[str, float]:
    hint_key = re.sub(r"[^a-z0-9]+", "_", (hint or "").lower()).strip("_")
    if hint_key in IMPORT_DOC_TYPES and hint_key != "unknown":
        return hint_key, 0.95
    blob = f"{file_name}\n{text}".lower()
    rules = [
        ("dp_f1", 0.9, ("official indent", "dp f1", "it dir f1", "current holding stock")),
        ("purchase_order", 0.88, ("purchase order", "p/o no", "our ref", "vendor no.")),
        ("cost_comparative", 0.88, ("cost comparative", "winning vendor", "vendor a")),
        ("delivery_note", 0.86, ("delivery note", "d-note", "d/note", "goods received note")),
        ("quotation", 0.84, ("quotation", "proforma", "quote no", "quoted price")),
        ("tech_spec", 0.82, ("specification", "tech eval", "operating system", "processor")),
        ("loose_minute", 0.84, ("loose minute", "minute sheet", "thru:", "through:")),
        ("requisition", 0.8, ("requisition", "indent for", "unit request")),
    ]
    for doc_type, score, keys in rules:
        if any(k in blob for k in keys):
            return doc_type, score
    if re.search(r"\bfrom\s*:", blob) and re.search(r"\b(to|subject)\s*:", blob):
        return "loose_minute", 0.62
    return "unknown", 0.2


def _qty_item_lines(text: str) -> list[dict[str, str]]:
    lines: list[dict[str, str]] = []
    for m in re.finditer(
        r"(?m)^\s*(?:[-*]|ser\.?\s*\d+|\d+[.)])?\s*(\d+(?:\.\d+)?)\s*[x×]\s+([^\n@]+?)(?:\s*@\s*[\$]?\s*([\d,]+\.?\d*))?\s*$",
        text,
        re.I,
    ):
        desc = m.group(2).strip(" -:")
        if len(desc) < 3:
            continue
        lines.append({
            "description": desc[:240],
            "qty": m.group(1),
            "unitUsd": (m.group(3) or "").replace(",", ""),
        })
    return lines[:20]


def _heuristic_import_fields(doc_type: str, text: str) -> tuple[dict[str, str], list[dict[str, str]]]:
    fields: dict[str, str] = {}
    lines = _qty_item_lines(text)
    fields["date"] = _iso_date(_field_search(
        text,
        r"(?:dated|date)\s*[:.]?\s*(\d{1,2}[./-]\d{1,2}[./-]\d{2,4}|\d{4}-\d{2}-\d{2})",
    ))
    subject = _field_search(text, r"(?:subject|re)\s*[:.-]\s*(.+)$")
    if subject:
        fields["subject"] = subject
        fields["itemDescription"] = subject
        fields["purpose"] = subject
    if doc_type in ("loose_minute", "requisition"):
        fields["unit"] = _field_search(text, r"(?:from|unit|formation)\s*[:.-]\s*(.+)$")
        fields["requestedBy"] = _field_search(text, r"(?:from|originator|requested by)\s*[:.-]\s*(.+)$")
        fields["fileRef"] = _field_search(text, r"(?:file\s*ref|our\s*ref|ref(?:erence)?)\s*[:.-]\s*(\S.+)$")
        fields["justification"] = text.strip()[:800]
        fields["notes"] = "Imported from document — review before save."
        fields["docType"] = "loose_minute" if doc_type == "loose_minute" else "requisition_letter"
        if lines:
            fields["qty"] = lines[0].get("qty") or "1"
            fields["itemDescription"] = lines[0].get("description") or fields.get("itemDescription", "")
            fields["unitPrice"] = lines[0].get("unitUsd") or ""
    elif doc_type == "quotation":
        fields["supplier"] = _field_search(text, r"(?:from|supplier|vendor)\s*[:.-]\s*(.+)$")
        fields["ref"] = _field_search(text, r"(?:quote\s*no|quotation\s*no|ref)\s*[:.-]\s*(\S.+)$")
        fields["currency"] = "USD" if "usd" in text.lower() else ("ZiG" if "zig" in text.lower() else "USD")
        fields["notes"] = text.strip()[:600]
        for row in lines:
            row["unit"] = row.get("unit") or "EA"
            row["source"] = fields.get("supplier") or ""
    elif doc_type == "purchase_order":
        fields["poNumber"] = _field_search(text, r"(?:p/?o(?:\s*no\.?)?|our\s*ref|purchase\s*order)\s*[:.-]?\s*([A-Z0-9][A-Z0-9/._-]{3,})")
        fields["reqNo"] = _field_search(text, r"(?:requisition|req(?:uisition)?)\s*(?:no\.?|number)?\s*[:.-]?\s*([A-Z0-9][A-Z0-9/._-]{4,})")
        fields["contact"] = _field_search(text, r"(?:contact)\s*[:.-]\s*(.+)$")
        fields["telephone"] = _field_search(text, r"(?:telephone|phone|tel)\s*[:.-]?\s*([+\d][\d ()-]{5,})")
        fields["supplierName"] = _field_search(text, r"(?:supplier|vendor|to)\s*[:.-]\s*(.+)$")
        fields["vendorNo"] = _field_search(text, r"vendor\s*(?:no\.?|number)\s*[:.-]?\s*(\S+)")
        fields["gl"] = _field_search(text, r"\b(2200\d{6}|3112210001|2201900002|220200002)\b")
        fields["currency"] = "USD" if "usd" in text.lower() else "ZiG"
        po_lines = []
        for i, row in enumerate(lines, start=1):
            po_lines.append({
                "item": f"{i * 10:05d}",
                "desc": row.get("description") or "",
                "qty": row.get("qty") or "1",
                "unit": "each",
                "price": row.get("unitUsd") or "",
            })
        lines = po_lines
    elif doc_type == "dp_f1":
        fields["estimatedCost"] = _clean_num(_field_search(text, r"(?:estimated\s*cost|total)\D{0,12}([\d,]+\.?\d*)"))
        fields["currency"] = "USD" if "usd" in text.lower() else "USD"
        fields["gl"] = _field_search(text, r"\b(2200\d{6}|3112210001)\b")
        fields["remarks"] = subject or ""
        f1_lines = []
        for row in lines:
            f1_lines.append({
                "designation": row.get("description") or "",
                "qty": row.get("qty") or "1",
                "holding": "",
                "supplier": _field_search(text, r"(?:supplier|vendor)\s*[:.-]\s*(.+)$"),
            })
        lines = f1_lines
    elif doc_type == "tech_spec":
        fields["productName"] = subject or text.split("\n", 1)[0][:120]
        fields["summary"] = text.strip()[:400]
        spec_lines = []
        for m in re.finditer(r"(?m)^\s*([A-Za-z][A-Za-z0-9 /()+.-]{2,40})\s*[:.-]\s*(.+)$", text):
            name, value = m.group(1).strip(), m.group(2).strip()
            if name.lower() in ("from", "to", "subject", "date", "ref"):
                continue
            spec_lines.append({"name": name, "value": value, "note": "From imported document"})
        if spec_lines:
            lines = spec_lines[:24]
    elif doc_type == "delivery_note":
        fields["supplier"] = _field_search(text, r"(?:supplied\s*by|supplier|from)\s*[:.-]\s*(.+)$")
        fields["po"] = _field_search(text, r"(?:p/?o|purchase\s*(?:order|no\.?))\s*[:.-]?\s*([A-Z0-9][A-Z0-9/._-]{3,})")
        fields["item"] = (lines[0].get("description") if lines else "") or subject
        fields["description"] = fields.get("item") or ""
        fields["qty"] = lines[0].get("qty") if lines else "1"
        fields["uom"] = "ea"
        fields["serial"] = _field_search(text, r"(?:s/?n|serial)\s*[:.-]?\s*([A-Z0-9][A-Z0-9-]{3,})")
    elif doc_type == "cost_comparative":
        fields["ref"] = _field_search(text, r"(?:ccs|ref|schedule)\s*[:.-]\s*(\S.+)$")
        fields["dpF1Ref"] = _field_search(text, r"(?:dp\s*f1|f1)\s*[:.-]?\s*(\S+)")
        fields["winningVendor"] = _field_search(text, r"winning\s*vendor\s*[:.-]\s*(.+)$")
        fields["currency"] = "USD"
        for letter, key in (("A", "vendorA"), ("B", "vendorB"), ("C", "vendorC")):
            fields[key] = _field_search(text, rf"vendor\s*{letter}\s*[:.-]\s*(.+)$")
    if not fields.get("itemDescription") and subject:
        fields["itemDescription"] = subject
    return fields, lines


def _normalize_import_payload(parsed: dict, *, fallback_text: str, file_name: str, hint: str) -> dict[str, Any]:
    raw_type = str(parsed.get("docType") or "").strip().lower().replace(" ", "_").replace("-", "_")
    aliases = {
        "minute": "loose_minute",
        "looseminute": "loose_minute",
        "f1": "dp_f1",
        "dpf1": "dp_f1",
        "po": "purchase_order",
        "p_o": "purchase_order",
        "quote": "quotation",
        "spec": "tech_spec",
        "specification": "tech_spec",
        "dnote": "delivery_note",
        "d_note": "delivery_note",
        "ccs": "cost_comparative",
    }
    doc_type = aliases.get(raw_type, raw_type)
    if doc_type not in IMPORT_DOC_TYPES:
        doc_type, _ = _classify_import_doc(fallback_text, file_name, hint)
    try:
        confidence = float(parsed.get("confidence") or 0)
    except (TypeError, ValueError):
        confidence = 0.0
    confidence = max(0.0, min(1.0, confidence))
    fields_in = parsed.get("fields") if isinstance(parsed.get("fields"), dict) else {}
    fields: dict[str, str] = {}
    for key, val in fields_in.items():
        k = str(key).strip()
        if not k:
            continue
        if k in ("qty", "unitPrice", "estimatedCost", "price", "unitUsd", "unitZig"):
            fields[k] = _clean_num(val)
        elif k == "date" or k.endswith("Date") or k.endswith("date"):
            fields[k] = _iso_date(val) or _clean_str(val, 40)
        else:
            fields[k] = _clean_str(val)
    lines_in = parsed.get("lines") if isinstance(parsed.get("lines"), list) else []
    lines: list[dict[str, str]] = []
    for row in lines_in[:30]:
        if isinstance(row, dict):
            item = {str(k): _clean_str(v, 240) for k, v in row.items() if str(k).strip()}
            if item:
                lines.append(item)
        elif isinstance(row, (list, tuple)) and len(row) >= 2:
            lines.append({"name": _clean_str(row[0], 80), "value": _clean_str(row[1], 180), "note": _clean_str(row[2] if len(row) > 2 else "", 120)})
    module_id, module_label = _import_module_for(doc_type)
    return {
        "ok": True,
        "docType": doc_type,
        "confidence": round(confidence, 2),
        "moduleId": module_id,
        "moduleLabel": module_label,
        "fields": fields,
        "lines": lines,
        "extractedText": (fallback_text or "")[:4000],
        "fileName": file_name,
    }


def parse_import_document(
    *,
    text: str = "",
    image_base64: str = "",
    file_base64: str = "",
    mime_type: str = "",
    file_name: str = "",
    doc_type_hint: str = "",
) -> dict[str, Any]:
    mime = (mime_type or "").lower()
    name = (file_name or "").strip()
    extracted = (text or "").strip()
    image = (image_base64 or "").strip()
    file_bytes = _decode_b64(file_base64)

    if file_bytes:
        if "pdf" in mime or name.lower().endswith(".pdf") or file_bytes.startswith(b"%PDF"):
            extracted = (_extract_pdf_text(file_bytes) or extracted).strip()
        elif "word" in mime or name.lower().endswith(".docx") or file_bytes[:2] == b"PK":
            extracted = (_extract_docx_text(file_bytes) or extracted).strip()
        elif mime.startswith("image/") or name.lower().endswith((".png", ".jpg", ".jpeg", ".webp", ".gif")):
            image = image or (file_base64 or "").strip()
        elif mime.startswith("text/") or name.lower().endswith((".txt", ".md", ".csv")):
            extracted = (_extract_plain_bytes(file_bytes) or extracted).strip()

    prompt = (
        f"Document type hint: {doc_type_hint or 'auto'}. File name: {name or 'none'}.\n"
        "Classify the document and extract fields for TECHSTORESys.\n"
    )
    parsed: dict | None = None
    ai_used = False

    if image:
        parsed = _openai_vision_json(
            IMPORT_DOC_SYSTEM,
            prompt + "This is a photo or scan of a typed or handwritten document.",
            image,
            mime if mime.startswith("image/") else "image/jpeg",
        )
        ai_used = bool(parsed)

    if not parsed and extracted:
        if _api_key():
            parsed = _openai_json(
                IMPORT_DOC_SYSTEM,
                f"{prompt}\n---\n{extracted[:9000]}",
            )
            ai_used = bool(parsed)

    if parsed:
        result = _normalize_import_payload(parsed, fallback_text=extracted, file_name=name, hint=doc_type_hint)
        if result["docType"] == "unknown" or (not result["fields"] and not result["lines"]):
            guessed, score = _classify_import_doc(extracted, name, doc_type_hint)
            h_fields, h_lines = _heuristic_import_fields(guessed, extracted)
            if result["docType"] == "unknown":
                result["docType"] = guessed
                result["confidence"] = max(result["confidence"], score)
                result["moduleId"], result["moduleLabel"] = _import_module_for(guessed)
            if not result["fields"]:
                result["fields"] = h_fields
            if not result["lines"]:
                result["lines"] = h_lines
        result["ai"] = ai_used
        result["note"] = (
            "AI-extracted — review every field before saving."
            if ai_used
            else "Heuristic extract — review every field before saving."
        )
        return result

    if extracted:
        guessed, score = _classify_import_doc(extracted, name, doc_type_hint)
        fields, lines = _heuristic_import_fields(guessed, extracted)
        module_id, module_label = _import_module_for(guessed)
        return {
            "ok": True,
            "ai": False,
            "docType": guessed,
            "confidence": score,
            "moduleId": module_id,
            "moduleLabel": module_label,
            "fields": fields,
            "lines": lines,
            "extractedText": extracted[:4000],
            "fileName": name,
            "note": (
                "Heuristic extract from typed text — review every field before saving. "
                "Set OPENAI_API_KEY for handwriting/photos and fuller parsing."
            ),
        }

    if image and not _api_key():
        guessed, score = _classify_import_doc("", name, doc_type_hint)
        module_id, module_label = _import_module_for(guessed)
        return {
            "ok": True,
            "ai": False,
            "docType": guessed if guessed != "unknown" else "unknown",
            "confidence": score if guessed != "unknown" else 0.1,
            "moduleId": module_id,
            "moduleLabel": module_label,
            "fields": {},
            "lines": [],
            "extractedText": "",
            "fileName": name,
            "note": (
                "Photo stored. Handwriting and scans need OPENAI_API_KEY on the server, "
                "or paste typed text from the document."
            ),
        }

    return {
        "ok": False,
        "error": (
            "Could not read the document. Upload a PDF, Word, photo, or paste typed text. "
            "Handwritten scans need OPENAI_API_KEY on the server."
        ),
    }
