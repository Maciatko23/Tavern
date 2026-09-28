# Find map spots (screen-sized windows) with many mud (k39/k24) and forest-floor (k46) cells.
import json, sys
import numpy as np
ROOT = r"C:\Users\macie\OneDrive\Dokumenty\RMMZ\Tawerna\data"
maps = [int(a) for a in sys.argv[1:]] or [3, 4, 21]
for m in maps:
    d = json.load(open(ROOT + r"\Map%03d.json" % m, encoding="utf8"))
    w, h = d["width"], d["height"]
    data = np.array(d["data"]).reshape(-1, h, w)
    kinds = np.full((4, h, w), -1)
    for z in range(4):
        t = data[z]
        a = (t >= 2048) & (t < 8192)
        kinds[z][a] = (t[a] - 2048) // 48
    print("Map%03d" % m, d.get("displayName"), w, "x", h, "tileset", d["tilesetId"])
    for k in (16, 17, 24, 27, 39, 46, 21):
        print("   k%d:" % k, int((kinds == k).sum()), end="")
    print()
    # window 27x15 (1280x720 at 48)
    ww, wh = 27, 15
    best = {}
    for key, ks in (("mud", (39, 24)), ("forest", (46,)), ("both", (39, 24, 46))):
        m2 = np.isin(kinds, ks).any(0).astype(int)
        ii = m2.cumsum(0).cumsum(1)
        ii = np.pad(ii, ((1, 0), (1, 0)))
        bestv, bestp = -1, None
        for y in range(0, max(1, h - wh + 1)):
            for x in range(0, max(1, w - ww + 1)):
                v = ii[y + wh, x + ww] - ii[y, x + ww] - ii[y + wh, x] + ii[y, x]
                if v > bestv:
                    bestv, bestp = v, (x, y)
        x, y = bestp
        print("   best %-6s window at (%d,%d) centre (%d,%d): %d cells" % (key, x, y, x + 13, y + 7, bestv))
