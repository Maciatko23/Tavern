# The chunk library of band 1 ("Piwnice zamku", floors 1-9): Map130 "Podziemia: kawałki (pasmo 1)" - the rooms the game puts
# floors together from (js/plugins/Underground.js). Drawn here once; from then on the author can open Map130 in the editor,
# change a room or copy one and draw a new one (docs/PODZIEMIA.md, "Jak narysować nowy kawałek").
#
# A chunk = a rectangle of the map: its top-left cell holds the event "Kawałek: <name>" with <Kawalek:w=W,h=H[,waga=N][,pietra=a-b]>.
# Inside (local cells): row 0 rock, rows 1-2 the north wall's face, the floor from row 3, a rock border round it (the generator
# cuts the corridors through it). Events inside with a tag in the note:
#   <Drzwi:N|S|E|W>   a corridor may come in here (a floor cell at that edge; the cell next to it - right for N/S, below for E/W -
#                     must be floor too: corridors are two cells wide). Every chunk has at least one on each side.
#   <Schody>          a place for the stairs (the lower row of the north wall's face, floor below it - one lands there)
#   <Pochodnia>       a wall torch (on a face cell); lit or burnt out by the seed
#   <Lup:rodzaj>      a container: skrzynia, skrzynka, beczka, worek, dzban, monety, kosci (what is in it: Underground_Data LOOT)
#   <Stwor:rodzaj>    where a creature may stand (the kinds of docs/PODZIEMIA.md "Stwory - kontrakt": band 1 szczur, pajak) -
#                     stage 4 of the fighting puts them there
#   <Pulapka:kolce>   spikes in the floor (on by the seed)
#   <Zapiski>         a place for the floor's note of the order (one of them gets it)
#   <Losowo:50>       an ordinary picture that is there only on some floors (50%)
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from uglib import *   # noqa: F401,F403

LIB_ID = 130
SPACING = 1           # rock cells between the chunks on the library map

PROPS = "!Underground_Props"
TORCH = ("!Decoration", 3, 4, 0)
ART = {
    "skrzynia": ("!Dungeon_chest", 6, 2, 0), "skrzynia_szara": ("!Dungeon_chest", 0, 2, 0),
    "skrzynka": ("!Dungeon_chest", 2, 2, 1),
    "beczka": ("!Decoration_static_2", 0, 2, 1), "beczka_zboze": ("!Decoration_static_2", 2, 2, 2),
    "monety": (PROPS, 0, 4, 0), "papiery": (PROPS, 0, 2, 0), "zwoj": (PROPS, 0, 2, 1), "ksiega": (PROPS, 0, 2, 2),
    "pioro": (PROPS, 0, 6, 0), "kartki": (PROPS, 0, 6, 1), "czaszka": (PROPS, 0, 8, 0),
    "kolce": ("!Fantasy_dungeon_traps", 4, 8, 0),
    # (the deeper bands)
    "wozek": ("!wagon", 3, 2, 0), "relikwiarz": ("!Dungeon_chest", 3, 2, 0), "skrzynia_zlota": ("!Dungeon_chest", 1, 2, 0),
}
# tile pictures for the containers that are a single tile of a sheet (an event with a tile picture)
TILE_ART = {"worek": ("D", 10, 13), "dzban": ("E", 6, 13), "dzbany": ("E", 7, 13), "kosci": ("E", 11, 3),
            "grzyby": ("D", 3, 10), "grzyby2": ("D", 5, 10), "sakwa": ("D", 14, 4)}


