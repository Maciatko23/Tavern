# -*- coding: utf-8 -*-
"""Automatyczne detektory przeglądu ekranów (tools/przeglad_ekranow/detektory.py). Nic nie zapisuje do data/ ani js/.

  python -I tools/przeglad_ekranow/detektory.py [mapy...]      -> tools/przeglad_ekranow/detektory.json  (lista trafień)

Trafienie: {mapa, x, y, w, h, kod, kat, opis, zrodlo:"auto", waga}. Bierze logikę z tools/mapy/kontrola.py (O1 G1 G2 G3 G5 D1 Z1 Z3),
tools/mapy/estetyka.py (b c f g h i j) i dokłada własne: płoty (luki, resztki, bramy bez słupków), obrazy na murach/dachach/płotach,
ozdoby na dachach, samotne rekwizyty na ścieżkach, uprawy tuż pod murem/płotem, cienie-bryły (Cienie.js: stały kafel + gwiazdki)
i kratki cienia warstwy 4, dwa grunty pod jednym obiektem, niewidzialne ściany."""
import os, sys, re, json, collections
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "mapy"))
sys.path.insert(0, os.path.join(ROOT, "tools", "krawedzie_poprawa"))
if "--staging" not in sys.argv and "--zywe" not in sys.argv: sys.argv.append("--zywe")
import numpy as np
import mapylib as L
import kontrola as K
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
T = L.T

NAZWY_KAT = {
    "O1": "ucięty obiekt", "G1": "gwiazdka nad wolną kratką (bohater pod obiektem)", "G2": "wysoki obiekt bez gwiazdki", "G3": "obraz wystaje na wolną kratkę",
    "G5": "zdarzenie nad postacią nad wolną kratką", "D1": "miejsce nieosiągalne", "Z1": "zdarzenia na jednej kratce", "Z3": "zdarzenie na kaflu blokującym",
    "PL1": "luka w płocie", "PL2": "resztka / samotny płot", "PL3": "brama bez słupków", "UP1": "uprawa tuż pod murem/płotem",
    "DA1": "ozdoba na dachu", "NA1": "obraz zdarzenia na murze/dachu/płocie", "NA2": "drzewo/krzak/skała na murze, dachu lub płocie", "SC1": "samotny rekwizyt na ścieżce",
    "CI1": "cień-bryła (stały kafel + gwiazdki)", "CI2": "kratka cienia warstwy 4 (twardy prostokąt)", "GR1": "dwa grunty pod jednym obiektem",
    "NI1": "niewidzialna ściana (blokuje, nic nie widać)", "NI2": "kratka regionu 2 na gołym gruncie", "GW1": "gwiazdka nad przejściem (chodzi pod niskim obiektem)",
    "ES-b": "ucięty/pojedynczy grunt", "ES-c": "drzewo z kafli bez gwiazdki", "ES-f": "wzgórze: zębata/dziurawa linia", "ES-g": "drzewo za blisko wody",
    "ES-h": "rama innego gruntu pod płotem/murem", "ES-i": "zaokrąglony koniec lica", "ES-j": "kanciasta/prostokątna plama gruntu",
}


def rodzaj(t): return (t - 2048) // 48 if t >= 2048 else None


FENCE = {22, 38}
PROP_RX = re.compile(r"^!\$?(Decoration|Town_Props|Tavern_Yard|Mt_Props|Quest_Places|Statue|Signs|Big_Decoration|Flags_banner|lamp|Tavern_Props)", re.I)
SKIP_OVERLAP = re.compile(r"(door|Roof_Windows|chimney|House_Town|Gate|Brama|Window|Mt_Blocks|Kopalnia|Latarnia|Palisada|Signs|Flags|lamp)", re.I)
GATE_RX = re.compile(r"(Gate|Brama)", re.I)
CROP_RX = re.compile(r"(crop|plant|wheat|potato|cabbage|carrot|field|garden|Yard|sprout|seed|rye|beet|onion)", re.I)
NATURE_RX = re.compile(r"^!?\$?(Rock|Bush|Tree|Pine|Stump|Trunk|Boulder|Big_Trees)", re.I)


