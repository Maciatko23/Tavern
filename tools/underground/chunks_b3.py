# Band 3 "Jaskinie i podziemna rzeka" (floors 31-49): the chunk library Map142 on tileset 10. Natural caves below the order's
# walls: the river Milcząca (water to look at, never to drink), mushrooms to pick, iron ore to mine (ChoppableTree), crystals,
# the old quarry of the fortress's stone, the order's scouts' camp, a spiders' nest, the diggers' fresh cut from the mountains.
# Creature places (docs/PODZIEMIA.md "Stwory - kontrakt"): pajak, nietoperz, topielec.
from chunks_deep import *   # noqa: F401,F403

B3 = "31-49"


def b3_grota_grzybow(lib, ox, oy):
    """a mushroom grotto: big toadstools and fungus stalks, glowing spores, ferns, moss; mushrooms to pick"""
    rows = rows_of("###############",
                   "###############",
                   "###############",
                   "####.......####",
                   "##..........###",
                   "#.............#",
                   "#.............#",
                   "#.............#",
                   "#............##",
                   "##...........##",
                   "###.........###",
                   "###############")
    c = XChunk(lib, "Grota grzybów", ox, oy, rows, W_CAVE_MOSS, F_MOSSY, weight=3, floors=B3)
    c.door("N", 5, 3); c.door("S", 6, 10); c.door("W", 1, 5); c.door("E", 13, 6)
    c.stairs(9)
    c.piece("grzyb_duzy", 2, 4); c.piece("grzyb_duzy2", 12, 5)
    c.piece("grzyb_slup", 11, 7)
    c.piece("grzybki", 4, 8); c.piece("zarodniki", 7, 4); c.piece("paprocie", 9, 8)
    c.loot("grzyby", 3, 6, "grzyby"); c.loot("grzyby", 10, 5, "grzyby2"); c.loot("grzyby", 7, 9, "grzyby")
    c.torch(10)
    c.spawn("nietoperz", 7, 6); c.spawn("pajak", 12, 8)
    c.note(3, 9, "kartki")
    c.film(FILM_MOSS, [(2, 5), (3, 5), (5, 7), (6, 7), (10, 8), (8, 6), (4, 10), (5, 10)])
    c.film(FILM_GRASS, [(1, 6), (1, 7), (9, 4), (12, 7), (8, 9)])
    return c


def b3_przeprawa(lib, ox, oy):
    """the crossing: the river Milcząca falls out of the north wall and runs through the cave; the order's rope bridge over it"""
    rows = rows_of("#################",
                   "#################",
                   "#################",
                   "#.....~~~.......#",
                   "#.....~~~.......#",
                   "#.....~~~.......#",
                   "#.....~~~.......#",
                   "#.....~~~.......#",
                   "#.....~~~.......#",
                   "#.....~~~.......#",
                   "#.....~~~.......#",
                   "#################")
    c = XChunk(lib, "Przeprawa przez Milczącą", ox, oy, rows, W_CAVE, F_DIRT, weight=3, floors=B3)
    c.waterfall(6, 8)
    c.door("N", 2, 3); c.door("S", 12, 10); c.door("W", 1, 6); c.door("E", 15, 7)
    c.stairs(13)
    c.piece("most_poziomy", 5, 5)
    c.piece("stalagmit_br", 14, 3); c.piece("glaz_brazowy", 4, 9); c.piece("kamyki_br", 10, 9)
    c.piece("stalagmit_br3", 3, 3)
    c.loot("sakwa", 1, 10, "sakwa")
    c.torch(4); c.torch(11)
    c.spawn("topielec", 5, 9); c.spawn("topielec", 9, 3); c.spawn("nietoperz", 13, 6)
    c.note(14, 10, "kartki")
    c.film(FILM_DIRT, [(2, 7), (3, 7), (11, 5), (12, 5), (13, 8), (2, 9)])
    c.film(FILM_MOSS, [(5, 4), (5, 7), (9, 8), (9, 9), (5, 10)])
    return c


