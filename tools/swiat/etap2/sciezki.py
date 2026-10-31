# -*- coding: utf-8 -*-
"""Naturalne sciezki dla etapu 2: kreta, o lekko zmiennej szerokosci 2-4, z miekkimi brzegami (ten sam autokafel co istniejace sciezki mapy),
omijajaca drzewa, krzewy i kwiaty; przebieg z A* po przechodnich kratkach z kosztem (drzewa/kwiaty drogie, istniejace sciezki tanie, szum),
wygladzony (Chaikin), szerokosc z wolnego szumu. W mapach tilesetu 9 sciezki to WARSTWA 1, autokafel kind 39 (jak w Kruczym Jarze, Lace#1,
Skraju lasu); w mapach tilesetu 11 - warstwa 0, kind 17."""
import heapq, math, random
import mapylib as M
import wspolne as W
import zbuduj as Z

DIRS = [(1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (1, -1), (-1, 1), (-1, -1)]


def styl(m):
    if m["tilesetId"] == 9: return (1, 39)
    n39 = sum(1 for x in range(m["width"]) for y in range(m["height"]) if W.kind_of(W.at(m, 1, x, y)) == 39)
    n17 = sum(1 for x in range(m["width"]) for y in range(m["height"]) if W.kind_of(W.at(m, 1, x, y)) == 17)
    return (1, 39) if n39 >= n17 else (1, 17)    # nowa pusta mapa: 39 jak 155/157/175


def istniejace(m):
    """kratki istniejacych sciezek mapy (warstwa 1 kind 39 w tilesecie 9 oraz stara ziemia warstwy 0 kind 17)"""
    z, k = styl(m)
    out = {(x, y) for x in range(m["width"]) for y in range(m["height"]) if W.kind_of(W.at(m, z, x, y)) == k}
    out |= {(x, y) for x in range(m["width"]) for y in range(m["height"]) if W.kind_of(W.at(m, 0, x, y)) == 17}
    return out


def najblizsza(m, cel):
    mp = _mapa(m)
    return min((c for c in istniejace(m) if mp.stoi(*c)), key=lambda c: math.hypot(c[0] - cel[0], c[1] - cel[1]), default=None)


def a_star(m, start, goal, seed, avoid=()):
    mp = M.Mapa(1, raw=m) if False else _mapa(m)
    ex = istniejace(m)
    rnd = random.Random(seed)
    Wd, H = m["width"], m["height"]
    # szum wolnozmienny: wartosci w siatce co 6 kratek, interpolowane
    gx, gy = Wd // 6 + 3, H // 6 + 3
    g = [[rnd.random() for _ in range(gx)] for _ in range(gy)]
    def noise(x, y):
        fx, fy = x / 6, y / 6; ix, iy = int(fx), int(fy); ax, ay = fx - ix, fy - iy
        a = g[iy][ix] * (1 - ax) + g[iy][ix + 1] * ax; b = g[iy + 1][ix] * (1 - ax) + g[iy + 1][ix + 1] * ax
        return a * (1 - ay) + b * ay
    ev = {}
    for e in m["events"]:
        if e and e["pages"][0]["list"][0]["code"] != 201: ev[(e["x"], e["y"])] = e
    def cost(c):
        x, y = c
        if c in avoid: return None
        if c != goal and c != start and not mp.stoi(x, y): return None
        r = 1.0 + 2.2 * noise(x, y)
        if c in ev: r += 40
        t1 = W.kind_of(W.at(m, 1, x, y))
        if t1 in (28, 29): r += 14                      # kwiaty
        if W.at(m, 2, x, y) or W.at(m, 3, x, y): r += 25
        for dx, dy in DIRS:                             # blisko drzew i krzewow troche drozej
            if (x + dx, y + dy) in ev: r += 0.8
        if c in ex: r *= 0.35
        return r
    pq = [(0, start)]; d = {start: 0.0}; pr = {}
    while pq:
        _, u = heapq.heappop(pq)
        if u == goal: break
        for dx, dy in DIRS:
            v = (u[0] + dx, u[1] + dy)
            if not (0 <= v[0] < Wd and 0 <= v[1] < H): continue
            c = cost(v)
            if c is None: continue
            n = d[u] + c * (1.414 if dx and dy else 1.0)
            if n < d.get(v, 1e18):
                d[v] = n; pr[v] = u
                heapq.heappush(pq, (n + math.hypot(v[0] - goal[0], v[1] - goal[1]), v))
    if goal not in d: return None
    p = [goal]
    while p[-1] != start: p.append(pr[p[-1]])
    return p[::-1]


_cache = {}
def _mapa(m):
    return M.Mapa(m.get("_id", 1), raw=m)


def wygladz(pts, n=3):
    for _ in range(n):
        out = [pts[0]]
        for a, b in zip(pts, pts[1:]):
            out += [(a[0] * .75 + b[0] * .25, a[1] * .75 + b[1] * .25), (a[0] * .25 + b[0] * .75, a[1] * .25 + b[1] * .75)]
        out.append(pts[-1]); pts = out
    return pts


def maluj(m, start, goal, seed, szer=(1.0, 1.9), krawedz=1.6):
    """sciezka od start do goal (kratki lokalne); zwraca zbior pomalowanych kratek albo None"""
    path = a_star(m, start, goal, seed)
    if not path: return None
    pts = [(float(x), float(y)) for (x, y) in path]
    if len(pts) > 6: pts = wygladz(pts[::2] + [pts[-1]] if len(pts) > 12 else pts, 2)
    rnd = random.Random(seed + 1)
    ph, fr = rnd.random() * 6.28, 0.12 + rnd.random() * 0.08
    z, k = styl(m)
    Wd, H = m["width"], m["height"]
    ev = {(e["x"], e["y"]) for e in m["events"] if e and e["pages"][0]["list"][0]["code"] != 201}
    cells = set()
    n = len(pts)
    mp = _mapa(m)
    for i, (px, py) in enumerate(pts):
        t = i / max(1, n - 1)
        w = szer[0] + (szer[1] - szer[0]) * (0.5 + 0.5 * math.sin(ph + fr * i))
        if i < 3 or i > n - 4: w = max(w, krawedz)           # przy krawedzi 3 szerokie
        for dy in range(-3, 4):
            for dx in range(-3, 4):
                x, y = int(round(px)) + dx, int(round(py)) + dy
                if not (0 <= x < Wd and 0 <= y < H): continue
                if math.hypot(x - px, y - py) <= w: cells.add((x, y))
    out = set()
    for (x, y) in cells:
        if (x, y) in ev: continue
        t1 = W.kind_of(W.at(m, 1, x, y))
        if t1 in (20, 28, 29): continue
        if W.at(m, 2, x, y) or W.at(m, 3, x, y): continue
        if not mp.stoi(x, y) and (x, y) != goal and (x, y) != start: continue
        out.add((x, y))
    for (x, y) in out:
        Z.kafel(m, z, x, y, Z.K(k))
    W.reshape(m, z, W.ring(out, 1))
    return out
