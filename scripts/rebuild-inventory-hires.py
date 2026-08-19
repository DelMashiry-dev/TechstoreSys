"""Rebuild inventory product PNGs at zoom-friendly resolution from _raw sources.

Falls back to leaving files that have no raw source (re-fetch those separately).
"""
from __future__ import annotations

import importlib.util
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "inventory"
RAW = OUT / "_raw"

spec = importlib.util.spec_from_file_location(
    "fetch", Path(__file__).resolve().parent / "fetch-inventory-product-images.py"
)
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)

SIZE = m.PRODUCT_IMAGE_SIZE
done = skipped = 0

# Map raw stem prefixes to output names (raw may keep original extension)
raw_files = list(RAW.glob("*")) if RAW.exists() else []
print(f"raw files: {len(raw_files)}  target size: {SIZE}")

# Prefer rebuilding every finished PNG that has a matching raw stem
for out_png in sorted(OUT.glob("*.png")):
    if out_png.name.startswith("_"):
        continue
    stem = out_png.stem
    candidates = [p for p in raw_files if p.stem == stem or p.name.startswith(stem + ".")]
    if not candidates:
        # also try stem without color suffix match already exact
        skipped += 1
        continue
    src = max(candidates, key=lambda p: p.stat().st_size)
    try:
        img = Image.open(src).convert("RGBA")
    except Exception as e:
        print(f"skip {stem}: {e}")
        skipped += 1
        continue
    if img.width < 80 or img.height < 80:
        skipped += 1
        continue
    # Don't use laptop reject on rebuild — raw is already chosen
    cleared = m.flood_clear(img, tol=48)
    cov = m.alpha_coverage(cleared)
    if cov < 0.05:
        fitted = m.fit_square(img, SIZE)
    else:
        fitted = m.fit_square(cleared, SIZE)
    fitted.save(out_png, "PNG", optimize=True)
    print(f"OK  {out_png.name}  from {src.name}  {fitted.size}")
    done += 1

print(f"rebuilt={done} no_raw={skipped}")
