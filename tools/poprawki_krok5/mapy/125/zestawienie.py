# -*- coding: utf-8 -*-
"""zestawienie_gra.png: przeglad calej mapy (przed | po) + miniatury wszystkich par.  python tools/poprawki_krok5/zestawienie.py"""
import os
from PIL import Image, ImageDraw, ImageFont
HERE = os.path.dirname(os.path.abspath(__file__))
D = os.path.join(HERE, "..", "..", "..", "..", "docs", "audyt_map", "poprawki", "krok5", "125")
f = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 22)
A = Image.open(os.path.join(HERE, "tmp", "zdjecia", "before", "przeglad.png")).convert("RGB"); B = Image.open(os.path.join(HERE, "tmp", "zdjecia", "after", "przeglad.png")).convert("RGB")
# przeglad: pelna rozdzielczosc obok siebie (po 1920) -> osobny plik, a w zestawieniu 1000 px kazdy
S = 1000
ov = Image.new("RGB", (S * 2 + 10, S + 34), (255, 255, 255)); d = ImageDraw.Draw(ov); d.rectangle([0, 0, ov.width, 33], fill=(24, 22, 30))
d.text((10, 5), "CALA MAPA W GRZE (Map125)   LEWO: przed | PRAWO: po", font=f, fill=(255, 220, 90))
ov.paste(A.resize((S, S), Image.LANCZOS), (0, 34)); ov.paste(B.resize((S, S), Image.LANCZOS), (S + 10, 34))
ov.save(os.path.join(D, "przeglad_cala_mapa.png"))
names = [fn[:-4] for fn in sorted(os.listdir(D)) if fn[0] in "fz" and fn.endswith(".png") and fn != "zestawienie_gra.png"]
W = S * 2 + 10; rows = [ov]; col = []
for n in names:
    im = Image.open(os.path.join(D, n + ".png")); k = (W // 2 - 5) / im.width
    col.append(im.resize((int(im.width * k), int(im.height * k)), Image.LANCZOS))
y = ov.height + 10; sheet_h = ov.height + 10
lines = []; cur = []; cw = 0
for im in col:
    if cw + im.width > W and cur: lines.append(cur); cur = []; cw = 0
    cur.append(im); cw += im.width + 10
if cur: lines.append(cur)
H = ov.height + 10 + sum(max(i.height for i in l) + 10 for l in lines)
sheet = Image.new("RGB", (W, H), (255, 255, 255)); sheet.paste(ov, (0, 0)); yy = ov.height + 10
for l in lines:
    xx = 0
    for im in l: sheet.paste(im, (xx, yy)); xx += im.width + 10
    yy += max(i.height for i in l) + 10
sheet.save(os.path.join(D, "zestawienie_gra.png")); print(sheet.size)
