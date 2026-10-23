# -*- coding: utf-8 -*-
"""KONTROLA MAP (tools/mapy/kontrola.py) - linter map RPG Maker MZ Tawerny.

Użycie:
  python tools/mapy/kontrola.py 105 106 172          kontrola wybranych map (numery albo Map105)
  python tools/mapy/kontrola.py 8 --nowe             tylko nowa część powiększonej mapy (tools/powieksz/stan.json)
  python tools/mapy/kontrola.py 8 --obszar 52,0,103,137   tylko prostokąt x0,y0,x1,y1 (kratki włącznie)
  python tools/mapy/kontrola.py 105 --json           wynik także jako docs/mapy/kontrola_Map105.json
  python tools/mapy/kontrola.py --przeglad           przegląd map agentów -> docs/mapy/PRZEGLAD.md + obrazki
  opcje: --bez-obrazka, --katalog (najpierw odbuduj katalog), --dane DIR (czytaj mapy z innego folderu, np. staging)

Wynik: raport tekstowy na ekran i obrazek docs/mapy/kontrola_MapNNN.png (render mapy z siatką, problemy w ramkach
z kodem). Wykrywa (kody):
  Z1 zdarzenia na jednej kratce (ten sam priorytet)          Z2 obszary zajęte (<Occupy>) nachodzą na siebie
  Z3 zdarzenie stoi na kaflu blokującym bez powodu            Z4 zdarzenie poza mapą
  P1 przedmiot na meblu, który nie jest blatem                P2 przedmiot na krawędzi blatu / poza blatem
  P3 przedmiot stołowy leży na podłodze (informacja)          P4 kafel przechodni na meblu: bohater wejdzie na mebel
  O1 obiekt rozcięty (dół bez góry, góra bez dołu, ucięty bok)
  G1 gwiazdka nad wolną kratką: bohater wchodzi pod obiekt     G2 wysoki obiekt bez gwiazdki: bohater wchodzi na obiekt
  G3 obraz zdarzenia wystaje na wolną kratkę                   G4 zdarzenie 'pod postacią' wyższe niż kratka
  G5 zdarzenie 'nad postacią' nad wolną kratką
  D1 miejsca nieosiągalne (flood fill od wejść)                D2 wyjście / drzwi nieosiągalne albo zastawione
  D3 miejsce przybycia zablokowane                             D4 zdarzenie z akcją nieosiągalne
  W1 przejście węższe niż 1 kratka (obraz zwęża przejście)
  R1 obiekt z kafli na mapie plenerowej z drzewami-zdarzeniami (zestaw 9): obiekty mają być zdarzeniami
Wiedzę o kaflach bierze z tools/mapy/katalog.json (python tools/mapy/katalog.py). Nic nie zapisuje do data/ ani js/.
"""
import os, sys, re, json, collections
import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import mapylib as L
from mapylib import T

KATALOG = os.path.join(L.HERE, "katalog.json")
STAN_POWIEKSZ = L.ROOT + "tools/powieksz/stan.json"

OPISY = {
    "Z1": "zdarzenia na jednej kratce", "Z2": "obszary zdarzeń nachodzą", "Z3": "zdarzenie na kaflu blokującym",
    "Z4": "zdarzenie poza mapą",
    "P1": "przedmiot na meblu, który nie jest blatem", "P2": "przedmiot na krawędzi blatu / poza blatem",
    "P3": "przedmiot stołowy na podłodze", "P4": "kafel przechodni na meblu (bohater wejdzie na mebel)",
    "O1": "obiekt rozcięty",
    "G1": "bohater wchodzi pod obiekt (gwiazdka nad wolną kratką)", "G2": "bohater wchodzi na obiekt (góra bez gwiazdki)",
    "G3": "obraz zdarzenia wystaje na wolną kratkę", "G4": "zdarzenie 'pod postacią' wyższe niż kratka",
    "G5": "zdarzenie 'nad postacią' nad wolną kratką",
    "D1": "miejsca nieosiągalne", "D2": "wyjście / drzwi nieosiągalne", "D3": "miejsce przybycia zablokowane",
    "D4": "zdarzenie z akcją nieosiągalne",
    "W1": "przejście węższe niż 1 kratka",
    "R1": "obiekt z kafli na mapie plenerowej (obiekty mają być zdarzeniami)",
}
WAGA = {"Z1": "uwaga", "Z2": "uwaga", "Z3": "uwaga", "Z4": "błąd", "P1": "uwaga", "P2": "uwaga", "P3": "info", "P4": "błąd",
        "O1": "uwaga", "G1": "uwaga", "G2": "uwaga", "G3": "uwaga", "G4": "uwaga", "G5": "uwaga",
        "D1": "uwaga", "D2": "błąd", "D3": "błąd", "D4": "uwaga", "W1": "uwaga", "R1": "uwaga"}
KOLOR = {"Z": (255, 150, 40), "P": (80, 220, 255), "O": (255, 90, 220), "G": (255, 230, 60), "D": (255, 60, 60), "W": (160, 120, 255),
         "R": (120, 255, 160)}
ZESTAWY_NATURY = (9,)        # mapy plenerowe z drzewami-zdarzeniami (Map003, łąki, drogi): obiekty tylko jako zdarzenia
ITEM_MAX = 44
SOLID = 200
WYSTAJE_TYL, WYSTAJE_PRZOD = 10, 5    # o ile px płaski przedmiot może wyjść za tylną / przednią krawędź blatu (wzorce: do 9 / 4)


# ================================================================================================ katalog

_KAT = None


def katalog(rebuild=False):
    global _KAT
    if _KAT is None or rebuild:
        if rebuild or not os.path.exists(KATALOG):
            import katalog as K
            K.zbuduj(obrazki=False)
        _KAT = L.load_json(KATALOG)
    return _KAT


class Kat:
    """dostęp do katalogu dla jednego zestawu kafli"""

    def __init__(self, ts):
        k = katalog()
        z = k["zestawy"].get(str(ts), {"kafle": {}, "obiekty": []})
        self.kafle = z["kafle"]
        self.obiekty = z["obiekty"]
        self.grafiki = k["grafiki"]
        self.blaty_zd = k["blaty_zdarzenia"]

    def k(self, t):
        return self.kafle.get(str(t))

    def obiekt(self, t):
        k = self.k(t)
        return self.obiekty[k["obiekt"]] if k and "obiekt" in k else None

    def rola(self, t):
        k = self.k(t)
        return k.get("rola") if k else None

    def przedmiot(self, t):
        k = self.k(t)
        return bool(k and k.get("przedmiot"))

    def blat(self, t):
        """kafel znany jako blat (z map wzorcowych, z flagi lada, z wiersza obiektu) albo obiekt z płaskim wierzchem"""
        k = self.k(t)
        if not k: return False
        if "blat" in k: return True
        o = self.obiekt(t)
        return bool(o and o.get("blat_mozliwy"))

    def laczy(self, t):
        k = self.k(t)
        return (k or {}).get("laczy", {})

    def otwarte_ok(self, t, side):
        k = self.k(t)
        return bool(k and k.get("otwarte_we_wzorcach", {}).get(side))

    def pewne_polaczenie(self, t, side):
        """połączenie z arkusza potwierdzone: silny styk albo para stoi razem na mapach"""
        k = self.k(t) or {}
        return (k.get("sila", {}).get(side, 0) >= 12) or (k.get("domkniete_wszedzie", {}).get(side, 0) >= 2)

    def gw_ok(self, t):
        k = self.k(t)
        return bool(k and k.get("gwiazdka_nad_wolnym"))

    def deptany(self, t):
        k = self.k(t)
        return bool(k and k.get("deptany"))

    def miejsca_grafiki(self, key):
        g = self.grafiki.get(key)
        return (g or {}).get("miejsca", {})

    def nad_postacia_ok(self, key):
        g = self.grafiki.get(key)
        return bool(g and g.get("nad_postacia_we_wzorcach"))


