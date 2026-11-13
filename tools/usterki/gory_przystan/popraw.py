# -*- coding: utf-8 -*-
"""Usterki z przeglądu ekranów: Map013 (Góry i kamieniołom) i Map125 (Przystań). Jedyny skrypt tego folderu:
buduje kopie robocze tools/usterki/gory_przystan/staging/data/Map013.json i Map125.json z BIEŻĄCEGO data/ (nic w grze).

  python tools/usterki/gory_przystan/popraw.py            (obie mapy + raport)
  python tools/usterki/gory_przystan/popraw.py 13         (jedna)

Sekcje (każda opisana nad swoim kodem):
  1. WZGÓRZA: cztery prostokątne plateau Map013 i dwa Map125 przebudowane w nieregularne, zaokrąglone obrysy z kafli A5
     w gramatyce wzgórza gracza (Map990 nr 1): górny brzeg 88/89/90, boki 96/98, dolny brzeg wierzchu 104/105/106,
     lico z dwóch rzędów 112-114 / 120-122, narożnik wewnętrzny = grunt mapy, wcięcia i występy o 1-2 kratki, kolumny lica
     o różnej wysokości dolnej linii (skok 1). Schody i miejsca zadań zostają, półki orła pozostają zamknięte.
"""
import json, os, sys, collections
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "mapy"))
sys.path.insert(0, os.path.join(ROOT, "tools", "rozszerzenia"))
import mapylib as L
import wspolne as W
STG = os.path.join(HERE, "staging", "data")
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass

A5 = 1536
# the grass-topped A5 block of tileset 11 (the user's hill on Map990)
T_RIM = (88, 89, 90); T_SIDE = (96, None, 98); T_LIP = (104, 105, 106)
T_F1 = (112, 113, 114); T_F2 = (120, 121, 122)
STAIR_L, STAIR_R = 24, 26


def kind(t): return (t - 2048) // 48 if t >= 2048 else None


class Karta:
    def __init__(self, mid):
        self.mid = mid
        path = os.path.join(ROOT, "data", "Map%03d.json" % mid)
        raw = open(path, "rb").read()
        self.m = json.loads(raw.decode("utf-8"))
        if W.map_text(self.m).encode("utf-8") != raw: raise SystemExit("Map%03d nie jest w układzie edytora" % mid)
        self.raw = raw
        self.Wd, self.Hd = self.m["width"], self.m["height"]
        self.n = self.Wd * self.Hd
        self.d = self.m["data"]
        self.report = []
        self.touched0, self.touched1 = set(), set()

    def at(self, z, x, y): return self.d[z * self.n + y * self.Wd + x]
    def put(self, z, x, y, v): self.d[z * self.n + y * self.Wd + x] = v

    def events(self): return [e for e in self.m["events"] if e]

    def finish(self):
        W.reshape(self.m, 0, W.ring(self.touched0, 1))
        W.reshape(self.m, 1, W.ring(self.touched1, 1))
        for i, e in enumerate(self.m["events"]):
            assert e is None or e["id"] == i, "events index != id"
        return W.map_text(self.m).encode("utf-8")


# ------------------------------------------------------------------------------------------------ 1. wzgórza
# the tile pieces the user's estetyka check f requires a continuation for (tools/mapy/estetyka.py HILL_WYMAGA): kept in step with it
HILL_A5_REL = {88, 89, 90, 96, 97, 98, 104, 105, 106, 112, 113, 114, 120, 121, 122, 73, 74, 81, 82, 76, 24, 25, 26, 27}
HILL_WYMAGA = {88: "ES", 89: "WE", 90: "WS", 96: "NS", 98: "NS", 113: "WE", 121: "WE", 112: "E", 120: "E", 114: "W", 122: "W", 104: "E", 106: "W"}


def profile(P):
    cols = collections.defaultdict(list)
    for (x, y) in P: cols[x].append(y)
    top, bot = {}, {}
    for x, ys in cols.items():
        ys.sort()
        if ys != list(range(ys[0], ys[-1] + 1)): return None, None
        top[x], bot[x] = ys[0], ys[-1]
    return top, bot


