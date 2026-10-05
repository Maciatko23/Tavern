# The rooms of the ground floor (second build), one function each: what stands where. Coordinates are map cells; a
# room's north wall face is the WALL_H rows above its floor (v2layout.py). The gameplay hooks, the people and the lights
# that belong to a room are placed here too (with the ids the plugins' tests know).
#
# Composition rules (the tileset author's own, from his sample interior): furniture stands on the first floor row with its
# top over the wall; a centrepiece in the middle of the north wall (a fireplace, a stove, a stage), the same thing either
# side of it; one main group in the middle of the room on a rug; smaller groups and corner things (plants, barrels) lower
# down; every doorway keeps two clear cells in front of it.
from kit import P, ITEM, lamp

def clear(m, *cells):
    pass

# ================================================================================================ the great hall
def great_hall(m, k):
    # ---- the north wall: two stone chimney breasts with fireplaces, the bar's back wall between them
    for cx in (40, 60):
        m.wall_seg(cx - 1, cx + 1, 53, 55, 71)
        k.fireplace(cx, 56, kind=2)
        k.firewood(cx - 2, 56); k.firewood(cx + 2, 56)
        k.rug(cx - 1, 57, cx + 1, 59, 21)
        k.put("arm_e", cx - 2, 58); k.put("arm_w", cx + 2, 58)
        k.put("round_cloth", cx, 59)
        k.on("glass", cx, 58)
    k.put("plant", 37, 56); k.put("plant", 63, 56)
    k.lantern(38, 53, small=True); k.lantern(62, 53, small=True)
    k.banner(42, 55, 0); k.banner(58, 55, 0)       # the horse banner of the house
    k.head(43, 53, 0); k.head(57, 53, 0)
    # the bar's back wall: shelves of bottles, the barrel racks with taps, Borgar's door in the middle
    k.put("bar_shelf", 44, 56); k.put("barrel_rack", 46, 56)
    k.put("barrel_rack", 51, 56); k.put("wine_shelf", 55, 56)
    k.big_prop(47, 54, 2, 2, 0, name="Cennik", priority=0)            # the price board over the left taps
    k.big_prop(53, 54, 1, 2, 2, name="Tablica z kredą", priority=0)   # the chalk tally over the right taps
    k.ev(50, 55, "!Fantasy_door1", 0, 8, 0, name="Drzwi na zaplecze", priority=0, through=True)   # Borgar's door, open
    # the counter (rows 58..59) with its stools
    k.put("bar_l", 44, 59)
    for x in range(45, 56): k.put("bar_m", x, 59)
    k.put("bar_r", 56, 59)
    for x in (45, 47, 50, 53, 55): k.put("stool", x, 60)
    for (it, x) in (("mugs", 45), ("beer", 46), ("bottle", 47), ("glasses", 53), ("wine", 54), ("mug", 55)):
        k.on(it, x, 58)
    k.candle(44, 58); k.candle(56, 58)
    # ---- the runner from the vestibule up to the bar
    k.rug(49, 61, 51, 73, 36)
    # ---- the tables: on each side two square tables with four chairs (the ends left free: guests stand there) and two
    # long tables with benches and stools, each pair on its rug
    for (x0, x1) in ((38, 46), (54, 62)):
        k.rug(x0, 61, x1, 65, 38)
        k.rug(x0, 68, x1, 72, 21)
    for (x, y) in ((39, 64), (44, 64), (55, 64), (60, 64)):
        k.square_table(x, y, w=False, e=False)
    for (x, y) in ((39, 70), (44, 70), (55, 70), (60, 70)):
        k.put("trestle2", x, y)
        k.put("bench2", x, y - 1, z=3); k.put("bench2", x, y + 1)
        k.put("stool", x - 1, y); k.put("stool", x + 2, y)
    for (it, x, y) in (("beer", 39, 70), ("bread", 40, 70), ("meat_plate", 44, 70), ("mugs", 45, 70), ("soup", 55, 70), ("beer", 56, 70),
                       ("mugs", 60, 70), ("fish_plate", 61, 70), ("mug", 40, 64), ("bowl", 39, 64), ("wine_jug", 44, 64), ("glass", 45, 64),
                       ("pie", 55, 64), ("mug", 56, 64), ("beer", 60, 64), ("bun", 61, 64)):
        k.on(it, x, y)
    for (x, y) in ((42, 67), (58, 67), (50, 66)):
        k.chandelier(x, y)
    # pillars along the runner, barrels and plants in the corners by the vestibule
    for (x, y) in ((47, 66), (53, 66), (47, 72), (53, 72)):
        k.pillar(x, y)
    k.put("barrel", 37, 73); k.put("barrel_sack", 63, 73)
    k.put("plant_flowers", 37, 67); k.put("plant_flowers", 63, 67)
    # ---- people and hooks
    # Borgar behind the counter (right of his door, which stays free); the counter's back row before him passes the action
    # button on to him (an action across the counter reaches one cell past the counter tile, his counter is two deep)
    k.keep(1, 52, 57, sheet="$Npc_Borgar", direction=2, bust="People3_5")
    k.relay(52, 58, 1, "Lada - rozmowa z Borgarem")
    k.hook("<Tavern:meal>", 48, 58, "Tavern:meal (zamówienie posiłku)", eid=38)       # the counter: a meal
    for (eid, x, y, d, plate) in ((60, 38, 70, 6, "1,-1"), (61, 41, 70, 4, "-1,-1"), (77, 59, 70, 6, "1,-1"), (78, 62, 70, 4, "-1,-1")):
        k.hook("<Tavern:mealtable dir=%d plate=%s>" % (d, plate), x, y, "Tavern:mealtable (miejsce przy stole)", eid=eid)
    for (n, x, y, d) in ((1, 46, 60, 8), (2, 54, 60, 8), (3, 38, 64, 6), (4, 41, 64, 4), (5, 43, 64, 6), (6, 57, 64, 4),
                         (7, 59, 64, 6), (8, 62, 64, 4)):
        k.spot("gosc_%d" % n, x, y, d)
    k.keep(4, 46, 68, direction=2, bust="People2_1", sheet="$Npc_Ozzy")                # Ozzy on the bench at the long table