def kind_grid(mp):
    """A3/A4 rodzaje jak w Cienie.js: 0 brak, R dach, W ściana, S bok, T blokujący szczyt, K szczyt przechodni"""
    n = mp.W * mp.H
    g = [[""] * mp.W for _ in range(mp.H)]
    for z in (0, 1):
        for y in range(mp.H):
            for x in range(mp.W):
                t = mp.t(z, x, y)
                if t < 4352 or t >= 8192: continue
                a = (t - 2048) // 48; lo = a % 16
                fl = mp.zest.flag(t)
                g[y][x] = ("R" if lo < 8 else "W") if t < 5888 else ("S" if lo >= 8 else ("T" if (fl & 15) == 15 else "K"))
    return g


def hit(out, mp, kod, x, y, opis, w=1, h=1, waga=2, zrodlo="auto"):
    out.append({"mapa": mp.id, "x": int(x), "y": int(y), "w": int(w), "h": int(h), "kod": kod, "kat": NAZWY_KAT.get(kod, kod), "opis": opis,
                "waga": waga, "zrodlo": zrodlo})


# ------------------------------------------------------------------------------------------------ kontrola.py
def z_kontroli(mp, out):
    k = K.Kontrola(mp)
    probs = k.run()
    wanted = {"O1": 3, "G1": 2, "G2": 2, "G3": 2, "G5": 1, "D1": 1, "Z1": 1, "Z3": 1}
    n = collections.Counter()
    for p in probs:
        if p["kod"] not in wanted: continue
        n[p["kod"]] += 1
        if p["kod"] == "D1" and n["D1"] > 12: continue
        hit(out, mp, p["kod"], p["x"], p["y"], p["opis"], waga=wanted[p["kod"]])
    return k


# ------------------------------------------------------------------------------------------------ estetyka.py
def z_estetyki(mp, out, E, sw):
    try:
        res = E.wszystkie(sw, mp, "bcfghij")
    except Exception as ex:
        return "estetyka: %s" % ex
    for t, lst in res.items():
        for (x, y, opis) in lst:
            hit(out, mp, "ES-" + t, x, y, opis, waga=1 if t in "bj" else 2)
    return None


# ------------------------------------------------------------------------------------------------ płoty
def fence_mask(mp):
    m = np.zeros((mp.H, mp.W), bool)
    for y in range(mp.H):
        for x in range(mp.W):
            if rodzaj(mp.t(1, x, y)) in FENCE or rodzaj(mp.t(0, x, y)) in FENCE: m[y, x] = True
    return m


def ev_fence_cells(mp):
    s = set()
    for e in mp.zd:
        if e.char and re.search(r"Palisada", e.char): s.add((e.x, e.y))
    return s


