"""Where are the A2 kinds the test replaces (k24 plain dirt, k39 dirt overlay, k46 dark-grass overlay) on the tileset-9 maps?
Prints, per map, the counts and the best 26x15 screen windows (the 1280x720 view at 48 px) for mud (k39+k24) and forest floor (k46)."""
import json, glob, os
import numpy as np

ROOT = "C:/Users/macie/OneDrive/Dokumenty/RMMZ/Tawerna"
infos = json.load(open(ROOT + "/data/MapInfos.json", encoding="utf8"))
names = {i["id"]: i["name"] for i in infos if i}
for f in sorted(glob.glob(ROOT + "/data/Map[0-9][0-9][0-9].json")):
    m = json.load(open(f, encoding="utf8"))
    if m.get("tilesetId") != 9:
        continue
    mid = int(os.path.basename(f)[3:6])
    W, H, d = m["width"], m["height"], m["data"]
    kind = np.full((4, H, W), -1)
    for z in range(4):
        for y in range(H):
            for x in range(W):
                t = d[(z * H + y) * W + x]
                if 2048 <= t < 8192:
                    kind[z, y, x] = (t - 2048) // 48
    has = lambda k: (kind == k).any(0).astype(int)
    mud = has(39) + has(24)
    ff = has(46)
    print("Map%03d %-20s %dx%d  k24 %d  k39 %d  k46 %d  k16 %d" % (mid, names.get(mid, "?"), W, H, has(24).sum(), has(39).sum(), ff.sum(), has(16).sum()))
    for label, g in (("mud", mud), ("forest", ff), ("both", mud * 2 + ff * 2)):
        best = None
        vw, vh = min(26, W), min(15, H)
        for y in range(0, H - vh + 1):
            for x in range(0, W - vw + 1):
                s = g[y:y + vh, x:x + vw].sum()
                if best is None or s > best[0]:
                    best = (s, x, y)
        if best and best[0] > 0:
            print("    best %-6s window: %3d cells at view origin (%d,%d) -> centre (%d,%d)" % (label, best[0], best[1], best[2], best[1] + 13, best[2] + 7))
