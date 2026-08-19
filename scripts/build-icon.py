"""Build transparent TechStores icon PNG + Windows ICO from source badge."""
from collections import deque
from pathlib import Path

from PIL import Image

ASSETS = Path(__file__).resolve().parent.parent / "assets"
SRC = ASSETS / "techstores-icon-source.png"
ASSETS.mkdir(parents=True, exist_ok=True)


def is_bg(r: int, g: int, b: int) -> bool:
    return r >= 232 and g >= 232 and b >= 232 and abs(r - g) < 12 and abs(g - b) < 12


def flood_clear_white(img: Image.Image) -> Image.Image:
    """Remove contiguous near-white background connected to image edges."""
    img = img.convert("RGBA")
    w, h = img.size
    px = img.load()
    visited = [[False] * w for _ in range(h)]
    q: deque[tuple[int, int]] = deque()

    def try_seed(x: int, y: int) -> None:
        if 0 <= x < w and 0 <= y < h and not visited[y][x]:
            r, g, b, _a = px[x, y]
            if is_bg(r, g, b):
                visited[y][x] = True
                q.append((x, y))

    for x in range(w):
        try_seed(x, 0)
        try_seed(x, h - 1)
    for y in range(h):
        try_seed(0, y)
        try_seed(w - 1, y)

    while q:
        x, y = q.popleft()
        px[x, y] = (0, 0, 0, 0)
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < w and 0 <= ny < h and not visited[ny][nx]:
                r, g, b, _a = px[nx, ny]
                if is_bg(r, g, b):
                    visited[ny][nx] = True
                    q.append((nx, ny))

    # Soften remaining near-white fringe next to transparent pixels
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            if not is_bg(r, g, b):
                continue
            near_clear = False
            for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                if 0 <= nx < w and 0 <= ny < h and px[nx, ny][3] == 0:
                    near_clear = True
                    break
            if near_clear:
                brightness = (r + g + b) / 3.0
                alpha = int(max(0, min(255, (255 - brightness) * 10)))
                px[x, y] = (r, g, b, alpha if alpha > 20 else 0)

    return img


def main() -> None:
    raw = Image.open(SRC)
    img = flood_clear_white(raw)

    bbox = img.getbbox()
    if not bbox:
        raise SystemExit("Icon became fully transparent — check source image.")

    pad = 8
    l, t, rgt, bot = bbox
    w, h = img.size
    img = img.crop((max(0, l - pad), max(0, t - pad), min(w, rgt + pad), min(h, bot + pad)))

    side = max(img.size)
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    canvas.paste(img, ((side - img.size[0]) // 2, (side - img.size[1]) // 2), img)

    png_out = ASSETS / "techstores-icon.png"
    ico_out = ASSETS / "techstores.ico"
    canvas.save(png_out, "PNG")
    canvas.save(
        ico_out,
        format="ICO",
        sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)],
    )

    print(f"PNG -> {png_out} {canvas.size}")
    print(f"ICO -> {ico_out} ({ico_out.stat().st_size} bytes)")
    print(
        "corner alphas",
        canvas.getpixel((0, 0))[3],
        canvas.getpixel((side - 1, side - 1))[3],
        "center",
        canvas.getpixel((side // 2, side // 2))[3],
    )


if __name__ == "__main__":
    main()
