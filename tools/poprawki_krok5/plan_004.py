# -*- coding: utf-8 -*-
"""Plan krajobrazu Map004 'Laka pod Gawra' (krok 5, pilot). Uzywa krajobraz.py.  python tools/poprawki_krok5/plan_004.py  -> staging/data/Map004.json
Czesc A: wady 1, 4-12 z docs/audyt_map/RAPORT.md (wada 2 - brzeg - w grze wyglada dobrze, bez zmian). Czesc B: krajobraz."""
import os, sys, math, random
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from krajobraz import *

K = Krajobraz(4)
ev = lambda i: K.ev[i]
SPOTY = [(73, 51), (70, 53), (74, 52)]                 # lizawka, zasiadka, zrzut poroza (Lowy_Data): zostaja wolne
ZAKAZ = {(x + a, y + b) for (x, y) in SPOTY for a in (-1, 0, 1) for b in (-1, 0, 1)}
# zajete runtime'em (Ludzie_Data): koszar (50,40,5x4), pastwisko (43,44,7x6), postoj (59,10) - nic nowego tam nie stawiamy
for (x0, y0, w, h) in [(50, 40, 5, 4), (43, 44, 7, 6), (59, 10, 4, 2)]:
    ZAKAZ |= {(x + a, y + b) for x in range(x0, x0 + w) for y in range(y0, y0 + h) for a in (-1, 0, 1) for b in (-1, 0, 1)}


def czysc_pole(x0, y0, x1, y1, k=16):
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            K.ground(x, y, k)
            if K.g(1, x, y): K.over(x, y, 0)


# ================================================================== A. WADY
# (dwie stare prostokatne plamy ciemnej trawy z estetyki j: (41,47) i (67,49) - proste odcinki obrysu polamane)
def skladowa(x, y, kind=27):
    seen, st = set(), [(x, y)]
    while st:
        c = st.pop()
        if c in seen or not K.in_(*c) or K.kind(0, *c) != kind: continue
        seen.add(c); st += [(c[0] + 1, c[1]), (c[0] - 1, c[1]), (c[0], c[1] + 1), (c[0], c[1] - 1)]
    return seen
for (x_, y_) in [(41, 47), (67, 49)]:
    sk = set()
    for dy in range(0, 4):
        for dx in range(0, 3):
            sk = skladowa(x_ + dx, y_ + dy)
            if sk: break
        if sk: break
    if sk:
        xs_, ys_ = [c[0] for c in sk], [c[1] for c in sk]
        for c in sk: K.ground(c[0], c[1], 16)
        cx_, cy_ = (min(xs_) + max(xs_)) / 2.0, (min(ys_) + max(ys_)) / 2.0
        rx_, ry_ = (max(xs_) - min(xs_) + 1) / 2.0, (max(ys_) - min(ys_) + 1) / 2.0
        K.plama(K.blob(cx_, cy_, rx_ * 1.02, ry_ * 1.1, int(cx_ * 7 + cy_), 0.35), 27, 0, tylko_na={16})
for (x_, y_) in [(54, 48), (56, 47), (58, 48)]:
    if K.kind(0, x_, y_) == 27 and len(skladowa(x_, y_)) <= 3:
        for c in skladowa(x_, y_): K.ground(c[0], c[1], 16)

# 9: ciemnoszara plama przy murze (x2-3, y70-74): trawa
czysc_pole(2, 69, 6, 76)

# 6: plama-hantle (74-83, 34-39) z rzedem galezi: usunieta, krzaki w dwie rozrzucone kepki
for y in range(33, 40):
    for x in range(72, 85):
        if K.kind(1, x, y) == 39: K.over(x, y, 0)
        if K.kind(0, x, y) == 17: K.ground(x, y, 16)
K.przenies(275, 79, 44)            # zasiek z galezi
K.przenies(258, 80, 46)            # krzaczek
K.przenies(304, 77, 41)            # plaski kamien

# 1: ciemny grunt lasu - postrzepiona granica zamiast prostej x75 (y36-60)
def granica(y):
    return 75.5 + 3.6 * (K.fbm(y * 1.0, 3.0, 11, 7.0) - 0.5) * 2 + 1.4 * (K.noise(y * 1.0, 0.0, 23, 2.6) - 0.5) * 2
