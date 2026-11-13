# -*- coding: utf-8 -*-
"""Krok 5, Map111 'Podgrodzie': krajobraz na polnocnej lace (x26-101, y3-29) i poludniowym ugorze (x34-105, y98-116).
   python tools/poprawki_krok5/mapy/111/plan_111.py  ->  tools/poprawki_krok5/mapy/111/staging/data/Map111.json  (nic w data/)"""
import os, sys, math, random
MYDIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(MYDIR, "..", ".."))
import krajobraz
from krajobraz import *
krajobraz.STG = os.path.join(MYDIR, "staging", "data")

K = Krajobraz(111)
K4 = Krajobraz(4)              # wzory zdarzen (Map004): Pine_C, Tree_Small, Trunk_Dead, krzaki, kamienie
rng = random.Random(1111)
EV0 = K.liczba()
ev = lambda i: K.ev[i]

# ------------------------------------------------------------------ wzory
def wzor_gr(grafika):
    for src in (K, K4):
        for (g, t, n), e in src.wzory.items():
            if g == grafika and t == 0 and ("Tree" in e["note"] or "Log" in e["note"] or "Rock" in e["note"] or "Stump" in e["note"] or grafika.startswith("!$Bush") or grafika.startswith("!$Rock")):
                return e
    raise KeyError(grafika)
def wzor_kl(k_):
    for src in (K, K4):
        for e in src.wzory.values():
            if klasa(e) == k_: return e
    raise KeyError(k_)

# ------------------------------------------------------------------ pomocnicze
def prostokat(x0, y0, x1, y1):
    return {(x, y) for x in range(x0, x1 + 1) for y in range(y0, y1 + 1)}
def okragl_prost(x0, y0, x1, y1, r=1.7):
    """prostokat o zaokraglonych rogach (promien r kratek): miedze proste, rogi lukiem"""
    out = set()
    for (x, y) in prostokat(x0, y0, x1, y1):
        cx = min(max(x, x0 + r - 0.5), x1 - r + 0.5); cy = min(max(y, y0 + r - 0.5), y1 - r + 0.5)
        if (x - cx) ** 2 + (y - cy) ** 2 <= r * r: out.add((x, y))
    return out
def tor(pts, szer, seed, zwez=0.0):
    return K.lam(K.okraglij(K.droga_maska(pts, szer, seed=seed, szum=0.03, zwez_koniec=zwez), 1.5, 0.5))
def plac(c, rx, ry, seed, r=0.15):
    return K.lam(K.okraglij(K.blob(c[0], c[1], rx, ry, seed, r), 1.4, 0.5))
def czysc(x0, y0, x1, y1, chron=(), warstwy1=(21, 29, 31, 36, 39, 47, 22, 26, 37, 38, 20)):
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            if (x, y) in chron: continue
            if K.kind(0, x, y) in (16, 17, 27, 24, 26): K.ground(x, y, 16)
            if K.kind(1, x, y) in warstwy1: K.over(x, y, 0)
def linia4(pts):
    """gladka krzywa -> kratki 4-spojne (bez styku tylko rogami)"""
    c = K.krzywa(pts, 0.4)
    out = []
    last = None
    for (px, py) in c:
        cell = (int(math.floor(px + 0.5)), int(math.floor(py + 0.5)))
        if cell == last: continue
        if last and cell[0] != last[0] and cell[1] != last[1]:
            out.append((cell[0], last[1]))
        out.append(cell); last = cell
    return out
def zywoplot(pts, przerwy=(), grub=1, zakaz=frozenset()):
    """zywoplot z kafla A2 20 (warstwa 1): grub 1 lub 2; przerwy: lista (x, y) kratek bez zywoplotu"""
    cells = set(linia4(pts))
    if grub == 2: cells |= {(x, y + 1) for (x, y) in cells}
    cells -= set(przerwy); cells -= zakaz
    out = set()
    for (x, y) in cells:
        if not K.in_(x, y) or K.kind(0, x, y) not in (16, 27): continue
        if K.kind(1, x, y) in (22, 30, 38): continue
        K.over(x, y, 20); out.add((x, y))
    return out
