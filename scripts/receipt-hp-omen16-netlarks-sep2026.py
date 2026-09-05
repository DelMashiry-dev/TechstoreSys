"""Idempotent receipt: 5 × HP OMEN 16 Gaming Laptop from Netlarks (4 Sep 2026)."""
from __future__ import annotations

import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from server import load_full_state, save_full_state  # noqa: E402

ITEM_ID = "ict-equipment__hp-omen-16-am0000ne"
NAME = "HP OMEN 16 Gaming Laptop (16-am0000ne)"
QTY = 5
DATE = "2026-09-04"
SOURCE = "inventory-receipt-omen16-netlarks-20260904"
SOURCE_REF = "RV/IT/0904/OMEN-16"
DN_REF = "DN/NL/OMEN/0904"
PARTY = "NETLARKS TECHNOLOGIES (PVT) LTD"
DESCRIPTION = (
    "HP OMEN 16 Gaming Laptop × 5 — Netlarks stores receipt. "
    "Model 16-am0000ne · P/N C92JNEA#ABV · Shadow Black · FreeDOS 3.0. "
    "Intel Core i9-14900HX · RTX 5060 8GB GDDR7 · 16GB DDR5-5600 · 512GB PCIe Gen4 SSD. "
    "Sample S/N 5CD5466WVC (remaining serials to be captured on WRC / MLG)."
)
WRC_ID = "wrc-omen16-netlarks-20260904"


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
    certs = state.setdefault("workshopReceiptCerts", [])
    if not any(c.get("id") == WRC_ID or (c.get("source") == SOURCE and c.get("sourceRef") == SOURCE_REF) for c in certs):
        certs.insert(
            0,
            {
                "id": WRC_ID,
                "inspectionSerial": "WRC-2026-OMEN16",
                "status": "engraved_complete",
                "deliveryDate": DATE,
                "supplier": PARTY,
                "poNo": "",
                "dnRef": DN_REF,
                "itemSummary": f"{QTY} × {NAME}",
                "qty": QTY,
                "group": "GROUP 3",
                "officer": {"forceNo": "", "rank": "", "name": "", "unit": "IT Directorate"},
                "trade": "IT",
                "expertise": "ICT equipment / computers",
                "lines": [
                    {
                        "label": "a",
                        "designation": NAME,
                        "qty": QTY,
                        "serialNo": "5CD5466WVC (+4 serials pending capture)",
                        "specMatch": True,
                    }
                ],
                "remarks": DESCRIPTION,
                "certDate": DATE,
                "source": SOURCE,
                "sourceRef": SOURCE_REF,
                "mlg": {"sentDate": DATE, "returnedDate": DATE, "zaNumbers": []},
                "ictAssetIds": [],
                "history": [
                    {"at": f"{DATE}T12:00:00.000Z", "note": "Delivery received from Netlarks — workshop/spec accepted"},
                    {"at": f"{DATE}T12:05:00.000Z", "note": "Taken on charge to ICT Equipment ledger (qty 5)"},
                ],
                "createdAt": now,
                "updatedAt": now,
            },
        )
        print(f"ADDED WRC: {WRC_ID}")

    txns.append(
        {
            "id": f"stk-omen16-netlarks-{int(datetime.now().timestamp() * 1000)}",
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
            "deliveryNoteRef": DN_REF,
            "source": SOURCE,
            "sourceRef": SOURCE_REF,
            "wrcId": WRC_ID,
            "by": "Inventory receipt",
            "createdAt": now,
        }
    )
    inv["omen16NetlarksReceipt_20260904"] = {
        "applied": True,
        "appliedAt": now,
        "itemId": ITEM_ID,
        "qty": QTY,
        "party": PARTY,
        "voucherNo": SOURCE_REF,
        "dnRef": DN_REF,
        "wrcId": WRC_ID,
    }

    # Ensure Netlarks appears on suppliers module if present
    mods = state.setdefault("modules", {})
    suppliers_mod = mods.get("suppliers-contracts")
    if isinstance(suppliers_mod, dict):
        rows = suppliers_mod.setdefault("rows", [])
        if isinstance(rows, list):
            key = "netlarks"
            if not any(key in str(r.get("name", "")).lower().replace(" ", "") for r in rows if isinstance(r, dict)):
                rows.append(
                    {
                        "id": f"sup-netlarks-{int(datetime.now().timestamp())}",
                        "name": "Netlarks Technologies (Pvt) Ltd",
                        "contact": "",
                        "phone": "0773 925 179",
                        "email": "",
                        "start": DATE,
                        "end": "",
                        "status": "Active",
                        "notes": "NETLARKS TECHNOLOGIES (PVT) LTD — HP OMEN 16 receipt 2026-09-04",
                    }
                )
                print("ADDED supplier: Netlarks Technologies (Pvt) Ltd")

    state["saveRevision"] = int(state.get("saveRevision") or 0) + 1
    state["savedAt"] = now
    state["savedBy"] = "Inventory receipt"
    save_full_state(state, force=True)
    print(f"ADDED: {NAME} x{QTY} ({SOURCE_REF}) from {PARTY}")
    print("Saved.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