def plan_tiles(P, stairs, variants=None):
    """{cell: A5 index or None (the map's ground)} for the top plane P (set of cells; every column one interval) and its face (two rows under each
    column's last cell); None: the column is not an interval"""
    top, bot = profile(P)
    if top is None: return None
    variants = variants or {}
    face = {(x, bot[x] + r) for x in bot for r in (1, 2)}
    inP = lambda x, y: (x, y) in P
    out = {}
    for (x, y) in face:
        r = y - bot[x]
        sameface = lambda xx: xx in bot and (xx, y) in face and (y - bot[xx]) == r
        lt, rt = sameface(x - 1), sameface(x + 1)
        row = T_F1 if r == 1 else T_F2
        if x in stairs: t = STAIR_L if x == stairs[0] else STAIR_R
        elif (x - 1 in stairs) or (x + 1 in stairs): t = row[1]
        else:
            t = row[0] if not lt else row[2] if not rt else row[1]
            v = variants.get((x, y))
            if v and t == row[1]: t = v
        out[(x, y)] = t
    for (x, y) in P:
        N, S, Wt, E = inP(x, y - 1), inP(x, y + 1), inP(x - 1, y), inP(x + 1, y)
        if x in stairs and y == bot[x]: out[(x, y)] = None; continue
        if not (N and S and Wt and E):
            ri = 0 if not N else 2 if not S else 1
            ci = 0 if not Wt else 2 if not E else 1
            t = (T_RIM, T_SIDE, T_LIP)[ri][ci]
            if t is None: return None            # a one-cell isthmus
            out[(x, y)] = t
        elif not all(inP(x + dx, y + dy) for dx, dy in ((1, 1), (-1, 1), (1, -1), (-1, -1))): out[(x, y)] = 76
        else: out[(x, y)] = None
    return out


def kontynuacje_ok(tiles):
    """the user's rule 6 as estetyka.sprawdz_f_zamkniete reads it: every outline piece has its required continuation among the hill's pieces"""
    cells = {c for c, t in tiles.items() if t is not None and t in HILL_A5_REL}
    for (x, y), t in tiles.items():
        wym = HILL_WYMAGA.get(t)
        if not wym: continue
        for ch in wym:
            d = {"W": (-1, 0), "E": (1, 0), "N": (0, -1), "S": (0, 1)}[ch]
            if (x + d[0], y + d[1]) not in cells: return False
    return True


def dolna_linia_ok(P, stairs):
    """estetyka check f on the face's bottom line: runs of equal height >= 2 columns, neighbouring runs differ by exactly 1, no hole, no 3 short runs in a row"""
    top, bot = profile(P)
    if top is None: return False
    xs = sorted(bot)
    if xs != list(range(xs[0], xs[-1] + 1)): return False
    runs = []; i = 0
    while i < len(xs):
        j = i
        while j + 1 < len(xs) and bot[xs[j + 1]] == bot[xs[i]]: j += 1
        runs.append((xs[i], j - i + 1, bot[xs[i]])); i = j + 1
    if any(r[1] < 2 for r in runs): return False
    if any(abs(runs[k + 1][2] - runs[k][2]) != 1 for k in range(len(runs) - 1)): return False
    for k in range(len(runs) - 2):
        if all(r[1] <= 2 for r in runs[k:k + 3]): return False
    return True


