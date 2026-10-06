# The chunk libraries of bands 2-5 (docs/PODZIEMIA.md): the rooms the game puts floors 11-99 together from (Underground.js), one
# library map per band, drawn the same way as band 1's Map130 (chunks.py - the same Chunk, the same tags):
#   Map141  pasmo 2  Kwatery i kaplica zakonu    floors 11-29   band 2's tileset (uglib.TILESET2: the Interior set's furniture)
#   Map142  pasmo 3  Jaskinie i podziemna rzeka  floors 31-49   tileset 10 (caves, water, crystals, fungi, the diggers' things)
#   Map143  pasmo 4  Ruiny starsze niż zakon     floors 51-75   tileset 10 (gothic walls, carvings, statues, broken columns)
#   Map144  pasmo 5  Warstwa Prawdy              floors 76-99   tileset 10 (pale stone, mist, blue flames, <Szept>, <Zjawa>)
# Besides band 1's tags (chunks.py):
#   '~' in a chunk's rows  water (A1; never drunk underground - Underground.js says so when one tries)
#   <Lup:grzyby|wozek|sakwa|relikwiarz>   mushrooms (picked once, then gone), a diggers' cart (ore), a lost bag, a reliquary
#   <Szept>    a voice from the dark comes from here (band 5)
#   <Zjawa>    someone from up there is seen here for a moment (band 5)
#   an event with a "!$Rock_..." picture is a rock to mine (ChoppableTree.js: stone; "!$Rock_Ore_Iron..." iron ore)
# Creature places: the kinds of the contract (docs/PODZIEMIA.md "Stwory - kontrakt"): band 2 szczur / pajak / zbroja, band 3 pajak /
# nietoperz / topielec, band 4 zbroja / kamiennik, band 5 upior / cien.
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from uglib import *   # noqa: F401,F403
from chunks import Chunk, full_rows, ART, TILE_ART, TORCH, SPACING, GUIDE   # noqa: F401

WATER = 8                 # A1 kind of the underground water: blue, its own earthen banks (A1 cells 0-5, rows 6-8)
CANDLE = ("!Decoration2", 0, 2, 0)
CANDELABRUM = ("!Decoration2", 4, 2, 0)
CANDLE_BLUE = ("!Decoration2_blue", 0, 2, 0)
CANDELABRUM_BLUE = ("!Decoration2_blue", 4, 2, 0)
BRAZIER = ("!Decoration", 0, 2, 0)
LANTERN = ("!Decoration", 7, 2, 0)
CANDLE_LIGHT = "<Light:110,255,190,120><LightFlicker:0.06>"
CANDELABRUM_LIGHT = "<Light:110,255,180,100><LightFlicker:0.07><LightHeight:52>"
BLUE_LIGHT = "<Light:115,150,190,245><LightFlicker:0.12,110,150,240><LightHeight:44>"
BRAZIER_LIGHT = "<Light:170,255,150,70><LightFlicker:0.16,255,110,40><LightHeight:26>"
LANTERN_LIGHT = "<Light:140,255,180,100><LightFlicker:0.08><LightHeight:50>"
RELIEFS = "!Ug_Reliefs"   # (make_props.py: 0 kneeling before the light, 1 the one lying / the bowl, 2 the one standing alone)

W_BEIGE = (112, 120)          # light sandstone brick - the order's better rooms
W_BLOCKS = (116, 124)         # big grey blocks with a band
W_GREYBRICK = (118, 126)      # grey brick
W_NICHES = (101, 109)         # grey wall with niches
W_GOTHIC = (100, 108)         # dark gothic wall with lancets - the oldest carvings
W_GOTHIC2 = (86, 94)          # dark blue gothic arches
W_SPIKES = (87, 95)           # dark gothic, spiked
W_PALE = (102, 110)           # pale blue stone - the Truth Layer
W_ICE = (83, 91)              # ice
W_CAVE = (80, 88)             # brown cave boulders
W_CAVE_MOSS = (81, 89)        # mossy green boulders
W_CAVE_BEAMS = (82, 90)       # boulders and timber posts - the old quarry
W_CAVE_BROWN = (84, 92)
W_CAVE_ROOTS = (85, 93)
F_ORNATE, F_BLUEGREY, F_GREENTILE, F_ICE = 33, 35, 43, 25
FILM_MIST, FILM_HOLE = 31, 23  # purple mist (see-through); black holes (impassable - a chasm)


