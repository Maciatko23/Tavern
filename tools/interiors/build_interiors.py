# python build_interiors.py [102 103 ...]  -> tools/interiors/staging/Map1xx.json (+ _meta.json)
# The town's building interiors (children of Map008 "Okolice Tawerny"), composed by hand cell by cell in the Winlu
# Interior author's manner (tools/town/winlu_samples Map004: dark rim border, 2-3 row wall faces, a feature wall with
# the hearth in the middle, furniture against the walls, rugs in the open middle, clutter on shelves and tables - never
# on edges) and like grandpa's cottage (Map019): the same shell, lights and passability (installed tileset-8 flags).
# Never writes data/ - install.py does, with the editor closed.
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ilib import *   # noqa: F401,F403

# the doors on Map008 (event id: the cell in front of the door, where one comes out facing down)
DOORS = {88: (6, 39), 94: (10, 40), 95: (14, 39), 114: (41, 40), 4: (47, 40), 121: (9, 31), 124: (12, 30),
         134: (12, 47), 137: (29, 47), 141: (37, 50), 236: (48, 31)}

# ---- kinds (A2 borders, A3 walls, A4 floors) - tools/tavern/catalog.json
B_WOOD, B_WOOD2, B_STONE, B_LOG = 24, 25, 16, 33
W_STONE_BEAM, W_PLASTER_BEAM, W_CREAM, W_PANEL, W_WALLPAPER, W_LOGS, W_BLUE, W_DARK, W_RAW = 50, 51, 52, 54, 56, 59, 62, 63, 71
F_LIGHT, F_VERT, F_DARK, F_RED, F_HERRING, F_COBBLE, F_FLAGS = 81, 82, 83, 84, 80, 96, 97
RUG_RED, RUG_MAT, RUG_RED_GOLD, RUG_BROWN, RUG_PURPLE, RUG_BLUE, RUG_ORANGE, RUG_GREEN, DUST = 36, 37, 38, 21, 22, 28, 29, 30, 23


