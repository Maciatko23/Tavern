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
