# -*- coding: utf-8 -*-
"""NOWE PODGRODZIE (Map111) - budowa nowego układu osady w kopii roboczej (2026-10-22).

Użycie:  python tools/podgrodzie2/build.py [--seed N] [--bez-obrazkow] [--podglad x0,y0,x1,y1,skala]
Wynik:   tools/podgrodzie2/staging/Map111.json   (układ edytora: jedna linia na zdarzenie, LF, UTF-8 bez BOM)
         tools/podgrodzie2/budynki.json          (budynki z wnętrzami: drzwi, kratka przed drzwiami, mapa wnętrza, wygląd)
         tools/podgrodzie2/mapowanie.json        (bloki: stary prostokąt -> przesunięcie; zdarzenia: id -> stare/nowe x,y;
                                                  usunięte; miejsca; punkty wtyczek; nowe prostokąty: ogródki, wysypisko,
                                                  glinianka, działka, place orła)
         docs/podgrodzie/nowe_podgrodzie*.png    (rendery)
         img/characters/!$Pod_*.png              (tylko gdy ich nie ma: piec garncarski, kocioł, kurnik, chlewik - kopie
                                                  obrazków budynków Farming z img/system w układzie arkusza postaci)

Plan zaakceptowany przez użytkownika: docs/podgrodzie/plan_nowe_podgrodzie.png (tools/podgrodzie2/plan.py), decyzje:
docs/podgrodzie/NOWE_PODGRODZIE.md. Wzór roboty: tools/miasto2/build.py (nowe miasto, ten sam dzień).

Jak: czyta data/Map111.json i data/Map008.json (TYLKO odczyt). Czyści rzędy 0..66 (osada w palisadzie, pas lasu na północy
i zachodzie, pas pod palisadą, pas między palisadą a murem miasta), maluje grunt (trawa, ubita ziemia dróg i placyku),
przenosi stare chaty kafelek w kafelek (warstwy 0-5: kafle, cienie, regiony) razem z ich zdarzeniami (numery zostają),
stawia mur miasta z kolumn zachodniego muru nowego Map008 (x 0-1, rzędy 33..102 -> x 90-91, rzędy 0..69, brama w rzędach
17-18 = rzędy 50-51 Map008), palisadę (A2 k38) z trzema bramami, nowe budynki z kawałków autora (dach A3 nad niską ścianą
z bali / desek / gliny, okna B, kominy, przybudówki - jak stare chaty Podgrodzia, tools/podgrodzie/plib.py), ogródki,
zagrody, drobiazgi, latarnie (ogień), „Miejsce: <klucz>” dla TownLife, regiony RegionLayers (2 na budynkach i palisadzie)
i region 31 (lądowanie orła) na placyku i drogach. Chatę pod lasem z działką (region 8) przenosi za palisadę, do lasu.
Teren generowany poza osadą zostaje (las, polany); drogi, glinianka, wysypisko i działka są w nim wycięte.
Niczego nie zapisuje do data/ ani js/.
"""
import os, sys, json, copy, random, math, collections, argparse

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..")).replace("\\", "/") + "/"
sys.path.insert(0, ROOT + "tools/mapy")
sys.path.insert(0, ROOT + "tools/newstart")
sys.path.insert(0, ROOT + "tools/podgrodzie")
sys.path.insert(0, ROOT + "tools/town")
import mapylib as L
import nslib as N
import plib as P            # tylko stałe i polecenia (THINGS, CLUMPS, ROOF, WALL, popup_cmds, text_cmds) - nic nie buduje
import build_town_props as TP

W, H = 92, 112
MAP_ID = 111
STAGING = os.path.join(HERE, "staging")
DOCS = ROOT + "docs/podgrodzie/"

OLD = L.load_json(ROOT + "data/Map111.json")
OD = OLD["data"]
assert OLD["width"] == W and OLD["height"] == H
TOWN = L.load_json(ROOT + "data/Map008.json")
TW, TH, TD = TOWN["width"], TOWN["height"], TOWN["data"]
TOWN_ROW_OFF = 33            # rząd Map111 + 33 = rząd Map008 (brama: 17-18 tu = 50-51 tam)


def oid(z, x, y):
    return OD[(z * H + y) * W + x]


def tid(z, x, y):
    return TD[(z * TH + y) * TW + x]


# ------------------------------------------------------------------------------------------------ rodzaje autokafli (A2)
TRAWA, ZIEMIA, TRAWA_JASNA = 16, 17, 27
KEPKI, MIEKKA, SUCHA, KAMYKI, BLOTO, KAMIENIE, KWIATKI = 21, 31, 39, 47, 26, 23, 29
ZYWOPLOT = 20               # „poszycie lasu” (blokuje) - pas lasu
PLOT = 22                   # niski płot z żerdzi (ogródki, zagrody)
PALISADA = 38               # palisada z pionowych bali (blokuje)
ROOF, WALL = P.ROOF, P.WALL
GLINA = 89                  # A4: glina (polepa) w ramie z belek (lepianki)


def A(kind, shape=0):
    return 2048 + kind * 48 + shape


def kind_of(t):
    return (t - 2048) // 48 if t >= 2048 else None


Bt, Ct, Dt, Et = N.B, N.C, N.D, N.E


def rect(x0, y0, x1, y1):
    return [(x, y) for y in range(y0, y1 + 1) for x in range(x0, x1 + 1)]


def noise(x, y, seed):
    return N.noise(x, y, seed)


# ================================================================================================ budowa
class Budowa:
    def __init__(self, seed):
        self.d = list(OD)
        self.tag = [["stary"] * W for _ in range(H)]
        self.res = set()
        self.ev = {}
        self.pool = {}
        self.ev_map = {}
        self.bloki = []
        self.nowe_ids = []
        self.rnd = random.Random(seed)
        self.ntag = 0
        self.zajete = set()          # kratki zajęte przez nowe rzeczy, przejścia i miejsca (dekoracje omijają)
        self.uzyte_ids = set()
        for e in OLD["events"]:
            if e: self.ev[e["id"]] = copy.deepcopy(e)
        self.stare_ids = set(self.ev)
        self.budynki = []
        self.usuniete_powod = {}
        self.miejsca = {}
        self.strefy = {}
        self.drogi = set()           # kratki dróg i placyku (region 31, chodzenie)
        self.sciezki = set()         # ścieżki na podwórkach i do drzwi
        self.podworka = {}
        self.budynki_wszystkie = []
        self.swiatla = []

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

    def wyczysc(self, cells, powod):
        cells = set(cells)
        for (x, y) in cells:
            if not (0 <= x < W and 0 <= y < H): continue
            for z in range(6): self.s(z, x, y, 0)
            self.s(0, x, y, A(TRAWA)); self.res.add((0, x, y))
            self.tag[y][x] = "grunt"
        for eid, e in list(self.ev.items()):
            if (e["x"], e["y"]) in cells and eid not in self.nowe_ids and eid not in self.ev_map:
                self.pool[eid] = self.ev.pop(eid)
                self.usuniete_powod.setdefault(eid, powod)

    def maluj(self, z, cells, kind, tag="grunt"):
        for (x, y) in cells:
            if not (0 <= x < W and 0 <= y < H): continue
            self.s(z, x, y, A(kind), tag)
            self.res.add((z, x, y))

    def zmaz(self, z, cells):
        for (x, y) in cells:
            self.s(z, x, y, 0)
            self.res.discard((z, x, y))

    def kafel(self, z, x, y, t, tag=None):
        self.s(z, x, y, t, tag)
        self.res.discard((z, x, y))

    def wolna_warstwa(self, x, y):
        for z in (2, 3):
            if not self.g(z, x, y): return z
        return None

    def tl(self, x, y, t, z=None):
        """kafel B-E na warstwie z (domyślnie 2, gdy wolna, inaczej 3)"""
        zz = z or self.wolna_warstwa(x, y)
        assert zz, "brak wolnej warstwy na (%d,%d)" % (x, y)
        self.kafel(zz, x, y, t)

    def region(self, x, y, v):
        self.s(5, x, y, v)

    # ---- bloki starej mapy
    def kopiuj(self, nazwa, prostokaty, dx, dy, bez_ziemi=(), pomin=(), tylko=None):
        """prostokąty starej mapy (włącznie) kafelek w kafelek przesunięte o (dx, dy); warstwa 1 „poszycie lasu” (k20) nie idzie
        (stare pasy lasu wokół osady), bez_ziemi: stare prostokąty, w których ubita ziemia / nakładki dróg stają się trawą;
        zdarzenia z prostokątów (z puli wyczyszczonego obszaru) idą razem z blokiem (poza drzewami ozdobnymi i pomin)"""
        tag = self.nowy_tag(nazwa)
        cells = set()
        for (x0, y0, x1, y1) in prostokaty:
            cells |= set(rect(x0, y0, x1, y1))
        bz = set()
        for r in bez_ziemi: bz |= set(rect(*r))
        for (ox, oy) in sorted(cells):
            x, y = ox + dx, oy + dy
            if not (0 <= x < W and 0 <= y < H): continue
            for z in range(6):
                v = oid(z, ox, oy)
                if z == 1 and v >= 2048 and kind_of(v) == ZYWOPLOT: v = 0
                if (ox, oy) in bz:
                    if z == 0 and v >= 2048 and kind_of(v) == ZIEMIA: v = A(TRAWA)
                    if z == 1 and v >= 2048 and kind_of(v) in (KAMYKI, BLOTO, SUCHA): v = 0
                self.s(z, x, y, v)
                self.res.discard((z, x, y))
                if z in (0, 1) and (ox, oy) in bz and v >= 2048: self.res.add((z, x, y))
            self.tag[y][x] = tag
        moved = []
        for eid in sorted(self.pool):
            e = self.pool[eid]
            if eid in pomin: continue
            if tylko is not None and eid not in tylko: continue
            if (e["x"], e["y"]) not in cells: continue
            if e["name"] == "Drzewo" or e["name"].startswith("Drzewo"): continue
            self.przenies(eid, e["x"] + dx, e["y"] + dy, nazwa)
            moved.append(eid)
        xs = [c[0] for c in cells]; ys = [c[1] for c in cells]
        self.bloki.append({"blok": nazwa, "stary": [min(xs), min(ys), max(xs), max(ys)],
                           "prostokaty": [list(r) for r in prostokaty], "dx": dx, "dy": dy,
                           "nowy": [min(xs) + dx, min(ys) + dy, max(xs) + dx, max(ys) + dy], "zdarzenia": moved})
        return tag

    def przenies(self, eid, x, y, blok):
        e = self.pool.pop(eid)
        ox, oy = e["x"], e["y"]
        e["x"], e["y"] = x, y
        self.ev[eid] = e
        self.ev_map[eid] = {"nazwa": e["name"], "stare": [ox, oy], "nowe": [x, y], "blok": blok}
        self.usuniete_powod.pop(eid, None)

    def przesun_zd(self, eid, x, y, blok="ręcznie"):
        if eid in self.pool:
            self.przenies(eid, x, y, blok)
            return
        e = self.ev[eid]
        if eid not in self.ev_map:
            self.ev_map[eid] = {"nazwa": e["name"], "stare": [e["x"], e["y"]], "nowe": [x, y], "blok": blok}
        e["x"], e["y"] = x, y
        self.ev_map[eid]["nowe"] = [x, y]

    # ---- zdarzenia
    def wolne_id(self):
        """najpierw numery, których stara mapa nigdy nie miała; potem numery usuniętych ozdób bez notatek i poleceń"""
        for i in range(1, 500):
            if i not in self.stare_ids and i not in self.uzyte_ids and i not in self.ev:
                return i
        for i in range(1, 500):
            if i in self.ev or i in self.uzyte_ids: continue
            e = self.pool.get(i)
            if e is not None and not e.get("note") and not any(c["code"] != 0 for p in e["pages"] for c in p["list"]):
                return i
        raise RuntimeError("brak wolnych numerów zdarzeń 1-499")

    def dodaj(self, name, x, y, pages, note=""):
        eid = self.wolne_id()
        if eid in self.pool:
            self.pool.pop(eid)
        self.uzyte_ids.add(eid)
        self.ev[eid] = {"id": eid, "name": name, "note": note, "pages": pages, "x": x, "y": y}
        self.nowe_ids.append(eid)
        return eid

    def obraz(self, name, x, y, char, index=0, direction=2, pattern=0, prio=1, through=False, note="", cmds=None, trigger=0,
              step=False, move=0):
        pg = N.blank_page(priority=prio, trigger=trigger, image={"characterName": char, "characterIndex": index,
                          "direction": direction, "pattern": pattern}, through=through, cmds=cmds, step=step, direction_fix=move == 0)
        if move:
            pg["moveType"], pg["moveFrequency"], pg["moveSpeed"], pg["walkAnime"] = move, 2, 2, True
        return self.dodaj(name, x, y, [pg], note)

    def miejsce(self, klucz, x, y, d=2):
        if klucz in self.miejsca:
            raise RuntimeError("miejsce %s dwa razy" % klucz)
        pg = N.blank_page(priority=0, through=True)
        pg["image"]["direction"] = d
        self.dodaj("Miejsce: " + klucz, x, y, [pg])
        self.miejsca[klucz] = (x, y, d)
        self.zajete.add((x, y))

    # ---- zapis
    def wynik(self):
        self.przelicz_ksztalty()
        props = {k: v for k, v in OLD.items() if k not in ("data", "events")}
        mx = max(self.ev)
        events = [None] * (mx + 1)
        for eid, e in self.ev.items():
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
                for ddy in (-1, 0, 1):
                    for ddx in (-1, 0, 1):
                        nx, ny = x + ddx, y + ddy
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
            if k < 16: continue

            def same(ddx, ddy, z=z, x=x, y=y, k=k):
                nx, ny = x + ddx, y + ddy
                if nx < 0 or ny < 0 or nx >= W or ny >= H: return True
                t2 = self.g(z, nx, ny)
                return t2 >= 2048 and kind_of(t2) == k
            shape = N.wall_shape(same) if N.is_wall_kind(k) else N.floor_shape(same)
            new[(z, x, y)] = 2048 + k * 48 + shape
        for (z, x, y), v in new.items():
            self.d[(z * H + y) * W + x] = v


