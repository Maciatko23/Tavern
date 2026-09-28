# Shared pieces for the "new start" maps (grandpa's cottage, the yard, the three roads, the Lord's estate).
# Grown out of the meadow generator (scratchpad meadow_lib.py): autotile shapes the way the editor works them out, layout
# shapes, events copied from Map003 so they chop / mine / fruit like there, transfers made like the author's on Map003/Map004,
# invisible blockers (tileset 9 has no passability flags: its walls, fences and roofs are all walkable, so buildings and fences
# are closed by events with ChoppableTree's <Occupy:...> note), and writing a map file the way the editor does (LF lines).
import json, math, random, copy, os

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")).replace("\\", "/") + "/"

# ------------------------------------------------------------------ autotile shapes (Tilemap.FLOOR_AUTOTILE_TABLE / WALL_AUTOTILE_TABLE)
FLOOR = [
    [[2,4],[1,4],[2,3],[1,3]],[[2,0],[1,4],[2,3],[1,3]],[[2,4],[3,0],[2,3],[1,3]],[[2,0],[3,0],[2,3],[1,3]],
    [[2,4],[1,4],[2,3],[3,1]],[[2,0],[1,4],[2,3],[3,1]],[[2,4],[3,0],[2,3],[3,1]],[[2,0],[3,0],[2,3],[3,1]],
    [[2,4],[1,4],[2,1],[1,3]],[[2,0],[1,4],[2,1],[1,3]],[[2,4],[3,0],[2,1],[1,3]],[[2,0],[3,0],[2,1],[1,3]],
    [[2,4],[1,4],[2,1],[3,1]],[[2,0],[1,4],[2,1],[3,1]],[[2,4],[3,0],[2,1],[3,1]],[[2,0],[3,0],[2,1],[3,1]],
    [[0,4],[1,4],[0,3],[1,3]],[[0,4],[3,0],[0,3],[1,3]],[[0,4],[1,4],[0,3],[3,1]],[[0,4],[3,0],[0,3],[3,1]],
    [[2,2],[1,2],[2,3],[1,3]],[[2,2],[1,2],[2,3],[3,1]],[[2,2],[1,2],[2,1],[1,3]],[[2,2],[1,2],[2,1],[3,1]],
    [[2,4],[3,4],[2,3],[3,3]],[[2,4],[3,4],[2,1],[3,3]],[[2,0],[3,4],[2,3],[3,3]],[[2,0],[3,4],[2,1],[3,3]],
    [[2,4],[1,4],[2,5],[1,5]],[[2,0],[1,4],[2,5],[1,5]],[[2,4],[3,0],[2,5],[1,5]],[[2,0],[3,0],[2,5],[1,5]],
    [[0,4],[3,4],[0,3],[3,3]],[[2,2],[1,2],[2,5],[1,5]],[[0,2],[1,2],[0,3],[1,3]],[[0,2],[1,2],[0,3],[3,1]],
    [[2,2],[3,2],[2,3],[3,3]],[[2,2],[3,2],[2,1],[3,3]],[[2,4],[3,4],[2,5],[3,5]],[[2,0],[3,4],[2,5],[3,5]],
    [[0,4],[1,4],[0,5],[1,5]],[[0,4],[3,0],[0,5],[1,5]],[[0,2],[3,2],[0,3],[3,3]],[[0,2],[1,2],[0,5],[1,5]],
    [[0,4],[3,4],[0,5],[3,5]],[[2,2],[3,2],[2,5],[3,5]],[[0,2],[3,2],[0,5],[3,5]],[[0,0],[1,0],[2,0],[3,0]]]
SHAPE = {tuple(map(tuple, q)): i for i, q in enumerate(FLOOR)}