def b3_jezioro(lib, ox, oy):
    """an underground lake in the cave's corner, fed by a thin fall from the wall; pebbles on the shore"""
    rows = rows_of("################",
                   "################",
                   "################",
                   "#.......~~~~~..#",
                   "#......~~~~~~~.#",
                   "#.....~~~~~~~..#",
                   "#.....~~~~~~...#",
                   "#......~~~~....#",
                   "#..............#",
                   "#..............#",
                   "#..............#",
                   "################")
    c = XChunk(lib, "Podziemne jezioro", ox, oy, rows, W_CAVE_BROWN, F_DIRT_SLABS, weight=2, floors=B3)
    c.waterfall(9, 11)
    c.door("N", 2, 3); c.door("S", 7, 10); c.door("W", 1, 6); c.door("E", 14, 8)
    c.stairs(5)
    c.piece("stalagmit_br2", 14, 3); c.piece("kamyki_br", 5, 8); c.piece("glazy_br", 11, 9)
    c.piece("stalagmit_br", 1, 9)
    c.rock(13, 9, "!$Rock_Ore_Iron", chance=55)
    c.loot("grzyby", 3, 9, "grzyby"); c.loot("sakwa", 14, 10, "sakwa")
    c.torch(3)
    c.spawn("topielec", 6, 8); c.spawn("topielec", 12, 8); c.spawn("nietoperz", 3, 5)
    c.note(9, 10, "papiery")
    c.film(FILM_MOSS, [(5, 6), (6, 8), (10, 8), (11, 8), (13, 7), (14, 6)])
    return c


def b3_krysztaly(lib, ox, oy):
    """a crystal grotto: clusters of blue, red and yellow crystals growing out of the floor and the walls' feet; ore in the rock"""
    rows = rows_of("##############",
                   "##############",
                   "##############",
                   "###........###",
                   "#...........##",
                   "#............#",
                   "#............#",
                   "#............#",
                   "##...........#",
                   "##..........##",
                   "##############")
    c = XChunk(lib, "Kryształowa grota", ox, oy, rows, W_CAVE_BROWN, F_MOSSY, weight=2, floors=B3)
    c.door("N", 4, 3); c.door("S", 6, 9); c.door("W", 1, 5); c.door("E", 12, 6)
    c.stairs(8)
    c.piece("krysztaly_nieb", 9, 7)
    c.piece("krysztal_czerw", 3, 4)
    c.piece("krysztal_zolty", 10, 3); c.piece("krysztal_nieb", 7, 5); c.piece("krysztal_maly", 2, 7)
    c.rock(5, 7, "!$Rock_Ore_Iron_Chunk", chance=70)
    c.rock(11, 4, "!$Rock_Ore_Iron_Spire", chance=50)
    c.loot("grzyby", 4, 8, "grzyby2")
    c.spawn("nietoperz", 6, 6); c.spawn("nietoperz", 9, 5)
    c.note(11, 8, "kartki")
    c.film(FILM_DUST, [(3, 6), (4, 6), (8, 8), (9, 9)])
    return c


def b3_kamieniolom(lib, ox, oy):
    """the old underground quarry of the fortress's stone: timber props, a cart with ore, a pickaxe leaning on the wall, rubble,
    iron in the rock"""
    c = XChunk(lib, "Stary kamieniołom", ox, oy, full_rows(16, 11), W_CAVE_BEAMS, F_DIRT_SLABS, weight=2, floors=B3)
    c.door("N", 11, 3); c.door("S", 4, 9); c.door("W", 1, 6); c.door("E", 14, 5)
    c.stairs(7)
    c.piece("stempel", 3, 3); c.piece("stempel", 9, 3)
    c.piece("kilof_oparty", 5, 3)
    c.piece("rumowisko", 12, 7); c.piece("deska_lezaca", 8, 8); c.piece("kamyki_br", 7, 6)
    c.loot("wozek", 10, 6, "wozek")
    c.rock(2, 8, "!$Rock_Ore_Iron", chance=75); c.rock(13, 3, "!$Rock_Ore_Iron_Chunk", chance=60)
    c.rock(6, 8, "!$Rock_Pile", chance=60)
    c.torch(6); c.torch(13)
    c.spawn("pajak", 8, 7); c.spawn("nietoperz", 3, 6)
    c.note(1, 3, "pioro")
    c.film(FILM_RUBBLE, [(11, 8), (12, 9), (13, 9), (6, 4), (7, 4)])
    c.film(FILM_DIRT, [(2, 5), (3, 5), (9, 8), (10, 8)])
    return c


