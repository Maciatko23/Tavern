# The six new crop rows of img/system/Farm_Crops.png (rows 4-9: len, owies, buraki, cebula, czosnek, groch), 4 growth stages each,
# 48x48 cells, drawn in the palette and the outline style of the four old rows (a dark-green 1 px outline round every leaf/stem,
# the same soil mound). Rows 0-3 are copied byte for byte.
#   python uprawy_rysuj.py [--install]   (without --install: only the preview)
import math, os, sys, shutil, time
from PIL import Image

ROOT = "c:/Users/macie/OneDrive/Dokumenty/RMMZ/Tawerna"
SRC = ROOT + "/img/system/Farm_Crops.png"
S = os.path.dirname(os.path.abspath(__file__))
T = 48

A = (29, 58, 38, 255)                       # the outline
G_DARK, G_MID, G_LIGHT, G_HI, G_PALE = (47, 122, 62, 255), (74, 160, 79, 255), (124, 199, 106, 255), (191, 229, 154, 255), (143, 196, 108, 255)
SOIL_TOP, SOIL, SOIL_DARK = (140, 96, 57, 255), (111, 74, 45, 255), (78, 51, 32, 255)
GOLD_HI, GOLD, GOLD_DARK, OLIVE = (246, 220, 130, 255), (224, 184, 67, 255), (168, 122, 38, 255), (138, 168, 81, 255)
WHITE = (244, 242, 232, 255)

class Cell:
    def __init__(self):
        self.im = Image.new("RGBA", (T, T), (0, 0, 0, 0)); self.p = self.im.load()
    def put(self, x, y, c):
        if 0 <= x < T and 0 <= y < T: self.p[x, y] = c
    def shape(self, pix, outline=True, out_col=A):
        """pix: {(x, y): colour}. Its own 1 px outline first (over what is below), then the fill"""
        if outline:
            for (x, y) in pix:
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    q = (x + dx, y + dy)
                    if q not in pix: self.put(q[0], q[1], out_col)
        for (x, y), c in pix.items(): self.put(x, y, c)

MOUND = ["aaakkkkkkkkkaaa",            # the old rows' mound (Farm_Crops row 1 col 0, rows 38-45), centred on x 24
         "akkkkkkkkkkkkkkka",
         "addddddddddddddddda",
         "addddddddddddddddddda",
         "addddddddddddddddda",
         "ahhhhhhhhhhhhhhha",
         "aaahhhhhhhhhaaa",
         "aaaaaaaaa"]
def mound(c):
    for j, row in enumerate(MOUND):
        x0 = 25 - (len(row) + 1) // 2
        for i, ch in enumerate(row):
            c.put(x0 + i, 38 + j, {"a": A, "k": SOIL_TOP, "d": SOIL, "h": SOIL_DARK}[ch])

def line_pts(x0, y0, x1, y1):
    n = max(abs(x1 - x0), abs(y1 - y0), 1)
    return [(round(x0 + (x1 - x0) * t / n), round(y0 + (y1 - y0) * t / n)) for t in range(n + 1)]
def curve_pts(x0, y0, x1, y1, bend):
    """a quadratic curve from the foot (x0, y0) to the tip; bend: how far the middle bows sideways"""
    mx, my = (x0 + x1) / 2 + bend, (y0 + y1) / 2
    n = max(abs(x1 - x0), abs(y1 - y0), 2) * 2
    pts = []
    for k in range(n + 1):
        t = k / n
        x = (1 - t) ** 2 * x0 + 2 * (1 - t) * t * mx + t * t * x1
        y = (1 - t) ** 2 * y0 + 2 * (1 - t) * t * my + t * t * y1
        q = (round(x), round(y))
        if not pts or pts[-1] != q: pts.append(q)
    return pts
def bez_pts(p0, p1, p2):
    """a quadratic Bezier through the control point p1"""
    n = int(max(abs(p2[0] - p0[0]), abs(p2[1] - p0[1]), abs(p1[0] - p0[0]), abs(p1[1] - p0[1]), 2)) * 3
    pts = []
    for k in range(n + 1):
        t = k / n
        x = (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0]
        y = (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1]
        q = (round(x), round(y))
        if not pts or pts[-1] != q: pts.append(q)
    return pts
def stem(c, pts, col, width=1, hi=None, dark=None):
    """a stem or a blade along pts: 1 or 2 px; a 2 px one has a lighter left / darker right edge"""
    pix = {}
    for i, (x, y) in enumerate(pts):
        pix[(x, y)] = hi if (hi and width == 1 and i > len(pts) * 0.5 and i % 2) else col
        if width == 2:
            pix[(x, y)] = hi or col
            pix[(x + 1, y)] = dark or col
    c.shape(pix)
