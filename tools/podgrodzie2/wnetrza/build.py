# python tools/podgrodzie2/wnetrza/build.py [201 202 ...] [--bez-kontroli] [--bez-obrazkow]
# Wnętrza 12 budynków przebudowanego Podgrodzia (Map111, docs/podgrodzie/NOWE_PODGRODZIE.md): mapy 201-212, wszystkie
# dzieci mapy 111 „Podgrodzie”. Narzędzie i styl jak wnętrza nowego miasta (tools/miasto2/wnetrza/build.py, skopiowane
# i przerobione): budowane od zera, kratka po kratce, na makrach tools/wnetrza/wlib.py (-> tools/interiors/ilib.py ->
# tools/house/houselib.py -> tools/tavern/parter_props.py): zestaw kafli 8 (Winlu Interior), ramka A2, ściany A3 trzy
# rzędy, meble przy ścianach, rzeczy na blatach. Wygląd jak obecne wnętrza Podgrodzia (Map112-117, tools/podgrodzie/
# build_wnetrza.py): biedota - bale, deski, glina, siennikowe prycze, posłania na ziemi, łaty, podarte firanki w małych
# okienkach, pajęczyny; każde światło to ogień (palenisko, piec, łojowe świece, latarnia), słońce tylko z okien za dnia.
#
# Zapisuje WYŁĄCZNIE do kopii roboczej tools/podgrodzie2/wnetrza/:
#   MapNNN.json (format edytora), MapNNN.png (podgląd z siatką), meta.json (dla koordynatora: nazwy do MapInfos, rozmiary,
#   wejścia, wyjścia, miejsca mieszkańców), kontrola/ (obrazki kontroli map) oraz docs/podgrodzie/wnetrza_nowe.png
#   (zestawienie 201-212). Nic nie trafia do data/ ani js/ - instaluje koordynator (MapInfos: rodzic = mapa 111).
# Każda mapa przechodzi kontrolę map (tools/mapy/kontrola.py, bramka ścisła: zero błędów i zero uwag); rzeczy na blatach są
# dopasowane jak w tools/mapy/popraw.py (dopasuj()). Kratki przed drzwiami na Map111: tools/podgrodzie2/budynki.json (plik
# budowniczego mapy; dopóki go nie ma - (1,1) i 'zastepcze': true w meta.json - wystarczy uruchomić build.py ponownie).
# Rekwizyty spoza zestawu 8: img/characters/!Podgrodzie2_Wnetrza.png (props.py obok: piec garncarski, koło garncarskie,
# koryto z gliną, dzbany, posłania ze słomy, zabawki z patyków, koza, grabie i widły) oraz !Miasto2_Wnetrza (tylko czytany:
# stóg siana, słoma, sieć, wiosła, przegroda, łopata, koło od wozu, deski...).
import os, sys, json, copy, re
_MY = os.path.dirname(os.path.abspath(__file__))
_ROOT = os.path.abspath(os.path.join(_MY, "..", "..", ".."))
sys.path.insert(0, os.path.join(_ROOT, "tools", "wnetrza"))
from wlib import *                      # noqa: F401,F403  Interior, makra domku/tawerny/wnętrz, światła L_*
import wlib                             # noqa: E402
import rooms as RM                      # noqa: E402  barrel, sacks, crate, wardrobe, dresser, shelf_tall, rug_k, doormat
import parter_props as PP               # noqa: E402
import houselib as HL                   # noqa: E402

HERE, ROOT = _MY, _ROOT                 # (importy z gwiazdką przynoszą HERE / ROOT innych narzędzi)
OUT = HERE
TOWN = 111
TOWN_NAME = "Podgrodzie"
EXIT_NAME = "Wyjście -> Podgrodzie"
BUDYNKI = os.path.join(ROOT, "tools", "podgrodzie2", "budynki.json")
PIDX = json.load(open(os.path.join(HERE, "props_index.json"), encoding="utf-8"))
MIDX = json.load(open(os.path.join(ROOT, "tools", "miasto2", "wnetrza", "props_index.json"), encoding="utf-8"))
OSADA = json.load(open(os.path.join(ROOT, "tools", "osada", "props_index.json"), encoding="utf-8"))

# rodzaje kafli: A2 ramki i dywany, A3 ściany, A4 podłogi
B_WOOD, B_STONE, B_LOG = 24, 16, 33
W_PLANKS, W_BOARDS, W_PLASTER_BEAM, W_CREAM, W_LOGS, W_RAW, W_BRICK = 48, 49, 51, 52, 59, 71, 75
F_DARK, F_RED, F_COBBLE, F_FLAGS = 83, 84, 96, 97
RUG_MAT, RUG_BROWN, DUST = 37, 21, 23

# notatki map jak Map112-117 (RoomLighting: ciemność wg pory, światła tylko z ognia, słońce z okien)
NOTE_POOR = "<Dust:off>\n<Dark:on>\n<DayNight:off>\n<Zoom:1.5>\n<DarkDay:85>\n<DarkNight:185>"      # Map112, 113, 115-117
NOTE_DIM = "<Dust:off>\n<Dark:on>\n<DayNight:off>\n<Zoom:1.5>\n<DarkDay:95>\n<DarkNight:190>"       # Map114 (kłusownik)
L_KILN = "<Light:260,120,58,15>"


# ======================================================================================================== miejsce przed drzwiami
def _budynki():
    try:
        with open(BUDYNKI, "rb") as f:
            b = json.loads(f.read().decode("utf-8"))
    except Exception:
        return None
    return b.get("budynki", b) if isinstance(b, dict) else b


def budynek(key):
    """wpis budynku z tools/podgrodzie2/budynki.json (plik budowniczego Map111) albo None"""
    items = _budynki()
    if items is None: return None
    if isinstance(items, dict): return items.get(key)
    return next((r for r in items if isinstance(r, dict) and (r.get("klucz") == key or r.get("key") == key)), None)


def przed_drzwiami(key):
    """kratka przed drzwiami budynku na nowej Map111 z budynki.json; gdy go jeszcze nie ma albo nie ma w nim budynku -
    (1, 1) i znacznik 'zastepcze' w meta.json"""
    rec = budynek(key)
    if not isinstance(rec, dict):
        return [1, 1], False
    for k in ("przed drzwiami", "przed_drzwiami", "przedDrzwiami", "kratka przed drzwiami", "przed"):
        v = rec.get(k)
        if isinstance(v, (list, tuple)) and len(v) >= 2:
            return [int(v[0]), int(v[1])], True
        if isinstance(v, dict) and "x" in v and "y" in v:
            return [int(v["x"]), int(v["y"])], True
    return [1, 1], False


