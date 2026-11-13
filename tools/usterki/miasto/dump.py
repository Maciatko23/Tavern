# python dump.py MAP x0 y0 x1 y1 [stg]  -> layers z0..z5 per cell, events listed
import sys, json, os
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
mid = int(sys.argv[1]); x0, y0, x1, y1 = map(int, sys.argv[2:6])
p = os.path.join(ROOT, "tools/usterki/miasto/staging/data/Map%03d.json" % mid) if len(sys.argv) > 6 else os.path.join(ROOT, "data/Map%03d.json" % mid)
m = json.load(open(p, encoding="utf-8")); W, H = m["width"], m["height"]; D = m["data"]
def k(v): return "A%d" % ((v-2048)//48) if v >= 2048 else str(v)
for z in (0, 1, 2, 3, 4, 5):
    print("-- layer", z)
    print("     " + " ".join("%5d" % x for x in range(x0, x1 + 1)))
    for y in range(y0, y1 + 1):
        print("%4d " % y + " ".join("%5s" % (k(D[z*W*H+y*W+x]) if D[z*W*H+y*W+x] else ".") for x in range(x0, x1 + 1)))
for e in m["events"]:
    if e and x0 <= e["x"] <= x1 and y0 <= e["y"] <= y1:
        im = e["pages"][0]["image"]; print("ev", e["id"], e["name"], (e["x"], e["y"]), im["characterName"], im["tileId"], e["note"][:40])
