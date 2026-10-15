# The plans of the interiors' polish (tools/wnetrza/build.py): one function per map, run on the map as the user left it
# (wlib.Room). Map102/103/104/117 were arranged by the user in the editor on 2026-10-12 - "to, co zmieniłem, ma zostać":
# there only small things go into empty places. The others are refurnished: zones (hearth, sleeping, the trade of the one
# who lives there, the table, stores), things against the walls, a runner / rug centred, windows evenly spaced, wall
# decoration in layers (floor -> furniture -> things on the furniture -> walls), every light a flame.
from wlib import *   # noqa: F401,F403
import wlib

PLANS = {}


def plan(mid):
    def deco_(f):
        PLANS[mid] = f
        return f
    return deco_


# ---- common pieces ---------------------------------------------------------------------------------------------------
def chest(mp, x, y, idx=6, d=2, name="Skrzynia"):
    return mp.pic(x, y, "!Fantasy_chest", idx, d, 0, name, floor=True)


def barrel(mp, x, y, kind="plain"):
    """a barrel standing on (x, y), its lid on the row above: plain / water (open) / cloth / apples / wine / bottles"""
    c, r = {"plain": (14, 0), "water": (13, 0), "cloth": (15, 0), "apples": (14, 2), "wine": (15, 3), "bottles": (15, 2),
            "red": (13, 2)}[kind]
    if kind in ("wine",):
        mp.t("D", 15, 3, x, y - 1); mp.t("D", 15, 4, x, y)
    else:
        mp.tiles("D", c, r, 1, 2, x, y - 1)
    mp.solid.add((x, y))


def sacks(mp, x, y, wide=True):
    """sacks of grain / flour: 2x2 (D 8..9, 2..3) standing on row y, or one (D 8/9,4)"""
    if wide:
        mp.tiles("D", 8, 2, 2, 2, x, y - 1)
        mp.solid |= {(x, y), (x + 1, y)}
    else:
        mp.t("D", 9, 4, x, y); mp.solid.add((x, y))


def crate(mp, x, y, kind="tall"):
    c, r, h = {"tall": (13, 3, 2), "jug": (11, 3, 2), "two": (12, 3, 2)}[kind]
    mp.tiles("D", c, r, 1, h, x, y - h + 1)
    mp.solid.add((x, y))


def plant_pot(mp, x, y, kind="green"):
    """a potted plant (D 4,8..9 green, 5,8..9 small, 6,8..9 flowers, 7,8..9 blue flowers): its pot on (x, y)"""
    c = {"green": 4, "small": 5, "flowers": 6, "blue": 7, "fern": 4}[kind]
    mp.tiles("D", c, 7, 1, 2, x, y - 1)
    mp.solid.add((x, y))


def wardrobe(mp, x, y, kind="plain"):
    """a wardrobe standing on (x, y) against the back wall, its top on the wall row above"""
    if kind == "plain": mp.tiles("C", 5, 11, 1, 2, x, y - 1)
    elif kind == "wide": mp.tiles("C", 6, 10, 2, 3, x, y - 2)
    mp.solid |= {(x, y)} | ({(x + 1, y)} if kind == "wide" else set())


def dresser(mp, x, y, kind="dishes"):
    """a 2x2 sideboard / kitchen dresser against the back wall (C 6..7,2..3 dishes, C 6..7,4..5 bowls, C 4..5,4..5 green
    plates and loaves, C 3..4,9..10 the plate cupboard)"""
    c, r = {"dishes": (6, 2), "bowls": (6, 4), "kitchen": (4, 4), "cupboard": (3, 9)}[kind]
    mp.tiles("C", c, r, 2, 2, x, y - 1)
    mp.solid |= {(x, y), (x + 1, y)}


def shelf_tall(mp, x, y, kind="bread"):
    """a tall 1x2 shelf against the back wall (C 5..7,6..7: bread, fruit, jars; C 3,4..5 jars; C 5..7,8..9 crockery)"""
    c, r = {"bread": (5, 6), "fruit": (6, 6), "jars": (7, 6), "potions": (3, 4), "cups": (5, 8), "plates": (6, 8),
            "bowls": (7, 8), "books": (3, 0)}[kind]
    mp.tiles("C", c, r, 1, 2, x, y - 1)
    mp.solid.add((x, y))


