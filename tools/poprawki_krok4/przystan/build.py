# -*- coding: utf-8 -*-
"""Krok 4, Map125 Przystan: poprawki ladne/rowne. TYLKO staging: tools/poprawki_krok4/przystan/staging/data/Map125.json.
   python tools/poprawki_krok4/przystan/build.py"""
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
for s in ("mapy", "rozszerzenia", "wzgorza_popraw"): sys.path.insert(0, os.path.join(ROOT, "tools", s))
import mapylib as L, wspolne as W, popraw as P
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
OUT = os.path.join(HERE, "staging", "data", "Map125.json")
raw = open(os.path.join(ROOT, "data", "Map125.json"), "rb").read()
m = json.loads(raw.decode("utf-8"))
assert W.map_text(m).encode("utf-8") == raw
Wd, Hd = m["width"], m["height"]; n = Wd * Hd; d = m["data"]
at = lambda z, x, y: d[z * n + y * Wd + x]
def put(z, x, y, v): d[z * n + y * Wd + x] = v
kind = lambda t: (t - 2048) // 48 if t >= 2048 else None
A = lambda k, s=0: 2048 + k * 48 + s
ev = {e["id"]: e for e in m["events"] if e}
C0, C1 = set(), set()
rep = []
def move(eid, x, y):
    e = ev[eid]; rep.append("zdarzenie %d '%s' (%d,%d) -> (%d,%d)" % (eid, e["name"], e["x"], e["y"], x, y)); e["x"], e["y"] = x, y

# 1. Wedzarnia Janka (30-32 x 1-5): thatched roof rows 1-3 like the hut, chimney on the slope
for yi, y in enumerate((1, 2, 3)):
    for xi, x in enumerate((30, 31, 32)):
        shape = {(0, 0): 3, (1, 0): 2, (2, 0): 6, (0, 1): 1, (1, 1): 0, (2, 1): 4, (0, 2): 9, (1, 2): 8, (2, 2): 12}[(xi, yi)]
        put(0, x, y, A(59, shape)); put(1, x, y, 0); C0.add((x, y))
for x in (30, 31, 32):
    for y in (0, 1): put(1, x, y, 0); C1.add((x, y))
put(3, 31, 2, 0); put(3, 31, 3, 0); put(3, 31, 1, 83); put(3, 31, 2, 91)
move(3, 31, 1)
for x in (30, 31, 32): put(5, x, 1, 2)   # the new top roof row blocks like the rest of the building
# 2. dark rock cut by the top edge (33-36 x 0-3) and its twin (75-78 x 0-4): gone (the north neighbour has grass there)
for (x0, y0, x1, y1) in ((33, 0, 36, 3), (75, 0, 78, 4), (27, 0, 27, 0)):
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            if at(1, x, y) and kind(at(1, x, y)) == 37: put(1, x, y, 0); C1.add((x, y))
# 3. bright flower blobs: the calmer tile flowers (kind 29), none on the very edge row
for y in range(Hd):
    for x in range(Wd):
        t = at(1, x, y)
        if t and kind(t) == 28:
            if y == 0: put(1, x, y, 0)
            else: put(1, x, y, A(29, (t - 2048) % 48))
            C1.add((x, y))
# 16. the Lord's customs house: lit shutters window 34-35 -> 33-34, lamp left of the door; banner stands on the plain wall
for (dx, dy) in ((0, 0), (1, 0), (0, 1), (1, 1)): pass
old = {(34, 16): 22, (35, 16): 23, (34, 17): 30, (35, 17): 31}
for (x, y) in old: put(2, x, y, 0)
for (x, y), t in old.items(): put(2, x - 1, y, t)
move(30, 31, 17)
# 15. starred crate over a free cell (20,4): blocked by region 2 (level with the hero)
import copy
nb = copy.deepcopy(ev[20]); nb["id"] = len(m["events"]); nb["name"] = "Skrzynka (blokada)"; nb["note"] = ""; nb["x"], nb["y"] = 20, 4
nb["pages"][0]["list"] = [{"code": 0, "indent": 0, "parameters": []}]; nb["pages"][0]["trigger"] = 0; nb["pages"][0]["priorityType"] = 1
m["events"].append(nb); ev[nb["id"]] = nb; rep.append("nowe zdarzenie %d blokada (20,4)" % nb["id"])
# 13. NW cobble patch: a compact oval inside the grass, no square cut at the water
for y in (1, 2, 3):
    for x in range(4, 11):
        if at(0, x, y) >= 2048 and kind(at(0, x, y)) == 19:
            put(0, x, y, A(16, 0)); C0.add((x, y))
for (x, y) in [(5, 1), (6, 1), (7, 1)] + [(x, 2) for x in range(4, 9)]:
    put(0, x, y, A(19, 0)); C0.add((x, y))
for y in (0, 1):
    for x in range(5, 11):
        if at(1, x, y) and kind(at(1, x, y)) == 21: put(1, x, y, 0); C1.add((x, y))   # (the tall-grass strip cut by the top edge showed through the oval)
