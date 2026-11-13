# -*- coding: utf-8 -*-
"""Kruczarnia: arkusze zerdzi z krukami (z istniejacych img/system/Kruk.png i Kruk_Grzeda_Stara.png - nic nowego z PixelLaba).
Zapis do tools/listonosz/overlay/img/characters/ (nic w img/ gry). Komorka 96x128 (3 wzorce x 4 kierunki):
  wzorzec 0 stoi, 1 kracze, 2 dziobie;  wiersze: dol/lewo = kruk zwrocony w lewo, prawo = w prawo, gora = spi (3 klatki snu)
  !$Kruczarnia_Zerdz.png (zerdz + kruk), !$Kruczarnia_ZerdzPusta.png (sama zerdz)"""
import os, sys
from PIL import Image
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
OUT = os.path.join(ROOT, "tools", "listonosz", "art")
os.makedirs(OUT, exist_ok=True)
K = Image.open(os.path.join(ROOT, "img", "system", "Kruk.png")).convert("RGBA")
P = Image.open(os.path.join(ROOT, "img", "system", "Kruk_Grzeda_Stara.png")).convert("RGBA")
def cell(r, c): return K.crop((c * 48, r * 48, c * 48 + 48, r * 48 + 48))
CW, CH = 96, 128
STAND, CAW, PECK = (0, 0), (0, 4), (1, 4)
SLEEP = [(6, 1), (6, 2), (6, 3)]
def comp(raven, flip):
    im = Image.new("RGBA", (CW, CH), (0, 0, 0, 0))
    px, py = (CW - P.width) // 2, CH - 4 - P.height
    im.alpha_composite(P, (px, py))
    if raven is not None:
        r = cell(*raven)
        if flip: r = r.transpose(Image.FLIP_LEFT_RIGHT)
        im.alpha_composite(r, ((CW - 48) // 2 - (4 if flip else -4) + (0), py - 45 + 4))
    return im
def sheet(frames_for_dir):
    s = Image.new("RGBA", (CW * 3, CH * 4), (0, 0, 0, 0))
    for row in range(4):
        for col in range(3):
            s.alpha_composite(frames_for_dir(row, col), (col * CW, row * CH))
    return s
def full(row, col):
    if row == 3: return comp(SLEEP[col], False)
    return comp([STAND, CAW, PECK][col], row != 2)   # rows 0,1 (down,left) face left; row 2 (right) faces right
sheet(full).save(os.path.join(OUT, "!$Kruczarnia_Zerdz.png"))
sheet(lambda r, c: comp(None, False)).save(os.path.join(OUT, "!$Kruczarnia_ZerdzPusta.png"))
print("ok", OUT)