def ellipse(c, cx, cy, rx, ry, col, hi=None, dark=None, angle=0.0, outline=True):
    pix = {}
    ca, sa = math.cos(angle), math.sin(angle)
    for y in range(int(cy - max(rx, ry)) - 1, int(cy + max(rx, ry)) + 2):
        for x in range(int(cx - max(rx, ry)) - 1, int(cx + max(rx, ry)) + 2):
            dx, dy = x - cx, y - cy
            u, v = dx * ca + dy * sa, -dx * sa + dy * ca
            d = (u / rx) ** 2 + (v / ry) ** 2
            if d <= 1.0:
                colr = col
                if hi and v < -ry * 0.25 and u < rx * 0.4: colr = hi
                if dark and v > ry * 0.45: colr = dark
                pix[(x, y)] = colr
    c.shape(pix, outline)

def sprouts(c, xs, h, col=G_LIGHT):
    for x in xs: stem(c, line_pts(x, 37, x, 37 - h), col)

# ------------------------------------------------------------------ len (flax): thin straight stems, blue flowers when ripe
FLAX_B, FLAX, FLAX_D, FLAX_HI = (58, 88, 176, 255), (96, 140, 226, 255), (58, 86, 170, 255), (168, 198, 248, 255)
def flax(stage):
    c = Cell(); mound(c)
    if stage == 0: sprouts(c, (21, 24, 27), 2); return c
    n, h = [(5, 8), (7, 17), (7, 20)][stage - 1]
    feet = [17 + i * (14 / (n - 1)) for i in range(n)]
    tips = []
    for i, fx in enumerate(feet):
        lean = (fx - 24) * 0.45
        hh = h - (2 if i in (0, n - 1) else 0) - (1 if i % 2 else 0)
        x1, y1 = round(fx + lean), 38 - hh
        pts = curve_pts(round(fx), 38, x1, y1, 0.6 if i % 2 else -0.6)
        stem(c, pts, G_MID, hi=G_LIGHT)
        # tiny leaves along the stem, every 3rd pixel, to alternate sides
        for k, (x, y) in enumerate(pts[2:-2]):
            if k % 3 == 1: c.put(x + (1 if k % 2 else -1), y, G_LIGHT)
        tips.append((x1, y1))
    if stage == 3:
        for i, (x, y) in enumerate(tips):
            if i % 2:                               # a bud
                c.shape({(x, y - 1): FLAX_D, (x, y - 2): FLAX})
            else:                                    # an open five-petal flower, 5 px across
                y -= 2
                c.shape({(x - 1, y - 1): FLAX_HI, (x, y - 1): FLAX_HI, (x + 1, y - 1): FLAX, (x - 2, y): FLAX, (x - 1, y): FLAX,
                         (x + 1, y): FLAX, (x + 2, y): FLAX_D, (x - 1, y + 1): FLAX, (x, y + 1): FLAX_D, (x + 1, y + 1): FLAX_B,
                         (x, y - 2): FLAX_HI, (x, y + 2): FLAX_B, (x, y): (240, 214, 74, 255)})
    return c

# ------------------------------------------------------------------ owies (oats): grass, then golden stems with drooping spikelets
def oats(stage):
    c = Cell(); mound(c)
    if stage == 0: sprouts(c, (21, 24, 27), 3, G_MID); return c
    if stage in (1, 2):
        n, h = (6, 9) if stage == 1 else (8, 20)
        for i in range(n):
            fx = 16 + i * (17 / (n - 1)); lean = (fx - 24.5) * (0.5 if stage == 1 else 0.7)
            hh = h - (i % 3) * 2
            stem(c, curve_pts(round(fx), 39, round(fx + lean), 39 - hh, (1.5 if i % 2 else -1.5)), G_MID if i % 2 else G_DARK, hi=G_LIGHT)
        return c
    # ripe: golden stems; at the top a loose panicle of little spikelets hanging down on short branches
    tops = []
    for i in range(5):
        fx = 17 + i * 3.6
        top = 12 + (i % 3) * 3 + (2 if i in (0, 4) else 0)
        tipx = round(fx + (fx - 24.5) * 0.45)
        stem(c, curve_pts(round(fx), 40, tipx, top, -0.8 if i % 2 else 0.8), GOLD_DARK if i % 2 else GOLD, hi=GOLD_HI)
        tops.append((tipx, top))
    for i, (tx, ty) in enumerate(tops):
        for k, (dx, dy) in enumerate(((-2, 1), (2, 2), (-1, 5), (2, 6), (0, -1))):
            if k == 4: c.shape({(tx, ty - 1): GOLD_HI}); continue
            sx, sy = tx + dx, ty + dy
            c.put(tx + (1 if dx > 0 else -1), ty + dy - 1, GOLD)            # the little branch
            c.shape({(sx, sy): GOLD_HI, (sx, sy + 1): GOLD, (sx, sy + 2): GOLD_DARK})
    return c