# ================================================================================================ pomocnicze

def item_tile(kat, zest, t):
    if not t or not kat.przedmiot(t): return False
    bb = zest.bbox(t)
    return bool(bb) and bb[2] - bb[0] + 1 <= ITEM_MAX and bb[3] - bb[1] + 1 <= ITEM_MAX


def item_event(e, zest):
    if not e.page or not e.widoczne or not e.obiekt or e.natura or e.przenosi: return False
    bb = e.bbox(zest)
    if not bb: return False
    if bb[2] - bb[0] + 1 > ITEM_MAX + 2 or bb[3] - bb[1] + 1 > ITEM_MAX + 2: return False
    return bb[0] >= e.x * T - 6 and bb[2] <= e.x * T + T + 5


def solid_np(img):
    return np.array(img)[:, :, 3] > SOLID


def plaski(bb, fill=None):
    """przedmiot płaski (talerz, chleb, księga): niski albo szerszy niż wysoki; otwarta księga / zwój ukosem: obrys ~kwadrat,
    ale wypełniony do połowy (romb), a miska czy dzban - prawie cały (fill: część obrysu z pikselami)"""
    w, h = bb[2] - bb[0] + 1, bb[3] - bb[1] + 1
    return h <= 16 or (h <= 26 and w >= h) or (fill is not None and fill < 0.6 and h <= 30 and w >= 0.85 * h)


def kontakt(bb, fill=None):
    """punkt, którym przedmiot dotyka blatu: płaskie - środek, wyższe (świeca, dzban) - 2 px nad podstawą"""
    cx = (bb[0] + bb[2]) // 2
    cy = (bb[1] + bb[3]) // 2 if plaski(bb, fill) else bb[3] - 2
    return cx, cy


class Okno:
    """pełne piksele mebli (warstwy 2-3 i zdarzenia-meble) wokół kratki, bez samego przedmiotu"""

    def __init__(self, mp, kat, x, y, skip_layer3=False, skip_event=None, items_ev=()):
        self.ox, self.oy = (x - 1) * T, (y - 1) * T
        A = np.zeros((3 * T, 3 * T), bool)
        P = np.zeros((3 * T, 3 * T), bool)          # obecność (alfa > 40)
        self.tiles = {}
        for dy in range(3):
            for dx in range(3):
                cx, cy = x - 1 + dx, y - 1 + dy
                if not mp.inside(cx, cy): continue
                for z in (2, 3):
                    t = mp.t(z, cx, cy)
                    if not t: continue
                    if z == 3 and skip_layer3 and (cx, cy) == (x, y): continue
                    if mp.zest.przejscie(t) == "O" and not mp.zest.lada(t): continue        # dywan, płaska ozdoba
                    if z == 3 and mp.t(2, cx, cy) and item_tile(kat, mp.zest, t): continue          # inny przedmiot, nie mebel
                    A[dy * T:(dy + 1) * T, dx * T:(dx + 1) * T] |= solid_np(mp.zest.tile(t))
                    P[dy * T:(dy + 1) * T, dx * T:(dx + 1) * T] |= mp.zest.alfa(t)
                    self.tiles.setdefault((cx, cy), []).append(t)
        self.events = []
        for e in mp.zd:
            if e is skip_event or e in items_ev or not e.page or not e.widoczne or e.postac: continue
            if abs(e.x - x) > 2 or e.y < y - 1 or e.y > y + 3: continue
            sp = e.sprite(mp.zest)
            if not sp: continue
            im, sx, sy = sp
            a = np.array(im)[:, :, 3]
            # przytnij do okna
            x0, y0 = max(sx, self.ox), max(sy, self.oy)
            x1, y1 = min(sx + im.width, self.ox + 3 * T), min(sy + im.height, self.oy + 3 * T)
            if x1 <= x0 or y1 <= y0: continue
            sub = a[y0 - sy:y1 - sy, x0 - sx:x1 - sx]
            A[y0 - self.oy:y1 - self.oy, x0 - self.ox:x1 - self.ox] |= sub > SOLID
            P[y0 - self.oy:y1 - self.oy, x0 - self.ox:x1 - self.ox] |= sub > 40
            self.events.append(e)
        self.A, self.P = A, P

    def solid(self, px, py):
        lx, ly = px - self.ox, py - self.oy
        return 0 <= lx < 3 * T and 0 <= ly < 3 * T and bool(self.A[ly, lx])

    def obecny(self, px, py):
        lx, ly = px - self.ox, py - self.oy
        return 0 <= lx < 3 * T and 0 <= ly < 3 * T and bool(self.P[ly, lx])

    def bieg_pion(self, px, py):
        """ciągły pas pełnych pikseli w kolumnie px zawierający py: (góra, dół)"""
        lx, ly = px - self.ox, py - self.oy
        col = self.A[:, lx]
        a = ly
        while a - 1 >= 0 and col[a - 1]: a -= 1
        b = ly
        while b + 1 < 3 * T and col[b + 1]: b += 1
        return a + self.oy, b + self.oy

    def bieg_poz(self, px, py):
        lx, ly = px - self.ox, py - self.oy
        row = self.A[ly, :]
        a = lx
        while a - 1 >= 0 and row[a - 1]: a -= 1
        b = lx
        while b + 1 < 3 * T and row[b + 1]: b += 1
        return a + self.ox, b + self.ox


# ================================================================================================ kontrola

