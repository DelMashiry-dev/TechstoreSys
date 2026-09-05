"""Idempotent receipt: 5 × HP OMEN Gaming Laptop 16-ap0097nr (5 Sep 2026)."""
from __future__ import annotations

import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from server import load_full_state, save_full_state  # noqa: E402

ITEM_ID = "ict-equipment__hp-omen-16-ap0097nr"
NAME = "HP OMEN Gaming Laptop 16-ap0097nr"
QTY = 5
DATE = "2026-09-05"
SOURCE = "inventory-receipt-omen16-ap0097nr-20260905"
SOURCE_REF = "RV/IT/0905/OMEN-16-AP"
PARTY = "Taken on charge — stock on hand"
DESCRIPTION = (
    "HP OMEN Gaming Laptop 16-ap0097nr × 5 — taken on charge to ICT Equipment. "
    "16\" WQXGA · Shadow Black · Windows 11 Home. "
    "AMD Ryzen AI 9 · NVIDIA GeForce RTX 5070 · 32 GB RAM · 1 TB SSD."
)


def main() -> int:
    state = load_full_state()
    inv = state.setdefault("storesInventory", {"openings": {}, "transactions": []})
    inv.setdefault("openings", {})
    txns = inv.setdefault("transactions", [])

    dup = any(
        t.get("source") == SOURCE
        and t.get("sourceRef") == SOURCE_REF
        and t.get("itemId") == ITEM_ID
        and t.get("type") == "receipt"
        for t in txns
    )
    if dup:
        print(f"SKIP (already posted): {NAME} x{QTY}")
        return 0

    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")
    txns.append(
        {
            "id": f"stk-omen16-ap0097nr-{int(datetime.now().timestamp() * 1000)}",
            "date": DATE,
            "type": "receipt",
            "itemId": ITEM_ID,
            "category": "ict-equipment",
            "item": NAME,
            "description": DESCRIPTION,
            "qty": QTY,
            "uom": "EA",
            "gl": "3112210001",
            "voucherNo": SOURCE_REF,
            "party": PARTY,
            "source": SOURCE,
            "sourceRef": SOURCE_REF,
            "by": "Inventory receipt",
            "createdAt": now,
        }
    )
    inv["omen16Ap0097nrReceipt_20260905"] = {
        "applied": True,
        "appliedAt": now,
        "itemId": ITEM_ID,
        "qty": QTY,
        "party": PARTY,
        "voucherNo": SOURCE_REF,
    }

    state["saveRevision"] = int(state.get("saveRevision") or 0) + 1
    state["savedAt"] = now
    state["savedBy"] = "Inventory receipt"
    save_full_state(state, force=True)
    print(f"ADDED: {NAME} x{QTY} ({SOURCE_REF})")
    print("Saved.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
