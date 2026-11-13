# -*- coding: utf-8 -*-
"""Step 5, Map125 'Przystan' (fishing harbour): landscape on the empty meadow x26-62, y38-76.
  python tools/poprawki_krok5/mapy/125/plan_125.py   ->  tools/poprawki_krok5/mapy/125/staging/data/Map125.json
Zones: vegetable strips by the street, a track from the fishermen's street, a fenced goat/sheep pasture with a haystack, a wind-bent
copse near the shore with a clearing, boulders + dry bushes towards the shore, flowers / pebbles / ferns in groups."""
import os, sys, json, math, random
_ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "..", ".."))
sys.path.insert(0, os.path.join(_ROOT, "tools", "poprawki_krok5"))
import krajobraz as KR
from krajobraz import *
HERE = os.path.dirname(os.path.abspath(__file__))
KR.STG = os.environ.get("PLAN_OUT") or os.path.join(HERE, "staging", "data")

K = Krajobraz(125)
n0 = K.liczba()
# templates not on this map: copy from Map004 (pilot)
_m4 = json.load(open(os.path.join(ROOT, "data", "Map004.json"), encoding="utf-8"))
for e in _m4["events"]:
    if not e: continue
    im = e["pages"][0]["image"]
    K.wzory.setdefault((im["characterName"], im["tileId"], e["name"]), e)
rng = random.Random(1125)


def wzor_gr(grafika):
    return next(e for e in K.wzory.values() if e["pages"][0]["image"]["characterName"] == grafika)
def wzor_kl(k_):
    return next(e for e in K.wzory.values() if klasa(e) == k_)
def new(grafika, x, y):
    return K.zdarzenie_z(wzor_gr(grafika), x, y)
def region(x, y, v=2):
    K.s(5, x, y, v)

# cells that gameplay needs free (patrol stops, entry)
ZAKAZ = set()
for (x, y) in [(60, 70), (55, 84)]:
    ZAKAZ |= {(x + a, y + b) for a in range(-3, 4) for b in range(-3, 4)}
SZ = set()          # everything built: tracks, pen, strips (events and decor keep out)

def ground_clean(cells, kind=16):
    for (x, y) in cells:
        if K.kind(0, x, y) in (17, 27, 16): K.ground(x, y, kind)
        if K.g(1, x, y) and K.kind(1, x, y) in (21, 39, 28, 29): K.over(x, y, 0)

# the two bare old dirt patches left of the track (34-38 x 52-57 and 41-43 x 47-49) go back to grass: the track + the boulder group take their place
for (x0, y0, x1, y1) in [(32, 50, 40, 59), (40, 46, 44, 51), (39, 67, 51, 72)]:
    for x in range(x0, x1 + 1):
        for y in range(y0, y1 + 1):
            if K.kind(0, x, y) == 17: K.ground(x, y, 16)

# the old 2 x 5 rectangle of tall grass (34-35 x 58-62) becomes a round tuft patch; two more soft patches in the open meadow
for (x, y) in [(x, y) for x in (34, 35) for y in range(58, 63)]: K.over(x, y, 0)
TUFT = [(35.0, 60.6, 1.7, 2.3, 131), (57.5, 67.0, 2.8, 1.9, 132), (59.5, 52.5, 2.2, 1.6, 133), (47.5, 36.8, 3.0, 1.3, 134)]

def reshape_earth(box, xmax, sigma=1.3, comp_from=None):
    """rounds an old blocky dirt patch: the earth cells in box (connected to comp_from, when given) are smoothed; only cells with x <= xmax change"""
    x0, y0, x1, y1 = box
    S = {(x, y) for x in range(x0, x1 + 1) for y in range(y0, y1 + 1) if K.kind(0, x, y) == 17}
    if comp_from:
        comp, st = set(), [comp_from]
        while st:
            c = st.pop()
            if c in comp or c not in S: continue
            comp.add(c); st += [(c[0] + 1, c[1]), (c[0] - 1, c[1]), (c[0], c[1] + 1), (c[0], c[1] - 1)]
        S = comp
    new = K.lam(K.okraglij(K.gladko(S), sigma))
    new = {c for c in new if K.in_(*c)}
    for c in S - new:
        if c[0] <= xmax: K.ground(c[0], c[1], 16)
    for c in new - S:
        if c[0] <= xmax and K.kind(0, c[0], c[1]) in (16, 27) and not K.g(1, c[0], c[1]): K.ground(c[0], c[1], 17)
