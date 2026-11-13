# -*- coding: utf-8 -*-
"""Krok 5, Map003 'Kruczy Jar': krajobraz poludnia (y62-85, x4-115) - dzika ziemia, nie pola.
   python tools/poprawki_krok5/mapy/003/plan_003.py  -> tools/poprawki_krok5/mapy/003/staging/data/Map003.json
Zasady: zdarzenia netto <= 0 (przenosimy sosny w kepy, kilka zdejmujemy ze zbitego gaju na wschodzie, w ich miejsce glazy/krzaki/martwe drzewo),
nic na dzialce (x40-79, y<=61), nic w pasie 3 kratek przy krawedzi, nie ruszamy gor/brzegu (y>=86), istniejacych drog (A2 39)."""
import os, sys, math, random
MOJ = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.abspath(os.path.join(MOJ, "..", "..")))
import krajobraz as KJ
from krajobraz import *
KJ.STG = os.path.join(MOJ, "staging", "data")

K = Krajobraz(3)
N0 = K.liczba()
rng = random.Random(2003)
YMIN, YMAX = 62, 85                 # robocza strefa; ponizej: suchy pas brzegu - nie ruszamy
ev = lambda i: K.ev[i]
ZAKAZ = set()                       # (kratki zarezerwowane; nic nowego)
for (x, y) in [(x, y) for x in range(0, 120) for y in range(0, 62)]: pass


def wzor_gr(grafika):
    return next(e for e in K.wzory.values() if e["pages"][0]["image"]["characterName"] == grafika)
def wzor_kl(k_):
    return next(e for e in K.wzory.values() if klasa(e) == k_)
def _img(e): return e["pages"][0]["image"]["characterName"]
def _tree(e): return _img(e).startswith(("!$Pine", "!$Tree"))
rodz_kw = lambda r: KWIATY[r.choice(list(KWIATY))]

# ----------------------------------------------------------------- bryly: drogi (A2 39) sa nietykalne
DROGA39 = {(x, y) for y in range(K.H) for x in range(K.W) if K.kind(1, x, y) == 39}
orig_pos = {e["id"]: (e["x"], e["y"]) for e in K.eventy()}


def malowanie_sciezki(M, rodzaj=17):
    for (x, y) in M:
        if (x, y) in DROGA39 or not (YMIN <= y <= 84) or (40 <= x <= 79 and y < YMIN + 1): continue
        if K.kind(1, x, y) in (22, 21, 46, 30, 38): continue
        K.ground(x, y, rodzaj)
        if K.g(1, x, y): K.over(x, y, 0)


# ================================================================= 1. szlak zachodni: od konca drogi (9,63) do polany drwali
SZ_W = [(9.5, 62.4), (10.0, 66.0), (12.2, 69.6), (16.6, 72.4), (22.4, 73.9), (28.0, 75.6), (31.6, 77.0)]
M_w = K.lam(K.okraglij(K.droga_maska(SZ_W, 3.2, seed=31, szum=0.16), 1.2, 0.44), 4)
# stare plamy-cienie (kind 36) bez drzewa w strefie: precz
_zajdrz = {(e["x"], e["y"]) for e in K.eventy() if _tree(e)}
for y in range(YMIN, YMAX + 1):
    for x in range(4, 116):
        if K.kind(1, x, y) == 36 and (x, y) not in _zajdrz:
            K.over(x, y, 0)
            if K.kind(0, x, y) == 27 and x < 12: K.ground(x, y, 16)
# polana drwali: dawny schodkowy placek (kind 24) zastepuje organiczna plama ziemi, szlak wlewa sie w nia
for y in range(72, 82):
    for x in range(26, 40):
        if K.kind(0, x, y) == 24: K.ground(x, y, 16)
        if K.kind(1, x, y) == 36: K.over(x, y, 0)
M_gl = K.blob(33.6, 77.6, 3.7, 2.5, 33, 0.3)
malowanie_sciezki(M_w | M_gl)
SZ_DROGI = set(M_w) | set(M_gl)

# ================================================================= 2. szlak srodkowy: od drogi z bramy (49,62) do martwego drzewa
SZ_C = [(49.6, 61.5), (49.9, 65.0), (51.4, 69.0), (54.0, 73.0), (57.0, 76.0)]
M_c = K.lam(K.okraglij(K.droga_maska(SZ_C, 3.0, seed=32, szum=0.14), 1.2, 0.44), 4)
M_lm = K.blob(58.4, 77.2, 2.9, 2.0, 34, 0.28)
malowanie_sciezki(M_c | M_lm)
SZ_DROGI |= set(M_c) | set(M_lm)
def _skl(M):
    M = set(M); seen = set(); n = 0
    for c in M:
        if c in seen: continue
        n += 1; st = [c]
        while st:
            q = st.pop()
            if q in seen or q not in M: continue
            seen.add(q); st += [(q[0] + 1, q[1]), (q[0] - 1, q[1]), (q[0], q[1] + 1), (q[0], q[1] - 1)]
    return n
