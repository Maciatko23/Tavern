# -*- coding: utf-8 -*-
"""pary przed/po z gry: lewo przed, prawo po, pasek z podpisem -> docs/audyt_map/poprawki/krok5/<id>.png
  python tools/poprawki_krok5/pary.py [id,id,...]   (zrodlo: tools/poprawki_krok5/tmp/zdjecia/{before,after}; podpisy: podpisy.json)"""
import os, sys, json
from PIL import Image, ImageDraw, ImageFont
HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "tmp", "zdjecia"); OUT = os.path.join(HERE, "..", "..", "..", "..", "docs", "audyt_map", "poprawki", "krok5", "125")
os.makedirs(OUT, exist_ok=True)
try: f = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 16)
except Exception: f = ImageFont.load_default()
cap = json.load(open(os.path.join(HERE, "podpisy.json"), encoding="utf-8")) if os.path.exists(os.path.join(HERE, "podpisy.json")) else {}
ids = sys.argv[1].split(",") if len(sys.argv) > 1 else [fn[:-4] for fn in sorted(os.listdir(os.path.join(SRC, "after")))]
for i in ids:
    a, b = os.path.join(SRC, "before", i + ".png"), os.path.join(SRC, "after", i + ".png")
    if not (os.path.exists(a) and os.path.exists(b)): continue
    A, B = Image.open(a).convert("RGB"), Image.open(b).convert("RGB")
    w = A.width * 2 + 6; im = Image.new("RGB", (w, A.height + 28), (255, 255, 255))
    d = ImageDraw.Draw(im); d.rectangle([0, 0, w, 27], fill=(24, 22, 30))
    d.text((8, 5), "%s  W GRZE   LEWO: przed | PRAWO: po" % cap.get(i, i), font=f, fill=(255, 220, 90))
    im.paste(A, (0, 28)); im.paste(B, (A.width + 6, 28)); im.save(os.path.join(OUT, i + ".png"))
    print(i, im.size)
