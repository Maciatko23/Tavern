# -*- coding: utf-8 -*-
"""Arkusze przed/po szwów: dla każdego zmienionego szwu obraz PRZED nad obrazem PO (docs/swiat_szwy/przed/ i po/), ułożone w arkusze.
Szwy z mapą gracza idą osobno (gracz_przed_po_*.png).  python tools/swiat/szwy/arkusze.py"""
import os, sys, json
from PIL import Image, ImageDraw
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
D = os.path.join(ROOT, "docs", "swiat_szwy")
PL = {1, 3, 4, 8, 13, 23, 24, 25, 26, 111}
MAXW, MAXH = 2400, 1700
nazwy = sorted(f for f in os.listdir(os.path.join(D, "po")) if f.startswith("szew_"))
def zmieniony(f):
    a, b = Image.open(os.path.join(D, "przed", f)).convert("RGB"), Image.open(os.path.join(D, "po", f)).convert("RGB")
    return a.size != b.size or any(Image.eval(Image.new("L", a.size), lambda v: 0).getbbox() or True for _ in [0]) and (list(a.getdata()) != list(b.getdata()))
def para(f):
    s = f[5:-4].split("_"); return int(s[0]), int(s[1])
grupy = {"przed_po": [], "gracz_przed_po": []}
for f in nazwy:
    if not os.path.exists(os.path.join(D, "przed", f)) or not zmieniony(f): continue
    a, b = para(f)
    grupy["gracz_przed_po" if (a in PL or b in PL) else "przed_po"].append(f)
for g, lst in grupy.items():
    for fn in [x for x in os.listdir(D) if x.startswith(g + "_") and x.endswith(".png")]: os.remove(os.path.join(D, fn))
    bloki = []
    for f in lst:
        A, B = Image.open(os.path.join(D, "przed", f)).convert("RGB"), Image.open(os.path.join(D, "po", f)).convert("RGB")
        w = max(A.width, B.width); h = A.height + B.height + 40
        bl = Image.new("RGB", (w + 12, h), (20, 20, 20)); d = ImageDraw.Draw(bl)
        d.text((2, 1), f[5:-4].replace("_", " | ") + "  PRZED (góra) / PO (dół)", fill=(255, 220, 80))
        bl.paste(A, (0, 16)); d.text((2, A.height + 20), "po:", fill=(255, 220, 80)); bl.paste(B, (0, A.height + 34))
        bloki.append(bl)
    arkusze, cur, x, y, rowh = [], [], 0, 0, 0
    def nowy(): return Image.new("RGB", (MAXW, MAXH), (20, 20, 20))
    im = nowy(); x = y = rowh = 0; n = 0
    for bl in bloki:
        if bl.width > MAXW or bl.height > MAXH:
            bl = bl.resize((min(bl.width, MAXW), min(bl.height, MAXH)))
        if x + bl.width > MAXW: x, y, rowh = 0, y + rowh + 6, 0
        if y + bl.height > MAXH:
            n += 1; im.save(os.path.join(D, "%s_%d.png" % (g, n))); im = nowy(); x = y = rowh = 0
        im.paste(bl, (x, y)); x += bl.width + 6; rowh = max(rowh, bl.height)
    if bloki: n += 1; im.save(os.path.join(D, "%s_%d.png" % (g, n)))
    print(g, len(lst), "szwów,", n, "arkuszy")
