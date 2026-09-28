# python check_probe.py <X> <probe.json>  - compares what the game says about passability (render.js probe) with the
# generator's own idea of the floor: cells the game lets the player enter that the generator thinks are walls/furniture,
# and floor cells the game blocks although nothing is meant to stand there.
import sys, json, os
from tavlib import STAGING
k, probe = sys.argv[1], sys.argv[2]
meta = json.load(open(os.path.join(STAGING, "%s_meta.json" % k), encoding="utf-8"))
reach = {tuple(c) for c in meta["reach"]}
p = json.load(open(probe, encoding="utf-8"))
rows = p["pass"]
H, W = len(rows), len(rows[0])
# the game's reachable set from the landing (4-way; '.' = passable tile and no blocking event)
start = tuple(meta["landing"])
ok = lambda x, y: 0 <= x < W and 0 <= y < H and rows[y][x] == "."
seen, todo = {start}, [start]
people = {(e["x"], e["y"]) for e in p["events"] if e["id"] in (1, 2, 3, 4)}
while todo:
    x, y = todo.pop()
    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        n = (x + dx, y + dy)
        if n not in seen and (ok(*n) or n in people):
            seen.add(n); todo.append(n)
extra = sorted(seen - reach - people)
missing = sorted(reach - seen - people)
print(k, "game reach", len(seen), "generator reach", len(reach))
print("  the game lets the player go where the generator does not:", extra[:40], "..." if len(extra) > 40 else "")
print("  the generator's floor the game blocks:", missing[:40], "..." if len(missing) > 40 else "")
