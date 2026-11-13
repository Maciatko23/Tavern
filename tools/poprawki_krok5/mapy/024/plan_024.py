# -*- coding: utf-8 -*-
"""Krok 5, Map024 'Posiadlosc Lorda': (1) rownina na polnoc od dworu (x3-116, y22-58): aleja dojazdowa, ogrodzona laka, pola, laka sianokosna, zagajnik zwierzyny;
(2) poludniowo-zachodni trawnik (x0-20, y86-112): sad i zagajnik, czysty trawnik.  python tools/poprawki_krok5/mapy/024/plan_024.py"""
import os, sys, math, random
MYD = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(MYD, "..", ".."))
import krajobraz as KJ
from krajobraz import *
MY = MYD
KJ.STG = os.path.join(MY, "staging", "data")
K = Krajobraz(24)
K4 = Krajobraz(4)                      # wzory (Map004), gdy Map024 ich nie ma
rng = random.Random(2411)

# ------------------------------------------------------------------ wzory
def wzor_gr(g):
    for KK in (K, K4):
        for e in KK.wzory.values():
            if e["pages"][0]["image"]["characterName"] == g and e["pages"][0]["image"]["tileId"] == 0:
                if g.startswith(("!$Pine", "!$Tree")) and "<Tree" not in e["note"]: continue
                return e
    raise KeyError(g)
def wzor_kl(k_):
    for KK in (K, K4):
        for e in KK.wzory.values():
            if klasa(e) == k_: return e
    raise KeyError(k_)
SOSNA = {"A": "!$Pine_A", "B": "!$Pine_B", "C": "!$Pine_C", "m": "!$Tree_Small", "j": "!$Tree_Apple", "g": "!$Tree_Pear"}
def drzewo(c): return wzor_gr(SOSNA[c])

# ------------------------------------------------------------------ strefy chronione + miejsca (Okolice/Lowy: zostaja wolne i osiagalne)
CHRON = [(4, 33, 12, 41), (13, 40, 29, 44), (69, 40, 77, 43), (20, 59, 26, 64)]       # gaj sosnowy, sad, kepa jabloni (kepa na rowni), ruina
MIEJSCA = [(7, 29), (8, 29), (20, 46), (45, 38), (46, 38), (60, 22), (66, 12)]
def w_chron(x, y, m=0): return any(a - m <= x <= c + m and b - m <= y <= d + m for (a, b, c, d) in CHRON)
ZAKAZ = {(x + a, y + b) for (x, y) in MIEJSCA for a in range(-2, 3) for b in range(-2, 3)}
KRAWEDZ = lambda x, y: x < 4 or x > K.W - 5 or y < 4

# ------------------------------------------------------------------ sprzatanie: szare plamy gruzu (A2 47), ciemne rozlane lacze (A2 21 / 36) na rowninie i na trawniku PD
def czysc(x0, y0, x1, y1, rodz=(21, 36, 47)):
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            if K.kind(1, x, y) in rodz and not w_chron(x, y): K.over(x, y, 0)
czysc(3, 22, 116, 49)
czysc(3, 22, 116, 58, rodz=(36, 47))
czysc(3, 50, 44, 58)
czysc(0, 86, 20, 114)
for (x, y) in [(x, y) for y in range(86, 115) for x in range(0, 21) if K.kind(0, x, y) in (17, 24, 27)]: K.ground(x, y, 16)   # okruchy ziemi / ciemnej trawy poza droga
for y in range(22, 59):
    for x in range(3, 117):
        if K.kind(0, x, y) in (24, 27) and not w_chron(x, y): K.ground(x, y, 16)
# drobne ziemne plamki przy gruzie (x40-46,y60 itd. leza na y>58: nie ruszane); na rowninie: wszystkie 17 poza istniejacymi drogami i polaciami
GLINA = {(x, y) for y in range(40, 56) for x in range(96, 112) if K.kind(0, x, y) == 17}      # istniejaca lysa polac wsch. - zostaje
DROGA_ZACH = {(x, y) for y in range(49, 66) for x in range(0, 26) if K.kind(0, x, y) == 17}
for y in range(22, 56):
    for x in range(3, 117):
        if K.kind(0, x, y) == 17 and (x, y) not in GLINA and (x, y) not in DROGA_ZACH and not w_chron(x, y): K.ground(x, y, 16)

