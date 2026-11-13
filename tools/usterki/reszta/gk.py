# gk.py MAP x0 y0 x1 y1 [data|staging] : rodzaje gruntu (A2 kind), # = kafle na warstwach 1-3, r = region
import sys, os, json
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "..", "rozszerzenia")); sys.path.insert(0, os.path.join(HERE, "..", "..", "mapy"))
import wspolne as WS
mid, x0, y0, x1, y1 = map(int, sys.argv[1:6]); src = sys.argv[6] if len(sys.argv) > 6 else "staging"
p = os.path.join(HERE, "staging", "data", "Map%03d.json" % mid) if src == "staging" else os.path.join(HERE, "..", "..", "..", "data", "Map%03d.json" % mid)
m = json.load(open(p, encoding="utf-8")); at = WS.at
def kind(z, x, y):
    t = at(m, z, x, y); return (t - 2048) // 48 if t >= 2048 and t < 5000 else None
print("    " + "".join("%3d" % (x % 100) for x in range(x0, x1 + 1)))
for y in range(y0, y1 + 1):
    s = ""
    for x in range(x0, x1 + 1):
        k = kind(0, x, y); t0 = at(m, 0, x, y)
        s += "%3s" % (k if k is not None else ("A5" if t0 else "--"))
    f = "".join("#" if any(at(m, z, x, y) for z in (1, 2, 3)) else ("r" if at(m, 5, x, y) else "." ) for x in range(x0, x1 + 1))
    print("%3d %s  %s" % (y, s, f))
for e in m["events"]:
    if e and x0 <= e["x"] <= x1 and y0 <= e["y"] <= y1: print("ev", e["id"], e["x"], e["y"], e["name"], (e["pages"][0]["image"].get("characterName") if e["pages"] else ""))
