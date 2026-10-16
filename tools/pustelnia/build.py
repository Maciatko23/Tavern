# python tools/pustelnia/build.py [--render]
#   -> tools/miejsca_wyspy/staging_A/data/Map155.json, Map156.json   (pełne pliki map do instalacji przez koordynatora)
#   -> tools/pustelnia/staging/Map155_meta.json, Map156_meta.json    (miejsca, wyjścia, drzwi - dla testu i rysunków)
#   (--render: tools/pustelnia/staging/Map155.png, Map156.png - podgląd 1:1)
#
# PAKIET A "Pustelnia na klifie" (docs/miejsca_wyspy/PAKIETY.md, koncepcja: docs/miejsca_wyspy/KONCEPCJA.md punkt 3, szkic
# zatwierdzony przez użytkownika 2026-10-16: docs/miejsca_wyspy/rzut_pustelnia.png). Mapa powstaje z tego samego szkicu
# (tools/miejsca_wyspy/szkice.py pustelnia(): tarasy MMap, domy Pod, morze A1 jak na przystani), z prawdziwymi zdarzeniami:
#   Map155 "Pustelnia na klifie" 48 x 36, tileset 11, <Clouds:on><Farm:off><Water:salt> (morze słone i czerwone - CzerwonaWoda),
#     trzy poziomy: na dole kamienista plaża i las, wyżej zbocze, na górze klif ze skryptorium, wieżą z dzwonem, celą Kleofasa,
#     suchym ogródkiem i ulami, pustą cysterną, grobami kronikarzy i ławką nad urwiskiem
#     przejścia (kontrakt WyspaData.LINKS): dół (23-25, 35) -> przystań 125 (14-16, 1); prawa krawędź (47, 17-18) -> Urwisko 157
#     (1, 19-20) tylko gdy Wyspa.isReady(157), inaczej popup; lądowania (23-25, 34) i (46, 17-18)
#     drzewa i skały to zdarzenia z Map003 (zasada użytkownika: każdy obiekt to zdarzenie), kopiec z krukiem to zwykły obrazek
#     (nie do rozkopania), światło: tylko płomień (latarenka przy drzwiach skryptorium, latarenka celi)
#   Map156 "Skryptorium" (tileset 8, wnętrze jak przystań/Podgrodzie): pulpit z księgą (czytanie kart: Pustelnia.lectern),
#     regały kronik, stół kopisty z kałamarzem, piec (płomień), skrzynia z tarczą szyfru, okno na morze, świece;
#     miejsce Kleofasa "Miejsce: pustelnik_wnetrze"
# Nic tu nie zapisuje do data/ (instaluje koordynator).
import os, sys, json, copy, math
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..")).replace("\\", "/") + "/"
for p in ("tools/miejsca_wyspy", "tools/newstart", "tools/town", "tools/podgrodzie", "tools/mountains"):
    if ROOT + p not in sys.path: sys.path.insert(0, ROOT + p)
import szkic_lib as SL                                                          # noqa: E402
from szkic_lib import (Szkic, SEA, DEEP, DIRT, EARTH, PEBBLES, DRY, TUFTS, WALL_FACE, noise)   # noqa: E402
import plib                                                                     # noqa: E402
import mtlib                                                                    # noqa: E402
from nslib import write_map, blank_page                                         # noqa: E402

