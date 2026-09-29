# Builds the pictures of HomeLife.js (life in grandpa's house) from the PixelLab frames in tools/homelife/src and the game's own
# sheets. Run from anywhere:  python tools/homelife/build_art.py
#
# Writes (img/characters/)
#   $Animal_Cat.png          the cat, MZ single sheet 3 x 4 cells of 68 (rows down, left, right, up; step, standing, step)
#   anim8/Cat_Walk8.png      the cat's 8-way walk (Hunting.js LOOK8 layout: rows S SW W NW N NE E SE, col 0 standing + 8 frames)
#   !$Animal_Cat_Sleep.png   lying down and asleep: 3 x 4 cells of 68, frames 0-8 = sitting -> curled asleep, 9-11 breathing
#   Npc_Dziadek_Home.png     grandpa's home poses, cells of 64 (the $Npc_Dziadek scale, feet on the same row):
#                              row 0: sitting down (0 standing .. 4 seated), row 1: seated (0 plain, 1 pipe, 2 pipe glowing,
#                              3 breathing out), row 2: stirring the soup, facing north-west (8 frames)
#   !$House_Wheel.png        the spinning wheel of !House_Props (index 2, pattern 0) turning: 12 cells of 96 (one spoke turn)
#   !$House_Churn.png        the butter churn (index 2, pattern 1) with its plunger up and down: 12 cells of 96
#   Home_Sleeper.png         grandpa asleep in his bed, in the quilt's own cell (144, !$House_Quilt): his head on the left pillow,
#                              the shape of him under the quilt; 3 cells: asleep (breathing in / out), awake
# and previews in docs/dom_dziadka/zycie_arkusze.png
#
# Sources (tools/homelife/src): cat_rot/*.png, cat_walk/<dir>_<i>.png, cat_curl/frame_00i.png - PixelLab character "Mruczek"
# (ce0bf22a-76b9-4741-96bf-ed0c8b106221: standard quadruped cat, 8 directions, walk-8-frames, v3 "curl_sleep" south);
# gp_sit/frame_00i.png - grandpa Stach (ea649747-...) v3 "sit_down" south (only its crouch is used: frames 0-4).
import math, os
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
GAME = os.path.normpath(os.path.join(HERE, "..", ".."))
SRC = os.path.join(HERE, "src")
CH = os.path.join(GAME, "img", "characters")
DOCS = os.path.join(GAME, "docs", "dom_dziadka")
DIRS = ["south", "south-west", "west", "north-west", "north", "north-east", "east", "south-east"]
OUTLINE = (24, 16, 12, 255)


def load(*p):
    return Image.open(os.path.join(*p)).convert("RGBA")


def clean(im):
    """Alpha to 0/255 (PixelLab leaves a few half-transparent edge pixels)."""
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if 0 < a < 128:
                px[x, y] = (0, 0, 0, 0)
            elif 128 <= a < 255:
                px[x, y] = (r, g, b, 255)
    return im


def mirror(im):
    return im.transpose(Image.FLIP_LEFT_RIGHT)


def save(im, *p):
    path = os.path.join(*p)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    im.save(path)
    print("wrote", os.path.relpath(path, GAME), im.size)


# ----------------------------------------------------------------------------------------------------------------------
# The cat
# ----------------------------------------------------------------------------------------------------------------------
C = 68


def cat_rot(d):
    return clean(load(SRC, "cat_rot", d + ".png"))


def cat_walk(d, i):
    return clean(load(SRC, "cat_walk", "%s_%d.png" % (d, i)))


