"""Apply IT Dir laptop distribution IVs (14 Aug 2026) from LAP-TOPS.docx.

Source document is not stored. Posts Q 1033 issue vouchers with ZA numbers.
Splits the unserialized 14 Aug OmniBook batch into unit receipts, then issues.
"""
from __future__ import annotations

import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from server import load_full_state, save_full_state  # noqa: E402

SOURCE = "laptop-distribution-aug2026"
KEY = "laptopDistributionAug2026"
IV_REV = 3
CUSTOM_OMNI_ID = "custom__inv-laptops__hp-omnibook-xflip-intel-core-ultra-9"

CATALOG = {
    "omnibook": {
        "itemId": "ict-equipment__hp-omnibook-x-flip-16",
        "name": "HP OmniBook X Flip 16 AI (Intel Core Ultra 9)",
    },
    "elitebook": {
        "itemId": "ict-equipment__hp-elitebook-840-g11",
        "name": "HP EliteBook 840 G11",
    },
    "legacy": {
        "itemId": "ict-equipment__hp-elitebook",
        "name": "HP EliteBook (prior issue)",
    },
}

PERSONNEL = [
    {"rank": "Maj", "name": "T Gahadza", "appointment": "OC Sys Admin", "issues": [{"date": "16/07/20"}]},
    {"rank": "Maj", "name": "AT Muzondo", "appointment": "OC Sys Dev", "issues": [{"za": "938", "date": "01/11/23"}]},
    {"rank": "Capt", "name": "TS Murandu", "appointment": "T/O", "issues": [{"za": "875", "date": "04/07/22"}]},
    {"rank": "Capt", "name": "K Mauya", "appointment": "OC DBA", "issues": [{"za": "684", "date": "16/07/20"}, {"za": "1103", "date": "14/08/26", "model": "omnibook"}]},
    {"rank": "Capt", "name": "B Nzvume", "appointment": "TO", "issues": [{"za": "696", "date": "28/07/20"}, {"za": "1061", "date": "14/08/26", "model": "omnibook"}]},
    {"rank": "Capt", "name": "DK Mashiri", "appointment": "TSO", "issues": [{"za": "692", "date": "16/07/20"}, {"za": "1100", "date": "14/08/26", "model": "omnibook"}]},
    {"rank": "Capt", "name": "TH Mugazda", "appointment": "DBA", "issues": [{"za": "687", "date": "16/07/20"}, {"za": "1046", "date": "14/08/26", "model": "omnibook"}]},
    {"rank": "Capt", "name": "CT Kupara", "appointment": "DBA", "issues": [{"za": "705", "date": "16/07/20"}, {"za": "1094", "date": "14/08/26", "model": "omnibook"}]},
    {"rank": "Capt", "name": "JI Magutorima", "appointment": "DBA", "issues": [{"za": "691", "date": "16/07/20"}, {"za": "1047", "date": "14/08/26", "model": "omnibook"}]},
    {"rank": "Capt", "name": "L Kativu", "appointment": "OCE", "issues": [{"za": "700", "date": "16/07/20"}, {"za": "1045", "date": "14/08/26", "model": "omnibook"}]},
    {"rank": "Capt", "name": "L Manyere", "appointment": "Sys Developer", "issues": [{"za": "701", "date": "16/07/20"}, {"za": "1042", "date": "14/08/26", "model": "omnibook"}]},
    {"rank": "Capt", "name": "C Batahana", "appointment": "Web Developer", "issues": [{"za": "685", "date": "16/07/20"}, {"za": "960", "date": "22/07/22"}, {"za": "1044", "date": "10/08/26", "model": "omnibook"}]},
    {"rank": "Capt", "name": "EC Magondo", "appointment": "DBA", "issues": [{"za": "960", "date": "16/07/20"}, {"za": "1095", "date": "14/08/26", "model": "omnibook"}]},
    {"rank": "Lt", "name": "T Katsande", "appointment": "TO", "issues": [{"za": "1060", "date": "14/08/26", "model": "omnibook"}]},
    {"rank": "Lt", "name": "P Chikuhwa", "appointment": "2IC Eng.", "issues": [{"za": "877", "date": "04/07/22"}]},
    {"rank": "WO2", "name": "J Mpandawana", "appointment": "RQ", "issues": [{"za": "1097", "date": "14/08/26", "model": "elitebook"}]},
    {"rank": "Sgt", "name": "Chari", "appointment": "Programmer", "issues": [{"za": "1041", "date": "14/08/26", "model": "elitebook"}]},
    {"rank": "Sgt", "name": "Chipato", "appointment": "Programmer", "issues": [{"za": "1043", "date": "14/08/26", "model": "elitebook"}]},
    {"rank": "Sgt", "name": "Mlambo AA", "appointment": "Programmer", "issues": [{"za": "1048", "date": "14/08/26", "model": "elitebook"}]},
    {"rank": "Sgt", "name": "Tenesi K", "appointment": "Programmer", "issues": [{"za": "1059", "date": "14/08/26", "model": "elitebook"}]},
    {"rank": "Sgt", "name": "Maziofa", "appointment": "Programmer", "issues": [{"za": "1062", "date": "14/08/26", "model": "omnibook"}]},
    {"rank": "Sgt", "name": "Chinodya M", "appointment": "Programmer", "issues": [{"za": "1065", "date": "14/08/26", "model": "omnibook"}]},
    {"rank": "Cpl", "name": "Kandeya", "appointment": "Programmer", "issues": [{"za": "1066", "date": "14/08/26", "model": "omnibook"}]},
]


