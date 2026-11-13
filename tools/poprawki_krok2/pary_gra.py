# -*- coding: utf-8 -*-
"""gra_MapNNN_x_y.png: lewo = zrzut z gry przed, prawo = po (nakladka staging), pasek z podpisem.  python pary_gra.py <katalog zrzutow zawierajacy przed/ i po/>"""
import os, sys
from PIL import Image, ImageDraw, ImageFont
D = sys.argv[1]; OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "docs", "audyt_map", "poprawki", "krok2")
try: f = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 16)
except Exception: f = ImageFont.load_default()
n = 0
for fn in sorted(os.listdir(os.path.join(D, "po"))):
    a = os.path.join(D, "przed", fn)
    if not os.path.exists(a): continue
    A = Image.open(a).convert("RGB"); B = Image.open(os.path.join(D, "po", fn)).convert("RGB")
    w = A.width * 2 + 6; im = Image.new("RGB", (w, A.height + 28), (255, 255, 255))
    d = ImageDraw.Draw(im); d.rectangle([0, 0, w, 27], fill=(24, 22, 30))
    d.text((8, 5), "%s  W GRZE   LEWO: przed | PRAWO: po kroku 2" % fn[:-4], font=f, fill=(255, 220, 90))
    im.paste(A, (0, 28)); im.paste(B, (A.width + 6, 28)); im.save(os.path.join(OUT, "gra_" + fn)); n += 1
print(n, "par")
