"""Parse IT DIR creditors Excel into supplier-debts seed JSON."""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from creditors_parse import parse_creditors_path  # noqa: E402


def main():
    src = Path(sys.argv[1] if len(sys.argv) > 1 else r"f:\IT CREDITORS RETURN AS AT 05 NOV 2025 RQ.xlsx")
    out = Path(sys.argv[2] if len(sys.argv) > 2 else Path(__file__).resolve().parent.parent / "app" / "js" / "it-dir-creditors-seed.js")
    data = parse_creditors_path(src)

    js = (
        "/* Auto-generated from IT DIR creditors register — do not edit by hand */\n"
        f"const IT_DIR_CREDITORS_SEED = {json.dumps(data, indent=2)};\n"
    )
    out.write_text(js, encoding="utf-8")
    print(f"Wrote {out}")
    print(f"  {data['caseCount']} supplier case(s), {data['lineCount']} line(s), USD {data['totalUsd']:,.2f}")


if __name__ == "__main__":
    main()
