# The interiors' polish (2026-10-12, "wnętrza domków mają wyglądać ładnie, równo i profesjonalnie"): a room is NOT built
# anew here - it is read from the game's own map (data/MapNNN.json as the user left it in the editor) and edited the way one
# edits it in the editor: furniture taken away and put down, rugs painted, events moved / added / deleted. Everything else of
# the map stays byte for byte: its properties, the tiles nobody touched (autotile shapes of untouched cells are kept as they
# were; the cells around a painted one are worked out again like the editor does), the events with their ids (doors, the
# residents' "Miejsce:" markers, the Silent's look events...). New events get the next free ids.
#
# Room(map_id) has the methods the older interior macros use (tools/interiors ilib -> tools/house houselib ->
# tools/tavern parter_props -> tavlib -> tools/newstart nslib), so window(), bed(), table_h(), tprop(), hprop() ... work on it.
# Nothing here writes data/ - build.py stages the maps in tools/wnetrza/staging/ and installs them.
import os, sys, json, copy, re, random
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..")).replace("\\", "/") + "/"
sys.path.insert(0, ROOT + "tools/interiors")
sys.path.insert(0, ROOT + "tools/tavern")
from ilib import *                       # noqa: F401,F403  Interior, macros, B C D E A5, TOWN_IDX, HOUSE_IDX, window ...
import ilib                              # noqa: E402
import houselib as HL                    # noqa: E402
import parter_props as PP                # noqa: E402
from nslib import floor_shape, wall_shape, is_wall_kind, write_map, blank_page   # noqa: E402,F811
from engine import Engine, occupy_cells  # noqa: E402

WHERE = HERE                              # (the star imports bring other tools' HERE / ROOT / STAGING)
WROOT = ROOT
DATA = ROOT + "data/"
W_STAGING = os.path.join(HERE, "staging")
OSADA_IDX = json.load(open(ROOT + "tools/osada/props_index.json", encoding="utf-8"))
FLAGS8 = json.load(open(DATA + "Tilesets.json", encoding="utf-8"))[8]["flags"]

# ---- lights (RoomLighting): every light is a flame (user rule 2026-10-05); daylight only from windows, by day
L_HEARTH = "<Light:300,120,60,16>"
L_FIREPLACE = "<Light:330,120,60,16>"
L_PIT = "<Light:200,120,52,14>"
L_OVEN = "<Light:130,120,50,14>"
L_STOVE = "<Light:230,120,64,20>"
L_CANDLE = "<Light:110,120,80,30><LightWhen:night>"
L_CANDLE_SMALL = "<Light:90,110,76,28><LightWhen:night>"
L_CANDLES3 = "<Light:150,130,90,34><LightWhen:night>"
L_LANTERN = "<Light:210,90,62,24><LightWhen:night>"
L_LANTERN_SMALL = "<Light:150,90,62,24><LightWhen:night>"
L_SCONCE = "<Light:170,90,60,22><LightWhen:night>"
L_TORCH = "<Light:190,120,60,18><LightWhen:night>"


def cone(length):
    """the sun through a window by day (the event on the window's LOWER cell - the user moved them there 2026-10-12)"""
    return ("<LightCone:length=%d,angle=28,dir=90,width=22,anchor=top,offsety=-8,blur=5,dust=10,dustsize=1,"
            "r=255,g=226,b=186,when=day>" % length)


def load(p):
    with open(p, "rb") as f:
        return json.loads(f.read().decode("utf-8"))


def kind_of(t):
    return (t - 2048) // 48 if t >= 2048 else None


def is_border_kind(k):
    return k is not None and 16 <= k < 48


