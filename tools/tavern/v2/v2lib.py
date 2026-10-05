# The tavern's ground floor, second build (2026-10-04, user: "przebuduj wnętrze tawerny żeby było ładne i profesjonalne
# (oprócz wejścia z tablicami bo to jest ok)"). A cell-exact model of Map001 on tileset 8 (Winlu Fantasy Interior
# Remaster) built the way the tileset's author builds his own interiors (tools/town/winlu_samples/Map004.json):
#   - layer 0: the dark A2 wall-top border (kind 24, the same as the kept vestibule) everywhere outside the rooms, A4 floors,
#     A3 wall faces 2-3 rows tall above every room (the wall-top row above them), openings cut through as floor;
#   - layer 1: A2 rugs and runners, A5 round rugs;
#   - layers 2/3: B windows and curtains on the wall faces, C/D/E furniture standing on the first floor row with its top
#     over the wall, clutter on top of tables and shelves (layer 3 over layer 2);
#   - events: the author's character pictures (fireplaces, chandeliers, candles, banners, chests...), our own props, lights
#     (RoomLighting <Light> notes), the gameplay hooks (<Tavern:...>), the people.
# The vestibule (KEEP: x 36..64, y 74..83, all six layers and its events) is copied cell for cell from the map as it was
# when this build started (base/Map001_start.json) and never written.
# Nothing here writes data/: build_v2.py stages tools/tavern/v2/staging/Map001.json, install_v2.py installs it.
import os, sys, json, copy, collections
HERE = os.path.dirname(os.path.abspath(__file__))
TAV = os.path.abspath(os.path.join(HERE, ".."))
ROOT = os.path.abspath(os.path.join(TAV, "..", "..")).replace("\\", "/") + "/"
sys.path.insert(0, os.path.join(ROOT, "tools", "newstart"))
sys.path.insert(0, os.path.join(ROOT, "tools", "town"))
from nslib import FLOOR, SHAPE, floor_shape, wall_shape, is_wall_kind, blank_page, write_map, B, C, D, E, A5   # noqa: E402

BASE = os.path.join(HERE, "base", "Map001_start.json")
KEEP = (36, 74, 64, 83)          # x0, y0, x1, y1 of the vestibule (inclusive): never written
BORDER = 24                      # the wall-top border kind of the vestibule
W, H = 101, 84

def load_json(p):
    with open(p, "rb") as f:
        return json.loads(f.read().decode("utf-8"))

TILESET = load_json(ROOT + "data/Tilesets.json")[8]
FLAGS = TILESET["flags"]
SHEETF = {"B": B, "C": C, "D": D, "E": E, "A5": A5}

def kind_of(t):
    return (t - 2048) // 48 if t >= 2048 else None

def in_keep(x, y):
    return KEEP[0] <= x <= KEEP[2] and KEEP[1] <= y <= KEEP[3]


