# Builds the hero's walking sheets WITH THE TORCH IN HAND (img/characters/Hero_TorchWalk / Hero_TorchRun / Hero_TorchSneak, the same
# layout as Hero_Walk / Hero_Run / Hero_Sneak: 8 rows S, SW, W, NW, N, NE, E, SE x cells of 64x64, column 0 = standing) and the table
# of where the torch's head is on every cell (the game draws the living flame there - Torch.js TIPS: [x, y, behind]).
#
#   python tools/torch/build_torch_walk.py [preview.png]   -> the three sheets + tools/torch/tips.json (+ previews)
#
# The hand that holds it: the one nearer the camera - his right facing south, south-east, east, north-east and north, his left facing
# south-west, west and north-west (as sprites always swap hands). Where that hand is on each frame was measured on the sheets
# (measure_hands.py: the skin blobs between the belt and the knees; the walking sheet by tracking, the run and the sneak by eye -
# HANDS below). The torch follows the hand, but steadier than the swinging arm: its head moves only STEADY of the hand's way from
# where it is when he stands (the torch tilts against the swing).
# HELD IN THE HAND (2026-10-08, after the user's "czemu czasem pochodnia jest za ręką?"): the stick is drawn IN FRONT of the body and
# the arm, and the fist is drawn over it as a small grip - the fingers wrapped round the stick (FIST: a few skin pixels across the
# stick, a dark line round them), the butt one pixel out under the fist. Only where the hand itself cannot be seen (hidden behind the
# body - the tracking found no hand there) the whole torch goes behind him, and its flame too (behind = 1 in the table).
# (The first version painted the hand's whole skin blob over the stick and put the torch behind the body on every back view: the stick
# stuck out on both sides of the hand, as if it were behind it.)
import json, math, sys
from PIL import Image
sys.path.insert(0, __file__.replace("\\", "/").rsplit("/", 1)[0])
from measure_hands import GAME, CELL, ROWS, track

OUT_PREVIEW = sys.argv[1] if len(sys.argv) > 1 else None

# the hand on every frame (cell x, y) - the run and the sneak picked by eye from contact_blobs.py (2026-10-08)
RUN_HANDS = {
    "S":  [(21, 36), (22, 36), (22, 34), (22, 35), (22, 36), (22, 28), (23, 28), (23, 30), (22, 37)],
    "SW": [(39, 37), (45, 33), (47, 31), (44, 34), (38, 38), (31, 36), (31, 34), (34, 37), (41, 37)],
    "W":  [(33, 38), (40, 37), (43, 34), (41, 36), (35, 37), (22, 35), (19, 31), (24, 38), (34, 38)],
    "NW": [(24, 38), (30, 38), (34, 37), (33, 38), (26, 39), (18, 32), (19, 30), (20, 35), (25, 39)],
    "N":  [(41, 36), (44, 33), (45, 30), (44, 32), (43, 36), (42, 35), (40, 35), (41, 37), (41, 37)],
    "NE": [(39, 37), (45, 34), (45, 33), (41, 36), (37, 38), (32, 36), (29, 36), (31, 38), (38, 39)],
    "E":  [(29, 38), (38, 37), (40, 35), (36, 36), (29, 37), (22, 33), (19, 32), (21, 34), (29, 38)],
    "SE": [(24, 37), (29, 37), (30, 36), (27, 37), (23, 36), (18, 30), (17, 26), (18, 30), (22, 36)],
}
SNEAK_HANDS = {
    "S":  [(22, 41), (22, 41), (20, 37), (22, 42), (24, 43), (25, 40), (24, 43)],
    "SW": [(29, 48), (29, 48), (29, 45), (30, 46), (30, 46), (30, 48), (29, 48)],
    "W":  [(18, 45), (18, 45), (19, 45), (18, 43), (17, 43), (17, 44), (17, 43)],
    "NW": [(18, 38), (18, 38), (18, 36), (17, 36), (16, 36), (16, 36), (18, 35)],
    "N":  [(42, 44), (42, 44), (44, 43), (41, 42), (39, 46), (38, 43), (40, 44)],
    "NE": [(30, 47), (30, 47), (30, 45), (30, 46), (28, 48), (28, 47), (30, 47)],
    "E":  [(46, 41), (46, 41), (44, 42), (46, 38), (46, 42), (46, 42), (46, 44)],
    "SE": [(16, 46), (16, 46), (14, 45), (17, 49), (18, 45), (18, 43), (18, 45)],
}
# the torch's lean (degrees from upright, + = to the right on the screen) - out to the side, clear of the head and the shoulder (the
# user, 2026-10-08: up on the slant the arm covered it - now it leans out further and is drawn in front); facing west / east it points
# ahead (to light the way). Sneaking, bent low, he holds it out in front.
LEAN = {
    "walk":  {"S": -25, "SW": 28, "W": -55, "NW": -32, "N": 22, "NE": 32, "E": 55, "SE": -28},
    "sneak": {"S": -25, "SW": -68, "W": -50, "NW": -25, "N": 18, "NE": 80, "E": 50, "SE": -25},
}
# running, the arm swings far back and forth: on each frame the lean nearest the row's own (within FREE degrees) that keeps the stick
# off his body and the head off his face (the fewest of the stick's upper pixels over the figure); a little steadied frame to frame
FREE = {"run": 60}
STEADY = 0.5
# the torch along its axis from the hand (px): the butt under the fist, the top of the stick, the rag head, the flame's foot
BUTT, HEAD0, TOP = -2.6, 12.5, 16.0
FLAME_AT = 15.5
# the fist round the stick: along the axis -FIST_U..FIST_U, across up to FIST_W (a little wider than the stick)
FIST_U, FIST_W = 1.7, 1.9
# the colours of the torch PixelLab drew for the hero's torch state (stick: grey-brown wood; head: charred rag with an ember glow)
OUTLINE = (24, 22, 21, 255)
STICK = [(120, 112, 107, 255), (95, 88, 83, 255), (69, 65, 63, 255)]   # light, mid, dark
HEAD = [(151, 100, 76, 255), (116, 80, 59, 255), (82, 56, 42, 255)]
EMBER = [(206, 131, 87, 255), (240, 119, 33, 255)]
# the hero's own skin (Hero_Walk): the light, the middle, the shade, the deep shade; his outline
SKIN = [(249, 212, 182, 255), (239, 181, 145, 255), (209, 150, 118, 255), (193, 122, 88, 255)]
HERO_LINE = (4, 1, 1, 255)