def floor_shape(same):
    n, s, w, e = same(0, -1), same(0, 1), same(-1, 0), same(1, 0)
    nw, ne, sw, se = same(-1, -1), same(1, -1), same(-1, 1), same(1, 1)
    tl = (2,4) if n and w and nw else (2,0) if n and w else (2,2) if w else (0,4) if n else (0,2)
    tr = (1,4) if n and e and ne else (3,0) if n and e else (1,2) if e else (3,4) if n else (3,2)
    bl = (2,3) if s and w and sw else (2,1) if s and w else (2,5) if w else (0,3) if s else (0,5)
    br = (1,3) if s and e and se else (3,1) if s and e else (1,5) if e else (3,3) if s else (3,5)
    return SHAPE[(tl, tr, bl, br)]

def wall_shape(same):
    """A3 buildings and A4 wall sides: bit 1 = edge on the left, 2 = top, 4 = right, 8 = bottom"""
    return (0 if same(-1, 0) else 1) | (0 if same(0, -1) else 2) | (0 if same(1, 0) else 4) | (0 if same(0, 1) else 8)

def is_wall_kind(kind):
    if 48 <= kind < 80: return True                       # A3
    if kind >= 80: return ((kind - 80) // 8) % 2 == 1     # A4: rows 1, 3, 5 are the wall sides
    return False

# ------------------------------------------------------------------ tile ids
def B(col, row): return (row * 8 + col % 8) + (128 if col >= 8 else 0)
def C(col, row): return 256 + B(col, row)
def D(col, row): return 512 + B(col, row)
def E(col, row): return 768 + B(col, row)
def A5(col, row): return 1536 + row * 8 + col
def kind_of(tid): return (tid - 2048) // 48 if tid >= 2048 else None

# ------------------------------------------------------------------ layout shapes
def noise(x, y, seed):
    return random.Random((x * 73856093) ^ (y * 19349663) ^ seed).random()
def lowfreq(x, y, seed, scale=6.0):
    """smooth value noise 0..1 (bilinear between random values on a coarse grid)"""
    gx, gy = x / scale, y / scale
    x0, y0 = math.floor(gx), math.floor(gy)
    fx, fy = gx - x0, gy - y0
    fx, fy = fx * fx * (3 - 2 * fx), fy * fy * (3 - 2 * fy)
    v = lambda a, b: noise(a, b, seed)
    top = v(x0, y0) * (1 - fx) + v(x0 + 1, y0) * fx
    bot = v(x0, y0 + 1) * (1 - fx) + v(x0 + 1, y0 + 1) * fx
    return top * (1 - fy) + bot * fy
def seg_dist(px, py, ax, ay, bx, by):
    vx, vy = bx - ax, by - ay
    t = max(0, min(1, ((px - ax) * vx + (py - ay) * vy) / (vx * vx + vy * vy)))
    return math.hypot(px - ax - t * vx, py - ay - t * vy)
def line_dist(x, y, points):
    return min(seg_dist(x, y, *points[i], *points[i + 1]) for i in range(len(points) - 1))

# ------------------------------------------------------------------ Map003's events (templates) and the transfers made like the author's
_base = json.load(open(ROOT + "data/Map003.json", encoding="utf-8"))
TMPL = {}
for _e in _base["events"]:
    if not _e: continue
    _g = _e["pages"][0]["image"]["characterName"] or ("tile%d" % _e["pages"][0]["image"]["tileId"])
    TMPL.setdefault(_g, _e)
TRANSFER_TMPL = next(e for e in _base["events"] if e and not e["pages"][0]["image"]["characterName"] and not e["pages"][0]["image"]["tileId"]
                     and any(c["code"] == 201 for c in e["pages"][0]["list"]))
BLANK_COND = copy.deepcopy(TRANSFER_TMPL["pages"][0]["conditions"])
for _k in list(BLANK_COND):
    if _k.endswith("Valid"): BLANK_COND[_k] = False

def blank_page(priority=0, trigger=0, image=None, through=False, cmds=None, step=False, direction_fix=False):
    img = {"tileId": 0, "characterName": "", "direction": 2, "pattern": 0, "characterIndex": 0}
    if image: img.update(image)
    return {"conditions": copy.deepcopy(BLANK_COND), "directionFix": direction_fix, "image": img,
            "list": (cmds or []) + [{"code": 0, "indent": 0, "parameters": []}], "moveFrequency": 3,
            "moveRoute": {"list": [{"code": 0, "parameters": []}], "repeat": True, "skippable": False, "wait": False},
            "moveSpeed": 3, "moveType": 0, "priorityType": priority, "stepAnime": step, "through": through,
            "trigger": trigger, "walkAnime": False}

PINE = {"A": ("!$Pine_A", "Sosna"), "B": ("!$Pine_B", "Sosna (średnia)"), "C": ("!$Pine_C", "Sosna (niska)")}

# the cells a picture blocks besides its own (ChoppableTree's SOLID_GRAPHICS for the pictures used here)
def fp(left=0, right=0, up=0, down=0):
    return [(dx, dy) for dy in range(-up, down + 1) for dx in range(-left, right + 1) if (dx, dy) != (0, 0)]
EXTRA = {"!$Boulder_A": fp(right=1), "!$Rock_Tall": fp(up=1), "!$Rock_Slab": fp(right=1), "!$Rock_Boulder_Crack": fp(right=1),
         "!$Rock_Jagged": fp(right=1), "!$Rock_Twin": fp(right=1), "!$Rock_Wide": fp(left=1, right=1), "!$Rock_Huge": fp(left=1, right=1, up=1),
         "!$Rock_Spire": fp(up=1), "!$Rock_Column": fp(up=1), "!$Rock_Cluster": fp(right=1), "!$Rock_Long": fp(left=1, right=1),
         "!$Rock_Rubble": fp(right=1), "!$Rock_Ore_Iron_Cluster": fp(right=1), "!$Rock_Ore_Iron_Twin": fp(right=1), "!$Rock_Ore_Iron_Jagged": fp(right=1),
         "!$Bush_Bare_Tall": fp(up=1), "!$Bush_Bare_Wide": fp(right=1), "!$Bush_Bare_Hedge": fp(left=1, right=1), "!$Bush_Bare_Thicket": fp(right=1, up=1),
         "!$Bush_Bare_Vines": fp(right=1, up=1), "!$Bush_Bare_Big": fp(left=1, right=1, up=1), "!$Logs_Big": fp(right=1)}
BARE = ["!$Bush_Bare_A", "!$Bush_Bare_B", "!$Bush_Bare_Tall", "!$Bush_Bare_Wide", "!$Bush_Bare_Hedge", "!$Bush_Bare_Thicket", "!$Bush_Bare_Vines", "!$Bush_Bare_Big"]
BARE_SMALL = ["!$Bush_Bare_A", "!$Bush_Bare_B", "!$Bush_Bare_Tall", "!$Bush_Bare_Wide"]
ROCK_SMALL = ["!$Rock_Flat", "!$Rock_Mound", "!$Rock_Chunk", "!$Rock_Cracked", "!$Rock_Mossy", "!$Rock_Pile", "!$Rock_Cairn"]
ROCK_BIG = ["!$Boulder_A", "!$Rock_Huge", "!$Rock_Wide", "!$Rock_Boulder_Crack", "!$Rock_Jagged", "!$Rock_Twin", "!$Rock_Long", "!$Rock_Slab", "!$Rock_Cluster", "!$Rock_Rubble"]

# ------------------------------------------------------------------ the map
BASE_PROPS = {k: v for k, v in _base.items() if k not in ("data", "events")}

class NewMap:
    def __init__(self, map_id, w, h, tileset, display, note, seed=1, bgm="Field1", autoplay=False):
        self.id, self.W, self.H = map_id, w, h
        self.props = copy.deepcopy(BASE_PROPS)
        self.props.update({"width": w, "height": h, "tilesetId": tileset, "displayName": display, "note": note,
                           "autoplayBgm": autoplay, "bgm": {"name": bgm, "pan": 0, "pitch": 100, "volume": 90},
                           "autoplayBgs": False, "bgs": {"name": "", "pan": 0, "pitch": 100, "volume": 90},
                           "encounterList": [], "parallaxName": "", "specifyBattleback": False})
        self.layers = [dict() for _ in range(4)]   # (x, y) -> ("k", kind) autotile | ("t", tileId)
        self.shadow, self.region = {}, {}
        self.events = []            # (x, y, event)
        self.taken = set()          # cells an event stands on or blocks
        self.keep_free = set()      # paths, doorways: nothing is placed there by the scatter helpers
        self.rnd = random.Random(seed)
        self.seed = seed
        self.all = {(x, y) for y in range(h) for x in range(w)}
    # ---- tiles
    def inside(self, x, y): return 0 <= x < self.W and 0 <= y < self.H
    def kind(self, z, cells, k):
        for c in cells:
            if self.inside(*c): self.layers[z][c] = ("k", k)
    def tile(self, z, x, y, tid):
        if self.inside(x, y): self.layers[z][(x, y)] = ("t", tid)
    def clear(self, z, cells):
        for c in cells: self.layers[z].pop(c, None)
    def rect(self, x0, y0, x1, y1):
        return {(x, y) for y in range(y0, y1 + 1) for x in range(x0, x1 + 1) if self.inside(x, y)}
    # ---- events
    def add(self, x, y, e, cells=None):
        self.events.append((x, y, e))
        self.taken.add((x, y))
        for c in cells or []: self.taken.add(c)
        return e
    def free(self, x, y, pic=""):
        cells = [(x, y)] + [(x + dx, y + dy) for dx, dy in EXTRA.get(pic, [])]
        return all(self.inside(cx, cy) and (cx, cy) not in self.taken and (cx, cy) not in self.keep_free for cx, cy in cells)
    def put(self, x, y, template, pic=None, name=None, force=False):
        """an event of Map003 with this picture, as it is there (name, note, pages)"""
        p = pic or template
        if not force and not self.free(x, y, p): return False
        e = copy.deepcopy(TMPL[template])
        if pic:
            for pg in e["pages"]:
                if pg["image"]["characterName"] == TMPL[template]["pages"][0]["image"]["characterName"]: pg["image"]["characterName"] = pic
        if name: e["name"] = name
        self.add(x, y, e, [(x + dx, y + dy) for dx, dy in EXTRA.get(p, [])])
        return True
    def pine(self, x, y, kind=None):
        kind = kind or self.rnd.choice("AAABBBCC")
        return self.put(x, y, PINE[kind][0], name=PINE[kind][1])
    def forest(self, region, spacing=2.6, avoid=()):
        cells = sorted(set(region) - set(avoid) - self.keep_free)
        self.rnd.shuffle(cells)
        spots = []
        for (x, y) in cells:
            if all(math.hypot(x - a, y - b) >= spacing for a, b in spots) and self.free(x, y):
                if self.pine(x, y): spots.append((x, y))
        return spots
    def forest_var(self, region, dense=2.1, sparse=3.4, avoid=(), small=0.12, seed=77):
        """pines whose spacing changes over the map (groves and thinner parts); some young trees among them"""
        cells = sorted(set(region) - set(avoid) - self.keep_free)
        self.rnd.shuffle(cells)
        spots = []
        for (x, y) in cells:
            sp = dense + (sparse - dense) * lowfreq(x, y, seed)
            if all(math.hypot(x - a, y - b) >= sp for a, b in spots) and self.free(x, y):
                ok = self.put(x, y, "!$Tree_Small") if self.rnd.random() < small else self.pine(x, y)
                if ok: spots.append((x, y))
        return spots
    def scatter(self, cells, n, place, min_gap=0):
        cells = sorted(cells)
        self.rnd.shuffle(cells)
        done = []
        for (x, y) in cells:
            if len(done) >= n: break
            if min_gap and any(math.hypot(x - a, y - b) < min_gap for a, b in done): continue
            if place(x, y): done.append((x, y))
        return done
    def transfer(self, x, y, to_map, tx, ty, direction, name=None, se=None):
        """a touch transfer like the author's edge exits on Map003/Map004 (player touch, below the characters, black fade);
        the direction is the one that faces into the map the player comes to"""
        e = copy.deepcopy(TRANSFER_TMPL)
        pg = e["pages"][0]
        cmds = []
        if se: cmds.append({"code": 250, "indent": 0, "parameters": [{"name": se, "volume": 80, "pitch": 100, "pan": 0}]})
        cmds.append({"code": 201, "indent": 0, "parameters": [0, to_map, tx, ty, direction, 0]})
        pg["list"] = cmds + [{"code": 0, "indent": 0, "parameters": []}]
        e["name"] = name or "Przejście"
        e["note"] = ""
        self.add(x, y, e)
        return e
    def blocker(self, x0, y0, x1, y1, name="Blokada"):
        """an invisible event that blocks the rectangle x0..x1, y0..y1 (ChoppableTree's <Occupy>; it stands on the bottom-left cell)"""
        ex, ey = x0, y1
        o = {"right": x1 - x0, "up": y1 - y0}
        tag = ",".join("%s=%d" % (k, v) for k, v in o.items() if v)
        e = {"name": name, "note": "<Occupy:%s>" % tag if tag else "", "pages": [blank_page(priority=1)]}
        return self.add(ex, ey, e, list(self.rect(x0, y0, x1, y1)))
    def picture(self, x, y, char, index=0, direction=2, pattern=0, name="", priority=1, trigger=0, cmds=None, note="", through=False, step=False, cells=None):
        e = {"name": name, "note": note, "pages": [blank_page(priority=priority, trigger=trigger, image={"characterName": char, "characterIndex": index,
             "direction": direction, "pattern": pattern}, through=through, cmds=cmds, step=step, direction_fix=True)]}
        return self.add(x, y, e, cells)
    def tile_event(self, x, y, tid, name="", priority=0, through=True, note="", cmds=None):
        e = {"name": name, "note": note, "pages": [blank_page(priority=priority, image={"tileId": tid}, through=through, cmds=cmds)]}
        return self.add(x, y, e)
    def light(self, x, y, note, name="swiatlo"):
        e = {"name": name, "note": note, "pages": [blank_page()]}
        self.events.append((x, y, e))
        return e
    # ---- writing
    def resolve(self):
        W, H = self.W, self.H
        data = [0] * (W * H * 6)
        for z in range(4):
            lay = self.layers[z]
            for (x, y), (t, v) in lay.items():
                if not (0 <= x < W and 0 <= y < H): continue     # (a cell off the map would wrap into another layer)
                if t == "t":
                    data[z * W * H + y * W + x] = v
                    continue
                k = v
                def same(dx, dy, x=x, y=y, k=k, lay=lay):
                    nx, ny = x + dx, y + dy
                    if nx < 0 or ny < 0 or nx >= W or ny >= H: return True
                    return lay.get((nx, ny)) == ("k", k)
                shape = wall_shape(same) if is_wall_kind(k) else floor_shape(same)
                data[z * W * H + y * W + x] = 2048 + k * 48 + shape
        for (x, y), v in self.shadow.items(): data[4 * W * H + y * W + x] = v
        for (x, y), v in self.region.items(): data[5 * W * H + y * W + x] = v
        return data
    def build_events(self):
        events = [None]
        for i, (x, y, e) in enumerate(self.events, 1):
            e = copy.deepcopy(e)
            e["id"], e["x"], e["y"] = i, x, y
            events.append({"id": e["id"], "name": e["name"], "note": e["note"], "pages": e["pages"], "x": x, "y": y})
        return events
    def write(self):
        data, events = self.resolve(), self.build_events()
        props = dict(self.props)
        write_map(ROOT + "data/Map%03d.json" % self.id, props, data, events)
        return len(events) - 1

def dump(o):
    return json.dumps(o, ensure_ascii=False, separators=(",", ":"))

def write_map(path, props, data, events):
    """the editor's layout: the properties on one line, then data, then one event per line (LF, UTF-8, no BOM)"""
    props = {k: v for k, v in props.items() if k not in ("data", "events")}
    lines = ["{", dump(props)[1:-1] + ",", '"data":' + dump(data) + ",", '"events":[']
    lines += [dump(e) + ("," if i < len(events) - 1 else "") for i, e in enumerate(events)]
    lines += ["]", "}"]
    with open(path, "wb") as f:
        f.write("\n".join(lines).encode("utf-8"))

def ground(mp, paths=set(), woods=set(), light=set(), bare=set(), flowers=set(), tall_n=30, tall_extra=set(), floor_under_pines=True, keep=set()):
    """the meadow ground of Map003's kinds: 16 grass, 27 lighter grass, 17 bare earth (layer 0); 46 darker grass under the pines,
    21 tall grass, 28 flowers, 39 dirt path (layer 1). keep: cells whose layers 0/1 are already set and stay as they are"""
    rnd = mp.rnd
    floor = set()
    if floor_under_pines:
        for x, y, e in mp.events:
            if "Pine" in e["pages"][0]["image"]["characterName"]:
                for yy in range(mp.H):
                    for xx in range(mp.W):
                        if ((xx - x) / 2.2) ** 2 + ((yy - y + 0.5) / 1.8) ** 2 <= 1 + 0.5 * (noise(xx, yy, x * 31 + y) - 0.5) * 2: floor.add((xx, yy))
    floor -= paths
    flowers = set(flowers) - paths - woods - mp.taken
    ringp = set()
    for (x, y) in paths:
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1): ringp.add((x + dx, y + dy))
    blocked = paths | ringp | flowers | mp.taken | keep | set(bare)
    tall = set()
    centres = sorted(mp.all - blocked - floor)
    rnd.shuffle(centres)
    for (cx, cy) in centres[:tall_n]:
        rx, ry, sd = 1 + rnd.random() * 1.3, 0.8 + rnd.random() * 0.9, rnd.randrange(1 << 30)
        for yy in range(max(0, int(cy - ry - 2)), min(mp.H, int(cy + ry + 3))):
            for xx in range(max(0, int(cx - rx - 2)), min(mp.W, int(cx + rx + 3))):
                if ((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2 <= 1 + 0.4 * (noise(xx, yy, sd) - 0.5) * 2: tall.add((xx, yy))
    fr = set()
    for (x, y) in floor:
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1): fr.add((x + dx, y + dy))
    tall |= {c for c in fr - floor if noise(*c, mp.seed + 51) < 0.55}
    tall |= set(tall_extra)
    tall -= blocked; tall -= floor
    tall &= mp.all; floor &= mp.all
    for c in mp.all - keep:
        mp.layers[0][c] = ("k", 16)
    for c in light - keep: mp.layers[0][c] = ("k", 27)
    for c in bare - keep: mp.layers[0][c] = ("k", 17)
    for c in floor - keep: mp.layers[1][c] = ("k", 46)
    for c in tall - keep: mp.layers[1][c] = ("k", 21)
    for c in flowers - keep: mp.layers[1][c] = ("k", 28)
    for c in paths - keep: mp.layers[1][c] = ("k", 39)
    return tall, floor

def blob(mp, cx, cy, rx, ry, seed, rough=0.28):
    return {(x, y) for y in range(mp.H) for x in range(mp.W)
            if ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1 + rough * (noise(x, y, seed) - 0.5) * 2}
def path(mp, points, width):
    return {(x, y) for y in range(mp.H) for x in range(mp.W) if line_dist(x, y, points) <= width / 2}
def ring(mp, cells, r=1):
    out = set()
    for (x, y) in cells:
        for dy in range(-r, r + 1):
            for dx in range(-r, r + 1):
                if mp.inside(x + dx, y + dy): out.add((x + dx, y + dy))
    return out - set(cells)
def patch(mp, cx, cy, size, seed):
    r = random.Random(seed)
    cells = blob(mp, cx, cy, size, size * 0.62, seed, 0.55)
    for _ in range(2):
        cells |= blob(mp, cx + r.uniform(-size, size), cy + r.uniform(-size * 0.5, size * 0.5), size * r.uniform(0.45, 0.7), size * r.uniform(0.35, 0.5), r.randrange(1 << 30), 0.6)
    return cells
