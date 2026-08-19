"""Generate simple brand mark PNGs for inventory Image column matching."""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).resolve().parent.parent / "assets" / "inventory" / "brands"
OUT.mkdir(parents=True, exist_ok=True)
SIZE = 720


def font(size: int):
    for name in ("segoeui.ttf", "arial.ttf", "calibri.ttf", "DejaVuSans-Bold.ttf"):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


def save(img: Image.Image, name: str) -> None:
    path = OUT / name
    img.save(path, "PNG", optimize=True)
    print("wrote", path.name)


def rounded_bg(color, radius=120) -> Image.Image:
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((40, 40, SIZE - 40, SIZE - 40), radius=radius, fill=color)
    return img


def letter_mark(bg, letters, fg=(255, 255, 255, 255), size=220) -> Image.Image:
    img = rounded_bg(bg)
    d = ImageDraw.Draw(img)
    f = font(size)
    bbox = d.textbbox((0, 0), letters, font=f)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    d.text(((SIZE - tw) / 2, (SIZE - th) / 2 - 20), letters, font=f, fill=fg)
    return img


def microsoft_365() -> Image.Image:
    """Four-tile Office / M365 style mark."""
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    gap = 28
    tile = (SIZE - 80 - gap) // 2
    colors = [
        ((40, 40), (217, 59, 48)),      # red
        ((40 + tile + gap, 40), (0, 164, 239)),  # blue
        ((40, 40 + tile + gap), (127, 186, 0)),  # green
        ((40 + tile + gap, 40 + tile + gap), (255, 185, 0)),  # yellow
    ]
    for (x, y), c in colors:
        d.rounded_rectangle((x, y, x + tile, y + tile), radius=36, fill=(*c, 255))
    return img


def windows_mark() -> Image.Image:
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((40, 40, SIZE - 40, SIZE - 40), radius=100, fill=(0, 120, 212, 255))
    gap = 18
    tile = (SIZE - 160 - gap) // 2
    ox, oy = 80, 90
    for i, (dx, dy) in enumerate([(0, 0), (1, 0), (0, 1), (1, 1)]):
        x = ox + dx * (tile + gap)
        y = oy + dy * (tile + gap)
        d.rectangle((x, y, x + tile, y + tile), fill=(255, 255, 255, 255))
    return img


def adobe_mark() -> Image.Image:
    img = rounded_bg((237, 33, 36, 255))
    d = ImageDraw.Draw(img)
    f = font(260)
    d.text((SIZE / 2 - 70, SIZE / 2 - 160), "Ae", font=f, fill=(255, 255, 255, 255))
    return img


def chatgpt_mark() -> Image.Image:
    img = rounded_bg((16, 163, 127, 255))
    d = ImageDraw.Draw(img)
    f = font(200)
    d.text((SIZE / 2 - 90, SIZE / 2 - 120), "GPT", font=f, fill=(255, 255, 255, 255))
    return img


def canva_mark() -> Image.Image:
    return letter_mark((0, 196, 204, 255), "Ca", size=240)


def cursor_mark() -> Image.Image:
    img = rounded_bg((20, 20, 20, 255))
    d = ImageDraw.Draw(img)
    # Simple cursor triangle
    d.polygon([(220, 160), (220, 520), (360, 400), (480, 520), (420, 360), (520, 320)], fill=(255, 255, 255, 255))
    return img


def github_mark() -> Image.Image:
    return letter_mark((36, 41, 47, 255), "GH", size=200)


def kaspersky_mark() -> Image.Image:
    return letter_mark((0, 108, 183, 255), "K", size=320)


def vmware_mark() -> Image.Image:
    return letter_mark((113, 175, 3, 255), "VW", size=180)


def oracle_mark() -> Image.Image:
    return letter_mark((248, 0, 0, 255), "O", size=320)


def teamviewer_mark() -> Image.Image:
    return letter_mark((14, 78, 168, 255), "TV", size=200)


def corel_mark() -> Image.Image:
    return letter_mark((0, 151, 214, 255), "Cd", size=220)


def apple_mark() -> Image.Image:
    return letter_mark((28, 28, 30, 255), "", size=40)  # overwritten
    # Better: simple apple-ish circle + bite via arcs is hard; use ""-like letter A


def apple_mark2() -> Image.Image:
    return letter_mark((28, 28, 30, 255), "", size=40)


def soft_generic() -> Image.Image:
    img = rounded_bg((99, 102, 241, 255), radius=140)
    d = ImageDraw.Draw(img)
    # Window chrome
    d.rounded_rectangle((160, 180, 560, 520), radius=28, fill=(255, 255, 255, 255))
    d.rectangle((160, 180, 560, 250), fill=(226, 232, 240, 255))
    for i, c in enumerate([(248, 113, 113), (250, 204, 21), (74, 222, 128)]):
        d.ellipse((190 + i * 36, 202, 214 + i * 36, 226), fill=(*c, 255))
    d.rounded_rectangle((200, 290, 520, 340), radius=10, fill=(226, 232, 240, 255))
    d.rounded_rectangle((200, 370, 420, 420), radius=10, fill=(226, 232, 240, 255))
    return img


