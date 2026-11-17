# -*- coding: utf-8 -*-
"""NOWE GORY 80x80 (nowy swiat, docs/NOWY_SWIAT/PLAN.md) - staging copy of map 222 (the end of the valley: river source, hermitage,
sealed cave, quarry, mine, mountain forest, hunting ground). Built on tools/nowy_swiat/wspolne.py.

python tools/nowy_swiat/gory/build.py
Output: tools/nowy_swiat/gory/staging/Map222.json (+ _meta, szew_D_gory.json = the real west edge column for the neighbour).
Nothing here writes data/ or js/ or szwy.json.

Plan (tiles; x east, y south):
  - mountains: north rock rows 0-9 (x >= 8; 0-6 at the west seam), south rows 71-79 (x >= 8), east wall x >= 74
  - west seam D (x=0): road 40-42, river (A1 kind 8, like Posiadlosc's x=79) 49-52, banks 48 / 53; open ground rows 7-72 (as Posiadlosc)
  - the river: from the source lake (NE, x 60-72, y 10-18; the spring pours out of the north rock) down a channel x 60-63 (two waterfalls over
    the ledges), then west along rows 49-52 to the seam
  - three levels, each a long ledge of stone face (A5 rim + 2 face rows) with ramps and stairs: T0 valley floor (y >= 38), T1 quarry shelf
    (y 27-35), T2 mine / hermitage plateau (y 10-24)
  - main road along rows 40-42, bridge over the channel at x 59-64, to the stairs at x 70-71; branch at x 34 up the ramp to the quarry,
    on up the ramp x 40-42 to the mine and the hermitage; footbridge to the lake
"""
import os, sys, json, copy, math, random

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
import wspolne as WS                                                        # noqa: E402
from wspolne import *                                                       # noqa: E402,F401,F403
from wspolne import P, N, B, C, D, E, noise, lowfreq, rect, lane, blob, smooth, smooth_polyline, A5, ROCK_FILL   # noqa: E402
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", "..")).replace("\\", "/") + "/"

W = H = 80
MAP_ID = 222
STAGING = os.path.join(HERE, "staging")
WS.configure(MAP_ID, STAGING)
NOTE = "<Clouds:on>\n<Farm:off>\n<Hunt:rabbit=3,deer=2,boar=1,wolf=3>\n<Bear:0.15>\n<Camp:off>\n<Poziom:5>"

WATER, WFALL = 8, 9            # A1 kinds: the water of Posiadlosc's river (seam D) and its waterfall (kind + 1)

# ------------------------------------------------------------------------------------------------ plan (tiles)
CH_X0, CH_X1 = 60, 63                          # the channel columns (4 wide, like the seam river)
RIVER_ROWS = (49, 52)
LAKE = (67.5, 13.8, 5.4, 4.2)
SPRING = (68, 8, 69, 9)                        # the waterfall out of the north rock into the lake
WF1 = (CH_X0, 25, CH_X1, 26)                   # T2 -> T1
WF2 = (CH_X0, 36, CH_X1, 37)                   # T1 -> T0
# the ledges: rim row r, stone face rows r+1, r+2 (A5 104-106 / 112-114 / 120-122); (x0, x1, rim, capL, capR)
FACES = [
    (30, 32, 35, True, True), (36, 59, 35, True, True), (64, 69, 35, True, True), (72, 73, 35, True, False),
    (28, 39, 24, True, True), (43, 59, 24, True, True), (64, 69, 24, True, True), (72, 73, 24, True, False),
]
RAMPS = [(33, 35, 35), (40, 42, 24)]           # earth slopes in the gaps of the faces (xa, xb, rim)
STAIRS = [(70, 71, 24), (70, 71, 35)]          # stone steps (xa, xb, rim)
BRIDGES = [(20, 48, 53), (46, 48, 53)]         # N-S footbridges over the river: centre x, first row, last row

