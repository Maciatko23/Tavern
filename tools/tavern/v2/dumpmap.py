# print a map rectangle layer by layer as short tile codes (for studying the author's sample maps)
#   python dumpmap.py <map.json> x0 y0 x1 y1
import sys, json
def code(t):
    if t == 0: return "."
    if t >= 2048:
        k, s = (t - 2048) // 48, (t - 2048) % 48
        p = "a" if k < 48 else "w" if k < 80 else "f"
        if k < 16: p = "W"
        return "%s%d:%d" % (p, k, s)
    if 1536 <= t < 2048:
        i = t - 1536; return "5(%d,%d)" % (i % 8, i // 8)
    sh = "BCDE"[t // 256]; i = t % 256
    col = (i % 8) + (8 if i >= 128 else 0); row = (i % 128) // 8
    return "%s%d,%d" % (sh, col, row)
def dump(path, x0, y0, x1, y1, layers=range(6)):
    m = json.load(open(path, encoding="utf-8"))
    W, H = m["width"], m["height"]; d = m["data"]
    for z in layers:
        print("== layer", z)
        for y in range(y0, y1 + 1):
            row = []
            for x in range(x0, x1 + 1):
                t = d[(z * H + y) * W + x]
                row.append(code(t) if z < 4 else (str(t) if t else "."))
            print("%3d " % y + " ".join("%-8s" % c for c in row))
    print("== events")
    for e in m["events"]:
        if e and x0 <= e["x"] <= x1 and y0 <= e["y"] <= y1:
            pg = e["pages"][0]; im = pg["image"]
            print(e["id"], e["name"], (e["x"], e["y"]), im["characterName"], im["characterIndex"], im["direction"], im["pattern"], "tile", code(im["tileId"]) if im["tileId"] else "", "prio", pg["priorityType"], "thr", pg["through"], repr(e["note"])[:60])
if __name__ == "__main__":
    a = sys.argv
    dump(a[1], *map(int, a[2:6]))
