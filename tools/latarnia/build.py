# python tools/latarnia/build.py [--render]
#   -> tools/miejsca_wyspy/staging_C/data/Map159.json, Map160.json, Map161.json   (pełne pliki map do instalacji przez koordynatora)
#   -> tools/latarnia/staging/Map159_meta.json, Map160_meta.json, Map161_meta.json (miejsca, wyjścia, drzwi - dla testu i rysunków)
#   (--render: tools/latarnia/staging/Map159.png, Map160.png, Map161.png - podgląd 1:1)
#
# PAKIET C "Przylądek z latarnią" (docs/miejsca_wyspy/PAKIETY.md, koncepcja: docs/miejsca_wyspy/KONCEPCJA.md punkt 5, szkic
# zatwierdzony przez użytkownika 2026-10-16: docs/miejsca_wyspy/rzut_latarnia.png). Mapa powstaje z tego samego szkicu
# (tools/miejsca_wyspy/szkice.py latarnia(): przylądek w morzu, dwa tarasy MMap, schody w skale, domy Pod, morze A1 jak na przystani),
# z prawdziwymi zdarzeniami:
#   Map159 "Przylądek z latarnią" 44 x 40, tileset 11, <Clouds:on><Farm:off><Water:salt> (morze słone i czerwone - CzerwonaWoda),
#     na górnym tarasie wieża latarni (obrazek !$Latarnia_Wieza z PixelLab, prosto z przodu; ogień w koszu i szyby rysuje Latarnia.js),
#     słup strażnicy z krukiem, dzwon mgłowy; na środkowym izba latarnika (wnętrze Map160), drewutnia, beczki tranu; na dole las,
#     zatoczka szczątków (łup po sztormie), ścieżki z Urwiska (zachód) i z Gór (dół)
#     przejścia (kontrakt WyspaData.LINKS): lewa krawędź (0, 33-34) -> Urwisko 157 (54, 19-20) tylko gdy Wyspa.isReady(157), inaczej
#     popup; dół (29-31, 39) -> Góry 13 (58, 11-13); lądowania (1, 33-34) i (29-31, 38)
#     drzewa i skały to zdarzenia z Map003 (zasada użytkownika: każdy obiekt to zdarzenie); słup strażnicy i płyta to zwykłe obrazki
#   Map160 "Izba latarnika" (tileset 8): łóżko, stół z Księgą mgieł (Latarnia.book), piec (płomień), półki ze słojami tranu,
#     beczki, płaszcz na kołku; miejsce Bazylego podaje Latarnia_Data.js (TownLifeData.SPOTS_BY_MAP - tylko kiedy jest w izbie)
#   Map161 "Laterna" (tileset 8): kamienna izdebka na szczycie wieży, okna dokoła, kosz z ogniem (płomień), soczewka w mosiężnym
#     pierścieniu (Latarnia.lens), linka dzwonu mgłowego, opał; zejście krętymi schodami -> przed drzwi wieży
# Nic tu nie zapisuje do data/ (instaluje koordynator).
import os, sys, json
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..")).replace("\\", "/") + "/"
for p in ("tools/miejsca_wyspy", "tools/newstart", "tools/town", "tools/podgrodzie", "tools/mountains"):
    if ROOT + p not in sys.path: sys.path.insert(0, ROOT + p)
from szkic_lib import (Szkic, DIRT, STONES, TUFTS, noise)   # noqa: E402
import plib                                                    # noqa: E402
import mtlib                                                   # noqa: E402
from nslib import write_map                                    # noqa: E402

