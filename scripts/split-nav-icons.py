"""Split TECHSTORES nav icon sheet into full standalone tiles (no half-crops / no labels)."""
from pathlib import Path
from PIL import Image

SHEET = Path(
    r"C:\Users\TECHSTORES\.cursor\projects\c-Users-TECHSTORES-Documents-TECHSTORESys\assets"
    r"\c__Users_TECHSTORES_AppData_Roaming_Cursor_User_workspaceStorage_4f27f0dd25e28c7913882762685d9f90_images_b4787964-6204-48a0-a24c-1c86fb321365-6066459d-dfff-4154-a9cf-7ab15ebf2aee.png"
)
OUT = Path(r"c:\Users\TECHSTORES\Documents\TECHSTORESys\assets\nav-icons")
OUT.mkdir(parents=True, exist_ok=True)

ICONS = [
    "dashboard",
    "accommodation-stores",
    "delivery-note",
    "dp-f1-form",
    "cost-comparative-schedule",
    "duties-roles",
    "techstores-equipment-register",
    "financial-year-bids",
    "gate-register",
    "gl-accounts",
    "dp-procurement",
    "voucher-module",
    "it-dir-departments",
    "process-guides",
    "monthly-returns",
    "orderly-room",
    "purchase-orders",
    "release-cut",
    "reports-module",
    "stock-take",
    "suppliers-contracts",
    "system-help",
    "temporary-loans",
    "undelivered-orders",
    "unit-checks",
    "unit-equipment",
    "unit-requisitions",
    "user-management",
    "workshop-repairs",
    "ict-accountability",
    "ict-distribution",
    "zna-qm-forms",
]

COLS, ROWS = 4, 8


def is_bg(r, g, b):
    return r < 45 and g < 70 and b < 130 and (b >= g) and (r + g + b) < 220


def vertical_runs(px, W, H, cx, half=45):
    runs = []
    in_a = False
    start = 0
    for y in range(H):
        hit = tot = 0
        for x in range(max(0, cx - half), min(W, cx + half)):
            r, g, b, _ = px[x, y]
            tot += 1
            if not is_bg(r, g, b):
                hit += 1
        on = (hit / tot) > 0.25
        if on and not in_a:
            start = y
            in_a = True
        elif not on and in_a:
            runs.append((start, y))
            in_a = False
    if in_a:
        runs.append((start, H))
    # merge small gaps
    merged = []
    for a, b in runs:
        if merged and a - merged[-1][1] < 8:
            merged[-1] = (merged[-1][0], b)
        else:
            merged.append((a, b))
    return merged


def horizontal_runs(px, W, H, cy, half=40):
    runs = []
    in_a = False
    start = 0
    for x in range(W):
        hit = tot = 0
        for y in range(max(0, cy - half), min(H, cy + half)):
            r, g, b, _ = px[x, y]
            tot += 1
            if not is_bg(r, g, b):
                hit += 1
        on = (hit / tot) > 0.25
        if on and not in_a:
            start = x
            in_a = True
        elif not on and in_a:
            runs.append((start, x))
            in_a = False
    if in_a:
        runs.append((start, W))
    merged = []
    for a, b in runs:
        if merged and a - merged[-1][1] < 8:
            merged[-1] = (merged[-1][0], b)
        else:
            merged.append((a, b))
    return merged


def pick_icon_runs(runs, expect, min_h=70):
    """Prefer tall runs (icon tiles), skip thin label strokes."""
    tall = [(a, b) for a, b in runs if (b - a) >= min_h]
    if len(tall) >= expect:
        # if extras, take the `expect` most regularly spaced / tallest group
        if len(tall) == expect:
            return tall
        # pick first expect by covering full height evenly
        return tall[:expect]
    # fallback: take longest N
    return sorted(runs, key=lambda ab: ab[1] - ab[0], reverse=True)[:expect][::-1]


def knock_out_bg(img: Image.Image) -> Image.Image:
    px = img.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if is_bg(r, g, b):
                px[x, y] = (0, 0, 0, 0)
    return img