def brand_circle(bg, text, fg=(255, 255, 255, 255), size=160) -> Image.Image:
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.ellipse((60, 60, SIZE - 60, SIZE - 60), fill=bg)
    f = font(size)
    bbox = d.textbbox((0, 0), text, font=f)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    d.text(((SIZE - tw) / 2, (SIZE - th) / 2 - 16), text, font=f, fill=fg)
    return img


def main() -> None:
    save(microsoft_365(), "microsoft-365.png")
    save(windows_mark(), "windows.png")
    save(adobe_mark(), "adobe.png")
    save(chatgpt_mark(), "chatgpt.png")
    save(canva_mark(), "canva.png")
    save(cursor_mark(), "cursor.png")
    save(github_mark(), "github.png")
    save(kaspersky_mark(), "kaspersky.png")
    save(vmware_mark(), "vmware.png")
    save(oracle_mark(), "oracle.png")
    save(teamviewer_mark(), "teamviewer.png")
    save(corel_mark(), "corel.png")
    save(letter_mark((28, 28, 30, 255), "Apple", size=110), "apple.png")
    # Hardware brands
    save(brand_circle((0, 150, 214, 255), "HP", size=200), "hp.png")
    save(brand_circle((0, 125, 186, 255), "DELL", size=140), "dell.png")
    save(brand_circle((224, 20, 29, 255), "Lenovo", size=110), "lenovo.png")
    save(brand_circle((0, 0, 0, 255), "cisco", size=130), "cisco.png")
    save(brand_circle((204, 0, 0, 255), "Canon", size=120), "canon.png")
    save(brand_circle((0, 0, 0, 255), "EPSON", size=120), "epson.png")
    save(brand_circle((0, 102, 51, 255), "Brother", size=100), "brother.png")
    save(brand_circle((218, 41, 28, 255), "Xerox", size=120), "xerox.png")
    save(brand_circle((0, 125, 195, 255), "Aruba", size=120), "aruba.png")
    save(brand_circle((5, 86, 165, 255), "UBNT", size=130), "ubiquiti.png")
    save(brand_circle((238, 49, 36, 255), "FG", size=180), "fortinet.png")
    save(brand_circle((0, 120, 215, 255), "MS", size=180), "microsoft.png")
    save(letter_mark((0, 114, 198, 255), "SQL", size=160), "sql-server.png")
    save(letter_mark((0, 97, 242, 255), "Google", size=100), "google.png")
    save(letter_mark((0, 120, 212, 255), "Copilot", size=100), "copilot.png")
    save(letter_mark((0, 151, 167, 255), "MySQL", size=120), "mysql.png")
    save(letter_mark((0, 122, 204, 255), "VS", size=200), "visual-studio.png")
    # Media / mobile / power brands & type icons
    save(letter_mark((20, 40, 160, 255), "SAMSUNG", size=90), "samsung.png")
    save(letter_mark((0, 0, 0, 255), "SanDisk", size=100), "sandisk.png")
    save(letter_mark((230, 0, 18, 255), "Kingston", size=90), "kingston.png")
    save(letter_mark((0, 102, 153, 255), "Transcend", size=80), "transcend.png")
    # Type icons also live under assets/inventory/
    inv = OUT.parent
    tab = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    td = ImageDraw.Draw(tab)
    td.rounded_rectangle((140, 80, 580, 640), radius=48, fill=(30, 41, 59, 255))
    td.rounded_rectangle((170, 120, 550, 560), radius=18, fill=(56, 189, 248, 255))
    td.ellipse((340, 590, 380, 630), fill=(148, 163, 184, 255))
    tab.save(inv / "tablet.png", "PNG", optimize=True)
    print("wrote tablet.png")
    ups = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    ud = ImageDraw.Draw(ups)
    ud.rounded_rectangle((120, 180, 600, 560), radius=40, fill=(15, 23, 42, 255))
    ud.rounded_rectangle((160, 220, 560, 420), radius=20, fill=(34, 197, 94, 255))
    ud.rectangle((260, 140, 340, 190), fill=(148, 163, 184, 255))
    ud.rectangle((380, 140, 460, 190), fill=(148, 163, 184, 255))
    uf = font(90)
    ub = ud.textbbox((0, 0), "UPS", font=uf)
    ud.text(((SIZE - (ub[2] - ub[0])) / 2, 460), "UPS", font=uf, fill=(255, 255, 255, 255))
    ups.save(inv / "ups-battery.png", "PNG", optimize=True)
    print("wrote ups-battery.png")
    print("done", OUT)


if __name__ == "__main__":
    main()