# ================================================================================================ the feast hall
def feast_hall(m, k):
    # x 17..35, y 56..67 (walls 53..55 stone and timber); the high table under the banners, two long tables down the hall
    for (x, col) in ((19, 1), (22, 0), (30, 2), (33, 3)):
        k.banner(x, 55, col)
    k.head(26, 53, 1)                              # the crossed axes over the high table
    k.tile("D", 3, 0, 24, 54); k.tile("D", 3, 1, 28, 54)    # painted shields
    k.lantern(17, 53, small=True); k.lantern(35, 53, small=True)
    k.put("sideboard2", 17, 56); k.put("sideboard2", 34, 56)
    for (it, x) in (("bread_basket", 17), ("wine_jug", 18), ("fruit", 34), ("jug", 35)): k.on(it, x, 55)
    k.candelabra(21, 57); k.candelabra(31, 57)
    # the high table (x 22..30) with high-backed chairs behind it
    m.stamp(2, 22, 58, "C", 9, 4, 1, 2)
    for x in range(23, 30): m.stamp(2, x, 58, "C", 10, 4, 1, 2)
    m.stamp(2, 30, 58, "C", 11, 4, 1, 2)
    for x in (23, 24, 25, 27, 28, 29): k.put("highchair", x, 58, z=3)
    k.put("throne", 26, 58, z=3)
    for (it, x) in (("wine", 22), ("meat_plate", 23), ("glass", 24), ("cake", 26), ("glasses", 28), ("fish_plate", 29), ("wine_jug", 30)):
        k.on(it, x, 59)
    k.candle(25, 59, three=True); k.candle(27, 59, three=True)
    # two long tables down the hall with benches both sides
    for tx in (23, 29):
        m.t(2, tx, 61, "C", 8, 4)
        for y in range(62, 66): m.t(2, tx, y, "C", 8, 5)
        m.t(2, tx, 66, "C", 8, 6)
        for bx in (tx - 1, tx + 1):
            k.put("bench_v", bx, 63); k.put("bench_v", bx, 66)
        for (it, y) in (("mug", 62), ("meat_plate", 63), ("bread", 64), ("beer", 65)):
            k.on(it, tx, y)
        k.candle(tx, 61)
    k.chandelier(26, 64)
    k.rug(25, 61, 27, 67, 36)
    # the sides: a little round table either side, kegs and a plant
    for (x, y) in ((19, 65), (33, 65)):
        k.put("round_plain", x, y); k.put("stool", x - 1, y); k.put("stool", x + 1, y)
        k.on("mugs", x, y - 1)
    k.put("barrels_tap", 17, 67); k.put("barrel", 18, 67)
    k.put("barrel_water", 34, 67); k.put("plant", 35, 67)


