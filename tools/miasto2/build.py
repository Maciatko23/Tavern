# -*- coding: utf-8 -*-
"""NOWE MIASTO (Map008) - budowa nowego układu miasta w kopii roboczej (2026-10-22).

Użycie:  python tools/miasto2/build.py [--seed N] [--bez-obrazkow]
Wynik:   tools/miasto2/staging/Map008.json   (układ edytora: jedna linia na zdarzenie, LF, UTF-8 bez BOM)
         tools/miasto2/budynki.json          (budynki z wnętrzami: drzwi, kratka przed drzwiami, mapa wnętrza, prefabrykat)
         tools/miasto2/mapowanie.json        (bloki: stary prostokąt -> przesunięcie; zdarzenia: id -> stare/nowe x,y;
                                              usunięte; miejsca; nowe prostokąty: plac, cmentarz, pola, szubienica, ogród)
         docs/miasteczko/nowe_miasto*.png    (rendery)

Jak: czyta data/Map008.json (TYLKO odczyt), czyści rzędy 0..102 (miasto w murach + mur południowy ze skarpą), maluje grunt
(trawa, bruk, płyty placu), przenosi bloki starego miasta kafelek w kafelek (warstwy 0-3, cienie, regiony) razem z ich
zdarzeniami (numery zostają), składa mury z kolumn starych murów (lico, korona, baszty), stawia nowe budynki
z prefabrykatów autora tilesetu (tools/town/prefabs), drzwi, latarnie, ławki, stragany, drzewa i „Miejsce: <klucz>”,
maluje regiony RegionLayers (2 na nowych budynkach) i region 31 (lądowanie orła) na placu, przelicza kształty autokafli
na szwach bloków. Teren generowany za murem (rzędy 103..137) zostaje; przecina go droga od bramy południowej.
Niczego nie zapisuje do data/ ani js/.
"""
import os, sys, json, copy, random, math, collections, argparse

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..")).replace("\\", "/") + "/"
sys.path.insert(0, ROOT + "tools/mapy")
sys.path.insert(0, ROOT + "tools/newstart")
import mapylib as L
import nslib as N

W, H = 104, 138
STAGING = os.path.join(HERE, "staging")
DOCS = ROOT + "docs/miasteczko/"
PREFABS = ROOT + "tools/town/prefabs/"

OLD = L.load_json(ROOT + "data/Map008.json")
OD = OLD["data"]
assert OLD["width"] == W and OLD["height"] == H


def oid(z, x, y):
    return OD[(z * H + y) * W + x]


# ------------------------------------------------------------------------------------------------ rodzaje autokafli (A2/A4)
TRAWA, TRAWA_JASNA, ZIEMIA, BRUK, PLYTY, DESKI = 16, 27, 17, 40, 43, 33
PLYTY_STUDNIA = 34          # jaśniejsze, sinawe płyty: kwadrat wokół studni
NAKL_CIEMNA, NAKL_WYSOKA, NAKL_KWIATY, NAKL_PLOT, NAKL_KAMIENIE, NAKL_ZYWOPLOT = 46, 21, 28, 22, 23, 20
NAKL_SCIEZKA = 39
NAKL_JASNA, NAKL_SUCHA = 31, 37         # kępy jaśniejszej i suchszej trawy (jak w terenie generowanym)
DACH_CZERWONY = 56          # A3: czerwony dach (front twierdzy)


def A(kind, shape=0):
    return 2048 + kind * 48 + shape


def kind_of(t):
    return (t - 2048) // 48 if t >= 2048 else None


def Bt(c, r): return N.B(c, r)
def Ct(c, r): return N.C(c, r)
def Dt(c, r): return N.D(c, r)
def Et(c, r): return N.E(c, r)
def A5t(c, r): return N.A5(c, r)


def rect(x0, y0, x1, y1):
    return [(x, y) for y in range(y0, y1 + 1) for x in range(x0, x1 + 1)]


# ------------------------------------------------------------------------------------------------ budowa
class Budowa:
    def __init__(self, seed):
        self.d = list(OD)
        self.tag = [["stary"] * W for _ in range(H)]
        self.res = set()                       # (z, x, y): kształt autokafla do przeliczenia
        self.ev = {}                           # id -> zdarzenie (z nowym x, y)
        self.pool = {}                         # id -> stare zdarzenie z wyczyszczonego obszaru (czeka na blok albo usunięcie)
        self.ev_map = {}                       # id -> {"stare": [x, y], "nowe": [x, y], "blok": nazwa}
        self.bloki = []                        # mapowanie (a)
        self.nowe_ids = []
        self.rnd = random.Random(seed)
        self.ntag = 0
        self.zajete = set()                    # kratki zajęte przez nowe rzeczy (do rozstawiania dekoracji)
        self.uzyte_ids = set()
        for e in OLD["events"]:
            if e:
                self.ev[e["id"]] = copy.deepcopy(e)
        self.stare_ids = set(self.ev)
        self.budynki = []
        self.usuniete_powod = {}
        self.pierzeje = []
        self.rezerwa = []
        self.ponowne = []
        self.miejsca = {}                      # klucz -> (x, y)
        self.strefy = {}

    # ---- kafle
    def g(self, z, x, y):
        if not (0 <= x < W and 0 <= y < H): return 0
        return self.d[(z * H + y) * W + x]

    def s(self, z, x, y, v, tag=None):
        if not (0 <= x < W and 0 <= y < H): return
        self.d[(z * H + y) * W + x] = v
        if tag: self.tag[y][x] = tag

    def nowy_tag(self, prefix):
        self.ntag += 1
        return "%s#%d" % (prefix, self.ntag)

    def wyczysc(self, x0, y0, x1, y1):
        for (x, y) in rect(x0, y0, x1, y1):
            for z in range(6):
                self.s(z, x, y, 0)
            self.tag[y][x] = "pusto"
        for eid, e in list(self.ev.items()):
            if x0 <= e["x"] <= x1 and y0 <= e["y"] <= y1:
                self.pool[eid] = self.ev.pop(eid)

    def maluj(self, z, cells, kind, tag="grunt", warstwy_wyzej=False):
        """autokafel rodzaju kind na warstwie z (kształt przeliczany na końcu); warstwy_wyzej: czyści też z+1..3"""
        for (x, y) in cells:
            if not (0 <= x < W and 0 <= y < H): continue
            self.s(z, x, y, A(kind), tag)
            self.res.add((z, x, y))
            if warstwy_wyzej:
                for zz in range(z + 1, 4): self.s(zz, x, y, 0)

    def zmaz(self, z, cells):
        for (x, y) in cells:
            self.s(z, x, y, 0)
            self.res.discard((z, x, y))

    def kafel(self, z, x, y, t, tag=None):
        self.s(z, x, y, t, tag)
        self.res.discard((z, x, y))

    def region(self, x, y, v):
        self.s(5, x, y, v)

    # ---- bloki starej mapy
    def kopiuj(self, nazwa, ox0, oy0, ox1, oy1, nx, ny, maska=None, zdarzenia=True, tylko=None, pomin=(), warstwy=range(6),
               zapisz=True, tag=None):
        """prostokąt starej mapy (włącznie) kafelek w kafelek na (nx, ny); maska(z, ox, oy) -> False pomija warstwę kratki;
        zdarzenia z prostokąta (z puli wyczyszczonego obszaru) idą razem z nim (tylko=[ids] / pomin=[ids])"""
        dx, dy = nx - ox0, ny - oy0
        tag = tag or self.nowy_tag(nazwa)
        for oy in range(oy0, oy1 + 1):
            for ox in range(ox0, ox1 + 1):
                x, y = ox + dx, oy + dy
                if not (0 <= x < W and 0 <= y < H): continue
                for z in warstwy:
                    if maska and not maska(z, ox, oy): continue
                    self.s(z, x, y, oid(z, ox, oy))
                    self.res.discard((z, x, y))
                self.tag[y][x] = tag
        moved = []
        if zdarzenia:
            for eid in sorted(self.pool):
                e = self.pool[eid]
                if tylko is not None and eid not in tylko: continue
                if eid in pomin: continue
                if tylko is None and not (ox0 <= e["x"] <= ox1 and oy0 <= e["y"] <= oy1): continue
                self.przenies(eid, e["x"] + dx, e["y"] + dy, nazwa)
                moved.append(eid)
        if zapisz:
            self.bloki.append({"blok": nazwa, "stary": [ox0, oy0, ox1, oy1], "dx": dx, "dy": dy,
                               "nowy": [ox0 + dx, oy0 + dy, ox1 + dx, oy1 + dy], "zdarzenia": moved})
        return dx, dy

    def przenies(self, eid, x, y, blok):
        e = self.pool.pop(eid)
        ox, oy = e["x"], e["y"]
        e["x"], e["y"] = x, y
        self.ev[eid] = e
        self.ev_map[eid] = {"nazwa": e["name"], "stare": [ox, oy], "nowe": [x, y], "blok": blok}

    def przesun_zd(self, eid, x, y):
        """przestawia przeniesione albo nowe zdarzenie (mapowanie zostaje aktualne)"""
        self.ev[eid]["x"], self.ev[eid]["y"] = x, y
        if eid in self.ev_map: self.ev_map[eid]["nowe"] = [x, y]

    def kolumna(self, ox, oy0, oy1, nx, ny, tag, warstwy=range(6), maska=None):
        """kolumna starej mapy (szablon muru) bez zdarzeń"""
        for i, oy in enumerate(range(oy0, oy1 + 1)):
            for z in warstwy:
                if maska and not maska(z, ox, oy): continue
                self.s(z, nx, ny + i, oid(z, ox, oy))
                self.res.discard((z, nx, ny + i))
            self.tag[ny + i][nx] = tag

    # ---- zdarzenia
    def wolne_id(self):
        """najpierw numery, których stara mapa nigdy nie miała; potem numery usuniętych ozdób bez notatek i poleceń"""
        for i in range(1, 500):
            if i not in self.stare_ids and i not in self.uzyte_ids and i not in self.ev:
                return i
        for i in range(1, 500):
            if i in self.ev or i in self.uzyte_ids: continue
            e = self.pool.get(i)
            if e is not None and (not e.get("note") or e["note"].startswith("<Occupy")) and                     not any(c["code"] not in (0,) for p in e["pages"] for c in p["list"]):
                return i
        for i in range(1, 500):
            if i in self.ev or i in self.uzyte_ids: continue
            if i in self.pool: return i
        raise RuntimeError("brak wolnych numerów zdarzeń 1-499")

    def zarezerwuj(self):
        """numer na później (np. drzwi domów w pierzejach - numer nigdy wcześniej nieużywany)"""
        eid = self.wolne_id()
        if eid in self.pool:
            self.pool.pop(eid); self.ponowne.append(eid)
        self.uzyte_ids.add(eid)
        self.rezerwa.append(eid)
        return eid

    def dodaj(self, name, x, y, pages, note="", eid=None):
        if eid is not None:
            assert eid in self.rezerwa
            self.rezerwa.remove(eid)
            e = {"id": eid, "name": name, "note": note, "pages": pages, "x": x, "y": y}
            self.ev[eid] = e
            self.nowe_ids.append(eid)
            return eid
        eid = self.wolne_id()
        if eid in self.pool:
            self.pool.pop(eid)          # numer usuniętej ozdoby przechodzi na nowe zdarzenie (zapisane w mapowaniu)
            self.ponowne.append(eid)
        self.uzyte_ids.add(eid)
        e = {"id": eid, "name": name, "note": note, "pages": pages, "x": x, "y": y}
        self.ev[eid] = e
        self.nowe_ids.append(eid)
        return eid

    def obraz(self, name, x, y, char, index=0, direction=2, pattern=0, prio=1, through=False, note="", cmds=None, trigger=0,
              step=False):
        pg = N.blank_page(priority=prio, trigger=trigger, image={"characterName": char, "characterIndex": index,
                          "direction": direction, "pattern": pattern}, through=through, cmds=cmds, step=step, direction_fix=True)
        return self.dodaj(name, x, y, [pg], note)

    def kafel_zd(self, name, x, y, tid, prio=0, through=True, note=""):
        pg = N.blank_page(priority=prio, image={"tileId": tid}, through=through)
        return self.dodaj(name, x, y, [pg], note)

    def miejsce(self, klucz, x, y):
        if klucz in self.miejsca:
            raise RuntimeError("miejsce %s dwa razy" % klucz)
        pg = N.blank_page(priority=0, through=True)
        self.dodaj("Miejsce: " + klucz, x, y, [pg])
        self.miejsca[klucz] = (x, y)
        self.zajete.add((x, y))

    # ---- zapis
    def wynik(self):
        self.przelicz_ksztalty()
        props = {k: v for k, v in OLD.items() if k not in ("data", "events")}
        mx = max(self.ev)
        events = [None] * (mx + 1)
        for eid, e in self.ev.items():
            e = dict(e)
            e["id"] = eid
            events[eid] = {"id": eid, "name": e["name"], "note": e["note"], "pages": e["pages"], "x": e["x"], "y": e["y"]}
        raw = dict(props)
        raw["data"] = self.d
        raw["events"] = events
        return raw

    def przelicz_ksztalty(self):
        """kształty autokafli: kratki malowane + szwy bloków (sąsiad z innego źródła) na warstwach 0-1"""
        todo = set(self.res)
        for y in range(H):
            for x in range(W):
                t0 = self.tag[y][x]
                szew = False
                for dy in (-1, 0, 1):
                    for dx in (-1, 0, 1):
                        nx, ny = x + dx, y + dy
                        if 0 <= nx < W and 0 <= ny < H and self.tag[ny][nx] != t0:
                            szew = True
                if szew:
                    for z in (0, 1):
                        if self.g(z, x, y) >= 2048: todo.add((z, x, y))
        new = {}
        for (z, x, y) in todo:
            t = self.g(z, x, y)
            if t < 2048: continue
            k = kind_of(t)
            if k < 16:          # A1 (woda, wodospady) - nie ruszamy
                continue

            def same(dx, dy, z=z, x=x, y=y, k=k):
                nx, ny = x + dx, y + dy
                if nx < 0 or ny < 0 or nx >= W or ny >= H: return True
                t2 = self.g(z, nx, ny)
                return t2 >= 2048 and kind_of(t2) == k
            shape = N.wall_shape(same) if N.is_wall_kind(k) else N.floor_shape(same)
            new[(z, x, y)] = 2048 + k * 48 + shape
        for (z, x, y), v in new.items():
            self.d[(z * H + y) * W + x] = v


