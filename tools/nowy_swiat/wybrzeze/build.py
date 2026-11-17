# -*- coding: utf-8 -*-
"""WYBRZEZE 80x80 (nowy swiat, docs/NOWY_SWIAT/PLAN.md) - staging copy of map 219, the shipwreck coast. Built on tools/nowy_swiat/wspolne.py.

python tools/nowy_swiat/wybrzeze/build.py
Output: tools/nowy_swiat/wybrzeze/staging/Map219.json (+ _meta). Pictures: tools/nowy_swiat/wybrzeze/render.py.
Nothing here writes data/ or js/. Everything it needs from the old game (wreck, lighthouse, boats, fire basket) is COPIED from the existing
maps/pictures (read-only)."""
import os, sys, json, copy, math, random, collections

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
import wspolne as WS                                                        # noqa: E402
from wspolne import GRASS, DIRT, GRASS_LIGHT, MUD, EARTH, TUFTS, SOFT, DRY, PEBBLES, FLOWERS, FENCE, PLANKS   # noqa: E402
from wspolne import P, N, B, C, D, E, noise, lowfreq, rect, lane, blob, smooth, smooth_polyline, A5, ROCK_FILL   # noqa: E402
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", "..")).replace("\\", "/") + "/"

W = H = 80
MAP_ID = 219
STAGING = os.path.join(HERE, "staging")
WS.configure(MAP_ID, STAGING)
NOTE = "<Clouds:on>\n<Farm:off>\n<Water:salt>"
SEA, DEEP, PIER = 6, 1, 2           # A1 kinds: the salt sea (layer 0), the deep-water blots (layer 1), planks over the water (layer 1)
WET = 26                            # A2: dark wet sand/mud at the waterline
DRYG = 39                           # layer 1: dry beach grass


def sm(t):
    t = min(1.0, max(0.0, t)); return t * t * (3 - 2 * t)


def disc_smooth(cells, r=2.4, iters=2):
    """majority filter over a disc of radius r (a rounder cousin of wspolne.smooth): kills notches and 1-tile stair steps, off-map counts as set"""
    offs = [(dx, dy) for dx in range(-int(r), int(r) + 1) for dy in range(-int(r), int(r) + 1) if dx * dx + dy * dy <= r * r]
    cells = set(cells)
    for _ in range(iters):
        cand = {(x + dx, y + dy) for (x, y) in cells for dx in (-1, 0, 1) for dy in (-1, 0, 1)}
        new = set()
        for (x, y) in cand:
            if not (0 <= x < W and 0 <= y < H): continue
            n = sum(1 for dx, dy in offs if (min(W - 1, max(0, x + dx)), min(H - 1, max(0, y + dy))) in cells)
            if n * 2 > len(offs): new.add((x, y))
        cells = new
    return cells


def shore(y):
    """x of the shoreline at row y (cells left of it are sea): a gentle wave, a rounded cape (the lighthouse) at rows 9-24"""
    b = max(0.0, 1 - ((y - 17.5) / 7.4) ** 2) ** 1.2
    return 27.0 + 3.0 * math.sin(y / 7.5 + 0.9) + 1.6 * math.sin(y / 3.3 + 1.4) + 3.5 * math.exp(-((y - 62.0) / 4.5) ** 2) + 1.7 * math.sin(y / 4.6 + 2.2) * (1 if 38 < y < 58 else 0.4) - 15.0 * b


# ----------------------------------------------------------------------------------------------- the plan
ROAD = smooth_polyline([(79.5, 45.5), (68, 45.5), (56, 45.7), (46, 45.4), (38, 45.5), (31, 45.5)])
BED_RIM = 58                          # the north bank: rim row 58, stone face 59-60 (A5), floor rows 61-64 at the seam (szwy.json "A")
FACE_X0 = 46                          # the face runs x 46..79, its west end is a rounded cap; a ramp beside it
SPIT = (30, 38)                       # rows of the sand tongue the wreck lies on
WRECK_Y, WRECK_X0 = 35, 9             # base row of the three hull pieces; centre column of the bow (mid +10, stern +20)
JAN = dict(k="jan", n="Chata rybaka Jana", x=36, y=39, w=6, roof="straw", wall="grey_logs", door=3, win=[(0, "wood"), (5, "wood_lit")], ch=1, cs=4, di=2, lean="right", fill="barrel")
HANNA = dict(k="hanna", n="Warzelnia soli Hanny", x=49, y=49, w=5, roof="planks", wall="boards", door=2, win=[(0, "board"), (4, "tiny")], ch=3, cs=5, di=6, lean="left", fill="logs")
TOWER = (19, 19)                      # the lighthouse tower's base cell (bottom centre of the picture)

SEAMS_STATIC = {}


def copy_event(src_map, eid):
    m = json.load(open(ROOT + "data/Map%03d.json" % src_map, "rb"))
    for e in m["events"]:
        if e and e["id"] == eid:
            ev = copy.deepcopy(e)
            for k in ("id", "x", "y"): ev.pop(k, None)
            return ev
    raise KeyError((src_map, eid))


