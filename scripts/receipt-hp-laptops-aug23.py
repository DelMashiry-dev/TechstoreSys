"""One-off idempotent receipt: 15 HP OmniBook X Flip Ultra 9 + 5 HP EliteBook Core i7."""
from __future__ import annotations

import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from server import load_full_state, save_full_state  # noqa: E402

RECEIPTS = [
    {
        "itemId": "ict-equipment__hp-omnibook-x-flip-16",
        "name": "HP OmniBook X Flip 16 AI (Intel Core Ultra 9)",
        "qty": 15,
        "sourceRef": "RV/IT/0823/OMNIBOOK-X-FLIP-U9",
        "description": "HP OmniBook X Flip Ultra 9 laptops — stores receipt (15 units)",
    },
    {
        "itemId": "ict-equipment__hp-elitebook-840-g11",
        "name": "HP EliteBook 840 G11",
        "qty": 5,
        "sourceRef": "RV/IT/0823/ELITEBOOK-I7",
        "description": "HP EliteBook 840 G11 Core i7 laptops — stores receipt (5 units)",
    },
]
SOURCE = "inventory-receipt-hp-laptops-aug23-2026"
TODAY = "2026-08-23"


def main() -> int:
    state = load_full_state()
    inv = state.setdefault("storesInventory", {"openings": {}, "transactions": []})
    inv.setdefault("openings", {})
    txns = inv.setdefault("transactions", [])
    dist = inv.get("laptopDistributionAug2026") or {}
    if dist.get("applied") and int(dist.get("ivRev") or 0) >= 2:
        print("SKIP: laptop distribution IVs already allocated unit receipts with ZA numbers.")
        return 0
    if any(
        t.get("source") == "laptop-distribution-aug2026" and t.get("type") == "issue"
        for t in txns
    ):
        print("SKIP: laptop distribution IVs already posted.")
        return 0
    before = len(txns)
    added = []

    for row in RECEIPTS:
        dup = any(
            t.get("source") == SOURCE
            and t.get("sourceRef") == row["sourceRef"]
            and t.get("itemId") == row["itemId"]
            and t.get("type") == "receipt"
            for t in txns
        )
        if dup:
            print(f"SKIP (already posted): {row['name']} x{row['qty']}")
            continue

        txns.append(
            {
                "id": f"stk-hp-{row['itemId'].split('__')[-1]}-{int(datetime.now().timestamp() * 1000)}",
                "date": TODAY,
                "type": "receipt",
                "itemId": row["itemId"],
                "category": "ict-equipment",
                "item": row["name"],
                "description": row["description"],
                "qty": row["qty"],
                "uom": "EA",
                "gl": "3112210001",
                "voucherNo": row["sourceRef"],
                "party": "ICT procurement — laptop receipt",
                "source": SOURCE,
                "sourceRef": row["sourceRef"],
                "by": "Inventory receipt",
                "createdAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z"),
            }
        )
        added.append(row)
        print(f"ADDED: {row['name']} x{row['qty']} ({row['sourceRef']})")

    if not added:
        print("No changes — receipts already in database.")
        return 0

    state["saveRevision"] = int(state.get("saveRevision") or 0) + 1
    state["savedAt"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")
    state["savedBy"] = "Inventory receipt"
    save_full_state(state, force=True)
    print(f"Saved. Transactions: {before} -> {len(txns)} (+{len(added)})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
