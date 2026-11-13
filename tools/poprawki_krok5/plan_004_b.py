# -*- coding: utf-8 -*-
"""Plan krajobrazu Map004, czesc B (krajobraz poludnia y60-118). Uruchamiaj TEN plik:  python tools/poprawki_krok5/plan_004_b.py
(najpierw importuje plan_004.py = wady 1, 4-11, potem dokłada strefy)."""
import os, sys, math, random
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from plan_004 import *

SZ_DROGI = set(Mdr) | set(M5)
rng = random.Random(2026)
zuzyte = set()


def pula():
    """luzne drzewa poludnia (poza gajem, polem kamieni i ustawionymi grupami)"""
    return [e for e in K.eventy() if klasa(e) in ("sosnaA", "sosnaB", "sosnaC", "male") and e["y"] >= 60 and e["x"] >= 28
            and not (GAJ[0] <= e["x"] <= GAJ[2] and GAJ[1] <= e["y"] <= GAJ[3]) and e["id"] not in zuzyte]


def wzor_drzewa(k_):
    g = TYP_GRAFIKA[k_]
    return next(e for (gg, t, n), e in K.wzory.items() if gg == g and t == 0 and ("Tree" in e["note"] or "Log" in e["note"]))


def wzor_kl(k_):
    return next(e for e in K.wzory.values() if klasa(e) == k_)


def wzor_gr(grafika):
    return next(e for e in K.wzory.values() if e["pages"][0]["image"]["characterName"] == grafika)


def wez(n, rodz=None):
    """n zdarzen-drzew: najpierw luzne istniejace (id), brakujace - nowe ze wzoru"""
    out = []
    rodz = rodz or ("sosnaA", "sosnaB", "sosnaB", "sosnaC", "sosnaC", "male", "male")
    for i in range(n):
        k_ = rodz[i % len(rodz)] if len(rodz) < 7 else rng.choice(rodz)
        p = [e for e in pula() if klasa(e) == k_]
        if p:
            e = rng.choice(p); zuzyte.add(e["id"]); out.append(e["id"])
        else:
            out.append(wzor_drzewa(k_))
    return out


rodz_kw = lambda r: KWIATY[r.choice(list(KWIATY))]
ZK = ZAKAZ | SZ_DROGI

# ------------------------------------------------------------------ zagroda: zamkniety plot z brama od drogi, droga do bramy
PAST = (34, 63, 47, 74)
brama = [(PAST[0], y) for y in (68, 69)]
M_a = K.droga_maska([(22.5, 68.4), (26.5, 70.2), (30.0, 69.6), (32.4, 69.0), (34.6, 69.0)], 2.7, seed=81, szum=0.1) | K.blob(32.3, 69.0, 1.7, 1.9, 82, 0.15)
M_a = {c for c in M_a if c[0] >= 22}
for (x, y) in M_a:
    K.ground(x, y, 17)
    if K.g(1, x, y): K.over(x, y, 0)
SZ_DROGI |= M_a
mask_past = {(x, y) for x in range(PAST[0] - 1, PAST[2] + 2) for y in range(PAST[1] - 1, PAST[3] + 2)}
K.zejdz_z(mask_past - M_a)
for (x, y) in mask_past:
    if K.kind(1, x, y) in (21, 46, 39, 28, 29, 31, 36): K.over(x, y, 0)
K.plot(*PAST, bramy=brama)
for y_ in (67, 70):                              # slupki bramy (A2 30 - grubszy slup plotu), symetrycznie
    K.kafel(PAST[0], y_, 216, z=2); K.kafel(PAST[0], y_, 217, z=3)   # (the fence's own dark posts, as on grandpa's plot: A2 30 was a red pole)
K.zdarzenie_z(wzor_gr("!$Tree_Pear"), 42, 66)
K.zdarzenie_z(wzor_gr("!$Rock_Flat"), 44, 72)
K.zdarzenie_z(wzor_gr("!$Rock_Mossy"), 37, 72)
K.plama(K.blob(41, 70, 4.5, 2.6, 85, 0.3), 27, 0, tylko_na={16})
K.plama(K.blob(39, 66.5, 2.6, 1.4, 86) - {(x, y) for x in range(PAST[0], PAST[2] + 1) for y in (PAST[1], PAST[3])}, 27, 0, tylko_na={16})
SZ_DROGI |= {(x, y) for x in range(PAST[0], PAST[2] + 1) for y in (PAST[1], PAST[3])} | {(x, y) for y in range(PAST[1], PAST[3] + 1) for x in (PAST[0], PAST[2])}
ZK = ZAKAZ | SZ_DROGI