# ======================================================================================================== mapa
class Wnetrze(Interior):
    """wnętrze nowego Podgrodzia: Interior (powłoka i zapisy domku dziadka) + wyjście na Map111, miejsca mieszkańców,
    rekwizyty z !Podgrodzie2_Wnetrza, !Miasto2_Wnetrza i osady"""

    def __init__(self, map_id, W, H, display, key, info, note=NOTE_POOR):
        Interior.__init__(self, map_id, W, H, display, key, note=note)
        self.props["bgm"] = {"name": "Town1", "pan": 0, "pitch": 100, "volume": 90}      # jak Map112-117
        self.props["autoplayBgm"] = False
        self.info = info                      # nazwa do MapInfos, opis
        self.extra_spots = []                 # miejsca proponowane (mieszkańcy bez klucza w TownLife)
        self.town_xy, self.town_ok = przed_drzwiami(key)

    def drzwi111(self):
        """drzwi tego budynku na nowej Map111 (budynki.json): zdarzenie, które ma przenosić na kratkę wejścia tego wnętrza"""
        r = budynek(self.key)
        if not r: return None
        return {"id": r.get("drzwi_id"), "x": (r.get("drzwi") or [None, None])[0], "y": (r.get("drzwi") or [None, None])[1],
                "przed_drzwiami": r.get("przed_drzwiami"), "nazwa": r.get("nazwa"),
                "uwaga": "drzwi mają przenosić na kratkę 'wejscie' tego wnętrza (twarzą w górę)"}

    def exit_to(self, x, door_id, town_xy, name, room=None):
        """drzwi w dolnej ramce (x, H-1): dotyk gracza -> Map111 przed drzwiami budynku (twarzą w dół, dźwięk Door1);
        wejście z Podgrodzia ląduje na (x, H-2) twarzą w górę"""
        tx, ty = town_xy
        cmds = [{"code": 250, "indent": 0, "parameters": [dict(DOOR_SE)]},
                {"code": 201, "indent": 0, "parameters": [0, TOWN, tx, ty, 2, 0]}]
        e = {"name": name, "note": "", "pages": [blank_page(priority=0, trigger=1, cmds=cmds)]}
        self.add(x, self.H - 1, e)
        self.exits.append({"x": x, "y": self.H - 1, "door": door_id, "town": [tx, ty], "landing": [x, self.H - 2, 8], "name": name})
        self.hooks.append(("exit", x, self.H - 1))
        self.spots.setdefault("landing", [x, self.H - 2, 8])
        return e

    def wyjscie(self, x, name=EXIT_NAME):
        return self.exit_to(x, None, tuple(self.town_xy), name)

    def miejsce(self, name, x, y, d, proponowane=False):
        """niewidoczne zdarzenie „Miejsce: <name>” (pod postacią, przenikalne, bez poleceń; kierunek strony = kierunek, w który
        patrzy mieszkaniec) - TownLife pokazuje tu mieszkańca, gdy jego plan mówi „w domu” (<klucz>_wnetrze)"""
        page = blank_page(priority=0, through=True, image={"direction": d})
        e = {"name": "Miejsce: %s" % name, "note": "", "pages": [page]}
        self.add(x, y, e)
        self.residents.append({"key": name, "x": x, "y": y, "dir": d})
        self.spots["res_" + name] = [x, y, d]
        if proponowane: self.extra_spots.append(name)
        return e

    def _sheet_prop(self, p, key, x, y, name=None, occupy=None, note="", priority=None, group=None):
        floor = p["place"] == "floor"
        prio = priority if priority is not None else (1 if floor else 0)
        occ = occupy if occupy is not None else p.get("occupy")
        tags = ("<Occupy:%s>" % occ if occ else "") + note
        e = self.ev(x, y, p["sheet"], p["index"], p["direction"], p["pattern"], name=name or p["name"], priority=prio,
                    through=prio != 1, step=bool(p.get("anim")), note=tags)
        cells = {(x, y)}
        if occ:
            kv = dict(t.split("=") for t in occ.split(","))
            cells |= {(x + dx, y + dy) for dy in range(-int(kv.get("up", 0)), int(kv.get("down", 0)) + 1)
                      for dx in range(-int(kv.get("left", 0)), int(kv.get("right", 0)) + 1)}
        if floor and prio == 1:
            self.solid |= cells; self.blocked |= cells
        cat = {"floor": "floorprop", "wall": "wallitem", "table": "tableitem", "decal": "decal"}[p["place"]]
        self.rec(key, cat, cells, group, x=x, y=y, event=True)
        return e

    def p(self, key, x, y, **kw):
        """rekwizyt z !Podgrodzie2_Wnetrza (props_index.json obok)"""
        return self._sheet_prop(PIDX[key], key, x, y, **kw)

    def m(self, key, x, y, **kw):
        """rekwizyt z !Miasto2_Wnetrza (tools/miasto2/wnetrza/props_index.json)"""
        return self._sheet_prop(MIDX[key], key, x, y, **kw)

    def o(self, key, x, y, name=None, occupy=None):
        """rekwizyt osady Milczących (krosno, stojak z płótnem)"""
        p = OSADA[key]
        floor = p["place"] in ("floor", "floor2", "floor3")
        occ = occupy if occupy is not None else p.get("occupy")
        e = self.ev(x, y, p["sheet"], p["index"], p["direction"], p["pattern"], name=name or p["name"],
                    priority=1 if floor else 0, through=not floor, note=("<Occupy:%s>" % occ if occ else ""))
        if floor:
            cells = {(x, y)} | ({(x + 1, y)} if occ and "right=1" in occ else set())
            self.solid |= cells; self.blocked |= cells
        return e

    def pic(self, x, y, char, idx, d, pat, name, floor=False, note="", step=False):
        pr = 1 if floor else 0
        return self.ev(x, y, char, idx, d, pat, name=name, priority=pr, through=not floor, step=step, note=note)

    def meta_rec(self, built):
        evs = built["events"]
        exits = [e for e in evs if e and any(c["code"] == 201 for p in e["pages"] for c in p["list"])]
        spots = {}
        for e in evs:
            if e and e["name"].startswith("Miejsce:"):
                k = e["name"].split(":", 1)[1].strip()
                spots[k] = {"x": e["x"], "y": e["y"], "kierunek": e["pages"][0]["image"]["direction"],
                            "proponowane": k in self.extra_spots}
        lx, ly, ld = self.spots.get("landing", [exits[0]["x"], self.H - 2, 8])
        return {"klucz": self.key, "mapa": self.id, "plik": "Map%03d.json" % self.id,
                "nazwa": self.info["nazwa"], "nazwa_wyswietlana": self.display, "rodzic": TOWN, "opis": self.info["opis"],
                "rozmiar": [self.W, self.H], "tileset": 8, "notatka_mapy": self.props["note"],
                "wejscie": {"x": lx, "y": ly, "kierunek": 8, "opis": "tu staje gracz wchodząc z Podgrodzia (twarzą w górę)"},
                "wyjscie": [{"id": e["id"], "x": e["x"], "y": e["y"], "nazwa": e["name"],
                             "do": {"mapa": TOWN, "x": self.town_xy[0], "y": self.town_xy[1], "kierunek": 2},
                             "zastepcze": not self.town_ok} for e in exits],
                "drzwi_na_mapie_111": self.drzwi111(),
                "miejsca": spots,
                "zdarzen": len([e for e in evs if e])}


SHEET = {"B": B, "C": C, "D": D, "E": E, "A5": A5}


# ---- drobne makra tych wnętrz
def okienko(mp, x, firanka=7, dl=100):
    """małe okienko B(1,0..1) w rzędach 1-2 ściany, podarta / lniana firanka (B row 12: 7 podarta, 1 lniana, 6 wytarta)
    jak w Map112-117, słońce za dnia ze zdarzenia na dolnej kratce okna"""
    mp.tiles("B", 1, 0, 1, 2, x, 1)
    if firanka is not None:
        mp.tiles("B", firanka, 12, 1, 2, x, 1, z=3)
    mp.light(x, 2, wlib.cone(dl), "okno (słońce)")
    mp.wall_items.append(("okna", "window", x, 1))


def okno(mp, x, styl="shutters", firanka=None, dl=100):
    """większe okno dwurzędowe (okiennice / noc) ze słońcem za dnia"""
    window2(mp, x, 1, curtain=firanka, style=styl, length=dl)


