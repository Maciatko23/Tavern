# python tools/quest_places/art.py [--preview DIR]
# The pictures of the quest places (tools/quest_places/build.py) as one RPG Maker character sheet,
# img/characters/!Quest_Places.png - 144 x 144 frames like the town interiors' !House_Town (tools/interiors/props.py): the event's
# cell is the frame's bottom-middle 48 x 48 (a 2-wide piece fills the right two thirds: its event stands on the LEFT cell; a
# 3-wide one the whole frame: the event on the middle cell); "!" sheet - no 6 px lift.
# Drawn here pixel by pixel in the Winlu look (the colours sampled from tileset 8's raw-stone wall A3 kind 71 and from the
# town tileset's stones, iron and wood), 1 px dark outline on the solid things, none on the decals (puddle, damp, moss).
# A few pieces start from the author's own art and are changed: the potted orange tree is the crown of his small leafy tree
# (Fantasy_Outside_D_green (7,5..6)) with oranges, in a planter box drawn here; the orangery's windows are his arched window
# (Outside B (4,4..5)) with an orange tree behind the leaded panes, its door the same stone arch carried to the ground; the
# gardener's table is his table (Outside C) with a drawer and tools.
# Also copies the Winlu Interior Remaster lectern !$Altar.png (an open book between candles) into img/characters.
#
#   index 0 - the well's bottom (Map118)          dir 2: canal arch (3 wide, the whole wall face) | puddle (centred, ~2 wide) | ring glint
#                                                 dir 4: rope from the shaft | damp + moss on a wall | damp + moss (2)
#                                                 dir 6: fallen stones | moss on the floor | an old bucket on its side
#   index 1 - the knights' garden (Map008)        dir 2: the opened slab with the stairs down
#   index 2 - the orangery (Map024)               dir 2: hand pump on the raven hatch | gardener's table with the drawer (2 wide) |
#                                                        potted orange tree
#                                                 dir 4: back gate closed | back gate open | the orangery's door (with a lantern)
#                                                 dir 6: orangery window (1 x 2) | orangery window, mirrored
import os, sys, math, shutil, argparse
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
OUT_PATH = os.path.join(ROOT, "img", "characters", "!Quest_Places.png")
ALTAR_SRC = os.path.join(ROOT, "img", "tilesets", "Winlu Fantasy Tileset - Interior", "Remaster", "characters", "!$Altar.png")
ALTAR_DST = os.path.join(ROOT, "img", "characters", "!$Altar.png")
EXT_C = os.path.join(ROOT, "img", "tilesets", "Winlu Fantasy Tileset - Exterior", "Winlu Fantasy Exterior", "tilesets", "Fantasy_Outside_C.png")
EXT_D = os.path.join(ROOT, "img", "tilesets", "Winlu Fantasy Tileset - Exterior", "Fantasy_Tileset_Green_Edition_upgrade", "tilesets", "Fantasy_Outside_D_green.png")
EXT_B = os.path.join(ROOT, "img", "tilesets", "Winlu Fantasy Tileset - Exterior", "Fantasy_Tileset_Green_Edition_upgrade", "tilesets", "Fantasy_Outside_B_green.png")
F = 144

# ---- colours
OUT = (38, 32, 38)
ST = {"gap": (52, 47, 54), "dk": (66, 60, 62), "md": (78, 71, 69), "lt": (90, 83, 79), "hi": (104, 97, 90), "mortar": (110, 104, 95), "mhi": (122, 116, 104)}
CUT = {"dk": (84, 79, 78), "md": (104, 99, 95), "lt": (122, 117, 110), "hi": (140, 135, 126), "edge": (60, 55, 58)}      # dressed stone
BRICK = {"a": (86, 72, 68), "b": (93, 78, 72), "c": (80, 68, 65), "line": (56, 50, 53), "hi": (106, 90, 82)}             # the newer infill
IRON = {"o": (26, 28, 34), "d": (40, 44, 50), "m": (56, 62, 70), "h": (84, 94, 104), "hh": (112, 124, 134)}
VOID = (16, 16, 24)
WATER = {"d": (34, 44, 58), "m": (48, 62, 78), "l": (82, 102, 122), "h": (176, 196, 214), "w": (220, 232, 240)}
MOSS = {"d": (48, 70, 44), "m": (66, 92, 54), "l": (88, 118, 64), "h": (112, 140, 78)}
ROPE = {"o": (54, 40, 30), "d": (104, 80, 54), "m": (134, 106, 72), "l": (160, 132, 92), "h": (184, 158, 112)}
WOOD = {"o": (44, 32, 30), "d": (78, 58, 48), "m": (100, 76, 60), "l": (122, 94, 72), "h": (142, 112, 84)}
GOLD = {"d": (150, 104, 30), "m": (208, 160, 60), "l": (246, 214, 120), "w": (255, 250, 220)}
GREEN_IRON = {"o": (24, 30, 30), "d": (34, 46, 44), "m": (48, 64, 60), "l": (66, 86, 80), "h": (96, 120, 110)}
PAINT = {"o": (58, 62, 64), "d": (170, 174, 168), "m": (206, 208, 200), "l": (232, 232, 224)}                            # white-painted frames


def h32(*a):
    v = 2166136261
    for ch in repr(a).encode():
        v = ((v ^ ch) * 16777619) & 0xFFFFFFFF
    return v


class Frame:
    """one 144 x 144 frame being drawn"""
    def __init__(self):
        self.im = Image.new("RGBA", (F, F), (0, 0, 0, 0))
        self.px = self.im.load()

    def put(self, x, y, c, a=255):
        x, y = int(x), int(y)
        if 0 <= x < F and 0 <= y < F:
            self.px[x, y] = tuple(c[:3]) + (a,)

    def get(self, x, y):
        if 0 <= x < F and 0 <= y < F:
            return self.px[int(x), int(y)]
        return (0, 0, 0, 0)

    def blend(self, x, y, c, a):
        """c over what is there with alpha a (0..255); on an empty pixel it stays a translucent pixel"""
        x, y = int(x), int(y)
        if not (0 <= x < F and 0 <= y < F):
            return
        r, g, b, al = self.px[x, y]
        if al == 0:
            self.px[x, y] = tuple(c[:3]) + (a,)
            return
        k = a / 255.0
        na = min(255, al + int((255 - al) * k))
        self.px[x, y] = (round(r * (1 - k) + c[0] * k), round(g * (1 - k) + c[1] * k), round(b * (1 - k) + c[2] * k), na)

    def rect(self, x0, y0, x1, y1, c, a=255):
        for y in range(int(y0), int(y1) + 1):
            for x in range(int(x0), int(x1) + 1):
                self.put(x, y, c, a)

    def paste(self, img, x, y):
        self.im.alpha_composite(img, (int(x), int(y)))
        self.px = self.im.load()


