# -*- coding: utf-8 -*-
"""Krok 3 planszy: drogi przez granice map (po teren.py). Każda droga: od końca drogi / bramy jednej mapy do drogi drugiej, A* po lądzie
planszy (koszt: zwykła ziemia 1, istniejąca droga mniej, blisko zabudowy więcej; nie przez wodę, mury, zabudowę, wzgórza ani ważne
zdarzenia), wygładzona (łagodne łuki, nie schodki), 2-3 kratki szerokości, grunt ubitej ziemi w trawie (A2 17 - ścieżka autora, ten sam na wszystkich mapach
planszy). Drzewa i krzaki na drodze usunięte. Granicę mapy droga przecina w jednym miejscu, po obu stronach ta sama kratka.
  DROGI: (opis, start, koniec) w kratkach PLANSZY (x, y od lewego górnego rogu 360 x 360)
  python tools/plansza/drogi.py"""
import heapq, json, math, os, re
import numpy as np
from plansza import N, BOARD, STG, W
OUT = os.path.join(STG, "data")
S = 3 * N
PATH_KIND = 17   # (A2 17: earth with a grassy edge - the author's own paths; 27 is the darker grass)
NATURE = re.compile(r"^!\$(Pine|Tree|Big_Trees|Bush|Rock|Boulder|Trunk|Stump|Log|Sapling|Fern|Flower|Grass|Mushroom|Reed|Pebble)", re.I)
DROGI = [
    ("brama północna miasta -> droga dworu", (146, 119), (147, 87)),
    ("brama wschodnia miasta -> Łąka pod Gawrą", (224, 137), (243, 131)),
    ("droga za murem miasta (południe) -> Kruczy Jar", (154, 236), (150, 246)),
    ("Garnizon -> droga nad fosą Podgrodzia", (109, 99), (109, 160)),
    ("Podgrodzie (południe) -> Przystań", (18, 227), (22, 248)),
    ("Przystań -> Kruczy Jar", (22, 252), (128, 262)),
    ("Kruczy Jar (wschód) -> Dom dziadka", (199, 254), (249, 243)),
    ("Łąka pod Gawrą -> Dom dziadka", (262, 182), (252, 242)),
    ("Góry (południe) -> Łąka pod Gawrą", (273, 118), (258, 134)),
    ("Posiadłość Lorda -> Góry", (175, 79), (240, 112)),
    ("Garnizon -> Posiadłość Lorda", (118, 51), (140, 74)),
    ("ulica rybaków -> latarnia na cyplu", (89, 273), (79, 340)),
]
maps = {m: json.load(open(os.path.join(OUT, "Map%03d.json" % m), encoding="utf-8")) for m in BOARD}
lad = {int(k): {tuple(c) for c in v} for k, v in json.load(open(os.path.join(STG, "lad.json"))).items()}
# the board's grids
cost = np.full((S, S), np.inf, np.float32)
road = np.zeros((S, S), np.uint8)
ev_at = {}
for mid, (c, r, dx, dy) in BOARD.items():
    m = maps[mid]; t = m["data"]; n = N * N; ox, oy = c * N, r * N
    for (x, y) in lad[mid]:
        i = y * N + x
        v0, v1, v2, v3 = t[i], t[n + i], t[2 * n + i], t[3 * n + i]
        if v2 or v3 or v0 >= 4352 or v1 >= 4352 or (1536 + 64 <= v0 < 2048) or 2048 <= v0 < 2816: continue
        cost[oy + y, ox + x] = 1.0
        k0 = (v0 - 2048) // 48 if v0 >= 2048 else -1
        if k0 in (17, 24, 40, 41, 42, 43): road[oy + y, ox + x] = 1; cost[oy + y, ox + x] = 0.45
    for e in m["events"]:
        if not e: continue
        X, Y = ox + e["x"], oy + e["y"]
        pic = e["pages"][0]["image"]["characterName"] or ""
        if NATURE.match(pic): ev_at.setdefault((X, Y), []).append((mid, e["id"])); cost[Y, X] = min(cost[Y, X], 2.5) if np.isfinite(cost[Y, X]) else cost[Y, X]
        else: cost[Y, X] = np.inf   # (people, doors, places: never under a road)
