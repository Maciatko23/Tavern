"""Where on the outdoor maps are the kinds we replace (k39 dirt overlay, k46 dark-grass overlay, k24 plain dirt)?
Prints, per map, counts and the best 27x15 screen windows (most cells of those kinds + some grass)."""
import json, os, sys
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))
def kind(t): return (t - 2048) // 48 if 2048 <= t < 8192 else None
for mid in (3, 4, 17, 18, 20, 21, 19, 22, 23, 24):
    p = os.path.join(ROOT, "data", "Map%03d.json" % mid)
    if not os.path.exists(p): continue
    m = json.load(open(p, encoding="utf8"))
    if m["tilesetId"] != 9: continue
    W, H, d = m["width"], m["height"], m["data"]
    info = json.load(open(os.path.join(ROOT, "data", "MapInfos.json"), encoding="utf8"))[mid]["name"]
    K = {}
    grid = [[set() for _ in range(W)] for _ in range(H)]
    for z in range(4):
        for y in range(H):
            for x in range(W):
                k = kind(d[(z * H + y) * W + x])
                if k is not None:
                    K[k] = K.get(k, 0) + 1; grid[y][x].add(k)
    print("Map%03d %s %dx%d  k39=%d k46=%d k24=%d k16=%d" % (mid, info, W, H, K.get(39, 0), K.get(46, 0), K.get(24, 0), K.get(16, 0)))
    best = []
    for dy in range(0, max(1, H - 15 + 1)):
        for dx in range(0, max(1, W - 27 + 1)):
            c = {39: 0, 46: 0, 24: 0}
            for y in range(dy, min(H, dy + 15)):
                for x in range(dx, min(W, dx + 27)):
                    for k in c:
                        if k in grid[y][x]: c[k] += 1
            score = min(c[39], 60) + min(c[46], 80) + 3 * min(c[24], 20)
            best.append((score, dx, dy, dict(c)))
    best.sort(reverse=True)
    shown = []
    for b in best:
        if all(abs(b[1] - s[1]) > 10 or abs(b[2] - s[2]) > 7 for s in shown):
            shown.append(b)
        if len(shown) == 3: break
    for s in shown: print("   window dx=%d dy=%d score=%d %s" % (s[1], s[2], s[0], s[3]))
