# The ground floor's rooms (second build, 2026-10-04): one table the generator (build_v2.py), the plan of the tavern
# (tools/tavern/plan/plangeo.py) and the tests' room list are made from.
#
# A room = its FLOOR rectangle (x0, y0, x1, y1 inclusive); its north wall face stands WALL_H rows above y0 (the wall-top
# border row above that); rooms side by side are split by one border column. The building keeps the old frame of the
# tavern - the vestibule (kept as it was: x 36..64, y 74..83) at the bottom middle, the great hall over it, the public
# rooms in two bands either side, the service corridor behind the bar, the work rooms north of it - but every room is
# sized by what stands in it (no more 15 x 15 halls with four tables). Symmetric about column 50 where it can be.
#
#   y 30..39   Komórka (old stones)                                              Gabinet Borgara
#   y 33..46        Browar | Spiżarnia | Kuchnia | Piekarnia | Wędzarnia | Pokój służby
#   y 40..51   Skład              Korytarz (behind the bar)                      Magazyn
#   y 52..67   Pokój myśliwski | Sala biesiadna | WIELKA SALA | Sala ze sceną | Pokój gier
#   y 68..83   Łaźnia | Jadalnia prywatna |  (sień, kept)  | Palarnia i czytelnia | Sala rzutek
W, H = 101, 84
AXIS = 50
# the build works in the old 101 x 84 frame (the kept vestibule at y 74..83); the map file is that frame with its empty top
# DY rows cut off (2026-10-05): map y = design y - DY. Every link (the gate in from the town, the stairs from upstairs, the way
# back from the cellar, the tests) uses map coordinates.
DY = 29
H_MAP = H - DY

# key, name (as the plan / tests call it), floor rect, A4 floor kind, A3 wall kind, wall height, plan kind
ROOMS = [
    # ---- the north: work rooms behind the corridor
    ("komorka",   "Stare mury",           (5, 34, 13, 39),   96, 67, 3, "service"),
    ("sklad",     "Skład",                (3, 43, 15, 51),   96, 48, 2, "service"),
    ("browar",    "Browar",               (17, 37, 27, 45),  97, 75, 3, "service"),
    ("spizarnia", "Spiżarnia",            (29, 37, 35, 45),  97, 50, 3, "service"),
    ("kuchnia",   "Kuchnia",              (37, 37, 53, 45),  100, 51, 3, "service"),
    ("piekarnia", "Piekarnia",            (55, 37, 63, 45),  100, 75, 3, "service"),
    ("wedzarnia", "Wędzarnia",            (65, 37, 71, 45),  96, 71, 3, "service"),
    ("sluzba",    "Pokój służby",         (73, 37, 83, 45),  81, 58, 3, "private"),
    ("gabinet",   "Gabinet Borgara",      (87, 34, 95, 39),  83, 54, 3, "private"),
    ("magazyn",   "Magazyn",              (85, 43, 97, 51),  96, 49, 2, "service"),
    ("korytarz",  "Korytarz",             (17, 49, 83, 51),  84, 54, 2, "hall"),
    # ---- the public rooms
    ("mysliwski", "Pokój myśliwski",      (3, 56, 15, 67),   83, 59, 3, "guest"),
    ("biesiadna", "Sala biesiadna",       (17, 56, 35, 67),  81, 50, 3, "guest"),
    ("sala",      "Wielka sala",          (37, 56, 63, 73),  84, 52, 3, "guest"),
    ("scena",     "Sala ze sceną",        (65, 56, 83, 67),  84, 56, 3, "guest"),
    ("gry",       "Pokój gier",           (85, 56, 97, 67),  80, 54, 3, "guest"),
    ("laznia",    "Łaźnia",               (3, 72, 23, 82),   81, 53, 3, "guest"),
    ("jadalnia",  "Jadalnia prywatna",    (25, 72, 35, 82),  80, 63, 3, "guest"),
    ("palarnia",  "Palarnia i czytelnia", (65, 72, 75, 82),  80, 54, 3, "guest"),
    ("rzutki",    "Sala rzutek",          (77, 72, 97, 82),  81, 58, 3, "guest"),
]
# the vestibule (kept): its floor for the plan
SIEN = ("sien", "Sień", (41, 78, 59, 82), "hall")

# openings (floor cut through borders and wall faces): x0, y0, x1, y1, floor kind (the room it leads into)
OPENINGS = [
    # public rooms side by side
    (16, 60, 16, 62, 83),        # hunters' room <-> feast hall
    (36, 59, 36, 64, 84),        # feast hall <-> great hall (a wide arch)
    (64, 59, 64, 64, 84),        # great hall <-> stage hall
    (84, 60, 84, 62, 84),        # stage hall <-> games room
    (36, 72, 36, 72, 84),        # great hall <-> private dining (a door at the dining room's top row)
    (64, 72, 64, 72, 84),        # great hall <-> reading room
    (24, 75, 24, 77, 81),        # private dining <-> bath house
    (76, 75, 76, 77, 81),        # reading room <-> darts room
    # down from the middle band into the south band (border 68 + wall 69..71)
    (9, 68, 10, 71, 81),         # hunters' room -> bath house
    (95, 68, 96, 71, 81),        # games room -> darts room
    # the service side
    (50, 52, 50, 55, 84),        # behind the bar -> corridor (Borgar's door)
    (16, 49, 16, 51, 84),        # corridor <-> storeroom (west end)
    (84, 49, 84, 51, 84),        # corridor <-> warehouse (east end)
    (21, 46, 22, 48, 97),        # corridor -> brewery
    (32, 46, 32, 48, 97),        # corridor -> pantry
    (49, 46, 51, 48, 100),       # corridor -> kitchen (opposite Borgar's door)
    (59, 46, 59, 48, 100),       # corridor -> bakery
    (68, 46, 68, 48, 96),        # corridor -> smokehouse
    (78, 46, 78, 48, 81),        # corridor -> staff room
    (54, 42, 54, 43, 100),       # kitchen <-> bakery
    (36, 42, 36, 43, 97),        # pantry <-> kitchen
    (9, 40, 9, 42, 96),          # storeroom -> the old stones (komórka)
    (91, 40, 91, 42, 83),        # warehouse -> Borgar's office (he keeps the stock under his eye)
]

def to_map(rect):
    x0, y0, x1, y1 = rect
    return (x0, y0 - DY, x1, y1 - DY)
ROOMS_MAP = [(k, n, to_map(r), fk, wk, wh, kind) for (k, n, r, fk, wk, wh, kind) in ROOMS]
SIEN_MAP = (SIEN[0], SIEN[1], to_map(SIEN[2]), SIEN[3])

def room(key):
    return next(r for r in ROOMS if r[0] == key)
