# Band 2 "Kwatery i kaplica zakonu" (floors 11-29): the chunk library Map141 on band 2's tileset (uglib.TILESET2 - the Dungeon set
# with the Interior set's furniture as its B sheet). The order's daily life: cells, the refectory, the dormitory, the chapel, a hall
# of the question, the scriptorium, the kitchen, the armoury, a dry water store, the crypt, the cell of penance.
# Creature places (docs/PODZIEMIA.md "Stwory - kontrakt"): szczur, pajak, zbroja.
from chunks_deep import *   # noqa: F401,F403

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
    c.piece("wiadro_puste", 11, 5)
    c.piece("lancuch", 2, 2); c.piece("lancuch2", 10, 2)
    c.piece("kosci2", 2, 5)
    c.loot("skrzynka", 7, 3); c.loot("worek", 11, 3, "worek")
    c.torch(14)
    c.spawn("szczur", 4, 8); c.spawn("pajak", 12, 8)
    c.note(15, 5, "kartki")
    c.film(FILM_DUST, [(1, 7), (2, 7), (5, 8), (6, 8), (13, 6), (14, 6), (9, 9)])
    return c


def b2_refektarz(lib, ox, oy):
    """the refectory: two long tables with benches on both sides, the reader's lectern in the aisle between them, jugs, a barrel"""
    c = XChunk(lib, "Refektarz", ox, oy, full_rows(18, 12), W_BEIGE, F_BROWN_SLAB, weight=3, floors=B2)
    c.door("N", 2, 3); c.door("S", 13, 10); c.door("W", 1, 8); c.door("E", 16, 5)
    c.stairs(14)
    for x0 in (3, 10):
        for k in (0, 2, 4):
            c.piece("in_lawa", x0 + k, 4)
            c.piece("in_lawa", x0 + k, 7)
        c.piece("in_stol_dlugi", x0, 5); c.piece("in_stol_dlugi", x0 + 3, 5)
    c.t("B", 5, 6, 4, 5, z=3); c.t("B", 7, 6, 7, 5, z=3); c.t("B", 7, 6, 11, 5, z=3); c.t("B", 5, 6, 14, 5, z=3)
    c.pic(9, 3, "!$Altar", 0, 2, 0, "Pulpit lektora")
    c.loot("dzban", 16, 9, "dzbany"); c.loot("beczka", 1, 3)
    c.piece("dzbany_grupa2", 14, 8)
    c.torch(6); c.torch(12)
    c.spawn("szczur", 8, 9); c.spawn("szczur", 3, 9)
    c.note(9, 9, "papiery")
    c.film(FILM_DUST, [(2, 6), (2, 7), (9, 6), (9, 7), (11, 9), (12, 9)])
    return c


def b2_dormitorium(lib, ox, oy):
    """the dormitory: a row of narrow beds under the north wall, a chest at the foot of some, a wardrobe, a table with a stool"""
    c = XChunk(lib, "Dormitorium", ox, oy, full_rows(17, 11), W_LIGHT, F_ORNATE, weight=3, floors=B2)
    c.door("N", 13, 3); c.door("S", 5, 9); c.door("W", 1, 7); c.door("E", 15, 6)
    c.stairs(15)
    for x in (2, 4, 6, 8, 10): c.piece("in_lozko" if x != 6 else "in_lozko_ziel", x, 3)
    c.piece("in_szafa", 12, 3)
    c.piece("in_stol_okragly", 8, 7); c.piece("in_stolek", 9, 8)
    c.loot("skrzynka", 2, 6); c.loot("skrzynka", 10, 6)
    c.loot("worek", 13, 9, "worek")
    c.torch(1); c.torch(11)
    c.spawn("szczur", 4, 8); c.spawn("pajak", 12, 7)
    c.note(6, 6, "kartki")
    c.film(FILM_DUST, [(3, 7), (4, 7), (7, 6), (11, 8), (12, 8), (14, 4)])
    return c


def b2_kaplica(lib, ox, oy):
    """the order's chapel: the altar under the north wall between two candelabra, hooded stone brothers in the corners, rows of
    benches either side of the aisle"""
    c = XChunk(lib, "Kaplica zakonu", ox, oy, full_rows(15, 13), W_ARCHES, F_SLATE_SQ, weight=2, floors=B2)
    c.kind([(x, y) for x in (6, 7, 8) for y in range(3, 12)], F_GREY_TILE)     # the aisle
    c.door("N", 11, 3); c.door("S", 6, 11); c.door("W", 1, 7); c.door("E", 13, 9)
    c.stairs(3)
    c.piece("oltarz", 7, 2)
    c.candle(5, 3, big=True); c.candle(9, 3, big=True)
    c.piece("posag_kaptur", 1, 3); c.piece("posag_kaptur2", 13, 3)
    for y in (6, 8, 10):
        c.piece("in_lawa", 2, y); c.piece("in_lawa", 4, y)
        c.piece("in_lawa", 9, y); c.piece("in_lawa", 11, y)
    c.note(7, 4, "ksiega")
    c.loot("dzban", 1, 11, "dzban")
    c.spawn("zbroja", 7, 8); c.spawn("szczur", 12, 11)
    c.film(FILM_DUST, [(2, 5), (3, 5), (10, 7), (11, 7), (5, 11), (4, 11)])
    return c


