# -*- coding: utf-8 -*-
"""Naczynia z Winlu (Fantasy_Inside_Shops) bez stolu: od brzegu wycinka zalewa sie tlo (cieple drewno, obrus, ich cien),
zatrzymujac sie na chlodnym, szarym obrysie talerza / miski / kufla. Zapis: tools/talerze/naczynia/<nazwa>.png + podglad."""
import os, numpy as np
from PIL import Image, ImageDraw
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
im = np.array(Image.open(os.path.join(ROOT, "img/tilesets/Winlu Fantasy Tileset - Interior/Remaster/tilesets/Fantasy_Inside_Shops.png")).convert("RGBA")).astype(int)
OUT = os.path.join(HERE, "naczynia"); os.makedirs(OUT, exist_ok=True)
# name: box (x0, y0, x1, y1) in the sheet, seed points of the dish (inside it) to keep only its component
BOX = {
    "pieczen": ((100, 562, 136, 598), [(118, 580)]),
    "miska": ((298, 572, 330, 604), [(314, 588)]),
    "miska_pusta": ((198, 556, 230, 590), [(213, 572)]),
    "chleb": ((198, 466, 230, 494), [(213, 480)]),
    "kufel": ((352, 466, 380, 508), [(366, 492)]),
}
def warm(p): r, g, b = int(p[0]), int(p[1]), int(p[2]); return r - b > 14 and p[3] > 0
res = {}
for name, ((x0, y0, x1, y1), seeds) in BOX.items():
    t = im[y0:y1, x0:x1].copy(); H, W = t.shape[:2]
    bg = np.zeros((H, W), bool); st = []
    for x in range(W):
        for y in (0, H - 1): st.append((y, x))
    for y in range(H):
        for x in (0, W - 1): st.append((y, x))
    while st:
        y, x = st.pop()
        if bg[y, x] or not (warm(t[y, x]) or t[y, x][3] == 0): continue
        bg[y, x] = True
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            yy, xx = y + dy, x + dx
            if 0 <= yy < H and 0 <= xx < W and not bg[yy, xx]: st.append((yy, xx))
    keep = ~bg
    # only the component that holds the seed (cups and neighbours dropped)
    comp = np.zeros((H, W), bool); st = [(sy - y0, sx - x0) for sx, sy in seeds]
    while st:
        y, x = st.pop()
        if not (0 <= y < H and 0 <= x < W) or comp[y, x] or not keep[y, x]: continue
        comp[y, x] = True
        st += [(y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)]
    t[~comp] = 0
    ys, xs = np.where(comp)
    t = t[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    Image.fromarray(t.astype(np.uint8)).save(os.path.join(OUT, name + ".png")); res[name] = t
    print(name, t.shape[1], "x", t.shape[0])
pv = Image.new("RGB", (sum(v.shape[1] * 6 + 12 for v in res.values()) + 12, max(v.shape[0] for v in res.values()) * 6 + 30), (92, 64, 44))
d = ImageDraw.Draw(pv); x = 12
for k, v in res.items():
    a = Image.fromarray(v.astype(np.uint8)).resize((v.shape[1] * 6, v.shape[0] * 6), Image.NEAREST)
    pv.paste(a, (x, 24), a); d.text((x, 4), k, fill=(255, 255, 0)); x += v.shape[1] * 6 + 12
pv.save(os.path.join(HERE, "podglad_naczynia.png"))