def parse_date(raw: str) -> str:
    parts = raw.strip().split("/")
    if len(parts) != 3:
        return raw
    d, m, y = parts
    year = int(y)
    if year < 100:
        year += 2000
    return f"{year:04d}-{int(m):02d}-{int(d):02d}"


def day_before(iso: str) -> str:
    dt = datetime.strptime(iso, "%Y-%m-%d") - timedelta(days=1)
    return dt.strftime("%Y-%m-%d")


def holder_label(person: dict) -> str:
    return f"{person['rank']} {person['name']}".strip()


def za_key(za: str) -> str:
    raw = str(za or "").strip().upper().replace(" ", "")
    if not raw:
        return ""
    if raw.startswith("ZA"):
        return raw.replace("ZA-", "ZA")
    return f"ZA{raw}"


def yymm(iso: str) -> str:
    if len(iso) >= 7 and iso[4] == "-":
        return f"{iso[5:7]}{iso[2:4]}"
    return "0826"


def iv_no(iso: str, za: str) -> str:
    return f"IV/IT/{yymm(iso)}/{za}"


def rv_no(iso: str, za: str, kind: str) -> str:
    if kind == "ret":
        return f"RV/IT/{yymm(iso)}/RET-{za}"
    return f"RV/IT/{yymm(iso)}/ZA-{za}"


def norm_serial(value: str) -> str:
    return za_key(value) if value else ""


def find_txn(transactions: list, source_ref: str, txn_type: str):
    return next(
        (
            t
            for t in transactions
            if t.get("source") == SOURCE and t.get("sourceRef") == source_ref and t.get("type") == txn_type
        ),
        None,
    )


def serial_receipt_exists(transactions: list, serial: str) -> bool:
    key = norm_serial(serial)
    if not key:
        return False
    return any(
        t.get("type") == "receipt" and norm_serial(t.get("serialOrZa") or "") == key
        for t in transactions
    )


def upsert_ict(records: list, partial: dict) -> None:
    rec_id = partial["id"]
    for i, r in enumerate(records):
        if r.get("id") == rec_id:
            records[i] = {**r, **partial, "id": r["id"], "createdAt": r.get("createdAt", partial["createdAt"])}
            return
    records.insert(0, partial)