def blat(mp, x, y, sheet, c, r):
    mp.tile(3, x, y, SHEET[sheet](c, r))


def stolik(mp, x, y):
    """mały stolik C(6,0..1): blat na (x, y), nogi (x, y+1)"""
    mp.tiles("C", 6, 0, 1, 2, x, y)
    mp.solid |= {(x, y), (x, y + 1)}


def pajeczyna(mp, x, y, which=0):
    mp.t("D", (13, 15, 14)[which], 7, x, y, z=3)


def kurz(mp, cells):
    mp.kind(1, cells, DUST)


def siennik(mp, x, kind="siennik"):
    """prycza ze słomy (łóżko Winlu C 9,13-15 z siennikiem) wezgłowiem pod tylną ścianą, na rzędach 4-5"""
    bed(mp, (9, 13), x, 4, kind=kind)


def kosz(mp, x, y):
    """kosz przykryty płótnem D(14,3..4): stoi na (x, y), wierzch na rzędzie wyżej"""
    mp.tiles("D", 14, 3, 1, 2, x, y - 1)
    mp.solid.add((x, y))


def polka(mp, x, kind="chleb"):
    """wysoka półka z jedzeniem C(5..7, 6..8) - trzy rzędy, stoi na rzędzie 4 pod tylną ścianą: chleb (5), chleb i owoce
    w koszyku (6), kapusta, chleb i sery (7)"""
    c = {"chleb": 5, "owoce": 6, "kapusta": 7}[kind]
    mp.tiles("C", c, 6, 1, 3, x, 2)
    mp.solid.add((x, 4))


def kredens(mp, x, kind="garnki"):
    """szafka z naczyniami C(5..7, 9..10) - dwa rzędy, stoi na rzędzie 4: kubki i miski (5), zamknięta (6), garnki i słoje (7)"""
    c = {"kubki": 5, "zamknieta": 6, "garnki": 7}[kind]
    mp.tiles("C", c, 9, 1, 2, x, 3)
    mp.solid.add((x, 4))


def lawa_naczynia(mp, x, y=4):
    """niska ława-półka z dzbanami na wierzchu i miskami na półce C(6..7, 4..5): wierzch na (x..x+1, y), półka y+1"""
    mp.tiles("C", 6, 4, 2, 2, x, y)
    mp.solid |= {(x, y), (x + 1, y), (x, y + 1), (x + 1, y + 1)}


def miotla(mp, x, y=4):
    """miotła oparta o ścianę D(7,6..7)"""
    mp.t("D", 7, 6, x, y - 1); mp.t("D", 7, 7, x, y); mp.solid.add((x, y))


# ======================================================================================================== 201 Szynk
def szynk():
    """Szynk - podła karczemka biedoty: długi szynkwas z desek, za nim na ścianie beczki na stojaku z kranami i beczka
    piwa, kufle na wieszaku, kreski kredą (długi gości); dwa stoły z desek z ławami i stołkami - na jednym kości i karty;
    ciemno, łojowe świece, jedna latarnia; w kącie za przepierzeniem kąt do spania szynkarza (siennik, skrzynia, świeca
    na stołku, worki i beczki zapasu)"""
    W, H = 20, 12
    mp = Wnetrze(201, W, H, "Szynk", "szynk", {"nazwa": "Szynk", "opis": "podła karczemka: szynkwas z beczkami, stoły z ławami, kąt szynkarza"},
                 note=NOTE_DIM)
    X = 6
    rooms = [("Izba szynku", [(1, 4, 14, 10)], F_DARK, W_LOGS),
             ("Kąt szynkarza", [(16, 4, 18, 10)], F_DARK, W_PLANKS)]
    mp.shell(rooms, openings=[("Kąt szynkarza", (15, 8, 15, 8))], border=B_WOOD, exit_x=X, exit_room="Izba szynku")
    mp.shadows()
    # ---- ściana: okienko | kufle | kreski kredą | latarnia | beczka, beczki na stojaku, beczki w słupku
    okienko(mp, 2, firanka=7, dl=90)
    mp.prop("kufle_wieszak", 4, 2, name="Wieszak z kuflami")
    mp.tprop("kreda_kreski", 7, 2, name="Kreski kredą (długi gości)")
    lantern(mp, 9, 1, style=1, light=L_LANTERN_SMALL, name="Latarnia z łojówką")
    mp.tiles("E", 0, 7, 4, 2, 10, 3); mp.solid |= {(10, 4), (11, 4), (12, 4), (13, 4)}     # beczki na stojaku z kranami
    RM.barrel(mp, 9, 4, "plain")
    mp.tiles("E", 4, 7, 1, 2, 14, 3); mp.solid.add((14, 4))                                 # beczki jedna na drugiej
    # ---- szynkwas z desek; na nim kubki, dzban i łojowa świeca
    counter_h(mp, 9, 12, 6)
    blat(mp, 9, 6, "D", 3, 11); blat(mp, 12, 6, "D", 1, 15)
    candle_on(mp, 10, 7, name="Łojowa świeca")
    mp.miejsce("szynkarz_wnetrze", 11, 5, 2)
    # ---- stół z kośćmi i kartami, ławy
    table_h(mp, 1, 6, 3, style=6)
    bench_h(mp, 1, 5); bench_h(mp, 1, 8)
    stool(mp, 4, 7)
    mp.prop("kubek_kosci", 1, 6, name="Kubek i kości")
    mp.prop("karty", 2, 6, name="Rozłożone karty")
    candle_on(mp, 3, 7, name="Łojowa świeca")
    # ---- drugi stół przy szynkwasie
    table_h(mp, 9, 9, 3, style=6)
    stool(mp, 8, 10); stool(mp, 12, 10)
    blat(mp, 9, 9, "D", 2, 11); blat(mp, 11, 9, "D", 0, 15)
    candle_on(mp, 10, 10, name="Łojowa świeca")
    RM.barrel(mp, 4, 9, "plain")                                           # beczka za stolik
    blat(mp, 4, 8, "D", 2, 11)
    stool(mp, 3, 9); stool(mp, 5, 9)
    RM.barrel(mp, 1, 10, "plain")
    RM.sacks(mp, 13, 10, wide=False)
    mp.m("rozsypane_wiory", 7, 9, name="Trociny na podłodze")
    pajeczyna(mp, 1, 1, 0); pajeczyna(mp, 14, 1, 1)
    # ---- kąt szynkarza
    okienko(mp, 17, firanka=7, dl=80)
    RM.chest(mp, 16, 4, name="Skrzynia szynkarza")
    stool_candle(mp, 17, 4)
    siennik(mp, 18, kind="siennik szynkarza")
    mp.hprop("kolki_ubrania", 16, 3, name="Kołki z kapotą")
    RM.barrel(mp, 18, 10, "plain")
    RM.crate(mp, 16, 10, "two")
    mp.wyjscie(X)
    return mp


