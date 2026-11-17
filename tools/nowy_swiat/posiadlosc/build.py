# -*- coding: utf-8 -*-
"""NOWA POSIADLOSC LORDA 80x80 (nowy swiat, docs/NOWY_SWIAT/PLAN.md) - staging copy of map 221, built on tools/nowy_swiat/wspolne.py.

python tools/nowy_swiat/posiadlosc/build.py
Output: tools/nowy_swiat/posiadlosc/staging/Map221.json (+ _meta).  Renders: render.py.  Nothing here writes data/, js/ or szwy.json.

Plan (x east, y south; road rows 40-42 west-east, bed 49-52 with the trickle at rows 50-51 west of the dam, full river rows 49-52 at x=79):
  north of the road: the garden with the gardener's cottage and the orangery (x 4-25), the manor with its gated courtyard (x 27-53,
  rows 10-29), the servants' house, the stable and an orchard (x 54-77)
  east: the river comes in at x=79 and fills the RESERVOIR (x 56-77, y 47-66) held back by the dam (x 51-55, rows 45-57) with the sluice
  and a footbridge on top; the dam keeper's hut stands on the south bank, the hidden channel leaves the reservoir westward under bushes
  south-west: the Lord's forest (x 4-40, y 55-72) behind a wooden fence with a gate, signs and a hole (the poacher's way)."""
import os, sys, json, copy, math, random

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
import wspolne as WS                                                        # noqa: E402
from wspolne import P, N, B, C, D, E, noise, lowfreq, rect, lane, blob, smooth, smooth_polyline, A5   # noqa: E402
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = WS.ROOT

W = H = 80
MAP_ID = 221
STAGING = os.path.join(HERE, "staging")
WS.configure(MAP_ID, STAGING)
NOTE = "<Clouds:on>\n<Farm:off>\n<Hunt:rabbit=2,deer=1>"

GRASS, GRASS_L, EARTH, MUDK, HEDGE, FLOWERS_B, COBBLE, FENCE, FENCE_DARK, TUFTS = 16, 27, 17, 26, 20, 28, 40, 22, 38, 21
WATER_LAKE, WATER_TRICKLE, PLANKS_A1 = 8, 0, 2       # A1 kinds: 8 = teal water (blocked), 0 = light shallow water (blocked), 2 = wooden planks (walkable)
STONE_WALL, SLUICE = 91, 123                           # A4 wall kinds: dark stone, the barred grate

# ------------------------------------------------------------------------------------------------ plan
ROAD_Y = 41.5
BED = (49, 52)                    # bed rows (seam contract); banks 48 / 53; trickle rows 50-51
DAM_X0, DAM_X1 = 51, 55           # stone face x 51-52, deck x 53-54, lake-side rail x 55
DAM_Y0, DAM_Y1 = 45, 57
OX, OY = 20, 9                    # Map024's manor moved: its (10..30, 1..13) -> (30..50, 10..22)
COURT = (27, 22, 53, 29)          # fence ring of the courtyard (x0, y0, x1, y1); the gate gap in the south x 39-41
GATE_X = (39, 41)
GARDEN = (4, 11, 25, 37)          # hedge ring of the garden; gap in the south x 14-16
FOREST = (4, 55, 40)              # forest fence: west x, north y, east x (the mountains close it in the south)
FOREST_GATE = (28, 30)            # gap in the north side
HOLE = (62, 63)                   # gap in the west side (rows)

HUTS = [
    dict(k="ogrodnik", n="Chata ogrodnika", x=6, y=12, w=6, roof="shingle_brown", wall="logs", door=2, win=[(0, "wood"), (4, "wood_lit")], ch=4, cs=4, di=2, ivy=(5,)),
    dict(k="sluzba", n="Dom sluzby", x=56, y=12, w=7, roof="shingle", wall=77, door=3, win=[(1, "wood"), (5, "wood_lit")], ch=5, cs=4, di=2, ivy=(0,)),
    dict(k="stajnia", n="Stajnia", x=56, y=24, w=9, roof="planks_b", wall="dark_boards", door=4, win=[(1, "board"), (7, "board")], ch=7, cs=5, di=6, lean="right", fill="hay"),
    dict(k="wartownia", n="Wartownia przy bramie", x=47, y=25, w=5, roof="slate", wall="boards_stone", door=2, win=[(0, "tiny"), (4, "tiny")], ch=3, cs=5, di=6),
    dict(k="strazjazu", n="Chata straznika jazu", x=44, y=56, w=6, roof="shingle_dark", wall="grey_logs", door=2, win=[(0, "wood"), (4, "wood_lit")], ch=4, cs=3, di=2, ivy=(5,)),
]
HUT_H = 5


