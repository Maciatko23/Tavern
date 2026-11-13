# podglad pol mapy z zrzutu przejezdnosci (docs/questy_mapa/tmp/mapdump_<id>.json): pokaz.py <mapa> <x0> <y0> <x1> <y1>
import json, sys, os
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "docs", "questy_mapa", "tmp")
m, x0, y0, x1, y1 = [int(a) for a in sys.argv[1:6]]
d = json.load(open(os.path.join(R, "mapdump_%d.json" % m), encoding="utf-8"))
evs = {}
for e in d["ev"]: evs.setdefault((e[2], e[3]), []).append(e)
print("    " + "".join(str(x % 10) for x in range(x0, x1 + 1)))
for y in range(y0, min(y1, d["h"] - 1) + 1):
    s = ""
    for x in range(x0, min(x1, d["w"] - 1) + 1):
        c = d["rows"][y][x]
        if (x, y) in evs and c == ".": c = "m" if all(str(e[1]).startswith(("Miejsce", "Znacznik")) for e in evs[(x, y)]) else "e"
        s += c
    print("%3d %s" % (y, s))
