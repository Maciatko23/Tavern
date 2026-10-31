# -*- coding: utf-8 -*-
# Szukanie układu świata z samych map (bez maski kruka): wyżarzanie położeń 21 map tak, żeby
#  - mapy nie nakładały się,
#  - na wspólnych krawędziach woda szła w wodę, a ląd w ląd (profil brzegu każdej mapy z jej kafli),
#  - żadna krawędź z lądem nie była „otwarta” (bez sąsiada), a otwarte krawędzie to tylko morze,
#  - zachowały się uzgodnione przejścia (przesunięcia z obecnych wyjść) i uzgodnione sąsiedztwa.
# Wynik: JSON z położeniami (do swiat_kratki.py). Nic nie zapisuje do data/ ani js/.
#   python tools/mapy/uklad_szukaj.py [liczba_krokow] [ziarno]
import os, sys, json, math, random
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "brzeg"))
import numpy as np
import pary_krawedzi as P

# nowe mapy brzegowe (wypełniacze): typ = strony z morzem (pas 16 kratek jak w mapach 17, 18, 168, 120, 175, 159), rozmiar
FILL = {901: ("E", 76, 80), 902: ("E", 76, 80), 903: ("S", 80, 76), 904: ("S", 80, 76), 905: ("W", 76, 80), 906: ("SE", 96, 96), 907: ("SW", 96, 96), 908: ("N", 80, 76)}
KROPKA = 16


def band(typ, w, h, d=KROPKA):
    """profil wody nowej mapy brzegowej: pas morza o głębokości d przy wskazanych stronach (na bokach krawędzi woda w pierwszych d kratkach, jak w istniejących mapach)"""
    a = np.zeros((h, w), bool)
    if "E" in typ: a[:, w - d:] = True
    if "W" in typ: a[:, :d] = True
    if "S" in typ: a[h - d:, :] = True
    if "N" in typ: a[:d, :] = True
    return a


IDS = list(P.MAPY) + list(FILL)
IDX = {m: i for i, m in enumerate(IDS)}
WWORLD, HWORLD = 760, 640


def woda(m):
    W, H, w = P.mapa(m)
    a = np.array(w, bool)
    if m == 8: a = np.vstack([a, np.zeros((7, a.shape[1]), bool)])                       # Okolice Tawerny +7 rzędów w dół (wyrównanie z Podgrodziem)
    if m == 111: a = np.hstack([a[:, :90], np.zeros((a.shape[0], 10), bool), a[:, 90:]])   # Podgrodzie: 10 kolumn wstawionych przed murem (od x 90)
    return a


WM = {m: (band(FILL[m][0], FILL[m][1], FILL[m][2]) if m in FILL else woda(m)) for m in IDS}
SZ = {m: (WM[m].shape[1], WM[m].shape[0]) for m in IDS}

# stałe przesunięcia (m2 = m1 + (dx, dy)); wynikają z obecnych wyjść i zgodności brzegu (tools/brzeg/pary_krawedzi.py)
EXACT = [
    (8, 24, (104, 36)), (8, 111, (-102, 33)), (3, 4, (5, -60)), (3, 23, (80, 0)),
    (155, 157, (96, -2)), (157, 159, (112, -14)), (159, 175, (8, 80)), (175, 120, (0, 60)),
    (162, 165, (-80, 0)), (125, 162, (0, 80)), (18, 17, (80, 0)), (17, 168, (80, -12)),
]
# sąsiedztwo (dowolna strona, zakładka >= 20 kratek)
FLEX = [(8, 13, 3), (13, 120, 2), (13, 157, 2), (13, 175, 1), (8, 22, 3), (3, 24, 4), (3, 20, 4), (8, 125, 4), (125, 21, 2), (111, 162, 2), (22, 120, 1), (20, 21, 1), (22, 21, 1),
        (24, 22, 1), (4, 22, 1), (23, 17, 1), (23, 168, 1), (3, 17, 1), (165, 162, 1), (155, 125, 1), (111, 125, 1)]