# ================================================================================================ 102 Piekarnia
def piekarnia():
    """Hanka's bakery: the bread oven in a stone chimney breast (left), the kneading table and the flour by it; the shop
    on the right - the counter with bread and scales, the bread racks behind it; the door in the middle."""
    W, H = 17, 12
    mp = Interior(102, W, H, "Piekarnia", "piekarnia")
    DOOR_X = 8
    rooms = [("Piekarnia", [(1, 4, 15, 10)], F_RED, W_PLASTER_BEAM)]
    mp.shell(rooms, border=B_WOOD, exit_x=DOOR_X)
    # the bakehouse half has a flagstone floor (fire), the shop half boards
    mp.kind(0, mp.rect(1, 4, 7, 10), F_FLAGS)
    mp.restyle_face(mp.rect(1, 1, 4, 3), W_RAW)                  # the stone chimney breast round the oven
    mp.shadows()
    g = "Piekarnia"
    # ---- the oven: A5 brick oven mouth in the stone breast, the embers inside, firewood and the peel beside it
    mp.tiles("A5", 2, 11, 2, 3, 2, 1, z=0)
    mp.tprop("zar_piec", 2, 2, name="Żar w piecu", note=lamp_note("oven"), priority=0, cat="fire")
    mp.tprop("zar_piec", 3, 2, name="Żar w piecu", priority=0, pattern=1, cat="fire")
    firewood(mp, 1, 4, group=g + " drewno")
    if "lopata_chleb" in TOWN_IDX: mp.tprop("lopata_chleb", 4, 4, group=g)
    else: firewood(mp, 4, 4, group=g + " drewno")
    # ---- the north wall of the shop (x 5..15): window | bread shelf | window | bread racks (behind the counter)
    window(mp, 6, 1, curtain=1, group=g + " okna", length=120)
    mp.piece("D", 5, 2, 1, 2, 7, 1, group=g + " półki", kind="półka z chlebem", solid_rows=[])
    window(mp, 8, 1, curtain=1, group=g + " okna", length=120)
    mp.piece("D", 7, 2, 1, 2, 9, 1, group=g + " półki", kind="półka z dzbanem", solid_rows=[])
    mp.piece("C", 5, 6, 1, 3, 11, 2, group=g, kind="regał z chlebem")
    mp.piece("C", 7, 6, 1, 3, 12, 2, group=g, kind="regał z chlebem")
    mp.piece("C", 6, 6, 1, 3, 13, 2, group=g, kind="regał z serami")
    window(mp, 15, 1, curtain=1, group=g + " okno lada", length=120)
    hang(mp, 14, 2, "garlic", group=g + " zioła")
    # ---- the kneading table (bakehouse) with a basket of loaves and a board; flour sacks, the grain barrel
    table_h(mp, 2, 6, 3, style=6, group=g + " stół")
    on_table(mp, 2, 6, "D", 4, 10); on_table(mp, 4, 6, "D", 0, 9)
    mp.piece("D", 8, 2, 2, 2, 1, 8, group=g + " worki", kind="worki z mąką", solid_rows=[1])
    mp.piece("D", 8, 4, 1, 1, 3, 9, group=g + " worki", kind="rozsypana mąka")
    mp.piece("D", 13, 2, 1, 1, 4, 9, group=g, kind="beczka ze zbożem")
    mp.piece("D", 13, 0, 1, 2, 5, 3, group=g, kind="beczka z wodą (ukryta)")
    # ---- the counter (x 10..14, top row 6, front row 7), open at both ends
    counter_h(mp, 10, 14, 6, group=g + " lada")
    on_table(mp, 10, 6, "D", 4, 10); on_table(mp, 11, 6, "D", 5, 10); on_table(mp, 14, 6, "D", 3, 10)
    mp.prop("kasetka", 13, 7, group=g + " lada")
    mp.prop("swieca_lada", 12, 7, group=g + " lada", note=L_CANDLE_SMALL)
    # ---- the customers' side: a bench under the right wall, a sack by the door
    bench_v(mp, 15, 9, 2, group=g + " ława")
    mp.piece("D", 9, 4, 1, 1, 14, 10, group=g + " worki", kind="worki")
    round_table(mp, 11, 9, variant=(7, 11), group=g + " stolik")
    on_table(mp, 11, 9, "D", 5, 10)
    mp.piece("D", 10, 4, 1, 1, 6, 10, group=g, kind="wiadro")
    rug(mp, DOOR_X, 8, DOOR_X, 10, RUG_MAT)
    mp.exit_to(DOOR_X, 88, DOORS[88], "Drzwi -> Okolice Tawerny (rynek)")
    mp.resident("piekarka", 13, 5, 2)
    return mp