OUT_DATA = ROOT + "tools/miejsca_wyspy/staging_A/data/"
STAGING = os.path.join(HERE, "staging")
MAP_ID, INNER, HARBOUR, CLIFFS = 155, 156, 125, 157
W, H = 48, 36
NOTE = "<Clouds:on>\n<Farm:off>\n<Water:salt>"
DOOR = (14, 9)                    # the scriptorium's door (its front: 14, 10)
TOWER = (20, 9)                   # the bell tower's picture (bottom-middle cell)
CELL_DOOR = (23, 7)               # Kleofas's cell (closed)
HOURS = (5, 21)                   # the scriptorium open
LAND_SOUTH = [(23, 34), (24, 34), (25, 34)]
LAND_EAST = [(46, 17), (46, 18)]
# TownLife's spots of Kleofas (Miejsce: <key>) - Pustelnia_Data.js plans with these names
SPOTS = {
    "skryptorium_drzwi": (14, 10, 8),   # inside: the scriptorium (Map156 shows him there)
    "cela_drzwi": (23, 8, 8),           # inside: the cell (asleep - away, not shown anywhere)
    "urwisko": (7, 7, 4),               # dawn prayers on the cliff's edge, facing the sea
    "lawka": (9, 6, 4),                 # bread with honey, the sunset - beside the bench over the cliff
    "ogrodek": (16, 11, 2),             # the dry garden
    "ule": (26, 8, 6),                  # the hives
    "wieza": (20, 10, 8),               # in front of the bell tower (the Night of the Question)
}


def look_cmds(text, color="info"):
    return plib.popup_cmds(text, color)


def script_cmds(js):
    return [{"code": 355, "indent": 0, "parameters": [js]}]


# ================================================================================================ Map155
class Hermitage(Szkic):
    def __init__(self):
        Szkic.__init__(self, MAP_ID, W, H, "Pustelnia na klifie", NOTE, seed=155)
        self.spots = {}
        self.looks = []

    def look(self, x, y, name, text, priority=1, through=False, js=None):
        """something to look at (the action button): a popup over the hero, or a call of Pustelnia (js)"""
        cmds = script_cmds(js) if js else look_cmds(text)
        e = plib.event(name, x, y, None, priority, through, 0, cmds, "")
        self.add(x, y, e)
        self.looks.append({"name": name, "x": x, "y": y})
        return e

    def spot_ev(self, key, x, y, d):
        img = {"tileId": 0, "characterName": "", "characterIndex": 0, "direction": d, "pattern": 0}
        e = plib.event("Miejsce: %s" % key, x, y, img, priority=0, through=True)
        self.events.append((x, y, e))
        self.spots[key] = [x, y, d]
        return e