reshape_earth((31, 38, 40, 46), 99, 1.3, comp_from=(35, 42))          # the 5 x 3 dirt box under the big pines (33-37 x 41-43)
reshape_earth((56, 66, 66, 77), 63, 1.4, comp_from=(60, 72))           # the straight left arm of the big dirt patch east of the copse

# the old blocky grey stone-ground patches (A2 47 on layer 1) in the meadow: re-made round (the thin ones, and those in the pen, go)
def reshape_stone(box=(24, 38, 62, 76)):
    x0, y0, x1, y1 = box
    S = {(x, y) for x in range(x0, x1 + 1) for y in range(y0, y1 + 1) if K.kind(1, x, y) == 47}
    seen = set()
    for c in sorted(S):
        if c in seen: continue
        comp, st = set(), [c]
        while st:
            a = st.pop()
            if a in comp or a not in S: continue
            comp.add(a); st += [(a[0] + i, a[1] + j) for i in (-1, 0, 1) for j in (-1, 0, 1)]
        seen |= comp
        for a in comp: K.over(a[0], a[1], 0)
        cx = sum(a[0] for a in comp) / len(comp); cy = sum(a[1] for a in comp) / len(comp)
        inpen = 38 <= cx <= 49 and 59 <= cy <= 69
        if len(comp) < 5 or inpen: continue
        r = math.sqrt(len(comp) / math.pi)
        for a in K.blob(cx, cy, r * 1.05, r * 0.9, int(cx * 3 + cy), 0.2):
            if K.kind(0, *a) in (16, 27) and not K.g(1, *a): K.over(a[0], a[1], 47)
reshape_stone()

# ------------------------------------------------------------------ 1. the track from the fishermen's street (spur 59-61 x 34-37) to the pasture gate
A_PTS = [(60.0, 36.4), (59.4, 40.0), (57.6, 44.0), (54.4, 47.6), (50.2, 50.4), (46.2, 53.0), (42.8, 55.4), (41.6, 57.4), (41.6, 59.4)]
M_A = K.droga_maska(A_PTS, 2.7, seed=31, szum=0.12) | K.blob(41.8, 57.0, 2.0, 1.6, 32, 0.18)
for (x, y) in M_A:
    K.ground(x, y, 17)
    if K.g(1, x, y): K.over(x, y, 0)
SZ |= M_A

# ------------------------------------------------------------------ 2. the pasture (fenced, gate in the north fence)
PAST = (38, 59, 49, 66)
GATE = [(41, 59), (42, 59)]
mask_p = {(x, y) for x in range(PAST[0] - 1, PAST[2] + 2) for y in range(PAST[1] - 1, PAST[3] + 2)}
K.zejdz_z(mask_p - M_A)
for (x, y) in mask_p:
    if K.kind(1, x, y) in (21, 39, 28, 29, 31, 36): K.over(x, y, 0)
# inside and under the fence: all grass first (the old dirt patch 40-49 x 63-69 is re-made as a trampled yard round the hay)
for x in range(PAST[0], PAST[2] + 1):
    for y in range(PAST[1], PAST[3] + 1):
        if (x, y) not in M_A or y > PAST[1]: K.ground(x, y, 16)
K.plot(*PAST, bramy=GATE)
GM = os.environ.get("GATE_MODE", "A")
for x_, t_ in ((40, 209), (43, 208)):               # gate posts for a horizontal run: B209 = post on the right edge (left of the gap), B208 = on the left edge
    if GM == "B": K.over(x_, PAST[1], 0)
    if GM in ("A", "B"): K.kafel(x_, PAST[1], t_, z=3)