def pole_ornej(x0, y0, x1, y1, uprawa, seed, rodzaj=16, kroki=(2, 2), rzedy=None):
    """pole z rownoleglych pasow: wiersz bruzd (B712-714) + wiersz grzadek (C277-287), miedzy pasami trawa; uprawa=[] -> same bruzdy (ugor)"""
    r = random.Random(seed); M = set(); cr = set()
    BEDS = uprawa or []
    yf = y0; k = 0
    while yf + 1 <= y1:
        xa, xb = x0 + (k % 2), x1 - ((k + 1) % 2) * r.choice((0, 1, 2))
        prev = -1
        for x in range(xa, xb + 1):
            K.ground(x, yf, 16); K.ground(x, yf + 1, 16)
            for yy in (yf, yf + 1):
                if K.g(1, x, yy): K.over(x, yy, 0)
            K.kafel(x, yf, 712 if x == xa else 714 if x == xb else 713, 2)
            M |= {(x, yf), (x, yf + 1)}
            if BEDS:
                b = r.choice([v for v in BEDS if v != prev]); prev = b
                K.kafel(x, yf + 1, b, 2); cr.add((x, yf + 1))
        yf += 3; k += 1
    return M, cr
def siano(x, y, z_=None):
    """duzy stog 3 x 3: wierzch nad bohaterem, korpus bryla; srodkowy C478 nnnizej pod pustym kaflem z gwiazdka B751 (Cienie.js) - bez twardego cienia; bez slomy pod stogiem"""
    C = 256
    for i, t in enumerate((213, 214, 215)): K.kafel(x + i, y, C + t, 3)
    for i, t in enumerate((221, 222, 223)): K.kafel(x + i, y + 1, C + t, 3)
    K.kafel(x + 1, y + 1, C + 222, 2); K.kafel(x + 1, y + 1, 751, 3)
    return prostokat(x, y, x + 2, y + 1) | {(x + 1, y + 2)}


def zywoplot_ev(centra):
    """suchy zywoplot z zdarzen !$Bush_Bare_Hedge (3 kratki szerokosci): lista srodkow (x, y)"""
    out = set()
    for (x, y) in centra:
        e = K.zdarzenie_z(wzor_gr("!$Bush_Bare_Hedge"), x, y)
        out |= set(stopa(e))
    return out
# ================================================================== A. POLNOC  x26-101, y3-29
ID_SOSNY = [48, 52, 53, 54, 55, 57, 61]               # luzne sosny polnocy -> grupy
ID_JABLONIE = [58, 62, 63, 64, 65, 66, 60]            # sad (6 jablon + grusza)
ID_KRZAKI = [42, 51, 56, 92]
czysc(26, 3, 101, 29)
for y in range(3, 30):
    for x in range(26, 102):
        if K.kind(0, x, y) in (17, 24, 27): K.ground(x, y, 16)

# --- tory: glowny od drogi polnocnej do przerwy w plocie (73-75, 30), odnoga do pastwiska
M_GL = tor([(105.6, 20.6), (97.0, 21.8), (89.0, 23.2), (82.0, 25.6), (77.0, 28.2), (74.4, 30.8)], 3.4, 211)
M_BR = tor([(79.0, 27.2), (64.0, 27.0), (50.0, 25.8), (42.0, 23.6), (37.0, 20.4), (34.9, 17.0)], 3.2, 212)
M_PL = K.blob(34.8, 17.2, 3.1, 2.0, 214, 0.12)          # wydeptany placyk przed brama pastwiska
M_TOR = {c for c in (M_GL | M_BR | M_PL) if 26 <= c[0] <= 105 and 3 <= c[1] <= 30}
for (x, y) in M_TOR:
    K.ground(x, y, 17)
    if K.g(1, x, y): K.over(x, y, 0)
ZK = set(); ZT = set()
def zajmij(S, m=0):
    global ZK
    ZK |= {(x + a, y + b) for (x, y) in S for a in range(-m, m + 1) for b in range(-m, m + 1)}
def pod_plotem(S, n=3):
    global ZT
    ZT |= {(x + a, y + b) for (x, y) in S for a in (-1, 0, 1) for b in range(-1, n + 1)}