class Build(WS.WorldBuild):
    def __init__(self):
        WS.WorldBuild.__init__(self, MAP_ID, "Wybrzeże", NOTE, seed=219)
        self.mp.props["bgm"] = {"name": "", "pan": 0, "pitch": 100, "volume": 90}
        self.mp.props["bgs"] = {"name": "Sea", "pan": 0, "pitch": 100, "volume": 50}
        self.mp.props["autoplayBgs"] = True
        self.sea = set()
        self.land = set()
        self.rocks = set()

    # ------------------------------------------------------------------------------------------- the land and the sea
    def layout(self):
        mp = self.mp
        mp.kind(0, mp.all, GRASS)
        # the valley's walls: north/south bands, the east foot (the seam column x=79 = Podgrodzie's x=0: rock 0-23, 51-57, 66-79)
        self.mountains((), ((7, 23), (51, 57), (66, 72)))
        mass = self.mass
        # the cliffs: at the west the rock comes down to the sea (NW) and a rocky headland closes the south-west bay
        def rock(x, y):
            mp.tile(0, x, y, A5(ROCK_FILL[int(noise(x, y, 77) * len(ROCK_FILL))]))
            for z in (1, 2, 3): mp.layers[z].pop((x, y), None)
            mp.region.pop((x, y), None)
            mass.add((x, y)); self.occ.add((x, y))
        # --- the cliffs: smooth bumps of rock (a round NW headland, a long SW slope), rounded by a disc filter, faced over the water
        ext = set()
        for x in range(0, 44):
            extra = 10.0 * math.exp(-((x - 1) / 12.0) ** 2) + 4.4 * math.exp(-((x - 22) / 10.0) ** 2)
            for y in range(0, int(self.dN[x] + extra + 0.5)):
                if (x, y) not in mass: ext.add((x, y))
            ys = 73 - 12.5 * math.exp(-((x - 3) / 15.0) ** 2)
            for y in range(int(round(ys)), 80):
                if (x, y) not in mass: ext.add((x, y))
        west_mass = {c for c in mass if c[0] < 50}
        ext = disc_smooth(ext | west_mass, 2.4, 3) - mass
        for (x, y) in sorted(ext): rock(x, y)
        # --- the sea: left of a wavy shoreline, never over rock; the sand tongue under the wreck is cut out of it; then one rounding filter
        sea = set()
        for y in range(H):
            for x in range(0, 44):
                if (x, y) in mass: continue
                if x < shore(y) + 2.6 * (lowfreq(x, y, 31, 6.0) - 0.5): sea.add((x, y))
        tongue = set()
        for x in range(2, 40):
            u = (x - 24.0) / 22.0
            if abs(u) >= 1: continue
            half = 4.9 * (1 - u * u) ** 0.5 + 0.7 * (lowfreq(x, 0, 62, 5.0) - 0.5)
            yc = 34.4 + 1.2 * math.sin(x / 6.0 + 0.4)
            for y in range(int(yc - half - 1), int(yc + half + 2)):
                if abs(y + 0.5 - yc) <= half and (x, y) not in mass: tongue.add((x, y))
        sea -= tongue
        sea = disc_smooth(sea, 2.6, 3) - mass
        tongue = {c for c in tongue if c not in sea}
        tongue |= {c for c in disc_smooth(tongue, 2.0, 1) if c not in mass and c not in sea and c[0] < 40 and 28 < c[1] < 41}
        sea -= tongue
        # the cliff face over the water: the two rock rows that have sea straight below them are stone face (blocked, like the mountain faces)
        for (x, y) in sorted(ext):
            if (x, y + 1) in sea:
                mp.tile(0, x, y, A5(WS.FACE_LOW[0] - 0)); 
                if (x, y - 1) in ext: mp.tile(0, x, y - 1, A5(WS.FACE_UP[0]))
        self.sea, self.tongue = sea, tongue
        self.land = {c for c in mp.all if c not in sea and c not in mass}
        mp.kind(0, sea, SEA)
        for c in sea: mp.layers[1].pop(c, None)
        self.occ |= sea
        self.dsea = self.distance(sea, 16)
        # a few darker blots of deep water far out
        deep = set()
        rnd = random.Random(8)
        for i in range(7):
            cx, cy = rnd.choice([c for c in sorted(sea) if c[0] < 14 and 14 < c[1] < 70])
            for c in blob(cx + 0.5, cy + 0.5, rnd.uniform(2.0, 3.4), rnd.uniform(1.4, 2.4), 300 + i, 0.2):
                if c in sea and all((c[0] + dx, c[1] + dy) in sea for dx in (-1, 0, 1) for dy in (-1, 0, 1)): deep.add(c)
        mp.kind(1, deep, DEEP)

    def beach(self):
        """wet sand at the waterline, packed earth (A2 24) on the shore, dry beach grass in soft patches, grass inland"""
        mp = self.mp
        d = self.dsea
        occ_ok = lambda c: c not in self.mass
        self.wide = {}
        for c in sorted(self.land):
            x, y = c
            if c in self.mass: continue
            dist = d.get(c, 17)
            wide = 3.5 + 3.0 * lowfreq(x, y, 9, 7.0)               # how far the sand reaches inland (4.5-8)
            self.wide[c] = wide
            if dist <= wide or c in self.tongue: kind = WET if dist <= 2 else 24
            else: kind = GRASS
            mp.layers[0][c] = ("k", kind)
            mp.layers[1].pop(c, None)
        # no real sand in tileset 11: dry sand = earth 24 under the tan dry-grass overlay (39), wet sand = the dark mud kind 26 at the waterline,
        # pebbles at the waterline; dunes = a band of dry grass patches and tufts between the sand and the meadow
        sand = {c for c in self.land if c not in self.mass and mp.layers[0].get(c, ("k", 0))[1] == 24 and d.get(c, 17) >= 2}
        for c in sand:
            if noise(c[0], c[1], 71) < 0.05: mp.layers[1][c] = ("k", PEBBLES)
        for c in self.land:
            if c in self.mass: continue
            if d.get(c, 17) <= 2 and noise(c[0], c[1], 44) < 0.22: mp.layers[1][c] = ("k", PEBBLES)
        dune = {c for c in self.land if c not in self.mass and mp.layers[0].get(c, ("k", 0))[1] == GRASS and 0 < d.get(c, 17) - self.wide.get(c, 0) <= 7}
        dune_dry = {c for c in dune if lowfreq(c[0], c[1], 72, 3.5) > 0.40 and noise(c[0], c[1], 75) < 0.5}
        for c in dune_dry: mp.layers[1][c] = ("k", DRYG)
        for c in dune - dune_dry:
            if noise(c[0], c[1], 73) < 0.18: mp.layers[1][c] = ("k", TUFTS)
        # windswept patches of dry grass in the meadow (calm, coastal)
        meadow = {c for c in self.land if c not in self.mass and mp.layers[0].get(c, ("k", 0))[1] == GRASS and c not in mp.layers[1] and c[0] < 77 and self.wide.get(c, 0) + 7 < d.get(c, 17)}
        wind = {c for c in meadow if lowfreq(c[0], c[1], 74, 4.0) > 0.5 and noise(c[0], c[1], 76) < 0.07}
        for c in wind: mp.layers[1][c] = ("k", DRYG)
        self.dry = dune_dry | wind
        light = smooth({c for c in self.land if c not in self.mass and mp.layers[0].get(c, ("k", 0))[1] == GRASS and d.get(c, 17) > 6 and c[0] < 74 and lowfreq(c[0], c[1], 81, 6.0) > 0.60}, 2)
        for c in light:
            if mp.layers[0].get(c, ("k", 0))[1] == GRASS: mp.layers[0][c] = ("k", GRASS_LIGHT)

    def river(self):
        """the dry riverbed (szwy.json A): rows 61-64 at the seam, straight under the stone north bank, then it opens into a gravel mouth on the beach"""
        mp = self.mp
        def north(x): return 61 - int(round(3 * sm((FACE_X0 - x) / 10.0)))
        def south(x): return 64 + int(round(2.4 * sm((FACE_X0 - x) / 11.0)))
        g = set()
        for x in range(W):
            for y in range(north(x), south(x) + 1):
                if (x, y) in self.sea or (x, y) in self.mass: continue
                g.add((x, y))
        self.bed = g
        self.bed_south = south
        mp.kind(0, g, 24)
        for c in g: mp.layers[1].pop(c, None)
        # stony floor: pebbles on the edges, dry patches, mud islands
        edge = {c for c in g if any((c[0] + dx, c[1] + dy) not in g for dx in (-1, 0, 1) for dy in (-1, 0, 1))}
        for c in edge:
            if noise(c[0], c[1], 42) < 0.3: mp.layers[1][c] = ("k", PEBBLES)
        dry = smooth({c for c in g if lowfreq(c[0], c[1], 77, 4.0) > 0.60}, 1)
        for c in dry:
            if c not in mp.layers[1]: mp.layers[1][c] = ("k", DRY)
        # the stone north bank + the ramp beside its west cap (the ramp's stepping stone D 9,6 is cut: no top tile - replaced by flat stones)
        self.bank([(FACE_X0, W - 1, BED_RIM, True, False)], [(FACE_X0 - 2, FACE_X0 - 1, BED_RIM)], [])
        for c in ((FACE_X0 - 1, BED_RIM + 2), (FACE_X0 - 2, BED_RIM + 1)):
            mp.layers[2].pop(c, None); mp.layers[3].pop(c, None)
            mp.tl(c[0], c[1], D(10, 6), 2) if c[1] == BED_RIM + 1 else mp.tl(c[0], c[1], D(10, 5), 2)
        # the seam column x=79 (szwy.json "A"): row 61 has pebbles, row 65 is earth, the earth strip 42-46 of the road
        mp.layers[1][(79, 61)] = ("k", PEBBLES)
        mp.layers[0][(79, 65)] = ("k", DIRT)
        for x in range(74, 79): mp.layers[0][(x, 65)] = ("k", DIRT) if noise(x, 65, 3) < 0.7 else ("k", GRASS)
        ring = {(x + dx, y + dy) for (x, y) in g for dx in (-1, 0, 1) for dy in (-1, 0, 1)} - g
        for c in ring:
            if c in self.mass or c in self.sea or c in self.occ: continue
            if noise(c[0], c[1], 43) < 0.12 and mp.layers[0].get(c, ("k", 0))[1] in (GRASS, 24): mp.layers[1][c] = ("k", PEBBLES)

    def make_roads(self):
        mp = self.mp
        roads = set(lane(ROAD, 2.8, 0.0, 11))
        def Ls(pts, w, seed=0): roads.update(lane(smooth_polyline(pts, 1.0), w, 0.0, seed))
        roads |= blob(80.0, 42.8, 3.6, 1.35, 12, 0.05)                                   # the verge at the seam (x=79 rows 42-43 are earth)
        Ls([(34, 44.5), (30, 44.5), (28.5, 45.0)], 2.6)                                  # the road runs onto the beach
        Ls([(46, 43.5), (46, 33), (44.5, 28), (39, 25.5), (31, 24.6), (25, 23.4), (20.5, 22.2), (19.2, 21.5)], 1.8)       # to the cape and the lighthouse
        Ls([(39, 44), (39, 44.5)], 1.8)                                                  # Jan's door
        Ls([(30.5, 41.5), (30, 38.5), (28.5, 37.5), (24, 36.8), (14, 37.2), (7, 37.2)], 1.7)       # beach -> along the tongue, south of the hull
        Ls([(30, 36), (29.5, 33.5), (27, 31.4), (20, 31.2), (12, 31.5), (6.5, 32)], 1.5)  # north walk by the hull (the side of the tongue)
        Ls([(46, 47), (47, 50), (50.5, 54.2)], 1.8)                                      # to Hanna's shed
        Ls([(45, 57), (44.5, 58.5), (45, 60.5)], 1.7)                                    # down the ramp into the bed
        roads = {c for c in smooth(roads, 1) if c not in self.sea and c not in self.mass and c not in self.bed}
        self.hard = set(roads)
        self.roads = roads
        for c in roads:
            if mp.layers[0].get(c, ("k", 0))[1] not in (24, WET): mp.layers[0][c] = ("k", EARTH)    # (on the sand the sand itself is the road: earth 17 would draw a green fringe)
            mp.layers[1].pop(c, None)
        for c in roads:
            if noise(c[0], c[1], 45) > 0.97: mp.layers[1][c] = ("k", PEBBLES)

    # ------------------------------------------------------------------------------------------- things
    def hide_places(self):
        pass

    def pier(self):
        """a small wooden pier on the sea at row 47-48 (A1 planks on layer 1, a planked landing on the sand), a fire basket on its head,
        the moored boat; the ferry may moor here later"""
        mp = self.mp
        ys = (47, 48)
        sx = int(math.ceil(shore(47.5)))
        x_end = sx - 12
        row = [x for x in range(x_end, 70)]
        first_land = next(x for x in range(x_end, 60) if all((x, y) in self.land for y in ys))
        cells_sea = {(x, y) for y in ys for x in range(x_end, first_land) if (x, y) in self.sea}
        head = {(x, y) for y in (46, 47, 48, 49) for x in (x_end, x_end + 1) if (x, y) in self.sea}
        mp.kind(1, cells_sea | head, PIER)
        for c in cells_sea | head: self.occ.add(c)
        land_planks = {(x, y) for y in ys for x in range(x_end, first_land + 3) if (x, y) in self.land}
        mp.kind(0, land_planks, PLANKS)
        for c in land_planks: mp.layers[1].pop(c, None)
        self.occ |= land_planks | {(first_land + 3, y) for y in ys}
        sx = first_land
        self.pier_end = (x_end, 47)
        mp.picture(x_end, 46, "!Decoration", 0, 2, 0, name="Kosz ogniowy na końcu mola", priority=1, step=True,
                   note="<Light:170,120,60,18><LightFlicker:0.15>")
        mp.lights.append({"name": "Kosz ogniowy na końcu mola", "x": x_end, "y": 46, "note": "<Light:170,120,60,18>"})
        mp.picture(x_end + 5, 46, "!$Lodz_Mala_z_gory", 0, 2, 0, name="Łódka", priority=1, note="<Occupy:left=1,right=1>")
        self.occ |= {(x_end + 4, 46), (x_end + 5, 46), (x_end + 6, 46)}
        mp.spot("jan_przystan", sx - 1, 47, 4)

    def wreck(self):
        """the ship "Pomyslnosc": the big three-piece wreck of the old game (Map165: bow, midship, stern + the sand painted under them),
        lying on the sand tongue with its stern on the beach; the hull is blocked by invisible Occupy events, the hole in the stern is the way below"""
        mp = self.mp
        y = WRECK_Y
        parts = [("Dziob", "!$1_Wrak_Dziob_Duzy", WRECK_X0, y), ("Śródokręcie", "!$1_Wrak_Srodek_Duzy", WRECK_X0 + 10, y - 1), ("Rufa", "!$1_Wrak_Rufa_Duzy", WRECK_X0 + 20, y)]
        for (nm, pic, px, py) in parts:
            g = pic + "_Grunt"
            mp.picture(px, py, g, 0, 2, 0, name="Wrak: piasek pod (%s)" % nm.lower(), priority=0, through=True, note="<Cienie:off>")
            mp.picture(px, py, pic, 0, 2, 0, name="Wrak „Pomyślność”: %s" % nm.lower(), priority=1, through=True, note="<Cienie:maska>")
        sx = WRECK_X0 + 20
        # the hull blocks rows y-3..y from the bow's keel to the stern's end; the stern's hole (sx, y) stays open - the way under the deck
        x0, x1 = WRECK_X0 - 4, sx + 5
        mp.blocker(x0, y - 3, sx - 1, y, "Blokada: kadłub (dziób, śródokręcie, rufa)")
        mp.blocker(sx, y - 3, sx, y - 1, "Blokada: kadłub nad dziurą")
        mp.blocker(sx + 1, y - 3, x1, y, "Blokada: rufa")
        for c in rect(x0, y - 3, x1, y): self.occ.add(c)
        for c in rect(x0 - 2, y - 9, x1 + 1, y - 4): self.reserve({c})
        self.wreck_hole = (sx, y)
        # the hole: a closed hatch for now (the hold comes with the interiors)
        mp.picture(sx, y, "", 0, 2, 0, name="Drzwi: Ładownia „Pomyślności”", priority=1, trigger=1,
                   cmds=P.popup_cmds("Pod pokładem woda po pas i ciemno jak w studni. Jeszcze nie wejdę."), note="<Town:door=wrak_ladownia>")
        mp.spot("wrak_ladownia", sx, y + 1, 8)
        mp.spot("wrak_dziob", WRECK_X0 - 2, y + 2, 6)
        mp.spot("wrak_rufa", sx + 1, y + 2, 2)
        mp.spot("wrak_burta", WRECK_X0 + 10, y + 2, 8)
        mp.spot("wrak", WRECK_X0 + 10, y + 3, 8)

    def lighthouse(self):
        mp = self.mp
        tx, ty = TOWER
        tower = copy_event(159, 1); mp.add(tx, ty, tower, [(tx, ty)])
        for eid, dx, dy in ((2, -1, 0), (3, 1, 0), (4, 0, -1), (48, -2, 0), (52, 2, 0)):
            ev = copy_event(159, eid)
            mp.add(tx + dx, ty + dy, ev, [(tx + dx, ty + dy)] + ([(tx + dx, ty + dy - k) for k in range(1, 4)] if dx in (-1, 1) else [(tx, ty - 2)] if dy == -1 else []))
        # the fog bell at the tip (a copy of Map159's event) and the lantern light is the tower's own
        bx, by = next((c for c in sorted(self.land, key=lambda c: abs(c[0] - 23) + abs(c[1] - 21)) if self.dsea.get(c, 0) >= 2 and c not in self.occ and c not in self.mass), (17, 21))
        mp.add(bx, by, copy_event(159, 10), [(bx, by)])
        mp.spot("latarnia_drzwi", tx, ty + 1, 8)
        mp.spot("latarnia", tx - 3, ty + 2, 6)
        mp.spot("lat_dzwon", bx + 1, by + 1, 8)
        self.occ |= rect(tx - 3, ty - 3, tx + 3, ty + 1) | {(bx, by)}
        # the cape: low rock outcrops and stones on the very tip
        for c in sorted(self.land):
            if 11 <= c[1] <= 25 and c[0] <= 32 and c not in self.mass and c not in self.occ and noise(c[0], c[1], 8) < 0.05 and self.dsea.get(c, 9) >= 1:
                self.clump("stones" if noise(c[0], c[1], 9) < 0.5 else "stone", c[0], c[1])
        self.lamp(tx + 4, ty + 1, "Latarenka przy latarni")

    def jan(self):
        mp = self.mp
        d = JAN
        rec = self.hut(d)
        x, y = d["x"], d["y"]
        self.lamp(x + d["door"] + 4, y + 5, "Latarnia u Jana")
        # the yard to the west: drying nets (racks), the boat pulled up on the sand, a chopping block, firewood
        self.thing("hide_rack", 31, 41); self.thing("hide_rack_b", 32, 41); self.thing("hide_rack", 33, 41)
        mp.picture(31, 43, "!$Lodz_Janka_z_gory", 0, 4, 0, name="Łódź Jana (wciągnięta na brzeg)", priority=1, note="<Occupy:left=1,right=1>")
        self.occ |= {(30, 43), (31, 43), (32, 43)}
        self.thing("chopping_block", 35, 43)
        self.thing("logs_small", 34, 43)
        self.prop("barrel_water", 35, 40, label="Beczka na deszczówkę")
        mp.spot("jan_dom", rec["door"][0], rec["door"][1] + 1, 2)
        mp.spot("jan_sieci", 33, 42, 2)
        mp.spot("jan_lodz", 31, 44, 8)
        mp.spot("jan_praca", self.pier_end[0] + 2, 47, 4)
        mp.spot("brama_wsch", 75, 45, 6)

    def hanna(self):
        """Hanna's salt pans: three shallow rectangular beds (wet dark earth, a stone-grey dyke, a white crust of salt) above the mouth of the
        river, and the boiling shed with its cauldron on a fire"""
        mp = self.mp
        d = HANNA
        rec = self.hut(d)
        x, y = d["x"], d["y"]
        def fits(px, py):
            ring = rect(px - 1, py - 1, px + 5, py + 3)
            return all(c in self.land and c not in self.occ and c not in self.bed and c not in self.roads for c in ring)
        px0 = next((px for px in range(29, 38) if fits(px, 50) and fits(px + 8, 50)), 31)
        pans = [(px0, 50), (px0 + 8, 50)]
        for (px, py) in pans:
            pw, ph = 5, 3
            ring = rect(px - 1, py - 1, px + pw, py + ph)
            if not all(c in self.land and c not in self.occ and c not in self.bed for c in ring): self.log.append("pan %d,%d blocked" % (px, py)); continue
            inner = rect(px, py, px + pw - 1, py + ph - 1)
            for c in ring - inner:
                mp.layers[0][c] = ("k", 32); mp.layers[1].pop(c, None)
            for c in inner:
                mp.layers[0][c] = ("k", 26); mp.layers[1].pop(c, None)
                if noise(c[0], c[1], 17) < 0.10: mp.layers[1][c] = ("k", PEBBLES)    # the grey crust of salt
            self.occ |= ring
        # the salt-works yard: cauldron on a fire under the shed's wall, firewood
        kx, ky = x + 1, y + 6
        mp.picture(kx, ky, "!$Pod_Kociol", 0, 2, 0, name="Kocioł do warzenia soli", priority=1,
                   note="<Occupy:left=1,right=1,up=1><Light:200,120,60,14><LightFlicker:0.15>")
        mp.lights.append({"name": "Kocioł do warzenia soli", "x": kx, "y": ky, "note": "<Light:200,120,60,14>"})
        self.occ |= rect(kx - 1, ky - 1, kx + 1, ky)
        self.thing("firewood", x + 7, y + 4)
        self.thing("barrel", x - 3, y + 4)
        self.lamp(x + 5, y + 6, "Latarnia przy warzelni")
        mp.spot("hanna_dom", self.huts["jan"]["door"][0] + 1, self.huts["jan"]["door"][1] + 1, 2)
        mp.spot("hanna_warzelnia", rec["door"][0], rec["door"][1] + 1, 2)
        mp.spot("hanna_praca", 40, 54, 8)
        mp.spot("hanna_salina", 36, 54, 8)
        mp.spot("hanna_kociol", kx, ky + 1, 8)

    def beach_life(self):
        """the driftwood spots, the tide pools, the hero's place, real rocks and logs"""
        mp = self.mp
        # the spot where the hero was found: on the sand by the sea, south of the tongue
        zx = int(math.ceil(shore(41.5))) + 2
        mp.spot("znaleziony", zx, 41, 2)
        # real driftwood: logs (the game's working <Log> template) on the wet sand; further "Miejsce: drewno_N" slots for the sea's timber
        logs = [(27, 52), (26, 62), (32, 28), (27, 24), (30, 70), (25, 41), (29, 56), (28, 66), (23, 27), (31, 38)]
        placed = []
        for (lx, ly) in logs:
            ly2 = ly
            for yy in range(ly - 3, ly + 4):
                x = int(math.ceil(shore(yy))) + 1
                if self.free([(x, yy)]) and (x, yy) not in self.mp.taken and mp.layers[0].get((x, yy), ("k", 0))[1] in (WET, 24):
                    if self.resources(logs=((x, yy, "!$Trunk_Dead"),)): placed.append((x, yy)); break
        slots = [(int(math.ceil(shore(yy))) + 2, yy) for yy in (27, 31, 44, 51, 55, 66, 69)]
        n = 0
        for (x, yy) in slots:
            n += 1; mp.spot("drewno_%d" % n, x, yy, 4)
        # tide pools among the rocks of the south-west cliff foot
        for i, (x, yy) in enumerate(((32, 68), (35, 70))):
            for c in rect(x - 1, yy - 1, x + 1, yy): mp.layers[1].pop(c, None)
            mp.spot("kaluza_%d" % (i + 1), x, yy, 4)
            self.occ |= rect(x - 1, yy - 1, x + 1, yy)
        self.pool_cells = [(32, 68), (35, 70)]

    def real_rocks(self):
        mp = self.mp
        rnd = random.Random(77)
        small = ["!$Rock_Flat", "!$Rock_Mossy", "!$Rock_Pile", "!$Rock_Cairn", "!$Rock_Chunk", "!$Rock_Cracked"]
        def ok(c):
            return (c in self.land and c not in self.mass and c not in self.occ and c not in self.roads and c not in self.bed and c not in mp.taken
                    and mp.layers[0].get(c, ("k", 0))[1] in (24, EARTH, GRASS, WET) and c not in mp.layers[2] and c not in mp.layers[3])
        used = []
        # at the water's edge: the rocks of the tongue's rim and the cliff foot
        edge = [c for c in sorted(self.land) if 1 <= self.dsea.get(c, 9) <= 2 and ok(c) and 6 < c[0] < 40]
        rnd.shuffle(edge)
        for c in edge:
            if len(used) >= 34: break
            if any(abs(c[0] - a) + abs(c[1] - b) < 4 for (a, b) in used): continue
            if abs(c[1] - 41) < 3 and c[0] < 33: continue
            if c[1] in range(46, 50) and c[0] < 33: continue
            if self.resources(rocks=((c[0], c[1], rnd.choice(small)),)): used.append(c)
        # inland: scattered stones + a few ore-less boulders
        inland = [c for c in sorted(self.land) if ok(c) and self.dsea.get(c, 9) > 8 and 9 < c[1] < 72]
        rnd.shuffle(inland)
        n = 0
        for c in inland:
            if n >= 22: break
            if any(abs(c[0] - a) + abs(c[1] - b) < 8 for (a, b) in used): continue
            if self.resources(rocks=((c[0], c[1], rnd.choice(small)),)): used.append(c); n += 1
        mid = [c for c in sorted(self.land) if ok(c) and 3 <= self.dsea.get(c, 9) <= 10 and (c[1] > 51 or c[1] < 30)]
        rnd.shuffle(mid)
        n = 0
        for c in mid:
            if n >= 10: break
            if any(abs(c[0] - a) + abs(c[1] - b) < 6 for (a, b) in used): continue
            if self.resources(rocks=((c[0], c[1], rnd.choice(small)),)): used.append(c); n += 1
        self.rock_cells = used
        # dune scrub: real bare bushes (branches) where the sand turns to grass
        dunes = [c for c in sorted(self.land) if ok(c) and 5 <= self.dsea.get(c, 9) <= 13 and 9 < c[1] < 72 and c[0] < 50]
        rnd.shuffle(dunes)
        got = []
        for c in dunes:
            if len(got) >= 12: break
            if any(abs(c[0] - a) + abs(c[1] - b) < 7 for (a, b) in got): continue
            if self.resources(bushes=((c[0], c[1], rnd.choice(["!$Bush_Bare_A", "!$Bush_Bare_B"])),)): got.append(c)

    def forest_and_stumps(self):
        mp = self.mp
        rnd = random.Random(123)
        # real pines and stumps at the foot of the mountains (north and south), a few more in the east meadow
        zones = [rect(36, 9, 76, 17), rect(36, 67, 76, 72)]
        avoid = set(self.roads) | set(self.bed) | set(self.occ) | self.hard
        for b in self.mp.buildings:
            r = b["rect"]
            avoid |= rect(r[0] - 3, r[1] - 3, r[2] + 4, r[3] + 4)
        avoid |= rect(44, 52, 56, 60)
        for z in zones:
            region = {c for c in z if c in self.land and c not in avoid and mp.layers[0].get(c, ("k", 0))[1] in (GRASS, GRASS_LIGHT, 24, EARTH)
                      and self.dsea.get(c, 17) > 5}
            mp.forest_var(region, dense=5.5, sparse=9.5, avoid=avoid, small=0.15, seed=90 + len(zones))
        # keep the pines' cells in occ
        for (x, y, e) in mp.events:
            if "Pine" in (e["pages"][0]["image"]["characterName"] or "") or "Tree_" in (e["pages"][0]["image"]["characterName"] or ""): self.occ.add((x, y))
        # stumps
        cands = [c for c in sorted(self.land) if c not in self.occ and c not in self.roads and c not in self.bed and c not in mp.taken
                 and mp.layers[0].get(c, ("k", 0))[1] in (GRASS, GRASS_LIGHT, EARTH) and 36 < c[0] < 76 and self.dsea.get(c, 17) > 6
                 and (c[1] < 24 or c[1] > 50) and c not in mp.layers[2] and c not in mp.layers[3] and c not in self.hard]
        rnd.shuffle(cands)
        mine = []
        for c in cands:
            if len(mine) >= 24: break
            if any(abs(c[0] - a) + abs(c[1] - b) < 6 for (a, b) in mine): continue
            if self.stump(*c): mine.append(c)
        # real bare bushes (branches) along the foot of the mountains
        foot = [c for c in cands if c not in mp.taken and (c[1] < 16 or c[1] > 66) and c not in self.occ]
        rnd.shuffle(foot)
        got = []
        for c in foot:
            if len(got) >= 14: break
            if any(abs(c[0] - a) + abs(c[1] - b) < 6 for (a, b) in got + mine): continue
            if self.resources(bushes=((c[0], c[1], rnd.choice(["!$Bush_Bare_A", "!$Bush_Bare_B"])),)): got.append(c)
        # small groups of windswept pines (low, lopsided ones) out in the meadow
        for (gx, gy) in ((58, 26), (68, 38), (54, 54), (47, 12)):
            n = 0
            for (dx, dy, t) in ((0, 0, "!$Pine_C"), (2, 1, "!$Pine_B"), (-2, 2, "!$Pine_C")):
                c = (gx + dx, gy + dy)
                if c in self.land and c not in self.occ and c not in self.roads and c not in mp.taken and mp.layers[0].get(c, ("k", 0))[1] == GRASS:
                    if self.resources(trees=((c[0], c[1], t),)): n += 1

    def signs(self):
        self.sign(72, 43, "Drogowskaz", "Na zachód: plaża, chata rybaka, wrak.", "Na północy cypel z latarnią. Na wschód: Podgrodzie.") if self.free([(72, 43), (72, 42)], True) else None
        self.sign(24, 25, "Tabliczka", "Cypel latarni. Uważaj na skały.") if False else None

    def life_and_details(self):
        mp = self.mp
        rnd = random.Random(33)
        # ferns / flowers / weeds on the grass, tufts and stones on the sand
        kinds = ["fern", "fern_b", "fern_c", "white_fl", "white_fl_b", "yellow_fl", "weed"]
        def okc(c):
            return (c in self.land and c not in self.occ and c not in self.hard and c not in self.bed and c not in mp.taken
                    and mp.layers[0].get(c, ("k", 0))[1] in (GRASS, GRASS_LIGHT) and c not in mp.layers[2] and c not in mp.layers[3]
                    and 5 <= c[0] <= W - 6 and 9 <= c[1] <= H - 8)
        spots = [c for c in sorted(self.land) if okc(c)]
        for i in range(70):
            cx, cy = rnd.choice(spots)
            k = rnd.choice(kinds)
            for j in range(rnd.randint(2, 5)):
                c = (cx + rnd.randint(-2, 2), cy + rnd.randint(-1, 1))
                if okc(c): mp.clump(rnd.choice([k, k, rnd.choice(kinds)]), c[0], c[1]); self.occ.add(c)
        # stones lying on the sand: flat decor stones only (they look like stones, not like items)
        for c in sorted(self.land):
            if c in self.occ or c in self.hard or c in mp.taken or c in self.mass: continue
            if mp.layers[0].get(c, ("k", 0))[1] in (24, WET, EARTH) and 2 <= self.dsea.get(c, 9) <= 10 and noise(c[0], c[1], 61) < 0.028 and c not in mp.layers[2] and c not in mp.layers[3]:
                self.clump("stones" if noise(c[0], c[1], 62) < 0.5 else "stone", c[0], c[1])
        # grass tufts round the building yards
        for c in sorted(self.land):
            if c in self.roads or c in self.bed or c in mp.layers[1] or c in mp.layers[2] or c in mp.layers[3] or c in self.mass: continue
            if mp.layers[0].get(c, ("k", 0))[1] not in (GRASS, GRASS_LIGHT): continue
            near = any((c[0] + dx, c[1] + dy) in self.occ for dx in (-1, 0, 1) for dy in (-1, 0, 1))
            v = noise(c[0], c[1], 121)
            if near and v < 0.4: mp.layers[1][c] = ("k", TUFTS if v < 0.25 else SOFT)

    def finish_regions(self):
        mp = self.mp
        for c in self.roads:
            if mp.region.get(c) is None and 3 <= c[0] <= W - 4: mp.region[c] = 31

    def build(self):
        self.layout()
        self.beach()
        self.river()
        self.make_roads()
        self.pier()
        self.wreck()
        self.lighthouse()
        self.jan()
        self.hanna()
        self.foot()
        self.signs()
        self.beach_life()
        self.real_rocks()
        self.forest_and_stumps()
        self.life_and_details()
        self.bed_details(boulders=4, reeds=14, x_margin=8, first_row=57)
        self.finish_regions()
        self.seam()
        return self.mp

    def seam(self):
        """the east edge column x=79 = Podgrodzie's x=0 (szwy.json "A"): the same ground kinds and details row by row (mountains 0-23, 51-57 and
        66-79 are the mountains' own; the rest is set here), nothing standing on it"""
        mp = self.mp
        for y in range(24, 51):
            mp.layers[0][(79, y)] = ("k", DIRT if 42 <= y <= 46 else GRASS)
            mp.layers[1].pop((79, y), None)
            if y in (34, 41, 50): mp.layers[1][(79, y)] = ("k", TUFTS)
        for y in range(61, 65):
            mp.layers[0][(79, y)] = ("k", 24); mp.layers[1].pop((79, y), None)
        mp.layers[1][(79, 61)] = ("k", PEBBLES)
        mp.layers[0][(79, 65)] = ("k", DIRT); mp.layers[1].pop((79, 65), None)
        for y in range(24, 66):
            for z in (2, 3): mp.layers[z].pop((79, y), None)


def main():
    b = Build()
    b.build()
    path, data, events, meta = b.write()
    print("Map%d Wybrzeze: %dx%d, %d events -> %s" % (MAP_ID, W, H, len(events) - 1, os.path.relpath(path, ROOT)))
    if b.log: print("skipped:", len(b.log)); [print("  ", l) for l in b.log[:60]]
    return b


if __name__ == "__main__":
    main()
