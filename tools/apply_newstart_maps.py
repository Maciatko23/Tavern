# Hooks the generated "new start" maps (data/Map019..Map024.json, made by tools/newstart/build_newstart.py) into the game.
# RUN IT ONLY WITH THE RPG MAKER EDITOR CLOSED (the editor rewrites MapInfos/System/maps on save), then open the project again.
#
#   python tools/apply_newstart_maps.py --dry-run     only prints what it would change
#   python tools/apply_newstart_maps.py               changes the files (backups first)
#   python tools/apply_newstart_maps.py --out DIR     writes the changed files into DIR instead (data/ untouched; for tests)
#
# What it changes:
#   data/MapInfos.json  - adds the six new maps to the editor's map tree (the cottage's yard with its inside as a child,
#                         the three roads, the Lord's estate as a child of "Okolice Tawerny"); the other maps keep their order
#   data/System.json    - the new game starts in grandpa's cottage (Map019), beside the hero's straw bed
#   data/Map003.json    - "Domek - Zewnętrze": a 3-tile gap in the east wall where the old path already ends (38..39, 12..14),
#                         the path carried on through it, and 3 touch transfers on the edge (39, 12..14) -> "Skraj lasu"
#   data/Map008.json    - "Okolice Tawerny": 3 touch transfers on the bottom edge (13..15, 23) -> "Polna droga" (its lane
#                         to the tavern) and 3 on the east edge (29, 10..12) -> "Posiadłość Lorda"
# The transfers are made like the author's own edge exits on Map003/Map004 (player touch, below characters, black fade);
# the player lands one tile inside the other map, facing into it. Region 7 (Farming's "never farmland" region) is painted
# on the landing tiles so no berry bush can grow where the player arrives.
# Safe to run twice: what is already there is left alone. Every file is written in its own format (UTF-8, LF, the editor's
# layout) and backed up first to backup_art_2026-09-26/maps_before_newstart/.
import json, os, sys, shutil, copy, datetime

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "newstart"))
from layout import MAPS, START, transfers, EXISTING      # the one table both ends of every transfer come from

DATA = os.path.join(ROOT, "data")
BACKUP = os.path.join(ROOT, "backup_art_2026-09-26", "maps_before_newstart")
DRY = "--dry-run" in sys.argv
OUT = sys.argv[sys.argv.index("--out") + 1] if "--out" in sys.argv else None
NAMES = {k: v["name"] for k, v in MAPS.items()}
NAMES.update({3: "Domek - Zewnętrze", 8: "Okolice Tawerny"})
changes = []

def say(msg):
    changes.append(msg)
    print(("[dry-run] " if DRY else "") + msg)

def dump(o):
    return json.dumps(o, ensure_ascii=False, separators=(",", ":"))

def read(name):
    path = os.path.join(DATA, name)
    raw = open(path, "rb").read()
    return raw, json.loads(raw.decode("utf-8"))

def write(name, raw_before, text):
    path = os.path.join(DATA, name)
    data = text.encode("utf-8")
    if OUT:
        os.makedirs(OUT, exist_ok=True)
        with open(os.path.join(OUT, name), "wb") as f:
            f.write(data)
        return data != raw_before
    if data == raw_before:
        return False
    if not DRY:
        os.makedirs(BACKUP, exist_ok=True)
        dest = os.path.join(BACKUP, name)
        if os.path.exists(dest):   # a second run keeps the first backup and adds a dated one
            dest = os.path.join(BACKUP, name.replace(".json", datetime.datetime.now().strftime("_%Y%m%d_%H%M%S.json")))
        shutil.copyfile(path, dest)
        with open(path, "wb") as f:
            f.write(data)
    return True

def map_text(raw, m):
    """a map in the layout it had: the editor's (properties / data / one event per line, LF) or a single line"""
    if b"\n" not in raw.strip():
        return dump(m)
    props = {k: v for k, v in m.items() if k not in ("data", "events")}
    lines = ["{", dump(props)[1:-1] + ",", '"data":' + dump(m["data"]) + ",", '"events":[']
    lines += [dump(e) + ("," if i < len(m["events"]) - 1 else "") for i, e in enumerate(m["events"])]
    lines += ["]", "}"]
    return "\n".join(lines)

def fail(msg):
    print("STOP: " + msg)
    print("Nothing was changed.")
    sys.exit(1)

# ------------------------------------------------------------------ checks first: the new map files are there and are ours
infos_raw, infos = read("MapInfos.json")
for mid, spec in MAPS.items():
    path = os.path.join(DATA, "Map%03d.json" % mid)
    if not os.path.exists(path):
        fail("data/Map%03d.json is missing - run tools/newstart/build_newstart.py first." % mid)
    m = json.load(open(path, encoding="utf-8"))
    if (m["width"], m["height"]) != spec["size"] or m["tilesetId"] != spec["tileset"] or m["displayName"] != spec["display"]:
        fail("data/Map%03d.json is not the generated '%s' (size/tileset/name differ) - was a map with this id made in the editor? "
             "Then the new maps need other ids (tools/newstart/layout.py) and the generator must run again." % (mid, spec["name"]))
    info = infos[mid] if mid < len(infos) else None
    if info and info.get("name") != spec["name"]:
        fail("MapInfos already has map %d named '%s' (expected '%s')." % (mid, info.get("name"), spec["name"]))
