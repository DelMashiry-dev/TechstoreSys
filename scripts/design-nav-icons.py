"""
Generate a cohesive custom TECHSTORES nav icon set.
Style: glossy glass tiles — chrome rim, specular sheen, white glyphs.
"""
from __future__ import annotations

import math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

OUT = Path(r"c:\Users\TECHSTORES\Documents\TECHSTORESys\assets\nav-icons")
OUT.mkdir(parents=True, exist_ok=True)

SIZE = 256
PAD = 16
RADIUS = 54
INK = (255, 255, 255, 250)
INK_DIM = (255, 255, 255, 185)


# Vivid glass palettes (highlight, mid, deep)
PAL = {
    "blue":   ((120, 198, 255), (52, 148, 220), (18, 72, 140)),
    "steel":  ((200, 214, 230), (110, 132, 158), (48, 64, 88)),
    "teal":   ((110, 230, 220), (36, 168, 162), (14, 88, 92)),
    "green":  ((120, 230, 160), (42, 168, 95), (16, 88, 48)),
    "forest": ((130, 210, 150), (48, 140, 85), (22, 78, 48)),
    "amber":  ((255, 210, 110), (220, 140, 40), (140, 78, 18)),
    "orange": ((255, 180, 100), (230, 110, 40), (150, 55, 18)),
    "red":    ((255, 140, 130), (210, 58, 52), (120, 28, 28)),
    "slate":  ((190, 210, 230), (100, 128, 158), (42, 58, 82)),
    "navy":   ((110, 170, 255), (40, 100, 180), (16, 48, 110)),
    "brass":  ((255, 220, 130), (196, 150, 55), (110, 78, 28)),
    "wine":   ((230, 150, 190), (150, 60, 110), (88, 28, 68)),
}


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(len(a)))


def rounded_mask(size, radius):
    m = Image.new("L", (size, size), 0)
    d = ImageDraw.Draw(m)
    d.rounded_rectangle((0, 0, size - 1, size - 1), radius=radius, fill=255)
    return m


def make_tile(palette):
    """Glossy glass tile: deep gradient, chrome rim, specular glass sheen."""
    if len(palette) == 2:
        hi, mid, deep = palette[0], lerp(palette[0], palette[1], 0.45), palette[1]
    else:
        hi, mid, deep = palette

    inner = SIZE - 2 * PAD
    rad = RADIUS - 2
    base = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))

    # --- body gradient (vertical + slight radial lift) ---
    tile = Image.new("RGBA", (inner, inner), (0, 0, 0, 0))
    px = tile.load()
    cx = (inner - 1) / 2
    cy = (inner - 1) * 0.38
    for y in range(inner):
        ty = y / max(1, inner - 1)
        # glass body: bright top → rich mid → deep bottom
        if ty < 0.42:
            c = lerp(hi, mid, ty / 0.42)
        else:
            c = lerp(mid, deep, (ty - 0.42) / 0.58)
        for x in range(inner):
            # radial highlight pool (upper-center glow)
            dx = (x - cx) / (inner * 0.55)
            dy = (y - cy) / (inner * 0.55)
            dist = math.sqrt(dx * dx + dy * dy)
            glow = max(0.0, 1.0 - dist) ** 1.6
            c2 = lerp(c, (255, 255, 255), glow * 0.28)
            # bottom vignette for depth
            if ty > 0.65:
                c2 = lerp(c2, (0, 0, 0), (ty - 0.65) / 0.35 * 0.22)
            px[x, y] = (*c2, 255)

    mask = rounded_mask(inner, rad)
    tile.putalpha(mask)

    # --- chrome / metallic rim ---
    rim = Image.new("RGBA", (inner, inner), (0, 0, 0, 0))
    rd = ImageDraw.Draw(rim)
    # outer bright chrome
    rd.rounded_rectangle((1, 1, inner - 2, inner - 2), radius=rad, outline=(255, 255, 255, 210), width=5)
    # mid steel
    rd.rounded_rectangle((5, 5, inner - 6, inner - 6), radius=rad - 4, outline=(210, 220, 235, 160), width=3)
    # inner dark lip
    rd.rounded_rectangle((8, 8, inner - 9, inner - 9), radius=rad - 6, outline=(0, 0, 0, 70), width=2)
    tile = Image.alpha_composite(tile, rim)

    # --- glossy glass reflection (curved top band) ---
    gloss = Image.new("RGBA", (inner, inner), (0, 0, 0, 0))
    gpx = gloss.load()
    gloss_h = int(inner * 0.42)
    for y in range(gloss_h):
        # fade down; stronger near top
        fy = 1.0 - (y / max(1, gloss_h - 1))
        alpha = int(200 * (fy ** 1.35))
        # curved oval cut: leave sides darker (classic aqua gloss)
        for x in range(inner):
            # elliptical falloff from top-center
            nx = abs(x - cx) / (inner * 0.48)
            ny = y / max(1, gloss_h)
            # crescent: bright in upper oval, cut by lower curve
            inside = (nx * nx) + ((ny - 0.15) * 1.4) ** 2
            if inside < 1.0:
                a = int(alpha * (1.0 - inside) * (0.55 + 0.45 * fy))
                if a > 0:
                    gpx[x, y] = (255, 255, 255, min(230, a))
    gloss.putalpha(
        Image.composite(
            gloss.split()[-1],
            Image.new("L", (inner, inner), 0),
            mask,
        )
    )
    # soft blur on gloss for gel look
    gloss = gloss.filter(ImageFilter.GaussianBlur(radius=1.2))
    # re-apply mask after blur
    ga = gloss.split()[-1]
    ga = Image.composite(ga, Image.new("L", (inner, inner), 0), mask)
    gloss.putalpha(ga)
    tile = Image.alpha_composite(tile, gloss)

    # --- tiny specular sparkle (top-left) ---
    spark = Image.new("RGBA", (inner, inner), (0, 0, 0, 0))
    sd = ImageDraw.Draw(spark)
    sx, sy = int(inner * 0.22), int(inner * 0.18)
    sd.ellipse((sx - 14, sy - 8, sx + 22, sy + 10), fill=(255, 255, 255, 160))
    spark = spark.filter(ImageFilter.GaussianBlur(radius=3))
    sa = Image.composite(spark.split()[-1], Image.new("L", (inner, inner), 0), mask)
    spark.putalpha(sa)
    tile = Image.alpha_composite(tile, spark)

    # --- soft outer glow / drop shadow ---
    shadow = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    shd = ImageDraw.Draw(shadow)
    shd.rounded_rectangle(
        (PAD + 2, PAD + 6, PAD + inner + 2, PAD + inner + 8),
        radius=rad,
        fill=(0, 0, 0, 70),
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(radius=4))
    base = Image.alpha_composite(base, shadow)

    # slight coloured under-glow matching mid
    glow = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.rounded_rectangle(
        (PAD - 2, PAD - 2, PAD + inner + 2, PAD + inner + 2),
        radius=rad + 2,
        fill=(*mid, 40),
    )
    glow = glow.filter(ImageFilter.GaussianBlur(radius=6))
    base = Image.alpha_composite(base, glow)

    base.paste(tile, (PAD, PAD), tile)
    return base