class Map2:
    def __init__(self, base=BASE):
        self.base = load_json(base)
        assert self.base["width"] == W and self.base["height"] == H
        d = self.base["data"]
        self.raw = lambda z, x, y: d[(z * H + y) * W + x]
        self.L = [dict() for _ in range(4)]          # (x, y) -> ("k", kind) | ("t", tileId)
        self.shadow, self.region = {}, {}
        self.frozen = {(x, y) for y in range(KEEP[1], KEEP[3] + 1) for x in range(KEEP[0], KEEP[2] + 1)}
        for y in range(H):
            for x in range(W):
                if (x, y) not in self.frozen: self.L[0][(x, y)] = ("k", BORDER)
        self.events = []             # dicts: id (fixed or None), x, y, name, note, pages
        self.rooms = {}              # name -> dict(floor rect, kinds...)
        self.solid_events = set()    # cells closed by an event (priority 1, not through) - for the checks
        self.notes = []
        self.hooks = []
        self.things = []             # (kind, cells, room) placed furniture records for the checks
        self.spots = []              # guest spots
    # ------------------------------------------------------------------ cells and tiles
    def ok(self, x, y):
        return 0 <= x < W and 0 <= y < H and (x, y) not in self.frozen
    def set(self, z, x, y, v):
        if not self.ok(x, y): return False
        if v is None: self.L[z].pop((x, y), None)
        else: self.L[z][(x, y)] = v
        return True
    def kind(self, z, x, y, k): return self.set(z, x, y, ("k", k))
    def tile(self, z, x, y, tid): return self.set(z, x, y, ("t", tid))
    def t(self, z, x, y, sheet, c, r): return self.tile(z, x, y, SHEETF[sheet](c, r))
    def stamp(self, z, x, y, sheet, c0, r0, w=1, h=1, skip=()):
        """a w x h block of a sheet (B/C/D/E/A5) with its top-left on map (x, y)"""
        for dy in range(h):
            for dx in range(w):
                if (dx, dy) in skip: continue
                self.t(z, x + dx, y + dy, sheet, c0 + dx, r0 + dy)
    def rect(self, x0, y0, x1, y1):
        return [(x, y) for y in range(y0, y1 + 1) for x in range(x0, x1 + 1)]
    def fill(self, z, x0, y0, x1, y1, k):
        for (x, y) in self.rect(x0, y0, x1, y1): self.kind(z, x, y, k)
    def get(self, z, x, y):
        """('k', kind) / ('t', tid) of a cell, the kept vestibule's own tiles read from the base map"""
        if not (0 <= x < W and 0 <= y < H): return None
        if (x, y) in self.frozen:
            t = self.raw(z, x, y)
            if t >= 2048: return ("k", kind_of(t))
            return ("t", t) if t else None
        return self.L[z].get((x, y))
    def kind_at(self, z, x, y):
        v = self.get(z, x, y)
        return v[1] if v and v[0] == "k" else None
    # ------------------------------------------------------------------ rooms
    def room(self, name, x0, y0, x1, y1, floor, wall, wall_h=3, wall_x=None, key=None):
        """a room: floor cells (A4 `floor`) x0..x1, y0..y1 and its north wall face (A3 `wall`) wall_h rows above y0;
        wall_x: the wall's own x range (default the floor's). The wall-top border row above stays kind 24."""
        self.fill(0, x0, y0, x1, y1, floor)
        wx0, wx1 = wall_x or (x0, x1)
        if wall:
            self.fill(0, wx0, y0 - wall_h, wx1, y0 - 1, wall)
        self.rooms[name] = {"name": name, "key": key, "rect": (x0, y0, x1, y1), "floor": floor, "wall": wall, "wall_h": wall_h}
        return self.rooms[name]
    def opening(self, x0, y0, x1, y1, floor):
        """a doorway: floor cut through a border / wall face"""
        self.fill(0, x0, y0, x1, y1, floor)
    def wall_seg(self, x0, x1, y0, y1, wall):
        """part of a wall face in another kind (a stone chimney breast in a plaster wall, a panelled section)"""
        self.fill(0, x0, y0, x1, y1, wall)
    # ------------------------------------------------------------------ events
    def event(self, x, y, name="", note="", pages=None, eid=None):
        e = {"id": eid, "x": x, "y": y, "name": name, "note": note, "pages": pages or [blank_page()]}
        if (x, y) in self.frozen and eid is None:
            raise ValueError("an event in the kept vestibule: %s at %d,%d" % (name, x, y))
        self.events.append(e)
        pg = e["pages"][0]
        if pg["priorityType"] == 1 and not pg["through"]:
            self.solid_events.add((x, y))
            for c in occupy_cells(x, y, note): self.solid_events.add(c)
        return e
    def pic(self, x, y, char, index=0, direction=2, pattern=0, name="", priority=1, through=None, step=False, note="",
            trigger=0, cmds=None, dirfix=True, eid=None):
        if through is None: through = priority != 1
        pg = blank_page(priority=priority, trigger=trigger, image={"characterName": char, "characterIndex": index,
                        "direction": direction, "pattern": pattern}, through=through, cmds=cmds, step=step, direction_fix=dirfix)
        return self.event(x, y, name, note, [pg], eid)
    def tile_ev(self, x, y, sheet, c, r, name="", priority=0, through=True, note=""):
        pg = blank_page(priority=priority, image={"tileId": SHEETF[sheet](c, r)}, through=through)
        return self.event(x, y, name, note, [pg])
    def light(self, x, y, note, name="światło"):
        return self.event(x, y, name, note, [blank_page()])
    def hook(self, tag, x, y, name, eid=None, note=""):
        """a gameplay hook: an empty event, same as characters, action button, a Comment with the tag on page 1"""
        pg = blank_page(priority=1, trigger=0, cmds=[{"code": 108, "indent": 0, "parameters": [tag]}])
        self.hooks.append((tag, x, y))
        return self.event(x, y, name, note, [pg], eid)
    def keep_event(self, src, x, y, eid=None, **changes):
        e = copy.deepcopy(src)
        e.update(changes)
        e["x"], e["y"] = x, y
        e = {"id": eid if eid is not None else src["id"], "x": x, "y": y, "name": e["name"], "note": e["note"], "pages": e["pages"]}
        self.events.append(e)
        pg = e["pages"][0]
        if pg["priorityType"] == 1 and not pg["through"]:
            self.solid_events.add((x, y))
            for c in occupy_cells(x, y, e["note"]): self.solid_events.add(c)
        return e
    # ------------------------------------------------------------------ writing
    def resolve(self):
        data = list(self.base["data"])        # the vestibule's cells stay as they are
        for z in range(4):
            lay = self.L[z]
            for y in range(H):
                for x in range(W):
                    if (x, y) in self.frozen: continue
                    v = lay.get((x, y))
                    i = (z * H + y) * W + x
                    if v is None: data[i] = 0; continue
                    t, val = v
                    if t == "t": data[i] = val; continue
                    k = val
                    def same(dx, dy, x=x, y=y, k=k, z=z):
                        nx, ny = x + dx, y + dy
                        if nx < 0 or ny < 0 or nx >= W or ny >= H: return True
                        return self.kind_at(z, nx, ny) == k
                    shape = wall_shape(same) if is_wall_kind(k) else floor_shape(same)
                    data[i] = 2048 + k * 48 + shape
        for y in range(H):
            for x in range(W):
                if (x, y) in self.frozen: continue
                data[(4 * H + y) * W + x] = self.shadow.get((x, y), 0)
                data[(5 * H + y) * W + x] = self.region.get((x, y), 0)
        return data
    def build_events(self):
        fixed = {e["id"]: e for e in self.events if e["id"] is not None}
        assert len(fixed) == len([e for e in self.events if e["id"] is not None]), "two events with one fixed id"
        free = [e for e in self.events if e["id"] is None]
        out = {}
        out.update(fixed)
        nid = 1
        for e in free:
            while nid in out: nid += 1
            e["id"] = nid
            out[nid] = e
        top = max(out) if out else 0
        events = [None] * (top + 1)
        for i, e in out.items():
            events[i] = {"id": i, "name": e["name"], "note": e["note"], "pages": e["pages"], "x": e["x"], "y": e["y"]}
        return events
    def design(self, note=None):
        """the whole map as built (the base map's 101 x 84 frame, the vestibule where it always was)"""
        data, events = self.resolve(), self.build_events()
        props = {k: v for k, v in self.base.items() if k not in ("data", "events")}
        if note is not None: props["note"] = note
        return {"data": data, "events": events, "props": props}
    def write(self, path, note=None, crop=0):
        """the map file; crop: rows cut off the top (the empty dark above the building) - every event moves up with them"""
        mp = self.design(note)
        data, events, props = mp["data"], mp["events"], mp["props"]
        if crop:
            H2 = H - crop
            nd = []
            for z in range(6):
                for y in range(crop, H):
                    nd.extend(data[(z * H + y) * W:(z * H + y + 1) * W])
            data = nd
            events = [None if e is None else dict(e, y=e["y"] - crop) for e in events]
            bad = [(e["id"], e["name"], e["y"]) for e in events if e and e["y"] < 0]
            if bad: raise ValueError("events above the cut: %s" % bad)
            props = dict(props, height=H2)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        write_map(path, props, data, events)
        return {"data": data, "events": events, "props": props}
    def check_keep_edges(self, data):
        """every autotile of the kept vestibule must keep the shape the editor gave it, now that its neighbours outside
        are new: a list of (x, y, layer, stored shape, shape the new neighbours give)"""
        bad = []
        for (x, y) in sorted(self.frozen):
            for z in range(4):
                t = data[(z * H + y) * W + x]
                if t < 2048: continue
                k = kind_of(t)
                def same(dx, dy):
                    nx, ny = x + dx, y + dy
                    if nx < 0 or ny < 0 or nx >= W or ny >= H: return True
                    tt = data[(z * H + ny) * W + nx]
                    return tt >= 2048 and kind_of(tt) == k
                s = wall_shape(same) if is_wall_kind(k) else floor_shape(same)
                if s != (t - 2048) % 48: bad.append((x, y, z, (t - 2048) % 48, s))
        return bad


