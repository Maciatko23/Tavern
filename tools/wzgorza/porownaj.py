# -*- coding: utf-8 -*-
"""Para zrzutów przed/po obok siebie (powiększenie): python tools/wzgorza/porownaj.py nazwa [x0 y0 x1 y1 [skala]] -> docs/wzgorza/" + os.environ.get("RUNDA", "runda3") + "/pary/para_<nazwa>.png"""
import sys, os
from PIL import Image
R = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
n = sys.argv[1]
a = Image.open(os.path.join(R, "docs/wzgorza/" + os.environ.get("RUNDA", "runda3") + "/przed_%s.png" % n)).convert("RGB")
b = Image.open(os.path.join(R, "docs/wzgorza/" + os.environ.get("RUNDA", "runda3") + "/po_%s.png" % n)).convert("RGB")
box = tuple(int(v) for v in sys.argv[2:6]) if len(sys.argv) >= 6 else (0, 0, a.width, a.height)
sc = int(sys.argv[6]) if len(sys.argv) >= 7 else (2 if box[2]-box[0] <= 640 else 1)
ca, cb = a.crop(box).resize(((box[2]-box[0])*sc, (box[3]-box[1])*sc), Image.NEAREST), b.crop(box).resize(((box[2]-box[0])*sc, (box[3]-box[1])*sc), Image.NEAREST)
w, h = ca.size
out = Image.new("RGB", (w*2+8, h), (255, 0, 255)); out.paste(ca, (0, 0)); out.paste(cb, (w+8, 0))
os.makedirs(os.path.join(R, "docs/wzgorza/" + os.environ.get("RUNDA", "runda3") + "/pary"), exist_ok=True)
p = os.path.join(R, "docs/wzgorza/" + os.environ.get("RUNDA", "runda3") + "/pary/para_%s%s.png" % (n, ("_%d_%d" % (box[0], box[1])) if len(sys.argv) >= 6 else ""))
out.save(p); print(p, out.size)