# 8. the cobbled quay (19-21 x 9-24): arcs at both ends
put(0, 19, 9, A(17, 0)); put(0, 19, 24, A(16, 0)); put(0, 21, 24, A(16, 0))
for c in ((19, 9), (19, 24), (21, 24), (20, 9), (20, 24)): C0.add(c)
# 9. plot fences: one even kind-22 fence round the three plots (top row 20, sides 47/56/65/77, bottom row 29 with 2-wide gates at the doors)
for y in range(19, 32):
    for x in range(46, 79):
        t = at(1, x, y)
        if t and kind(t) in (22, 38): put(1, x, y, 0); C1.add((x, y))
F = set()
for x in range(47, 78): F.add((x, 20))
for x in (47, 56, 65, 77):
    for y in range(20, 30): F.add((x, y))
GAPS = {51, 52, 61, 62, 70, 71}
for x in range(47, 78):
    if x not in GAPS: F.add((x, 29))
for (x, y) in F: put(1, x, y, A(22, 0)); C1.add((x, y))
# 10. the carts, the lamp and the woodpile (72-74 x 27-28): one work corner inside the last plot
put(2, 78, 26, 0); put(2, 78, 27, 0); put(2, 75, 25, 0); put(1, 75, 25, 0); put(1, 76, 25, 0); put(5, 75, 25, 0); C1.update({(75, 25), (76, 25)})   # (the bush tile (75,25) sealed the yard behind the shed)
put(2, 76, 25, 256 + 178); put(2, 76, 26, 256 + 186)
move(53, 75, 28); move(51, 72, 26)
# 6, 7. the two closed eagle ledges as proper hills (grammar of tools/wzgorza_popraw), ground inside, no stairs
S = dict(P.GRASS)
HILLS = [("polka orla a (96-101 x 44-51)", (96, 44, 101, 49)), ("polka orla b (104-109 x 29-36)", (104, 29, 109, 34))]
def htile(top, x, y):
    x0, y0, x1, y1 = top
    if y == y0: return S["rimL"] if x == x0 else S["rimR"] if x == x1 else S["rim"]
    if y < y1: return S["sideL"] if x == x0 else S["sideR"] if x == x1 else None
    if y == y1: return S["lipL"] if x == x0 else S["lipR"] if x == x1 else S["lip"]
    row = y - y1
    if row == 1:
        if x == x0: return S["f1L"]
        if x == x1: return S["f1R"]
    else:
        if x == x0: return S["f2L"]
        if x == x1: return S["f2R"]
    k = P.hash2(125 * 1000 + x, y0)
    if 0 < x - x0 < x1 - x0 and k < 0.14: return (S["v1"] if row == 1 else S["v2"])[0 if k < 0.07 else 1]
    return S["f1"] if row == 1 else S["f2"]
foots = []
for name, top in HILLS:
    x0, y0, x1, y1 = top; foots.append((x0, y0, x1, y1 + 2))
    for y in range(y0, y1 + 3):
        for x in range(x0, x1 + 1):
            t = htile(top, x, y)
            if t is None: put(0, x, y, A(16, 0))
            else: put(0, x, y, 1536 + t)
            put(1, x, y, 0); put(4, x, y, 0); C0.add((x, y)); C1.add((x, y))
# trees whose crown/trunk stands under a face or on an outline: moved to the nearest free ground
occupied = {(e["x"], e["y"]) for e in m["events"] if e}
def infoot(x, y, mg=1): return any(a - mg <= x <= c + mg and b - mg <= y <= e2 + mg + 3 for (a, b, c, e2) in foots)
for e in [e for e in m["events"] if e]:
    if not e["name"].startswith(("Drzewo", "Sosna")): continue
    if not any(a - 1 <= e["x"] <= c + 1 and e2 - 1 < e["y"] <= e2 + 3 for (a, b, c, e2) in foots): continue
    done = False
    for r in range(1, 12):
        for dy in range(-r, r + 1):
            for dx in range(-r, r + 1):
                if max(abs(dx), abs(dy)) != r or done: continue
                x, y = e["x"] + dx, e["y"] + dy
                if 0 <= x < Wd and 0 <= y < Hd and (x, y) not in occupied and at(0, x, y) >= 2048 and 16 <= kind(at(0, x, y)) < 48 \
                        and not infoot(x, y) and all((x + a, y + b) not in occupied for a in (-1, 0, 1) for b in (-1, 0)):
                    occupied.discard((e["x"], e["y"])); move(e["id"], x, y); occupied.add((x, y)); done = True
        if done: break
# 14. boats: new top-down sheets
for eid, name in ((12, "!$Lodz_Janka_z_gory"), (13, "!$Lodz_Mala_z_gory"), (16, "!$Lodz_Zaglowka_z_gory")):
    if os.path.exists(os.path.join(ROOT, "img", "characters", name + ".png")):
        ev[eid]["pages"][0]["image"]["characterName"] = name; rep.append("zdarzenie %d -> %s" % (eid, name))

W.reshape(m, 0, W.ring(C0, 1))
W.reshape(m, 1, W.ring(C1 | C0, 1))
out = W.map_text(m).encode("utf-8")
assert json.loads(out.decode("utf-8")) == m
assert all(e is None or e["id"] == i for i, e in enumerate(m["events"]))
os.makedirs(os.path.dirname(OUT), exist_ok=True)
open(OUT, "wb").write(out)
print("\n".join(rep)); print("zapisano", OUT)