# ------------------------------------------------------------------ aleja dojazdowa: z zachodniej drogi (4,58) lukiem na polnoc-wschod, potem prosto na wschod do zagajnika (zielona strefa y>=36: pas suchego brzegu y<~35 zostaje dziki)
A_GL = [(4.4, 57.8), (6.8, 53.8), (10.5, 50.6), (17, 49.0), (24, 48.5), (31, 47.4), (38, 46.4), (47, 45.8), (55, 48.0), (63, 45.4), (71, 48.4), (79, 46.6), (86, 45.6), (92, 44.5), (97, 43.0), (101, 41.2), (104.5, 39.2)]
A_P = [(37.6, 46.2), (37.6, 44.6), (37.7, 43.0)]
SZ = set()
for pts, w, sd in ((A_GL, 2.8, 201), (A_P, 2.4, 203)):
    M_ = K.okraglij(K.droga_maska(pts, w, seed=sd, szum=0.04), 1.25, 0.5)
    for (x, y) in M_:
        K.ground(x, y, 17)
        if K.g(1, x, y): K.over(x, y, 0)
    SZ |= M_

# ------------------------------------------------------------------ pastwisko ogrodzone nad aleja (brama od strony alei)
PAST = (32, 36, 43, 43)
BRAMA = [(37, PAST[3]), (38, PAST[3])]
def plot_(x0, y0, x1, y1, bramy):
    cells = [(x, y) for x in range(x0, x1 + 1) for y in (y0, y1)] + [(x, y) for y in range(y0 + 1, y1) for x in (x0, x1)]
    for (x, y) in cells:
        if (x, y) in bramy: K.over(x, y, 0)
        else: K.over(x, y, 22)
    return cells
for y in range(PAST[1] - 1, PAST[3] + 2):
    for x in range(PAST[0] - 1, PAST[2] + 2):
        if K.g(1, x, y): K.over(x, y, 0)
PL = plot_(*PAST, BRAMA)
for x_ in (PAST[0] + 5, PAST[2] - 5): pass
K.kafel(36, PAST[3], 209, 3); K.kafel(39, PAST[3], 208, 3)      # slupy bramy: B 209 (slup po prawej krawedzi) i 208 (po lewej), tak jak fix_fence_ring; 0x60f = pelnoblokujace
SZ |= set(PL)
K.plama(K.blob(37.5, 39.3, 4.4, 1.9, 211, 0.3) - SZ, 27, 0, tylko_na={16})

# ------------------------------------------------------------------ pola Lorda: rownolegle pasy (bruzda D 712-714 + grzadka C 277-287, same kafle, bez zdarzen), waski miedz trawiasty, rozna dlugosc pasow
BEDS = [277, 278, 279, 285, 286, 287]
POLA = []
def pasek(x0, x1, yf, seed):
    r = random.Random(seed); prev = -1
    for x in range(x0, x1 + 1):
        for yy in (yf, yf + 1):
            K.ground(x, yy, 16)
            if K.g(1, x, yy): K.over(x, yy, 0)
        K.kafel(x, yf, 712 if x == x0 else 714 if x == x1 else 713, 2)
        b_ = r.choice([v for v in range(6) if v != prev]); prev = b_
        K.kafel(x, yf + 1, BEDS[b_], 2)
        UPR.append((x, yf)); UPR.append((x, yf + 1))
UPR = []
STR = [(48, 65, 35, 71), (49, 66, 38, 72), (48, 63, 41, 73), (80, 97, 35, 74), (81, 98, 38, 75), (80, 91, 41, 76)]
SZ_POLA = {(x, y) for (x0, x1, yf, _) in STR for x in range(x0 - 1, x1 + 2) for y in range(yf - 1, yf + 3)}
K.zejdz_z(SZ_POLA)
for (x0, x1, yf, sd) in STR: pasek(x0, x1, yf, sd)

