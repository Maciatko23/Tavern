# -*- coding: utf-8 -*-
"""ESTETYKA MAP ŚWIATA (tools/mapy/estetyka.py): sprawdza to, na co gracz narzekał 2026-10-31 (docs/MAPY_ZASADY.md, rozdział
"Krawędzie i styki map"). Nic nie zapisuje do data/ ani js/.

Użycie:
  python tools/mapy/estetyka.py                    mapy świata (js/plugins/Swiat_Data.js) z data/
  python tools/mapy/estetyka.py --staging DIR      mapy z DIR/data/MapNNN.json (brak pliku: data/)
  python tools/mapy/estetyka.py 3 20               tylko te mapy
  opcje: --obrazy DIR (fragment 1:1 z zaznaczeniem dla każdego trafienia i wyjątku), --lista (wypisz każde trafienie), --test a,b (tylko te sprawdzenia)
Wyjątki: tools/mapy/estetyka_wyjatki.json = lista {mapa, x, y, sprawdzenie, powod}; trafienie w tej kratce (a-e) nie liczy się.
Kod wyjścia 0 tylko, gdy po odjęciu wyjątków wszędzie jest 0.

Sprawdzenia:
  a  pas gęstych liści (A2 rodzaj 20, A4 118/119, warstwy 0-1): składowa cienka (głębokość od krawędzi <= 7) przy krawędzi mapy, a w zestawie 11
     (tam liście BLOKUJĄ) także każda blokująca kratka liści gdziekolwiek
  b  pojedyncza kratka / pasek jednej kratki gruntu otoczony innym gruntem; plama gruntu ucięta prostą linią (bok >= 6 kratek między gruntem naturalnym, naprzeciw zwężenie)
  c  drzewo z kafli B-E (korona zielona, >= 6 kafli) bez gwiazdki nad kratką, na której można stanąć (bohater chodzi PO koronie)
  d  mur / baszta (autokafle A3/A4, kind 48-127) dochodzący do krawędzi mapy prostopadle, a w tej samej kratce świata sąsiada brak muru (albo brak sąsiada)
  e  półka / skarpa / klif z kafli (A2 rodzaj 47 w zestawie 11 na warstwie 1): urwana na krawędzi mapy bez pasującej kratki po drugiej stronie albo ucięta
     prostą linią (bok > 3 kratki, naprzeciw zwężenie)
Granice heurystyk to świadomy kompromis: lepiej pokazać kandydata (i wyjątek z obrazkiem) niż przeoczyć ucięty wzór."""
import os, sys, re, json, collections
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(ROOT, "tools", "krawedzie_poprawa"))
if "--staging" not in sys.argv and "--zywe" not in sys.argv: sys.argv.append("--zywe")     # (swiat_styki.py czyta te opcje przy imporcie)
import numpy as np
from PIL import Image
import mapylib as L
import swiat_styki as S
import lib

try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass

WYJATKI_PLIK = os.path.join(HERE, "estetyka_wyjatki.json")
TESTY = "abcde"          # (f-j: uwagi gracza z 2026-11-01 - tylko na życzenie: --test f,g,h,i,j albo tools/mapa_probna/kontrole.py; wzorce gracza ich nie spełniają)
LISC_A2 = {20}
LISC_A4 = {118, 119}
GLEB_PASA = 6            # pas przy krawędzi (kratki), jak w narzędziach poprawy
CIENKA = 7               # składowa liści cienka: głębokość od krawędzi <= 7
GRUNT = range(16, 48)    # rodzaje A2 lądu (bez wody A1)
GRUNT_W1 = {16, 17, 24, 25, 26, 27}   # grunt na warstwie 1 (bez ozdobników: 21, 39, 46...)
SKALA = 47               # A2 47 w zestawie 11: skalna półka / skarpa
DLUGI = 6                # ucięty bok plamy gruntu: >= 6 kratek (krótsze to zwykłe narożniki autokafli)
NATURA = {16, 17, 24, 25, 26, 27}   # grunt naturalny (trawa, ziemia, piasek): tylko między nimi plama bywa „ucięta”; bruk, mur i woda mają proste brzegi z natury
NAZWY = {"a": "pas liści", "b": "ucięty/pojedynczy grunt", "c": "drzewo z kafli bez gwiazdki", "d": "mur bez zakończenia", "e": "półka bez zakończenia",
        "f": "wzgórze: schodkowa/zębata dolna linia, dziura, otwarta strona albo urwany kawałek obrysu", "g": "drzewo za blisko wody / na gruncie brzegu", "h": "rama innego gruntu pod/wokół płotu lub muru",
        "i": "zaokrąglony koniec lica przy schodach", "j": "kanciasta / prostokątna plama gruntu"}


