# -*- coding: utf-8 -*-
"""Usterki ekran po ekranie: Map111 Podgrodzie + Map162 Garnizon nad zatoka. Przebudowuje z biezacego data/ do
tools/usterki/podgrodzie_garnizon/staging/data/Map111.json i Map162.json (nic w data/). Python binarnie, LF.
  python popraw.py            (obie mapy)   |   python popraw.py 111   |   python popraw.py 162"""
import os, sys, json, math, random, copy, re
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "poprawki_krok5"))
import krajobraz as KR
from krajobraz import Krajobraz, W, L, stopa
import numpy as np
STG = os.path.join(HERE, "staging", "data")
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass

FENCE22, PAL38 = 22, 38
POST_L, POST_R = 209, 208          # slupki bramy: poziomy plot, kafel nad kratka A2-22 (warstwa 3): 209 po lewej przerwy, 208 po prawej


def save(K):
    """autokafle zmienionych kratek, test okrazenia pliku, zapis do staging"""
    W.reshape(K.m, 0, W.ring(K.c0, 1))
    W.reshape(K.m, 1, W.ring(K.c1 | K.c0, 1))
    for i, e in enumerate(K.ev): assert e is None or e["id"] == i, (i, e and e["id"])
    out = W.map_text(K.m).encode("utf-8")
    assert json.loads(out.decode("utf-8")) == K.m
    os.makedirs(STG, exist_ok=True)
    with open(os.path.join(STG, "Map%03d.json" % K.mid), "wb") as f: f.write(out)
    assert b"\r" not in out


def fence_at(K, x, y, kinds=(FENCE22, PAL38)):
    return K.in_(x, y) and (K.kind(1, x, y) in kinds or K.kind(0, x, y) in kinds)


def gates(K, kinds=(FENCE22,)):
    """[(a, b, axis)]: konce biegow plotu po obu stronach przerwy 1-5 kratek (bieg >= 2 kratki po kazdej stronie)"""
    res = []
    f = lambda x, y: fence_at(K, x, y, kinds)
    for y in range(K.H):
        for x in range(K.W):
            for dx, dy in ((1, 0), (0, 1)):
                if not f(x, y) or f(x + dx, y + dy) or not f(x - dx, y - dy): continue
                for gap in range(1, 6):
                    x2, y2 = x + dx * (gap + 1), y + dy * (gap + 1)
                    if f(x2, y2):
                        if f(x2 + dx, y2 + dy): res.append(((x, y), (x2, y2), (dx, dy)))
                        break
    return res


def smooth(K, kinds, maxsize=None, area=None, sigma=1.0, lam_max=4, water_gap=2):
    """zaokragla plamy gruntu danych rodzajow (okraglij + lam): kratki zdjete dostaja rodzaj sasiedztwa, kratki pod/obok plotu i przy wodzie nietkniete"""
    def fenced(x, y): return any(K.in_(x + a, y + b) and K.kind(1, x + a, y + b) in (FENCE22, PAL38) for a in (-1, 0, 1) for b in (-1, 0, 1))
    def prot(x, y):
        if fenced(x, y): return True
        for a in range(-water_gap, water_gap + 1):
            for b in range(-water_gap, water_gap + 1):
                if not K.in_(x + a, y + b): continue
                t = K.g(0, x + a, y + b)
                if t < 2048 or (t - 2048) // 48 < 16 or (t - 2048) // 48 > 30: return True
        return False
    n = 0
    for k in kinds:
        cells = {(x, y) for y in range(K.H) for x in range(K.W) if K.kind(0, x, y) == k and (area is None or (area[0] <= x <= area[2] and area[1] <= y <= area[3]))}
        seen = set()
        for c in sorted(cells):
            if c in seen: continue
            comp, st = {c}, [c]
            while st:
                p = st.pop()
                for da in (-1, 0, 1):
                    for db in (-1, 0, 1):
                        q = (p[0] + da, p[1] + db)
                        if q in cells and q not in comp: comp.add(q); st.append(q)
            seen |= comp
            if maxsize and len(comp) > maxsize: continue
            new = K.lam(K.okraglij(comp, sigma), maks=lam_max)
            for q in comp - new:
                if prot(*q): continue
                cnt = {}
                for da in (-2, -1, 0, 1, 2):
                    for db in (-2, -1, 0, 1, 2):
                        kk = K.kind(0, q[0] + da, q[1] + db) if K.in_(q[0] + da, q[1] + db) else None
                        if kk is not None and kk != k and 16 <= kk <= 30 and (q[0] + da, q[1] + db) not in comp: cnt[kk] = cnt.get(kk, 0) + 1
                if cnt: K.ground(q[0], q[1], max(cnt, key=cnt.get)); n += 1
            for q in new - comp:
                if prot(*q) or K.kind(0, *q) not in (16, 17, 27, 24) or K.kind(0, *q) == 17 and k != 17: continue
                K.ground(q[0], q[1], k); n += 1
    K.log.append("smooth %s: %d kratek" % (kinds, n))


