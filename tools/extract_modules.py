#!/usr/bin/env python3
"""Extract each .form-container from app/index.html into app/modules/<id>.html"""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
INDEX = ROOT / "app" / "index.html"
OUT_DIR = ROOT / "app" / "modules"


def find_form_containers(html: str) -> list[tuple[str, int, int]]:
    """Return list of (module_id, start_index, end_index) for top-level form-containers."""
    results = []
    # Match opening tag with id + form-container (order of attrs may vary)
    pattern = re.compile(
        r'<div\b([^>]*\bclass="[^"]*\bform-container\b[^"]*"[^>]*)>',
        re.IGNORECASE,
    )
    for m in pattern.finditer(html):
        attrs = m.group(1)
        id_m = re.search(r'\bid="([^"]+)"', attrs)
        if not id_m:
            continue
        module_id = id_m.group(1)
        start = m.start()
        # Walk forward balancing <div ...> and </div>
        i = m.end()
        depth = 1
        while i < len(html) and depth > 0:
            next_open = html.find("<div", i)
            next_close = html.find("</div>", i)
            if next_close < 0:
                break
            if next_open >= 0 and next_open < next_close:
                # Is it a real open tag?
                depth += 1
                i = next_open + 4
            else:
                depth -= 1
                i = next_close + len("</div>")
        end = i
        results.append((module_id, start, end))
    return results


def main() -> None:
    html = INDEX.read_text(encoding="utf-8")
    blocks = find_form_containers(html)
    if not blocks:
        raise SystemExit("No form-containers found")

    OUT_DIR.mkdir(parents=True, exist_ok=True)

    # Replace from last to first so offsets stay valid
    new_html = html
    extracted = []
    for module_id, start, end in reversed(blocks):
        chunk = html[start:end].strip() + "\n"
        out_path = OUT_DIR / f"{module_id}.html"
        out_path.write_text(chunk, encoding="utf-8")
        extracted.append(module_id)
        # Leave a lightweight comment marker (loader injects real markup)
        marker = f'\n            <!-- module:{module_id} loaded on demand from modules/{module_id}.html -->\n'
        new_html = new_html[:start] + marker + new_html[end:]

    # Insert modules host if missing — place after dashboard closing area
    if 'id="modules-host"' not in new_html:
        host = '\n            <div id="modules-host" class="modules-host" aria-live="polite"></div>\n'
        # After dashboard block comment GL Account Forms or first module marker
        needle = "<!-- GL Account Forms -->"
        if needle in new_html:
            new_html = new_html.replace(needle, host + "            " + needle, 1)
        else:
            # After first module marker
            new_html = new_html.replace(
                "<!-- module:",
                host + "            <!-- module:",
                1,
            )

    INDEX.write_text(new_html, encoding="utf-8")

    manifest = OUT_DIR / "manifest.json"
    ids = list(reversed(extracted))
    import json

    manifest.write_text(json.dumps({"modules": ids}, indent=2), encoding="utf-8")
    print(f"Extracted {len(ids)} modules → {OUT_DIR}")
    print("Sample:", ", ".join(ids[:8]), "...")


if __name__ == "__main__":
    main()