zajmij(M_TOR, 1)

rodz_kw0 = [696, 704, 716]
# --- pastwisko: plot z brama od toru, slupki bramy
PAST = (28, 5, 41, 15)
brama = [(34, PAST[3]), (35, PAST[3])]
K.plot(*PAST, bramy=brama)
K.kafel(33, PAST[3], 209, z=3); K.kafel(36, PAST[3], 208, z=3)
PLOT_C = {(x, y) for x in range(PAST[0], PAST[2] + 1) for y in (PAST[1], PAST[3])} | {(x, y) for y in range(PAST[1], PAST[3] + 1) for x in (PAST[0], PAST[2])}
zajmij(PLOT_C, 1); pod_plotem(PLOT_C, 3)
K.dekor(lambda x, y: 1.0 if (PAST[0] + 1 <= x <= PAST[2] - 1 and PAST[1] + 1 <= y <= PAST[3] - 1) else 0.0, [PAPROCIE, [734, 735], KAMYKI, rodz_kw0], 7, 471, (PAST[0] + 1, PAST[1] + 1, PAST[2] - 1, PAST[3] - 1), occ=K.zajete(), zakazane=PLOT_C, ile=(1, 3), promien=1.2, odstep=3.5)
zajmij(prostokat(PAST[0], PAST[1], PAST[2], PAST[3]), 0)
K.plama(K.blob(32.5, 8.8, 3.4, 2.0, 221, 0.3), 27, 0, tylko_na={16})
K.plama(K.blob(38.2, 11.2, 2.6, 1.7, 222, 0.3), 27, 0, tylko_na={16})

# --- sad: 7 drzew w dwoch rzedach, zywoplot od polnocy i zachodu (z przerwami)
rzad = [(46, 16), (50, 16), (54, 16), (58, 16), (48, 20), (52, 20), (56, 20)]
for eid, (x, y) in zip(ID_JABLONIE, rzad):
    K.przenies(eid, x, y)
H_SAD_N = zywoplot_ev([(46, 12), (50, 12)])
H_SAD_W = set()
zajmij(H_SAD_N | H_SAD_W, 1); pod_plotem(H_SAD_N | H_SAD_W, 3)
K.plama(K.blob(52, 18, 7.0, 3.6, 231, 0.3) - M_TOR, 27, 0, tylko_na={16})

# --- pola: pasy upraw (rozna dlugosc, nie siatka), miedze 2 kratki
POLA = []
for (spec, uprawa, sd) in [((63, 10, 79, 14), [278, 279, 278, 279], 301), ((61, 16, 77, 20), [285, 286, 287, 286], 302),
                           ((83, 10, 93, 14), [277, 285, 277], 303), ((81, 16, 96, 20), [], 304)]:
    M, cr = pole_ornej(*spec, uprawa, sd, rzedy=[spec[1] + 1, spec[1] + 3])
    POLA.append((M, cr)); zajmij(M, 1); ZT |= {(x + a, y + b) for (x, y) in M for a in (-1, 0, 1) for b in range(-1, 3)}
H_POLA = zywoplot_ev([(66, 8), (75, 8)])
zajmij(H_POLA, 1); pod_plotem(H_POLA, 3)

# --- stogi siana
STOGI = [siano(97, 9), siano(98, 15)]
for S in STOGI: zajmij(S, 1)
ZT |= set().union(*STOGI)

# --- kepy
SOSNY_ID = list(ID_SOSNY); KR_ID = list(ID_KRZAKI)
def sosny(n): return [SOSNY_ID.pop(0) for _ in range(min(n, len(SOSNY_ID)))]
def krzaki(n, nowe=()): return [KR_ID.pop(0) for _ in range(min(n, len(KR_ID)))] + [wzor_gr(g) for g in nowe]
ZKD = lambda: ZK | ZT
def kepa(nazwa, c, rx, ry, bb, drzewa, krz, seed, polana=None, min_d=2.1):
    f = K.gestosc(c[0], c[1], rx, ry, seed, rough=0.3, spadek=0.5, polana=polana)
    K.sadz(drzewa, f, seed + 1, min_d=min_d, occ=K.zajete(), zakazane=ZKD(), bbox=bb, prog=0.03)
    K.plama(K.blob(c[0], c[1], rx - 0.8, ry - 0.5, seed + 2, 0.3) - M_TOR, 27, 0, tylko_na={16})
    fk = K.gestosc(c[0], c[1], rx + 2, ry + 1.3, seed + 3, polana=(polana[0], polana[1], polana[2] + .3, polana[3] + .2) if polana else None)
    K.sadz(krz, fk, seed + 4, min_d=2.2, occ=K.zajete(), zakazane=ZKD(), bbox=bb, kol_dy=0)
