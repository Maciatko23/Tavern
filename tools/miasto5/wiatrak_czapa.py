# -*- coding: utf-8 -*-
"""Czapa wiatraka (2026-11-11): strzecha w ksztalcie dzwonu z kalenica-slupkiem, widziana na wprost, w kolorach strzechy Winlu (A3 rodzaj 59).
Arkusz postaci '!$' 3 x 4 komorek po 288 x 192; obraz w srodkowej kolumnie, pierwszy wiersz (kierunek w dol, wzor 1).
  python tools/miasto5/wiatrak_czapa.py [--force]"""
import os, sys, math, random
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
CW, CH = 288, 192
OUT = (96, 70, 48)
TH = [(124, 97, 67), (166, 126, 82), (195, 153, 113), (208, 180, 128), (233, 203, 151)]   # golden thatch (A3 kind 67), dark -> light
SH = (107, 79, 58)                                                                       # shade under the eave
WOOD = [(56, 45, 45), (80, 65, 55), (119, 99, 82)]
def hw(y):
    """half width of the cap at row y (0 top .. CH-1 bottom): a steep, slightly bellied cone"""
    base, top = CH - 10, 26
    if y < top or y > base: return -1
    t = (base - y) / (base - top)
    return 118 * (1 - t) ** 0.9 + 2
def main():
    path = os.path.join(ROOT, "img", "characters", "!$Wiatrak_Czapa.png")
    if os.path.exists(path) and "--force" not in sys.argv: print("exists, kept"); return
    random.seed(7)
    im = Image.new("RGBA", (CW, CH), (0, 0, 0, 0)); px = im.load(); cx = CW / 2
    for y in range(CH):
        w = hw(y)
        if w < 0: continue
        t = (CH - 10 - y) / (CH - 10 - 26)
        for x in range(CW):
            dx = x + 0.5 - cx
            if abs(dx) > w: continue
            edge = abs(dx) > w - 1.5 or y < 27
            strand = (hash((x // 2, 3)) * 2654435761 >> 7) % 3          # straw strands, a few pixels wide
            c = TH[strand]
            lit = 1 - (dx + w) / (2 * w)                                 # light from the left
            if lit < 0.3: c = TH[max(0, TH.index(c) - 1)]
            elif lit > 0.82: c = TH[min(3, TH.index(c) + 1)]
            for bt in (0.2, 0.45, 0.7):                                   # the binding bands (a rope round the thatch)
                if abs(t - bt) < 0.012: c = TH[0]
                if bt - 0.026 < t < bt - 0.012: c = TH[min(3, TH.index(c) + 1)] if c != TH[0] else c
            if y >= CH - 18:                                              # the fringe of the eave: ragged, with its shade
                ragged = (hash((x // 3, 11)) * 40503 >> 5) % 5
                if y >= CH - 12 + ragged: c = SH if y < CH - 4 else OUT
            px[x, y] = (OUT if edge else c) + (255,)
    # the ridge post
    for y in range(2, 26):
        for x in range(int(cx) - 3, int(cx) + 3):
            c = OUT if (x in (int(cx) - 3, int(cx) + 2) or y == 2) else (WOOD[2] if x == int(cx) - 2 else WOOD[1])
            if 0 <= y < CH: px[x, y] = c + (255,)
    sheet = Image.new("RGBA", (CW * 3, CH * 4), (0, 0, 0, 0)); sheet.paste(im, (CW, 0)); sheet.save(path); print("written", path)
if __name__ == "__main__": main()