OUT_DATA = ROOT + "tools/miejsca_wyspy/staging_C/data/"
STAGING = os.path.join(HERE, "staging")
MAP_ID, IZBA, LATERNA, CLIFFS, MOUNTAINS = 159, 160, 161, 157, 13
W, H = 44, 40
NOTE = "<Clouds:on>\n<Farm:off>\n<Water:salt>"
TOWER = (22, 11)                   # the lighthouse's picture (bottom-middle cell = its door)
IZBA_DOOR = (15, 18)               # the keeper's room (front 15, 19)
LAND_WEST = [(1, 33), (1, 34)]
LAND_SOUTH = [(29, 38), (30, 38), (31, 38)]
# TownLife's spots of Bazyli (Miejsce: <key>) - Latarnia_Data.js plans with these names ("inside" = in through that door)
SPOTS = {
    "laterna": (22, 12, 8),        # in front of the tower's door: up to the lantern room
    "izba": (15, 19, 8),           # in front of the room's door
    "izba_sen": (15, 19, 8),       # (asleep inside, by day - away: shown nowhere)
    "drewutnia": (25, 19, 6),      # by the chopping block, facing the woodshed
}
# the package's own markers (Latarnia.js finds them by name)
MARKS = {
    "lat_napad": (6, 33, 6),       # W11: the raiders come along the path from the west
    "lat_oboz": (6, 31, 2),        # W11: the thieves wait for their boat in the cove (their camp)
    "lat_dzwon": (26, 10, 8),      # in front of the fog bell (on the summit, beside the tower)
}


def script_cmds(js):
    return [{"code": 355, "indent": 0, "parameters": [js]}]


# ================================================================================================ Map159
class Cape(Szkic):
    def __init__(self):
        Szkic.__init__(self, MAP_ID, W, H, "Przylądek z latarnią", NOTE, seed=159)
        self.spots = {}
        self.looks = []

    def look(self, x, y, name, text, priority=1, through=False, js=None, note=""):
        """something to look at (the action button): a popup over the hero, or a call of Latarnia (js)"""
        cmds = script_cmds(js) if js else plib.popup_cmds(text)
        e = plib.event(name, x, y, None, priority, through, 0, cmds, note)
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
    """the approved sketch's ground (tools/miejsca_wyspy/szkice.py latarnia())"""
    cape = mp.blob(22, 14, 13, 13, seed=4, rough=0.18) | {(x, y) for x in range(9, 36) for y in range(18, 30)}
    land = cape | {(x, y) for x in range(0, W) for y in range(27, H)}
    land -= {(x, y) for x in range(0, 4) for y in range(27, 33)}
    sea = mp.all - land
    l1 = {c for c in cape if c[1] < 26}
    # 2026-10-29: three tiers one on another (the player's wish): l1 the cape's lawn, l2 a terrace on it (the woodshed), l3 the summit
    # with the lighthouse; faces of 3 rows under l2 and l3, a flight of steps through each, the path winding up from flight to flight
    l2 = {(x, y) for x in range(21, 34) for y in range(17, 22)} - {(21, 17), (33, 17), (33, 21), (21, 21)}
    l3 = {(x, y) for x in range(18, 28) for y in range(7, 14)} - {(18, 7), (19, 7), (26, 7), (27, 7), (18, 13), (27, 13)}
    mp.raise_to(l1, 1)
    mp.raise_to(l2 & l1, 2)
    mp.raise_to(l3 & l1, 3)
    mp.face_h[2] = 3
    mp.face_h[3] = 3
    mp.terraces()
    mp.stairs(21, 23, 25, "stone")
    stairs_n(mp, 31, 32, 21, 3)          # l2 -> l1 (east end of the terrace)
    stairs_n(mp, 25, 26, 13, 3)          # summit -> l2
    mp.sea(sea)
    mp.deep({(x, y) for (x, y) in sea if y < 2 or x < 2 or x > W - 3})
    for (x, y) in [(5, 6), (8, 3), (38, 5), (40, 10), (6, 15), (39, 20), (3, 24), (41, 25)]:
        if (x, y) in sea: mp.clump("rock", x, y, 1)
    mp.overlay({c for c in mp.all if mp.lv(*c) >= 1}, STONES, 0.16, 9)
    mp.overlay({c for c in mp.all if mp.lv(*c) == 0 and c not in sea}, TUFTS, 0.15, 10)
    # the paths: from Urwisko (west), from the mountains (bottom), up to the lighthouse
    mp.lane([(-0.5, 33.5), (10, 33.2), (18, 32), (22, 30), (22, 26.5)], 2.2, seed=41)
    mp.lane([(30.5, 39.5), (30, 35), (26, 32), (22.5, 30.5)], 1.8, seed=42)
    # the winding way up: lower flight -> east along the lawn -> flight to the terrace -> across it -> flight to the summit -> the door
    mp.lane([(22.4, 24.6), (26, 24.7), (30, 24.4), (31.5, 24.8)], 1.8, seed=43)
    mp.lane([(31.5, 20.6), (30.5, 19.4), (28, 18.6), (25.8, 17.6), (25.6, 16.4)], 1.7, seed=44)
    mp.lane([(25.6, 12.6), (24.6, 12.3), (22.6, 12.2)], 1.6, seed=48)
    mp.lane([(22.3, 24.2), (18.5, 22.2), (15.5, 19.8), (15.2, 19.2)], 1.6, seed=45)   # to the keeper's room
    mp.lane([(30.4, 19.8), (27.4, 19.6), (25.5, 19.2)], 1.3, seed=46)                    # to the woodshed
    mp.sea_set = sea
    mp.land = land
    # the cove (west): pebbles and the sea's leavings
    mp.kind(0, {(x, y) for x in range(4, 9) for y in range(27, 34) if (x, y) in land}, DIRT)