def rodzaj(t): return (t - 2048) // 48 if t >= 2048 else None


def lisc(t):
    k = rodzaj(t)
    return k is not None and (k in LISC_A2 or k in LISC_A4)


def warstwa(mp, z):
    return np.array(mp.data[z * mp.W * mp.H:(z + 1) * mp.W * mp.H], dtype=np.int32).reshape(mp.H, mp.W)


def bok_prosty(komp, W, H, ok_zewn, k):
    """plama (lista kratek) ucięta prostą linią: bok bbox z biegiem >= DLUGI, kratki zewnątrz w mapie spełniają ok_zewn, naprzeciw zwężenie.
    Zwraca opis albo None"""
    xs = [c[0] for c in komp]; ys = [c[1] for c in komp]
    x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
    if len(komp) < 10 or x1 - x0 < 2 or y1 - y0 < 2: return None
    for nazwa, (dx, dy) in (("N", (0, -1)), ("S", (0, 1)), ("W", (-1, 0)), ("E", (1, 0))):
        if dy:
            yy = y0 if dy < 0 else y1; opp = y1 if dy < 0 else y0
            rz = sorted(x for x, y in komp if y == yy); n_opp = sum(1 for x, y in komp if y == opp)
        else:
            xx = x0 if dx < 0 else x1; opp = x1 if dx < 0 else x0
            rz = sorted(y for x, y in komp if x == xx); n_opp = sum(1 for x, y in komp if x == opp)
        i = 0
        while i < len(rz):
            j = i
            while j + 1 < len(rz) and rz[j + 1] == rz[j] + 1: j += 1
            dl = j - i + 1
            if dl >= DLUGI and n_opp * 2 < dl:
                kr = [((rz[q], yy) if dy else (xx, rz[q])) for q in range(i, j + 1)]
                zew = [(x + dx, y + dy) for x, y in kr]
                if all(0 <= u < W and 0 <= v < H and ok_zewn(u, v) for u, v in zew):
                    return "bok %s prosty na %d kratek (naprzeciw %d), rodzaj %s" % (nazwa, dl, n_opp, k)
            i = j + 1
    return None


# ------------------------------------------------------------------ a: pas liści
def sprawdz_a(mp):
    out = []; W, H = mp.W, mp.H
    maska = np.zeros((H, W), bool); blok = np.zeros((H, W), bool)
    for z in (0, 1):
        for y in range(H):
            for x in range(W):
                t = mp.t(z, x, y)
                if lisc(t):
                    maska[y, x] = True
                    if mp.zest.flag(t) & 0x0F == 0x0F: blok[y, x] = True
    for c in lib.skladowe(maska):
        gl = max(lib.gleb(W, H, x, y) for x, y in c)
        bl = sorted(q for q in c if blok[q[1], q[0]])
        if mp.tsid == 11 and bl:
            out.append((bl[0][0], bl[0][1], "blokujące liście (zestaw 11): %d kratek w składowej o %d" % (len(bl), len(c))))
        elif gl <= CIENKA:
            pas = sorted(q for q in c if lib.gleb(W, H, *q) < GLEB_PASA)
            if pas: out.append((pas[0][0], pas[0][1], "pas liści przy krawędzi: %d kratek (głębokość max %d)" % (len(pas), gl)))
    return out


