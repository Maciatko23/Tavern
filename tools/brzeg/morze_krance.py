# Morze na krańcach wyspy (2026-10-30, gracz: "z każdej strony ma być mapa brzegowa krańcowa, z linią brzegową i morzem").
# Powiększa mapy na wschodzie (159, 120, 175) i na południu (168, 17, 18) o ~16 kratek: ląd przy starej krawędzi (lustrzane odbicie
# ostatnich kolumn / rzędów, więc ta sama ziemia i ścieżki), potem naturalny brzeg z łukami i morze do nowego brzegu mapy. Współrzędne
# niczego nie przesuwają się (nowe jest na prawo od starej szerokości i pod starą wysokością). Na nowym lądzie rzadkie obiekty jako
# zdarzenia (kamienie, pnie, wyrzucone drewno) z numerami 1-499. Notatka mapy dostaje <Water:salt>.
#   python tools/brzeg/morze_krance.py [KATALOG_OBRAZKOW]    podgląd (nic nie zapisuje)
#   python tools/brzeg/morze_krance.py --zapisz              zapis do data/ (edytor zamknięty; kopie w backup_art_2026-10-30/brzegi/)
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from brzeg_lib import *

SAVE = "--zapisz" in sys.argv
BAK = os.path.join(ROOT, "backup_art_2026-10-30", "brzegi")
N_NEW = 16

# per map: the side, how much to add, the deepest land beyond the old edge, rows of the old border to heal, the seed
PLAN = [
    dict(mid=159, side="E", n=N_NEW, dmax=9, heal=0, seed=159),
    dict(mid=120, side="E", n=N_NEW, dmax=10, heal=0, seed=120, rise_end=14),   # (the SE corner: the beach goes round to the east edge, the south edge is land - Map013's north edge leads in there)
    dict(mid=175, side="E", n=N_NEW, dmax=10, heal=0, seed=175),
    dict(mid=168, side="S", n=N_NEW, dmax=9, heal=2, seed=168),
    dict(mid=17, side="S", n=N_NEW, dmax=10, heal=0, seed=17),
    dict(mid=18, side="S", n=N_NEW, dmax=10, heal=0, seed=18),
]


def depths(L, edge_water, dmax, seed, zero_ends=3, rise_end=0, n=16):
    """land depth beyond the old edge for every position along it (-1: the sea reaches the old edge here)"""
    wat = [i for i in range(L) if edge_water[i]]
    d = []
    for v in range(L):
        if edge_water[v]: d.append(-1); continue
        dw = min([abs(v - w) for w in wat] or [999])
        de = min(v, L - 1 - v)
        f = smooth(dw / 13.0)
        g = smooth((de - zero_ends + 1) / 12.0)
        nz = 0.45 + 0.55 * noise1(v, 11.0, seed) + 0.22 * (noise1(v, 4.0, seed + 1) - 0.5)
        d.append(round(dmax * nz * f * g))
    if rise_end:   # the end of the edge: the coast arcs outward until the land reaches the new map edge
        for v in range(L - rise_end, L):
            if d[v] >= 0: d[v] = max(d[v], round((n + 1) * smooth((v - (L - rise_end) + 1) / float(rise_end - 2))))
    # no one-cell notches: a median of three, then the steps at most 3
    d2 = d[:]
    for v in range(1, L - 1):
        if d[v] >= 0 and d[v - 1] >= 0 and d[v + 1] >= 0: d2[v] = sorted((d[v - 1], d[v], d[v + 1]))[1]
    for _ in range(2):
        for v in range(1, L):
            if d2[v] >= 0 and d2[v - 1] >= 0 and d2[v] - d2[v - 1] > 3: d2[v] = d2[v - 1] + 3
        for v in range(L - 2, -1, -1):
            if d2[v] >= 0 and d2[v + 1] >= 0 and d2[v] - d2[v + 1] > 3: d2[v] = d2[v + 1] + 3
    return d2


def extend(pl, side, n, dmax, heal, seed, rise_end=0):
    """the map bigger by n cells on the side (E: wider, S: taller); returns the sets of new land and new sea cells"""
    m = pl.m
    W0, H0 = m["width"], m["height"]
    W1, H1 = (W0 + n, H0) if side == "E" else (W0, H0 + n)
    L = H0 if side == "E" else W0
    old = m["data"]
    new = [0] * (W1 * H1 * 6)
    for z in range(6):
        for y in range(H0):
            new[(z * H1 + y) * W1:(z * H1 + y) * W1 + W0] = old[(z * H0 + y) * W0:(z * H0 + y) * W0 + W0]
    m["width"], m["height"], m["data"] = W1, H1, new
    cell = (lambda v, u: (W0 + u, v)) if side == "E" else (lambda v, u: (v, H0 + u))       # u: outward, 0 = the first new cell
    old_cell = (lambda v, s: (W0 - 1 - s, v)) if side == "E" else (lambda v, s: (v, H0 - 1 - s))   # s: inward, 0 = the old edge
    edge_water = [any(is_water_tile(W.at(m, z, *old_cell(v, 0))) for z in (0, 1)) for v in range(L)]
    d = depths(L, edge_water, dmax, seed, rise_end=rise_end, n=n)
    # the most common land tile of the old strip: the fallback when a mirrored cell is not ground
    cnt = {}
    for v in range(L):
        for s in range(heal, heal + 6):
            t = W.at(m, 0, *old_cell(v, s))
            if 2048 <= t < 4352 and not is_water_tile(t): cnt[t] = cnt.get(t, 0) + 1
    fallback = max(cnt, key=cnt.get)
    land, sea, healed = set(), set(), set()
    for v in range(L):
        for u in range(-heal, n):
            x, y = cell(v, u)
            if d[v] < 0:
                if u >= 0: sea.add((x, y))
                continue
            if u >= d[v] and u >= 0:
                sea.add((x, y)); continue
            (healed if u < 0 else land).add((x, y))
            sx, sy = old_cell(v, u + 2 * heal)          # the mirror about the last good row of the old part
            t0, t1 = W.at(m, 0, sx, sy), W.at(m, 1, sx, sy)
            if not (2048 <= t0 < 4352) or is_water_tile(t0):
                t0 = W.at(m, 0, *old_cell(v, heal))
                if not (2048 <= t0 < 4352) or is_water_tile(t0): t0 = fallback
            if not (2048 <= t1 < 4352) or is_water_tile(t1): t1 = 0
            W.put(m, 0, x, y, t0); W.put(m, 1, x, y, t1)
            for z in (2, 3, 4, 5): W.put(m, z, x, y, 0)
    carve(m, sea)
    reshape_around(m, land | sea | healed, 2)
    return dict(W0=W0, H0=H0, d=d, edge_water=edge_water, land=land, sea=sea, cell=cell, old_cell=old_cell, L=L)


