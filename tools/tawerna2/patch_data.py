# -*- coding: utf-8 -*-
"""Tawerna 2 (second method): the finishing touches and the transfers between the staged maps. Run after build025/026/001.
Map001: loose brick into the pantry, 'Miejsce: podrozny_N' spots in the hall; Map025: a Kufer in room 4, a Torba in room 8, the upstairs bath's
<Tavern:bath> tubs + Wanda; the stairs' transfers; Map008/Map009 patches (the way in from the town, the way back from the cellar)."""
import sys, os, json, copy
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import lib, check
W = lib.W

def staged(n): return json.load(open(os.path.join(lib.STAGING, "data", "Map%03d.json" % n), encoding="utf-8"))
def save(n, m): open(os.path.join(lib.STAGING, "data", "Map%03d.json" % n), "wb").write(W.map_text(m).encode("utf-8"))
def put_event(m, e, x, y, new_id=None):
    e = copy.deepcopy(e)
    ids = {k["id"] for k in m["events"] if k}
    e["id"] = new_id or (max(ids) + 1)
    while e["id"] in ids and not new_id: e["id"] += 1
    e["x"], e["y"] = x, y
    while len(m["events"]) <= e["id"]: m["events"].append(None)
    m["events"][e["id"]] = e
    return e
def free_cell(m, R, rect, prefer="bottom-left", avoid=()):
    x0, y0, x1, y1 = rect
    blk = check.blocked_cells(m)
    cells = [(x, y) for y in range(y1, y0 - 1, -1) for x in range(x0, x1 + 1)
             if (x, y) in R and (x, y) not in blk and (x, y) not in avoid and all(check.passable_tile(m, x, y, d) for d in (2, 4, 6, 8))]
    # not in front of a door / not in the middle: prefer a cell with a wall or object next to it, away from the door column
    def score(c):
        x, y = c
        wall = sum(1 for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)) if (x + dx, y + dy) not in R)
        return (-wall, -y, x)
    return sorted(cells, key=score)[0]

OUT = {}
# ================================================================== Map025 first (its arrival cells feed Map001)
m25 = staged(25); L25 = json.load(open(os.path.join(lib.STAGING, "layout025.json")))
import re
def tr(m, ids):
    for e in m["events"]:
        if e and e["id"] in ids:
            for p in e["pages"]:
                for c in p["list"]:
                    if c["code"] == 201 and c["parameters"][0] == 0: yield e, c["parameters"]
# stairs: every box has events on its top row (y47). Map001 W/E boxes go up to the matching bottoms; Map025: W box = up to the attic (gated), E box = down
def stair_events(m, ids, xs, name, to_map, to_x, dirn, tmpl):
    for i, x in zip(ids, xs):
        e = copy.deepcopy(tmpl); e["id"] = i; e["name"] = name; e["x"] = x; e["y"] = 47
        for p in e["pages"]:
            for c in p["list"]:
                if c["code"] == 201: c["parameters"][1:5] = [to_map, to_x(x), 53, dirn]
        while len(m["events"]) <= i: m["events"].append(None)
        m["events"][i] = e
m1_tmpl = copy.deepcopy(lib.old(1)["events"][13])
m25 = {k: v for k, v in m25.items()}
for i in range(288, 300):
    if len(m25["events"]) > i and m25["events"][i]: m25["events"][i] = None
stair_events(m25, (293, 294, 295), (1, 2, 3), "Schody -> Apartamenty", 26, lambda x: x, 8, m1_tmpl)
stair_events(m25, (288, 289, 290), (25, 26, 27), "Schody -> Tawerna (parter)", 1, lambda x: x, 2, m1_tmpl)
gate = copy.deepcopy(lib.old(25)["events"][298]); gate["id"] = 298; gate["x"], gate["y"] = 2, 49
while len(m25["events"]) <= 298: m25["events"].append(None)
m25["events"][298] = gate
arr25 = (2, 53)
sd = None
R25 = check.reach(m25, arr25, {(x, 49) for x in range(0, 5)} | {(e["x"], e["y"]) for e in m25["events"] if e and re.match(r"(Drzwi|Wejście)", e["name"])})
# a Kufer in room 4, a Torba in room 8 (copies of the old ones)
o25 = lib.old(25)["events"]
def seed_of(m, n):
    for e in m["events"]:
        if e and re.match(r"(Drzwi|Wejście) -> Pokój %d$" % n, e["name"]):
            for p in e["pages"]:
                for c in p["list"]:
                    if c["code"] == 201: return (c["parameters"][2], c["parameters"][3])
