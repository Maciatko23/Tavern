# The new tavern interior: three ground-floor concepts (A "Długa sala", B "Sala w L", C "Dwie izby") and the guest rooms
# upstairs ("Pokoje gości"), built from the Winlu Fantasy Interior Remaster set (tileset 8).
#   python build_concepts.py            - all four
#   python build_concepts.py A C        - only these (A, B, C, P = upstairs)
# Writes tools/tavern/staging/Map001_<X>.json (+ <X>_meta.json: zones, spots) and Pietro.json. Never touches data/.
# The maps keep events 1..12 of the current Map001 at their ids (Borgar, Melia, Grum, Ozzy, the four "Atmosfera"
# parallels, the loose brick, the three exits) - moved to their new places; everything else gets ids from 13.
import sys
from props import *
from tavlib import FLAGS8

NOTE = "<Dust:off>\n<Dark:on>\n<DayNight:off>\n<Zoom:1.5>"
FACE = 3            # wall faces are three cells tall
UPSTAIRS_ID = 25    # the guest rooms' map id proposed for the build (free today; check MapInfos when applying)

def seal_walls(mp):
    """blockers over every wall cell the player could walk onto in the game: the engine decides a cell's passage by the
    TOPMOST tile that is not a star tile, so a wall of an impassable kind still lets the player in where a shelf, a
    window or a barrel (flags 0 in tileset 8) is painted over it; walls of passable kinds (most A3 kinds, border 33)
    and the A5 voids/hearths let him in anyway. A greedy cover of those cells with rectangles, one invisible event each."""
    data, W, H = mp.resolve(), mp.W, mp.H
    def engine_passable(x, y):
        for z in (3, 2, 1, 0):
            t = data[(z * H + y) * W + x]
            f = FLAGS8[t] if t < len(FLAGS8) else 0
            if f & 0x10: continue
            return (f & 0xF) != 0xF
        return False
    def wall_cell(x, y):
        t = mp.layers[0].get((x, y))
        if not t: return True
        if t[0] == "k": return 48 <= t[1] < 80 or t[1] in mp.border_kinds
        return t[1] == A5(0, 0) or A5(0, 11) <= t[1] <= A5(7, 13)
    cells = {(x, y) for y in range(H) for x in range(W) if wall_cell(x, y) and engine_passable(x, y)}
    cells -= mp.blocked
    # (cells an event already stands on - a door, a fireplace, the brick - are closed by that event)
    cells -= {(x, y) for (x, y, e) in mp.events if e["pages"][0]["priorityType"] == 1 and not e["pages"][0]["through"]}
    cells -= {(x, y) for eid, (x, y, e) in mp.kept.items()}
    todo = set(cells)
    while todo:
        x0, y0 = min(todo, key=lambda c: (c[1], c[0]))
        x1 = x0
        while (x1 + 1, y0) in todo: x1 += 1
        y1 = y0
        while all((x, y1 + 1) in todo for x in range(x0, x1 + 1)): y1 += 1
        mp.block(x0, y0, x1, y1, "Ściana")
        todo -= mp.rect(x0, y0, x1, y1)

def place_people(mp, spots):
    """events 1..12 of the current Map001 at their new places. spots: {id: (x, y)}; the brick (9) becomes 'same as
    characters' so the action button reaches it in the wall; the 'Atmosfera' parallels stand in the wall (no picture)"""
    for eid, (x, y) in spots.items():
        e = mp.keep(eid, x, y)
        if eid == 9:
            for pg in e["pages"]:
                pg["priorityType"] = 1
                pg["through"] = False
        if eid in (1, 2, 3, 4, 9): mp.solid.add((x, y))

def exits(mp, xs, y, landing):
    """the three exits (events 10..12) in the doorway of the bottom wall; their transfers are Map008's as today"""
    for eid, x in zip((10, 11, 12), xs):
        mp.keep(eid, x, y)
    mp.landing = landing
    mp.exit_cells = [(x, y) for x in xs]

def vestibule(mp, x0, x1, bottom, floor_kind, wall_kind, door_xs, face=2):
    """the entrance hall ("sień") in the middle of the bottom wall: side partitions, its own north wall (`face` rows) with
    a passage into the hall over the door, coat pegs (stand-in) on the left of it, the quest board on the right, a bench,
    a doormat and a lantern. Returns (first passage column, last, the partition's top row, the first floor row)."""
    top = bottom - 2 - face - 1        # the partition's top border row
    fy0 = top + 1                      # the face rows
    floor_y0 = fy0 + face              # the vestibule's floor rows: floor_y0 .. bottom-1
    mp.kind(0, mp.rect(x0, top, x1, bottom), mp.border)
    mp.kind(0, mp.rect(x0 + 1, fy0, x1 - 1, fy0 + face - 1), wall_kind)
    mp.kind(0, mp.rect(x0 + 1, floor_y0, x1 - 1, bottom - 1), floor_kind)
    px0, px1 = door_xs[0], door_xs[-1]
    mp.kind(0, mp.rect(px0, top, px1, fy0 + face - 1), floor_kind)                 # the passage into the hall
    mp.kind(0, mp.rect(px0, bottom, px1, bottom), floor_kind)                      # the doorway to the yard
    mp.kind(1, mp.rect(px0, floor_y0, px1, bottom - 1), 37)                        # the doormat
    cloaks(mp, x0 + 1, fy0 + face - 2, colours=(1, 5))                             # coat pegs (stand-in)
    notice_board(mp, x1 - 2, fy0 + face - 1, 2)                                    # the quest board
    mp.labels.append(("Tablica z zadaniami", x1 - 2, fy0 + face - 1))
    mp.labels.append(("Wieszaki", x0 + 1, fy0 + face - 1))
    mp.t("C", 14, 2, x0 + 1, floor_y0); mp.t("C", 14, 4, x0 + 1, floor_y0 + 1)     # a bench
    mp.block(x0 + 1, floor_y0, x0 + 1, floor_y0 + 1, "Ława w sieni")
    mp.t("D", 7, 6, x1 - 1, bottom - 1)                                            # a broom
    mp.block(x1 - 1, bottom - 1, x1 - 1, bottom - 1, "Miotła")
    wall_lantern(mp, px1 + 1, fy0, 0)
    return (px0, px1, top, floor_y0)

