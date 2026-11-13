# -*- coding: utf-8 -*-
"""Map025 'Pokoje gości' - third method (Tawerna 2): 63 x 55 = exactly Map001's rectangle, the two stair boxes in the same cells (x0..4 and x24..28,
y45..53), the old furnished rooms SHRUNK (plain floor rows/columns removed, lib2.Piece.shrink_*) and set in bands round two corridors:
 N1 (door down, y0..12): 3, 1, 2, 4, 5, 12 | C1 y12..20 | S1 (door up, y20..32): 6 | 10 | bath, 9 | N2 (door down, y32..45): 8 | 7 | komnata, 11 | C2' y45..54:
 the stair hall (Map001's vestibule) + the corridor east of it. Two connector halls (x11..17 and x30..33) join C1 and C2'."""
import sys, os, json, copy
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import lib, lib2
from lib2 import Piece

OLD = 25
W_, H_ = 63, 55
c = lib.Canvas(25, W_, H_, 25)
VOID = 2048 + 25 * 48
for y in range(H_):
    for x in range(W_): c.put(0, x, y, VOID)
ROOMS = {}
o = lib.old(OLD)["data"]
def ot(z, x, y): return o[(z * 71 + y) * 97 + x]
M1 = json.load(open(os.path.join(lib.STAGING, "data", "Map001.json"), encoding="utf-8"))     # (built first)

C1_TOP = 12
S1_TOP = 20; N2_BOTTOM = 45

def room(key, interior, mapping=None, down=True, extra=3):
    x0, y0, x1, y1 = interior
    outer = (x0 - 1, y0 - 1, x1 + 1, y1 + 1)
    p = Piece(OLD, outer, ev_rect=(outer[0], outer[1], outer[2], outer[3] + (extra if down else 0)), name=key)
    p.key, p.mapping, p.interior = key, mapping or {}, interior
    return p

