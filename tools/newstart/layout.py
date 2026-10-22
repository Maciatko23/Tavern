# The new start of the game: which maps there are and how they are joined. One place for both the map generator
# (build_newstart.py) and the apply script (tools/apply_newstart_maps.py), so the two ends of every transfer always match.
#
#   Dom dziadka - Wnętrze (19) --door--> Dom dziadka - Podwórze (20) --S--> Leśna droga (21) --W--> Polna droga (22)
#   Polna droga (22) --S--> Skraj lasu (23) --W--> Domek - Zewnętrze (3, grandpa's field, new gap in its east wall)
#   Polna droga (22) --N (side lane)--> Okolice Tawerny (8) --E--> Posiadłość Lorda (24)
#   Okolice Tawerny (8) --W (the west gate)--> Podgrodzie (111)
#   Podgrodzie (111) --W (the forest trail, one cell)--> Przystań (125)
#   The six island places (2026-10-16, docs/miejsca_wyspy/PAKIETY.md) - ISLAND_EDGES / ISLAND_DOORS below, not in EDGES:
#   Przystań (125) --N--> Pustelnia na klifie (155) --E--> Urwisko Kruków (157) --E--> Przylądek z latarnią (159) --S--> Góry (13, E edge)
#   Przystań (125) --S--> Garnizon nad zatoką (162) --W (the sandbar, low tide only)--> Wrak na mieliźnie (165)
#   Urwisko Kruków (157) --the overflow grate (lever, switch 17)--> Stara cysterna zakonu (167)
#   The meadows (2026-10-18, MEADOW_EDGES below, written by tools/apply_laki.py): grandpa's field (3) --S--> Łąka#2 (17),
#   grandpa's field (3) --W--> Łąka#3 (18) - the sides OrzelData.SIDES already flies over
#
# Directions (RPG Maker): 2 down, 4 left, 6 right, 8 up. Every exit is a row of touch transfers on the edge tiles; the player
# lands one tile inside the other map, next to the matching exit, facing into that map.

MAPS = {
    19: {"name": "Dom dziadka - Wnętrze", "display": "Dom dziadka", "size": (19, 13), "tileset": 8},   # (tools/house, concept B)
    # (2026-10-18: the outdoor maps doubled by tools/powieksz/powieksz.py - the old part in the top left, new land east and south;
    #  the edges below moved with their maps' east / south edges)
    20: {"name": "Dom dziadka - Podwórze", "display": "Dom dziadka", "size": (60, 44), "tileset": 9},
    21: {"name": "Leśna droga", "display": "Leśna droga", "size": (80, 60), "tileset": 9},
    22: {"name": "Polna droga", "display": "Polna droga", "size": (80, 60), "tileset": 9},
    23: {"name": "Skraj lasu", "display": "Skraj lasu", "size": (80, 60), "tileset": 9},
    24: {"name": "Posiadłość Lorda", "display": "Posiadłość Lorda", "size": (80, 60), "tileset": 9},
}

# the new game starts in grandpa's cottage, beside the hero's straw bed in his alcove (the whitewashed cottage of
# tools/house/build_house.py concept B, installed 2026-09-28)
START = (19, 2, 5)

# doors: (map, x, y) of the door tile -> (map, x, y, direction) where the player lands
DOORS = [
    ((19, 9, 12), (20, 15, 8, 2)),     # out of the cottage: the doorway in its bottom wall -> in front of its door outside
    ((24, 0, 16), (8, 102, 51, 4)),    # the manor road's third row (west edge) -> the town's east edge, which has two (2026-10-04;
                                       #  2026-10-18: the town doubled to 104x138, its east edge at x 103 - tools/powieksz)
    ((20, 15, 7), (19, 9, 11, 8)),     # into the cottage: just inside the doorway, on the runner
]

# edge exits: a list of tiles on one map's edge <-> the same number of tiles on the other map's edge
def cells(x0, y0, x1, y1):
    return [(x, y) for y in range(y0, y1 + 1) for x in range(x0, x1 + 1)]

EDGES = [
    # (map A, A's edge tiles, direction into A) <-> (map B, B's edge tiles, direction into B)
    ((20, cells(14, 43, 16, 43), 8), (21, cells(19, 0, 21, 0), 2)),     # yard S  <-> forest road N
    ((21, cells(0, 19, 0, 21), 6), (22, cells(79, 19, 79, 21), 4)),     # forest road W <-> field road E
    ((22, cells(23, 59, 25, 59), 8), (23, cells(23, 0, 25, 0), 2)),     # field road S <-> forest edge N
    ((23, cells(0, 12, 0, 14), 6), (3, cells(79, 12, 79, 14), 4)),      # forest edge W <-> grandpa's field (Map003) E
    ((22, cells(11, 0, 13, 0), 2), (8, cells(24, 137, 26, 137), 8)),      # field road's lane N <-> the town's south edge (town C + 10 rows, 2026-09-30)
    ((8, cells(103, 50, 103, 51), 4), (24, cells(0, 14, 0, 15), 6)),      # the town's east gate (crafts terrace, between two towers, tools/town/east_gate.py 2026-10-04) <-> Lord's estate W
    ((8, cells(0, 50, 0, 51), 6), (111, cells(91, 17, 91, 18), 4)),     # the town's west gate (by the smithy, tools/town/west_gate.py 2026-10-05) <-> Podgrodzie's east edge (tools/podgrodzie)
    ((21, cells(79, 8, 79, 10), 4), (13, cells(0, 38, 0, 40), 6)),     # the forest road's trail east (the user's) <-> the mountains' west edge (tools/mountains, 2026-10-06)
    ((111, cells(0, 19, 0, 19), 6), (125, cells(111, 19, 111, 19), 4)),  # Podgrodzie's forest trail (skraj_lasu) <-> the harbour's east edge (tools/przystan, 2026-10-14)
]