def ksztalt(spec, K):
    """an irregular rounded top plane for a hill: a superellipse over the box with a slow wobble on every side (every side its own), then a 3x3
    majority smoothing; the first seed that passes every check wins; among valid ones the most irregular outline (many turns, none shorter than 2)"""
    import random, math
    x0, y0, x1, y1 = spec["bbox"]
    keep = [tuple(c) for c in spec.get("keep", [])]
    fixed_bot = spec.get("bottom", {})
    stairs = spec.get("stairs", [])
    old = spec["old"]
    evcells = {(e["x"], e["y"]) for e in K.events()}
    allowed = set(map(tuple, spec.get("allowed", [])))
    tree_foot = set()
    for e in K.events():
        g = e["pages"][0]["image"]["characterName"] or ""
        if g.startswith(("!$Pine", "!$Tree", "!$Big_Trees")) and not (old[0] <= e["x"] <= old[2] and old[1] <= e["y"] <= old[3]):
            for dx in (-1, 0, 1):
                for dy in (-2, -1, 0): tree_foot.add((e["x"] + dx, e["y"] + dy))
    cx, cy = (x0 + x1) / 2.0, (y0 + y1) / 2.0
    rx, ry = (x1 - x0 + 1) / 2.0, (y1 - y0 + 1) / 2.0
    best = None
    for seed in range(1, 9001):
        r = random.Random(seed * 7919 + x0 * 31 + y0)
        ex = r.uniform(2.2, 4.0)
        ph = [r.uniform(0, 6.28) for _ in range(6)]
        amp = r.uniform(0.14, 0.34)
        P = set()
        for y in range(y0 - 1, y1 + 2):
            for x in range(x0 - 1, x1 + 2):
                dx, dy = (x - cx) / rx, (y - cy) / ry
                a = math.atan2(dy, dx)
                w = 1 + amp * (math.sin(2 * a + ph[0]) * 0.5 + math.sin(3 * a + ph[1]) * 0.35 + math.sin(5 * a + ph[2]) * 0.25)
                if abs(dx) ** ex + abs(dy) ** ex <= w ** ex: P.add((x, y))
        for _ in range(2):                          # majority smoothing (removes teeth and one-cell holes)
            cand = {(x + dx, y + dy) for (x, y) in P for dx in (-1, 0, 1) for dy in (-1, 0, 1)}
            nP = set()
            for (x, y) in cand:
                n = sum(((x + dx, y + dy) in P) for dx in (-1, 0, 1) for dy in (-1, 0, 1) if dx or dy)
                if ((x, y) in P and n >= 3) or ((x, y) not in P and n >= 5): nP.add((x, y))
            P = nP
        # the stairs' columns: a full run down to the lip row
        for sx in stairs:
            for xx in range(sx - 2, sx + 4):
                for yy in range(min(y for (x, y) in P if x == xx) if any(x == xx for (x, y) in P) else y0 + 2, y1 + 1): P.add((xx, yy))
        for x, b in fixed_bot.items():              # a column that must end on a given row (a den / a way down below it): cut or lengthened to it
            ys = [y for (xx, y) in P if xx == x]
            if not ys: continue
            for y in [y for y in ys if y > b]: P.discard((x, y))
            for y in range(min(ys), b + 1): P.add((x, y))
        top, bot = profile(P)
        if top is None: continue
        if any(bot.get(x) != b for x, b in fixed_bot.items()): continue
        if stairs and any(bot.get(x) != y1 for x in range(stairs[0] - 2, stairs[-1] + 3)): continue
        if not dolna_linia_ok(P, stairs): continue
        if min(P, key=lambda c: c[1])[1] < y0 - 1 or max(c[1] for c in P) > y1 + 1: continue
        rows = collections.defaultdict(list)
        for (x, y) in P: rows[y].append(x)
        if any(len(v) < 4 for v in rows.values()): continue
        if any(sorted(v) != list(range(min(v), max(v) + 1)) for v in rows.values()): continue
        ys_r = sorted(rows)
        if any(abs(min(rows[a_]) - min(rows[b_])) > 2 or abs(max(rows[a_]) - max(rows[b_])) > 2 for a_, b_ in zip(ys_r, ys_r[1:])): continue      # no tabs
        xs_c = sorted(top)
        if any(abs(top[a_] - top[b_]) > 2 for a_, b_ in zip(xs_c, xs_c[1:])): continue
        tiles = plan_tiles(P, stairs)
        if tiles is None or not kontynuacje_ok(tiles): continue
        if any(tiles.get(c) is not None or c not in P for c in keep): continue
        hill = set(tiles)
        if any(c in hill and c not in allowed for c in evcells if not (old[0] <= c[0] <= old[2] and old[1] <= c[1] <= old[3] and c in P and tiles.get(c) is None)): continue
        # the outline's character: long straight runs and diagonal staircases are penalised, turns and a fill of ~0.78 rewarded
        def runs_of(seq):
            out = []; i = 0
            while i < len(seq):
                j = i
                while j + 1 < len(seq) and seq[j + 1] == seq[i]: j += 1
                out.append(j - i + 1); i = j + 1
            return out
        def stairs_of(seq):
            d = [b_ - a_ for a_, b_ in zip(seq, seq[1:])]; pen = 0; i = 0
            while i < len(d):
                j = i
                while j + 1 < len(d) and d[j + 1] == d[i] and d[i] != 0: j += 1
                if d[i] != 0 and j - i + 1 >= 3: pen += 1
                i = j + 1
            return pen
        ys_ = sorted(rows)
        Ls = [min(rows[y]) for y in ys_]; Rs = [max(rows[y]) for y in ys_]
        xs_ = sorted(top)
        Ts = [top[x] for x in xs_]; Bs = [bot[x] for x in xs_]
        pen = sum(max(0, r_ - 4) * 1.2 for q in (Ls, Rs, Ts, Bs) for r_ in runs_of(q)) + 3 * sum(stairs_of(q) for q in (Ls, Rs, Ts, Bs))
        turns = sum(len(runs_of(q)) - 1 for q in (Ls, Rs, Ts, Bs))
        fill = len(P) / float((x1 - x0 + 1) * (y1 - y0 + 1))
        score = turns - pen - 25 * abs(fill - 0.78)
        if best is None or score > best[0]: best = (score, seed, P)
    if best is None: return None, None
    return best[2], best[1]