class Chunk:
    """one chunk drawn into the library map at (ox, oy); local cells (x, y)"""

    def __init__(self, lib, name, ox, oy, rows, wall, floor, weight=1, floors="1-9", alt=None):
        self.lib, self.name, self.ox, self.oy = lib, name, ox, oy
        self.rows = rows
        self.w, self.h = len(rows[0]), len(rows)
        assert all(len(r) == self.w for r in rows), name
        cells, alts = set(), set()
        for y, row in enumerate(rows):
            for x, ch in enumerate(row):
                if ch in ".,": cells.add((ox + x, oy + y))
                if ch == ",": alts.add((ox + x, oy + y))
        area = lib.rect(ox, oy, ox + self.w - 1, oy + self.h - 1)
        lib.shell(cells, floor, wall, area=area)
        if alt is not None:
            for c in alts: lib.layers[0][c] = ("k", alt)
        self.cells = cells
        self.doors = {"N": [], "S": [], "E": [], "W": []}
        self.stairs_at = []
        lib.add(ox, oy, {"name": "Kawałek: " + name, "note": "<Kawalek:w=%d,h=%d,waga=%d,pietra=%s>" % (self.w, self.h, weight, floors),
                         "pages": [blank_page(priority=0, through=True)]})

    def L(self, x, y):
        return self.ox + x, self.oy + y

    def is_floor(self, x, y):
        return 0 <= y < self.h and 0 <= x < self.w and self.rows[y][x] in ".,"

    # ---- tiles
    def tiles(self, sheet, col, row, w, h, x, y, z=2, solid_rows=(), skip=()):
        self.lib.tiles(sheet, col, row, w, h, *self.L(x, y), z=z, solid_rows=solid_rows, skip=skip)

    def piece(self, name, x, y, z=2):
        self.lib.piece(name, *self.L(x, y), z=z)

    def film(self, kind, cells):
        self.lib.film({self.L(x, y) for (x, y) in cells}, kind)

    def t(self, sheet, col, row, x, y, z=2):
        self.lib.t(sheet, col, row, *self.L(x, y), z=z)

    # ---- markers
    def door(self, side, x, y):
        nx, ny = (x + 1, y) if side in "NS" else (x, y + 1)
        assert self.is_floor(x, y) and self.is_floor(nx, ny), "%s: door %s at %d,%d not on a 2-cell floor opening" % (self.name, side, x, y)
        self.lib.marker(*self.L(x, y), "Drzwi " + side, "<Drzwi:%s>" % side)
        self.doors[side].append((x, y))

    def stairs(self, x):
        assert self.is_floor(x, 3) and not self.is_floor(x, 2), "%s: stairs at %d" % (self.name, x)
        self.lib.ev(*self.L(x, 2), "!Fantasy_door5", 0, 2, 0, name="Miejsce na schody", priority=0, through=True, note="<Schody>")
        self.stairs_at.append(x)

    def torch(self, x, y=2):
        self.lib.ev(*self.L(x, y), *TORCH, name="Pochodnia", priority=0, through=True, step=True, note="<Pochodnia>")

    def loot(self, kind, x, y, art=None):
        a = art or kind
        if a in TILE_ART:
            s, c, r = TILE_ART[a]
            e = {"name": LOOT_NAME[kind], "note": "<Lup:%s>" % kind,
                 "pages": [blank_page(priority=1, image={"tileId": self.lib.SHEETS[s](c, r)})]}
            self.lib.add(*self.L(x, y), e)
        else:
            self.lib.ev(*self.L(x, y), *ART[a], name=LOOT_NAME[kind], priority=1, through=False, note="<Lup:%s>" % kind)

    def spawn(self, kind, x, y):
        self.lib.marker(*self.L(x, y), "Stwór: " + kind, "<Stwor:%s>" % kind)

    def trap(self, x, y):
        self.lib.ev(*self.L(x, y), *ART["kolce"], name="Pułapka: kolce", priority=0, through=True, note="<Pulapka:kolce>")

    def note(self, x, y, art="papiery"):
        self.lib.ev(*self.L(x, y), *ART[art], name="Zapiski", priority=1, through=False, note="<Zapiski>")

    def pic(self, x, y, char, idx, d, p, name, priority=1, through=None, note="", step=False):
        thr = (priority != 1) if through is None else through
        return self.lib.ev(*self.L(x, y), char, idx, d, p, name=name, priority=priority, through=thr, note=note, step=step)

    def check(self):
        for s in "NSEW":
            assert self.doors[s], "%s: no door on side %s" % (self.name, s)
        for x in self.stairs_at:
            for s in ("N",):
                for (dx, dy) in self.doors[s]:
                    assert abs(dx - x) > 1 and x != dx + 1, "%s: stairs %d in the way of door %d" % (self.name, x, dx)


