# python tools/urwisko/build.py [--render]
#   -> tools/miejsca_wyspy/staging_B/data/Map157.json   (pełny plik mapy do instalacji przez koordynatora)
#   -> tools/urwisko/staging/Map157_meta.json           (miejsca, wyjścia, żerdzie, kruki - dla Kruk.js i testu)
#   (--render: tools/urwisko/staging/Map157.png - podgląd 1:1)
#
# PAKIET B "Urwisko Kruków" (docs/miejsca_wyspy/PAKIETY.md, koncepcja: docs/miejsca_wyspy/KONCEPCJA.md punkt 4, szkic zatwierdzony
# przez użytkownika 2026-10-16: docs/miejsca_wyspy/rzut_urwisko.png). Mapa powstaje z tego samego szkicu (tools/miejsca_wyspy/
# szkice.py urwisko(): tarasy MMap, mur twierdzy A4, baszty autora, morze A1 jak na przystani), z prawdziwymi zdarzeniami:
#   Map157 "Urwisko Kruków" 56 x 36, tileset 11, <Clouds:on><Farm:off><Water:salt><Camp:off> (morze słone i czerwone - CzerwonaWoda;
#     bez losowych obozów Humans: obóz kopaczy stawia Kruk.js). Na górze morze, pod nim klif z resztkami muru twierdzy i dwiema
#     basztami (w tym kruczarnia), niżej taras ze ścieżką, na dole zbocze wzgórza tawerny.
#   przejścia (kontrakt WyspaData.LINKS): lewa krawędź (0, 19-20) -> pustelnia 155 (46, 17-18); prawa (55, 19-20) -> przylądek 159
#     (1, 33-34) tylko gdy Wyspa.isReady(159), inaczej popup; lądowania (1, 19-20) i (54, 19-20)
#   krata przelewu (41, 15): "Przelew cysterny", !Quest_Places 0/2/0; strona 1: popup (Kruk.look), strona 2 (przełącznik 17
#     Wyspa_KrataUrwisko, otwiera pakiet F od środka) -> cysterna 167 (33, 3); lądowanie z cysterny (41, 16)
#   znaczniki "Miejsce: rynna_1..4" (K53, logika w pakiecie F), "Miejsce: kruczarnia", "Miejsce: oboz" ...
#   drzewa i skały to zdarzenia z Map003 (zasada użytkownika: każdy obiekt to zdarzenie); żerdzie zakonu w kruczarni to obrazki
#   (img/system/Kruk_Grzeda_Stara.png rysuje Kruk.js na znacznikach "Miejsce: zerdz_N"); światło: tylko ognisko kopaczy nocą
#   (wstawia Kruk.js)
# Nic tu nie zapisuje do data/ (instaluje koordynator).
import os, sys, json
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..")).replace("\\", "/") + "/"
for p in ("tools/miejsca_wyspy", "tools/newstart", "tools/town", "tools/podgrodzie", "tools/mountains"):
    if ROOT + p not in sys.path: sys.path.insert(0, ROOT + p)
import szkic_lib as SL                                                          # noqa: E402
from szkic_lib import (Szkic, DIRT, STONES, TUFTS, COBBLE, PEBBLES, DRY, noise)  # noqa: E402
import plib                                                                     # noqa: E402
import mtlib                                                                    # noqa: E402
from nslib import write_map                                                     # noqa: E402

OUT_DATA = ROOT + "tools/miejsca_wyspy/staging_B/data/"
STAGING = os.path.join(HERE, "staging")
MAP_ID, HERMITAGE, CAPE, CISTERN = 157, 155, 159, 167
W, H = 56, 36
NOTE = "<Clouds:on>\n<Farm:off>\n<Water:salt>\n<Camp:off>\n<Urwisko:mapa>"
GRATE = (41, 15)
LAND_WEST = [(1, 19), (1, 20)]
LAND_EAST = [(54, 19), (54, 20)]
LAND_GRATE = (41, 16)
# Kruk.js reads these markers (Miejsce: <key>): where the young raven sits, where the hero feeds it, the Order's old perches, the
# strangers' camp, the gutters of K53 (package F), the raven's perches on the ruin (the ambient flock)
MARKERS = {
    "kruczarnia": (26, 12, 8),       # the feeding place: in front of the ruined tower, facing up
    "zerdz_1": (23, 11, 2),          # the Order's old perches (pictures drawn by Kruk.js); the young raven sits on zerdz_2
    "zerdz_2": (28, 11, 2),
    "oboz": (47, 22, 2),             # the strangers' night fire (Kruk.js)
    "oboz_kop": (48, 9, 2),          # where one of them digs in the rubble
    "rynna_1": (36, 9, 2), "rynna_2": (38, 9, 2), "rynna_3": (41, 10, 2), "rynna_4": (41, 12, 2),
    "zejscie": (9, 35, 2),           # the path's end at the slope (no way on: the town's walls)
}


