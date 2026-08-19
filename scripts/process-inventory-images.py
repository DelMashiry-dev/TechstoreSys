"""Remove solid backgrounds from inventory product images → transparent PNGs."""
from __future__ import annotations

from collections import deque
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC_DIR = Path(
    r"C:\Users\TECHSTORES\.cursor\projects\c-Users-TECHSTORES-Documents-TECHSTORESys\assets"
)
OUT_DIR = ROOT / "assets" / "inventory"
OUT_DIR.mkdir(parents=True, exist_ok=True)

JOBS = [
    ("images__8_-83045257", "laptop.png"),
    ("desktop-computer-flat-icon", "desktop.png"),
    ("printer-fa2781d5", "printer.png"),
    ("green-usb-flash-drive", "usb.png"),
    ("images__9_-f7f6366e", "toner-ribbon.png"),
    ("images__3_-8af4d4fe", "toner-silhouette.png"),
    ("toner-cartridge-3d-icon", "toner-cartridge.png"),
    ("3d-icon-with-ink-cartridges", "ink-cartridges.png"),
    # Pack shots are owned by fetch-inventory-product-images.py (do not overwrite here)
]


def find_src(fragment: str) -> Path | None:
    hits = sorted(SRC_DIR.glob(f"*{fragment}*"))
    return hits[0] if hits else None


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
    rs = gs = bs = 0
    n = 0
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
    # Near-white / light gray plate
    if min(r, g, b) >= 220 and abs(r - g) < 20 and abs(g - b) < 20:
        return True
    # Soft gray plate
    if 165 <= min(r, g, b) and max(r, g, b) <= 225 and abs(r - g) < 14 and abs(g - b) < 14:
        if color_dist((r, g, b), bg) <= tol + 40:
            return True
    # Near-black plate
    if max(r, g, b) <= 28 and bg[0] <= 40 and bg[1] <= 40 and bg[2] <= 40:
        return True
    # Strong blue plate (ink cartridges artwork)
    if b > 140 and b - r > 40 and b - g > 30 and color_dist((r, g, b), bg) <= tol + 30:
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
    """Grow transparency into leftover white/gray plate pixels touching cleared areas."""
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
            # Only eat plate-like colors, not saturated product pixels
            plate = (
                (min(r, g, b) >= 200 and abs(r - g) < 22 and abs(g - b) < 22)
                or (165 <= min(r, g, b) <= 230 and abs(r - g) < 16 and abs(g - b) < 16)
                or (max(r, g, b) <= 30 and bg[0] <= 45)
                or color_dist((r, g, b), bg) <= tol
            )
            if plate:
                px[nx, ny] = (0, 0, 0, 0)
                q.append((nx, ny))


def flood_clear(img: Image.Image, tol: int = 42) -> Image.Image:
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


def fit_square(img: Image.Image, size: int = 720) -> Image.Image:
    bbox = img.getbbox()
    if bbox:
        # small pad
        l, t, r, b = bbox
        pad = 4
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


def process_one(src: Path, out_name: str, tol: int = 42) -> Path:
    raw = Image.open(src)
    cleared = flood_clear(raw, tol=tol)
    fitted = fit_square(cleared, 720)
    out = OUT_DIR / out_name
    fitted.save(out, "PNG")
    return out


def main() -> None:
    special_tol = {
        "toner-cartridge.png": 60,
        "ink-cartridges.png": 85,
        "laptop.png": 55,
        "usb.png": 50,
        "printer.png": 40,
        "desktop.png": 45,
    }
    done = []
    for fragment, out_name in JOBS:
        src = find_src(fragment)
        if not src:
            print(f"MISSING source for {out_name} ({fragment})")
            continue
        tol = special_tol.get(out_name, 42)
        out = process_one(src, out_name, tol=tol)
        done.append(out)
        print(f"OK  {out_name}")
    print(f"Wrote {len(done)} images to {OUT_DIR}")


if __name__ == "__main__":
    main()
