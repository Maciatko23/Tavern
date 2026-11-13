# -*- coding: utf-8 -*-
"""Krok 5 - Map162 'Garnizon nad zatoka' (tileset 11, 120x120): krajobraz na pustych lakach.
Wschod (x76-116, y58-98): wybieg + pole strzelnicy + szlak patrolu, laka sianokosna, kepy drzew; zachod (x15-31, y64-95): zagajnik na opal z polana;
poludnie (x56-116, y99-116): laka sianokosna ze stogami, kepy sosen.  Zapis TYLKO do tools/poprawki_krok5/mapy/162/staging/data.
  python tools/poprawki_krok5/mapy/162/plan_162.py"""
import os, sys, math, random, json
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "poprawki_krok5"))
import numpy as np
import cv2
import krajobraz as KR
from krajobraz import TYP_GRAFIKA, RZECZY_DRZEWNE, KWIATY, KAMYKI, stopa
import mapylib as L
KR.STG = os.path.join(HERE, "staging", "data")

# --- rodzaje zdarzen tej mapy: drzewa to !$Big_Trees_scinane (3 odmiany), reszta jak w Map003/Map004
def klasa162(e):
    im = e["pages"][0]["image"]; nm = im["characterName"]
    if nm == "!$Big_Trees_scinane": return "sosnaB"
    if nm == "!$Tree_Small": return "male"
    if nm == "!$Tree_Apple": return "jablon"
    if nm == "!$Tree_Pear": return "grusza"
    if nm == "!$Trunk_Dead": return "martwe"
    if nm == "!$Stump_Tall": return "pieniekW"
    if nm.startswith("!$Bush_Bare"): return "krzak"
    if nm.startswith("!$Rock") or nm == "!$Boulder_A": return "skala"
    if nm == "" and im["tileId"] == 516: return "pieniek"
    if nm == "" and im["tileId"] == 678: return "kloda"
    return None
KR.klasa = klasa162
klasa = klasa162

K = KR.Krajobraz(162)
W_, H_ = K.W, K.H
rng = random.Random(1620)
ORIG = K.orig["events"]


def smooth(t): t = np.clip(t, 0, 1); return t * t * (3 - 2 * t)


def kinds0():
    k = np.full((H_, W_), -1, int)
    for y in range(H_):
        for x in range(W_):
            t = K.g(0, x, y)
            if 2048 <= t < 8192: k[y, x] = (t - 2048) // 48
    return k
KIND0 = kinds0()

# ---------------------------------------------------------------- obszary wlasne (reszta mapy nietknieta)
OWN = np.zeros((H_, W_), bool)
OWN[58:117, 76:117] = True          # wschod + poludnie (x76-116, y58-116)
OWN[99:117, 56:76] = True           # poludnie na zachod od x76
OWN[64:96, 15:32] = True            # zachodnia laka
OWN[59:99, 32:76] = True            # laka srodkowa (rozszerzenie koordynatora)
OWN[99:117, 32:56] = True           # poludniowo-zachodni rog laki
OWN[34:64, 15:44] = True            # zachodnia strona palisady (runda 3)
OWN[28:58, 80:117] = True           # polnocny wschod (runda 3)
OWN[96:107, 15:37] = True           # pas przy dawnej zatoczce (runda 3)
# nie ruszamy: droga poludniowa (x106-108, y99-119), sciezka bramy (57-59, 58-63), pasy krawedzi (3 kratki), morze, wybrzeze
PROT = np.zeros((H_, W_), bool)
PROT[99:120, 106:109] = True       # (droga poludniowa x106-108)
PROT[58:64, 57:60] = True          # sciezka poludniowej bramy (x57-59, y58-63)
OWN &= ~(KIND0 == 6)
OWN[:, :3] = False; OWN[:, 117:] = False; OWN[:3, :] = False; OWN[117:, :] = False
GROUND = np.isin(KIND0, (16, 17, 24, 27))
OWN_G = OWN.copy()
OWN_G &= ~(KIND0 == 6)
_unB = (~OWN_G) & ((KIND0 == 17) | (KIND0 == 24)) | PROT & (KIND0 == 24)
_unD = (~OWN_G) & (KIND0 == 27)
distB = cv2.distanceTransform((~_unB).astype(np.uint8), cv2.DIST_L2, 3)   # odleglosc od najblizszej obcej kratki ziemi
distD = cv2.distanceTransform((~_unD).astype(np.uint8), cv2.DIST_L2, 3)