def plot(mp, out, kg):
    import lib
    m = fence_mask(mp)
    ev = ev_fence_cells(mp)
    gates = [e for e in mp.zd if e.char and GATE_RX.search(e.char) and "Slup" not in e.char]
    gate_cells = {(e.x, e.y) for e in gates}
    for e in mp.zd:
        if e.przenosi and (e.x, e.y) not in gate_cells and e.drzwi: gate_cells.add((e.x, e.y))
    wallish = lambda x, y: mp.inside(x, y) and (kg[y][x] in ("W", "S", "T", "R") or (x, y) in ev or m[y, x] or (x, y) in mp.ev_block() or (mp.t(0, x, y) // 48 and rodzaj(mp.t(0, x, y)) in (0, 1, 2, 3)))
    # luki: dwa końce płotu w jednym rzędzie/kolumnie, 1-2 kratki między
    seen = set()
    for y in range(mp.H):
        for x in range(mp.W):
            if not m[y, x]: continue
            for dx, dy in ((1, 0), (0, 1)):
                for gap in (1, 2):
                    x2, y2 = x + dx * (gap + 1), y + dy * (gap + 1)
                    if not mp.inside(x2, y2) or not m[y2, x2]: continue
                    mid = [(x + dx * i, y + dy * i) for i in range(1, gap + 1)]
                    if any(m[cy, cx] for cx, cy in mid): continue
                    if any(c in gate_cells or any((c[0] + a, c[1] + b) in gate_cells for a in (-1, 0, 1) for b in (-1, 0, 1)) for c in mid): continue
                    if any(not mp.inside(*c) or kg[c[1]][c[0]] for c in mid): continue
                    key = (mid[0], dx)
                    if key in seen: continue
                    seen.add(key)
                    # płot musi biec w tej samej osi (końce są częścią linii): sąsiad poza luką w osi
                    hit(out, mp, "PL1", mid[0][0], mid[0][1], "luka %d kratki w płocie (%d,%d)-(%d,%d)" % (gap, x, y, x2, y2), w=abs(x2 - x) + 1 if dy == 0 else 1, h=abs(y2 - y) + 1 if dx == 0 else 1,
                        waga=3 if gap == 1 else 2)
    # resztki: składowe małe
    comps = lib.skladowe(m)
    for c in comps:
        xs = [q[0] for q in c]; ys = [q[1] for q in c]
        x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
        near_wall = any(wallish(a, b) and not m[b, a] for (x, y) in c for a, b in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)) if mp.inside(a, b) and (kg[b][a] or (a, b) in ev))
        if len(c) <= 2 and not near_wall:
            hit(out, mp, "PL2", x0, y0, "resztka płotu (%d kratki) niezwiązana z linią ani murem" % len(c), w=x1 - x0 + 1, h=y1 - y0 + 1, waga=3 if len(c) == 1 else 2)
        elif len(c) <= 5 and (x1 - x0 + 1 <= 1 or y1 - y0 + 1 <= 1) and not near_wall:
            hit(out, mp, "PL2", x0, y0, "krótki samotny płot (%d kratek w linii)" % len(c), w=x1 - x0 + 1, h=y1 - y0 + 1, waga=2)
    # palisady zdarzeniowe samotne (segmenty co 1-3 kratki liczą się jako jedna linia)
    evl = [c for c in ev if mp.inside(*c)]
    if evl:
        par = {c: c for c in evl}
        def fd(a):
            while par[a] != a: par[a] = par[par[a]]; a = par[a]
            return a
        for a in evl:
            for b in evl:
                if a < b and abs(a[0] - b[0]) <= 3 and abs(a[1] - b[1]) <= 3: par[fd(a)] = fd(b)
        groups = collections.defaultdict(list)
        for c in evl: groups[fd(c)].append(c)
        for g in groups.values():
            if len(g) <= 2:
                xs = [q[0] for q in g]; ys = [q[1] for q in g]
                hit(out, mp, "PL2", min(xs), min(ys), "samotna palisada (%d segmenty)" % len(g), w=max(xs) - min(xs) + 1, h=max(ys) - min(ys) + 1, waga=2)
    # bramy bez słupków: po obu stronach bramy (w osi muru) ma stać płot/mur/słupek/zdarzenie blokujące
    for e in gates:
        cells = e.komorki() if e.occupy else [(e.x, e.y)]
        xs = [c[0] for c in cells]; ys = [c[1] for c in cells]
        x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
        horiz = (x1 - x0) >= (y1 - y0)
        sides = [(x0 - 1, y1), (x1 + 1, y1)] if horiz else [(x1, y0 - 1), (x1, y1 + 1)]
        side_solid = []
        for (a, b) in sides:
            ok = mp.inside(a, b) and (m[b, a] or kg[b][a] in ("W", "S", "T") or (a, b) in ev or (a, b) in mp.ev_block() or any(m[b + d, a] for d in (-1, 1) if mp.inside(a, b + d)) or any(m[b, a + d] for d in (-1, 1) if mp.inside(a + d, b)))
            side_solid.append(ok)
        slups = [q for q in mp.zd if q.char and "Slup" in q.char and abs(q.x - e.x) <= 3 and abs(q.y - e.y) <= 3]
        if not all(side_solid) and len(slups) < 2:
            hit(out, mp, "PL3", x0, y0, "brama '%s' bez słupków/płotu po %s stronie" % (e.char, "obu" if not any(side_solid) else "jednej"), w=x1 - x0 + 1, h=y1 - y0 + 1, waga=2)
    return m