# ======================================================================================================== 202 Przytułek
def przytulek():
    """Przytułek - długa izba z desek: prycze ze słomy pod tylną ścianą dla chorych (cztery z lewej, cztery z prawej),
    posłania na ziemi dla uchodźców przy dolnej ścianie; pośrodku kocioł z zupą nad ogniem i stolik z miskami, pod ścianą
    pęki ziół do suszenia, wiadro z resztką wody i miska przy chorych; za przepierzeniem kąt opiekunki (siennik, skrzynia,
    stolik z moździerzem i flaszką, półka ze słojami ziół, świeca)"""
    W, H = 22, 11
    mp = Wnetrze(202, W, H, "Przytułek", "przytulek", {"nazwa": "Przytułek", "opis": "izba z pryczami dla chorych i uchodźców, kocioł z zupą, kąt opiekunki"})
    X = 10
    rooms = [("Izba", [(1, 4, 16, 9)], F_DARK, W_BOARDS),
             ("Kąt opiekunki", [(18, 4, 20, 9)], F_DARK, W_PLANKS)]
    mp.shell(rooms, openings=[("Kąt opiekunki", (17, 8, 17, 8))], border=B_WOOD, exit_x=X, exit_room="Izba")
    mp.shadows()
    # ---- prycze chorych pod ścianą
    for x in (1, 2, 3, 4, 13, 14, 15, 16):
        siennik(mp, x, kind="prycza ze słomy")
    stolik(mp, 5, 4)
    blat(mp, 5, 4, "D", 0, 12)                                          # miska z wodą przy chorych
    stolik(mp, 12, 4)
    candle_on(mp, 12, 5, name="Łojowa świeca")
    # ---- ściana: okienko | zioła | zioła | latarnia | okienko
    okienko(mp, 6, firanka=7, dl=100); okienko(mp, 11, firanka=7, dl=100)
    hang_pole(mp, 8, 2, "herbs", name="Zioła do suszenia"); hang_pole(mp, 9, 2, "herbs", name="Zioła do suszenia")
    hang_pole(mp, 7, 2, "garlic", name="Czosnek do suszenia")
    lantern(mp, 10, 1, style=1, light=L_LANTERN_SMALL, name="Latarnia z łojówką")
    mp.tprop("wiadro_woda", 7, 4, name="Wiadro z resztką wody")
    # ---- kocioł z zupą, stolik z miskami
    PP.cauldron_fire(mp, 8, 6)
    stolik(mp, 6, 6)
    blat(mp, 6, 6, "D", 0, 14)
    mp.miejsce("opiekunka_wnetrze", 9, 6, 4)
    # ---- posłania uchodźców na ziemi, ich tobołki
    mp.p("poslanie_szare", 1, 9); mp.p("poslanie", 2, 9); mp.p("poslanie_szare", 4, 9)
    mp.p("poslanie", 14, 9); mp.p("poslanie_szare", 15, 9)
    RM.sacks(mp, 12, 9, wide=False)
    mp.t("D", 14, 4, 6, 9); mp.solid.add((6, 9))                        # tobołek
    pajeczyna(mp, 1, 1, 0); pajeczyna(mp, 16, 1, 1)
    # ---- kąt opiekunki
    okienko(mp, 19, firanka=1, dl=80)
    RM.chest(mp, 18, 4, name="Skrzynia opiekunki")
    stool_candle(mp, 19, 4)
    siennik(mp, 20, kind="siennik opiekunki")
    stolik(mp, 20, 7)
    mp.m("mozdzierz", 20, 7, name="Moździerz z ziołami")
    mp.hprop("kolki_ubrania", 18, 3, name="Kołki z fartuchem")
    RM.barrel(mp, 19, 9, "plain")
    RM.sacks(mp, 20, 9, wide=False)
    mp.wyjscie(X)
    return mp


# ======================================================================================================== 203 Garncarnia
def garncarnia():
    """Garncarnia - warsztat garncarza: piec do wypalania z ogniem pod ceglaną ścianą, polana obok, trzy półki z misami,
    talerzami i kubkami, koło garncarskie z mokrą gliną, koryto z gliną i wiadro wody, stół z surowymi i wypalonymi
    dzbanami, garnki na podłodze, worek piasku; za ścianką kąt mieszkalny (siennik, skrzynia, stolik, świeca, czosnek)"""
    W, H = 16, 11
    mp = Wnetrze(203, W, H, "Garncarnia", "garncarnia", {"nazwa": "Garncarnia", "opis": "warsztat garncarza z piecem i kołem, kąt mieszkalny"})
    X = 6
    rooms = [("Warsztat", [(1, 4, 10, 9)], F_DARK, W_LOGS),
             ("Izba", [(12, 4, 14, 9)], F_DARK, W_PLANKS)]
    mp.shell(rooms, openings=[("Izba", (11, 8, 11, 8))], border=B_WOOD, exit_x=X, exit_room="Warsztat")
    mp.restyle_face(mp.rect(1, 1, 3, 3), W_BRICK)
    mp.shadows()
    # ---- piec do wypalania pod ceglaną ścianą, polana
    mp.p("piec_garncarski", 1, 4, note=L_KILN)
    PP.firewood(mp, 3, 4)
    # ---- półki z naczyniami, okienka
    okienko(mp, 4, firanka=None, dl=100); okienko(mp, 9, firanka=None, dl=100)
    lawa_naczynia(mp, 5, 4)
    RM.dresser(mp, 7, 4, "cupboard")
    RM.sacks(mp, 10, 4, wide=False)
    # ---- koło garncarskie, koryto z gliną, wiadro
    mp.p("kolo_garncarskie", 3, 7)
    mp.miejsce("garncarz_wnetrze", 4, 7, 4)
    mp.p("koryto_glina", 1, 9)
    mp.tprop("wiadro_woda", 3, 9, name="Wiadro wody do gliny")
    # ---- stół z dzbanami
    table_h(mp, 7, 7, 3, style=6)
    mp.p("dzbany_surowe", 7, 7)
    mp.p("dzbany_wypalone", 9, 7)
    candle_on(mp, 8, 8, name="Łojowa świeca")
    mp.p("dzbany_podloga", 10, 6)
    mp.m("rozsypane_wiory", 2, 6, name="Okruchy gliny")
    kurz(mp, mp.rect(2, 7, 4, 8)); kurz(mp, mp.rect(1, 8, 2, 8))          # glina rozchlapana wokół koła i koryta
    RM.crate(mp, 4, 9, "jug")
    mp.m("sloma", 8, 9, name="Słoma do pakowania garnków")
    # ---- kąt mieszkalny
    hang_pole(mp, 12, 2, "garlic")
    okienko(mp, 13, firanka=7, dl=80)
    RM.chest(mp, 12, 4)
    stool_candle(mp, 13, 4)
    siennik(mp, 14, kind="siennik garncarza")
    stolik(mp, 14, 7)
    blat(mp, 14, 7, "D", 0, 14)
    stool(mp, 13, 8)
    mp.wyjscie(X)
    return mp