# ------------------------------------------------------------------ b: ucięty / pojedynczy grunt
def sprawdz_b(mp):
    out = []; W, H = mp.W, mp.H
    for z, rodz in ((0, set(GRUNT)), (1, GRUNT_W1)):
        a = warstwa(mp, z)
        K = np.full((H, W), -1, np.int32)
        for y in range(H):
            for x in range(W):
                k = rodzaj(int(a[y, x]))
                if k is not None and k in GRUNT: K[y, x] = k
        for k in sorted(rodz):
            m = K == k
            if not m.any(): continue
            for c in lib.skladowe(m, osiem=False):
                cs = set(c)
                xs = [q[0] for q in c]; ys = [q[1] for q in c]
                x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
                pierscien = {(x + dx, y + dy) for x, y in c for dx in (-1, 0, 1) for dy in (-1, 0, 1)} - cs
                w_mapie = all(0 <= u < W and 0 <= v < H for u, v in pierscien)
                if (len(c) == 1 or (min(x1 - x0, y1 - y0) == 0 and 2 <= len(c) <= 12)) and w_mapie:
                    inne = {int(K[v, u]) for u, v in pierscien}
                    if z == 0 and len(inne) == 1 and -1 not in inne and k in NATURA and next(iter(inne)) in NATURA:
                        out.append((c[0][0], c[0][1], "%s gruntu %d na warstwie 0 otoczony gruntem %d" % ("pojedyncza kratka" if len(c) == 1 else "pasek jednej kratki (%d)" % len(c), k, inne.pop())))
                    elif z == 1 and len(c) == 1 and all(K[v, u] != k for u, v in pierscien):
                        out.append((c[0][0], c[0][1], "pojedyncza kratka gruntu %d na warstwie 1" % k))
                    continue
                if k not in NATURA: continue
                if z == 0: ok = lambda u, v, k=k: K[v, u] in NATURA and K[v, u] != k
                else: ok = lambda u, v, k=k: K[v, u] != k
                d = bok_prosty(c, W, H, ok, k)
                if d: out.append((c[0][0], c[0][1], "plama gruntu (warstwa %d) ucięta: %s" % (z, d)))
    return out


# ------------------------------------------------------------------ c: drzewa z kafli bez gwiazdki
_ZIEL = {}


def zielona_korona(zest, t):
    kl = (id(zest), t)
    if kl not in _ZIEL:
        ok = False
        if 0 < t < 1024 and not zest.gwiazdka(t) and zest.flag(t) & 0x0F != 0x0F and zest.pokrycie(t) >= 0.30:
            im = np.asarray(zest.tile(t), float); a = im[..., 3] > 40
            r, g, b = (im[..., i][a].mean() for i in range(3))
            ok = g > r + 8 and g > b + 4
        _ZIEL[kl] = ok
    return _ZIEL[kl]


def sprawdz_c(mp):
    out = []; W, H = mp.W, mp.H
    maska = np.zeros((H, W), bool)
    for y in range(H):
        for x in range(W):
            if any(zielona_korona(mp.zest, mp.t(z, x, y)) for z in (2, 3)): maska[y, x] = True
    for c in lib.skladowe(maska):
        xs = [q[0] for q in c]; ys = [q[1] for q in c]
        if len(c) < 6 or max(xs) - min(xs) < 1 or max(ys) - min(ys) < 1: continue
        chodl = [q for q in sorted(c) if mp.stoi(*q)]
        if chodl:
            tl = sorted({t for q in chodl for t in mp.gorne(*q)})
            out.append((chodl[0][0], chodl[0][1], "korona z %d kafli bez gwiazdki, %d kratek chodliwych pod nią (kafle %s)" % (len(c), len(chodl), tl[:6])))
    return out


