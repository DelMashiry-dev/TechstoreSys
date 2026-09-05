#!/usr/bin/env python3
"""CLI: parse an IT DIR / FY Bids Excel workbook and print a short summary."""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from bids_parse import parse_bids_path  # noqa: E402


def main() -> int:
    ap = argparse.ArgumentParser(description="Parse IT DIR BIDS Excel into JSON summary")
    ap.add_argument("xlsx", type=Path, help="Path to .xlsx bids workbook")
    ap.add_argument("--json", action="store_true", help="Print full pack JSON")
    args = ap.parse_args()
    pack = parse_bids_path(args.xlsx)
    if args.json:
        print(json.dumps(pack, indent=2))
    else:
        print(f"{pack['file']}: {pack['itemCount']} lines · USD {pack['totalCost']:,.2f}")
        print("Sheets:", ", ".join(pack.get("sheetsUsed") or []))
        for gl, amt in (pack.get("byGl") or {}).items():
            print(f"  {gl}: ${amt:,.2f}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
