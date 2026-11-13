# -*- coding: utf-8 -*-
"""Krok 4 planu poprawek map: Map162 'Garnizon nad zatoka'. TYLKO staging: tools/poprawki_krok4/garnizon/staging/data/Map162.json
(z biezacego data/Map162.json; uklad edytora: W.map_text, tryb binarny, LF). Obrazek slupow bramy: img/characters/!$Garnizon_Brama_Slup.png (NOWY plik).
  python tools/poprawki_krok4/garnizon/popraw_garnizon.py"""
import json, os, sys, copy
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "rozszerzenia"))
import wspolne as W
N = W.N
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
STG = os.path.join(HERE, "staging", "data")
GRASS, GRASS2, DIRT, ROAD, COBBLE = 16, 27, 24, 40, 47

path = os.path.join(ROOT, "data", "Map162.json")
raw = open(path, "rb").read()
m = json.loads(raw.decode("utf-8"))
if W.map_text(m).encode("utf-8") != raw: raise SystemExit("Map162 nie jest w ukladzie edytora")
Wd, Hd, d = m["width"], m["height"], m["data"]
n = Wd * Hd
ev = m["events"]
before = copy.deepcopy(m)
touched = set()                      # cells whose layer 0 kind changed (for the reshape)

def at(z, x, y): return d[z * n + y * Wd + x]
def put(z, x, y, v): d[z * n + y * Wd + x] = v
def kind(v): return (v - 2048) // 48 if v >= 2048 else None
def setkind(x, y, k, z=0): put(z, x, y, 2048 + k * 48); touched.add((x, y))
def rect(x0, y0, x1, y1): return [(x, y) for y in range(y0, y1 + 1) for x in range(x0, x1 + 1)]
def clear(box, zs=(1, 2, 3, 4)):
    for (x, y) in rect(*box):
        for z in zs: put(z, x, y, 0)

def comps(cells):
    cells = set(cells); seen = set(); out = []
    for c in sorted(cells):
        if c in seen: continue
        st = [c]; seen.add(c); comp = []
        while st:
            a = st.pop(); comp.append(a)
            for dx in (-1, 0, 1):
                for dy in (-1, 0, 1):
                    b = (a[0] + dx, a[1] + dy)
                    if b in cells and b not in seen: seen.add(b); st.append(b)
        out.append(comp)
    return out

log = []

# ====================================================================== 17 + 13: kind 17 islands (green-outline loops) -> dirt; lone cobble patches out
for comp in comps([(x, y) for y in range(Hd) for x in range(Wd) if kind(at(0, x, y)) == 17]):
    xs = [c[0] for c in comp]; ys = [c[1] for c in comp]; bb = (min(xs), min(ys), max(xs), max(ys))
    if bb in [(79, 69, 85, 79), (92, 68, 102, 73), (117, 82, 119, 86), (104, 52, 107, 54), (108, 46, 119, 51)]:
        for (x, y) in comp: setkind(x, y, DIRT)
        log.append("kind 17 -> 24: wyspa %s (%d kratek)" % (bb, len(comp)))
for box in [(104, 52, 108, 54), (104, 57, 109, 57), (110, 46, 112, 48)]:
    c = 0
    for (x, y) in rect(*box):
        if kind(at(1, x, y)) == COBBLE: put(1, x, y, 0); c += 1
    log.append("bruk (warstwa 1) zdjety %s: %d kratek" % (box, c))

# ====================================================================== 11: the cut-in rectangular bay (water kind 10 + a layer-1 frame) -> plain sea like the rest of the coast
for (x, y) in rect(20, 22, 33, 33):
    if kind(at(0, x, y)) == 10: setkind(x, y, 6)
    if at(1, x, y) and kind(at(1, x, y)) == 1: put(1, x, y, 0)

# ====================================================================== 16: the south path - one even width (106-108), soft end into the dirt field
for (x, y) in rect(103, 99, 110, 119):
    if kind(at(0, x, y)) == 17: setkind(x, y, GRASS)          # the old crooked path + blob: back to meadow
for (x, y) in rect(106, 99, 108, 119): setkind(x, y, DIRT)
setkind(106, 98, DIRT)                                          # the path meets the dirt field (107-108,98 are dirt already)
# the little clearing east of the path: its left tail
setkind(111, 108, GRASS2)

# ====================================================================== 1 + 2: the road through the yard and both gates
for (x, y) in rect(57, 33, 59, 35): setkind(x, y, ROAD)                 # north: through the gate
for (x, y) in rect(57, 54, 59, 57): setkind(x, y, ROAD)                 # south: to the palisade (the posts' row)
for (x, y) in rect(57, 58, 59, 63): setkind(x, y, 17)               # outside the gate: an earth path (kind 17, 3 wide) down into the dirt field (y64)
# the road is drawn over nothing: drop whatever lay on the upper layers of those cells
for (x, y) in rect(57, 54, 59, 63) + rect(57, 33, 59, 35):
    for z in (1, 2, 3): put(z, x, y, 0)

# the bench (59-60,53-54) stood across the extended road: one cell east, beside the kitchen
for (x, y) in rect(59, 53, 60, 54): put(2, x, y, 0)
for (x, y, v) in ((60, 53, 404), (61, 53, 405), (60, 54, 412), (61, 54, 413)): put(2, x, y, v)
# the supply crate (56,54-55) stood against the south gate post: into the group by the camp fire
put(2, 56, 54, 0); put(2, 56, 55, 0)

# ====================================================================== 3: loose ivy strip by the stone building
for (x, y) in ((61, 36), (61, 37)): put(3, x, y, 0)