# ------------------------------------------------------------------ d, e: mur i półka przy krawędzi (z sąsiadem w świecie)
def sasiedzi_krawedzi(sw, mid):
    """{(x, y): [(b, bx, by, strona)]} kratki krawędzi mapy -> kratka sąsiada w świecie"""
    d = {}
    for side in "NSWE":
        for c in sw.krawedz(mid, side):
            d.setdefault((c["x"], c["y"]), []).append((c["b"], c["bx"], c["by"], side))
    return d


def jest(mp, x, y, pred):
    return any(pred(mp.t(z, x, y)) for z in (0, 1))


def mur(t):
    k = rodzaj(t); return k is not None and 48 <= k < 128


def sprawdz_krawedz(sw, mp, pred):
    """kratki krawędzi z elementem pred, który dochodzi prostopadle (kratka w głąb też ma element, a obie sąsiednie wzdłuż krawędzi nie obie),
    a w kratce świata sąsiada elementu brak"""
    out = []; W, H = mp.W, mp.H; sas = sasiedzi_krawedzi(sw, mp.id)
    for (x, y), lst in sorted(sas.items()):
        if not jest(mp, x, y, pred): continue
        for (b, bx, by, side) in lst:
            ix, iy = {"N": (x, y + 1), "S": (x, y - 1), "W": (x + 1, y), "E": (x - 1, y)}[side]
            px, py = ((1, 0) if side in "NS" else (0, 1))
            wzdl = [jest(mp, x + dx * px, y + dx * py, pred) for dx in (-1, 1) if 0 <= x + dx * px < W and 0 <= y + dx * py < H]
            if not (0 <= ix < W and 0 <= iy < H) or not jest(mp, ix, iy, pred): continue
            if len(wzdl) == 2 and all(wzdl): continue          # biegnie wzdłuż krawędzi, nie prostopadle
            if b is None or b <= 0: out.append((x, y, "urwany na krawędzi %s: brak sąsiada w świecie" % side)); continue
            mb = sw.M.get(b)
            if mb is None or bx is None or not (0 <= bx < mb.W and 0 <= by < mb.H) or not jest(mb, bx, by, pred):
                out.append((x, y, "urwany na krawędzi %s: w mapie %d w tej kratce świata brak ciągu dalszego" % (side, b)))
    return out


def sprawdz_prosty_polka(mp):
    out = []; W, H = mp.W, mp.H
    if mp.tsid != 11: return out
    a = warstwa(mp, 1); m = np.zeros((H, W), bool)
    for y in range(H):
        for x in range(W):
            if rodzaj(int(a[y, x])) == SKALA: m[y, x] = True
    for c in lib.skladowe(m):
        d = bok_prosty(c, W, H, lambda u, v: not m[v, u], SKALA)
        if d: out.append((c[0][0], c[0][1], "półka ucięta prostą linią: " + d))
    return out


# ------------------------------------------------------------------ f-j: uwagi gracza po mapie próbnej A (2026-11-01, docs/MAPY_ZASADY.md rozdz. 12)
DRZEWA_GR = ("!$Pine", "!$Tree", "!$Big_Trees")
RUN_MAX = 4              # prosty odcinek obrysu plamy gruntu: > RUN_MAX kratek = kanciasty (gracz: 2-3 kratki; przy progu 3 brzeg wychodzi piłą - zęby co 3 kratki - więc próg 4)
ZIEMIE = (17, 24)
PLAMY_J = (17, 24, 27)


def stairs(t): return 512 <= t < 768


