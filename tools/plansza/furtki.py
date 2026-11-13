# -*- coding: utf-8 -*-
"""Krok porządków planszy: furtki (gracz 2026-11-08: „wszędzie da się dojść”). Zakamarek = kawałek ziemi, po której da się chodzić,
odcięty od reszty mapy. Gdy odcina go PŁOT z kafli (A2 22 / 38 zestawu 11 - płot z bali), w płocie powstaje furtka: 2 kratki przerwy
(albo 1, gdy płot jest krótki) od strony, gdzie za płotem jest dostępna ziemia - najchętniej ścieżka - w środku prostego odcinka płotu
(końce płotu autokafel kończy słupkami sam). Zakamarki bez płotu (domy, mury, skały) i celowe (miejsca tylko z orła) - tylko spis.
  python tools/plansza/furtki.py   (po dostep.py; staging/furtki.txt)"""
import json, os
from collections import deque
from plansza import N, BOARD, STG, W, ROOT
OUT = os.path.join(STG, "data")
TS = json.load(open(os.path.join(ROOT, "data", "Tilesets.json"), encoding="utf-8"))
FENCE = {22, 38}
PATH = {17, 24, 40, 41, 42, 43}
CELOWE = {125: [(88, 22, 119, 52)]}   # (Okolice_Data: the eagle-only places of the harbour - meant to be cut off on foot)
MIN = 3
log = []
for mid in BOARD:
    p = os.path.join(OUT, "Map%03d.json" % mid)
    m = json.load(open(p, encoding="utf-8")); t, n = m["data"], N * N
    fl = TS[m["tilesetId"]]["flags"]; f = lambda v: fl[v] if v < len(fl) else 0
    blk_ev = {(e["x"], e["y"]) for e in m["events"] if e and e["pages"][0].get("priorityType") == 1 and not e["pages"][0].get("through")}
    def free(x, y):
        if not (0 <= x < N and 0 <= y < N): return False
        i = y * N + x
        if t[5 * n + i] == 2 or (x, y) in blk_ev or 2048 <= t[i] < 2816: return False
        for z in (3, 2, 1, 0):
            v = t[z * n + i]
            if not v: continue
            if f(v) & 0x10: continue
            return (f(v) & 0x0f) != 0x0f
        return True
    def fence(x, y):
        if not (0 <= x < N and 0 <= y < N): return False
        i = y * N + x; v1 = t[n + i]
        if not (2816 <= v1 < 4352 and W.kind_of(v1) in FENCE): return False
        if (x, y) in blk_ev or t[2 * n + i] or t[3 * n + i] or 2048 <= t[i] < 2816: return False
        v0 = t[i]
        return not (f(v0) & 0x0f) == 0x0f   # (only the fence blocks it)
    def comps():
        seen = {}
        out = []
        for y in range(N):
            for x in range(N):
                if (x, y) in seen or not free(x, y): continue
                q = deque([(x, y)]); seen[(x, y)] = len(out); c = [(x, y)]
                while q:
                    a, b = q.popleft()
                    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                        u = (a + dx, b + dy)
                        if u not in seen and free(*u): seen[u] = len(out); q.append(u); c.append(u)
                out.append(c)
        return out, seen
    opened, left = [], []
    for _round in range(6):
        cs, seen = comps()
        main = max(range(len(cs)), key=lambda k: len(cs[k]))
        pockets = [k for k in range(len(cs)) if k != main and len(cs[k]) >= MIN and not any(x0 <= cs[k][0][0] <= x1 and y0 <= cs[k][0][1] <= y1 for (x0, y0, x1, y1) in CELOWE.get(mid, []))]
        if not pockets: break
        did = False
        for k in pockets:
            cset = set(cs[k])
            best = None
            for (x, y) in cs[k]:
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    g = (x + dx, y + dy); o = (x + 2 * dx, y + 2 * dy)
                    if not fence(*g) or not free(*o) or seen.get(o) != main: continue
                    ax, ay = (dy, dx)   # (along the fence)
                    run = fence(g[0] + ax, g[1] + ay) and fence(g[0] - ax, g[1] - ay)
                    pair = (g[0] + ax, g[1] + ay) if fence(g[0] + ax, g[1] + ay) and free(o[0] + ax, o[1] + ay) and (x + ax, y + ay) in cset else None
                    score = (2 if W.kind_of(t[o[1] * N + o[0]]) in PATH else 0) + (1 if run else 0) + (1 if pair else 0)
                    if not best or score > best[0]: best = (score, g, pair)
            if best:
                cells = [best[1]] + ([best[2]] if best[2] else [])
                for (gx, gy) in cells: t[n + gy * N + gx] = 0
                W.reshape(m, 1, W.ring(cells, 1))
                opened.append("(%d,%d)%s" % (cells[0][0], cells[0][1], "+1" if len(cells) > 1 else ""))
                did = True
        if not did: break
    cs, seen = comps()
    main = max(range(len(cs)), key=lambda k: len(cs[k]))
    for k in range(len(cs)):
        if k != main and len(cs[k]) >= MIN and not any(x0 <= cs[k][0][0] <= x1 and y0 <= cs[k][0][1] <= y1 for (x0, y0, x1, y1) in CELOWE.get(mid, [])):
            left.append("%d kratek od (%d,%d)" % (len(cs[k]), cs[k][0][0], cs[k][0][1]))
    open(p, "wb").write(W.map_text(m).encode("utf-8"))
    log.append("Map%03d: furtek %d %s; zostają zakamarki bez płotu: %d %s" % (mid, len(opened), " ".join(opened), len(left), "; ".join(left[:12]) + (" …" if len(left) > 12 else "")))
open(os.path.join(STG, "furtki.txt"), "w", encoding="utf-8").write("\n".join(log) + "\n")
print("\n".join(log))