# ======================================================================================================== 204 Lepianka 1
def lepianka1():
    """Lepianka 1 - biedna rodzina z dzieckiem: jedna izba o glinianych ścianach, palenisko z garnkiem na środku, posłania
    ze słomy na ziemi (rodziców i małe dziecka), zabawki z patyków i kamyków, ława przy ogniu, kosz, wiadro, worek"""
    W, H = 12, 10
    mp = Wnetrze(204, W, H, "Lepianka", "lepianka1", {"nazwa": "Lepianka 1 (rodzina z dzieckiem)", "opis": "gliniana izba biednej rodziny z dzieckiem"})
    X = 7
    mp.shell([("Izba", [(1, 4, 10, 8)], F_DARK, W_RAW)], border=B_WOOD, exit_x=X)
    mp.shadows()
    okienko(mp, 3, firanka=7, dl=90); okienko(mp, 9, firanka=7, dl=90)
    hang_pole(mp, 6, 2, "garlic", name="Wiszący czosnek i cebula")
    mp.hprop("kolki_ubrania", 5, 3, name="Kołki z łataną odzieżą")
    # ---- posłania na ziemi pod ścianą
    mp.p("poslanie", 1, 5, name="Posłanie rodziców")
    mp.p("poslanie_szare", 2, 5, name="Posłanie rodziców")
    mp.p("poslanie_male", 3, 5, name="Posłanie dziecka")
    # ---- palenisko na środku
    PP.cauldron_fire(mp, 5, 6)
    bench_h(mp, 4, 8)
    PP.firewood(mp, 7, 4)
    stool(mp, 6, 6)
    # ---- dziecko i jego zabawki
    mp.p("zabawki", 8, 5)
    mp.miejsce("dziecko_wnetrze", 8, 6, 8)
    kosz(mp, 10, 4)
    RM.sacks(mp, 9, 4, wide=False)
    mp.tprop("wiadro_woda", 10, 8, name="Wiadro (prawie puste)")
    mp.t("D", 13, 5, 1, 7); mp.t("D", 13, 6, 1, 8); mp.solid.add((1, 8))     # połamana skrzynka
    pajeczyna(mp, 1, 1, 0); pajeczyna(mp, 10, 1, 1)
    mp.wyjscie(X)
    return mp


# ======================================================================================================== 205 Lepianka 2
def lepianka2():
    """Lepianka 2 - wdowa z kozą w izbie: siennik wdowy ze świecą na stołku, palenisko z kotłem w kamiennej ścianie,
    kołowrotek, stolik z chlebem; w kącie za przegrodą z desek koza na słomie, maselnica (mleko kozie), kosz"""
    W, H = 13, 10
    mp = Wnetrze(205, W, H, "Lepianka wdowy", "lepianka2", {"nazwa": "Lepianka 2 (wdowa z kozą)", "opis": "gliniana izba wdowy z kozą w kącie"})
    X = 6
    mp.shell([("Izba", [(1, 4, 11, 8)], F_DARK, W_CREAM)], border=B_WOOD, exit_x=X)
    mp.restyle_face(mp.rect(4, 1, 6, 3), W_RAW)
    mp.shadows()
    hearth_cauldron(mp, 5, 4)
    okienko(mp, 2, firanka=7, dl=90); okienko(mp, 10, firanka=None, dl=90)
    siennik(mp, 1, kind="siennik wdowy")
    stool_candle(mp, 2, 4)
    mp.hprop("kolowrotek", 3, 6, name="Kołowrotek")
    stolik(mp, 2, 7)
    blat(mp, 2, 7, "D", 0, 15)
    stool(mp, 1, 8)
    mp.hprop("kolki_ubrania", 7, 3, name="Kołki z chustą")
    # ---- kąt kozy za przegrodą
    mp.m("przegroda", 9, 5, name="Przegroda z desek")
    mp.hprop("maselnica", 8, 4, name="Maselnica (mleko kozie)")
    mp.m("sloma", 10, 5); mp.m("sloma", 11, 7); mp.m("sloma", 10, 8)
    mp.p("koza", 10, 6, name="Koza wdowy")
    kosz(mp, 11, 4)
    mp.tprop("cebrzyk_woda", 9, 8, name="Cebrzyk")
    pajeczyna(mp, 11, 1, 1)
    mp.wyjscie(X)
    return mp


# ======================================================================================================== 206 Chata 3 (węglarz)
def chata3():
    """Chata 3 - węglarz (chata z bali): izba z paleniskiem w kamiennej ścianie, siennik, stół z chlebem, łopata i worki
    węgla drzewnego, kurz; obok komora z węglem (kupy węgla, worki, wiadro)"""
    W, H = 14, 10
    mp = Wnetrze(206, W, H, "Chata węglarza", "chata3", {"nazwa": "Chata 3 (węglarz)", "opis": "izba węglarza i komora z węglem"},
                 note=NOTE_DIM)
    X = 4
    rooms = [("Izba", [(1, 4, 8, 8)], F_DARK, W_LOGS),
             ("Komora", [(10, 4, 12, 8)], F_DARK, W_PLANKS)]
    mp.shell(rooms, openings=[("Komora", (9, 7, 9, 7))], border=B_LOG, exit_x=X, exit_room="Izba")
    mp.restyle_face(mp.rect(5, 1, 7, 3), W_RAW)
    mp.shadows()
    hearth_cauldron(mp, 6, 4)
    okno(mp, 2, styl="shutters", firanka=None, dl=90)
    mp.m("lopata", 1, 4, name="Łopata węglarza")
    mp.p("worki_wegla", 2, 4)
    siennik(mp, 8, kind="siennik węglarza")
    mp.hprop("kolki_ubrania", 8, 2, name="Kołki z okopconą kapotą")
    table_h(mp, 1, 6, 2, style=6)
    blat(mp, 1, 6, "D", 5, 10)
    candle_on(mp, 2, 7, name="Łojowa świeca")
    stool(mp, 3, 7)
    kurz(mp, mp.rect(5, 7, 8, 8))
    pajeczyna(mp, 1, 1, 0)
    # ---- komora z węglem
    mp.p("worki_wegla", 10, 4)
    RM.sacks(mp, 12, 4, wide=False)
    mp.p("kupa_wegla", 11, 8)
    mp.tprop("wiadro_woda", 10, 8, name="Wiadro (do gaszenia)")
    kurz(mp, mp.rect(10, 6, 12, 7))
    pajeczyna(mp, 12, 1, 1)
    mp.wyjscie(X)
    return mp


# ======================================================================================================== 207 Chata 4 (tkaczka)
def chata4():
    """Chata 4 - tkaczka (chata z desek): krosno z lnem pod oknem, kołowrotek, kosz przędzy, stojak z płótnem, palenisko
    w kamiennej ścianie, siennik ze świecą, stół z miską, kołki z chustami, lniane firanki"""
    W, H = 14, 10
    mp = Wnetrze(207, W, H, "Chata tkaczki", "chata4", {"nazwa": "Chata 4 (tkaczka)", "opis": "izba tkaczki z krosnem"})
    X = 6
    mp.shell([("Izba", [(1, 4, 12, 8)], F_DARK, W_PLANKS)], border=B_WOOD, exit_x=X)
    mp.restyle_face(mp.rect(7, 1, 9, 3), W_RAW)
    mp.shadows()
    hearth_cauldron(mp, 8, 4)
    okienko(mp, 2, firanka=1, dl=110); okienko(mp, 5, firanka=1, dl=110); okienko(mp, 11, firanka=1, dl=100)
    mp.o("krosno", 1, 4)
    mp.hprop("kolowrotek", 4, 4, name="Kołowrotek")
    kosz(mp, 3, 4)
    mp.hprop("kolki_ubrania", 6, 3, name="Kołki z chustami")
    siennik(mp, 12, kind="siennik tkaczki")
    stool_candle(mp, 11, 4)
    mp.o("stojak_pasy", 9, 7, name="Stojak z płótnem")
    RM.rug_k(mp, 7, 5, 9, 6, RUG_MAT)
    table_h(mp, 1, 7, 2, style=6)
    blat(mp, 1, 7, "D", 0, 14)
    candle_on(mp, 2, 8, name="Łojowa świeca")
    stool(mp, 3, 8)
    RM.chest(mp, 12, 7, name="Skrzynia z płótnem")
    mp.wyjscie(X)
    return mp