# ================================================================================================ the hunters' room
def hunters(m, k):
    # x 3..15, y 56..67, log walls 53..55; the stone hearth, trophies, the hunters' table with the map
    m.wall_seg(8, 10, 53, 55, 71)
    k.fireplace(9, 56, kind=1)
    k.firewood(7, 56); k.firewood(11, 56)
    k.head(5, 53, 0); k.head(13, 53, 0)
    k.prop(9, 54, 3, 2, 1, name="Łeb dzika")       # the boar's head over the hearth
    k.put("weapon_shelf", 3, 56); k.put("weapon_shelf", 14, 56)
    k.rug(7, 57, 11, 60, 21)
    k.put("arm_e", 7, 59); k.put("arm_w", 11, 59)
    k.put("round_cloth", 9, 59); k.on("jug", 9, 58)
    k.rug_piece("bear_brown", 5, 61); k.rug_piece("bear_white", 12, 61)
    # the hunters' table with the map of the woods
    m.stamp(2, 6, 63, "C", 9, 4, 1, 2)
    for x in range(7, 11): m.stamp(2, x, 63, "C", 10, 4, 1, 2)
    m.stamp(2, 11, 63, "C", 11, 4, 1, 2)
    for x in (6, 8, 10):
        k.put("bench2", x, 63, z=3); k.put("bench2", x, 65)
    k.big_prop(8, 64, 3, 2, 0, name="Mapa okolicy", priority=0)
    for (it, x) in (("beer", 6), ("mug", 7), ("meat_plate", 11)): k.on(it, x, 64)
    k.candle(10, 63)
    k.chandelier(9, 62)
    # trophies and kit along the sides
    k.put("bench_v", 3, 66); k.put("bench_v", 15, 66)
    k.put("barrel", 3, 62); k.put("crate", 15, 62)
    k.put("plant", 4, 67); k.put("plant", 14, 67)


# ================================================================================================ the stage hall
def stage_hall(m, k):
    # x 65..83, y 56..67, beige paper walls 53..55; the stage x 69..79 rows 56..59 (vertical boards, a step front)
    m.fill(0, 69, 56, 79, 59, 82)
    for x in range(69, 80): m.t(1, x, 60, "A5", 1, 2)       # the stage's front: wooden steps
    for x in (69, 79):
        m.stamp(3, x, 54, "B", 0, 14, 1, 2)                   # red stage curtains at the stage's sides
    for x in range(70, 79):
        m.stamp(3, x, 53, "B", 0, 12, 1, 1)                   # the swag along the top
    k.prop(74, 55, 1, 4, 2, name="Gobelin z kuflem")        # the tavern's own tapestry behind the singer
    k.prop(71, 55, 1, 4, 1, name="Gobelin z jeleniem"); k.prop(77, 55, 1, 4, 1, name="Gobelin z jeleniem")
    k.keep(2, 74, 58, sheet="$Npc_Melia", direction=2, bust="People2_8")
    k.prop(72, 58, 0, 4, 1, name="Lutnia na stojaku", priority=1)
    k.prop(76, 58, 2, 4, 0, name="Pulpit z nutami", priority=1)
    for x in (70, 78): k.candle(x, 59)
    k.hook("<Tavern:stage>", 74, 62, "Tavern:stage (miejsce słuchacza)", eid=110)
    # the audience: round tables in two rows, benches in the middle at the back
    k.rug(71, 63, 77, 67, 38)
    for y in (64, 66):
        for x in (71, 76): k.put("bench2", x, y)
    for (x, y, kind, v) in ((67, 63, "drinks", 2), (81, 63, "food", 7), (67, 67, "food", 3), (81, 67, "drinks", 4)):
        k.round_table(x, y, kind, v)
    k.lantern(66, 53, small=True); k.lantern(82, 53, small=True)
    k.put("plant_flowers", 65, 56); k.put("plant_flowers", 83, 56)
    k.put("barrel", 65, 67); k.put("barrel_sack", 83, 67)
    k.chandelier(69, 65); k.chandelier(79, 65)


