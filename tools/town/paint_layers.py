# python tools/town/paint_layers.py [--map 8] [--reset] [--dry]
# The first paint of RegionLayers.js's regions on a town map (user 2026-10-04: "pomaluj mapę wstępnie"), to be refined by hand
# in the editor (tab R). Rules, region 2 (level with the hero, blocked):
#   a) every cell whose ground layer is a building's autotile: A3 (roofs, walls) or A4 (walls, wall tops, the town walls)
#   b) a band of at most 2 cells with star tiles between an A3 roof above and an A3/A4 wall below in the same column
#      (the arcade under the hall's roof: a gallery the hero walked into from the side)
#   c) the foot of a facade: a cell right under an a/b cell whose upper layers hold pictures that are not star tiles (windows,
#      doors, flower boxes drawn over the ground)
# Never painted: the cell in front of a door (an event called "Drzwi..." or with a door/gate picture), the cells the map's
# transfers land on and the transfer events' own cells. Regions 1 and 3 are left to the hand: nothing in the town needs them
# (the tall things the hero walks behind are events or star tiles already).
# Writes data/MapNNN.json in the editor's layout (nslib.write_map); --dry only prints. Refuses to paint over regions 1-3 that are
# already there (the user's own work) unless --reset (which clears 1-3 first). Regions 5-7 of other plugins are never touched.
import os, sys, json, re, argparse, collections
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..")).replace("\\", "/") + "/"
sys.path.insert(0, os.path.join(ROOT, "tools", "newstart"))
from nslib import write_map

BELOW, LEVEL, ABOVE = 1, 2, 3
A5, A1, A2, A3, A4 = 1536, 2048, 2816, 4352, 5888
DOOR_PIC = re.compile(r"door|gate", re.I)

def load(path):
    with open(path, "rb") as f:
        return json.loads(f.read().decode("utf-8"))

def structure(t): return t >= A3          # A3 or A4
def roof(t): return A3 <= t < A4 and ((t - A3) // 48) % 16 < 8

def plan(mp, flags):
    W, H, d = mp["width"], mp["height"], mp["data"]
    at = lambda x, y, z: d[(z * H + y) * W + x]
    star = lambda x, y: any(at(x, y, z) and flags[at(x, y, z)] & 0x10 for z in range(4))
    pictures = lambda x, y: [at(x, y, z) for z in (2, 3) if 0 < at(x, y, z) < A5 and not flags[at(x, y, z)] & 0x10]

    keep = set()
    for e in mp["events"]:
        if not e: continue
        pages = e["pages"]
        door = e["name"].startswith("Drzwi") or any(DOOR_PIC.search(p["image"]["characterName"] or "") for p in pages)
        if door: keep.add((e["x"], e["y"] + 1))
        if any(c["code"] == 201 for p in pages for c in p["list"]): keep.add((e["x"], e["y"]))
    for f in os.listdir(ROOT + "data"):
        if not re.match(r"Map\d+\.json$", f): continue
        other = load(ROOT + "data/" + f)
        if not isinstance(other, dict): continue
        for e in other["events"]:
            if not e: continue
            for p in e["pages"]:
                for c in p["list"]:
                    if c["code"] == 201 and c["parameters"][0] == 0 and c["parameters"][1] == mp["_id"]:
                        keep.add((c["parameters"][2], c["parameters"][3]))

    paint, why = {}, collections.Counter()
    for y in range(H):
        for x in range(W):
            if structure(at(x, y, 0)): paint[(x, y)] = "a"
    for x in range(W):
        for y in range(1, H):
            if not roof(at(x, y - 1, 0)) or structure(at(x, y, 0)): continue
            run = []
            yy = y
            while yy < H and not structure(at(x, yy, 0)) and len(run) <= 2:
                run.append(yy); yy += 1
            if 0 < len(run) <= 2 and yy < H and structure(at(x, yy, 0)) and all(star(x, r) for r in run):
                for r in run: paint[(x, r)] = "b"
    for (x, y), rule in list(paint.items()):
        if y + 1 < H and (x, y + 1) not in paint and pictures(x, y + 1): paint[(x, y + 1)] = "c"
    for c in keep: paint.pop(c, None)
    for r in paint.values(): why[r] += 1
    return paint, keep, why

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--map", type=int, default=8)
    ap.add_argument("--reset", action="store_true")
    ap.add_argument("--dry", action="store_true")
    a = ap.parse_args()
    path = ROOT + "data/Map%03d.json" % a.map
    mp = load(path)
    mp["_id"] = a.map
    W, H, d = mp["width"], mp["height"], mp["data"]
    flags = load(ROOT + "data/Tilesets.json")[mp["tilesetId"]]["flags"]
    base = 5 * W * H
    mine = [i for i in range(W * H) if d[base + i] in (BELOW, LEVEL, ABOVE)]
    if mine and not a.reset:
        sys.exit("Map%03d already has %d cells of regions 1-3 (hand work?) - run with --reset to paint over them" % (a.map, len(mine)))
    for i in mine: d[base + i] = 0
    paint, keep, why = plan(mp, flags)
    put = 0
    for (x, y) in paint:
        if d[base + y * W + x] == 0:   # (regions of other plugins, 5-7, stay)
            d[base + y * W + x] = LEVEL; put += 1
    print("Map%03d: region 2 on %d cells (a walls/roofs %d, b bands %d, c facade feet %d); %d cells kept free (doors, landings)"
          % (a.map, put, why["a"], why["b"], why["c"], len(keep)))
    if a.dry: return
    del mp["_id"]
    write_map(path, mp, d, mp["events"])

if __name__ == "__main__":
    main()
