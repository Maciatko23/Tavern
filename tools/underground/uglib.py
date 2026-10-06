# Shared pieces for the underground ("Podziemia", docs/PODZIEMIA.md): the maps on tileset 10 "Wilu Fantasy Dungeon"
# (the Winlu Fantasy Dungeon set: A1 water/lava, A2 floors and floor films, A4 walls - a "top" (the rock / ceiling seen from
# above) over a "side" (the wall face, 2 rows here), A5 stairs / grates / arches, B cave rocks, C bridges / pillars / arches,
# D crates / barrels / sacks / mushrooms, E pots / bones / bars / sarcophagi / the round well).
#
# Built on tools/newstart/nslib.py (the editor's autotile shapes and its map file layout - a byte-exact round trip), like the
# tavern / town / quest-place builders. What this adds:
#   - DMap: a NewMap on tileset 10 with a room shell for the dungeon (floor cells; the wall face FACE rows tall over every top
#     edge of the floor; the rock top everywhere else), the editor's wall shadow, events in the game's conventions
#     (pictures, invisible markers "Miejsce: ...", lights with RoomLighting notes - every light a flame);
#   - the passage flags of the author's own sample project for this set (tools/town/winlu_samples/Tilesets.json, tileset 3
#     "Fantasy Dungeon": the same sheet names) - build.py installs them into data/Tilesets.json tileset 10;
#   - a renderer for pictures of the maps (tools/town/mzrender.py with this set's sheets and its character pictures).
# Nothing here writes data/ (build.py does, with the editor closed).
import os, sys, json, copy, random
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..")).replace("\\", "/") + "/"
sys.path.insert(0, os.path.join(ROOT, "tools", "newstart"))
sys.path.insert(0, os.path.join(ROOT, "tools", "town"))
from nslib import NewMap, blank_page, write_map, B, C, D, E, A5, kind_of   # noqa: E402,F401
import mzrender as R   # noqa: E402

TILESET = 10
DUNGEON = ROOT + "img/tilesets/Winlu Fantasy Tileset - Dungeon/"
DUNGEON_CHARS = DUNGEON + "characters/"
INTERIOR_CHARS = ROOT + "img/tilesets/Winlu Fantasy Tileset - Interior/Remaster/characters/"
# band 2's tileset (the order's quarters): the Dungeon set, but its B sheet is the Interior set's C sheet (beds, tables, benches,
# shelves) - the C, D, E sheets stay the Dungeon's, so every piece of PIECES but the "B" ones works on it too. build.py writes it
# into data/Tilesets.json (the id below must be free there or ours already).
TILESET2 = 12
_DN = "Winlu Fantasy Tileset - Dungeon/tilesets/Fantasy_Dungeon_"
TILESET2_NAMES = [_DN + "A1", _DN + "A2", "", _DN + "A4", _DN + "A5",
                  "Winlu Fantasy Tileset - Interior/Remaster/tilesets/Fantasy_Inside_C", _DN + "C", _DN + "D", _DN + "E"]
TILESET2_NAME = "Podziemia: kwatery zakonu"


def load_json(p):
    with open(p, "rb") as f:
        return json.loads(f.read().decode("utf-8"))


# the author's passage flags for this set (his sample project's tileset 3 "Fantasy Dungeon", the same nine sheet names)
SAMPLE_TILESETS = ROOT + "tools/town/winlu_samples/Tilesets.json"
AUTHOR = load_json(SAMPLE_TILESETS)[3]
AUTHOR_FLAGS = AUTHOR["flags"]
AUTHOR_INTERIOR_FLAGS = load_json(SAMPLE_TILESETS)[2]["flags"]   # (his "Fantasy Interior": Fantasy_Inside_C in its C slot)

