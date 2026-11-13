# -*- coding: utf-8 -*-
"""Skrzydla wiatraka (2026-11-11): cztery drewniane skrzydla z kratownica, widziane na wprost, w kolorach i grubosci konturu kafli Winlu.
12 klatek obrotu co 7,5 stopnia (cwiartka obrotu = 90 stopni, bo skrzydla sa symetryczne: klatka 12 = klatka 0), po 4 klatki w kazdym z trzech arkuszy
postaci (wiersz arkusza = kierunek: dol, lewo, prawo, gora; srodkowa kolumna = wzor 1):
  img/characters/!$Wiatrak_Skrzydla.png (klatki 0-3), !$Wiatrak_Skrzydla_2.png (4-7), !$Wiatrak_Skrzydla_3.png (8-11).
Zdarzenie obraca je trasa ruchu (build5.py, sekcja 7e): Zmien grafike + Obroc + Czekaj. Nie nadpisuje istniejacych plikow.
  python tools/miasto5/wiatrak_skrzydla.py"""
import os, math, sys
import numpy as np
from PIL import Image, ImageDraw
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
CW, CH = 288, 288          # one frame (6 x 6 tiles); the sails span 5 tiles
HUB = (144, 154)          # the axle inside the frame (the event stands on the body's middle tile, 3 rows under the hub)
SS = 4                     # supersampling: drawn aliased at 4x, then every output pixel takes the most common colour (sharp pixels, no blur)
# Winlu's own colours (sampled from the tileset's beams, plaster and cloth)
OUT   = (29, 24, 28)
WOOD0 = (56, 45, 45)       # dark board
WOOD1 = (80, 65, 55)       # beam
WOOD2 = (119, 99, 82)      # beam highlight
CLOTH0 = (130, 118, 100)   # sail cloth in shade
CLOTH1 = (162, 149, 126)   # sail cloth
PAL = [OUT, WOOD0, WOOD1, WOOD2, CLOTH0, CLOTH1]
def rot(pts, a, cx, cy):
    ca, sa = math.cos(a), math.sin(a)
    return [(cx + (x * ca - y * sa) * SS, cy + (x * sa + y * ca) * SS) for x, y in pts]
def frame(angle_deg):
    big = Image.new("P", (CW * SS, CH * SS), 255); pal = []
    for c in PAL: pal += list(c)
    big.putpalette(pal + [0] * (768 - len(pal))); d = ImageDraw.Draw(big)
    cx, cy = HUB[0] * SS, HUB[1] * SS
    def poly(pts, a, col): d.polygon(rot(pts, a, cx, cy), fill=col)
    def box(r0, r1, y0, y1): return [(r0, y0), (r1, y0), (r1, y1), (r0, y1)]
    for k in range(4):
        a = math.radians(angle_deg + 90 * k); S = 1.2
        # the stock (the long beam) with an outline, its lit edge on the leading side
        poly(box(5 * S, 101 * S, -4.5 * S, 4.5 * S), a, 0); poly(box(6 * S, 100 * S, -3.5 * S, 3.5 * S), a, 2); poly(box(6 * S, 100 * S, 1.2 * S, 3.5 * S), a, 1); poly(box(6 * S, 100 * S, -3.5 * S, -2.2 * S), a, 3)
        # the lattice sail on the leading side: outline, board frame, cloth between crossbars
        poly(box(21 * S, 100 * S, 3.5 * S, 27.5 * S), a, 0); poly(box(22 * S, 99 * S, 4.5 * S, 26.5 * S), a, 1)
        poly(box(22 * S, 99 * S, 4.5 * S, 6.0 * S), a, 3); poly(box(22 * S, 24 * S, 4.5 * S, 26.5 * S), a, 3)
        poly(box(25 * S, 96 * S, 8.0 * S, 23.0 * S), a, 4); poly(box(25 * S, 96 * S, 8.0 * S, 15.0 * S), a, 5)
        for rr in range(33, 96, 13): poly(box(rr * S, (rr + 2.4) * S, 7.0 * S, 24.0 * S), a, 1)
        poly(box(25 * S, 96 * S, 15.0 * S, 16.4 * S), a, 1)
    # the hub: a round cap with a nail
    d.ellipse((cx - 12 * SS, cy - 12 * SS, cx + 12 * SS, cy + 12 * SS), fill=0)
    d.ellipse((cx - 10.5 * SS, cy - 10.5 * SS, cx + 10.5 * SS, cy + 10.5 * SS), fill=2)
    d.ellipse((cx - 10.5 * SS, cy - 10.5 * SS, cx + 5 * SS, cy + 5 * SS), fill=3)
    d.ellipse((cx - 10.5 * SS, cy - 10.5 * SS, cx + 10.5 * SS, cy + 10.5 * SS), outline=None)
    d.ellipse((cx - 3.2 * SS, cy - 3.2 * SS, cx + 3.2 * SS, cy + 3.2 * SS), fill=0)
    d.ellipse((cx - 1.8 * SS, cy - 1.8 * SS, cx + 1.8 * SS, cy + 1.8 * SS), fill=1)
    a = np.array(big).reshape(CH, SS, CW, SS).transpose(0, 2, 1, 3).reshape(CH, CW, SS * SS)
    out = np.zeros((CH, CW, 4), np.uint8)
    for y in range(CH):
        row = a[y]
        for x in range(CW):
            v = np.bincount(row[x], minlength=256)
            if v[255] > SS * SS * 0.5: continue          # mostly empty: transparent
            v[255] = 0; c = int(v.argmax()); out[y, x, :3] = PAL[c]; out[y, x, 3] = 255
    return Image.fromarray(out, "RGBA")
def main():
    names = ["!$Wiatrak_Skrzydla.png", "!$Wiatrak_Skrzydla_2.png", "!$Wiatrak_Skrzydla_3.png"]
    for si, nm in enumerate(names):
        path = os.path.join(ROOT, "img", "characters", nm)
        if os.path.exists(path) and "--force" not in sys.argv: print("exists, kept:", nm); continue
        sheet = Image.new("RGBA", (CW * 3, CH * 4), (0, 0, 0, 0))
        for row in range(4):
            f = si * 4 + row; sheet.paste(frame(7.5 * f + 22.5), (CW * 1, CH * row))      # the middle column (pattern 1); X position at rest 22.5 deg
        sheet.save(path); print("written", path)
if __name__ == "__main__": main()
