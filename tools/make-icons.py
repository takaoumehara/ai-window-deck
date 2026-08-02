#!/usr/bin/env python3
"""Render the AI Window Deck icon set.

The mark is the product in one glyph: a 2x2 deck of windows with the
top-left pane spotlighted. Drawn at 8x and downsampled so the small sizes
keep clean edges.

    python3 tools/make-icons.py
"""
from pathlib import Path

from PIL import Image, ImageDraw

SIZES = (16, 32, 48, 128)
SUPERSAMPLE = 8
# Brand v2 "LAUNCH" (docs/brand.md): Ink ground, one Cobalt hero panel, Slate
# supports. No gradient — that document rules it out, and a flat mark survives
# 16px far better anyway.
INK = (11, 14, 20)
COBALT = (47, 91, 255)
SLATE = (126, 138, 160)
OUT = Path(__file__).resolve().parent.parent / "icons"


def render(size):
    s = size * SUPERSAMPLE
    icon = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    draw = ImageDraw.Draw(icon)
    draw.rounded_rectangle((0, 0, s - 1, s - 1), radius=round(s * 0.22), fill=INK + (255,))

    margin = s * 0.20
    gap = s * 0.075
    cell = (s - 2 * margin - gap) / 2
    radius = max(1, round(cell * 0.18))
    for row in range(2):
        for col in range(2):
            x0 = margin + col * (cell + gap)
            y0 = margin + row * (cell + gap)
            hero = row == 0 and col == 0
            # The hero panel breaks the grid a little — that offset is the
            # launch cue the brand direction asks for.
            lift = cell * 0.10 if hero else 0
            draw.rounded_rectangle(
                (x0 - lift, y0 - lift, x0 + cell + lift, y0 + cell + lift),
                radius=radius,
                fill=COBALT + (255,) if hero else SLATE + (215,),
            )
    return icon.resize((size, size), Image.LANCZOS)


def main():
    OUT.mkdir(exist_ok=True)
    for size in SIZES:
        path = OUT / f"icon-{size}.png"
        render(size).save(path)
        print(f"wrote {path.relative_to(OUT.parent)} ({size}x{size})")


if __name__ == "__main__":
    main()
