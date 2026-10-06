# The two new small maps of the quest places (tools/quest_places/build.py stages and installs them; docs/miasta_miejsca_zadan.md):
#   Map118 "Dno studni"       - the bottom of the market well (K26 / W1)
#   Map119 "Archiwum zakonu"  - the order's archive under the knights' garden (W2)
# Both on tileset 8 "Wilu Fantasy Interior" like the town interiors (tools/interiors/ilib.py: the room shell with 3-row wall faces,
# the installed tileset-8 passage flags, RoomLighting notes), with the pictures of !Quest_Places (tools/quest_places/art.py).
# Nothing here writes data/.
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..")).replace("\\", "/") + "/"
sys.path.insert(0, os.path.join(ROOT, "tools", "interiors"))
from ilib import *          # noqa: F401,F403  Interior, the cottage / tavern macros, blank_page, B C D E A5

SHEET = "!Quest_Places"     # tools/quest_places/art.py
ALTAR = "!$Altar"           # the Winlu Interior Remaster lectern (copied into img/characters by art.py)
LINA = 93                   # the item "Lina"
TOWN, MANOR, WELL, ARCHIVE = 8, 24, 118, 119

# ---- tileset-8 kinds (tools/tavern/catalog.json; as tools/interiors/build_interiors.py)
B_STONE, W_RAW = 16, 71
F_COBBLE, F_SLATE = 96, 117
DUST = 23                   # the A2 "dust / shade" film (layer 1, see-through)

# ---- frames of !Quest_Places (art.py): key -> (index, direction, pattern)
ART = {
    "kanal": (0, 2, 0), "kaluza": (0, 2, 1), "pierscionek": (0, 2, 2),
    "lina": (0, 4, 0), "mech_1": (0, 4, 1), "mech_2": (0, 4, 2),
    "kamienie": (0, 6, 0), "mech_dol": (0, 6, 1), "wiadro_stare": (0, 6, 2),
    "plyta_otwarta": (1, 2, 0),
    "pompa": (2, 2, 0), "stol_ogrodnika": (2, 2, 1), "drzewko_pomaranczy": (2, 2, 2),
    "furtka_zamknieta": (2, 4, 0), "furtka_otwarta": (2, 4, 1), "drzwi_oranzerii": (2, 4, 2),
    "okno_oranzerii": (2, 6, 0), "okno_oranzerii_l": (2, 6, 1),
}

# ---- the ends of the new transfers (the other ends are on Map008, build.py)
WELL_DOWN_AT = (25, 34)     # Map008: the descent event on the well's east stones (24-25 x 32-35); seen from (26,34) / (25,33)
WELL_OUT = (26, 34, 4)      # Map008: where one comes out of the well (beside it, facing it)
WELL_LAND = (7, 6, 2)       # Map118: where one lands at the bottom (below the rope, facing down)
SLAB_AT = (6, 12)           # Map008: the slab in the knights' garden (the axis, three cells south of the sword in the stone)
SLAB_OUT = (6, 13, 2)       # Map008: where one comes up (just south of the slab, facing down)
ARCH_LAND = (2, 4, 2)       # Map119: the bottom of the stairs, facing down

WELL_NOTE = "<Dust:off>\n<Dark:on>\n<DayNight:off>\n<Zoom:1.5>\n<DarkDay:150>\n<DarkNight:205>\n<Ambience:cave>"
ARCHIVE_NOTE = "<Dust:on>\n<Dark:on>\n<DayNight:off>\n<Zoom:1.5>\n<DarkDay:175>\n<DarkNight:175>\n<Ambience:interior>"


def marker(mp, key, x, y, d=2):
    """an invisible spot for the quest logic: "Miejsce: <key>", below the characters, through, no picture, no commands; the
    page's image direction = the way one faces there (TownLife's convention)"""
    e = {"name": "Miejsce: %s" % key, "note": "", "pages": [blank_page(priority=0, through=True, image={"direction": d})]}
    mp.add(x, y, e)
    mp.spots[key] = [x, y, d]
    return e