def bookcase(mp, x, y, w=1):
    """books: 1 wide C(2,0..2) three tall, or 2 wide C(0..1,6..7)"""
    if w == 1:
        mp.tiles("C", 2, 0, 1, 3, x, y - 2); mp.solid.add((x, y))
    else:
        mp.tiles("C", 0, 6, 2, 2, x, y - 1); mp.solid |= {(x, y), (x + 1, y)}


def rug_k(mp, x0, y0, x1, y1, kind):
    mp.kind(1, mp.rect(x0, y0, x1, y1), kind)


RUG_RED, RUG_MAT, RUG_RED_GOLD, RUG_BROWN, RUG_PURPLE, RUG_BLUE, RUG_ORANGE, RUG_GREEN = 36, 37, 38, 21, 22, 28, 29, 30


def doormat(mp, x, y):
    """the mat inside the door (the landing's cell): the plain linen mat A2 37"""
    rug_k(mp, x, y, x, y, RUG_MAT)


def table_items(mp, cells):
    for (x, y, sheet, c, r) in cells:
        on_top(mp, x, y, sheet, c, r)


# ======================================================================================================================
@plan(100)
def chatka(mp):
    """the hero's hut (Farming's furnishing floor x1-5 y3-4 stays empty): the windows' sun only by day, the cold lamp-light
    that came from nowhere -> a lantern on the wall between the windows (a flame), the window events on their lower cell"""
    for e in mp.ev_named(r"^okno"):
        e["note"] = e["note"].replace(",r=255,g=220,b=180>", ",r=255,g=220,b=180,when=day>")
        mp.move(e, e["x"], 2)
    for e in mp.ev_named(r"^swiatlo$"):
        mp.drop(e)
    lantern(mp, 3, 1, style=0, light=L_LANTERN_SMALL)
    # (<LightWhen> / when=day work only with <DarkDay>: the hut gets the town interiors' day / night darkness)
    mp.props["note"] = "\n".join(["<Dust:off>", "<Dark:on>", "<DayNight:off>", "<Zoom:1.5>", "<DarkDay:60>", "<DarkNight:175>"])
    return mp


@plan(105)
def dom_kowala(mp):
    """Tadek Młot's room behind the smithy: the stone hearth in the middle, his bed and chest on the left, the dining table,
    the smith's corner on the right (weapon rack, anvil, grindstone, quenching barrel, a crate of iron), his own work on the
    walls (swords on shields flanking the chimney, round shields), two windows evenly spaced"""
    mp.wipe(1, 1, 13, 9, rugs=True, keep=[r"^Kominek", r"^Drewno"])
    g = "Izba"
    # ---- the back wall: window | sword | chimney | sword | window, shields at the ends
    window2(mp, 3, 1, curtain=1, length=120)
    window2(mp, 11, 1, curtain=1, length=120)
    mp.tiles("D", 4, 0, 1, 2, 5, 1)
    mp.tiles("D", 5, 0, 1, 2, 9, 1)
    wall_d(mp, 1, 2, 0, 0, z=2)
    wall_d(mp, 13, 2, 2, 0, z=2)
    # ---- the hearth: a big rug before it
    rug_k(mp, 6, 5, 8, 7, RUG_BROWN)
    # ---- sleeping (left): the bed, the nightstand with a candle, the chest at its foot, a wardrobe
    bed(mp, (12, 10), 1, 4, group=g, kind="łóżko kowala")
    nightstand_candle(mp, 2, 4, group=g)
    chest(mp, 1, 6)
    wardrobe(mp, 4, 4)
    # ---- the table (bottom left): two chairs above, one at the end, bread, a jug, a candle
    table_h(mp, 3, 7, 3, style=6, group=g + " stół")
    chair(mp, 3, 6, 2, group=g); chair(mp, 5, 6, 2, group=g)
    chair(mp, 2, 8, 6, group=g)
    on_top(mp, 3, 7, "D", 5, 10); on_top(mp, 5, 7, "D", 1, 15)
    candle_on(mp, 4, 8)
    barrel(mp, 1, 9, "plain")
    # ---- the smith's corner (right): the weapon rack, the quenching barrel, the anvil, the grindstone, a crate of iron
    mp.tiles("E", 8, 10, 2, 2, 12, 3)
    mp.solid |= {(12, 4), (13, 4)}
    barrel(mp, 13, 6, "water")
    mp.tprop("kowadlo", 13, 7, group=g)
    mp.tprop("szlifierka", 13, 9, group=g)
    sacks(mp, 12, 9, wide=False)
    doormat(mp, 7, 9)
    return mp