# ------------------------------------------------------------------ laka sianokosna na poludnie od alei: owalna ciemniejsza laka, trzy stogi
def stog(x, y):
    # stog 3x3 jak w Map125: wierzch nad bohaterem (z3), korpus z solidnym srodkiem pod pustym kaflem z gwiazdka (Cienie.js nie rzuca wtedy twardego cienia), bez luznego rzedu slomy
    for i, t in enumerate((213, 214, 215)): K.kafel(x + i, y, 256 + t, 3)
    for i, t in enumerate((221, 222, 223)): K.kafel(x + i, y + 1, 256 + t, 3)
    K.kafel(x + 1, y + 1, 256 + 222, 2); K.kafel(x + 1, y + 1, 751, 3)
STOGI = [(51, 51), (58, 52), (65, 51)]
for (x, y) in STOGI: stog(x, y)
STOG_KR = {(x + i, y + j) for (x, y) in STOGI for i in range(-1, 4) for j in range(-1, 3)}

# ------------------------------------------------------------------ zagajnik zwierzyny (NE): polanka na koncu alei
CL = K.blob(106.0, 38.4, 3.0, 2.0, 241, 0.2)
K.plama(CL, 17, 0)
for (x, y) in CL: K.over(x, y, 0)
SZ |= CL
f_cop = K.gestosc(107.5, 36, 9.5, 6.0, 242, rough=0.3, scale=4.0, polana=(106, 38.4, 3.8, 2.8), spadek=0.5)
K.grunt_wg(f_cop, 0.3, 243, rodzaj=27, warstwa=0, bbox=(96, 28, 116, 43))
for (x, y) in CL: K.ground(x, y, 17)
for (x, y) in SZ:
    if K.kind(0, x, y) == 27 and (x, y) not in CL and (x, y) not in PL: K.ground(x, y, 16)

ZK = ZAKAZ | SZ | SZ_POLA | STOG_KR | {(x, y) for x in range(PAST[0] - 1, PAST[2] + 2) for y in range(PAST[1] - 1, PAST[3] + 5)}
rodz_kw = lambda r: KWIATY[r.choice(list(KWIATY))]
K.zejdz_z(SZ | SZ_POLA | STOG_KR)

nowe = [drzewo(c) for c in "BACAB"]
K.sadz([3, 4] + nowe, f_cop, 244, min_d=2.0, occ=K.zajete(), zakazane=ZK, bbox=(97, 28, 114, 42), prog=0.04)
for (w_, x, y) in [(wzor_gr("!$Trunk_Dead"), 112, 37), (wzor_gr("!$Stump_Tall"), 109, 42)]:
    K.zdarzenie_z(w_, x, y)
K.sadz([wzor_gr("!$Bush_Bare_Big")], K.gestosc(107.5, 36, 11, 7, 245, polana=(106, 38.4, 3.8, 2.8), spadek=0.4), 246, min_d=2.2, occ=K.zajete(), zakazane=ZK, bbox=(97, 28, 114, 42), kol_dy=0)
K.dekor(f_cop, [PAPROCIE], 14, 247, (96, 28, 115, 43), occ=K.zajete(), zakazane=ZK, ile=(1, 2), promien=1.3, odstep=2.0)

# pastwisko: dwa drzewa w srodku (z dala od ogrodzenia)
K.zdarzenie_z(drzewo("g"), 35, 41); K.zdarzenie_z(drzewo("m"), 40, 40)

