# -*- coding: utf-8 -*-
"""Map001 furnishing (Tawerna 2): tables, rugs, lights, corners and people laid on the hall that build001.py has cut out of the old map."""
import re, copy
import lib

def furnish(c, O, W_, H_):
    SEATS = []
    OCC = {}
    c.clear_events(0, 0, W_, H_, lambda e: re.match(r"(Gość stołowy|Miejsce:|Tavern:mealtable|Na stole)", e["name"]) is not None)
    def ev_of(i): return O["events"][i]
    def clone(i, x, y, name=None, note=None, mod=None):
        e = copy.deepcopy(ev_of(i))
        if name is not None: e["name"] = name
        if note is not None: e["note"] = note
        e["id"] = 0                                   # a fresh id (Canvas.add_event picks one) unless the caller restores it
        if mod: mod(e)
        return c.add_event(e, x, y)
    def keep(i, x, y, mod=None):
        e = copy.deepcopy(ev_of(i))
        if mod: mod(e)
        return c.add_event(e, x, y)
    def occ(cells, what):
        for cell in cells:
            assert cell not in OCC, "overlap %s with %s at %s" % (what, OCC[cell], cell)
            OCC[cell] = what
    KEYS = []
    for i in range(400, 423):
        m_ = re.search(r"<Siedzi:(\w+)>", ev_of(i)["note"])
        if m_: KEYS.append(m_.group(1))
    SEAT_KEYS = KEYS + ["Kowal", "Woziwoda", "Kupiec", "Soltys", "Garbarz", "Bartek", "Woznica", "Janek", "Rozbitek"]
    def seat(x, y): SEATS.append((x, y, SEAT_KEYS[len(SEATS) % len(SEAT_KEYS)]))
    ROUND = [(842, 850), (859, 867), (863, 871), (844, 852)]

    def round_table(cx, ty, variant=0, meal=None):
        t1, t2 = ROUND[variant % 4]
        c.put(2, cx, ty, t1); c.put(2, cx, ty + 1, t2)
        c.put(2, cx - 1, ty, 387); c.put(2, cx - 1, ty + 1, 395); c.put(2, cx + 1, ty, 386); c.put(2, cx + 1, ty + 1, 394)
        occ([(cx + a, ty + b) for a in (-1, 0, 1) for b in (0, 1)], "round%d,%d" % (cx, ty))
        clone(361, cx, ty)
        if meal != "L": seat(cx - 1, ty + 1)
        if meal != "R": seat(cx + 1, ty + 1)
        if meal == "L": clone(60, cx - 1, ty + 1)
        if meal == "R": clone(61, cx + 1, ty + 1)
    def long_table(x, y):
        for k, t in enumerate((416, 424, 424, 432)): c.put(3, x, y + k, t)
        for dx in (-1, 1):
            for k in (0, 1, 2, 3): c.put(3, x + dx, y + k, 390); seat(x + dx, y + k)
        occ([(x + a, y + b) for a in (-1, 0, 1) for b in range(4)], "long%d,%d" % (x, y))
        clone(361, x, y + 1); clone(362, x, y + 3)
    def game_table(x, y):
        c.put(2, x, y, 387); c.put(2, x, y + 1, 395); c.put(2, x + 3, y, 386); c.put(2, x + 3, y + 1, 394)
        for a, b, t in ((1, 0, 420), (2, 0, 421), (1, 1, 428), (2, 1, 429)): c.put(2, x + a, y + b, t)
        occ([(x + a, y + b) for a in range(4) for b in range(2)], "game%d,%d" % (x, y))
    def pillar(x, y):
        for k, t in enumerate((196, 204, 212)): c.put(3, x, y + k, t)
        occ([(x, y + k) for k in range(3)], "pillar%d,%d" % (x, y))
        clone(369, x, y)
    def plant(x, y):
        c.put(2, x, y, 646); c.put(2, x, y + 1, 654); occ([(x, y), (x, y + 1)], "plant%d,%d" % (x, y))
    def rug(kind, x0, y0, x1, y1):
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1): c.put(1, x, y, 2048 + kind * 48)
        lib.W.reshape({"width": W_, "height": H_, "data": c.data}, 1,
                      [(x, y) for y in range(y0 - 1, y1 + 2) for x in range(x0 - 1, x1 + 2) if 0 <= x < W_ and 0 <= y < H_ and c.get(1, x, y)])

    # ---- the cells the stairs hold; the south wall's doorway to the town (old row 54: caps 3236 / 3234, three floor cells)
    occ([(x, y) for x in range(0, 5) for y in range(23, 32)], "stairs")
    for x, v in ((20, 3236), (21, 6096), (22, 6080), (23, 6104), (24, 3234)): c.put(0, x, 32, v)
    for k in range(3):
        e = keep(10 + k, 21 + k, 32)
        e["pages"][0]["list"][1]["parameters"][2:4] = [50 + k, 17]
    # ---- rugs
    rug(38, 6, 22, 15, 25); rug(38, 25, 22, 29, 25); rug(36, 30, 23, 39, 26)
    rug(22, 5, 27, 16, 30); rug(28, 26, 27, 32, 30)
    # ---- left side
    round_table(8, 23, 0, meal="L"); round_table(13, 23, 1, meal="R")
    long_table(10, 27); round_table(15, 28, 2); round_table(6, 28, 3); round_table(17, 23, 3)
    # ---- right side
    round_table(27, 23, 0); round_table(32, 24, 1); round_table(37, 24, 2)
    long_table(29, 27)
    rug(30, 33, 26, 38, 29); rug(30, 39, 26, 44, 29)
    game_table(34, 27); game_table(40, 27)
    for x in (34, 40): clone(140, x, 28)                 # the dice places at the left chairs
    c.put(3, 42, 30, 439); c.put(3, 42, 31, 447); c.put(3, 41, 31, 390); occ([(42, 30), (42, 31), (41, 31)], "arm")
    clone(148, 41, 31)
    pillar(19, 26); pillar(25, 26)
    plant(44, 30); plant(44, 22)
    # ---- darts: two boards in the north wall beside the stage, the throwing lines 6 rows below
    for x in (42, 44): clone(133, x, 15)
    clone(174, 42, 21); clone(176, 44, 21)
    # ---- the quest board, the plan, hangers by the door
    keep(19, 14, 31); keep(21, 14, 31); occ([(13, 31), (14, 31), (15, 31)], "board")
    keep(349, 28, 31); occ([(28, 31), (29, 31)], "plan")
    clone(29, 18, 31); clone(30, 26, 31); clone(31, 17, 31); clone(32, 31, 31)
    # ---- seats (events 400..)
    for n, (x, y, key) in enumerate(SEATS):
        e = copy.deepcopy(ev_of(400)); e["id"] = 400 + n; e["note"] = "<Siedzi:%s>" % key
        c.add_event(e, x, y)
    # ---- people: Ozzy (4), Grum (3), the 'Atmosfera' events 5-8 (ids kept), the markers Miejsce: gosc_N
    keep(4, 11, 26); keep(3, 38, 30)
    for i, y in ((5, 1), (6, 2), (7, 3), (8, 4)): keep(i, 1, y)
    for i, cell in zip((53, 54, 55, 56, 57, 58, 59, 62), ((20, 24), (19, 30), (25, 29), (31, 30), (23, 25), (6, 31), (43, 24), (21, 22))): keep(i, *cell)
    # ---- lights: chandeliers over the rugs, soft fill
    for (x, y) in ((11, 24), (27, 24), (34, 25), (9, 29), (30, 29)): clone(49, x, y)
    for (x, y) in ((2, 22), (10, 31), (22, 28), (36, 31), (41, 24)): clone(210, x, y)
    clone(136, 43, 18)                                    # a lamp by the darts
    for i in (33, 35): c.events.pop(i, None)             # the two wall decorations in front of the doorways
    c.events[156]["x"], c.events[156]["y"] = 12, 18      # the sleeping cat
    # ---- the doors' pictures in the north wall (the loose brick moves with the pantry)
    for i, x in ((209, 9), (157, 19), (204, 29)):
        keep(i, x, 15, mod=lambda e: e["pages"][0]["image"].__setitem__("direction", 2))
    c.events[9]["x"], c.events[9]["y"] = 9, 6
    # ---- the stairs: events 13-15 on the top row of the stair box (old y47 -> y25), arrival on the guest floor (Map025 29,62)
    for i in (13, 14, 15, 16, 17, 18): c.events.pop(i, None)      # (the stamp brought the old stair events with the old target)
    for k, x in enumerate((1, 2, 3)):
        e = keep(13 + k, x, 25)
        e["pages"][0]["list"][1]["parameters"] = [0, 25, 29, 62, 8, 0]
    return SEATS