# ------------------------------------------------------------------------------------------------ obrazy zdarzeń vs ściany/dachy/płoty
def zdarzenia_na_scianach(mp, out, kg, fm):
    zest = mp.zest
    for e in mp.zd:
        if not e.widoczne or not e.char: continue
        if SKIP_OVERLAP.search(e.char): continue
        if not e.char.startswith("!"): continue
        mk = e.maska(zest, 120)
        if not mk: continue
        a, x0, y0 = mk
        ys, xs = np.where(a)
        if not len(xs): continue
        cx0, cx1 = (x0 + xs.min()) // T, (x0 + xs.max()) // T
        cy0, cy1 = (y0 + ys.min()) // T, (y0 + ys.max()) // T
        bad = {}
        own = set(e.komorki())
        for cy in range(cy0, cy1 + 1):
            for cx in range(cx0, cx1 + 1):
                if not mp.inside(cx, cy) or (cx, cy) in own and e.occupy: continue
                kind = kg[cy][cx]
                what = {"R": "dach", "W": "ścianę", "S": "ścianę", "T": "mur/skałę"}.get(kind)
                if not what and fm[cy, cx]: what = "płot"
                if not what: continue
                # ile pikseli obrazu leży w tej kratce
                sub = a[max(0, cy * T - y0):max(0, (cy + 1) * T - y0), max(0, cx * T - x0):max(0, (cx + 1) * T - x0)]
                n = int(sub.sum()) if sub.size else 0
                if n >= 220: bad[(cx, cy)] = (what, n)
        if not bad: continue
        # obiekt stojący na własnej kratce, która nie jest ścianą (obraz tylko zachodzi): licz zachodzenie
        whats = collections.Counter(v[0] for v in bad.values())
        w, n = whats.most_common(1)[0]
        cell = next(c for c, v in bad.items() if v[0] == w)
        nat = bool(NATURE_RX.match(e.char)) or e.natura
        kod = "NA2" if nat else "NA1"
        hit(out, mp, kod, cell[0], cell[1], "'%s' (zdarzenie %d w %d,%d) zachodzi na %s (%d kratek, %d px)" % (e.char, e.id, e.x, e.y, w, len(bad), sum(v[1] for v in bad.values())),
            waga=3 if len(bad) >= 3 else 2)


def ozdoby_na_dachach(mp, out, kg):
    zest = mp.zest
    for y in range(mp.H):
        for x in range(mp.W):
            if kg[y][x] != "R": continue
            for z in (2, 3):
                t = mp.t(z, x, y)
                if t and t < 1024 and not zest.gwiazdka(t) and not zest.pusty(t):
                    hit(out, mp, "DA1", x, y, "kafel ozdobny %d na dachu (warstwa %d), nie gwiazdka" % (t, z), waga=2)
    for e in mp.zd:
        if not e.widoczne or not e.char: continue
        if not (PROP_RX.match(e.char) or NATURE_RX.match(e.char)): continue
        if e.char and re.search(r"Flags|Signs|lamp", e.char, re.I) and False: continue
        for (cx, cy) in (e.komorki() if e.occupy else [(e.x, e.y)]):
            if mp.inside(cx, cy) and kg[cy][cx] in ("R", "T", "W") and not mp.zest.pusty(0):
                hit(out, mp, "DA1", cx, cy, "rekwizyt '%s' (zdarzenie %d) stoi na %s" % (e.char, e.id, {"R": "dachu", "T": "szczycie muru", "W": "ścianie"}[kg[cy][cx]]), waga=3 if kg[cy][cx] == "R" else 2)
                break


def uprawy_pod_murem(mp, out, kg, fm):
    for e in mp.zd:
        if not e.widoczne: continue
        nm = (e.char or "") + " " + e.name
        if not CROP_RX.search(nm) or re.search(r"Tavern_Yard", nm) and False: continue
        y = e.y - 1
        for dy in (1, 0):
            yy = e.y - dy
        for yy in (e.y - 1,):
            if mp.inside(e.x, yy) and (kg[yy][e.x] in ("R", "W", "S", "T") or fm[yy, e.x]):
                hit(out, mp, "UP1", e.x, e.y, "uprawa/roślina '%s' (zdarzenie %d) w pierwszym rzędzie pod murem/dachem/płotem" % (e.char or e.name, e.id), waga=2)