# ================================================================================================ UKŁAD
# Oś miasta: x 51.5 (stara oś 24.5 + 27). Taras: x 27..78, rzędy 0..36 (mur zamku 28..36, schody 51-52).
# Plac: x 30..73, rzędy 37..63, studnia 51-52 x 48-51 na ulicy głównej (rzędy 49..52, bramy 0-1 i 102-103 w rzędach 50-51).
# Mur południowy: rzędy 93..98 (lico), skarpa 99..102, brama 51..53. Za murem teren generowany (103..137).

PRZES_TARAS = (27, 0)        # stare rzędy 0..19 (ogród rycerzy, hala tawerny, ulica przed nią)
PRZES_MUR_ZAMKU = (27, 8)    # stare rzędy 20..28 (mur zamku z wieżami i schodami) + pas pod skałą (29..30)

ULICE = [
    (2, 49, 101, 52),        # ulica główna: brama zachodnia - plac - brama wschodnia
    (25, 5, 26, 88),         # aleja zachodnia (wzdłuż muru tarasu)
    (79, 5, 80, 52),         # aleja wschodnia
    (2, 34, 26, 36),         # przecznica górna zachodnia
    (79, 34, 101, 36),       # przecznica górna wschodnia
    (2, 75, 101, 77),        # przecznica dolna
    (50, 64, 53, 88),        # ulica południowa (do bramy)
    (2, 64, 29, 65),         # zaułek pod kuźnią
    (74, 64, 101, 65),       # zaułek pod domami 4 i 5
    (25, 37, 26, 48),        # zachodni brzeg placu (aleja)
    (27, 37, 29, 38),        # wejście z alei pod skarpę
    (81, 17, 101, 18),       # uliczka pod stawem
]
PLAC = (30, 37, 73, 63)


def uklad_grunt(b):
    b.maluj(0, rect(2, 2, 101, 91), TRAWA)
    for r in ULICE:
        b.maluj(0, rect(*r), BRUK)
    x0, y0, x1, y1 = PLAC
    b.maluj(0, rect(x0, y0, x1, y1), PLYTY)
    b.maluj(0, rect(29, 20, 76, 27), BRUK)          # dziedziniec tawerny


def uklad_bloki(b):
    tx, ty = PRZES_TARAS
    # 1. taras: ogród rycerzy + hala tawerny + ulica przed nią (+ mury boczne tarasu z dawnych murów miejskich), bez stawu
    b.kopiuj("taras_tawerna", 0, 0, 51, 19, tx, ty, maska=lambda z, ox, oy: not (38 <= ox <= 49 and oy <= 16))
    # 2. mur zamku z wieżami i schodami (stare rzędy 20..28) -> rzędy 28..36
    mx, my = PRZES_MUR_ZAMKU
    b.kopiuj("mur_zamku", 2, 20, 49, 28, 2 + mx, 20 + my, maska=lambda z, ox, oy: not (z >= 2 and oy == 28 and ox in (30, 31)))
    # 3. pas pod skałą: dom mieszczan, izba pod skałą, drewutnia, beczki, stragan w paski (stare 2..23 x 29..30)
    #    (kratki 2..6 rzędu 30 na warstwie 2: szczyt piekarni - zostaje przy piekarni)
    b.kopiuj("pod_skala", 2, 29, 23, 30, 2 + mx, 29 + my,
             maska=lambda z, ox, oy: not (oy == 30 and 2 <= ox <= 6 and z == 2))
    for (x, y) in rect(47, 37, 50, 38):                # dawny stragan w paski: płyty placu bez starych krawędzi
        if b.g(0, x, y) >= 2048: b.res.add((0, x, y))
    for (x, y) in rect(29, 37, 50, 38):                # nakładka starego rynku (k46) - na nowym placu jej nie ma
        if kind_of(b.g(1, x, y)) == NAKL_CIEMNA: b.s(1, x, y, 0)
    # 4. wieże narożne tarasu (kolumny wieży bramnej zamku, stare 21..22 x 20..28)
    for side, x0 in (("W", 27), ("E", 77)):
        t = b.nowy_tag("wieza_naroznik_" + side)
        for i, ox in enumerate((21, 22)):
            b.kolumna(ox, 20, 28, x0 + i, 28, t)
    for x in (27, 28, 77, 78):                      # mur boczny tarasu wchodzi pod koronę wieży narożnej
        b.s(0, x, 28, A(97)); b.res.add((0, x, 28)); b.region(x, 28, 2)
    for i, r in enumerate((13, 14, 15)):           # końce skarpy przy wieżach narożnych
        b.kafel(0, 27, 34 + i, A5t(0, r))
        b.kafel(0, 78, 34 + i, A5t(2, r))
    # mury boczne tarasu w rzędach 20..27 (wzór: stary rząd 19 murów miejskich)
    for side, x0, oxs in (("W", 27, (0, 1)), ("E", 77, (50, 51))):
        t = b.nowy_tag("mur_tarasu_" + side)
        for y in range(20, 28):
            for i, ox in enumerate(oxs):
                b.kolumna(ox, 19, 19, x0 + i, y, t)
    # 5. staw (suchy) z urwiskiem -> północno-wschodni róg (przy murze wschodnim, jak dotąd)
    b.kopiuj("staw", 38, 5, 49, 16, 90, 5,          # skarpy przycięte: mur północny nad stawem ciągły
             maska=lambda z, ox, oy: not (oy <= 8 and z >= 2))
    # 6. studnia miejska -> środek placu
    b.kopiuj("studnia", 23, 31, 26, 36, 50, 47, maska=lambda z, ox, oy: z >= 2 or (24 <= ox <= 25 and 32 <= oy <= 35))
    # 7. donice z drzewami (wschodni brzeg dawnego rynku) -> wschodni brzeg placu
    b.kopiuj("donice", 31, 29, 36, 40, 73, 37, maska=lambda z, ox, oy: not (oy == 29 and ((ox == 30 and z == 3) or (ox == 31 and z == 2))))
    # 8. ratusz z kancelarią (bez dzwonnicy) -> na wschód od placu, front na ulicę główną
    b.kopiuj("ratusz", 37, 29, 49, 40, 81, 37, maska=lambda z, ox, oy: not (47 <= ox <= 49 and 29 <= oy <= 31),
             pomin=[126, 236])
    # 9. dzwonnica (podest + obraz wieży 126 + drzwi 236) -> nad ratuszem, przy przecznicy górnej
    b.kopiuj("dzwonnica", 47, 29, 49, 31, 85, 30, tylko=[126, 236])
    # 10. kantor (z obramowaniem i markizami) -> zachód placu, front na ulicę główną
    b.kopiuj("kantor", 9, 31, 20, 40, 13, 39)
    # 11. piekarnia (szczyt, markiza z chlebem, latarnia) -> pod placem, front na przecznicę dolną
    b.kopiuj("piekarnia", 2, 30, 8, 40, 34, 64, maska=lambda z, ox, oy: not (oy == 30 and z == 3))
    # 12. kuźnia z kowalem -> przy bramie zachodniej, pod ulicą główną
    b.kopiuj("kuznia", 2, 42, 13, 49, 3, 56)
    # 13. dom woziwody -> pod placem (wschód), front na przecznicę dolną
    b.kopiuj("dom_woziwody", 27, 41, 32, 46, 57, 68)
    # 14. dom garbarza z suszarnią skór -> południowy zachód (garbarnia)
    b.kopiuj("dom_garbarza", 33, 41, 43, 49, 2, 80)
    # 15. szopa garbarni (skóry pod dachem) -> obok domu garbarza
    b.kopiuj("garbarnia", 14, 41, 23, 48, 13, 81)
    # 16. dawny budynek przy bramie wschodniej (ciemny dach, wiata) -> wozownia przy stajni
    b.kopiuj("wozownia", 44, 41, 48, 49, 64, 80, pomin=[160, 225, 226, 227, 228, 229])
    # 17. stragan czerwony (zdarzenie 101 + regiony nóg) -> na plac
    b.kopiuj("stragan_czerwony", 27, 29, 30, 30, 32, 43, maska=lambda z, ox, oy: z in (2, 3, 4, 5), tylko=[101])
    # 18. brama zachodnia zostaje na miejscu (zdarzenia 237-240, 243, 244)
    b.kopiuj("brama_zachodnia", 0, 46, 2, 53, 0, 46, maska=lambda z, ox, oy: ox <= 1 or z >= 2,
             tylko=[237, 238, 239, 240, 243, 244])
    # 19. brama wschodnia: kosze żarowe, drogowskaz, latarnia (stare x 47..49) -> x 99..101
    b.kopiuj("brama_wschodnia", 47, 46, 49, 54, 99, 46, maska=lambda z, ox, oy: ox == 49,
             tylko=[160, 225, 226, 227, 228, 229])


BEZ_63 = lambda z, ox, oy: not (oy >= 61 and z >= 2)      # roślinność na skarpie (stopa w terenie generowanym)


def uklad_mury(b):
    # --- mury zachodni (x 0..1) i wschodni (x 102..103): stare rzędy 0..51 (wieże, bramy), dalej wieże co 13 rzędów
    b.kopiuj("mur_W", 0, 0, 1, 51, 0, 0, zdarzenia=False)
    b.kopiuj("mur_E", 50, 0, 51, 51, 102, 0, tylko=[223, 224])
    for eid in (221, 222):                       # przejścia na Posiadłość Lorda: te same kratki (103, 50-51)
        e = b.pool[eid]
        b.przenies(eid, e["x"], e["y"], "brama_wschodnia (bez zmian)")
    for (x0, oxs, plain) in ((0, (0, 1), 8), (102, (50, 51), 17)):
        y = 52
        while y <= 90:
            wieza = y in (52, 65, 78)
            t = b.nowy_tag("mur_bok_%d_%d" % (x0, y))
            for i, ox in enumerate(oxs):
                if wieza: b.kolumna(ox, 43, 49, x0 + i, y, t)
                else: b.kolumna(ox, plain, plain, x0 + i, y, t)
            y += 7 if wieza else 1
        t = b.nowy_tag("naroznik_%d" % x0)          # narożnik (stare rzędy 52..63) -> 91..102
        for i, ox in enumerate(oxs):
            b.kolumna(ox, 52, 63, x0 + i, 91, t, maska=BEZ_63)
        for y in range(52, 99):                      # kolumny muru na brzegu mapy: zawsze zablokowane (Krawedzie otwiera cały brzeg)
            for i in (0, 1):
                b.region(x0 + i, y, 2)
    # --- mur południowy: środek ze starą bramą (stare x 2..49, rzędy 50..63) -> x 29..76, rzędy 89..102
    b.kopiuj("mur_S", 2, 50, 49, 63, 29, 89, tylko=[120, 125, 143, 144], maska=BEZ_63)
    for x in range(29, 39):                          # dawne podwórze kuźni -> zwykła ulica (baszta 37-38 zostaje)
        t = b.nowy_tag("ulica_S")
        b.kolumna(45, 50, 52 if x >= 37 else 53, x, 89, t)
    for x0, x1, wieze in ((2, 28, (12, 24)), (77, 101, (79, 91))):
        x = x0
        while x <= x1:
            t = b.nowy_tag("mur_S_%d" % x)
            if x in wieze:
                b.kolumna(10, 50, 63, x, 89, t, maska=BEZ_63); b.kolumna(11, 50, 63, x + 1, 89, t, maska=BEZ_63)
                x += 2
            else:
                b.kolumna(45, 50, 63, x, 89, t, maska=BEZ_63)
                x += 1
    # --- mur północny (rzędy 0..4: chodnik z blankami, korona, lico) i baszty
    for (x0, x1, wieze) in ((2, 26, (13,)), (65, 76, ()), (79, 101, (91,))):
        x = x0
        while x <= x1:
            t = b.nowy_tag("mur_N_%d" % x)
            if x in wieze:
                for i in (0, 1):
                    b.kolumna(3, 0, 4, x + i, 0, t, maska=lambda z, ox, oy: not (z == 3 and oy == 4))
                    for r in range(6):
                        b.kafel(3, x + i, r, Bt(13 + i, 1 + r))
                        b.region(x + i, r, 2)
                    b.kafel(2, x + i, 5, Bt(13 + i, 7))
                x += 2
            else:
                b.kolumna(3, 0, 4, x, 0, t, maska=lambda z, ox, oy: not (z == 3 and oy == 4))
                x += 1


# ================================================================================================ NOWE BUDYNKI
_PF = {}


def pf_wczytaj(key):
    if key not in _PF:
        _PF[key] = L.load_json(PREFABS + key + ".json")
    return _PF[key]


def prefab(b, key, x, y, wiersze=None, kolumny=None, bez_ev=(), tag=None, zdarzenia=True):
    """prefabrykat autora kafelek w kafelek (warstwy 0-3 bez gruntu A1/A2, cienie) + jego zdarzenia (nowe numery);
    wiersze: lista wierszy prefabrykatu do postawienia (od góry), kolumny: lista kolumn prefabrykatu (mapa kolumn)"""
    pf = pf_wczytaj(key)
    rows = list(wiersze) if wiersze is not None else list(range(pf["h"]))
    cols = list(kolumny) if kolumny is not None else list(range(pf["w"]))
    tag = tag or b.nowy_tag(key)
    for j, pr in enumerate(rows):
        for i, pc in enumerate(cols):
            for z in range(4):
                t = pf["layers"][z][pr][pc]
                if not t: continue
                if z < 2 and 2048 <= t < 4352: continue
                b.kafel(z, x + i, y + j, t, tag)
            v = pf["layers"][4][pr][pc]
            if v: b.s(4, x + i, y + j, v)
            b.tag[y + j][x + i] = tag
    ids = []
    if zdarzenia:
        for k, ev in enumerate(pf["events"]):
            if k in bez_ev or ev["y"] not in rows or ev["x"] not in cols: continue
            nx, ny = x + cols.index(ev["x"]), y + rows.index(ev["y"])
            ids.append(b.dodaj(ev["name"] if not ev["name"].startswith("EV") else "Ozdoba", nx, ny, copy.deepcopy(ev["pages"]),
                               ev.get("note", "")))
    return ids


