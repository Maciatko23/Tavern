# The ground floor of the big tavern (Map001 "Tawerna", ~3x concept B): one table of rooms, walls, openings and key spots.
# The plan picture (plan_parter.py), the generator (build_parter.py) and the checks all read it, so they never disagree.
#
# Coordinates are map cells (48 px). A room = its FLOOR cells: a rectangle (x0, y0, x1, y1, inclusive) plus ROOM_EXTRA,
# minus ROOM_CUT. Above every top-edge floor cell stands the room's north wall face, FACE (3) rows tall, unless another
# room's floor is there; everything else is the dark border (A2 kind 24). Rooms side by side are split by one border
# column. Openings = floor cut through a border / wall face.
#
# The building is symmetric about cell column 50 (x mirrors to 100 - x): the entrance, the vestibule with its two
# staircases, the bar hall, the two wings with their fireplaces, the side rooms. Room widths are chosen by what stands
# in the middle of their north wall: a 4-wide stone hearth needs an even width (the wings, 20 cells), a centred picture or
# door an odd one (the side rooms 15, the bar hall 25, the private rooms 17, the vestibule 19 between the stairwells).
#
# Tileset 8 (Winlu Fantasy Interior Remaster) kinds: A4 floors 84 red-brown boards, 81 light boards, 83 dark boards,
# 80 parquet, 82 vertical planks (stage), 96 cobbles, 97 green-grey flags; A3 walls 52 cream plaster + wainscot,
# 51 plaster + timber, 54 wood panels, 56 beige paper, 71 rough old stone, 59 logs; A2 border 24.
W, H = 101, 84
AXIS = 50
FACE = 3
BORDER = 24
EXIT_XS = (49, 50, 51)          # the doorway in the bottom row -> Map008 (13..15, 10)
EXIT_Y = H - 1
LANDING = (50, 82, 8)           # coming in from the yard: stand here, facing up

# name, floor rect, floor kind, wall kind, zone colour, group (public / service / corridor)
ROOMS = [
    # ---- the service wing (north)
    ("Stare mury",          (1, 4, 10, 18),   96, 71, (150, 150, 170), "service"),
    ("Skład",               (12, 4, 25, 18),  96, 51, (175, 160, 135), "service"),
    ("Browar",              (27, 4, 44, 18),  97, 51, (205, 150, 90), "service"),
    ("Pokój służby",        (46, 4, 55, 18),  81, 56, (180, 205, 160), "service"),
    ("Gabinet Borgara",     (57, 4, 68, 18),  83, 54, (225, 190, 120), "service"),
    ("Magazyn",             (70, 4, 84, 18),  96, 51, (175, 160, 135), "service"),
    ("Wędzarnia",           (86, 4, 99, 18),  97, 71, (190, 140, 120), "service"),
    ("Korytarz",            (1, 23, 99, 25),  84, 52, (215, 190, 150), "corridor"),
    ("Spiżarnia",           (38, 30, 62, 37), 97, 51, (150, 195, 140), "service"),
    ("Kuchnia",             (38, 42, 49, 57), 97, 51, (120, 200, 120), "service"),
    ("Piekarnia",           (51, 42, 62, 57), 97, 51, (205, 185, 110), "service"),
    # ---- the public rooms
    ("Pokój myśliwski",     (1, 30, 15, 48),  83, 59, (170, 125, 85), "public"),
    ("Sala biesiadna",      (17, 30, 36, 48), 84, 52, (235, 170, 110), "public"),
    ("Sala ze sceną",       (64, 30, 83, 48), 84, 52, (225, 95, 160), "public"),
    ("Pokój gier",          (85, 30, 99, 48), 84, 54, (90, 200, 230), "public"),
    ("Łaźnia",              (1, 53, 15, 69),  97, 51, (120, 180, 225), "public"),
    ("Sala rzutek",         (85, 53, 99, 69), 84, 54, (110, 165, 235), "public"),
    ("Wielka sala",         (17, 53, 83, 69), 84, 52, (255, 210, 60), "public"),
    ("Jadalnia prywatna",   (19, 74, 35, 82), 80, 56, (240, 150, 150), "public"),
    ("Palarnia i czytelnia", (65, 74, 81, 82), 80, 54, (175, 140, 225), "public"),
    ("Sień",                (37, 78, 63, 82), 84, 52, (240, 220, 140), "public"),
]
# floor added to a room (same kind): the front hall reaches down to the vestibule in the middle, in front of the bar
ROOM_EXTRA = {
    "Wielka sala": [(38, 70, 62, 73)],
}
# cells of a room's rectangle that are not its floor: the kitchen block stands in the front hall's north middle (its
# south wall is the back wall of the bar); the two stairwells' side walls in the vestibule
ROOM_CUT = {
    "Wielka sala": [(37, 53, 63, 61)],
    "Sień": [(40, 78, 40, 81), (60, 78, 60, 81)],
}