def wzgorze(K, h):
    """h: name, old (x0, y0, x1, y1: the old hill with its face, inclusive), rows {y: [(xl, xr)]} = the new top plane (rim row, sides and
    the lip row are the plane's own outer cells) or bbox/keep/bottom (generated: ksztalt), stairs [x, x+1] or [], allowed: events allowed on the
    edge/face cells."""
    x0, y0, x1, y1 = h["old"]
    stairs = h.get("stairs", [])
    P = set()
    seed = None
    if "bbox" in h:
        P, seed = ksztalt(h, K)
        if P is None:
            K.report.append("  UWAGA %s: żaden wygenerowany kształt nie przeszedł, biorę ręczny obrys" % h["name"])
            P = set()
    if not P:
        for y, ivs in h["rows"].items():
            for (xl, xr) in ivs:
                for x in range(xl, xr + 1): P.add((x, y))
    top, bot = profile(P)
    assert top is not None, "kolumna nie jest przedziałem"
    cols = list(bot)
    # old hill: its stairs' tiles, its variant tiles
    old_cells = {(x, y) for y in range(y0, y1 + 1) for x in range(x0, x1 + 1)}
    old_edge = {c for c in old_cells if 1536 <= K.at(0, *c) < 1664}
    variants = {c: K.at(0, *c) - A5 for c in old_cells if K.at(0, *c) - A5 in (73, 74, 81, 82)}
    saved = {(x, y): (K.at(0, x, y), K.at(1, x, y)) for x in stairs for y in range(y0, y1 + 1)}
    tiles = plan_tiles(P, stairs, variants)
    assert tiles is not None, "plan_tiles: przesmyk w %s" % h["name"]
    hill = set(tiles)
    face = hill - P
    inP = lambda x, y: (x, y) in P
    # the ground outside: for every cell that stops being hill, the nearest non-hill A2 ground of the old map (by distance)
    def outside_kind(x, y):
        for r in range(1, 8):
            cand = collections.Counter()
            for yy in range(y - r, y + r + 1):
                for xx in range(x - r, x + r + 1):
                    if max(abs(xx - x), abs(yy - y)) != r: continue
                    if (xx, yy) in old_cells or (xx, yy) in hill: continue
                    if not (0 <= xx < K.Wd and 0 <= yy < K.Hd): continue
                    k = kind(K.at(0, xx, yy))
                    if k is not None and 16 <= k < 48: cand[k] += 1
            if cand: return cand.most_common(1)[0][0]
        return 16
    # 1. old hill out: ground again
    for (x, y) in old_cells:
        if (x, y) in hill: continue
        K.put(0, x, y, 2048 + 48 * outside_kind(x, y)); K.touched0.add((x, y)); K.put(4, x, y, 0)
    # 2. the new hill
    for (x, y) in sorted(hill, key=lambda c: (c[1], c[0])):
        old = K.at(0, x, y)
        t = tiles[(x, y)]
        if t is None:
            if (x, y) in old_edge or not (x0 <= x <= x1 and y0 <= y <= y1) or kind(old) is None or not (16 <= kind(old) < 48):
                K.put(0, x, y, 2048 + 48 * 16)
            K.touched0.add((x, y)); K.put(4, x, y, 0)
            continue
        K.put(0, x, y, A5 + t)
        for z in (1, 2, 3):
            if K.at(z, x, y) and not (x in stairs and z == 1 and (x, y) in saved and (x, y) in face): K.touched1.add((x, y)); K.put(z, x, y, 0)
        if x in stairs and (x, y) in face: K.put(1, x, y, saved[(x, y)][1])
        K.put(4, x, y, 0)
    for c in hill | old_cells: K.touched0.add(c)
    K.touched1 |= {c for c in hill | old_cells}
    # report: events on edge/face cells
    allowed = set(map(tuple, h.get("allowed", [])))
    for e in K.events():
        c = (e["x"], e["y"])
        if c in hill and tiles[c] is not None and c not in allowed and not (c in P and tiles[c] == 76 and False):
            K.report.append("  UWAGA %s: zdarzenie %d '%s' na brzegu/licu (%d,%d)" % (h["name"], e["id"], e["name"], c[0], c[1]))
    K.report.append("  %-34s ziarno %s, wierzch %d kratek, lico %d, kolumn %d..%d, dolna linia %s" % (h["name"], seed, len(P), len(face), min(cols), max(cols),
                    "".join(str(bot[x] - min(bot.values())) for x in sorted(cols))))
    K.hills = getattr(K, "hills", []) + [(h["name"], P, hill, tiles)]
    K.newhill = getattr(K, "newhill", set()) | {c for c in hill if not (x0 <= c[0] <= x1 and y0 <= c[1] <= y1)}
    return hill, P, face


