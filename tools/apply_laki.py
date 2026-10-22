# Joins the meadows Łąka#2 (Map017) and Łąka#3 (Map018) to grandpa's field (Map003) - tools/newstart/layout.py MEADOW_EDGES.
# RUN IT ONLY WITH THE RPG MAKER EDITOR CLOSED (the editor rewrites the maps on save), then open the project again.
#
#   python tools/apply_laki.py --dry-run     only prints what it would change
#   python tools/apply_laki.py               changes data/Map003.json, Map017.json, Map018.json (backups first)
#   python tools/apply_laki.py --out DIR     writes the changed maps into DIR instead (data/ untouched; staging / tests)
#
# What it changes (2026-10-18, the user's decision "podłącz Łąki #2 i #3"):
#   data/Map003.json  - the user's map: NOTHING is moved. Two gaps in its border, made like the east one to "Skraj lasu"
#                       (tools/apply_newstart_maps.py): grass in place of the hedge/forest edge, the dirt path carried on to the edge,
#                       neighbouring autotiles reshaped:
#                         south: (8..10, 28..29), its path from (9..10, 26) carried down to the edge -> Łąka#2
#                         west:  (0..1, 14..16), a one-tile trail from the path at (9, 18) along row 16 to the edge -> Łąka#3
#                       + 6 touch transfers on the edge tiles
#   data/Map017.json  - 3 touch transfers on the north edge (8..10, 0), where its trail reaches the edge -> Map003
#   data/Map018.json  - 3 touch transfers on the east edge (39, 14..16), where its path reaches the edge -> Map003
# The transfers are copies of the author's own edge transfer on Map003 (player touch, below characters), only the target and the
# direction differ; the player lands one tile inside the other map, facing into it. Region 7 (Farming's "never farmland") goes
# on the exit and landing tiles, as on the other exits. Safe to run twice: what is there already is left alone.
# Every map is written in the editor's own layout (UTF-8, LF, properties / data / one event per line) and backed up first.
import json, os, sys, shutil, copy, datetime

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "newstart"))
from layout import meadow_transfers, MEADOW_EDGES

DATA = os.path.join(ROOT, "data")
DRY = "--dry-run" in sys.argv
OUT = sys.argv[sys.argv.index("--out") + 1] if "--out" in sys.argv else None
BACKUP = sys.argv[sys.argv.index("--backup") + 1] if "--backup" in sys.argv else os.path.join(ROOT, "backup_art_2026-10-18", "laki")
NAMES = {3: "Domek - Zewnętrze", 17: "Łąka#2", 18: "Łąka#3"}
changes = []

def say(msg):
    changes.append(msg)
    print(("[dry-run] " if DRY else "") + msg)

def fail(msg):
    print("STOP: " + msg)
    print("Nothing was changed.")
    sys.exit(1)

def dump(o):
    return json.dumps(o, ensure_ascii=False, separators=(",", ":"))

def map_text(m):
    props = {k: v for k, v in m.items() if k not in ("data", "events")}
    lines = ["{", dump(props)[1:-1] + ",", '"data":' + dump(m["data"]) + ",", '"events":[']
    lines += [dump(e) + ("," if i < len(m["events"]) - 1 else "") for i, e in enumerate(m["events"])]
    lines += ["]", "}"]
    return "\n".join(lines)

def read(mid):
    path = os.path.join(DATA, "Map%03d.json" % mid)
    raw = open(path, "rb").read()
    m = json.loads(raw.decode("utf-8"))
    if map_text(m).encode("utf-8") != raw:
        fail("data/Map%03d.json is not in the editor's layout (a byte-for-byte rewrite would change it) - open and save it in the editor first" % mid)
    return raw, m

def write(mid, raw_before, m):
    name = "Map%03d.json" % mid
    data = map_text(m).encode("utf-8")
    if data == raw_before: return False
    if OUT:
        os.makedirs(OUT, exist_ok=True)
        open(os.path.join(OUT, name), "wb").write(data)
        return True
    if not DRY:
        os.makedirs(BACKUP, exist_ok=True)
        dest = os.path.join(BACKUP, name)
        if os.path.exists(dest):
            dest = os.path.join(BACKUP, name.replace(".json", datetime.datetime.now().strftime("_%Y%m%d_%H%M%S.json")))
        shutil.copyfile(os.path.join(DATA, name), dest)
        open(os.path.join(DATA, name), "wb").write(data)
    return True