Y0, Y1 = 37, 58
M_los = set()
for y in range(Y0, Y1 + 1):
    for x in range(66, 86):
        was = K.kind(1, x, y) == 46
        want = x <= granica(y)
        if x < 69: want = was or (x >= 66 and K.kind(1, x, y) == 46)
        if want: M_los.add((x, y))
# wyspy ciemnego gruntu za granica i jasne plamy w srodku
for (cx, cy, rx, ry, sd) in [(79, 49, 2.4, 1.9, 32)]:
    M_los |= K.blob(cx, cy, rx, ry, sd, 0.3)
for (cx, cy, rx, ry, sd) in [(70, 45, 1.8, 2.6, 41), (71, 57, 2.0, 1.6, 42)]:
    M_los -= K.blob(cx, cy, rx, ry, sd, 0.3)
M_los = K.gladko(M_los, 1)
for y in range(Y0, Y1 + 1):
    for x in range(66, 86):
        if (x, y) in M_los:
            if K.kind(0, x, y) in (16, 27) and K.kind(1, x, y) not in (39,): K.over(x, y, 46)
        else:
            if K.kind(1, x, y) in (46, 21): K.over(x, y, 0)

# 5: sciezka z zachodniej bramy (y48-49) - dalej do glownej drogi (x18)
M5 = K.droga_maska([(9.5, 48.9), (12.5, 49.6), (15.5, 49.4), (18.5, 48.8), (21, 48.6)], 2.3, seed=51, szum=0.12)
for (x, y) in M5:
    if y < 48 or y > 49: continue
    K.over(x, y, 39)

# 7: droga x21-23 (y59-81) i dalej na poludnie - rowna szerokosc, lagodny zakret
stare = [(x, y) for y in range(58, 117) for x in range(6, 40) if K.kind(0, x, y) == 17]
for (x, y) in stare: K.ground(x, y, 16)
Mdr = K.droga_maska([(24.8, 54.5), (23.9, 57.6), (23.4, 60.4), (22.3, 63.5), (21.5, 66.8), (21.6, 70), (22.7, 73.2), (23.0, 76.5), (21.8, 80), (19.6, 83.4), (15.6, 88.4), (12.6, 93.5), (12.2, 98.0), (10.1, 102.8), (12.0, 107.5), (11.6, 112.5), (12.0, 115.5), (12, 117), (12, 119.5)],
                    3.4, seed=int(os.environ.get("SEED_DROGA", 71)), szum=0.10, lamac=False)
Mdr = {c for c in Mdr if 59 <= c[1] <= 113} | {(x, y) for y in range(114, 117) for x in (11, 12, 13)}
for (x, y) in Mdr:
    K.ground(x, y, 17)
    if K.g(1, x, y): K.over(x, y, 0)

K.over(16, 80, 0); K.over(11, 99, 0)

# 10 + 4: sosny - dwie jedna nad druga rozsuniete, rzad y54-57 rozrzucony w grupy 2-4 (rozne rozmiary)
K.przenies(166, 13, 53)            # Male drzewo (bylo 10,54 pod 10,51)
K.przenies(79, 5, 56)              # Sosna A
K.przenies(153, 8, 58)             # Sosna B
K.przenies(91, 14, 56)             # Sosna C
K.przenies(96, 17, 58)             # Sosna C
K.przenies(202, 21, 56)            # Sosna C
K.przenies(107, 26, 60)            # Sosna C
K.przenies(125, 19, 53)            # Sosna A

