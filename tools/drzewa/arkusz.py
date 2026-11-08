# -*- coding: utf-8 -*-
"""Duże drzewa do ścinania (gracz 2026-11-07: „niech każde drzewo w grze da się ściąć”): arkusz !$Big_Trees_green bez namalowanego cienia
na ziemi w klatkach drzew, które stają się do ścinania - ich cień liczy gra na bieżąco (Sky.js, jak sosen). Nowy plik
img/characters/!$Big_Trees_scinane.png; stary zostaje dla zapór na brzegach map, drzew ze skał i koron krzaków.
Cień namalowany: czarne półprzezroczyste piksele (krycie ~25-30%; liście i pnie nie mają żadnych półprzezroczystych pikseli).
  python tools/drzewa/arkusz.py [--podglad plik.png]"""
import os, sys
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
SRC = os.path.join(ROOT, "img", "characters", "!$Big_Trees_green.png")
DST = os.path.join(ROOT, "img", "characters", "!$Big_Trees_scinane.png")
FW, FH = 192, 288
# (row, column) of the tree frames that become choppable: row = direction 2/4/6/8 -> 0..3, column = pattern
TREES = [(0, 2), (1, 1), (1, 2), (2, 1), (2, 2), (3, 0), (3, 1), (3, 2)]
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass

im = Image.open(SRC).convert("RGBA")
px = im.load()
gone = {}
for r, c in TREES:
    n = 0
    for y in range(FH):
        for x in range(FW):
            X, Y = c * FW + x, r * FH + y
            R, G, B, A = px[X, Y]
            if 0 < A < 200 and R + G + B < 30:
                px[X, Y] = (0, 0, 0, 0)
                n += 1
    gone[(r, c)] = n
im.save(DST)
print("zapisane:", DST)
print("zdjęte piksele cienia w klatkach:", gone)
if "--podglad" in sys.argv:
    out = sys.argv[sys.argv.index("--podglad") + 1]
    a = Image.open(SRC).convert("RGBA")
    W, H = a.size
    pv = Image.new("RGBA", (W * 2 + 20, H), (90, 140, 70, 255))
    pv.alpha_composite(a, (0, 0))
    pv.alpha_composite(im, (W + 20, 0))
    pv.save(out)
    print("podgląd:", out)