# ------------------------------------------------------------------ buraki (beetroot): a rosette with red stems, the red beet top when ripe
BEET_D, BEET, BEET_HI, BEET_STEM = (92, 18, 44, 255), (138, 30, 64, 255), (186, 64, 100, 255), (196, 58, 84, 255)
def beet_leaf(c, fx, fy, tx, ty, rx, ry):
    ang = math.atan2(ty - fy, tx - fx)
    ellipse(c, tx, ty, rx, ry, G_MID, hi=G_LIGHT, dark=G_DARK, angle=ang)
    # the red vein down the middle of the leaf and the stem to the foot
    vein = line_pts(fx, fy, round(tx + math.cos(ang) * (rx - 1)), round(ty + math.sin(ang) * (rx - 1)))
    for (x, y) in vein: c.put(x, y, BEET_STEM)
def beet(stage):
    c = Cell(); mound(c)
    if stage == 0:
        c.shape({(23, 37): BEET_STEM, (22, 36): G_LIGHT, (21, 35): G_LIGHT, (25, 37): BEET_STEM, (26, 36): G_LIGHT, (27, 35): G_LIGHT})
        return c
    if stage == 3:   # the beet's top shows in the soil, under the leaves
        ellipse(c, 24.5, 37.5, 5.2, 3.6, BEET, hi=BEET_HI, dark=BEET_D)
    size = [None, 0.55, 0.85, 1.0][stage]
    leaves = [(-11, -9, 4.5, 2.4), (11, -9, 4.5, 2.4), (-6, -15, 4.8, 2.6), (6, -15, 4.8, 2.6), (0, -17, 5, 2.8), (-13, -3, 4, 2.2), (13, -3, 4, 2.2)]
    if stage == 1: leaves = leaves[:4]
    for (dx, dy, rx, ry) in leaves:
        beet_leaf(c, 24, 36, round(24 + dx * size), round(36 + dy * size), max(2.2, rx * size), max(1.5, ry * size))
    return c

# ------------------------------------------------------------------ cebula (onion): blue-green tubes, the bulb with bent tops when ripe
ON_D, ON, ON_HI = (56, 112, 84, 255), (98, 160, 120, 255), (150, 204, 160, 255)
BULB_D, BULB, BULB_HI = (150, 95, 45, 255), (204, 144, 72, 255), (236, 190, 118, 255)
def onion(stage):
    c = Cell(); mound(c)
    if stage == 0: sprouts(c, (22, 26), 4, ON); return c
    if stage in (1, 2):
        n, h = (4, 10) if stage == 1 else (6, 19)
        for i in range(n):
            fx = 20 + i * (9 / (n - 1)); lean = (fx - 24.5) * 1.1
            stem(c, curve_pts(round(fx), 38, round(fx + lean), 38 - h + (i % 2) * 3, 0.8 if i % 2 else -0.8), ON, hi=ON_HI)
        return c
    # ripe: the bulb sits half out of the soil; its tubes rise and flop over to the sides, the tips yellowing
    for k, (sx, peak, ex, ey) in enumerate(((-2, (-6, 16), -12, 26), (2, (6, 14), 13, 27), (-1, (-1, 12), -7, 20), (1, (3, 11), 6, 18), (0, (0, 15), 1, 15))):
        pts = bez_pts((24 + sx, 31), (24 + sx + peak[0], peak[1]), (24 + ex, ey))
        stem(c, pts, ON, width=2, hi=ON_HI, dark=ON_D)
        for (x, y) in pts[-3:]: c.put(x, y, GOLD); c.put(x + 1, y, GOLD_DARK)
    ellipse(c, 24.5, 35, 5.4, 4.6, BULB, hi=BULB_HI, dark=BULB_D)
    c.put(24, 30, BULB_D); c.put(25, 30, BULB_D)
    return c

# ------------------------------------------------------------------ czosnek (garlic): flat arching leaves, white bulb tops when ripe
GW, GW_D, GW_STREAK = (240, 236, 226, 255), (206, 198, 186, 255), (196, 160, 196, 255)
def garlic(stage):
    c = Cell(); mound(c)
    if stage == 0: sprouts(c, (22, 26), 4, G_MID); return c
    n, h = [(0, 0), (4, 10), (6, 18), (6, 18)][stage]
    for i in range(n):
        fx = 19 + i * (11 / (n - 1)); side = -1 if fx < 24.5 else 1
        tip = (round(fx + side * (4 + (i % 2) * 3)), 38 - h + (i % 3) * 2)
        pts = curve_pts(round(fx), 38, tip[0], tip[1], -side * 2)
        if stage == 3:
            col, hi = (OLIVE, GOLD_HI) if i % 2 else (G_MID, G_LIGHT)
        else:
            col, hi = G_MID, G_LIGHT
        stem(c, pts, col, width=2, hi=hi, dark=G_DARK if col == G_MID else GOLD_DARK)
        if stage == 3: c.put(tip[0], tip[1], GOLD)
    if stage == 3:
        for bx in (20.5, 28.5):
            ellipse(c, bx, 37.5, 3.6, 3.0, GW, hi=None, dark=GW_D)
            c.put(round(bx), 36, GW_STREAK); c.put(round(bx) + 1, 38, GW_STREAK)
            c.put(round(bx), 34, GW_D)
    return c

