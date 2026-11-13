# -*- coding: utf-8 -*-
"""Usterki / miasto (przegląd ekran po ekranie 2026-11-11): poprawki Kruczogrodu (Map008) i wnętrz miejskich.
Czyta BIEŻĄCE data/MapNNN.json (nie build5.py: ten odtwarza mapę z archiwum i zgubiłby późniejsze zmiany zdarzeń - znaczniki questów,
nowe zdarzenia 490-498, notatki drzew), zapisuje do tools/usterki/miasto/staging/data/. Nic nie instaluje.
  python tools/usterki/miasto/popraw.py"""
import os, sys, json, copy
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "rozszerzenia"))
import wspolne as WS
OUT = os.path.join(HERE, "staging", "data"); os.makedirs(OUT, exist_ok=True)
def load(mid): return json.load(open(os.path.join(ROOT, "data", "Map%03d.json" % mid), encoding="utf-8"))
def save(m, mid): open(os.path.join(OUT, "Map%03d.json" % mid), "wb").write(WS.map_text(m).encode("utf-8"))

# ================================================================== Map008 Kruczogród
m = load(8); W, H = m["width"], m["height"]; D = m["data"]; ev = m["events"]
touched = set()
def g(z, x, y): return D[z * W * H + y * W + x]
def s(z, x, y, v): D[z * W * H + y * W + x] = v; touched.add((x, y))
def kind(v): return (v - 2048) // 48 if v >= 2048 else None
FENCE = 22
log = []

# ---- 1. hard black rectangles: the editor's shadow pen (layer 4) - 85 quarter-cell blocks left over from the old Winlu map. The sun shadows
# of every building / prop / tree are Cienie.js's and Sky.js's job; the pen's blocks lie beside them as flat dark strips (rows 07 40 51 90 94
# 106 ... of the review). All of layer 4 goes.
n4 = 0
for y in range(H):
    for x in range(W):
        if g(4, x, y): s(4, x, y, 0); n4 += 1
log.append("layer 4 shadow pen cleared: %d cells" % n4)

# ---- 2. fences drawn through roofs (rows 96, 102): the old stable's rear paddock rail (posts 208/209, rails 232/233 on layers 2-3) crossed the
# gable's ridge in the old stable AND in its copy (the barn). A rail behind a roof is hidden by it only where the roof is opaque: the ridge
# row is not. The rails go (the paddock they closed is long gone: the old street runs there).
for (x0, x1) in ((55, 64), (105, 112)):
    for x in range(x0, x1 + 1):
        for z in (2, 3):
            if g(z, x, 79) in (208, 209, 232, 233): s(z, x, 79, 0)
for (x, y) in ((61, 79), (110, 79)):                      # (a rail's leaf left on layer 2 under the ridge)
    if g(2, x, y) == 738: s(2, x, y, 0)
# the gable roofs' right slope had a hole one cell big (E951 over E940: the slope's step tiles stacked wrong), through which the solid A63 base
# cell showed as an orange brick chunk (barn x2 and the carpenter's house): the plain slope tile E948 closes it
for y in range(H):
    for x in range(W):
        if g(2, x, y) == 951 and g(3, x, y) == 940: s(2, x, y, 0); s(3, x, y, 948)
log.append("rails through the barn roofs removed; slope holes closed")

# ---- 3. the farrier's golden thatch (row 43): the A3 autotile's top-edge shape carries a ridge beam with posts that reads as a fence on the
# wheat. The roof's top row gets the shapes of the row under it (the thatch runs up to the edge, no beam).
for x in range(85, 97):
    if kind(g(0, x, 26)) == 67 and kind(g(0, x, 27)) == 67:
        s(0, x, 26, 2048 + 67 * 48 + (g(0, x, 27) - 2048) % 48)
log.append("farrier roof ridge flattened")

# ---- 4. trees whose crowns lie on a roof / wall (rows 18 22 35 38 41)
for i in (203, 201): ev[i]["note"] = ev[i]["note"].replace("scale=0.85", "scale=0.7")       # the cloister's west pair: crown fits the 2-cell lawn strip
for i in (417, 202): ev[i]["note"] = ev[i]["note"].replace("scale=0.85", "scale=0.7"); ev[i]["x"] = 14   # the east pair: one cell off the roof arm
ev[123] = None                                                                             # the lone green crown on the rampart wall behind the little house (no <Tree>: decor)

# ---- 5. fences: a gate gap is a gap with posts. Every gap of 1-4 cells in a horizontal / vertical run gets its end posts (layer 3 over the
# fence cell: 209 right end / 208 left end for a horizontal run; vertical: 216 top end / 217 bottom end), the free ends of the tavern terrace
# rail too. Lone pieces that enclose nothing go (row 97: 5 cells at 70-74,79).
def isF(x, y): return 0 <= x < W and 0 <= y < H and g(1, x, y) >= 2048 and kind(g(1, x, y)) == FENCE
for x in range(70, 75):
    s(1, x, 79, 0)
