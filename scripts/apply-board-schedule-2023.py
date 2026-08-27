"""Apply IT Dir 2023 Board of Survey laptop schedule (ZNA/Q/121 rows 57–85)."""
from __future__ import annotations

import re
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from server import load_full_state, save_full_state  # noqa: E402

SOURCE = "board-schedule-2023"
KEY = "boardSchedule2023"

META = {
    "title": "Schedule of Stores Boarded — IT Dir laptops (ZNA/Q/121)",
    "boardRef": "Camp/20/3/02/23",
    "form1045Ref": "ZNA/Q/121",
    "requestRef": "IT/20/1",
    "confirmationRef": "QS/20/2",
    "boardDate": "2023-03-27",
    "confirmedDate": "2023-07-12",
    "scheduleRows": "57–85",
    "disposalNote": "Crush / burn / bury per QS/20/2 — EMA notified",
}

ROWS = [
    {"serial": 57, "sectionRef": "AF33710008NE9114R32392", "brand": "ACER", "holder": "OSD GP 3", "reason": "BER"},
    {"serial": 58, "sectionRef": "AF33710008NE914R32392", "brand": "ACER", "holder": "OSD GP 3", "reason": "BER"},
    {"serial": 59, "sectionRef": "AF33710008NE914R-4110R4", "brand": "ACER", "holder": "OSD GP 3", "reason": "BER"},
    {"serial": 60, "sectionRef": "ZA 287", "brand": "HP", "holder": "OSD GP 3", "reason": "BER"},
    {"serial": 61, "sectionRef": "18766113-001", "brand": "MICRON", "holder": "OSD GP 3", "reason": "BER"},
    {"serial": 62, "sectionRef": "18766113-001", "brand": "MICRON", "holder": "BEB GP 3", "reason": "BER"},
    {"serial": 63, "sectionRef": "ZA-017", "brand": "HP", "holder": "IT DIR", "reason": "OBSOLETE"},
    {"serial": 64, "sectionRef": "ZA 017", "brand": "HP", "holder": "IT DIR", "reason": "OBSOLETE"},
    {"serial": 65, "sectionRef": "VMFJIRHFQK", "brand": "HP", "holder": "IT DIR", "reason": "OBSOLETE"},
    {"serial": 66, "sectionRef": "ZA 624", "brand": "HP", "holder": "IT DIR", "reason": "OBSOLETE"},
    {"serial": 67, "sectionRef": "3C893121ZY", "brand": "LENOVO", "holder": "IT DIR", "reason": "OBSOLETE"},
    {"serial": 68, "sectionRef": "ZA 584", "brand": "HP", "holder": "IT DIR", "reason": "OBSOLETE"},
    {"serial": 69, "sectionRef": "ZA 348", "brand": "HP", "holder": "IT DIR", "reason": "OBSOLETE"},
    {"serial": 70, "sectionRef": "ZA 662", "brand": "DELL", "holder": "IT DIR", "reason": "OBSOLETE"},
    {"serial": 71, "sectionRef": "QWHB3KH9GY", "brand": "DELL", "holder": "IT DIR", "reason": "OBSOLETE"},
    {"serial": 72, "sectionRef": "ZA B43700Q6", "brand": "DELL", "holder": "IT DIR", "reason": "OBSOLETE"},
    {"serial": 73, "sectionRef": "ZA 558", "brand": "HP", "holder": "IT DIR", "reason": "OBSOLETE"},
    {"serial": 74, "sectionRef": "8914CL925145", "brand": "MICRON", "holder": "IT DIR", "reason": "OBSOLETE"},
    {"serial": 75, "sectionRef": "ZA 446/99", "brand": "MICRON", "holder": "IT DIR", "reason": "OBSOLETE"},
    {"serial": 76, "sectionRef": "ZA 1409", "brand": "HP", "holder": "IT DIR", "reason": "OBSOLETE"},
    {"serial": 77, "sectionRef": "ZA 545", "brand": "HP", "holder": "IT DIR", "reason": "OBSOLETE"},
    {"serial": 78, "sectionRef": "WZW-315", "brand": "HP", "holder": "IT DIR", "reason": "OBSOLETE"},
    {"serial": 79, "sectionRef": "0ZC9342XSI", "brand": "DELL", "holder": "IT DIR", "reason": "OBSOLETE"},
    {"serial": 80, "sectionRef": "43CKYZX", "brand": "DELL", "holder": "IT DIR", "reason": "OBSOLETE"},
    {"serial": 81, "sectionRef": "INTRON", "brand": "INTRON", "holder": "IT DIR", "reason": "OBSOLETE"},
    {"serial": 82, "sectionRef": "ZA 835", "brand": "HP", "holder": "IT DIR", "reason": "OBSOLETE"},
    {"serial": 83, "sectionRef": "ZA 518", "brand": "HP", "holder": "IT DIR", "reason": "OBSOLETE"},
    {"serial": 84, "sectionRef": "ZA 577", "brand": "LENOVO", "holder": "IT DIR", "reason": "OBSOLETE"},
    {"serial": 85, "sectionRef": "ZA 617", "brand": "HP", "holder": "IT DIR", "reason": "OBSOLETE"},
]