kepa("C1", (56.5, 6.8), 6.6, 3.4, (48, 3, 65, 11), sosny(2) + [wzor_gr("!$Pine_A"), wzor_gr("!$Pine_C"), wzor_gr("!$Tree_Small"), wzor_gr("!$Tree_Small")], krzaki(1, ("!$Bush_Bare_Big",)), 411, polana=(57, 7.0, 1.8, 1.2))
kepa("C2", (90.5, 6.0), 7.0, 3.3, (80, 3, 100, 10), sosny(3) + [wzor_gr("!$Pine_B"), wzor_gr("!$Pine_C"), wzor_gr("!$Tree_Small")], krzaki(1, ("!$Bush_Bare_Thicket",)), 421, polana=(91, 6.4, 2.0, 1.2), min_d=1.9)
kepa("C3", (29.5, 25.2), 4.6, 3.6, (26, 20, 36, 29), sosny(2) + [wzor_gr("!$Pine_B"), wzor_gr("!$Pine_C"), wzor_gr("!$Tree_Small")], krzaki(1, ("!$Bush_Bare_Vines",)), 431, polana=(30, 25.6, 1.8, 1.4))
for i_ in KR_ID: pass
# punkt orientacyjny przy torze: glazy + martwe drzewo (66-70, 21-24)
for (g, x, y) in [("!$Rock_Huge", 66, 23), ("!$Rock_Mound", 69, 24)]:
    K.zdarzenie_z(wzor_gr(g), x, y)
K.plama(K.blob(67.5, 23.2, 4.4, 2.0, 441, 0.3) - M_TOR, 27, 0, tylko_na={16})
zajmij({(66, 23), (69, 24)}, 1)

# --- drobiazgi z kafli
rodz_kw = lambda r: KWIATY[r.choice(list(KWIATY))]
f_all = lambda x, y: 1.0 if (26 <= x <= 100 and 3 <= y <= 29) else 0.0
K.dekor(f_all, rodz_kw, 14, 451, (27, 4, 100, 28), occ=K.zajete(), zakazane=ZK, ile=(3, 4), promien=1.5, odstep=5.5)
K.dekor(f_all, [KAMYKI], 8, 452, (27, 4, 100, 28), occ=K.zajete(), zakazane=ZK, ile=(1, 2), promien=1.2, odstep=6.0)
K.dekor(f_all, [PAPROCIE], 10, 453, (27, 4, 100, 28), occ=K.zajete(), zakazane=ZK, ile=(1, 2), promien=1.2, odstep=5.0)
# zdarzenia z toru / zywoplotow / pol precz
K.zejdz_z(M_TOR | H_SAD_N | H_SAD_W | H_POLA)

# ================================================================== B. POLUDNIE  x34-105, y98-116
WYBIEG = prostokat(33, 109, 57, 119) | prostokat(29, 108, 32, 119)                     # wybieg (krok 4) + margines: nie ruszac
glin = {(x, y) for x in range(62, 70) for y in range(101, 107) if K.kind(1, x, y) == 26}
wys = {(x, y) for x in range(85, 97) for y in range(100, 106) if K.kind(1, x, y) == 47}
for (x, y) in [(94, 101), (94, 102), (94, 104), (94, 105), (87, 104)]:
    K.kafel(x, y, 0, 2)                                  # luzne beczki, kola, skrzynie wysypiska precz
