# -*- coding: utf-8 -*-
"""Włócznia szkieletu w chodzie bokiem (2026-11-12): PixelLab schował ją za tułów w klatkach stania i 1, 2, 6, 7, 8 rzędu wschodniego
(razem z grotem, który powinien sterczeć nad hełmem) - w chodzie migała, a stojąc bokiem szkielet nie miał broni. Włócznia z klatki 4
(cała: grot przy hełmie, drzewce do ziemi) jest dorysowana w tych klatkach przy ręce (drzewce w kolumnie SHAFT, w górę/dół jak hełm):
grot i góra drzewca przed twarzą, jak w klatkach 3-5, niżej tylko na pustych pikselach - nogi i płaszcz ją zasłaniają. Rząd zachodni = odbicie wschodniego.

  fix_east(cells) -> cells         (arkusze.py: rząd wschodni Walk8 włócznika, komórki 96 x 96, [0] = stoi)
  python tools/potwory2/art/wlocznia_grot.py [--podglad plik.png]   poprawia gotowe arkusze w tools/potwory2/nowe (Walk8 + stary $Cr_SkSpear.png)"""
import os, sys
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
OUT = os.path.join(ROOT, "tools", "potwory2", "nowe", "img", "characters")
CELL = 96
SRC = 4                      # (the frame whose spear is whole)
SRC_SHAFT, SRC_TOP = 61, 35  # (its shaft's column at the feet, its helmet's top row)
# (the shaft's column in the mended frames: on the stub PixelLab left of it - 58 in frames 2 and 6, 56 in the others; the swing
# round the cycle 56, 56, 58, 61, 61, 60, 58, 56, 56)
SHAFT = {0: 56, 1: 56, 2: 58, 6: 58, 7: 56, 8: 56}
MEND = [0, 1, 2, 6, 7, 8]
FRONT_TO = 52                # (the head and the upper shaft, down to the hand, are drawn in front of the face as in frames 3-5; lower: behind the body)

def helmet_top(c):
    px = c.load()
    return next(y for y in range(CELL) if any(px[x, y][3] >= 40 for x in range(30, 58)))

def spear_mask(c):
    """the spear of the source frame: its head and upper shaft (x 58-66, down to the hand), then only the shaft with its outline (x 60-62)"""
    px = c.load(); out = []
    for y in range(CELL):
        x0, x1 = (58, 66) if y <= 56 else (60, 62)
        for x in range(x0, x1 + 1):
            if px[x, y][3] >= 40: out.append((x, y, px[x, y]))
    return out

def fix_east(cells):
    cells = [c.copy() for c in cells]
    spear = spear_mask(cells[SRC]); top0 = helmet_top(cells[SRC])
    for i in MEND:
        if i >= len(cells): continue
        c = cells[i]; px = c.load(); dx = SHAFT[i] - SRC_SHAFT; dy = helmet_top(c) - top0
        for x, y, p in spear:
            X, Y = x + dx, y + dy
            if 0 <= X < CELL and 0 <= Y < CELL and (y <= FRONT_TO or px[X, Y][3] < 40): px[X, Y] = p
    return cells

def mend_files(preview=None):
    p = os.path.join(OUT, "anim8", "Cr_SkSpear_Walk8.png"); sheet = Image.open(p).convert("RGBA")
    n = sheet.width // CELL; E, W = 6, 2
    east = [sheet.crop((j * CELL, E * CELL, j * CELL + CELL, E * CELL + CELL)) for j in range(n)]
    fixed = fix_east(east)
    for j, c in enumerate(fixed):
        sheet.paste(c, (j * CELL, E * CELL))
        sheet.paste(c.transpose(Image.FLIP_LEFT_RIGHT), (j * CELL, W * CELL))
    sheet.save(p)
    # the old 4-way sheet (rows S, W, E, N; columns: walk step 1, standing, walk step 5 - arkusze.py)
    old_p = os.path.join(OUT, "$Cr_SkSpear.png"); old = Image.open(old_p).convert("RGBA")
    for ri, row in ((1, W), (2, E)):
        for ci, cj in enumerate([1, 0, min(5, n - 1)]):
            cell = sheet.crop((cj * CELL, row * CELL, cj * CELL + CELL, row * CELL + CELL))
            old.paste(cell, (ci * CELL, ri * CELL))
    old.save(old_p)
    if preview:
        bg = (70, 80, 72, 255); prev = Image.new("RGBA", (CELL * n * 3, CELL * 2 * 3), bg)
        for k, cells in enumerate((east, fixed)):
            row = Image.new("RGBA", (CELL * n, CELL), bg)
            for j, c in enumerate(cells): row.alpha_composite(c, (j * CELL, 0))
            prev.paste(row.resize((CELL * n * 3, CELL * 3), Image.NEAREST), (0, k * CELL * 3))
        prev.save(preview)
    print("włócznia: rząd wschodni i zachodni Walk8 + $Cr_SkSpear.png poprawione")

if __name__ == "__main__":
    a = sys.argv[1:]
    mend_files(a[a.index("--podglad") + 1] if "--podglad" in a else None)
