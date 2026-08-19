#!/usr/bin/env python3
"""Apply Aug 2026 inventory refresh to techstores.db (strike Dell 5540 + add 30 ICT lines)."""

from __future__ import annotations

import json
import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DB_PATH = ROOT / "techstores.db"

STRIKE_ITEM = {
    "itemId": "ict-equipment__dell-latitude-5540",
    "name": "Dell Latitude 5540",
    "category": "ict-equipment",
    "gl": "3112210001",
    "sourceRef": "IV/IT/0826/STRIKE-5540",
    "party": "Struck off ledger — disposal / backload",
    "description": "Strike off Dell Latitude 5540 from ICT stores ledger",
}

RECEIPTS = [
    ("ict-equipment__hp-laserjet-enterprise-m507dn", "HP LaserJet Enterprise M507dn"),
    ("ict-equipment__hp-laserjet-enterprise-mfp-m528dn", "HP LaserJet Enterprise MFP M528dn"),
    ("ict-equipment__hp-color-laserjet-enterprise-m554dn", "HP Color LaserJet Enterprise M554dn"),
    ("ict-equipment__canon-imagerunner-advance-dx-c3926i", "Canon imageRUNNER ADVANCE DX C3926i"),
    ("ict-equipment__canon-imagerunner-advance-dx-c5840i", "Canon imageRUNNER ADVANCE DX C5840i"),
    ("ict-equipment__xerox-altalink-c8155", "Xerox AltaLink C8155"),
    ("ict-equipment__kyocera-taskalfa-2554ci", "Kyocera TASKalfa 2554ci"),
    ("ict-equipment__hp-designjet-t650", "HP DesignJet T650 (large format)"),
    ("ict-equipment__epson-workforce-pro-wf-c5890", "Epson WorkForce Pro WF-C5890"),
    ("ict-equipment__brother-mfc-l8390cdw", "Brother MFC-L8390CDW"),
    ("ict-equipment__dell-latitude-7450", "Dell Latitude 7450"),
    ("ict-equipment__dell-latitude-5450", "Dell Latitude 5450"),
    ("ict-equipment__hp-elitebook-860-g11", "HP EliteBook 860 G11"),
    ("ict-equipment__hp-elitebook-x360", "HP EliteBook x360"),
    ("ict-equipment__lenovo-thinkpad-x1-carbon-gen-12", "Lenovo ThinkPad X1 Carbon Gen 12"),
    ("ict-equipment__lenovo-thinkpad-t14-gen-5", "Lenovo ThinkPad T14 Gen 5"),
    ("ict-equipment__apple-macbook-pro-14", "Apple MacBook Pro 14"),
    ("ict-equipment__microsoft-surface-laptop-7", "Microsoft Surface Laptop 7"),
    ("ict-equipment__hp-zbook-firefly", "HP ZBook Firefly"),
    ("ict-equipment__asus-expertbook-b9", "ASUS ExpertBook B9"),
    ("ict-equipment__hp-elitedesk-800-g9", "HP EliteDesk 800 G9"),
    ("ict-equipment__dell-optiplex-7020", "Dell OptiPlex 7020"),
    ("ict-equipment__dell-optiplex-7020-micro", "Dell OptiPlex 7020 Micro"),
    ("ict-equipment__lenovo-thinkcentre-m90q-gen-4", "Lenovo ThinkCentre M90q Gen 4"),
    ("ict-equipment__hp-prodesk-400-g9", "HP ProDesk 400 G9"),
    ("ict-equipment__dell-precision-3680-tower", "Dell Precision 3680 Tower"),
    ("ict-equipment__hp-elite-mini-800-g9", "HP Elite Mini 800 G9"),
    ("ict-equipment__lenovo-thinkcentre-m90a-gen-5-aio", "Lenovo ThinkCentre M90a Gen 5 AIO"),
    ("ict-equipment__apple-imac-24", "Apple iMac 24"),
    ("ict-equipment__apple-mac-mini-m4", "Apple Mac mini (M4)"),
]

