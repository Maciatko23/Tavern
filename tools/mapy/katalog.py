# -*- coding: utf-8 -*-
"""KATALOG KAFLI (tools/mapy/katalog.py)

Zbiera wiedzę o kaflach zestawów 8, 9, 10, 11, 12 i zapisuje ją w tools/mapy/katalog.json oraz w podglądach
docs/mapy/katalog_NN.png (arkusze B-E z zaznaczeniami).

Dla każdego kafla:
  - przejście z flag: 'X' blokuje, 'O' przechodni, '*' gwiazdka (nad postacią, nie wpływa na przejście),
    'blok:2,8' zablokowane kierunki; krzak, lada (counter), drabina, teren, uszkadza;
  - obiekt: sąsiednie kafle arkusza, których krawędzie się stykają (piksele po obu stronach granicy), tworzą jeden
    obiekt (mebel, drzewo, dom); kafel zna swoje miejsce w obiekcie (dx, dy) i rolę (gora / srodek / dol / jeden);
  - użycie: ile razy stoi na mapach (wszystkich i wzorcowych);
  - blat: kafel, na którym w mapach wzorcowych leżą przedmioty (kafel warstwy 3 albo zdarzenie), z położeniem
    podstawy przedmiotu w pikselach kratki; lada (flaga counter) też jest blatem;
  - wyuczone wyjątki z map wzorcowych: gwiazdka nad wolną kratką (łuki, belki), kafle, po których chodzi bohater
    (dywany), krawędzie obiektu, które w dobrych mapach bywają otwarte.
Do tego profile grafik zdarzeń (gdzie stoją w mapach wzorcowych: blat / podłoga / ściana) i statystyki odstępów.

Użycie:  python tools/mapy/katalog.py            (wszystko)
         python tools/mapy/katalog.py --bez-obrazkow
Mapy wzorcowe: mapylib.WZORCE (1 tawerna, 19 dom dziadka, 25 i 26 pokoje, 101 paleta miasteczka, 8 miasteczko).
Nic nie zapisuje do data/ ani js/.
"""
import os, sys, json, collections, statistics
import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import mapylib as L
from mapylib import T

OUT_JSON = os.path.join(L.HERE, "katalog.json")
LINK_MIN = 4              # ile kolumn / wierszy pikseli musi się stykać, żeby dwa kafle arkusza były jednym obiektem
ITEM_MAX = 44             # przedmiot: nieprzezroczysty prostokąt najwyżej 44 x 44 px


# ================================================================================================ obiekty z arkuszy

class UF:
    def __init__(self): self.p = {}
    def find(self, a):
        self.p.setdefault(a, a)
        while self.p[a] != a:
            self.p[a] = self.p[self.p[a]]; a = self.p[a]
        return a
    def union(self, a, b):
        ra, rb = self.find(a), self.find(b)
        if ra != rb: self.p[max(ra, rb)] = min(ra, rb)


def sasiad(tid, side):
    """sąsiad kafla B-E na arkuszu po stronie side ('N','S','W','E') albo None"""
    sh = L.arkusz(tid)
    c, r = L.kol_wiersz(tid)
    dc, dr = {"N": (0, -1), "S": (0, 1), "W": (-1, 0), "E": (1, 0)}[side]
    c2, r2 = c + dc, r + dr
    if not (0 <= c2 < 16 and 0 <= r2 < 16): return None
    return L.z_kol_wiersza(sh, c2, r2)


def styk(zest, a, b, side):
    """ile pikseli styka się na granicy kafla a (po stronie side) z kaflem b"""
    A, B = zest.alfa(a), zest.alfa(b)
    if side == "S": ea, eb = A[46:48, :].any(0), B[0:2, :].any(0)
    elif side == "N": ea, eb = A[0:2, :].any(0), B[46:48, :].any(0)
    elif side == "E": ea, eb = A[:, 46:48].any(1), B[:, 0:2].any(1)
    else: ea, eb = A[:, 0:2].any(1), B[:, 46:48].any(1)
    return int((ea & eb).sum())


def krawedz(zest, a, side):
    """ile pikseli kafla a dotyka jego krawędzi side"""
    A = zest.alfa(a)
    e = {"S": A[46:48, :].any(0), "N": A[0:2, :].any(0), "E": A[:, 46:48].any(1), "W": A[:, 0:2].any(1)}[side]
    return int(e.sum())


