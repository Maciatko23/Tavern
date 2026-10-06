# The new start of the game: which maps there are and how they are joined. One place for both the map generator
# (build_newstart.py) and the apply script (tools/apply_newstart_maps.py), so the two ends of every transfer always match.
#
#   Dom dziadka - Wnętrze (19) --door--> Dom dziadka - Podwórze (20) --S--> Leśna droga (21) --W--> Polna droga (22)
#   Polna droga (22) --S--> Skraj lasu (23) --W--> Domek - Zewnętrze (3, grandpa's field, new gap in its east wall)
#   Polna droga (22) --N (side lane)--> Okolice Tawerny (8) --E--> Posiadłość Lorda (24)
#   Okolice Tawerny (8) --W (the west gate)--> Podgrodzie (111)
#
# Directions (RPG Maker): 2 down, 4 left, 6 right, 8 up. Every exit is a row of touch transfers on the edge tiles; the player
# lands one tile inside the other map, next to the matching exit, facing into that map.

MAPS = {
    19: {"name": "Dom dziadka - Wnętrze", "display": "Dom dziadka", "size": (19, 13), "tileset": 8},   # (tools/house, concept B)
    20: {"name": "Dom dziadka - Podwórze", "display": "Dom dziadka", "size": (30, 22), "tileset": 9},
    21: {"name": "Leśna droga", "display": "Leśna droga", "size": (40, 30), "tileset": 9},
    22: {"name": "Polna droga", "display": "Polna droga", "size": (40, 30), "tileset": 9},
    23: {"name": "Skraj lasu", "display": "Skraj lasu", "size": (40, 30), "tileset": 9},
    24: {"name": "Posiadłość Lorda", "display": "Posiadłość Lorda", "size": (40, 30), "tileset": 9},
}

# the new game starts in grandpa's cottage, beside the hero's straw bed in his alcove (the whitewashed cottage of
# tools/house/build_house.py concept B, installed 2026-09-28)
START = (19, 2, 5)

# doors: (map, x, y) of the door tile -> (map, x, y, direction) where the player lands
DOORS = [
    ((19, 9, 12), (20, 15, 8, 2)),     # out of the cottage: the doorway in its bottom wall -> in front of its door outside
    ((24, 0, 16), (8, 50, 51, 4)),     # the manor road's third row (west edge) -> the town's east gate, which has two (2026-10-04)
    ((20, 15, 7), (19, 9, 11, 8)),     # into the cottage: just inside the doorway, on the runner
]

# edge exits: a list of tiles on one map's edge <-> the same number of tiles on the other map's edge
def cells(x0, y0, x1, y1):
    return [(x, y) for y in range(y0, y1 + 1) for x in range(x0, x1 + 1)]

EDGES = [
    # (map A, A's edge tiles, direction into A) <-> (map B, B's edge tiles, direction into B)
    ((20, cells(14, 21, 16, 21), 8), (21, cells(19, 0, 21, 0), 2)),     # yard S  <-> forest road N
    ((21, cells(0, 19, 0, 21), 6), (22, cells(39, 19, 39, 21), 4)),     # forest road W <-> field road E
    ((22, cells(23, 29, 25, 29), 8), (23, cells(23, 0, 25, 0), 2)),     # field road S <-> forest edge N
    ((23, cells(0, 12, 0, 14), 6), (3, cells(39, 12, 39, 14), 4)),      # forest edge W <-> grandpa's field (Map003) E
    ((22, cells(11, 0, 13, 0), 2), (8, cells(24, 68, 26, 68), 8)),      # field road's lane N <-> the town's south edge (town C + 10 rows, 2026-09-30)
    ((8, cells(51, 50, 51, 51), 4), (24, cells(0, 14, 0, 15), 6)),      # the town's east gate (crafts terrace, between two towers, tools/town/east_gate.py 2026-10-04) <-> Lord's estate W
    ((8, cells(0, 50, 0, 51), 6), (111, cells(45, 17, 45, 18), 4)),     # the town's west gate (by the smithy, tools/town/west_gate.py 2026-10-05) <-> Podgrodzie's east edge (tools/podgrodzie)
    ((21, cells(39, 8, 39, 10), 4), (13, cells(0, 38, 0, 40), 6)),     # the forest road's trail east (the user's) <-> the mountains' west edge (tools/mountains, 2026-10-06)
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

EXISTING = (3, 8)   # existing maps that get transfers from the apply script