def gdraw(img):
    """Glyph draw context in inner tile coords mapped to full canvas."""
    return ImageDraw.Draw(img), PAD, PAD, SIZE - PAD, SIZE - PAD


def cxcy(img):
    return SIZE // 2, SIZE // 2


def line(d, pts, w=7, fill=INK):
    d.line(pts, fill=fill, width=w, joint="curve")


def poly(d, pts, fill=INK):
    d.polygon(pts, fill=fill)


def ellipse(d, box, fill=None, outline=INK, w=6):
    d.ellipse(box, fill=fill, outline=outline, width=w)


def rect(d, box, fill=None, outline=INK, w=6, rad=8):
    d.rounded_rectangle(box, radius=rad, fill=fill, outline=outline, width=w)


# --- Glyphs (drawn in full-canvas coordinates) ---

def glyph_dashboard(img):
    d, *_ = gdraw(img)
    cx, cy = cxcy(img)
    # gauge arc
    box = (cx - 58, cy - 62, cx + 58, cy + 54)
    d.arc(box, start=200, end=340, fill=INK, width=9)
    # ticks
    for ang in (220, 270, 320):
        import math
        a = math.radians(ang)
        x0 = cx + 38 * math.cos(a)
        y0 = cy + 8 + 38 * math.sin(a)
        x1 = cx + 52 * math.cos(a)
        y1 = cy + 8 + 52 * math.sin(a)
        line(d, [(x0, y0), (x1, y1)], 5)
    # needle
    line(d, [(cx, cy + 8), (cx + 36, cy - 28)], 6)
    ellipse(d, (cx - 8, cy, cx + 8, cy + 16), fill=INK, outline=None, w=0)
    # mini grid
    for i in range(2):
        for j in range(3):
            x = cx - 10 + j * 14
            y = cy + 36 + i * 12
            rect(d, (x, y, x + 10, y + 8), fill=INK, outline=None, w=0, rad=2)


def glyph_warehouse(img):
    d, *_ = gdraw(img)
    cx, cy = cxcy(img)
    # building
    poly(d, [(cx - 62, cy - 8), (cx, cy - 58), (cx + 62, cy - 8), (cx + 52, cy - 8), (cx, cy - 48), (cx - 52, cy - 8)])
    rect(d, (cx - 52, cy - 10, cx + 52, cy + 58), fill=None, outline=INK, w=7, rad=6)
    # door / bay
    rect(d, (cx - 16, cy + 18, cx + 16, cy + 58), fill=INK_DIM, outline=INK, w=5, rad=4)
    # box in front
    rect(d, (cx - 48, cy + 28, cx - 22, cy + 52), fill=INK, outline=None, w=0, rad=3)


