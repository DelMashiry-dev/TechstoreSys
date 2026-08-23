"""Apply IT Dir laptop distribution (14 Aug 2026) from LAP-TOPS.docx."""
from __future__ import annotations

import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from server import load_full_state, save_full_state  # noqa: E402

SOURCE = "laptop-distribution-aug2026"
KEY = "laptopDistributionAug2026"

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


def txn_exists(transactions: list, source_ref: str, txn_type: str) -> bool:
    return any(
        t.get("source") == SOURCE and t.get("sourceRef") == source_ref and t.get("type") == txn_type
        for t in transactions
    )


def upsert_ict(records: list, partial: dict) -> None:
    rec_id = partial["id"]
    for i, r in enumerate(records):
        if r.get("id") == rec_id:
            records[i] = {**r, **partial, "id": r["id"], "createdAt": r.get("createdAt", partial["createdAt"])}
            return
    records.insert(0, partial)


def post_stock(transactions: list, payload: dict) -> None:
    transactions.append(
        {
            "id": f"stk-ld-{int(datetime.now().timestamp() * 1000)}-{len(transactions)}",
            "date": payload["date"],
            "type": payload["type"],
            "itemId": payload["itemId"],
            "category": "ict-equipment",
            "item": payload["item"],
            "description": payload.get("description", ""),
            "qty": 1,
            "uom": "EA",
            "gl": "3112210001",
            "voucherNo": payload.get("voucherNo", ""),
            "party": payload.get("party", ""),
            "source": SOURCE,
            "sourceRef": payload["sourceRef"],
            "by": "Laptop distribution import",
            "createdAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z"),
        }
    )


def main() -> int:
    state = load_full_state()
    inv = state.setdefault("storesInventory", {"openings": {}, "transactions": []})
    inv.setdefault("openings", {})
    txns = inv.setdefault("transactions", [])
    ict = state.setdefault("ictAccountability", [])
    if not isinstance(ict, list):
        ict = []
        state["ictAccountability"] = ict

    summary = {"ict": 0, "returns": 0, "issues": 0}

    for person in PERSONNEL:
        holder = holder_label(person)
        slug = person["name"].replace(" ", "-").lower()
        issues = sorted(person["issues"], key=lambda x: parse_date(x["date"]))

        for idx, issue in enumerate(issues):
            iso = parse_date(issue["date"])
            is_last = idx == len(issues) - 1
            is_aug2026 = iso >= "2026-08-01" and issue.get("model")
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
                    "createdAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z"),
                    "updatedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z"),
                },
            )
            summary["ict"] += 1

            if not is_aug2026:
                continue

            za = issue["za"]
            return_ref = f"{za}-return"
            issue_ref = f"{za}-issue"

            if idx > 0 and not txn_exists(txns, return_ref, "receipt"):
                post_stock(
                    txns,
                    {
                        "type": "receipt",
                        "date": day_before(iso),
                        "itemId": CATALOG["legacy"]["itemId"],
                        "item": CATALOG["legacy"]["name"],
                        "party": holder,
                        "description": f"Return of initial/previous laptop before Q 1033/{za} — {person['name']}",
                        "voucherNo": f"RV/IT/0826/RET-{za}",
                        "sourceRef": return_ref,
                    },
                )
                summary["returns"] += 1
                print(f"RETURN: {holder} before Q1033/{za}")

            if not txn_exists(txns, issue_ref, "issue"):
                post_stock(
                    txns,
                    {
                        "type": "issue",
                        "date": iso,
                        "itemId": cat["itemId"],
                        "item": cat["name"],
                        "party": holder,
                        "description": f"Q 1033/{za} — {person['appointment']}",
                        "voucherNo": f"IV/IT/0826/{za}",
                        "sourceRef": issue_ref,
                    },
                )
                summary["issues"] += 1
                print(f"ISSUE: {holder} Q1033/{za} — {cat['name']}")

    inv[KEY] = {
        "applied": True,
        "appliedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z"),
        "title": "Distribution of laptops to IT Dir personnel as at 14 August 2026",
        "personnel": len(PERSONNEL),
        **summary,
    }

    state["saveRevision"] = int(state.get("saveRevision") or 0) + 1
    state["savedAt"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")
    state["savedBy"] = "Laptop distribution import"
    save_full_state(state, force=True)
    print(f"Done: {summary['ict']} ICT records, {summary['returns']} returns, {summary['issues']} issues")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