# ================================================================================================ the games room
def games(m, k):
    # x 85..97, y 56..67, dark panelled walls 53..55; dice at two tables (Grum keeps the east one), cards and chess
    k.put("bookcase2b", 85, 56); k.put("bookcase2", 96, 56)
    k.painting(88, 54, 4); k.painting(94, 54, 6)
    k.lantern(91, 53)
    for x in (89, 93): k.tile("D", 7, 2, x, 55)              # little shelves with jugs
    # the dice table (any rival) on a green rug
    k.rug(85, 58, 89, 61, 30)
    k.put("table2", 87, 60)
    k.put("chair_e", 86, 60); k.put("chair_w", 89, 60)
    k.prop(87, 60, 2, 4, 1, name="Kubek i kości", priority=0)
    k.on("coins", 88, 60)
    k.hook("<Tavern:dice>", 86, 60, "Tavern:dice (miejsce gracza)", eid=140)
    # Grum's table: dice with him (the hero's seat on the west), arm-wrestling (the stool below)
    k.rug(91, 58, 95, 61, 30)
    k.put("table2", 93, 60)
    k.put("chair_e", 92, 60); k.put("stool", 94, 61)
    k.on("mugs", 93, 60); k.on("coins3", 94, 60)
    k.hook("<Tavern:dice:grum>", 92, 60, "Tavern:dice (miejsce gracza)", eid=143)
    k.hook("<Tavern:arm>", 94, 61, "Tavern:arm (siłowanie na rękę)", eid=148)
    k.keep(3, 95, 60, sheet="$Npc_Grum", direction=4, bust="Actor2_5")
    # cards and chess lower down
    k.put("round_plain", 88, 65); k.put("chair_e", 87, 65); k.put("chair_w", 89, 65)
    k.prop(88, 65, 2, 4, 2, name="Karty", priority=0)
    k.put("round_plain", 93, 65); k.put("chair_e", 92, 65); k.put("chair_w", 94, 65)
    k.prop(93, 65, 3, 4, 1, name="Szachownica", priority=0)
    k.rug(86, 63, 95, 66, 38)
    k.chandelier(91, 63)
    k.put("plant", 85, 67); k.put("barrel", 91, 67); k.put("barrel_sack", 90, 67); k.put("bench2", 86, 67)


# ================================================================================================ the bath house
def bath(m, k):
    # x 3..23, y 72..82, pale half-timbered walls 69..71, boards. The stove that heats the water in the middle of the north
    # wall with Wanda by it; west of it the four tubs (two by two, on mats, a screen between the pairs), east of it the
    # dressing corner: benches, a wardrobe, towels, a mirror
    m.fill(0, 3, 72, 13, 82, 99)                                  # the wet side: stone tiles; the dry side: boards
    m.opening(9, 68, 10, 71, 99)
    m.wall_seg(12, 14, 69, 71, 66)
    k.ev(13, 72, "!$Fireplace_kitchen", 0, 4, 0, name="Piec z kotłem", priority=1, step=True, note="<Occupy:left=1,right=1>" + lamp("stove"))
    k.put("barrel_water", 11, 72); k.put("barrel_water", 15, 72); k.put("woodpile", 16, 72)
    k.keep(172, 13, 74, sheet="$Npc_Wanda", direction=2, bust="People1_6")
    k.window(5, 69, "lit", curtain=1); k.window(21, 69, "lit", curtain=1)
    k.lantern(7, 69, small=True); k.lantern(18, 69, small=True)
    k.put("glass_cupboard", 3, 72)
    # the tubs: two by two, each on a mat; a folding screen between the pairs
    for (eid, x, y) in ((159, 5, 76), (161, 11, 76), (163, 5, 81), (165, 11, 81)):
        k.rug(x - 1, y - 1, x + 1, y, 37)
        k.big_prop(x, y, 0, 2, 2, name="balia kąpielowa", priority=1, note="<Occupy:left=1,right=1>")
        k.hook("<Tavern:bath>", x, y, "Tavern:bath (kąpiel)", eid=eid)
    k.prop(8, 76, 0, 4, 0, name="stołek z ręcznikami", priority=1)
    k.prop(8, 81, 3, 2, 2, name="cebrzyk ze szczotką i mydłem", priority=1)
    k.put("screen4", 3, 79)
    k.put("plant", 13, 82); k.put("bucket_water", 3, 82)
    # the dressing corner
    k.put("wardrobe", 19, 72); k.put("cupboard1", 22, 72); k.put("dresser_mirror", 23, 72)
    k.put("bench_v", 16, 78); k.put("bench_v", 16, 82)
    k.rug(18, 75, 22, 80, 28)
    k.put("table2", 19, 78); k.prop(19, 78, 0, 4, 0, name="ręczniki", priority=0); k.on("jug", 20, 78)
    k.put("chair_s", 19, 77, z=3); k.put("chair_s", 20, 77, z=3); k.put("chair_n", 19, 79); k.put("chair_n", 20, 79)
    k.prop(23, 80, 0, 4, 2, name="Wieszak", priority=1)
    k.put("plant", 23, 82); k.put("sofa2", 19, 82)
    k.chandelier(8, 79); k.chandelier(20, 76)


