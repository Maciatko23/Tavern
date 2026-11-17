# -*- coding: utf-8 -*-
"""WSPOLNE (tools/nowy_swiat/wspolne.py) - shared library for building the 5 maps of the new world (80x80, tileset 11: Winlu exterior).
Written for Podgrodzie (tools/nowy_swiat/podgrodzie/build.py), reused by Wybrzeze (219), Miasteczko (220), Posiadlosc (221), Gory (222).

Usage:
    import wspolne as WS
    WS.configure(map_id=219, staging=<dir>)            # once, before building
    class Build(WS.WorldBuild): ...                     # your map; call the helpers below from your own build()

What it gives (each function has a docstring):
  - geometry: rect, lane, blob, smooth (majority filter), smooth_polyline (Catmull-Rom), profile (stepped depth profile)
  - WorldBuild.__init__: a Pod map (hut stamps of the author's tiles, tools/podgrodzie/plib.py) + the bookkeeping sets
  - placing things safely: free, thing (C-sheet things), prop (!Town_Props), clump (D-sheet clumps), stump (real 'Pieniek' event), fence,
    lamp (wooden lantern post, fire only), say / sign (text events), laundry lines, dead_tree, path
  - buildings: hut (a hut stamp with chimney, door placeholder, region 2 on lean-tos), door_placeholder, chimney, garden_for (fenced
    vegetable bed), yard
  - terrain: mountains (the valley's walls, SEAM CONTRACT), foot (pines, scree, outcrops), bank (stone-faced bank + ramps + footbridges),
    earth_and_grass (the ground style of the poor villages), distance, bed_details (boulders, reeds, stones)
  - life: life (ferns/flowers + real rocks and bushes), resources (real stumps/rocks/bushes/fruit tree/log from Map003 templates),
    stumps_and_scrub (stumps everywhere), regions (eagle landing region 31)
  - output: write (staging JSON), seam_report (szwy.json), render_map (whole map + screen shots), lint (tools/mapy/kontrola.py)
Rules baked in: no composite pictures (buildings from tiles), no loose sacks/chests/buckets as decor, every blocked cell looks blocked,
fences simply end at a gap, water is scarce (no ponds), stones/stumps/bushes/rocks are the game's real working events.
Nothing here writes data/ or js/."""
import os, sys, json, copy, math, random, collections, subprocess

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..")).replace("\\", "/") + "/"
for p in ("tools/mapy", "tools/newstart", "tools/town", "tools/podgrodzie"):
    sys.path.insert(0, ROOT + p)
import plib as P                                   # noqa: E402
import nslib as N                                  # noqa: E402
from nslib import B, C, D, E, noise, lowfreq       # noqa: E402

W = H = 80
MAP_ID = 0
STAGING = HERE


def configure(map_id, staging, w=80, h=80):
    """Set the map id, the staging folder and the size (call once before creating a WorldBuild)"""
    global W, H, MAP_ID, STAGING
    W, H, MAP_ID, STAGING = w, h, map_id, staging
    P.W, P.H, P.MAP_ID, P.STAGING = w, h, map_id, staging
    os.makedirs(staging, exist_ok=True)


# A2 ground kinds of tileset 11 (see docs/NOWY_SWIAT and tools/mapy/katalog)
GRASS, DIRT, GRASS_LIGHT, MUD = 16, 17, 27, 26
EARTH = 17      # bare, trodden village earth (A2 17 has a grass fringe built into its edges, so earth patches blend softly into grass)
TUFTS, SOFT, DRY, PEBBLES, FLOWERS = 21, 31, 39, 47, 29
FENCE, PLANKS = 22, 33
STUMP_TILE = 516    # D(4,0): Map003's "Pieniek" (tile event, <Stump>)
A5 = lambda i: 1536 + i
ROCK_FILL = (72, 73, 74, 80, 81, 82, 72, 73, 80, 81)   # the mountain rock (A5, blocked)
FACE_UP = (113,)               # A5 stone face, upper row (next to the tier top; blocked)
FACE_LOW = (121,)              # A5 stone face, lower row (the base of the cliff; blocked)
LEDGE_RIM_N, LEDGE_RIM_S, LEDGE_FILL = 105, 89, 97   # A5 grass ledge: rim with the stone lip (lip toward the village), plain grass (region 2 keeps it blocked)


def mountain_profile(edge_depth=7):
    """The fixed MOUNTAIN PROFILE at a seam column (rows counted from the map edge; north: row 0 = y 0, south: row 0 = y H-1).
    Two cliff tiers stepping UP toward the edge: the highest tier (rocky top) at the edge, a cliff face below it, a lower tier top,
    a second cliff face, then the foot. All rows are blocked. Written to szwy.json as "gory_profil"."""
    a = max(1, edge_depth - 5)
    return {
        "opis": "wiersze liczone od krawedzi mapy (polnoc: y=r, poludnie: y=79-r); glebokosc na kolumnach szwu = %d; miedzy szwami pas moze byc glebszy "
                "(do +2) w dlugich gladkich odcinkach; WS.mountains daje dokladnie ten profil na kazdym szwie" % edge_depth,
        "wiersze": [
            {"wiersze": [0, a - 1], "rola": "szczyt_skalny (najwyzszy poziom, skala)", "kafle_A5": [72, 73, 74, 80, 81, 82]},
            {"wiersze": [a, a], "rola": "lico klifu 1, gorny rzad", "kafle_A5": [113]},
            {"wiersze": [a + 1, a + 1], "rola": "lico klifu 1, dolny rzad (podstawa)", "kafle_A5": [121]},
            {"wiersze": [a + 2, a + 2], "rola": "nizszy poziom: trawiasta polka z kamienna krawedzia od strony wsi (polnoc: A5 105, poludnie: A5 89), region 2 (zablokowana)",
             "kafle_A5": [105, 89]},
            {"wiersze": [a + 3, a + 3], "rola": "lico klifu 2, gorny rzad", "kafle_A5": [113]},
            {"wiersze": [a + 4, a + 4], "rola": "lico klifu 2, dolny rzad (podstawa)", "kafle_A5": [121]},
        ],
        "stopa": "od wiersza %d: grunt wsi (trawa/ziemia), osyp, glazy, paprocie, kilka sosen" % edge_depth,
        "boki_zachod_wschod": "stopa gor 3-4 kolumny od krawedzi: kolumna(y) skaly, potem 2 kolumny licia (gorny/dolny rzad jak wyzej)",
        "wszystko_zablokowane": True,
    }