def b3_oboz_zwiadowcow(lib, ox, oy):
    """the order's scouts' camp: two bedrolls by a fire basket, a bag, a box, the scout's notes"""
    rows = rows_of("#############",
                   "#############",
                   "#############",
                   "##.........##",
                   "#...........#",
                   "#...........#",
                   "#...........#",
                   "#...........#",
                   "#...........#",
                   "#############")
    c = XChunk(lib, "Obóz zwiadowców", ox, oy, rows, W_CAVE, F_DIRT, weight=2, floors=B3)
    c.door("N", 9, 3); c.door("S", 3, 8); c.door("W", 1, 5); c.door("E", 11, 6)
    c.stairs(4)
    c.brazier(6, 6)
    c.piece("poslanie", 4, 5); c.piece("poslanie", 8, 5)
    c.loot("sakwa", 2, 7, "sakwa"); c.loot("skrzynka", 10, 8)
    c.piece("deska_lezaca", 7, 8)
    c.spawn("pajak", 9, 4)
    c.note(6, 4, "zwoj")
    c.film(FILM_DIRT, [(5, 7), (6, 7), (7, 7), (5, 8)])
    return c


def b3_gniazdo(lib, ox, oy):
    """a spiders' nest among the roots: webs thick as ropes in the corners, bones of whatever came too close"""
    rows = rows_of("##############",
                   "##############",
                   "##############",
                   "#..........###",
                   "#............#",
                   "#............#",
                   "#............#",
                   "#............#",
                   "#............#",
                   "##..........##",
                   "##############")
    c = XChunk(lib, "Pajęcze gniazdo", ox, oy, rows, W_CAVE_ROOTS, F_DIRT, weight=2, floors=B3)
    c.door("N", 3, 3); c.door("S", 8, 9); c.door("W", 1, 6); c.door("E", 12, 5)
    c.stairs(8)
    c.piece("pajeczyna", 1, 3, z=3); c.piece("pajeczyna", 10, 7, z=3); c.piece("pajeczyna_rog", 12, 3, z=3)
    c.piece("korzenie2", 5, 6); c.piece("korzenie", 9, 4)
    c.piece("kosci", 4, 8); c.piece("czaszki", 7, 5); c.piece("szkielet", 11, 8)
    c.loot("kosci", 6, 9, "kosci")
    c.spawn("pajak", 6, 7); c.spawn("pajak", 10, 5); c.spawn("pajak", 3, 5)
    c.note(2, 9, "kartki")
    c.film(FILM_DIRT, [(2, 4), (3, 5), (9, 8), (8, 8)])
    return c


