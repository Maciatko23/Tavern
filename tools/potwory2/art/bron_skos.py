# -*- coding: utf-8 -*-
"""Broń w chodzie skosem od tyłu (2026-11-12): PixelLab zgubił pałkę w klatkach 1-3 rzędu NW (i NE - jego odbicia), a głowicę młota
w klatkach 3 i 4 - w chodzie migała pusta ręka. Broń z klatki, która ją ma (wszystko na lewo od dłoni, w pasie jej wysokości),
jest przeniesiona do dłoni (pierwszy kostny piksel od lewej na wysokości ręki) w tych klatkach, tylko na puste piksele.

  fix_nw(key, cells) -> cells      (arkusze.py: rząd NW Walk8 pałkarza / młotnika, [0] = stoi; NE = jego odbicie)
  python tools/potwory2/art/bron_skos.py [--podglad katalog]   poprawia gotowe arkusze w tools/potwory2/nowe (Walk8 + stary $Cr_*.png)"""
import os, sys
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
OUT = os.path.join(ROOT, "tools", "potwory2", "nowe", "img", "characters")
CELL = 96
# key: (look, the frame the weapon is taken from, the frames mended)
FIX = {"palka": ("SkClub", 0, [1, 2, 3]), "mlot": ("SkHammer", 2, [3, 4])}   # (the hammer standing - frame 0 - shows its handle held down: kept)

def hand(c):
    """the hand: the leftmost bone-light pixel at the arm's height (x, y of its left edge, the middle of that edge)"""
    px = c.load()
    bone = [(x, y) for y in range(64, 88) for x in range(10, 40) if px[x, y][3] >= 40 and px[x, y][0] > 190 and px[x, y][1] > 150 and px[x, y][2] > 100]
    if not bone: return None
    bx = min(b[0] for b in bone); edge = [b[1] for b in bone if b[0] <= bx + 3]
    return bx, round(sum(edge) / len(edge))

def weapon(c, h):
    """the weapon in the source frame: everything left of the hand, within 9 rows of it and 14 columns"""
    px = c.load(); hx, hy = h
    return [(x, y, px[x, y]) for y in range(hy - 9, hy + 10) for x in range(max(0, hx - 14), hx) if px[x, y][3] >= 40]

def fix_nw(key, cells):
    if key not in FIX: return cells
    _, src, mend = FIX[key]
    cells = [c.copy() for c in cells]
    hs = hand(cells[src]); w = weapon(cells[src], hs)
    for i in mend:
        h = hand(cells[i])
        if not h: continue
        px = cells[i].load(); dx, dy = h[0] - hs[0], h[1] - hs[1]
        for x, y, p in w:
            X, Y = x + dx, y + dy
            if 0 <= X < CELL and 0 <= Y < CELL and px[X, Y][3] < 40: px[X, Y] = p
    return cells

def mend_files(preview_dir=None):
    for key, (look, _, _) in FIX.items():
        p = os.path.join(OUT, "anim8", "Cr_%s_Walk8.png" % look); sheet = Image.open(p).convert("RGBA")
        n = sheet.width // CELL; NW, NE = 3, 5
        nw = [sheet.crop((j * CELL, NW * CELL, j * CELL + CELL, NW * CELL + CELL)) for j in range(n)]
        fixed = fix_nw(key, nw)
        for j, c in enumerate(fixed):
            sheet.paste(c, (j * CELL, NW * CELL))
            sheet.paste(c.transpose(Image.FLIP_LEFT_RIGHT), (j * CELL, NE * CELL))
        sheet.save(p)   # (the old 4-way sheet has no slanting rows: unchanged)
        if preview_dir:
            bg = (70, 80, 72, 255); prev = Image.new("RGBA", (CELL * n * 3, CELL * 2 * 3), bg)
            for k, cells in enumerate((nw, fixed)):
                row = Image.new("RGBA", (CELL * n, CELL), bg)
                for j, c in enumerate(cells): row.alpha_composite(c, (j * CELL, 0))
                prev.paste(row.resize((CELL * n * 3, CELL * 3), Image.NEAREST), (0, k * CELL * 3))
            prev.save(os.path.join(preview_dir, "bron_skos_%s.png" % key))
        print(key, "NW i NE poprawione")

if __name__ == "__main__":
    a = sys.argv[1:]
    mend_files(a[a.index("--podglad") + 1] if "--podglad" in a else None)