# ======================================================================================================== 208 Chata 5 (rybak)
def chata5():
    """Chata 5 - stary rybak (chata pod strzechą): palenisko z kotłem, sieć na ścianie, suszone ryby, para wioseł w kącie,
    beczka solonych ryb, kosz na ryby, siennik, stół z talerzem ryb i świecą"""
    W, H = 12, 10
    mp = Wnetrze(208, W, H, "Chata rybaka", "chata5", {"nazwa": "Chata 5 (stary rybak)", "opis": "izba starego rybaka"})
    X = 5
    mp.shell([("Izba", [(1, 4, 10, 8)], F_DARK, W_LOGS)], border=B_LOG, exit_x=X)
    mp.restyle_face(mp.rect(5, 1, 7, 3), W_RAW)
    mp.shadows()
    hearth_cauldron(mp, 6, 4)
    mp.m("siec", 3, 2)
    hang_pole(mp, 9, 2, "fish", name="Suszone ryby")
    okienko(mp, 2, firanka=6, dl=90); okienko(mp, 8, firanka=6, dl=90)
    mp.m("wiosla", 1, 4)
    RM.barrel(mp, 2, 4, "plain")
    siennik(mp, 10, kind="siennik rybaka")
    kosz(mp, 9, 4)                                                          # kosz na ryby (przykryty)
    table_h(mp, 1, 7, 2, style=6)
    blat(mp, 1, 7, "D", 1, 13)
    candle_on(mp, 2, 8, name="Łojowa świeca")
    stool(mp, 3, 8)
    mp.m("wioslo", 10, 7, name="Złamane wiosło")
    RM.rug_k(mp, 5, 6, 7, 6, RUG_MAT)
    stool(mp, 8, 6)
    pajeczyna(mp, 10, 1, 1)
    mp.wyjscie(X)
    return mp


# ======================================================================================================== 209 Chata pod strzechą
def strzecha():
    """Chata pod strzechą (dawniej zamknięta, ev4) - zwykły biedny dom: palenisko z kotłem pośrodku tylnej ściany, dwa
    sienniki, stół z miską i chlebem, worki, beczka, kołki z odzieżą, mata przed ogniem"""
    W, H = 13, 10
    mp = Wnetrze(209, W, H, "Chata pod strzechą", "strzecha", {"nazwa": "Chata pod strzechą", "opis": "biedna izba"})
    X = 6
    mp.shell([("Izba", [(1, 4, 11, 8)], F_DARK, W_PLANKS)], border=B_LOG, exit_x=X)
    mp.restyle_face(mp.rect(5, 1, 7, 3), W_RAW)
    mp.shadows()
    hearth_cauldron(mp, 6, 4)
    okienko(mp, 3, firanka=7, dl=100); okienko(mp, 9, firanka=7, dl=100)
    siennik(mp, 1); siennik(mp, 11)
    stool_candle(mp, 2, 4)
    mp.hprop("kolki_ubrania", 4, 3); mp.hprop("kolki_ubrania", 8, 3)
    RM.chest(mp, 10, 4)
    table_h(mp, 2, 7, 2, style=6)
    blat(mp, 2, 7, "D", 0, 14); blat(mp, 3, 7, "D", 0, 15)
    stool(mp, 4, 8); stool(mp, 1, 8)
    RM.sacks(mp, 9, 8)
    RM.barrel(mp, 11, 8, "plain")
    RM.rug_k(mp, 5, 6, 7, 6, RUG_MAT)
    pajeczyna(mp, 1, 1, 0)
    mp.wyjscie(X)
    return mp


# ======================================================================================================== 210 Chałupa z desek
def deski():
    """Chałupa z desek (dawniej zamknięta, ev9) - izba z piecem kuchennym, siennik i małe posłanie dziecka, stół z dwoma
    stołkami, kołki; obok spiżarka (półki ze słojami i chlebem, szynka i czosnek na drążku, beczka, worki, skrzynka)"""
    W, H = 15, 10
    mp = Wnetrze(210, W, H, "Chałupa z desek", "deski", {"nazwa": "Chałupa z desek", "opis": "izba i spiżarka"})
    X = 5
    rooms = [("Izba", [(1, 4, 9, 8)], F_DARK, W_BOARDS),
             ("Spiżarka", [(11, 4, 13, 8)], F_DARK, W_PLANKS)]
    mp.shell(rooms, openings=[("Spiżarka", (10, 7, 10, 7))], border=B_WOOD, exit_x=X, exit_room="Izba")
    mp.shadows()
    PP.kitchen_stove(mp, 2, 4)
    PP.firewood(mp, 1, 4)
    okienko(mp, 4, firanka=6, dl=100); okienko(mp, 7, firanka=6, dl=100)
    mp.hprop("kolki_ubrania", 6, 3)
    siennik(mp, 9)
    mp.p("poslanie_male", 8, 5, name="Posłanie dziecka")
    table_sq(mp, 2, 6, style=6)
    blat(mp, 2, 6, "D", 0, 14); blat(mp, 3, 6, "D", 5, 10)
    stool(mp, 1, 7); stool(mp, 4, 7)
    miotla(mp, 3, 4)
    # ---- spiżarka
    polka(mp, 11, "kapusta"); polka(mp, 12, "chleb")
    hang_pole(mp, 13, 2, "hams", name="Szynka na drążku")
    RM.barrel(mp, 13, 4, "plain")
    RM.sacks(mp, 11, 8)
    RM.crate(mp, 13, 8, "jug")
    pajeczyna(mp, 13, 1, 1)
    mp.wyjscie(X)
    return mp


# ======================================================================================================== 211 Szopa
def szopa():
    """Szopa (dawniej zamknięta, ev12) - narzędzia i rupiecie: stojak z siekierami, grabie i widły, łopata, deski, koło
    od wozu, drabina, lina na kołku, taczka, stóg siana i rozsypana słoma, pniak z siekierą, kłoda, połamane skrzynki,
    beczka, latarnia"""
    W, H = 13, 10
    mp = Wnetrze(211, W, H, "Szopa", "szopa", {"nazwa": "Szopa", "opis": "narzędzia, rupiecie, taczka, siano"}, note=NOTE_DIM)
    X = 6
    mp.shell([("Szopa", [(1, 4, 11, 8)], F_DARK, W_BOARDS)], border=B_WOOD, exit_x=X)
    mp.shadows()
    mp.tiles("E", 13, 12, 1, 2, 1, 3); mp.solid.add((1, 4))                # stojak z siekierami
    mp.p("grabie_widly", 2, 4)
    mp.m("lopata", 3, 4)
    mp.m("deski_oparte", 4, 4)
    lantern(mp, 6, 1, style=1, light=L_LANTERN_SMALL)
    okno(mp, 8, styl="shutters", firanka=None, dl=90)
    mp.m("lina", 7, 2)
    mp.m("kolo_wozu", 9, 4)
    mp.tprop("drabina", 10, 4)
    mp.tiles("D", 13, 5, 1, 2, 11, 3); mp.solid.add((11, 4))                # połamana skrzynia
    mp.tprop("taczka", 1, 7, name="Taczka")
    mp.m("kloda", 1, 8 + 0)
    mp.m("pniak_siekiera", 8, 6)
    mp.m("stog_siana", 10, 8)
    mp.m("sloma", 8, 8); mp.m("sloma", 9, 6)
    RM.barrel(mp, 4, 8, "plain")
    pajeczyna(mp, 1, 1, 0); pajeczyna(mp, 11, 1, 1)
    mp.wyjscie(X)
    return mp