HILLS = {
    13: [
        # the nest shelf (orzel_013_a: eagle only; the den on the face at 99-100,69-70 stays; landing 99-102 x 62-65 stays inside)
        {"name": "półka z gniazdem (98,60)", "old": (98, 60, 108, 70), "stairs": [], "allowed": [(99, 69), (100, 69)],
         "bbox": (97, 60, 108, 68), "keep": [(x, y) for x in range(99, 104) for y in range(61, 68)] + [(104, 64)], "bottom": {99: 68, 100: 68},
         "rows": {60: [(100, 105)], 61: [(99, 107)], 62: [(98, 108)], 63: [(98, 108)], 64: [(98, 108)], 65: [(98, 108)], 66: [(98, 108)],
                  67: [(98, 108)], 68: [(98, 106)]}},
        # the plateau by the shore (stairs 100-101)
        {"name": "plateau przy brzegu (95,93)", "old": (95, 93, 106, 101), "stairs": [100, 101], "allowed": [],
         "bbox": (95, 93, 106, 99), "keep": [(x, y) for x in range(97, 105) for y in range(95, 98)],
         "rows": {93: [(97, 102)], 94: [(96, 104)], 95: [(95, 105)], 96: [(95, 106)], 97: [(95, 106)], 98: [(95, 106)], 99: [(97, 104)]}},
        # the west plateau (stairs 20-21)
        {"name": "plateau zachodnie (14,96)", "old": (14, 96, 27, 103), "stairs": [20, 21], "allowed": [],
         "bbox": (14, 96, 27, 101), "keep": [(x, y) for x in range(16, 26) for y in range(98, 100)],
         "rows": {96: [(17, 25)], 97: [(15, 26)], 98: [(14, 27)], 99: [(14, 27)], 100: [(14, 27)], 101: [(16, 27)]}},
        # the flower shelf (orzel_013_b: eagle only, no stairs)
        {"name": "półka z szarotką (32,96)", "old": (32, 96, 44, 103), "stairs": [], "allowed": [],
         "bbox": (32, 96, 44, 101), "keep": [(x, y) for x in range(33, 41) for y in range(97, 101)],
         "rows": {96: [(33, 42)], 97: [(32, 43)], 98: [(32, 44)], 99: [(32, 44)], 100: [(32, 44)], 101: [(34, 42)]}},
    ],
    125: [
        # orzel_125_b (the old nest; the nest thing on the west edge (104,33) and the way down at (108,34) stay)
        {"name": "półka ze starym gniazdem (104,29)", "old": (104, 29, 109, 36), "stairs": [], "allowed": [(104, 33), (108, 34)],
         "bbox": (104, 29, 110, 34), "keep": [(x, y) for x in range(105, 108) for y in range(30, 34)], "bottom": {108: 34},
         "rows": {29: [(105, 107)], 30: [(104, 108)], 31: [(104, 110)], 32: [(104, 110)], 33: [(104, 110)], 34: [(104, 108)]}},
        # orzel_125_a (the stash; the way down at (99,49))
        {"name": "półka ze skrytką (96,44)", "old": (96, 44, 101, 51), "stairs": [], "allowed": [(101, 46), (99, 49)],
         "bbox": (96, 44, 103, 49), "keep": [(x, y) for x in range(97, 101) for y in range(45, 49)], "bottom": {99: 49},
         "rows": {44: [(97, 100)], 45: [(96, 101)], 46: [(96, 101)], 47: [(96, 103)], 48: [(96, 103)], 49: [(96, 101)]}},
    ],
}


NAT = (16, 17, 24, 25, 26, 27)
PLAMY_J = (17, 24, 27)
RUN_MAX = 4


