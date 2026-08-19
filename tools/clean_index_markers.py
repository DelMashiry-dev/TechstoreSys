from pathlib import Path
import re

p = Path("app/index.html")
html = p.read_text(encoding="utf-8")
html2 = re.sub(r"\n\s*<!-- module:[^>]+-->\s*", "\n", html)
html2 = re.sub(r"\n{3,}", "\n\n", html2)
p.write_text(html2, encoding="utf-8")
print("lines", len(html2.splitlines()))
print("host", 'id="modules-host"' in html2)
print("loader", "module-loader.js" in html2)
print("form-containers left", len(re.findall(r'class="[^"]*form-container', html2)))
