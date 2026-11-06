# -*- coding: utf-8 -*-
"""Całe obiekty z map gracza jako pieczątki (runda 3): wzgórza (lico A5, krawędzie A2-47, schody) i plamy ziemi/bruku (grunt z nakładkami) jako SPÓJNE SKŁADOWE
z pasem gruntu wokół (RING kratek). Tylko obiekty kompletne: nie dotykają krawędzi mapy (>= RING+1) i w pasie wokół nie ma innego obiektu. Wstawiane bez zmian
(Plotno.wstaw przelicza kształty tylko w pierścieniu zewnętrznym).
  python tools/mapa_probna/obiekty.py [--zapisz]   -> lista kandydatów; z --zapisz: tools/mapy/pieczatki/dane/c_*.json + png"""
import os, sys, json
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", "..")).replace("\\", "/") + "/"
sys.path.insert(0, os.path.join(ROOT, "tools", "mapy", "pieczatki")); sys.path.insert(0, os.path.join(ROOT, "tools", "mapy"))
import pieczatki as P
import numpy as np
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
RING = 3
HILL_A5 = {88, 89, 90, 96, 97, 98, 104, 105, 106, 112, 113, 114, 120, 121, 122, 73, 74, 81, 82, 76, 24, 25, 26, 27}    # (24-27: schody A5; 76: narożnik wewnętrzny)
SOFT_A5 = {24, 26, 32, 33, 34, 40, 41, 42, 48, 49, 50, 56, 57, 58}
GROUND = {17, 24}
PATCH_L1 = {39, 36, 23}


def kind(t): return (t - 2048) // 48 if t >= 2048 else None


def klasy(raw):
    """maski: wzgórze (obiekt z kafli A5/A2-47/schody/warstwy 2-3/region 2-3), plama (ziemia, bruk, rumosz)"""
    a = P.warstwy_np(raw); H, W = raw["height"], raw["width"]
    hill = np.zeros((H, W), bool); patch = np.zeros((H, W), bool)
    for y in range(H):
        for x in range(W):
            t0, t1 = int(a[0, y, x]), int(a[1, y, x])
            if 1536 <= t0 < 2048 and (t0 - 1536) in HILL_A5: hill[y, x] = True
            if t1 and kind(t1) == 47 or 512 <= t1 < 768: hill[y, x] = True
            if a[2, y, x] or a[3, y, x] or int(a[5, y, x]) in (2, 3): hill[y, x] = True
            k0 = kind(t0)
            if k0 in GROUND or (1536 <= t0 < 2048 and (t0 - 1536) in SOFT_A5): patch[y, x] = True
            if t1 and kind(t1) in PATCH_L1: patch[y, x] = True
    return a, hill, patch


def dilate_e(c, r):
    """pas wokół obiektu: kratki w odległości euklidesowej <= r (zaokrąglony, bez prostych cięć)"""
    ri = int(r) + 1
    return {(x + dx, y + dy) for (x, y) in c for dx in range(-ri, ri + 1) for dy in range(-ri, ri + 1) if dx * dx + dy * dy <= r * r}


def dilate(c, r):
    return {(x + dx, y + dy) for (x, y) in c for dx in range(-r, r + 1) for dy in range(-r, r + 1)}


def scal(comps, r=1):
    comps = [set(c) for c in comps]
    zm = True
    while zm:
        zm = False
        for i in range(len(comps)):
            for j in range(i + 1, len(comps)):
                if dilate(comps[i], r) & comps[j]:
                    comps[i] |= comps[j]; del comps[j]; zm = True; break
            if zm: break
    return comps


def kandydaci(raw, min_h=25, min_p=18, max_p=260):
    a, hill, patch = klasy(raw); H, W = raw["height"], raw["width"]
    hs = scal([c for c in P._skladowe({(x, y) for y in range(H) for x in range(W) if hill[y, x]}) if len(c) >= 12], 1)
    hs = [c for c in hs if len(c) >= min_h]
    ps = [set(c) for c in P._skladowe({(x, y) for y in range(H) for x in range(W) if patch[y, x] and not hill[y, x]}) if min_p <= len(c) <= max_p]
    allh = set().union(*hs) if hs else set()
    out = []
    for kl, comps in (("wzgorze", hs), ("plama", ps)):
        for c in comps:
            xs = [q[0] for q in c]; ys = [q[1] for q in c]
            x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
            if x0 < RING + 1 or y0 < RING + 1 or x1 > W - RING - 2 or y1 > H - RING - 2: continue
            ring = dilate(c, RING) - c
            if kl == "wzgorze":
                if any(q in ring for d in hs if d is not c for q in d): continue
            else:
                if ring & allh or any(q in ring for d in ps if d is not c for q in d): continue
            out.append((kl, len(c), x0, y0, x1 - x0 + 1, y1 - y0 + 1, c))
    return out