K.log.append("BRAK? skladowe szlakow: W=%d C=%d" % (_skl(M_w | M_gl), _skl(M_c | M_lm)))
DIL = {(x + a, y + b) for (x, y) in SZ_DROGI for a in (-1, 0, 1) for b in (-1, 0, 1)}

# ================================================================= 3. sosny: kepy z lekkich drzew (przenoszenie)
def przenies_do(eid, x, y):
    K.przenies(eid, x, y)

# GA: trojka na polnocy od szlaku (zostaje), GB: trojka przy drodze z bramy, GC: trojka NE - drobne korekty odstepow
przenies_do(302, 83, 70); przenies_do(300, 86, 67); przenies_do(296, 89, 70)
przenies_do(282, 54, 65); przenies_do(284, 46, 64); przenies_do(292, 44, 68)

# GD: polana drwali - pierscien nieregularny z lukiem od zachodu (tam wchodzi szlak)
GD = [306, 391, 406, 437]
for eid, (x, y) in zip(GD, [(31, 73), (38, 74), (37, 82), (29, 81)]): przenies_do(eid, x, y)
# GE: tlo martwego drzewa i glazow
GE = [334, 309, 365]
for eid, (x, y) in zip(GE, [(57, 71), (63, 70), (67, 73)]): przenies_do(eid, x, y)
# GF: kepa B ze sciezka-polanka
GF = [413, 419, 432, 441, 288, 293]
for eid, (x, y) in zip(GF, [(72, 79), (78, 77), (80, 81), (74, 83), (70, 83), (77, 84)]): przenies_do(eid, x, y)

# ================================================================= 4. gaj na wschodzie: rwane obrzeze, mniej drzew, runo
GAJ = [e for e in K.eventy() if _tree(e) and 91 <= e["x"] <= 112 and 72 <= e["y"] <= 85 and _img(e) != "!$Tree_Apple"]
cx = sum(e["x"] for e in GAJ) / len(GAJ); cy = sum(e["y"] for e in GAJ) / len(GAJ)
def tlok(e): return sum(1 for o in GAJ if o is not e and math.hypot(o["x"] - e["x"], o["y"] - e["y"]) < 2.3)
male = sorted(GAJ, key=lambda e: (-tlok(e), e["id"]))
DO_USUNIECIA = [e["id"] for e in male[:17]]
for i in DO_USUNIECIA: K.usun(i)
GAJ = [e for e in GAJ if e["id"] not in DO_USUNIECIA]
# rwane obrzeze: kilka skrajnych drzew przesunietych na zewnatrz parami (satelity), zostawiaja luki w obrysie
def _wolne_dla(e, x, y, occ):
    if not (4 <= x < K.W - 4 and YMIN + 2 <= y <= YMAX - 1) or (x, y) in occ or K.kind(0, x, y) not in (16, 27): return False
    if K.kind(1, x, y) not in (None, 46, 36) or K.g(2, x, y) or K.g(3, x, y): return False
    return not any(math.hypot(t["x"] - x, t["y"] - y) < 2.6 for t in K.eventy() if _tree(t) and t["id"] != e["id"])
zew = sorted(GAJ, key=lambda e: -math.hypot((e["x"] - cx) / 1.25, (e["y"] - cy)))
wybrane = []
for e in zew:
    a = math.atan2(e["y"] - cy, e["x"] - cx)
    if all(abs(math.remainder(a - b, 2 * math.pi)) > 0.9 for b in wybrane) and len(wybrane) < 5:
        wybrane.append(a)
        occ = K.zajete(pomin={e["id"]}); ok = False
        for d in (3.6, 4.4, 5.2, 3.0):
            for da in (0, 0.25, -0.25, 0.5, -0.5):
                x = int(round(e["x"] + math.cos(a + da) * d)); y = int(round(e["y"] + math.sin(a + da) * d * 0.8))
                if _wolne_dla(e, x, y, occ): K.przenies(e["id"], x, y); ok = True; break
            if ok: break

# ================================================================= 5. nowe zdarzenia (tyle ile zdjetych): martwe drzewo + glazy, krzaki, pniak
NOWE = []
def nowe(grafika_lub_klucz, x, y):
    w = wzor_gr(grafika_lub_klucz) if isinstance(grafika_lub_klucz, str) and grafika_lub_klucz.startswith("!$") else wzor_kl(grafika_lub_klucz)
    e = K.zdarzenie_z(w, x, y); NOWE.append(e["id"]); return e