def to_height(p, h):
    if p.h > h: p.shrink_rows(p.h - h, near=p.h // 2)
    if p.h > h: raise ValueError("%s cannot get down to %d rows (%d)" % (p.key, h, p.h))
    if p.h < h: p.grow_rows(h - p.h, near=max(2, p.h - 5))

def group(pieces, x_left, x_right, hints=None, y_top=None, y_bottom=None, h=None):
    """pieces side by side from x_left to x_right (outer frames inclusive, shared frame columns); widths adjusted by shrink / growth"""
    for p in pieces: to_height(p, h)
    hints = hints or {}
    need = (x_right - x_left) - sum(p.w - 1 for p in pieces)
    i = 0
    while need != 0:
        p = pieces[i % len(pieces)]; i += 1
        assert i < 400, "group x%d..%d cannot be fitted (need %d)" % (x_left, x_right, need)
        if need > 0:
            try: p.grow_cols(1, near=hints.get(p.key, p.w // 2)); need -= 1
            except ValueError: pass
        else:
            if p.shrink_cols(1, near=hints.get(p.key, p.w // 2)): need += 1
    x = x_left
    for p in pieces:
        oy = (y_bottom - (p.h - 1)) if y_bottom is not None else y_top
        placed = p.place(c, x, oy)
        if p.mapping: c.rename_numbers([e["id"] for e in placed], p.mapping)
        ix0, iy0, ix1, iy1 = p.interior
        rx0, ry0 = p.rel(ix0, iy0); rx1, ry1 = p.rel(ix1, iy1)
        ROOMS[p.key] = [x + rx0, oy + ry0, x + rx1, oy + ry1]
        p.placed_x = x
        x += p.w - 1

# ---------------------------------------------------------------- corridors from the old strips
def corridor(top, x_from, x_to, left_cap=True, right_cap=True, rows=(14, 15, 16, 17, 18, 19, 20)):
    for k, oy in enumerate(rows, 1):
        for x in range(x_from, x_to + 1):
            if left_cap and x < x_from + 2: ox = x - x_from
            elif right_cap and x > x_to - 2: ox = 95 + (x - (x_to - 1))
            else: ox = 24
            for z in (0, 2, 3, 4, 5): c.put(z, x, top + k, ot(z, ox, oy))
            if oy in (18, 19):
                lo = x_from + (2 if left_cap else 0); hi = x_to - (2 if right_cap else 0)
                if lo <= x <= hi:
                    ox1 = 2 if (left_cap and x == lo) else 94 if (right_cap and x == hi) else 30
                    c.put(1, x, top + k, ot(1, ox1, oy))
corridor(C1_TOP, 0, W_ - 1)                                         # C1: frame y12 .. frame y20 (interior 13..19)
# C2': the stair hall (x0..28 from Map001) + the corridor east of it (x28..62, 10 rows: wall 3, floor 5)
vest = Piece(M1, (0, 45, 28, 54), name="vestibule")
vest.drop_events(lambda e: True)
vest.place(c, 0, 45, retarget=False)
corridor(45, 28, W_ - 1, left_cap=False, right_cap=True, rows=(14, 15, 16, 17, 18, 18, 19, 20))
for x in (13, 14, 15): c.put(0, x, 54, VOID)                          # the exit to the town is closed upstairs
for x in range(28, W_): c.put(0, x, 54, 3281)                          # bottom frame of the strip
for x in range(28, W_): c.put(0, x, 45, 3281)                          # its top frame (rooms overwrite where they stand)

# ---------------------------------------------------------------- rooms
N1 = [room("r3", (22, 34, 33, 44)), room("r1", (35, 34, 41, 44)), room("r2", (55, 34, 61, 44)), room("r4", (63, 34, 74, 44)),
      room("r5", (9, 1, 17, 12), {22: 5}), room("r12", (19, 3, 25, 12), {21: 12})]
group(N1, 0, 62, y_bottom=12, h=13)
S1G1 = [room("r6", (63, 22, 71, 32), {17: 6}, down=False)]
S1G2 = [room("r10", (58, 54, 69, 65), down=False)]
S1G3 = [room("bath", (1, 22, 17, 32), down=False), room("r9", (27, 54, 38, 65), down=False)]
group(S1G1, 0, 10, y_top=S1_TOP, h=13); group(S1G2, 18, 29, y_top=S1_TOP, h=13); group(S1G3, 34, 62, y_top=S1_TOP, h=13)
N2G1 = [room("r8", (1, 3, 7, 12), {23: 8})]
N2G2 = [room("r7", (1, 34, 9, 44))]
N2G3 = [room("chamber", (59, 1, 76, 12)), room("r11", (27, 1, 37, 12), {20: 11})]
group(N2G1, 0, 10, y_bottom=N2_BOTTOM, h=14, hints={"r8": 2}); group(N2G2, 18, 29, y_bottom=N2_BOTTOM, h=14, hints={"r7": 7})
group(N2G3, 34, 62, y_bottom=N2_BOTTOM, h=14)

# ---------------------------------------------------------------- the connector halls (interior x11..17 and x30..33): parquet like the old gallery
def hall(x0, x1, y0, y1):
    pat = {x0: 5904, x1: 5912}
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            c.put(0, x, y, pat.get(x, 5888))
            for z in (1, 2, 3, 4, 5): c.put(z, x, y, 0)
hall(11, 17, 20, 44)          # joins C1's floor (y19) with the stair hall's opening (y45, x13..15)
hall(30, 33, 20, 49)          # joins C1 with the corridor east of the stair hall (its wall rows 46..48 opened)
for ry in (24, 36):           # the old red rug
    for dy in range(4):
        for dx in range(5): c.put(1, 12 + dx, ry + dy, ot(1, 46 + dx, 22 + dy))
ROOMS["hall1"] = [11, 20, 17, 44]; ROOMS["hall2"] = [30, 20, 33, 49]
ROOMS["nc"] = [1, 13, 61, 19]; ROOMS["sc"] = [5, 46, 61, 53]; ROOMS["stairs_w"] = [1, 46, 3, 52]; ROOMS["stairs_e"] = [25, 46, 27, 52]

def thick_voids():
    out = []
    for y in range(H_ - 1):
        for x in range(W_ - 1):
            if (x < 1 or y < 1 or x > W_ - 3 or y > H_ - 3): continue
            if all(lib2.W.kind_of(c.get(0, x + a, y + b)) == 25 for a in (0, 1) for b in (0, 1)): out.append((x, y))
    return out

def close_edges():
    """the outer boundary of the rectangle is wall: any floor cell on it becomes frame (kind 25)"""
    for y in range(H_):
        for x in range(W_):
            if x in (0, W_ - 1) or y in (0, H_ - 1):
                v = c.get(0, x, y)
                if v >= 2048 and (v - 2048) // 48 != 25: c.put(0, x, y, VOID)

def finish():
    close_edges()
    for k in [k for k, e in c.events.items() if (e['x'] in (0, W_ - 1) or e['y'] in (0, H_ - 1)) and not e['name'].startswith(('Schody', 'Drzwi', 'Wejście'))]: del c.events[k]
    lib2.reshape_all(c)
    v = thick_voids()
    assert not v, "void blocks at %s" % v[:12]

if __name__ == "__main__":
    json.dump(ROOMS, open(os.path.join(lib.STAGING, "layout025.json"), "w"), indent=1)
    finish()
    print("saved", c.save(), len(c.events), "events")
    lib.render(c, os.path.join(lib.HERE, "..", "..", "docs", "tawerna2", "_025_wip.png"), scale=0.4)