def outline(fr, color=OUT, thresh=128, skip=None):
    """a 1 px outline round the solid pixels (4 neighbours)"""
    src = fr.im.copy()
    sp = src.load()
    for y in range(F):
        for x in range(F):
            if sp[x, y][3] >= thresh:
                continue
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < F and 0 <= ny < F and sp[nx, ny][3] >= thresh:
                    if skip and skip(x, y):
                        break
                    fr.put(x, y, color)
                    break


def ellipse_in(x, y, cx, cy, rx, ry):
    return ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1.0


# ================================================================================================ index 0: the well's bottom
def canal_arch():
    """the order's canal mouth in the north wall (3 cells wide, the wall face's 3 rows): a round arch of dressed stone, walled
    up later with smaller reddish stones; the keystone carries a carved raven; at the foot an iron grate - black water-dark
    behind it with a thin glint (water runs there); damp below the grate and moss at the arch's feet"""
    fr = Frame()
    cx, base = 72, 143          # the arch's axis and the floor line (the frame's bottom)
    R_OUT, R_IN = 58, 46        # the ring's outer / inner radius
    SPRING = 78                 # where the round part starts (y); straight jambs below
    def in_ring(x, y, r):
        if y >= SPRING:
            return abs(x - cx) <= r
        return (x - cx) ** 2 + (y - SPRING) ** 2 <= r * r
    # the infill: courses of smaller, newer stones (reddish-grey), staggered
    for y in range(0, base + 1):
        for x in range(cx - R_IN, cx + R_IN + 1):
            if not in_ring(x, y, R_IN):
                continue
            row = (base - y) // 9
            fy = (base - y) % 9
            off = 7 if row % 2 else 0
            bw = 15
            k = (x - (cx - R_IN) + off) % bw
            tone = h32("b", row, (x - (cx - R_IN) + off) // bw) % 3
            c = [BRICK["a"], BRICK["b"], BRICK["c"]][tone]
            if fy == 0 or k == 0:
                c = BRICK["line"]
            elif fy == 8:
                c = BRICK["hi"] if k not in (1, bw - 1) else c
            elif fy == 1:
                c = tuple(max(0, v - 10) for v in c)
            fr.put(x, y, c)
    # the ring: dressed voussoirs radiating from the centre of the round part; the jambs straight blocks
    n_vous = 13
    for y in range(0, base + 1):
        for x in range(cx - R_OUT, cx + R_OUT + 1):
            if not in_ring(x, y, R_OUT) or in_ring(x, y, R_IN):
                continue
            if y < SPRING:
                ang = math.atan2(SPRING - y, x - cx)            # 0 (right) .. pi (left)
                seg = int(ang / math.pi * n_vous)
                fa = (ang / math.pi * n_vous) - seg
                r = math.hypot(x - cx, y - SPRING)
                fr_ = (r - R_IN) / (R_OUT - R_IN)
                joint = fa < 0.06
            else:
                seg = 100 + (base - y) // 16
                fa = ((base - y) % 16) / 16.0
                fr_ = (abs(x - cx) - R_IN) / (R_OUT - R_IN)
                joint = (base - y) % 16 == 0
            if joint:
                c = CUT["edge"]
            else:
                tone = h32("v", seg) % 3
                c = [CUT["md"], CUT["lt"], CUT["md"]][tone]
                if fr_ < 0.15:
                    c = CUT["dk"]                                 # the inner edge in shade
                elif fr_ > 0.85:
                    c = CUT["hi"] if y < SPRING + 4 else CUT["lt"]
                if y < SPRING and x < cx and fr_ > 0.5 and h32("p", x, y) % 7 == 0:
                    c = CUT["hi"]
            fr.put(x, y, c)
    # the outer edge line of the ring and the inner one
    for y in range(0, base + 1):
        for x in range(cx - R_OUT - 1, cx + R_OUT + 2):
            o, i = in_ring(x, y, R_OUT), in_ring(x, y, R_IN)
            if o and not i:
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    if not in_ring(x + dx, y + dy, R_OUT) and 0 <= y + dy <= base:
                        fr.put(x, y, OUT); break
                    if in_ring(x + dx, y + dy, R_IN):
                        fr.put(x, y, CUT["edge"]); break
    # the keystone with the raven (sticks out a little above the ring)
    kx0, kx1, ky0, ky1 = cx - 9, cx + 9, SPRING - R_OUT - 4, SPRING - R_IN + 8
    for y in range(ky0, ky1 + 1):
        w = 9 - (y - ky0) * 3 // (ky1 - ky0 + 1)               # narrower at the bottom (a wedge)
        for x in range(cx - w, cx + w + 1):
            c = CUT["lt"]
            if x == cx - w or y == ky0:
                c = CUT["hi"]
            if x == cx + w or y == ky1:
                c = CUT["dk"]
            fr.put(x, y, c)
        fr.put(cx - w - 1, y, OUT); fr.put(cx + w + 1, y, OUT)
    for x in range(cx - 10, cx + 11):
        fr.put(x, ky0 - 1, OUT)
    # the raven carved in it: a small bird in profile facing left, cut lines in shade with a lit lower lip
    raven = ["......####......",
             "....######......",
             "..#########.....",
             "#####.#######...",
             "....##########..",
             ".....#########..",
             "......########..",
             ".......#######..",
             "........####.##.",
             ".........#.#..##",
             "........##.##..."]
    rx0, ry0 = cx - 8, ky0 + 4
    for j, row in enumerate(raven):
        for i, ch in enumerate(row):
            if ch == "#":
                fr.put(rx0 + i, ry0 + j, (58, 54, 58))
                if fr.get(rx0 + i, ry0 + j + 1)[:3] == CUT["lt"] and (j + 1 >= len(raven) or row[i] != raven[j + 1][i] if j + 1 < len(raven) else True):
                    fr.put(rx0 + i, ry0 + j + 1, CUT["hi"])
    fr.put(rx0 + 5, ry0 + 1, (150, 146, 136))                   # the eye
    # the grate at the foot: a low round-headed opening, black inside, iron bars, a thin glint of water low down
    gx0, gx1, gy0 = cx - 17, cx + 17, base - 30
    g_spring = gy0 + 12
    def in_open(x, y):
        if y >= g_spring:
            return gx0 <= x <= gx1
        return (x - cx) ** 2 + ((y - g_spring) * 1.4) ** 2 <= 17 * 17
    for y in range(gy0 - 4, base + 1):
        for x in range(gx0 - 4, gx1 + 5):
            if in_open(x, y):
                c = VOID
                if y > base - 7:
                    c = WATER["d"]
                    if (x + y * 3) % 11 == 0:
                        c = WATER["m"]
                    if y == base - 5 and (x // 3) % 3 == 0:
                        c = WATER["l"]
                fr.put(x, y, c)
            elif any(in_open(x + dx, y + dy) for dx in (-3, 0, 3) for dy in (-3, 0, 3)):
                fr.put(x, y, CUT["md"] if (x + y) % 5 else CUT["lt"])     # the dressed frame round the opening
    for y in range(gy0 - 5, base + 1):
        for x in range(gx0 - 5, gx1 + 6):
            if not any(in_open(x + dx, y + dy) for dx in (-3, 0, 3) for dy in (-3, 0, 3)) and \
               any(in_open(x + dx, y + dy) for dx in (-4, 0, 4) for dy in (-4, 0, 4)):
                fr.put(x, y, CUT["edge"])
    for bx in range(gx0 + 2, gx1, 6):                            # the bars
        for y in range(gy0 - 2, base + 1):
            if in_open(bx, y) or in_open(bx + 1, y):
                fr.put(bx, y, IRON["d"]); fr.put(bx + 1, y, IRON["h"] if y % 7 else IRON["hh"]); fr.put(bx + 2, y, IRON["o"])
    for by in (g_spring - 2, base - 9):
        for x in range(gx0, gx1 + 1):
            if in_open(x, by):
                fr.put(x, by, IRON["m"]); fr.put(x, by + 1, IRON["d"]); fr.put(x, by - 1, IRON["h"])
    for (x, y) in ((gx0 + 1, g_spring - 1), (gx1 - 1, g_spring - 1), (gx0 + 1, base - 8), (gx1 - 1, base - 8)):
        fr.put(x, y, IRON["hh"])                                 # rivets / pins in the stone
    # damp: dark streaks running down the infill from the grate's head and down the jambs; moss at the feet
    for sx in (cx - 30, cx - 23, cx + 25, cx + 33, cx - 6, cx + 8):
        top = 30 + h32("s", sx) % 40
        for y in range(top, base + 1):
            if in_open(sx, y):
                continue
            a = int(70 * min(1.0, (y - top) / 30.0))
            fr.blend(sx, y, (30, 34, 36), a)
            if h32("w", sx, y) % 4 == 0:
                fr.blend(sx + 1, y, (30, 34, 36), a // 2)
    for (mx, my, n) in ((cx - R_OUT + 3, base - 2, 22), (cx + R_OUT - 4, base - 2, 18), (gx0 - 4, base - 1, 10), (gx1 + 5, base - 1, 9),
                        (cx - 40, SPRING - 20, 6), (cx + 44, SPRING - 6, 7)):
        moss_patch(fr, mx, my, n, h32("m", mx, my))
    return fr


def moss_patch(fr, mx, my, n, seed):
    """a little clump of moss growing up from (mx, my)"""
    for i in range(n * 3):
        s = h32(seed, i)
        dx = (s % (n + 1)) - n // 2
        dy = -((s >> 8) % max(2, n // 3 + 2))
        if abs(dx) * 2 + abs(dy) * 3 > n * 1.6:
            continue
        c = [MOSS["d"], MOSS["m"], MOSS["m"], MOSS["l"]][(s >> 16) % 4]
        if dy < -2 and (s >> 20) % 3 == 0:
            c = MOSS["h"]
        fr.put(mx + dx, my + dy, c)


def puddle():
    """a shallow puddle on the floor (2 cells wide, one row and a bit): dark water over the stones, translucent, a lighter
    wet rim, the light from the shaft caught on it - no water tiles, nothing to drink"""
    fr = Frame()
    cx, cy, rx, ry = 72, 122, 40, 13
    def edge(x, y):
        a = math.atan2(y - cy, x - cx)
        wob = 1 + 0.10 * math.sin(a * 3 + 0.7) + 0.07 * math.sin(a * 5 + 2.0)
        return ((x - cx) / (rx * wob)) ** 2 + ((y - cy) / (ry * wob)) ** 2
    for y in range(cy - ry - 6, cy + ry + 6):
        for x in range(cx - rx - 8, cx + rx + 8):
            e = edge(x, y)
            if e <= 1.0:
                c = WATER["d"] if e > 0.35 else WATER["m"]
                a = 205 if e < 0.85 else 160
                if e > 0.92:
                    c = WATER["l"]; a = 120
                fr.blend(x, y, c, a)
            elif e <= 1.45:
                fr.blend(x, y, (24, 26, 30), int(90 * (1.45 - e) / 0.45))      # the wet stone round it
    # the light of the shaft on the water: a soft streak and a few sparkles
    for y in range(cy - 7, cy - 2):
        for x in range(cx - 14 + (cy - y), cx + 10 + (cy - y)):
            if edge(x, y) < 0.8:
                fr.blend(x, y, WATER["h"], 70 if (x + y) % 3 else 110)
    for (x, y) in ((cx - 4, cy - 6), (cx + 6, cy - 4), (cx - 18, cy + 2), (cx + 20, cy + 4), (cx - 9, cy - 3)):
        fr.put(x, y, WATER["w"], 220)
    # two stones breaking the surface
    for (sx, sy) in ((cx + 24, cy + 3), (cx - 27, cy - 2)):
        for y in range(sy - 2, sy + 3):
            for x in range(sx - 3, sx + 4):
                if ellipse_in(x, y, sx, sy, 3.5, 2.5):
                    fr.put(x, y, ST["lt"] if y <= sy - 1 else ST["md"])
        fr.put(sx - 2, sy - 2, ST["hi"])
    return fr


def ring_glint():
    """the ring in the puddle: a small gold band under the water and a sparkle (for the quest's event)"""
    fr = Frame()
    cx, cy = 72, 124
    for a in range(0, 360, 6):
        x = cx + round(4 * math.cos(math.radians(a)))
        y = cy + round(2.4 * math.sin(math.radians(a)))
        fr.put(x, y, GOLD["m"] if math.sin(math.radians(a)) > 0 else GOLD["l"])
    fr.put(cx - 3, cy - 1, GOLD["w"]); fr.put(cx + 1, cy - 2, GOLD["l"]); fr.put(cx + 4, cy + 1, GOLD["d"])
    fr.put(cx, cy - 4, GOLD["m"]); fr.put(cx + 1, cy - 4, GOLD["l"])          # the little stone on top
    for d in range(1, 4):                                                       # a sparkle
        a = 230 - d * 50
        for (dx, dy) in ((d, 0), (-d, 0), (0, d), (0, -d)):
            fr.put(cx - 5 + dx, cy - 6 + dy, GOLD["w"], a)
    fr.put(cx - 5, cy - 6, (255, 255, 255))
    return fr


def rope():
    """the rope from the windlass high above: down the middle of the cell's column, out of the dark at the top (fading in),
    a knot, and its end coiled on the floor"""
    fr = Frame()
    cx = 73
    for y in range(0, 128):
        sway = round(math.sin(y / 23.0) * 0.6)
        x = cx + sway
        fade = min(255, 40 + y * 6)
        tw = (y // 2) % 3
        cols = [ROPE["d"], ROPE["m"], ROPE["l"]]
        fr.put(x - 2, y, ROPE["o"], fade)
        fr.put(x - 1, y, cols[(tw + 2) % 3], fade)
        fr.put(x, y, cols[(tw + 1) % 3] if tw != 1 else ROPE["h"], fade)
        fr.put(x + 1, y, cols[tw], fade)
        fr.put(x + 2, y, ROPE["o"], fade)
    for y in range(100, 107):                                  # the knot
        for x in range(cx - 4, cx + 5):
            if ellipse_in(x, y, cx, 103, 4.4, 3.6):
                c = ROPE["m"] if (x + y) % 3 else ROPE["l"]
                if y >= 105 or x >= cx + 3:
                    c = ROPE["d"]
                fr.put(x, y, c)
    # the coil: two loops on the floor
    for (ccx, ccy, rx, ry) in ((72, 134, 13, 6), (75, 132, 9, 4)):
        for a in range(0, 360, 2):
            t = math.radians(a)
            x = ccx + rx * math.cos(t)
            y = ccy + ry * math.sin(t)
            c = ROPE["l"] if math.sin(t) < -0.2 else ROPE["m"] if math.cos(t) < 0.3 else ROPE["d"]
            for d in (-1, 0, 1):
                fr.put(x + d * 0.0, y + d, c if d == 0 else ROPE["d"])
    outline(fr, ROPE["o"], thresh=200)
    # a shadow on the floor under the coil
    for y in range(136, 143):
        for x in range(56, 92):
            if ellipse_in(x, y, 73, 139, 17, 4) and fr.get(x, y)[3] == 0:
                fr.blend(x, y, (0, 0, 0), 70)
    return fr


def damp_moss(variant):
    """a wall decal for the face's 3 rows: dark damp streaks from the top down, moss in the joints low on the wall"""
    fr = Frame()
    for i in range(5 + variant):
        s = h32("dm", variant, i)
        sx = 52 + s % 40
        top = (s >> 8) % 50
        ln = 50 + (s >> 16) % 70
        for y in range(top, min(143, top + ln)):
            k = (y - top) / ln
            a = int(120 * math.sin(k * math.pi) ** 0.6)
            fr.blend(sx, y, (24, 28, 30), a)
            fr.blend(sx + 1, y, (24, 28, 30), a // 2 if (s >> 4) % 2 else a // 4)
            if h32("dr", sx, y) % 9 == 0:
                fr.blend(sx - 1, y, (24, 28, 30), a // 3)
    for (mx, my, n) in ((58 + variant * 9, 142, 18), (84 - variant * 7, 141, 12), (86 - variant * 7, 124, 9), (64 + variant * 5, 92 + variant * 10, 8),
                        (80, 60 + variant * 20, 7), (56, 40 + variant * 30, 6)):
        moss_patch(fr, mx, my, n, h32("mm", variant, mx, my))
    return fr


def stones():
    """a few fallen stones from the shaft's lining, piled against the wall"""
    fr = Frame()
    for (sx, sy, rx, ry) in ((62, 134, 10, 7), (80, 136, 8, 6), (70, 124, 8, 6), (88, 128, 5, 4), (54, 138, 5, 4)):
        for y in range(sy - ry, sy + ry + 1):
            for x in range(sx - rx, sx + rx + 1):
                if ellipse_in(x, y, sx, sy, rx + 0.3, ry + 0.3):
                    t = (y - (sy - ry)) / (2 * ry)
                    c = ST["hi"] if t < 0.25 else ST["lt"] if t < 0.55 else ST["md"] if t < 0.85 else ST["dk"]
                    if x > sx + rx * 0.6:
                        c = ST["dk"]
                    fr.put(x, y, c)
    outline(fr)
    moss_patch(fr, 64, 128, 6, 11)
    for y in range(138, 144):
        for x in range(46, 98):
            if fr.get(x, y)[3] == 0 and ellipse_in(x, y, 72, 141, 26, 4):
                fr.blend(x, y, (0, 0, 0), 60)
    return fr


def moss_floor():
    fr = Frame()
    for (mx, my, n) in ((60, 140, 12), (76, 132, 9), (88, 142, 7)):
        moss_patch(fr, mx, my, n, h32("mf", mx))
    return fr


def old_bucket():
    """an old wooden bucket lying on its side - dropped down the well long ago, its handle bent"""
    fr = Frame()
    cx, cy = 70, 128
    for y in range(cy - 11, cy + 12):
        for x in range(cx - 14, cx + 15):
            # the barrel of the bucket seen from the side, lying (an ellipse at the mouth on the right)
            if abs(y - cy) <= 10 - abs(x - cx) * 0 and cx - 14 <= x <= cx + 8 and abs(y - cy) <= 9 + (x - (cx - 14)) // 8:
                stave = (y - cy + 20) // 4
                c = [WOOD["m"], WOOD["l"], WOOD["m"], WOOD["d"]][stave % 4]
                if (x - cx) in (-10, 2):
                    c = IRON["d"]                                     # the hoops
                fr.put(x, y, c)
    for y in range(cy - 12, cy + 13):                                 # the mouth (dark inside)
        for x in range(cx + 6, cx + 16):
            if ellipse_in(x, y, cx + 10, cy, 5, 11.5):
                fr.put(x, y, WOOD["l"] if not ellipse_in(x, y, cx + 10, cy, 3.5, 9.5) else (30, 24, 24))
    outline(fr, WOOD["o"])
    for i in range(14):                                               # the bent handle
        fr.put(cx - 2 + i, cy - 12 - int(4 * math.sin(i / 13 * math.pi)), IRON["m"])
    for y in range(cy + 9, cy + 15):
        for x in range(cx - 18, cx + 18):
            if fr.get(x, y)[3] == 0 and ellipse_in(x, y, cx, cy + 12, 18, 3):
                fr.blend(x, y, (0, 0, 0), 60)
    return fr


# ================================================================================================ index 1: the knights' garden
def open_slab():
    """the slab in the garden's path lifted and pushed back onto the mound: a square stairwell framed in dressed stone, the
    steps going down northward into the dark; the slab (with the order's raven) lies tilted behind it"""
    fr = Frame()
    x0, x1, y0, y1 = 52, 91, 103, 141          # the opening's frame (the event's cell)
    # the frame of dressed stone
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            border = min(x - x0, x1 - x, y - y0, y1 - y)
            if border < 4:
                c = CUT["lt"] if border >= 1 else CUT["md"]
                if y - y0 < 4 and border == y - y0:
                    c = CUT["hi"]
                if y1 - y < 4:
                    c = CUT["md"] if border >= 1 else CUT["dk"]
                if (x - x0) % 13 == 0 and border >= 1:
                    c = CUT["edge"]
                fr.put(x, y, c)
            else:
                # the steps: treads of stone, darker the deeper (up the picture), each with a lit nose and a dark riser
                d = (y1 - 4 - y)                        # 0 at the nearest (lowest on screen) step
                step = d // 7
                fy = d % 7
                shade = max(0.0, 1.0 - step * 0.24)
                base = CUT["md"] if fy >= 2 else (CUT["hi"] if fy == 1 else CUT["edge"])
                if fy >= 5:
                    base = CUT["dk"]
                c = tuple(int(VOID[i] + (base[i] - VOID[i]) * shade) for i in range(3))
                # the side walls of the stairwell in shade
                if x - x0 < 7:
                    c = tuple(int(v * 0.7) for v in c)
                if x1 - x < 6:
                    c = tuple(int(v * 0.82) for v in c)
                fr.put(x, y, c)
    for x in range(x0 - 1, x1 + 2):
        fr.put(x, y0 - 1, OUT); fr.put(x, y1 + 1, OUT)
    for y in range(y0, y1 + 1):
        fr.put(x0 - 1, y, OUT); fr.put(x1 + 1, y, OUT)
    # the slab, lifted and set down behind (north), leaning: a thick stone plate seen from above, front edge visible
    sx0, sx1, sy0, sy1 = 50, 94, 70, 96
    for y in range(sy0, sy1 + 1):
        tilt = (y - sy0) // 9
        for x in range(sx0 + tilt, sx1 - tilt + 1):
            c = CUT["lt"]
            if y >= sy1 - 4:
                c = CUT["dk"] if y > sy1 - 2 else CUT["md"]        # its thickness (front edge)
            elif x <= sx0 + tilt + 1 or y <= sy0 + 1:
                c = CUT["hi"]
            elif x >= sx1 - tilt - 1:
                c = CUT["md"]
            if y < sy1 - 4 and h32("sl", x // 3, y // 3) % 9 == 0:
                c = CUT["md"]
            fr.put(x, y, c)
    # the raven cut in the slab (the same bird as on the keystone in the well)
    raven = ["......####......",
             "....######......",
             "..#########.....",
             "#####.#######...",
             "....##########..",
             ".....#########..",
             "......########..",
             ".......#######..",
             "........####.##.",
             ".........#.#..##"]
    for j, row in enumerate(raven):
        for i, ch in enumerate(row):
            if ch == "#":
                fr.put(64 + i, 73 + j, (74, 70, 72))
    for (mx, my, n) in ((54, 92, 6), (90, 88, 5)):
        moss_patch(fr, mx, my, n, h32("ms", mx))
    outline(fr, OUT, thresh=200)
    # the slab's shadow on the ground in front of it is the stairwell's frame; a soft shadow at its right side
    for y in range(sy0 + 4, sy1 + 4):
        for x in range(sx1 + 1, sx1 + 6):
            if fr.get(x, y)[3] == 0:
                fr.blend(x, y, (0, 0, 0), 60)
    return fr


# ================================================================================================ index 2: the orangery
def pump():
    """a cast-iron hand pump on a round stone hatch: the hatch's rim, its face with a raven cut in a ring of seven notches;
    the pump stands on its back half - square foot, fluted barrel, the spout to the right, the long handle up to the left"""
    fr = Frame()
    hx, hy, hrx, hry = 72, 128, 21, 13
    # the hatch: a thick round stone lid, slightly raised
    for y in range(hy - hry - 1, hy + hry + 5):
        for x in range(hx - hrx - 1, hx + hrx + 2):
            top = ellipse_in(x, y, hx, hy, hrx, hry)
            side = ellipse_in(x, y - 4, hx, hy, hrx, hry) and not top
            if top:
                r = ((x - hx) / hrx) ** 2 + ((y - hy) / hry) ** 2
                c = CUT["lt"] if r < 0.62 else CUT["hi"] if (y < hy and x < hx) else CUT["md"]
                if 0.62 <= r < 0.72:
                    c = CUT["edge"]                          # the groove round the face
                fr.put(x, y, c)
            elif side:
                fr.put(x, y, CUT["dk"] if y > hy + hry - 1 else CUT["md"])
    # the raven on the hatch's face (front half), small
    raven = ["...###....",
             ".######...",
             "####.####.",
             "...#######",
             "....######",
             ".....####.",
             "......#.##"]
    for j, row in enumerate(raven):
        for i, ch in enumerate(row):
            if ch == "#":
                fr.put(hx - 5 + i, hy + 1 + j, (70, 66, 68))
    for k in range(7):                                       # seven notches round the rim
        a = math.radians(200 + k * 20)
        fr.put(hx + round((hrx - 3) * math.cos(a)), hy + round((hry - 2) * math.sin(a)) + 6, CUT["edge"])
    # the pump: foot plate, barrel, cap, spout, handle
    px = hx + 1
    for y in range(hy - 8, hy - 2):                          # the foot
        for x in range(px - 7, px + 8):
            fr.put(x, y, GREEN_IRON["m"] if y > hy - 7 else GREEN_IRON["l"])
    for y in range(hy - 52, hy - 7):                         # the barrel
        for x in range(px - 5, px + 6):
            dx = x - px
            c = GREEN_IRON["l"] if dx in (-3, -2) else GREEN_IRON["h"] if dx == -4 and y % 6 else GREEN_IRON["m"] if dx < 2 else GREEN_IRON["d"]
            if (y - (hy - 52)) in (6, 7, 30, 31):
                c = GREEN_IRON["h"] if dx < 0 else GREEN_IRON["l"]   # the bands
            fr.put(x, y, c)
    for y in range(hy - 57, hy - 51):                        # the cap
        for x in range(px - 7, px + 8):
            fr.put(x, y, GREEN_IRON["l"] if y < hy - 54 else GREEN_IRON["m"])
    for i in range(3):
        fr.put(px - 1 + i, hy - 59, GREEN_IRON["m"]); fr.put(px, hy - 60, GREEN_IRON["l"])
    for i in range(14):                                      # the spout, down to the right
        sx = px + 6 + i
        sy = hy - 38 + (i * i) // 28
        for d in range(-2, 3):
            fr.put(sx, sy + d, GREEN_IRON["l"] if d < 0 else GREEN_IRON["m"] if d < 2 else GREEN_IRON["d"])
    fr.put(px + 19, hy - 30, GREEN_IRON["d"]); fr.put(px + 20, hy - 30, GREEN_IRON["o"])
    for i in range(30):                                      # the handle: from the cap up and out to the left
        t = i / 29.0
        lx = px - 4 - int(26 * t)
        ly = hy - 56 - int(18 * math.sin(t * 1.9))
        for d in (0, 1):
            fr.put(lx, ly + d, GREEN_IRON["l"] if d == 0 else GREEN_IRON["d"])
    for y in range(hy - 66, hy - 60):                        # its grip
        fr.put(px - 31, y, WOOD["l"]); fr.put(px - 30, y, WOOD["m"])
    outline(fr, OUT, thresh=200)
    # a few wet drops and a dark wet patch under the spout on the hatch
    for (x, y) in ((px + 21, hy - 24), (px + 21, hy - 17)):
        fr.put(x, y, WATER["l"])
    for y in range(hy - 6, hy + 2):
        for x in range(px + 14, px + 26):
            if ellipse_in(x, y, px + 20, hy - 2, 6, 3) and fr.get(x, y)[3] > 0:
                fr.blend(x, y, (40, 46, 56), 90)
    for y in range(hy + hry, hy + hry + 7):
        for x in range(hx - hrx - 4, hx + hrx + 5):
            if fr.get(x, y)[3] == 0 and ellipse_in(x, y, hx, hy + hry + 3, hrx + 4, 4):
                fr.blend(x, y, (0, 0, 0), 60)
    fr.im = fr.im.transpose(Image.FLIP_LEFT_RIGHT)            # (drawn spout-east; on the map its spout faces the back gate)
    fr.px = fr.im.load()
    return fr


def load_rgba(p):
    return Image.open(p).convert("RGBA")


def orange_tree():
    """a potted orange tree: the crown of the author's small leafy tree (Fantasy_Outside_D_green (7,5..6)) clipped round,
    with oranges among the leaves, in a green-painted wooden planter box with light corner posts and little ball finials"""
    crown = load_rgba(EXT_D).crop((336, 256, 384, 304))
    fr = Frame()
    fr.paste(crown, 48, 74)
    # oranges: on leaf pixels away from the crown's edge
    spots, k = [], 0
    while len(spots) < 13 and k < 4000:
        k += 1
        hv = h32("orange", k)
        x, y = 52 + hv % 40, 78 + (hv >> 8) % 36
        if any(abs(x - a) < 6 and abs(y - b) < 5 for (a, b) in spots):
            continue
        if all(fr.get(x + dx, y + dy)[3] >= 200 for dx in (-2, 0, 3) for dy in (-2, 0, 3)):
            spots.append((x, y))
    for (x, y) in spots:
        fr.put(x, y, (238, 150, 40)); fr.put(x + 1, y, (250, 186, 70)); fr.put(x, y + 1, (206, 112, 26)); fr.put(x + 1, y + 1, (228, 132, 34))
        fr.put(x - 1, y + 1, (120, 60, 20)); fr.put(x + 2, y + 1, (150, 74, 24)); fr.put(x, y + 2, (120, 60, 20)); fr.put(x + 1, y + 2, (120, 60, 20))
    # the trunk between the crown and the box
    for y in range(118, 126):
        fr.put(71, y, WOOD["l"]); fr.put(72, y, WOOD["m"]); fr.put(73, y, WOOD["d"])
    # the planter box
    GB = {"o": (30, 44, 38), "d": (40, 66, 52), "m": (54, 86, 66), "l": (70, 106, 80)}
    bx0, bx1, by0, by1 = 58, 86, 124, 142
    for y in range(by0, by1 + 1):
        for x in range(bx0, bx1 + 1):
            c = GB["m"] if (x - bx0) % 5 else GB["d"]
            if y == by0:
                c = (60, 46, 40)                                           # the soil at the top
            elif y == by0 + 1:
                c = GB["l"]
            if x - bx0 < 3 or bx1 - x < 3:
                c = PAINT["m"] if x - bx0 < 3 else PAINT["d"]              # the corner posts
                if x - bx0 == 0:
                    c = PAINT["l"]
            if y >= by1 - 1 and not (x - bx0 < 3 or bx1 - x < 3):
                c = GB["d"]
            fr.put(x, y, c)
    for (x, y) in ((bx0 + 1, by0 - 2), (bx1 - 1, by0 - 2)):              # finials
        fr.put(x - 1, y, PAINT["m"]); fr.put(x, y, PAINT["l"]); fr.put(x + 1, y, PAINT["d"])
        fr.put(x - 1, y + 1, PAINT["d"]); fr.put(x, y + 1, PAINT["m"]); fr.put(x + 1, y + 1, PAINT["d"])
    outline(fr, OUT, thresh=200)
    for y in range(140, 144):
        for x in range(54, 92):
            if fr.get(x, y)[3] == 0 and ellipse_in(x, y, 73, 142, 18, 3):
                fr.blend(x, y, (0, 0, 0), 60)
    return fr


def gardener_table():
    """the author's table (Fantasy_Outside_C (10..11,2..3)) with a drawer in its front and the gardener's things on top:
    flower pots, a trowel, a bundle of raffia"""
    t = load_rgba(EXT_C).crop((576, 96, 672, 192))         # the 2-cell table (its top and legs)
    fr = Frame()
    fr.paste(t, 48, 48)
    # the drawer: in the apron under the top, left half
    bb = t.getbbox()
    top_y = 48 + bb[1]
    # find the apron: the lowest row of the top boards (scan the middle column)
    ap_y = None
    for y in range(48 + bb[3] - 1, 48 + bb[1], -1):
        r, g, b, a = fr.get(96, y)
        if a > 0 and (r + g + b) > 230:
            ap_y = y; break
    dx0, dx1, dy0, dy1 = 64, 92, 121, 130
    for y in range(dy0, dy1 + 1):
        for x in range(dx0, dx1 + 1):
            c = WOOD["m"]
            if y == dy0:
                c = WOOD["h"]
            elif y == dy1:
                c = WOOD["d"]
            if x in (dx0, dx1):
                c = WOOD["o"]
            if y in (dy0 + 2, dy1 - 1) and dx0 + 2 <= x <= dx1 - 2:
                c = WOOD["d"]                                                    # the drawer front's recess
            fr.put(x, y, c)
    for x in range(dx0, dx1 + 1):
        fr.put(x, dy1 + 1, OUT)
    kx, ky = (dx0 + dx1) // 2, (dy0 + dy1) // 2
    fr.put(kx, ky, GOLD["l"]); fr.put(kx + 1, ky, GOLD["m"]); fr.put(kx, ky + 1, GOLD["m"]); fr.put(kx + 1, ky + 1, GOLD["d"])
    # things on the top: two clay pots with seedlings, a trowel, a raffia bundle
    for (cx, cy) in ((68, 98), (80, 101)):
        for y in range(cy, cy + 9):
            w = 5 - (y - cy) // 3
            for x in range(cx - w, cx + w + 1):
                c = (176, 96, 60) if x < cx else (150, 78, 50)
                if y == cy:
                    c = (196, 120, 76)
                fr.put(x, y, c)
            fr.put(cx - w - 1, y, OUT); fr.put(cx + w + 1, y, OUT)
        for x in range(cx - 5, cx + 6):
            fr.put(x, cy - 1, OUT)
        for (dx, dy) in ((-2, -3), (-1, -4), (0, -5), (1, -4), (2, -3), (0, -3), (-1, -2), (1, -2)):
            fr.put(cx + dx, cy + dy, MOSS["l"] if dy < -3 else MOSS["m"])
    for i in range(10):                                      # the trowel
        fr.put(100 + i, 104 + i // 4, WOOD["l"] if i < 5 else IRON["h"])
        fr.put(100 + i, 105 + i // 4, WOOD["d"] if i < 5 else IRON["d"])
    for y in range(96, 104):                                 # raffia bundle
        for x in range(116, 124):
            if ellipse_in(x, y, 120, 100, 4, 3.5):
                fr.put(x, y, (196, 176, 112) if (x + y) % 3 else (168, 146, 90))
    return fr


def back_gate(open_):
    """the little back gate in the west hedge. The hedge runs north-south, so (the straight-on view) its gate is seen edge-on:
    two stone gate posts with overhanging caps at the north and south ends of the gap, between them the oak leaf from above -
    a strip of planks with its iron straps and latch; open, the leaf has swung into the garden (east) and shows its face
    against the north post"""
    fr = Frame()
    def post(cx, foot, face_h):
        top = foot - face_h
        for y in range(top, foot + 1):                       # the front face
            for x in range(cx - 8, cx + 8):
                c = CUT["md"]
                if x <= cx - 7:
                    c = CUT["lt"]
                elif x >= cx + 5:
                    c = CUT["dk"]
                if (y - top) % 7 == 6:
                    c = CUT["edge"]                              # the courses
                fr.put(x, y, c)
        for y in range(top - 8, top):                        # the cap: its top seen from above, overhanging
            for x in range(cx - 10, cx + 10):
                c = CUT["hi"] if y < top - 5 else CUT["lt"]
                if x >= cx + 7:
                    c = CUT["md"]
                if y == top - 1:
                    c = CUT["dk"]
                fr.put(x, y, c)
        for (x, y) in ((cx - 1, top - 10), (cx, top - 10), (cx - 2, top - 9), (cx - 1, top - 9), (cx, top - 9), (cx + 1, top - 9)):
            fr.put(x, y, CUT["hi"] if y == top - 10 else CUT["md"])   # a little knob on the cap
    post(72, 104, 12)                                         # the north post (up in the hedge's last cell)
    if not open_:
        for y in range(98, 132):                              # the leaf from above: planks along the hedge
            for x in range(67, 78):
                c = WOOD["m"] if (x - 67) % 3 else WOOD["d"]
                if x == 67:
                    c = WOOD["h"]
                elif x == 77:
                    c = WOOD["d"]
                if y in (105, 106, 122, 123):
                    c = IRON["h"] if x < 70 else IRON["m"] if x < 76 else IRON["d"]
                fr.put(x, y, c)
        for y in range(111, 118):                             # the latch and its ring on the garden side
            fr.put(78, y, IRON["d"])
        for (x, y) in ((79, 113), (80, 114), (79, 115)):
            fr.put(x, y, IRON["h"])
    else:
        lx0, lx1, ly0, ly1 = 80, 106, 82, 116                 # the leaf's face, swung east (into the garden)
        for y in range(ly0, ly1 + 1):
            for x in range(lx0, lx1 + 1):
                c = WOOD["m"] if (x - lx0) % 6 else WOOD["d"]
                if (x - lx0) % 6 == 1:
                    c = WOOD["l"]
                if y in (ly0 + 6, ly0 + 7, ly1 - 7, ly1 - 6):
                    c = IRON["m"] if y % 2 else IRON["h"]
                if y == ly0:
                    c = WOOD["h"]
                fr.put(x, y, c)
        for (x, y) in ((lx1 - 4, 99), (lx1 - 3, 100), (lx1 - 4, 101)):
            fr.put(x, y, IRON["h"])
        for y in range(ly1 + 1, ly1 + 5):                      # its shadow on the ground
            for x in range(lx0 + 2, lx1 + 3):
                fr.blend(x, y, (0, 0, 0), 55)
    post(72, 143, 13)                                         # the south post
    outline(fr, OUT, thresh=200)
    return fr


def orangery_door():
    """the orangery's garden door (1 x 2 cells), made like its windows: the same arched stone frame (the author's window,
    Fantasy_Outside_B (4,4..5)) carried down to the ground, the leaded fanlight in the arch, two oak leaves with small leaded
    panes (the orange trees behind) over panelled bottoms, brass handles, a stone step"""
    win = orangery_window(False).im.crop((48, 48, 96, 144))
    px = win.load()
    stone = [px[x, 40] for x in range(48)]                    # the frame's columns (as at the window's middle)
    for y in range(25, 96):
        for x in range(2, 46):
            if x < 7 or x > 40:
                px[x, y] = stone[x] if stone[x][3] else (0, 0, 0, 0)
                continue
            leaf = 0 if x < 24 else 1
            fx = x - (7 if leaf == 0 else 24)                # 0..16 across the leaf
            c = WOOD["m"] if fx % 4 else WOOD["d"]
            if fx == 0:
                c = WOOD["l"]
            if fx == 16 or x == 23:
                c = WOOD["o"]
            if 29 <= y <= 48 and 3 <= fx <= 13:              # the small glazed panes with the leading
                if fx in (3, 13) or y in (29, 48):
                    c = WOOD["d"]
                elif fx == 8 or y in (35, 42):
                    c = (40, 44, 48)
                else:
                    hv = h32("dg", x, y) % 6
                    c = (46, 84, 54) if hv < 3 else (60, 102, 62) if hv < 5 else (214, 128, 38)
                    if (x + y) % 11 == 0:
                        c = (150, 168, 172)
            elif 53 <= y <= 88 and 3 <= fx <= 13:            # the panel
                if fx == 3 or y == 53:
                    c = WOOD["d"]
                elif fx == 13 or y == 88:
                    c = WOOD["h"]
                elif y in (70, 71):
                    c = WOOD["d"] if y == 70 else WOOD["h"]
            if y == 25:
                c = WOOD["d"]
            px[x, y] = c + (255,)
    for (x, y) in ((21, 58), (26, 58)):
        px[x, y] = GOLD["l"] + (255,); px[x, y + 1] = GOLD["m"] + (255,); px[x, y + 2] = GOLD["d"] + (255,)
    fr = Frame()
    fr.paste(win, 48, 48)
    for y in range(139, 144):                                 # the step
        for x in range(51, 93):
            fr.put(x, y, CUT["hi"] if y == 139 else CUT["md"] if y < 143 else CUT["dk"])
    for x in range(50, 94):
        fr.put(x, 138, OUT)
    # the little lantern by the door: an iron bracket out of the frame's right side, the lantern hanging from it (lit at night:
    # the event's <Light>)
    for x in range(86, 95):
        fr.put(x, 70, IRON["d"]); fr.put(x, 69, IRON["h"] if x < 92 else IRON["m"])
    fr.put(93, 71, IRON["d"]); fr.put(93, 72, IRON["d"])
    for y in range(73, 86):
        for x in range(89, 98):
            edge = x in (89, 97) or y in (73, 85)
            c = IRON["o"] if edge else (250, 214, 130) if 4 < (y - 73) < 11 and 91 <= x <= 95 else IRON["m"]
            if y == 74 and not edge:
                c = IRON["h"]
            fr.put(x, y, c)
    fr.put(93, 78, (255, 246, 210)); fr.put(92, 79, (255, 236, 180))
    return fr


def orangery_window(mirror):
    """the author's arched window (Fantasy_Outside_B (4,4..5), the dark leaded one) with an orange tree in a tub behind the
    panes and the sky caught in the glass - one on each wall cell of the orangery's front"""
    w = load_rgba(EXT_B).crop((192, 192, 240, 288))
    px = w.load()
    W, H = w.size
    for y in range(H):
        for x in range(W):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            dark = r < 60 and g < 60 and b < 80
            if not dark:
                continue
            lead = (r + g + b) < 70 or b > r + 25            # the leading lines stay
            # the tree's crown fills the upper panes, its tub the bottom
            cx, cy = 24, 40
            in_crown = ((x - cx) / 15.0) ** 2 + ((y - cy) / 17.0) ** 2 <= 1
            if in_crown:
                s = h32("leaf", x // 2, y // 2) % 7
                c = (46, 84, 54) if s < 3 else (60, 102, 62) if s < 5 else (36, 66, 46)
                if s == 6 and y < cy + 8:
                    c = (214, 128, 38)                       # oranges
            elif y > 66:
                c = (98, 72, 54) if y > 74 else (60, 50, 46)                 # the tub, the floor inside
                if 18 <= x <= 30 and 62 <= y <= 74:
                    c = (110, 82, 60)
            else:
                c = (40, 52, 58)
            if (x + y) % 19 < 2 or (x - y) % 23 == 0:
                c = tuple(min(255, int(v * 0.5 + 150 * 0.5)) for v in c)    # a reflection of the sky
            if lead and not in_crown:
                c = (r, g, b)
            elif lead:
                c = tuple(max(0, v - 18) for v in c)
            px[x, y] = c + (a,)
    if mirror:
        w = w.transpose(Image.FLIP_LEFT_RIGHT)
    fr = Frame()
    fr.paste(w, 48, 48)
    return fr


# ================================================================================================ the sheet
PIECES = [
    ((0, 2, 0), canal_arch), ((0, 2, 1), puddle), ((0, 2, 2), ring_glint),
    ((0, 4, 0), rope), ((0, 4, 1), lambda: damp_moss(0)), ((0, 4, 2), lambda: damp_moss(1)),
    ((0, 6, 0), stones), ((0, 6, 1), moss_floor), ((0, 6, 2), old_bucket),
    ((1, 2, 0), open_slab),
    ((2, 2, 0), pump), ((2, 2, 1), gardener_table), ((2, 2, 2), orange_tree),
    ((2, 4, 0), lambda: back_gate(False)), ((2, 4, 1), lambda: back_gate(True)), ((2, 4, 2), orangery_door),
    ((2, 6, 0), lambda: orangery_window(False)), ((2, 6, 1), lambda: orangery_window(True)),
]


def frame_xy(idx, d, p):
    return (((idx % 4) * 3 + p) * F, ((idx // 4) * 4 + (d // 2 - 1)) * F)


def build():
    sheet = Image.new("RGBA", (12 * F, 8 * F), (0, 0, 0, 0))
    for (idx, d, p), fn in PIECES:
        fr = fn()
        sheet.alpha_composite(fr.im, frame_xy(idx, d, p))
    return sheet


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--preview", help="a 3x picture of the frames into this folder (the sheet is still written)")
    a = ap.parse_args()
    sheet = build()
    sheet.save(OUT_PATH)
    print("written", OUT_PATH, sheet.size)
    if not os.path.exists(ALTAR_DST) or open(ALTAR_DST, "rb").read() != open(ALTAR_SRC, "rb").read():
        shutil.copy2(ALTAR_SRC, ALTAR_DST)
        print("copied", ALTAR_DST)
    if a.preview:
        os.makedirs(a.preview, exist_ok=True)
        used = sheet.crop((0, 0, 9 * F, 4 * F))
        bg = Image.new("RGBA", used.size, (120, 140, 120, 255))
        bg.alpha_composite(used)
        bg.resize((used.width * 2, used.height * 2), Image.NEAREST).save(os.path.join(a.preview, "quest_places_sheet.png"))


if __name__ == "__main__":
    main()