# ---------------------------------------------------------------------------------------------------- kinds (autotiles)
# A2 floors (layer 0) and films (layer 1, see-through)
F_MOSSY, F_DIRT, F_BROWN_SLAB, F_GREY_TILE, F_COBBLE, F_BRICK, F_GREEN_BRICK = 16, 17, 32, 34, 40, 41, 42
F_SLATE, F_SLATE_SQ, F_DIRT_SLABS = 26, 27, 24
FILM_CRACKS, FILM_RUBBLE, FILM_MOSS, FILM_DUST, FILM_DIRT, FILM_GRASS = 22, 29, 30, 46, 19, 45
# A4 walls: (top, side) pairs of one column of the sheet
W_GREY_PILLARS = (99, 107)      # grey ashlar with pilasters (block row 1, col 3)
W_GREY = (115, 123)             # dark grey ashlar (block row 2, col 3)
W_ROUGH = (117, 125)            # brown rough stone - the oldest foundations (block row 2, col 5)
W_MOSSY = (114, 122)            # green-grey mossy brick (block row 2, col 2)
W_LIGHT = (97, 105)             # light grey brick (block row 1, col 1)
W_ARCHES = (96, 104)            # grey wall with blind arches (block row 1, col 0)
W_ROOTS = (119, 127)            # brick broken by roots (block row 2, col 7)

FACE = 2                        # wall face rows (the set's walls are drawn two cells tall)


