# python tools/town/west_gate_art.py [--preview DIR]
# The wooden gate of the town's west gate (Map008 x 0-1, rows 50-51 <-> Podgrodzie Map111 x 44-45, rows 17-18; user 2026-10-05:
# "brama ... jak prawdziwa brama miejska"), drawn by hand in code (no AI picture): img/characters/!$West_Gate.png.
#
# What it is: a roofed timber gate over the gap between the round tower (north) and the wall (south), the RPG Maker way - the front
# flat (two oak posts and the gable's barge boards facing the camera), the roof from above (shingles of the town's houses, ridge
# along the wall, a little finial on the gable); the gable is open, so through it one sees the shaded foot of the tower and the
# north leaf of the heavy double gate, opened into the town and folded back against the tower (oak planks of the author's
# !$Gate_Wood1, black iron straps with rivets, an iron ring). The south leaf lies against the south side of the passage, which
# the 3/4 view does not show (drawn, it would stand in front of the passage and hide everyone walking through) - only its iron
# pintle shows at the left post. The passage under the roof is in its shade.
# The gate stays open day and night; nothing about walking changes (the events are walk-through, priority below / above).
#
# The sheet: 3 x 4 frames of 240 x 288 (all three patterns of a row the same):
#   row 0 (direction 2, down)  FRONT - posts, barge boards, roof, finial. Event over the characters, on the wall cell south of the
#                              gap's right column (Map008 (1,52), Map111 (45,19)); the frame's bottom = that cell's bottom.
#   row 1 (direction 4, left)  BACK  - the leaf, the shade on the tower's foot and on the passage. Event under the characters, on
#                              the gap's right column, lower row (Map008 (1,51)).
#   row 2 (direction 6, right) FRONT moved one cell right (for an event on the gap's LEFT column)
#   row 3 (direction 8, up)    BACK moved one cell right (for an event on the gap's left column, lower row - Map111 (44,18), as
#                              (45,18) holds the exit)
# Gate-local coordinates: (0,0) = the top-left corner of the gap's top-left cell, the gap is x 0..96, y 0..96 (screen px).
import os, sys, math, argparse
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
OUT_PATH = os.path.join(ROOT, "img", "characters", "!$West_Gate.png")
FW, FH = 240, 288

# ---- colours (sampled: the town houses' roofs and timber frames, the author's !$Gate_Wood1 door, the towers' stone shade)
OUT = (40, 31, 36)
TIM = {"hi": (138, 110, 86), "lt": (124, 98, 78), "md": (110, 85, 70), "bs": (96, 74, 65), "dk": (84, 64, 57), "dd": (68, 52, 49)}
SHG = {"gap": (42, 36, 52), "dk": (58, 51, 56), "md2": (62, 54, 59), "md": (75, 69, 71), "lt": (84, 77, 79), "hi": (91, 85, 86),
       "tip": (96, 74, 65), "tip2": (110, 85, 70)}
WOOD = [(88, 70, 59), (101, 79, 64), (88, 70, 59), (96, 78, 68), (101, 79, 64), (88, 70, 59)]
W_SEP, W_DK, W_DK2, W_LT, W_LT2 = (57, 44, 47), (76, 62, 55), (72, 56, 53), (109, 88, 72), (118, 97, 76)
IRON_HI, IRON, IRON_D, IRON_O, RIVET = (82, 94, 102), (54, 62, 68), (40, 45, 45), (26, 28, 32), (112, 124, 132)
RING_L, RING_D = (149, 164, 181), (70, 82, 92)

# ---- the shape (gate-local)
POST_W = 10
POST_TOP = -40            # the front posts' tops = the eaves (high enough to show the north leaf through the open gable)
RISE = 36                 # the gable's rise
OVER = 6                  # the roof's overhang left and right
DEPTH = 54                # the roof's slopes seen from above, measured up the screen
L, R, CX = -OVER, 96 + OVER, 48
APEX = POST_TOP - RISE


def h32(*a):
    v = 2166136261
    for ch in repr(a).encode():
        v = ((v ^ ch) * 16777619) & 0xFFFFFFFF
    return v