# ------------------------------------------------------------------ rare objects on the new land (events, ids 1-499)
def coast_distance(m, land):
    """cells -> distance (steps) to the nearest sea cell (the sea anywhere on the map)"""
    from collections import deque
    Wd, Hd = m["width"], m["height"]
    dist = {}
    q = deque()
    for (x, y) in land:
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            if water_at(m, x + dx, y + dy): dist[(x, y)] = 1; q.append((x, y)); break
    while q:
        c = q.popleft()
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            n = (c[0] + dx, c[1] + dy)
            if n in land and n not in dist: dist[n] = dist[c] + 1; q.append(n)
    return dist


def free_ids(m, count):
    used = {e["id"] for e in m["events"] if e}
    out, i = [], 1
    while len(out) < count and i < 500:
        if i not in used: out.append(i)
        i += 1
    if len(out) < count: raise SystemExit("STOP: Map%03d nie ma %d wolnych numerów 1-499" % (m.get("_id", 0), count))
    return out


def put_event(m, e):
    while len(m["events"]) <= e["id"]: m["events"].append(None)
    m["events"][e["id"]] = e


def add_objects(pl, info, templates, seed):
    m = pl.m
    rnd = random.Random(seed * 31 + 7)
    land = info["land"]
    dist = coast_distance(m, land)
    occupied = set(events_at(m))
    transfers = [c for c in occupied]
    cands = [c for c in land if 2 <= dist.get(c, 99) <= 10 and 1 <= c[0] < m["width"] - 1 and 1 <= c[1] < m["height"] - 1
             and not blocked_tile(m, *c) and c not in occupied]
    rnd.shuffle(cands)
    want = max(4, round(len(land) / 38.0))
    placed = []
    for c in cands:
        if len(placed) >= want: break
        if any(abs(c[0] - p[0]) + abs(c[1] - p[1]) < 4 for p in placed): continue
        placed.append(c)
    ids = free_ids(m, len(placed))
    kinds = {}
    for c, i in zip(placed, ids):
        r = rnd.random()
        if r < 0.60: tid = rnd.choice((15, 15, 16, 16, 17, 18, 19, 20))
        elif r < 0.80: tid = 230
        else: tid = 246
        if tid == 246 and dist.get(c, 99) > 6: tid = rnd.choice((15, 16, 230))
        e = copy.deepcopy(templates[tid])
        e["id"], e["x"], e["y"] = i, c[0], c[1]
        if tid == 246: e["name"] = "Wyrzucone drewno"
        put_event(m, e)
        kinds[e["name"]] = kinds.get(e["name"], 0) + 1
    return kinds


def main():
    out = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith("--") else None
    tpl_src = Plik(159).orig
    templates = {e["id"]: e for e in tpl_src["events"] if e and e["id"] in (15, 16, 17, 18, 19, 20, 230, 246)}
    files = {}
    for p in PLAN:
        pl = files[p["mid"]] = Plik(p["mid"], z_kopii=True)
        old_size = (pl.m["width"], pl.m["height"])
        info = extend(pl, p["side"], p["n"], p["dmax"], p["heal"], p["seed"], p.get("rise_end", 0))
        note = pl.m.get("note", "") or ""
        if "<Water:salt>" not in note: pl.m["note"] = (note.rstrip("\n") + "\n<Water:salt>") if note else "<Water:salt>"
        kinds = add_objects(pl, info, templates, p["seed"])
        print("Map%03d: %dx%d -> %dx%d (%s +%d), nowy ląd %d kratek, morze %d kratek, zdarzenia: %s" % (
            p["mid"], old_size[0], old_size[1], pl.m["width"], pl.m["height"], p["side"], p["n"], len(info["land"]), len(info["sea"]), kinds))
        if out:
            import mapylib as L
            m = pl.m
            reg = (m["width"] - 40, 0, m["width"], m["height"]) if p["side"] == "E" else (0, m["height"] - 34, m["width"], m["height"])
            L.render(L.Mapa(p["mid"], raw=m), region=reg, scale=0.4).save(os.path.join(out, "morze_%d.png" % p["mid"]))
    if SAVE:
        for pl in files.values(): pl.zapisz(BAK)
        for pl in files.values(): print("zapisano", pl.rel)


if __name__ == "__main__":
    main()
