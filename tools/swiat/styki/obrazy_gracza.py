# -*- coding: utf-8 -*-
"""Zestawienia przed/po (skala 1:1, 48 px na kratkę) każdej zmienionej krawędzi map gracza: docs/swiat_styki/krawedzie_gracza_<mapa>.png
   python tools/swiat/styki/obrazy_gracza.py [id ...]"""
import os, sys, json
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "mapy"))
import numpy as np, cv2
from PIL import Image, ImageDraw
import mapylib as L
OUT = os.path.join(ROOT, "docs", "swiat_styki"); os.makedirs(OUT, exist_ok=True)
STG = os.path.join(HERE, "staging", "data")
PL = [3, 4, 8, 13, 23, 24, 111]
ids = [int(a) for a in sys.argv[1:]] or PL
for mid in ids:
    a = L.Mapa(mid); b = L.Mapa(mid, path=os.path.join(STG, "Map%03d.json" % mid))
    diff = np.zeros((a.H, a.W), np.uint8)
    for z in range(6):
        for y in range(a.H):
            for x in range(a.W):
                if a.t(z, x, y) != b.t(z, x, y): diff[y, x] = 1
    ea = {(e.x, e.y, e.char) for e in a.zd}; eb = {(e.x, e.y, e.char) for e in b.zd}
    for (x, y, _) in ea ^ eb: diff[y, x] = 1
    if not diff.any(): print(mid, "bez zmian"); continue
    n, lab, st, _ = cv2.connectedComponentsWithStats(cv2.dilate(diff, np.ones((5, 5), np.uint8)), connectivity=8)
    chunks = []
    for i in range(1, n):
        x0, y0, w, h = st[i, 0], st[i, 1], st[i, 2], st[i, 3]
        # długie odcinki dzielimy na kawałki po 22 kratki (po dłuższym boku)
        if w >= h:
            for xs in range(x0, x0 + w, 22): chunks.append((xs, y0, min(xs + 22, x0 + w) - 1, y0 + h - 1))
        else:
            for ys in range(y0, y0 + h, 12): chunks.append((x0, ys, x0 + w - 1, min(ys + 12, y0 + h) - 1))
    rows = []
    for (x0, y0, x1, y1) in chunks:
        x0, y0 = max(0, x0 - 1), max(0, y0 - 1); x1, y1 = min(a.W - 1, x1 + 1), min(a.H - 1, y1 + 1)
        ia = L.render(a, region=(x0, y0, x1, y1), scale=1.0).convert("RGB"); ib = L.render(b, region=(x0, y0, x1, y1), scale=1.0).convert("RGB")
        rows.append(((x0, y0, x1, y1), ia, ib))
    per = 3      # kawałków na plik, żeby obrazy nie były gigantyczne
    for part in range(0, len(rows), per):
        grp = rows[part:part + per]
        W_ = max(r[1].width for r in grp); H_ = sum(r[1].height * 2 + 54 for r in grp)
        im = Image.new("RGB", (W_ + 8, H_), (18, 18, 18)); d = ImageDraw.Draw(im); y = 4
        for (reg, ia, ib) in grp:
            d.text((6, y), "mapa %d, kratki x %d-%d y %d-%d: PRZED" % (mid, reg[0], reg[2], reg[1], reg[3]), fill=(255, 220, 80)); y += 14
            im.paste(ia, (4, y)); y += ia.height + 6
            d.text((6, y), "PO", fill=(120, 255, 120)); y += 14
            im.paste(ib, (4, y)); y += ib.height + 14
        fn = os.path.join(OUT, "krawedzie_gracza_%03d_%d.png" % (mid, part // per + 1))
        im.save(fn); print(fn, im.size)
