import sys, json, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "rozszerzenia"))
import wspolne as W
def dump(mid, x0, y0, x1, y1, src="data"):
    m = json.load(open(os.path.join(W.ROOT, src, "Map%03d.json" % mid), encoding="utf-8"))
    w, h = m["width"], m["height"]
    ev = {}
    for e in m["events"]:
        if e: ev.setdefault((e["x"], e["y"]), []).append(e["id"])
    for z in (0, 1, 2, 3, 5):
        print("layer", z if z < 4 else "region")
        print("     " + " ".join("%5d" % x for x in range(x0, x1 + 1)))
        for y in range(y0, y1 + 1):
            print("%4d " % y + " ".join("%5d" % m["data"][(z * h + y) * w + x] for x in range(x0, x1 + 1)))
    print("events:", {k: v for k, v in ev.items() if x0 <= k[0] <= x1 and y0 <= k[1] <= y1})
if __name__ == "__main__":
    a = sys.argv
    dump(int(a[1]), *map(int, a[2:6]), src=a[6] if len(a) > 6 else "data")