# ------------------------------------------------------------------ aleja: jednostronny szpaler sosen (strona poludniowa), rozstaw ~9
cr = K.krzywa(A_GL, 0.25)
cum = [0.0]
for i in range(1, len(cr)): cum.append(cum[-1] + math.dist(cr[i], cr[i - 1]))
nxt = 13.0; AL = []; POOL = [163, 180, 172, 182, 55]
occ = K.zajete()
for i in range(1, len(cr) - 1):
    if cum[i] < nxt or len(AL) >= 8: continue
    tx, ty = cr[i + 1][0] - cr[i - 1][0], cr[i + 1][1] - cr[i - 1][1]
    nrm = math.hypot(tx, ty); nx_, ny_ = -ty / nrm, tx / nrm
    best = None
    for off in (3.6, 4.0, 3.2, 4.4):
        x, y = int(round(cr[i][0] + nx_ * off)), int(round(cr[i][1] + ny_ * off))
        if K.wolne_pod_drzewo(x, y, occ, 1) and (x, y) not in ZK and not w_chron(x, y, 1) and all(abs(x - a) > 1 or abs(y - b) > 1 for (a, b) in AL):
            best = (x, y); break
    if best:
        if POOL:
            eid = POOL.pop(0)
            for c in stopa(K.ev[eid]): occ.pop(c, None)
            K.przenies(eid, *best); e = K.ev[eid]
        else: e = K.zdarzenie_z(drzewo("A"), *best)
        AL.append(best)
        for c in stopa(e): occ[c] = e["id"]
        nxt = cum[i] + 9.5 + rng.uniform(-0.8, 0.8)
    else: nxt = cum[i] + 1.0

# ------------------------------------------------------------------ szpaler wiatrochronny miedzy polami + punkt orientacyjny na suchym brzegu
f_wz = K.gestosc(72, 37.5, 3.4, 3.0, 261, rough=0.3, spadek=0.4)
K.sadz([160], f_wz, 262, min_d=2.2, occ=K.zajete(), zakazane=ZK, bbox=(68, 34, 77, 39), prog=0.05)
for (g_, x, y) in [("!$Boulder_A", 37, 25), ("!$Trunk_Dead", 36, 27)]:
    K.zdarzenie_z(wzor_gr(g_), x, y)
for i, (cx_, cy_, rx_, ry_) in enumerate([(23, 53.5, 4.5, 2.2), (86, 50, 4.5, 2.6), (74, 54, 4, 2.2), (14, 37, 3.5, 2.2), (100, 48, 3, 2)]):
    K.plama(K.blob(cx_, cy_, rx_, ry_, 270 + i, 0.3) - SZ - SZ_POLA, 27, 0, tylko_na={16})

# ------------------------------------------------------------------ dekor
ZKD = ZK | CL
f_pl = lambda x, y: 1.0 if (4 <= x <= 116 and 36 <= y <= 56) else 0.0
K.dekor(f_pl, rodz_kw, 18, 301, (4, 36, 116, 56), occ=K.zajete(), zakazane=ZKD, ile=(3, 4), promien=1.5, odstep=6.0)
K.dekor(f_pl, [KAMYKI], 8, 302, (4, 36, 116, 56), occ=K.zajete(), zakazane=ZKD, ile=(1, 2), promien=1.2, odstep=8.0)
f_br = lambda x, y: 1.0 if (4 <= x <= 116 and 24 <= y <= 33) else 0.0
K.dekor(f_br, [KAMYKI], 6, 303, (4, 24, 116, 33), occ=K.zajete(), zakazane=ZKD, ile=(1, 2), promien=1.2, odstep=9.0)

# ------------------------------------------------------------------ poludniowo-zachodni trawnik: sad (rzedy przesuniete), zagajnik
K.usun(200)
for row, (yy, xs) in enumerate(((98, (7, 10, 13)), (102, (9, 12)))):
    for i, xx in enumerate(xs):
        K.zdarzenie_z(drzewo("j" if (i + row) % 2 == 0 else "g"), int(round(xx)), yy)
K.przenies(205, 9, 108); K.przenies(206, 5, 109)
K.zdarzenie_z(drzewo("C"), 12, 110)
K.sadz([], K.gestosc(9, 109, 8, 5, 403, spadek=0.4), 404, min_d=2.4, occ=K.zajete(), zakazane=ZKD, bbox=(3, 105, 16, 112), kol_dy=0)
K.dekor(K.gestosc(9, 109, 8, 4.5, 405), [PAPROCIE], 8, 406, (3, 104, 16, 112), occ=K.zajete(), zakazane=ZKD, ile=(1, 2), promien=1.3, odstep=2.0)
f_sw = lambda x, y: 1.0 if (3 <= x <= 20 and 88 <= y <= 112) else 0.0
K.dekor(f_sw, rodz_kw, 7, 407, (3, 88, 20, 112), occ=K.zajete(), zakazane=ZKD | {(x, y) for x in range(5, 17) for y in range(96, 104)}, ile=(3, 4), promien=1.5, odstep=4.5)
K.dekor(f_sw, [KAMYKI], 3, 408, (3, 88, 20, 112), occ=K.zajete(), zakazane=ZKD, ile=(1, 2), promien=1.2, odstep=6.0)

