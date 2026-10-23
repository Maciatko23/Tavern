# python tools/miasto2/wnetrza/build.py [178 179 ...] [--bez-kontroli] [--bez-obrazkow]
# Wnętrza 13 nowych budynków nowego miasta (Map008 przebudowana 2026-10-22, docs/miasteczko/NOWE_MIASTO.md): mapy 178-190,
# oraz 6 domów w pierzejach (dom10-dom15, decyzja użytkownika): mapy 193-198 (191-192 zarezerwowane, Okolice MAPS.spare);
# wszystkie to dzieci mapy 8 „Okolice Tawerny”. Budowane od zera, kratka po kratce, tymi samymi narzędziami i w tym samym stylu co wnętrza
# miasta Map102-110 (tools/interiors/ilib.py -> tools/house/houselib.py -> tools/tavern/parter_props.py; makra dopracowania
# z tools/wnetrza/wlib.py i rooms.py): zestaw kafli 8 (Winlu Interior), ramka A2, ściany A3 trzy rzędy, meble przy ścianach,
# dywany na środku, rzeczy na blatach, każde światło to ogień, słońce tylko z okien za dnia.
#
# Zapisuje WYŁĄCZNIE do kopii roboczej tools/miasto2/wnetrza/:
#   MapNNN.json (format edytora), MapNNN.png (podgląd z siatką), meta.json (dla koordynatora: nazwy do MapInfos, rozmiary,
#   wejścia, wyjścia, miejsca mieszkańców), kontrola/ (obrazki kontroli map), docs/miasteczko/wnetrza_nowe.png (zestawienie
#   178-190) i wnetrza_nowe_2.png (zestawienie 193-198).
# Nic nie trafia do data/ ani js/ - instaluje koordynator (MapInfos: rodzic = mapa 8).
# Po zbudowaniu każda mapa przechodzi kontrolę map (tools/mapy/kontrola.py, bramka ścisła: zero błędów i zero uwag), a rzeczy na
# blatach są dopasowane jak w tools/mapy/popraw.py (dopasuj()). Kratki lądowania w mieście: tools/miasto2/budynki.json.
# Rekwizyty spoza zestawu 8: img/characters/!Miasto2_Wnetrza.png (tools/miasto2/wnetrza/props.py).
import os, sys, json, copy, re
_MY = os.path.dirname(os.path.abspath(__file__))
_ROOT = os.path.abspath(os.path.join(_MY, "..", "..", ".."))
sys.path.insert(0, os.path.join(_ROOT, "tools", "wnetrza"))
from wlib import *                      # noqa: F401,F403  Interior, makra domku/tawerny/wnętrz, światła L_*
import wlib                             # noqa: E402
import rooms as RM                      # noqa: E402  barrel, sacks, crate, wardrobe, dresser, shelf_tall, bookcase, rug_k, doormat
import parter_props as PP               # noqa: E402
import houselib as HL                   # noqa: E402

HERE, ROOT = _MY, _ROOT                 # (importy z gwiazdką przynoszą HERE / ROOT innych narzędzi)
OUT = HERE
TOWN = 8
TOWN_NAME = "Okolice Tawerny"
BUDYNKI = os.path.join(ROOT, "tools", "miasto2", "budynki.json")
MIDX = json.load(open(os.path.join(HERE, "props_index.json"), encoding="utf-8"))
OSADA = json.load(open(os.path.join(ROOT, "tools", "osada", "props_index.json"), encoding="utf-8"))

# rodzaje kafli (tools/tavern/catalog.json): A2 ramki i dywany, A3 ściany, A4 podłogi
B_WOOD, B_STONE = 24, 16
W_STONE_BEAM, W_PLASTER_BEAM, W_CREAM, W_PANEL, W_WALLPAPER, W_GREY, W_LOGS, W_BLUE, W_DARK = 50, 51, 52, 54, 56, 57, 59, 62, 63
W_PLANKS, W_BOARDS, W_STONE_BLOCK, W_RAW, W_GOTHIC = 48, 49, 66, 71, 76
F_HERRING, F_LIGHT, F_VERT, F_DARK, F_RED, F_COBBLE, F_FLAGS, F_TILES, F_ORNATE = 80, 81, 82, 83, 84, 96, 97, 100, 114
RUG_RED, RUG_MAT, RUG_RED_GOLD, RUG_BROWN, RUG_PURPLE, RUG_BLUE, RUG_ORANGE, RUG_GREEN, DUST = 36, 37, 38, 21, 22, 28, 29, 30, 23

NOTE = wlib.NOTE if hasattr(wlib, "NOTE") else "<Dust:off>\n<Dark:on>\n<DayNight:off>\n<Zoom:1.5>\n<DarkDay:60>\n<DarkNight:175>"
NOTE_DIM = "<Dust:off>\n<Dark:on>\n<DayNight:off>\n<Zoom:1.5>\n<DarkDay:95>\n<DarkNight:190>"
NOTE_CHAPEL = "<Dust:off>\n<Dark:on>\n<DayNight:off>\n<Zoom:1.5>\n<DarkDay:80>\n<DarkNight:185>"


# ======================================================================================================== miejsce przed drzwiami
def budynek(key):
    """wpis budynku z tools/miasto2/budynki.json (plik budowniczego mapy) albo None"""
    try:
        with open(BUDYNKI, "rb") as f:
            b = json.loads(f.read().decode("utf-8"))
    except Exception:
        return None
    items = b.get("budynki", b) if isinstance(b, dict) else b
    if isinstance(items, dict): return items.get(key)
    return next((r for r in items if isinstance(r, dict) and (r.get("klucz") == key or r.get("key") == key)), None)


def przed_drzwiami(key):
    """kratka przed drzwiami budynku na nowej Map008 z tools/miasto2/budynki.json (plik budowniczego mapy); gdy go jeszcze nie
    ma albo nie ma w nim budynku - (1, 1) i znacznik 'zastępcze' w meta.json"""
    try:
        with open(BUDYNKI, "rb") as f:
            b = json.loads(f.read().decode("utf-8"))
    except Exception:
        return [1, 1], False
    items = b.get("budynki", b) if isinstance(b, dict) else b
    rec = None
    if isinstance(items, dict):
        rec = items.get(key)
    elif isinstance(items, list):
        rec = next((r for r in items if isinstance(r, dict) and (r.get("klucz") == key or r.get("key") == key)), None)
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
    """wnętrze nowego miasta: Interior (powłoka i zapisy domku dziadka) + wyjście do miasta, miejsca mieszkańców, nasze rekwizyty"""

    def __init__(self, map_id, W, H, display, key, info, note=NOTE):
        Interior.__init__(self, map_id, W, H, display, key, note=note)
        self.props["bgm"] = {"name": "Town1", "pan": 0, "pitch": 100, "volume": 90}
        self.props["autoplayBgm"] = False
        self.info = info                      # nazwa do MapInfos, opis
        self.extra_spots = []                 # miejsca proponowane (mieszkańcy bez klucza w TownLife)
        self.town_xy, self.town_ok = przed_drzwiami(key)

    def drzwi8(self):
        """drzwi tego budynku na nowej Map008 (budynki.json): zdarzenie, które ma przenosić na kratkę wejścia tego wnętrza"""
        r = budynek(self.key)
        if not r: return None
        return {"id": r.get("drzwi_id"), "x": (r.get("drzwi") or [None, None])[0], "y": (r.get("drzwi") or [None, None])[1],
                "przed_drzwiami": r.get("przed_drzwiami"), "nazwa": r.get("nazwa"),
                "uwaga": "drzwi przenoszą teraz na (%s) - zastępczo; mają przenosić na kratkę 'wejscie' (twarzą w górę)" % (r.get("wnetrze_xy"),)}

    def wyjscie(self, x, name="Wyjście -> Okolice Tawerny"):
        """drzwi w dolnej ramce (x, H-1): dotyk gracza -> mapa 8 przed drzwiami budynku, twarzą w dół; wejście z miasta
        ląduje na (x, H-2) twarzą w górę"""
        return self.exit_to(x, None, tuple(self.town_xy), name)

    def miejsce(self, name, x, y, d, proponowane=False):
        """niewidoczne zdarzenie „Miejsce: <name>” (pod postacią, przenikalne, bez poleceń; kierunek strony = kierunek, w który
        patrzy mieszkaniec) - TownLife pokazuje tu mieszkańca, gdy jego plan mówi „w domu” (<klucz>_wnetrze) albo gdy jego
        dane mają takie miejsce w „indoor”; proponowane = mieszkańca jeszcze nie ma w TownLife (do decyzji agenta mieszkańców)"""
        page = blank_page(priority=0, through=True, image={"direction": d})
        e = {"name": "Miejsce: %s" % name, "note": "", "pages": [page]}
        self.add(x, y, e)
        self.residents.append({"key": name, "x": x, "y": y, "dir": d})
        self.spots["res_" + name] = [x, y, d]
        if proponowane: self.extra_spots.append(name)
        return e

    # ---- rekwizyty z !Miasto2_Wnetrza (props_index.json obok)
    def m(self, key, x, y, name=None, occupy=None, note="", priority=None, group=None):
        p = MIDX[key]
        floor = p["place"] == "floor"
        prio = priority if priority is not None else (1 if floor else 0)
        occ = occupy if occupy is not None else p.get("occupy")
        tags = ("<Occupy:%s>" % occ if occ else "") + note
        e = self.ev(x, y, p["sheet"], p["index"], p["direction"], p["pattern"], name=name or p["name"], priority=prio,
                    through=prio != 1, note=tags)
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

    # ---- rekwizyty osady Milczących (krosno, stojak z płótnem)
    def o(self, key, x, y, name=None, occupy=None):
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
        e = self.ev(x, y, char, idx, d, pat, name=name, priority=pr, through=not floor, step=step, note=note)
        return e

    def na_stole(self, x, y, sheet, c, r, dy=0, name=None):
        """mała rzecz z arkusza (D/E) leżąca na blacie: kafel warstwy 3 na kratce blatu, albo (dy != 0) zdarzenie z obrazkiem
        tego kafla przesunięte o piksele (<Px:0,dy>, TawernaCore) - gdy kafel nie mieści się w żadnej kratce stołu"""
        if not dy:
            mp_t = SHEET[sheet](c, r)
            self.tile(3, x, y, mp_t)
            return None
        tid = SHEET[sheet](c, r)
        e = {"name": name or ("Na stole: %s %d,%d" % (sheet, c, r)), "note": "<Px:0,%d>" % dy,
             "pages": [blank_page(priority=0, image={"tileId": tid}, through=True)]}
        self.add(x, y, e)
        return e

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
                "wejscie": {"x": lx, "y": ly, "kierunek": 8, "opis": "tu staje gracz wchodząc z miasta (twarzą w górę)"},
                "wyjscie": [{"id": e["id"], "x": e["x"], "y": e["y"], "nazwa": e["name"],
                             "do": {"mapa": TOWN, "x": self.town_xy[0], "y": self.town_xy[1], "kierunek": 2},
                             "zastepcze": not self.town_ok} for e in exits],
                "drzwi_na_mapie_8": self.drzwi8(),
                "miejsca": spots,
                "zdarzen": len([e for e in evs if e])}


