# -*- coding: utf-8 -*-
"""Czesc 4 etapu 1 (ogon): nowe mapy brzegowe 914, 917, 920, 922, 923 (z maski swiata), Lesna droga 21 (+20/+20), morze w nowej czesci 125,
Polna droga 22 (+5 w prawo) z bramą E miasta. Wszystko na kopiach (staging/data). Wywoluje to zbuduj.py (main)."""
import os, sys, json, copy, math, random
import numpy as np
from PIL import Image
import zbuduj as Z
W = Z.W
K = Z.K
ROOT = Z.ROOT
MASKA = np.array(Image.open(os.path.join(ROOT, "docs", "mapy", "swiat_maska.png"))) > 127   # [y][x], 1 = lad


def lad(wx, wy):
    return 0 <= wy < MASKA.shape[0] and 0 <= wx < MASKA.shape[1] and bool(MASKA[wy][wx])


SWIAT = json.load(open(os.path.join(ROOT, "docs", "mapy", "swiat_uklad.json"), encoding="utf-8"))
def prost(mid):
    v = SWIAT["mapy"][str(mid)]
    return v["x0"], v["y0"], v["szer"], v["wys"]


def nazwa_mapy(mid): return SWIAT["mapy"][str(mid)]["nazwa"]


# ---------------------------------------------------------------- szablony zdarzen zasobow (z Przystani)
def szablony():
    m125 = Z.wczytaj(125)
    out = {}
    for e in m125["events"]:
        if e and e["pages"][0]["image"]["characterName"].startswith("!$") and e["pages"][0]["list"][0]["code"] != 201:
            out.setdefault(e["pages"][0]["image"]["characterName"], e)
    return out


def blur(a, r):
    k = 2 * r + 1
    p = np.pad(a, r, mode="edge")
    c = np.cumsum(np.cumsum(p, 0), 1)
    c = np.pad(c, ((1, 0), (1, 0)))
    return (c[k:, k:] - c[:-k, k:] - c[k:, :-k] + c[:-k, :-k]) / (k * k)


def dysk(cells, pts, r):
    for (px, py) in pts:
        for dy in range(-int(r) - 1, int(r) + 2):
            for dx in range(-int(r) - 1, int(r) + 2):
                if math.hypot(round(px) + dx - px, round(py) + dy - py) <= r: cells.add((round(px) + dx, round(py) + dy))
    return cells


def wygladz(pts, n=3):
    for _ in range(n):
        out = [pts[0]]
        for a, b in zip(pts, pts[1:]):
            out += [(a[0] * .75 + b[0] * .25, a[1] * .75 + b[1] * .25), (a[0] * .25 + b[0] * .75, a[1] * .25 + b[1] * .75)]
        out.append(pts[-1]); pts = out
    return pts


KIND = {'trawa': 16, 'plaza': 17, 'las': 20}   # rodzaje podloza nowych kratek (tileset 11 glowy: 24 / 25, bez lasu)


def teren(m, ox, oy, region, seed, wolne=(), gestosc=0.5, drzewa=0.05):
    """maluje obszar `region` (zbior (x, y) lokalnych) wg maski swiata: morze (kind 6), plaza (kind 17 do 2 kratek od morza), trawa (kind 16);
    las (kind 20, warstwa 1) w plamach z szumu poza `wolne`; zdarzenia zasobow (drzewa, krzaki, kamienie) rzadko na wolnym lad"""
    Wd, H = m["width"], m["height"]
    rnd = np.random.RandomState(seed)
    morze = {c for c in region if not lad(ox + c[0], oy + c[1])}
    for (x, y) in region:
        if (x, y) in morze:
            Z.kafel(m, 0, x, y, K(6))
            for z in (1, 2, 3, 4): Z.kafel(m, z, x, y, 0)
        else:
            blisko = any((x + dx, y + dy) in morze or not lad(ox + x + dx, oy + y + dy) for dx in (-2, -1, 0, 1, 2) for dy in (-2, -1, 0, 1, 2) if abs(dx) + abs(dy) <= 3)
            Z.kafel(m, 0, x, y, K(KIND['plaza']) if blisko else K(KIND['trawa']))
    szum = blur(rnd.rand(H, Wd), 3)
    szum = (szum - szum.min()) / (szum.max() - szum.min() + 1e-9)
    prog = np.quantile(szum, 1 - gestosc)
    for (x, y) in region:
        if (x, y) in morze or (x, y) in wolne: continue
        blisko = any(not lad(ox + x + dx, oy + y + dy) for dx in (-3, 0, 3) for dy in (-3, 0, 3))
        if szum[y][x] >= prog and not blisko and 0 < x < Wd - 1 and 0 < y < H - 1:
            Z.kafel(m, 1, x, y, K(KIND['las']) if KIND['las'] else 0)
    return morze