def b2_sala_pytania(lib, ox, oy):
    """a small hall of the question: the carved circle in the floor, the asker's tall chair facing it, candles round the circle,
    the rule of the rite on a scroll"""
    c = XChunk(lib, "Sala pytania", ox, oy, full_rows(13, 12), W_GREY_PILLARS, F_BLUEGREY, weight=2, floors=B2)
    c.door("N", 9, 3); c.door("S", 6, 10); c.door("W", 1, 8); c.door("E", 11, 6)
    c.stairs(4)
    for dy in range(3):
        for dx in range(3): c.t("A5", 3 + dx, 11 + dy, 5 + dx, 6 + dy, z=1)
    c.piece("in_tron2", 6, 4)
    for (x, y) in ((4, 5), (8, 5), (4, 9), (8, 9)): c.candle(x, y, chance=70)
    c.note(2, 4, "zwoj")
    c.loot("dzban", 10, 9, "dzbany")
    c.spawn("zbroja", 6, 7); c.spawn("pajak", 2, 9)
    c.film(FILM_DUST, [(2, 6), (3, 6), (9, 8), (10, 8)])
    return c


def b2_skryptorium(lib, ox, oy):
    """the scriptorium: the order's books along the north wall, three writing desks, papers dropped on the floor"""
    c = XChunk(lib, "Skryptorium", ox, oy, full_rows(15, 10), W_LIGHT, F_GREY_TILE, weight=2, floors=B2)
    c.door("N", 12, 3); c.door("S", 3, 8); c.door("W", 1, 6); c.door("E", 13, 5)
    c.stairs(7)
    for k, x in enumerate((1, 2, 3, 4, 5)): c.piece("in_regal_k%d" % (k + 1), x, 3)
    for x in (7, 9, 11): c.piece("in_biurko", x, 5)
    c.candle(8, 5)
    c.pic(10, 8, *ART["papiery"], name="Rozrzucone kartki", priority=0)
    c.loot("skrzynka", 1, 8)
    c.torch(9)
    c.spawn("pajak", 6, 7)
    c.note(5, 6, "ksiega")
    c.film(FILM_DUST, [(6, 4), (7, 7), (8, 7), (12, 7), (13, 8)])
    return c


def b2_kuchnia(lib, ox, oy):
    """the order's kitchen: the fire in the wall, a dresser with dishes, shelves of food, a table with bread, barrels, sacks"""
    c = XChunk(lib, "Kuchnia zakonu", ox, oy, full_rows(14, 10), W_ROUGH, F_COBBLE, weight=2, floors=B2)
    c.door("N", 4, 3); c.door("S", 6, 8); c.door("W", 1, 5); c.door("E", 12, 6)
    c.stairs(12)
    c.piece("palenisko", 7, 1)
    c.lib.light(*c.L(8, 2), "<Light:170,255,150,80><LightFlicker:0.15,255,120,50><LightHeight:22>", "Ogień w murze")
    c.piece("in_kredens", 1, 3)
    c.piece("in_polki_jedzenie", 10, 3)
    c.piece("in_stol", 6, 5)
    c.t("B", 5, 6, 6, 5, z=3)
    c.piece("beczki_dwie", 9, 7)
    c.piece("worki_stos", 1, 7)
    c.loot("beczka", 11, 8); c.loot("worek", 3, 8, "worek"); c.loot("dzban", 9, 3, "dzbany")
    c.spawn("szczur", 4, 6); c.spawn("szczur", 8, 8)
    c.note(3, 5, "kartki")
    c.film(FILM_DUST, [(4, 5), (5, 5), (8, 6), (11, 5)])
    return c