# ================================================================================================ 103 Kantor
def kantor():
    """Baltazar's trading house: the shop (door 95) - a counter across, a wall of crates behind it, the scales, the
    locked strongbox in the corner, foreign goods along the front; the back room (door 94, the back door) where the night
    visitors meet - a table with cards, coins and the register under a lantern, 'wine' barrels, a trapdoor to the cellar."""
    W, H = 19, 12
    mp = Interior(103, W, H, "Kantor", "kantor")
    BACK_X, SHOP_X = 3, 12
    rooms = [("Kantor", [(8, 4, 17, 10), (7, 9, 7, 10)], F_HERRING, W_WALLPAPER),
             ("Zaplecze", [(1, 4, 6, 10)], F_DARK, W_PANEL)]
    mp.shell(rooms, openings=[("Kantor", (SHOP_X, H - 1, SHOP_X, H - 1)), ("Zaplecze", (BACK_X, H - 1, BACK_X, H - 1))], border=B_WOOD)
    mp.shadows()
    g = "Kantor"
    # ---- the shop's north wall: window | wall of crates (6 wide, behind the counter) | window; the map above the crates
    window(mp, 9, 1, curtain=0, group=g + " okna", length=120)
    window(mp, 16, 1, curtain=0, group=g + " okna", length=120)
    mp.piece("E", 9, 14, 6, 2, 10, 3, group=g, kind="regał ze skrzynkami towaru")
    mp.prop("mapa", 12, 2, group=g + " ściana")
    mp.piece("D", 15, 0, 1, 2, 9, 3, group=g, kind="beczka z suknem")
    thing(mp, 16, 4, "!Fantasy_chest", 0, 2, 0, "Okuta skrzynia (zamknięta)", kind="skrzynia okuta", group=g)
    # ---- the counter (x 10..15, top row 6, front 7): scales, coins, the cash box, a candle
    counter_h(mp, 10, 15, 6, group=g + " lada")
    on_table(mp, 11, 6, "D", 4, 14); on_table(mp, 12, 6, "D", 4, 15); on_table(mp, 15, 6, "D", 5, 12)
    mp.prop("kasetka", 14, 7, group=g + " lada")
    mp.prop("swieca_lada", 10, 7, group=g + " lada", note=L_CANDLE_SMALL)
    # ---- the customers' side: a row of foreign goods (barrels with bottles, cloth, sacks) along the right, a rug
    for i, c in enumerate((4, 5, 6, 7)):
        mp.piece("E", c, 7, 1, 2, 14 + i, 9, group=g + " towar", kind="beczki z towarem")
    mp.piece("D", 14, 2, 1, 1, 10, 10, group=g + " towar", kind="beczka z jabłkami")
    rug(mp, 10, 8, 13, 9, RUG_PURPLE)
    mp.exit_to(SHOP_X, 95, DOORS[95], "Drzwi -> Okolice Tawerny (kantor)", room="Kantor")
    mp.resident("kupiec", 12, 5, 2)
    # ---- the back room: shuttered window, the wine pile, the table of the night visitors, the trapdoor
    z = "Zaplecze"
    window(mp, 2, 1, curtain=None, group=z + " okna", length=90, style="shutters")
    mp.piece("D", 10, 0, 3, 2, 4, 3, group=z, kind="sterta beczek z winem")
    mp.piece("D", 8, 0, 2, 2, 1, 9, group=z, kind="beczki")
    table_sq(mp, 2, 6, group=z + " stół")
    chair(mp, 2, 5, 2, group=z + " krzesła"); chair(mp, 4, 6, 4, group=z + " krzesła")
    chair(mp, 3, 8, 8, group=z + " krzesła")
    mp.prop("ksiega_rachunkowa", 2, 7, group=z + " stół"); candle(mp, 3, 7, group=z + " stół")
    on_table(mp, 3, 6, "D", 4, 15)
    mp.tile(1, 5, 9, A5(1, 0)); mp.rec("klapa do piwnicy", "floortile", {(5, 9)}, z, x=5, y=9)
    mp.piece("D", 13, 3, 1, 2, 6, 7, group=z, kind="skrzynia")
    wall_lantern(mp, 5, 1, style=0, group=z + " lampa")
    mp.exit_to(BACK_X, 94, DOORS[94], "Tylne drzwi -> Okolice Tawerny", room="Zaplecze")
    return mp