def wytnij_cale(raw, c, nazwa, opis, mapa):
    """pieczątka z maski = składowa + pas RING kratek; zdarzenia ozdobne w masce; reszta bez zmian"""
    H, W = raw["height"], raw["width"]
    mask = {q for q in dilate_e(c, RING + 0.4) if 0 <= q[0] < W and 0 <= q[1] < H}
    xs = [q[0] for q in mask]; ys = [q[1] for q in mask]
    x0, y0, w, h = min(xs), min(ys), max(xs) - min(xs) + 1, max(ys) - min(ys) + 1
    p = P.wytnij(raw, x0, y0, w, h, nazwa, opis, tlo=(16, 27), maska_jawna=None, kontrola=False, pelny=False, zrodlo={"mapa": mapa, "x0": x0, "y0": y0})
    # nadpisz maskę i warstwy: dokładnie kratki maski (z gruntem w pasie), zdarzenia ozdobne w masce
    a = P.warstwy_np(raw)
    p["maska"] = [1 if (x0 + i, y0 + j) in mask else 0 for j in range(h) for i in range(w)]
    for z in range(4):
        p["warstwy"][z] = [int(a[z, y0 + j, x0 + i]) if (x0 + i, y0 + j) in mask else 0 for j in range(h) for i in range(w)]
    p["cienie"] = [int(a[4, y0 + j, x0 + i]) if (x0 + i, y0 + j) in mask else 0 for j in range(h) for i in range(w)]
    p["regiony"] = [(int(a[5, y0 + j, x0 + i]) if int(a[5, y0 + j, x0 + i]) not in (7, 9) else 0) if (x0 + i, y0 + j) in mask else 0 for j in range(h) for i in range(w)]
    ev = []
    for e in raw["events"]:
        if e and (e["x"], e["y"]) in mask and P.zdarzenie_ozdobne(e):
            ev.append({"dx": e["x"] - x0, "dy": e["y"] - y0, "ev": {k: v for k, v in e.items() if k not in ("id", "x", "y")}})
    p["zdarzenia"] = ev
    p["tlo_zbior"] = [16, 27]
    return p


if __name__ == "__main__":
    for mid in (13, 3):
        raw = P.wczytaj(mid)
        cs = kandydaci(raw)
        print("Map%03d: %d kandydatów" % (mid, len(cs)))
        for i, (kl, n, x0, y0, w, h, c) in enumerate(sorted(cs, key=lambda t: (t[0], -t[1]))):
            print("  %s %2d  %3d kratek  bbox (%d,%d) %dx%d" % (kl, i, n, x0, y0, w, h))


def skladowa_z(raw, seed):
    """wzgórze (scalone składowe) zawierające kratkę seed - bez sprawdzania sąsiedztwa (do ręcznego wskazania pełnych wzgórz)"""
    a, hill, patch = klasy(raw); H, W = raw["height"], raw["width"]
    hs = scal([c for c in P._skladowe({(x, y) for y in range(H) for x in range(W) if hill[y, x]}) if len(c) >= 6], 1)
    for c in hs:
        if seed in c: return c
    return None


DEF_CALE = [   # (nazwa, mapa, rodzaj, seed albo indeks kandydata, bez_gornych, opis)
    ("c_wzgorze_013_a", 13, "seed", (100, 78), False, "Całe wzgórze z Map013 (96,69): lico A5, krawędź A2-47, pas gruntu 3 kratki."),
    ("c_wzgorze_013_b", 13, "bbox", (72, 74), False, "Całe wzgórze z Map013 (72,74)."),
    ("c_wzgorze_003", 3, "seed", (27, 46), True, "Całe kamienne wzgórze z Map003 (22,36), z kępkami drzew na szczycie (bez wieżyczki z kafli D)."),
    ("c_plama_013_0", 13, "plama", 0, False, "Plama ziemi i bruku z Map013 (52,46)."),
    ("c_plama_013_1", 13, "plama", 1, False, "Plama ziemi z Map013 (89,57)."),
    ("c_plama_013_2", 13, "plama", 2, False, "Plama ziemi z Map013 (55,58)."),
    ("c_plama_013_3", 13, "plama", 3, False, "Pas ziemi z Map013 (43,39)."),
    ("c_plama_013_4", 13, "plama", 4, False, "Mała plama ziemi z Map013 (4,48)."),
]


