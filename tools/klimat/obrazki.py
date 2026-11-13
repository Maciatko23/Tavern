# -*- coding: utf-8 -*-
"""Gotowe obrazki do Klimat_Miasta.js (gracz 2026-11-09: dym z kominów, okna zapalające się wieczorem, kruki):
  img/system/Klimat_Dym.png      - 8 klatek samego dymu (48 x 104) z !Fantasy_chimney (Winlu, styl 0: ten sam dym co nad chatą
                                   dziadka), bez komina; podstawa dymu w wierszu 100 (tam ma być wylot komina)
  img/system/Klimat_Okna.png     - blask szyb (64 x 64 na okno, 8 px marginesu na poświatę): ciepłe piksele zapalonego okna z
                                   arkusza B / E zestawu 11, kolejność jak LIT w Klimat_Miasta.js
  img/system/Klimat_Poswiata.png - miękka poświata wokół okna (160 x 160), Klimat_Plama.png - plama światła na ziemi (192 x 96)
  python tools/klimat/obrazki.py"""
import json, os
import numpy as np
import cv2
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
OUT = os.path.join(ROOT, "img", "system")
LIT = [2, 10, 33, 37, 41, 45, 48, 53, 55, 61, 63, 69, 75, 768 + 87, 4, 6, 12, 14]     # (the lit window tiles; E87 = 855)
# ---- smoke
sheet = np.asarray(Image.open(os.path.join(ROOT, "img", "characters", "!Fantasy_chimney.png")).convert("RGBA")).copy()
cells = [(0, r) for r in range(4)] + [(1, r) for r in (3, 2, 1, 0)]          # the sheet's "setup order" 1..8 (style 0)
frames = []
for c, r in cells:
    f = sheet[r * 144:(r + 1) * 144, c * 48:(c + 1) * 48].copy()
    f[f[..., 3] >= 250] = 0                                                   # the chimney itself (opaque) out
    f[104:] = 0
    frames.append(f[:104])
smoke = np.concatenate(frames, axis=1)
Image.fromarray(smoke, "RGBA").save(os.path.join(OUT, "Klimat_Dym.png"))
# ---- window glass glows
ts = json.load(open(os.path.join(ROOT, "data", "Tilesets.json"), encoding="utf-8"))[11]["tilesetNames"]
sheets = {k: np.asarray(Image.open(os.path.join(ROOT, "img", "tilesets", ts[5 + j] + ".png")).convert("RGBA")).astype(np.float32) for j, k in enumerate("BCDE")}
def tile(v):
    sh = sheets["BCDE"[v // 256]]; t = v % 256; col = (t % 8) + (8 if t >= 128 else 0); row = (t % 128) // 8
    return sh[row * 48:row * 48 + 48, col * 48:col * 48 + 48]
atlas = np.zeros((64, 64 * len(LIT), 4), np.float32)
for i, v in enumerate(LIT):
    a = tile(v)
    mask = ((a[..., 3] > 200) & (a[..., 0] > 200) & (a[..., 1] > 150) & (a[..., 2] > 90)).astype(np.float32)
    big = np.zeros((64, 64), np.float32); big[8:56, 8:56] = mask
    soft = cv2.GaussianBlur(big, (0, 0), 2.2)
    al = np.clip(big * 0.95 + soft * 0.75, 0, 1)
    cell = np.zeros((64, 64, 4), np.float32)
    cell[..., 0], cell[..., 1], cell[..., 2] = 255, 196, 122
    cell[8:56, 8:56, :3] = np.where(mask[..., None] > 0, a[..., :3] * 0.6 + np.array([255, 205, 140]) * 0.4, cell[8:56, 8:56, :3])
    cell[..., 3] = al * 255
    atlas[:, i * 64:(i + 1) * 64] = cell
    print("okno", v, "szyb px", int(mask.sum()))
Image.fromarray(atlas.clip(0, 255).astype(np.uint8), "RGBA").save(os.path.join(OUT, "Klimat_Okna.png"))
# ---- halo and pool (soft, warm; drawn ADD)
def radial(w, h, colour, peak, sigma):
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    d = np.sqrt(((xx - w / 2 + 0.5) / (w / 2)) ** 2 + ((yy - h / 2 + 0.5) / (h / 2)) ** 2)
    al = np.clip(peak * np.exp(-(d / sigma) ** 2) * (1 - np.clip(d, 0, 1) ** 4), 0, 1)
    im = np.zeros((h, w, 4), np.float32); im[..., 0], im[..., 1], im[..., 2] = colour; im[..., 3] = al * 255
    return Image.fromarray(im.astype(np.uint8), "RGBA")
radial(160, 160, (255, 172, 92), 0.75, 0.42).save(os.path.join(OUT, "Klimat_Poswiata.png"))
radial(192, 96, (255, 178, 100), 0.7, 0.5).save(os.path.join(OUT, "Klimat_Plama.png"))
print("zapisane: Klimat_Dym (%dx%d), Klimat_Okna (%d okien), Klimat_Poswiata, Klimat_Plama" % (smoke.shape[1], smoke.shape[0], len(LIT)))