def glyph_truck(img):
    d, *_ = gdraw(img)
    cx, cy = cxcy(img)
    rect(d, (cx - 70, cy - 28, cx + 10, cy + 28), fill=None, outline=INK, w=7, rad=8)
    # cab
    poly(d, [(cx + 10, cy - 8), (cx + 48, cy - 8), (cx + 62, cy + 10), (cx + 62, cy + 28), (cx + 10, cy + 28)])
    line(d, [(cx + 10, cy - 8), (cx + 10, cy + 28)], 7)
    ellipse(d, (cx - 48, cy + 22, cx - 22, cy + 48), outline=INK, w=7)
    ellipse(d, (cx + 28, cy + 22, cx + 54, cy + 48), outline=INK, w=7)
    # doc badge
    rect(d, (cx - 52, cy - 18, cx - 28, cy + 10), fill=INK, outline=None, w=0, rad=3)


def glyph_document(img, lines=True, fold=True):
    d, *_ = gdraw(img)
    cx, cy = cxcy(img)
    rect(d, (cx - 42, cy - 58, cx + 42, cy + 58), fill=None, outline=INK, w=7, rad=8)
    if fold:
        poly(d, [(cx + 10, cy - 58), (cx + 42, cy - 58), (cx + 42, cy - 26)])
        line(d, [(cx + 10, cy - 58), (cx + 10, cy - 26), (cx + 42, cy - 26)], 5)
    if lines:
        for i, y in enumerate((-18, 0, 18, 36)):
            w = 48 if i < 3 else 28
            line(d, [(cx - 24, cy + y), (cx - 24 + w, cy + y)], 6)


def glyph_scales_chart(img):
    d, *_ = gdraw(img)
    cx, cy = cxcy(img)
    # scale beam
    line(d, [(cx - 55, cy - 20), (cx + 55, cy - 20)], 7)
    line(d, [(cx, cy - 48), (cx, cy - 20)], 7)
    # pans
    ellipse(d, (cx - 58, cy - 12, cx - 22, cy + 12), outline=INK, w=6)
    ellipse(d, (cx + 22, cy - 12, cx + 58, cy + 12), outline=INK, w=6)
    line(d, [(cx - 40, cy - 20), (cx - 40, cy - 8)], 5)
    line(d, [(cx + 40, cy - 20), (cx + 40, cy - 8)], 5)
    # bars
    for i, h in enumerate((28, 44, 58)):
        x = cx - 30 + i * 28
        rect(d, (x, cy + 58 - h, x + 18, cy + 58), fill=INK, outline=None, w=0, rad=3)


def glyph_person_clipboard(img):
    d, *_ = gdraw(img)
    cx, cy = cxcy(img)
    # person
    ellipse(d, (cx - 58, cy - 52, cx - 28, cy - 22), outline=INK, w=7)
    d.arc((cx - 68, cy - 18, cx - 18, cy + 42), start=200, end=340, fill=INK, width=8)
    # clipboard
    rect(d, (cx - 8, cy - 50, cx + 58, cy + 55), fill=None, outline=INK, w=7, rad=8)
    rect(d, (cx + 8, cy - 62, cx + 40, cy - 42), fill=INK, outline=None, w=0, rad=4)
    for y in (-20, 2, 24):
        line(d, [(cx + 6, cy + y), (cx + 42, cy + y)], 6)
        # check
        line(d, [(cx + 6, cy + y), (cx + 12, cy + y + 6), (cx + 22, cy + y - 8)], 5)


def glyph_monitor_book(img):
    d, *_ = gdraw(img)
    cx, cy = cxcy(img)
    rect(d, (cx - 60, cy - 55, cx + 8, cy + 10), fill=None, outline=INK, w=7, rad=6)
    line(d, [(cx - 26, cy + 10), (cx - 26, cy + 22)], 6)
    line(d, [(cx - 48, cy + 22), (cx - 4, cy + 22)], 6)
    # book
    rect(d, (cx + 4, cy - 10, cx + 62, cy + 55), fill=None, outline=INK, w=7, rad=6)
    line(d, [(cx + 33, cy - 10), (cx + 33, cy + 55)], 6)
    line(d, [(cx + 12, cy + 8), (cx + 28, cy + 8)], 5)
    line(d, [(cx + 38, cy + 8), (cx + 54, cy + 8)], 5)