# ------------------------------------------------------------------ laka kwietna na wschod od zagrody
f_kw = K.gestosc(57, 67, 9.5, 6.5, 91, rough=0.35, spadek=0.7)
K.dekor(f_kw, rodz_kw, 14, 92, (47, 60, 67, 75), occ=K.zajete(), zakazane=ZK | mask_past, ile=(3, 4), promien=1.5, odstep=3.2)
K.sadz(wez(2, ("male",)), K.gestosc(57, 67, 11, 7.5, 93, spadek=0.2), 94, min_d=4, occ=K.zajete(), zakazane=ZK, bbox=(48, 60, 66, 75))

# ------------------------------------------------------------------ sciezki: do kepy i do kamieni
for y in range(100, 106):                       # (stara prostokatna plama ciemnej trawy 23-27 x 101-105: nowa, organiczna)
    for x in range(21, 30):
        if K.kind(0, x, y) == 27: K.ground(x, y, 16)
K.plama(K.blob(25, 104, 3.2, 2.2, 177), 27, 0, tylko_na={16})
SC_B = [(11.0, 101.5), (18, 102.2), (26, 101.6), (33, 100.0), (40, 98.6), (46.5, 98.4)]
M_b = K.droga_maska(SC_B, 2.8, seed=101, szum=0.1)
M_c = K.droga_maska([(52, 98.2), (55.0, 95.4), (57.2, 91.6), (58.6, 87.6), (58.9, 84.6)], 2.6, seed=102, szum=0.1, zwez_koniec=0.3)
M_pol = K.blob(50, 98.2, 3.2, 2.3, 103, 0.22)
for M in (M_b, M_c, M_pol):
    for (x, y) in M:
        K.ground(x, y, 17)
        if K.g(1, x, y): K.over(x, y, 0)
SZ_DROGI |= M_b | M_c | M_pol
ZK = ZAKAZ | SZ_DROGI

# ------------------------------------------------------------------ kepa 1: podszyt, ciemniejszy grunt, polanka z pniami
f_k1 = K.gestosc(50.5, 98.5, 9.5, 7.2, 111, rough=0.3, scale=4.0, polana=(50, 98.4, 3.3, 2.4), spadek=0.5)
mix = ["sosnaB", "sosnaA", "sosnaC", "male", "sosnaC"]
ids1 = []
for k_ in mix:
    p = [e for e in pula() if klasa(e) == k_]
    if p: zuzyte.add(p[0]["id"]); ids1.append(p[0]["id"])
    else: ids1.append(wzor_drzewa(k_))
K.sadz(ids1, f_k1, 112, min_d=1.9, occ=K.zajete(), zakazane=ZK, bbox=(40, 90, 61, 107), prog=0.03)
K.grunt_wg(f_k1, 0.38, 113, bbox=(38, 88, 63, 109))
for (x, y) in M_pol | M_b | M_c:
    if K.kind(1, x, y) == 46: K.over(x, y, 0)
kb = wzor_kl("kloda"); pb = wzor_kl("pieniek"); mb = wzor_gr("!$Trunk_Dead"); sb = wzor_gr("!$Stump_Tall")
for (w_, x, y) in [(pb, 47, 100), (kb, 53, 96), (mb, 48, 96)]:
    K.zdarzenie_z(w_, x, y)
K.sadz([wzor_gr(g) for g in ("!$Bush_Bare_Big", "!$Bush_Bare_Thicket")],
       K.gestosc(50.5, 98.5, 11, 8.3, 114, rough=0.3, polana=(50, 98.4, 3.4, 2.5), spadek=0.5), 115, min_d=2.2, occ=K.zajete(), zakazane=ZK, bbox=(40, 90, 61, 107), kol_dy=0)
K.dekor(f_k1, [PAPROCIE], int(os.environ.get('K_FERN', 40)), 116, (38, 88, 63, 109), occ=K.zajete(), zakazane=ZK, ile=(1, 2), promien=1.3, odstep=1.9)
K.dekor(K.gestosc(50, 98.4, 5, 3.6, 117), rodz_kw, 3, 118, (44, 94, 57, 103), occ=K.zajete(), zakazane=ZK, ile=(3, 3), promien=1.6, odstep=3.0)