SHEET = {"B": B, "C": C, "D": D, "E": E, "A5": A5}


# ---- drobne makra tych wnętrz
def okno(mp, x, styl="night", firanka=1, dl=110):
    """okno dwurzędowe na ścianie (rzędy 1-2) ze słońcem za dnia (zdarzenie na dolnej kratce okna); styl 'small' - małe
    okienko B(1,0)+B(1,1) (oba kafle), 'stone' - okienko w kamiennej ramie B(3,6)"""
    if styl == "small":
        mp.tiles("B", 1, 0, 1, 2, x, 1)
        mp.light(x, 2, wlib.cone(dl), "okno (słońce)")
        mp.wall_items.append(("okna", "window", x, 1))
        return
    window2(mp, x, 1, curtain=firanka, style=styl, length=dl)


def okno_gotyckie(mp, x, dl=150, lit=False):
    """gotyckie okno kaplicy B(0,4)-(0,5) (noc: ciemne szybki), słońce za dnia"""
    mp.tiles("B", 1 if lit else 0, 4, 1, 2, x, 1)
    mp.light(x, 2, wlib.cone(dl), "okno (słońce)")
    mp.wall_items.append(("okna", "window", x, 1))


def witraz(mp, key, x, dl=150):
    """witraż z arkusza katedry Winlu (zdarzenie na ścianie, dolna kratka okna) + słońce za dnia"""
    mp.m(key, x, 2)
    mp.light(x, 2, wlib.cone(dl), "okno (słońce)")


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


# ======================================================================================================== 178 Kaplica
def kaplica():
    """kaplica na północnym zachodzie miasta (kamienna, gotycka - twierdza_front + brama katedralna): nawa z ławami po obu
    stronach przejścia z czerwonym chodnikiem, prezbiterium z ołtarzem pod krucyfiksem, świeczniki, ikony, witraże; mała
    zakrystia z prawej (szafa z szatami, skrzynia, pulpit z księgą, umywalka). Opiekuje się nią grabarz Hieronim."""
    W, H = 20, 15
    mp = Wnetrze(178, W, H, "Kaplica", "kaplica", {"nazwa": "Kaplica", "opis": "nawa z ławami, ołtarz, zakrystia; opiekun: grabarz Hieronim"},
                 note=NOTE_CHAPEL)
    AX = 7
    rooms = [("Nawa", [(1, 4, 13, 13)], F_TILES, W_GOTHIC),
             ("Zakrystia", [(15, 4, 18, 9)], F_DARK, W_PANEL)]
    mp.shell(rooms, openings=[("Zakrystia", (14, 7, 14, 7))], border=B_STONE, exit_x=AX, exit_room="Nawa")
    mp.kind(0, mp.rect(2, 4, 12, 5), F_ORNATE)                 # prezbiterium
    mp.shadows()
    # ---- ściana ołtarzowa: witraż | ikona | (świecznik) krucyfiks (świecznik) | ikona | witraż
    witraz(mp, "witraz_3", 3); witraz(mp, "witraz_3", 11)
    mp.m("krucyfiks", AX, 2)
    mp.m("ikona", 5, 2); mp.m("ikona", 9, 2)
    sconce_wall(mp, 1, 2); sconce_wall(mp, 13, 2)
    # ---- ołtarz przy ścianie, krzyż i świece na nim, kandelabry po bokach, pulpit z księgą
    mp.m("oltarz", AX, 4)
    mp.m("krzyz_oltarz", AX, 4, note="<Px:0,-26>")
    mp.ev(AX - 1, 4, "!Decoration2", 1, 6, 0, name="Świece na ołtarzu", priority=0, through=True, step=True,
          note=L_CANDLES3 + "<Px:0,-24>")
    mp.ev(AX + 1, 4, "!Decoration2", 1, 6, 0, name="Świece na ołtarzu", priority=0, through=True, step=True,
          note=L_CANDLES3 + "<Px:0,-24>")
    PP.candelabra(mp, AX - 3, 4); PP.candelabra(mp, AX + 3, 4)
    mp.pic(AX + 4, 5, "!Decoration_static", 6, 2, 2, "Pulpit z księgą", floor=True)
    RM.rug_k(mp, AX - 2, 5, AX + 2, 5, RUG_RED_GOLD)
    # ---- nawa: ławy po obu stronach, chodnik do ołtarza
    for y in (7, 9, 11):
        for x in (2, 4, 9, 11):
            bench_h(mp, x, y)
    RM.rug_k(mp, AX, 6, AX, 12, RUG_RED)
    RM.doormat(mp, AX, 13)
    # skarbonka i świece wotywne przy wejściu, beczka z wodą święconą
    stolik(mp, 1, 12)
    mp.ev(1, 12, "!Decoration2", 1, 6, 1, name="Świece wotywne", priority=0, through=True, step=True, note=L_CANDLES3)
    RM.plant_pot(mp, 13, 13, "green")
    RM.plant_pot(mp, 1, 6, "green"); RM.plant_pot(mp, 13, 6, "green")
    # ---- zakrystia
    okno(mp, 17, firanka=4, dl=100)
    RM.wardrobe(mp, 15, 4)
    RM.chest(mp, 18, 4, idx=0, name="Skrzynia z szatami")
    HL.washstand(mp, 16, 4)
    stolik(mp, 18, 7)
    mp.prop("ksiega_rachunkowa", 18, 8, name="Księga parafialna")
    sconce_wall(mp, 18, 2)
    RM.shelf_tall(mp, 15, 9, "books")
    RM.rug_k(mp, 16, 6, 17, 8, RUG_PURPLE)
    lantern(mp, 16, 1, style=1, light=L_LANTERN_SMALL)
    # ---- opiekun
    mp.miejsce("grabarz_kaplica", 12, 6, 4, proponowane=True)
    mp.wyjscie(AX)
    return mp


# ======================================================================================================== 179 Dom grabarza
def dom_grabarza():
    """biedna chata Hieronima z bali pod strzechą: palenisko z kociołkiem w kamiennej ścianie, prycza i skrzynia, łopaty
    i kilof w kącie, deski na trumny, latarnia, stół z miską i świecą, wiadro"""
    W, H = 11, 10
    mp = Wnetrze(179, W, H, "Dom grabarza", "dom_grabarza", {"nazwa": "Dom grabarza", "opis": "chata Hieronima"}, note=NOTE_DIM)
    X = 5
    mp.shell([("Izba", [(1, 4, 9, 8)], F_DARK, W_LOGS)], border=B_WOOD, exit_x=X)
    mp.restyle_face(mp.rect(4, 1, 6, 3), W_RAW)
    mp.kind(0, mp.rect(4, 4, 6, 5), F_FLAGS)
    mp.shadows()
    hearth_cauldron(mp, X, 4)
    okno(mp, 2, firanka=6, dl=90)
    okno(mp, 8, styl="small", firanka=None, dl=80)
    # narzędzia grabarza w lewym kącie
    mp.m("lopaty", 1, 4)
    mp.pic(2, 4, "!Mt_Props", 4, 2, 2, "Kilof", floor=True)
    mp.m("deski_oparte", 3, 4, name="Deski na trumny")
    # prycza, skrzynia, latarnia
    bed(mp, (9, 13), 9, 4, kind="prycza")
    RM.chest(mp, 9, 6)
    lantern(mp, 7, 1, style=1)
    # stół z miską i świecą, stołek
    stolik(mp, 2, 7)
    blat(mp, 2, 7, "D", 0, 14)
    stool_candle(mp, 3, 8)
    mp.t("D", 10, 4, 9, 8); mp.solid.add((9, 8))               # wiadro
    RM.barrel(mp, 8, 8, "plain")
    RM.sacks(mp, 1, 8, wide=False)
    mp.t("D", 7, 6, 7, 3); mp.t("D", 7, 7, 7, 4); mp.solid.add((7, 4))   # miotła pod ścianą
    RM.rug_k(mp, 4, 6, 6, 6, RUG_BROWN)
    pajeczyna(mp, 1, 1, 0); pajeczyna(mp, 9, 1, 1)
    mp.miejsce("grabarz_wnetrze", 6, 7, 8)
    mp.wyjscie(X)
    return mp