for (x, y) in GATE: K.ground(x, y, 17)
yard = K.blob(44.6, 64.6, 3.5, 2.3, 41, 0.2)
K.plama({c for c in yard if PAST[0] < c[0] < PAST[2] and PAST[1] < c[1] < PAST[3]}, 17, 0)
K.plama({c for c in K.blob(41.5, 66.8, 3.0, 2.0, 42, 0.25) if PAST[0] < c[0] < PAST[2] and PAST[1] < c[1] < PAST[3]} - yard, 27, 0, tylko_na={16})
SZ |= {(x, y) for x in range(PAST[0], PAST[2] + 1) for y in range(PAST[1], PAST[3] + 1)}
# the haystack (3 x 3 of the town's tiles): top over the hero, body solid, straw at its foot
def haystack(x, y):
    for i, t in enumerate((213, 214, 215)): K.kafel(x + i, y, 256 + t, 3)
    for i, t in enumerate((221, 222, 223)): K.kafel(x + i, y + 1, 256 + t, 3)
    # the solid middle tile (C478, flag X) goes one layer down under a blank star tile (B751): Cienie.js takes a solid tile with a star above it
    # for a crate and throws a hard box shadow below it - the dark rectangle under the stack. Walking is still blocked by C478.
    K.kafel(x + 1, y + 1, 256 + 222, 2); K.kafel(x + 1, y + 1, 751, 3)
    pass   # (no loose straw row below: the body tiles carry the straw at the foot)
haystack(45, 61)
new("!$Rock_Flat", 41, 64)

# ------------------------------------------------------------------ 3. vegetable strips by the street (NW of the track)
BEDS = [277, 278, 279, 285, 286, 287]
def pasek(x0, x1, yf, seed):
    r = random.Random(seed); prev = -1
    for x in range(x0, x1 + 1):
        K.ground(x, yf, 16); K.ground(x, yf + 1, 16)
        if K.g(1, x, yf): K.over(x, yf, 0)
        if K.g(1, x, yf + 1): K.over(x, yf + 1, 0)
        K.kafel(x, yf, 712 if x == x0 else 714 if x == x1 else 713, 2)
        b = r.choice([v for v in range(6) if v != prev]); prev = b
        K.kafel(x, yf + 1, BEDS[b], 2)
STRIPS = [(45, 51, 39, 51), (53, 56, 40, 52), (46, 52, 42, 53), (44, 50, 45, 54)]
for (x0, x1, yf, sd) in STRIPS:
    for (x, y) in [(x, y) for x in range(x0, x1 + 1) for y in (yf, yf + 1)]:
        SZ.add((x, y))
K.zejdz_z({(x, y) for (x0, x1, yf, _) in STRIPS for x in range(x0 - 1, x1 + 2) for y in range(yf - 1, yf + 3)} | {(54, 43), (54, 44)})
for (x0, x1, yf, sd) in STRIPS: pasek(x0, x1, yf, sd)
K.kafel(54, 43, 336, 3); K.kafel(54, 44, 344, 2); SZ |= {(54, 43), (54, 44)}          # a scarecrow in the corner of the strips

# ------------------------------------------------------------------ 4. copse near the shore, bent inland (long axis to the NE), clearing at the end of a footpath
C_PTS = [(29.6, 65.0), (32.4, 66.6), (35.0, 68.8), (36.4, 71.0), (36.6, 72.6)]
M_C = K.droga_maska(C_PTS, 2.3, seed=51, szum=0.12, zwez_koniec=0.2) | K.blob(36.6, 72.9, 2.5, 1.7, 52, 0.18)
for (x, y) in M_C:
    if (x, y) not in SZ and K.kind(0, x, y) in (16, 27, 17): K.ground(x, y, 17)
    if K.g(1, x, y): K.over(x, y, 0)
SZ |= M_C
KAT = math.radians(-14)
def f_copse(x, y, cx=35.2, cy=73.4, rx=7.8, ry=3.4):
    dx, dy = x - cx, y - cy
    u = (dx * math.cos(KAT) + dy * math.sin(KAT)) / rx; v = (-dx * math.sin(KAT) + dy * math.cos(KAT)) / ry
    r = math.hypot(u, v) * (1 + 0.3 * (K.fbm(x, y, 61, 3.5) - 0.5) * 2)
    return max(0.0, 1 - r) ** 0.6