def blur(a, s):
    k = int(s * 6) | 1
    return cv2.GaussianBlur(a.astype(np.float32), (k, k), s, borderType=cv2.BORDER_REPLICATE)


# ---------------------------------------------------------------- projekt: maski (zbiory kratek)
def P(*pts):                      # punkty w kratkach (srodek kratki = +0.5)
    return [(x + 0.5, y + 0.5) for (x, y) in pts]

TRASA_A = P((58, 63), (59.8, 66.2), (64.5, 69.0), (70.5, 67.6), (76.5, 66.6), (82.5, 69.4), (88.5, 69.0), (94.5, 66.8), (101, 66.4), (107, 68.6), (113, 69.6),
            (115.6, 72.6), (115.4, 76.2), (113.8, 80.4), (113.2, 84.8), (115.0, 89.2), (114.4, 93.4), (111, 96.4), (107.8, 98.2), (107, 100.2))
TRASA_B = P((107.5, 97), (101, 95.6), (95, 95.8), (89.5, 94.6), (84.5, 93.0), (80.4, 90.6), (77.2, 88.4), (71.0, 90.6), (64.0, 89.2), (57.0, 91.4), (50.5, 90.0), (44.0, 89.6), (38.5, 88.0), (34.0, 87.6))
SZ_TR = 2.9


def build_masks():
    D = {}
    D["trasa_a"] = K.droga_maska(TRASA_A, SZ_TR, seed=201, szum=0.18)
    D["trasa_b"] = K.droga_maska(TRASA_B, SZ_TR - 0.2, seed=202, szum=0.18)
    D["apron"] = K.blob(58.5, 64.6, 7.4, 2.8, 215, 0.2, kat=0.0)
    D["trasa_w"] = K.droga_maska(P((38.6, 33.0), (38.0, 38), (37.2, 43), (36.4, 48), (35.6, 53), (34.6, 58), (35.2, 61.4), (39.0, 63.4), (44.5, 64.6), (51, 64.9)), 3.0, seed=261, szum=0.2)
    D["trasa_l"] = K.droga_maska(P((36.4, 50.4), (32.0, 51.2), (28.6, 51.5)), 2.5, seed=262, szum=0.12, zwez_koniec=0.2)
    D["ladowanie"] = K.blob(27.6, 51.4, 2.0, 1.6, 263, 0.15)
    D["trasa_e"] = K.droga_maska(P((116.0, 29.0), (115.6, 36), (116.0, 44), (115.8, 52), (115.0, 58.5), (113.6, 64), (113.2, 69.4)), 3.8, seed=264, szum=0.2)
    D["strzelnica"] = K.blob(100.5, 76.3, 10.8, 4.7, 211, 0.18, kat=0.05)
    D["strzelnica_wej"] = K.droga_maska(P((96, 66.8), (96.8, 70.5), (96.6, 73.8), (96.8, 76.5)), 2.4, seed=212, szum=0.1)
    return D
MASK = build_masks()


# ---------------------------------------------------------------- grunt: wszystko na trawe, potem projekt
BROWN_D = set(); DARK_D = set(); GRASS_FORCE = set()
for k_ in ("trasa_a", "trasa_b", "strzelnica", "strzelnica_wej", "apron", "trasa_w", "trasa_l", "ladowanie", "trasa_e"): BROWN_D |= MASK[k_]