LOOT_NAME = {"skrzynia": "Skrzynia", "skrzynka": "Skrzynka", "beczka": "Beczka", "worek": "Worek", "dzban": "Dzban",
             "monety": "Stare monety", "kosci": "Szczątki strażnika", "grzyby": "Grzyby", "wozek": "Wózek kopaczy",
             "sakwa": "Porzucona sakwa", "relikwiarz": "Relikwiarz"}


def full_rows(w, h):
    """a plain rectangle room: rock row 0, face rows 1-2, floor rows 3..h-2 between rock columns"""
    return ["#" * w] * 3 + ["#" + "." * (w - 2) + "#"] * (h - 4) + ["#" * w]


# ==================================================================================================== the chunks of band 1
def magazyn(lib, ox, oy):
    """the grain store: sacks and crates against the walls, a spilled sack in the middle, dust"""
    c = Chunk(lib, "Magazyn zboża", ox, oy, full_rows(14, 11), W_ROUGH, F_BROWN_SLAB, weight=3)
    c.door("N", 6, 3); c.door("S", 5, 9); c.door("W", 1, 5); c.door("E", 12, 6)
    c.stairs(3); c.stairs(10)
    c.torch(8)
    c.piece("worki_stos", 1, 3)
    c.piece("skrzynie_wysokie", 12, 2)
    c.piece("skrzynka_otwarta", 11, 3)
    c.piece("worek_na_skrzyni", 1, 7)
    c.piece("deski_oparte", 12, 7)
    c.piece("worek_rozsypany", 6, 6)
    c.loot("worek", 5, 3); c.loot("worek", 9, 3, "worek")
    c.loot("skrzynka", 4, 9); c.loot("skrzynka", 10, 9)
    c.spawn("szczur", 7, 7); c.spawn("szczur", 3, 6)
    c.note(9, 7, "kartki")
    c.film(FILM_DUST, [(2, 5), (2, 6), (6, 5), (7, 5), (8, 6), (10, 4), (11, 5), (11, 8), (10, 8), (3, 9), (2, 9)])
    return c


def piwnica_win(lib, ox, oy):
    """the wine vault: blind arches, barrel stacks along both long walls, an aisle down the middle"""
    c = Chunk(lib, "Piwnica win", ox, oy, full_rows(16, 11), W_ARCHES, F_SLATE, weight=3)
    c.door("N", 7, 3); c.door("S", 7, 9); c.door("W", 1, 5); c.door("E", 14, 5)
    c.stairs(4); c.stairs(11)
    c.torch(2); c.torch(13)
    c.piece("beczki_piramida", 1, 8)
    c.piece("beczki_piramida", 12, 8)
    c.piece("beczki_dwie", 5, 3)
    c.piece("beczki_dwie", 9, 3)
    c.piece("beczka_rozbita", 10, 8)
    c.loot("beczka", 4, 9); c.loot("beczka", 11, 9)
    c.loot("beczka", 13, 3, "beczka_zboze")
    c.spawn("szczur", 7, 6)
    c.note(6, 8, "papiery")
    c.film(FILM_DUST, [(3, 6), (4, 6), (11, 5), (12, 5), (7, 4), (8, 4)])
    return c


def zawalisko(lib, ox, oy):
    """a collapsed hall: the north-east part fell in (rock and rubble), roots through the bricks, a guard's bones under it"""
    rows = ["###############",
            "###############",
            "###############",
            "#........######",
            "#........######",
            "#.............#",
            "#.............#",
            "#.............#",
            "#.............#",
            "#.............#",
            "###############"]
    c = Chunk(lib, "Zawalisko", ox, oy, rows, W_ROOTS, F_DIRT_SLABS, weight=2)
    c.door("N", 3, 3); c.door("S", 8, 9); c.door("W", 1, 6); c.door("E", 13, 7)
    c.stairs(6)
    c.torch(1)
    c.piece("gruz", 9, 5)
    c.piece("glazy", 11, 4)
    c.piece("kamyki", 10, 7); c.piece("kamyki2", 4, 8); c.piece("kamyki", 12, 8)
    c.piece("kolumna_lezaca", 6, 4)
    c.piece("pniak_kolumny", 2, 8)
    c.piece("korzenie", 7, 3)
    c.loot("kosci", 9, 6, "kosci")
    c.loot("monety", 12, 9)
    c.spawn("pajak", 5, 7)
    c.film(FILM_RUBBLE, [(8, 5), (9, 6), (10, 6), (11, 7), (12, 7), (8, 4), (7, 4), (10, 8)])
    return c