nowe("!$Trunk_Dead", 61, 75)
nowe("!$Rock_Huge", 64, 78); nowe("!$Rock_Twin", 62, 81); nowe("!$Rock_Mossy", 66, 80)
nowe("!$Bush_Bare_Big", 66, 76)
nowe("pieniek", 35, 80); nowe("kloda", 31, 79)
nowe("!$Bush_Bare_Wide", 22, 67)
nowe("!$Bush_Bare_Thicket", 85, 70)
nowe("!$Bush_Bare_Big", 76, 80)
nowe("!$Rock_Mound", 14, 80); nowe("!$Rock_Cracked", 16, 82); nowe("!$Rock_Flat", 12, 82); nowe("!$Bush_Bare_Tall", 17, 79)
nowe("!$Bush_Bare_Thicket", 48, 69)
nowe("!$Bush_Bare_Tall", 104, 86 - 1) if False else None

# ================================================================= 6. grunt: ciemna trawa, runo lesne, paprocie, kwiaty, kamyki
def ciemna(cx_, cy_, rx_, ry_, seed):
    K.plama(K.blob(cx_, cy_, rx_, ry_, seed, 0.32) - SZ_DROGI, 27, 0, tylko_na={16})
for i, (a, b, c_, d_) in enumerate([(58.5, 77.5, 7.0, 4.6), (74.5, 80.5, 8.0, 5.0), (33.5, 77.6, 9.0, 5.6), (21, 66, 6.0, 3.6), (50, 66, 4.5, 3.5),
                                    (86, 69, 5.0, 3.6), (101, 77.6, 12.5, 6.4), (14, 79, 4.0, 2.6), (90, 81.5, 4.0, 2.2), (44, 74, 4.2, 2.4)]):
    ciemna(a, b, c_, d_, 200 + i)

def las_f(cx_, cy_, rx_, ry_, seed, pol=None): return K.gestosc(cx_, cy_, rx_, ry_, seed, rough=0.3, scale=4.0, polana=pol, spadek=0.5)
f_gd = las_f(33.5, 78, 8, 6.2, 211, (33.6, 77.6, 3.6, 2.4))
f_gf = las_f(75, 79.6, 8.5, 5.2, 212, (75.5, 80.5, 2.6, 1.8))
f_ga = las_f(20.5, 66, 6.5, 4, 213)
f_gaj = las_f(101.5, 77.8, 12, 6.6, 214)
f_lm = las_f(62, 74, 6.5, 6, 215, (58.4, 77.2, 3.2, 2.2))
for f_, bb in [(f_gd, (24, 68, 44, 84)), (f_gf, (64, 72, 86, 84)), (f_ga, (12, 62, 30, 72)), (f_gaj, (88, 68, 116, 84))]:
    K.grunt_wg(f_, 0.34, 300 + int(bb[0]), bbox=bb)
for (x, y) in SZ_DROGI | DROGA39:
    if K.kind(1, x, y) == 46: K.over(x, y, 0)
# paprocie i runo na obrzezu kep (kafle D, przechodnie)
for f_, bb, n_, sd in [(f_gd, (24, 68, 44, 84), 22, 401), (f_gf, (64, 72, 86, 84), 20, 402), (f_ga, (12, 62, 30, 72), 10, 403), (f_gaj, (88, 68, 116, 84), 26, 404), (f_lm, (52, 66, 72, 84), 10, 405)]:
    K.dekor(f_, [PAPROCIE], n_, sd, bb, occ=K.zajete(), zakazane=DIL, ile=(1, 2), promien=1.3, odstep=1.9)
# kwiaty po 3-4 jednego koloru na laczkach, kamyki w gniazdkach
f_lak = lambda x, y: 1.0 if (YMIN + 1 <= y <= 83 and 5 <= x <= 114) else 0.0
K.dekor(f_lak, rodz_kw, 18, 410, (5, 63, 114, 84), occ=K.zajete(), zakazane=DIL, ile=(3, 4), promien=1.5, odstep=5.0)
K.dekor(f_lak, [KAMYKI], 10, 411, (5, 63, 114, 84), occ=K.zajete(), zakazane=DIL, ile=(1, 2), promien=1.2, odstep=6.0)
K.dekor(K.gestosc(63, 78, 6, 4, 412), [KAMYKI], 4, 413, (56, 73, 70, 84), occ=K.zajete(), zakazane=DIL, ile=(1, 2), promien=1.2, odstep=2.4)

# ================================================================= 7. zdarzenia z drog / szlakow precz, opuszczone kafle pod drzewami
K.zejdz_z(SZ_DROGI | {c for c in M_gl | M_lm})
for eid, (ox, oy) in orig_pos.items():
    e = K.ev[eid]
    if (e is None or (e["x"], e["y"]) != (ox, oy)) and K.g(1, ox, oy) == 3822: K.over(ox, oy, 0)

