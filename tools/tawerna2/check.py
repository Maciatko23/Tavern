# -*- coding: utf-8 -*-
"""Offline reachability of the staged maps (the flags of tileset 8, blocking events, <Occupy:...>), 4-way like the game's pathfinding.
   python tools/tawerna2/check.py [1|25|26|all]"""
import sys, os, json, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import lib
FLAGS = json.load(open(os.path.join(lib.ROOT, "data", "Tilesets.json"), encoding="utf-8"))[8]["flags"]

def load(n):
    return json.load(open(os.path.join(lib.STAGING, "data", "Map%03d.json" % n), encoding="utf-8"))

def passable_tile(m, x, y, d):
    """d: 2 down, 4 left, 6 right, 8 up; the game's checkPassage over layers 3..0"""
    W, H = m["width"], m["height"]
    bit = {2: 1, 4: 2, 6: 4, 8: 8}[d]
    for z in (3, 2, 1, 0):
        t = m["data"][(z * H + y) * W + x]
        f = FLAGS[t] if t < len(FLAGS) else 0
        if f & 0x10: continue
        if (f & bit) == 0: return True
        if (f & 0x0f) == 0x0f or (f & bit) == bit: return False
    return False

def blocked_cells(m):
    out = set()
    for e in m["events"]:
        if not e: continue
        p = e["pages"][0]
        im = p["image"]
        occ = re.search(r"<Occupy:([^>]*)>", e.get("note") or "")
        solid = (not p["through"]) and p["priorityType"] == 1 and (im["characterName"] or im["tileId"] or occ)
        if p["priorityType"] == 1 and not p["through"] and occ: solid = True
        if not solid: continue
        out.add((e["x"], e["y"]))
        if occ:
            kv = dict((k, int(v)) for k, v in re.findall(r"(\w+)=(\d+)", occ.group(1)))
            for dx in range(-kv.get("left", 0), kv.get("right", 0) + 1):
                for dy in range(-kv.get("up", 0), kv.get("down", 0) + 1): out.add((e["x"] + dx, e["y"] + dy))
    return out

def reach(m, start, passable_events=()):
    W, H = m["width"], m["height"]
    blk = blocked_cells(m) - set(passable_events)
    seen = {start}; q = [start]
    while q:
        x, y = q.pop()
        for dx, dy, d in ((0, 1, 2), (-1, 0, 4), (1, 0, 6), (0, -1, 8)):
            nx, ny = x + dx, y + dy
            if not (0 <= nx < W and 0 <= ny < H) or (nx, ny) in seen: continue
            if (nx, ny) in blk: continue
            if not passable_tile(m, x, y, d) or not passable_tile(m, nx, ny, 10 - d): continue
            seen.add((nx, ny)); q.append((nx, ny))
    return seen

def ev_by_tag(m, pat):
    out = []
    for e in m["events"]:
        if not e: continue
        s = (e.get("note") or "") + " " + json.dumps([c["parameters"] for p in e["pages"] for c in p["list"] if c["code"] in (108, 408)], ensure_ascii=False)
        if re.search(pat, s): out.append(e)
    return out

def near(R, x, y): return (x, y) in R or any((x + dx, y + dy) in R for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)))

def check1():
    m = load(1); start = (14, 53)
    R = reach(m, start)
    bad = []
    seats = [e for e in m["events"] if e and 400 <= e["id"] < 440 and e["name"].startswith("Gość")]
    nr = 0
    for e in seats:
        if any((e["x"] + dx, e["y"] + dy) in R for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (-1, 1), (1, -1), (-1, -1))): nr += 1
        else: bad.append("seat %d at %s has no reachable neighbour" % (e["id"], (e["x"], e["y"])))
    print("seats %d, with an aisle %d" % (len(seats), nr))
    for e in m["events"]:
        if not e: continue
        n = e["name"]
        if n.startswith(("Wyjście", "Schody", "Luźna cegła", "Stare drzwi")) or re.match(r"Tavern:(meal|dice|arm|darts|stage|mealtable)", n) or n.startswith(("Tablica zleceń", "Plan karczmy", "Lada", "Miejsce:")):
            if not near(R, e["x"], e["y"]): bad.append("%s %s unreachable" % (n, (e["x"], e["y"])))
    for i in (1, 2, 3, 4):
        e = m["events"][i] if len(m["events"]) > i else None
        if not e or not near(R, e["x"], e["y"]): bad.append("npc %d missing or unreachable" % i)
    print("Map001: reachable cells %d" % len(R))
    return bad

def check_generic(n, start, label):
    m = load(n)
    gate = set()
    for e in m["events"]:
        if e and e["name"].startswith("Złota krata"): gate |= {(e["x"] + dx, e["y"]) for dx in range(-2, 3)}
    R = reach(m, start, gate)
    bad = []
    for e in m["events"]:
        if not e: continue
        nm = e["name"]
        if re.match(r"(Drzwi|Wejście) -> |Schody|Złota krata", nm):
            x, y = e["x"], e["y"]
            if (x, y) not in R and not any((x + dx, y + dy) in R for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))): bad.append("%s at %s unreachable" % (nm, (x, y)))
    print("Map%03d: reachable cells %d (%s)" % (n, len(R), label))
    return bad, R

if __name__ == "__main__":
    what = sys.argv[1] if len(sys.argv) > 1 else "all"
    allbad = []
    if what in ("1", "all"): allbad += check1()
    if what in ("25", "all"):
        b, R = check_generic(25, (2, 53), "from the stairs"); allbad += b
    if what in ("26", "all"):
        b, R = check_generic(26, (2, 53), "from the stairs"); allbad += b
    for b in allbad: print("PROBLEM:", b)
    print("OK" if not allbad else "%d problems" % len(allbad))