def cysterna(lib, ox, oy):
    """the order's dry cistern: the round shaft in the middle (dark and dry - nothing to draw), drains, moss where the water
    used to stand"""
    c = Chunk(lib, "Sucha cysterna", ox, oy, full_rows(15, 13), W_MOSSY, F_GREEN_BRICK, weight=2)
    c.door("N", 2, 3); c.door("S", 10, 11); c.door("W", 1, 9); c.door("E", 13, 4)
    c.stairs(10); c.stairs(5)
    c.torch(7)
    c.piece("studnia", 6, 6)
    c.t("A5", 2, 0, 3, 6, z=1); c.t("A5", 3, 0, 11, 9, z=1)       # drains
    c.loot("dzban", 2, 5, "dzban"); c.loot("dzban", 12, 10, "dzbany")
    c.piece("dzbany_pasy", 11, 6)
    c.piece("wiadro_puste", 8, 9)
    c.note(4, 10, "zwoj")
    c.spawn("szczur", 9, 10)
    c.film(FILM_MOSS, [(5, 5), (6, 5), (9, 5), (10, 6), (5, 9), (9, 9), (6, 9), (5, 8), (4, 7), (10, 8)])
    return c


def wartownia(lib, ox, oy):
    """the guard room by the stairs: a fire in the wall, the guards' chest, barrels, bones, spikes in the floor"""
    c = Chunk(lib, "Wartownia", ox, oy, full_rows(13, 11), W_GREY_PILLARS, F_COBBLE, weight=2)
    c.door("N", 9, 3); c.door("S", 2, 9); c.door("W", 1, 4); c.door("E", 11, 7)
    c.stairs(6)
    c.piece("palenisko", 2, 1)
    c.lib.light(*c.L(3, 2), "<Light:170,255,150,80><LightFlicker:0.15,255,120,50><LightHeight:22>", "Ogień w murze")
    c.loot("skrzynia", 7, 3)
    c.piece("beczki_dwie", 9, 8)
    c.piece("kosci", 5, 8)
    c.trap(6, 6); c.trap(7, 6)
    c.spawn("szczur", 4, 6)
    c.note(10, 5, "pioro")
    c.film(FILM_DUST, [(5, 8), (6, 8), (7, 9), (2, 7), (3, 7)])
    return c


def krypta(lib, ox, oy):
    """the order's crypt: bones in the wall niches, sarcophagi in two rows, a coffin standing in the corner"""
    c = Chunk(lib, "Krypta zakonu", ox, oy, full_rows(15, 12), W_ARCHES, F_SLATE_SQ, weight=2, floors="2-9")
    c.door("N", 11, 3); c.door("S", 6, 10); c.door("W", 1, 7); c.door("E", 13, 8)
    c.stairs(3); c.stairs(8)
    c.piece("nisze_czaszki", 4, 1)
    c.piece("sarkofag", 2, 4); c.piece("sarkofag", 6, 4)
    c.piece("sarkofag_otwarty", 2, 7); c.piece("sarkofag_pusty", 9, 7)
    c.piece("trumna", 12, 4)
    c.pic(10, 4, "!Decoration2", 1, 2, 0, "Świece (zgaszone)", priority=0, note="<Losowo:60>")
    c.loot("dzban", 1, 4, "dzbany"); c.loot("kosci", 5, 9, "kosci")
    c.spawn("pajak", 7, 6); c.spawn("pajak", 11, 9)
    c.note(8, 9, "ksiega")
    c.film(FILM_DUST, [(4, 6), (5, 6), (8, 6), (9, 6), (3, 10), (4, 10), (12, 7)])
    return c