def rect(x0, y0, x1, y1):
    """set of (x, y) cells of the inclusive rectangle, clipped to the map"""
    return {(x, y) for y in range(y0, y1 + 1) for x in range(x0, x1 + 1) if 0 <= x < W and 0 <= y < H}


def lane(pts, width, wobble=0.2, seed=5):
    """cells within width/2 of the polyline pts (cell centres); wobble 0 = clean straight edges"""
    cells = set()
    for (ax, ay), (bx, by) in zip(pts, pts[1:]):
        n = int(max(abs(bx - ax), abs(by - ay)) * 3) + 1
        for i in range(n + 1):
            t = i / n
            cx, cy = ax + (bx - ax) * t, ay + (by - ay) * t
            r = width / 2.0 + wobble * (noise(int(cx * 2), int(cy * 2), seed) - 0.5) * 2
            for y in range(int(cy - r - 1), int(cy + r + 2)):
                for x in range(int(cx - r - 1), int(cx + r + 2)):
                    if (x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= r * r and 0 <= x < W and 0 <= y < H: cells.add((x, y))
    return cells


def blob(cx, cy, rx, ry, seed, rough=0.3):
    """cells of a soft ellipse (rough = edge noise)"""
    out = set()
    for y in range(int(cy - ry - 2), int(cy + ry + 3)):
        for x in range(int(cx - rx - 2), int(cx + rx + 3)):
            if not (0 <= x < W and 0 <= y < H): continue
            v = ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2
            if v <= 1 + rough * (noise(x, y, seed) - 0.5) * 2: out.add((x, y))
    return out


def smooth(cells, iters=2):
    """majority filter (3x3, >= 5 of 9): removes spikes and notches so road and bed edges run in soft, even curves; seam-safe at the map edge"""
    cells = set(cells)
    for _ in range(iters):
        cand = {(x + dx, y + dy) for (x, y) in cells for dx in (-1, 0, 1) for dy in (-1, 0, 1)}
        new = set()
        for (x, y) in cand:
            if not (0 <= x < W and 0 <= y < H): continue
            # (cells off the map count like their clamped neighbour: a band running over the map edge keeps its full width - seams!)
            n = sum(1 for dx in (-1, 0, 1) for dy in (-1, 0, 1)
                    if (min(W - 1, max(0, x + dx)), min(H - 1, max(0, y + dy))) in cells)
            if n >= 5: new.add((x, y))
        cells = new
    return cells


def smooth_polyline(pts, step=1.0):
    """Catmull-Rom through the points -> dense polyline (so the road and the bed bend softly)"""
    out = []
    P_ = [pts[0]] + list(pts) + [pts[-1]]
    for i in range(1, len(P_) - 2):
        p0, p1, p2, p3 = P_[i - 1], P_[i], P_[i + 1], P_[i + 2]
        n = max(2, int(math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / step))
        for k in range(n):
            t = k / n
            out.append(tuple(0.5 * ((2 * p1[j]) + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t * t
                                    + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t ** 3) for j in (0, 1)))
    out.append(tuple(pts[-1]))
    return out


class WorldBuild:
    """Base of a map builder: owns the Pod map (self.mp) and the bookkeeping: self.occ (cells with things, no decor there),
    self.roads / self.hard (earth roads and plazas / lanes only), self.bed (riverbed floor), self.huts (hut records), self.log."""

    def __init__(self, map_id, name, note, seed=1, w=80, h=80):
        self.mp = P.Pod(seed=seed)
        self.mp.props["note"] = note
        self.mp.props["displayName"] = name
        self.hard = set()
        self.roads = set()
        self.occ = set()
        self.paths = set()
        self.bed = set()
        self.belt = set()
        self.meadow = set()
        self.log = []
        self.bridges = []
        self.huts = {}

    def free(self, cells, allow_road=False):
        mp = self.mp
        for c in cells:
            if not (0 <= c[0] < W and 0 <= c[1] < H): return False
            if c in self.occ or c in self.belt or c in mp.taken: return False
            if not allow_road and (c in self.hard or c in self.bed): return False
            if c in mp.layers[2] or c in mp.layers[3] or c in mp.layers[1] and mp.layers[1][c][1] in (FENCE,): return False
        return True

    def thing(self, name, x, y, allow_road=False):
        c, r, w, h = P.THINGS[name]
        cells = [(x + i, y - h + 1 + j) for i in range(w) for j in range(h)]
        if not self.free(cells, allow_road):
            self.log.append("skip thing %s at %d,%d" % (name, x, y)); return False
        self.mp.thing(name, x, y)
        self.occ.update(cells)
        return True

    def prop(self, name, x, y, label=None, cmds=None):
        import build_town_props as TP
        cells = TP.footprint(name, x, y) or [(x, y)]
        if not self.free(cells + [(x, y)]):
            self.log.append("skip prop %s at %d,%d" % (name, x, y)); return False
        self.mp.town_prop(name, x, y, label=label, cmds=cmds)
        self.occ.update(cells)
        return True

    def clump(self, name, x, y):
        if not self.free([(x, y)]): return False
        self.mp.clump(name, x, y)
        self.occ.add((x, y))
        return True

    def stump(self, x, y):
        if not self.free([(x, y)]): return False
        if self.mp.put(x, y, "tile%d" % STUMP_TILE, name="Pieniek"):
            self.occ.add((x, y)); return True
        return False

    def fence(self, cells, force=False):
        cells = {c for c in cells if 0 <= c[0] < W and 0 <= c[1] < H and c not in self.roads and (force or c not in self.occ)}
        self.mp.kind(1, cells, FENCE)
        self.occ.update(cells)

    def reserve(self, cells):
        self.occ.update(cells)

    def path(self, pts, w=1.6, seed=3):
        cs = lane(pts, w, 0.25, seed) - self.bed
        for c in cs:
            if c in self.occ and c not in self.roads: continue
            self.mp.layers[0][c] = ("k", EARTH)
            self.mp.layers[1].pop(c, None)
        self.roads |= cs
        return cs

    def lamp(self, x, y, name):
        """a wooden lantern post (the laundry pole C 8,13..15 with the flame as an event on top): fire only"""
        mp = self.mp
        cells = [(x, y), (x, y - 1), (x, y - 2)]
        if not self.free(cells, allow_road=True): self.log.append("skip lamp %d,%d" % (x, y)); return
        mp.tl(x, y - 2, C(8, 13), 3); mp.tl(x, y - 1, C(8, 14), 3); mp.tl(x, y, C(8, 15), 2)
        note = "<Light:150,90,62,24><LightWhen:night>"
        mp.light(x, y - 2, "!Decoration", 7, 2, 0, name, note, priority=2, through=True)
        mp.region[(x, y)] = 2
        self.occ |= set(cells)

    def say(self, x, y, name, *lines):
        mp = self.mp
        mp.ev(x, y, P.event(name, x, y, None, priority=1, cmds=P.text_cmds(*lines)))

    def sign(self, x, y, name, *lines):
        if not self.free([(x, y), (x, y - 1)], allow_road=True): self.log.append("skip sign"); return
        self.thing("signpost", x, y, allow_road=True)
        self.say(x, y, name, *lines)

    def laundry(self, x0, y_top, items):
        mp = self.mp
        xr = x0 + 1 + len(items)
        cells = rect(x0, y_top, xr, y_top + 2)
        if not self.free(list(cells)): self.log.append("skip laundry %d,%d" % (x0, y_top)); return
        for j in range(3): mp.tl(x0, y_top + j, C(8, 13 + j))
        for i, (c, r) in enumerate(items): mp.tl(x0 + 1 + i, y_top, C(c, r))
        for j in range(3): mp.tl(xr, y_top + j, C(15, 13 + j))
        for xx in range(x0, xr + 1): mp.region[(xx, y_top)] = 3
        mp.region[(x0, y_top + 1)] = 3; mp.region[(xr, y_top + 1)] = 3
        self.occ |= {(x0, y_top + 2), (xr, y_top + 2), (x0, y_top + 1), (xr, y_top + 1)}
        self.occ |= {(xx, y_top) for xx in range(x0, xr + 1)}

    def dead_tree(self, tx, ty):
        mp = self.mp
        cells = {(tx - 2 + c, ty - 8 + r) for r in range(3, 9) for c in range(1, 4) if (c, r) not in ((1, 8), (3, 8))}
        if any(c in mp.layers[3] or c in self.occ for c in cells): return False
        for r in range(3, 9):
            for c in range(1, 4):
                if (c, r) in ((1, 8), (3, 8)): continue
                mp.tl(tx - 2 + c, ty - 8 + r, E(c, r), 3)
        mp.region[(tx, ty)] = 2
        self.occ |= {(tx, ty), (tx - 1, ty), (tx + 1, ty)}
        return True

    def hut(self, d):
        mp = self.mp
        x, y, w = d["x"], d["y"], d["w"]
        rec = mp.house(d["k"], d["n"], x, y, w, 3, 2, d["roof"], d["wall"], d["door"], door_pic=("!Fantasy_door1", d.get("di", 2)),
                       windows=d.get("win", ()), chimney=None, ivy=d.get("ivy", ()), lean=d.get("lean"), lean_fill=d.get("fill"),
                       interior=None, closed_text="Zamknięte. Nikogo nie ma w domu.")
        # door: a placeholder (no interior yet), named like the town's doors
        ev = rec["event"]
        ev["name"] = "Drzwi: " + d["n"]
        ev["note"] = "<Town:door=%s>" % d["k"]
        self.chimney(x, y, d["ch"], d["cs"])
        r = rec["rect"]
        if d.get("lean"):
            lx = x + w if d["lean"] == "right" else x - 1
            for j in range(4): mp.region[(lx, r[3] - 3 + j)] = 2
        x0 = r[0] - (1 if d.get("lean") == "left" else 0)
        x1 = r[2] + (1 if d.get("lean") == "right" else 0)
        cells = rect(x0, y - 1, x1, r[3]) | {(rec["door"][0], rec["door"][1] + 1)}
        self.occ |= cells
        self.huts[d["k"]] = rec
        mp.spot(d["k"] + "_drzwi", rec["door"][0], rec["door"][1] + 1, 2)
        # a path from the door
        return rec

    def chimney(self, x, y, col, style):
        """the cap in the roof's top row, the shaft below it (2026-10-23: chimneys stood over the grass behind the house)"""
        mp = self.mp
        cx = x + col
        mp.tl(cx, y, B(style, 10), 3); mp.tl(cx, y + 1, B(style, 11), 3)
        mp.picture(cx, y, "!Fantasy_chimney", 0, 2, (cx + y) % 3, name="Dym z komina", priority=2, through=True, step=True)

    def yard(self, d, beds="both", fence=None):
        if d.get("garden"): self.garden_for(d)

    def garden_at(self, gx0, gy0, gx1, gate_side="L"):
        """A small fenced vegetable bed at any free place: soil rows gy0 (crops), gy0+1 (soil), gy0+2 (crops) between columns gx0..gx1,
        a fence ring one cell outside it, a one-cell gate on gate_side ('L' or 'R'). Returns True when it fit."""
        mp = self.mp
        ring = rect(gx0 - 1, gy0 - 1, gx1 + 1, gy0 + 3)
        gate = {(gx0 - 1, gy0 + 1)} if gate_side == "L" else {(gx1 + 1, gy0 + 1)}
        if not self.free(list(ring)): self.log.append("no room for a garden at %d,%d" % (gx0, gy0)); return False
        soil = rect(gx0, gy0, gx1, gy0 + 2)
        for c in soil:
            mp.layers[0][c] = ("k", EARTH); mp.layers[1].pop(c, None)
        for x in range(gx0, gx1 + 1):
            mp.tl(x, gy0, C(5 + (x + gy0) % 3, 2), 2)
            mp.tl(x, gy0 + 2, C(5 + (x + gy0 + 1) % 3, 3), 2)
        self.fence(ring - soil - gate, force=True)
        self.occ |= ring
        return True

    def garden_for(self, d):
        """a small fenced vegetable bed beside the door path: rows of crop tiles (C 5..7, 2..3) on soil, a gate toward the path"""
        mp = self.mp
        rec = self.huts[d["k"]]
        dx, dy = rec["door"]
        for side in ("R", "L"):
            if side == "R": gx0 = dx + 3; gx1 = gx0 + 3
            else: gx1 = dx - 3; gx0 = gx1 - 3
            ring = rect(gx0 - 1, dy + 1, gx1 + 1, dy + 5)
            gate = {(gx0 - 1, dy + 3)} if side == "R" else {(gx1 + 1, dy + 3)}
            if not self.free(list(ring)): continue
            soil = rect(gx0, dy + 2, gx1, dy + 4)
            for c in soil:
                mp.layers[0][c] = ("k", EARTH); mp.layers[1].pop(c, None)
            for x in range(gx0, gx1 + 1):
                mp.tl(x, dy + 2, C(5 + (x + dy) % 3, 2), 2)
                mp.tl(x, dy + 4, C(5 + (x + dy + 1) % 3, 3), 2)
            self.fence(ring - soil - gate, force=True)
            self.occ |= ring
            return True
        self.log.append("no room for a garden at %s" % d["k"])
        return False

    def door_placeholder(self, x, y, name, key, index=5, text="Zamknięte. Nikogo nie ma w domu."):
        """A door of !Fantasy_door1 (character index) with a placeholder event: touching it only shows the 'closed' popup. Named
        'Drzwi: <name>' and noted <Town:door=key> so the later interior install can find it. Returns the event."""
        return self.mp.picture(x, y, "!Fantasy_door1", index, 2, 0, name="Drzwi: " + name, priority=1, trigger=1,
                               cmds=P.popup_cmds(text), note="<Town:door=%s>" % key)


    def distance(self, sources, limit=8):
        """Chebyshev distance of every cell to the nearest source cell, up to limit (cells further away get limit + 1)"""
        dist = {c: 0 for c in sources}
        frontier = list(sources)
        for d in range(1, limit + 1):
            nxt = []
            for (x, y) in frontier:
                for dx in (-1, 0, 1):
                    for dy in (-1, 0, 1):
                        c = (x + dx, y + dy)
                        if c not in dist and 0 <= c[0] < W and 0 <= c[1] < H:
                            dist[c] = d; nxt.append(c)
            frontier = nxt
        return dist

    def earth_and_grass(self, seed=7, threshold=0.50):
        """The ground style of the poor villages (Podgrodzie, Miasteczko): bare trodden earth (A2 24) with grass (A2 16) in soft
        patches and tufts (A2 21). Grass is denser away from roads and yards and along fences, walls and the mountain foot, and
        thins out near doors and roads. Patches are smoothed (no speckle, no squares) and tiny islands are dropped."""
        mp = self.mp
        busy = set(self.roads) | set(self.hard)
        for rec in self.huts.values(): busy.add(tuple(rec["front"])) if "front" in rec else None
        dist = self.distance(busy, 8)
        solid = {c for c, v in mp.layers[1].items() if v[0] == "k" and v[1] in (FENCE, 38)} | set(getattr(self, "mass", set()))
        near_solid = self.distance(solid, 3)
        cand = {c for c in mp.all if mp.layers[0].get(c, ("k", 0)) == ("k", GRASS) and c not in self.meadow and c not in self.bed and c not in self.roads and c not in self.hard and mp.region.get(c) != 8
                and c not in getattr(self, "mass", set())}
        raw = set()
        for c in cand:
            x, y = c
            f = 0.55 * lowfreq(x, y, seed, 8.0) + 0.45 * lowfreq(x, y, seed + 1, 3.5)
            d = dist.get(c, 9)
            v = f + 0.34 * min(1.0, d / 6.0) - (0.30 if d <= 1 else 0.0)
            ns = near_solid.get(c, 4)
            if 1 <= ns <= 2: v += 0.16
            if c in getattr(self, "mass", set()) or ns <= 3 and c[1] in range(0, 12) or ns <= 3 and (c[1] > 66): v += 0.12
            if v > threshold: raw.add(c)
        grass = smooth(raw, 3) & cand
        # drop tiny islands
        seen, keep = set(), set()
        for c in grass:
            if c in seen: continue
            comp, stack = [], [c]
            seen.add(c)
            while stack:
                p = stack.pop(); comp.append(p)
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    q = (p[0] + dx, p[1] + dy)
                    if q in grass and q not in seen: seen.add(q); stack.append(q)
            if len(comp) >= 10: keep |= set(comp)
        for c in cand - keep:
            mp.layers[0][c] = ("k", EARTH)
        for c in cand:
            if c in mp.layers[1] or c in self.occ: continue
            v = noise(c[0], c[1], 91)
            if c in keep:
                edge = any((c[0] + dx, c[1] + dy) not in keep for dx in (-1, 0, 1) for dy in (-1, 0, 1))
                if (edge and v < 0.22) or v < 0.04: mp.layers[1][c] = ("k", TUFTS)
            elif v < 0.035 and dist.get(c, 9) >= 2:
                mp.layers[1][c] = ("k", TUFTS)          # lone tufts of grass on the bare earth
        self.grass = keep

    @staticmethod
    def profile(n, lo, base, hi, seed, scale, min_run=9):
        vals = []
        for i in range(n):
            v = lowfreq(i, 0, seed, scale)
            vals.append(lo if v < 0.38 else hi if v > 0.64 else base)
        for _ in range(4):
            runs, i = [], 0
            while i < n:
                j = i
                while j + 1 < n and vals[j + 1] == vals[i]: j += 1
                runs.append([i, j]); i = j + 1
            for k, (a, b) in enumerate(runs):
                if b - a + 1 < min_run and len(runs) > 1:
                    nb = runs[k - 1] if k > 0 else runs[k + 1]
                    for t in range(a, b + 1): vals[t] = vals[nb[0]]
        return vals


    def mountains(self, west_pieces, east_pieces, north=(7, 7, 8), south=(7, 7, 7), edge_depth=7, max_depth=None):
        """The valley's walls: real mountains in two tiers that step UP toward the map edge (north and south edge) and a lower foot on the
        west / east edges. Built from tileset 11's A5 cliff pieces, all BLOCKED: a rocky top (A5 72-75/80-83), a stone cliff face of
        two rows (upper 113/118/119, lower 121/126/127), a lower tier top, a second face. Tier lines change by whole rows only
        in long smooth runs (>= 9 columns), so the outline bulges inward 1-2 rows but is never ragged; tier tops are rock (never
        walkable-looking grass), so nothing walkable-looking sits behind a cliff.
        SEAM CONTRACT: at x=0 and x=W-1 (and 10 columns in) the profile is exactly mountain_profile(edge_depth): rows 0-6 and 73-79
        for edge_depth 7. Between the seams the band may be deeper: north=(lo, base, hi) / south=(lo, base, hi): hi is the greatest total
        depth (hi - edge_depth = how far it may bulge); max_depth(x) -> int optionally caps the depth per column.
        west_pieces / east_pieces: [(row0, row1)] stretches where the side foot (3-4 columns) stands; the rest of those edges stays
        open (road, bed, meadow). Sets self.mass (cells), self.dN / self.dS (total depth per column), self.dW / self.dE (columns per
        row), self.tiers_N / self.tiers_S ((top A rows, top B rows) per column); adds the cells to self.occ."""
        mp = self.mp
        topA0 = max(1, edge_depth - 5)
        def extra_profile(n, hi, seed, cap):
            em = max(0, hi - edge_depth)
            e = self.profile(n, 0, min(1, em), em, seed, 34.0) if em else [0] * n
            for i in range(10): e[i] = e[n - 1 - i] = 0
            if cap: e = [min(e[i], max(0, cap(i) - edge_depth)) for i in range(n)]
            return e
        eN = extra_profile(W, north[2], 501, max_depth)
        eS = extra_profile(W, south[2], 502, None)
        mass = set()
        def rock(x, y):
            mp.tile(0, x, y, A5(ROCK_FILL[int(noise(x, y, 77) * len(ROCK_FILL))]))
            for z in (1, 2, 3): mp.layers[z].pop((x, y), None)
            mp.region.pop((x, y), None)
            mass.add((x, y))
        def face(x, y, low):
            ids = FACE_LOW if low else FACE_UP
            mp.tile(0, x, y, A5(ids[int(noise(x, y, 79) * len(ids))]))
            for z in (1, 2, 3): mp.layers[z].pop((x, y), None)
            mp.region.pop((x, y), None)
            mass.add((x, y))
        def tiers(n_top_a, n_top_b):
            """role of each row counted from the edge: 0 rock, 1 face upper, 2 face lower, 3 ledge grass, 4 ledge rim (toward the village)"""
            return [0] * n_top_a + [1, 2] + [3] * (n_top_b - 1) + [4] + [1, 2]
        dN, dS, tN, tS = [], [], [], []
        for x in range(W):
            for (e, depth_list, tier_list, north_side) in ((eN[x], dN, tN, True), (eS[x], dS, tS, False)):
                a = topA0 + (e + 1) // 2; b = 1 + e // 2
                roles = tiers(a, b)
                depth_list.append(len(roles)); tier_list.append((a, b))
                for r, role in enumerate(roles):
                    y = r if north_side else H - 1 - r
                    if role == 0: rock(x, y)
                    elif role in (1, 2): face(x, y, role == 2)
                    else:
                        mp.tile(0, x, y, A5(LEDGE_FILL if role == 3 else (LEDGE_RIM_N if north_side else LEDGE_RIM_S)))
                        for z in (1, 2, 3): mp.layers[z].pop((x, y), None)
                        mp.region[(x, y)] = 2; mass.add((x, y))
        # the side foot: rock top column(s) at the edge, then two columns of face (upper next to the top, lower at the base)
        dW = self.profile(H, 3, 3, 4, 503, 24.0); dE = self.profile(H, 3, 3, 4, 504, 24.0)
        def side(cols, y, west):
            for c in range(cols):
                x = c if west else W - 1 - c
                if c < cols - 2: rock(x, y)
                else: face(x, y, c == cols - 1)
        for (y0, y1) in west_pieces:
            for y in range(y0, y1 + 1): side(dW[y], y, True)
        for (y0, y1) in east_pieces:
            for y in range(y0, y1 + 1): side(dE[y], y, False)
        self.mass = mass; self.dN, self.dS, self.dW, self.dE = dN, dS, dW, dE
        self.tiers_N, self.tiers_S = tN, tS
        self.occ |= mass


    def foot(self):
        """Life on and at the foot of the mountains: peaks (real !$Rock_Spire / Column / Tall pictures on the highest, rocky tier - out of
        reach), pines standing on the lower tier, and at the foot: pines, whole boulders (D 9..10, 3..4: 2x2, blocked), scree (flat
        stones) and ferns. Never within 8 columns of a seam, nothing cut off. Uses self.mass, self.dN / self.dS, self.tiers_N / self.tiers_S."""
        mp = self.mp
        rnd = random.Random(21)
        self.foot_trees = []
        mine = []
        far = lambda x, y, d: all(abs(x - a) >= d or abs(y - b) >= 3 for (a, b) in mine)
        # peaks on the highest tier (its bottom row), spaced out
        for x in range(10, W - 10):
            if rnd.random() < 0.09:
                for north_side, tl in ((True, self.tiers_N), (False, self.tiers_S)):
                    a = tl[x][0]
                    y = a - 1 if north_side else H - a
                    if 1 <= y <= H - 2 and far(x, y, 7) and (x, y) not in mp.taken:
                        if mp.put(x, y, rnd.choice(["!$Rock_Spire", "!$Rock_Column", "!$Rock_Tall"]), name="Szczyt (skala)", force=True):
                            mine.append((x, y)); self.occ.add((x, y))
        # pines on the lower tier's top (it is rock: the trunk stands on a ledge; the crown rises over the cliff above)
        for x in range(10, W - 10):
            if rnd.random() < 0.06:
                for north_side, tl in ((True, self.tiers_N), (False, self.tiers_S)):
                    a, b = tl[x]
                    y = a + 2 if north_side else H - 1 - (a + 2)
                    if far(x, y, 6) and (x, y) not in mp.taken and rnd.random() < (1.0 if north_side else 0.5):
                        mp.tree(x, y, rnd.choice(["pine", "pine_b"]), name="Sosna (ozdobna)"); mine.append((x, y)); self.occ.add((x, y))
        # at the foot
        def pine(x, y, k):
            cells = [(x + dx, y) for dx in (-1, 0, 1)]
            if not self.free(cells) or any(abs(x - a) < 5 and abs(y - b) < 4 for (a, b) in self.foot_trees): return False
            mp.tree(x, y, k, name="Sosna (ozdobna)"); self.occ.add((x, y)); self.foot_trees.append((x, y)); return True
        for x in range(10, W - 10):
            if rnd.random() < 0.07: pine(x, self.dN[x] + rnd.choice((1, 2)), rnd.choice(("pine", "pine", "pine_b", "leafy")))
            if rnd.random() < 0.06: pine(x, H - self.dS[x] - rnd.choice((2, 3)), rnd.choice(("pine", "pine_b")))
        for y in range(12, 68):
            if 24 <= y <= 50: continue
            if rnd.random() < 0.05: pine(self.dW[y] + 1, y + 1, "pine")
            if rnd.random() < 0.05: pine(W - self.dE[y] - 2, y + 1, "pine")
        # whole boulders at the foot (2x2 objects, blocked), scree and ferns on the ground next to the cliffs
        for x in range(10, W - 12):
            for (y, ok) in ((self.dN[x], True), (H - self.dS[x] - 2, True)):
                if rnd.random() < 0.025:
                    cells = [(x, y), (x + 1, y), (x, y + 1), (x + 1, y + 1)]
                    if self.free(cells) and all(abs(x - bx) > 12 for (bx, by) in getattr(self, "_boulders", [])):
                        mp.piece("D", 9, 3, 2, 2, x, y); self.occ |= set(cells); self._boulders = getattr(self, "_boulders", []) + [(x, y)]
        for x in range(2, W - 2):
            for y in (self.dN[x], H - self.dS[x] - 1):
                if noise(x, y, 31) < 0.22 and self.free([(x, y)]) and mp.layers[0].get((x, y), ("k", 0))[1] in (GRASS, GRASS_LIGHT, EARTH):
                    mp.tl(x, y, D(10 + (x % 2), 5), 2); self.occ.add((x, y))
                elif noise(x, y, 33) < 0.07 and self.free([(x, y)]):
                    mp.tl(x, y, D(9 + (x % 3), 7), 2); self.occ.add((x, y))

    def bank(self, faces, ramps, bridges):
        """The north bank of a dry riverbed (or any sunken ground): straight runs of stone face (A5 rim 104-106 + face 112-114 /
        120-122; blocked) with end caps, gaps filled with earth slopes (ramps) and plank footbridges bank to bank.
        faces: [(x0, x1, rim_row, capL, capR)]; ramps: [(xa, xb, rim_row)]; bridges: [(centre_x, first_row, last_row)]"""
        mp = self.mp
        def seg(x0, x1, rim, capL, capR):
            for x in range(x0, x1 + 1):
                k = 0 if (capL and x == x0) else 2 if (capR and x == x1) else 1
                for j, base in enumerate((104, 112, 120)):
                    mp.tile(0, x, rim + j, A5(base + k))
                    for z in (1, 2, 3): mp.layers[z].pop((x, rim + j), None)
                    self.occ.add((x, rim + j))
        for (x0, x1, rim, cl, cr) in faces: seg(x0, x1, rim, cl, cr)
        for (xa, xb, rim) in ramps:
            for x in range(xa, xb + 1):
                for j in range(3):
                    mp.layers[0][(x, rim + j)] = ("k", EARTH)
                    for z in (1, 2, 3): mp.layers[z].pop((x, rim + j), None)
                    self.occ.add((x, rim + j))
            # a couple of flat stepping stones on the slope
            mp.tl(xa, rim + 1, D(10, 6), 2); mp.tl(xb, rim + 2, D(9, 6), 2)
        # the footbridges: a plank deck bank to bank over the drop, rails either side
        for (bx, r0, r1) in bridges:
            deck = rect(bx - 1, r0, bx + 1, r1)
            mp.kind(1, deck, PLANKS)
            rails = rect(bx - 2, r0 + 1, bx - 2, r1 - 1) | rect(bx + 2, r0 + 1, bx + 2, r1 - 1)
            for c in rails: mp.layers[1].pop(c, None)
            mp.kind(1, rails, FENCE)
            self.occ |= deck | rails
            self.roads -= deck
            self.bridges.append({"x": bx, "y0": r0, "y1": r1})

    def bed_details(self, boulders=5, reeds=22, x_margin=6, first_row=56):
        """Natural detail of a dry riverbed: a few boulders (D 9..10, 3..4: 2x2, blocked), dry reeds (B 7,11..13) along the south edge and
        scattered flat stones. Needs self.bed (floor cells) and self.bed_south(x)."""
        mp = self.mp
        g = self.bed
        # boulders (D 9..10, 3..4: 2x2, bottom blocked) and dry reeds (B 7,11..13) in the bed
        rnd = random.Random(14)
        cand = sorted(c for c in g if x_margin - 1 < c[0] < W - x_margin)
        placed, xs = 0, []
        for (x, y) in rnd.sample(cand, len(cand)):
            if placed >= boulders: break
            if y < first_row or y > self.bed_south(x) - 1: continue
            cells = [(x, y), (x + 1, y), (x, y + 1), (x + 1, y + 1)]
            if all(c in g for c in cells) and self.free(cells, True) and all(abs(x - px) > 8 for px in xs):
                mp.piece("D", 9, 3, 2, 2, x, y); self.occ |= set(cells); xs.append(x); placed += 1
        n = 0
        for x in range(x_margin, W - x_margin - 2):
            if n >= reeds: break
            y = self.bed_south(x)
            if (x, y) in g and noise(x, y, 61) < 0.07 and self.free([(x, y), (x, y - 1), (x, y - 2)], True):
                mp.tl(x, y - 2, B(7, 11), 3); mp.tl(x, y - 1, B(7, 12), 3); mp.tl(x, y, B(7, 13), 2)
                self.occ |= {(x, y), (x, y - 1), (x, y - 2)}; n += 1
        # scattered flat stones, only here and there
        for (x, y) in sorted(g):
            if not (x_margin - 1 < x < W - x_margin) or (x, y) in self.occ: continue
            v = noise(x, y, 63)
            if v < 0.035: self.clump("stones", x, y)
            elif v < 0.05: self.clump("stone", x, y)

    def resources(self, stumps=(), rocks=(), bushes=(), trees=(), logs=()):
        """Put REAL gatherable objects, copied from Map003's working event templates (nslib.TMPL): diggable stumps ('Pieniek', tile 516,
        <Stump>), mineable picture rocks ('!$Rock_Flat' ...), choppable bare bushes ('!$Bush_Bare_A' ...), a fruit tree ('!$Tree_Apple' /
        '!$Tree_Pear') and a log ('!$Trunk_Dead', <Log:hits=2>). stumps: [(x, y)]; rocks/bushes/trees/logs: [(x, y, template)].
        Returns the list of (template, x, y) that were placed."""
        mp = self.mp
        used = []
        def put(x, y, tmpl, name=None):
            if (x, y) in mp.taken: return
            if mp.put(x, y, tmpl, name=name):
                used.append((tmpl, x, y)); self.occ.add((x, y))
        for (x, y) in stumps: put(x, y, "tile%d" % STUMP_TILE, "Pieniek")
        for (x, y, k) in list(rocks) + list(bushes) + list(trees) + list(logs): put(x, y, k)
        return used

    def life(self, zones, clusters=85):
        """Natural life in the empty parts: clusters of ferns, wildflowers and weeds (walkable tile details, never takeable-looking items),
        plus a few REAL small rocks (!$Rock_*) and bare bushes (!$Bush_Bare_*) from Map003's templates, 2 + 2 in each zone (x0, y0, x1, y1)."""
        mp = self.mp
        rnd = random.Random(33)
        kinds = ["fern", "fern_b", "fern_c", "white_fl", "white_fl_b", "yellow_fl", "weed"]
        def ok(c):
            return (c not in self.occ and c not in self.hard and c not in self.bed and c not in mp.taken
                    and mp.layers[0].get(c, ("k", 0))[1] in (GRASS, GRASS_LIGHT) and c not in mp.layers[2] and c not in mp.layers[3]
                    and mp.region.get(c) != 8 and 5 <= c[0] <= W - 6 and 9 <= c[1] <= H - 8)
        spots = [c for c in sorted(mp.all) if ok(c)]
        for i in range(clusters):
            cx, cy = rnd.choice(spots)
            k = rnd.choice(kinds)
            for j in range(rnd.randint(2, 5)):
                c = (cx + rnd.randint(-2, 2), cy + rnd.randint(-1, 1))
                if ok(c):
                    mp.clump(rnd.choice([k, k, rnd.choice(kinds)]), c[0], c[1]); self.occ.add(c)
        # real rocks (mineable) and bare bushes (choppable): copied templates, a few in the empty parts
        got = 0
        for (x0, y0, x1, y1) in zones:
            for _ in range(2):
                x, y = rnd.randint(x0, x1), rnd.randint(y0, y1)
                tmpl = rnd.choice(["!$Rock_Flat", "!$Rock_Mossy", "!$Rock_Pile", "!$Rock_Cairn"])
                if ok((x, y)) and ok((x + 1, y)) and mp.put(x, y, tmpl): self.occ |= {(x, y), (x + 1, y)}; got += 1
            for _ in range(2):
                x, y = rnd.randint(x0, x1), rnd.randint(y0, y1)
                if ok((x, y)) and mp.put(x, y, rnd.choice(["!$Bush_Bare_A", "!$Bush_Bare_B"])): self.occ.add((x, y)); got += 1
        self.life_events = got

    def stumps_and_scrub(self):
        mp = self.mp
        rnd = random.Random(11)
        cands = [c for c in sorted(mp.all) if c not in self.occ and c not in self.belt and c not in self.roads and c not in self.bed
                 and mp.layers[0].get(c, ("k", 0))[1] in (GRASS, GRASS_LIGHT, EARTH) and 4 <= c[0] < W - 4 and 4 <= c[1] < H - 4
                 and c not in mp.layers[2] and c not in mp.layers[3] and c not in mp.taken]
        # stumps everywhere (felled long ago): about 55, never close to each other, and none in the farmland
        n = 0
        rnd.shuffle(cands)
        mine = []
        for c in cands:
            if n >= 30: break
            if mp.region.get(c) == 8: continue
            if any(abs(c[0] - a) + abs(c[1] - b) < 6 for (a, b) in mine): continue
            if any((c[0] + dx, c[1] + dy) in self.occ for dx in (-1, 0, 1) for dy in (-1, 0, 1)): continue
            if self.stump(*c): mine.append(c); n += 1
        # grass details: tufts of tall grass round buildings and fences, ferns, flowers, weeds
        for (x, y) in sorted(mp.all):
            c = (x, y)
            if c in self.roads or c in self.bed or c in self.belt or c in mp.layers[1] or c in mp.layers[2] or c in mp.layers[3]: continue
            if mp.region.get(c) == 8: continue
            if mp.layers[0].get(c, ("k", 0))[1] not in (GRASS, GRASS_LIGHT): continue
            near = any((x + dx, y + dy) in self.occ for dx in (-1, 0, 1) for dy in (-1, 0, 1))
            v = noise(x, y, 121)
            if near and v < 0.5: mp.layers[1][c] = ("k", TUFTS if v < 0.3 else SOFT)
            elif v > 0.992 and c not in self.occ and c not in mp.taken:
                mp.tl(x, y, rnd.choice([D(9, 7), D(10, 7), D(11, 7), D(13, 10), D(12, 9)]), 2)

    def regions(self):
        """eagle landing: region 31 on every road cell (Orzel companion), away from the edges"""
        mp = self.mp
        # region 31 (the eagle's landing) on the main road and the shrine's crossing
        for c in self.roads:
            if mp.region.get(c) is None and 3 <= c[0] <= W - 4: mp.region[c] = 31

    def seam_report(self, path, seams_static, edges):
        """Write the seam contract (tools/nowy_swiat/szwy.json). edges: {"A": ("west", x), "B": ("east", x)} - for the seams this map owns
        the tile ids of the whole edge column (layers 0-3) and a run-length description of it; seams_static: dict of ready entries."""
        W_, H_ = W, H
        data = self.mp.resolve()
        mass = getattr(self, "mass", set())
        def cell(x, y):
            t = [data[z * W_ * H_ + y * W_ + x] for z in range(4)]
            c = (x, y)
            if c in mass: kind = "gora"
            elif 1536 + 104 <= t[0] <= 1536 + 122: kind = "skarpa_kamienna"
            elif c in self.bed: kind = "koryto"
            elif c in self.roads: kind = "droga"
            else: kind = "trawa_lub_ziemia"
            return t, kind
        out = dict(seams_static)
        out["gory_profil"] = mountain_profile()
        for key, (side, x) in edges.items():
            runs, col = [], []
            for y in range(H_):
                t, kind = cell(x, y)
                col.append(t)
                if runs and runs[-1][2] == kind: runs[-1][1] = y
                else: runs.append([y, y, kind])
            out[key]["kolumna_%s" % side] = {"x": x, "pasy": [{"wiersze": [a, b], "rodzaj": k} for a, b, k in runs],
                                             "kafle_warstwy_0_3_na_wiersz": col}
        with open(path, "wb") as f:
            f.write(json.dumps(out, ensure_ascii=False, indent=1).encode("utf-8"))
        return path

    def write(self):
        """Write the staged map (editor layout: one line per event, LF, UTF-8 no BOM) + its meta; returns (path, data, events, meta)"""
        return self.mp.write_staged()


def render_map(json_path, out_whole, shots, out_dir, chars_dir=None, whole_px=1600):
    """Render the staged map with tools/town/mzrender (the game's tile and sprite rules, no animation): the whole map scaled to
    whole_px, and 1280x720 screen shots at 1:1 (48 px tiles) centred on tiles: shots = {name: (tile_x, tile_y)}"""
    sys.path.insert(0, ROOT + "tools/town")
    import mzrender as R
    from PIL import Image
    if chars_dir: R.STAGED_CHARS = chars_dir
    mp = R.load_json(json_path)
    S = R.Sheets(mp["tilesetId"]); S.lenient = True
    im = R.render(mp, sheets=S).convert("RGB")
    if getattr(S, "missing", None): print("missing sheets:", S.missing)
    im.resize((whole_px, whole_px), Image.LANCZOS).save(out_whole, optimize=True)
    os.makedirs(out_dir, exist_ok=True)
    T = 48
    for name, (cx, cy) in shots.items():
        x0 = max(0, min(mp["width"] * T - 1280, int(cx * T + T / 2 - 640)))
        y0 = max(0, min(mp["height"] * T - 720, int(cy * T + T / 2 - 360)))
        im.crop((x0, y0, x0 + 1280, y0 + 720)).save(os.path.join(out_dir, name + ".png"), optimize=True)
    return im


def lint(map_id, staging_dir, quiet_trees=True):
    """Run the map rules linter (tools/mapy/kontrola.py) on a staged map and return its text (D4 'gatherable out of reach' lines of
    decorative border trees are dropped)"""
    out = subprocess.run([sys.executable, ROOT + "tools/mapy/kontrola.py", str(map_id), "--dane", staging_dir, "--bez-obrazka"],
                         capture_output=True, text=True, encoding="utf-8", errors="replace").stdout
    return "\n".join(l for l in out.splitlines() if not (quiet_trees and "D4 rzecz do zbierania" in l))
