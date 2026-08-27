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