def lean_vec(deg):
    a = math.radians(deg)
    return math.sin(a), -math.cos(a)


def box(gx, gy, ux, uy, pad=4):
    xs = [gx + ux * BUTT, gx + ux * TOP]
    ys = [gy + uy * BUTT, gy + uy * TOP]
    return int(min(xs)) - pad, int(max(xs)) + pad, int(min(ys)) - pad, int(max(ys)) + pad


def axis(x, y, gx, gy, ux, uy):
    vx, vy = x + 0.5 - gx, y + 0.5 - gy
    return vx * ux + vy * uy, vx * -uy + vy * ux   # u along the torch (up), w across it (+ = its right)


def torch_pixels(gx, gy, ux, uy):
    """the torch's pixels {(x, y): colour}, its outline included, for the hand at (gx, gy) and the axis (ux, uy) (unit, pointing up)"""
    x0, x1, y0, y1 = box(gx, gy, ux, uy)
    core = {}
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            u, w = axis(x, y, gx, gy, ux, uy)
            if BUTT <= u <= HEAD0 and -1.05 <= w < 1.05:
                core[(x, y)] = STICK[0] if w < -0.2 else STICK[1] if w < 0.5 else STICK[2]
            elif HEAD0 < u <= TOP and abs(w) <= (2.1 if u < TOP - 0.8 else 1.4):
                if u > TOP - 1.3:
                    core[(x, y)] = EMBER[1] if abs(w) < 0.8 else EMBER[0]
                else:
                    band = int(u * 1.6) % 2
                    core[(x, y)] = HEAD[0] if w < -0.8 else HEAD[2] if band else HEAD[1]
    px = dict(core)
    for (x, y) in core:
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            q = (x + dx, y + dy)
            if q not in core:
                px[q] = OUTLINE
    return px


def fist_pixels(gx, gy, ux, uy):
    """the fingers round the stick: skin across it (lit from the upper left), the hero's dark line round them"""
    x0, x1, y0, y1 = box(gx, gy, ux, uy)
    core = {}
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            u, w = axis(x, y, gx, gy, ux, uy)
            if abs(u) <= FIST_U and abs(w) <= FIST_W:
                # the top row of the fingers lit, the knuckle line in between, the lower part in the shade; the left side lighter
                k = 0 if u > 0.75 else 1 if u > -0.35 else 2
                if w > 0.9:
                    k = min(3, k + 1)
                core[(x, y)] = SKIN[k]
    px = dict(core)
    for (x, y) in core:
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            q = (x + dx, y + dy)
            if q not in core:
                px[q] = HERO_LINE
    return px


def put(img, pixels):
    p = img.load()
    for (x, y), col in pixels.items():
        if 0 <= x < CELL and 0 <= y < CELL:
            p[x, y] = col