def tight_bbox(img: Image.Image):
    px = img.load()
    w, h = img.size
    min_x, min_y, max_x, max_y = w, h, 0, 0
    found = False
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a > 20 and not is_bg(r, g, b):
                found = True
                min_x = min(min_x, x)
                min_y = min(min_y, y)
                max_x = max(max_x, x)
                max_y = max(max_y, y)
    if not found:
        return None
    return min_x, min_y, max_x, max_y


im = Image.open(SHEET).convert("RGBA")
W, H = im.size
px = im.load()

# Detect icon row bands from column 0 (most consistent)
col0_runs = vertical_runs(px, W, H, W // 8, half=45)
row_bands = pick_icon_runs(col0_runs, ROWS, min_h=70)
assert len(row_bands) == ROWS, f"expected {ROWS} icon rows, got {len(row_bands)}: {row_bands}"

# Detect icon column bands from middle of first icon row
cy = (row_bands[0][0] + row_bands[0][1]) // 2
col_bands = pick_icon_runs(horizontal_runs(px, W, H, cy, half=35), COLS, min_h=70)
assert len(col_bands) == COLS, f"expected {COLS} icon cols, got {len(col_bands)}: {col_bands}"

print("row bands:", row_bands)
print("col bands:", col_bands)

pad = 3
for idx, key in enumerate(ICONS):
    row, col = divmod(idx, COLS)
    y0, y1 = row_bands[row]
    x0, x1 = col_bands[col]
    tile = im.crop(
        (
            max(0, x0 - pad),
            max(0, y0 - pad),
            min(W, x1 + pad),
            min(H, y1 + pad),
        )
    ).copy()
    knock_out_bg(tile)
    box = tight_bbox(tile)
    if box:
        min_x, min_y, max_x, max_y = box
        p = 2
        tile = tile.crop(
            (
                max(0, min_x - p),
                max(0, min_y - p),
                min(tile.size[0], max_x + 1 + p),
                min(tile.size[1], max_y + 1 + p),
            )
        )

    side = max(tile.size)
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    canvas.paste(tile, ((side - tile.size[0]) // 2, (side - tile.size[1]) // 2), tile)
    canvas.save(OUT / f"{key}.png", "PNG")
    canvas.resize((128, 128), Image.Resampling.LANCZOS).save(OUT / f"{key}-128.png", "PNG")
    canvas.resize((64, 64), Image.Resampling.LANCZOS).save(OUT / f"{key}-64.png", "PNG")
    print(f"{key}: {canvas.size}")

# Restore standalone metallic gear for System Help (user example)
gear_src = Path(
    r"C:\Users\TECHSTORES\.cursor\projects\c-Users-TECHSTORES-Documents-TECHSTORESys\assets"
    r"\c__Users_TECHSTORES_AppData_Roaming_Cursor_User_workspaceStorage_4f27f0dd25e28c7913882762685d9f90_images_images__7_-removebg-preview-70e6cddc-17c9-40ed-bdb6-96f30982d30a.png"
)
if gear_src.exists():
    g = Image.open(gear_src).convert("RGBA")
    gpx = g.load()
    gw, gh = g.size
    min_x, min_y, max_x, max_y = gw, gh, 0, 0
    found = False
    for y in range(gh):
        for x in range(gw):
            r, gch, b, a = gpx[x, y]
            if a > 30 and (r + gch + b) > 40:
                found = True
                min_x = min(min_x, x)
                min_y = min(min_y, y)
                max_x = max(max_x, x)
                max_y = max(max_y, y)
    if found:
        p = 8
        g = g.crop((max(0, min_x - p), max(0, min_y - p), min(gw, max_x + 1 + p), min(gh, max_y + 1 + p)))
    side = max(g.size)
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    canvas.paste(g, ((side - g.size[0]) // 2, (side - g.size[1]) // 2), g)
    # Keep sheet version as backup; gear remains the System Help icon
    canvas.save(OUT / "system-help.png", "PNG")
    canvas.resize((128, 128), Image.Resampling.LANCZOS).save(OUT / "system-help-128.png", "PNG")
    print(f"system-help (gear): {canvas.size}")

print(f"Wrote icons to {OUT}")