@plan(106)
def dom_garbarza(mp):
    """Ignac, tanner and shoemaker: his bed, chest and a little table on the left, a stove; the cobbler's corner in the
    middle (shoe racks against the wall, his bench with lasts - he stands at it, the marker faces it); the tannery on the
    cobbles (hide frames, two vats, the wash tub, a scraping table, sacks of bark, a lantern); two windows"""
    mp.wipe(1, 1, 14, 9, rugs=True)
    g = "Izba"
    window2(mp, 4, 1, curtain=1, length=110)
    window2(mp, 11, 1, curtain=None, style="shutters", length=110)
    # ---- living (left)
    bed(mp, (12, 10), 1, 4, group=g, kind="łóżko garbarza")
    nightstand_candle(mp, 2, 4, group=g)
    chest(mp, 1, 6)
    mp.hprop("kolki_ubrania", 3, 3, group=g)
    table_sq(mp, 2, 8, style=4, group=g + " stół")
    chair(mp, 4, 8, 4, group=g); chair(mp, 4, 9, 4, group=g)
    on_top(mp, 2, 8, "D", 0, 14)
    candle_on(mp, 3, 8)
    # the stove against the wall (its hood above), firewood beside it
    PP.kitchen_stove(mp, 5, 4)
    PP.firewood(mp, 4, 4)
    # ---- the cobbler (middle)
    mp.tprop("polka_buty", 6, 4, group=g + " buty")
    mp.tprop("polka_buty", 7, 4, group=g + " buty")
    shelf_tall(mp, 8, 4, "jars")
    mp.tprop("lawa_szewska", 6, 7, occupy="right=1", group=g)
    rug_k(mp, 5, 6, 8, 8, RUG_BROWN)
    mp.hprop("kolki_ubrania", 9, 3, group=g)
    # ---- the tannery (cobbles, right)
    mp.tprop("skora_rama", 10, 4, group=g + " skóry")
    mp.tprop("skora_rama2", 12, 4, group=g + " skóry")
    mp.t("D", 15, 3, 13, 4); mp.t("D", 15, 4, 14, 4); mp.solid |= {(13, 4), (14, 4)}
    lantern(mp, 13, 2, style=0)
    mp.tprop("balia_tarka", 14, 6, group=g)
    mp.tprop("cebrzyk_woda", 14, 7, group=g)
    table_h(mp, 11, 7, 2, style=6, group=g + " stół garbarski")
    on_top(mp, 11, 7, "D", 1, 10); on_top(mp, 12, 7, "D", 0, 9)
    sacks(mp, 13, 9)
    doormat(mp, 8, 9)
    return mp


@plan(107)
def dom_woziwody(mp):
    """Kuba the water carrier: a bare stone room full of barrels, a small hearth with a pot (he stands at it), the cart by
    the door, buckets and the yoke, a straw bed, a stool with a candle - and the iron-bound box at the bed's foot"""
    mp.wipe(1, 1, 12, 8, rugs=True)
    g = "Izba"
    window2(mp, 4, 1, curtain=None, style="stone", length=90)
    window2(mp, 10, 1, curtain=None, style="stone", length=90)
    wall_d(mp, 1, 1, 13, 7); wall_d(mp, 12, 1, 15, 7)
    shelf_wall(mp, 5, 2, "pots"); shelf_wall(mp, 9, 2, "jug")
    # ---- the hearth in the middle of the back wall
    hearth_cauldron(mp, 7, 4, group=g, wood=False)
    PP.firewood(mp, 8, 4)
    mp.tprop("nosidla", 6, 4, group=g)
    rug_k(mp, 6, 6, 8, 8, RUG_MAT)
    # ---- the barrels (left)
    mp.tiles("D", 10, 0, 3, 2, 1, 3); mp.solid |= {(1, 4), (2, 4), (3, 4)}
    mp.tprop("beczka_woda_otwarta", 4, 4, group=g)
    mp.tprop("cebrzyk_woda", 1, 6, group=g)
    mp.tprop("wiadro_woda", 1, 7, group=g)
    mp.tprop("woz_beczki", 3, 8, occupy="right=1", group=g)
    # ---- sleeping (right)
    bed(mp, (9, 13), 12, 4, group=g, kind="siennik")
    stool(mp, 11, 4, group=g)
    mp.hprop("swieca_stolek", 11, 4, group=g, note=L_CANDLE_SMALL)
    mp.prop("szkatula", 12, 6, group=g)
    # ---- his table (right, bottom): bread, a jug; sacks by the wall
    mp.tiles("C", 6, 0, 1, 2, 10, 7); mp.solid |= {(10, 7), (10, 8)}
    on_top(mp, 10, 7, "D", 1, 15)
    stool(mp, 11, 8, group=g)
    sacks(mp, 12, 8, wide=False)
    return mp