# ================================================================================================ the private dining room
def dining(m, k):
    # x 25..35, y 72..82, purple damask walls 69..71; one long table with red armchairs, the sideboard, a fireplace
    k.fireplace(30, 72, kind=4)
    k.put("dish_cupboard2", 26, 72); k.put("sideboard2", 33, 72)
    k.painting(28, 70, 6); k.painting(32, 70, 7)
    k.candelabra(25, 73); k.candelabra(35, 73)
    m.stamp(2, 27, 76, "C", 9, 4, 1, 2)
    for x in range(28, 33): m.stamp(2, x, 76, "C", 10, 4, 1, 2)
    m.stamp(2, 33, 76, "C", 11, 4, 1, 2)
    for x in (28, 30, 32):
        k.put("arm_s", x, 76, z=3); k.put("arm_n", x, 78)
    k.put("arm_e", 26, 77); k.put("arm_w", 34, 77)
    k.table_runner(30, 77, 2, 1)
    for (it, x) in (("meat_plate", 28), ("glass", 29), ("cake", 30), ("glass", 31), ("fish_plate", 32)):
        k.on(it, x, 77)
    k.candle(27, 77, three=True); k.candle(33, 77, three=True)
    k.chandelier(30, 76)
    k.rug(26, 74, 34, 80, 22)
    k.hook("<Tavern:mealtable dir=8 plate=0,-2>", 28, 78, "Tavern:mealtable (miejsce przy stole)", eid=188)
    k.hook("<Tavern:mealtable dir=8 plate=0,-2>", 32, 78, "Tavern:mealtable (miejsce przy stole)", eid=189)
    k.put("plant_flowers", 25, 82); k.put("plant_flowers", 35, 82)
    k.put("round_plain", 30, 82); k.on("fruit", 30, 81)


# ================================================================================================ the reading and smoking room
def reading(m, k):
    # x 65..75, y 72..82, dark panelled walls 69..71 with shelves built into them; armchairs by the fire, a reading table
    m.stamp(0, 65, 70, "A5", 0, 14, 4, 2); m.stamp(0, 72, 70, "A5", 2, 14, 4, 2)
    k.fireplace(70, 72, kind=1)
    k.ev(65, 72, "!clock", 0, 2, 0, name="Zegar", priority=1, step=True)
    k.put("plant", 75, 72)
    k.rug(67, 74, 73, 79, 20)
    k.put("arm_se", 68, 75); k.put("arm_sw", 72, 75)
    k.put("arm_e", 69, 77); k.put("arm_w", 71, 77)
    k.put("round_cloth", 70, 77)
    k.on("book_open", 70, 76); k.on("glass", 70, 77)
    # the reading table
    m.stamp(2, 68, 80, "C", 9, 4, 1, 2)
    for x in (69, 70, 71): m.stamp(2, x, 80, "C", 10, 4, 1, 2)
    m.stamp(2, 72, 80, "C", 11, 4, 1, 2)
    for x in (68, 70, 72): k.put("chair_s", x, 80, z=3)
    for x in (69, 71): k.put("chair_n", x, 82)
    for (it, x) in (("books", 68), ("book_open2", 69), ("scroll", 71), ("books2", 72)): k.on(it, x, 81)
    k.candle(70, 81)
    k.put("books_low", 65, 82); k.put("books_low", 75, 82)
    k.chandelier(70, 80)