# ================================================================================================ 104 Ratusz
def ratusz():
    """the town hall: the hall (door 114) - the sołtys's desk on the axis under Lord Zaleski's banner, the ration ledger
    on it, benches either side of the aisle, the notice boards and the maps of the island; the office (door 4) with the
    records, the writing desk and the town's water reserve."""
    W, H = 21, 13
    mp = Interior(104, W, H, "Ratusz", "ratusz")
    HALL_X, OFF_X = 7, 17
    rooms = [("Sala", [(1, 4, 13, 11)], F_LIGHT, W_CREAM),
             ("Kancelaria", [(15, 4, 19, 11), (14, 10, 14, 11)], F_DARK, W_PANEL)]
    mp.shell(rooms, openings=[("Sala", (HALL_X, H - 1, HALL_X, H - 1)), ("Kancelaria", (OFF_X, H - 1, OFF_X, H - 1))], border=B_WOOD)
    mp.shadows()
    g = "Sala"
    # ---- the north wall, symmetric about the desk (x 7): land map | window | banner | window | island map
    banner(mp, 7, 2, 0, 0, group=g + " chorągiew")
    window(mp, 5, 1, curtain=0, group=g + " okna", length=130); window(mp, 9, 1, curtain=0, group=g + " okna", length=130)
    mp.prop("mapa", 2, 2, group=g + " mapy")
    if "mapa_wyspy" in TOWN_IDX: mp.tprop("mapa_wyspy", 11, 2, group=g + " mapy")
    else: mp.prop("mapa", 12, 2, group=g + " mapy")
    for x in (2, 12):
        mp.tprop("tablica_kartki", x, 4, group=g + " tablice")
    clock(mp, 13, 4, group=g)
    mp.piece("C", 0, 0, 1, 3, 1, 2, group=g, kind="regał z księgami")
    # the sołtys's desk (x 6..8, rows 5..6): the ration ledger, a candle, papers; his place behind it
    table_h(mp, 6, 5, 3, style=4, group=g + " biurko")
    mp.prop("ksiega_rachunkowa", 7, 6, group=g + " biurko")
    candle(mp, 6, 6, group=g + " biurko")
    on_table(mp, 8, 5, "D", 6, 13)
    mp.resident("soltys", 7, 4, 2)
    for y in (8, 10):
        bench_h(mp, 2, y, group=g + " ławy"); bench_h(mp, 4, y, group=g + " ławy")
        bench_h(mp, 9, y, group=g + " ławy"); bench_h(mp, 11, y, group=g + " ławy")
    rug(mp, HALL_X, 7, HALL_X, 11, RUG_RED)
    mp.exit_to(HALL_X, 114, DOORS[114], "Drzwi -> Okolice Tawerny (ratusz)", room="Sala")
    # ---- the office
    k = "Kancelaria"
    window(mp, 17, 1, curtain=2, group=k + " okno", length=110)
    mp.piece("C", 3, 2, 1, 2, 15, 3, group=k, kind="pulpit do pisania")
    chair(mp, 15, 5, 8, group=k)
    mp.piece("C", 3, 6, 2, 3, 18, 2, group=k, kind="regał z rejestrami")
    table_sq(mp, 17, 7, group=k + " stół")
    on_table(mp, 17, 7, "D", 6, 13); on_table(mp, 18, 7, "D", 5, 12)
    mp.piece("D", 13, 0, 1, 2, 19, 10, group=k, kind="beczka z wodą (zapas miasta)")
    thing(mp, 15, 11, "!Fantasy_chest", 0, 2, 0, "Skrzynia z listami racji", kind="skrzynia", group=k)
    mp.exit_to(OFF_X, 4, DOORS[4], "Drzwi -> Okolice Tawerny (kancelaria)", room="Kancelaria")
    return mp


# ================================================================================================ 105 Dom kowala
def dom_kowala():
    """Tadek's living room behind the smithy (door 134): the stone fireplace in the middle of the back wall, his own
    weapons and shields on the walls, an anvil and a grindstone in the corner, the bed, the table with a jug."""
    W, H = 15, 11
    mp = Interior(105, W, H, "Dom kowala", "kowal")
    DOOR_X = 7
    mp.shell([("Izba", [(1, 4, 13, 9)], F_DARK, W_STONE_BEAM)], border=B_STONE, exit_x=DOOR_X)
    mp.restyle_face(mp.rect(6, 1, 8, 3), W_RAW)
    mp.shadows()
    g = "Izba"
    fireplace_pic(mp, 7, 4, kind=2, group=g)
    firewood(mp, 6, 4, group=g + " drewno"); firewood(mp, 8, 4, group=g + " drewno")
    rug(mp, 6, 5, 8, 6, RUG_BROWN)
    for x, (c, r) in ((4, (4, 0)), (10, (5, 0))):
        mp.piece("D", c, r, 1, 2, x, 1, group=g + " broń", kind="miecz na tarczy", solid_rows=[])
    mp.piece("D", 0, 0, 1, 1, 3, 2, group=g + " tarcze", kind="tarcza", solid_rows=[])
    mp.piece("D", 2, 0, 1, 1, 11, 2, group=g + " tarcze", kind="tarcza", solid_rows=[])
    bed(mp, (12, 10), 1, 4, group=g, kind="łóżko kowala")
    nightstand_candle(mp, 2, 4, group=g)
    mp.piece("E", 8, 10, 2, 2, 11, 3, group=g, kind="stojak z bronią")
    mp.tprop("kowadlo", 13, 6, group=g)
    mp.tprop("szlifierka", 13, 9, group=g)
    table_h(mp, 3, 7, 3, style=6, group=g + " stół")
    stool(mp, 2, 8, group=g + " stołki"); stool(mp, 6, 8, group=g + " stołki")
    on_table(mp, 4, 7, "D", 1, 15)
    if "zelazna_roza" in TOWN_IDX: mp.tprop("zelazna_roza", 3, 8, group=g + " stół")
    else: on_table(mp, 3, 7, "D", 5, 10)
    plain_chest(mp, 10, 9, group=g)
    mp.exit_to(DOOR_X, 134, DOORS[134], "Drzwi -> Okolice Tawerny (kuźnia)")
    mp.resident("kowal", 9, 6, 4)
    return mp