@plan(108)
def dzwonnica(mp):
    """the bell tower's ground room: the axis is the stair arch and the bell rope (a rug under it, where Ambroży stands
    to ring), the Order's banners and the raven on the back wall between two torches; his cot against the wall on the
    right with a chest at its foot (the cell beside it stays free - Rafał hides there in W6), the knight's armour and the
    table with the book of signals on the left, the old bell at the bottom"""
    mp.wipe(1, 4, 9, 11, rugs=True, keep=[r"^Sznur", r"^Zbroja", r"^stary dzwon"])
    g = "Wieża"
    torch_wall(mp, 4, 3); torch_wall(mp, 6, 3)
    # the rope's rug, the doormat
    rug_k(mp, 4, 6, 6, 8, RUG_RED_GOLD)
    doormat(mp, 5, 11)
    # the cot against the wall, the chest at its foot
    bed(mp, (9, 13), 9, 4, group=g, kind="prycza")
    chest(mp, 9, 6)
    # the table with the book of signals, a candle, a chair
    mp.tiles("C", 6, 0, 1, 2, 1, 6); mp.solid |= {(1, 6), (1, 7)}
    on_top(mp, 1, 6, "D", 6, 10)
    candle_on(mp, 1, 7)
    chair(mp, 2, 7, 4, group=g)
    # stores: barrels and a bucket in the corners, a crate by the bell
    barrel(mp, 1, 10, "water")
    mp.t("D", 10, 4, 1, 11); mp.solid.add((1, 11))
    crate(mp, 9, 11, "tall")
    return mp


@plan(109)
def dom_mieszczan(mp):
    """an ordinary town family (parents, Zosia and Bronek): the hearth in the middle with a linen rug before it, the
    pantry shelves either side of it, the parents' double bed with a wardrobe, the children's two beds (the teddy on one)
    with their toy chest, the family table for four, the spinning wheel, the churn and the water barrel"""
    mp.wipe(1, 3, 14, 9, rugs=True, keep=[r"^Palenisko", r"^Drewno"])
    g = "Izba"
    # ---- the walls: two landscapes, the windows (flowers on the sills stay), herbs and garlic by the chimney
    mp.ev(3, 3, "!Decoration_static", 7, 4, 1, name="Obraz z zamkiem", priority=0, through=True)
    mp.ev(13, 3, "!Decoration_static", 7, 4, 2, name="Obraz z łąką", priority=0, through=True)
    # ---- the hearth: the pantry shelves either side, the rug
    shelf_tall(mp, 6, 4, "bread"); shelf_tall(mp, 10, 4, "jars")
    rug_k(mp, 7, 5, 9, 7, RUG_MAT)
    # ---- the parents (left)
    bed(mp, (13, 13), 1, 4, w=2, group=g, kind="łóżko rodziców")
    nightstand_candle(mp, 3, 4, group=g)
    wardrobe(mp, 4, 4)
    # ---- the children (right)
    bed(mp, (12, 10), 13, 4, group=g, kind="łóżeczko Zosi")
    bed(mp, (15, 10), 14, 4, group=g, kind="łóżeczko Bronka")
    mp.t("D", 8, 10, 13, 5, z=3)
    chest(mp, 12, 4, idx=6)
    chest(mp, 14, 6, idx=6, name="Skrzynia z zabawkami")
    # ---- the family table (four places)
    table_h(mp, 4, 7, 3, style=4, group=g + " stół")
    chair(mp, 4, 6, 2, group=g); chair(mp, 6, 6, 2, group=g)
    chair(mp, 3, 8, 6, group=g); chair(mp, 7, 8, 4, group=g)
    deco(mp, 5, 8, 0, 6, 0, "Misa z owocami")
    on_top(mp, 4, 7, "D", 0, 11); on_top(mp, 6, 7, "D", 1, 11); on_top(mp, 5, 7, "D", 4, 10)
    candle_on(mp, 6, 8)
    # ---- the house work: the spinning wheel by the fire, the churn and the water barrel in the corner
    mp.hprop("kolowrotek", 11, 7, group=g, name="Kołowrotek")
    stool(mp, 12, 7, group=g)
    mp.hprop("maselnica", 2, 9, group=g, name="Maselnica")
    barrel(mp, 1, 9, "water")
    plant_pot(mp, 14, 9, "green")
    doormat(mp, 8, 9)
    return mp