# ------------------------------------------------------------------ zywoplot na polnoc od sciezki (nierowny, z przerwami)
xs = [23.0, 27.4, 31.0, 35.2]
bus = [wzor_gr(g) for g in ("!$Bush_Bare_Hedge", "!$Bush_Bare_Wide", "!$Bush_Bare_Hedge", "!$Bush_Bare_Thicket")]
occ = K.zajete()
for w_, x in zip(bus, xs):
    yy = 98.0 - 0.55 * (x - 22) / 14 + rng.uniform(-0.7, 0.7)
    best = None
    for dy in range(-1, 2):
        for dx in range(-1, 2):
            cx_, cy_ = int(round(x)) + dx, int(round(yy)) + dy
            ee = dict(w_); ee["x"], ee["y"] = cx_, cy_
            cells = stopa(ee)
            if cy_ >= 98 or any(c in occ or c in ZK for c in cells): continue
            best = (cx_, cy_)
    if best:
        e = K.zdarzenie_z(w_, *best)
        for c in stopa(e): occ[c] = e["id"]

# ------------------------------------------------------------------ kepa 2 i grupki po 2-3 drzewa
f_k2 = K.gestosc(71.5, 105, 6.8, 5.2, 121, rough=0.35, spadek=0.7)
K.sadz(wez(4, ("sosnaA", "sosnaB", "sosnaC", "male")), f_k2, 122, min_d=2.1, occ=K.zajete(), zakazane=ZK, bbox=(63, 98, 80, 112), prog=0.1)
K.grunt_wg(f_k2, 0.4, 123, bbox=(62, 97, 81, 113))
K.dekor(f_k2, [PAPROCIE], 18, 124, (63, 98, 80, 112), occ=K.zajete(), zakazane=ZK, ile=(1, 2), promien=1.3, odstep=2.0)
for i, (cx_, cy_, n_) in enumerate([(41, 82, 3), (63, 89, 3), (34, 108, 3), (82, 92, 2), (46, 112, 2)]):
    K.sadz(wez(n_), K.gestosc(cx_, cy_, 3.4, 2.6, 130 + i, rough=0.3, spadek=0.5), 140 + i, min_d=2.2, occ=K.zajete(), zakazane=ZK, bbox=(cx_ - 4, cy_ - 3, cx_ + 4, cy_ + 3))

# ------------------------------------------------------------------ punkt orientacyjny: glazy + martwe drzewo przy koncu sciezki (58,83)
for (g, x, y) in [("!$Rock_Huge", 59, 82), ("!$Rock_Twin", 62, 84), ("!$Rock_Mound", 56, 83), ("!$Rock_Boulder_Crack", 60, 86), ("!$Trunk_Dead", 63, 81),
                  ("!$Bush_Bare_Big", 57, 80), ("!$Bush_Bare_Wide", 63, 87)]:
    K.zdarzenie_z(wzor_gr(g), x, y)
K.plama(K.blob(59, 83.5, 5.5, 3.6, 151, 0.3) - SZ_DROGI, 27, 0, tylko_na={16})
K.dekor(K.gestosc(59.5, 83.5, 6.5, 4.5, 152), [KAMYKI], 4, 153, (54, 79, 65, 89), occ=K.zajete(), zakazane=ZK, ile=(1, 2), promien=1.2, odstep=2.4)
K.dekor(K.gestosc(59.5, 83.5, 6.5, 4.5, 152), [PAPROCIE], 5, 154, (54, 79, 65, 89), occ=K.zajete(), zakazane=ZK, ile=(1, 2), promien=1.2, odstep=2.4)

# ------------------------------------------------------------------ ciemne plamy trawy (A2 27), kwiaty i kamyki w grupach po calym poludniu
for i, (cx_, cy_, rx_, ry_) in enumerate([(38, 88, 5, 3.2), (66, 94, 5, 3), (80, 100, 4.5, 3), (28, 111, 5, 3), (56, 108, 5, 3.4), (73, 87, 3.6, 2.6), (48, 79, 4, 2.6), (20, 70, 2.2, 3.4)]):
    K.plama(K.blob(cx_, cy_, rx_, ry_, 160 + i, 0.32) - SZ_DROGI, 27, 0, tylko_na={16})