# ================================================================= 8. last look: odstepy, martwe pnie, plot
def _oddal(e):
    occ = K.zajete(pomin={e["id"]}); best = None
    inne = [t for t in K.eventy() if _tree(t) and t["id"] != e["id"]]
    tall = [t for t in K.eventy() if _img(t) in ("!$Stump_Tall", "!$Trunk_Dead")]
    for r in range(1, 10):
        for dy in range(-r, r + 1):
            for dx in range(-r, r + 1):
                if max(abs(dx), abs(dy)) != r or best: continue
                x, y = e["x"] + dx, e["y"] + dy
                if not (4 <= x < K.W - 4 and 4 <= y < K.H - 4) or (x, y) in occ or K.kind(0, x, y) not in (16, 27, 17) : continue
                if K.kind(1, x, y) not in (None, 21, 46, 36) or K.g(2, x, y) or K.g(3, x, y) or (x, y) in DIL: continue
                if any(math.hypot(t["x"] - x, t["y"] - y) < 2.4 for t in inne): continue
                if any(abs(t["x"] - x) <= 1 and -1 <= t["y"] - y <= 3 for t in tall): continue
                best = (x, y)
        if best: break
    if best: K.przenies(e["id"], *best)
    else: K.log.append("BRAK MIEJSCA: %d %s (%d,%d)" % (e["id"], e["name"], e["x"], e["y"]))
for s_ in [t for t in K.eventy() if _img(t) in ("!$Stump_Tall", "!$Trunk_Dead")]:
    for e in [t for t in K.eventy() if _tree(t)]:
        if abs(e["x"] - s_["x"]) <= 1 and -1 <= e["y"] - s_["y"] <= 3: _oddal(e)
for _ in range(2):
    _d = [t for t in K.eventy() if _tree(t) and 60 <= t["y"] <= 86]
    for i_, a_ in enumerate(_d):
        for b_ in _d[i_ + 1:]:
            if abs(a_["x"] - b_["x"]) <= 1 and abs(a_["y"] - b_["y"]) <= 1: _oddal(b_)
for e in [t for t in K.eventy() if _tree(t) and (t["x"], t["y"]) in DIL]: _oddal(e)


# dostep: kazdy kamien / krzak / pniak ma wolna kratke obok
def dostep():
    mp = L.Mapa(3, raw=K.m)
    reach = mp.flood([(62, 45), (9, 62)])
    zle = []
    for e in K.eventy():
        if klasa(e) in ("skala", "ruda", "krzak", "pieniek", "kloda", "martwe") and e["y"] >= YMIN:
            cells = stopa(e)
            if not any(((x + a, y + b) in reach and (x + a, y + b) not in cells) for (x, y) in cells for a, b in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                zle.append(e)
    return zle

# ----------------------------------------------------------------- bezpiecznik: nic poza pasem y62..84 (grunt) / 62..85 (ozdoby), nic w 3 kratkach od krawedzi
def _przywroc(z, x, y):
    K.s(z, x, y, K.orig["data"][z * K.n + y * K.W + x])
for y in range(K.H):
    for x in range(K.W):
        out_g = not (YMIN <= y <= 84) or x < 4 or x > K.W - 5
        out_d = not (YMIN <= y <= 85) or x < 4 or x > K.W - 5
        for z in (0, 1):
            if out_g and K.g(z, x, y) != K.orig["data"][z * K.n + y * K.W + x]: _przywroc(z, x, y); K.c0.discard((x, y)); K.c1.discard((x, y))
        for z in (2, 3):
            if out_d and K.g(z, x, y) != K.orig["data"][z * K.n + y * K.W + x]: _przywroc(z, x, y)

if __name__ == "__main__":
    z = dostep()
    for e in z: K.log.append("BRAK DOSTEPU %d %s (%d,%d)" % (e["id"], e["name"], e["x"], e["y"]))
    # the central trail joins the gate road: the road overlay (A2 39) tapers to one cell at y 62, so the earth goes on under it (review 2026-11-11)
    for x_, y_ in [(49, 60), (50, 60), (51, 60), (49, 61), (50, 61), (51, 61), (48, 62), (49, 62), (50, 62), (51, 62)]:
        K.ground(x_, y_, 17)
    p = K.zapisz()
    print("\n".join(l for l in K.log if l.startswith(("BRAK", "nie zszedl"))))
    print("zapisane", p, "zdarzen: przed", N0, "po", K.liczba(), "nowe", len(NOWE), "zdjete", len(DO_USUNIECIA))