def sprawdz_f(mp):
    """lico wzgórza (A2-47 na warstwie 1): dziura 1 kratki w licu, ząb/wcięcie 1 kolumny w dolnej linii, skok o >= 2 w sąsiednich kolumnach,
    zygzak (>= 3 kolejne odcinki dolnej linii długości <= 2)"""
    out = []; W, H = mp.W, mp.H
    a = warstwa(mp, 1)
    m = np.zeros((H, W), bool)
    for y in range(H):
        for x in range(W):
            if rodzaj(int(a[y, x])) == SKALA: m[y, x] = True
    for c in lib.skladowe(m):
        if len(c) < 8: continue
        cs = set(c)
        xs = [q[0] for q in c]; ys = [q[1] for q in c]
        x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
        dz = None
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                if (x, y) in cs or stairs(int(a[y, x])): continue
                if ((x - 1, y) in cs and (x + 1, y) in cs) or ((x, y - 1) in cs and (x, y + 1) in cs):
                    dz = (x, y); break
            if dz: break
        if dz: out.append((dz[0], dz[1], "dziura 1 kratki w licu / obrysie wzgórza"))
        col = {}
        for (x, y) in c: col.setdefault(x, []).append(y)
        face = {}
        for x, ys_ in col.items():
            yb = max(ys_); t = 1
            while (x, yb - t) in cs: t += 1
            if 2 <= t <= 4: face[x] = yb        # (lico 2-4 kratki; wyższa kolumna to boczna krawędź wzgórza)
        xs_ = sorted(face)
        for x in xs_:
            if x - 1 in face and x + 1 in face:
                d1, d2 = face[x] - face[x - 1], face[x] - face[x + 1]
                if d1 * d2 > 0: out.append((x, face[x], "ząb/wcięcie 1 kolumny w dolnej linii lica")); break
        for x in xs_:
            if x + 1 in face and abs(face[x + 1] - face[x]) >= 2: out.append((x, face[x], "skok dolnej linii lica o >= 2 kratek")); break
        runs = []; i = 0
        while i < len(xs_):
            j = i
            while j + 1 < len(xs_) and xs_[j + 1] == xs_[j] + 1 and face[xs_[j + 1]] == face[xs_[i]]: j += 1
            runs.append((xs_[i], j - i + 1, face[xs_[i]])); i = j + 1
        for q in range(len(runs) - 2):
            if all(r[1] <= 2 for r in runs[q:q + 3]) and runs[q + 1][0] == runs[q][0] + runs[q][1]:
                out.append((runs[q][0], runs[q][2], "schodkowa dolna linia lica (odcinki po 1-2 kratki)")); break
    return out


# ---- f (dopisek 2026-11-01, uwaga gracza: „Jak zaczynasz budować wzgórza, to z każdej strony muszą być zakończone.”): wzgórze zamknięte ze WSZYSTKICH stron
HILL_A5_REL = {88, 89, 90, 96, 97, 98, 104, 105, 106, 112, 113, 114, 120, 121, 122, 73, 74, 81, 82, 76, 24, 25, 26, 27}
# wymagane sąsiedztwo kafla obrysu A5 (rel): kierunki, w których MUSI być dalszy ciąg obrysu (W E N S)
HILL_WYMAGA = {88: "ES", 89: "WE", 90: "WS", 96: "NS", 98: "NS", 113: "WE", 121: "WE", 112: "E", 120: "E", 114: "W", 122: "W", 104: "E", 106: "W"}