def lam_gruntu(K, chronione=()):
    """2. straight outline runs of the ground patches (rows ES-j / ES-b: A2 17 / 24 / 27 on layer 0, a run of more than 4 cells): in the middle of
    each run a bump two cells wide is added outwards (the neighbour's natural ground becomes the patch's kind), as in tools/mapa_probna's
    lam_proste. Only cells of natural ground with nothing on layers 1-3 and no event; the hills' boxes and region cells are left alone."""
    m, Wd, Hd = K.m, K.Wd, K.Hd
    evcells = {(e["x"], e["y"]) for e in K.events()}
    prot = set()
    for (x0, y0, x1, y1) in chronione:
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1): prot.add((x, y))
    def free(x, y):
        if not (3 <= x < Wd - 3 and 3 <= y < Hd - 3): return False
        if (x, y) in prot or (x, y) in evcells: return False
        if kind(K.at(0, x, y)) not in NAT: return False
        t1 = K.at(1, x, y)
        if (t1 and not (2048 <= t1 < 4352 and kind(t1) in (21, 28, 29, 31))) or K.at(2, x, y) or K.at(3, x, y) or K.at(5, x, y): return False
        return True
    changed = set(); rounds = 0
    for rounds in range(40):
        grid = {}
        for y in range(Hd):
            for x in range(Wd):
                k = kind(K.at(0, x, y))
                if k in PLAMY_J: grid[(x, y)] = k
        seen = set(); did = 0
        for c0 in list(grid):
            if c0 in seen: continue
            k = grid[c0]; comp = []; st = [c0]; seen.add(c0)
            while st:
                x, y = st.pop(); comp.append((x, y))
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    n = (x + dx, y + dy)
                    if n not in seen and grid.get(n) == k: seen.add(n); st.append(n)
            if len(comp) < 8: continue
            xs = [q[0] for q in comp]; ys = [q[1] for q in comp]
            if min(xs) == 0 or min(ys) == 0 or max(xs) == Wd - 1 or max(ys) == Hd - 1: continue
            cs = set(comp)
            for os_, sg in ((0, 1), (0, -1), (1, 1), (1, -1)):
                edge = {}
                for (x, y) in comp:
                    key, v = (x, sg * y) if os_ == 0 else (y, sg * x)
                    if key not in edge or v < edge[key]: edge[key] = v
                ks = sorted(edge); i = 0
                while i < len(ks):
                    j = i
                    while j + 1 < len(ks) and ks[j + 1] == ks[j] + 1 and edge[ks[j + 1]] == edge[ks[i]]: j += 1
                    ln = j - i + 1
                    if ln > RUN_MAX:
                        v = edge[ks[i]] - 1; mid0 = (ln - 2) // 2
                        for off in sorted(range(1, ln - 2), key=lambda o: (abs(o - mid0), o)):
                            mid = ks[i] + off
                            cells = [((mid + q, sg * v) if os_ == 0 else (sg * v, mid + q)) for q in (0, 1)]
                            if all(free(*c) for c in cells):
                                for (x, y) in cells:
                                    K.put(0, x, y, 2048 + 48 * k); changed.add((x, y)); did += 1
                                break
                    i = j + 1
        if not did: break
    for c in changed: K.touched0.add(c)
    K.report.append("  łamanie prostych obrysów gruntu: %d kratek w %d rundach" % (len(changed), rounds + 1))


def zaokraglenie(K):
    box = [(h["old"][0] - 2, h["old"][1] - 2, h["old"][2] + 2, h["old"][3] + 2) for h in HILLS.get(K.mid, [])]
    lam_gruntu(K, box)


# ------------------------------------------------------------------------------------------------ 3. Map125: płoty, bramki, zagroda
def plot_nad_dachami(K):
    """rows 24 / 25 (severity 3): the top fence of the three yards ran along the row y=20, directly on the roofs' ridge (the roofs start at y=21):
    it goes one row up (y=19), the yards' side fences get one cell longer; the ground under the new row is grass (no dirt under a fence)."""
    xs = range(47, 78)
    verticals = {47, 56, 65, 77}
    fence = 2048 + 48 * 22
    for x in xs:
        assert kind(K.at(1, x, 20)) == 22, "brak płotu w (%d,20)" % x
        if x not in verticals: K.put(1, x, 20, 0)
        K.put(1, x, 19, fence)
        if kind(K.at(0, x, 19)) == 17: K.put(0, x, 19, 2048 + 48 * 16)
        K.touched1.add((x, 19)); K.touched1.add((x, 20)); K.touched0.add((x, 19))
    K.report.append("  płoty nad dachami: górny rząd (47..77, 20) -> (47..77, 19), 3 podwórza")


def bramki_podworzy(K):
    """rows 31-33 (PL1): the 2-cell entrances in the yards' front fences (y=29) had no gate posts: tile 209 on the left end, 208 on the right
    end (layer 3, over the fence cell), as in the pen at (40,59)/(43,59)"""
    for (xl, xr) in ((50, 53), (60, 63), (69, 72)):
        for x in (xl, xr):
            assert kind(K.at(1, x, 29)) == 22, "brak płotu w (%d,29)" % x
        for x in range(xl + 1, xr): assert kind(K.at(1, x, 29)) != 22
        K.put(3, xl, 29, 209); K.put(3, xr, 29, 208)
    K.report.append("  bramki podwórzy: słupki 209/208 przy trzech wejściach (y=29)")