# ================================================================================================ 106 Dom garbarza
def dom_garbarza():
    """Ignac the tanner and shoemaker (door 141): the workshop on the right - hides stretched on frames, the tanning
    barrel, the wash tub; the cobbler's bench with lasts in the middle, a shelf of shoes and boots; his bed on the left."""
    W, H = 16, 11
    mp = Interior(106, W, H, "Dom garbarza", "garbarz")
    DOOR_X = 8
    mp.shell([("Izba", [(1, 4, 14, 9)], F_RED, W_PLASTER_BEAM)], border=B_WOOD, exit_x=DOOR_X)
    mp.kind(0, mp.rect(10, 4, 14, 9), F_COBBLE)
    mp.shadows()
    g = "Izba"
    window(mp, 4, 1, curtain=1, group=g + " okna", length=110)
    window(mp, 11, 1, curtain=None, group=g + " okna", length=110, style="shutters")
    bed(mp, (12, 10), 1, 4, group=g, kind="łóżko garbarza")
    nightstand_candle(mp, 2, 4, group=g)
    plain_chest(mp, 1, 6, group=g)
    for x in (6, 7):
        if "polka_buty" in TOWN_IDX: mp.tprop("polka_buty", x, 4, group=g + " buty")
        else: mp.piece("C", 5, 6, 1, 3, x, 2, group=g + " buty", kind="regał")
    if "lawa_szewska" in TOWN_IDX: mp.tprop("lawa_szewska", 5, 7, group=g)
    else: table_h(mp, 5, 6, 2, style=6, group=g)
    stool(mp, 7, 7, small=True, group=g)
    mp.hprop("kolki_ubrania", 9, 3, group=g)
    mp.piece("C", 6, 0, 1, 2, 3, 8, group=g + " stolik", kind="stolik", solid_rows=[0, 1])
    on_table(mp, 3, 8, "D", 1, 15)
    mp.tprop("skora_rama", 10, 4, group=g + " skóry"); mp.tprop("skora_rama2", 11, 4, group=g + " skóry")
    mp.piece("D", 15, 3, 1, 1, 12, 4, group=g, kind="beczka z garbnikiem")
    mp.piece("D", 15, 4, 1, 1, 13, 4, group=g, kind="beczka z garbnikiem")
    mp.tprop("balia_tarka", 14, 7, group=g); mp.tprop("cebrzyk_woda", 14, 8, group=g)
    mp.piece("D", 11, 13, 2, 3, 11, 6, z=1, group=g, kind="skóra niedźwiedzia", solid_rows=[])
    mp.exit_to(DOOR_X, 141, DOORS[141], "Drzwi -> Okolice Tawerny (taras rzemieślników)")
    mp.resident("garbarz", 6, 8, 8)
    return mp


# ================================================================================================ 107 Dom woziwody
def dom_woziwody():
    """Kuba the water carrier (door 137): a bare stone room full of barrels, his cart with barrels, buckets and the
    yoke, a straw bed, a stool and a candle - and a little iron-bound box by the bed."""
    W, H = 14, 10
    mp = Interior(107, W, H, "Dom woziwody", "woziwoda")
    DOOR_X = 7
    mp.shell([("Izba", [(1, 4, 12, 8)], F_COBBLE, W_RAW)], border=B_STONE, exit_x=DOOR_X)
    mp.shadows()
    g = "Izba"
    window(mp, 9, 1, curtain=None, group=g + " okno", length=90, style="small")
    mp.piece("D", 10, 0, 3, 2, 1, 3, group=g, kind="sterta beczek")
    mp.piece("D", 13, 0, 1, 2, 4, 3, group=g, kind="beczka z wodą")
    mp.tprop("beczka_woda_otwarta", 5, 4, group=g)
    mp.tprop("woz_beczki", 2, 7, group=g)
    mp.tprop("wiadro_woda", 4, 7, group=g)
    mp.tprop("cebrzyk_woda", 1, 5, group=g)
    if "nosidla" in TOWN_IDX: mp.tprop("nosidla", 6, 4, group=g)
    bed(mp, (9, 13), 12, 4, group=g, kind="siennik")
    mp.prop("szkatula", 12, 6, group=g)
    stool(mp, 10, 4, group=g)
    mp.hprop("swieca_stolek", 10, 4, group=g, note=L_CANDLE_SMALL)
    mp.piece("D", 8, 2, 2, 2, 10, 7, group=g, kind="worki", solid_rows=[1])
    mp.piece("D", 13, 7, 1, 1, 1, 1, z=3, group=g, kind="pajęczyna", solid_rows=[])
    mp.exit_to(DOOR_X, 137, DOORS[137], "Drzwi -> Okolice Tawerny (taras rzemieślników)")
    mp.resident("woziwoda", 7, 5, 8)
    return mp


