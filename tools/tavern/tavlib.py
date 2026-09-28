# Shared pieces for the new tavern interior (Map001 "Pod Złotym Kuflem") and its guest rooms, built from the Winlu Fantasy
# INTERIOR Remaster set (tileset 8 "Wilu Fantasy Interior": A2 borders + rugs, A3 walls, A4 floors, A5 stairs/hearths,
# B windows/curtains/pillars, C furniture, D clutter, E = Fantasy_Inside_Shops: counters, bar shelves, barrel racks).
#
# Grows out of tools/newstart/nslib.py (the editor-exact autotile shapes, NewMap's layers, blockers, pictures, lights, writing
# a map file like the editor). What it adds:
#   - events 1..12 of the current Map001 kept at their ids (plugins and tests find Borgar & co. by id / name), moved to new spots;
#   - block props: rectangles of tiles from a sheet onto layer 2 or 3, with an optional blocker event over the cells that stop
#     the player (tileset 8 has almost no passage flags, so furniture is closed like on Map019: invisible events with
#     ChoppableTree's <Occupy:right=,up=> note);
#   - a cell map of what is solid, so the generator can check walking paths itself (BFS) before the game does.
# Nothing here writes data/: staged maps go to tools/tavern/staging/.
import sys, os, json, copy
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "newstart"))
from nslib import NewMap, B, C, D, E, A5, blank_page, write_map, ROOT, floor_shape, wall_shape, is_wall_kind   # noqa: E402

STAGING = os.path.join(HERE, "staging")
DOCS = os.path.join(ROOT, "docs", "tawerna_nowa")
TILESET = 8
WINLU = "img/tilesets/Winlu Fantasy Tileset - Interior/Remaster/"

def load_json(p):
    with open(p, "rb") as f:
        return json.loads(f.read().decode("utf-8"))

MAP001 = load_json(ROOT + "data/Map001.json")
FLAGS8 = load_json(ROOT + "data/Tilesets.json")[TILESET]["flags"]

def tile_blocks(tid):
    """the tileset's own passage flags stop the player on this tile (all four directions closed, no star)"""
    f = FLAGS8[tid] if tid < len(FLAGS8) else 0
    return (f & 0x10) == 0 and (f & 0xF) == 0xF
KEPT = {e["id"]: e for e in MAP001["events"] if e and e["id"] <= 12}

# sheet name -> tile id function (col, row on the sheet, 48 px tiles)
SHEET = {"B": B, "C": C, "D": D, "E": E, "A5": A5}

class TavernMap(NewMap):
    """a tavern interior on tileset 8. keep_ids: move events 1..12 of the current Map001 here (dict id -> (x, y))"""
    def __init__(self, w, h, note, display="Tawerna", seed=1, kept_from=None):
        NewMap.__init__(self, 1, w, h, TILESET, display, note, seed, bgm="Town1", autoplay=True)
        # the map's own properties from the current Map001 (music, name) - only size, tileset and note change
        for k, v in MAP001.items():
            if k not in ("data", "events", "width", "height", "tilesetId", "note", "displayName"):
                self.props[k] = copy.deepcopy(v)
        self.kept = {}           # id -> (x, y, event)
        self.solid = set()       # cells the player cannot enter (walls, furniture) - for the generator's own path check
        self.blocked = set()     # cells an event really closes in the game (blockers, solid pictures)
        self.zones = []          # (name_pl, x0, y0, x1, y1, colour) for the overview picture
        self.labels = []         # (text, x, y) extra small labels
    # ---- kept events
    def keep(self, eid, x, y, **changes):
        e = copy.deepcopy(KEPT[eid])
        for k, v in changes.items(): e[k] = v
        self.kept[eid] = (x, y, e)
        self.taken.add((x, y))
        return e
    # ---- tiles
    def tiles(self, sheet, sc, sr, w, h, x, y, z=2, skip=()):
        """copy a w x h block of tiles from a sheet (B/C/D/E/A5) to map (x, y) on layer z"""
        f = SHEET[sheet]
        for dy in range(h):
            for dx in range(w):
                if (dx, dy) in skip: continue
                self.tile(z, x + dx, y + dy, f(sc + dx, sr + dy))
    def t(self, sheet, sc, sr, x, y, z=2):
        self.tile(z, x, y, SHEET[sheet](sc, sr))
    def solidify(self, cells):
        for c in cells: self.solid.add(c)
    def block(self, x0, y0, x1, y1, name="Blokada"):
        """an invisible blocker over the rectangle (and marks it solid)"""
        self.solidify(self.rect(x0, y0, x1, y1))
        self.blocked |= self.rect(x0, y0, x1, y1)
        return self.blocker(x0, y0, x1, y1, name)
    def prop(self, sheet, sc, sr, w, h, x, y, z=2, solid=None, name="Mebel"):
        """a piece of furniture: its tiles, and a blocker over `solid` (x0, y0, x1, y1 in map cells) if given"""
        self.tiles(sheet, sc, sr, w, h, x, y, z)
        if solid: self.block(*solid, name=name)
    def pic(self, x, y, char, index=0, direction=2, pattern=0, name="", priority=1, through=False, step=False, solid=True, cmds=None, trigger=0, note=""):
        """a character-sheet picture (an event); solid: its own cell stops the player (priority 1, not through)"""
        e = self.picture(x, y, char, index, direction, pattern, name=name, priority=priority, trigger=trigger, cmds=cmds, note=note, through=through, step=step)
        if priority == 1 and not through and solid:
            self.solid.add((x, y)); self.blocked.add((x, y))
        return e
    def zone(self, name, x0, y0, x1, y1, colour):
        self.zones.append((name, x0, y0, x1, y1, colour))
    # ---- writing
    keep_slots = 12              # ids 1..12 are the current Map001's (0 for a new map)
    def build_events(self):
        events = [None] * (self.keep_slots + 1)
        for eid in range(1, self.keep_slots + 1):
            if eid in self.kept:
                x, y, e = self.kept[eid]
                e = copy.deepcopy(e); e["x"], e["y"] = x, y
                events[eid] = e
        nid = self.keep_slots + 1
        for (x, y, e) in self.events:
            e = copy.deepcopy(e)
            events.append({"id": nid, "name": e["name"], "note": e["note"], "pages": e["pages"], "x": x, "y": y})
            nid += 1
        # (ids 1..12 missing from `kept` stay null so the numbering holds)
        return events
    def write_to(self, path):
        data, events = self.resolve(), self.build_events()
        props = dict(self.props)
        write_map(path, props, data, events)
        return len([e for e in events if e])
    def dump_meta(self, path, extra=None):
        meta = {"width": self.W, "height": self.H, "zones": self.zones, "labels": self.labels,
                "kept": {str(k): [v[0], v[1]] for k, v in self.kept.items()}}
        if extra: meta.update(extra)
        with open(path, "wb") as f:
            f.write(json.dumps(meta, ensure_ascii=False, indent=1).encode("utf-8"))
    # ---- checks
    def walkable(self, x, y):
        if not self.inside(x, y): return False
        if (x, y) in self.solid: return False
        z0 = self.layers[0].get((x, y))
        if z0 is None: return False
        t, v = z0
        if t == "k" and (v < 80 and v >= 48): return False          # A3 wall
        if t == "k" and 16 <= v < 48 and v in self.border_kinds: return False
        return True
    border_kinds = set()
    def reach(self, start):
        seen, todo = {start}, [start]
        while todo:
            x, y = todo.pop()
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                n = (x + dx, y + dy)
                if n not in seen and self.walkable(*n):
                    seen.add(n); todo.append(n)
        return seen
