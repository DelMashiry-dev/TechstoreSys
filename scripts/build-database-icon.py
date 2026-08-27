"""Build Windows ICO for START-SYSTEM shortcut from assets/database-icon-source.png."""
from pathlib import Path

from PIL import Image

ASSETS = Path(__file__).resolve().parent.parent / "assets"
SRC = ASSETS / "database-icon-source.png"
ICO = ASSETS / "database.ico"
PNG = ASSETS / "database-icon.png"


def main() -> None:
    if not SRC.is_file():
        raise SystemExit(f"Missing source image: {SRC}")

    ASSETS.mkdir(parents=True, exist_ok=True)
    img = Image.open(SRC).convert("RGBA")
    side = max(img.size)
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    canvas.paste(img, ((side - img.size[0]) // 2, (side - img.size[1]) // 2), img)

    canvas.save(PNG, "PNG")
    canvas.save(
        ICO,
        format="ICO",
        sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)],
    )
    print(f"PNG -> {PNG} ({canvas.size[0]}x{canvas.size[1]})")
    print(f"ICO -> {ICO} ({ICO.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