def b3_stalagmity(lib, ox, oy):
    """a hall of stalagmites: stone teeth growing from the floor, bats under the vault, a rock or two to break"""
    c = XChunk(lib, "Sala stalagmitów", ox, oy, full_rows(17, 12), W_CAVE, F_MOSSY, weight=2, floors=B3)
    c.door("N", 13, 3); c.door("S", 6, 10); c.door("W", 1, 8); c.door("E", 15, 4)
    c.stairs(3)
    for (x, y) in ((5, 4), (9, 6), (12, 8)): c.piece("stalagmit", x, y)
    for (x, y) in ((7, 3), (3, 7)): c.piece("stalagmit2", x, y)
    c.piece("stalagmity_male", 10, 3); c.piece("stalagmity_male", 13, 9)
    c.piece("kupa_skal", 14, 6)
    c.piece("glaz_szary", 8, 9); c.piece("gruz_szary", 2, 10)
    c.rock(4, 9, "!$Rock_Grey", chance=60)
    c.loot("monety", 11, 4)
    c.spawn("nietoperz", 8, 6); c.spawn("nietoperz", 4, 5); c.spawn("pajak", 12, 10)
    c.note(10, 10, "papiery")
    c.film(FILM_MOSS, [(6, 6), (7, 7), (11, 5), (2, 9), (13, 7)])
    return c


def b3_rozpadlina(lib, ox, oy):
    """a chasm opens in the cave's floor - one walks round it on the ledges; broken planks of an old crossing at its edge"""
    rows = rows_of("################",
                   "################",
                   "################",
                   "#..............#",
                   "#..............#",
                   "#..............#",
                   "#..............#",
                   "#..............#",
                   "#..............#",
                   "#..............#",
                   "################")
    c = XChunk(lib, "Rozpadlina", ox, oy, rows, W_CAVE_BROWN, F_DIRT_SLABS, weight=2, floors=B3)
    c.door("N", 2, 3); c.door("S", 12, 9); c.door("W", 1, 7); c.door("E", 14, 4)
    c.stairs(11)
    c.film(FILM_HOLE, [(x, y) for x in range(5, 11) for y in range(5, 8)] + [(6, 4), (7, 4), (8, 8), (9, 8)])
    c.piece("deski_rozbite", 3, 5)
    c.piece("stalagmit_br", 12, 6); c.piece("glaz_brazowy", 4, 8); c.piece("kamyki_br", 11, 4)
    c.loot("kosci", 13, 8, "kosci")
    c.torch(4)
    c.spawn("nietoperz", 7, 3); c.spawn("pajak", 3, 9)
    c.note(9, 3, "kartki")
    c.film(FILM_DIRT, [(2, 4), (3, 4), (12, 3), (13, 3), (6, 9), (7, 9)])
    return c


def b3_przekop(lib, ox, oy):
    """the diggers' cut: fresh timbering, a collapsed adit in the wall, their lamp still on a nail, a cart, a bag left behind"""
    c = XChunk(lib, "Przekop kopaczy", ox, oy, full_rows(14, 10), W_CAVE_BEAMS, F_DIRT, weight=2, floors=B3)
    c.door("N", 2, 3); c.door("S", 9, 8); c.door("W", 1, 6); c.door("E", 12, 4)
    c.stairs(11)
    c.piece("wejscie_sztolni", 6, 1)
    c.piece("stempel_t", 4, 3); c.piece("stempel_t", 8, 3)
    c.lantern(5, 4)
    c.piece("gruz_belka", 7, 6); c.piece("wozek_ruda", 10, 6)
    c.loot("sakwa", 3, 8, "sakwa"); c.loot("wozek", 12, 8, "wozek")
    c.rock(2, 5, "!$Rock_Ore_Iron_Twin", chance=50)
    c.spawn("pajak", 8, 7); c.spawn("nietoperz", 4, 6)
    c.note(6, 4, "kartki")
    c.film(FILM_RUBBLE, [(6, 3), (7, 3), (7, 4)])
    c.film(FILM_DIRT, [(3, 6), (4, 7), (10, 4), (11, 5)])
    return c


CHUNKS = [b3_grota_grzybow, b3_przeprawa, b3_jezioro, b3_krysztaly, b3_kamieniolom, b3_oboz_zwiadowcow, b3_gniazdo, b3_stalagmity,
          b3_rozpadlina, b3_przekop]
LIBRARY = dict(map_id=142, title="Podziemia: kawałki (pasmo 3)", band=3, floors="31-49", tileset=TILESET, rock=80)