class Kontrola:
    def __init__(self, mp, obszar=None):
        self.mp = mp
        self.kat = Kat(mp.tsid)
        self.zest = mp.zest
        self.obszar = obszar          # funkcja (x, y) -> bool: które kratki raportować
        self.problemy = []
        self.oceny = {}           # przedmiot -> {"blat": na płaskim wierzchu?, "luz": px od krawędzi}
        self._seen = set()
        self.starty = mp.starty()
        self.zrodlo_wejsc = "przeniesienia na tę mapę"
        if not self.starty:
            self.starty = self.wejscia_zastepcze()
        self.reach = mp.flood(self.starty)
        self.bez_wejsc = not self.starty

    WYJSCIE_RX = re.compile(r"^(Drzwi|Wyj[sś]cie|Wej[sś]cie|Schody|W[lł]az|Drabina|Klapa|Przej[sś]cie|Brama)", re.I)

    def wejscia_zastepcze(self):
        """gdy na mapę przenosi tylko wtyczka (stałe w kodzie): kratki przy wyjściach tej mapy, a w ostateczności
        największy spójny obszar, na którym da się stać"""
        mp = self.mp
        st = []
        for e in mp.zd:
            if not (e.przenosi or e.drzwi or self.WYJSCIE_RX.match(e.name)): continue
            for c in [(e.x, e.y)] + [(e.x + dx, e.y + dy) for (dx, dy) in L.DIRS.values()]:
                if mp.inside(*c) and mp.stoi(*c): st.append(c)
        if st:
            self.zrodlo_wejsc = "kratki przy wyjściach mapy (na mapę przenosi wtyczka)"
            return st
        cand = {(x, y) for y in range(mp.H) for x in range(mp.W) if mp.stoi(x, y)}
        best, best_score = [], -1
        seen = set()
        for c in sorted(cand):
            if c in seen: continue
            comp = mp.flood([c])
            seen |= comp
            # obszar z największą liczbą rzeczy (meble, zdarzenia) obok, a nie pusta pustka wokół pokoju
            near = {(x + dx, y + dy) for (x, y) in comp for dx in (-1, 0, 1) for dy in (-1, 0, 1)}
            score = sum(1 for (x, y) in near if mp.inside(x, y) and (mp.t(2, x, y) or mp.t(3, x, y)))
            score += 5 * sum(1 for e in mp.zd if (e.x, e.y) in near)
            score = score * 1000 + len(comp)
            if score > best_score: best, best_score = list(comp), score
        if best:
            self.zrodlo_wejsc = "obszar z największą liczbą mebli i zdarzeń (brak przeniesień i wyjść)"
            return best[:1]
        return []

    def w_obszarze(self, x, y):
        return self.obszar is None or self.obszar(x, y)

    def dodaj(self, kod, x, y, opis, klucz=None, waga=None):
        if not self.w_obszarze(x, y): return
        k = (kod, x, y, klucz or opis)
        if k in self._seen: return
        self._seen.add(k)
        self.problemy.append({"kod": kod, "x": x, "y": y, "waga": waga or WAGA[kod], "opis": opis})

    def wolna(self, x, y):
        """kratka osiągalna dla bohatera"""
        return (x, y) in self.reach

    # ---------------------------------------------------------------------------------------- Z
    def zdarzenia(self):
        mp = self.mp
        vis = [e for e in mp.zd if e.page and e.widoczne]
        by_cell = collections.defaultdict(list)
        for e in mp.zd:
            if not (0 <= e.x < mp.W and 0 <= e.y < mp.H):
                self.problemy.append({"kod": "Z4", "x": e.x, "y": e.y, "waga": WAGA["Z4"],
                                      "opis": "zdarzenie %d '%s' stoi poza mapą (%d,%d), mapa ma %dx%d" % (e.id, e.name, e.x, e.y, mp.W, mp.H)})
        for e in vis:
            by_cell[(e.x, e.y)].append(e)
        for (x, y), es in by_cell.items():
            for i in range(len(es)):
                for j in range(i + 1, len(es)):
                    a, b = es[i], es[j]
                    if a.prio != b.prio: continue
                    if item_event(a, self.zest) != item_event(b, self.zest) and a.prio != 1: continue
                    if not self._obrazy_nachodza(a, b): continue
                    self.dodaj("Z1", x, y, "zdarzenia %d '%s' i %d '%s' na jednej kratce (%d,%d)" % (a.id, a.name, b.id, b.name, x, y))
        # obszary zajęte
        cells = collections.defaultdict(list)
        for e in mp.zd:
            if not e.blokuje or not e.widoczne: continue      # niewidoczne zdarzenia do rozmowy / oglądania mogą leżeć pod obrazem
            for c in e.komorki_blokujace():
                cells[c].append(e)
        for (x, y), es in cells.items():
            if len(es) < 2: continue
            ids = sorted({e.id for e in es})
            if len(ids) < 2: continue
            if not any(e.occupy for e in es): continue
            self.dodaj("Z2", x, y, "obszary zdarzeń %s nachodzą na kratce (%d,%d)" % (", ".join("%d '%s'" % (e.id, e.name) for e in es[:3]), x, y),
                       klucz=tuple(ids))
        # zdarzenie na kaflu blokującym
        for e in vis:
            x, y = e.x, e.y
            if not mp.inside(x, y): continue
            tiles_block = not mp.kratka_wolna(x, y)
            if not tiles_block: continue
            if e.postac:
                self.dodaj("Z3", x, y, "postać %d '%s' stoi na kaflu blokującym (%d,%d)" % (e.id, e.name, x, y))
                continue
            if e.natura and e.prio == 1:
                co = self.podloze_zle(x, y)
                if co:
                    self.dodaj("Z3", x, y, "%d '%s' (%s) stoi %s (%d,%d)" % (e.id, e.name, e.klucz(), co, x, y))
                continue
            if mp.sciana(x, y): continue                 # ozdoby ścienne, okna, drzwi w murze
            if item_event(e, self.zest): continue        # przedmioty sprawdza P1/P2
            if e.natura or e.drzwi: continue
            furn = [t for t in mp.gorne(x, y) if not self.zest.gwiazdka(t) and self.zest.przejscie(t) != "O" and not self.zest.pusty(t)]
            if furn and e.prio == 1:
                self.dodaj("Z3", x, y, "zdarzenie %d '%s' (%s) stoi na meblu z kafli %s (%d,%d)" % (
                    e.id, e.name, e.klucz(), "/".join(str(t) for t in furn), x, y))

    def podloze_zle(self, x, y):
        """drzewo / kamień na wodzie, na licu ściany / urwiska albo na dachu: opis albo None"""
        mp = self.mp
        if mp.rl(x, y) in ("pod", "nad"): return None
        for z in (1, 0):
            t = mp.t(z, x, y)
            if t < 2048: continue
            k = L.rodzaj_autokafla(t)
            f = mp.zest.flag(t)
            if (f & 0x0F) != 0x0F: return None          # przechodni grunt
            if k < 16: return "na wodzie"
            if 48 <= k < 80: return "na dachu albo ścianie budynku"
            if k >= 80 and ((k - 80) // 8) % 2 == 1: return "na licu ściany / urwiska"
            return None
        return None

    def _obrazy_nachodza(self, a, b):
        """obrazy dwóch zdarzeń zachodzą na siebie (>= 10% mniejszego)"""
        ma, mb = a.maska(self.zest, th=120), b.maska(self.zest, th=120)
        if not ma or not mb: return False
        A, ax, ay = ma
        B, bx, by = mb
        x0, y0 = max(ax, bx), max(ay, by)
        x1, y1 = min(ax + A.shape[1], bx + B.shape[1]), min(ay + A.shape[0], by + B.shape[0])
        if x1 <= x0 or y1 <= y0: return False
        ov = (A[y0 - ay:y1 - ay, x0 - ax:x1 - ax] & B[y0 - by:y1 - by, x0 - bx:x1 - bx]).sum()
        small = max(1, min(A.sum(), B.sum()))
        return ov >= 0.10 * small

    # ---------------------------------------------------------------------------------------- P
    def przedmioty(self):
        mp, zest, kat = self.mp, self.zest, self.kat
        items_ev = [e for e in mp.zd if item_event(e, zest) and mp.inside(e.x, e.y)]
        sitems = set(items_ev)
        for e in items_ev:
            bb = e.bbox(zest)
            m = e.maska(zest, th=120)
            fill = float(m[0][bb[1] - m[2]:bb[3] - m[2] + 1, bb[0] - m[1]:bb[2] - m[1] + 1].mean()) if m else None
            self._klucz_oceny = "zd:%d" % e.id
            self.sprawdz_przedmiot(e.x, e.y, bb, "zdarzenie %d '%s' (%s)" % (e.id, e.name, e.klucz()), e.klucz(),
                                   skip_event=e, items_ev=sitems, fill=fill)
        for y in range(mp.H):
            for x in range(mp.W):
                t3, t2 = mp.t(3, x, y), mp.t(2, x, y)
                if t3 and t2 and item_tile(kat, zest, t3) and not zest.pusty(t2):
                    bb = zest.bbox(t3)
                    fill = float(zest.alfa(t3)[bb[1]:bb[3] + 1, bb[0]:bb[2] + 1].mean())
                    bb = (x * T + bb[0], y * T + bb[1], x * T + bb[2], y * T + bb[3])
                    self._klucz_oceny = "kafel:%d@%d,%d" % (t3, x, y)
                    self.sprawdz_przedmiot(x, y, bb, "kafel %d (%s %d,%d)" % (t3, L.arkusz(t3), *L.kol_wiersz(t3)), "kafel:%d" % t3,
                                           skip_layer3=True, items_ev=sitems, fill=fill)
                # P4: kafel przechodni na warstwie 3 odblokowuje mebel z warstwy 2
                if t3 and t2 and not zest.gwiazdka(t3) and zest.przejscie(t3) == "O" and zest.przejscie(t2) == "X" \
                        and not zest.pusty(t3) and self.wolna(x, y):
                    self.dodaj("P4", x, y, "kafel %d (przechodni) na meblu %d: bohater wejdzie na mebel w (%d,%d)" % (t3, t2, x, y))

    def pasy(self, okno, cx, cy):
        """pasy płaskiego wierzchu mebli w kolumnie pikseli cx wokół cy: [(y0, y1, kafel albo zdarzenie)] w pikselach mapy"""
        kat, zest, mp = self.kat, self.zest, self.mp
        segs = []
        col = cx // T
        for cell_y in range(cy // T - 1, cy // T + 2):
            for t in okno.tiles.get((col, cell_y), []):
                o = kat.obiekt(t)
                band = o.get("powierzchnia_y") if o else None
                if not band: continue
                dy = kat.k(t)["dy"]
                b0, b1 = cell_y * T + band[0] - dy * T, cell_y * T + band[1] - dy * T
                c0, c1 = max(b0, cell_y * T), min(b1, cell_y * T + T - 1)
                if c0 <= c1: segs.append([c0, c1, t])
        for e in okno.events:
            band = self.pas_zdarzenia(e)
            if band and band[2] <= cx <= band[3]: segs.append([band[0], band[1], e])
        segs.sort(key=lambda s: s[0])
        out = []
        for sgm in segs:
            if out and sgm[0] <= out[-1][1] + 1:
                out[-1][1] = max(out[-1][1], sgm[1])
            else:
                out.append(list(sgm))
        return out

    _pasy_zd = {}

    def pas_zdarzenia(self, e):
        """płaski wierzch mebla-zdarzenia (stół z obrazka): (y0, y1, x0, x1) w pikselach mapy albo None"""
        if e.id in self._pasy_zd: return self._pasy_zd[e.id]
        out = None
        m = e.maska(self.zest, th=SOLID)
        if m:
            a, ox, oy = m
            cols = a.any(0)
            w = int(cols.sum())
            if w >= 20:
                fill = a.sum(1) / float(w)
                best, cur, st, bs = 0, 0, 0, 0
                for yy, f in enumerate(fill):
                    if f >= 0.6:
                        if cur == 0: st = yy
                        cur += 1
                        if cur > best: best, bs = cur, st
                    else:
                        cur = 0
                if best >= 10:
                    xs = np.where(cols)[0]
                    out = (oy + bs, oy + bs + best - 1, ox + int(xs.min()), ox + int(xs.max()))
        self._pasy_zd[e.id] = out
        return out

    def sprawdz_przedmiot(self, x, y, bb, kto, key, skip_layer3=False, skip_event=None, items_ev=(), fill=None):
        mp, zest, kat = self.mp, self.zest, self.kat
        miejsca = kat.miejsca_grafiki(key) or {}
        if mp.sciana(x, y) and miejsca.get("sciana") and not miejsca.get("blat"): return      # ozdoba ścienna jak we wzorcach
        okno = Okno(mp, kat, x, y, skip_layer3=skip_layer3, skip_event=skip_event, items_ev=items_ev)
        cx, cy = kontakt(bb, fill)
        flat = plaski(bb, fill)
        sciana = mp.sciana(x, y)
        pasy = self.pasy(okno, cx, cy)
        # najbliższy pas (zawierający punkt podparcia albo do 12 px od niego)
        best, dist = None, 999
        for (b0, b1, src) in pasy:
            d = 0 if b0 <= cy <= b1 else (b0 - cy if cy < b0 else cy - b1)
            if d < dist: best, dist = (b0, b1, src), d
        if best and dist <= 12:
            b0, b1, src = best
            # ocena położenia (dla poprawek): ile px od najbliższej krawędzi płaskiego wierzchu (ujemne: poza nim)
            luz = min(cy - b0, b1 - cy) if flat else min(cy - b0, b1 - cy - 2)
            if okno.solid(cx, min(max(cy, b0), b1)):
                l_, r_ = okno.bieg_poz(cx, min(max(cy, b0), b1))
                luz = min(luz, bb[0] - l_ + 6, r_ - bb[2] + 6)
            if isinstance(src, int):
                ob = kat.k(src) or {}
                self.oceny[getattr(self, "_klucz_oceny", "")] = {"blat": True, "luz": luz, "plaski": flat, "zrodlo": src, "obiekt": ob.get("obiekt"),
                                                                "wyuczony": bool((ob.get("blat") or {}).get("n") or (ob.get("blat") or {}).get("z_flagi_lada")
                                                                                 or (ob.get("blat") or {}).get("z_obiektu") is not None)}
            else:
                self.oceny[getattr(self, "_klucz_oceny", "")] = {"blat": True, "luz": luz, "plaski": flat, "zrodlo": "zd:%d" % src.id, "obiekt": "zd:%d" % src.id,
                                                                "wyuczony": True}
            if isinstance(src, int) and not kat.blat(src):
                self.dodaj("P1", x, y, "%s leży na kaflu %d (%s %d,%d), który nie jest blatem (%d,%d)" % (
                    kto, src, L.arkusz(src), *L.kol_wiersz(src), x, y))
                return
            margin = 0 if flat else 2
            if cy < b0:
                gdzie = "na tylnej krawędzi blatu" if b0 - cy <= 6 else "za blatem (nad jego tylną krawędzią)"
                self.dodaj("P2", x, y, "%s stoi %s: %d px od płaskiego wierzchu w (%d,%d)" % (kto, gdzie, b0 - cy, x, y))
                return
            if cy > b1 - margin:
                gdzie = "na przedniej krawędzi blatu" if cy - b1 <= 3 else "przed blatem (na jego przodzie / nogach)"
                self.dodaj("P2", x, y, "%s stoi %s: %d px poza płaskim wierzchem w (%d,%d)" % (kto, gdzie, max(0, cy - b1 + margin), x, y))
                return
            # płaski leży na blacie cały (2026-10-22, księgi w Map173 środkiem na blacie, połową za tylną krawędzią)
            tyl, przod = b0 - bb[1], bb[3] - b1
            if flat and (tyl > WYSTAJE_TYL or przod > WYSTAJE_PRZOD):
                if tyl - WYSTAJE_TYL >= przod - WYSTAJE_PRZOD:
                    self.dodaj("P2", x, y, "%s wystaje %d px za tylną krawędź blatu w (%d,%d)" % (kto, tyl, x, y))
                else:
                    self.dodaj("P2", x, y, "%s zwisa %d px z przedniej krawędzi blatu w (%d,%d)" % (kto, przod, x, y))
                self.oceny[getattr(self, "_klucz_oceny", "")]["luz"] = min(luz, -max(tyl, przod))
                return
            yy = min(max(cy, b0), b1)
            if okno.solid(cx, yy):
                left, right = okno.bieg_poz(cx, yy)
                if bb[0] < left - 5 or bb[2] > right + 5:
                    self.dodaj("P2", x, y, "%s wystaje %d px poza bok blatu w (%d,%d)" % (kto, max(left - bb[0], bb[2] - right), x, y))
            return
        # bez pasa płaskiego wierzchu
        if okno.obecny(cx, cy):
            pod = None
            for t in reversed(okno.tiles.get((cx // T, cy // T), [])):
                if zest.alfa(t)[cy % T, cx % T]: pod = t; break
            if pod is not None and not kat.blat(pod):
                self.dodaj("P1", x, y, "%s leży na kaflu %d (%s %d,%d), który nie jest blatem (%d,%d)" % (
                    kto, pod, L.arkusz(pod), *L.kol_wiersz(pod), x, y))
                return
            if not okno.solid(cx, cy):
                self.dodaj("P2", x, y, "%s stoi na brzegu mebla (półprzezroczysty cień / rama) w (%d,%d)" % (kto, x, y))
            return
        if sciana: return                    # wisi na ścianie (obraz, półka ścienna, haki)
        # pod punktem podparcia (do 20 px niżej) jest mebel: przedmiot wisi w powietrzu za / nad nim;
        # mebel tylko wyżej: przedmiot leży na podłodze przed meblem (to sprawdza P3)
        lx = cx - okno.ox
        pod_spodem = [yy for yy in range(cy + 1, min(cy + 21, okno.oy + 3 * T)) if okno.P[yy - okno.oy, lx]]
        if pod_spodem:
            self.dodaj("P2", x, y, "%s wisi w powietrzu za meblem / nad nim (%d px nad jego pikselami) w (%d,%d)" % (
                kto, pod_spodem[0] - cy, x, y))
            return
        if sciana or not miejsca: return
        na_blacie = miejsca.get("blat", 0) + miejsca.get("blat_zdarzenie", 0) + miejsca.get("sciana_blat", 0)
        na_podl = miejsca.get("podloga", 0)
        if not na_blacie: return
        # tuż przed meblem (mebel zaczyna się do 16 px nad punktem podparcia): pewnie miał stać na nim
        nad = [yy for yy in range(max(okno.oy, cy - 16), cy) if okno.P[yy - okno.oy, lx]]
        if nad and na_blacie > na_podl:
            self.dodaj("P3", x, y, "%s stoi na podłodze tuż przed meblem - pewnie miał stać na blacie (we wzorcach: na blacie %d, "
                                   "na podłodze %d) (%d,%d)" % (kto, na_blacie, na_podl, x, y), waga="uwaga")
        elif not na_podl:
            self.dodaj("P3", x, y, "%s leży na podłodze, a w mapach wzorcowych leży tylko na blatach (%d,%d)" % (kto, x, y))

    # ---------------------------------------------------------------------------------------- O
    def obiekty(self):
        mp, zest, kat = self.mp, self.zest, self.kat
        D = {"N": (0, -1), "S": (0, 1), "W": (-1, 0), "E": (1, 0)}
        import katalog as K
        for y in range(mp.H):
            for x in range(mp.W):
                for z in (2, 3):
                    t = mp.t(z, x, y)
                    if not t: continue
                    for side, n in kat.laczy(t).items():
                        if side not in ("N", "S"): continue          # boki modułowych mebli (półki, stojaki) bywają otwarte
                        if not kat.pewne_polaczenie(t, side): continue
                        dx, dy = D[side]
                        if not mp.inside(x + dx, y + dy): continue
                        nb = [mp.t(zz, x + dx, y + dy) for zz in (2, 3)]
                        if n in nb: continue
                        if any(u and K.styk(zest, t, u, side) >= K.LINK_MIN for u in nb): continue
                        if kat.otwarte_ok(t, side): continue
                        # obok stoi zdarzenie, którego obraz styka się z tą krawędzią? (np. kominek-zdarzenie)
                        if self._zd_styka(x + dx, y + dy): continue
                        co = {"N": "dół bez góry (brak kafla %d nad)", "S": "góra bez dołu (brak kafla %d pod)",
                              "W": "ucięty bok (brak kafla %d z lewej)", "E": "ucięty bok (brak kafla %d z prawej)"}[side] % n
                        self.dodaj("O1", x, y, "obiekt rozcięty: kafel %d (%s %d,%d) - %s w (%d,%d)" % (
                            t, L.arkusz(t), *L.kol_wiersz(t), co, x, y), klucz=(t, side))

    def _zd_styka(self, x, y):
        for e in self.mp.zd:
            if not e.page or not e.widoczne: continue
            bb = e.bbox(self.zest)
            if not bb: continue
            if bb[0] <= x * T + T - 1 and bb[2] >= x * T and bb[1] <= y * T + T - 1 and bb[3] >= y * T:
                return True
        return False

    # ---------------------------------------------------------------------------------------- G
    def gwiazdki(self):
        mp, zest, kat = self.mp, self.zest, self.kat
        for (x, y) in sorted(self.reach):
            for z in (3, 2):
                t = mp.t(z, x, y)
                if not t or zest.pusty(t): continue
                if mp.rl(x, y) == "nad": break          # region 3 (RegionLayers): rysowane nad bohaterem z woli autora
                if zest.gwiazdka(t):
                    if zest.pokrycie(t) < 0.05 or kat.gw_ok(t): continue
                    # szukaj podstawy pod spodem (kafel blokujący albo zdarzenie blokujące)
                    ok = False
                    for k in range(1, 5):
                        yy = y + k
                        if not mp.inside(x, yy): ok = True; break
                        if (x, yy) in mp.ev_block(): ok = True; break
                        tiles = mp.gorne(x, yy)
                        if any(not zest.gwiazdka(u) and zest.przejscie(u) != "O" for u in tiles): ok = True; break
                        if not mp.kratka_wolna(x, yy): ok = True; break
                        if any(zest.gwiazdka(u) for u in tiles): continue
                        break
                    if not ok:
                        self.dodaj("G1", x, y, "kafel %d (%s %d,%d) z gwiazdką nad wolną kratką: bohater wchodzi pod niego w (%d,%d)" % (
                            t, L.arkusz(t), *L.kol_wiersz(t), x, y), klucz=t)
                else:
                    if kat.deptany(t): continue
                    rola = kat.rola(t)
                    o = kat.obiekt(t)
                    if rola in ("gora", "srodek") and zest.pokrycie(t) >= 0.15 and o and o.get("dol_blokuje"):
                        self.dodaj("G2", x, y, "górny kafel %d (%s %d,%d) obiektu bez gwiazdki na wolnej kratce: bohater stanie na nim w (%d,%d)" % (
                            t, L.arkusz(t), *L.kol_wiersz(t), x, y), klucz=t)
                break
        # zdarzenia: obraz wystaje na wolne kratki, wysokie 'pod postacią', 'nad postacią' nad wolną kratką
        for e in mp.zd:
            if not e.page or not e.widoczne or e.postac or e.natura: continue      # drzewa i kamienie zachodzą na sąsiadów celowo
            if not mp.inside(e.x, e.y): continue
            m = e.maska(zest)
            if not m: continue
            a, ox, oy = m
            foot = set(e.komorki())
            przedmiot = item_event(e, zest)
            ys, xs = np.where(a)
            if not len(xs): continue
            cx0, cx1 = (ox + xs.min()) // T, (ox + xs.max()) // T
            cy0, cy1 = (oy + ys.min()) // T, (oy + ys.max()) // T
            key = e.klucz()
            for cy in range(cy0, cy1 + 1):
                for cx in range(cx0, cx1 + 1):
                    if (cx, cy) in foot or not self.wolna(cx, cy): continue
                    # piksele obrazu w dolnej połowie tej kratki
                    x0, y0 = cx * T - ox, cy * T + H_LOW - oy
                    sub = a[max(0, y0):max(0, y0 + T - H_LOW), max(0, x0):max(0, x0 + T)]
                    cov = sub.sum() / float(T * (T - H_LOW))
                    if cov < 0.02: continue
                    korytarz = self._korytarz(cx, cy)
                    if przedmiot: continue                  # małe rzeczy sprawdza P1-P3
                    if cy == e.y:
                        if cov >= 0.20 or (korytarz and cov >= 0.06):
                            kod = "W1" if korytarz else "G3"
                            self.dodaj(kod, cx, cy, "obraz zdarzenia %d '%s' (%s) zajmuje %d%% dołu wolnej kratki (%d,%d)%s" % (
                                e.id, e.name, key, round(cov * 100), cx, cy, ": przejście węższe niż kratka" if korytarz else ""),
                                klucz=e.id)
                    elif cy < e.y and e.prio == 0 and cov >= 0.20:
                        self.dodaj("G4", cx, cy, "zdarzenie %d '%s' (%s) rysowane pod postacią sięga kratki (%d,%d): bohater stanie na nim" % (
                            e.id, e.name, key, cx, cy), klucz=e.id)
            if e.prio == 2 and not self.kat.nad_postacia_ok(key) and not item_event(e, zest) and self.wolna(e.x, e.y):
                x0, y0 = e.x * T - ox, e.y * T + H_LOW - oy
                sub = a[max(0, y0):max(0, y0 + T - H_LOW), max(0, x0):max(0, x0 + T)]
                if sub.sum() / float(T * (T - H_LOW)) >= 0.15:
                    self.dodaj("G5", e.x, e.y, "zdarzenie %d '%s' (%s) 'nad postacią' stoi na wolnej kratce: bohater wejdzie pod nie (%d,%d)" % (
                        e.id, e.name, key, e.x, e.y))

    def _korytarz(self, x, y):
        w = lambda a, b: self.wolna(a, b)
        return (not w(x - 1, y) and not w(x + 1, y)) or (not w(x, y - 1) and not w(x, y + 1))

    # ---------------------------------------------------------------------------------------- D
    def dostep(self):
        mp = self.mp
        # D3: miejsca przybycia
        for (x, y, src) in mp.przybycia():
            if not mp.inside(x, y):
                self.dodaj("D3", max(0, min(x, mp.W - 1)), max(0, min(y, mp.H - 1)), "przeniesienie z %s ląduje poza mapą (%d,%d)" % (src, x, y))
            elif not mp.stoi(x, y):
                ev = mp.ev_block().get((x, y))
                why = "zdarzenie %d '%s'" % (ev[0].id, ev[0].name) if ev else "kafel blokujący"
                self.dodaj("D3", x, y, "przeniesienie z %s ląduje na zablokowanej kratce (%d,%d): %s" % (src, x, y, why))
        # D2: wyjścia
        for e in mp.zd:
            if not e.przenosi or not mp.inside(e.x, e.y): continue
            cells = e.komorki()
            ok = any(c in self.reach for c in cells)
            if not ok:
                for (cx, cy) in cells:
                    for d in (2, 4, 6, 8):
                        dx, dy = L.DIRS[d]
                        if (cx + dx, cy + dy) in self.reach: ok = True
            if not ok and not self.bez_wejsc:
                br = self.za_brama(cells)
                if br is not None:
                    self.dodaj("D2", e.x, e.y, "wyjście %d '%s' za zdarzeniem %d '%s' (może się otwiera)" % (e.id, e.name, br.id, br.name),
                               waga="info")
                else:
                    self.dodaj("D2", e.x, e.y, "wyjście %d '%s' nieosiągalne (nie da się do niego dojść)" % (e.id, e.name))
            elif ok and e.blokuje is False and (e.x, e.y) not in self.reach and mp.inside(e.x, e.y) and e.trigger in (1, 2):
                self.dodaj("D2", e.x, e.y, "wyjście %d '%s' (na dotyk) stoi na kratce, na którą nie da się wejść" % (e.id, e.name))
        # D4: zdarzenia z akcją (zdarzenia-bliźniaki obok siebie z tą samą treścią, np. dwie kratki łóżka, liczą się razem)
        akcje = [e for e in mp.zd if e.page and not e.przenosi and mp.inside(e.x, e.y) and e.trigger == 0 and (e.komendy_strony or e.natura)]
        sig = lambda e: (e.name, json.dumps(e.komendy_strony, sort_keys=True))
        def dostepne(e):
            cells = e.komorki()
            if e.prio == 1:
                return any((cx + dx, cy + dy) in self.reach for (cx, cy) in cells for (dx, dy) in L.DIRS.values()) or \
                    any(self._przez_lade(cx, cy) for (cx, cy) in cells)
            return any(c in self.reach for c in cells) or any(self._przez_lade(cx, cy) for (cx, cy) in cells)
        ok_ev = {e.id: dostepne(e) for e in akcje}
        changed = True
        while changed:
            changed = False
            for e in akcje:
                if ok_ev[e.id]: continue
                for o in akcje:
                    if ok_ev[o.id] and sig(o) == sig(e) and abs(o.x - e.x) + abs(o.y - e.y) == 1:
                        ok_ev[e.id] = True; changed = True; break
        for e in akcje:
            if ok_ev[e.id] or self.bez_wejsc: continue
            gdzie = "na tej samej kratce (priorytet %s)" % ("pod postacią" if e.prio == 0 else "nad postacią") if e.prio != 1 else "z sąsiedniej kratki"
            if e.natura:
                self.dodaj("D4", e.x, e.y, "rzecz do zbierania %d '%s' stoi w nieosiągalnym miejscu (%d,%d)" % (e.id, e.name, e.x, e.y),
                           waga="info")
                continue
            br = self.za_brama(e.komorki())
            if br is not None:
                self.dodaj("D4", e.x, e.y, "zdarzenie %d '%s' z akcją za zdarzeniem %d '%s' (może się otwiera) (%d,%d)" % (
                    e.id, e.name, br.id, br.name, e.x, e.y), waga="info")
                continue
            self.dodaj("D4", e.x, e.y, "zdarzenie %d '%s' z akcją jest nieosiągalne - bohater musi stać %s (%d,%d)" % (e.id, e.name, gdzie, e.x, e.y))
        # D1: kieszenie nieosiągalne
        if self.bez_wejsc:
            return
        drobne = 0
        for comp, brama, pustka in self.kieszenie():
            cs = set(comp)
            akcje = [e for e in mp.zd if e.page and (e.x, e.y) in cs and (e.trigger == 0 and (e.komendy_strony or e.natura))]
            if not mp.wnetrze and len(comp) < 4 and not akcje:
                drobne += 1
                continue
            if not any(self.w_obszarze(*c) for c in comp): continue
            x, y = min(comp, key=lambda c: (c[1], c[0]))
            extra = ", zdarzenia: %s" % ", ".join("%d '%s'" % (e.id, e.name) for e in akcje[:3]) if akcje else ""
            waga = WAGA["D1"]
            orzel = L.tylko_z_orla().get(mp.id, set()) & cs
            if orzel:
                extra += " - miejsce tylko z orła (Okolice_Data.js, celowo nieosiągalne pieszo)"
                waga = "info"
            elif brama is not None:
                extra += " - za zdarzeniem %d '%s' (może się otwiera)" % (brama.id, brama.name)
                waga = "info"
            elif pustka and not akcje:
                extra += " - pusta przestrzeń poza pomieszczeniem (przechodnie kafle tła)"
                waga = "info"
            for c in comp:
                if self.w_obszarze(*c):
                    self.problemy.append({"kod": "D1", "x": c[0], "y": c[1], "waga": waga, "grupa": (x, y),
                                          "opis": "nieosiągalne miejsce: %d kratek od (%d,%d)%s" % (len(comp), x, y, extra), "ukryj": c != (x, y)})
        self.drobne_kieszenie = drobne

    _kiesz = None

    def kieszenie(self):
        """spójne grupy kratek, na których da się stać, ale nie da się dojść: [(kratki, zdarzenie-brama albo None, pustka?)]"""
        if self._kiesz is not None: return self._kiesz
        mp = self.mp
        cand = {(x, y) for y in range(mp.H) for x in range(mp.W) if mp.stoi(x, y)}
        un = cand - self.reach
        out, seen = [], set()
        for c in sorted(un):
            if c in seen: continue
            stack, comp = [c], []
            seen.add(c)
            while stack:
                a = stack.pop(); comp.append(a)
                for (dx, dy) in L.DIRS.values():
                    n = (a[0] + dx, a[1] + dy)
                    if n in un and n not in seen:
                        seen.add(n); stack.append(n)
            brama = None
            for cc in comp:
                for (dx, dy) in L.DIRS.values():
                    n = (cc[0] + dx, cc[1] + dy)
                    for e in mp.ev_block().get(n, []):
                        przy = any((n[0] + ex, n[1] + ey) in self.reach for (ex, ey) in L.DIRS.values())
                        if przy and (len(e.e["pages"]) > 1 or e.drzwi or e.komendy):
                            brama = e; break
                    if brama: break
                if brama: break
            brzeg = any(q[0] in (0, mp.W - 1) or q[1] in (0, mp.H - 1) for q in comp)
            meble = sum(1 for q in comp if mp.t(2, *q) or mp.t(3, *q))
            pustka = mp.wnetrze and brzeg and meble <= len(comp) // 50
            out.append((comp, brama, pustka))
        self._kiesz = out
        return out

    def za_brama(self, cells):
        """zdarzenie-brama, za którą leżą te kratki (albo ich sąsiedzi), albo None"""
        near = set(cells) | {(x + dx, y + dy) for (x, y) in cells for (dx, dy) in L.DIRS.values()}
        for comp, brama, pustka in self.kieszenie():
            if brama is not None and near & set(comp): return brama
        return None

    def _przez_lade(self, x, y):
        """akcja przez ladę (flaga counter): bohater 2 kratki dalej"""
        mp = self.mp
        for d in (2, 4, 6, 8):
            dx, dy = L.DIRS[d]
            mx, my = x + dx, y + dy
            if not mp.inside(mx, my): continue
            if any(mp.zest.lada(t) for t in (mp.t(z, mx, my) for z in (0, 1, 2, 3)) if t):
                if (x + 2 * dx, y + 2 * dy) in self.reach: return True
        return False

    def zasada_plenerowa(self):
        """R1: na mapach natury (zestaw 9) wszystkie obiekty to zdarzenia, kafle B-E tylko płaskie ('O') ozdoby gruntu"""
        mp, zest = self.mp, self.zest
        if mp.tsid not in ZESTAWY_NATURY: return
        for y in range(mp.H):
            for x in range(mp.W):
                for z in (2, 3):
                    t = mp.t(z, x, y)
                    if t and not zest.pusty(t) and zest.przejscie(t) != "O":
                        self.dodaj("R1", x, y, "kafel %d (%s %d,%d) to obiekt z kafli - na mapie plenerowej ma być zdarzeniem (%d,%d)" % (
                            t, L.arkusz(t), *L.kol_wiersz(t), x, y))

    def run(self):
        self.drobne_kieszenie = 0
        self.zasada_plenerowa()
        self.zdarzenia()
        self.przedmioty()
        self.obiekty()
        self.gwiazdki()
        self.dostep()
        order = {"błąd": 0, "uwaga": 1, "info": 2}
        self.problemy.sort(key=lambda p: (order[p["waga"]], p["kod"], p["y"], p["x"]))
        return self.problemy


H_LOW = 24     # dolna połowa kratki: tam stoi bohater


# ================================================================================================ raport

def podsumowanie(probs):
    c = collections.Counter(p["kod"] for p in probs if not p.get("ukryj"))
    return c


def raport_tekst(mp, k, probs, obszar_opis=None):
    lines = []
    lines.append("Map%03d '%s' (%dx%d, zestaw %d)%s" % (mp.id, mp.nazwa, mp.W, mp.H, mp.tsid, " - obszar: " + obszar_opis if obszar_opis else ""))
    lines.append("  wejścia: %d kratek startowych (%s), osiągalnych kratek: %d" % (len(k.starty), k.zrodlo_wejsc, len(k.reach)))
    if k.bez_wejsc: lines.append("  UWAGA: nie znaleziono żadnego wejścia (przeniesienia na tę mapę) - dostępność nie sprawdzona")
    c = podsumowanie(probs)
    if not c:
        lines.append("  brak problemów")
    else:
        lines.append("  razem: " + ", ".join("%s %d" % (kod, n) for kod, n in sorted(c.items())))
    for p in probs:
        if p.get("ukryj"): continue
        lines.append("  [%s] %s %s" % (p["waga"], p["kod"], p["opis"]))
    if getattr(k, "drobne_kieszenie", 0):
        lines.append("  (pominięto %d drobnych zamkniętych kieszeni < 4 kratek bez zdarzeń)" % k.drobne_kieszenie)
    return "\n".join(lines)


def obrazek(mp, probs, out, region=None, dim=None, max_px=None):
    """render z siatką i ramkami problemów; dla dużych map zmniejszony"""
    x0, y0, x1, y1 = region or (0, 0, mp.W - 1, mp.H - 1)
    wpx = (x1 - x0 + 1) * T
    scale = 1.0
    if max_px and wpx > max_px: scale = max_px / float(wpx)
    img = L.render(mp, region=(x0, y0, x1, y1), grid=scale >= 0.6, dim=dim)
    if scale != 1.0:
        img = img.resize((max(1, int(img.width * scale)), max(1, int(img.height * scale))), Image.LANCZOS)
    cs = T * scale
    ov = Image.new("RGBA", img.size, (0, 0, 0, 0))
    od = ImageDraw.Draw(ov)
    for p in probs:
        x, y = p["x"], p["y"]
        if not (x0 <= x <= x1 and y0 <= y <= y1) or p["waga"] == "info": continue
        col = KOLOR[p["kod"][0]]
        px, py = (x - x0) * cs, (y - y0) * cs
        od.rectangle([px + 1, py + 1, px + cs - 2, py + cs - 2], fill=col + (70,))
    img.alpha_composite(ov)
    d = ImageDraw.Draw(img)
    f = L.font(14 if scale >= 0.6 else 11, True)
    labels = collections.defaultdict(list)
    for p in probs:
        x, y = p["x"], p["y"]
        if not (x0 <= x <= x1 and y0 <= y <= y1): continue
        col = KOLOR[p["kod"][0]]
        px, py = (x - x0) * cs, (y - y0) * cs
        if p["waga"] == "info":          # informacje: cienka ramka bez podpisu
            d.rectangle([px + 2, py + 2, px + cs - 3, py + cs - 3], outline=col + (200,), width=1)
            continue
        d.rectangle([px + 1, py + 1, px + cs - 2, py + cs - 2], outline=col + (255,), width=max(1, int(3 * scale + 0.5)))
        if not p.get("ukryj") and p["kod"] not in labels[(x, y)]: labels[(x, y)].append(p["kod"])
    for (x, y), kods in labels.items():
        px, py = (x - x0) * cs, (y - y0) * cs
        lab = " ".join(kods[:3])
        tw = d.textlength(lab, font=f)
        d.rectangle([px + 1, py + 1, px + 5 + tw, py + 3 + f.size], fill=(0, 0, 0, 215))
        d.text((px + 3, py + 1), lab, fill=KOLOR[kods[0][0]] + (255,), font=f)
    # nagłówek z legendą
    c = podsumowanie(probs)
    W = max(img.width, 760)
    ncol = 2 if W >= 900 else 1
    colw = W // ncol
    head = 36 + 20 * ((len(c) + ncol - 1) // ncol)
    full = Image.new("RGBA", (W, img.height + head), (24, 22, 30, 255))
    fd = ImageDraw.Draw(full)
    fd.text((8, 6), "Map%03d %s - kontrola (tools/mapy/kontrola.py)" % (mp.id, mp.nazwa), fill=(255, 214, 90), font=L.font(18, True))
    items = sorted(c.items())
    ninfo = collections.Counter(p["kod"] for p in probs if not p.get("ukryj") and p["waga"] == "info")
    for i, (kod, n) in enumerate(items):
        cx, cy = 8 + (i % ncol) * colw, 34 + (i // ncol) * 20
        fd.rectangle([cx, cy + 3, cx + 12, cy + 15], fill=KOLOR[kod[0]] + (255,))
        lab = "%s %s: %d" % (kod, OPISY[kod], n - ninfo[kod]) if n > ninfo[kod] else "%s %s" % (kod, OPISY[kod])
        if ninfo[kod]: lab += " (+%d info: cienka ramka)" % ninfo[kod]
        fd.text((cx + 18, cy), lab, fill=(225, 225, 232), font=L.font(13))
    if not items:
        fd.text((8, 32), "brak problemów", fill=(150, 230, 150), font=L.font(14))
    full.alpha_composite(img, (0, head))
    os.makedirs(os.path.dirname(out), exist_ok=True)
    rgb = full.convert("RGB")
    if rgb.width * rgb.height > 300_000:
        rgb = rgb.quantize(colors=256, method=Image.MEDIANCUT, dither=Image.NONE)
    rgb.save(out, optimize=True)
    return out


def stan_powiekszenia():
    try:
        return L.load_json(STAN_POWIEKSZ)
    except Exception:
        return {}


def obszar_nowy(mid):
    st = stan_powiekszenia().get(str(mid))
    if not st: return None, None
    ow, oh = st["old"]
    return (lambda x, y: x >= ow or y >= oh), "nowa część (x >= %d albo y >= %d; stara mapa %dx%d)" % (ow, oh, ow, oh)


def bramka(mid, mapa, quiet=False, scisle=True):
    """dla generatorów map: kontrola mapy roboczej (słownik w formacie data/MapNNN.json, bajty albo ścieżka) przed instalacją.
    Zwraca (ok, problemy, tekst): ok = brak problemów z wagą 'błąd' i (scisle=True) brak NOWYCH uwag względem mapy z data/
    (porównanie kod + kratka). Generator nie instaluje mapy, gdy ok jest False."""
    if isinstance(mapa, (bytes, bytearray)): mapa = json.loads(bytes(mapa).decode("utf-8"))
    raw = L.load_json(mapa) if isinstance(mapa, str) else mapa
    mp = L.Mapa(mid, raw=raw)
    k = Kontrola(mp)
    probs = k.run()
    stare = set()
    if os.path.exists(L.DATA + "Map%03d.json" % mid):
        try:
            k0 = Kontrola(L.Mapa(mid))
            stare = {(p["kod"], p["x"], p["y"]) for p in k0.run() if p["waga"] != "info"}
        except Exception:
            stare = set()
    bledy = [p for p in probs if p["waga"] == "błąd" and not p.get("ukryj")]
    nowe = [p for p in probs if p["waga"] == "uwaga" and not p.get("ukryj") and (p["kod"], p["x"], p["y"]) not in stare]
    txt = raport_tekst(mp, k, probs)
    if nowe:
        txt += "\n  NOWE uwagi względem data/: " + "; ".join("%s (%d,%d)" % (p["kod"], p["x"], p["y"]) for p in nowe[:12])
    if bledy:
        txt += "\n  BŁĘDY: " +"; ".join("%s (%d,%d) %s" % (p["kod"], p["x"], p["y"], p["opis"][:80]) for p in bledy[:8])
    if not quiet: print(txt)
    return (not bledy and (not nowe or not scisle)), probs, txt


def kontroluj(mid, nowe=False, obszar=None, obrazek_tak=True, dane=None, out_dir=None, quiet=False):
    mp = L.Mapa(mid, path=(os.path.join(dane, "Map%03d.json" % mid) if dane else None))
    fn, opis = None, None
    dim = None
    region = None
    if nowe:
        fn, opis = obszar_nowy(mid)
    if obszar:
        ax0, ay0, ax1, ay1 = obszar
        fn = lambda x, y: ax0 <= x <= ax1 and ay0 <= y <= ay1
        opis = "prostokąt %d,%d-%d,%d" % obszar
        region = obszar
    k = Kontrola(mp, obszar=fn)
    probs = k.run()
    txt = raport_tekst(mp, k, probs, opis)
    if not quiet: print(txt)
    png = None
    if obrazek_tak:
        if fn and not obszar:
            dim = {(x, y) for y in range(mp.H) for x in range(mp.W) if not fn(x, y)}
        maxpx = None if mp.wnetrze else 1800
        if not probs: maxpx = None if mp.wnetrze else 900            # czysta mapa: wystarczy miniatura
        png = obrazek(mp, probs, os.path.join(out_dir or L.DOCS, "kontrola_Map%03d.png" % mid), region=region, dim=dim,
                      max_px=maxpx)
    return {"mapa": mid, "nazwa": mp.nazwa, "w": mp.W, "h": mp.H, "zestaw": mp.tsid, "obszar": opis, "problemy": probs,
            "licznik": dict(podsumowanie(probs)), "tekst": txt, "png": png, "osiagalne": len(k.reach), "bez_wejsc": k.bez_wejsc,
            "drobne_kieszenie": getattr(k, "drobne_kieszenie", 0)}


# ================================================================================================ przegląd

PRZEGLAD_WNETRZA = list(range(102, 118)) + list(range(121, 129)) + [156, 160, 161, 163, 166, 169] + list(range(171, 178)) + [19]
PRZEGLAD_POWIEKSZONE = [3, 4, 17, 18, 20, 21, 22, 23, 13, 175, 8, 24, 111, 125, 155, 157, 159, 162, 165, 120, 168]
WZORCOWE_DO_PORownania = [1, 25, 26]


def przeglad():
    import przeglad as P
    P.zrob()


def main(argv):
    if hasattr(sys.stdout, "reconfigure"): sys.stdout.reconfigure(encoding="utf-8")
    if "--katalog" in argv: katalog(rebuild=True)
    if "--przeglad" in argv:
        przeglad(); return
    nowe = "--nowe" in argv
    obraz = "--bez-obrazka" not in argv
    obszar, dane = None, None
    ids = []
    i = 0
    while i < len(argv):
        a = argv[i]
        if a == "--obszar":
            obszar = tuple(int(v) for v in argv[i + 1].split(",")); i += 2; continue
        if a == "--dane":
            dane = argv[i + 1]; i += 2; continue
        m = re.match(r"^(?:Map)?0*(\d+)$", a, re.I)
        if m: ids.append(int(m.group(1)))
        i += 1
    if not ids:
        print(__doc__); return
    for mid in ids:
        r = kontroluj(mid, nowe=nowe, obszar=obszar, obrazek_tak=obraz, dane=dane)
        if "--json" in argv:
            out = dict(r); out.pop("tekst", None)
            L.save_json(os.path.join(L.DOCS, "kontrola_Map%03d.json" % mid), out, indent=1)
        if r["png"]: print("  obrazek:", r["png"])
        print()


if __name__ == "__main__":
    main(sys.argv[1:])
