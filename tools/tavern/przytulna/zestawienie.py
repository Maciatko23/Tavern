# -*- coding: utf-8 -*-
"""Zestawienie przed/po: docs/tawerna_przytulna/zestawienie.png (4 pary kadrów obok siebie, podpisane)."""
import os
from PIL import Image, ImageDraw, ImageFont
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "..", "docs", "tawerna_przytulna")
PARY = [("noc", "Sala, noc (20:00)"), ("bar_noc", "Bar, noc"), ("kominek", "Kącik przy kominku, noc"), ("scena", "Scena z grajkiem, noc"), ("dzien", "Sala, dzień"), ("bar_dzien", "Bar, dzień")]
W, H = 640, 360
try:
    f = ImageFont.truetype("arial.ttf", 20)
except Exception:
    f = ImageFont.load_default()
out = Image.new("RGB", (W * 2 + 30, (H + 36) * len(PARY) + 6), (22, 18, 16))
d = ImageDraw.Draw(out)
for i, (k, t) in enumerate(PARY):
    y = 6 + i * (H + 36)
    d.text((10, y + 4), t + "    (lewo: przed, prawo: po)", fill=(240, 200, 120), font=f)
    for j, p in enumerate(("przed", "po")):
        im = Image.open(os.path.join(D, "%s_%s.png" % (p, k))).convert("RGB").resize((W, H), Image.LANCZOS)
        out.paste(im, (10 + j * (W + 10), y + 32))
out.save(os.path.join(D, "zestawienie.png"))
print("zapisano zestawienie.png")
