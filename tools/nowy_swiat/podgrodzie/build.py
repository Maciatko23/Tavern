# -*- coding: utf-8 -*-
"""NOWE PODGRODZIE 80x80 (nowy swiat, docs/NOWY_SWIAT/PLAN.md) - staging copy of map 218 for approval; the first map built on
tools/nowy_swiat/wspolne.py (shared library, see its docstring).

python tools/nowy_swiat/podgrodzie/build.py
Output: tools/nowy_swiat/podgrodzie/staging/Map218.json (+ _meta, characters/!$Pod_Mielerz.png), tools/nowy_swiat/szwy.json (seam contract),
        docs/NOWY_SWIAT/podgrodzie_cala.png + podgrodzie_ekrany/ (render.py)
Plan: tools/nowy_swiat/szkic_podgrodzie.py. Nothing here writes data/ or js/."""
import os, sys, json, copy, math, random, collections

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
import wspolne as WS                                                        # noqa: E402
from wspolne import *                                                       # noqa: E402,F401,F403
from wspolne import P, N, B, C, D, E, noise, lowfreq, rect, lane, blob, smooth, smooth_polyline, A5, ROCK_FILL   # noqa: E402
HERE = os.path.dirname(os.path.abspath(__file__))      # (after the star import, which also exports wspolne's own HERE / ROOT)
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", "..")).replace("\\", "/") + "/"

W = H = 80
MAP_ID = 218
STAGING = os.path.join(HERE, "staging")
WS.configure(MAP_ID, STAGING)
NOTE = "<Clouds:on>\n<Farm:off>\n<BuildRegion:8>"          # no <Water:salt>: Podgrodzie has no sea (only the dry riverbed)

# ------------------------------------------------------------------------------------------------ plan (tiles)
ROAD = smooth_polyline([(79.5, 41.5), (66, 41.5), (54, 42.5), (42, 42.5), (30, 43.5), (18, 44.8), (8, 45.5), (-0.5, 45.5)])   # centre of rows 40-42 at x=79, 44-46 at x=0
# the dry riverbed: two flat terraces with a north bank of stone face (A5 rim 104-106 + face 112-114 / 120-122), earth floor
# SEAM CONTRACT (tools/nowy_swiat/szwy.json): x=0 bed rows 61-64 (banks 60 and 65); x=79 bed rows 49-52 (banks 48 and 53)
TW_RIM, TM_RIM, TE_RIM = 58, 52, 46                  # rim row of the west / middle / east terrace; the stone face is the 2 rows below
TW_G, TM_G, TE_G = (61, 64), (55, 58), (49, 52)      # floor rows of the three terraces
POOLS = [(47, 49), (58, 60)]                         # junctions: the floor widens (a natural slope) between two terraces
RAMPS = [(22, 23, TW_RIM), (33, 34, TW_RIM), (70, 71, TE_RIM)]   # gaps in the face: earth slopes down into the bed
BRIDGES = [(40, 57, 65), (14, 57, 65)]               # centre x, first row, last row of the 3-wide deck (bank to bank)
FACES = [(0, 21, TW_RIM, False, True), (24, 32, TW_RIM, True, True), (35, 46, TW_RIM, True, True),
         (50, 57, TM_RIM, True, True), (61, 69, TE_RIM, True, True), (72, 79, TE_RIM, True, False)]   # x0, x1, rim, capL, capR

PLOT = (21, 10, 40, 24)               # grandpa's plot 20x15 (inner field, region 8); the fence ring stands round it
RING = (20, 9, 41, 25)
PLOT_GATES = {(20, 22), (20, 23), (29, 25), (30, 25)}

# the windmill (the user's coordinator, 2026-11-13): the miller is the war spy; sea to the west
MILL = (5, 30)                        # top-left of the 5x5 tower (copied from Map008 x95-99, y83-87)
MILL_DOOR = (MILL[0] + 2, MILL[1] + 4)