def pf_ev_index(key, warunek):
    return [k for k, ev in enumerate(pf_wczytaj(key)["events"]) if warunek(ev)]


def pf_drzwi(key):
    """indeksy zdarzeń-drzwi prefabrykatu (stawiamy własne)"""
    return pf_ev_index(key, lambda ev: "door" in ev["pages"][0]["image"]["characterName"].lower())


def wyczysc_gore(b, x, y0, y1, warstwy=(2, 3)):
    for y in range(y0, y1 + 1):
        for z in warstwy:
            b.s(z, x, y, 0)


_GODZINY = None


def strona_drzwi(mapa, tx, ty, kier, zawsze, obraz):
    """strona drzwi jak ev 121 (6-21, poza godzinami popup „Zamknięte.”) albo jak ev 22 (zawsze otwarte)"""
    wzor = OLD["events"][22 if zawsze else 121]
    pg = copy.deepcopy(wzor["pages"][0])
    for c in pg["list"]:
        if c["code"] == 201:
            c["parameters"] = [0, mapa, tx, ty, kier, 0]
    pg["image"] = {"tileId": 0, "characterName": obraz[0], "direction": 2, "pattern": obraz[2], "characterIndex": obraz[1]}
    pg["priorityType"], pg["trigger"], pg["through"], pg["directionFix"] = 1, 1, False, True
    pg["stepAnime"], pg["walkAnime"] = False, False
    return pg


def drzwi(b, budynek, nazwa, klucz, x, y, mapa, obraz=("!Fantasy_door1", 1, 1), zawsze=False, prefab_key="", prost=None, eid=None):
    """nowe drzwi: „Drzwi: <nazwa>” z <Town:door=klucz>; przeniesienie do wnętrza = miejsce zastępcze (mapa, 1, 1) -
    koordynator łączy je z wnętrzem"""
    nazwa_zd = nazwa.split(" (")[0] if klucz.startswith("dom1") and len(klucz) == 5 else nazwa
    eid = b.dodaj("Drzwi: " + nazwa_zd, x, y, [strona_drzwi(mapa, 1, 1, 8, zawsze, obraz)], "<Town:door=%s>" % klucz, eid=eid)
    b.budynki.append({"klucz": klucz, "nazwa": nazwa, "prostokat": list(prost) if prost else None, "drzwi_id": eid,
                      "drzwi": [x, y], "przed_drzwiami": [x, y + 1], "wnetrze": mapa, "wnetrze_xy": [1, 1],
                      "prefabrykat": prefab_key, "nowy": True, "zawsze_otwarte": zawsze})
    b.zajete.add((x, y + 1))
    return eid