def cele(lib, ox, oy):
    """the cells: a row of iron bars across the room's north part with a gap where the door broke off, chains on the wall, a
    hanging cage, bones"""
    c = Chunk(lib, "Cele", ox, oy, full_rows(16, 11), W_GREY, F_BRICK, weight=2, floors="2-9")
    c.door("N", 13, 3); c.door("S", 7, 9); c.door("W", 1, 7); c.door("E", 14, 6)
    c.stairs(11)
    c.piece("kraty", 1, 5); c.piece("kraty", 6, 5)               # the bars, the door gone at x 4-5
    c.piece("slupek_kraty", 9, 4)
    c.piece("lancuch", 2, 2); c.piece("lancuch2", 7, 2)
    c.piece("kosci2", 2, 4); c.piece("kosci3", 8, 3); c.piece("czaszki", 6, 3)
    c.pic(12, 8, "!Fantasy_hanging_cage", 0, 2, 0, "Wisząca klatka", priority=1)
    c.loot("kosci", 3, 3, "kosci")
    c.loot("skrzynka", 2, 8)
    c.spawn("szczur", 8, 7); c.spawn("pajak", 4, 3)
    c.note(7, 4, "czaszka")
    c.film(FILM_DUST, [(1, 3), (2, 3), (5, 4), (7, 3), (8, 4)])
    return c


def kaplica(lib, ox, oy):
    """a small chapel of the order: hooded stone brothers by the wall, candles, an altar stone; a quiet place"""
    rows = ["#############",
            "#############",
            "#############",
            "#...........#",
            "#...........#",
            "#...........#",
            "#...........#",
            "#...........#",
            "#...........#",
            "#############"]
    c = Chunk(lib, "Kaplica straży", ox, oy, rows, W_ARCHES, F_GREY_TILE, weight=2)
    c.door("N", 2, 3); c.door("S", 8, 8); c.door("W", 1, 6); c.door("E", 11, 4)
    c.stairs(9)
    c.piece("oltarz", 6, 2)
    c.pic(4, 3, "!Dungeon_Statue", 0, 2, 0, "Posąg zakonnika")
    c.pic(8, 3, "!Dungeon_Statue", 0, 2, 1, "Posąg zakonnika")
    c.pic(5, 4, "!Decoration2", 0, 2, 0, "Świeca", priority=0, note="<Light:110,255,190,120><LightFlicker:0.06><Losowo:70>", step=True)
    c.pic(7, 4, "!Decoration2", 0, 2, 0, "Świeca", priority=0, note="<Light:110,255,190,120><LightFlicker:0.06><Losowo:70>", step=True)
    c.loot("dzban", 10, 7, "dzban")
    c.note(6, 5, "ksiega")
    c.spawn("pajak", 6, 7)
    c.film(FILM_DUST, [(2, 7), (3, 7), (9, 6), (10, 6)])
    return c


def spizarnia(lib, ox, oy):
    """a small pantry: jars, sacks, a crate; mushrooms grew in the damp corner"""
    c = Chunk(lib, "Spiżarnia", ox, oy, full_rows(11, 9), W_ROUGH, F_DIRT, weight=2)
    c.door("N", 4, 3); c.door("S", 6, 7); c.door("W", 1, 3); c.door("E", 9, 3)
    c.stairs(2)
    c.piece("dzbany_grupa", 7, 2)
    c.piece("dzbany_grupa2", 1, 6)
    c.piece("grzyby", 8, 6)
    c.loot("dzban", 6, 3, "dzbany"); c.loot("worek", 3, 7)
    c.loot("skrzynka", 9, 5)
    c.spawn("szczur", 5, 5)
    c.film(FILM_MOSS, [(8, 5), (9, 7), (7, 7)])
    return c


def hala(lib, ox, oy):
    """the pillared hall: two rows of square pillars holding the vault, torches between them"""
    c = Chunk(lib, "Hala filarów", ox, oy, full_rows(17, 13), W_GREY_PILLARS, F_COBBLE, weight=2, floors="1-9")
    c.door("N", 7, 3); c.door("S", 8, 11); c.door("W", 1, 7); c.door("E", 15, 7)
    c.stairs(3); c.stairs(12)
    c.torch(5); c.torch(10)
    for x in (4, 8, 12):
        for y in (4, 8):
            c.piece("filar", x, y)
    c.loot("skrzynia", 14, 3, "skrzynia_szara")
    c.loot("monety", 6, 10)
    c.trap(10, 6); c.trap(6, 6)
    c.spawn("szczur", 8, 6); c.spawn("szczur", 13, 10)
    c.note(2, 10, "kartki")
    c.film(FILM_DUST, [(10, 9), (11, 9), (11, 10), (3, 5), (2, 5)])
    return c


