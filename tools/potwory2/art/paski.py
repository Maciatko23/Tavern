# -*- coding: utf-8 -*-
"""python tools/potwory2/art/paski.py -> docs/zadania_nowe/potwory2_gra/pasek_<wyglad>.png: for each look, the walk, the blow and the fall (the south and the east rows of
the 8-way sheets in tools/potwory2/nowe/img/characters/anim8) at twice the size on grey; then the sheets of the crab (the live ones)."""
import os
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
A = os.path.join(ROOT, "tools", "potwory2", "nowe", "img", "characters", "anim8")
OUT = os.path.join(ROOT, "docs", "zadania_nowe", "potwory2_gra")
os.makedirs(OUT, exist_ok=True)
CELL = 96
ROWS = {"S": 0, "E": 6}
def row(look, part, r, scale=2):
    p = os.path.join(A, "Cr_%s_%s.png" % (look, part))
    if not os.path.exists(p): p = os.path.join(ROOT, "img", "characters", "anim8", "Cr_%s_%s.png" % (look, part))
    im = Image.open(p).convert("RGBA")
    n = im.width // CELL
    return [im.crop((i * CELL, ROWS[r] * CELL, (i + 1) * CELL, (ROWS[r] + 1) * CELL)).resize((CELL * scale, CELL * scale), Image.NEAREST) for i in range(n)]
def strip(look, scale=2):
    blocks = []
    for part, label in (("Walk8", "chód"), ("Atk8", "cios"), ("Die8", "upadek")):
        for r in "SE":
            blocks.append(row(look, part, r, scale))
    W = max(len(b) for b in blocks) * CELL * scale
    H = len(blocks) * CELL * scale
    im = Image.new("RGBA", (W, H), (70, 80, 70, 255))
    for i, b in enumerate(blocks):
        for j, c in enumerate(b): im.alpha_composite(c, (j * CELL * scale, i * CELL * scale))
    return im
if __name__ == "__main__":
    for look in ("SkClub", "SkSword", "SkSpear", "SkHammer", "SkCaptain", "SeaCrab"):
        im = strip(look)
        im.save(os.path.join(OUT, "pasek_%s.png" % look))
        print(look, im.size)