for y in range(98, 117):
    for x in range(27, 111):
        if x > 105 and y < 106: continue
        if x < 34 and y > 106: continue
        if (x, y) in WYBIEG or (x, y) in glin or (x, y) in wys: continue
        if K.kind(0, x, y) in (17, 24, 27, 26): K.ground(x, y, 16)
        if K.kind(1, x, y) in (21, 31, 36, 39, 47, 26, 29, 38) and K.kind(1, x, y) != 38: K.over(x, y, 0)
for (x, y) in glin | wys: K.ground(x, y, 17)
K.usun(432)                                              # lopata przy glinie

T1 = tor([(59.2, 96.4), (59.8, 99.4), (61.4, 101.8), (64.0, 103.2)], 3.4, 511)
T2 = tor([(60.4, 100.8), (51.0, 101.4), (42.0, 102.6), (36.0, 103.6), (32.6, 105.0), (31.4, 107.6)], 3.2, 512)
T3 = tor([(62.0, 100.6), (71.0, 100.2), (79.0, 101.2), (85.0, 102.4), (90.0, 103.2)], 3.0, 513)
T5 = plac((104.2, 116.2), 4.2, 2.6, 518, 0.1)
T4 = tor([(76.4, 100.8), (76.0, 105.0), (73.8, 108.8), (71.8, 112.0), (71.2, 114.0)], 2.9, 514)
Mglin = plac((66.2, 103.8), 5.2, 3.5, 515, 0.12)
Mwys = plac((90.8, 103.0), 6.6, 4.0, 516, 0.12)
Mhay = K.blob(71.3, 114.4, 3.2, 2.1, 517, 0.12)
M_T = {c for c in (T1 | T2 | T3 | T4 | T5 | Mglin | Mwys | Mhay) if 29 <= c[0] <= 110 and 98 <= c[1] <= 119 and c not in WYBIEG and not (c[1] >= 117)}
for (x, y) in M_T:
    K.ground(x, y, 17)
    if K.g(1, x, y) and (x, y) not in glin and (x, y) not in wys: K.over(x, y, 0)
ZS = set(); ZST = set()
def zajmij_s(S, m=0):
    global ZS
    ZS |= {(x + a, y + b) for (x, y) in S for a in range(-m, m + 1) for b in range(-m, m + 1)}
def pod_s(S, n=3):
    global ZST
    ZST |= {(x + a, y + b) for (x, y) in S for a in (-1, 0, 1) for b in range(-1, n + 1)}
zajmij_s(M_T, 1); zajmij_s(WYBIEG, 0)
ZS |= {(x, y) for y in range(117, 120) for x in range(0, 120)}
# zywoplot wzdluz toru zachodniego (od paddocku): ciagly, jedna przerwa
H_PD = zywoplot_ev([(40, 106)])
zajmij_s(H_PD, 1); pod_s(H_PD, 3)
UG1 = set()
# stogi
STG_S = [siano(77, 110), siano(60, 112)]
for S in STG_S: zajmij_s(S, 1); pod_s(S, 0)
# kepy poludnia
SOSNY2 = []
def kepa_s(c, rx, ry, bb, drzewa, krz, seed, polana=None, min_d=2.1):
    f = K.gestosc(c[0], c[1], rx, ry, seed, rough=0.3, spadek=0.5, polana=polana)
    K.sadz(drzewa, f, seed + 1, min_d=min_d, occ=K.zajete(), zakazane=ZS | ZST, bbox=bb, prog=0.03)
    K.plama(K.blob(c[0], c[1], rx - 0.8, ry - 0.4, seed + 2, 0.3) - M_T, 27, 0, tylko_na={16})
    fk = K.gestosc(c[0], c[1], rx + 2, ry + 1.3, seed + 3, polana=(polana[0], polana[1], polana[2] + .3, polana[3] + .2) if polana else None)
    K.sadz(krz, fk, seed + 4, min_d=2.2, occ=K.zajete(), zakazane=ZS | ZST, bbox=bb, kol_dy=0)