@plan(110)
def izba_pod_skala(mp):
    """a poor room dug into the rock under the fortress terrace: the two small windows the hut shows from outside, the fire
    pit with the pot in the middle under the lantern, a stool either side of it, two straw beds against the wall with a
    crate at each foot, sacks and a broken crate, a rough table with a candle, water, firewood"""
    mp.wipe(1, 3, 10, 8, rugs=True, keep=[r"^Kocioł"])
    g = "Izba"
    window2(mp, 3, 1, curtain=None, style="stone", length=90)
    window2(mp, 9, 1, curtain=None, style="stone", length=90)
    # the fire: stools either side, a mat before it
    stool(mp, 4, 5, small=True, group=g); stool(mp, 8, 5, small=True, group=g)
    doormat(mp, 6, 8)
    # the two straw beds, a crate at each foot
    bed(mp, (9, 13), 1, 4, group=g, kind="siennik")
    bed(mp, (9, 13), 10, 4, group=g, kind="siennik")
    mp.t("D", 5, 11, 1, 6); mp.solid.add((1, 6))
    mp.t("D", 5, 11, 10, 6); mp.solid.add((10, 6))
    # stores against the back wall: sacks, the broken crate, a pot rack
    sacks(mp, 3, 4)
    mp.tiles("D", 13, 5, 1, 2, 8, 3); mp.solid.add((8, 4))
    barrel(mp, 9, 4, "plain")
    mp.tiles("D", 0, 6, 1, 2, 5, 2, z=3)
    # the rough table with a candle and a bowl, a stool; water and firewood in the bottom corners
    mp.tiles("C", 6, 0, 1, 2, 2, 7); mp.solid |= {(2, 7), (2, 8)}
    on_top(mp, 2, 7, "D", 0, 14)
    candle_on(mp, 2, 8)
    stool(mp, 3, 8, small=True, group=g)
    mp.tprop("wiadro_woda", 1, 8, group=g)
    mp.t("D", 10, 5, 10, 8); mp.solid.add((10, 8))
    mp.t("D", 10, 5, 9, 8); mp.solid.add((9, 8))
    return mp


@plan(112)
def chata_praczki(mp):
    """Marta Ługowa the washerwoman and her son Franek: the hearth with the pot in the middle, a straw bed either side
    (hers with a candle on a stool), the washing - a covered barrel of lye, baskets of linen, a stool with folded towels,
    the drying rack with white strips, the tub with the brush and soap, clothes on pegs; the table with two stools, the
    broom; windows with linen curtains"""
    mp.wipe(1, 1, 11, 8, rugs=True, keep=[r"^Palenisko", r"^Drewno"])
    g = "Izba"
    window2(mp, 3, 1, curtain=1, length=100)
    window2(mp, 9, 1, curtain=1, length=100)
    mp.hprop("kolki_ubrania", 4, 3, group=g + " kołki")
    mp.hprop("kolki_ubrania", 8, 3, group=g + " kołki")
    rug_k(mp, 5, 6, 7, 8, RUG_MAT)
    # ---- Marta (left)
    bed(mp, (9, 13), 1, 4, group=g, kind="siennik")
    stool_candle(mp, 2, 4, group=g)
    barrel(mp, 3, 4, "cloth")
    mp.tiles("D", 14, 3, 1, 2, 4, 3); mp.solid.add((4, 4))
    # ---- Franek (right)
    bed(mp, (9, 13), 11, 4, group=g, kind="siennik")
    mp.prop("stolek_reczniki", 10, 4, group=g)
    mp.tiles("D", 14, 3, 1, 2, 8, 3); mp.solid.add((8, 4))
    # ---- the table (left): soup, bread, two stools
    table_h(mp, 2, 7, 2, style=6, group=g + " stół")
    on_top(mp, 2, 7, "D", 0, 14); on_top(mp, 3, 7, "D", 0, 15)
    stool(mp, 4, 8, group=g); stool(mp, 1, 8, group=g)
    # ---- the washing (right): the drying rack, the tub with brush and soap, the broom
    mp.oprop("stojak_pasy", 9, 7, name="stojak z praniem", occupy="right=1")
    mp.prop("cebrzyk", 11, 8, group=g)
    mp.tiles("D", 7, 6, 1, 2, 11, 6, z=3)
    return mp