def apply_ground(brown_extra=(), dark_extra=(), grass_force=()):
    brown_extra = set(brown_extra) | BROWN_D; dark_extra = set(dark_extra) | DARK_D; grass_force = set(grass_force)
    Bex = blur((KIND0 == 17) | (KIND0 == 24), 1.3)
    Dex = blur(KIND0 == 27, 1.6)
    nzd = np.array([[(K.fbm(x, y, 778, 6.0) - 0.5) * 2 for x in range(W_)] for y in range(H_)])
    fadeB = 1 - smooth((distB + 7.0 * nzd) / 6.0); fadeD = 1 - smooth(distD / 8.0)
    # kept (existing) earth: noise on the edge so no straight old borders survive, then rounded
    keep = set()
    for y in range(H_):
        for x in range(W_):
            if not (OWN_G[y, x] and GROUND[y, x]) or PROT[y, x]: continue
            b = Bex[y, x]
            nz = (K.fbm(x, y, 777, 5.0) - 0.5) * 2
            if (b * fadeB[y, x] + 0.42 * nz * 4 * b * (1 - b) * fadeB[y, x]) > 0.5: keep.add((x, y))
    outside = {(x, y) for y in range(H_) for x in range(W_) if _unB[y, x] and any(OWN_G[min(H_ - 1, max(0, y + b)), min(W_ - 1, max(0, x + a))] for a in (-2, -1, 0, 1, 2) for b in (-2, -1, 0, 1, 2))}
    keep = {c for c in K.gladko(K.okraglij(keep | outside, 1.0)) if OWN_G[c[1], c[0]] and GROUND[c[1], c[0]]}
    allb = (keep | brown_extra) - grass_force
    allb = {c for c in allb if OWN_G[c[1], c[0]] and not PROT[c[1], c[0]]}
    keep = {c for c in K.lam(K.gladko(K.okraglij(allb | outside, 0.9)), 4) if OWN_G[c[1], c[0]] and GROUND[c[1], c[0]] and not PROT[c[1], c[0]]} - grass_force
    brown_extra = set()
    changed = 0
    for y in range(H_):
        for x in range(W_):
            if not (OWN_G[y, x] and GROUND[y, x]) or PROT[y, x]: continue
            c = (x, y)
            if c in grass_force: k = 16
            elif y == 58 and KIND0[57, x] in (17, 24) and c not in brown_extra and c not in keep: k = 24
            elif c in brown_extra or c in keep: k = 24
            elif OWN[y, x] and (c in dark_extra or Dex[y, x] * fadeD[y, x] > 0.5): k = 27
            elif not OWN[y, x] and KIND0[y, x] == 27: k = 27
            else: k = 16
            K.ground(x, y, k); changed += 1
    for y in range(H_):
        for x in range(W_):
            if not ((OWN[y, x]) or (62 <= x <= 116 and 58 <= y <= 116)): continue
            if K.kind(1, x, y) in (26, 47): K.over(x, y, 0)
            if 96 <= y <= 106 and x <= 36 and K.kind(1, x, y) == 39: K.over(x, y, 0)
    return changed


# ---------------------------------------------------------------- stale miejsca (czasem w grze): zostaja wolne
KEEP_FREE = set()
for (x0, y0, x1, y1) in ((93, 72, 108, 80),):                     # strzelnica (x95-106 y74-78) z zapasem
    KEEP_FREE |= {(x, y) for x in range(x0, x1 + 1) for y in range(y0, y1 + 1)}
for (cx, cy) in ((36, 50), (34, 51), (36, 51), (39, 46), (27, 51), (38, 34), (24, 71), (24, 74), (24, 86), (82, 69), (113, 69), (117, 89), (87, 94), (96, 77), (95, 74), (97, 74), (97, 78)):
    KEEP_FREE |= {(cx + a, cy + b) for a in (-1, 0, 1) for b in (-1, 0, 1)}


def dil(S, r=1): return {(x + a, y + b) for (x, y) in S for a in range(-r, r + 1) for b in range(-r, r + 1)}
def rect(x0, y0, x1, y1): return {(x, y) for x in range(x0, x1 + 1) for y in range(y0, y1 + 1)}


