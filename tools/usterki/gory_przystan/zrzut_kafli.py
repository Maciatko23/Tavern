# -*- coding: utf-8 -*-
import sys, json, os
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
mid = int(sys.argv[1]); x0, y0, x1, y1 = (int(v) for v in sys.argv[2].split(","))
p = os.path.join(HERE, "staging", "data", "Map%03d.json" % mid) if "--staging" in sys.argv else os.path.join(ROOT, "data", "Map%03d.json" % mid)
m = json.load(open(p, encoding="utf-8")); W, H = m["width"], m["height"]; n = W * H; d = m["data"]
ev = {}
for e in m["events"]:
    if e: ev.setdefault((e["x"], e["y"]), []).append(e["id"])
print("     " + " ".join("%4d" % x for x in range(x0, x1 + 1)))
for y in range(y0, y1 + 1):
    row = []
    for x in range(x0, x1 + 1):
        t = d[y * W + x]
        s = ("A%03d" % (t - 1536)) if 1536 <= t < 1664 else ("k%02d" % ((t - 2048) // 48) if t >= 2048 and t < 4352 else "  . ")
        if len(s) == 3: s = s + " "
        up = [d[z * n + y * W + x] for z in (1, 2, 3)]
        r = d[5 * n + y * W + x]
        flag = ("^" if any(up) else " ") + ("e" if (x, y) in ev else " ")
        row.append(s[:4])
    print("%4d " % y + " ".join(row))
print("layer1-3 nonzero:", [(x, y, [d[z * n + y * W + x] for z in (1, 2, 3)]) for y in range(y0, y1 + 1) for x in range(x0, x1 + 1) if any(d[z * n + y * W + x] for z in (1, 2, 3))][:60])
print("events:", [(e["id"], e["name"], e["x"], e["y"]) for e in m["events"] if e and x0 <= e["x"] <= x1 and y0 <= e["y"] <= y1])
print("regions:", sorted({(x, y, d[5 * n + y * W + x]) for y in range(y0, y1 + 1) for x in range(x0, x1 + 1) if d[5 * n + y * W + x]})[:50])