def look_js(what):
    return [{"code": 355, "indent": 0, "parameters": ["if (window.Kruk) Kruk.look(this, %s);" % json.dumps(what)]}]


class Cliffs(Szkic):
    def __init__(self):
        Szkic.__init__(self, MAP_ID, W, H, "Urwisko Kruków", NOTE, seed=157)
        self.looks = []

    def look(self, x, y, name, what, priority=1, through=False, char="", index=0, d=2, p=0, note=""):
        img = plib.pic(char, index, d, p) if char else None
        if char: self.taken.add((x, y))
        e = plib.event(name, x, y, img, priority, through, 0, look_js(what), note)
        self.add(x, y, e)
        self.looks.append({"name": name, "x": x, "y": y, "what": what})
        return e


def terrain(mp):
    """the approved sketch's ground (tools/miejsca_wyspy/szkice.py urwisko())"""
    sea = set()
    for x in range(W):
        top = 4 + (1 if noise(x // 3, 1, 21) > 0.55 else 0) + (1 if 18 < x < 27 else 0)
        for y in range(0, top): sea.add((x, y))
    l3 = {(x, y) for x in range(0, W) for y in range(4, 14)} - sea - {(x, y) for x in range(0, 6) for y in range(10, 14)} \
        - {(x, y) for x in range(49, W) for y in range(10, 14)}
    l2 = {(x, y) for x in range(0, W) for y in range(4, 26)} - sea
    mp.raise_to(l2, 1)
    mp.raise_to(l3, 2)
    mp.terraces()
    mp.stairs(29, 30, 13, "stone")
    mp.stairs(8, 10, 25, "moss")
    mp.sea(sea)
    mp.deep({(x, y) for (x, y) in sea if y < 2})
    mp.sea_set = sea
    # the walls of the old fortress on the cliff's edge (their face seen from the land) and two towers: the nest tower and the
    # ravenry (kruczarnia)
    mp.wall_run(2, 13, 5, broken=(6, 7))
    mp.wall_run(16, 24, 6, broken=(20,))
    mp.wall_run(34, 47, 5, broken=(39, 40, 41))
    mp.crenels(2, 5, 5); mp.crenels(16, 19, 6); mp.crenels(42, 47, 5)
    mp.tower(14, 4)
    mp.tower(25, 5)
    mp.town_prop("tower_ruin_top", 26, 8, label="Kruczarnia (ruina baszty)")
    mp.town_prop("tower_ruin_top", 15, 7, label="Baszta z gniazdami")
    for (x, y) in [(6, 7), (7, 8), (20, 8), (39, 7), (40, 8), (41, 7)]:
        mp.clump("rock" if (x + y) % 2 else "stones", x, y)
    # the gutters of the Order cut in the rock, down to the overflow (K53 - package F cleans them)
    mp.kind(0, {(41, y) for y in range(9, 14)} | {(x, 9) for x in range(36, 42)}, COBBLE)
    # the paths: from the hermitage along the lower terrace east, up the stairs to the ruins, down the slope
    mp.lane([(-0.5, 19.5), (10, 19.8), (20, 20.2), (30, 19.6), (40, 19.4), (50, 19.5), (56.5, 19.5)], 2.2, seed=31)
    mp.lane([(29.5, 18.5), (29.5, 16)], 2.0, seed=32)
    mp.lane([(29.5, 12.5), (27.5, 11.2), (20, 10.5), (12, 10.2)], 1.8, seed=33)
    mp.lane([(29.5, 12.5), (33, 11), (38, 10.5), (44, 11)], 1.6, seed=34)
    mp.lane([(41, 18.5), (41, 16.2)], 1.4, seed=37)                       # to the grate
    mp.lane([(9, 21), (9, 24.6)], 2.0, seed=35)
    mp.lane([(9, 28), (9, 35.5)], 2.0, seed=36)
    mp.lane([(44, 20.4), (47, 21.6), (49, 22.2)], 1.6, seed=38)          # the trodden patch of the camp
    mp.overlay({c for c in mp.all if mp.lv(*c) == 2}, STONES, 0.18, 7)
    mp.overlay({c for c in mp.all if mp.lv(*c) == 1}, TUFTS, 0.10, 8)
    mp.overlay({c for c in mp.all if mp.lv(*c) == 0}, DRY, 0.06, 9)
    # the strangers' camp: a patch of dug-up earth by the rubble
    mp.overlay({(x, y) for x in range(45, 50) for y in range(21, 24)}, PEBBLES, 0.35, 10)


def ravenry(mp):
    """the kruczarnia: the ruined tower with the Order's perches, nests in the rubble; the stones with ravens; the grate"""
    for key, (x, y, d) in MARKERS.items():
        mp.marker(x, y, key, d)
    # the perches are pictures (Kruk.js) - their cells closed here
    for key in ("zerdz_1", "zerdz_2"):
        x, y, _ = MARKERS[key]
        mp.blocker(x, y, x, y, name="Żerdź zakonu: podstawa")
    # the feeding place: the action button in front of the tower (Kruk.feed via Kruk.look "kruczarnia")
    mp.look(26, 11, "Kruczarnia", "kruczarnia", priority=1, through=False)
    mp.look(15, 11, "Baszta z gniazdami", "baszta", priority=1, through=False)
    # the nests in the rubble of the walls (img/characters/!$Urwisko_Gniazda.png: patterns 0, 1, 2)
    for (x, y, p) in [(12, 9, 0), (17, 9, 1), (22, 9, 2), (31, 8, 0), (44, 8, 1), (3, 9, 2)]:
        mp.look(x, y, "Gniazdo kruków", "gniazdo", priority=1, char="!$Urwisko_Gniazda", p=p)
        mp.solid.add((x, y))
    # the stones with the raven in the rubble (place 8): rubble pictures, looked at (not mined - the Order's carved stones)
    for (x, y, k) in [(5, 9, 1), (37, 8, 2), (47, 9, 3)]:
        mp.look(x, y, "Gruz z kamieniem z krukiem", "kamien%d" % k, priority=1, char="!$Rock_Rubble")
        mp.solid.add((x, y))
    # the overflow of the cistern: an arch with a grate and a raven (the picture is already there: !Quest_Places)
    page1 = plib.event("Przelew cysterny", GRATE[0], GRATE[1], plib.pic("!Quest_Places", 0, 2, 0), 1, False, 0, look_js("krata"), "")["pages"][0]
    js2 = ("if (window.Wyspa && !Wyspa.isReady(%d)) { if (window.Kruk) Kruk.look(this, \"krata\"); } else { "
           "AudioManager.playSe({ name: \"Door5\", volume: 70, pitch: 80, pan: 0 }); $gamePlayer.reserveTransfer(%d, 33, 3, 2, 0); }" % (CISTERN, CISTERN))
    page2 = plib.event("Przelew cysterny", GRATE[0], GRATE[1], plib.pic("!Quest_Places", 0, 2, 0), 1, False, 0,
                       [{"code": 355, "indent": 0, "parameters": [js2]}], "")["pages"][0]
    page2["conditions"]["switch1Valid"] = True
    page2["conditions"]["switch1Id"] = 17
    e = {"name": "Przelew cysterny", "note": "<Wyspa:krata_urwisko>", "pages": [page1, page2]}
    mp.add(GRATE[0], GRATE[1], e)
    mp.exits.append({"x": GRATE[0], "y": GRATE[1], "to": [CISTERN, 33, 3, 2], "gate": "przełącznik 17"})


def nature(mp):
    # pines (Map003's: they can be felled), rocks, dry bushes, a dead trunk
    for (x, y) in [(3, 18), (15, 17), (22, 23), (36, 16), (45, 17), (52, 17), (2, 23), (17, 22), (54, 23),
                   (13, 30), (20, 33), (28, 29), (35, 32), (42, 30), (49, 33), (3, 31), (24, 34), (53, 29), (38, 27)]:
        mp.pine(x, y)
    for (x, y, r) in [(33, 22, "!$Rock_Mossy"), (6, 21, "!$Rock_Flat"), (44, 16, "!$Rock_Chunk"), (16, 29, "!$Bush_Bare_Big"),
                      (31, 31, "!$Bush_Bare_Wide"), (46, 27, "!$Bush_Bare_Thicket"), (12, 22, "!$Rock_Column"), (37, 23, "!$Rock_Rubble"),
                      (24, 17, "!$Rock_Long"), (50, 25, "!$Boulder_A"), (19, 23, "!$Bush_Bare_Hedge"), (41, 23, "!$Trunk_Dead")]:
        mp.put(x, y, r, force=True)
    for c in [(5, 27), (18, 28), (27, 33), (33, 27), (44, 33), (50, 29), (6, 33)]:
        mp.clump("fern", *c)
    mp.clump("stones", 2, 8); mp.clump("rock", 32, 8); mp.clump("stones", 45, 7); mp.clump("rock", 50, 8)


def ways(mp):
    # west to the hermitage (Map155 46, 17-18 facing left)
    for k, y in enumerate((19, 20)):
        plib.Pod.transfer(mp, 0, y, HERMITAGE, 46, 17 + k, 4, "Przejście -> Pustelnia na klifie")
    # east to the cape (Map159 1, 33-34 facing right) - only when that place is built (Wyspa.isReady)
    for k, y in enumerate((19, 20)):
        js = ("if (window.Wyspa && Wyspa.isReady(%d)) { $gamePlayer.reserveTransfer(%d, 1, %d, 6, 0); } else if (window.Kruk) "
              "{ Kruk.edge(this, \"wschod\"); }" % (CAPE, CAPE, 33 + k))
        e = plib.event("Przejście -> Przylądek z latarnią", 55, y, None, 0, False, 1, [{"code": 355, "indent": 0, "parameters": [js]}],
                       "<Wyspa:urwisko_przyladek>", dfix=False)
        mp.add(55, y, e)
        mp.exits.append({"x": 55, "y": y, "to": [CAPE, 1, 33 + k, 6], "gate": "Wyspa.isReady(159)"})
    # the slope's end: the town's walls (Map008 unchanged) - no way on, a popup
    for x in (8, 9, 10):
        e = plib.event("Zejście na zbocze", x, 35, None, 0, False, 1,
                       [{"code": 355, "indent": 0, "parameters": ["if (window.Kruk) Kruk.edge(this, \"zbocze\");"]}], "", dfix=False)
        mp.add(x, 35, e)


def build():
    mp = Cliffs()
    terrain(mp)
    ravenry(mp)
    nature(mp)
    ways(mp)
    return mp


def paint_regions(data, events):
    import paint_layers as PL
    flags = json.loads(open(ROOT + "data/Tilesets.json", "rb").read().decode("utf-8"))[11]["flags"]
    m = {"width": W, "height": H, "data": data, "events": events, "_id": MAP_ID}
    paint, keep, why = PL.plan(m, flags)
    keep |= set(LAND_WEST) | set(LAND_EAST) | {LAND_GRATE}
    base = 5 * W * H
    for (x, y) in paint:
        if (x, y) not in keep and data[base + y * W + x] == 0: data[base + y * W + x] = 2


def stage(mp):
    data = mp.resolve()
    events = mp.build_events()
    paint_regions(data, events)
    props = dict(mp.props)
    props["bgs"] = {"name": "Sea", "pan": 0, "pitch": 100, "volume": 45}
    props["autoplayBgs"] = True
    props["autoplayBgm"] = False
    props["bgm"] = {"name": "", "pan": 0, "pitch": 100, "volume": 90}
    os.makedirs(OUT_DATA, exist_ok=True)
    write_map(OUT_DATA + "Map157.json", props, data, events)
    meta = {"id": MAP_ID, "size": [W, H], "markers": {k: list(v) for k, v in MARKERS.items()}, "exits": mp.exits, "grate": list(GRATE),
            "land_west": LAND_WEST, "land_east": LAND_EAST, "land_grate": list(LAND_GRATE), "looks": mp.looks}
    os.makedirs(STAGING, exist_ok=True)
    with open(os.path.join(STAGING, "Map157_meta.json"), "wb") as f:
        f.write(json.dumps(meta, ensure_ascii=False, indent=1).encode("utf-8"))
    return {"width": W, "height": H, "data": data, "events": events, "tilesetId": 11}


def main():
    mp = build()
    m = stage(mp)
    flags = mtlib.load_json(ROOT + "data/Tilesets.json")[11]["flags"]
    seen = mtlib.reach(m, LAND_WEST[0], flags)
    need = {"wyjście na wschód": (54, 19), "kruczarnia (przed)": (26, 12), "krata (przed)": LAND_GRATE, "obóz": (47, 22),
            "zejście": (9, 34), "baszta": (15, 12), "rynny": (38, 10)}
    bad = [k for k, c in need.items() if c not in seen]
    print("Map157 Urwisko Kruków: %dx%d, %d zdarzeń" % (W, H, len(m["events"]) - 1))
    print("dojście od pustelni: %s" % ("WSZĘDZIE" if not bad else "BRAK: " + ", ".join(bad)))
    if "--render" in sys.argv:
        mtlib.render(m, os.path.join(STAGING, "Map157.png"))
        print("podgląd: tools/urwisko/staging/Map157.png")
    return 0 if not bad else 1


if __name__ == "__main__":
    sys.exit(main())