# ======================================================================================================== 180 Strażnica Lorda
def straznica():
    """kamienna strażnica przy bramie wschodniej: izba straży (kominek w kamiennej ścianie między dwiema czerwonymi
    chorągwiami Lorda z koniem, stojaki z bronią w rogach, stół z kartami i kośćmi, zbroja, okuta skrzynia) i sala sypialna
    (trzy prycze ze skrzyniami, kołki z płaszczami, stojak z bronią, stolik ze świecą). Kapral Wit Czerwień."""
    W, H = 19, 12
    mp = Wnetrze(180, W, H, "Strażnica Lorda", "straznica", {"nazwa": "Strażnica Lorda", "opis": "izba straży i sala sypialna; kapral Wit Czerwień"})
    X = 6
    rooms = [("Izba straży", [(1, 4, 11, 10)], F_FLAGS, W_STONE_BEAM),
             ("Sala sypialna", [(13, 4, 17, 10)], F_COBBLE, W_RAW)]
    mp.shell(rooms, openings=[("Sala sypialna", (12, 8, 12, 8))], border=B_STONE, exit_x=X, exit_room="Izba straży")
    mp.restyle_face(mp.rect(5, 1, 7, 3), W_RAW)
    mp.shadows()
    g = "Izba straży"
    # ---- ściana: stojak | okno | chorągiew | drewno KOMINEK drewno | chorągiew | okno | stojak
    fireplace_pic(mp, X, 4, kind=2)
    PP.firewood(mp, 5, 4); PP.firewood(mp, 7, 4)
    banner(mp, 4, 2, 0, 0); banner(mp, 8, 2, 0, 0)            # chorągwie Lorda: czerwone z czarnym koniem
    okno(mp, 3, styl="stone", firanka=None, dl=90); okno(mp, 9, styl="stone", firanka=None, dl=90)
    mp.tiles("E", 8, 10, 2, 2, 1, 3); mp.solid |= {(1, 4), (2, 4)}
    mp.tiles("E", 10, 10, 2, 2, 10, 3); mp.solid |= {(10, 4), (11, 4)}
    torch_wall(mp, 1, 2); torch_wall(mp, 11, 2)
    RM.rug_k(mp, 5, 5, 7, 6, RUG_RED)
    # ---- stół straży: karty, kości, kufle, chleb; krzesła i stołki
    table_h(mp, 2, 7, 3, style=6)
    chair(mp, 2, 6, 2); chair(mp, 4, 6, 2)
    stool(mp, 1, 8); stool(mp, 5, 8)
    blat(mp, 2, 7, "D", 3, 13)
    mp.prop("karty", 3, 8)
    candle_on(mp, 4, 8)
    # ---- zbroja, skrzynia, beczka
    statue(mp, 11, 6, pattern=2)
    thing(mp, 1, 10, "!Fantasy_chest", 0, 2, 0, "Okuta skrzynia straży", kind="skrzynia okuta")
    RM.barrel(mp, 11, 10, "plain")
    RM.doormat(mp, X, 10)
    mp.miejsce("kapral_wnetrze", 5, 7, 4)
    # ---- sala sypialna
    for x in (13, 15, 17):
        bed(mp, (9, 13), x, 4, kind="prycza")
        RM.chest(mp, x, 6)
    mp.hprop("kolki_ubrania", 14, 3, name="Kołki z płaszczami")
    mp.hprop("kolki_ubrania", 16, 3, name="Kołki z płaszczami")
    okno(mp, 16, styl="stone", firanka=None, dl=80)
    mp.tiles("E", 14, 12, 1, 2, 17, 8); mp.solid.add((17, 9))
    stolik(mp, 15, 9)
    candle_on(mp, 15, 9)
    stool(mp, 14, 10)
    RM.barrel(mp, 13, 10, "water")
    wall_lantern(mp, 13, 1, style=1)
    mp.miejsce("straz_1_wnetrze", 14, 7, 2, proponowane=True)
    mp.miejsce("straz_2_wnetrze", 16, 7, 2, proponowane=True)
    mp.wyjscie(X)
    return mp


# ======================================================================================================== 181 Stajnia z wozownią
def stajnia():
    """drewniana stajnia z wozownią: trzy boksy z końmi (gniady, siwy, kary) przedzielone deskami, chomąta i lina nad nimi,
    wiadra, słoma; wozownia - kryty wóz, wózek z sianem, stóg siana, koło, worki z owsem; kąt woźnicy Szczepana (prycza,
    skrzynia, stolik ze świecą, siodło na stojaku). Szeroka brama (dwie kratki)."""
    W, H = 24, 13
    mp = Wnetrze(181, W, H, "Stajnia z wozownią", "stajnia", {"nazwa": "Stajnia z wozownią", "opis": "boksy z końmi, wozownia, kąt woźnicy Szczepana"},
                 note=NOTE_DIM)
    GX = (11, 12)
    mp.shell([("Stajnia", [(1, 4, 22, 11)], F_COBBLE, W_BOARDS)], openings=[("Stajnia", (GX[0], H - 1, GX[1], H - 1))], border=B_WOOD)
    mp.kind(0, mp.rect(19, 4, 22, 7), F_DARK)                # podłoga z desek w kącie woźnicy
    mp.shadows()
    # ---- boksy: koń (2 kratki) | wiadro / worek | przegroda
    konie = ["kon_gniady", "kon_siwy", "kon_kary"]
    extras = [("t", "wiadro_woda"), ("s", None), ("t", "cebrzyk_woda")]
    for k in range(3):
        x0 = 1 + 4 * k
        mp.m(konie[k], x0, 5, occupy="right=1,up=1")
        kind, key = extras[k]
        if kind == "t": mp.tprop(key, x0 + 2, 4)
        else: RM.sacks(mp, x0 + 2, 4, wide=False)
        mp.m("sloma", x0 + 2, 5)
        mp.m("przegroda", x0 + 3, 5)
        mp.m("sloma", x0 + 1, 6)
    mp.m("chomato", 3, 2); mp.m("chomato", 7, 2); mp.m("lina", 11, 2)
    okno(mp, 1, styl="shutters", firanka=None, dl=100)
    lantern(mp, 5, 1, style=1); lantern(mp, 9, 1, style=1)
    mp.m("koryto", 1, 10)
    mp.m("sloma", 4, 9); mp.m("rozsypane_wiory", 8, 10)
    # ---- wozownia
    mp.ev(15, 6, "!$Lud_Woz", 0, 2, 0, name="Kryty wóz", priority=1, through=False, note="<Occupy:left=1,right=1,up=1>")
    mp.solid |= mp.rect(14, 5, 16, 6)
    mp.m("kolo_wozu", 18, 4)
    mp.tprop("taczka", 13, 8)
    mp.tprop("woz_beczki", 5, 9)
    mp.m("stog_siana", 14, 10, occupy="left=1,right=1,up=1")
    mp.tprop("woz_siano", 18, 10)
    RM.sacks(mp, 21, 11)
    RM.barrel(mp, 17, 8, "plain")
    okno(mp, 20, styl="shutters", firanka=None, dl=100)
    lantern(mp, 17, 1, style=1)
    mp.m("chomato", 14, 2); mp.m("lina", 15, 2)
    # ---- kąt woźnicy
    mp.m("siodlo", 19, 4)
    stolik(mp, 20, 4)
    candle_on(mp, 20, 4)
    bed(mp, (9, 13), 22, 4, kind="prycza woźnicy")
    RM.chest(mp, 22, 6)
    stool(mp, 19, 5)
    RM.rug_k(mp, 19, 6, 21, 7, RUG_BROWN)
    mp.miejsce("kolodziej_wnetrze", 20, 6, 6)      # (klucz woźnicy Szczepana w TownLife: "kolodziej"; "woznica" to Wojciech)
    for x in GX:
        mp.wyjscie(x, name="Wyjście -> Okolice Tawerny (brama stajni)")
    return mp