def obiekty_zestawu(zest):
    """kafle B-E z pikselami -> obiekty (składowe spójne po stykających się krawędziach)"""
    tiles = []
    for sn in range(4):
        if zest.sheet(5 + sn) is None: continue
        for tid in range(sn * 256, sn * 256 + 256):
            if not zest.pusty(tid): tiles.append(tid)
    tset = set(tiles)
    uf = UF()
    links = {}
    for tid in tiles:
        uf.find(tid)
        for side in ("S", "E"):
            n = sasiad(tid, side)
            if n is None or n not in tset: continue
            s = styk(zest, tid, n, side)
            if s >= LINK_MIN:
                uf.union(tid, n)
                links[(tid, side)] = n
                links[(n, {"S": "N", "E": "W"}[side])] = tid
    groups = collections.defaultdict(list)
    for tid in tiles: groups[uf.find(tid)].append(tid)
    objs = []
    tile_obj = {}
    for root in sorted(groups):
        g = groups[root]
        cr = [L.kol_wiersz(t) for t in g]
        c0, r0 = min(c for c, r in cr), min(r for c, r in cr)
        c1, r1 = max(c for c, r in cr), max(r for c, r in cr)
        grid = [[None] * (c1 - c0 + 1) for _ in range(r1 - r0 + 1)]
        for t, (c, r) in zip(g, cr): grid[r - r0][c - c0] = t
        oid = len(objs)
        h = r1 - r0 + 1
        for t, (c, r) in zip(g, cr):
            dy = r - r0
            rola = "jeden" if h == 1 else ("gora" if dy == 0 else "dol" if dy == h - 1 else "srodek")
            tile_obj[t] = (oid, c - c0, dy, rola)
        objs.append({"id": oid, "arkusz": L.arkusz(g[0]), "kol": c0, "wiersz": r0, "w": c1 - c0 + 1, "h": h, "kafle": grid})
    return objs, tile_obj, links


def maska_pelna(zest, tid):
    """piksele pełne (alfa > 200): bez półprzezroczystych cieni"""
    return np.array(zest.tile(tid))[:, :, 3] > 200 if tid else np.zeros((T, T), bool)


def powierzchnia(zest, o, ts=None):
    """czy obiekt może być blatem: ma poziomy pas pełnych pikseli (>= 60% szerokości obiektu) wysoki na >= 12 px,
    a jego kafle nie są przechodnie ('O'). Zwraca [y0, y1] pasa w pikselach obiektu albo None."""
    tiles = [t for row in o["kafle"] for t in row if t is not None]
    if not tiles or any(zest.przejscie(t) == "O" for t in tiles): return None
    h, w = o["h"], o["w"]
    if h > 3 or w > 6: return None
    if ts is not None and ts not in L.WNETRZA_ZESTAWY: return None      # na zewnątrz płaskie są dachy i mury, nie blaty
    A = np.zeros((h * T, w * T), bool)
    for dy, row in enumerate(o["kafle"]):
        for dx, t in enumerate(row):
            if t is not None: A[dy * T:(dy + 1) * T, dx * T:(dx + 1) * T] = maska_pelna(zest, t)
    cols = A.any(0)
    width = max(1, int(cols.sum()))
    if width < 20: return None
    fill = A.sum(1) / width
    best, cur, start, bs = 0, 0, 0, 0
    for y, f in enumerate(fill):
        if f >= 0.6:
            if cur == 0: start = y
            cur += 1
            if cur > best: best, bs = cur, start
        else:
            cur = 0
    return [bs, bs + best - 1] if best >= 12 else None


# ================================================================================================ uczenie z map

def item_tile(zest, tile_obj, tid):
    """kafel-przedmiot: jednokafelkowy obiekt arkusza z małym prostokątem pikseli"""
    if tid not in tile_obj: return False
    oid, dx, dy, rola = tile_obj[tid]
    if rola != "jeden": return False
    bb = zest.bbox(tid)
    if not bb: return False
    return (bb[2] - bb[0] + 1) <= ITEM_MAX and (bb[3] - bb[1] + 1) <= ITEM_MAX


def item_event(e, zest):
    """zdarzenie-przedmiot: obiekt '!' (albo kafel) z małym obrazkiem mieszczącym się w swojej kratce"""
    if not e.page or not e.widoczne or not e.obiekt or e.natura or e.przenosi: return False
    bb = e.bbox(zest)
    if not bb: return False
    w, h = bb[2] - bb[0] + 1, bb[3] - bb[1] + 1
    if w > ITEM_MAX + 2 or h > ITEM_MAX + 2: return False
    return bb[0] >= e.x * T - 6 and bb[2] <= e.x * T + T + 5