# ---------------------------------------------------------------- wybieg z plotem
PAST = (95, 82, 111, 92)
BRAMA = [(101, 92), (102, 92)]
PAST_IN = rect(PAST[0] + 1, PAST[1] + 1, PAST[2] - 1, PAST[3] - 1)
PAST_ALL = rect(*PAST)
TRODDEN = {c for c in K.blob(101.9, 90.3, 3.8, 3.0, 221, 0.2, kat=0.0) if c[1] <= 92 and (c[1] < 92 or c[0] in (101, 102))}
SPUR = K.droga_maska(P((101.5, 91.5), (101.3, 93.6), (101.0, 95.6)), 2.5, seed=222, szum=0.08)
# laka sianokosna na poludniu: sciezka do klepiska i stogi
SPUR_H = K.droga_maska(P((91.4, 95.2), (91.6, 98.0), (91.3, 100.4)), 2.5, seed=231, szum=0.1)
KLEPISKO = K.blob(91.4, 102.2, 3.6, 2.3, 232, 0.16, kat=0.1)
HAY = [(107, 84), (85, 99), (97, 99), (91, 106)]       # lewe-gorne rogi stogow 3 x 3 (3 + straw)
HAY_CELLS = set()
for (hx, hy) in HAY: HAY_CELLS |= rect(hx, hy, hx + 2, hy + 2)
# zagajnik na opal (zachod): polana, sciezka z poludniowego wschodu i na polnoc do brzegu
CL_W = K.blob(27.4, 79.9, 3.8, 2.9, 241, 0.2, kat=0.3)
SC_W1 = K.droga_maska(P((34, 87.5), (31.2, 85.0), (28.6, 82.6), (27.0, 80.6)), 2.5, seed=242, szum=0.1)
SC_W2 = K.droga_maska(P((27.2, 77.6), (25.4, 75.0), (24.2, 72.4), (24.8, 69.8), (26.8, 67.9)), 2.5, seed=243, szum=0.3, zwez_koniec=0.25)
LANE = {c for c in (K.blob(116.4, 88.6, 3.6, 8.4, 251, 0.12, kat=1.5707) | {(x, y) for x in range(114, 117) for y in range(83, 94)}) if c[0] >= 114}
BROWN_X = LANE | TRODDEN | SPUR | SPUR_H | KLEPISKO | CL_W | SC_W1 | SC_W2
# ciemniejsza trawa (miekkie plamy) pod kepami i na lace
DARK_X = set()
_dOWN = cv2.distanceTransform(OWN.astype(np.uint8), cv2.DIST_L2, 3)
def dark_blob(cx, cy, rx, ry, seed):
    """miekka plama ciemniejszej trawy w calosci wewnatrz obszaru wlasnego (bez prostego ciecia na jego brzegu)"""
    for _ in range(14):
        b = K.blob(cx, cy, rx, ry, seed, 0.3)
        if b and all(_dOWN[y, x] >= 2.5 for (x, y) in b): return b
        rx *= 0.93; ry *= 0.93
    return set()
for i, (cx, cy, rx, ry) in enumerate([(88, 63.5, 5.5, 2.5), (108.5, 62.5, 7.0, 3.6), (110.6, 74.6, 4.0, 4.0), (85, 81.5, 4.8, 2.8), (66, 109, 7.6, 4.8),
                                      (82.5, 109.5, 6.2, 4.0), (98.5, 110.3, 6.8, 4.6), (28.5, 79.5, 5.6, 6.6), (60, 102, 4.4, 2.2), (77, 100, 3.8, 2.2),
                                      (79.5, 77, 5.0, 3.0), (80.5, 87, 4.2, 2.4), (92, 75.5, 3.0, 2.0), (40, 73, 5.0, 2.6), (52, 77, 5.0, 3.0), (68, 83, 3.8, 2.4), (60, 71, 3.6, 2.0), (29, 44, 4.4, 4.2), (28, 57, 4.0, 2.6), (88, 40, 5.0, 2.8), (100, 48, 5.0, 2.6), (90, 52, 4.0, 2.2), (103, 31.5, 4.0, 2.0), (28, 101, 4.0, 2.0)]):
    DARK_X |= dark_blob(cx, cy, rx, ry, 300 + i)
DARK_X -= (BROWN_D | BROWN_X)