# ================================================================================================ the darts room
def darts(m, k):
    # x 77..97, y 72..82, grey plaster walls 69..71; two boards on the north wall with their lanes, a little bar of kegs in
    # the west corner, tables for the onlookers, a long bench table at the back
    k.put("barrel_rack", 77, 73)
    k.put("table2", 78, 76); k.on("mugs", 78, 76); k.on("beer", 79, 76)
    for (eid, bx) in ((174, 84), (176, 90)):
        k.rug(bx - 1, 72, bx + 1, 76, 21)
        k.prop(bx, 71, 1, 6, 2, name="Tarcza do rzutek", priority=0)
        k.rug(bx - 1, 77, bx + 1, 77, 37)
        k.hook("<Tavern:darts>", bx, 77, "Tavern:darts (linia rzutu)", eid=eid)
        k.candle(bx - 1, 72, light=True) if False else None
    k.prop(87, 71, 2, 6, 1, name="Nie pluć na podłogę", priority=0)
    k.big_prop(87, 69, 1, 2, 2, name="Tablica wyników", priority=0) if False else None
    k.lantern(81, 69, small=True); k.lantern(93, 69, small=True)
    k.put("plant_flowers", 87, 73)
    for (x, y, kind, v) in ((80, 80, "food", 2), (94, 77, "drinks", 3), (94, 81, "food", 5)):
        k.round_table(x, y, kind, v)
    m.stamp(2, 85, 81, "C", 9, 4, 1, 2)
    for x in (86, 87, 88): m.stamp(2, x, 81, "C", 10, 4, 1, 2)
    m.stamp(2, 89, 81, "C", 11, 4, 1, 2)
    for x in (85, 87, 89): k.put("bench2", x, 81, z=3) if False else k.put("chair_s", x, 81, z=3)
    for (it, x) in (("beer", 85), ("mugs", 86), ("bread", 87), ("beer", 88), ("mug", 89)): k.on(it, x, 82)
    k.chandelier(87, 79)
    k.put("barrel", 77, 82); k.put("barrel_sack", 78, 82); k.put("plant", 97, 82)
    k.put("bench_v", 97, 79)
    # the onlookers' benches behind the throw lines, a keg for a standing table between the lanes
    for x in (82, 88): k.put("bench2", x, 79)
    k.put("barrel", 87, 77); k.on("mugs", 87, 76)


# ================================================================================================ the corridor
def corridor(m, k):
    # x 17..83, y 49..51, panelled wall 47..48; a long runner, pictures, lamps, things waiting by the service doors
    k.rug(17, 50, 83, 50, 36)
    for x in (19, 27, 37, 45, 55, 63, 73, 81):
        k.sconce(x, 47)
    for (x, w) in ((24, 0), (35, 3), (65, 1), (76, 2)):
        k.painting(x, 47, w)
    k.prop(41, 48, 2, 6, 0, name="Wieszak na klucze")
    k.prop(57, 48, 2, 6, 1, name="Nie pluć na podłogę")
    k.put("crate", 18, 49); k.put("sacks2", 29, 49); k.put("barrel", 47, 49); k.put("barrel_sack", 53, 49)
    k.put("crates2", 62, 49); k.put("bench2", 71, 51); k.put("plant", 83, 49)
    k.prop(43, 51, 2, 2, 0, name="Śpiący kot")
    # open doors in the one-cell doorways of the work rooms (the wide ones to the brewery and the kitchen stay open arches)
    for x in (32, 59, 68, 78):
        k.ev(x, 48, "!Fantasy_door1", 0, 8, 0, name="Drzwi", priority=0, through=True)


# ================================================================================================ the kitchen
def kitchen(m, k):
    # x 37..53, y 37..45, plaster and timber walls 34..36; the two stoves under their hoods, the work island, shelves
    for (cx, d) in ((41, 4), (49, 6)):
        m.wall_seg(cx - 1, cx + 1, 34, 36, 66)
        k.ev(cx, 36, "!$chimney", 0, 6 if cx == 41 else 8, 0, name="Okap", priority=0, through=True)
        k.ev(cx, 37, "!$Fireplace_kitchen", 0, d, 0, name="Piec kuchenny", priority=1, step=True,
             note="<Occupy:left=1,right=1>" + lamp("stove"))
    k.put("food_shelf", 37, 37); k.put("jar_shelf", 38, 37)
    k.put("food_shelf", 44, 37); k.put("cupboard", 45, 37); k.put("jar_shelf", 46, 37)
    k.put("pantry2", 52, 37)
    for x in (43, 47): m.stamp(2, x, 35, "D", 0, 6, 1, 2)    # pans hanging on the wall
    k.firewood(39, 38); k.firewood(51, 38)
    # the work island
    m.stamp(2, 43, 40, "C", 9, 8, 1, 2)
    for x in (44, 45, 46): m.stamp(2, x, 40, "C", 10, 8, 1, 2)
    m.stamp(2, 47, 40, "C", 11, 8, 1, 2)
    for (it, x) in (("board_meat", 43), ("knife", 44), ("bowl", 45), ("fish_plate", 46), ("board_fish", 47)): k.on(it, x, 41)
    # prep tables by the side doors' walls, barrels and sacks in the corners
    k.put("table2", 38, 44); k.on("bread_basket", 38, 44); k.on("fruit", 39, 44)
    k.put("table2", 51, 44); k.on("jar", 51, 44); k.on("bun", 52, 44)
    k.put("barrel_water", 37, 45); k.put("sacks2", 46, 45); k.put("barrel", 53, 45)
    k.put("crate_sack", 41, 45); k.put("barrels_sacks2", 44, 45); k.firewood(48, 45)
    k.ev(43, 44, "!Decoration", 2, 6, 0, name="Kocioł", priority=1, step=True, note=lamp("oven"))
    k.hanging(45, 39, 3)