def zasoby(m, ox, oy, region, seed, wolne, sz, ile):
    rnd = random.Random(seed)
    kand = sorted(c for c in region if lad(ox + c[0], oy + c[1]) and c not in wolne and W.at(m, 1, c[0], c[1]) == 0
                  and W.kind_of(W.at(m, 0, c[0], c[1])) == KIND['trawa'] and 1 < c[0] < m["width"] - 2 and 1 < c[1] < m["height"] - 2)
    nazwy = [("!$Big_Trees_green", 0.5), ("!$Bush_Bare_A", 0.12), ("!$Rock_Flat", 0.08), ("!$Bush_Bare_Wide", 0.07), ("!$Rock_Cracked", 0.05), ("!$Bush_Bare_B", 0.08), ("!$Rock_Mossy", 0.05), ("!$Trunk_Dead", 0.05)]
    zaj = []
    for _ in range(ile * 20):
        if len(zaj) >= ile or not kand: break
        x, y = rnd.choice(kand)
        if any(abs(x - a) + abs(y - b) < 4 for (a, b) in zaj): continue
        r = rnd.random(); acc = 0; g = nazwy[0][0]
        for (n, w) in nazwy:
            acc += w
            if r <= acc: g = n; break
        if g not in sz: continue
        c = copy.deepcopy(sz[g]); c["x"], c["y"] = x, y
        Z.dodaj(m, c, bulk=True); zaj.append((x, y))


def droga(m, pts, ox, oy, r=1.5, wolne=None):
    """droga o szerokosci 3 (kind 17, bez lasu i zasobow) po lamanej `pts` (kratki lokalne), lagodne zakrety"""
    cells = dysk(set(), wygladz(pts), r)
    Wd, H = m["width"], m["height"]
    for (x, y) in cells:
        if 0 <= x < Wd and 0 <= y < H and W.kind_of(W.at(m, 0, x, y)) in (16, 17, 19, 26, KIND['trawa'], KIND['plaza']):
            Z.kafel(m, 0, x, y, K(KIND['plaza']))
            for z in (1, 2, 3): Z.kafel(m, z, x, y, 0)
    # zasoby na drodze zniknij
    for i, e in enumerate(m["events"]):
        if e and (e["x"], e["y"]) in cells and e["pages"][0]["image"]["characterName"].startswith("!$") and e["pages"][0]["list"][0]["code"] != 201: m["events"][i] = None
    if wolne is not None: wolne |= cells
    return cells


def nowa_mapa(mid, szablon_props):
    x0, y0, w, h = prost(mid)
    m = copy.deepcopy(szablon_props)
    m["width"], m["height"] = w, h
    m["displayName"] = nazwa_mapy(mid)
    m["data"] = [0] * (6 * w * h)
    m["events"] = [None]
    Z.NOWE_MAPY.add(id(m))
    return m, x0, y0, w, h


def kraw_wspolna(a, b):
    """wspolna krawedz dwoch map w kratkach swiata: (strona z a, od, do) wzdluz krawedzi albo None"""
    ax, ay, aw, ah = prost(a); bx, by, bw, bh = prost(b)
    if ax + aw == bx:
        lo, hi = max(ay, by), min(ay + ah, by + bh)
        if hi > lo: return "E", lo, hi
    if bx + bw == ax:
        lo, hi = max(ay, by), min(ay + ah, by + bh)
        if hi > lo: return "W", lo, hi
    if ay + ah == by:
        lo, hi = max(ax, bx), min(ax + aw, bx + bw)
        if hi > lo: return "S", lo, hi
    if by + bh == ay:
        lo, hi = max(ax, bx), min(ax + aw, bx + bw)
        if hi > lo: return "N", lo, hi
    return None


def przejscie_ladowe(a, b, chce):
    """3 kratki wzdluz wspolnej krawedzi a-b, ktore sa ladem po obu stronach, najblizej `chce` (kratka swiata wzdluz krawedzi); (strona, od, do) albo None"""
    k = kraw_wspolna(a, b)
    if not k: return None
    side, lo, hi = k
    ax, ay, aw, ah = prost(a)
    def ok(p):
        if side == "E": wx = ax + aw - 1; return lad(wx, p) and lad(wx + 1, p)
        if side == "W": wx = ax; return lad(wx, p) and lad(wx - 1, p)
        if side == "S": wy = ay + ah - 1; return lad(p, wy) and lad(p, wy + 1)
        wy = ay; return lad(p, wy) and lad(p, wy - 1)
    best = None
    for p in range(lo + 1, hi - 1):
        if ok(p - 1) and ok(p) and ok(p + 1):
            d = abs(p - chce)
            if best is None or d < best[0]: best = (d, p)
    if not best:
        # (etap 3) waski styk: 2 kratki ladu po obu stronach
        b2 = None
        for p in range(lo, hi - 1):
            if ok(p) and ok(p + 1):
                d = abs(p - chce)
                if b2 is None or d < b2[0]: b2 = (d, p)
        if b2: return side, b2[1], b2[1] + 1
        return None
    return side, best[1] - 1, best[1] + 1


def sciezka_od_krawedzi(m, mx, my, ox, oy, side, pos, wolne, ile=14):
    """krotka droga (3 szer.) od krawedzi mapy w glab (ścieżka brzegowa); pos = kratka swiata wzdluz krawedzi (srodek)"""
    w, h = m["width"], m["height"]
    if side in "EW":
        ly = pos - oy; x = w - 1 if side == "E" else 0; dx = -1 if side == "E" else 1
        pts = [(x, ly)] + [(x + dx * i, ly) for i in range(2, ile, 3)]
    else:
        lx = pos - ox; y = h - 1 if side == "S" else 0; dy = -1 if side == "S" else 1
        pts = [(lx, y)] + [(lx, y + dy * i) for i in range(2, ile, 3)]
    return droga(m, pts, ox, oy, wolne=wolne)