class Canvas:
    """an RGBA picture addressed in gate-local coordinates"""
    def __init__(self, x0, y0, w, h):
        self.im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        self.px = self.im.load()
        self.x0, self.y0, self.w, self.h = x0, y0, w, h

    def put(self, x, y, c, a=255):
        X, Y = x - self.x0, y - self.y0
        if 0 <= X < self.w and 0 <= Y < self.h:
            self.px[X, Y] = tuple(c[:3]) + (a,)

    def get(self, x, y):
        X, Y = x - self.x0, y - self.y0
        if 0 <= X < self.w and 0 <= Y < self.h:
            return self.px[X, Y]
        return (0, 0, 0, 0)

    def blend(self, x, y, c, a):
        """semi-transparent dark over what is there (or alone)"""
        X, Y = x - self.x0, y - self.y0
        if not (0 <= X < self.w and 0 <= Y < self.h):
            return
        r, g, b, al = self.px[X, Y]
        if al == 0:
            self.px[X, Y] = tuple(c) + (a,)
        else:
            k = a / 255.0
            self.px[X, Y] = (round(r * (1 - k) + c[0] * k), round(g * (1 - k) + c[1] * k), round(b * (1 - k) + c[2] * k), al)


def barge_y(x):
    """the underside of the barge boards at x (gate-local): from the eaves (POST_TOP at L / R) up to the apex at CX"""
    if x <= CX:
        return POST_TOP + (APEX - POST_TOP) * (x - L) / (CX - L)
    return POST_TOP + (APEX - POST_TOP) * (R - x) / (R - CX)