def haystack(x, y):
    for i, t in enumerate((213, 214, 215)): K.kafel(x + i, y, 256 + t, 3)
    for i, t in enumerate((221, 222, 223)): K.kafel(x + i, y + 1, 256 + t, 3)
    # solid middle (C478) one layer down under a blank starred tile (B751): Cienie.js would otherwise throw a hard box shadow; still blocks walking
    K.kafel(x + 1, y + 1, 256 + 222, 2); K.kafel(x + 1, y + 1, 751, 3)   # (no detached straw row below)


# ---------------------------------------------------------------- zdarzenia: wzory z istniejacych zdarzen tej mapy
PINES = [150, 219, 95]; OAKS = [199, 156, 151, 172, 184, 169]
def wz(i): return ORIG[i]
def tree_new(rg): return wz(rg.choice(PINES + OAKS))


def build():
    # uprzatniecie dawnych drobnych kafli D w obszarze wlasnym
    for y in range(H_):
        for x in range(W_):
            if OWN[y, x]:
                for z in (2, 3):
                    if 512 <= K.g(z, x, y) < 768: K.s(z, x, y, 0)
    fence_zone = dil(PAST_ALL, 1) | HAY_CELLS
    apply_ground(brown_extra=BROWN_X, dark_extra=DARK_X, grass_force=fence_zone - BROWN_X)
    K.plot(*PAST, bramy=BRAMA)
    for (hx, hy) in HAY: haystack(hx, hy)
    K.kafel(100, PAST[3], 209, 3); K.kafel(103, PAST[3], 208, 3)       # gate ends on the horizontal run: B209 left of the gap, B208 right of it
    return fence_zone