def glyph_calendar_money(img):
    d, *_ = gdraw(img)
    cx, cy = cxcy(img)
    rect(d, (cx - 52, cy - 40, cx + 52, cy + 55), fill=None, outline=INK, w=7, rad=10)
    line(d, [(cx - 52, cy - 12), (cx + 52, cy - 12)], 6)
    for x in (cx - 28, cx + 8):
        line(d, [(x, cy - 55), (x, cy - 28)], 7)
    # dollar
    ellipse(d, (cx - 22, cy + 2, cx + 22, cy + 42), outline=INK, w=7)
    line(d, [(cx, cy - 4), (cx, cy + 48)], 6)


def glyph_gate_book(img):
    d, *_ = gdraw(img)
    cx, cy = cxcy(img)
    # fence posts
    for x in range(cx - 58, cx + 10, 18):
        line(d, [(x, cy - 55), (x, cy + 5)], 6)
    line(d, [(cx - 62, cy - 35), (cx + 8, cy - 35)], 6)
    line(d, [(cx - 62, cy - 12), (cx + 8, cy - 12)], 6)
    # book
    rect(d, (cx + 2, cy - 8, cx + 62, cy + 58), fill=None, outline=INK, w=7, rad=6)
    line(d, [(cx + 32, cy - 8), (cx + 32, cy + 58)], 6)


def glyph_ledger_calc(img):
    d, *_ = gdraw(img)
    cx, cy = cxcy(img)
    rect(d, (cx - 58, cy - 55, cx + 20, cy + 55), fill=None, outline=INK, w=7, rad=8)
    line(d, [(cx - 19, cy - 55), (cx - 19, cy + 55)], 6)
    for y in (-30, -8, 14):
        line(d, [(cx - 48, cy + y), (cx - 28, cy + y)], 5)
        line(d, [(cx - 10, cy + y), (cx + 8, cy + y)], 5)
    # calculator
    rect(d, (cx + 12, cy - 5, cx + 62, cy + 55), fill=None, outline=INK, w=6, rad=6)
    rect(d, (cx + 20, cy + 5, cx + 54, cy + 20), fill=INK_DIM, outline=None, w=0, rad=3)
    for i in range(2):
        for j in range(3):
            x = cx + 20 + j * 12
            y = cy + 28 + i * 12
            rect(d, (x, y, x + 8, y + 8), fill=INK, outline=None, w=0, rad=2)


def glyph_cycle_cart(img):
    d, *_ = gdraw(img)
    cx, cy = cxcy(img)
    # cycle arrows (approx with arcs)
    d.arc((cx - 62, cy - 55, cx + 62, cy + 55), start=40, end=200, fill=INK, width=8)
    d.arc((cx - 62, cy - 55, cx + 62, cy + 55), start=220, end=20, fill=INK, width=8)
    # arrow heads
    poly(d, [(cx - 55, cy + 20), (cx - 70, cy + 8), (cx - 48, cy + 2)])
    poly(d, [(cx + 55, cy - 20), (cx + 70, cy - 8), (cx + 48, cy - 2)])
    # monitor
    rect(d, (cx - 28, cy - 28, cx + 8, cy + 8), fill=None, outline=INK, w=6, rad=4)
    # cart
    line(d, [(cx + 8, cy + 18), (cx + 48, cy + 18)], 6)
    line(d, [(cx + 14, cy + 18), (cx + 20, cy - 5), (cx + 42, cy - 5)], 6)
    ellipse(d, (cx + 16, cy + 24, cx + 28, cy + 36), outline=INK, w=5)
    ellipse(d, (cx + 34, cy + 24, cx + 46, cy + 36), outline=INK, w=5)


def glyph_issue_voucher(img):
    d, *_ = gdraw(img)
    cx, cy = cxcy(img)
    rect(d, (cx - 58, cy - 50, cx + 18, cy + 50), fill=None, outline=INK, w=7, rad=8)
    for y in (-22, -2, 18):
        line(d, [(cx - 42, cy + y), (cx + 2, cy + y)], 6)
    # arrow out
    line(d, [(cx + 10, cy), (cx + 62, cy)], 8)
    poly(d, [(cx + 48, cy - 18), (cx + 70, cy), (cx + 48, cy + 18)])


def glyph_org_chart(img):
    d, *_ = gdraw(img)
    cx, cy = cxcy(img)

    def node(x, y):
        rect(d, (x - 18, y - 14, x + 18, y + 14), fill=INK, outline=None, w=0, rad=6)

    node(cx, cy - 48)
    node(cx - 52, cy + 42)
    node(cx, cy + 42)
    node(cx + 52, cy + 42)
    line(d, [(cx, cy - 34), (cx, cy - 8)], 6)
    line(d, [(cx - 52, cy - 8), (cx + 52, cy - 8)], 6)
    line(d, [(cx - 52, cy - 8), (cx - 52, cy + 28)], 6)
    line(d, [(cx, cy - 8), (cx, cy + 28)], 6)
    line(d, [(cx + 52, cy - 8), (cx + 52, cy + 28)], 6)