class Build(WS.WorldBuild):
    """Posiadlosc: everything generic is in wspolne.WorldBuild; this class holds the estate's plan"""

    def __init__(self):
        WS.WorldBuild.__init__(self, MAP_ID, "Posiadłość Lorda", NOTE, seed=221)
        self.water = set()
        self.mp.props["bgm"] = {"name": "Field1", "pan": 0, "pitch": 100, "volume": 90}

    # ------------------------------------------------------------------------------------------------ helpers
    def part(self, z, x0, y0, x1, y1, kind, wall):
        """a rectangle of one building autotile with its own edges (the editor's shapes of a lone block)"""
        mp = self.mp
        cells = rect(x0, y0, x1, y1)
        for (x, y) in cells:
            same = lambda dx, dy, x=x, y=y: (x + dx, y + dy) in cells
            mp.tile(z, x, y, 2048 + kind * 48 + (N.wall_shape(same) if wall else N.floor_shape(same)))
            if z == 0:
                for zz in (1, 2, 3): mp.layers[zz].pop((x, y), None)

    def ev(self, name, x, y, pages, note=""):
        return self.mp.add(x, y, {"name": name, "note": note, "pages": pages})

    def fence_k(self, cells, kind):
        cells = {c for c in cells if 0 <= c[0] < W and 0 <= c[1] < H}
        self.mp.kind(1, cells, kind)
        self.occ |= cells

    def ring(self, x0, y0, x1, y1):
        return {(x, y) for (x, y) in rect(x0, y0, x1, y1) if x in (x0, x1) or y in (y0, y1)}

    def tuft_ground(self, cells, kind):
        for c in cells: self.mp.layers[0][c] = ("k", kind)

    # ------------------------------------------------------------------------------------------------ ground
    def ground(self):
        mp = self.mp
        mp.kind(0, mp.all, GRASS)
        # lighter, mown grass round the manor and the garden; wild grass elsewhere
        for c in mp.all:
            x, y = c
            if lowfreq(x, y, 5, 7.0) > 0.60 and 8 < y < 72: mp.layers[0][c] = ("k", GRASS_L)
        near = rect(GARDEN[0], GARDEN[1], GARDEN[2], GARDEN[3]) | rect(COURT[0] - 2, 10, COURT[2] + 2, 40)
        for c in near: mp.layers[0][c] = ("k", GRASS_L if noise(c[0], c[1], 9) < 0.55 else GRASS)
        # ---- roads
        road = lane([(-0.5, ROAD_Y), (79.5, ROAD_Y)], 2.8, 0.0, 11)
        roads = set(road)
        def Ls(pts, w, seed=0):
            roads.update(lane(smooth_polyline(pts, 1.0), w, 0.0, seed))
        Ls([(29.5, 43), (29.5, 49)], 3.0)                         # to the forest bridge
        Ls([(29.5, 53), (29.5, 56)], 3.0)
        Ls([(59, 39), (59, 30)], 2.0); Ls([(59, 30), (59, 17.5)], 2.0)   # to the stable and the servants' house
        Ls([(58, 17.5), (60, 17.5)], 3.0)
        Ls([(53.5, 43), (53.5, 45)], 3.0)                          # to the dam
        Ls([(53.5, 57), (52, 59), (48, 61.5), (46, 61.5)], 2.0)    # dam -> keeper's hut
        roads = smooth(roads, 1)
        self.roads = roads
        mp.kind(0, roads, EARTH)
        for c in roads: mp.layers[1].pop(c, None)
        for c in roads:
            if noise(c[0], c[1], 44) > 0.97: mp.layers[1][c] = ("k", 47)
        self.hard = set(roads)
        # ---- the bed of the old river west of the dam: earth floor, mud at the stream, the stream (shallow water rows 50-51)
        bed = {(x, y) for x in range(0, DAM_X0) for y in range(BED[0], BED[1] + 1)}
        self.bed = bed
        for c in bed:
            mp.layers[0][c] = ("k", 24); mp.layers[1].pop(c, None)
        stream = {(x, y) for x in range(0, DAM_X0) for y in (50, 51)}
        self.water |= stream
        for c in bed - stream:
            if noise(c[0], c[1], 42) < 0.28: mp.layers[1][c] = ("k", 47)         # pebbles
            elif lowfreq(c[0], c[1], 77, 4.0) > 0.62: mp.layers[1][c] = ("k", 39)  # dry patches
        # banks: pebbles and tufts on the grass edge
        for x in range(0, DAM_X0):
            for y in (48, 53):
                if (x, y) not in roads and noise(x, y, 43) < 0.2: mp.layers[1][(x, y)] = ("k", 47)
        # ---- the reservoir: held back by the dam; the river comes in at x=79 (rows 49-52)
        lake = blob(64.5, 57.5, 8.6, 9.4, 7, 0.14) | blob(59, 52.5, 4.2, 6.4, 3, 0.1) | rect(70, 49, 79, 52)
        lake = {c for c in smooth(lake, 2) if c[0] >= 56}
        for c in list(lake):
            if c[0] >= 74 and not (49 <= c[1] <= 52): lake.discard(c)
        lake |= rect(74, 49, 79, 52)
        # a jetty of planks into the lake from the north shore
        col = sorted(y for (x, y) in lake if x == 64)
        jetty = {(64, y) for y in range(col[0] - 1, col[0] + 5)}
        lake -= jetty
        self.jetty = jetty
        self.lake = lake
        self.water |= lake
        for c in lake:
            mp.layers[0][c] = ("k", WATER_LAKE); mp.layers[1].pop(c, None)
        for c in stream: mp.layers[0][c] = ("k", WATER_TRICKLE)
        for c in jetty: mp.layers[0][c] = ("k", PLANKS_A1)
        mp.spot("zbiornik_pomost", 64, col[0] - 2, 8)
        self.occ |= self.water | bed | roads | jetty

    # ------------------------------------------------------------------------------------------------ the dam
    def dam(self):
        mp = self.mp
        # stone face (x 51-52) over the whole length; the sluice grate where the trickle leaves (rows 50-51)
        self.part(0, DAM_X0, DAM_Y0, DAM_X0 + 1, DAM_Y1, STONE_WALL, True)
        self.part(0, DAM_X0, 50, DAM_X0 + 1, 51, SLUICE, True)
        # the deck on top (x 53-55), planks (A1 kind 2, walkable), a rail on the lake side
        deck = rect(DAM_X0 + 2, DAM_Y0, DAM_X1, DAM_Y1)
        for c in deck:
            mp.layers[0][c] = ("k", PLANKS_A1)
            for z in (1, 2, 3): mp.layers[z].pop(c, None)
        rail = {(DAM_X1, y) for y in range(DAM_Y0 + 1, DAM_Y1)}
        mp.kind(1, rail, FENCE)
        # the lake basin right of the deck must be water in rows 46..58 at x=56
        self.occ |= rect(DAM_X0, DAM_Y0, DAM_X1, DAM_Y1)
        self.roads -= deck
        # the trickle leaves the grate: pool of water at x 50, flowing west (already in the stream)
        # sluice wheel: a wooden wheel on the deck (C wheel) as the hand-wheel of the gate
        self.thing("wheel", 53, 49, allow_road=True) if False else None
        self.sign(52, 44, "Tablica", "JAZ LORDA", "Wstęp tylko dla służby. Wody nie wolno brać bez pozwolenia.") if False else None
        mp.spot("jaz_sluza", 54, 51, 4)
        mp.spot("jaz_polnoc", 54, 46, 2)
        mp.spot("jaz_poludnie", 54, 56, 2)
        mp.spot("strazjazu_obchod", 57, 69, 8) if False else None

    def hidden_channel(self):
        """a narrow ditch leaving the reservoir's south-west and running west along one row; its last cells stand under real bushes"""
        mp = self.mp
        row = 63
        xs = [x for (x, y) in self.lake if y == row]
        x0 = min(xs) - 1
        x1 = 44
        ditch = {(x, row) for x in range(x1, x0 + 1)}
        for c in ditch: mp.layers[0][c] = ("k", WATER_TRICKLE); mp.layers[1].pop(c, None)
        self.water |= ditch; self.occ |= ditch
        self.ditch = ditch
        # a small plank weir at the start (walkable), reeds along the banks
        mp.layers[0][(x0 - 1, row)] = ("k", PLANKS_A1)
        # bushes over the last cells (real choppable bushes: the player can cut them and find the water)
        cov = []
        for x in range(x1, x1 + 6):
            tmpl = "!$Bush_Bare_Wide" if (x - x1) % 2 == 0 else "!$Bush_Bare_A"
            if mp.put(x, row, tmpl): cov.append((x, row))
        for (x, y, t) in ((x1 - 1, row, "!$Bush_Bare_A"), (x1 + 1, row - 1, "!$Bush_Bare_B"), (x1 + 3, row + 1, "!$Bush_Bare_A"),
                          (x1 + 4, row - 1, "!$Bush_Bare_Wide"), (x1, row + 1, "!$Bush_Bare_B"), (x1 + 6, row - 1, "!$Bush_Bare_A")):
            mp.put(x, y, t)
        mp.spot("kanal_poczatek", x0 - 2, row + 1, 4)
        mp.spot("kanal_krzaki", x1 + 6, row + 1, 4)
        mp.spot("wodziarz_kanal", x1 + 2, row + 1, 8)
        mp.spot("pokojowka_kanal", x1 + 3, row + 2, 8)
        # tall reeds by the channel mouth
        for (x, y) in ((x0 - 2, row - 1), (x0 - 3, row + 1), (x0 + 1, row - 1)):
            if self.free([(x, y)], True) and (x, y) not in self.water: mp.clump("fern", x, y); self.occ.add((x, y))

    # ------------------------------------------------------------------------------------------------ the manor
    def manor(self):
        mp = self.mp
        pf = json.load(open(ROOT + "tools/town/prefabs/twierdza_front.json", encoding="utf-8"))
        kp = json.load(open(ROOT + "tools/town/prefabs/kosze_zarowe.json", encoding="utf-8"))
        ox, oy = OX, OY
        # cobbled forecourt, the lane to the road, rounded corners
        court = rect(COURT[0] + 1, COURT[1], COURT[2] - 1, COURT[3] - 1)
        lane_c = rect(GATE_X[0], COURT[3], GATE_X[1], 39)
        mp.kind(0, court | lane_c, COBBLE)
        for c in court | lane_c: mp.layers[1].pop(c, None)
        self.roads |= lane_c; self.hard |= court | lane_c
        # the middle: the author's fortress front
        MX, MY = 17 + ox, 4 + oy
        for py in range(1, 9):
            for px in range(7):
                mp.tile(0, MX + px, MY + py, pf["layers"][0][py][px])
        for z in (2, 3):
            for py in range(1, 10):
                for px in range(7):
                    t = pf["layers"][z][py][px]
                    if t: mp.tile(z, MX + px, MY + py, t)
        for c in ((MX + 0, MY + 8), (MX + 0, MY + 9)): mp.layers[3].pop(c, None)    # two stray beams of the prefab beside the door
        ROOF_, BAND, LEDGE, GF = 56, 98, 97, 105
        self.part(0, 17 + ox, 1 + oy, 23 + ox, 4 + oy, ROOF_, True)
        for (x0, x1) in ((12 + ox, 16 + ox), (24 + ox, 28 + ox)):
            self.part(0, x0, 4 + oy, x1, 7 + oy, ROOF_, True)
            self.part(0, x0, 8 + oy, x1, 9 + oy, BAND, False)
            self.part(0, x0, 10 + oy, x1, 10 + oy, LEDGE, False)
            self.part(0, x0, 11 + oy, x1, 12 + oy, GF, True)
            for x in (x0 + 1, x0 + 3):
                mp.tile(3, x, 8 + oy, B(1, 4)); mp.tile(2, x, 9 + oy, B(1, 5))
                mp.tile(3, x, 11 + oy, B(5, 4)); mp.tile(2, x, 12 + oy, B(5, 5)); mp.tile(3, x, 12 + oy, B(0, 1) if x0 == 12 + ox else B(7, 1))
            mp.tile(3, x0 + 2, 11 + oy, 0)
        for y in range(4 + oy, 13 + oy): mp.shadow[(24 + ox, y)] = 5
        for (x, y) in ((18, 1), (22, 1), (13, 4), (27, 4)):
            mp.tile(3, x + ox, y + oy, B(2, 10)); mp.tile(3, x + ox, y + oy + 1, B(2, 11))
            mp.picture(x + ox, y + oy, "!Fantasy_chimney", 0, 2, 0, name="Dym z komina", priority=2, through=True, step=True)
        for (x, y) in ((19, 3), (21, 3), (14, 6), (26, 6)):
            mp.picture(x + ox, y + oy, "!Roof_Windows", 1, 2, 0, name="Lukarna", priority=1)
        for (tx, hd, hp) in ((10, 2, 1), (29, 2, 1)):
            mp.kind(0, rect(tx + ox, 7 + oy, tx + ox + 1, 13 + oy), COBBLE)
            for r in range(7):
                mp.tile(3, tx + ox, 7 + oy + r, B(13, r)); mp.tile(3, tx + ox + 1, 7 + oy + r, B(14, r))
            mp.picture(tx + ox + 1, 9 + oy, "!$Big_Decoration", 0, hd, hp, name="Hełm baszty", priority=2)
        for e in pf["events"]:
            p0 = e["pages"][0]; nm = p0["image"]["characterName"]
            if nm in ("!Flags_banner", "!Statue"):
                self.ev("Chorągiew Lorda" if nm == "!Flags_banner" else "Posąg rycerza", MX + e["x"], MY + e["y"], copy.deepcopy(e["pages"]))
        for x in (14, 26):
            mp.picture(x + ox, 9 + oy, "!Flags_banner", 0, 4, 1, name="Chorągiew Lorda", priority=1)
            mp.picture(x + ox, 12 + oy, "!Decoration", 7, 2, 0, name="Latarnia na ścianie", priority=2, note="<Light:150,90,62,24><LightWhen:night>")
        # fire baskets in the forecourt
        pillar = next(e for e in kp["events"] if e["pages"][0]["image"]["tileId"] == C(0, 1))
        flame = next(e for e in kp["events"] if e["pages"][0]["image"]["characterName"] == "!Decoration" and e["pages"][0]["image"]["characterIndex"] == 0)
        for x in (16 + ox, 24 + ox):
            mp.tile(3, x, 14 + oy, C(0, 0)); mp.tile(3, x, 16 + oy, C(0, 2))
            self.ev("Kosz żarowy (słup)", x, 15 + oy, copy.deepcopy(pillar["pages"]))
            self.ev("Kosz żarowy (ogień)", x, 14 + oy, [dict(pg, priorityType=1, through=False) for pg in copy.deepcopy(flame["pages"])], note="<Light:200,120,60,16><LightFlicker:0.15>")
            mp.lights.append({"name": "Kosz żarowy", "x": x, "y": 14 + oy, "note": "<Light:200,120,60,16>"})
        for (x, y) in ((11 + ox, 15 + oy), (29 + ox, 15 + oy)):
            mp.tile(3, x, y, C(7, 1)); mp.tile(3, x, y - 1, C(7, 0))
        # the door (placeholder; interiors come later): the cathedral gate of the prefab
        dx, dy = 20 + ox, 12 + oy
        self.ev("Drzwi: Dwór Lorda", dx, dy, [P.event("", dx, dy, P.pic("!$Gate_Cathedral1", 0, 2, 0), priority=1, trigger=1,
                                                       cmds=P.popup_cmds("Zamknięte. Straż nie wpuszcza obcych."), dfix=True)["pages"][0]], note="<Town:door=dwor>")
        mp.buildings.append({"key": "dwor", "name": "Dwór Lorda", "rect": [12 + ox, 1 + oy, 28 + ox, 12 + oy], "door": [dx, dy], "front": [dx, dy + 1],
                             "interior": None, "hours": None, "roof": ROOF_, "wall": GF, "event": mp.events[-1][2], "lean": None})
        self.occ |= rect(10 + ox, 0 + oy, 30 + ox, 13 + oy)
        self.occ |= court | lane_c
        mp.spot("lord_dwor", dx, dy + 1, 2)
        mp.spot("matka_lorda_dom", dx - 3, dy + 1, 2)
        mp.spot("pokojowka_praca", dx + 2, dy + 1, 2)
        mp.spot("kucharka_praca", 15 + ox + 1, 12 + oy + 1, 2)      # the west wing's foot: the kitchen
        mp.spot("rzadca_dwor", dx + 4, dy + 2, 2)
        # the courtyard fence (dark), gaps: the gate in the south (x 39-41), a servants' gap in the west
        ring = self.ring(*COURT)
        ring = {c for c in ring if c[1] != COURT[1]} - {(x, COURT[3]) for x in range(GATE_X[0], GATE_X[1] + 1)} - {(COURT[0], 25), (COURT[0], 26)}
        # (the north side of the court is the manor itself: no fence there)
        self.fence_k(ring, FENCE_DARK)
        self.sign(37, 31, "Napis na bramie", "DWÓR LORDA", "Wstęp tylko za pozwoleniem. Straż pilnuje bramy.") if False else None
        mp.spot("brama_dworu", 40, COURT[3] + 1, 2)
        mp.spot("kapitan_straz_brama", 38, COURT[3] - 1, 6)

    # ------------------------------------------------------------------------------------------------ the garden
    def garden(self):
        mp = self.mp
        x0, y0, x1, y1 = GARDEN
        # lanes (cobble) and the plaza with the statue
        lanes = rect(14, 19, 16, y1 + 2) | rect(8, 17, 21, 18)
        plaza = {(x, y) for (x, y) in rect(11, 24, 19, 31) if ((x - 15) / 4.3) ** 2 + ((y - 27.5) / 3.3) ** 2 <= 1}
        mp.kind(0, lanes | plaza, COBBLE)
        for c in lanes | plaza: mp.layers[1].pop(c, None)
        self.hard |= lanes | plaza; self.roads |= lanes
        # beds: hedge rings with flowers (A, C, B, D) and vegetable beds (E, F)
        beds_f = [(6, 20, 12, 24), (18, 20, 24, 24), (6, 32, 12, 36), (18, 32, 24, 36)]
        beds_v = [(6, 26, 11, 30), (19, 26, 24, 30)]
        for (a, b, c_, d_) in beds_f:
            ring = self.ring(a, b, c_, d_)
            mp.kind(1, ring, HEDGE)
            inner = rect(a + 1, b + 1, c_ - 1, d_ - 1)
            mp.kind(1, inner, FLOWERS_B)
            self.occ |= rect(a, b, c_, d_)
        for c in ((12, 23), (18, 23), (12, 35), (18, 35)): mp.layers[1][c] = ("k", FLOWERS_B)   # gaps in the hedges: the gardener can walk in
        for (a, b, c_, d_) in beds_v:
            ring = self.ring(a, b, c_, d_)
            mp.kind(1, ring, FENCE)
            soil = rect(a + 1, b + 1, c_ - 1, d_ - 1)
            for c in soil: mp.layers[0][c] = ("k", EARTH); mp.layers[1].pop(c, None)
            for x in range(a + 1, c_):
                mp.tl(x, b + 1, C(5 + (x + b) % 3, 2), 2)
                mp.tl(x, d_ - 1, C(5 + (x + b + 1) % 3, 3), 2)
                mp.tl(x, b + 2 + (d_ - b - 3) // 2, C(5 + (x + b + 2) % 3, 2), 2) if d_ - b >= 5 else None
            self.occ |= rect(a, b, c_, d_)
            # a gap in the fence towards the lane
        # gate gaps: remove fence cells of the veg beds facing the lane (east side of E, west side of F)
        for c in ((11, 28), (19, 28)): mp.layers[1].pop(c, None)
        # statue on the plaza, benches by it, lantern posts of fire
        mp.picture(15, 27, "!Statue", 0, 2, 2, name="Posąg w ogrodzie", priority=1)
        self.occ.add((15, 27))
        self.thing("bench", 12, 26, allow_road=True); self.thing("bench", 18, 26, allow_road=True)
        mp.spot("matka_lorda_lawka", 13, 27, 6)
        for (x, y) in ((13, 22), (17, 22), (13, 34), (17, 34)):
            self.lamp(x, y, "Latarnia ogrodowa")
        # the hedge round the garden, gaps: south lane (x 14-16), east servants' gap (rows 25-26)
        ring = self.ring(x0, y0, x1, y1) - {(x, y1) for x in (14, 15, 16)} - {(x1, 25), (x1, 26)}
        mp.kind(1, ring, HEDGE)
        for c in ring: mp.layers[0][c] = ("k", GRASS)
        self.occ |= ring
        # cottage and orangery, trees
        for d in HUTS:
            if d["k"] == "ogrodnik": self.hut(d)
        self.orangery()
        self.thing("chopping_block", 9, 18, allow_road=True) if False else None
        self.thing("barrels2", 4 + 3, 17) if False else None
        mp.spot("ogrodnik_grzadki", 9, 31, 8)
        mp.spot("ogrodnik_praca", 20, 18, 2)
        for (x, y, k) in ((6, 36, "leafy"), (23, 14, None), (5, 19, "leafy")):
            if k:
                cells = [(x + dx, y + dy) for dx in (-1, 0, 1) for dy in (-3, -2, -1, 0)]
                if self.free(cells, True): mp.tree(x, y, k, name="Drzewo w ogrodzie Lorda"); self.occ.add((x, y))

    def orangery(self):
        mp = self.mp
        x, y, w = 16, 12, 8
        rec = mp.house("oranzeria", "Oranżeria", x, y, w, 3, 2, 70, 94, 4, door_pic=("!Fantasy_door1", 5), windows=[], chimney=None, ivy=(),
                       interior=None, closed_text="Zamknięte. Ogrodnik trzyma tu klucz.")
        ev = rec["event"]; ev["name"] = "Drzwi: Oranżeria"; ev["note"] = "<Town:door=oranzeria>"
        self.occ |= rect(x - 1, y - 1, x + w, y + 4) | {(rec["door"][0], rec["door"][1] + 1)}
        self.huts["oranzeria"] = rec
        mp.spot("oranzeria_drzwi", rec["door"][0], rec["door"][1] + 1, 2)
        # flower pots by the walls (C 7,0..1 potted tree) are the manor's; here two cypress-like potted shrubs
        for xx in (x - 1, x + w):
            if self.free([(xx, y + 4)], True):
                mp.tl(xx, y + 3, C(5, 0), 3); mp.tl(xx, y + 4, C(5, 1), 2); self.occ.add((xx, y + 4))

    # ------------------------------------------------------------------------------------------------ north-east block
    def east_block(self):
        mp = self.mp
        for d in HUTS:
            if d["k"] in ("sluzba", "stajnia", "wartownia", "strazjazu"): self.hut(d)
        H_ = {d["k"]: d for d in HUTS}
        # servants' house: washing line, a woodpile and a bench
        d = H_["sluzba"]; x, y = d["x"], d["y"]
        self.laundry(x + 9, y + 3, [(9, 13), (10, 13), (12, 13)])
        self.thing("firewood", x - 4, y + 4); self.thing("bench", x + 7, y + 4)
        self.fence({(xx, y + 7) for xx in range(x - 2, x + 11)} | {(x - 2, yy) for yy in range(y + 5, y + 8)} | {(x + 10, yy) for yy in range(y + 5, y + 8)} - {(x + 2, y + 7), (x + 3, y + 7)}) if False else None
        mp.spot("kucharka_dom", x + 3, y + 5, 2); mp.spot("pokojowka_dom", x + 4, y + 5, 2)
        # the stable: a paddock fence, hay, a cart
        d = H_["stajnia"]; x, y = d["x"], d["y"]
        pad = self.ring(x + 11, y - 2, x + 21, y + 10)
        self.fence(pad - {(x + 11, y + 4), (x + 11, y + 5)})
        self.thing("cart_hay", x + 7, y + 7); self.thing("hay", x - 3, y + 6); self.thing("log_bench", x + 1, y + 7) if False else None
        mp.picture(x + 15, y + 4, "$Animal_Sheep", 0, 6, 1, name="Koń Lorda (zastępczo)", priority=1) if False else None
        mp.spot("stajenny_dom", x + 4, y + 5, 2); mp.spot("stajenny_praca", x + 14, y + 4, 4)
        # the orchard: real fruit trees in a loose grid
        rnd = random.Random(5)
        for i, (tx, ty) in enumerate([(67, 12), (72, 12), (77 - 1, 12), (69, 16), (74, 16), (67, 20), (72, 20)]):
            self.resources(trees=[(tx, ty, "!$Tree_Apple" if i % 3 else "!$Tree_Pear")])
        mp.spot("sad", 71, 22, 2)
        # guard post at the gate
        d = H_["wartownia"]; x, y = d["x"], d["y"]
        mp.spot("kapitan_straz_dom", x + 2, y + 5, 2)
        self.thing("weapon_rack", x - 3, y + 3) if False else None
        # dam keeper's hut and his things
        d = H_["strazjazu"]; x, y = d["x"], d["y"]
        self.thing("log_bench", x + 7, y + 5)
        self.thing("firewood", x - 2, y + 4)
        mp.spot("straznik_jazu_dom", x + 2, y + 5, 2)
        mp.spot("straznik_jazu_praca", 54, 52, 4)

    # ------------------------------------------------------------------------------------------------ the forest
    def forest(self):
        mp = self.mp
        fx0, fy0, fx1 = FOREST
        ring = {(fx0, y) for y in range(fy0, 73)} | {(fx1, y) for y in range(fy0, 73)} | {(x, fy0) for x in range(fx0, fx1 + 1)}
        gate = {(x, fy0) for x in range(FOREST_GATE[0], FOREST_GATE[1] + 1)}
        hole = {(fx0, y) for y in range(HOLE[0], HOLE[1] + 1)}
        self.fence(ring - gate - hole)
        # a trodden path through the hole and a loose plank on the ground (no posts by the gap)
        for c in rect(1, HOLE[0], fx0 + 3, HOLE[1] + 0): mp.layers[0][c] = ("k", EARTH); mp.layers[1].pop(c, None)
        self.occ |= hole
        # the road to the gate
        # signs by the gate
        self.sign(27, 54, "Tablica lasu", "LAS LORDA", "Wstęp wzbroniony. Drzewa i zwierzyna należą do Lorda.")
        self.sign(31, 54, "Tablica lasu", "Chrust z ziemi wolno zbierać.", "Kto zetnie drzewo, ręka do pnia.")
        mp.spot("las_brama", 29, fy0 - 1, 8)
        mp.spot("klusownik_dziura", fx0 - 2, HOLE[0], 6)
        mp.spot("drwal_las", 14, 62, 2)
        mp.spot("las_polana", 20, 66, 2)
        # trees: real choppable pines (and some small trees)
        region = {(x, y) for x in range(fx0 + 1, fx1) for y in range(fy0 + 2, 71)}
        avoid = rect(26, fy0, 32, fy0 + 5) | rect(fx0 - 1, HOLE[0] - 2, fx0 + 5, HOLE[1] + 2) | rect(fx1 - 2, 60, fx1 + 8, 66) | rect(13, 61, 16, 63) | rect(19, 65, 22, 67)
        spots = mp.forest_var(region, dense=2.7, sparse=4.2, avoid=avoid, small=0.12, seed=31)
        self.forest_trees = spots
        for c in spots: self.occ.add(c)
        # fallen trunks and branch tangles to gather (real templates), a few stones
        rnd = random.Random(8)
        cand = [c for c in sorted(region - avoid) if c not in mp.taken and mp.free(c[0], c[1], "!$Bush_Bare_Wide")
                and all(abs(c[0] - a) + abs(c[1] - b) > 1 for (a, b) in spots)]
        rnd.shuffle(cand)
        n_log = n_bush = n_rock = 0
        for (x, y) in cand:
            if n_log < 7 and mp.put(x, y, "!$Trunk_Dead"): n_log += 1; self.occ.add((x, y))
            elif n_bush < 16 and mp.put(x, y, "!$Bush_Bare_Wide" if n_bush % 3 else "!$Bush_Bare_Hedge"): n_bush += 1; self.occ.add((x, y))
            elif n_rock < 4 and mp.put(x, y, rnd.choice(["!$Rock_Mossy", "!$Rock_Flat", "!$Rock_Pile"])): n_rock += 1; self.occ.add((x, y))
            if n_log >= 7 and n_bush >= 16 and n_rock >= 4: break
        # the woodcutter's stumps near the hole (fresh cuts)
        for (x, y) in ((8, 60), (10, 64), (7, 66), (12, 61)):
            self.stump(x, y)

    # ------------------------------------------------------------------------------------------------ bridges, signs, lights
    def crossings(self):
        mp = self.mp
        deck = rect(28, 49, 30, 52)
        for c in deck:
            mp.layers[0][c] = ("k", PLANKS_A1); mp.layers[1].pop(c, None)
        self.water -= deck
        self.occ |= deck
        self.roads |= rect(28, 49, 30, 52)
        # a second, rough crossing: stepping boards west (x 10-11)
        mp.spot("most_las", 29, 53, 8)

    def signs_and_lamps(self):
        mp = self.mp
        self.sign(37, 38, "Drogowskaz", "Na północ: Dwór Lorda.", "Na wschód: jaz i góry. Na zachód: miasteczko.")
        self.sign(52, 42, "Tablica", "JAZ LORDA", "Wstęp tylko dla służby.") if False else None
        self.sign(51, 43, "Tablica jazu", "JAZ LORDA", "Po wodę do studni na rynku. Tu wstęp tylko dla służby.")
        for (x, y) in ((36, 39), (44, 39), (20, 39), (66, 39), (12, 39), (53, 39)):
            self.lamp(x, y, "Latarnia przy drodze")
        self.lamp(52, 47, "Latarnia jazu") if False else None
        self.lamp(50, 57, "Latarnia jazu")
        mp.spot("brama_zach", 3, 41, 4); mp.spot("brama_wsch", 76, 41, 6)

    # ------------------------------------------------------------------------------------------------ small details
    def details(self):
        mp = self.mp
        rnd = random.Random(17)
        # reeds and flowers at the lake, stones on the shore
        shore = {(x + dx, y + dy) for (x, y) in self.lake for dx in (-1, 0, 1) for dy in (-1, 0, 1)} - self.water
        for c in sorted(shore):
            if c in self.occ or c in self.roads or mp.layers[0].get(c, ("k", 0))[1] not in (GRASS, GRASS_L): continue
            v = noise(c[0], c[1], 71)
            if v < 0.10 and self.free([c, (c[0], c[1] - 1), (c[0], c[1] - 2)], True) and c[1] < 66:
                mp.tl(c[0], c[1] - 2, B(7, 11), 3); mp.tl(c[0], c[1] - 1, B(7, 12), 3); mp.tl(c[0], c[1], B(7, 13), 2)
                self.occ |= {c, (c[0], c[1] - 1), (c[0], c[1] - 2)}
            elif v < 0.22: mp.layers[1][c] = ("k", TUFTS)
        # tufts along fences / buildings
        for c in sorted(mp.all):
            x, y = c
            if c in self.roads or c in self.water or c in mp.layers[1] or c in mp.layers[2] or c in mp.layers[3]: continue
            if mp.layers[0].get(c, ("k", 0))[1] not in (GRASS, GRASS_L): continue
            near = any((x + dx, y + dy) in self.occ for dx in (-1, 0, 1) for dy in (-1, 0, 1))
            v = noise(x, y, 121)
            if near and v < 0.35: mp.layers[1][c] = ("k", TUFTS)
            elif v > 0.985 and c not in self.occ and c not in mp.taken and 8 < y < 72:
                mp.tl(x, y, rnd.choice([D(9, 7), D(10, 7), D(11, 7), D(13, 10), D(12, 9), D(12, 10)]), 2)

    def spots(self):
        mp = self.mp
        mp.spot("rzeka_wschod", 77, 51, 4)

    def build(self):
        mp = self.mp
        self.ground()
        self.mountains((), (), north=(7, 8, 9), south=(7, 7, 7))
        self.dam()
        self.crossings()
        self.hidden_channel()
        self.manor()
        self.garden()
        self.east_block()
        self.forest()
        self.signs_and_lamps()
        self.resources(rocks=[(60, 69, "!$Rock_Mossy"), (66, 70, "!$Rock_Flat"), (49, 66, "!$Rock_Pile")])
        self.life([(66, 22, 76, 36), (60, 68, 76, 71), (1, 12, 3, 36), (54, 31, 70, 38), (44, 44, 50, 47), (1, 54, 3, 70)], clusters=70)
        self.details()
        self.foot()
        mp.events = [(x, y, e) for (x, y, e) in mp.events if not (e['name'] == 'Sosna (ozdobna)' and 43 < y < 58)]   # none on the stream's banks
        self.spots()
        self.regions()
        return mp


def main():
    b = Build()
    b.build()
    path, data, events, meta = b.write()
    n = len(events) - 1
    print("Map%d Posiadlosc: %dx%d, %d events -> %s" % (MAP_ID, W, H, n, os.path.relpath(path, ROOT)))
    if b.log:
        print("skipped:", len(b.log)); [print("  ", l) for l in b.log[:40]]
    return b


if __name__ == "__main__":
    main()