def events(fence_zone):
    br = BROWN_D | BROWN_X
    ZK = dil(br, 1) | dil(PAST_ALL, 1) | dil(HAY_CELLS, 1) | KEEP_FREE | {(x, y) for x in range(116, 120) for y in range(H_)} | {(x, y) for x in range(0, 17) for y in range(H_)} | {(x, y) for x in range(17, 23) for y in range(30, 110)}
    K.zejdz_z(br | PAST_ALL | HAY_CELLS)
    R = random.Random(77)
    def grp(cx, cy, rx, ry, ids, new, seed, polana=None, min_d=2.6, spadek=0.5, prog=0.03):
        items = list(ids) + [tree_new(R) for _ in range(new)]
        f = K.gestosc(cx, cy, rx, ry, seed, rough=0.3, spadek=spadek, polana=polana)
        bb = (int(cx - rx - 1), int(cy - ry - 1), int(cx + rx + 1), int(cy + ry + 1))
        res = K.sadz(items, f, seed + 1, min_d=min_d, occ=K.zajete(), zakazane=ZK, bbox=bb, prog=prog)
        got = {e["id"] for e in res}
        for i in ids:                                       # drzewo, ktore sie nie zmiescilo: zdejmujemy (bez kopii, nic nie ginie z zasobow)
            if i not in got and (K.ev[i]["x"], K.ev[i]["y"]) in ZK: K.usun(i)
        return res
    def prop(wzor, x, y, bez=()):
        """zdarzenie-rekwizyt na najblizszej wolnej kratce (trawa/ziemia, nie plot, nie strefy stale)"""
        occ = K.zajete(); best = None
        for r in range(0, 4):
            for dy in range(-r, r + 1):
                for dx in range(-r, r + 1):
                    if max(abs(dx), abs(dy)) != r or best: continue
                    xx, yy = x + dx, y + dy
                    if (xx, yy) in KEEP_FREE or (xx, yy) in HAY_CELLS or (xx, yy) in PAST_ALL or not OWN[yy, xx]: continue
                    if K.kind(0, xx, yy) not in (16, 24, 27) or K.g(2, xx, yy) or K.g(3, xx, yy): continue
                    if any((xx + a, yy + b) in occ for a in (-1, 0, 1) for b in (-1, 0, 1)): continue
                    if any(_tree(t) and abs(t["x"] - xx) <= 1 and -1 <= t["y"] - yy <= 3 for t in K.eventy()): continue
                    best = (xx, yy)
            if best: break
        if best: return K.zdarzenie_z(wzor, *best)
        K.log.append("BRAK MIEJSCA na rekwizyt (%d,%d)" % (x, y))
    # --- wschod
    grp(108.5, 62.5, 6.4, 3.8, [165, 179, 211, 201, 172], 0, 401, polana=(108.5, 63, 2.0, 1.4))
    grp(111.2, 76.0, 3.0, 4.0, [151], 2, 402, min_d=2.4)
    K.przenies(169, 97, 86)                                   # dab w wybiegu: cien
    # punkt orientacyjny: martwe drzewo + glazy + dwa drzewa (zachod od strzelnicy)
    K.zdarzenie_z(wz(246), 84, 80)
    for (i, x, y) in ((332, 86, 83), (345, 82, 82), (270, 87, 85)): K.przenies(i, x, y)
    # zywoplot z krzakow wzdluz szlaku A od polnocy (nierowny, z przerwami)
    cA = K.krzywa(TRASA_A)
    def yA(xx): return min((c for c in cA), key=lambda c: abs(c[0] - xx))[1]
    for (bid, xx) in ((327, 84), (281, 88), (325, 91.5)):
        yy = int(round(yA(xx) - 3.2 + R.uniform(-0.6, 0.6)))
        occ = K.zajete(pomin={bid})
        for dy in (0, -1, 1, -2):
            c = (int(round(xx)), yy + dy)
            if c not in ZK and K.kind(0, *c) in (16, 27) and c not in occ and OWN[c[1], c[0]]:
                K.przenies(bid, *c); break
    # --- polnocny wschod: samotne drzewa w kepy
    grp(94.5, 33.5, 5.5, 3.6, [157, 225, 227], 0, 441)
    grp(108.5, 43.0, 5.0, 4.2, [217, 183, 213], 0, 442)
    # --- laka srodkowa: samotne drzewa w kepy
    grp(62.5, 77.0, 4.8, 5.0, [192, 204, 181], 0, 431)
    grp(37.0, 80.5, 4.2, 3.4, [194, 241], 0, 432)
    grp(60.5, 95.5, 5.0, 3.2, [197, 228, 238], 0, 433)
    grp(42.5, 95.5, 5.4, 3.0, [146, 234, 186], 0, 434)
    grp(37.5, 111.5, 5.0, 4.0, [164, 202, 216], 0, 435)
    grp(48.5, 109.5, 4.2, 3.6, [178, 242], 0, 436)
    # --- poludnie
    grp(66, 109, 6.8, 4.6, [196, 209, 198], 2, 411)
    grp(82.5, 109.5, 5.6, 3.8, [171, 248, 150, 200], 0, 412, polana=(83.5, 110.8, 2.4, 1.6))
    grp(101.5, 110, 6.6, 4.2, [170, 176, 182, 250, 214, 174], 0, 413, polana=(102, 109.3, 2.5, 1.8))
    grp(112.6, 106, 3.8, 6.4, [207, 244, 247, 184], 0, 414, min_d=3.0)
    # --- zachod
    grp(27.6, 79.5, 7.4, 8.2, [], 2, 421, polana=(27.4, 79.9, 3.6, 2.8), min_d=2.8)
    for (xx, yy) in ((25, 80), (29, 78)): prop(wz(363), xx, yy)           # pnie po scietych drzewach
    prop(wz(246), 27, 82)                                    # powalone pnie
    for (bid, xx, yy) in ((286, 24, 84), (290, 31, 76)): K.przenies(bid, xx, yy)
    # pnie w poludniowym zagajniku
    for (xx, yy) in ((80, 110),): prop(wz(363), xx, yy)
    return ZK


