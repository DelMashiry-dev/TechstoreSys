#!/usr/bin/env python3
"""Receipt HPE ProLiant DL380 Gen11 into techstores.db (idempotent)."""

from __future__ import annotations

import json
import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DB_PATH = ROOT / "techstores.db"

ITEM = {
    "itemId": "ict-equipment__hpe-proliant-dl380-gen11",
    "name": "HPE ProLiant DL380 Gen11",
    "category": "ict-equipment",
    "gl": "3112210001",
    "qty": 1,
    "sourceRef": "RV/IT/0826/SRV-DL380-G11",
    "party": "ICT procurement — server receipt",
    "description": "HPE ProLiant DL380 Gen11 server — stores receipt",
}
SOURCE = "inventory-receipt-dl380-g11"


def txn_exists(inv: dict, source_ref: str, item_id: str) -> bool:
    return any(
        t.get("source") == SOURCE
        and t.get("sourceRef") == source_ref
        and t.get("itemId") == item_id
        and t.get("type") == "receipt"
        for t in inv.get("transactions") or []
    )


def on_hand(inv: dict, item_id: str) -> int:
    opening = int((inv.get("openings") or {}).get(item_id) or 0)
    received = issued = 0
    for t in inv.get("transactions") or []:
        if t.get("itemId") != item_id:
            continue
        qty = int(float(t.get("qty") or 0))
        if t.get("type") == "receipt":
            received += qty
        elif t.get("type") == "issue":
            issued += qty
    return opening + received - issued


def main() -> None:
    if not DB_PATH.is_file():
        raise SystemExit(f"Database not found: {DB_PATH}")

    con = sqlite3.connect(DB_PATH)
    row = con.execute("SELECT value FROM settings WHERE key = 'extended_state'").fetchone()
    if not row:
        raise SystemExit("No extended_state in database")

    extended = json.loads(row[0])
    inv = extended.setdefault("storesInventory", {"openings": {}, "transactions": []})
    inv.setdefault("openings", {})
    inv.setdefault("transactions", [])

    if txn_exists(inv, ITEM["sourceRef"], ITEM["itemId"]):
        print(f"Already received — {ITEM['name']} on hand: {on_hand(inv, ITEM['itemId'])}")
        con.close()
        return

    now = datetime.now(timezone.utc).isoformat()
    inv["transactions"].append(
        {
            "id": f"stk-dl380-{uuid.uuid4().hex[:10]}",
            "date": datetime.now().date().isoformat(),
            "type": "receipt",
            "itemId": ITEM["itemId"],
            "category": ITEM["category"],
            "item": ITEM["name"],
            "description": ITEM["description"],
            "qty": ITEM["qty"],
            "uom": "EA",
            "gl": ITEM["gl"],
            "voucherNo": ITEM["sourceRef"],
            "party": ITEM["party"],
            "source": SOURCE,
            "sourceRef": ITEM["sourceRef"],
            "by": "Inventory receipt script",
            "createdAt": now,
        }
    )

    extended["storesInventory"] = inv
    con.execute(
        "UPDATE settings SET value = ? WHERE key = 'extended_state'",
        (json.dumps(extended),),
    )
    con.commit()
    con.close()
    print(f"Received {ITEM['qty']} x {ITEM['name']} ({ITEM['sourceRef']})")
    print(f"On hand: {on_hand(inv, ITEM['itemId'])}")


if __name__ == "__main__":
    main()