# name: key, label, x, y, w, roof, wall, door col, windows, chimney col, style, door picture index, extras
HUTS = [
    dict(k="tkaczka", n="Chata tkaczki", x=27, y=30, w=6, roof="thatch", wall="planks", door=2, win=[(0, "wood"), (4, "wood")], ch=4, cs=3, di=2, garden=True),
    dict(k="wodziarz", n="Chata wodziarza", x=34, y=30, w=6, roof="shingle_dark", wall="grey_logs", door=3, win=[(1, "shut"), (5, "tiny")], ch=1, cs=4, di=6),
    dict(k="kuba", n="Chata woziwody Kuby", x=52, y=30, w=6, roof="shingle", wall="logs", door=2, win=[(0, "wood"), (4, "wood")], ch=4, cs=5, di=2, lean="left", fill="logs"),
    dict(k="rodzina", n="Lepianka rodziny", x=66, y=30, w=6, roof="straw", wall="logs", door=3, win=[(1, "tiny"), (4, "wood")], ch=1, cs=3, di=0, ivy=(5,)),
    dict(k="wdowa", n="Chata wdowy", x=58, y=33, w=6, roof="thatch", wall="boards", door=3, win=[(1, "board"), (4, "wood_lit")], ch=4, cs=3, di=6),
    dict(k="kramarz", n="Kram starzyzny", x=70, y=36, w=6, roof="shingle_brown", wall="planks", door=2, win=[(4, "wood")], ch=4, cs=5, di=2, lean="right", fill="hay"),
    dict(k="praczka", n="Chata praczki", x=20, y=48, w=6, roof="thatch", wall="logs", door=2, win=[(0, "wood"), (4, "shut_lit")], ch=1, cs=4, di=2, garden=True),
    dict(k="rybaczka", n="Chata rybaczki", x=29, y=48, w=6, roof="shingle_dark", wall="grey_logs", door=3, win=[(1, "wood"), (4, "wood")], ch=1, cs=4, di=6, ivy=(0,)),
    dict(k="garncarz", n="Chata garncarza", x=52, y=46, w=6, roof="straw", wall="logs", door=3, win=[(1, "wood")], ch=4, cs=3, di=2, lean="left", fill="logs"),
    dict(k="drwal", n="Chata drwala", x=62, y=56, w=6, roof="shingle", wall="grey_logs", door=3, win=[(1, "wood"), (5, "wood")], ch=1, cs=4, di=2, lean="right", fill="logs"),
    dict(k="znachorka", n="Izba znachorki", x=8, y=66, w=6, roof="straw", wall="logs", door=2, win=[(0, "wood"), (4, "wood_lit")], ch=3, cs=3, di=2, ivy=(1, 5)),
    dict(k="weglarz", n="Chata weglarza", x=22, y=66, w=6, roof="shingle_brown", wall="dark_boards", door=2, win=[(4, "board")], ch=4, cs=5, di=6),
    dict(k="klusownik", n="Chata klusownika", x=48, y=66, w=6, roof="shingle_dark", wall="grey_logs", door=2, win=[(4, "board")], ch=1, cs=4, di=6, ivy=(0, 3)),
    dict(k="mlynarz", n="Chata mlynarza", x=13, y=31, w=6, roof="shingle", wall="planks", door=2, win=[(0, "wood"), (4, "shut_lit")], ch=4, cs=4, di=2, ivy=(5,), garden=True),
    dict(k="garbarz", n="Garbarnia", x=66, y=64, w=6, roof="planks", wall="boards", door=3, win=[(1, "board"), (5, "tiny")], ch=5, cs=5, di=0, lean="left", fill="barrel"),
]
HUT_H = 5       # roof 3 + wall 2



# the seam contract (rows inclusive); filled by Build.seam_report with the real edge columns of this map
SEAMS_STATIC = {
    "opis": "Szwy mapy swiata (5 map 80x80 w jednej linii: Wybrzeze 219 | Podgrodzie 218 | Miasteczko 220 | Posiadlosc 221 | Gory 222). "
            "Wiersze wlacznie. Gory (blokada) zawsze w wierszach 0-6 i 73-79 na kolumnach brzegowych x=0 i x=79 (pas moze byc glebszy i wybrzuszony "
            "do wewnatrz miedzy szwami). Kafle gor (zestaw 11, A5): wypelnienie skalne 72,73,74,80,81,82 (blokuja), skarpa kamienna: krawedz 104-106 "
            "+ lico 112-114 / 120-122 (srodek 105/113/121, konce 104/106...), grunt: A2 trawa 16, ziemia 17, koryto 24, brzegi.",
    "gory": {"wiersze_polnoc": [0, 6], "wiersze_poludnie": [73, 79], "tileset": 11,
             "kafle_wypelnienie_A5": [72, 73, 74, 80, 81, 82], "kafle_wypelnienie_ids": [1608, 1609, 1610, 1616, 1617, 1618],
             "uwaga": "wypelnienie losowe z tych 6 kafli (lub wspolne.mountains); na szwie kolumna brzegowa ma te same kafle po obu stronach (dowolne z szesciu)"},
    "A": {"nazwa": "Wybrzeze | Podgrodzie", "mapy": [219, 218], "podgrodzie": "x=0", "wybrzeze": "x=79", "droga": [44, 46], "koryto": [61, 64],
          "brzegi": [60, 65], "gory": [[0, 6], [73, 79]], "uwaga": "koryto suche (ziemia, kamyki); brzeg polnocny = skarpa kamienna (rim 58, lico 59-60), poludniowy = trawa/ziemia (65)"},
    "B": {"nazwa": "Podgrodzie | Miasteczko", "mapy": [218, 220], "podgrodzie": "x=79", "miasteczko": "x=0", "droga": [40, 42], "koryto": [49, 52],
          "brzegi": [48, 53], "gory": [[0, 6], [73, 79]], "uwaga": "koryto suche; brzeg polnocny = skarpa kamienna (rim 46, lico 47-48), poludniowy = trawa/ziemia (53)"},
    "C": {"nazwa": "Miasteczko | Posiadlosc", "mapy": [220, 221], "miasteczko": "x=79", "posiadlosc": "x=0", "droga": [40, 42], "koryto": [49, 52],
          "brzegi": [48, 53], "woda": {"rodzaj": "waski strumien plytkiej wody", "wiersze": [50, 51]}, "gory": [[0, 6], [73, 79]]},
    "D": {"nazwa": "Posiadlosc | Gory", "mapy": [221, 222], "posiadlosc": "x=79", "gory": "x=0", "droga": [40, 42], "rzeka": {"rodzaj": "pelna rzeka (woda)", "wiersze": [49, 52]},
          "brzegi": [48, 53], "gory_wiersze": [[0, 6], [73, 79]]},
}