def glyph_learning(img):
    d, *_ = gdraw(img)
    cx, cy = cxcy(img)
    # open book
    poly(d, [(cx, cy - 10), (cx - 62, cy - 35), (cx - 62, cy + 45), (cx, cy + 55)])
    poly(d, [(cx, cy - 10), (cx + 62, cy - 35), (cx + 62, cy + 45), (cx, cy + 55)])
    line(d, [(cx, cy - 10), (cx, cy + 55)], 7)
    # screen resting on book
    rect(d, (cx - 36, cy - 58, cx + 36, cy - 18), fill=None, outline=INK, w=6, rad=5)
    line(d, [(cx, cy - 18), (cx, cy - 8)], 5)


def glyph_monthly(img):
    d, *_ = gdraw(img)
    cx, cy = cxcy(img)
    rect(d, (cx - 48, cy - 42, cx + 36, cy + 48), fill=None, outline=INK, w=7, rad=10)
    line(d, [(cx - 48, cy - 14), (cx + 36, cy - 14)], 6)
    for x in (cx - 28, cx + 4):
        line(d, [(x, cy - 56), (x, cy - 28)], 7)
    # refresh arc
    d.arc((cx + 8, cy + 8, cx + 62, cy + 62), start=40, end=300, fill=INK, width=7)
    poly(d, [(cx + 48, cy + 8), (cx + 62, cy + 22), (cx + 40, cy + 24)])


def glyph_shelves(img):
    d, *_ = gdraw(img)
    cx, cy = cxcy(img)
    rect(d, (cx - 58, cy - 55, cx + 58, cy + 55), fill=None, outline=INK, w=7, rad=6)
    line(d, [(cx - 58, cy - 10), (cx + 58, cy - 10)], 6)
    line(d, [(cx - 58, cy + 28), (cx + 58, cy + 28)], 6)
    # boxes
    for box in (
        (cx - 48, cy - 48, cx - 22, cy - 18),
        (cx - 12, cy - 45, cx + 20, cy - 18),
        (cx + 28, cy - 48, cx + 48, cy - 18),
        (cx - 45, cy - 2, cx - 15, cy + 22),
        (cx - 2, cy + 2, cx + 28, cy + 22),
        (cx + 35, cy - 2, cx + 50, cy + 22),
    ):
        rect(d, box, fill=INK_DIM, outline=INK, w=4, rad=3)


def glyph_po(img):
    d, *_ = gdraw(img)
    cx, cy = cxcy(img)
    # cart
    line(d, [(cx - 58, cy - 20), (cx - 48, cy - 40), (cx - 10, cy - 40), (cx, cy - 20)], 7)
    line(d, [(cx - 55, cy - 20), (cx + 5, cy - 20), (cx + 12, cy + 5)], 7)
    ellipse(d, (cx - 42, cy + 8, cx - 24, cy + 26), outline=INK, w=6)
    ellipse(d, (cx - 12, cy + 8, cx + 6, cy + 26), outline=INK, w=6)
    # doc + check
    rect(d, (cx + 8, cy - 48, cx + 62, cy + 40), fill=None, outline=INK, w=7, rad=8)
    ellipse(d, (cx + 22, cy + 8, cx + 52, cy + 38), outline=INK, w=6)
    line(d, [(cx + 28, cy + 24), (cx + 34, cy + 30), (cx + 46, cy + 16)], 6)


def glyph_scissors_cut(img):
    d, *_ = gdraw(img)
    cx, cy = cxcy(img)
    rect(d, (cx - 40, cy - 58, cx + 40, cy + 58), fill=None, outline=INK, w=7, rad=8)
    # cut line
    for x in range(cx - 28, cx + 30, 12):
        line(d, [(x, cy), (x + 6, cy)], 5, fill=INK_DIM)
    # scissors
    ellipse(d, (cx - 58, cy + 18, cx - 30, cy + 46), outline=INK, w=6)
    ellipse(d, (cx - 30, cy + 18, cx - 2, cy + 46), outline=INK, w=6)
    line(d, [(cx - 32, cy + 20), (cx + 8, cy - 35)], 6)
    line(d, [(cx - 28, cy + 20), (cx + 28, cy - 20)], 6)


def glyph_reports(img):
    d, *_ = gdraw(img)
    cx, cy = cxcy(img)
    # stacked sheets
    for i, off in enumerate((12, 6, 0)):
        rect(
            d,
            (cx - 42 + off, cy - 55 + off, cx + 42 + off, cy + 50 + off),
            fill=None,
            outline=INK,
            w=6,
            rad=8,
        )
    for h, x in ((36, cx - 22), (52, cx - 2), (28, cx + 18)):
        rect(d, (x, cy + 30 - h, x + 14, cy + 30), fill=INK, outline=None, w=0, rad=3)