Rr4 = check.reach(m25, seed_of(m25, 4)); Rr8 = check.reach(m25, seed_of(m25, 8))
r4 = free_cell(m25, Rr4, L25["r4"]); put_event(m25, o25[135], *r4)
r8 = free_cell(m25, Rr8, L25["r8"], avoid={r4}); put_event(m25, o25[88], *r8)
OUT["kufer_r4"], OUT["torba_r8"] = r4, r8
# the upstairs bath: the tubs are the 'Balia' events; the <Tavern:bath> tags sit on them (like the old tubs), Wanda stands by
o1 = lib.old(1)["events"]
for e in [e for e in m25["events"] if e and e["name"] == "Balia"]:
    put_event(m25, o1[159], e["x"], e["y"])
Rb = check.reach(m25, seed_of(m25, 0) or (L25['bath'][0] + 2, L25['bath'][3]))
wc = free_cell(m25, Rb, [L25["bath"][0] + 3, L25["bath"][1] + 1, L25["bath"][2] - 3, L25["bath"][1] + 4], avoid=set())
put_event(m25, o1[172], *wc); OUT["wanda"] = wc
save(25, m25)
# ================================================================== Map026: both boxes lead down to the matching bottoms on Map025 (arrive facing down)
m26 = staged(26)
for i in range(159, 164):
    if len(m26["events"]) > i and m26["events"][i]: m26["events"][i] = None
stair_events(m26, (159, 160, 161), (1, 2, 3), "Schody -> Pokoje gości", 25, lambda x: x, 2, m1_tmpl)
stair_events(m26, (162, 163, 164), (25, 26, 27), "Schody -> Pokoje gości", 25, lambda x: x, 2, m1_tmpl)
save(26, m26)
# ================================================================== Map001
m1 = staged(1)
start = (14, 53)
R1 = check.reach(m1, start)
# the loose brick into the pantry (x29..35, y4..): the top-most reachable cell of the middle column, event 9 as it is
cand = [(x, y) for y in range(4, 12) for x in (32, 31, 33, 30, 34) if (x, y) in R1]
assert cand, "pantry not reachable from the entrance"
bx, by = cand[0]
ev9 = m1["events"][9] if len(m1["events"]) > 9 and m1["events"][9] else copy.deepcopy(lib.old(1)["events"][9])
ev9 = copy.deepcopy(lib.old(1)["events"][9]); ev9["x"], ev9["y"] = bx, by
m1["events"][9] = ev9
OUT["brick"] = (bx, by)
# 'Miejsce: podrozny_1..6, kompania_1..4, grajek, medyk': free hall cells, spaced, away from the walls
hall = (2, 27, 25, 43)
names = ["podrozny_%d" % i for i in range(1, 7)] + ["kompania_%d" % i for i in range(1, 5)] + ["grajek", "medyk"]
blk = check.blocked_cells(m1); taken = set()
cells = [(x, y) for y in range(hall[1], hall[3] + 1) for x in range(hall[0], hall[2] + 1)
         if (x, y) in R1 and (x, y) not in blk and sum(1 for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)) if (x + dx, y + dy) in R1 and (x + dx, y + dy) not in blk) == 4]
import random
rnd = random.Random(5); rnd.shuffle(cells)
tmpl = lib.old(1)["events"][53]
chosen = []
for c in cells:
    if all(abs(c[0] - o[0]) + abs(c[1] - o[1]) >= 4 for o in chosen): chosen.append(c)
    if len(chosen) == len(names): break
for n, c in zip(names, chosen):
    e = copy.deepcopy(tmpl); e["name"] = "Miejsce: " + n
    put_event(m1, e, *c)
OUT["podrozny_spots"] = dict(zip(names, chosen))
# stairs: events 13-15 west box, 16-18 east box -> the guest floor (below: the corridor in front of the stairs)
for e, pr in tr(m1, range(13, 19)): pr[1:5] = [25, e['x'], 53, 8]
save(1, m1)
# ================================================================== Map008 (the town's door) and Map009 (the cellar's way back)
SHA = {}
import hashlib
for n, target in ((8, (14, 53, 8)), (9, (bx, by + 1, 2))):
    path = os.path.join(lib.ROOT, "data", "Map%03d.json" % n)            # the CURRENT game file (Kruczogrod was installed 2026-11-08 20:28)
    raw = open(path, "rb").read()
    m = json.loads(raw.decode("utf-8"))
    assert W.map_text(m).encode("utf-8") == raw, "Map%03d is not in the editor's layout" % n
    SHA["data/Map%03d.json" % n] = hashlib.sha1(raw).hexdigest()
    k = 0
    for e in m["events"]:
        if not e: continue
        for p in e["pages"]:
            for c in p["list"]:
                if c["code"] == 201 and c["parameters"][0] == 0 and c["parameters"][1] == 1:
                    c["parameters"][2:5] = list(target) if n == 8 else [target[0], target[1], c["parameters"][4]]; k += 1
    assert k
    save(n, m)
json.dump(SHA, open(os.path.join(lib.STAGING, "SHA_data.json"), "w"), indent=1)
json.dump(OUT, open(os.path.join(lib.STAGING, "polozenia.json"), "w"), indent=1)
print(json.dumps(OUT, ensure_ascii=False))