def stairs_up(mp, xs, y_top, y_bottom, name="Schody -> Pokoje gości", land=(3, 16), rail=True):
    """a straight wooden staircase (A5 1,2 steps) climbing north from y_bottom to y_top on columns xs; above it darkness;
    walking onto the top step takes the player upstairs"""
    for y in range(y_top, y_bottom + 1):
        for x in xs:
            mp.tile(0, x, y, A5(1, 2))
            mp.layers[1].pop((x, y), None)
        if rail and y > y_top: mp.t("B", 12, 6, xs[0], y)            # a handrail along the open side
    mid = xs[len(xs) // 2]
    for x in xs:
        mp.transfer(x, y_top, UPSTAIRS_ID, min(4, max(2, land[0] + (x - mid))), land[1], 8, name=name, se="Move1")

# =====================================================================================================================
def design_A():
    """A 'Długa sala': one long banquet hall under the back wall that holds everything: the big stone fireplace (W),
    the bar with the kitchen right behind it (middle), Melia's raised stage (E) and the grand staircase climbing along
    the east wall. Two very long tables with benches under four chandeliers fill the hall; the dice corner and a quiet
    corner lie in the bays by the entrance hall. Behind the back wall: the storeroom of old fortress stones (NW, the
    loose brick) and a big kitchen."""
    W, H = 34, 28
    mp = TavernMap(W, H, NOTE, seed=101)
    mp.border = 25
    HALL_F, HALL_W = 81, 50
    rooms = [
        (1, 4, 8, 7, 96, 71, FACE),        # storeroom (old stones)
        (10, 4, 28, 7, 97, 51, FACE),      # kitchen
        (1, 12, 32, 26, HALL_F, HALL_W, FACE),   # the hall
    ]
    shell(mp, rooms, 25)
    opening(mp, 9, 6, 9, 7, 96)            # storeroom <-> kitchen
    opening(mp, 15, 8, 16, 11, 97)         # behind the bar -> kitchen
    # the staircase in the NE corner: from the hall (row 12) up through the back wall into the dark
    mp.kind(0, mp.rect(30, 1, 32, 11), 25)
    stairs_up(mp, (30, 31, 32), 8, 12)
    for y in (6, 7):
        for x in (30, 31, 32): mp.tile(0, x, y, A5(0, 0))
    mp.solidify({(x, y) for x in (30, 31, 32) for y in (6, 7)})
    mp.zone("Schody", 30, 8, 32, 14, (200, 160, 230))
    candelabra(mp, 32, 14)
    px0, px1, vtop, vfloor = vestibule(mp, 12, 20, H - 1, HALL_F, HALL_W, (15, 16, 17))
    mp.zone("Sień", 13, vtop + 1, 19, H - 2, (230, 200, 120))
    # ---------------------------------------------------------------- the storeroom (NW): old fortress stones, the loose brick
    mp.zone("Skład", 1, 1, 8, 7, (150, 150, 170))
    mp.tiles("D", 11, 3, 2, 2, 1, 3); mp.block(1, 4, 2, 4, "Skrzynie")
    mp.tiles("D", 8, 0, 2, 2, 6, 3); mp.block(6, 4, 7, 4, "Beczki")
    mp.tiles("D", 15, 0, 1, 2, 8, 3); mp.block(8, 4, 8, 4, "Beczka")
    mp.tiles("D", 8, 2, 2, 2, 1, 6); mp.block(1, 6, 2, 7, "Worki")
    mp.tiles("D", 13, 3, 1, 2, 3, 6); mp.block(3, 7, 3, 7, "Skrzynia")
    mp.tiles("D", 13, 5, 2, 2, 6, 6); mp.block(6, 7, 7, 7, "Połamane skrzynie")
    mp.t("D", 12, 4, 1, 5); mp.t("D", 14, 4, 2, 5); mp.block(1, 5, 2, 5, "Skrzynki")
    mp.t("D", 15, 7, 8, 1, z=3); mp.t("D", 13, 7, 1, 1, z=3); mp.t("D", 14, 8, 4, 1, z=3)   # cobwebs
    mp.t("A5", 0, 12, 4, 3, z=0)                                                  # the odd stone: the brick
    mp.t("D", 11, 6, 5, 4, z=3)                                                   # stone crumbs under it
    wall_lantern(mp, 7, 1, 1, glow="<Light:150,60,44,24>")
    light(mp, 5, 5, "<Light:120,10,8,4>", "wypelnienie")
    # ---------------------------------------------------------------- the kitchen (behind the bar)
    mp.zone("Kuchnia", 10, 1, 28, 7, (120, 200, 120))
    mp.tiles("D", 13, 0, 1, 2, 10, 3); mp.block(10, 4, 10, 4, "Beczka z wodą")
    stove(mp, 11, 4)
    mp.t("D", 0, 6, 12, 2); mp.t("D", 0, 7, 12, 3)                              # pots and pans on the wall
    mp.tiles("A5", 4, 11, 2, 3, 13, 1, z=0)                                      # the bread oven in the wall
    light(mp, 13, 3, L_OVEN, "zar w piecu")
    firewood(mp, 15, 4)
    mp.t("D", 3, 10, 12, 4); mp.block(12, 4, 12, 4, "Skrzynka")                    # a box by the stove
    light(mp, 17, 5, L_FILL, "wypelnienie"); light(mp, 24, 5, L_FILL, "wypelnienie")
    window(mp, 17, 1, "night")
    hanging(mp, 19, 2, 0); hanging(mp, 20, 2, 1); hanging(mp, 21, 2, 2)           # hams, fish on a pole
    hanging(mp, 22, 2, 3); hanging(mp, 23, 2, 4)                                  # herbs, garlic
    mp.tiles("C", 5, 6, 1, 3, 24, 2); mp.block(24, 4, 24, 4, "Półka z chlebem")
    mp.tiles("C", 7, 6, 1, 3, 25, 2); mp.block(25, 4, 25, 4, "Półka z warzywami")
    mp.tiles("C", 4, 4, 2, 2, 26, 3); mp.block(26, 4, 27, 4, "Spiżarka")
    mp.tiles("D", 14, 0, 1, 2, 28, 3); mp.block(28, 4, 28, 4, "Beczka")
    wall_lantern(mp, 16, 1, 0)
    table_2x2(mp, 11, 6, style=6, items=[(0, 0, "D", 0, 8), (1, 0, "D", 0, 9), (0, 1, "D", 0, 10), (1, 1, "D", 1, 10)], name="Stół do krojenia")
    cauldron_fire(mp, 18, 6)
    table_h(mp, 21, 6, 3, style=4, items=[(0, 0, "D", 4, 10), (1, 0, "D", 5, 10), (2, 0, "D", 0, 13), (1, 1, "D", 2, 10)], name="Stół kuchenny")
    mp.tiles("D", 8, 2, 2, 2, 25, 6); mp.block(25, 7, 26, 7, "Worki z mąką")
    mp.t("D", 14, 2, 28, 7); mp.block(28, 7, 28, 7, "Beczka z jabłkami")
    mp.t("D", 10, 3, 27, 7); mp.block(27, 7, 27, 7, "Worek")
    # ---------------------------------------------------------------- the hall: the big fireplace (west end of the back wall)
    mp.zone("Kominek", 1, 9, 8, 16, (240, 120, 60))
    mp.kind(0, mp.rect(2, 9, 7, 11), 71)                                           # the stone chimney wall
    big_hearth(mp, 3, 9)
    firewood(mp, 2, 12); firewood(mp, 7, 12)
    window(mp, 1, 9, "night", curtain=0)
    window(mp, 8, 9, "night", curtain=0)
    mp.tiles("D", 11, 13, 2, 3, 4, 13)                                             # the bear skin before the fire
    chair(mp, 3, 14, 6, arm=True, name="Fotel"); chair(mp, 6, 14, 4, arm=True, name="Fotel")
    cat(mp, 5, 14)
    mp.t("D", 10, 5, 8, 12); mp.block(8, 12, 8, 12, "Drewno")
    # ---------------------------------------------------------------- the bar (back wall, middle)
    mp.zone("Bar", 9, 9, 22, 16, (255, 210, 60))
    barrel_rack(mp, 9, 11)
    bar_shelf(mp, 13, 10, "bottles")
    bar_shelf(mp, 17, 10, "wine")
    tap_barrels(mp, 19, 11, 4); tap_barrels(mp, 20, 11, 6)
    sign(mp, 21, 10)
    wall_lantern(mp, 12, 9, 0); wall_lantern(mp, 19, 9, 0)
    counter_arm(mp, 9, 13, 15, top_end=True, front=True)
    counter_h(mp, 10, 20, 14, left_end=False)
    on_counter(mp, [(11, 14, "D", 3, 13), (12, 14, "D", 2, 11), (14, 14, "D", 4, 12), (17, 14, "D", 3, 13), (18, 14, "D", 2, 12), (19, 14, "D", 1, 12), (13, 14, "D", 3, 11)])
    candles(mp, 16, 15, three=True)
    for sx in (11, 13, 18, 20): stool(mp, sx, 16)
    light(mp, 15, 12, "<Light:190,60,40,14>", "swiatlo baru")
    # ---------------------------------------------------------------- Melia's stage (NE, against the back wall)
    mp.zone("Scena", 23, 9, 29, 16, (220, 90, 160))
    fy = stage(mp, 23, 29, 12, 3, rug=38)
    window(mp, 23, 9, "night"); window(mp, 29, 9, "night")                        # windows behind red drapes
    mp.tiles("B", 0, 12, 1, 2, 23, 9, z=3); mp.tiles("B", 0, 12, 1, 2, 29, 9, z=3)
    banner(mp, 25, 11, 1); banner(mp, 27, 11, 2)
    deer_head(mp, 26, 9)
    candelabra(mp, 23, 12); candelabra(mp, 29, 12)
    mp.tiles("C", 8, 2, 1, 2, 25, 12); mp.block(25, 13, 25, 13, "Krzesło barda")
    # ---------------------------------------------------------------- two long tables with benches (the banquet)
    mp.zone("Sala biesiadna", 2, 17, 30, 21, (230, 170, 110))
    for (tx, tl) in ((2, 11), (20, 11)):
        items = [(1, 0, "D", 3, 13), (2, 1, "D", 0, 11), (3, 0, "D", 2, 11), (5, 1, "D", 0, 13), (6, 0, "D", 3, 13),
                 (8, 1, "D", 1, 13), (7, 0, "D", 4, 11), (9, 0, "D", 2, 12), (4, 1, "D", 1, 14)]
        table_h(mp, tx, 19, tl, style=6, items=items)
        for bx in range(tx, tx + tl - 1, 2):
            bench_h(mp, bx, 18); bench_h(mp, bx, 21)
        chandelier(mp, tx + 3, 20); chandelier(mp, tx + 7, 20)
    light(mp, 16, 19, L_FILL, "wypelnienie"); light(mp, 22, 15, L_FILL, "wypelnienie"); light(mp, 16, 24, L_FILL, "wypelnienie")
    mp.kind(1, mp.rect(15, 16, 17, 24), 36)                                        # a red runner from the door to the bar
    # ---------------------------------------------------------------- the dice corner (SW bay)
    mp.zone("Kącik do kości", 1, 22, 10, 26, (90, 200, 230))
    mp.kind(1, mp.rect(3, 23, 7, 25), 21)                                          # a dark rug under the players
    round_table(mp, 5, 23, (7, 9))
    on_counter(mp, [(5, 23, "D", 4, 15), (5, 24, "D", 6, 15)])
    stool(mp, 4, 24); stool(mp, 6, 24); stool(mp, 5, 25, small=True)
    tally_stand(mp, 2, 23)
    mp.tiles("D", 8, 0, 2, 2, 1, 25); mp.block(1, 26, 2, 26, "Beczki")
    round_table(mp, 9, 25, (6, 9)); chair(mp, 8, 26, 6); chair(mp, 10, 26, 4)
    # ---------------------------------------------------------------- the quiet corner (SE bay)
    mp.zone("Stoliki", 22, 22, 32, 26, (160, 210, 140))
    round_table(mp, 24, 23, (1, 11)); chair(mp, 23, 24, 6); chair(mp, 25, 24, 4)
    round_table(mp, 29, 23, (5, 11)); chair(mp, 28, 24, 6); chair(mp, 30, 24, 4)
    round_table(mp, 27, 25, (7, 11)); stool(mp, 26, 26); stool(mp, 28, 26)
    candles(mp, 27, 25, three=False)
    mp.tiles("D", 5, 6, 1, 2, 32, 25); mp.block(32, 26, 32, 26, "Roślina")
    mp.tiles("E", 4, 7, 1, 2, 22, 25); mp.block(22, 26, 22, 26, "Beczki")
    # ---------------------------------------------------------------- people and the kept events
    print("  A: fill lights", auto_fill(mp, skip=[(1, 4, 8, 7)]))
    place_people(mp, {1: (14, 13), 2: (27, 13), 3: (7, 24), 4: (6, 16),
                      5: (0, 1), 6: (0, 2), 7: (0, 3), 8: (0, 4), 9: (4, 3)})
    exits(mp, (15, 16, 17), H - 1, (16, H - 2))
    seal_walls(mp)
    wall_shadows(mp)
    return mp

# =====================================================================================================================
def design_B():
    """B 'Sala w L': the hall bends round the kitchen block like an L - a wide room along the front and a wing up the east
    side. The bar sits in the crook: an L-shaped counter wrapped round the corner, Borgar in the corner serving both arms,
    the kitchen right behind him, seen through a serving hatch in the wall. The big fireplace warms the west end of the
    front room, Melia's stage closes the far end of the east wing (the first thing you see looking up it), the stairs
    climb out of the wing's back wall. Brighter walls: plaster and timber with wood panelling, red-brown floorboards."""
    W, H = 34, 28
    mp = TavernMap(W, H, NOTE, seed=202)
    mp.border = 24
    HALL_F, HALL_W = 84, 52
    rooms = [
        (1, 4, 8, 10, 96, 71, FACE),          # storeroom (old stones)
        (10, 4, 19, 10, 97, 51, FACE),        # kitchen
        (21, 4, 32, 26, HALL_F, HALL_W, FACE),     # the east wing (and the east end of the front room)
        (1, 15, 20, 26, HALL_F, HALL_W, FACE),     # the front room, west and middle; its back wall is the kitchen block
    ]
    shell(mp, rooms, 24)
    opening(mp, 9, 8, 9, 9, 96)                # storeroom <-> kitchen
    opening(mp, 18, 11, 19, 14, 97)            # the bar -> kitchen door
    # the serving hatch: an opening in the kitchen wall with the pass counter in it
    opening(mp, 14, 11, 15, 12, 97)
    counter_h(mp, 14, 15, 13, name="Okienko do kuchni")
    mp.t("D", 0, 13, 14, 13, z=3); mp.t("D", 1, 14, 15, 13, z=3)                  # dishes waiting on the pass
    px0, px1, vtop, vfloor = vestibule(mp, 12, 20, H - 1, HALL_F, HALL_W, (15, 16, 17))
    mp.zone("Sień", 13, vtop + 1, 19, H - 2, (230, 200, 120))
    # ---------------------------------------------------------------- the storeroom (NW) with the loose brick
    mp.zone("Skład", 1, 1, 8, 10, (150, 150, 170))
    mp.tiles("D", 10, 0, 3, 2, 1, 3); mp.block(1, 4, 3, 4, "Stos beczek")         # a pile of barrels in the corner
    mp.tiles("E", 9, 14, 3, 2, 6, 3); mp.block(6, 4, 8, 4, "Regał ze skrzynkami")
    mp.t("A5", 0, 12, 5, 3, z=0)                                                  # the odd stone: the brick (5,3)
    mp.t("D", 11, 6, 5, 4, z=3)
    mp.tiles("D", 11, 3, 2, 2, 1, 6); mp.block(1, 7, 2, 7, "Skrzynie")
    mp.tiles("D", 8, 2, 2, 2, 1, 9); mp.block(1, 9, 2, 10, "Worki")
    mp.tiles("D", 13, 3, 1, 2, 7, 8); mp.block(7, 9, 7, 9, "Skrzynia")
    mp.tiles("D", 13, 5, 2, 2, 5, 9); mp.block(5, 10, 6, 10, "Połamane skrzynie")
    mp.tiles("D", 8, 0, 2, 2, 3, 6); mp.block(3, 6, 4, 7, "Beczki")
    mp.tiles("D", 11, 3, 1, 2, 6, 6); mp.block(6, 7, 6, 7, "Skrzynia")
    mp.t("D", 8, 5, 8, 10); mp.block(8, 10, 8, 10, "Deska")
    mp.t("D", 10, 3, 7, 10); mp.block(7, 10, 7, 10, "Worek")
    mp.t("D", 15, 7, 8, 1, z=3); mp.t("D", 13, 7, 1, 1, z=3); mp.t("D", 15, 8, 8, 2, z=3)
    wall_lantern(mp, 7, 1, 1, glow="<Light:150,60,44,24>")
    light(mp, 4, 7, "<Light:140,10,8,4>", "wypelnienie")
    # ---------------------------------------------------------------- the kitchen (behind the bar, 10..19 x 4..10)
    mp.zone("Kuchnia", 10, 1, 19, 12, (120, 200, 120))
    mp.tiles("D", 13, 0, 1, 2, 10, 3); mp.block(10, 4, 10, 4, "Beczka z wodą")
    stove(mp, 11, 4)
    mp.t("D", 1, 6, 12, 2); mp.t("D", 1, 7, 12, 3)                              # pans on the wall
    mp.tiles("A5", 4, 11, 2, 3, 13, 1, z=0)                                      # the bread oven
    light(mp, 13, 3, L_OVEN, "zar w piecu")
    hanging(mp, 15, 2, 0); hanging(mp, 16, 2, 2); hanging(mp, 17, 2, 3)
    mp.tiles("C", 6, 6, 1, 3, 18, 2); mp.block(18, 4, 18, 4, "Półka z serami")
    mp.tiles("C", 5, 6, 1, 3, 19, 2); mp.block(19, 4, 19, 4, "Półka z chlebem")
    table_h(mp, 12, 7, 3, style=6, items=[(0, 0, "D", 0, 8), (1, 0, "D", 0, 9), (2, 0, "D", 1, 9), (0, 1, "D", 0, 10), (2, 1, "D", 1, 10)], name="Stół do krojenia")
    cauldron_fire(mp, 16, 7)
    mp.tiles("D", 8, 2, 2, 2, 10, 9); mp.block(10, 9, 11, 10, "Worki z mąką")
    mp.t("D", 14, 2, 19, 7); mp.block(19, 7, 19, 7, "Beczka z jabłkami")
    mp.t("D", 13, 2, 19, 8); mp.block(19, 8, 19, 8, "Beczka z mąką")
    mp.tiles("D", 10, 5, 1, 1, 17, 10); mp.block(17, 10, 17, 10, "Drewno")
    light(mp, 15, 8, L_FILL, "wypelnienie")
    wall_lantern(mp, 17, 1, 0)
    # ---------------------------------------------------------------- the front room: the big fireplace (west)
    mp.zone("Kominek", 1, 12, 11, 18, (240, 120, 60))
    mp.kind(0, mp.rect(2, 12, 7, 14), 71)
    big_hearth(mp, 3, 12)
    firewood(mp, 2, 15); firewood(mp, 7, 15)
    window(mp, 1, 12, "night", curtain=2); window(mp, 8, 12, "night", curtain=2)
    mp.tiles("D", 11, 13, 2, 3, 4, 16)
    chair(mp, 3, 17, 6, arm=True, name="Fotel"); chair(mp, 6, 17, 4, arm=True, name="Fotel")
    cat(mp, 4, 17)
    deer_head(mp, 10, 12)
    wall_lantern(mp, 12, 13, 0)
    # ---------------------------------------------------------------- the bar in the crook
    mp.zone("Bar", 12, 12, 23, 18, (255, 210, 60))
    mp.tiles("E", 6, 3, 2, 3, 16, 12)                                              # bottles, mugs (flush with the wall)
    mp.tiles("E", 4, 7, 1, 2, 20, 13); mp.tiles("E", 7, 7, 1, 2, 13, 13)             # a tap barrel, a barrel with jugs
    tap_barrels(mp, 21, 11, 4); tap_barrels(mp, 21, 13, 6); mp.block(21, 11, 21, 11, "Beczka"); mp.block(21, 13, 21, 13, "Beczka")
    counter_h(mp, 13, 21, 16, right_end=False)
    counter_arm(mp, 22, 11, 17, top_end=True, front=True)
    on_counter(mp, [(14, 16, "D", 3, 13), (15, 16, "D", 2, 11), (17, 16, "D", 4, 12), (19, 16, "D", 3, 13), (20, 16, "D", 2, 12),
                    (22, 12, "D", 3, 13), (22, 14, "D", 2, 11)])
    candles(mp, 18, 17, three=True)
    for sx in (13, 14, 19, 20): stool(mp, sx, 18)
    stool(mp, 23, 12); stool(mp, 23, 14)
    sign(mp, 12, 13)
    light(mp, 18, 15, "<Light:220,60,40,14>", "swiatlo baru")
    # ---------------------------------------------------------------- the east wing: stairs, stage, tables, the dice corner
    stairs_up(mp, (22, 23, 24), 1, 5)
    mp.zone("Schody", 22, 1, 24, 6, (200, 160, 230))
    window(mp, 21, 1, "night"); window(mp, 25, 1, "night", curtain=2)
    mp.zone("Scena", 26, 1, 32, 8, (220, 90, 160))
    fy = stage(mp, 26, 32, 4, 3, rug=36)
    window(mp, 26, 1, "night"); window(mp, 32, 1, "night")
    mp.tiles("B", 0, 12, 1, 2, 26, 1, z=3); mp.tiles("B", 0, 12, 1, 2, 32, 1, z=3)
    banner(mp, 28, 3, 0); banner(mp, 30, 3, 3)
    candelabra(mp, 26, 4); candelabra(mp, 32, 4)
    mp.tiles("C", 8, 2, 1, 2, 29, 4); mp.block(29, 5, 29, 5, "Krzesło barda")
    chandelier(mp, 29, 10)
    round_table(mp, 26, 9, (5, 9)); chair(mp, 25, 10, 6); chair(mp, 27, 10, 4)
    round_table(mp, 31, 9, (0, 11)); chair(mp, 30, 10, 6)
    mp.zone("Kącik do kości", 26, 12, 32, 15, (90, 200, 230))
    round_table(mp, 29, 12, (7, 9)); on_counter(mp, [(29, 12, "D", 4, 15), (29, 13, "D", 6, 15)])
    stool(mp, 28, 13); stool(mp, 30, 13); stool(mp, 29, 14, small=True)
    tally_stand(mp, 32, 13)
    round_table(mp, 25, 13, (6, 11)); chair(mp, 24, 14, 6); chair(mp, 26, 14, 4)
    # ---------------------------------------------------------------- the front room: tables
    mp.zone("Sala", 1, 19, 11, 26, (230, 170, 110))
    table_v(mp, 6, 20, 5, items=[(0, "D", 3, 13), (1, "D", 0, 13), (3, "D", 2, 11), (4, "D", 1, 14)])
    bench_v(mp, 5, 20, 5); bench_v(mp, 7, 20, 5)
    chandelier(mp, 6, 23)
    round_table(mp, 2, 20, (1, 9))
    stool(mp, 2, 22)
    round_table(mp, 10, 20, (3, 9)); stool(mp, 9, 21); stool(mp, 11, 21)
    round_table(mp, 2, 24, (4, 11)); stool(mp, 2, 26)
    round_table(mp, 10, 24, (6, 11)); stool(mp, 9, 25); stool(mp, 11, 25)
    mp.zone("Sala", 21, 16, 32, 26, (230, 170, 110))
    table_h(mp, 24, 18, 7, style=4, items=[(1, 0, "D", 3, 13), (2, 1, "D", 0, 13), (4, 0, "D", 2, 11), (5, 1, "D", 4, 11), (6, 0, "D", 3, 13)])
    for bx in (24, 26, 28):
        bench_h(mp, bx, 17); bench_h(mp, bx, 20)
    chandelier(mp, 27, 19)
    round_table(mp, 23, 23, (2, 11)); chair(mp, 22, 24, 6); chair(mp, 24, 24, 4)
    round_table(mp, 28, 23, (5, 11)); chair(mp, 27, 24, 6); chair(mp, 29, 24, 4)
    mp.tiles("E", 6, 7, 1, 2, 32, 24); mp.block(32, 25, 32, 25, "Beczki")
    candelabra(mp, 32, 21)
    light(mp, 16, 21, L_FILL, "wypelnienie"); light(mp, 27, 12, L_FILL, "wypelnienie"); light(mp, 9, 18, L_FILL, "wypelnienie")
    mp.kind(1, mp.rect(15, 19, 17, 24), 36)                                        # the runner from the door to the bar
    bench_v(mp, 21, 6, 3); round_table(mp, 22, 7, (3, 11))                         # a seat by the stairs
    round_table(mp, 10, 16, (0, 9)); stool(mp, 9, 17); stool(mp, 11, 17)
    # ---------------------------------------------------------------- people and the kept events
    print("  B: fill lights", auto_fill(mp, skip=[(1, 4, 8, 10)]))
    place_people(mp, {1: (21, 15), 2: (29, 5), 3: (31, 14), 4: (8, 17),
                      5: (0, 1), 6: (0, 2), 7: (0, 3), 8: (0, 4), 9: (5, 3)})
    exits(mp, (15, 16, 17), H - 1, (16, H - 2))
    seal_walls(mp)
    wall_shadows(mp)
    return mp

# =====================================================================================================================
def design_C():
    """C 'Dwie izby': an old-style log inn - a through-hall (sień) in the middle of the front with a room on each side, like
    a Polish karczma. Left: the bar room (izba szynkowa) with the counter and the kitchen behind it, long tables. Right: the
    fireplace room (izba kominkowa) - the big stone fireplace, armchairs on a bear skin, the dice corner, Melia's stage.
    A wide doorway joins the two rooms. Behind the back wall: the kitchen, the stair hall and the storeroom of old
    fortress stones with the loose brick. Log walls and log-end borders, dark boards in the bar room, parquet by the fire."""
    W, H = 34, 28
    mp = TavernMap(W, H, NOTE, seed=303)
    mp.border = 33
    LOG = 59
    rooms = [
        (1, 4, 15, 7, 97, 51, FACE),          # kitchen (behind the bar)
        (17, 4, 24, 7, 81, LOG, FACE),        # stair hall
        (26, 4, 32, 7, 96, 71, FACE),         # storeroom (old stones)
        (1, 12, 15, 26, 84, LOG, FACE),       # the bar room
        (17, 12, 32, 26, 80, LOG, FACE),      # the fireplace room
    ]
    shell(mp, rooms, 33)
    mp.border_kinds = {33}
    opening(mp, 7, 8, 8, 11, 97)               # behind the bar -> kitchen
    opening(mp, 21, 8, 22, 11, 81)             # fireplace room -> stair hall
    opening(mp, 25, 6, 25, 7, 96)              # stair hall -> storeroom
    opening(mp, 16, 16, 16, 18, 80)            # the wide doorway between the rooms
    # ---------------------------------------------------------------- the sień: in the middle of the front, doors to both rooms
    top, fy0, floor_y0, bottom = 21, 22, 24, H - 1
    mp.kind(0, mp.rect(12, top, 20, bottom), 33)
    mp.kind(0, mp.rect(13, fy0, 19, fy0 + 1), LOG)
    mp.kind(0, mp.rect(13, floor_y0, 19, bottom - 1), 81)
    mp.kind(0, mp.rect(15, bottom, 17, bottom), 81)                                # the doorway to the yard
    opening(mp, 12, 25, 12, 26, 81); opening(mp, 20, 25, 20, 26, 81)               # doors into both rooms
    mp.kind(1, mp.rect(13, 25, 19, 26), 37)                                        # a long doormat
    cloaks(mp, 13, 22, colours=(2, 1))
    mp.labels.append(("Tablica z zadaniami", 16, 23)); mp.labels.append(("Wieszaki", 13, 23))
    for i, x in enumerate((15, 16, 17)):                                           # the quest board, straight ahead
        mp.t("E", 8 if i != 1 else 12, 8, x, 22); mp.t("E", 8 if i != 1 else 12, 9, x, 23)
        mp.t("D", (14, 13, 14)[i], 9, x, 22, z=3)
    mp.t("D", 2, 13, 16, 23, z=3)                                                  # a quill and paper on its ledge
    mp.t("C", 14, 1, 13, 24); mp.t("C", 15, 1, 14, 24); mp.block(13, 24, 14, 24, "Ława w sieni")
    mp.tiles("D", 4, 6, 1, 2, 19, 23); mp.block(19, 24, 19, 24, "Roślina")
    mp.t("D", 7, 6, 18, 24); mp.block(18, 24, 18, 24, "Miotła")
    wall_lantern(mp, 18, 22, 2)
    mp.zone("Sień", 13, 22, 19, 26, (230, 200, 120))
    # ---------------------------------------------------------------- the kitchen (NW, behind the bar)
    mp.zone("Kuchnia", 1, 1, 15, 7, (120, 200, 120))
    mp.tiles("D", 13, 0, 1, 2, 1, 3); mp.block(1, 4, 1, 4, "Beczka z wodą")
    stove(mp, 2, 4)
    mp.t("D", 2, 6, 3, 2); mp.t("D", 2, 7, 3, 3)
    mp.tiles("A5", 4, 11, 2, 3, 4, 1, z=0)
    light(mp, 4, 3, L_OVEN, "zar w piecu")
    firewood(mp, 6, 4)
    window(mp, 9, 1, "night", curtain=5)
    hanging(mp, 10, 2, 0); hanging(mp, 11, 2, 1); hanging(mp, 12, 2, 3); hanging(mp, 13, 2, 4)
    mp.tiles("C", 4, 4, 2, 2, 14, 3); mp.block(14, 4, 15, 4, "Spiżarka")
    table_h(mp, 2, 6, 3, style=6, items=[(0, 0, "D", 0, 8), (1, 0, "D", 0, 9), (2, 0, "D", 1, 9), (0, 1, "D", 0, 10), (2, 1, "D", 1, 10)], name="Stół do krojenia")
    cauldron_fire(mp, 11, 6)
    mp.tiles("D", 8, 2, 2, 2, 13, 6); mp.block(13, 6, 14, 7, "Worki z mąką")
    mp.t("D", 14, 2, 15, 7); mp.block(15, 7, 15, 7, "Beczka z jabłkami")
    wall_lantern(mp, 7, 1, 0)
    light(mp, 9, 5, L_FILL, "wypelnienie")
    # ---------------------------------------------------------------- the stair hall and the storeroom (NE)
    stairs_up(mp, (21, 22), 1, 5)
    mp.zone("Schody", 17, 1, 24, 7, (200, 160, 230))
    window(mp, 18, 1, "night", curtain=5)
    mp.tiles("C", 14, 2, 1, 3, 17, 4); mp.block(17, 4, 17, 6, "Ława")
    mp.tiles("D", 5, 6, 1, 2, 24, 3); mp.block(24, 4, 24, 4, "Roślina")
    wall_lantern(mp, 20, 1, 0, glow="<Light:190,80,55,20>")
    mp.kind(1, mp.rect(21, 6, 22, 7), 36)
    painting(mp, 19, 2, 7, 6, 0, name="Obraz")
    chest(mp, 19, 7, 6, name="Skrzynia"); mp.blocked.add((19, 7)); mp.solid.add((19, 7))
    light(mp, 19, 6, L_FILL, "wypelnienie")
    mp.zone("Skład", 26, 1, 32, 7, (150, 150, 170))
    mp.tiles("D", 10, 0, 3, 2, 30, 3); mp.block(30, 4, 32, 4, "Stos beczek")
    mp.tiles("D", 11, 3, 2, 2, 26, 3); mp.block(26, 4, 27, 4, "Skrzynie")
    mp.t("A5", 0, 12, 28, 3, z=0); mp.t("D", 11, 6, 28, 4, z=3)                     # the odd stone: the brick (28,3)
    mp.tiles("D", 8, 2, 2, 2, 31, 6); mp.block(31, 6, 32, 7, "Worki")
    mp.tiles("D", 13, 5, 2, 2, 28, 6); mp.block(28, 7, 29, 7, "Połamane skrzynie")
    mp.t("D", 15, 7, 32, 1, z=3); mp.t("D", 13, 7, 26, 1, z=3)
    wall_lantern(mp, 29, 1, 1, glow="<Light:140,60,44,24>")
    # ---------------------------------------------------------------- the bar room (izba szynkowa)
    mp.zone("Izba szynkowa - bar", 1, 9, 15, 16, (255, 210, 60))
    barrel_rack(mp, 2, 11)
    tap_barrels(mp, 6, 11, 4)
    bar_shelf(mp, 9, 10, "bottles")
    tap_barrels(mp, 11, 11, 5)
    bar_shelf(mp, 12, 10, "wine")
    sign(mp, 14, 10)
    wall_lantern(mp, 3, 9, 0); wall_lantern(mp, 10, 9, 0)
    deer_head(mp, 5, 9)
    counter_arm(mp, 1, 12, 15, top_end=True, front=True)
    counter_h(mp, 2, 11, 14, left_end=False)
    on_counter(mp, [(3, 14, "D", 3, 13), (4, 14, "D", 2, 11), (6, 14, "D", 4, 12), (8, 14, "D", 3, 13), (9, 14, "D", 2, 12), (10, 14, "D", 1, 12), (1, 13, "D", 3, 13)])
    candles(mp, 7, 15, three=True)
    for sx in (3, 5, 8, 10): stool(mp, sx, 16)
    light(mp, 7, 12, "<Light:200,60,40,14>", "swiatlo baru")
    mp.zone("Izba szynkowa - stoły", 1, 17, 11, 26, (230, 170, 110))
    for tx in (3, 8):
        table_v(mp, tx, 18, 5, items=[(0, "D", 3, 13), (1, "D", 0, 13), (2, "D", 2, 11), (3, "D", 1, 14), (4, "D", 3, 13)])
        bench_v(mp, tx - 1, 18, 5); bench_v(mp, tx + 1, 18, 5)
        chandelier(mp, tx, 21)
    round_table(mp, 13, 18, (1, 9)); stool(mp, 12, 19); stool(mp, 14, 19)
    round_table(mp, 3, 24, (4, 11)); stool(mp, 2, 25); stool(mp, 4, 25)
    round_table(mp, 8, 24, (6, 9)); stool(mp, 7, 25); stool(mp, 9, 25)
    mp.tiles("E", 6, 7, 1, 2, 1, 22); mp.block(1, 23, 1, 23, "Beczki")
    light(mp, 6, 17, L_FILL, "wypelnienie"); light(mp, 6, 25, L_FILL, "wypelnienie"); light(mp, 11, 20, L_FILL, "wypelnienie")
    light(mp, 3, 15, L_FILL, "wypelnienie")
    # ---------------------------------------------------------------- the fireplace room (izba kominkowa)
    mp.zone("Izba kominkowa", 17, 9, 32, 21, (240, 120, 60))
    mp.tiles("C", 0, 6, 1, 3, 17, 9); mp.tiles("C", 1, 6, 1, 3, 18, 9)
    window(mp, 19, 9, "night", curtain=5)
    wall_lantern(mp, 20, 9, 0)
    mp.kind(0, mp.rect(23, 9, 28, 11), 71)
    big_hearth(mp, 24, 9)
    firewood(mp, 23, 12); firewood(mp, 28, 12)
    mp.tiles("D", 11, 13, 2, 3, 25, 13)
    chair(mp, 24, 14, 6, arm=True, name="Fotel"); chair(mp, 27, 14, 4, arm=True, name="Fotel")
    mp.tiles("C", 4, 0, 1, 2, 21, 14); mp.block(21, 15, 21, 15, "Stolik"); mp.t("D", 3, 13, 21, 14, z=3)
    cat(mp, 26, 15)
    clock(mp, 19, 12)
    # Melia's stage in the NE corner of the fireplace room
    mp.zone("Scena", 29, 9, 32, 16, (220, 90, 160))
    stage(mp, 29, 32, 12, 3, rug=38)
    banner(mp, 30, 10, 2); banner(mp, 31, 10, 1)
    mp.tiles("B", 0, 14, 1, 2, 29, 9); mp.tiles("B", 0, 14, 1, 2, 32, 9)
    candles(mp, 29, 12); candles(mp, 32, 12)
    mp.tiles("C", 8, 2, 1, 2, 31, 12); mp.block(31, 13, 31, 13, "Krzesło barda")
    # the dice corner by the doorway, a long table in the middle
    mp.zone("Kącik do kości", 17, 19, 22, 21, (90, 200, 230))
    round_table(mp, 19, 19, (7, 9)); on_counter(mp, [(19, 19, "D", 4, 15), (19, 20, "D", 6, 15)])
    stool(mp, 18, 20); stool(mp, 20, 20); stool(mp, 19, 21, small=True)
    tally_stand(mp, 17, 20)
    table_h(mp, 24, 19, 6, style=6, items=[(0, 0, "D", 3, 13), (1, 1, "D", 0, 13), (3, 0, "D", 2, 11), (4, 1, "D", 4, 11), (5, 0, "D", 3, 13)])
    for bx in (24, 26, 28):
        bench_h(mp, bx, 18); bench_h(mp, bx, 21)
    chandelier(mp, 27, 20)
    mp.zone("Kąt", 21, 22, 32, 26, (160, 210, 140))
    round_table(mp, 23, 23, (2, 11)); chair(mp, 22, 24, 6); chair(mp, 24, 24, 4)
    round_table(mp, 28, 23, (5, 11)); chair(mp, 27, 24, 6); chair(mp, 29, 24, 4)
    mp.tiles("E", 4, 7, 1, 2, 32, 23); mp.block(32, 24, 32, 24, "Beczki")
    table_v(mp, 32, 17, 3, items=[(0, "D", 3, 13), (2, "D", 2, 11)]); bench_v(mp, 31, 17, 3)
    candelabra(mp, 32, 21)
    light(mp, 25, 25, L_FILL, "wypelnienie"); light(mp, 20, 16, L_FILL, "wypelnienie")
    # ---------------------------------------------------------------- people and the kept events
    print("  C: fill lights", auto_fill(mp, skip=[(26, 4, 32, 7)]))
    place_people(mp, {1: (5, 13), 2: (30, 13), 3: (21, 20), 4: (22, 16),
                      5: (0, 1), 6: (0, 2), 7: (0, 3), 8: (0, 4), 9: (28, 3)})
    exits(mp, (15, 16, 17), H - 1, (16, H - 2))
    seal_walls(mp)
    wall_shadows(mp)
    return mp

# =====================================================================================================================
# the stairs down from the guest rooms land below the stairs of the chosen ground floor (the tile under the bottom step)
STAIRS_BELOW = {"A": ((30, 31, 32), 13), "B": ((22, 23, 24), 6), "C": ((21, 22), 6)}

def room_door_north(mp, dx, name, idx=0, locked=None):
    """the door of a room north of the corridor: a picture on the corridor's wall (row 11); walking into it takes the
    player into the room; inside, the gap in the border (row 8) with a doormat takes him back"""
    room_floor = mp.layers[0].get((dx, 7), ("k", 81))[1]
    if locked:
        door(mp, dx, 11, idx, name="Drzwi -> " + name, trigger=0,
             cmds=[{"code": 101, "indent": 0, "parameters": ["", 0, 0, 2, ""]}, {"code": 401, "indent": 0, "parameters": [locked]}])
        return
    door(mp, dx, 11, idx, name="Drzwi -> " + name, trigger=1,
         cmds=[{"code": 250, "indent": 0, "parameters": [{"name": "Door1", "volume": 80, "pitch": 100, "pan": 0}]},
               {"code": 201, "indent": 0, "parameters": [0, UPSTAIRS_ID, dx, 7, 8, 0]}])
    mp.kind(0, {(dx, 8)}, room_floor)
    mp.kind(1, {(dx, 8)}, 37)
    mp.transfer(dx, 8, UPSTAIRS_ID, dx, 12, 2, name="Wyjście z pokoju", se="Door1")

def room_door_south(mp, dx, name, idx=1, floor_kind=84):
    """the door of a room south of the corridor: a gap in the corridor's south border (row 15) takes the player in;
    inside, a door picture on the room's wall (row 18) takes him back"""
    mp.kind(0, {(dx, 15)}, floor_kind)
    mp.transfer(dx, 15, UPSTAIRS_ID, dx, 19, 2, name="Wejście -> " + name, se="Door1")
    door(mp, dx, 18, idx, name="Drzwi -> korytarz", trigger=1,
         cmds=[{"code": 250, "indent": 0, "parameters": [{"name": "Door1", "volume": 80, "pitch": 100, "pan": 0}]},
               {"code": 201, "indent": 0, "parameters": [0, UPSTAIRS_ID, dx, 14, 8, 0]}])
    mp.kind(1, {(dx, 19)}, 37)

def bed(mp, x, y, kind, name="Łóżko"):
    """a bed whose headboard stands against the wall: its top tile on the wall's bottom row y, the bed on y+1..y+2.
    kind: green / patch / green2 / red / red2 / royal / straw"""
    c, w = {"green": (12, 1), "patch": (15, 1), "green2": (13, 2), "red": (13, 1), "red2": (14, 2), "royal": (11, 2), "straw": (9, 1)}[kind]
    r = 13 if kind in ("red", "red2", "royal", "straw") else 10
    mp.tiles("C", c, r, w, 3, x, y)
    mp.block(x, y + 1, x + w - 1, y + 2, name)

def nightstand(mp, x, y, candle=True):
    """a bedside table against the wall (C 5,0..1: its top on the wall's bottom row y), a candle on it"""
    mp.tiles("C", 5, 0, 1, 2, x, y)
    mp.block(x, y + 1, x, y + 1, "Stolik nocny")
    if candle: candles(mp, x, y, three=False)

def small_table(mp, x, y, item=None):
    """a small round table (C 4,0..1) standing on (x, y+1), something on it"""
    mp.tiles("C", 4, 0, 1, 2, x, y)
    mp.block(x, y + 1, x, y + 1, "Stolik")
    if item: mp.t("D", item[0], item[1], x, y, z=3)

def room_chest(mp, x, y, idx=6):
    chest(mp, x, y, idx, name="Kufer")
    mp.blocked.add((x, y)); mp.solid.add((x, y))

def design_P(below="A"):
    """the guest rooms upstairs ("Pokoje gości"): a panelled corridor with three rooms and the chamber (rentable later,
    its own fireplace) to the north, two rooms and the linen closet to the south, the stairwell down in the south-west"""
    W, H = 32, 24
    mp = TavernMap(W, H, "<Dust:off>\n<Dark:on>\n<DayNight:off>\n<Zoom:1.5>", display="Pokoje gości", seed=404)
    mp.id = UPSTAIRS_ID
    mp.keep_slots = 0
    mp.border = 25
    CORR_F, CORR_W, ROOM_F = 84, 54, 81
    rooms = [
        (1, 4, 6, 7, ROOM_F, 56, 3), (8, 4, 13, 7, ROOM_F, 62, 3), (15, 4, 21, 7, 83, 59, 3),
        (23, 4, 30, 7, 80, 63, 3),                              # the chamber
        (1, 12, 30, 14, CORR_F, CORR_W, 3),                     # the corridor
        (7, 19, 13, 22, ROOM_F, 62, 3), (15, 19, 19, 22, 96, 51, 3), (21, 19, 30, 22, ROOM_F, 56, 3),
    ]
    shell(mp, rooms, 25)
    # ---------------------------------------------------------------- the stairwell (SW): the corridor opens south, steps down
    mp.kind(0, mp.rect(1, 15, 5, 22), CORR_F)
    mp.zone("Schody w dół", 1, 15, 5, 22, (200, 160, 230))
    for y in range(17, 22):
        for x in (2, 3, 4): mp.tile(0, x, y, A5(1, 2))
    for x in (2, 3, 4): mp.tile(0, x, 22, A5(0, 0))
    mp.block(2, 22, 4, 22, "Ciemność")
    for y in range(16, 23):                                   # the handrails on both sides
        mp.t("B", 12, 6 if y < 22 else 7, 1, y); mp.t("B", 14, 6 if y < 22 else 7, 5, y)
    mp.block(1, 16, 1, 22, "Poręcz"); mp.block(5, 16, 5, 22, "Poręcz")
    mp.t("B", 12, 5, 1, 15); mp.t("B", 14, 5, 5, 15)
    stairs, row = STAIRS_BELOW[below]
    mid = stairs[len(stairs) // 2]
    for x in (2, 3, 4):
        tx = min(max(mid + (x - 3), stairs[0]), stairs[-1])
        mp.transfer(x, 19, 1, tx, row, 2, name="Schody -> Tawerna", se="Move1")
    mp.landing = (3, 15)
    mp.exit_cells = []
    candelabra(mp, 1, 14)
    # ---------------------------------------------------------------- the corridor
    mp.zone("Korytarz", 1, 9, 30, 14, (230, 170, 110))
    mp.kind(1, mp.rect(6, 13, 29, 13), 36)
    for x in (7, 13, 16, 21, 27): wall_lantern(mp, x, 9, 0)
    painting(mp, 14, 10, 7, 4, 1, name="Obraz")
    painting(mp, 29, 10, 6, 8, 2, name="Portret")
    window(mp, 23, 9, "night", curtain=0)
    mp.tiles("D", 7, 8, 1, 2, 30, 11); mp.block(30, 12, 30, 12, "Roślina")
    mp.tiles("C", 5, 0, 1, 2, 5, 11); mp.block(5, 12, 5, 12, "Stolik")
    mp.pic(5, 11, "!Decoration_static", 0, 2, 0, name="Wazon z kwiatami", priority=1, through=True)
    # ---------------------------------------------------------------- room 1 (x 1..6): green bed, washstand, a table
    mp.zone("Pokój 1", 1, 1, 6, 7, (150, 190, 240))
    bed(mp, 1, 3, "green"); nightstand(mp, 2, 3)
    window(mp, 4, 1, "night", curtain=0)
    mp.tiles("C", 3, 12, 1, 2, 6, 3); mp.block(6, 4, 6, 4, "Miska do mycia")
    small_table(mp, 6, 5, item=(3, 13)); chair(mp, 5, 6, 6)
    room_chest(mp, 1, 6)
    room_door_north(mp, 3, "Pokój 1", 0)
    # ---------------------------------------------------------------- room 2 (x 8..13): patchwork bed, wardrobe, a desk
    mp.zone("Pokój 2", 8, 1, 13, 7, (150, 190, 240))
    bed(mp, 13, 3, "patch"); nightstand(mp, 12, 3)
    window(mp, 10, 1, "night", curtain=5)
    mp.tiles("C", 5, 11, 1, 2, 8, 3); mp.block(8, 4, 8, 4, "Szafa")
    small_table(mp, 8, 5, item=(2, 13)); chair(mp, 9, 6, 4)
    room_chest(mp, 13, 6)
    room_door_north(mp, 11, "Pokój 2", 1)
    # ---------------------------------------------------------------- room 3 (x 15..21): log walls, a double bed, a hunter's room
    mp.zone("Pokój 3", 15, 1, 21, 7, (150, 190, 240))
    bed(mp, 15, 3, "green2"); nightstand(mp, 17, 3)
    window(mp, 20, 1, "night", curtain=2)
    mp.tiles("C", 5, 11, 1, 2, 21, 3); mp.block(21, 4, 21, 4, "Szafa")
    small_table(mp, 21, 5, item=(4, 11)); chair(mp, 20, 6, 6)
    room_chest(mp, 15, 6)
    trophy(mp, 18, 1)
    room_door_north(mp, 18, "Pokój 3", 0)
    # ---------------------------------------------------------------- the chamber (x 23..30): rentable later
    mp.zone("Komnata (do wynajęcia)", 23, 1, 30, 7, (240, 200, 120))
    bed(mp, 24, 3, "royal", name="Łoże")
    nightstand(mp, 23, 3); nightstand(mp, 26, 3, candle=False)
    fireplace(mp, 28, 3, kind=1)
    mp.tiles("C", 8, 14, 1, 2, 30, 3); mp.block(30, 4, 30, 4, "Toaletka")
    chair(mp, 27, 6, 8, arm=True, name="Fotel"); chair(mp, 29, 6, 8, arm=True, name="Fotel")
    mp.kind(1, mp.rect(26, 5, 30, 7), 22)
    room_chest(mp, 23, 6, 3)
    painting(mp, 26, 2, 6, 6, 2, name="Obraz")
    room_door_north(mp, 25, "Komnata", 3, locked="Zamknięte. Komnatę będzie można wynająć u Borgara.")
    # ---------------------------------------------------------------- room 4 (south, x 7..13)
    mp.zone("Pokój 4", 7, 16, 13, 22, (150, 190, 240))
    bed(mp, 13, 18, "red"); nightstand(mp, 12, 18)
    window(mp, 8, 16, "night", curtain=5)
    mp.tiles("C", 5, 11, 1, 2, 7, 18); mp.block(7, 19, 7, 19, "Szafa")
    small_table(mp, 8, 20, item=(3, 13)); chair(mp, 9, 21, 4)
    room_chest(mp, 13, 21)
    room_door_south(mp, 10, "Pokój 4", 1)
    # ---------------------------------------------------------------- the linen closet (south, x 15..19)
    mp.zone("Bielizna", 15, 16, 19, 22, (180, 180, 180))
    mp.tiles("C", 2, 11, 1, 2, 15, 18); mp.block(15, 19, 15, 19, "Regał")
    mp.tiles("C", 3, 11, 2, 2, 18, 18); mp.block(18, 19, 19, 19, "Komoda z pościelą")
    mp.t("D", 10, 4, 15, 22); mp.block(15, 22, 15, 22, "Wiadro")
    mp.t("D", 2, 10, 19, 22); mp.block(19, 22, 19, 22, "Kosz")
    mp.tiles("D", 13, 0, 1, 2, 19, 20); mp.block(19, 21, 19, 21, "Balia")
    room_door_south(mp, 17, "Bielizna", 5, floor_kind=CORR_F)
    wall_lantern(mp, 16, 16, 1)
    # ---------------------------------------------------------------- room 5 (south, x 21..30): the bigger family room
    mp.zone("Pokój 5", 21, 16, 30, 22, (150, 190, 240))
    bed(mp, 28, 18, "red2"); nightstand(mp, 27, 18); nightstand(mp, 30, 18, candle=False)
    bed(mp, 21, 18, "straw", name="Łóżko dziecięce")
    window(mp, 23, 16, "night", curtain=0)
    painting(mp, 25, 17, 7, 6, 0, name="Obraz")
    mp.tiles("B", 14, 12, 2, 2, 25, 20)
    small_table(mp, 22, 20, item=(0, 13)); chair(mp, 23, 21, 4)
    room_chest(mp, 28, 21)
    room_door_south(mp, 26, "Pokój 5", 1)
    auto_fill(mp, reach=0.6)
    seal_walls(mp)
    wall_shadows(mp)
    return mp

DESIGNS = {"A": design_A, "B": design_B, "C": design_C}

def reach_with_doors(mp, start):
    """the cells the player reaches from `start`, walking and through the same-map doors (transfer events to this map
    that he touches: standing on them or walking into them from a neighbour)"""
    seen = mp.reach(start)
    jumps = []
    for (x, y, e) in mp.events:
        for c in e["pages"][0]["list"]:
            if c["code"] == 201 and c["parameters"][0] == 0 and c["parameters"][1] == mp.id:
                jumps.append(((x, y), (c["parameters"][2], c["parameters"][3])))
    grew = True
    while grew:
        grew = False
        for (src, dst) in jumps:
            if dst in seen: continue
            sx, sy = src
            if src in seen or any((sx + dx, sy + dy) in seen for dx, dy in ((0, 1), (0, -1), (1, 0), (-1, 0))):
                seen |= mp.reach(dst)
                grew = True
    return seen

def check(mp, name):
    """the generator's own walking check: from the landing to every place that matters"""
    seen = reach_with_doors(mp, mp.landing)
    out = []
    for eid, (x, y, e) in sorted(mp.kept.items()):
        if eid in (1, 2, 3, 4, 9):
            nb = [(x + dx, y + dy) for dx, dy in ((0, 1), (0, -1), (1, 0), (-1, 0))]
            ok = any(n in seen for n in nb)
            out.append("%s %s" % (e["name"], "ok" if ok else "NIEDOSTĘPNY"))
    ex = all(any(n in seen for n in [(x, y - 1)]) for (x, y) in mp.exit_cells)
    out.append("wyjścia %s" % ("ok" if ex else "NIE"))
    ups = [(x, y) for (x, y, e) in mp.events if e["name"].startswith("Schody ->")]
    if ups: out.append("schody %s" % ("ok" if any(u in seen for u in ups) else "NIE"))
    floor = {(x, y) for y in range(mp.H) for x in range(mp.W) if mp.walkable(x, y)}
    people = {(x, y) for eid, (x, y, e) in mp.kept.items() if eid in (1, 2, 3, 4)}
    mp.solid -= people                       # (people move and step aside: they do not close a way for good)
    pockets = floor - reach_with_doors(mp, mp.landing)
    mp.solid |= people
    out.append("zamknięte pola %d%s" % (len(pockets), (" np. " + str(sorted(pockets)[:6])) if pockets else ""))
    print(name, "osiągalne pola", len(seen), "|", "; ".join(out))
    return seen

if __name__ == "__main__":
    todo = [a.upper() for a in sys.argv[1:]] or sorted(DESIGNS) + ["P"]
    for k in todo:
        if k == "P":
            mp = design_P("A")
            mp.labels.append(("Schody w dół", 3, 19))
            path = os.path.join(STAGING, "Pietro.json")
            n = mp.write_to(path)
            seen = check(mp, k)
            mp.dump_meta(os.path.join(STAGING, "P_meta.json"), {"landing": mp.landing, "reach": sorted(seen)})
            print("wrote", path, "events", n)
            continue
        mp = DESIGNS[k]()
        for eid, label in ((1, "Borgar"), (2, "Melia"), (3, "Grum"), (4, "Ozzy"), (9, "Luźna cegła -> piwnica")):
            x, y, e = mp.kept[eid]
            mp.labels.append((label, x, y))
        ups = [(x, y) for (x, y, e) in mp.events if e["name"].startswith("Schody ->")]
        ux = ups[len(ups) // 2][0]
        uy = max(y for (x, y) in mp.all if mp.layers[0].get((x, y)) == ("t", A5(1, 2)) and x == ux)
        mp.labels.append(("Schody na piętro", ux, uy))
        mp.labels.append(("Wejście", mp.exit_cells[1][0], mp.exit_cells[1][1]))
        path = os.path.join(STAGING, "Map001_%s.json" % k)
        n = mp.write_to(path)
        seen = check(mp, k)
        mp.dump_meta(os.path.join(STAGING, "%s_meta.json" % k), {"landing": mp.landing, "reach": sorted(seen)})
        print("wrote", path, "events", n)
