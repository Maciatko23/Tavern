# -*- coding: utf-8 -*-
"""MAPY PRÓBNE A (990, zestaw 11, styl 013/159/008) i B (991, zestaw 9, styl 003), RUNDA 2 (uwagi gracza 2026-11-01, docs/MAPY_ZASADY.md rozdz. 12).
Obie mapy powstają z JEDNEGO wspólnego płótna 128x60 (A = kolumny 0..63, B = 64..127): szew A|B (kolumny 54..73) to tylko grunt wspólny dla zestawów 9 i 11
(A2 16-33, 36-45; tools/swiat/szwy2/staging/mapa_a2.json), bez zdarzeń i obiektów z kafli; ścieżka przechodzi przez szew.
Budowa: wzgórza, półki, plamy gruntu, ścieżki i koryta to GENERATORY o obrysach wygładzonych (promień zakrętów >= 2-3 kratki, bez zębów i dziur, odcinki
proste <= 4 kratki), na kaflach ze wzorców (A2-47 lico wzgórza, A5 113/121 lico półki, A2-24 ziemia, A2-36 koryto); drzewa, kępy, sad, pole skał to
zdarzenia z pieczątek (tylko zdarzenia, bez własnego gruntu); mur z baszty to pieczątka tylko z obiektami. Drzewa nie stoją bliżej niż 6 kratek od wody
(rzednieją do 14). Płoty i mury stoją na gruncie, który tam jest.
  python tools/mapa_probna/zbuduj.py            -> tools/mapa_probna/staging/data/Map990.json, Map991.json"""
import os, sys, json, math, random, copy
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..")).replace("\\", "/") + "/"
sys.path.insert(0, os.path.join(ROOT, "tools", "mapy", "pieczatki"))
sys.path.insert(0, os.path.join(ROOT, "tools", "mapy"))
sys.path.insert(0, os.path.join(ROOT, "tools", "newstart"))
import pieczatki as P
import mapylib as L
sys.argv = [a for a in sys.argv if a != "--staging"]
import nslib as N
import numpy as np
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass

STG = os.path.join(HERE, "staging")
W1, H = 64, 60
SZEW = 64
ID_A, ID_B = 990, 991
STREFA = (SZEW - 10, SZEW + 10)
PROPS = {"autoplayBgm": True, "bgm": {"name": "Field1", "pan": 0, "pitch": 100, "volume": 90}, "autoplayBgs": False,
         "bgs": {"name": "", "pan": 0, "pitch": 100, "volume": 90}, "disableDashing": False, "displayName": "", "encounterList": [],
         "encounterStep": 30, "note": "", "parallaxLoopX": False, "parallaxLoopY": False, "parallaxName": "", "parallaxShow": True,
         "parallaxSx": 0, "parallaxSy": 0, "scrollType": 0, "specifyBattleback": False}
C = P.Plotno(2 * W1, H, 11, 16)
zaj = np.zeros((H, 2 * W1), bool)         # kratki zajęte (kolizje generatorów i pieczątek)
zaj_s = np.zeros((H, 2 * W1), bool)       # tylko konstrukcje (morze, wzgórza, półki, płoty, mur): przez nie ścieżka nie przechodzi
woda = np.zeros((H, 2 * W1), bool)
log = []
RUN = 4                                    # najdłuższy prosty odcinek obrysu plamy


def kinds(k): return 2048 + 48 * k


# ------------------------------------------------------------------------------------------------ kształty
def wygladz(cells, ile=2):
    """filtr większościowy 3x3: usuwa zęby, wcięcia i dziury 1 kratki"""
    cs = set(cells)
    for _ in range(ile):
        kand = {(x + dx, y + dy) for (x, y) in cs for dx in (-1, 0, 1) for dy in (-1, 0, 1)}
        nowe = set()
        for (x, y) in kand:
            n = sum(((x + dx, y + dy) in cs) for dx in (-1, 0, 1) for dy in (-1, 0, 1) if dx or dy)
            if ((x, y) in cs and n >= 3) or ((x, y) not in cs and n >= 5): nowe.add((x, y))
        cs = nowe
    return cs


