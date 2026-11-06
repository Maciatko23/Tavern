# -*- coding: utf-8 -*-
"""Arkusze przed/po z renderu map (nie z gry): docs/krawedzie_poprawa/przed_po/MapNNN.png (przed nad po) i gracz/MapNNN.png dla map gracza.
  python tools/krawedzie_poprawa/galeria.py [numery map]"""
import os, sys, json
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import lib; L = lib.L
from PIL import Image, ImageDraw
ids = [int(a) for a in sys.argv[1:] if a.isdigit()]
out0 = os.path.join(lib.ROOT, "docs", "krawedzie_poprawa")
for sub in ("przed_po", "gracz"): os.makedirs(os.path.join(out0, sub), exist_ok=True)
for mid in lib.mapy_swiata() + [101]:
    if ids and mid not in ids: continue
    p = os.path.join(lib.STG, "data", "Map%03d.json" % mid)
    if not os.path.exists(p): continue
    a, b = L.Mapa(mid), L.Mapa(mid, path=p)
    sc = min(0.5, 1800.0 / (a.W * 48))
    ims = [L.render(m) for m in (a, b)]
    ims = [i.resize((int(i.width * sc), int(i.height * sc)), Image.LANCZOS) for i in ims]
    sheet = Image.new("RGBA", (ims[0].width, ims[0].height * 2 + 44), (20, 20, 20, 255)); d = ImageDraw.Draw(sheet)
    d.text((6, 4), "Map%03d %s - PRZED" % (mid, a.nazwa), fill=(255, 255, 0, 255)); sheet.alpha_composite(ims[0], (0, 18))
    d.text((6, ims[0].height + 24), "PO", fill=(255, 255, 0, 255)); sheet.alpha_composite(ims[1], (0, ims[0].height + 40))
    sheet.convert("RGB").save(os.path.join(out0, "gracz" if mid in lib.GRACZ else "przed_po", "Map%03d.png" % mid))
    print("Map%03d" % mid, sheet.size)