def stairs_n(mp, x0, x1, top_y, rows, kind="stone"):
    """mtlib's stairs() cuts two face rows; the new terraces' faces are `rows` high: the flight through all of them"""
    mp.stairs(x0, x1, top_y, kind)
    for x in range(x0, x1 + 1):
        for dy in range(3, rows + 1):
            c = (x, top_y + dy)
            col = 3 if x0 == x1 else 0 if x == x0 else 2 if x == x1 else 1
            mp.layers[0][c] = ("t", mtlib.A5(col, mtlib.STAIRS[kind]))
            mp.faces.pop(c, None)
            mp.solid.discard(c)
            mp.stair_cells.add(c)
            mp.alias[c] = mtlib.GROUND_OF[mp.style.get(mp.lv(*c), "grass")]
    for dy in range(3, rows + 1):                       # the face pieces beside the flight become its ends
        y = top_y + dy
        part = "L" if dy == rows else "M1" if dy % 2 == 0 else "M2"
        for x, end in ((x0 - 1, 2), (x1 + 1, 0)):
            f = mp.faces.get((x, y))
            if f and part == "L": mp.layers[0][(x, y)] = ("t", mtlib.a5(mtlib.FACE[mp.style.get(f[1], "grass")]["L"][end]))
            elif f: mp.layers[0][(x, y)] = ("t", mtlib.a5(mtlib.FACE_PLAIN["U" if part == "M1" else "L"][end]))


def buildings(mp):
    # the lighthouse on the Order's old watchtower foundation: one picture (PixelLab), its foot on (22, 9) = the door
    js = "Latarnia.door(this);"
    mp.picture(TOWER[0], TOWER[1], "!$Latarnia_Wieza", 0, 2, 0, name="Latarnia", priority=1, cmds=script_cmds(js), note="<Latarnia:wieza>")
    # (the picture is 2x since 2026-10-29: its whole base blocks, the doorway is the cell before it)
    for x in (21, 23):
        for y in range(8, 12): mp.solid.add((x, y))
    for y in range(8, 11): mp.solid.add((22, y))
    mp.solid |= {(20, 11), (24, 11)}
    mp.blocker(21, 8, 21, 11, name="Latarnia: mur")
    mp.blocker(23, 8, 23, 11, name="Latarnia: mur")
    mp.blocker(22, 8, 22, 10, name="Latarnia: mur")
    # the keeper's room: boards on a stone footing, the woodpile under a lean-to on the left
    rec = mp.house("latarnik", "Izba latarnika", 13, 15, 6, 2, 2, "shingle_dark", "boards_stone", door=2, windows=[(4, "wood_lit")],
                   chimney=4, chimney_style=4, lean="left", lean_fill="logs", interior="latarnik", hours=(0, 24))
    mp.izba = rec
    # a lantern by the room's door (a flame, at night)
    plib.Pod.light(mp, 17, 17, "!Decoration", 7, 2, 0, "Latarenka przy izbie", "<Light:130,90,62,22><LightWhen:night>", priority=2, through=True)