class Build(WS.WorldBuild):
    """Podgrodzie: the plan (HUTS, MILL, PLOT, terraces) + the village-specific builders; everything generic is in wspolne.WorldBuild"""

    def __init__(self):
        WS.WorldBuild.__init__(self, MAP_ID, "Podgrodzie", NOTE, seed=218)

    def ground(self):
        mp = self.mp
        mp.kind(0, mp.all, GRASS)
        self.meadow = blob(57, 17, 10, 6.5, 3, 0.12)                                     # the meadow of the later camp: stays lush grass
        # ---- the riverbed floor: north edge straight (the stone face), south edge one smooth curve
        def sm(t):
            t = min(1.0, max(0.0, t)); return t * t * (3 - 2 * t)
        def south(x):
            return int(round(TW_G[1] - 6 * sm((x - 43) / 10.0) - 6 * sm((x - 56) / 10.0)))
        def north(x):
            return TW_G[0] if x <= 46 else TM_G[0] if x <= 57 else TE_G[0]
        g = set()
        for x in range(W):
            for y in range(north(x), south(x) + 1): g.add((x, y))
        self.bed = g
        self.bed_south = south
        # ---- roads (smooth polylines, no wobble: straight runs and gentle curves)
        roads = set(lane(ROAD, 2.8, 0.0, 11))
        def Ls(pts, w, seed=0):
            roads.update(lane(smooth_polyline(pts, 1.0), w, 0.0, seed))
        Ls([(22, 43), (22, 35), (21.6, 31), (20.3, 27.5), (18.8, 24.5), (18.5, 22.5)], 2.0)      # to the plot's west gate
        Ls([(15, 21.2), (17, 22.4), (18.5, 23)], 1.8)
        Ls([(29.5, 25.8), (29.4, 27.5), (27, 29), (23, 30.5)], 1.8)                              # plot south gate -> lane
        Ls([(46, 43), (46, 37)], 2.0)
        Ls([(46, 37), (46, 31), (47, 26), (50, 22.5)], 1.9)                                      # shrine -> meadow
        Ls([(64.5, 41), (64.5, 33), (63.8, 27), (63.3, 22), (64.5, 18), (66.5, 16.8), (68, 16.4)], 2.0)                        # to the shed
        Ls([(14, 44), (14, 56)], 2.0); Ls([(14, 66), (14, 72)], 2.0)                             # west lane over the footbridge
        Ls([(40, 53), (40, 56)], 2.0); Ls([(40, 66), (40, 72)], 2.0)
        Ls([(49.5, 43), (49.5, 50), (49.5, 53.6), (44, 54.4), (40, 54)], 1.9)                    # east of the shelter
        Ls([(14, 55.2), (22, 55.2), (30, 55.2), (36, 55), (40, 54.5)], 1.7)                      # footpath along the north bank
        Ls([(22.5, 55.2), (22.5, 57.5)], 1.8); Ls([(33.5, 55.2), (33.5, 57.5)], 1.8); Ls([(70.5, 43), (70.5, 45.5)], 1.8)
        Ls([(65, 61), (63.5, 63), (63.5, 70), (64, 72)], 1.6)                # to the ramps
        Ls([(9, 72), (23, 72), (40, 72), (60, 72), (66.5, 71.5)], 1.8)                           # south lane
        Ls([(8, 45), (7, 41), (7, 36.5)], 2.0)                                                   # to the windmill
        Ls([(15, 44.3), (15, 37)], 1.8)                                                          # to the miller's hut
        roads = smooth(roads, 1)
        self.hard = set(roads) - g
        roads |= blob(41, 54, 6.2, 1.6, 31, 0.1)
        roads |= blob(MILL_DOOR[0], MILL_DOOR[1] + 2, 2.6, 1.4, 32, 0.1)
        roads |= blob(15.5, 21.5, 4.8, 2.4, 33, 0.1)
        roads |= blob(46, 40.3, 3.0, 1.6, 34, 0.1)
        roads -= g
        self.roads = roads
        mp.kind(0, roads, EARTH)
        for c in roads: mp.layers[1].pop(c, None)
        for c in roads:
            if noise(c[0], c[1], 44) > 0.97: mp.layers[1][c] = ("k", PEBBLES)
        # ---- the bed: earth, soft dry patches, pebbles on the edges, small cracked-mud patches
        mp.kind(0, g, 24)
        for c in g: mp.layers[1].pop(c, None)
        dry = smooth({c for c in g if lowfreq(c[0], c[1], 77, 4.0) > 0.60}, 1)
        for c in dry: mp.layers[1][c] = ("k", DRY)
        edge = {c for c in g if any((c[0] + dx, c[1] + dy) not in g for dx in (-1, 0, 1) for dy in (-1, 0, 1))}
        for c in edge:
            if noise(c[0], c[1], 42) < 0.3: mp.layers[1][c] = ("k", PEBBLES)
        rnd = random.Random(5)
        interior = sorted(c for c in g if c not in edge and 6 < c[0] < W - 8 and c[1] > 58)
        for i in range(7):
            cx, cy = rnd.choice(interior)
            for c in blob(cx + 0.5, cy + 0.5, rnd.uniform(1.2, 2.0), rnd.uniform(0.7, 1.1), 90 + i, 0.1):
                if c in g and c not in edge: mp.layers[0][c] = ("k", MUD); mp.layers[1].pop(c, None)
        # banks on the grass: a few pebbles along the south bank
        ring = {(x + dx, y + dy) for (x, y) in g for dx in (-1, 0, 1) for dy in (-1, 0, 1)} - g
        for c in ring:
            if c in roads or c[1] < 60: continue
            if noise(c[0], c[1], 43) < 0.18: mp.layers[1][c] = ("k", PEBBLES)
        self.plot_field()

    def plot_field(self):
        """grandpa's old, neglected field: faint furrows of earth (A2 24), soft light patches and tufts - only ground kinds that
        Farming accepts as soil (grass 16 / 27 / 21, earth 17 / 24; checked with Farming_Plots' colour test)"""
        mp = self.mp
        x0, y0, x1, y1 = PLOT
        for c in rect(x0 - 1, y0 - 1, x1 + 1, y1 + 1): mp.layers[1].pop(c, None)
        cells = rect(x0, y0, x1, y1)
        for c in cells:
            mp.layers[0][c] = ("k", GRASS); mp.region[c] = 8; self.occ.add(c)
        for c in smooth({c for c in cells if lowfreq(c[0], c[1], 17, 5.0) > 0.64}, 2):
            mp.layers[0][c] = ("k", GRASS_LIGHT)
        for yy in range(y0 + 1, y1, 2):
            for x in range(x0, x1 + 1):
                if lowfreq(x, yy, 23, 4.0) > 0.35 and noise(x, yy, 3) > 0.08: mp.layers[0][(x, yy)] = ("k", GRASS_LIGHT)
        for c in smooth({c for c in cells if lowfreq(c[0], c[1], 19, 4.5) > 0.74}, 2):
            mp.layers[0][c] = ("k", 24)
        for c in cells:
            if noise(c[0], c[1], 8) < 0.07 and mp.layers[0][c][1] != 24: mp.layers[1][c] = ("k", TUFTS)

    def plot_resources(self):
        """grandpa's neglected field: the first things to gather and clear - real working templates of Map003 (see WS.resources)"""
        self.plot_used = self.resources(
            stumps=((24, 14), (36, 20), (27, 22), (38, 12)),
            rocks=((31, 14, "!$Rock_Flat"), (22, 18, "!$Rock_Mossy"), (35, 16, "!$Rock_Pile"), (28, 21, "!$Rock_Chunk")),
            bushes=[(x, 10, ("!$Bush_Bare_A", "!$Bush_Bare_B")[i % 2]) for i, x in enumerate((23, 26, 29, 32, 35))],
            trees=((39, 23, "!$Tree_Apple"),), logs=((23, 21, "!$Trunk_Dead"),))

    def build(self):
        mp = self.mp
        self.ground()
        self.mountains(((7, 23), (51, 57), (66, 72)), ((7, 37), (45, 46), (54, 72)), north=(7, 7, 9), south=(7, 7, 7),
                       max_depth=lambda x: 8 if 17 <= x <= 44 else 9)
        self.bank(FACES, RAMPS, BRIDGES)
        self.mill()
        for d in HUTS: self.hut(d)
        self.grandpa()
        self.shelter()
        self.shed_ruin()
        self.huts_surroundings()
        self.village()
        self.riverbed_features()
        self.earth_and_grass()
        self.plot_resources()
        self.forest()
        self.stumps_and_scrub()
        self.life([(52, 12, 64, 24), (66, 40, 75, 50), (5, 26, 12, 44), (24, 56, 36, 63), (50, 60, 76, 70), (52, 36, 62, 40), (22, 34, 26, 44)])
        self.spots()
        self.regions()
        return mp

    def mill(self):
        mp = self.mp
        src = json.load(open(ROOT + "data/Map008.json", encoding="utf-8"))
        SW, SH, sd = src["width"], src["height"], src["data"]
        mx, my = MILL
        # a low flat knoll: lighter grass with a soft edge, a stony top, the way up
        knoll = blob(mx + 2.5, my + 2.5, 6.4, 5.8, 41, 0.18)
        for c in knoll:
            mp.layers[0][c] = ("k", GRASS_LIGHT)
            mp.layers[1].pop(c, None)
        for c in knoll:
            if noise(c[0], c[1], 8) < 0.12: mp.layers[1][c] = ("k", TUFTS)
        # the tower: Map008's tiles (x95-99, y83-87) on layers 0, 3 and regions
        for j in range(5):
            for i in range(5):
                sx, sy = 95 + i, 83 + j
                t0 = sd[(0 * SH + sy) * SW + sx]
                t3 = sd[(3 * SH + sy) * SW + sx]
                rg = sd[(5 * SH + sy) * SW + sx]
                tx, ty = mx + i, my + j
                mp.layers[0][(tx, ty)] = ("t", t0)
                mp.layers[1].pop((tx, ty), None)
                if t3: mp.layers[3][(tx, ty)] = ("t", t3)
                if rg: mp.region[(tx, ty)] = rg
        # the events: cap and sails (copied), a placeholder door
        for e in src["events"]:
            if e and e["id"] in (443, 447):
                ne = {"name": e["name"], "note": e["note"], "pages": copy.deepcopy(e["pages"])}
                mp.add(mx + (e["x"] - 95), my + (e["y"] - 83), ne)
        door = self.door_placeholder(MILL_DOOR[0], MILL_DOOR[1], "Wiatrak", "wiatrak", 5, "Zamknięte. Młynarz nie otwiera.")
        mp.spot("wiatrak_przed", MILL_DOOR[0], MILL_DOOR[1] + 1, 2)
        mp.buildings.append({"key": "wiatrak", "name": "Wiatrak", "rect": [mx, my, mx + 4, my + 4], "door": list(MILL_DOOR),
                             "front": [MILL_DOOR[0], MILL_DOOR[1] + 1], "interior": None, "hours": None, "roof": 0, "wall": 0, "event": door, "lean": None})
        mp.buildings[-1]["event"] = door
        self.occ |= rect(mx - 1, my - 2, mx + 5, my + 5)
        self.mill_hut = None

    def grandpa(self):
        mp = self.mp
        x, y = 12, 14
        rec = mp.house("dziadek", "Dom dziadka", x, y, 7, 4, 2, "shingle", "grey_logs", 3, door_pic=("!Fantasy_door1", 2),
                       windows=[(1, "wood"), (5, "wood_lit")], chimney=None, ivy=(0,), lean="left", lean_fill="logs", interior=None,
                       closed_text="Zamknięte.")
        ev = rec["event"]; ev["name"] = "Drzwi: Dom dziadka"; ev["note"] = "<Town:door=dziadek>"
        mp.tl(x + 5, y, B(4, 10), 3); mp.tl(x + 5, y + 1, B(4, 11), 3)
        mp.picture(x + 5, y, "!Fantasy_chimney", 0, 2, 1, name="Dym z komina", priority=2, through=True, step=True)
        self.huts["dziadek"] = rec
        self.occ |= rect(x - 1, y - 1, x + 6, 19) | {(15, 20), (15, 21)}
        mp.spot("dziadek_drzwi", 15, 20, 2)
        # the plot's fence ring (a fence just ends at a gap: no extra posts)
        x0, y0, x1, y1 = RING
        ring = {(xx, yy) for (xx, yy) in rect(x0, y0, x1, y1) if xx in (x0, x1) or yy in (y0, y1)} - PLOT_GATES
        self.fence(ring, force=True)
        # the yard: a short fence on the west and south, things for a poor old man
        yard = {(10, yy) for yy in range(20, 25)} | {(xx, 24) for xx in range(10, 19)}
        self.fence(yard)
        self.thing("chopping_block", 12, 21); self.thing("logs_small", 11, 22)
        self.prop("barrel_water", 17, 20, label="Beczka na deszczówkę")
        # a small bed by the lean-to
        self.thing("bench", 12, 23)

    def shelter(self):
        mp = self.mp
        x, y = 36, 46
        rec = mp.house("przytulek", "Przytułek", x, y, 11, 4, 3, "thatch", "logs", 5, door_pic=("!Fantasy_door1", 0),
                       windows=[(1, "board"), (3, "shut"), (7, "shut"), (10, "tiny")], chimney=None, ivy=(), lean="right", lean_fill="barrel",
                       interior=None, closed_text="Zamknięte.")
        ev = rec["event"]; ev["name"] = "Drzwi: Przytułek"; ev["note"] = "<Town:door=przytulek>"
        self.chimney(x, y, 8, 5)
        self.huts["przytulek"] = rec
        self.occ |= rect(x - 1, y - 1, x + 11, y + 6) | {(41, 53), (41, 54)}
        mp.spot("przytulek_drzwi", 41, 53, 2)
        mp.spot("przytulek_kociol", 44, 53, 8)
        # Gawel sleeps under the east wall (the lean-to's roof), a pot of soup before the door
        self.prop("bedroll", 47, 52, label="Posłanie Gawła")
        mp.spot("gawel", 47, 52, 2)
        mp.picture(44, 53, "!$Pod_Kociol", 0, 2, 0, name="Kocioł z zupą", priority=1,
                   note="<Occupy:left=1,right=1,up=1><Light:200,120,60,14><LightFlicker:0.15>")
        mp.lights.append({"name": "Kocioł z zupą", "x": 44, "y": 53, "note": "<Light:200,120,60,14>"})
        self.occ |= rect(43, 52, 45, 53)
        self.thing("log_bench", 38, 53); self.thing("log_bench", 40, 55) if False else None
        self.thing("basket_jugs", 37, 53); self.thing("firewood", 48, 49) if False else None

    def shed_ruin(self):
        """the kids' hideout: a believable ruin - wall of dark boards with a missing stretch, half of a gable roof still standing
        (E 8..11, 0..4), the other half fallen: boards, a beam and rubble on the ground, a dead tree behind"""
        mp = self.mp
        x, y = 66, 13
        wk = P.WALL["dark_boards"]
        wall = rect(x, y + 1, x + 4, y + 2)
        mp.kind(0, wall, wk)
        for c in wall: mp.layers[1].pop(c, None)
        for c in ((x + 3, y + 1), (x + 4, y + 1), (x + 2, y + 2)):       # the missing planks: holes in the wall
            mp.layers[0][c] = ("k", GRASS)
        for j in range(5):
            for i in range(4):
                mp.tl(x + i, y - 3 + j, E(8 + i, j), 3)
        for c in rect(x, y - 3, x + 3, y + 1): self.occ.add(c)
        self.occ |= rect(x, y + 1, x + 4, y + 2) | {(x + 2, y + 3)}
        mp.region[(x, y + 2)] = 2; mp.region[(x + 1, y + 2)] = 2; mp.region[(x, y + 1)] = 2; mp.region[(x + 1, y + 1)] = 2
        mp.region[(x + 2, y + 1)] = 2
        mp.spot("wroble_szopa", x + 2, y + 3, 2)
        self.thing("sticks", x + 5, y + 3); self.thing("sticks_b", x + 3, y + 4); self.thing("sticks", x + 1, y + 4)
        self.thing("log_v", x + 6, y + 2); self.thing("wheel", x + 5, y + 5)
        self.dead_tree(x - 5, y + 3)

    def huts_surroundings(self):
        mp = self.mp
        H_ = {d["k"]: d for d in HUTS}
        # ---- north row
        d = H_["tkaczka"]; self.yard(d)
        self.path([(29, 35), (29, 38), (30, 42)], 1.6, 40)
        x, y = d["x"], d["y"]
        self.thing("hide_rack_b", x - 1, y + 4)
        d = H_["wodziarz"]; self.yard(d)
        self.path([(37, 35), (37, 38), (37, 42)], 1.6, 41)
        x, y = d["x"], d["y"]
        self.prop("barrel_water", x - 1, y + 4); self.prop("barrel_water_b", x + 6, y + 4); self.thing("barrels2", x + 8, y + 4)
        d = H_["kuba"]
        self.path([(54, 35), (51.5, 36), (51.5, 41)], 1.6, 42)
        x, y = d["x"], d["y"]
        self.thing("cart_barrels", x - 4, y + 7)
        d = H_["rodzina"]
        self.path([(69, 35), (69, 38), (68.5, 40)], 1.6, 43)
        self.garden_at(67, 25, 70, "L")                      # the family's vegetable bed behind the hut (fenced, rows of crops)
        self.laundry(72, 31, [(9, 13), (10, 13)])
        d = H_["wdowa"]
        self.path([(61, 38), (62, 40), (62, 41)], 1.6, 44)
        self.goat_pen(52, 36, 57, 40)                        # the widow's goat pen (a quest needs it): west of her hut, gate toward her door
        x, y = d["x"], d["y"]
        self.thing("hay", x + 7, y + 4)
        d = H_["kramarz"]
        self.stall(66, 38)                                    # the junk dealer's awning stall beside his hut
        # ---- south row, along the bed
        d = H_["praczka"]
        self.path([(22, 53), (22, 54.5), (22, 55.5)], 1.6, 45)
        x, y = d["x"], d["y"]
        self.laundry(x + 6, y + 3, [(9, 13), (10, 13), (12, 13)])
        self.laundry(x - 1, y + 7, [(12, 13), (9, 13)])
        self.prop("barrel_water", x - 1, y + 4)
        d = H_["rybaczka"]
        self.path([(32, 53), (32, 54.5), (32, 55.2)], 1.6, 46)
        x, y = d["x"], d["y"]
        self.thing("hide_rack", x - 2, y + 4); self.thing("hide_rack_b", x - 1, y + 4); self.thing("barrels2", x + 7, y + 4)
        d = H_["garncarz"]
        self.path([(55, 51), (53, 52.5), (50, 53)], 1.6, 47)
        x, y = d["x"], d["y"]
        mp.picture(x - 3, y + 4, "!$Pod_Piec", 0, 2, 0, name="Piec garncarski", priority=1,
                   note="<Occupy:left=1,right=1,up=1><Light:170,100,50,12><LightFlicker:0.12>")
        mp.lights.append({"name": "Piec garncarski", "x": x - 3, "y": y + 4, "note": "<Light:170,100,50,12>"})
        self.occ |= rect(x - 4, y + 3, x - 2, y + 4)
        self.thing("bench", x + 7, y + 4)
        d = H_["drwal"]
        pass
        x, y = d["x"], d["y"]
        self.thing("firewood", x - 2, y + 5); self.thing("firewood", x - 5, y + 5)
        self.thing("woodshed", x + 8, y + 4); self.thing("chopping_block", x + 4, y + 6)
        d = H_["mlynarz"]; self.yard(d)
        self.path([(15, 36), (15, 40), (15, 43)], 1.8, 53)
        self.path([(12, 35.5), (10, 36), (8, 36)], 1.4, 54)
        x, y = d["x"], d["y"]
        self.thing("barrel", x - 1, y + 4); self.thing("log_bench", x + 8, y + 4)
        # ---- far south
        d = H_["znachorka"]
        self.path([(10, 71), (10.5, 71.8), (10.5, 72)], 1.6, 49)
        x, y = d["x"], d["y"]
        self.thing("hide_rack_b", x + 6, y + 4); self.thing("hide_rack", x + 7, y + 4)
        d = H_["weglarz"]
        self.path([(24, 71), (24, 71.8), (24, 72)], 1.6, 50)
        x, y = d["x"], d["y"]
        self.charcoal_pile(x + 8, y + 3)
        self.thing("firewood", x - 1, y + 4)
        d = H_["klusownik"]
        self.path([(50, 71), (50, 71.8), (50, 72)], 1.6, 51)
        x, y = d["x"], d["y"]
        self.thing("hide_rack", x - 1, y + 4); self.thing("hide_rack_b", x - 2, y + 4)
        d = H_["garbarz"]
        self.path([(69, 68), (69, 70), (68, 71.5)], 1.6, 52)
        x, y = d["x"], d["y"]
        self.thing("hide_rack", x - 4, y + 3); self.thing("hide_rack_b", x - 3, y + 3); self.thing("hide_rack", x - 2, y + 5)
        self.thing("barrels2", x + 7, y + 4)
        # ---- worn footpaths between neighbours
        self.path([(69, 36), (66.5, 36.5), (64.5, 36.8)], 1.3, 60)
        self.path([(37, 36), (40, 38), (44, 40)], 1.3, 61)
        self.path([(11, 24), (10, 28), (10.5, 33), (9, 36.5)], 1.3, 62)

    def stall(self, x, y):
        """the junk dealer's awning (E 4..5, 5..8) with a table under it, in front of his hut, off the road"""
        mp = self.mp
        cells = rect(x, y - 3, x + 1, y)
        if not self.free(list(cells)): self.log.append("skip stall"); return
        for j in range(4):
            mp.tl(x, y - 3 + j, E(4, 5 + j), 3); mp.tl(x + 1, y - 3 + j, E(5, 5 + j), 3)
        self.occ |= cells
        self.thing("pots", x, y) if False else None

    def goat_pen(self, x0, y0, x1, y1):
        mp = self.mp
        ring = {c for c in rect(x0, y0, x1, y1) if c[0] in (x0, x1) or c[1] in (y0, y1)}
        gate = {(x1, y0 + 2), (x1, y0 + 3)}
        if not self.free(list(rect(x0, y0, x1, y1))): self.log.append("skip goat pen"); return
        self.fence(ring - gate)
        self.occ |= rect(x0, y0, x1, y1)
        for (x, y) in rect(x0 + 1, y0 + 1, x1 - 1, y1 - 1):
            mp.layers[0][(x, y)] = ("k", DIRT)
        mp.picture(x0 + 1, y0 + 2, "$Animal_Sheep", 0, 6, 1, name="Koza wdowy", priority=1, through=False)
        mp.picture(x0 + 1, y1 - 1, "!$Pod_Chlewik", 0, 2, 0, name="Szopa kozy", priority=1, note="<Occupy:left=1,right=1,up=1>") if False else None

    def charcoal_pile(self, x, y):
        """the charcoal pile (mielerz): a 3x2 dark mound (!$Pod_Mielerz, made by make_sheets) with glowing embers"""
        mp = self.mp
        cells = rect(x - 1, y - 1, x + 1, y)
        if not self.free(list(cells)): self.log.append("skip charcoal"); return
        mp.picture(x, y, "!$Pod_Mielerz", 0, 2, 0, name="Mielerz (stos węgla drzewnego)", priority=1, note="<Occupy:left=1,right=1,up=1>")
        self.occ |= rect(x - 2, y - 2, x + 2, y + 1)
        mp.picture(x + 1, y, "!Decoration", 3, 4, 0, name="Żar mielerza", priority=2, through=True, step=True,
                   note="<Light:190,90,40,10><LightFlicker:0.2>") if False else None
        mp.spot("weglarz_mielerz", x, y + 1, 8)

    def village(self):
        mp = self.mp
        # ---- the wayside shrine (kapliczka) at the crossroads: a small roofed box on posts (B 10..11, 9..12) over a wooden cross,
        # flowers, a bench, a fire lantern
        sx, sy = 43, 40
        for c in rect(sx - 4, sy - 3, sx + 1, sy + 1):
            if c in self.roads: continue
        for j in range(4):
            mp.tl(sx, sy - 3 + j, B(10, 9 + j), 3); mp.tl(sx + 1, sy - 3 + j, B(11, 9 + j), 3)
        mp.shadow[(sx, sy)] = 15; mp.shadow[(sx + 1, sy)] = 15
        for c in ((sx, sy), (sx + 1, sy)): mp.region[c] = 2
        self.occ |= rect(sx, sy - 3, sx + 1, sy)
        c0, r0, w0, h0 = P.THINGS["cross_flowers"]
        mp.piece("C", c0, r0, w0, h0, sx, sy - 1, 2)
        mp.region[(sx, sy)] = 2
        for c in ((sx - 1, sy), (sx + 2, sy), (sx - 1, sy + 1), (sx + 2, sy + 1), (sx + 1, sy + 1)):
            if self.free([c], True): mp.clump(("white_fl", "white_fl_b", "yellow_fl")[(c[0] + c[1]) % 3], c[0], c[1]); self.occ.add(c)
        self.thing("log_bench", 49, 42, allow_road=True) if False else None
        self.thing("log_bench", sx - 3, sy + 1, allow_road=True)
        self.lamp(sx + 4, sy, "Latarnia przy kapliczce")
        self.say(sx, sy, "Kapliczka", "Przydrożna kapliczka z drzewa. Pod daszkiem krzyż, a u jego stóp polne kwiaty.", "Na belce wyryto: \"Daj deszczu\".")
        mp.spot("kapliczka", sx, sy + 1, 8)
        # ---- the dried-up well north of the road
        self.prop("well_dry", 30, 39, label="Sucha studnia",
                  cmds=P.text_cmds("Sucha studnia. Na dnie tylko kamienie i kurz.", "Wodę nosi się z miasta, i to za opłatą."))
        mp.spot("studnia_sucha", 31, 40, 8)
        # ---- signposts at the west and east exits
        self.sign(9, 43, "Drogowskaz", "Na zachód: wybrzeże. Na wschód: miasteczko.")
        # ---- lamps by the road (fire only): wooden lantern posts
        for (x, y) in ((24, 41), (58, 39), (12, 42), (70, 43), (37, 54)):
            self.lamp(x, y, "Latarnia")
        # ---- junk on the roadside: a cart by the road
        self.thing("cart", 38, 40)
        # ---- the camp meadow (a later refugee camp)
        mp.spot("oboz_laka", 57, 17, 2)
        mp.spot("brama_wsch", 74, 41, 6); mp.spot("brama_zach", 6, 45, 4)
        mp.spot("plac", 46, 41, 2)

    def riverbed_features(self):
        mp = self.mp
        g = self.bed
        # the future well: at the foot of the second ramp, a small pile of stones and a stake
        wx, wy = 34, 63
        for c in ((wx - 1, wy), (wx, wy), (wx, wy - 1)):
            mp.tl(c[0], c[1], D(10 + (c[0] + c[1]) % 2, 5), 2)
        self.thing("log_v", wx + 2, wy)
        self.occ |= {(wx - 1, wy), (wx, wy), (wx, wy - 1)}
        mp.spot("studnia_nowa", wx + 1, wy, 2)
        self.bed_details()

    def forest(self):
        mp = self.mp
        self.trees = []
        inner = [(8, 12, "leafy"), (47, 12, "pine_b"), (60, 8, "leafy"), (36, 37, "pine"), (73, 30, "leafy"), (17, 51, "leafy"),
                 (58, 26, "pine"), (44, 68, "leafy"), (31, 69, "pine_b"), (58, 68, "leafy"), (6, 53, "pine"), (73, 66, "pine_b")]
        for (x, y, k) in inner:
            cells = [(x + dx, y + dy) for dx in (-1, 0, 1) for dy in (-3, -2, -1, 0)]
            if self.free(cells):
                mp.tree(x, y, k, name="Drzewo (ozdobne)"); self.occ.add((x, y)); self.trees.append((x, y))
        self.foot()

    def spots(self):
        mp = self.mp
        for (k, (x, y, d)) in {"plot_wejscie": (30, 26, 8), "plot_srodek": (30, 17, 2), "dom_dziadka_podworko": (14, 22, 4)}.items():
            mp.spot(k, x, y, d)