f_all = lambda x, y: 1.0 if (y >= 60 and 4 <= x <= 86) else 0.0
K.dekor(f_all, rodz_kw, 26, 170, (4, 60, 86, 116), occ=K.zajete(), zakazane=ZK, ile=(3, 4), promien=1.5, odstep=4.2)
K.dekor(f_all, [KAMYKI], 12, 171, (4, 60, 86, 116), occ=K.zajete(), zakazane=ZK, ile=(1, 2), promien=1.2, odstep=5.0)

# ------------------------------------------------------------------ zdarzenia z drogi / plotu precz
K.zejdz_z(SZ_DROGI)
if K.ev[86] and (K.ev[86]["x"], K.ev[86]["y"]) in SZ_DROGI: K.usun(86)

# ------------------------------------------------------------------ dostep: kazda rzecz do zbierania ma wolna, osiagalna kratke obok (krzaki przy kopcach nie zamykaja)
def dostep():
    mp = L.Mapa(4, raw=K.m)
    reach = mp.flood([(5, 48), (13, 118), (50, 2)])
    zle = []
    for e in K.eventy():
        if klasa(e) in ("skala", "ruda", "krzak", "pieniek", "kloda") and e["x"] > 3:
            cells = stopa(e)
            if not any(((x + a, y + b) in reach and (x + a, y + b) not in cells) for (x, y) in cells for a, b in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                zle.append(e)
    return zle
for _ in range(4):
    zle = dostep()
    if not zle: break
    for e in zle:
        sas = [b for b in K.eventy() if klasa(b) == "krzak" and b["id"] != e["id"] and abs(b["x"] - e["x"]) <= 2 and abs(b["y"] - e["y"]) <= 2]
        if sas: K.usun(sas[0]["id"])
        elif klasa(e) in ("skala", "ruda"):
            mp = L.Mapa(4, raw=K.m); reach = mp.flood([(5, 48), (13, 118), (50, 2)]); occ = K.zajete(pomin={e["id"]}); best = None
            for r in range(1, 8):
                for dy in range(-r, r + 1):
                    for dx in range(-r, r + 1):
                        if max(abs(dx), abs(dy)) != r or best: continue
                        ee = dict(e); ee["x"], ee["y"] = e["x"] + dx, e["y"] + dy
                        cells = stopa(ee)
                        if all(c not in occ and K.in_(*c) and K.kind(0, *c) in (16, 27) for c in cells) and                                 any((x + a, y + b) in reach and (x + a, y + b) not in cells for (x, y) in cells for a, b in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                            best = (ee["x"], ee["y"])
            if best: K.przenies(e["id"], *best)
            else: K.log.append("BRAK DOSTEPU: %d %s (%d,%d)" % (e["id"], e["name"], e["x"], e["y"]))
        else: K.log.append("BRAK DOSTEPU: %d %s (%d,%d)" % (e["id"], e["name"], e["x"], e["y"]))

# ------------------------------------------------------------------ last look (review 2026-11-11): nothing tall on the fence, behind a tall stump or on another tree
def _img(e): return e["pages"][0]["image"]["characterName"]
def _tree(e): return _img(e).startswith(("!$Pine", "!$Tree"))
def _oddal(e):
    occ = K.zajete(pomin={e["id"]}); best = None
    inne = [t for t in K.eventy() if _tree(t) and t["id"] != e["id"]]
    tall = [t for t in K.eventy() if _img(t) in ("!$Stump_Tall", "!$Trunk_Dead")]
    for r in range(2, 10):
        for dy in range(-r, r + 1):
            for dx in range(-r, r + 1):
                if max(abs(dx), abs(dy)) != r or best: continue
                x, y = e["x"] + dx, e["y"] + dy
                if not (4 <= x < K.W - 4 and 4 <= y < K.H - 4) or (x, y) in occ or K.kind(0, x, y) not in (16, 27): continue
                if K.kind(1, x, y) not in (None, 21, 46) or K.g(2, x, y) or K.g(3, x, y): continue
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
_d = [t for t in K.eventy() if _tree(t) and t["y"] >= 50]
for i_, a_ in enumerate(_d):
    for b_ in _d[i_ + 1:]:
        if abs(a_["x"] - b_["x"]) <= 1 and abs(a_["y"] - b_["y"]) <= 1: _oddal(b_)

if __name__ == "__main__":
    p = K.zapisz()
    print("\n".join(l for l in K.log if l.startswith(("BRAK", "nie zszedl", "kopiec"))))
    print("zapisane", p, "zdarzen:", K.liczba(), "wpisow:", len(K.ev))