def apic(mp, key, x, y, name, priority=1, through=None, note="", trigger=0, cmds=None, step=False):
    """a frame of our sheet as an event; priority 1 (same as characters) blocks its cell unless through"""
    i, d, p = ART[key]
    thr = (priority != 1) if through is None else through
    return mp.ev(x, y, SHEET, i, d, p, name=name, priority=priority, through=thr, step=step, note=note, trigger=trigger, cmds=cmds)


def say_choice(question, yes, no, then, indent=0):
    """the game's yes / no (as the beds' "Położyć się spać?"): a message without a face - SpeechBubbles puts it over the hero -
    and Show Choices beside it; `then` runs on yes"""
    i = indent
    out = [{"code": 101, "indent": i, "parameters": ["", 0, 0, 2, ""]},
           {"code": 401, "indent": i, "parameters": [question]},
           {"code": 102, "indent": i, "parameters": [[yes, no], 1, 0, 2, 0]},
           {"code": 402, "indent": i, "parameters": [0, yes]}]
    out += [dict(c, indent=i + 1 + c.get("indent", 0)) for c in then]
    out += [{"code": 0, "indent": i + 1, "parameters": []},
            {"code": 402, "indent": i, "parameters": [1, no]},
            {"code": 0, "indent": i + 1, "parameters": []},
            {"code": 404, "indent": i, "parameters": []}]
    return out


def se(name, vol=80, pitch=100):
    return {"code": 250, "indent": 0, "parameters": [{"name": name, "volume": vol, "pitch": pitch, "pan": 0}]}


def transfer(mid, x, y, d, fade=0):
    return {"code": 201, "indent": 0, "parameters": [0, mid, x, y, d, fade]}


