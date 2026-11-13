# -*- coding: utf-8 -*-
"""Krok porządków planszy: łaty bez prostych boków (gracz 2026-11-08 na obrazie całej wyspy: „ma być ładnie, równo i różnorodnie”).
Łaty miękkiego gruntu - ciemniejsza trawa (A2 27 na warstwie 0) i nakładki trawy (A2 20 kępki, 21 wysoka trawa, 46 ciemna trawa na
warstwie 1) - dostają brzeg zaokrąglony i lekko falisty: maska rodzaju rozmyta (Gauss) z szumem, próg 0,5 - prostokąt staje się plamą,
długi prosty bok - łagodną falą. Zmienia tylko:
  - kratki nowego lądu (staging/nowe_<id>.json) na każdej mapie planszy,
  - całe mapy, które nie są mapami gracza (20 Dom dziadka, 125 Przystań, 162 Garnizon - ich łaty z dawnego powiększania map),
nigdy pod zabudową / drogą / innym rodzajem warstwy 1 (płoty, mury, kwiaty zostają), nigdy przy morzu (pas brzegu).
  python tools/plansza/gladz.py   (po latarnia.py, przed drogi.py)"""
import json, math, os
import numpy as np
import cv2
from plansza import N, BOARD, STG, W
OUT = os.path.join(STG, "data")
CALE = {20, 125, 162}                    # (not the player's maps: the whole map)
L0, L1 = {27}, {20, 21, 46}
SIGMA, AMP, SC = 1.5, 0.22, 4.5
lad = {int(k): {tuple(c) for c in v} for k, v in json.load(open(os.path.join(STG, "lad.json"))).items()}


def h2(x, y, s):
    v = math.sin(x * 12.9898 + y * 78.233 + s * 37.719) * 43758.5453
    return v - math.floor(v)


def noise_grid(s):
    out = np.zeros((N, N), np.float32)
    for y in range(N):
        for x in range(N):
            fx, fy = x / SC, y / SC; ix, iy = math.floor(fx), math.floor(fy); ax, ay = fx - ix, fy - iy
            ax, ay = ax * ax * (3 - 2 * ax), ay * ay * (3 - 2 * ay)
            a, b, c, d = h2(ix, iy, s), h2(ix + 1, iy, s), h2(ix, iy + 1, s), h2(ix + 1, iy + 1, s)
            out[y, x] = (a * (1 - ax) + b * ax) * (1 - ay) + (c * (1 - ax) + d * ax) * ay
    return out


log = []
for mid in BOARD:
    p = os.path.join(OUT, "Map%03d.json" % mid)
    m = json.load(open(p, encoding="utf-8")); t, n = m["data"], N * N
    fresh = {tuple(c) for c in json.load(open(os.path.join(STG, "nowe_%d.json" % mid)))["fresh"]}
    land = lad[mid]
    water = np.ones((N, N), np.uint8)
    for (x, y) in land: water[y, x] = 0
    wdist = cv2.distanceTransform((1 - water).astype(np.uint8), cv2.DIST_L2, 3)
    ev = {(e["x"], e["y"]) for e in m["events"] if e and e["pages"][0]["image"]["characterName"] and not e["pages"][0]["image"]["characterName"].startswith("!$")}
    region = np.zeros((N, N), bool)
    for y in range(N):
        for x in range(N):
            if (mid in CALE or (x, y) in fresh) and (x, y) in land and wdist[y, x] >= 4: region[y, x] = True
    nz = noise_grid(mid * 7 + 3) - 0.5
    kind = lambda v: (v - 2048) // 48 if 2816 <= v < 4352 else -1
    a = np.array(t, dtype=np.int64).reshape(6, N, N)
    changed = {0: set(), 1: set()}
    for z, kinds in ((0, L0), (1, L1)):
        for k in kinds:
            cur = np.vectorize(lambda v: kind(int(v)) == k)(a[z]).astype(np.float32)
            if not cur[region].any(): continue
            soft = cv2.GaussianBlur(cur, (0, 0), SIGMA) + AMP * nz * 2
            want = soft > 0.5
            for y, x in zip(*np.where(region & (want != (cur > 0)))):
                i = y * N + x
                if a[2, y, x] or a[3, y, x] or (x, y) in ev: continue
                k0 = kind(int(a[0, y, x]))
                if z == 0:
                    if want[y, x] and k0 == 16: a[0, y, x] = 2048 + k * 48; changed[0].add((x, y))
                    elif not want[y, x] and k0 == k: a[0, y, x] = 2048 + 16 * 48; changed[0].add((x, y))
                else:
                    if want[y, x] and not a[1, y, x] and k0 in (16, 27): a[1, y, x] = 2048 + k * 48; changed[1].add((x, y))
                    elif not want[y, x] and kind(int(a[1, y, x])) == k: a[1, y, x] = 0; changed[1].add((x, y))
    m["data"] = [int(v) for v in a.reshape(-1)]
    for z in (0, 1):
        if changed[z]: W.reshape(m, z, W.ring(changed[z], 1))
    open(p, "wb").write(W.map_text(m).encode("utf-8"))
    log.append("Map%03d: łaty trawy wygładzone: %d kratek gruntu, %d kratek nakładek%s" % (mid, len(changed[0]), len(changed[1]), " (cała mapa)" if mid in CALE else ""))
print("\n".join(log))
