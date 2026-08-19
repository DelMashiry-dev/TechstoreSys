"""Rebuild docs/ZNA-Q-Forms-Purpose-Guide.html from catalogue + regenerate PDF."""
from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
JS = ROOT / "app" / "js" / "zna-q-catalogue.js"
OUT_HTML = ROOT / "docs" / "ZNA-Q-Forms-Purpose-Guide.html"
OUT_PDF = ROOT / "docs" / "ZNA-Q-Forms-Purpose-Guide.pdf"

js = JS.read_text(encoding="utf-8")
pat = re.compile(
    r"\{ code: '([^']+)', title: '((?:\\'|[^'])*)', moduleId: (null|'[^']*'), scope: '([^']+)' \}"
)
entries = []
for m in pat.finditer(js):
    code, title, mid, scope = m.groups()
    title = title.replace("\\'", "'")
    module_id = None if mid == "null" else mid.strip("'")
    entries.append({"code": code, "title": title, "moduleId": module_id, "scope": scope})

impl = [e for e in entries if e["moduleId"]]
rows = "\n".join(
    f"<tr><td class=\"form-code\">ZNA-Q-{e['code']}</td><td>{e['title']}</td>"
    f"<td>{'In system' if e['moduleId'] else 'Reference'}</td></tr>"
    for e in entries
)

html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>SUMMARY OF Q FORMS — Purpose Guide — RESTRICTED</title>
<style>
  :root {{ --navy:#1a365d; --ink:#1e293b; --muted:#64748b; --line:#c5d0de; --paper:#f7f9fc; }}
  * {{ box-sizing:border-box; }}
  body {{ margin:0; font-family:"Segoe UI",Calibri,sans-serif; color:var(--ink);
    background:linear-gradient(165deg,#e8eef6 0%,var(--paper) 45%,#eef2f7 100%); line-height:1.45; }}
  .page {{ max-width:920px; margin:0 auto; padding:24px 20px 56px; }}
  .toolbar {{ display:flex; justify-content:flex-end; margin-bottom:14px; }}
  .toolbar button {{ border:1px solid var(--navy); background:var(--navy); color:#fff; padding:9px 16px; border-radius:4px; cursor:pointer; }}
  .banner {{ text-align:center; border:2px solid var(--navy); background:#fff; padding:16px 18px 20px; margin-bottom:18px; }}
  .classif {{ font-weight:700; letter-spacing:.14em; color:var(--navy); font-size:.82rem; }}
  h1 {{ margin:8px 0 4px; font-size:1.4rem; color:var(--navy); }}
  .sub {{ margin:0; color:var(--muted); font-size:.92rem; }}
  h2 {{ color:var(--navy); font-size:1.05rem; margin:22px 0 8px; border-bottom:2px solid var(--navy); padding-bottom:3px; }}
  table {{ width:100%; border-collapse:collapse; background:#fff; font-size:.8rem; }}
  th, td {{ border:1px solid var(--line); padding:6px 7px; vertical-align:top; text-align:left; }}
  th {{ background:var(--navy); color:#fff; }}
  tr:nth-child(even) td {{ background:#f3f7fb; }}
  .form-code {{ font-weight:700; color:var(--navy); white-space:nowrap; }}
  .note {{ background:#fff; border:1px solid var(--line); padding:12px 14px; margin-top:10px; font-size:.88rem; }}
  footer {{ text-align:center; margin-top:26px; font-size:.8rem; color:var(--muted); }}
  @media print {{
    body {{ background:#fff; }} .toolbar {{ display:none !important; }}
    th, tr:nth-child(even) td {{ -webkit-print-color-adjust:exact; print-color-adjust:exact; }}
  }}
</style>
</head>
<body>
  <div class="page">
    <div class="toolbar"><button type="button" onclick="window.print()">Print / Save as PDF</button></div>
    <header class="banner">
      <div class="classif">RESTRICTED</div>
      <h1>SUMMARY OF Q FORMS</h1>
      <p class="sub">Annex A to Section 1 Chapter 7 · IT Dir Tech Stores</p>
      <p class="sub">{len(entries)} forms listed · {len(impl)} fillable in TechStores · 28 July 2026</p>
    </header>

    <h2>1. Official catalogue (ZNA-Q-1 … higher forms)</h2>
    <table>
      <thead><tr><th style="width:16%">Form</th><th>Subject matter</th><th style="width:14%">Status</th></tr></thead>
      <tbody>
{rows}
      </tbody>
    </table>

    <div class="note">
      <strong>In the app:</strong> open <em>ZNA QM Forms → Q Forms Index</em> to search and open fillable modules.
      Forms marked <em>Reference</em> are listed for ASO completeness (use the paper form when required).
      Note: ZNA-Q-22 is hired/requisitioned property proforma; <strong>ZNA-Q-23</strong> is the Vehicle log book (Annex A).
    </div>

    <footer><strong>RESTRICTED</strong> — End of SUMMARY OF Q FORMS<br>File: docs/ZNA-Q-Forms-Purpose-Guide.html</footer>
  </div>
</body>
</html>
"""
OUT_HTML.write_text(html, encoding="utf-8")
print(f"Wrote {OUT_HTML} ({len(entries)} forms, {len(impl)} in system)")

chrome = Path(r"C:\Program Files\Google\Chrome\Application\chrome.exe")
if chrome.exists():
    if OUT_PDF.exists():
        OUT_PDF.unlink()
    uri = OUT_HTML.as_uri()
    subprocess.run(
        [str(chrome), "--headless", "--disable-gpu", "--no-pdf-header-footer", f"--print-to-pdf={OUT_PDF}", uri],
        check=False,
    )
    if OUT_PDF.exists():
        print(f"Wrote {OUT_PDF} ({OUT_PDF.stat().st_size} bytes)")
    else:
        print("PDF not created")
else:
    print("Chrome not found — HTML only")