kepa_s((90.0, 113.2), 6.5, 3.3, (82, 109, 99, 116), [wzor_gr("!$Pine_A"), wzor_gr("!$Pine_B"), wzor_gr("!$Pine_C"), wzor_gr("!$Tree_Small"), wzor_gr("!$Tree_Small")], [wzor_gr("!$Bush_Bare_Thicket")], 611, polana=(90, 113.4, 1.8, 1.1))

# punkty: glaz Skala (78,105) zostaje; kamyki, kwiaty, paprocie
f_s = lambda x, y: 1.0 if (34 <= x <= 105 and 98 <= y <= 116) else 0.0
K.dekor(f_s, rodz_kw, 8, 631, (36, 99, 104, 116), occ=K.zajete(), zakazane=ZS, ile=(3, 4), promien=1.5, odstep=6.0)
K.dekor(f_s, [KAMYKI], 8, 632, (36, 99, 104, 116), occ=K.zajete(), zakazane=ZS, ile=(1, 2), promien=1.2, odstep=6.0)
K.dekor(f_s, [PAPROCIE], 8, 633, (36, 99, 104, 116), occ=K.zajete(), zakazane=ZS, ile=(1, 2), promien=1.2, odstep=5.0)
# zdarzenia z torow, ugoru, stogow, zywoplotu precz
K.zejdz_z(M_T | H_PD | UG1 | set().union(*STG_S))

# ------------------------------------------------------------------ last look: nic wysokiego na plocie/zywoplocie, za pniem, na innym drzewie
def _img(e): return e["pages"][0]["image"]["characterName"]
def _tree(e): return _img(e).startswith(("!$Pine", "!$Tree"))
ZONY = [(26, 3, 101, 29), (29, 98, 110, 116)]
def w_zonie(e): return any(a <= e["x"] <= c and b <= e["y"] <= d for (a, b, c, d) in ZONY)
def _oddal(e):
    occ = K.zajete(pomin={e["id"]}); best = None
    inne = [t for t in K.eventy() if _tree(t) and t["id"] != e["id"]]
    tall = [t for t in K.eventy() if _img(t) in ("!$Stump_Tall", "!$Trunk_Dead")]
    zak = ZK | ZT | ZS | ZST
    for r in range(2, 10):
        for dy in range(-r, r + 1):
            for dx in range(-r, r + 1):
                if max(abs(dx), abs(dy)) != r or best: continue
                x, y = e["x"] + dx, e["y"] + dy
                if not any(a <= x <= c and b <= y <= d for (a, b, c, d) in ZONY) or (x, y) in occ or (x, y) in zak: continue
                if K.kind(0, x, y) not in (16, 27) or K.kind(1, x, y) not in (None, 21, 46) or K.g(2, x, y) or K.g(3, x, y): continue
                if any(math.hypot(t["x"] - x, t["y"] - y) < 2.6 for t in inne): continue
                if any(abs(t["x"] - x) <= 1 and -1 <= t["y"] - y <= 3 for t in tall): continue
                best = (x, y)
        if best: break
    if best: K.przenies(e["id"], *best)
    else: K.log.append("BRAK MIEJSCA: %d %s (%d,%d)" % (e["id"], e["name"], e["x"], e["y"]))
for e in [t for t in K.eventy() if _tree(t) and w_zonie(t)]:
    if (e["x"], e["y"]) in ZT or (e["x"], e["y"]) in ZST: _oddal(e)
for s_ in [t for t in K.eventy() if _img(t) in ("!$Stump_Tall", "!$Trunk_Dead")]:
    for e in [t for t in K.eventy() if _tree(t)]:
        if abs(e["x"] - s_["x"]) <= 1 and -1 <= e["y"] - s_["y"] <= 0: _oddal(e)
_d = [t for t in K.eventy() if _tree(t) and w_zonie(t)]
for i_, a_ in enumerate(_d):
    for b_ in _d[i_ + 1:]:
        if abs(a_["x"] - b_["x"]) <= 1 and abs(a_["y"] - b_["y"]) <= 1: _oddal(b_)

if __name__ == "__main__":
    p = K.zapisz()
    print(p, "zdarzen:", K.liczba(), "(przed %d)" % EV0)
    print("\n".join(l for l in K.log if l.startswith(("BRAK", "nie zszedl"))))
