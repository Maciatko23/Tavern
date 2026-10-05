# python describe.py <map json> x0 y0 x1 y1  - every layer of a map region as readable tile names
#   A2..A4 autotiles: "k<kind>" ; A5: "A5(c,r)" ; B-E: "B(c,r)" etc. (columns 8-15 are the right half of the sheet)
import sys, json
def name(t):
    if t == 0: return "."
    if t >= 2048: return "k%d" % ((t - 2048) // 48)
    if t >= 1536: r, c = divmod(t - 1536, 8); return "A5(%d,%d)" % (c, r)
    sheet = "BCDE"[t // 256]; i = t % 256
    half, j = divmod(i, 128); r, c = divmod(j, 8)
    return "%s(%d,%d)" % (sheet, c + 8 * half, r)
def describe(mp, x0, y0, x1, y1, out=sys.stdout):
    W, H = mp["width"], mp["height"]; d = mp["data"]
    for z in range(6):
        rows = []
        for y in range(y0, y1 + 1):
            cells = []
            for x in range(x0, x1 + 1):
                t = d[(z * H + y) * W + x]
                cells.append((name(t) if z < 4 else (str(t) if t else ".")).ljust(9))
            rows.append("%3d " % y + "".join(cells))
        if any(r.strip(" .0123456789") for r in rows):
            out.write("-- layer %d\n" % z + "    " + "".join(str(x).ljust(9) for x in range(x0, x1 + 1)) + "\n" + "\n".join(rows) + "\n")
    for e in mp["events"]:
        if e and x0 <= e["x"] <= x1 and y0 <= e["y"] <= y1:
            pg = e["pages"][0]; im = pg["image"]
            out.write("ev %d (%d,%d) %r %s i%d d%d p%d tile=%s prio%d trig%d thr%s %r\n" % (e["id"], e["x"], e["y"], e["name"], im["characterName"], im["characterIndex"], im["direction"], im["pattern"], name(im["tileId"]) if im["tileId"] else "-", pg["priorityType"], pg["trigger"], pg["through"], e["note"][:80]))
if __name__ == "__main__":
    mp = json.load(open(sys.argv[1], encoding="utf-8"))
    describe(mp, *map(int, sys.argv[2:6]))