def b2_zbrojownia(lib, ox, oy):
    """the armoury: empty suits of armour on their stands under the north wall, crates, a chest of the watch"""
    c = XChunk(lib, "Zbrojownia", ox, oy, full_rows(14, 10), W_GREY, F_SLATE, weight=2, floors=B2)
    c.door("N", 11, 3); c.door("S", 6, 8); c.door("W", 1, 6); c.door("E", 12, 6)
    c.stairs(1)
    for x in (3, 5, 7, 9): c.pic(x, 3, "!$Ug_Guardian", 0, 2, 0, "Pusta zbroja na stojaku")
    c.piece("skrzynka_zamknieta", 9, 6); c.piece("skrzynka_plotno", 10, 6)
    c.loot("skrzynia", 4, 7, "skrzynia_szara")
    c.torch(6)
    c.spawn("zbroja", 4, 5); c.spawn("zbroja", 8, 5)
    c.note(2, 7, "pioro")
    c.film(FILM_DUST, [(2, 5), (3, 5), (10, 4), (7, 7)])
    return c


def b2_zbiornik(lib, ox, oy):
    """a small water store of the order, long dry: a round stone rim over a dark shaft, drains, moss where the water stood - and
    one stale puddle in the corner (not for drinking)"""
    rows = rows_of("###############",
                   "###############",
                   "###############",
                   "#.............#",
                   "#.............#",
                   "#.............#",
                   "#.............#",
                   "#.............#",
                   "#.............#",
                   "#~~...........#",
                   "#~~...........#",
                   "###############")
    c = XChunk(lib, "Zbiornik zakonu", ox, oy, rows, W_MOSSY, F_GREEN_BRICK, weight=2, floors=B2, water=0)
    c.door("N", 10, 3); c.door("S", 6, 10); c.door("W", 1, 6); c.door("E", 13, 5)
    c.stairs(4)
    c.piece("obrecz", 6, 5)
    c.film(FILM_HOLE, [(7, 6)])
    c.t("A5", 2, 0, 3, 7, z=1); c.t("A5", 3, 0, 11, 9, z=1)
    c.piece("wiadro_puste", 4, 9)
    c.loot("dzban", 12, 9, "dzbany"); c.loot("dzban", 1, 3, "dzban")
    c.spawn("szczur", 10, 8)
    c.note(2, 4, "zwoj")
    c.film(FILM_MOSS, [(3, 9), (3, 10), (5, 5), (9, 5), (5, 8), (9, 8), (2, 8)])
    return c


def b2_krypta(lib, ox, oy):
    """the brothers' crypt: bones in the wall's niches, coffins standing and lying, a broken sarcophagus, candles burnt down"""
    c = XChunk(lib, "Krypta braci", ox, oy, full_rows(15, 11), W_ARCHES, F_SLATE_SQ, weight=2, floors=B2)
    c.door("N", 11, 3); c.door("S", 6, 9); c.door("W", 1, 7); c.door("E", 13, 6)
    c.stairs(2)
    c.piece("nisze_czaszki", 5, 1)
    c.piece("trumna_mumia", 4, 3); c.piece("trumna_otwarta", 9, 3)
    c.piece("sarkofag", 2, 6); c.piece("sarkofag_rozbity", 8, 6)
    c.candle(6, 4, chance=50); c.candle(8, 4, chance=50)
    c.loot("kosci", 12, 9, "kosci"); c.loot("dzban", 1, 4, "dzbany")
    c.spawn("pajak", 7, 8); c.spawn("szczur", 4, 9)
    c.note(10, 9, "ksiega")
    c.film(FILM_DUST, [(5, 5), (6, 5), (11, 8), (12, 8), (2, 9), (3, 9)])
    return c


def b2_cela_pokutna(lib, ox, oy):
    """the cell of penance: a pillory, chains on the wall, a hanging cage, a straw mattress, bones"""
    c = XChunk(lib, "Cela pokutna", ox, oy, full_rows(12, 9), W_GREYBRICK, F_DIRT, weight=1, floors=B2)
    c.door("N", 8, 3); c.door("S", 3, 7); c.door("W", 1, 4); c.door("E", 10, 5)
    c.stairs(5)
    c.piece("dyby", 3, 3)
    c.piece("lancuch", 2, 2); c.piece("lancuch2", 7, 2)
    c.pic(7, 5, "!Fantasy_hanging_cage", 0, 2, 0, "Wisząca klatka", priority=1)
    c.piece("in_siennik", 9, 6)
    c.piece("kosci3", 5, 6); c.piece("czaszki", 2, 6)
    c.loot("kosci", 6, 7, "kosci")
    c.spawn("szczur", 4, 5)
    c.film(FILM_DUST, [(2, 5), (8, 6), (8, 7)])
    return c


CHUNKS = [b2_cele, b2_refektarz, b2_dormitorium, b2_kaplica, b2_sala_pytania, b2_skryptorium, b2_kuchnia, b2_zbrojownia,
          b2_zbiornik, b2_krypta, b2_cela_pokutna]
LIBRARY = dict(map_id=141, title="Podziemia: kawałki (pasmo 2)", band=2, floors="11-29", tileset=TILESET2, rock=115)