# ======================================================================================================== 182 Dom przekupki
def dom_przekupki():
    """Dom 1 - Agata, przekupka z koszem: jedna izba; przy wejściu jej towar (beczka jabłek, kosze, skrzynki z warzywami),
    piec z okapem pośrodku, kosze na półce, stół z misą owoców i koszykiem chleba, łóżko z kołdrą z łatek"""
    W, H = 13, 10
    mp = Wnetrze(182, W, H, "Dom przekupki", "dom1", {"nazwa": "Dom 1 (przekupka Agata)", "opis": "izba przekupki Agaty"})
    X = 6
    mp.shell([("Izba", [(1, 4, 11, 8)], F_RED, W_PLASTER_BEAM)], border=B_WOOD, exit_x=X)
    mp.shadows()
    okno(mp, 3, firanka=1, dl=110); okno(mp, 9, firanka=1, dl=110)
    sill_pot(mp, 3, 1, 1)
    PP.kitchen_stove(mp, X, 4)
    shelf_wall(mp, 5, 2, "baskets"); shelf_wall(mp, 7, 2, "jug")
    hang_pole(mp, 4, 2, "garlic")
    # ---- towar przekupki (lewy kąt)
    RM.barrel(mp, 1, 4, "apples")
    mp.tiles("D", 14, 3, 1, 2, 2, 3); mp.solid.add((2, 4))           # kosz przykryty płótnem
    RM.crate(mp, 1, 6, "jug")
    RM.barrel(mp, 1, 8, "plain")
    # ---- łóżko (prawy kąt)
    bed(mp, (15, 10), 11, 4, kind="łóżko Agaty")
    nightstand_candle(mp, 10, 4)
    RM.chest(mp, 11, 6)
    # ---- stół
    table_sq(mp, 3, 6, style=6)
    blat(mp, 3, 6, "D", 0, 10)
    candle_on(mp, 4, 7)
    stool(mp, 5, 7); stool(mp, 3, 8)
    RM.sacks(mp, 9, 8)
    mp.t("D", 7, 6, 8, 3); mp.t("D", 7, 7, 8, 4); mp.solid.add((8, 4))   # miotła
    RM.rug_k(mp, 5, 5, 7, 6, RUG_ORANGE)
    RM.doormat(mp, X, 8)
    mp.miejsce("przekupka_wnetrze", 4, 8, 8)
    mp.wyjscie(X)
    return mp


# ======================================================================================================== 183 Kamienica mieszczan
def kamienica():
    """Dom 2 - zamożniejsza kamienica szachulcowa: izba z kominkiem, dwoma fotelami przed ogniem, zegarem, biblioteczką,
    stołem jadalnym z krzesłami i ławą pod ścianą; kuchnia na płytach (piec, kredens z naczyniami, stół do krojenia, beczka, worki); sypialnia z dużym łożem,
    szafą i skrzynią. Mieszczanie są w pracy - nikogo z TownLife."""
    W, H = 20, 12
    mp = Wnetrze(183, W, H, "Kamienica mieszczan", "dom2", {"nazwa": "Dom 2 (kamienica mieszczan)", "opis": "kamienica: izba, kuchnia, sypialnia"})
    X = 10
    rooms = [("Izba", [(7, 4, 13, 10)], F_HERRING, W_WALLPAPER),
             ("Kuchnia", [(1, 4, 5, 10)], F_FLAGS, W_PLASTER_BEAM),
             ("Sypialnia", [(15, 4, 18, 10)], F_LIGHT, W_BLUE)]
    mp.shell(rooms, openings=[("Izba", (6, 6, 6, 6)), ("Izba", (14, 8, 14, 8))], border=B_WOOD, exit_x=X, exit_room="Izba")
    mp.restyle_face(mp.rect(9, 1, 11, 3), W_RAW)
    mp.shadows()
    # ---- izba: biblioteczka | okno | drewno KOMINEK drewno | okno | zegar
    fireplace_pic(mp, X, 4, kind=1)
    PP.firewood(mp, 9, 4); PP.firewood(mp, 11, 4)
    RM.bookcase(mp, 7, 4)
    okno(mp, 8, firanka=0, dl=120); okno(mp, 12, firanka=0, dl=120)
    clock(mp, 13, 4)
    RM.rug_k(mp, 9, 5, 11, 7, RUG_RED_GOLD)
    chair(mp, 9, 6, 8, arm=True); chair(mp, 11, 6, 8, arm=True)      # fotele przed kominkiem
    table_h(mp, 7, 8, 2, style=6)
    chair(mp, 7, 7, 2); chair(mp, 8, 7, 2); chair(mp, 7, 10, 8)
    blat(mp, 7, 8, "D", 0, 11)
    candle_on(mp, 8, 9)
    bench_v(mp, 13, 5, 2)
    RM.plant_pot(mp, 13, 10, "green")
    RM.doormat(mp, X, 10)
    # ---- kuchnia
    PP.kitchen_stove(mp, 3, 4)
    RM.dresser(mp, 1, 4, "dishes")
    PP.firewood(mp, 4, 4)
    mp.tiles("C", 5, 9, 1, 2, 5, 3); mp.solid.add((5, 4))            # szafka z kubkami
    okno(mp, 2, firanka=1, dl=100)
    hang_pole(mp, 4, 2, "hams")
    table_h(mp, 2, 7, 2, style=6)
    blat(mp, 2, 7, "D", 0, 8); blat(mp, 3, 7, "D", 5, 10)
    stool(mp, 1, 8); stool(mp, 4, 8)
    RM.barrel(mp, 1, 10, "water")
    RM.sacks(mp, 4, 10)
    # ---- sypialnia
    bed(mp, (11, 13), 15, 4, w=2, kind="łoże małżeńskie")
    nightstand_candle(mp, 17, 4)
    RM.wardrobe(mp, 18, 4)
    okno(mp, 17, firanka=3, dl=100)
    RM.chest(mp, 15, 6, idx=6)
    RM.rug_k(mp, 15, 7, 17, 9, RUG_PURPLE)
    chair(mp, 18, 8, 4, arm=True)
    RM.plant_pot(mp, 18, 10, "green")
    mp.wyjscie(X)
    return mp


# ======================================================================================================== 184 Dom szwaczki
def dom_szwaczki():
    """Dom 3 - Dorota Igła, szwaczka: pracownia (krosno, kołowrotek, szafa sklepowa z zasłonkami, beczka sukna, stół do
    krojenia z nicią, wykrojem i nożem, lada z belami sukna, stojak z płótnem) i izdebka (łóżko, szafa, lustro, umywalka)"""
    W, H = 17, 11
    mp = Wnetrze(184, W, H, "Dom szwaczki", "dom3", {"nazwa": "Dom 3 (szwaczka Dorota)", "opis": "pracownia szwaczki i izdebka"})
    X = 5
    rooms = [("Pracownia", [(1, 4, 9, 9)], F_LIGHT, W_CREAM),
             ("Izdebka", [(11, 4, 15, 9)], F_RED, W_WALLPAPER)]
    mp.shell(rooms, openings=[("Izdebka", (10, 7, 10, 7))], border=B_WOOD, exit_x=X, exit_room="Pracownia")
    mp.shadows()
    # ---- pracownia
    okno(mp, 2, firanka=2, dl=110); okno(mp, 8, firanka=2, dl=110)
    mp.o("krosno", 1, 4)
    mp.tiles("E", 3, 13, 3, 3, 4, 2); mp.solid |= {(4, 4), (5, 4), (6, 4)}      # szafa z zasłonkami i szufladami
    RM.barrel(mp, 7, 4, "cloth")
    mp.hprop("kolowrotek", 8, 4, name="Kołowrotek")
    mp.hprop("kolki_ubrania", 3, 3, name="Kołki z ubraniami do poprawki")
    table_h(mp, 2, 6, 3, style=6)                                   # stół do krojenia
    blat(mp, 2, 6, "D", 2, 10); blat(mp, 3, 6, "D", 6, 13)
    candle_on(mp, 4, 7)
    chair(mp, 1, 7, 6)
    counter_h(mp, 7, 9, 8, cloth=2)                                 # lada z belami sukna
    mp.o("stojak_pasy", 7, 6, name="Stojak z płótnem")
    mp.tiles("D", 14, 3, 1, 2, 1, 8); mp.solid.add((1, 9))          # kosz z gałgankami
    RM.doormat(mp, X, 9)
    mp.miejsce("szwaczka_wnetrze", 3, 8, 8)
    # ---- izdebka
    okno(mp, 13, firanka=2, dl=100)
    bed(mp, (12, 10), 15, 4, kind="łóżko Doroty")
    nightstand_candle(mp, 14, 4)
    RM.wardrobe(mp, 11, 4)
    HL.washstand(mp, 12, 4)
    mp.tiles("D", 1, 4, 1, 2, 12, 2, z=3)                         # lustro
    RM.chest(mp, 15, 6)
    RM.rug_k(mp, 12, 6, 14, 8, RUG_ORANGE)
    RM.plant_pot(mp, 15, 9, "green")
    chair(mp, 11, 9, 6)
    mp.wyjscie(X)
    return mp