def bakery(m, k):
    # x 55..63, y 37..45, red brick walls 34..36; the oven, racks of loaves, the dough table, flour
    k.fireplace(59, 37, kind=1, name="Piec chlebowy")
    k.firewood(57, 37); k.firewood(61, 37)
    k.put("bread_rack", 55, 37); k.put("bread_rack", 56, 37); k.put("cheese_rack", 62, 37); k.put("veg_rack", 63, 37)
    m.stamp(2, 58, 41, "C", 9, 4, 1, 2); m.stamp(2, 59, 41, "C", 10, 4, 1, 2); m.stamp(2, 60, 41, "C", 11, 4, 1, 2)
    for (it, x) in (("bread", 58), ("bun", 59), ("bread_basket", 60)): k.on(it, x, 42)
    k.big_prop(56, 45, 0, 4, 0, name="Worki z mąką", priority=1, note="<Occupy:right=1>")
    k.put("sack", 62, 45); k.put("barrel_sack", 63, 45)
    k.put("crate_sack", 63, 41)


def pantry(m, k):
    # x 29..35, y 37..45, stone and timber walls 34..36; a wall of food shelves, barrels, hams hanging from the beams
    for (n, x) in (("food_shelf", 29), ("jar_shelf", 30), ("bread_rack", 31), ("cheese_rack", 32), ("veg_rack", 33),
                   ("jar_shelf", 34), ("food_shelf", 35)):
        k.put(n, x, 37)
    k.hanging(31, 40, 0); k.hanging(33, 40, 3)
    k.put("barrel", 29, 41); k.put("barrels_sacks2", 29, 43)
    k.put("crate_sack", 34, 44); k.put("barrel_water", 35, 45)
    k.put("sacks2", 29, 45)


def smokehouse(m, k):
    # x 65..71, y 37..45, rough stone walls 34..36, cobbles; the smoking fire, hams and fish on poles
    k.ev(68, 41, "!Decoration", 2, 4, 0, name="Palenisko wędzarni", priority=1, step=True, note=lamp("oven"))
    for (x, w) in ((66, 0), (68, 1), (70, 0)): k.hanging(x, 36, w)
    for (x, w) in ((67, 1), (69, 0)): k.hanging(x, 39, w)
    for x in (66, 70): k.tile("D", 11, 12, x, 35, z=3)        # soot on the stones
    k.put("woodpile", 65, 45); k.put("woodpile", 66, 45); k.put("barrel", 71, 45); k.put("barrel_sack", 70, 45)
    k.put("crate", 65, 41)


def brewery(m, k):
    # x 17..27, y 37..45, red brick walls 34..36; barrel racks along the wall, the copper kettle and the mash tun, grain
    k.put("barrel_rack", 17, 37); k.put("barrel_rack", 24, 37)
    k.put("barrels_tap", 22, 37)
    k.big_prop(19, 41, 0, 2, 0, name="Kocioł warzelny", priority=1, note="<Occupy:right=1,up=1>" + lamp("oven"))
    k.big_prop(24, 41, 0, 2, 1, name="Kadź zacierna", priority=1, note="<Occupy:right=1,up=1>")
    k.big_prop(18, 45, 0, 4, 0, name="Worki ze słodem", priority=1, note="<Occupy:right=1>")
    k.put("barrels3", 25, 45)
    k.put("table2", 22, 43); k.on("mugs", 22, 43); k.on("jug", 23, 43)
    k.put("ladder", 17, 43)


def staff(m, k):
    # x 73..83, y 37..45, grey plaster walls 34..36; four beds with their chests, a washstand, a table on a rug
    for (x, b) in ((74, "bed_straw"), (76, "bed_patch"), (80, "bed_patch"), (82, "bed_straw")):
        k.put(b, x, 39)
        k.chest(x, 40, 6)
    k.put("washstand", 78, 37); k.tile("D", 1, 4, 78, 35, z=3)
    k.rug(76, 41, 80, 44, 29)
    k.put("round_plain", 78, 43); k.put("chair_e", 77, 43); k.put("chair_w", 79, 43)
    k.candle(78, 42)
    k.put("wardrobe", 73, 45); k.prop(83, 45, 0, 4, 2, name="Wieszak", priority=1)
    k.put("crate", 82, 45); k.put("plant", 75, 45)


