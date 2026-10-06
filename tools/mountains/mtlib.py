# Shared pieces of the mountain maps (W8 "Żelazna Pięść": Góry i kamieniołom Map013, Jaskinia Map014, Osada Milczących Map120).
#   - MMap: an outdoor map on tileset 11 (the Winlu author's exterior set - the only one of ours with cliffs and their passage
#     flags), built on nslib's NewMap (Map003's own event kinds for trees, rocks, ore, bushes - the user's rule for outdoor maps:
#     every object is an event of the kinds the game starts with) plus terraces: a level per cell, the author's A5 plateau rims
#     and two rows of rock face below every southern edge, stairs cut through a face (tools/town/RECIPES.md 5, read off his own
#     sample maps Map015 / Map016)
#   - the walking check the game makes (tile flags top-down like Game_Map.checkPassage, blocking events and their <Occupy> /
#     ChoppableTree footprints) - for reach tests before anything is written
#   - pictures of the staged maps (tools/town/mzrender.py, tools/underground/uglib.py for the cave)
# Nothing here writes data/ (build.py does, with the editor closed).
import os, sys, json, copy, math, random
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..")).replace("\\", "/") + "/"
sys.path.insert(0, os.path.join(ROOT, "tools", "newstart"))
sys.path.insert(0, os.path.join(ROOT, "tools", "town"))
from nslib import (NewMap, TMPL, EXTRA, PINE, BARE, BARE_SMALL, ROCK_SMALL, ROCK_BIG, blank_page, floor_shape, wall_shape,   # noqa: F401
                   is_wall_kind, B, C, D, E, A5, kind_of, noise, lowfreq, line_dist, write_map, dump, path, blob, ring, patch)

TS = 11


def load_json(p):
    with open(p, "rb") as f:
        return json.loads(f.read().decode("utf-8"))


FLAGS11 = load_json(ROOT + "data/Tilesets.json")[TS]["flags"]

# ---------------------------------------------------------------------------------------------------- ground kinds (A2, tileset 11)
G_GRASS, G_EARTH_IN_GRASS, G_TALL, G_STONES, G_DIRT, G_GRASS_ON_DIRT, G_MUD = 16, 17, 21, 23, 24, 25, 26
G_LIGHT, G_FLOWERS, G_FLOWERS_SMALL, G_DARK_GRASS, G_MUD_FILM, G_MUD_STONES, G_PATH = 27, 28, 29, 31, 36, 37, 39
G_COBBLE, G_SCREE = 40, 47

# ---------------------------------------------------------------------------------------------------- the A5 cliff pieces
# a plateau's rim (its edge cells: walkable, flagged so one cannot step off), the face (two rows below its south edge, solid)
RIM = {
    "grass": {"TL": (0, 11), "T": (1, 11), "TR": (2, 11), "L": (0, 12), "C": (1, 12), "R": (2, 12), "BL": (0, 13), "B": (1, 13), "BR": (2, 13)},
    "dirt": {"TL": (5, 11), "T": (6, 11), "TR": (7, 11), "L": (5, 12), "C": (6, 12), "R": (7, 12), "BL": (5, 13), "B": (6, 13), "BR": (7, 13)},
}
FACE = {   # (upper row, lower row) x (left end, middle, right end)
    "grass": {"U": [(0, 14), (1, 14), (2, 14)], "L": [(0, 15), (1, 15), (2, 15)]},
    "dirt": {"U": [(5, 14), (6, 14), (7, 14)], "L": [(5, 15), (6, 15), (7, 15)]},
}
FACE_PLAIN = {"U": [(0, 9), (1, 9), (2, 9)], "L": [(0, 10), (1, 10), (2, 10)]}   # rock without grass: a few in the middle of long faces
GROUND_OF = {"grass": G_GRASS, "dirt": G_DIRT}
STAIRS = {   # A5 steps (rows of the sheet): a 1-wide flight is col 3, wider ones col 0 | col 1... | col 2
    "moss": 3, "stone": 4, "marble": 7, "dark": 6, "grass": 2,
}


def a5(cr):
    return A5(cr[0], cr[1])


