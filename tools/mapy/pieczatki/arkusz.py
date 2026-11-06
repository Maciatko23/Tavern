# -*- coding: utf-8 -*-
"""Arkusz podglądów wszystkich pieczątek (dane/*.png) -> plik. python tools/mapy/pieczatki/arkusz.py WYJSCIE.png [skala] [nazwy...]"""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import pieczatki as P
from PIL import Image, ImageDraw
out = sys.argv[1]; sk = float(sys.argv[2]) if len(sys.argv) > 2 else 0.5
nazwy = sys.argv[3:] or P.wszystkie_pieczatki()
ims = []
for n in nazwy:
    p = os.path.join(P.DANE, n + ".png")
    if os.path.exists(p):
        im = Image.open(p).convert("RGB"); im = im.resize((int(im.width * sk), int(im.height * sk))); ims.append((n, im))
colw = max(i.width for _, i in ims)
W = 1600; x = y = 0; rowh = 0; pos = []
for n, im in ims:
    if x + im.width > W: x = 0; y += rowh + 18; rowh = 0
    pos.append((x, y + 14)); x += im.width + 8; rowh = max(rowh, im.height + 14)
sheet = Image.new("RGB", (W, y + rowh + 18), (20, 20, 20)); d = ImageDraw.Draw(sheet)
for (n, im), (px, py) in zip(ims, pos):
    sheet.paste(im, (px, py)); d.text((px + 2, py - 12), n, fill=(255, 255, 0))
sheet.save(out)