# ------------------------------------------------------------------ groch (pea): a vine up a stick, pods when ripe
STICK, STICK_HI = (124, 84, 48, 255), (170, 124, 76, 255)
POD, POD_HI, POD_D = (124, 199, 106, 255), (191, 229, 154, 255), (74, 160, 79, 255)
def pea(stage):
    c = Cell(); mound(c)
    if stage == 0:
        c.shape({(24, 37): G_MID, (24, 36): G_MID, (23, 35): G_LIGHT, (22, 35): G_LIGHT, (25, 35): G_LIGHT, (26, 35): G_LIGHT})
        return c
    top = [None, 27, 15, 13][stage]
    stem(c, line_pts(25, 39, 25, top), STICK, width=2, hi=STICK_HI, dark=STICK)
    # the vine winds up the stick: a green line from side to side
    vine = []
    for y in range(38, top + 3, -1):
        vine.append((24 + round(math.sin((38 - y) / 2.6) * 2.2) + (1 if math.sin((38 - y) / 2.6) > 0 else 0), y))
    stem(c, vine, G_MID, hi=G_LIGHT)
    # leaf pairs along the vine (round leaflets), more as it grows
    for k, (x, y) in enumerate(vine[2::4]):
        side = -1 if k % 2 else 1
        ellipse(c, x + side * 3, y, 2.2, 1.6, G_MID, hi=G_LIGHT, dark=G_DARK)
        if stage >= 2 and k % 3 == 1:   # a tendril curling out
            c.shape({(x - side * 2, y - 1): G_LIGHT, (x - side * 3, y - 2): G_LIGHT, (x - side * 3, y - 3): G_LIGHT})
    if stage == 2:
        for (x, y) in ((21, 22), (29, 28)):
            c.shape({(x, y): WHITE, (x + 1, y): WHITE, (x, y + 1): (220, 214, 232, 255)})
    if stage == 3:
        PALE = (214, 238, 164, 255)
        for (x, y) in ((17, 23), (29, 18), (29, 29), (16, 31)):
            pod = {}
            for k in range(7):
                w = 2 if k in (0, 6) else 3
                for j in range(w):
                    pod[(x + j + (1 if w == 2 and k == 6 else 0), y + k)] = PALE if j == 0 else (POD if j == 1 else POD_D)
                if k in (2, 4): pod[(x + 1, y + k)] = POD_HI      # the peas showing through
            c.shape(pod)
            c.put(x + 1, y - 1, G_DARK)
        c.shape({(22, 16): WHITE, (23, 16): WHITE, (22, 17): (220, 214, 232, 255)})
    return c

ROWS = [flax, oats, beet, onion, garlic, pea]
NAMES = ["len", "owies", "buraki", "cebula", "czosnek", "groch"]

def build():
    old = Image.open(SRC).convert("RGBA")
    assert old.size in ((192, 192), (192, 480)), old.size
    out = Image.new("RGBA", (192, 480), (0, 0, 0, 0))
    out.paste(old.crop((0, 0, 192, 192)), (0, 0))
    for r, fn in enumerate(ROWS):
        for s in range(4):
            out.paste(fn(s).im, (s * T, (4 + r) * T))
    return out

if __name__ == "__main__":
    out = build()
    bg = Image.new("RGBA", out.size, (70, 110, 60, 255)); bg.alpha_composite(out)
    bg.resize((out.width * 3, out.height * 3), Image.NEAREST).save(os.path.join(S, "uprawy_podglad.png"))
    if "--install" in sys.argv:
        arch = os.path.normpath(ROOT + "/../Tawerna_archiwum_2026-11-08/uprawy")
        os.makedirs(arch, exist_ok=True)
        old = Image.open(SRC)
        if old.size == (192, 192):
            shutil.copyfile(SRC, os.path.join(arch, "Farm_Crops_przed_%s.png" % time.strftime("%Y%m%d_%H%M%S")))
        # rows 0-3 byte-identical: the pixels compared before writing
        assert list(out.crop((0, 0, 192, 192)).getdata()) == list(old.convert("RGBA").crop((0, 0, 192, 192)).getdata())
        out.save(SRC)
        print("zapisano", SRC, out.size)