# ================================================================================================ strony zdarzeń
def strona_drzwi(mapa, tx, ty, godziny, obraz):
    """drzwi jak ev 3 (godziny -> wejście, poza nimi popup „Zamknięte.”) albo jak ev 8 (godziny None: zawsze otwarte)"""
    wzor = OLD["events"][8 if godziny is None else 3]
    pg = copy.deepcopy(wzor["pages"][0])
    for c in pg["list"]:
        if c["code"] == 201:
            c["parameters"] = [0, mapa, tx, ty, 8, 0]
        if c["code"] == 111 and c["parameters"][0] == 12:
            c["parameters"][1] = ("(function(h){ return h >= %d && h < %d; })($gameSystem.dayNightHour ? $gameSystem.dayNightHour() : 12)"
                                  % godziny)
    pg["image"] = {"tileId": 0, "characterName": obraz[0], "direction": 2, "pattern": 0, "characterIndex": obraz[1]}
    pg["priorityType"], pg["trigger"], pg["through"], pg["directionFix"] = 1, 1, False, True
    return pg


GODZINY = (6, 21)


def lampa(b, x, y, nazwa="Latarnia"):
    """latarnia na słupie (jak ev 18 przy bramie): słup C(7,14..15) na (x, y-1..y), płomień !Decoration 7 nocą"""
    b.kafel(3, x, y - 1, Ct(7, 14)); b.kafel(2, x, y, Ct(7, 15))
    note = "<Light:150,90,62,24><LightWhen:night>"
    eid = b.obraz(nazwa, x, y - 1, "!Decoration", 7, 2, 0, prio=2, through=True, note=note)
    b.zajete.update({(x, y), (x, y - 1)})
    b.swiatla.append({"nazwa": nazwa, "x": x, "y": y - 1, "notatka": note})
    return eid


def drzewo(b, x, y, rodzaj="okragle", nazwa="Drzewo"):
    d, p = {"okragle": (4, 2), "sosna": (2, 2), "sosna_b": (4, 1), "krzew": (4, 0)}[rodzaj]
    b.zajete.add((x, y))
    return b.obraz(nazwa, x, y, "!$Big_Trees_green", 0, d, p, prio=1)


def rzecz(b, nazwa, x, y, ch, i, d, p, prio=1, occ=None, through=False, note=""):
    if occ:
        note = "<Occupy:%s>" % ",".join("%s=%d" % kv for kv in occ.items() if kv[1]) + note
    return b.obraz(nazwa, x, y, ch, i, d, p, prio=prio, note=note, through=through)


def thing(b, nazwa, x, y, z=None):
    """rzecz z arkusza C (plib.THINGS) stojąca lewym dolnym rogiem na (x, y)"""
    c, r, w, h = P.THINGS[nazwa]
    for j in range(h):
        for i in range(w):
            b.tl(x + i, y - h + 1 + j, Ct(c + i, r + j), z)
            b.zajete.add((x + i, y - h + 1 + j))
    return [(x + i, y) for i in range(w)]


def kepka(b, nazwa, x, y):
    c, r = P.CLUMPS[nazwa]
    if b.g(2, x, y) or b.g(3, x, y): return False
    b.kafel(2, x, y, Dt(c, r))
    return True


def town_prop(b, nazwa, x, y, label=None, cmds=None):
    i = TP.INDEX[nazwa]
    k, d, p = TP.image_of(i)
    walk = TP.walkable(nazwa)
    pg = N.blank_page(priority=0 if walk else 1, trigger=0, image={"characterName": "!Town_Props", "characterIndex": k,
                      "direction": d, "pattern": p}, through=walk, cmds=cmds, direction_fix=True)
    eid = b.dodaj(label or nazwa, x, y, [pg], TP.occupy_note(nazwa))
    for c in TP.footprint(nazwa, x, y): b.zajete.add(c)
    b.zajete.add((x, y))
    return eid


# ================================================================================================ nowe obrazki (Farming -> arkusz postaci)
OBRAZKI = {   # nazwa arkusza: (plik img/system, opis)
    "!$Pod_Piec": ("Farm_Kiln_L", "piec garncarski (gliniany, z ogniem) - obrazek pieca ziemnego Farming"),
    "!$Pod_Kociol": ("Farm_Cauldron_L", "kocioł na trójnogu nad ogniem - obrazek kotła Farming"),
    "!$Pod_Kurnik": ("Farm_Coop_L", "kurnik z desek - obrazek kurnika Farming"),
    "!$Pod_Chlewik": ("Farm_Pen_L", "wiata kryta strzechą z sianem (chlewik / koziarnia) - obrazek zagrody Farming"),
}