# 8: pole kamieni - 3 kopce z krzakami wokol, reszta oczyszczona
pole = K.w_polu(20, 80, 32, 91)
skaly = [e for e in pole if klasa(e) in ("skala", "ruda")]
krzaki = [e for e in pole if klasa(e) == "krzak"]
wielk = {"!$Rock_Huge": 6, "!$Rock_Wide": 5, "!$Rock_Long": 5, "!$Rock_Cluster": 4, "!$Rock_Twin": 4, "!$Rock_Jagged": 4, "!$Rock_Boulder_Crack": 4, "!$Rock_Slab": 4}
skaly.sort(key=lambda e: -wielk.get(e["pages"][0]["image"]["characterName"], 1))
occ_pole = {}
heaps = []
def heap(centrum, lista, seed):
    rng = random.Random(seed)
    cx, cy = centrum
    mine = []
    for e in lista:
        best = None
        for r in range(0, 9):
            cand = []
            for y in range(cy - r, cy + r + 1):
                for x in range(cx - int(r * 1.5) - 1, cx + int(r * 1.5) + 2):
                    ee = dict(e); ee["x"], ee["y"] = x, y
                    cells = stopa(ee)
                    if any(c in occ_pole for c in cells): continue
                    if any(not K.in_(*c) or K.kind(0, *c) not in (16, 27) for c in cells): continue
                    d = math.hypot((x - cx) / 1.35, (y - cy) * 1.1) + rng.random() * 1.7
                    # rzedy tej samej wysokosci obok siebie wygladaja jak szereg: kara
                    d += 0.6 * sum(1 for o in mine if o["y"] == y and abs(o["x"] - x) <= 3)
                    cand.append((d, x, y))
            if cand: best = min(cand); break
        if best is None: K.log.append("kopiec: brak miejsca %d" % e["id"]); continue
        K.przenies(e["id"], best[1], best[2]); e["x"], e["y"] = best[1], best[2]
        for c in stopa(e): occ_pole[c] = e["id"]
        mine.append(e)
    heaps.append(mine)
# pole oczyszczone (poza droga)
for y in range(80, 92):
    for x in range(20, 33):
        if K.kind(0, x, y) != 17:
            K.ground(x, y, 16)
            if K.g(1, x, y): K.over(x, y, 0)
for e in K.eventy():                      # (zajete miejsca poza polem zostaja)
    if e not in pole:
        for c in stopa(e): occ_pole[c] = e["id"]
for e in pole:
    for c in stopa(e): occ_pole.pop(c, None)
# 3 kopce: nierowne, z duzymi glazami w srodku, rudy wsrod innych kamieni
random.Random(8).shuffle(skaly[6:])
duze, male_ = skaly[:9], skaly[9:]
random.Random(9).shuffle(male_)
heap((25, 83), duze[0:3] + male_[0:5], 1)
heap((31, 87), duze[3:6] + male_[5:9], 2)
heap((24, 90), duze[6:9] + male_[9:], 3)
# krzaki: tuz przy kopcach (po 2-3), reszta usunieta
random.Random(5).shuffle(krzaki)
nb = 0
for e, h in zip(krzaki[:8], [0, 1, 2, 0, 1, 2, 0, 1]):
    for c in stopa(e): occ_pole.pop(c, None)
    rocks = {c for r in heaps[h] for c in stopa(r)}
    cand = []
    for (rx, ry) in rocks:
        for dx in range(-3, 4):
            for dy in range(-3, 4):
                x, y = rx + dx, ry + dy
                if (x, y) in occ_pole or (x, y) in rocks or not K.in_(x, y) or K.kind(0, x, y) not in (16, 27): continue
                dmin = min(math.hypot(x - a, y - b) for (a, b) in rocks)
                if 1.4 <= dmin <= 2.6 and all(math.hypot(x - o["x"], y - o["y"]) >= 2.2 for o in krzaki[:nb]):
                    cand.append((random.Random(x * 31 + y).random(), x, y))
    if not cand: K.usun(e["id"]); continue
    _, x, y = min(cand)
    K.przenies(e["id"], x, y); e["x"], e["y"] = x, y
    for c in stopa(e): occ_pole[c] = e["id"]
    nb += 1
for e in krzaki[8:]: K.usun(e["id"])


