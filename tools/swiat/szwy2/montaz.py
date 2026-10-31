# -*- coding: utf-8 -*-
"""Montaż samych obrazów PO (docs/swiat_szwy2/po) w arkusze do przeglądu: python tools/swiat/szwy2/montaz.py WYJŚCIE_DIR [skala]"""
import os, sys
from PIL import Image, ImageDraw
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
D = os.path.join(ROOT, "docs", "swiat_szwy2", "po"); OUT = sys.argv[1]; s = float(sys.argv[2]) if len(sys.argv) > 2 else 0.62
os.makedirs(OUT, exist_ok=True)
bl = []
for f in sorted(x for x in os.listdir(D) if x.startswith("szew_")):
    im = Image.open(os.path.join(D, f)).convert("RGB"); im = im.resize((max(1, int(im.width * s)), max(1, int(im.height * s))), Image.LANCZOS)
    b = Image.new("RGB", (im.width + 4, im.height + 14), (20, 20, 20)); ImageDraw.Draw(b).text((2, 1), f[5:-4].replace("_", " | "), fill=(255, 220, 80)); b.paste(im, (2, 13)); bl.append(b)
bl.sort(key=lambda b: -b.height)
W_, H_ = 1900, 1500; n = 0; im = Image.new("RGB", (W_, H_), (20, 20, 20)); x = y = rh = 0
for b in bl:
    b = b.crop((0, 0, min(b.width, W_), min(b.height, H_)))
    if x + b.width > W_: x = 0; y += rh + 4; rh = 0
    if y + b.height > H_: n += 1; im.save(os.path.join(OUT, "po_%d.png" % n)); im = Image.new("RGB", (W_, H_), (20, 20, 20)); x = y = rh = 0
    im.paste(b, (x, y)); x += b.width + 4; rh = max(rh, b.height)
n += 1; im.save(os.path.join(OUT, "po_%d.png" % n)); print(n)
