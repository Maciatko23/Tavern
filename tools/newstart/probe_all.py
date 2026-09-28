# Walk every new map in the game (probe.js): from each map's landing tiles, are all its exits reachable, are there closed
# pockets, does anything block a landing tile. python probe_all.py [ids...]   (CDP_PORT from the environment)
import subprocess, sys, json, os
from layout import transfers, MAPS
HERE = os.path.dirname(os.path.abspath(__file__))
ids = [int(a) for a in sys.argv[1:]] or sorted(MAPS)
T = transfers()
bad = 0
for mid in ids:
    exits = [[x, y] for fm, x, y, *_ in T if fm == mid]
    lands = [(tx, ty) for fm, x, y, tm, tx, ty, d, k in T if tm == mid]
    sx, sy = lands[0]
    exits += [[x, y] for x, y in lands]
    for attempt in range(3):
        out = subprocess.run(["node", os.path.join(HERE, "probe.js"), str(mid), str(sx), str(sy), json.dumps(exits)], capture_output=True, text=True, encoding="utf-8").stdout
        line = next((l for l in out.splitlines() if l.startswith("{")), None)
        if line: break
    if not line:
        print("Map%03d: probe failed\n%s" % (mid, out)); bad += 1; continue
    r = json.loads(line)
    closed = [e for e in r["exits"] if "CLOSED" in e or "SOLID" in e]
    print("Map%03d %s: reachable %d, events %d (trees %d, bushes %d, rocks %d), gather %s, farmland %d, water %d" %
          (mid, r["size"], r["reachable"], r["events"], r["trees"], r["bushes"], r["rocks"], r["gather"], r["farmland"], r["water"]))
    print("    exits:", ", ".join(r["exits"]))
    if closed or r["pockets"] or r["startSolid"] or r["water"]:
        bad += 1
        print("    PROBLEM closed=%s pockets=%s startSolid=%s" % (closed, r["pockets"], r["startSolid"]))
print("problems:", bad)