HUTS = [
    dict(k="kamieniarz", n="Chata kamieniarza", x=46, y=28, w=6, roof="shingle_dark", wall="grey_logs", door=3, win=[(1, "wood"), (5, "wood")], ch=1, cs=4, di=2, lean="right", fill="logs"),
    dict(k="sztygar", n="Chata sztygara", x=43, y=12, w=5, roof="shingle", wall="logs", door=2, win=[(0, "wood_lit"), (4, "wood")], ch=3, cs=5, di=2, ivy=(1,)),
    dict(k="gornicy", n="Chata gornikow", x=29, y=17, w=7, roof="planks", wall="boards", door=3, win=[(1, "board"), (5, "wood"), (6, "tiny")], ch=5, cs=3, di=6),
    dict(k="ambrozy", n="Pustelnia brata Ambrozego", x=50, y=12, w=6, roof="thatch", wall="boards_stone", door=3, win=[(1, "tiny"), (5, "wood_lit")], ch=1, cs=5, di=0, ivy=(5,)),
]

SEAMS_STATIC = {"D": {"nazwa": "Posiadlosc | Gory", "mapy": [221, 222], "posiadlosc": "x=79", "gory": "x=0", "droga": [40, 42],
                      "rzeka": {"rodzaj": "pelna rzeka (woda, A1 kind 8)", "wiersze": [49, 52]}, "brzegi": [48, 53]}}


def dil(cells, r=1):
    return {(x + dx, y + dy) for (x, y) in cells for dx in range(-r, r + 1) for dy in range(-r, r + 1)}


