"""Monochrome v6 icons drawn from site/assets/icon-v6.svg.

Writes the 128 x 128 Chrome Web Store icon (96 px artwork, 16 px transparent padding, as
Chrome's icon guidelines ask for) and the extension's icons/icon-{16,32,48,128}.png.
"""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
SCALE = 8
# (x, y, w, h, radius, colour) in the SVG's 64-unit viewBox.
RECTS = [
    (0, 0, 64, 64, 14, "#0b0b0b"),
    (10.5, 10.5, 20.5, 20.5, 3.75, "#f3f2ee"),
    (34.5, 12, 17.5, 17.5, 3.25, "#74736f"),
    (12, 34.5, 17.5, 17.5, 3.25, "#74736f"),
    (34.5, 34.5, 17.5, 17.5, 3.25, "#74736f"),
]


def icon(size, art):
    pad = (size - art) / 2 * SCALE
    unit = art / 64 * SCALE
    img = Image.new("RGBA", (size * SCALE, size * SCALE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    for x, y, w, h, r, colour in RECTS:
        x0, y0 = pad + x * unit, pad + y * unit
        draw.rounded_rectangle((x0, y0, x0 + w * unit, y0 + h * unit), radius=r * unit, fill=colour)
    return img.resize((size, size), Image.LANCZOS)


targets = {ROOT / "store-assets/listing/store-icon-128.png": (128, 96), ROOT / "icons/icon-128.png": (128, 96)}
targets.update({ROOT / f"icons/icon-{s}.png": (s, s) for s in (16, 32, 48)})
for path, (size, art) in targets.items():
    path.parent.mkdir(parents=True, exist_ok=True)
    icon(size, art).save(path)
    print(path.relative_to(ROOT))