# ======================================================================================================== 185 Dom wdowy
def dom_wdowy():
    """Dom 4 - Halina, wdowa z Kostkiem i Jagódką: izba z paleniskiem i kociołkiem, stół dla trojga z ławą, łóżko matki,
    balia do prania i maselnica; izba dzieci - dwa łóżeczka, skrzynia z zabawkami, stoliczek, miś i kotek na podłodze"""
    W, H = 17, 11
    mp = Wnetrze(185, W, H, "Dom wdowy", "dom4", {"nazwa": "Dom 4 (wdowa Halina z dziećmi)", "opis": "izba Haliny i izba dzieci"})
    X = 5
    rooms = [("Izba", [(1, 4, 10, 9)], F_RED, W_PLASTER_BEAM),
             ("Izba dzieci", [(12, 4, 15, 9)], F_LIGHT, W_CREAM)]
    mp.shell(rooms, openings=[("Izba dzieci", (11, 8, 11, 8))], border=B_WOOD, exit_x=X, exit_room="Izba")
    mp.restyle_face(mp.rect(4, 1, 6, 3), W_RAW)
    mp.kind(0, mp.rect(4, 4, 6, 4), F_FLAGS)
    mp.shadows()
    hearth_cauldron(mp, X, 4)
    okno(mp, 2, firanka=1, dl=110); okno(mp, 8, firanka=1, dl=110)
    hang_pole(mp, 3, 2, "garlic"); hang_pole(mp, 7, 2, "herbs")
    mp.tiles("C", 5, 9, 1, 2, 1, 3); mp.solid.add((1, 4))            # szafka z kubkami
    bed(mp, (15, 13), 10, 4, kind="łóżko Haliny")
    nightstand_candle(mp, 9, 4)
    table_h(mp, 2, 7, 3, style=6)
    bench_h(mp, 2, 6); stool(mp, 4, 6)
    blat(mp, 2, 7, "D", 0, 14); blat(mp, 4, 7, "D", 1, 14)
    candle_on(mp, 3, 8)
    mp.tprop("balia_tarka", 8, 9)
    mp.tprop("cebrzyk_woda", 9, 9)
    mp.hprop("maselnica", 1, 9, name="Maselnica")
    RM.rug_k(mp, 4, 5, 6, 6, RUG_MAT)
    RM.doormat(mp, X, 9)
    mp.miejsce("wdowa_wnetrze", 6, 6, 8)
    # ---- izba dzieci
    okno(mp, 13, firanka=5, dl=100)
    sconce_wall(mp, 15, 2)                                          # świeca na ścianie (dzieci boją się ciemności)
    bed(mp, (15, 10), 12, 4, kind="łóżeczko Kostka")
    bed(mp, (12, 10), 14, 4, kind="łóżeczko Jagódki")
    RM.chest(mp, 13, 4, name="Skrzynia z zabawkami")
    RM.rug_k(mp, 12, 6, 15, 9, RUG_GREEN)
    mp.tiles("C", 4, 0, 1, 2, 13, 7); mp.solid |= {(13, 7), (13, 8)}     # stoliczek
    blat(mp, 13, 7, "D", 8, 10)                                    # miś na stoliczku
    mp.t("D", 8, 11, 12, 9, z=3)                                   # kotek z gałganków
    mp.miejsce("kostek_wnetrze", 12, 7, 6)
    mp.miejsce("jagodka_wnetrze", 14, 7, 4)
    mp.wyjscie(X)
    return mp


# ======================================================================================================== 186 Stary dom kupca
def dom_kupca():
    """Dom 5 - stary dom kupca z bali (z przybudówką): wyblakła zamożność - kominek, portret starego kupca, mapa krainy,
    biblioteczka, pulpit do pisania, okuta skrzynia, stół z księgą, globusem i wagą, fotel; kurz i pajęczyny. W przybudówce
    komora służącej: piec, posłanie, stolik, miotła, wiadro."""
    W, H = 16, 11
    mp = Wnetrze(186, W, H, "Stary dom kupca", "dom5", {"nazwa": "Dom 5 (stary dom kupca)", "opis": "izba kupca i komora służącej"})
    X = 5
    rooms = [("Izba kupca", [(1, 4, 9, 9)], F_DARK, W_LOGS),
             ("Komora służącej", [(11, 4, 14, 9)], F_FLAGS, W_PLANKS)]
    mp.shell(rooms, openings=[("Komora służącej", (10, 7, 10, 7))], border=B_WOOD, exit_x=X, exit_room="Izba kupca")
    mp.restyle_face(mp.rect(4, 1, 6, 3), W_RAW)
    mp.shadows()
    fireplace_pic(mp, X, 4, kind=2)
    PP.firewood(mp, 6, 4)
    RM.bookcase(mp, 1, 4)
    okno(mp, 2, firanka=0, dl=100); okno(mp, 8, firanka=0, dl=100)
    mp.pic(3, 2, "!Decoration_static", 7, 8, 1, "Portret starego kupca")
    mp.prop("mapa", 7, 2, name="Stara mapa szlaków kupieckich")
    mp.tiles("C", 3, 2, 1, 2, 9, 3); mp.solid.add((9, 4))          # pulpit do pisania
    thing(mp, 9, 6, "!Fantasy_chest", 0, 2, 0, "Okuta skrzynia kupca", kind="skrzynia okuta")
    table_h(mp, 2, 7, 3, style=6)
    blat(mp, 2, 7, "D", 5, 12); blat(mp, 4, 7, "D", 4, 14)
    candle_on(mp, 3, 8)
    chair(mp, 5, 8, 4, arm=True)
    RM.rug_k(mp, 4, 5, 6, 6, RUG_PURPLE)
    kurz(mp, mp.rect(7, 8, 9, 9)); kurz(mp, mp.rect(1, 9, 2, 9))
    mp.tiles("D", 13, 5, 1, 2, 9, 8); mp.solid.add((9, 9))          # stara połamana skrzynka
    pajeczyna(mp, 1, 1, 0); pajeczyna(mp, 9, 1, 1)
    RM.doormat(mp, X, 9)
    # ---- komora służącej
    PP.kitchen_stove(mp, 12, 4)
    okno(mp, 13, styl="small", firanka=None, dl=80)
    bed(mp, (9, 13), 14, 4, kind="posłanie służącej")
    stolik(mp, 13, 7)
    blat(mp, 13, 7, "D", 5, 10)
    stool(mp, 12, 8)
    mp.t("D", 7, 6, 11, 3); mp.t("D", 7, 7, 11, 4); mp.solid.add((11, 4))   # miotła
    mp.tprop("wiadro_woda", 14, 9)
    mp.miejsce("sluzaca_wnetrze", 12, 6, 8, proponowane=True)
    mp.wyjscie(X)
    return mp


# ======================================================================================================== 187 Dom cieśli
def dom_ciesli():
    """Dom 6 - Leon Dłuto, cieśla: warsztat (stos drewna i desek, deski pod ścianą, stojak z siekierami, drabina, pniak
    z siekierą, kozioł z deską i piłą, ława z narzędziami, kłoda, wióry) i izba (łóżko, piec, stół z krzesłami, skrzynia)"""
    W, H = 17, 11
    mp = Wnetrze(187, W, H, "Dom cieśli", "dom6", {"nazwa": "Dom 6 (cieśla Leon)", "opis": "warsztat ciesielski i izba"})
    X = 5
    rooms = [("Warsztat", [(1, 4, 9, 9)], F_DARK, W_BOARDS),
             ("Izba", [(11, 4, 15, 9)], F_RED, W_LOGS)]
    mp.shell(rooms, openings=[("Izba", (10, 8, 10, 8))], border=B_WOOD, exit_x=X, exit_room="Warsztat")
    mp.shadows()
    # ---- warsztat
    mp.m("stos_drewna", 2, 4)
    mp.m("deski_oparte", 4, 4); mp.m("deska", 5, 4)
    mp.tiles("E", 13, 12, 1, 2, 6, 3); mp.solid.add((6, 4))          # stojak z siekierami
    okno(mp, 7, styl="shutters", firanka=None, dl=110)
    mp.tprop("drabina", 8, 4)
    mp.m("pniak_siekiera", 9, 4)
    mp.m("koziol", 2, 7)
    table_h(mp, 6, 7, 3, style=6)
    blat(mp, 6, 7, "D", 1, 9); blat(mp, 8, 7, "D", 10, 5)
    candle_on(mp, 7, 8)
    mp.m("kloda", 1, 9)
    mp.m("rozsypane_wiory", 3, 8)
    mp.m("rozsypane_wiory", 4, 6)
    lantern(mp, 3, 1, style=1)
    mp.miejsce("ciesla_wnetrze", 4, 7, 4)
    # ---- izba
    PP.kitchen_stove(mp, 12, 4)
    PP.firewood(mp, 11, 4)
    okno(mp, 14, firanka=1, dl=100)
    bed(mp, (12, 10), 15, 4, kind="łóżko Leona")
    mp.hprop("kolki_ubrania", 13, 3)
    table_sq(mp, 12, 7, style=4)
    chair(mp, 12, 6, 2); chair(mp, 14, 8, 4)
    blat(mp, 12, 7, "D", 0, 11); blat(mp, 13, 7, "D", 1, 15)
    RM.chest(mp, 15, 6)
    RM.barrel(mp, 15, 9, "water")
    mp.wyjscie(X)
    return mp