def things(mp):
    # the Order's watchtower post with the raven, the slab of the old floor, the bench over the sea
    mp.picture(28, 7, "!$Rock_Column", 0, 2, 0, name="Słup strażnicy zakonu", priority=1,
               cmds=script_cmds("Latarnia.look(this, \"slup\");"))
    mp.solid.add((28, 7))
    mp.picture(16, 11, "!$Rock_Slab", 0, 2, 0, name="Płyta strażnicy", priority=1, cmds=script_cmds("Latarnia.look(this, \"plyta\");"),
               note="<Occupy:right=1>")
    mp.solid |= {(16, 11), (17, 11)}
    mp.thing("bench", 15, 8)
    # the fog bell (rung every hour in a sea fog - Latarnia.js swings it)
    mp.picture(26, 9, "!$Ug_Bell", 0, 2, 0, name="Dzwon mgłowy", priority=1, cmds=script_cmds("Latarnia.look(this, \"dzwon\");"),
               note="<Latarnia:dzwon>")
    mp.solid.add((26, 9))
    # the woodshed and the firewood, the chopping block
    mp.thing("firewood", 29, 19)
    mp.thing("woodshed", 27, 21)
    mp.thing("chopping_block", 26, 19)
    mp.look(27, 18, "Drewutnia", "", priority=0, through=True, js="Latarnia.look(this, \"drewno\");")
    # the barrels of fish oil (the lighthouse's fuel)
    mp.thing("barrel_pile", 17, 21)
    mp.thing("barrels2", 19, 21)
    mp.look(18, 22, "Beczki tranu", "", priority=0, through=True, js="Latarnia.look(this, \"beczki\");")
    # the cove of the sea's leavings (west): what the storms throw up
    mp.thing("crate_open", 6, 30)
    mp.thing("barrel", 5, 32)
    mp.put(7, 33, "!$Logs_Big", name="Szczątki po sztormie", force=True)
    mp.look(6, 31, "Zatoczka szczątków", "", priority=0, through=True, js="Latarnia.wreckage(this);", note="<Latarnia:szczatki>")
    # rocks (Map003's: they give stones), flowers, pines (Map003's: they can be felled)
    for (x, y, r) in [(12, 6, "!$Rock_Flat"), (31, 20, "!$Rock_Mossy"), (11, 23, "!$Rock_Pile"), (33, 24, "!$Rock_Cracked"),
                      (35, 9, "!$Rock_Mound"), (10, 13, "!$Rock_Chunk")]:
        mp.put(x, y, r, force=True)
    for c in [(14, 10), (29, 17), (12, 20), (25, 23), (31, 9), (18, 13)]: mp.clump("white_fl", *c)
    for c in [(16, 28), (21, 35), (35, 33), (11, 36), (40, 34), (25, 37)]: mp.clump("fern", *c)
    for (x, y) in [(3, 36), (9, 37), (14, 36), (35, 32), (40, 37), (38, 29), (11, 29), (33, 28), (26, 36), (18, 38), (42, 31),
                   (6, 38), (36, 36), (16, 33), (42, 38)]:
        mp.pine(x, y)


def ways(mp):
    # west to Urwisko Kruków (Map157 54, 19-20 facing left) - only when that place is built (Wyspa.isReady), else a popup
    for k, y in enumerate((33, 34)):
        js = ("if (window.Wyspa && Wyspa.isReady(%d)) { $gamePlayer.reserveTransfer(%d, 54, %d, 4, 0); } else if (window.Latarnia) "
              "{ Latarnia.edge(this); }" % (CLIFFS, CLIFFS, 19 + k))
        e = plib.event("Przejście -> Urwisko Kruków", 0, y, None, 0, False, 1, script_cmds(js), "<Wyspa:przyladek_urwisko>", dfix=False)
        mp.add(0, y, e)
        mp.exits.append({"x": 0, "y": y, "to": [CLIFFS, 54, 19 + k, 4], "gate": "Wyspa.isReady(157)"})
    # down to the mountains (Map013 58, 11-13 facing left) - the contract's cells
    for k, x in enumerate((29, 30, 31)):
        plib.Pod.transfer(mp, x, 39, MOUNTAINS, 58, 11 + k, 4, "Przejście -> Góry i kamieniołom")
    for key, (x, y, d) in SPOTS.items():
        mp.spot_ev(key, x, y, d)
    for key, (x, y, d) in MARKS.items():
        mp.spot_ev(key, x, y, d)


