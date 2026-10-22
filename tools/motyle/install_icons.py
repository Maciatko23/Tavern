# -*- coding: utf-8 -*-
"""Ikony motyli w img/system/IconSet.png:
  441 siatka na motyle, 442 rysunek Eli, 443 motyl (dymki) - trzy ostatnie wolne pola starego arkusza (już nasze);
  448-452 cytrynek, pawik, modraszek, bielinek, ćma - nowy rząd 29 (2026-10-18: arkusz rośnie z 896 do 928 px wysokości; szerokość
  i stare pola bez zmian, więc żaden dawny numer ikony się nie przesuwa).
Pola nowego rzędu muszą być puste (albo mieć już tę samą ikonę) - inaczej nic nie zapisuje.
Kopia przed motylami: backup_art_2026-10-18/motyle/IconSet_przed_motylami.png
Zapis przy zamkniętym edytorze RPG Maker (sprawdź tasklist osobnym poleceniem).

  python tools/motyle/install_icons.py
"""
import os, sys
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
ART = os.path.join(os.path.dirname(os.path.abspath(__file__)), "art")
OURS = {441: "ikona_441_siatka.png", 442: "ikona_442_rysunek.png", 443: "ikona_443_motyl.png"}
NEW = {448: "ikona_448_cytrynek.png", 449: "ikona_449_pawik.png", 450: "ikona_450_modraszek.png", 451: "ikona_451_bielinek.png", 452: "ikona_452_cma.png"}
NEED_H = 29 * 32   # 928: the new 29th row (448-463)

p = os.path.join(ROOT, "img", "system", "IconSet.png")
im = Image.open(p).convert("RGBA")
W, H = im.size
if W != 512:
    sys.exit("IconSet.png ma szerokość %d (oczekiwano 512) - przerwano" % W)
if H < NEED_H:   # one more row of 16 empty cells at the bottom: the old cells keep their places
    grown = Image.new("RGBA", (W, NEED_H), (0, 0, 0, 0))
    grown.paste(im, (0, 0))
    im = grown
cols = W // 32
for idx, name in list(OURS.items()) + list(NEW.items()):
    x, y = (idx % cols) * 32, (idx // cols) * 32
    cell = im.crop((x, y, x + 32, y + 32))
    ic = Image.open(os.path.join(ART, name)).convert("RGBA")
    if idx in NEW and cell.getbbox() is not None and list(cell.getdata()) != list(ic.getdata()):
        sys.exit("pole %d nie jest puste - przerwano" % idx)
    im.paste(Image.new("RGBA", (32, 32), (0, 0, 0, 0)), (x, y))
    im.alpha_composite(ic, (x, y))
im.save(p)
print("IconSet %dx%d: ikony 441-443 i 448-452 wklejone" % im.size)
