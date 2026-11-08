# -*- coding: utf-8 -*-
"""Składa mozaikę zrzutów (tools/wyspy/zrzut_calej.js) w jeden obraz: python tools/wyspy/mozaika.py po 917 [skala]"""
import json, os, sys
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
D = os.path.join(HERE, "..", "..", "docs", "wyspy")
tag, mid = sys.argv[1], int(sys.argv[2]); sk = float(sys.argv[3]) if len(sys.argv) > 3 else 0.5
info = json.load(open(os.path.join(D, "surowe", "%s_%d_mozaika.json" % (tag, mid))))
xs = sorted({p[0] for p in info["list"]}); ys = sorted({p[1] for p in info["list"]})
MX, MY = 48, 72   # (px cut from each screen's sides / top and bottom - the HUD's shade; the screens overlap by more)
W, H = int(round((xs[-1] - xs[0]) * 48)) + 1280 - 2 * MX, int(round((ys[-1] - ys[0]) * 48)) + 720 - 2 * MY
out = Image.new("RGB", (W, H))
for k, (x, y) in enumerate(info["list"]):
    im = Image.open(os.path.join(D, "surowe", "%s_%d_m%d.png" % (tag, mid, k))).convert("RGB").crop((MX, MY, 1280 - MX, 720 - MY))
    out.paste(im, (int(round((x - xs[0]) * 48)), int(round((y - ys[0]) * 48))))
out = out.resize((int(W * sk), int(H * sk)), Image.LANCZOS)
out.save(os.path.join(D, "%s_%d_cala.png" % (tag, mid)))
print(out.size)
