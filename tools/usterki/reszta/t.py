# t.py MAP x0 y0 x1 y1 [data|staging] : kafle warstw 0-3 (zero = '.'), oraz zdarzenia w oknie
import sys, os, json
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "..", "rozszerzenia")); import wspolne as WS
mid, x0, y0, x1, y1 = map(int, sys.argv[1:6]); src = sys.argv[6] if len(sys.argv) > 6 else "staging"
p = os.path.join(HERE, "staging", "data", "Map%03d.json" % mid) if src == "staging" and os.path.exists(os.path.join(HERE, "staging", "data", "Map%03d.json" % mid)) else os.path.join(HERE, "..", "..", "..", "data", "Map%03d.json" % mid)
m = json.load(open(p, encoding="utf-8"))
for z in (1, 2, 3, 5):
    print("layer", z); print("     " + " ".join("%4d" % x for x in range(x0, x1 + 1)))
    for y in range(y0, y1 + 1): print("%3d  " % y + " ".join(("%4d" % WS.at(m, z, x, y)) if WS.at(m, z, x, y) else "   ." for x in range(x0, x1 + 1)))
for e in m["events"]:
    if e and x0 <= e["x"] <= x1 and y0 <= e["y"] <= y1: print("ev", e["id"], e["x"], e["y"], e["name"], (e["pages"][0]["image"].get("characterName") if e["pages"] else ""))