def zagroda_grunt(K):
    """row 54: the pen (38..49 x 59..66) had two grounds inside (grass + a dirt patch); one grass ground now"""
    n = 0
    for y in range(60, 66):
        for x in range(39, 49):
            k = kind(K.at(0, x, y))
            if k in (17, 24, 25, 26, 27): K.put(0, x, y, 2048 + 48 * 16); K.touched0.add((x, y)); n += 1
    K.report.append("  zagroda (38..49 x 59..66): %d kratek gruntu na jedną trawę" % n)


# ------------------------------------------------------------------------------------------------ 4. drzewa dalej od brzegu
def drzewa_od_wody(K, chronione=()):
    """rows ES-g: a tree nearer than 4 cells to the water, or on earth/stone (A2 17, 24, layer 1 36/39/23/47, A5) nearer than 7: moved (the event only:
    its notes and commands stay) to the nearest free grass cell that is 7+ cells from the water, with nothing within a cell of it"""
    import numpy as np
    Wd, Hd = K.Wd, K.Hd
    water = np.zeros((Hd, Wd), bool)
    for y in range(Hd):
        for x in range(Wd):
            for z in (0, 1):
                t = K.at(z, x, y); k = kind(t) if 2048 <= t < 4352 else None
                if k is not None and k < 16 and (k < 4 or k % 2 == 0): water[y, x] = True
    if not water.any(): return
    wy, wx = np.nonzero(water)
    def dist(x, y): return float(np.sqrt(((wx - x) ** 2 + (wy - y) ** 2).min()))
    trees = [e for e in K.events() if (e["pages"][0]["image"]["characterName"] or "").startswith(("!$Pine", "!$Tree", "!$Big_Trees"))]
    occupied = {(e["x"], e["y"]) for e in K.events()}
    prot = set()
    for (x0, y0, x1, y1) in chronione:
        for yy in range(y0, y1 + 1):
            for xx in range(x0, x1 + 1): prot.add((xx, yy))
    newhill = getattr(K, "newhill", set())
    def bad(e):
        if any((e["x"] + dx, e["y"] + dy) in newhill for dx in (-1, 0, 1) for dy in (-2, -1, 0)): return True   # its sprite would lie over a new wall / face
        d = dist(e["x"], e["y"])
        if d < 4: return True
        if d < 7:
            t0 = K.at(0, e["x"], e["y"]); k0 = kind(t0) if 2048 <= t0 < 4352 else None
            t1 = K.at(1, e["x"], e["y"]); k1 = kind(t1) if 2048 <= t1 < 4352 else None
            return k0 in (17, 24) or k1 in (36, 39, 23, 47) or 1536 <= t0 < 2048
        return False
    mp = L.Mapa(K.mid, raw=K.m)
    blocked = set(mp.ev_block())
    tree_ids = {e["id"] for e in trees}
    solid = {c for c, es in mp.ev_block().items() if any(e.id not in tree_ids for e in es)}
    for yy in range(Hd):
        for xx in range(Wd):
            if not mp.kratka_wolna(xx, yy): solid.add((xx, yy))
    solid |= getattr(K, "newhill", set())
    def free(x, y):
        for dx in (-1, 0, 1):                  # the tall sprite (3 cells wide, 3-4 high) must not lie over a wall, a hill face, a fence or a building
            for dy in (-3, -2, -1, 0, 1):
                if (x + dx, y + dy) in solid: return False
        if not (2 <= x < Wd - 2 and 2 <= y < Hd - 2) or (x, y) in prot: return False
        t0 = K.at(0, x, y)
        if not (2048 <= t0 < 4352) or kind(t0) != 16: return False
        if K.at(1, x, y) or K.at(2, x, y) or K.at(3, x, y) or K.at(5, x, y): return False
        for dx in (-1, 0, 1):                  # nothing solid, no event, no hill / wall / fence within a cell: the tree stands free
            for dy in (-1, 0, 1):
                c = (x + dx, y + dy)
                if c in occupied or c in blocked or not mp.kratka_wolna(*c): return False
        return dist(x, y) >= 7
    moved = []
    for e in sorted((e for e in trees if bad(e)), key=lambda e: e["id"]):
        found = None
        for r in range(1, 30):
            cand = [(e["x"] + dx, e["y"] + dy) for dy in range(-r, r + 1) for dx in range(-r, r + 1) if max(abs(dx), abs(dy)) == r]
            cand = [c for c in cand if free(*c)]
            if cand:
                found = min(cand, key=lambda c: (c[0] - e["x"]) ** 2 + (c[1] - e["y"]) ** 2 - 0.01 * dist(*c)); break
        if not found: K.report.append("  drzewo %d (%d,%d): brak wolnej kratki" % (e["id"], e["x"], e["y"])); continue
        occupied.discard((e["x"], e["y"])); occupied.add(found); blocked.add(found)
        moved.append((e["id"], (e["x"], e["y"]), found)); e["x"], e["y"] = found
    K.report.append("  drzewa od wody: przesunięte %d: %s" % (len(moved), "; ".join("%d (%d,%d)->(%d,%d)" % (i, a[0], a[1], b[0], b[1]) for i, a, b in moved)))
    K.tree_moves = moved