@plan(113)
def chata_drwala(mp):
    """Zbych Smolarz, woodcutter and charcoal burner: the stone fireplace in the middle with a rug before it, his axes on
    the wall either side, smoked meat hanging, the bed with a chest at its foot, the woodpile, the charcoal corner (sacks,
    a heap of lumps, a basket), the table with bread, a jug, a candle and two stools, two windows"""
    mp.wipe(1, 1, 11, 8, rugs=True, keep=[r"^Kominek", r"^Drewno"])
    g = "Izba"
    window2(mp, 2, 1, curtain=None, length=100)
    window2(mp, 10, 1, curtain=None, length=100)
    mp.tiles("E", 15, 8, 1, 2, 3, 2); mp.tiles("E", 15, 8, 1, 2, 9, 2)
    hang_pole(mp, 4, 2, "hams"); hang_pole(mp, 8, 2, "hams")
    wall_d(mp, 1, 1, 13, 7)
    rug_k(mp, 5, 6, 7, 7, RUG_BROWN)
    # ---- the charcoal corner (left)
    sacks(mp, 1, 4)
    mp.tiles("D", 14, 3, 1, 2, 3, 3); mp.solid.add((3, 4))
    mp.tiles("D", 11, 8, 2, 1, 1, 8); mp.solid |= {(1, 8), (2, 8)}
    mp.t("D", 9, 4, 3, 8); mp.solid.add((3, 8))
    barrel(mp, 1, 6, "water")
    # ---- the bed, its chest, the woodpile (right)
    bed(mp, (9, 13), 11, 4, group=g, kind="siennik")
    chest(mp, 11, 6)
    PP.firewood(mp, 9, 4); PP.firewood(mp, 10, 4)
    # ---- the table (bottom right)
    table_h(mp, 8, 7, 2, style=6, group=g + " stół")
    on_top(mp, 8, 7, "D", 5, 10); on_top(mp, 9, 7, "D", 1, 15)
    candle_on(mp, 9, 8)
    stool(mp, 10, 8, group=g); stool(mp, 7, 8, group=g)
    doormat(mp, 6, 8)
    return mp


@plan(114)
def chata_klusownika(mp):
    """Rysiek Sidło the poacher: the fire under a pot moved off the bare boards onto a stone hearth against a stone
    chimney breast; meat and fish hanging from poles, snares and chains, his bows; two windows with ragged curtains; hides
    on frames, the wolf pelt by his bed, the crate of snares, the barrel of salted meat, a butcher's table with a knife
    and a board, a candle"""
    mp.wipe(1, 1, 10, 8, rugs=False, keep=[r"^Kocioł", r"^skóra"])
    g = "Izba"
    # ---- the hearth: a stone breast in the log wall, flagstones under the fire
    mp.restyle_face(mp.rect(5, 1, 7, 3), 71)
    mp.kind(0, mp.rect(5, 4, 7, 5), 97)
    for e in mp.ev_named(r"^Kocioł$"):
        mp.move(e, 6, 4)
        e["name"] = "Palenisko z kotłem"
    # ---- the back wall
    window2(mp, 3, 1, curtain=7, length=90)
    window2(mp, 9, 1, curtain=7, length=90)
    hang_pole(mp, 2, 2, "hams"); hang_pole(mp, 4, 2, "fish"); hang_pole(mp, 8, 2, "hams")
    mp.tiles("E", 15, 11, 1, 2, 10, 2)
    mp.t("D", 10, 6, 1, 2, z=3)
    wall_d(mp, 10, 1, 15, 7)
    # ---- his bed, the pelt beside it, the crate of snares at its foot
    bed(mp, (9, 13), 1, 4, group=g, kind="siennik")
    crate(mp, 1, 7, "two")
    # ---- the hides (right), the barrel of salted meat, sacks
    barrel(mp, 10, 7, "plain")
    mp.t("D", 9, 4, 10, 8); mp.solid.add((10, 8))
    # ---- the butcher's table: a board with meat, a knife, a candle, a stool
    table_h(mp, 7, 7, 2, style=6, group=g + " stół")
    on_top(mp, 7, 7, "D", 0, 8); on_top(mp, 8, 7, "D", 1, 10)
    candle_on(mp, 8, 8)
    stool(mp, 9, 8, small=True, group=g)
    doormat(mp, 6, 8)
    return mp