def sprawdz_f_zamkniete(mp):
    """każde wzgórze (składowa 8-spójna kafli obrysu A5 / krawędzi A2-47 na warstwie 1, >= 12 kratek) ma obejmować jakiś obszar ze WSZYSTKICH stron (obrys zamknięty:
    wypełnienie od zewnątrz ramki nie wchodzi do środka), a kafle obrysu mają mieć wymagany dalszy ciąg (lico, boki, góra, narożniki): inaczej strona otwarta / urwany kawałek"""
    out = []; W, H = mp.W, mp.H
    a0 = warstwa(mp, 0); a1 = warstwa(mp, 1)
    cells = set(); rel = {}
    for y in range(H):
        for x in range(W):
            t = int(a0[y, x])
            if 1536 <= t < 2048 and (t - 1536) in HILL_A5_REL: cells.add((x, y)); rel[(x, y)] = t - 1536
            if rodzaj(int(a1[y, x])) == SKALA: cells.add((x, y))
    if not cells: return out
    seen = set()
    for c in lib.skladowe(np.array([[ (x, y) in cells for x in range(W)] for y in range(H)]), osiem=True):
        if len(c) < 12: continue
        cs = set(c)
        xs = [q[0] for q in c]; ys = [q[1] for q in c]
        x0, x1, y0, y1 = min(xs) - 1, max(xs) + 1, min(ys) - 1, max(ys) + 1
        st = [(x, y) for x in range(x0, x1 + 1) for y in range(y0, y1 + 1) if (x in (x0, x1) or y in (y0, y1)) and (x, y) not in cs]
        vis = set(st); fr = list(st)
        while fr:
            x, y = fr.pop()
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                n = (x + dx, y + dy)
                if x0 <= n[0] <= x1 and y0 <= n[1] <= y1 and n not in cs and n not in vis: vis.add(n); fr.append(n)
        wnetrze = [(x, y) for x in range(x0, x1 + 1) for y in range(y0, y1 + 1) if (x, y) not in cs and (x, y) not in vis]
        if not wnetrze:
            out.append((xs[0], ys[0], "wzgórze otwarte z jakiejś strony (obrys niezamknięty, %d kratek)" % len(c))); continue
        zle = []
        for (x, y) in c:
            r = rel.get((x, y))
            wym = HILL_WYMAGA.get(r)
            if not wym: continue
            for ch in wym:
                d = {"W": (-1, 0), "E": (1, 0), "N": (0, -1), "S": (0, 1)}[ch]
                if (x + d[0], y + d[1]) not in cs: zle.append((x, y, r, ch)); break
        if zle: out.append((zle[0][0], zle[0][1], "urwany kawałek obrysu wzgórza: kafel A5 %d bez ciągu w kierunku %s (%d takich kafli)" % (zle[0][2], zle[0][3], len(zle))))
    return out



def woda_maska(mp):
    W, H = mp.W, mp.H
    w = np.zeros((H, W), bool)
    for y in range(H):
        for x in range(W):
            for z in (0, 1):
                t = mp.t(z, x, y)
                k = rodzaj(t) if t else None
                if k is not None and k < 16 and (k < 4 or k % 2 == 0): w[y, x] = True
    return w


def sprawdz_g(mp):
    """drzewo (zdarzenie) bliżej niż 4 kratki od wody albo na gruncie brzegu (ziemia/kamień) bliżej niż 7 kratek od wody"""
    out = []; w = woda_maska(mp)
    if not w.any(): return out
    ys, xs = np.nonzero(w)
    for e in mp.zd:
        if not e.page: continue
        gr = e.page.get("image", {}).get("characterName", "") or ""
        if not gr.startswith(DRZEWA_GR): continue
        d = float(np.sqrt(((xs - e.x) ** 2 + (ys - e.y) ** 2).min()))
        if d < 4: out.append((e.x, e.y, "drzewo %.1f kratki od wody" % d))
        elif d < 7:
            k0 = rodzaj(mp.t(0, e.x, e.y)); k1 = rodzaj(mp.t(1, e.x, e.y)); t0 = mp.t(0, e.x, e.y)
            if k0 in ZIEMIE or k1 in (36, 39, 23, SKALA) or 1536 <= t0 < 2048:
                out.append((e.x, e.y, "drzewo na gruncie brzegu (ziemia/kamień) %.1f kratki od wody" % d))
    return out