# ======================================================================================================== 212 Komórka
def komorka():
    """Komórka (dawniej zamknięta, ev17) - skład i spiżarka: worki ze zbożem i mąką, beczki (kapusta, jabłka), półki ze
    słojami i chlebem, szynka i czosnek na drążkach, skrzynie i skrzynki, sterta beczek, latarnia, pajęczyny i kurz"""
    W, H = 12, 10
    mp = Wnetrze(212, W, H, "Komórka", "komorka", {"nazwa": "Komórka", "opis": "skład: worki, beczki, skrzynie, spiżarka"}, note=NOTE_DIM)
    X = 5
    mp.shell([("Komórka", [(1, 4, 10, 8)], F_DARK, W_PLANKS)], border=B_WOOD, exit_x=X)
    mp.shadows()
    RM.sacks(mp, 1, 4)
    RM.sacks(mp, 3, 4, wide=False)
    hang_pole(mp, 4, 2, "hams", name="Szynki na drążku"); hang_pole(mp, 5, 2, "garlic", name="Czosnek na drążku")
    polka(mp, 6, "kapusta"); polka(mp, 7, "owoce")
    okienko(mp, 8, firanka=None, dl=80)
    RM.barrel(mp, 9, 4, "plain"); RM.barrel(mp, 10, 4, "apples")
    lantern(mp, 3, 1, style=1, light=L_LANTERN_SMALL)
    mp.tprop("sterta_beczek", 2, 8, name="Sterta beczek")
    RM.chest(mp, 1, 6, name="Skrzynia")
    RM.crate(mp, 10, 8, "tall"); RM.crate(mp, 10, 6, "two")
    kurz(mp, mp.rect(7, 7, 8, 8))
    pajeczyna(mp, 1, 1, 0); pajeczyna(mp, 10, 1, 1)
    mp.wyjscie(X)
    return mp


BUILDERS = {201: szynk, 202: przytulek, 203: garncarnia, 204: lepianka1, 205: lepianka2, 206: chata3, 207: chata4,
            208: chata5, 209: strzecha, 210: deski, 211: szopa, 212: komorka}


# ======================================================================================================== dopasowanie przedmiotów
def dopasuj(mid, raw, verbose=True):
    """przedmioty na blatach (P1/P2/P3): jak tools/mapy/popraw.py (etap 2) - kandydaci z jego generatorów (kafel na sąsiednią
    kratkę tego samego mebla, kafel jako zdarzenie z obrazkiem przesuniętym <Px:0,dy>) plus, dla świec i innych obrazków-
    zdarzeń, przesunięcie obrazka o dy px; przyjęty kandydat usuwa problem, nie dodaje nowego i leży najdalej od krawędzi"""
    sys.path.insert(0, os.path.join(ROOT, "tools", "mapy"))
    import popraw as PO
    import kontrola as K
    ed = PO.Edycja(mid, copy.deepcopy(raw))
    kat = K.Kat(raw["tilesetId"])
    pominiete = set()
    log = []
    for kod in ("P1", "P2", "P3"):
        guard = 0
        while guard < 30:
            guard += 1
            cur, kc = PO.problemy(ed.raw, mid)
            mp = ed.mapa()
            todo = [p for p in cur if p["kod"] == kod and not p.get("ukryj") and (p["kod"], p["x"], p["y"], p["opis"][:40]) not in pominiete
                    and (p["waga"] != "info" or kod == "P3")]
            if not todo: break
            p = todo[0]
            cel = (p["kod"], p["x"], p["y"])
            kands = list(PO.GENERATORY[kod](ed, kat, p, mp, kc))
            m = re.search(r"zdarzenie (\d+) '", p["opis"])
            if m:
                eid = int(m.group(1))
                ev = next((z for z in mp.zd if z.id == eid), None)
                if ev is not None and not ev.komendy and not ev.name.startswith("Miejsce:"):
                    for dy in range(-40, 25, 2):
                        if (0, dy) == ev.px: continue
                        nota = re.sub(r"<Px:-?\d+,-?\d+>", "", ev.note, flags=re.I) + ("<Px:0,%d>" % dy if dy else "")
                        kands.append(("obrazek zdarzenia %d o %d px" % (eid, dy), lambda e2, eid=eid, nota=nota: e2.notatka(eid, nota),
                                      "zd:%d" % eid))
            mt = re.search(r"kafel (\d+) ", p["opis"])
            if mt and not m and kod == "P2":
                t = int(mt.group(1)); x, y = p["x"], p["y"]
                if ed.t(3, x, y) == t:
                    nid = ed.wolny_numer()
                    for (cy, rng) in ((y, range(-24, 25, 2)), (y + 1, range(-44, -2, 2))):
                        if not (0 <= cy < ed.H): continue
                        for dy in rng:
                            def zd(e2, dy=dy, cy=cy, t=t, x=x, y=y, nid=nid):
                                e2.kafel(3, x, y, 0)
                                e2.dodaj_zd(PO.zd_przedmiot(nid, x, cy, t, dy))
                            kands.append(("kafel %d (%d,%d) jako zdarzenie w (%d,%d) %+d px" % (t, x, y, x, cy, dy), zd, "zd:%d" % nid))
            best = None
            for kand in kands:
                opis, fn = kand[0], kand[1]
                klucz_p = kand[2] if len(kand) > 2 else None
                premia = PO.PREMIA_ROWNO if len(kand) > 3 and kand[3] else 0
                e2 = ed.kopia()
                try:
                    fn(e2)
                except PO.Niezgodne:
                    continue
                nowe, kn = PO.problemy(e2.raw, mid)
                ks = {(q["kod"], q["x"], q["y"]) for q in cur if not q.get("ukryj") and q["waga"] != "info"}
                knn = {(q["kod"], q["x"], q["y"]) for q in nowe if not q.get("ukryj") and q["waga"] != "info"}
                if knn - ks: continue
                if cel in {(q["kod"], q["x"], q["y"]) for q in nowe if not q.get("ukryj")}: continue
                oc = kn.oceny.get(klucz_p) if klucz_p else None
                if klucz_p and (not oc or not oc.get("blat") or oc["luz"] < (0 if oc.get("plaski") else 2)): continue
                score = (oc["luz"] if oc else 0) + premia
                if best is None or score > best[0]: best = (score, opis, e2)
            if best is None:
                pominiete.add((p["kod"], p["x"], p["y"], p["opis"][:40]))
                if verbose: print("    (zostaje) %s %s" % (p["kod"], p["opis"][:110]))
                continue
            ed = best[2]
            log.append("%s (%d,%d): %s" % (p["kod"], p["x"], p["y"], best[1]))
    if verbose:
        for l in log: print("    + " + l)
    return ed.raw


# ======================================================================================================== zapis, kontrola, podglądy
def build_one(mid, fit=True):
    mp = BUILDERS[mid]()
    data, events = mp.resolve(), mp.build_events()
    path = os.path.join(OUT, "Map%03d.json" % mid)
    write_map(path, dict(mp.props), data, events)
    j = json.loads(open(path, "rb").read().decode("utf-8"))
    if fit:
        j2 = dopasuj(mid, j)
        if j2 != j:
            evs = j2["events"]
            write_map(path, {k: v for k, v in j2.items() if k not in ("data", "events")}, j2["data"], evs)
            j = json.loads(open(path, "rb").read().decode("utf-8"))
    return mp, j, path


def kontrola(mid, j):
    sys.path.insert(0, os.path.join(ROOT, "tools", "mapy"))
    import kontrola as K
    ok, probs, txt = K.bramka(mid, j, quiet=True, scisle=True)
    r = K.kontroluj(mid, dane=OUT, out_dir=os.path.join(OUT, "kontrola"), quiet=True)
    return ok, probs, txt, r