def clearing(x, y):
    return math.hypot((x - 36.6) / 2.6, (y - 72.9) / 1.9) < 1.0
f_cp = lambda x, y: 0.0 if clearing(x, y) else f_copse(x, y)
# darker ground under the copse
Mcp = {(x, y) for x in range(26, 44) for y in range(64, 80) if f_copse(x, y) + (K.fbm(x, y, 62, 3.0) - 0.5) * 0.3 > 0.22}
Mcp = {c for c in Mcp if not (c[0] >= 35 and c[1] <= 71) and not (c[0] >= 41 and c[1] <= 73)}      # (keep clear of the pen's south fence: no flat cut there)
Mcp = K.lam(K.okraglij(K.gladko(Mcp), 1.5))
K.plama(Mcp - SZ, 27, 0, tylko_na={16})
road = {(x, y) for x in range(20, 44) for y in range(60, 82) if K.kind(0, x, y) == 17}
zak_c = set(ZAKAZ) | road | SZ | {(x, y) for x in range(36, 52) for y in range(70, 74)}
def tree(k_, x, y): return K.zdarzenie_z(wzor_gr(TYP_GRAFIKA[k_]), x, y)
trees = ["sosnaB", "sosnaC", "male"]
placed = K.sadz([next(e for e in K.wzory.values() if e["pages"][0]["image"]["characterName"] == TYP_GRAFIKA[k_] and "Tree" in e["note"]) for k_ in trees],
                f_cp, 63, min_d=2.1, occ=K.zajete(), zakazane=zak_c, bbox=(28, 66, 43, 77), kol_dy=0, prog=0.12)
K.przenies(140, 37, 54)

# ------------------------------------------------------------------ 4b. hay meadow: two haystacks by the old dirt clearing (51-57 x 58-63)
HAY = [(52, 55), (58, 60)]
K.zejdz_z({(x, y) for (hx, hy) in HAY for x in range(hx - 1, hx + 4) for y in range(hy - 1, hy + 4)})
for (hx, hy) in HAY:
    for x in range(hx, hx + 3):
        for y in range(hy, hy + 3):
            if K.g(1, x, y): K.over(x, y, 0)
            if K.kind(0, x, y) == 27: K.ground(x, y, 16)
    haystack(hx, hy)
    SZ |= {(x, y) for x in range(hx - 1, hx + 4) for y in range(hy, hy + 4)}

# ------------------------------------------------------------------ 5. boulders + dry bushes towards the shore (NW), a dead tree as the landmark
for (g, x, y) in [("!$Rock_Huge", 31, 49), ("!$Rock_Twin", 34, 51), ("!$Trunk_Dead", 33, 47)]:
    new(g, x, y)
for (g, x, y) in [("!$Bush_Bare_Thicket", 36, 48)]:
    new(g, x, y)
K.plama(K.blob(31.8, 50.2, 4.8, 3.2, 71, 0.3) - SZ, 27, 0, tylko_na={16})
SZ |= {(x, y) for x in range(28, 36) for y in range(46, 54)}

# ------------------------------------------------------------------ 6. detail tiles: flowers in groups, pebbles in clusters, ferns, soft dark patches
rodz_kw = lambda r: KWIATY[r.choice(list(KWIATY))]
box = (27, 38, 62, 76)
f_all = lambda x, y: 1.0
Mpool = SZ | ZAKAZ | {(x, y) for x in range(26, 31) for y in range(38, 80)}
K.dekor(f_all, rodz_kw, 14, 81, box, occ=K.zajete(), zakazane=Mpool, ile=(3, 4), promien=1.5, odstep=4.4)
K.dekor(f_all, [KAMYKI], 7, 82, box, occ=K.zajete(), zakazane=Mpool, ile=(1, 2), promien=1.2, odstep=5.5)
K.dekor(lambda x, y: f_copse(x, y) + 0.05, [PAPROCIE], 12, 83, (28, 65, 42, 77), occ=K.zajete(), zakazane=Mpool, ile=(1, 2), promien=1.3, odstep=2.0)
for i, (cx_, cy_, rx_, ry_) in enumerate([(55.5, 52.5, 4.5, 3.0), (52, 72, 5, 3.2), (59, 47.5, 3.2, 2.2), (35, 41.5, 3.4, 2.2), (47, 56, 3.5, 2.2)]):
    K.plama(K.blob(cx_, cy_, rx_, ry_, 90 + i, 0.32) - SZ, 27, 0, tylko_na={16})

