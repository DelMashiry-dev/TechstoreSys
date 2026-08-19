"""Apply physical stock count (handwritten list 2026-07-31) to techstores.db."""
import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DB = ROOT / "techstores.db"

# Catalog IDs from catalog.js + custom items for gaps
STOCK_LINES = [
    # Built-in catalog
    ("consumables-toners__hp-ce280a-toner", "HP CE280A / 80A toner", 3, None),
    ("consumables-toners__hp-cf226a-toner", "HP CF226A / 26A toner", 15, None),
    ("consumables-toners__hp-ce232a-toner", "HP CE232A / 230A yellow toner", 5, None),
    ("consumables-toners__canon-exv54-black", "Canon C-EXV 54 Black", 6, None),
    ("consumables-toners__canon-exv54-magenta", "Canon C-EXV 54 Magenta", 9, None),
    ("consumables-toners__canon-exv54-cyan", "Canon C-EXV 54 Cyan", 3, None),
    ("consumables-toners__canon-exv54-yellow", "Canon C-EXV 54 Yellow", 4, None),
    ("consumables-toners__hp-cf289a-toner", "HP CF289A / 289A toner", 3, None),
    # Custom catalog (not in master list exactly)
    (
        "custom__inv-toner__hp-507a-toner-set",
        "HP 507A toner set",
        1,
        {"id": "custom__inv-toner__hp-507a-toner-set", "name": "HP 507A toner set", "category": "inv-toner", "sourceCategory": "consumables-toners", "gl": "2200600002", "sectionLabel": "Toners", "custom": True},
    ),
    (
        "custom__inv-toner__hp-230a-magenta-toner",
        "HP 230A magenta toner",
        5,
        {"id": "custom__inv-toner__hp-230a-magenta-toner", "name": "HP 230A magenta toner", "category": "inv-toner", "sourceCategory": "consumables-toners", "gl": "2200600002", "sectionLabel": "Toners", "custom": True},
    ),
    (
        "custom__inv-usb__sandisk-32g-usb-memory-stick",
        "SanDisk 32G USB Memory stick",
        27,
        {"id": "custom__inv-usb__sandisk-32g-usb-memory-stick", "name": "SanDisk 32G USB Memory stick", "category": "inv-usb", "sourceCategory": "consumables-media", "gl": "2200600002", "sectionLabel": "USB / Media", "custom": True},
    ),
    (
        "custom__inv-tablets__samsung-galaxy-tab-s11",
        "Samsung Galaxy Tab S11",
        2,
        {"id": "custom__inv-tablets__samsung-galaxy-tab-s11", "name": "Samsung Galaxy Tab S11", "category": "inv-tablets", "sourceCategory": "ict-equipment", "gl": "3112210001", "sectionLabel": "Tablets", "custom": True},
    ),
    ("ict-equipment__canon-imagerunner-c3025i", "Canon imageRUNNER C3025i", 1, None),
    ("ict-equipment__hp-omnibook-x-flip-16", "HP OmniBook X Flip 16 AI (Intel Core Ultra 9)", 1, None),
]


def main():
    if not DB.exists():
        raise SystemExit(f"DB not found: {DB}")

    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row
    row = conn.execute("SELECT value FROM settings WHERE key = ?", ("extended_state",)).fetchone()
    state = json.loads(row["value"]) if row else {}
    if not isinstance(state, dict):
        state = {}

    inv = state.get("storesInventory") or {}
    if not isinstance(inv, dict):
        inv = {}
    openings = dict(inv.get("openings") or {})
    transactions = list(inv.get("transactions") or [])
    custom = list(state.get("customCatalogItems") or [])

    now = datetime.now(timezone.utc).isoformat()
    applied = []

    for item_id, label, qty, custom_def in STOCK_LINES:
        openings[item_id] = int(qty)
        applied.append(f"{qty} × {label}")
        if custom_def:
            if not any(c.get("id") == custom_def["id"] for c in custom):
                item = dict(custom_def)
                item["createdAt"] = now
                custom.append(item)

    # Note on the stock take — keep day history light
    inv["openings"] = openings
    inv["transactions"] = transactions
    inv["stockCountNote"] = {
        "source": "Physical stock list (handwritten)",
        "dated": "2026-07-31",
        "appliedAt": now,
        "lines": applied,
    }
    state["storesInventory"] = inv
    state["customCatalogItems"] = custom
    state["savedAt"] = now
    state["savedBy"] = "stock-count-seed"
    rev = int(state.get("saveRevision") or 0) + 1
    state["saveRevision"] = rev

    # Preserve only keys the server expects, but merge full state blob as stored historically
    conn.execute(
        "INSERT INTO settings (key, value) VALUES (?, ?) "
        "ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        ("extended_state", json.dumps(state)),
    )
    conn.execute(
        "INSERT INTO settings (key, value) VALUES (?, ?) "
        "ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        ("extended_saved_at", json.dumps(now)),
    )
    conn.commit()
    conn.close()

    print("Updated storesInventory openings:")
    for line in applied:
        print(" ", line)
    print(f"saveRevision={rev}")
    print("Done. Refresh the app (or restart START-SYSTEM.bat) to see new on-hand.")


if __name__ == "__main__":
    main()
