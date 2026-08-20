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


def heuristic_stores_answer(question: str, context: dict[str, Any]) -> str | None:
    q = (question or "").lower()
    target = _money(context.get("target"))
    committed = _money(context.get("committed"))
    vouchers = _money(context.get("vouchers"))
    buying = _money(context.get("buyingPower"))
    if not any((target, committed, buying)):
        return None

    if any(w in q for w in ("buying power", "balance", "available", "left to spend")):
        return (
            f"Buying power is ${buying:,.0f}. "
            f"Target ${target:,.0f} = Committed ${committed:,.0f} + Vouchers ${vouchers:,.0f} + Buying power."
        )
    if "committed" in q or "utilised" in q or "utilized" in q:
        pct = (committed / target * 100) if target else 0
        return f"Committed funds: ${committed:,.0f} ({pct:.1f}% of target ${target:,.0f})."
    if "voucher" in q:
        return f"Vouchers recorded: ${vouchers:,.0f} (part of the GL balance equation)."
    if "target" in q:
        return f"GL target total: ${target:,.0f} across ICT / stores ledgers."
    if "equation" in q or "balance" in q:
        return (
            f"Equation: Target (${target:,.0f}) = Committed (${committed:,.0f}) "
            f"+ Vouchers (${vouchers:,.0f}) + Buying power (${buying:,.0f})."
        )
    inv = context.get("inventorySummary") or {}
    if "inventory" in q or "stock" in q or "on hand" in q:
        lines = inv.get("lines") or []
        if lines:
            top = "; ".join(lines[:5])
            return f"Inventory highlights: {top}."
        total = inv.get("ictLines") or inv.get("totalLines")
        if total is not None:
            return f"Inventory register shows {total} ICT product line(s) with stock movements."
    return None


def answer_stores_question(question: str, context: dict[str, Any]) -> dict[str, Any]:
    q = (question or "").strip()
    if len(q) < 3:
        return {"ok": False, "error": "Enter a question about GL balances or inventory."}

    heuristic = heuristic_stores_answer(q, context)
    if _api_key():
        ctx_text = json.dumps(context, indent=2)[:6000]
        parsed = _openai_json(
            "You are a read-only IT-DIR Tech Stores assistant for Zimbabwe National Army ICT procurement. "
            "Answer using ONLY the JSON context provided. Never invent figures. "
            "If data is missing, say so. Keep answers under 120 words. Plain English.",
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
            "I can help with buying power, committed funds, vouchers, and inventory summaries "
            "when those figures are loaded on the dashboard. Set OPENAI_API_KEY for broader questions."
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
