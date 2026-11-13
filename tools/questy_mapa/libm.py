# pomocnik: wolne pola z zrzutu przejezdnosci docs/questy_mapa/tmp/mapdump_<id>.json (bez zdarzen-znacznikow)
import json, os, math
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "docs", "questy_mapa", "tmp")
_c = {}
def dump(m):
    if m not in _c:
        d = json.load(open(os.path.join(R, "mapdump_%d.json" % m), encoding="utf-8"))
        occ = set()
        for e in d["ev"]:
            if not str(e[1]).startswith(("Miejsce", "Znacznik")): occ.add((e[2], e[3]))
        d["occ"] = occ; _c[m] = d
    return _c[m]
def free(m, x, y, w=1, h=1, margin=0):
    d = dump(m)
    for yy in range(y - margin, y + h + margin):
        for xx in range(x - margin, x + w + margin):
            if not (0 <= xx < d["w"] and 0 <= yy < d["h"]): return False
            if d["rows"][yy][xx] != "." or (xx, yy) in d["occ"]: return False
    return True
def find(m, tx, ty, w=1, h=1, margin=1, maxr=60):
    d = dump(m); best = None
    for y in range(1, d["h"] - h - 1):
        for x in range(1, d["w"] - w - 1):
            dist = math.hypot(x + w / 2 - tx, y + h / 2 - ty)
            if dist > maxr or (best and dist >= best[0]): continue
            if free(m, x, y, w, h, margin): best = (dist, x, y)
    return best