for fm, x, y, tm, tx, ty, d, kind in transfers():
    for mid in (fm, tm):
        if mid not in MAPS and mid not in EXISTING:
            fail("a transfer goes to map %d, which is neither new nor one this script edits" % mid)
for pic in ["!Fantasy_door1.png", "!$Gate_Wood1.png", "!lamp.png", "!$Fireplace_kitchen.png"]:
    if not os.path.exists(os.path.join(ROOT, "img", "characters", pic)):
        fail("img/characters/%s is missing (the new maps use it)" % pic)

# ------------------------------------------------------------------ MapInfos: the map tree
def tree_order(infos):
    """ids in the editor's order (depth first, children after their parent, each level by the old order)"""
    nodes = [e for e in infos if e]
    kids = {}
    for e in nodes: kids.setdefault(e["parentId"], []).append(e)
    for v in kids.values(): v.sort(key=lambda e: e["order"])
    out = []
    def walk(pid):
        for e in kids.get(pid, []):
            out.append(e["id"]); walk(e["id"])
    walk(0)
    return out

new_infos = copy.deepcopy(infos)
added = []
PARENT = {19: 20, 20: 0, 21: 0, 22: 0, 23: 0, 24: 8}
while len(new_infos) <= max(MAPS): new_infos.append(None)
for mid in sorted(MAPS):
    if new_infos[mid] is None:
        new_infos[mid] = {"id": mid, "expanded": mid == 20, "name": MAPS[mid]["name"], "order": 0, "parentId": PARENT[mid], "scrollX": 0, "scrollY": 0}
        added.append(mid)
if added:
    # new roots first (the yard, then the roads), the old tree after them in its own order; the estate right after its parent
    old = tree_order([e for e in new_infos if e and e["id"] not in added])
    order = [20, 19, 21, 22, 23] + old
    if 24 in added:
        i = order.index(8)
        j = i + 1
        while j < len(order) and new_infos[order[j]]["parentId"] == 8: j += 1
        order.insert(j, 24)
    seen = set(); order = [i for i in order if not (i in seen or seen.add(i))]
    for n, mid in enumerate(order, 1):
        new_infos[mid]["order"] = n
    for mid in added:
        say("MapInfos.json: add map %d '%s' (parent %s, order %d)" % (mid, MAPS[mid]["name"], NAMES.get(PARENT[mid], "-") if PARENT[mid] else "none", new_infos[mid]["order"]))
    moved = [e["id"] for e in new_infos if e and e["id"] not in added and infos[e["id"]]["order"] != e["order"]]
    if moved: say("MapInfos.json: the other %d maps move down %d places in the tree (same order among themselves)" % (len(moved), len(added)))
else:
    print("MapInfos.json: the new maps are already listed")
write("MapInfos.json", infos_raw, "[\n" + ",\n".join(dump(e) for e in new_infos) + "\n]")

# ------------------------------------------------------------------ System: where the new game starts
sys_raw, system = read("System.json")
smap, sx, sy = START
if (system["startMapId"], system["startX"], system["startY"]) != (smap, sx, sy):
    say("System.json: start of a new game %d (%d,%d) -> %d (%d,%d) = '%s', beside the hero's straw bed" %
        (system["startMapId"], system["startX"], system["startY"], smap, sx, sy, NAMES[smap]))
    system["startMapId"], system["startX"], system["startY"] = smap, sx, sy
else:
    print("System.json: the start is already in grandpa's cottage")
write("System.json", sys_raw, dump(system))

# ------------------------------------------------------------------ helpers for the existing maps
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

TEMPLATE = None
def transfer_event(eid, x, y, to_map, tx, ty, d, name):
    """a copy of the author's own edge transfer (Map003's first picture-less 201 event): only target and direction change"""
    e = copy.deepcopy(TEMPLATE)
    e.update({"id": eid, "name": name, "note": "", "x": x, "y": y})
    pg = e["pages"][0]
    pg["list"] = [{"code": 201, "indent": 0, "parameters": [0, to_map, tx, ty, d, 0]}, {"code": 0, "indent": 0, "parameters": []}]
    return e

