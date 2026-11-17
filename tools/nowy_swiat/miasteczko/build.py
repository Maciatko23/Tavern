# -*- coding: utf-8 -*-
"""MIASTECZKO 80x80 (nowy swiat, docs/NOWY_SWIAT/PLAN.md) - staging copy of map 220, on tools/nowy_swiat/wspolne.py.

python tools/nowy_swiat/miasteczko/build.py     -> tools/nowy_swiat/miasteczko/staging/Map220.json (+ _meta)
python tools/nowy_swiat/miasteczko/render.py    -> docs/NOWY_SWIAT/miasteczko_cala.png + miasteczko_ekrany/
Nothing here writes data/ or js/ or szwy.json.

Plan (x right, y down; the main road runs along rows 40-42):
  north of the road, row A (doors on row 37): Walenty, Dorota (3), widow (4), smithy, TAVERN (x 39-54) + stable yard (x 56-67), old couple (7)
  north, row B (doors on row 24, lane rows 26-27): chapel + bell tower + cemetery + gravedigger, town hall, kantor, bakery, brewery
  south of the road: the MARKET SQUARE (x 36-58, y 43-51) with the well; the leat comes from the stream at the east and ends at the well
  the dry bed (rows 49-52 at both seams) steps down to rows 55-58 under the square; south of it the workshops: Waclaw, Leon, guild x3, granary
"""
import os, sys, json, copy, math, random

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
import wspolne as WS                                                        # noqa: E402
from wspolne import P, N, B, C, D, E, noise, lowfreq, rect, lane, blob, smooth, smooth_polyline, A5, ROCK_FILL   # noqa: E402
from wspolne import GRASS, DIRT, GRASS_LIGHT, MUD, EARTH, TUFTS, SOFT, DRY, PEBBLES, FENCE, PLANKS   # noqa: E402
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = WS.ROOT

W = H = 80
MAP_ID = 220
STAGING = os.path.join(HERE, "staging")
WS.configure(MAP_ID, STAGING)
NOTE = "<Clouds:on>\n<Farm:off>"
COBBLE, WATER = 40, 0

# ------------------------------------------------------------------------------------------------ the bed (SEAM CONTRACT: rows 49-52 at x=0 and x=79)
# one straight dry channel, floor rows 49-52, banks 48 / 53, stone face on the north bank (rim 46, face 47-48)
BED_ROWS = (49, 52)
FACES = [(0, 30, 46, False, True), (34, 46, 46, True, True), (50, 59, 46, True, True), (63, 64, 46, True, True), (68, 75, 46, True, True)]
RAMPS = [(31, 33, 46), (47, 49, 46), (60, 62, 46), (65, 67, 46)]
BRIDGES = [(14, 45, 53), (72, 45, 53)]
STREAM_X0 = 66                                   # the trickle (rows 50-51) from here to the east edge
LEAT = [(66, y) for y in range(49, 45, -1)] + [(x, 45) for x in range(66, 51, -1)]
WELL = (50, 45)                                  # bottom-left cell of the well (2 wide, 4 tall)