@plan(115)
def izba_znachorki(mp):
    """babka Jadwiga the healer: the hearth with the brewing cauldron in the middle (she stands before it), herbs and
    garlic drying either side of the chimney, a potted herb either side of the firewood; her apothecary along the left
    wall (the cabinet of potions, the shelf of jars, the little table of bottles), the work table with a bowl, a bottle and
    a candle; her bed with a nightstand candle and a chest; the bench for the sick by the door; two windows"""
    mp.wipe(1, 1, 11, 8, rugs=False, keep=[r"^Palenisko", r"^Drewno"])
    g = "Izba"
    window2(mp, 2, 1, curtain=1, length=110)
    window2(mp, 10, 1, curtain=1, length=110)
    hang_pole(mp, 3, 2, "herbs"); hang_pole(mp, 4, 2, "garlic")
    hang_pole(mp, 8, 2, "garlic"); hang_pole(mp, 9, 2, "herbs")
    plant_pot(mp, 4, 4, "small"); plant_pot(mp, 8, 4, "small")
    # ---- the apothecary (left wall)
    mp.tiles("E", 14, 1, 1, 2, 1, 3); mp.solid.add((1, 4))
    shelf_tall(mp, 2, 4, "jars")
    mp.tiles("E", 9, 3, 1, 2, 3, 3); mp.solid.add((3, 4))
    # ---- the work table
    table_h(mp, 2, 7, 2, style=6, group=g + " stół")
    on_top(mp, 2, 7, "D", 0, 10); on_top(mp, 3, 7, "D", 4, 13)
    candle_on(mp, 2, 8)
    stool(mp, 4, 8, group=g)
    mp.tiles("D", 14, 3, 1, 2, 1, 7); mp.solid.add((1, 8))
    # ---- her bed (right)
    bed(mp, (9, 13), 11, 4, group=g, kind="siennik")
    nightstand_candle(mp, 10, 4, group=g)
    chest(mp, 11, 6)
    # ---- the bench for the sick
    bench_h(mp, 9, 8, group=g + " ława")
    rug_k(mp, 5, 6, 7, 8, RUG_MAT)
    return mp


@plan(116)
def kram_starzyzny(mp):
    """Józek Łata's junk shop - full, but in order: the counter across with his scales, an old pot, a globe and a box of
    papers (he stands behind it), shelves of crockery behind him, old shields, a mirror and pans on the back wall between
    two windows, a lantern over the counter; for the customers: barrels, the ladder, a rack of old weapons, crates and
    broken crates stacked in the corners, a worn rug before the counter"""
    mp.wipe(1, 1, 12, 8, rugs=True)
    g = "Kram"
    window2(mp, 3, 1, curtain=None, length=100)
    window2(mp, 10, 1, curtain=None, length=100)
    # ---- the back wall: mirror | window | shields | pans | shields | window | swords
    mp.tiles("D", 1, 4, 1, 2, 1, 1)
    wall_d(mp, 4, 2, 0, 0, z=2); wall_d(mp, 5, 2, 2, 0, z=2)
    mp.tiles("D", 0, 6, 1, 2, 6, 2, z=2)
    wall_d(mp, 7, 2, 3, 0, z=2); wall_d(mp, 8, 2, 1, 0, z=2)
    mp.tiles("E", 13, 8, 1, 2, 9, 2)
    lantern(mp, 6, 1, style=0)
    # ---- behind the counter: shelves of crockery
    shelf_tall(mp, 3, 4, "cups"); shelf_tall(mp, 7, 4, "fruit"); shelf_tall(mp, 8, 4, "bowls")
    shelf_tall(mp, 2, 4, "books")
    # ---- the counter with his goods
    PP.counter_h(mp, 3, 8, 5, group=g + " lada")
    on_top(mp, 3, 5, "D", 4, 14); on_top(mp, 4, 5, "D", 0, 12); on_top(mp, 6, 5, "D", 5, 12); on_top(mp, 8, 5, "D", 7, 14)
    candle_on(mp, 7, 6)
    rug_k(mp, 5, 7, 8, 8, RUG_BROWN)
    # ---- the customers' side: barrels and the ladder (left), the weapon rack, broken crates, crates (right)
    mp.tiles("D", 8, 0, 2, 2, 2, 7); mp.solid |= {(2, 8), (3, 8)}
    mp.tiles("D", 8, 13, 1, 3, 1, 6, z=3); mp.solid.add((1, 8))
    mp.tiles("E", 8, 10, 2, 2, 11, 3); mp.solid |= {(11, 4), (12, 4)}
    mp.tiles("D", 14, 5, 2, 2, 11, 5); mp.solid |= {(11, 6), (12, 6)}
    barrel(mp, 12, 8, "plain")
    mp.t("D", 9, 4, 11, 8); mp.solid.add((11, 8))
    return mp