def make_sheets():
    """!$Pod_Mielerz: a charcoal clamp (hay stack of the C sheet recoloured: black earth-covered dome with embers)"""
    from PIL import Image
    out_dir = os.path.join(STAGING, "characters")
    os.makedirs(out_dir, exist_ok=True)
    out = os.path.join(out_dir, "!$Pod_Mielerz.png")
    sheet = Image.open(ROOT + "img/tilesets/Styl_B/Winlu Fantasy Tileset - Exterior/Winlu Fantasy Exterior/tilesets/Fantasy_Outside_C.png").convert("RGBA")
    hay = sheet.crop((13 * 48, 10 * 48, 16 * 48, 12 * 48))
    px = hay.load()
    for y in range(hay.height):
        for x in range(hay.width):
            r, g, b, a = px[x, y]
            if a < 10: continue
            l = (r * 30 + g * 59 + b * 11) / 100.0
            t = max(0.0, min(1.0, (l - 90) / 150.0))
            nr, ng, nb = 26 + 58 * t, 24 + 50 * t, 22 + 44 * t
            if (x * 7 + y * 13) % 41 == 0: nr, ng, nb = 150, 60, 28        # embers
            px[x, y] = (int(nr), int(ng), int(nb), a)
    fw, fh = 144, 144
    sh = Image.new("RGBA", (fw * 3, fh * 4), (0, 0, 0, 0))
    for r in range(4):
        for c in range(3):
            sh.alpha_composite(hay, (c * fw, r * fh + fh - hay.height))
    sh.save(out)
    return out


def main():
    make_sheets()
    b = Build()
    b.build()
    path, data, events, meta = b.write()
    print("Map%d Podgrodzie: %dx%d, %d events -> %s" % (MAP_ID, W, H, len(events) - 1, os.path.relpath(path, ROOT)))
    static = SEAMS_STATIC
    b.seam_report(os.path.join(HERE, "..", "szwy.json"), static, {"A": ("west", 0), "B": ("east", W - 1)})
    if b.log: print("skipped:", len(b.log)); [print("  ", l) for l in b.log[:40]]
    return b


if __name__ == "__main__":
    main()