# name: key, label, x, yb(door row), w, roof_h, wall_h, roof, wall, door col, windows, chimney cols, chimney style, door picture, extras
BUILD = [
    # ---- north row A (doors on row 37, front row 38)
    dict(k="walenty", n="Dom Walentego", x=5, yb=37, w=6, roof="thatch", wall="logs", door=3, win=[(1, "wood"), (4, "wood_lit")], ch=[4], cs=3, di=2, ivy=(0,),
         sign=None),
    dict(k="dom3", n="Dom Doroty, szwaczki", x=13, yb=37, w=6, roof="shingle", wall="planks", door=2, win=[(0, "wood"), (4, "wood")], ch=[4], cs=4, di=2, sign=(0, 4, 0),
         ivy=(5,)),
    dict(k="dom4", n="Dom wdowy z dziećmi", x=21, yb=37, w=6, roof="shingle_brown", wall="logs", door=3, win=[(1, "wood_lit"), (4, "wood")], ch=[1], cs=3, di=6),
    dict(k="kuznia", n="Kuźnia Tadka", x=28, yb=37, w=8, roof="shingle_dark", wall="grey_logs", door=6, win=[(1, "shut"), (4, "tiny")], ch=[2, 5], cs=5, di=0,
         lean="right", fill="logs", sign=(0, 2, 0)),
    dict(k="tawerna", n="Tawerna", x=45, yb=37, w=5, rh=6, wh=4, roof="straw", wall="logs", door=2, di=2, ch=[1, 3], cs=3, tavern=True, dormer=(2, 0)),
    dict(k="stajnia", n="Stajnia", x=58, yb=32, w=7, rh=2, wh=2, roof="planks", wall="dark_boards", door=3, di=6, win=[(1, "board"), (5, "board")], ch=[], cs=3,
         closed="Stajnia jest zamknięta. Konie śpią."),
    dict(k="dom7", n="Dom starej pary", x=69, yb=37, w=6, roof="shingle", wall="planks", door=2, win=[(0, "wood_lit"), (4, "wood")], ch=[4], cs=4, di=2, ivy=(5,)),
    # ---- north row B (doors on row 24, front row 25, lane on rows 26-27)
    dict(k="kaplica", n="Kaplica", x=7, yb=24, w=7, rh=4, wh=3, roof="slate", wall="plaster", door=3, di=0, ch=[], cs=5, chapel=True,
         closed="Kaplica jest zamknięta."),
    dict(k="dzwonnica", n="Dzwonnica", x=16, yb=24, w=3, rh=1, wh=3, roof="slate", wall="plaster", door=1, di=0, ch=[], cs=5, belfry=True,
         closed="Drzwi dzwonnicy są zaryglowane."),
    dict(k="grabarz", n="Chata grabarza", x=22, yb=24, w=6, roof="shingle_dark", wall="dark_boards", door=3, di=6, win=[(1, "board"), (4, "wood")], ch=[1], cs=4),
    dict(k="ratusz", n="Ratusz", x=38, yb=24, w=11, rh=4, wh=3, roof="slate", wall="plaster", door=5, di=0, win=[(1, "wood"), (3, "wood"), (7, "wood"), (9, "wood")],
         ch=[2, 8], cs=5, sign=(3, 2, 0)),
    dict(k="kantor", n="Kantor Baltazara", x=51, yb=24, w=6, roof="shingle_dark", wall="boards_stone", door=3, di=6, win=[(1, "shut"), (4, "tiny")], ch=[5], cs=5, sign=(0, 2, 1)),
    dict(k="piekarnia", n="Piekarnia", x=59, yb=24, w=6, roof="shingle", wall="planks", door=2, di=2, win=[(0, "wood_lit"), (4, "wood")], ch=[4, 5], cs=3, sign=(3, 2, 1)),
    dict(k="browar", n="Browar cechowy", x=67, yb=24, w=9, rh=3, wh=3, roof="planks", wall="dark_boards", door=4, di=2, win=[(1, "shut"), (6, "shut_lit")], ch=[2, 7], cs=5,
         sign=(1, 2, 2)),
    # ---- the square
    dict(k="budka", n="Dom studziennego", x=42, yb=65, w=5, roof="shingle", wall="planks", door=2, di=2, win=[(0, "wood"), (4, "wood_lit")], ch=[3], cs=4,
         closed="Dom studziennego. Nikogo nie ma."),
    # ---- south row (doors on row 65, front row 66, lane on rows 67-68)
    dict(k="dom8", n="Dom weterana Wacława", x=8, yb=65, w=6, roof="shingle_brown", wall="grey_logs", door=3, di=6, win=[(1, "wood"), (4, "board")], ch=[1], cs=4, ivy=(5,)),
    dict(k="ciesla", n="Warsztat cieśli Leona", x=17, yb=65, w=10, roof="shingle", wall="logs", door=4, di=2, win=[(1, "wood"), (7, "wood")], ch=[8], cs=3,
         lean="right", fill="barrel"),
    dict(k="cech1", n="Warsztat Ostapa", x=35, yb=65, w=6, roof="shingle_brown", wall="planks", door=2, di=2, win=[(0, "wood"), (4, "shut")], ch=[4], cs=4),
    dict(k="cech2", n="Warsztat Ludwika", x=51, yb=65, w=6, roof="shingle_dark", wall="logs", door=3, di=6, win=[(1, "wood"), (4, "wood_lit")], ch=[1], cs=5, lean="left", fill="logs"),
    dict(k="cech3", n="Warsztat Jasia", x=58, yb=65, w=6, roof="shingle_dark", wall="grey_logs", door=2, di=0, win=[(0, "board"), (4, "wood")], ch=[4], cs=3),
    dict(k="spichlerz", n="Spichlerz miejski", x=65, yb=65, w=6, roof="planks", wall="dark_boards", door=2, di=0, win=[(1, "board"), (5, "board")], ch=[], cs=3,
         closed="Spichlerz miejski jest zamknięty na kłódkę."),
]
SIGN_CELL = {}