def build159():
    mp = Cape()
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
    keep |= set(LAND_WEST) | set(LAND_SOUTH) | {(TOWER[0], TOWER[1] + 1)}
    base = 5 * W * H
    for (x, y) in paint:
        if (x, y) not in keep and data[base + y * W + x] == 0: data[base + y * W + x] = 2


# ================================================================================================ the interiors (tileset 8)
def interiors_lib():
    sys.path.insert(0, ROOT + "tools/wnetrza")
    sys.path.insert(0, ROOT + "tools/interiors")
    import rooms as RM          # noqa: F401
    import ilib
    from nslib import blank_page as bp

    class Room(ilib.Interior):
        def exit_to(self, x, out_xy, name, out_dir=2, se=True):
            tx, ty = out_xy
            cmds = ([{"code": 250, "indent": 0, "parameters": [dict(ilib.DOOR_SE)]}] if se else []) + \
                   [{"code": 201, "indent": 0, "parameters": [0, MAP_ID, tx, ty, out_dir, 0]}]
            e = {"name": name, "note": "", "pages": [bp(priority=0, trigger=1, cmds=cmds)]}
            self.add(x, self.H - 1, e)
            self.exits.append({"x": x, "y": self.H - 1, "town": [tx, ty], "landing": [x, self.H - 2, 8], "name": name})
            self.hooks.append(("exit", x, self.H - 1))
            self.spots.setdefault("landing", [x, self.H - 2, 8])
            return e

        def act(self, x, y, name, js, floor=True, note="", image=None, step=False):
            e = {"name": name, "note": note, "pages": [bp(priority=1 if floor else 0, trigger=0, cmds=script_cmds(js), through=not floor,
                                                         image=image, step=step, direction_fix=bool(image))]}
            self.add(x, y, e)
            if floor: self.solid.add((x, y))
            return e

        def look(self, x, y, name, text, floor=False):
            e = {"name": name, "note": "", "pages": [bp(priority=1 if floor else 0, trigger=0, cmds=script_cmds(
                "Tawerna.popup(%s, { color: \"info\" });" % json.dumps(text, ensure_ascii=False)), through=not floor)]}
            self.add(x, y, e)
            return e

        def stage_to(self, path, meta):
            return self.write(path, meta)

    return Room


B_WOOD, B_STONE, B_LOG = 24, 16, 33
W_PLANKS, W_LOGS, W_RAW = 48, 59, 71
F_DARK, F_PLANKS, F_FLAGS = 83, 84, 96
NOTE_IZBA = "<Dust:off>\n<Dark:on>\n<DayNight:off>\n<Zoom:1.5>\n<DarkDay:85>\n<DarkNight:185>"
NOTE_LATERNA = "<Dust:off>\n<Dark:on>\n<DayNight:off>\n<Zoom:1.5>\n<DarkDay:40>\n<DarkNight:170>\n<Latarnia:laterna>"