# ------------------------------------------------------------------ autotiles (the editor's floor shapes; tools/apply_newstart_maps.py)
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

def kind_of(t): return (t - 2048) // 48 if t >= 2048 else None
def is_floor_kind(k):   # A2 and the tops of A4 (the only autotiles touched here)
    return k is not None and (16 <= k < 48 or (k >= 80 and ((k - 80) // 8) % 2 == 0))

def reshape(m, layer, cells):
    """the editor's autotile shapes again for these cells (only floor-type autotiles; off the map counts as the same)"""
    W, H = m["width"], m["height"]
    d = m["data"]
    base = layer * W * H
    for (x, y) in cells:
        if not (0 <= x < W and 0 <= y < H): continue
        t = d[base + y * W + x]
        k = kind_of(t)
        if not is_floor_kind(k): continue
        def same(dx, dy):
            nx, ny = x + dx, y + dy
            if nx < 0 or ny < 0 or nx >= W or ny >= H: return True
            return kind_of(d[base + ny * W + nx]) == k
        d[base + y * W + x] = 2048 + k * 48 + floor_shape(same)

def around(cells, r=1):
    out = set()
    for (x, y) in cells:
        for dy in range(-r, r + 1):
            for dx in range(-r, r + 1): out.add((x + dx, y + dy))
    return out

# ------------------------------------------------------------------ the transfers (a copy of the author's own edge transfer on Map003)
TEMPLATE = None
def transfer_event(eid, x, y, to_map, tx, ty, d, name):
    e = copy.deepcopy(TEMPLATE)
    e.update({"id": eid, "name": name, "note": "", "x": x, "y": y})
    pg = e["pages"][0]
    pg["list"] = [{"code": 201, "indent": 0, "parameters": [0, to_map, tx, ty, d, 0]}, {"code": 0, "indent": 0, "parameters": []}]
    return e

def add_transfers(mid, m):
    events = m["events"]
    bad = [i for i, e in enumerate(events) if e and e["id"] != i]
    if bad: fail("Map%03d: event ids do not match their places in the list (%s) - open and save the map in the editor first" % (mid, bad[:5]))
    for fm, x, y, tm, tx, ty, d, kind in meadow_transfers():
        if fm != mid: continue
        here = [e for e in events if e and e["x"] == x and e["y"] == y]
        if any(any(c["code"] == 201 and c["parameters"][1] == tm for p in e["pages"] for c in p["list"]) for e in here):
            continue
        if here:
            fail("Map%03d (%d,%d) already has event %d '%s'" % (mid, x, y, here[0]["id"], here[0]["name"]))
        eid = len(events)
        events.append(transfer_event(eid, x, y, tm, tx, ty, d, "Przejście -> " + NAMES[tm]))
        say("Map%03d: add event %d at (%d,%d): touch transfer -> Map%03d '%s' (%d,%d), facing %s" %
            (mid, eid, x, y, tm, NAMES[tm], tx, ty, {2: "down", 4: "left", 6: "right", 8: "up"}[d]))

def landing_region(mid, m):
    W, H = m["width"], m["height"]
    cells = [(tx, ty) for fm, x, y, tm, tx, ty, d, k in meadow_transfers() if tm == mid]
    cells += [(x, y) for fm, x, y, tm, tx, ty, d, k in meadow_transfers() if fm == mid]
    n = 0
    for (x, y) in cells:
        i = 5 * W * H + y * W + x
        if m["data"][i] == 0:
            m["data"][i] = 7; n += 1
    if n: say("Map%03d: region 7 on %d exit/landing tiles (no berry bush or digging right where the player arrives)" % (mid, n))

# ------------------------------------------------------------------ Map003: the two gaps in the border and the paths to them
m3_raw, m3 = read(3)
TEMPLATE = next(e for e in m3["events"] if e and not e["pages"][0]["image"]["characterName"] and not e["pages"][0]["image"]["tileId"]
                and any(c["code"] == 201 for c in e["pages"][0]["list"]))
W, H = m3["width"], m3["height"]
d = m3["data"]
at = lambda z, x, y: d[z * W * H + y * W + x]
GRASS, PATH_KIND = 16, 39

def open_gap(label, gap, path, clear_upper):
    """gap: border tiles that become grass; path: tiles that get the dirt path (layer 2 of the editor = data layer 1);
    clear_upper: gap tiles whose border overlay (layer 1) goes and which get no path"""
    cells = set(gap) | set(path)
    if all(kind_of(at(0, x, y)) != 119 and not (1536 <= at(0, x, y) < 2048) for (x, y) in gap) and \
       all(kind_of(at(1, x, y)) == PATH_KIND for (x, y) in path):
        print("Map003: the %s gap is already open" % label); return
    busy = [e for e in m3["events"] if e and (e["x"], e["y"]) in cells]
    upper = [(x, y) for (x, y) in cells if at(2, x, y) or at(3, x, y)]
    if busy or upper:
        fail("Map003 %s: tiles not free (events %s, upper-layer tiles %s) - was the map edited?" % (label, [(e["id"], e["name"]) for e in busy], upper[:5]))
    for (x, y) in gap:
        d[y * W + x] = 2048 + GRASS * 48                    # grass (shape fixed below)
        d[4 * W * H + y * W + x] = 0                        # no wall shadow
    for (x, y) in clear_upper:
        d[W * H + y * W + x] = 0                            # the hedge/forest overlay goes
    for (x, y) in path:
        d[W * H + y * W + x] = 2048 + PATH_KIND * 48        # the dirt path, carried on to the edge
    reshape(m3, 0, around(gap))
    reshape(m3, 1, around(cells))
    say("Map003: %s - gap %s, path %d tiles; neighbouring autotiles reshaped" % (label, sorted(gap), len(path)))

# south: the path at (9..10, 26) carried down through (9..10, 27..29); the gap three tiles wide (8..10, 28..29)
open_gap("south exit to Łąka#2",
         gap=[(x, y) for x in (8, 9, 10) for y in (28, 29)],
         path=[(x, y) for x in (9, 10) for y in (27, 28, 29)],
         clear_upper=[(8, 28), (8, 29)])
# west: a one-tile trail from the path's top at (9, 18): up to (9, 17), along row 16 to the edge; the gap (0..1, 14..16)
open_gap("west exit to Łąka#3",
         gap=[(x, y) for x in (0, 1) for y in (14, 15, 16)],
         path=[(9, 17)] + [(x, 16) for x in range(0, 10)],
         clear_upper=[(0, 14), (1, 14), (0, 15), (1, 15)])
add_transfers(3, m3)
landing_region(3, m3)
# region 7 on the new path tiles too: Farming's procedural berry bushes may grow on dirt paths (kind 39 = earth) and would block
# the one-tile trail (seen at (7, 16) in the first try)
NEW_PATH = [(x, y) for x in (9, 10) for y in (27, 28, 29)] + [(9, 17)] + [(x, 16) for x in range(0, 10)]
n = 0
for (x, y) in NEW_PATH:
    i = 5 * W * H + y * W + x
    if d[i] == 0:
        d[i] = 7; n += 1
if n: say("Map003: region 7 on %d new path tiles (no berry bush on the way to the meadows)" % n)
write(3, m3_raw, m3)

# ------------------------------------------------------------------ the meadows: the transfers on their edges
for mid in (17, 18):
    raw, m = read(mid)
    add_transfers(mid, m)
    landing_region(mid, m)
    write(mid, raw, m)

print()
if not changes:
    print("Nothing to do: everything is already in place.")
elif DRY:
    print("Dry run: %d changes listed above, no file was written." % len(changes))
elif OUT:
    print("%d changes written to %s (data/ untouched)." % (len(changes), OUT))
else:
    print("Done: %d changes. Backups in %s" % (len(changes), BACKUP))
    print("Open the project in RPG Maker again (the editor must re-read the maps before its next save).")
