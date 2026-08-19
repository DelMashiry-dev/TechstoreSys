"""
Search online for product pack shots, save transparent PNGs under assets/inventory,
and emit a JS mapping keyed by catalog item id / name.

Usage:
  python scripts/fetch-inventory-product-images.py
  python scripts/fetch-inventory-product-images.py --limit 20
  python scripts/fetch-inventory-product-images.py --skip-existing
  python scripts/fetch-inventory-product-images.py --mode ict --skip-existing

Images are saved as transparent PNGs (solid backgrounds removed) for internal TECHSTORESys
inventory display. Prefer manufacturer / retailer product photos.
"""
from __future__ import annotations

import argparse
import json
import re
import time
from collections import deque
from io import BytesIO
from pathlib import Path
from urllib.parse import urlparse

import requests
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
CATALOG = ROOT / "app" / "js" / "catalog.js"
OUT_DIR = ROOT / "assets" / "inventory"
RAW_DIR = ROOT / "assets" / "inventory" / "_raw"
MAP_JSON = ROOT / "scripts" / "inventory-product-image-map.json"
JS_FILE = ROOT / "app" / "js" / "product-stock-register.js"

UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
)

PREFERRED_HOST_FRAGMENTS = (
    "ssl-product-images.www8-hp.com",
    "media.cdn.hp.com",
    "static.bhphotovideo.com",
    "bhphoto",
    "cdw.com",
    "insight.com",
    "canon.com",
    "canon.co",
    "officdepot",
    "staples",
    "walmartimages",
    "inktechnologies",
)

REJECT_URL_FRAGMENTS = (
    "redefine",
    "elitebook",
    "treatment/mdps",
    "favicon",
    "logo",
    "/icon",
    "sprite",
    "moustache",
    "banner",
    "hero-",
    "lifestyle",
)


def color_dist(a: tuple[int, int, int], b: tuple[int, int, int]) -> float:
    return abs(a[0] - b[0]) + abs(a[1] - b[1]) + abs(a[2] - b[2])