def rough(K, kind, seed, area=None, rm=0.50, add=0.66, scale=3.2):
    """nieregularny brzeg plamy gruntu: pas przy obrysie wyjadany/dokladany szumem (rozbija proste odcinki); pod/obok plotu i przy wodzie bez zmian"""
    def prot(x, y):
        for a in range(-2, 3):
            for b in range(-2, 3):
                if not K.in_(x + a, y + b): continue
                if abs(a) <= 1 and abs(b) <= 1 and K.kind(1, x + a, y + b) in (FENCE22, PAL38): return True
                t = K.g(0, x + a, y + b)
                if t < 2048 or (t - 2048) // 48 < 16 or (t - 2048) // 48 > 30: return True
        return False
    inn = lambda x, y: area is None or (area[0] <= x <= area[2] and area[1] <= y <= area[3])
    rem, addl = [], []
    for y in range(K.H):
        for x in range(K.W):
            if not inn(x, y) or prot(x, y): continue
            k = K.kind(0, x, y)
            nb = [(x + dx, y + dy) for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))]
            nk = [K.kind(0, *q) for q in nb if K.in_(*q)]
            v = K.fbm(x, y, seed, scale)
            if k == kind and any(n in (16, 27) and n != kind for n in nk) and v > rm:
                rem.append((x, y, max((n for n in nk if n in (16, 27) and n != kind), key=nk.count)))
            elif k in (16, 27) and k != kind and kind in nk and v < 1 - add and K.kind(1, x, y) not in (FENCE22, PAL38):
                addl.append((x, y))
    for (x, y, n) in rem: K.ground(x, y, n)
    for (x, y) in addl: K.ground(x, y, kind)
    K.log.append("rough %d: -%d +%d" % (kind, len(rem), len(addl)))


