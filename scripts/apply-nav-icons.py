"""Replace text sidebar nav icons with matched sheet PNGs."""
from pathlib import Path
import re

INDEX = Path(r"c:\Users\TECHSTORES\Documents\TECHSTORESys\app\index.html")
html = INDEX.read_text(encoding="utf-8")

# data-target -> icon file key
TARGET_ICONS = {
    "dashboard": "dashboard",
    "accommodation-stores": "accommodation-stores",
    "delivery-note": "delivery-note",
    "dp-f1-form": "dp-f1-form",
    "cost-comparative-schedule": "cost-comparative-schedule",
    "duties-roles": "duties-roles",
    "techstores-equipment-register": "techstores-equipment-register",
    "financial-year-bids": "financial-year-bids",
    "gate-register": "gate-register",
    "dp-procurement": "dp-procurement",
    "voucher-module": "voucher-module",
    "process-guides": "process-guides",
    "monthly-returns": "monthly-returns",
    "orderly-room": "orderly-room",
    "purchase-orders": "purchase-orders",
    "release-cut": "release-cut",
    "reports-module": "reports-module",
    "stock-take": "stock-take",
    "suppliers-contracts": "suppliers-contracts",
    "system-help": "system-help",
    "temporary-loans": "temporary-loans",
    "undelivered-orders": "undelivered-orders",
    "unit-checks": "unit-checks",
    "unit-equipment": "unit-equipment",
    "unit-requisitions": "unit-requisitions",
    "user-management": "user-management",
    "workshop-repairs": "workshop-repairs",
    "ict-accountability": "ict-accountability",
    "ict-distribution": "ict-distribution",
}

def img_tag(key: str) -> str:
    return (
        f'<img class="nav-ico-img" src="../assets/nav-icons/{key}.png" '
        f'alt="" width="24" height="24" loading="lazy">'
    )

# Replace any existing icon (span.nav-ico OR img.nav-ico-img) inside an <a ... data-target="...">
for target, key in TARGET_ICONS.items():
    pattern = re.compile(
        rf'(<a\b[^>]*\bdata-target="{re.escape(target)}"[^>]*>\s*)'
        r'(?:<span class="nav-ico[^"]*"[^>]*>.*?</span>|'
        r'<img class="nav-ico-img[^"]*"[^>]*>)',
        re.IGNORECASE | re.DOTALL,
    )
    repl = rf'\1{img_tag(key)}'
    html2, n = pattern.subn(repl, html, count=1)
    if n == 0:
        # try broader: first child icon after opening a tag with data-target
        pattern2 = re.compile(
            rf'(<a\b[^>]*\bdata-target="{re.escape(target)}"[^>]*>\s*)'
            r'(?:<span class="nav-ico[^"]*"[^>]*>[\s\S]*?</span>|'
            r'<img[^>]*nav-ico-img[^>]*>)',
            re.IGNORECASE,
        )
        html2, n = pattern2.subn(repl, html, count=1)
    if n == 0:
        print(f"WARN: no icon replace for {target}")
    else:
        print(f"OK {target} -> {key}")
    html = html2

# Submenu toggles (no data-target on parent)
TOGGLE_REPLACEMENTS = [
    (
        r'(<a href="#" class="nav-btn gl-accounts-toggle nav-submenu-toggle">\s*)'
        r'(?:<span class="nav-ico[^"]*"[^>]*>.*?</span>|<img class="nav-ico-img[^"]*"[^>]*>)',
        rf'\1{img_tag("gl-accounts")}',
        "gl-accounts toggle",
    ),
    (
        r'(<a href="#" class="nav-btn nav-submenu-toggle">\s*'
        r')(?:<span class="nav-ico[^"]*"[^>]*>.*?</span>|<img class="nav-ico-img[^"]*"[^>]*>)'
        r'(\s*<span class="nav-label">IT Dir Departments</span>)',
        rf'\1{img_tag("it-dir-departments")}\2',
        "it-dir-departments toggle",
    ),
    (
        r'(<a href="#" class="nav-btn nav-submenu-toggle">\s*)'
        r'(?:<span class="nav-ico[^"]*"[^>]*>.*?</span>|<img class="nav-ico-img[^"]*"[^>]*>)'
        r'(\s*<span class="nav-label">Workshop/Engineering Sp Dept</span>)',
        rf'\1{img_tag("workshop-repairs")}\2',
        "workshop toggle",
    ),
    (
        r'(<a href="#" class="nav-btn nav-submenu-toggle">\s*)'
        r'(?:<span class="nav-ico[^"]*"[^>]*>.*?</span>|<img class="nav-ico-img[^"]*"[^>]*>)'
        r'(\s*<span class="nav-label">ZNA QM Forms</span>)',
        rf'\1{img_tag("zna-qm-forms")}\2',
        "zna-qm-forms toggle",
    ),
]

for pat, repl, label in TOGGLE_REPLACEMENTS:
    html2, n = re.subn(pat, repl, html, count=1, flags=re.IGNORECASE | re.DOTALL)
    print(("OK" if n else "WARN"), label)
    html = html2

INDEX.write_text(html, encoding="utf-8")
print("Updated", INDEX)