def rect(P_, m):
    i = IDX[m]
    return P_[i, 0], P_[i, 1], SZ[m][0], SZ[m][1]


def adjacency_cost(P_, a, b):
    ax, ay, aw, ah = rect(P_, a); bx, by, bw, bh = rect(P_, b)
    best = 1e9
    # po prawej / lewej
    for gap in (abs(bx - (ax + aw)), abs(ax - (bx + bw))):
        ov = min(ay + ah, by + bh) - max(ay, by)
        best = min(best, gap * 4 + max(0, 24 - ov) * 4)
    for gap in (abs(by - (ay + ah)), abs(ay - (by + bh))):
        ov = min(ax + aw, bx + bw) - max(ax, bx)
        best = min(best, gap * 4 + max(0, 24 - ov) * 4)
    return best


def energia(P_, det=False):
    O = np.full((HWORLD, WWORLD), -1, np.int16)
    Wr = np.zeros((HWORLD, WWORLD), bool)
    over = 0
    for m in IDS:
        x, y, w, h = rect(P_, m)
        if x < 1 or y < 1 or x + w >= WWORLD - 1 or y + h >= HWORLD - 1: return 1e9
        sl = (slice(y, y + h), slice(x, x + w))
        over += int((O[sl] >= 0).sum())
        O[sl] = IDX[m]; Wr[sl] = WM[m]
    mism = 0; open_land = 0; open_by = {}
    for m in IDS:
        x, y, w, h = rect(P_, m)
        a = WM[m]
        for side in "NSWE":
            if side == "N": cells = a[0, :]; own = O[y - 1, x:x + w]; ww = Wr[y - 1, x:x + w]
            elif side == "S": cells = a[h - 1, :]; own = O[y + h, x:x + w]; ww = Wr[y + h, x:x + w]
            elif side == "W": cells = a[:, 0]; own = O[y:y + h, x - 1]; ww = Wr[y:y + h, x - 1]
            else: cells = a[:, w - 1]; own = O[y:y + h, x + w]; ww = Wr[y:y + h, x + w]
            ol = int(((own < 0) & ~cells).sum())
            mm = int(((own >= 0) & (ww != cells)).sum())
            open_land += ol; mism += mm
            if ol or mm: open_by[(m, side)] = (ol, mm)
    link = 0.0
    for a, b, (dx, dy) in EXACT:
        ax, ay, _, _ = rect(P_, a); bx, by, _, _ = rect(P_, b)
        link += 12 * (abs(bx - ax - dx) + abs(by - ay - dy))
    for a, b, wgt in FLEX:
        link += wgt * adjacency_cost(P_, a, b)
    # 3: wyjście S (x 8-10) wchodzi do 20; wyjście W (y 14-16) do 24; 8: brama S (x 24-26) do 125
    x3, y3, _, _ = rect(P_, 3); x20, y20, w20, _ = rect(P_, 20)
    link += 12 * abs(y20 - (y3 + 60)) + 12 * (max(0, x20 + 2 - (x3 + 8)) + max(0, (x3 + 11) - (x20 + w20 - 2)))
    x24, y24, w24, h24 = rect(P_, 24)
    link += 12 * abs(x24 + w24 - x3) + 12 * (max(0, y24 + 2 - (y3 + 14)) + max(0, (y3 + 17) - (y24 + h24 - 2)))
    x8, y8, _, h8 = rect(P_, 8); x125, y125, w125, _ = rect(P_, 125)
    link += 12 * abs(y125 - (y8 + h8)) + 12 * (max(0, x125 + 2 - (x8 + 24)) + max(0, (x8 + 27) - (x125 + w125 - 2)))
    xs = [rect(P_, m)[0] for m in IDS]; ys = [rect(P_, m)[1] for m in IDS]
    xe = [rect(P_, m)[0] + SZ[m][0] for m in IDS]; ye = [rect(P_, m)[1] + SZ[m][1] for m in IDS]
    box = (max(xe) - min(xs)) * (max(ye) - min(ys)) / 400.0
    e = 40 * over + 6 * mism + 5 * open_land + link + 0.4 * box
    if det: return dict(e=e, over=over, mism=mism, open_land=open_land, link=link, box=box, open_by=open_by)
    return e