def podstawa(bb):
    """punkt podstawy przedmiotu (środek dołu prostokąta pikseli)"""
    return ((bb[0] + bb[2]) // 2, bb[3])


def kafel_pod(mp, px, py, skip_tile=None):
    """najwyższy kafel B-E warstwy 3/2, którego piksel jest w punkcie (px, py) mapy -> (tid, warstwa) albo (None, None)"""
    x, y = px // T, py // T
    if not mp.inside(x, y): return None, None
    for z in (3, 2):
        t = mp.t(z, x, y)
        if not t or t == skip_tile or L.arkusz(t) not in ("B", "C", "D", "E", "A5"): continue
        if mp.zest.alfa(t)[py % T, px % T]: return t, z
    return None, None


def mebel(zest, tid):
    """kafel, który może być meblem pod przedmiotem: nie płaski dywan ('O' bez lady)"""
    p = zest.przejscie(tid)
    return p != "O" or zest.lada(tid)


class Nauka:
    """to, czego katalog uczy się z map (wzorcowych i wszystkich)"""

    def __init__(self):
        self.uzycie = collections.Counter()           # (ts, tid) -> wszystkie mapy
        self.uzycie_w = collections.Counter()         # (ts, tid) -> mapy wzorcowe
        self.auto = collections.Counter()             # (ts, kind)
        self.auto_w = collections.Counter()
        self.blat = collections.defaultdict(lambda: {"n": 0, "sciana": 0, "pod": [], "przedmioty": collections.Counter(), "mapy": collections.Counter()})
        self.grafiki = collections.defaultdict(lambda: {"miejsca": collections.Counter(), "prio": collections.Counter(), "rozmiar": None, "podstawa_dy": [], "mapy": collections.Counter()})
        self.kafle_przedmioty = collections.defaultdict(lambda: {"miejsca": collections.Counter(), "mapy": collections.Counter()})
        self.gw_wisi = collections.Counter()           # (ts, tid): gwiazdka nad wolną kratką, pod nią wolno
        self.deptany = collections.Counter()           # (ts, tid): kafel nie-gwiazdka na kratce, po której chodzi bohater
        self.otwarte = collections.Counter()           # (ts, tid, side): krawędź obiektu otwarta w mapie wzorcowej
        self.zamkniete = collections.Counter()         # (ts, tid, side): krawędź domknięta właściwym sąsiadem
        self.otwarte_all = collections.Counter()
        self.zamkniete_all = collections.Counter()
        self.prio2 = collections.Counter()             # (klucz grafiki): zdarzenie 'nad postacią' w mapie wzorcowej
        self.stat = collections.defaultdict(list)


def ucz_mape(N, mp, objinfo, wzor):
    zest, ts = mp.zest, mp.tsid
    tile_obj, links = objinfo[ts][1], objinfo[ts][2]
    W, H = mp.W, mp.H
    reach = None
    for y in range(H):
        for x in range(W):
            for z in (0, 1):
                t = mp.t(z, x, y)
                if t >= 2048:
                    N.auto[(ts, L.rodzaj_autokafla(t))] += 1
                    if wzor: N.auto_w[(ts, L.rodzaj_autokafla(t))] += 1
                elif t:
                    N.uzycie[(ts, t)] += 1
                    if wzor: N.uzycie_w[(ts, t)] += 1
            for z in (2, 3):
                t = mp.t(z, x, y)
                if not t: continue
                N.uzycie[(ts, t)] += 1
                if wzor: N.uzycie_w[(ts, t)] += 1
                # krawędzie obiektów: domknięte czy otwarte
                for side in ("N", "S", "W", "E"):
                    n = links.get((t, side))
                    if n is None: continue
                    dx, dy = {"N": (0, -1), "S": (0, 1), "W": (-1, 0), "E": (1, 0)}[side]
                    nb = [mp.t(zz, x + dx, y + dy) for zz in (2, 3)]
                    ok = n in nb or any(u and styk(zest, t, u, side) >= LINK_MIN for u in nb)
                    if not mp.inside(x + dx, y + dy): ok = True
                    (N.zamkniete_all if ok else N.otwarte_all)[(ts, t, side)] += 1
                    if wzor: (N.zamkniete if ok else N.otwarte)[(ts, t, side)] += 1
    if not wzor: return
    # ---- tylko mapy wzorcowe
    reach = mp.flood(mp.starty())
    for y in range(H):
        for x in range(W):
            if (x, y) not in reach: continue
            for z in (2, 3):
                t = mp.t(z, x, y)
                if not t: continue
                if zest.gwiazdka(t):
                    if (x, y + 1) in reach: N.gw_wisi[(ts, t)] += 1
                elif zest.pokrycie(t) > 0.05:
                    N.deptany[(ts, t)] += 1
    # przedmioty-kafle (warstwa 3 nad meblem z warstwy 2, albo kafel-przedmiot na podłodze)
    for y in range(H):
        for x in range(W):
            t3, t2 = mp.t(3, x, y), mp.t(2, x, y)
            sciana = mp.sciana(x, y)
            for (it, under) in ((t3, t2), (t2, None)):
                if not it or not item_tile(zest, tile_obj, it): continue
                if under is not None and not under: under = None
                if under is None and it == t2 and t3: continue
                kp = N.kafle_przedmioty[(ts, it)]
                kp["mapy"][mp.id] += 1
                if under and mebel(zest, under) and not zest.pusty(under):
                    bb = zest.bbox(it)
                    px, py = x * T + (bb[0] + bb[2]) // 2, y * T + bb[3]
                    s, sz = kafel_pod(mp, px, py - 2, skip_tile=it)
                    s = s or under
                    kp["miejsca"]["sciana_blat" if sciana else "blat"] += 1
                    b = N.blat[(ts, s)]
                    b["n"] += 1
                    if sciana: b["sciana"] += 1
                    b["pod"].append([px - (px // T) * T, py - ((py - 2) // T) * T])
                    b["przedmioty"]["kafel:%d" % it] += 1
                    b["mapy"][mp.id] += 1
                else:
                    kp["miejsca"]["sciana" if sciana else "podloga"] += 1
    # przedmioty-zdarzenia
    for e in mp.zd:
        if not e.page or not e.widoczne: continue
        k = e.klucz()
        if e.prio == 2: N.prio2[k] += 1
        if not item_event(e, zest): continue
        g = N.grafiki[k]
        bb = e.bbox(zest)
        g["rozmiar"] = [bb[2] - bb[0] + 1, bb[3] - bb[1] + 1]
        g["prio"][e.prio] += 1
        g["mapy"][mp.id] += 1
        px, py = podstawa(bb)
        g["podstawa_dy"].append(py - (e.y * T + T))
        s, sz = kafel_pod(mp, px, py - 2)
        sciana = mp.sciana(e.x, e.y)
        if s and mebel(zest, s):
            g["miejsca"]["sciana_blat" if sciana else "blat"] += 1
            b = N.blat[(ts, s)]
            b["n"] += 1
            if sciana: b["sciana"] += 1
            b["pod"].append([px % T, py - ((py - 2) // T) * T])
            b["przedmioty"][k] += 1
            b["mapy"][mp.id] += 1
        else:
            # na innym zdarzeniu (stół jako zdarzenie)?
            na_zd = False
            for o in mp.zd:
                if o is e or not o.page or not o.widoczne or item_event(o, zest): continue
                m = o.maska(zest)
                if not m: continue
                a, ox, oy = m
                if 0 <= px - ox < a.shape[1] and 0 <= py - 2 - oy < a.shape[0] and a[py - 2 - oy, px - ox]:
                    na_zd = True
                    N.blat[("zd", o.klucz())]["n"] += 1
                    N.blat[("zd", o.klucz())]["przedmioty"][k] += 1
                    N.blat[("zd", o.klucz())]["mapy"][mp.id] += 1
                    N.blat[("zd", o.klucz())]["pod"].append([px - o.x * T, py - o.y * T])
                    break
            if na_zd: g["miejsca"]["blat_zdarzenie"] += 1
            else: g["miejsca"]["sciana" if sciana else "podloga"] += 1
    if mp.wnetrze: statystyki(N, mp, reach)


def statystyki(N, mp, reach):
    """typowe odległości w dobrym wnętrzu"""
    W, H = mp.W, mp.H
    free = {c for c in reach}
    # szerokość przejść: min(bieg poziomy, bieg pionowy) dla każdej dostępnej kratki
    for (x, y) in free:
        h = 1; xx = x - 1
        while (xx, y) in free: h += 1; xx -= 1
        xx = x + 1
        while (xx, y) in free: h += 1; xx += 1
        v = 1; yy = y - 1
        while (x, yy) in free: v += 1; yy -= 1
        yy = y + 1
        while (x, yy) in free: v += 1; yy += 1
        N.stat["szerokosc_przejscia"].append(min(h, v, 6))
    # odstępy między meblami w rzędzie: wolne odcinki ograniczone z obu stron meblem (nie ścianą)
    def mebel_kratka(x, y):
        return mp.inside(x, y) and not mp.sciana(x, y) and (x, y) not in free and mp.teren(x, y)
    for y in range(H):
        x = 0
        while x < W:
            if (x, y) in free:
                x0 = x
                while x < W and (x, y) in free: x += 1
                if mebel_kratka(x0 - 1, y) and mebel_kratka(x, y):
                    N.stat["odstep_meble_poziomo"].append(min(x - x0, 6))
            else:
                x += 1
    for x in range(W):
        y = 0
        while y < H:
            if (x, y) in free:
                y0 = y
                while y < H and (x, y) in free: y += 1
                if mebel_kratka(x, y0 - 1) and mebel_kratka(x, y):
                    N.stat["odstep_meble_pionowo"].append(min(y - y0, 6))
            else:
                y += 1
    # meble przy ścianie: kratki mebli (zablokowane kafle B-E na podłodze), których górny sąsiad to ściana
    for y in range(H):
        for x in range(W):
            if mp.sciana(x, y) or (x, y) in free or not mp.teren(x, y): continue
            if not any(mp.t(z, x, y) for z in (2, 3)): continue
            N.stat["mebel_dotyka_sciany"].append(1 if (mp.inside(x, y - 1) and mp.sciana(x, y - 1)) or
                                                (mp.inside(x - 1, y) and mp.sciana(x - 1, y)) or
                                                (mp.inside(x + 1, y) and mp.sciana(x + 1, y)) else 0)
    # wolne pole przed drzwiami (ile kratek na wprost w głąb mapy)
    for e in mp.zd:
        if not e.przenosi: continue
        best = 0
        for d in (2, 4, 6, 8):
            dx, dy = L.DIRS[d]
            n = 0; x, y = e.x + dx, e.y + dy
            while (x, y) in free and n < 6: n += 1; x += dx; y += dy
            best = max(best, n)
        N.stat["wolne_przed_drzwiami"].append(best)


# ================================================================================================ zapis

def rozklad(vals):
    c = collections.Counter(vals)
    n = sum(c.values()) or 1
    return {str(k): round(v / n, 3) for k, v in sorted(c.items())}


def zbuduj(obrazki=True):
    objinfo = {}
    for ts in L.ZESTAWY:
        zest = L.zestaw(ts)
        objinfo[ts] = obiekty_zestawu(zest)
        print("zestaw %d: %d obiektów" % (ts, len(objinfo[ts][0])))
    N = Nauka()
    for mid in L.all_map_ids():
        try:
            mp = L.Mapa(mid)
        except Exception as ex:
            print("  pomijam Map%03d: %s" % (mid, ex)); continue
        if mp.tsid not in objinfo: continue
        ucz_mape(N, mp, objinfo, mid in L.WZORCE)
    print("nauczone: %d blatów, %d grafik przedmiotów" % (len(N.blat), len(N.grafiki)))
    kat = {"opis": "Katalog kafli Tawerny (tools/mapy/katalog.py). Mapy wzorcowe: %s." % ", ".join("Map%03d" % m for m in L.WZORCE),
           "wzorce": L.WZORCE, "zestawy": {}, "grafiki": {}, "blaty_zdarzenia": {}, "statystyki": {},
           "przesuniecia": ("Zdarzenia rysują się jak w RMMZ: klatka wyśrodkowana na kratce w poziomie, dół klatki = dół kratki; "
                            "grafiki bez '!' (postacie) 6 px wyżej; <Tree:...scale=> (ChoppableTree) zmniejsza wokół stopy. "
                            "Jedyny tag przesunięcia to <LudOff:dx,dy> (Ludzie.js), działa tylko dla zdarzeń 2500-2699 "
                            "(wstrzykiwanych przez wtyczkę) - w danych map ma go stół Map177 (id 3), gdzie nie działa. HomeDecor "
                            "i TownLife liczą położenie obrazka tak samo (środek kratki, dół).'grafiki[k].podstawa_dy' = ile px nad dołem "
                            "kratki zdarzenia leży widoczna podstawa przedmiotu (klatki 48x96 rysują przedmiot w kratce wyżej); "
                            "'kafle[id].blat.x/y' = gdzie (px w kratce blatu) leżą podstawy przedmiotów w mapach wzorcowych."),
           "klucze": {"p": "przejście: X blokuje, O przechodni, * gwiazdka, blok:2,8 zablokowane kierunki",
                      "a/k/w": "arkusz, kolumna, wiersz na arkuszu", "obiekt/dx/dy/rola": "obiekt arkusza i miejsce kafla w nim",
                      "laczy/sila": "sąsiedni kafel obiektu po stronie N/S/W/E i ile pikseli się styka",
                      "domkniete_*/otwarte_*": "ile razy na mapach (wzorcowych / wszystkich) ta krawędź ma / nie ma sąsiada",
                      "blat": "przedmioty leżą na nim w mapach wzorcowych (n), albo z_obiektu / z_flagi_lada",
                      "gwiazdka_nad_wolnym": "gwiazdka nad wolną kratką w mapie wzorcowej (np. łuk) - dozwolone",
                      "deptany": "bohater chodzi po nim w mapie wzorcowej (dywan, próg)",
                      "obiekty[].blat_mozliwy/powierzchnia_y": "mebel z płaskim wierzchem i pas tego wierzchu (px obiektu)"}}
    for ts in L.ZESTAWY:
        zest = L.zestaw(ts)
        objs, tile_obj, links = objinfo[ts]
        kafle = {}
        ids = [t for t in range(1024) if zest.sheet(5 + t // 256) is not None and not zest.pusty(t)]
        ids += [t for t in range(1536, 1664) if zest.sheet(4) is not None and not zest.pusty(t)]
        for t in ids:
            k = {"a": L.arkusz(t), "k": L.kol_wiersz(t)[0], "w": L.kol_wiersz(t)[1], "p": zest.przejscie(t)}
            if zest.krzak(t): k["krzak"] = 1
            if zest.lada(t): k["lada"] = 1
            if zest.drabina(t): k["drabina"] = 1
            if zest.uszkadza(t): k["uszkadza"] = 1
            if zest.teren(t): k["teren"] = zest.teren(t)
            if t >= 1536 and t >= zest.flag_len: k["brak_flag"] = 1
            bb = zest.bbox(t)
            k["bbox"] = list(bb)
            k["pokrycie"] = round(zest.pokrycie(t), 2)
            if t in tile_obj:
                oid, dx, dy, rola = tile_obj[t]
                k["obiekt"] = oid; k["dx"] = dx; k["dy"] = dy; k["rola"] = rola
                sides = [s for s in ("N", "S", "W", "E") if (t, s) in links]
                if sides:
                    k["laczy"] = {s: links[(t, s)] for s in sides}
                    k["sila"] = {s: styk(zest, t, links[(t, s)], s) for s in sides}
                    dw = {s: N.zamkniete_all[(ts, t, s)] for s in sides if N.zamkniete_all[(ts, t, s)]}
                    if dw: k["domkniete_wszedzie"] = dw
                    ow = {s: N.otwarte_all[(ts, t, s)] for s in sides if N.otwarte_all[(ts, t, s)]}
                    if ow: k["otwarte_wszedzie"] = ow
                ot = {s: N.otwarte[(ts, t, s)] for s in sides if N.otwarte[(ts, t, s)]}
                if ot: k["otwarte_we_wzorcach"] = ot
                zm = {s: N.zamkniete[(ts, t, s)] for s in sides if N.zamkniete[(ts, t, s)]}
                if zm: k["domkniete_we_wzorcach"] = zm
                if item_tile(zest, tile_obj, t): k["przedmiot"] = 1
            if N.uzycie[(ts, t)]: k["uzycie"] = N.uzycie[(ts, t)]
            if N.uzycie_w[(ts, t)]: k["uzycie_wzorce"] = N.uzycie_w[(ts, t)]
            if N.gw_wisi[(ts, t)]: k["gwiazdka_nad_wolnym"] = N.gw_wisi[(ts, t)]
            if N.deptany[(ts, t)]: k["deptany"] = N.deptany[(ts, t)]
            b = N.blat.get((ts, t))
            if b and b["n"]:
                pod = b["pod"]
                k["blat"] = {"n": b["n"], "na_scianie": b["sciana"],
                             "x": [min(p[0] for p in pod), max(p[0] for p in pod)],
                             "y": [min(p[1] for p in pod), max(p[1] for p in pod)],
                             "mapy": dict(b["mapy"]), "przedmioty": dict(b["przedmioty"].most_common(6))}
            elif zest.lada(t):
                k["blat"] = {"n": 0, "z_flagi_lada": 1}
            kp = N.kafle_przedmioty.get((ts, t))
            if kp and kp["miejsca"]:
                k["jako_przedmiot"] = dict(kp["miejsca"])
            kafle[str(t)] = k
        # blaty obiektowe: każdy kafel obiektu, którego inny kafel w tym samym wierszu jest blatem, też może nim być
        for o in objs:
            rows_with = set()
            for dy, row in enumerate(o["kafle"]):
                if any(t is not None and "blat" in kafle.get(str(t), {}) and kafle[str(t)]["blat"].get("n") for t in row): rows_with.add(dy)
            o["wiersze_blatu"] = sorted(rows_with)
            for dy in rows_with:
                for t in o["kafle"][dy]:
                    if t is not None and "blat" not in kafle[str(t)]:
                        kafle[str(t)]["blat"] = {"n": 0, "z_obiektu": o["id"]}
            pw = powierzchnia(zest, o, ts)
            if pw:
                o["blat_mozliwy"] = 1
                o["powierzchnia_y"] = pw
            top = [t for t in o["kafle"][0] if t is not None]
            bot = [t for t in o["kafle"][-1] if t is not None]
            o["gwiazdka_u_gory"] = bool(top) and all(zest.gwiazdka(t) for t in top)
            o["dol_blokuje"] = bool(bot) and all(zest.przejscie(t) == "X" for t in bot)
            o["uzycie"] = sum(N.uzycie[(ts, t)] for row in o["kafle"] for t in row if t is not None)
        auto = {}
        for kind in range(128):
            tid = L.baza_autokafla(kind)
            a = L.arkusz(tid)
            sn = L.ARKUSZE.index(a)
            if zest.sheet(sn) is None or zest.pusty(tid): continue
            r = {"a": a, "p": zest.przejscie(tid)}
            if zest.krzak(tid): r["krzak"] = 1
            if zest.lada(tid): r["lada"] = 1
            if zest.teren(tid): r["teren"] = zest.teren(tid)
            if tid >= zest.flag_len: r["brak_flag"] = 1
            if a == "A3": r["rodzaj"] = "dach" if ((kind - 48) // 8) % 2 == 0 else "sciana"
            elif a == "A4": r["rodzaj"] = "gora_sciany" if ((kind - 80) // 8) % 2 == 0 else "lico_sciany"
            elif a == "A1": r["rodzaj"] = "woda"
            else: r["rodzaj"] = "podloze"
            if N.auto[(ts, kind)]: r["uzycie"] = N.auto[(ts, kind)]
            if N.auto_w[(ts, kind)]: r["uzycie_wzorce"] = N.auto_w[(ts, kind)]
            auto[str(kind)] = r
        kat["zestawy"][str(ts)] = {"nazwa": zest.nazwa, "pliki": zest.pliki, "flagi_do": zest.flag_len,
                                   "kafle": kafle, "obiekty": objs, "autokafle": auto}
    for k, g in N.grafiki.items():
        d = {"miejsca": dict(g["miejsca"]), "prio": {str(a): b for a, b in g["prio"].items()}, "rozmiar": g["rozmiar"],
             "mapy": dict(g["mapy"])}
        if g["podstawa_dy"]: d["podstawa_dy"] = [min(g["podstawa_dy"]), max(g["podstawa_dy"])]
        kat["grafiki"][k] = d
    for k, n in N.prio2.items():
        kat["grafiki"].setdefault(k, {})["nad_postacia_we_wzorcach"] = n
    for (a, k), b in N.blat.items():
        if a != "zd": continue
        pod = b["pod"]
        kat["blaty_zdarzenia"][k] = {"n": b["n"], "x": [min(p[0] for p in pod), max(p[0] for p in pod)],
                                     "y": [min(p[1] for p in pod), max(p[1] for p in pod)],
                                     "przedmioty": dict(b["przedmioty"].most_common(6)), "mapy": dict(b["mapy"])}
    st = {}
    for key, vals in N.stat.items():
        if not vals: continue
        st[key] = {"n": len(vals), "rozklad": rozklad(vals), "mediana": statistics.median(vals)}
    blat_dy = []
    for (a, t), b in N.blat.items():
        if a == "zd": continue
        blat_dy += [p[1] for p in b["pod"]]
    if blat_dy: st["podstawa_przedmiotu_na_blacie_y"] = {"n": len(blat_dy), "rozklad": rozklad([v // 4 * 4 for v in blat_dy]),
                                                        "opis": "y podstawy przedmiotu w kratce blatu (0 = góra kratki, 48 = dół), co 4 px"}
    kat["statystyki"] = st
    L.save_json(OUT_JSON, kat)
    print("zapisano", OUT_JSON, "(%d kB)" % (os.path.getsize(OUT_JSON) // 1024))
    if obrazki:
        for ts in L.ZESTAWY: podglad(kat, ts)
    return kat


# ================================================================================================ podgląd

def podglad(kat, ts):
    zest = L.zestaw(ts)
    zk = kat["zestawy"][str(ts)]
    sheets = [sn for sn in range(4) if zest.sheet(5 + sn) is not None]
    if not sheets: return
    gap, top = 16, 64
    W = len(sheets) * (768 + gap) - gap + 2 * gap
    img = Image.new("RGBA", (W, 768 + top + 120), (28, 26, 34, 255))
    d = ImageDraw.Draw(img)
    d.text((gap, 12), "Zestaw %d: %s  (katalog kafli, mapy wzorcowe: %s)" % (ts, zest.nazwa, ", ".join(str(m) for m in L.WZORCE)),
           fill=(255, 214, 90), font=L.font(22, True))
    f, fs = L.font(11, True), L.font(10)
    cols = [(230, 90, 90), (90, 170, 240), (240, 200, 80), (120, 220, 140), (210, 120, 230), (240, 150, 70), (90, 220, 220)]
    for i, sn in enumerate(sheets):
        ox, oy = gap + i * (768 + gap), top
        # tło w kratkę, żeby było widać przezroczystość
        bg = Image.new("RGBA", (768, 768), (60, 58, 66, 255))
        bd = ImageDraw.Draw(bg)
        for yy in range(0, 768, 24):
            for xx in range(0, 768, 24):
                if (xx // 24 + yy // 24) % 2: bd.rectangle([xx, yy, xx + 23, yy + 23], fill=(72, 70, 80, 255))
        bg.alpha_composite(zest.sheet(5 + sn))
        ov = Image.new("RGBA", (768, 768), (0, 0, 0, 0))
        od = ImageDraw.Draw(ov)
        for t in range(sn * 256, sn * 256 + 256):
            k = zk["kafle"].get(str(t))
            if not k: continue
            c, r = k["k"], k["w"]
            x, y = c * T, r * T
            b = k.get("blat")
            if b and (b.get("n") or b.get("z_flagi_lada")):
                od.rectangle([x + 1, y + 1, x + T - 2, y + T - 2], fill=(60, 220, 90, 70))
            elif b:
                od.rectangle([x + 1, y + 1, x + T - 2, y + T - 2], fill=(60, 220, 90, 32))
        bg.alpha_composite(ov)
        bd = ImageDraw.Draw(bg)
        for o in zk["obiekty"]:
            if o["w"] * o["h"] < 2 or o["arkusz"] != "BCDE"[sn]: continue
            x0, y0 = o["kol"] * T, o["wiersz"] * T
            col = cols[o["id"] % len(cols)]
            bd.rectangle([x0 + 1, y0 + 1, x0 + o["w"] * T - 2, y0 + o["h"] * T - 2], outline=col + (255,), width=2)
        for t in range(sn * 256, sn * 256 + 256):
            k = zk["kafle"].get(str(t))
            if not k: continue
            x, y = k["k"] * T, k["w"] * T
            p = k["p"]
            sym, col = {"X": ("X", (255, 90, 90)), "O": ("O", (120, 240, 120)), "*": ("*", (255, 230, 80))}.get(p, ("→", (120, 200, 255)))
            if p.startswith("blok:"): sym = "b" + p[5:].replace(",", "")
            if k.get("lada"): sym += "L"
            if k.get("krzak"): sym += "K"
            tw = bd.textlength(sym, font=f)
            bd.rectangle([x + 1, y + 1, x + 4 + tw, y + 13], fill=(0, 0, 0, 190))
            bd.text((x + 3, y + 1), sym, fill=col + (255,), font=f)
            u = k.get("uzycie", 0)
            if u:
                s = str(u)
                tw = bd.textlength(s, font=fs)
                bd.rectangle([x + T - 5 - tw, y + T - 13, x + T - 1, y + T - 1], fill=(0, 0, 0, 170))
                bd.text((x + T - 3 - tw, y + T - 13), s, fill=(200, 200, 210, 255), font=fs)
            b = k.get("blat")
            if b and b.get("n"):
                s = "B%d" % b["n"]
                bd.rectangle([x + 1, y + T - 13, x + 4 + bd.textlength(s, font=fs), y + T - 1], fill=(0, 90, 20, 220))
                bd.text((x + 3, y + T - 13), s, fill=(170, 255, 170, 255), font=fs)
        img.alpha_composite(bg, (ox, oy))
        d.text((ox, oy - 20), "Arkusz %s: %s" % ("BCDE"[sn], zest.pliki[5 + sn].split("/")[-1]), fill=(230, 230, 236), font=L.font(14, True))
    ly = top + 768 + 14
    leg = ["X = blokuje,  O = przechodni,  * = gwiazdka (rysowany nad postacią),  b28 = zablokowane kierunki (2 dół, 4 lewo, 6 prawo, 8 góra),  L = lada,  K = krzak",
           "ramka w kolorze = kafle jednego obiektu (stykają się krawędziami na arkuszu),  liczba w rogu = ile razy kafel stoi na mapach",
           "zielone tło + B12 = blat: tyle przedmiotów leży na nim w mapach wzorcowych;  blade zielone = ten sam wiersz obiektu co blat (prawdopodobnie też blat)"]
    for s in leg:
        d.text((gap, ly), s, fill=(214, 214, 222), font=L.font(14)); ly += 22
    out = L.DOCS + "katalog_%02d.png" % ts
    os.makedirs(L.DOCS, exist_ok=True)
    img.convert("RGB").save(out, optimize=True)
    print("podgląd", out)


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"): sys.stdout.reconfigure(encoding="utf-8")
    zbuduj(obrazki="--bez-obrazkow" not in sys.argv)