class Build(WS.WorldBuild):
    def __init__(self):
        WS.WorldBuild.__init__(self, MAP_ID, "Miasteczko", NOTE, seed=220)
        self.res_spots = {}

    # ------------------------------------------------------------------------------------------------ ground
    def ground(self):
        mp = self.mp
        mp.kind(0, mp.all, GRASS)
        # ---- the bed floor
        g = set()
        g = rect(0, BED_ROWS[0], W - 1, BED_ROWS[1])
        self.bed = g
        self.bed_south = lambda x: BED_ROWS[1]
        # ---- roads and lanes (straight, no wobble)
        roads = set(lane([(-0.5, 41.5), (79.5, 41.5)], 2.8, 0.0, 11))
        def Ls(pts, w, seed=0):
            roads.update(lane(smooth_polyline(pts, 1.0), w, 0.0, seed))
        Ls([(6, 27), (74, 27)], 2.0)                         # back lane of the north
        Ls([(12, 27), (12, 39)], 2.0); Ls([(38, 27), (38, 39)], 2.0); Ls([(56, 27), (56, 39)], 2.0)   # lanes down to the road
        Ls([(20.5, 27), (20.5, 14)], 2.0)                    # up to the cemetery gate
        Ls([(14.5, 43), (14.5, 67)], 2.0); Ls([(32, 43), (32, 67)], 2.0); Ls([(48, 46), (48, 67)], 2.0); Ls([(72, 43), (72, 67)], 2.0)
        Ls([(6, 68), (74, 68)], 2.0)                         # the south lane
        roads = smooth(roads, 1)
        self.hard = set(roads) - g
        # the market square: earth ring, cobbles inside
        plaza = blob(47.5, 42.5, 12.5, 4.6, 31, 0.0) - g
        cob = blob(47.5, 42.5, 10.4, 3.4, 32, 0.0) - g
        self.plaza, self.cobble = plaza, cob
        roads |= plaza
        roads -= g
        self.roads = roads
        mp.kind(0, roads, EARTH)
        for c in roads: mp.layers[1].pop(c, None)
        mp.kind(0, cob, COBBLE)
        for c in roads:
            if c not in cob and noise(c[0], c[1], 44) > 0.965: mp.layers[1][c] = ("k", PEBBLES)
        # ---- the bed: earth, dry patches, pebbles
        mp.kind(0, g, 24)
        for c in g: mp.layers[1].pop(c, None)
        water = {(x, y) for x in range(STREAM_X0, W) for y in (50, 51)}
        for (x, y) in LEAT: water.add((x, y))
        self.water = water
        dry = smooth({c for c in g if lowfreq(c[0], c[1], 77, 4.0) > 0.60}, 1)
        for c in dry:
            if c not in water: mp.layers[1][c] = ("k", DRY)
        edge = {c for c in g if any((c[0] + dx, c[1] + dy) not in g for dx in (-1, 0, 1) for dy in (-1, 0, 1))}
        for c in edge:
            if noise(c[0], c[1], 42) < 0.3 and c not in water: mp.layers[1][c] = ("k", PEBBLES)
        rnd = random.Random(5)
        interior = sorted(c for c in g if c not in edge and 6 < c[0] < 60 and c not in water)
        for i in range(6):
            cx, cy = rnd.choice(interior)
            for c in blob(cx + 0.5, cy + 0.5, rnd.uniform(1.2, 2.0), rnd.uniform(0.7, 1.1), 90 + i, 0.1):
                if c in g and c not in edge and c not in water: mp.layers[0][c] = ("k", MUD); mp.layers[1].pop(c, None)
        ring = {(x + dx, y + dy) for (x, y) in g for dx in (-1, 0, 1) for dy in (-1, 0, 1)} - g
        for c in ring:
            if c in roads or c in self.plaza: continue
            if noise(c[0], c[1], 43) < 0.14: mp.layers[1][c] = ("k", PEBBLES)

    def leat_water(self):
        """the trickle and the leat: shallow water (A1 kind 2, walkable); wiped last so nothing paints over it"""
        mp = self.mp
        for c in self.water:
            mp.layers[0][c] = ("k", WATER)
            if not (71 <= c[0] <= 73): 
                for z in (1, 2, 3): mp.layers[z].pop(c, None)
            self.occ.add(c)
        # two plank footbridges over the leat
        for c in ((62, 45), (56, 45)):
            mp.layers[1][c] = ("k", PLANKS)
        # a few flat stones where the stream is let into the leat
        for c in ((65, 50), (65, 51), (64, 51)):
            self.clump("stones", *c) if c not in self.occ else None

    # ------------------------------------------------------------------------------------------------ buildings
    def building(self, d):
        mp = self.mp
        rh, wh = d.get("rh", 3), d.get("wh", 2)
        x, w = d["x"], d["w"]
        y = d["yb"] - rh - wh + 1
        d["y"] = y
        rec = mp.house(d["k"], d["n"], x, y, w, rh, wh, d["roof"], d["wall"], d["door"], door_pic=("!Fantasy_door1", d.get("di", 2)),
                       windows=d.get("win", ()), chimney=None, ivy=d.get("ivy", ()), lean=d.get("lean"), lean_fill=d.get("fill"),
                       dormer=d.get("dormer"), interior=None, closed_text=d.get("closed", "Zamknięte. Nikogo nie ma w domu."))
        ev = rec["event"]
        ev["name"] = "Drzwi: " + d["n"]
        ev["note"] = "<Town:door=%s>" % d["k"]
        for col in d.get("ch", []): self.chimney(x, y, col, d.get("cs", 3))
        r = rec["rect"]
        if d.get("lean"):
            lx = x + w if d["lean"] == "right" else x - 1
            for j in range(4): mp.region[(lx, r[3] - 3 + j)] = 2
        x0 = r[0] - (1 if d.get("lean") == "left" else 0)
        x1 = r[2] + (1 if d.get("lean") == "right" else 0)
        self.occ |= rect(x0, y - 1, x1, r[3]) | {(rec["door"][0], rec["door"][1] + 1)}
        self.huts[d["k"]] = rec
        mp.spot(d["k"] + "_drzwi", rec["door"][0], rec["door"][1] + 1, 2)
        if d.get("tavern"): self.tavern_extra(d, rec)
        if d.get("chapel"): self.chapel_extra(d, rec)
        if d.get("belfry"): self.belfry_extra(d, rec)
        if d.get("sign"):
            ch, di, pat = d["sign"]
            dx, yb = rec["door"]
            sx = dx + (1 if dx + 1 <= r[2] and (dx + 1) not in [x + c for c in (cc for cc, _ in d.get("win", ()))] else -1)
            sx = max(r[0], min(r[2], sx))
            mp.picture(sx, yb - 1, "!Signs", ch, 4 if di == 4 else 2, pat, name="Szyld: " + d["n"], priority=2, through=True)
        return rec

    def block(self, x, yb, w, rh, wh, roof, wall):
        """a plain tile block (roof over wall, no door event): a wing of a bigger building"""
        mp = self.mp
        y = yb - rh - wh + 1
        mp.kind(0, rect(x, y, x + w - 1, y + rh - 1), P.ROOF.get(roof, roof))
        mp.kind(0, rect(x, y + rh, x + w - 1, yb), P.WALL.get(wall, wall))
        for c in rect(x, y, x + w - 1, yb): mp.layers[1].pop(c, None)
        for yy in range(y + 1, yb + 1):
            if (x + w, yy) not in mp.shadow: mp.shadow[(x + w, yy)] = 4 if yy == y + 1 else 5
        self.occ |= rect(x, y - 1, x + w - 1, yb)
        return y

    def tavern_extra(self, d, rec):
        """the landmark: a taller centre block (golden thatch, a dormer) between two lower wings, a plaster upper floor over log walls,
        lit windows, a porch with a plank deck, posts and a canopy, two fire lanterns at the door, a big hanging sign, a gable cross-beam"""
        mp = self.mp
        yb = d["yb"]
        door_x = rec["door"][0]
        wl = self.block(40, yb, 5, 4, 4, "straw", "logs")
        wr = self.block(50, yb, 5, 4, 4, "straw", "logs")
        self.chimney(40, wl, 1, 3); self.chimney(50, wr, 3, 3)
        mp.picture(42, wl + 1, "!Roof_Windows", 1, 2, 0, name="Okienko w dachu", priority=1)
        mp.picture(52, wr + 1, "!Roof_Windows", 1, 2, 0, name="Okienko w dachu", priority=1)
        for xx in (45, 50):                               # no shadows between the blocks (only the building's east side keeps its eaves shadow)
            for yy in range(yb - 9, yb + 1): mp.shadow.pop((xx, yy), None)
        wt = yb - 3                                       # first wall row (upper floor rows wt, wt+1; ground floor rows wt+2, wt+3)
        for (x0, x1) in ((40, 44), (45, 49), (50, 54)):
            for c in rect(x0, wt, x1, wt + 1): mp.layers[0][c] = ("k", P.WALL["plaster"])
        # upper-floor windows (lit), an arched one over the door
        for cx in (41, 43, 51, 53, 45, 49):   # (the middle bay stays plain under the canopy)
            mp.tl(cx, wt, B(2, 0), 2); mp.tl(cx, wt + 1, B(2, 1), 2)
        # ground-floor windows
        for cx in (40, 42, 44, 52, 54):
            mp.tl(cx, yb - 1, B(1, 0), 2); mp.tl(cx, yb, B(1, 1), 2)
        # the porch canopy (a lean roof over the deck) on two posts; the door stays free below it
        canopy = rect(44, yb - 2, 50, yb - 1)
        mp.kind(0, canopy, P.ROOF["planks"])
        for c in canopy:
            for z in (2, 3): mp.layers[z].pop(c, None)
        for px in (44, 50):
            for z in (2, 3): mp.layers[z].pop((px, yb), None)
            mp.tl(px, yb, C(8, 14), 3); mp.tl(px, yb + 1, C(8, 15), 2)
            mp.region[(px, yb + 1)] = 2
            self.occ.add((px, yb + 1))
        deck = rect(44, yb + 1, 50, yb + 2)
        mp.kind(1, deck, PLANKS)
        for c in deck: self.roads.discard(c)
        self.occ |= deck - {(door_x, yb + 1)}
        # two fire lanterns on brackets beside the door
        for lx in (door_x - 1, door_x + 1):
            mp.light(lx, yb, "!Decoration", 7, 2, 0, "Latarnia przy drzwiach tawerny", "<Light:200,120,60,26><LightFlicker:0.12>", priority=2, through=True)
        # the big hanging sign (a 2x copy of the tavern mug sign, own picture) on the left wing
        mp.picture(42, yb, "!$Miasteczko_Szyld", 0, 2, 0, name="Szyld: Tawerna", priority=2, through=True)
        mp.spot("tawerna_szyld", 42, yb + 1, 2)

    def chapel_extra(self, d, rec):
        """arched coloured windows, a cross on the roof, a cobbled forecourt with flower beds"""
        mp = self.mp
        x, w, y = d["x"], d["w"], d["y"]
        wt = y + d["rh"]
        for c in (1, 5):
            mp.layers[2].pop((x + c, wt), None); mp.layers[2].pop((x + c, wt + 1), None)
            mp.tl(x + c, wt, B(6, 8), 2); mp.tl(x + c, wt + 1, B(6, 9), 2)
        # arched coloured window over the door, in the middle of the front
        cx = x + d["door"]
        mp.tl(cx, wt, B(5, 8), 2); mp.tl(cx, wt + 1, B(5, 9), 2)
        # the cross on the ridge (the grave-cross tile, tall)
        mp.tl(cx, y - 1, C(11, 10), 3); mp.tl(cx, y, C(11, 11), 3)
        self.occ |= {(cx, y - 1)}
        # forecourt: cobbles before the door, flowers beside
        yb = d["yb"]
        fc = rect(cx - 1, yb + 1, cx + 1, yb + 2)
        mp.kind(0, fc, COBBLE)
        for c in fc: mp.layers[1].pop(c, None); self.roads.add(c)
        for (fx, fy) in ((x - 1, yb + 1), (x + w, yb + 1), (x + 1, yb + 1), (x + w - 2, yb + 1)):
            if self.free([(fx, fy)]): mp.clump(("white_fl", "white_fl_b")[(fx + fy) % 2], fx, fy); self.occ.add((fx, fy))

    def belfry_extra(self, d, rec):
        """the bell tower: a stone base with the door and, on top, the open belfry with its bell under a slate roof (Town_Props bell_tower)"""
        x, w, y = d["x"], d["w"], d["y"]
        cx = x + 1
        self.mp.town_prop("bell_tower", cx, y - 1, label="Dzwon na dzwonnicy")
        self.occ |= rect(x, y - 6, x + w - 1, y - 1)

    def chimney(self, x, y, col, style):
        mp = self.mp
        cx = x + col
        mp.tl(cx, y, B(style, 10), 3); mp.tl(cx, y + 1, B(style, 11), 3)
        mp.picture(cx, y, "!Fantasy_chimney", 0, 2, (cx + y) % 3, name="Dym z komina", priority=2, through=True, step=True)

    def lamp2(self, x, y, name="Latarnia"):
        """a wooden lantern post whose upper cells may stand before a wall (only the foot cell must be free); fire only"""
        mp = self.mp
        if not self.free([(x, y)], allow_road=True) or (x, y - 1) in mp.layers[3] or (x, y - 2) in mp.layers[3]:
            self.log.append("skip lamp %d,%d" % (x, y)); return
        mp.tl(x, y - 2, C(8, 13), 3); mp.tl(x, y - 1, C(8, 14), 3); mp.tl(x, y, C(8, 15), 2)
        mp.light(x, y - 2, "!Decoration", 7, 2, 0, name, "<Light:150,90,62,24><LightWhen:night>", priority=2, through=True)
        mp.region[(x, y)] = 2
        self.occ.add((x, y))

    # ------------------------------------------------------------------------------------------------ places
    def tavern_yard(self):
        mp = self.mp
        # the board for the contracts, right of the porch: Map001's real board (picture + <Tavern:board> event)
        src = json.load(open(ROOT + "data/Map001.json", encoding="utf-8"))
        bx, by = 52, 38
        for e in src["events"]:
            if e and e["id"] in (19, 21):
                ne = {"name": e["name"], "note": e["note"], "pages": copy.deepcopy(e["pages"])}
                mp.add(bx, by, ne, [(bx - 1, by), (bx + 1, by)])
        self.occ |= rect(bx - 1, by - 2, bx + 1, by)
        mp.spot("tablica_zlecen", bx, by + 1, 8)
        mp.spot("plac_tablica", bx, by + 1, 8)
        self.lamp2(39, 39, "Latarnia przy tawernie")
        mp.spot("tawerna_lawa", 41, 39, 6)
        mp.spot("tawerna_podworze", 47, 39, 2)
        # ---- the stable yard: fenced packed earth, the stable on its north side, a trough and hay
        ring = {c for c in rect(56, 28, 67, 39) if c[0] in (56, 67) or c[1] in (28, 39)} - {(61, 39), (62, 39), (63, 39)}
        sb = self.huts["stajnia"]["rect"]
        for c in rect(57, 29, 66, 38) - rect(sb[0], sb[1], sb[2], sb[3] + 1):
            self.mp.layers[0][c] = ("k", DIRT); self.mp.layers[1].pop(c, None)
        self.fence(ring, force=True)
        self.occ |= ring
        self.prop("barrel_water", 65, 37, label="Poidło dla koni")
        self.thing("cart_hay", 58, 38, allow_road=True)
        mp.spot("stajnia_wybieg", 62, 35, 2); mp.spot("stajnia_woz", 59, 36, 2)
        self.path([(61, 34), (62, 37), (62, 40)], 1.6, 40)
        mp.region[(62, 39)] = 0

    def market(self):
        mp = self.mp
        wx, wy = WELL
        # the town well, as on the old Map008 (C 8..9, 6..9; the two lower rows are blocked, the events give the ration)
        mp.piece("C", 8, 6, 2, 4, wx, wy - 3, 3)
        src = json.load(open(ROOT + "data/Map008.json", encoding="utf-8"))
        for e in src["events"]:
            if e and e["id"] in (241, 242):
                ne = {"name": e["name"], "note": e["note"], "pages": copy.deepcopy(e["pages"])}
                mp.add(wx + (e["x"] - 51), wy, ne)
        self.occ |= rect(wx - 1, wy - 3, wx + 2, wy)
        # two stalls west of the well (Agata's and one more), benches on the square's north side, lamps
        self.prop("stall_orange", 40, 45, label="Stragan Agaty")
        self.prop("stall_purple", 44, 45, label="Stragan")
        self.lamp2(38, 44, "Latarnia na rynku"); self.lamp2(57, 44, "Latarnia na rynku")
        mp.spot("studnia_rynek", 49, 45, 6); mp.spot("plac_studnia", 49, 44, 8); mp.spot("rynek_srodek", 47, 43, 2)
        mp.spot("rynek_lawka", 54, 43, 2); mp.spot("rynek_rog", 57, 41, 2)
        mp.spot("stragan1", 40, 44, 2); mp.spot("stragan2", 44, 44, 2)
        for i, x in enumerate((49, 48, 47, 46)): mp.spot("kolejka_%d" % (i + 1), x, 44 if i % 2 else 45, 6)

    def chapel(self):
        mp = self.mp
        # cemetery: fenced yard behind the chapel, a gate in its south side, a path from the gate, neat rows of graves, a tree, a bench
        ring = {c for c in rect(5, 9, 26, 15) if c[0] in (5, 26) or c[1] in (9, 15)} - {(20, 15), (21, 15)}
        self.fence(ring, force=True)
        self.occ |= ring | rect(5, 9, 26, 10) | rect(6, 12, 21, 13) | rect(20, 12, 21, 16)
        self.meadow |= rect(5, 9, 26, 15)
        for c in rect(20, 12, 21, 16) | rect(6, 12, 21, 13):
            mp.layers[0][c] = ("k", EARTH); mp.layers[1].pop(c, None)
        names = ["grave_cross_fl", "grave_cross", "grave_stone", "grave_cross", "grave_stone", "grave_cross"]
        for gy in (11, 14):
            for k, gx in enumerate(range(6, 19, 2)):
                self.prop(names[(k + gy) % 6], gx, gy, label="Grób")
        self.occ |= rect(23, 11, 25, 14)
        mp.tree(24, 14, "leafy", name="Drzewo na cmentarzu")
        self.thing("log_bench", 22, 11)
        mp.spot("cmentarz_brama", 20, 16, 8); mp.spot("cmentarz", 14, 12, 2); mp.spot("cmentarz_lawka", 22, 12, 2)
        mp.spot("kaplica_lawka", 8, 26, 2)
        self.thing("log_bench", 7, 25); self.thing("log_bench", 13, 25)
        mp.spot("dzwonnica_podstawa", 17, 25, 2)
        # the gravedigger's yard: a block, a stack of firewood, a wheelbarrow-like cart
        self.thing("chopping_block", 28, 24); self.thing("logs_small", 29, 24)

    def yards(self):
        mp = self.mp
        # ---- vegetable beds behind the houses of row A (fenced, a gate toward the lane)
        for (gx0, gy0, gx1, gy1) in ((5, 29, 8, 30), (15, 29, 18, 30), (21, 29, 26, 30), (69, 29, 74, 30)):
            self.garden(gx0, gy0, gx1, gy1)
        # ---- the smithy's yard: forge, grindstone, anvil, woodpile
        mp.picture(30, 39, "!$Pod_Piec", 0, 2, 0, name="Palenisko kuźni", priority=1,
                   note="<Occupy:left=1,right=1,up=1><Light:200,100,45,14><LightFlicker:0.15>")
        mp.lights.append({"name": "Palenisko kuźni", "x": 30, "y": 39, "note": "<Light:200,100,45,14>"})
        self.occ |= rect(29, 38, 31, 39)
        self.prop("anvil", 32, 39, label="Kowadło")
        self.thing("grindstone", 28, 39)
        mp.spot("kowal_praca", 33, 39, 6)
        # ---- the brewery: barrels and a cart before the door, a lamp
        self.thing("cart_barrels", 65, 25)
        # ---- carpenter: barrels, logs and a bench
        # ---- town hall steps and a bench
        # ---- bakery: bread cart
        self.thing("log_bench", 62, 25)
        # ---- back yards of the north: vegetable beds with a gate toward the houses, woodpiles, benches, a pear tree already stands there
        for (gx0, gy0, gx1, gy1) in ((51, 13, 56, 14), (60, 13, 65, 14), (30, 13, 35, 14), (39, 11, 44, 12)):
            self.garden(gx0, gy0, gx1, gy1, "s")
        self.thing("firewood", 66, 17); self.thing("logs_small", 69, 17); self.thing("firewood", 48, 17); self.thing("woodshed", 73, 18)
        self.thing("log_bench", 57, 17); self.thing("log_bench", 33, 18); self.thing("chopping_block", 51, 17)

    def garden(self, x0, y0, x1, y1, gate_side="n"):
        mp = self.mp
        ring = rect(x0 - 1, y0 - 1, x1 + 1, y1 + 1)
        if not self.free(list(ring)): self.log.append("skip garden %d,%d" % (x0, y0)); return
        soil = rect(x0, y0, x1, y1)
        for c in soil: mp.layers[0][c] = ("k", EARTH); mp.layers[1].pop(c, None)
        for x in range(x0, x1 + 1):
            mp.tl(x, y0, C(5 + (x + y0) % 3, 2), 2)
            mp.tl(x, y1, C(5 + (x + y0 + 1) % 3, 3), 2)
        gy = y0 - 1 if gate_side == "n" else y1 + 1
        gate = {(x0 + 2, gy), (x0 + 3, gy)}
        self.fence(ring - soil - gate, force=True)
        self.occ |= ring

    def south_yards(self):
        mp = self.mp
        H_ = {d["k"]: d for d in BUILD}
        # woodpiles, racks, barrels before the workshops (front row 66 and the sides)
        self.thing("grindstone", 41, 65)
        self.thing("barrel", 7, 65)
        self.thing("barrels2", 29, 65)
        # a stack of long logs by the carpenter, a fenced timber yard south of the lane
        yard = rect(16, 70, 30, 72)
        ring = {c for c in rect(16, 70, 30, 72) if c[1] in (70,) or c[0] in (16, 30)} - {(22, 70), (23, 70)}
        self.thing("firewood", 20, 72); self.thing("logs_small", 24, 72); self.thing("log_v", 26, 72)
        self.thing("firewood", 38, 72); self.thing("woodshed", 56, 72)
        for (gx0, gy0, gx1, gy1) in ((9, 70, 13, 71), (51, 70, 55, 71), (62, 70, 66, 71)):
            self.garden(gx0, gy0, gx1, gy1, "n")
        self.thing("log_bench", 34, 70); self.thing("firewood", 44, 72); self.thing("hay", 60, 72); self.thing("chopping_block", 73, 71)
        self.thing("log_bench", 48, 70); self.thing("barrel", 6, 71)
        self.thing("hide_rack", 9, 70); self.thing("hide_rack_b", 10, 70)

    # ------------------------------------------------------------------------------------------------ resident spots
    def resident_spots(self):
        mp = self.mp
        hs = self.huts
        def front(k):
            r = hs[k]; return (r["front"][0], r["front"][1])
        def sp(key, x, y, d=2):
            mp.spot(key, x, y, d)
        # homes (door fronts) and workplaces
        T = {  # resident: (home, work)
            "karczmarz": ("tawerna", (45, 38, 2)), "melia": ("tawerna", (44, 39, 2)), "ozzy": ("tawerna", (41, 39, 6)),
            "grum": ("tawerna", (53, 39, 4)), "kucharka": ("tawerna", (40, 38, 2)), "franek": ("tawerna", (50, 39, 8)),
            "rzadca": ("ratusz", (43, 25, 2)), "pisarz": ("ratusz", (41, 25, 2)),
            "studzienny": ("budka", (49, 47, 6)), "kleofas": ("kaplica", (10, 25, 2)), "grabarz": ("grabarz", (14, 13, 2)),
            "tadek": ("kuznia", (33, 39, 6)), "piekarz": ("piekarnia", (61, 25, 2)), "baltazar": ("kantor", (54, 25, 2)),
            "walenty": ("walenty", (4, 36, 4)), "piwowar": ("browar", (71, 25, 2)), "leon": ("ciesla", (21, 66, 2)),
            "dorota": ("dom3", (15, 39, 2)), "agata": (None, (43, 50, 2)), "waclaw": ("dom8", (11, 66, 2)),
            "wdowa": ("dom4", (24, 39, 2)), "staruszek": ("dom7", (71, 39, 2)), "staruszka": ("dom7", (72, 39, 2)),
            "ostap": ("cech1", (38, 66, 2)), "ludwik": ("cech2", (54, 66, 2)), "jas": ("cech3", (60, 66, 2)),
        }
        for r, (home, work) in T.items():
            if home: x, y = front(home); sp(r + "_dom", x, y, 2)
            sp(r + "_praca", *work)

    # ------------------------------------------------------------------------------------------------ nature
    def trees_and_life(self):
        mp = self.mp
        self.trees = []
        inner = [(31, 14, "leafy"), (34, 22, "leafy"), (60, 12, "pine_b"), (70, 14, "leafy"), (63, 22, "leafy"), (36, 12, "pine"), (75, 22, "pine"),
                 (28, 18, "leafy"), (54, 14, "leafy"), (45, 12, "pine"), (66, 17, "pine_b"), (30, 29, "leafy"), (59, 29, "leafy"), (76, 41, "pine"),
                 (8, 58, "leafy"), (24, 58, "leafy"), (6, 63, "pine"), (30, 72, "pine"), (46, 71, "leafy"), (56, 71, "pine_b"), (73, 71, "leafy"),
                 (64, 57, "leafy"), (70, 57, "pine"), (12, 71, "leafy"), (40, 70, "leafy"), (68, 70, "pine_b"), (4, 33, "pine"), (74, 56, "pine"),
                 (20, 56, "leafy"), (36, 58, "leafy"), (44, 59, "pine_b"), (52, 58, "leafy"), (60, 58, "pine"), (28, 57, "pine_b"), (66, 58, "leafy"),
                 (33, 20, "pine_b"), (52, 16, "leafy"), (62, 16, "pine"), (74, 14, "leafy"), (40, 15, "leafy"), (9, 22, "leafy")]
        for (x, y, k) in inner:
            cells = [(x + dx, y + dy) for dx in (-1, 0, 1) for dy in (-3, -2, -1, 0)]
            if self.free(cells):
                mp.tree(x, y, k, name="Drzewo (ozdobne)"); self.occ.add((x, y)); self.trees.append((x, y))
        self.foot()

    def resources_here(self):
        """a few real gatherables at the edges of the town (stumps, small rocks, bare bushes, one pear tree behind the town hall)"""
        self.used = self.resources(
            stumps=((24, 17), (30, 20), (62, 18), (74, 18), (9, 71), (52, 70), (73, 60), (22, 60)),
            rocks=((34, 16, "!$Rock_Mossy"), (66, 14, "!$Rock_Flat"), (6, 56, "!$Rock_Pile"), (44, 71, "!$Rock_Chunk")),
            bushes=[(x, 10, ("!$Bush_Bare_A", "!$Bush_Bare_B")[i % 2]) for i, x in enumerate((30, 36, 44, 52, 60, 68))],
            trees=((58, 17, "!$Tree_Pear"),), logs=())

    # ------------------------------------------------------------------------------------------------ build
    def build(self):
        mp = self.mp
        self.ground()
        self.mountains(((7, 37), (45, 46), (54, 72)), ())
        self.bank(FACES, RAMPS, BRIDGES)
        for (xa, xb, rim) in RAMPS:                                  # (the library's half-boulder stepping stones are blocked bottoms: not here)
            mp.layers[2].pop((xb, rim + 2), None)
        for d in BUILD: self.building(d)
        self.tavern_yard()
        self.market()
        self.chapel()
        self.yards()
        self.south_yards()
        self.door_paths()
        self.lamps()
        self.meadow |= rect(4, 7, 75, 11) | rect(4, 70, 75, 72) | rect(70, 7, 79, 39) | rect(70, 43, 79, 48) | rect(70, 53, 79, 72)
        self.earth_and_grass(seed=17, threshold=0.30)
        for c in rect(75, 53, 79, 72):
            if mp.layers[0].get(c) == ("k", GRASS): mp.layers[0][c] = ("k", GRASS_LIGHT)
        self.trees_and_life()
        self.resources_here()
        self.life([(28, 9, 74, 16), (40, 28, 54, 29), (4, 56, 30, 60), (66, 54, 74, 60), (36, 70, 60, 72)], clusters=40)
        self.leat_water()
        self.seams()
        self.resident_spots()
        self.signposts()
        self.regions()
        return mp

    def seams(self):
        """SEAM B (west, x=0): Podgrodzie's x=79 column from szwy.json; SEAM C (east, x=79): Posiadlosc's x=0 column (Map221, read-only).
        The ground kinds are copied (autotile shapes are worked out again from the neighbours); things on the column are cleared."""
        mp = self.mp
        west = json.load(open(os.path.join(HERE, "..", "szwy.json"), encoding="utf-8"))["B"]["kolumna_east"]["kafle_warstwy_0_3_na_wiersz"]
        m221 = json.load(open(os.path.join(HERE, "..", "posiadlosc", "staging", "Map221.json"), encoding="utf-8"))
        w2, h2, d2 = m221["width"], m221["height"], m221["data"]
        east = [[d2[(z * h2 + y) * w2 + 0] for z in range(4)] for y in range(h2)]
        for x, col in ((0, west), (W - 1, east)):
            for y in range(H):
                for z in range(4):
                    tid = col[y][z]
                    c = (x, y)
                    if tid == 0: mp.layers[z].pop(c, None)
                    elif tid >= 2048 and z < 2: mp.layers[z][c] = ("k", (tid - 2048) // 48)
                    else: mp.layers[z][c] = ("t", tid)
                self.occ.add((x, y))
        # the east ground continues the neighbour's kinds a few cells inwards (so the autotile shapes at x=79 come out as theirs)
        for y in range(H):
            t0 = east[y][0]
            if t0 >= 2048 and (t0 - 2048) // 48 in (GRASS, GRASS_LIGHT):
                k = (t0 - 2048) // 48
                # a ragged, soft inner edge of the neighbour's light meadow
                xs = 77 - int(5 * lowfreq(y, 3, 55, 4.0)) if k == GRASS_LIGHT else 77
                for x in range(xs, W - 1):
                    if mp.layers[0].get((x, y)) in (("k", GRASS), ("k", GRASS_LIGHT)): mp.layers[0][(x, y)] = ("k", k)

    def door_paths(self):
        """worn paths from every door to the nearest road or lane"""
        for k, rec in self.huts.items():
            fx, fy = rec["front"]
            if k in ("stajnia",): continue
            if fy <= 25: tgt = 26.5
            elif fy < 40: tgt = 40
            elif fy < 50: tgt = 44 if k == "budka" else 44
            else: tgt = 67
            if k == "budka": tgt = fy + 1.5
            bld = set()
            for r in self.huts.values(): bld |= rect(r["rect"][0], r["rect"][1], r["rect"][2], r["rect"][3])
            keep = {c: self.mp.layers[0].get(c) for c in bld | self.cobble}
            self.path([(fx, fy), (fx, (fy + tgt) / 2.0), (fx, tgt)], 1.6, 30 + (sum(map(ord, k)) % 20))
            for c, v in keep.items():
                if v is not None: self.mp.layers[0][c] = v

    def lamps(self):
        for (x, y) in ((8, 43), (22, 43), (35, 43), (60, 44), (66, 43), (70, 43), (30, 29), (45, 28), (8, 29), (20, 69), (40, 69), (64, 69), (75, 69)):
            self.lamp2(x, y)

    def signposts(self):
        self.sign(76, 43, "Drogowskaz", "Na wschód: dwór Lorda i góry.", "Na zachód: rynek, tawerna i kaplica.")
        self.sign(5, 44, "Drogowskaz", "Na zachód: Podgrodzie i morze.", "Na wschód: rynek, tawerna i kaplica.")
        self.mp.spot("brama_wsch", 74, 41, 6); self.mp.spot("brama_zach", 5, 41, 4)
        self.mp.spot("plac", 47, 42, 2)


def make_sheets():
    """!$Miasteczko_Szyld: the tavern's mug sign of !Signs enlarged 2x (nearest) as a one-picture character sheet (96x96 frames)"""
    from PIL import Image
    out_dir = os.path.join(STAGING, "characters")
    os.makedirs(out_dir, exist_ok=True)
    sheet = Image.open(ROOT + "img/characters/!Signs.png").convert("RGBA")
    fr = sheet.crop((7 * 48, 0, 8 * 48, 48)).resize((96, 96), Image.NEAREST)
    out = Image.new("RGBA", (96 * 3, 96 * 4), (0, 0, 0, 0))
    for r in range(4):
        for c in range(3): out.alpha_composite(fr, (c * 96, r * 96))
    out.save(os.path.join(out_dir, "!$Miasteczko_Szyld.png"))


def main():
    make_sheets()
    b = Build()
    b.build()
    path, data, events, meta = b.write()
    print("Map%d Miasteczko: %dx%d, %d events -> %s" % (MAP_ID, W, H, len(events) - 1, os.path.relpath(path, ROOT)))
    W_ = W * H
    import_ = json.load(open(os.path.join(HERE, "..", "szwy.json"), encoding="utf-8"))["B"]["kolumna_east"]["kafle_warstwy_0_3_na_wiersz"]
    m221 = json.load(open(os.path.join(HERE, "..", "posiadlosc", "staging", "Map221.json"), encoding="utf-8"))
    bad = []
    for y in range(H):
        for z in range(4):
            if data[z * W_ + y * W] != import_[y][z]: bad.append(("W", y, z, data[z * W_ + y * W], import_[y][z]))
            if data[z * W_ + y * W + W - 1] != m221["data"][z * W_ + y * W]: bad.append(("E", y, z, data[z * W_ + y * W + W - 1], m221["data"][z * W_ + y * W]))
    print("seam mismatches:", len(bad), bad[:20])
    if b.log: print("skipped:", len(b.log)); [print("  ", l) for l in b.log[:60]]
    return b


if __name__ == "__main__":
    main()