# ------------------------------------------------------------------------------------------------ 5. Map013: samotna linia, ciemne plamy
def linia_lasu(K):
    """row 06: a lone thin vertical wall line (A5 96 = a hill's west side) 21 cells long at x=16 through the forest, belonging to no hill: grass"""
    n = 0
    for y in range(30, 56):
        t = K.at(0, 16, y)
        if t == A5 + 96:
            K.put(0, 16, y, 2048 + 48 * 16); K.touched0.add((16, y)); n += 1
    K.report.append("  samotna linia A5 96 w x=16: %d kratek -> trawa" % n)


def ciemne_plamy(K):
    """rows 29 / 47 / 53: dark stone-mud patches (layer 1 kind 36) that are ribbons, rounded rectangles or crosses go; the small irregular ones stay"""
    W_, H_ = K.Wd, K.Hd
    g = {(x, y) for y in range(H_) for x in range(W_) if 2048 <= K.at(1, x, y) < 4352 and kind(K.at(1, x, y)) == 36}
    seen = set(); gone = []
    for c in sorted(g):
        if c in seen: continue
        st = [c]; seen.add(c); comp = []
        while st:
            x, y = st.pop(); comp.append((x, y))
            for dx in (-1, 0, 1):
                for dy in (-1, 0, 1):
                    q = (x + dx, y + dy)
                    if q in g and q not in seen: seen.add(q); st.append(q)
        xs = [a for a, b in comp]; ys = [b for a, b in comp]
        bw, bh = max(xs) - min(xs) + 1, max(ys) - min(ys) + 1
        fill = len(comp) / float(bw * bh)
        ribbon = max(bw, bh) >= 8 and min(bw, bh) <= 5
        rect = len(comp) >= 12 and fill >= 0.8
        cross = len(comp) in (5, 6) and bw == 3 and bh == 3
        if ribbon or rect or cross or (len(comp) >= 9 and bw == 3 and bh == 3):
            for (x, y) in comp: K.put(1, x, y, 0); K.touched1.add((x, y))
            gone.append((min(xs), min(ys), bw, bh, len(comp)))
    K.report.append("  ciemne plamy (warstwa 1, rodzaj 36) zdjęte: %s" % gone)


def lico_przy_schodach(K):
    """rows ES-i (the user's rule 4): the face meets a stairs' side straight - A5 113 / 121, no rounded end pieces (112 / 114 / 120 / 122) next to the stairs"""
    stairs = {A5 + v for v in (24, 25, 26, 27)}
    n = []
    for y in range(K.Hd):
        for x in range(K.Wd):
            t = K.at(0, x, y) - A5
            if t in (112, 120, 114, 122):
                nb = K.at(0, x - 1, y) if t in (112, 120) else K.at(0, x + 1, y)
                if nb in stairs:
                    K.put(0, x, y, A5 + (113 if t in (112, 114) else 121)); n.append((x, y))
    K.report.append("  lico przy schodach prosto (113/121): %s" % n)


def zbuduj(mid):
    K = Karta(mid)
    K.report.append("Map%03d" % mid)
    for h in HILLS.get(mid, []): wzgorze(K, h)
    box = [(h["old"][0] - 2, h["old"][1] - 2, h["old"][2] + 2, h["old"][3] + 2) for h in HILLS.get(mid, [])]
    if mid == 125:
        plot_nad_dachami(K); bramki_podworzy(K); zagroda_grunt(K)
    if mid == 13:
        linia_lasu(K); ciemne_plamy(K); lico_przy_schodach(K)
    zaokraglenie(K)
    drzewa_od_wody(K, box)
    return K, K.finish()


if __name__ == "__main__":
    ids = [int(a) for a in sys.argv[1:] if a.isdigit()] or [13, 125]
    os.makedirs(STG, exist_ok=True)
    for mid in ids:
        K, out = zbuduj(mid)
        for r in K.report: print(r)
        open(os.path.join(STG, "Map%03d.json" % mid), "wb").write(out)
        print("  zapisane: staging/data/Map%03d.json" % mid)