def cat_sheets():
    # PixelLab's walk: south and north stay seated and the south-west one shrank - those rows borrow the 3/4 walks:
    # S walks as SE, N as NE, SW is the mirror of SE (the standing rotations of S and N - sitting - stay: a cat at rest sits)
    walk = {}
    for d in DIRS:
        walk[d] = [cat_walk(d, i) for i in range(8)]
    walk["south-west"] = [mirror(f) for f in walk["south-east"]]
    walk["south"] = walk["south-east"]
    walk["north"] = walk["north-east"]
    rot = {d: cat_rot(d) for d in DIRS}
    rot["south-west"] = mirror(rot["south-east"])
    # feet: every row stands on the lowest pixel row of the south sitting cat (so standing, walking and sitting line up)
    base = rot["south"].getbbox()[3]
    sheet8 = Image.new("RGBA", (9 * C, 8 * C))
    for r, d in enumerate(DIRS):
        frames = [rot[d]] + walk[d]
        low = max(f.getbbox()[3] for f in frames)
        dy = base - low
        for c, f in enumerate(frames):
            sheet8.alpha_composite(f, (c * C, r * C + dy))
    save(sheet8, CH, "anim8", "Cat_Walk8.png")
    # the MZ sheet (4 directions): the standing column is the rotation, the steps two opposite walk frames
    mz = Image.new("RGBA", (3 * C, 4 * C))
    for r, d in enumerate(["south", "west", "east", "north"]):
        row = DIRS.index(d)
        for c, col in enumerate([3, 0, 7]):   # (sheet8: col 0 standing, walk frame i at col i + 1)
            mz.alpha_composite(sheet8.crop((col * C, row * C, col * C + C, row * C + C)), (c * C, r * C))
    save(mz, CH, "$Animal_Cat.png")
    # asleep: the v3 "curl up" frames 0-8 (sitting -> lying, head on the paws, eyes shut), then three breaths (frames 6-8 with the
    # back one pixel up / down)
    curl = [clean(load(SRC, "cat_curl", "frame_%03d.png" % i)) for i in range(9)]
    low = curl[0].getbbox()[3]
    curl = [shift_to(f, low) for f in curl]
    breath = []
    for k, src in enumerate([curl[8], curl[7], curl[8]]):
        breath.append(breathe(src, [0, -1, 0][k]))
    frames = curl + breath
    sl = Image.new("RGBA", (3 * C, 4 * C))
    for i, f in enumerate(frames):
        sl.alpha_composite(f, ((i % 3) * C, (i // 3) * C))
    save(sl, CH, "!$Animal_Cat_Sleep.png")
    return sheet8, mz, sl


def shift_to(im, low):
    bb = im.getbbox()
    out = Image.new("RGBA", im.size)
    out.alpha_composite(im, (0, low - bb[3]))
    return out


def breathe(im, dy):
    """The upper half of the lying cat one pixel up (a breath in); the feet stay."""
    if not dy:
        return im.copy()
    bb = im.getbbox()
    mid = (bb[1] + bb[3]) // 2
    out = im.copy()
    top = im.crop((0, 0, im.width, mid))
    ImageDraw.Draw(out).rectangle((0, 0, im.width, mid - 1), fill=(0, 0, 0, 0))
    out.alpha_composite(top, (0, dy))
    # (the row left behind under the lifted back: copied from the row below, so no hole opens)
    px, src = out.load(), im.load()
    for x in range(im.width):
        if px[x, mid - 1][3] == 0 and src[x, mid][3]:
            px[x, mid - 1] = src[x, mid]
    return out


# ----------------------------------------------------------------------------------------------------------------------
# Grandpa
# ----------------------------------------------------------------------------------------------------------------------
G = 64
WALK8 = load(CH, "Npc_Dziadek_Walk8.png")


def walk8(row, col=0):
    return WALK8.crop((col * G, row * G, col * G + G, row * G + G))


def sit_frame(i):
    """PixelLab's 84 px canvas -> the 64 cell, feet on row 61 like the standing south frame."""
    im = clean(load(SRC, "gp_sit", "frame_%03d.png" % i))
    bb = im.getbbox()
    stand = walk8(0).getbbox()
    out = Image.new("RGBA", (G, G))
    cx = (bb[0] + bb[2]) // 2
    scx = (stand[0] + stand[2]) // 2
    out.alpha_composite(im, (scx - cx, stand[3] - bb[3]))
    return out


PIPE_WOOD = (122, 78, 44, 255)
PIPE_DARK = (58, 36, 22, 255)
PIPE_RIM = (160, 108, 62, 255)


PIPE = [   # from the right corner of his mouth (0, 0) = row 1, col 0: a short stem, the bowl standing up at its end (R: the ember)
    "...DDDD",
    "WWWDRRD",
    "DDDDWWD",
    "...DWWD",
    "....DD.",
]


def with_pipe(im, glow):
    """His pipe: a short stem from the corner of his mouth, the bowl at its end with the ember on top."""
    out = im.copy()
    px = out.load()
    mx, my = PIPE_MOUTH
    cols = {"D": PIPE_DARK, "W": PIPE_WOOD, "R": PIPE_RIM}
    for j, row in enumerate(PIPE):
        for i, ch in enumerate(row):
            if ch in cols:
                px[mx + i, my - 1 + j] = cols[ch]
    ember = [(255, 186, 72, 255), (255, 128, 40, 255)] if glow else [(200, 96, 44, 255), (150, 70, 36, 255)]
    px[mx + 4, my], px[mx + 5, my] = ember
    return out


def seated_breath(im):
    """Breathing out: the shoulders and the head one pixel down (the lap and the feet stay)."""
    bb = im.getbbox()
    cut = bb[1] + 30
    out = im.copy()
    top = im.crop((0, 0, G, cut))
    ImageDraw.Draw(out).rectangle((0, 0, G, cut - 1), fill=(0, 0, 0, 0))
    out.alpha_composite(top, (0, 1))
    return out


def stir_frames():
    """Facing north-west at the hearth, a wooden spoon in both hands (hidden in front of him), stirring: his hands go round a small
    circle, the spoon's far end dips into the pot beyond the sprite's corner, his back leans with it."""
    base = walk8(3)
    frames = []
    for k in range(8):
        a = k / 8 * math.tau
        hx, hy = 21 + round(2.0 * math.cos(a)), 35 + round(1.4 * math.sin(a))   # his hands (the spoon's near end)
        fx, fy = 11 + round(1.5 * math.cos(a + math.pi)), 20 + round(1.0 * math.sin(a + math.pi))   # the spoon's bowl, towards the kettle
        lean = 1 if math.cos(a) > 0.35 else (-1 if math.cos(a) < -0.35 else 0)
        f = Image.new("RGBA", (G, G))
        # the back leans: rows above the belt move with the hands
        body = base.copy()
        upper = body.crop((0, 0, G, 36))
        lower = body.crop((0, 36, G, G))
        f.alpha_composite(lower, (0, 36))
        f.alpha_composite(upper, (lean, 0))
        d = ImageDraw.Draw(f)
        # the spoon: a 2 px wooden handle with a dark outline, drawn from the far end to the hands, its bowl at the far end
        spoon_line(d, fx, fy, hx, hy)
        d.ellipse((fx - 3, fy - 3, fx + 2, fy + 2), fill=OUTLINE)
        d.ellipse((fx - 2, fy - 2, fx + 1, fy + 1), fill=(186, 134, 82, 255))
        d.point((fx - 1, fy - 1), fill=(222, 178, 120, 255))
        # his left hand on the handle (the right one is hidden by his body)
        d.rectangle((hx - 1, hy - 1, hx + 1, hy + 1), fill=OUTLINE)
        d.rectangle((hx - 1, hy - 1, hx, hy), fill=(228, 170, 128, 255))
        frames.append(f)
    return frames


def spoon_line(d, x0, y0, x1, y1):
    n = max(abs(x1 - x0), abs(y1 - y0))
    pts = [(round(x0 + (x1 - x0) * t / n), round(y0 + (y1 - y0) * t / n)) for t in range(n + 1)]
    for x, y in pts:
        d.rectangle((x - 1, y - 1, x + 1, y + 1), fill=OUTLINE)
    for x, y in pts:
        d.point((x, y), fill=(168, 118, 70, 255))
        d.point((x, y - 1), fill=(196, 146, 92, 255))


def grandpa_sheet():
    global PIPE_MOUTH
    sit = [sit_frame(i) for i in range(5)]
    seated = sit[4]
    PIPE_MOUTH = (33, 25)   # (measured on the seated frame: the right end of the dark mouth line under the moustache)
    row1 = [seated, with_pipe(seated, False), with_pipe(seated, True), seated_breath(with_pipe(seated, False))]
    stir = stir_frames()
    sheet = Image.new("RGBA", (8 * G, 3 * G))
    for c, f in enumerate(sit):
        sheet.alpha_composite(f, (c * G, 0))
    for c, f in enumerate(row1):
        sheet.alpha_composite(f, (c * G, G))
    for c, f in enumerate(stir):
        sheet.alpha_composite(f, (c * G, 2 * G))
    save(sheet, CH, "Npc_Dziadek_Home.png")
    print("pipe mouth", PIPE_MOUTH, "bowl top", (PIPE_MOUTH[0] + 4.5, PIPE_MOUTH[1] - 1))
    return sheet


# ----------------------------------------------------------------------------------------------------------------------
# The props: the spinning wheel turning, the churn's plunger
# ----------------------------------------------------------------------------------------------------------------------
P = 96
PROPS = load(CH, "!House_Props.png")


def prop(index, pattern):
    col = (index % 4) * 3 + pattern
    row = (index // 4) * 4
    return PROPS.crop((col * P, row * P, col * P + P, row * P + P))


WHEEL_HUB = (53.5, 58.5)
WHEEL_IN = 13.2   # inside the rim


def wheel_frames(n=12):
    src = prop(2, 0)
    sp = src.load()
    out = []
    for k in range(n):
        a = k / n * (math.pi / 4)   # 8 spokes: one eighth of a turn loops
        im = src.copy()
        px = im.load()
        cx, cy = WHEEL_HUB
        for y in range(P):
            for x in range(P):
                dx, dy = x + 0.5 - cx, y + 0.5 - cy
                if dx * dx + dy * dy > WHEEL_IN * WHEEL_IN:
                    continue
                # where this pixel was before the turn (nearest neighbour: the pixels stay whole)
                sx = cx + dx * math.cos(-a) - dy * math.sin(-a)
                sy = cy + dx * math.sin(-a) + dy * math.cos(-a)
                ix, iy = int(math.floor(sx)), int(math.floor(sy))
                ddx, ddy = ix + 0.5 - cx, iy + 0.5 - cy
                px[x, y] = sp[ix, iy] if ddx * ddx + ddy * ddy <= WHEEL_IN * WHEEL_IN else sp[x, y]
        out.append(im)
    return out


def churn_frames(n=12):
    src = prop(2, 1)
    out = []
    lifts = [round(3.5 - 3.5 * math.cos(k / n * math.tau)) for k in range(n)]   # 0 .. 7 px and back
    x0, x1, top, lid = 42, 53, 39, 58   # the plunger's stick with its shadow; it goes into the lid at row 58
    for L in lifts:
        im = src.copy()
        stick = src.crop((x0, top, x1, lid))
        d = ImageDraw.Draw(im)
        # clear the stick above the lid, then draw it L px higher, the gap under it filled with the stick's middle row
        px = im.load()
        for y in range(top, lid):
            for x in range(x0, x1):
                px[x, y] = (0, 0, 0, 0)
        im.alpha_composite(stick, (x0, top - L))
        mid = src.crop((x0, 50, x1, 51))
        for y in range(lid - L, lid):
            im.alpha_composite(mid, (x0, y))
        # the lid in front of the stick again (the rows of the lid are taken from the source)
        im.alpha_composite(src.crop((x0, lid, x1, lid + 3)), (x0, lid))
        out.append(im)
    return out


def prop_sheet(frames, name):
    sheet = Image.new("RGBA", (3 * P, 4 * P))
    for i, f in enumerate(frames[:12]):
        sheet.alpha_composite(f, ((i % 3) * P, (i // 3) * P))
    save(sheet, CH, name)
    return sheet


# ----------------------------------------------------------------------------------------------------------------------
# Grandpa asleep: drawn over the quilt (!$House_Quilt at the quilt event's place: its 144 cell, the bed below it)
# ----------------------------------------------------------------------------------------------------------------------
Q = 144
QUILT_TOP = 60        # the quilt's first row in its cell (the bed's pillows are above it)
HEAD_X = 24           # the middle of the left pillow
HEAD_CHIN = 60        # the head ends where the quilt begins


def head(im, rows):
    """The head of a south-facing grandpa frame: the cap to `rows` px below its top."""
    bb = im.getbbox()
    return im.crop((0, bb[1], G, bb[1] + rows)), (bb[0] + bb[2]) // 2


def sleeper_frames():
    asleep_src = sit_frame(4)   # (the crouch has the eyes shut: two short lines)
    awake_src = walk8(0)
    out = []
    for k, (src, breath) in enumerate([(asleep_src, 0), (asleep_src, 1), (awake_src, 0)]):
        f = Image.new("RGBA", (Q, Q))
        hd, hcx = head(src, 26)
        f.alpha_composite(hd, (HEAD_X - hcx, HEAD_CHIN - hd.height))
        # nothing of him below the quilt's edge
        d = ImageDraw.Draw(f)
        d.rectangle((0, QUILT_TOP, Q, Q), fill=(0, 0, 0, 0))
        # the shape of him under the quilt: a soft darker line along his right side and his feet, a lighter one along his left
        body(f, breath)
        out.append(f)
    return out


def body(f, breath):
    """The shape of him under the quilt: the raised quilt a touch lighter, a soft shadow along his right side and past his feet,
    a fold where his hands rest on his chest. Breathing in, the chest part rises one pixel."""
    px = f.load()
    top, bottom = QUILT_TOP + 1, 116
    cx = HEAD_X + 0.5
    for y in range(top, bottom + 1):
        t = (y - top) / (bottom - top)
        half = 11.0 - 4.5 * t
        if breath and y < top + 14:
            half += 0.7
        l, r = round(cx - half), round(cx + half)
        for x in range(l, r + 1):
            px[x, y] = blend(px[x, y], (255, 246, 226, 16))
        px[r + 1, y] = blend(px[r + 1, y], (18, 10, 8, 96))
        px[r + 2, y] = blend(px[r + 2, y], (18, 10, 8, 38))
        px[l - 1, y] = blend(px[l - 1, y], (255, 246, 226, 46))
    for x in range(round(cx - 6), round(cx + 8)):   # past the feet
        px[x, bottom + 1] = blend(px[x, bottom + 1], (18, 10, 8, 70))
        px[x, bottom + 2] = blend(px[x, bottom + 2], (18, 10, 8, 30))
    y = QUILT_TOP + 10 - (1 if breath else 0)   # the fold over his folded hands
    for x in range(round(cx - 8), round(cx + 9)):
        px[x, y] = blend(px[x, y], (18, 10, 8, 50))
        px[x, y - 1] = blend(px[x, y - 1], (255, 246, 226, 26))


def blend(dst, src):
    if dst[3] == 0:
        return src
    a = src[3] / 255
    return tuple(round(dst[i] * (1 - a) + src[i] * a) for i in range(3)) + (max(dst[3], src[3]),)


def sleeper_sheet():
    frames = sleeper_frames()
    sheet = Image.new("RGBA", (3 * Q, Q))
    for i, f in enumerate(frames):
        sheet.alpha_composite(f, (i * Q, 0))
    save(sheet, CH, "Home_Sleeper.png")
    return frames


# ----------------------------------------------------------------------------------------------------------------------
# Previews
# ----------------------------------------------------------------------------------------------------------------------
def on_floor(im, scale):
    bg = Image.new("RGBA", im.size, (116, 86, 60, 255))
    bg.alpha_composite(im)
    return bg.resize((im.width * scale, im.height * scale), Image.NEAREST)


def previews(cat8, catsleep, gp, wheel, churn, sleeper):
    parts = [on_floor(cat8, 2), on_floor(catsleep, 2), on_floor(gp, 2), on_floor(wheel, 1), on_floor(churn, 1)]
    # the seated grandpa in his chair with the wheel in front, and asleep in bed
    chair = prop(2, 2)
    scene = Image.new("RGBA", (P * 2, P + 48), (116, 86, 60, 255))
    scene.alpha_composite(chair, (0, 0))
    g = gp.crop((1 * G, G, 2 * G, 2 * G))
    scene.alpha_composite(g, (P // 2 - G // 2, P - G + SEAT_DY))
    scene.alpha_composite(prop(2, 0), (0, 48))
    parts.append(scene.resize((scene.width * 3, scene.height * 3), Image.NEAREST))
    W = max(p.width for p in parts)
    H = sum(p.height + 12 for p in parts)
    out = Image.new("RGBA", (W, H), (40, 40, 44, 255))
    y = 0
    for p in parts:
        out.alpha_composite(p, (0, y))
        y += p.height + 12
    save(out, DOCS, "zycie_arkusze.png")


SEAT_DY = 2   # (preview only: grandpa's cell bottom this far below the chair's - HomeLife.js SEAT.dy puts him there in the game)

if __name__ == "__main__":
    cat8, mz, catsleep = cat_sheets()
    gp = grandpa_sheet()
    wheel = prop_sheet(wheel_frames(), "!$House_Wheel.png")
    churn = prop_sheet(churn_frames(), "!$House_Churn.png")
    sleeper = sleeper_sheet()
    previews(cat8, catsleep, gp, wheel, churn, sleeper)