# =================================================================================================== Map118 Dno studni
def dno_studni():
    """the bottom of the market well: the shaft widened by the order into a small chamber of raw stone, damp and mossy; a
    shallow puddle under the light from the shaft (a picture - no water tile: nothing to drink, nothing to draw), the old
    canal's arch in the north wall walled up, a raven carved in its keystone, an iron grate at its foot (water heard behind
    it - the map's sound); the rope from the windlass hanging beside the puddle; old stones and a lost bucket"""
    W, H = 11, 9
    mp = Interior(WELL, W, H, "Dno studni", "dno_studni", note=WELL_NOTE)
    mp.shell([("Dno", [(1, 4, 9, 7)], F_COBBLE, W_RAW)], border=B_STONE)
    mp.shadows()
    # the damp floor: the dark A2 film from the grate down to the puddle and round it, in the corners
    mp.kind(1, {(5, 4), (4, 5), (5, 5), (6, 5), (3, 6), (4, 6), (5, 6), (6, 6), (7, 6), (4, 7), (5, 7), (6, 7), (1, 4), (9, 4), (9, 7)}, DUST)
    g = "Dno"
    # ---- the canal arch (3 wide, the whole wall face): the raven in its keystone, the grate at its foot
    apic(mp, "kanal", 5, 3, "Zamurowany kanał zakonu (kruk, krata)", priority=0)
    mp.rec("kanał", "wallitem", {(4, 3), (5, 3), (6, 3)}, g, x=5, y=3, event=True)
    # ---- damp and moss on the wall, rubble and the lost bucket on the floor, cobwebs high in the corners
    apic(mp, "mech_1", 2, 3, "Wilgoć i mech", priority=0)
    apic(mp, "mech_2", 8, 3, "Wilgoć i mech", priority=0)
    apic(mp, "mech_2", 3, 3, "Wilgoć", priority=0)
    apic(mp, "kamienie", 1, 6, "Kamienie", priority=1)
    apic(mp, "kamienie", 9, 4, "Kamienie", priority=1)
    apic(mp, "wiadro_stare", 8, 7, "Stare wiadro", priority=1)
    apic(mp, "mech_dol", 2, 7, "Mech", priority=0)
    apic(mp, "mech_dol", 7, 4, "Mech", priority=0)
    mp.piece("D", 13, 7, 1, 1, 1, 1, z=3, group=g, kind="pajęczyna", solid_rows=[])
    mp.piece("D", 15, 7, 1, 1, 9, 1, z=3, group=g, kind="pajęczyna", solid_rows=[])
    # ---- the puddle (a picture under the characters) in the middle, the light of the shaft over it
    apic(mp, "kaluza", 5, 6, "Płytka kałuża", priority=0)
    mp.light(5, 1, "<LightCone:length=230,angle=12,dir=90,width=56,anchor=top,offsety=-40,blur=12,dust=14,dustsize=1,r=110,g=120,b=140,when=day>",
             "światło z szybu (dzień)")
    mp.light(5, 6, "<Light:170,60,66,80><LightSoft><LightWhen:day>", "światło z szybu (plama)")
    mp.light(5, 6, "<Light:96,22,28,46><LightSoft><LightWhen:night>", "księżyc w szybie")
    # ---- the rope: the way up (action button: a question, then Map008 beside the well)
    up = say_choice("Wspiąć się po linie na górę?", "Wspiąć się", "Zostać",
                    [se("Move3", 80, 90), transfer(TOWN, WELL_OUT[0], WELL_OUT[1], WELL_OUT[2])])
    apic(mp, "lina", 7, 5, "Lina (wyjście na górę)", priority=1, cmds=up)
    mp.rec("lina", "floorprop", {(7, 5)}, g, x=7, y=5, event=True)
    # ---- the quest spots
    marker(mp, "lina", 7, 5, 2)
    marker(mp, "pierscionek", 5, 6, 2)
    marker(mp, "krata_kruk", 5, 4, 8)
    mp.spot("landing", WELL_LAND[0], WELL_LAND[1], WELL_LAND[2])
    # the sound: the town's music stops down here; Atmosphere.js plays its cave bed (dripping water) for <Ambience:cave>
    mp.props.update({"autoplayBgm": True, "bgm": {"name": "", "pan": 0, "pitch": 100, "volume": 90}})
    return mp