def ensure_txn(transactions: list, payload: dict) -> tuple[dict, bool]:
    existing = find_txn(transactions, payload["sourceRef"], payload["type"])
    serial = norm_serial(payload.get("serialOrZa") or "")
    if existing:
        if serial and not existing.get("serialOrZa"):
            existing["serialOrZa"] = serial
        if payload.get("voucherNo") and not existing.get("voucherNo"):
            existing["voucherNo"] = payload["voucherNo"]
        if payload.get("item"):
            existing["item"] = payload["item"]
        if payload.get("description"):
            existing["description"] = payload["description"]
        appt = str(payload.get("appointment") or "").strip()
        if appt and existing.get("appointment") != appt:
            existing["appointment"] = appt
        return existing, False
    txn = {
        "id": f"stk-ld-{int(datetime.now().timestamp() * 1000)}-{len(transactions)}",
        "date": payload["date"],
        "type": payload["type"],
        "itemId": payload["itemId"],
        "category": payload.get("category") or "ict-equipment",
        "item": payload["item"],
        "description": payload.get("description", ""),
        "qty": int(payload.get("qty") or 1),
        "uom": "EA",
        "gl": payload.get("gl") or "3112210001",
        "serialOrZa": serial,
        "voucherNo": payload.get("voucherNo", ""),
        "party": payload.get("party", ""),
        "appointment": str(payload.get("appointment") or "").strip(),
        "source": SOURCE,
        "sourceRef": payload["sourceRef"],
        "by": "Laptop distribution import",
        "createdAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z"),
    }
    transactions.append(txn)
    return txn, True


def find_bulk_receipt(transactions: list):
    candidates = []
    for t in transactions:
        if t.get("type") != "receipt":
            continue
        if t.get("source") == SOURCE:
            continue
        if norm_serial(t.get("serialOrZa") or ""):
            continue
        qty = float(t.get("qty") or 0)
        if qty <= 1:
            continue
        blob = f"{t.get('itemId', '')} {t.get('item', '')}".lower()
        if t.get("itemId") == CUSTOM_OMNI_ID or "omnibook" in blob:
            candidates.append(t)
    candidates.sort(key=lambda t: float(t.get("qty") or 0), reverse=True)
    return candidates[0] if candidates else None


def collect_aug_issues() -> list[dict]:
    rows = []
    for person in PERSONNEL:
        holder = holder_label(person)
        issues = sorted(person["issues"], key=lambda x: parse_date(x["date"]))
        for idx, issue in enumerate(issues):
            iso = parse_date(issue["date"])
            if not (iso >= "2026-08-01" and issue.get("model") and issue.get("za")):
                continue
            cat = CATALOG.get(issue["model"], CATALOG["legacy"])
            rows.append(
                {
                    "person": person,
                    "holder": holder,
                    "issue": issue,
                    "idx": idx,
                    "iso": iso,
                    "za": str(issue["za"]).strip(),
                    "cat": cat,
                    "prev": issues[idx - 1] if idx > 0 else None,
                }
            )
    rows.sort(key=lambda r: (r["iso"], r["za"]))
    return rows


