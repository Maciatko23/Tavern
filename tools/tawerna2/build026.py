# -*- coding: utf-8 -*-
"""Map026 'Apartamenty' - third method (Tawerna 2): 63 x 55 like Map001 / Map025, the same two stair boxes (x0..4, x24..28, y45..53) = two real
stairs down, the stair hall (Map001's vestibule) at the bottom, one connector hall (x11..17) up to the corridor C1, the Lord's bedroom + salon,
the library and two more old suites on top (N1, door down, y0..18), the Zloty saloon + bedroom, the old Wielki salon and a green suite below
the corridor (S1, door up, y26..45), the old terrace east of the stair hall. Old rooms shrunk / grown with plain floor to equal heights."""
import sys, os, json, copy
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import lib, lib2
from lib2 import Piece

OLD = 26
W_, H_ = 63, 55
c = lib.Canvas(26, W_, H_, 26)
VOID = 2048 + 25 * 48
for y in range(H_):
    for x in range(W_): c.put(0, x, y, VOID)
ROOMS = {}
o25 = lib.old(25)["data"]
def ot(z, x, y): return o25[(z * 71 + y) * 97 + x]
M1 = json.load(open(os.path.join(lib.STAGING, "data", "Map001.json"), encoding="utf-8"))
N1_BOTTOM, C1_TOP, S1_TOP = 18, 18, 26

def room(key, interior, down, extra=4, tagless=False):
    x0, y0, x1, y1 = interior
    outer = (x0 - 1, y0 - 1, x1 + 1, y1 + 1)
    p = Piece(OLD, outer, ev_rect=(outer[0], outer[1], outer[2], outer[3] + (extra if down else 0)), name=key)
    p.key, p.mapping, p.interior, p.tagless = key, {}, interior, tagless
    return p

def to_height(p, h):
    if p.h > h: p.shrink_rows(p.h - h, near=p.h // 2)
    if p.h > h: raise ValueError("%s cannot get down to %d rows (%d)" % (p.key, h, p.h))
    if p.h < h: p.grow_rows(h - p.h, near=max(2, p.h - 5))

def group(pieces, x_left, x_right, y_top=None, y_bottom=None, h=None, hints=None):
    for p in pieces: to_height(p, h)
    hints = hints or {}
    need = (x_right - x_left) - sum(p.w - 1 for p in pieces); i = 0
    while need != 0:
        p = pieces[i % len(pieces)]; i += 1
        assert i < 400, "group x%d..%d cannot be fitted (need %d)" % (x_left, x_right, need)
        if need > 0:
            try: p.grow_cols(1, near=hints.get(p.key, p.w // 2)); need -= 1
            except ValueError: pass
        elif p.shrink_cols(1, near=hints.get(p.key, p.w // 2)): need += 1
    x = x_left
    for p in pieces:
        oy = (y_bottom - (p.h - 1)) if y_bottom is not None else y_top
        placed = p.place(c, x, oy)
        if p.tagless:                         # an unused old room: no <Tavern:...> tags (not rentable, no plan key)
            for e in placed:
                for pg in e["pages"]:
                    pg["list"] = [cmd for cmd in pg["list"] if not (cmd["code"] in (108, 408) and "<Tavern:" in str(cmd["parameters"][0]))]
        ix0, iy0, ix1, iy1 = p.interior
        rx0, ry0 = p.rel(ix0, iy0); rx1, ry1 = p.rel(ix1, iy1)
        ROOMS[p.key] = [x + rx0, oy + ry0, x + rx1, oy + ry1]
        x += p.w - 1

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
                    c.put(1, x, top + k, ot(1, 2 if (left_cap and x == lo) else 94 if (right_cap and x == hi) else 30, oy))
corridor(C1_TOP, 0, W_ - 1)

# ---- the stair hall (Map001's vestibule, exit closed) and the old terrace east of it
vest = Piece(M1, (0, 45, 28, 54), name="vestibule"); vest.drop_events(lambda e: True)
vest.place(c, 0, 45, retarget=False)
for x in (13, 14, 15): c.put(0, x, 54, VOID)
def tpiece(key, rect):
    p = Piece(OLD, rect, name=key); p.key, p.mapping, p.interior, p.tagless = key, {}, (rect[0] + 1, rect[1] + 1, rect[2] - 1, rect[3] - 1), True
    p.drop_events(lambda e: e["name"].startswith(("Drzwi", "Wejście", "Wyjście", "Schody")))
    return p
group([tpiece("terrace_a", (20, 47, 30, 54)), tpiece("terrace_b", (30, 47, 50, 54))], 28, 62, y_top=45, h=10)
for x in range(28, 63): c.put(0, x, 45, VOID)                      # the old doors up are closed: the terrace is an unused room

# ---- N1 (door down): the Lord's suite, the library, two more old suites
n1 = [room("lordb", (22, 1, 31, 15), True), room("lorda", (33, 1, 47, 15), True), room("lib", (49, 1, 58, 15), True, tagless=True),
      room("s2a", (60, 1, 68, 15), True, tagless=True), room("s2b", (70, 1, 79, 15), True, tagless=True)]
group(n1, 0, 62, y_bottom=N1_BOTTOM, h=19)
# ---- S1 (door up) split by the connector hall x11..17: [s3a] | [s4a, s4b, salon]
group([room("s3a", (12, 32, 19, 46), False, tagless=True)], 0, 10, y_top=S1_TOP, h=20)
group([room("s4a", (61, 32, 68, 46), False), room("s4b", (70, 32, 79, 46), False), room("salon", (21, 32, 39, 46), False, tagless=True)], 18, 62, y_top=S1_TOP, h=20)

# ---- the connector hall x11..17 (rows 26..44) joins C1 with the stair hall's opening (x13..15, y45)
for y in range(26, 45):
    for x in range(11, 18):
        c.put(0, x, y, {11: 5904, 17: 5912}.get(x, 5888))
        for z in (1, 2, 3, 4, 5): c.put(z, x, y, 0)
for dy in range(4):
    for dx in range(5): c.put(1, 12 + dx, 33 + dy, ot(1, 46 + dx, 22 + dy))
ROOMS["hall"] = [11, 26, 17, 44]; ROOMS["nc"] = [1, 19, 61, 25]; ROOMS["stairs_w"] = [1, 46, 3, 52]; ROOMS["stairs_e"] = [25, 46, 27, 52]

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
    json.dump(ROOMS, open(os.path.join(lib.STAGING, "layout026.json"), "w"), indent=1)
    finish()
    print("saved", c.save(), len(c.events), "events")
    lib.render(c, os.path.join(lib.HERE, "..", "..", "docs", "tawerna2", "_026_wip.png"), scale=0.4)