class XChunk(Chunk):
    """a chunk of the deeper bands: band 1's Chunk plus water ('~'), the Truth Layer's places and a few more things"""

    def __init__(self, lib, name, ox, oy, rows, wall, floor, weight=1, floors="11-29", alt=None, water=WATER):
        self.water_cells = set()
        clean = []
        for y, row in enumerate(rows):
            for x, ch in enumerate(row):
                if ch == "~": self.water_cells.add((ox + x, oy + y))
            clean.append(row.replace("~", "."))
        Chunk.__init__(self, lib, name, ox, oy, clean, wall, floor, weight, floors, alt)
        for c in self.water_cells: lib.layers[0][c] = ("k", water)
        lib.water = getattr(lib, "water", set()) | self.water_cells

    def is_floor(self, x, y):
        return Chunk.is_floor(self, x, y) and (self.ox + x, self.oy + y) not in self.water_cells

    def waterfall(self, x0, x1, rows=(1, 2), kind=9):
        """a waterfall down the north wall's face (an A1 waterfall kind; its shape: an edge on the left / right) over x0..x1"""
        for y in rows:
            for x in range(x0, x1 + 1):
                shape = (0 if x > x0 else 1) | (0 if x < x1 else 2)
                self.lib.layers[0][self.L(x, y)] = ("t", 2048 + kind * 48 + shape)

    def kind(self, cells, kind, z=0):
        for (x, y) in cells: self.lib.layers[z][self.L(x, y)] = ("k", kind)

    # ---- the Truth Layer
    def whisper(self, x, y):
        self.lib.marker(*self.L(x, y), "Szept", "<Szept>")

    def vision(self, x, y):
        self.lib.ev(*self.L(x, y), "", name="Zjawa", priority=1, through=True, note="<Zjawa>")

    # ---- lights (every light a flame; band 5's are blue flames)
    def candle(self, x, y, big=False, blue=False, chance=None):
        art = (CANDELABRUM_BLUE if blue else CANDELABRUM) if big else (CANDLE_BLUE if blue else CANDLE)
        light = BLUE_LIGHT if blue else CANDELABRUM_LIGHT if big else CANDLE_LIGHT
        note = light + ("<Losowo:%d>" % chance if chance else "")
        self.lib.ev(*self.L(x, y), *art, name="Świecznik" if big else "Świeca", priority=1 if big else 0,
                    through=not big, step=True, note=note)

    def brazier(self, x, y):
        self.lib.ev(*self.L(x, y), *BRAZIER, name="Kosz z ogniem", priority=1, through=False, step=True, note=BRAZIER_LIGHT)

    def lantern(self, x, y):
        self.lib.ev(*self.L(x, y), *LANTERN, name="Latarnia kopaczy", priority=0, through=True, step=True, note=LANTERN_LIGHT)

    # ---- things to take with a tool (ChoppableTree.js reads the picture)
    def rock(self, x, y, pic="!$Rock_Ore_Iron", chance=None, name=None):
        nm = name or ("Skała z rudą" if "Ore" in pic else "Skała")
        self.lib.ev(*self.L(x, y), pic, 0, 2, 0, name=nm, priority=1, through=False, note="<Losowo:%d>" % chance if chance else "")

    def relief(self, x, idx, y=2):
        self.lib.ev(*self.L(x, y), RELIEFS, idx, 2, 0, name="Płaskorzeźba", priority=0, through=True)

    def statue(self, x, y, pattern=0, name="Posąg"):
        self.lib.ev(*self.L(x, y), "!Dungeon_Statue", 0, 2, pattern, name=name, priority=1, through=False)