def allocate_unit_receipts(txns: list, aug_rows: list, summary: dict) -> dict:
    item_by_za: dict[str, dict] = {}
    bulk = find_bulk_receipt(txns)
    if bulk and float(bulk.get("qty") or 0) >= len(aug_rows):
        remain_qty = int(float(bulk["qty"]) - len(aug_rows))
        batch_item_id = bulk["itemId"]
        batch_item_name = bulk.get("item") or CATALOG["omnibook"]["name"]
        batch_date = bulk.get("date") or "2026-08-14"
        batch_cat = bulk.get("category") or "inv-laptops"
        for i, row in enumerate(aug_rows):
            serial = za_key(row["za"])
            item_by_za[row["za"]] = {
                "itemId": batch_item_id,
                "item": row["cat"]["name"],
                "category": batch_cat,
            }
            if serial_receipt_exists(txns, serial):
                continue
            if i == 0:
                bulk["qty"] = 1
                bulk["serialOrZa"] = serial
                bulk["voucherNo"] = bulk.get("voucherNo") or rv_no(row["iso"], row["za"], "recv")
                bulk["item"] = row["cat"]["name"]
                extra = f"Allocated ZA{row['za']} — {row['holder']} (Q 1033/{row['za']})"
                prev = (bulk.get("description") or "").strip()
                bulk["description"] = f"{prev} — {extra}" if prev else extra
                summary["receipts"] += 1
                summary["convertedBulk"] = True
                print(f"CONVERT BATCH: {serial} -> {row['holder']}")
                continue
            _, created = ensure_txn(
                txns,
                {
                    "type": "receipt",
                    "date": batch_date,
                    "itemId": batch_item_id,
                    "item": row["cat"]["name"],
                    "category": batch_cat,
                    "gl": "3112210001",
                    "qty": 1,
                    "serialOrZa": serial,
                    "party": bulk.get("party") or "ICT procurement — laptop receipt",
                    "description": f"Unit receipt from 14 Aug batch — ZA{row['za']} for {row['holder']}",
                    "voucherNo": rv_no(row["iso"], row["za"], "recv"),
                    "sourceRef": f"{row['za']}-recv",
                },
            )
            if created:
                summary["receipts"] += 1
                print(f"RECV: {serial} {row['cat']['name']} for {row['holder']}")
        if remain_qty > 0 and not serial_receipt_exists(txns, "STORES-OMNI-REMAIN-1"):
            ensure_txn(
                txns,
                {
                    "type": "receipt",
                    "date": batch_date,
                    "itemId": batch_item_id,
                    "item": batch_item_name,
                    "category": batch_cat,
                    "gl": "3112210001",
                    "qty": 1,
                    "serialOrZa": "STORES-OMNI-REMAIN-1",
                    "party": bulk.get("party") or "ICT procurement — laptop receipt",
                    "description": "Unallocated unit from 14 Aug OmniBook batch (still in stores)",
                    "voucherNo": "RV/IT/0826/OMNI-REMAIN",
                    "sourceRef": "omni-remain-1",
                },
            )
            summary["receipts"] += 1
            print("RECV: STORES-OMNI-REMAIN-1 (unallocated)")
        return item_by_za

    for row in aug_rows:
        serial = za_key(row["za"])
        item_by_za[row["za"]] = {
            "itemId": row["cat"]["itemId"],
            "item": row["cat"]["name"],
            "category": "ict-equipment",
        }
        if serial_receipt_exists(txns, serial):
            continue
        _, created = ensure_txn(
            txns,
            {
                "type": "receipt",
                "date": day_before(row["iso"]),
                "itemId": row["cat"]["itemId"],
                "item": row["cat"]["name"],
                "category": "ict-equipment",
                "gl": "3112210001",
                "qty": 1,
                "serialOrZa": serial,
                "party": "ICT procurement — laptop receipt",
                "description": f"Stores receipt ZA{row['za']} before Q 1033 issue to {row['holder']}",
                "voucherNo": rv_no(row["iso"], row["za"], "recv"),
                "sourceRef": f"{row['za']}-recv",
            },
        )
        if created:
            summary["receipts"] += 1
            print(f"RECV: {serial} {row['cat']['name']} for {row['holder']}")
    return item_by_za