# ======================================================================================================== 188 Dom staruszków
def dom_staruszkow():
    """Dom 7 - para staruszków, którzy nie wychodzą z domu: ciepła izba - palenisko z kociołkiem, śpiący kot na chodniku,
    bujany fotel przy ogniu, kołowrotek, duże łoże z szafką i świecą, kredens z miskami, stolik z dzbankiem i kubkami,
    zegar, obraz, kwiaty na parapetach"""
    W, H = 13, 10
    mp = Wnetrze(188, W, H, "Dom staruszków", "dom7", {"nazwa": "Dom 7 (para staruszków)", "opis": "ciepła izba starszej pary"})
    X = 6
    mp.shell([("Izba", [(1, 4, 11, 8)], F_RED, W_WALLPAPER)], border=B_WOOD, exit_x=X)
    mp.restyle_face(mp.rect(5, 1, 7, 3), W_RAW)
    mp.kind(0, mp.rect(5, 4, 7, 4), F_FLAGS)
    mp.shadows()
    hearth_cauldron(mp, X, 4)
    bed(mp, (13, 13), 1, 4, w=2, kind="łoże staruszków")
    nightstand_candle(mp, 3, 4)
    okno(mp, 4, firanka=1, dl=110); sill_pot(mp, 4, 1, 1)
    okno(mp, 9, firanka=1, dl=110); sill_pot(mp, 9, 1, 2)
    mp.pic(2, 2, "!Decoration_static", 7, 4, 2, "Obraz z chatą")
    RM.dresser(mp, 9, 4, "bowls")
    clock(mp, 11, 4)
    RM.rug_k(mp, 5, 6, 7, 7, RUG_RED_GOLD)
    mp.ev(6, 6, "!$Animal_Cat_Sleep", 0, 2, 0, name="Śpiący kot", priority=1, through=False, step=True)
    mp.hprop("fotel_bujany", 8, 6, name="Bujany fotel")
    mp.hprop("kolowrotek", 4, 6, name="Kołowrotek")
    table_sq(mp, 9, 7, style=6)
    blat(mp, 9, 7, "D", 1, 15); blat(mp, 10, 7, "D", 3, 11)
    chair(mp, 11, 8, 4)
    RM.plant_pot(mp, 1, 8, "green")
    RM.doormat(mp, X, 8)
    mp.miejsce("staruszek_wnetrze", 8, 7, 8, proponowane=True)
    mp.miejsce("staruszka_wnetrze", 3, 7, 6, proponowane=True)
    mp.wyjscie(X)
    return mp


# ======================================================================================================== 189 Dom weterana
def dom_weterana():
    """Dom 8 - Wacław Siwy, stary weteran o kuli: kamienna izba - kominek, nad nim po bokach stary miecz i pęknięta tarcza,
    mapa dawnych kampanii, zbroja na stojaku, stojak z toporem, proste łóżko i skrzynia, zapasowa kula przy łóżku, skóra
    niedźwiedzia przed ogniem, stół z kuflem i butelką, krzesło"""
    W, H = 14, 11
    mp = Wnetrze(189, W, H, "Dom weterana", "dom8", {"nazwa": "Dom 8 (weteran Wacław)", "opis": "kamienna izba starego żołnierza"})
    X = 6
    mp.shell([("Izba", [(1, 4, 12, 9)], F_FLAGS, W_STONE_BEAM)], border=B_STONE, exit_x=X)
    mp.restyle_face(mp.rect(5, 1, 7, 3), W_RAW)
    mp.shadows()
    fireplace_pic(mp, X, 4, kind=2)
    PP.firewood(mp, 5, 4); PP.firewood(mp, 7, 4)
    mp.tiles("E", 14, 8, 1, 2, 4, 1)                               # stary miecz na ścianie
    wall_d(mp, 8, 2, 1, 1, z=2)                                     # pęknięta tarcza
    okno(mp, 2, styl="stone", firanka=None, dl=90); okno(mp, 12, styl="stone", firanka=None, dl=90)
    mp.prop("mapa", 9, 2, name="Mapa dawnych kampanii")
    statue(mp, 11, 4, pattern=1)
    bed(mp, (12, 10), 1, 4, kind="łóżko weterana")
    nightstand_candle(mp, 2, 4)
    mp.m("kula", 3, 4, name="Zapasowa kula")
    RM.chest(mp, 1, 6)
    mp.tiles("D", 11, 13, 2, 3, 5, 5, z=1)                          # skóra niedźwiedzia
    table_h(mp, 8, 7, 2, style=6)
    blat(mp, 8, 7, "D", 4, 12)
    candle_on(mp, 9, 8)
    chair(mp, 10, 8, 4)
    mp.tiles("E", 13, 12, 1, 2, 12, 8); mp.solid.add((12, 9))        # stojak z toporem
    RM.barrel(mp, 1, 9, "plain")
    RM.doormat(mp, X, 9)
    mp.miejsce("weteran_wnetrze", 7, 7, 8)
    mp.wyjscie(X)
    return mp


# ======================================================================================================== 190 Izba do wynajęcia
def izba_wynajem():
    """Dom 9 - biedna izba do wynajęcia w chacie pod strzechą z przybudówką: siennik ze świecą na stołku, pusta skrzynia,
    cebrzyk do mycia, stolik i stołek, kurz i pajęczyny; w przybudówce rupiecie (połamane skrzynki, worek, beczka, drewno)"""
    W, H = 12, 10
    mp = Wnetrze(190, W, H, "Izba do wynajęcia", "dom9", {"nazwa": "Dom 9 (izba do wynajęcia)", "opis": "biedna izba i komórka"},
                 note=NOTE_DIM)
    X = 4
    rooms = [("Izba", [(1, 4, 7, 8)], F_DARK, W_LOGS),
             ("Komórka", [(9, 4, 10, 8)], F_COBBLE, W_PLANKS)]
    mp.shell(rooms, openings=[("Komórka", (8, 7, 8, 7))], border=B_WOOD, exit_x=X, exit_room="Izba")
    mp.shadows()
    okno(mp, 5, styl="small", firanka=None, dl=80)
    okno(mp, 2, firanka=7, dl=80)
    bed(mp, (9, 13), 1, 4, kind="siennik")
    stool_candle(mp, 2, 4)
    mp.tprop("cebrzyk_woda", 3, 4)
    RM.chest(mp, 7, 4, name="Pusta skrzynia")
    mp.hprop("kolki_ubrania", 4, 3, name="Kołki z wytartym płaszczem")
    mp.t("D", 7, 6, 6, 3); mp.t("D", 7, 7, 6, 4); mp.solid.add((6, 4))   # miotła
    stolik(mp, 6, 6)
    stool(mp, 5, 7)
    blat(mp, 6, 6, "D", 0, 12)
    kurz(mp, mp.rect(1, 7, 2, 8)); kurz(mp, mp.rect(6, 8, 7, 8))
    pajeczyna(mp, 1, 1, 0); pajeczyna(mp, 7, 1, 1)
    RM.doormat(mp, X, 8)
    # ---- komórka
    mp.tiles("D", 13, 5, 1, 2, 9, 3); mp.solid.add((9, 4))
    RM.sacks(mp, 10, 4, wide=False)
    PP.firewood(mp, 10, 8)
    RM.barrel(mp, 9, 8, "plain")
    pajeczyna(mp, 10, 1, 1)
    mp.wyjscie(X)
    return mp


# ======================================================================================================== domy w pierzejach (193-198)
# (decyzja użytkownika 2026-10-22: sześć dodatkowych domów w pierzejach ulic też z wnętrzami; mieszkańców TownLife nie mają.
#  Mapy 191 i 192 są zarezerwowane - Okolice MAPS.spare.)
def mprops(mp, x, y, idx, d, p, name, floor=True, note=""):
    """rzecz z !Mt_Props (bloki kamienia, płyta z krukiem, okruchy, kilof): na podłodze stoi na swojej kratce"""
    return mp.pic(x, y, "!Mt_Props", idx, d, p, name, floor=floor, note=note)


def swiece_zgaszone(mp, x, y, which=0, name="Świece na sprzedaż"):
    """zgaszone świece z !Decoration2 (wiązka trzech / para / pojedyncza) jako towar na ladzie albo półce"""
    idx, d, p = [(2, 6, 0), (6, 2, 0), (2, 4, 0), (6, 6, 1)][which]
    return mp.ev(x, y, "!Decoration2", idx, d, p, name=name, priority=0, through=True)


def dom_czeladnika():
    """Dom 10 - czeladnik piekarza: jedna izba, drzwi z boku (wejście z lewej, nie na osi); łóżko w kącie, palenisko
    w kamiennej ścianie z prawej, półka z bochenkami, łopata do chleba, długi stół do zagniatania z miską i bochenkiem,
    worki mąki i rozsypana mąka przy palenisku"""
    W, H = 12, 10
    mp = Wnetrze(193, W, H, "Dom czeladnika piekarza", "dom10", {"nazwa": "Dom 10 (przy piekarni)", "opis": "izba czeladnika piekarza"})
    X = 3
    mp.shell([("Izba", [(1, 4, 10, 8)], F_LIGHT, W_CREAM)], border=B_WOOD, exit_x=X)
    mp.restyle_face(mp.rect(7, 1, 9, 3), W_RAW)
    mp.kind(0, mp.rect(7, 4, 9, 5), F_FLAGS)
    mp.shadows()
    hearth_cauldron(mp, 8, 4)
    bed(mp, (12, 10), 1, 4, kind="łóżko czeladnika")
    okno(mp, 3, firanka=6, dl=100)
    shelf_wall(mp, 5, 2, "bread")
    mp.tprop("lopata_chleb", 6, 4)
    RM.chest(mp, 2, 4)
    table_h(mp, 5, 6, 3, style=6)                                   # stół do zagniatania
    blat(mp, 5, 6, "D", 0, 12); blat(mp, 6, 6, "D", 5, 10)
    candle_on(mp, 7, 7)
    stool(mp, 4, 7)
    RM.sacks(mp, 9, 8)
    mp.t("D", 8, 4, 10, 6); mp.solid.add((10, 6))                   # rozsypana mąka z worka
    mp.t("D", 9, 4, 8, 8); mp.solid.add((8, 8))
    RM.rug_k(mp, 1, 7, 2, 8, RUG_MAT)
    RM.doormat(mp, X, 8)
    mp.wyjscie(X)
    return mp