def office(m, k):
    # x 87..95, y 34..39, dark panels 31..33; Borgar's desk under his portrait on a rug, books and his strongbox
    k.put("bookcase2", 87, 34); k.put("books_tall", 89, 34)
    k.put("books_tall2", 93, 34); k.put("bookcase2b", 94, 34)
    k.painting(91, 32, 5)
    k.rug(89, 35, 93, 39, 22)
    m.stamp(2, 90, 36, "C", 9, 4, 1, 2); m.stamp(2, 91, 36, "C", 10, 4, 1, 2); m.stamp(2, 92, 36, "C", 11, 4, 1, 2)
    k.put("arm_s", 91, 36, z=3)
    for (it, x) in (("papers", 90), ("coins", 92)): k.on(it, x, 37)
    k.candle(91, 37)
    k.put("chair_n", 90, 39); k.put("chair_n", 92, 39)
    k.chest(95, 39, 1); k.chest(95, 37, 0); k.put("plant", 87, 39)
    k.put("smalltable", 88, 37); k.on("globe", 88, 36)
    k.ev(91, 42, "!Fantasy_door1", 0, 8, 0, name="Drzwi gabinetu", priority=0, through=True)


def old_stones(m, k):
    # x 5..13, y 34..39, dark stone walls 31..33: the oldest stones of the fortress, a lumber room. The loose brick is in
    # the middle of its north wall (event 9 on the wall's bottom row, the hero below it facing up); the way to it stays clear.
    k.keep(9, 9, 33)
    k.tile("D", 11, 5, 9, 34, z=2)              # grit under the loose stone
    k.tile("D", 15, 7, 5, 31, z=3); k.tile("D", 13, 7, 13, 31, z=3); k.tile("D", 14, 7, 12, 31, z=3)    # cobwebs
    k.tile("D", 12, 6, 8, 35, z=1); k.tile("D", 11, 6, 10, 36, z=1)    # rubble
    k.put("wardrobe", 5, 34); k.put("books_tall3", 7, 34)
    k.put("barrel", 12, 34); k.put("broken_crate", 13, 34)
    k.put("chair_sw", 11, 36); k.put("broken_crate", 5, 37)
    k.chest(6, 37, 6)
    k.put("ladder", 13, 38); k.put("sack", 12, 39); k.put("crate", 5, 39); k.put("crates2", 6, 39)
    k.prop(11, 33, 2, 8, 2, name="Mysia dziura")
    k.torch(7, 32); k.torch(11, 32)
    k.ev(9, 42, "!Fantasy_door1", 2, 8, 0, name="Stare drzwi", priority=0, through=True)


def storeroom(m, k):
    # x 3..15, y 43..51, plank walls 41..42; shelves either side of the way up to the old stones, then two rows of stock
    k.put("shop_shelf", 3, 43); k.put("shop_shelf2", 5, 43); k.put("shop_shelf3", 12, 43); k.put("shop_shelf", 14, 43)
    k.put("ladder", 7, 43)
    for (n, x) in (("crate", 3), ("crates2", 4), ("crate_cloth", 5), ("barrel", 6)): k.put(n, x, 47)
    for (n, x) in (("barrel_water", 12), ("barrel", 13), ("crate_sack", 14), ("crate", 15)): k.put(n, x, 47)
    k.put("sacks2", 3, 51); k.put("barrels2", 5, 51); k.put("broken_crate", 7, 51)
    for (n, x) in (("crate", 11), ("crate_lid", 12), ("barrel", 13), ("barrel_sack", 14)): k.put(n, x, 51)
    k.put("woodpile", 10, 51)


def warehouse(m, k):
    # x 85..97, y 43..51, vertical plank walls 41..42; shelves either side of the way up to Borgar's office, rows of barrels
    # and crates
    k.put("shop_shelf", 85, 43); k.put("shop_shelf2", 87, 43); k.put("shop_shelf3", 94, 43); k.put("shop_shelf", 96, 43)
    k.put("ladder", 89, 43)
    k.put("barrels3", 86, 47); k.put("barrel_water", 89, 47)
    for (n, x) in (("crate", 93), ("crates2", 94), ("crate_cloth", 95), ("crate", 96), ("crate_sack", 97)): k.put(n, x, 47)
    k.put("sacks2", 87, 51); k.put("barrel", 89, 51); k.put("barrel_sack", 90, 51)
    k.put("barrels3", 93, 51); k.put("barrels2", 96, 51)