def add_transfers(mid, m):
    """the transfers of the layout that start on this existing map; skips the ones already there"""
    events = m["events"]
    bad = [i for i, e in enumerate(events) if e and e["id"] != i]
    if bad: fail("Map%03d: event ids do not match their places in the list (%s) - open and save the map in the editor first" % (mid, bad[:5]))
    n = 0
    for fm, x, y, tm, tx, ty, d, kind in transfers():
        if fm != mid: continue
        here = [e for e in events if e and e["x"] == x and e["y"] == y]
        if any(any(c["code"] == 201 and c["parameters"][1] == tm for p in e["pages"] for c in p["list"]) for e in here):
            continue
        if here:
            fail("Map%03d (%d,%d) already has event %d '%s' - move it, or change the exit in tools/newstart/layout.py" % (mid, x, y, here[0]["id"], here[0]["name"]))
        eid = len(events)
        events.append(transfer_event(eid, x, y, tm, tx, ty, d, "Przejście -> " + NAMES[tm]))
        say("Map%03d: add event %d at (%d,%d): touch transfer -> Map%03d '%s' (%d,%d), facing %s" %
            (mid, eid, x, y, tm, NAMES[tm], tx, ty, {2: "down", 4: "left", 6: "right", 8: "up"}[d]))
        n += 1
    # (the event list must end without trailing nulls and have no holes the editor would not write - appending keeps that)
    return n

def landing_region(mid, m):
    """region 7 (Farming: never farmland, nothing grows) on the tiles where the player lands on this map"""
    W, H = m["width"], m["height"]
    cells = [(tx, ty) for fm, x, y, tm, tx, ty, d, k in transfers() if tm == mid]
    cells += [(x, y) for fm, x, y, tm, tx, ty, d, k in transfers() if fm == mid]
    n = 0
    for (x, y) in cells:
        i = 5 * W * H + y * W + x
        if m["data"][i] == 0:
            m["data"][i] = 7; n += 1
    if n: say("Map%03d: region 7 on %d landing/exit tiles (no berry bush or digging right where the player arrives)" % (mid, n))

# ------------------------------------------------------------------ Map003: the gap in the east wall and the exit to "Skraj lasu"
m3_raw, m3 = read("Map003.json")
TEMPLATE = next(e for e in m3["events"] if e and not e["pages"][0]["image"]["characterName"] and not e["pages"][0]["image"]["tileId"]
                and any(c["code"] == 201 for c in e["pages"][0]["list"]))
W, H = m3["width"], m3["height"]
d = m3["data"]
at = lambda z, x, y: d[z * W * H + y * W + x]
GAP = [(38, y) for y in (12, 13, 14)] + [(39, y) for y in (12, 13, 14)]
PATH = [(37, 13), (37, 14)] + GAP
if all(kind_of(at(0, x, y)) == 16 for (x, y) in GAP):
    print("Map003: the gap in the east wall is already open")
else:
    wall_ok = all(at(0, 38, y) == 1632 for y in (12, 13, 14)) and all(kind_of(at(0, 39, y)) == 119 for y in (12, 13, 14))
    upper_ok = all(at(z, x, y) == 0 for (x, y) in GAP for z in (2, 3))
    busy = [e for e in m3["events"] if e and (e["x"], e["y"]) in set(GAP) | {(37, 13), (37, 14)}]
    if not wall_ok or not upper_ok or busy:
        fail("Map003's east wall at (38..39, 12..14) is not as expected (was it edited?): wall=%s upper-layers-empty=%s events=%s. "
             "Open the gap by hand (or pick other tiles in tools/newstart/layout.py and run the generator again)." %
             (wall_ok, upper_ok, [(e["id"], e["name"]) for e in busy]))
    for (x, y) in GAP:
        d[y * W + x] = 2048 + 16 * 48                      # grass (shape fixed below)
        d[4 * W * H + y * W + x] = 0                       # no wall shadow
    for (x, y) in PATH:
        d[W * H + y * W + x] = 2048 + 39 * 48              # the dirt path, carried on to the edge
    reshape(m3, 0, around(GAP))
    reshape(m3, 1, around(PATH))
    say("Map003: open the east wall at (38,12..14) and the hedge edge at (39,12..14): grass with the old path carried on "
        "from (36,13) to the edge; neighbouring autotiles reshaped")
add_transfers(3, m3)
landing_region(3, m3)
write("Map003.json", m3_raw, map_text(m3_raw, m3))

# ------------------------------------------------------------------ Map008: to the field road and to the Lord's estate
m8_raw, m8 = read("Map008.json")
add_transfers(8, m8)
landing_region(8, m8)
write("Map008.json", m8_raw, map_text(m8_raw, m8))

print()
if not changes:
    print("Nothing to do: everything is already in place.")
elif DRY:
    print("Dry run: %d changes listed above, no file was written." % len(changes))
elif OUT:
    print("%d changes written to %s (data/ untouched)." % (len(changes), OUT))
else:
    print("Done: %d changes. Backups in %s" % (len(changes), BACKUP))
    print("Open the project in RPG Maker again (the editor must re-read MapInfos, System and the maps before its next save).")
