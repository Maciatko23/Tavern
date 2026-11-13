# -*- coding: utf-8 -*-
"""Talerze z tilesetu Winlu (Fantasy_Inside_Shops): okragle stoly z jedzeniem minus pusty stol (11,7 + 12,7) = same naczynia,
w skosie top-down Winlu. Zapisuje kawalki (spojne skladowe roznicy) do tools/talerze/kawalki/ i podglad."""
import os
import numpy as np
from PIL import Image, ImageDraw
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
SRC = os.path.join(ROOT, "img", "tilesets", "Winlu Fantasy Tileset - Interior", "Remaster", "tilesets", "Fantasy_Inside_Shops.png")
im = np.array(Image.open(SRC).convert("RGBA")).astype(int)
T = 48
def table(c): return im[11 * T:13 * T, c * T:(c + 1) * T]
bare = table(7)
OUT = os.path.join(HERE, "kawalki"); os.makedirs(OUT, exist_ok=True)
pieces = []
for c in (2, 3, 5, 6):
    t = table(c)
    diff = (np.abs(t[:, :, :3] - bare[:, :, :3]).sum(2) > 24) | (np.abs(t[:, :, 3] - bare[:, :, 3]) > 10)
    # connected components (4-way) on the diff mask
    H, W = diff.shape; lab = np.zeros((H, W), int); n = 0
    for y in range(H):
        for x in range(W):
            if diff[y, x] and not lab[y, x]:
                n += 1; st = [(y, x)]; lab[y, x] = n
                while st:
                    a, b = st.pop()
                    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (-1, -1), (1, -1), (-1, 1)):
                        yy, xx = a + dy, b + dx
                        if 0 <= yy < H and 0 <= xx < W and diff[yy, xx] and not lab[yy, xx]: lab[yy, xx] = n; st.append((yy, xx))
    for k in range(1, n + 1):
        ys, xs = np.where(lab == k)
        if len(ys) < 40: continue
        y0, y1, x0, x1 = ys.min(), ys.max(), xs.min(), xs.max()
        piece = np.zeros((y1 - y0 + 1, x1 - x0 + 1, 4), np.uint8)
        m = lab[y0:y1 + 1, x0:x1 + 1] == k
        piece[m] = t[y0:y1 + 1, x0:x1 + 1][m]
        name = "s%d_%d_%dx%d" % (c, k, x1 - x0 + 1, y1 - y0 + 1)
        Image.fromarray(piece).save(os.path.join(OUT, name + ".png")); pieces.append((name, piece))
# preview on a wood colour, 4x
Wd = sum(p.shape[1] + 6 for _, p in pieces) + 6; Hd = max(p.shape[0] for _, p in pieces) + 20
pv = Image.new("RGBA", (Wd, Hd), (92, 64, 44, 255)); d = ImageDraw.Draw(pv); x = 6
for name, p in pieces:
    pv.alpha_composite(Image.fromarray(p), (x, 16)); d.text((x, 2), name.split("_")[0] + name.split("_")[1], fill=(255, 255, 0)); x += p.shape[1] + 6
pv = pv.resize((pv.width * 4, pv.height * 4), Image.NEAREST)
pv.save(os.path.join(HERE, "podglad_kawalki.png")); print(len(pieces), "kawalkow", [n for n, _ in pieces])