def overlap(cell, gx, gy, ux, uy):
    """how much of the torch's upper part (above the fist) lies over the figure, and half as much for the flame over him (the box
    the game's flame fills over the head: no "hair on fire")"""
    a = cell.load()
    n = 0
    for (x, y) in torch_pixels(gx, gy, ux, uy):
        if 0 <= x < CELL and 0 <= y < CELL and a[x, y][3] > 0 and axis(x, y, gx, gy, ux, uy)[0] > 3:
            n += 1
    fx, fy = gx + ux * FLAME_AT, gy + uy * FLAME_AT
    for y in range(int(fy) - 11, int(fy) + 1):
        for x in range(int(fx) - 3, int(fx) + 4):
            if 0 <= x < CELL and 0 <= y < CELL and a[x, y][3] > 0:
                n += 0.5
    return n


def free_lean(cell, gx, gy, base, prev, free):
    best = None
    for d in range(-free, free + 1, 5):
        ang = max(-80, min(80, base + d))
        ux, uy = lean_vec(ang)
        cost = overlap(cell, gx, gy, ux, uy) + 0.08 * abs(ang - base) + 0.06 * abs(ang - prev)
        if best is None or cost < best[0]:
            best = (cost, ang)
    return best[1]


def build(src, dst, hands, lean, hidden, free=0):
    im = Image.open(GAME + "img/characters/%s.png" % src).convert("RGBA")
    cols = im.width // CELL
    out = Image.new("RGBA", im.size, (0, 0, 0, 0))
    tips = []
    for r in range(8):
        row = ROWS[r]
        H = hands[row]
        rest = H[0]
        bx, by = lean_vec(lean[row])
        rest_tip = (rest[0] + bx * FLAME_AT, rest[1] + by * FLAME_AT)
        row_tips = []
        prev = lean[row]
        for c in range(cols):
            gx, gy = H[min(c, len(H) - 1)]
            gx += 0.5
            gy += 0.5
            # the head goes only STEADY of the hand's way: the torch tilts against the swing of the arm
            tx = rest_tip[0] + 0.5 + STEADY * (gx - 0.5 - rest[0])
            ty = rest_tip[1] + 0.5 + STEADY * (gy - 0.5 - rest[1])
            vx, vy = tx - gx, ty - gy
            n = math.hypot(vx, vy) or 1
            ux, uy = vx / n, vy / n
            cell = im.crop((c * CELL, r * CELL, (c + 1) * CELL, (r + 1) * CELL))
            if free:   # (running: the lean that keeps the torch off his body)
                prev = free_lean(cell, gx, gy, lean[row], prev, free)
                ux, uy = lean_vec(prev)
            torch = Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0))
            put(torch, torch_pixels(gx, gy, ux, uy))
            behind = (r, c) in hidden
            if behind:   # the hand hidden behind the body: the torch too
                frame = torch.copy()
                frame.alpha_composite(cell)
            else:        # in his hand on our side: the stick over him, the fingers over the stick
                frame = cell.copy()
                frame.alpha_composite(torch)
                put(frame, fist_pixels(gx, gy, ux, uy))
            out.alpha_composite(frame, (c * CELL, r * CELL))
            fx, fy = gx + ux * FLAME_AT, gy + uy * FLAME_AT
            row_tips.append([round(fx, 1), round(fy, 1), 1 if behind else 0])
        tips.append(row_tips)
    out.save(GAME + "img/characters/%s.png" % dst)
    return out, tips


def main():
    walk_src = Image.open(GAME + "img/characters/Hero_Walk.png").convert("RGBA")
    walk_hands, walk_hidden = {}, set()
    for r in range(8):
        tr = track(walk_src, r)
        walk_hands[ROWS[r]] = [(round(x), round(y)) for (x, y, n) in tr]
        for c, (x, y, n) in enumerate(tr):
            if n == 0:   # (no skin blob of the hand there: it is behind his body)
                walk_hidden.add((r, c))
    res = {}
    sheets = [("Hero_Walk", "Hero_TorchWalk", walk_hands, "walk", walk_hidden, 0),
              ("Hero_Run", "Hero_TorchRun", RUN_HANDS, "walk", set(), FREE["run"]),
              ("Hero_Sneak", "Hero_TorchSneak", SNEAK_HANDS, "sneak", set(), 0)]
    for src, dst, hands, kind, hidden, free in sheets:
        im, tips = build(src, dst, hands, LEAN[kind], hidden, free)
        res[dst] = {"tips": tips, "hands": [[list(h) for h in hands[ROWS[r]]] for r in range(8)], "hidden": sorted(list(hidden))}
        print(dst, "hidden hand (torch behind him):", sorted(hidden))
    with open(GAME + "tools/torch/tips.json", "w", encoding="utf8") as f:
        json.dump(res, f)
    print("ok", list(res))


if __name__ == "__main__":
    main()