# ================================================================== 11. gaj sosen (66-86, 64-82): podszyt, ciemniejszy grunt, nieregularny brzeg, polana, gestosc maleje ku brzegowi
GAJ = (66, 62, 86, 83)
for (x, y) in [(72, 72), (74, 72), (72, 74), (73, 75), (72, 76), (80, 79), (80, 80), (81, 79)]: K.ground(x, y, 16)
drzewa_gaju = [e for e in K.w_polu(*GAJ) if klasa(e) in RZECZY_DRZEWNE and klasa(e) != "martwe"]
inne_gaju = [e for e in K.w_polu(*GAJ) if klasa(e) not in RZECZY_DRZEWNE or klasa(e) == "martwe"]
POL = (80.2, 72.2, 2.3, 1.7)
_fa = K.gestosc(75.5, 72, 9.0, 7.6, 61, rough=0.36, scale=4.2, spadek=0.7)
_fb = K.gestosc(81, 76.5, 6.5, 5.2, 67, rough=0.36, scale=3.6, spadek=0.7)
def f_gaj(x, y):
    q = math.hypot((x - POL[0]) / POL[2], (y - POL[1]) / POL[3]) * (1 + 0.25 * (K.fbm(x, y, 68, 2.5) - 0.5) * 2)
    if q < 1: return 0.0
    return max(_fa(x, y), _fb(x, y)) * min(1.0, (q - 1) * 1.6 + 0.3)
# stare krzaki/kamienie/klody gaju - ida na brzeg polany / zostaja; drzewa rozlozone od nowa
for e in drzewa_gaju: pass
occ = K.zajete(pomin={e["id"] for e in drzewa_gaju})
owoc = [e for e in drzewa_gaju if klasa(e) in ("jablon", "grusza")]
zwykle = [e for e in drzewa_gaju if e not in owoc]
random.Random(3).shuffle(zwykle)
polozone = K.sadz([e["id"] for e in zwykle], f_gaj, 62, min_d=2.0, occ=occ, zakazane=ZAKAZ, bbox=(67, 63, 85, 82), prog=0.08)
for e in zwykle:                                  # (nie zmiesciły sie w rzedniejszym gaju - zbedne, gaj ma byc luzniejszy ku brzegowi)
    if e not in polozone: K.usun(e["id"])
# owocowe: na brzegu gaju (dwa razem, jedno osobno)
K.sadz([e["id"] for e in owoc], K.gestosc(80, 77, 9, 6.5, 66, rough=0.3, spadek=0.35), 63, min_d=2.6, occ=occ, zakazane=ZAKAZ, bbox=(70, 66, 85, 82), prog=0.02)
# polana: pieniek, klody, martwe drzewo, plaskie kamienie na jej brzegu; reszta rzeczy z gaju poza polana
brzeg = [(78, 71), (82, 71), (82, 73), (79, 74), (77, 73), (80, 70)]
rz = [e for e in inne_gaju if klasa(e) in ("pieniek", "kloda", "martwe", "skala")]
occ2 = K.zajete(pomin={e["id"] for e in rz})
for e, (x0_, y0_) in zip(rz, brzeg):
    best = None
    for r in range(0, 5):
        for dy in range(-r, r + 1):
            for dx in range(-r, r + 1):
                if max(abs(dx), abs(dy)) != r or best: continue
                x, y = x0_ + dx, y0_ + dy
                ee = dict(e); ee["x"], ee["y"] = x, y
                if all(K.in_(*c) and K.kind(0, *c) in (16, 27) and c not in occ2 and (c[0] + a, c[1] + b) not in occ2 for c in stopa(ee) for a in (0,) for b in (0,))                         and not any((x + a, y + b) in occ2 for a in (-1, 0, 1) for b in (-1, 0, 1)):
                    best = (x, y)
    if best:
        K.przenies(e["id"], *best)
        for c in stopa(e): occ2[c] = e["id"]
# ciemniejszy grunt pod koronami (nieregularny) + podszyt: paprocie (kafle), krzaki (zdarzenia z pozostalych), kamyki
for (x, y) in [(x, y) for y in range(60, 120) for x in range(3, 100) if K.kind(1, x, y) == 36]:
    K.over(x, y, 0)                               # (szare plamy kafla 36 na poludniu - jak wada 9)
K.grunt_wg(f_gaj, 0.36, 64, bbox=(64, 60, 88, 85))
K.dekor(f_gaj, [PAPROCIE], 20, 65, (66, 63, 86, 83), occ=K.zajete(), zakazane=ZAKAZ, ile=(1, 2), promien=1.3, odstep=2.0)
K.dekor(f_gaj, [KAMYKI], 5, 66, (66, 63, 86, 83), occ=K.zajete(), zakazane=ZAKAZ, ile=(1, 2), promien=1.2, odstep=3.0)