def sample_bg(img: Image.Image) -> tuple[int, int, int]:
    w, h = img.size
    px = img.load()
    pts = [
        (0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1),
        (w // 2, 0), (w // 2, h - 1), (0, h // 2), (w - 1, h // 2),
        (2, 2), (w - 3, 2), (2, h - 3), (w - 3, h - 3),
    ]
    rs = gs = bs = n = 0
    for x, y in pts:
        r, g, b, a = px[x, y]
        if a < 20:
            continue
        rs += r
        gs += g
        bs += b
        n += 1
    if not n:
        return (255, 255, 255)
    return (rs // n, gs // n, bs // n)


def is_bg_pixel(r: int, g: int, b: int, bg: tuple[int, int, int], tol: int) -> bool:
    if color_dist((r, g, b), bg) <= tol:
        return True
    if min(r, g, b) >= 220 and abs(r - g) < 20 and abs(g - b) < 20:
        return True
    if 165 <= min(r, g, b) and max(r, g, b) <= 225 and abs(r - g) < 14 and abs(g - b) < 14:
        if color_dist((r, g, b), bg) <= tol + 40:
            return True
    if max(r, g, b) <= 28 and bg[0] <= 40 and bg[1] <= 40 and bg[2] <= 40:
        return True
    return False


def flood_from_seeds(img: Image.Image, seeds: list[tuple[int, int]], bg: tuple[int, int, int], tol: int) -> None:
    w, h = img.size
    px = img.load()
    visited = [[False] * w for _ in range(h)]
    q: deque[tuple[int, int]] = deque()
    for x, y in seeds:
        if 0 <= x < w and 0 <= y < h and not visited[y][x]:
            r, g, b, a = px[x, y]
            if a == 0 or is_bg_pixel(r, g, b, bg, tol):
                visited[y][x] = True
                q.append((x, y))
    while q:
        x, y = q.popleft()
        px[x, y] = (0, 0, 0, 0)
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < w and 0 <= ny < h and not visited[ny][nx]:
                r, g, b, a = px[nx, ny]
                if a == 0 or is_bg_pixel(r, g, b, bg, tol):
                    visited[ny][nx] = True
                    q.append((nx, ny))


def expand_into_plate(img: Image.Image, bg: tuple[int, int, int], tol: int) -> None:
    w, h = img.size
    px = img.load()
    q: deque[tuple[int, int]] = deque()
    for y in range(h):
        for x in range(w):
            if px[x, y][3] == 0:
                q.append((x, y))
    while q:
        x, y = q.popleft()
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if not (0 <= nx < w and 0 <= ny < h):
                continue
            r, g, b, a = px[nx, ny]
            if a == 0:
                continue
            plate = (
                (min(r, g, b) >= 200 and abs(r - g) < 22 and abs(g - b) < 22)
                or (165 <= min(r, g, b) <= 230 and abs(r - g) < 16 and abs(g - b) < 16)
                or (max(r, g, b) <= 30 and bg[0] <= 45)
                or color_dist((r, g, b), bg) <= tol
            )
            if plate:
                px[nx, ny] = (0, 0, 0, 0)
                q.append((nx, ny))


def flood_clear(img: Image.Image, tol: int = 48) -> Image.Image:
    img = img.convert("RGBA")
    w, h = img.size
    bg = sample_bg(img)
    seeds = []
    for x in range(w):
        seeds.append((x, 0))
        seeds.append((x, h - 1))
    for y in range(h):
        seeds.append((0, y))
        seeds.append((w - 1, y))
    flood_from_seeds(img, seeds, bg, tol)
    expand_into_plate(img, bg, tol + 12)
    return img


# Table thumbs are CSS-scaled (~40px); zoom/lightbox needs a sharp source.
PRODUCT_IMAGE_SIZE = 720


def fit_square(img: Image.Image, size: int = PRODUCT_IMAGE_SIZE) -> Image.Image:
    bbox = img.getbbox()
    if bbox:
        l, t, r, b = bbox
        pad = 6
        l = max(0, l - pad)
        t = max(0, t - pad)
        r = min(img.size[0], r + pad)
        b = min(img.size[1], b + pad)
        img = img.crop((l, t, r, b))
    w, h = img.size
    side = max(w, h, 1)
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    canvas.paste(img, ((side - w) // 2, (side - h) // 2), img)
    return canvas.resize((size, size), Image.Resampling.LANCZOS)


def parse_catalog_items() -> list[dict]:
    text = CATALOG.read_text(encoding="utf-8")
    return [
        {"id": m.group(1), "name": m.group(2)}
        for m in re.finditer(r'"id":\s*"([^"]+)",\s*\n\s*"name":\s*"([^"]+)"', text)
    ]


def extract_sku(name: str) -> str | None:
    """Return normalized SKU like CE505A / W2030A / EXV54."""
    n = name.upper()
    m = re.search(r"\b([A-Z]{1,2}\d{3,4}[A-Z]?X?)\b", n)
    if m:
        return m.group(1)
    m = re.search(r"\b(?:C-?EXV|EXV)\s*(\d+)\b", n)
    if m:
        return f"EXV{m.group(1)}"
    return None


def file_slug_for_item(item_id: str, name: str) -> str:
    """Prefer catalog id tail; fall back to SKU."""
    tail = item_id.split("__", 1)[-1]
    tail = re.sub(r"[^a-z0-9\-]+", "-", tail.lower()).strip("-")
    sku = extract_sku(name)
    brand = "hp" if re.search(r"\bhp\b", name, re.I) else (
        "canon" if re.search(r"\bcanon\b", name, re.I) else "item"
    )
    color = item_color(name)
    color_suffix = f"-{color}" if color else ""
    if sku and sku.startswith("EXV"):
        return f"{brand}-{sku.lower()}{color_suffix}"
    if sku:
        # Catalog sometimes reuses one OEM code for all colors (e.g. W2070A 117A set)
        if color and re.search(r"w2070|117a", item_id, re.I):
            return f"{brand}-{sku.lower()}{color_suffix}"
        return f"{brand}-{sku.lower()}"
    return tail or "product"


def item_color(name: str) -> str | None:
    for c in ("black", "cyan", "magenta", "yellow"):
        if re.search(rf"\b{c}\b", name, re.I):
            return c
    return None


def search_query(name: str) -> str:
    sku = extract_sku(name) or ""
    color = item_color(name) or ""
    if re.search(r"\bhp\b", name, re.I):
        return f'HP {sku} {color} "toner cartridge" box -laptop -notebook'.strip()
    if re.search(r"\bcanon\b", name, re.I):
        return f'Canon {sku} {color} toner cartridge box -laptop'.strip()
    return f"{name} toner cartridge product photo"


def url_rejected(url: str) -> bool:
    u = url.lower()
    return any(frag in u for frag in REJECT_URL_FRAGMENTS)


def host_score(url: str, sku: str | None = None, color: str | None = None) -> int:
    host = urlparse(url).netloc.lower()
    u = url.lower()
    if url_rejected(url):
        return -9999
    score = 0
    for i, frag in enumerate(PREFERRED_HOST_FRAGMENTS):
        if frag in host or frag in u:
            score += 120 - i
    if u.endswith(".png") or ".png?" in u:
        score += 20
    if sku and sku.lower() in u:
        score += 200
    elif sku:
        score -= 80  # strongly prefer SKU in URL path
    if color and color.lower() in u:
        score += 40
    if "toner" in u or "cartridge" in u:
        score += 25
    if "laptop" in u or "notebook" in u or "elitebook" in u:
        score -= 200
    return score


def search_image_urls(
    query: str,
    sku: str | None = None,
    color: str | None = None,
    max_results: int = 18,
    score_fn=None,
) -> list[str]:
    try:
        from ddgs import DDGS
    except ImportError:
        from duckduckgo_search import DDGS  # type: ignore

    results = []
    try:
        ddgs = DDGS()
        try:
            hits = ddgs.images(query=query, max_results=max_results, safesearch="moderate")
        except TypeError:
            hits = ddgs.images(query, max_results=max_results)
        for h in hits or []:
            url = h.get("image") or h.get("url") or ""
            title = (h.get("title") or "").lower()
            if not url.startswith("http") or url_rejected(url):
                continue
            if score_fn is None and "laptop" in title and "toner" not in title:
                continue
            results.append(url)
    except Exception as e:
        print(f"  search error: {e}")
    rank = score_fn if score_fn else (lambda u: host_score(u, sku, color))
    results.sort(key=rank, reverse=True)
    seen = set()
    out = []
    for u in results:
        if u not in seen:
            seen.add(u)
            out.append(u)
    # Prefer candidates that contain the SKU in the URL
    if sku:
        with_sku = [u for u in out if sku.lower() in u.lower()]
        without = [u for u in out if sku.lower() not in u.lower()]
        out = with_sku + without
    return out


def download_image(url: str, timeout: int = 25) -> Image.Image | None:
    try:
        r = requests.get(url, headers={"User-Agent": UA, "Accept": "image/*,*/*"}, timeout=timeout)
        r.raise_for_status()
        if len(r.content) < 1500:
            return None
        img = Image.open(BytesIO(r.content))
        img.load()
        if img.width < 80 or img.height < 80:
            return None
        if img.width > 2200 or img.height > 2200:
            img.thumbnail((1600, 1600), Image.Resampling.LANCZOS)
        return img.convert("RGBA")
    except Exception:
        return None


def alpha_coverage(img: Image.Image) -> float:
    """Fraction of non-transparent pixels after clear — avoid empty or uncleared frames."""
    a = img.split()[-1]
    hist = a.histogram()
    opaque = sum(hist[32:])
    return opaque / max(sum(hist), 1)


def looks_like_dark_laptop(img: Image.Image) -> bool:
    """Reject HP marketing laptop silhouettes that sometimes rank above toner shots."""
    small = img.convert("RGBA").resize((64, 64), Image.Resampling.BILINEAR)
    px = list(small.getdata())
    dark = sum(1 for r, g, b, a in px if a > 40 and max(r, g, b) < 45)
    bright = sum(1 for r, g, b, a in px if a > 40 and min(r, g, b) > 200)
    opaque = sum(1 for r, g, b, a in px if a > 40)
    if opaque < 80:
        return False
    # Mostly near-black with a few specular whites → laptop silhouette
    return (dark / opaque) > 0.72 and bright < 25


def process_and_save(img: Image.Image, out_path: Path) -> bool:
    if looks_like_dark_laptop(img):
        return False
    cleared = flood_clear(img, tol=48)
    if looks_like_dark_laptop(cleared):
        return False
    cov = alpha_coverage(cleared)
    if cov < 0.08 or cov > 0.95:
        return False
    fitted = fit_square(cleared, PRODUCT_IMAGE_SIZE)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    fitted.save(out_path, "PNG")
    return True


def priority_items(items: list[dict]) -> list[dict]:
    out = []
    for i in items:
        if not i["id"].startswith("consumables-toners__"):
            continue
        name = i["name"]
        if not re.search(r"\b(hp|canon)\b", name, re.I):
            continue
        if not extract_sku(name):
            continue
        out.append(i)
    return out


ICT_REFRESH_IDS = (
    "ict-equipment__hp-laserjet-enterprise-m507dn",
    "ict-equipment__hp-laserjet-enterprise-mfp-m528dn",
    "ict-equipment__hp-color-laserjet-enterprise-m554dn",
    "ict-equipment__canon-imagerunner-advance-dx-c3926i",
    "ict-equipment__canon-imagerunner-advance-dx-c5840i",
    "ict-equipment__xerox-altalink-c8155",
    "ict-equipment__kyocera-taskalfa-2554ci",
    "ict-equipment__hp-designjet-t650",
    "ict-equipment__epson-workforce-pro-wf-c5890",
    "ict-equipment__brother-mfc-l8390cdw",
    "ict-equipment__dell-latitude-7450",
    "ict-equipment__dell-latitude-5450",
    "ict-equipment__hp-elitebook-860-g11",
    "ict-equipment__hp-elitebook-x360",
    "ict-equipment__lenovo-thinkpad-x1-carbon-gen-12",
    "ict-equipment__lenovo-thinkpad-t14-gen-5",
    "ict-equipment__apple-macbook-pro-14",
    "ict-equipment__microsoft-surface-laptop-7",
    "ict-equipment__hp-zbook-firefly",
    "ict-equipment__asus-expertbook-b9",
    "ict-equipment__hp-elitedesk-800-g9",
    "ict-equipment__dell-optiplex-7020",
    "ict-equipment__dell-optiplex-7020-micro",
    "ict-equipment__lenovo-thinkcentre-m90q-gen-4",
    "ict-equipment__hp-prodesk-400-g9",
    "ict-equipment__dell-precision-3680-tower",
    "ict-equipment__hp-elite-mini-800-g9",
    "ict-equipment__lenovo-thinkcentre-m90a-gen-5-aio",
    "ict-equipment__apple-imac-24",
    "ict-equipment__apple-mac-mini-m4",
)


def priority_ict_items(items: list[dict]) -> list[dict]:
    by_id = {i["id"]: i for i in items}
    return [by_id[iid] for iid in ICT_REFRESH_IDS if iid in by_id]


def search_query_ict(name: str) -> str:
    n = name
    if re.search(r"\bprinter|laserjet|imagerunner|altalink|taskalfa|designjet|workforce|mfc\b", n, re.I):
        return f"{name} printer product photo front view white background -laptop -toner"
    if re.search(r"\bmac mini|imac|optiplex|elitedesk|prodesk|thinkcentre|precision|elite mini|desktop|aio\b", n, re.I):
        return f"{name} desktop computer product photo front white background -laptop -toner"
    return f"{name} laptop notebook product photo open front white background -toner -cartridge"


def host_score_ict(url: str, name: str) -> int:
    host = urlparse(url).netloc.lower()
    u = url.lower()
    if url_rejected(url):
        return -9999
    score = 0
    for i, frag in enumerate(PREFERRED_HOST_FRAGMENTS):
        if frag in host or frag in u:
            score += 120 - i
    if u.endswith(".png") or ".png?" in u:
        score += 25
    if "product" in u or "packshot" in u or "pack-shot" in u:
        score += 30
    if "lifestyle" in u or "banner" in u or "hero" in u:
        score -= 120
    if re.search(r"\bprinter|laserjet|imagerunner|mfp\b", name, re.I):
        if "printer" in u or "laserjet" in u or "mfp" in u:
            score += 80
        if "laptop" in u or "notebook" in u:
            score -= 150
    elif re.search(r"\blaptop|macbook|thinkpad|elitebook|latitude|surface\b", name, re.I):
        if "laptop" in u or "notebook" in u or "macbook" in u:
            score += 80
        if "toner" in u or "cartridge" in u:
            score -= 150
    else:
        if "desktop" in u or "optiplex" in u or "imac" in u or "mac-mini" in u:
            score += 80
    for token in re.findall(r"[a-z0-9]{4,}", name.lower()):
        if token in u:
            score += 15
    return score


def read_existing_js_mapping() -> dict[str, str]:
    text = JS_FILE.read_text(encoding="utf-8")
    pat = re.compile(r"const PRODUCT_ITEM_IMAGES = \{.*?\};", re.S)
    m = pat.search(text)
    if not m:
        return {}
    block = m.group(0)
    return {
        mm.group(1): mm.group(2)
        for mm in re.finditer(r"'([^']+)':\s*'([^']+)'", block)
    }


def update_js_mapping(mapping: dict[str, str]) -> None:
    """Merge PRODUCT_ITEM_IMAGES into product-stock-register.js."""
    merged = read_existing_js_mapping()
    merged.update(mapping)
    text = JS_FILE.read_text(encoding="utf-8")
    lines = ["const PRODUCT_ITEM_IMAGES = {"]
    for item_id, rel in sorted(merged.items()):
        lines.append(f"    '{item_id}': '{rel}',")
    lines.append("};")
    new_block = "\n".join(lines)
    pat = re.compile(r"const PRODUCT_ITEM_IMAGES = \{.*?\};", re.S)
    if not pat.search(text):
        raise SystemExit("PRODUCT_ITEM_IMAGES block not found")
    JS_FILE.write_text(pat.sub(new_block, text, count=1), encoding="utf-8")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=0, help="Max unique SKU jobs (0 = all priority)")
    ap.add_argument("--skip-existing", action="store_true", help="Skip if PNG already exists")
    ap.add_argument("--only", type=str, default="", help="Comma-separated slugs to (re)fetch")
    ap.add_argument("--sleep", type=float, default=1.2, help="Delay between searches")
    ap.add_argument(
        "--mode",
        choices=("toner", "ict"),
        default="toner",
        help="toner = HP/Canon toner SKUs; ict = Aug 2026 refresh printers/laptops/desktops",
    )
    args = ap.parse_args()

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    RAW_DIR.mkdir(parents=True, exist_ok=True)

    catalog = parse_catalog_items()
    items = priority_ict_items(catalog) if args.mode == "ict" else priority_items(catalog)
    # Group by shared file slug so CE410A 410/305 share one download
    by_slug: dict[str, list[dict]] = {}
    for it in items:
        slug = file_slug_for_item(it["id"], it["name"])
        by_slug.setdefault(slug, []).append(it)

    jobs = list(by_slug.items())
    if args.only:
        only = {s.strip().lower() for s in args.only.split(",") if s.strip()}
        jobs = [(s, g) for s, g in jobs if s in only]
        for slug, _ in jobs:
            p = OUT_DIR / f"{slug}.png"
            if p.exists():
                p.unlink()
    if args.limit:
        jobs = jobs[: args.limit]

    mapping: dict[str, str] = {}
    if MAP_JSON.exists():
        try:
            mapping = json.loads(MAP_JSON.read_text(encoding="utf-8"))
        except Exception:
            mapping = {}

    # Keep already-known good files
    for existing in ("hp-cf289a", "hp-ce232a", "canon-exv54-yellow"):
        p = OUT_DIR / f"{existing}.png"
        if p.exists():
            # map any catalog ids that match this slug
            for slug, group in by_slug.items():
                if slug == existing or slug.startswith(existing):
                    rel = f"../assets/inventory/{existing}.png"
                    for it in group:
                        mapping[it["id"]] = rel

    ok = fail = 0
    for idx, (slug, group) in enumerate(jobs, 1):
        out_path = OUT_DIR / f"{slug}.png"
        rel = f"../assets/inventory/{slug}.png"
        name = group[0]["name"]
        print(f"[{idx}/{len(jobs)}] {slug}  <-  {name}")

        if args.skip_existing and out_path.exists() and out_path.stat().st_size > 2000:
            for it in group:
                mapping[it["id"]] = rel
            print("  skip existing")
            ok += 1
            continue

        sku = extract_sku(name)
        color = item_color(name)
        query = search_query_ict(name) if args.mode == "ict" else search_query(name)
        urls = search_image_urls(
            query,
            sku=sku,
            color=color,
            max_results=20,
            score_fn=(lambda u: host_score_ict(u, name)) if args.mode == "ict" else None,
        )
        if not urls:
            print("  no search hits")
            fail += 1
            time.sleep(args.sleep)
            continue

        saved = False
        for url in urls[:14]:
            ul = url.lower()
            if args.mode != "ict" and sku and sku.lower() not in ul and "toner" not in ul and "cartridge" not in ul:
                if host_score(url, sku, color) < 50:
                    continue
            img = download_image(url)
            if not img:
                continue
            try:
                ext = Path(urlparse(url).path).suffix.lower()
                if ext not in (".png", ".jpg", ".jpeg", ".webp"):
                    ext = ".img"
                img.save(RAW_DIR / f"{slug}{ext}")
            except Exception:
                pass
            if process_and_save(img, out_path):
                print(f"  OK  {url[:90]}")
                saved = True
                break
        if saved:
            for it in group:
                mapping[it["id"]] = rel
            ok += 1
        else:
            print("  FAIL downloads")
            fail += 1
        time.sleep(args.sleep)

    MAP_JSON.write_text(json.dumps(mapping, indent=2, sort_keys=True), encoding="utf-8")
    update_js_mapping(mapping)
    print(f"\nDone: ok={ok} fail={fail} mapped={len(mapping)}")
    print(f"Wrote {MAP_JSON}")
    print(f"Updated {JS_FILE.name}")


if __name__ == "__main__":
    main()