# (2026-10-16) the six island places: NOT in EDGES on purpose - the apply scripts (tools/apply_newstart_maps.py) write EDGES' transfers
# into the map files, but these are events of the places' own maps (their packages' builders) and, on the user's maps (Przystań 125,
# Góry 13), events Wyspa.js puts in at runtime once the place is built (Wyspa.ready). Only the transfer test walks them
# (run_transfer_test.py). The third item: what the game needs first (a script run before the walk) - the sandbar only at low tide.
ISLAND_EDGES = [
    ((125, cells(14, 0, 16, 0), 2), (155, cells(23, 71, 25, 71), 8), None),     # the harbour's top edge <-> the hermitage's bottom
    ((125, cells(21, 79, 23, 79), 8), (162, cells(21, 0, 23, 0), 2), None),     # the harbour's bottom edge <-> the garrison's top
    ((155, cells(95, 17, 95, 18), 4), (157, cells(0, 19, 0, 20), 6), None),     # the hermitage E <-> the Urwisko W
    ((157, cells(111, 19, 111, 20), 4), (159, cells(0, 33, 0, 34), 6), None),     # the Urwisko E <-> the cape W
    ((13, cells(119, 11, 119, 13), 4), (159, cells(29, 79, 31, 79), 8), None),    # the mountains' E edge <-> the cape's bottom
    ((162, cells(0, 20, 0, 21), 6), (165, cells(79, 20, 79, 21), 4), "Wyspa.forceTide('low')"),   # the sandbar at low tide
]
# the overflow grate on the Urwisko (an object - the action button, its page 2 on switch 17 = the cistern's lever pulled) and the
# channel's end in the cistern (walked into): (map, x, y) -> (map, x, y, direction), how it is used ("action" / "door"), the walk
# (the direction the hero faces it from), the script before
ISLAND_DOORS = [
    ((157, 41, 15), (167, 33, 3, 2), "action", 8, "$gameSwitches.setValue(17, true)"),
    ((167, 33, 2), (157, 41, 16, 2), "door", 8, "$gameSwitches.setValue(17, true)"),
]

STEP = {2: (0, 1), 4: (-1, 0), 6: (1, 0), 8: (0, -1)}

def landing(cell, direction):
    """the tile one step inside the map from an edge tile, walking in the given direction"""
    dx, dy = STEP[direction]
    return (cell[0] + dx, cell[1] + dy)

def transfers():
    """every transfer event: (from map, x, y, to map, tx, ty, direction, kind)"""
    out = []
    for (fm, fx, fy), (tm, tx, ty, d) in DOORS:
        out.append((fm, fx, fy, tm, tx, ty, d, "door"))
    for (ma, ca, da), (mb, cb, db) in EDGES:
        for a, b in zip(ca, cb):
            lb, la = landing(b, db), landing(a, da)
            out.append((ma, a[0], a[1], mb, lb[0], lb[1], db, "edge"))
            out.append((mb, b[0], b[1], ma, la[0], la[1], da, "edge"))
    return out

def island_transfers():
    """the island places' transfers (ISLAND_EDGES, ISLAND_DOORS): (from map, x, y, to map, tx, ty, direction, kind, walk, setup)"""
    out = []
    for (fm, fx, fy), (tm, tx, ty, d), kind, walk, setup in ISLAND_DOORS:
        out.append((fm, fx, fy, tm, tx, ty, d, kind, walk, setup))
    for (ma, ca, da), (mb, cb, db), setup in ISLAND_EDGES:
        for a, b in zip(ca, cb):
            lb, la = landing(b, db), landing(a, da)
            out.append((ma, a[0], a[1], mb, lb[0], lb[1], db, "edge", None, setup))
            out.append((mb, b[0], b[1], ma, la[0], la[1], da, "edge", None, setup))
    return out

EXISTING = (3, 8)   # existing maps that get transfers from the apply script

# (2026-10-18) the meadows Łąka#2 (Map017) and Łąka#3 (Map018), generated 2026-09-23 (build_meadows3.py) but never joined to the
# world: tools/apply_laki.py opens a gap in Map003's border (the south one where its path ends at (9..10, 26), the west one with a
# short trail from the path at (9, 18)) and writes these transfers into the three maps. NOT in EDGES on purpose: the newstart
# apply script only edits Map003/Map008 and would refuse maps 17/18. run_transfer_test.py walks them too.
MEADOW_EDGES = [
    ((3, cells(8, 59, 10, 59), 8), (17, cells(8, 0, 10, 0), 2)),       # grandpa's field S <-> Łąka#2 N (its trail at x 8-9)
    ((3, cells(0, 14, 0, 16), 6), (18, cells(79, 14, 79, 16), 4)),      # grandpa's field W <-> Łąka#3 E (its path at rows 14-16)
]

def meadow_transfers():
    """the meadows' transfers (MEADOW_EDGES): (from map, x, y, to map, tx, ty, direction, kind)"""
    out = []
    for (ma, ca, da), (mb, cb, db) in MEADOW_EDGES:
        for a, b in zip(ca, cb):
            lb, la = landing(b, db), landing(a, da)
            out.append((ma, a[0], a[1], mb, lb[0], lb[1], db, "edge"))
            out.append((mb, b[0], b[1], ma, la[0], la[1], da, "edge"))
    return out