# ------------------------------------------------------------------------------------------------ the front
def draw_roof(cv):
    """the two slopes seen from above: shingle courses parallel to the front edge, the left slope in the light"""
    for x in range(L, R + 1):
        yb = barge_y(x) - 5                     # the slope starts above the barge board
        top = yb - DEPTH
        side = 0 if x < CX else 1
        v = (x - L) if side == 0 else (R - x)  # along a course
        for y in range(int(math.floor(top)), int(math.floor(yb)) + 1):
            u = yb - y                          # up the slope from the front edge
            course = int(u // 8)
            fu = u - course * 8                 # 0 at a course's lower edge
            sw = 9                              # shingle width along x
            k = int(v + (course % 2) * 4 + (h32("o", course, side) % 3)) % sw
            sh = h32("s", side, course, int(v + (course % 2) * 4) // sw) % 5      # this shingle's tone
            if fu < 1:
                c = SHG["gap"]
            elif fu < 2:
                c = SHG["tip2"] if (side == 0 and k not in (0, sw - 1)) else (SHG["tip"] if k not in (0, sw - 1) else SHG["gap"])
            elif k == 0:
                c = SHG["gap"] if fu < 6 else SHG["dk"]
            else:
                if side == 0:
                    base = [SHG["lt"], SHG["hi"], SHG["md"], SHG["lt"], SHG["md"]][sh]
                    c = SHG["hi"] if k == 1 and fu > 3 else (SHG["md"] if k >= sw - 2 else base)
                else:
                    base = [SHG["md2"], SHG["md"], SHG["dk"], SHG["md2"], SHG["md"]][sh]
                    c = SHG["md"] if k == 1 and fu > 3 else (SHG["dk"] if k >= sw - 2 else base)
                if fu >= 7:
                    c = tuple(max(0, ch - 8) for ch in c)   # the shade under the course above
            cv.put(x, y, c)
        cv.put(x, int(math.floor(top)) - 1, OUT)           # the back edge
    # the eaves seen from above (left and right outlines)
    for x in (L, R):
        for y in range(int(barge_y(x) - 5 - DEPTH), int(barge_y(x)) - 3):
            cv.put(x, y, OUT)
    # the ridge: a capping board up the middle
    for y in range(int(APEX - 5 - DEPTH) - 1, int(APEX) - 4):
        for dx in range(-3, 4):
            c = OUT if abs(dx) == 3 else (TIM["hi"] if dx == -2 else (TIM["lt"] if dx < 0 else (TIM["md"] if dx == 0 else TIM["bs"])))
            if (y + 2) % 13 == 0 and abs(dx) < 3:
                c = TIM["dk"]                                  # the board's joints
            cv.put(CX + dx, y, c)


def draw_barge(cv):
    """the barge boards: 6 px, lit on the left, outlined; their ends cut square at the eaves"""
    for x in range(L - 1, R + 2):
        xx = min(max(x, L), R)
        yb = barge_y(xx)
        side = 0 if x < CX else 1
        for t in range(-6, 1):
            y = int(round(yb)) + t
            if t in (-6, 0) or x in (L - 1, R + 1):
                c = OUT
            elif t == -5:
                c = TIM["hi"] if side == 0 else TIM["lt"]
            elif t == -1:
                c = TIM["dk"] if side == 0 else TIM["dd"]
            else:
                c = (TIM["lt"] if side == 0 else TIM["md"]) if (x // 6 + t) % 7 else (TIM["md"] if side == 0 else TIM["bs"])
            cv.put(x, y, c)
    # the apex: a little finial (a dark turned post with a round knob) where the boards meet
    ax, ay = CX, int(round(APEX)) - 6
    for y in range(ay - 9, ay + 2):
        for dx in (-2, -1, 0, 1, 2):
            c = OUT if abs(dx) == 2 else (TIM["md"] if dx < 0 else (TIM["dk"] if dx == 0 else TIM["dd"]))
            cv.put(ax + dx, y, c)
    for (dy, half) in ((-10, 2), (-11, 3), (-12, 3), (-13, 3), (-14, 3), (-15, 2), (-16, 1)):
        for dx in range(-half, half + 1):
            edge = abs(dx) == half or dy == -16
            c = OUT if edge else (TIM["hi"] if (dx < 0 and dy <= -12) else (TIM["lt"] if dx <= 0 else TIM["md"]))
            cv.put(ax + dx, ay + dy, c)


LANTERN_SRC = os.path.join(ROOT, "img", "characters", "!Decoration.png")


def draw_lantern(cv):
    """the lantern of the tower (the author's !Decoration, index 7) hung on a short chain from the ridge, under the gable - its
    light stays the event's <Light> (Map008: 'Latarnia na baszcie'; Map111: the gate's own light event)"""
    src = Image.open(LANTERN_SRC).convert("RGBA").crop((432, 384, 480, 432))
    lan = src.crop((8, 21, 42, 48))                  # the lantern and its glow, without the wooden bracket
    bb = lan.getchannel("A").getbbox()
    # the chain: from the apex's underside down to the lantern's ring
    top = int(round(APEX)) + 1
    ly = top + 7
    for y in range(top, ly + 1):
        cv.put(CX, y, IRON_O if y % 2 else IRON_D)
    X0 = CX - 17                                     # the lantern's middle (x 25 of the source frame) under the chain
    for y in range(lan.height):
        for x in range(lan.width):
            p = lan.getpixel((x, y))
            if p[3]:
                q = cv.get(X0 + x, ly + y)
                if q[3] == 0 or p[3] == 255:
                    cv.put(X0 + x, ly + y, p[:3], p[3] if q[3] == 0 else 255)
                else:
                    k = p[3] / 255.0
                    cv.put(X0 + x, ly + y, tuple(round(q[i] * (1 - k) + p[i] * k) for i in range(3)), q[3])


def draw_posts(cv):
    """the two front posts, oak, from under the barge boards down to the wall top's edge (y 97), iron shoes at their feet,
    a knee brace from each up to the barge board; iron pintles of the (hidden) south leaf on the left one"""
    def timber(x, y, i, w, key):
        if i in (0, w - 1):
            return OUT
        if i == 1:
            return TIM["hi"]
        if i == 2:
            return TIM["lt"]
        if i >= w - 3:
            return TIM["dk"] if i == w - 3 else TIM["dd"]
        r = h32(key, i, y // 7) % 6
        c = TIM["md"] if r else TIM["bs"]
        return TIM["lt"] if h32(key + "g", i, y // 3) % 11 == 0 else c
    for x0 in (0, 96 - POST_W):
        for x in range(x0, x0 + POST_W):
            yt = int(math.floor(barge_y(x)))
            for y in range(yt, 98):
                cv.put(x, y, OUT if y == 97 else timber(x, y, x - x0, POST_W, "p%d" % x0))
            cv.put(x, yt + 1, TIM["dd"] if x not in (x0, x0 + POST_W - 1) else OUT)   # the shade under the board
        # an iron shoe at the foot
        for x in range(x0 - 1, x0 + POST_W + 1):
            for y in range(90, 98):
                if x in (x0 - 1, x0 + POST_W) or y in (90, 97):
                    c = IRON_O
                elif y == 91:
                    c = IRON_HI
                else:
                    c = IRON if (x - x0) % 4 else IRON_D
                cv.put(x, y, c)
            if (x - x0) in (2, POST_W - 3):
                cv.put(x, 93, RIVET)
    # the knee braces: 5 px timbers from the posts' inner sides up to the barge boards
    for side in (0, 1):
        for y in range(-62, -21):
            t = (-22 - y) / 40.0                            # 0 at the post, 1 at the board
            xc = 10 + t * 18 if side == 0 else 85 - t * 18
            xs = int(round(xc))
            if y < barge_y(xs) + 1:
                continue
            for k in range(-2, 3):
                x = xs + k
                if side == 0 and x < POST_W or side == 1 and x > 96 - POST_W - 1:
                    continue
                c = OUT if abs(k) == 2 else (TIM["lt"] if k == -1 else (TIM["md"] if k == 0 else TIM["dk"]))
                cv.put(x, y, c)
    # iron pintles of the south leaf (its hinges) on the left post
    for yy in (34, 70):
        for x in range(POST_W - 2, POST_W + 6):
            cv.put(x, yy, IRON_O)
            cv.put(x, yy + 1, IRON_HI if x < POST_W + 5 else IRON_O)
            cv.put(x, yy + 2, IRON_D)
            cv.put(x, yy + 3, IRON_O)


def front_picture():
    cv = Canvas(-48, -144, FW, FH)
    draw_roof(cv)
    draw_posts(cv)
    draw_barge(cv)
    draw_lantern(cv)
    return cv.im


# ------------------------------------------------------------------------------------------------ the back
def draw_leaf(cv, x0, base, w=46, hgt=104):
    """the north leaf, face-on (its outer face - the planks and the iron - looks south once it is folded back into the town);
    hinge on the left (the gate's outer side), the ring near the free edge, the top edge of the slab seen from above"""
    top = base - hgt
    inner = w - 2
    n = 6
    widths = [inner // n + (1 if i < inner % n else 0) for i in range(n)]
    x = x0 + 1
    for i, pw in enumerate(widths):
        col = WOOD[i % len(WOOD)]
        for dx in range(pw):
            for y in range(top + 1, base):
                if dx == 0:
                    c = W_SEP
                elif dx == 1:
                    c = W_LT if (y // 3 + i) % 5 else W_LT2
                elif dx == pw - 1:
                    c = W_DK2
                else:
                    r = h32("l", i, dx, y // (5 + (dx * 3 + i) % 7)) % 9
                    c = W_DK if r == 0 else (W_LT if r == 1 else ((96, 78, 68) if r == 2 and dx % 2 else col))
                if y >= base - 3:
                    c = tuple(int(ch * 0.8) for ch in c)
                cv.put(x + dx, y, c)
        x += pw
    # the slab's top edge (end grain from above)
    for xx in range(x0, x0 + w):
        cv.put(xx, top - 4, OUT)
        for y in (top - 3, top - 2):
            cv.put(xx, y, (124, 103, 80) if (xx - x0) // 7 % 2 else (118, 97, 76))
        cv.put(xx, top - 1, (138, 114, 88))
        cv.put(xx, top, OUT)
    # iron straps (strap hinges from the hinge side, tapering to a tip, rivets)
    for sy in (base - 18, base - 46, base - 75):
        ln = w - 12
        for t in range(ln):
            xx = x0 + 1 + t
            tip = ln - t
            rows = [IRON_O, IRON_HI, IRON, IRON_D, IRON_O]
            if tip == 1:
                rows = [None, IRON_O, IRON_D, IRON_O, None]
            elif tip == 2:
                rows = [IRON_O, IRON_HI, IRON_D, IRON_O, None]
            for k, c in enumerate(rows):
                if c is not None:
                    cv.put(xx, sy + k, c)
            if t % 6 == 3 and tip > 3:
                cv.put(xx, sy + 2, RIVET)
        for yy in range(sy - 1, sy + 6):
            cv.put(x0, yy, IRON_O)
            cv.put(x0 - 1, yy, IRON_D)
    # the ring
    rx, ry = x0 + w - 9, base - 34
    ring = ["..ooo..", ".o...o.", "o.....o", "o.....o", ".o...o.", "..ooo.."]
    for j, row in enumerate(ring):
        for i, ch in enumerate(row):
            if ch == "o":
                cv.put(rx - 3 + i, ry + j, RING_L if j < 3 else RING_D)
    cv.put(rx, ry - 1, IRON_O)
    # outline
    for xx in range(x0, x0 + w):
        cv.put(xx, base, OUT)
    for y in range(top, base + 1):
        cv.put(x0, y, OUT if cv.get(x0, y)[:3] != IRON_O else IRON_O)
        cv.put(x0 + w - 1, y, OUT)


def back_picture():
    cv = Canvas(-48, -192, FW, FH)
    # the tower's foot seen through the open gable, in the roof's shade (only where the front leaves it to be seen)
    for x in range(POST_W, 96 - POST_W):
        for y in range(int(barge_y(x)) - 2, 1):
            cv.blend(x, y, (14, 18, 28), 90)
    # the passage under the roof: its shade, a little lighter toward the south (the open side)
    for x in range(0, 96):
        for y in range(1, 96):
            a = int(78 - 30 * y / 96)
            cv.blend(x, y, (14, 18, 28), a)
    # the north leaf, its base 2 px on the passage floor; and its own shadow on the tower to its right
    lx, base, w, hgt = 3, 2, 46, 88       # (lower than the gateway: its top shows through the gable)
    for y in range(base - hgt + 3, base):
        for x in range(lx + w, lx + w + 4):
            cv.blend(x, y, (10, 12, 20), 70)
    draw_leaf(cv, lx, base, w, hgt)
    # the leaf's own shade inside the gateway (it stands under the roof): dim it a little
    for x in range(lx - 1, lx + w):
        for y in range(base - hgt - 4, base + 1):
            p = cv.get(x, y)
            if p[3] == 255:
                cv.put(x, y, tuple(int(ch * 0.93) for ch in p[:3]))
    return cv.im


def shifted(im, dx):
    out = Image.new("RGBA", im.size, (0, 0, 0, 0))
    out.alpha_composite(im.crop((0, 0, im.width - dx, im.height)), (dx, 0))
    return out


def build():
    front, back = front_picture(), back_picture()
    rows = [front, back, shifted(front, 48), shifted(back, 48)]
    sheet = Image.new("RGBA", (FW * 3, FH * 4), (0, 0, 0, 0))
    for r, im in enumerate(rows):
        for c in range(3):
            sheet.alpha_composite(im, (c * FW, r * FH))
    return sheet, front, back


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--preview", help="also write the two pictures x3 on grey into this folder")
    ap.add_argument("--out", default=OUT_PATH)
    a = ap.parse_args()
    sheet, front, back = build()
    sheet.save(a.out)
    print("saved", a.out, sheet.size)
    if a.preview:
        os.makedirs(a.preview, exist_ok=True)
        both = Image.new("RGBA", (FW * 2 + 8, FH), (128, 128, 128, 255))
        both.alpha_composite(back, (0, 0))
        both.paste(back.crop((0, 48, FW, FH)), (FW + 8, 0), back.crop((0, 48, FW, FH)))   # (the back's frame ends one cell higher)
        both.alpha_composite(front, (FW + 8, 0))
        both = both.resize((both.width * 3, both.height * 3), Image.NEAREST)
        both.save(os.path.join(a.preview, "west_gate_parts.png"))


if __name__ == "__main__":
    main()