def sprawdz_h(mp):
    """płot (A2-22 na warstwie 1) lub mur z kafli na warstwie 1: grunt pod nim inny niż wokół (rama innego gruntu)"""
    out = []; W, H = mp.W, mp.H
    a1 = warstwa(mp, 1); a0 = warstwa(mp, 0)
    m = np.zeros((H, W), bool)
    for y in range(H):
        for x in range(W):
            k = rodzaj(int(a1[y, x]))
            if k == 22 or (k is not None and 48 <= k < 128): m[y, x] = True

    def g0(x, y):
        t = int(a0[y, x]); k = rodzaj(t)
        return k if k is not None else ("A5" if t else 0)
    for c in lib.skladowe(m):
        cs = set(c)
        pod = collections.Counter(g0(x, y) for x, y in c)
        ring = collections.Counter()
        for (x, y) in c:
            for dx in range(-3, 4):
                for dy in range(-3, 4):
                    u, v = x + dx, y + dy
                    if max(abs(dx), abs(dy)) >= 2 and 0 <= u < W and 0 <= v < H and (u, v) not in cs and not m[v, u]: ring[g0(u, v)] += 1
        tot_r = sum(ring.values()) or 1; tot_p = sum(pod.values())
        for k, n in pod.items():
            if n / tot_p >= 0.25 and ring.get(k, 0) / tot_r < 0.10:
                out.append((c[0][0], c[0][1], "pod płotem/murem grunt %s, wokół %s" % (k, dict(ring.most_common(2))))); break
    return out


def N_floor(same):
    sys.path.insert(0, os.path.join(ROOT, "tools", "newstart"))
    import nslib
    return nslib.floor_shape(same)


def sprawdz_i(mp):
    """lico z kafli A5 (zakończenia 112/120 po lewej, 114/122 po prawej, względem początku A5) sąsiadujące bokiem ze schodami (kafle A5 24-27 na warstwie 0):
    przy schodach lico ma dochodzić prosto (kafel środka 113/121), zakończenie zaokrąglone to błąd"""
    out = []; W, H = mp.W, mp.H
    a = warstwa(mp, 0)

    def st(x, y):
        return 0 <= x < W and 0 <= y < H and 1536 <= a[y, x] < 2048 and (int(a[y, x]) - 1536) in (24, 25, 26, 27)
    for y in range(H):
        for x in range(W):
            t = int(a[y, x]) - 1536
            if t in (112, 120) and st(x - 1, y): out.append((x, y, "lewe zakończenie lica (A5 %d) tuż przy schodach" % t))
            elif t in (114, 122) and st(x + 1, y): out.append((x, y, "prawe zakończenie lica (A5 %d) tuż przy schodach" % t))
    return out


def sprawdz_j(mp):
    """plama gruntu (A2 17/24/27 na warstwie 0) prostokątna (wypełnia >= 85% prostokąta >= 4x3) albo z prostym odcinkiem obrysu > RUN_MAX kratek
    (góra/dół/lewo/prawo). Plamy dotykające krawędzi mapy pomijane."""
    out = []; W, H = mp.W, mp.H
    a = warstwa(mp, 0)
    K = np.full((H, W), -1, np.int32)
    for y in range(H):
        for x in range(W):
            k = rodzaj(int(a[y, x]))
            if k in PLAMY_J: K[y, x] = k
    for k in PLAMY_J:
        m = K == k
        if not m.any(): continue
        for c in lib.skladowe(m, osiem=False):
            if len(c) < 8: continue
            xs = [q[0] for q in c]; ys = [q[1] for q in c]
            x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
            if x0 == 0 or y0 == 0 or x1 == W - 1 or y1 == H - 1: continue
            bw, bh = x1 - x0 + 1, y1 - y0 + 1
            if bw >= 4 and bh >= 3 and len(c) >= 0.85 * bw * bh:
                out.append((x0, y0, "prostokątna plama gruntu %d (%dx%d, wypełnienie %.0f%%)" % (k, bw, bh, 100.0 * len(c) / (bw * bh)))); continue
            msg = None
            for nazwa, os_, sg in (("góra", 0, 1), ("dół", 0, -1), ("lewo", 1, 1), ("prawo", 1, -1)):
                edge = {}
                for (x, y) in c:
                    key, v = (x, sg * y) if os_ == 0 else (y, sg * x)
                    if key not in edge or v < edge[key]: edge[key] = v
                ks = sorted(edge); run = 1; best = 1
                for i in range(1, len(ks)):
                    if ks[i] == ks[i - 1] + 1 and edge[ks[i]] == edge[ks[i - 1]]: run += 1
                    else: run = 1
                    best = max(best, run)
                if best > RUN_MAX: msg = "prosty odcinek obrysu (%s) %d kratek, rodzaj %d" % (nazwa, best, k); break
            if msg: out.append((x0, y0, msg))
    return out