def main() -> int:
    state = load_full_state()
    inv = state.setdefault("storesInventory", {"openings": {}, "transactions": []})
    inv.setdefault("openings", {})
    txns = inv.setdefault("transactions", [])
    ict = state.setdefault("ictAccountability", [])
    if not isinstance(ict, list):
        ict = []
        state["ictAccountability"] = ict

    already = inv.get(KEY) or {}
    if already.get("applied") and int(already.get("ivRev") or 0) >= IV_REV:
        print("Already applied (ivRev >= 2). Use force by deleting storesInventory.laptopDistributionAug2026.")
        print(already)
        return 0

    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")
    summary = {
        "ict": 0,
        "receipts": 0,
        "returns": 0,
        "issues": 0,
        "holdersActive": 0,
        "convertedBulk": False,
    }

    for person in PERSONNEL:
        holder = holder_label(person)
        slug = person["name"].replace(" ", "-").lower()
        issues = sorted(person["issues"], key=lambda x: parse_date(x["date"]))
        for idx, issue in enumerate(issues):
            iso = parse_date(issue["date"])
            is_last = idx == len(issues) - 1
            status = "issued" if is_last else "returned"
            cat = CATALOG.get(issue.get("model", "legacy"), CATALOG["legacy"])
            rec_id = f"icta-ld-{slug}-{issue.get('za') or idx}"
            upsert_ict(
                ict,
                {
                    "id": rec_id,
                    "assetClass": "equipment",
                    "designation": cat["name"],
                    "description": f"{person['appointment']} — IT Dir laptop ({'current' if is_last else 'returned'})",
                    "zaNumber": issue.get("za") or "",
                    "status": status,
                    "engraved": bool(issue.get("za")),
                    "holderName": holder,
                    "unit": "IT Directorate",
                    "issueDate": iso,
                    "form1033Ref": f"Q1033/{issue['za']}" if issue.get("za") else "",
                    "inventoryLedger": "inv-laptops",
                    "glCharge": "3112210001",
                    "remarks": (
                        "Returned to stores before subsequent Q 1033 issue"
                        if status == "returned"
                        else "Distribution of laptops to IT Dir personnel — 14 Aug 2026"
                    ),
                    "createdAt": now,
                    "updatedAt": now,
                },
            )
            summary["ict"] += 1
            if is_last:
                summary["holdersActive"] += 1

    aug_rows = collect_aug_issues()
    item_by_za = allocate_unit_receipts(txns, aug_rows, summary)
    returned_za: set[str] = set()

    for row in aug_rows:
        prev = row["prev"] or {}
        prev_za = str(prev.get("za") or "").strip()
        if prev_za and prev_za not in returned_za:
            returned_za.add(prev_za)
            _, created = ensure_txn(
                txns,
                {
                    "type": "receipt",
                    "date": day_before(row["iso"]),
                    "itemId": CATALOG["legacy"]["itemId"],
                    "item": CATALOG["legacy"]["name"],
                    "category": "ict-equipment",
                    "gl": "3112210001",
                    "qty": 1,
                    "serialOrZa": za_key(prev_za),
                    "party": row["holder"],
                    "description": f"Return of previous laptop ZA{prev_za} before Q 1033/{row['za']} — {row['person']['name']}",
                    "voucherNo": rv_no(row["iso"], prev_za, "ret"),
                    "sourceRef": f"{prev_za}-return",
                },
            )
            if created:
                summary["returns"] += 1
                print(f"RETURN: {row['holder']} ZA{prev_za}")

        stock = item_by_za.get(row["za"]) or {
            "itemId": row["cat"]["itemId"],
            "item": row["cat"]["name"],
            "category": "ict-equipment",
        }
        _, created = ensure_txn(
            txns,
            {
                "type": "issue",
                "date": row["iso"],
                "itemId": stock["itemId"],
                "item": stock["item"],
                "category": stock.get("category") or "ict-equipment",
                "gl": "3112210001",
                "qty": 1,
                "serialOrZa": za_key(row["za"]),
                "party": row["holder"],
                "appointment": row["person"].get("appointment") or "",
                "description": f"Q 1033/{row['za']} — {row['person']['appointment']} — {row['cat']['name']}",
                "voucherNo": iv_no(row["iso"], row["za"]),
                "sourceRef": f"{row['za']}-issue",
            },
        )
        if created:
            summary["issues"] += 1
            print(f"IV: {iv_no(row['iso'], row['za'])}  {za_key(row['za'])}  {row['holder']}  {row['cat']['name']}")

    inv[KEY] = {
        "applied": True,
        "ivRev": IV_REV,
        "appliedAt": now,
        "title": "Distribution of laptops to IT Dir personnel as at 14 August 2026",
        "personnel": len(PERSONNEL),
        **summary,
    }

    state["saveRevision"] = int(state.get("saveRevision") or 0) + 1
    state["savedAt"] = now
    state["savedBy"] = "Laptop distribution import"
    save_full_state(state, force=True)
    print(
        f"Done: {summary['ict']} ICT records, {summary['receipts']} receipts, "
        f"{summary['returns']} returns, {summary['issues']} IVs"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
