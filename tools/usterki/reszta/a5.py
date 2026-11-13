# a5.py MAP x0 y0 x1 y1 [z] : A5-kafle (1536-1663) jako ich numer, reszta '.'
import sys, os, json
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "..", "rozszerzenia")); import wspolne as WS
mid, x0, y0, x1, y1 = map(int, sys.argv[1:6]); z = int(sys.argv[6]) if len(sys.argv) > 6 else 0
m = json.load(open(os.path.join(HERE, "staging", "data", "Map%03d.json" % mid), encoding="utf-8"))
print("    " + " ".join("%4d" % x for x in range(x0, x1 + 1)))
for y in range(y0, y1 + 1):
    print("%3d " % y + " ".join(("%4d" % WS.at(m, z, x, y)) if 1536 <= WS.at(m, z, x, y) < 1664 else "   ." for x in range(x0, x1 + 1)))