def obrazki():
    """arkusze !$ (3 x 4 klatki po 144 x 144, ten sam obrazek w każdej klatce, przy dolnej krawędzi, na środku); tylko gdy
    pliku nie ma - nic nie nadpisujemy"""
    from PIL import Image
    zrobione = []
    for nazwa, (src, _) in OBRAZKI.items():
        out = ROOT + "img/characters/%s.png" % nazwa
        if os.path.exists(out): continue
        im = Image.open(ROOT + "img/system/%s.png" % src).convert("RGBA")
        fw, fh = 144, 144
        sheet = Image.new("RGBA", (fw * 3, fh * 4), (0, 0, 0, 0))
        for r in range(4):
            for c in range(3):
                sheet.alpha_composite(im, (c * fw + (fw - im.size[0]) // 2, r * fh + fh - im.size[1]))
        sheet.save(out)
        zrobione.append(out)
    return zrobione


# ================================================================================================ UKŁAD
PAL = (3, 3, 85, 64)                      # palisada: pierścień kratek (x0, y0, x1, y1)
BRAMY = {"zach": [(3, 18), (3, 19), (3, 20)], "wsch": [(85, 18), (85, 19), (85, 20)], "pd": [(40, 64), (41, 64), (42, 64)]}
MUR_X = 90                                # kolumny muru miasta: 90-91
PLACYK = (36, 24, 55, 40)
OSADA = (0, 0, 91, 66)                    # obszar czyszczony w całości

# stare bloki: nazwa, prostokąty starej mapy, dx, dy, bez_ziemi (stare prostokąty dróg -> trawa)
STARE_BLOKI = [
    ("chata_drwala", [(1, 2, 11, 12), (12, 11, 13, 12)], 3, 3, []),
    ("chata_pod_strzecha", [(12, 3, 19, 10)], 6, 4, [(12, 10, 19, 10)]),
    ("dom_uchodzcow_i_oboz", [(29, 2, 42, 12), (28, 2, 28, 10), (26, 7, 27, 10), (33, 13, 33, 13)], 1, 4, [(32, 11, 35, 12)]),
    ("kram_starzyzny", [(20, 7, 25, 14), (26, 11, 28, 14), (18, 11, 19, 14)], 27, 16, [(18, 14, 28, 14)]),
    ("chalupa_z_desek", [(10, 13, 17, 17)], 4, 11, []),
    ("chata_klusownika", [(1, 21, 7, 28)], 4, 2, [(1, 21, 7, 21)]),
    ("izba_znachorki", [(12, 20, 16, 27), (17, 22, 22, 27)], 12, 5, [(12, 20, 23, 22), (21, 23, 23, 24)]),
    ("kapliczka", [(24, 22, 27, 25)], 11, 4, []),
    ("chata_praczki", [(31, 20, 37, 25), (29, 26, 39, 30)], 28, 4, [(36, 20, 37, 25), (37, 21, 39, 25)]),
    ("szopa", [(8, 20, 11, 27)], 61, 3, [(8, 20, 11, 22)]),
    ("komorka", [(38, 21, 43, 25)], 39, 4, []),
    ("brama_zebrak", [(43, 10, 43, 21), (40, 13, 42, 21)], 46, 0, []),
    ("ogrod_strzechy", [(20, 2, 27, 6)], 39, 48, []),
    ("ogrod_deski", [(2, 13, 9, 17)], 67, 37, []),
    ("chata_pod_lasem_z_dzialka", [(2, 35, 36, 51)], 2, 40, []),
]
HUT = dict(dx=2, dy=40)

# nowe budynki (klucz, nazwa, x, y, w, rząd dachu, rząd ściany, dach, ściana, drzwi (kolumna), obraz drzwi, okna, komin,
# styl komina, lukarna, bluszcz, przybudówka, wypełnienie, mapa wnętrza, godziny, opis wyglądu)
NOWE = [
    dict(klucz="przytulek", nazwa="Przytułek", x=47, y=7, w=12, rh=4, wh=2, dach="planks", sciana="boards", drzwi=6,
         obraz=("!Fantasy_door1", 0), okna=[(1, "board"), (3, "shut"), (8, "shut"), (11, "tiny")], komin=9, styl=5,
         lukarna=None, bluszcz=(), przyb="left", wyp="barrel", mapa=202, godziny=None,
         wyglad="długi dom z desek (dach z desek A3 k64, ściana z desek A3 k75), przybudówka, kocioł na trójnogu przed wejściem"),
    dict(klucz="szynk", nazwa="Szynk", x=76, y=6, w=8, rh=4, wh=2, dach="shingle_brown", sciana="logs", drzwi=3,
         obraz=("!Fantasy_door1", 2), okna=[(1, "wood_lit"), (5, "shut_lit")], komin=6, styl=4,
         lukarna=(2, 0), bluszcz=(0,), przyb=None, wyp=None, mapa=201, godziny=(10, 23),
         wyglad="drewniany dom z bali, gont, szyld z kuflem (!Signs 2/6/1) na wysięgniku, ławy i stół przed wejściem"),
    dict(klucz="garncarnia", nazwa="Garncarnia", x=46, y=45, w=7, rh=4, wh=2, dach="straw", sciana="logs", drzwi=3,
         obraz=("!Fantasy_door1", 2), okna=[(1, "wood"), (5, "wood")], komin=5, styl=3,
         lukarna=None, bluszcz=(), przyb="left", wyp="logs", mapa=203, godziny=GODZINY,
         wyglad="chata z bali pod strzechą, piec garncarski z gliny (!$Pod_Piec) z boku, stoły z dzbanami przed wejściem"),
    dict(klucz="lepianka1", nazwa="Lepianka 1", x=5, y=39, w=6, rh=3, wh=2, dach="straw", sciana=GLINA, drzwi=2,
         obraz=("!Fantasy_door1", 0), okna=[(4, "tiny")], komin=4, styl=3,
         lukarna=None, bluszcz=(), przyb=None, wyp=None, mapa=204, godziny=GODZINY,
         wyglad="lepianka: ściana z gliny w ramie z belek (A4 k89), strzecha"),
    dict(klucz="lepianka2", nazwa="Lepianka 2", x=14, y=39, w=6, rh=3, wh=2, dach="thatch", sciana=GLINA, drzwi=3,
         obraz=("!Fantasy_door1", 6), okna=[(1, "tiny")], komin=1, styl=3,
         lukarna=None, bluszcz=(5,), przyb=None, wyp=None, mapa=205, godziny=GODZINY,
         wyglad="lepianka: ściana z gliny w ramie z belek (A4 k89), ciemna strzecha"),
    dict(klucz="chata3", nazwa="Chata 3", x=23, y=39, w=7, rh=3, wh=2, dach="shingle", sciana="logs", drzwi=3,
         obraz=("!Fantasy_door1", 2), okna=[(1, "wood"), (5, "shut")], komin=1, styl=4,
         lukarna=None, bluszcz=(6,), przyb="right", wyp="logs", mapa=206, godziny=GODZINY,
         wyglad="chata z bali, gont, przybudówka z drewnem"),
    dict(klucz="chata4", nazwa="Chata 4", x=5, y=51, w=6, rh=3, wh=2, dach="planks_b", sciana="planks", drzwi=2,
         obraz=("!Fantasy_door1", 0), okna=[(4, "board")], komin=4, styl=5,
         lukarna=None, bluszcz=(), przyb=None, wyp=None, mapa=207, godziny=GODZINY,
         wyglad="chata z desek, dach z desek"),
    dict(klucz="chata5", nazwa="Chata 5", x=14, y=51, w=6, rh=3, wh=2, dach="straw", sciana="logs", drzwi=3,
         obraz=("!Fantasy_door1", 2), okna=[(1, "wood"), (5, "wood")], komin=1, styl=3,
         lukarna=None, bluszcz=(0,), przyb=None, wyp=None, mapa=208, godziny=GODZINY,
         wyglad="chata z bali pod strzechą"),
]
# drzwi dotąd zamknięte (zostają ich numery) -> wnętrza
STARE_ZAMKNIETE = [  # id, klucz, nazwa, mapa wnętrza, blok
    (4, "strzecha", "Chata pod strzechą", 209, "chata_pod_strzecha"),
    (9, "deski", "Chałupa z desek", 210, "chalupa_z_desek"),
    (12, "szopa", "Szopa", 211, "szopa"),
    (17, "komorka", "Komórka", 212, "komorka"),
]
STARE_DRZWI = [  # id, klucz, nazwa, blok
    (3, "drwal", "Chata drwala", "chata_drwala"), (6, "szmaciarz", "Kram starzyzny", "kram_starzyzny"),
    (8, "uchodzcy", "Dom uchodźców", "dom_uchodzcow_i_oboz"), (11, "klusownik", "Chata kłusownika", "chata_klusownika"),
    (14, "znachorka", "Izba znachorki", "izba_znachorki"), (16, "praczka", "Chata praczki", "chata_praczki"),
]

# Zasoby / Okolice (paczka A6): nowe prostokąty (uprawy, sterty, glinianka stawia wtyczka)
OGRODKI = {"ogrodek_1": (61, 10), "ogrodek_2": (66, 10), "ogrodek_3": (71, 10)}       # x, y (w 4, h 3)
OGRODKI_PLOT = (60, 9, 75, 13)
WYSYPISKO = (70, 68, 6, 4)
GLINIANKA = (46, 69, 5, 4)


# ================================================================================================ grunt
def lane(b, pts, width, kind=ZIEMIA, wobble=0.35, seed=5, tag="grunt"):
    cells = set()
    for (ax, ay), (bx, by) in zip(pts, pts[1:]):
        n = int(max(abs(bx - ax), abs(by - ay)) * 3) + 1
        for i in range(n + 1):
            t = i / n
            cx, cy = ax + (bx - ax) * t, ay + (by - ay) * t
            r = width / 2.0 + wobble * (noise(int(cx * 2), int(cy * 2), seed) - 0.5) * 2
            for y in range(int(cy - r - 1), int(cy + r + 2)):
                for x in range(int(cx - r - 1), int(cx + r + 2)):
                    if (x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= r * r and 0 <= x < W and 0 <= y < H:
                        cells.add((x, y))
    return cells


def blob(cx, cy, rx, ry, seed, rough=0.3):
    out = set()
    for y in range(int(cy - ry - 2), int(cy + ry + 3)):
        for x in range(int(cx - rx - 2), int(cx + rx + 3)):
            if not (0 <= x < W and 0 <= y < H): continue
            v = ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2
            if v <= 1 + rough * (noise(x, y, seed) - 0.5) * 2: out.add((x, y))
    return out


def ziemia(b, cells, tylko_grunt=True, droga=True):
    """ubita ziemia na warstwie 0 (tylko na kratkach gruntu - stare bloki i budynki zostają), nakładki zdjęte;
    droga=True: kratki liczą się jako droga (region 31, dekoracje omijają), inaczej ścieżka na podwórku"""
    n = 0
    for (x, y) in cells:
        if not (0 <= x < W and 0 <= y < H): continue
        if tylko_grunt and not b.tag[y][x].startswith("grunt"): continue
        if b.g(0, x, y) >= 4352: continue
        if b.g(1, x, y) >= 2048 and kind_of(b.g(1, x, y)) in (PLOT, PALISADA): continue
        b.s(0, x, y, A(ZIEMIA)); b.res.add((0, x, y))
        if b.g(1, x, y) >= 2048:
            b.s(1, x, y, 0); b.res.discard((1, x, y))
        (b.drogi if droga else b.sciezki).add((x, y))
        n += 1
    return n


def uklad_grunt(b):
    x0, y0, x1, y1 = OSADA
    b.wyczysc(rect(x0, y0, x1, y1), "drzewo/zasób/ozdoba w obrębie nowej osady")
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            if N.lowfreq(x, y, 31, 4.0) > 0.70: b.s(0, x, y, A(TRAWA_JASNA))


def czysc_poza(b, cells, powod, k20=True):
    """poza osadą (teren generowany): trawa, bez zdarzeń, bez poszycia lasu - pod drogi, glinianke, wysypisko"""
    cells = set(cells)
    for (x, y) in cells:
        if not (0 <= x < W and 0 <= y < H): continue
        for z in (1, 2, 3, 4): b.s(z, x, y, 0)
        b.res.discard((1, x, y))
        if b.g(0, x, y) < 2048 or kind_of(b.g(0, x, y)) not in (TRAWA, TRAWA_JASNA, ZIEMIA):
            b.s(0, x, y, A(TRAWA))
        b.res.add((0, x, y))
        b.tag[y][x] = "grunt"
        for (ddx, ddy) in ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (-1, -1), (1, -1), (-1, 1)):
            nx, ny = x + ddx, y + ddy
            if 0 <= nx < W and 0 <= ny < H and b.g(1, nx, ny) >= 2048: b.res.add((1, nx, ny))
    for eid, e in list(b.ev.items()):
        if (e["x"], e["y"]) in cells and eid not in b.nowe_ids and eid not in b.ev_map:
            b.pool[eid] = b.ev.pop(eid)
            b.usuniete_powod.setdefault(eid, powod)


# ================================================================================================ mur miasta, palisada, las
def mur_miasta(b):
    """kolumny zachodniego muru nowego Map008 (x 0-1, rzędy 33..102) -> x 90-91, rzędy 0..69 (bez zdarzeń Map008)"""
    t = b.nowy_tag("mur_miasta")
    for r in range(0, 70):
        ty = r + TOWN_ROW_OFF
        for i in range(2):
            x = MUR_X + i
            for z in range(6):
                b.s(z, x, r, tid(z, i, ty))
                b.res.discard((z, x, r))
            b.tag[r][x] = t
    # stopa muru od strony Podgrodzia: kamienie z mchem i kępki (bez bramy)
    for r in range(0, 70):
        if r in (16, 17, 18, 19, 20): continue
        if b.g(5, 89, r) or b.g(2, 89, r) or b.g(3, 89, r): continue
        v = noise(89, r, 3)
        if v < 0.6: b.maluj(1, [(89, r)], KAMIENIE if v < 0.35 else KEPKI)
    b.strefy["mur_miasta"] = {"x": [MUR_X, MUR_X + 1], "rzedy": [0, 69], "zrodlo": "Map008 x 0-1, rzędy 33..102",
                              "brama": [[MUR_X, 17], [MUR_X, 18], [MUR_X + 1, 17], [MUR_X + 1, 18]]}


def palisada(b):
    x0, y0, x1, y1 = PAL
    ring = [c for c in rect(x0, y0, x1, y1) if c[0] in (x0, x1) or c[1] in (y0, y1)]
    bramy = {c for v in BRAMY.values() for c in v}
    ring = [c for c in ring if c not in bramy]
    b.maluj(1, ring, PALISADA, tag="grunt_palisada")
    for (x, y) in ring:
        b.region(x, y, 2)
        b.zajete.add((x, y))
    for c in bramy:
        b.zajete.add(c)
    b.strefy["palisada"] = {"pierscien": list(PAL), "bramy": {k: [list(c) for c in v] for k, v in BRAMY.items()},
                            "kafel": "A2 k38 (pionowe bale) na warstwie 1, region 2"}


def pas_lasu(b):
    """las za palisadą: na północy (rzędy 0-2) i na zachodzie (x 0-2), poza drogą do Przystani (rzędy 18-20)"""
    pas = set()
    for (x, y) in rect(0, 0, 89, 2) + rect(0, 0, 2, 66):
        if 16 <= y <= 22 and x <= 2: continue
        pas.add((x, y))
    b.maluj(1, sorted(pas), ZYWOPLOT, tag="grunt_las")
    drzewa = [(x, 1, "sosna" if (x // 4) % 2 else "okragle") for x in range(1, 89, 4)]
    drzewa += [(1, y, "sosna_b" if (y // 4) % 2 else "sosna") for y in range(5, 66, 4) if not 15 <= y <= 23]
    for (x, y, k) in drzewa:
        drzewo(b, x, y, k)
    b.strefy["pas_lasu"] = "rzędy 0-2 (x 0-89) i kolumny 0-2 (rzędy 0-66) poza drogą do Przystani (rzędy 17-21)"


# ================================================================================================ budynki
def chata(b, d):
    """dom z kawałków autora (jak tools/podgrodzie/plib.py Pod.house): dach A3 (rh rzędów) nad ścianą (wh rzędów), okna B,
    bluszcz, komin z dymem, lukarna, przybudówka B(10..11, 9..12), cienie; zwraca prostokąt i kratkę drzwi"""
    x, y, w = d["x"], d["y"], d["w"]
    rk = ROOF.get(d["dach"], d["dach"])
    wk = WALL.get(d["sciana"], d["sciana"]) if isinstance(d["sciana"], str) else d["sciana"]
    wt = y + d["rh"]
    yb = wt + d["wh"] - 1
    tag = b.nowy_tag(d["klucz"])
    b.maluj(0, rect(x, y, x + w - 1, wt - 1), rk, tag=tag)
    b.maluj(0, rect(x, wt, x + w - 1, yb), wk, tag=tag)
    for c in rect(x, y, x + w - 1, yb):
        b.zmaz(1, [c]); b.s(2, c[0], c[1], 0); b.s(3, c[0], c[1], 0)
    for col, styl in d["okna"]:
        cx = x + col
        if styl in ("wood", "wood_lit"):
            bc = 1 if styl == "wood" else 2
            b.tl(cx, wt, Bt(bc, 0), 2); b.tl(cx, wt + 1, Bt(bc, 1), 2)
        elif styl in ("shut", "shut_lit", "open"):
            bc = {"shut": 4, "shut_lit": 6, "open": 0}[styl]
            for i in range(2):
                b.tl(cx + i, wt, Bt(bc + i, 2), 2); b.tl(cx + i, wt + 1, Bt(bc + i, 3), 2)
        elif styl == "board":
            b.tl(cx, wt, Bt(1, 7), 2)
        elif styl == "tiny":
            b.tl(cx, wt, Bt(1, 6), 2)
    for col in d["bluszcz"]:
        kinds = [(3, 12), (5, 12), (6, 12), (2, 12), (1, 12)]
        k = kinds[(x + col + y) % len(kinds)]
        b.tl(x + col, wt, Bt(k[0], 12), 3); b.tl(x + col, wt + 1, Bt(k[0], 13), 3)
    if d["komin"] is not None:
        cx = x + d["komin"]
        b.tl(cx, y - 1, Bt(d["styl"], 10), 3); b.tl(cx, y, Bt(d["styl"], 11), 3)
        b.region(cx, y - 1, 2)
        b.obraz("Dym z komina", cx, y - 1, "!Fantasy_chimney", 0, 2, (x + y) % 3, prio=2, through=True, step=True)
    if d["lukarna"]:
        dc, di = d["lukarna"]
        b.obraz("Okienko w dachu", x + dc, y + max(1, d["rh"] - 2), "!Roof_Windows", di, 2, 0, prio=1)
    lx = None
    if d["przyb"]:
        lx = x + w if d["przyb"] == "right" else x - 1
        col = 11 if d["przyb"] == "right" else 10
        for j in range(4):
            b.tl(lx, yb - 3 + j, Bt(col, 9 + j), 3)
        if d["wyp"] == "hay":
            b.tl(lx, yb - 1, Ct(15, 10), 2); b.tl(lx, yb, Ct(15, 11), 2)
        elif d["wyp"] == "logs":
            b.tl(lx, yb - 1, Ct(13, 4), 2); b.tl(lx, yb, Ct(11, 5), 2)
        elif d["wyp"] == "barrel":
            b.tl(lx, yb - 1, Ct(4, 8), 2); b.tl(lx, yb, Ct(4, 9), 2)
        for j in range(4): b.region(lx, yb - 3 + j, 2)
    # cienie: lewa połowa kratek na prawo od domu (pod okapem), całe kratki pod daszkiem przybudówki
    sx = x + w
    if d["przyb"] == "right":
        for j in range(3): b.s(4, lx, yb - 2 + j, 15)
        b.s(4, lx, yb - 3, 4)
        sx = lx + 1
        rows = range(yb - 2, yb + 1)
    else:
        if d["przyb"] == "left":
            for j in range(3): b.s(4, lx, yb - 2 + j, 15)
        rows = range(y + 1, yb + 1)
    for i, yy in enumerate(rows):
        if b.g(0, sx, yy) < 4352: b.s(4, sx, yy, 4 if i == 0 else 5)
    prost = [x if d["przyb"] != "left" else x - 1, y - 1, x + w - 1 if d["przyb"] != "right" else x + w, yb]
    for c in rect(prost[0], prost[1], prost[2], prost[3] + 1): b.zajete.add(c)
    return prost, (x + d["drzwi"], yb)


def regiony_budynku(b, x0, y0, x1, y1, wolne=()):
    """reguły tools/town/paint_layers.py (jak tools/miasto2/build.py): A3/A4 na warstwie 0 -> region 2, pas gwiazdek pod
    dachem nad ścianą, stopa fasady z obrazkami; wolne: kratki przed drzwiami"""
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


def nowe_budynki(b):
    for d in NOWE:
        prost, (dx_, dy_) = chata(b, d)
        eid = b.dodaj("Drzwi: " + d["nazwa"], dx_, dy_, [strona_drzwi(d["mapa"], 1, 1, d["godziny"], d["obraz"])],
                      "<Town:door=%s>" % d["klucz"])
        b.budynki.append({"klucz": d["klucz"], "nazwa": d["nazwa"], "prostokat": prost, "drzwi_id": eid, "drzwi": [dx_, dy_],
                          "przed_drzwiami": [dx_, dy_ + 1], "wnetrze": d["mapa"], "wnetrze_xy": [1, 1],
                          "prefabrykat": "plib-style chata: " + d["wyglad"], "nowy": True,
                          "godziny": list(d["godziny"]) if d["godziny"] else None, "zawsze_otwarte": d["godziny"] is None,
                          "wymiary": {"szer": d["w"], "dach_rzedy": d["rh"], "sciana_rzedy": d["wh"]}})
        b.zajete.add((dx_, dy_ + 1)); b.zajete.add((dx_, dy_ + 2))
        regiony_budynku(b, prost[0], prost[1], prost[2], prost[3], wolne=[(dx_, dy_ + 1)])


def stare_zamkniete_drzwi(b, bl):
    """ev 4, 9, 12, 17: dotąd „Drzwi (zamknięte)” z popupem -> zwykłe drzwi z <Town:door=klucz>, godziny 6-21, wnętrze
    (miejsce zastępcze 1,1 - łączy koordynator / wnetrza/meta.json)"""
    for (eid, klucz, nazwa, mapa, blok) in STARE_ZAMKNIETE:
        e = b.ev[eid]
        im = e["pages"][0]["image"]
        e["name"] = "Drzwi: " + nazwa
        e["note"] = "<Town:door=%s>" % klucz
        e["pages"] = [strona_drzwi(mapa, 1, 1, GODZINY, (im["characterName"], im["characterIndex"]))]
        b.budynki.append({"klucz": klucz, "nazwa": nazwa, "prostokat": bl[blok]["nowy"], "drzwi_id": eid, "drzwi": [e["x"], e["y"]],
                          "przed_drzwiami": [e["x"], e["y"] + 1], "wnetrze": mapa, "wnetrze_xy": [1, 1],
                          "prefabrykat": "przeniesiony blok starej mapy: " + blok + " (dotąd zamknięte, teraz z wnętrzem)",
                          "nowy": True, "godziny": list(GODZINY), "zawsze_otwarte": False, "stare_drzwi": b.ev_map[eid]["stare"]})


# ================================================================================================ stare bloki
def uklad_bloki(b):
    for (nazwa, prost, dx, dy, bz) in STARE_BLOKI:
        b.kopiuj(nazwa, prost, dx, dy, bez_ziemi=bz)
    bl = {x["blok"]: x for x in b.bloki}
    # zdarzenia poza blokami, przenoszone ręcznie (numery zostają)
    b.przesun_zd(89, 91, 19, "brama miasta (+46)")        # dach i słupy drewnianej bramy
    b.przesun_zd(90, 90, 18, "brama miasta (+46)")        # skrzydło i cień
    b.przesun_zd(91, 91, 16, "brama miasta (+46)")        # światło latarni bramy
    b.przesun_zd(19, 90, 13, "brama miasta (+46)")        # pochodnia na baszcie
    for eid in (65, 66, 92):                              # przejścia: te same kratki
        e = b.pool[eid]
        b.przenies(eid, e["x"], e["y"], "bez zmian (brzeg mapy)")
    return bl


def uchodzcy_dodatki(b):
    """daszek nad posłaniem 23 (dawniej przy murze miasta - mur jest teraz na wschodnim brzegu): wolnostojący daszek
    B(10..11, 9..12) na x 43-44, słupy w rzędzie 11"""
    x, yb = 43, 11
    for j in range(4):
        b.tl(x, yb - 3 + j, Bt(10, 9 + j), 3); b.tl(x + 1, yb - 3 + j, Bt(11, 9 + j), 3)
    for j in range(3):
        b.s(4, x, yb - 2 + j, 15); b.s(4, x + 1, yb - 2 + j, 15)
    for j in range(2): b.region(x + 1, yb - 3 + j, 2); b.region(x, yb - 3 + j, 2)
    for c in rect(x, yb - 3, x + 1, yb): b.zajete.add(c)
    # kratki rekwizytów W6 (TownQuests: namiot 903 i Bogdan 906 w obozie za murem) - bez starych drobiazgów pod nimi
    for (cx, cy) in ((42, 11), (38, 12)):
        b.s(2, cx, cy, 0); b.s(3, cx, cy, 0)


# ================================================================================================ drogi, placyk, plac zabaw
def drogi(b):
    """drogi o wyraźnych, prostych brzegach (ubita ziemia A2 k17 z trawiastym obrzeżem): główna 3 kratki z koleinami
    (brama zachodnia - brama miasta), droga na południe 3 kratki, uliczki 2 kratki; ścieżki do drzwi budynków publicznych"""
    D = set()
    D |= set(rect(0, 18, 85, 20))                                    # główna (przy bramie miasta: ziemia bloku bramy)
    D |= set(rect(40, 21, 42, 23)) | set(rect(40, 41, 42, 64))       # na południe (przez placyk - bruk)
    D |= set(rect(4, 36, 39, 37)) | set(rect(43, 36, 84, 37))        # uliczka A (przed podwórkami chat południowych)
    D |= set(rect(4, 48, 39, 49))                                    # uliczka B (lepianki, chata 3)
    D |= set(rect(4, 59, 39, 60)) | set(rect(43, 59, 84, 60))        # droga pod palisadą (chaty 4-5, garncarnia, ogródki)
    ziemia(b, D)
    for (x, y) in rect(0, 18, 3, 20):
        b.zmaz(1, [(x, y)])
    # ścieżki do drzwi budynków bez podwórek (przytułek, szynk, dom uchodźców) i od furtek ogródków
    for (x, y0, y1) in ((53, 13, 17), (79, 12, 17), (33, 13, 17), (61, 14, 17), (66, 14, 17), (71, 14, 17)):
        ziemia(b, rect(x, y0, x, y1), droga=False)
    # koleiny na głównej drodze (ciemna ziemia A2 k26 w rzędach 18 i 20), z przerwami
    for x in range(1, 85):
        for y in (18, 20):
            if noise(x // 3, y, 7) < 0.85 and kind_of(b.g(0, x, y)) == ZIEMIA and not b.g(1, x, y):
                b.maluj(1, [(x, y)], BLOTO)
    # kamyki na uliczkach (rzadko)
    for (x, y) in sorted(b.drogi):
        if b.g(1, x, y) or y in (18, 19, 20): continue
        if noise(x, y, 41) > 0.97: b.maluj(1, [(x, y)], KAMYKI)
    b.strefy["drogi"] = {"glowna": [0, 18, 85, 20], "na_poludnie": [40, 21, 42, 64], "uliczka_A": [[4, 36, 39, 37], [43, 36, 84, 37]],
                         "uliczka_B": [4, 48, 39, 49], "pod_palisada": [[4, 59, 39, 60], [43, 59, 84, 60]]}


def wolna_kratka(b, x, y, zd=None):
    """kratka na rzecz na placyku / podwórku: bez kafli 2-3, bez budynku, bez płotu, bez zdarzenia, bez regionu"""
    if not (0 <= x < W and 0 <= y < H): return False
    if b.g(2, x, y) or b.g(3, x, y) or b.g(5, x, y): return False
    t0 = b.g(0, x, y)
    if t0 >= 4352 or 1536 <= t0 < 2048: return False
    if b.g(1, x, y) >= 2048 and kind_of(b.g(1, x, y)) in (PLOT, PALISADA, ZYWOPLOT): return False
    if (x, y) in b.zajete: return False
    if zd is not None and (x, y) in zd: return False
    return True


def postaw(b, nazwa, x, y, zd=None):
    """rzecz z arkusza C, jeśli wszystkie jej kratki wolne"""
    c, r, w, h = P.THINGS[nazwa]
    cells = [(x + i, y - h + 1 + j) for i in range(w) for j in range(h)]
    if not all(wolna_kratka(b, cx, cy, zd) for (cx, cy) in cells): return False
    thing(b, nazwa, x, y)
    return True


BRUK = 18                    # A2: bruk z kocich łbów z trawiastym obrzeżem


def placyk(b):
    """wyraźny placyk: bruk z kocich łbów z obrzeżem z trawy (zaokrąglone rogi), sucha studnia na środku w kręgu ławek,
    kapliczka (przeniesiona) ze świeczką, kram z towarem w grupkach, stare uschnięte drzewo z ławką, obwieszczenie,
    suche koryto, miejsce zabaw dzieci (patyki, piłka ze szmat, kółko)"""
    x0, y0, x1, y1 = PLACYK
    rog = set()
    for (cx, cy, sx, sy) in ((x0, y0, 1, 1), (x1, y0, -1, 1), (x0, y1, 1, -1), (x1, y1, -1, -1)):
        rog |= {(cx, cy), (cx + sx, cy), (cx, cy + sy)}
    for (x, y) in rect(x0, y0, x1, y1):
        if (x, y) in rog or not b.tag[y][x].startswith("grunt"): continue
        if b.g(0, x, y) >= 4352: continue
        b.s(0, x, y, A(BRUK), "grunt_placyk"); b.res.add((0, x, y))
        b.zmaz(1, [(x, y)])
        b.drogi.add((x, y))
    # sucha studnia (ev 27) i krąg ławek wokół niej
    b.przesun_zd(27, 44, 33, "placyk (ręcznie)")
    for c in TP.footprint("well_dry", 44, 33): b.zajete.add(c)
    thing(b, "log_bench", 44, 29); thing(b, "log_bench", 44, 35)          # (północna nad dachem studni)
    for lx in (41, 48):
        for r in range(3):
            b.kafel(2, lx, 31 + r, Ct(14, r)); b.zajete.add((lx, 31 + r))
    b.zajete.update({(44, 34), (45, 34), (43, 33), (46, 33)})
    # obwieszczenie sołtysa (ev 68) przy wejściu z głównej drogi
    b.kafel(3, 38, 22, Ct(0, 13)); b.kafel(2, 38, 23, Ct(0, 14)); b.kafel(2, 38, 24, Ct(0, 15))
    b.przesun_zd(68, 38, 23, "placyk (ręcznie)")
    b.zajete.update({(38, 22), (38, 23), (38, 24)})
    # świeczka przy kapliczce (ogień)
    note = "<Light:120,80,50,10><LightFlicker:0.2>"
    b.obraz("Świeczka przy kapliczce", 38, 27, "!Flame", 1, 2, 0, prio=0, through=True, step=True, note=note)
    b.swiatla.append({"nazwa": "Świeczka przy kapliczce", "x": 38, "y": 27, "notatka": note})
    # kram starzyzny: towar w grupkach (beczki, kosze, szmaty w skrzyniach)
    zd = zd_na(b)
    for (n, x, y) in (("barrel", 54, 32), ("basket_jugs", 55, 32), ("barrel_open", 46, 32), ("crates_cloth", 49, 33)):
        postaw(b, n, x, y, zd)
    # stare uschnięte drzewo w rogu placyku, pod nim ławka z kłody
    martwe_drzewo(b, 37, 40)
    thing(b, "log_bench", 38, 41)
    # suche koryto i miejsce zabaw dzieci (patyki, piłka ze szmat, kółko od wozu)
    b.kafel(2, 47, 38, Ct(9, 2)); b.kafel(2, 48, 38, Ct(10, 2)); b.zajete.update({(47, 38), (48, 38)})
    thing(b, "sticks", 51, 39); kepka(b, "stones", 53, 38); thing(b, "wheel", 53, 40)
    b.obraz("Piłka ze szmat", 50, 39, "!Tavern_Yard", 1, 8, 0, prio=0, through=True)
    b.zajete.update({(50, 39), (51, 38), (52, 39)})
    # kępki chwastów w szczelinach bruku przy brzegach placyku
    for (x, y) in ((36, 31), (55, 35), (39, 38), (52, 25), (36, 37), (54, 39), (43, 25)):
        if wolna_kratka(b, x, y, zd_na(b)): b.kafel(2, x, y, Dt(13, 10))
    b.strefy["placyk_studnia"] = [44, 32, 45, 33]
    b.strefy["placyk_bruk"] = {"prostokat": list(PLACYK), "kafel": "A2 k18 (bruk z trawiastym obrzeżem), rogi zaokrąglone"}


def martwe_drzewo(b, tx, ty):
    """uschnięte drzewo z arkusza E (E 1..3, 3..8), pień na (tx, ty): gałęzie nad bohaterem, pień zamknięty"""
    for r in range(3, 9):
        for c in range(1, 4):
            if (c, r) in ((1, 8), (3, 8)): continue
            b.tl(tx - 2 + c, ty - 8 + r, Et(c, r), 3)
            b.zajete.add((tx - 2 + c, ty - 8 + r))
    b.region(tx, ty, 2)


# ================================================================================================ ogródki, zagrody, rzemiosło
def plot_ring(b, x0, y0, x1, y1, gate=()):
    ring = [c for c in rect(x0, y0, x1, y1) if (c[0] in (x0, x1) or c[1] in (y0, y1)) and c not in gate]
    b.maluj(1, ring, PLOT, tag="grunt_plot")
    b.zajete.update(ring)
    return ring


# podwórka chat: klucz, płot lewy x, płot prawy x (3 / 85 = palisada), rząd szczytu dachu, rząd płotu od drogi, furtka (x, 2 kratki),
# dom od x do x (w rzędzie szczytu), rzeczy na podwórku (wypełniacz)
PODWORKA = [
    ("drwal", 3, 17, 6, 16, 10, 7, 12, ["deszczowka", "kury", "kosze", "kwiaty", "krzaki"]),
    ("strzecha", 17, 26, 8, 16, 21, 19, 24, ["grzadka", "deszczowka", "kury", "kosze", "kwiaty", "krzaki"]),
    ("klusownik", 3, 12, 24, 35, 8, 6, 10, ["deszczowka", "pieniek", "kosze", "kwiaty", "krzaki"]),
    ("deski", 12, 22, 24, 35, 17, 15, 19, ["grzadka", "sag", "taczka", "kury", "kwiaty", "krzaki"]),
    ("znachorka", 22, 34, 26, 35, 27, 25, 29, ["deszczowka", "kosze", "grzadka_mala", "kwiaty", "krzaki"]),
    ("praczka", 56, 68, 25, 35, 60, 59, 63, ["deszczowka", "kosze", "kury", "kwiaty", "krzaki"]),
    ("szopa", 68, 75, 26, 35, 70, 69, 71, ["stog", "taczka", "kwiaty", "krzaki"]),
    ("komorka", 75, 85, 25, 35, 78, 77, 80, ["sag", "beczka", "kosze", "kwiaty", "krzaki"]),
    ("lepianka1", 3, 12, 39, 47, 7, 5, 10, ["grzadka", "kury", "deszczowka", "kosze", "kwiaty", "krzaki"]),
    ("lepianka2", 12, 21, 39, 47, 17, 14, 19, ["grzadka", "pieniek", "kosze", "kury", "kwiaty", "krzaki"]),
    ("chata3", 21, 33, 39, 47, 26, 23, 29, ["sag", "pieniek", "taczka", "grzadka", "kwiaty", "krzaki"]),
    ("chata4", 3, 12, 51, 58, 7, 5, 10, ["grzadka", "beczka", "kury", "kwiaty", "krzaki"]),
    ("chata5", 12, 21, 51, 58, 17, 14, 19, ["grzadka", "deszczowka", "kosze", "stog", "kwiaty", "krzaki"]),
    ("garncarnia", 44, 57, 45, 58, 49, 46, 52, []),
]


def podworka(b):
    """każda chata ma podwórko w płotku z żerdzi (A2 k22) z furtką (2 kratki) od drogi i ścieżką do drzwi; dom i płot
    zamykają podwórko (boki płotu od szczytu dachu do płotu frontowego, krótkie odcinki płotu przy szczycie), palisada
    służy za bok; na podwórku rzeczy z wypełniacza (grządki, sągi, pieniek, beczka na deszczówkę, kosze, taczka, stóg, kury)"""
    for (k, xl, xr, top, fr, gx, hx0, hx1, rzeczy) in PODWORKA:
        plot = set()
        for x in (xl, xr):
            if x in (PAL[0], PAL[2]): continue
            plot |= {(x, y) for y in range(top, fr + 1)}
        plot |= {(x, fr) for x in range(xl, xr + 1) if x not in (PAL[0], PAL[2])}
        plot |= {(x, top) for x in range(xl + 1, hx0)} | {(x, top) for x in range(hx1 + 1, xr)}
        brama = {(gx, fr), (gx + 1, fr)}
        plot -= brama
        plot = {c for c in plot if b.g(0, *c) < 4352 and not b.g(2, *c) and not b.g(3, *c)}
        b.maluj(1, sorted(plot), PLOT, tag=None)
        b.zajete.update(plot)
        # ścieżka: od kratki przed drzwiami do furtki (1 kratka ziemi), furtka i wyjście na drogę; korytarz 2 kratki wolny
        bud = [x for x in b.budynki_wszystkie if x["klucz"] == k][0]
        dx_, dy_ = bud["drzwi"]
        ziemia(b, [(dx_, y) for y in range(dy_ + 1, fr + 1)] + sorted(brama), tylko_grunt=False, droga=False)
        y_road = fr + 1
        while y_road < H and (gx, y_road) not in b.drogi and y_road <= fr + 2:
            ziemia(b, [(gx, y_road), (gx + 1, y_road)], droga=False)
            y_road += 1
        korytarz = {(x, y) for x in range(min(dx_, gx), max(dx_, gx + 1) + 1) for y in range(dy_ + 1, fr + 1)}
        b.zajete.update(korytarz)
        wnetrze = [(x, y) for y in range(top + 1, fr) for x in range(xl + 1, xr)]
        b.podworka[k] = {"plot_x": [xl, xr], "rzad_szczytu": top, "rzad_plotu": fr, "furtka": [[gx, fr], [gx + 1, fr]],
                         "drzwi": [dx_, dy_], "rzeczy": []}
        wypelnij(b, k, wnetrze, rzeczy)


def wypelnij(b, k, wnetrze, rzeczy):
    """rzeczy na podwórku: najpierw przy płotach i ścianach (kratki z zablokowanym sąsiadem), losowo z ziarnem"""
    zd = zd_na(b)
    def blok(x, y):
        return (not wolna_kratka(b, x, y)) or (b.g(1, x, y) >= 2048 and kind_of(b.g(1, x, y)) in (PLOT, PALISADA))
    kand = [c for c in wnetrze if wolna_kratka(b, c[0], c[1], zd)]
    rnd = random.Random(sum(ord(ch) for ch in k) + 7)
    kand.sort(key=lambda c: (-sum(1 for d in ((1, 0), (-1, 0), (0, 1), (0, -1)) if blok(c[0] + d[0], c[1] + d[1])), rnd.random()))
    for co in rzeczy:
        for (x, y) in kand:
            if postaw_rzecz(b, co, x, y, zd):
                b.podworka[k]["rzeczy"].append([co, x, y])
                break


def postaw_rzecz(b, co, x, y, zd):
    if co in ("grzadka", "grzadka_mala"):
        w = 3 if co == "grzadka" else 2
        cells = rect(x, y, x + w - 1, y + 1)
        marg = [c for c in rect(x - 1, y - 1, x + w, y + 2) if c not in cells]
        if not all(wolna_kratka(b, cx, cy, zd) for (cx, cy) in cells): return False
        if any(c in b.drogi or c in b.sciezki for c in cells): return False
        if sum(1 for c in marg if wolna_kratka(b, c[0], c[1], zd) or c in b.sciezki) < 2: return False
        b.maluj(0, cells, ZIEMIA, tag=None)
        for i in range(w):
            b.kafel(2, x + i, y, Dt(8 + (x + i) % 3, 9))
            b.kafel(2, x + i, y + 1, Ct(5 + (x + i + y) % 3, 2 + (i % 2)))
        b.zajete.update(cells)
        return True
    if co == "kwiaty":
        cells = [(x, y), (x + 1, y)]
        if not all(wolna_kratka(b, cx, cy, zd) and not b.g(1, cx, cy) and (cx, cy) not in b.sciezki for (cx, cy) in cells):
            return False
        b.maluj(1, cells, KWIATKI, tag=None)
        return True
    if co == "krzaki":
        cells = [(x, y), (x + 1, y)]
        if not all(wolna_kratka(b, cx, cy, zd) and (cx, cy) not in b.sciezki for (cx, cy) in cells): return False
        b.kafel(2, x, y, Dt(12 + (x % 2), 11)); b.kafel(2, x + 1, y, Dt(9 + (y % 3), 7))
        b.zajete.update(cells)
        return True
    if co == "kury":
        n = 0
        for (cx, cy) in rect(x, y, x + 2, y + 1):
            if n < 2 and wolna_kratka(b, cx, cy, zd) and (cx, cy) not in b.sciezki:
                b.obraz("Kura sąsiadów", cx, cy, "$Animal_Hen", 0, (2, 4, 6, 8)[(cx + cy) % 4], 1, prio=0, move=1)
                b.zajete.add((cx, cy)); zd[(cx, cy)].append(0)
                n += 1
        return n > 0
    if co == "deszczowka":
        if not wolna_kratka(b, x, y, zd) or (x, y) in b.sciezki: return False
        town_prop(b, "barrel_water", x, y, label="Beczka na deszczówkę")
        zd[(x, y)].append(0)
        return True
    if co == "taczka":
        if not (wolna_kratka(b, x, y, zd) and wolna_kratka(b, x + 1, y, zd)) or {(x, y), (x + 1, y)} & b.sciezki: return False
        rzecz(b, "Taczka", x, y, "!House_Town", 0, 4, 1, occ={"right": 1})
        b.zajete.update({(x, y), (x + 1, y)}); zd[(x, y)].append(0)
        return True
    if co == "kosze":
        if not (wolna_kratka(b, x, y, zd) and wolna_kratka(b, x + 1, y, zd)) or {(x, y), (x + 1, y)} & b.sciezki: return False
        b.kafel(2, x, y, Ct(6, 15)); b.kafel(2, x + 1, y, Ct(4 + (x % 2), 15))
        b.zajete.update({(x, y), (x + 1, y)})
        return True
    nazwa = {"sag": "firewood", "pieniek": "chopping_block", "beczka": "barrel", "stog": "hay"}[co]
    c, r, w, h = P.THINGS[nazwa]
    cells = [(x + i, y - h + 1 + j) for i in range(w) for j in range(h)]
    if set(cells) & b.sciezki: return False
    return postaw(b, nazwa, x, y, zd)


def ogrodki_zasoby(b):
    """trzy ogródki paczki A6 (Zasoby GARDENS): ogrodzone poletko 60-75 x 9-13 z trzema kwaterami 4x3 i furtkami od południa"""
    x0, y0, x1, y1 = OGRODKI_PLOT
    gates = [(x, y1) for (x, y) in OGRODKI.values()]
    plot_ring(b, x0, y0, x1, y1, gate=gates)
    for xs in (65, 70):
        b.maluj(1, [(xs, y) for y in range(y0 + 1, y1)], PLOT, tag="grunt_plot")
    b.maluj(0, [(x, y) for (x, y) in rect(x0 + 1, y0 + 1, x1 - 1, y1 - 1) if x not in (65, 70)], ZIEMIA, tag="grunt_ogrod")
    for k, (x, y) in OGRODKI.items():
        cells = [(x, y), (x + 2, y), (x + 1, y + 2), (x + 3, y + 2)]
        b.strefy[k] = {"x": x, "y": y, "w": 4, "h": 3, "uprawy": [list(c) for c in cells], "furtka": [x, y1]}
        for c in rect(x, y, x + 3, y + 2): b.zajete.add(c)
        b.zajete.update({(x, y1 + 1), (x, y1)})
    # ścieżka od furtek do drogi
    sc = set()
    for (x, y) in OGRODKI.values():
        sc |= lane(b, [(x + 0.5, y1 + 1), (x + 0.5, 17.5)], 1.4, seed=x)
    ziemia(b, sc)
    # narzędzia przy płocie
    thing(b, "basket_grain", 59, 13); thing(b, "sticks_b", 76, 12)


def zagroda(b, x0, y0, x1, y1, nazwa, zwierze, ile, budka=None):
    """zagroda z płotu (zamknięta: zwierzęta chodzą w środku), budka (obraz !$Pod_...) w rogu"""
    plot_ring(b, x0, y0, x1, y1)
    for c in rect(x0 + 1, y0 + 1, x1 - 1, y1 - 1):
        b.zajete.add(c)
        if noise(c[0], c[1], 71) < 0.35: b.maluj(1, [c], SUCHA)
    if budka:
        ch, bx, by, occ = budka
        rzecz(b, {"!$Pod_Kurnik": "Kurnik", "!$Pod_Chlewik": "Chlewik"}.get(ch, "Budka") + " (" + nazwa.lower() + ")", bx, by, ch,
              0, 2, 0, prio=1, occ=occ)
    sheet, label = zwierze
    spots = [c for c in rect(x0 + 2, y0 + 2, x1 - 2, y1 - 2)]
    b.rnd.shuffle(spots)
    n = 0
    for (x, y) in spots:
        if n >= ile: break
        if b.g(2, x, y) or b.g(3, x, y): continue
        if budka and abs(x - budka[1]) <= 1 and budka[2] - 1 <= y <= budka[2]: continue
        b.obraz(label, x, y, sheet, 0, (2, 4, 6, 8)[n % 4], 1, prio=1, move=1)
        n += 1


def rzemioslo(b):
    # --- przytułek: kocioł z zupą przed wejściem, ławy z kłód, beczka
    b.obraz("Kocioł z zupą", 50, 15, "!$Pod_Kociol", 0, 2, 0, prio=1,
            note="<Occupy:left=1,right=1,up=1><Light:200,120,60,14><LightFlicker:0.15>")
    b.swiatla.append({"nazwa": "Kocioł z zupą", "x": 50, "y": 15, "notatka": "<Light:200,120,60,14><LightFlicker:0.15>"})
    b.zajete.update(set(rect(49, 14, 51, 16)))
    thing(b, "log_bench", 55, 15); thing(b, "log_bench", 45, 15)
    thing(b, "basket_jugs", 45, 13); thing(b, "barrel", 58, 14)
    # --- szynk: szyld z kuflem, ławy i stoły przed wejściem, beczki
    rzecz(b, "Szyld: Szynk", 82, 10, "!Signs", 2, 6, 1, prio=2, through=True)
    for (tx, ty) in ((77, 14), (82, 14)):
        rzecz(b, "Stół przed szynkiem", tx, ty, "!Tavern_Yard", 0, 2, 2, occ={"left": 1, "right": 1})
        b.zajete.update(set(rect(tx - 1, ty, tx + 1, ty + 1)))
    thing(b, "log_bench", 76, 16); thing(b, "log_bench", 81, 16)
    thing(b, "barrel", 84, 11); thing(b, "barrel_open", 84, 13)
    rzecz(b, "Beczki", 84, 16, "!Tavern_Yard", 0, 8, 0)
    # --- garncarnia (w podwórku): piec, ławy z dzbanami, taczka z gliną, kosz, beczka, sąg
    b.obraz("Piec garncarski", 55, 50, "!$Pod_Piec", 0, 2, 0, prio=1,
            note="<Occupy:left=1,right=1,up=1><Light:170,100,50,12><LightFlicker:0.12>")
    b.swiatla.append({"nazwa": "Piec garncarski", "x": 55, "y": 50, "notatka": "<Light:170,100,50,12><LightFlicker:0.12>"})
    b.zajete.update(set(rect(54, 49, 56, 51)))
    thing(b, "bench", 45, 53); thing(b, "bench", 52, 53)
    for (n, x, y) in (("jugs", 45, 54), ("pots", 46, 54), ("jugs", 53, 54), ("pots", 52, 54)):
        town_prop(b, n, x, y, label="Dzbany schną" if n == "jugs" else "Garnki schną")
    rzecz(b, "Taczka z gliną", 55, 56, "!House_Town", 0, 4, 1, occ={"right": 1}); b.zajete.update({(55, 56), (56, 56)})
    thing(b, "basket_jugs", 56, 53); thing(b, "barrel", 53, 48); thing(b, "firewood", 54, 47)


def zagrody(b):
    zagroda(b, 57, 38, 69, 46, "Wybieg", ("$Animal_Hen", "Kura sąsiadów"), 5, ("!$Pod_Kurnik", 60, 41, {"left": 1, "right": 1, "up": 1}))
    zagroda(b, 72, 38, 84, 46, "Zagroda", ("$Animal_Sheep", "Owca sąsiadów"), 3, ("!$Pod_Chlewik", 80, 41, {"left": 1, "right": 1, "up": 1}))
    zagroda(b, 23, 51, 35, 57, "Kurnik", ("$Animal_Hen", "Kura sąsiadów"), 4, ("!$Pod_Kurnik", 26, 54, {"left": 1, "right": 1, "up": 1}))
    # ogródek biedoty nowy (obok dwóch przeniesionych) - grządki ze strachem na wróble
    x0, y0, x1, y1 = 79, 50, 84, 54
    plot_ring(b, x0, y0, x1, y1, gate=[(81, y1)])
    b.maluj(0, rect(x0 + 1, y0 + 1, x1 - 1, y1 - 1), ZIEMIA, tag="grunt_ogrod")
    for x in range(x0 + 1, x1):
        b.tl(x, y0 + 1, Dt(8 + (x % 3), 9), 2)
    thing(b, "sprout_a", 80, 53); thing(b, "sprout_e", 83, 53)
    thing(b, "scarecrow", 82, 53)
    # ścieżki od furtek ogródków biedoty do drogi pod palisadą
    for gx in (62, 72, 81):
        ziemia(b, rect(gx, 55, gx, 58), droga=False)


# ================================================================================================ dekoracje
def zd_na(b):
    d = collections.defaultdict(list)
    for eid, e in b.ev.items():
        d[(e["x"], e["y"])].append(eid)
    return d


def wolne(b, x, y, zd=None):
    if not (4 <= x <= 84 and 4 <= y <= 63): return False
    if b.g(5, x, y) or b.g(2, x, y) or b.g(3, x, y): return False
    if (x, y) in b.zajete or (x, y) in b.drogi or (x, y) in b.sciezki: return False
    if zd is not None and (x, y) in zd: return False
    t0 = b.g(0, x, y)
    if t0 >= 4352 or 1536 <= t0 < 2048: return False
    if kind_of(t0) not in (TRAWA, TRAWA_JASNA): return False
    if b.g(1, x, y) >= 2048 and kind_of(b.g(1, x, y)) in (PLOT, PALISADA, ZYWOPLOT): return False
    if not b.tag[y][x].startswith("grunt"): return False
    return True


def drobiazgi(b):
    """poza podwórkami: pas pod palisadą, pas pod murem miasta, przy obozie i przytułku - sągi, beczki, wozy, skrzynie"""
    rzeczy = [
        ("cart_barrels", 86, 24), ("firewood", 86, 30), ("barrel", 88, 33), ("crate", 89, 33),
        ("woodshed", 61, 63), ("firewood", 70, 63), ("cart_hay", 76, 63), ("crate", 45, 63), ("barrel", 46, 63),
        ("barrel", 9, 63), ("crate_open", 10, 63), ("firewood", 26, 63), ("logs_small", 29, 63), ("hay", 33, 63),
        ("firewood", 46, 43), ("barrel", 49, 43), ("crate", 50, 43), ("cart", 34, 45), ("logs_small", 36, 44),
        ("barrel", 64, 22), ("crate", 65, 22), ("firewood", 75, 23), ("basket_jugs", 22, 22), ("logs_small", 23, 22),
    ]
    zd = zd_na(b)
    for (n, x, y) in rzeczy:
        c, rr, w, h = P.THINGS[n]
        cells = [(x + i, y - h + 1 + j) for i in range(w) for j in range(h)]
        if all(wolna_kratka(b, cx, cy, zd) and (cx, cy) not in b.drogi and (cx, cy) not in b.sciezki for (cx, cy) in cells):
            thing(b, n, x, y)


def zielen(b):
    """kępy wysokiej trawy przy ścianach i płotach, rzadkie kwiaty, paprocie, drzewa na wolnych połaciach"""
    rnd = b.rnd
    zd = zd_na(b)
    for y in range(4, 64):
        for x in range(4, 85):
            if not b.tag[y][x].startswith("grunt") or b.tag[y][x] in ("grunt_palisada",): continue
            t0 = b.g(0, x, y)
            if kind_of(t0) not in (TRAWA, TRAWA_JASNA) or b.g(1, x, y) or (x, y) in b.drogi: continue
            if b.g(2, x, y) or b.g(3, x, y): continue
            przy = any(b.g(5, x + dx, y + dy) == 2 or b.g(0, x + dx, y + dy) >= 4352 or
                       kind_of(b.g(1, x + dx, y + dy)) in (PLOT, PALISADA) for dx in (-1, 0, 1) for dy in (-1, 0, 1))
            n = N.lowfreq(x, y, 77, 4.0)
            n2 = N.lowfreq(x, y, 131, 5.0)
            if (przy and rnd.random() < 0.40) or n > 0.80:
                b.maluj(1, [(x, y)], KEPKI)
            elif n2 > 0.74:
                b.maluj(1, [(x, y)], MIEKKA)
            elif n2 < 0.07:
                b.maluj(1, [(x, y)], SUCHA)
            elif n < 0.08:
                b.maluj(1, [(x, y)], KWIATKI)
            elif przy and rnd.random() < 0.10 and wolne(b, x, y, zd):
                b.kafel(2, x, y, rnd.choice([Dt(9, 7), Dt(10, 7), Dt(11, 7), Dt(13, 10), Dt(12, 9)]))
    # drzewa w osadzie (ozdobne: bez notatki <Tree>)
    drzewa = [(e["x"], e["y"]) for e in b.ev.values() if "Trees" in e["pages"][0]["image"]["characterName"]]
    reczne = [(31, 62, "okragle"), (21, 62, "sosna"), (14, 62, "okragle"), (54, 62, "okragle"), (66, 62, "sosna_b"),
              (83, 62, "okragle"), (37, 46, "okragle"), (45, 42, "krzew"), (56, 43, "krzew"), (73, 22, "okragle"),
              (87, 7, "okragle"), (87, 28, "sosna"), (87, 40, "okragle"), (87, 52, "sosna_b"), (87, 63, "okragle"),
              (14, 5, "krzew"), (58, 5, "okragle"), (26, 5, "krzew"), (44, 5, "okragle"), (74, 5, "krzew"),
              (9, 22, "krzew"), (30, 22, "krzew"), (52, 22, "krzew"), (34, 44, "krzew"), (36, 52, "okragle"),
              (24, 50, "krzew"), (88, 46, "krzew"), (5, 38, "krzew"), (36, 57, "krzew")]
    for (x, y, k) in reczne:
        if wolne_drzewo(b, x, y, zd, drzewa):
            drzewo(b, x, y, k); drzewa.append((x, y)); zd[(x, y)].append(0)


def wolne_drzewo(b, x, y, zd, drzewa):
    if not (0 <= x < W and 0 <= y < H): return False
    if any(abs(x - a) + abs(y - c) < 4 for (a, c) in drzewa): return False
    for dx in (-1, 0, 1):
        for dy in (-2, -1, 0):
            cx, cy = x + dx, y + dy
            if b.g(0, cx, cy) >= 4352 or b.g(2, cx, cy) or b.g(3, cx, cy): return False
            if (cx, cy) in zd and (dx, dy) != (0, 0): return False
    if (x, y) in b.drogi or (x, y) in b.zajete or (x, y) in zd: return False
    if b.g(5, x, y): return False
    if b.g(1, x, y) >= 2048 and kind_of(b.g(1, x, y)) in (PLOT, PALISADA): return False
    return True


# ================================================================================================ las przy chacie, drobiazgi przy ścianach
def las_przy_chacie(b):
    """Chata pod lasem: drzewa ozdobne wokół chaty (z zachodu, z północy i z południa) - chata stoi pod lasem"""
    zd = zd_na(b)
    drzewa = [(e["x"], e["y"]) for e in b.ev.values() if "Trees" in e["pages"][0]["image"]["characterName"]]
    for (x, y, k) in ((1, 73, "sosna"), (2, 77, "okragle"), (1, 81, "sosna_b"), (3, 86, "okragle"), (7, 88, "sosna"),
                      (12, 87, "okragle"), (2, 91, "sosna"), (14, 91, "sosna_b"), (5, 70, "okragle"), (9, 72, "krzew")):
        if wolne_drzewo(b, x, y, zd, drzewa):
            drzewo(b, x, y, k); drzewa.append((x, y)); zd[(x, y)].append(0)


def pranie(b, x0, y_top, items):
    """sznur z praniem z arkusza C (jak plib.laundry): słup C(8,13..15), ubrania w rzędzie liny, słup C(15,13..15);
    RegionLayers: rząd liny i górne kratki słupów nad bohaterem (region 3)"""
    for j in range(3): b.tl(x0, y_top + j, Ct(8, 13 + j))
    for i, (c, r) in enumerate(items):
        b.tl(x0 + 1 + i, y_top, Ct(c, r))
    xr = x0 + 1 + len(items)
    for j in range(3): b.tl(xr, y_top + j, Ct(15, 13 + j))
    for x in range(x0, xr + 1):
        b.region(x, y_top, 3); b.zajete.add((x, y_top))
    b.region(x0, y_top + 1, 3); b.region(xr, y_top + 1, 3)
    b.zajete.update({(x0, y_top + 1), (x0, y_top + 2), (xr, y_top + 1), (xr, y_top + 2)})
    return xr


def detale(b):
    """pranie na podwórku kłusownika, łopata przy gliniance, nosidła praczki, wóz z sianem, kwiaty przy drzwiach nowych chat"""
    pranie(b, 5, 31, [(9, 13), (12, 13), (10, 13), (13, 13)])
    rzecz(b, "Łopata", 52, 71, "!House_Town", 2, 4, 2); b.zajete.add((52, 71))
    rzecz(b, "Nosidła na wodę", 66, 28, "!House_Town", 2, 8, 0); b.zajete.add((66, 28))
    rzecz(b, "Wóz z sianem", 70, 44, "!House_Town", 0, 4, 2, occ={"right": 1}); b.zajete.update({(70, 44), (71, 44)})
    for bud in b.budynki:
        if not bud.get("wymiary"): continue
        dx_, dy_ = bud["drzwi"]
        for c in ((dx_ - 1, dy_ + 1), (dx_ + 2, dy_ + 1), (dx_ - 2, dy_ + 1)):
            x, y = c
            if kind_of(b.g(0, x, y)) in (TRAWA, TRAWA_JASNA) and not b.g(1, x, y) and not b.g(2, x, y) and c not in b.drogi \
                    and c not in b.zajete and b.tag[y][x].startswith("grunt") and noise(x, y, 99) < 0.75:
                b.maluj(1, [c], KWIATKI)


PRZY_SCIANIE = ["barrel", "crate", "firewood", "logs_small", "basket_jugs", "barrel_open", "chopping_block", "hide_rack_b"]


def przy_scianach(b):
    """przy przytułku i szynku (bez podwórek) 2-3 rzeczy przy bocznych ścianach i narożnikach frontu"""
    zd = zd_na(b)
    for bud in b.budynki:
        if bud["klucz"] not in ("przytulek", "szynk"): continue
        x0, y0, x1, y1 = bud["prostokat"]
        dx_, dy_ = bud["drzwi"]
        kand = []
        for y in range(y1 - 1, y1 + 1):
            kand += [(x0 - 1, y), (x1 + 1, y)]
        kand += [(x, y1 + 1) for x in (x0, x0 + 1, x1 - 1, x1) if abs(x - dx_) >= 2]
        b.rnd.shuffle(kand)
        n = 0
        for (x, y) in kand:
            if n >= 3: break
            nazwa = PRZY_SCIANIE[(x * 7 + y * 3 + n) % len(PRZY_SCIANIE)]
            c, r, w, h = P.THINGS[nazwa]
            cells = [(x + i, y - h + 1 + j) for i in range(w) for j in range(h)]
            if not all(wolna_kratka(b, cx, cy, zd) for (cx, cy) in cells): continue
            if any(cc in b.drogi or cc in b.sciezki for cc in cells): continue
            thing(b, nazwa, x, y)
            n += 1
            for cc in cells: zd[cc].append(0)


# ================================================================================================ za palisadą
def za_palisada(b):
    # pas trawy pod palisadą (rzędy 65-66) już czysty; droga na południe od bramy do lasu, ścieżka do chaty pod lasem
    D = set()
    D |= lane(b, [(41, 64.5), (41, 70), (41.2, 74.5)], 2.9, seed=31)
    D |= lane(b, [(41, 74.5), (32, 74.2), (22, 74.4), (13.5, 74.0)], 2.4, seed=32)
    D |= lane(b, [(42, 70.5), (45.5, 70.8)], 1.8, seed=33)                   # do glinianki
    D |= lane(b, [(72.5, 65.5), (72.5, 67.5)], 1.6, seed=34)                 # do wysypiska
    D |= lane(b, [(43, 65.5), (60, 65.6), (72, 65.4)], 1.6, seed=35)         # ścieżka pod palisadą
    marg = {(x + dx, y + dy) for (x, y) in D for dx in (-1, 0, 1) for dy in (-1, 0, 1)}
    czysc_poza(b, {c for c in marg if c[1] >= 67}, "droga za palisadą (do lasu, chaty pod lasem, glinianki, wysypiska)")
    ziemia(b, D)
    # glinianka (CLAYPIT): błotnista ziemia, wolny brzeg
    gx, gy, gw, gh = GLINIANKA
    czysc_poza(b, rect(gx - 2, gy - 2, gx + gw + 1, gy + gh + 1), "glinianka (Zasoby CLAYPIT)")
    b.maluj(0, rect(gx - 1, gy - 1, gx + gw, gy + gh), ZIEMIA)
    for c in rect(gx, gy, gx + gw - 1, gy + gh - 1):
        if noise(c[0], c[1], 55) < 0.45: b.maluj(1, [c], BLOTO)
    for c in rect(gx - 1, gy - 1, gx + gw, gy + gh): b.zajete.add(c)
    b.strefy["glinianka"] = {"x": gx, "y": gy, "w": gw, "h": gh, "ex": gx + 2, "ey": gy + 2}
    # wysypisko (DUMP): ziemia, złom wokół (sterty stawia Zasoby)
    wx, wy, ww, wh = WYSYPISKO
    czysc_poza(b, rect(wx - 2, wy - 1, wx + ww + 1, wy + wh + 1), "wysypisko (Zasoby DUMP)")
    b.maluj(0, rect(wx - 1, wy, wx + ww, wy + wh), ZIEMIA)
    for c in rect(wx, wy, wx + ww - 1, wy + wh - 1):
        if noise(c[0], c[1], 57) < 0.3: b.maluj(1, [c], KAMYKI)
    b.strefy["wysypisko"] = {"x": wx, "y": wy, "w": ww, "h": wh,
                             "sterty": [[wx + 2, wy + 2, "główna, Occupy l/r"], [wx + 4, wy + 3], [wx, wy]]}
    for c in rect(wx - 1, wy, wx + ww, wy + wh): b.zajete.add(c)
    # stare deski i szmaty na brzegu wysypiska (nie na kratkach stert)
    for (n, x, y) in (("crate_open", wx + ww, wy + 1), ("sticks", wx - 1, wy + 3), ("wheel", wx + ww, wy + 4)):
        thing(b, n, x, y)


def chata_pod_lasem(b):
    """miejsce docelowe bloku chaty z działką: najpierw wyczyszczone (teren generowany), potem blok (uklad_bloki)"""
    dx, dy = HUT["dx"], HUT["dy"]
    x0, y0, x1, y1 = 2 + dx, 35 + dy, 36 + dx, 51 + dy
    czysc_poza(b, rect(x0 - 1, y0 - 1, x1 + 1, y1 + 1), "Chata pod lasem z działką (przeniesiona z 3-36 x 35-51)")


# ================================================================================================ MIEJSCA (TownLife)
# stare klucze (zdarzenia 70-88 przenoszą się z blokami); tu tylko te, które nie leżą w żadnym bloku
SPOTS_RECZNIE = {   # klucz: (x, y, kierunek) - dawne zdarzenie Miejsce przestawione
    "kram": (53, 31, 2), "plac": (43, 36, 4), "studnia_sucha": (44, 34, 8), "zabawa": (51, 38, 2), "skraj_lasu": (0, 19, 4),
}
SPOTS_NOWE = {
    "placyk_1": (39, 30, 6), "placyk_2": (47, 34, 4), "placyk_3": (42, 39, 8), "placyk_4": (50, 31, 2), "placyk_5": (39, 35, 6),
    "placyk_6": (53, 36, 4),
    "szynk_lawy": (79, 15, 8), "przytulek_kociol": (50, 16, 8), "garncarnia_lawy": (47, 55, 8), "glinianka": (48, 74, 8),
    "brama_pal_zach": (4, 19, 6), "brama_pal_pd": (41, 62, 2), "wybieg": (63, 37, 2), "w5_lada": (89, 17, 6),
}


def miejsca(b):
    for key, (x, y, d) in SPOTS_RECZNIE.items():
        eid = [i for i, e in b.pool.items() if e["name"] == "Miejsce: " + key]
        eid = eid[0] if eid else [i for i, e in b.ev.items() if e["name"] == "Miejsce: " + key][0]
        b.przesun_zd(eid, x, y, "miejsce (ręcznie)")
        b.ev[eid]["pages"][0]["image"]["direction"] = d
        b.zajete.add((x, y))
    for key, (x, y, d) in SPOTS_NOWE.items():
        b.miejsce(key, x, y, d)
    for bud in b.budynki:
        x, y = bud["przed_drzwiami"]
        b.miejsce(bud["klucz"] + "_drzwi", x, y, 8)
    for e in b.ev.values():
        if e["name"].startswith("Miejsce: "): b.zajete.add((e["x"], e["y"]))


def region31(b, mp):
    """lądowanie orła: wolne kratki placyku i dróg w osadzie (bez zdarzeń, przechodnie) - region 31"""
    zd = zd_na(b)
    n = 0
    cells = set(rect(*PLACYK)) | {c for c in b.drogi if 4 <= c[0] <= 89 and 4 <= c[1] <= 63}
    for (x, y) in sorted(cells):
        if (x, y) in zd or b.g(5, x, y): continue
        if b.g(2, x, y) or b.g(3, x, y): continue
        if not mp.stoi(x, y): continue
        b.region(x, y, 31); n += 1
    return n


# ================================================================================================ PUNKTY WTYCZEK (mapowanie c)
PSEUDO_BLOKI = []


def punkt(b, x, y):
    for bl in b.bloki:
        for (x0, y0, x1, y1) in bl["prostokaty"]:
            if x0 <= x <= x1 and y0 <= y <= y1:
                return (x + bl["dx"], y + bl["dy"]), bl["blok"]
    return None, None


PUNKTY = [   # (plik:klucz, stara kratka, ręcznie nowa kratka albo None = przez bloki)
    ("TownQuests_Data.js:225 w6_tent2_o (903)", 41, 7, None), ("TownQuests_Data.js:227 w6_bogdan_o (906)", 37, 8, None),
    ("TownQuests_Data.js:228 w6_halina_o (907)", 41, 10, None),
    ("Garnizon_Data.js:285 PODGRODZIE_EVENTS 660", 27, 19, (45, 21)), ("Garnizon_Data.js:285 PODGRODZIE_EVENTS 661", 36, 10, None),
    ("Underground_Data.js:728 oboz kamera (outside)", 38, 11, None), ("Underground_Data.js:730 oboz Ludmiła", 37, 11, None),
    ("Underground_Data.js:730 oboz Ela", 38, 12, None), ("Underground_Data.js:730 oboz Marek", 39, 11, None),
    ("Underground_Data.js:730 oboz Rafał", 41, 12, None),
    ("Kantor_Data.js:349 SPOTS_PODGRODZIE w5_lada (jest też „Miejsce: w5_lada” na mapie)", 44, 17, (89, 17)),
    ("Okolice_Data.js:89 ENTRY[111] (musi być przechodnie)", 23, 28, (41, 30)),
    ("Homes.js:128 HOUSES.chata.front (też tools/domy/build.py)", 6, 41, None),
    ("Debug.js:155 F9 Chata pod lasem", 6, 41, None),
    ("Zasoby.js:1418 F9 Ogródki Podgrodzia", 56, 13, (66, 15)), ("Zasoby.js:1418 F9 Wysypisko", 52, 27, (72, 66)),
    ("Zasoby.js:1418 F9 Glinianka", 56, 40, (48, 74)),
    ("Zasoby_Data.js:229 odkrycie wysypisko", 52, 25, (72, 70)), ("Zasoby_Data.js:230 odkrycie glinianka", 56, 38, (48, 71)),
    # przeniesienia z innych map na mapę 111
    ("Map112 Chata praczki ev10", 33, 27, None), ("Map113 Chata drwala ev7", 7, 9, None),
    ("Map114 Chata kłusownika ev8", 4, 28, None), ("Map115 Izba znachorki ev9", 15, 27, None),
    ("Map116 Kram starzyzny ev3", 21, 14, None), ("Map117 Dom uchodźców ev5", 32, 9, None),
    ("Map154 Chata pod lasem ev7", 6, 41, None), ("Map125 Przystań ev92", 1, 19, (1, 19)),
    ("Map008 ev237", 90, 17, (90, 17)), ("Map008 ev238", 90, 18, (90, 18)),
    # testy
    ("tests/garnizon_test.js:220 go(111)", 10, 12, (13, 15)), ("tests/garnizon_test.js:234 go(111)", 26, 18, (43, 30)),
    ("tests/podgrodzie_quests_test.js:8 newGame", 26, 17, (43, 30)), ("tests/ludzie_test.js:117 go(111)", 23, 28, (41, 30)),
    ("tests/w6_test.js:193 go(111)", 38, 12, None), ("tests/przystan_test.js:29 newGame", 2, 19, (1, 19)),
    ("tests/wrak_test.js:189 go(111)", 20, 20, (43, 30)), ("tests/field_loss_test.js:242 go(111)", 20, 20, (43, 30)),
    ("tests/podgrodzie_life_test.js:16 newGame", 1, 1, (43, 30)), ("tests/zasoby_test.js:264 go(111)", 56, 13, (66, 15)),
    ("tests/zasoby_test.js:269 go(111)", 52, 27, (72, 66)), ("tests/zasoby_test.js:283 go(111)", 56, 39, (48, 74)),
]


def punkty_wtyczek(b, mp):
    stara = L.Mapa(111)
    out = []
    for (co, ox, oy, recznie) in PUNKTY:
        if recznie:
            n, blok = recznie, "ręcznie"
        else:
            n, blok = punkt(b, ox, oy)
            if n is None:
                n, blok = (ox, oy), "bez zmian"
        ok = mp.inside(*n) and mp.stoi(*n)
        was = stara.inside(ox, oy) and stara.stoi(ox, oy)
        out.append({"co": co, "stare": [ox, oy], "nowe": list(n), "jak": blok, "przechodnie": bool(ok), "stare_przechodnie": bool(was)})
    return out


# ================================================================================================ wnętrza
def polacz_wnetrza(b):
    """drzwi -> kratka wejścia gotowych wnętrz (tools/podgrodzie2/wnetrza/meta.json), jeśli plik jest"""
    p = os.path.join(HERE, "wnetrza", "meta.json")
    if not os.path.exists(p): return 0
    meta = L.load_json(p).get("mapy", {})
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


# ================================================================================================ WYNIKI
def wyniki(b, raw, mp, n31):
    bl = {x["blok"]: x for x in b.bloki}
    budynki = []
    for (eid, klucz, nazwa, blok) in STARE_DRZWI:
        e = b.ev[eid]
        tr = [c["parameters"] for p in e["pages"] for c in p["list"] if c["code"] == 201]
        budynki.append({"klucz": klucz, "nazwa": nazwa, "prostokat": bl[blok]["nowy"], "drzwi_id": eid, "drzwi": [e["x"], e["y"]],
                        "przed_drzwiami": [e["x"], e["y"] + 1], "wnetrze": tr[0][1] if tr else None,
                        "wnetrze_xy": tr[0][2:4] if tr else None, "prefabrykat": "przeniesiony blok starej mapy: " + blok,
                        "nowy": False, "stare_drzwi": b.ev_map[eid]["stare"], "godziny": None if eid == 8 else list(GODZINY),
                        "zawsze_otwarte": eid == 8})
    e = b.ev[94]
    budynki.append({"klucz": "chata_pod_lasem", "nazwa": "Chata pod lasem (dom gracza, Homes.js)", "prostokat": bl["chata_pod_lasem_z_dzialka"]["nowy"],
                    "drzwi_id": 94, "drzwi": [e["x"], e["y"]], "przed_drzwiami": [e["x"], e["y"] + 1], "wnetrze": 154,
                    "wnetrze_xy": [4, 8], "prefabrykat": "przeniesiony blok starej mapy (chata z działką, region 8)", "nowy": False,
                    "stare_drzwi": b.ev_map[94]["stare"], "uwaga": "drzwi obsługuje Homes.js (po nazwie „Chata pod lasem”), front w Homes.js"})
    for x in b.budynki:
        budynki.append(x)
    for x in budynki:
        fx, fy = x["przed_drzwiami"]
        x["przed_drzwiami_przechodnie"] = bool(mp.stoi(fx, fy))
    L.save_json(os.path.join(HERE, "budynki.json"), {"opis": "Budynki z wnętrzami na nowej mapie Podgrodzia (Map111, kopia robocza "
                "tools/podgrodzie2/staging). drzwi = kratka zdarzenia drzwi, przed_drzwiami = lądowanie z wnętrza (twarzą w dół); "
                "nowe budynki i 4 dotąd zamknięte mają przeniesienie zastępcze (wnetrze, 1, 1) - łączy build.py z wnetrza/meta.json "
                "albo koordynator. wymiary/prefabrykat = wygląd z zewnątrz (dla wnętrz: wielkość, drewno/glina).", "budynki": budynki}, indent=1)
    zd = {}
    for e in OLD["events"]:
        if not e: continue
        eid = e["id"]
        if eid in b.ev_map:
            zd[eid] = b.ev_map[eid]
        elif eid in b.ev and eid not in b.nowe_ids:
            zd[eid] = {"nazwa": e["name"], "stare": [e["x"], e["y"]], "nowe": [e["x"], e["y"]], "blok": "bez zmian (poza osadą)"}
    usuniete = []
    for e in OLD["events"]:
        if not e: continue
        eid = e["id"]
        if eid in zd: continue
        powod = b.usuniete_powod.get(eid) or "ozdoba starej osady poza przeniesionymi blokami"
        nowy = eid in b.ev
        usuniete.append({"id": eid, "nazwa": e["name"], "stare": [e["x"], e["y"]], "obraz": e["pages"][-1]["image"]["characterName"],
                         "notatka": e["note"], "powod": powod, "numer_przejety_przez_nowe": b.ev[eid]["name"] if nowy else None})
    nowe = [{"id": i, "nazwa": b.ev[i]["name"], "xy": [b.ev[i]["x"], b.ev[i]["y"]]} for i in sorted(b.nowe_ids) if i in b.ev]
    stare_m = {}
    for e in OLD["events"]:
        if e and e["name"].startswith("Miejsce: "):
            k = e["name"][len("Miejsce: "):]
            n = b.ev[e["id"]]
            stare_m[k] = {"id": e["id"], "stare": [e["x"], e["y"]], "nowe": [n["x"], n["y"], n["pages"][0]["image"]["direction"]],
                          "przechodnie": bool(mp.stoi(n["x"], n["y"]))}
    nowe_m = {k: {"nowe": list(v), "przechodnie": bool(mp.stoi(v[0], v[1]))} for k, v in b.miejsca.items()}
    strefy = dict(b.strefy)
    strefy["orzel_TOWN_SQUARES_111"] = [[4, 18, 84, 20], list(PLACYK), [17, 78, 36, 89]]
    strefy["region31_kratek"] = n31
    hx, hy = HUT["dx"], HUT["dy"]
    strefy["dzialka_chaty_pod_lasem"] = {"region8": [15 + hx, 38 + hy, 34 + hx, 49 + hy], "przesuniecie": [hx, hy],
                                         "uwaga": "Farming: budynki/uprawy gracza na mapie 111 (zapisy) trzeba przesunąć o (dx, dy) jak działkę"}
    strefy["okolice_OLD_111"] = {"OLD": [92, 67], "powieksz_stan_old": [92, 67], "allowOld": ["ogrodek_1", "ogrodek_2", "ogrodek_3"],
                                 "decyzja": "koordynator 2026-10-22: TAK - osada w palisadzie, pas lasu i mur to „stara część”; "
                                            "ogródki 1-3 (w osadzie) z allowOld; wysypisko i glinianka (rzędy >= 68) w nowej części"}
    strefy["zapisy_gry"] = "brak (użytkownik usunął zapisy 2026-10-22): działka Chaty pod lasem przesunięta o (+2, +40) bez migracji"
    strefy["podworka"] = b.podworka
    strefy["okolice_ENTRY_111"] = [41, 30]
    strefy["zasoby_GARDENS"] = {k: b.strefy[k] for k in OGRODKI}
    strefy["swiatla"] = b.swiatla
    out = {
        "opis": "Mapowanie starej mapy Podgrodzia (data/Map111.json) na nową (tools/podgrodzie2/staging/Map111.json). (a) bloki: "
                "stare prostokąty -> przesunięcie dx,dy (pierwszy pasujący blok wygrywa); (b) zdarzenia: id -> stare/nowe x,y, "
                "usunięte, nowe; (c) miejsca: TownLife („Miejsce:” stare i nowe) i punkty wtyczek, testów, przeniesień; "
                "(d) strefy i nowe prostokąty (Zasoby/Okolice: ogródki, wysypisko, glinianka; orzeł; działka).",
        "a_bloki": b.bloki,
        "b_zdarzenia": {"zachowane": {str(k): v for k, v in sorted(zd.items())}, "usuniete": usuniete, "nowe": nowe},
        "c_miejsca": {"stare_miejsca": stare_m, "nowe_miejsca": nowe_m, "punkty_wtyczek": punkty_wtyczek(b, mp)},
        "d_strefy": strefy,
    }
    L.save_json(os.path.join(HERE, "mapowanie.json"), out, indent=1)
    zle = [p for p in out["c_miejsca"]["punkty_wtyczek"] if not p["przechodnie"]]
    zle += [{"co": "miejsce " + k, **v} for k, v in stare_m.items() if not v["przechodnie"]]
    zle += [{"co": "nowe miejsce " + k, **v} for k, v in nowe_m.items() if not v["przechodnie"]]
    zle += [{"co": "przed drzwiami " + x["klucz"], "nowe": x["przed_drzwiami"]} for x in budynki if not x["przed_drzwiami_przechodnie"]]
    if zle:
        print("NIEPRZECHODNIE punkty (%d):" % len(zle))
        for p in zle: print("  ", p["co"], p.get("stare"), "->", p["nowe"])
    return out


def rendery(mp):
    full = L.render(mp, scale=0.25).convert("RGB")
    full.save(DOCS + "nowe_podgrodzie.png", optimize=True)
    for nazwa, reg in (("nowe_podgrodzie_placyk", (26, 14, 64, 44)), ("nowe_podgrodzie_brama", (66, 0, 91, 26)),
                       ("nowe_podgrodzie_dzielnice", (0, 22, 91, 66))):
        im = L.render(mp, region=reg, grid=False, scale=0.5).convert("RGB")
        im.save(DOCS + nazwa + ".png", optimize=True)
    im = L.render(mp, region=(0, 0, 91, 22), grid=False, scale=0.5).convert("RGB")
    im.save(DOCS + "nowe_podgrodzie_polnoc.png", optimize=True)
    im = L.render(mp, region=(0, 62, 91, 95), grid=False, scale=0.5).convert("RGB")
    im.save(DOCS + "nowe_podgrodzie_za_palisada.png", optimize=True)
    try:
        from PIL import Image, ImageDraw
        plan = Image.open(DOCS + "plan_nowe_podgrodzie.png").convert("RGB")
        S, ox, oy = 10, 10, 30
        plan = plan.crop((ox, oy, ox + W * S, oy + H * S))
        mapa = L.render(mp, scale=S / 48.0).convert("RGB")
        out = Image.new("RGB", (W * S * 2 + 30, H * S + 40), (24, 22, 30))
        out.paste(plan, (10, 30)); out.paste(mapa, (W * S + 20, 30))
        d = ImageDraw.Draw(out)
        f = L.font(16, True)
        d.text((10, 6), "Plan (zaakceptowany)", fill=(255, 220, 120), font=f)
        d.text((W * S + 20, 6), "Nowa mapa (tools/podgrodzie2/staging/Map111.json)", fill=(255, 220, 120), font=f)
        out.save(DOCS + "nowe_podgrodzie_porownanie.png", optimize=True)
    except Exception as ex:
        print("porównanie z planem: pominięte", ex)


# ================================================================================================ budowa
def zbuduj(seed=1):
    b = Budowa(seed)
    uklad_grunt(b)
    chata_pod_lasem(b)
    bl = uklad_bloki(b)
    uchodzcy_dodatki(b)
    mur_miasta(b)
    pas_lasu(b)
    palisada(b)
    nowe_budynki(b)
    stare_zamkniete_drzwi(b, bl)
    drogi(b)
    placyk(b)
    b.budynki_wszystkie = [{"klucz": k, "drzwi": [b.ev[eid]["x"], b.ev[eid]["y"]]} for (eid, k, n, bl_) in STARE_DRZWI] + b.budynki
    podworka(b)
    ogrodki_zasoby(b)
    rzemioslo(b)
    zagrody(b)
    za_palisada(b)
    miejsca(b)
    detale(b)
    drobiazgi(b)
    lampy(b)
    przy_scianach(b)
    las_przy_chacie(b)
    zielen(b)
    b.n_zamian = zamiany(b)
    b.n_wnetrza = polacz_wnetrza(b)
    return b


def lampy(b):
    """latarnie (ogień) przy bramach, na placyku, przy uliczkach - w najbliższej wolnej kratce od zamierzonej (słup 2 kratki)"""
    chciane = [(2, 17), (84, 17), (39, 63), (44, 23), (55, 41), (75, 13), (13, 22), (35, 22), (66, 22), (34, 39), (70, 39),
               (22, 51), (58, 56), (51, 62), (30, 62), (8, 62), (78, 62)]
    for (x, y) in chciane:
        zd = zd_na(b)
        ok = None
        for r in range(0, 4):
            ring = sorted({(dx, dy) for dx in range(-r, r + 1) for dy in range(-r, r + 1) if max(abs(dx), abs(dy)) == r},
                          key=lambda d: (abs(d[0]) + abs(d[1]), d))
            for (dx, dy) in ring:
                cx, cy = x + dx, y + dy
                if all(wolna_kratka(b, cx, yy, zd) and (cx, yy) not in b.drogi and (cx, yy) not in b.sciezki for yy in (cy - 1, cy)):
                    ok = (cx, cy); break
            if ok: break
        if not ok:
            print("  latarnia pominięta (brak miejsca):", x, y)
            continue
        lampa(b, *ok)


ZAMIANY = {   # drobiazgi starej osady, które katalog kafli uznaje za połówki większych rzeczy (O1) -> całe drobiazgi
    Ct(5, 11): Ct(6, 15), Ct(6, 11): Ct(6, 15), Ct(5, 9): Ct(13, 4), Ct(5, 4): Ct(3, 4), Ct(5, 5): Ct(3, 5),
}


def zamiany(b):
    """drobiazgi rozcięte w oczach kontroli -> całe; suchy krzaczek B(7,11..12) bez dołu (katalog: 3 kratki) -> usunięty"""
    n = 0
    for y in range(H):
        for x in range(W):
            for z in (2, 3):
                t = b.g(z, x, y)
                if t in ZAMIANY:
                    b.s(z, x, y, ZAMIANY[t]); n += 1
                if t == Bt(7, 11) and b.g(2, x, y + 1) == Bt(7, 12) and b.g(2, x, y + 2) != Bt(7, 13):
                    b.s(z, x, y, 0); b.s(2, x, y + 1, 0); n += 1
    return n


def przeniesienia_przeliczone(b):
    """przybycia z innych map na 111 przeliczone przez bloki (jak zrobi koordynator) - do kontroli w trakcie budowy"""
    def nowe(x, y):
        for bl in b.bloki:
            for (x0, y0, x1, y1) in bl["prostokaty"]:
                if x0 <= x <= x1 and y0 <= y <= y1:
                    return (x + bl["dx"], y + bl["dy"])
        return (x, y)
    orig = L.przeniesienia_do_map
    def f():
        d = dict(orig())
        d[MAP_ID] = [(nowe(x, y) + (src,)) for (x, y, src) in d.get(MAP_ID, [])]
        return d
    L.przeniesienia_do_map = f


NAD_BOHATEREM = {Bt(c, r) for c in (10, 11) for r in range(9, 13)} | {Et(c, r) for c in range(1, 4) for r in range(3, 9)}


def poprawki_kontroli(b, raw):
    """po kontroli (tools/mapy/kontrola.py): daszki i gałęzie martwego drzewa nad wolną kratką -> region 3 (RegionLayers: nad
    bohaterem z woli autora), drobne rzeczy z gwiazdką (kosze) -> region 2 (nie przejdzie przez kosz), dym z komina nad
    wolną kratką -> region 2 (za kominem nikt nie chodzi)"""
    import re
    import kontrola as K
    k = K.Kontrola(L.Mapa(MAP_ID, raw=raw))
    probs = k.run()
    n3 = n2 = 0
    for p in probs:
        x, y = p["x"], p["y"]
        if b.g(5, x, y): continue
        if p["kod"] == "G1":
            m = re.search(r"kafel (\d+)", p["opis"])
            t = int(m.group(1)) if m else 0
            if t in NAD_BOHATEREM: b.region(x, y, 3); n3 += 1
            else: b.region(x, y, 2); n2 += 1
        elif p["kod"] == "G5" and "Dym z komina" in p["opis"]:
            b.region(x, y, 2); n2 += 1
    # zamknięte kieszonki na podwórkach (między domem, płotem i rzeczami, < 13 kratek): kępy trawy, region 2 (i tak
    # nieosiągalne - kontrola D1 nie liczy ich jako martwych kratek); zagrody (zwierzęta w środku) zostają
    mp = L.Mapa(MAP_ID, raw=raw)
    nk = 0
    for p in probs:
        if p["kod"] != "D1": continue
        m = re.search(r"(\d+) kratek od", p["opis"])
        if not m or int(m.group(1)) > 12: continue
        kiesz = mp.flood([(p["x"], p["y"])])
        if len(kiesz) > 12: continue
        for eid, e in list(b.ev.items()):           # kura zamknięta w kieszonce - nie ma jej
            if (e["x"], e["y"]) in kiesz and e["name"] == "Kura sąsiadów":
                b.ev.pop(eid); b.nowe_ids.remove(eid)
        for (x, y) in kiesz:
            if b.g(5, x, y): continue
            b.region(x, y, 2); nk += 1
            if kind_of(b.g(0, x, y)) in (TRAWA, TRAWA_JASNA) and not b.g(1, x, y): b.maluj(1, [(x, y)], KEPKI)
    b.n_kieszonek = nk
    return n3, n2


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
    for p in obrazki(): print("nowy arkusz:", p)
    b = zbuduj(a.seed)
    przeniesienia_przeliczone(b)
    raw = b.wynik()
    n3, n2 = poprawki_kontroli(b, raw)
    print("poprawki po kontroli: region 3 (daszki, gałęzie):", n3, "region 2 (kosze, dym):", n2)
    raw = b.wynik()
    n31 = region31(b, L.Mapa(MAP_ID, raw=raw))
    raw = b.wynik()
    path = os.path.join(STAGING, "Map111.json")
    zapisz_mape(raw, path)
    mp = L.Mapa(MAP_ID, raw=raw)
    wyniki(b, raw, mp, n31)
    print("zapisano", path, "zdarzeń:", sum(1 for e in raw["events"] if e), "usuniętych:", len(b.pool), "region 31:", n31,
          "drzwi połączone z wnętrzami:", b.n_wnetrza)
    if not a.bez_obrazkow:
        rendery(mp)
    if a.podglad:
        x0, y0, x1, y1, sc = [float(v) for v in a.podglad.split(",")]
        im = L.render(mp, region=(int(x0), int(y0), int(x1), int(y1)), grid=sc >= 0.4, scale=sc)
        im.convert("RGB").save(os.path.join(STAGING, "podglad.png"))
    return b, raw


if __name__ == "__main__":
    main(sys.argv[1:])
