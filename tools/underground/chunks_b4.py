# Band 4 "Ruiny starsze niż zakon" (floors 51-75): the chunk library Map143 on tileset 10. What was here before the fortress:
# dark gothic walls the order's masons could not have built, reliefs of people kneeling before a light with their faces chiselled
# away (make_props.py: !Ug_Reliefs), stone circles, carved pillars with faces, an empty altar, bones all facing down, a dry well.
# Who the first ones were is left open on purpose (STORY.md) - the rooms only show what they left.
# Creature places (docs/PODZIEMIA.md "Stwory - kontrakt"): zbroja, kamiennik.
from chunks_deep import *   # noqa: F401,F403

B4 = "51-75"


def b4_plaskorzezby(lib, ox, oy):
    """a hall of reliefs: three carved panels in the north wall, two robed stone figures facing them, dust"""
    c = XChunk(lib, "Sala płaskorzeźb", ox, oy, full_rows(16, 11), W_GOTHIC, F_SLATE_SQ, weight=3, floors=B4)
    c.door("N", 11, 3); c.door("S", 7, 9); c.door("W", 1, 6); c.door("E", 14, 7)
    c.stairs(6)
    c.relief(3, 0); c.relief(8, 1); c.relief(12, 2)
    c.piece("posag_szata", 3, 5); c.piece("posag_szata", 9, 5)
    c.piece("kamyki_c", 12, 8)
    c.loot("monety", 2, 9)
    c.spawn("kamiennik", 6, 7); c.spawn("zbroja", 12, 5)
    c.note(5, 8, "zwoj")
    c.film(FILM_DUST, [(2, 4), (4, 6), (10, 7), (11, 7), (13, 9)])
    c.film(FILM_CRACKS, [(7, 5), (7, 6), (12, 4)])
    return c


def b4_krag(lib, ox, oy):
    """a stone circle: the carved ring in the floor, four pillars with carved faces round it, nothing else"""
    c = XChunk(lib, "Kamienny krąg", ox, oy, full_rows(15, 12), W_GOTHIC2, F_BLUEGREY, weight=2, floors=B4)
    c.door("N", 2, 3); c.door("S", 11, 10); c.door("W", 1, 8); c.door("E", 13, 5)
    c.stairs(11)
    for dy in range(3):
        for dx in range(3): c.t("A5", 3 + dx, 11 + dy, 6 + dx, 6 + dy, z=1)
    for (x, y) in ((4, 3), (10, 3), (4, 7), (10, 7)): c.piece("totem", x, y)
    c.loot("relikwiarz", 7, 4, "relikwiarz")
    c.spawn("kamiennik", 7, 7)
    c.note(2, 10, "kartki")
    c.film(FILM_CRACKS, [(5, 6), (9, 8), (6, 9), (8, 5)])
    c.film(FILM_DUST, [(2, 5), (3, 5), (12, 9), (12, 8)])
    return c


def b4_kolumnada(lib, ox, oy):
    """a colonnade of eight-sided pillars, some broken off, one lying across the floor"""
    c = XChunk(lib, "Kolumnada", ox, oy, full_rows(17, 12), W_NICHES, F_SLATE, weight=2, floors=B4)
    c.door("N", 8, 3); c.door("S", 3, 10); c.door("W", 1, 6); c.door("E", 15, 8)
    c.stairs(13)
    for x in (3, 6, 11, 14):
        c.piece("filar_osm" if x in (3, 11) else "filar_osm_zlamany", x, 3)
        c.piece("filar_osm_zlamany" if x in (3, 14) else "filar_osm", x, 7)
    c.piece("kolumna_lezaca2", 9, 6); c.piece("kikut", 8, 9)
    c.piece("kamyki_c", 5, 10)
    c.loot("kosci", 12, 10, "kosci")
    c.spawn("zbroja", 7, 6); c.spawn("zbroja", 12, 6)
    c.note(1, 3, "pioro")
    c.film(FILM_RUBBLE, [(9, 8), (10, 8), (7, 9), (4, 6)])
    c.film(FILM_DUST, [(13, 4), (13, 5), (2, 9)])
    return c


def b4_oltarz(lib, ox, oy):
    """the empty altar: a stone altar with a hollow on top - something lay there once - between two carved pillars"""
    c = XChunk(lib, "Ołtarz bez boga", ox, oy, full_rows(13, 11), W_SPIKES, F_SLATE_SQ, weight=2, floors=B4)
    c.door("N", 2, 3); c.door("S", 8, 9); c.door("W", 1, 7); c.door("E", 11, 5)
    c.stairs(10)
    c.piece("oltarz", 6, 4)
    c.piece("totem", 4, 3); c.piece("totem", 8, 3)
    c.piece("plyta", 5, 7)
    c.loot("relikwiarz", 9, 7, "relikwiarz"); c.loot("monety", 3, 8)
    c.spawn("kamiennik", 6, 7)
    c.note(10, 9, "zwoj")
    c.film(FILM_CRACKS, [(6, 6), (5, 8), (7, 8)])
    return c


def b4_kosci(lib, ox, oy):
    """the hall of the seated dead: skeletons where they sat down and never rose, all facing the same way - down"""
    c = XChunk(lib, "Sala siedzących", ox, oy, full_rows(15, 10), W_BLOCKS, F_GREENTILE, weight=2, floors=B4)
    c.door("N", 11, 3); c.door("S", 5, 8); c.door("W", 1, 4); c.door("E", 13, 6)
    c.stairs(3)
    for (x, y) in ((3, 5), (6, 5), (9, 5), (4, 7), (8, 7), (11, 7)): c.piece("szkielet", x, y)
    c.piece("czaszki", 7, 4); c.piece("kosci3", 12, 5); c.piece("kosci2", 2, 7)
    c.piece("popiersie", 7, 3)
    c.loot("kosci", 10, 4, "kosci")
    c.spawn("zbroja", 9, 7)
    c.note(2, 3, "kartki")
    c.film(FILM_DUST, [(5, 6), (6, 6), (10, 6), (3, 8)])
    return c