# ================================================================================================ 108 Dzwonnica
def dzwonnica():
    """the bell tower's ground room (new door 236 under the bell): the bell rope down the middle, the stone stairs up
    into the tower, the cot of Ambrozy, his table with the book of signals, the raven of the old Order carved over the
    stairs and on two faded banners, chalk strokes on the wall - the rhythm of the bell."""
    W, H = 11, 13
    mp = Interior(108, W, H, "Dzwonnica", "dzwonnica", note=NOTE_DIM)
    DOOR_X = 5
    mp.shell([("Wieża", [(1, 4, 9, 11)], F_COBBLE, W_RAW)], border=B_STONE, exit_x=DOOR_X)
    mp.shadows()
    g = "Wieża"
    for x in (1, 9):
        mp.tiles("B", 3, 10, 1, 2, x, 1); mp.wall_items.append((g + " okna", "window", x, 1))
        window_day(mp, x, 1, 110)
    if "kruk_choragiew" in TOWN_IDX:
        mp.tprop("kruk_choragiew", 3, 2, group=g + " chorągwie"); mp.tprop("kruk_choragiew", 7, 2, group=g + " chorągwie")
    else:
        banner(mp, 3, 2, 4, 0, group=g + " chorągwie"); banner(mp, 7, 2, 4, 0, group=g + " chorągwie")
    mp.tprop("schody_luk", 5, 3, group=g, name="Schody na wieżę")
    if "kruk_plaskorzezba" in TOWN_IDX: mp.tprop("kruk_plaskorzezba", 5, 1, group=g)
    mp.ev(5, 7, "!Fantasy_door1", 7, 4, 0, name="Sznur dzwonu", priority=1, through=False)
    mp.solid.add((5, 7)); mp.blocked.add((5, 7))
    bed(mp, (9, 13), 9, 5, group=g, kind="prycza")
    mp.tprop("kreda_kreski", 8, 3, group=g)
    plain_chest(mp, 9, 8, group=g)
    mp.piece("C", 6, 0, 1, 2, 1, 6, group=g + " stół", kind="stolik", solid_rows=[0, 1])
    on_table(mp, 1, 6, "D", 6, 11)
    stool_candle(mp, 2, 7, group=g)
    mp.piece("D", 10, 4, 1, 1, 1, 10, group=g, kind="wiadro")
    statue(mp, 2, 4, pattern=1, group=g)
    rug(mp, 4, 8, 6, 10, RUG_BROWN)
    if "dzwon" in TOWN_IDX: mp.tprop("dzwon", 7, 10, group=g)
    mp.piece("D", 13, 7, 1, 1, 1, 1, z=3, group=g, kind="pajęczyna", solid_rows=[])
    mp.piece("D", 15, 7, 1, 1, 9, 1, z=3, group=g, kind="pajęczyna", solid_rows=[])
    mp.exit_to(DOOR_X, 236, DOORS[236], "Drzwi -> Okolice Tawerny (dzwonnica)")
    mp.resident("dzwonnik", 5, 8, 8)
    return mp