def is_floor_kind(k):
    """A4 floors (rows 0, 2, 4 of A4 are the walkable 'top' kinds; 80.. is A4)"""
    return k is not None and k >= 80 and ((k - 80) // 8) % 2 == 0


def is_face_kind(k):
    return k is not None and is_wall_kind(k)


class Room(Interior):
    """an interior read from data/ (or another dir) for editing in place"""

    def __init__(self, map_id, src_dir=None):
        src = (src_dir or DATA) + "Map%03d.json" % map_id
        raw = load(src)
        self.src_path = src
        self.raw = raw
        self.id = map_id
        self.W, self.H = raw["width"], raw["height"]
        self.props = {k: copy.deepcopy(v) for k, v in raw.items() if k not in ("data", "events")}
        self.display = raw.get("displayName", "")
        self.key = "Map%03d" % map_id
        # NewMap / TavernMap / Parter / House / Interior state
        self.layers = [dict() for _ in range(4)]
        self.shadow, self.region = {}, {}
        self.events = []
        self.taken, self.keep_free = set(), set()
        self.rnd = random.Random(map_id)
        self.seed = map_id
        self.all = {(x, y) for y in range(self.H) for x in range(self.W)}
        self.kept, self.solid, self.blocked = {}, set(), set()
        self.zones, self.labels = [], []
        self.want_solid, self.things, self.hooks, self.wall_items = set(), [], [], []
        self.floor_cells, self.face_cells, self.openings = {}, {}, []
        self.spots, self.room_kinds, self.notes = {}, {}, []
        self.exits, self.residents, self.pins = [], [], []
        self.concept = "polish"
        # tiles: autotiles as kinds (with their original shape kept while nothing around them changes)
        d, W, H = raw["data"], self.W, self.H
        self.orig = {}
        self.dirty = [set() for _ in range(4)]
        for z in range(4):
            for y in range(H):
                for x in range(W):
                    t = d[(z * H + y) * W + x]
                    if not t: continue
                    if t >= 2048:
                        self.layers[z][(x, y)] = ("k", kind_of(t))
                        self.orig[(z, x, y)] = t
                    else:
                        self.layers[z][(x, y)] = ("t", t)
        for y in range(H):
            for x in range(W):
                s = d[(4 * H + y) * W + x]; r = d[(5 * H + y) * W + x]
                if s: self.shadow[(x, y)] = s
                if r: self.region[(x, y)] = r
        # cells: floor / wall face / border from layer 0
        for (x, y), (t, v) in self.layers[0].items():
            k = v if t == "k" else None
            if t == "t" and 1536 <= v < 1664: self.floor_cells[(x, y)] = "floor"      # (A5 floor tiles)
            elif is_floor_kind(k) and 0 < x < W - 1 and 0 < y < H - 1: self.floor_cells[(x, y)] = "floor"
            elif is_face_kind(k): self.face_cells[(x, y)] = "wall"
        # events: the map's own, by id (copies; None = deleted)
        self.base = {e["id"]: copy.deepcopy(e) for e in raw["events"] if e}
        self.max_id = max(self.base) if self.base else 0
        for e in self.base.values():
            if self.blocks(e): self.solid |= set(occupy_cells(e["x"], e["y"], e.get("note")))
        self.exit_events = [e for e in self.base.values() if any(c["code"] == 201 for p in e["pages"] for c in p["list"])]
        self.landings = [(e["x"], e["y"] - 1) for e in self.exit_events if e["y"] >= self.H - 2]
        if map_id == 100: self.landings = [(3, 4)]

    # ------------------------------------------------------------------------------------------------ tiles
    def _touch(self, z, cells):
        for c in cells: self.dirty[z].add(c)

    def kind(self, z, cells, k):
        cells = [c for c in cells if self.inside(*c)]
        for c in cells: self.layers[z][c] = ("k", k)
        self._touch(z, cells)

    def tile(self, z, x, y, tid):
        if not self.inside(x, y): return
        if tid: self.layers[z][(x, y)] = ("t", tid)
        else: self.layers[z].pop((x, y), None)
        self._touch(z, [(x, y)])

    def clear(self, z, cells):
        for c in cells:
            self.layers[z].pop(c, None)
        self._touch(z, cells)

    def get(self, z, x, y):
        v = self.layers[z].get((x, y))
        if not v: return 0
        t, val = v
        if t == "t": return val
        return self.orig.get((z, x, y), 2048 + val * 48)

    def kind_at(self, z, x, y):
        v = self.layers[z].get((x, y))
        return v[1] if v and v[0] == "k" else None

    def resolve(self):
        W, H = self.W, self.H
        data = [0] * (W * H * 6)
        for z in range(4):
            lay, dirty = self.layers[z], self.dirty[z]
            near = set()
            for (x, y) in dirty:
                for dy in (-1, 0, 1):
                    for dx in (-1, 0, 1): near.add((x + dx, y + dy))
            for (x, y), (t, v) in lay.items():
                if not (0 <= x < W and 0 <= y < H): continue
                if t == "t":
                    data[z * W * H + y * W + x] = v
                    continue
                if (x, y) not in near and (z, x, y) in self.orig:
                    data[z * W * H + y * W + x] = self.orig[(z, x, y)]
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

    # ------------------------------------------------------------------------------------------------ the map's own events
    @staticmethod
    def blocks(e):
        pg = e["pages"][0]
        return pg["priorityType"] == 1 and not pg["through"]

    @staticmethod
    def commands(e):
        return [c for p in e["pages"] for c in p["list"] if c["code"] not in (0, 108, 408)]

    def protected(self, e):
        """events other systems need: doors / exits, the residents' markers, the Silent's look / parallel events, anything
        that runs commands or is triggered by touch / autorun / parallel"""
        if e["name"].startswith("Miejsce:"): return True
        if self.commands(e): return True
        if any(p["trigger"] in (1, 2, 3, 4) for p in e["pages"]): return True
        if len(e["pages"]) > 1: return True
        return False

    def ev_list(self, pred=None):
        return [e for e in self.base.values() if e and (pred is None or pred(e))]

    def ev_at(self, x, y):
        return [e for e in self.base.values() if e and e["x"] == x and e["y"] == y]

    def ev_named(self, pattern):
        rx = re.compile(pattern)
        return [e for e in self.base.values() if e and rx.search(e["name"])]

    def drop(self, e):
        self.base[e["id"]] = None

    def move(self, e, x, y):
        e["x"], e["y"] = x, y

    def wipe(self, x0, y0, x1, y1, layers=(2, 3), rugs=False, events=True, keep=()):
        """take away the furniture in the rectangle: its tiles on `layers` (+ the rugs of layer 1) and its decor events
        (not the protected ones, not those whose name matches one of `keep`)"""
        cells = self.rect(x0, y0, x1, y1)
        for z in layers: self.clear(z, cells)
        if rugs:
            for c in cells:
                k = self.kind_at(1, *c)
                if k is not None or self.layers[1].get(c): self.clear(1, [c])
        if events:
            for e in list(self.base.values()):
                if not e or (e["x"], e["y"]) not in cells: continue
                if self.protected(e) or any(re.search(k, e["name"]) for k in keep): continue
                self.drop(e)

    def clear_windows(self):
        """the window light events ('okno (słońce)' / 'okno (dzień)' / 'okno') - put back by window2()"""
        for e in self.ev_named(r"^okno"):
            self.drop(e)

    def windows_down(self):
        """the sun's events of the windows on the window's LOWER cell, as the user moved them on Map102/103/104 (2026-10-12):
        an 'okno' LightCone event on the top cell of a two-cell window goes one row down"""
        for e in self.ev_named(r"^okno"):
            if "<LightCone" not in e["note"]: continue
            x, y = e["x"], e["y"]
            if y + 1 < self.H and (x, y + 1) in self.face_cells and any(0 < self.get(z, x, y + 1) < 256 for z in (2, 3))                     and any(0 < self.get(z, x, y) < 256 for z in (2, 3)):
                e["y"] = y + 1

    # ------------------------------------------------------------------------------------------------ writing
    def build_events(self):
        out = [None] * (self.max_id + 1)
        for i, e in self.base.items():
            if e: out[i] = e
        nid = self.max_id + 1
        for (x, y, e) in self.events:
            e = copy.deepcopy(e)
            out.append({"id": nid, "name": e["name"], "note": e["note"], "pages": e["pages"], "x": x, "y": y})
            nid += 1
        while len(out) > 1 and out[-1] is None: out.pop()
        return out

    def to_json(self):
        data, events = self.resolve(), self.build_events()
        j = dict(self.props)
        j["data"], j["events"] = data, events
        return j

    def write_to(self, path):
        data, events = self.resolve(), self.build_events()
        write_map(path, dict(self.props), data, events)
        return len([e for e in events if e])

    def stage(self, staging=W_STAGING):
        os.makedirs(staging, exist_ok=True)
        path = os.path.join(staging, "Map%03d.json" % self.id)
        n = self.write_to(path)
        return path, n

    # ------------------------------------------------------------------------------------------------ helpers for the plans
    def note(self, add=None, drop=None):
        n = self.props.get("note", "")
        if drop:
            n = re.sub(drop, "", n)
        if add and add not in n:
            n = n.rstrip("\n") + "\n" + add
        self.props["note"] = n

    def oprop(self, key, x, y, name=None, priority=None, occupy=None, note=""):
        """one of the Silent's props (tools/osada/props_index.json)"""
        p = OSADA_IDX[key]
        floor = p["place"] in ("floor", "floor2", "floor3")
        prio = priority if priority is not None else (1 if floor else 0)
        tags = ("<Occupy:%s>" % occupy if occupy else "") + note
        return self.ev(x, y, p["sheet"], p["index"], p["direction"], p["pattern"], name=name or p.get("name", key),
                       priority=prio, through=prio != 1, note=tags)

    def pic(self, x, y, char, idx, d, pat, name, floor=False, note="", step=False, prio=None):
        """any character-sheet picture: on the floor (same as characters, blocks its cell) or a decal / wall thing"""
        pr = prio if prio is not None else (1 if floor else 0)
        return self.ev(x, y, char, idx, d, pat, name=name, priority=pr, through=pr != 1, step=step, note=note)


# ==================================================================================================== decor macros
# (all coordinates are map cells; "wall" things hang on a wall face cell, "floor" things stand on a floor cell)

def window2(mp, x, y_top, curtain=1, style="night", length=120, light=True, name="okno (słońce)"):
    """a window two cells tall (rows y_top, y_top+1) on a wall face: the panes (B), a curtain (B row 12) on layer 3, and
    the sun by day from its lower cell"""
    k = {"night": (0, 2), "shutters": (2, 2), "small": (1, 0), "arch": (4, 2), "stone": (3, 6)}[style]
    if style in ("small", "stone"):
        mp.t("B", k[0], k[1], x, y_top + 1)
    else:
        mp.tiles("B", k[0], k[1], 1, 2, x, y_top)
    if curtain is not None:
        mp.tiles("B", curtain, 12, 1, 2, x, y_top, z=3)
    if light:
        mp.light(x, y_top + 1, cone(length), name)
    mp.wall_items.append(("okna", "window", x, y_top))


def shelf_wall(mp, x, y, which):
    """a small wall shelf (D sheet, one cell) on a wall face: 'jars' D(4,4)/(4,5)? -> the D shelves of row 2/4"""
    c, r = {"books": (4, 2), "bread": (5, 2), "plates": (6, 2), "jug": (7, 2), "baskets": (4, 4), "vase": (5, 4),
            "pots": (6, 4), "flower": (7, 4)}[which]
    mp.t("D", c, r, x, y, z=3)
    mp.t("D", c, r + 1, x, y + 1, z=3)


def wall_d(mp, x, y, c, r, z=3):
    """one D-sheet tile hung on a wall cell (shields, swords, mirrors, pans...)"""
    mp.t("D", c, r, x, y, z=z)


def floor_d(mp, x, y, c, r, w=1, h=1, solid=True, z=2):
    """a D-sheet thing standing on the floor (barrels, sacks, crates, plants): its bottom row on row y"""
    mp.tiles("D", c, r, w, h, x, y - h + 1, z=z)
    if solid:
        for dx in range(w): mp.solid.add((x + dx, y))


def on_top(mp, x, y, sheet, c, r):
    """a small tile thing (layer 3) lying on a table / counter / shelf cell"""
    mp.t(sheet, c, r, x, y, z=3)


def deco(mp, x, y, idx, d, pat, name, prio=0, step=False, note=""):
    """a !Decoration_static picture (bowls, bread, books, plates, paintings ...): below the characters by default"""
    return mp.ev(x, y, "!Decoration_static", idx, d, pat, name=name, priority=prio, through=prio != 1, step=step, note=note)


def candle_on(mp, x, y, kind="one", name="Świeca"):
    """a lit candle (!Decoration2, animated) standing on a table / shelf / counter cell"""
    idx, d = {"one": (1, 2), "three": (1, 6), "two": (5, 2), "wall": (0, 2)}[kind]
    note = {"one": L_CANDLE_SMALL, "three": L_CANDLES3, "two": L_CANDLE, "wall": L_SCONCE}[kind]
    return mp.ev(x, y, "!Decoration2", idx, d, 0, name=name, priority=0, through=True, step=True, note=note)


def lantern(mp, x, y_wall, style=0, light=L_LANTERN, name="Latarnia"):
    """a lantern on a bracket (!Decoration char 7): it hangs on wall cell (x, y_wall), its event one row lower"""
    return mp.ev(x, y_wall + 1, "!Decoration", 7, [2, 4, 6, 8][style], 0, name=name, priority=0, through=True, step=True, note=light)


def torch_wall(mp, x, y, name="Pochodnia"):
    """a burning torch on a wall face (!Decoration char 3 dir 4)"""
    return mp.ev(x, y, "!Decoration", 3, 4, 0, name=name, priority=0, through=True, step=True, note=L_TORCH)


def sconce_wall(mp, x, y, name="Świeca na ścianie"):
    return mp.ev(x, y, "!Decoration2", 0, 2, 0, name=name, priority=0, through=True, step=True, note=L_SCONCE)


def hang_pole(mp, x, y, which, name="Wiszące zapasy"):
    """things hanging from a pole (!Decoration_static dir 8): pole, hams, fish, herbs, garlic, firewood"""
    char, pat = {"pole": (2, 0), "hams": (2, 1), "fish": (2, 2), "herbs": (3, 0), "garlic": (3, 1), "wood": (3, 2)}[which]
    return mp.ev(x, y, "!Decoration_static", char, 8, pat, name=name, priority=0, through=True)


def painting(mp, x, y, d, pat, name="Obraz"):
    """a framed painting (!Decoration_static char 6/7, dir 4..8)"""
    idx = 6 if pat in (2,) and d in (4,) else None
    return mp.ev(x, y, "!Decoration_static", 7 if (d, pat) not in ((4, 2), (6, 2), (8, 1)) else 6, d, pat, name=name,
                 priority=0, through=True)