def parse_section_ref(section_ref: str) -> dict[str, str]:
    raw = section_ref.strip()
    if not raw:
        return {"zaNumber": "", "serialNo": "", "traceRef": ""}
    m = re.match(r"^ZA[\s-]?(\d+)$", raw, re.I)
    if m:
        return {"zaNumber": m.group(1), "serialNo": "", "traceRef": raw}
    m = re.match(r"^ZA\s*(\d+)\s*/\s*(.+)$", raw, re.I)
    if m:
        return {"zaNumber": m.group(1), "serialNo": m.group(2).strip(), "traceRef": raw}
    if raw.upper().startswith("ZA"):
        return {"zaNumber": "", "serialNo": raw, "traceRef": raw}
    return {"zaNumber": "", "serialNo": raw, "traceRef": raw}


def normalize_za(value: str) -> str:
    raw = value.strip().upper().replace(" ", "")
    if not raw:
        return ""
    m = re.match(r"^ZA-?(\d+)$", raw) or re.match(r"^(\d+)$", raw)
    return f"ZA{m.group(1)}" if m else ""


def map_unit(holder: str) -> str:
    h = holder.strip().upper()
    if h in ("IT DIR", "IT DIRECTORATE"):
        return "IT Directorate"
    if h == "OSD GP 3":
        return "OSD GP 3"
    if h == "BEB GP 3":
        return "BEB GP 3"
    return holder or "IT Directorate"


def us_reason(reason: str) -> str:
    return "beyond_economic" if reason.upper() == "BER" else "depreciated"


def designation(brand: str) -> str:
    b = brand.strip()
    if not b:
        return "Laptop (boarded)"
    if b.upper() == "INTRON":
        return "Laptop Intron"
    return f"Laptop {b.title()}"


def find_existing(records: list, parsed: dict, row_serial: int) -> dict | None:
    rec_id = f"icta-bs2023-r{row_serial}"
    for r in records:
        if r.get("id") == rec_id:
            return r
    za_norm = normalize_za(parsed["zaNumber"])
    if not za_norm:
        return None
    for r in records:
        if r.get("source") == SOURCE:
            continue
        if normalize_za(str(r.get("zaNumber") or "")) == za_norm:
            return r
    return None


def upsert_ict(records: list, partial: dict) -> None:
    rec_id = partial["id"]
    for i, r in enumerate(records):
        if r.get("id") == rec_id:
            records[i] = {**r, **partial, "id": r["id"], "createdAt": r.get("createdAt", partial["createdAt"])}
            return
    records.insert(0, partial)


def main() -> int:
    state = load_full_state()
    inv = state.setdefault("storesInventory", {"openings": {}, "transactions": []})
    ict = state.setdefault("ictAccountability", [])
    if not isinstance(ict, list):
        ict = []
        state["ictAccountability"] = ict

    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")
    summary = {"inserted": 0, "updated": 0, "rows": len(ROWS)}

    for row in ROWS:
        parsed = parse_section_ref(row["sectionRef"])
        unit = map_unit(row["holder"])
        existing = find_existing(ict, parsed, row["serial"])
        rec_id = existing["id"] if existing else f"icta-bs2023-r{row['serial']}"
        remarks = " · ".join([
            META["title"],
            f"Schedule row {row['serial']} ({META['scheduleRows']})",
            f"Request {META['requestRef']}",
            f"Confirmed {META['confirmationRef']}",
            META["disposalNote"],
        ])

        upsert_ict(
            ict,
            {
                "id": rec_id,
                "assetClass": "equipment",
                "designation": designation(row["brand"]),
                "description": f"Board of Survey — {row['brand']} laptop ({row['reason']})",
                "zaNumber": parsed["zaNumber"],
                "serialNo": parsed["serialNo"],
                "traceRef": parsed["traceRef"],
                "status": "condemned",
                "engraved": bool(parsed["zaNumber"]),
                "holderName": "",
                "unit": unit,
                "inventoryLedger": "inv-laptops",
                "glCharge": "3112210001",
                "usReason": us_reason(row["reason"]),
                "struckOffLedger": "both",
                "boardRef": META["boardRef"],
                "form1045Ref": META["form1045Ref"],
                "receivedDate": META["boardDate"],
                "remarks": remarks,
                "source": SOURCE,
                "scheduleSerial": row["serial"],
                "createdAt": existing.get("createdAt", now) if existing else now,
                "updatedAt": now,
            },
        )

        if existing:
            summary["updated"] += 1
            print(f"UPDATE row {row['serial']}: {row['sectionRef']} ({unit})")
        else:
            summary["inserted"] += 1
            print(f"INSERT row {row['serial']}: {row['sectionRef']} ({unit})")

    inv[KEY] = {
        "applied": True,
        "appliedAt": now,
        **META,
        **summary,
    }

    state["saveRevision"] = int(state.get("saveRevision") or 0) + 1
    state["savedAt"] = now
    state["savedBy"] = "Board schedule 2023 import"
    save_full_state(state, force=True)
    print(f"Done: {summary['inserted']} inserted, {summary['updated']} updated ({summary['rows']} schedule rows)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