# ====================================================================== 9: the sapling with a star beside the stone building (+ its cut sliver)
for (x, y) in ((61, 41), (62, 41)):
    if at(3, x, y) in (598, 599): put(3, x, y, 0)

# ====================================================================== 4: the broken cart / log fragments, the cut sacks
for (x, y) in ((63, 43), (64, 43), (63, 44), (64, 44)): put(2, x, y, 0)
for (x, y) in ((63, 46), (64, 46)): put(2, x, y, 0); put(3, x, y, 0)

# ====================================================================== 5 + 6: the red-roof house, rebuilt from tiles, straight-on
clear((65, 44, 70, 55), zs=(1, 2, 3, 4, 5))   # (re-add what stays below)
# what stays: the stump (65,47), the barrel pair (71-72,48-49), the grime marks
HX0, HX1, ROOF0, WALL0, WALL1 = 66, 70, 49, 52, 54       # footprint 66-70 (door at 68 in the middle), roof 49-51, wall 52-54
ROOFK, WALLK = 48, 78
for (x, y) in rect(65, 44, 70, 55): setkind(x, y, DIRT)
def block(x0, x1, y0, y1, k):
    cells = {(x, y) for (x, y) in rect(x0, y0, x1, y1)}
    for (x, y) in cells:
        same = lambda dx, dy, x=x, y=y: (x + dx, y + dy) in cells
        put(0, x, y, 2048 + k * 48 + N.wall_shape(same))
block(HX0, HX1, ROOF0, WALL0 - 1, ROOFK)
block(HX0, HX1, WALL0, WALL1, WALLK)
for (x, y) in rect(HX0, ROOF0, HX1, WALL1): put(5, x, y, 2)
# windows (two tiles: top over bottom) flanking the door at 68, flower boxes under them; the chimney on the roof slope (right half)
for x in (67, 69):
    put(3, x, 52, 2); put(3, x, 53, 10)
for x, v in ((67, 7), (69, 7)): put(2, x, 54, v)
put(3, 69, 49, 83); put(3, 69, 50, 91)

# ====================================================================== 10 + 7: the camp - straw pole / stones / cut sacks out, a campfire in the middle of the tents
for (x, y) in ((52, 51), (52, 52), (51, 52), (53, 52)):
    put(2, x, y, 0); put(3, x, y, 0)

put(2, 52, 52, 291); put(2, 52, 53, 299)       # the supply crate by the fire (after the camp clean-up)

# ====================================================================== reshape the changed ground (layer 0) and its neighbours
cells = W.ring(touched, 1)
W.reshape(m, 0, cells)
# the yard keeps its own kerb: the ground around the house / the road is reshaped by the same rule
W.reshape(m, 0, W.ring({(x, y) for (x, y) in rect(HX0 - 1, ROOF0 - 1, HX1 + 1, WALL1 + 1)}, 1))

# ====================================================================== events
def new_id(): return len(ev)
def add_ev(src, x, y, name=None, note=None):
    e = copy.deepcopy(src); e["id"] = new_id(); e["x"], e["y"] = x, y
    if name: e["name"] = name
    if note is not None: e["note"] = note
    ev.append(e); return e
def move(i, x, y): ev[i]["x"], ev[i]["y"] = x, y

# gates: the south palisade piece in the gap goes, posts stand at both gates (4 posts; the neighbouring palisade ends cover cells 56 / 60)
ev[14] = None
post = copy.deepcopy(ev[75])
post["pages"][0]["image"] = {"tileId": 0, "characterName": "!$Garnizon_Brama_Slup", "direction": 2, "pattern": 1, "characterIndex": 0}
post["note"] = ""
post["name"] = "Slup bramy"
post["pages"][0]["through"] = True        # (decoration over the palisade ends, which already block these cells)
for (x, y) in ((56, 34), (60, 34), (56, 57), (60, 57)): add_ev(post, x, y)
# the camp fire (light like the kitchen fire)
fire = add_ev(ev[77], 50, 52, "Ognisko obozowe")
# the chimney's smoke on the red roof (like the barracks chimney)
add_ev(ev[42], 69, 49, "Dym z komina")
# the granary door gets a door picture (wooden, closed - like the barracks door)
ev[143]["pages"][0]["image"] = {"tileId": 0, "characterName": "!Fantasy_door1", "direction": 2, "pattern": 1, "characterIndex": 1}   # (straight light-brown door, as Dom Halina / Dom 13 in the town)
# the brazier and the lamp that stood at the gate posts move one cell outward (still a symmetric pair about the road)
move(74, 55, 32); move(75, 61, 32)
# 8: dummies / targets on one axis, symmetric about the yard's centre line x=52 (the banner, the muster spot)
move(49, 50, 45); move(50, 52, 45); move(51, 54, 45)
move(53, 54, 49)
move(54, 48, 43)
for (i, x) in ((126, 50), (127, 52), (128, 54)): move(i, x, 46)
for i in range(len(ev)):
    if ev[i]: assert ev[i]["id"] == i

# ====================================================================== write
out = W.map_text(m).encode("utf-8")
back = json.loads(out.decode("utf-8"))
assert W.map_text(back).encode("utf-8") == out
os.makedirs(STG, exist_ok=True)
open(os.path.join(STG, "Map162.json"), "wb").write(out)
assert b"\r" not in out
print("\n".join(log)); print("zapisano", os.path.join(STG, "Map162.json"), len(out), "bajtow;", len(ev), "zdarzen")