def is_side(kind):
    return kind is not None and kind >= 80 and ((kind - 80) // 8) % 2 == 1


# ---------------------------------------------------------------------------------------------------- pieces (B-E blocks)
# name -> (sheet, col, row, w, h, block rows, star rows): the props used on the underground maps. build.py writes their passage
# flags into tileset 10 (flags10.py): the "block" rows stop the hero (the thing's foot), the "star" rows are drawn over him and
# do not count (the upper part of a tall thing: he walks behind it), the other rows keep the author's flags (floor things).
PIECES = {
    # crates, sacks, barrels (D)
    "worki_stos": ("D", 8, 13, 2, 2, (0, 1), ()),          # a heap of sacks
    "worek_rozsypany": ("D", 8, 15, 2, 1, (), ()),         # a spilled sack (on the floor)
    "skrzynie_wysokie": ("D", 15, 4, 1, 3, (2,), (0, 1)),  # crates stacked high, a cloth on top
    "skrzynka_otwarta": ("D", 12, 5, 1, 2, (1,), (0,)),    # an open crate, a sack in it
    "worek_na_skrzyni": ("D", 14, 4, 1, 3, (2,), (0, 1)),
    "deski_oparte": ("D", 13, 4, 1, 3, (2,), (0, 1)),      # planks leaning on a crate
    "skrzynka_pusta": ("D", 11, 13, 1, 2, (1,), (0,)),     # an empty box, open
    "skrzynka_zamknieta": ("D", 12, 13, 1, 2, (1,), (0,)),
    "skrzynka_plotno": ("D", 15, 13, 1, 2, (1,), (0,)),    # a crate under a cloth
    "beczki_piramida": ("D", 13, 11, 3, 2, (1,), (0,)),     # barrels lying on their sides, two on three
    "beczki_dwie": ("D", 14, 7, 2, 2, (1,), (0,)),         # two barrels, one up on the other
    "beczka": ("D", 13, 9, 1, 2, (1,), (0,)),
    "beczka_rozbita": ("D", 12, 7, 1, 2, (1,), (0,)),
    "beczka_pusta": ("D", 13, 8, 1, 1, (0,), ()),
    "grzyby": ("D", 4, 9, 2, 2, (), ()),                   # mushrooms in a damp corner (on the floor)
    "korzenie": ("D", 0, 7, 2, 2, (), ()),                 # roots through the floor
    "wiadro_puste": ("D", 15, 15, 1, 1, (0,), ()),
    # stones and rubble (B), columns (C)
    "kamyki": ("B", 8, 4, 1, 1, (), ()), "kamyki2": ("B", 9, 4, 1, 1, (), ()),
    "gruz": ("B", 12, 6, 2, 1, (0,), ()),                  # fallen stones
    "glazy": ("B", 12, 7, 2, 2, (1,), (0,)),               # a heap of blocks
    "kamien": ("B", 10, 4, 1, 1, (0,), ()),
    "filar": ("C", 9, 8, 1, 3, (2,), (0, 1)),              # a square stone pillar (cap, shaft, foot)
    "kolumna": ("C", 11, 8, 1, 3, (2,), (0, 1)),           # a round column
    "kolumna_lezaca": ("C", 13, 9, 1, 2, (1,), (0,)),      # a fallen column
    "pniak_kolumny": ("C", 11, 11, 1, 1, (0,), ()),
    "bloki": ("C", 9, 11, 1, 1, (0,), ()),                 # loose blocks of stone
    "palenisko": ("C", 8, 0, 2, 2, (0, 1), ()),            # a fire in the wall (on the face)
    "posag_modlacy": ("C", 13, 14, 1, 2, (1,), (0,)),      # a hooded statue praying
    "krata_podlogi": ("C", 8, 15, 1, 1, (), ()),           # a grate in the floor
    "okienko": ("C", 9, 14, 1, 1, (0,), ()),               # a barred window (on the face)
    # pots, bones, bars, graves (E)
    "dzbany_grupa": ("E", 2, 0, 2, 2, (1,), (0,)),
    "dzbany_grupa2": ("E", 4, 0, 2, 2, (1,), (0,)),
    "dzbany_pasy": ("E", 4, 2, 2, 2, (1,), (0,)),
    "dzban_duzy": ("E", 7, 3, 1, 2, (1,), (0,)),
    "dzban_bialy": ("E", 6, 4, 1, 1, (0,), ()),
    "kosci": ("E", 10, 1, 1, 1, (), ()), "kosci2": ("E", 12, 2, 1, 1, (), ()), "kosci3": ("E", 13, 3, 1, 1, (), ()),
    "szkielet": ("E", 11, 3, 1, 1, (), ()),
    "czaszki": ("E", 12, 4, 1, 1, (), ()),
    "lancuch": ("E", 8, 0, 1, 1, (), (0,)), "lancuch2": ("E", 9, 0, 1, 1, (), (0,)),   # chains on a wall face
    "kraty": ("E", 12, 1, 3, 1, (0,), ()),                 # iron bars (a row of them)
    "kraty_gora": ("E", 12, 0, 3, 1, (), (0,)),
    "slupek_kraty": ("E", 15, 1, 1, 2, (1,), (0,)),
    "nisze_czaszki": ("E", 0, 12, 3, 2, (0, 1), ()),       # bones in wall niches (on the face)
    "sarkofag": ("E", 4, 6, 2, 2, (0, 1), ()),             # a sealed sarcophagus
    "sarkofag_otwarty": ("E", 0, 6, 2, 3, (1, 2), (0,)),   # an open one, the dead still in it
    "sarkofag_pusty": ("E", 2, 6, 2, 3, (1, 2), (0,)),
    "plyta": ("E", 4, 8, 2, 1, (), ()),                    # a lid slab on the floor
    "trumna": ("E", 7, 6, 1, 3, (2,), (0, 1)),             # a coffin standing upright
    "oltarz": ("E", 0, 14, 1, 2, (1,), (0,)),              # a small altar stone
    "cokol": ("E", 3, 12, 1, 2, (1,), (0,)),               # a pedestal
    "studnia": ("E", 5, 14, 3, 2, (0, 1), ()),             # the round well (dry: dark inside)
    "pajeczyna": ("E", 8, 13, 2, 2, (), (0, 1)),           # a cobweb (over the hero)
    "pajeczyna_rog": ("E", 10, 13, 1, 2, (), (0, 1)),
    "plama": ("E", 8, 8, 1, 1, (), ()),
    # ---- the deeper bands (2026-10-06): caves (B), crystals, fungi, the diggers' things (D), bridges, beams, pillars, statues (C),
    # coffins, cages (E)
    "stalagmit": ("B", 0, 3, 1, 3, (1,), (0,)), "stalagmit2": ("B", 1, 3, 1, 3, (1,), (0,)),
    "skala_wysoka": ("B", 1, 8, 1, 2, (1,), (0,)), "glaz_szary": ("B", 0, 8, 1, 1, (0,), ()),
    "kupa_skal": ("B", 2, 9, 2, 2, (1,), (0,)), "kamien_plaski": ("B", 0, 10, 1, 1, (0,), ()),
    "kamien_okragly": ("B", 2, 11, 1, 1, (0,), ()), "gruz_szary": ("B", 0, 12, 2, 1, (), ()),
    "stalagmity_male": ("B", 2, 12, 2, 1, (0,), ()),
    "glaz_brazowy": ("B", 10, 4, 1, 1, (0,), ()), "stalagmit_br": ("B", 11, 4, 1, 2, (1,), (0,)),
    "stalagmit_br2": ("B", 12, 4, 1, 2, (1,), (0,)), "stalagmit_br3": ("B", 13, 4, 1, 2, (1,), (0,)),
    "kamyki_br": ("B", 14, 9, 1, 1, (), ()), "glazy_br": ("B", 12, 6, 2, 1, (0,), ()),
    "krysztal_nieb": ("D", 1, 0, 1, 2, (1,), (0,)), "krysztal_czerw": ("D", 4, 0, 1, 2, (1,), (0,)),
    "krysztal_zolty": ("D", 1, 2, 1, 2, (1,), (0,)), "krysztal_ziel": ("D", 4, 2, 1, 2, (1,), (0,)),
    "krysztal_maly": ("D", 0, 0, 1, 2, (1,), (0,)),
    "krysztaly_czerw": ("D", 6, 1, 2, 2, (1,), (0,)), "krysztaly_nieb": ("D", 6, 3, 2, 2, (1,), (0,)),
    "krysztaly_zolte": ("D", 2, 5, 2, 2, (1,), (0,)), "krysztaly_ziel": ("D", 5, 5, 2, 2, (1,), (0,)),
    "grzyb_duzy": ("D", 4, 8, 1, 2, (1,), (0,)), "grzyb_duzy2": ("D", 6, 8, 1, 2, (1,), (0,)),
    "grzybki": ("D", 4, 10, 2, 1, (), ()), "grzybek": ("D", 3, 10, 1, 1, (), ()),
    "grzyb_slup": ("D", 3, 11, 1, 3, (2,), (0, 1)), "grzyb_slup2": ("D", 2, 14, 1, 2, (1,), (0,)),
    "zarodniki": ("D", 5, 11, 2, 2, (), ()), "zarodniki_zolte": ("D", 7, 11, 1, 2, (), ()),
    "paprocie": ("D", 0, 13, 2, 2, (), ()), "mech_kepy": ("D", 0, 11, 2, 2, (), ()),
    "korzenie2": ("D", 2, 7, 2, 2, (), ()), "korzenie_swiec": ("D", 4, 6, 2, 2, (), ()),
    "poslanie": ("D", 9, 5, 1, 2, (), ()), "rumowisko": ("D", 10, 5, 2, 2, (1,), (0,)),
    "wejscie_sztolni": ("D", 8, 0, 1, 2, (0, 1), ()), "gruz_belka": ("D", 8, 3, 1, 2, (1,), (0,)),
    "kilof_oparty": ("D", 11, 1, 1, 2, (1,), (0,)), "deska_lezaca": ("D", 13, 4, 1, 1, (), ()),
    "wozek_ruda": ("D", 10, 0, 1, 2, (1,), (0,)), "wozek_pusty": ("D", 12, 2, 1, 2, (1,), (0,)),
    "most_poziomy": ("C", 0, 0, 5, 3, (0, 2), ()),        # a rope bridge across water: its deck (the middle row) is walked on
    "drabina": ("C", 0, 6, 1, 2, (), ()), "deski_rozbite": ("C", 2, 3, 2, 2, (), ()),
    "stempel": ("C", 12, 0, 1, 4, (3,), (0, 1, 2)), "stempel_t": ("C", 13, 2, 1, 2, (1,), (0,)),
    "filar_cegla": ("C", 10, 8, 1, 3, (2,), (0, 1)), "kolumna_zlota": ("C", 12, 8, 1, 4, (3,), (0, 1, 2)),
    "totem": ("C", 15, 8, 1, 4, (3,), (0, 1, 2)),
    "filar_osm": ("C", 9, 11, 1, 3, (2,), (0, 1)), "filar_osm_zlamany": ("C", 10, 11, 1, 3, (2,), (0, 1)),
    "kolumna_pochylona": ("C", 13, 10, 1, 2, (1,), (0,)), "kolumna_lezaca2": ("C", 14, 10, 1, 2, (1,), (0,)),
    "kikut": ("C", 11, 11, 1, 2, (1,), (0,)), "kamyki_c": ("C", 12, 12, 2, 1, (), ()),
    "posag_kaptur": ("C", 14, 13, 1, 3, (2,), (0, 1)), "posag_kaptur2": ("C", 15, 13, 1, 3, (2,), (0, 1)),
    "posag_szata": ("C", 13, 14, 1, 2, (1,), (0,)), "popiersie": ("C", 12, 15, 1, 1, (0,), ()),
    "nisza": ("C", 8, 11, 1, 2, (), (0, 1)), "okno_luk": ("C", 9, 14, 1, 2, (), (0, 1)), "strzelnica": ("C", 10, 14, 1, 2, (), (0, 1)),
    "kolumna_lodu": ("C", 11, 13, 1, 3, (2,), (0, 1)), "schody_kamienne": ("C", 14, 1, 2, 3, (), ()),
    "sarkofag_rozbity": ("E", 1, 9, 4, 2, (1,), (0,)), "trumna_mumia": ("E", 6, 9, 1, 3, (2,), (0, 1)),
    "trumna_otwarta": ("E", 7, 9, 1, 3, (2,), (0, 1)), "klatka": ("E", 8, 6, 1, 2, (1,), (0,)),
    "dyby": ("E", 11, 6, 1, 2, (1,), (0,)), "kraty_wysokie": ("E", 12, 0, 4, 2, (1,), (0,)),
    "lancuchy_deski": ("E", 8, 2, 2, 3, (2,), (0, 1)), "slup_kamienny": ("E", 3, 14, 1, 2, (1,), (0,)),
    "lawa_kamienna": ("E", 4, 14, 1, 2, (1,), (0,)), "kraty_podlogi": ("E", 11, 11, 2, 2, (), ()),
    "dzban_jeden": ("E", 6, 13, 1, 1, (0,), ()), "dzbany_dwa": ("E", 7, 13, 1, 1, (0,), ()),
    "obrecz": ("E", 13, 11, 3, 3, (0, 1, 2), ()),          # a round stone rim (a dry shaft, a cistern's mouth)
}

# band 2's B sheet = the Interior set's C sheet (on TILESET2 only): the order's furniture
PIECES_IN = {
    "in_regal": ("B", 3, 0, 1, 2, (1,), (0,)),                # a bookcase, books in rows
    "in_regal_k1": ("B", 0, 7, 1, 2, (1,), (0,)), "in_regal_k2": ("B", 1, 7, 1, 2, (1,), (0,)),
    "in_regal_k3": ("B", 2, 7, 1, 2, (1,), (0,)), "in_regal_k4": ("B", 3, 7, 1, 2, (1,), (0,)), "in_regal_k5": ("B", 4, 7, 1, 2, (1,), (0,)),
    "in_biurko": ("B", 3, 2, 1, 2, (1,), (0,)),               # a writing desk, a quill and an inkpot
    "in_szafka": ("B", 4, 2, 1, 2, (1,), (0,)), "in_polka": ("B", 5, 2, 1, 2, (1,), (0,)),
    "in_kredens": ("B", 6, 2, 2, 2, (1,), (0,)), "in_kredens_dol": ("B", 6, 4, 2, 2, (1,), (0,)),
    "in_spizarka": ("B", 0, 3, 1, 2, (1,), (0,)), "in_slojki": ("B", 1, 3, 1, 2, (1,), (0,)),
    "in_polki_jedzenie": ("B", 4, 4, 2, 2, (1,), (0,)), "in_polki_chleb": ("B", 5, 7, 1, 2, (1,), (0,)),
    "in_stol_dlugi": ("B", 9, 4, 3, 2, (0, 1), ()), "in_stol_dlugi2": ("B", 9, 6, 3, 2, (0, 1), ()),
    "in_stol": ("B", 12, 4, 2, 2, (0, 1), ()), "in_stol2": ("B", 12, 6, 2, 2, (0, 1), ()),
    "in_stol_kamienny": ("B", 9, 8, 3, 2, (0, 1), ()), "in_stol_kam_pion": ("B", 8, 7, 1, 3, (0, 1, 2), ()),
    "in_stol_pion": ("B", 8, 4, 1, 3, (0, 1, 2), ()), "in_stol_okragly": ("B", 15, 4, 1, 2, (0, 1), ()),
    "in_lawa": ("B", 14, 1, 2, 1, (0,), ()), "in_lawa_pion": ("B", 14, 2, 1, 3, (0, 1, 2), ()),
    "in_lawa_niska": ("B", 0, 15, 2, 1, (0,), ()),
    "in_krzeslo": ("B", 8, 0, 1, 2, (1,), (0,)), "in_krzeslo_l": ("B", 10, 0, 1, 2, (1,), (0,)), "in_krzeslo_p": ("B", 11, 0, 1, 2, (1,), (0,)),
    "in_stolek": ("B", 14, 0, 1, 1, (0,), ()), "in_stolek2": ("B", 15, 2, 1, 1, (0,), ()),
    "in_tron": ("B", 2, 14, 1, 2, (1,), (0,)), "in_tron2": ("B", 3, 14, 1, 2, (1,), (0,)),
    "in_lozko": ("B", 12, 10, 1, 3, (1, 2), (0,)), "in_lozko_ziel": ("B", 15, 10, 1, 3, (1, 2), (0,)),
    "in_lozko_slome": ("B", 9, 13, 1, 3, (1, 2), (0,)), "in_lozko_podw": ("B", 13, 10, 2, 3, (1, 2), (0,)),
    "in_lozko_poz": ("B", 8, 11, 2, 1, (0,), ()), "in_lozko_poz2": ("B", 10, 11, 2, 1, (0,), ()),
    "in_lozko_poz3": ("B", 8, 12, 2, 1, (0,), ()), "in_lozko_poz4": ("B", 10, 12, 2, 1, (0,), ()),
    "in_siennik": ("B", 2, 4, 1, 2, (), ()),                  # a straw mattress on the floor
    "in_szafa": ("B", 6, 9, 1, 2, (1,), (0,)), "in_kredens2": ("B", 3, 9, 2, 2, (1,), (0,)),
    "in_szafa_duza": ("B", 3, 11, 2, 2, (1,), (0,)), "in_szafa_rzezb": ("B", 6, 10, 2, 3, (2,), (0, 1)),
    "in_kosz": ("B", 1, 13, 1, 1, (0,), ()), "in_skrzyneczka": ("B", 0, 13, 1, 1, (0,), ()),
    "in_ksiazki": ("B", 0, 5, 1, 1, (), ()), "in_ksiazki2": ("B", 1, 5, 1, 1, (), ()),
    "in_chleb": ("B", 5, 6, 1, 1, (), ()), "in_talerze": ("B", 7, 6, 1, 1, (), ()), "in_ksiazki3": ("B", 3, 6, 1, 1, (), ()),
}


class DMap(NewMap):
    """a dungeon map on tileset 10 (or band 2's TILESET2)"""

    def __init__(self, map_id, W, H, display, note, bgm="", seed=1, tileset=TILESET):
        NewMap.__init__(self, map_id, W, H, tileset, display, note, seed, bgm=bgm, autoplay=True)
        self.tileset = tileset
        self.props["bgm"] = {"name": bgm, "pan": 0, "pitch": 100, "volume": 70}
        self.props["autoplayBgm"] = True           # (an empty name: the music of the place above stops down here)
        self.props["disableDashing"] = False
        self.floor = set()                          # walkable floor cells (for the checks)
        self.faces = set()
        self.spots = {}                             # name -> [x, y, dir]
        self.solid = set()                          # floor cells closed by things (pictures, pieces)

    # ------------------------------------------------------------------------------------------------ the shell
    def shell(self, floor_cells, floor_kind, wall, face=FACE, area=None, faces_over=None):
        """floor_cells get floor_kind (layer 0); over every floor cell whose north neighbour is not floor a wall face `face`
        rows tall (the side kind of `wall`), cut short by other floor; the rest of `area` (default: the whole map) the top."""
        top, side = wall
        area = set(area) if area is not None else set(self.all)
        floor_cells = set(floor_cells)
        for c in area - floor_cells:
            self.layers[0][c] = ("k", top)
        faces = set()
        for (x, y) in floor_cells:
            if (x, y - 1) in floor_cells: continue
            for k in range(1, face + 1):
                c = (x, y - k)
                if c in floor_cells or c not in area: break
                faces.add(c)
        for c in faces: self.layers[0][c] = ("k", side)
        for c in floor_cells: self.layers[0][c] = ("k", floor_kind)
        self.floor |= floor_cells
        self.faces |= faces
        return faces

    def shadows(self, cells=None):
        """the editor's wall shadow: the left half of a floor cell whose left neighbour is not floor"""
        for (x, y) in (cells if cells is not None else self.floor):
            if (x - 1, y) not in self.floor: self.shadow[(x, y)] = 5
            else: self.shadow.pop((x, y), None)

    def film(self, cells, kind):
        """a see-through film on layer 1 (dust, cracks, moss, rubble) - only over floor"""
        if isinstance(cells, int): cells, kind = kind, cells      # (either order: film(cells, kind) / film(kind, cells))
        for c in cells:
            if c in self.floor: self.layers[1][c] = ("k", kind)

    # ------------------------------------------------------------------------------------------------ tiles
    SHEETS = {"B": B, "C": C, "D": D, "E": E, "A5": A5}

    def t(self, sheet, col, row, x, y, z=2):
        self.tile(z, x, y, self.SHEETS[sheet](col, row))

    def tiles(self, sheet, col, row, w, h, x, y, z=2, solid_rows=(), skip=()):
        """a w x h block of a sheet at (x, y); solid_rows (0-based) only noted for the checks (the flags close them)"""
        f = self.SHEETS[sheet]
        for dy in range(h):
            for dx in range(w):
                if (dx, dy) in skip: continue
                self.tile(z, x + dx, y + dy, f(col + dx, row + dy))
        for r in solid_rows:
            for dx in range(w): self.solid.add((x + dx, y + r))

    def piece(self, name, x, y, z=2):
        """a catalogued piece (PIECES, or PIECES_IN on band 2's tileset) at (x, y); its block rows noted for the checks"""
        if name in PIECES_IN:
            assert self.tileset == TILESET2, "%s: an Interior piece on tileset %d" % (name, self.tileset)
            spec = PIECES_IN[name]
        else:
            spec = PIECES[name]
            assert not (spec[0] == "B" and self.tileset == TILESET2), "%s: a Dungeon B piece on band 2's tileset" % name
        sheet, col, row, w, h, block, star = spec[:7]
        skip = spec[7] if len(spec) > 7 else ()
        self.tiles(sheet, col, row, w, h, x, y, z=z, solid_rows=block, skip=skip)

    # ------------------------------------------------------------------------------------------------ events
    def ev(self, x, y, char="", index=0, direction=2, pattern=0, name="", priority=0, through=True, step=False, note="",
           trigger=0, cmds=None, pages=None, solid=None):
        """a picture event (direction fixed, like the props of the other builders); priority 1 + not through blocks its cell"""
        e = self.picture(x, y, char, index, direction, pattern, name=name, priority=priority, trigger=trigger, cmds=cmds,
                         note=note, through=through, step=step)
        if pages is not None: e["pages"] = pages
        if (priority == 1 and not through) if solid is None else solid:
            self.solid.add((x, y))
        return e

    def marker(self, x, y, name, note="", d=2):
        """an invisible marker (below the characters, through, no picture, no commands); the page's direction = the way
        one faces there (the town's convention)"""
        e = {"name": name, "note": note, "pages": [blank_page(priority=0, through=True, image={"direction": d})]}
        self.add(x, y, e)
        return e

    def light(self, x, y, note, name="Światło"):
        return NewMap.light(self, x, y, note, name)

    def spot(self, name, x, y, d=2):
        self.spots[name] = [x, y, d]

    # ------------------------------------------------------------------------------------------------ checks
    def walkable(self, x, y):
        return (x, y) in self.floor and (x, y) not in self.solid

    def reach(self, start):
        seen, todo = {start}, [start]
        while todo:
            x, y = todo.pop()
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                n = (x + dx, y + dy)
                if n not in seen and self.walkable(*n):
                    seen.add(n); todo.append(n)
        return seen

    def to_json(self):
        """the map as the editor writes it (dict) - for previews and checks"""
        props = dict(self.props)
        out = dict(props)
        out["data"] = self.resolve()
        out["events"] = self.build_events()
        return out

    def write_to(self, path):
        data, events = self.resolve(), self.build_events()
        write_map(path, dict(self.props), data, events)
        return len(events) - 1


# ---------------------------------------------------------------------------------------------------- event commands
def cmd(code, params, indent=0):
    return {"code": code, "indent": indent, "parameters": params}


def text(lines, face="", idx=0, bg=0, pos=2, speaker=""):
    """Show Text without a face (SpeechBubbles puts it over the hero / the speaker)"""
    out = [cmd(101, [face, idx, bg, pos, speaker])]
    out += [cmd(401, [l]) for l in lines]
    return out


def script(code_text):
    lines = code_text.split("\n")
    return [cmd(355, [lines[0]])] + [cmd(655, [l]) for l in lines[1:]]


def se(name, vol=80, pitch=100):
    return cmd(250, [{"name": name, "volume": vol, "pitch": pitch, "pan": 0}])


def transfer(mid, x, y, d, fade=0):
    return cmd(201, [0, mid, x, y, d, fade])


def indent(cmds, by):
    return [dict(c, indent=c.get("indent", 0) + by) for c in cmds]


def choice(question, options, branches, cancel=None):
    """a question (no face) and Show Choices; branches[i] = commands of option i; cancel: the option Esc picks (default the last)"""
    out = []
    if question:
        out += text([question] if isinstance(question, str) else list(question))
    out.append(cmd(102, [options, len(options) - 1 if cancel is None else cancel, 0, 2, 0]))
    for i, opt in enumerate(options):
        out.append(cmd(402, [i, opt]))
        out += indent(branches[i] if i < len(branches) else [], 1)
        out.append(cmd(0, [], 1))
    out.append(cmd(404, []))
    return out


def page(image=None, priority=0, trigger=0, through=False, cmds=None, step=False, cond=None, direction_fix=True):
    p = blank_page(priority=priority, trigger=trigger, image=image, through=through, cmds=cmds, step=step, direction_fix=direction_fix)
    if cond:
        p["conditions"].update(cond)
    return p


def sw_cond(switch_id):
    return {"switch1Valid": True, "switch1Id": switch_id}


def self_cond(ch="A"):
    return {"selfSwitchValid": True, "selfSwitchCh": ch}


# ---------------------------------------------------------------------------------------------------- pictures
class Sheets(R.Sheets):
    """the tileset's sheets (our flags, from flags10.py) and the character pictures: img/characters first, then the Dungeon and
    Interior sets' own characters folders. tileset: 10 or band 2's TILESET2 (its sheets known here before it is installed)"""

    def __init__(self, flags=None, tileset=TILESET):
        import flags10
        if tileset == TILESET2:
            names_ = TILESET2_NAMES
            if flags is None: flags = flags10.flags12()[0]
        else:
            ts = load_json(ROOT + "data/Tilesets.json")[tileset]
            names_ = ts["tilesetNames"]
            if flags is None: flags = flags10.flags10()[0]
        names = [(ROOT + "img/tilesets/" + n + ".png") if n else None for n in names_]
        from PIL import Image
        self.sets = [Image.open(n).convert("RGBA") if n else None for n in names]
        self.flags = flags
        self.chars, self.tiles = {}, {}
        self.lenient = True

    def char(self, name):
        from PIL import Image
        if name not in self.chars:
            for d in (ROOT + "img/characters/", DUNGEON_CHARS, INTERIOR_CHARS):
                p = d + name + ".png"
                if os.path.exists(p):
                    self.chars[name] = Image.open(p).convert("RGBA")
                    break
            else:
                self.missing = getattr(self, "missing", set()) | {name}
                self.chars[name] = None
        return self.chars[name]


def render(mp_json, out=None, box=None, scale=1.0, grid=False, sheets=None):
    S = sheets or Sheets(tileset=mp_json.get("tilesetId", TILESET))
    img = R.render(mp_json, S)
    if box:
        x0, y0, x1, y1 = box
        img = img.crop((x0 * 48, y0 * 48, (x1 + 1) * 48, (y1 + 1) * 48))
    if grid:
        sys.path.insert(0, os.path.join(ROOT, "tools", "interiors"))
        import irender as IR
        img = IR.grid(img, box[0] if box else 0, box[1] if box else 0, lines=False)
    if scale != 1.0:
        from PIL import Image
        img = img.resize((int(img.width * scale), int(img.height * scale)), Image.LANCZOS if scale < 1 else Image.NEAREST)
    if out:
        img.convert("RGB").save(out)
    return img
