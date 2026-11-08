# -*- coding: utf-8 -*-
"""Side by side pairs (before | after) from docs/cienie_budynkow/surowe into docs/cienie_budynkow/*.png
  python tools/cienie/zloz.py [tag]      (tag of the "after" shots: po2 - the box version of 2026-11-07, po - the first one)"""
import os, sys
from PIL import Image, ImageDraw
TAG = (sys.argv[1] if len(sys.argv) > 1 else "po2") + "_"
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "docs", "cienie_budynkow")
S = os.path.join(D, "surowe")
for f in sorted(os.listdir(S)):
    if not f.startswith(TAG): continue
    n = f[len(TAG):]
    a, b = os.path.join(S, "przed_" + n), os.path.join(S, f)
    if not os.path.exists(a): continue
    A, B = Image.open(a).convert("RGB"), Image.open(b).convert("RGB")
    w = Image.new("RGB", (A.width * 2 + 8, A.height), (255, 255, 255))
    w.paste(A, (0, 0)); w.paste(B, (A.width + 8, 0))
    d = ImageDraw.Draw(w)
    d.rectangle((6, 690, 70, 712), fill=(0, 0, 0)); d.text((12, 695), "PRZED", fill=(255, 255, 0))
    d.rectangle((A.width + 14, 690, A.width + 70, 712), fill=(0, 0, 0)); d.text((A.width + 20, 695), "PO", fill=(255, 255, 0))
    w.save(os.path.join(D, n))
    print(n)
