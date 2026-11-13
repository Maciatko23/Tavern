# -*- coding: utf-8 -*-
"""Krok 1b (przed teren.py): przejście starej mapy w nowy ląd (gracz 2026-11-08: „trzeba to ładnie podostosowywać, żeby wszystko pasowało
i nie było poszarpanych kawałków na mapie”). Nowy ląd był jednolitą trawą, a stara mapa ma swoje plamy ziemi, ciemniejszej trawy i
kępek - jej prostokąt było widać. Tu grunt starej części przechodzi w nowy ląd: kratka nowego lądu w odległości d od starej części
dostaje grunt kratki ODBITEJ po drugiej stronie granicy (stara kratka o tyle samo w głąb), z prawdopodobieństwem malejącym z d i
poszarpanym szumem (brzeg przejścia jest nieregularny, nigdy prosta linia ani schodki). Tylko grunt: rodzaje A2 trawy / ziemi /
kępek na warstwach 0-1 - nie drogi, nie mury, nie zabudowa, nie woda; nic przy morzu (pas brzegu).
  python tools/plansza/zlew.py"""
import json, math, os
import numpy as np
import cv2
from plansza import N, BOARD, STG, W
OUT = os.path.join(STG, "data")
D = 12                    # cells into the new land the old ground reaches at most
GROUND = set(range(16, 46)) - {20, 33, 40, 41, 42, 43}   # (A2 ground and overlays; not the dense leaves, cobbles, streets, roads)
lad = {int(k): {tuple(c) for c in v} for k, v in json.load(open(os.path.join(STG, "lad.json"))).items()}


def h2(x, y, s):
    v = math.sin(x * 12.9898 + y * 78.233 + s * 37.719) * 43758.5453
    return v - math.floor(v)


def noise(x, y, s, sc=5.0):   # smooth value noise 0..1
    fx, fy = x / sc, y / sc; ix, iy = math.floor(fx), math.floor(fy); ax, ay = fx - ix, fy - iy
    ax, ay = ax * ax * (3 - 2 * ax), ay * ay * (3 - 2 * ay)
    a, b, c, d = h2(ix, iy, s), h2(ix + 1, iy, s), h2(ix, iy + 1, s), h2(ix + 1, iy + 1, s)
    return (a * (1 - ax) + b * ax) * (1 - ay) + (c * (1 - ax) + d * ax) * ay


for mid in BOARD:
    m = json.load(open(os.path.join(OUT, "Map%03d.json" % mid), encoding="utf-8"))
    t, n = m["data"], N * N
    fresh = {tuple(c) for c in json.load(open(os.path.join(STG, "nowe_%d.json" % mid)))["fresh"]}
    land = lad[mid]
    oldmask = np.ones((N, N), np.uint8)       # 0 = an old cell (the source), 1 = elsewhere
    for y in range(N):
        for x in range(N):
            if (x, y) not in fresh and (x, y) in land: oldmask[y, x] = 0
    if oldmask.min() == 1: continue
    dist, lab = cv2.distanceTransformWithLabels(oldmask, cv2.DIST_L2, 5, labelType=cv2.DIST_LABEL_PIXEL)
    # label -> the old cell's coordinates
    ys, xs = np.where(oldmask == 0)
    coord = {}
    for yy, xx in zip(ys, xs): coord[int(lab[yy, xx])] = (int(xx), int(yy))
    water = np.ones((N, N), np.uint8)
    for (x, y) in land: water[y, x] = 0
    wdist = cv2.distanceTransform((1 - water).astype(np.uint8), cv2.DIST_L2, 3)
    done = []
    for (x, y) in fresh & land:
        d = float(dist[y, x])
        if d > D or wdist[y, x] < 5: continue
        ox, oy = coord[int(lab[y, x])]
        sx, sy = 2 * ox - x, 2 * oy - y          # (the mirror: as deep into the old part as this cell is out of it)
        if not (0 <= sx < N and 0 <= sy < N) or oldmask[sy, sx] == 1: sx, sy = ox, oy
        p = 1.0 - d / D + (noise(x, y, mid) - 0.5) * 0.9
        if p < 0.5: continue
        k0 = W.kind_of(t[sy * N + sx]); k1 = W.kind_of(t[n + sy * N + sx])
        if k0 in GROUND: t[y * N + x] = 2048 + k0 * 48
        if k1 in GROUND and not t[2 * n + sy * N + sx] and not t[3 * n + sy * N + sx]: t[n + y * N + x] = 2048 + k1 * 48
        done.append((x, y))
    if done:
        near = W.ring(done, 1)
        W.reshape(m, 0, near); W.reshape(m, 1, near)
    open(os.path.join(OUT, "Map%03d.json" % mid), "wb").write(W.map_text(m).encode("utf-8"))
    print("Map%03d: przejście starego gruntu w nowy ląd: %d kratek" % (mid, len(done)))