def b4_brama(lib, ox, oy):
    """a walled-up gate of the first ones in the north wall, stone hooded figures facing inward, toward the room"""
    c = XChunk(lib, "Zamurowana brama", ox, oy, full_rows(14, 11), W_GOTHIC, F_BLUEGREY, weight=2, floors=B4)
    c.door("N", 2, 3); c.door("S", 9, 9); c.door("W", 1, 7); c.door("E", 12, 5)
    c.stairs(11)
    c.pic(7, 2, "!Gate_Dungeon1", 0, 6, 0, "Zamurowana brama", priority=1)
    c.piece("posag_kaptur", 5, 3); c.piece("posag_kaptur2", 9, 3)
    c.piece("kamyki_c", 3, 9)
    c.loot("monety", 12, 9)
    c.spawn("kamiennik", 7, 6); c.spawn("kamiennik", 4, 8)
    c.note(10, 7, "zwoj")
    c.film(FILM_CRACKS, [(6, 5), (7, 5), (8, 7)])
    c.film(FILM_DUST, [(2, 6), (11, 8), (12, 8)])
    return c


def b4_sanktuarium(lib, ox, oy):
    """a collapsed sanctuary: half of the vault came down - rubble, broken columns, a reliquary half buried"""
    rows = rows_of("################",
                   "################",
                   "################",
                   "#.........######",
                   "#.........######",
                   "#..............#",
                   "#..............#",
                   "#..............#",
                   "#..............#",
                   "#..............#",
                   "#..............#",
                   "################")
    c = XChunk(lib, "Zawalone sanktuarium", ox, oy, rows, W_BLOCKS, F_SLATE, weight=2, floors=B4)
    c.door("N", 2, 3); c.door("S", 7, 10); c.door("W", 1, 7); c.door("E", 14, 6)
    c.stairs(8)
    c.piece("glazy", 10, 5); c.piece("gruz", 12, 7); c.piece("kolumna_lezaca", 5, 6)
    c.piece("kikut", 4, 3)
    c.piece("kamien", 9, 8); c.piece("kamyki", 13, 9)
    c.loot("relikwiarz", 11, 9, "relikwiarz")
    c.spawn("zbroja", 7, 8); c.spawn("kamiennik", 12, 5)
    c.note(2, 10, "kartki")
    c.film(FILM_RUBBLE, [(9, 5), (10, 6), (11, 7), (12, 6), (13, 6), (8, 7), (9, 6)])
    return c


def b4_studnia(lib, ox, oy):
    """the first ones' well: a round well, dark and dry, a relief over it on the wall"""
    c = XChunk(lib, "Studnia Pierwszych", ox, oy, full_rows(13, 11), W_GOTHIC2, F_SLATE_SQ, weight=2, floors=B4)
    c.door("N", 9, 3); c.door("S", 3, 9); c.door("W", 1, 5); c.door("E", 11, 7)
    c.stairs(4)
    c.relief(6, 0)
    c.piece("studnia", 5, 5)
    c.piece("posag_szata", 2, 3)
    c.loot("dzban", 10, 9, "dzbany")
    c.spawn("kamiennik", 6, 8)
    c.note(9, 5, "zwoj")
    c.film(FILM_CRACKS, [(4, 7), (8, 7), (6, 8)])
    return c


def b4_misa(lib, ox, oy):
    """the hall of the bowl: a round stone basin, dry, under the relief of the one who poured the water"""
    c = XChunk(lib, "Sala misy", ox, oy, full_rows(14, 10), W_NICHES, F_GREENTILE, weight=2, floors=B4)
    c.door("N", 2, 3); c.door("S", 9, 8); c.door("W", 1, 6); c.door("E", 12, 4)
    c.stairs(11)
    c.relief(7, 1)
    c.piece("obrecz", 6, 4)
    c.film(FILM_DUST, [(7, 5)])
    c.piece("dzban_duzy", 4, 4); c.piece("dzbany_dwa", 10, 6)
    c.loot("dzban", 3, 8, "dzban")
    c.spawn("zbroja", 9, 6)
    c.note(11, 8, "kartki")
    c.film(FILM_CRACKS, [(5, 7), (6, 7), (9, 4)])
    return c


def b4_twarze(lib, ox, oy):
    """the chamber of faces: pillars with carved faces, stone heads on pedestals, the relief of the one who stands alone"""
    c = XChunk(lib, "Komnata twarzy", ox, oy, full_rows(13, 10), W_GOTHIC, F_BLUEGREY, weight=2, floors=B4)
    c.door("N", 9, 3); c.door("S", 3, 8); c.door("W", 1, 5); c.door("E", 11, 6)
    c.stairs(4)
    c.relief(6, 2)
    c.piece("totem", 2, 3); c.piece("totem", 8, 3)
    c.piece("cokol", 4, 6); c.piece("cokol", 9, 6)
    c.loot("relikwiarz", 6, 7, "relikwiarz")
    c.spawn("kamiennik", 8, 7)
    c.note(10, 4, "zwoj")
    c.film(FILM_DUST, [(5, 5), (2, 7), (10, 8)])
    return c


CHUNKS = [b4_plaskorzezby, b4_krag, b4_kolumnada, b4_oltarz, b4_kosci, b4_brama, b4_sanktuarium, b4_studnia, b4_misa, b4_twarze]
LIBRARY = dict(map_id=143, title="Podziemia: kawałki (pasmo 4)", band=4, floors="51-75", tileset=TILESET, rock=100)