def start():
    # ręczny punkt wyjścia (kratki): pierścień wybrzeży + rdzeń wokół Okolic Tawerny
    pos = {
        155: (40, 56), 157: (136, 54), 159: (248, 40), 175: (256, 120), 120: (256, 180),
        13: (136, 126), 8: (150, 232), 111: (48, 265), 24: (254, 268), 3: (334, 268), 4: (339, 208), 23: (414, 268), 22: (254, 208), 20: (334, 328), 21: (270, 340),
        125: (150, 377), 162: (150, 457), 165: (70, 457), 17: (210, 400), 18: (100, 400), 168: (290, 388),
    }
    pos.update({901: (330, 120), 902: (330, 200), 903: (300, 420), 904: (200, 440), 905: (60, 300), 906: (400, 420), 907: (50, 440), 908: (150, 0)})
    for m in IDS:
        if m not in pos: pos[m] = (300, 300)
    return np.array([pos[m] for m in IDS], int)


def szukaj(kroki=150000, seed=1, P0=None):
    rnd = random.Random(seed)
    P_ = start() if P0 is None else P0.copy()
    cur = energia(P_); best = cur; bestP = P_.copy()
    n = len(IDS)
    for it in range(kroki):
        T = 60.0 * (1 - it / kroki) ** 2 + 0.3
        i = rnd.randrange(n)
        old = P_[i].copy()
        r = rnd.random()
        if r < 0.55:      # ruch „przyklej”: mapa i dosuwa się krawędzią do krawędzi mapy j (z zakładką)
            j = rnd.randrange(n)
            if j == i: continue
            mi, mj = IDS[i], IDS[j]
            wi, hi = SZ[mi]; wj, hj = SZ[mj]; xj, yj = int(P_[j][0]), int(P_[j][1])
            side = rnd.randrange(4)
            offs = rnd.choice(("a", "b", "r"))
            if side in (0, 1):   # po prawej / lewej
                x = xj + wj if side == 0 else xj - wi
                y = yj if offs == "a" else (yj + hj - hi if offs == "b" else yj + rnd.randint(-hi + 24, hj - 24))
            else:
                y = yj + hj if side == 2 else yj - hi
                x = xj if offs == "a" else (xj + wj - wi if offs == "b" else xj + rnd.randint(-wi + 24, wj - 24))
            P_[i] = (x, y)
        elif r < 0.7: P_[i] += (rnd.randint(-40, 40), rnd.randint(-40, 40))
        elif r < 0.9: P_[i] += (rnd.randint(-5, 5), rnd.randint(-5, 5))
        else: P_[i] += (rnd.randint(-1, 1), rnd.randint(-1, 1))
        e = energia(P_)
        if e <= cur or rnd.random() < math.exp((cur - e) / T):
            cur = e
            if e < best: best = e; bestP = P_.copy()
        else:
            P_[i] = old
    return bestP, best


if __name__ == "__main__":
    kroki = int(sys.argv[1]) if len(sys.argv) > 1 else 150000
    seed = int(sys.argv[2]) if len(sys.argv) > 2 else 1
    P_, e = szukaj(kroki, seed)
    d = energia(P_, det=True)
    print("energia %.0f nakladanie %d niezgodne %d otwarte_lad %d" % (e, d["over"], d["mism"], d["open_land"]))
    for k, v in sorted(d["open_by"].items(), key=lambda kv: -(kv[1][0] + kv[1][1]))[:25]: print("  ", k, v)
    json.dump({str(m): [int(P_[IDX[m]][0]), int(P_[IDX[m]][1])] for m in IDS}, open(os.path.join(os.environ.get("KRUK_TMP", "."), "uklad_%d.json" % seed), "w"))