# =================================================================================================== Map119 Archiwum zakonu
def archiwum():
    """the order's archive: a low vault of raw stone under the knights' garden - the stairs come down from the slab in the
    north-west corner under the order's carved raven; book niches in the wall and the great bookcase of the chronicles along
    the north wall, the raven banner over the lectern with the Book of Signals standing at the head of a star mosaic (the
    order's sign); a reading table with scrolls, iron-bound chests, candles (every light a flame), dust and cobwebs"""
    W, H = 15, 11
    mp = Interior(ARCHIVE, W, H, "Archiwum zakonu", "archiwum", note=ARCHIVE_NOTE)
    mp.shell([("Archiwum", [(1, 4, 13, 9)], F_SLATE, W_RAW)], border=B_STONE)
    # the floor: old cracked flagstones (A5 0..3 x 5..6, mixed), the order's star mosaic before the lectern (A5 3..5 x 8..10)
    for (x, y) in sorted(mp.floor_cells):
        k = (x * 7 + y * 13 + (x * y) % 5) % 8
        mp.tile(0, x, y, A5(k % 4, 5 + k // 4))
    for dy in range(3):
        for dx in range(3):
            mp.tile(0, 5 + dx, 6 + dy, A5(3 + dx, 8 + dy))
    mp.shadows()
    g = "Archiwum"
    # ---- the stairs up (the north-west corner): stone stairs in an arch, the raven over them; walking into them -> the garden
    stairs = [se("Move1", 80, 100), transfer(TOWN, SLAB_OUT[0], SLAB_OUT[1], SLAB_OUT[2])]
    mp.tprop("schody_luk", 2, 3, group=g, name="Schody do ogrodu rycerzy")
    mp.ev(2, 3, "", 0, 2, 0, name="Schody -> Ogród rycerzy", priority=1, through=False, trigger=1, cmds=stairs)
    mp.tprop("kruk_plaskorzezba", 2, 1, group=g)
    marker(mp, "schody", 2, 4, 8)
    mp.spot("landing", ARCH_LAND[0], ARCH_LAND[1], ARCH_LAND[2])
    # ---- the north wall: book niches, the banner of the order over the lectern, the great bookcase of the chronicles
    for (x, col) in ((4, 6), (5, 7), (7, 6)):
        mp.tiles("A5", col, 9, 1, 2, x, 2, z=0)
        mp.wall_items.append((g + " nisze", "niche", x, 2))
    mp.tprop("kruk_choragiew", 6, 2, group=g + " chorągiew")
    mp.piece("C", 0, 6, 5, 3, 8, 2, group=g + " kroniki", kind="regał z kronikami")
    mp.piece("C", 0, 0, 1, 3, 13, 2, group=g + " regały", kind="regał z księgami")
    mp.tprop("drabina", 12, 4, group=g, name="Drabina przy regale", priority=0)
    marker(mp, "kroniki", 10, 5, 8)
    # ---- the lectern with the Book of Signals (the Winlu altar: an open book between three candles), candelabras beside it
    mp.ev(6, 5, ALTAR, 0, 2, 0, name="Pulpit z Księgą sygnałów", priority=1, through=False, step=True,
          note="<Light:150,130,90,34>")
    mp.rec("pulpit", "floorprop", {(6, 5)}, g, x=6, y=5, event=True)
    marker(mp, "ksiega_sygnalow", 6, 6, 8)
    for x in (4, 8):
        mp.ev(x, 5, "!Decoration2", 4, 6, 0, name="Kandelabr", priority=1, through=False, step=True, note="<Light:150,130,90,34>")
        mp.rec("candelabra", "floorprop", {(x, 5)}, g, x=x, y=5, event=True)
    # ---- the reading table with scrolls and candles, a stool; chests of the order; papers and dust; cobwebs
    table_h(mp, 10, 7, 3, style=6, group=g + " stół")
    on_table(mp, 10, 7, "D", 6, 13); on_table(mp, 12, 7, "D", 5, 12)
    mp.ev(11, 8, "!Decoration2", 1, 6, 0, name="Świece", priority=0, through=True, step=True, note="<Light:110,120,80,30>")
    stool(mp, 11, 9, group=g + " stół")
    thing(mp, 1, 9, "!Fantasy_chest", 0, 2, 0, "Okuta skrzynia zakonu", kind="skrzynia", group=g)
    thing(mp, 2, 9, "!Fantasy_chest", 6, 2, 0, "Skrzynia z pergaminami", kind="skrzynia", group=g)
    mp.ev(3, 9, "!Decoration2", 1, 2, 0, name="Świeca", priority=0, through=True, step=True, note="<Light:90,110,76,28>")
    for (x, y, c, r) in ((9, 8, 13, 9), (3, 7, 14, 9), (12, 6, 13, 10)):
        mp.t("D", c, r, x, y, z=2)
    mp.piece("D", 13, 7, 1, 1, 1, 1, z=3, group=g, kind="pajęczyna", solid_rows=[])
    mp.piece("D", 15, 7, 1, 1, 13, 1, z=3, group=g, kind="pajęczyna", solid_rows=[])
    mp.kind(1, {(3, 8), (4, 8), (4, 9), (12, 5), (13, 5), (13, 6), (7, 9), (8, 9), (1, 4), (1, 5), (9, 9), (10, 9)}, DUST)
    # the sound: silence of a sealed vault (the town's music stops; <Ambience:interior>: rain outside only)
    mp.props.update({"autoplayBgm": True, "bgm": {"name": "", "pan": 0, "pitch": 100, "volume": 90}})
    return mp


BUILDERS = {WELL: dno_studni, ARCHIVE: archiwum}