def glyph_stocktake(img):
    d, *_ = gdraw(img)
    cx, cy = cxcy(img)
    # shelves
    rect(d, (cx - 62, cy - 50, cx + 8, cy + 55), fill=None, outline=INK, w=7, rad=6)
    line(d, [(cx - 62, cy - 10), (cx + 8, cy - 10)], 6)
    line(d, [(cx - 62, cy + 25), (cx + 8, cy + 25)], 6)
    for box in ((cx - 52, cy - 42, cx - 28, cy - 18), (cx - 22, cy - 40, cx - 2, cy - 18),
                (cx - 50, cy + 0, cx - 26, cy + 18)):
        rect(d, box, fill=INK_DIM, outline=INK, w=4, rad=3)
    # clipboard
    rect(d, (cx + 2, cy - 35, cx + 62, cy + 55), fill=None, outline=INK, w=7, rad=8)
    rect(d, (cx + 18, cy - 48, cx + 46, cy - 28), fill=INK, outline=None, w=0, rad=4)
    for y in (-10, 12, 34):
        line(d, [(cx + 14, cy + y), (cx + 22, cy + y + 8), (cx + 38, cy + y - 10)], 5)


def glyph_handshake(img):
    d, *_ = gdraw(img)
    cx, cy = cxcy(img)
    # document
    rect(d, (cx - 36, cy - 58, cx + 36, cy - 5), fill=None, outline=INK, w=7, rad=8)
    line(d, [(cx - 20, cy - 40), (cx + 20, cy - 40)], 5)
    line(d, [(cx - 20, cy - 25), (cx + 12, cy - 25)], 5)
    # ring
    ellipse(d, (cx - 58, cy - 8, cx + 58, cy + 62), outline=INK, w=7)
    # simplified handshake (two angled arms)
    line(d, [(cx - 48, cy + 40), (cx - 10, cy + 18), (cx + 8, cy + 28)], 8)
    line(d, [(cx + 48, cy + 40), (cx + 10, cy + 18), (cx - 8, cy + 28)], 8)
    ellipse(d, (cx - 14, cy + 12, cx + 14, cy + 36), fill=INK, outline=None, w=0)


