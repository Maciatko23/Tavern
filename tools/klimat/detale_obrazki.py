# -*- coding: utf-8 -*-
"""Gotowe obrazki do Klimat_Detale.js (gracz 2026-11-09: „wszystko co się da i doda klimatu” - część C: szyldy, woda, para, pyłki):
  img/system/Klimat_Detal_Woda.png  - wiersz 0: 4 klatki błysku na wodzie (16 x 8), wiersz 1: 6 klatek kręgu od kropli deszczu (16 x 8)
  img/system/Klimat_Detal_Para.png  - 8 klatek smużki pary znad mokrego dachu w słońcu (32 x 64): rośnie, unosi się i rozwiewa
  img/system/Klimat_Detal_Pylek.png - 3 drobinki kurzu / pyłku w smudze słońca (6 x 6: 1, 2 i 3 px z miękką obwódką)
Piksele ostre, kolory jasne i chłodne (woda) / ciepłe (pyłki), jak dym Winlu nad kominami.   python tools/klimat/detale_obrazki.py"""
import os
import numpy as np
import cv2
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
OUT = os.path.join(ROOT, "img", "system")
rng = np.random.default_rng(7)

# ---- water: glints and rain rings
W = np.zeros((16, 16 * 6, 4), np.uint8)
for i, (ln, a) in enumerate(((3, 150), (5, 200), (7, 230), (4, 120))):        # a short bright line, a softer end on each side
    cx = i * 16 + 8
    for dx in range(-(ln // 2), ln // 2 + 1):
        edge = abs(dx) == ln // 2
        W[3, cx + dx] = (232, 244, 250, int(a * (0.55 if edge else 1)))
    if i == 2: W[2, cx] = (255, 255, 255, 140); W[4, cx] = (255, 255, 255, 90)
for k in range(6):                                                              # a ring: 2 px .. 7 px half width, flattened (seen from above)
    rx, ry = 1.5 + k * 1.15, 0.7 + k * 0.5
    al = int(230 * (1 - k / 6.5))
    cx, cy = k * 16 + 8, 8 + 4
    for t in np.linspace(0, 2 * np.pi, 80):
        x, y = int(round(cx + rx * np.cos(t))), int(round(cy + ry * np.sin(t)))
        if 0 <= y < 16: W[y, x] = (214, 232, 244, al)
    if k == 0: W[cy, cx] = (240, 250, 255, 240)
Image.fromarray(W, "RGBA").save(os.path.join(OUT, "Klimat_Detal_Woda.png"))

# ---- steam: 8 frames of a thin wisp leaving the roof: small and faint at the roof, rising, curling, widening and thinning out
FR, FW, FH = 8, 32, 64
P = np.zeros((FH, FW * FR, 4), np.float32)
yy, xx = np.mgrid[0:FH, 0:FW].astype(np.float32)
for k in range(FR):
    t = k / (FR - 1)
    a = np.zeros((FH, FW), np.float32)
    base = FH - 4 - t * 26                                                        # the wisp's foot rises off the roof
    for j in range(5):                                                            # puffs up the wisp
        h = j / 4.0
        cy = base - h * (14 + 10 * t)
        cx = FW / 2 + 3.2 * np.sin(h * 3.1 + t * 2.4) * (0.4 + h)
        r = 1.6 + h * 2.2 + t * 2.6
        a += (1 - 0.55 * h) * np.exp(-(((xx - cx) / r) ** 2 + ((yy - cy) / (r * 1.4)) ** 2))
    fade = min(1, (k + 1) / 2.5) * (1 - max(0, t - 0.45) / 0.62)
    a = np.clip(a * 0.5 * fade, 0, 0.55)
    a = np.round(a * 10) / 10                                                     # a few steps of alpha: soft but pixel-like
    fr = np.zeros((FH, FW, 4), np.float32); fr[..., 0], fr[..., 1], fr[..., 2] = 238, 240, 242; fr[..., 3] = a * 255
    P[:, k * FW:(k + 1) * FW] = fr
Image.fromarray(P.astype(np.uint8), "RGBA").save(os.path.join(OUT, "Klimat_Detal_Para.png"))

# ---- motes: 1, 2 and 3 px specks, a white-gold core and a faint golden rim (drawn normally: seen on the bright morning cobbles too)
M = np.zeros((6, 18, 4), np.uint8)
for i, s in enumerate((1, 2, 3)):
    c = np.zeros((6, 6), np.float32); o = (6 - s) // 2
    c[o:o + s, o:o + s] = 1
    rim = np.clip(cv2.dilate(c, np.ones((3, 3), np.uint8)) - c, 0, 1) * (0.35 if s > 1 else 0.25)
    for ch, (cv, rv) in enumerate(((255, 255), (253, 214), (240, 140))):
        M[:, i * 6:(i + 1) * 6, ch] = np.where(c > 0, cv, rv).astype(np.uint8)
    M[:, i * 6:(i + 1) * 6, 3] = (np.clip(c * 0.95 + rim, 0, 1) * 255).astype(np.uint8)
Image.fromarray(M, "RGBA").save(os.path.join(OUT, "Klimat_Detal_Pylek.png"))
print("zapisane: Klimat_Detal_Woda (96x16), Klimat_Detal_Para (%dx%d), Klimat_Detal_Pylek (18x6)" % (FW * FR, FH))