def wszystkie(sw, mp, testy):
    r = {}
    if "a" in testy: r["a"] = sprawdz_a(mp)
    if "b" in testy: r["b"] = sprawdz_b(mp)
    if "c" in testy: r["c"] = sprawdz_c(mp)
    if "d" in testy: r["d"] = sprawdz_krawedz(sw, mp, mur)
    if "e" in testy:
        pol = (lambda t: mp.tsid == 11 and rodzaj(t) == SKALA)
        r["e"] = sprawdz_krawedz(sw, mp, pol) + sprawdz_prosty_polka(mp)
    for t_, f_ in (("f", sprawdz_f), ("g", sprawdz_g), ("h", sprawdz_h), ("i", sprawdz_i), ("j", sprawdz_j)):
        if t_ in testy: r[t_] = f_(mp) + (sprawdz_f_zamkniete(mp) if t_ == "f" else [])
    return r


def wyjatki():
    if not os.path.exists(WYJATKI_PLIK): return {}
    return {(w["mapa"], w["x"], w["y"], w["sprawdzenie"]): w["powod"] for w in json.load(open(WYJATKI_PLIK, encoding="utf-8"))}


def obraz(mp, x, y, plik, kol):
    r = (max(0, x - 8), max(0, y - 6), min(mp.W - 1, x + 8), min(mp.H - 1, y + 6))
    L.render(mp, region=r, grid=True, marks=[(x, y, kol, "")]).convert("RGB").save(plik)


def main(argv):
    ids = [int(a) for a in argv if a.isdigit()] or lib.mapy_swiata()
    testy = argv[argv.index("--test") + 1].split(",") if "--test" in argv else list(TESTY)
    odir = argv[argv.index("--obrazy") + 1] if "--obrazy" in argv else None
    if odir: os.makedirs(odir, exist_ok=True)
    sw = S.Swiat(); wyj = wyjatki()
    suma = collections.Counter(); wyj_n = collections.Counter(); wiersze = []
    for mid in ids:
        mp = sw.M.get(mid)
        if mp is None: print("brak mapy", mid); continue
        wyn = wszystkie(sw, mp, testy)
        lic = {}
        for t, lst in wyn.items():
            licz = 0
            for (x, y, opis) in lst:
                wy = wyj.get((mid, x, y, t))
                if wy: wyj_n[t] += 1; kol = (0, 160, 255)
                else: licz += 1; kol = (255, 40, 40)
                if "--lista" in argv: print("  %s Map%03d (%d,%d) %s%s" % (t, mid, x, y, opis, "   [wyjątek: %s]" % wy if wy else ""))
                if odir: obraz(mp, x, y, os.path.join(odir, "%s_Map%03d_%d_%d.png" % (t, mid, x, y)), kol)
            lic[t] = licz; suma[t] += licz
        wiersze.append((mid, lic))
    print("Estetyka map świata (%s):" % ("staging " + S.STAGING if S.STAGING else "data/"))
    print("  mapa  " + "  ".join("%3s" % t for t in testy))
    for mid, lic in wiersze: print("  %4d  " % mid + "  ".join("%3d" % lic.get(t, 0) for t in testy))
    print("  razem " + "  ".join("%3d" % suma[t] for t in testy), "  (wyjątki odjęte: %s)" % dict(wyj_n))
    for t in testy: print("   %s - %s: %d" % (t, NAZWY[t], suma[t]))
    bad = sum(suma.values())
    print("WYNIK:", "OK" if bad == 0 else "BŁĄD (%d)" % bad)
    return 0 if bad == 0 else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