def occupy_cells(x, y, note):
    import re
    m = re.search(r"<Occupy:([^>]*)>", note or "")
    if not m: return []
    o = {"left": 0, "right": 0, "up": 0, "down": 0}
    for kv in m.group(1).split(","):
        if "=" in kv:
            k, v = kv.split("="); o[k.strip()] = int(v)
    return [(x + dx, y + dy) for dy in range(-o["up"], o["down"] + 1) for dx in range(-o["left"], o["right"] + 1) if (dx, dy) != (0, 0)]


# ---------------------------------------------------------------------------------------------- passability like the game
def passable_dirs(data, x, y, region=None):
    """the four direction bits a cell lets through (2, 4, 6, 8 -> True/False) the way Game_Map.checkPassage reads the
    tiles (top layer first, star tiles skipped) and RegionLayers.js's regions 1 (always) / 2 (never)"""
    r = data[(5 * H + y) * W + x] if region is None else region
    if r == 1: return {2: True, 4: True, 6: True, 8: True}
    if r == 2: return {2: False, 4: False, 6: False, 8: False}
    out = {}
    for d, bit in ((2, 1), (4, 2), (6, 4), (8, 8)):
        res = False
        for z in (3, 2, 1, 0):
            t = data[(z * H + y) * W + x]
            f = FLAGS[t] if t < len(FLAGS) else 0
            if f & 0x10: continue
            if (f & bit) == 0: res = True; break
            if (f & bit) == bit: res = False; break
        out[d] = res
    return out

def reach(data, events_solid, start):
    """cells walkable from start (4 ways), events closing their cells"""
    P = {}
    def pd(x, y):
        if (x, y) not in P: P[(x, y)] = passable_dirs(data, x, y)
        return P[(x, y)]
    seen = {start}
    todo = [start]
    while todo:
        x, y = todo.pop()
        for dx, dy, d in ((0, 1, 2), (-1, 0, 4), (1, 0, 6), (0, -1, 8)):
            nx, ny = x + dx, y + dy
            if not (0 <= nx < W and 0 <= ny < H) or (nx, ny) in seen: continue
            if not pd(x, y)[d] or not pd(nx, ny)[10 - d] or (nx, ny) in events_solid: continue
            seen.add((nx, ny)); todo.append((nx, ny))
    return seen