def regiony_budynku(b, x0, y0, x1, y1, wolne=()):
    """reguły tools/town/paint_layers.py na prostokącie nowego budynku: a) A3/A4 na warstwie 0 -> region 2,
    b) pas gwiazdek pod dachem A3 nad ścianą, c) stopa fasady z obrazkami pod a/b. wolne: kratki przed drzwiami"""
    fl = L.zestaw(11).flags
    st = lambda t: t >= 4352
    roof = lambda t: 4352 <= t < 5888 and ((t - 4352) // 48) % 16 < 8
    star = lambda x, y: any(b.g(z, x, y) and fl[b.g(z, x, y)] & 0x10 for z in range(4))
    pics = lambda x, y: [b.g(z, x, y) for z in (2, 3) if 0 < b.g(z, x, y) < 1536 and not fl[b.g(z, x, y)] & 0x10]
    paint = {}
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            if st(b.g(0, x, y)): paint[(x, y)] = "a"
    for x in range(x0, x1 + 1):
        for y in range(y0 + 1, y1 + 1):
            if not roof(b.g(0, x, y - 1)) or st(b.g(0, x, y)): continue
            run, yy = [], y
            while yy <= y1 and not st(b.g(0, x, yy)) and len(run) <= 2:
                run.append(yy); yy += 1
            if 0 < len(run) <= 2 and yy <= y1 and st(b.g(0, x, yy)) and all(star(x, r) for r in run):
                for r in run: paint[(x, r)] = "b"
    for (x, y), r in list(paint.items()):
        if y + 1 <= y1 + 1 and (x, y + 1) not in paint and pics(x, y + 1): paint[(x, y + 1)] = "c"
    for c in wolne: paint.pop(c, None)
    for (x, y) in paint:
        if b.g(5, x, y) == 0: b.region(x, y, 2)
    return paint


KAPLICA = (3, 5)                 # lewy górny róg kaplicy (11 x 13)
CMENTARZ = (5, 23, 8, 6)         # prostokąt dla Zakon_Data CEMETERY (x, y, w, h): mur i groby stawia wtyczka


def nowe_budynki(b):
    # --- KAPLICA: dach A3 (czerwony, 4 rzędy) + front twierdzy autora poszerzony do 11 kolumn (okna gotyckie), brama katedralna
    kx, ky = KAPLICA
    kol = [0, 1, 2, 1, 2, 3, 4, 5, 4, 5, 6]
    b.maluj(0, rect(kx, ky, kx + 10, ky + 3), DACH_CZERWONY, tag="kaplica")
    for (x, y) in rect(kx, ky, kx + 10, ky + 3): b.tag[y][x] = "kaplica"
    prefab(b, "twierdza_front", kx, ky + 4, wiersze=range(1, 9), kolumny=kol, tag="kaplica", zdarzenia=False)
    for (x, y) in rect(kx, ky, kx + 10, ky + 11):
        for z in (1,): b.s(z, x, y, 0)
    pf = pf_wczytaj("twierdza_front")
    pomnik = pf["events"][3]["pages"]
    b.dodaj("Posąg przed kaplicą", kx + 2, ky + 12, copy.deepcopy(pomnik))
    b.dodaj("Posąg przed kaplicą", kx + 8, ky + 12, copy.deepcopy(pomnik))
    drzwi(b, "kaplica", "Kaplica", "kaplica", kx + 5, ky + 11, 178, obraz=("!$Gate_Cathedral1", 0, 0), prefab_key="twierdza_front (poszerzony) + dach A3 k56",
          prost=(kx, ky, kx + 10, ky + 12))
    # wieża z dzwonkiem obok kaplicy (Town_Props: gotycka wieża)
    b.obraz("Wieża kaplicy", kx + 12, ky + 11, "!Town_Props", 2, 8, 1, prio=1)
    regiony_budynku(b, kx, ky, kx + 10, ky + 11, wolne=[(kx + 5, ky + 12)])
    for (x, y) in rect(kx + 11, ky + 9, kx + 13, ky + 11): b.region(x, y, 2)

    # --- DOM GRABARZA: chata kryta strzechą (szyld z łukiem zdjęty)
    gx, gy = 17, 9
    prefab(b, "chata_strzecha", gx, gy, bez_ev=pf_drzwi("chata_strzecha") + [1])
    wyczysc_gore(b, gx + 5, gy + 3, gy + 3)            # góra wózka bez dołu (prefabrykat ucięty na 4 rzędach)
    drzwi(b, "dom_grabarza", "Dom grabarza", "dom_grabarza", gx + 3, gy + 3, 179, obraz=("!Fantasy_door1", 3, 1), prefab_key="chata_strzecha",
          prost=(gx, gy, gx + 5, gy + 3))
    regiony_budynku(b, gx, gy, gx + 5, gy + 3, wolne=[(gx + 3, gy + 4)])

    # --- DOM 1 (Agata): dom z czarnym dachem i lukarnami; drzwi w lewej kolumnie (okno zdjęte)
    for key, nazwa, mapa, x, y, kd, kolor in (("dom1", "Dom Agaty", 182, 84, 6, 1, 2), ("dom7", "Dom staruszków", 188, 40, 81, 2, 4)):
        prefab(b, "dom_lukarny_czarny", x, y)
        wyczysc_gore(b, x + kd, y + 5, y + 6)
        drzwi(b, key, nazwa, key, x + kd, y + 6, mapa, obraz=("!Fantasy_door1", kolor, 1), prefab_key="dom_lukarny_czarny",
              prost=(x, y, x + 3, y + 6))
        regiony_budynku(b, x, y, x + 3, y + 6, wolne=[(x + kd, y + 7)])

    # --- DOM 2: dwie kamienice szachulcowe (jedne drzwi otwarte)
    x, y = 92, 20
    prefab(b, "kamienice_szachulec", x, y, bez_ev=pf_drzwi("kamienice_szachulec"))
    for r in range(2, 7): b.region(x + 7, y + r, 2)     # okap prawego skrzydła nad wolną kratką
    drzwi(b, "dom2", "Kamienica", "dom2", x + 4, y + 8, 183, obraz=("!Fantasy_door1", 5, 1), prefab_key="kamienice_szachulec",
          prost=(x, y, x + 7, y + 9))
    regiony_budynku(b, x, y, x + 7, y + 8, wolne=[(x + 4, y + 9)])

    # --- DOM 3 (szwaczka): dom z lukarnami; szyld nożyczek zamiast mikstur
    x, y = 3, 40
    ids = prefab(b, "dom_lukarny_mikstury", x, y, bez_ev=pf_drzwi("dom_lukarny_mikstury"))
    b.s(2, x, y + 8, 0); b.s(3, x + 1, y + 8, 0)         # donice bez dołu (prefabrykat kończy się na 9 rzędach)
    for eid in ids:
        if b.ev[eid]["pages"][0]["image"]["characterName"] == "!Signs":
            pg = b.ev[eid]["pages"][0]
            pg["image"].update({"characterIndex": 0, "direction": 4, "pattern": 0})
            b.ev[eid]["name"] = "Szyld: Szwaczka"
    drzwi(b, "dom3", "Dom szwaczki", "dom3", x + 4, y + 8, 184, obraz=("!Fantasy_door1", 2, 1), prefab_key="dom_lukarny_mikstury",
          prost=(x, y, x + 6, y + 8))
    regiony_budynku(b, x, y, x + 6, y + 8, wolne=[(x + 4, y + 9)])

    # --- STRAŻNICA LORDA: kamienny dom z chorągwią (czerwona z koniem) i kratą
    x, y = 95, 42
    ids = prefab(b, "kamienica_choragiew", x, y, bez_ev=pf_drzwi("kamienica_choragiew"))
    wyczysc_gore(b, x, y, y + 5)                         # lewa kolumna to otoczenie z mapy autora (drzewo)
    for eid in ids:
        im = b.ev[eid]["pages"][0]["image"]
        if im["characterName"] == "!Flags_banner":
            im.update({"characterIndex": 0, "direction": 4, "pattern": 1})
            b.ev[eid]["name"] = "Chorągiew na strażnicy"
    drzwi(b, "straznica", "Strażnica Lorda", "straznica", x + 3, y + 5, 180, obraz=("!Fantasy_door2", 6, 1), zawsze=True,
          prefab_key="kamienica_choragiew", prost=(x, y, x + 5, y + 5))
    regiony_budynku(b, x, y, x + 5, y + 5, wolne=[(x + 3, y + 6)])

    # --- DOM 4 (wdowa z dziećmi): karczma szachulcowa bez szyldu z kuflem
    x, y = 81, 54
    bez = pf_drzwi("karczma_szachulcowa") + pf_ev_index("karczma_szachulcowa", lambda ev: ev["pages"][0]["image"]["characterName"] == "!Signs")
    prefab(b, "karczma_szachulcowa", x, y, bez_ev=bez)
    for (cx, cy) in rect(x + 6, y + 8, x + 7, y + 9): b.region(cx, cy, 2)     # przybudówka z daszkiem
    drzwi(b, "dom4", "Dom Haliny", "dom4", x + 3, y + 9, 185, obraz=("!Fantasy_door1", 1, 1), prefab_key="karczma_szachulcowa",
          prost=(x, y, x + 7, y + 9))
    regiony_budynku(b, x, y, x + 7, y + 9, wolne=[(x + 3, y + 10)])

    # --- DOM 5 (stary dom kupca): chata z bali z przybudówką (jedne drzwi)
    x, y = 92, 56
    prefab(b, "chata_z_bali", x, y, kolumny=range(0, 7), bez_ev=pf_drzwi("chata_z_bali"))
    drzwi(b, "dom5", "Stary dom kupca", "dom5", x + 3, y + 6, 186, obraz=("!Fantasy_door1", 2, 1), prefab_key="chata_z_bali",
          prost=(x, y, x + 7, y + 7))
    regiony_budynku(b, x, y, x + 7, y + 6, wolne=[(x + 3, y + 7)])

    # --- DOM 6 (cieśla): dom z pomarańczowym szczytem; zamiast kuźni warsztat ciesielski (drewno, kozioł)
    x, y = 29, 78
    bez = pf_ev_index("dom_szczyt_kuznia", lambda ev: True)
    prefab(b, "dom_szczyt_kuznia", x, y, bez_ev=bez)
    for r in range(11): b.s(4, x, y + r, 0)              # cień sąsiada z mapy autora
    for c in (1, 2, 3):                       # palenisko -> sągi drewna
        b.s(3, x + c, y + 9, 0); b.s(2, x + c, y + 9, 0); b.s(3, x + c, y + 10, 0); b.s(2, x + c, y + 10, 0)
    for i, c in enumerate((1, 2, 3)):
        b.kafel(3, x + c, y + 9, Ct(8 + i, 4)); b.kafel(3, x + c, y + 10, Ct(8 + i, 5))
    wyczysc_gore(b, x + 4, y + 8, y + 10)
    drzwi(b, "dom6", "Dom cieśli", "dom6", x + 4, y + 8, 187, obraz=("!Fantasy_door2", 1, 1), prefab_key="dom_szczyt_kuznia (bez kuźni)",
          prost=(x, y, x + 5, y + 10))
    regiony_budynku(b, x, y, x + 5, y + 8, wolne=[(x + 4, y + 9)])
    for c in (1, 2, 3): b.region(x + c, y + 10, 2)

    # --- STAJNIA Z WOZOWNIĄ: stodoła ze szczytem i drewutnią + dawna wiata (wozownia) + wóz z sianem, płot, koryto
    x, y = 57, 79
    prefab(b, "spichlerz_drewutnia", x, y)
    wyczysc_gore(b, x + 4, y + 8, y + 9)
    drzwi(b, "stajnia", "Stajnia", "stajnia", x + 4, y + 8, 181, obraz=("!Fantasy_door2", 5, 1), zawsze=True,
          prefab_key="spichlerz_drewutnia + wozownia (stary budynek przy bramie wschodniej) + woz_siano", prost=(57, 79, 74, 89))
    b.obraz("Szyld: Stajnia", x + 5, y + 7, "!Signs", 0, 4, 1, prio=1)
    regiony_budynku(b, x, y, x + 5, y + 8, wolne=[(x + 4, y + 9)])
    prefab(b, "woz_siano", 70, 84)

    # --- DOM 8 (weteran): dom z wagą bez szyldu wagi (kamień i czarny dach)
    x, y = 82, 84
    bez = pf_drzwi("kantor_waga") + pf_ev_index("kantor_waga", lambda ev: ev["pages"][0]["image"]["characterName"] == "!Signs")
    prefab(b, "kantor_waga", x, y, bez_ev=bez)
    drzwi(b, "dom8", "Dom weterana", "dom8", x + 2, y + 4, 189, obraz=("!Fantasy_door2", 1, 1), prefab_key="kantor_waga",
          prost=(x, y, x + 5, y + 4))
    regiony_budynku(b, x, y, x + 5, y + 4, wolne=[(x + 2, y + 5)])

    # --- DOM 9 (izba do wynajęcia): chata kryta strzechą z drewutnią z boku
    x, y = 92, 85
    prefab(b, "chata_strzecha", x, y, bez_ev=pf_drzwi("chata_strzecha") + [1])
    wyczysc_gore(b, x + 5, y + 3, y + 3)
    drzwi(b, "dom9", "Izba do wynajęcia", "dom9", x + 3, y + 3, 190, obraz=("!Fantasy_door1", 3, 1), prefab_key="chata_strzecha + drewutnia",
          prost=(x, y, x + 8, y + 3))
    for i in range(3):
        b.kafel(2, x + 6 + i, y + 2, Ct(13 + i, 5)); b.kafel(2, x + 6 + i, y + 3, Ct(13 + i, 6))
    regiony_budynku(b, x, y, x + 5, y + 3, wolne=[(x + 3, y + 4)])


# ================================================================================================ DEKORACJE
def zd_na(b):
    d = collections.defaultdict(list)
    for eid, e in b.ev.items():
        d[(e["x"], e["y"])].append(eid)
    return d


def wolne(b, x, y, zd=None, grunt=True):
    """kratka na nową rzecz: w murach, bez regionu 2, bez kafli na warstwach 2-3, bez zdarzenia, nie przed drzwiami"""
    if not (2 <= x <= 101 and 2 <= y <= 91): return False
    if b.g(5, x, y) == 2 or b.g(2, x, y) or b.g(3, x, y): return False
    if (x, y) in b.zajete: return False
    if zd is not None and (x, y) in zd: return False
    t0 = b.g(0, x, y)
    if t0 >= 4352 or 1536 <= t0 < 2048: return False
    if grunt and not b.tag[y][x].startswith("grunt"): return False
    return True


def lampa(b, x, y):
    e = OLD["events"][130]
    return b.dodaj("Latarnia", x, y, copy.deepcopy(e["pages"]), e["note"])


DRZEWA = {"okragle": ("!$Big_Trees_green", 0, 4, 2), "sosna": ("!$Big_Trees_green", 0, 2, 2), "krzew": ("!$Big_Trees_green", 0, 4, 0),
          "male": ("!$Tree_Small", 0, 2, 0)}


def drzewo(b, x, y, rodzaj="okragle"):
    ch, i, d, p = DRZEWA[rodzaj]
    return b.obraz("Drzewo (ozdobne)", x, y, ch, i, d, p, prio=1)


def rzecz(b, nazwa, x, y, ch, i, d, p, prio=1, occ=None, through=False):
    note = ""
    if occ:
        note = "<Occupy:%s>" % ",".join("%s=%d" % kv for kv in occ.items() if kv[1])
    return b.obraz(nazwa, x, y, ch, i, d, p, prio=prio, note=note, through=through)


def stragan(b, x, y, wariant):
    """stragan z Town_Props (obraz 3 kratki): zdarzenie na środku dolnego rzędu, nogi po bokach - region 2"""
    d, p = {"paski": (4, 2), "czerwony": (6, 0), "sukno": (6, 1), "garnki": (6, 2)}[wariant]
    eid = b.obraz("Stragan", x, y, "!Town_Props", 2, d, p, prio=1)
    for dx in (-1, 1): b.region(x + dx, y, 2)
    for (cx, cy) in rect(x - 1, y - 2, x + 1, y): b.zajete.add((cx, cy))
    return eid


def lawka(b, x, y):
    """ławka z arkusza C (2 kratki, blokuje)"""
    b.kafel(2, x, y, Ct(10, 0)); b.kafel(2, x + 1, y, Ct(11, 0))
    b.kafel(2, x, y + 1, Ct(10, 1)); b.kafel(2, x + 1, y + 1, Ct(11, 1))
    b.zajete.update({(x, y), (x + 1, y), (x, y + 1), (x + 1, y + 1)})


def beczki(b, x, y, rodzaj=0):
    """beczka C(3..4,8..9): góra z gwiazdką rząd wyżej"""
    c = 3 + rodzaj % 2
    b.kafel(3, x, y - 1, Ct(c, 8)); b.kafel(2, x, y, Ct(c, 9))
    b.zajete.update({(x, y), (x, y - 1)})


def skrzynia(b, x, y):
    b.kafel(3, x, y - 1, Ct(5, 4)); b.kafel(2, x, y, Ct(5, 5))
    b.zajete.update({(x, y), (x, y - 1)})


def worki(b, x, y):
    b.kafel(3, x, y - 1, Ct(3, 6)); b.kafel(2, x, y, Ct(3, 7))
    b.zajete.update({(x, y), (x, y - 1)})


def grzadki(b, x0, y0, x1, y1, plot=True, brama=None):
    """ogródek: ziemia z kapustą i sałatą, płot dookoła (furtka: lista kratek bez płotu)"""
    b.maluj(0, rect(x0, y0, x1, y1), ZIEMIA, tag="grunt_ogrod")
    przy_furtce = {(bx + dx, by + dy) for (bx, by) in (brama or []) for dx in (-1, 0, 1) for dy in (-1, 0, 1)}
    for (x, y) in rect(x0, y0, x1, y1):
        if (x, y) in przy_furtce: continue
        if (x + y) % 2 == 0 and (y - y0) % 2 == 0:
            b.kafel(2, x, y, Ct(5 + (x * 7 + y * 3) % 3, 2))
            b.zajete.add((x, y))
    if plot:
        ring = [c for c in rect(x0 - 1, y0 - 1, x1 + 1, y1 + 1) if not (x0 <= c[0] <= x1 and y0 <= c[1] <= y1)]
        ring = [c for c in ring if c not in (brama or [])]
        b.maluj(1, ring, NAKL_PLOT, tag="grunt_plot")
        b.zajete.update(ring)


def plac(b):
    """jeden spójny plac: jasne płyty z ciemnym obrzeżem, kwadrat z innych płyt wokół studni z ławkami i donicami,
    targ w czterech zwartych rzędach po dwa stragany (towar w grupkach między nimi, wozy), kwietniki z drzewami"""
    x0, y0, x1, y1 = PLAC
    kosze_przy_schodach(b)
    b.maluj(0, rect(x0, y0 + 2, x1, y1), PLYTY, tag="grunt_plac")
    b.zmaz(1, rect(x0, y0 + 2, x1, y1))
    obrzeze = [(x, y) for (x, y) in rect(x0, y0 + 2, x1, y1) if x in (x0, x1) or y == y1]
    b.maluj(0, obrzeze, BRUK, tag="grunt_plac")
    for (x, y) in rect(x0, y0, x1, y1):
        if b.tag[y][x] == "grunt": b.tag[y][x] = "grunt_plac"
    # kwadrat wokół studni (inne płyty), ławki zwrócone do studni, donice z kwiatami w rogach, latarnie
    b.maluj(0, rect(47, 45, 56, 54), PLYTY_STUDNIA, tag="grunt_plac")
    lawka(b, 51, 45)                                   # północna (siedzisko 45, nogi 46)
    lawka(b, 51, 53)                                   # południowa
    lawka_pion(b, 48, 49); lawka_pion(b, 55, 49)       # zachodnia i wschodnia
    for (kx, ky) in ((47, 45), (56, 45), (47, 53), (56, 53)):
        rzecz(b, "Donica z kwiatami", kx, ky + 1, "!Tavern_Yard", 2, 8, 2); b.zajete.update({(kx, ky), (kx, ky + 1)})
    for (lx, ly) in ((49, 45), (54, 45), (49, 54), (54, 54)):
        lampa(b, lx, ly); b.zajete.add((lx, ly))
    # kwietniki z drzewami (wzór: stare donice z rynku: kamienna rama, drzewo, skrzynki z kwiatami) przy osiach placu
    for (px, py) in ((42, 40), (57, 40), (42, 56), (57, 56)):
        b.kopiuj("kwietnik", 31, 33, 35, 36, px, py, zdarzenia=False, zapisz=False)
        drzewo(b, px + 2, py + 1, "okragle")
        for c in rect(px, py, px + 4, py + 3): b.zajete.add(c)
    # targ: rzędy straganów (po dwa) w czterech ćwiartkach; stragan czerwony (ev 101) już stoi na (33,44)
    for (sx, sy, wariant) in ((38, 44, "sukno"), (65, 44, "garnki"), (70, 44, "czerwony"),
                              (38, 58, "garnki"), (65, 58, "sukno"), (70, 58, "czerwony")):
        stragan(b, sx, sy, wariant)
    for (cx, cy) in rect(32, 42, 34, 44): b.zajete.add((cx, cy))
    # stragan w paski (ev 41, dawniej przy starych schodach) -> rząd południowo-zachodni
    e = b.ev[41]
    for dx in (-1, 1): b.region(e["x"] + dx, e["y"], 0)
    b.przesun_zd(41, 33, 58)
    for dx in (-1, 1): b.region(33 + dx, 58, 2)
    for (cx, cy) in rect(32, 56, 34, 58): b.zajete.add((cx, cy))
    # towar między straganami: beczka, worek, kosz z owocami / skrzynia
    for (gx, gy) in ((35, 44), (67, 44), (35, 58), (67, 58)):
        beczki(b, gx, gy, gx % 2)
        worki(b, gx + 1, gy)
    for (gx, gy) in ((31, 45), (72, 45), (31, 59), (72, 59)):
        b.kafel(2, gx, gy, Ct(6, 15)); b.zajete.add((gx, gy))     # kosz z owocami / warzywami
    # wozy targowe
    woz(b, 34, 61, "siano"); woz(b, 68, 61, "beczki"); woz(b, 31, 40, "taczka"); woz(b, 71, 40, "beczki")
    # latarnie w rogach placu
    for (lx, ly) in ((31, 43), (72, 43), (31, 56), (72, 56)):
        lampa(b, lx, ly); b.zajete.add((lx, ly))
    # u stóp schodów: tablica ogłoszeń; na pasie pod skałą po prawej donice z krzewami
    rzecz(b, "Tablica ogłoszeń", 57, 38, "!Tavern_Yard", 2, 6, 2)
    b.zajete.add((57, 38))
    for (kx, ky) in ((61, 38), (65, 38), (69, 38), (72, 38)):
        rzecz(b, "Krzew w donicy", kx, ky, "!Tavern_Yard", 2, 8, 1); b.zajete.add((kx, ky))
    b.strefy["plac"] = list(PLAC)
    b.strefy["plac_kwadrat_studni"] = [47, 45, 56, 54]


def lawka_pion(b, x, y):
    """ławka stojąca pionowo (C 14,0..2): trzy kratki w dół"""
    for r in range(3):
        b.kafel(2, x, y + r, Ct(14, r)); b.zajete.add((x, y + r))


def woz(b, x, y, rodzaj):
    """wóz z arkusza C (2 x 2): siano C(10..11,8..9), beczki C(12..13,8..9), taczka C(10..11,6..7)"""
    c0, r0 = {"siano": (10, 8), "beczki": (12, 8), "taczka": (10, 6)}[rodzaj]
    for dy in (0, 1):
        for dx in (0, 1):
            b.kafel(2, x + dx, y + dy, Ct(c0 + dx, r0 + dy)); b.zajete.add((x + dx, y + dy))


def szerokie_schody(b):
    """brama zamku i schody na plac: 6 kratek (x 49..54); wieże bramne odsunięte o kratkę (47-48 i 55-56),
    kosze żarowe po bokach u stóp schodów"""
    t = b.nowy_tag("brama_zamku")
    for i, ox in enumerate((21, 22)): b.kolumna(ox, 20, 28, 47 + i, 28, t)
    for i, ox in enumerate((27, 28)): b.kolumna(ox, 20, 28, 55 + i, 28, t)
    for (x, y) in rect(49, 28, 54, 36):
        for z in range(6): b.s(z, x, y, 0)
        b.res.discard((0, x, y)); b.res.discard((1, x, y))
        b.tag[y][x] = t
    b.maluj(0, rect(49, 28, 54, 33), PLYTY, tag=t)
    for y in (34, 35, 36):
        b.kafel(0, 49, y, A5t(0, 7)); b.kafel(0, 54, y, A5t(2, 7))
        for x in range(50, 54): b.kafel(0, x, y, A5t(1, 7))
        b.kafel(0, 48, y, A5t(2, 13 + y - 34)); b.kafel(0, 55, y, A5t(0, 13 + y - 34))
    b.przesun_zd(77, 48, 30)                 # hełmy wież bramnych
    b.przesun_zd(40, 56, 30)
    b.strefy["schody_na_plac"] = [49, 34, 54, 36]


def kosze_przy_schodach(b):
    """kosze żarowe po bokach schodów (wzór: kosze przy bramie wschodniej 225-228)"""
    for x in (48, 55):
        b.dodaj("Kosz żarowy (słup)", x, 37, copy.deepcopy(OLD["events"][225]["pages"]), OLD["events"][225]["note"])
        b.dodaj("Kosz żarowy (ogień)", x, 36, copy.deepcopy(OLD["events"][226]["pages"]), OLD["events"][226]["note"])
        b.region(x, 37, 2); b.zajete.update({(x, 37), (x, 36)})


def dziedziniec(b):
    # dziedziniec przed tawerną: jasna aleja od drzwi do bramy zamku, trawniki z drzewami, ławki, latarnie
    b.maluj(0, rect(49, 17, 54, 27), PLYTY, tag="grunt_dziedziniec")
    for (x0, x1) in ((31, 46), (57, 74)):
        b.maluj(0, rect(x0, 21, x1, 26), TRAWA, tag="grunt_trawnik")
        b.maluj(1, [(x, y) for (x, y) in rect(x0, 21, x1, 26) if x in (x0, x1) or y in (21, 26)], NAKL_KAMIENIE, tag="grunt_trawnik")
        for (x, y) in rect(x0 + 1, 22, x1 - 1, 25):
            if (x * 5 + y * 3) % 7 == 0: b.maluj(1, [(x, y)], NAKL_KWIATY, tag="grunt_trawnik")
    for (x, y) in ((35, 23), (42, 24), (61, 24), (69, 23)):
        drzewo(b, x, y, "okragle")
    for (x, y) in ((38, 21), (64, 21)):
        drzewo(b, x, y, "krzew")
    lawka(b, 44, 26); lawka(b, 58, 26); lawka(b, 32, 21); lawka(b, 72, 21)
    for (x, y) in ((48, 21), (55, 21), (48, 27), (55, 27)):
        lampa(b, x, y); b.zajete.add((x, y))
    rzecz(b, "Poręcz do wiązania koni", 31, 18, "!Tavern_Yard", 2, 8, 0)
    rzecz(b, "Wóz", 74, 18, "!House_Town", 0, 4, 1, occ={"right": 1})
    b.strefy["dziedziniec_tawerny"] = [29, 17, 76, 27]


def ogrodek_piwny(b):
    x0, y0, x1, y1 = 65, 5, 76, 15
    b.maluj(0, rect(x0, y0, x1, y1), DESKI, tag="grunt_piwny")
    b.maluj(1, [(x, 16) for x in range(x0, x1 + 1) if x not in (69, 70, 71)], NAKL_PLOT, tag="grunt_piwny")
    for x in range(x0, x1 + 1): b.zajete.add((x, 16))
    for (tx, ty) in ((68, 8), (73, 8), (68, 12), (73, 12)):
        rzecz(b, "Stół w ogródku piwnym", tx, ty, "!Tavern_Yard", 0, 2, 2, occ={"left": 1, "right": 1})
        rzecz(b, "Stołek", tx - 1, ty + 1, "!Tavern_Yard", 0, 6, 0)
        rzecz(b, "Stołek", tx + 1, ty + 1, "!Tavern_Yard", 0, 6, 1)
        for c in rect(tx - 1, ty, tx + 1, ty + 1): b.zajete.add(c)
    rzecz(b, "Beczki piwa", 75, 6, "!Tavern_Yard", 0, 8, 1, occ={"left": 1, "right": 1})
    rzecz(b, "Beczka", 66, 6, "!Tavern_Yard", 0, 8, 0)
    lampa(b, 66, 14); lampa(b, 75, 14)
    drzewo(b, 70, 5, "okragle")
    b.strefy["ogrodek_piwny"] = [x0, y0, x1, y1]


def kwartaly(b):
    """ścieżki, ogrody, place przed budynkami, drobiazgi przy ścianach"""
    # --- północny zachód: kruchta kaplicy, uliczka do alei, ścieżka grabarza, ogródek grabarza, cmentarz
    b.maluj(0, rect(3, 17, 16, 19), PLYTY, tag="grunt_kruchta")
    b.maluj(0, rect(17, 18, 24, 19), BRUK, tag="grunt")
    b.maluj(0, rect(19, 13, 20, 17), BRUK, tag="grunt")
    grzadki(b, 16, 5, 19, 7, brama=[(15, 6)])
    rzecz(b, "Taczka grabarza", 22, 7, "!House_Town", 0, 4, 1, occ={"right": 1})
    rzecz(b, "Łopata", 23, 11, "!House_Town", 2, 4, 2)
    cx, cy, cw, ch = CMENTARZ
    for (x, y) in rect(cx - 1, cy - 1, cx + cw, cy + ch): b.tag[y][x] = "grunt_cmentarz"     # wolna trawa: mur i groby stawia Zakon
    for (x, y) in rect(cx, cy, cx + cw - 1, cy + ch - 1): b.zajete.add((x, y))
    for (x, y) in rect(cx - 1, cy - 1, cx + cw, cy + ch): b.zajete.add((x, y))
    b.maluj(1, rect(cx + 3, cy + ch, cx + 4, 33), NAKL_SCIEZKA, tag="grunt_sciezka")
    for (x, y) in rect(cx + 3, cy + ch, cx + 4, 33): b.zajete.add((x, y))
    for (x, y) in ((3, 21), (14, 21), (3, 31), (14, 31), (2, 26)):
        drzewo(b, x, y, "sosna")
    lawka(b, 13, 20)
    b.strefy["cmentarz"] = {"x": cx, "y": cy, "w": cw, "h": ch, "furtka": [[cx + 3, cy + ch - 1], [cx + 4, cy + ch - 1]],
                            "lampka": [cx + 4, cy], "przed_furtka": [cx + 3, cy + ch]}
    b.region(12, 84, 2)                                  # dzban na beczce przy domu garbarza (stare 43,45)
    # --- przy kantorze i domu szwaczki
    drzewo(b, 11, 41, "okragle")
    # --- północny wschód: ogród Agaty, ścieżka do uliczki pod stawem, sad za dzwonnicą, podwórze kamienicy
    b.maluj(0, rect(85, 13, 86, 16), BRUK, tag="grunt")
    grzadki(b, 81, 8, 82, 12, brama=[(82, 13)])
    grzadki(b, 88, 8, 88, 12, plot=False)
    for (x, y) in ((83, 21), (88, 21), (82, 26), (89, 27), (86, 24)):
        drzewo(b, x, y, "okragle" if (x + y) % 2 else "male")
    b.maluj(0, rect(92, 30, 99, 33), BRUK, tag="grunt")
    beczki(b, 92, 31); beczki(b, 93, 31, 1)
    # --- strażnica: plac ćwiczeń, stojaki z bronią, kukła, latarnia
    b.maluj(0, rect(94, 37, 101, 41), ZIEMIA, tag="grunt_cwiczenia")
    b.maluj(0, rect(94, 48, 101, 48), BRUK, tag="grunt")
    rzecz(b, "Stojak z bronią", 96, 38, "!Town_Props", 0, 4, 0)
    rzecz(b, "Stojak z bronią", 99, 38, "!Town_Props", 0, 4, 1)
    rzecz(b, "Kukła do ćwiczeń", 97, 40, "!Town_Props", 0, 4, 2)
    lampa(b, 94, 47)
    # --- pod ulicą główną: sad przy kuźni, ogródek przy domu Haliny
    for (x, y) in ((17, 55), (21, 57), (17, 60), (22, 61)):
        drzewo(b, x, y, "okragle" if (x + y) % 2 else "male")
    lawka(b, 19, 62)
    rzecz(b, "Wóz z sianem", 15, 61, "!House_Town", 0, 4, 2, occ={"right": 1})
    grzadki(b, 75, 56, 78, 61, brama=[(76, 62)])
    beczki(b, 89, 62); worki(b, 90, 62)
    # --- ogrody mieszczan (zachód, pas 66..74) z płotami i strachem na wróble
    grzadki(b, 3, 67, 9, 72, brama=[(6, 73)])
    grzadki(b, 12, 67, 17, 72, brama=[(14, 73)])
    grzadki(b, 20, 68, 23, 72, brama=[(21, 73)])
    rzecz(b, "Strach na wróble", 10, 70, "!Town_Props", 0, 4, 2)
    # --- przy piekarni: worki z mąką; przy woziwodzie: beczki na wodę, wózek z beczką
    b.maluj(0, rect(56, 64, 65, 67), BRUK, tag="grunt")
    beczki(b, 57, 66); beczki(b, 58, 66, 1); beczki(b, 63, 66)
    rzecz(b, "Wózek z beczką", 60, 66, "!House_Town", 0, 4, 0, occ={"right": 1})
    # --- skwer
    b.maluj(1, rect(67, 66, 72, 72), NAKL_JASNA, tag="grunt_skwer")
    b.maluj(1, rect(68, 68, 71, 70), NAKL_KWIATY, tag="grunt_skwer")
    drzewo(b, 68, 67, "okragle"); drzewo(b, 72, 71, "okragle")
    lawka(b, 69, 72); lampa(b, 66, 73)
    b.strefy["skwer"] = [66, 65, 73, 73]
    # --- wschód pasa 66..74: sad i ogródki
    for (x, y) in ((86, 69), (93, 70), (98, 68)):
        drzewo(b, x, y, "okragle" if (x + y) % 2 else "male")
    grzadki(b, 85, 72, 91, 73, brama=[(88, 74)])
    # --- garbarnia i pas 78..88: drewno cieśli, ogród staruszków, płot wybiegu przy stajni, koryto
    b.kafel(3, 36, 86, Ct(1, 2)); b.kafel(2, 36, 87, Ct(1, 3)); b.zajete.update({(36, 86), (36, 87)})
    grzadki(b, 36, 80, 38, 84, brama=[(37, 85)])
    b.maluj(1, [(x, 79) for x in range(70, 75)] + [(75, y) for y in range(79, 88)], NAKL_PLOT, tag="grunt_plot")
    b.kafel(2, 72, 81, Ct(9, 2)); b.kafel(2, 73, 81, Ct(10, 2)); b.zajete.update({(72, 81), (73, 81)})
    grzadki(b, 83, 79, 86, 81, brama=[(84, 82)])
    grzadki(b, 92, 79, 99, 82, brama=[(95, 83)])


def latarnie_ulic(b):
    for (x, y) in ((12, 48), (24, 48), (40, 48), (64, 48), (79, 48), (90, 48), (24, 37), (81, 33), (24, 74), (78, 74),
                   (48, 74), (55, 74), (49, 88), (54, 88), (27, 88), (76, 88), (24, 16), (81, 16), (2, 36), (101, 36),
                   (12, 74), (90, 74), (37, 88), (66, 88)):
        zd = zd_na(b)
        if wolne(b, x, y, zd, grunt=False):
            lampa(b, x, y); b.zajete.add((x, y))


def zielen(b):
    """trawa: kępy wysokiej trawy i kwiatów, ciemniejsza trawa przy ścianach, rzadkie krzewy i drzewa na wolnych połaciach"""
    rnd = b.rnd
    zd = zd_na(b)
    for y in range(2, 92):
        for x in range(2, 102):
            if b.tag[y][x] != "grunt" or kind_of(b.g(0, x, y)) != TRAWA or b.g(1, x, y): continue
            przy = any(b.g(5, x + dx, y + dy) == 2 or b.g(0, x + dx, y + dy) >= 4352 for dx in (-1, 0, 1) for dy in (-1, 0, 1))
            n = N.lowfreq(x, y, 77, 4.0)
            n2 = N.lowfreq(x, y, 131, 5.0)
            if (przy and rnd.random() < 0.35) or n > 0.78:
                b.maluj(1, [(x, y)], NAKL_WYSOKA, tag="grunt")
            elif n < 0.14:
                b.maluj(1, [(x, y)], NAKL_KWIATY, tag="grunt")
            elif n2 > 0.72:
                b.maluj(1, [(x, y)], NAKL_JASNA, tag="grunt")
            elif n2 < 0.06:
                b.maluj(1, [(x, y)], NAKL_SUCHA, tag="grunt")
            elif rnd.random() < 0.035 and wolne(b, x, y, zd):
                b.kafel(2, x, y, rnd.choice([Dt(9, 7), Dt(10, 7), Dt(11, 7), Dt(8, 8), Dt(9, 8), Dt(10, 8)]))
    # drzewa na dużych wolnych połaciach trawy (odstęp >= 4)
    spots = [(x, y) for y in range(3, 91) for x in range(3, 101)]
    rnd.shuffle(spots)
    drzewa = [(e["x"], e["y"]) for e in b.ev.values() if "Trees" in e["pages"][0]["image"]["characterName"]
              or "Tree_Small" in e["pages"][0]["image"]["characterName"]]
    for (x, y) in spots:
        if b.tag[y][x] != "grunt" or kind_of(b.g(0, x, y)) != TRAWA: continue
        if not wolne(b, x, y, zd): continue
        if any(kind_of(b.g(0, x + dx, y + dy)) in (BRUK, PLYTY) for dx in (-1, 0, 1) for dy in (-1, 0, 1, 2)): continue
        if not all(wolne(b, x + dx, y + dy, zd) for dx in (-2, -1, 0, 1, 2) for dy in (-2, -1, 0, 1)): continue
        if any(abs(x - a) + abs(y - c) < 6 for (a, c) in drzewa): continue
        if N.lowfreq(x, y, 91, 7.0) < 0.45: continue
        drzewo(b, x, y, rnd.choice(["okragle", "okragle", "male", "sosna", "krzew"]))
        drzewa.append((x, y)); zd[(x, y)].append(0)


# ================================================================================================ ULICE, PIERZEJE, DROBIAZGI
def obrzeza(b):
    """chodnik z jasnych płyt wzdłuż ulic: trawa przy bruku ulicy (zwykły grunt bez rzeczy) -> płyty"""
    ulica = set()
    for r in ULICE:
        for c in rect(*r):
            if kind_of(b.g(0, *c)) == BRUK: ulica.add(c)
    n = 0
    for y in range(2, 92):
        for x in range(2, 102):
            if b.tag[y][x] != "grunt" or kind_of(b.g(0, x, y)) != TRAWA: continue
            if b.g(2, x, y) or b.g(3, x, y) or b.g(5, x, y) == 2: continue
            if any((x + dx, y + dy) in ulica for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                b.maluj(0, [(x, y)], PLYTY, tag="grunt_chodnik"); b.zmaz(1, [(x, y)]); n += 1
    return n


def dom_bez_wnetrza(b, key, x, y, nazwa, **kw):
    """sąsiedni dom w pierzei (bez wnętrza): prefabrykat bez drzwi i szyldów"""
    pf = pf_wczytaj(key)
    bez = pf_drzwi(key) + pf_ev_index(key, lambda ev: ev["pages"][0]["image"]["characterName"] == "!Signs")
    prefab(b, key, x, y, bez_ev=bez, **kw)
    w = len(list(kw.get("kolumny", range(pf["w"]))))
    h = len(list(kw.get("wiersze", range(pf["h"]))))
    regiony_budynku(b, x, y, x + w - 1, y + h - 1)
    for c in rect(x, y, x + w - 1, y + h - 1): b.zajete.add(c)
    b.pierzeje.append({"nazwa": nazwa, "prefabrykat": key, "prostokat": [x, y, x + w - 1, y + h - 1]})


def pierzeje(b):
    """domy w pierzejach (decyzja użytkownika: też z wnętrzami, mapy 193-198; 191-192 zarezerwowane przez Okolice)"""
    # key, prefabrykat, x, y, nazwa (do MapInfos), mapa, drzwi względem prefabrykatu, obraz drzwi, okno do zdjęcia (kolumna)
    DOMY = [
        ("dom10", "dom_lukarny_czarny", 30, 67, "Dom 10 (przy piekarni)", 193, (1, 6), ("!Fantasy_door1", 3, 1), True),
        ("dom11", "kamienice_szachulec", 41, 65, "Dom 11 (kamienice przy ulicy południowej)", 194, (4, 8), ("!Fantasy_door1", 4, 1), False),
        ("dom12", "dom_lukarny_czarny", 44, 81, "Dom 12 (bliźniak domu staruszków)", 195, (1, 6), ("!Fantasy_door1", 5, 1), True),
        ("dom13", "dom_lukarny_mikstury", 75, 66, "Dom 13 (dom z lukarnami na wschodzie)", 196, (4, 8), ("!Fantasy_door1", 1, 1), False),
        ("dom14", "dom_lukarny_czarny", 77, 82, "Dom 14 (obok domu weterana)", 197, (1, 6), ("!Fantasy_door2", 3, 1), True),
        ("dom15", "dom_lukarny_mikstury", 17, 25, "Dom 15 (przy cmentarzu)", 198, (4, 8), ("!Fantasy_door1", 2, 1), False),
    ]
    for (klucz, key, x, y, nazwa, mapa, (dx, dy), obraz, okno) in DOMY:
        pf = pf_wczytaj(key)
        bez = pf_drzwi(key) + pf_ev_index(key, lambda ev: ev["pages"][0]["image"]["characterName"] == "!Signs")
        prefab(b, key, x, y, bez_ev=bez)
        w, h = pf["w"], pf["h"]
        if okno: wyczysc_gore(b, x + dx, y + dy - 1, y + dy)
        if key == "kamienice_szachulec":
            for r in range(2, 7): b.region(x + 7, y + r, 2)        # okap prawego skrzydła nad wolną kratką
        if key == "dom_lukarny_mikstury":
            b.s(2, x, y + 8, 0); b.s(3, x + 1, y + 8, 0)             # donice bez dołu (prefabrykat kończy się na 9 rzędach)
        fx, fy = x + dx, y + dy + 1
        drzwi(b, klucz, nazwa, klucz, x + dx, y + dy, mapa, obraz=obraz, prefab_key=key, prost=(x, y, x + w - 1, y + h - 1),
              eid=b.rezerwa[0])
        b.budynki[-1]["pierzeja"] = True
        regiony_budynku(b, x, y, x + w - 1, y + h - 1, wolne=[(fx, fy)])
        b.region(fx, fy, 0)
        for c in rect(x, y, x + w - 1, y + h - 1): b.zajete.add(c)
        b.miejsce(klucz + "_drzwi", fx, fy)
        b.ev[b.nowe_ids[-1]]["pages"][0]["image"]["direction"] = 8
        b.pierzeje.append({"klucz": klucz, "nazwa": nazwa, "prefabrykat": key, "prostokat": [x, y, x + w - 1, y + h - 1]})


def pod_murem(b):
    """ulica pod murem południowym: grupki beczek i skrzyń przy murze (rząd 91-92), środek ulicy wolny"""
    for x0 in (5, 17, 29, 33, 56, 71, 74, 84, 96):
        for i, (c, r) in enumerate(((3, 8), (4, 8), (3, 8))[: 2 + x0 % 2]):
            x = x0 + i
            if b.g(2, x, 91) or b.g(3, x, 91) or b.g(2, x, 92) or b.g(3, x, 92) or b.g(5, x, 92) or b.g(5, x, 91): continue
            if kind_of(b.g(0, x, 92)) != BRUK: continue
            b.kafel(3, x, 91, Ct(c, r)); b.kafel(2, x, 92, Ct(c, r + 1))
            b.zajete.update({(x, 91), (x, 92)})


def zestaw_kafli(b, x, y, wzor):
    """wzor: lista (dx, dy, z, kafel) - stawia, gdy wszystkie kratki i margines 1 (przejścia) są wolną trawą"""
    cells = {(x + dx, y + dy) for (dx, dy, z, t) in wzor}
    zd = zd_na(b)
    marg = {(cx + ex, cy + ey) for (cx, cy) in cells for ex in (-1, 0, 1) for ey in (-1, 0, 1)} - cells
    if not all(wolne(b, cx, cy, zd) and kind_of(b.g(0, cx, cy)) in (TRAWA, ZIEMIA) for (cx, cy) in cells): return False
    # nie przy drzwiach, miejscach i nie na ulicy/chodniku (przejścia zostają); ściany budynków obok wolno
    if any(c in b.zajete or c in zd for c in marg): return False
    for (dx, dy, z, t) in wzor:
        b.kafel(z, x + dx, y + dy, t)
    b.zajete.update(cells)
    return True


def ZESTAWY():
    sznur = [(0, r, 2, Ct(9, 13 + r)) for r in range(3)] + [(6, r, 2, Ct(15, 13 + r)) for r in range(3)] + \
            [(c - 9, r, 3, Ct(c, 13 + r)) for c in range(10, 15) for r in range(2)]
    drewno = [(c, 0, 3, Ct(8 + c, 4)) for c in range(3)] + [(c, 1, 2, Ct(8 + c, 5)) for c in range(3)]
    stog = [(c, r, 2 if r == 2 else 3, Ct(13 + c, 10 + r)) for c in range(3) for r in range(3) if (c, r) != (2, 2)]
    beczki_stos = [(c, r, 2 if r == 1 else 3, Ct(3 + c, 11 + r)) for c in range(2) for r in range(2)]
    return {"sznur": sznur, "drewno": drewno, "stog": stog, "beczki": beczki_stos}


def drobiazgi(b):
    """przy domach jak u autora: sznury z praniem, sągi drewna, stogi, stosy beczek - na wolnej trawie działek,
    blisko ścian budynków (do 3 kratek od regionu 2), rozstawione losowo z ziarnem, z odstępem między takimi samymi"""
    Z = ZESTAWY()
    ile = {"sznur": 6, "drewno": 9, "stog": 3, "beczki": 6}
    przy = set()
    for y in range(2, 92):
        for x in range(2, 102):
            if b.g(5, x, y) == 2 and b.g(0, x, y) >= 4352:
                for dy in range(-3, 4):
                    for dx in range(-3, 4): przy.add((x + dx, y + dy))
    kand = sorted(c for c in przy if 3 <= c[0] <= 98 and 3 <= c[1] <= 86)
    b.rnd.shuffle(kand)
    zrobione = collections.Counter()
    postawione = collections.defaultdict(list)
    for nazwa in ("sznur", "stog", "drewno", "beczki"):
        for (x, y) in kand:
            if zrobione[nazwa] >= ile[nazwa]: break
            if any(abs(x - a) + abs(y - c) < 14 for (a, c) in postawione[nazwa]): continue
            if zestaw_kafli(b, x, y, Z[nazwa]):
                zrobione[nazwa] += 1
                postawione[nazwa].append((x, y))
    for (nazwa, x, y) in (("sznur", 16, 21), ("sznur", 90, 66), ("sznur", 82, 22), ("drewno", 22, 5), ("drewno", 89, 9)):
        if zestaw_kafli(b, x, y, Z[nazwa]):
            zrobione[nazwa] += 1
            postawione[nazwa].append((x, y))
    b.drobiazgi_miejsca = dict(postawione)
    return zrobione


def ziel_przy_placu(b):
    """pas zieleni między aleją zachodnią a placem (x 27..29, rzędy 39..48): trawa, kwiaty, drzewa"""
    b.maluj(0, rect(27, 39, 29, 48), TRAWA, tag="grunt_skwerek")
    b.maluj(1, rect(27, 40, 29, 47), NAKL_KWIATY, tag="grunt_skwerek")
    drzewo(b, 28, 41, "okragle"); drzewo(b, 28, 46, "okragle")
    for c in rect(27, 39, 29, 48): b.zajete.add(c)


def polacz_wnetrza(b):
    """drzwi nowych budynków -> kratka wejścia gotowych wnętrz (tools/miasto2/wnetrza/meta.json), jeśli plik jest"""
    p = os.path.join(HERE, "wnetrza", "meta.json")
    if not os.path.exists(p): return 0
    meta = L.load_json(p)["mapy"]
    n = 0
    for bud in b.budynki:
        m = meta.get(str(bud["wnetrze"]))
        if not m or m.get("klucz") != bud["klucz"]: continue
        w = m["wejscie"]
        e = b.ev[bud["drzwi_id"]]
        for pg in e["pages"]:
            for c in pg["list"]:
                if c["code"] == 201:
                    c["parameters"] = [0, bud["wnetrze"], w["x"], w["y"], w.get("kierunek", 8), 0]
        bud["wnetrze_xy"] = [w["x"], w["y"]]
        bud["polaczone_z_wnetrzem"] = True
        n += 1
    return n


# ================================================================================================ ZA MUREM
POLA = {"pole_1": (6, 104, 8, 4), "pole_2": (32, 118, 8, 4), "pole_3": (62, 104, 8, 5)}     # x, y, w, h (Zasoby FIELDS)
SZUBIENICA = (87, 121, 3, 3)                                                                  # Zakon GALLOWS (x, y, w, h)


def usun_zdarzenia(b, cells, powod):
    cells = set(cells)
    for eid, e in list(b.ev.items()):
        if (e["x"], e["y"]) in cells and eid not in (1, 2, 3):
            b.pool[eid] = b.ev.pop(eid)
            b.usuniete_powod[eid] = powod


def za_murem(b):
    # stary odcinek ścieżki pod dawną bramę (x ~17..23, rzędy 103..108) prowadziłby w skarpę - zarasta trawą
    for (x, y) in rect(14, 103, 26, 108):
        if kind_of(b.g(1, x, y)) == NAKL_SCIEZKA:
            b.s(1, x, y, A(NAKL_WYSOKA) if (x + y) % 3 == 0 else 0)
            if b.g(1, x, y): b.res.add((1, x, y))
            for dx in (-1, 0, 1):
                for dy in (-1, 0, 1):
                    if b.g(1, x + dx, y + dy) >= 2048: b.res.add((1, x + dx, y + dy))
    # droga od schodów bramy południowej do starej ścieżki na Polną drogę (wyjście 24-26,137 zostaje)
    droga = rect(51, 103, 53, 111) + rect(9, 109, 50, 111)
    margines = {(x + dx, y + dy) for (x, y) in droga for dx in (-1, 0, 1) for dy in (-1, 0, 1)}
    usun_zdarzenia(b, margines, "droga od bramy południowej")
    for (x, y) in droga:
        for z in (2, 3): b.s(z, x, y, 0)
        b.s(0, x, y, A(TRAWA)); b.res.add((0, x, y))
    b.maluj(1, droga, NAKL_SCIEZKA, tag="droga")
    # ścieżki do pól i na wzgórze z szubienicą
    sciezki = rect(9, 108, 10, 108) + rect(27, 119, 31, 120) + rect(54, 106, 61, 107) + rect(54, 112, 88, 113) + rect(87, 114, 88, 119)
    usun_zdarzenia(b, sciezki, "ścieżka do pól / szubienicy")
    for (x, y) in sciezki:
        for z in (2, 3): b.s(z, x, y, 0)
    b.maluj(1, sciezki, NAKL_SCIEZKA, tag="droga")
    # pola mieszczan: ziemia uprawna (uprawy stawia Zasoby z FIELDS), wolny pas trawy dookoła
    for key, (x, y, w, h) in POLA.items():
        pole = rect(x, y, x + w - 1, y + h - 1)
        brzeg = rect(x - 1, y - 1, x + w, y + h)
        usun_zdarzenia(b, brzeg, "pole mieszczan " + key)
        for (cx, cy) in brzeg:
            for z in (1, 2, 3): b.s(z, cx, cy, 0)
            b.s(0, cx, cy, A(TRAWA)); b.res.add((0, cx, cy)); b.res.discard((1, cx, cy))
        b.maluj(0, pole, ZIEMIA, tag="pole")
        b.strefy[key] = {"x": x, "y": y, "w": w, "h": h}
    # wzgórze z szubienicą: polana (szubienicę stawia Zakon z GALLOWS)
    gx, gy, gw, gh = SZUBIENICA
    wzg = [(x, y) for (x, y) in rect(gx - 3, gy - 3, gx + gw + 2, gy + gh + 2) if (x - gx - 1) ** 2 + (y - gy - 1) ** 2 <= 13]
    usun_zdarzenia(b, wzg, "wzgórze z szubienicą")
    for (x, y) in wzg:
        for z in (1, 2, 3): b.s(z, x, y, 0)
        b.res.discard((1, x, y))
        b.s(0, x, y, A(TRAWA_JASNA)); b.res.add((0, x, y))
    b.maluj(1, [(x, y) for (x, y) in wzg if (x - gx - 1) ** 2 + (y - gy - 1) ** 2 >= 8], NAKL_WYSOKA, tag="wzgorze")
    b.strefy["szubienica"] = {"x": gx, "y": gy, "w": gw, "h": gh, "at": [gx + 1, gy + 2]}


# ================================================================================================ MIEJSCA (TownLife)
# stare klucze SPOTS (TownLife_Data.js) -> nowe kratki (zgodnie z przeniesionymi blokami albo najbliższy odpowiednik)
SPOTS_STARE = {
    "tawerna": [24, 17, 8], "przed_tawerna": [31, 19, 2], "brama_twierdzy": [24, 21, 2], "ogrod_zakonu": [6, 17, 8], "staw": [39, 10, 6],
    "stragan1": [21, 31, 2], "stragan2": [27, 30, 2], "studnia_rynek": [23, 34, 2], "rynek_srodek": [26, 36, 2], "rynek_lawka": [19, 35, 2],
    "piekarnia_drzwi": [6, 39, 8], "kantor_drzwi": [14, 39, 8], "kantor_przed": [12, 40, 2], "kantor_rog": [16, 40, 4],
    "ratusz_drzwi": [41, 40, 8], "ratusz_przed": [39, 40, 2], "dzwonnica": [47, 30, 8],
    "schody_rzem": [24, 44, 2], "ulica_rzem": [12, 50, 2], "kowadlo": [7, 49, 8], "kuznia_dom": [12, 47, 8], "garbarnia": [16, 45, 8],
    "garbarz_dom": [37, 50, 8], "woziwoda_dom": [29, 47, 8], "brama_wsch": [48, 51, 4], "brama_pld": [25, 53, 2],
    "dom_mieszczan": [9, 31, 8], "pod_murem": [31, 51, 2], "stodola": [21, 51, 2], "rynek_rog": [30, 38, 2],
    "ratusz_obok": [40, 40, 4], "stragan1_obok": [19, 31, 6], "stragan_kosci": [30, 31, 4], "woz_pld": [27, 51, 2], "w6_ognisko": [33, 51, 4],
}
# kratki ustalone ręcznie (gdy stare miejsce nie leży w przeniesionym bloku albo jego odpowiednik jest gdzie indziej)
SPOTS_RECZNIE = {
    "stragan1": (33, 59), "stragan2": (33, 45), "rynek_lawka": (50, 46), "schody_rzem": (51, 65), "ulica_rzem": (12, 64),
    "garbarz_dom": (6, 89), "woziwoda_dom": (59, 74), "dom_mieszczan": (36, 39), "rynek_rog": (71, 47), "stragan1_obok": (31, 58),
    "stragan_kosci": (35, 45), "brama_wsch": (100, 51), "ratusz_drzwi": (85, 48), "kantor_drzwi": (18, 47), "piekarnia_drzwi": (38, 73),
    "kuznia_dom": (13, 61), "dzwonnica": (85, 31),
}
SPOTS_NOWE = {
    # plac
    "plac_studnia": (50, 52, 8), "plac_tablica": (57, 39, 8),
    "plac_1": (38, 47, 8), "plac_2": (64, 47, 8), "plac_3": (38, 55, 2), "plac_4": (64, 55, 2), "plac_5": (45, 47, 6),
    "plac_6": (58, 47, 4), "plac_7": (45, 54, 6), "plac_8": (58, 54, 4), "plac_9": (40, 41, 2), "plac_10": (63, 41, 2),
    "plac_11": (40, 61, 8), "plac_12": (63, 61, 8),
    "stragan_1": (38, 45, 8), "stragan_2": (65, 45, 8), "stragan_3": (70, 45, 8), "stragan_4": (38, 59, 8),
    "stragan_5": (65, 59, 8), "stragan_6": (70, 59, 8),
    "skwer": (70, 71, 2), "brama_pd": (52, 91, 2), "stajnia_woz": (69, 86, 6), "straznica_warta": (99, 50, 4),
    "kaplica_lawka": (14, 22, 8), "ciesla_warsztat": (33, 89, 8),
}


def punkt(b, x, y):
    """stara kratka -> nowa przez bloki (pierwszy pasujący; pseudo-blok „rynek” = punkty dawnego rynku wokół studni)"""
    for bl in b.bloki + PSEUDO_BLOKI:
        x0, y0, x1, y1 = bl["stary"]
        if x0 <= x <= x1 and y0 <= y <= y1:
            if bl["blok"] in ("kwietnik",): continue
            return (x + bl["dx"], y + bl["dy"]), bl["blok"]
    return None, None


PSEUDO_BLOKI = [
    {"blok": "rynek (punkty wokół studni)", "stary": [19, 29, 33, 40], "dx": 27, "dy": 16},
    {"blok": "cmentarz Zakonu (punkty)", "stary": [78, 10, 89, 19], "dx": CMENTARZ[0] - 80, "dy": CMENTARZ[1] - 12},
    {"blok": "szubienica Zakonu (punkty)", "stary": [91, 52, 97, 60], "dx": SZUBIENICA[0] - 93, "dy": SZUBIENICA[1] - 54},
]


def miejsca(b):
    for key, (ox, oy, d) in SPOTS_STARE.items():
        if key in SPOTS_RECZNIE:
            nx, ny = SPOTS_RECZNIE[key]
        else:
            (nx, ny), blok = punkt(b, ox, oy)
        b.miejsce(key, nx, ny)
        b.ev[b.nowe_ids[-1]]["pages"][0]["image"]["direction"] = d
    for key, (x, y, d) in SPOTS_NOWE.items():
        b.miejsce(key, x, y)
        b.ev[b.nowe_ids[-1]]["pages"][0]["image"]["direction"] = d
    for bud in b.budynki:
        if bud.get("nowy") and not bud.get("pierzeja"):
            x, y = bud["przed_drzwiami"]
            b.miejsce(bud["klucz"] + "_drzwi", x, y)
            b.ev[b.nowe_ids[-1]]["pages"][0]["image"]["direction"] = 8


def region31(b, mp):
    """lądowanie orła: wolne kratki placu (bez zdarzeń, przechodnie) - region 31"""
    x0, y0, x1, y1 = PLAC
    zd = zd_na(b)
    n = 0
    for (x, y) in rect(x0, y0, x1, y1):
        if (x, y) in zd or b.g(5, x, y): continue
        if b.g(2, x, y) or b.g(3, x, y): continue
        if not mp.stoi(x, y): continue
        b.region(x, y, 31); n += 1
    return n


# ================================================================================================ PUNKTY WTYCZEK (mapowanie c)
# (plik:klucz, stara kratka) -> nowa: przez bloki, chyba że podana ręcznie (ostatnia pozycja krotki)
PUNKTY = [
    ("Garnizon_Data.js:140 garnizon_werbownik", 22, 37, (24, 46)),
    ("Zakon_Data.js:495 SPOTS_TOWN groby", 82, 14, None), ("Zakon_Data.js:495 SPOTS_TOWN groby_2", 85, 14, None),
    ("Zakon_Data.js:495 SPOTS_TOWN kopie", 85, 16, None), ("Zakon_Data.js:495 SPOTS_TOWN furtka", 84, 18, None),
    ("Zakon_Data.js:495 SPOTS_TOWN przerwa", 86, 14, None), ("Zakon_Data.js:495 SPOTS_TOWN lampa", 84, 13, None),
    ("Zakon_Data.js:495 SPOTS_TOWN chata", 84, 20, (20, 13)),
    ("Wrak_Data.js:52 rozbitek_noc", 24, 17, None), ("Wrak_Data.js:53 rozbitek_rynek", 28, 35, (56, 51)),
    ("Wrak_Data.js:54 rozbitek_mury", 3, 19, None), ("Wrak_Data.js:55 rozbitek_studnia (Wrak.js wellWatch - dokładnie)", 25, 34, None),
    ("Wrak_Data.js:154 znak mapy Wzgórze tawerny", 24, 18, None),
    ("Kantor_Data.js:346 w5_piwnica", 10, 40, None), ("Kantor_Data.js:351 w5_lada", 14, 39, None),
    ("Kantor_Data.js:67 PLACES.backDoor (ev 94, dokładnie)", 10, 39, None), ("Kantor_Data.js:67 PLACES.backFront", 10, 40, None),
    ("Kantor_Data.js:67 PLACES.frontDoor (ev 95)", 14, 38, None), ("Kantor_Data.js:68 PLACES.gateIn", 25, 66, (52, 104)),
    ("Kantor_Data.js:68 PLACES.gateOut", 25, 67, (52, 105)), ("Kantor_Data.js:68 PLACES.east", 50, 50, (101, 50)),
    ("Kantor_Data.js:68 PLACES.tavern", 24, 18, None),
    ("Kantor.js:1286 F9 W5", 12, 41, (16, 49)), ("Kantor.js:1286 F9 W5", 8, 37, (10, 49)), ("Kantor.js:1286 F9 W5", 10, 41, (14, 49)),
    ("Dwor_Data.js:53 manor.out (też TownQuests.js:2242)", 50, 51, (102, 51)), ("Dwor_Data.js:54 town.gate", 48, 51, (100, 51)),
    ("Dwor_Data.js:55 town.f9", 24, 33, (50, 46)), ("Kasztelan.js:891 F9 rozdz. 3", 8, 50, (8, 50)),
    ("Garnizon_Data.js:284 lista 656", 20, 37, (25, 47)), ("Garnizon_Data.js:284 szukający 657", 32, 50, None),
    ("Garnizon_Data.js:284 szukający 658", 20, 50, None), ("Garnizon_Data.js:284 Kłos 659 (przy tylnych drzwiach kantoru)", 9, 40, None),
    ("TownQuests_Data.js:171 bakery_window (951)", 6, 39, None), ("TownQuests_Data.js:172 notice_tavern (952)", 25, 16, None),
    ("TownQuests_Data.js:173 notice_bakery (953)", 7, 39, None), ("TownQuests_Data.js:174 notice_smithy (954)", 8, 48, None),
    ("TownQuests_Data.js:175 notice_kantor (955)", 15, 39, None), ("TownQuests_Data.js:176 south_gate (956)", 26, 54, None),
    ("TownQuests_Data.js:177 watch_post (957)", 26, 20, None), ("TownQuests_Data.js:178 east_brazier (958)", 49, 49, None),
    ("TownQuests_Data.js:200 w3_kupala (959)", 24, 51, None),
    ("TownQuests_Data.js:217 W6 namiot 903", 31, 53, None), ("TownQuests_Data.js:218 W6 namiot 904", 19, 51, None),
    ("TownQuests_Data.js:219 W6 ognisko 905", 32, 51, None), ("TownQuests_Data.js:220 W6 Bogdan 906", 23, 51, None),
    ("TownQuests_Data.js:221 W6 Halina 907", 29, 52, None),
    ("TownQuests.js:1531 CAP posąg (ev 43, dokładnie)", 5, 9, None),
    ("Act3_Data.js:41 door", 24, 17, None), ("Act3_Data.js:41 doorTile", 24, 16, None),
    ("Act3_Data.js:42 gate", 24, 23, None), ("Act3_Data.js:42 gate", 25, 23, None), ("Act3_Data.js:42 gate", 24, 22, None),
    ("Act3_Data.js:42 gate", 25, 22, None), ("Act3_Data.js:42 gate", 23, 22, None), ("Act3_Data.js:42 gate", 26, 21, None),
    ("Act3_Data.js:42 gate", 23, 21, None), ("Act3_Data.js:42 gate", 24, 24, None), ("Act3_Data.js:42 gate", 25, 24, None),
    ("Act3_Data.js:43 guard", 21, 18, None), ("Act3_Data.js:43 guard", 27, 18, None), ("Act3_Data.js:43 guard", 19, 19, None),
    ("Act3_Data.js:43 guard", 29, 19, None), ("Act3_Data.js:43 guard", 22, 20, None), ("Act3_Data.js:43 guard", 26, 20, None),
    ("Act3_Data.js:43 guard", 17, 18, None), ("Act3_Data.js:43 guard", 31, 18, None),
    ("Act3_Data.js:44 from", 24, 24, None), ("Act3_Data.js:44 from", 25, 24, None), ("Act3_Data.js:44 from", 24, 23, None),
    ("Act3_Data.js:44 from", 25, 23, None),
    ("Act3_Data.js:45 bell (lina 859)", 47, 29, (85, 30)), ("Act3_Data.js:45 bellStand", 47, 30, (85, 31)),
    ("Act3_Data.js:46 fires", 21, 15, None), ("Act3_Data.js:46 fires", 27, 15, None), ("Act3_Data.js:46 fires", 18, 16, None),
    ("Act3_Data.js:46 fires", 30, 16, None), ("Act3_Data.js:46 fires", 24, 14, None), ("Act3.js:1340 F9 (drzwi + 2)", 24, 19, None),
    ("Underground_Data.js:697 rynek kamera", 24, 37, (53, 55)), ("Underground_Data.js:698 rynek sołtys", 26, 36, None),
    ("Underground_Data.js:698 rynek Hanka", 21, 33, (47, 49)), ("Underground_Data.js:698 rynek Kuba", 24, 36, None),
    ("Underground_Data.js:698 rynek Ambroży", 20, 36, None),
    ("Underground_Data.js:728 oboz kamera", 30, 50, None), ("Underground_Data.js:729 oboz Ludmiła", 30, 51, None),
    ("Underground_Data.js:729 oboz Ela", 31, 52, None), ("Underground_Data.js:730 oboz Marek", 32, 51, None),
    ("Underground_Data.js:730 oboz Rafał", 28, 51, None),
    ("Okolice_Data.js:88 ENTRY[8] (musi być przechodnie)", 27, 34, None),
    ("Zakon.js:1304 F9 cmentarz", 84, 16, None), ("Zakon.js:1304 F9 szubienica", 94, 58, None),
    ("Zakon_Data.js:299 odkrycie cmentarz", 84, 16, None), ("Zakon_Data.js:300 odkrycie szubienica", 94, 57, None),
    ("Zasoby.js:1420 F9 Pola mieszczan", 9, 80, (10, 108)),
    # przeniesienia z innych map na mapę 8 (tabela B)
    ("Map001 ev10 (wyjście z tawerny)", 23, 17, None), ("Map001 ev11", 24, 17, None), ("Map001 ev12", 25, 17, None),
    ("Map102 Piekarnia ev11", 6, 39, (38, 73)), ("Map103 Kantor ev7", 14, 39, None), ("Map103 Kantor ev13 (tylne)", 10, 40, None),
    ("Map104 Ratusz ev12", 41, 40, None), ("Map104 Ratusz ev15 (kancelaria)", 47, 40, None),
    ("Map105 Dom kowala ev8", 12, 47, None), ("Map106 Dom garbarza ev13", 37, 50, (6, 89)),
    ("Map107 Dom woziwody ev9", 29, 47, (59, 74)), ("Map108 Dzwonnica ev13", 48, 31, None),
    ("Map109 Dom mieszczan ev14", 9, 31, (36, 39)), ("Map110 Izba pod skałą ev3", 12, 30, None),
    ("Map118 Dno studni ev14 Lina", 26, 34, None), ("Map119 Archiwum ev2 Schody", 6, 13, None),
    ("Map111 Podgrodzie ev65", 1, 50, None), ("Map111 Podgrodzie ev66", 1, 51, None),
    ("Map024 Posiadłość ev65", 102, 50, (102, 50)), ("Map024 Posiadłość ev66", 102, 51, (102, 51)),
    ("Map022 Polna droga ev65-67", 25, 136, (25, 136)),
]


MP_STARA = L.Mapa(8)


def punkty_wtyczek(b, mp):
    out = []
    for (co, ox, oy, recznie) in PUNKTY:
        if recznie:
            n, blok = recznie, "ręcznie"
        else:
            n, blok = punkt(b, ox, oy)
            if n is None:
                n, blok = (ox, oy), "bez zmian (poza przeniesionymi blokami)"
        ok = mp.inside(*n) and mp.stoi(*n)
        was = MP_STARA.inside(ox, oy) and MP_STARA.stoi(ox, oy)
        out.append({"co": co, "stare": [ox, oy], "nowe": list(n), "jak": blok, "przechodnie": bool(ok), "stare_przechodnie": bool(was)})
    return out


# ================================================================================================ WYNIKI
STARE_DRZWI = [  # id, klucz, nazwa, blok
    (22, "tawerna", "Tawerna (Drzwi tawerny)", "taras_tawerna"), (88, "piekarnia", "Piekarnia", "piekarnia"),
    (94, "kantor", "Kantor (tylne drzwi)", "kantor"), (95, "kantor", "Kantor (front)", "kantor"),
    (114, "ratusz", "Ratusz", "ratusz"), (4, "ratusz", "Ratusz (kancelaria)", "ratusz"),
    (121, "dom_mieszczan", "Dom mieszczan", "pod_skala"), (124, "izba_pod_skala", "Izba pod skałą", "pod_skala"),
    (134, "kuznia", "Kuźnia (dom kowala)", "kuznia"), (137, "dom_woziwody", "Dom woziwody", "dom_woziwody"),
    (141, "dom_garbarza", "Dom garbarza", "dom_garbarza"), (236, "dzwonnica", "Dzwonnica", "dzwonnica"),
]


def wyniki(b, raw, mp, n31):
    bl = {x["blok"]: x for x in b.bloki}
    budynki = []
    for (eid, klucz, nazwa, blok) in STARE_DRZWI:
        e = b.ev[eid]
        tr = [c["parameters"] for p in e["pages"] for c in p["list"] if c["code"] == 201]
        budynki.append({"klucz": klucz, "nazwa": nazwa, "prostokat": bl[blok]["nowy"], "drzwi_id": eid, "drzwi": [e["x"], e["y"]],
                        "przed_drzwiami": [e["x"], e["y"] + 1], "wnetrze": tr[0][1] if tr else None,
                        "wnetrze_xy": tr[0][2:4] if tr else None, "prefabrykat": "przeniesiony blok starej mapy: " + blok,
                        "nowy": False, "stare_drzwi": b.ev_map[eid]["stare"]})
    for x in b.budynki:
        budynki.append(x)
    for x in budynki:
        fx, fy = x["przed_drzwiami"]
        x["przed_drzwiami_przechodnie"] = bool(mp.stoi(fx, fy))
    L.save_json(os.path.join(HERE, "budynki.json"), {"opis": "Budynki z wnętrzami na nowej mapie miasta (Map008, kopia robocza "
                "tools/miasto2/staging). drzwi = kratka zdarzenia drzwi, przed_drzwiami = lądowanie z wnętrza; nowe budynki mają "
                "przeniesienie zastępcze (wnetrze, 1, 1) do połączenia przez koordynatora.", "budynki": budynki}, indent=1)
    # mapowanie
    zd = {}
    for e in OLD["events"]:
        if not e: continue
        eid = e["id"]
        if eid in b.ev_map:
            zd[eid] = b.ev_map[eid]
        elif eid in b.ev and eid not in b.nowe_ids:
            zd[eid] = {"nazwa": e["name"], "stare": [e["x"], e["y"]], "nowe": [e["x"], e["y"]], "blok": "bez zmian (za murem)"}
    usuniete = []
    for e in OLD["events"]:
        if not e: continue
        eid = e["id"]
        if eid in zd: continue
        powod = b.usuniete_powod.get(eid) or ("drzewo/zasób nowego terenu w obrębie miasta" if (e["x"] >= 52 or e["y"] >= 69)
                                             else "ozdoba starego miasta poza przeniesionymi blokami")
        nowy = eid in b.ev
        usuniete.append({"id": eid, "nazwa": e["name"], "stare": [e["x"], e["y"]], "obraz": e["pages"][-1]["image"]["characterName"],
                         "notatka": e["note"], "powod": powod, "numer_przejety_przez_nowe": b.ev[eid]["name"] if nowy else None})
    nowe = [{"id": i, "nazwa": b.ev[i]["name"], "xy": [b.ev[i]["x"], b.ev[i]["y"]]} for i in sorted(b.nowe_ids) if i in b.ev]
    sp = {}
    for key, (ox, oy, d) in SPOTS_STARE.items():
        sp[key] = {"stare": [ox, oy, d], "nowe": list(b.miejsca[key]) + [d], "przechodnie": bool(mp.stoi(*b.miejsca[key]))}
    nowe_sp = {k: {"nowe": list(v), "przechodnie": bool(mp.stoi(*v))} for k, v in b.miejsca.items() if k not in SPOTS_STARE}
    strefy = dict(b.strefy)
    strefy["ogrod_rycerzy"] = {"prostokat": [29, 2, 37, 16], "TownQuests_w2Garden_i_cienie": "x 29-37, y 4-13 (było x 2-10)",
                               "podgladanie": "x 31-35, y 16-19 (było x 4-8)", "strzal_w_czapke": "sy >= 15.5, x 28.5-37.5, y >= 6.5",
                               "CAP": {"posag": [32, 9], "glowa": [32.5, 7.15], "czapka": [32.6, 16.3]},
                               "uwaga": "cokoły W3 = każde !Statue z y === 9: posągi 43/44 na (32,9)/(34,9); posągi 20/21 przed tawerną na y=17, posągi kaplicy na y=17"}
    strefy["orzel_TOWN_SQUARES_8"] = [[29, 17, 76, 27], [30, 37, 73, 63], [2, 89, 101, 92]]
    strefy["region31_plac_kratek"] = n31
    strefy["okolice_OLD_8"] = "miasto zajmuje teraz x 0-103, y 0-102 (mury ze skarpą); poza nim tylko rzędy 103-137"
    strefy["zakon_CEMETERY"] = {"x": CMENTARZ[0], "y": CMENTARZ[1], "w": CMENTARZ[2], "h": CMENTARZ[3],
                                "gate": [[CMENTARZ[0] + 3, CMENTARZ[1] + 5], [CMENTARZ[0] + 4, CMENTARZ[1] + 5]],
                                "lamp": [CMENTARZ[0] + 4, CMENTARZ[1]],
                                "graves": [[x - 80 + CMENTARZ[0], y - 12 + CMENTARZ[1]] for (x, y) in
                                           ((81, 13), (82, 13), (85, 13), (86, 13), (81, 15), (82, 15), (85, 15), (86, 15))]}
    strefy["zasoby_FIELDS"] = {k: b.strefy[k] for k in POLA}
    out = {
        "opis": "Mapowanie starej mapy miasta (data/Map008.json) na nową (tools/miasto2/staging/Map008.json). (a) bloki: stary "
                "prostokąt -> przesunięcie dx,dy (pierwszy pasujący blok wygrywa); (b) zdarzenia: id -> stare/nowe x,y, usunięte, "
                "nowe; (c) miejsca: klucze TownLife SPOTS i punkty wtyczek; (d) strefy i nowe prostokąty.",
        "a_bloki": b.bloki + PSEUDO_BLOKI,
        "b_zdarzenia": {"zachowane": {str(k): v for k, v in sorted(zd.items())}, "usuniete": usuniete, "nowe": nowe},
        "c_miejsca": {"TownLife_SPOTS": sp, "nowe_miejsca": nowe_sp, "punkty_wtyczek": punkty_wtyczek(b, mp)},
        "d_strefy": strefy,
    }
    L.save_json(os.path.join(HERE, "mapowanie.json"), out, indent=1)
    zle = [p for p in out["c_miejsca"]["punkty_wtyczek"] if not p["przechodnie"] and p["stare_przechodnie"]]
    zle += [{"co": "SPOTS " + k, **v} for k, v in sp.items() if not v["przechodnie"]]
    zle += [{"co": "nowe miejsce " + k, **v} for k, v in nowe_sp.items() if not v["przechodnie"]]
    zle += [{"co": "przed drzwiami " + x["klucz"], "nowe": x["przed_drzwiami"]} for x in budynki if not x["przed_drzwiami_przechodnie"]]
    if zle:
        print("NIEPRZECHODNIE punkty (%d):" % len(zle))
        for p in zle: print("  ", p["co"], p.get("stare"), "->", p["nowe"])
    return out


def rendery(mp):
    full = L.render(mp, scale=0.25).convert("RGB")
    full.save(DOCS + "nowe_miasto.png", optimize=True)
    for nazwa, reg in (("nowe_miasto_plac", (24, 30, 80, 66)), ("nowe_miasto_taras", (0, 0, 103, 40)),
                       ("nowe_miasto_dzielnice", (0, 52, 103, 103))):
        im = L.render(mp, region=reg, grid=False, scale=0.5).convert("RGB")
        im.save(DOCS + nazwa + ".png", optimize=True)
    # porównanie z planem: plan (bez legendy) obok nowej mapy, ta sama skala kratki
    try:
        from PIL import Image, ImageDraw
        plan = Image.open(DOCS + "plan_nowe_miasto.png").convert("RGB")
        S, ox, oy = 10, 10, 30
        plan = plan.crop((ox, oy, ox + W * S, oy + H * S))
        mapa = L.render(mp, scale=S / 48.0).convert("RGB")
        out = Image.new("RGB", (W * S * 2 + 30, H * S + 40), (24, 22, 30))
        out.paste(plan, (10, 30)); out.paste(mapa, (W * S + 20, 30))
        d = ImageDraw.Draw(out)
        f = L.font(16, True)
        d.text((10, 6), "Plan (zaakceptowany)", fill=(255, 220, 120), font=f)
        d.text((W * S + 20, 6), "Nowa mapa (tools/miasto2/staging/Map008.json)", fill=(255, 220, 120), font=f)
        out.save(DOCS + "nowe_miasto_porownanie.png", optimize=True)
    except Exception as ex:
        print("porównanie z planem: pominięte", ex)


def zbuduj(seed=1):
    b = Budowa(seed)
    b.wyczysc(0, 0, 103, 102)
    uklad_grunt(b)
    uklad_bloki(b)
    uklad_mury(b)
    szerokie_schody(b)
    nowe_budynki(b)
    for _ in range(6): b.zarezerwuj()   # numery drzwi domów w pierzejach (dom10-dom15): nigdy wcześniej nieużywane
    miejsca(b)                 # przed dekoracjami: kratki miejsc zostają wolne, a ich numery to numery pewne (nieużywane wcześniej)
    plac(b)
    dziedziniec(b)
    ogrodek_piwny(b)
    kwartaly(b)
    ziel_przy_placu(b)
    pierzeje(b)
    latarnie_ulic(b)
    b.n_obrzeza = obrzeza(b)
    b.drobiazgi = drobiazgi(b)
    pod_murem(b)
    zielen(b)
    za_murem(b)
    b.n_wnetrza = polacz_wnetrza(b)
    return b


def zapisz_mape(raw, path):
    import popraw
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "wb") as f:
        f.write(popraw.tekst_mapy(raw))


def main(argv):
    if hasattr(sys.stdout, "reconfigure"): sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser()
    ap.add_argument("--seed", type=int, default=1)
    ap.add_argument("--bez-obrazkow", action="store_true")
    ap.add_argument("--podglad", default="")
    a = ap.parse_args(argv)
    b = zbuduj(a.seed)
    raw = b.wynik()
    n31 = region31(b, L.Mapa(8, raw=raw))
    raw = b.wynik()
    path = os.path.join(STAGING, "Map008.json")
    zapisz_mape(raw, path)
    mp = L.Mapa(8, raw=raw)
    wyniki(b, raw, mp, n31)
    print("zapisano", path, "zdarzeń:", sum(1 for e in raw["events"] if e), "usuniętych:", len(b.pool), "region 31:", n31,
          "chodnik:", b.n_obrzeza, "drobiazgi:", dict(b.drobiazgi), "drzwi połączone z wnętrzami:", b.n_wnetrza)
    if not a.bez_obrazkow:
        rendery(mp)
    if a.podglad:
        mp = L.Mapa(8, raw=raw)
        x0, y0, x1, y1, sc = [float(v) for v in a.podglad.split(",")]
        im = L.render(mp, region=(int(x0), int(y0), int(x1), int(y1)), grid=sc >= 0.4, scale=sc)
        im.convert("RGB").save(os.path.join(STAGING, "podglad.png"))
    return b, raw


if __name__ == "__main__":
    main(sys.argv[1:])