class MMap(NewMap):
    """an outdoor map on tileset 11 with terraces"""

    def __init__(self, map_id, w, h, display, note, seed=1, bgm="", bgs=None, tileset=TS):
        NewMap.__init__(self, map_id, w, h, tileset, display, note, seed, bgm=bgm, autoplay=bool(bgm))
        self.props["autoplayBgm"] = bool(bgm)
        if bgs:
            self.props["bgs"] = {"name": bgs[0], "pan": 0, "pitch": bgs[2] if len(bgs) > 2 else 100, "volume": bgs[1]}
            self.props["autoplayBgs"] = True
        self.level = {}            # (x, y) -> level (default 0)
        self.style = {0: "grass"}  # level -> "grass" / "dirt" (its rims, faces and ground)
        self.faces = {}            # (x, y) -> ("U" | "L", level)
        self.rims = {}             # (x, y) -> rim key
        self.alias = {}            # layer-0 cells that count as kind k for their neighbours' autotile shapes (rims, stairs)
        self.stair_cells = set()
        self.face_h = {}           # level -> rows of rock face below its south edge (default 2; taller: plain rock rows between)
        self.solid = set()         # cells closed by tiles or events (for the checks; the game reads the flags)
        self.spots = {}            # marker key -> (x, y, dir)

    # ------------------------------------------------------------------------------------------------ autotiles with aliases
    def resolve(self):
        W, H = self.W, self.H
        data = [0] * (W * H * 6)
        for z in range(4):
            lay = self.layers[z]
            for (x, y), (t, v) in lay.items():
                if not (0 <= x < W and 0 <= y < H): continue
                if t == "t":
                    data[z * W * H + y * W + x] = v
                    continue
                k = v
                def same(dx, dy, x=x, y=y, k=k, lay=lay, z=z):
                    nx, ny = x + dx, y + dy
                    if nx < 0 or ny < 0 or nx >= W or ny >= H: return True
                    if lay.get((nx, ny)) == ("k", k): return True
                    return z == 0 and self.alias.get((nx, ny)) == k
                shape = wall_shape(same) if is_wall_kind(k) else floor_shape(same)
                data[z * W * H + y * W + x] = 2048 + k * 48 + shape
        for (x, y), v in self.shadow.items(): data[4 * W * H + y * W + x] = v
        for (x, y), v in self.region.items(): data[5 * W * H + y * W + x] = v
        return data

    # ------------------------------------------------------------------------------------------------ terraces
    def lv(self, x, y):
        return self.level.get((x, y), 0)

    def raise_to(self, cells, level, style=None):
        for c in cells:
            if self.inside(*c): self.level[c] = level
        if style: self.style[level] = style

    def terraces(self, ground=None):
        """faces, rims and the ground kinds of every level. ground(level, x, y) -> an A2 kind for a top cell (default: the style's)"""
        W, H = self.W, self.H
        self.faces, self.rims = {}, {}
        for y in range(H):
            for x in range(W):
                l = self.lv(x, y)
                if l == 0 or (x, y) in self.faces: continue
                if y + 1 < H and self.lv(x, y + 1) < l:
                    n = self.face_h.get(l, 2)
                    for k in range(1, n + 1):
                        part = "U" if k == 1 else "L" if k == n else ("M1" if k % 2 == 0 else "M2")
                        c = (x, y + k)
                        if self.inside(*c) and self.lv(*c) < l: self.faces[c] = (part, l)
                        else: break
        tops = [c for c in self.all if c not in self.faces]
        for (x, y) in tops:
            l = self.lv(x, y)
            st = self.style.get(l, "grass")
            k = ground(l, x, y) if ground else GROUND_OF[st]
            if l == 0:
                self.layers[0][(x, y)] = ("k", k)
                continue
            lower = lambda dx, dy: self.inside(x + dx, y + dy) and self.lv(x + dx, y + dy) < l and (x + dx, y + dy) not in self.faces_of_higher(l, x + dx, y + dy)
            n, s, w, e = lower(0, -1), lower(0, 1), lower(-1, 0), lower(1, 0)
            key = None
            if s and w: key = "BL"
            elif s and e: key = "BR"
            elif s: key = "B"
            elif n and w: key = "TL"
            elif n and e: key = "TR"
            elif n: key = "T"
            elif w: key = "L"
            elif e: key = "R"
            if key:
                self.rims[(x, y)] = key
                self.layers[0][(x, y)] = ("t", a5(RIM[st][key]))
                self.alias[(x, y)] = k
            else:
                self.layers[0][(x, y)] = ("k", k)
        for (x, y), (part, l) in self.faces.items():
            st = self.style.get(l, "grass")
            left = self.faces.get((x - 1, y)) != (part, l)
            right = self.faces.get((x + 1, y)) != (part, l)
            if part in ("M1", "M2"):
                row = FACE_PLAIN["U" if part == "M1" else "L"]
                piece = row[0] if left and not right else row[2] if right and not left else row[int(noise(x, l, self.seed + 93) * 3) % 3]
                self.layers[0][(x, y)] = ("t", a5(piece))
                self.solid.add((x, y))
                continue
            if left and not right: piece = FACE[st][part][0]
            elif right and not left: piece = FACE[st][part][2]
            elif left and right: piece = FACE[st][part][1]
            else:
                piece = FACE[st][part][1]
                if st == "grass" and noise(x, y // 3, self.seed + 91) < 0.18:   # plain rock now and then (both rows of the face)
                    piece = FACE_PLAIN[part][int(noise(x, 0, self.seed + 92) * 3) % 3]
            self.layers[0][(x, y)] = ("t", a5(piece))
            self.solid.add((x, y))

    def faces_of_higher(self, l, x, y):
        """(a face cell of a higher plateau is not 'lower ground' for the rim of the plateau whose foot it stands on)"""
        f = self.faces.get((x, y))
        return {(x, y)} if f and f[1] > l else set()

    def stairs(self, x0, x1, top_y, kind="moss", ground=None):
        """steps through the face below the rim row top_y, columns x0..x1: the rim there becomes plain ground, the two face rows
        steps (the A5 flight: sides blocked by its own flags)"""
        row = STAIRS[kind]
        l = self.lv(x0, top_y)
        st = self.style.get(l, "grass")
        k = ground or GROUND_OF[st]
        for x in range(x0, x1 + 1):
            self.layers[0][(x, top_y)] = ("k", k)
            self.rims.pop((x, top_y), None)
            self.alias.pop((x, top_y), None)
            for dy in (1, 2):
                c = (x, top_y + dy)
                if x0 == x1: col = 3
                elif x == x0: col = 0
                elif x == x1: col = 2
                else: col = 1
                self.layers[0][c] = ("t", A5(col, row))
                self.faces.pop(c, None)
                self.solid.discard(c)
                self.stair_cells.add(c)
                self.alias[c] = GROUND_OF[self.style.get(self.lv(*c), "grass")]
        # the face pieces beside the flight become its ends
        for y in (top_y + 1, top_y + 2):
            part = "U" if y == top_y + 1 else "L"
            for x, end in ((x0 - 1, 2), (x1 + 1, 0)):
                f = self.faces.get((x, y))
                if f: self.layers[0][(x, y)] = ("t", a5(FACE[self.style.get(f[1], "grass")][part][end]))

    # ------------------------------------------------------------------------------------------------ events
    def put(self, x, y, template, pic=None, name=None, force=False):
        ok = NewMap.put(self, x, y, template, pic, name, force)
        if ok:
            p = pic or template
            self.solid.add((x, y))
            for dx, dy in EXTRA.get(p, []): self.solid.add((x + dx, y + dy))
        return ok

    def free(self, x, y, pic=""):
        cells = [(x, y)] + [(x + dx, y + dy) for dx, dy in EXTRA.get(pic, [])]
        return all(self.inside(cx, cy) and (cx, cy) not in self.taken and (cx, cy) not in self.keep_free
                   and (cx, cy) not in self.faces and (cx, cy) not in self.rims and (cx, cy) not in self.stair_cells for cx, cy in cells)

    def ev(self, x, y, char="", index=0, direction=2, pattern=0, name="", priority=0, through=True, step=False, note="",
           trigger=0, cmds=None, pages=None, solid=None, cells=None):
        e = self.picture(x, y, char, index, direction, pattern, name=name, priority=priority, trigger=trigger, cmds=cmds,
                         note=note, through=through, step=step, cells=cells)
        if pages is not None: e["pages"] = pages
        if (priority == 1 and not through) if solid is None else solid:
            self.solid.add((x, y))
        return e

    def marker(self, x, y, key, d=2, note=""):
        """an invisible quest marker 'Miejsce: <key>' (below the characters, through, no picture, no commands); the page's
        direction is the way one faces there (docs/miasta_miejsca_zadan.md 1)"""
        e = {"name": "Miejsce: " + key, "note": note, "pages": [blank_page(priority=0, through=True, image={"direction": d})]}
        self.events.append((x, y, e))
        self.spots[key] = (x, y, d)
        return e

    def blocker(self, x0, y0, x1, y1, name="Blokada"):
        e = NewMap.blocker(self, x0, y0, x1, y1, name)
        for c in self.rect(x0, y0, x1, y1): self.solid.add(c)
        return e

    def light(self, x, y, note, name="Światło"):
        return NewMap.light(self, x, y, note, name)

    # ------------------------------------------------------------------------------------------------ the walking check
    def to_json(self):
        out = dict(self.props)
        out["data"] = self.resolve()
        out["events"] = self.build_events()
        return out

    def write_to(self, path):
        data, events = self.resolve(), self.build_events()
        write_map(path, dict(self.props), data, events)
        return len(events) - 1


# ---------------------------------------------------------------------------------------------------- passability like the game
BIT = {2: 1, 4: 2, 6: 4, 8: 8}
STEP = {2: (0, 1), 4: (-1, 0), 6: (1, 0), 8: (0, -1)}


def blocking_events(mp_json):
    """cells closed by events of the first page a new game shows (priority 1, not through), with their <Occupy> and the
    ChoppableTree footprints (EXTRA); and the cells of touch/transfer events (they count as the way out)"""
    import re
    sys.path.insert(0, os.path.join(ROOT, "tools", "town"))
    import mzrender as R
    out = set()
    for e in mp_json["events"]:
        if not e: continue
        pg = R.first_page(e)
        if not pg or pg["priorityType"] != 1 or pg["through"]: continue
        x, y = e["x"], e["y"]
        out.add((x, y))
        pic = pg["image"]["characterName"]
        for dx, dy in EXTRA.get(pic, []): out.add((x + dx, y + dy))
        m = re.search(r"<Occupy:([^>]*)>", e.get("note") or "")
        if m:
            o = dict(kv.split("=") for kv in m.group(1).split(",") if "=" in kv)
            for dy in range(-int(o.get("up", 0)), int(o.get("down", 0)) + 1):
                for dx in range(-int(o.get("left", 0)), int(o.get("right", 0)) + 1):
                    out.add((x + dx, y + dy))
    return out


def passable(mp_json, flags, x, y, d):
    W, H = mp_json["width"], mp_json["height"]
    data = mp_json["data"]
    bit = BIT[d]
    for z in (3, 2, 1, 0):
        t = data[(z * H + y) * W + x]
        f = flags[t] if 0 <= t < len(flags) else 0
        if f & 0x10: continue
        if (f & bit) == 0: return True
        if (f & bit) == bit: return False
    return False


def reach(mp_json, start, flags=None, extra_block=()):
    flags = flags or load_json(ROOT + "data/Tilesets.json")[mp_json["tilesetId"]]["flags"]
    W, H = mp_json["width"], mp_json["height"]
    blocked = blocking_events(mp_json) | set(extra_block)
    seen, todo = {start}, [start]
    while todo:
        x, y = todo.pop()
        for d, (dx, dy) in STEP.items():
            nx, ny = x + dx, y + dy
            if not (0 <= nx < W and 0 <= ny < H) or (nx, ny) in seen or (nx, ny) in blocked: continue
            if not passable(mp_json, flags, x, y, d) or not passable(mp_json, flags, nx, ny, 10 - d): continue
            seen.add((nx, ny)); todo.append((nx, ny))
    return seen


# ---------------------------------------------------------------------------------------------------- pictures
def render(mp_json, out=None, box=None, scale=1.0, grid=False):
    import mzrender as R
    from PIL import Image
    if mp_json["tilesetId"] in (10, 12):
        sys.path.insert(0, os.path.join(ROOT, "tools", "underground"))
        import uglib
        img = uglib.render(mp_json, None, box=None, scale=1.0, grid=False)
    else:
        S = R.Sheets(mp_json["tilesetId"])
        S.lenient = True
        img = R.render(mp_json, S)
    if box:
        x0, y0, x1, y1 = box
        img = img.crop((x0 * 48, y0 * 48, (x1 + 1) * 48, (y1 + 1) * 48))
    if grid:
        sys.path.insert(0, os.path.join(ROOT, "tools", "interiors"))
        import irender as IR
        img = IR.grid(img, box[0] if box else 0, box[1] if box else 0, lines=False)
    if scale != 1.0:
        img = img.resize((int(img.width * scale), int(img.height * scale)), Image.LANCZOS if scale < 1 else Image.NEAREST)
    if out:
        img.convert("RGB").save(out)
    return img
