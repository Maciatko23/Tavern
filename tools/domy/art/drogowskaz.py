# python tools/domy/art/drogowskaz.py  -> img/characters/!$Drogowskaz.png
# The signpost at the way from Skraj lasu (Map023, tileset 9: no C sheet) to the burnt farm (Map168): the town tileset's own
# two-armed signpost (Fantasy_Outside_C, C(2, 14..15), 1 x 2 cells: plib's "signpost_b") as a "!$" character - 3 x 4 frames
# of 48 x 96, all the same picture.
import os
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
SRC = os.path.join(ROOT, "img", "tilesets", "Winlu Fantasy Tileset - Exterior", "Winlu Fantasy Exterior", "tilesets", "Fantasy_Outside_C.png")
OUT = os.path.join(ROOT, "img", "characters", "!$Drogowskaz.png")
sheet = Image.open(SRC).convert("RGBA")
cut = lambda col: sheet.crop((col * 48, 14 * 48, col * 48 + 48, 16 * 48))
rows = [cut(2)] * 4
out = Image.new("RGBA", (48 * 3, 96 * 4), (0, 0, 0, 0))
for r, im in enumerate(rows):
    for c in range(3): out.alpha_composite(im, (c * 48, r * 96))
out.save(OUT)
print(OUT, out.size)