REFRESH_KEY = "inventoryRefresh_2026_08"
SOURCE = "inventory-refresh-2026"


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


def txn_exists(inv: dict, source_ref: str, item_id: str, txn_type: str) -> bool:
    return any(
        t.get("source") == SOURCE
        and t.get("sourceRef") == source_ref
        and t.get("itemId") == item_id
        and t.get("type") == txn_type
        for t in inv.get("transactions") or []
    )


def new_txn(**fields) -> dict:
    now = datetime.now(timezone.utc).isoformat()
    return {
        "id": f"stk-refresh-{uuid.uuid4().hex[:10]}",
        "date": datetime.now().date().isoformat(),
        "uom": "EA",
        "source": SOURCE,
        "by": "Inventory refresh script",
        "createdAt": now,
        **fields,
    }


def main() -> None:
    if not DB_PATH.is_file():
        raise SystemExit(f"Database not found: {DB_PATH}")

    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    row = con.execute("SELECT value FROM settings WHERE key = 'extended_state'").fetchone()
    if not row:
        raise SystemExit("No extended_state in database")

    extended = json.loads(row["value"])
    inv = extended.setdefault("storesInventory", {"openings": {}, "transactions": []})
    inv.setdefault("openings", {})
    inv.setdefault("transactions", [])

    if inv.get(REFRESH_KEY, {}).get("applied"):
        print("Already applied — use force in browser with applyInventoryRefreshAug2026({ force: true })")
        con.close()
        return

    lines: list[str] = []
    struck = 0

    qty = on_hand(inv, STRIKE_ITEM["itemId"])
    if qty > 0 and not txn_exists(inv, STRIKE_ITEM["sourceRef"], STRIKE_ITEM["itemId"], "issue"):
        inv["transactions"].append(
            new_txn(
                type="issue",
                itemId=STRIKE_ITEM["itemId"],
                category=STRIKE_ITEM["category"],
                item=STRIKE_ITEM["name"],
                description=STRIKE_ITEM["description"],
                qty=qty,
                gl=STRIKE_ITEM["gl"],
                voucherNo=STRIKE_ITEM["sourceRef"],
                party=STRIKE_ITEM["party"],
                sourceRef=STRIKE_ITEM["sourceRef"],
            )
        )
        struck = qty
        lines.append(f"Struck off {qty} x {STRIKE_ITEM['name']}")
    elif qty <= 0:
        lines.append(f"{STRIKE_ITEM['name']} already at zero")

    received = 0
    for index, (item_id, name) in enumerate(RECEIPTS, start=1):
        source_ref = f"RV/IT/0826/REF-{index:03d}"
        if txn_exists(inv, source_ref, item_id, "receipt"):
            continue
        inv["transactions"].append(
            new_txn(
                type="receipt",
                itemId=item_id,
                category="ict-equipment",
                item=name,
                description="Inventory refresh Aug 2026",
                qty=1,
                gl="3112210001",
                voucherNo=source_ref,
                party="ICT procurement — stores receipt",
                sourceRef=source_ref,
            )
        )
        received += 1
        lines.append(f"Received 1 x {name}")

    inv[REFRESH_KEY] = {
        "applied": True,
        "appliedAt": datetime.now(timezone.utc).isoformat(),
        "struckOff": STRIKE_ITEM["name"],
        "struckQty": struck,
        "receivedCount": received,
        "lines": lines,
    }

    extended["storesInventory"] = inv
    extended["saveRevision"] = int(extended.get("saveRevision") or 0) + 1
    extended["savedAt"] = datetime.now(timezone.utc).isoformat()
    extended["savedBy"] = "apply-inventory-refresh-2026.py"

    con.execute(
        "INSERT INTO settings (key, value) VALUES (?, ?) "
        "ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        ("extended_state", json.dumps(extended)),
    )
    con.commit()
    con.close()

    print(f"Done — struck {struck}, received {received} new lines:")
    for line in lines:
        print(f"  • {line}")


if __name__ == "__main__":
    main()