def build160(front):
    """the keeper's room: his bed, the table with the Book of Fogs, the stove, jars of oil, the coat on a peg"""
    Room = interiors_lib()
    from rooms import (window2, candle_on, on_top, shelf_tall, table_h, stool, rug_k, doormat, fireplace_pic, barrel, bed, hang_pole,
                       RUG_BROWN)
    import houselib as HL
    W_, H_ = 13, 10
    mp = Room(IZBA, W_, H_, "Izba latarnika", "latarnik", note=NOTE_IZBA)
    DOOR_X = 6
    mp.shell([("Izba", [(1, 4, 11, 8)], F_DARK, W_PLANKS)], border=B_WOOD, exit_x=DOOR_X)
    mp.restyle_face(mp.rect(9, 1, 11, 3), W_RAW)       # (the stone footing behind the stove)
    mp.shadows()
    g = "Izba"
    window2(mp, 3, 1, curtain=None, length=100)
    window2(mp, 7, 1, curtain=None, length=100)
    hang_pole(mp, 5, 2, "fish", name="Suszone dorsze")
    # ---- his bed and chest (left), the coat on a peg
    bed(mp, (9, 13), 1, 4, group=g, kind="łóżko")
    HL.plain_chest(mp, 1, 7, group=g, name="Skrzynia Bazylego")
    mp.look(2, 4, "Płaszcz na kołku", "Drugi płaszcz z woskowanego płótna. Czarny od sadzy, pachnie tranem i dymem.")
    # ---- the table with the Book of Fogs, a candle, a stool
    table_h(mp, 4, 5, 2, style=6, group=g + " stół")
    on_top(mp, 5, 5, "D", 7, 13)
    candle_on(mp, 4, 5)
    mp.act(4, 6, "Księga mgieł", "Latarnia.book(this);", note="<Latarnia:ksiega>")
    stool(mp, 6, 6, group=g)
    # ---- the stove (a flame) on the stone footing, firewood
    fireplace_pic(mp, 10, 4, kind=2, group=g)
    HL.thing(mp, 11, 4, "!Decoration_static", 3, 8, 2, "Drewno na opał", kind="drewno", group=g)
    # ---- the oil: jars on a shelf, a barrel
    shelf_tall(mp, 8, 4, "jars")
    mp.look(8, 5, "Słoje tranu", "Słoje z tranem, każdy podpisany węglem: dzień i ryba. Najstarszy sprzed sztormu.", floor=False)
    barrel(mp, 11, 7, "plain")
    rug_k(mp, 5, 7, 7, 7, RUG_BROWN)
    doormat(mp, DOOR_X, 8)
    mp.exit_to(DOOR_X, front, "Drzwi -> Przylądek z latarnią")
    return mp


def build161(front):
    """the lantern room on top of the tower: windows all round, the fire basket, the lens, the fog bell's rope"""
    Room = interiors_lib()
    from rooms import (window2, on_top, rug_k, barrel, RUG_MAT)
    import houselib as HL
    W_, H_ = 11, 9
    mp = Room(LATERNA, W_, H_, "Laterna", "laterna", note=NOTE_LATERNA)
    DOOR_X = 5
    mp.shell([("Laterna", [(1, 4, 9, 7)], F_FLAGS, W_RAW)], border=B_STONE, exit_x=DOOR_X)
    mp.shadows()
    g = "Laterna"
    for x in (2, 4, 6, 8):
        window2(mp, x, 1, curtain=None, length=70, style="arch")
    # the fire basket in the middle (a flame - !Flame's brazier) and the lens before it, towards the sea
    HL.thing(mp, 5, 5, "!Flame", 2, 2, 0, "Kosz z ogniem", kind="kosz", group=g, step=True,
             note="<Light:260,255,150,70><LightWhen:night><Latarnia:kosz>")
    mp.act(5, 4, "Soczewka", "Latarnia.lens(this);", note="<Latarnia:soczewka>",
           image={"tileId": 0, "characterName": "!$Latarnia_Soczewka", "direction": 2, "pattern": 0, "characterIndex": 0}, step=True)
    HL.thing(mp, 7, 6, "!Decoration_static", 3, 8, 2, "Drewno na opał", kind="drewno2", group=g)
    # the rope of the fog bell, the oil and the firewood for the night
    mp.look(9, 4, "Linka dzwonu", "Linka biegnie przez otwór w murze, w dół do dzwonu mgłowego. Bazyli ciągnie ją co godzinę, kiedy jest mgła.",
            floor=False)
    barrel(mp, 1, 4, "plain")
    mp.look(1, 5, "Beczułka tranu", "Beczułka tranu na noc. Śmierdzi rybą i dymem.", floor=False)
    HL.thing(mp, 9, 7, "!Decoration_static", 3, 8, 2, "Drewno na opał", kind="drewno", group=g)
    rug_k(mp, 4, 7, 6, 7, RUG_MAT)
    mp.exit_to(DOOR_X, front, "Schody -> w dół, przed drzwi latarni")
    return mp