def skladzik(lib, ox, oy):
    """a narrow store under the stairs: crates in rows, a passage between them"""
    rows = ["############",
            "############",
            "############",
            "#..........#",
            "#..........#",
            "#..........#",
            "#..........#",
            "#..........#",
            "############"]
    c = Chunk(lib, "Skład skrzyń", ox, oy, rows, W_LIGHT, F_GREY_TILE, weight=2)
    c.door("N", 5, 3); c.door("S", 2, 7); c.door("W", 1, 4); c.door("E", 10, 5)
    c.stairs(8)
    c.torch(3)
    c.piece("skrzynka_zamknieta", 1, 5); c.piece("skrzynka_plotno", 8, 5)
    c.piece("skrzynka_pusta", 9, 2)
    c.piece("skrzynie_wysokie", 4, 5)
    c.loot("skrzynka", 6, 6); c.loot("skrzynka", 3, 3); c.loot("worek", 7, 7)
    c.spawn("szczur", 5, 7)
    c.film(FILM_DUST, [(2, 4), (3, 4), (7, 4), (8, 4)])
    return c


CHUNKS = [magazyn, piwnica_win, zawalisko, cysterna, wartownia, krypta, cele, kaplica, spizarnia, hala, skladzik]

GUIDE = ("<Instrukcja>\n"
         "Kawałek = prostokąt mapy. W lewym górnym rogu zdarzenie 'Kawałek: nazwa' z notatką <Kawalek:w=SZER,h=WYS,waga=N,pietra=1-9>.\n"
         "Rząd 0 skała, rzędy 1-2 ściana (lico), podłoga od rzędu 3, ramka ze skały dookoła.\n"
         "W środku zdarzenia z notatkami: <Drzwi:N/S/E/W> (min. jedne z każdej strony, otwór 2 pola), <Schody> (dolny rząd lica),\n"
         "<Pochodnia>, <Lup:skrzynia|skrzynka|beczka|worek|dzban|monety|kosci>, <Stwor:szczur|pajak|dowolny>,\n"
         "<Pulapka:kolce>, <Zapiski>, <Losowo:50>. Opis: docs/PODZIEMIA.md")


def build():
    """the library map: the chunks in rows, rock between them; returns (DMap, [Chunk])"""
    sizes = []
    # (a dry run for the sizes: every chunk on a scratch map)
    scratch = DMap(LIB_ID, 60, 40, "x", "")
    for fn in CHUNKS:
        ch = fn(scratch, 0, 0)
        sizes.append((ch.w, ch.h))
    width = 74
    x, y, rowh, places = 1, 3, 0, []
    for (w, h) in sizes:
        if x + w > width - 1:
            x, y, rowh = 1, y + rowh + SPACING, 0
        places.append((x, y))
        x += w + SPACING
        rowh = max(rowh, h)
    H = y + rowh + 1
    lib = DMap(LIB_ID, width, H, "Podziemia: kawałki (pasmo 1)",
               "<Dark:off>\n<DayNight:off>\n<Hunt:off>\n<Build:off>\n<Minimap:off>\nKawałki pokoi pasma 1 (Piwnice zamku) - z nich gra składa piętra 1-9.\nNie wchodzić w grze. Opis: docs/PODZIEMIA.md")
    for c in lib.all: lib.layers[0][c] = ("k", 99)
    chunks = []
    for fn, (cx, cy) in zip(CHUNKS, places):
        ch = fn(lib, cx, cy)
        ch.check()
        chunks.append(ch)
    lib.shadows()
    lib.add(0, 0, {"name": "INSTRUKCJA (notatka)", "note": GUIDE, "pages": [blank_page(priority=0, through=True)]})
    return lib, chunks


if __name__ == "__main__":
    lib, chunks = build()
    out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "staging", "chunks.png")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    render(lib.to_json(), out, grid="grid" in sys.argv)
    for ch in chunks:
        print("%-16s %2dx%-2d at %2d,%-2d doors %s stairs %s" % (ch.name, ch.w, ch.h, ch.ox, ch.oy, {k: len(v) for k, v in ch.doors.items()}, ch.stairs_at))