# ================================================================================================ 109 Dom mieszczan
def dom_mieszczan():
    """an ordinary townsfolk family home (door 121): the hearth with the cauldron in the middle, the parents' bed and
    the child's bed with a teddy bear, the table, the spinning wheel, a cupboard, flowers on the sills."""
    W, H = 16, 11
    mp = Interior(109, W, H, "Dom mieszczan", "dom_mieszczan")
    DOOR_X = 8
    mp.shell([("Izba", [(1, 4, 14, 9)], F_RED, W_WALLPAPER)], border=B_WOOD, exit_x=DOOR_X)
    mp.restyle_face(mp.rect(7, 1, 9, 3), W_RAW)
    mp.shadows()
    g = "Izba"
    hearth_cauldron(mp, 8, 4, group=g + " drewno")
    window(mp, 5, 1, curtain=1, group=g + " okna", length=120); sill_pot(mp, 5, 1, 1, group=g + " doniczki")
    window(mp, 11, 1, curtain=1, group=g + " okna", length=120); sill_pot(mp, 11, 1, 2, group=g + " doniczki")
    hang(mp, 7, 2, "herbs", group=g + " zioła"); hang(mp, 9, 2, "garlic", group=g + " zioła")
    bed(mp, (14, 10), 1, 4, w=2, group=g, kind="łóżko")
    nightstand_candle(mp, 3, 4, group=g)
    bed(mp, (12, 10), 14, 4, group=g, kind="łóżeczko")
    mp.piece("D", 8, 10, 1, 1, 12, 4, group=g, kind="miś", solid_rows=[])
    mp.piece("C", 5, 11, 1, 2, 13, 3, group=g, kind="szafka")
    table_h(mp, 3, 7, 3, style=4, group=g + " stół")
    bench_h(mp, 3, 6, group=g + " ławy"); stool(mp, 5, 6, group=g + " ławy")
    candle(mp, 4, 8, group=g + " stół"); on_table(mp, 4, 7, "D", 0, 10)
    mp.hprop("kolowrotek", 12, 7, group=g, name="Kołowrotek")
    plain_chest(mp, 14, 8, group=g)
    rug(mp, 7, 5, 9, 6, RUG_MAT)
    mp.resident("zosia", 11, 5, 2)    # (the children of TownLife_Data: home "dom_mieszczan", 2026-10-05)
    mp.resident("bronek", 13, 6, 4)
    mp.exit_to(DOOR_X, 121, DOORS[121], "Drzwi -> Okolice Tawerny")
    return mp


# ================================================================================================ 110 Izba pod skałą
def izba_pod_skala():
    """a poor dug-out room in the rock under the fortress terrace (door 124): raw stone, a fire pit with a pot, two straw
    beds, sacks and broken crates, a lantern."""
    W, H = 12, 10
    mp = Interior(110, W, H, "Izba pod skałą", "izba_pod_skala", note=NOTE_DIM)
    DOOR_X = 6
    mp.shell([("Izba", [(1, 4, 10, 8)], F_COBBLE, W_RAW)], border=B_STONE, exit_x=DOOR_X)
    mp.shadows()
    g = "Izba"
    cauldron_fire(mp, 6, 5, group=g)
    bed(mp, (9, 13), 1, 4, group=g, kind="siennik")
    bed(mp, (9, 13), 10, 4, group=g, kind="siennik")
    mp.piece("D", 8, 2, 2, 2, 3, 3, group=g, kind="worki", solid_rows=[1])
    mp.piece("D", 13, 5, 1, 2, 8, 3, group=g, kind="połamana skrzynia")
    mp.piece("D", 12, 3, 1, 2, 9, 7, group=g, kind="skrzynia")
    mp.piece("D", 10, 4, 1, 1, 2, 8, group=g, kind="wiadro")
    wall_lantern(mp, 6, 1, style=1, group=g)
    mp.piece("D", 13, 7, 1, 1, 1, 1, z=3, group=g, kind="pajęczyna", solid_rows=[])
    mp.piece("D", 15, 7, 1, 1, 10, 1, z=3, group=g, kind="pajęczyna", solid_rows=[])
    mp.exit_to(DOOR_X, 124, DOORS[124], "Drzwi -> Okolice Tawerny")
    return mp


BUILDERS = {102: piekarnia, 103: kantor, 104: ratusz, 105: dom_kowala, 106: dom_garbarza, 107: dom_woziwody,
            108: dzwonnica, 109: dom_mieszczan, 110: izba_pod_skala}

def main():
    ids = [int(a) for a in sys.argv[1:] if a.isdigit()] or sorted(BUILDERS)
    for i in ids:
        mp = BUILDERS[i]()
        path, n = mp.stage()
        print("Map%03d %s: %dx%d, %d zdarzeń -> %s" % (i, mp.display, mp.W, mp.H, n, os.path.relpath(path)))

if __name__ == "__main__":
    main()