def decor(ZK):
    rodz_kw = lambda r: KWIATY[r.choice(list(KWIATY))]
    own = lambda x, y: 1.0 if OWN[y, x] else 0.0
    Z2 = ZK | PAST_ALL
    for (name, bbox, n, seed) in (("polnoc", (82, 58, 104, 67), 12, 501), ("wybieg_zach", (84, 74, 94, 92), 5, 502), ("siano_pd", (82, 97, 106, 106), 9, 503),
                                  ("zachod", (23, 66, 32, 95), 8, 504), ("pd_zach", (33, 100, 80, 116), 12, 505), ("wsch_droga", (109, 99, 116, 116), 5, 506), ("pd_wsch", (84, 106, 105, 116), 6, 507), ("srodek", (68, 70, 92, 92), 8, 508), ("srodek_zach", (33, 60, 56, 98), 9, 509), ("zach2", (23, 34, 36, 63), 8, 521), ("ne", (80, 28, 112, 57), 12, 522), ("sw_pas", (23, 96, 36, 106), 4, 523), ("srodek_wsch", (56, 66, 76, 98), 8, 510)):
        K.dekor(own, rodz_kw, n, seed, bbox, occ=K.zajete(), zakazane=Z2, ile=(3, 4), promien=1.6, odstep=3.6)
    for (bbox, n, seed) in (((80, 58, 116, 100), 10, 511), ((57, 99, 116, 116), 9, 512), ((23, 66, 32, 95), 4, 513)):
        K.dekor(own, [KAMYKI], n, seed, bbox, occ=K.zajete(), zakazane=Z2, ile=(1, 2), promien=1.2, odstep=5.0)


def _img(e): return e["pages"][0]["image"]["characterName"]
def _tree(e): return _img(e).startswith(("!$Big_Trees", "!$Tree"))


def last_look(ZK):
    def oddal(e):
        occ = K.zajete(pomin={e["id"]}); best = None
        inne = [t for t in K.eventy() if _tree(t) and t["id"] != e["id"]]
        tall = [t for t in K.eventy() if _img(t) in ("!$Stump_Tall", "!$Trunk_Dead")]
        for r in range(2, 10):
            for dy in range(-r, r + 1):
                for dx in range(-r, r + 1):
                    if max(abs(dx), abs(dy)) != r or best: continue
                    x, y = e["x"] + dx, e["y"] + dy
                    if not (4 <= x < K.W - 4 and 4 <= y < K.H - 4) or (x, y) in occ or (x, y) in ZK or not OWN[y, x]: continue
                    if K.kind(0, x, y) not in (16, 27) or K.kind(1, x, y) not in (None,) or K.g(2, x, y) or K.g(3, x, y): continue
                    if any(math.hypot(t["x"] - x, t["y"] - y) < 2.6 for t in inne): continue
                    if any(abs(t["x"] - x) <= 2 and -3 <= t["y"] - y <= 3 for t in tall): continue
                    best = (x, y)
            if best: break
        if best: K.przenies(e["id"], *best)
        else: K.log.append("BRAK MIEJSCA (last look): %d %s (%d,%d)" % (e["id"], e["name"], e["x"], e["y"]))
    # (1) 3 rzedy pod plotem
    for e in [t for t in K.eventy() if _tree(t)]:
        if PAST[0] - 1 <= e["x"] <= PAST[2] + 1 and PAST[3] < e["y"] <= PAST[3] + 3 and e["id"] not in (): oddal(e)
    # (2) wysokie pnie: nic za nimi
    for s_ in [t for t in K.eventy() if _img(t) in ("!$Stump_Tall", "!$Trunk_Dead")]:
        for e in [t for t in K.eventy() if _tree(t)]:
            if abs(e["x"] - s_["x"]) <= 2 and -3 <= e["y"] - s_["y"] <= 3: oddal(e)
    # (3) dwa drzewa nie dotykaja sie
    d = [t for t in K.eventy() if _tree(t) and OWN[t["y"], t["x"]]]
    for i_, a_ in enumerate(d):
        for b_ in d[i_ + 1:]:
            if abs(a_["x"] - b_["x"]) <= 1 and abs(a_["y"] - b_["y"]) <= 1: oddal(b_)


if __name__ == "__main__":
    fz = build()
    ZK = events(fz)
    decor(ZK)
    last_look(ZK)
    p = K.zapisz()
    print(chr(10).join(l for l in K.log if l.startswith(("BRAK", "nie zszedl", "usun"))))
    print("zapisane", p, "zdarzen:", K.liczba())