# ================================================================================================ write
def stage159(mp, izba_landing):
    data = mp.resolve()
    events = mp.build_events()
    door_id = None
    for e in events:
        if e and e["name"] == "Drzwi: Izba latarnika":
            door_id = e["id"]
            e["pages"][0]["list"] = script_cmds("Latarnia.izbaDoor(this, %d, %d);" % tuple(izba_landing)) + \
                [{"code": 0, "indent": 0, "parameters": []}]
            e["pages"][0]["trigger"] = 1
    assert door_id, "no door of the keeper's room"
    paint_regions(data, events)
    props = dict(mp.props)
    props["bgs"] = {"name": "Sea", "pan": 0, "pitch": 90, "volume": 50}
    props["autoplayBgs"] = True
    props["autoplayBgm"] = False
    props["bgm"] = {"name": "", "pan": 0, "pitch": 100, "volume": 90}
    os.makedirs(OUT_DATA, exist_ok=True)
    write_map(OUT_DATA + "Map159.json", props, data, events)
    tower_id = next(e["id"] for e in events if e and e["name"] == "Latarnia")
    meta = {"id": MAP_ID, "size": [W, H], "spots": mp.spots, "exits": mp.exits, "tower": list(TOWER), "tower_event": tower_id,
            "izba_door": list(IZBA_DOOR), "izba_event": door_id, "land_west": LAND_WEST, "land_south": LAND_SOUTH, "looks": mp.looks,
            "lights": mp.lights}
    os.makedirs(STAGING, exist_ok=True)
    with open(os.path.join(STAGING, "Map159_meta.json"), "wb") as f:
        f.write(json.dumps(meta, ensure_ascii=False, indent=1).encode("utf-8"))
    return {"width": W, "height": H, "data": data, "events": events, "tilesetId": 11}, door_id


def main():
    render = "--render" in sys.argv
    mp = build159()
    izba = build160((IZBA_DOOR[0], IZBA_DOOR[1] + 1))
    laterna = build161((TOWER[0], TOWER[1] + 1))
    os.makedirs(OUT_DATA, exist_ok=True)
    os.makedirs(STAGING, exist_ok=True)
    n160 = izba.stage_to(OUT_DATA + "Map160.json", os.path.join(STAGING, "Map160_meta.json"))
    n161 = laterna.stage_to(OUT_DATA + "Map161.json", os.path.join(STAGING, "Map161_meta.json"))
    land = izba.exits[0]["landing"]
    m159, door_id = stage159(mp, (land[0], land[1]))
    # the walking check: from the west landing everything that matters is reached
    flags = mtlib.load_json(ROOT + "data/Tilesets.json")[11]["flags"]
    seen = mtlib.reach(m159, LAND_WEST[0], flags)
    need = {"drzwi latarni (przed)": (TOWER[0], TOWER[1] + 1), "drzwi izby (przed)": (IZBA_DOOR[0], IZBA_DOOR[1] + 1),
            "zejście w góry": LAND_SOUTH[1], "drewutnia": SPOTS["drewutnia"][:2], "dzwon": MARKS["lat_dzwon"][:2],
            "zatoczka": MARKS["lat_oboz"][:2], "słup": (28, 8)}
    bad = [k for k, c in need.items() if tuple(c) not in seen]
    print("Map159 Przylądek z latarnią: %dx%d, %d zdarzeń; drzwi izby = zdarzenie %d" % (W, H, len(m159["events"]) - 1, door_id))
    print("Map160 Izba latarnika: %dx%d, %d zdarzeń; lądowanie %s" % (izba.W, izba.H, n160, land))
    print("Map161 Laterna: %dx%d, %d zdarzeń; lądowanie %s" % (laterna.W, laterna.H, n161, laterna.exits[0]["landing"]))
    print("dojście z Urwiska: %s" % ("WSZĘDZIE" if not bad else "BRAK: " + ", ".join(bad)))
    if render:
        mtlib.render(m159, os.path.join(STAGING, "Map159.png"))
        import mzrender as R
        sys.path.insert(0, ROOT + "tools/interiors")
        for mid in (160, 161):
            m = json.load(open(OUT_DATA + "Map%d.json" % mid, encoding="utf-8"))
            S = R.Sheets(8); S.lenient = True
            R.render(m, S).convert("RGB").save(os.path.join(STAGING, "Map%d.png" % mid))
        print("podglądy: tools/latarnia/staging/Map159.png, Map160.png, Map161.png")
    return 0 if not bad else 1


if __name__ == "__main__":
    sys.exit(main())