def kamienica_sklep():
    """Dom 11 - zamożniejsza kamienica przy ulicy południowej: na dole sklepik ze świecami i mydłem (lada w poprzek, za nią
    regał z towarem i drzwi do izby; kociołek do topienia łoju, beczki, kosz) i izba mieszkalna kupców (szafa, łoże,
    stół z krzesłami, chodnik, skrzynia)"""
    W, H = 18, 12
    mp = Wnetrze(194, W, H, "Kamienica ze sklepikiem", "dom11", {"nazwa": "Dom 11 (kamienice przy ulicy południowej)",
                                                                  "opis": "sklepik ze świecami i mydłem oraz izba mieszkalna"})
    X = 4
    rooms = [("Sklepik", [(1, 4, 8, 10)], F_HERRING, W_PLASTER_BEAM),
             ("Izba", [(10, 4, 16, 10)], F_RED, W_PANEL)]
    mp.shell(rooms, openings=[("Izba", (9, 5, 9, 5))], border=B_WOOD, exit_x=X, exit_room="Sklepik")
    mp.shadows()
    # ---- sklepik: regał z towarem za ladą, lada w poprzek, towar na ladzie
    mp.tiles("E", 6, 3, 2, 3, 1, 2); mp.solid |= {(1, 4), (2, 4)}   # regał z butelkami i naczyniami
    okno(mp, 4, firanka=0, dl=110)
    RM.barrel(mp, 7, 4, "cloth")
    RM.dresser(mp, 5, 4, "cupboard")
    counter_h(mp, 2, 6, 6)
    swiece_zgaszone(mp, 2, 7, 0); swiece_zgaszone(mp, 3, 7, 1)
    mp.m("mydlo", 5, 7)
    mp.prop("kasetka", 6, 7, name="Kasetka sklepiku")
    candle_on(mp, 4, 7)
    cauldron_fire(mp, 1, 9)                                         # kociołek do topienia łoju
    RM.barrel(mp, 8, 10, "plain")
    mp.tiles("D", 14, 3, 1, 2, 8, 8); mp.solid.add((8, 9))          # kosz z knotami
    RM.rug_k(mp, 3, 8, 5, 9, RUG_BROWN)
    RM.doormat(mp, X, 10)
    # ---- izba
    RM.wardrobe(mp, 11, 4, "wide")
    okno(mp, 13, firanka=2, dl=110)
    nightstand_candle(mp, 14, 4)
    bed(mp, (13, 10), 15, 4, w=2, kind="łoże kupców")
    table_sq(mp, 11, 7, style=8)
    chair(mp, 13, 7, 4, arm=True); chair(mp, 11, 9, 8, arm=True)
    blat(mp, 11, 7, "D", 1, 15); blat(mp, 12, 7, "D", 3, 11)
    RM.rug_k(mp, 14, 7, 15, 9, RUG_BLUE)
    RM.chest(mp, 16, 7, idx=6)
    RM.plant_pot(mp, 16, 10, "green")
    mp.wyjscie(X)
    return mp


def dom_rybaka():
    """Dom 12 - rodzina rybaka (bliźniak domu staruszków): izba z paleniskiem i zupą rybną, suszone ryby na drążkach, sieć
    na ścianie, para wioseł w kącie, stół z talerzem ryb i kubkami, beczka solonych ryb; za ścianą mała alkowa - łóżko
    rodziców i dziecięce łóżko ze skrzynką między nimi"""
    W, H = 13, 10
    mp = Wnetrze(195, W, H, "Dom rybaka", "dom12", {"nazwa": "Dom 12 (bliźniak domu staruszków)", "opis": "izba rodziny rybaka i alkowa"})
    X = 4
    rooms = [("Izba", [(1, 4, 7, 8)], F_DARK, W_LOGS),
             ("Alkowa", [(9, 4, 11, 8)], F_RED, W_PLASTER_BEAM)]
    mp.shell(rooms, openings=[("Alkowa", (8, 7, 8, 7))], border=B_WOOD, exit_x=X, exit_room="Izba")
    mp.restyle_face(mp.rect(3, 1, 5, 3), W_RAW)
    mp.kind(0, mp.rect(3, 4, 5, 4), F_FLAGS)
    mp.shadows()
    hearth_cauldron(mp, X, 4)
    hang_pole(mp, 2, 2, "fish", name="Suszone ryby"); hang_pole(mp, 6, 2, "fish", name="Suszone ryby")
    mp.m("siec", 7, 2)
    mp.m("wiosla", 1, 4)
    table_h(mp, 1, 6, 2, style=6)
    blat(mp, 1, 6, "D", 1, 13)
    candle_on(mp, 2, 7)
    stool(mp, 3, 7)
    RM.barrel(mp, 7, 8, "plain")
    mp.t("D", 3, 10, 6, 8, z=2); mp.solid.add((6, 8))                # kosz na ryby
    RM.rug_k(mp, 3, 5, 5, 6, RUG_BROWN)
    RM.doormat(mp, X, 8)
    # ---- alkowa
    bed(mp, (12, 10), 11, 4, kind="łóżko rodziców")
    bed(mp, (15, 10), 9, 4, kind="łóżeczko dziecka")
    RM.chest(mp, 10, 4, name="Skrzynka z zabawkami")
    okno(mp, 10, styl="small", firanka=None, dl=80)
    sconce_wall(mp, 11, 2)
    mp.wyjscie(X)
    return mp


def dom_balwierza():
    """Dom 13 - balwierz i zielarz (dom z lukarnami na wschodzie): izba z fotelem do golenia przed lustrem, umywalką
    i cebrzykiem, regał z miksturami, stół z moździerzem i flaszkami, ława dla czekających, zioła pod sufitem; obok zielarnia
    - pęki ziół na drążkach, doniczki z ziołami, kosze, worki, stolik ze słojami. Drzwi poza osią (z prawej)."""
    W, H = 16, 11
    mp = Wnetrze(196, W, H, "Dom balwierza", "dom13", {"nazwa": "Dom 13 (dom z lukarnami na wschodzie)",
                                                     "opis": "izba balwierza i zielarnia"})
    X = 7
    rooms = [("Izba balwierza", [(1, 4, 9, 9)], F_LIGHT, W_CREAM),
             ("Zielarnia", [(11, 4, 14, 9)], F_DARK, W_LOGS)]
    mp.shell(rooms, openings=[("Zielarnia", (10, 8, 10, 8))], border=B_WOOD, exit_x=X, exit_room="Izba balwierza")
    mp.shadows()
    mp.tiles("E", 8, 0, 2, 3, 1, 2); mp.solid |= {(1, 4), (2, 4)}   # regał z miksturami
    okno(mp, 3, firanka=1, dl=110); okno(mp, 9, firanka=1, dl=110)
    hang_pole(mp, 6, 2, "herbs"); hang_pole(mp, 8, 2, "garlic")
    mp.tiles("D", 0, 4, 1, 2, 5, 2, z=2)                              # lustro balwierza
    HL.washstand(mp, 4, 4)
    mp.tiles("C", 2, 14, 1, 1, 5, 5, z=3); mp.t("C", 2, 15, 5, 6); mp.solid.add((5, 6))   # fotel do golenia
    mp.tprop("cebrzyk_woda", 6, 4)
    table_h(mp, 1, 7, 3, style=6)
    mp.m("mozdzierz", 1, 7)
    blat(mp, 2, 7, "D", 4, 13)
    candle_on(mp, 3, 8)
    bench_h(mp, 8, 9)
    RM.rug_k(mp, 4, 7, 6, 8, RUG_GREEN)
    RM.doormat(mp, X, 9)
    # ---- zielarnia
    okno(mp, 13, styl="small", firanka=None, dl=80)
    hang_pole(mp, 12, 2, "herbs"); hang_pole(mp, 14, 2, "herbs")
    RM.plant_pot(mp, 11, 4, "green"); RM.plant_pot(mp, 14, 4, "green")
    mp.tiles("D", 14, 3, 1, 2, 12, 3); mp.solid.add((12, 4))         # kosz z ziołami
    stolik(mp, 14, 6)
    blat(mp, 14, 6, "D", 4, 12)
    RM.sacks(mp, 11, 9, wide=False)
    RM.barrel(mp, 14, 9, "plain")
    lantern(mp, 11, 1, style=1, light=L_LANTERN_SMALL)
    mp.wyjscie(X)
    return mp