posts = []
for y in range(H):
    for x in range(W):
        if not isF(x, y): continue
        if isF(x - 1, y) and not isF(x + 1, y) and not isF(x, y - 1) and not isF(x, y + 1):    # right end of a horizontal run (not a corner)
            for d in range(2, 6):
                if isF(x + d, y) and isF(x + d + 1, y) and not isF(x + d, y - 1) and not isF(x + d, y + 1) and not any(isF(x + k, y) for k in range(1, d)):
                    posts.append((x, y, 209)); posts.append((x + d, y, 208)); break
# the first garden's west side has a lone 1-cell gap (15,6) that nobody walks through (the plot is dressing): closed with a fence piece (the vertical gate posts
# 216/217 stand at the left edge of their cell, the autotile's rail on the right half: they read as stubs)
s(1, 15, 6, 2048 + FENCE * 48)
for (x, y, v) in ((68, 16, 209), (72, 16, 208)): posts.append((x, y, v))     # the terrace rail's two inner ends (the outer ones touch walls)
seen = set()
for (x, y, v) in posts:
    if (x, y) in seen: continue
    seen.add((x, y))
    if g(3, x, y) == 0: s(3, x, y, v)
log.append("fence posts: %d" % len(seen))

# ---- 6. ground
# 6a. row 70: the grass strip between the street and the market is a 3 x 10 rectangle of the A21 grass overlay: an irregular lozenge instead
ROWS = {53: (27, 28), 54: (27, 29), 55: (27, 29), 56: (27, 29), 57: (26, 29), 58: (26, 29), 59: (27, 29), 60: (27, 30), 61: (27, 30), 62: (28, 29)}
for y in range(53, 63):
    for x in range(26, 31):
        if kind(g(1, x, y)) == 21 or g(1, x, y) == 0:
            on = ROWS[y][0] <= x <= ROWS[y][1]
            if on and kind(g(0, x, y)) in (40, 43): s(1, x, y, 2048 + 21 * 48)
            elif kind(g(1, x, y)) == 21: s(1, x, y, 0)
# 6b. row 85: the cobbled yard under the barrels (56-65 x 64-67) is a plain rectangle cut into the lawn: bite off its lower corners
for (x, y) in ((56, 67), (57, 67), (64, 67), (65, 67), (56, 66), (65, 66)): s(0, x, y, 2048 + 16 * 48)
# 6c. rows 77, 78: the big kitchen garden (x3-24): its first bed row lay right under the top rail (no path) and its two inner dividers were two
# cells wide (ladder-like). The cabbage rows move down one cell (67/69 -> 68/70, the third row goes), the dividers lose their second cell.
for x in range(2, 20):
    for (a, b) in ((67, 68), (69, 70)):
        if g(2, x, a) and not g(2, x, b): s(2, x, b, g(2, x, a)); s(2, x, a, 0)
    if g(2, x, 71) and x <= 17: s(2, x, 71, 0)
for y in range(67, 73):
    for x in (11, 19):
        if isF(x, y) and isF(x - 1, y): s(1, x, y, 0)

# ---- 7. invisible walls: region 2 on bare street / grass with nothing drawn there (the old gate tower's foot, a kerb corner, the corner pocket)
for (x, y) in ((101, 49), (101, 53), (75, 66)):
    if g(5, x, y) == 2: s(5, x, y, 0)
log.append("3 invisible blocks opened")

# ---- autotile shapes round everything touched
ring = WS.ring(touched, 1)
for z in (0, 1): WS.reshape(m, z, ring)
while ev and ev[-1] is None: ev.pop()
assert all(e is None or e["id"] == i for i, e in enumerate(ev))
save(m, 8)
print("Map008:", "; ".join(log))

# ================================================================== interiors: plain rugs (no pattern, no border = a hole in the floor)
def rug(mid, old_kind, new_kind, why):
    mm = load(mid); Wm, Hm = mm["width"], mm["height"]; Dm = mm["data"]; cells = []
    for y in range(Hm):
        for x in range(Wm):
            v = Dm[Wm * Hm + y * Wm + x]                       # layer 1
            if v >= 2048 and (v - 2048) // 48 == old_kind: Dm[Wm * Hm + y * Wm + x] = 2048 + new_kind * 48; cells.append((x, y))
    WS.reshape(mm, 1, WS.ring(set(cells), 1))
    save(mm, mid); print("Map%03d: %s (%d cells)" % (mid, why, len(cells)))
rug(102, 37, 38, "bakery: plain tan rug -> ornate red rug")
rug(183, 22, 20, "bedroom: plain dark purple rug -> ornate blue-brown rug")