def samotne_rekwizyty(mp, out, kg, fm):
    """rekwizyt zdarzeniowy na ścieżce (A2 17 / 25 / 19) bez żadnego sąsiada w promieniu 3"""
    if mp.wnetrze: return
    objs = [(e.x, e.y) for e in mp.zd if e.widoczne and e.obiekt]
    for e in mp.zd:
        if not e.widoczne or not e.char or not PROP_RX.match(e.char): continue
        if re.search(r"Quest_Places|Statue|Signs|lamp|Flags|Tavern_Yard", e.char, re.I): continue
        k = rodzaj(mp.t(0, e.x, e.y))
        if k not in (17, 19, 25, 59): continue
        near = sum(1 for (a, b) in objs if (a, b) != (e.x, e.y) and abs(a - e.x) <= 3 and abs(b - e.y) <= 3)
        near += sum(1 for dy in range(-3, 4) for dx in range(-3, 4) if mp.inside(e.x + dx, e.y + dy) and (kg[e.y + dy][e.x + dx] or fm[e.y + dy, e.x + dx]))
        if near == 0:
            hit(out, mp, "SC1", e.x, e.y, "rekwizyt '%s' (zdarzenie %d) sam na ścieżce, nic w promieniu 3 kratek" % (e.char, e.id), waga=2)


# ------------------------------------------------------------------------------------------------ cienie
def cienie(mp, out, kg):
    if mp.wnetrze: return
    # warstwa 4: kratki cienia
    n = mp.W * mp.H
    cells = np.zeros((mp.H, mp.W), bool)
    for y in range(mp.H):
        for x in range(mp.W):
            if mp.t(4, x, y) & 15: cells[y, x] = True
    import lib
    if cells.any():
        for c in lib.skladowe(cells):
            xs = [q[0] for q in c]; ys = [q[1] for q in c]
            hit(out, mp, "CI2", min(xs), min(ys), "kratki cienia (warstwa 4) %d szt. - twardy prostokąt" % len(c), w=max(xs) - min(xs) + 1, h=max(ys) - min(ys) + 1, waga=3 if len(c) >= 3 else 2)
    # stały kafel B-E + gwiazdki nad nim, nie budynek (reguła Cienie.js "things")
    zest = mp.zest
    flags = zest.flags
    def topBE(x, y):
        for z in (3, 2):
            t = mp.t(z, x, y)
            if 0 < t < 1024: return t
        return 0
    things = []
    for y in range(mp.H):
        for x in range(mp.W):
            if kg[y][x]: continue
            t = topBE(x, y)
            if not t or (flags[t] & 0x10) or (flags[t] & 15) != 15: continue
            ids = [t]
            for k in range(1, 5):
                if y - k < 0: break
                u = topBE(x, y - k)
                if not u or not (flags[u] & 0x10) or kg[y - k][x]: break
                ids.insert(0, u)
            if len(ids) >= 2: things.append((x, y, len(ids)))
    # sklej sąsiadów (rzędy płotów/skrzyń = jedna długa bryła)
    grid = np.zeros((mp.H, mp.W), bool)
    for x, y, h in things: grid[y, x] = True
    if grid.any():
        for c in lib.skladowe(grid):
            if len(c) >= 3:
                xs = [q[0] for q in c]; ys = [q[1] for q in c]
                hit(out, mp, "CI1", min(xs), min(ys), "bryła-cień Cienie.js: %d stałych kafli z gwiazdkami nad sobą (szeroka ciemna płyta cienia)" % len(c), w=max(xs) - min(xs) + 1, h=max(ys) - min(ys) + 1, waga=1)