def dom_skryby():
    """Dom 14 - skryba i nauczyciel (obok domu weterana): izba-szkółka - tablica kredowa na ścianie, pulpit z księgą, dwa
    stoły dla uczniów z tabliczkami i ławami; w kącie skryby biblioteczki, pulpit do pisania ze świecą, łóżko"""
    W, H = 13, 11
    mp = Wnetrze(197, W, H, "Dom skryby", "dom14", {"nazwa": "Dom 14 (obok domu weterana)", "opis": "izba skryby i nauczyciela"})
    X = 6
    mp.shell([("Izba", [(1, 4, 11, 9)], F_VERT, W_PANEL)], border=B_WOOD, exit_x=X)
    mp.shadows()
    mp.tiles("C", 0, 0, 1, 3, 1, 2); mp.solid.add((1, 4))           # regał z księgami
    RM.bookcase(mp, 2, 4)
    okno(mp, 3, firanka=4, dl=110)
    mp.prop("tablica_kreda", 6, 2, name="Tablica kredowa")
    okno(mp, 8, firanka=4, dl=110)
    mp.tiles("C", 3, 2, 1, 2, 9, 3); mp.solid.add((9, 4))           # pulpit do pisania
    RM.bookcase(mp, 10, 4)
    bed(mp, (12, 10), 11, 4, kind="łóżko skryby")
    mp.pic(X, 5, "!Decoration_static", 6, 2, 2, "Pulpit z księgą", floor=True)
    for x0 in (2, 8):
        table_h(mp, x0, 7, 2, style=6)
        bench_h(mp, x0, 9)
        mp.m("tabliczki", x0, 7)
    blat(mp, 3, 7, "D", 6, 10); blat(mp, 9, 7, "D", 7, 13)
    candle_on(mp, 3, 8); candle_on(mp, 9, 8)
    RM.rug_k(mp, 5, 6, 7, 7, RUG_RED)
    RM.doormat(mp, X, 9)
    mp.wyjscie(X)
    return mp


def dom_kamieniarza():
    """Dom 15 - kamieniarz od nagrobków (przy cmentarzu): duża pracownia na bruku - bloki kamienia pod ścianą, niedokończona
    płyta z krukiem zakonu, okruchy, kamienny stół z dłutami, toczydło, kilof, gotowa płyta czekająca na odbiór, woda;
    z lewej wąska izdebka (siennik, stołek ze świecą, stolik, skrzynia)"""
    W, H = 16, 11
    mp = Wnetrze(198, W, H, "Dom kamieniarza", "dom15", {"nazwa": "Dom 15 (przy cmentarzu)", "opis": "pracownia kamieniarza i izdebka"},
                 note=NOTE_DIM)
    X = 9
    rooms = [("Pracownia", [(5, 4, 14, 9)], F_COBBLE, W_RAW),
             ("Izdebka", [(1, 4, 3, 9)], F_DARK, W_LOGS)]
    mp.shell(rooms, openings=[("Izdebka", (4, 8, 4, 8))], border=B_STONE, exit_x=X, exit_room="Pracownia")
    mp.shadows()
    # ---- pracownia: półka z dłutami | okno | gotowa płyta | bloki | kilof (pod oknem) | toczydło | woda
    mp.tiles("E", 8, 5, 2, 3, 5, 2); mp.solid |= {(5, 4), (6, 4)}  # półka z dłutami i rylcami
    okno(mp, 7, styl="stone", firanka=None, dl=100); okno(mp, 12, styl="stone", firanka=None, dl=100)
    mprops(mp, 8, 4, 0, 2, 2, "Gotowa płyta nagrobna")
    lantern(mp, 9, 1, style=1)
    mprops(mp, 10, 4, 0, 4, 0, "Bloki kamienia")
    mprops(mp, 11, 4, 0, 2, 0, "Blok kamienia")
    mprops(mp, 12, 4, 4, 2, 2, "Kilof")
    mp.tiles("E", 8, 12, 1, 2, 13, 3); mp.solid.add((13, 4))       # toczydło
    mp.tprop("wiadro_woda", 14, 4)
    # niedokończona płyta z krukiem zakonu na środku, okruchy wokół
    mprops(mp, 12, 7, 0, 2, 1, "Niedokończona płyta z krukiem zakonu")
    mprops(mp, 11, 7, 0, 4, 2, "Okruchy kamienia", floor=False)
    mprops(mp, 13, 7, 0, 4, 2, "Okruchy kamienia", floor=False)
    mprops(mp, 12, 8, 0, 4, 2, "Okruchy kamienia", floor=False)
    table_h(mp, 6, 7, 2, style=8)                                   # kamienny stół
    mp.m("dluta", 6, 7)
    candle_on(mp, 7, 8)
    RM.sacks(mp, 5, 9, wide=False)
    mprops(mp, 14, 9, 0, 4, 1, "Blok kamienia")
    mprops(mp, 14, 6, 0, 2, 0, "Blok kamienia")
    RM.doormat(mp, X, 9)
    # ---- izdebka
    bed(mp, (9, 13), 1, 4, kind="siennik")
    stool_candle(mp, 2, 4)
    RM.chest(mp, 3, 4)
    stolik(mp, 1, 7)
    blat(mp, 1, 7, "D", 0, 14)
    stool(mp, 2, 8)
    pajeczyna(mp, 1, 1, 0)
    mp.wyjscie(X)
    return mp


BUILDERS = {178: kaplica, 179: dom_grabarza, 180: straznica, 181: stajnia, 182: dom_przekupki, 183: kamienica,
            184: dom_szwaczki, 185: dom_wdowy, 186: dom_kupca, 187: dom_ciesli, 188: dom_staruszkow, 189: dom_weterana,
            190: izba_wynajem,
            193: dom_czeladnika, 194: kamienica_sklep, 195: dom_rybaka, 196: dom_balwierza, 197: dom_skryby, 198: dom_kamieniarza}
PIERZEJE = (193, 194, 195, 196, 197, 198)


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


MIESZKANCY = {"grabarz": "Hieronim", "grabarz_kaplica": "Hieronim (opiekun)", "kapral": "kapral Wit", "kolodziej": "Szczepan",
              "przekupka": "Agata", "szwaczka": "Dorota", "wdowa": "Halina", "kostek": "Kostek", "jagodka": "Jagódka",
              "ciesla": "Leon", "weteran": "Wacław", "straz_1": "strażnik", "straz_2": "strażnik", "sluzaca": "służąca",
              "staruszek": "staruszek", "staruszka": "staruszka"}


def zestawienie(meta, out, tytul, cols=4):
    """docs/miasteczko/wnetrza_nowe.png: wszystkie wnętrza obok siebie (render mapy bez siatki, pomniejszony), z podpisami"""
    sys.path.insert(0, os.path.join(ROOT, "tools", "mapy"))
    import mapylib as L
    from PIL import Image, ImageDraw
    S = 0.5
    tiles = []
    for k in sorted(meta, key=int):
        m = meta[k]
        mp = L.Mapa(int(k), path=os.path.join(OUT, m["plik"]))
        img = L.render(mp, grid=False).convert("RGB")
        img = img.resize((int(img.width * S), int(img.height * S)), Image.LANCZOS)
        d = ImageDraw.Draw(img)
        # kratka wejścia i miejsca mieszkańców
        T = 48 * S
        wx, wy = m["wejscie"]["x"], m["wejscie"]["y"]
        d.rectangle([wx * T + 2, wy * T + 2, wx * T + T - 3, wy * T + T - 3], outline=(90, 230, 120), width=2)
        for sk, sp in m["miejsca"].items():
            x, y = sp["x"], sp["y"]
            d.ellipse([x * T + 5, y * T + 5, x * T + T - 6, y * T + T - 6], outline=(255, 220, 70), width=2)
        who = [MIESZKANCY.get(sk.replace("_wnetrze", ""), sk) for sk in m["miejsca"]]
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
    d.text((pad, 42), "zielona ramka: kratka wejścia z miasta; żółte kółka: miejsca mieszkańców („Miejsce: …_wnetrze”)",
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
        mp, j, path = build_one(mid)
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
            for p in bl + uw: print("   ", p["kod"], p["opis"])
            if not ok: bad += 1
        if "--bez-obrazkow" not in argv:
            render(mid, path, os.path.join(OUT, "Map%03d.png" % mid))
        meta[str(mid)] = rec
        print(line)
    with open(meta_path, "wb") as f:
        f.write((json.dumps({"opis": "Wnętrza nowego miasta (tools/miasto2/wnetrza/build.py). Instaluje koordynator: MapNNN.json -> "
                                     "data/, MapInfos: nazwa = 'nazwa', rodzic = 8, nazwa wyświetlana już w mapie. 'wejscie' = kratka, "
                                     "na którą mają przenosić drzwi z 'drzwi_na_mapie_8' (twarzą w górę, kierunek 8). 'wyjscie'.'do' = "
                                     "kratka przed drzwiami z tools/miasto2/budynki.json ('zastepcze': true = brak wpisu, (1,1)). "
                                     "'miejsca' = zdarzenia 'Miejsce: <nazwa>' dla TownLife; 'proponowane': true = mieszkańca o tym "
                                     "kluczu jeszcze nie ma w TownLife (decyzja agenta mieszkańców).",
                             "mapy": dict(sorted(meta.items()))}, ensure_ascii=False, indent=1) + "\n").encode("utf-8"))
    print("meta ->", os.path.relpath(meta_path, ROOT), "| mapy z problemami:", bad)
    if "--bez-obrazkow" not in argv:
        zestawienie({k: v for k, v in meta.items() if int(k) not in PIERZEJE}, os.path.join(ROOT, "docs", "miasteczko", "wnetrza_nowe.png"),
                    "Nowe miasto - wnętrza nowych budynków (mapy 178-190, kopia robocza tools/miasto2/wnetrza)")
        zestawienie({k: v for k, v in meta.items() if int(k) in PIERZEJE}, os.path.join(ROOT, "docs", "miasteczko", "wnetrza_nowe_2.png"),
                    "Nowe miasto - wnętrza domów w pierzejach (mapy 193-198, kopia robocza tools/miasto2/wnetrza)", cols=3)


if __name__ == "__main__":
    main(sys.argv[1:])