# near the built: dearer (the road keeps a cell off walls and fences)
blocked = (~np.isfinite(cost)).astype(np.uint8)
import cv2
near = cv2.dilate(blocked, np.ones((3, 3), np.uint8))
cost[(near == 1) & np.isfinite(cost)] += 2.0


def astar(a, b):
    sx, sy = a; gx, gy = b
    if not np.isfinite(cost[sy, sx]) or not np.isfinite(cost[gy, gx]): return None
    g = {a: 0.0}; prev = {}; pq = [(0, a)]
    while pq:
        f, p = heapq.heappop(pq)
        if p == b: break
        x, y = p
        for ddx, ddy in ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (1, -1), (-1, 1), (-1, -1)):
            q = (x + ddx, y + ddy)
            if not (0 <= q[0] < S and 0 <= q[1] < S) or not np.isfinite(cost[q[1], q[0]]): continue
            if ddx and ddy and (not np.isfinite(cost[y, x + ddx]) or not np.isfinite(cost[y + ddy, x])): continue
            ng = g[p] + cost[q[1], q[0]] * (1.414 if ddx and ddy else 1.0)
            if ng < g.get(q, 1e18):
                g[q] = ng; prev[q] = p
                heapq.heappush(pq, (ng + 0.45 * math.hypot(q[0] - gx, q[1] - gy), q))
    if b not in prev and a != b: return None
    path = [b]
    while path[-1] != a: path.append(prev[path[-1]])
    return path[::-1]


def smooth(pts, rounds=3):   # Chaikin: the A* steps become arcs
    pts = [tuple(map(float, p)) for p in pts]
    for _ in range(rounds):
        out = [pts[0]]
        for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
            out += [(0.75 * x0 + 0.25 * x1, 0.75 * y0 + 0.25 * y1), (0.25 * x0 + 0.75 * x1, 0.25 * y0 + 0.75 * y1)]
        out.append(pts[-1]); pts = out
    return pts


log = []
paint = {}   # board cell -> True
for opis, a, b in DROGI:
    p = astar(a, b)
    if not p: log.append("BRAK drogi: %s %s -> %s" % (opis, a, b)); continue
    sm = smooth(p[::2] + [p[-1]])
    cells = set()
    for k, (x, y) in enumerate(sm):
        rr = 1.0 + 0.45 * (0.5 + 0.5 * math.sin(k * 0.21 + a[0]))   # (2-3 cells wide, the width breathing along the road)
        for yy in range(int(y - rr - 1), int(y + rr + 2)):
            for xx in range(int(x - rr - 1), int(x + rr + 2)):
                if 0 <= xx < S and 0 <= yy < S and (xx + 0.5 - x - 0.5) ** 2 + (yy + 0.5 - y - 0.5) ** 2 <= rr * rr and np.isfinite(cost[yy, xx]): cells.add((xx, yy))
    for c in cells: paint[c] = True
    log.append("%s: %d kratek drogi (A* %d kroków)" % (opis, len(cells), len(p)))
# into the maps
gone = 0
per = {}
for (X, Y) in paint:
    c, r = X // N, Y // N
    mid = next(m for m, v in BOARD.items() if v[0] == c and v[1] == r)
    per.setdefault(mid, []).append((X - c * N, Y - r * N))
for mid, cells in per.items():
    m = maps[mid]; t = m["data"]; n = N * N; c, r = BOARD[mid][0], BOARD[mid][1]
    for (x, y) in cells:
        i = y * N + x
        k0 = (t[i] - 2048) // 48 if t[i] >= 2048 else -1
        if k0 not in (40, 41, 42, 43, 24, 17): t[i] = 2048 + PATH_KIND * 48      # (the town's cobbles and the old earth roads stay as they are)
        t[n + i] = 0
    cs = set(cells)
    ids = {eid for (x, y) in cells for (mm, eid) in ev_at.get((c * N + x, r * N + y), []) if mm == mid}
    for k, e in enumerate(m["events"]):
        if e and e["id"] in ids: m["events"][k] = None; gone += 1
    W.reshape(m, 0, W.ring(cells, 1)); W.reshape(m, 1, W.ring(cells, 1))
    open(os.path.join(OUT, "Map%03d.json" % mid), "wb").write(W.map_text(m).encode("utf-8"))
print("\n".join(log)); print("drzew / krzaków zdjętych z dróg: %d" % gone)