def gear_outline(d, cx, cy, r_outer=28, r_inner=12, teeth=8, w=6):
    import math
    for i in range(teeth):
        ang = math.radians(i * (360 / teeth) - 90)
        ang2 = math.radians(i * (360 / teeth) + (180 / teeth) - 90)
        x0 = cx + r_inner * math.cos(ang)
        y0 = cy + r_inner * math.sin(ang)
        x1 = cx + r_outer * math.cos(ang)
        y1 = cy + r_outer * math.sin(ang)
        line(d, [(x0, y0), (x1, y1)], w)
        # tooth tip bar
        tx0 = cx + r_outer * math.cos(ang - 0.15)
        ty0 = cy + r_outer * math.sin(ang - 0.15)
        tx1 = cx + r_outer * math.cos(ang + 0.15)
        ty1 = cy + r_outer * math.sin(ang + 0.15)
        line(d, [(tx0, ty0), (tx1, ty1)], w)
    ellipse(d, (cx - r_inner, cy - r_inner, cx + r_inner, cy + r_inner), outline=INK, w=w)
    ellipse(d, (cx - r_inner // 2, cy - r_inner // 2, cx + r_inner // 2, cy + r_inner // 2), outline=INK, w=max(4, w - 2))


def glyph_help_book(img):
    d, *_ = gdraw(img)
    cx, cy = cxcy(img)
    line(d, [(cx, cy + 8), (cx - 60, cy - 20), (cx - 60, cy + 55), (cx, cy + 62), (cx, cy + 8)], 7)
    line(d, [(cx, cy + 8), (cx + 60, cy - 20), (cx + 60, cy + 55), (cx, cy + 62)], 7)
    line(d, [(cx, cy + 8), (cx, cy + 62)], 7)
    ellipse(d, (cx - 16, cy - 58, cx + 16, cy - 28), outline=INK, w=7)
    line(d, [(cx, cy - 28), (cx, cy - 12)], 7)
    ellipse(d, (cx - 5, cy - 2, cx + 5, cy + 8), fill=INK, outline=None, w=0)
    gear_outline(d, cx + 42, cy - 42, r_outer=22, r_inner=10, teeth=8, w=5)


def glyph_users(img):
    d, *_ = gdraw(img)
    cx, cy = cxcy(img)
    ellipse(d, (cx - 48, cy - 55, cx - 12, cy - 20), outline=INK, w=7)
    d.arc((cx - 58, cy - 15, cx - 2, cy + 50), 200, 340, fill=INK, width=8)
    ellipse(d, (cx + 2, cy - 40, cx + 32, cy - 12), outline=INK, w=6)
    d.arc((cx - 5, cy - 5, cx + 42, cy + 45), 200, 340, fill=INK, width=7)
    gear_outline(d, cx + 42, cy + 28, r_outer=24, r_inner=10, teeth=8, w=5)


def glyph_workshop(img):
    d, *_ = gdraw(img)
    cx, cy = cxcy(img)
    ellipse(d, (cx - 62, cy - 55, cx - 28, cy - 22), outline=INK, w=8)
    line(d, [(cx - 35, cy - 28), (cx + 35, cy + 42)], 10)
    ellipse(d, (cx + 22, cy + 28, cx + 55, cy + 58), outline=INK, w=8)
    gear_outline(d, cx + 8, cy - 8, r_outer=34, r_inner=14, teeth=8, w=6)


def glyph_loan(img):
    d, *_ = gdraw(img)
    cx, cy = cxcy(img)
    ellipse(d, (cx - 55, cy + 5, cx + 5, cy + 55), outline=INK, w=7)
    line(d, [(cx - 40, cy + 20), (cx - 10, cy - 5)], 7)
    rect(d, (cx - 20, cy - 45, cx + 45, cy + 5), fill=None, outline=INK, w=7, rad=6)
    line(d, [(cx - 20, cy - 25), (cx + 45, cy - 25)], 5)
    line(d, [(cx + 12, cy - 45), (cx + 12, cy + 5)], 5)
    ellipse(d, (cx + 28, cy + 12, cx + 62, cy + 46), outline=INK, w=6)
    line(d, [(cx + 45, cy + 18), (cx + 45, cy + 30), (cx + 54, cy + 34)], 5)


def glyph_undelivered(img):
    d, *_ = gdraw(img)
    cx, cy = cxcy(img)
    rect(d, (cx - 55, cy - 25, cx + 20, cy + 50), fill=None, outline=INK, w=7, rad=6)
    poly(d, [(cx - 55, cy - 25), (cx - 18, cy - 55), (cx + 20, cy - 25)])
    line(d, [(cx - 18, cy - 55), (cx - 18, cy - 5)], 6)
    line(d, [(cx + 22, cy + 50), (cx + 48, cy - 10), (cx + 74, cy + 50), (cx + 22, cy + 50)], 7)
    line(d, [(cx + 48, cy + 5), (cx + 48, cy + 28)], 6)
    ellipse(d, (cx + 44, cy + 34, cx + 52, cy + 42), fill=INK, outline=None, w=0)


def glyph_unit_check(img):
    d, *_ = gdraw(img)
    cx, cy = cxcy(img)
    rect(d, (cx - 55, cy - 50, cx + 15, cy + 55), fill=None, outline=INK, w=7, rad=8)
    rect(d, (cx - 35, cy - 62, cx - 5, cy - 42), fill=INK, outline=None, w=0, rad=4)
    for y in (-25, -2, 22):
        line(d, [(cx - 40, cy + y), (cx - 32, cy + y + 8), (cx - 12, cy + y - 10)], 5)
    rect(d, (cx + 18, cy - 5, cx + 62, cy + 45), fill=None, outline=INK, w=7, rad=6)
    line(d, [(cx + 18, cy + 12), (cx + 62, cy + 12)], 5)


def glyph_desk(img):
    d, *_ = gdraw(img)
    cx, cy = cxcy(img)
    rect(d, (cx - 50, cy - 55, cx + 30, cy + 5), fill=None, outline=INK, w=7, rad=6)
    line(d, [(cx - 10, cy + 5), (cx - 10, cy + 18)], 6)
    line(d, [(cx - 35, cy + 18), (cx + 15, cy + 18)], 6)
    rect(d, (cx - 55, cy + 28, cx + 25, cy + 48), fill=None, outline=INK, w=6, rad=4)
    rect(d, (cx + 35, cy - 40, cx + 62, cy + 48), fill=None, outline=INK, w=6, rad=5)
    ellipse(d, (cx + 42, cy - 28, cx + 55, cy - 15), outline=INK, w=4)


def glyph_requisition(img):
    d, *_ = gdraw(img)
    cx, cy = cxcy(img)
    rect(d, (cx - 55, cy - 50, cx + 25, cy + 55), fill=None, outline=INK, w=7, rad=8)
    rect(d, (cx - 30, cy - 62, cx, cy - 42), fill=INK, outline=None, w=0, rad=4)
    for y in (-22, 0, 22):
        line(d, [(cx - 38, cy + y), (cx + 8, cy + y)], 6)
    line(d, [(cx + 20, cy), (cx + 65, cy)], 8)
    poly(d, [(cx + 50, cy - 16), (cx + 70, cy), (cx + 50, cy + 16)])


def glyph_asset_tag(img):
    d, *_ = gdraw(img)
    cx, cy = cxcy(img)
    rect(d, (cx - 58, cy - 50, cx + 22, cy + 20), fill=None, outline=INK, w=7, rad=6)
    line(d, [(cx - 18, cy + 20), (cx - 18, cy + 32)], 6)
    line(d, [(cx - 40, cy + 32), (cx + 4, cy + 32)], 6)
    for ox, oy in ((18, 10), (32, 28)):
        line(
            d,
            [
                (cx + ox, cy + oy),
                (cx + ox + 36, cy + oy + 8),
                (cx + ox + 28, cy + oy + 36),
                (cx + ox - 8, cy + oy + 30),
                (cx + ox, cy + oy),
            ],
            5,
        )
        ellipse(d, (cx + ox + 4, cy + oy + 8, cx + ox + 14, cy + oy + 18), outline=INK, w=4)


def glyph_distribution(img):
    d, *_ = gdraw(img)
    cx, cy = cxcy(img)
    nodes = [(cx - 40, cy - 40), (cx + 20, cy - 48), (cx - 50, cy + 20), (cx + 5, cy + 5), (cx + 45, cy + 30)]
    for (x1, y1) in nodes:
        for (x2, y2) in nodes:
            if (x1, y1) < (x2, y2):
                line(d, [(x1, y1), (x2, y2)], 4, fill=INK_DIM)
    for (x, y) in nodes:
        ellipse(d, (x - 10, y - 10, x + 10, y + 10), fill=INK, outline=None, w=0)
    rect(d, (cx + 28, cy - 20, cx + 62, cy + 55), fill=None, outline=INK, w=5, rad=4)
    for y in (-5, 12, 28):
        line(d, [(cx + 34, cy + y), (cx + 56, cy + y)], 4)


def glyph_qm(img):
    d, *_ = gdraw(img)
    cx, cy = cxcy(img)
    line(
        d,
        [(cx - 58, cy - 45), (cx - 12, cy - 58), (cx - 12, cy + 40), (cx - 58, cy + 15), (cx - 58, cy - 45)],
        7,
    )
    line(d, [(cx - 48, cy - 5), (cx - 38, cy + 8), (cx - 22, cy - 15)], 6)
    rect(d, (cx - 5, cy - 35, cx + 58, cy + 55), fill=None, outline=INK, w=7, rad=8)
    line(d, [(cx + 10, cy - 10), (cx + 42, cy - 10)], 5)
    line(d, [(cx + 10, cy + 8), (cx + 42, cy + 8)], 5)
    line(d, [(cx + 10, cy + 26), (cx + 30, cy + 26)], 5)


SPECS = [
    ("dashboard", "navy", glyph_dashboard),
    ("accommodation-stores", "slate", glyph_warehouse),
    ("delivery-note", "orange", glyph_truck),
    ("dp-f1-form", "steel", glyph_document),
    ("cost-comparative-schedule", "steel", glyph_scales_chart),
    ("duties-roles", "blue", glyph_person_clipboard),
    ("techstores-equipment-register", "slate", glyph_monitor_book),
    ("financial-year-bids", "green", glyph_calendar_money),
    ("gate-register", "forest", glyph_gate_book),
    ("gl-accounts", "green", glyph_ledger_calc),
    ("dp-procurement", "teal", glyph_cycle_cart),
    ("voucher-module", "blue", glyph_issue_voucher),
    ("it-dir-departments", "steel", glyph_org_chart),
    ("process-guides", "blue", glyph_learning),
    ("monthly-returns", "navy", glyph_monthly),
    ("orderly-room", "amber", glyph_shelves),
    ("purchase-orders", "green", glyph_po),
    ("release-cut", "forest", glyph_scissors_cut),
    ("reports-module", "blue", glyph_reports),
    ("stock-take", "slate", glyph_stocktake),
    ("suppliers-contracts", "wine", glyph_handshake),
    ("system-help", "steel", glyph_help_book),
    ("temporary-loans", "orange", glyph_loan),
    ("undelivered-orders", "red", glyph_undelivered),
    ("unit-checks", "slate", glyph_unit_check),
    ("unit-equipment", "steel", glyph_desk),
    ("unit-requisitions", "amber", glyph_requisition),
    ("user-management", "wine", glyph_users),
    ("workshop-repairs", "red", glyph_workshop),
    ("ict-accountability", "slate", glyph_asset_tag),
    ("ict-distribution", "steel", glyph_distribution),
    ("zna-qm-forms", "brass", glyph_qm),
]


def render(key, palette, glyph_fn):
    img = make_tile(PAL[palette])
    glyph_fn(img)
    img.save(OUT / f"{key}.png", "PNG")
    img.resize((128, 128), Image.Resampling.LANCZOS).save(OUT / f"{key}-128.png", "PNG")
    img.resize((64, 64), Image.Resampling.LANCZOS).save(OUT / f"{key}-64.png", "PNG")
    print(f"  {key} [{palette}]")


def main():
    print(f"Generating {len(SPECS)} custom icons -> {OUT}")
    for key, pal, fn in SPECS:
        render(key, pal, fn)
    print("Done.")


if __name__ == "__main__":
    main()