# ---- Osada Milczących (Map121-124): the Silent's lore things and their look events stay where they are (tests/osada_huts_test.js
# reads them from tools/osada/staging); the rooms get what was missing around them
@plan(121)
def wspolna_izba(mp):
    """the common room: the gardener's corner a potted herb next to the seed cupboard, sconces either side of the chimney"""
    g = "Izba"
    plant_pot(mp, 12, 4, "small")
    sconce_wall(mp, 5, 3); sconce_wall(mp, 9, 3)
    return mp


@plan(122)
def chata_tkaczki(mp):
    """the weaver's hut: a linen wardrobe and a shelf of yarn baskets along the back wall, a cupboard of bowls by the
    hearth, the wool corner (a covered basket, sacks) instead of the two things lost on the floor, a small table with a
    bowl beside her candle, a chest of drawers at the bed"""
    g = "Izba"
    mp.clear(2, [(1, 6), (1, 7)])
    wardrobe(mp, 5, 4)
    shelf_wall(mp, 3, 2, "baskets")
    shelf_tall(mp, 7, 4, "bowls")
    mp.tiles("D", 14, 3, 1, 2, 1, 7); mp.solid.add((1, 8))
    mp.t("D", 9, 4, 2, 8); mp.solid.add((2, 8))
    mp.tiles("C", 6, 0, 1, 2, 5, 7); mp.solid |= {(5, 7), (5, 8)}
    on_top(mp, 5, 7, "D", 0, 14)
    doormat(mp, 6, 8)
    return mp


@plan(123)
def chata_najstarszego(mp):
    """the elder's hut: the rug centred before the hearth, a candle on a nightstand by the bed, a washstand and a water
    barrel in the empty corner, a low shelf of books beside the bookcase, a barrel next to the crate"""
    g = "Izba"
    mp.clear(1, mp.rect(8, 7, 11, 8))
    rug_k(mp, 6, 6, 8, 7, RUG_RED)
    nightstand_candle(mp, 2, 4, group=g)
    HL.washstand(mp, 1, 7, group=g)
    barrel(mp, 1, 9, "water")
    barrel(mp, 12, 9, "plain")
    doormat(mp, 7, 9)
    return mp


@plan(124)
def chata_rzezbiarza(mp):
    """the carver's hut: the fire pit gets a flagstone floor (it burned on the boards), the basket lost in the middle goes,
    a rack of carving wood hangs over the planks, a chest at the bed's foot, a crate of carved figures and a sack beside
    the firewood, a log to carve by the bench"""
    g = "Izba"
    mp.kind(0, mp.rect(6, 5, 8, 7), 97)
    mp.clear(2, [(8, 7)])
    hang_pole(mp, 3, 2, "wood")
    chest(mp, 11, 6)
    mp.t("D", 5, 11, 2, 8); mp.solid.add((2, 8))
    mp.t("D", 10, 5, 1, 6); mp.solid.add((1, 6))
    doormat(mp, 6, 8)
    return mp


# ---- the user's own rooms (2026-10-12, "to, co zmieniłem, ma zostać"): only additions in empty places
@plan(104)
def ratusz(mp):
    """the town hall: standing candelabras either side of the sołtys's desk (the hall was dark at night but for one candle),
    a candle on the office table"""
    PP.candelabra(mp, 5, 5)
    PP.candelabra(mp, 9, 5)
    candle_on(mp, 18, 8)
    doormat(mp, 17, 11)
    return mp


@plan(117)
def dom_uchodzcow(mp):
    """the refugees' house: flagstones under the fire (it burned on the bare boards)"""
    mp.kind(0, mp.rect(7, 4, 9, 5), 97)
    doormat(mp, 8, 9)
    return mp


@plan(103)
def kantor(mp):
    """the trading house: only the doormats inside the two doors"""
    doormat(mp, 3, 10)
    doormat(mp, 12, 10)
    return mp