def lam_proste(cells, maks=RUN, rundy=8):
    """łamie proste odcinki obrysu dłuższe niż maks: w środku odcinka dokłada kratkę na zewnątrz (szczyt wygładza autokafel)"""
    cs = set(cells)
    for _ in range(rundy):
        zm = False
        xs = [c[0] for c in cs]; ys = [c[1] for c in cs]
        if not cs: break
        for os_, sg in ((0, 1), (0, -1), (1, 1), (1, -1)):
            edge = {}
            for (x, y) in cs:
                key, v = (x, sg * y) if os_ == 0 else (y, sg * x)
                if key not in edge or v < edge[key]: edge[key] = v
            ks = sorted(edge); i = 0
            while i < len(ks):
                j = i
                while j + 1 < len(ks) and ks[j + 1] == ks[j] + 1 and edge[ks[j + 1]] == edge[ks[i]]: j += 1
                if j - i + 1 > maks:
                    mid = ks[(i + j) // 2]; v = edge[ks[i]] - 1
                    for q in (0, 1):
                        c = (mid + q, sg * v) if os_ == 0 else (sg * v, mid + q)
                        cs.add(c)
                    zm = True
                i = j + 1
        if not zm: break
    return cs


def organiczna(cx, cy, rx, ry, seed, wob=0.2, wykl=2.0, ile=2, lam=True):
    r = random.Random(seed)
    ph = [r.uniform(0, 6.28) for _ in range(4)]
    cs = set()
    for y in range(int(cy - ry * 1.5) - 2, int(cy + ry * 1.5) + 3):
        for x in range(int(cx - rx * 1.5) - 2, int(cx + rx * 1.5) + 3):
            dx, dy = (x - cx) / rx, (y - cy) / ry
            a = math.atan2(dy, dx)
            w = 1 + wob * (0.5 * math.sin(2 * a + ph[0]) + 0.3 * math.sin(3 * a + ph[1]) + 0.2 * math.sin(5 * a + ph[2]))
            if abs(dx) ** wykl + abs(dy) ** wykl <= w ** wykl: cs.add((x, y))
    return lam_proste(wygladz(cs, ile)) if lam else wygladz(cs, ile)


def rysuj(cells, k, z=0, nad=True):
    for (x, y) in cells:
        if 0 <= x < 2 * W1 and 0 <= y < H:
            C.a[z, y, x] = kinds(k)
            if z == 0: C.a[1, y, x] = 0 if C.a[1, y, x] and ((C.a[1, y, x] - 2048) // 48 in (21, 46)) else C.a[1, y, x]
    C.przelicz(set(cells), 1, (z,))


def zajmij(cells, margines=1, konstr=True):
    for (x, y) in cells:
        zaj[max(0, y - margines):y + margines + 1, max(0, x - margines):x + margines + 1] = True
        if konstr: zaj_s[max(0, y - margines):y + margines + 1, max(0, x - margines):x + margines + 1] = True


def wolne(cells, margines=1):
    for (x, y) in cells:
        if not (0 <= x < 2 * W1 and 0 <= y < H): return False
        if zaj[max(0, y - margines):y + margines + 1, max(0, x - margines):x + margines + 1].any(): return False
    return True


# ------------------------------------------------------------------------------------------------ ścieżki
def catmull(pts, krok=0.5):
    out = []
    p = [pts[0]] + list(pts) + [pts[-1]]
    for i in range(1, len(p) - 2):
        p0, p1, p2, p3 = p[i - 1], p[i], p[i + 1], p[i + 2]
        n = max(2, int(math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / krok))
        for s in range(n):
            t = s / n
            out.append(tuple(0.5 * ((2 * p1[q]) + (-p0[q] + p2[q]) * t + (2 * p0[q] - 5 * p1[q] + 4 * p2[q] - p3[q]) * t * t + (-p0[q] + 3 * p1[q] - 3 * p2[q] + p3[q]) * t ** 3) for q in (0, 1)))
    out.append(pts[-1])
    return out


def sciezka_komorki(pts, szer, seed, zwez=7.0, kon=(True, True)):
    """wstęga o szerokości szer ze zwężającymi się, zaokrąglonymi końcami; obrys falowany, wygładzony i z łamanymi prostymi"""
    r = random.Random(seed); ph = [r.uniform(0, 6.28) for _ in range(3)]
    S0 = catmull(pts); L_ = len(S0)
    S = []
    for i, (px_, py_) in enumerate(S0):
        a_ = S0[max(0, i - 1)]; b_ = S0[min(L_ - 1, i + 1)]
        tx, ty = b_[0] - a_[0], b_[1] - a_[1]; nn = math.hypot(tx, ty) or 1.0
        off = 2.4 * math.sin(i * 0.5 / 6.0 + ph[2]) + 1.0 * math.sin(i * 0.5 / 2.7 + ph[0])
        S.append((px_ - ty / nn * off, py_ + tx / nn * off))
    dl = [0.0]
    for i in range(1, L_): dl.append(dl[-1] + math.hypot(S[i][0] - S[i - 1][0], S[i][1] - S[i - 1][1]))
    tot = dl[-1]
    xs = [p[0] for p in S]; ys = [p[1] for p in S]
    cs = set()
    for y in range(int(min(ys) - szer) - 2, int(max(ys) + szer) + 3):
        for x in range(int(min(xs) - szer) - 2, int(max(xs) + szer) + 3):
            best = 1e9
            for i in range(0, L_):
                d = math.hypot(x - S[i][0], y - S[i][1])
                if d < 5:
                    t = dl[i]
                    f = 1.0
                    if kon[0]: f = min(f, 0.45 + 0.55 * min(1.0, t / zwez))
                    if kon[1]: f = min(f, 0.45 + 0.55 * min(1.0, (tot - t) / zwez))
                    w = szer / 2.0 * f * (1 + 0.18 * math.sin(t / 4.0 + ph[0]) + 0.1 * math.sin(t / 2.3 + ph[1]))
                    best = min(best, d - w)
            if best <= 0: cs.add((x, y))
    return lam_proste(wygladz(cs, 1))


# ------------------------------------------------------------------------------------------------ wzgórze (A2-47 na warstwie 1) i półka ze schodami (A5)
def wzgorze(cx, cy, rx, ry, seed, tsid_region=True):
    """plateau = wygładzona superelipsa; lico: 1 kratka obrysu po bokach i u góry, 2 kratki od południa; kształty liczy autokafel A2-47"""
    P_ = organiczna(cx, cy, rx, ry, seed, wob=0.1, wykl=2.5, ile=3, lam=False)
    rim = set()
    for (x, y) in P_:
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            n = (x + dx, y + dy)
            if n not in P_: rim.add(n)
    face = set()
    for (x, y) in list(rim):
        if (x, y - 1) in P_: face.add((x, y + 1)); face.add((x, y + 2))
    R = (rim | face)
    # lico bez dziur: kratki między dwiema kratkami lica (poziomo/pionowo), które nie należą do plateau
    for (x, y) in {(a + dx, b + dy) for (a, b) in R for dx in (-1, 0, 1) for dy in (-1, 0, 1)}:
        if (x, y) in R or (x, y) in P_: continue
        if ((x - 1, y) in R and (x + 1, y) in R) or ((x, y - 1) in R and (x, y + 1) in R): R.add((x, y))
    return P_, R


def rampa(P_, R):
    yb = max(c[1] for c in P_)
    xs = sorted(x for (x, y) in P_ if y == yb)
    xm = xs[len(xs) // 2]
    return {(x, y) for (x, y) in R if x in (xm, xm + 1) and y > yb - 1}


def f_ok(R):
    """te same reguły co estetyka.sprawdz_f: brak dziur 1 kratki, zębów, skoków >= 2 i zygzaków dolnej linii lica"""
    cs = set(R); xs = [c[0] for c in cs]; ys = [c[1] for c in cs]
    for y in range(min(ys), max(ys) + 1):
        for x in range(min(xs), max(xs) + 1):
            if (x, y) not in cs and (((x - 1, y) in cs and (x + 1, y) in cs) or ((x, y - 1) in cs and (x, y + 1) in cs)): return False
    col = {}
    for (x, y) in cs: col.setdefault(x, []).append(y)
    face = {}
    for x, ys_ in col.items():
        yb = max(ys_); t = 1
        while (x, yb - t) in cs: t += 1
        if 2 <= t <= 4: face[x] = yb
    xs_ = sorted(face)
    for x in xs_:
        if x - 1 in face and x + 1 in face and (face[x] - face[x - 1]) * (face[x] - face[x + 1]) > 0: return False
        if x + 1 in face and abs(face[x + 1] - face[x]) >= 2: return False
    runs = []; i = 0
    while i < len(xs_):
        j = i
        while j + 1 < len(xs_) and xs_[j + 1] == xs_[j] + 1 and face[xs_[j + 1]] == face[xs_[i]]: j += 1
        runs.append((xs_[i], j - i + 1)); i = j + 1
    for q in range(len(runs) - 2):
        if all(r[1] <= 2 for r in runs[q:q + 3]) and runs[q + 1][0] == runs[q][0] + runs[q][1]: return False
    return True


def kszt_ok(P_, cx, cy):
    """próbny obrys: rim A2-47 i pasmo na osobnym płótnie; musi przejść estetyka f i e (półka)"""
    import estetyka as E
    T_ = P.Plotno(80, 40, 11, 16)
    ox, oy = 40 - cx, 20 - cy
    Q = {(x + ox, y + oy) for (x, y) in P_}
    rim = {(x + dx, y + dy) for (x, y) in Q for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)) if (x + dx, y + dy) not in Q}
    yb = max(c[1] for c in Q); xs = sorted(x for (x, y) in Q if y == yb)
    band = {(x, yb + 1 + j) for x in range(xs[0], xs[-1] + 1) for j in range(3)}
    rim -= band
    for (x, y) in rim: T_.a[1, y, x] = kinds(47)
    T_.przelicz(rim, 1, (1,))
    raw = T_.do_raw(dict(P.L_PROPS_PUSTE)); raw["tilesetId"] = 11
    mp = L.Mapa(999, raw=raw)
    return not E.sprawdz_f(mp) and not E.sprawdz_prosty_polka(mp)


def poloz_wzgorze(cx, cy, rx, ry, seed):
    """wzgórze: plateau = zaokrąglony prostokąt (superelipsa wykładnik 4), cienka krawędź A2-47 po bokach i u góry, na dole PROSTE lico z kafli A5
    (pasmo 3 rzędów, równa wysokość, wolne końce z zakończeniami, w środku schody z prostym licem przy nich - polka()). Dolne rogi łagodnie
    zaokrągla krawędź A2-47 między końcem lica a bokiem."""
    for sd in range(seed, seed + 300):
        P_ = organiczna(cx, cy, rx, ry, sd, wob=0.08, wykl=2.7, ile=2, lam=False)
        if kszt_ok(P_, cx, cy): break
    log.append('wzgórze (%d,%d) ziarno %d' % (cx, cy, sd))
    yb = max(c[1] for c in P_)
    xs = sorted(x for (x, y) in P_ if y == yb)
    xl, xr = xs[0], xs[-1]
    rim = set()
    for (x, y) in P_:
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            n = (x + dx, y + dy)
            if n not in P_: rim.add(n)
    band = {(x, yb + 1 + j) for x in range(xl, xr + 1) for j in range(3)}
    rim = {c for c in rim if c not in band}
    if not wolne(P_ | rim | band, 1): log.append("KOLIZJA wzgórze (%d,%d)" % (cx, cy)); return None
    for (x, y) in rim:
        C.a[1, y, x] = kinds(47); C.a[5, y, x] = 2
    C.przelicz(rim, 1, (1,))
    if not polka(xl, yb + 1, xr - xl + 1, (xr - xl) // 2 - 1): return None
    zajmij(P_ | rim | band, 2)
    return P_, rim


_P = P.wczytaj_pieczatke("polka_prosta_a")


def pt(z, i, j): return _P["warstwy"][z][j * _P["w"] + i]


def polka(x, y, dl, schody):
    """półka z A5 (lico 3 rzędy: krawędź 104/105, lico 113/121; wolne końce z zakończeniami 112/120 i 114/122) i schodami o szerokości 2 w kolumnie schody
    (kafle schodów skopiowane z pieczątki). Przy schodach lico idzie prosto: tam kafel środka 113/121, nie zakończenie."""
    cells = {(x + i, y + j) for i in range(dl) for j in range(3)}
    if not wolne(cells, 2): log.append("KOLIZJA półka"); return False
    for i in range(dl):
        for j in range(3):
            if i == 0: v = pt(0, 2, j)
            elif i == dl - 1: v = pt(0, 7, j)
            else: v = pt(0, 3, j)
            C.a[0, y + j, x + i] = v; C.a[1, y + j, x + i] = 0
            C.a[5, y + j, x + i] = 2 if j >= 1 else 0
    for i in (schody, schody + 1):
        for j in range(3):
            for z in (0, 1):
                C.a[z, y + j, x + i] = pt(z, 8 + i - schody, j)
            C.a[5, y + j, x + i] = 0
    zajmij(cells, 2)
    return True


# ------------------------------------------------------------------------------------------------ pieczątki (tylko zdarzenia / tylko obiekty)
def zdarzenia_z(nazwa, x, y, ile_drzew=1.0, seed=1):
    """kładzie same zdarzenia pieczątki (drzewa, krzaki, kamienie) w oknie od (x, y); drzewa rzedną zależnie od odległości od wody"""
    p = P.wczytaj_pieczatke(nazwa)
    r = random.Random(seed); n = 0
    for d in p["zdarzenia"]:
        ex, ey = x + d["dx"], y + d["dy"]
        if not (0 <= ex < 2 * W1 and 0 <= ey < H): continue
        if STREFA[0] <= ex < STREFA[1]: continue
        gr = d["ev"]["pages"][0]["image"]["characterName"]
        if gr.startswith(("!$Pine", "!$Tree", "!$Big")):
            dw = dist_woda(ex, ey)
            if dw < 9: continue
            if dw < 20 and r.random() < 0.9 * (20 - dw) / 11.0: continue
            if r.random() > ile_drzew: continue
        if dist_woda(ex, ey) < 3 or zaj_s[ey, ex]: continue
        if zaj[ey, ex] and not gr.startswith(("!$Pine", "!$Tree", "!$Big", "!$Bush", "!$Rock")): continue
        if C.dodaj(d["ev"], ex, ey): n += 1
    return n


_dw = {}


def dist_woda(x, y):
    if "m" not in _dw:
        ys, xs = np.nonzero(woda); _dw["m"] = (xs, ys)
    xs, ys = _dw["m"]
    if len(xs) == 0: return 99.0
    return float(np.sqrt(((xs - x) ** 2 + (ys - y) ** 2).min()))


def zdarzenia_auto(nazwa, x0, y0, x1, y1, ile, seed, **kw):
    """kępy/lasy w wolnych miejscach okna: losowe przesunięcia, przyjęte gdy < 15% kratek zdarzeń leży na zajętych; drzewa rzedną przy wodzie (jak zdarzenia_z)"""
    p = P.wczytaj_pieczatke(nazwa); r = random.Random(seed); n = 0
    for _ in range(300):
        if n >= ile: break
        x, y = r.randrange(x0, x1), r.randrange(y0, y1)
        cells = [(x + d["dx"], y + d["dy"]) for d in p["zdarzenia"]]
        if any(not (2 <= a < 2 * W1 - 2 and 2 <= b < H - 2) for a, b in cells): continue
        if sum(1 for a, b in cells if zaj[b, a]) > 0.15 * len(cells) or any(zaj_s[b, a] for a, b in cells): continue
        if any(STREFA[0] <= a < STREFA[1] for a, b in cells): continue
        if zdarzenia_z(nazwa, x, y, seed=seed + n, **kw) > 0:
            for a, b in cells: zaj[b, a] = True
            n += 1
    return n


def mur_obiekty(x, y):
    """mur z basztą: tylko obiekty (kafle warstw 0 z murem 33/43, warstwy 2-3, region); grunt wokół zostaje taki, jaki jest"""
    p = P.wczytaj_pieczatke("mur_baszta_brama"); w, h = p["w"], p["h"]
    kr = set()
    for j in range(h):
        for i in range(w):
            k = (p["warstwy"][0][j * w + i] - 2048) // 48 if p["warstwy"][0][j * w + i] >= 2048 else -1
            if k in (33, 43) or p["warstwy"][2][j * w + i] or p["warstwy"][3][j * w + i] or p["regiony"][j * w + i]:
                kr.add((x + i, y + j))
    if not wolne(kr, 1): log.append("KOLIZJA mur"); return False
    for (cx, cy) in kr:
        i, j = cx - x, cy - y
        for z in range(4): C.a[z, cy, cx] = p["warstwy"][z][j * w + i]
        C.a[5, cy, cx] = p["regiony"][j * w + i]
    for (cx, cy) in kr:
        for t_, g_ in ((141, 133), (142, 134)):
            if C.a[3, cy, cx] == t_ and C.a[3, cy - 1, cx] == 0: C.a[3, cy - 1, cx] = g_
    C.przelicz(kr, 1, (0,))
    zajmij(kr, 2)
    return True


def zagroda(x, y, w, h, gdzie):
    """płot z A2-22 na warstwie 1 (region 2 blokuje także w zestawie 9); NIC nie zmienia pod nim ani wokół: grunt ma być już dobry"""
    ring = {(a, b) for a in range(max(0, x - 3), min(2 * W1, x + w + 3)) for b in range(max(0, y - 3), min(H, y + h + 3))}
    ks = {int((C.a[0, b, a] - 2048) // 48) if C.a[0, b, a] >= 2048 else -1 for (a, b) in ring}
    if not ks <= {16, 27}: log.append("ZAGRODA: grunt wokół %s" % sorted(ks)); return False
    kr = set()
    for i in range(w):
        if not (gdzie <= i < gdzie + 3): kr.add((x + i, y))
        kr.add((x + i, y + h - 1))
    for j in range(h): kr.add((x, y + j)); kr.add((x + w - 1, y + j))
    for (cx, cy) in kr:
        C.a[1, cy, cx] = kinds(22); C.a[5, cy, cx] = 2
    C.przelicz(kr, 1, (1,))
    zajmij(ring, 0)
    return True


# ------------------------------------------------------------------------------------------------ budowa
def kepki_i_kwiaty():
    rnd = random.Random(5)
    # kępki trawy (A2-21): skupiska 2-5 kratek, gęściej w głębi trawy, rzadziej przy gruncie innym niż trawa (stopniowe przejście)
    for _ in range(420):
        cx, cy = rnd.randrange(W1 + 2, 2 * W1 - 2), rnd.randrange(2, H - 2)
        if zaj[cy, cx] and rnd.random() < 0.7: continue
        for (dx, dy) in rnd.choice([[(0, 0), (1, 0)], [(0, 0), (0, 1), (1, 1)], [(0, 0)], [(0, 0), (1, 0), (2, 0)], [(0, 0), (1, 0), (0, 1), (1, 1)]]):
            x, y = cx + dx, cy + dy
            if x < 2 * W1 and y < H and C.a[1, y, x] == 0 and ((C.a[0, y, x] - 2048) // 48 if C.a[0, y, x] >= 2048 else 0) in (16, 27): C.a[1, y, x] = kinds(21)
    # kwiaty (A2-28/29): skupiska 6-12 kratek
    for i in range(16):
        cx, cy = rnd.randrange(W1 + 4, 2 * W1 - 4), rnd.randrange(4, H - 4)
        if STREFA[0] - 2 <= cx < STREFA[1] + 2: continue
        k = 28 if i % 2 == 0 else 29
        for _ in range(rnd.randrange(6, 12)):
            x, y = cx + rnd.randrange(-2, 3), cy + rnd.randrange(-2, 3)
            if C.a[1, y, x] in (0, kinds(21)) and ((C.a[0, y, x] - 2048) // 48 if C.a[0, y, x] >= 2048 else 0) in (16, 27) and not zaj[y, x]: C.a[1, y, x] = kinds(k)


def rozrzut(nazwy, ile, x0, y0, x1, y1, seed, od_wody=5, w_poblizu=None):
    """pojedyncze krzaki / kamienie / pnie z szablonów Map003, na trawie, z dala od wody i od siebie"""
    r = random.Random(seed); n = 0; proby = 0
    while n < ile and proby < ile * 60:
        proby += 1
        x, y = r.randrange(x0, x1), r.randrange(y0, y1)
        if STREFA[0] <= x < STREFA[1] or zaj[y, x] or dist_woda(x, y) < od_wody: continue
        k0 = (C.a[0, y, x] - 2048) // 48 if C.a[0, y, x] >= 2048 else -1
        if k0 not in (16, 27, 24): continue
        if C.a[1, y, x] and (C.a[1, y, x] - 2048) // 48 not in (21, 46, 28, 29, 39, 23): continue
        pic = r.choice(nazwy)
        if C.dodaj(copy.deepcopy(N.TMPL[pic]), x, y): n += 1
    return n


def wstaw_cale(nazwa, x, y, konstr=False, margines=1):
    """pieczątka z całym obiektem gracza, wstawiona BEZ ZMIAN; kształty autokafli przelicza tylko pierścień zewnętrzny (Plotno.wstaw); kolizje po masce"""
    p = P.wczytaj_pieczatke(nazwa); w, h = p["w"], p["h"]
    kr = {(x + i, y + j) for j in range(h) for i in range(w) if p["maska"][j * w + i]}
    if not kr or not wolne(kr, margines): return False
    if any(STREFA[0] <= c[0] < STREFA[1] for c in kr): return False
    if any(dist_woda(c[0], c[1]) < 10 for c in kr[:1]) if False else False: return False
    dw = min(dist_woda(c[0], c[1]) for c in list(kr)[::7]) if woda.any() else 99
    if dw < 10: return False
    # zdarzenia: drzewa nie bliżej niż 9 od wody (jak w rundzie 2)
    p2 = copy.deepcopy(p)
    p2["zdarzenia"] = [d for d in p["zdarzenia"] if dist_woda(x + d["dx"], y + d["dy"]) >= 9 or not d["ev"]["pages"][0]["image"]["characterName"].startswith(("!$Pine", "!$Tree", "!$Big"))]
    C.wstaw(p2, x, y)
    zajmij(kr, margines, konstr)
    log.append("ok %-18s (%d,%d) %dx%d" % (nazwa, x, y, w, h))
    return True


def wstaw_cale_auto(nazwa, x0, y0, x1, y1, seed, konstr=False, margines=2):
    r = random.Random(seed)
    pos = [(x, y) for y in range(y0, y1) for x in range(x0, x1)]
    r.shuffle(pos)
    for (x, y) in pos:
        if wstaw_cale(nazwa, x, y, konstr, margines): return True
    log.append("BRAK MIEJSCA: %s" % nazwa)
    return False


def koryto_gdzie(kandydaci_pkt, seed):
    for pts in kandydaci_pkt:
        kor = sciezka_komorki(pts, 2.6, seed, zwez=3, kon=(True, True))
        if wolne(kor, 1):
            rysuj(kor, 36, 1); zajmij(kor, 1, False); return True
    log.append("BRAK MIEJSCA: koryto"); return False


GRACZ_JSON = os.path.join(HERE, "gracz", "Map990_gracz_dc61145d.json")
HILL_REL = {88, 89, 90, 96, 97, 98, 104, 105, 106, 112, 113, 114, 120, 121, 122, 73, 74, 81, 82, 76, 24, 25, 26, 27}
A_ORYGINAL = {}


def wczytaj_gracza():
    """A = mapa gracza (Map990, wersja dc61145d) 1:1 w kolumnach 0..63 płótna; zajęte miejsca liczone z tego, co narysował (kafle, zdarzenia, region)"""
    raw = json.loads(open(GRACZ_JSON, "rb").read().decode("utf-8"))
    a = P.warstwy_np(raw)
    A_ORYGINAL["a"] = a.copy(); A_ORYGINAL["events"] = [e for e in raw["events"] if e]
    C.a[:, :, :W1] = a
    for e in A_ORYGINAL["events"]:
        d = {k: v for k, v in e.items() if k not in ("id", "x", "y")}
        C.dodaj(d, e["x"], e["y"], sila=True)
    obs = np.zeros((H, W1), bool); hill = np.zeros((H, W1), bool)
    for y in range(H):
        for x in range(W1):
            t0, t1 = int(a[0, y, x]), int(a[1, y, x])
            k0 = (t0 - 2048) // 48 if t0 >= 2048 else None
            if (k0 is None and t0) or k0 not in (None, 16, 27): obs[y, x] = True
            if t1:
                k1 = (t1 - 2048) // 48 if t1 >= 2048 else None
                if k1 not in (21, 28, 29, 31, 46): obs[y, x] = True
                if k1 in (47, 22): hill[y, x] = True
            if a[2, y, x] or a[3, y, x] or a[5, y, x]: obs[y, x] = True
            if k0 == 6: woda[y, x] = True
            if 1536 <= t0 < 2048 and (t0 - 1536) in HILL_REL: hill[y, x] = True
    for (c, i) in C.zajete.items():
        if c[0] < W1: obs[c[1], c[0]] = True
    for y in range(H):
        for x in range(W1):
            if obs[y, x]: zaj[max(0, y - 1):y + 2, max(0, x - 1):x + 2] = True
            if hill[y, x]: zaj_s[max(0, y - 2):y + 3, max(0, x - 2):x + 3] = True
            if woda[y, x]: zaj_s[max(0, y - 3):y + 4, max(0, x - 3):x + 4] = True; zaj[max(0, y - 3):y + 4, max(0, x - 3):x + 4] = True
    return raw


def buduj():
    C.a[0, :, :] = kinds(16)
    wczytaj_gracza()                       # A: mapa gracza bez zmian
    # ================================================================= B (zestaw 9): od x = 64
    wstaw_cale("gracz_wzgorze_990", 78, 6, konstr=True)           # WZORZEC NR 1: wzgórze gracza (obrys A5, lico, schody) - kafle te same w zestawie 9, blokada regionem 2
    wstaw_cale_auto("c_wzgorze_003", 78, 30, 112, 50, 3, konstr=True)   # całe wzgórze z Map003
    for (x, y) in ((100, 28), (84, 26)):
        for dy in range(0, 14, 2):
            for dx in range(0, 6, 2):
                if zagroda(x + dx, y + dy, 12, 7, 4): break
            else: continue
            break
    for i, nm in enumerate(["c_plama_013_0", "c_plama_013_3", "c_plama_013_2", "c_plama_013_1"]):
        wstaw_cale_auto(nm, 76, 12, 124, 58, 20 + i, margines=1)
    koryto_gdzie([[(122, 8), (124, 13), (122, 18)], [(112, 40), (114, 46), (112, 52)], [(122, 36), (124, 42), (122, 48)], [(90, 50), (92, 55), (90, 58)]], 32)
    # ścieżka B: ciąg ścieżki gracza z A (A: x=63, wiersze 39-41), szeroka wstęga z falowaniem, brzegi zmiękczy Ziemia.js
    glowna = sciezka_komorki([(64, 40), (72, 40), (82, 43), (92, 48), (100, 52), (108, 55)], 3.0, 41, zwez=8, kon=(False, False))
    glowna = {c for c in glowna if not zaj_s[c[1], c[0]] and c[0] >= 64}
    for (x, y) in glowna: zaj_s[y, x] = False
    rysuj(glowna, 24); zajmij(glowna, 1, False)
    # ================================================================= dodatki w A: tylko w wolnych miejscach, z dala od wzgórza
    for i, nm in enumerate(["c_plama_013_0", "c_plama_013_1", "c_plama_013_2"]):
        wstaw_cale_auto(nm, 2, 24, 52, 58, 10 + i, margines=2)
    # ================================================================= zdarzenia (A i B), drzewa daleko od wody
    zdarzenia_z("skraj_lasu", 86, 40, seed=7) if False else None
    zdarzenia_z("las_geste_jar", 76, 30, seed=8) if False else None
    zdarzenia_auto("las_geste_jar", 76, 26, 126, 56, 2, 8)
    zdarzenia_auto("skaly_rumowisko", 100, 4, 126, 30, 1, 9)
    zdarzenia_auto("sad_jabloni", 76, 30, 126, 56, 1, 10)
    zdarzenia_auto("kepa_sosen", 74, 2, 126, 56, 14, 54)
    zdarzenia_auto("skraj_lasu", 74, 2, 126, 50, 4, 55)
    zdarzenia_auto("kepa_sosen", 2, 2, 52, 58, 10, 52)
    zdarzenia_auto("skraj_lasu", 2, 24, 52, 50, 1, 53)
    ROCK = ["!$Rock_Flat", "!$Rock_Mound", "!$Rock_Chunk", "!$Rock_Cracked", "!$Rock_Mossy", "!$Rock_Pile", "!$Rock_Cairn", "!$Boulder_A"]
    BUSH = ["!$Bush_Bare_A", "!$Bush_Bare_B", "!$Bush_Bare_Tall", "!$Bush_Bare_Wide", "!$Bush_Bare_Thicket"]
    PINE = ["!$Pine_A", "!$Pine_B", "!$Pine_C", "!$Tree_Small"]
    rozrzut(ROCK, 8, 2, 24, 54, 58, 31, od_wody=6)
    rozrzut(BUSH, 8, 2, 24, 54, 58, 32, od_wody=6)
    rozrzut(ROCK, 12, 74, 2, 126, 58, 33, od_wody=6)
    rozrzut(BUSH, 18, 74, 2, 126, 58, 34, od_wody=6)
    rozrzut(PINE, 14, 2, 24, 54, 58, 35, od_wody=13)
    rozrzut(PINE, 26, 74, 2, 126, 58, 36, od_wody=13)
    # ciemniejsza trawa (A2-27) i kępki tylko w B
    for (cx, cy, rx, ry, sd) in [(112, 44, 9, 5, 7), (66, 52, 7, 4, 14), (118, 8, 7, 4, 13)]:
        bl = organiczna(cx, cy, rx, ry, sd, wob=0.3)
        if wolne(bl, 3): rysuj(bl, 27); zajmij(bl, 0, False)
    kepki_i_kwiaty()
    return C


def post_proste(C, ks=(24, 27), rundy=6):
    """po złożeniu wszystkiego: w każdej plamie gruntu (A2 24 / 27, warstwa 0) łamie proste odcinki obrysu dłuższe niż RUN (dokłada kratki na zewnątrz)"""
    for k in ks:
        for _ in range(rundy):
            m = np.zeros((H, 2 * W1), bool)
            for y in range(H):
                for x in range(2 * W1):
                    t = int(C.a[0, y, x])
                    if t >= 2048 and (t - 2048) // 48 == k: m[y, x] = True
            doda = set()
            for comp in P_skl(m):
                if len(comp) < 8: continue
                nowe = lam_proste(comp, RUN, 1) - set(comp)
                for c in nowe:
                    if 1 <= c[0] < 2 * W1 - 1 and 1 <= c[1] < H - 1 and not zaj_obiekt(c): doda.add(c)
            if not doda: break
            for (x, y) in doda: C.a[0, y, x] = kinds(k)
        C.przelicz({(x, y) for y in range(H) for x in range(2 * W1)}, 0, (0,))


def P_skl(m):
    return [list(c) for c in P._skladowe({(x, y) for y in range(m.shape[0]) for x in range(m.shape[1]) if m[y, x]})]


def zaj_obiekt(c):
    x, y = c
    return bool(C.a[1, y, x] and (C.a[1, y, x] - 2048) // 48 in (47, 22)) or bool(C.a[5, y, x]) or C.a[0, y, x] < 2048 or any(
        True for _ in ())


def lagodne_brzegi(C):
    """stopniowe przejście grunt-ziemia: w pasie 2 kratek wokół ziemi (A2-24) rzadkie okruchy żwiru (A2-39 na warstwie 1), mniej kępek trawy; bez ramy"""
    rnd = random.Random(77)
    a0 = C.a[0]
    dirt = np.zeros((H, 2 * W1), bool)
    for y in range(H):
        for x in range(2 * W1):
            t = int(a0[y, x])
            if t >= 2048 and (t - 2048) // 48 == 24: dirt[y, x] = True
    for y in range(2, H - 2):
        for x in range(W1 + 2, 2 * W1 - 2):
            if dirt[y, x] or STREFA[0] <= x < STREFA[1]: continue
            t = int(a0[y, x])
            if not (t >= 2048 and (t - 2048) // 48 in (16, 27)): continue
            d = 9
            for dy in range(-2, 3):
                for dx in range(-2, 3):
                    if dirt[y + dy, x + dx]: d = min(d, max(abs(dx), abs(dy)))
            if d > 2: continue
            if C.a[1, y, x] == kinds(21) and rnd.random() < 0.6: C.a[1, y, x] = 0
            if C.a[1, y, x] == 0 and rnd.random() < (0.28 if d == 1 else 0.14) and not C.a[5, y, x]: C.a[1, y, x] = kinds(39)


def czysc(C):
    """pojedyncze kratki gruntu (A2 16/17/24/27) i paski 1 kratki -> grunt otaczający"""
    a = C.a[0]
    for _ in range(3):
        zm = []
        for y in range(1, H - 1):
            for x in range(W1 + 2, 2 * W1 - 1):
                t = int(a[y, x])
                if t < 2048: continue
                k = (t - 2048) // 48
                if k not in (16, 17, 24, 27): continue
                kk = [(int(v) - 2048) // 48 if v >= 2048 else -1 for v in (a[y - 1, x], a[y + 1, x], a[y, x - 1], a[y, x + 1])]
                same = sum(1 for v in kk if v == k)
                if same <= 1 or (kk[0] != k and kk[1] != k) or (kk[2] != k and kk[3] != k):
                    maj = max(set(kk), key=kk.count)
                    if maj in (16, 17, 24, 27) and maj != k: zm.append((x, y, maj))
        for (x, y, m) in zm: a[y, x] = kinds(m)
        if not zm: break
    C.przelicz({(x, y) for y in range(H) for x in range(W1 + 2, 2 * W1)}, 0, (0,))


def podziel(C):
    A = P.Plotno(W1, H, 11, 16); Bp = P.Plotno(W1, H, 9, 16)
    A.a[:, :, :] = C.a[:, :, :W1]; Bp.a[:, :, :] = C.a[:, :, W1:]
    for e in C.ev:
        if e["x"] < W1: A.ev.append({"x": e["x"], "y": e["y"], "ev": e["ev"]})
        else: Bp.ev.append({"x": e["x"] - W1, "y": e["y"], "ev": e["ev"]})
    return A, Bp


def props(nazwa, note, bgs=""):
    d = copy.deepcopy(PROPS); d["displayName"] = nazwa; d["note"] = note
    if bgs: d["bgs"] = {"name": bgs, "pan": 0, "pitch": 90, "volume": 50}; d["autoplayBgs"] = True; d["autoplayBgm"] = False
    return d


def main():
    C_ = buduj()
    czysc(C_)
    lagodne_brzegi(C_)
    for l in log: print(l)
    A, B = podziel(C_)
    ra = A.do_raw(props("Mapa próbna A", "<Clouds:on>\n<Farm:off>\n<Water:salt>", "Sea"))
    rb = B.do_raw(props("Mapa próbna B", "<Clouds:on>\n<Farm:off>"))
    ra["tilesetId"] = 11; rb["tilesetId"] = 9
    P.zapisz_mape(ra, os.path.join(STG, "data", "Map%03d.json" % ID_A))
    P.zapisz_mape(rb, os.path.join(STG, "data", "Map%03d.json" % ID_B))
    print("zapisano mapy; zdarzeń A %d, B %d" % (len(A.ev), len(B.ev)))


if __name__ == "__main__":
    main()
