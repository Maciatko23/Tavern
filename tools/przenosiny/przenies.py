# -*- coding: utf-8 -*-
"""Działka dziadka i dom dziadka na środek swoich map (gracz 2026-11-09, szkic docs/przenosiny_szkic.png, „1 są dobre”):
prostokąt z działką / domem zamieniony miejscami z prostokątem łąki ze środka (wszystkie warstwy, regiony i zdarzenia), brzegi łat
gruntu na styku zaokrąglone, drogi dorysowane (schody z miasta, droga z Przystani, nowe bramy działki; ścieżka od drzwi domu do
gościńca). Wejście: Kruczy Jar z tools/miasto5/staging/data (z dzisiejszymi poprawkami), dom dziadka z data/.
Wynik: tools/przenosiny/staging/data/MapNNN.json + przesuniecia.json (dla przepięć wtyczek i testów).   python tools/przenosiny/przenies.py"""
import copy, heapq, json, math, os, re, sys
import numpy as np
import cv2
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "rozszerzenia"))
import wspolne as WS
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
OUT = os.path.join(HERE, "staging", "data"); os.makedirs(OUT, exist_ok=True)
A2 = lambda k: 2048 + k * 48
kind = lambda v: (v - 2048) // 48 if v >= 2048 else None
PATH_L1 = 39                       # the author's dirt road overlay (layer 1) on tileset 9
JOBS = {
    3: {"src": os.path.join(ROOT, "tools", "miasto5", "staging", "data", "Map003.json"),
        "box": (1, 3, 37, 29), "to": (41, 34),
        # (from, to) - a point or "path" (the nearest existing road cell); the new plot's gates: top x68-71 row 34, west x42 rows 46-48
        "roads": [((31, 3), (38, 13)), ((0, 16), (8, 30)), ((52, 20), (69, 34)), ((9, 46), (42, 47)), ((49, 61), (10, 60))],
        # the plot's fence (the user: „ładnie otoczony płotkiem jako wyznacznik działki”): a full ring, gates only on the roads
        "fence": (42, 34, 77, 59), "gates": {"top": range(68, 72), "left": range(46, 49), "right": range(43, 47), "bottom": range(48, 52)}},
    20: {"src": os.path.join(ROOT, "data", "Map020.json"),
         "box": (7, 1, 24, 14), "to": (38, 40),
         "roads": [((46, 53), (46, 56)), ((6, 9), (15, 15))],
         # grandpa's homestead in the same fence as the plot: house, pens, garden, woodpile; the gate on the path to the road
         "fence": (36, 38, 56, 53), "gates": {"bottom": range(45, 48)}},
}
spec = {}
for mid, J in JOBS.items():
    m = json.load(open(J["src"], encoding="utf-8")); W, H = m["width"], m["height"]; n = W * H; D = m["data"]
    x0, y0, x1, y1 = J["box"]; tx, ty = J["to"]; dx, dy = tx - x0, ty - y0; bw, bh = x1 - x0 + 1, y1 - y0 + 1
    A = (x0, y0, x1, y1); B = (tx, ty, tx + bw - 1, ty + bh - 1)
    assert not (A[0] <= B[2] and B[0] <= A[2] and A[1] <= B[3] and B[1] <= A[3]), "boxes overlap"
    # ---- tiles: swap all six layers
    for z in range(6):
        for y in range(bh):
            for x in range(bw):
                i, j = z * n + (y0 + y) * W + x0 + x, z * n + (ty + y) * W + tx + x
                D[i], D[j] = D[j], D[i]
    # ---- events: base cell in A -> +d, in B -> -d
    inA = lambda e: A[0] <= e["x"] <= A[2] and A[1] <= e["y"] <= A[3]
    inB = lambda e: B[0] <= e["x"] <= B[2] and B[1] <= e["y"] <= B[3]
    mv = 0
    for e in m["events"]:
        if not e: continue
        if inA(e): e["x"] += dx; e["y"] += dy; mv += 1
        elif inB(e): e["x"] -= dx; e["y"] -= dy; mv += 1
    border = set()
    for (a0, b0, a1, b1) in (A, B):
        for x in range(a0 - 1, a1 + 2):
            for y in (b0 - 1, b0, b1, b1 + 1): border.add((x, y))
        for y in range(b0 - 1, b1 + 2):
            for x in (a0 - 1, a0, a1, a1 + 1): border.add((x, y))
    # ---- round the ground patches cut by the box edges (dark grass on layer 0, the overlays on layer 1): a band round both borders
    a = np.array(D, dtype=np.int64).reshape(6, H, W)
    ev_cells = {(e["x"], e["y"]) for e in m["events"] if e and e["pages"][0]["image"]["characterName"]}
    band = np.zeros((H, W), bool)
    for (bx, by) in border:
        band[max(0, by - 3):min(H, by + 4), max(0, bx - 3):min(W, bx + 4)] = True
    rng = np.random.default_rng(mid)
    noise = cv2.resize(rng.random((H // 4 + 2, W // 4 + 2)).astype(np.float32), (W, H), interpolation=cv2.INTER_CUBIC)
    free = (a[2] == 0) & (a[3] == 0)
    # a patch cut by a box edge (inside and outside differ across the edge) recedes from the cut with a wavy, rounded edge
    perim = set()
    for (a0, b0, a1, b1) in (A, B):
        for x in range(a0, a1 + 1): perim |= {((x, b0), (x, b0 - 1)), ((x, b1), (x, b1 + 1))}
        for y in range(b0, b1 + 1): perim |= {((a0, y), (a0 - 1, y)), ((a1, y), (a1 + 1, y))}
    perim = [(p, q) for (p, q) in perim if 0 <= q[0] < W and 0 <= q[1] < H]
    for z, kinds, base_ok in ((0, (27,), (16,)), (1, (21, 46, 47, 20), (16, 17, 27))):
        k = np.where(a[z] >= 2048, (a[z] - 2048) // 48, -1)
        for kk in kinds:
            mask = (k == kk)
            cut = np.ones((H, W), np.uint8)
            for (p, q) in perim:
                if mask[p[1], p[0]] != mask[q[1], q[0]]: cut[p[1], p[0]] = 0; cut[q[1], q[0]] = 0
            if cut.all(): continue
            dist = cv2.distanceTransform(cut, cv2.DIST_L2, 3)
            zone = dist <= 4.5
            soft = cv2.GaussianBlur(mask.astype(np.float32), (0, 0), 2.0) + (noise - 0.5) * 0.55
            want = soft > (0.5 + 0.38 * np.clip(1 - dist / 4.5, 0, 1))
            k0 = np.where(a[0] >= 2048, (a[0] - 2048) // 48, -1)
            for y, x in zip(*np.where(zone & free & (want != mask))):
                if (x, y) in ev_cells: continue
                if z == 0:
                    if want[y, x] and k0[y, x] in base_ok: a[0, y, x] = A2(kk)
                    elif not want[y, x] and k0[y, x] == kk: a[0, y, x] = A2(16)
                else:
                    if want[y, x] and a[1, y, x] == 0 and k0[y, x] in base_ok: a[1, y, x] = A2(kk)
                    elif not want[y, x] and k[y, x] == kk: a[1, y, x] = 0
    D[:] = [int(v) for v in a.reshape(-1)]
    # ---- roads: A* over open ground (events, buildings, fences, blocked regions avoided; old road cells cheap), 3-wide overlay
    def cell_cost(x, y):
        i = y * W + x
        if D[5 * n + i] == 2: return None
        if D[2 * n + i] or D[3 * n + i]: return None
        k0, k1 = kind(D[i]), kind(D[n + i])
        if D[i] < 2048 or (k0 is not None and k0 >= 48): return None
        if k1 in (22, 38, 23): return None                     # fences / low stone walls
        if (x, y) in ev_cells: return 40
        return 0.4 if (k0 == 17 or k1 == PATH_L1) else 1.0
    def astar(s, t):
        dist = {s: 0}; prev = {}; pq = [(0, s)]
        while pq:
            c, p = heapq.heappop(pq)
            if p == t: break
            if c > dist.get(p, 1e18): continue
            for ddx, ddy in ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (1, -1), (-1, 1), (-1, -1)):
                q = (p[0] + ddx, p[1] + ddy)
                if not (0 <= q[0] < W and 0 <= q[1] < H): continue
                cc = 0.4 if q == t else cell_cost(*q)
                if cc is None: continue
                nc = c + cc * (1.41 if ddx and ddy else 1) + math.hypot(q[0] - t[0], q[1] - t[1]) * 0
                if nc < dist.get(q, 1e18): dist[q] = nc; prev[q] = p; heapq.heappush(pq, (nc, q))
        if t not in prev and t != s: raise SystemExit("STOP: no way %s -> %s on Map%03d" % (s, t, mid))
        out = [t]
        while out[-1] != s: out.append(prev[out[-1]])
        return out[::-1]
    painted = set()
    for (s, t) in J["roads"]:
        pts = astar(tuple(s), tuple(t))
        # smooth (moving average) and brush radius ~1.1 with a little wobble
        xs = np.convolve([p[0] for p in pts], np.ones(5) / 5, mode="same"); ys = np.convolve([p[1] for p in pts], np.ones(5) / 5, mode="same")
        xs[:2], ys[:2], xs[-2:], ys[-2:] = [p[0] for p in pts[:2]], [p[1] for p in pts[:2]], [p[0] for p in pts[-2:]], [p[1] for p in pts[-2:]]
        for i, (fx, fy) in enumerate(zip(xs, ys)):
            r = 1.0 + 0.35 * math.sin(i * 0.7 + mid)
            for yy in range(int(fy - 2), int(fy + 3)):
                for xx in range(int(fx - 2), int(fx + 3)):
                    if not (0 <= xx < W and 0 <= yy < H) or (xx - fx) ** 2 + (yy - fy) ** 2 > r * r: continue
                    if cell_cost(xx, yy) is None or (xx, yy) in ev_cells: continue
                    if kind(D[yy * W + xx]) in (16, 27, 17, 24):
                        D[n + yy * W + xx] = A2(PATH_L1); painted.add((xx, yy))
        print("   droga %s -> %s: %d kratek" % (s, t, len(pts)))
    # ---- the fence ring (Fantasy_Outside_B rails 208/209 by column parity, left posts 216, right posts 217 - like the user's own fence)
    fx0, fy0, fx1, fy1 = J["fence"]; G = J["gates"]; fenced = set()
    ring = [(x, fy0, "top") for x in range(fx0, fx1 + 1)] + [(x, fy1, "bottom") for x in range(fx0 + 1, fx1 + 1)] +            [(fx0, y, "left") for y in range(fy0 + 1, fy1 + 1)] + [(fx1, y, "right") for y in range(fy0 + 1, fy1 + 1)]
    for (x, y, side) in ring:
        along = x if side in ("top", "bottom") else y
        if along in G.get(side, ()): continue
        if (x, y) == (fx1, fy1): t = 217
        elif (x, y) == (fx0, fy1): t = 216
        elif side in ("top", "bottom"): t = 208 if x % 2 == 0 else 209
        else: t = 216 if side == "left" else 217
        i = y * W + x
        if D[2 * n + i] not in (0, 208, 209, 216, 217) and D[2 * n + i] < 256: pass
        D[3 * n + i] = t; D[2 * n + i] = 0 if D[2 * n + i] in (208, 209, 216, 217) else D[2 * n + i]
        if kind(D[n + i]) == PATH_L1: D[n + i] = 0                     # (no road under a fence: the roads cross at the gates)
        fenced.add((x, y))
    # nature on the fence line steps outward, the yard's things inward
    taken = {(e["x"], e["y"]) for e in m["events"] if e}
    for e in m["events"]:
        if not e or (e["x"], e["y"]) not in fenced: continue
        img = e["pages"][0]["image"]["characterName"]
        if not img and not e["name"]: continue
        out = re.search(r"Pine|Tree|Big_Trees|Bush|Rock|Boulder|Stump|Ore", img or "") is not None
        cx, cy = (fx0 + fx1) / 2, (fy0 + fy1) / 2
        sx = (1 if e["x"] > cx else -1) if e["x"] in (fx0, fx1) else 0
        sy = (1 if e["y"] > cy else -1) if e["y"] in (fy0, fy1) else 0
        if not out: sx, sy = -sx, -sy
        for st in range(1, 6):
            q = (e["x"] + sx * st, e["y"] + sy * st)
            if q not in taken and q not in fenced and 0 <= q[0] < W and 0 <= q[1] < H: break
        taken.discard((e["x"], e["y"])); print("   płot: #%d %s %s -> %s" % (e["id"], e["name"][:20], (e["x"], e["y"]), q)); e["x"], e["y"] = q; taken.add(q)
    print("   płot: %d kratek, bramki %s" % (len(fenced), {k: (min(v), max(v)) for k, v in G.items()}))
    for z in (0, 1): WS.reshape(m, z, WS.ring(border | painted | fenced, 2))
    assert all(e is None or e["id"] == i for i, e in enumerate(m["events"]))
    open(os.path.join(OUT, "Map%03d.json" % mid), "wb").write(WS.map_text(m).encode("utf-8"))
    spec[mid] = {"A": A, "B": B, "dx": dx, "dy": dy}
    print("Map%03d: %s <-> %s (przesunięcie %+d,%+d), zdarzenia przeniesione: %d" % (mid, A, B, dx, dy, mv))
json.dump(spec, open(os.path.join(HERE, "przesuniecia.json"), "w"), indent=1)