for (cx_, cy_, rx_, ry_, sd_) in TUFT:
    for (x, y) in K.blob(cx_, cy_, rx_, ry_, sd_, 0.3):
        if (x, y) not in SZ and K.kind(0, x, y) == 16 and not K.g(1, x, y) and (x, y) not in ZAKAZ: K.over(x, y, 21)

K.usun(320)                                                   # (the thicket the pen pushed into the copse: dropped, the copse is thinned)
K.przenies(314, 36, 64); K.przenies(333, 54, 69); K.przenies(309, 56, 66)           # (the two bushes that could not leave the pen on their own)

# ------------------------------------------------------------------ last look: nothing tall on the fence, behind a tall stump, or touching another tree
def _img(e): return e["pages"][0]["image"]["characterName"]
def _tree(e): return _img(e).startswith(("!$Pine", "!$Tree", "!$Big_Trees"))
def _oddal(e):
    occ = K.zajete(pomin={e["id"]}); best = None
    inne = [t for t in K.eventy() if _tree(t) and t["id"] != e["id"]]
    tall = [t for t in K.eventy() if _img(t) in ("!$Stump_Tall", "!$Trunk_Dead")]
    for r in range(2, 10):
        for dy in range(-r, r + 1):
            for dx in range(-r, r + 1):
                if max(abs(dx), abs(dy)) != r or best: continue
                x, y = e["x"] + dx, e["y"] + dy
                if not (4 <= x < K.W - 4 and 4 <= y < K.H - 4) or (x, y) in occ or (x, y) in ZAKAZ or (x, y) in SZ: continue
                if K.kind(0, x, y) not in (16, 27) or K.kind(1, x, y) not in (None, 21) or K.g(2, x, y) or K.g(3, x, y): continue
                if PAST[0] - 2 <= x <= PAST[2] + 2 and PAST[1] - 1 <= y <= PAST[3] + 4: continue
                if any(math.hypot(t["x"] - x, t["y"] - y) < 2.6 for t in inne): continue
                if any(abs(t["x"] - x) <= 1 and -1 <= t["y"] - y <= 3 for t in tall): continue
                best = (x, y)
        if best: break
    if best: K.przenies(e["id"], *best)
    else: K.log.append("BRAK MIEJSCA: %d %s (%d,%d)" % (e["id"], e["name"], e["x"], e["y"]))
for e in [t for t in K.eventy() if _tree(t)]:
    if PAST[0] - 1 <= e["x"] <= PAST[2] + 1 and PAST[3] < e["y"] <= PAST[3] + 3: _oddal(e)
for s_ in [t for t in K.eventy() if _img(t) in ("!$Stump_Tall", "!$Trunk_Dead")]:
    for e in [t for t in K.eventy() if _tree(t)]:
        if abs(e["x"] - s_["x"]) <= 1 and -1 <= e["y"] - s_["y"] <= 0: _oddal(e)
_d = [t for t in K.eventy() if _tree(t) and 36 <= t["y"] <= 78 and 26 <= t["x"] <= 63]
for i_, a_ in enumerate(_d):
    for b_ in _d[i_ + 1:]:
        if abs(a_["x"] - b_["x"]) <= 1 and abs(a_["y"] - b_["y"]) <= 1: _oddal(b_)

if __name__ == "__main__":
    # (review 2026-11-11: the big pine 196 stood right under the pen's south fence, its crown over it: three rows lower)
    K.przenies(196, 45, 75)
    p = K.zapisz()
    print("\n".join(l for l in K.log if l.startswith(("BRAK", "nie zszedl"))))
    print("saved", p, "events", n0, "->", K.liczba())