class Build(WS.WorldBuild):
    def __init__(self):
        WS.WorldBuild.__init__(self, MAP_ID, "Góry", NOTE, seed=222)
        self.water, self.wfall = set(), set()

    # ------------------------------------------------------------------------------------------------ rock
    def rock_cell(self, x, y):
        mp = self.mp
        if not (0 <= x < W and 0 <= y < H): return
        mp.tile(0, x, y, A5(ROCK_FILL[int(noise(x, y, 77) * len(ROCK_FILL))]))
        for z in (1, 2, 3): mp.layers[z].pop((x, y), None)
        mp.region.pop((x, y), None)
        self.mass.add((x, y)); self.occ.add((x, y))

    def deepen(self):
        for x in range(W):
            n = 7 if x < 8 else 10
            s = 7 if x < 8 else 9
            for y in range(self.dN[x], n): self.rock_cell(x, y)
            for y in range(H - s, H - self.dS[x]): self.rock_cell(x, y)
            self.dN[x], self.dS[x] = n, s
        for y in range(7, 73):
            for x in range(74, W): self.rock_cell(x, y)
        for y in range(H): self.dE[y] = 6
        for cx in (40, 57):                       # piers holding the mine portal and the cave mouth
            for x in range(cx - 2, cx + 3):
                for y in range(0, 12): self.rock_cell(x, y)

    # ------------------------------------------------------------------------------------------------ ground, water
    def ground(self):
        mp = self.mp
        mp.kind(0, mp.all, GRASS)
        for c in smooth({c for c in mp.all if lowfreq(c[0], c[1], 5, 7.0) > 0.63}, 2): mp.layers[0][c] = ("k", GRASS_LIGHT)
        # seam D: Posiadlosc's x=79 has light grass at rows 18-23 and 53-59, grass elsewhere
        for c in rect(0, 18, 3, 23) | rect(0, 53, 3, 59): mp.layers[0][c] = ("k", GRASS_LIGHT)
        for c in rect(0, 24, 3, 52) | rect(0, 7, 3, 17) | rect(0, 60, 3, 72): mp.layers[0][c] = ("k", GRASS)
        lake = smooth(blob(*LAKE, 4, 0.10) & rect(60, 10, 72, 18), 1) | rect(67, 10, 70, 11)
        chan = rect(CH_X0, 13, CH_X1, 44) | self.meander()
        wf = set()
        for (x0, y0, x1, y1) in (SPRING, WF1, WF2): wf |= rect(x0, y0, x1, y1)
        self.wfall = wf
        self.water = (lake | chan) - wf
        self.bed = self.water | wf
        for c in self.water: mp.layers[0][c] = ("k", WATER); mp.layers[1].pop(c, None)
        for c in wf:
            mp.layers[0][c] = ("t", 2048 + WFALL * 48); mp.layers[1].pop(c, None)
            self.mass.discard(c); mp.region.pop(c, None)
        self.occ |= self.bed
        orig = mp.resolve
        def resolve():
            data = orig()
            cells = self.water | self.wfall
            for (x, y) in self.water:
                def same(dx, dy, x=x, y=y):
                    nx, ny = min(W - 1, max(0, x + dx)), min(H - 1, max(0, y + dy))
                    return (nx, ny) in cells
                data[y * W + x] = 2048 + WATER * 48 + N.floor_shape(same)
            for (x, y) in self.wfall:
                shape = (0 if (x - 1, y) in self.wfall else 1) | (0 if (x + 1, y) in self.wfall else 2)
                data[y * W + x] = 2048 + WFALL * 48 + shape
            return data
        mp.resolve = resolve
        banks = {c for c in dil(self.water | wf, 2) if c not in self.water and c[0] >= 4}
        self.BR = {}
        for bx in (20, 46):
            rows = [y for y in range(H) if any((x, y) in self.water for x in range(bx - 1, bx + 2))]
            self.BR[bx] = (min(rows) - 1, max(rows) + 1)
        for c in banks - self.bed - self.mass:
            if mp.layers[0].get(c, ("k", 0))[1] in (GRASS, GRASS_LIGHT):
                if noise(c[0], c[1], 5) < 0.55: mp.layers[0][c] = ("k", EARTH)
                if noise(c[0], c[1], 6) < 0.16: mp.layers[1][c] = ("k", PEBBLES)

    def meander(self):
        """the river below the channel: a long smooth curve west to the seam (rows 49-52 at x<=3), width 3-5, rounded bends (circles swept along the line)"""
        pts = [(62, 43), (61.7, 46), (58.5, 49.6), (52, 52.6), (44, 48.6), (36, 52.8), (28, 48.4), (20, 52.6), (12, 48.8), (6, 50.5), (3, 50.5), (-3, 50.5)]
        wk = [(62, 4), (58, 4.4), (52, 3.6), (44, 4.6), (36, 3.4), (28, 4.8), (20, 3.4), (12, 4.4), (6, 3.8), (3, 4), (0, 4)]
        def wf(x, y):
            if y < 46: return 4
            for (xa, wa), (xb, wb) in zip(wk, wk[1:]):
                if xb <= x <= xa: return wb + (wa - wb) * (x - xb) / float(xa - xb)
            return 4
        cells = set()
        for (cx, cy) in smooth_polyline(pts, 0.4):
            r = wf(cx, cy) / 2.0 - 0.05
            for y in range(int(cy - r - 1), int(cy + r + 2)):
                for x in range(int(cx - r - 1), int(cx + r + 2)):
                    if 0 <= x < W and 0 <= y < H and (x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= r * r: cells.add((x, y))
        keep = {c for c in cells if c[0] <= 3}
        cells = {c for c in smooth(cells - keep, 1) if c[0] > 3 and c[1] >= 44} | rect(0, 49, 3, 52)
        return cells

    def make_roads(self):
        mp = self.mp
        roads = set()
        def Ls(pts, w, seed=0):
            roads.update(lane(smooth_polyline(pts, 1.0), w, 0.0, seed))
        Ls([(-0.5, 41.5), (12, 41.5), (24, 40.8), (40, 40.6), (52, 40.8), (58, 41), (66, 41), (69, 39.5), (70.5, 38.5)], 2.8, 11)
        Ls([(34, 40), (34, 36), (34, 32), (36, 30.5)], 2.4, 12)
        Ls([(36, 30.5), (41, 29.5), (41, 24), (41, 18)], 2.0, 13)
        Ls([(41, 18), (41, 15), (42, 13.5)], 2.0, 14)
        Ls([(41, 18.5), (46, 18.5), (49, 18), (53, 17.5)], 1.8, 15)
        Ls([(46, 17), (46, 18.5)], 1.6, 16)
        Ls([(32, 22), (33, 20), (37, 18.5), (41, 18.5)], 1.6, 17)
        Ls([(53, 17.5), (56, 19), (66, 20.5), (70.5, 22), (70.5, 23)], 1.8, 18)
        Ls([(57, 12), (57, 14), (56, 17)], 1.4, 19)
        Ls([(66, 20.5), (66.5, 19.2)], 1.5, 20)
        Ls([(70.5, 27), (70.5, 34.5)], 2.0, 21)
        Ls([(47.5, 33.5), (47.5, 36)], 1.6, 22)
        Ls([(48, 33.5), (44, 33.2), (37, 32), (36, 30.5)], 1.6, 23)
        Ls([(39, 40.6), (39, 44), (46, self.BR[46][0] - 0.5)], 1.6, 24)
        Ls([(20, 41.5), (20, self.BR[20][0] - 0.5)], 1.6, 25)
        Ls([(20, self.BR[20][1] + 0.5), (20, 58)], 1.5, 26); Ls([(46, self.BR[46][1] + 0.5), (46, 58), (41, 62)], 1.5, 27)
        roads -= self.bed
        self.hard = set(roads)
        for (cx, cy, rx, ry, sd) in ((38, 31.5, 8.5, 2.6, 31), (40, 17.5, 8.0, 5.0, 32), (49, 18.0, 5.0, 2.0, 33), (47, 33.2, 4.0, 1.4, 34),
                                     (33, 38.6, 3.0, 1.2, 35), (68, 22, 3.5, 1.5, 36), (66, 41, 3.0, 1.5, 37)):
            roads |= blob(cx, cy, rx, ry, sd, 0.12)
        roads -= self.bed | self.mass
        self.roads = roads
        mp.kind(0, roads, EARTH)
        for c in roads:
            mp.layers[1].pop(c, None)
            if noise(c[0], c[1], 44) > 0.965: mp.layers[1][c] = ("k", PEBBLES)
        pit = smooth(blob(26, 31, 10, 3.6, 41, 0.2), 2) - self.bed - self.mass
        for c in pit:
            mp.layers[0][c] = ("k", EARTH); mp.layers[1].pop(c, None)
            if lowfreq(c[0], c[1], 43, 3.0) > 0.62: mp.layers[1][c] = ("k", 23)
        self.pit = pit

    def stairs(self, xa, xb, rim, style=32):
        mp = self.mp
        for x in range(xa, xb + 1):
            idx = 35 if xa == xb else (style if x == xa else style + 2 if x == xb else style + 1)
            for y in range(rim, rim + 3):
                mp.tile(0, x, y, A5(idx))
                for z in (1, 2, 3): mp.layers[z].pop((x, y), None)
                self.occ.add((x, y))
        self.roads -= rect(xa, rim, xb, rim + 2)

    def footbridge_ew(self, x0, x1, y0, y1):
        mp = self.mp
        deck = rect(x0, y0, x1, y1)
        mp.kind(1, deck, PLANKS)
        rails = (rect(CH_X0, y0 - 1, CH_X1, y0 - 1) | rect(CH_X0, y1 + 1, CH_X1, y1 + 1))
        for c in rails: mp.layers[1].pop(c, None)
        mp.kind(1, rails, FENCE)
        self.occ |= deck | rails
        self.roads -= deck
        self.hard -= deck

    def portal(self):
        mp = self.mp
        mp.picture(40, 11, "!$Kopalnia_Wejscie", 0, 2, 0, name="Drzwi: Kopalnia", priority=1, trigger=1, dfix=True,
                   cmds=P.popup_cmds("Sztolnia jest zamknięta na kłódkę. Sztygar nikogo nie wpuszcza."), note="<Town:door=kopalnia>")
        for y in (12, 13): mp.picture(40, y, "!$Kopalnia_Tor", 0, 2, 0, name="Tor z kopalni", priority=0, through=True)
        mp.picture(40, 14, "!$Kopalnia_Tor", 0, 2, 2, name="Tor z kopalni", priority=0, through=True)
        for x in range(34, 40): mp.picture(x, 14, "!$Kopalnia_Tor", 0, 2, 1, name="Tor z kopalni", priority=0, through=True)
        self.occ |= {(40, 11), (40, 12), (40, 13), (40, 14)} | {(x, 14) for x in range(34, 40)}
        self.thing("cart", 32, 14)
        self.roads -= {(40, 12), (40, 13), (40, 14)} | {(x, 14) for x in range(34, 40)}
        mp.spot("kopalnia_wejscie", 40, 15, 8)
        mp.picture(57, 11, "!$Mt_Cave", 0, 4, 0, name="Drzwi: Stara jaskinia", priority=1, trigger=1, dfix=True,
                   cmds=P.popup_cmds("Zamknięte. Wejście zawalone starymi głazami; gołymi rękami ich nie ruszysz."), note="<Town:door=jaskinia_serce>")
        self.occ |= {(57, 11)}
        mp.spot("jaskinia_wejscie", 57, 12, 8)

    def spring(self):
        mp = self.mp
        self.thing("cross_wreath", 67, 20, allow_road=True)
        self.say(67, 20, "Krzyż nad źródłem", "Prosty krzyż z drewna, wbity w ziemię nad samą wodą.", "Ktoś zawiązał na nim wyblakłą wstążkę.")
        mp.spot("zrodlo", 67, 21, 8)
        for (x, y) in ((64, 19), (65, 19), (69, 19), (71, 19), (72, 18), (73, 17), (73, 15)):
            if (x, y) not in self.occ and (x, y) not in self.water: mp.tl(x, y, D(10 + (x + y) % 2, 5), 2)

    def build(self):
        mp = self.mp
        self.mass = set()
        self.ground()
        self.mountains((), ())
        self.deepen()
        self.make_roads()
        for c in (rect(59, 10, 62, 12) | rect(71, 10, 73, 18)) - self.water: self.rock_cell(*c)      # shore pockets nobody could reach
        self.bank(FACES, RAMPS, [(bx, r0, r1) for bx, (r0, r1) in sorted(self.BR.items())])
        for (xa, xb, rim) in RAMPS:                      # (the library's two stepping stones on a ramp: one is cut off at its top)
            for c in ((xa, rim + 1), (xb, rim + 2)): mp.layers[2].pop(c, None)
        for (xa, xb, rim) in STAIRS: self.stairs(xa, xb, rim)
        self.footbridge_ew(59, 64, 19, 21)
        self.footbridge_ew(59, 64, 40, 42)
        for d in HUTS: self.hut(d)
        self.portal()
        self.spring()
        self.huts_surroundings()
        self.signs_and_lamps()
        self.resources_all()
        self.earth_and_grass(seed=9, threshold=0.34)
        for c in rect(0, 43, 1, 48) - self.water:          # seam D: Posiadlosc's x=79 is plain grass between the road and the river
            mp.layers[0][c] = ("k", GRASS); mp.layers[1].pop(c, None)
        self.forest_all()
        self.stumps_and_scrub()
        self.life([(5, 8, 26, 36), (20, 55, 44, 68), (52, 55, 72, 70), (65, 43, 72, 48), (28, 27, 33, 34), (4, 56, 18, 70)], clusters=70)
        self.spots()
        self.regions()
        return mp

    def huts_surroundings(self):
        H_ = {d["k"]: d for d in HUTS}
        d = H_["kamieniarz"]; x, y = d["x"], d["y"]
        self.thing("grindstone", x - 2, y + 5); self.thing("log_bench", x + 1, y + 6); self.thing("firewood", x - 5, y + 5)
        self.thing("wheel", x + 8, y + 4)
        d = H_["sztygar"]; x, y = d["x"], d["y"]
        self.thing("firewood", x - 3, y + 4); self.thing("barrel", x + 6, y + 4); self.thing("log_bench", x + 1, y + 6)
        d = H_["gornicy"]; x, y = d["x"], d["y"]
        self.thing("firewood", x - 1, y + 4); self.thing("log_bench", x + 8, y + 4)
        d = H_["ambrozy"]; x, y = d["x"], d["y"]
        self.thing("log_bench", x - 2, y + 4, allow_road=True)
        mp = self.mp
        soil = rect(x, y + 8, x + 3, y + 9)                      # a small herb bed south of the hut, fenced on the south and the ends
        for c in soil: mp.layers[0][c] = ("k", EARTH); mp.layers[1].pop(c, None); self.roads.discard(c)
        for xx in range(x, x + 4):
            mp.tl(xx, y + 8, C(5 + xx % 3, 2), 2); mp.tl(xx, y + 9, C(5 + (xx + 1) % 3, 3), 2)
        self.fence(rect(x - 1, y + 8, x + 4, y + 10) - soil, force=True)
        self.occ |= rect(x - 1, y + 8, x + 4, y + 10)
        self.thing("cross_flowers", x + 6, y + 6, allow_road=True)
        self.say(x + 6, y + 6, "Krzyż pustelnika", "Mały krzyż z ociosanych gałęzi, obsypany polnymi kwiatami.", "Brat Ambroży mówi, że leży pod nim ktoś, kto strzegł drogi przed nim.")
        self.thing("firewood", x + 7, y + 3)

    def signs_and_lamps(self):
        self.sign(37, 39, "Drogowskaz", "Na północ: kamieniołom i kopalnia.", "Na wschód: do źródła. Na zachód: dolina i Posiadłość.")
        self.sign(39, 22, "Drogowskaz", "W górę: kopalnia i pustelnia.")
        for (x, y, nm) in ((38, 17, "Latarnia kopaczy"), (42, 18, "Latarnia kopaczy"), (56, 19, "Latarnia pustelnika"), (37, 33, "Latarnia kamieniołomu"),
                           (52, 34, "Latarnia kamieniołomu"), (57, 38, "Latarnia przy moście"), (65, 43, "Latarnia przy moście"), (53, 40, "Latarnia")):
            self.lamp(x, y, nm)

    def resources_all(self):
        mp = self.mp
        self.placed = []
        def res(tmpl, x, y):
            fp_ = [(x, y)] + [(x + dx, y + dy) for dx, dy in N.EXTRA.get(tmpl, [])]
            if not self.free(fp_): return False
            if not mp.put(x, y, tmpl): return False
            self.occ.update(fp_); self.placed.append((tmpl, x, y)); return True
        def sow(cells, tmpls, n, gap, seed, margin=1):
            rnd = random.Random(seed)
            cs = sorted(cells); rnd.shuffle(cs); got = []
            for (x, y) in cs:
                if len(got) >= n: break
                if any(math.hypot(x - a, y - b) < gap for a, b in got): continue
                if margin > 0 and any(c in self.roads for c in dil([(x, y)], margin)): continue
                if res(rnd.choice(tmpls), x, y): got.append((x, y))
            return got
        small, big = N.ROCK_SMALL, N.ROCK_BIG
        ore = ["!$Rock_Ore_Iron", "!$Rock_Ore_Iron_Twin", "!$Rock_Ore_Iron_Cluster", "!$Rock_Ore_Iron_Jagged", "!$Rock_Ore_Iron_Chunk"]
        keepout = dil(self.roads, 1) | self.occ
        quarry = {c for c in (self.pit | rect(18, 27, 58, 34)) if c not in keepout and 28 <= c[1] <= 34}
        sow({c for c in quarry if c[0] <= 33}, small + big, 14, 2.8, 1)
        sow({c for c in quarry if 36 <= c[0] <= 58}, small + big, 8, 3.0, 2)
        sow({c for c in quarry if c[1] >= 32}, small, 4, 4.0, 3)
        sow({c for c in quarry if 18 <= c[0] <= 56 and c[1] <= 29}, ore, 4, 5.0, 4)
        t2 = {c for c in rect(28, 11, 73, 23) if c not in keepout}
        sow(t2, small + big, 8, 4.0, 5, 2)
        sow({c for c in t2 if c[0] >= 64}, ore, 2, 4.0, 6, 2)
        sow({c for c in rect(64, 27, 73, 34) if c not in keepout}, ore + small + big, 7, 3.0, 7, 2)
        sow({c for c in rect(64, 44, 73, 70) if c not in keepout}, ore + small, 9, 4.0, 8, 2)
        sow({c for c in rect(4, 8, 27, 36) if c not in keepout}, small + big, 10, 4.5, 9, 2)
        south = {c for c in rect(4, 55, 72, 70) if c not in keepout}
        sow(south, small + big, 12, 5.0, 10, 2)
        sow(south, ore, 3, 12.0, 11, 2)
        allg = {c for c in rect(4, 8, 72, 70) if c not in keepout}
        sow(allg, ["!$Bush_Bare_A", "!$Bush_Bare_B", "!$Bush_Bare_Tall", "!$Bush_Bare_Wide", "!$Bush_Bare_Thicket", "!$Bush_Bare_Vines"], 22, 5.0, 12, 2)
        sow({c for c in allg if c[1] > 54 or c[0] < 28}, ["!$Trunk_Dead", "tile678"], 5, 12.0, 13, 2)
        shore = {c for c in dil(self.water, 2) if c not in self.water and c not in keepout and c[0] >= 4}
        sow(shore, ["!$Rock_Mossy", "!$Rock_Flat", "!$Rock_Pile", "!$Rock_Chunk", "!$Rock_Mound", "!$Boulder_A"], 16, 4.0, 14, 1)
        for c in sorted(dil(self.water, 2) - self.water):
            if c[0] >= 4 and noise(c[0], c[1], 17) < 0.10: self.clump(("fern", "fern_b", "fern_c", "white_fl")[(c[0] + c[1]) % 4], *c)

    def forest_all(self):
        mp = self.mp
        busy = dil(self.roads, 1) | self.occ | self.bed | self.mass | set(mp.taken)
        busy |= {(x, y) for (x, y, e) in mp.events}
        busy |= dil(self.occ - self.mass - self.bed, 1)
        mp.keep_free |= busy
        glades = blob(16, 26, 8.5, 5.5, 71, 0.2) | blob(36, 62, 14, 4.5, 72, 0.2) | blob(68, 56, 4.5, 8, 73, 0.2) | blob(52, 44, 6, 2.2, 74, 0.2) \
            | blob(66, 31, 3.5, 3, 75, 0.2)
        mp.keep_free |= glades
        near_rock = self.distance(self.mass, 5)
        region = set()
        for c in mp.all:
            if c in busy or c in glades: continue
            x, y = c
            if not (3 <= x <= 73 and 8 <= y <= 71): continue
            d = near_rock.get(c, 6)
            v = lowfreq(x, y, 31, 5.0)
            if (d <= 4 and v > 0.18) or v > 0.34: region.add(c)
        region -= rect(0, 37, 79, 45) | dil(self.water, 3)
        spots = mp.forest_var(region, dense=1.8, sparse=3.0, avoid=(), small=0.10, seed=19)
        self.trees = list(spots)
        for c in spots: self.occ.add(c)
        self.foot()

    def spots(self):
        mp = self.mp
        s = {
            "kamieniarz_kamieniolom": (38, 31, 2), "kamieniarz_odpoczynek": (53, 31, 4),
            "sztygar_kopalnia": (40, 16, 8), "sztygar_obchod": (36, 15, 2),
            "gornicy_kopalnia": (41, 15, 8), "gornik_1_kopalnia": (39, 15, 8), "gornik_2_kopalnia": (42, 15, 8),
            "gornicy_posilek": (43, 18, 4), "gornicy_taweren": (34, 40, 2),
            "ambrozy_zrodlo": (66, 21, 8), "ambrozy_cmentarz": (54, 18, 2), "ambrozy_jaskinia": (57, 13, 8),
            "kamieniolom": (36, 31, 2), "wodospad_gorny": (61, 23, 8), "wodospad_dolny": (61, 34, 8), "most_drogowy": (62, 43, 2),
            "polowanie_polana": (16, 26, 2), "polowanie_poludnie": (36, 62, 2), "wejscie_zachod": (3, 41, 6), "rzeka_brzeg": (30, 47, 2),
        }
        for k, v in s.items(): mp.spot(k, v[0], v[1], v[2])


def main():
    b = Build()
    b.build()
    path, data, events, meta = b.write()
    print("Map%d Gory: %dx%d, %d events -> %s" % (MAP_ID, W, H, len(events) - 1, os.path.relpath(path, ROOT)))
    b.seam_report(os.path.join(STAGING, "szew_D_gory.json"), SEAMS_STATIC, {"D": ("west", 0)})
    if b.log: print("skipped:", len(b.log)); [print("  ", l) for l in b.log[:60]]
    return b


if __name__ == "__main__":
    main()