# ------------------------------------------------------------------ zdarzenia z alei / plotu precz
K.zejdz_z(SZ)

# ------------------------------------------------------------------ last look: nic wysokiego na plocie/polach/stogach, za pniem, na innym drzewie, na miejscach
def _img(e): return e["pages"][0]["image"]["characterName"]
def _tree(e): return _img(e).startswith(("!$Pine", "!$Tree"))
POLA_Z = SZ_POLA | STOG_KR | {(x, y) for x in range(PAST[0] - 1, PAST[2] + 2) for y in range(PAST[1] - 1, PAST[3] + 4) if y <= PAST[1] + 1 or y >= PAST[3] - 1 or x <= PAST[0] + 1 or x >= PAST[2] - 1}
def _oddal(e):
    occ = K.zajete(pomin={e["id"]}); best = None
    inne = [t for t in K.eventy() if _tree(t) and t["id"] != e["id"]]
    tall = [t for t in K.eventy() if _img(t) in ("!$Stump_Tall", "!$Trunk_Dead")]
    for r in range(1, 10):
        for dy in range(-r, r + 1):
            for dx in range(-r, r + 1):
                if max(abs(dx), abs(dy)) != r or best: continue
                x, y = e["x"] + dx, e["y"] + dy
                if not (4 <= x < K.W - 4 and 4 <= y < K.H - 4) or (x, y) in occ or K.kind(0, x, y) not in (16, 25, 27): continue
                if K.kind(1, x, y) not in (None, 21) or K.g(2, x, y) or K.g(3, x, y): continue
                if (x, y) in SZ or (x, y) in ZAKAZ or (x, y) in POLA_Z or w_chron(x, y, 1): continue
                if any(math.hypot(t["x"] - x, t["y"] - y) < 2.6 for t in inne): continue
                if any(abs(t["x"] - x) <= 1 and -1 <= t["y"] - y <= 3 for t in tall): continue
                best = (x, y)
        if best: break
    if best: K.przenies(e["id"], *best)
    else: K.log.append("BRAK MIEJSCA: %d %s (%d,%d)" % (e["id"], e["name"], e["x"], e["y"]))
import re
MINE = {int(m.group(1)) for l in K.log for m in [re.match(r"(?:nowe|przenies) (\d+) ", l)] if m}
for e in [t for t in K.eventy() if (_tree(t) or klasa(t) == "krzak") and t["id"] in MINE]:
    if (e["x"], e["y"]) in POLA_Z or (e["x"], e["y"]) in ZAKAZ: _oddal(e)
for s_ in [t for t in K.eventy() if _img(t) in ("!$Stump_Tall", "!$Trunk_Dead")]:
    for e in [t for t in K.eventy() if _tree(t) and t["id"] in MINE]:
        if abs(e["x"] - s_["x"]) <= 1 and -1 <= e["y"] - s_["y"] <= 0: _oddal(e)
_d = [t for t in K.eventy() if _tree(t)]
for i_, a_ in enumerate(_d):
    for b_ in _d[i_ + 1:]:
        if abs(a_["x"] - b_["x"]) <= 1 and abs(a_["y"] - b_["y"]) <= 1:
            if b_["id"] in MINE: _oddal(b_)
            elif a_["id"] in MINE: _oddal(a_)

if __name__ == "__main__":
    p = K.zapisz()
    print("\n".join(l for l in K.log if l.startswith(("BRAK", "nie zszedl"))))
    print("zapisane", p, "zdarzen:", K.liczba(), "(przed:", len([e for e in K.orig["events"] if e]), ")")