def render(mid, path, out_png, grid=True):
    sys.path.insert(0, os.path.join(ROOT, "tools", "mapy"))
    import mapylib as L
    mp = L.Mapa(mid, path=path)
    img = L.render(mp, grid=grid)
    img.convert("RGB").save(out_png)
    return img


MIESZKANCY = {"szynkarz": "szynkarz", "opiekunka": "opiekunka przytułku", "garncarz": "garncarz", "dziecko": "dziecko biedoty"}


def imiona():
    """imiona nowych mieszkańców z js/plugins/TownLife_Data.js (tylko odczyt; nadaje je agent mieszkańców) do podpisów"""
    out = dict(MIESZKANCY)
    try:
        src = open(os.path.join(ROOT, "js", "plugins", "TownLife_Data.js"), "rb").read().decode("utf-8")
    except Exception:
        return out
    for k in MIESZKANCY:
        m = re.search(r'key:\s*"%s",\s*id:\s*\d+,\s*name:\s*"([^"]+)"' % k, src)
        if m: out[k] = "%s (%s)" % (m.group(1), MIESZKANCY[k])
    return out


def zestawienie(meta, out, tytul, cols=4):
    """docs/podgrodzie/wnetrza_nowe.png: wszystkie wnętrza obok siebie (render mapy bez siatki, pomniejszony), z podpisami"""
    sys.path.insert(0, os.path.join(ROOT, "tools", "mapy"))
    import mapylib as L
    from PIL import Image, ImageDraw
    S = 0.5
    IMIONA = imiona()
    tiles = []
    for k in sorted(meta, key=int):
        m = meta[k]
        mp = L.Mapa(int(k), path=os.path.join(OUT, m["plik"]))
        img = L.render(mp, grid=False).convert("RGB")
        img = img.resize((int(img.width * S), int(img.height * S)), Image.LANCZOS)
        d = ImageDraw.Draw(img)
        T = 48 * S
        wx, wy = m["wejscie"]["x"], m["wejscie"]["y"]
        d.rectangle([wx * T + 2, wy * T + 2, wx * T + T - 3, wy * T + T - 3], outline=(90, 230, 120), width=2)
        for sk, sp in m["miejsca"].items():
            x, y = sp["x"], sp["y"]
            d.ellipse([x * T + 5, y * T + 5, x * T + T - 6, y * T + T - 6], outline=(255, 220, 70), width=2)
        who = [IMIONA.get(sk.replace("_wnetrze", ""), sk) for sk in m["miejsca"]]
        tiles.append((m, img, who))
    pad, head = 14, 46
    colw = max(t[1].width for t in tiles) + pad
    rows = [tiles[i:i + cols] for i in range(0, len(tiles), cols)]
    rowh = [max(t[1].height for t in r) + head + pad for r in rows]
    W = cols * colw + pad
    H = sum(rowh) + 70
    sheet = Image.new("RGB", (W, H), (24, 22, 30))
    d = ImageDraw.Draw(sheet)
    d.text((pad, 12), tytul, fill=(255, 214, 90), font=L.font(22, True))
    d.text((pad, 42), "zielona ramka: kratka wejścia z Podgrodzia; żółte kółka: miejsca mieszkańców („Miejsce: …_wnetrze”)",
           fill=(200, 200, 210), font=L.font(14))
    y = 70
    for r, h in zip(rows, rowh):
        x = pad
        for (m, img, who) in r:
            d.text((x, y), "Map%d  %s" % (m["mapa"], m["nazwa"]), fill=(255, 235, 170), font=L.font(16, True))
            d.text((x, y + 21), "%dx%d · %s" % (m["rozmiar"][0], m["rozmiar"][1], ", ".join(who) if who else "bez mieszkańców TownLife"),
                   fill=(190, 190, 205), font=L.font(13))
            sheet.paste(img, (x, y + head))
            x += colw
        y += h
    os.makedirs(os.path.dirname(out), exist_ok=True)
    sheet.quantize(colors=256, method=Image.MEDIANCUT, dither=Image.NONE).save(out, optimize=True)
    print("zestawienie ->", os.path.relpath(out, ROOT), sheet.size)


def main(argv):
    if hasattr(sys.stdout, "reconfigure"): sys.stdout.reconfigure(encoding="utf-8")
    ids = [int(a) for a in argv if a.isdigit()] or sorted(BUILDERS)
    meta_path = os.path.join(OUT, "meta.json")
    meta = {}
    if os.path.exists(meta_path):
        meta = json.loads(open(meta_path, "rb").read().decode("utf-8")).get("mapy", {})
    bad = 0
    for mid in ids:
        mp, j, path = build_one(mid, fit="--bez-dopasowania" not in argv)
        rec = mp.meta_rec(j)
        line = "Map%03d %-22s %dx%d, %d zdarzeń" % (mid, mp.display, mp.W, mp.H, rec["zdarzen"])
        if "--bez-kontroli" not in argv:
            ok, probs, txt, r = kontrola(mid, j)
            bl = [p for p in probs if p["waga"] == "błąd" and not p.get("ukryj")]
            uw = [p for p in probs if p["waga"] == "uwaga" and not p.get("ukryj")]
            inf = [p for p in probs if p["waga"] == "info" and not p.get("ukryj")]
            rec["kontrola"] = {"bramka": ok, "bledy": len(bl), "uwagi": len(uw), "info": len(inf),
                               "lista": ["[%s] %s %s" % (p["waga"], p["kod"], p["opis"]) for p in probs if not p.get("ukryj")]}
            line += " | kontrola: %s, błędy %d, uwagi %d, info %d" % ("OK" if ok else "NIE", len(bl), len(uw), len(inf))
            for p in bl + uw + inf: print("   ", p["waga"], p["kod"], p["opis"])
            if not ok: bad += 1
        if "--bez-obrazkow" not in argv:
            render(mid, path, os.path.join(OUT, "Map%03d.png" % mid))
        meta[str(mid)] = rec
        print(line)
    with open(meta_path, "wb") as f:
        f.write((json.dumps({"opis": "Wnętrza nowego Podgrodzia (tools/podgrodzie2/wnetrza/build.py). Instaluje koordynator: "
                                     "MapNNN.json -> data/, MapInfos: nazwa = 'nazwa', rodzic = 111, nazwa wyświetlana już w mapie. "
                                     "'wejscie' = kratka, na którą mają przenosić drzwi budynku na Map111 (twarzą w górę, kierunek 8). "
                                     "'wyjscie'.'do' = kratka przed drzwiami z tools/podgrodzie2/budynki.json ('zastepcze': true = "
                                     "brak wpisu, (1,1) - po pojawieniu się pliku wystarczy uruchomić build.py ponownie). 'miejsca' = "
                                     "zdarzenia 'Miejsce: <nazwa>' dla TownLife (nowi mieszkańcy: szynkarz, opiekunka, garncarz, dziecko).",
                             "mapy": dict(sorted(meta.items()))}, ensure_ascii=False, indent=1) + "\n").encode("utf-8"))
    print("meta ->", os.path.relpath(meta_path, ROOT), "| mapy z problemami:", bad)
    if "--bez-obrazkow" not in argv:
        zestawienie(meta, os.path.join(ROOT, "docs", "podgrodzie", "wnetrza_nowe.png"),
                    "Nowe Podgrodzie - wnętrza budynków (mapy 201-212, kopia robocza tools/podgrodzie2/wnetrza)")


if __name__ == "__main__":
    main(sys.argv[1:])