# ------------------------------------------------------------------ nakladanie obrazu zdarzenia na plot/mur/dach (jak detektory.py NA1/NA2)
class Ctx:
    """Mapa w pamieci do liczenia, czy obraz zdarzenia zachodzi na plot/mur/dach (logika detektory.zdarzenia_na_scianach)"""
    def __init__(self, K):
        sys.path.insert(0, os.path.join(ROOT, "tools", "przeglad_ekranow"))
        import detektory as D
        self.D = D; self.K = K
        self.mp = L.Mapa(K.mid, raw=copy.deepcopy(K.m))
        self.kg = D.kind_grid(self.mp); self.fm = D.fence_mask(self.mp)
    def overlap(self, e, x=None, y=None):
        """liczba kratek plotu/muru/dachu, na ktore obraz (przeniesiony na x,y) zachodzi (>= 220 px)"""
        D, mp = self.D, self.mp
        ee = copy.deepcopy(e)
        if x is not None: ee["x"], ee["y"] = x, y
        z = L.Zdarzenie(ee, mp)
        mk = z.maska(mp.zest, 120)
        if not mk: return 0
        a, x0, y0 = mk
        ys, xs = np.where(a)
        if not len(xs): return 0
        T = L.T
        n = 0; own = set(z.komorki())
        for cy in range((y0 + ys.min()) // T, (y0 + ys.max()) // T + 1):
            for cx in range((x0 + xs.min()) // T, (x0 + xs.max()) // T + 1):
                if not mp.inside(cx, cy) or ((cx, cy) in own and z.occupy): continue
                if not (self.kg[cy][cx] in ("R", "W", "S", "T") or self.fm[cy, cx]): continue
                sub = a[max(0, cy * T - y0):max(0, (cy + 1) * T - y0), max(0, cx * T - x0):max(0, (cx + 1) * T - x0)]
                if sub.size and int(sub.sum()) >= 220: n += 1
        return n


class _NoCtx:
    def overlap(self, *a): return 0
Ctx_dummy = _NoCtx()
TREE_RX = re.compile(r'^!?\$?(Big_Trees|Pine|Tree)', re.I)
def nudge(K, ctx, eid, order=None, rmax=6, occ=None, grounds=(16, 17, 27, 24), odstep=1, avoid=(), tree_gap=3, at=None):
    """przenosi zdarzenie na najblizsza (wg `order`: funkcja kosztu (dx,dy)) kratke, na ktorej jego obraz nie zachodzi na plot/mur/dach"""
    e = K.ev[eid]
    occ = occ if occ is not None else K.zajete()
    for c in stopa(e): occ.pop(c, None)
    order = order or (lambda dx, dy: abs(dx) + abs(dy) * 1.0)
    cand = sorted(((dx, dy) for dx in range(-rmax, rmax + 1) for dy in range(-rmax, rmax + 1)), key=lambda c: (order(*c), abs(c[0]), c[1]))
    for dx, dy in cand:
        x, y = (at or (e["x"], e["y"]))[0] + dx, (at or (e["x"], e["y"]))[1] + dy
        if (x, y) in avoid: continue
        ee = dict(e); ee["x"], ee["y"] = x, y
        cells = stopa(ee)
        if any(not K.in_(*c) or c in occ or K.kind(0, *c) not in grounds or fence_at(K, *c) for c in cells): continue
        if any((x + a, y + b) in occ for a in range(-odstep, odstep + 1) for b in range(-odstep, odstep + 1)): continue
        if ctx.overlap(e, x, y): continue
        if tree_gap and any(o and o["id"] != eid and TREE_RX.match(o["pages"][0]["image"]["characterName"] or "") and abs(o["x"] - x) < tree_gap and -3 <= o["y"] - y <= 2 for o in K.ev): continue
        K.przenies(eid, x, y)
        for c in stopa(K.ev[eid]): occ[c] = eid
        return True
    K.log.append("NIE ZNALAZLEM miejsca dla %d %s" % (eid, e["name"]))
    for c in stopa(e): occ[c] = eid
    return False


def fix_111():
    K = Krajobraz(111)
    log = K.log
    occ = K.zajete()
    rng = random.Random(111)

    # ---- A. rzad drzew nad wioska stal na dlugim plocie (y 28-30): plot bez celu (nic nie ogradza) zdjety, drzewa rozsiane nieregularnie
    for y in (28, 29, 30):
        for x in range(26, 104):
            if K.kind(1, x, y) == PAL38: K.over(x, y, 0)
    row = sorted([e for e in K.eventy() if e["y"] == 34 and 23 <= e["x"] <= 103 and e["name"] == "Drzewo"], key=lambda e: e["x"])
    last = 0
    for e in row:
        for _ in range(60):
            nx = e["x"] + rng.choice((-1, 0, 0, 1)); ny = 34 + rng.choice((-1, 0, 0))
            if nx - last >= 3 and (nx, ny) not in occ: break
        else: nx, ny = e["x"], 34
        for c in stopa(e): occ.pop(c, None)
        K.przenies(e["id"], nx, ny); last = nx
        for c in stopa(e): occ[c] = e["id"]


    # ---- D. zagroda przy drodze (28-41, 5-15): jeden grunt (trawa) i cos w srodku - stóg siana (3x2 kafle jak przy drodze polnocnej)
    for y in range(4, 17):
        for x in range(26, 44):
            if K.kind(0, x, y) == 27: K.ground(x, y, 16)
    for dy, row in enumerate(((469, 470, 471), (477, 751, 479))):
        for dx, t in enumerate(row): K.s(3, 36 + dx, 9 + dy, t)
    K.s(2, 37, 10, 478)

    # ---- E. grunt pod plotem/palisada = trawa; ciemna trawa (27) przy plocie zdjeta CALA plama (bez zostawiania pojedynczych kratek)
    fcells = [(x, y) for y in range(K.H) for x in range(K.W) if K.kind(1, x, y) in (FENCE22, PAL38)]
    seen = set()
    for (x, y) in fcells:
        if K.kind(0, x, y) in (17, 27) and not any(K.kind(0, x + a, y + b) == 17 and K.kind(1, x + a, y + b) not in (FENCE22, PAL38) for a in (-1, 0, 1) for b in (-1, 0, 1) if (a or b)):
            K.ground(x, y, 16)
        for a in (-1, 0, 1):
            for b in (-1, 0, 1):
                c = (x + a, y + b)
                if c in seen or not K.in_(*c) or K.kind(0, *c) != 27: continue
                comp, st = {c}, [c]
                while st:
                    p = st.pop()
                    for da in (-1, 0, 1):
                        for db in (-1, 0, 1):
                            q = (p[0] + da, p[1] + db)
                            if q not in comp and K.in_(*q) and K.kind(0, *q) == 27: comp.add(q); st.append(q)
                seen |= comp
                if len(comp) <= 90:
                    for q in comp: K.ground(q[0], q[1], 16)
                else:
                    for q in comp:
                        if any(K.in_(q[0] + da, q[1] + db) and K.kind(1, q[0] + da, q[1] + db) in (FENCE22, PAL38) for da in (-1, 0, 1) for db in (-1, 0, 1)): K.ground(q[0], q[1], 16)
    # duza zagroda (35-54 x 111-117): zbita ziemia o nieregularnym obrysie, nie prostokat pod plotem
    S = {(x, y) for y in range(111, 118) for x in range(35, 55) if K.kind(0, x, y) == 17}
    R = K.blob(44.5, 114, 9.5, 3.0, 21, rough=0.22) | {c for c in S if c[0] <= 36 and c[1] >= 116}
    for c in S - R: K.ground(c[0], c[1], 16)

    # ---- F. resztki plotu: slupek (48,59), 2-kratkowy skrawek (80-81,68); brakujaca kratka (40,58); duza zagroda: zachodni bok domkniety
    for (x, y) in ((48, 59), (80, 68), (81, 68)): K.over(x, y, 0)
    K.over(40, 58, FENCE22)
    for y in (116, 117): K.over(34, y, FENCE22); K.ground(34, y, 16)

    # ---- H. plac z brukiem (52-73 x 54-74): obrys zaokraglony, martwe drzewo (kafle 54-56 x 68-73) stoi na trawie, odlamek bruku przy chacie zdjety
    old = {(x, y) for y in range(54, 76) for x in range(50, 76) if K.kind(0, x, y) == 18}
    prot = lambda c: any(K.in_(c[0] + a, c[1] + b) and (K.kind(0, c[0] + a, c[1] + b) is not None and K.kind(0, c[0] + a, c[1] + b) >= 48) for a in (-1, 0, 1) for b in (-1, 0, 1))
    new = K.blob(59.5, 60.2, 3.9, 3.6, 5, rough=0.3) | K.blob(63.5, 68.5, 6.2, 5.4, 6, rough=0.3) | K.blob(68.3, 67.5, 5.3, 4.6, 7, rough=0.3) | K.blob(61, 66, 4, 4, 8, rough=0.2)
    new = {c for c in new if not prot(c) and K.kind(0, *c) in (16, 17, 18) and K.kind(1, *c) not in (FENCE22, PAL38) and c[0] >= 57 and c[1] <= 72}
    new = K.lam(new, maks=5)
    for c in old - new:
        if not prot(c): K.ground(c[0], c[1], 16)
    for c in new - old: K.ground(c[0], c[1], 18)

    # ---- B. drzewa/krzaki na plocie wioski i zagrod: przesuniete do najblizszej wolnej kratki (zdarzenia zostaja, notatki tez)
    ctx = Ctx(K)
    nudge(K, ctx, 472, order=lambda dx, dy: abs(dx) * 1.2 + abs(dy), avoid={(x, y) for x in range(72, 82) for y in range(39, 48)})
    for eid in (473, 474, 475, 460, 461, 462, 482):
        nudge(K, ctx, eid, order=lambda dx, dy: abs(dx) * 1.2 + abs(dy))
    K.usun(471)           # (ozdobny krzak przy palisadzie: nigdzie w zagrodzie nie ma dla niego wolnego miejsca bez zaslaniania cudzych rekwizytow)
    # ---- I. grunt: plamy ciemnej trawy (27) i male plamy ziemi (17) zaokraglone; plac bruku (18) i duza zagroda - obrys bez schodkow
    smooth(K, (27,), sigma=1.0)
    smooth(K, (17,), maxsize=120, sigma=1.0)
    smooth(K, (18,), sigma=1.3, lam_max=3)
    # ---- J. grzadki: dwa prawe rzedy (y17, y20) mialy sam grzbiet bez roslin - dopisane grzadki (kafle 285-287 jak po lewej)
    for (y, x0, x1) in ((17, 82, 94), (20, 83, 94)):
        for x in range(x0, x1 + 1): K.s(2, x, y, rng.choice((285, 286, 287)))
    # ---- K. beczki na deszczowke (275, 294, 255) stoja na scianie/plocie - przesuniete o kratke
    ctx2 = Ctx(K)
    for eid in (275, 294, 255):
        nudge(K, ctx2, eid, order=lambda dx, dy: abs(dx) * 1.3 + abs(dy), rmax=3, grounds=(16, 17, 27, 18))
    # ---- L. brama przy drodze polnocnej (110,20): palisada tylko ze wschodu - dolozony krotki zachodni odcinek konczacy sie przy krawedzi drogi
    ne = copy.deepcopy(K.ev[455]); ne["id"] = len(K.ev); ne["x"], ne["y"] = 105, 20
    K.ev.append(ne)
    # ---- C. slupki bramy przy kazdej przerwie plotu (poziomo 209/208, pionowo 216/217; warstwa 3 nad kratka plotu)
    for (a, b, ax) in gates(K):
        if ax == (1, 0): K.s(3, a[0], a[1], POST_L); K.s(3, b[0], b[1], POST_R)
        # (pionowe przerwy: 216/217 rysuja cienkie slupki obok kratki - brzydkie; koniec pionowego plotu A2 ma wlasny gruby slupek-czub, zostaje)
    save(K)
    return K


def fix_162():
    K = Krajobraz(162)
    occ = K.zajete()
    # ---- A. rzad sosen i lisciastych przy poludniowej palisadzie koszar (y 57): korony zaslanialy ostrza - drzewa 3 kratki dalej na poludnie
    for e in [e for e in K.eventy() if e["name"] == "Drzewo" and 47 <= e["x"] <= 77 and 58 <= e["y"] <= 62]:
        nudge(K, Ctx_dummy, e["id"], at=(e["x"], e["y"] + 4), grounds=(16, 27), order=lambda dx, dy: abs(dx) * 1.3 + (abs(dy) if dy >= 0 else 9 + abs(dy)), occ=occ, rmax=4)
    # ---- B. koniowiazy wybieg (95-111 x 82-92): drzewo na plocie przesuniete, jeden grunt pod plotem i wewnatrz (trawa)
    ctx = Ctx(K)
    nudge(K, ctx, 169, order=lambda dx, dy: abs(dx) + abs(dy), grounds=(16, 27))
    for y in range(80, 95):
        for x in range(93, 114):
            if K.kind(0, x, y) in (24, 27, 17) and (K.kind(1, x, y) in (FENCE22, PAL38) or any(K.kind(1, x + a, y + b) in (FENCE22, PAL38) for a in (-1, 0, 1) for b in (-1, 0, 1))) and not (K.kind(0, x, y) == 17):
                K.ground(x, y, 16)
    S = {(x, y) for y in range(83, 93) for x in range(96, 111) if K.kind(0, x, y) in (17, 24)}
    cx, cy = sum(c[0] for c in S) / len(S), sum(c[1] for c in S) / len(S)
    N = K.blob(cx, cy, 3.4, 2.1, 12, rough=0.25)
    for c in S - N: K.ground(c[0], c[1], 16)
    for c in N: K.ground(c[0], c[1], 17)
    # ---- C. grunt: plamy gruntu 24 / 27 / male 17 zaokraglone (proste odcinki obrysu, prostokaty, pasek 1 kratki)
    smooth(K, (27,), sigma=1.2, lam_max=5)
    smooth(K, (17,), maxsize=150, sigma=1.0)
    rough(K, 24, 162, area=(74, 20, 122, 32), rm=0.42); rough(K, 24, 164, area=(40, 28, 66, 40)); rough(K, 27, 163)
    def tiny(kind, to, maxn, area=None):
        cells = {(x, y) for y in range(K.H) for x in range(K.W) if K.kind(0, x, y) == kind and (area is None or (area[0] <= x <= area[2] and area[1] <= y <= area[3]))}
        seen = set()
        for c in sorted(cells):
            if c in seen: continue
            comp, st = {c}, [c]
            while st:
                p = st.pop()
                for da in (-1, 0, 1):
                    for db in (-1, 0, 1):
                        q = (p[0] + da, p[1] + db)
                        if q in cells and q not in comp: comp.add(q); st.append(q)
            seen |= comp
            if len(comp) <= maxn:
                for q in comp: K.ground(q[0], q[1], to)
    tiny(27, 16, 3); tiny(16, 24, 4, area=(74, 20, 122, 60))   # (24 = tez sciezki: tylko szeroki pas dzikiego brzegu NE)
    for (a, b, ax) in gates(K):
        if ax == (1, 0): K.s(3, a[0], a[1], POST_L); K.s(3, b[0], b[1], POST_R)
    save(K)
    return K


if __name__ == "__main__":
    ids = [int(a) for a in sys.argv[1:]] or [111, 162]
    for mid_, fn in ((111, fix_111), (162, fix_162)):
        if mid_ in ids:
            K = fn()
            print(chr(10).join(K.log))