def terrain(mp):
    """the approved sketch's ground (tools/miejsca_wyspy/szkice.py pustelnia())"""
    sea = set()
    for x in range(W):
        top = 3 + (1 if noise(x // 3, 0, 11) > 0.6 else 0) + (1 if x < 9 else 0)
        for y in range(0, top): sea.add((x, y))
    for y in range(H):
        left = 6 + (1 if noise(0, y // 2, 12) > 0.55 else 0) - (2 if y > 27 else 0) - (1 if y > 31 else 0)
        for x in range(0, left): sea.add((x, y))
    l2 = {(x, y) for x in range(7, 31) for y in range(3, 13)} - sea - {(x, y) for x in range(27, 31) for y in range(10, 13)}
    l1 = ({(x, y) for x in range(7, W) for y in range(3, 22)} - sea - {(x, y) for x in range(7, 11) for y in range(14, 22)})
    mp.raise_to(l1, 1)
    mp.raise_to(l2, 2)
    mp.terraces()
    mp.stairs(23, 25, 21, "stone")
    mp.stairs(25, 26, 12, "stone")
    mp.sea(sea)
    mp.deep({(x, y) for (x, y) in sea if x < 3 or y < 1})
    mp.sea_set = sea
    shore = {(x, y) for y in range(13, H) for x in range(0, 12) if (x, y) not in sea and mp.lv(x, y) == 0}
    mp.kind(0, {c for c in shore if c[0] < 9 + (1 if noise(*c, 3) > 0.6 else 0)}, DIRT)
    mp.overlay({c for c in shore if c[0] < 9}, PEBBLES, 0.25, 4)
    mp.overlay({c for c in mp.all if mp.lv(*c) == 2}, DRY, 0.10, 5)
    mp.overlay({c for c in mp.all if mp.lv(*c) == 1}, TUFTS, 0.12, 6)
    mp.shore = shore
    # the paths: up from the harbour, the stone steps, the cliff, the way east to Urwisko
    mp.lane([(24, 35.5), (24.2, 30), (24.4, 25.5)], 2.2, seed=21)
    mp.lane([(24.2, 20.8), (24.6, 18.5), (25.6, 16)], 2.0, seed=22)
    mp.lane([(26, 11.5), (24, 10.5), (16, 10.5), (12.5, 11)], 1.8, seed=23)
    mp.lane([(26, 18.4), (33, 18.0), (40, 17.6), (47.5, 17.6)], 2.0, seed=24)
    mp.lane([(23, 10.5), (23, 8.6)], 1.2, seed=25)                       # to the cell's door
    mp.lane([(12.5, 11), (10.2, 9.0), (9.6, 6.6)], 1.2, seed=26)          # to the bench over the cliff
    mp.lane([(14, 10.4), (14, 10)], 1.0, seed=27)                         # the scriptorium's doorstep


def buildings(mp):
    # the scriptorium: the Order's stone chapel (interior Map156)
    rec = mp.house("skryptorium", "Skryptorium", 10, 4, 8, 3, 3, "slate", WALL_FACE, door=4, windows=[(1, "wood_lit"), (6, "wood")],
                   chimney=6, chimney_style=4, ivy=(0, 7), interior="skryptorium", hours=HOURS)
    mp.scriptorium = rec
    # the bell tower (the old watchtower): the bell without its heart until W2 rozdz. 7
    mp.picture(TOWER[0], TOWER[1], "!$Big_Decoration", 0, 4, 0, name="Wieża skryptorium", priority=1)
    mp.blocker(19, 8, 21, 9, name="Wieża skryptorium: podstawa")
    mp.look(20, 8, "Dzwon w wieży", "", priority=0, through=True, js="Pustelnia.look(this, \"dzwon\")")
    # brother Kleofas's cell (shut: he sleeps there 20-4)
    mp.house("cela", "Cela brata Kleofasa", 22, 4, 4, 2, 2, "thatch", "grey_logs", door=1, windows=[(3, "tiny")], chimney=2,
             chimney_style=3, closed_text="Cela brata Kleofasa. Zamknięta.")
    # the lantern at the scriptorium's door and the cell's (flames, at night)
    plib.Pod.light(mp, 15, 7, "!Decoration", 7, 2, 0, "Latarenka u drzwi skryptorium", "<Light:140,90,62,22><LightWhen:night>", priority=2, through=True)
    plib.Pod.light(mp, 25, 6, "!Decoration", 7, 2, 0, "Latarenka przy celi", "<Light:120,90,62,22><LightWhen:night>", priority=2, through=True)
    # a lantern on a post by the bell tower (the Night of the Question is kept there)
    mp.thing("lantern_post", 22, 10)
    plib.Pod.light(mp, 22, 9, "!Decoration", 7, 2, 0, "Latarnia przy wieży", "<Light:150,90,62,24><LightWhen:night>", priority=2, through=True)


GRAVES = [
    (27, "grave_cross_fl", "Grób kronikarza", "„Brat Wawrzyniec, kronikarz. Pisał, póki widział.”"),
    (28, "grave_cross", "Grób kronikarza", "„Brat Idzi, kronikarz. Spisał upadek i nie dożył wiosny.”"),
    (29, "grave_cross_fl", "Grób kronikarza", "„Brat Bonifacy. Nauczył mnie liter.” Wyryte świeżej niż dwa pozostałe."),
]


def things(mp):
    # the bench over the cliff (the sunset, bread with honey) and the empty rain cistern
    mp.thing("bench", 8, 5)
    mp.town_prop("well_dry", 8, 11, label="Pusta cysterna na deszczówkę",
                 cmds=look_cmds("Cysterna na deszczówkę. Pusta. Od lat."))
    # the graves of the chroniclers
    for x, prop, name, text in GRAVES:
        mp.town_prop(prop, x, 6, label=name, cmds=look_cmds(text))
    # the dry garden: a row of thin plants on the cliff's edge, a log to sit on
    mp.kind(0, {(x, 12) for x in range(13, 20)}, EARTH)
    for (x, y) in [(13, 12), (14, 12), (15, 12), (17, 12), (18, 12), (19, 12)]:
        mp.thing(["sprout_a", "sprout_d", "sprout_b", "sprout_e", "sprout_c", "sprout_f"][(x + y) % 6], x, y)
    mp.look(16, 12, "Suchy ogródek", "Grządka szałwii i cząbru. Sucha jak pieprz. Kleofas podlewa ją resztką z kubka.",
            priority=0, through=True)
    mp.thing("log_bench", 20, 12)
    mp.thing("basket_jugs", 26, 6)
    # the hives (art: !$Pustelnia_Ule) - honey and wax
    mp.picture(28, 9, "!$Pustelnia_Ule", 0, 2, 0, name="Ule brata Kleofasa", priority=1,
               cmds=script_cmds("Pustelnia.look(this, \"ule\")"))
    mp.blocker(27, 9, 29, 9, name="Ule: miejsce")
    # the cairn with the raven (the Order's sign at the crossroads) - a picture, not a rock to mine
    mp.picture(27, 19, "!$Rock_Cairn", 0, 2, 0, name="Kopiec z krukiem",
               cmds=look_cmds("Kopiec z kamieni. Na górnym wykuty kruk z rozłożonymi skrzydłami - znak zakonu."))
    # down below: rocks (Map003's: they give stones), the sea's driftwood, a broken crate on the beach
    for (x, y, r) in [(12, 16, "!$Rock_Mossy"), (14, 20, "!$Rock_Pile"), (31, 6, "!$Rock_Flat"), (44, 9, "!$Rock_Mound"),
                      (8, 25, "!$Boulder_A"), (6, 33, "!$Rock_Slab"), (20, 28, "!$Rock_Chunk"), (35, 15, "!$Rock_Cracked")]:
        mp.put(x, y, r, force=True)
    mp.put(7, 19, "!$Logs_Big", name="Drewno wyrzucone przez morze", force=True)
    mp.thing("crate_open", 5, 29)
    mp.look(5, 28, "Rozbita skrzynia", "Skrzynia wyrzucona przez morze. Na desce wypalone oko - znak Czarnych Oczu.", priority=0, through=True)
    mp.clump("rock", 3, 30); mp.clump("stones", 4, 27); mp.clump("rock", 5, 15); mp.clump("stones", 6, 22)
    for c in [(16, 28), (21, 33), (35, 33), (11, 25), (28, 24), (40, 25)]: mp.clump("fern", *c)
    # pines (Map003's: they can be felled)
    for (x, y) in [(33, 6), (37, 4), (41, 7), (45, 5), (36, 11), (43, 12), (39, 14), (46, 14), (34, 21), (41, 21), (31, 13),
                   (45, 20), (14, 27), (18, 31), (29, 29), (33, 26), (38, 30), (43, 27), (46, 33), (31, 34), (16, 34), (37, 24)]:
        mp.pine(x, y)


def ways(mp):
    # down to the harbour (Map125 14-16, 1 facing down) - the contract's cells
    for k, x in enumerate((23, 24, 25)):
        plib.Pod.transfer(mp, x, 35, HARBOUR, 14 + k, 1, 2, "Przejście -> Przystań")
    # east to Urwisko Kruków (Map157 1, 19-20 facing right) - only when that place is built (Wyspa.isReady)
    for k, y in enumerate((17, 18)):
        js = ("if (window.Wyspa && Wyspa.isReady(%d)) { $gamePlayer.reserveTransfer(%d, 1, %d, 6, 0); } else if (window.Pustelnia) "
              "{ Pustelnia.edge(this); }" % (CLIFFS, CLIFFS, 19 + k))
        e = plib.event("Przejście -> Urwisko Kruków", 47, y, None, 0, False, 1, script_cmds(js), "<Wyspa:pustelnia_urwisko>", dfix=False)
        mp.add(47, y, e)
        mp.exits.append({"x": 47, "y": y, "to": [CLIFFS, 1, 19 + k, 6], "gate": "Wyspa.isReady(157)"})
    for key, (x, y, d) in SPOTS.items():
        mp.spot_ev(key, x, y, d)


OPEN_ROUTE = [{"code": 36, "indent": None}, {"code": 17, "indent": None}, {"code": 15, "indent": None, "parameters": [3]},
              {"code": 18, "indent": None}, {"code": 15, "indent": None, "parameters": [3]}, {"code": 19, "indent": None},
              {"code": 15, "indent": None, "parameters": [3]}]


def door_list(mid, lx, ly, hours, text):
    """the town's door rule (tools/przystan/install.py): open hours -> in (Door1, the door opens), else a popup"""
    go = [{"code": 250, "indent": 1, "parameters": [{"name": "Door1", "volume": 80, "pitch": 100, "pan": 0}]},
          {"code": 205, "indent": 1, "parameters": [0, {"list": OPEN_ROUTE + [{"code": 0}], "repeat": False, "skippable": False, "wait": True}]}]
    go += [{"code": 505, "indent": 1, "parameters": [c]} for c in OPEN_ROUTE]
    go.append({"code": 201, "indent": 1, "parameters": [0, mid, lx, ly, 8, 0]})
    h0, h1 = hours
    cond = "(function(h){ return h >= %d && h < %d; })($gameSystem.dayNightHour ? $gameSystem.dayNightHour() : 12)" % (h0, h1)
    closed = ("const t = $gameTemp, k = this.eventId(); t._townDoorPop = t._townDoorPop || {}; "
              "if (!(t._townDoorPop[k] > Graphics.frameCount - 60)) { t._townDoorPop[k] = Graphics.frameCount; "
              "Tawerna.popup(%s, { color: \"info\" }); }" % json.dumps(text, ensure_ascii=False))
    return ([{"code": 111, "indent": 0, "parameters": [12, cond]}] + go + [{"code": 0, "indent": 1, "parameters": []},
            {"code": 411, "indent": 0, "parameters": []}, {"code": 355, "indent": 1, "parameters": [closed]},
            {"code": 0, "indent": 1, "parameters": []}, {"code": 412, "indent": 0, "parameters": []},
            {"code": 0, "indent": 0, "parameters": []}])


def build155():
    mp = Hermitage()
    terrain(mp)
    buildings(mp)
    things(mp)
    ways(mp)
    return mp


def paint_regions(data, events):
    import paint_layers as PL
    flags = json.loads(open(ROOT + "data/Tilesets.json", "rb").read().decode("utf-8"))[11]["flags"]
    m = {"width": W, "height": H, "data": data, "events": events, "_id": MAP_ID}
    paint, keep, why = PL.plan(m, flags)
    keep |= {(x, y + 1) for e in events if e and e["name"].startswith("Drzwi") for (x, y) in [(e["x"], e["y"])]}
    keep |= set(LAND_SOUTH) | set(LAND_EAST)
    base = 5 * W * H
    for (x, y) in paint:
        if (x, y) not in keep and data[base + y * W + x] == 0: data[base + y * W + x] = 2


# ================================================================================================ Map156 Skryptorium
def build156(door_event_id):
    sys.path.insert(0, ROOT + "tools/wnetrza")
    sys.path.insert(0, ROOT + "tools/interiors")
    import rooms as RM          # noqa: F401
    from rooms import (window2, candle_on, on_top, bookcase, shelf_tall, table_h, stool, rug_k, doormat, fireplace_pic, RUG_BLUE)
    import ilib
    import houselib as HL
    from nslib import blank_page as bp

    class Scriptorium(ilib.Interior):
        def exit_to(self, x, town_xy, name):
            tx, ty = town_xy
            cmds = [{"code": 250, "indent": 0, "parameters": [dict(ilib.DOOR_SE)]},
                    {"code": 201, "indent": 0, "parameters": [0, MAP_ID, tx, ty, 2, 0]}]
            e = {"name": name, "note": "", "pages": [bp(priority=0, trigger=1, cmds=cmds)]}
            self.add(x, self.H - 1, e)
            self.exits.append({"x": x, "y": self.H - 1, "door": door_event_id, "town": [tx, ty], "landing": [x, self.H - 2, 8], "name": name})
            self.hooks.append(("exit", x, self.H - 1))
            self.spots.setdefault("landing", [x, self.H - 2, 8])
            return e

        def act(self, x, y, name, js, floor=True):
            e = {"name": name, "note": "", "pages": [bp(priority=1 if floor else 0, trigger=0, cmds=script_cmds(js), through=not floor)]}
            self.add(x, y, e)
            return e

        def look(self, x, y, name, text, floor=False):
            """a look event ON a solid thing's cell (priority 1: the action button in front of it reaches it)"""
            e = {"name": name, "note": "", "pages": [bp(priority=1, trigger=0, cmds=script_cmds(
                "Tawerna.popup(%s, { color: \"info\" });" % json.dumps(text, ensure_ascii=False)), through=False)]}
            self.add(x, y, e)
            return e

    B_STONE, W_STONE, F_FLAGS = 16, 71, 96          # (the Order's raw stone, like the Archive Map119 and the bell tower Map108)
    W_, H_ = 13, 10
    note = "<Dust:on>\n<Dark:on>\n<DayNight:off>\n<Zoom:1.5>\n<DarkDay:90>\n<DarkNight:190>"
    mp = Scriptorium(INNER, W_, H_, "Skryptorium", "skryptorium", note=note)
    DOOR_X = 6
    mp.shell([("Skryptorium", [(1, 4, 11, 8)], F_FLAGS, W_STONE)], border=B_STONE, exit_x=DOOR_X)
    mp.shadows()
    g = "Skryptorium"

    def with_cmds(e, js):
        e["pages"][0]["list"] = script_cmds(js) + [{"code": 0, "indent": 0, "parameters": []}]
        return e

    # the windows on the sea (north wall)
    window2(mp, 4, 1, curtain=None, length=110)
    window2(mp, 9, 1, curtain=None, length=100)
    # the shelves of the chronicles along the west wall
    bookcase(mp, 1, 4, w=1)
    shelf_tall(mp, 2, 4, "books")
    mp.look(3, 4, "Regał kronik", "Kroniki zakonu przepisane ręką Kleofasa. Grzbiety podpisane latami. Wielu lat brakuje.")
    # the lectern with the book (the cards are read here) and a candelabrum (a flame)
    with_cmds(HL.thing(mp, 6, 5, "!Decoration_static", 6, 2, 2, "Pulpit z księgą", kind="pulpit", group=g), "Pustelnia.lectern(this);")
    HL.thing(mp, 7, 5, "!Decoration2", 4, 6, 0, "Kandelabr", kind="kandelabr", group=g, note="<Light:150,130,90,34><LightWhen:night>",
             step=True)
    # the copyist's table with the inkwell and a candle, a stool
    table_h(mp, 9, 5, 2, style=6, group=g + " stół kopisty")
    on_top(mp, 9, 5, "D", 7, 13)
    candle_on(mp, 10, 5)
    stool(mp, 9, 7, group=g)
    mp.look(10, 7, "Stół kopisty", "Kałamarz, gęsie pióra, nożyk do piór. Na karcie zaczęte zdanie: „Roku, gdy morze zakwitło krwią...”")
    # the stove (a flame) in the east corner
    fireplace_pic(mp, 11, 4, kind=2, group=g)
    # the chest with the cipher dial
    with_cmds(HL.thing(mp, 1, 7, "!Fantasy_chest", 6, 2, 0, "Skrzynia z tarczą szyfru", kind="skrzynia", group=g),
              "Pustelnia.look(this, \"tarcza\");")
    rug_k(mp, 4, 7, 8, 7, RUG_BLUE)
    doormat(mp, DOOR_X, 8)
    mp.resident("pustelnik", 5, 5, 6)
    mp.exit_to(DOOR_X, [DOOR[0], DOOR[1] + 1], "Drzwi -> Pustelnia na klifie")
    return mp


# ================================================================================================ write
def stage155(mp, inner_landing):
    data = mp.resolve()
    events = mp.build_events()
    # the scriptorium's door: in by day (HOURS), a popup by night
    door_id = None
    for e in events:
        if e and e["name"] == "Drzwi: Skryptorium":
            door_id = e["id"]
            e["pages"][0]["list"] = door_list(INNER, inner_landing[0], inner_landing[1], HOURS,
                                              "Skryptorium zamknięte na noc. Brat Kleofas śpi w celi.")
            e["pages"][0]["trigger"] = 1
    assert door_id, "no scriptorium door"
    paint_regions(data, events)
    props = dict(mp.props)
    props["bgs"] = {"name": "Sea", "pan": 0, "pitch": 100, "volume": 45}
    props["autoplayBgs"] = True
    props["autoplayBgm"] = False
    props["bgm"] = {"name": "", "pan": 0, "pitch": 100, "volume": 90}
    os.makedirs(OUT_DATA, exist_ok=True)
    write_map(OUT_DATA + "Map155.json", props, data, events)
    meta = {"id": MAP_ID, "size": [W, H], "spots": mp.spots, "exits": mp.exits, "door": [DOOR[0], DOOR[1]], "door_event": door_id,
            "tower": list(TOWER), "cell_door": list(CELL_DOOR), "land_south": LAND_SOUTH, "land_east": LAND_EAST, "looks": mp.looks,
            "lights": mp.lights}
    os.makedirs(STAGING, exist_ok=True)
    with open(os.path.join(STAGING, "Map155_meta.json"), "wb") as f:
        f.write(json.dumps(meta, ensure_ascii=False, indent=1).encode("utf-8"))
    return {"width": W, "height": H, "data": data, "events": events, "tilesetId": 11}, door_id


def main():
    render = "--render" in sys.argv
    mp = build155()
    # the scriptorium first (its landing), then the hermitage with the door wired
    probe, door_id = stage155(mp, (6, 8))
    inner = build156(door_id)
    os.makedirs(STAGING, exist_ok=True)
    path156 = OUT_DATA + "Map156.json"
    n = inner.write(path156, os.path.join(STAGING, "Map156_meta.json"))
    land = inner.exits[0]["landing"]
    m155, door_id2 = stage155(mp, (land[0], land[1]))
    assert door_id2 == door_id
    # the walking check: from the harbour's landing everything that matters is reached
    flags = mtlib.load_json(ROOT + "data/Tilesets.json")[11]["flags"]
    seen = mtlib.reach(m155, LAND_SOUTH[1], flags)
    need = {"drzwi skryptorium (przed)": (DOOR[0], DOOR[1] + 1), "wyjście na wschód": (47, 17), "plaża": (7, 30),
            "ławka": tuple(SPOTS["lawka"][:2]), "ule": tuple(SPOTS["ule"][:2]), "wieża": tuple(SPOTS["wieza"][:2]),
            "cela": tuple(SPOTS["cela_drzwi"][:2]), "ogródek": tuple(SPOTS["ogrodek"][:2]), "urwisko": tuple(SPOTS["urwisko"][:2])}
    bad = [k for k, c in need.items() if c not in seen]
    print("Map155 Pustelnia na klifie: %dx%d, %d zdarzeń; drzwi skryptorium = zdarzenie %d" % (W, H, len(m155["events"]) - 1, door_id))
    print("Map156 Skryptorium: %dx%d, %d zdarzeń" % (inner.W, inner.H, n))
    print("dojście z przystani: %s" % ("WSZĘDZIE" if not bad else "BRAK: " + ", ".join(bad)))
    if render:
        im = mtlib.render(m155, os.path.join(STAGING, "Map155.png"))
        import mzrender as R
        sys.path.insert(0, ROOT + "tools/interiors")
        m156 = json.load(open(path156, encoding="utf-8"))
        S = R.Sheets(8); S.lenient = True
        R.render(m156, S).convert("RGB").save(os.path.join(STAGING, "Map156.png"))
        print("podglądy: tools/pustelnia/staging/Map155.png, Map156.png")
    return 0 if not bad else 1


if __name__ == "__main__":
    sys.exit(main())