# ------------------------------------------------------------------------------------------------ gruntu dwa tony pod jednym obiektem
def dwa_grunty(mp, out, kg, fm):
    import lib
    if mp.wnetrze: return
    def g0(x, y):
        t = mp.t(0, x, y); k = rodzaj(t)
        return k if k is not None else ("A5" if t else 0)
    TRAWY = {16, 17, 24, 25, 26, 27}
    # prostokąty płotów (zamknięty pierścień: składowa z bbox >= 5x4 i >= 60% obwodu)
    for c in lib.skladowe(fm):
        xs = [q[0] for q in c]; ys = [q[1] for q in c]
        x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
        if x1 - x0 < 4 or y1 - y0 < 3: continue
        per = 2 * ((x1 - x0 + 1) + (y1 - y0 + 1)) - 4
        if len(c) < 0.6 * per: continue
        cnt = collections.Counter()
        for y in range(y0 + 1, y1):
            for x in range(x0 + 1, x1):
                if not fm[y, x]: cnt[g0(x, y)] += 1
        tot = sum(cnt.values()) or 1
        big = [(k, v) for k, v in cnt.most_common(3) if v / tot >= 0.15]
        if len(big) >= 2:
            hit(out, mp, "GR1", x0, y0, "ogrodzony prostokąt %dx%d ma w środku dwa grunty: %s" % (x1 - x0 + 1, y1 - y0 + 1, ", ".join("%s:%d%%" % (k, 100 * v // tot) for k, v in big)), w=x1 - x0 + 1, h=y1 - y0 + 1, waga=2)
    # podwórka / pola: zdarzenia Tavern_Yard i uprawy - grunt zmienia się w obrębie ich pola
    for e in mp.zd:
        if not (e.char and re.search(r"Tavern_Yard|Yard", e.char)): continue
        cells = e.komorki() if e.occupy else [(e.x, e.y)]
        xs = [c[0] for c in cells]; ys = [c[1] for c in cells]
        if len(cells) < 6: continue
        cnt = collections.Counter(g0(*c) for c in cells if mp.inside(*c))
        tot = sum(cnt.values()) or 1
        big = [(k, v) for k, v in cnt.most_common(3) if v / tot >= 0.2]
        if len(big) >= 2:
            hit(out, mp, "GR1", min(xs), min(ys), "podwórko '%s' (zdarzenie %d): grunt zmienia się pod nim: %s" % (e.char, e.id, ", ".join("%s:%d%%" % (k, 100 * v // tot) for k, v in big)), w=max(xs) - min(xs) + 1, h=max(ys) - min(ys) + 1, waga=2)


# ------------------------------------------------------------------------------------------------ niewidzialne ściany
def niewidzialne(mp, out, kg):
    zest = mp.zest
    # (1) region 2 na gołym gruncie
    reg = np.zeros((mp.H, mp.W), bool)
    for y in range(mp.H):
        for x in range(mp.W):
            if mp.region(x, y) != 2: continue
            top = [t for z in (3, 2) for t in [mp.t(z, x, y)] if t]
            wallish = kg[y][x] in ("W", "S", "T", "R") or any(not zest.pusty(t) for t in top)
            ev = (x, y) in mp.ev_block()
            if not wallish and not ev and not mp.sciana(x, y): reg[y, x] = True
    import lib
    if reg.any():
        for c in lib.skladowe(reg):
            xs = [q[0] for q in c]; ys = [q[1] for q in c]
            hit(out, mp, "NI2", min(xs), min(ys), "region 2 (zawsze blokuje) na gołym gruncie, %d kratek - nic go nie pokazuje" % len(c), w=max(xs) - min(xs) + 1, h=max(ys) - min(ys) + 1, waga=2)
    # (2) blokujące zdarzenie, którego obraz prawie nie pokrywa jego kratek
    for e in mp.zd:
        if not e.blokuje or not e.widoczne: continue
        mk = e.maska(zest, 40)
        cells = e.komorki_blokujace()
        if len(cells) > 60: continue
        empty = []
        for (cx, cy) in cells:
            if mk is None: empty.append((cx, cy)); continue
            a, x0, y0 = mk
            sub = a[max(0, cy * T - y0):max(0, (cy + 1) * T - y0), max(0, cx * T - x0):max(0, (cx + 1) * T - x0)]
            if sub.size == 0 or sub.mean() < 0.04: empty.append((cx, cy))
        # tylko kratki, w których stoi tylko zdarzenie (tła kafla pod nimi nic nie pokazuje)
        empty = [c for c in empty if not zest.pusty(mp.t(0, *c)) or True]
        if empty and len(empty) >= max(1, len(cells) // 3) and not e.drzwi and not e.postac:
            hit(out, mp, "NI1", empty[0][0], empty[0][1], "zdarzenie %d '%s' blokuje %d kratek, w których jego obraz jest pusty (np. %d,%d)" % (e.id, e.char or e.name, len(empty), empty[0][0], empty[0][1]), waga=2)
    # (3) blokujący kafel B-E prawie przezroczysty
    for y in range(mp.H):
        for x in range(mp.W):
            for z in (3, 2):
                t = mp.t(z, x, y)
                if 0 < t < 1024 and (zest.flag(t) & 15) == 15 and not (zest.flag(t) & 0x10) and zest.pokrycie(t) < 0.02:
                    hit(out, mp, "NI1", x, y, "kafel %d (warstwa %d) blokuje przejście, a jest niewidoczny" % (t, z), waga=2)


def cienie_w4(mp, out):
    import lib
    cells = np.zeros((mp.H, mp.W), bool)
    for y in range(mp.H):
        for x in range(mp.W):
            if mp.t(4, x, y) & 15: cells[y, x] = True
    if cells.any():
        for c in lib.skladowe(cells):
            xs = [q[0] for q in c]; ys = [q[1] for q in c]
            hit(out, mp, "CI2", min(xs), min(ys), "kratki cienia (warstwa 4) %d szt." % len(c), w=max(xs) - min(xs) + 1, h=max(ys) - min(ys) + 1, waga=2)


def gwiazdki_przechodnie(mp, out):
    pass


# ------------------------------------------------------------------------------------------------ main
def przetworz(mid, E, sw):
    mp = sw.M.get(mid) if sw and mid in sw.M else L.Mapa(mid)
    out = []
    err = []
    kg = kind_grid(mp)
    try: z_kontroli(mp, out)
    except Exception as ex: err.append("kontrola: %r" % ex)
    if E and mp.tsid in (9, 11):
        e2 = z_estetyki(mp, out, E, sw) if sw and mid in sw.M else None
        if e2: err.append(e2)
    fm = fence_mask(mp)
    if mp.tsid not in (9, 11):          # wnętrza i kopalnia: dachy, płoty i cienie słońca nie mają sensu, zostaje kontrola.py i niewidzialne ściany
        for f, args in ((niewidzialne, (kg,)),) + (((cienie_w4, ()),) if mp.id == 213 else ()):
            try: f(mp, out, *args)
            except Exception as ex: err.append("%s: %r" % (f.__name__, ex))
        return out, err
    for f, args in ((plot, (kg,)), (zdarzenia_na_scianach, (kg, fm)), (ozdoby_na_dachach, (kg,)), (uprawy_pod_murem, (kg, fm)), (samotne_rekwizyty, (kg, fm)),
                    (cienie, (kg,)), (dwa_grunty, (kg, fm)), (niewidzialne, (kg,))):
        try: f(mp, out, *args)
        except Exception as ex:
            import traceback; err.append("%s: %r %s" % (f.__name__, ex, traceback.format_exc().splitlines()[-3:]))
    return out, err


def main(argv):
    ids = [int(a) for a in argv if a.isdigit()] or [3, 4, 8, 13, 20, 24, 111, 125, 162, 120, 121, 122, 123, 124, 168, 169, 175, 213, 1,
                                                    104, 178, 179, 182, 188, 183, 102, 103, 109, 110, 184, 105, 107, 106, 180, 185, 186, 187, 181, 189, 190, 193, 194, 108, 118, 119, 195, 196, 197, 198]
    E = sw = None
    try:
        import estetyka as E_
        import swiat_styki as S
        E = E_; sw = S.Swiat()
    except Exception as ex:
        print("estetyka niedostępna:", ex)
    allh = []
    for mid in ids:
        h, err = przetworz(mid, E, sw)
        c = collections.Counter(x["kod"] for x in h)
        print("Map%03d: %d trafień %s %s" % (mid, len(h), dict(c), ("BŁĘDY: " + "; ".join(err)) if err else ""))
        allh += h
    json.dump(allh, open(os.path.join(HERE, "detektory.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("razem", len(allh))


if __name__ == "__main__":
    main(sys.argv[1:])