def rows_of(*rows):
    w = len(rows[0])
    assert all(len(r) == w for r in rows), rows
    return list(rows)


# ==================================================================================================== band 2: Kwatery i kaplica zakonu
B2 = "11-29"


def b2_cele(lib, ox, oy):
    """the guards' cells: four cells along the north wall (partitions coming out of it), bars in front of two of them, straw
    beds; the free part on the right where the corridor from the north comes in"""
    rows = rows_of("#################",
                   "#################",
                   "#################",
                   "#...#...#...#...#",
                   "#...#...#...#...#",
                   "#...#...#...#...#",
                   "#...............#",
                   "#...............#",
                   "#...............#",
                   "#...............#",
                   "#################")
    c = XChunk(lib, "Cele strażników", ox, oy, rows, W_GREY, F_BRICK, weight=3, floors=B2)
    c.door("N", 13, 3); c.door("S", 7, 9); c.door("W", 1, 7); c.door("E", 15, 7)
    c.stairs(6)
    for x in (1, 2, 3): c.t("E", 11 + x, 1, x, 6)                  # cell 1 barred shut
    c.t("E", 12, 1, 9, 6); c.t("E", 14, 1, 11, 6)                   # cell 3: the middle bar torn out
    c.piece("in_lozko_slome", 1, 3); c.piece("in_lozko_slome", 5, 3); c.piece("in_lozko_slome", 9, 3)
    c.piece("in_stolek", 7, 4); c.piece("wiadro_puste", 11, 5)
    c.piece("lancuch", 2, 2); c.piece("lancuch2", 10, 2)
    c.piece("kosci2", 2, 5)
    c.loot("skrzynka", 7, 5); c.loot("worek", 11, 3, "worek")
    c.torch(14)
    c.spawn("szczur", 4, 8); c.spawn("pajak", 12, 8)
    c.note(6, 4, "kartki")
    c.film(FILM_DUST, [(1, 7), (2, 7), (5, 8), (6, 8), (13, 6), (14, 6), (9, 9)])
    return c




def build(mod):
    """a band's library map from its module (chunks_b2..b5: CHUNKS, LIBRARY): the chunks in rows, rock between them; returns
    (DMap, [Chunk])"""
    spec = mod.LIBRARY
    sizes = []
    scratch = DMap(spec["map_id"], 60, 40, "x", "", tileset=spec["tileset"])
    for fn in mod.CHUNKS:
        ch = fn(scratch, 0, 0)
        sizes.append((ch.w, ch.h))
    width = 76
    x, y, rowh, places = 1, 3, 0, []
    for (w, h) in sizes:
        if x + w > width - 1:
            x, y, rowh = 1, y + rowh + SPACING, 0
        places.append((x, y))
        x += w + SPACING
        rowh = max(rowh, h)
    H = y + rowh + 1
    note = ("<Dark:off>\n<DayNight:off>\n<Hunt:off>\n<Build:off>\n<Minimap:off>\nKawałki pokoi pasma %d - z nich gra składa piętra %s.\n"
            "Nie wchodzić w grze. Opis: docs/PODZIEMIA.md" % (spec["band"], spec["floors"]))
    lib = DMap(spec["map_id"], width, H, spec["title"], note, tileset=spec["tileset"])
    for c in lib.all: lib.layers[0][c] = ("k", spec["rock"])
    chunks = []
    for fn, (cx, cy) in zip(mod.CHUNKS, places):
        ch = fn(lib, cx, cy)
        ch.check()
        chunks.append(ch)
    lib.shadows()
    for c in getattr(lib, "water", set()): lib.shadow.pop(c, None)
    lib.add(0, 0, {"name": "INSTRUKCJA (notatka)", "note": GUIDE, "pages": [blank_page(priority=0, through=True)]})
    return lib, chunks