# openings: floor cut through walls / borders (floor kind of the named room)
OPENINGS = [
    # service wing <-> corridor (doors in the corridor's north wall)
    ("Skład", (18, 19, 19, 22)), ("Browar", (35, 19, 36, 22)), ("Pokój służby", (50, 19, 51, 22)),
    ("Gabinet Borgara", (62, 19, 63, 22)), ("Magazyn", (77, 19, 78, 22)), ("Wędzarnia", (92, 19, 93, 22)),
    # the old stones are reached only through the storeroom
    ("Skład", (11, 12, 11, 13)),
    # corridor <-> the banquet hall, the pantry and the side rooms (their doors at the rooms' inner ends; the stage hall
    # has none - its north wall is the stage's backdrop)
    ("Sala biesiadna", (26, 26, 27, 29)), ("Spiżarnia", (49, 26, 51, 29)),
    ("Pokój myśliwski", (13, 26, 14, 29)), ("Pokój gier", (86, 26, 87, 29)),
    # pantry <-> kitchen and bakery, kitchen <-> bakery, kitchen <-> the bar (a door behind the counter), the bakery's
    # pass to the hall (the dishes and the bread come out there)
    ("Kuchnia", (43, 38, 44, 41)), ("Piekarnia", (59, 38, 60, 41)), ("Kuchnia", (50, 49, 50, 51)),
    ("Wielka sala", (38, 58, 39, 61)), ("Wielka sala", (56, 58, 58, 61)),
    # the north halls <-> the front hall: two wide arches on each side, the stone hearth between them
    ("Wielka sala", (18, 49, 21, 52)), ("Wielka sala", (32, 49, 35, 52)),
    ("Wielka sala", (65, 49, 68, 52)), ("Wielka sala", (79, 49, 82, 52)),
    # side rooms
    ("Pokój myśliwski", (16, 38, 16, 40)), ("Pokój gier", (84, 38, 84, 40)),
    ("Łaźnia", (16, 60, 16, 62)), ("Sala rzutek", (84, 60, 84, 62)),
    ("Sala rzutek", (86, 49, 87, 52)),
    ("Jadalnia prywatna", (26, 70, 28, 73)), ("Palarnia i czytelnia", (72, 70, 74, 73)),
    # the vestibule <-> the front hall (a wide double door) and the doorway to the yard
    ("Sień", (48, 74, 52, 77)), ("Sień", (49, 83, 51, 83)),
]

# the two staircases up to Map025, one each side of the vestibule: three steps wide, climbing north into the dark
STAIRS = [(37, 38, 39), (61, 62, 63)]
STAIRS_X = STAIRS[1]                    # the east one: where the player arrives coming down
STAIRS_TOP, STAIRS_BOTTOM = 76, 81      # the top step (the event cells) .. the bottom step
STAIRS_VOID = (74, 75)                  # black above the steps (the stairwell rises into the ceiling)
FROM_ABOVE = [(x, 82) for x in STAIRS[1]]   # coming down: the floor row below the east stair's bottom step, facing down

# the key spots (the plan's pins; the generator places the people and props there)
SPOTS = {
    "Borgar": (48, 64),            # event 1: behind the L-counter, by its short arm on the axis
    "Melia": (73, 32),             # event 2: on the stage
    "Grum": (94, 37),              # event 3: in the gaming room, beside the arm-wrestling table
    "Ozzy": (10, 35),              # event 4: in the hunters' room, by the fireplace
    "Luźna cegła": (4, 3),         # event 9: in the old stone wall (bottom row of the face)
    "Tablica zleceń": (43, 78),    # the quest board (3x3) against the vestibule's north wall
    "Wejście": (50, 83),
    "Schody na piętro": (62, 76),
}
ATMOSPHERE = [(0, 1), (0, 2), (0, 3), (0, 4)]     # events 5-8 (parallel, no picture) in the top-left corner

def rect(x0, y0, x1, y1):
    return {(x, y) for y in range(y0, y1 + 1) for x in range(x0, x1 + 1)}

def room_rect(name):
    for (n, r, fk, wk, col, grp) in ROOMS:
        if n == name: return r
    raise KeyError(name)

def room_info(name):
    for row in ROOMS:
        if row[0] == name: return row
    raise KeyError(name)

def room_cells(name):
    cells = rect(*room_rect(name))
    for e in ROOM_EXTRA.get(name, []): cells |= rect(*e)
    for c in ROOM_CUT.get(name, []): cells -= rect(*c)
    return cells

def floor_map():
    """(x, y) -> room name for every floor cell (rooms, then openings)"""
    fm = {}
    for (n, r, fk, wk, col, grp) in ROOMS:
        for c in room_cells(n): fm[c] = n
    for (n, r) in OPENINGS:
        for c in rect(*r): fm[c] = n
    return fm

def face_map(fm):
    """(x, y) -> room name for every wall-face cell: FACE rows above each top-edge floor cell of a ROOM (openings make
    no wall of their own; an opening through a wall takes those cells)"""
    rooms = {}
    for (n, r, fk, wk, col, grp) in ROOMS:
        for c in room_cells(n): rooms[c] = n
    face = {}
    for (x, y), n in rooms.items():
        if (x, y - 1) in rooms: continue
        for k in range(1, FACE + 1):
            c = (x, y - k)
            if c in rooms or c[1] < 0: break
            face.setdefault(c, n)
    for c in list(face):
        if c in fm: del face[c]
    return face