def zrob_wszystkie():
    out = []
    cache = {}
    for (nazwa, mid, rodz, arg, bg, opis) in DEF_CALE:
        raw = cache.setdefault(mid, P.wczytaj(mid))
        if rodz == "bbox":
            c = next((t[6] for t in kandydaci(raw) if t[0] == "wzgorze" and (t[2], t[3]) == arg), None)
        elif rodz == "seed":
            c = skladowa_z(raw, arg)
        else:
            c = sorted([t for t in kandydaci(raw) if t[0] == "plama"], key=lambda t: -t[1])[arg][6]
        if not c: print("BRAK", nazwa); continue
        p = wytnij_cale(raw, c, nazwa, opis, mid)
        if bg:
            for z in (2, 3): p["warstwy"][z] = [0] * len(p["warstwy"][z])
        P.zapisz(p)
        P.maska_obrazek(p, 1.0, True).save(os.path.join(P.DANE, nazwa + ".png"))
        xs = [q[0] for q in c]; ys = [q[1] for q in c]
        print("%-18s Map%03d %3d kratek obiektu, okno %dx%d, zdarzeń %d, bbox (%d,%d)" % (nazwa, mid, len(c), p["w"], p["h"], len(p["zdarzenia"]), min(xs), min(ys)))
        out.append(nazwa)
    return out


if __name__ == "__main__" and "--zapisz" in sys.argv:
    zrob_wszystkie()


GRACZ_A = os.path.join(HERE, "gracz", "Map990_gracz_dc61145d.json")


def stamp_wzgorza_gracza():
    """Wzgórze gracza z Map990 (wersja dc61145d, WZORZEC NR 1) jako pieczątka: kafle A5 obrysu (góra 88/89/90, boki 96/98, narożnik wewnętrzny 76, lico 104-106 / 112-114 /
    120-122 z zakończeniami po bokach, kafle 73/74/81/82 przy schodach), schody (A2 24/26 w przerwie lica), pas 2 kratek gruntu wokół (kamyki pod licem). Bez zmian;
    region 2 na kafelkach obrysu (poza schodami), żeby blokowały także w zestawie 9."""
    O_ = globals()
    HILL_A5.add(76)
    raw = json.loads(open(GRACZ_A, "rb").read().decode("utf-8"))
    a = P.warstwy_np(raw); H, W = raw["height"], raw["width"]
    a5 = lambda x, y: 1536 <= a[0, y, x] < 2048 and (a[0, y, x] - 1536) in (104, 105, 106, 112, 113, 114, 120, 121, 122)
    comp = set()
    for y in range(H):
        for x in range(W):
            t = int(a[0, y, x])
            if 1536 <= t < 2048 and (t - 1536) in HILL_A5: comp.add((x, y))
    c = max(P._skladowe(comp), key=len)
    stairs = {(x, y) for (x, y) in c if 1536 <= a[0, y, x] < 2048 and (a[0, y, x] - 1536) in (24, 25, 26, 27)}
    # maska = kafle obrysu + nakładki warstwy 1 (kamyki, rumosz pod licem) w odległości <= 2.5 od obrysu, BEZ płotu A2-22, kępek 21, wody i gruntu warstwy 0 poza obrysem
    ring = dilate_e(c, 2.5)
    mask = set(c)
    for (x, y) in ring:
        if not (0 <= x < W and 0 <= y < H) or (x, y) in c: continue
        t1 = int(a[1, y, x])
        if t1 and P.rodzaj(t1) in (23, 39, 36): mask.add((x, y))
    xs = [q[0] for q in mask]; ys = [q[1] for q in mask]
    x0, y0, w, h = min(xs), min(ys), max(xs) - min(xs) + 1, max(ys) - min(ys) + 1
    p = {"nazwa": "gracz_wzgorze_990", "opis": "WZGÓRZE GRACZA z Map990 (wzorzec nr 1): plateau obrysem A5 ze wszystkich stron, lico ze schodami, bez zmian.",
         "w": w, "h": h, "tsid": raw["tilesetId"], "tlo": 16, "tlo_zbior": [16, 27], "zrodlo": {"mapa": 990, "x0": x0, "y0": y0}, "odrzucone": 0, "zachowaj_grunt": True,
         "warstwy": [], "cienie": [], "regiony": [], "maska": [], "zdarzenia": []}
    for z in range(4):
        p["warstwy"].append([int(a[z, y0 + j, x0 + i]) if (x0 + i, y0 + j) in mask and not (z == 0 and (x0 + i, y0 + j) not in c) else 0 for j in range(h) for i in range(w)])
    p["cienie"] = [0] * (w * h)
    p["regiony"] = [2 if ((x0 + i, y0 + j) in c and (x0 + i, y0 + j) not in stairs) else 0 for j in range(h) for i in range(w)]
    p["maska"] = [1 if (x0 + i, y0 + j) in mask else 0 for j in range(h) for i in range(w)]
    P.zapisz(p)
    P.maska_obrazek(p, 1.0, True).save(os.path.join(P.DANE, "gracz_wzgorze_990.png"))
    print("gracz_wzgorze_990: okno %dx%d, kafli obrysu %d (w tym schody %d), z (%d,%d)" % (w, h, len(c), len(stairs), x0, y0))
    return p


if __name__ == "__main__" and "--gracz" in sys.argv:
    stamp_wzgorza_gracza()
